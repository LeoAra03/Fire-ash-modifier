#!/usr/bin/env node
/** Auditoría estructural y cobertura indexada del bloque 2800–2899. */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, rstr } from "../../web/js/rmxp.js";
import { passabilityOf, tilesets } from "../lib/map_painter.mjs";
import { DATA, GAME, ROOT, mapFile } from "../lib/dn_rmxp.mjs";

const OUT = path.join(ROOT, "content", "lote6_fase029_cobertura.json");
const VERIFY = process.argv.includes("--verify");
const expectedFrom028 = path.join(ROOT, "content", "lote6_fase028_instrumentacion.json");
const counts = () => ({ maps: 0, cells: 0, events: 0, pages: 0, dialogues: 0, choices: 0, choiceBranches: 0, conditions: 0, switchesRead: 0, switchesWritten: 0, variablesRead: 0, variablesWritten: 0, selfSwitchesRead: 0, selfSwitchesWritten: 0, transfers: 0, battles: 0, movements: 0, waits: 0, scriptCommands: 0, commands: 0 });
const txt = (value) => rstr(value);
const familyFor = (id) => id >= 1021 && id <= 2020 ? "atlas_mil" : id >= 2040 && id <= 2190 ? "dimensional_nightmare" : id >= 3000 && id <= 3110 ? "glazed" : id >= 3120 && id <= 3138 ? "light_platinum" : id >= 3200 && id <= 3631 ? "liquid_crystal" : id >= 3700 && id <= 3944 ? "tfoh" : id >= 4000 && id <= 4419 ? "unbound" : id >= 1001 && id <= 1020 ? "horizontes" : id >= 2220 && id <= 2221 ? "team_rocket" : "base_or_other";
function loadInfos() {
  const raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  return new Map(raw.pairs.map(([id, info]) => [Number(id), txt(info.getIvar("name"))]));
}
function mapFiles() {
  return fs.readdirSync(DATA).flatMap((file) => { const match = /^Map(\d+)\.rxdata$/.exec(file); return match ? [{ id: Number(match[1]), file }] : []; }).sort((a, b) => a.id - b.id);
}
function audioNames(dir) {
  const folder = path.join(GAME, "Audio", dir);
  return new Set((fs.existsSync(folder) ? fs.readdirSync(folder) : []).map((file) => file.replace(/\.[^.]+$/, "").toLowerCase()));
}
function addMapCount(store, mapCount) { for (const key of Object.keys(store)) store[key] += mapCount[key] ?? 0; }
function recordFlag(store, id, type, mode, map) {
  const key = `${type}${id}`;
  const displayId = type === "self" ? String(id) : Number(id);
  if (!store.has(key)) store.set(key, { id: displayId, type, reads: 0, writes: 0, maps: new Set() });
  const row = store.get(key); row[mode]++; row.maps.add(map);
}
function encounterAudit() {
  const file = path.join(DATA, "encounters.dat");
  if (!fs.existsSync(file)) return { tables: 0, slots: 0, invalidKeys: [], invalidSlots: [], families: {} };
  const raw = marshalLoad(new Uint8Array(fs.readFileSync(file)));
  let tables = 0, slots = 0;
  const invalidKeys = [], invalidSlots = [], families = {};
  for (const [key, table] of raw.pairs ?? []) {
    const name = key?.name ?? String(key);
    const match = /^(\d+)_(\d+)$/.exec(name);
    if (!match) { invalidKeys.push(name); continue; }
    tables++;
    const mapId = Number(match[1]);
    const types = table?.getIvar?.("@types");
    for (const [kind, rows] of types?.pairs ?? []) {
      const list = Array.isArray(rows) ? rows : [];
      slots += list.length;
      families[kind?.name ?? String(kind)] = (families[kind?.name ?? String(kind)] ?? 0) + list.length;
      for (const row of list) {
        const weight = Number(row?.[0]); const min = Number(row?.[2]); const max = Number(row?.[3]);
        if (!(weight > 0) || !(min >= 1 && min <= max)) invalidSlots.push({ map: mapId, kind: kind?.name ?? String(kind), weight, min, max });
      }
    }
  }
  return { tables, slots, invalidKeys: invalidKeys.slice(0, 50), invalidSlots: invalidSlots.slice(0, 50), invalidSlotCount: invalidSlots.length, families };
}
function audit() {
  const infos = loadInfos();
  const files = mapFiles();
  const fileIds = new Set(files.map((row) => row.id));
  const mapMeta = new Map();
  const totals = counts();
  const byFamily = new Map();
  const flags = new Map();
  const choices = { total: 0, options: 0, branches: 0, withCancel: 0, withAllBranches: 0, tooMany: [], unresolved: [] };
  const transfers = { total: 0, missingMap: [], outOfRange: [], solidDestination: [], edges: new Map(), incoming: new Map(), reverseMissing: [] };
  const pendingTransfers = [];
  const resources = { characterReferences: 0, missingCharacters: new Set(), characterCaseOnly: new Set(), bgmReferences: 0, missingBgm: new Set(), seScriptReferences: 0, battlerScriptReferences: 0, fallbackReferences: [] };
  const characterFiles = fs.existsSync(path.join(GAME, "Graphics", "Characters")) ? fs.readdirSync(path.join(GAME, "Graphics", "Characters")) : [];
  const characterExact = new Set(characterFiles.map((file) => file.replace(/\.[^.]+$/, "")));
  const characterLower = new Set([...characterExact].map((name) => name.toLowerCase()));
  const bgm = audioNames("BGM");
  const tilesetIndex = tilesets();
  const cellChecks = { mapsChecked: 0, cellsChecked: 0, malformedTables: [], tileIdsOutsideTileset: 0, mapsWithoutTileset: [], autotilesMissing: new Set(), passabilityMapsChecked: 0 };
  for (const row of files) {
    const family = familyFor(row.id);
    if (!byFamily.has(family)) byFamily.set(family, counts());
    let raw;
    try { raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, row.file)))); }
    catch (error) { cellChecks.malformedTables.push({ map: row.id, error: String(error.message ?? error) }); continue; }
    const parsed = parseMap(raw);
    const mapCount = counts(); mapCount.maps = 1; mapCount.cells = parsed.width * parsed.height;
    cellChecks.mapsChecked++; cellChecks.cellsChecked += mapCount.cells;
    const meta = { width: parsed.width, height: parsed.height, parsed, pass: null };
    try { meta.pass = passabilityOf(parsed, parsed.tilesetId); cellChecks.passabilityMapsChecked++; } catch { cellChecks.mapsWithoutTileset.push({ map: row.id, tileset: parsed.tilesetId }); }
    mapMeta.set(row.id, meta);
    const tileset = tilesetIndex.get(parsed.tilesetId);
    if (!tileset) cellChecks.mapsWithoutTileset.push({ map: row.id, tileset: parsed.tilesetId });
    else {
      for (const value of parsed.table.data) if (value >= (tileset.passages?.data?.length ?? 0)) cellChecks.tileIdsOutsideTileset++;
      for (const name of tileset.autotiles ?? []) if (name && !fs.existsSync(path.join(GAME, "Graphics", "Autotiles", `${name}.png`))) cellChecks.autotilesMissing.add(name);
    }
    for (const event of parsed.events) {
      const parsedEvent = parseEvent(event.obj); mapCount.events++;
      for (const page of parsedEvent.pages) {
        mapCount.pages++;
        for (const commandObject of page.list) {
          const command = cmdOf(commandObject); const params = command.params.map(txt); mapCount.commands++;
          if (command.code === 101) mapCount.dialogues++;
          if (command.code === 102) {
            const optionList = Array.isArray(command.params[0]) ? command.params[0].map(txt) : [];
            choices.total++; choices.options += optionList.length; mapCount.choices++;
            let branchCount = 0, cancel = false;
            for (const sibling of page.list.slice(page.list.indexOf(command) + 1)) {
              const next = cmdOf(sibling);
              if (next.code === 402) branchCount++;
              if (next.code === 403) cancel = true;
              if (next.code === 404) break;
            }
            choices.branches += branchCount; mapCount.choiceBranches += branchCount;
            if (cancel) choices.withCancel++;
            if (branchCount >= optionList.length && optionList.length > 0) choices.withAllBranches++;
            if (optionList.length > 4) choices.tooMany.push({ map: row.id, event: parsedEvent.name, options: optionList.length });
            if (branchCount < optionList.length) choices.unresolved.push({ map: row.id, event: parsedEvent.name, options: optionList.length, branches: branchCount });
          }
          if (command.code === 111) { mapCount.conditions++; const type = Number(command.params[0]); if (type === 0) { mapCount.switchesRead++; recordFlag(flags, Number(command.params[1]), "s", "reads", row.id); } else if (type === 1) { mapCount.variablesRead++; recordFlag(flags, Number(command.params[1]), "v", "reads", row.id); } else if (type === 2) { mapCount.selfSwitchesRead++; recordFlag(flags, `${row.id}:${parsedEvent.id}:${txt(command.params[1])}`, "self", "reads", row.id); } }
          if (command.code === 121) { mapCount.switchesWritten++; for (let id = Number(command.params[0]); id <= Number(command.params[1]); id++) recordFlag(flags, id, "s", "writes", row.id); }
          if (command.code === 122) { mapCount.variablesWritten++; for (let id = Number(command.params[0]); id <= Number(command.params[1]); id++) recordFlag(flags, id, "v", "writes", row.id); }
          if (command.code === 123) { mapCount.selfSwitchesWritten++; recordFlag(flags, `${row.id}:${parsedEvent.id}:${txt(command.params[0])}`, "self", "writes", row.id); }
          if (command.code === 201) {
            mapCount.transfers++; transfers.total++;
            const target = Number(params[1]), x = Number(params[2]), y = Number(params[3]);
            pendingTransfers.push({ from: row.id, event: parsedEvent.name, target, x, y });
            if (!transfers.edges.has(row.id)) transfers.edges.set(row.id, new Set()); transfers.edges.get(row.id).add(target);
            if (!transfers.incoming.has(target)) transfers.incoming.set(target, new Set()); transfers.incoming.get(target).add(row.id);
          }
          if (command.code === 209) mapCount.movements++;
          if (command.code === 106) mapCount.waits++;
          if (command.code === 355 || command.code === 655) {
            mapCount.scriptCommands++;
            const source = params.join(" ");
            if (/pb(?:Trainer|Wild)Battle|pbBattle|BattleCore/i.test(source)) mapCount.battles++;
            if (/\b(?:pbBGMPlay|pbBGSPlay|pbSEPlay|pbPlayCry)\b/i.test(source)) resources.seScriptReferences++;
            if (/\b(?:pbAddPokemon|pbWildBattle)\b/i.test(source)) resources.battlerScriptReferences++;
          }
        }
        const graphics = page.graphic?.charName;
        if (graphics && graphics.toLowerCase() !== "invisible") {
          resources.characterReferences++;
          if (!characterExact.has(graphics)) {
            resources.missingCharacters.add(graphics);
            if (characterLower.has(graphics.toLowerCase())) resources.characterCaseOnly.add(graphics);
          }
        }
      }
    }
    const bgmName = txt(parsed.bgm?.getIvar?.("name"));
    if (bgmName && bgmName !== "(OFF)") { resources.bgmReferences++; if (!bgm.has(bgmName.toLowerCase())) resources.missingBgm.add(bgmName); }
    addMapCount(totals, mapCount);
    addMapCount(byFamily.get(family), mapCount);
  }
  for (const transfer of pendingTransfers) {
    const targetMeta = mapMeta.get(transfer.target);
    if (!targetMeta) {
      transfers.missingMap.push({ from: transfer.from, event: transfer.event, target: transfer.target });
      continue;
    }
    if (transfer.x < 0 || transfer.y < 0 || transfer.x >= targetMeta.width || transfer.y >= targetMeta.height) transfers.outOfRange.push(transfer);
    else if (targetMeta.pass && !targetMeta.pass.passable(transfer.x, transfer.y, 8)) transfers.solidDestination.push(transfer);
  }
  for (const [from, targets] of transfers.edges) for (const target of targets) if (transfers.edges.has(target) && transfers.edges.get(target).has(from) === false) transfers.reverseMissing.push({ from, target });
  const flagRows = [...flags.values()].map((row) => ({ ...row, maps: [...row.maps].sort((a, b) => a - b) })).sort((a, b) => `${a.type}${a.id}`.localeCompare(`${b.type}${b.id}`));
  const expected = fs.existsSync(expectedFrom028) ? JSON.parse(fs.readFileSync(expectedFrom028, "utf8")) : null;
  const indexed = [
    ["maps", totals.maps], ["cells", totals.cells], ["events", totals.events], ["dialogues", totals.dialogues], ["choices", totals.choices],
    ["conditions", totals.conditions], ["switches", flagRows.filter((row) => row.type === "s").length], ["variables", flagRows.filter((row) => row.type === "v").length],
    ["selfSwitches", flagRows.filter((row) => row.type === "self").length], ["transfers", totals.transfers], ["battles", totals.battles], ["movements", totals.movements], ["waits", totals.waits], ["scripts", totals.scriptCommands], ["cellsGeometry", totals.cells],
  ].map(([family, candidate]) => ({ family, candidate, indexed: candidate, exercised: 0, status: "runtime_pending" }));
  const anomalies = {
    files: ["Map341 2.rxdata", "Map813b.rxdata"].filter((file) => fs.existsSync(path.join(DATA, file))),
    decision: "quarantine_and_exclude",
    reason: "No aparecen en MapInfos ni en el grafo de mapas; se conservan como fuente local reversible, no se renombran ni entran en paquetes.",
    mapInfosAgreement: infos.size === fileIds.size && [...infos.keys()].every((id) => fileIds.has(id)),
  };
  return {
    schema: "lote6_fase029_cobertura/1.0",
    tasks: "2800–2899",
    baseline: expected ? { maps: expected.scan.mapFiles, events: expected.scan.totals.events, cells: expected.scan.totals.cells } : null,
    totals,
    byFamily: Object.fromEntries([...byFamily.entries()].sort(([a], [b]) => a.localeCompare(b))),
    coverage: indexed,
    flags: { total: flagRows.length, unread: flagRows.filter((row) => row.reads === 0).slice(0, 100), unwritten: flagRows.filter((row) => row.writes === 0).slice(0, 100), rows: flagRows.slice(0, 500) },
    choices,
    transfers: { total: transfers.total, missingMap: transfers.missingMap.slice(0, 100), outOfRange: transfers.outOfRange.slice(0, 100), solidDestination: transfers.solidDestination.slice(0, 100), reverseMissing: transfers.reverseMissing.slice(0, 100), reverseMissingCount: transfers.reverseMissing.length },
    cells: { ...cellChecks, autotilesMissing: [...cellChecks.autotilesMissing].sort(), malformedTables: cellChecks.malformedTables.slice(0, 100), mapsWithoutTileset: [...new Map(cellChecks.mapsWithoutTileset.map((row) => [JSON.stringify(row), row])).values()] },
    encounters: encounterAudit(),
    resources: { ...resources, missingCharacters: [...resources.missingCharacters].sort(), characterCaseOnly: [...resources.characterCaseOnly].sort(), missingBgm: [...resources.missingBgm].sort() },
    anomalies,
    semantics: "100% indexed means every discovered unit is in the ledger; runtime branches, visual alignment, audio playback and Android remain pending.",
    status: "static_pass_runtime_pending",
  };
}
const report = audit();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, serialized); }
console.log(`FASE 029 cobertura: ${report.totals.maps} mapas · ${report.totals.cells} celdas · ${report.totals.events} eventos · ${report.totals.transfers} transferencias · ${report.encounters.tables} tablas · ${report.status}`);
if (report.cells.malformedTables.length || report.cells.mapsWithoutTileset.length || report.transfers.missingMap.length || report.transfers.outOfRange.length) process.exitCode = 1;
