#!/usr/bin/env node
/**
 * Renderiza referencias estáticas antes/después para un manifiesto de pulido
 * visual Atlas. No reemplaza la validación dentro de Game.exe.
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad } from "../web/js/marshal.js";
import { parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT, readMarshalData } from "./lib/fire_ash_registry.mjs";

const valueAfter = (flag, fallback) => {
  const at = process.argv.indexOf(flag);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const macro = valueAfter("--macro", "02").padStart(2, "0");
const manifestPath = path.resolve(ROOT, valueAfter("--manifest", `content/atlas_visual_polish_macro${macro}.json`));
const tier2Input = valueAfter("--tier2", null);
const backupDir = path.resolve(ROOT, valueAfter("--backup", `pokemon_fire_ash/PokeModBackups/atlas_visual_macro${macro}_originals`));
const beforeOutput = path.resolve(ROOT, valueAfter("--before", `docs/referencia_visual_atlas_macro${macro}_antes.png`));
const afterOutput = path.resolve(ROOT, valueAfter("--after", `docs/referencia_visual_atlas_macro${macro}_despues.png`));
let entries;
if (tier2Input) {
  const blueprints = JSON.parse(fs.readFileSync(path.resolve(ROOT, tier2Input), "utf8")).blueprints ?? [];
  entries = blueprints.map((blueprint) => {
    const file = path.join(DATA, `Map${String(blueprint.mapId).padStart(3, "0")}.rxdata`);
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    const events = parsed.events.map(({ obj }) => parseEvent(obj)).filter((event) => event.name.startsWith("PokeMod Tier2:"));
    if (events.length !== 2) throw new Error(`${blueprint.mapId}: se esperaban dos NPCs Tier 2 compilados.`);
    return { mapId: blueprint.mapId, label: "2 NPCs Tier 2", changes: events.map((event) => ({ x: event.x, y: event.y })) };
  });
} else {
  entries = JSON.parse(fs.readFileSync(manifestPath, "utf8")).maps;
}
if (!Array.isArray(entries) || !entries.length) throw new Error("El manifiesto no contiene mapas.");

const autotileParts = [
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
const graphicsRoots = {
  tileset: path.join(GAME, "Graphics", "Tilesets"),
  autotile: path.join(GAME, "Graphics", "Autotiles"),
  character: path.join(GAME, "Graphics", "Characters"),
};
const imageCache = new Map();
const directoryCache = new Map();
function resolveGraphic(directory, name) {
  if (!name) return null;
  if (!directoryCache.has(directory)) {
    const files = fs.readdirSync(directory);
    directoryCache.set(directory, new Map(files.map((file) => [file.toLowerCase(), file])));
  }
  const files = directoryCache.get(directory);
  for (const candidate of [name, `${name}.png`, `${name}.jpg`, `${name}.jpeg`]) {
    const actual = files.get(candidate.toLowerCase());
    if (actual) return path.join(directory, actual);
  }
  return null;
}
async function graphic(kind, name) {
  const file = resolveGraphic(graphicsRoots[kind], name);
  if (!file) return null;
  if (!imageCache.has(file)) imageCache.set(file, loadImage(file));
  return imageCache.get(file);
}

const tilesetsRaw = readMarshalData("Tilesets.rxdata");
const tilesets = new Map();
for (let index = 1; index < tilesetsRaw.length; index++) if (tilesetsRaw[index]) {
  const parsed = parseTileset(tilesetsRaw[index]);
  tilesets.set(parsed.id, parsed);
}

async function drawAutotile(ctx, image, pattern, dx, dy) {
  if (!image) return;
  if (image.width < 96 || image.height < 128) {
    ctx.drawImage(image, 0, 0, Math.min(32, image.width), Math.min(32, image.height), dx, dy, 32, 32);
    return;
  }
  const frameX = 0;
  for (let quarter = 0; quarter < 4; quarter++) {
    const part = autotileParts[pattern]?.[quarter] ?? autotileParts[0][quarter];
    const source = part - 1;
    const sx = frameX + (source % 6) * 16;
    const sy = Math.floor(source / 6) * 16;
    const qx = dx + (quarter % 2) * 16;
    const qy = dy + Math.floor(quarter / 2) * 16;
    ctx.drawImage(image, sx, sy, 16, 16, qx, qy, 16, 16);
  }
}

async function drawTile(ctx, tileset, tilesetImage, autotiles, tileId, x, y) {
  if (!tileId) return;
  if (tileId >= 384) {
    const source = tileId - 384;
    ctx.drawImage(tilesetImage, (source % 8) * 32, Math.floor(source / 8) * 32, 32, 32, x, y, 32, 32);
    return;
  }
  if (tileId >= 48) {
    const autotileIndex = Math.floor(tileId / 48) - 1;
    await drawAutotile(ctx, autotiles[autotileIndex], tileId % 48, x, y);
  }
}

function eventGraphic(event) {
  return event.pages.map((page) => page.graphic).find((entry) => entry?.charName || entry?.tileId) ?? null;
}
async function renderMap(buffer) {
  const map = parseMap(marshalLoad(buffer));
  const tileset = tilesets.get(map.tilesetId);
  if (!tileset) throw new Error(`Tileset ${map.tilesetId} ausente.`);
  const tilesetImage = await graphic("tileset", tileset.tilesetName);
  if (!tilesetImage) throw new Error(`Gráfico de tileset ausente: ${tileset.tilesetName}.`);
  const autotiles = await Promise.all(tileset.autotiles.map((name) => graphic("autotile", name)));
  const canvas = createCanvas(map.width * 32, map.height * 32);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let layer = 0; layer < 3; layer++) for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    await drawTile(ctx, tileset, tilesetImage, autotiles, tableGet(map.table, x, y, layer), x * 32, y * 32);
  }
  const events = map.events.map(({ obj }) => parseEvent(obj)).sort((a, b) => a.y - b.y || a.id - b.id);
  for (const event of events) {
    const display = eventGraphic(event);
    if (!display || display.opacity === 0) continue;
    if (display.tileId) {
      await drawTile(ctx, tileset, tilesetImage, autotiles, display.tileId, event.x * 32, event.y * 32);
      continue;
    }
    const image = await graphic("character", display.charName);
    if (!image) continue;
    const frameWidth = Math.floor(image.width / 4);
    const frameHeight = Math.floor(image.height / 4);
    const row = ({ 2: 0, 4: 1, 6: 2, 8: 3 })[display.direction] ?? 0;
    const column = Math.max(0, Math.min(3, Number(display.pattern ?? 0)));
    ctx.globalAlpha = Number(display.opacity ?? 255) / 255;
    ctx.drawImage(image, column * frameWidth, row * frameHeight, frameWidth, frameHeight,
      event.x * 32 + (32 - frameWidth) / 2, event.y * 32 + 32 - frameHeight, frameWidth, frameHeight);
    ctx.globalAlpha = 1;
  }
  return { canvas, width: map.width, height: map.height };
}

function viewport(entry, rendered) {
  const cells = entry.changes;
  const centerX = cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length;
  const centerY = cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length;
  const width = Math.min(20, rendered.width);
  const height = Math.min(14, rendered.height);
  const startX = Math.max(0, Math.min(rendered.width - width, Math.floor(centerX - width / 2)));
  const startY = Math.max(0, Math.min(rendered.height - height, Math.floor(centerY - height / 2)));
  return { startX, startY, width, height };
}

async function renderSheet(source, output) {
  const columns = 5;
  const rows = Math.ceil(entries.length / columns);
  const cardWidth = 320;
  const cardHeight = 260;
  const titleHeight = 30;
  const margin = 4;
  const canvas = createCanvas(columns * cardWidth, rows * cardHeight);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#080b0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  for (const [index, entry] of entries.entries()) {
    const file = `Map${String(entry.mapId).padStart(3, "0")}.rxdata`;
    const buffer = source === "before" ? fs.readFileSync(path.join(backupDir, file)) : fs.readFileSync(path.join(DATA, file));
    const rendered = await renderMap(buffer);
    const view = viewport(entry, rendered);
    const x = (index % columns) * cardWidth;
    const y = Math.floor(index / columns) * cardHeight;
    ctx.fillStyle = "#e3c47c";
    ctx.font = "bold 17px serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`${index + 1} · ${entry.mapId} · ${entry.label ?? entry.motif}`, x + 7, y + titleHeight / 2);
    const availableWidth = cardWidth - margin * 2;
    const availableHeight = cardHeight - titleHeight - margin * 2;
    const scale = Math.min(availableWidth / (view.width * 32), availableHeight / (view.height * 32));
    const drawWidth = view.width * 32 * scale;
    const drawHeight = view.height * 32 * scale;
    const drawX = x + (cardWidth - drawWidth) / 2;
    const drawY = y + titleHeight + (cardHeight - titleHeight - drawHeight) / 2;
    ctx.drawImage(rendered.canvas, view.startX * 32, view.startY * 32, view.width * 32, view.height * 32, drawX, drawY, drawWidth, drawHeight);
    ctx.strokeStyle = "rgba(245, 207, 83, 0.95)";
    ctx.lineWidth = Math.max(1, scale * 1.25);
    for (const cell of entry.changes) {
      if (cell.x < view.startX || cell.y < view.startY || cell.x >= view.startX + view.width || cell.y >= view.startY + view.height) continue;
      ctx.strokeRect(drawX + (cell.x - view.startX) * 32 * scale + 0.5, drawY + (cell.y - view.startY) * 32 * scale + 0.5, 32 * scale - 1, 32 * scale - 1);
    }
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, canvas.toBuffer("image/png"));
}

await renderSheet("before", beforeOutput);
await renderSheet("after", afterOutput);
console.log(`Referencias visuales: ${path.relative(ROOT, beforeOutput)} y ${path.relative(ROOT, afterOutput)} (${entries.length} mapas).`);
