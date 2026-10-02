#!/usr/bin/env node
/**
 * Renderiza uno o varios mapas compilados a PNG (tiles + autotiles + sprites de eventos)
 * usando los gráficos del propio juego. Sirve como referencia visual rápida de un mapa
 * sin abrir Game.exe. No modifica nada.
 *
 * Uso:
 *   node tools/render_map_png.mjs 33 76 --out /tmp/render        # un PNG por mapa
 *   node tools/render_map_png.mjs 2021 --out /tmp/render --scale 0.5
 *   node tools/render_map_png.mjs 33 --file Data/MapXXX.rxdata      # archivo concreto
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad } from "../web/js/marshal.js";
import { parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, readMarshalData } from "./lib/fire_ash_registry.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => { const at = args.indexOf(flag); return at >= 0 && args[at + 1] ? args[at + 1] : fallback; };
const outDir = path.resolve(valueAfter("--out", "/tmp/render"));
const scale = Number(valueAfter("--scale", "1"));
const explicitFile = valueAfter("--file", null);
const grid = args.includes("--grid");
const mapIds = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) { i++; continue; }
  if (/^\d+$/.test(args[i])) mapIds.push(Number(args[i]));
}
// El modo CLI solo actúa si el archivo se ejecuta directamente: así otros
// herramientas (mosaicos de recreación) pueden importar `renderMapBuffer`.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
let gridOverride = null;   // fuerza la rejilla por llamada cuando se usa como librería

export const autotileParts = [
  [27,28,33,34],[5,28,33,34],[27,6,33,34],[5,6,33,34],
  [27,28,33,12],[5,28,33,12],[27,6,33,12],[5,6,33,12],
  [27,28,11,34],[5,28,11,34],[27,6,11,34],[5,6,11,34],
  [27,28,11,12],[5,28,11,12],[27,6,11,12],[5,6,11,12],
  [25,26,31,32],[25,6,31,32],[25,26,31,12],[25,6,31,12],
  [15,16,21,22],[15,16,21,12],[15,16,11,22],[15,16,11,12],
  [29,30,35,36],[29,30,11,36],[5,30,35,36],[5,30,11,36],
  [39,40,45,46],[5,40,45,46],[39,6,45,46],[5,6,45,46],
  [25,30,31,36],[15,16,45,46],[13,14,19,20],[13,14,19,12],
  [17,18,23,24],[17,18,11,24],[41,42,47,48],[5,42,47,48],
  [37,38,43,44],[37,6,43,44],[13,18,19,24],[13,14,43,44],
  [37,42,43,48],[17,18,47,48],[13,18,43,48],[1,2,7,8],
];
const roots = {
  tileset: path.join(GAME, "Graphics", "Tilesets"),
  autotile: path.join(GAME, "Graphics", "Autotiles"),
  character: path.join(GAME, "Graphics", "Characters"),
};
const imageCache = new Map(), dirCache = new Map();
function resolveGraphic(dir, name) {
  if (!name) return null;
  if (!dirCache.has(dir)) dirCache.set(dir, new Map(fs.readdirSync(dir).map((f) => [f.toLowerCase(), f])));
  const files = dirCache.get(dir);
  for (const c of [name, `${name}.png`, `${name}.PNG`, `${name}.jpg`]) { const hit = files.get(c.toLowerCase()); if (hit) return path.join(dir, hit); }
  return null;
}
async function graphic(kind, name) {
  const file = resolveGraphic(roots[kind], name);
  if (!file) return null;
  if (!imageCache.has(file)) imageCache.set(file, loadImage(file));
  return imageCache.get(file);
}
const tilesetsRaw = readMarshalData("Tilesets.rxdata");
const tilesets = new Map();
for (let i = 1; i < tilesetsRaw.length; i++) if (tilesetsRaw[i]) { const t = parseTileset(tilesetsRaw[i]); tilesets.set(t.id, t); }

function drawAutotile(ctx, image, pattern, dx, dy) {
  if (!image) return;
  if (image.width < 96 || image.height < 128) { ctx.drawImage(image, 0, 0, Math.min(32, image.width), Math.min(32, image.height), dx, dy, 32, 32); return; }
  for (let q = 0; q < 4; q++) {
    const part = autotileParts[pattern]?.[q] ?? autotileParts[0][q];
    const s = part - 1;
    ctx.drawImage(image, (s % 6) * 16, Math.floor(s / 6) * 16, 16, 16, dx + (q % 2) * 16, dy + Math.floor(q / 2) * 16, 16, 16);
  }
}
function drawTile(ctx, tilesetImage, autotiles, tileId, x, y) {
  if (!tileId) return;
  if (tileId >= 384) { const s = tileId - 384; ctx.drawImage(tilesetImage, (s % 8) * 32, Math.floor(s / 8) * 32, 32, 32, x, y, 32, 32); return; }
  if (tileId >= 48) drawAutotile(ctx, autotiles[Math.floor(tileId / 48) - 1], tileId % 48, x, y);
}
export async function renderMapBuffer(buffer) {
  const map = parseMap(marshalLoad(buffer));
  const tileset = tilesets.get(map.tilesetId);
  if (!tileset) throw new Error(`Tileset ${map.tilesetId} ausente.`);
  const tilesetImage = await graphic("tileset", tileset.tilesetName);
  if (!tilesetImage) throw new Error(`Gráfico de tileset ausente: ${tileset.tilesetName}`);
  const autotiles = await Promise.all(tileset.autotiles.map((n) => graphic("autotile", n)));
  const canvas = createCanvas(map.width * 32, map.height * 32);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let z = 0; z < 3; z++) for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) drawTile(ctx, tilesetImage, autotiles, tableGet(map.table, x, y, z), x * 32, y * 32);
  const events = map.events.map(({ obj }) => parseEvent(obj)).sort((a, b) => a.y - b.y || a.id - b.id);
  for (const ev of events) {
    const g = ev.pages.map((p) => p.graphic).find((e) => e?.charName || e?.tileId);
    if (!g || g.opacity === 0) continue;
    if (g.tileId) { drawTile(ctx, tilesetImage, autotiles, g.tileId, ev.x * 32, ev.y * 32); continue; }
    const img = await graphic("character", g.charName);
    if (!img) continue;
    const fw = Math.floor(img.width / 4), fh = Math.floor(img.height / 4);
    const row = ({ 2: 0, 4: 1, 6: 2, 8: 3 })[g.direction] ?? 0;
    const col = Math.max(0, Math.min(3, Number(g.pattern ?? 0)));
    ctx.globalAlpha = Number(g.opacity ?? 255) / 255;
    ctx.drawImage(img, col * fw, row * fh, fw, fh, ev.x * 32 + (32 - fw) / 2, ev.y * 32 + 32 - fh, fw, fh);
    ctx.globalAlpha = 1;
  }
  if (gridOverride ?? grid) {
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
    for (let x = 0; x <= map.width; x++) { ctx.beginPath(); ctx.moveTo(x * 32, 0); ctx.lineTo(x * 32, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= map.height; y++) { ctx.beginPath(); ctx.moveTo(0, y * 32); ctx.lineTo(canvas.width, y * 32); ctx.stroke(); }
    ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif";
    for (let x = 0; x < map.width; x += 5) ctx.fillText(String(x), x * 32 + 2, 10);
    for (let y = 0; y < map.height; y += 5) ctx.fillText(String(y), 2, y * 32 + 12);
  }
  return { canvas, map };
}
async function output(buffer, name) {
  const { canvas, map } = await renderMapBuffer(buffer);
  let final = canvas;
  if (scale !== 1) {
    final = createCanvas(Math.round(canvas.width * scale), Math.round(canvas.height * scale));
    const c = final.getContext("2d"); c.imageSmoothingEnabled = false; c.drawImage(canvas, 0, 0, final.width, final.height);
  }
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, final.toBuffer("image/png"));
  console.log(`${file}  (${map.width}x${map.height}, tileset ${map.tilesetId}, ${map.events.length} eventos)`);
}
const mapFile = (id) => path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`);
export async function renderMapId(id, { grid: withGrid = false } = {}) {
  const previous = grid;
  gridOverride = withGrid;
  try {
    return await renderMapBuffer(fs.readFileSync(mapFile(id)));
  } finally {
    gridOverride = previous;
  }
}
if (isMain) {
  if (!mapIds.length && !explicitFile) { console.error("Indica al menos un id de mapa."); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  if (explicitFile) await output(fs.readFileSync(path.resolve(explicitFile)), path.basename(explicitFile, ".rxdata"));
  for (const id of mapIds) await output(fs.readFileSync(mapFile(id)), `Map${String(id).padStart(3, "0")}`);
}
