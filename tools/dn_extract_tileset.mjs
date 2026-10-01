#!/usr/bin/env node
/**
 * Enfoque B (pixel-identidad): extrae los tiles de las fichas de referencia y
 * construye tilesets de RPG Maker XP (bloques de 32×32, 8 columnas).
 *
 * Entrada : reference/dimensional_nightmare/index.json + slices/ (los produce
 *           `npm run dn:ingest`).
 * Salida  : reference/dimensional_nightmare/tilesets/<grupo>.png
 *           content/dimensional_nightmare_tiles.json
 *
 * El JSON resultante contiene, por ficha, la MATRIZ de índices de tile del
 * grupo: pintar esa matriz con el tileset reproduce la imagen de referencia
 * exactamente (se verifica en el selftest reconstruyendo píxel a píxel).
 *
 * Uso:
 *   node tools/dn_extract_tileset.mjs            # extrae de las fichas reales
 *   node tools/dn_extract_tileset.mjs --selftest # prueba con una ficha sintética
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(ROOT, "reference", "dimensional_nightmare");
const INDEX_PATH = path.join(REF, "index.json");
const TILESETS_DIR = path.join(REF, "tilesets");
const CATALOG_PATH = path.join(ROOT, "content", "dimensional_nightmare_tiles.json");
const TILE = 32;                 // celda de mapa en RPG Maker XP
const COLUMNS = 8;               // columnas del PNG de tileset (formato RMXP)
const MAX_TILES = 1024;          // aviso si un grupo necesita partirse
const SELFTEST = process.argv.includes("--selftest");

// ------------------------------------------------------------------ utilidades
function toNative(px, factor) {
  if (factor <= 1) return px;
  const w = Math.floor(px.width / factor);
  const h = Math.floor(px.height / factor);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(px.canvas, 0, 0, px.width, px.height, 0, 0, w, h);
  return { width: w, height: h, canvas, ctx, data: ctx.getImageData(0, 0, w, h).data };
}

const blockHash = (data, width, x0, y0) => {
  const hash = crypto.createHash("sha1");
  for (let y = 0; y < TILE; y++) hash.update(Buffer.from(data.buffer, data.byteOffset + ((y0 + y) * width + x0) * 4, TILE * 4));
  return hash.digest("hex");
};

const isBlank = (data, width, x0, y0) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = ((y0 + y) * width + x0 + x) * 4;
      if (data[i + 3] > 16 && (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20)) return false;
    }
  }
  return true;
};

/**
 * Extrae los tiles únicos de un conjunto de fichas.
 * @returns {{ tiles: Array, maps: Array, fullWidth: number, fullHeight: number }}
 */
function extractGroup(entries) {
  // 1) índice global de bloques únicos (deduplicados por contenido)
  const unique = new Map();          // hash → índice
  const tiles = [];                  // { index, hash, uses, blank }
  const maps = [];
  for (const entry of entries) {
    const px = toNative(entry.px, entry.scale);
    const cols = Math.floor(px.width / TILE);
    const rows = Math.floor(px.height / TILE);
    const matrix = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const x0 = c * TILE;
        const y0 = r * TILE;
        const blank = isBlank(px.data, px.width, x0, y0);
        const hash = blank ? "__blank__" : blockHash(px.data, px.width, x0, y0);
        let index = unique.get(hash);
        if (index === undefined) {
          index = tiles.length;
          unique.set(hash, index);
          tiles.push({ index, hash, uses: 0, blank });
        }
        tiles[index].uses++;
        row.push(index);
      }
      matrix.push(row);
    }
    maps.push({ slice: entry.slice, width: cols, height: rows, matrix, native: { width: px.width, height: px.height } });
  }
  return { tiles, maps };
}

/** Construye el PNG del tileset (8 columnas) desde un mapa índice → bloque de origen. */
function buildTileset(firstSource, tileCount) {
  const canvas = createCanvas(COLUMNS * TILE, Math.max(1, Math.ceil(tileCount / COLUMNS)) * TILE);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (const [index, { sx, sy, source }] of firstSource) {
    ctx.drawImage(source.canvas, sx, sy, TILE, TILE, (index % COLUMNS) * TILE, Math.floor(index / COLUMNS) * TILE, TILE, TILE);
  }
  return canvas;
}

// ------------------------------------------------------------------ selftest
async function selftest() {
  // Ficha sintética 4×2 bloques con 4 tiles distintos y repeticiones: A A B C / D C B A
  const W = 4 * TILE, H = 2 * TILE;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const palette = ["#c04040", "#40a060", "#4060c0", "#c0b040"];
  const layout = [0, 0, 1, 2, 3, 2, 1, 0];
  layout.forEach((tile, i) => {
    const x = (i % 4) * TILE, y = Math.floor(i / 4) * TILE;
    ctx.fillStyle = palette[tile];
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 4, y + 4, 8, 8);
    ctx.fillStyle = "#101010";
    ctx.fillRect(x + TILE - 12, y + TILE - 12, 8, 8);
  });
  const px = { width: W, height: H, canvas, ctx, data: ctx.getImageData(0, 0, W, H).data };

  const { tiles, maps } = extractGroup([{ slice: "selftest", px, scale: 1 }]);
  const expectedUnique = 4;
  if (tiles.length !== expectedUnique) {
    console.error(`selftest FALLO: ${tiles.length} tiles únicos (esperado ${expectedUnique})`);
    process.exitCode = 1;
    return;
  }
  // Comprobación directa: el tileset + la matriz deben reproducir la imagen original.
  const firstSource = new Map();
  layout.forEach((_, i) => {
    const r = Math.floor(i / 4), c = i % 4;
    const index = maps[0].matrix[r][c];
    if (!firstSource.has(index)) firstSource.set(index, { sx: c * TILE, sy: r * TILE, source: px });
  });
  const tilesetCanvas = buildTileset(firstSource, tiles.length);
  const rebuilt = createCanvas(W, H);
  const rctx = rebuilt.getContext("2d");
  rctx.imageSmoothingEnabled = false;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const index = maps[0].matrix[r][c];
      const sx = (index % COLUMNS) * TILE;
      const sy = Math.floor(index / COLUMNS) * TILE;
      rctx.drawImage(tilesetCanvas, sx, sy, TILE, TILE, c * TILE, r * TILE, TILE, TILE);
    }
  }
  const a = ctx.getImageData(0, 0, W, H).data;
  const b = rctx.getImageData(0, 0, W, H).data;
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  const ok = diff === 0;
  console.log(`selftest: ${tiles.length} tiles únicos · matriz ${maps[0].width}×${maps[0].height} · reconstrucción ${ok ? "idéntica píxel a píxel" : `${diff} bytes distintos`}`);
  if (!ok) {
    console.error("selftest FALLO: la reconstrucción no coincide.");
    process.exitCode = 1;
    return;
  }
  console.log("selftest OK · el tileset derivado reproduce la ficha exactamente");
}

// ---------------------------------------------------------------------- main
if (SELFTEST) {
  await selftest();
  process.exit(process.exitCode ?? 0);
}

if (!fs.existsSync(INDEX_PATH)) {
  console.error("Falta reference/dimensional_nightmare/index.json. Ejecuta primero `npm run dn:ingest`.");
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
fs.mkdirSync(TILESETS_DIR, { recursive: true });
const catalog = {
  title: "Dimensional Nightmare — tilesets derivados de la referencia",
  generatedBy: "tools/dn_extract_tileset.mjs",
  warning: "Arte derivado de mosaicos de referencia de terceros: uso interno de desarrollo. No empaquetar en el juego distribuido.",
  tileSize: TILE,
  columns: COLUMNS,
  groups: [],
};

for (const resource of index.resources) {
  const entries = [];
  for (const slice of resource.slices) {
    const file = path.resolve(ROOT, slice.file);
    const img = await loadImage(file);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    entries.push({
      slice: slice.file,
      px: { width: img.width, height: img.height, canvas, ctx, data: ctx.getImageData(0, 0, img.width, img.height).data },
      scale: slice.scaleGuess ?? 1,
    });
  }
  const { tiles, maps } = extractGroup(entries);
  // El PNG necesita, por índice, de dónde copiar: primer bloque que produjo ese índice.
  const firstSource = new Map();
  for (const entry of entries) {
    const native = toNative(entry.px, entry.scale);
    const cols = Math.floor(native.width / TILE);
    const rows = Math.floor(native.height / TILE);
    const map = maps.find((m) => m.slice === entry.slice);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = map.matrix[r][c];
        if (!firstSource.has(idx)) firstSource.set(idx, { sx: c * TILE, sy: r * TILE, source: native });
      }
    }
  }
  const tileCount = tiles.length;
  const canvas = createCanvas(COLUMNS * TILE, Math.ceil(tileCount / COLUMNS) * TILE);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (const [idx, { sx, sy, source }] of firstSource) {
    ctx.drawImage(source.canvas, sx, sy, TILE, TILE, (idx % COLUMNS) * TILE, Math.floor(idx / COLUMNS) * TILE, TILE, TILE);
  }
  const png = path.join(TILESETS_DIR, `${resource.key}.png`);
  fs.writeFileSync(png, canvas.toBuffer("image/png"));
  const blankCount = tiles.filter((t) => t.blank).length;
  const size = fs.statSync(png).size;
  console.log(`${resource.key}: ${tileCount} tiles únicos (${blankCount} en blanco) · ${maps.length} mapas · ${path.relative(ROOT, png)} (${(size / 1024).toFixed(1)} KB)`);
  if (tileCount > MAX_TILES) console.warn(`  aviso: ${tileCount} tiles > ${MAX_TILES}; conviene partir el grupo por lotes.`);
  catalog.groups.push({
    key: resource.key,
    tileset: path.relative(ROOT, png),
    tiles: tileCount,
    blankTiles: blankCount,
    maps: maps.map((m) => ({ slice: m.slice, width: m.width, height: m.height, native: m.native, matrix: m.matrix })),
  });
}
fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
const totalTiles = catalog.groups.reduce((sum, g) => sum + g.tiles, 0);
const totalMaps = catalog.groups.reduce((sum, g) => sum + g.maps.length, 0);
console.log(`\nTotal: ${totalTiles} tiles únicos en ${catalog.groups.length} tilesets · ${totalMaps} matrices de mapa → ${path.relative(ROOT, CATALOG_PATH)}`);
