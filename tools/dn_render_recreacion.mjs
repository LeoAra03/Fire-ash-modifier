#!/usr/bin/env node
/**
 * dn_render_recreacion.mjs — mosaicos de referencia de los mapas del Nightmare.
 *
 * El usuario entregó las crepypastas como siete mosaicos de fichas (una captura
 * por mapa). Esta herramienta devuelve el gesto: arma, con el mismo aire de
 * mosaico (rejilla + separadores oscuros + rótulo), una hoja por episodio donde
 * cada celda compara la ficha de la crepypasta con el mapa construido y su
 * transitabilidad. Además genera un mosaico general con los 103 mapas.
 *
 * Cada celda muestra, de izquierda a derecha:
 *   1. la ficha original del mosaico de la crepypasta (`primary.slice`),
 *   2. el mapa instalado, renderizado con los gráficos reales del juego,
 *   3. el overlay de transitabilidad (verde = alcanzable, ámbar = aislado,
 *      rojo = muro), calculado con la propuesta de `dn:pasajes`.
 *
 * Salidas (versionadas): `docs/dn_referencia/recreacion/<EPISODIO>.png`,
 * `00_MOSAICO_GENERAL.png` e `INDICE.md`. El panel suelto por mapa queda en
 * `detalle/` (ignorado, se regenera).
 *
 * Uso:
 *   node tools/dn_render_recreacion.mjs --all
 *   node tools/dn_render_recreacion.mjs --episode EP01
 *   node tools/dn_render_recreacion.mjs --only 2041,2042
 *   node tools/dn_render_recreacion.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { renderMapId } from "./render_map_png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLUEPRINT = path.join(ROOT, "content", "dimensional_nightmare_maps.json");
const BUILT = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const PASSABILITY = path.join(ROOT, "content", "dimensional_nightmare_passability.json");
const OUT_DIR = path.join(ROOT, "docs", "dn_referencia", "recreacion");
const DETAIL_DIR = path.join(OUT_DIR, "detalle");
const INDEX_MD = path.join(OUT_DIR, "INDICE.md");

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const CHECK = argv.includes("--check");
const ALL = argv.includes("--all") || (!argv.includes("--episode") && !option("--only", null) && !CHECK);
const EPISODE = option("--episode", null);
const ONLY = (option("--only", "") || "").split(",").map((s) => s.trim()).filter(Boolean).map(Number);

// Geometría del mosaico. Los anchos son objetivos: cada panel se reduce a lo ancho
// manteniendo su proporción, así un mapa 46×46 no rompe la rejilla.
const REF_W = 300;
const BUILT_W = 336;
const OVERLAY_W = 336;
const CAPTION = 22;
const HEADER = 30;
const GAP = 14;
const COLS = 4;
const MASTER_COLS = 12;
const MASTER_W = 150;
const BG = "#101014";
const SEP = "#2a2a33";
const INK = "#f0d9a0";
const INK2 = "#9fb3c8";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function loadSources() {
  const blueprint = readJson(BLUEPRINT).maps;
  const built = new Map(readJson(BUILT).maps.map((m) => [m.id, m]));
  const passability = readJson(PASSABILITY).maps;
  const maps = blueprint.map((m) => ({ ...m, built: built.get(m.id) ?? null, pass: passability[String(m.id)] ?? null }));
  return maps.filter((m) => m.built);
}

/** Celdas transitables y su alcanzabilidad según `computed` (muros) + `open`. */
function walkability(entry) {
  const w = entry.width, h = entry.height;
  const blocked = new Set(entry.computed ?? []);
  const open = new Set(entry.open ?? []);
  const isWall = (x, y) => blocked.has(`${x},${y}`) && !open.has(`${x},${y}`);
  const walkable = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!isWall(x, y)) walkable.push([x, y]);
  const key = ([x, y]) => `${x},${y}`;
  const walkSet = new Set(walkable.map(key));
  const entryCell = entry.entry ?? walkable[0] ?? [0, 0];
  const start = walkSet.has(key(entryCell)) ? entryCell : walkable[0];
  const reachable = new Set();
  if (start) {
    const queue = [start];
    reachable.add(key(start));
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (walkSet.has(k) && !reachable.has(k)) { reachable.add(k); queue.push([x + dx, y + dy]); }
      }
    }
  }
  return { w, h, isWall, walkSet, reachable, walkable: walkable.length };
}

function scaledSize(width, height, target) {
  const scale = Math.min(1, target / width);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scale };
}

async function buildPanel(entry) {
  const built = entry.built;
  const { canvas: mapCanvas, map } = await renderMapId(entry.id);
  const walk = entry.pass ? walkability(entry.pass) : null;

  const overlay = createCanvas(mapCanvas.width, mapCanvas.height);
  if (walk) {
    const ctx = overlay.getContext("2d");
    for (let y = 0; y < walk.h; y++) {
      for (let x = 0; x < walk.w; x++) {
        const k = `${x},${y}`;
        if (walk.isWall(x, y)) ctx.fillStyle = "rgba(214,48,48,0.45)";
        else if (walk.reachable.has(k)) ctx.fillStyle = "rgba(0,214,120,0.35)";
        else ctx.fillStyle = "rgba(255,196,0,0.45)";
        ctx.fillRect(x * 32, y * 32, 32, 32);
      }
    }
  } else {
    const ctx = overlay.getContext("2d");
    ctx.fillStyle = "rgba(120,120,140,0.25)";
    ctx.fillRect(0, 0, overlay.width, overlay.height);
  }

  let refImage = null;
  const slicePath = entry.primary?.slice ? path.join(ROOT, entry.primary.slice) : null;
  if (slicePath && fs.existsSync(slicePath)) refImage = await loadImage(slicePath);

  const slots = [];
  if (refImage) {
    const s = scaledSize(refImage.width, refImage.height, REF_W);
    slots.push({ canvas: refImage, ...s, caption: `Crepypasta · ficha ${entry.fichaCell ?? `${entry.primary?.resource}-${entry.primary?.index}`}` });
  } else {
    const placeholder = createCanvas(REF_W, Math.round(REF_W * 9 / 16));
    const pctx = placeholder.getContext("2d");
    pctx.fillStyle = "#1a1a22";
    pctx.fillRect(0, 0, placeholder.width, placeholder.height);
    pctx.fillStyle = INK2;
    pctx.font = "15px sans-serif";
    pctx.fillText("sin ficha de mosaico", 12, 26);
    pctx.fillText(entry.built.source ? `mapa base: ${entry.built.source}` : "mapa procedural", 12, 48);
    slots.push({ canvas: placeholder, width: placeholder.width, height: placeholder.height, caption: "Procedencia" });
  }
  const mapSlot = { canvas: mapCanvas, ...scaledSize(mapCanvas.width, mapCanvas.height, BUILT_W), caption: "Mapa construido" };
  const overSlot = { canvas: overlay, ...scaledSize(overlay.width, overlay.height, OVERLAY_W), caption: "Transitabilidad" };
  slots.push(mapSlot, overSlot);

  const baseY = HEADER + CAPTION;
  const contentH = Math.max(...slots.map((s) => s.height));
  const width = slots.reduce((sum, s) => sum + s.width, 0) + GAP * (slots.length + 1);
  const height = baseY + contentH + CAPTION + GAP;
  const panel = createCanvas(width, height);
  const ctx = panel.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#16161c";
  ctx.fillRect(0, 0, width, height);

  const ratio = walk && walk.walkable ? (walk.reachable.size / walk.walkable) : (built.bfs?.ratio ?? 1);
  ctx.fillStyle = INK;
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`${entry.id} · ${entry.title}`, GAP, 21);
  ctx.fillStyle = INK2;
  ctx.font = "13px sans-serif";
  const ficha = entry.fichaCell && entry.fichaCell !== "—" ? entry.fichaCell : "procedural";
  const info = `${entry.episode} · ficha ${ficha} · ts #${built.tilesetId} · ${built.width}×${built.height} · ${built.tiles ?? "?"} tiles · BFS ${(ratio * 100).toFixed(0)}%`;
  ctx.fillText(info, GAP, 21 + CAPTION);
  ctx.fillStyle = SEP;
  ctx.fillRect(GAP, 26, width - GAP * 2, 1);

  let x = GAP;
  const contentY = baseY + CAPTION;
  for (const slot of slots) {
    ctx.fillStyle = SEP;
    ctx.fillRect(x, baseY - 4, slot.width, 1);
    ctx.drawImage(slot.canvas, x, contentY, slot.width, slot.height);
    ctx.fillStyle = INK2;
    ctx.font = "12px sans-serif";
    ctx.fillText(slot.caption, x, contentY + slot.height + 15);
    x += slot.width + GAP;
  }
  return panel;
}

function sheetHeader(title, subtitle, width) {
  const header = createCanvas(width, 54);
  const ctx = header.getContext("2d");
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(0, 0, width, 54);
  ctx.fillStyle = INK;
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(title, GAP, 24);
  ctx.fillStyle = INK2;
  ctx.font = "14px sans-serif";
  ctx.fillText(subtitle, GAP, 44);
  return header;
}

async function buildSheet(name, entries, title) {
  const panels = [];
  for (const entry of entries) {
    const panel = await buildPanel(entry);
    panels.push(panel);
    fs.mkdirSync(DETAIL_DIR, { recursive: true });
    fs.writeFileSync(path.join(DETAIL_DIR, `${entry.id}_mosaico.png`), panel.toBuffer("image/png"));
  }
  const colW = Math.max(...panels.map((p) => p.width));
  const rows = Math.ceil(panels.length / COLS);
  const rowH = Math.max(...panels.map((p) => p.height));
  const width = GAP + COLS * (colW + GAP);
  const height = 54 + GAP + rows * (rowH + GAP);
  const ficha = entries.filter((e) => e.primary).map((e) => `${e.primary.resource}-${e.primary.index}`);
  const subtitle = `${entries.length} mapas · ${name} · fichas ${ficha[0] ?? "—"}…${ficha[ficha.length - 1] ?? "—"} · referencia: las 7 crepypastas del autor`;
  const sheet = createCanvas(width, height);
  const ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(sheetHeader(title, subtitle, width), 0, 0);
  panels.forEach((panel, i) => {
    const cx = GAP + (i % COLS) * (colW + GAP);
    const cy = 54 + GAP + Math.floor(i / COLS) * (rowH + GAP);
    ctx.fillStyle = "#0d0d12";
    ctx.fillRect(cx - 2, cy - 2, colW + 4, rowH + 4);
    ctx.drawImage(panel, cx, cy);
  });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(file, sheet.toBuffer("image/png"));
  return { file, width, height, panels: panels.length };
}

async function buildMaster(entries) {
  const thumbs = [];
  for (const entry of entries) {
    const { canvas } = await renderMapId(entry.id);
    const s = scaledSize(canvas.width, canvas.height, MASTER_W);
    thumbs.push({ canvas, ...s, entry });
  }
  const cellW = MASTER_W;
  const cellH = Math.max(...thumbs.map((t) => t.height)) + 26;
  const rows = Math.ceil(thumbs.length / MASTER_COLS);
  const width = GAP + MASTER_COLS * (cellW + GAP);
  const height = 54 + GAP + rows * (cellH + GAP);
  const sheet = createCanvas(width, height);
  const ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(sheetHeader("Mosaico general — Dimensional Nightmare",
    `${entries.length} mapas recreados (2040–2142) · cada celda es un mapa instalado, en el orden del GDD`, width), 0, 0);
  thumbs.forEach((t, i) => {
    const cx = GAP + (i % MASTER_COLS) * (cellW + GAP);
    const cy = 54 + GAP + Math.floor(i / MASTER_COLS) * (cellH + GAP);
    ctx.fillStyle = "#0d0d12";
    ctx.fillRect(cx - 2, cy - 2, cellW + 4, cellH + 4);
    const dy = cy + (cellH - 26 - t.height);
    ctx.drawImage(t.canvas, cx, cy + Math.max(0, (cellH - 26 - t.height) / 2), t.width, t.height);
    ctx.fillStyle = INK;
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(String(t.entry.id), cx + 2, cy + cellH - 8);
    ctx.fillStyle = INK2;
    ctx.font = "11px sans-serif";
    ctx.fillText(t.entry.episode, cx + 44, cy + cellH - 8);
    void dy;
  });
  const file = path.join(OUT_DIR, "00_MOSAICO_GENERAL.png");
  fs.writeFileSync(file, sheet.toBuffer("image/png"));
  return { file, width, height, panels: thumbs.length };
}

function writeIndex(entries, sheets) {
  const byEpisode = new Map();
  for (const sheet of sheets) byEpisode.set(sheet.name, sheet);
  const lines = [
    "# Mosaicos de referencia — recreación de los 103 mapas",
    "",
    "Generado por `npm run dn:mosaicos` (`tools/dn_render_recreacion.mjs`) a partir de las fichas de las",
    "crepypastas (`Mapas/Crepypastas/`, catálogo en `reference/dimensional_nightmare/mapping.json`) y de los",
    "mapas instalados en `pokemon_fire_ash/Data/`.",
    "",
    "Cada celda enfrenta la ficha original con el mapa construido y su transitabilidad",
    "(verde = alcanzable desde la entrada, ámbar = transitable aislado, rojo = muro).",
    "La fuente de la transitabilidad es `content/dimensional_nightmare_passability.json`.",
    "",
    "## Hojas",
    "",
    "| Hoja | Mapas | Archivo |",
    "|---|---|---|",
  ];
  for (const sheet of sheets) {
    lines.push(`| ${sheet.name} | ${sheet.panels} | [\`${sheet.name}.png\`](${sheet.name}.png) |`);
  }
  lines.push("", "## Detalle por mapa", "", "| Mapa | Episodio | Título | Ficha | Tileset | Tamaño | Tiles | BFS | Hoja |", "|---|---|---|---|---|---|---|---|---|");
  for (const entry of entries) {
    const built = entry.built;
    const sheet = byEpisode.get(entry.episode) ?? byEpisode.get("NEXO");
    const ficha = entry.fichaCell && entry.fichaCell !== "—" ? entry.fichaCell : "procedural";
    const ratio = built.bfs?.ratio != null ? `${(built.bfs.ratio * 100).toFixed(0)}%` : "—";
    lines.push(`| ${entry.id} | ${entry.episode} | ${entry.title} | ${ficha} | #${built.tilesetId} | ${built.width}×${built.height} | ${built.tiles ?? "—"} | ${ratio} | ${sheet ? sheet.name : "—"} |`);
  }
  lines.push("");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(INDEX_MD, `${lines.join("\n")}\n`);
  return INDEX_MD;
}

function check(entries, sheets) {
  const problems = [];
  if (!fs.existsSync(INDEX_MD)) problems.push("falta INDICE.md (ejecuta npm run dn:mosaicos)");
  else {
    const text = fs.readFileSync(INDEX_MD, "utf8");
    for (const entry of entries) if (!text.includes(`| ${entry.id} |`)) problems.push(`INDICE.md no lista el mapa ${entry.id}`);
  }
  for (const sheet of sheets) {
    const file = path.join(OUT_DIR, `${sheet.name}.png`);
    if (!fs.existsSync(file)) problems.push(`falta la hoja ${sheet.name}.png`);
    else if (fs.statSync(file).size < 20 * 1024) problems.push(`la hoja ${sheet.name}.png parece vacía`);
  }
  if (!fs.existsSync(path.join(OUT_DIR, "00_MOSAICO_GENERAL.png"))) problems.push("falta 00_MOSAICO_GENERAL.png");
  if (problems.length) {
    for (const p of problems) console.error(`FALLA: ${p}`);
    console.error(`mosaicos: ${problems.length} problemas`);
    process.exit(1);
  }
  console.log(`mosaicos: ${entries.length} mapas · ${sheets.length} hojas · índice e imágenes presentes`);
}

// ---------------------------------------------------------------------- main
const all = loadSources();
const episodes = [...new Set(all.map((m) => m.episode))];
const sheets = episodes.map((ep) => ({ name: ep, panels: all.filter((m) => m.episode === ep).length }));

if (CHECK) {
  check(all, sheets);
  process.exit(0);
}

const selected = ONLY.length ? all.filter((m) => ONLY.includes(m.id)) : EPISODE ? all.filter((m) => m.episode === EPISODE) : all;
if (!selected.length) { console.error("No hay mapas que cumplan el filtro."); process.exit(1); }
const targets = ONLY.length || EPISODE ? [...new Set(selected.map((m) => m.episode))] : episodes;

console.log(`mosaicos: ${selected.length} mapas en ${targets.length} hoja(s)${ALL ? " (completo)" : ""}`);
for (const ep of targets) {
  const entries = all.filter((m) => m.episode === ep);
  const result = await buildSheet(ep, entries, `${ep} — recreación del Dimensional Nightmare`);
  console.log(`  ${ep}: ${result.panels} mapas → ${path.relative(ROOT, result.file)} (${(fs.statSync(result.file).size / 1024).toFixed(0)} KB · ${result.width}×${result.height})`);
}
if (!ONLY.length && !EPISODE) {
  const master = await buildMaster(all);
  console.log(`  general: ${master.panels} mapas → ${path.relative(ROOT, master.file)} (${(fs.statSync(master.file).size / 1024).toFixed(0)} KB)`);
}
const index = writeIndex(all, sheets);
console.log(`  índice → ${path.relative(ROOT, index)}`);
