#!/usr/bin/env node
/**
 * Compila las reglas locales de los 420 Ecos Tier 3 sin desafío genérico.
 *
 * Cada regla se instala como evento `PokeMod Tier3: Eco NNNN` (id 120) con:
 *   - identificación del eco (id, sector y mapa de origen);
 *   - la anomalía local y sus tres reglas de contrajuego;
 *   - una microdecisión reversible (seguir la regla / observar) resuelta con
 *     self-switch A, sin switches ni variables globales.
 *
 * No se tocan la baliza (10), la navegación (1–3), los desafíos Atlas (100) ni
 * el retorno libre. El instalador es idempotente y no bloquea la Mochila.
 *
 * Uso:
 *   node tools/apply_atlas_tier3_rules.mjs            # instala y verifica
 *   node tools/apply_atlas_tier3_rules.mjs --verify   # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import { marshalDump, marshalLoad, RObject, RString } from "../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const INPUT = path.join(ROOT, "content", "atlas_tier3_rules.json");
const BACKUP = path.join(GAME, "PokeModBackups", "atlas_tier3_rules_originals");
const MARKER = "PokeMod Tier3:";
const EVENT_ID = 120;
const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const entries = data.entries ?? [];

const S = (value) => RString.fromText(String(value));
const iv = (object, name) => object?.getIvar?.(name);
const txt = (value) => value instanceof RString ? value.text : String(value ?? "");
const pad = (value) => String(value).padStart(3, "0");
const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));

function cmd(code, parameters = [], indent = 0) { return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", parameters]]); }
function condition({ self = "" } = {}) { return new RObject("RPG::Event::Page::Condition", [["@switch1_valid", false], ["@switch1_id", 1], ["@switch2_valid", false], ["@switch2_id", 1], ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0], ["@self_switch_valid", Boolean(self)], ["@self_switch_ch", S(self || "A")]]); }
function graphic() { return new RObject("RPG::Event::Page::Graphic", [["@tile_id", 0], ["@character_name", S("Object ball special")], ["@character_hue", 0], ["@direction", 2], ["@pattern", 1], ["@opacity", 255], ["@blend_type", 0]]); }
function route() { return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", [new RObject("RPG::MoveCommand", [["@code", 0], ["@parameters", []]])]]]); }
function page({ cond = condition(), list = [cmd(0)] } = {}) { return new RObject("RPG::Event::Page", [["@condition", cond], ["@graphic", graphic()], ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3], ["@move_route", route()], ["@walk_anime", true], ["@step_anime", false], ["@direction_fix", false], ["@through", true], ["@always_on_top", false], ["@trigger", 0], ["@list", list]]); }
function event(id, name, x, y, pages) { return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]); }
function wrap(input, max = 43) { const output = []; for (const paragraph of String(input).split("\n")) { let line = ""; for (const word of paragraph.split(/\s+/).filter(Boolean)) { if (!line) line = word; else if (`${line} ${word}`.length <= max) line += ` ${word}`; else { output.push(line); line = word; } } if (line) output.push(line); } return output.length ? output : ["..."]; }
function texts(lines, indent = 0) { const all = (Array.isArray(lines) ? lines : [lines]).flatMap((line) => wrap(line)); return [cmd(101, [S(all[0])], indent), ...all.slice(1).map((line) => cmd(401, [S(line)], indent))]; }

function ruleEvent(entry, [x, y]) {
  const first = [
    ...texts([entry.flavor, entry.anomaly]),
    ...texts([`Regla local: ${entry.rule.name}`, ...entry.rule.rules]),
    cmd(102, [[S("Seguir la regla local"), S("Observar sin intervenir")], 2]),
    cmd(402, [0, S("Seguir la regla local")]),
    ...texts([entry.rule.outcome, "El eco queda registrado como estabilizado."], 1),
    cmd(123, [S("A"), 0], 1),
    cmd(402, [1, S("Observar sin intervenir")]),
    ...texts(["Decides observar sin intervenir. La anomalía sigue activa y podrás volver a intentarlo."], 1),
    cmd(404),
    cmd(0),
  ];
  const done = [...texts([`Eco ${String(entry.echoId).padStart(4, "0")} estabilizado: ${entry.rule.name}. La baliza de retorno permanece abierta.`]), cmd(0)];
  return event(EVENT_ID, `${MARKER} Eco ${String(entry.echoId).padStart(4, "0")}`, x, y, [page({ list: first }), page({ cond: condition({ self: "A" }), list: done })]);
}

const tilesetsRaw = read("Tilesets.rxdata"), tilesets = new Map();
for (let index = 1; index < tilesetsRaw.length; index++) if (tilesetsRaw[index]) { const parsed = parseTileset(tilesetsRaw[index]); tilesets.set(parsed.id, parsed); }
function openCell(parsed, x, y) {
  const tileset = tilesets.get(parsed.tilesetId);
  if (x < 1 || y < 1 || x >= parsed.width - 1 || y >= parsed.height - 1) return false;
  let bits = 0;
  for (let z = 0; z < parsed.table.z; z++) { const tile = tableGet(parsed.table, x, y, z); if (tile > 0 && tile < tileset.passages.data.length) bits |= tileset.passages.data[tile] & 15; }
  return bits === 0;
}
function largestComponent(mapObj) {
  const parsed = parseMap(mapObj), tileset = tilesets.get(parsed.tilesetId), seen = new Set(), components = [];
  for (let y = 1; y < parsed.height - 1; y++) for (let x = 1; x < parsed.width - 1; x++) {
    const key = `${x},${y}`; if (seen.has(key) || !openCell(parsed, x, y)) continue;
    const queue = [[x, y]]; seen.add(key);
    for (let at = 0; at < queue.length; at++) { const [cx, cy] = queue[at]; for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) { const next = `${nx},${ny}`; if (!seen.has(next) && openCell(parsed, nx, ny)) { seen.add(next); queue.push([nx, ny]); } } }
    components.push(queue);
  }
  components.sort((left, right) => right.length - left.length);
  return components[0] ?? [];
}
function pickPosition(mapObj) {
  const parsed = parseMap(mapObj);
  const occupied = new Set(parsed.events.map(({ obj }) => `${iv(obj, "x")},${iv(obj, "y")}`));
  const cell = largestComponent(mapObj).find(([x, y]) => !occupied.has(`${x},${y}`));
  if (!cell) throw new Error("Mapa sin celdas libres para la regla");
  return cell;
}

function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const entry of entries) {
    const file = `Map${pad(entry.mapId)}.rxdata`, source = path.join(DATA, file), target = path.join(BACKUP, file);
    if (fs.existsSync(source) && !fs.existsSync(target)) fs.copyFileSync(source, target);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), "Mapas Atlas inmediatamente anteriores a las reglas locales Tier 3. Restaura sobre Data/ para revertir esta capa.\n");
}
function install() {
  for (const entry of entries) {
    const file = `Map${pad(entry.mapId)}.rxdata`, map = read(file), events = iv(map, "events");
    const previous = events.pairs.find(([, object]) => txt(iv(object, "name")).startsWith(MARKER));
    const kept = events.pairs.filter(([, object]) => !txt(iv(object, "name")).startsWith(MARKER) && Number(iv(object, "id")) !== EVENT_ID);
    const parsed = parseMap(map);
    const position = previous && openCell(parsed, Number(iv(previous[1], "x")), Number(iv(previous[1], "y")))
      ? [Number(iv(previous[1], "x")), Number(iv(previous[1], "y"))]
      : pickPosition(map);
    events.pairs = [...kept, [EVENT_ID, ruleEvent(entry, position)]];
    write(file, map);
  }
}
function verify() {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };
  ok(entries.length === 420, `el catálogo tiene ${entries.length}/420 reglas`);
  ok(new Set(entries.map((entry) => entry.mapId)).size === entries.length, "mapas repetidos en el catálogo");
  const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
  const tier3 = hierarchy.maps.filter((entry) => entry.tier === 3);
  ok(tier3.length === 840, `la jerarquía tiene ${tier3.length}/840 Ecos`);
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8"));
  const challengeMaps = new Set(catalog.suggestions.map((entry) => Number(entry.mapId)));
  let ruleCount = 0, challengeCount = 0, returnCount = 0, beaconCount = 0, decisionCount = 0;
  for (const map of tier3) {
    const file = `Map${pad(map.mapId)}.rxdata`;
    if (!fs.existsSync(path.join(DATA, file))) { errors.push(`falta ${file}`); continue; }
    const parsed = parseMap(read(file)), events = parsed.events.map(({ obj }) => parseEvent(obj));
    const names = events.map((entry) => entry.name);
    const hasChallenge = names.some((name) => name.startsWith("Atlas desafío"));
    const rules = events.filter((entry) => entry.name.startsWith(MARKER));
    ok(hasChallenge === challengeMaps.has(map.mapId), `${map.mapId}: desafío Atlas inesperado`);
    ok((hasChallenge && rules.length === 0) || (!hasChallenge && rules.length === 1), `${map.mapId}: ${rules.length} reglas y desafío=${hasChallenge}`);
    if (hasChallenge) challengeCount++; else ruleCount += rules.length;
    if (names.includes("Return to Puerto Horizonte")) returnCount++;
    if (names.includes(`Atlas Tier 3 Beacon ${map.mapId}`)) beaconCount++;
    for (const rule of rules) {
      const commands = rule.pages.flatMap((entry) => entry.list).map(cmdOf).filter((entry) => entry.code !== 0);
      if (commands.some((entry) => Number(entry.code) === 102)) decisionCount++;
      const ruby = commands.filter((entry) => [111, 355, 655].includes(Number(entry.code))).map((entry) => txt(entry.params[Number(entry.code) === 111 ? 1 : 0])).join("\n");
      ok(!/674|675|\$game_switches|\$game_variables/.test(ruby), `${map.mapId}: la regla toca flags globales`);
      ok(commands.some((entry) => Number(entry.code) === 123 && Number(entry.params[1]) === 0), `${map.mapId}: self-switch A incorrecto`);
      ok(openCell(parsed, rule.x, rule.y), `${map.mapId}: regla colocada en celda bloqueada (${rule.x},${rule.y})`);
    }
  }
  ok(ruleCount === 420, `hay ${ruleCount}/420 reglas compiladas`);
  ok(challengeCount === 420, `hay ${challengeCount}/420 desafíos Atlas en Ecos`);
  ok(returnCount === 840, `hay ${returnCount}/840 retornos en Ecos`);
  ok(beaconCount === 840, `hay ${beaconCount}/840 balizas en Ecos`);
  ok(decisionCount === 420, `hay ${decisionCount}/420 microdecisiones`);
  if (errors.length) throw new Error(`Reglas Tier 3 inválidas (${errors.length}):\n- ${errors.slice(0, 40).join("\n- ")}`);
  console.log(`Verificación OK: 840 Ecos con baliza y retorno; 420 con desafío Atlas y 420 con regla local reversible; 0 flags globales nuevas.`);
}

if (!VERIFY_ONLY) {
  backup();
  install();
  console.log(`Reglas Tier 3 compiladas desde ${path.relative(ROOT, INPUT)}. Backup: ${path.relative(ROOT, BACKUP)}`);
}
verify();
