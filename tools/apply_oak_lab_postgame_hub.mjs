#!/usr/bin/env node
/**
 * Tercer transportador cuántico en el sótano del laboratorio de Oak.
 *
 * En Fire Ash, el postgame convencional empieza cuando Oak activa el switch
 * 429 = Postgame tras el regreso a casa posterior a Proyecto Mew. En ese
 * momento el sótano del laboratorio (mapa 48) habilita dos transportadores:
 * los Pokédex holders (evento 15) y la torre del Grandeur Club (evento 16).
 *
 * Este instalador añade, con la misma condición (switch 429) y las mismas
 * piezas gráficas de las cápsulas originales (tiles 1827/1828/1829/1839), un
 * tercer transportador que conduce a las expansiones PokeMod:
 *   - Isla Espejo (mapa 997);
 *   - Bosque Susurrante (mapa 1000), solo si la misión del guardabosques
 *     está aceptada (switch 701);
 *   - Puerto Horizonte (mapa 1001), solo si Horizontes está abierto (704);
 *   - Atlas Mil (mapa 1021), solo si el Cronista lo abrió (706).
 * Si una señal no está calibrada, la cápsula indica qué paso falta y no
 * teletransporta. Un ayudante de Oak explica el dispositivo.
 *
 * No se modifica ningún evento original del laboratorio ni los accesos ya
 * existentes en Pueblo Paleta y Ciudad Verde: solo se suman eventos nuevos
 * marcados con el prefijo "PokeMod Hub:". El instalador es idempotente.
 *
 * Uso:
 *   node tools/apply_oak_lab_postgame_hub.mjs            # instala y verifica
 *   node tools/apply_oak_lab_postgame_hub.mjs --verify   # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import { marshalDump, marshalLoad, RObject, RString, RUserDef } from "../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "oak_lab_hub_originals");
const MAP_ID = 48;
const FILE = `Map${String(MAP_ID).padStart(3, "0")}.rxdata`;
const MARKER = "PokeMod Hub:";
const POSTGAME = 429;
const HYPNO_STARTED = 701, HORIZONS_OPEN = 704, ATLAS_OPEN = 706;
const CHOICE_VARIABLE = 1; // La misma variable temporal que usan las cápsulas originales.
const POD = { left: [7, 15], pad: [8, 15], right: [9, 15], top: [9, 14] };
const AIDE = [11, 17];
const AIDE_SPRITE = "trchar029";
const DESTINATIONS = [
  { label: "Isla Espejo", map: 997, x: 14, y: 10, dir: 2, arrival: "Este lugar... parece la Isla Espejo." },
  { label: "Bosque Susurrante", map: 1000, x: 35, y: 45, dir: 8, gate: HYPNO_STARTED, arrival: "Este lugar... parece un bosque que no figura en ningún mapa.", locked: "El guardabosques de Ciudad Verde conoce la canción que abre ese bosque. Acepta su misión y la señal quedará calibrada." },
  { label: "Puerto Horizonte", map: 1001, x: 34, y: 23, dir: 2, gate: HORIZONS_OPEN, arrival: "Este lugar... parece Puerto Horizonte.", locked: "Horizontes se abre cuando los niños del Bosque Susurrante vuelven a casa. Habla con el guardabosques después de calmar a Hypno." },
  { label: "Atlas Mil", map: 1021, x: 22, y: 9, dir: 2, gate: ATLAS_OPEN, arrival: "Este lugar... parece el primer eco del Atlas Mil.", locked: "El Cronista de Puerto Horizonte debe abrir el Atlas Mil antes de que esta cápsula pueda seguir su señal." },
];

const S = (value) => RString.fromText(String(value));
const iv = (object, name) => object?.getIvar?.(name);
const txt = (value) => value instanceof RString ? value.text : String(value ?? "");
const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));

function cmd(code, parameters = [], indent = 0) { return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", parameters]]); }
function condition(sw = 0) { return new RObject("RPG::Event::Page::Condition", [["@switch1_valid", Boolean(sw)], ["@switch1_id", sw || 1], ["@switch2_valid", false], ["@switch2_id", 1], ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0], ["@self_switch_valid", false], ["@self_switch_ch", S("A")]]); }
function graphic({ tile = 0, name = "" } = {}) { return new RObject("RPG::Event::Page::Graphic", [["@tile_id", tile], ["@character_name", S(name)], ["@character_hue", 0], ["@direction", 2], ["@pattern", 0], ["@opacity", 255], ["@blend_type", 0]]); }
function route() { return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", [new RObject("RPG::MoveCommand", [["@code", 0], ["@parameters", []]])]]]); }
function page({ cond = condition(), gfx = graphic(), list = [cmd(0)] } = {}) { return new RObject("RPG::Event::Page", [["@condition", cond], ["@graphic", gfx], ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3], ["@move_route", route()], ["@walk_anime", true], ["@step_anime", false], ["@direction_fix", false], ["@through", false], ["@always_on_top", false], ["@trigger", 0], ["@list", list]]); }
function event(id, name, [x, y], pages) { return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]); }
function tone(red, green, blue, gray = 0) {
  const buffer = Buffer.alloc(32);
  [red, green, blue, gray].forEach((value, index) => buffer.writeDoubleLE(value, index * 8));
  return new RUserDef("Tone", Uint8Array.from(buffer));
}
function wrap(input, max = 43) { const output = []; for (const paragraph of String(input).split("\n")) { let line = ""; for (const word of paragraph.split(/\s+/).filter(Boolean)) { if (!line) line = word; else if (`${line} ${word}`.length <= max) line += ` ${word}`; else { output.push(line); line = word; } } if (line) output.push(line); } return output.length ? output : ["..."]; }
function texts(lines, indent = 0) { const all = (Array.isArray(lines) ? lines : [lines]).flatMap((line) => wrap(line)); return [cmd(101, [S(all[0])], indent), ...all.slice(1).map((line) => cmd(401, [S(line)], indent))]; }
function rawText(line, indent = 0) { return [cmd(101, [S(line)], indent)]; }
function travel(destination, indent) {
  return [
    cmd(223, [tone(-255, -255, -255), 6], indent),
    cmd(106, [8], indent),
    cmd(201, [0, destination.map, destination.x, destination.y, destination.dir, 1], indent),
    cmd(223, [tone(0, 0, 0), 6], indent),
    ...texts([destination.arrival], indent),
  ];
}
function podCommands() {
  const labels = [...DESTINATIONS.map((entry) => entry.label), "No"];
  const list = [
    ...rawText("[SISTEMA ACTIVÁNDOSE........]"),
    ...rawText("[SEÑALES DE OTROS HORIZONTES DETECTADAS]"),
    ...rawText(`¿Teletransportar?\\ch[${CHOICE_VARIABLE},${labels.length},${labels.join(",")}]`),
  ];
  DESTINATIONS.forEach((destination, index) => {
    list.push(cmd(111, [1, CHOICE_VARIABLE, 0, index, 0]));
    if (destination.gate) {
      list.push(cmd(111, [0, destination.gate, 0], 1));
      list.push(...travel(destination, 2), cmd(0, [], 2));
      list.push(cmd(411, [], 1));
      list.push(...rawText("[SEÑAL SIN CALIBRAR]", 2), ...texts([destination.locked], 2), cmd(0, [], 2));
      list.push(cmd(412, [], 1));
    } else {
      list.push(...travel(destination, 1));
    }
    list.push(cmd(0, [], 1), cmd(412));
  });
  list.push(cmd(0));
  return list;
}
function aideCommands() {
  return [
    ...texts(["\\bAyudante: El profesor Oak me pidió calibrar un tercer transportador. Capta señales de lugares que no figuran en ningún mapa: Isla Espejo, el Bosque Susurrante, Puerto Horizonte y el Atlas Mil."]),
    ...texts(["\\bAlgunas señales solo se estabilizan después de ciertos sucesos. Si la cápsula indica que falta calibración, sigue la pista que te dé."]),
    ...texts(["\\bAh, y la Mochila responde con normalidad en todos esos destinos... también dentro de la torre del Grandeur Club. Hitsukid todavía no lo sabe."]),
    cmd(0),
  ];
}
function additions() {
  const piece = (id, label, position, tile) => event(id, `${MARKER} ${label}`, position, [page(), page({ cond: condition(POSTGAME), gfx: graphic({ tile }) })]);
  return [
    piece(301, "Cápsula izquierda", POD.left, 1827),
    event(302, `${MARKER} Transportador`, POD.pad, [page(), page({ cond: condition(POSTGAME), gfx: graphic({ tile: 1828 }), list: podCommands() })]),
    piece(303, "Cápsula derecha", POD.right, 1829),
    piece(304, "Cápsula superior", POD.top, 1839),
    event(305, `${MARKER} Ayudante`, AIDE, [page(), page({ cond: condition(POSTGAME), gfx: graphic({ name: AIDE_SPRITE }), list: aideCommands() })]),
  ];
}

function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  const target = path.join(BACKUP, FILE);
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(DATA, FILE), target);
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), "Map048.rxdata anterior al tercer transportador del laboratorio de Oak. Restaura este archivo sobre Data/ para revertirlo.\n");
}
function install() {
  const map = read(FILE);
  const events = iv(map, "events");
  const originals = events.pairs.filter(([, object]) => !txt(iv(object, "name")).startsWith(MARKER));
  const occupied = new Set(originals.map(([, object]) => `${iv(object, "x")},${iv(object, "y")}`));
  const ids = new Set(originals.map(([id]) => Number(id)));
  for (const object of additions()) {
    const key = `${iv(object, "x")},${iv(object, "y")}`;
    if (occupied.has(key)) throw new Error(`La celda ${key} ya tiene un evento original`);
    if (ids.has(Number(iv(object, "id")))) throw new Error(`El ID ${iv(object, "id")} ya pertenece a un evento original`);
  }
  events.pairs = [...originals, ...additions().map((object) => [Number(iv(object, "id")), object])];
  write(FILE, map);
}

const tilesetsRaw = read("Tilesets.rxdata"), tilesets = new Map();
for (let index = 1; index < tilesetsRaw.length; index++) if (tilesetsRaw[index]) { const parsed = parseTileset(tilesetsRaw[index]); tilesets.set(parsed.id, parsed); }
function openCell(parsed, x, y) {
  const tileset = tilesets.get(parsed.tilesetId);
  if (x < 0 || y < 0 || x >= parsed.width || y >= parsed.height) return false;
  let bits = 0;
  for (let z = 0; z < parsed.table.z; z++) { const tile = tableGet(parsed.table, x, y, z); if (tile > 0 && tile < tileset.passages.data.length) bits |= tileset.passages.data[tile] & 15; }
  return bits === 0;
}
function verify() {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };
  const parsed = parseMap(read(FILE));
  const events = parsed.events.map(({ obj }) => parseEvent(obj));
  const added = events.filter((entry) => entry.name.startsWith(MARKER));
  ok(added.length === 5, `hay ${added.length}/5 eventos del hub`);
  ok(events.filter((entry) => !entry.name.startsWith(MARKER)).length === 26, "el laboratorio perdió o ganó eventos originales");
  const originalDoors = events.filter((entry) => [15, 16].includes(entry.id));
  ok(originalDoors.length === 2 && originalDoors.every((entry) => entry.pages[1]?.condition?.switch1 === POSTGAME), "los transportadores originales ya no dependen del switch 429");
  for (const entry of added) {
    ok(entry.pages.length === 2 && entry.pages[1].condition?.switch1 === POSTGAME && !entry.pages[0].condition?.switch1, `${entry.name}: debe depender del switch 429 igual que las cápsulas originales`);
    ok(!entry.pages[0].graphic?.tileId && !entry.pages[0].graphic?.charName, `${entry.name}: debe ser invisible antes del postgame`);
    ok(openCell(parsed, entry.x, entry.y), `${entry.name}: colocado sobre una celda bloqueada (${entry.x},${entry.y})`);
  }
  const pad = added.find((entry) => entry.name.endsWith("Transportador"));
  const commands = pad ? pad.pages[1].list.map(cmdOf) : [];
  const transfers = commands.filter((entry) => entry.code === 201);
  ok(transfers.length === DESTINATIONS.length, `la cápsula tiene ${transfers.length}/${DESTINATIONS.length} teletransportes`);
  for (const destination of DESTINATIONS) {
    const transfer = transfers.find((entry) => Number(entry.params[1]) === destination.map);
    ok(transfer, `falta el destino ${destination.label}`);
    if (!transfer) continue;
    const target = parseMap(read(`Map${String(destination.map).padStart(3, "0")}.rxdata`));
    ok(openCell(target, Number(transfer.params[2]), Number(transfer.params[3])), `${destination.label}: llegada bloqueada en (${transfer.params[2]},${transfer.params[3]})`);
    if (destination.gate) ok(commands.some((entry) => entry.code === 111 && Number(entry.params[0]) === 0 && Number(entry.params[1]) === destination.gate), `${destination.label}: falta la comprobación del switch ${destination.gate}`);
  }
  const ruby = commands.filter((entry) => [111, 355, 655].includes(entry.code)).map((entry) => txt(entry.params[entry.code === 111 ? 1 : 0])).join("\n");
  ok(!/674|675/.test(ruby) && !commands.some((entry) => entry.code === 121 && Number(entry.params[0]) <= 675 && Number(entry.params[1]) >= 674), "la cápsula no debe tocar los switches 674/675");
  ok(commands.some((entry) => entry.code === 101 && txt(entry.params[0]).includes(`\\ch[${CHOICE_VARIABLE},`)), "la cápsula no usa el menú de destinos");
  const infos = read("MapInfos.rxdata");
  for (const destination of DESTINATIONS) ok(infos.pairs.some(([key]) => Number(key) === destination.map), `MapInfos no registra ${destination.map}`);
  if (errors.length) throw new Error(`Hub del laboratorio inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: tercer transportador en el laboratorio de Oak (mapa ${MAP_ID}) con ${DESTINATIONS.length} destinos condicionados por el switch ${POSTGAME}, 26 eventos originales intactos y llegadas transitables.`);
}

if (!VERIFY_ONLY) {
  backup();
  install();
  console.log(`Hub postgame instalado en ${FILE}. Backup: ${path.relative(ROOT, BACKUP)}`);
}
verify();
