#!/usr/bin/env node
/**
 * Verificación de pixel-identidad de las fichas del Dimensional Nightmare.
 *
 * Reconstruye cada ficha desde el tileset derivado + su matriz de índices
 * (content/dimensional_nightmare_tiles.json) y la compara píxel a píxel con el
 * PNG original cortado por `dn_ingest_reference.mjs`.
 *
 * También genera, para una ficha concreta, una vista previa lado a lado
 * (original | reconstruida | diferencias) para revisión visual.
 *
 * Uso:
 *   node tools/dn_verify_slices.mjs                        # verifica todo
 *   node tools/dn_verify_slices.mjs --preview r7_catacumbas 7
 *   node tools/dn_verify_slices.mjs --quantize             # mide tiles únicos tras cuantizar
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(ROOT, "reference", "dimensional_nightmare");
const CATALOG_PATH = path.join(ROOT, "content", "dimensional_nightmare_tiles.json");

const argValue = (flag, fallback) => {
  const at = process.argv.indexOf(flag);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const PREVIEW_KEY = argValue("--preview", null);
const PREVIEW_SLICE = Number(argValue("--index", "1"));
const QUANTIZE = process.argv.includes("--quantize");
const CATALOG_IN = argValue("--catalog", CATALOG_PATH);

const catalog = JSON.parse(fs.readFileSync(path.resolve(ROOT, CATALOG_IN), "utf8"));

// scaleGuess por ficha (si existe index.json de la ingesta); 1 por defecto.
const INDEX_PATH = path.join(REF, "index.json");
const scaleGuesses = new Map();
if (fs.existsSync(INDEX_PATH)) {
  for (const resource of JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")).resources) {
    for (const slice of resource.slices) scaleGuesses.set(slice.file, slice.scaleGuess ?? 1);
  }
}
const scaleGuessOf = (file) => scaleGuesses.get(file) ?? 1;
const TILE = catalog.tileSize;
const COLUMNS = catalog.columns;


// --- misma preparación que el extractor (para comparar en igualdad de condiciones) ---
const toNative = (px, factor) => {
  if (factor <= 1) return px;
  const w = Math.floor(px.width / factor), h = Math.floor(px.height / factor);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(px.canvas, 0, 0, px.width, px.height, 0, 0, w, h);
  return { width: w, height: h, canvas, ctx, data: ctx.getImageData(0, 0, w, h).data };
};
const upscale = (px, factor) => {
  if (factor <= 1) return px;
  const w = px.width * factor, h = px.height * factor;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(px.canvas, 0, 0, px.width, px.height, 0, 0, w, h);
  return { width: w, height: h, canvas, ctx, data: ctx.getImageData(0, 0, w, h).data };
};
const padToBlock = (px, tile) => {
  const width = Math.ceil(px.width / tile) * tile;
  const height = Math.ceil(px.height / tile) * tile;
  if (width === px.width && height === px.height) return px;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(px.canvas, 0, 0);
  ctx.drawImage(px.canvas, px.width - 1, 0, 1, px.height, px.width, 0, width - px.width, px.height);
  ctx.drawImage(px.canvas, 0, px.height - 1, px.width, 1, 0, px.height, px.width, height - px.height);
  ctx.drawImage(px.canvas, px.width - 1, px.height - 1, 1, 1, px.width, px.height, width - px.width, height - px.height);
  return { width, height, canvas, ctx, data: ctx.getImageData(0, 0, width, height).data, padded: true };
};

const loadPixels = async (file) => {
  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return { width: img.width, height: img.height, canvas, ctx, data: ctx.getImageData(0, 0, img.width, img.height).data };
};

function renderMap(tilesetCanvas, map) {
  const width = map.width * TILE;
  const height = map.height * TILE;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const idx = map.matrix[r][c];
      const sx = (idx % COLUMNS) * TILE;
      const sy = Math.floor(idx / COLUMNS) * TILE;
      ctx.drawImage(tilesetCanvas, sx, sy, TILE, TILE, c * TILE, r * TILE, TILE, TILE);
    }
  }
  return canvas;
}

const diffPixels = (a, b, width, height) => {
  let diff = 0;
  for (let i = 0; i < width * height * 4; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) diff++;
  }
  return diff;
};

const report = [];
let verifiedMaps = 0, exactMaps = 0;

for (const group of catalog.groups) {
  const tileset = await loadPixels(path.resolve(ROOT, group.tileset));
  let groupDiff = 0, groupPixels = 0, worst = { slice: null, pct: 0 };
  let groupExact = 0;
  for (const map of group.maps) {
    const raw = await loadPixels(path.resolve(ROOT, map.slice));
    const original = padToBlock(upscale(toNative(raw, scaleGuessOf(map.slice)), catalog.scale ?? 1), TILE);
    const rebuilt = renderMap(tileset.canvas, map);
    const w = Math.min(rebuilt.width, original.width);
    const h = Math.min(rebuilt.height, original.height);
    const a = original.data;
    const b = rebuilt.getContext("2d").getImageData(0, 0, rebuilt.width, rebuilt.height).data;
    // Compara solo la región cubierta por la matriz (el borde sobrante de la ficha
    // no forma parte de la rejilla de 32 px y se reporta como área no cubierta).
    let diff = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * original.width + x) * 4;
        const j = (y * rebuilt.width + x) * 4;
        if (a[i] !== b[j] || a[i + 1] !== b[j + 1] || a[i + 2] !== b[j + 2]) diff++;
      }
    }
    const pixels = w * h;
    groupDiff += diff;
    groupPixels += pixels;
    if (diff === 0) { groupExact++; exactMaps++; }
    const pct = pixels ? (diff / pixels) * 100 : 0;
    if (pct > worst.pct) worst = { slice: map.slice, pct };
    verifiedMaps++;
    if (PREVIEW_KEY === group.key && map === group.maps[PREVIEW_SLICE - 1]) {
      const preview = createCanvas(w * 3 + 16, h);
      const pctx = preview.getContext("2d");
      pctx.fillStyle = "#202020";
      pctx.fillRect(0, 0, preview.width, preview.height);
      pctx.drawImage(original.canvas, 0, 0, w, h, 0, 0, w, h);
      pctx.drawImage(rebuilt, 0, 0, w, h, w + 8, 0, w, h);
      const mask = createCanvas(w, h);
      const mctx = mask.getContext("2d");
      const img = mctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * original.width + x) * 4;
          const j = (y * rebuilt.width + x) * 4;
          const same = a[i] === b[j] && a[i + 1] === b[j + 1] && a[i + 2] === b[j + 2];
          const k = (y * w + x) * 4;
          img.data[k] = same ? 16 : 255;
          img.data[k + 1] = same ? 16 : 40;
          img.data[k + 2] = same ? 16 : 40;
          img.data[k + 3] = 255;
        }
      }
      mctx.putImageData(img, 0, 0);
      pctx.drawImage(mask, 0, 0, w, h, (w + 8) * 2, 0, w, h);
      const out = path.join(REF, `preview_${group.key}_${String(PREVIEW_SLICE).padStart(2, "0")}.png`);
      fs.writeFileSync(out, preview.toBuffer("image/png"));
      report.push(`  vista previa → ${path.relative(ROOT, out)}`);
    }
  }
  const pct = groupPixels ? (groupDiff / groupPixels) * 100 : 0;
  report.push(`${group.key}: ${group.maps.length} mapas · ${groupExact} idénticos · desviación media ${pct.toFixed(4)}%` + (worst.pct > 0 ? ` · peor: ${path.basename(worst.slice)} (${worst.pct.toFixed(3)}%)` : ""));
}

console.log(report.join("\n"));
console.log(`\nTotal: ${verifiedMaps} matrices verificadas · ${exactMaps} reconstrucciones idénticas`);

if (QUANTIZE) {
  console.log("\nExperimento de limpieza (E2): tiles únicos tras reducir la paleta");
  for (const group of catalog.groups) {
    const seen = new Set();
    let total = 0;
    for (const map of group.maps) {
      for (const row of map.matrix) {
        for (const idx of row) {
          total++;
          seen.add(idx);
        }
      }
    }
    const tileset = await loadPixels(path.resolve(ROOT, group.tileset));
    const ctx = tileset.ctx;
    const quantized = new Set();
    for (const idx of seen) {
      if (idx < 0) continue;
      const sx = (idx % COLUMNS) * TILE;
      const sy = Math.floor(idx / COLUMNS) * TILE;
      if (sx + TILE > tileset.width || sy + TILE > tileset.height) continue;
      const block = ctx.getImageData(sx, sy, TILE, TILE).data;
      let hash = 0;
      for (let i = 0; i < block.length; i += 4) {
        const r = block[i] >> 4, g = block[i + 1] >> 4, b = block[i + 2] >> 4;
        hash = (hash * 31 + (r << 8) + (g << 4) + b) | 0;
      }
      quantized.add(hash);
    }
    console.log(`  ${group.key}: ${seen.size} tiles usados → ${quantized.size} tras cuantizar a 4 bits/canal ` +
      `(ahorro ${(100 - (quantized.size / Math.max(1, seen.size)) * 100).toFixed(0)}%)`);
  }
}
