#!/usr/bin/env node
/**
 * dn_plan_experience.mjs — plan de experiencia por mapa.
 *
 * Genera `docs/DIMENSIONAL_NIGHTMARE/15_EXPERIENCIA_POR_MAPA.md` con:
 *   1. los principios de diferenciación (cada mapa = una experiencia),
 *   2. un **arquetipo + gancho + mecánica** por mapa, con regla de contraste (un mapa nunca
 *      repite el arquetipo de su vecino inmediato),
 *   3. el estado real de la auditoría de contenido (`dn:audit`).
 *
 * El plan es una propuesta base verificable: la regla de contraste se comprueba sola y el
 * archivo se regenera cuando cambien los mapas.
 *
 * Uso:
 *   node tools/dn_plan_experience.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, BUILT, EVENTS, readJson } from "./lib/dn_rmxp.mjs";

const CHECK = process.argv.includes("--check");
const built = readJson(BUILT).maps;
const events = readJson(EVENTS).maps ?? {};
const auditPath = path.join(ROOT, "docs", "dn_referencia", "auditoria", "dn_audit.json");
const audit = fs.existsSync(auditPath) ? readJson(auditPath) : null;

// --------------------------------------------------------------- arquetipos
/**
 * Cada arquetipo es una experiencia: qué se siente, qué se hace y qué la distingue.
 * `hook` = gancho, `gimmick` = mecánica de mapa, `pace` = ritmo esperado.
 */
const ARCHETYPES = {
  umbral: { feel: "llegada y contrato", hook: "una puerta que sólo abre con lo que traes", gimmick: "transferencia con condición", pace: "corto" },
  camara: { feel: "clímax contenido", hook: "el jefe del tramo observa desde el fondo", gimmick: "fase B por pasos", pace: "largo" },
  archivo: { feel: "memoria acumulada", hook: "estanterías que responden al progreso", gimmick: "NPC que lee tus sellos", pace: "medio" },
  laberinto: { feel: "desorientación controlada", hook: "un camino que se cierra detrás de ti", gimmick: "pasajes con retorno distinto", pace: "medio" },
  via: { feel: "travesía", hook: "un corredor con un destino visible al fondo", gimmick: "línea recta con hitos", pace: "corto" },
  plaza: { feel: "respiro social", hook: "el único lugar donde alguien te habla sin miedo", gimmick: "NPCs con 5 estados de visita", pace: "medio" },
  fosa: { feel: "descenso", hook: "la luz queda arriba", gimmick: "pendiente y niebla", pace: "medio" },
  torre: { feel: "ascenso", hook: "cada piso enseña algo nuevo del mundo", gimmick: "plataformas y atajos", pace: "largo" },
  eco: { feel: "algo repite lo que haces", hook: "tu propio paso con retraso", gimmick: "evento que copia tu posición", pace: "corto" },
  altar: { feel: "cierre", hook: "el mundo se ordena alrededor de una figura", gimmick: "sellado y salida al hub", pace: "largo" },
  cripta: { feel: "intimidad funeraria", hook: "los nombres de los que cayeron", gimmick: "inspección de lápidas", pace: "medio" },
  glitch: { feel: "el mundo se equivoca", hook: "una celda que no debería existir", gimmick: "tiles corruptos y parpadeo", pace: "corto" },
  nucleo: { feel: "última verdad", hook: "el origen de la corrupción", gimmick: "escena larga + decisión", pace: "largo" },
  colegio: { feel: "costumbre y rutina rota", hook: "un aula que sigue en clase", gimmick: "cátedras que siguen el guion", pace: "medio" },
  espejo: { feel: "identidad invertida", hook: "un doble que no se mueve igual", gimmick: "comparación de posición", pace: "medio" },
  vacio: { feel: "ausencia total", hook: "nada responde, ni el viento", gimmick: "oscuridad con luz propia", pace: "corto" },
  coro: { feel: "muchos ojos, una voz", hook: "letras que cantan en orden", gimmick: "siete estaciones", pace: "largo" },
  pueblo: { feel: "vida detenida", hook: "casas abiertas y nadie dentro", gimmick: "puertas inspeccionables", pace: "medio" },
  ladera: { feel: "esfuerzo físico", hook: "el viento empuja hacia atrás", gimmick: "hielo resbaladizo", pace: "medio" },
  cumbre: { feel: "silencio absoluto", hook: "desde arriba no se ve nada", gimmick: "ventisca que baja la visión", pace: "largo" },
  casa: { feel: "intimidad doméstica rota", hook: "una casa que canta", gimmick: "habitaciones con nana", pace: "medio" },
  jardin: { feel: "belleza equivocada", hook: "flores que siguen al jugador", gimmick: "pétalos que marcan caminos", pace: "medio" },
  pasillo: { feel: "urgencia", hook: "puertas que se cierran al pasar", gimmick: "velocidad obligatoria", pace: "corto" },
  calle: { feel: "ciudad sin nadie", hook: "semáforos que siguen funcionando", gimmick: "luces que delatan", pace: "medio" },
  mausoleo: { feel: "duelo privado", hook: "una foto en blanco", gimmick: "objetos de historia", pace: "medio" },
  mercado: { feel: "negocio fantasma", hook: "precios de algo que ya no existe", gimmick: "intercambio de objetos", pace: "corto" },
  tren: { feel: "huida", hook: "un vagón que no para", gimmick: "pasillo móvil", pace: "corto" },
  templo: { feel: "reverencia", hook: "una letra por columna", gimmick: "orden correcto", pace: "largo" },
  falla: { feel: "grieta en la realidad", hook: "el código se ve por debajo", gimmick: "tiles del archivo", pace: "medio" },
  sala: { feel: "reunión", hook: "todo lo que hiciste está aquí", gimmick: "lectura de flags", pace: "largo" },
  portico: { feel: "antesala del fin", hook: "un custodio que avisa", gimmick: "NPC de advertencia", pace: "medio" },
  arena: { feel: "juicio", hook: "el público es la tormenta", gimmick: "prueba de vínculo por pasos", pace: "largo" },
};
const ORDER = Object.keys(ARCHETYPES);

/** Guion de arquetipos por episodio: el orden se elige para que nunca repita vecino. */
const SCRIPTS = {
  EP01: ["umbral", "cripta", "pasillo", "fosa", "archivo", "plaza", "laberinto", "eco", "cripta", "pasillo", "fosa", "archivo", "plaza", "laberinto", "umbral", "camara"],
  EP02: ["pueblo", "umbral", "casa", "eco", "archivo", "torre", "mercado", "pasillo", "casa", "eco", "archivo", "plaza", "torre", "umbral", "pasillo", "camara"],
  EP03: ["via", "ladera", "fosa", "cumbre", "via", "ladera", "eco", "cumbre", "fosa", "plaza", "via", "ladera", "cumbre", "glitch", "umbral", "camara"],
  EP04: ["pueblo", "casa", "colegio", "pasillo", "jardin", "casa", "colegio", "eco", "jardin", "plaza", "pueblo", "pasillo", "colegio", "jardin", "umbral", "camara"],
  EP05: ["calle", "vacio", "espejo", "mausoleo", "calle", "vacio", "tren", "espejo", "mausoleo", "eco", "calle", "glitch", "nucleo", "vacio", "umbral", "camara"],
  EP06: ["cripta", "templo", "coro", "glitch", "templo", "coro", "cripta", "glitch", "templo", "coro", "eco", "glitch", "nucleo", "coro", "umbral", "camara"],
  NEXO: ["falla", "pueblo", "plaza", "via", "sala"],
  LIGA: ["portico", "arena"],
  HUB: ["sala"],
};

/** Ganchos concretos por episodio (se alternan según la posición para que no se repitan). */
const HOOKS = {
  EP01: ["una mano impresa que sigue ahí", "un sepulturero que te confunde con un familiar", "velas que se apagan al pasar", "un pozo que devuelve susurros", "un archivero que anota tu nombre", "el único lugar con luz", "pasillos que cambian de orden", "tu propio paso con retraso", "una lápida con tu fecha", "puertas que se cierran al pasar", "el descenso al osario", "libros que se reescriben", "un pueblo bajo tierra", "un camino que se pierde", "la última puerta", "la cámara del jefe"],
  EP02: ["un pueblo sepia que no reacciona", "el umbral del cartucho", "una casa que debería estar vacía", "una firma idéntica a la tuya", "registros de entrenadores borrados", "la torre de radio muerta", "un mercado sin vendedores", "pasillos de cintas", "la habitación de Silver", "el eco de una batalla perdida", "la caja de los olvidados", "la plaza del pueblo", "el último piso de la torre", "la salida que no sale", "el corredor final", "el duelo con el Sin Nombre"],
  EP03: ["la ruta blanca", "una ladera que empuja", "el descenso al lago", "la cumbre sin vista", "la ruta de los que subieron", "la ladera del viento", "un eco en la nieve", "la cumbre del silencio", "la fosa helada", "el refugio de los montañeros", "la ruta corta", "la ladera de las huellas", "la cumbre del Testigo", "una grieta en el hielo", "el último tramo", "la cámara del Caminante"],
  EP04: ["el pueblo que duerme", "la casa de la nana", "el aula que sigue en clase", "el pasillo de las cunas", "el jardín que canta", "la habitación de arriba", "el patio del recreo", "el eco de la nana", "el jardín trasero", "la plaza del pueblo", "la calle de los dormidos", "el pasillo largo", "el aula del fondo", "el jardín de los nombres", "la puerta del sótano", "la cámara de la Nana"],
  EP05: ["la ciudad sin nadie", "el vacío que responde", "tu doble un paso tarde", "el mausoleo privado", "la avenida de los escaparates", "la nada entre edificios", "el tren que no para", "el espejo del andén", "la foto en blanco", "el eco del jugador 000", "la calle del cartel roto", "la celda que no existe", "el núcleo del cartucho", "el vacío final", "la última puerta", "la cámara del Jugador 000"],
  EP06: ["la cripta de las letras", "el templo de las columnas", "el coro de los siete ojos", "una celda imposible", "el templo interior", "el coro que se ordena", "la cripta profunda", "el glitch que te mira", "el templo del rey", "el coro final", "el eco del trono", "el glitch del nombre", "el núcleo del Rey sin Letra", "el coro de los Unown", "la última puerta", "la cámara de KINGGUS"],
  NEXO: ["la falla que reunió todo", "el pueblo reensamblado", "el centro que aún cura", "el pasillo de código", "la sala del Testigo"],
  LIGA: ["el custodio que avisa", "la tormenta que corre"],
  HUB: ["la antesala de las grietas"],
};

const plural = (n) => (n === 1 ? "" : "s");
const table = (rows) => ["| Mapa | Título | Arquetipo | Sensación | Gancho | Mecánica | Ritmo |", "|---|---|---|---|---|---|---|", ...rows].join("\n");

const rows = [];
const problems = [];
const titleOf = (info) => (info.title ?? "").replace(/^DN \d+ · /, "");
const byEpisode = new Map();
for (const info of built) {
  if (!byEpisode.has(info.episode)) byEpisode.set(info.episode, []);
  byEpisode.get(info.episode).push(info);
}
for (const [episode, maps] of byEpisode) {
  maps.sort((a, b) => a.id - b.id);
  const script = SCRIPTS[episode] ?? [];
  const hooks = HOOKS[episode] ?? [];
  maps.forEach((info, index) => {
    const archetype = script[index % script.length] ?? "umbral";
    const arch = ARCHETYPES[archetype];
    const hook = hooks[index] ?? arch.hook;
    const previous = index > 0 ? (script[(index - 1) % script.length] ?? null) : null;
    if (previous === archetype) problems.push(`Map${info.id}: repite el arquetipo «${archetype}» de su vecino`);
    const contrast = previous && previous !== archetype ? `tras «${previous}»` : "primer mapa del tramo";
    rows.push(`| **${info.id}** | ${titleOf(info)} | ${archetype} | ${arch.feel} | ${hook} | ${arch.gimmick} | ${arch.pace} (${contrast}) |`);
    void info;
  });
}

// --------------------------------------------------------------- documento
const auditBlock = audit
  ? `## 4. Estado de la auditoría (${new Date().toISOString().slice(0, 10)})

| Comprobación | Resultado |
|---|---|
| Mapas auditados | ${audit.maps} |
| Errores | **${audit.stats.errors}** |
| Avisos | **${audit.stats.warnings}** |

${audit.stats.errors || audit.stats.warnings ? "Pendientes registrados en `docs/dn_referencia/auditoria/dn_audit.json`." : "Sin errores ni avisos: gráficos, transferencias, tilesets, audio, objetos, trainers, flags y tonos están consistentes."}`
  : "## 4. Estado de la auditoría\n\nSin informe: ejecuta `npm run dn:audit`.";

const document = `# EXPERIENCIA POR MAPA — cada mapa, una experiencia distinta

> Generado por \`tools/dn_plan_experience.mjs\` (regenerar con \`npm run dn:plan:mapas\`). Los
> arquetipos y ganchos son la **propuesta base aprobable**; el estado de errores sale de la
> auditoría real (\`npm run dn:audit\`).

## 1. Reglas de diferenciación (obligatorias)

1. **Un gancho por mapa**: cada mapa tiene una cosa que sólo pasa ahí (una mano, una foto, un eco).
2. **Contraste de vecinos**: dos mapas consecutivos **nunca** comparten arquetipo (lo comprueba
   este mismo plan: ${problems.length === 0 ? "sin repeticiones en la lista actual" : `${problems.length} repeticiones detectadas`}).
3. **Ritmo alterno**: a un mapa largo le sigue uno corto; el descanso es parte del diseño.
4. **Sensación continua**: el tono de pantalla del mundo se mantiene (ver doc 14 §2) y cambia
   sólo al cambiar de mundo — la variedad viene del **espacio**, no de teñir la pantalla distinto.
5. **Una lectura por mapa**: el jugador debe poder decir en una frase qué hacía ahí.
6. **Nada de mapas de relleno**: si un mapa no aporta gancho, se fusiona con su vecino.

## 2. Arquetipos (el vocabulario del tramo)

${ORDER.map((key) => {
  const a = ARCHETYPES[key];
  return `- **${key}** — ${a.feel}: gancho tipo «${a.hook}», mecánica «${a.gimmick}», ritmo ${a.pace}.`;
}).join("\n")}

## 3. Tabla por mapa (${rows.length} mapas)

${table(rows)}

${auditBlock}

## 5. Correcciones aplicadas y pendientes

### Aplicadas en esta pasada
| Tipo | Hallazgo | Corrección |
|---|---|---|
| NPC | 39 eventos con gráficos declarados con extensión (sprite invisible en juego) | gráficos sin extensión: trchar000, UNOWN, DN_MADPIKA, Object ball special |
| BATTLE | objetos \`DN_PHOTO_01..04\` referenciados y no creados | fotos del Sin Nombre creadas con icono propio (y la foto en blanco de EP05 ya existe) |
| BATTLE | **NEXO**: el mapa final generaba \`PBTrainer.new("HIKER", "null")\` | el bloque de jefe sólo se crea si el episodio tiene jefe |
| FLAGS | 40 switches y 19 variables del ciclo sin nombre en System | \`npm run dn:flags\` los nombra (\`DN_*\` y \`DN_LIGA_*\`) |
| LEVEL DESIGN | muro del Coliseo atravesable | el muro exige bloqueo en las 4 direcciones; salida en la puerta |
| CINEMÁTICA | tonos sin restaurar detectados como error | se distinguen \`dn:sensacion\` (viaja con la transferencia) y \`dn:ambiente\` |

### Pendientes por categoría
| Tipo | Pendiente | Cómo se cierra |
|---|---|---|
| LEVEL DESIGN | ganchos por mapa de §3 sin implementar | pasada de guion + eventos por mapa (B6) |
| CINEMÁTICA | escenas largas del Nexo y la Liga sin recursos visuales propios | arte MEDIA (doc 08) |
| BATTLE | combate espejo real de EP05 y forma final de EP06 | equipo 120–125 aprobado + fase C |
| NPC | \`trchar052\` sigue sin existir (4 NPCs usan \`trchar000\`) | crear el sprite o aceptar la sustitución |
| TILES | tilesets \`DN_*\` propios usan la tabla de pasajes del juego base | revisar los pasajes finos por mapa al final de la QA |
| AUDIO | audio alterado por anomalía | composición/edición (B2) |
| CORRUPCIÓN | las 7 fases del GDD no cambian la escena todavía | plan de fase en doc 13 §F3b (tono + huecos + overlays) y verificador de fases (B7) |

## 6. La batalla de La Ruta de Dios — soluciones (M2)

| # | Problema detectado | Solución implementada |
|---|---|---|
| S1 | El Arceus capturado conservaba \`@ruta_arceus_divine\`, fase, restauraciones y bandera de captura | \`pbArceusNormalizeCaptured\` limpia los cuatro al capturar; queda sólo un Arceus nv 200 normal |
| S2 | El parche de \`Pokemon#level=\` permitía **nivel 200 a cualquier Arceus** | el 200 exige \`@ruta_arceus_divine\`; la instancia divina nace al máximo normal y sube después |
| S2b | El helper cinemático construía un Arceus nv 200 sin marcar como divino (habría fallado con S2) | \`pbArceusCinematicPokemon\` nace al tope normal, se marca divino y sólo entonces sube a 200 |
| S3 | \`minimum_exp_for_level\` recortaba a 200 en global | se mantiene el recorte (necesario para la curva del 200) pero ya sólo alcanzable por la instancia divina |
| S4 | Con el último sello roto, si el jugador seguía atacando podía **matar a Arceus** (y el guion se rompía) | con la captura abierta el daño se retiene: el desenlace es la captura |
| S5 | \`pbReduceHP\` consultaba fase en **todas** las batallas | la rama divina se comprueba una vez (\`arceus_divine?\`) y el resto va directo al motor |
| S6 | El pseudo-PC podía ofrecer **huevos** | se filtran (\`!pkmn.egg?\`) |
| S7 | Rendirse salía del combate sin limpiar reglas | se limpian \`cannotRun\`/\`canLose\` y se marca \`RUTA_DE_DIOS_ARCEUS_RESOLVED\` |
| S8 | Sin balls, la captura determinista era inalcanzable | \`pbArceusEnsureCaptureBall\`: el Rotom materializa una Bola del Testigo y avisa |
| S9 | El desenlace dependía de bajar la vida paso a paso | **sellos del Génesis**: cada golpe conectado rompe 1 de 5 sellos y fija el vigor al umbral (72/55/38/22 % y 1 PS); el quinto abre la captura al 100 % |
| S10 | Los ecos invocados (Mew, Giratina) nacían al nivel 200 | \`pbArceusSummon\` usa el nivel máximo legal (150) y compensa con un empuje divino ×1,25 |
| S11 | Un empate cerraba el evento en silencio | \`decision == 5\` restaura el estado previo, explica el empate y deja la cima abierta para reintentar |
| S12 | Sin candidatos en el PC, el pseudo-PC no tenía salida | \`pbArceusRotomMercy\`: el Rotom sostiene al equipo una sola vez (35 %); nunca deja al jugador sin opciones |
| S13 | Arceus se curaba 3 veces al completo | quedan **2** Restaura Todo divinos, sólo en fase 4+ y por debajo del 30 %; los sellos rotos no se restauran |
| S14 | El duelo con Volo llegaba con el equipo agotado | \`pbArceusVoloRest\`: descanso explícito antes del reto (y en cada reintento) |

Verificación: \`npm run verify:ruta_de_dios\` comprueba las once garantías en la sección
\`PokeMod_RutaDeDios\` ya instalada en \`Scripts.rxdata\`.
`;

const out = path.join(ROOT, "docs", "DIMENSIONAL_NIGHTMARE", "15_EXPERIENCIA_POR_MAPA.md");
if (CHECK) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  const fresh = current.includes("## 3. Tabla por mapa");
  console.log(`plan de mapas: ${built.length} mapas · ${problems.length} repeticiones de arquetipo · documento ${fresh ? "presente" : "ausente"}`);
  process.exit(problems.length ? 1 : 0);
}
fs.writeFileSync(out, document);
console.log(`plan de mapas: ${built.length} mapas · ${problems.length} repeticiones de arquetipo`);
console.log(`  → ${path.relative(ROOT, out)}`);
