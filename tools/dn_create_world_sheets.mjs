#!/usr/bin/env node
/**
 * dn_create_world_sheets.mjs — mosaicos de referencia ORIGEN de los mundos del
 * segundo anillo (W7 Strangled Red, W8 Buried Alive, W9 Lavender Town Syndrome).
 *
 * El usuario entregó siete mosaicos con 96 fichas (las crepypastas que ya están
 * en el GDD). Para los tres mundos nuevos no existe mosaico del autor: este
 * script compone uno por mundo **con el mismo formato** (rejilla 4×4, separadores
 * oscuros, banda de título) a partir de las fichas ya entregadas, transformadas
 * con la paleta y el motivo de cada mundo. Cada ficha resultante es un mapa del
 * pipeline E0–E5: ficha → tileset → mapa → eventos.
 *
 * Los tres PNG se escriben en `Mapas/Crepypastas/` (material de desarrollo
 * derivado del arte del autor, ignorado por git) y se registran como recursos
 * R8/R9/R10 en `reference/dimensional_nightmare/mapping.json` para que `dn:ingest`
 * los recorte en `reference/dimensional_nightmare/slices/r8_*`…
 *
 * Uso:
 *   node tools/dn_create_world_sheets.mjs                 # crea las 3 hojas
 *   node tools/dn_create_world_sheets.mjs --verify        # comprueba que existen y miden
 *   node tools/dn_create_world_sheets.mjs --sample W7     # sólo un mundo
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(ROOT, "reference", "dimensional_nightmare");
const SOURCE_DIR = path.join(ROOT, "Mapas", "Crepypastas");
const MAPPING_PATH = path.join(REF, "mapping.json");

const argv = process.argv.slice(2);
const VERIFY = argv.includes("--verify");
const SAMPLE = (() => {
  const at = argv.indexOf("--sample");
  return at >= 0 && argv[at + 1] ? argv[at + 1] : null;
})();

const TILE = 4;          // separador entre fichas
const CELL_W = 340;      // tamaño de ficha de la hoja
const CELL_H = 180;
const HEADER = 52;
const COLS = 4, ROWS = 4;

/** Mundos del segundo anillo. `source` elige de qué recursos salen las fichas. */
export const WORLDS = [
  {
    key: "W7", resource: "r8_strangled_red", file: "origen_W7_STRANGLED_RED.png",
    title: "W7 — STRANGLED RED",
    subtitle: "16 fichas · duelo y culpa · rojo apagado, sombras que no siguen al dueño",
    sources: ["r7_catacumbas", "r5_pueblos_tumbas", "r4_trono_unown", "r2_dark_forest"],
    transform: "strangled",
    hue: -8, saturation: 0.55, tint: [180, 30, 30], tintAmount: 0.34, vignette: 0.35, zoom: 1.06, sharpen: 0.9,
  },
  {
    key: "W8", resource: "r9_buried_alive", file: "origen_W8_BURIED_ALIVE.png",
    title: "W8 — BURIED ALIVE",
    subtitle: "16 fichas · claustrofobia · oscuridad sin aire, la fosa ya está cavada",
    sources: ["r7_catacumbas", "r2_dark_forest", "r5_pueblos_tumbas"],
    transform: "buried",
    hue: 0, saturation: 0.4, tint: [70, 52, 30], tintAmount: 0.42, vignette: 0.5, zoom: 1.06, sharpen: 1.6,
  },
  {
    key: "W9", resource: "r10_lavender_syndrome", file: "origen_W9_LAVENDER_SYNDROME.png",
    title: "W9 — LAVENDER TOWN SYNDROME",
    subtitle: "16 fichas · el sonido duele · violeta, ondas y silencios que interrumpen la imagen",
    sources: ["r5_pueblos_tumbas", "r7_catacumbas", "r4_trono_unown", "r6_snowy_mountain"],
    transform: "lavender",
    hue: 46, saturation: 0.6, tint: [120, 70, 190], tintAmount: 0.4, vignette: 0.4, zoom: 1.1, sharpen: 0.5,
  },
];

// --------------------------------------------------------------- utilidades de imagen
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const conv = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(conv(h + 1 / 3) * 255), Math.round(conv(h) * 255), Math.round(conv(h - 1 / 3) * 255)];
}

/** Transforma una ficha (ya recortada) con la paleta del mundo. */
function transformSheet(canvas, world) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const [tr, tg, tb] = world.tint;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    let [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    h += world.hue;
    s *= world.saturation;
    // Las curvas de luz preservan el contraste local (el mapa se recorta por estructura,
    // no por color): estirar antes de oscurecer, y oscurecer con gamma, no multiplicando.
    if (world.transform === "buried") { l = (l - 6) * 1.25 + 6; l = 100 * Math.pow(Math.max(0, l) / 100, 1.35); }
    if (world.transform === "strangled") { l = (l - 8) * 1.1 + 8; l = 100 * Math.pow(Math.max(0, l) / 100, 1.1); }
    if (world.transform === "lavender") l = (l - 50) * 1.25 + 50;     // más contraste
    let [r, g, b] = hslToRgb(h, Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l)));
    r = r * (1 - world.tintAmount) + tr * world.tintAmount;
    g = g * (1 - world.tintAmount) + tg * world.tintAmount;
    b = b * (1 - world.tintAmount) + tb * world.tintAmount;
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(image, 0, 0);
  return ctx;
}

/** Viñeta (claustrofobia / penumbra) y artefactos de imagen por mundo. */
function finishSheet(ctx, world, index) {
  const { width, height } = ctx.canvas;
  if (world.vignette > 0) {
    const grad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.25, width / 2, height / 2, Math.max(width, height) * 0.72);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${world.vignette})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  if (world.transform === "lavender") {
    // Ondas del síndrome: bandas horizontales desplazadas y scanlines.
    const bands = 1 + (index % 3);
    for (let b = 0; b < bands; b++) {
      const y = Math.floor(((index * 37 + b * 53) % height));
      const h = 2 + ((index + b) % 4);
      const shift = ((index * 7 + b * 13) % 9) - 4;
      const slice = ctx.getImageData(0, y, width, Math.min(h, height - y));
      ctx.putImageData(slice, shift, y);
      ctx.fillStyle = "rgba(190,150,255,0.18)";
      ctx.fillRect(0, y, width, 1);
    }
  }
  if (world.transform === "strangled") {
    // Marcas del amo: una línea roja cruza la ficha (la correa), nunca igual.
    ctx.strokeStyle = "rgba(190,20,30,0.55)";
    ctx.lineWidth = 2;
    const y = Math.round(height * (0.28 + ((index % 5) * 0.09)));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(width * 0.3, y + 8, width * 0.7, y - 8, width, y + 2);
    ctx.stroke();
  }
  if (world.transform === "buried") {
    // La fosa: borde de tierra en la parte baja de la ficha.
    const grad = ctx.createLinearGradient(0, height * 0.78, 0, height);
    grad.addColorStop(0, "rgba(20,12,6,0)");
    grad.addColorStop(1, "rgba(12,8,4,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.floor(height * 0.68), width, height);
  }
}

/**
 * Afilado suave (unsharp mask): devuelve al arte el detalle que pierden las paletas
 * apagadas, para que la propuesta de muros siga leyendo estructura y no sólo color.
 */
function sharpen(canvas, amount, radius = 1) {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d");
  const source = ctx.getImageData(0, 0, width, height);
  const blurred = createCanvas(width, height);
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(${radius}px)`;
  bctx.drawImage(canvas, 0, 0);
  const bd = bctx.getImageData(0, 0, width, height).data;
  const out = ctx.createImageData(width, height);
  for (let i = 0; i < source.data.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = source.data[i + k] + amount * (source.data[i + k] - bd[i + k]);
      out.data[i + k] = Math.max(0, Math.min(255, v));
    }
    out.data[i + 3] = source.data[i + 3];
  }
  ctx.putImageData(out, 0, 0);
}

/** Recorta una ficha de origen a CELL_W×CELL_H cubriendo el marco (cover) y la transforma. */
async function buildFicha(sourceFile, bbox, world, index) {
  const canvas = createCanvas(CELL_W, CELL_H);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const [x0, y0, x1, y1] = bbox;
  const sw = x1 - x0, sh = y1 - y0;
  const zoom = world.zoom;
  const cover = Math.max(CELL_W / sw, CELL_H / sh) * zoom;
  const dw = sw * cover, dh = sh * cover;
  ctx.drawImage(sourceFile, x0, y0, sw, sh, (CELL_W - dw) / 2, (CELL_H - dh) / 2, dw, dh);
  if (index % 3 === 1) { // espejo en una de cada tres fichas
    const flipped = createCanvas(CELL_W, CELL_H);
    const fctx = flipped.getContext("2d");
    fctx.imageSmoothingEnabled = false;
    fctx.translate(CELL_W, 0);
    fctx.scale(-1, 1);
    fctx.drawImage(canvas, 0, 0);
    canvas.getContext("2d").clearRect(0, 0, CELL_W, CELL_H);
    canvas.getContext("2d").drawImage(flipped, 0, 0);
  }
  transformSheet(canvas, world);
  finishSheet(canvas.getContext("2d"), world, index);
  if (world.sharpen) sharpen(canvas, world.sharpen);
  return canvas;
}

// --------------------------------------------------------------- detección de rejilla
function findSeparators(px, { dark = 40, ratio = 0.88 } = {}) {
  const rows = [], cols = [];
  for (let y = 0; y < px.height; y++) {
    let count = 0;
    for (let x = 0; x < px.width; x++) {
      const i = (y * px.width + x) * 4;
      if (px.data[i] < dark && px.data[i + 1] < dark && px.data[i + 2] < dark) count++;
    }
    if (count / px.width >= ratio) rows.push(y);
  }
  for (let x = 0; x < px.width; x++) {
    let count = 0;
    for (let y = 0; y < px.height; y++) {
      const i = (y * px.width + x) * 4;
      if (px.data[i] < dark && px.data[i + 1] < dark && px.data[i + 2] < dark) count++;
    }
    if (count / px.height >= ratio) cols.push(x);
  }
  return { rows: groupRuns(rows), cols: groupRuns(cols) };
}
function groupRuns(values) {
  const runs = [];
  for (const v of values) {
    const last = runs[runs.length - 1];
    if (last && v - last[1] <= 2) last[1] = v;
    else runs.push([v, v]);
  }
  return runs;
}
function cellsBetween(runs, total, minSize) {
  const cells = [];
  for (let i = 0; i < runs.length - 1; i++) {
    const start = runs[i][1] + 1, end = runs[i + 1][0] - 1;
    if (end - start + 1 >= minSize) cells.push([start, end]);
  }
  if (!cells.length) cells.push([0, total - 1]);
  return cells;
}
function uniformCells(total, count, { header = 0, footer = 0 } = {}) {
  const usable = total - header - footer;
  const size = Math.floor(usable / count);
  const cells = [];
  for (let i = 0; i < count; i++) cells.push([header + i * size, header + (i + 1) * size - 1]);
  return cells;
}
function contentBBox(px, [x0, y0, x1, y1], { dark = 24 } = {}) {
  let minX = x1, minY = y1, maxX = x0, maxY = y0, found = false;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * px.width + x) * 4;
      const lit = !(px.data[i] < dark && px.data[i + 1] < dark && px.data[i + 2] < dark);
      if (!lit) continue;
      found = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return found ? [minX, minY, maxX, maxY] : [x0, y0, x1, y1];
}

// --------------------------------------------------------------- main
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
const sources = Object.entries(mapping)
  .filter(([k]) => !k.startsWith("$") && typeof mapping[k] === "string")
  .map(([key, file]) => ({ key, file: path.join(ROOT, file) }))
  .filter((s) => fs.existsSync(s.file));
if (sources.length < 5) {
  console.error(`Faltan mosaicos fuente en ${path.relative(ROOT, SOURCE_DIR)} (encontrados ${sources.length}).`);
  process.exit(1);
}

async function collectCells() {
  const pool = new Map();
  for (const source of sources) {
    const image = await loadImage(source.file);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const px = ctx.getImageData(0, 0, image.width, image.height);
    const { rows, cols } = findSeparators(px);
    let rowCells = cellsBetween(rows, image.height, Math.floor(image.height / 8));
    let colCells = cellsBetween(cols, image.width, Math.floor(image.width / 8));
    if (!rowCells.length || !colCells.length) {
      rowCells = uniformCells(image.height, 3, { header: 24 });
      colCells = uniformCells(image.width, 5);
    }
    const cells = [];
    for (const [cy0, cy1] of rowCells) {
      for (const [cx0, cx1] of colCells) {
        const bbox = contentBBox(px, [cx0, cy0, cx1, cy1]);
        if (bbox[2] - bbox[0] < 60 || bbox[3] - bbox[1] < 40) continue;   // fichas vacías
        cells.push({ file: source.file, key: source.key, bbox });
      }
    }
    pool.set(source.key, cells);
  }
  return pool;
}

function pickCells(pool, world, count) {
  const ordered = [];
  for (const key of world.sources) ordered.push(...(pool.get(key) ?? []));
  if (ordered.length < count) throw new Error(`${world.key}: sólo ${ordered.length} fichas de origen para ${count} mapas`);
  const step = Math.max(1, Math.floor(ordered.length / count));
  const picks = [];
  for (let i = 0; i < count; i++) picks.push(ordered[(i * step + (i % 3) * 2) % ordered.length]);
  return picks;
}

async function buildWorldSheet(world, pool, mappingSources) {
  const images = new Map();
  const load = async (file) => {
    if (!images.has(file)) images.set(file, await loadImage(file));
    return images.get(file);
  };
  const picks = pickCells(pool, world, COLS * ROWS);
  const width = TILE + COLS * (CELL_W + TILE);
  const height = HEADER + TILE + ROWS * (CELL_H + TILE);
  const sheet = createCanvas(width, height);
  const ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, width, HEADER);
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(world.title, TILE + 4, 28);
  ctx.fillStyle = "#9a9a9a";
  ctx.font = "13px sans-serif";
  ctx.fillText(world.subtitle, TILE + 4, 46);
  for (const [i, pick] of picks.entries()) {
    const source = await load(pick.file);
    const ficha = await buildFicha(source, pick.bbox, world, i);
    const cx = TILE + (i % COLS) * (CELL_W + TILE);
    const cy = HEADER + TILE + Math.floor(i / COLS) * (CELL_H + TILE);
    ctx.fillStyle = "#101010";
    ctx.fillRect(cx - TILE, cy - TILE, CELL_W + TILE * 2, CELL_H + TILE * 2);
    ctx.drawImage(ficha, cx, cy);
  }
  const out = path.join(SOURCE_DIR, world.file);
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(out, sheet.toBuffer("image/png"));
  mapping[world.resource] = path.relative(ROOT, out);
  void mappingSources;
  return { out, width, height, fichas: picks.length };
}

if (VERIFY) {
  const problems = [];
  for (const world of WORLDS) {
    const file = path.join(SOURCE_DIR, world.file);
    if (!fs.existsSync(file)) { problems.push(`falta ${world.file} (ejecuta npm run dn:mosaicos:origen)`); continue; }
    const image = await loadImage(file);
    if (image.width < 900 || image.height < 500) problems.push(`${world.file} mide ${image.width}×${image.height}: demasiado pequeño`);
    if (mapping[world.resource] !== path.relative(ROOT, file)) problems.push(`mapping.json no registra ${world.resource} → ${world.file}`);
  }
  if (problems.length) {
    for (const p of problems) console.error(`FALLA: ${p}`);
    process.exit(1);
  }
  console.log(`mosaicos origen: ${WORLDS.length} hojas (W7–W9) presentes y registradas en mapping.json`);
  process.exit(0);
}

const pool = await collectCells();
for (const world of WORLDS) {
  if (SAMPLE && world.key !== SAMPLE) continue;
  const result = await buildWorldSheet(world, pool, sources);
  console.log(`${world.key} ${world.title} · ${result.fichas} fichas · ${result.width}×${result.height} → ${path.relative(ROOT, result.out)}`);
}
fs.writeFileSync(MAPPING_PATH, `${JSON.stringify(mapping, null, 2)}\n`);
console.log(`mapping.json actualizado con R8/R9/R10`);
