/**
 * dn_rmxp.mjs — piezas compartidas por las herramientas DN nuevas (M2: medallas, Liga Oscura,
 * sensaciones). Reproduce los patrones ya verificados de `apply_dimensional_nightmare_*.mjs`
 * (RObject/RHash, condiciones de página, transferencias, respaldo previo) en un solo lugar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol } from "../../web/js/marshal.js";
import { parseMap, tableGet } from "../../web/js/rmxp.js";
import { passabilityOf, reachableCells } from "./map_painter.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const GAME = path.join(ROOT, "pokemon_fire_ash");
export const DATA = path.join(GAME, "Data");
export const GRAPHICS = path.join(GAME, "Graphics");
export const BACKUP = path.join(GAME, "PokeModBackups", "dimensional_nightmare_maps_originals");
export const BUILT = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
export const EVENTS = path.join(ROOT, "content", "dimensional_nightmare_events_built.json");
export const CATALOG = path.join(ROOT, "content", "dimensional_nightmare_events.json");

export const S = (v) => RString.fromText(String(v));
export const Sym = (v) => new RSymbol(String(v));
export const txt = (v) => (v && v.text !== undefined ? v.text : v && v.name !== undefined ? v.name : String(v ?? ""));
export const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
export const readData = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
export const writeData = (f, v) => fs.writeFileSync(path.join(DATA, f), Buffer.from(marshalDump(v)));
export const readMap = (id) => marshalLoad(fs.readFileSync(path.join(DATA, mapFile(id))));
export const writeMap = (id, v) => fs.writeFileSync(path.join(DATA, mapFile(id)), Buffer.from(marshalDump(v)));

/** Respaldo la primera vez que se toca un archivo de Data. */
export function backup(file) {
  fs.mkdirSync(BACKUP, { recursive: true });
  const origin = path.join(DATA, file);
  const copy = path.join(BACKUP, file);
  if (fs.existsSync(origin) && !fs.existsSync(copy)) fs.copyFileSync(origin, copy);
}

// --------------------------------------------------------------- comandos RMXP
export const cmd = (code, params = [], indent = 0) => new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
export const condition = ({ sw = 0, sw2 = 0, self = "", variable = null } = {}) => new RObject("RPG::Event::Page::Condition", [
  ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
  ["@switch2_valid", !!sw2], ["@switch2_id", sw2 || 1],
  ["@variable_valid", !!variable], ["@variable_id", variable ? variable[0] : 1], ["@variable_value", variable ? variable[1] : 0],
  ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
]);
export const graphic = (charName = "", dir = 2, pattern = 1, opts = {}) => new RObject("RPG::Event::Page::Graphic", [
  ["@tile_id", opts.tile ?? 0], ["@character_name", S(charName)], ["@character_hue", opts.hue ?? 0],
  ["@direction", dir], ["@pattern", pattern], ["@opacity", opts.opacity ?? 255], ["@blend_type", 0],
]);
export const moveRoute = (commands = []) => new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", commands]]);
export const page = ({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) => new RObject("RPG::Event::Page", [
  ["@condition", cond], ["@graphic", gfx],
  ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
  ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
  ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
  ["@trigger", trigger], ["@list", list],
]);
export const event = (id, name, x, y, pages) => new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
export const texts = (lines, indent = 0) => [cmd(101, [S("")], indent), ...[].concat(lines).map((line) => cmd(401, [S(line)], indent))];
export const script = (line, indent = 0) => cmd(355, [S(line)], indent);
export const transfer = (mapId, x, y, dir = 2, indent = 0) => cmd(201, [0, mapId, x, y, dir, 1], indent);
export const setSwitch = (id, indent = 0) => cmd(121, [id, id, 0], indent);
export const setVariable = (id, value, indent = 0) => cmd(122, [id, id, 0, 0, value], indent);
export const selfSwitch = (ch = "A", indent = 0) => cmd(123, [S(ch), 0], indent);
export const branch = (code, params, indent = 0) => cmd(code, params, indent);
export const elseBranch = (indent = 0) => cmd(411, [], indent);
export const endBranch = (indent = 0) => cmd(412, [], indent);
export const wait = (frames, indent = 0) => cmd(106, [frames], indent);

/** Línea de tono con marca `dn:sensacion` para poder refrescarla sin duplicarla. */
export const toneLine = (tone, duration = 12, marker = "dn:sensacion") =>
  `begin; pbToneChangeAll(Tone.new(${tone.join(", ")}), ${duration}); rescue; end # ${marker}`;
export const isToneLine = (text, marker = "dn:sensacion") => typeof text === "string" && text.includes(`# ${marker}`);

// --------------------------------------------------------------- mallas
export function grid(id) {
  const raw = readMap(id);
  const parsed = parseMap(raw);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const pairs = raw.getIvar("@events")?.pairs ?? [];
  const events = pairs.map(([key, obj]) => ({
    key, name: txt(obj.getIvar("@name")), x: obj.getIvar("@x"), y: obj.getIvar("@y"), obj,
    pages: obj.getIvar("@pages") ?? [],
  }));
  const occupied = new Set(events.map((e) => `${e.x},${e.y}`));
  return { raw, parsed, pass, events, occupied, width: parsed.width, height: parsed.height };
}

export const walkableAt = (grid, x, y) => x >= 0 && y >= 0 && x < grid.width && y < grid.height && grid.pass.passable(x, y, 8);

/** Celda libre más cercana a `from` (sin eventos y transitable), excluyendo reservadas. */
export function nearestFreeCell(grid, from, { reserved = new Set(), maxDistance = 12, allowed = null } = {}) {
  let best = null, bestD = Infinity;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.occupied.has(`${x},${y}`) || reserved.has(`${x},${y}`)) continue;
      if (allowed && !allowed.has(`${x},${y}`)) continue;
      if (!walkableAt(grid, x, y)) continue;
      const d = Math.abs(x - from[0]) + Math.abs(y - from[1]);
      if (d < bestD) { bestD = d; best = [x, y]; }
    }
  }
  return bestD <= maxDistance ? best : null;
}

/** Celdas alcanzables desde la entrada del mapa (para elegir dónde poner eventos). */
export function reachableFrom(grid, start) {
  return reachableCells(grid.pass, start);
}

// --------------------------------------------------------------- escritura idempotente
/**
 * Reemplaza los eventos propiedad de una herramienta (por nombre exacto) y agrega los nuevos.
 * Devuelve el resumen de lo escrito. `dry` no toca disco.
 */
export function upsertEvents(mapId, ownedNames, build, { dry = false, verbose = true } = {}) {
  const file = mapFile(mapId);
  backup(file);
  const map = readMap(mapId);
  const hash = map.getIvar("@events");
  const pairs = hash?.pairs ?? [];
  const kept = pairs.filter(([, obj]) => !ownedNames.includes(txt(obj.getIvar("@name"))));
  const removed = pairs.length - kept.length;
  const baseId = Math.max(0, ...kept.map(([key]) => (typeof key === "number" ? key : 0))) + 1;
  const added = build(baseId).filter(Boolean);
  map.setIvar("@events", new RHash([...kept, ...added.map((e) => [e.getIvar("@id"), e])]));
  if (!dry) writeMap(mapId, map);
  if (verbose) console.log(`Map${mapId}: ${added.length} eventos (${removed} reemplazados)`);
  return { removed, added: added.map((e) => ({ name: txt(e.getIvar("@name")), x: e.getIvar("@x"), y: e.getIvar("@y") })) };
}

/** Alta de objetos en items.dat con el mismo formato que usó E4 (bolsillo 8 = objetos clave). */
export function writeItems(list, { base, dry = false, pocket = 8 }) {
  const items = readData("items.dat");
  const symbols = new Set(items.pairs.filter(([k]) => k instanceof RSymbol).map(([k]) => k.name));
  let next = Math.max(-1, ...items.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  next = Math.max(next, base);
  const written = [];
  for (const item of list) {
    if (symbols.has(item.id)) { written.push({ ...item, existed: true }); continue; }
    const obj = new RObject("GameData::Item", [
      ["@id", Sym(item.id)], ["@id_number", next],
      ["@real_name", S(item.name)], ["@real_name_plural", S(item.namePlural ?? item.name)],
      ["@pocket", pocket], ["@price", 0],
      ["@real_description", S(item.description ?? "")],
      ["@field_use", 0], ["@battle_use", 0], ["@type", 0], ["@move", null],
    ]);
    items.pairs.push([next, obj], [Sym(item.id), obj]);
    written.push({ ...item, idNumber: next, existed: false });
    next++;
  }
  backup("items.dat");
  if (!dry) writeData("items.dat", items);
  return written;
}

// --------------------------------------------------------------- catálogos
export const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
export { parseMap, tableGet, passabilityOf, reachableCells };
