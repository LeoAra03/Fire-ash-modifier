#!/usr/bin/env node
/**
 * verify_arceus_phase_sprites.mjs — R18: un sprite distinto por fase.
 *
 * Comprueba, sobre lo INSTALADO (no sobre el generador), que:
 *   1. La sección PokeMod_RutaDeDios define la tabla de sufijos de fase y las
 *      funciones que cambian la hoja del jefe (fase, primigenia y restauración
 *      tras cada redibujado del motor).
 *   2. Cada fase (1-6) tiene su propio PNG existente y decodificable en
 *      Graphics/Pokemon/Front, y los seis son DISTINTOS entre sí (hash).
 *   3. La Forma Primigenia usa el Arceus clásico y también existe.
 *   4. Los sprites viajan en el paquete directo y en el ZIP raíz de entrega:
 *      sin ellos el jugador vería siempre el mismo Arceus.
 *
 * Uso: node tools/verify_arceus_phase_sprites.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";
import { readZipIndex } from "./lib/zip_writer.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const PACKAGE = path.join(ROOT, "Scripts_corregido");
const DIRECT = path.join(PACKAGE, "Paquete_directo");
const ROOT_ZIP = path.join(ROOT, "Fire-Ash-Scripts-Corregidos.zip");
const SUFIJOS = ["_F1", "_F2", "_F3", "_F4", "_F5", "_19"];

const fallos = [];
let comprobaciones = 0;
function ok(cond, mensaje) {
  comprobaciones += 1;
  if (cond) console.log(`  ✔ ${mensaje}`);
  else fallos.push(mensaje);
}

function rubyDe(rutaRx) {
  const scripts = marshalLoad(fs.readFileSync(rutaRx));
  const entrada = scripts.find(([, t]) => t && t.text === "PokeMod_RutaDeDios");
  if (!entrada) return null;
  return zlib.inflateSync(Buffer.from(entrada[2].bytes)).toString("utf8");
}

function verificarPng(file) {
  const data = fs.readFileSync(file);
  if (!data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
  let offset = 8, idat = [];
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    if (offset + 12 + length > data.length) return false;
    if (type === "IDAT") idat.push(data.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === "IEND") break;
  }
  try { return idat.length > 0 && zlib.inflateSync(Buffer.concat(idat)).length > 0; }
  catch { return false; }
}

// ---------------------------------------------------------------- 1. guion
for (const [etiqueta, ruta] of [
  ["juego", path.join(GAME, "Data", "Scripts.rxdata")],
  ["paquete", path.join(PACKAGE, "Scripts.rxdata")],
]) {
  const ruby = rubyDe(ruta);
  if (!ruby) { fallos.push(`no se encontró la sección PokeMod_RutaDeDios en ${etiqueta}`); continue; }
  ok(ruby.includes('RUTA_ARCEUS_SPRITE_SUFIJOS = ["_F1", "_F2", "_F3", "_F4", "_F5", "_19"].freeze'),
    `${etiqueta}: la tabla de sufijos declara un sprite por fase (1-5 de fase + 19 mil brazos)`);
  ok(ruby.includes("def pbArceusSpriteDeFase(") && ruby.includes('"Graphics/Pokemon/Front/ARCEUS" + sufijo'),
    `${etiqueta}: el nombre del archivo se compone en runtime (auditoría de recursos)`);
  ok(ruby.includes("def pbArceusFaseSprite(") && ruby.includes("def pbArceusPrimigeniaSprite(") &&
    ruby.includes("def pbArceusRestaurarSpriteDeFase"),
    `${etiqueta}: existen los tres cambios de hoja (fase, primigenia y restauración)`);
  ok(ruby.includes("pbArceusFaseSprite(phase, true)") && ruby.includes("pbArceusFaseSprite(phase)"),
    `${etiqueta}: la apertura del duelo y cada cambio de barra aplican la hoja de su fase`);
  ok(ruby.includes("pbArceusPrimigeniaSprite(true)") && ruby.includes("pbArceusRestaurarSpriteDeFase if"),
    `${etiqueta}: la primigenia estrena hoja y todo redibujado la conserva`);
  ok(ruby.includes("pbArceusFijarOrigen(sprite)"),
    `${etiqueta}: el origen del sprite se recalcula al cambiar de tamaño de hoja`);
}

// ------------------------------------------------------- 2. arte por fase
const dirFront = path.join(GAME, "Graphics", "Pokemon", "Front");
const dirFrontPaquete = path.join(DIRECT, "Graphics", "Pokemon", "Front");
const hashes = new Map();
const nombres = SUFIJOS.map((sufijo, i) => ({ fase: i + 1, archivo: `ARCEUS${sufijo}.png`, ruta: path.join(dirFront, `ARCEUS${sufijo}.png`) }));
for (const { fase, archivo, ruta } of nombres) {
  if (!fs.existsSync(ruta)) { fallos.push(`falta el sprite de la fase ${fase}: ${archivo}`); continue; }
  if (!verificarPng(ruta)) { fallos.push(`${archivo} no se decodifica como PNG`); continue; }
  const hash = crypto.createHash("sha256").update(fs.readFileSync(ruta)).digest("hex");
  if (hashes.has(hash)) fallos.push(`la fase ${fase} repite el mismo sprite que la fase ${hashes.get(hash)}`);
  else hashes.set(hash, fase);
  if (!fs.existsSync(path.join(dirFrontPaquete, archivo))) fallos.push(`${archivo} no viaja en Paquete_directo`);
}
ok(hashes.size === SUFIJOS.length && !fallos.some((f) => f.includes("fase")),
  `las ${SUFIJOS.length} fases tienen sprite propio, existente y distinto`);

const primigenia = path.join(dirFront, "ARCEUS.png");
ok(fs.existsSync(primigenia) && verificarPng(primigenia) && !hashes.has(crypto.createHash("sha256").update(fs.readFileSync(primigenia)).digest("hex")),
  "la Forma Primigenia usa el Arceus clásico, distinto de las seis fases");

// ------------------------------------------- 3. entrega (paquete y ZIP)
const zip = fs.existsSync(ROOT_ZIP) ? readZipIndex(ROOT_ZIP) : null;
if (!zip) fallos.push("falta Fire-Ash-Scripts-Corregidos.zip (ZIP de entrega)");
else {
  const faltan = nombres.map((n) => `Graphics/Pokemon/Front/${n.archivo}`).filter((n) => !zip.entries.has(n));
  ok(faltan.length === 0,
    faltan.length === 0
      ? `el ZIP de entrega trae los ${nombres.length} sprites de fase`
      : `al ZIP de entrega le faltan ${faltan.length} sprites de fase (${faltan.slice(0, 3).join(", ")})`);
}

if (fallos.length) {
  console.error("\nFALLOS:");
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}
console.log(`\nOK: Arceus cambia de sprite en cada fase (${comprobaciones} comprobaciones, ${SUFIJOS.length} fases distintas).`);
