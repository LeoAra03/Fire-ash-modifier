#!/usr/bin/env node
/**
 * Análisis estático exhaustivo de los datos compilados de Fire Ash.
 *
 * Recorre todos los MapXXX.rxdata y registra mapas, colisiones, eventos, NPC,
 * diálogos, flags, variables, objetos, especies, entrenadores y salidas. También
 * comprueba referencias, coordenadas, gráficos y las secciones comprimidas de
 * Scripts.rxdata. No escribe en Data/ ni en partidas.
 *
 * Uso:
 *   node tools/analyze_compiled_fire_ash.mjs
 *   node tools/analyze_compiled_fire_ash.mjs --out ruta/informe.json
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad, RHash, RString, RSymbol } from "../web/js/marshal.js";
import {
  mapListFromInfos, parseMap, parseEvent, parseTileset, cmdOf, rstr, tableGet,
} from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const defaultOut = path.join(GAME, "PokeModBackups", "analisis_total_fire_ash.json");
const outFlag = process.argv.indexOf("--out");
const OUT = path.resolve(outFlag >= 0 ? process.argv[outFlag + 1] : defaultOut);
const read = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const txt = (v) => v instanceof RString ? v.text : String(v ?? "");
const sym = (v) => v instanceof RSymbol ? v.name : String(v ?? "");
const add = (map, key, value) => {
  const k = String(key);
  if (!map.has(k)) map.set(k, []);
  map.get(k).push(value);
};
const mapToObject = (map) => Object.fromEntries([...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })));

function symbolicIds(file) {
  const value = read(file);
  const ids = new Set();
  if (value instanceof RHash) for (const [key] of value.pairs) if (key instanceof RSymbol) ids.add(key.name);
  return { value, ids };
}
function uniqueDataCount(value) {
  if (!(value instanceof RHash)) return Array.isArray(value) ? value.filter(Boolean).length : 0;
  return value.pairs.filter(([key]) => typeof key === "number").length;
}
function eventScript(list, start) {
  const lines = [rstr(cmdOf(list[start]).params[0])];
  let i = start + 1;
  while (i < list.length && cmdOf(list[i]).code === 655) {
    lines.push(rstr(cmdOf(list[i]).params[0]));
    i++;
  }
  return { text: lines.join("\n"), next: i };
}
function scanRefs(script, where, report) {
  for (const m of script.matchAll(/pbTrainerBattle\(\s*:([A-Za-z0-9_]+)\s*,\s*["']([^"']+)["']([\s\S]*?)\)/g)) {
    const tail = m[3].replace(/^\s*,/, "").split(",").map((s) => s.trim());
    // Tras tipo/nombre: endSpeech, doubleBattle, trainerPartyID.
    const version = /^\d+$/.test(tail[2] || "") ? Number(tail[2]) : 0;
    report.trainerBattles.push({ type: m[1], name: m[2], version, ...where, call: m[0] });
  }
  for (const m of script.matchAll(/pb(?:ItemBall|ReceiveItem)\(\s*:([A-Za-z0-9_]+)/g)) {
    add(report.itemUses, m[1].toUpperCase(), where);
  }
  for (const m of script.matchAll(/pbPokemonMart\s*\(\s*\[([\s\S]*?)\]/g)) {
    for (const it of m[1].matchAll(/:([A-Za-z0-9_]+)/g)) add(report.itemUses, it[1].toUpperCase(), where);
  }
  for (const m of script.matchAll(/pb(?:WildBattle|DoubleWildBattle|AddPokemon)\(\s*:([A-Za-z0-9_]+)/g)) {
    add(report.speciesUses, m[1].toUpperCase(), where);
  }
  for (const m of script.matchAll(/\$game_switches\s*\[\s*(\d+)\s*\]/g)) add(report.switchUses, Number(m[1]), { ...where, mode: "script" });
  for (const m of script.matchAll(/\$game_variables\s*\[\s*(\d+)\s*\]/g)) add(report.variableUses, Number(m[1]), { ...where, mode: "script" });
}

const mapInfosObj = read("MapInfos.rxdata");
const mapInfos = mapListFromInfos(mapInfosObj);
const mapInfoById = new Map(mapInfos.map((m) => [m.id, m]));
const mapIds = new Set(mapInfos.map((m) => m.id));
const mapSizes = new Map();
const tilesetRaw = read("Tilesets.rxdata");
const tilesets = new Map();
for (let i = 1; i < tilesetRaw.length; i++) if (tilesetRaw[i]) {
  try { tilesets.set(i, parseTileset(tilesetRaw[i])); } catch { /* se reporta al usarlo */ }
}
const system = read("System.rxdata");
const switchNames = (system.getIvar("switches") || []).map(txt);
const variableNames = (system.getIvar("variables") || []).map(txt);
const speciesData = symbolicIds("species.dat");
const itemData = symbolicIds("items.dat");
const trainerTypeData = symbolicIds("trainer_types.dat");
const trainerData = read("trainers.dat");
const trainerKeys = new Set();
for (const [key] of trainerData.pairs) {
  if (Array.isArray(key) && key.length >= 3) trainerKeys.add(`${sym(key[0])}|${txt(key[1])}|${Number(key[2])}`);
}
const characterFiles = new Set(fs.readdirSync(path.join(GAME, "Graphics", "Characters")));

const report = {
  generatedAt: new Date().toISOString(),
  gameDirectory: "pokemon_fire_ash",
  totals: {
    mapInfos: mapInfos.length, mapsRead: 0, tilesets: tilesets.size,
    events: 0, pages: 0, npcs: 0, dialogues: 0, choices: 0, scriptsInEvents: 0,
    transfers: 0, trainerBattles: 0, commonEvents: 0, scriptSections: 0,
    species: uniqueDataCount(speciesData.value), items: uniqueDataCount(itemData.value),
    trainerTypes: uniqueDataCount(trainerTypeData.value), trainers: uniqueDataCount(trainerData),
    mapCells: 0, blockedCells: 0, partialCells: 0,
  },
  maps: [], dialogues: [], npcs: [], transfers: [], trainerBattles: [],
  switchUses: new Map(), variableUses: new Map(), selfSwitchUses: [],
  itemUses: new Map(), speciesUses: new Map(),
  regions: {}, issues: [], scripts: [],
};

// Primera pasada: tamaños y archivos.
for (const info of mapInfos) {
  const file = `Map${String(info.id).padStart(3, "0")}.rxdata`;
  const full = path.join(DATA, file);
  if (!fs.existsSync(full)) {
    report.issues.push({ level: "error", where: `Mapa ${info.id}`, message: `${file} no existe` });
    continue;
  }
  try {
    const parsed = parseMap(read(file));
    mapSizes.set(info.id, { width: parsed.width, height: parsed.height });
  } catch (e) {
    report.issues.push({ level: "error", where: `Mapa ${info.id}`, message: `no se puede leer: ${e.message}` });
  }
}

// Metadatos de región/isla.
const metadata = read("map_metadata.dat");
const positions = new Map();
for (const [id, obj] of metadata.pairs) {
  const pos = obj?.getIvar?.("town_map_position");
  if (Array.isArray(pos) && pos.length >= 3) positions.set(Number(id), pos.map(Number));
}

for (const info of mapInfos) {
  const file = `Map${String(info.id).padStart(3, "0")}.rxdata`;
  if (!fs.existsSync(path.join(DATA, file))) continue;
  let parsed;
  try { parsed = parseMap(read(file)); } catch { continue; }
  report.totals.mapsRead++;
  const tileset = tilesets.get(parsed.tilesetId);
  const mapRec = {
    id: info.id, name: info.name, parent: info.parent, width: parsed.width, height: parsed.height,
    tilesetId: parsed.tilesetId, events: parsed.events.length, dialogues: 0, npcs: 0,
    transfers: 0, collision: null, region: positions.get(info.id) || null,
  };
  report.totals.events += parsed.events.length;
  report.totals.mapCells += parsed.width * parsed.height;
  if (mapRec.region) {
    const [region, x, y] = mapRec.region;
    if (!report.regions[region]) report.regions[region] = { mapCount: 0, positions: {} };
    report.regions[region].mapCount++;
    const posKey = `${x},${y}`;
    if (!report.regions[region].positions[posKey]) report.regions[region].positions[posKey] = [];
    report.regions[region].positions[posKey].push({ id: info.id, name: info.name });
  }

  if (tileset) {
    let blocked = 0, partial = 0;
    for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) {
      let passage = 0;
      for (let z = 0; z < parsed.table.z; z++) {
        const tile = tableGet(parsed.table, x, y, z);
        if (tile > 0 && tile < tileset.passages.data.length) passage |= tileset.passages.data[tile] & 0x0f;
      }
      if (passage === 0x0f) blocked++;
      else if (passage !== 0) partial++;
    }
    mapRec.collision = { total: parsed.width * parsed.height, blocked, partial, open: parsed.width * parsed.height - blocked - partial };
    report.totals.blockedCells += blocked;
    report.totals.partialCells += partial;
  } else {
    report.issues.push({ level: "error", where: `Mapa ${info.id}`, message: `tileset ${parsed.tilesetId} ilegible` });
  }

  for (const { id: eventId, obj } of parsed.events) {
    let ev;
    try { ev = parseEvent(obj); } catch (e) {
      report.issues.push({ level: "error", where: `Mapa ${info.id} evento ${eventId}`, message: e.message });
      continue;
    }
    if (ev.x < 0 || ev.y < 0 || ev.x >= parsed.width || ev.y >= parsed.height) {
      report.issues.push({ level: "error", where: `Mapa ${info.id} evento ${eventId}`, message: `posición fuera de rango (${ev.x},${ev.y})` });
    }
    report.totals.pages += ev.pages.length;
    for (const pg of ev.pages) {
      const where = { mapId: info.id, mapName: info.name, eventId, eventName: ev.name, page: pg.index + 1 };
      if (pg.condition?.switch1) add(report.switchUses, pg.condition.switch1, { ...where, mode: "page condition" });
      if (pg.condition?.switch2) add(report.switchUses, pg.condition.switch2, { ...where, mode: "page condition" });
      if (pg.condition?.variable) add(report.variableUses, pg.condition.variable.id, { ...where, mode: "page condition" });
      if (pg.condition?.selfSwitch) report.selfSwitchUses.push({ ...where, selfSwitch: pg.condition.selfSwitch, mode: "page condition" });
      const charName = pg.graphic?.charName || "";
      if (charName) {
        if (pg.index === 0) {
          report.totals.npcs++; mapRec.npcs++;
          report.npcs.push({ ...where, x: ev.x, y: ev.y, sprite: charName });
        }
        if (!characterFiles.has(`${charName}.png`) && !characterFiles.has(`${charName}.PNG`)) {
          report.issues.push({ level: "warn", where: `Mapa ${info.id} evento ${eventId} página ${pg.index + 1}`, message: `sprite ausente: ${charName}` });
        }
      }
      const list = pg.list || [];
      for (let i = 0; i < list.length;) {
        const c = cmdOf(list[i]);
        const p = c.params;
        if (c.code === 101) {
          const lines = [];
          const first = rstr(p[0]);
          if (first) lines.push(first);
          i++;
          while (i < list.length && cmdOf(list[i]).code === 401) {
            lines.push(rstr(cmdOf(list[i]).params[0])); i++;
          }
          const line = lines.join("\n");
          report.dialogues.push({ ...where, text: line });
          report.totals.dialogues++; mapRec.dialogues++;
          continue;
        }
        if (c.code === 102) {
          report.dialogues.push({ ...where, kind: "choice", text: (p[0] || []).map(rstr).join(" / ") });
          report.totals.choices++;
        } else if (c.code === 355) {
          const found = eventScript(list, i);
          report.totals.scriptsInEvents++;
          scanRefs(found.text, where, report);
          i = found.next;
          continue;
        } else if (c.code === 111) {
          if (Number(p[0]) === 0) add(report.switchUses, Number(p[1]), { ...where, mode: "branch" });
          else if (Number(p[0]) === 1) add(report.variableUses, Number(p[1]), { ...where, mode: "branch" });
          else if (Number(p[0]) === 12) scanRefs(rstr(p[1]), where, report);
        } else if (c.code === 121) {
          for (let id = Number(p[0]); id <= Number(p[1]); id++) add(report.switchUses, id, { ...where, mode: Number(p[2]) === 0 ? "set ON" : "set OFF" });
        } else if (c.code === 122) {
          for (let id = Number(p[0]); id <= Number(p[1]); id++) add(report.variableUses, id, { ...where, mode: "set" });
        } else if (c.code === 123) {
          report.selfSwitchUses.push({ ...where, selfSwitch: rstr(p[0]), mode: Number(p[1]) === 0 ? "set ON" : "set OFF" });
        } else if (c.code === 126) {
          add(report.itemUses, `RMXP_ITEM_${p[0]}`, where);
        } else if (c.code === 201 && Number(p[0]) === 0) {
          const target = { mapId: Number(p[1]), x: Number(p[2]), y: Number(p[3]) };
          report.transfers.push({ ...where, target });
          report.totals.transfers++; mapRec.transfers++;
          const size = mapSizes.get(target.mapId);
          if (!size) report.issues.push({ level: "error", where: `Mapa ${info.id} evento ${eventId}`, message: `salida a mapa inexistente ${target.mapId}` });
          else if (target.x < 0 || target.y < 0 || target.x >= size.width || target.y >= size.height) {
            report.issues.push({ level: "error", where: `Mapa ${info.id} evento ${eventId}`, message: `salida fuera de rango: mapa ${target.mapId} (${target.x},${target.y})` });
          }
        }
        i++;
      }
    }
  }
  report.maps.push(mapRec);
}

// Eventos comunes: mismas referencias/flags fuera de los mapas.
const common = read("CommonEvents.rxdata");
for (let id = 1; id < common.length; id++) {
  const ce = common[id];
  if (!ce) continue;
  report.totals.commonEvents++;
  const where = { commonEventId: id, commonEventName: txt(ce.getIvar("name")) };
  const list = ce.getIvar("list") || [];
  for (let i = 0; i < list.length;) {
    const c = cmdOf(list[i]), p = c.params;
    if (c.code === 355) {
      const found = eventScript(list, i); scanRefs(found.text, where, report); i = found.next; continue;
    }
    if (c.code === 111) {
      if (Number(p[0]) === 0) add(report.switchUses, Number(p[1]), { ...where, mode: "branch" });
      else if (Number(p[0]) === 1) add(report.variableUses, Number(p[1]), { ...where, mode: "branch" });
      else if (Number(p[0]) === 12) scanRefs(rstr(p[1]), where, report);
    } else if (c.code === 121) {
      for (let n = Number(p[0]); n <= Number(p[1]); n++) add(report.switchUses, n, { ...where, mode: Number(p[2]) === 0 ? "set ON" : "set OFF" });
    } else if (c.code === 122) {
      for (let n = Number(p[0]); n <= Number(p[1]); n++) add(report.variableUses, n, { ...where, mode: "set" });
    }
    i++;
  }
}

// Inventario/equipos compilados: índice completo de especies y objetos usados.
for (const [key, trainer] of trainerData.pairs) {
  if (typeof key !== "number") continue;
  const where = { trainerId: key, type: sym(trainer.getIvar("trainer_type")), name: txt(trainer.getIvar("real_name")), version: Number(trainer.getIvar("version")) };
  for (const item of trainer.getIvar("items") || []) add(report.itemUses, sym(item), { ...where, mode: "trainer item" });
  for (const pkmn of trainer.getIvar("pokemon") || []) {
    if (!(pkmn instanceof RHash)) continue;
    const get = (name) => pkmn.pairs.find(([k]) => sym(k) === name)?.[1];
    const species = sym(get("species"));
    if (species) add(report.speciesUses, species, { ...where, mode: "trainer Pokemon" });
    const held = get("item");
    if (held) add(report.itemUses, sym(held), { ...where, mode: "held item", species });
  }
}

// Todas las secciones de script deben poder descomprimirse; sus referencias
// literales se incluyen en el índice global junto con mapas y eventos comunes.
const scripts = read("Scripts.rxdata");
for (let i = 0; i < scripts.length; i++) {
  const [id, name, packed] = scripts[i];
  try {
    const code = zlib.inflateSync(Buffer.from(packed.bytes)).toString("utf8");
    const scriptName = txt(name);
    report.scripts.push({ index: i, id, name: scriptName, bytes: code.length, lines: code.split(/\r?\n/).length });
    scanRefs(code, { scriptIndex: i, scriptName }, report);
  } catch (e) {
    report.issues.push({ level: "error", where: `Script ${i} ${txt(name)}`, message: `zlib inválido: ${e.message}` });
  }
}
report.totals.scriptSections = report.scripts.length;

// Validar referencias simbólicas después de recorrer mapas, eventos comunes,
// entrenadores y scripts. Las referencias numéricas RMXP no son símbolos PBS.
for (const battle of report.trainerBattles) {
  const key = `${battle.type}|${battle.name}|${battle.version}`;
  if (!trainerKeys.has(key)) report.issues.push({ level: "error", where: battle, message: `entrenador compilado inexistente: ${key}` });
}
for (const [item, uses] of report.itemUses) {
  if (!item.startsWith("RMXP_ITEM_") && !itemData.ids.has(item)) {
    report.issues.push({ level: "warn", where: uses[0], message: `objeto simbólico no definido: ${item} (${uses.length} usos)` });
  }
}
for (const [species, uses] of report.speciesUses) {
  if (!speciesData.ids.has(species)) {
    report.issues.push({ level: "error", where: uses[0], message: `especie simbólica no definida: ${species} (${uses.length} usos)` });
  }
}
report.totals.trainerBattles = report.trainerBattles.length;

// Añadir nombres de flags y convertir Maps en JSON.
report.switches = mapToObject(new Map([...report.switchUses].map(([id, uses]) => [id, { name: switchNames[Number(id)] || "", uses }])));
report.variables = mapToObject(new Map([...report.variableUses].map(([id, uses]) => [id, { name: variableNames[Number(id)] || "", uses }])));
report.itemUses = mapToObject(report.itemUses);
report.speciesUses = mapToObject(report.speciesUses);
delete report.switchUses;
delete report.variableUses;
report.totals.switchesReferenced = Object.keys(report.switches).length;
report.totals.variablesReferenced = Object.keys(report.variables).length;
report.totals.itemKindsReferenced = Object.keys(report.itemUses).length;
report.totals.speciesKindsReferenced = Object.keys(report.speciesUses).length;
report.totals.issues = report.issues.length;
report.totals.errors = report.issues.filter((i) => i.level === "error").length;
report.totals.warnings = report.issues.filter((i) => i.level === "warn").length;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.totals, null, 2));
console.log(`Regiones/islas indexadas: ${Object.keys(report.regions).length}`);
console.log(`Informe detallado: ${path.relative(ROOT, OUT)}`);
