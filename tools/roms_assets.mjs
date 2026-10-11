#!/usr/bin/env node
/**
 * roms_assets.mjs — extracción REAL de mapas y sprites de los ROMs invitados.
 *
 * Sustituye la «reconstrucción con donantes» por una conversión literal: cada
 * mapa se lee del ROM célula a célula, se compone con sus tilesets, y se empaqueta
 * como un tileset de RPG Maker XP (256 px de ancho) más su PNG de mapa. Los NPC
 * de overworld salen de la tabla de gráficos del ROM y se convierten al formato
 * de charset que usa el motor de Essentials.
 *
 * Salida (por ROM, dentro de `<out>/<slug>/`):
 *   tilesets/<slug>_TS_<prim>_<sec>.png   atlas de metatiles usados (32 px por celda)
 *   mapas/Map<ID>.png                     render exacto del mapa
 *   npcs/<slug>_GFX_<id>.png              charset 4×4 de 16×32 (formato RMXP)
 *   catalogo.json                         puente: mapa → tileset, celdas, colisiones
 *
 * Uso:
 *   node tools/roms_assets.mjs --rom <archivo.gba> --slug glazed --out <dir>
 *   node tools/roms_assets.mjs --rom ... --solo 0,15,42       (mapas concretos)
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import {
  cargarROM, buscarMapLayouts, leerBloques, parTilesets, renderMetatile,
  metatileDe, colisionDe, u16, u32, esPtr, offsetDe,
} from "./lib/gba_map_assets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (nombre, fallback = null) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
};

const ROM = arg("rom");
const SLUG = arg("slug", "invitado");
const OUT = path.resolve(arg("out", path.join(ROOT, "reference", "roms_invitados_extraidos")));
const SOLO = arg("solo");
const SIN_PNG = process.argv.includes("--sin-png");
const ESCALA = Number(arg("escala", "2"));       // 16 px GBA → 32 px RMXP
const TILE = 16 * ESCALA;

if (!ROM) throw new Error("indica --rom <archivo.gba>");

/* ────────────────────────────── utilidades PNG ─────────────────────────── */

/** Escribe un PNG RGBA (sin dependencias): filtro 0 por línea. */
function pngRGBA(ancho, alto, rgba) {
  const filas = Buffer.alloc((ancho * 4 + 1) * alto);
  const fuente = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.length);
  for (let y = 0; y < alto; y++) {
    filas[y * (ancho * 4 + 1)] = 0;
    fuente.copy(filas, y * (ancho * 4 + 1) + 1, y * ancho * 4, (y + 1) * ancho * 4);
  }
  const chunk = (tipo, datos) => {
    const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, "latin1"), datos]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo) >>> 0);
    return Buffer.concat([largo, cuerpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(filas, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
let TABLA_CRC = null;
function crc32(buf) {
  if (!TABLA_CRC) {
    TABLA_CRC = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLA_CRC[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* ─────────────────────────────── sprites ───────────────────────────────── */

const TALLAS_NPC = new Set([128, 256, 512, 576, 768, 1024, 1152, 2048, 2304, 4608]);
const CAMPO_IMAGENES = 0x1c;
const CAMPO_PALETAS = 0x20;

/** Tabla de gráficos de overworld: array de punteros con imágenes y paleta. */
function buscarTablaNpc(data, { umbral = 30 } = {}) {
  const len = data.length;
  const candidatos = [];
  for (let off = 0; off + umbral * 4 < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < umbral; i++) {
      const p = u32(data, off + i * 4);
      if (!esPtr(p, len)) break;
      const o = offsetDe(p);
      if (!TALLAS_NPC.has(u16(data, o + 6))) break;
      const arr = u32(data, o + CAMPO_IMAGENES), pal = u32(data, o + CAMPO_PALETAS);
      if (!esPtr(arr, len) || !esPtr(pal, len)) break;
      if (!esPtr(u32(data, offsetDe(arr)), len)) break;
      ok++;
    }
    if (ok >= umbral) {
      let n = ok;
      while (off + n * 4 + 4 < len) {
        const p = u32(data, off + n * 4);
        if (!esPtr(p, len)) break;
        const o = offsetDe(p);
        if (!TALLAS_NPC.has(u16(data, o + 6))) break;
        if (!esPtr(u32(data, o + CAMPO_IMAGENES), len) || !esPtr(u32(data, o + CAMPO_PALETAS), len)) break;
        if (!esPtr(u32(data, offsetDe(u32(data, o + CAMPO_IMAGENES))), len)) break;
        n++;
      }
      candidatos.push({ off, n });
      off += n * 4 - 4;
    }
  }
  return candidatos.sort((a, b) => b.n - a.n)[0] ?? null;
}

/** Estructura de un gráfico de overworld del ROM. */
function leerGraficoNpc(data, tablaOff, id) {
  const len = data.length;
  const p = u32(data, tablaOff + id * 4);
  if (!esPtr(p, len)) return null;
  const o = offsetDe(p);
  const size = u16(data, o + 6);
  const ancho = u16(data, o + 8), alto = u16(data, o + 10);
  const arr = u32(data, o + CAMPO_IMAGENES), palPtr = u32(data, o + CAMPO_PALETAS);
  if (!esPtr(arr, len) || !esPtr(palPtr, len)) return null;
  const frames = [];
  let i = 0;
  while (i < 64) {
    const img = u32(data, offsetDe(arr) + i * 8);
    if (!esPtr(img, len)) break;
    const tam = u16(data, offsetDe(arr) + i * 8 + 4) || size;
    frames.push({ ptr: img, tam });
    i++;
  }
  if (!frames.length) return null;
  return { size, ancho, alto, frames, palPtr, arrPtr: arr };
}

/**
 * Convierte un gráfico de NPC al formato de charset de RMXP: 4 columnas × 4 filas
 * de celdas de 16×32 px (64×128 en total). Si el ROM trae otro tamaño de frame
 * (p. ej. 32×32), se reduce con vecino más cercano para no inventar color.
 */
function charsetNpc(data, gfx) {
  const { ancho, alto, frames } = gfx;
  const cols = 4, filas = 4, CW = 16, CH = 32;
  const W = cols * CW, H = filas * CH;
  const lienzo = new Uint8ClampedArray(W * H * 4);
  const colores = [];
  for (let c = 0; c < 16; c++) colores.push(bgr555aRGB_(u16(data, offsetDe(gfx.palPtr) + c * 2)));

  frames.slice(0, cols * filas).forEach((f, indice) => {
    const base = offsetDe(f.ptr);
    const tw = ancho >> 3;
    const cx = (indice % cols) * CW, cy = Math.floor(indice / cols) * CH;
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        const sx = Math.min(ancho - 1, Math.floor((x * ancho) / CW));
        const sy = Math.min(alto - 1, Math.floor((y * alto) / CH));
        const ti = Math.floor(sy / 8) * tw + Math.floor(sx / 8), ox = sx & 7, oy = sy & 7;
        const b = data[base + ti * 32 + oy * 4 + (ox >> 1)] ?? 0;
        const indiceColor = (ox & 1) === 0 ? b & 0xf : b >> 4;
        if (!indiceColor) continue;
        const [r, g, bl] = colores[indiceColor];
        const p = ((cy + y) * W + cx + x) * 4;
        lienzo[p] = r; lienzo[p + 1] = g; lienzo[p + 2] = bl; lienzo[p + 3] = 255;
      }
    }
  });
  return { ancho: W, alto: H, px: lienzo, frames: Math.min(frames.length, cols * filas), cols, filas };
}

function bgr555aRGB_(v) {
  const r = (v & 0x1f) << 3, g = ((v >> 5) & 0x1f) << 3, b = ((v >> 10) & 0x1f) << 3;
  return [r | (r >> 5), g | (g >> 5), b | (b >> 5)];
}

/* ──────────────────────────────── mapas ────────────────────────────────── */

/**
 * Atlas de tiles de un par de tilesets del ROM.
 * El atlas usa 8 columnas de 32 px (= 256 px de ancho, como RMXP) e incluye SOLO
 * los metatiles que los mapas de campaña de ese par usan, en orden ascendente.
 * El índice de un metatile dentro del atlas es estable: `k = ids.indexOf(id)`.
 */
function atlasDePar(par, ids) {
  const columnas = 8;
  const total = ids.length;
  const filas = Math.max(1, Math.ceil(total / columnas));
  const ancho = columnas * TILE;
  const alto = filas * TILE;
  const px = new Uint8ClampedArray(ancho * alto * 4);
  const indice = new Map();
  ids.forEach((id, k) => {
    const metatile = renderMetatile(par, id, { escala: ESCALA });
    const cx = (k % columnas) * TILE, cy = Math.floor(k / columnas) * TILE;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const src = (y * TILE + x) * 4, dst = ((cy + y) * ancho + cx + x) * 4;
        px[dst] = metatile[src]; px[dst + 1] = metatile[src + 1];
        px[dst + 2] = metatile[src + 2]; px[dst + 3] = metatile[src + 3];
      }
    }
    indice.set(id, k);
  });
  return { ancho, alto, px, columnas, total, indice };
}

/** PNG del mapa completo tal como se ve en el ROM (metatile a metatile). */
function pintarMapa(atlas, bloques, width, height) {
  const ancho = width * TILE;
  const px = new Uint8ClampedArray(ancho * height * TILE * 4);
  for (let i = 0; i < bloques.length; i++) {
    const k = atlas.indice.get(bloques[i]);
    if (k === undefined) continue;
    const x = i % width, y = Math.floor(i / width);
    const cx = (k % atlas.columnas) * TILE, cy = Math.floor(k / atlas.columnas) * TILE;
    for (let j = 0; j < TILE; j++) {
      const src = ((cy + j) * atlas.ancho + cx) * 4;
      const dst = ((y * TILE + j) * ancho + x * TILE) * 4;
      px.set(atlas.px.subarray(src, src + TILE * 4), dst);
    }
  }
  return { ancho, alto: height * TILE, px };
}

/* ──────────────────────────────── programa ─────────────────────────────── */

const data = cargarROM(ROM);
const layouts = buscarMapLayouts(data);
const porOff = new Map(layouts.map((l) => [l.off, l]));
const TABLA_NPC = arg("tablaNpc", null);          // permite forzar la tabla de sprites del ROM
const tablaNpc = TABLA_NPC ? { off: parseInt(TABLA_NPC, 16), n: 0 } : buscarTablaNpc(data);

const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "rom_campaigns_complete.json"), "utf8"));
const campana = Object.values(plan.campaigns).find((c) => c.id === SLUG || c.sourceRom?.toLowerCase().includes(SLUG));
if (!campana) throw new Error(`no encuentro la campaña ${SLUG} en el plan`);

const destino = path.join(OUT, SLUG);
fs.mkdirSync(path.join(destino, "tilesets"), { recursive: true });
fs.mkdirSync(path.join(destino, "mapas"), { recursive: true });
fs.mkdirSync(path.join(destino, "npcs"), { recursive: true });

const solo = SOLO ? new Set(SOLO.split(",").map((n) => Number(n))) : null;
const catalogo = {
  slug: SLUG, rom: path.basename(ROM), generadoEn: new Date().toISOString(),
  escala: ESCALA, tile: TILE, tablaNpc: tablaNpc?.off ?? -1, npcsTabla: tablaNpc?.n ?? 0,
  mapas: [], tilesets: {}, graficosNpc: {}, resumen: {},
};

const pares = new Map();      // clave par → { par, ids: Set, mapas: [...] }
const ordenados = [];
let hechos = 0;
for (const m of campana.maps) {
  if (solo && !solo.has(m.mapId)) continue;
  const header = parseInt(m.source.header, 16);
  const lay = porOff.get(offsetDe(u32(data, header)));
  if (!lay) continue;
  const clave = `${lay.prim}:${lay.sec}`;
  let entrada = pares.get(clave);
  if (!entrada) {
    entrada = { par: parTilesets(data, lay), ids: new Set(), mapas: [] };
    pares.set(clave, entrada);
  }
  const bloques = Array.from(leerBloques(data, lay), (b) => b & 0x3ff);
  for (const id of bloques) entrada.ids.add(id);
  // Sprites de los personajes del mapa, en el mismo orden en que los coloca el ROM.
  const npcs = [];
  const evPtr = u32(data, parseInt(m.source.header, 16) + 4);
  if (esPtr(evPtr, data.length)) {
    const o = offsetDe(evPtr);
    for (let i = 0; i < data[o]; i++) npcs.push(data[o + 1 + i * 24 + 1]);
  }
  entrada.mapas.push({ m, lay, bloques, clave, npcs });
  ordenados.push({ m, lay, bloques, clave, npcs });
}

// Segunda pasada: atlas por par de tilesets (orden ascendente de metatile) y PNGs.
for (const [clave, entrada] of pares) {
  const ids = Array.from(entrada.ids).sort((a, b) => a - b);
  const atlas = atlasDePar(entrada.par, ids);
  const [prim, sec] = clave.split(":").map((n) => Number(n));
  const nombreTs = `${SLUG}_TS_${prim.toString(16)}_${sec.toString(16)}`;
  catalogo.tilesets[nombreTs] = {
    prim, sec, ancho: atlas.ancho, alto: atlas.alto, tiles: atlas.total,
    ids, mapas: entrada.mapas.map(({ m }) => `Map${m.mapId}`),
  };
  fs.writeFileSync(path.join(destino, "tilesets", `${nombreTs}.png`), pngRGBA(atlas.ancho, atlas.alto, atlas.px));
  for (const { m, lay, bloques } of entrada.mapas) {
    const mapa = pintarMapa(atlas, bloques, lay.width, lay.height);
    if (!SIN_PNG) fs.writeFileSync(path.join(destino, "mapas", `Map${m.mapId}.png`), pngRGBA(mapa.ancho, mapa.alto, mapa.px));
    const celdas = bloques.map((id) => (colisionDe(entrada.par, id) ? 1 : 0));
    catalogo.mapas.push({
      mapa: `Map${m.mapId}`, bancoRom: m.source.bank, mapaRom: m.source.map, tileset: nombreTs,
      npcs: (entrada.mapas.find((x) => x.m === m)?.npcs ?? []),
      ancho: lay.width, alto: lay.height,
      bloqueados: celdas.reduce((a, b) => a + b, 0),
      celdas: celdas.join(""),
      tiles: bloques.map((b) => b.toString(36).padStart(2, "0")).join(""),
    });
    hechos++;
  }
}

// NPCs: gráficos de overworld que usan los mapas de campaña.
if (tablaNpc) {
  const vistos = new Set();
  for (const { m } of ordenados) {
    const header = parseInt(m.source.header, 16);
    const evPtr = u32(data, header + 4);
    if (!esPtr(evPtr, data.length)) continue;
    const o = offsetDe(evPtr);
    for (let i = 0; i < data[o]; i++) {
      const gfxId = data[o + 1 + i * 24 + 1];
      if (vistos.has(gfxId)) continue;
      vistos.add(gfxId);
      const gfx = leerGraficoNpc(data, tablaNpc.off, gfxId);
      if (!gfx) continue;
      const ch = charsetNpc(data, gfx);
      fs.writeFileSync(path.join(destino, "npcs", `${SLUG}_GFX_${gfxId}.png`), pngRGBA(ch.ancho, ch.alto, ch.px));
      catalogo.graficosNpc[gfxId] = {
        file: `${SLUG}_GFX_${gfxId}.png`, ancho: ch.ancho, alto: ch.alto,
        frames: ch.frames, cols: ch.cols, filas: ch.filas,
        tam: gfx.size, anchoOrigen: gfx.ancho, altoOrigen: gfx.alto,
      };
    }
  }
}

catalogo.resumen = {
  mapas: hechos, tilesets: Object.keys(catalogo.tilesets).length,
  graficosNpc: Object.keys(catalogo.graficosNpc).length,
};
fs.writeFileSync(path.join(destino, "catalogo.json"), `${JSON.stringify(catalogo, null, 1)}\n`);
console.log(`✔ ${SLUG}: ${hechos} mapas · ${catalogo.resumen.tilesets} tilesets · ${catalogo.resumen.graficosNpc} gráficos de NPC → ${path.relative(ROOT, destino)}`);
