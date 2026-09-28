#!/usr/bin/env node
/**
 * Instala/verifica la capa "Fire Ash: A Través del Multiverso — Emisiones
 * Prohibidas del Monte Silver" sobre los datos compilados de Fire Ash 3.7.1.
 *
 * Cambios aditivos:
 *   - 9 mapas nuevos (2021-2029): la falda y la cumbre del Monte Silver más
 *     siete emisiones creepypasta (homenajes reinterpretados).
 *   - 8 batallas con canLose, derrota permanente (self-switch + sello) y
 *     revancha opcional solo por menú. Recompensas únicas.
 *   - 8 equipos nuevos en trainers.dat, sin sustituir entrenadores base.
 *   - Entrada postgame (switch 429) por el hub del laboratorio de Oak.
 *
 * Solo usa tiles, sprites, especies, objetos y tipos de entrenador existentes.
 * No toca partidas. Backups en pokemon_fire_ash/PokeModBackups/multiverse_creepypasta_originals/.
 *
 * Uso:
 *   node tools/apply_multiverse_creepypasta.mjs
 *   node tools/apply_multiverse_creepypasta.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "multiverse_creepypasta_originals");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
const MARKER = "PokeMod Multiverso:";
const POSTGAME = CATALOG.postgameSwitch;
const CHOICE_VARIABLE = 1;
const MAP_IDS = CATALOG.maps.map((entry) => entry.mapId);

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
const S = (value) => RString.fromText(String(value));
const Sym = (name) => new RSymbol(String(name));
const iv = (object, name) => object?.getIvar?.(name);
const txt = (value) => (value instanceof RString ? value.text : String(value ?? ""));
const symbol = (value) => (value instanceof RSymbol ? value.name : String(value ?? ""));
const pad3 = (n) => String(n).padStart(3, "0");
const mapFile = (id) => `Map${pad3(id)}.rxdata`;

// ---------------------------------------------------------------- RMXP bits
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
}
function condition({ sw = 0, self = "" } = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
    ["@switch2_valid", false], ["@switch2_id", 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
  ]);
}
function graphic(charName = "", dir = 2, pattern = 1, tile = 0) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", tile], ["@character_name", S(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pattern], ["@opacity", 255], ["@blend_type", 0],
  ]);
}
function moveRoute() { return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]); }
function page({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", cond], ["@graphic", gfx],
    ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
    ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
    ["@trigger", trigger], ["@list", list],
  ]);
}
function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}
function texts(lines, indent = 0) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return [cmd(101, [S("")], indent), ...arr.map((line) => cmd(401, [S(line)], indent))];
}
function script(line, indent = 0) { return cmd(355, [S(line)], indent); }
function transfer(map, x, y, dir = 2, indent = 0) { return cmd(201, [0, map, x, y, dir, 1], indent); }

// ------------------------------------------------------------- transitables
const tilesets = new Map();
const tilesetRows = read("Tilesets.rxdata");
for (let index = 1; index < tilesetRows.length; index++) {
  const raw = tilesetRows[index];
  if (raw) { const parsed = parseTileset(raw); tilesets.set(parsed.id, parsed); }
}
function openCell(parsed, x, y) {
  const tileset = tilesets.get(parsed.tilesetId);
  if (x < 0 || y < 0 || x >= parsed.width || y >= parsed.height) return false;
  let bits = 0;
  for (let z = 0; z < parsed.table.z; z++) {
    const tile = tableGet(parsed.table, x, y, z);
    if (tile > 0 && tile < tileset.passages.data.length) bits |= tileset.passages.data[tile] & 15;
  }
  return bits === 0;
}
function openCells(parsed) {
  const cells = [];
  for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) if (openCell(parsed, x, y)) cells.push([x, y]);
  return cells;
}
function flood(cells, start) {
  const key = ([x, y]) => `${x},${y}`;
  const set = new Set(cells.map(key));
  if (!set.has(key(start))) return [];
  const seen = new Set([key(start)]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const next of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const k = key(next);
      if (set.has(k) && !seen.has(k)) { seen.add(k); queue.push(next); }
    }
  }
  return [...seen].map((k) => k.split(",").map(Number));
}
function placeSlots(parsed, anchor, count) {
  const cells = openCells(parsed);
  const component = flood(cells, [Math.min(anchor[0], parsed.width - 1), Math.min(anchor[1], parsed.height - 1)]);
  const region = (component.length >= count ? component : cells).filter(([x, y]) => x > 0 && y > 0 && x < parsed.width - 1 && y < parsed.height - 1);
  if (region.length < count) throw new Error("El mapa plantilla no tiene celdas transitables suficientes");
  const sorted = [...region].sort((a, b) => (Math.abs(a[0] - anchor[0]) + Math.abs(a[1] - anchor[1])) - (Math.abs(b[0] - anchor[0]) + Math.abs(b[1] - anchor[1])));
  const chosen = [sorted[0]];
  while (chosen.length < count) {
    let best = null;
    let bestScore = -1;
    for (const cell of sorted) {
      if (chosen.some(([cx, cy]) => cx === cell[0] && cy === cell[1])) continue;
      const score = Math.min(...chosen.map(([cx, cy]) => Math.abs(cx - cell[0]) + Math.abs(cy - cell[1])));
      if (score > bestScore) { bestScore = score; best = cell; }
    }
    chosen.push(best);
  }
  return chosen;
}
function nearestOpen(parsed, near) {
  const cells = openCells(parsed);
  cells.sort((a, b) => (Math.abs(a[0] - near[0]) + Math.abs(a[1] - near[1])) - (Math.abs(b[0] - near[0]) + Math.abs(b[1] - near[1])));
  return cells[0];
}

// ------------------------------------------------------------ construcción
function cloneTemplate(templateId) {
  const map = read(mapFile(templateId));
  iv(map, "events").pairs = [];
  return map;
}
function addEvent(mapObj, ev) {
  const events = iv(mapObj, "events");
  events.pairs.push([iv(ev, "id"), ev]);
}
function simpleNpc(id, name, x, y, sprite, lines, opts = {}) {
  return event(id, name, x, y, [page({
    cond: opts.sw ? condition({ sw: opts.sw }) : condition(),
    gfx: graphic(sprite, opts.dir || 2),
    list: [...texts(lines), cmd(0)],
  })]);
}
function healerEvent(id, x, y, lines) {
  const list = [
    ...texts(lines),
    cmd(102, [[S("Sí"), S("No")], 2]),
    cmd(402, [0, S("Sí")]),
    cmd(314, [0], 1),
    ...texts(["Equipo restaurado. La emisión no se moverá hasta que vuelvas."], 1),
    cmd(402, [1, S("No")]),
    ...texts(["Vuelve cuando lo necesites."], 1),
    cmd(404), cmd(0),
  ];
  return event(id, `${MARKER} Guardiana`, x, y, [page({ gfx: graphic("NPC 16"), list })]);
}
function portalEvent(id, name, x, y, target, arrival, lines) {
  const list = [
    ...texts(lines),
    cmd(102, [[S("Entrar"), S("Quedarse")], 2]),
    cmd(402, [0, S("Entrar")]),
    transfer(target, arrival[0], arrival[1], 2, 1),
    cmd(402, [1, S("Quedarse")]),
    cmd(404), cmd(0),
  ];
  return event(id, `${MARKER} ${name}`, x, y, [page({ gfx: graphic("Object ball special"), list })]);
}
function exitEvent(id, name, x, y, targetMap, arrival, message) {
  return event(id, `${MARKER} ${name}`, x, y, [page({
    trigger: 1,
    list: [...texts([message]), transfer(targetMap, arrival[0], arrival[1]), cmd(0)],
  })]);
}
function bossEvent(id, boss, x, y, sealSwitch, rewardFlavor) {
  const call = `pbTrainerBattle(:${boss.type},"${boss.name}",nil,false,0,true)`;
  const first = [
    ...texts(boss.intro),
    script(`pbTrainerIntro(:${boss.type})`),
    cmd(111, [12, S(call)]),
    ...texts([boss.win, rewardFlavor], 1),
    script(`pbReceiveItem(:${boss.reward})`, 1),
    cmd(121, [sealSwitch, sealSwitch, 0], 1),
    script(`$game_variables[${CATALOG.counterVariable}]=$game_variables[${CATALOG.counterVariable}].to_i+1`, 1),
    cmd(123, [S("A"), 0], 1),
    cmd(411),
    ...texts([boss.loss], 1),
    cmd(412),
    script("pbTrainerEnd"), cmd(0),
  ];
  const rematch = [
    ...texts([boss.rematch]),
    cmd(102, [[S("Revancha"), S("Luego")], 2]),
    cmd(402, [0, S("Revancha")]),
    script(`pbTrainerIntro(:${boss.type})`, 1),
    cmd(111, [12, S(call)], 1),
    ...texts([boss.win], 2),
    cmd(411, [], 1),
    ...texts([boss.loss], 2),
    cmd(412, [], 1),
    script("pbTrainerEnd", 1),
    cmd(402, [1, S("Luego")]),
    cmd(404), cmd(0),
  ];
  return event(id, `${MARKER} Jefe ${boss.name}`, x, y, [
    page({ gfx: graphic(boss.sprite), list: first }),
    page({ cond: condition({ self: "A" }), gfx: graphic(boss.sprite), list: rematch }),
  ]);
}
function emissionMenu(id, x, y, destinations, arrivals) {
  const labels = [...destinations.map((entry) => entry.label), "No"];
  const list = [
    ...texts(["Las siete puertas de niebla respiran al unísono.", `¿Qué emisión quieres visitar?\\ch[${CHOICE_VARIABLE},${labels.length},${labels.join(",")}]`]),
  ];
  destinations.forEach((destination, index) => {
    list.push(cmd(111, [1, CHOICE_VARIABLE, 0, index, 0]));
    list.push(transfer(destination.map, arrivals[destination.map][0], arrivals[destination.map][1], 2, 1));
    list.push(cmd(0, [], 1), cmd(412));
  });
  list.push(cmd(0));
  return event(id, `${MARKER} Puertas de niebla`, x, y, [page({ gfx: graphic("Object ball special"), list })]);
}

function buildMaps(arrivals) {
  const built = {};
  const layouts = {};
  for (const spec of CATALOG.maps) {
    const parsed = parseMap(read(mapFile(spec.template)));
    const slots = placeSlots(parsed, spec.anchor, spec.role === "cumbre" ? 6 : 5);
    layouts[spec.mapId] = slots;
    arrivals[spec.mapId] = slots[0];
  }
  const lab = parseMap(read(mapFile(CATALOG.returnToLab.map)));
  const labArrival = nearestOpen(lab, CATALOG.returnToLab.near);
  arrivals.lab = labArrival;

  for (const spec of CATALOG.maps) {
    const map = cloneTemplate(spec.template);
    const [, exitSlot, featureSlot, healerSlot, signSlot] = layouts[spec.mapId];
    let id = 1;
    if (spec.role === "falda") {
      addEvent(map, exitEvent(id++, "Bajar al laboratorio", exitSlot[0], exitSlot[1], CATALOG.returnToLab.map, labArrival, "El sendero baja hasta el laboratorio del profesor Oak."));
      addEvent(map, simpleNpc(id++, `${MARKER} Archivero`, featureSlot[0], featureSlot[1], CATALOG.archivist.sprite, CATALOG.archivist.lines));
      addEvent(map, portalEvent(id++, "Subir a la cumbre", healerSlot[0], healerSlot[1], 2022, arrivals[2022], ["Una escalera de hielo sube hacia la cumbre.", "Desde arriba se oyen siete puertas respirando."]));
      addEvent(map, simpleNpc(id++, `${MARKER} Placa`, signSlot[0], signSlot[1], "", CATALOG.signs.falda));
    } else if (spec.role === "cumbre") {
      const zones = CATALOG.bosses.map((boss) => ({ label: boss.label, map: boss.mapId }));
      addEvent(map, exitEvent(id++, "Bajar a la falda", exitSlot[0], exitSlot[1], 2021, arrivals[2021], "La escalera de hielo devuelve a la falda."));
      addEvent(map, emissionMenu(id++, featureSlot[0], featureSlot[1], zones, arrivals));
      addEvent(map, bossEvent(id++, CATALOG.champion, healerSlot[0], healerSlot[1], CATALOG.sealSwitchBase + 7, "El campeón deja una prenda para el camino."));
      addEvent(map, simpleNpc(id++, `${MARKER} Placa`, signSlot[0], signSlot[1], "", CATALOG.signs.cumbre));
    } else {
      const boss = CATALOG.bosses.find((entry) => entry.mapId === spec.mapId);
      addEvent(map, exitEvent(id++, "Volver a la cumbre", exitSlot[0], exitSlot[1], 2022, arrivals[2022], "La niebla te devuelve a la cumbre del Monte Silver."));
      addEvent(map, bossEvent(id++, boss, featureSlot[0], featureSlot[1], CATALOG.sealSwitchBase + boss.zone, "La emisión deja algo atrás."));
      addEvent(map, healerEvent(id++, healerSlot[0], healerSlot[1], ["Guardiana: Las emisiones se aprovechan del cansancio.", "¿Restauro a tu equipo?"]));
      addEvent(map, simpleNpc(id++, `${MARKER} Señal`, signSlot[0], signSlot[1], "", boss.atmosphere));
    }
    built[spec.mapId] = map;
  }
  return built;
}

// ------------------------------------------------------------ trainers.dat
function dataSymbols(file) {
  const ids = new Set();
  for (const [key] of read(file).pairs) if (key instanceof RSymbol) ids.add(key.name);
  return ids;
}
function pokemonData(entry) {
  const [species, level, nick, shiny] = entry;
  const pairs = [[Sym("species"), Sym(species)], [Sym("level"), level]];
  if (nick) pairs.push([Sym("name"), S(nick)]);
  if (shiny) pairs.push([Sym("shininess"), true]);
  return new RHash(pairs);
}
function trainerObject(boss, idNumber) {
  const name = S(boss.name);
  const key = [Sym(boss.type), name, 0];
  return {
    key,
    obj: new RObject("GameData::Trainer", [
      ["@id", key], ["@id_number", idNumber], ["@trainer_type", key[0]],
      ["@real_name", name], ["@version", 0], ["@items", [Sym("FULLRESTORE")]],
      ["@real_lose_text", S(boss.loss)], ["@numpkmn", 0], ["@guara", 0],
      ["@pokemon", boss.team.map(pokemonData)],
    ]),
  };
}
function trainerKeyMatches(key, boss) {
  return Array.isArray(key) && symbol(key[0]) === boss.type && txt(key[1]) === boss.name && Number(key[2]) === 0;
}
function installTrainers() {
  const species = dataSymbols("species.dat");
  const types = dataSymbols("trainer_types.dat");
  const items = dataSymbols("items.dat");
  const roster = [...CATALOG.bosses, CATALOG.champion];
  for (const boss of roster) {
    if (!types.has(boss.type)) throw new Error(`Tipo de entrenador inexistente: ${boss.type}`);
    if (!items.has(boss.reward)) throw new Error(`Recompensa inexistente: ${boss.reward} (${boss.name})`);
    for (const [sp] of boss.team) if (!species.has(sp)) throw new Error(`Especie inexistente: ${sp} (${boss.name})`);
  }
  const trainers = read("trainers.dat");
  let next = Math.max(-1, ...trainers.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  for (const boss of roster) {
    if (trainers.pairs.some(([key]) => trainerKeyMatches(key, boss))) continue;
    const built = trainerObject(boss, next);
    trainers.pairs.push([next, built.obj], [built.key, built.obj]);
    next++;
  }
  write("trainers.dat", trainers);
}

// ------------------------------------------------------- metadatos e índices
function installMapInfos() {
  const infos = read("MapInfos.rxdata");
  infos.pairs = infos.pairs.filter(([key]) => !MAP_IDS.includes(Number(key)));
  for (const spec of CATALOG.maps) {
    const info = new RObject("RPG::MapInfo", [
      ["@scroll_x", 512], ["@name", S(spec.title)], ["@expanded", false],
      ["@order", 1100 + MAP_IDS.indexOf(spec.mapId)], ["@scroll_y", 320],
      ["@parent_id", spec.mapId === 2021 ? 48 : 2021],
    ]);
    infos.pairs.push([spec.mapId, info]);
  }
  write("MapInfos.rxdata", infos);
}
function installMapRuntimeData() {
  const metadata = read("map_metadata.dat");
  const fallback = metadata.pairs.find(([id]) => Number(id) === 973)?.[1] ?? metadata.pairs.find(([, value]) => value)?.[1];
  for (const spec of CATALOG.maps) {
    const source = metadata.pairs.find(([id]) => Number(id) === spec.template)?.[1] ?? fallback;
    if (!source) throw new Error(`No existen metadatos para la plantilla ${spec.template}`);
    metadata.pairs = metadata.pairs.filter(([id]) => Number(id) !== spec.mapId);
    const clone = new RObject(source.className, source.ivars.map(([key, value]) => [key, value]));
    clone.setIvar("id", spec.mapId);
    metadata.pairs.push([spec.mapId, clone]);
  }
  write("map_metadata.dat", metadata);
}
function persistArrivals(arrivals) {
  const target = path.join(ROOT, "content", "multiverse_creepypasta.json");
  const catalog = JSON.parse(fs.readFileSync(target, "utf8"));
  catalog.returnToLab.arrival = arrivals.lab;
  for (const spec of catalog.maps) spec.arrival = arrivals[spec.mapId];
  fs.writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`);
}

// -------------------------------------------------------------- verificación
function verify() {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };
  const infos = read("MapInfos.rxdata").pairs;
  const roster = [...CATALOG.bosses, CATALOG.champion];
  for (const spec of CATALOG.maps) {
    const mapObj = read(mapFile(spec.mapId));
    const parsed = parseMap(mapObj);
    const events = parsed.events.map(({ obj }) => parseEvent(obj));
    const info = infos.find(([key]) => Number(key) === spec.mapId)?.[1];
    ok(Boolean(info) && txt(iv(info, "name")) === spec.title, `MapInfos: falta ${spec.title}`);
    const added = events.filter((entry) => entry.name.startsWith(MARKER));
    ok(added.length === 4, `${spec.mapId}: ${added.length}/4 eventos propios`);
    for (const entry of added) ok(openCell(parsed, entry.x, entry.y), `${spec.mapId}: evento ${entry.name} sobre celda bloqueada (${entry.x},${entry.y})`);
  }
  for (const boss of roster) {
    const mapObj = read(mapFile(boss.mapId));
    const events = parseMap(mapObj).events.map(({ obj }) => parseEvent(obj));
    const battleEvent = events.find((entry) => entry.name.includes(boss.name));
    ok(Boolean(battleEvent), `${boss.name}: falta el evento de batalla`);
    if (!battleEvent) continue;
    const pages = battleEvent.pages;
    ok(pages.length === 2, `${boss.name}: debe tener página de derrotado`);
    const list = pages[0].list;
    const call = list.filter((c) => c.getIvar("code") === 111 && Number(c.getIvar("parameters")[0]) === 12).map((c) => txt(c.getIvar("parameters")[1])).join("\n");
    ok(call.includes(`pbTrainerBattle(:${boss.type}`) && /true\s*\)/.test(call), `${boss.name}: la batalla debe ser pbTrainerBattle con canLose=true`);
    const winIndex = list.findIndex((c) => c.getIvar("code") === 111 && Number(c.getIvar("parameters")[0]) === 12);
    const selfIndex = list.findIndex((c) => c.getIvar("code") === 123 && Number(c.getIvar("parameters")[1]) === 0);
    ok(winIndex >= 0 && selfIndex > winIndex, `${boss.name}: la derrota permanente debe colgarse de la victoria`);
    const seal = CATALOG.sealSwitchBase + (boss === CATALOG.champion ? 7 : boss.zone);
    ok(list.some((c) => c.getIvar("code") === 121 && Number(c.getIvar("parameters")[0]) === seal && Number(c.getIvar("parameters")[2]) === 0), `${boss.name}: falta el sello ${seal}`);
    ok(list.some((c) => [355, 655].includes(c.getIvar("code")) && txt(c.getIvar("parameters")[0]).includes(`pbReceiveItem(:${boss.reward})`)), `${boss.name}: falta la recompensa única`);
    ok(pages[1]?.condition?.selfSwitch === "A", `${boss.name}: la página 2 debe exigir self-switch A`);
    ok(pages[1].list.some((c) => c.getIvar("code") === 102), `${boss.name}: la revancha debe pedirse por menú`);
  }
  const trainers = read("trainers.dat");
  for (const boss of roster) ok(trainers.pairs.some(([key]) => trainerKeyMatches(key, boss)), `trainers.dat: falta el equipo de ${boss.name}`);
  const meta = read("map_metadata.dat").pairs;
  for (const id of MAP_IDS) ok(meta.some(([key]) => Number(key) === id), `map_metadata: falta ${id}`);
  if (errors.length) throw new Error(`Multiverso inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: Monte Silver (2021-2022) + 7 emisiones (2023-2029); ${roster.length} batallas con canLose, derrota permanente por sello y revancha por menú; ${roster.length} equipos nuevos en trainers.dat.`);
}

function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  const files = ["MapInfos.rxdata", "map_metadata.dat", "trainers.dat", ...MAP_IDS.map(mapFile)];
  for (const file of files) {
    const src = path.join(DATA, file);
    const dst = path.join(BACKUP, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"),
    "Copias anteriores a las Emisiones Prohibidas del Monte Silver. No contienen partidas.\\n" +
    "Para revertir, copia estos archivos sobre pokemon_fire_ash/Data/.\\n");
}

if (!VERIFY_ONLY) {
  backup();
  const arrivals = {};
  const built = buildMaps(arrivals);
  for (const [id, map] of Object.entries(built)) write(mapFile(id), map);
  installMapInfos();
  installMapRuntimeData();
  installTrainers();
  persistArrivals(arrivals);
  console.log(`Monte Silver instalado (mapas ${MAP_IDS[0]}-${MAP_IDS[MAP_IDS.length - 1]}). Backup: ${path.relative(ROOT, BACKUP)}`);
}
verify();
