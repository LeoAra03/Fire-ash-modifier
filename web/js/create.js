// ============================================================================
// create.js — Pestaña Crear: contenido nuevo estilo juego base (Essentials v19.1)
// ----------------------------------------------------------------------------
// Constructores puros (probados en Node) + UI. Los eventos se generan en forma
// EXPANDIDA (listos para jugar en Kirin sin pasar por RPG Maker): nadie los
// "auto-convierte" en Android, así que ya traen páginas, condiciones y scripts.
// Referencia: wiki Essentials (v19/v21), PBS y código v19 reales.
// ============================================================================
import {
  S, loadMap, loadPBS, getTileset, saveMap, savePBS, saveMapInfos,
  markMapDirty, scanAllMaps, log,
} from "./app.js";
import { FS } from "./fs.js";
import { RString, RObject, RHash } from "./marshal.js";
import {
  tableToUserDef, rstr, cmdOf, parseEvent, TRIGGERS, humanizeCommand,
} from "./rmxp.js";
import { parsePBS, pbsToText, pbsSections, pbsGet, pbsGetAll } from "./pbs.js";
import { esc, pad3 } from "./util.js";
import {
  toast, confirmDialog, showProgress, mapPickerModal, spritePickerModal,
} from "./helpers.js";

// ============================================================================
// 1. Constructores de eventos (puros)
// ============================================================================
const S_ = (t) => RString.fromText(t);

export function evCmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
}

export function evCondition(o = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!o.sw1], ["@switch1_id", o.sw1 || 1],
    ["@switch2_valid", !!o.sw2], ["@switch2_id", o.sw2 || 1],
    ["@variable_valid", !!o.var], ["@variable_id", o.var || 1], ["@variable_value", o.varVal || 0],
    ["@self_switch_valid", !!o.self], ["@self_switch_ch", S_(o.self || "A")],
  ]);
}

export function evGraphic(charName = "", tileId = 0, dir = 2, pat = 1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", tileId], ["@character_name", S_(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pat], ["@opacity", 255], ["@blend_type", 0],
  ]);
}

function evMoveRoute() {
  return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]);
}

export function evPage(o = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", o.cond || evCondition()],
    ["@graphic", o.gfx || evGraphic()],
    ["@move_type", o.moveType || 0], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", evMoveRoute()],
    ["@walk_anime", o.walkAnime !== false], ["@step_anime", !!o.stepAnime],
    ["@direction_fix", !!o.dirFix], ["@through", !!o.through], ["@always_on_top", !!o.alwaysTop],
    ["@trigger", o.trigger || 0], ["@list", o.list || [evCmd(0)]],
  ]);
}

export function evEvent(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S_(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}

export function audioFile(name = "") {
  return new RObject("RPG::AudioFile", [["@name", S_(name)], ["@volume", 100], ["@pitch", 100]]);
}

export function textCmds(lines, indent = 0) {
  const clean = (lines && lines.length ? lines : ["..."]).map(String);
  return [evCmd(101, [S_(""), 0, 0, 2], indent), ...clean.map((l) => evCmd(401, [S_(l)], indent))];
}

export function scriptCmds(rubyLines, indent = 0) {
  const ls = (rubyLines && rubyLines.length ? rubyLines : [""]).map(String);
  return [evCmd(355, [S_(ls[0])], indent), ...ls.slice(1).map((l) => evCmd(655, [S_(l)], indent))];
}

// Condición por script (código 111, tipo 12) con ramas indentadas.
export function condScript(script, thenCmds, elseCmds = null, indent = 0) {
  const out = [evCmd(111, [12, S_(script)], indent)];
  for (const c of thenCmds) { c.setIvar("indent", indent + 1); out.push(c); }
  if (elseCmds) {
    out.push(evCmd(411, [], indent));
    for (const c of elseCmds) { c.setIvar("indent", indent + 1); out.push(c); }
  }
  out.push(evCmd(412, [], indent));
  return out;
}

export const selfSwitchOn = (ch = "A", indent = 0) => evCmd(123, [S_(ch), 1], indent);
const END = () => evCmd(0);

// --- Plantillas ------------------------------------------------------------
// Cada una devuelve { name, pages }. El id/x/y se asignan al insertar.

export function buildNpc(p = {}) {
  return {
    name: p.name || "NPC",
    pages: [evPage({
      gfx: evGraphic(p.sprite || "", 0, p.dir || 2, 1),
      list: [...textCmds(p.dialog || ["..."]), END()],
    })],
  };
}

export function buildTrainer(p = {}) {
  const ver = Number(p.version || 0), dbl = !!p.double;
  const ttype = (p.ttype || "CAMPER").toUpperCase();
  const tname = p.tname || "Dave";
  const call = (ver === 0 && !dbl)
    ? `pbTrainerBattle(:${ttype},"${tname}")`
    : `pbTrainerBattle(:${ttype},"${tname}",nil,${dbl},${ver})`;
  const list = [];
  if (dbl) {
    list.push(...condScript("!pbCanDoubleBattle?", [
      ...textCmds([p.noDoubleText || "¡Necesitas al menos 2 Pokémon utilizables!"], 1),
      evCmd(115, [], 1), // Terminar proceso
    ]));
  }
  list.push(...scriptCmds([`pbTrainerIntro(:${ttype})`]));
  list.push(...scriptCmds(["pbNoticePlayer(get_self)"]));
  list.push(...textCmds(p.intro || ["¡A luchar!"]));
  list.push(...condScript(call, [selfSwitchOn("A", 1)]));
  list.push(...scriptCmds(["pbTrainerEnd"]));
  list.push(END());
  const gfx = () => evGraphic(p.sprite || "", 0, p.dir || 2, 1);
  return {
    name: `Trainer(${p.sight || 3})`,
    pages: [
      evPage({ gfx: gfx(), trigger: 2, list }),
      evPage({ cond: evCondition({ self: "A" }), gfx: gfx(), list: [...textCmds(p.after || ["..."]), END()] }),
    ],
  };
}

export function buildItemBall(p = {}, hidden = false) {
  const item = (p.item || "POTION").toUpperCase();
  const qty = Number(p.qty || 1);
  const call = qty > 1 ? `pbItemBall(:${item},${qty})` : `pbItemBall(:${item})`;
  return {
    name: `${hidden ? "HiddenItem" : "Item"}:${item}`,
    pages: [
      evPage({
        gfx: hidden ? evGraphic() : evGraphic(p.graphic || "", 0, 2, 1),
        through: hidden,
        list: [...condScript(call, [selfSwitchOn("A", 1)]), END()],
      }),
      evPage({ cond: evCondition({ self: "A" }), list: [END()] }),
    ],
  };
}

export function buildGiftPokemon(p = {}) {
  const sp = (p.species || "MEW").toUpperCase();
  const list = [
    ...textCmds(p.before || ["Toma, este Pokémon es para ti."]),
    ...condScript(
      `pbAddPokemon(:${sp},${Number(p.level || 5)})`,
      [selfSwitchOn("A", 1), ...textCmds(p.after || ["¡Cuídalo bien!"], 1)],
      [...textCmds(p.full || ["Tu equipo está lleno."], 1)],
    ),
    END(),
  ];
  const gfx = () => evGraphic(p.sprite || "", 0, p.dir || 2, 1);
  return {
    name: p.name || "Regalo Pokémon",
    pages: [
      evPage({ gfx: gfx(), list }),
      evPage({ cond: evCondition({ self: "A" }), gfx: gfx(), list: [...textCmds(p.after || ["¡Cuídalo bien!"]), END()] }),
    ],
  };
}

export function buildHealer(p = {}) {
  const list = [
    ...scriptCmds(["pbSetPokemonCenter"]),
    ...textCmds(p.greet || ["Hola, ¿quieres que cure a tus Pokémon?"]),
    evCmd(102, [[S_("Sí"), S_("No")], 4]),
    evCmd(402, [0, S_("Sí")], 1),
    evCmd(314, [0], 2), // Recuperar todo: grupo entero
    ...textCmds(p.healed || ["Tus Pokémon están como nuevos."], 2),
    evCmd(402, [1, S_("No")], 1),
    ...textCmds(p.no || ["De acuerdo, vuelve cuando quieras."], 2),
    evCmd(404, []),
    END(),
  ];
  return {
    name: p.name || "Curandera",
    pages: [evPage({ gfx: evGraphic(p.sprite || "", 0, p.dir || 2, 1), list })],
  };
}

export function buildMart(p = {}) {
  const stock = (p.stock && p.stock.length ? p.stock : ["POTION"]).map((s) => `  :${String(s).toUpperCase()},`);
  const list = [
    ...textCmds(p.greet || ["¡Bienvenido! ¿Qué deseas comprar?"]),
    ...scriptCmds(["pbPokemonMart([", ...stock, "])"]),
    END(),
  ];
  return {
    name: p.name || "Dependiente",
    pages: [evPage({ gfx: evGraphic(p.sprite || "", 0, p.dir || 2, 1), list })],
  };
}

export function buildSign(p = {}) {
  return {
    name: p.name || "Cartel",
    pages: [evPage({ list: [...textCmds(p.lines || ["..."]), END()] })],
  };
}

export function buildTransfer(p = {}) {
  const list = [
    evCmd(201, [0, Number(p.map), Number(p.x), Number(p.y), Number(p.dir ?? 0), Number(p.fade ?? 0)]),
    END(),
  ];
  return {
    name: p.name || "Salida",
    pages: [evPage({ through: true, trigger: 1, list })],
  };
}

export function buildWildScript(p = {}) {
  const v = Number(p.outcomeVar ?? 1), run = p.canRun !== false, lose = !!p.canLose;
  const sp = (p.species || "PIKACHU").toUpperCase();
  const call = (v === 1 && run && !lose)
    ? `pbWildBattle(:${sp},${Number(p.level || 5)})`
    : `pbWildBattle(:${sp},${Number(p.level || 5)},${v},${run},${lose})`;
  return {
    name: p.name || "Salvaje",
    pages: [
      evPage({
        gfx: evGraphic(p.sprite || "", 0, p.dir || 2, 1),
        trigger: Number(p.trigger ?? 0),
        list: [
          ...textCmds(p.intro || ["¡Un Pokémon salvaje bloquea el paso!"]),
          ...condScript(call, [selfSwitchOn("A", 1)]),
          END(),
        ],
      }),
      evPage({ cond: evCondition({ self: "A" }), list: [END()] }),
    ],
  };
}

export const TEMPLATES = [
  ["npc", "NPC hablador", "Personaje con diálogo.", buildNpc],
  ["trainer", "Entrenador de ruta", "Ve, exclama, batalla y recuerda la derrota.", buildTrainer],
  ["item", "Objeto visible", "Pokébola recogible (pbItemBall).", buildItemBall],
  ["hidden", "Objeto oculto", "Invisible, detectable con Buscaobjetos.", (p) => buildItemBall(p, true)],
  ["gift", "Regalo Pokémon", "NPC que entrega un Pokémon.", buildGiftPokemon],
  ["heal", "Curandera", "Cura el equipo (estilo Centro Pokémon).", buildHealer],
  ["mart", "Tienda", "Dependiente con pbPokemonMart.", buildMart],
  ["sign", "Cartel", "Texto sin gráfico.", buildSign],
  ["transfer", "Salida / puerta", "Teletransporte al pisar.", buildTransfer],
  ["wild", "Salvaje guionado", "Batalla única contra un salvaje.", buildWildScript],
];

export function buildTemplate(id, params) {
  const t = TEMPLATES.find((x) => x[0] === id);
  if (!t) throw new Error("Plantilla desconocida: " + id);
  return t[3](params);
}

// Inserta el evento construido en un mapa parseado. Devuelve el id asignado.
export function insertEvent(parsed, name, x, y, pages) {
  const id = parsed.events.reduce((m, e) => Math.max(m, e.id), 0) + 1;
  const obj = evEvent(id, name, Number(x), Number(y), pages);
  const hash = parsed.obj.getIvar("events");
  if (hash && Array.isArray(hash.pairs)) hash.pairs.push([id, obj]);
  parsed.events.push({ id, obj });
  parsed.events.sort((a, b) => a.id - b.id);
  return id;
}

// --- Mapas ------------------------------------------------------------------
export function buildMap(o = {}) {
  const W = Math.max(1, Math.min(256, Number(o.width) || 20));
  const H = Math.max(1, Math.min(256, Number(o.height) || 15));
  const data = new Uint16Array(W * H * 3);
  data.fill(Number(o.fill) || 0);
  return new RObject("RPG::Map", [
    ["@tileset_id", Number(o.tilesetId) || 1], ["@width", W], ["@height", H],
    ["@autoplay_bgm", false], ["@bgm", audioFile()],
    ["@autoplay_bgs", false], ["@bgs", audioFile()],
    ["@encounter_list", []], ["@encounter_step", 30],
    ["@data", tableToUserDef({ dim: 3, x: W, y: H, z: 3, data })],
    ["@events", new RHash([])],
  ]);
}

export function buildMapInfo(name, parent = 0, order = 1) {
  return new RObject("RPG::MapInfo", [
    ["@name", S_(name)], ["@parent_id", parent], ["@order", order],
    ["@expanded", true], ["@scroll_x", 0], ["@scroll_y", 0],
  ]);
}

// ============================================================================
// 2. Ayudantes PBS a nivel de texto (puros)
// ============================================================================
const escReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SEC_START = (h) => new RegExp(`^\\[${escReg(h)}\\](?:\\s*#.*)?$`, "m");
const ANY_SEC = /^\[.*\]\s*(?:#.*)?$/m;

export function getSectionBody(text, header) {
  const m = SEC_START(header).exec(text || "");
  if (!m) return { found: false, body: "" };
  const rest = text.slice(m.index + m[0].length);
  const next = ANY_SEC.exec(rest);
  const body = (next ? rest.slice(0, next.index) : rest).replace(/^\r?\n/, "").replace(/\s+$/, "");
  return { found: true, body };
}

export function setSectionBody(text, header, body) {
  const clean = String(body || "").replace(/\s+$/, "");
  const m = SEC_START(header).exec(text || "");
  if (!m) {
    const t = text || "";
    const sep = t === "" || t.endsWith("\n") ? "" : "\n";
    return `${t}${sep}#-------------------------------\n[${header}]\n${clean}\n`;
  }
  const before = text.slice(0, m.index + m[0].length);
  const rest = text.slice(m.index + m[0].length);
  const next = ANY_SEC.exec(rest);
  const after = next ? rest.slice(next.index) : "";
  return `${before}\n${clean}\n${after}`;
}

// --- Mapamundi (townmap.txt v19) --------------------------------------------
export function parseTownPointLine(line) {
  const m = String(line || "").trim().match(/^Point\s*=\s*(.+)$/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => s.trim());
  while (parts.length < 8) parts.push("");
  const [x, y, name, poi, flyMap, flyX, flyY, sw] = parts;
  if (x === "" || y === "" || Number.isNaN(Number(x)) || Number.isNaN(Number(y))) return null;
  return { x: Number(x), y: Number(y), name, poi, flyMap, flyX, flyY, sw };
}

export function formatTownPoint(p) {
  return `Point = ${p.x},${p.y},${p.name || ""},${p.poi || ""},${p.flyMap ?? ""},${p.flyX ?? ""},${p.flyY ?? ""},${p.sw ?? ""}`;
}

export function getTownRegions(text) {
  const lines = parsePBS(text || "");
  return pbsSections(lines).map((s) => ({
    region: s,
    name: pbsGet(lines, s, "Name") || "",
    filename: pbsGet(lines, s, "Filename") || "",
    points: pbsGetAll(lines, s, "Point")
      .map((l) => parseTownPointLine(`${l.key} = ${l.value}`))
      .filter(Boolean),
  }));
}

export function setTownPoints(text, region, points) {
  const { body } = getSectionBody(text || "", region);
  const keep = body.split("\n").filter((l) => l.trim() !== "" && !/^\s*Point\s*=/i.test(l));
  return setSectionBody(text || "", region, [...keep, ...points.map(formatTownPoint)].join("\n"));
}

// --- Encuentros (encounters.txt v19) -----------------------------------------
export const ENCOUNTER_TYPES = [
  ["Land", 21], ["LandMorning", 21], ["LandDay", 21], ["LandAfternoon", 21],
  ["LandEvening", 21], ["LandNight", 21], ["PokeRadar", 20],
  ["Cave", 5], ["CaveDay", 5], ["CaveNight", 5],
  ["Water", 2], ["OldRod", ""], ["GoodRod", ""], ["SuperRod", ""],
  ["RockSmash", 10], ["HeadbuttLow", 10], ["HeadbuttHigh", 10], ["BugContest", 21],
];
export const ENCOUNTER_IDS = new Set(ENCOUNTER_TYPES.map(([t]) => t));

export function parseEncountersBody(body) {
  const out = [];
  let cur = null;
  for (const raw of String(body || "").split("\n")) {
    const t = raw.trim();
    if (!t || t.startsWith("#")) continue;
    const head = t.split(",")[0].trim();
    if (ENCOUNTER_IDS.has(head)) {
      const [, density] = t.split(",").map((s) => s.trim());
      cur = { type: head, density: density ?? "", rows: [] };
      out.push(cur);
      continue;
    }
    if (!cur) { out.push({ type: "", density: "", rows: [{ raw: t, old: true }] }); cur = out[out.length - 1]; continue; }
    const m = t.match(/^(\d+)\s*,\s*([A-Za-z0-9_]+)\s*,\s*(\d+)\s*(?:,\s*(\d+))?$/);
    if (m) {
      cur.rows.push({
        ch: Number(m[1]), species: m[2].toUpperCase(),
        min: Number(m[3]), max: m[4] !== undefined ? Number(m[4]) : Number(m[3]),
      });
    } else {
      cur.rows.push({ raw: t, old: /^[A-Za-z]/.test(t) });
    }
  }
  return out;
}

export function formatEncountersBody(blocks) {
  return blocks.map((b) => [
    `${b.type}${b.density === "" || b.density === undefined ? "" : "," + b.density}`,
    ...b.rows.map((r) => (r.species
      ? `    ${r.ch},${r.species},${r.min}${r.max !== r.min ? "," + r.max : ""}`
      : `    ${r.raw || ""}`)),
  ].join("\n")).join("\n");
}

export function normalizeChances(rows) {
  const vals = rows.map((r) => Number(r.ch) || 0);
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum <= 0 || !rows.length) return rows.map((r) => ({ ...r }));
  let acc = 0;
  return rows.map((r, i) => {
    if (i === rows.length - 1) return { ...r, ch: 100 - acc };
    const c = Math.max(1, Math.round((vals[i] / sum) * 100));
    acc += c;
    return { ...r, ch: c };
  });
}

// --- Entrenadores (trainers.txt) ----------------------------------------------
export function formatTrainerEntry(t) {
  const header = `[${t.type},${t.name}${t.version ? "," + t.version : ""}]`;
  const lines = [];
  if (t.loseText) lines.push(`LoseText = ${t.loseText}`);
  if (t.items) lines.push(`Items = ${t.items}`);
  for (const m of t.team || []) {
    lines.push(`Pokemon = ${m.species},${m.level}`);
    if (m.moves) lines.push(`    Moves = ${m.moves}`);
    if (m.ability !== undefined && m.ability !== "") lines.push(`    AbilityIndex = ${m.ability}`);
    if (m.gender) lines.push(`    Gender = ${m.gender}`);
    if (m.item) lines.push(`    Item = ${m.item}`);
    if (m.nick) lines.push(`    Name = ${m.nick}`);
    if (m.iv) lines.push(`    IV = ${m.iv}`);
    if (m.shiny) lines.push(`    Shiny = true`);
    if (m.ball) lines.push(`    Ball = ${m.ball}`);
  }
  return { header, body: lines.join("\n") };
}

export function parseTrainerHeader(section) {
  const m = String(section || "").match(/^([^,]+),([^,]+)(?:,(\d+))?$/);
  return m ? { type: m[1], name: m[2], version: Number(m[3] || 0) } : null;
}

export function trainerKey(type, name, version = 0) {
  return `${type}|${name}|${version}`;
}

// --- Metadatos de mapa (metadata.txt v19) --------------------------------------
export function formatMetadataSection(f = {}) {
  const L = [];
  if (f.name !== undefined && f.name !== "") L.push(`Name = ${f.name}`);
  for (const k of ["Outdoor", "ShowArea", "Bicycle", "BicycleAlways"]) {
    if (f[k]) L.push(`${k} = ${f[k]}`);
  }
  if (f.mapPosition) L.push(`MapPosition = ${f.mapPosition}`);
  if (f.healingSpot) L.push(`HealingSpot = ${f.healingSpot}`);
  if (f.battleBack) L.push(`BattleBack = ${f.battleBack}`);
  if (f.weather) L.push(`Weather = ${f.weather}`);
  return L.join("\n");
}

// --- Conexiones (connections.txt) ----------------------------------------------
export function parseConnections(text) {
  const out = [];
  for (const raw of String(text || "").split("\n")) {
    const t = raw.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^(\d+)\s*,\s*([NSEW])\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*([NSEW])\s*,\s*(-?\d+)\s*$/i);
    out.push(m
      ? { a: Number(m[1]), edgeA: m[2].toUpperCase(), offA: Number(m[3]), b: Number(m[4]), edgeB: m[5].toUpperCase(), offB: Number(m[6]), raw: t }
      : { raw: t, bad: true });
  }
  return out;
}

export function formatConnection(c) {
  return `${c.a},${c.edgeA},${c.offA},${c.b},${c.edgeB},${c.offB}`;
}

// ============================================================================
// 3. Auditoría (pura)
// ----------------------------------------------------------------------------
// issue = { level: "error"|"warn"|"info", where, msg, mapId?, evId?, page? }
// ============================================================================
export function auditPBS(texts = {}, mapIds = []) {
  const issues = [];
  const mapSet = new Set(mapIds.map(Number));
  const sects = (t) => (t ? pbsSections(parsePBS(t)) : null);
  const species = sects(texts.pokemon);
  const items = sects(texts.items);
  const ttypes = sects(texts.trainertypes);
  const has = (arr, v) => arr && arr.includes(v);

  // -- metadata.txt
  if (texts.metadata) {
    const lines = parsePBS(texts.metadata);
    for (const s of pbsSections(lines)) {
      if (s === "000" || s === "0") continue;
      const mid = Number(s);
      if (!/^\d+$/.test(s) || Number.isNaN(mid)) {
        issues.push({ level: "warn", where: `metadata.txt [${s}]`, msg: "sección no numérica (se esperaba un id de mapa)" });
        continue;
      }
      if (!mapSet.has(mid)) issues.push({ level: "error", where: `metadata.txt [${s}]`, msg: `el mapa ${mid} no existe` });
      const mp = pbsGet(lines, s, "MapPosition");
      if (mp && !/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(mp)) {
        issues.push({ level: "warn", where: `metadata.txt [${s}]`, msg: `MapPosition inválido: "${mp}" (usa region,x,y)` });
      }
      const hs = pbsGet(lines, s, "HealingSpot");
      if (hs) {
        const m = hs.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
        if (!m) issues.push({ level: "warn", where: `metadata.txt [${s}]`, msg: `HealingSpot inválido: "${hs}" (usa mapa,x,y)` });
        else if (!mapSet.has(Number(m[1]))) issues.push({ level: "error", where: `metadata.txt [${s}]`, msg: `HealingSpot apunta al mapa inexistente ${m[1]}` });
      }
      for (const k of ["Outdoor", "ShowArea", "Bicycle", "BicycleAlways"]) {
        const v = pbsGet(lines, s, k);
        if (v !== undefined && v !== "true" && v !== "false") {
          issues.push({ level: "warn", where: `metadata.txt [${s}]`, msg: `${k} = "${v}" (usa true/false)` });
        }
      }
    }
    for (const id of mapSet) {
      if (!pbsSections(lines).includes(String(id).padStart(3, "0")) && !pbsSections(lines).includes(String(id))) {
        issues.push({ level: "info", where: `metadata.txt`, msg: `mapa ${id} sin sección (usa valores por defecto)` });
      }
    }
  }

  // -- townmap.txt
  if (texts.townmap) {
    for (const r of getTownRegions(texts.townmap)) {
      if (!r.filename) issues.push({ level: "warn", where: `townmap.txt [${r.region}]`, msg: "falta Filename (imagen del mapamundi)" });
      const seen = new Set();
      for (const p of r.points) {
        const key = `${p.x},${p.y}`;
        const where = `townmap.txt [${r.region}] (${key})`;
        if (!p.name) issues.push({ level: "warn", where, msg: "punto sin nombre" });
        if (p.x < 0 || p.x > 29 || p.y < 0 || p.y > 19) {
          issues.push({ level: "warn", where, msg: "coordenadas fuera del mapamundi 30x20" });
        }
        if (seen.has(key)) issues.push({ level: "error", where, msg: "coordenadas duplicadas en la región" });
        seen.add(key);
        if (p.flyMap !== "" && p.flyMap !== undefined) {
          if (!/^\d+$/.test(String(p.flyMap)) || !mapSet.has(Number(p.flyMap))) {
            issues.push({ level: "error", where, msg: `destino de vuelo a mapa inexistente (${p.flyMap})` });
          }
          if (!/^\d+$/.test(String(p.flyX)) || !/^\d+$/.test(String(p.flyY))) {
            issues.push({ level: "warn", where, msg: "destino de vuelo sin X/Y válidas" });
          }
        }
        if (p.sw !== "" && p.sw !== undefined && (!/^\d+$/.test(String(p.sw)) || Number(p.sw) < 1 || Number(p.sw) > 5000)) {
          issues.push({ level: "warn", where, msg: `switch sospechoso: "${p.sw}"` });
        }
      }
    }
  }

  // -- connections.txt
  if (texts.connections) {
    for (const c of parseConnections(texts.connections)) {
      if (c.bad) { issues.push({ level: "error", where: "connections.txt", msg: `línea inválida: ${c.raw}` }); continue; }
      if (!mapSet.has(c.a)) issues.push({ level: "error", where: "connections.txt", msg: `mapa inexistente ${c.a} en: ${c.raw}` });
      if (!mapSet.has(c.b)) issues.push({ level: "error", where: "connections.txt", msg: `mapa inexistente ${c.b} en: ${c.raw}` });
      if (c.a === c.b) issues.push({ level: "warn", where: "connections.txt", msg: `mapa conectado consigo mismo: ${c.raw}` });
    }
  }

  // -- encounters.txt
  if (texts.encounters) {
    const lines = parsePBS(texts.encounters);
    for (const s of pbsSections(lines)) {
      const where = `encounters.txt [${s}]`;
      const m = s.match(/^(\d+)(?:,(\d+))?$/);
      if (!m) { issues.push({ level: "error", where, msg: "sección inválida (usa [MAPA] o [MAPA,VERSION])" }); continue; }
      if (!mapSet.has(Number(m[1]))) issues.push({ level: "error", where, msg: `el mapa ${m[1]} no existe` });
      const { body } = getSectionBody(texts.encounters, s);
      for (const b of parseEncountersBody(body)) {
        if (!b.type) {
          issues.push({ level: "error", where, msg: "filas fuera de un tipo válido (¿formato antiguo v18?)" });
          continue;
        }
        if (!ENCOUNTER_IDS.has(b.type)) issues.push({ level: "warn", where, msg: `tipo de encuentro desconocido: ${b.type}` });
        if (b.density !== "" && !/^\d+$/.test(String(b.density))) {
          issues.push({ level: "warn", where, msg: `densidad inválida en ${b.type}: "${b.density}"` });
        }
        let sum = 0;
        for (const r of b.rows) {
          if (!r.species) {
            issues.push({ level: r.old ? "error" : "warn", where, msg: r.old ? `fila en formato antiguo: "${r.raw}" (usa probabilidad,ESPECIE,min,max)` : `fila inválida: "${r.raw}"` });
            continue;
          }
          sum += r.ch;
          if (species && !has(species, r.species)) issues.push({ level: "warn", where, msg: `${b.type}: especie inexistente ${r.species}` });
          if (r.min > r.max) issues.push({ level: "error", where, msg: `${b.type}: nivel min>max en ${r.species}` });
          if (r.min < 1 || r.max > 100) issues.push({ level: "warn", where, msg: `${b.type}: nivel fuera de 1-100 en ${r.species}` });
        }
        if (b.rows.some((r) => r.species) && sum !== 100) {
          issues.push({ level: "warn", where, msg: `${b.type}: las probabilidades suman ${sum} (deberían sumar 100)` });
        }
      }
    }
  }

  // -- trainers.txt
  if (texts.trainers) {
    const lines = parsePBS(texts.trainers);
    for (const s of pbsSections(lines)) {
      const where = `trainers.txt [${s}]`;
      const h = parseTrainerHeader(s);
      if (!h) { issues.push({ level: "error", where, msg: "cabecera inválida (usa [TIPO,Nombre] o [TIPO,Nombre,Versión])" }); continue; }
      if (ttypes && !has(ttypes, h.type)) issues.push({ level: "warn", where, msg: `tipo de entrenador inexistente: ${h.type}` });
      if (pbsGet(lines, s, "LoseText") === undefined) issues.push({ level: "info", where, msg: "sin LoseText (dirá ... al perder)" });
      const it = pbsGet(lines, s, "Items");
      if (it && items) for (const one of it.split(",").map((x) => x.trim()).filter(Boolean)) {
        if (!has(items, one)) issues.push({ level: "warn", where, msg: `objeto inexistente en Items: ${one}` });
      }
      let count = 0;
      for (const l of pbsGetAll(lines, s, "Pokemon")) {
        count++;
        const m = l.value.match(/^([A-Za-z0-9_]+)\s*,\s*(\d+)/);
        if (!m) { issues.push({ level: "error", where, msg: `línea Pokémon inválida: ${l.value}` }); continue; }
        if (species && !has(species, m[1].toUpperCase())) issues.push({ level: "warn", where, msg: `especie inexistente: ${m[1]}` });
        const lv = Number(m[2]);
        if (lv < 1 || lv > 100) issues.push({ level: "warn", where, msg: `nivel fuera de 1-100: ${m[1]},${lv}` });
      }
      if (!count) issues.push({ level: "error", where, msg: "entrenador sin Pokémon" });
      if (count > 6) issues.push({ level: "error", where, msg: `tiene ${count} Pokémon (máximo 6)` });
    }
  }
  return issues;
}

// Auditoría de los eventos de UN mapa parseado.
// ctx = { species:Set|null, items:Set|null, trainerKeys:Set|null,
//         mapSet:Set, mapSizes:Map(id->{w,h}), charSet:Set|null }
export function auditMapEvents(parsed, mapId, ctx = {}) {
  const issues = [];
  const mapSet = ctx.mapSet || new Set();
  const at = (evId, page, msg, level = "warn", evName = "") => issues.push({
    level, where: `Mapa ${mapId} Ev.${evId}${evName ? " " + evName : ""} pág ${page + 1}`,
    msg, mapId, evId, page,
  });
  for (const { id: evId, obj } of parsed.events) {
    let ev;
    try { ev = parseEvent(obj); }
    catch { at(evId, 0, "evento ilegible", "error"); continue; }
    const scripts = [];
    ev.pages.forEach((pg, pi) => {
      let cur = "";
      const flush = () => { if (cur) { scripts.push(cur); cur = ""; } };
      for (const o of pg.list) {
        let code;
        try { code = Number(o.getIvar("code")); } catch { continue; }
        const params = o.getIvar("parameters") || [];
        if (code === 355) { flush(); cur = rstr(params[0]); }
        else if (code === 655) { cur += "\n" + rstr(params[0]); }
        else {
          flush();
          if (code === 201 && params.length >= 5) {
            const tm = Number(params[1]), tx = Number(params[2]), ty = Number(params[3]);
            if (!mapSet.has(tm)) at(evId, pi, `teletransporte al mapa inexistente ${tm}`, "error", ev.name);
            else if (ctx.mapSizes && ctx.mapSizes.has(tm)) {
              const s = ctx.mapSizes.get(tm);
              if (tx < 0 || ty < 0 || tx >= s.w || ty >= s.h) {
                at(evId, pi, `teletransporte fuera de rango: (${tx},${ty}) en mapa ${tm} (${s.w}x${s.h})`, "warn", ev.name);
              }
            }
          }
        }
      }
      flush();
      const cn = pg.graphic && pg.graphic.charName;
      if (cn && ctx.charSet && !ctx.charSet.has(cn.toLowerCase())) {
        at(evId, pi, `sprite no encontrado: Graphics/Characters/${cn}.png`, "warn", ev.name);
      }
    });
    const all = scripts.join("\n");
    if (ctx.trainerKeys) {
      for (const m of all.matchAll(/pbTrainerBattle\(\s*:([A-Za-z0-9_]+)\s*,\s*"([^"]+)"(?:\s*,\s*([^,]+?))?(?:\s*,\s*(?:true|false|nil))?(?:\s*,\s*(\d+))?/g)) {
        const key = trainerKey(m[1].toUpperCase(), m[2], Number(m[4] || 0));
        if (!ctx.trainerKeys.has(key)) {
          at(evId, 0, `batalla contra entrenador inexistente en trainers.txt: [${m[1].toUpperCase()},${m[2]}${m[4] ? "," + m[4] : ""}]`, "error", ev.name);
        }
      }
    }
    if (ctx.species) {
      for (const m of all.matchAll(/pb(?:WildBattle|DoubleWildBattle|AddPokemon)\(\s*:([A-Za-z0-9_]+)/g)) {
        if (!ctx.species.has(m[1].toUpperCase())) at(evId, 0, `especie inexistente en pokemon.txt: ${m[1].toUpperCase()}`, "error", ev.name);
      }
    }
    if (ctx.items) {
      for (const m of all.matchAll(/pb(?:ItemBall|ReceiveItem)\(\s*:([A-Za-z0-9_]+)/g)) {
        if (!ctx.items.has(m[1].toUpperCase())) at(evId, 0, `objeto inexistente en items.txt: ${m[1].toUpperCase()}`, "error", ev.name);
      }
      for (const m of all.matchAll(/pbPokemonMart\(\[([\s\S]*?)\]\)/g)) {
        for (const it of m[1].matchAll(/:([A-Za-z0-9_]+)/g)) {
          if (!ctx.items.has(it[1].toUpperCase())) at(evId, 0, `objeto de tienda inexistente: ${it[1].toUpperCase()}`, "error", ev.name);
        }
      }
    }
    if (/Trainer\(\d+\)/i.test(ev.name)) {
      const trig = ev.pages[0] ? Number(ev.pages[0].obj.getIvar("trigger")) : 0;
      if (trig !== 2) at(evId, 0, `se llama ${ev.name} pero su disparador no es "Tocar evento" (no detectará al jugador)`, "warn", ev.name);
    }
    if (/^(HiddenItem|Item):/i.test(ev.name) && !/pbItemBall/i.test(all)) {
      at(evId, 0, `"${ev.name}" no se auto-convierte sin RPG Maker: necesita páginas con pbItemBall + self-switch`, "error", ev.name);
    }
  }
  return issues;
}
