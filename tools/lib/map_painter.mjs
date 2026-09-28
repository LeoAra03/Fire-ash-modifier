/**
 * map_painter.mjs — Pintor de mapas RMXP "estilo juego base".
 *
 * Idea central: en vez de inventar combinaciones de tiles, APRENDE las reglas de
 * borde de cada material (bosque, montaña, muro de cueva…) a partir de mapas
 * reales de Fire Ash. Para cada celda de un material se guarda qué tiles usa el
 * juego según qué vecinos (8 direcciones) también son del material. Después, al
 * pintar una región nueva, se consulta esa tabla y salen los mismos bordes,
 * esquinas, copas de árbol y caras de acantilado que dibujó el autor original.
 *
 * Solo usa tiles que ya existen en los mapas del juego: el resultado se ve y se
 * comporta (pasabilidad, terreno, encuentros) exactamente como el juego base.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, RObject, RHash, RString } from "../../web/js/marshal.js";
import { parseMap, parseTileset, tableGet, tableToUserDef } from "../../web/js/rmxp.js";
import { DATA } from "./fire_ash_registry.mjs";

const pad3 = (n) => String(n).padStart(3, "0");
const sourceCache = new Map();

/** Carga (con caché) un mapa compilado del juego como fuente de aprendizaje. */
export function loadSourceMap(mapId) {
  if (!sourceCache.has(mapId)) {
    const parsed = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, `Map${pad3(mapId)}.rxdata`))));
    sourceCache.set(mapId, parsed);
  }
  return sourceCache.get(mapId);
}

let tilesetCache = null;
export function tilesets() {
  if (!tilesetCache) {
    const raw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
    tilesetCache = new Map();
    for (let i = 1; i < raw.length; i++) if (raw[i]) { const t = parseTileset(raw[i]); tilesetCache.set(t.id, t); }
  }
  return tilesetCache;
}

// ------------------------------------------------------------------ lienzo
export class TileCanvas {
  constructor(width, height, tilesetId) {
    this.width = width; this.height = height; this.tilesetId = tilesetId;
    this.layers = [new Uint16Array(width * height), new Uint16Array(width * height), new Uint16Array(width * height)];
  }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  get(x, y, z) { return this.inside(x, y) ? this.layers[z][x + y * this.width] : 0; }
  set(x, y, z, v) { if (this.inside(x, y)) this.layers[z][x + y * this.width] = v & 0xffff; }
  stack(x, y) { return [this.get(x, y, 0), this.get(x, y, 1), this.get(x, y, 2)]; }
  fillRect(z, x, y, w, h, v) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, z, v); }
  fillAll(z, v) { this.layers[z].fill(v & 0xffff); }
  toTable() {
    const data = new Uint16Array(this.width * this.height * 3);
    for (let z = 0; z < 3; z++) data.set(this.layers[z], z * this.width * this.height);
    return { dim: 3, x: this.width, y: this.height, z: 3, data };
  }
}

/** Copia un rectángulo (las 3 capas) de un mapa real al lienzo: prefabricados (casas, puertas…). */
export function stamp(canvas, srcMapId, sx, sy, w, h, dx, dy, { layers = [0, 1, 2], skipZero = true } = {}) {
  const src = loadSourceMap(srcMapId);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) for (const z of layers) {
    const v = tableGet(src.table, sx + i, sy + j, z);
    if (skipZero && !v) continue;
    canvas.set(dx + i, dy + j, z, v);
  }
}

// ------------------------------------------------------- aprendizaje de reglas
const DIRS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]; // N NE E SE S SW W NW
/** Normaliza: una diagonal solo cuenta si sus dos ortogonales están presentes. */
export function normalizeMask(mask) {
  const bit = (i) => (mask >> i) & 1;
  let out = mask;
  const diag = [[1, 0, 2], [3, 2, 4], [5, 4, 6], [7, 6, 0]];
  for (const [d, a, b] of diag) if (!(bit(a) && bit(b))) out |= (1 << d);
  return out;
}
function maskOf(isMember, x, y) {
  let mask = 0;
  DIRS.forEach(([dx, dy], i) => { if (isMember(x + dx, y + dy)) mask |= (1 << i); });
  return normalizeMask(mask);
}

/**
 * Aprende un material a partir de mapas reales.
 * @param {object} spec
 *   name: etiqueta
 *   tiles: Set de ids de tile que forman el material (en cualquier capa)
 *   sources: ids de mapas de los que aprender
 *   outsideIsMember: fuera del mapa cuenta como material (bordes continuos)
 */
export function learnMaterial({ name, tiles, sources, outsideIsMember = true }) {
  const memberRules = new Map(); // key -> Map(stackKey -> {count, stack})
  const overhangRules = new Map(); // key -> Map(tile -> count)  (capa 3 en celdas vecinas no-miembro)
  const bump = (table, key, valueKey, value) => {
    if (!table.has(key)) table.set(key, new Map());
    const bucket = table.get(key);
    const cur = bucket.get(valueKey) || { count: 0, value };
    cur.count++; bucket.set(valueKey, cur);
  };
  let memberCount = 0;
  for (const id of sources) {
    const src = loadSourceMap(id);
    const W = src.width, H = src.height;
    const stackAt = (x, y) => [0, 1, 2].map((z) => tableGet(src.table, x, y, z));
    const member = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return outsideIsMember;
      return stackAt(x, y).some((t) => tiles.has(t));
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const isM = member(x, y);
      const mask = maskOf(member, x, y);
      if (isM) {
        memberCount++;
        const st = stackAt(x, y).map((t) => (tiles.has(t) ? t : 0));
        const sk = st.join(",");
        for (const key of [`${mask}|${x & 1}|${y & 1}`, `${mask}|*`]) bump(memberRules, key, sk, st);
      } else if (mask !== 255) {
        // celda exterior pegada al material: ¿hay copa/voladizo del material en capa 2/3?
        const st = stackAt(x, y);
        const over = [0, st[1], st[2]].map((t, z) => (z > 0 && tiles.has(t) ? t : 0));
        const ok = over.join(",");
        for (const key of [`${mask}|${x & 1}|${y & 1}`, `${mask}|*`]) bump(overhangRules, key, ok, over);
      }
    }
  }
  const best = (bucket) => { let top = null; for (const v of bucket.values()) if (!top || v.count > top.count) top = v; return top?.value; };
  const pick = (table, key) => (table.has(key) ? best(table.get(key)) : undefined);
  // relleno por defecto: la pila más frecuente entre celdas totalmente rodeadas
  const fill = pick(memberRules, "255|*") || [0, 0, 0];
  return { name, tiles, memberRules, overhangRules, fill, memberCount, pick };
}

/**
 * Pinta una región (Set de "x,y") con un material aprendido.
 * Devuelve la lista de claves sin regla exacta (para revisar el diseño).
 */
export function paintMaterial(canvas, region, rules, { outsideIsMember = true, overhang = true, onlyLayers = null } = {}) {
  const key = (x, y) => `${x},${y}`;
  const member = (x, y) => {
    if (!canvas.inside(x, y)) return outsideIsMember;
    return region.has(key(x, y));
  };
  const missing = [];
  const lookup = (table, mask, x, y) => {
    let v = rules.pick(table, `${mask}|${x & 1}|${y & 1}`);
    if (v === undefined) v = rules.pick(table, `${mask}|*`);
    return v;
  };
  for (const cell of region) {
    const [x, y] = cell.split(",").map(Number);
    const mask = maskOf(member, x, y);
    let st = lookup(rules.memberRules, mask, x, y);
    if (st === undefined) { missing.push({ x, y, mask, kind: "member" }); st = rules.fill; }
    st.forEach((t, z) => { if (t && (!onlyLayers || onlyLayers.includes(z))) canvas.set(x, y, z, t); });
  }
  if (overhang) {
    const seen = new Set();
    for (const cell of region) {
      const [cx, cy] = cell.split(",").map(Number);
      for (const [dx, dy] of DIRS) {
        const x = cx + dx, y = cy + dy;
        if (!canvas.inside(x, y) || region.has(key(x, y)) || seen.has(key(x, y))) continue;
        seen.add(key(x, y));
        const mask = maskOf(member, x, y);
        const st = lookup(rules.overhangRules, mask, x, y);
        if (st === undefined) { missing.push({ x, y, mask, kind: "overhang" }); continue; }
        st.forEach((t, z) => { if (t && !canvas.get(x, y, z)) canvas.set(x, y, z, t); });
      }
    }
  }
  return missing;
}

// ------------------------------------------------------------- regiones ASCII
/** Convierte un dibujo ASCII (array de filas) en un mapa de char -> Set("x,y"). */
export function regionsFromAscii(rows) {
  const out = new Map();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!out.has(ch)) out.set(ch, new Set());
      out.get(ch).add(`${x},${y}`);
    });
  });
  return out;
}
export const cellSet = (...cells) => new Set(cells.map(([x, y]) => `${x},${y}`));
export function rectSet(x, y, w, h) { const s = new Set(); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) s.add(`${i},${j}`); return s; }
export function union(...sets) { const s = new Set(); for (const set of sets) for (const v of set) s.add(v); return s; }

// ------------------------------------------------------------- pasabilidad
/**
 * Devuelve canMove(x,y,dir) con la semántica de RMXP/Essentials: la celda actual
 * debe permitir salir en `dir` y la destino permitir entrar desde el lado opuesto.
 * dir: 2 abajo, 4 izquierda, 6 derecha, 8 arriba.
 */
export function passabilityOf(canvasOrParsed, tilesetId) {
  const ts = tilesets().get(tilesetId);
  const get = canvasOrParsed instanceof TileCanvas
    ? (x, y, z) => canvasOrParsed.get(x, y, z)
    : (x, y, z) => tableGet(canvasOrParsed.table, x, y, z);
  const width = canvasOrParsed.width, height = canvasOrParsed.height;
  const passable = (x, y, dir) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const bit = 1 << (dir / 2 - 1);
    for (let z = 2; z >= 0; z--) {
      const tile = get(x, y, z);
      if (!tile) continue;
      const p = ts.passages.data[tile] ?? 0;
      if ((p & bit) !== 0 || (p & 0x0f) === 0x0f) return false;
      if ((ts.priorities.data[tile] ?? 0) === 0) return true;
    }
    return true;
  };
  const step = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  const canMove = (x, y, dir) => {
    const [dx, dy] = step[dir];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return false;
    return passable(x, y, dir) && passable(nx, ny, 10 - dir);
  };
  const terrain = (x, y) => {
    for (let z = 2; z >= 0; z--) { const t = get(x, y, z); if (t && ts.terrain) { const tag = ts.terrain.data[t]; if (tag) return tag; } }
    return 0;
  };
  return { canMove, passable, terrain, width, height };
}

/**
 * BFS con deslizamiento sobre hielo (terreno 12): desde una celda de hielo el
 * jugador sigue avanzando hasta que no puede o pisa suelo firme.
 * blocked: Set "x,y" de celdas ocupadas por eventos sólidos.
 */
export function reachableCells(pass, start, { blocked = new Set(), ice = 12 } = {}) {
  const key = (x, y) => `${x},${y}`;
  const step = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  const free = (x, y) => !blocked.has(key(x, y));
  const seen = new Set([key(...start)]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const dir of [2, 4, 6, 8]) {
      let cx = x, cy = y;
      const [dx, dy] = step[dir];
      // primer paso
      if (!pass.canMove(cx, cy, dir) || !free(cx + dx, cy + dy)) continue;
      cx += dx; cy += dy;
      // deslizar mientras el destino sea hielo
      while (pass.terrain(cx, cy) === ice && pass.canMove(cx, cy, dir) && free(cx + dx, cy + dy)) { cx += dx; cy += dy; }
      const k = key(cx, cy);
      if (!seen.has(k)) { seen.add(k); queue.push([cx, cy]); }
    }
  }
  return seen;
}

// ------------------------------------------------------------- objeto RPG::Map
export function audioFile(name = "", volume = 100, pitch = 100) {
  return new RObject("RPG::AudioFile", [["@name", RString.fromText(name)], ["@volume", volume], ["@pitch", pitch]]);
}
export function buildMapObject(canvas, { bgm = "", bgs = "", encounterStep = 25, autoplayBgm = true } = {}) {
  return new RObject("RPG::Map", [
    ["@tileset_id", canvas.tilesetId], ["@width", canvas.width], ["@height", canvas.height],
    ["@autoplay_bgm", autoplayBgm && !!bgm], ["@bgm", audioFile(bgm)],
    ["@autoplay_bgs", !!bgs], ["@bgs", audioFile(bgs)],
    ["@encounter_list", []], ["@encounter_step", encounterStep],
    ["@data", tableToUserDef(canvas.toTable())],
    ["@events", new RHash([])],
  ]);
}
