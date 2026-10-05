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
 * RETIRADO: la Expansión Multiversal sustituyó la cápsula por viaje dentro del
 * mundo (grietas, barco de Ciudad Carmín, espejo de Isla Canela). Esta
 * herramienta ya no instala nada: se queda para retirar los restos de la
 * cápsula en instalaciones antiguas y para verificar que el laboratorio
 * conserva solo sus transportadores originales.
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
const MULTIVERSE = fs.existsSync(path.join(ROOT, "content", "multiverse_creepypasta.json"))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"))
  : null;
const SILVER_ARRIVAL = MULTIVERSE?.maps?.find((entry) => entry.mapId === 2021)?.arrival ?? [17, 14];
const DESTINATIONS = [
  { label: "Isla Espejo", map: 997, x: 14, y: 10, dir: 2, arrival: "Este lugar... parece la Isla Espejo." },
  { label: "Bosque Susurrante", map: 1000, x: 35, y: 45, dir: 8, gate: HYPNO_STARTED, arrival: "Este lugar... parece un bosque que no figura en ningún mapa.", locked: "El guardabosques de Ciudad Verde conoce la canción que abre ese bosque. Acepta su misión y la señal quedará calibrada." },
  { label: "Puerto Horizonte", map: 1001, x: 34, y: 23, dir: 2, gate: HORIZONS_OPEN, arrival: "Este lugar... parece Puerto Horizonte.", locked: "Horizontes se abre cuando los niños del Bosque Susurrante vuelven a casa. Habla con el guardabosques después de calmar a Hypno." },
  { label: "Atlas Mil", map: 1021, x: 22, y: 9, dir: 2, gate: ATLAS_OPEN, arrival: "Este lugar... parece el primer eco del Atlas Mil.", locked: "El Cronista de Puerto Horizonte debe abrir el Atlas Mil antes de que esta cápsula pueda seguir su señal." },
  { label: "Monte Silver", map: 2021, x: SILVER_ARRIVAL[0], y: SILVER_ARRIVAL[1], dir: 2, arrival: "Este lugar... parece la falda del Monte Silver." },
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
    ...texts(["\\bAyudante: El profesor Oak me pidió calibrar un tercer transportador. Capta señales de lugares que no figuran en ningún mapa: Isla Espejo, el Bosque Susurrante, Puerto Horizonte, el Atlas Mil y el Monte Silver."]),
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
function retire() {
  const map = read(FILE);
  const events = iv(map, "events");
  const kept = events.pairs.filter(([, object]) => !txt(iv(object, "name")).startsWith(MARKER));
  const removed = events.pairs.length - kept.length;
  events.pairs = kept;
  write(FILE, map);
  return removed;
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
  const capsule = events.filter((entry) => entry.name.startsWith(MARKER));
  ok(capsule.length === 0, `la cápsula central nueva sigue instalada (${capsule.length} eventos)`);
  const originals = events.filter((entry) => !entry.name.startsWith(MARKER) && !entry.name.startsWith("PokeMod Oak:"));
  ok(originals.length === 26, `el laboratorio debe conservar sus 26 eventos originales (${originals.length})`);
  const originalDoors = events.filter((entry) => [15, 16].includes(entry.id));
  ok(originalDoors.length === 2 && originalDoors.every((entry) => entry.pages[1]?.condition?.switch1 === POSTGAME),
    "los transportadores originales ya no dependen del switch 429");
  const menus = events.filter((entry) => entry.name.startsWith("PokeMod"))
    .filter((entry) => entry.pages.some((page) => new Set(page.list.map(cmdOf)
      .filter((command) => command.code === 201).map((command) => Number(command.params[1]))).size > 1));
  ok(menus.length === 0, `el laboratorio no debe ofrecer menús de destinos (${menus.map((entry) => entry.name).join(", ")})`);
  const advisor = events.find((entry) => entry.name === "PokeMod Oak: Registro de Grietas");
  if (!advisor) console.log("Aviso: falta el Oak consejero. Instálalo con tools/apply_expansion_multiversal.mjs");
  else {
    ok(advisor.pages[1]?.condition?.switch1 === POSTGAME, "el Oak consejero debe depender del switch 429");
    ok(!advisor.pages.some((page) => page.list.map(cmdOf).some((command) => command.code === 201)),
      "Oak no teletransporta a nadie: solo aconseja");
    ok(openCell(parsed, advisor.x, advisor.y), `el Oak consejero está sobre una celda bloqueada (${advisor.x},${advisor.y})`);
  }
  if (errors.length) throw new Error(`Laboratorio de Oak inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: el laboratorio de Oak (mapa ${MAP_ID}) conserva sus 26 eventos originales,` +
    " sus dos transportadores de siempre, ningún menú de destinos y Oak como consejero.");
}

if (!VERIFY_ONLY) {
  backup();
  const removed = retire();
  console.log(`Cápsula central retirada del laboratorio de Oak (${removed} eventos menos).` +
    " El viaje multiversal ahora se descubre en el mundo. Backup: " + path.relative(ROOT, BACKUP));
}
verify();
