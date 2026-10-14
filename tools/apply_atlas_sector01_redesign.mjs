#!/usr/bin/env node
/** Instala/verifica el piloto gradual del Sector 1: Meridiano Ámbar. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad, RHash, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { generateAtlasSector01Assets } from "./lib/atlas_sector01_art.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const CONFIG_FILE = path.join(ROOT, "content", "atlas_sector01_redesign.json");
const BACKUP = path.join(GAME, "PokeModBackups", "atlas_sector01_redesign_originals");
const VERIFY_ONLY = process.argv.includes("--verify");
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const MAPS = new Map(CONFIG.maps.map((entry) => [Number(entry.id), entry.name]));
const SPECIES_ID = CONFIG.species.id;
const SCENE_PROPS = CONFIG.interactions.filter((entry) => entry.kind === "scene-prop");
const EVENT_ASSETS = new Set(CONFIG.assets.eventSprites);
const CHARACTER_DIR = path.join(GAME, "Graphics", "Characters");
const ORIGINAL_ATLAS_MAP_NAMES = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8")).maps.map((entry) => [Number(entry.newId), entry.name]));
const mapDisplayName = (mapId) => MAPS.get(Number(mapId)) || ORIGINAL_ATLAS_MAP_NAMES.get(Number(mapId)) || `Mapa ${mapId}`;
const CONTENT_FILES = [
  "content/atlas_mil_500.json",
  "content/atlas_content_hierarchy.json",
  "docs/500_EVENTOS_Y_PELEAS_ATLAS_MIL.md",
];
const MAP_FILES = [...MAPS.keys()].map((id) => `Map${id}.rxdata`);
const GAME_FILES = [...MAP_FILES, "MapInfos.rxdata", "Map1001.rxdata", "species.dat"];

const S = (value) => RString.fromText(String(value));
const Sym = (value) => new RSymbol(String(value));
const iv = (object, name) => object?.getIvar?.(name);
const txt = (value) => value instanceof RString ? value.text : String(value ?? "");
const sym = (value) => value instanceof RSymbol ? value.name : String(value ?? "");
const pad = (value) => String(value).padStart(3, "0");
const readRx = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const writeRx = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
const cloneMarshal = (value) => marshalLoad(Buffer.from(marshalDump(value)));

function cmd(code, parameters = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", parameters]]);
}
function eventCondition(selfSwitch = "") {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", false], ["@switch1_id", 1],
    ["@switch2_valid", false], ["@switch2_id", 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", Boolean(selfSwitch)], ["@self_switch_ch", S(selfSwitch || "A")],
  ]);
}
function eventGraphic(name, direction = 2, pattern = 1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", 0], ["@character_name", S(name)], ["@character_hue", 0],
    ["@direction", direction], ["@pattern", pattern], ["@opacity", 255], ["@blend_type", 0],
  ]);
}
function moveRoute() {
  return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", [new RObject("RPG::MoveCommand", [["@code", 0], ["@parameters", []]])]]]);
}
function eventPage({ graphic = eventGraphic(""), condition = eventCondition(), list = [cmd(0)], stepAnime = false } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", condition], ["@graphic", graphic], ["@move_type", 0],
    ["@move_speed", 3], ["@move_frequency", 3], ["@move_route", moveRoute()],
    ["@walk_anime", true], ["@step_anime", stepAnime], ["@direction_fix", true],
    ["@through", true], ["@always_on_top", false], ["@trigger", 0], ["@list", list],
  ]);
}
function eventObject(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}
function wrap(text, max = 43) {
  const output = [];
  for (const paragraph of String(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if (`${line} ${word}`.length <= max) line += ` ${word}`;
      else { output.push(line); line = word; }
    }
    if (line) output.push(line);
  }
  return output.length ? output : ["…"];
}
function textCommands(lines, indent = 0) {
  const wrapped = (Array.isArray(lines) ? lines : [lines]).flatMap((line) => wrap(line));
  return [cmd(101, [S("")], indent), ...wrapped.map((line) => cmd(401, [S(line)], indent))];
}
function textList(lines) { return [...textCommands(lines), cmd(0)]; }
function setGraphic(page, name) {
  const graphic = iv(page, "graphic");
  if (graphic) {
    graphic.setIvar("tile_id", 0);
    graphic.setIvar("character_name", S(name));
  }
}
function setFirstDialogue(page, message) {
  const list = iv(page, "list") || [];
  let replaced = false;
  for (const command of list) {
    const code = Number(iv(command, "code"));
    if (code !== 401) continue;
    const parameters = iv(command, "parameters") || [];
    parameters[0] = S(message);
    replaced = true;
    break;
  }
  if (!replaced) throw new Error(`No se encontró línea de diálogo en el evento ${message}`);
}
function eventCommands(event) {
  return (iv(event, "pages") || []).flatMap((page) => iv(page, "list") || []);
}
function backup() {
  fs.mkdirSync(path.join(BACKUP, "content"), { recursive: true });
  for (const file of GAME_FILES) {
    const source = path.join(DATA, file);
    const target = path.join(BACKUP, file);
    if (fs.existsSync(source) && !fs.existsSync(target)) fs.copyFileSync(source, target);
  }
  for (const relative of CONTENT_FILES) {
    const source = path.join(ROOT, relative);
    const target = path.join(BACKUP, "content", path.basename(relative));
    if (fs.existsSync(source) && !fs.existsSync(target)) fs.copyFileSync(source, target);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), [
    "Copia de los datos originales antes del piloto gradual del Sector 1.",
    "Para revertir los mapas, MapInfos.rxdata y species.dat, restaura los RXDATA desde esta carpeta sobre pokemon_fire_ash/Data/.",
    "Los PNG añadidos por el piloto son assets nuevos; al revertir, elimina solo los nombres listados en content/atlas_sector01_redesign.json.",
    "Las copias de los catálogos/documentación están en la subcarpeta content/.",
    "",
  ].join("\n"));
}

function statsHash(values) {
  return new RHash(Object.entries(values).map(([key, value]) => [Sym(key), value]));
}
function findRecordBySymbol(data, name) {
  return data.pairs.find(([key]) => key instanceof RSymbol && key.name === name)?.[1];
}
function createAuralumeRecord(speciesData) {
  const template = findRecordBySymbol(speciesData, "CHIMECHO");
  if (!template) throw new Error("No se encontró CHIMECHO como plantilla segura para el nuevo registro.");
  const record = cloneMarshal(template);
  const species = CONFIG.species;
  record.setIvar("id", Sym(SPECIES_ID));
  record.setIvar("id_number", species.number);
  record.setIvar("species", Sym(SPECIES_ID));
  record.setIvar("form", 0);
  record.setIvar("real_name", S(species.name));
  record.setIvar("real_form_name", null);
  record.setIvar("real_category", S(species.category));
  record.setIvar("real_pokedex_entry", S(species.pokedexEntry));
  record.setIvar("pokedex_form", 0);
  record.setIvar("type1", Sym(species.types[0]));
  record.setIvar("type2", Sym(species.types[1]));
  record.setIvar("base_stats", statsHash(species.baseStats));
  record.setIvar("evs", statsHash({ HP: 0, ATTACK: 0, DEFENSE: 0, SPECIAL_ATTACK: 0, SPECIAL_DEFENSE: 0, SPEED: 1 }));
  record.setIvar("base_exp", 65);
  record.setIvar("growth_rate", Sym("Medium"));
  record.setIvar("gender_ratio", Sym("Genderless"));
  record.setIvar("catch_rate", 180);
  record.setIvar("happiness", 70);
  record.setIvar("moves", [
    [1, Sym("GROWL")], [1, Sym("THUNDERSHOCK")], [4, Sym("CONFUSION")],
    [7, Sym("THUNDERWAVE")], [10, Sym("ECHOEDVOICE")], [14, Sym("CHARGE")],
    [18, Sym("PSYBEAM")], [22, Sym("DISCHARGE")], [27, Sym("CALMMIND")],
    [32, Sym("PSYCHIC")], [38, Sym("DAZZLINGGLEAM")], [44, Sym("THUNDERBOLT")],
  ]);
  record.setIvar("tutor_moves", ["CHARGEBEAM", "DAZZLINGGLEAM", "LIGHTSCREEN", "PSYCHIC", "SHADOWBALL", "THUNDERBOLT", "THUNDERWAVE"].map(Sym));
  record.setIvar("egg_moves", ["DISARMINGVOICE", "SIGNALBEAM", "WISH"].map(Sym));
  record.setIvar("abilities", species.abilities.map(Sym));
  record.setIvar("hidden_abilities", species.hiddenAbilities.map(Sym));
  record.setIvar("wild_item_common", null);
  record.setIvar("wild_item_uncommon", null);
  record.setIvar("wild_item_rare", null);
  record.setIvar("egg_groups", [Sym("Amorphous")]);
  record.setIvar("hatch_steps", 5120);
  record.setIvar("incense", null);
  record.setIvar("evolutions", []);
  record.setIvar("height", species.height);
  record.setIvar("weight", species.weight);
  record.setIvar("color", Sym("Yellow"));
  record.setIvar("shape", Sym("Winged"));
  record.setIvar("habitat", Sym("Grassland"));
  record.setIvar("generation", 9);
  record.setIvar("mega_stone", null);
  record.setIvar("mega_move", null);
  record.setIvar("unmega_form", 0);
  record.setIvar("mega_message", 0);
  record.setIvar("front_sprite_x", 0);
  record.setIvar("front_sprite_y", 12);
  record.setIvar("front_sprite_altitude", 0);
  record.setIvar("front_sprite_scale", 2);
  record.setIvar("back_sprite_x", 0);
  record.setIvar("back_sprite_y", 54);
  record.setIvar("back_sprite_scale", 3);
  record.setIvar("shadow_x", 0);
  record.setIvar("shadow_size", 2);
  record.setIvar("gmax_height", null);
  record.setIvar("real_gmax_name", null);
  record.setIvar("real_gmax_dex", null);
  record.setIvar("no_dynamax", false);
  return record;
}
function installSpecies() {
  const speciesData = readRx("species.dat");
  const numeric = speciesData.pairs.filter(([key]) => typeof key === "number").map(([key]) => Number(key));
  const currentRecord = findRecordBySymbol(speciesData, SPECIES_ID);
  const numericEntry = speciesData.pairs.find(([key]) => Number(key) === CONFIG.species.number);
  if (!currentRecord && numericEntry) throw new Error(`El número de especie ${CONFIG.species.number} ya está ocupado.`);
  if (!currentRecord && Math.max(0, ...numeric) + 1 !== CONFIG.species.number) {
    throw new Error(`El siguiente número de especie esperado no es ${CONFIG.species.number}.`);
  }
  const record = createAuralumeRecord(speciesData);
  const symbolEntry = speciesData.pairs.find(([key]) => key instanceof RSymbol && key.name === SPECIES_ID);
  const numberEntry = speciesData.pairs.find(([key]) => typeof key === "number" && key === CONFIG.species.number);
  if (symbolEntry) symbolEntry[1] = record;
  else speciesData.pairs.push([Sym(SPECIES_ID), record]);
  if (numberEntry) numberEntry[1] = record;
  else speciesData.pairs.push([CONFIG.species.number, record]);
  writeRx("species.dat", speciesData);
}

function updateAuthoredCatalogues() {
  const cataloguePath = path.join(ROOT, "content", "atlas_mil_500.json");
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
  const previousNames = new Map();
  for (const map of catalogue.maps) {
    if (!MAPS.has(Number(map.newId))) continue;
    previousNames.set(Number(map.newId), map.name);
    map.name = MAPS.get(Number(map.newId));
  }
  for (const suggestion of catalogue.suggestions) {
    const mapId = Number(suggestion.mapId);
    if (!MAPS.has(mapId)) continue;
    const oldName = previousNames.get(mapId) || suggestion.mapName;
    const newName = MAPS.get(mapId);
    suggestion.title = String(suggestion.title).replaceAll(oldName, newName);
    suggestion.hook = String(suggestion.hook).replaceAll(oldName, newName);
    suggestion.mapName = newName;
  }
  fs.writeFileSync(cataloguePath, `${JSON.stringify(catalogue, null, 2)}\n`);

  const hierarchyPath = path.join(ROOT, "content", "atlas_content_hierarchy.json");
  const hierarchy = JSON.parse(fs.readFileSync(hierarchyPath, "utf8"));
  for (const map of hierarchy.maps) if (MAPS.has(Number(map.mapId))) map.mapName = MAPS.get(Number(map.mapId));
  fs.writeFileSync(hierarchyPath, `${JSON.stringify(hierarchy, null, 2)}\n`);

  const docPath = path.join(ROOT, "docs", "500_EVENTOS_Y_PELEAS_ATLAS_MIL.md");
  if (fs.existsSync(docPath)) {
    let markdown = fs.readFileSync(docPath, "utf8");
    for (const [mapId, newName] of MAPS) {
      const oldName = previousNames.get(mapId);
      if (oldName) markdown = markdown.replaceAll(oldName, newName);
    }
    fs.writeFileSync(docPath, markdown);
  }
}

function updateMapInfos() {
  const infos = readRx("MapInfos.rxdata");
  for (const [id, name] of MAPS) {
    const record = infos.pairs.find(([key]) => Number(key) === id)?.[1];
    if (!record) throw new Error(`MapInfos.rxdata no contiene el mapa ${id}.`);
    record.setIvar("name", S(name));
  }
  writeRx("MapInfos.rxdata", infos);
}

const tilesetsRaw = readRx("Tilesets.rxdata");
const tilesets = new Map();
for (let i = 1; i < tilesetsRaw.length; i++) if (tilesetsRaw[i]) {
  const tileset = parseTileset(tilesetsRaw[i]);
  tilesets.set(tileset.id, tileset);
}
function openCell(parsed, x, y) {
  const tileset = tilesets.get(parsed.tilesetId);
  if (!tileset || x < 1 || y < 1 || x >= parsed.width - 1 || y >= parsed.height - 1) return false;
  let passage = 0;
  for (let z = 0; z < parsed.table.z; z++) {
    const tile = tableGet(parsed.table, x, y, z);
    if (tile > 0 && tile < tileset.passages.data.length) passage |= tileset.passages.data[tile] & 15;
  }
  return passage === 0;
}
function interactionDialogue(mapId) {
  const name = MAPS.get(mapId);
  if (mapId === 1021) return [
    "ANCLA ARTESANAL · Pueblo Campanario.",
    "Sector 1: Meridiano Ámbar.",
    "Una emisión conoce recuerdos que nadie contó.",
    "La Campana de Alba sincroniza las balizas del sector.",
  ];
  if ([1026, 1033, 1040].includes(mapId)) return [
    `RUTA ESTABLE · ${name}.`,
    "Sector 1: Meridiano Ámbar.",
    "La red de señales conecta historias locales con rutas abiertas.",
    "Puedes volver al puerto o seguir el siguiente tramo cuando quieras.",
  ];
  return [
    `REGISTRO DE CAMPO · ${name}.`,
    "Sector 1: Meridiano Ámbar.",
    "Una señal propia mantiene el sendero conectado con la región.",
    "Los Ecos son opcionales; regresar o avanzar no consume el registro.",
  ];
}
function navigationMessage(eventName, currentId) {
  const currentName = mapDisplayName(currentId);
  if (eventName.startsWith("Return")) return `El arco de retorno conecta ${currentName} con Puerto Horizonte.`;
  if (eventName.startsWith("Previous")) return `El umbral enlaza ${currentName} con ${mapDisplayName(currentId - 1)}.`;
  if (eventName.startsWith("Next")) return `El sendero continúa desde ${currentName} hacia ${mapDisplayName(currentId + 1)}.`;
  return `La señal de ${currentName} se sincroniza con Puerto Horizonte.`;
}
function resolvePokemonSprite(speciesId, speciesData) {
  const record = findRecordBySymbol(speciesData, speciesId);
  const base = record ? sym(iv(record, "species")) : speciesId;
  for (const candidate of [speciesId, base]) {
    if (candidate && fs.existsSync(path.join(CHARACTER_DIR, `${candidate}.png`))) return candidate;
  }
  return "Atlas Echo Shard 01";
}
function installMapEvents(mapId, speciesData, challengeByMap) {
  const filename = `Map${pad(mapId)}.rxdata`;
  const mapObject = readRx(filename);
  const eventsHash = iv(mapObject, "events");
  const challenge = challengeByMap.get(mapId);
  for (const [, event] of eventsHash.pairs) {
    const name = txt(iv(event, "name"));
    if (name.startsWith("Return to Puerto Horizonte")) {
      for (const page of iv(event, "pages") || []) {
        setGraphic(page, "Atlas Gate Home");
        setFirstDialogue(page, navigationMessage(name, mapId));
      }
    } else if (name === "Previous Atlas Map") {
      for (const page of iv(event, "pages") || []) {
        setGraphic(page, "Atlas Gate Previous");
        setFirstDialogue(page, navigationMessage(name, mapId));
      }
    } else if (name === "Next Atlas Map") {
      for (const page of iv(event, "pages") || []) {
        setGraphic(page, "Atlas Gate Next");
        setFirstDialogue(page, navigationMessage(name, mapId));
      }
    } else if (name.includes("Beacon") || name.startsWith("Baliza Atlas")) {
      for (const page of iv(event, "pages") || []) {
        setGraphic(page, "Atlas Wayfinder 01");
        iv(page, "list").splice(0, iv(page, "list").length, ...textList(interactionDialogue(mapId)));
      }
    } else if (name.startsWith("PokeMod Tier3:")) {
      const pages = iv(event, "pages") || [];
      if (pages[0]) setGraphic(pages[0], "Atlas Echo Stone 01");
      if (pages[1]) setGraphic(pages[1], "Atlas Echo Shard 01");
    } else if (name.startsWith("Atlas desafío") && challenge?.category === "pokemon_elite") {
      const sprite = resolvePokemonSprite(challenge.pokemon, speciesData);
      for (const page of iv(event, "pages") || []) setGraphic(page, sprite);
    } else {
      for (const page of iv(event, "pages") || []) {
        const graphic = iv(page, "graphic");
        if (txt(iv(graphic, "character_name")) === "Object ball special") setGraphic(page, "Atlas Echo Shard 01");
      }
    }
  }
  for (const interaction of CONFIG.interactions) {
    if (mapId === Number(interaction.mapId)) installInteraction(mapObject, interaction);
  }
  writeRx(filename, mapObject);
}
function installInteraction(mapObject, interaction) {
  const eventsHash = iv(mapObject, "events");
  const marker = interaction.kind === "scene-prop" ? interaction.name : CONFIG.species.name;
  const eventName = `PokeMod Meridiano Ámbar: ${marker}`;
  const sameId = eventsHash.pairs.find(([id]) => Number(id) === Number(interaction.eventId));
  if (sameId && txt(iv(sameId[1], "name")) !== eventName) throw new Error(`El id ${interaction.eventId} ya pertenece a ${txt(iv(sameId[1], "name"))} en el mapa ${interaction.mapId}.`);
  const retained = eventsHash.pairs.filter(([, event]) => txt(iv(event, "name")) !== eventName);
  const occupiedIds = new Set(retained.map(([id]) => Number(id)));
  if (occupiedIds.has(Number(interaction.eventId))) throw new Error(`El id ${interaction.eventId} está ocupado en el mapa ${interaction.mapId}.`);
  eventsHash.pairs = retained;
  const parsed = parseMap(mapObject);
  const [x, y] = interaction.position.map(Number);
  if (!openCell(parsed, x, y)) throw new Error(`${marker} no puede colocarse en una celda transitable (${interaction.mapId}: ${x},${y}).`);
  if (parsed.events.some(({ obj }) => Number(iv(obj, "x")) === x && Number(iv(obj, "y")) === y)) throw new Error(`${marker} comparte coordenadas con otro evento (${interaction.mapId}: ${x},${y}).`);

  if (interaction.kind === "scene-prop") {
    const list = [...textCommands(interaction.dialogue), cmd(0)];
    eventsHash.pairs.push([Number(interaction.eventId), eventObject(Number(interaction.eventId), eventName, x, y, [eventPage({ graphic: eventGraphic(interaction.sprite), list })])]);
    return;
  }

  const [approach, leave] = interaction.dialogue;
  const encounter = [
    ...textCommands([approach, leave]),
    cmd(102, [[S("Acercarse"), S("Dejarla tranquila")], 2]),
    cmd(402, [0, S("Acercarse")]),
    cmd(355, [S('setBattleRule("canLose")')]),
    cmd(355, [S(`p=Pokemon.new(:${SPECIES_ID},${interaction.level})`)]),
    cmd(355, [S("d=pbWildBattleCore(p)")]),
    cmd(111, [12, S("d==1 || d==4")]),
    cmd(123, [S("A"), 0], 1),
    cmd(411),
    ...textCommands(["Auralume conserva su libertad y vuelve a esconderse entre la hierba."], 1),
    cmd(412),
    cmd(402, [1, S("Dejarla tranquila")]),
    ...textCommands(["La criatura inclina su aro luminoso. Puedes volver cuando estés listo."], 1),
    cmd(404),
    cmd(0),
  ];
  const after = [...textCommands(["El destello de Auralume se apaga; su rastro queda registrado en la baliza."]), cmd(0)];
  eventsHash.pairs.push([Number(interaction.eventId), eventObject(Number(interaction.eventId), eventName, x, y, [
    eventPage({ graphic: eventGraphic(interaction.sprite), list: encounter, stepAnime: true }),
    eventPage({ condition: eventCondition("A"), graphic: eventGraphic("Atlas Echo Shard 01"), list: after }),
  ])]);
}

function patchHubSectorDoor() {
  const hub = readRx("Map1001.rxdata");
  const events = iv(hub, "events");
  const door = events.pairs.find(([, event]) => txt(iv(event, "name")) === "PokeMod Atlas Mil: Sector 1")?.[1];
  if (!door) throw new Error("No se encontró la puerta del Sector 1 en Map1001.");
  for (const page of iv(door, "pages") || []) {
    setGraphic(page, "Atlas Gate Sector 01");
    setFirstDialogue(page, "Arco ámbar: Meridiano Ámbar. Primer destino: Pueblo Campanario.");
  }
  writeRx("Map1001.rxdata", hub);
}

function install() {
  backup();
  generateAtlasSector01Assets();
  installSpecies();
  updateAuthoredCatalogues();
  updateMapInfos();

  const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8"));
  const challengeByMap = new Map(catalogue.suggestions.map((entry) => [Number(entry.mapId), entry]));
  const speciesData = readRx("species.dat");
  for (const mapId of MAPS.keys()) installMapEvents(mapId, speciesData, challengeByMap);
  patchHubSectorDoor();
}

function verify() {
  const errors = [];
  const ok = (condition, message) => { if (!condition) errors.push(message); };
  const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8"));
  const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
  const challengeByMap = new Map(catalogue.suggestions.map((entry) => [Number(entry.mapId), entry]));
  const speciesData = readRx("species.dat");
  const auralume = findRecordBySymbol(speciesData, SPECIES_ID);
  const numericRecord = speciesData.pairs.find(([key]) => Number(key) === CONFIG.species.number)?.[1];
  ok(Boolean(auralume), "species.dat no registra AURALUME");
  ok(Number(iv(auralume, "id_number")) === CONFIG.species.number, "id_number de AURALUME no coincide con el catálogo");
  ok(sym(iv(auralume, "type1")) === "ELECTRIC" && sym(iv(auralume, "type2")) === "PSYCHIC", "tipos de AURALUME incorrectos");
  ok(Number(iv(auralume, "base_stats")?.get?.(Sym("SPEED"), (a, b) => sym(a) === sym(b))) === 90, "estadística de velocidad de AURALUME incorrecta");
  ok(Boolean(numericRecord) && sym(iv(numericRecord, "id")) === SPECIES_ID, "species.dat no enlaza el número 1296 con AURALUME");
  const moves = new Set(readRx("moves.dat").pairs.filter(([key]) => key instanceof RSymbol).map(([key]) => key.name));
  const abilities = new Set(readRx("abilities.dat").pairs.filter(([key]) => key instanceof RSymbol).map(([key]) => key.name));
  const moveGroups = [
    ["learnset", (iv(auralume, "moves") || []).map(([, move]) => move)],
    ["tutor", iv(auralume, "tutor_moves") || []],
    ["huevo", iv(auralume, "egg_moves") || []],
  ];
  for (const [kind, entries] of moveGroups) {
    for (const move of entries) ok(moves.has(sym(move)), `movimiento inexistente en AURALUME (${kind}): ${sym(move)}`);
  }
  for (const [kind, entries] of [["normal", iv(auralume, "abilities") || []], ["oculta", iv(auralume, "hidden_abilities") || []]]) {
    for (const ability of entries) ok(abilities.has(sym(ability)), `habilidad inexistente en AURALUME (${kind}): ${sym(ability)}`);
  }

  for (const [relative, dimensions] of [
    ["Graphics/Characters/AURALUME.png", [256, 256]],
    ["Graphics/Pokemon/Front/AURALUME.png", [96, 96]],
    ["Graphics/Pokemon/Back/AURALUME.png", [96, 96]],
    ["Graphics/Pokemon/Front shiny/AURALUME.png", [96, 96]],
    ["Graphics/Pokemon/Back shiny/AURALUME.png", [96, 96]],
    ["Graphics/Pokemon/Icons/AURALUME.png", [128, 64]],
    ["Graphics/Pokemon/Icons shiny/AURALUME.png", [128, 64]],
    ["Graphics/Pokemon/Footprints/AURALUME.png", [32, 32]],
  ]) {
    const file = path.join(GAME, relative);
    if (!fs.existsSync(file)) { errors.push(`falta asset ${relative}`); continue; }
    const header = fs.readFileSync(file);
    const width = header.length >= 24 ? header.readUInt32BE(16) : 0;
    const height = header.length >= 24 ? header.readUInt32BE(20) : 0;
    ok(width === dimensions[0] && height === dimensions[1], `${relative}: dimensiones ${width}x${height}, esperadas ${dimensions.join("x")}`);
  }
  for (const name of EVENT_ASSETS) ok(fs.existsSync(path.join(CHARACTER_DIR, `${name}.png`)), `falta sprite contextual ${name}`);

  const infos = readRx("MapInfos.rxdata");
  for (const [mapId, name] of MAPS) {
    const info = infos.pairs.find(([key]) => Number(key) === mapId)?.[1];
    ok(txt(iv(info, "name")) === name, `MapInfos no muestra el nuevo nombre del mapa ${mapId}`);
    ok(catalogue.maps.some((entry) => Number(entry.newId) === mapId && entry.name === name), `catálogo Atlas no muestra ${name}`);
    ok(hierarchy.maps.some((entry) => Number(entry.mapId) === mapId && entry.mapName === name), `jerarquía no muestra ${name}`);
    const file = path.join(DATA, `Map${pad(mapId)}.rxdata`);
    if (!fs.existsSync(file)) { errors.push(`falta Map${pad(mapId)}.rxdata`); continue; }
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    const eventNames = parsed.events.map(({ obj }) => txt(iv(obj, "name")));
    const namedEvents = new Map(parsed.events.map(({ obj }) => [txt(iv(obj, "name")), obj]));
    ok(eventNames.some((eventName) => eventName.startsWith("Return to Puerto Horizonte")), `${mapId}: falta retorno contextual`);
    ok(parsed.events.every(({ obj }) => (iv(obj, "pages") || []).every((page) => txt(iv(iv(page, "graphic"), "character_name")) !== "Object ball special")), `${mapId}: aún se usa Object ball special`);
    const beacon = parsed.events.map(({ obj }) => obj).find((event) => txt(iv(event, "name")).includes("Beacon"));
    ok(Boolean(beacon), `${mapId}: falta baliza de ruta`);
    if (beacon) {
      const page = (iv(beacon, "pages") || [])[0];
      ok(txt(iv(iv(page, "graphic"), "character_name")) === "Atlas Wayfinder 01", `${mapId}: baliza sin terminal contextual`);
      const dialogue = (iv(page, "list") || []).map((command) => txt(iv(command, "parameters")?.[0])).join(" ");
      ok(dialogue.includes(name) && dialogue.includes("Meridiano Ámbar"), `${mapId}: diálogo de baliza no refleja el lugar nuevo`);
      ok(!/recuerdo incompleto|geografía deriva|copia de su historia|similitudes y vacíos/i.test(dialogue), `${mapId}: diálogo conserva la idea de mapa copiado`);
    }
    for (const event of parsed.events.map(({ obj }) => obj).filter((entry) => txt(iv(entry, "name")).startsWith("PokeMod Tier3:"))) {
      const pages = iv(event, "pages") || [];
      ok(txt(iv(iv(pages[0], "graphic"), "character_name")) === "Atlas Echo Stone 01", `${mapId}: eco sin piedra de resonancia`);
      if (pages[1]) ok(txt(iv(iv(pages[1], "graphic"), "character_name")) === "Atlas Echo Shard 01", `${mapId}: eco resuelto sin fragmento contextual`);
    }
    const challenge = challengeByMap.get(mapId);
    if (challenge?.category === "pokemon_elite") {
      const event = parsed.events.map(({ obj }) => obj).find((entry) => txt(iv(entry, "name")).startsWith("Atlas desafío"));
      const sprite = txt(iv(iv((iv(event, "pages") || [])[0], "graphic"), "character_name"));
      ok(Boolean(event) && sprite !== "Object ball special" && sprite !== "", `${mapId}: encuentro de Pokémon sin sprite`);
    }
    if (mapId === 1024) {
      const encounter = namedEvents.get("PokeMod Meridiano Ámbar: Auralume");
      ok(Boolean(encounter), "Ruta del Zumbido Dorado no incluye el encuentro de Auralume");
      if (encounter) {
        const pages = iv(encounter, "pages") || [];
        const graphicName = txt(iv(iv(pages[0], "graphic"), "character_name"));
        const commands = eventCommands(encounter);
        const ruby = commands.map((command) => txt(iv(command, "parameters")?.[0])).join("\n");
        ok(graphicName === "AURALUME", "encuentro de Auralume no muestra su sprite de campo");
        ok(ruby.includes("Pokemon.new(:AURALUME,35)") && ruby.includes("pbWildBattleCore(p)"), "encuentro de Auralume no inicia un combate salvaje opcional");
        ok(commands.some((command) => Number(iv(command, "code")) === 123 && txt(iv(command, "parameters")?.[0]) === "A"), "encuentro de Auralume no usa self-switch A");
        ok((pages[1]?.getIvar("condition")?.getIvar("self_switch_valid")) === true, "página posterior de Auralume no está condicionada por self-switch A");
      }
    }
  }
  for (const interaction of SCENE_PROPS) {
    const mapId = Number(interaction.mapId);
    const filename = `Map${pad(mapId)}.rxdata`;
    const parsed = parseMap(readRx(filename));
    const eventName = `PokeMod Meridiano Ámbar: ${interaction.name}`;
    const event = parsed.events.map(({ obj }) => obj).find((entry) => txt(iv(entry, "name")) === eventName);
    ok(Boolean(event), `${mapId}: falta la interacción ${interaction.name}`);
    if (!event) continue;
    const pages = iv(event, "pages") || [];
    const page = pages[0];
    const graphic = txt(iv(iv(page, "graphic"), "character_name"));
    ok(graphic === interaction.sprite, `${mapId}: ${interaction.name} usa el sprite ${graphic}, esperado ${interaction.sprite}`);
    ok(Number(iv(event, "x")) === Number(interaction.position[0]) && Number(iv(event, "y")) === Number(interaction.position[1]), `${mapId}: ${interaction.name} cambió de coordenadas`);
    ok(openCell(parsed, Number(interaction.position[0]), Number(interaction.position[1])), `${mapId}: ${interaction.name} está en una celda no transitable`);
    const transcript = (iv(page, "list") || []).filter((command) => Number(iv(command, "code")) === 401).map((command) => txt(iv(command, "parameters")?.[0])).join(" ").replace(/\s+/g, " ").trim();
    for (const line of interaction.dialogue) ok(transcript.includes(String(line).replace(/\s+/g, " ").trim()), `${mapId}: diálogo incompleto en ${interaction.name}`);
  }
  const hub = readRx("Map1001.rxdata");
  const sectorDoor = iv(hub, "events").pairs.find(([, event]) => txt(iv(event, "name")) === "PokeMod Atlas Mil: Sector 1")?.[1];
  ok(Boolean(sectorDoor), "Map1001 perdió la puerta de Meridiano Ámbar");
  if (sectorDoor) ok(txt(iv(iv((iv(sectorDoor, "pages") || [])[0], "graphic"), "character_name")) === "Atlas Gate Sector 01", "la puerta sectorial aún usa un marcador genérico");

  if (errors.length) throw new Error(`Piloto del Sector 1 inválido (${errors.length}):\n- ${errors.slice(0, 100).join("\n- ")}`);
  console.log("Verificación OK: 5 mapas del piloto rebautizados, marcadores de Poké Ball retirados de 1021–1025, Campana de Alba interactuable y Auralume registrada con sprites y encuentro opcional.");
}

if (!VERIFY_ONLY) {
  install();
  console.log(`Piloto del Sector 1 instalado. Respaldo original: ${path.relative(ROOT, BACKUP)}`);
}
verify();
