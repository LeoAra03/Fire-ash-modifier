#!/usr/bin/env node
/**
 * verify_rom_nativo_colision.mjs
 *
 * Verifica la regla de colisión de los mapas ROMN desde los BITS 10–11 de la
 * celda original de la ROM (MapLayout Gen 3), no desde la tabla de
 * comportamientos del tileset. Los hacks suelen dejar el comportamiento a 0,
 * así que la regla no puede depender de él.
 *
 * Regla esperada (tools/rom_nativo_mapas.mjs):
 *   celda bloqueada ⇔ (celda & 0x0c00) ≠ 0
 *   paso del id instalado = 0x0f si la celda está bloqueada, 0 si no.
 *
 * Comprueba:
 *   1. Código: COLISION_MASK = 0x0c00, PASS_BLOCK = 0x0f, `blockedOf` basado en
 *      esa máscara y ninguna escritura en la tabla de comportamientos.
 *   2. Manifiesto: comportamiento = 0 en todos los tilesets; cada variante libre
 *      tiene paso 0 y cada sólida paso 0x0f.
 *   3. ROM (si está en `roms pokemon/` y se ha generado `mapas_npcs.json`):
 *      para cada celda de cada mapa de la campaña, los bits 10–11 de la ROM
 *      coinciden con el paso del id que quedó en Map*.rxdata. Las celdas que
 *      `abrirCeldasDeEventos` abre a propósito (bloqueadas en la ROM, con un
 *      evento encima) se cuentan aparte como excepción documentada.
 *
 * Uso:
 *   node tools/gba_maps_events.mjs --rom "roms pokemon/GlazedESPB6.gba"   # una vez
 *   node tools/qa/verify_rom_nativo_colision.mjs
 *
 * Sale con código 1 si la regla no se cumple.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../../web/js/marshal.js";
import { parseMap, tableGet, tableFromUserDef } from "../../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const GENERADOR = path.join(ROOT, "tools", "rom_nativo_mapas.mjs");
const MANIFIESTO = path.join(ROOT, "content", "rom_nativo.json");
const PLAN = path.join(ROOT, "content", "rom_campaigns_complete.json");
const ROM_DIR = path.join(ROOT, "roms pokemon");
const INDICE_ROM = path.join(ROOT, "reference", "roms_invitadas");

const COLISION_MASK = 0x0c00;
const PASS_BLOCK = 0x0f;
const BASE_ID = 384;

const errores = [];
const avisos = [];
const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));
const bloqueadaRom = (celda) => (celda & COLISION_MASK) !== 0;

// ── 1. regla en el código ─────────────────────────────────────────────────────
const fuente = fs.readFileSync(GENERADOR, "utf8");
const mascara = fuente.match(/^const COLISION_MASK = (0x[0-9a-fA-F]+);/m);
if (!mascara || Number(mascara[1]) !== COLISION_MASK) fallo(`COLISION_MASK no es ${hex(COLISION_MASK)} en el generador`);
const passBlock = fuente.match(/^const PASS_BLOCK = (0x[0-9a-fA-F]+);/m);
if (!passBlock || Number(passBlock[1]) !== PASS_BLOCK) fallo(`PASS_BLOCK no es ${hex(PASS_BLOCK)} en el generador`);
if (!/const blockedOf = \(celda\) => \(\(celda & COLISION_MASK\) >> 10\) !== 0;/.test(fuente)) {
  fallo("blockedOf no deriva la colisión de COLISION_MASK (bits 10–11)");
}
if (/comportamiento\[[^\]]*\]\s*=(?!=)/.test(fuente)) fallo("el generador escribe en la tabla de comportamientos");

// ── 2. manifiesto ─────────────────────────────────────────────────────────────
const manifiesto = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8"));
let tilesetsRevisados = 0, comportamientoNoNulo = 0;
for (const campana of Object.values(manifiesto.campaigns ?? {})) {
  for (const ts of campana.tilesets ?? []) {
    tilesetsRevisados += 1;
    if ((ts.comportamiento ?? []).some((v) => v !== 0)) comportamientoNoNulo += 1;
    const libres = new Set(), solidas = new Set();
    for (const [, [libre, solida]] of Object.entries(ts.porMetatile ?? {})) {
      libres.add(libre); solidas.add(solida);
    }
    for (const id of libres) if ((ts.pasajes?.[id] ?? 0) !== 0) fallo(`${ts.nombre}: variante libre ${id} con paso ${ts.pasajes[id]}`);
    for (const id of solidas) if ((ts.pasajes?.[id] ?? -1) !== PASS_BLOCK) fallo(`${ts.nombre}: variante sólida ${id} con paso ${ts.pasajes?.[id]}`);
    for (const id of libres) if (solidas.has(id)) fallo(`${ts.nombre}: id ${id} es libre y sólido a la vez`);
  }
}
if (comportamientoNoNulo) avisos.push(`${comportamientoNoNulo} tileset(s) con comportamiento ≠ 0 en el manifiesto (la regla no lo usa)`);

// ── 3. ROM contra instalación ─────────────────────────────────────────────────
const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const tilesetsRaw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
const pasajesPorNombre = new Map();
for (let i = 1; i < tilesetsRaw.length; i += 1) {
  const obj = tilesetsRaw[i];
  if (!obj) continue;
  const nombre = txt(obj.getIvar("@tileset_name"));
  if (nombre.startsWith("ROMN_")) pasajesPorNombre.set(nombre, tableFromUserDef(obj.getIvar("passages")).data);
}

const stats = { mapas: 0, celdas: 0, coinciden: 0, excepcionesEvento: 0, sinTraducir: 0, discrepan: 0 };
const ejemplos = [];
const campanasOmitidas = [];

for (const [clave, campana] of Object.entries(plan.campaigns ?? {})) {
  const romPath = path.join(ROM_DIR, campana.sourceRom);
  const indicePath = path.join(INDICE_ROM, campana.sourceRom.replace(/\.(gba|gb|gbc)$/i, ""), "mapas_npcs.json");
  if (!fs.existsSync(romPath) || !fs.existsSync(indicePath)) {
    campanasOmitidas.push(`${clave} (${campana.sourceRom})`);
    continue;
  }
  const rom = fs.readFileSync(romPath);
  const indice = new Map();
  for (const m of JSON.parse(fs.readFileSync(indicePath, "utf8")).mapas) indice.set(`${m.banco}:${m.indice}`, m);

  for (const bp of campana.maps) {
    const ficha = indice.get(`${bp.source.bank}:${bp.source.map}`);
    const archivo = path.join(DATA, `Map${String(bp.mapId).padStart(3, "0")}.rxdata`);
    if (!ficha || !fs.existsSync(archivo)) continue;

    // Cabecera MapLayout (mismos offsets que leerLayout): ptr de layout → width, height, mapPtr, tilesets.
    const layoutPtr = rom.readUInt32LE(ficha.header) - 0x08000000;
    const width = rom.readUInt32LE(layoutPtr), height = rom.readUInt32LE(layoutPtr + 4);
    const mapPtr = rom.readUInt32LE(layoutPtr + 12) - 0x08000000;
    const prim = rom.readUInt32LE(layoutPtr + 16), sec = rom.readUInt32LE(layoutPtr + 20);
    const clavePar = `${prim}+${sec}`;

    const obj = marshalLoad(fs.readFileSync(archivo));
    const mapa = parseMap(obj);
    if (mapa.width !== width || mapa.height !== height) {
      fallo(`Map${bp.mapId}: dimensiones instaladas ${mapa.width}×${mapa.height} ≠ ROM ${width}×${height}`);
      continue;
    }
    const tsNombre = manifiesto.campaigns?.[clave]?.maps?.[bp.mapId]?.tileset ?? "";
    const pasajes = pasajesPorNombre.get(tsNombre);
    if (!pasajes) { fallo(`Map${bp.mapId}: tileset ${tsNombre} no instalado`); continue; }

    const conEvento = new Set();
    for (const [, ev] of obj.getIvar("@events").pairs) conEvento.add(`${Number(ev.getIvar("@x"))},${Number(ev.getIvar("@y"))}`);

    stats.mapas += 1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x;
        const crudo = rom.readUInt16LE(mapPtr + i * 2);
        const v = tableGet(mapa.table, x, y, 0);
        stats.celdas += 1;
        if (v === 0) { stats.sinTraducir += 1; continue; }
        const esperado = bloqueadaRom(crudo) ? PASS_BLOCK : 0;
        const real = v < pasajes.length ? pasajes[v] : -1;
        if (real === esperado) { stats.coinciden += 1; continue; }
        if (esperado === PASS_BLOCK && real === 0 && conEvento.has(`${x},${y}`)) { stats.excepcionesEvento += 1; continue; }
        stats.discrepan += 1;
        if (ejemplos.length < 6) ejemplos.push(`Map${bp.mapId} (${x},${y}) celda ROM ${hex(crudo)} → id ${v}, paso ${real}, se esperaba ${esperado}`);
      }
    }
  }
}

if (stats.discrepan) fallo(`${stats.discrepan} celda(s) cuya colisión no sigue los bits 10–11 de la ROM`);
if (stats.sinTraducir) avisos.push(`${stats.sinTraducir} celda(s) instaladas con id 0 (metatile sin traducir)`);
if (campanasOmitidas.length) avisos.push(`campañas sin ROM o sin índice (omitidas): ${campanasOmitidas.join(", ")}`);

// ── resultado ─────────────────────────────────────────────────────────────────
console.log(`Tilesets ROMN revisados: ${tilesetsRevisados} · comportamiento ≠ 0: ${comportamientoNoNulo}`);
console.log(`Mapas comparados con la ROM: ${stats.mapas} · celdas: ${stats.celdas}`);
console.log(`  coinciden: ${stats.coinciden} · excepciones por evento (documentadas): ${stats.excepcionesEvento} · discrepan: ${stats.discrepan}`);
for (const a of avisos) console.log(`  AVISO  ${a}`);
for (const e of errores) console.log(`  FALLO  ${e}`);
for (const e of ejemplos) console.log(`  DETALLE  ${e}`);
if (errores.length) {
  console.log(`✘ La regla de colisión no se cumple (${errores.length} problema(s)).`);
  process.exit(1);
}
console.log(`OK: la colisión de cada celda sale de los bits 10–11 de la ROM, sin depender del comportamiento.`);

function fallo(msg) { errores.push(msg); }
function hex(n) { return `0x${n.toString(16).padStart(4, "0")}`; }
