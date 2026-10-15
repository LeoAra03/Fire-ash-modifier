#!/usr/bin/env node
/**
 * verify_rom_nativo_base_id.mjs
 *
 * Confirma que los tilesets nativos ROMN_ (generados por tools/rom_nativo_mapas.mjs
 * a partir de metatiles de 16×16 escalados ×2 a bloques RMXP de 32×32) respetan
 * la convención de ids de RMXP:
 *
 *   · 0–47 vacío, 48–383 autotiles: son ids reservados y NINGÚN bloque nativo
 *     puede caer ahí (no pisa los tiles originales del motor);
 *   · 384 es el primer tile normal y el id local del tileset ROMN es 384 + k,
 *     donde k es la posición del bloque en la rejilla de 8 columnas de 32 px.
 *
 * Comprueba, en orden:
 *   1. BASE_ID = 384 en el generador (`tools/rom_nativo_mapas.mjs`).
 *   2. Manifiesto (`content/rom_nativo.json`): para cada tileset, cada metatile
 *      tiene variantes libre/sólida con ids en [384, 384 + tiles), sin colisiones,
 *      y el conjunto de ids cubre exactamente 384…384+tiles−1; la tabla de pasajes
 *      mide 384 + tiles; ninguna celda de mapa apunta a 1–383 ni fuera de rango.
 *   3. Instalación (`pokemon_fire_ash/Data/Tilesets.rxdata`): cada tileset ROMN
 *      aparece una sola vez, con su nombre, su tabla de pasajes del tamaño
 *      correcto y sin entradas ROMN tras las originales.
 *   4. Mapas instalados que usan un tileset ROMN: cada celda con tile normal
 *      apunta a [384, 384 + tiles) de SU tileset; ningún tile 1–383 aparece.
 *
 * Nota: los tilesets ROMN salen de ROM GBA (rom_nativo_mapas.mjs). La ROM GBC
 * FactoryAdventure.gb no interviene en este pipeline y no queda cubierta aquí.
 *
 * No necesita las ROM. Uso:
 *   node tools/qa/verify_rom_nativo_base_id.mjs
 * Sale con código 1 si algo no cuadra.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../../web/js/marshal.js";
import { parseMap, tableFromUserDef, tableGet } from "../../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const GENERADOR = path.join(ROOT, "tools", "rom_nativo_mapas.mjs");
const MANIFIESTO = path.join(ROOT, "content", "rom_nativo.json");

const BASE_ID = 384;      // primer tile normal de RMXP (0–47 vacío, 48–383 autotiles)
const RESERVADO_MAX = BASE_ID - 1;

const errores = [];
const avisos = [];
const fallo = (msg) => errores.push(msg);
const aviso = (msg) => avisos.push(msg);
const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));

// ── 1. constante en el generador ──────────────────────────────────────────────
const fuente = fs.readFileSync(GENERADOR, "utf8");
const m = fuente.match(/^const BASE_ID = (\d+);/m);
if (!m) fallo(`${path.relative(ROOT, GENERADOR)}: no se encuentra «const BASE_ID = …»`);
else if (Number(m[1]) !== BASE_ID) fallo(`BASE_ID del generador = ${m[1]}, se esperaba ${BASE_ID}`);

// ── 2. manifiesto ─────────────────────────────────────────────────────────────
const manifiesto = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8"));
const tilesetsPorNombre = new Map(); // nombre -> { ...ts, campana }
const mapasManifiesto = []; // { id, campana, ts, celdas: Uint16Array }

const deB64 = (text) => {
  const buf = Buffer.from(text, "base64");
  const out = new Uint16Array(buf.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = buf.readUInt16LE(i * 2);
  return out;
};

for (const [clave, campana] of Object.entries(manifiesto.campaigns ?? {})) {
  for (const ts of campana.tilesets ?? []) {
    const nombre = ts.nombre;
    if (tilesetsPorNombre.has(nombre)) fallo(`${nombre}: nombre repetido en el manifiesto`);
    tilesetsPorNombre.set(nombre, { ...ts, campana: clave });

    const tiles = ts.tiles;
    const total = ts.total ?? (BASE_ID + tiles);
    if (total !== BASE_ID + tiles) fallo(`${nombre}: total ${total} ≠ ${BASE_ID} + ${tiles} tiles`);
    if (!Array.isArray(ts.pasajes) || ts.pasajes.length !== BASE_ID + tiles) {
      fallo(`${nombre}: tabla de pasajes de ${ts.pasajes?.length} entradas, se esperaban ${BASE_ID + tiles}`);
    }

    const ids = new Map(); // id -> "metatile/variante"
    for (const [metatile, fila] of Object.entries(ts.porMetatile ?? {})) {
      if (!Array.isArray(fila) || fila.length !== 2) { fallo(`${nombre}: metatile ${metatile} sin fila [libre, sólida]`); continue; }
      fila.forEach((id, variante) => {
        const etiqueta = `${metatile}/${variante ? "sólida" : "libre"}`;
        if (!Number.isInteger(id) || id < BASE_ID || id >= BASE_ID + tiles) {
          fallo(`${nombre}: ${etiqueta} → id ${id} fuera de [${BASE_ID}, ${BASE_ID + tiles})`);
          return;
        }
        if (ids.has(id)) fallo(`${nombre}: id ${id} usado por ${ids.get(id)} y ${etiqueta}`);
        ids.set(id, etiqueta);
      });
    }
    // Cada id local debe corresponder a un bloque real de la imagen: k = id − 384 ∈ [0, tiles).
    if (ids.size !== tiles) fallo(`${nombre}: ${ids.size} ids distintos en metatiles, se declaran ${tiles} tiles`);
    for (let k = 0; k < tiles; k += 1) {
      if (!ids.has(BASE_ID + k)) { fallo(`${nombre}: hueco, falta el id ${BASE_ID + k} (bloque ${k})`); break; }
    }

    // Celdas del mapa: ningún tile 1–383 ni fuera del rango del tileset.
    for (const [idMapa, mapa] of Object.entries(campana.maps ?? {})) {
      if (mapa.tileset !== nombre) continue;
      const celdas = deB64(mapa.celdas);
      mapasManifiesto.push({ id: Number(idMapa), campana: clave, ts: nombre, celdas, tiles });
    }
  }
}

let celdasTotales = 0, celdasVacias = 0;
for (const { id, ts, celdas, tiles } of mapasManifiesto) {
  for (const v of celdas) {
    celdasTotales += 1;
    if (v === 0) { celdasVacias += 1; continue; }
    if (v >= 1 && v <= RESERVADO_MAX) { fallo(`manifiesto Map${id} (${ts}): celda con id reservado ${v}`); break; }
    if (v > BASE_ID + tiles - 1) { fallo(`manifiesto Map${id} (${ts}): celda ${v} fuera de [${BASE_ID}, ${BASE_ID + tiles})`); break; }
  }
}
if (celdasVacias) aviso(`manifiesto: ${celdasVacias} de ${celdasTotales} celdas valen 0 (metatile sin traducir)`);

// ── 3. Tilesets.rxdata instalado ──────────────────────────────────────────────
const tilesetsRaw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
const instalados = new Map(); // nombre -> { id, obj, pasajes }
let primeraRomn = -1, ultimaNoRomn = -1;
for (let i = 1; i < tilesetsRaw.length; i += 1) {
  const obj = tilesetsRaw[i];
  if (!obj) continue;
  const nombre = txt(obj.getIvar("@tileset_name"));
  if (nombre.startsWith("ROMN_")) {
    if (primeraRomn < 0) primeraRomn = i;
    if (instalados.has(nombre)) fallo(`Tilesets.rxdata: ${nombre} aparece dos veces (ids ${instalados.get(nombre).id} y ${i})`);
    instalados.set(nombre, { id: i, obj });
  } else {
    ultimaNoRomn = i;
  }
}
if (ultimaNoRomn > primeraRomn && primeraRomn > 0) {
  fallo(`Tilesets.rxdata: hay tilesets originales (id ${ultimaNoRomn}) después de los ROMN (desde ${primeraRomn})`);
}
for (const [nombre, ts] of tilesetsPorNombre) {
  const inst = instalados.get(nombre);
  if (!inst) { fallo(`${nombre}: no está instalado en Tilesets.rxdata`); continue; }
  let pasajes;
  try { pasajes = tableFromUserDef(inst.obj.getIvar("passages")); }
  catch (e) { fallo(`${nombre}: tabla de pasajes ilegible (${e.message})`); continue; }
  if (pasajes.x !== BASE_ID + ts.tiles) fallo(`${nombre}: pasajes instalados de ${pasajes.x} entradas, se esperaban ${BASE_ID + ts.tiles}`);
  // Las entradas 0–383 son ids reservados que ningún mapa nativo usa: no deben llevar paso sólido propio.
  for (let k = 0; k < Math.min(BASE_ID, pasajes.data.length); k += 1) {
    if (pasajes.data[k] !== 0) { fallo(`${nombre}: pasaje ${pasajes.data[k]} escrito en el id reservado ${k}`); break; }
  }
}

// ── 4. mapas instalados que usan un tileset ROMN ──────────────────────────────
const tilesetIdPorNombre = new Map([...instalados].map(([n, v]) => [v.id, n]));
const tilesetsROMN = new Map([...instalados].map(([n, v]) => [v.id, { nombre: n, tiles: tilesetsPorNombre.get(n)?.tiles ?? 0 }]));
let mapasNativos = 0, celdasInstaladas = 0, reservadosInstalados = 0, fueraDeRango = 0;
for (const archivo of fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f))) {
  const obj = marshalLoad(fs.readFileSync(path.join(DATA, archivo)));
  const tsId = Number(obj.getIvar("tileset_id"));
  const ts = tilesetsROMN.get(tsId);
  if (!ts) continue;
  mapasNativos += 1;
  const mapa = parseMap(obj);
  const t = mapa.table;
  for (let z = 0; z < t.z; z += 1) {
    for (let y = 0; y < t.y; y += 1) {
      for (let x = 0; x < t.x; x += 1) {
        const v = tableGet(t, x, y, z);
        if (v === 0) continue;
        celdasInstaladas += 1;
        if (v <= RESERVADO_MAX) { reservadosInstalados += 1; continue; }
        if (v >= BASE_ID + ts.tiles) fueraDeRango += 1;
      }
    }
  }
}
if (reservadosInstalados) fallo(`mapas instalados: ${reservadosInstalados} celdas usan ids reservados 1–${RESERVADO_MAX} con tileset ROMN`);
if (fueraDeRango) fallo(`mapas instalados: ${fueraDeRango} celdas apuntan fuera del rango de su tileset ROMN`);

// ── resultado ─────────────────────────────────────────────────────────────────
console.log(`BASE_ID (generador): ${m ? m[1] : "?"} · tilesets en manifiesto: ${tilesetsPorNombre.size} · instalados: ${instalados.size}`);
console.log(`Celdas de manifiesto: ${celdasTotales} · mapas instalados con ROMN: ${mapasNativos} · celdas instaladas no vacías: ${celdasInstaladas}`);
for (const a of avisos) console.log(`  AVISO  ${a}`);
if (errores.length) {
  for (const e of errores.slice(0, 40)) console.log(`  FALLO  ${e}`);
  if (errores.length > 40) console.log(`  … y ${errores.length - 40} más`);
  console.log(`✘ ${errores.length} problema(s)`);
  process.exit(1);
}
console.log(`OK: BASE_ID = ${BASE_ID}; todos los bloques ROMN empiezan en ${BASE_ID} y ninguno usa ids reservados 0–${RESERVADO_MAX}.`);
