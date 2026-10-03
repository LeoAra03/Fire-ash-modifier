#!/usr/bin/env node
/**
 * Construye un parche QA independiente para «Pokémon Fire Ash: Ashen Guardian».
 * No altera `Fire_Ash_Paquete_Directo.zip` ni la carpeta de La Ruta de Dios.
 * El ZIP se extrae sobre la raíz de una copia de Fire Ash 3.7.1 (Data/ y Graphics/).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";
import { listFiles, readZipEntry, readZipIndex, writeZip } from "./lib/zip_writer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const GRAPHICS = path.join(GAME, "Graphics");
const AUDIO_BGM = path.join(GAME, "Audio", "BGM");
const AUDIO_MANIFEST = path.join(ROOT, "content", "dimensional_nightmare_audio.json");
const OUTPUT = path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA");
const ZIP = path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA.zip");
const FIXED_SCRIPTS = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
const DN_RUNTIME = path.join(ROOT, "content", "dimensional_nightmare_runtime.rb");
const README_NAME = "LEEME_QA.txt";
const MANIFEST_NAME = "QA_MANIFEST.json";
const VERIFY_ONLY = process.argv.includes("--verify");

const MAP_IDS = [2030, ...Array.from({ length: 151 }, (_, index) => 2040 + index)];
const DATA_FILES = [
  "MapInfos.rxdata", "System.rxdata", "Tilesets.rxdata", "map_metadata.dat",
  "items.dat", "trainers.dat", "trainertypes.dat", "trainer_types.dat",
  "trainerlists.dat", "trainer_lists.dat",
];
const COPY_GRAPHIC_DIRS = [
  "Characters", "Items", "Pictures", "Pokemon/Front", "Trainers",
];
const TITLE_GRAPHIC = "Titles/title.png";

const README = `PAQUETE QA — POKÉMON FIRE ASH: ASHEN GUARDIAN
==================================================

Este parche independiente prepara el contenido Dimensional Nightmare / Protector de la Ceniza
para una prueba manual. Es una entrega interna de QA, no una distribución pública de recursos.
Los mosaicos derivados se incluyen únicamente para que el juego pueda cargarlos durante esta prueba.

COMPATIBILIDAD
--------------
- Diseñado para una copia limpia de Pokémon Fire Ash 3.7.1 con RPG Maker XP / Essentials v19.
- Instálalo en una copia separada del juego. El ZIP no incluye Game.exe, partidas ni Game.rxdata.
- Incluye los datos, gráficos originales y pistas MIDI propias del contenido DN, nombres de flags
  y una copia del Scripts.rxdata corregido con un módulo Runtime DN aislado (batalla espejo y
  secuencia final de EP06). El archivo compartido del paquete de La Ruta de Dios no se modifica.

INSTALACIÓN
-----------
1. Cierra Fire Ash y el emulador/launcher.
2. Duplica la carpeta del juego y conserva intacta la original.
3. Haz una copia adicional de tus partidas. No se deben reemplazar ni borrar Game.rxdata o Save*.
4. Extrae Dimensional_Nightmare_QA.zip directamente en la raíz de la copia, junto a Game.exe y
   Game.ini. Acepta reemplazar Data/Scripts.rxdata, Data/MapInfos.rxdata, Data/System.rxdata,
   Data/Tilesets.rxdata, los mapas listados, los gráficos y Audio/BGM/DN_*.mid.
5. No dejes Data/ ni Graphics/ dentro de una carpeta intermedia llamada
   Dimensional_Nightmare_QA/; deben quedar directamente bajo la raíz del juego.
6. Inicia una partida postgame en la copia. La entrada está en la Gruta de los Testigos (Map2030),
   junto a la llegada de la Antesala. El primer anillo requiere v264 ≥ 3; el contenido tardío conserva
   las condiciones narrativas indicadas por el juego (incluidos los 7 sellos de Monte Silver).

RECORRIDO DE QA SUGERIDO
------------------------
- Prueba el acceso a la Antesala y confirma que las puertas cerradas explican qué falta.
- Visita EP01–EP06, el Nexo, la Liga Oscura y W7–W9; usa las salidas y retornos de cada zona.
- Habla varias veces con NPC normales, conscientes e interdimensionales. Sus páginas recuerdan
  visitas, se mueven según su papel y reaccionan al cambio de fase.
- Inspecciona el hito de Rotom de cada mapa. Registra anomalías, objetos, pedestales y estatuas.
- Prueba las diez decisiones opcionales y consulta la Vitrina del Testigo en la Antesala.
- Pierde y reintenta los combates; comprueba fase B, curación, recompensas únicas y regreso seguro.
- Comprueba el subtítulo Ashen Guardian, las BGM MIDI originales, el silencio de EP05 (2104–2109) y el fade/restauración del silenciador de EP04.
- Comprueba que los tonos/fases vuelvan a neutro al salir y que v264 no cambie al recorrer el Nightmare; DN sólo lo consulta como contador externo.

LIMITACIONES CONOCIDAS
----------------------
- Esta entrega pasó verificación estática y de empaquetado; no se ha ejecutado en Game.exe/Kirin.
- La QA manual sigue pendiente. Si detectas un error, anota mapa, coordenadas, flags y pasos para
  reproducirlo antes de restaurar la copia limpia.
- No redistribuyas el paquete ni los gráficos de referencia fuera de esta prueba.

La carpeta descomprimida equivalente está en Scripts_corregido/Dimensional_Nightmare_QA/.
`;

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function ensureSource(source, description) {
  if (!fs.existsSync(source)) throw new Error(`Falta ${description}: ${path.relative(ROOT, source)}`);
}
function copyFile(source, relative) {
  ensureSource(source, relative);
  const destination = path.join(OUTPUT, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
function runtimePatchedScripts() {
  ensureSource(FIXED_SCRIPTS, "Scripts.rxdata corregido base");
  ensureSource(DN_RUNTIME, "Runtime Ruby de Dimensional Nightmare");
  const scripts = marshalLoad(fs.readFileSync(FIXED_SCRIPTS));
  if (!Array.isArray(scripts)) throw new Error("Scripts.rxdata no contiene una lista de secciones");
  const runtimeCode = fs.readFileSync(DN_RUNTIME, "utf8");
  const compressed = new RString(zlib.deflateSync(Buffer.from(runtimeCode, "utf8")));
  const existingIndex = scripts.findIndex((entry) => entry?.[1]?.text === "DN_RuntimeSupport");
  if (existingIndex >= 0) {
    scripts[existingIndex][2] = compressed;
  } else {
    const numericIds = scripts.map((entry) => Number(entry?.[0])).filter(Number.isFinite);
    const newId = Math.max(0, ...numericIds) + 1;
    const mainIndex = scripts.findIndex((entry) => entry?.[1]?.text === "Main");
    const newSection = [newId, RString.fromText("DN_RuntimeSupport"), compressed];
    scripts.splice(mainIndex >= 0 ? mainIndex : scripts.length, 0, newSection);
  }
  return Buffer.from(marshalDump(scripts));
}

function runtimeCodeInScripts(bytes) {
  const scripts = marshalLoad(bytes);
  const section = scripts.find((entry) => entry?.[1]?.text === "DN_RuntimeSupport");
  if (!section?.[2]?.bytes) throw new Error("Data/Scripts.rxdata no contiene DN_RuntimeSupport");
  return zlib.inflateSync(Buffer.from(section[2].bytes)).toString("utf8");
}

function tileNamesUsedByNewMaps() {
  const tilesets = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const names = new Set();
  for (const mapId of MAP_IDS) {
    const file = path.join(DATA, `Map${mapId}.rxdata`);
    ensureSource(file, `Map${mapId}.rxdata`);
    const map = marshalLoad(fs.readFileSync(file));
    const tilesetId = Number(map.getIvar("@tileset_id"));
    const tileset = tilesets[tilesetId];
    if (!tileset) throw new Error(`Map${mapId}: tileset ${tilesetId} no existe en Tilesets.rxdata`);
    const name = tileset.getIvar("@tileset_name")?.text;
    if (name?.startsWith("DN_")) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "en"));
}
function customGraphics() {
  const files = [];
  for (const directory of COPY_GRAPHIC_DIRS) {
    const full = path.join(GRAPHICS, directory);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      if (!/^DN_.*\.png$/i.test(name)) continue;
      files.push(path.join(directory, name).replaceAll(path.sep, "/"));
    }
  }
  return files.sort();
}
function customAudio() {
  if (!fs.existsSync(AUDIO_BGM)) return [];
  return fs.readdirSync(AUDIO_BGM).filter((name) => /^DN_.*\.mid$/i.test(name)).sort()
    .map((name) => `Audio/BGM/${name}`);
}
function cleanOutput() {
  if (fs.existsSync(OUTPUT)) fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });
}
function createManifest() {
  const entries = listFiles(OUTPUT).filter((name) => name !== MANIFEST_NAME).sort().map((name) => {
    const bytes = fs.readFileSync(path.join(OUTPUT, name));
    return { path: name, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const manifest = {
    package: "Pokémon Fire Ash: Ashen Guardian — Dimensional Nightmare QA",
    version: "2026-10-02",
    baseGame: "Pokémon Fire Ash 3.7.1",
    installRoot: "Game.exe / Game.ini",
    intendedForManualQA: true,
    includesSaveFiles: false,
    maps: MAP_IDS,
    customTilesets: tileNamesUsedByNewMaps(),
    files: entries,
  };
  fs.writeFileSync(path.join(OUTPUT, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export function build() {
  cleanOutput();
  fs.mkdirSync(path.join(OUTPUT, "Data"), { recursive: true });
  for (const name of MAP_IDS) copyFile(path.join(DATA, `Map${name}.rxdata`), `Data/Map${name}.rxdata`);
  for (const name of DATA_FILES) copyFile(path.join(DATA, name), `Data/${name}`);
  const scriptsDestination = path.join(OUTPUT, "Data/Scripts.rxdata");
  fs.writeFileSync(scriptsDestination, runtimePatchedScripts());

  const tilesetNames = tileNamesUsedByNewMaps();
  for (const name of tilesetNames) copyFile(path.join(GRAPHICS, "Tilesets", `${name}.png`), `Graphics/Tilesets/${name}.png`);
  for (const name of customGraphics()) copyFile(path.join(GRAPHICS, name), `Graphics/${name}`);
  for (const name of customAudio()) copyFile(path.join(AUDIO_BGM, path.basename(name)), name);
  copyFile(path.join(GRAPHICS, TITLE_GRAPHIC), `Graphics/${TITLE_GRAPHIC}`);
  fs.writeFileSync(path.join(OUTPUT, README_NAME), README, "utf8");
  const manifest = createManifest();
  writeZip({ root: OUTPUT, destination: ZIP });
  return { maps: MAP_IDS.length, tilesets: manifest.customTilesets.length, files: manifest.files.length + 1, bytes: fs.statSync(ZIP).size };
}

export function verify() {
  ensureSource(ZIP, "Dimensional_Nightmare_QA.zip; ejecútalo sin --verify");
  ensureSource(OUTPUT, "carpeta QA descomprimida");
  const expected = new Set(listFiles(OUTPUT));
  const archive = readZipIndex(ZIP);
  const actual = new Set(archive.entries.keys());
  for (const name of expected) if (!actual.has(name)) throw new Error(`ZIP sin el archivo ${name}`);
  for (const name of actual) {
    if (!expected.has(name)) throw new Error(`Archivo inesperado en el ZIP: ${name}`);
    if (name.startsWith("/") || name.split("/").includes("..")) throw new Error(`Ruta insegura en el ZIP: ${name}`);
  }
  for (const name of expected) {
    const disk = fs.readFileSync(path.join(OUTPUT, name));
    const inZip = readZipEntry(archive, name);
    if (!disk.equals(inZip)) throw new Error(`Diferencia carpeta/ZIP: ${name}`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(OUTPUT, MANIFEST_NAME), "utf8"));
  const expectedEntries = new Set(manifest.files.map((entry) => entry.path));
  const actualEntries = new Set([...expected].filter((name) => name !== MANIFEST_NAME));
  if (expectedEntries.size !== actualEntries.size || [...actualEntries].some((name) => !expectedEntries.has(name))) {
    throw new Error("QA_MANIFEST.json no coincide con la carpeta de entrega");
  }
  for (const entry of manifest.files) {
    const bytes = fs.readFileSync(path.join(OUTPUT, entry.path));
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`Hash incorrecto: ${entry.path}`);
  }
  if (expected.has("Data/Game.rxdata") || [...expected].some((name) => /(?:^|\/)(?:Game|Save\d*)\.rxdata$/i.test(name))) {
    throw new Error("El paquete contiene una partida o Game.rxdata; no debe empaquetarse");
  }
  for (const name of MAP_IDS) if (!expected.has(`Data/Map${name}.rxdata`)) throw new Error(`Falta Map${name}.rxdata`);
  for (const required of [
    "Data/Scripts.rxdata", "Data/MapInfos.rxdata", "Data/System.rxdata", "Data/Tilesets.rxdata",
    "Data/map_metadata.dat", "Data/items.dat", "Data/trainers.dat", `Graphics/${TITLE_GRAPHIC}`, README_NAME,
  ]) if (!expected.has(required)) throw new Error(`Falta archivo imprescindible: ${required}`);
  ensureSource(AUDIO_MANIFEST, "manifiesto de música DN");
  const audioManifest = JSON.parse(fs.readFileSync(AUDIO_MANIFEST, "utf8"));
  if (!audioManifest.originalComposition || !audioManifest.tracks?.length) throw new Error("El manifiesto DN debe declarar temas originales");
  for (const track of audioManifest.tracks) {
    if (!expected.has(track.file)) throw new Error(`Falta pista original en el ZIP: ${track.file}`);
    const bytes = fs.readFileSync(path.join(OUTPUT, track.file));
    if (bytes.length !== track.bytes || sha256(bytes) !== track.sha256) throw new Error(`Pista del ZIP distinta del manifiesto: ${track.file}`);
  }
  const packagedScripts = fs.readFileSync(path.join(OUTPUT, "Data/Scripts.rxdata"));
  const packagedRuntime = runtimeCodeInScripts(packagedScripts);
  if (packagedRuntime !== fs.readFileSync(DN_RUNTIME, "utf8")) throw new Error("DN_RuntimeSupport del ZIP está desactualizado");
  const result = { files: expected.size, bytes: fs.statSync(ZIP).size, maps: MAP_IDS.length, tilesets: manifest.customTilesets.length };
  console.log(`QA del paquete OK: ${result.maps} mapas · ${result.tilesets} tilesets DN · ${result.files} archivos · ${(result.bytes / 1048576).toFixed(1)} MB`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!VERIFY_ONLY) {
    const built = build();
    console.log(`generado: Scripts_corregido/Dimensional_Nightmare_QA.zip (${built.files} archivos, ${(built.bytes / 1048576).toFixed(1)} MB)`);
  }
  verify();
}
