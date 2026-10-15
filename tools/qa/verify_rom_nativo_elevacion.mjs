#!/usr/bin/env node
/**
 * verify_rom_nativo_elevacion.mjs
 *
 * Comprueba que la ELEVACIÓN de cada celda de los mapas ROMN (bits 12–15 del
 * MapLayout de la ROM) se conserva en Fire Ash, celda a celda.
 *
 * Fuentes:
 *   · content/rom_nativo.json → `elevaciones` por mapa: valores de elevación
 *     que la ROM usa en ese layout (sacados de cada celda original).
 *   · pokemon_fire_ash/Data/Map*.rxdata y Tilesets.rxdata → lo que quedó
 *     instalado. Un mapa conserva la elevación si lleva el dato en alguna
 *     forma: bits ≥ 4096 en sus celdas, una cuarta capa, o una tabla de
 *     prioridades no nula en su tileset.
 *
 * Hoy la traducción a ids RMXP (`traduce` en tools/rom_nativo_mapas.mjs) se
 * queda solo con `celda & 0x3ff`, así que la elevación se pierde. Este
 * verificador lo documenta: sale con código 1 mientras no se corrija.
 *
 * No necesita las ROM. Uso:
 *   node tools/qa/verify_rom_nativo_elevacion.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../../web/js/marshal.js";
import { parseMap, tableFromUserDef } from "../../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const MANIFIESTO = path.join(ROOT, "content", "rom_nativo.json");
const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));

// ── fuente: elevaciones de la ROM por mapa ─────────────────────────────────────
const manifiesto = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8"));
const conElevacion = new Map(); // mapId -> elevaciones distintas de 0
for (const campana of Object.values(manifiesto.campaigns ?? {})) {
  for (const [id, mapa] of Object.entries(campana.maps ?? {})) {
    const elev = (mapa.elevaciones ?? []).filter((v) => v !== 0);
    if (elev.length) conElevacion.set(Number(id), elev);
  }
}

// ── instalado: tilesets ROMN con su tabla de prioridades ───────────────────────
const tilesets = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
const prioridadesNoNulas = new Set(); // ids de tileset ROMN con prioridad ≠ 0
const romnPorId = new Map();
for (let i = 1; i < tilesets.length; i += 1) {
  const obj = tilesets[i];
  if (!obj) continue;
  const nombre = txt(obj.getIvar("@tileset_name"));
  if (!nombre.startsWith("ROMN_")) continue;
  romnPorId.set(i, nombre);
  const pr = tableFromUserDef(obj.getIvar("priorities"));
  if (pr.data.some((v) => v !== 0)) prioridadesNoNulas.add(i);
}

// ── instalado: mapas ───────────────────────────────────────────────────────────
let mapasRevisados = 0;
const sinConservar = [];
let celdasConBits = 0;
for (const archivo of fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f))) {
  const id = Number(archivo.match(/\d+/)[0]);
  if (!conElevacion.has(id)) continue;
  const obj = marshalLoad(fs.readFileSync(path.join(DATA, archivo)));
  const tsId = Number(obj.getIvar("tileset_id"));
  if (!romnPorId.has(tsId)) continue;
  mapasRevisados += 1;
  const mapa = parseMap(obj);
  let bits = 0;
  for (const v of mapa.table.data) if (v >= 4096) bits += 1;
  celdasConBits += bits;
  const cuartaCapa = mapa.table.z > 3;
  const prioridad = prioridadesNoNulas.has(tsId);
  if (bits === 0 && !cuartaCapa && !prioridad) {
    sinConservar.push({ id, elevaciones: conElevacion.get(id) });
  }
}

console.log(`Mapas ROMN con elevación en la ROM: ${conElevacion.size}`);
console.log(`Mapas instalados revisados: ${mapasRevisados}`);
console.log(`Celdas instaladas con bits de elevación (≥ 4096): ${celdasConBits}`);
console.log(`Tilesets ROMN con tabla de prioridades no nula: ${prioridadesNoNulas.size}`);
if (sinConservar.length) {
  const ejemplos = sinConservar.slice(0, 5).map((m) => `Map${m.id} [${m.elevaciones.join(",")}]`).join(" ");
  console.log(`  FALLO  ${sinConservar.length} mapa(s) pierden la elevación de la ROM (p. ej. ${ejemplos})`);
  console.log("✘ La elevación no se conserva celda a celda: tools/rom_nativo_mapas.mjs traduce con `celda & 0x3ff`.");
  process.exit(1);
}
console.log("OK: la elevación de cada mapa ROMN queda en la instalación.");
