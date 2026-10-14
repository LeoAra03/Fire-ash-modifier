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
 * **Estilo por mundo, no recoloreado.** Cada mundo nace de una creepypasta de Game Boy, así que
 * cada hoja se dibuja con el estilo de SU juego: paleta de 4 tonos, píxel grande y tramado ordenado
 * (el look de la consola), más el motivo propio (correa roja, tierra de la fosa, ondas del
 * síndrome).   W7 ← Pokémon Red  ·  W8 ← hack sepia de la fosa  ·  W9 ← Pokémon Green/Red (JP).
 *
 * **Fuente: donantes recreados.** Cada ficha parte del render de un mapa ya recreado del primer
 * anillo (W7 ← EP02, W8 ← EP01, W9 ← EP05) para conservar estructura legible (muros, objetos,
 * suelo) y después pasa por el estilo del mundo; el modo `--fotos` usa las fichas del autor.
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
import { renderMapId } from "./render_map_png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(ROOT, "reference", "dimensional_nightmare");
const SOURCE_DIR = path.join(ROOT, "Mapas", "Crepypastas");
const MAPPING_PATH = path.join(REF, "mapping.json");

const argv = process.argv.slice(2);
const VERIFY = argv.includes("--verify");
const PHOTOS = argv.includes("--fotos");   // composición directa desde las fotos del autor
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
    subtitle: "16 fichas · duelo y culpa · estilo Pokémon Red (GB): 4 tonos rojos, píxel y correa del amo",
    sources: ["r7_catacumbas", "r5_pueblos_tumbas", "r4_trono_unown", "r2_dark_forest"],
    transform: "strangled",   // Pokémon Red: 4 tonos rojos, píxel de GB y correa del amo
    donors: [2057, 2072],   // EP02 Lost Silver recreado
    zoom: 1.06,
  },
  {
    key: "W8", resource: "r9_buried_alive", file: "origen_W8_BURIED_ALIVE.png",
    title: "W8 — BURIED ALIVE",
    subtitle: "16 fichas · claustrofobia · estilo hack de GB: sepia de tierra, píxel grueso y borde de fosa",
    sources: ["r7_catacumbas", "r2_dark_forest", "r5_pueblos_tumbas"],
    transform: "buried",      // hack sepia: 4 tonos de tierra, píxel grueso y borde de fosa
    donors: [2041, 2056],   // EP01 White Hand recreado
    zoom: 1.06,
  },
  {
    key: "W9", resource: "r10_lavender_syndrome", file: "origen_W9_LAVENDER_SYNDROME.png",
    title: "W9 — LAVENDER TOWN SYNDROME",
    subtitle: "16 fichas · el sonido duele · estilo Pokémon Green/Red (JP): verdes de GB y ondas violeta",
    sources: ["r5_pueblos_tumbas", "r7_catacumbas", "r4_trono_unown", "r6_snowy_mountain"],
    transform: "lavender",    // Pokémon Green/Red (JP): verdes de GB y ondas violeta del síndrome
    donors: [2104, 2119],   // EP05 Pokémon Black recreado
    zoom: 1.1,
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

/**
 * Estilos por mundo: cada creepypasta del segundo anillo nace de un juego de Game Boy, así que
 * la ficha se dibuja como ese juego (paleta de 4 tonos + píxel grande + tramado ordenado), con
 * el motivo propio encima. No es un recoloreado: cambia la resolución, la paleta y el grano.
 */
const STYLES = {
  strangled: {
    label: "Pokémon Red (GB) · 4 tonos rojos",
    palette: ["#e2a8a8", "#a81c1c", "#581010", "#100303"],
    pixel: 4, dither: 26, vignette: 0.3, frame: "#080202",
  },
  buried: {
    label: "hack sepia de la fosa · 4 tonos de tierra",
    palette: ["#cbb68e", "#7a5f3c", "#3a2c1c", "#0b0805"],
    pixel: 5, dither: 34, vignette: 0.55, earth: true, frame: "#060402",
  },
  lavender: {
    label: "Pokémon Green/Red (JP) · verdes de GB y ondas violeta",
    palette: ["#bcd8b0", "#5f9a63", "#26502e", "#08170c"],
    pixel: 4, dither: 28, vignette: 0.32, waves: true, accent: "#b48ce0", frame: "#040a05",
  },
};

const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const lumaOf = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Píxel grande: se reduce con promedio y se vuelve a subir sin suavizado (look de consola). */
function pixelate(canvas, size) {
  if (!size || size <= 1) return;
  const w = Math.max(1, Math.round(canvas.width / size));
  const h = Math.max(1, Math.round(canvas.height / size));
  const small = createCanvas(w, h);
  const sctx = small.getContext("2d");
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(canvas, 0, 0, w, h);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
}

/** Tramado ordenado 4×4 (Bayer) al cuantizar a la paleta de 4 tonos. */
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function quantize(canvas, palette, amount) {
  const colors = palette.map(hexToRgb);
  const lums = colors.map(([r, g, b]) => lumaOf(r, g, b));
  const ctx = canvas.getContext("2d");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const { width, height } = canvas;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      let l = lumaOf(data[i], data[i + 1], data[i + 2]);
      if (amount) l += ((BAYER4[y % 4][x % 4] + 0.5) / 16 - 0.5) * amount;
      let best = 0, bestDelta = Infinity;
      for (let k = 0; k < lums.length; k++) {
        const delta = Math.abs(l - lums[k]);
        if (delta < bestDelta) { bestDelta = delta; best = k; }
      }
      const [r, g, b] = colors[best];
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Motivos y acabado de cada mundo (después de cuantizar, para que los acentos sobrevivan). */
function finishSheet(ctx, world, index) {
  const style = STYLES[world.transform];
  const { width, height } = ctx.canvas;
  if (style.vignette > 0) {
    const grad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.25, width / 2, height / 2, Math.max(width, height) * 0.72);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${style.vignette})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  if (world.transform === "strangled") {
    // La correa del amo: una curva roja cruza la ficha y nunca cae igual (culpa del duelo).
    ctx.strokeStyle = "rgba(150,12,16,0.75)";
    ctx.lineWidth = style.pixel;
    const y = Math.round(height * (0.26 + ((index % 5) * 0.1)));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(width * 0.3, y + style.pixel * 2, width * 0.7, y - style.pixel * 2, width, y + style.pixel);
    ctx.stroke();
    // Glitch de cartucho: una franja negra recorta la ficha (el juego se cayó una vez).
    if (index % 4 === 2) {
      const gy = Math.round(height * (0.18 + (index % 3) * 0.22));
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, gy, width, style.pixel * 2);
    }
  }
  if (world.transform === "buried") {
    // La fosa: tierra arriba y abajo, con guijarros del tono más oscuro (claustrofobia).
    const grad = ctx.createLinearGradient(0, height * 0.7, 0, height);
    grad.addColorStop(0, "rgba(11,8,5,0)");
    grad.addColorStop(1, "rgba(11,8,5,0.9)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.floor(height * 0.62), width, height);
    ctx.fillStyle = "#0b0805";
    for (let k = 0; k < 18; k++) {
      const px = (index * 53 + k * 71) % width;
      const py = Math.floor(height * 0.72) + ((index * 29 + k * 37) % Math.max(1, Math.floor(height * 0.28)));
      ctx.fillRect(px, py, style.pixel, style.pixel);
    }
    ctx.fillRect(0, 0, width, style.pixel);
  }
  if (world.transform === "lavender") {
    // Ondas del síndrome: el audio rompe la imagen en bandas desplazadas y ruido violeta.
    for (let b = 0; b < 2 + (index % 2); b++) {
      const y = Math.floor((index * 41 + b * 59) % height);
      const h = style.pixel * (1 + ((index + b) % 2));
      const shift = ((index * 11 + b * 17) % (style.pixel * 3)) - style.pixel;
      const slice = ctx.getImageData(0, y, width, Math.min(h, height - y));
      ctx.putImageData(slice, shift, y);
    }
    ctx.fillStyle = "rgba(180,140,224,0.35)";
    for (let k = 0; k < 3; k++) ctx.fillRect(0, (index * 23 + k * 47) % height, width, 1);
    if (index % 3 === 1) {
      ctx.fillStyle = "rgba(232,232,255,0.5)";
      const ny = Math.floor(height * (0.2 + (index % 4) * 0.19));
      for (let x = 0; x < width; x += 2) if ((x + index) % 5 < 2) ctx.fillRect(x, ny, 1, style.pixel);
    }
  }
  ctx.strokeStyle = style.frame;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
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

/** Recorta una ficha de origen a CELL_W×CELL_H (cover) y le aplica el estilo del mundo. */
async function buildFicha(sourceFile, bbox, world, index, donorCanvas = null) {
  const style = STYLES[world.transform];
  const canvas = createCanvas(CELL_W, CELL_H);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = style.palette[style.palette.length - 1];
  ctx.fillRect(0, 0, CELL_W, CELL_H);
  const zoom = world.zoom ?? 1;
  if (donorCanvas) {
    const sw = donorCanvas.width, sh = donorCanvas.height;
    const cover = Math.max(CELL_W / sw, CELL_H / sh) * zoom;
    const dw = sw * cover, dh = sh * cover;
    ctx.drawImage(donorCanvas, (CELL_W - dw) / 2, (CELL_H - dh) / 2, dw, dh);
  } else {
    const [x0, y0, x1, y1] = bbox;
    const sw = x1 - x0, sh = y1 - y0;
    const cover = Math.max(CELL_W / sw, CELL_H / sh) * zoom;
    const dw = sw * cover, dh = sh * cover;
    ctx.drawImage(sourceFile, x0, y0, sw, sh, (CELL_W - dw) / 2, (CELL_H - dh) / 2, dw, dh);
  }
  if (index % 3 === 1) {   // espejo en una de cada tres fichas para variar la composición
    const flipped = createCanvas(CELL_W, CELL_H);
    const fctx = flipped.getContext("2d");
    fctx.imageSmoothingEnabled = false;
    fctx.translate(CELL_W, 0);
    fctx.scale(-1, 1);
    fctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, CELL_W, CELL_H);
    ctx.drawImage(flipped, 0, 0);
  }
  pixelate(canvas, style.pixel);
  quantize(canvas, style.palette, style.dither);
  finishSheet(ctx, world, index);
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
  const donors = [];
  if (!PHOTOS && world.donors) {
    for (let id = world.donors[0]; id <= world.donors[1]; id++) donors.push(id);
    if (donors.length < COLS * ROWS) throw new Error(`${world.key}: ${donors.length} mapas donantes para ${COLS * ROWS} fichas`);
  }
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
    const source = donors.length ? null : await load(pick.file);
    const donorCanvas = donors.length ? (await renderMapId(donors[i])).canvas : null;
    const ficha = await buildFicha(source, pick.bbox, world, i, donorCanvas);
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
  return { out, width, height, fichas: picks.length, modo: donors.length ? `donantes ${world.donors[0]}–${world.donors[1]}` : "fotos del autor" };
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
  console.log(`${world.key} ${world.title} · ${result.fichas} fichas · ${result.width}×${result.height} · ${result.modo} → ${path.relative(ROOT, result.out)}`);
}
fs.writeFileSync(MAPPING_PATH, `${JSON.stringify(mapping, null, 2)}\n`);
console.log(`mapping.json actualizado con R8/R9/R10`);
