#!/usr/bin/env node
/**
 * apply_dimensional_nightmare_events.mjs — E4: hace jugables los mapas del Nightmare.
 *
 * Sobre los mapas ya construidos por `apply_dimensional_nightmare_maps.mjs`, escribe:
 *   1. CONEXIONES: transferencias encadenadas entre los mapas del episodio y con el hub
 *      (Gruta de los Testigos, Map2030 36,12), resolviendo las celdas con la malla de
 *      `content/dimensional_nightmare_passability.json`;
 *   2. NPCs: los de las tablas del GDD, con su sprite (con respaldo si falta), páginas por
 *      fase (v266) y diálogo derivado de las notas;
 *   3. EVENTOS del índice «Eventos programables»: anomalías (+1 a la variable del episodio y
 *      al total; +1 resonancia cada 3, tope 3), curaciones, objetos y disparadores;
 *   4. JEFE del episodio en su mapa final: fase A con derrota reintentable, luego fase B por pasos;
 *      sólo al cerrar todos los pasos se registran sello/resonancia/recompensa y se abre la salida.
 *
 * No crea trainers ni objetos (eso es del `create` correspondiente): las llamadas van
 * protegidas con `begin/rescue` y lo pendiente queda anotado en el catálogo construido.
 * No toca partidas.
 *
 * Uso:
 *   node tools/apply_dimensional_nightmare_events.mjs --episode EP01
 *   node tools/apply_dimensional_nightmare_events.mjs --all --render
 *   node tools/apply_dimensional_nightmare_events.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RHash, RObject, RString } from "../web/js/marshal.js";
import { parseMap } from "../web/js/rmxp.js";
import { passabilityOf, reachableCells } from "./lib/map_painter.mjs";
import { tableGet } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const CHARS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const BLUEPRINT = path.join(ROOT, "content", "dimensional_nightmare_events.json");
const MAPS = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const PASS = path.join(ROOT, "content", "dimensional_nightmare_passability.json");
const BUILT = path.join(ROOT, "content", "dimensional_nightmare_events_built.json");
const TILESETS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Tilesets");
const RENDER_DIR = path.join(ROOT, "docs", "dn_referencia", "eventos");
const TILE = 32;
const COLUMNS = 8;
const BASE_ID = 384;            // primer id de tile normal (0-47 vacío, 48-383 autotiles)

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const EPISODE = option("--episode", null);
const ALL = argv.includes("--all");
const ONLY = option("--only", null)?.split(",").map(Number).filter(Boolean) ?? null;
const VERIFY = argv.includes("--verify");
const DRY = argv.includes("--dry-run");
const RENDER = argv.includes("--render");

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => { if (!DRY) fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value))); };
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const S = (v) => RString.fromText(String(v));
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));

const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT, "utf8"));
const builtMaps = new Map(JSON.parse(fs.readFileSync(MAPS, "utf8")).maps.map((m) => [m.id, m]));
const passability = JSON.parse(fs.readFileSync(PASS, "utf8")).maps;
const previousBuilt = fs.existsSync(BUILT) ? JSON.parse(fs.readFileSync(BUILT, "utf8")).maps ?? {} : {};
const result = { generatedBy: "tools/apply_dimensional_nightmare_events.mjs", maps: { ...previousBuilt } };
const warnings = [];

// Flags distintas para los nueve combates de fase A; los switches 910–916 quedan reservados
// para compatibilidad con el catálogo antiguo y no se reutilizan como contador global.
const PHASE_A_SWITCHES = Object.freeze({
  EP01: 903, EP02: 904, EP03: 905, EP04: 906, EP05: 907, EP06: 908,
  W7: 928, W8: 929, W9: 930,
});
const PHASE_B_VARIABLE_BASE = 289;
const NEXO_RESOLVED_SWITCH = 935;
const bossEpisodes = blueprint.episodes.filter((episode) => episode.boss);
function phaseASwitch(episode) {
  const id = episode.bossSwitch ?? PHASE_A_SWITCHES[episode.key];
  if (!id) throw new Error(`${episode.key}: falta switch de fase A`);
  return id;
}
function phaseBVariable(episode) {
  const index = bossEpisodes.findIndex((candidate) => candidate.key === episode.key);
  if (index < 0) throw new Error(`${episode.key}: falta índice de variable de fase B`);
  return PHASE_B_VARIABLE_BASE + index;
}
function phaseBTotal(episode) {
  const spec = episode.boss?.phaseB;
  if (!spec) return 0;
  return spec.maps?.length || spec.cells?.length || (spec.kind === "letras" ? 7 : 4);
}

// --------------------------------------------------------------- RMXP bits
const cmd = (code, params = [], indent = 0) => new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
const condition = ({ sw = 0, sw2 = 0, self = "", variable = null } = {}) => new RObject("RPG::Event::Page::Condition", [
  ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
  ["@switch2_valid", !!sw2], ["@switch2_id", sw2 || 1],
  ["@variable_valid", !!variable], ["@variable_id", variable ? variable[0] : 1], ["@variable_value", variable ? variable[1] : 0],
  ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
]);
const graphic = (charName = "", dir = 2, pattern = 1, opts = {}) => new RObject("RPG::Event::Page::Graphic", [
  ["@tile_id", opts.tile ?? 0], ["@character_name", S(charName)], ["@character_hue", 0],
  ["@direction", dir], ["@pattern", pattern], ["@opacity", opts.opacity ?? 255], ["@blend_type", 0],
]);
const moveRoute = () => new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]);
const page = ({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) => new RObject("RPG::Event::Page", [
  ["@condition", cond], ["@graphic", gfx],
  ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
  ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
  ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
  ["@trigger", trigger], ["@list", list],
]);
const event = (id, name, x, y, pages) => new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
const texts = (lines, indent = 0) => [cmd(101, [S("")], indent), ...[].concat(lines).map((line) => cmd(401, [S(line)], indent))];
const script = (line, indent = 0) => cmd(355, [S(line)], indent);
const transfer = (mapId, x, y, dir = 2, indent = 0) => cmd(201, [0, mapId, x, y, dir, 1], indent);
const setSwitch = (id, indent = 0) => cmd(121, [id, id, 0], indent);
const setSelf = (ch, indent = 0) => cmd(123, [S(ch), 0], indent);
const wait = (frames, indent = 0) => cmd(106, [frames], indent);
const plannedItems = new Set([
  ...blueprint.episodes.flatMap((episode) => episode.boss?.reward ? [episode.boss.reward] : []),
  ...[1, 2, 3, 4].map((index) => `DN_PHOTO_0${index}`),
  "DN_ANCLA",
]);
const itemSymbols = new Set([
  ...read("items.dat").pairs.filter(([key]) => key && key.name !== undefined).map(([key]) => key.name),
  ...plannedItems,
]);

// ------------------------------------------------------------- pasabilidad
function maskOf(mapId) {
  const info = passability[String(mapId)];
  const size = builtMaps.get(mapId);
  if (!info || !size) return null;
  const { width, height } = size;
  const open = new Set(info.open ?? []);
  const blocked = new Set([...(info.computed ?? []), ...(info.blocked ?? [])]);
  const rects = (list) => {
    for (const [x0, y0, x1, y1] of list ?? []) {
      for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
        for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) open.add(`${x},${y}`), blocked.delete(`${x},${y}`);
      }
    }
  };
  rects(info.openRects);
  for (const [x0, y0, x1, y1] of info.blockRects ?? []) {
    for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) blocked.add(`${x},${y}`), open.delete(`${x},${y}`);
    }
  }
  const curated = new Set(open);   // suelo curado a mano (open + openRects − blockRects)
  const walkable = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) row.push(open.has(`${x},${y}`) || !blocked.has(`${x},${y}`));
    walkable.push(row);
  }
  return { walkable, width, height, curated };
}

function physicalMaskOf(mapId) {
  const curated = maskOf(mapId);
  if (curated) return curated;
  const file = path.join(DATA, mapFile(mapId));
  if (!fs.existsSync(file)) return null;
  const parsed = parseMap(read(mapFile(mapId)));
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const walkable = Array.from({ length: parsed.height }, (_, y) =>
    Array.from({ length: parsed.width }, (_, x) => pass.passable(x, y, 8)));
  return { width: parsed.width, height: parsed.height, walkable };
}

/**
 * Celda de llegada al hub (Gruta de los Testigos): el plano fija (36,12), pero el mapa
 * 2030 se reconstruyó después; se busca la celda transitable más cercana a esa intención.
 */
function resolveHubCell() {
  const hub = blueprint.hub;
  try {
    const parsed = parseMap(read(mapFile(hub.map)));
    const pass = passabilityOf(parsed, parsed.tilesetId);
    let start = null, startD = Infinity;
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) {
        if (!pass.passable(x, y, 8)) continue;
        const d = Math.abs(x - hub.x) + Math.abs(y - hub.y);
        if (d < startD) { startD = d; start = [x, y]; }
      }
    }
    if (!start) throw new Error("no hay celdas transitables");
    const reachable = reachableCells(pass, start);
    let best = null, bestD = Infinity;
    for (const key of reachable) {
      const [x, y] = key.split(",").map(Number);
      const d = Math.abs(x - hub.x) + Math.abs(y - hub.y);
      if (d < bestD) { bestD = d; best = [x, y]; }
    }
    return { map: hub.map, cell: best ?? start, intended: [hub.x, hub.y], distance: bestD };
  } catch (error) {
    warnings.push(`no se pudo resolver la celda del hub: ${error.message}`);
    return { map: hub.map, cell: [hub.x, hub.y], intended: [hub.x, hub.y], distance: Infinity };
  }
}

const inBounds = (mask, x, y) => x >= 0 && y >= 0 && x < mask.width && y < mask.height;
const walkAt = (mask, x, y) => inBounds(mask, x, y) && mask.walkable[y][x];
function reachableMask(mask, start) {
  if (!mask || !start || !walkAt(mask, start[0], start[1])) return new Set();
  const seen = new Set([`${start[0]},${start[1]}`]);
  const queue = [[start[0], start[1]]];
  for (let at = 0; at < queue.length; at++) {
    const [x, y] = queue[at];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const key = `${nx},${ny}`;
      if (!seen.has(key) && walkAt(mask, nx, ny)) { seen.add(key); queue.push([nx, ny]); }
    }
  }
  return seen;
}

/** Celda de entrada: borde superior más cercano al centro; si no hay, izquierda/derecha/abajo. */
/**
 * El anillo exterior de estos mapas es la banda de muro (a menudo transitable para el
 * motor pero no para el jugador); se penaliza para que las llegadas caigan en el suelo.
 */
const isBorder = (mask, x, y) => x === 0 || y === 0 || x === mask.width - 1 || y === mask.height - 1;
const cellScore = (mask, [x, y], mid, towards) => {
  const dir = towards === "down" ? (mask.height - y) : towards === "right" ? (mask.width - x) : y;
  return dir * 2 + Math.abs(x - mid) * 0.1
    + (mask.curated?.has(`${x},${y}`) ? 0 : 6)
    + (isBorder(mask, x, y) ? 20 : 0);
};
function entryCell(mask) {
  const mid = Math.floor(mask.width / 2);
  const candidates = [];
  for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) if (walkAt(mask, x, y)) candidates.push([x, y]);
  if (!candidates.length) return null;
  candidates.sort((a, b) => cellScore(mask, a, mid, "up") - cellScore(mask, b, mid, "up"));
  return candidates[0];
}
/** Celda de salida hacia el mapa siguiente: preferimos el borde inferior/ derecho. */
function exitCell(mask, towards) {
  const cells = [];
  for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) if (walkAt(mask, x, y)) cells.push([x, y]);
  if (!cells.length) return null;
  const mid = towards === "right" ? Math.floor(mask.height / 2) : Math.floor(mask.width / 2);
  cells.sort((a, b) => cellScore(mask, a, mid, towards) - cellScore(mask, b, mid, towards));
  return cells[0];
}

/** Coloca cerca del punto deseado: espiral sobre celdas transitables libres. */
function placeNear(mask, desired, occupied) {
  if (!mask) return null;
  const [dx, dy] = desired;
  for (let radius = 0; radius < Math.max(mask.width, mask.height); radius++) {
    for (let y = dy - radius; y <= dy + radius; y++) {
      for (let x = dx - radius; x <= dx + radius; x++) {
        if (Math.max(Math.abs(x - dx), Math.abs(y - dy)) !== radius) continue;
        if (!walkAt(mask, x, y)) continue;
        if (occupied.has(`${x},${y}`)) continue;
        return [x, y];
      }
    }
  }
  return null;
}

// ----------------------------------------------------------------- diálogo
const firstSentence = (text) => {
  const clean = text.replace(/\s+/g, " ").trim();
  const m = clean.match(/^(.{15,140}?[.:;])\s/);
  return (m ? m[1] : clean.slice(0, 140)).replace(/^\*\*|\*\*$/g, "");
};
const fixedPhrase = (notes) => {
  const m = notes.match(/Fija:\s*«([^»]+)»/i) ?? notes.match(/«([^»]{10,})»/);
  return m ? m[1] : firstSentence(notes);
};

function npcPages(npc) {
  const type = npc.type.toLowerCase();
  const name = (npc.displayName ?? npc.name).replace(/\s*\(.*?\)\s*/g, "");
  const first = firstSentence(npc.notes);
  const rest = npc.notes.replace(first, "").trim();
  if (type.includes("interdimensional")) {
    return [page({ gfx: graphic(npc.graphic), list: [...texts([`${name}: «${fixedPhrase(npc.notes)}»`]), cmd(0)] })];
  }
  if (type.includes("consciente")) {
    return [
      page({ gfx: graphic(npc.graphic), list: [...texts([`${name}: ${first}`]), cmd(0)] }),
      // en fase ≥5 el NPC consciente ya no está: página sin gráfico y sin comandos
      page({ cond: condition({ variable: [266, 5] }), gfx: graphic(""), list: [cmd(0)] }),
    ];
  }
  const pages = [page({ gfx: graphic(npc.graphic), list: [...texts([`${name}: ${first}`]), cmd(0)] })];
  if (rest.length > 20) {
    pages.push(page({ cond: condition({ variable: [266, 4] }), gfx: graphic(npc.graphic), list: [...texts([`${name}: ${firstSentence(rest)}`]), cmd(0)] }));
  }
  pages.push(page({
    cond: condition({ variable: [266, 6] }),
    gfx: graphic(npc.graphic, 2, 1, { opacity: 200 }),
    list: [...texts([`${name}: (no responde) Mira el hueco donde debería estar su sombra.`]), cmd(0)],
  }));
  return pages;
}

// ----------------------------------------------------------- comandos evento
// Tope del contador total: suma de anomalías declaradas de todos los mundos (77 del primer anillo
// + 35 del segundo). Antes era 77 fijo y el segundo anillo saturaba el contador.
const ANOMALY_TOTAL_CAP = blueprint.episodes.reduce((sum, ep) => sum + (ep.anomalies?.declared ?? 0), 0);

const ROTOM_LEVEL_UPDATE =
  "$game_variables[275] = 0; $game_variables[275] = 1 if $game_variables[265] >= 20; " +
  "$game_variables[275] = 2 if $game_variables[265] >= 40; $game_variables[275] = 3 if $game_variables[265] >= 60; " +
  "$game_variables[275] = 4 if $game_variables[265] >= 80; $game_variables[275] = 5 if $game_variables[265] >= 100";

const ANOMALY_SCRIPT = (episode) =>
  `$game_variables[${episode.anomalyVariable}] += 1; $game_variables[274] = [$game_variables[274] + 1, ${ANOMALY_TOTAL_CAP}].min; ` +
  `$game_variables[265] = [$game_variables[265] + (($game_variables[${episode.anomalyVariable}] % 3 == 0 && $game_variables[${episode.anomalyVariable}] <= 9) ? 1 : 0), 100].min; ` +
  `$game_switches[${episode.cuota}] = true if $game_variables[${episode.anomalyVariable}] >= ${"__TOTAL__"}; ${ROTOM_LEVEL_UPDATE}`;

/** Glitch visual breve y reversible (si el motor no trae el helper, no pasa nada). */
const VISUAL_GLITCH =
  "begin; pbToneChangeAll(Tone.new(-60, -30, -30, 40), 6); Kernel.pbWait(8); " +
  "pbToneChangeAll(Tone.new(0, 0, 0, 0), 12); rescue; end";

/**
 * Una anomalía del §5: aviso emergente, contador (variable del episodio + total + resonancia
 * cada 3, cuota al completar) y, si es visual, un glitch de tono breve. Las auditivas quedan
 * marcadas como pendientes de audio hasta que existan los archivos de «música alterada».
 */
function anomalyPages(item, episode) {
  const list = [
    ...texts([`[${item.code}] ${item.name}`, item.text.slice(0, 220)]),
    script(VISUAL_GLITCH),
    script(ANOMALY_SCRIPT(episode).replace("__TOTAL__", String(episode.anomalies.declared))),
    setSelf("A"),
    cmd(0),
  ];
  return [
    page({ gfx: graphic(""), trigger: item.trigger === "touch" ? 1 : 0, through: true, list }),
    page({
      cond: condition({ self: "A" }), gfx: graphic(""), through: true,
      list: [...texts([`[${item.code}] Ya figura en el Registro Dimensional.`]), cmd(0)],
    }),
  ];
}

/**
 * El índice del GDD es texto narrativo, no una lista de asignaciones ejecutables. Sólo se
 * conservan los efectos explícitos e inocuos (curación y una recompensa cuyo ID exista);
 * los sellos, grietas, fases y contadores se escriben en sus máquinas de estado dedicadas.
 */
function commandsForEvent(ev) {
  const effect = `${ev.detail} ${ev.effect}`;
  const list = [...texts([`[${ev.name}] ${ev.effect || ev.detail}`.slice(0, 240)])];
  if (/curaci/i.test(effect)) list.push(script("begin; pbHealAll; rescue; end"));

  const candidates = [...effect.matchAll(/\b[A-Z][A-Z0-9_]{2,}\b/g)].map((match) => match[0]);
  const item = candidates.find((candidate) => itemSymbols.has(candidate));
  if (item) {
    list.push(script(`begin; pbItemBall(:${item}); rescue; pbMessage("(objeto ${item} pendiente de registrar)"); end`));
    list.push(setSelf("A"));
  }
  list.push(cmd(0));
  return { list, once: !!item, item };
}

const HYPNO_SILENCE_UNTIL = "@dn_ep04_silence_until";
const HYPNO_SILENCERS_FOUND = "@dn_ep04_silencers_found";
const HYPNO_BGM_SILENCED = "@dn_ep04_bgm_silenced";
const HYPNO_BGM_MAP = "@dn_ep04_bgm_map";
const HYPNO_BGM_NAME = "DN_Hypnos_Lullaby";

function hypnoSilencerPages() {
  const activate = [
    ...texts(["El tronco hueco deja escapar la última nota.", "La nana calla durante un minuto; Rotom registra este silenciador."]),
    script(`begin; gs=$game_system; gs.instance_variable_set("${HYPNO_SILENCE_UNTIL}", Time.now.to_i + 60); n=gs.instance_variable_get("${HYPNO_SILENCERS_FOUND}") || 0; gs.instance_variable_set("${HYPNO_SILENCERS_FOUND}", [[n.to_i + 1, 0].max, 6].min); Audio.bgm_fade(1000); gs.instance_variable_set("${HYPNO_BGM_SILENCED}", true); rescue; end`),
    setSelf("A"),
    cmd(0),
  ];
  return [
    page({ list: activate }),
    page({
      cond: condition({ self: "A" }), gfx: graphic(""), through: true,
      list: [...texts(["Este tronco ya está silenciado; la marca sigue en el registro."]), cmd(0)],
    }),
  ];
}

function hypnoSleepPages() {
  const chance = `begin; gs=$game_system; until_at=gs.instance_variable_get("${HYPNO_SILENCE_UNTIL}") || 0; Time.now.to_i >= until_at.to_i && rand(100) < 15; rescue; false; end`;
  const list = [
    wait(2700), // 45 segundos a 60 fps: una tirada por intervalo, nunca cada frame.
    cmd(111, [12, S(chance)]),
    ...texts(["La nana te arrastra los párpados; Rotom corta el eco antes de que alcance al equipo."], 1),
    script(VISUAL_GLITCH, 1),
    cmd(411),
    cmd(412),
    cmd(0),
  ];
  return [page({ trigger: 2, through: true, list })];
}

function hypnoAudioGuardPages() {
  const source = `begin; gs=$game_system; map_id=$game_map.map_id; last_map=gs.instance_variable_get("${HYPNO_BGM_MAP}"); if last_map != map_id; gs.instance_variable_set("${HYPNO_BGM_MAP}", map_id); gs.instance_variable_set("${HYPNO_BGM_SILENCED}", false); end; until_at=gs.instance_variable_get("${HYPNO_SILENCE_UNTIL}") || 0; active=Time.now.to_i < until_at.to_i; silenced=gs.instance_variable_get("${HYPNO_BGM_SILENCED}"); if active && !silenced; Audio.bgm_fade(1000); gs.instance_variable_set("${HYPNO_BGM_SILENCED}", true); elsif !active && silenced; gs.bgm_play(RPG::AudioFile.new("${HYPNO_BGM_NAME}", 52, 100)); gs.instance_variable_set("${HYPNO_BGM_SILENCED}", false); end; rescue; end`;
  return [page({ trigger: 2, through: true, list: [script(source), wait(30), cmd(0)] })];
}

function indexedEventPages(ev) {
  if (ev.name === "EV_HYP_Silenciador") return hypnoSilencerPages();
  if (ev.name === "EV_HYP_Sueno") return hypnoSleepPages();
  const built = commandsForEvent(ev);
  const pages = [page({
    trigger: ev.trigger === "autorun" ? 3 : ev.trigger === "parallel" ? 2 : ev.trigger === "touch" ? 1 : 0,
    through: ev.trigger !== "action",
    list: built.list,
  })];
  if (built.once) pages.push(page({
    cond: condition({ self: "A" }), gfx: graphic(""), through: true,
    list: [...texts([`El objeto ${built.item} ya quedó registrado.`]), cmd(0)],
  }));
  return pages;
}

function nexoResolutionPages() {
  const sealChoice = [
    ...texts(["El Testigo puede cerrar el Nexo, o dejar que la rendija siga respirando.", "Esta decisión quedará registrada."]),
    cmd(102, [[S("Sellar el Nexo"), S("Dejarlo abierto")], 2]),
    cmd(402, [0, S("Sellar el Nexo")]),
    script(`begin; $game_variables[276] = 0; $game_variables[265] = [$game_variables[265] + 18, 100].min; ${ROTOM_LEVEL_UPDATE}; $game_switches[889] = true; $game_switches[${NEXO_RESOLVED_SWITCH}] = true; rescue; end`, 1),
    cmd(402, [1, S("Dejarlo abierto")]),
    script(`begin; $game_variables[276] = 1; $game_switches[889] = false; $game_switches[${NEXO_RESOLVED_SWITCH}] = true; rescue; end`, 1),
    cmd(404),
    setSelf("A"),
    cmd(0),
  ];
  return [
    page({ cond: condition({ sw: 888 }), gfx: graphic("Object ball special", 2, 1, { hue: 180 }), list: sealChoice }),
    page({
      cond: condition({ self: "A" }), gfx: graphic("Object ball special", 2, 1, { hue: 180 }),
      list: [script('pbMessage($game_variables[276] == 0 ? "El Nexo quedó sellado." : "La rendija sigue abierta.")'), cmd(0)],
    }),
  ];
}


// ------------------------------------------------------------------- render
/**
 * Hoja de revisión de E4: cada mapa del episodio con sus marcadores (NPCs, eventos,
 * conexiones y jefe). Es el artefacto que se versiona; permite ver de un vistazo si algo
 * quedó fuera de la zona transitable o amontonado.
 */
const MARKER = { npc: "#3d7bff", event: "#ffd23d", conn: "#2ecc71", boss: "#ff3b30" };

function markerKind(name) {
  if (name.startsWith("NPC_")) return "npc";
  if (name.startsWith("CONN_")) return "conn";
  if (/JEFE/.test(name) || /HUBSALIDA/.test(name)) return "boss";
  return "event";
}

async function renderMapOverlay(mapId) {
  const parsed = parseMap(read(mapFile(mapId)));
  const { width, height } = parsed;
  const canvas = createCanvas(width * TILE, height * TILE);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tilesetPath = path.join(TILESETS, `DN_${mapId}.png`);
  if (fs.existsSync(tilesetPath)) {
    const image = await loadImage(tilesetPath);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tableGet(parsed.table, x, y, 0);
        if (!tile || tile < BASE_ID) continue;
        const k = tile - BASE_ID;
        ctx.drawImage(image, (k % COLUMNS) * TILE, Math.floor(k / COLUMNS) * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
      }
    }
  } else {
    warnings.push(`${mapId}: sin DN_${mapId}.png; la hoja de E4 se dibuja sin arte (regenerar con dn:tiles)`);
  }

  // tinte suave de transitabilidad para juzgar la colocación
  const pass = passabilityOf(parsed, parsed.tilesetId);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = pass.passable(x, y, 8) ? "rgba(0,200,120,0.10)" : "rgba(200,30,30,0.16)";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  const hash = read(mapFile(mapId)).getIvar("@events");
  const legend = [];
  for (const [, ev] of hash.pairs) {
    const name = ev.getIvar("@name")?.text ?? "?";
    const x = ev.getIvar("@x"), y = ev.getIvar("@y");
    const kind = markerKind(name);
    const cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = MARKER[kind];
    if (kind === "conn") {
      ctx.beginPath(); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 9, cy + 7); ctx.lineTo(cx - 9, cy + 7); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, kind === "boss" ? 9 : 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    legend.push({ name, x, y, kind, index: legend.length + 1 });
    ctx.fillStyle = "#000";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(String(legend.length), cx + 8, cy - 6);
  }
  return { mapId, canvas, legend, width, height };
}

async function renderEpisodes(episodes) {
  fs.mkdirSync(RENDER_DIR, { recursive: true });
  const LABEL = 24, LINE = 14, MARGIN = 16;
  for (const ep of episodes) {
    const ids = episodeMaps(ep).filter((id) => !onlySet || onlySet.has(id));
    if (!ids.length) continue;
    const panels = [];
    for (const id of ids) panels.push(await renderMapOverlay(id));
    const sheetW = Math.max(...panels.map((p) => p.canvas.width)) + MARGIN * 2;
    const sheetH = panels.reduce((sum, p) => sum + p.canvas.height + LABEL + p.legend.length * LINE + MARGIN, MARGIN);
    const sheet = createCanvas(sheetW, sheetH);
    const sctx = sheet.getContext("2d");
    sctx.imageSmoothingEnabled = false;
    sctx.fillStyle = "#141414";
    sctx.fillRect(0, 0, sheet.width, sheet.height);
    let y = MARGIN;
    for (const panel of panels) {
      sctx.fillStyle = "#fff";
      sctx.font = "bold 16px sans-serif";
      sctx.fillText(`Map${panel.mapId} — ${panel.width}×${panel.height}`, MARGIN, y + 12);
      y += LABEL - 4;
      sctx.drawImage(panel.canvas, MARGIN, y);
      y += panel.canvas.height + 4;
      sctx.font = "12px sans-serif";
      for (const item of panel.legend) {
        sctx.fillStyle = MARKER[item.kind];
        sctx.fillRect(MARGIN, y + 2, 8, 8);
        sctx.fillStyle = "#ddd";
        sctx.fillText(`${item.index}. ${item.name} (${item.x},${item.y})`, MARGIN + 14, y + 10);
        y += LINE;
      }
      y += MARGIN;
    }
    const out = path.join(RENDER_DIR, `${ep.key}.png`);
    fs.writeFileSync(out, sheet.toBuffer("image/png"));
    console.log(`render E4 → ${path.relative(ROOT, out)} (${panels.length} mapas, ${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
  }
}

// ------------------------------------------------------------------- main
const hubCell = resolveHubCell();
const artPending = [];   // «mapId: NPC sin sprite (arte pendiente)»
let anomalyCount = 0;
const onlySet = ONLY ? new Set(ONLY) : null;
const scopeEpisodes = blueprint.episodes.filter((ep) => {
  if (onlySet) return onlySet.has(ep.mapRange.from) || [...onlySet].some((id) => id >= ep.mapRange.from && id <= ep.mapRange.to);
  if (EPISODE) return ep.key === EPISODE;
  return true;
});

function episodeMaps(ep) {
  const ids = [];
  for (let id = ep.mapRange.from; id <= ep.mapRange.to; id++) if (builtMaps.has(id)) ids.push(id);
  return ids;
}

let installed = 0, npcCount = 0, eventCount = 0, transferCount = 0;

if (!VERIFY)
for (const ep of scopeEpisodes) {
  const ids = episodeMaps(ep);
  if (!ids.length) continue;
  const hub = hubCell;
  for (let index = 0; index < ids.length; index++) {
    const mapId = ids[index];
    const mask = maskOf(mapId);
    if (!mask) { warnings.push(`${mapId}: sin pasabilidad; se omite`); continue; }
    const occupied = new Set();
    // lo que instala la pasada de jefes (`BOSSB_*`) ocupa su celda: se conserva y se respeta
    const previousEvents = read(mapFile(mapId)).getIvar("@events")?.pairs ?? [];
    for (const [, ev] of previousEvents) {
      if ((ev.getIvar("@name")?.text ?? "").startsWith("BOSSB_")) occupied.add(`${ev.getIvar("@x")},${ev.getIvar("@y")}`);
    }
    const events = [];
    let nextId = 1;
    const add = (name, x, y, pages) => {
      events.push(event(nextId++, name, x, y, pages));
      occupied.add(`${x},${y}`);
    };

    // --- conexiones ---
    const prev = index > 0 ? ids[index - 1] : null;
    const next = index < ids.length - 1 ? ids[index + 1] : null;
    const entry = entryCell(mask);
    if (prev) {
      add(`CONN_${prev}_entrada`, entry[0], entry[1], [page({
        trigger: 1, through: true,
        list: [transfer(prev, ...exitCell(maskOf(prev), "down") ?? entry, 8), cmd(0)],
      })]);
      transferCount++;
    } else {
      add("CONN_HUB_entrada", entry[0], entry[1], [page({
        trigger: 1, through: true,
        list: [transfer(hub.map, hub.cell[0], hub.cell[1], 8), cmd(0)],
      })]);
      transferCount++;
    }
    if (next) {
      const out = exitCell(mask, "down");
      const target = entryCell(maskOf(next));
      add(`CONN_${next}_salida`, out[0], out[1], [page({
        trigger: 1, through: true,
        list: [transfer(next, ...target, 2), cmd(0)],
      })]);
      transferCount++;
    }

    // --- NPCs ---
    const anchor = entry ?? [Math.floor(mask.width / 2), Math.floor(mask.height / 2)];
    for (const npc of ep.npcs.filter((n) => n.map === mapId)) {
      const spot = placeNear(mask, [Math.min(mask.width - 2, anchor[0] + 2), Math.min(mask.height - 2, anchor[1] + 2)], occupied);
      if (!spot) { warnings.push(`${mapId}: sin sitio para ${npc.name}`); continue; }
      let file = npc.sprite.replace(/[()*]/g, "").trim();
      // Celdas que describen el evento en vez de nombrar un archivo, y placeholders del GDD
      // («Sprite R3» sin arte todavía): el NPC queda sin gráfico, no con un muñeco cualquiera.
      if (!file || /^(texto|tiles|objeto|sprite|pendiente|n\/?a|—|-)$/i.test(file) || /texto|tiles|objeto|estatuas/i.test(npc.sprite)) {
        file = "";
        artPending.push(`${mapId}: ${npc.name} sin sprite (arte pendiente)`);
      }
      else if (!fs.existsSync(path.join(CHARS, `${file}.png`))) {
        const alt = file.replace(/^SWIMMER/, "trainer_SWIMMER").replace(/^([A-Z])/, (c) => c.toLowerCase());
        if (fs.existsSync(path.join(CHARS, `${alt}.png`))) file = alt;
        else { warnings.push(`${mapId}: sprite ${npc.sprite} no existe; se usa trchar000 (${npc.name})`); file = "trchar000"; }
      }
      const npcKey = npc.name.replace(/[^\w]/g, "_").slice(0, 24);
      const npcSuffix = (npc.groupCount ?? 1) > 1 ? `_${String(npc.instance).padStart(2, "0")}` : "";
      add(`NPC_${npcKey}${npcSuffix}`, spot[0], spot[1], npcPages({ ...npc, graphic: file }));
      npcCount++;
    }

    // --- anomalías (§5): una por ficha, con su contador ---
    for (const item of ep.anomalies.items) {
      if (item.map !== mapId) continue;
      const desired = item.cells[0] && inBounds(mask, item.cells[0][0], item.cells[0][1])
        ? item.cells[0]
        : [Math.max(1, anchor[0] - 1), Math.min(mask.height - 2, anchor[1] + 1)];
      const spot = walkAt(mask, desired[0], desired[1]) && !occupied.has(`${desired[0]},${desired[1]}`)
        ? desired
        : placeNear(mask, desired, occupied);
      if (!spot) { warnings.push(`${mapId}: sin sitio para la anomalía ${item.code}`); continue; }
      add(`ANOM_${item.code}`, spot[0], spot[1], anomalyPages(item, ep));
      anomalyCount++;
    }

    // --- eventos del índice ---
    // Los eventos sin mapa explícito en el GDD se instalan UNA vez, en el mapa del jefe
    // (antes se replicaban en todos los mapas del episodio y multiplicaban el recuento).
    const isBossMap = index === ids.length - 1;
    const phaseBPending = isBossMap ? ep.boss?.phaseB?.kind ?? null : null;
    const forThisMap = ep.events.filter((e) => (e.maps.length ? e.maps.includes(mapId) : isBossMap));
    for (const ev of forThisMap) {
      if (!ev.maps.length) warnings.push(`${ev.name}: sin mapa en el GDD; se instala en ${mapId} (mapa del jefe)`);
      const instances = ev.maps.length ? Math.max(1, Math.min(ev.instances, ev.cells.length || ev.instances)) : 1;
      for (let k = 0; k < instances; k++) {
        const desired = ev.cells[k] && inBounds(mask, ev.cells[k][0], ev.cells[k][1]) ? ev.cells[k] : [anchor[0], Math.max(0, anchor[1] - 2 - k)];
        const spot = placeNear(mask, desired, occupied);
        if (!spot) { warnings.push(`${mapId}: sin sitio para ${ev.name}`); break; }
        add(`${ev.name}${instances > 1 ? `_${k + 1}` : ""}`, spot[0], spot[1], indexedEventPages(ev));
        eventCount++;
      }
    }

    // El silenciador opera sólo durante 60 s y sin alterar BGM de otros episodios. Este
    // guardián paralelo vuelve a comprobar el temporizador al entrar/cambiar de mapa en EP04.
    if (ep.key === "EP04") {
      const audioSpot = placeNear(mask, [anchor[0], Math.min(mask.height - 2, anchor[1] + 3)], occupied);
      if (!audioSpot) warnings.push(`${mapId}: sin sitio para DN_AUDIO_EP04`);
      else add("DN_AUDIO_EP04", audioSpot[0], audioSpot[1], hypnoAudioGuardPages());
    }

    // --- jefe, sello y salida (mapa final) ---
    if (index === ids.length - 1) {
      const boss = ep.boss ?? null;
      if (boss) {
        const bossSpot = placeNear(mask, [Math.floor(mask.width / 2), Math.floor(mask.height / 2)], occupied) ?? anchor;
        const phaseA = boss.phaseA ?? { type: "HIKER", label: ep.bossName, trainer: `DN_${ep.key}_A` };
        const phaseB = boss.phaseB ?? null;
        const battleSwitch = phaseASwitch(ep);
        const stepVariable = phaseBVariable(ep);
        const stepTotal = phaseBTotal(ep);
        const call = `begin; pbTrainerBattle(PBTrainer.new("${phaseA.type}", "${phaseA.label}"), false, "", true); rescue; pbMessage("(jefe pendiente de registrar: ${phaseA.trainer})"); false; end`;
        const phaseASuccess = (indent = 1) => [
          script(`$game_variables[${stepVariable}] = 0`, indent),
          setSwitch(battleSwitch, indent),
        ];
        const bossList = [
          ...texts([`${ep.bossName} te espera.`, "El Rotom registra el pico de resonancia."]),
          cmd(111, [12, S(call)]),
          ...phaseASuccess(1),
          ...texts(["La batalla queda registrada. Ahora golpea lo que lo sostiene."], 1),
          cmd(411),
          ...texts(["La derrota no cierra el mundo. Cuando estés preparado, vuelve a tocar el evento para intentarlo de nuevo."], 1),
          setSelf("A", 1),
          cmd(412),
          cmd(0),
        ];
        const retryList = [
          ...texts([`${ep.bossName} sigue en pie. ¿Lo intentas otra vez?`]),
          cmd(111, [12, S(call)]),
          ...phaseASuccess(1),
          ...texts(["La batalla queda registrada. La fase B te espera."], 1),
          cmd(411),
          ...texts(["Todavía no. Puedes recuperarte y volver a intentarlo cuando quieras."], 1),
          cmd(412),
          cmd(0),
        ];
        const bossPendingList = [
          ...texts([
            phaseB ? `${ep.bossName} no cae a golpes: ${phaseB.verb} ${phaseBTotal(ep)} ${phaseB.noun}${phaseBTotal(ep) === 1 ? "" : "s"} del escenario.` : `${ep.bossName} sigue en pie.`,
            "El Rotom marca cada paso en el itinerario.",
          ]),
          cmd(0),
        ];
        const bossEpilogueList = [
          ...texts([`${ep.bossName} ya no está. El sello aguanta.`,
            "Lo que bajó contigo no puede volver a bajar. Pero puede recordar."]),
          cmd(0),
        ];
        // La derrota sólo habilita una página de reintento; el switch de fase A se enciende
        // únicamente en la rama verdadera del condicional (pbTrainerBattle devuelve victoria).
        const bossPages = [
          page({ trigger: 3, list: bossList }),
          page({ cond: condition({ self: "A" }), gfx: graphic(""), through: true, list: retryList }),
          page({ cond: condition({ sw: battleSwitch }), gfx: graphic(""), list: bossPendingList }),
          page({
            cond: condition({ sw: ep.seal, sw2: battleSwitch, variable: [stepVariable, stepTotal] }),
            gfx: graphic(""), list: bossEpilogueList,
          }),
        ];
        add(`EV_${ep.key}_JEFE`, bossSpot[0], bossSpot[1], bossPages);
      }
      if (ep.key === "NEXO") {
        const finalSpot = placeNear(mask, [anchor[0] + 1, anchor[1]], occupied) ?? anchor;
        add("EV_NEXO_FINAL", finalSpot[0], finalSpot[1], nexoResolutionPages());
      }
      // La salida sólo se abre cuando el estado completo del episodio se confirma, no por una
      // mención textual del sello en otro evento. En el Nexo, cualquiera de los dos finales
      // habilita el retorno; `sw889` sólo representa el final sellado.
      const exitSpot = placeNear(mask, [anchor[0], anchor[1]], occupied) ?? anchor;
      const exitCondition = ep.key === "NEXO"
        ? condition({ sw: NEXO_RESOLVED_SWITCH })
        : condition({ sw: ep.seal, sw2: phaseASwitch(ep), variable: [phaseBVariable(ep), phaseBTotal(ep)] });
      add(`EV_${ep.key}_HUBSALIDA`, exitSpot[0], exitSpot[1], [page({
        cond: exitCondition, trigger: 1, through: true,
        list: [transfer(hub.map, hub.cell[0], hub.cell[1], 8), cmd(0)],
      })]);
      transferCount++;
    }

    // --- volcado al mapa ---
    const mapPath = path.join(DATA, mapFile(mapId));
    const mapObject = read(mapFile(mapId));
    // Conserva lo que instala la pasada de jefes (`BOSSB_*`): este tool reescribe el mapa entero.
    const carried = (mapObject.getIvar("@events")?.pairs ?? []).filter(([, ev]) => (ev.getIvar("@name")?.text ?? "").startsWith("BOSSB_"));
    let carryId = Math.max(0, ...events.map((ev) => ev.getIvar("@id"))) + 1;
    const hash = new RHash([
      ...events.map((ev) => [ev.getIvar("@id"), ev]),
      ...carried.map(([, ev]) => [carryId++, ev]),
    ]);
    mapObject.setIvar("@events", hash);
    write(mapFile(mapId), mapObject);
    installed++;
    result.maps[String(mapId)] = {
      episode: ep.key,
      events: events.length,
      npcs: ep.npcs.filter((n) => n.map === mapId).length,
      entry, exit: index < ids.length - 1 ? exitCell(mask, "down") : null,
      boss: index === ids.length - 1 ? ep.bossName : null,
      pending: [
        ...(index === ids.length - 1 ? (phaseBPending ? [`fase B del jefe (${phaseBPending})`] : []) : []),
        ...artPending.filter((p) => p.startsWith(`${mapId}:`)),
      ],
    };
    if (!DRY) console.log(`${mapId} ${ep.key}: ${events.length} eventos (${result.maps[String(mapId)].npcs} NPCs) · entrada ${entry.join(",")}`);
  }
}

if (RENDER) await renderEpisodes(scopeEpisodes);

if (!DRY && !VERIFY) {
  result.hub = hubCell;
  fs.writeFileSync(BUILT, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`\ninstalados: ${installed} mapas · ${npcCount} NPCs · ${anomalyCount} anomalías · ${eventCount} eventos de índice · ${transferCount} transferencias`);
  if (warnings.length) {
    console.log(`avisos (${warnings.length}):`);
    for (const w of warnings.slice(0, 12)) console.log(`  - ${w}`);
  }
}

// ---------------------------------------------------------------- verificación
if (VERIFY) {
  let failures = 0;
  const ok = (cond, label) => { if (!cond) { failures++; console.error(`  FALLA: ${label}`); } };
  const builtEventData = JSON.parse(fs.readFileSync(BUILT, "utf8"));
  const catalog = builtEventData.maps;
  const entries = Object.entries(catalog);
  const anomalyTally = new Map();
  console.log(`verificación de ${entries.length} mapas con eventos`);
  for (const [id, info] of entries) {
    const mapId = Number(id);
    const mapObject = read(mapFile(mapId));
    const events = mapObject.getIvar("@events");
    ok(events?.pairs?.length > 0, `${id}: sin eventos`);
    const seen = new Set();
    let transfers = 0;
    const mask = maskOf(mapId);
    const entry = info.entry ?? builtMaps.get(mapId)?.entry;
    const reachable = mask && entry ? reachableMask(mask, entry) : new Set();
    let anomalies = 0;
    for (const [, ev] of events.pairs ?? []) {
      const x = ev.getIvar("@x"), y = ev.getIvar("@y");
      const built = builtMaps.get(mapId);
      const evName = ev.getIvar("@name")?.text ?? "?";
      if (built) ok(x >= 0 && y >= 0 && x < built.width && y < built.height, `${id}: evento ${evName} fuera de límites (${x},${y})`);
      if (mask) ok(walkAt(mask, x, y), `${id}: ${evName} sobre una celda bloqueada (${x},${y})`);
      if (mask && /^(CONN_|NPC_|ANOM_|EV_|BOSSB_|MEDALLA_)/.test(evName)) {
        ok(reachable.has(`${x},${y}`), `${id}: ${evName} no es alcanzable desde la entrada ${entry}`);
      }
      if (evName.startsWith("ANOM_")) anomalies++;
      ok(!seen.has(`${x},${y}`), `${id}: dos eventos en ${x},${y}`);
      seen.add(`${x},${y}`);
      const pages = ev.getIvar("@pages") ?? [];
      if (evName.startsWith("ANOM_")) {
        ok(pages.length === 2, `${id}: ${evName} debe cerrarse tras el primer registro`);
        ok((pages[0]?.getIvar("@list") ?? []).some((c) => c.getIvar("@code") === 123
          && txt(c.getIvar("@parameters")?.[0]) === "A"), `${id}: ${evName} no activa self-switch A`);
        ok(pages[1]?.getIvar("@condition")?.getIvar("@self_switch_valid") === true
          && txt(pages[1]?.getIvar("@condition")?.getIvar("@self_switch_ch")) === "A",
        `${id}: ${evName} carece de página de cierre self-switch A`);
      }
      if (evName === "EV_NEXO_FINAL") {
        const firstPage = pages[0];
        const firstCommands = firstPage?.getIvar("@list") ?? [];
        const scriptSources = firstCommands.filter((c) => c.getIvar("@code") === 355)
          .map((c) => txt(c.getIvar("@parameters")?.[0]));
        const sealChoice = scriptSources.find((source) => source.includes("$game_variables[276] = 0")) ?? "";
        const openChoice = scriptSources.find((source) => source.includes("$game_variables[276] = 1")) ?? "";
        ok(pages.length === 2 && firstPage?.getIvar("@condition")?.getIvar("@switch1_valid") === true
          && firstPage?.getIvar("@condition")?.getIvar("@switch1_id") === 888,
        `${id}: EV_NEXO_FINAL debe abrirse tras sw888 y cerrarse después de la decisión`);
        ok(firstCommands.some((c) => c.getIvar("@code") === 102)
          && firstCommands.some((c) => c.getIvar("@code") === 123 && txt(c.getIvar("@parameters")?.[0]) === "A"),
        `${id}: EV_NEXO_FINAL carece de elección o de cierre one-shot`);
        ok(sealChoice.includes("$game_switches[889] = true") && sealChoice.includes(`$game_switches[${NEXO_RESOLVED_SWITCH}] = true`),
          `${id}: la opción sellar no activa sw889 y sw${NEXO_RESOLVED_SWITCH}`);
        ok(openChoice.includes("$game_switches[889] = false") && openChoice.includes(`$game_switches[${NEXO_RESOLVED_SWITCH}] = true`),
          `${id}: la opción dejar abierto no limpia sw889 o no activa sw${NEXO_RESOLVED_SWITCH}`);
        ok(pages[1]?.getIvar("@condition")?.getIvar("@self_switch_valid") === true
          && txt(pages[1]?.getIvar("@condition")?.getIvar("@self_switch_ch")) === "A",
        `${id}: la página de resultado no depende del self-switch A`);
      }
      const isGenericIndex = evName.startsWith("EV_")
        && !/^EV_(?:EP\d\d|W\d+)_JEFE$/.test(evName)
        && !evName.endsWith("_HUBSALIDA") && evName !== "EV_NEXO_FINAL";
      for (const pg of pages) {
        for (const command of pg.getIvar("@list") ?? []) {
          const code = command.getIvar("@code");
          const params = command.getIvar("@parameters") ?? [];
          if (code === 201) {
            transfers++;
            const [target, tx, ty] = [params[1], params[2], params[3]];
            const exists = fs.existsSync(path.join(DATA, mapFile(target)));
            ok(exists, `${id}: transfer a mapa inexistente ${target}`);
            const targetMask = physicalMaskOf(target);
            if (targetMask) {
              ok(walkAt(targetMask, tx, ty), `${id}: transfer a celda bloqueada ${target} (${tx},${ty})`);
              let targetStart = catalog[String(target)]?.entry ?? builtMaps.get(target)?.entry;
              if (target === hubCell.map) targetStart = hubCell.cell;
              if (target === 2040) targetStart = builtEventData.hubMap?.entry ?? targetStart;
              targetStart ??= [tx, ty];
              ok(reachableMask(targetMask, targetStart).has(`${tx},${ty}`),
                `${id}: transfer a destino aislado ${target} @ ${tx},${ty} (entrada ${targetStart})`);
            } else if (exists) {
              ok(target === hubCell.map || target === 2040, `${id}: transfer a ${target} sin malla ni destino de hub conocido`);
            }
          }
          if (code === 121) {
            ok(params[0] >= 882 && params.length >= 3 && params[0] === params[1] && (params[2] === 0 || params[2] === 1),
              `${id}: comando switch 121 inválido (${params.join(",")})`);
          }
          if (code === 355) {
            const source = txt(params[0]);
            ok(!/\$game_variables\[264\]\s*(?:=(?!=)|\+=|-=|\*=|\/=)/.test(source),
              `${id}: ${evName} altera v264, reservado al contador de Monte Silver`);
          }
          if (isGenericIndex) {
            ok(code !== 121, `${id}: ${evName} escribe una switch de progreso desde texto libre`);
            if (code === 355) {
              const source = txt(params[0]);
              ok(!/\$game_switches\[(?:883|884|885|886|887|888|889|890|891|892|893|894|895|922|923|924|925|926|927)\]/.test(source),
                `${id}: ${evName} escribe un sello/grieta fuera de su máquina de estado`);
              ok(!/\$game_variables\[266\]\s*=/.test(source), `${id}: ${evName} altera fase global desde texto libre`);
            }
          }
        }
      }
    }
    if (mapId >= 2088 && mapId <= 2103) {
      const named = new Map((events.pairs ?? []).map(([, ev]) => [ev.getIvar("@name")?.text ?? "", ev]));
      const audioGuard = named.get("DN_AUDIO_EP04");
      const guardPage = audioGuard?.getIvar("@pages")?.[0];
      const guardCommands = guardPage?.getIvar("@list") ?? [];
      const guardScript = guardCommands.filter((c) => c.getIvar("@code") === 355).map((c) => txt(c.getIvar("@parameters")?.[0])).join(" ");
      ok(!!audioGuard && guardPage?.getIvar("@trigger") === 2 && guardScript.includes(HYPNO_SILENCE_UNTIL),
        `${id}: falta DN_AUDIO_EP04 paralelo para respetar el silenciador al cambiar de mapa`);
      if ([2094, 2096, 2098].includes(mapId)) {
        const sleepEvent = named.get("EV_HYP_Sueno");
        const sleepPage = sleepEvent?.getIvar("@pages")?.[0];
        const sleepCommands = sleepPage?.getIvar("@list") ?? [];
        ok(sleepPage?.getIvar("@trigger") === 2
          && sleepCommands.some((c) => c.getIvar("@code") === 106 && c.getIvar("@parameters")?.[0] === 2700)
          && sleepCommands.some((c) => c.getIvar("@code") === 111),
        `${id}: EV_HYP_Sueno debe comprobar cada 45 s que no haya silenciador activo`);
      }
      if (mapId === 2103) {
        const silencers = [...named.entries()].filter(([name]) => /^EV_HYP_Silenciador_\d+$/.test(name));
        const expected = [[5, 2], [8, 4], [3, 5], [14, 5], [19, 4], [21, 6]];
        ok(silencers.length === 6, `2103: hay ${silencers.length}/6 troncos silenciadores`);
        ok(silencers.every(([, ev]) => ev.getIvar("@pages")?.length === 2
          && (ev.getIvar("@pages")?.[0]?.getIvar("@list") ?? []).some((c) => c.getIvar("@code") === 355
            && txt(c.getIvar("@parameters")?.[0]).includes(HYPNO_SILENCE_UNTIL))
          && (ev.getIvar("@pages")?.[0]?.getIvar("@list") ?? []).some((c) => c.getIvar("@code") === 123 && txt(c.getIvar("@parameters")?.[0]) === "A")),
        "2103: cada tronco debe contar una vez, iniciar los 60 s y cerrarse con self-switch A");
        const actual = silencers.map(([, ev]) => [ev.getIvar("@x"), ev.getIvar("@y")]);
        ok(expected.every(([x, y]) => actual.some(([ax, ay]) => ax === x && ay === y)),
          "2103: las seis celdas del silenciador deben coincidir con las coordenadas del GDD");
      }
    }
    ok(transfers >= 1, `${id}: sin ninguna transferencia`);
    anomalyTally.set(info.episode, (anomalyTally.get(info.episode) ?? 0) + anomalies);
  }
  // cada episodio debe tener instaladas tantas anomalías como declara su §5
  for (const [key, count] of anomalyTally) {
    const declared = blueprint.episodes.find((e) => e.key === key)?.anomalies.declared ?? 0;
    ok(count === declared, `${key}: ${count} anomalías instaladas; el GDD declara ${declared}`);
    console.log(`  ${key}: ${count}/${declared} anomalías`);
  }
  console.log(failures === 0 ? "verificación OK" : `verificación con ${failures} fallos`);
  process.exit(failures === 0 ? 0 : 1);
}
