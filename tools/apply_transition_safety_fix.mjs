#!/usr/bin/env node
/**
 * Prevents Scene_Map from concatenating nil transition_name to a String.
 * Older saves/events can leave transition_name unset; in that case use the
 * engine's default transition just as for an empty name.
 *
 * Usage:
 *   node tools/apply_transition_safety_fix.mjs
 *   node tools/apply_transition_safety_fix.mjs --verify
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
const NEW_BLOCK = [
  "      transition_name = $game_temp.transition_name.to_s",
  '      if transition_name == ""',
  "        Graphics.transition(20)",
  "      else",
  '        Graphics.transition(40, "Graphics/Transitions/" + transition_name)',
  "      end",
].join("\r\n");
const OLD_BLOCK = [
  '      if $game_temp.transition_name == ""',
  "        Graphics.transition(20)",
  "      else",
  '        Graphics.transition(40, "Graphics/Transitions/" + $game_temp.transition_name)',
  "      end",
].join("\r\n");

function findSceneMap(scripts) {
  const row = scripts.find((entry) => text(entry[1]) === "Scene_Map");
  if (!row) throw new Error("No se encontró la sección Scene_Map");
  return row;
}

function inspect() {
  if (!fs.existsSync(CORRECTED)) throw new Error(`Falta ${CORRECTED}`);
  const scripts = marshalLoad(fs.readFileSync(CORRECTED));
  const row = findSceneMap(scripts);
  const code = inflate(row);
  return { scripts, row, code, fixed: code.includes(NEW_BLOCK) };
}

function verifyArtifacts() {
  const state = inspect();
  if (!state.fixed) throw new Error("Scene_Map todavía concatena transition_name sin convertirlo a String");
  const correctedBytes = fs.readFileSync(CORRECTED);
  if (!fs.existsSync(DIRECT) || !correctedBytes.equals(fs.readFileSync(DIRECT))) {
    throw new Error("Paquete_directo/Data/Scripts.rxdata no coincide con Scripts_corregido/Scripts.rxdata");
  }
  const zip = readZipIndex(ZIP);
  if (!correctedBytes.equals(readZipEntry(zip, "Data/Scripts.rxdata"))) {
    throw new Error("El ZIP no contiene la corrección de transition_name");
  }
  console.log("OK: Scene_Map usa la transición predeterminada cuando transition_name es nil/vacío");
  console.log("OK: Scripts_corregido, Paquete_directo y ZIP están sincronizados");
}

if (VERIFY_ONLY) {
  verifyArtifacts();
} else {
  const state = inspect();
  if (!state.fixed) {
    if (!state.code.includes(OLD_BLOCK)) throw new Error("Scene_Map: no se encontró el bloque de transición esperado");
    state.row[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(state.code.replace(OLD_BLOCK, NEW_BLOCK), "utf8")));
    fs.writeFileSync(CORRECTED, Buffer.from(marshalDump(state.scripts)));
  }
  fs.copyFileSync(CORRECTED, DIRECT);
  execFileSync(process.execPath, [path.join(ROOT, "tools", "build_direct_package.mjs")], { stdio: "inherit" });
  verifyArtifacts();
}
