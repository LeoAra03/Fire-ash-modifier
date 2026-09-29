#!/usr/bin/env node
/**
 * Sincroniza el paquete directo de La Ruta de Dios después de regenerar los
 * datos jugables.
 *
 * No reemplaza Scripts_corregido/Scripts.rxdata completo: conserva las seis
 * correcciones de distribución (Grandeur Club, colisiones y guardado) y sólo
 * actualiza la sección PokeMod_RutaDeDios desde el script ejecutable.
 *
 * Uso:
 *   node tools/sync_ruta_de_dios_package.mjs
 *   node tools/sync_ruta_de_dios_package.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME_DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const PACKAGE = path.join(ROOT, "Scripts_corregido");
const DIRECT = path.join(PACKAGE, "Paquete_directo");
const VERIFY_ONLY = process.argv.includes("--verify");

const DATA_FILES = [
  "Map2030.rxdata", "Map2031.rxdata", "Map2032.rxdata", "Map2033.rxdata",
  "Map2034.rxdata", "Map2035.rxdata", "Map2036.rxdata", "Map2037.rxdata",
  "Map513.rxdata", "Map625.rxdata", "MapInfos.rxdata", "Scripts.rxdata",
  "System.rxdata", "encounters.dat", "map_metadata.dat",
];
const ASSET_FILES = [
  ["Graphics/Characters/ARCEUS.png", "Graphics/Characters/ARCEUS.png"],
  ["Graphics/Characters/ARCEUS_GATE.png", "Graphics/Characters/ARCEUS_GATE.png"],
  ["Graphics/Characters/ARC_Cynthia.png", "Graphics/Characters/ARC_Cynthia.png"],
  ["Graphics/Characters/ARC_Ethan.png", "Graphics/Characters/ARC_Ethan.png"],
  ["Graphics/Characters/ARC_Steven.png", "Graphics/Characters/ARC_Steven.png"],
  ["Graphics/Characters/DIALGA.png", "Graphics/Characters/DIALGA.png"],
  ["Graphics/Characters/Object ball special.png", "Graphics/Characters/Object ball special.png"],
  ["Graphics/Characters/PALKIA.png", "Graphics/Characters/PALKIA.png"],
  ["Graphics/Characters/SECRET_Red.png", "Graphics/Characters/SECRET_Red.png"],
  ["Graphics/Characters/SECRET_Volo.png", "Graphics/Characters/SECRET_Volo.png"],
  ["Graphics/Characters/SQUIRTLE.png", "Graphics/Characters/SQUIRTLE.png"],
  ["Audio/BGM/Legend Sinnoh.ogg", "Audio/BGM/Legend Sinnoh.ogg"],
  ["Audio/BGM/secretvolo.ogg", "Audio/BGM/secretvolo.ogg"],
];

function readScripts(file) {
  return marshalLoad(fs.readFileSync(file));
}
function scriptName(row) {
  return row?.[1]?.text ?? String(row?.[1] ?? "");
}
function routeRow(scripts) {
  return scripts.find((row) => scriptName(row) === "PokeMod_RutaDeDios");
}
function ensureFiles() {
  const required = [
    path.join(GAME_DATA, "Scripts.rxdata"),
    path.join(PACKAGE, "Scripts.rxdata"),
  ];
  for (const file of required) if (!fs.existsSync(file)) throw new Error(`Falta ${file}`);
  if (!routeRow(readScripts(required[0]))) throw new Error("El script ejecutable no contiene PokeMod_RutaDeDios");
  if (!routeRow(readScripts(required[1]))) throw new Error("El paquete no contiene PokeMod_RutaDeDios");
}
function syncScripts() {
  const gameScripts = readScripts(path.join(GAME_DATA, "Scripts.rxdata"));
  const packageScripts = readScripts(path.join(PACKAGE, "Scripts.rxdata"));
  routeRow(packageScripts)[2] = routeRow(gameScripts)[2];
  fs.writeFileSync(path.join(PACKAGE, "Scripts.rxdata"), Buffer.from(marshalDump(packageScripts)));
  fs.mkdirSync(path.join(DIRECT, "Data"), { recursive: true });
  fs.copyFileSync(path.join(PACKAGE, "Scripts.rxdata"), path.join(DIRECT, "Data", "Scripts.rxdata"));
}
function syncFiles() {
  for (const file of DATA_FILES) {
    // Scripts.rxdata no viene del juego: el paquete lleva la copia corregida
    // (colisiones, guardado y Grandeur Club), no el original de pokemon_fire_ash.
    if (file === "Scripts.rxdata") continue;
    const source = path.join(GAME_DATA, file);
    const destination = path.join(DIRECT, "Data", file);
    if (!fs.existsSync(source)) throw new Error(`Falta el dato jugable ${source}`);
    fs.copyFileSync(source, destination);
  }
  for (const [sourceName, destinationName] of ASSET_FILES) {
    const source = path.join(ROOT, "pokemon_fire_ash", sourceName);
    const destination = path.join(DIRECT, destinationName);
    if (!fs.existsSync(source)) throw new Error(`Falta el recurso ${source}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}
function zipPackage() {
  execFileSync(process.execPath, [path.join(ROOT, "tools", "build_direct_package.mjs")], { stdio: "inherit" });
  return path.join(PACKAGE, "Fire_Ash_Paquete_Directo.zip");
}
function verify() {
  ensureFiles();
  const game = readScripts(path.join(GAME_DATA, "Scripts.rxdata"));
  const packaged = readScripts(path.join(PACKAGE, "Scripts.rxdata"));
  const gameRoute = routeRow(game);
  const packageRoute = routeRow(packaged);
  if (Buffer.from(gameRoute[2].bytes).compare(Buffer.from(packageRoute[2].bytes)) !== 0) {
    throw new Error("La sección PokeMod_RutaDeDios del paquete está desactualizada");
  }
  for (const file of DATA_FILES) {
    if (!fs.existsSync(path.join(DIRECT, "Data", file))) throw new Error(`Falta Data/${file} en el paquete`);
  }
  for (const [, destinationName] of ASSET_FILES) {
    if (!fs.existsSync(path.join(DIRECT, destinationName))) throw new Error(`Falta ${destinationName} en el paquete`);
  }
  const packagedScripts = fs.readFileSync(path.join(PACKAGE, "Scripts.rxdata"));
  const directScripts = fs.readFileSync(path.join(DIRECT, "Data", "Scripts.rxdata"));
  if (!packagedScripts.equals(directScripts)) {
    throw new Error("Paquete_directo/Data/Scripts.rxdata no es la copia corregida con las correcciones de distribución");
  }
  execFileSync(process.execPath, [path.join(ROOT, "tools", "build_direct_package.mjs"), "--verify"], { stdio: "inherit" });
  console.log("OK: Paquete_directo y ZIP sincronizados con PokeMod_RutaDeDios");
}

ensureFiles();
if (VERIFY_ONLY) {
  verify();
} else {
  syncScripts();
  syncFiles();
  const zip = zipPackage();
  console.log(`OK: paquete directo sincronizado (${path.relative(ROOT, zip)})`);
  verify();
}
