#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../web/js/marshal.js";
import { readZipEntry, readZipIndex } from "./lib/zip_writer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORRECTED = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
const DIRECT = path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Scripts.rxdata");
const ZIP = path.join(ROOT, "Scripts_corregido", "Fire_Ash_Paquete_Directo.zip");
const scripts = marshalLoad(fs.readFileSync(CORRECTED));
const getCode = (name) => {
  const row = scripts.find((entry) => (entry[1] instanceof RString ? entry[1].text : String(entry[1])) === name);
  assert.ok(row, `debe existir la sección ${name}`);
  return zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
};

const safety = getCode("Game_Screen");
assert.match(safety, /module PokeModToneSafety/);
assert.ok(safety.includes("value.match(") && safety.includes("match.captures.map"), "solo interpreta el formato Tone.new conocido");
assert.match(safety, /Tone\.new\(\*match\.captures\.map \{ \|component\| component\.to_f \}\)/);
assert.match(safety, /return Tone\.new\(0, 0, 0, 0\)/);
for (const name of ["Game_Screen", "Game_Picture"]) {
  const code = getCode(name);
  assert.ok(code.includes("tone = PokeModToneSafety.normalize(tone)"), `${name} normaliza el tono recibido`);
  assert.ok(code.includes("@tone = PokeModToneSafety.normalize(@tone)"), `${name} repara el tono actual`);
  assert.ok(code.includes("@tone_target = PokeModToneSafety.normalize(@tone_target)"), `${name} repara el tono objetivo`);
}

const corrected = fs.readFileSync(CORRECTED);
assert.ok(corrected.equals(fs.readFileSync(DIRECT)), "el paquete directo usa el Scripts.rxdata corregido");
const archive = readZipIndex(ZIP);
assert.ok(corrected.equals(readZipEntry(archive, "Data/Scripts.rxdata")), "el ZIP incluye el Scripts.rxdata corregido");
console.log("tone safety: recuperación String→Tone, pantallas/imágenes y paquete OK");
