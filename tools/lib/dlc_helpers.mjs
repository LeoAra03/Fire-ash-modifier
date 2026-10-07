/**
 * Utilidades compartidas por las herramientas del DLC total.
 *
 * Todo lo que aquí se hace respeta dos reglas:
 *   · Nunca se toca contenido original: los mapas nuevos usan IDs libres.
 *   · Todo destino tiene retorno y toda transferencia acaba en celda abierta.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, marshalDump, RHash, RObject, RString, RUserDef } from "../../web/js/marshal.js";
import { parseMap, cmdOf } from "../../web/js/rmxp.js";
import { ROOT, GAME, DATA } from "./fire_ash_registry.mjs";
import {
  S, Sym, txt, cmd, condition, graphic, grid, walkableAt, mapFile, readData, writeData,
} from "./dn_rmxp.mjs";

export { fs, path, marshalLoad, marshalDump, RHash, RObject, RString, RUserDef, ROOT, GAME, DATA };
export { S, Sym, txt, cmd, condition, graphic, grid, walkableAt, mapFile, readData, writeData, cmdOf };

/** Borra el evento durante la visita actual al mapa (vuelve al reentrar). */
export const eraseEvent = (indent = 0) => cmd(126, [], indent);

export const readMapRaw = (id) => marshalLoad(fs.readFileSync(path.join(DATA, mapFile(id))));
export const writeMapRaw = (id, value) => fs.writeFileSync(path.join(DATA, mapFile(id)), Buffer.from(marshalDump(value)));
export const iv = (object, name) => object?.getIvar?.(name);

export function backup(dirName, files) {
  const dir = path.join(GAME, "PokeModBackups", dirName);
  fs.mkdirSync(dir, { recursive: true });
  for (const file of files) {
    const source = path.join(DATA, file);
    if (!fs.existsSync(source)) continue;
    fs.copyFileSync(source, path.join(dir, file));
  }
}

/* ─────────────────────────────── comandos ──────────────────────────────── */

export const texts = (lines, indent = 0) => [
  cmd(101, [S("")], indent),
  ...[].concat(lines).map((line) => cmd(401, [S(line)], indent)),
];
export const script = (line, indent = 0) => cmd(355, [S(line)], indent);
export const transfer = (mapId, x, y, dir = 2, indent = 0) => cmd(201, [0, mapId, x, y, dir, 1], indent);
export const wait = (frames, indent = 0) => cmd(106, [frames], indent);
export const switchOn = (id, indent = 0) => cmd(121, [id, id, 0], indent);
export const switchOff = (id, indent = 0) => cmd(121, [id, id, 1], indent);
export const varSet = (id, value, indent = 0) => cmd(122, [id, id, 0, 0, value], indent);
export const varAdd = (id, value, indent = 0) => cmd(122, [id, id, 1, 0, value], indent);
export const selfSwitch = (ch = "A", value = 0, indent = 0) => cmd(123, [S(ch), value], indent);
/** Ramificación condicional (111). */
export const ifSwitch = (id, on = true, indent = 0) => cmd(111, [0, id, on ? 0 : 1], indent);
export const ifVariable = (id, value, op = 1, indent = 0) => cmd(111, [1, id, 0, value, op], indent);
export const ifScript = (line, indent = 0) => cmd(111, [12, S(line)], indent);
export const elseBranch = (indent = 0) => cmd(411, [], indent);
export const endBranch = (indent = 0) => cmd(412, [], indent);
export const choice = (labels, indent = 0) => cmd(102, [labels.map(S), 2], indent);
export const choiceCase = (index, label, indent = 0) => cmd(402, [index, S(label)], indent);
export const choiceEnd = (indent = 0) => cmd(404, [], indent);
export const endEvent = (indent = 0) => cmd(0, [], indent);

/** Objeto Tone de RMXP (cuatro doubles: red, green, blue, gray). */
export function toneObject(red, green, blue, gray = 0) {
  const buffer = Buffer.alloc(32);
  [red, green, blue, gray].forEach((value, index) => buffer.writeDoubleLE(value, index * 8));
  return new RUserDef("Tone", Uint8Array.from(buffer));
}
/** Teñido de pantalla (223). */
export const tint = (red, green, blue, gray, frames, indent = 0) =>
  cmd(223, [toneObject(red, green, blue, gray), frames], indent);
export const fadeOut = (indent = 0) => tint(-255, -255, -255, 0, 6, indent);
export const fadeIn = (indent = 0) => tint(0, 0, 0, 0, 6, indent);

export function page(opts = {}) {
  const {
    cond = condition(), gfx = graphic(), trigger = 0, through = false,
    walkAnime = true, stepAnime = false, dirFix = false, list = [cmd(0)],
  } = opts;
  return new RObject("RPG::Event::Page", [
    ["@condition", cond],
    ["@graphic", gfx],
    ["@move_type", 0],
    ["@move_speed", 3],
    ["@move_frequency", 3],
    ["@move_route", new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]])],
    ["@walk_anime", walkAnime],
    ["@step_anime", stepAnime],
    ["@direction_fix", dirFix],
    ["@through", through],
    ["@always_on_top", false],
    ["@trigger", trigger],
    ["@list", list],
  ]);
}

export function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}

/* ───────────────────────────────── celdas ──────────────────────────────── */

/** Celdas transitables y sin evento del componente conexo mayor. */
export function freeCells(mapId, reserved = new Set()) {
  const g = grid(mapId);
  const key = (x, y) => `${x},${y}`;
  const open = new Set();
  for (let y = 1; y < g.height - 1; y++) {
    for (let x = 1; x < g.width - 1; x++) {
      if (!walkableAt(g, x, y)) continue;
      if (g.occupied.has(key(x, y)) || reserved.has(key(x, y))) continue;
      open.add(key(x, y));
    }
  }
  const seen = new Set();
  let best = [];
  for (const cell of open) {
    if (seen.has(cell)) continue;
    const [sx, sy] = cell.split(",").map(Number);
    const component = [];
    const queue = [[sx, sy]];
    seen.add(cell);
    while (queue.length) {
      const [x, y] = queue.pop();
      component.push([x, y]);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const next = key(nx, ny);
        if (open.has(next) && !seen.has(next)) { seen.add(next); queue.push([nx, ny]); }
      }
    }
    if (component.length > best.length) best = component;
  }
  return best.map(([x, y]) => [x, y]);
}

export function nearest(cells, hint) {
  let best = cells[0], bestDistance = Infinity;
  for (const cell of cells) {
    const distance = Math.abs(cell[0] - hint[0]) + Math.abs(cell[1] - hint[1]);
    if (distance < bestDistance) { bestDistance = distance; best = cell; }
  }
  return best;
}

/** Elige `count` celdas lo más separadas posible. */
export function spread(cells, count) {
  if (cells.length < count) throw new Error(`El mapa sólo tiene ${cells.length} celdas libres y se piden ${count}`);
  const distance = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const centroid = cells.reduce((acc, [x, y]) => [acc[0] + x / cells.length, acc[1] + y / cells.length], [0, 0]);
  const chosen = [];
  const pool = [...cells];
  while (chosen.length < count && pool.length) {
    let best = null, bestScore = -Infinity;
    for (const cell of pool) {
      const score = chosen.length === 0
        ? -distance(cell, centroid)
        : Math.min(...chosen.map((c) => distance(c, cell)));
      if (score > bestScore) { bestScore = score; best = cell; }
    }
    chosen.push(best);
    pool.splice(pool.indexOf(best), 1);
  }
  return chosen;
}

/* ──────────────────────────── alta idempotente ─────────────────────────── */

export function eventsOf(mapId) {
  const raw = readMapRaw(mapId);
  const pairs = iv(raw, "@events")?.pairs ?? [];
  return pairs.map(([key, obj]) => ({ key, obj, name: txt(iv(obj, "@name")) }));
}

/**
 * Sustituye los eventos cuyo nombre empieza por alguno de los prefijos y
 * añade los que devuelva `build(nextId)`. Idempotente.
 */
export function upsert(mapId, ownedPrefixes, build, dirName = "dlc_total") {
  backup(dirName, [mapFile(mapId)]);
  const map = readMapRaw(mapId);
  const events = iv(map, "@events");
  const kept = events.pairs.filter(([, object]) =>
    !ownedPrefixes.some((prefix) => txt(iv(object, "@name")).startsWith(prefix)));
  let nextId = Math.max(0, ...kept.map(([key]) => (typeof key === "number" ? key : 0))) + 1;
  const built = build(nextId) ?? [];
  const added = [];
  for (const object of built) {
    object.setIvar("@id", nextId);
    added.push([nextId, object]);
    nextId += 1;
  }
  events.pairs = [...kept, ...added];
  writeMapRaw(mapId, map);
  return added.map(([, object]) => ({
    name: txt(iv(object, "@name")), x: iv(object, "@x"), y: iv(object, "@y"),
  }));
}

/** Limpia primero los eventos propios y luego coloca los nuevos. */
export function placeMany(mapId, owned, count, build, dirName = "dlc_total") {
  upsert(mapId, owned, () => [], dirName);
  const cells = spread(freeCells(mapId), count);
  upsert(mapId, owned, (nextId) => build(cells, nextId), dirName);
  return cells;
}

export function place(mapId, owned, hint, build, dirName = "dlc_total") {
  upsert(mapId, owned, () => [], dirName);
  const cell = nearest(freeCells(mapId), hint);
  upsert(mapId, owned, (nextId) => [build(cell, nextId)], dirName);
  return cell;
}

/* ───────────────────────── MapInfos y metadatos ────────────────────────── */

export function installMapInfos(specs, dirName = "dlc_total") {
  backup(dirName, ["MapInfos.rxdata"]);
  const infos = readData("MapInfos.rxdata");
  for (const spec of specs) {
    const existing = infos.pairs.find(([key]) => Number(key) === Number(spec.mapId));
    if (existing) { existing[1].setIvar("@name", S(spec.title)); continue; }
    const info = new RObject("RPG::MapInfo", [
      ["@name", S(spec.title)],
      ["@parent_id", Number(spec.parentId ?? 0)],
      ["@order", Number(spec.order ?? 999)],
      ["@expanded", false],
      ["@scroll_x", 0],
      ["@scroll_y", 0],
    ]);
    infos.pairs.push([Number(spec.mapId), info]);
  }
  writeData("MapInfos.rxdata", infos);
}

export function installMetadata(specs, dirName = "dlc_total") {
  backup(dirName, ["map_metadata.dat"]);
  const metadata = readData("map_metadata.dat");
  for (const spec of specs) {
    let entry = metadata.pairs.find(([key]) => Number(key) === Number(spec.mapId));
    if (!entry) {
      // Los scripts de Fire Ash (Essentials v19) definen GameData::MapMetadata;
      // RPG::MapMetadata NO existe y su solo presence en el .dat rompe el
      // arranque con "undefined class/module RPG::MapMetadata".
      const clone = new RObject("GameData::MapMetadata", [["@id", Number(spec.mapId)]]);
      entry = [Number(spec.mapId), clone];
      metadata.pairs.push(entry);
    }
    let object = entry[1];
    if (object.className === "RPG::MapMetadata") {
      const sane = new RObject("GameData::MapMetadata", [["@id", Number(spec.mapId)]]);
      for (const [k, v] of object.ivars) sane.setIvar(k, v);
      object = sane;
      entry[1] = object;
    }
    if (spec.parentId !== undefined) object.setIvar("@parent_map_id", Number(spec.parentId));
    if (spec.battleBackdrop) object.setIvar("@battle_background", S(spec.battleBackdrop));
  }
  writeData("map_metadata.dat", metadata);
}

/** ¿Existe el mapa compilado? */
export const mapExists = (id) => fs.existsSync(path.join(DATA, mapFile(id)));

/* ─────────────────────────────── verificación ──────────────────────────── */

export function makeChecker(name) {
  const errors = [];
  return {
    ok(condition, message) { if (!condition) errors.push(message); },
    fail(message) { errors.push(message); },
    done() {
      if (errors.length) {
        console.error(`✘ ${name}: ${errors.length} problema(s)`);
        for (const e of errors.slice(0, 12)) console.error(`   · ${e}`);
        process.exit(1);
      }
      console.log(`✔ ${name}: verificación OK`);
    },
  };
}

/** Comandos de una página como objetos {code, params, indent}. */
export const commandsOf = (pageObj) => (pageObj.getIvar("@list") ?? []).map(cmdOf);

/** Busca un evento por nombre exacto o por prefijo. */
export function findEvent(mapId, pattern) {
  return eventsOf(mapId).find((e) => (typeof pattern === "string" ? e.name === pattern : pattern.test(e.name)));
}

export function pagesOf(eventEntry) {
  return (iv(eventEntry.obj, "@pages") ?? []).map((pageObj, index) => ({
    obj: pageObj,
    index,
    condition: pageObj.getIvar("@condition"),
    trigger: Number(iv(pageObj, "@trigger") ?? 0),
    list: commandsOf(pageObj),
  }));
}

/* ─────────────────── datos del juego: tipos, entrenadores, objetos ──────── */

/** Símbolos de especie disponibles en species.dat. */
export function speciesAvailable() {
  const sp = readData("species.dat");
  const set = new Set();
  for (const [k] of sp.pairs) if (k && k.name) set.add(k.name);
  for (const [, v] of sp.pairs) {
    const id = v?.getIvar?.("@id");
    if (id && id.name) set.add(id.name);
  }
  return set;
}

/** Alta idempotente de tipos de entrenador clonando uno existente. */
export function installTrainerTypes(plantillas, dirName = "dlc_total") {
  backup(dirName, ["trainer_types.dat"]);
  const tt = readData("trainer_types.dat");
  const cambios = [];
  for (const plantilla of plantillas) {
    if (tt.pairs.some(([k]) => txt(k) === plantilla.id)) { cambios.push({ ...plantilla, added: false }); continue; }
    const [, base] = tt.pairs.find(([k]) => txt(k) === plantilla.base) ?? [];
    if (!base) throw new Error(`no existe el tipo base ${plantilla.base}`);
    const clone = new RObject(base.className, base.ivars.map(([k, v]) => [k, v]));
    const numeros = tt.pairs.map(([, v]) => v.getIvar("@id_number")).filter((n) => typeof n === "number");
    clone.setIvar("@id", Sym(plantilla.id));
    clone.setIvar("@id_number", Math.max(-1, ...numeros) + 1);
    clone.setIvar("@real_name", S(plantilla.nombre));
    tt.pairs.push([Sym(plantilla.id), clone]);
    cambios.push({ ...plantilla, added: true });
  }
  writeData("trainer_types.dat", tt);
  return cambios;
}

/**
 * Alta idempotente de entrenadores. Cada alta:
 *   { tipo, nombre, equipo: [especie...], nivel, derrota, objetos: ["FULLRESTORE"] }
 * Se registra con clave numérica y con clave [tipo, nombre, 0], que es la que
 * usa el motor cuando se invoca al entrenador por su nombre.
 */
export function installTrainers(altas, dirName = "dlc_total") {
  backup(dirName, ["trainers.dat"]);
  const especies = speciesAvailable();
  const d = readData("trainers.dat");
  let siguiente = Math.max(-1, ...d.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  const resultados = [];
  for (const alta of altas) {
    if (d.pairs.some(([k]) => Array.isArray(k) && txt(k[0]) === alta.tipo && txt(k[1]) === alta.nombre)) {
      resultados.push({ nombre: alta.nombre, added: false });
      continue;
    }
    const equipo = (alta.equipo ?? []).filter((sp) => especies.has(sp));
    if (!equipo.length) { resultados.push({ nombre: alta.nombre, added: false, error: "sin equipo válido" }); continue; }
    const key = [Sym(alta.tipo), S(alta.nombre), 0];
    const obj = new RObject("GameData::Trainer", [
      ["@id", key], ["@id_number", siguiente], ["@trainer_type", key[0]],
      ["@real_name", S(alta.nombre)], ["@version", 0],
      ["@items", (alta.objetos ?? ["FULLRESTORE"]).map(Sym)],
      ["@real_lose_text", S(alta.derrota ?? "…")], ["@numpkmn", 0], ["@guara", 0],
      ["@pokemon", equipo.map((sp) => new RHash([[Sym("species"), Sym(sp)], [Sym("level"), alta.nivel ?? 100]]))],
    ]);
    d.pairs.push([siguiente, obj], [key, obj]);
    siguiente += 1;
    resultados.push({ nombre: alta.nombre, added: true, equipo: equipo.length });
  }
  writeData("trainers.dat", d);
  return resultados;
}

/** Alta idempotente de objetos (medallas…) clonando uno existente. */
export function installItems(plantillas, dirName = "dlc_total") {
  backup(dirName, ["items.dat"]);
  const items = readData("items.dat");
  const resultados = [];
  for (const plantilla of plantillas) {
    if (items.pairs.some(([k]) => txt(k) === plantilla.id)) { resultados.push({ ...plantilla, added: false }); continue; }
    const [, base] = items.pairs.find(([k]) => txt(k) === plantilla.base) ?? [];
    if (!base) { resultados.push({ ...plantilla, added: false, error: `sin base ${plantilla.base}` }); continue; }
    const clone = new RObject(base.className, base.ivars.map(([k, v]) => [k, v]));
    const numeros = items.pairs.map(([, v]) => v.getIvar("@id_number")).filter((n) => typeof n === "number");
    clone.setIvar("@id", Sym(plantilla.id));
    clone.setIvar("@id_number", Math.max(-1, ...numeros) + 1);
    clone.setIvar("@real_name", S(plantilla.nombre));
    clone.setIvar("@real_name_plural", S(plantilla.plural ?? `${plantilla.nombre}s`));
    if (plantilla.pocket !== undefined) clone.setIvar("@pocket", plantilla.pocket);
    items.pairs.push([Sym(plantilla.id), clone]);
    resultados.push({ ...plantilla, added: true });
  }
  writeData("items.dat", items);
  return resultados;
}
