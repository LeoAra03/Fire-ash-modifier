#!/usr/bin/env node
/**
 * Instala/verifica la expansión post-game "Isla Espejo" directamente sobre
 * los datos compilados de Pokémon Fire Ash 3.7.1.
 *
 * Cambios aditivos:
 *   - NPC post-game en Pueblo Paleta (Mapa 033).
 *   - 3 mapas nuevos (997-999), 16 jefes repetibles y retorno libre.
 *   - 16 equipos nuevos en trainers.dat, sin sustituir entrenadores base.
 *   - Mochila habilitada en todos los combates internos del juego: el switch
 *     674 deja de bloquear objetos. Se preserva la regla de combates externos.
 *
 * Antes de escribir, guarda copias de los archivos tocados en
 * pokemon_fire_ash/PokeModBackups/isla_espejo_originals/. No toca partidas.
 *
 * Uso:
 *   node tools/apply_isla_espejo_expansion.mjs
 *   node tools/apply_isla_espejo_expansion.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import {
  marshalLoad, marshalDump, RHash, RObject, RString, RSymbol,
} from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const VERIFY = process.argv.includes("--verify");
const MAP_IDS = [997, 998, 999];
const PALLET_MAP = 33;
const TEMPLATE_MAP = 973;
const POSTGAME_SWITCH = 429;
const NPC_MARKER = "PokeMod: Aide Isla Espejo";
const BACKUP_DIR = path.join(GAME, "PokeModBackups", "isla_espejo_originals");

const affected = [
  "Scripts.rxdata", "trainers.dat", "MapInfos.rxdata", "Map033.rxdata",
  "map_metadata.dat",
];

function readRx(file) {
  return marshalLoad(fs.readFileSync(path.join(DATA, file)));
}
function writeRx(file, value) {
  fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
}
function pad3(n) { return String(n).padStart(3, "0"); }
function S(text) { return RString.fromText(String(text)); }
function Sym(name) { return new RSymbol(String(name)); }
function iv(obj, name) { return obj.getIvar(name); }
function text(v) { return v instanceof RString ? v.text : String(v ?? ""); }
function symbol(v) { return v instanceof RSymbol ? v.name : String(v ?? ""); }

function backupAffected() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const file of affected) {
    const src = path.join(DATA, file);
    const dst = path.join(BACKUP_DIR, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(BACKUP_DIR, "LEEME.txt"),
    "Copias originales anteriores a Isla Espejo. No contienen partidas guardadas.\n" +
    "Para revertir, copia estos archivos sobre pokemon_fire_ash/Data/.\n",
  );
}

// ---------------------------------------------------------------------------
// Constructores RMXP (eventos ya expandidos; Kirin no necesita RPG Maker)
// ---------------------------------------------------------------------------
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [
    ["@code", code], ["@indent", indent], ["@parameters", params],
  ]);
}
function condition({ sw = 0, self = "" } = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
    ["@switch2_valid", false], ["@switch2_id", 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
  ]);
}
function graphic(charName = "", dir = 2, pattern = 1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", 0], ["@character_name", S(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pattern], ["@opacity", 255], ["@blend_type", 0],
  ]);
}
function moveRoute() {
  return new RObject("RPG::MoveRoute", [
    ["@repeat", true], ["@skippable", false], ["@list", []],
  ]);
}
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
  return new RObject("RPG::Event", [
    ["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages],
  ]);
}
function textCommands(lines, indent = 0) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return [cmd(101, [S("")], indent), ...arr.map((line) => cmd(401, [S(line)], indent))];
}
function script(line, indent = 0) { return cmd(355, [S(line)], indent); }
function transfer(map, x, y, dir = 2, indent = 0) {
  return cmd(201, [0, map, x, y, dir, 1], indent);
}
function addEvent(mapObj, ev) {
  const events = iv(mapObj, "events");
  events.pairs.push([iv(ev, "id"), ev]);
}
function simpleNpc(id, name, x, y, sprite, lines, opts = {}) {
  return event(id, name, x, y, [page({
    cond: opts.sw ? condition({ sw: opts.sw }) : condition(),
    gfx: graphic(sprite, opts.dir || 2),
    list: [...textCommands(lines), cmd(0)],
  })]);
}
function healerEvent(id, x, y) {
  const list = [
    ...textCommands(["Nurse Joy: These reflected battles are demanding.", "Shall I restore your Pokemon?"]),
    cmd(102, [[S("Yes"), S("No")], 2]),
    cmd(402, [0, S("Yes")]),
    cmd(314, [0], 1),
    ...textCommands(["There. Your team is ready to shine again."], 1),
    cmd(402, [1, S("No")]),
    ...textCommands(["All right. Come back whenever you need me."], 1),
    cmd(404), cmd(0),
  ];
  return event(id, "Mirror Nurse", x, y, [page({ gfx: graphic("NPC 16"), list })]);
}
function portalEvent(id, name, x, y, target, lines) {
  const list = [
    ...textCommands(lines),
    cmd(102, [[S("Enter"), S("Stay")], 2]),
    cmd(402, [0, S("Enter")]),
    transfer(target, 14, 10, 2, 1),
    cmd(402, [1, S("Stay")]),
    cmd(404), cmd(0),
  ];
  return event(id, name, x, y, [page({ gfx: graphic("Object ball special"), list })]);
}
function exitEvent(id, name, x, y, targetMap, targetX, targetY, message) {
  return event(id, name, x, y, [page({
    trigger: 1,
    list: [...textCommands([message]), transfer(targetMap, targetX, targetY), cmd(0)],
  })]);
}
function palletAideEvent(id) {
  const list = [
    ...textCommands([
      "Oak's aide: A stable signal has appeared beyond the Orange Archipelago.",
      "Professor Oak calls it Mirror Island. It preserves battles from worlds that might have been.",
      "The ferry can bring you home at any time. Would you like to investigate?",
    ]),
    cmd(102, [[S("Sail to the island"), S("Not yet")], 2]),
    cmd(402, [0, S("Sail to the island")]),
    transfer(997, 14, 10, 2, 1),
    cmd(402, [1, S("Not yet")]),
    ...textCommands(["Oak's aide: I will keep the route open for you."], 1),
    cmd(404), cmd(0),
  ];
  return event(id, NPC_MARKER, 39, 24, [page({
    cond: condition({ sw: POSTGAME_SWITCH }),
    gfx: graphic("trchar028"),
    list,
  })]);
}

function bossEvent(id, boss, x, y) {
  const call = `pbTrainerBattle(:${boss.type},\"${boss.name}\",nil,false,0,true)`;
  const first = [
    ...textCommands(boss.intro),
    script(`pbTrainerIntro(:${boss.type})`),
    cmd(111, [12, S(call)]),
    ...textCommands([boss.win, "The mirror leaves behind a Rare Candy."], 1),
    script("pbReceiveItem(:RARECANDY)", 1),
    // RPG Maker XP: operación 0 = ON, 1 = OFF.
    cmd(123, [S("A"), 0], 1),
    cmd(411),
    ...textCommands([boss.loss], 1),
    cmd(412),
    script("pbTrainerEnd"), cmd(0),
  ];
  const rematch = [
    ...textCommands([boss.rematch]),
    cmd(102, [[S("Rematch"), S("Later")], 2]),
    cmd(402, [0, S("Rematch")]),
    script(`pbTrainerIntro(:${boss.type})`, 1),
    cmd(111, [12, S(call)], 1),
    ...textCommands([boss.win], 2),
    cmd(411, [], 1),
    ...textCommands([boss.loss], 2),
    cmd(412, [], 1),
    script("pbTrainerEnd", 1),
    cmd(402, [1, S("Later")]),
    cmd(404), cmd(0),
  ];
  const gfx = () => graphic(boss.sprite);
  return event(id, `Mirror Boss: ${boss.name}`, x, y, [
    page({ gfx: gfx(), list: first }),
    page({ cond: condition({ self: "A" }), gfx: gfx(), list: rematch }),
  ]);
}

// ---------------------------------------------------------------------------
// Definición del contenido
// ---------------------------------------------------------------------------
const bosses = [
  {
    map: 997, name: "Yellow", label: "Yellow with the Straw Hat",
    type: "POKEMONTRAINER_Yellow", sprite: "trchar140",
    intro: ["Yellow: Pokemon do not need harsh orders to be brave.", "Show me the bond that brought you all the way home."],
    win: "Yellow: Your team trusts you completely.", loss: "Yellow: Rest first. Strength also means knowing when to heal.",
    rematch: "Yellow: Chuchu is ready. Would you like another friendly battle?",
    team: [["PIKACHU",82,"Chuchu"],["RATICATE",78,"Ratty"],["DODRIO",80,"Dody"],["GOLEM",81,"Gravvy"],["OMASTAR",79,"Omny"],["BUTTERFREE",78,"Kitty"]],
  },
  {
    map: 997, name: "Green", label: "Green the Clever Thief",
    type: "POKEMONTRAINER_Green", sprite: "trchar139",
    intro: ["Green: Relax. I only steal things from people who stop paying attention.", "Let us see whether I can steal this victory too."],
    win: "Green: Hmph. You kept your eyes on the battle.", loss: "Green: A clever plan beats a loud one.",
    rematch: "Green: Want another chance to catch me off guard?",
    team: [["BLASTOISE",84,"Blasty"],["CLEFABLE",81],["WIGGLYTUFF",80],["NIDOQUEEN",82],["DITTO",80],["GRANBULL",81]],
  },
  {
    map: 997, name: "Blue Rocket", label: "Blue, Rocket Commander",
    type: "SECRET_Blue", sprite: "SECRET_Blue",
    intro: ["Blue: In this reflection, Giovanni offered me command of Team Rocket.", "Do not mistake ambition for weakness."],
    win: "Blue: Even a commander has something left to learn.", loss: "Blue: Smell you later. Train before you challenge command again.",
    rematch: "Blue: Team Rocket keeps records. Shall I improve yours?",
    team: [["CHARIZARD",87],["GOLBAT",82],["SCYTHER",83],["MACHAMP",84],["PORYGON",82],["NINETALES",84]],
  },
  {
    map: 997, name: "Cynthia Ancestral", label: "Cynthia in Ancestral Armor",
    type: "SECRET_Cynthia", sprite: "SECRET_Cynthia",
    intro: ["Cynthia: Sinnoh's oldest stories speak of a challenger reflected across time.", "I came wearing their armor to learn whether the story means you."],
    win: "Cynthia: The old story has found a worthy ending.", loss: "Cynthia: Myths survive because every defeat teaches the next hero.",
    rematch: "Cynthia: Garchomp remembers you. Shall the myth begin again?",
    team: [["GARCHOMP",91],["SPIRITOMB",87],["TOGEKISS",88],["LUCARIO",89],["MILOTIC",88],["ROSERADE",87]],
  },
  {
    map: 998, name: "Sabrina Triad", label: "Sabrina, Rocket Executive",
    type: "SECRET_Sabrina", sprite: "SECRET_Sabrina",
    intro: ["Sabrina: I saw a future where Kanto's strongest Leaders stood beside Team Rocket.", "This mirror insists that future still wants to fight."],
    win: "Sabrina: You broke a future I believed unavoidable.", loss: "Sabrina: The future bends, but it has not broken yet.",
    rematch: "Sabrina: I can see the answer changing. Will you test it?",
    team: [["ALAKAZAM",86],["VENOMOTH",82],["MRMIME",83],["KADABRA",82],["HYPNO",84],["JYNX",84]],
  },
  {
    map: 998, name: "Koga Triad", label: "Koga of the Rocket Triad",
    type: "SECRET_Koga", sprite: "SECRET_Koga",
    intro: ["Koga: A ninja can serve justice or poison it from within.", "Face the shadow that chose Team Rocket."],
    win: "Koga: Your resolve dispersed every veil.", loss: "Koga: You noticed the poison only after it had spread.",
    rematch: "Koga: The same shadow never falls twice. Again?",
    team: [["ARBOK",83],["MUK",84],["GOLBAT",82],["WEEZING",85],["CROBAT",86],["TENTACRUEL",84]],
  },
  {
    map: 998, name: "Lt. Surge Rocket", label: "Lt. Surge, Rocket Major",
    type: "SECRET_Surge", sprite: "SECRET_Surge",
    intro: ["Surge: In my world, Team Rocket gave Kanto an army.", "Let us see how your Pokemon handle battlefield voltage!"],
    win: "Surge: Outstanding! You weathered the whole storm.", loss: "Surge: That is what happens when you enter combat unprepared.",
    rematch: "Surge: Batteries charged! Ready for another campaign?",
    team: [["RAICHU",87],["ELECTRODE",84],["MAGNETON",84],["ELECTABUZZ",85],["JOLTEON",86],["ZAPDOS",89]],
  },
  {
    map: 998, name: "Steven Archaeologist", label: "Steven the Archaeologist",
    type: "SECRET_Steven", sprite: "SECRET_Steven",
    intro: ["Steven: Every stone here records a battle from somewhere else.", "I would like to add the pressure of our battle to that record."],
    win: "Steven: A result worthy of preservation.", loss: "Steven: Even fractured stone can reveal a valuable lesson.",
    rematch: "Steven: The strata changed after our battle. Shall we make another layer?",
    team: [["METAGROSS",91],["AGGRON",88],["ARMALDO",87],["CRADILY",87],["AERODACTYL",88],["CLAYDOL",87]],
  },
  {
    map: 998, name: "Wally Elite", label: "Wally of the Elite",
    type: "SECRET_Wally", sprite: "SECRET_Wally",
    intro: ["Wally: I once struggled to take a few steps outside my home.", "Now I want to see how far this team can take me."],
    win: "Wally: Losing to you only gives me a farther goal.", loss: "Wally: We kept moving, one step at a time.",
    rematch: "Wally: I am stronger than yesterday. Are you?",
    team: [["GALLADE",91],["ALTARIA",87],["ROSERADE",87],["MAGNEZONE",88],["GARCHOMP",90],["AZUMARILL",87]],
  },
  {
    map: 998, name: "Professor Oak Young", label: "Young Professor Oak",
    type: "SECRET_Oak", sprite: "SECRET_Oak",
    intro: ["Oak: In my time, the Pokedex was still a notebook and every discovery felt enormous.", "Let an old memory show you its first partners."],
    win: "Oak: Wonderful! That is a battle worth writing down.", loss: "Oak: Research and training both reward patience.",
    rematch: "Oak: I have a fresh page ready. Another battle?",
    team: [["CELEBI",89],["CHARMELEON",84],["MAGCARGO",84],["PIDGEOT",86]],
  },
  {
    map: 999, name: "Red of Mt. Silver", label: "Red Possessed by Mt. Silver",
    type: "SECRET_Red", sprite: "SECRET_Red",
    intro: ["Red: ...", "A frozen signal clings to him. His Pokemon answer without a command."],
    win: "Red: ...The snow is quiet again.", loss: "Red: ...",
    rematch: "The frozen Red raises a Poke Ball. Challenge him again?",
    team: [["GLALIE",89],["FROSLASS",89],["WEAVILE",91],["PIKACHU",92],["SNORLAX",91],["LAPRAS",90]],
  },
  {
    map: 999, name: "Giovanni Armored", label: "Giovanni in Containment Armor",
    type: "SECRET_Giovanni", sprite: "SECRET_Giovanni",
    intro: ["Giovanni: Mewtwo's restraints were wasted after it escaped.", "I found a more disciplined use for their power."],
    win: "Giovanni: Power without loyalty is still incomplete.", loss: "Giovanni: Technology rewards the Trainer willing to control it.",
    rematch: "Giovanni: The armor has adapted to your last strategy. Continue?",
    team: [["MEWTWO",93],["NIDOKING",89],["NIDOQUEEN",89],["RHYPERIOR",90],["PERSIAN",88],["KANGASKHAN",89]],
  },
  {
    map: 999, name: "Fusion Scientist", label: "Scientist of the Failed Fusion",
    type: "SCIENTIST", sprite: "trchar246",
    intro: ["Scientist: The transfer system copied me into its own storage.", "If the battle ends, perhaps it will remember which half is human."],
    win: "Scientist: The checksum is stable... for now.", loss: "Scientist: Your strategy has been added to the experiment.",
    rematch: "Scientist: Repeating the test may separate the data. Proceed?",
    team: [["PORYGONZ",89],["PORYGON2",87],["ROTOM",87],["MUK",85],["DITTO",85],["ELECTRODE",86]],
  },
  {
    map: 999, name: "Shiny Collector", label: "Collector of Shiny Pokemon",
    type: "SECRET_Trevor", sprite: "SECRET_Trevor",
    intro: ["Collector: Every Pokemon here is a once-in-a-lifetime discovery!", "Try not to blink when the whole collection shines."],
    win: "Collector: Your victory shines brighter than my collection.", loss: "Collector: Rarity is impressive, but preparation wins battles.",
    rematch: "Collector: The lighting is perfect. One more brilliant battle?",
    team: [["GYARADOS",89,null,true],["HAXORUS",90,null,true],["METAGROSS",91,null,true],["CHARIZARD",90,null,true],["RAYQUAZA",93,null,true],["UMBREON",88,null,true]],
  },
  {
    map: 999, name: "Forgotten Programmer", label: "The Forgotten Programmer",
    type: "SECRET_Clemont", sprite: "SECRET_Clemont",
    intro: ["Programmer: I remember when six partners had to fit inside very little memory.", "No gimmick. No patch. Just one final test."],
    win: "Programmer: Good. The oldest rules still produce new champions.", loss: "Programmer: Simple code is often the hardest to defeat.",
    rematch: "Programmer: The program is ready to run again. Start?",
    team: [["PIKACHU",92],["GENGAR",92],["SNORLAX",92],["DRAGONITE",92],["ALAKAZAM",92],["TAUROS",92]],
  },
  {
    map: 999, name: "Game Over", label: "The End of the Game",
    type: "SECRET_Cyrus", sprite: "SECRET_Cyrus",
    intro: ["Game Over: NO DATA.", "Every journey reaches a final screen. Prove that yours can continue."],
    win: "Game Over: CONTINUE... The ending has been postponed.", loss: "Game Over: NO CONTINUE DATA FOUND.",
    rematch: "The words CONTINUE? flicker in the darkness.",
    team: [["YVELTAL",96],["DARKRAI",95],["SPIRITOMB",93],["GENGAR",94],["DUSCLOPS",93],["ABSOL",94]],
  },
];

// Posiciones verificadas sobre el escenario de Tower Summit (mapa 973).
const bossPositions = {
  997: [[13, 7], [15, 7], [19, 7], [21, 9]],
  998: [[13, 7], [15, 7], [19, 7], [21, 9], [8, 11], [18, 11]],
  999: [[13, 7], [15, 7], [19, 7], [21, 9], [8, 11], [18, 11]],
};

// ---------------------------------------------------------------------------
// trainers.dat
// ---------------------------------------------------------------------------
function dataSymbols(file) {
  const h = readRx(file);
  const ids = new Set();
  for (const [key] of h.pairs) if (key instanceof RSymbol) ids.add(key.name);
  return ids;
}
function trainerKeyMatches(key, boss) {
  return Array.isArray(key) && symbol(key[0]) === boss.type && text(key[1]) === boss.name && Number(key[2]) === 0;
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
function installTrainers() {
  const species = dataSymbols("species.dat");
  const types = dataSymbols("trainer_types.dat");
  const items = dataSymbols("items.dat");
  if (!items.has("FULLRESTORE") || !items.has("RARECANDY")) throw new Error("Faltan objetos base requeridos");
  for (const boss of bosses) {
    if (!types.has(boss.type)) throw new Error(`Tipo de entrenador inexistente: ${boss.type}`);
    for (const [sp] of boss.team) if (!species.has(sp)) throw new Error(`Especie inexistente: ${sp} (${boss.name})`);
  }
  const trainers = readRx("trainers.dat");
  let next = Math.max(-1, ...trainers.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  for (const boss of bosses) {
    if (trainers.pairs.some(([key]) => trainerKeyMatches(key, boss))) continue;
    const built = trainerObject(boss, next);
    trainers.pairs.push([next, built.obj], [built.key, built.obj]);
    next++;
  }
  writeRx("trainers.dat", trainers);
}

// ---------------------------------------------------------------------------
// Scripts.rxdata: el switch 674 deja de bloquear la Mochila globalmente.
// Se conserva !@internalBattle porque no es la flag solicitada y protege los
// combates externos/especiales que no usan el inventario normal.
// ---------------------------------------------------------------------------
const oldBagGuard = "    if !@internalBattle || $game_switches[674]";
const grandeurBagGuard = [
  "    # PokeMod: the Grandeur Club remains a challenge, but its Bag is usable.",
  "    # Other facilities which deliberately set switch 674 keep their rule.",
  "    grandeur_bag = [141, 151, 214].include?($game_map.map_id)",
  "    if !@internalBattle || ($game_switches[674] && !grandeur_bag)",
].join("\r\n");
const globalBagGuard = [
  "    # PokeMod: switch 674 no longer disables the Bag in internal battles.",
  "    # Keep the original rule for external/special battle systems.",
  "    if !@internalBattle",
].join("\r\n");
function installBagPatch() {
  const scripts = readRx("Scripts.rxdata");
  const row = scripts.find((r) => text(r[1]) === "Battle_Phase_Command");
  if (!row) throw new Error("No se encontró Battle_Phase_Command");
  let code = zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
  if (!code.includes("switch 674 no longer disables")) {
    if (code.includes("grandeur_bag")) code = code.replace(grandeurBagGuard, globalBagGuard);
    else if (code.includes(oldBagGuard)) code = code.replace(oldBagGuard, globalBagGuard);
    else throw new Error("No se encontró la restricción original de Mochila");
    row[2].bytes = Uint8Array.from(zlib.deflateSync(Buffer.from(code, "utf8")));
    writeRx("Scripts.rxdata", scripts);
  }
}

const oldMapName = [
  "    ret = pbGetMessage(MessageTypes::MapNames, @map_id)",
  "    ret.gsub!(/\\\\PN/, $Trainer.name) if $Trainer",
].join("\r\n");
const newMapName = [
  "    ret = pbGetMessage(MessageTypes::MapNames, @map_id)",
  "    # PokeMod: additive maps have no entry in the compiled language packs.",
  "    # Fall back to MapInfos rather than rewriting every translation file.",
  "    if !ret || ret.empty?",
  "      info = pbLoadMapInfos[@map_id]",
  "      ret = info.name if info",
  "    end",
  "    ret.gsub!(/\\\\PN/, $Trainer.name) if $Trainer",
].join("\r\n");
function installMapNameFallback() {
  const scripts = readRx("Scripts.rxdata");
  const row = scripts.find((r) => text(r[1]) === "Game_Map");
  if (!row) throw new Error("No se encontró Game_Map");
  let code = zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
  if (!code.includes("additive maps have no entry")) {
    if (!code.includes(oldMapName)) throw new Error("No se encontró Game_Map#name original");
    code = code.replace(oldMapName, newMapName);
    row[2].bytes = Uint8Array.from(zlib.deflateSync(Buffer.from(code, "utf8")));
    writeRx("Scripts.rxdata", scripts);
  }
}

// ---------------------------------------------------------------------------
// Mapas 997-999 y conexión desde Pueblo Paleta.
// ---------------------------------------------------------------------------
function freshTemplateMap() {
  const map = readRx(`Map${pad3(TEMPLATE_MAP)}.rxdata`);
  iv(map, "events").pairs = [];
  return map;
}
function buildHubMap() {
  const map = freshTemplateMap();
  let id = 1;
  addEvent(map, exitEvent(id++, "Return Ferry", 10, 9, PALLET_MAP, 39, 23,
    "The ferry returns directly to Pallet Town."));
  addEvent(map, simpleNpc(id++, "Mirror Archivist", 14, 11, "trchar028", [
    "Archivist: Welcome to Mirror Island, an echo caught by Professor Oak's receiver.",
    "The Trainers here are memories, not captives. Battles are friendly and can be repeated.",
    "The west mirror leads to lost legends. The east mirror leads to corrupted records.",
  ]));
  addEvent(map, healerEvent(id++, 8, 9));
  addEvent(map, portalEvent(id++, "Mirror of Legends", 8, 11, 998,
    ["The surface shows heroes and villains from histories that never happened."]));
  addEvent(map, portalEvent(id++, "Mirror of Lost Data", 18, 11, 999,
    ["Broken pixels gather into a path through corrupted battle records."]));
  const here = bosses.filter((b) => b.map === 997);
  here.forEach((b, i) => addEvent(map, bossEvent(id++, b, ...bossPositions[997][i])));
  return map;
}
function buildWingMap(mapId, title, signLines) {
  const map = freshTemplateMap();
  let id = 1;
  addEvent(map, exitEvent(id++, "Return to Atrium", 10, 9, 997, 14, 10,
    "The mirror returns you to the island's atrium."));
  addEvent(map, healerEvent(id++, 22, 11));
  addEvent(map, simpleNpc(id++, `${title} Inscription`, 22, 10, "", signLines));
  const here = bosses.filter((b) => b.map === mapId);
  here.forEach((b, i) => addEvent(map, bossEvent(id++, b, ...bossPositions[mapId][i])));
  return map;
}
function installMaps() {
  writeRx("Map997.rxdata", buildHubMap());
  writeRx("Map998.rxdata", buildWingMap(998, "Gallery of Legends", [
    "GALLERY OF LEGENDS", "Here, one choice changed an entire life.",
  ]));
  writeRx("Map999.rxdata", buildWingMap(999, "Zero Archive", [
    "ZERO ARCHIVE", "These records were recovered without a valid ending.",
  ]));

  const infos = readRx("MapInfos.rxdata");
  infos.pairs = infos.pairs.filter(([id]) => !MAP_IDS.includes(Number(id)));
  const names = ["Mirror Island - Atrium", "Mirror Island - Gallery of Legends", "Mirror Island - Zero Archive"];
  MAP_IDS.forEach((id, i) => {
    const info = new RObject("RPG::MapInfo", [
      ["@scroll_x", 512], ["@name", S(names[i])], ["@expanded", false],
      ["@order", 1000 + i], ["@scroll_y", 320], ["@parent_id", i === 0 ? 48 : 997],
    ]);
    infos.pairs.push([id, info]);
  });
  writeRx("MapInfos.rxdata", infos);

  const pallet = readRx("Map033.rxdata");
  const events = iv(pallet, "events");
  events.pairs = events.pairs.filter(([, ev]) => text(iv(ev, "name")) !== NPC_MARKER);
  const nextId = Math.max(0, ...events.pairs.map(([id]) => Number(id))) + 1;
  const aide = palletAideEvent(nextId);
  events.pairs.push([nextId, aide]);
  writeRx("Map033.rxdata", pallet);
}

// Clonamos los metadatos del escenario que sirve de base para conservar su
// fondo de batalla de distorsión y su música heredada. Los nombres se resuelven
// por MapInfos mediante un fallback de script, sin reescribir los 5 idiomas.
function installMapRuntimeData() {
  const metadata = readRx("map_metadata.dat");
  const source = metadata.pairs.find(([id]) => Number(id) === TEMPLATE_MAP)?.[1];
  if (!source) throw new Error(`No existen metadatos para el mapa plantilla ${TEMPLATE_MAP}`);
  metadata.pairs = metadata.pairs.filter(([id]) => !MAP_IDS.includes(Number(id)));
  for (const id of MAP_IDS) {
    const clone = new RObject(source.className, source.ivars.map(([key, value]) => [key, value]));
    clone.setIvar("id", id);
    metadata.pairs.push([id, clone]);
  }
  writeRx("map_metadata.dat", metadata);
}

// ---------------------------------------------------------------------------
// Verificación estructural y de referencias
// ---------------------------------------------------------------------------
function commandsOf(ev) {
  const out = [];
  for (const pg of iv(ev, "pages") || []) for (const c of iv(pg, "list") || []) out.push(c);
  return out;
}
function verify() {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };

  const scripts = readRx("Scripts.rxdata");
  const row = scripts.find((r) => text(r[1]) === "Battle_Phase_Command");
  const code = row ? zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8") : "";
  ok(code.includes("switch 674 no longer disables the Bag"), "parche global de Mochila ausente");
  ok(!code.includes("if !@internalBattle || $game_switches[674]"), "el switch 674 todavía bloquea la Mochila");
  ok(code.includes("    if !@internalBattle"), "no se preservó la regla de combates externos");
  const mapRow = scripts.find((r) => text(r[1]) === "Game_Map");
  const mapCode = mapRow ? zlib.inflateSync(Buffer.from(mapRow[2].bytes)).toString("utf8") : "";
  ok(mapCode.includes("ret = info.name if info"), "falta el fallback de nombres para mapas aditivos");

  const infos = readRx("MapInfos.rxdata");
  for (const id of MAP_IDS) {
    ok(infos.pairs.some(([key]) => Number(key) === id), `MapInfos no registra ${id}`);
    const file = `Map${pad3(id)}.rxdata`;
    ok(fs.existsSync(path.join(DATA, file)), `falta ${file}`);
    if (!fs.existsSync(path.join(DATA, file))) continue;
    const map = readRx(file);
    const events = iv(map, "events").pairs;
    ok(events.length >= 9, `${file} tiene poco contenido (${events.length} eventos)`);
    ok(events.some(([, ev]) => text(iv(ev, "name")).includes("Return")), `${file} no tiene retorno`);
    for (const [, ev] of events) {
      for (const c of commandsOf(ev)) {
        if (Number(iv(c, "code")) !== 201) continue;
        const p = iv(c, "parameters");
        ok([33, 42, 997, 998, 999].includes(Number(p[1])), `${file} transfiere a mapa inesperado ${p[1]}`);
      }
    }
  }

  const metadata = readRx("map_metadata.dat");
  for (const id of MAP_IDS) {
    const meta = metadata.pairs.find(([key]) => Number(key) === id)?.[1];
    ok(!!meta, `faltan metadatos de ejecución del mapa ${id}`);
    if (meta) ok(text(iv(meta, "battle_background")) === "distortion",
      `el mapa ${id} no conserva el fondo de batalla esperado`);
  }
  const pallet = readRx("Map033.rxdata");
  const aide = iv(pallet, "events").pairs.find(([, ev]) => text(iv(ev, "name")) === NPC_MARKER)?.[1];
  ok(!!aide, "falta el NPC de acceso en Pueblo Paleta");
  if (aide) {
    const pg = iv(aide, "pages")[0];
    const cond = iv(pg, "condition");
    ok(iv(cond, "switch1_valid") && Number(iv(cond, "switch1_id")) === POSTGAME_SWITCH,
      "el NPC de Pueblo Paleta no está limitado al post-game");
    ok(commandsOf(aide).some((c) => Number(iv(c, "code")) === 201 && Number(iv(c, "parameters")[1]) === 997),
      "el NPC no lleva a Isla Espejo");
  }

  const trainers = readRx("trainers.dat");
  for (const boss of bosses) {
    const pair = trainers.pairs.find(([key]) => trainerKeyMatches(key, boss));
    ok(!!pair, `falta entrenador ${boss.type}/${boss.name}`);
    if (pair) ok((iv(pair[1], "pokemon") || []).length === boss.team.length,
      `equipo incompleto de ${boss.name}`);
    ok(fs.existsSync(path.join(GAME, "Graphics", "Characters", `${boss.sprite}.png`)),
      `falta el sprite de mapa ${boss.sprite}.png (${boss.name})`);
  }

  // Toda batalla nueva debe apuntar a una entrada compilada y tener canLose=true.
  let battleCount = 0;
  for (const id of MAP_IDS) {
    const map = readRx(`Map${pad3(id)}.rxdata`);
    for (const [, ev] of iv(map, "events").pairs) {
      for (const c of commandsOf(ev)) {
        if (![111, 355, 655].includes(Number(iv(c, "code")))) continue;
        const str = text(iv(c, "parameters")?.[Number(iv(c, "code")) === 111 ? 1 : 0]);
        if (!str.includes("pbTrainerBattle")) continue;
        battleCount++;
        ok(str.endsWith(",true)"), `batalla no amistosa en mapa ${id}: ${str}`);
      }
    }
  }
  ok(battleCount === bosses.length * 2, `se esperaban ${bosses.length * 2} llamadas de jefe; hay ${battleCount}`);

  // Los premios de primera victoria deben activar (no apagar) el self-switch A.
  for (const id of MAP_IDS) {
    const map = readRx(`Map${pad3(id)}.rxdata`);
    for (const [, ev] of iv(map, "events").pairs) {
      if (!text(iv(ev, "name")).startsWith("Mirror Boss:")) continue;
      const selfCmd = commandsOf(ev).find((c) => Number(iv(c, "code")) === 123);
      ok(selfCmd && Number(iv(selfCmd, "parameters")[1]) === 0,
        `self-switch de victoria inválido en mapa ${id}, evento ${iv(ev, "id")}`);
    }
  }

  if (errors.length) throw new Error("Verificación fallida:\n- " + errors.join("\n- "));
  console.log(`Verificación OK: 3 mapas, ${bosses.length} jefes, ${battleCount} combates y retorno libre.`);
}

if (!VERIFY) {
  backupAffected();
  installBagPatch();
  installMapNameFallback();
  installTrainers();
  installMaps();
  installMapRuntimeData();
  console.log(`Instalación completada. Originales: ${path.relative(ROOT, BACKUP_DIR)}`);
}
verify();
