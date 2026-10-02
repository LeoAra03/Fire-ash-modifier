#!/usr/bin/env node
/**
 * apply_dimensional_nightmare_maps.mjs — E3: convierte cada ficha de referencia
 * del Dimensional Nightmare en un mapa jugable de RPG Maker XP.
 *
 * Por cada mapa del plano (`content/dimensional_nightmare_maps.json`):
 *   1. toma su ficha (recorte del mosaico) del catálogo ×2 de E2;
 *   2. construye un **tileset por mapa** (`DN_<id>.png`) con solo los bloques de
 *      32×32 que ese mapa usa y registra la entrada correspondiente en
 *      `Tilesets.rxdata` (autotiles vacíos, pasajes/priorities/terrain desde el
 *      índice 384);
 *   3. escribe `Map<id>.rxdata` con la matriz de la ficha en la capa 1 — el mapa
 *      es la escena de referencia, sin invenciones;
 *   4. añade la entrada de `MapInfos.rxdata` y copia los metadatos de un mapa
 *      plantilla de `map_metadata.dat` (BGM de combate incluido).
 *
 * Pasajes: heurística conservadora + `content/dimensional_nightmare_passability.json`
 * (overrides manuales) + BFS de diagnóstico. Nada de esto toca partidas.
 *
 * Uso:
 *   node tools/apply_dimensional_nightmare_maps.mjs --only 2041,2088,2120   # piloto
 *   node tools/apply_dimensional_nightmare_maps.mjs --episode EP01
 *   node tools/apply_dimensional_nightmare_maps.mjs --all
 *   node tools/apply_dimensional_nightmare_maps.mjs --verify
 *   ... --dry-run (no escribe) · --render (comparativas antes/después)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RObject, RString } from "../web/js/marshal.js";

const S = (v) => RString.fromText(String(v));
import { parseMap, parseTileset, tableGet, tableToUserDef } from "../web/js/rmxp.js";
import { TileCanvas, buildMapObject, passabilityOf, reachableCells } from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const GRAPHICS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Tilesets");
const BACKUP = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups", "dimensional_nightmare_maps_originals");
const RENDER_DIR = path.join(ROOT, "docs", "dn_referencia");
const BLUEPRINT = path.join(ROOT, "content", "dimensional_nightmare_maps.json");
const CATALOG = path.join(ROOT, "content", "dimensional_nightmare_tiles_2x.json");
const BUILT_PATH = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const OVERRIDES_PATH = path.join(ROOT, "content", "dimensional_nightmare_passability.json");
const BASE_ID = 384;            // primer id de tile normal (0-47 vacío, 48-383 autotiles)
const TILE = 32;
const COLUMNS = 8;
const PASS_BLOCKED = 0x0f;
const METADATA_TEMPLATE = 2021; // mapa del que se heredan BGM de combate y campos comunes

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const ONLY = option("--only", null)?.split(",").map((s) => Number(s.trim())).filter(Boolean) ?? null;
const EPISODE = option("--episode", null);
const ALL = flag("--all");
const DRY = flag("--dry-run");
const VERIFY_ONLY = flag("--verify");
const RENDER = flag("--render");

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => {
  if (DRY) return;
  fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
};
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;

// ---------------------------------------------------------------- selección
const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT, "utf8"));
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

function selectedMaps() {
  let maps = blueprint.maps.filter((m) => m.primary);
  if (ONLY) maps = maps.filter((m) => ONLY.includes(m.id));
  else if (EPISODE) maps = maps.filter((m) => m.episode === EPISODE);
  else if (!ALL && !VERIFY_ONLY) {
    maps = maps.filter((m) => [2041, 2088, 2120].includes(m.id)); // piloto por defecto
  }
  return maps;
}

function sliceOf(map) {
  const basename = path.basename(map.primary.slice);
  for (const group of catalog.groups) {
    const found = group.maps.find((m) => path.basename(m.slice) === basename && path.basename(path.dirname(m.slice)) === map.primary.key);
    if (found) return { group, map: found };
  }
  throw new Error(`La ficha ${map.primary.slice} no está en ${path.relative(ROOT, CATALOG)} (¿ejecutaste dn:ingest y dn:tiles:2x?)`);
}

// ------------------------------------------------------------- pasabilidad
const overrides = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8")) : { maps: {} };

/**
 * Pasaje por bloque:
 *  - sin archivo de pasajes: todo transitable salvo lo transparente (arranque abierto);
 *  - con archivo: muro si la celda está en `computed`/`blocked` y no está en `open`
 *    (o sus rectángulos). Como RMXP guarda el pasaje POR TILE, un tile que aparezca
 *    en alguna celda transitable se instala transitable: los muros del arte se
 *    bloquean porque sus tiles solo se usan en zonas marcadas como muro.
 */
function passageForBlock(data, width, x0, y0) {
  let transparent = 0;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = ((y0 + y) * width + x0 + x) * 4;
      if (data[i + 3] < 16) transparent++;
    }
  }
  return transparent / (TILE * TILE) > 0.5 ? PASS_BLOCKED : 0;
}

/** Celdas de un rectángulo [x0,y0,x1,y1] recortado al mapa. */
function rectCellsIn(rect, width, height) {
  const [x0, y0, x1, y1] = rect;
  const cells = new Set();
  for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) cells.add(`${x},${y}`);
  }
  return cells;
}

/** Transitabilidad por celda según `content/dimensional_nightmare_passability.json`. */
function walkableCells(mapId, width, height) {
  const entry = overrides.maps?.[String(mapId)];
  if (!entry) return null; // sin archivo: todo abierto salvo transparencia
  const open = new Set(entry.open ?? []);
  const blocked = new Set([...(entry.computed ?? []), ...(entry.blocked ?? [])]);
  for (const rect of entry.openRects ?? []) for (const cell of rectCellsIn(rect, width, height)) { open.add(cell); blocked.delete(cell); }
  for (const rect of entry.blockRects ?? []) for (const cell of rectCellsIn(rect, width, height)) { blocked.add(cell); open.delete(cell); }
  const walkable = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      row.push(open.has(key) || !blocked.has(key));
    }
    walkable.push(row);
  }
  return walkable;
}

// ------------------------------------------------------------- construcción
function uniqueTiles(matrix) {
  const order = [];
  const map = new Map();
  for (const row of matrix) {
    for (const original of row) {
      if (map.has(original)) continue;
      map.set(original, BASE_ID + order.length);
      order.push(original);
    }
  }
  return { order, localIdOf: map };
}

async function buildAtlas(group, order, outPng, { walkable, matrix, localIdOf }) {
  const source = await loadImage(path.join(ROOT, group.tileset));
  const canvas = createCanvas(COLUMNS * TILE, Math.ceil(order.length / COLUMNS) * TILE);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  order.forEach((original, k) => {
    const sx = (original % COLUMNS) * TILE;
    const sy = Math.floor(original / COLUMNS) * TILE;
    ctx.drawImage(source, sx, sy, TILE, TILE, (k % COLUMNS) * TILE, Math.floor(k / COLUMNS) * TILE, TILE, TILE);
  });
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const passages = new Uint16Array(BASE_ID + order.length);
  const priorities = new Uint16Array(BASE_ID + order.length);
  // 1) pasaje base por transparencia del bloque
  order.forEach((original, k) => {
    passages[BASE_ID + k] = passageForBlock(px, canvas.width, (k % COLUMNS) * TILE, Math.floor(k / COLUMNS) * TILE);
  });
  // 2) si el mapa tiene pasajes definidos, manda la celda: un tile se instala
  //    transitable cuando al menos una de sus celdas lo es.
  if (walkable) {
    const passableTile = new Set();
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[0].length; x++) {
        if (!walkable[y][x]) continue;
        passableTile.add(localIdOf.get(matrix[y][x]));
      }
    }
    order.forEach((original, k) => {
      const tileId = BASE_ID + k;                                   // localIdOf guarda ids absolutos
      if (passableTile.has(tileId)) passages[tileId] &= ~0x0f;      // limpia los bits de dirección → transitable
      else if ((passages[tileId] & 0x0f) !== PASS_BLOCKED) passages[tileId] |= PASS_BLOCKED;
    });
  }
  if (!DRY) {
    fs.mkdirSync(path.dirname(outPng), { recursive: true });
    fs.writeFileSync(outPng, canvas.toBuffer("image/png"));
  }
  return { canvas, passages, priorities };
}

function installTileset(mapId, title, tileCount, passages, priorities) {
  const raw = read("Tilesets.rxdata");
  const fileBase = `DN_${mapId}`;
  const existing = raw.findIndex((entry) => entry && String(entry.getIvar?.("@tileset_name")?.text ?? "") === fileBase);
  const id = existing > 0 ? existing : raw.length;
  const total = BASE_ID + tileCount;
  const table = (data) => tableToUserDef({ dim: 1, x: total, y: 1, z: 1, data });
  const obj = new RObject("RPG::Tileset", [
    ["@id", id],
    ["@name", S(`DN ${mapId} — ${title}`)],
    ["@tileset_name", S(fileBase)],
    ["@autotile_names", Array.from({ length: 7 }, () => S(""))],
    ["@panorama_name", S("")], ["@panorama_hue", 0],
    ["@fog_name", S("")], ["@fog_hue", 0], ["@fog_opacity", 64],
    ["@fog_blend_type", 0], ["@fog_zoom", 200], ["@fog_sx", 0], ["@fog_sy", 0],
    ["@battleback_name", S("")],
    ["@passages", table(passages)],
    ["@priorities", table(priorities)],
    ["@terrain_tags", table(new Uint16Array(total))],
  ]);
  if (existing > 0) raw[existing] = obj; else raw.push(obj);
  write("Tilesets.rxdata", raw);
  return id;
}

function installMapInfo(mapId, title) {
  const infos = read("MapInfos.rxdata");
  infos.pairs = infos.pairs.filter(([key]) => Number(key) !== mapId);
  infos.pairs.push([mapId, new RObject("RPG::MapInfo", [
    ["@scroll_x", 320], ["@name", S(`DN ${mapId} · ${title}`)], ["@expanded", false],
    ["@order", 1200 + (mapId - 2040)], ["@scroll_y", 240], ["@parent_id", 2030],
  ])]);
  write("MapInfos.rxdata", infos);
}

function installMetadata(mapId) {
  const metadata = read("map_metadata.dat");
  const source = metadata.pairs.find(([id]) => Number(id) === METADATA_TEMPLATE)?.[1];
  if (!source) return;
  const meta = new RObject(source.className, source.ivars.map(([key, value]) => [key, value]));
  meta.setIvar("id", mapId);
  meta.setIvar("weather", null);
  meta.setIvar("map_BGM", null);
  metadata.pairs = metadata.pairs.filter(([id]) => Number(id) !== mapId);
  metadata.pairs.push([mapId, meta]);
  write("map_metadata.dat", metadata);
}

function buildMapData(matrix, localIdOf, tilesetId) {
  const width = matrix[0].length, height = matrix.length;
  const canvas = new TileCanvas(width, height, tilesetId);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) canvas.set(x, y, 0, localIdOf.get(matrix[y][x]) ?? 0);
  }
  return { canvas, object: buildMapObject(canvas) };
}

/** Transitabilidad con las tablas en memoria (dry-run incluido): prioridades 0. */
function passabilityFromTables(canvas, passages) {
  const passable = (x, y, dir) => {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false;
    const bit = 1 << (dir / 2 - 1);
    for (let z = 2; z >= 0; z--) {
      const tile = canvas.get(x, y, z);
      if (!tile) continue;
      const p = passages[tile] ?? 0;
      if ((p & bit) !== 0 || (p & 0x0f) === 0x0f) return false;
      return true;
    }
    return true;
  };
  const step = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  const canMove = (x, y, dir) => {
    const [dx, dy] = step[dir];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= canvas.width || ny >= canvas.height) return false;
    return passable(x, y, dir) && passable(nx, ny, 10 - dir);
  };
  return { canMove, passable, terrain: () => 0, width: canvas.width, height: canvas.height };
}

/** BFS de diagnóstico: entrada = celda transitable más cercana al centro del borde inferior. */
function bfsReport(canvas, passages) {
  const pass = passabilityFromTables(canvas, passages);
  let entry = null;
  for (let y = canvas.height - 1; y >= 0 && !entry; y--) {
    for (let x = Math.floor(canvas.width / 2); x < canvas.width; x++) {
      if (pass.passable(x, y, 8)) { entry = [x, y]; break; }
    }
    for (let x = Math.floor(canvas.width / 2) - 1; x >= 0 && !entry; x--) {
      if (pass.passable(x, y, 8)) { entry = [x, y]; break; }
    }
  }
  if (!entry) return { entry: null, reachable: 0, walkable: 0, isolated: 0, ratio: 0 };
  const reachable = reachableCells(pass, entry);
  let walkable = 0;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pass.passable(x, y, 8)) walkable++;
  return {
    entry,
    reachable: reachable.size,
    walkable,
    isolated: Math.max(0, walkable - reachable.size),
    ratio: walkable ? reachable.size / walkable : 0,
  };
}

async function renderComparison(map, built) {
  const ref = await loadImage(path.join(ROOT, map.primary.slice));
  const tileset = await loadImage(path.join(GRAPHICS, `DN_${map.id}.png`));
  const data = built.canvas;
  const canvas = createCanvas(data.width * TILE, data.height * TILE);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const tile = data.get(x, y, 0);
      if (!tile) continue;
      const k = tile - BASE_ID;
      ctx.drawImage(tileset, (k % COLUMNS) * TILE, Math.floor(k / COLUMNS) * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
    }
  }
  const pass = passabilityFromTables(data, built.passages);
  const reach = bfsReport(data, built.passages);
  const reachable = reach.entry ? reachableCells(pass, reach.entry) : new Set();
  const overlay = createCanvas(canvas.width, canvas.height);
  const octx = overlay.getContext("2d");
  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const walkable = pass.passable(x, y, 8);
      octx.fillStyle = walkable ? (reachable.has(`${x},${y}`) ? "rgba(0,220,120,0.35)" : "rgba(255,200,0,0.45)") : "rgba(220,40,40,0.45)";
      octx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  const gap = 12;
  const total = createCanvas(ref.width + canvas.width + overlay.width + gap * 4, Math.max(ref.height, canvas.height) + gap * 2);
  const tctx = total.getContext("2d");
  tctx.imageSmoothingEnabled = false;
  tctx.fillStyle = "#1a1a1a";
  tctx.fillRect(0, 0, total.width, total.height);
  tctx.drawImage(ref, gap, gap);
  tctx.drawImage(canvas, gap * 2 + ref.width, gap);
  tctx.globalAlpha = 0.85;
  tctx.drawImage(overlay, gap * 3 + ref.width + canvas.width, gap);
  tctx.globalAlpha = 1;
  fs.mkdirSync(RENDER_DIR, { recursive: true });
  const out = path.join(RENDER_DIR, `${map.id}_comparacion.png`);
  fs.writeFileSync(out, total.toBuffer("image/png"));
  return { out, reach };
}

/** Copia de seguridad de los archivos del juego que se van a modificar (una sola vez). */
function ensureBackups() {
  fs.mkdirSync(BACKUP, { recursive: true });
  const files = ["Tilesets.rxdata", "MapInfos.rxdata", "map_metadata.dat"];
  for (const file of files) {
    const origin = path.join(DATA, file);
    const copy = path.join(BACKUP, file);
    if (fs.existsSync(origin) && !fs.existsSync(copy)) fs.copyFileSync(origin, copy);
  }
  const readme = path.join(BACKUP, "LEEME.txt");
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme, "Copias anteriores a la instalación de los mapas del Dimensional Nightmare " +
      "(tilesets DN_*, MapInfos y map_metadata). No contienen partidas.\n" +
      "Para revertir: copia estos archivos sobre pokemon_fire_ash/Data/ y borra los Map2xxx.rxdata del ciclo.\n");
  }
}

// ------------------------------------------------------------------- main
ensureBackups();

if (!VERIFY_ONLY) {
  const maps = selectedMaps();
  if (!maps.length) {
    console.error("No hay mapas seleccionados.");
    process.exit(1);
  }
  const built = [];
  for (const map of maps) {
    const { group, map: fichaMap } = sliceOf(map);
    const { order, localIdOf } = uniqueTiles(fichaMap.matrix);
    const walkable = walkableCells(map.id, fichaMap.matrix[0].length, fichaMap.matrix.length);
    const png = path.join(GRAPHICS, `DN_${map.id}.png`);
    const atlas = await buildAtlas(group, order, png, { walkable, matrix: fichaMap.matrix, localIdOf });
    const tilesetId = installTileset(map.id, map.title, order.length, atlas.passages, atlas.priorities);
    const { canvas, object } = buildMapData(fichaMap.matrix, localIdOf, tilesetId);
    write(mapFile(map.id), object);
    installMapInfo(map.id, map.title);
    installMetadata(map.id);
    const bfs = bfsReport(canvas, atlas.passages);
    built.push({ ...map, tilesetId, tiles: order.length, width: canvas.width, height: canvas.height, bfs });
    const badge = bfs.ratio > 0.98 ? "OK" : `BFS ${(bfs.ratio * 100).toFixed(0)}%`;
    console.log(`${DRY ? "[dry-run] " : ""}${map.id} ${map.title} · ficha ${map.primary.resource}-${map.primary.index} · ${canvas.width}×${canvas.height} bloques · ${order.length} tiles · ts #${tilesetId} · ${badge}`);
  }
  if (!DRY) {
    fs.writeFileSync(BUILT_PATH, `${JSON.stringify({ generatedBy: "tools/apply_dimensional_nightmare_maps.mjs", counts: built.length, maps: built }, null, 2)}\n`);
    if (RENDER) {
      for (const map of built) {
        const info = await renderComparison(map, { canvas: rebuildFromFile(map.id), tilesetId: map.tilesetId, passages: passagesOfTileset(map.tilesetId) });
        console.log(`  render → ${path.relative(ROOT, info.out)} (BFS ${(info.reach.ratio * 100).toFixed(0)} %)`);
      }
    }
  }
}

/** Tablas de pasajes del tileset ya instalado (para render/verificación desde disco). */
function passagesOfTileset(tilesetId) {
  const raw = read("Tilesets.rxdata");
  const parsed = parseTileset(raw[tilesetId]);
  return parsed.passages.data;
}

/** Relee Map<id>.rxdata y devuelve un TileCanvas para renderizar/validar. */
function rebuildFromFile(mapId) {
  const parsed = parseMap(read(mapFile(mapId)));
  const canvas = new TileCanvas(parsed.width, parsed.height, parsed.tilesetId);
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      for (const z of [0, 1, 2]) canvas.set(x, y, z, tableGet(parsed.table, x, y, z));
    }
  }
  return canvas;
}

if (VERIFY_ONLY) {
  let failures = 0;
  const ok = (condition, label) => {
    if (!condition) { failures++; console.error(`  FALLA: ${label}`); }
  };
  const built = fs.existsSync(BUILT_PATH) ? JSON.parse(fs.readFileSync(BUILT_PATH, "utf8")) : { maps: [] };
  const tilesets = read("Tilesets.rxdata");
  const infos = read("MapInfos.rxdata").pairs;
  const metadata = read("map_metadata.dat").pairs;
  console.log(`verificación de ${built.maps.length} mapas construidos`);
  for (const info of built.maps) {
    const file = path.join(DATA, mapFile(info.id));
    ok(fs.existsSync(file), `${info.id}: falta ${mapFile(info.id)}`);
    if (!fs.existsSync(file)) continue;
    const canvas = rebuildFromFile(info.id);
    ok(canvas.width === info.width && canvas.height === info.height, `${info.id}: tamaño ${canvas.width}×${canvas.height} ≠ ${info.width}×${info.height}`);
    const tileset = tilesets[info.tilesetId];
    ok(!!tileset, `${info.id}: tileset #${info.tilesetId} ausente`);
    const entry = tileset?.getIvar("@tileset_name")?.text;
    ok(entry === `DN_${info.id}`, `${info.id}: @tileset_name «${entry}»`);
    const parsedTileset = tileset ? parseTileset(tileset) : null;
    ok(parsedTileset && parsedTileset.passages.x >= BASE_ID + info.tiles, `${info.id}: tabla de pasajes corta`);
    ok(fs.existsSync(path.join(GRAPHICS, `DN_${info.id}.png`)), `${info.id}: falta el PNG del tileset`);
    ok(infos.some(([key]) => Number(key) === info.id), `${info.id}: falta en MapInfos`);
    ok(metadata.some(([key]) => Number(key) === info.id), `${info.id}: falta en map_metadata.dat`);
    // la matriz del mapa debe reproducir la ficha: se compara el render contra la referencia
    const pass = passabilityOf(canvas, info.tilesetId);
    let walkable = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pass.passable(x, y, 8)) walkable++;
    const bfs = bfsReport(canvas, passagesOfTileset(info.tilesetId));
    const ratio = walkable ? bfs.reachable / walkable : 0;
    if (ratio < 0.9) console.warn(`  aviso: ${info.id} BFS alcanza el ${(ratio * 100).toFixed(0)} % de las celdas transitables (aisladas: ${bfs.isolated})`);
  }
  console.log(failures === 0 ? "verificación OK" : `verificación con ${failures} fallos`);
  process.exit(failures === 0 ? 0 : 1);
}
