#!/usr/bin/env node
/**
 * Makes Game_Screen/Game_Picture resilient to tone values that an older map,
 * save, editor, or mobile runtime may have stored as the Ruby source string
 * "Tone.new(r, g, b, gray)" instead of an RGSS Tone object.
 *
 * The source game scripts remain untouched. This updates the distributable
 * corrected Scripts.rxdata and keeps the direct package/ZIP reproducible.
 *
 * Usage:
 *   node tools/apply_tone_safety_fix.mjs
 *   node tools/apply_tone_safety_fix.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";
import { readZipEntry, readZipIndex } from "./lib/zip_writer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORRECTED = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
const DIRECT = path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Scripts.rxdata");
const ZIP = path.join(ROOT, "Scripts_corregido", "Fire_Ash_Paquete_Directo.zip");
const VERIFY_ONLY = process.argv.includes("--verify");
const text = (value) => value instanceof RString ? value.text : String(value ?? "");
const inflate = (row) => zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
const compress = (row, source) => { row[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(source, "utf8"))); };

const SAFETY_MODULE = String.raw`module PokeModToneSafety
  # Convierte valores corruptos heredados sin evaluar código arbitrario.
  def self.normalize(value)
    return value if value.is_a?(Tone)
    if value.is_a?(String)
      match = value.match(/\ATone\.new\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\z/)
      return Tone.new(*match.captures.map { |component| component.to_f }) if match
    end
    # Un formato desconocido se neutraliza en lugar de cerrar el juego.
    return Tone.new(0, 0, 0, 0)
  end
end

`;
const NORMALIZE_START = "    tone = PokeModToneSafety.normalize(tone)";
const NORMALIZE_CURRENT = "    @tone = PokeModToneSafety.normalize(@tone)\r\n    @tone_target = PokeModToneSafety.normalize(@tone_target)";

function section(scripts, name) {
  return scripts.find((row) => text(row[1]) === name);
}

function patchScreen(code) {
  let next = code;
  if (!next.includes("module PokeModToneSafety")) {
    if (!next.includes("class Game_Screen")) throw new Error("Game_Screen: no se encontró la clase esperada");
    next = SAFETY_MODULE + next;
  }
  const start = "  def start_tone_change(tone, duration)\r\n";
  const startWithFix = `${start}${NORMALIZE_START}\r\n`;
  if (!next.includes(startWithFix)) {
    if (!next.includes(start)) throw new Error("Game_Screen: no se encontró start_tone_change");
    next = next.replace(start, startWithFix);
  }
  const update = "  def update\r\n";
  const updateWithFix = `${update}${NORMALIZE_CURRENT}\r\n`;
  if (!next.includes(updateWithFix)) {
    if (!next.includes(update)) throw new Error("Game_Screen: no se encontró update");
    next = next.replace(update, updateWithFix);
  }
  return next;
}

function patchPicture(code) {
  let next = code;
  const start = "  def start_tone_change(tone, duration)\r\n";
  const startWithFix = `${start}${NORMALIZE_START}\r\n`;
  if (!next.includes(startWithFix)) {
    if (!next.includes(start)) throw new Error("Game_Picture: no se encontró start_tone_change");
    next = next.replace(start, startWithFix);
  }
  const update = "  def update\r\n";
  const updateWithFix = `${update}${NORMALIZE_CURRENT}\r\n`;
  if (!next.includes(updateWithFix)) {
    if (!next.includes(update)) throw new Error("Game_Picture: no se encontró update");
    next = next.replace(update, updateWithFix);
  }
  return next;
}

function inspect() {
  if (!fs.existsSync(CORRECTED)) throw new Error(`Falta ${CORRECTED}`);
  const scripts = marshalLoad(fs.readFileSync(CORRECTED));
  const screen = section(scripts, "Game_Screen");
  const picture = section(scripts, "Game_Picture");
  if (!screen || !picture) throw new Error("Faltan las secciones Game_Screen/Game_Picture");
  const screenCode = inflate(screen);
  const pictureCode = inflate(picture);
  const fixed = screenCode.includes("module PokeModToneSafety") &&
    screenCode.includes(NORMALIZE_START) && screenCode.includes(NORMALIZE_CURRENT) &&
    pictureCode.includes(NORMALIZE_START) && pictureCode.includes(NORMALIZE_CURRENT) &&
    screenCode.includes("return Tone.new(0, 0, 0, 0)");
  return { scripts, screen, picture, screenCode, pictureCode, fixed };
}

if (VERIFY_ONLY) {
  const state = inspect();
  if (!state.fixed) throw new Error("Scripts_corregido/Scripts.rxdata no contiene la protección de Tone");
  const correctedBytes = fs.readFileSync(CORRECTED);
  if (!fs.existsSync(DIRECT) || !correctedBytes.equals(fs.readFileSync(DIRECT))) {
    throw new Error("Paquete_directo/Data/Scripts.rxdata no coincide con Scripts_corregido/Scripts.rxdata");
  }
  const zip = readZipIndex(ZIP);
  const packagedBytes = readZipEntry(zip, "Data/Scripts.rxdata");
  if (!correctedBytes.equals(packagedBytes)) {
    throw new Error("Fire_Ash_Paquete_Directo.zip no incluye la protección de Tone actualizada");
  }
  console.log("OK: Game_Screen y Game_Picture recuperan tonos guardados como String");
  console.log("OK: Scripts_corregido, Paquete_directo y ZIP contienen la misma corrección");
} else {
  const state = inspect();
  const screenCode = patchScreen(state.screenCode);
  const pictureCode = patchPicture(state.pictureCode);
  compress(state.screen, screenCode);
  compress(state.picture, pictureCode);
  fs.writeFileSync(CORRECTED, Buffer.from(marshalDump(state.scripts)));
  fs.copyFileSync(CORRECTED, DIRECT);
  execFileSync(process.execPath, [path.join(ROOT, "tools", "build_direct_package.mjs")], { stdio: "inherit" });
  console.log("Protección de tonos aplicada a Game_Screen y Game_Picture.");
}
