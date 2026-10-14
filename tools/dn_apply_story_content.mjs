#!/usr/bin/env node
/**
 * dn_apply_story_content.mjs — pasada final de guion, memoria, estatuas, ciudades y exploración (E9).
 *
 * Aplica el libreto de `content/dimensional_nightmare_story.json` y las fichas del Director de Nivel
 * (`content/dimensional_nightmare_visual_plan.json` + `TOWN_SERVICE_SPECS`) sobre los datos compilados:
 *   - NPCs con memoria de visita, rutinas animadas en su sitio y reacciones a fase/entorno;
 *   - reubicación segura de eventos sólidos (`character_name != ""`) fuera de cuellos de botella de 1 celda;
 *   - una escena de llegada y tres interludios emotivos por mundo;
 *   - dos puntos de exploración por mapa en los 151 mapas (`DN_MAP_MEMORY` y `DN_STATUE_LORE`);
 *   - Centro Pokémon (`DN_TOWN_CENTER`) y Tienda (`DN_TOWN_MART`) contextuales en los 13 asentamientos;
 *   - una decisión reversible por cada episodio/mundo y una vitrina con consecuencias;
 *   - una guardia de fase por mapa para partidas guardadas dentro del contenido.
 *
 * Uso:
 *   node tools/dn_apply_story_content.mjs            # aplicar
 *   node tools/dn_apply_story_content.mjs --verify   # comprobar datos instalados y transitabilidad con sólidos
 *   node tools/dn_apply_story_content.mjs --dry-run  # plan sin escribir
 */
import fs from "node:fs";
import path from "node:path";
import { RHash, RObject } from "../web/js/marshal.js";
import {
  ROOT, DATA, S, txt, mapFile, readMap, writeMap, backup,
  cmd, condition, graphic, event, texts, script, selfSwitch, wait, readData,
  parseMap, passabilityOf, reachableCells,
} from "./lib/dn_rmxp.mjs";
import { TOWN_SERVICE_SPECS } from "./dn_build_visual_plan.mjs";

const STORY_FILE = path.join(ROOT, "content", "dimensional_nightmare_story.json");
const BLUEPRINT_FILE = path.join(ROOT, "content", "dimensional_nightmare_events.json");
const BUILT_FILE = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const PASS_FILE = path.join(ROOT, "content", "dimensional_nightmare_passability.json");
const EVENTS_BUILT_FILE = path.join(ROOT, "content", "dimensional_nightmare_events_built.json");
const EXPERIENCE_FILE = path.join(ROOT, "content", "dimensional_nightmare_visual_plan.json");
const VERIFY = process.argv.includes("--verify");
const DRY = process.argv.includes("--dry-run");
const story = JSON.parse(fs.readFileSync(STORY_FILE, "utf8"));
const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_FILE, "utf8"));
const builtPlan = JSON.parse(fs.readFileSync(BUILT_FILE, "utf8"));
const passabilityJson = JSON.parse(fs.readFileSync(PASS_FILE, "utf8")).maps ?? {};
const eventsBuiltJson = JSON.parse(fs.readFileSync(EVENTS_BUILT_FILE, "utf8")).maps ?? {};
const experience = JSON.parse(fs.readFileSync(EXPERIENCE_FILE, "utf8"));
const mapMeta = new Map(builtPlan.maps.map((item) => [item.id, item]));
const visualByMap = new Map(experience.maps.map((item) => [item.map, item]));
const episodeByKey = new Map(blueprint.episodes.map((episode) => [episode.key, episode]));
const episodesWithBoss = blueprint.episodes.filter((episode) => episode.boss);
const PHASE_A_SWITCHES = Object.freeze({ EP01: 903, EP02: 904, EP03: 905, EP04: 906, EP05: 907, EP06: 908, W7: 928, W8: 929, W9: 930 });
const PHASE_B_VARIABLE_BASE = 289;
const PHASE_NAMES = Object.freeze({
  1: "Normal", 2: "Duda", 3: "Grieta", 4: "Ruido", 5: "Pérdida", 6: "Ruptura parcial", 7: "Ruptura",
});
const OWNED_NAMES = new Set([
  "DN_PHASE_GUARD",
  "DN_MAP_MEMORY",
  "DN_STATUE_LORE",
  "DN_TOWN_CENTER",
  "DN_TOWN_MART",
  "DN_OPENING_SCENE",
  "DN_DECISION_ARCHIVE",
  ...Array.from({ length: 5 }, (_, i) => `DN_PHASE_SCENE_${i + 3}`),
]);
const OWNED_PREFIXES = ["DN_DECISION_", "DN_PHASE_SCENE_"];
const OPENING_MAPS = Object.freeze({
  HUB: 2040, EP01: 2041, EP02: 2057, EP03: 2073, EP04: 2088, EP05: 2104, EP06: 2120,
  NEXO: 2136, LIGA: 2141, W7: 2143, W8: 2159, W9: 2175,
});
const HUE = Object.freeze({ EP01: 0, EP02: 36, EP03: 72, EP04: 144, EP05: 216, EP06: 288, NEXO: 180, LIGA: 180, W7: 12, W8: 30, W9: 300, HUB: 180 });
const HUB_OPENING = [
  "Rotom: Nueve rutas aparecen en el registro; sólo las que has desbloqueado responden.",
  "Ash: No voy a cambiar sus historias. Voy a escuchar lo que dejaron en el camino.",
  "Rotom: Las marcas de regreso están guardadas. Puedes abandonar la Antesala cuando quieras."
];
const WORLD_RANGES = Object.freeze({
  EP01: [2041, 2056], EP02: [2057, 2072], EP03: [2073, 2087], EP04: [2088, 2103],
  EP05: [2104, 2119], EP06: [2120, 2135], NEXO: [2136, 2140], W7: [2143, 2158],
  W8: [2159, 2174], W9: [2175, 2190],
});
const DECISION_WORLDS = Object.keys(WORLD_RANGES).filter((key) => story.worlds[key]?.decision);
const allDecisionProfiles = [
  ...DECISION_WORLDS.map((key) => [key, story.worlds[key].decision]),
  ["LIGA", story.worlds.LIGA.decision],
];

const hasMarker = (name) => OWNED_NAMES.has(name) || OWNED_PREFIXES.some((prefix) => name.startsWith(prefix));
const makePage = ({
  cond = condition(), gfx = graphic(), trigger = 0, through = false, moveType = 0,
  moveSpeed = 2, moveFrequency = 2, stepAnime = false, directionFix = false, list = [cmd(0)],
} = {}) => new RObject("RPG::Event::Page", [
  ["@condition", cond], ["@graphic", gfx],
  ["@move_type", moveType], ["@move_speed", moveSpeed], ["@move_frequency", moveFrequency],
  ["@move_route", new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", true], ["@list", []]])],
  ["@walk_anime", true], ["@step_anime", stepAnime], ["@direction_fix", directionFix],
  ["@through", through], ["@always_on_top", false], ["@trigger", trigger], ["@list", list],
]);
const listText = (lines, indent = 0) => texts(lines, indent);
const scriptCommand = (source, indent = 0) => script(source, indent);
const varAtLeast = (id, value) => condition({ variable: [id, value] });
const selfIs = (letter) => condition({ self: letter });
const cleanName = (name) => String(name ?? "").replace(/\s*\(.*?\)\s*/g, "").trim();
const worldForEpisode = (key) => story.worlds[key] ?? story.worlds.NEXO;

function mapPhase(mapId) {
  if (mapId === 2040) return 0;
  if (mapId === 2141) return 5;
  if (mapId === 2142) return 7;
  const key = mapMeta.get(mapId)?.episode;
  const range = WORLD_RANGES[key];
  if (!range) return 0;
  const [from, to] = range;
  const span = Math.max(1, to - from);
  return Math.max(1, Math.min(7, Math.round(((mapId - from) / span) * 6) + 1));
}

function npcEventName(npc) {
  const key = npc.name.replace(/[^\w]/g, "_").slice(0, 24);
  const suffix = (npc.groupCount ?? 1) > 1 ? `_${String(npc.instance).padStart(2, "0")}` : "";
  return `NPC_${key}${suffix}`;
}

function extractQuote(notes) {
  const fixed = notes.match(/Fija:\s*«([^»]+)»/i);
  if (fixed) return fixed[1].trim();
  const quoted = notes.match(/«([^»]{8,})»/);
  return quoted?.[1]?.trim() ?? null;
}

function npcRole(npc) {
  const type = String(npc.type).toLowerCase();
  if (type.includes("interdimensional") || type.includes("entidad") || type.includes("jefe final")) return "interdimensional";
  if (type.includes("consciente")) return "conscious";
  return "normal";
}

function eventGraphic(eventObject) {
  const first = eventObject.getIvar("@pages")?.[0]?.getIvar("@graphic");
  const charName = txt(first?.getIvar("@character_name"));
  const hue = first?.getIvar("@character_hue") ?? 0;
  const tile = first?.getIvar("@tile_id") ?? 0;
  const opacity = first?.getIvar("@opacity") ?? 255;
  return graphic(charName, first?.getIvar("@direction") ?? 2, first?.getIvar("@pattern") ?? 1, { hue, tile, opacity });
}

function eventHasSolidSprite(eventObject) {
  return (eventObject.getIvar("@pages") ?? []).some(
    (page) => txt(page.getIvar("@graphic")?.getIvar("@character_name")) !== "",
  );
}

function npcPages(npc, world, existingGraphic) {
  const name = cleanName(npc.displayName ?? npc.name);
  const quoted = extractQuote(npc.notes);
  const role = npcRole(npc);
  const lively = role === "normal" && !/no caminan|no se mueve|no habla|solo texto|sin sprite|no se puede hablar/i.test(npc.notes);
  if (role === "interdimensional") {
    const fixed = quoted ?? world.interdimensional.phase4;
    return [
      makePage({ gfx: existingGraphic, list: [...listText([`${name}: «${fixed}»`]), cmd(0)] }),
      makePage({ cond: varAtLeast(266, 4), gfx: existingGraphic, trigger: 0, stepAnime: true,
        list: [...listText([`${name}: «${world.interdimensional.phase4}»`]), cmd(0)] }),
      makePage({ cond: varAtLeast(266, 7), gfx: existingGraphic, trigger: 0,
        list: [...listText([`${name}: «${world.interdimensional.phase7}»`]), cmd(0)] }),
    ];
  }

  const lines = role === "conscious" ? world.conscious : world.normal;
  if (role === "normal") {
    const firstLine = quoted ?? lines[0];
    // moveType: 0 con stepAnime evita que el NPC camine hacia un pasillo de 1 celda y bloquee al jugador en Game.exe
    return [
      makePage({ gfx: existingGraphic, moveType: 0, stepAnime: lively,
        list: [...listText([`${name}: ${firstLine}`]), selfSwitch("A"), cmd(0)] }),
      makePage({ cond: selfIs("A"), gfx: existingGraphic, moveType: 0, stepAnime: lively,
        list: [...listText([`${name}: ${lines[1]}`]), selfSwitch("B"), cmd(0)] }),
      makePage({ cond: selfIs("B"), gfx: existingGraphic, moveType: 0, stepAnime: lively,
        list: [...listText([`${name}: ${lines[2]}`]), selfSwitch("C"), cmd(0)] }),
      makePage({ cond: selfIs("C"), gfx: existingGraphic, moveType: 0, stepAnime: lively,
        list: [...listText([`${name}: ${lines[3]}`]), selfSwitch("D"), cmd(0)] }),
      makePage({ cond: selfIs("D"), gfx: existingGraphic, moveType: 0,
        list: [...listText([`${name}: ${lines[4]}`]), selfSwitch("E"), cmd(0)] }),
      makePage({ cond: selfIs("E"), gfx: existingGraphic, trigger: 0, list: [cmd(0)] }),
      makePage({ cond: varAtLeast(266, 6), gfx: existingGraphic, trigger: 0, list: [cmd(0)] }),
    ];
  }

  const firstLine = quoted ?? lines[0];
  const disappearsAtRupture = (Number(npc.map) + Number(npc.instance ?? 1)) % 3 === 0;
  return [
    makePage({ gfx: existingGraphic, list: [...listText([`${name}: ${firstLine}`]), selfSwitch("A"), cmd(0)] }),
    makePage({ cond: selfIs("A"), gfx: existingGraphic, moveType: 0, stepAnime: true,
      list: [...listText([`${name}: ${lines[1]}`]), selfSwitch("B"), cmd(0)] }),
    makePage({ cond: selfIs("B"), gfx: existingGraphic, moveType: 0, stepAnime: true,
      list: [...listText([`${name}: ${lines[2]}`]), selfSwitch("C"), cmd(0)] }),
    makePage({ cond: selfIs("C"), gfx: existingGraphic, list: [...listText([`${name}: ${lines[3]}`]), selfSwitch("D"), cmd(0)] }),
    makePage({ cond: selfIs("D"), gfx: existingGraphic, trigger: 0, list: [cmd(0)] }),
    makePage({ cond: varAtLeast(266, 6), gfx: disappearsAtRupture ? graphic("") : existingGraphic,
      trigger: 0, through: true, list: [cmd(0)] }),
  ];
}

function guardEvent(mapId, id, x, y) {
  const phase = mapPhase(mapId);
  return event(id, "DN_PHASE_GUARD", x, y, [
    makePage({ trigger: 3, gfx: graphic(""), through: true,
      list: [scriptCommand(`$game_variables[266] = ${phase} # DN_FASE_MAPA`), selfSwitch("A"), cmd(0)] }),
    makePage({ cond: selfIs("A"), gfx: graphic(""), through: true, list: [cmd(0)] }),
  ]);
}

function memoryEvent(map, visual, id, x, y) {
  const episodeKey = map.episode ?? "HUB";
  const title = map.title ?? visual.title ?? `Map${map.id}`;
  const hook = visual.hook ?? map.role ?? "una marca sin clasificar";
  const decor0 = visual.decorations?.[0] ?? hook;
  const decor1 = visual.decorations?.[1] ?? "trazos irregulares en el suelo";
  const color = HUE[episodeKey] ?? HUE.HUB;
  const objectName = /^(camara|altar|nucleo|templo|cripta|mausoleo|sala|fosa)$/i.test(visual.archetype ?? "") ? "Object rock" : "Object ball special";
  const base = [
    `Rotom — Registro de campo: ${title} (${visual.biome ?? episodeKey}).`,
    `La señal local es «${hook}». Alrededor destacan ${decor0} y ${decor1}.`,
    "Ash: No vinimos a borrar lo que pasó aquí; lo guardamos como memoria del camino."
  ];
  const pages = [
    makePage({ gfx: graphic(objectName, 2, 1, { hue: color }), through: true, list: [...listText(base), cmd(0)] }),
    makePage({ cond: varAtLeast(266, 5), gfx: graphic(objectName, 2, 1, { hue: color }), through: true,
      list: [...listText([`El detalle de ${title} (${decor0}) cambió de posición respecto a la primera lectura.`, "Rotom: La fase del mundo altera el relieve, pero el registro conserva la huella original."]), cmd(0)] }),
    makePage({ cond: varAtLeast(266, 7), gfx: graphic(objectName, 2, 1, { hue: color }), through: true,
      list: [...listText([`En plena ruptura, «${hook}» permanece como punto fijo de referencia.`, "Ash: El mundo puede quebrarse; nuestra ruta de regreso sigue guardada."]), cmd(0)] }),
  ];
  return event(id, "DN_MAP_MEMORY", x, y, pages);
}

function statueEvent(map, visual, id, x, y) {
  const episodeKey = map.episode ?? "HUB";
  const title = map.title ?? visual.title ?? `Map${map.id}`;
  const color = HUE[episodeKey] ?? HUE.HUB;
  const decorRest = (visual.decorations ?? []).slice(2, 5).join("; ") || "piedra tallada a mano y bordes fracturados";
  const relief = visual.terrainProfile ?? "desnivel escalonado y borde asimétrico";
  const pages = [
    makePage({
      gfx: graphic("Object rock", 2, 1, { hue: color }),
      through: true,
      list: [
        ...listText([
          `Estatua y relieve de ${title}: ${decorRest}.`,
          `Rotom: El terreno sigue un perfil de ${relief} bajo una atmósfera de ${visual.atmosphere ?? "eco contenido"}.`
        ]),
        cmd(0),
      ],
    }),
    makePage({
      cond: varAtLeast(266, 5),
      gfx: graphic("Object rock", 2, 1, { hue: color }),
      through: true,
      list: [
        ...listText([
          `La inscripción de la estatua en ${title} parece responder al avance de la fase.`,
          "Ash: Alguien dejó esta marca en el relieve para que ningún viajero caminara a ciegas."
        ]),
        cmd(0),
      ],
    }),
  ];
  return event(id, "DN_STATUE_LORE", x, y, pages);
}

function townCenterEvent(mapId, spec, color, id, x, y) {
  const healScript = "begin; pbHealAll; rescue; $Trainer.heal_party if defined?($Trainer) && $Trainer; end";
  const center = spec.center;
  return event(id, "DN_TOWN_CENTER", x, y, [
    makePage({
      gfx: graphic("Object pokedex", 2, 1, { hue: color }),
      through: true,
      list: [
        ...listText([`[${center.title}]`, ...center.lines]),
        scriptCommand(healScript),
        ...listText(["¡Tus Pokémon han recuperado toda su salud y energía!"]),
        cmd(0),
      ],
    }),
    makePage({
      cond: varAtLeast(266, 6),
      gfx: graphic("Object pokedex", 2, 1, { hue: color }),
      through: true,
      list: [
        ...listText([`[${center.title}]`, ...(center.ruptureLines ?? center.lines)]),
        scriptCommand(healScript),
        ...listText(["¡A pesar de la fase del mundo, tu equipo ha sido restaurado por completo!"]),
        cmd(0),
      ],
    }),
  ]);
}

function townMartEvent(mapId, spec, color, id, x, y) {
  const mart = spec.mart;
  if (mart.operational) {
    const stock = (mart.items ?? ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"]).map((i) => `:${i}`).join(", ");
    const martCall = `begin; pbPokemonMart([${stock}]); rescue; pbMessage("El inventario local sigue registrado, pero la ventana comercial no pudo abrirse."); end`;
    return event(id, "DN_TOWN_MART", x, y, [
      makePage({
        gfx: graphic("Object ball", 2, 1, { hue: color }),
        through: true,
        list: [
          ...listText([`[${mart.title}]`, ...mart.lines]),
          scriptCommand(martCall),
          cmd(0),
        ],
      }),
    ]);
  }
  const gift = mart.giftItem ?? "FULLRESTORE";
  return event(id, "DN_TOWN_MART", x, y, [
    makePage({
      gfx: graphic("Object ball", 2, 1, { hue: color }),
      through: true,
      list: [
        ...listText([`[${mart.title}]`, ...mart.lines]),
        scriptCommand(`begin; pbReceiveItem(:${gift}); rescue; end`),
        selfSwitch("A"),
        cmd(0),
      ],
    }),
    makePage({
      cond: selfIs("A"),
      gfx: graphic("Object ball", 2, 1, { hue: color }),
      through: true,
      list: [
        ...listText([`[${mart.title}]`, ...(mart.afterLines ?? mart.lines)]),
        cmd(0),
      ],
    }),
  ]);
}

function openingEvent(worldKey, mapId, id, x, y) {
  const world = worldKey === "HUB" ? null : worldForEpisode(worldKey);
  const lines = world?.opening ?? HUB_OPENING;
  return event(id, "DN_OPENING_SCENE", x, y, [
    makePage({ trigger: 3, gfx: graphic(""), through: true,
      list: [...listText(lines.slice(0, 2)), wait(18), ...listText(lines.slice(2)), selfSwitch("A"), cmd(0)] }),
    makePage({ cond: selfIs("A"), gfx: graphic(""), through: true, list: [cmd(0)] }),
  ]);
}

function phaseSceneEvent(worldKey, phase, id, x, y) {
  const world = worldForEpisode(worldKey);
  const lines = world.phaseScenes[String(phase)] ?? [`El mundo entra en la fase ${phase}: ${PHASE_NAMES[phase]}.`];
  return event(id, `DN_PHASE_SCENE_${phase}`, x, y, [
    makePage({ cond: varAtLeast(266, phase), trigger: 3, gfx: graphic(""), through: true,
      list: [...listText(lines), wait(12), selfSwitch("A"), cmd(0)] }),
    makePage({ cond: selfIs("A"), gfx: graphic(""), through: true, list: [cmd(0)] }),
  ]);
}

function phaseSceneMap(worldKey, phase) {
  if (worldKey === "LIGA") return phase === 3 ? null : phase === 5 ? 2141 : 2142;
  const [from, to] = WORLD_RANGES[worldKey];
  for (let id = from; id <= to; id++) if (mapPhase(id) >= phase) return id;
  return to;
}

function bossPagesForEpisode(episode) {
  const phaseB = episode.boss?.phaseB;
  const total = phaseB?.maps?.length || phaseB?.cells?.length || (phaseB?.kind === "letras" ? 7 : 4);
  const index = episodesWithBoss.findIndex((candidate) => candidate.key === episode.key);
  return { switchA: episode.bossSwitch ?? PHASE_A_SWITCHES[episode.key], stepVariable: PHASE_B_VARIABLE_BASE + index, stepTotal: total };
}

function decisionCommands(worldKey, decision) {
  const variable = decision.variable;
  const [first, second] = decision.choices;
  const lines = [
    cmd(111, [12, S(`$game_variables[${variable}] == 0`)]),
    ...listText(decision.prompt, 1),
    cmd(102, [[S(first.label), S(second.label)], 2], 1),
    cmd(402, [0, S(first.label)], 1),
    scriptCommand(`$game_variables[${variable}] = ${first.value}`, 2),
    ...listText([first.response], 2),
    cmd(402, [1, S(second.label)], 1),
    scriptCommand(`$game_variables[${variable}] = ${second.value}`, 2),
    ...listText([second.response], 2),
    cmd(404, [], 1),
    cmd(411),
    cmd(111, [12, S(`$game_variables[${variable}] == ${first.value}`)], 1),
    ...listText([first.response], 2),
    cmd(411, [], 1),
    ...listText([second.response], 2),
    cmd(412, [], 1),
    cmd(412),
    cmd(0),
  ];
  return lines;
}

function decisionEvent(worldKey, episode, id, x, y) {
  const decision = story.worlds[worldKey].decision;
  const switchA = episode ? bossPagesForEpisode(episode).switchA : 920;
  const stepVariable = episode ? bossPagesForEpisode(episode).stepVariable : null;
  const stepTotal = episode ? bossPagesForEpisode(episode).stepTotal : null;
  const ready = episode
    ? condition({ sw: episode.seal, sw2: switchA, variable: [stepVariable, stepTotal] })
    : condition({ sw: 920, sw2: 921 });
  return event(id, `DN_DECISION_${worldKey}`, x, y, [
    makePage({ gfx: graphic(""), through: true, list: [cmd(0)] }),
    makePage({ cond: ready, gfx: graphic("Object ball special", 2, 1, { hue: HUE[worldKey] ?? 180 }), through: true,
      list: decisionCommands(worldKey, decision) }),
  ]);
}

function decisionArchiveEvent(id, x, y) {
  const lines = [];
  for (const [key, decision] of allDecisionProfiles) {
    const variable = decision.variable;
    const one = decision.choices[0], two = decision.choices[1];
    lines.push(scriptCommand(`pbMessage("${key}: ${one.archive}") if $game_variables[${variable}] == ${one.value}`));
    lines.push(scriptCommand(`pbMessage("${key}: ${two.archive}") if $game_variables[${variable}] == ${two.value}`));
  }
  lines.push(scriptCommand('pbMessage("Final del Nexo: la rendija quedó sellada.") if $game_switches[935] && $game_variables[276] == 0'));
  lines.push(scriptCommand('pbMessage("Final del Nexo: la rendija quedó abierta.") if $game_switches[935] && $game_variables[276] == 1'));
  lines.push(scriptCommand(`pbMessage("Todavía no hay elecciones archivadas.") if [${allDecisionProfiles.map(([, d]) => d.variable).join(", ")}].all? { |i| $game_variables[i] == 0 } && !$game_switches[935]`));
  return event(id, "DN_DECISION_ARCHIVE", x, y, [
    makePage({ gfx: graphic("Object rock", 2, 1, { hue: 180 }), through: true,
      list: [...listText(["Vitrina del Testigo", "El Rotom guarda las decisiones; ninguna altera el acceso, el sello ni la seguridad del equipo."]), ...lines, cmd(0)] }),
  ]);
}

// --------------------------------------------------------------- malla y transitabilidad con sólidos
function curatedReachableSet(mapId, width, height, defaultStart) {
  const info = passabilityJson[String(mapId)];
  if (!info) return null;
  const open = new Set(info.open ?? []);
  const blocked = new Set([...(info.computed ?? []), ...(info.blocked ?? [])]);
  for (const [x0, y0, x1, y1] of info.openRects ?? []) {
    for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) {
        open.add(`${x},${y}`);
        blocked.delete(`${x},${y}`);
      }
    }
  }
  for (const [x0, y0, x1, y1] of info.blockRects ?? []) {
    for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) {
        blocked.add(`${x},${y}`);
        open.delete(`${x},${y}`);
      }
    }
  }
  const walk = (x, y) => x >= 0 && y >= 0 && x < width && y < height && (open.has(`${x},${y}`) || !blocked.has(`${x},${y}`));
  const start = eventsBuiltJson[String(mapId)]?.entry ?? defaultStart;
  if (!start || !walk(start[0], start[1])) return null;
  const seen = new Set([`${start[0]},${start[1]}`]);
  const q = [[start[0], start[1]]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const k = `${nx},${ny}`;
      if (!seen.has(k) && walk(nx, ny)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  return seen;
}

function bfsWithSolids(pass, width, height, start, solidSet) {
  const startKey = `${start[0]},${start[1]}`;
  const seen = new Set([startKey]);
  const q = [[start[0], start[1]]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy, d, od] of [[0, -1, 8, 2], [0, 1, 2, 8], [-1, 0, 4, 6], [1, 0, 6, 4]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen.has(k)) continue;
      if (solidSet.has(k)) continue;
      if (pass.passable(x, y, d) && pass.passable(nx, ny, od)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  return seen;
}

function canReachAllEvents(pass, width, height, start, solidSet, requiredStepCells, requiredAdjCells) {
  const reach = bfsWithSolids(pass, width, height, start, solidSet);
  for (const key of requiredStepCells) {
    if (!reach.has(key)) return { ok: false, reach };
  }
  for (const key of requiredAdjCells) {
    const [x, y] = key.split(",").map(Number);
    const adj = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => reach.has(`${x + dx},${y + dy}`));
    if (!adj) return { ok: false, reach };
  }
  return { ok: true, reach };
}

function installMap(mapId, openingForMap, decisionsForMap, phaseScenesForMap) {
  const file = path.join(DATA, mapFile(mapId));
  if (!fs.existsSync(file)) throw new Error(`falta ${mapFile(mapId)}`);
  const map = readMap(mapId);
  const oldPairs = map.getIvar("@events")?.pairs ?? [];
  const kept = oldPairs.filter(([, obj]) => !hasMarker(txt(obj.getIvar("@name"))));
  const parsed = parseMap(map);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const meta = mapMeta.get(mapId);
  const bfsStart = meta?.bfs?.entry ?? [Math.floor(parsed.width / 2), Math.max(0, parsed.height - 2)];
  const entryEv = kept.find(([, obj]) => /_entrada$|^LIGA_LLEGADA$/.test(txt(obj.getIvar("@name"))))?.[1];
  const actualStart = entryEv ? [entryEv.getIvar("@x"), entryEv.getIvar("@y")] : bfsStart;

  const tileReach = reachableCells(pass, actualStart);
  const curatedReach = curatedReachableSet(mapId, parsed.width, parsed.height, bfsStart);
  const validCells = new Set([...tileReach].filter((k) => !curatedReach || curatedReach.has(k)));
  if (!validCells.size) {
    for (const k of tileReach) validCells.add(k);
  }

  // Separamos eventos invisibles (deben poder pisarse) y eventos con sprite (son sólidos en Game.exe).
  const occupied = new Set();
  const solidSet = new Set();
  const rawStepCells = new Set();
  const movableSolids = [];

  for (const [, obj] of kept) {
    const name = txt(obj.getIvar("@name"));
    const x = obj.getIvar("@x"), y = obj.getIvar("@y");
    const key = `${x},${y}`;
    const isSolid = eventHasSolidSprite(obj);
    const isMovable = isSolid && /^(NPC_|MEDALLA_|EV_NEXO_FINAL$|EV_EP01_JEFE$)/.test(name) && ![2040, 2141, 2142].includes(mapId);
    if (isMovable) {
      movableSolids.push(obj);
    } else {
      occupied.add(key);
      if (isSolid) solidSet.add(key);
      else rawStepCells.add(key);
    }
  }

  const baseOpenReach = bfsWithSolids(pass, parsed.width, parsed.height, actualStart, solidSet);
  const requiredStepCells = new Set([...rawStepCells].filter((k) => baseOpenReach.has(k)));
  const requiredWallAdjCells = new Set([...rawStepCells].filter((k) => !baseOpenReach.has(k)));

  function pickSafeSolidSpot(desired, preferFar = false) {
    let best = null, bestScore = -Infinity;
    const currentReach = bfsWithSolids(pass, parsed.width, parsed.height, actualStart, solidSet);
    for (const key of validCells) {
      if (key === `${actualStart[0]},${actualStart[1]}` || key === `${bfsStart[0]},${bfsStart[1]}`) continue;
      if (occupied.has(key) || solidSet.has(key) || requiredStepCells.has(key)) continue;
      const [x, y] = key.split(",").map(Number);
      const nextSolid = new Set([...solidSet, key]);
      const nextAdj = new Set([...nextSolid, ...requiredWallAdjCells]);
      const check = canReachAllEvents(pass, parsed.width, parsed.height, actualStart, nextSolid, requiredStepCells, nextAdj);
      if (!check.ok) continue;
      const preservesAll = check.reach.size === currentReach.size - 1;
      const dist = Math.abs(x - desired[0]) + Math.abs(y - desired[1]);
      const score = (preservesAll ? 100000 : check.reach.size * 100) + (preferFar ? dist * 10 : -dist * 10);
      if (score > bestScore) {
        bestScore = score;
        best = [x, y];
      }
    }
    return best;
  }

  // Si algún NPC/medalla/evento con sprite estaba sobre un cuello de botella de 1 celda, lo movemos a la celda segura más cercana.
  for (const obj of movableSolids) {
    const x = obj.getIvar("@x"), y = obj.getIvar("@y");
    const spot = pickSafeSolidSpot([x, y], false);
    if (!spot) throw new Error(`Map${mapId}: no hay celda sólida segura para ${txt(obj.getIvar("@name"))}`);
    obj.setIvar("@x", spot[0]);
    obj.setIvar("@y", spot[1]);
    const k = `${spot[0]},${spot[1]}`;
    occupied.add(k);
    solidSet.add(k);
  }
  void baseOpenReach;

  const freeInvisibleCell = (focus = actualStart) => {
    let best = null, scoreBest = -Infinity;
    for (const key of validCells) {
      if (occupied.has(key)) continue;
      const [x, y] = key.split(",").map(Number);
      const d = Math.abs(x - focus[0]) + Math.abs(y - focus[1]);
      const s = d * 100 - Math.abs(x - parsed.width / 2) - Math.abs(y - parsed.height / 2) * 0.2;
      if (s > scoreBest) { scoreBest = s; best = [x, y]; }
    }
    if (best) occupied.add(`${best[0]},${best[1]}`);
    return best;
  };

  const freeSolidCell = (focus = actualStart, preferFar = true) => {
    const spot = pickSafeSolidSpot(focus, preferFar);
    if (spot) {
      const k = `${spot[0]},${spot[1]}`;
      occupied.add(k);
      solidSet.add(k);
    }
    return spot;
  };

  const owned = [];
  let nextId = Math.max(0, ...kept.map(([key]) => typeof key === "number" ? key : 0)) + 1;
  const addAt = (builtEvent) => { if (builtEvent) owned.push([nextId++, builtEvent]); };
  const visual = visualByMap.get(mapId) ?? {};
  const color = HUE[meta?.episode ?? "HUB"] ?? HUE.HUB;

  // 1. Guardia de fase (evento invisible autorun one-shot)
  const guardCell = freeInvisibleCell(actualStart);
  if (guardCell) addAt(guardEvent(mapId, nextId, ...guardCell));

  // 2. Punto de exploración / memoria del mapa (evento sólido en rincón seguro)
  const memoryCell = freeSolidCell(actualStart, true);
  if (!memoryCell) throw new Error(`Map${mapId}: no hay celda alcanzable libre para DN_MAP_MEMORY`);
  addAt(memoryEvent(meta, visual, nextId, ...memoryCell));

  // 3. Estatua / relieve / elemento decorativo inspeccionable (evento sólido en rincón opuesto seguro)
  const statueCell = freeSolidCell(memoryCell, true);
  if (!statueCell) throw new Error(`Map${mapId}: no hay celda alcanzable libre para DN_STATUE_LORE`);
  addAt(statueEvent(meta, visual, nextId, ...statueCell));

  // 4. Servicios urbanos contextuales (Centro Pokémon y Tienda en los 13 asentamientos)
  const townSpec = TOWN_SERVICE_SPECS[mapId];
  if (townSpec) {
    const centerCell = freeSolidCell(actualStart, false);
    if (!centerCell) throw new Error(`Map${mapId}: no hay celda libre para DN_TOWN_CENTER`);
    addAt(townCenterEvent(mapId, townSpec, color, nextId, ...centerCell));

    const martCell = freeSolidCell(centerCell, false);
    if (!martCell) throw new Error(`Map${mapId}: no hay celda libre para DN_TOWN_MART`);
    addAt(townMartEvent(mapId, townSpec, color, nextId, ...martCell));
  }

  // 5. Escena de llegada y escenas emotivas por fase (invisibles)
  if (openingForMap) {
    const spot = freeInvisibleCell(actualStart);
    if (!spot) throw new Error(`Map${mapId}: no hay celda para la escena de llegada`);
    addAt(openingEvent(openingForMap, mapId, nextId, ...spot));
  }
  for (const { worldKey, phase } of phaseScenesForMap ?? []) {
    const spot = freeInvisibleCell(actualStart);
    if (!spot) throw new Error(`Map${mapId}: no hay celda para la escena de fase ${phase}`);
    addAt(phaseSceneEvent(worldKey, phase, nextId, ...spot));
  }

  // 6. Decisiones y archivo (sólidos cuando su página se activa)
  for (const { worldKey, episode } of decisionsForMap ?? []) {
    const spot = freeSolidCell(actualStart, true);
    if (!spot) throw new Error(`Map${mapId}: no hay celda para la decisión ${worldKey}`);
    addAt(decisionEvent(worldKey, episode, nextId, ...spot));
  }
  if (mapId === 2040) {
    const spot = freeSolidCell(actualStart, true);
    if (!spot) throw new Error("Map2040: no hay celda para la vitrina de decisiones");
    addAt(decisionArchiveEvent(nextId, ...spot));
  }

  map.setIvar("@events", new RHash([...kept, ...owned]));
  if (!DRY) {
    backup(mapFile(mapId));
    writeMap(mapId, map);
  }
  return { kept: kept.length, added: owned.length, storyEvents: owned.map(([, obj]) => txt(obj.getIvar("@name"))) };
}

function patchNpcs() {
  const byMap = new Map();
  for (const episode of blueprint.episodes) {
    for (const npc of episode.npcs) {
      const key = `${npc.map}:${npcEventName(npc)}`;
      if (!byMap.has(npc.map)) byMap.set(npc.map, new Map());
      byMap.get(npc.map).set(key, { npc, worldKey: episode.key });
    }
  }
  let patched = 0, missing = 0;
  for (const [mapId, entries] of byMap) {
    const map = readMap(mapId);
    for (const [, ev] of map.getIvar("@events")?.pairs ?? []) {
      const eventName = txt(ev.getIvar("@name"));
      const item = entries.get(`${mapId}:${eventName}`);
      if (!item) continue;
      const { npc, worldKey } = item;
      ev.setIvar("@pages", npcPages(npc, worldForEpisode(worldKey), eventGraphic(ev)));
      patched++;
    }
    const found = new Set((map.getIvar("@events")?.pairs ?? []).map(([, ev]) => txt(ev.getIvar("@name"))));
    for (const eventName of entries.keys()) {
      if (!found.has(eventName.slice(`${mapId}:`.length))) { missing++; console.error(`Map${mapId}: falta NPC ${eventName.slice(`${mapId}:`.length)}`); }
    }
    if (!VERIFY && !DRY) { backup(mapFile(mapId)); writeMap(mapId, map); }
  }
  return { patched, missing };
}

function buildInstallPlan() {
  const openAt = new Map(Object.entries(OPENING_MAPS).map(([key, mapId]) => [mapId, key]));
  const decisionsAt = new Map();
  for (const key of DECISION_WORLDS) {
    const episode = episodeByKey.get(key);
    const mapId = WORLD_RANGES[key][1];
    if (!decisionsAt.has(mapId)) decisionsAt.set(mapId, []);
    decisionsAt.get(mapId).push({ worldKey: key, episode });
  }
  if (!decisionsAt.has(2040)) decisionsAt.set(2040, []);
  decisionsAt.get(2040).push({ worldKey: "LIGA", episode: null });
  const phaseAt = new Map();
  for (const worldKey of Object.keys(story.worlds)) {
    const world = story.worlds[worldKey];
    if (!world.phaseScenes) continue;
    for (const phase of [3, 5, 7]) {
      const mapId = phaseSceneMap(worldKey, phase);
      if (mapId === null) continue;
      if (!phaseAt.has(mapId)) phaseAt.set(mapId, []);
      phaseAt.get(mapId).push({ worldKey, phase });
    }
  }
  return { openAt, decisionsAt, phaseAt };
}

function verify() {
  let failures = 0;
  const ok = (condition, message) => { if (!condition) { failures++; console.error(`  FALLA: ${message}`); } };
  const mapIds = builtPlan.maps.map((map) => map.id);
  const { openAt, decisionsAt, phaseAt } = buildInstallPlan();
  let memoryCount = 0, statueCount = 0, townCenterCount = 0, townMartCount = 0;
  let guardCount = 0, openingCount = 0, phaseSceneCount = 0, choiceCount = 0, npcCount = 0;
  const variableWrites = new Set();

  for (const mapId of mapIds) {
    const map = readMap(mapId);
    const parsed = parseMap(map);
    const pass = passabilityOf(parsed, parsed.tilesetId);
    const pairs = map.getIvar("@events")?.pairs ?? [];
    const names = new Set(pairs.map(([, ev]) => txt(ev.getIvar("@name"))));
    ok(names.has("DN_PHASE_GUARD"), `Map${mapId}: falta guardia de fase`);
    ok(names.has("DN_MAP_MEMORY"), `Map${mapId}: falta punto de exploración DN_MAP_MEMORY`);
    ok(names.has("DN_STATUE_LORE"), `Map${mapId}: falta estatua/relieve inspeccionable DN_STATUE_LORE`);
    guardCount += Number(names.has("DN_PHASE_GUARD"));
    memoryCount += Number(names.has("DN_MAP_MEMORY"));
    statueCount += Number(names.has("DN_STATUE_LORE"));

    if (TOWN_SERVICE_SPECS[mapId]) {
      ok(names.has("DN_TOWN_CENTER"), `Map${mapId}: falta Centro Pokémon contextual DN_TOWN_CENTER`);
      ok(names.has("DN_TOWN_MART"), `Map${mapId}: falta Tienda contextual DN_TOWN_MART`);
      townCenterCount += Number(names.has("DN_TOWN_CENTER"));
      townMartCount += Number(names.has("DN_TOWN_MART"));
    }

    const expectedOpening = openAt.get(mapId);
    if (expectedOpening) { ok(names.has("DN_OPENING_SCENE"), `Map${mapId}: falta escena de llegada`); openingCount += Number(names.has("DN_OPENING_SCENE")); }
    for (const { phase } of phaseAt.get(mapId) ?? []) {
      ok(names.has(`DN_PHASE_SCENE_${phase}`), `Map${mapId}: falta escena de fase ${phase}`);
      phaseSceneCount += Number(names.has(`DN_PHASE_SCENE_${phase}`));
    }
    for (const { worldKey } of decisionsAt.get(mapId) ?? []) {
      const name = `DN_DECISION_${worldKey}`;
      const ev = pairs.find(([, item]) => txt(item.getIvar("@name")) === name)?.[1];
      ok(!!ev, `Map${mapId}: falta decisión ${worldKey}`);
      if (ev) {
        choiceCount++;
        const commands = (ev.getIvar("@pages") ?? []).flatMap((page) => page.getIvar("@list") ?? []);
        const scripts = commands.filter((command) => command.getIvar("@code") === 355).map((command) => txt(command.getIvar("@parameters")?.[0]));
        const variable = story.worlds[worldKey].decision.variable;
        ok(commands.some((command) => command.getIvar("@code") === 102), `${name}: no presenta opciones`);
        ok(scripts.some((line) => line.includes(`$game_variables[${variable}] = 1`))
          && scripts.some((line) => line.includes(`$game_variables[${variable}] = 2`)), `${name}: no guarda ambas respuestas`);
        variableWrites.add(variable);
      }
    }
    if (mapId === 2040) ok(names.has("DN_DECISION_ARCHIVE"), "Map2040: falta vitrina de decisiones");
    for (const [, ev] of pairs) {
      const name = txt(ev.getIvar("@name"));
      if (name.startsWith("NPC_")) {
        const matching = (blueprint.episodes.find((ep) => ep.mapRange.from <= mapId && ep.mapRange.to >= mapId)?.npcs ?? [])
          .find((npc) => npcEventName(npc) === name);
        if (!matching) continue;
        const pages = ev.getIvar("@pages") ?? [];
        const role = npcRole(matching);
        ok(pages.length >= (role === "normal" ? 7 : role === "conscious" ? 6 : 3), `Map${mapId}: ${name} no tiene estados de ${role}`);
        const sources = pages.flatMap((page) => page.getIvar("@list") ?? [])
          .filter((command) => command.getIvar("@code") === 401).map((command) => txt(command.getIvar("@parameters")?.[0]));
        ok(sources.some((line) => line.length > 16), `Map${mapId}: ${name} no tiene diálogo final`);
        if (role !== "interdimensional") {
          const localSwitches = pages.flatMap((page) => page.getIvar("@list") ?? [])
            .filter((command) => command.getIvar("@code") === 123).map((command) => txt(command.getIvar("@parameters")?.[0]));
          ok(["A", "B", "C"].every((letter) => localSwitches.includes(letter)), `Map${mapId}: ${name} no registra memoria de visita`);
        }
        npcCount++;
      }
    }
    for (const [, ev] of pairs) {
      for (const page of ev.getIvar("@pages") ?? []) {
        for (const command of page.getIvar("@list") ?? []) {
          if (command.getIvar("@code") !== 355) continue;
          const line = txt(command.getIvar("@parameters")?.[0]);
          ok(!/\$game_variables\[264\]\s*(?:=(?!=)|\+=|-=|\*=|\/=)/.test(line), `Map${mapId}: ${txt(ev.getIvar("@name"))} escribe v264`);
        }
      }
    }

    // Verificación de transitabilidad real en Game.exe considerando eventos con sprite como sólidos
    const entryEv = pairs.find(([, obj]) => /_entrada$|^LIGA_LLEGADA$/.test(txt(obj.getIvar("@name"))))?.[1];
    const meta = mapMeta.get(mapId);
    const start = entryEv ? [entryEv.getIvar("@x"), entryEv.getIvar("@y")] : (meta?.bfs?.entry ?? [Math.floor(parsed.width / 2), parsed.height - 1]);
    const solidSet = new Set();
    for (const [, ev] of pairs) {
      if (eventHasSolidSprite(ev)) solidSet.add(`${ev.getIvar("@x")},${ev.getIvar("@y")}`);
    }
    const reachWithSolids = bfsWithSolids(pass, parsed.width, parsed.height, start, solidSet);
    for (const [, ev] of pairs) {
      const name = txt(ev.getIvar("@name"));
      if (name === "DN_PHASE_GUARD" || name === "DN_OPENING_SCENE" || name.startsWith("DN_PHASE_SCENE_")) continue;
      const x = ev.getIvar("@x"), y = ev.getIvar("@y");
      const isSolid = eventHasSolidSprite(ev);
      const isSolidOrWall = isSolid || !pass.passable(x, y, 8);
      const reachable = isSolidOrWall
        ? [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => reachWithSolids.has(`${x + dx},${y + dy}`))
        : reachWithSolids.has(`${x},${y}`);
      ok(reachable, `Map${mapId}: ${name} en (${x},${y}) queda bloqueado por eventos con sprite desde (${start[0]},${start[1]})`);
    }
  }

  const variableNames = readData("System.rxdata").getIvar("@variables");
  for (const [key, decision] of allDecisionProfiles) {
    ok(txt(variableNames[decision.variable]) === `DN_DECISION_${key}`, `variable ${decision.variable}: nombre de decisión incorrecto`);
  }
  ok(variableWrites.size === 10, `se esperaban 10 decisiones independientes y hay ${variableWrites.size}`);
  ok(townCenterCount === Object.keys(TOWN_SERVICE_SPECS).length, `se esperaban ${Object.keys(TOWN_SERVICE_SPECS).length} Centros urbanos y hay ${townCenterCount}`);
  ok(townMartCount === Object.keys(TOWN_SERVICE_SPECS).length, `se esperaban ${Object.keys(TOWN_SERVICE_SPECS).length} Tiendas urbanas y hay ${townMartCount}`);
  console.log(`verificación de historia: ${memoryCount}/${mapIds.length} memorias · ${statueCount}/${mapIds.length} estatuas · ${townCenterCount} Centros · ${townMartCount} Tiendas · ${guardCount}/${mapIds.length} fases · ${openingCount} llegadas · ${phaseSceneCount} interludios · ${npcCount} NPCs con estados · ${choiceCount} decisiones · 0 bloqueos por sprites sólidos`);
  if (failures) process.exit(1);
  console.log("verificación de historia OK");
}

if (VERIFY) {
  verify();
} else {
  const { openAt, decisionsAt, phaseAt } = buildInstallPlan();
  const npcStats = patchNpcs();
  if (npcStats.missing) throw new Error(`${npcStats.missing} NPCs no encontrados; no se reconstruyen los eventos automáticamente`);
  let totalAdded = 0;
  for (const map of builtPlan.maps) {
    const summary = installMap(map.id, openAt.get(map.id), decisionsAt.get(map.id), phaseAt.get(map.id));
    totalAdded += summary.added;
  }
  console.log(`${DRY ? "[dry-run] " : ""}guion aplicado: ${npcStats.patched} NPCs con memoria · ${totalAdded} eventos narrativos/estatuas/servicios en ${builtPlan.maps.length} mapas`);
}
