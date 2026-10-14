#!/usr/bin/env node
/**
 * Genera la checklist de prueba manual en Game.exe a partir de los datos
 * compilados del proyecto: rutas críticas (hub de Oak, torre, Isla Espejo,
 * misión Hypno, Horizontes), las 40 anclas Tier 1 y un muestreo de Tier 2/3.
 *
 * Uso: node tools/generate_manual_qa_checklist.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const approved = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json"), "utf8")).blueprints;
const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const tier3 = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier3_rules.json"), "utf8")).entries;
const tier2Files = fs.readdirSync(path.join(ROOT, "content")).filter((file) => /^atlas_tier2_blueprints_macro0[67]\.json$/.test(file));
const tier2Recent = tier2Files.flatMap((file) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", file), "utf8")).blueprints);

const sectorOf = (mapId) => hierarchy.maps.find((entry) => entry.mapId === mapId)?.sector ?? 0;
const sectorNameOf = (mapId) => hierarchy.maps.find((entry) => entry.mapId === mapId)?.sectorName ?? "";
const families = [...new Set(tier3.map((entry) => entry.family))];
const sampleEcos = families.map((family) => tier3.find((entry) => entry.family === family));

const md = [
  "# Checklist de prueba manual en Game.exe",
  "",
  "> Generada por `tools/generate_manual_qa_checklist.mjs`. Ningún linter sustituye esta pasada: ritmo, clipping, Mochila y sensación de juego solo se validan jugando. El entorno de desarrollo no dispone de Wine.",
  "",
  "## A. Ruta crítica del postgame y la Mochila (12 comprobaciones)",
  "",
  "- [ ] A1. Partida con el evento de Mew terminado: Oak dispara el switch `429 = Postgame` al volver a casa y el Pokédex de entrenador queda habilitado.",
  "- [ ] A2. Laboratorio de Oak (mapa 48) → sótano: los dos transportadores originales funcionan (holders → mapa 772+, torre → 141).",
  "- [ ] A3. El laboratorio de Oak **no** tiene cápsula nueva: solo los dos transportadores originales (holders y torre) funcionan como siempre.",
  "- [ ] A4. Oak («Registro de Grietas») lee las purgas (\\v[264] de 8), menciona la Mochila libre y señala hacia el mundo sin teletransportar a nadie.",
  "- [ ] A5. Torre (141 SECRET PEAK): usar un objeto en combate con el switch 674 activo (debe funcionar).",
  "- [ ] A6. Salón Grandeur (151): abrir la Mochila y usar objetos en combates de las etapas Rookie/Veteran/Ace/Mayhem.",
  "- [ ] A7. Escenario (214): la Mochila funciona en batalla; fuera de combate el switch 675 sigue ocultando la Mochila (reto original intacto).",
  "- [ ] A8. Veterano/Ace/Mayhem conservan la mochila de stock fijo que entrega el club y `returnBag` la devuelve al salir.",
  "- [ ] A9. Con una señal sin calibrar (Atlas sin haber hablado con el Cronista), el **capitán de Ciudad Carmín** explica qué falta y no zarpa.",
  "- [ ] A10. Isla Espejo (997-999): entrada desde Pueblo Paleta y por el **espejo del sótano de la Mansión Pokémon**; ferry y espejo de vuelta libres; un Pokégod con Mochila usable y `canLose`.",
  "- [ ] A11. Misión Hypno (Ciudad Verde → 1000): rescate, Hypno capturable/derrotable y, al hablar con el guardabosques, apertura de Horizontes (1001).",
  "- [ ] A12. Puerto Horizonte → Cronista de Atlas Mil: abre Atlas (1021) y las 40 puertas sectoriales funcionan con retorno libre.",
  "",
  "## B. Las 40 anclas Tier 1 (40 comprobaciones)",
  "",
  "Para cada ancla: entrar por su sector, conversar con los 3–5 NPCs (revisar que las voces no se repiten), jugar la escena y la decisión, enfrentar al jefe con Mochila disponible, perder sin bloqueo, ganar, recibir la recompensa una sola vez, comprobar curación y retorno libre a Puerto Horizonte.",
  "",
  "| # | Mapa | Sector | Episodio | Jefe (equipo) | Decisión | Recompensa | Hecho |",
  "|---:|---:|---|---|---|---|---|---|",
];

approved.forEach((blueprint, index) => {
  const team = blueprint.battle.team.map((pokemon) => `${pokemon.species} Nv${pokemon.level}`).join(", ");
  md.push(`| ${index + 1} | ${blueprint.mapId} | ${sectorOf(blueprint.mapId)} · ${sectorNameOf(blueprint.mapId)} | ${blueprint.title} | ${blueprint.battle.trainerName} (${team}) | ${blueprint.cutscene.decision.question} | ${blueprint.reward.item} | [ ] |`);
});
md.push(
  "- [ ] B-final. La convergencia (mapa 1996) exige 39 sellos previos; verificar que se anuncia como requisito y que el retorno permanece abierto si faltan sellos.",
  "",
  "## C. Tier 2: muestreo de las rutas recientes (10 comprobaciones)",
  "",
  "Cada ruta: dos NPCs con estados antes/después, objetivo y mecánica claros, decisión persistente que cambia el diálogo posterior, recompensa entregada una sola vez (con la Mochila llena debe poder reintentarse) y retorno a Puerto Horizonte intacto.",
  "",
  "| # | Mapa | Ruta | Mecánica | Recompensa | Hecho |",
  "|---:|---:|---|---|---|---|",
);
tier2Recent.slice(0, 10).forEach((blueprint, index) => {
  md.push(`| ${index + 1} | ${blueprint.mapId} | ${blueprint.title} | ${blueprint.mechanic.name} | ${blueprint.reward.item} | [ ] |`);
});
md.push(
  "",
  "## D. Tier 3: una regla por familia de anomalía (14 comprobaciones)",
  "",
  "Cada regla: identificación del eco legible, las tres reglas de contrajuego se entienden, la microdecisión resuelve con self-switch (reversible, sin flags globales) y la baliza/navegación/retorno siguen operativas.",
  "",
  "| # | Mapa | Eco | Familia | Variante | Hecho |",
  "|---:|---:|---:|---|---|---|",
);
sampleEcos.forEach((entry, index) => {
  md.push(`| ${index + 1} | ${entry.mapId} | ${String(entry.echoId).padStart(4, "0")} | ${entry.family} | ${entry.variant} | [ ] |`);
});
const multiverse = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
const multiverseRows = [...multiverse.bosses, multiverse.champion].map((boss, index) =>
  `| ${index + 1} | ${boss.label} | ${boss.name} | ${boss.homage ?? "el campeón que aguarda en la cumbre"} | [ ] |`);
md.push(
  "",
  "## E. Monte Silver — Emisiones Prohibidas y zonas salvajes (12 comprobaciones)",
  "",
  "| # | Zona | Jefe | Esencia del homenaje | Hecho |",
  "|---:|---|---|---|---|",
  ...multiverseRows,
  "",
  "- [ ] E9. El Archivero Prohibido de la falda explica las emisiones y menciona los reintentos.",
  "- [ ] E10. El **punto de colapso** de la Torre Pokémon 1F (con 7 purgas) lleva a la falda del Monte Silver, y el regreso al mundo es libre.",
  "- [ ] E11. Caminar por la falda/cumbre del Monte Silver y las emisiones: aparecen encuentros salvajes temáticos (Larvitar, fantasmas, datos…) y se pueden capturar.",
  "- [ ] E12. En El Eco que Jugó Contigo, surfear da encuentros de agua; en el Bosque Susurrante, la hierba da los suyos.",
  "",
  "## F. Regresión general (5 comprobaciones)",
  "",
  "- [ ] F1. Ninguna batalla interna del juego perdió la Mochila (probar al menos un gimnasio, la Liga y un combate del Grandeur Club).",
  "- [ ] F2. `Save*.rxdata` intactas: guardar/cargar antes y después de recorrer la expansión.",
  "- [ ] F3. Kirin/Android: recorrer la ruta crítica en el dispositivo y confirmar que los mapas nuevos aparecen con nombre.",
  "- [ ] F4. Los textos de los mapas nuevos se ven completos (sin cortes de línea raros) a resolución de la pantalla del dispositivo.",
  "- [ ] F5. Ninguna puerta de salida quedó bloqueada por los NPCs nuevos (laboratorio de Oak, muelle de Atlas Mil, grietas, sótano del espejo).",
  "- [ ] F6. Derrotar a un jefe de Atlas/Isla Espejo/Horizontes, salir y volver: sigue derrotado (página de registro, sin volver a atacar).",
  "- [ ] F7. Perder a propósito contra otro jefe y confirmar que se puede reintentar con la Mochila disponible.",
  "- [ ] F8. Tras derrotar a un jefe de Isla Espejo, hablar con él: ofrece revancha amistosa por menú (elegir «Later» no desata ningún combate).",
  "",
  "## G. Expansión Multiversal: grietas, Liga Oscura, Atlas Mil y espejo (10 comprobaciones)",
  "",
  "- [ ] G1. Cada una de las **siete grietas** (Torre Pokémon, Islas Espuma, Monte Moon, Torre Quemada, Planta de Energía, Ruinas Alfa y Mansión Pokémon) avisa antes de abrirse y ofrece **Entrar / Retirarse**.",
  "- [ ] G2. Elegir «Retirarse» deja al jugador donde estaba: la grieta sigue ahí y no hay secuelas.",
  "- [ ] G3. Dentro de cada emisión, el evento «Volver al mundo» devuelve a la celda de la grieta por la que se entró, y la salida original a la gruta sigue funcionando.",
  "- [ ] G4. Tras purgar una emisión, la grieta se ve distinta (sin animación) y explica que la amenaza se purgó; seguir cruzando permite las revanchas.",
  "- [ ] G5. Con las siete purgas aparece el **punto de colapso** en la Torre Pokémon 1F y lleva al Monte Silver.",
  "- [ ] G6. Con las ocho purgas (incluido Red), el **umbral de la cumbre** abre la Liga Oscura; sin las ocho, explica qué falta.",
  "- [ ] G7. Los cinco combates de la Liga Oscura permiten perder, cierran con el self-switch A y solo repiten si se pide la revancha por menú.",
  "- [ ] G8. La Liga Oscura siempre tiene salida: al umbral y directa al mundo, incluso sin haber ganado.",
  "- [ ] G9. **Capitán Ferrán** (puerto de Ciudad Carmín) navega al Muelle de Atlas Mil y el barco del muelle devuelve a Ciudad Carmín cuando se quiera.",
  "- [ ] G10. **Isla Espejo**: la escotilla del B1F de la Mansión Pokémon baja al Sótano Sellado, el espejo pregunta si cruzar y el espejo del atrio devuelve al sótano.",
  "",
  "## Total",
  "",
  `**${12 + 40 + 10 + 14 + 12 + 8 + 10} comprobaciones** (12 críticas + 40 anclas + 10 rutas Tier 2 + 14 ecos + 12 Monte Silver + 8 regresión + 10 expansión multiversal). Marca este archivo o una copia local; no hace falta commitearlo.`,
  "",
);

const target = path.join(ROOT, "docs", "QA_MANUAL_PLAYTEST.md");
fs.writeFileSync(target, `${md.join("\n")}\n`);
console.log(`Checklist escrita en ${path.relative(ROOT, target)}: ${12 + 40 + 10 + 14 + 12 + 8 + 10} comprobaciones.`);
