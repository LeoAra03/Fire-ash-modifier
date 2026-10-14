#!/usr/bin/env node
/**
 * atlas_ingest_reference.mjs
 *
 * Ingesta de los mosaicos de referencia de **Atlas Mil** (`Mapas/Atlas/`).
 *
 * El Dimensional Nightmare ya tiene su propio pipeline (`dn:ingest`), que
 * ignora expresamente `Mapas/Atlas/`. Estos diecisiete mosaicos se quedaron
 * por eso sin herramienta: nadie los cortaba, nadie los medía y nadie podía
 * comparar el Atlas instalado con su referencia.
 *
 * Qué hace:
 *   · localiza la rejilla de cada mosaico buscando los separadores oscuros
 *     (no asume un tamaño fijo: lo mide);
 *   · recorta cada ficha a su caja de contenido real;
 *   · la mide: tamaño en píxeles, factor de escala aparente, alto y ancho en
 *     tiles de 16 px, luminancia media, paleta dominante y una huella de 8×8
 *     para detectar fichas repetidas entre mosaicos;
 *   · escribe `reference/atlas/slices/<mosaico>/NN.png` y
 *     `reference/atlas/index.json`.
 *
 * No adivina a qué mapa corresponde cada ficha: eso depende de un criterio de
 * orden que los nombres de archivo no traen. Lo que sí deja es la medida, que
 * es lo que cualquier asignación necesita para poder comprobarse.
 *
 * Uso:
 *   node tools/atlas_ingest_reference.mjs            # corta y mide
 *   node tools/atlas_ingest_reference.mjs --check    # sólo informa
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "Mapas", "Atlas");
const OUT = path.join(ROOT, "reference", "atlas");
const SLICES = path.join(OUT, "slices");
const INDEX = path.join(OUT, "index.json");
const CHECK_ONLY = process.argv.includes("--check");

const DARK = 26;        // luminancia por debajo de la cual un píxel es «separador»
const FILL = 0.93;      // fracción de la línea que debe ser oscura
const MIN_SPAN = 6;     // grosor mínimo de un separador
const MIN_CELL = 96;    // una ficha más pequeña que esto es un recorte espurio

const round = (n, d = 2) => Number(n.toFixed(d));

async function pixelsOf(file) {
  const image = await loadImage(file);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return { width: image.width, height: image.height, data: ctx.getImageData(0, 0, image.width, image.height).data };
}
const lumAt = (px, x, y) => {
  const i = (y * px.width + x) * 4;
  return px.data[i] * 0.299 + px.data[i + 1] * 0.587 + px.data[i + 2] * 0.114;
};

/** Tramos de filas o columnas que son casi enteramente oscuros. */
function darkRuns(px, horizontal) {
  const length = horizontal ? px.height : px.width;
  const cross = horizontal ? px.width : px.height;
  const step = Math.max(1, Math.floor(cross / 400));
  const runs = [];
  let start = null;
  for (let p = 0; p < length; p++) {
    let dark = 0, total = 0;
    for (let q = 0; q < cross; q += step) {
      const value = horizontal ? lumAt(px, q, p) : lumAt(px, p, q);
      if (value < DARK) dark++;
      total++;
    }
    const fraction = dark / total;
    if (fraction >= FILL) { if (start === null) start = p; }
    else if (start !== null) { if (p - start >= MIN_SPAN) runs.push([start, p - 1]); start = null; }
  }
  if (start !== null && length - start >= MIN_SPAN) runs.push([start, length - 1]);
  return runs;
}

/** Celdas entre separadores, descartando las que no llegan al mínimo. */
function cellsBetween(runs, length) {
  const centres = runs.map(([a, b]) => Math.round((a + b) / 2));
  const edges = [0, ...centres, length - 1];
  const cells = [];
  for (let i = 1; i < edges.length; i++) {
    const from = edges[i - 1] + 2, to = edges[i] - 2;
    if (to - from >= MIN_CELL) cells.push([from, to]);
  }
  return cells;
}

/** Caja de contenido real de una celda (recorta el marco negro). */
function contentBox(px, [x0, x1, y0, y1]) {
  let left = x1, top = y1, right = x0, bottom = y0;
  const step = Math.max(1, Math.floor((x1 - x0) / 240));
  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      if (lumAt(px, x, y) >= DARK + 6) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right <= left || bottom <= top) return null;
  return [left, top, right, bottom];
}

function paletteOf(px, [x0, y0, x1, y1], size = 8) {
  const buckets = new Map();
  const stepX = Math.max(1, Math.floor((x1 - x0) / 60));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 60));
  for (let y = y0; y <= y1; y += stepY) {
    for (let x = x0; x <= x1; x += stepX) {
      const i = (y * px.width + x) * 4;
      const r = px.data[i], g = px.data[i + 1], b = px.data[i + 2];
      const key = `${r >> 5},${g >> 5},${b >> 5}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map((n) => Number(n) * 32 + 16);
      return { rgb: [r, g, b], weight: count };
    });
}

/** Huella de 8×8 en escala de grises, para detectar fichas repetidas. */
function fingerprintOf(px, [x0, y0, x1, y1]) {
  const grid = [];
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      const x = Math.round(x0 + ((x1 - x0) * (gx + 0.5)) / 8);
      const y = Math.round(y0 + ((y1 - y0) * (gy + 0.5)) / 8);
      grid.push(Math.round(lumAt(px, x, y)));
    }
  }
  const mean = grid.reduce((a, b) => a + b, 0) / grid.length;
  return grid.map((v) => (v > mean ? 1 : 0)).join("");
}

/** Factor de escala aparente: el mayor divisor «redondo» del tamaño en tiles. */
function scaleGuessOf(width, height) {
  for (const factor of [4, 3, 2, 1]) {
    const w = width / factor / 16, h = height / factor / 16;
    if (w >= 12 && h >= 8 && Number.isInteger(Math.round(w)) && Number.isInteger(Math.round(h))) return factor;
  }
  return 1;
}

async function measure(file) {
  const px = await pixelsOf(file);
  const rows = cellsBetween(darkRuns(px, true), px.height);
  const cols = cellsBetween(darkRuns(px, false), px.width);
  const slices = [];
  let index = 0;
  rows.forEach(([y0, y1], fila) => {
    cols.forEach(([x0, x1], columna) => {
      index += 1;
      const box = contentBox(px, [x0, x1, y0, y1]);
      if (!box) return;
      const [bx0, by0, bx1, by1] = box;
      const width = bx1 - bx0 + 1, height = by1 - by0 + 1;
      const factor = scaleGuessOf(width, height);
      slices.push({
        index,
        row: fila + 1,
        col: columna + 1,
        box,
        width,
        height,
        scaleGuess: factor,
        tilesWide: Math.round(width / factor / 16),
        tilesHigh: Math.round(height / factor / 16),
        luminance: round(meanLuminance(px, box), 1),
        palette: paletteOf(px, box),
        fingerprint: fingerprintOf(px, box),
      });
    });
  });
  return { image: { width: px.width, height: px.height }, grid: { rows: rows.length, cols: cols.length }, slices };
}

function meanLuminance(px, [x0, y0, x1, y1]) {
  let sum = 0, n = 0;
  const stepX = Math.max(1, Math.floor((x1 - x0) / 120));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 120));
  for (let y = y0; y <= y1; y += stepY) {
    for (let x = x0; x <= x1; x += stepX) { sum += lumAt(px, x, y); n++; }
  }
  return n ? sum / n : 0;
}

async function writeSlice(source, slice, folder) {
  const image = await loadImage(source);
  const [x0, y0, x1, y1] = slice.box;
  const canvas = createCanvas(x1 - x0 + 1, y1 - y0 + 1);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, x1 - x0 + 1, y1 - y0 + 1);
  const file = path.join(folder, `${String(slice.index).padStart(2, "0")}.png`);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  return path.relative(ROOT, file);
}

// ---------------------------------------------------------------------- main
const files = fs.readdirSync(DIR).filter((name) => /\.png$/i.test(name)).sort();
if (!files.length) {
  console.error(`No hay mosaicos PNG en ${path.relative(ROOT, DIR)}.`);
  process.exit(1);
}
console.log(`mosaicos: ${files.length} en ${path.relative(ROOT, DIR)}`);

const index = {
  title: "Atlas Mil — catálogo de referencia visual",
  generatedBy: "tools/atlas_ingest_reference.mjs",
  note: "Cada ficha es un recorte medido de un mosaico. La correspondencia ficha → mapa no está en los nombres de archivo y no se adivina: este índice sólo entrega la medida.",
  mosaics: [],
};
let total = 0;
for (const name of files) {
  const source = path.join(DIR, name);
  const info = await measure(source);
  const folder = path.join(SLICES, name.replace(/\.png$/i, ""));
  if (!CHECK_ONLY) fs.mkdirSync(folder, { recursive: true });
  for (const slice of info.slices) {
    if (!CHECK_ONLY) slice.file = await writeSlice(source, slice, folder);
  }
  total += info.slices.length;
  const sizes = new Set(info.slices.map((s) => `${s.tilesWide}×${s.tilesHigh}`));
  console.log(`  ${name}: rejilla ${info.grid.cols}×${info.grid.rows} → ${info.slices.length} fichas · tamaños ${[...sizes].slice(0, 4).join(", ")}`);
  index.mosaics.push({ name: path.relative(ROOT, source), ...info });
}

if (CHECK_ONLY) {
  console.log(`\n[check] ${total} fichas medibles en ${files.length} mosaicos (no se ha escrito nada).`);
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(INDEX, `${JSON.stringify(index, null, 2)}\n`);
console.log(`\nTotal: ${total} fichas → ${path.relative(ROOT, INDEX)}`);
