#!/usr/bin/env node
/**
 * Empaqueta la Expansión Multiversal para instalarla sobre una copia de
 * Pokémon Fire Ash 3.7.1.
 *
 * La lista de archivos no está escrita a mano: se deriva del plano
 * (content/expansion_multiversal.json) y del plantel Pokégod
 * (content/pokegods_originales.json), de modo que si el arco crece, el paquete
 * crece con él sin que nadie se acuerde de actualizar una lista.
 *
 * Salida:
 *   Scripts_corregido/Expansion_Multiversal/                 carpeta lista
 *   Scripts_corregido/Fire_Ash_Expansion_Multiversal.zip     ZIP para extraer
 *
 * Uso:
 *   node tools/build_expansion_package.mjs            # construye y verifica
 *   node tools/build_expansion_package.mjs --verify    # solo verifica (CI)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GAME, ROOT } from "./lib/fire_ash_registry.mjs";
import { assertSameFile } from "./lib/package_integrity.mjs";
import { readZipIndex, writeZip } from "./lib/zip_writer.mjs";

const VERIFY = process.argv.includes("--verify");
const DATA = path.join(GAME, "Data");
const OUTPUT = path.join(ROOT, "Scripts_corregido", "Expansion_Multiversal");
const ZIP = path.join(ROOT, "Scripts_corregido", "Fire_Ash_Expansion_Multiversal.zip");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "expansion_multiversal.json"), "utf8"));
const POKEGODS = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "pokegods_originales.json"), "utf8"));
const ZIP_STAMP = new Date(Date.UTC(2024, 0, 1));

// ------------------------------------------------------------------ archivos
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const maps = new Set([
  PLAN.oakLab.mapId,                                   // laboratorio de Oak
  ...PLAN.rifts.map((rift) => rift.world.mapId),       // las siete grietas
  ...PLAN.rifts.map((rift) => rift.emissionMap),       // emisiones (salida nueva)
  PLAN.collapse.mapId, PLAN.collapse.targetMap,        // Torre Pokémon 1F y falda
  PLAN.falda.mapId, PLAN.darkLeague.gate.mapId,        // falda y cumbre
  ...PLAN.darkLeague.maps.map((map) => map.mapId),     // Liga Oscura
  PLAN.atlas.captainMap, PLAN.atlas.dock.mapId,        // Ciudad Carmín y muelle
  PLAN.mirror.mansionMap, PLAN.mirror.basement.mapId, PLAN.mirror.islandMap,
  998, 999,                                            // resto de la Isla Espejo
  2195, 2196,                                          // Vía de las Nueve Eras y su gimnasio
  2200, 2201, 2210, 2211,                              // Glazed y Light Platinum
  2220, 2221,                                          // dimensión Team Rocket
  2230,                                                // Avenida de los Ocho Gimnasios
  2240, 2241, 2242, 2243, 2244, 2245,                  // Liquid Crystal, TFOH y Factory Adventure
  ...Array.from({ length: 8 }, (_, i) => 2250 + i),     // los ocho gimnasios de Atlas
]);

/** Archivos del arco, siempre relativos a la raíz del juego. */
function fileList() {
  const files = [
    "Data/MapInfos.rxdata",     // nombres de los mapas nuevos
    "Data/map_metadata.dat",    // metadatos de los mapas nuevos
    "Data/trainers.dat",        // los cinco combates de la Liga Oscura y los diez del Gimnasio de las Eras
    "Data/trainer_types.dat",   // tipos de las Eras, las dimensiones y el circuito
    "Data/items.dat",           // medallas de las Eras, Glazed, Platino, Rocket y Atlas
    "Data/species.dat",         // los doce Pokégods
  ];
  for (const id of [...maps].sort((a, b) => a - b)) files.push(`Data/${mapFile(id)}`);
  for (const entry of POKEGODS.roster) {
    files.push(`Graphics/Pokemon/Front/${entry.id}.png`);
    files.push(`Graphics/Pokemon/Back/${entry.id}.png`);
    files.push(`Graphics/Pokemon/Icons/${entry.id}.png`);
    files.push(`Graphics/Characters/${entry.id}.png`);
    files.push(`Audio/SE/${entry.id}.ogg`);
  }
  files.push("Graphics/Characters/ARCEUS_GATE.png");  // sprite de las grietas
  return files;
}

const README = `PAQUETE — EXPANSIÓN MULTIVERSAL (POKÉMON FIRE ASH 3.7.1)
=========================================================

Arco posterior a «La Ruta de Dios». No añade ningún menú de viaje: todo se
descubre andando por Kanto y Johto. El laboratorio de Oak vuelve a tener solo
sus dos transportadores originales y Oak actúa como consejero.

QUÉ INSTALA
-----------
- Siete grietas purgables en Torre Pokémon, Islas Espuma, Monte Moon, Torre
  Quemada, Planta de Energía, Ruinas Alfa y Mansión Pokémon.
- Punto de colapso en la Torre Pokémon 1F y Liga Oscura (dos mapas, cinco
  combates que se pueden perder).
- Expedición a Atlas Mil: capitán en el puerto de Ciudad Carmín y muelle propio.
- Cinco ROMs reinterpretadas como dimensiones separadas: Glazed, Light
  Platinum, Liquid Crystal, TFOH y Factory Adventure; Ash entra como visitante
  y cada orilla conserva un barco de retorno libre.
- Sótano sellado de la Mansión Pokémon con el espejo que abre la Isla Espejo.
- Los doce Pokégods con sus tres Formas de Anomalía.

REQUISITOS
----------
1. Una copia de Pokémon Fire Ash 3.7.1 con el postgame activo (switch 429:
   termina el evento de Mew y vuelve a casa).
2. Tener instalado el contenido previo del proyecto (La Ruta de Dios y, si
   quieres recorrerlo, el paquete Dimensional Nightmare): este arco usa el
   Monte Silver y el contador de purgas, y no los incluye por duplicado.

INSTALACIÓN
-----------
1. Cierra Fire Ash y Kirin.
2. Trabaja sobre una copia del juego y guarda tus partidas aparte.
   No reemplaces ni borres Game.rxdata ni los archivos Save*.
3. Extrae Fire_Ash_Expansion_Multiversal.zip en la raíz de la copia, la que
   contiene Game.exe y Game.ini. Acepta reemplazar los archivos existentes.
4. Las carpetas Data/, Graphics/ y Audio/ deben quedar directamente bajo la
   raíz del juego, sin una carpeta intermedia Expansion_Multiversal/.
5. Inicia el juego y carga tu partida postgame.

CÓMO SE JUEGA
-------------
- Grietas: aparecen en los siete lugares; cada una avisa y pregunta
  «Entrar / Retirarse». Al tumbar al jefe de la emisión, la línea temporal se
  purga (\\v[264] sube) y la grieta se convierte en una cicatriz tranquila.
  Cada emisión tiene un «Volver al mundo» que te deja donde entraste.
- Con 7 purgas: punto de colapso en la Torre Pokémon 1F → Monte Silver.
- Con 8 purgas (incluido el Campeón Silencioso): umbral de la Liga Oscura en la
  cumbre, con salida al mundo siempre disponible.
- Atlas Mil: habla con el capitán en el puerto de Ciudad Carmín.
- Isla Espejo: escotilla nueva en el B1F de la Mansión Pokémon → espejo.
- Oak: te dice cuántas líneas llevas purgadas y hacia dónde mirar.

GARANTÍAS
---------
- Ningún combate encierra: todos permiten perder y hay curación y retorno.
- Ningún evento nuevo ofrece un menú de destinos.
- No se crea ni un switch ni una variable nueva: el progreso vive en \\v[264]
  y en los sellos 868-875, así que ninguna partida guardada se queda sin slots.

LIMITACIONES CONOCIDAS
----------------------
- Verificación estática y de empaquetado; no ejecutado en Game.exe/Kirin.
- El sprite de Pikablu está adaptado del Pikachu del juego (matiz a azul cielo)
  mientras no exista arte conceptual propio.
- La checklist manual está en docs/QA_MANUAL_PLAYTEST.md (sección G) y el
  diseño completo en docs/EXPANSION_MULTIVERSAL.md.

La carpeta descomprimida equivalente está en Scripts_corregido/Expansion_Multiversal/.
`;

// ------------------------------------------------------------------ construir
function build() {
  const files = fileList();
  for (const relative of files) {
    const origin = path.join(GAME, relative);
    if (!fs.existsSync(origin)) throw new Error(`Falta el archivo del juego: ${relative}`);
    const destination = path.join(OUTPUT, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(fs.readFileSync(origin))) {
      fs.copyFileSync(origin, destination);
    }
  }
  fs.writeFileSync(path.join(OUTPUT, "LEEME_EXPANSION.txt"), README);
  writeZip({ root: OUTPUT, destination: ZIP, timestamp: ZIP_STAMP });
  const count = readZipIndex(ZIP).entries.size;
  console.log(`Expansión Multiversal empaquetada: ${files.length} archivos del juego + LEEME (${count} entradas en el ZIP).`);
}

function verify() {
  if (!fs.existsSync(ZIP)) {
    // El ZIP es un artefacto generado (está en .gitignore): si no existe, se
    // construye a partir de la carpeta versionada en vez de fallar.
    console.log("El ZIP de la Expansión Multiversal no existía; lo construyo a partir de Expansion_Multiversal/.");
    build();
  }
  const files = fileList();
  for (const relative of files) assertSameFile(path.join(GAME, relative), path.join(OUTPUT, relative));
  const index = readZipIndex(ZIP).entries;
  for (const relative of files) {
    if (!index.has(relative)) throw new Error(`El ZIP no contiene ${relative}`);
  }
  if (!index.has("LEEME_EXPANSION.txt")) throw new Error("El ZIP no contiene el LEEME");
  if (!fs.readFileSync(path.join(OUTPUT, "LEEME_EXPANSION.txt"), "utf8").includes("EXPANSIÓN MULTIVERSAL")) {
    throw new Error("El LEEME del paquete está desactualizado");
  }
  console.log(`Paquete de la Expansión Multiversal OK: ${files.length} archivos idénticos al juego, carpeta y ZIP sincronizados.`);
}

if (VERIFY) verify();
else { build(); verify(); }
