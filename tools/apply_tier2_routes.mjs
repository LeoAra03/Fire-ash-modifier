#!/usr/bin/env node
/** Compila rutas Tier 2 con dos NPCs, decisión persistente y recompensa única. */
import fs from "node:fs";
import path from "node:path";
import { marshalDump, marshalLoad, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const inputAt = process.argv.indexOf("--input");
const backupAt = process.argv.indexOf("--backup");
const INPUT = path.resolve(inputAt >= 0 ? process.argv[inputAt + 1] : path.join(ROOT, "content", "atlas_tier2_blueprints_macro02.json"));
const BACKUP_NAME = backupAt >= 0 ? process.argv[backupAt + 1] : "atlas_tier2_routes_originals";
const BACKUP = path.join(GAME, "PokeModBackups", BACKUP_NAME);
const VERIFY_ONLY = process.argv.includes("--verify");
const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const MACRO_CYCLE = Number(data.macroCycle ?? 0);
const QA_FILE = path.join(ROOT, "content", MACRO_CYCLE === 2 ? "atlas_tier2_qa.json" : `atlas_tier2_qa_macro${String(MACRO_CYCLE).padStart(2, "0")}.json`);
const MARKER = "PokeMod Tier2:";
const BLUEPRINTS = data.blueprints ?? [];
const routeNumber = (blueprint) => Number(blueprint.progression.switchId) - 747;
const switchName = (blueprint) => `POKEMOD ATLAS T2 ROUTE ${String(routeNumber(blueprint)).padStart(2, "0")}`;
const variableName = (blueprint) => `POKEMOD ATLAS T2 DECISION ${String(routeNumber(blueprint)).padStart(2, "0")}`;
const S = (value) => RString.fromText(String(value));
const iv = (object, name) => object?.getIvar?.(name);
const txt = (value) => value instanceof RString ? value.text : String(value ?? "");
const sym = (value) => value instanceof RSymbol ? value.name : String(value ?? "");
const pad = (value) => String(value).padStart(3, "0");
const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));

function symbols(file) {
  const result = new Set();
  for (const [key] of read(file).pairs) if (key instanceof RSymbol) result.add(key.name);
  return result;
}
function validateBlueprints() {
  const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
  const tier2 = new Set(hierarchy.maps.filter((entry) => entry.tier === 2).map((entry) => Number(entry.mapId)));
  const characters = new Set(fs.readdirSync(path.join(GAME, "Graphics", "Characters")).filter((file) => /\.png$/i.test(file)).map((file) => file.replace(/\.png$/i, "")));
  const species = symbols("species.dat");
  const items = symbols("items.dat");
  const errors = [];
  const seenMaps = new Set(), seenFlags = new Set(), seenVariables = new Set(), seenTitles = new Set(), seenRewards = new Set();
  const banned = /soy un entrenador|qué gran combate|este pokémon es muy fuerte|según la pokédex|debes derrotarme/i;
  for (const blueprint of BLUEPRINTS) {
    if (!tier2.has(Number(blueprint.mapId))) errors.push(`${blueprint.mapId}: no pertenece a Tier 2`);
    if (seenMaps.has(blueprint.mapId)) errors.push(`${blueprint.mapId}: mapa repetido`); seenMaps.add(blueprint.mapId);
    if (!blueprint.title || seenTitles.has(blueprint.title)) errors.push(`${blueprint.mapId}: título vacío o repetido`); seenTitles.add(blueprint.title);
    if (!blueprint.promise || !blueprint.objective || !blueprint.mechanic?.name || blueprint.mechanic?.rules?.length < 3 || !blueprint.mechanic?.failureSafe) errors.push(`${blueprint.mapId}: objetivo o mecánica incompletos`);
    if (!Array.isArray(blueprint.npcs) || blueprint.npcs.length !== 2) errors.push(`${blueprint.mapId}: requiere exactamente dos NPCs`);
    for (const npc of blueprint.npcs ?? []) {
      if (!npc.name || !npc.role || !npc.motivation || !npc.conflict) errors.push(`${blueprint.mapId}: NPC incompleto`);
      if (!characters.has(npc.sprite)) errors.push(`${blueprint.mapId}: sprite inexistente ${npc.sprite}`);
      if (!species.has(npc.partnerPokemon)) errors.push(`${blueprint.mapId}: compañero inexistente ${npc.partnerPokemon}`);
      if ((npc.dialogue?.before?.length ?? 0) < 3 || (npc.dialogue?.after?.length ?? 0) < 3) errors.push(`${blueprint.mapId}: diálogo insuficiente para ${npc.name}`);
      if ([...(npc.dialogue?.before ?? []), ...(npc.dialogue?.after ?? [])].some((line) => banned.test(line))) errors.push(`${blueprint.mapId}: frase genérica en ${npc.name}`);
    }
    if (blueprint.decision?.options?.length !== 2 || blueprint.decision?.immediate?.length !== 2 || blueprint.decision?.later?.length !== 2) errors.push(`${blueprint.mapId}: decisión incompleta`);
    if (!items.has(blueprint.reward?.item) || !blueprint.reward?.meaning || seenRewards.has(blueprint.reward?.item)) errors.push(`${blueprint.mapId}: recompensa inválida o repetida`); seenRewards.add(blueprint.reward?.item);
    const flag = Number(blueprint.progression?.switchId), variable = Number(blueprint.progression?.decisionVariable);
    if (flag < 748 || seenFlags.has(flag) || Number(blueprint.flag) !== flag) errors.push(`${blueprint.mapId}: switch inválido/repetido ${flag}`); seenFlags.add(flag);
    if (variable < 144 || variable !== flag - 604 || seenVariables.has(variable) || Number(blueprint.variable) !== variable) errors.push(`${blueprint.mapId}: variable inválida/repetida ${variable}`); seenVariables.add(variable);
    if (blueprint.progression?.freeReturnMapId !== 1001 || blueprint.safety?.bagAlwaysAvailable !== true || blueprint.safety?.noForcedBattle !== true || blueprint.safety?.freeReturn !== true || blueprint.safety?.rewardOnce !== true || blueprint.safety?.existingChallengePreserved !== true) errors.push(`${blueprint.mapId}: garantías de seguridad incompletas`);
    const existing = parseMap(read(`Map${pad(blueprint.mapId)}.rxdata`)).events;
    if (existing.some(({ id, obj }) => [200,201].includes(id) && !parseEvent(obj).name.startsWith(MARKER))) errors.push(`${blueprint.mapId}: IDs 200–201 ya pertenecen a eventos originales`);
  }
  const expectedRoutes = Number(data.tier2Batches ?? 0) * 5;
  if (!Number.isInteger(expectedRoutes) || expectedRoutes <= 0 || BLUEPRINTS.length !== expectedRoutes) errors.push(`se esperaban ${expectedRoutes} rutas y llegaron ${BLUEPRINTS.length}`);
  const sortedFlags = [...seenFlags].sort((left, right) => left - right);
  if (sortedFlags.some((flag, index) => index > 0 && flag !== sortedFlags[index - 1] + 1)) errors.push("los switches del macrociclo no son consecutivos");
  const report = { version: 1, macroCycle: MACRO_CYCLE, scope: `Tier 2 macrociclo ${String(MACRO_CYCLE).padStart(2, "0")}`, summary: { total: BLUEPRINTS.length, passed: errors.length ? 0 : BLUEPRINTS.length, failed: errors.length ? BLUEPRINTS.length : 0 }, errors };
  fs.writeFileSync(QA_FILE, `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Blueprints Tier 2 inválidos (${errors.length}):\n- ${errors.join("\n- ")}`);
  return report;
}

function cmd(code, parameters = [], indent = 0) { return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", parameters]]); }
function condition({ sw = 0 } = {}) { return new RObject("RPG::Event::Page::Condition", [["@switch1_valid", Boolean(sw)], ["@switch1_id", sw || 1], ["@switch2_valid", false], ["@switch2_id", 1], ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0], ["@self_switch_valid", false], ["@self_switch_ch", S("A")]]); }
function graphic(name = "") { return new RObject("RPG::Event::Page::Graphic", [["@tile_id", 0], ["@character_name", S(name)], ["@character_hue", 0], ["@direction", 2], ["@pattern", 1], ["@opacity", 255], ["@blend_type", 0]]); }
function route() { return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]); }
function page({ cond = condition(), gfx = graphic(), list = [cmd(0)] } = {}) { return new RObject("RPG::Event::Page", [["@condition", cond], ["@graphic", gfx], ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3], ["@move_route", route()], ["@walk_anime", true], ["@step_anime", false], ["@direction_fix", false], ["@through", true], ["@always_on_top", false], ["@trigger", 0], ["@list", list]]); }
function event(id, name, x, y, pages) { return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]); }
function wrap(input, max = 43) { const output = []; for (const paragraph of String(input).split("\n")) { let line = ""; for (const word of paragraph.split(/\s+/)) { if (!line) line = word; else if (`${line} ${word}`.length <= max) line += ` ${word}`; else { output.push(line); line = word; } } if (line) output.push(line); } return output.length ? output : ["..."]; }
function texts(lines, indent = 0) { const all = (Array.isArray(lines) ? lines : [lines]).flatMap((line) => wrap(line)); return [cmd(101, [S("")], indent), ...all.map((line) => cmd(401, [S(line)], indent))]; }
function setSwitch(id, indent = 0) { return cmd(121, [id, id, 0], indent); }
function setVariable(id, value, indent = 0) { return cmd(122, [id, id, 0, 0, value], indent); }

const rawTilesets = read("Tilesets.rxdata"), tilesets = new Map();
for (let index = 1; index < rawTilesets.length; index++) if (rawTilesets[index]) { const parsed = parseTileset(rawTilesets[index]); tilesets.set(parsed.id, parsed); }
function openCell(parsed, tileset, x, y) {
  if (x < 1 || y < 1 || x >= parsed.width - 1 || y >= parsed.height - 1) return false;
  let bits = 0;
  for (let z = 0; z < parsed.table.z; z++) { const tile = tableGet(parsed.table, x, y, z); if (tile > 0 && tile < tileset.passages.data.length) bits |= tileset.passages.data[tile] & 15; }
  return bits === 0;
}
function largestComponent(map) {
  const parsed = parseMap(map), tileset = tilesets.get(parsed.tilesetId), seen = new Set(), components = [];
  for (let y = 1; y < parsed.height - 1; y++) for (let x = 1; x < parsed.width - 1; x++) {
    const key = `${x},${y}`; if (seen.has(key) || !openCell(parsed, tileset, x, y)) continue;
    const queue = [[x, y]]; seen.add(key);
    for (let at = 0; at < queue.length; at++) { const [cx, cy] = queue[at]; for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) { const next = `${nx},${ny}`; if (!seen.has(next) && openCell(parsed, tileset, nx, ny)) { seen.add(next); queue.push([nx, ny]); } } }
    components.push(queue);
  }
  components.sort((left, right) => right.length - left.length); return components[0] ?? [];
}
function spread(map, count) {
  const parsed = parseMap(map), occupied = new Set(parsed.events.map(({ obj }) => { const event = parseEvent(obj); return `${event.x},${event.y}`; }));
  const cells = largestComponent(map).filter(([x, y]) => !occupied.has(`${x},${y}`));
  if (cells.length < count) throw new Error(`No hay ${count} posiciones libres.`);
  const chosen = [cells[Math.floor(cells.length / 2)]], used = new Set([chosen[0].join(",")]);
  while (chosen.length < count) { let best = null, score = -1; for (const cell of cells) { if (used.has(cell.join(","))) continue; const distance = Math.min(...chosen.map(([x,y]) => (x-cell[0])**2 + (y-cell[1])**2)); if (distance > score) { score = distance; best = cell; } } chosen.push(best); used.add(best.join(",")); }
  return chosen;
}
function conductorEvent(blueprint, position) {
  const firstNpc = blueprint.npcs[0], flag = blueprint.progression.switchId, variable = blueprint.progression.decisionVariable;
  const introduction = [blueprint.title, blueprint.promise, ...firstNpc.dialogue.before, `Objetivo: ${blueprint.objective}`, `${blueprint.mechanic.name}: ${blueprint.mechanic.rules.join(" / ")}`, blueprint.mechanic.failureSafe];
  const rewardCall = `pbReceiveItem(:${blueprint.reward.item})`;
  const first = [
    ...texts(introduction),
    cmd(102, [blueprint.decision.options.map(S), 2]),
    cmd(402, [0, S(blueprint.decision.options[0])]), setVariable(variable, 0, 1), ...texts([blueprint.decision.immediate[0]], 1),
    cmd(402, [1, S(blueprint.decision.options[1])]), setVariable(variable, 1, 1), ...texts([blueprint.decision.immediate[1]], 1),
    cmd(404),
    cmd(111, [12, S(rewardCall)]),
    ...texts([`Recompensa: ${blueprint.reward.meaning}`, ...blueprint.decision.later], 1), setSwitch(flag, 1),
    cmd(411), ...texts(["Haz espacio en la Mochila y vuelve a hablar conmigo. La decisión aún puede revisarse y la salida permanece abierta."], 1), cmd(412),
    cmd(0),
  ];
  const done = [...texts([...firstNpc.dialogue.after, ...blueprint.decision.later, "La ruta de regreso a Puerto Horizonte permanece abierta."]), cmd(0)];
  return event(200, `${MARKER} Conductor ${blueprint.title}`, position[0], position[1], [page({ gfx: graphic(firstNpc.sprite), list: first }), page({ cond: condition({ sw: flag }), gfx: graphic(firstNpc.sprite), list: done })]);
}
function supportEvent(blueprint, position) {
  const npc = blueprint.npcs[1], flag = blueprint.progression.switchId;
  return event(201, `${MARKER} NPC ${npc.name}`, position[0], position[1], [page({ gfx: graphic(npc.sprite), list: [...texts(npc.dialogue.before), cmd(0)] }), page({ cond: condition({ sw: flag }), gfx: graphic(npc.sprite), list: [...texts(npc.dialogue.after), cmd(0)] })]);
}
function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const file of ["System.rxdata", "MapInfos.rxdata", ...BLUEPRINTS.map((blueprint) => `Map${pad(blueprint.mapId)}.rxdata`)]) { const source = path.join(DATA, file), target = path.join(BACKUP, file); if (!fs.existsSync(target)) fs.copyFileSync(source, target); }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), `Originales anteriores a compilar ${path.basename(INPUT)}. Restaura estos archivos para revertir ${data.tier2Batches} lotes Tier 2 del macrociclo ${MACRO_CYCLE}.\n`);
}
function installSystem() {
  const system = read("System.rxdata"), switches = iv(system, "switches") ?? [], variables = iv(system, "variables") ?? [];
  for (const blueprint of BLUEPRINTS) { const flag = blueprint.progression.switchId, variable = blueprint.progression.decisionVariable, expectedSwitch = switchName(blueprint), expectedVariable = variableName(blueprint); if (switches[flag] && txt(switches[flag]) !== expectedSwitch) throw new Error(`Switch ${flag} ocupado por ${txt(switches[flag])}`); if (variables[variable] && txt(variables[variable]) !== expectedVariable) throw new Error(`Variable ${variable} ocupada por ${txt(variables[variable])}`); switches[flag] = S(expectedSwitch); variables[variable] = S(expectedVariable); }
  system.setIvar("switches", switches); system.setIvar("variables", variables); write("System.rxdata", system);
}
function installMapInfos() { const infos = read("MapInfos.rxdata"); for (const blueprint of BLUEPRINTS) { const info = infos.pairs.find(([key]) => Number(key) === blueprint.mapId)?.[1]; if (!info) throw new Error(`MapInfos sin ${blueprint.mapId}`); info.setIvar("name", S(blueprint.title)); } write("MapInfos.rxdata", infos); }
function installMaps() {
  for (const blueprint of BLUEPRINTS) { const file = `Map${pad(blueprint.mapId)}.rxdata`, map = read(file), events = iv(map, "events"); events.pairs = events.pairs.filter(([, object]) => !txt(iv(object, "name")).startsWith(MARKER)); const positions = spread(map, 2), additions = [conductorEvent(blueprint, positions[0]), supportEvent(blueprint, positions[1])]; for (const object of additions) events.pairs.push([Number(iv(object, "id")), object]); write(file, map); }
}
function commandsOf(eventObject) { const commands = []; for (const eventPage of iv(eventObject, "pages") ?? []) for (const command of iv(eventPage, "list") ?? []) commands.push(command); return commands; }
function verify() {
  const errors = [], ok = (conditionValue, message) => { if (!conditionValue) errors.push(message); };
  const system = read("System.rxdata"), switches = iv(system, "switches"), variables = iv(system, "variables"), infos = read("MapInfos.rxdata");
  for (let index = 0; index < BLUEPRINTS.length; index++) {
    const blueprint = BLUEPRINTS[index], flag = blueprint.progression.switchId, variable = blueprint.progression.decisionVariable;
    ok(txt(switches[flag]) === switchName(blueprint), `${blueprint.mapId}: switch incorrecto`);
    ok(txt(variables[variable]) === variableName(blueprint), `${blueprint.mapId}: variable incorrecta`);
    ok(txt(infos.pairs.find(([key]) => Number(key) === blueprint.mapId)?.[1]?.getIvar("name")) === blueprint.title, `${blueprint.mapId}: nombre de mapa incorrecto`);
    const parsed = parseMap(read(`Map${pad(blueprint.mapId)}.rxdata`)), events = parsed.events.map(({ obj }) => parseEvent(obj)), added = parsed.events.map(({ obj }) => obj).filter((object) => txt(iv(object, "name")).startsWith(MARKER));
    ok(added.length === 2, `${blueprint.mapId}: ${added.length}/2 eventos Tier 2`);
    ok(events.some((entry) => entry.name === "Return to Puerto Horizonte"), `${blueprint.mapId}: retorno ausente`);
    if (blueprint.safety.baseChallengeExpected !== false) ok(events.some((entry) => entry.name.startsWith("Atlas desafío")), `${blueprint.mapId}: desafío Atlas base ausente`);
    const conductor = added.find((object) => txt(iv(object, "name")).includes("Conductor")), commands = conductor ? commandsOf(conductor) : [], ruby = commands.filter((command) => [111,355,655].includes(Number(iv(command, "code")))).map((command) => txt(iv(command, "parameters")?.[Number(iv(command, "code")) === 111 ? 1 : 0])).join("\n");
    ok(commands.some((command) => Number(iv(command, "code")) === 102), `${blueprint.mapId}: decisión ausente`);
    ok(commands.some((command) => Number(iv(command, "code")) === 111 && txt(iv(command, "parameters")?.[1]) === `pbReceiveItem(:${blueprint.reward.item})`), `${blueprint.mapId}: recompensa no protegida contra Mochila llena`);
    ok(commands.some((command) => Number(iv(command, "code")) === 121 && Number(iv(command, "indent")) === 1), `${blueprint.mapId}: progreso no condicionado a recibir recompensa`);
    ok(!/674|675|NO ITEM|disable.*bag/i.test(ruby), `${blueprint.mapId}: intento de bloquear Mochila`);
  }
  if (errors.length) throw new Error(`Tier 2 compilado inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: ${BLUEPRINTS.length} rutas Tier 2, ${BLUEPRINTS.length * 2} NPCs, decisiones persistentes, recompensas únicas, desafío base preservado cuando existe y retorno libre.`);
}

validateBlueprints();
if (!VERIFY_ONLY) { backup(); installSystem(); installMapInfos(); installMaps(); console.log(`Tier 2 compilado desde ${path.relative(ROOT, INPUT)}. Backup: ${path.relative(ROOT, BACKUP)}`); }
verify();
