#!/usr/bin/env node
/**
 * Inventario congelado del estado del repo.
 *
 * Solo lee Data/, Scripts/ y tools/ (y el plan canónico en content/). Escribe
 * únicamente:
 *   tools/inventario_congelado.json
 *   docs/ESTADO_CONGELADO.md
 *
 * Uso:
 *   node tools/inventario_congelado.mjs
 *   node tools/inventario_congelado.mjs --verify
 *
 * --verify recalcula el inventario y lo compara con el JSON previo. No reescribe
 * si coincide. Sale 0 solo cuando hashes, mapas, anclas, pares y el rango
 * reservado coinciden. generatedAt y la metadata git no forman parte de la
 * comparación: cambian sin que el contenido congelado cambie.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../web/js/marshal.js";
import { parseEvent, cmdOf, rstr } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERIFY = process.argv.includes("--verify");
const JSON_PATH = path.join(ROOT, "tools", "inventario_congelado.json");
const MD_PATH = path.join(ROOT, "docs", "ESTADO_CONGELADO.md");
const GAME_DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const SKIP_DIRS = new Set([".git", "node_modules", "PokeModBackups", "xml"]);
const HASH_ROOTS = new Set(["Data", "Scripts", "tools"]);
const OUTPUT_REL = "tools/inventario_congelado.json";

const RANGES = [
  { id: "horizontes", label: "Horizontes", from: 1001, to: 1020 },
  { id: "atlas_mil", label: "Atlas Mil", from: 1021, to: 2020 },
  { id: "dn", label: "Dimensional Nightmare", from: 2040, to: 2190 },
  { id: "nexo", label: "NEXO", from: 2136, to: 2140, overlaps: "dn" },
  { id: "liga_oscura", label: "Liga Oscura", from: 2141, to: 2142, overlaps: "dn" },
  { id: "team_rocket", label: "Team Rocket", from: 2220, to: 2221 },
];

const BASE_SWITCHES = {
  701: "POKEMOD HYPNO RESCUE STARTED",
  702: "POKEMOD HYPNO SUBDUED",
  703: "POKEMOD CHILDREN RESCUED",
  704: "POKEMOD HORIZONS OPEN",
  705: "POKEMOD HORIZONS 500 COMPLETE",
  706: "POKEMOD ATLAS MIL OPEN",
  707: "POKEMOD ATLAS MIL 500 COMPLETE",
};
const BASE_VARIABLES = {
  101: "POKEMOD HORIZONS COMPLETED",
  102: "POKEMOD ATLAS MIL COMPLETED",
  103: "POKEMOD ATLAS NARRATIVE SEALS",
};
const RESERVED = {
  switches: { from: 701, to: 867 },
  variables: { from: 101, to: 263 },
};

const text = (value) => (value instanceof RString ? value.text : rstr(value));

function gitMeta() {
  const run = (args) => {
    try {
      return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
    } catch {
      return "";
    }
  };
  return {
    branch: run(["rev-parse", "--abbrev-ref", "HEAD"]),
    commit: run(["rev-parse", "HEAD"]),
  };
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walkHashRoots() {
  const files = [];
  const visit = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  const discover = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (HASH_ROOTS.has(entry.name)) visit(full);
      else discover(full);
    }
  };
  discover(ROOT);
  return files
    .map(rel)
    .filter((file) => file !== OUTPUT_REL)
    .sort();
}

function sha256File(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function hashFiles(relativePaths) {
  return relativePaths.map((file) => {
    const full = path.join(ROOT, file);
    const bytes = fs.statSync(full).size;
    return { path: file, bytes, sha256: sha256File(full) };
  });
}

function mapIdsFrom(dir) {
  if (!fs.existsSync(dir)) return [];
  const ids = [];
  for (const name of fs.readdirSync(dir)) {
    const match = /^Map(\d+)\.rxdata$/.exec(name);
    if (match) ids.push(Number(match[1]));
  }
  ids.sort((a, b) => a - b);
  return ids;
}

function rangeReport(ids) {
  const present = new Set(ids);
  return RANGES.map((range) => {
    const found = [];
    for (let id = range.from; id <= range.to; id++) if (present.has(id)) found.push(id);
    const missing = [];
    if (range.to - range.from < 40) {
      for (let id = range.from; id <= range.to; id++) if (!present.has(id)) missing.push(id);
    }
    return {
      id: range.id,
      label: range.label,
      from: range.from,
      to: range.to,
      overlaps: range.overlaps || null,
      count: found.length,
      span: range.to - range.from + 1,
      missing,
    };
  });
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function canonicalAssignments() {
  const switches = new Map();
  const variables = new Map();
  const claim = (store, id, name, source) => {
    const key = Number(id);
    const row = store.get(key) || { id: key, names: [], sources: [] };
    if (name && !row.names.includes(name)) row.names.push(name);
    if (!row.sources.includes(source)) row.sources.push(source);
    store.set(key, row);
  };
  for (const [id, name] of Object.entries(BASE_SWITCHES)) claim(switches, id, name, "base");
  for (const [id, name] of Object.entries(BASE_VARIABLES)) claim(variables, id, name, "base");

  const approved = loadJson("content/atlas_tier1_blueprints_approved.json");
  const blueprints = approved.blueprints || [];
  const anchors = blueprints.map((blueprint, index) => {
    const sw = blueprint.flags?.globalSwitches?.[0] || {};
    const variable = (blueprint.flags?.variables || []).find((row) => Number(row.id) === 103)
      || { id: 103, name: BASE_VARIABLES[103] };
    const switchId = Number(sw.id);
    const decisionId = 104 + (switchId - 708);
    claim(switches, switchId, sw.name || "", "tier1");
    claim(variables, 103, variable.name || BASE_VARIABLES[103], "tier1");
    claim(variables, decisionId, `POKEMOD ATLAS DECISION ${String(switchId - 707).padStart(2, "0")}`, "tier1-decision");
    return {
      index: index + 1,
      mapId: Number(blueprint.mapId),
      title: blueprint.title || "",
      switchId,
      switchName: sw.name || "",
      variableId: 103,
      variableName: variable.name || BASE_VARIABLES[103],
      decisionVariableId: decisionId,
      selfSwitches: (blueprint.flags?.selfSwitches || []).map((row) => ({
        event: row.event || "",
        letter: row.letter || "",
        purpose: row.purpose || "",
      })),
    };
  });

  const tier2Dir = path.join(ROOT, "content");
  for (const name of fs.readdirSync(tier2Dir).filter((file) => /^atlas_tier2_blueprints_macro\d+\.json$/.test(file)).sort()) {
    const data = loadJson(path.join("content", name));
    for (const blueprint of data.blueprints || []) {
      const switchId = Number(blueprint.progression?.switchId);
      const variableId = Number(blueprint.progression?.decisionVariable);
      const route = String(switchId - 747).padStart(2, "0");
      claim(switches, switchId, `POKEMOD ATLAS T2 ROUTE ${route}`, `tier2:${name}`);
      claim(variables, variableId, `POKEMOD ATLAS T2 DECISION ${route}`, `tier2:${name}`);
    }
  }
  return { switches, variables, anchors };
}

function blankUse(id, name = "") {
  return { id, name, reads: 0, writes: 0, scriptAccess: 0 };
}

function noteName(store, id, name) {
  const key = Number(id);
  if (!Number.isInteger(key) || key <= 0 || !name) return;
  if (!store.has(key)) store.set(key, blankUse(key, name));
  else if (!store.get(key).name) store.get(key).name = name;
}

function useNumeric(store, id, kind, name = "") {
  const key = Number(id);
  if (!Number.isInteger(key) || key <= 0) return;
  if (!store.has(key)) store.set(key, blankUse(key, name));
  const row = store.get(key);
  if (name && !row.name) row.name = name;
  if (kind === "read") row.reads++;
  else if (kind === "script") row.scriptAccess++;
  else if (kind === "write") row.writes++;
}

function useSelf(store, key, kind) {
  if (!key) return;
  if (!store.has(key)) store.set(key, { key, reads: 0, writes: 0 });
  const row = store.get(key);
  if (kind === "read") row.reads++;
  else row.writes++;
}

function scanRuby(code, switches, variables, dynamic) {
  if (!code) return;
  for (const match of code.matchAll(/\$game_switches\s*\[\s*([^\]]+)\s*\]/g)) {
    const expr = match[1].trim();
    if (/^\d+$/.test(expr)) useNumeric(switches, Number(expr), "script");
    else dynamic.push({ kind: "switch", expression: expr.slice(0, 160) });
  }
  for (const match of code.matchAll(/\$game_variables\s*\[\s*([^\]]+)\s*\]/g)) {
    const expr = match[1].trim();
    if (/^\d+$/.test(expr)) useNumeric(variables, Number(expr), "script");
    else dynamic.push({ kind: "variable", expression: expr.slice(0, 160) });
  }
  for (const match of code.matchAll(/\$game_self_switches\s*\[\s*([^\n]+?)\s*\]/g)) {
    dynamic.push({ kind: "self-switch", expression: match[1].slice(0, 160) });
  }
}

function scanList(list, base, switches, variables, selfSwitches, dynamic) {
  for (let i = 0; i < list.length;) {
    const command = cmdOf(list[i]);
    const params = command.params;
    if (command.code === 111) {
      const type = Number(params[0]);
      if (type === 0) useNumeric(switches, Number(params[1]), "read");
      else if (type === 1) useNumeric(variables, Number(params[1]), "read");
      else if (type === 2) useSelf(selfSwitches, `${base}:${rstr(params[1])}`, "read");
      else if (type === 12) scanRuby(rstr(params[1]), switches, variables, dynamic);
    } else if (command.code === 121) {
      for (let id = Number(params[0]); id <= Number(params[1]); id++) useNumeric(switches, id, "write");
    } else if (command.code === 122) {
      for (let id = Number(params[0]); id <= Number(params[1]); id++) useNumeric(variables, id, "write");
      if (Number(params[3]) === 4) scanRuby(rstr(params[4]), switches, variables, dynamic);
    } else if (command.code === 123) {
      useSelf(selfSwitches, `${base}:${rstr(params[0])}`, "write");
    } else if (command.code === 355) {
      const lines = [rstr(params[0])];
      let j = i + 1;
      while (j < list.length && cmdOf(list[j]).code === 655) {
        lines.push(rstr(cmdOf(list[j]).params[0]));
        j++;
      }
      scanRuby(lines.join("\n"), switches, variables, dynamic);
      i = j;
      continue;
    }
    i++;
  }
}

function scanPage(page, base, switches, variables, selfSwitches, dynamic) {
  const condition = page.condition;
  if (condition?.switch1) useNumeric(switches, condition.switch1, "read");
  if (condition?.switch2) useNumeric(switches, condition.switch2, "read");
  if (condition?.variable?.id) useNumeric(variables, condition.variable.id, "read");
  if (condition?.selfSwitch) useSelf(selfSwitches, `${base}:${condition.selfSwitch}`, "read");
  scanList(page.list || [], base, switches, variables, selfSwitches, dynamic);
}

function scanLiveGame() {
  const switches = new Map();
  const variables = new Map();
  const selfSwitches = new Map();
  const dynamic = [];
  const unreadable = [];
  const names = readSystemNames();
  for (const [id, name] of names.switches) noteName(switches, id, name);
  for (const [id, name] of names.variables) noteName(variables, id, name);

  const mapIds = mapIdsFrom(GAME_DATA);
  let scanned = 0;
  for (const id of mapIds) {
    const file = path.join(GAME_DATA, `Map${String(id).padStart(3, "0")}.rxdata`);
    try {
      const map = marshalLoad(fs.readFileSync(file));
      const events = map.getIvar("events") || map.getIvar("@events");
      const pairs = events?.pairs || [];
      for (const [key, object] of pairs) {
        let event;
        try {
          event = parseEvent(object);
        } catch (error) {
          unreadable.push({ file: rel(file), error: String(error.message || error) });
          continue;
        }
        const eventId = event.id || Number(key);
        const base = `${id}:${eventId}`;
        for (const page of event.pages) scanPage(page, base, switches, variables, selfSwitches, dynamic);
      }
    } catch (error) {
      unreadable.push({ file: rel(file), error: String(error.message || error) });
    }
    scanned++;
    if (scanned % 500 === 0) console.error(`inventario: ${scanned}/${mapIds.length} mapas`);
  }

  const commonFile = path.join(GAME_DATA, "CommonEvents.rxdata");
  let commonEvents = 0;
  if (fs.existsSync(commonFile)) {
    const common = marshalLoad(fs.readFileSync(commonFile));
    for (let id = 1; id < common.length; id++) {
      const event = common[id];
      if (!event) continue;
      commonEvents++;
      const trigger = Number(event.getIvar("switch_id") || 0);
      if (trigger) useNumeric(switches, trigger, "read");
      scanList(event.getIvar("list") || [], `CE${id}:0`, switches, variables, selfSwitches, dynamic);
    }
  }

  const scriptFile = path.join(GAME_DATA, "Scripts.rxdata");
  let scriptSections = 0;
  if (fs.existsSync(scriptFile)) {
    const scripts = marshalLoad(fs.readFileSync(scriptFile));
    scriptSections = scripts.filter(Boolean).length;
    for (const row of scripts) {
      if (!row) continue;
      try {
        const code = zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
        scanRuby(code, switches, variables, dynamic);
      } catch {
        unreadable.push({ file: "pokemon_fire_ash/Data/Scripts.rxdata", error: "sección no inflable" });
      }
    }
  }

  const dynamicUnique = [...new Map(dynamic.map((row) => [`${row.kind}|${row.expression}`, row])).values()]
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.expression.localeCompare(b.expression));
  return {
    switches,
    variables,
    selfSwitches,
    dynamicExpressions: dynamicUnique,
    unreadable,
    commonEvents,
    scriptSections,
    names,
  };
}

function readSystemNames() {
  const system = marshalLoad(fs.readFileSync(path.join(GAME_DATA, "System.rxdata")));
  const switches = (system.getIvar("switches") || []).map(text);
  const variables = (system.getIvar("variables") || []).map(text);
  return {
    switches: switches.map((name, id) => [id, name]).filter(([id, name]) => id > 0 && name),
    variables: variables.map((name, id) => [id, name]).filter(([id, name]) => id > 0 && name),
    switchSlots: Math.max(0, switches.length - 1),
    variableSlots: Math.max(0, variables.length - 1),
  };
}

function usedRows(store, kind) {
  const rows = [...store.values()].filter((row) => row.reads || row.writes || row.scriptAccess);
  rows.sort((a, b) => (a.id ?? 0) - (b.id ?? 0) || String(a.key).localeCompare(String(b.key)));
  return rows.map((row) => ({ kind, ...row }));
}

function reservedReport(kind, bounds, assigned, used) {
  const unassigned = [];
  const unassignedUsed = [];
  const nameMismatches = [];
  for (let id = bounds.from; id <= bounds.to; id++) {
    const claim = assigned.get(id);
    const live = used.get(id);
    const systemName = live?.name || "";
    if (!claim) {
      unassigned.push(id);
      const touched = (live?.reads || 0) + (live?.writes || 0) + (live?.scriptAccess || 0) > 0 || Boolean(systemName);
      if (touched) unassignedUsed.push({ id, systemName, reads: live?.reads || 0, writes: live?.writes || 0, scriptAccess: live?.scriptAccess || 0 });
      continue;
    }
    if (claim.names.length > 1) {
      nameMismatches.push({ id, kind, reason: "asignación canónica duplicada", names: claim.names, sources: claim.sources });
    }
    if (systemName && claim.names[0] && systemName !== claim.names[0]) {
      nameMismatches.push({ id, kind, reason: "el nombre en System.rxdata no coincide con el plan", expected: claim.names[0], actual: systemName });
    }
  }
  return {
    from: bounds.from,
    to: bounds.to,
    span: bounds.to - bounds.from + 1,
    assigned: bounds.to - bounds.from + 1 - unassigned.length,
    unassigned,
    unassignedUsed,
    nameMismatches,
    unassignedPortionFree: unassignedUsed.length === 0,
  };
}

function buildInventory() {
  console.error("inventario: hashes…");
  const files = hashFiles(walkHashRoots());
  const byRoot = { Data: 0, Scripts: 0, tools: 0 };
  for (const file of files) {
    const parts = file.path.split("/");
    const root = parts.find((part) => HASH_ROOTS.has(part));
    if (root) byRoot[root]++;
  }
  const liveIds = mapIdsFrom(GAME_DATA);
  const infos = marshalLoad(fs.readFileSync(path.join(GAME_DATA, "MapInfos.rxdata")));
  const infoIds = new Set((infos.pairs || []).map(([key]) => Number(key)));
  console.error("inventario: flags del juego vivo…");
  const live = scanLiveGame();
  const plan = canonicalAssignments();
  const switchRows = usedRows(live.switches, "switch");
  const variableRows = usedRows(live.variables, "variable");
  const selfRows = usedRows(live.selfSwitches, "self-switch");
  const reservedSwitches = reservedReport("switch", RESERVED.switches, plan.switches, live.switches);
  const reservedVariables = reservedReport("variable", RESERVED.variables, plan.variables, live.variables);
  const anchorCollisions = [];
  const seenSwitch = new Map();
  const seenMap = new Map();
  for (const anchor of plan.anchors) {
    if (anchor.mapId < 1021 || anchor.mapId > 1996) anchorCollisions.push({ mapId: anchor.mapId, reason: "mapId fuera de 1021-1996" });
    if (anchor.switchId < 708 || anchor.switchId > 747) anchorCollisions.push({ mapId: anchor.mapId, reason: `switch ${anchor.switchId} fuera de 708-747` });
    if (anchor.variableId !== 103) anchorCollisions.push({ mapId: anchor.mapId, reason: `variable ${anchor.variableId} no es 103` });
    if (!liveIds.includes(anchor.mapId)) anchorCollisions.push({ mapId: anchor.mapId, reason: "el mapa no existe en pokemon_fire_ash/Data" });
    if (seenSwitch.has(anchor.switchId)) anchorCollisions.push({ mapId: anchor.mapId, reason: `switch ${anchor.switchId} repetido con el mapa ${seenSwitch.get(anchor.switchId)}` });
    if (seenMap.has(anchor.mapId)) anchorCollisions.push({ mapId: anchor.mapId, reason: "mapId repetido" });
    seenSwitch.set(anchor.switchId, anchor.mapId);
    seenMap.set(anchor.mapId, anchor.switchId);
  }
  const collisions = [
    ...anchorCollisions,
    ...reservedSwitches.nameMismatches,
    ...reservedVariables.nameMismatches,
    ...reservedSwitches.unassignedUsed.map((row) => ({ ...row, kind: "switch", reason: "ID reservado no asignado con uso" })),
    ...reservedVariables.unassignedUsed.map((row) => ({ ...row, kind: "variable", reason: "ID reservado no asignado con uso" })),
  ];
  const scriptFiles = files.filter((file) => file.path.split("/").includes("Scripts") || file.path.endsWith("/Scripts.rxdata") || file.path.endsWith("Scripts.rxdata"));
  return {
    generatedAt: new Date().toISOString(),
    git: gitMeta(),
    scope: {
      hashRoots: ["Data/", "Scripts/", "tools/"],
      excluded: ["PokeModBackups/", "node_modules/", ".git/", OUTPUT_REL],
      liveGame: "pokemon_fire_ash/Data",
      note: "No hay un directorio Scripts/ de fuentes sueltas. Las secciones Ruby viven en Scripts.rxdata, hasheado dentro de cada Data/. El conteo de mapas y de pares es el del juego vivo, para no duplicar los paquetes de Scripts_corregido.",
    },
    hashes: {
      algorithm: "sha256",
      fileCount: files.length,
      byRoot,
      files,
    },
    maps: {
      source: "pokemon_fire_ash/Data",
      total: liveIds.length,
      registeredInMapInfos: infoIds.size,
      min: liveIds[0] ?? null,
      max: liveIds.at(-1) ?? null,
      ranges: rangeReport(liveIds),
    },
    scripts: {
      total: live.scriptSections,
      sectionsInLiveScriptsRxdata: live.scriptSections,
      commonEvents: live.commonEvents,
      scriptFilesHashed: scriptFiles.length,
      filesUnderScriptsDirectory: byRoot.Scripts,
    },
    anchors: plan.anchors,
    ids: {
      pairCount: switchRows.length + variableRows.length + selfRows.length,
      switches: switchRows.length,
      variables: variableRows.length,
      selfSwitches: selfRows.length,
      dynamicExpressions: live.dynamicExpressions.length,
      switchesUsed: switchRows,
      variablesUsed: variableRows,
      selfSwitchesUsed: selfRows,
      dynamic: live.dynamicExpressions,
    },
    reserved: {
      switches: reservedSwitches,
      variables: reservedVariables,
      unassignedPortionFree: reservedSwitches.unassignedPortionFree && reservedVariables.unassignedPortionFree,
    },
    collisions,
    unreadable: live.unreadable,
  };
}

function stableView(inventory) {
  const { generatedAt, git, ...rest } = inventory;
  return rest;
}

function diffSummary(previous, next) {
  const lines = [];
  const prevFiles = new Map((previous.hashes?.files || []).map((file) => [file.path, file.sha256]));
  const nextFiles = new Map((next.hashes?.files || []).map((file) => [file.path, file.sha256]));
  const changed = [];
  for (const [file, hash] of nextFiles) if (prevFiles.get(file) !== hash) changed.push(file);
  for (const file of prevFiles.keys()) if (!nextFiles.has(file)) changed.push(file);
  if (changed.length) lines.push(`hashes distintos: ${changed.length} (ej. ${changed.slice(0, 8).join(", ")})`);
  if (previous.maps?.total !== next.maps?.total) lines.push(`mapas ${previous.maps?.total} → ${next.maps?.total}`);
  if (previous.scripts?.total !== next.scripts?.total) lines.push(`scripts ${previous.scripts?.total} → ${next.scripts?.total}`);
  if (previous.ids?.pairCount !== next.ids?.pairCount) lines.push(`pares ID ${previous.ids?.pairCount} → ${next.ids?.pairCount}`);
  if ((previous.collisions || []).length !== next.collisions.length) lines.push(`colisiones ${previous.collisions.length} → ${next.collisions.length}`);
  if (lines.length === 0) lines.push("el contenido estable difiere; revisar el JSON completo");
  return lines;
}

function writeMarkdown(inventory) {
  const ranges = inventory.maps.ranges.map((range) => {
    const overlap = range.overlaps ? ` (subconjunto de ${range.overlaps}; no sumar)` : "";
    const missing = range.missing.length ? `; faltan ${range.missing.join(", ")}` : "";
    return `- **${range.label}** ${range.from}–${range.to}: **${range.count}** / ${range.span}${overlap}${missing}`;
  });
  const anchorRows = inventory.anchors.map((anchor) => `| ${anchor.index} | ${anchor.mapId} | ${anchor.title.replaceAll("|", "/")} | ${anchor.switchId} | ${anchor.switchName.replaceAll("|", "/")} | ${anchor.variableId} |`);
  const collisionLines = inventory.collisions.length
    ? inventory.collisions.slice(0, 40).map((row) => `- ${row.kind || "ancla"} ${row.id ?? row.mapId}: ${row.reason}${row.expected ? ` (esperado \`${row.expected}\`, actual \`${row.actual}\`)` : ""}`)
    : ["- Ninguna."];
  const free = inventory.reserved.unassignedPortionFree;
  const md = [
    "# Estado congelado",
    "",
    `Generado: ${inventory.generatedAt}`,
    "",
    "Inventario de solo lectura del juego vivo (`pokemon_fire_ash/Data`) y de los hashes SHA-256 de `Data/`, `Scripts/` y `tools/`. No modifica mapas, scripts ni partidas.",
    "",
    "## Totales",
    "",
    `- **Total de mapas:** ${inventory.maps.total} archivos \`Map*.rxdata\` (${inventory.maps.registeredInMapInfos} entradas en \`MapInfos.rxdata\`).`,
    `- **Total de scripts:** ${inventory.scripts.total} secciones en \`pokemon_fire_ash/Data/Scripts.rxdata\`.`,
    `- **Total de pares ID usados:** ${inventory.ids.pairCount} (${inventory.ids.switches} switches + ${inventory.ids.variables} variables + ${inventory.ids.selfSwitches} self-switches).`,
    `- **Colisiones detectadas:** ${inventory.collisions.length}.`,
    "",
    "## Rango reservado",
    "",
    free
      ? `Confirmado: el rango reservado (switches ${RESERVED.switches.from}–${RESERVED.switches.to}, variables ${RESERVED.variables.from}–${RESERVED.variables.to}) **está libre en su porción no asignada**. Switches sin asignación canónica: ${inventory.reserved.switches.unassigned.length}. Variables sin asignación canónica: ${inventory.reserved.variables.unassigned.length}. Ningún ID de esa porción tiene nombre ni uso literal.`
      : `El rango reservado **no** está libre en su porción no asignada. Switches ocupados sin asignación: ${inventory.reserved.switches.unassignedUsed.length}. Variables ocupadas sin asignación: ${inventory.reserved.variables.unassignedUsed.length}.`,
    "",
    `Asignación canónica cubierta: switches ${inventory.reserved.switches.assigned}/${inventory.reserved.switches.span}, variables ${inventory.reserved.variables.assigned}/${inventory.reserved.variables.span}. La porción asignada es 701–707 (base), 708–747 (anclas Tier 1), 748–867 (rutas Tier 2), variables 101–103 (contadores), 104–143 (decisiones Tier 1) y 144–263 (decisiones Tier 2).`,
    "",
    "## Mapas por rango",
    "",
    ...ranges,
    "",
    "NEXO y Liga Oscura caen dentro de Dimensional Nightmare. Sus conteos no se suman al total.",
    "",
    "## Anclas Tier 1",
    "",
    `${inventory.anchors.length} anclas, mapIds 1021–1996, switches 708–747, variable compartida 103.`,
    "",
    "| # | Mapa | Título | Switch | Nombre | Variable |",
    "|---:|---:|---|---:|---|---:|",
    ...anchorRows,
    "",
    "## Colisiones",
    "",
    ...collisionLines,
    "",
    "## Hashes",
    "",
    `- Archivos hasheados: ${inventory.hashes.fileCount} (Data ${inventory.hashes.byRoot.Data}, Scripts ${inventory.hashes.byRoot.Scripts}, tools ${inventory.hashes.byRoot.tools}).`,
    `- Directorios \`Scripts/\` encontrados: ${inventory.scripts.filesUnderScriptsDirectory} archivo(s). Las secciones Ruby del juego están dentro de \`Data/Scripts.rxdata\`.`,
    "- Algoritmo: SHA-256. El detalle por archivo está en `tools/inventario_congelado.json`.",
    `- Expresiones dinámicas (no se tratan como ID libre): ${inventory.ids.dynamicExpressions}.`,
    `- Archivos no legibles durante el escaneo: ${inventory.unreadable.length}.`,
    "",
    "Regenerar: `node tools/inventario_congelado.mjs`. Comprobar sin reescribir: `node tools/inventario_congelado.mjs --verify`.",
    "",
  ];
  fs.mkdirSync(path.dirname(MD_PATH), { recursive: true });
  fs.writeFileSync(MD_PATH, md.join("\n"));
}

const inventory = buildInventory();
if (VERIFY) {
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`✘ No existe ${rel(JSON_PATH)}. Genera el inventario antes de --verify.`);
    process.exit(1);
  }
  const previous = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const same = JSON.stringify(stableView(previous)) === JSON.stringify(stableView(inventory));
  if (!same) {
    console.error("✘ El inventario recalculado no coincide con tools/inventario_congelado.json");
    for (const line of diffSummary(previous, inventory)) console.error(`  · ${line}`);
    process.exit(1);
  }
  console.log("✔ Inventario congelado verificado: hashes, mapas, anclas, pares y rango reservado coinciden.");
  console.log(`  mapas ${inventory.maps.total} · scripts ${inventory.scripts.total} · pares ID ${inventory.ids.pairCount} · colisiones ${inventory.collisions.length}`);
  process.exit(0);
}

fs.writeFileSync(JSON_PATH, `${JSON.stringify(inventory, null, 2)}\n`);
writeMarkdown(inventory);
console.log(`✔ ${rel(JSON_PATH)}`);
console.log(`✔ ${rel(MD_PATH)}`);
console.log(`  mapas ${inventory.maps.total} · scripts ${inventory.scripts.total} · pares ID ${inventory.ids.pairCount} · colisiones ${inventory.collisions.length}`);
console.log(`  rango reservado libre en porción no asignada: ${inventory.reserved.unassignedPortionFree ? "sí" : "no"}`);
