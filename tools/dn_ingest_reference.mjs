#!/usr/bin/env node
/**
 * Ingesta de los recursos visuales de «Dimensional Nightmare».
 *
 * Toma los 7 mosaicos de referencia depositados en
 * `reference/dimensional_nightmare/recursos/` y produce:
 *
 *   - `reference/dimensional_nightmare/slices/<recurso>/NN.png`  fichas sueltas
 *   - `reference/dimensional_nightmare/index.json`               catálogo medido
 *
 * Cada ficha se mide (tamaño, tiles aparentes, factor de escala, paleta y
 * luminancia) para que las fases siguientes del plan (clasificación de
 * materiales → reconstrucción → verificación) trabajen con datos, no a ojo.
 *
 * Uso:
 *   node tools/dn_ingest_reference.mjs            # ingesta completa (si hay recursos)
 *   node tools/dn_ingest_reference.mjs --check    # solo informa qué falta
 *   node tools/dn_ingest_reference.mjs --selftest # prueba la rejilla con un fixture sintético
 *
 * No toca el juego: es una herramienta de referencia.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(ROOT, "reference", "dimensional_nightmare");
// El usuario deposita los mosaicos en Mapas/crepypasta/ (Mapas/Atlas/ se ignora en esta fase).
const INPUT_DIRS = [path.join(ROOT, "Mapas", "crepypasta"), path.join(REF, "recursos")];
const SLICES = path.join(REF, "slices");
const INDEX_PATH = path.join(REF, "index.json");
const LAYOUT_PATH = path.join(REF, "layout.json");

const CHECK_ONLY = process.argv.includes("--check");
const SELFTEST = process.argv.includes("--selftest");
const FIXTURES_MODE = process.argv.includes("--fixtures");
const FIXTURES = path.join(REF, "_fixtures");

// ------------------------------------------------------------------ recursos
const RESOURCES = [
  { key: "r1_glitch_city", label: "R1 Glitch City", rows: 4, cols: 4, expect: 16, tokens: ["glitch"] },
  { key: "r2_dark_forest", label: "R2 Creepy Dark Forest", rows: 4, cols: 4, expect: 16, tokens: ["forest", "bosque"], exclude: ["snow", "nieve", "mountain"] },
  { key: "r3_king_unown", label: "R3 Sprite King Unown", rows: 1, cols: 1, expect: 1, tokens: ["king", "sprite", "rey", "boss", "jefe"] },
  { key: "r4_trono_unown", label: "R4 El Trono del Rey Unown", rows: 4, cols: 4, expect: 16, tokens: ["trono", "throne", "unown"] },
  { key: "r5_pueblos_tumbas", label: "R5 Pueblos y Tumbas", rows: 4, cols: 4, expect: 16, tokens: ["pueblo", "tumb", "sepia", "silver", "b&w", "bn"] },
  { key: "r6_snowy_mountain", label: "R6 Creepy Snowy Mountain", rows: 5, cols: 3, expect: 15, tokens: ["snow", "nieve", "mountain", "monta"] },
  { key: "r7_catacumbas", label: "R7 Catacumbas de Lavanda", rows: 4, cols: 4, expect: 16, tokens: ["catacumb", "lavanda", "lavender", "buried", "mano", "hand"] },
];
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

const readLayout = () => {
  if (!fs.existsSync(LAYOUT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(LAYOUT_PATH, "utf8")).overrides ?? {};
  } catch (error) {
    console.warn(`layout.json ilegible (${error.message}); se usa autodetección.`);
    return {};
  }
};

/**
 * Descubre los archivos de los 7 recursos: nombre exacto → tokens → sobrantes.
 * Recolecta de Mapas/crepypasta/ (recursivo) y de reference/dimensional_nightmare/recursos/.
 */
function discoverSources(dirs = INPUT_DIRS) {
  dirs = dirs.filter((dir) => fs.existsSync(dir));
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        files.push({ full, name: entry.name, lower: entry.name.toLowerCase() });
      }
    }
  };
  for (const dir of dirs) walk(dir);

  // Puntúa cada par (recurso, archivo) y asigna de mayor a menor: evita que
  // «4 EL TRONO DEL REY UNOWN» caiga en R3 por la palabra "rey".
  const scoreOf = (resource, file) => {
    const base = path.basename(file.name, path.extname(file.name)).toLowerCase();
    if (base === resource.key) return 1000;
    const n = resource.key[1];
    let score = 0;
    if (new RegExp(`^\\s*(r?0?${n})\\b`).test(base)) score += 100;
    if (base.includes(resource.key.replace(/_/g, " "))) score += 80;
    for (const token of resource.tokens) if (base.includes(token)) score += 20;
    for (const token of resource.exclude ?? []) if (base.includes(token)) score -= 200;
    return score;
  };
  const candidates = [];
  for (const resource of RESOURCES) {
    for (const file of files) {
      const score = scoreOf(resource, file);
      if (score > 0) candidates.push({ resource, file, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const used = new Set();
  const found = new Map();
  for (const { resource, file } of candidates) {
    if (found.has(resource.key) || used.has(file.full)) continue;
    found.set(resource.key, file);
    used.add(file.full);
  }
  const leftovers = files.filter((f) => !used.has(f.full));
  const unassigned = [];
  for (const resource of RESOURCES) {
    if (found.has(resource.key)) continue;
    const next = leftovers.shift();
    if (next) { found.set(resource.key, next); used.add(next.full); }
    else unassigned.push(resource);
  }
  return { found, files, unassigned, leftovers };
}

// ------------------------------------------------------------------- píxeles
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

async function loadPixels(file) {
  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  return { width: img.width, height: img.height, data, canvas, ctx };
}

/** Filas/columnas que son casi enteramente oscuras → separadores de la rejilla. */
function findSeparators(px, { dark = 40, ratio = 0.88 } = {}) {
  const { width, height, data } = px;
  const rows = [];
  const cols = [];
  for (let y = 0; y < height; y++) {
    let dark_count = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16 || luminance(data[i], data[i + 1], data[i + 2]) < dark) dark_count++;
    }
    if (dark_count / width >= ratio) rows.push(y);
  }
  for (let x = 0; x < width; x++) {
    let dark_count = 0;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16 || luminance(data[i], data[i + 1], data[i + 2]) < dark) dark_count++;
    }
    if (dark_count / height >= ratio) cols.push(x);
  }
  return { rows: groupRuns(rows), cols: groupRuns(cols) };
}

/** Agrupa índices contiguos en bandas [start, end]. */
function groupRuns(values) {
  const runs = [];
  for (const v of values) {
    const last = runs[runs.length - 1];
    if (last && v <= last[1] + 1) last[1] = v;
    else runs.push([v, v]);
  }
  return runs.map(([a, b]) => [a, b]);
}

/** Intervalos entre bandas (excluyendo bordes) + filtro de bandas finas (títulos/etiquetas). */
function cellsBetween(runs, total, minSize) {
  const bounds = [0, ...runs.flat(), total];
  const cells = [];
  for (let i = 0; i < bounds.length - 1; i += 2) {
    const start = i === 0 ? 0 : bounds[i] + 1;
    const end = i + 1 >= bounds.length ? total - 1 : bounds[i + 1] - 1;
    if (end - start + 1 >= minSize) cells.push([start, end]);
  }
  return cells;
}

/** Si la autodetección no cuadra, divide uniformemente. */
function uniformCells(total, count, { header = 0, footer = 0 } = {}) {
  const usable = total - header - footer;
  const size = Math.floor(usable / count);
  return Array.from({ length: count }, (_, i) => {
    const start = header + i * size;
    return [start, Math.min(header + (i + 1) * size - 1, total - 1)];
  });
}

function contentBBox(px, [x0, y0, x1, y1], { dark = 24 } = {}) {
  const { width, data } = px;
  let minX = x1, maxX = x0, minY = y1, maxY = y0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16) continue;
      if (luminance(data[i], data[i + 1], data[i + 2]) > dark) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX || minY > maxY) return [x0, y0, x1, y1];
  return [minX, minY, maxX, maxY];
}

function paletteOf(px, [x0, y0, x1, y1], top = 10) {
  const { width, data } = px;
  const counts = new Map();
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16) continue;
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([key, count]) => {
      const hex = ((key >> 8) & 0xf) * 17, g = ((key >> 4) & 0xf) * 17, b = (key & 0xf) * 17;
      return { hex: `#${[hex, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`, count };
    });
}

function meanLuminance(px, [x0, y0, x1, y1]) {
  const { width, data } = px;
  let sum = 0, n = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16) continue;
      sum += luminance(data[i], data[i + 1], data[i + 2]);
      n++;
    }
  }
  return n ? +(sum / n).toFixed(1) : 0;
}

/** Huella de 8×8 para detectar fichas repetidas entre recursos. */
function fingerprint(px, [x0, y0, x1, y1]) {
  const { width, data } = px;
  const cells = 8;
  const out = [];
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const sx = x0 + Math.floor(((x1 - x0 + 1) * cx) / cells);
      const ex = x0 + Math.floor(((x1 - x0 + 1) * (cx + 1)) / cells) - 1;
      const sy = y0 + Math.floor(((y1 - y0 + 1) * cy) / cells);
      const ey = y0 + Math.floor(((y1 - y0 + 1) * (cy + 1)) / cells) - 1;
      let sum = 0, n = 0;
      for (let y = sy; y <= Math.max(sy, ey); y++) {
        for (let x = sx; x <= Math.max(sx, ex); x++) {
          const i = (y * width + x) * 4;
          sum += luminance(data[i], data[i + 1], data[i + 2]);
          n++;
        }
      }
      out.push(Math.round((sum / Math.max(1, n)) / 16));
    }
  }
  return out.map((v) => v.toString(16)).join("");
}

/** Factor de escala entero (1–4) que haría la ficha múltiplo de 16 px. */
function scaleGuess(w, h) {
  for (const factor of [1, 2, 3, 4]) {
    if (w % factor === 0 && h % factor === 0 && (w / factor) % 16 === 0 && (h / factor) % 16 === 0) return factor;
  }
  return 1;
}

// --------------------------------------------------------------- integración
async function ingestResource(resource, file, layout) {
  if (!file) return null;
  const px = await loadPixels(file.full);
  const { rows: rowRuns, cols: colRuns } = findSeparators(px);
  const minRow = Math.floor(px.height / (resource.rows * 4));
  const minCol = Math.floor(px.width / (resource.cols * 4));
  let rowCells = cellsBetween(rowRuns, px.height, minRow);
  let colCells = cellsBetween(colRuns, px.width, minCol);
  let mode = "auto";
  if (rowCells.length !== resource.cols || colCells.length !== resource.rows) {
    rowCells = uniformCells(px.height, resource.cols, layout);
    colCells = uniformCells(px.width, resource.rows, layout);
    mode = "uniform";
  }
  const dir = path.join(SLICES, resource.key);
  fs.mkdirSync(dir, { recursive: true });

  const slices = [];
  let index = 0;
  rowCells.forEach(([cy0, cy1], row) => {
    colCells.forEach(([cx0, cx1], col) => {
      index++;
      const bbox = contentBBox(px, [cx0, cy0, cx1, cy1]);
      const w = bbox[2] - bbox[0] + 1;
      const h = bbox[3] - bbox[1] + 1;
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(px.canvas, bbox[0], bbox[1], w, h, 0, 0, w, h);
      const name = `${String(index).padStart(2, "0")}.png`;
      fs.writeFileSync(path.join(dir, name), canvas.toBuffer("image/png"));
      const factor = scaleGuess(w, h);
      slices.push({
        index,
        row: row + 1,
        col: col + 1,
        file: path.relative(ROOT, path.join(dir, name)),
        width: w,
        height: h,
        scaleGuess: factor,
        tilesWide: Math.round(w / factor / 16),
        tilesHigh: Math.round(h / factor / 16),
        exact16: w % 16 === 0 && h % 16 === 0,
        luminance: meanLuminance(px, bbox),
        palette: paletteOf(px, bbox),
        fingerprint: fingerprint(px, bbox),
      });
    });
  });

  return {
    key: resource.key,
    label: resource.label,
    source: path.relative(ROOT, file.full),
    image: { width: px.width, height: px.height },
    grid: { rows: resource.rows, cols: resource.cols, mode, rowRuns: rowRuns.length, colRuns: colRuns.length },
    expects: resource.expect,
    slices,
  };
}

function reportFound({ found, files, unassigned, leftovers }, dirs = INPUT_DIRS) {
  const home = path.relative(ROOT, dirs[0]) || "Mapas/crepypasta";
  console.log(`Carpeta de recursos: ${home}/ (también se acepta reference/dimensional_nightmare/recursos/)`);
  console.log(`Archivos de imagen encontrados: ${files.length}`);
  for (const resource of RESOURCES) {
    const file = found.get(resource.key);
    const origin = file ? path.relative(ROOT, file.full) : "— falta —";
    console.log(`  ${file ? "OK " : "FALTA"} ${resource.key.padEnd(20)} ← ${origin}`);
  }
  if (unassigned.length) {
    console.log("\nSin archivo asignado: " + unassigned.map((r) => r.key).join(", "));
    console.log("Nombra los mosaicos como indica reference/dimensional_nightmare/README.md.");
    console.log("Documento de referencia: docs/DIMENSIONAL_NIGHTMARE/12_PLAN_DE_RECREACION_DE_MAPAS.md");
    return false;
  }
  if (leftovers.length) {
    console.log(`\nAviso: ${leftovers.length} imagen(es) sin usar (¿Mapas/Atlas? se ignora en esta fase).`);
  }
  return true;
}

// ------------------------------------------------------------------ fixtures
/** Genera 7 mosaicos sintéticos con la rejilla real de cada recurso (para probar el pipeline). */
function generateFixtures() {
  fs.mkdirSync(FIXTURES, { recursive: true });
  const CELL = 96, GAP = 8, HEADER = 48;
  const defs = [
    ["r1_glitch_city.png", 4, 4, "GLITCH CITY COMPILATION"],
    ["r2_dark_forest.png", 4, 4, "CREEPY DARK FOREST"],
    ["r3_king_unown.png", 1, 1, "KING UNOWN"],
    ["r4_trono_unown.png", 4, 4, "EL TRONO DEL REY UNOWN"],
    ["r5_pueblos_tumbas.png", 4, 4, "PUEBLOS Y TUMBAS"],
    ["r6_snowy_mountain.png", 5, 3, "CREEPY SNOWY MOUNTAIN"],
    ["r7_catacumbas.png", 4, 4, "CATACUMBAS DE LAVANDA"],
  ];
  for (const [name, cols, rows, title] of defs) {
    const w = cols * CELL + (cols + 1) * GAP;
    const h = HEADER + rows * CELL + (rows + 1) * GAP;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText(title, 12, 30);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = GAP + c * (CELL + GAP);
        const py = HEADER + GAP + r * (CELL + GAP);
        ctx.fillStyle = `rgb(${30 + r * 35},${70 + c * 30},${110 + ((r + c) % 3) * 30})`;
        ctx.fillRect(px, py, CELL, CELL);
        ctx.fillStyle = "#e8e8d0";
        ctx.fillRect(px + 10, py + 10, 20, 20);
        ctx.fillRect(px + 60, py + 60, 18, 18);
      }
    }
    fs.writeFileSync(path.join(FIXTURES, name), canvas.toBuffer("image/png"));
  }
  console.log(`fixtures: ${defs.length} mosaicos sintéticos → ${path.relative(ROOT, FIXTURES)}/`);
}

// ------------------------------------------------------------------ selftest
async function selftest() {
  const cell = 64, gap = 6, header = 40, cols = 4, rows = 4;
  const width = cols * cell + (cols + 1) * gap;
  const height = header + rows * cell + (rows + 1) * gap;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px sans-serif";
  ctx.fillText("SELFTEST", 10, 24);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gap + c * (cell + gap);
      const y = header + gap + r * (cell + gap);
      ctx.fillStyle = `rgb(${40 + r * 40}, ${90 + c * 30}, ${120 + r * 20})`;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(x + 8, y + 8, 12, 12);
    }
  }
  const fixture = path.join(REF, "selftest.png");
  fs.mkdirSync(REF, { recursive: true });
  fs.writeFileSync(fixture, canvas.toBuffer("image/png"));
  const px = await loadPixels(fixture);
  const { rows: rr, cols: cr } = findSeparators(px);
  const minRow = Math.floor(px.height / 16);
  const minCol = Math.floor(px.width / 16);
  const rowCells = cellsBetween(rr, px.height, minRow);
  const colCells = cellsBetween(cr, px.width, minCol);
  const ok = rowCells.length === cols && colCells.length === rows;
  console.log(`selftest: separadores filas=${rr.length} columnas=${cr.length} → celdas ${colCells.length}×${rowCells.length} (esperado ${cols}×${rows})`);
  if (!ok) {
    console.error("selftest FALLO: la autodetección no reconstruyó la rejilla.");
    process.exitCode = 1;
    return;
  }
  const bbox = contentBBox(px, [colCells[0][0], rowCells[0][0], colCells[0][1], rowCells[0][1]]);
  console.log(`selftest OK · primera ficha ${bbox[2] - bbox[0] + 1}×${bbox[3] - bbox[1] + 1} px (celda ${cell}×${cell})`);
  fs.rmSync(fixture, { force: true });
}

// ---------------------------------------------------------------------- main
if (SELFTEST) {
  await selftest();
  process.exit(process.exitCode ?? 0);
}

const layoutOverrides = readLayout();
const sourceDirs = FIXTURES_MODE ? (generateFixtures(), [FIXTURES]) : INPUT_DIRS;
const discovered = discoverSources(sourceDirs);
const complete = reportFound(discovered, sourceDirs);
if (CHECK_ONLY) process.exit(complete ? 0 : 1);
if (!complete) process.exit(1);

fs.mkdirSync(SLICES, { recursive: true });
const index = {
  title: "Dimensional Nightmare — catálogo de referencia visual",
  generatedBy: "tools/dn_ingest_reference.mjs",
  fixture: FIXTURES_MODE,
  note: "Cada ficha es la referencia de UN mapa del GDD (docs/DIMENSIONAL_NIGHTMARE/11_ASIGNACION_DE_RECURSOS.md).",
  resources: [],
};
let total = 0, mismatches = [];
for (const resource of RESOURCES) {
  const layout = layoutOverrides[resource.key] ?? {};
  const entry = await ingestResource(resource, discovered.found.get(resource.key), layout);
  if (!entry) continue;
  total += entry.slices.length;
  if (entry.slices.length !== resource.expect) {
    mismatches.push(`${resource.key}: ${entry.slices.length} fichas (se esperaban ${resource.expect})`);
  }
  index.resources.push(entry);
  console.log(`${resource.key}: ${entry.slices.length}/${resource.expect} fichas · rejilla ${entry.grid.mode} · ${entry.image.width}×${entry.image.height}px`);
}
fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
console.log(`\nTotal: ${total} fichas → ${path.relative(ROOT, INDEX_PATH)}`);
if (mismatches.length) {
  console.warn("Avisos de rejilla (revisa layout.json):\n  " + mismatches.join("\n  "));
  process.exitCode = 1;
}
