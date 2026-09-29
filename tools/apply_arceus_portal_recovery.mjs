#!/usr/bin/env node
/**
 * Recupera el portal de La Ruta de Dios cuando una partida antigua perdió el
 * switch 870. El portal queda visible y activable en Ciudad Puntaneva aunque
 * Volus se haya hablado antes de copiar todos los mapas.
 *
 * No toca partidas ni elimina ningún switch. Solo quita la condición de página
 * del evento "Portal a la Ruta de Dios" en Map625.rxdata.
 *
 * Uso:
 *   node tools/apply_arceus_portal_recovery.mjs
 *   node tools/apply_arceus_portal_recovery.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERIFY_ONLY = process.argv.includes("--verify");
const FILES = [
  path.join(ROOT, "pokemon_fire_ash", "Data", "Map625.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Map625.rxdata"),
];
const text = (value) => value instanceof RString ? value.text : String(value ?? "");

function patch(file) {
  if (!fs.existsSync(file)) throw new Error(`No existe ${file}`);
  const map = marshalLoad(fs.readFileSync(file));
  const events = map.getIvar("events");
  const pair = events.pairs.find(([, event]) => text(event.getIvar("name")) === "Portal a la Ruta de Dios");
  if (!pair) throw new Error(`No se encontró el portal en ${file}`);
  const event = pair[1];
  const pages = event.getIvar("pages");
  if (!pages?.length) throw new Error(`El portal no tiene página en ${file}`);
  const page = pages[0];
  const condition = page.getIvar("condition");
  const valid = condition.getIvar("switch1_valid");
  const switchId = Number(condition.getIvar("switch1_id"));
  const changed = Boolean(valid) || switchId === 870;
  if (changed && !VERIFY_ONLY) {
    condition.setIvar("switch1_valid", false);
    condition.setIvar("switch1_id", 1);
    fs.writeFileSync(file, Buffer.from(marshalDump(map)));
  }
  return { file, changed, x: Number(event.getIvar("x")), y: Number(event.getIvar("y")) };
}

const results = FILES.map(patch);
for (const result of results) {
  if (result.x !== 20 || result.y !== 14) throw new Error(`Portal fuera de posición: (${result.x}, ${result.y})`);
  console.log(`${VERIFY_ONLY ? "OK" : "Portal recuperado"}: ${result.file}`);
}
if (VERIFY_ONLY && results.some((result) => result.changed)) {
  throw new Error("Map625 todavía depende del switch 870");
}
