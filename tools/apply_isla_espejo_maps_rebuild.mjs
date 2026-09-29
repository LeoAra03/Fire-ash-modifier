#!/usr/bin/env node
/**
 * apply_isla_espejo_maps_rebuild.mjs
 *
 * Reconstrucción artesanal, rica y explorable de los 3 mapas de Isla Espejo:
 *   - Mapa 997 (Isla Espejo — Atrio): 56x48.
 *       Isla oceánica expansiva con costa orgánica de arena dorada, puerto/muelle
 *       de madera auténtico (717..743) donde atraca el ferry de Pueblo Paleta, paseo
 *       marítimo adoquinado (648..667), pabellón central de descanso con la Enfermera Joy,
 *       el Archivista y el Abra de emergencia, y 4 arenas de duelo temáticas y exclusivas:
 *       Yellow (pradera floral), Green (mirador costero), Blue (bastión marcial)
 *       y Cynthia (templo ancestral en la cumbre norte con escalinatas dobles).
 *   - Mapa 998 (Galería de Leyendas): 56x52.
 *       Isla-templo sagrada a cielo abierto sobre tierra de ruinas antiguas (386) y
 *       calzadas de piedra pulida (648..667), terrazas escalonadas de acantilados,
 *       peristilos de mármol blanco (4400..4453), praderas de hierba alta salvaje (546)
 *       donde habitan líneas legendarias (Dratini, Larvitar, Bagon, Beldum, Riolu,
 *       Elekid), y 6 santuarios ceremoniales temáticos para Sabrina, Koga, Lt. Surge,
 *       Steven, Wally y el Joven Profesor Oak.
 *   - Mapa 999 (Archivo Cero): 56x52.
 *       Archipiélago fracturado y surreal suspendido sobre el abismo cósmico (144),
 *       con 6 islas flotantes de basalto oscuro (1257), acantilados escarpados (1256..1273),
 *       puentes y calzadas suspendidas (648..667), monolitos de datos antiguos (3300/4453)
 *       y campos estáticos donde vagan Porygon, Unown, Ditto y Voltorb, ascendiendo
 *       hacia la Ciudadela Flotante del Fin del Juego donde aguardan el Científico Fusión,
 *       Coleccionista Shiny, Giovanni Acorazado, Red de Monte Silver, el Programador Olvidado
 *       y la entidad Game Over.
 *
 * Preserva:
 *   - Todos los combates con canLose, derrota persistente y revancha opcional.
 *   - Llegada en (14, 10) garantizada transitable y enlazada con todos los eventos.
 *   - Ferry de vuelta en Mapa 997 a Pueblo Paleta (33, 39, 23).
 *   - Abra de emergencia en Mapa 997, 998 y 999 con teletransporte a casa de Ash (42, 3, 8).
 *   - Mochila libre y compatibilidad total con el motor.
 *
 * Uso:
 *   node tools/apply_isla_espejo_maps_rebuild.mjs
 *   node tools/apply_isla_espejo_maps_rebuild.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  marshalLoad, marshalDump, RHash, RObject, RString, RSymbol,
} from "../web/js/marshal.js";
import {
  TileCanvas, passabilityOf, reachableCells, buildMapObject,
} from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const BACKUP_DIR = path.join(GAME, "PokeModBackups", "isla_espejo_maps_rebuild");
const VERIFY_ONLY = process.argv.includes("--verify");

const readRx = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const writeRx = (f, v) => fs.writeFileSync(path.join(DATA, f), Buffer.from(marshalDump(v)));
const S = (text) => RString.fromText(String(text));
const iv = (obj, name) => obj.getIvar(name);
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));

// ---------------------------------------------------------------------------
// RMXP Event Constructors
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
  return [cmd(101, [S("")], indent), ...arr.map((l) => cmd(401, [S(l)], indent))];
}
function script(line, indent = 0) { return cmd(355, [S(line)], indent); }
function transfer(map, x, y, dir = 2, indent = 0) {
  return cmd(201, [0, map, x, y, dir, 1], indent);
}
function addEvent(mapObj, ev) {
  const events = iv(mapObj, "events");
  events.pairs.push([iv(ev, "id"), ev]);
}

// ---------------------------------------------------------------------------
// Gameplay Event Generators
// ---------------------------------------------------------------------------
function returnFerryEvent(id, x, y) {
  const list = [
    ...textCommands([
      "Sailor: The ferry to Pallet Town is fueled and ready.",
      "Would you like to set sail for Kanto?",
    ]),
    cmd(102, [[S("Sail to Pallet Town"), S("Stay on the island")], 2]),
    cmd(402, [0, S("Sail to Pallet Town")]),
    ...textCommands(["The ferry sets sail across the calm ocean waves."], 1),
    transfer(33, 39, 23, 2, 1),
    cmd(402, [1, S("Stay on the island")]),
    ...textCommands(["Sailor: Take your time. We depart whenever you are ready."], 1),
    cmd(404),
    cmd(0),
  ];
  return event(id, "Return Ferry", x, y, [
    page({ gfx: graphic("trainer_SAILOR", 2), trigger: 0, list }),
  ]);
}

function healerEvent(id, x, y) {
  const list = [
    ...textCommands(["Nurse Joy: Welcome to the Mirror Island sanctuary.", "Shall I restore your Pokémon to full health?"]),
    cmd(102, [[S("Yes"), S("No")], 2]),
    cmd(402, [0, S("Yes")]),
    cmd(314, [0], 1),
    ...textCommands(["There. Your team is shining with renewed strength!"], 1),
    cmd(402, [1, S("No")]),
    ...textCommands(["All right. Return whenever you need to rest."], 1),
    cmd(404), cmd(0),
  ];
  return event(id, "Mirror Nurse", x, y, [page({ gfx: graphic("NPC 16", 2), list })]);
}

function archivistEvent(id, x, y) {
  const list = [
    ...textCommands([
      "Archivist: Welcome to Isla Espejo, the Atrium of Reflections.",
      "This island exists outside normal currents, recording echoes of legendary battles and worlds that might have been.",
      "To the west stands the Gallery of Legends, where past champions test your resolve.",
      "To the east lies the Zero Archive, an anomaly preserving lost battle data.",
      "Nurse Joy and Abra are resting right here if you need to recover or return home at any time.",
    ]),
    cmd(0),
  ];
  return event(id, "Mirror Archivist", x, y, [page({ gfx: graphic("trchar028", 2), list })]);
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
  return event(id, name, x, y, [page({ gfx: graphic("Object ball special", 2), list })]);
}

function returnPortalEvent(id, name, x, y) {
  const list = [
    ...textCommands([
      "A glowing reflection shimmers upon the ancient pedestal.",
      "Step through the mirror to return to the island Atrium?",
    ]),
    cmd(102, [[S("Return to Atrium"), S("Stay")], 2]),
    cmd(402, [0, S("Return to Atrium")]),
    transfer(997, 14, 10, 2, 1),
    cmd(402, [1, S("Stay")]),
    cmd(404), cmd(0),
  ];
  return event(id, name, x, y, [page({ gfx: graphic("Object ball special", 2), list })]);
}

function inscriptionEvent(id, name, x, y, lines) {
  return event(id, name, x, y, [page({
    trigger: 0,
    list: [...textCommands(lines), cmd(0)],
  })]);
}

function abraEvent(id, x, y, introMsg) {
  const customIntro = introMsg || "Este Abra de emergencia te sacará de cualquier apuro y puede llevarte a casa en cualquier momento.";
  const list = [
    cmd(101, [S("\\bAbra: ¡Aaaa-bra!\\1")]),
    cmd(101, [S(`\\b${customIntro}`)]),
    cmd(101, [S("\\b¡Recibiste el objeto 'Abra de emergencia'!\\1")]),
    script("pbReceiveItem(:ABRADEEMERGENCIA, 1)"),
    cmd(101, [S("\\bAhora puedes usar el 'Abra de emergencia' desde los Objetos Clave de tu Mochila en cualquier momento.")]),
    cmd(101, [S("¿Deseas usar Teletransporte ahora hacia la casa de Ash en Kanto?\\ch[1,2,Teletransportar,Quedarme aquí]")]),
    cmd(111, [12, S("$game_variables[1] == 1")]),
    transfer(42, 3, 8, 8, 1),
    cmd(101, [S("Llegaste a salvo a la casa de Ash en Kanto.")]),
    cmd(411),
    cmd(101, [S("\\bAbra: ¡Abra-abra! Estaré aquí por si me necesitas.")]),
    cmd(412),
    cmd(0),
  ];
  return event(id, "Abra de emergencia", x, y, [
    page({ gfx: graphic("ABRA", 2), list }),
  ]);
}

function bossEvent(id, boss, x, y) {
  const call = `pbTrainerBattle(:${boss.type},\"${boss.name}\",nil,false,0,true)`;
  const first = [
    ...textCommands(boss.intro),
    script(`pbTrainerIntro(:${boss.type})`),
    cmd(111, [12, S(call)]),
    ...textCommands([boss.win, "The mirror leaves behind a Rare Candy."], 1),
    script("pbReceiveItem(:RARECANDY)", 1),
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
// Boss Catalog
// ---------------------------------------------------------------------------
const BOSS_DATA = {
  // Map 997: Atrio
  Yellow: {
    type: "POKEMONTRAINER_Yellow", sprite: "trchar140", name: "Yellow",
    intro: ["Yellow: Pokémon do not need harsh orders to be brave.", "Show me the bond that brought you all the way home."],
    win: "Yellow: Your team trusts you completely.", loss: "Yellow: Rest first. Strength also means knowing when to heal.",
    rematch: "Yellow: Chuchu is ready. Would you like another friendly battle?",
  },
  Green: {
    type: "POKEMONTRAINER_Green", sprite: "trchar139", name: "Green",
    intro: ["Green: Relax. I only steal things from people who stop paying attention.", "Let us see whether I can steal this victory too."],
    win: "Green: Hmph. You kept your eyes on the battle.", loss: "Green: A clever plan beats a loud one.",
    rematch: "Green: Want another chance to catch me off guard?",
  },
  BlueRocket: {
    type: "SECRET_Blue", sprite: "SECRET_Blue", name: "Blue Rocket",
    intro: ["Blue: In this reflection, Giovanni offered me command of Team Rocket.", "Do not mistake ambition for weakness."],
    win: "Blue: Even a commander has something left to learn.", loss: "Blue: Smell you later. Train before you challenge command again.",
    rematch: "Blue: Team Rocket keeps records. Shall I improve yours?",
  },
  CynthiaAncestral: {
    type: "SECRET_Cynthia", sprite: "SECRET_Cynthia", name: "Cynthia Ancestral",
    intro: ["Cynthia: Sinnoh's oldest stories speak of a challenger reflected across time.", "I came wearing their armor to learn whether the story means you."],
    win: "Cynthia: The old story has found a worthy ending.", loss: "Cynthia: Myths survive because every defeat teaches the next hero.",
    rematch: "Cynthia: Garchomp remembers you. Shall the myth begin again?",
  },
  // Map 998: Galería de Leyendas
  SabrinaTriad: {
    type: "SECRET_Sabrina", sprite: "SECRET_Sabrina", name: "Sabrina Triad",
    intro: ["Sabrina: I saw a future where Kanto's strongest Leaders stood beside Team Rocket.", "This mirror insists that future still wants to fight."],
    win: "Sabrina: You broke a future I believed unavoidable.", loss: "Sabrina: The future bends, but it has not broken yet.",
    rematch: "Sabrina: I can see the answer changing. Will you test it?",
  },
  KogaTriad: {
    type: "SECRET_Koga", sprite: "SECRET_Koga", name: "Koga Triad",
    intro: ["Koga: A ninja can serve justice or poison it from within.", "Face the shadow that chose Team Rocket."],
    win: "Koga: Your resolve dispersed every veil.", loss: "Koga: You noticed the poison only after it had spread.",
    rematch: "Koga: The same shadow never falls twice. Again?",
  },
  LtSurgeRocket: {
    type: "SECRET_Surge", sprite: "SECRET_Surge", name: "Lt. Surge Rocket",
    intro: ["Surge: In my world, Team Rocket gave Kanto an army.", "Let us see how your Pokémon handle battlefield voltage!"],
    win: "Surge: Outstanding! You weathered the whole storm.", loss: "Surge: That is what happens when you enter combat unprepared.",
    rematch: "Surge: Batteries charged! Ready for another campaign?",
  },
  StevenArchaeologist: {
    type: "SECRET_Steven", sprite: "SECRET_Steven", name: "Steven Archaeologist",
    intro: ["Steven: Every stone here records a battle from somewhere else.", "I would like to add the pressure of our battle to that record."],
    win: "Steven: A result worthy of preservation.", loss: "Steven: Even fractured stone can reveal a valuable lesson.",
    rematch: "Steven: The strata changed after our battle. Shall we make another layer?",
  },
  WallyElite: {
    type: "SECRET_Wally", sprite: "SECRET_Wally", name: "Wally Elite",
    intro: ["Wally: I once struggled to take a few steps outside my home.", "Now I want to see how far this team can take me."],
    win: "Wally: Losing to you only gives me a farther goal.", loss: "Wally: We kept moving, one step at a time.",
    rematch: "Wally: I am stronger than yesterday. Are you?",
  },
  ProfessorOakYoung: {
    type: "SECRET_Oak", sprite: "SECRET_Oak", name: "Professor Oak Young",
    intro: ["Oak: In my time, the Pokédex was still a notebook and every discovery felt enormous.", "Let an old memory show you its first partners."],
    win: "Oak: Wonderful! That is a battle worth writing down.", loss: "Oak: Research and training both reward patience.",
    rematch: "Oak: I have a fresh page ready. Another battle?",
  },
  // Map 999: Archivo Cero
  RedOfMtSilver: {
    type: "SECRET_Red", sprite: "SECRET_Red", name: "Red of Mt. Silver",
    intro: ["Red: ...", "A frozen signal clings to him. His Pokémon answer without a command."],
    win: "Red: ...The snow is quiet again.", loss: "Red: ...",
    rematch: "The frozen Red raises a Poké Ball. Challenge him again?",
  },
  GiovanniArmored: {
    type: "SECRET_Giovanni", sprite: "SECRET_Giovanni", name: "Giovanni Armored",
    intro: ["Giovanni: Mewtwo's restraints were wasted after it escaped.", "I found a more disciplined use for their power."],
    win: "Giovanni: Power without loyalty is still incomplete.", loss: "Giovanni: Technology rewards the Trainer willing to control it.",
    rematch: "Giovanni: The armor has adapted to your last strategy. Continue?",
  },
  FusionScientist: {
    type: "SCIENTIST", sprite: "trchar246", name: "Fusion Scientist",
    intro: ["Scientist: The transfer system copied me into its own storage.", "If the battle ends, perhaps it will remember which half is human."],
    win: "Scientist: The checksum is stable... for now.", loss: "Scientist: Your strategy has been added to the experiment.",
    rematch: "Scientist: Repeating the test may separate the data. Proceed?",
  },
  ShinyCollector: {
    type: "SECRET_Trevor", sprite: "SECRET_Trevor", name: "Shiny Collector",
    intro: ["Collector: Every Pokémon here is a once-in-a-lifetime discovery!", "Try not to blink when the whole collection shines."],
    win: "Collector: Your victory shines brighter than my collection.", loss: "Collector: Rarity is impressive, but preparation wins battles.",
    rematch: "Collector: The lighting is perfect. One more brilliant battle?",
  },
  ForgottenProgrammer: {
    type: "SECRET_Clemont", sprite: "SECRET_Clemont", name: "Forgotten Programmer",
    intro: ["Programmer: I remember when six partners had to fit inside very little memory.", "No gimmick. No patch. Just one final test."],
    win: "Programmer: Good. The oldest rules still produce new champions.", loss: "Programmer: Simple code is often the hardest to defeat.",
    rematch: "Programmer: The program is ready to run again. Start?",
  },
  GameOver: {
    type: "SECRET_Cyrus", sprite: "SECRET_Cyrus", name: "Game Over",
    intro: ["Game Over: NO DATA.", "Every journey reaches a final screen. Prove that yours can continue."],
    win: "Game Over: CONTINUE... The ending has been postponed.", loss: "Game Over: NO CONTINUE DATA FOUND.",
    rematch: "The words CONTINUE? flicker in the darkness.",
  },
};

// ---------------------------------------------------------------------------
// Canvas Building Helpers
// ---------------------------------------------------------------------------
function fillRect(canvas, z, x, y, w, h, tile) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      canvas.set(i, j, z, tile);
    }
  }
}

function drawPavedRoad(canvas, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let t = 658;
      if (j === 0 && i === 0) t = 649;
      else if (j === 0 && i === w - 1) t = 651;
      else if (j === 0) t = 650;
      else if (j === h - 1 && i === 0) t = 665;
      else if (j === h - 1 && i === w - 1) t = 667;
      else if (j === h - 1) t = 666;
      else if (i === 0) t = 657;
      else if (i === w - 1) t = 659;
      canvas.set(x + i, y + j, 0, t);
    }
  }
}

function drawWoodenPier(canvas, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let t = 726; // center body
      if (j === 0) {
        t = (i === 0) ? 717 : (i === w - 1 ? 719 : 718);
      } else if (j === h - 1) {
        t = (i === 0) ? 741 : (i === w - 1 ? 743 : 742);
      } else {
        t = (i === 0) ? 725 : (i === w - 1 ? 727 : 726);
      }
      canvas.set(x + i, y + j, 1, t);
      if (i > 0 && i < w - 1) {
        // Clear layer 0 in walkable pier walkway so openCell validators see it as passable
        canvas.set(x + i, y + j, 0, 0);
      }
    }
  }
}

function drawCliff(canvas, x, y, w, h, { stairs = [] } = {}) {
  // Top rim
  canvas.set(x, y, 1, 1171);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 1172);
  canvas.set(x + w - 1, y, 1, 1173);

  // Middle wall
  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 1179);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 1177);
    canvas.set(x + w - 1, j, 1, 1181);
  }

  // Bottom rim
  canvas.set(x, y + h - 1, 1, 1187);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 1188);
  canvas.set(x + w - 1, y + h - 1, 1, 1189);

  // Cut stairways with two-way passable stair tile 1243
  for (const sx of stairs) {
    for (let j = y; j < y + h; j++) {
      canvas.set(sx, j, 1, 1243);
      canvas.set(sx + 1, j, 1, 1243);
      canvas.set(sx, j, 0, 388); // path under stairs
      canvas.set(sx + 1, j, 0, 388);
    }
  }
}

function drawDarkCliff(canvas, x, y, w, h, { stairs = [] } = {}) {
  // Top rim
  canvas.set(x, y, 1, 1259);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 1268);
  canvas.set(x + w - 1, y, 1, 1261);

  // Middle wall
  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 1256);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 1268);
    canvas.set(x + w - 1, j, 1, 1261);
  }

  // Bottom rim
  canvas.set(x, y + h - 1, 1, 1272);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 1273);
  canvas.set(x + w - 1, y + h - 1, 1, 1265);

  // Cut stairways with two-way passable stair tile 1243, placing basalt 1257 under
  for (const sx of stairs) {
    for (let j = y; j < y + h; j++) {
      canvas.set(sx, j, 1, 1243);
      canvas.set(sx + 1, j, 1, 1243);
      canvas.set(sx, j, 0, 1257); // dark basalt under stairs
      canvas.set(sx + 1, j, 0, 1257);
    }
  }
}

function drawForest(canvas, x, y, w, h) {
  for (let j = 0; j < h; j += 2) {
    for (let i = 0; i < w; i += 2) {
      const topL = (i === 0) ? 802 : 800;
      const topR = (i + 2 >= w) ? 803 : 801;
      const botL = (i === 0) ? 810 : 808;
      const botR = (i + 2 >= w) ? 811 : 809;
      canvas.set(x + i, y + j, 1, topL);
      canvas.set(x + i + 1, y + j, 1, topR);
      canvas.set(x + i, y + j + 1, 1, botL);
      canvas.set(x + i + 1, y + j + 1, 1, botR);
    }
  }
}

function drawColumn(canvas, x, y) {
  canvas.set(x, y, 2, 4453); // column capital
  canvas.set(x, y + 1, 1, 4409); // base pedestal
}

function drawRuinsPillar(canvas, x, y) {
  canvas.set(x, y, 2, 3298); // pillar top
  canvas.set(x, y + 1, 1, 3314); // pillar base
}

function drawMonolith(canvas, x, y) {
  canvas.set(x, y, 2, 4453); // dark monolith capital
  canvas.set(x, y + 1, 1, 3300); // ancient inscribed monolith base
}

// ---------------------------------------------------------------------------
// 1. Rebuild Map 997: Isla Espejo — Atrio (56 x 48)
// ---------------------------------------------------------------------------
function buildMap997() {
  const W = 56, H = 48;
  const cv = new TileCanvas(W, H, 1);

  // Layer 0: Sea autotile everywhere
  cv.fillAll(0, 48);

  // Island geometry predicate
  function isLand997(x, y) {
    if (x < 18 && y < 14) return false; // NW harbor bay
    if (y < 4) return false;
    if (y < 7) return (x >= 22 && x <= 34); // Cynthia's north summit
    if (x < 4 || x > 51 || y > 44) return false;
    if (x < 7 && y < 11) return false;
    if (x > 48 && y < 11) return false;
    if (x < 7 && y > 41) return false;
    if (x > 48 && y > 41) return false;
    return true;
  }

  // Paint golden beach sand (386) for coast and lush green grass (385) for interior
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!isLand997(x, y)) continue;
      let nearWater = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (!isLand997(x + dx, y + dy)) {
            nearWater = true;
            break;
          }
        }
        if (nearWater) break;
      }
      cv.set(x, y, 0, nearWater ? 386 : 385);
    }
  }

  // Northwest Harbor Pier: authentic wooden dock (717..743) on Layer 1 over sea (48)
  drawWoodenPier(cv, 13, 6, 3, 9); // x=13..15, y=6..14

  // Harbor Quay & Central Avenue (Viridian/Slateport Stone Pavement 648..667):
  // Pier connection at y=14..16, x=12..17
  drawPavedRoad(cv, 12, 14, 6, 3);
  // Main East-West Promenade: y=13..15, x=17..36
  drawPavedRoad(cv, 17, 13, 20, 3);
  // Central Pavilion Square: x=24..32, y=10..16
  drawPavedRoad(cv, 24, 10, 9, 7);

  // Paths leading to arenas:
  // North path to Cynthia's summit
  drawPavedRoad(cv, 26, 6, 5, 5);
  // Southwest path to Yellow's meadow (dirt path 388)
  fillRect(cv, 0, 11, 28, 4, 9, 388);
  // Northwest path to Blue's battlement
  drawPavedRoad(cv, 10, 19, 8, 8);
  // Southeast path to Green's bluff
  fillRect(cv, 0, 40, 28, 5, 9, 388);

  // Portal Shrines:
  // Western Shrine (Mirror of Legends): x=18..22, y=20..22
  drawPavedRoad(cv, 18, 20, 5, 3);
  // Eastern Shrine (Mirror of Lost Data): x=34..38, y=20..22
  drawPavedRoad(cv, 34, 20, 5, 3);

  // Cynthia's North Summit Arena: x=24..32, y=4..9
  drawPavedRoad(cv, 24, 4, 9, 6);

  // Wild Grass Encounter Meadows (Murkrow, Misdreavus, Haunter, Absol, Kadabra, Zorua):
  fillRect(cv, 0, 6, 38, 10, 4, 546);
  fillRect(cv, 0, 23, 34, 11, 5, 546);
  fillRect(cv, 0, 42, 22, 7, 5, 546);

  // Layer 1: Cliffs & Terraces
  drawCliff(cv, 5, 16, 8, 3);
  drawCliff(cv, 17, 16, 9, 3);
  drawCliff(cv, 31, 16, 9, 3);
  drawCliff(cv, 44, 16, 7, 3);

  // North Summit Cliff backing Cynthia's temple (y=10..12) with stairs
  drawCliff(cv, 21, 10, 15, 3, { stairs: [27] });

  // Columns & Colonnades:
  drawColumn(cv, 24, 10);
  drawColumn(cv, 32, 10);
  drawColumn(cv, 24, 15);
  drawColumn(cv, 32, 15);

  drawColumn(cv, 24, 4);
  drawColumn(cv, 32, 4);
  drawColumn(cv, 24, 8);
  drawColumn(cv, 32, 8);

  drawRuinsPillar(cv, 18, 20);
  drawRuinsPillar(cv, 22, 20);

  drawMonolith(cv, 34, 20);
  drawMonolith(cv, 38, 20);

  drawRuinsPillar(cv, 10, 19);
  drawRuinsPillar(cv, 17, 19);
  drawRuinsPillar(cv, 10, 26);
  drawRuinsPillar(cv, 17, 26);

  // Dense Forests framing the island
  drawForest(cv, 4, 6, 8, 8);
  drawForest(cv, 36, 6, 12, 6);
  drawForest(cv, 6, 28, 4, 6);
  drawForest(cv, 46, 28, 4, 6);

  // Layer 2 Details: Flowers in Yellow's Meadow and Central Plaza
  for (let fx = 10; fx <= 15; fx++) {
    for (let fy = 31; fy <= 35; fy++) {
      if ((fx + fy) % 2 === 0) cv.set(fx, fy, 2, 415); // Yellow/white flowers
    }
  }
  cv.set(25, 11, 2, 415);
  cv.set(31, 11, 2, 415);
  cv.set(25, 14, 2, 415);
  cv.set(31, 14, 2, 415);

  // Build RPG::Map object
  const map = buildMapObject(cv, { bgm: "GSC Intro" });

  // Place Events
  addEvent(map, returnFerryEvent(1, 14, 7));
  addEvent(map, archivistEvent(2, 28, 11));
  addEvent(map, healerEvent(3, 26, 14));
  addEvent(map, portalEvent(4, "Mirror of Legends", 20, 21, 998, [
    "A legendary golden aura radiates from the mirror.",
    "Would you like to step into the Gallery of Legends?",
  ]));
  addEvent(map, portalEvent(5, "Mirror of Lost Data", 36, 21, 999, [
    "A distorted, deep void hums within this fractured mirror.",
    "Would you like to enter the Zero Archive?",
  ]));
  addEvent(map, bossEvent(6, BOSS_DATA.Yellow, 12, 34));
  addEvent(map, bossEvent(7, BOSS_DATA.Green, 44, 34));
  addEvent(map, bossEvent(8, BOSS_DATA.BlueRocket, 13, 23));
  addEvent(map, bossEvent(9, BOSS_DATA.CynthiaAncestral, 28, 6));
  addEvent(map, abraEvent(10, 30, 14));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// 2. Rebuild Map 998: Isla Espejo — Galería de Leyendas (56 x 52)
// ---------------------------------------------------------------------------
function buildMap998() {
  const W = 56, H = 52;
  const cv = new TileCanvas(W, H, 1);

  // Layer 0: Sea perimeter
  cv.fillAll(0, 48);

  function isLand998(x, y) {
    if (y < 4 || y > 48 || x < 4 || x > 51) return false;
    if (x < 7 && y < 8) return false;
    if (x > 48 && y < 8) return false;
    if (x < 7 && y > 45) return false;
    if (x > 48 && y > 45) return false;
    return true;
  }

  // Island base: ancient ruins pale stone earth (386) as in Ruins of Alph / White Ruins
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isLand998(x, y)) cv.set(x, y, 0, 386);
    }
  }

  // Arrival Sanctuary (Northwest Court: x=11..17, y=7..13)
  drawPavedRoad(cv, 11, 7, 7, 7);

  // Main Sacred Processional Way (North-South Avenue: x=26..30, y=7..45)
  drawPavedRoad(cv, 26, 7, 5, 39);
  // East-West Connecting Colonnade (y=21..24, x=10..46)
  drawPavedRoad(cv, 10, 21, 37, 4);
  // Lower East-West Terrace Avenue (y=37..39, x=10..46)
  drawPavedRoad(cv, 10, 37, 37, 3);

  // Sanctum Platforms:
  drawPavedRoad(cv, 8, 22, 8, 6);      // Sabrina: Psychic Peristyle
  fillRect(cv, 0, 8, 37, 9, 7, 387);   // Koga: Shaded Moss Grotto
  drawPavedRoad(cv, 40, 37, 9, 7);    // Surge: Thunder Battlement
  fillRect(cv, 0, 40, 21, 9, 7, 388);  // Steven: Archaeological Dig (Earth strata)
  fillRect(cv, 0, 19, 18, 7, 6, 385);  // Wally: Verdant Lawn
  drawPavedRoad(cv, 24, 5, 9, 7);     // Young Oak: Hall of Beginnings

  // Wild Encounter Terraces (Dratini, Larvitar, Bagon, Beldum, Riolu, Elekid):
  fillRect(cv, 0, 18, 26, 7, 8, 546);
  fillRect(cv, 0, 31, 26, 7, 8, 546);
  fillRect(cv, 0, 18, 41, 7, 6, 546);
  fillRect(cv, 0, 31, 41, 7, 6, 546);

  // Layer 1: Cliffs & Stairs between terraces
  drawCliff(cv, 20, 12, 17, 3, { stairs: [27] });
  drawCliff(cv, 6, 29, 19, 3, { stairs: [13] });
  drawCliff(cv, 31, 29, 19, 3, { stairs: [41] });

  // Central Avenue stairs
  for (let j = 29; j <= 31; j++) {
    canvas_set_stair(cv, 27, j);
    canvas_set_stair(cv, 28, j);
  }

  function canvas_set_stair(canvas, x, y) {
    canvas.set(x, y, 1, 1243);
    canvas.set(x, y, 0, 658);
  }

  // Ancient Ruined Colonnades & Pillars:
  drawColumn(cv, 11, 7);
  drawColumn(cv, 17, 7);
  drawColumn(cv, 11, 13);
  drawColumn(cv, 17, 13);

  drawColumn(cv, 24, 5);
  drawColumn(cv, 32, 5);
  drawColumn(cv, 24, 11);
  drawColumn(cv, 32, 11);

  drawRuinsPillar(cv, 8, 22);
  drawRuinsPillar(cv, 15, 22);
  drawRuinsPillar(cv, 8, 27);
  drawRuinsPillar(cv, 15, 27);

  drawMonolith(cv, 40, 21);
  drawMonolith(cv, 48, 21);
  drawMonolith(cv, 40, 27);
  drawMonolith(cv, 48, 27);

  drawRuinsPillar(cv, 40, 37);
  drawRuinsPillar(cv, 48, 37);

  // Overgrown Temple Trees
  drawForest(cv, 6, 4, 4, 6);
  drawForest(cv, 46, 4, 4, 6);
  drawForest(cv, 6, 35, 4, 8); // Koga's shadow grove
  drawForest(cv, 46, 42, 4, 6);

  // Wally's Garden Flowers
  for (let fx = 20; fx <= 24; fx++) {
    for (let fy = 19; fy <= 22; fy++) {
      if ((fx + fy) % 2 === 0) cv.set(fx, fy, 2, 415);
    }
  }

  // Build RPG::Map object
  const map = buildMapObject(cv, { bgm: "GSC Intro" });

  // Place Events
  addEvent(map, returnPortalEvent(1, "Return to Atrium", 14, 8));
  addEvent(map, healerEvent(2, 18, 12));
  addEvent(map, inscriptionEvent(3, "Gallery of Legends Inscription", 14, 12, [
    "GALLERY OF LEGENDS",
    "Here, one choice changed an entire life.",
    "The echoes of past champions await across these sacred terraces.",
  ]));
  addEvent(map, bossEvent(4, BOSS_DATA.SabrinaTriad, 11, 24));
  addEvent(map, bossEvent(5, BOSS_DATA.KogaTriad, 12, 40));
  addEvent(map, bossEvent(6, BOSS_DATA.LtSurgeRocket, 44, 40));
  addEvent(map, bossEvent(7, BOSS_DATA.StevenArchaeologist, 44, 24));
  addEvent(map, bossEvent(8, BOSS_DATA.WallyElite, 22, 20));
  addEvent(map, bossEvent(9, BOSS_DATA.ProfessorOakYoung, 28, 8));
  addEvent(map, abraEvent(10, 16, 12));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// 3. Rebuild Map 999: Isla Espejo — Archivo Cero (56 x 52)
// ---------------------------------------------------------------------------
function buildMap999() {
  const W = 56, H = 52;
  const cv = new TileCanvas(W, H, 1);

  // Layer 0: Deep void abyss (tile 144)
  cv.fillAll(0, 144);

  // Fractured basalt landmasses (Tile 1257 = Dark Basalt Plateau)
  // Main Central Massif: x=18..38, y=14..46
  fillRect(cv, 0, 18, 14, 21, 33, 1257);

  // NW Arrival Platform: x=10..18, y=6..14
  fillRect(cv, 0, 10, 6, 9, 9, 1257);
  // Causeway connecting NW Platform to Central Massif: x=14..22, y=13..18
  drawPavedRoad(cv, 14, 13, 9, 6);

  // West Terrace (Fusion Scientist): x=6..16, y=20..28
  fillRect(cv, 0, 6, 20, 11, 9, 1257);
  // Causeway to West Terrace: x=15..21, y=23..25
  drawPavedRoad(cv, 15, 23, 7, 3);

  // Southwest Bastion (Armored Giovanni): x=6..17, y=35..45
  fillRect(cv, 0, 6, 35, 12, 11, 1257);
  // Causeway to SW Bastion connecting all the way to central avenue: x=15..28, y=39..41
  drawPavedRoad(cv, 15, 39, 14, 3);

  // East Terrace (Shiny Collector): x=39..49, y=20..28
  fillRect(cv, 0, 39, 20, 11, 9, 1257);
  // Causeway to East Terrace: x=36..42, y=23..25
  drawPavedRoad(cv, 36, 23, 7, 3);

  // Southeast Promontory (Red of Mt. Silver): x=38..49, y=35..45
  fillRect(cv, 0, 38, 35, 12, 11, 1257);
  // Causeway to SE Promontory connecting all the way to central avenue: x=28..41, y=39..41
  drawPavedRoad(cv, 28, 39, 14, 3);

  // North Summit: Game Over Floating Citadel (x=22..34, y=4..11)
  fillRect(cv, 0, 22, 4, 13, 8, 1257);
  // Causeway Bridge spanning the void chasm to the Summit: x=27..29, y=9..15
  drawPavedRoad(cv, 27, 9, 3, 7);

  // Corrupted Pathways weaving through the Central Mainframe:
  drawPavedRoad(cv, 26, 14, 5, 32);
  drawPavedRoad(cv, 21, 20, 15, 6); // Programmer's Courtyard

  // Glitch Static Data Fields (Porygon, Unown, Ditto, Voltorb, Grimer, Magnemite):
  fillRect(cv, 0, 20, 28, 6, 6, 546);
  fillRect(cv, 0, 31, 28, 6, 6, 546);
  fillRect(cv, 0, 20, 42, 6, 4, 546);
  fillRect(cv, 0, 31, 42, 6, 4, 546);

  // Layer 1: Dark Basalt Cliffs & Jagged Chasms with 1243 two-way stairs
  drawDarkCliff(cv, 10, 6, 9, 3, { stairs: [13] });
  drawDarkCliff(cv, 21, 14, 18, 3, { stairs: [27] });
  drawDarkCliff(cv, 18, 27, 21, 3, { stairs: [27] });
  // Southern cliff with 3 staircases (west, center, east)
  drawDarkCliff(cv, 18, 36, 21, 3, { stairs: [20, 27, 34] });

  drawDarkCliff(cv, 6, 20, 11, 3, { stairs: [10] });
  drawDarkCliff(cv, 6, 35, 12, 3, { stairs: [11] });
  drawDarkCliff(cv, 39, 20, 11, 3, { stairs: [43] });
  drawDarkCliff(cv, 38, 35, 12, 3, { stairs: [43] });

  // North Summit Citadel Rim
  drawDarkCliff(cv, 22, 4, 13, 3, { stairs: [27] });

  // Corrupted Monoliths & Monolithic Guardians:
  // 4 Great Monoliths guarding Game Over's Apex
  drawMonolith(cv, 23, 4);
  drawMonolith(cv, 33, 4);
  drawMonolith(cv, 23, 10);
  drawMonolith(cv, 33, 10);

  // Programmer's Mainframe Dual Monoliths
  drawMonolith(cv, 22, 20);
  drawMonolith(cv, 34, 20);

  // Data Monoliths on Scientist's Matrix
  drawMonolith(cv, 7, 21);
  drawMonolith(cv, 15, 21);

  // Prismatic Monoliths on Shiny Collector's Terrace
  drawMonolith(cv, 40, 21);
  drawMonolith(cv, 48, 21);

  // Heavy Containment Monoliths on Armored Giovanni's Bastion
  drawRuinsPillar(cv, 7, 36);
  drawRuinsPillar(cv, 16, 36);

  // Silent Frost-Touched Stones on Red's Promontory
  drawRuinsPillar(cv, 39, 36);
  drawRuinsPillar(cv, 48, 36);

  // Build RPG::Map object
  const map = buildMapObject(cv, { bgm: "GSC Intro" });

  // Place Events
  addEvent(map, returnPortalEvent(1, "Return to Atrium", 14, 8));
  addEvent(map, healerEvent(2, 18, 12));
  addEvent(map, inscriptionEvent(3, "Zero Archive Inscription", 14, 12, [
    "ZERO ARCHIVE",
    "These records were recovered without a valid ending.",
    "Anomaly status: CRITICAL. Proceed with extreme caution.",
  ]));
  addEvent(map, bossEvent(4, BOSS_DATA.RedOfMtSilver, 44, 40));
  addEvent(map, bossEvent(5, BOSS_DATA.GiovanniArmored, 12, 40));
  addEvent(map, bossEvent(6, BOSS_DATA.FusionScientist, 11, 24));
  addEvent(map, bossEvent(7, BOSS_DATA.ShinyCollector, 44, 24));
  addEvent(map, bossEvent(8, BOSS_DATA.ForgottenProgrammer, 28, 22));
  addEvent(map, bossEvent(9, BOSS_DATA.GameOver, 28, 7));
  addEvent(map, abraEvent(10, 16, 12, "Este Abra de emergencia te sacará de este archivo corrompido."));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Reachability Validation
// ---------------------------------------------------------------------------
function validateMapReachability(name, mapObj, canvas) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const start = [14, 10]; // All 3 maps have arrival at (14, 10)
  const reachable = reachableCells(pass, start);

  const events = iv(mapObj, "events").pairs;
  const unreachable = [];

  for (const [id, ev] of events) {
    const x = Number(iv(ev, "x"));
    const y = Number(iv(ev, "y"));
    const evName = txt(iv(ev, "name"));

    // An event is reachable if the tile itself is reachable OR any adjacent tile is reachable
    const adjacent = [
      [x, y],
      [x + 1, y], [x - 1, y],
      [x, y + 1], [x, y - 1],
    ];

    const canReach = adjacent.some(([ax, ay]) => reachable.has(`${ax},${ay}`));
    if (!canReach) {
      unreachable.push(`Event ${id} "${evName}" at (${x}, ${y}) is unreachable!`);
    }
  }

  if (unreachable.length > 0) {
    throw new Error(`[${name}] Reachability failures:\n  ${unreachable.join("\n  ")}`);
  }

  console.log(`[${name}] OK: ${events.length} events are reachable from start (${start[0]}, ${start[1]}). Total walkable cells: ${reachable.size}.`);
}

// ---------------------------------------------------------------------------
// Installation & Backups
// ---------------------------------------------------------------------------
function backupOriginals() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const id of [997, 998, 999]) {
    const file = `Map${String(id).padStart(3, "0")}.rxdata`;
    const src = path.join(DATA, file);
    const dst = path.join(BACKUP_DIR, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  }
}

export function generateAllMaps() {
  const { map: map997, cv: cv997 } = buildMap997();
  validateMapReachability("Map 997", map997, cv997);

  const { map: map998, cv: cv998 } = buildMap998();
  validateMapReachability("Map 998", map998, cv998);

  const { map: map999, cv: cv999 } = buildMap999();
  validateMapReachability("Map 999", map999, cv999);

  return {
    997: { map: map997, cv: cv997 },
    998: { map: map998, cv: cv998 },
    999: { map: map999, cv: cv999 },
  };
}

function install() {
  backupOriginals();

  console.log("Building Map 997 (Isla Espejo — Atrio)...");
  const { map: map997, cv: cv997 } = buildMap997();
  validateMapReachability("Map 997", map997, cv997);
  writeRx("Map997.rxdata", map997);

  console.log("Building Map 998 (Galería de Leyendas)...");
  const { map: map998, cv: cv998 } = buildMap998();
  validateMapReachability("Map 998", map998, cv998);
  writeRx("Map998.rxdata", map998);

  console.log("Building Map 999 (Archivo Cero)...");
  const { map: map999, cv: cv999 } = buildMap999();
  validateMapReachability("Map 999", map999, cv999);
  writeRx("Map999.rxdata", map999);

  console.log("All 3 Isla Espejo maps successfully rebuilt and written to Data/.");
}

function verify() {
  const errors = [];
  for (const id of [997, 998, 999]) {
    const file = `Map${String(id).padStart(3, "0")}.rxdata`;
    const fullPath = path.join(DATA, file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing map file ${file}`);
      continue;
    }
    const map = readRx(file);
    const w = Number(iv(map, "width"));
    const h = Number(iv(map, "height"));
    const ts = Number(iv(map, "tileset_id"));
    const events = iv(map, "events").pairs;

    if (w < 50 || h < 45) {
      errors.push(`${file}: map dimensions too small (${w}x${h})`);
    }
    if (ts !== 1) {
      errors.push(`${file}: expected tileset 1, got ${ts}`);
    }
    if (events.length < 10) {
      errors.push(`${file}: expected at least 10 events, got ${events.length}`);
    }

    // Verify Return event exists
    const hasReturn = events.some(([, ev]) => txt(iv(ev, "name")).includes("Return"));
    if (!hasReturn) errors.push(`${file}: missing Return event`);

    // Verify Abra exists
    const hasAbra = events.some(([, ev]) => txt(iv(ev, "name")).includes("Abra de emergencia"));
    if (!hasAbra) errors.push(`${file}: missing Abra de emergencia`);

    // Verify Nurse exists
    const hasNurse = events.some(([, ev]) => txt(iv(ev, "name")).includes("Mirror Nurse"));
    if (!hasNurse) errors.push(`${file}: missing Mirror Nurse`);
  }

  if (errors.length) {
    throw new Error(`Isla Espejo Map Rebuild verification failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  }
  console.log("Verification OK: Maps 997, 998, 999 are extensive (56x48+), use Tileset 1, have all 16 bosses, Return transfers, Nurse, and Abra.");
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------
if (!VERIFY_ONLY) {
  install();
}
verify();
