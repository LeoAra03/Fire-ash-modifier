/**
 * Núcleo del LOTE 12 — fases 065–069.
 *
 * Añade a lo ya auditado por el lote 11 cuatro comprobaciones nuevas sobre los
 * `.rxdata` compilados, todas estáticas (nada se ejecuta en `Game.exe`):
 *
 *  - `switches`: cada switch del rango declarado debe tener al menos un lector
 *    (111 tipo 0) y un escritor (121), y debe poder escribirse en sus dos
 *    estados (ON y OFF), con y sin partida avanzada.
 *  - `variables`: cada variable del rango debe tener lector (111 tipo 1) y
 *    escritor (122), y se revisan sus escrituras en los valores límite para
 *    detectar reinicios a cero y posibles desbordes.
 *  - `selfswitches`: por mapa, evento y letra A–D, se comprueba que cada
 *    self-switch leído tiene escritor en el mismo evento (no se usa como
 *    bandera global) y que se escribe en sus dos estados.
 *  - `transferencias`: cada 201 se valida contra el mapa destino (existencia,
 *    coordenadas, dirección), se comprueba la vuelta declarada y que la celda
 *    de llegada no sea sólida según el tileset.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, parseMap, rstr } from "../../web/js/rmxp.js";
import { passabilityOf } from "../lib/map_painter.mjs";
import { ROOT, auditDialoguesMap, evaluateTask, getAuditContext, loadTasksRange } from "./lote9_audit_core.mjs";
import {
  PHASE_KINDS,
  auditChoiceCoverageMap,
  auditConditionsMap,
  parseTaskSpecExtended as parseLote11,
} from "./lote11_core.mjs";

export const EXTRA_KINDS = {
  switches: "switches_dos_estados",
  variables: "variables_limites",
  selfswitches: "selfswitches_dos_estados",
  transfers: "transferencias_ida_vuelta",
};

export const ALL_KINDS = [
  PHASE_KINDS.dialogos,
  PHASE_KINDS.elecciones,
  PHASE_KINDS.condiciones,
  EXTRA_KINDS.switches,
  EXTRA_KINDS.variables,
  EXTRA_KINDS.selfswitches,
  EXTRA_KINDS.transfers,
];

const VALID_DIRECTIONS = new Set([0, 2, 4, 6, 8]);
const SAFE_VARIABLE_MAX = 99_999_999;

/** Clasifica también las tareas de switches, variables, self-switches y transfers. */
export function parseTaskSpecExtended(task) {
  const base = parseLote11(task);
  if (base.kind !== "other") return base;
  const text = task.text;

  let m = /^Comprobar en sus dos estados los switches (\S+)[–-](\S+) \((\d+) IDs\)/.exec(text);
  if (m) {
    return {
      ...base,
      kind: EXTRA_KINDS.switches,
      from: /^\d+$/.test(m[1]) ? Number(m[1]) : null,
      to: /^\d+$/.test(m[2]) ? Number(m[2]) : null,
      declaredCount: Number(m[3]),
      invalidSpec: !/^\d+$/.test(m[1]) || !/^\d+$/.test(m[2]),
    };
  }
  m = /^Comprobar las variables (\d+)[–-](\d+) \((\d+) IDs\)/.exec(text);
  if (m) {
    return { ...base, kind: EXTRA_KINDS.variables, from: Number(m[1]), to: Number(m[2]), declaredCount: Number(m[3]) };
  }
  m = /^Comprobar los self-switches de los mapas (\d+)[–-](\d+) «([^»]+)»/.exec(text);
  if (m) {
    return { ...base, kind: EXTRA_KINDS.selfswitches, from: Number(m[1]), to: Number(m[2]), declaredFamily: m[3] };
  }
  m = /^Comprobar los self-switches de el mapa (\d+) «([^»]+)» «([^»]+)»/.exec(text);
  if (m) {
    return { ...base, kind: EXTRA_KINDS.selfswitches, from: Number(m[1]), to: Number(m[1]), declaredFamily: m[3], declaredMapName: m[2] };
  }
  m = /^Recorrer las transferencias de los mapas (\d+)[–-](\d+) «([^»]+)»/.exec(text);
  if (m) {
    return { ...base, kind: EXTRA_KINDS.transfers, from: Number(m[1]), to: Number(m[2]), declaredFamily: m[3] };
  }
  m = /^Recorrer las transferencias de el mapa (\d+) «([^»]+)» «([^»]+)»/.exec(text);
  if (m) {
    return { ...base, kind: EXTRA_KINDS.transfers, from: Number(m[1]), to: Number(m[1]), declaredFamily: m[3], declaredMapName: m[2] };
  }
  return base;
}

// ---------------------------------------------------------------------------
// Índice global de switches, variables y self-switches
// ---------------------------------------------------------------------------

let cachedFlagIndex = null;

function bump(map, key, field, sample) {
  if (!map.has(key)) map.set(key, { reads: 0, writes: 0, onWrites: 0, offWrites: 0, zeroWrites: 0, extremeWrites: 0, maps: new Set(), writeMaps: new Set() });
  const row = map.get(key);
  row[field] = (row[field] ?? 0) + 1;
  if (field === "reads" && row.maps.size < 8) row.maps.add(sample);
  if (field === "writes" && row.writeMaps.size < 8) row.writeMaps.add(sample);
  return row;
}

export function getFlagIndex(ctx = getAuditContext()) {
  if (cachedFlagIndex) return cachedFlagIndex;
  const switches = new Map();
  const variables = new Map();
  const selfSwitches = new Map();
  const transferEdges = new Map(); // mapId -> Set(targetMapId)
  const transfersByMap = new Map(); // mapId -> count

  const mapIds = [...ctx.mapInfos.keys()].sort((a, b) => a - b);
  for (const mapId of mapIds) {
    const map = ctx.getAnalyzedMap(mapId);
    if (!map) continue;
    const edges = new Set();
    let transferCount = 0;
    for (const ev of map.events) {
      for (const page of ev.pages) {
        for (const cmd of page.list.map(cmdOf)) {
          const p = cmd.params ?? [];
          if (cmd.code === 111) {
            const type = Number(p[0]);
            if (type === 0) bump(switches, Number(p[1]), "reads", mapId);
            else if (type === 1) {
              bump(variables, Number(p[1]), "reads", mapId);
              if (Number(p[2]) === 1) bump(variables, Number(p[3]), "reads", mapId);
            } else if (type === 2) bump(selfSwitches, `${mapId}:${ev.id}:${rstr(p[1])}`, "reads", mapId);
          } else if (cmd.code === 121) {
            const a = Number(p[0]);
            const b = Number(p[1]);
            const value = Number(p[2]);
            for (let id = a; id <= b && id - a < 5000; id++) {
              const row = bump(switches, id, "writes", mapId);
              if (value === 0) row.offWrites++;
              else row.onWrites++;
            }
          } else if (cmd.code === 122) {
            const a = Number(p[0]);
            const b = Number(p[1]);
            const operandType = Number(p[2]);
            const operand = Number(p[3]);
            for (let id = a; id <= b && id - a < 5000; id++) {
              const row = bump(variables, id, "writes", mapId);
              if (operandType === 0) {
                if (operand === 0) row.zeroWrites++;
                else if (Math.abs(operand) > SAFE_VARIABLE_MAX) row.extremeWrites++;
              } else if (operandType === 1 && operand === id) {
                row.zeroWrites++; // x = x (lectura de sí misma): reinicio lógico
              }
            }
          } else if (cmd.code === 123) {
            const row = bump(selfSwitches, `${mapId}:${ev.id}:${rstr(p[0])}`, "writes", mapId);
            if (Number(p[1]) === 0) row.offWrites++;
            else row.onWrites++;
          } else if (cmd.code === 201) {
            const target = Number(p[1]);
            edges.add(target);
            transferCount++;
          }
        }
      }
    }
    transferEdges.set(mapId, edges);
    transfersByMap.set(mapId, transferCount);
  }

  const freeze = (map) =>
    new Map(
      [...map.entries()].map(([key, row]) => [
        key,
        { ...row, maps: [...row.maps].sort((a, b) => a - b), writeMaps: [...row.writeMaps].sort((a, b) => a - b) },
      ])
    );

  cachedFlagIndex = {
    switches: freeze(switches),
    variables: freeze(variables),
    selfSwitches: freeze(selfSwitches),
    transferEdges,
    transfersByMap,
  };
  return cachedFlagIndex;
}

// ---------------------------------------------------------------------------
// Switches y variables
// ---------------------------------------------------------------------------

export function auditSwitchRange(from, to, ctx = getAuditContext()) {
  const index = getFlagIndex(ctx);
  const rows = [];
  for (let id = from; id <= to; id++) {
    const row = index.switches.get(id) ?? { reads: 0, writes: 0, onWrites: 0, offWrites: 0, maps: [], writeMaps: [] };
    rows.push({
      id,
      readers: row.reads,
      writers: row.writes,
      onWrites: row.onWrites,
      offWrites: row.offWrites,
      readerMaps: row.maps,
      writerMaps: row.writeMaps,
      bothStates: row.onWrites > 0 && row.offWrites > 0,
    });
  }
  const missing = rows.filter((r) => r.readers === 0 || r.writers === 0);
  return {
    ids: rows.length,
    withoutReader: rows.filter((r) => r.readers === 0).map((r) => r.id),
    withoutWriter: rows.filter((r) => r.writers === 0).map((r) => r.id),
    withoutBothStates: rows.filter((r) => r.writers > 0 && !r.bothStates).map((r) => r.id),
    complete: rows.filter((r) => r.readers > 0 && r.writers > 0 && r.bothStates).length,
    unresolved: missing.length,
    rows,
  };
}

export function auditVariableRange(from, to, ctx = getAuditContext()) {
  const index = getFlagIndex(ctx);
  const rows = [];
  for (let id = from; id <= to; id++) {
    const row = index.variables.get(id) ?? { reads: 0, writes: 0, zeroWrites: 0, extremeWrites: 0, maps: [], writeMaps: [] };
    rows.push({
      id,
      readers: row.reads,
      writers: row.writes,
      zeroWrites: row.zeroWrites,
      extremeWrites: row.extremeWrites,
      readerMaps: row.maps,
      writerMaps: row.writeMaps,
    });
  }
  return {
    ids: rows.length,
    withoutReader: rows.filter((r) => r.readers === 0).map((r) => r.id),
    withoutWriter: rows.filter((r) => r.writers === 0).map((r) => r.id),
    zeroWrites: rows.filter((r) => r.zeroWrites > 0).map((r) => ({ id: r.id, writes: r.zeroWrites })),
    extremeWrites: rows.filter((r) => r.extremeWrites > 0).map((r) => ({ id: r.id, writes: r.extremeWrites })),
    complete: rows.filter((r) => r.readers > 0 && r.writers > 0 && r.zeroWrites === 0 && r.extremeWrites === 0).length,
    unresolved: rows.filter((r) => r.readers === 0 || r.writers === 0).length,
    rows,
  };
}

// ---------------------------------------------------------------------------
// Self-switches por mapa
// ---------------------------------------------------------------------------

export function auditSelfSwitchesMap(mapId, ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;
  const totals = {
    events: 0,
    eventsWithSelfSwitches: 0,
    keys: 0,
    reads: 0,
    writes: 0,
    readWithoutWriter: 0,
    writtenNeverRead: 0,
    withoutBothStates: 0,
    invalidLetters: 0,
  };
  const findings = [];
  const samples = [];
  const perEvent = new Map();

  for (const ev of map.events) {
    totals.events++;
    let evHas = false;
    const keyOf = (letter) => `${mapId}:${ev.id}:${letter}`;
    for (let pageIdx = 0; pageIdx < ev.pages.length; pageIdx++) {
      for (const cmd of ev.pages[pageIdx].list.map(cmdOf)) {
        const p = cmd.params ?? [];
        if (cmd.code === 111 && Number(p[0]) === 2) {
          const letter = rstr(p[1]);
          evHas = true;
          totals.reads++;
          if (!/^[A-D]$/.test(letter)) {
            totals.invalidLetters++;
            findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "invalid-self-switch-letter", letter });
          }
          if (!perEvent.has(keyOf(letter))) perEvent.set(keyOf(letter), { letter, reads: 0, writes: 0, onWrites: 0, offWrites: 0 });
          perEvent.get(keyOf(letter)).reads++;
        } else if (cmd.code === 123) {
          const letter = rstr(p[0]);
          const value = Number(p[1]);
          evHas = true;
          totals.writes++;
          if (!/^[A-D]$/.test(letter)) {
            totals.invalidLetters++;
            findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "invalid-self-switch-letter", letter });
          }
          if (!perEvent.has(keyOf(letter))) perEvent.set(keyOf(letter), { letter, reads: 0, writes: 0, onWrites: 0, offWrites: 0 });
          const entry = perEvent.get(keyOf(letter));
          entry.writes++;
          if (value === 0) entry.offWrites++;
          else entry.onWrites++;
        }
      }
    }
    if (evHas) totals.eventsWithSelfSwitches++;
  }

  for (const [key, entry] of perEvent) {
    totals.keys++;
    if (entry.reads > 0 && entry.writes === 0) {
      totals.readWithoutWriter++;
      findings.push({ type: "self-switch-read-without-writer", key, letter: entry.letter, reads: entry.reads });
    }
    if (entry.writes > 0 && entry.reads === 0) {
      totals.writtenNeverRead++;
      findings.push({ type: "self-switch-written-never-read", key, letter: entry.letter, writes: entry.writes });
    }
    if (entry.writes > 0 && !(entry.onWrites > 0 && entry.offWrites > 0)) totals.withoutBothStates++;
    if (samples.length < 4) samples.push({ key, letter: entry.letter, reads: entry.reads, writes: entry.writes, onWrites: entry.onWrites, offWrites: entry.offWrites });
  }

  return {
    mapId,
    name: map.name,
    totals,
    findings: findings.slice(0, 10),
    samples,
    status:
      totals.invalidLetters > 0 || totals.readWithoutWriter > 0
        ? "static_review_runtime_pending"
        : "static_pass_runtime_pending",
  };
}

// ---------------------------------------------------------------------------
// Transferencias
// ---------------------------------------------------------------------------

const passabilityCache = new Map();

function parsedMapFor(mapId) {
  const file = path.join(ROOT, "pokemon_fire_ash", "Data", `Map${String(mapId).padStart(3, "0")}.rxdata`);
  if (!fs.existsSync(file)) return null;
  try {
    return parseMap(marshalLoad(new Uint8Array(fs.readFileSync(file))));
  } catch {
    return null;
  }
}

function passabilityFor(mapId) {
  if (passabilityCache.has(mapId)) return passabilityCache.get(mapId);
  let pass = null;
  try {
    const parsed = parsedMapFor(mapId);
    if (parsed) pass = passabilityOf(parsed, parsed.tilesetId);
  } catch {
    pass = null;
  }
  passabilityCache.set(mapId, pass);
  return pass;
}

export function auditTransfersMap(mapId, ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;
  const index = getFlagIndex(ctx);
  const totals = {
    events: 0,
    transfers: 0,
    missingMap: 0,
    outOfRange: 0,
    invalidDirection: 0,
    solidDestination: 0,
    passabilityChecked: 0,
    reverseMissing: 0,
    reverseDeclared: 0,
    selfTransfers: 0,
  };
  const findings = [];
  const samples = [];

  for (const ev of map.events) {
    totals.events++;
    for (let pageIdx = 0; pageIdx < ev.pages.length; pageIdx++) {
      for (const cmd of ev.pages[pageIdx].list.map(cmdOf)) {
        if (cmd.code !== 201) continue;
        const p = cmd.params ?? [];
        const target = Number(p[1]);
        const x = Number(p[2]);
        const y = Number(p[3]);
        const direction = Number(p[4]);
        totals.transfers++;
        const dest = ctx.getAnalyzedMap(target);
        if (!dest) {
          totals.missingMap++;
          findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "missing-target-map", target });
          continue;
        }
        if (x < 0 || y < 0 || x >= dest.width || y >= dest.height) {
          totals.outOfRange++;
          findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "out-of-range-destination", target, x, y, width: dest.width, height: dest.height });
        } else {
          const pass = passabilityFor(target);
          if (pass) {
            totals.passabilityChecked++;
            if (!pass.passable(x, y, 8)) {
              totals.solidDestination++;
              findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "solid-destination", target, x, y });
            }
          }
        }
        if (!VALID_DIRECTIONS.has(direction)) {
          totals.invalidDirection++;
          findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "invalid-direction", target, direction });
        }
        if (target === mapId) totals.selfTransfers++;
        else {
          const back = index.transferEdges.get(target);
          if (back && back.has(mapId)) totals.reverseDeclared++;
          else {
            totals.reverseMissing++;
            findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "reverse-transfer-missing", from: mapId, target });
          }
        }
        if (samples.length < 4) samples.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, target, x, y, direction });
      }
    }
  }

  return {
    mapId,
    name: map.name,
    totals,
    findings: findings.slice(0, 10),
    samples,
    status:
      totals.missingMap > 0 || totals.outOfRange > 0 || totals.solidDestination > 0 || totals.invalidDirection > 0
        ? "fail"
        : totals.reverseMissing > 0
          ? "static_review_runtime_pending"
          : "static_pass_runtime_pending",
  };
}

// ---------------------------------------------------------------------------
// Evaluación por tarea
// ---------------------------------------------------------------------------

function mapIdsOf(spec, ctx) {
  const ids = [];
  if (spec.from == null) return ids;
  for (let id = spec.from; id <= spec.to; id++) if (ctx.mapInfos.has(id)) ids.push(id);
  return ids;
}

function sumTotals(rows, initial) {
  return rows.reduce((acc, row) => {
    for (const [key, value] of Object.entries(row.totals ?? {})) {
      if (typeof value === "number") acc[key] = (acc[key] ?? 0) + value;
      else if (key === "byType") {
        acc.byType = acc.byType ?? {};
        for (const [t, n] of Object.entries(value)) acc.byType[t] = (acc.byType[t] ?? 0) + n;
      }
    }
    return acc;
  }, { ...initial });
}

export function evaluateCoverageTask(task, ctx = getAuditContext()) {
  const spec = parseTaskSpecExtended(task);

  if (spec.kind === EXTRA_KINDS.switches) {
    if (spec.invalidSpec || spec.from == null) {
      return {
        id: spec.id,
        fileLine: spec.fileLine,
        kind: spec.kind,
        range: [null, null],
        status: "invalid_spec",
        note: "La tarea declara un rango no numérico (NaN–NaN); no hay IDs que medir.",
        mapIds: [],
        totals: { ids: 0, withoutReader: [], withoutWriter: [], withoutBothStates: [], complete: 0, unresolved: 0 },
      };
    }
    const audit = auditSwitchRange(spec.from, spec.to, ctx);
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredCount: spec.declaredCount,
      mapIds: [],
      totals: audit,
      findings: [],
      status: audit.unresolved > 0 ? "static_review_runtime_pending" : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === EXTRA_KINDS.variables) {
    const audit = auditVariableRange(spec.from, spec.to, ctx);
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredCount: spec.declaredCount,
      mapIds: [],
      totals: audit,
      findings: [],
      status:
        audit.withoutReader.length > 0 || audit.withoutWriter.length > 0 || audit.extremeWrites.length > 0
          ? "static_review_runtime_pending"
          : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === EXTRA_KINDS.selfswitches) {
    const mapIds = mapIdsOf(spec, ctx);
    const rows = mapIds.map((id) => auditSelfSwitchesMap(id, ctx)).filter(Boolean);
    const totals = sumTotals(rows, {
      events: 0,
      eventsWithSelfSwitches: 0,
      keys: 0,
      reads: 0,
      writes: 0,
      readWithoutWriter: 0,
      writtenNeverRead: 0,
      withoutBothStates: 0,
      invalidLetters: 0,
    });
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      declaredMapName: spec.declaredMapName,
      mapIds,
      totals,
      findings: rows.flatMap((r) => r.findings.map((f) => ({ mapId: r.mapId, ...f }))).slice(0, 20),
      samples: rows.flatMap((r) => r.samples.map((s) => ({ mapId: r.mapId, mapName: r.name, ...s }))).slice(0, 6),
      status: rows.some((r) => r.status === "static_review_runtime_pending") ? "static_review_runtime_pending" : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === EXTRA_KINDS.transfers) {
    const mapIds = mapIdsOf(spec, ctx);
    const rows = mapIds.map((id) => auditTransfersMap(id, ctx)).filter(Boolean);
    const totals = sumTotals(rows, {
      events: 0,
      transfers: 0,
      missingMap: 0,
      outOfRange: 0,
      invalidDirection: 0,
      solidDestination: 0,
      passabilityChecked: 0,
      reverseMissing: 0,
      reverseDeclared: 0,
      selfTransfers: 0,
    });
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      declaredMapName: spec.declaredMapName,
      mapIds,
      totals,
      findings: rows.flatMap((r) => r.findings.map((f) => ({ mapId: r.mapId, ...f }))).slice(0, 20),
      samples: rows.flatMap((r) => r.samples.map((s) => ({ mapId: r.mapId, mapName: r.name, ...s }))).slice(0, 6),
      status: rows.some((r) => r.status === "fail")
        ? "fail"
        : rows.some((r) => r.status === "static_review_runtime_pending")
          ? "static_review_runtime_pending"
          : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === PHASE_KINDS.elecciones) {
    const mapIds = mapIdsOf(spec, ctx);
    const rows = mapIds.map((id) => auditChoiceCoverageMap(id, ctx)).filter(Boolean);
    const totals = sumTotals(rows, {
      events: 0,
      eventsWithChoices: 0,
      choices: 0,
      optionsDeclared: 0,
      whenBranches: 0,
      cancelBranches: 0,
      cancelableChoices: 0,
      implicitCancelChoices: 0,
      missingBranches: 0,
      duplicatedBranches: 0,
      emptyBranches: 0,
      unclosedChoices: 0,
      missingCancelBranches: 0,
      outOfRangeOptions: 0,
      strayCloses: 0,
      branchesWithActions: 0,
      branchesEndingInTransfer: 0,
      resolvedOptions: 0,
      resolvedBranches: 0,
      unresolvedBranches: 0,
    });
    totals.choiceCoverage = totals.optionsDeclared > 0 ? Number(((totals.resolvedOptions / totals.optionsDeclared) * 100).toFixed(2)) : 100;
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      mapIds,
      totals,
      findings: rows.flatMap((r) => r.findings.map((f) => ({ mapId: r.mapId, ...f }))).slice(0, 20),
      status: totals.unresolvedBranches > 0 ? "fail" : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === PHASE_KINDS.condiciones) {
    const mapIds = mapIdsOf(spec, ctx);
    const rows = mapIds.map((id) => auditConditionsMap(id, ctx)).filter(Boolean);
    const totals = sumTotals(rows, {
      events: 0,
      pages: 0,
      conditionals: 0,
      withElseBranch: 0,
      withoutElseBranch: 0,
      alwaysTrue: 0,
      alwaysFalse: 0,
      bothPathsTestable: 0,
      invalidConditionIds: 0,
      conditionalsWithScript: 0,
      conditionalsOnSwitch: 0,
      conditionalsOnVariable: 0,
      conditionalsOnSelfSwitch: 0,
      byType: {},
    });
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      mapIds,
      totals,
      findings: rows.flatMap((r) => r.findings.map((f) => ({ mapId: r.mapId, ...f }))).slice(0, 20),
      status:
        totals.invalidConditionIds > 0
          ? "fail"
          : totals.alwaysTrue + totals.alwaysFalse > 0
            ? "static_review_runtime_pending"
            : "static_pass_runtime_pending",
    };
  }

  const evaluated = evaluateTask(task, ctx);
  return { ...evaluated, kind: spec.kind, aspect: spec.aspect, requiresHumanReading: spec.requiresHumanReading, samples: evaluated.samples ?? [] };
}

function mdCell(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function mdList(values, limit = 12) {
  if (!values.length) return "ninguno";
  const shown = values.slice(0, limit).map((v) => (typeof v === "object" ? v.id : v));
  return `${shown.join(", ")}${values.length > limit ? ` … (+${values.length - limit})` : ""}`;
}

export function runCoveragePhase({ phase, tanda, start, end, slug, script }) {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(start, end);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < start).map((t) => evaluateCoverageTask(t, ctx));
  const taskMatrix = tasks.map((t) => ({ ...evaluateCoverageTask(t, ctx), fileLine: t.fileLine }));

  const byKind = new Map();
  for (const row of taskMatrix) {
    if (!byKind.has(row.kind)) byKind.set(row.kind, []);
    byKind.get(row.kind).push(row);
  }
  const rowsOf = (kind) => byKind.get(kind) ?? [];

  const dialogueRows = rowsOf(PHASE_KINDS.dialogos);
  const choiceRows = rowsOf(PHASE_KINDS.elecciones);
  const conditionRows = rowsOf(PHASE_KINDS.condiciones);
  const switchRows = rowsOf(EXTRA_KINDS.switches);
  const variableRows = rowsOf(EXTRA_KINDS.variables);
  const selfRows = rowsOf(EXTRA_KINDS.selfswitches);
  const transferRows = rowsOf(EXTRA_KINDS.transfers);
  const otherRows = taskMatrix.filter((r) => !ALL_KINDS.includes(r.kind));
  const invalidRows = taskMatrix.filter((r) => r.status === "invalid_spec");

  const uniqueMaps = [...new Set(taskMatrix.flatMap((r) => r.mapIds ?? []))].sort((a, b) => a - b);

  // Diálogos agregados por mapa (sin duplicar).
  let dialogues = null;
  if (dialogueRows.length) {
    const dMaps = [...new Set(dialogueRows.flatMap((r) => r.mapIds ?? []))].sort((a, b) => a - b);
    const totals = {
      tasks: dialogueRows.length,
      humanReadingTasks: dialogueRows.filter((r) => r.requiresHumanReading).length,
      uniqueMaps: dMaps.length,
      totalBlocks: 0,
      scriptMessagesCount: 0,
      overflowLines: 0,
      overTwoLines: 0,
      missingOpeningQuestion: 0,
      missingOpeningExclamation: 0,
      unbalancedQuotes: 0,
      invalidVariableRefs: 0,
    };
    for (const id of dMaps) {
      const m = auditDialoguesMap(id, "general", ctx);
      if (!m) continue;
      totals.totalBlocks += m.totalBlocks;
      totals.scriptMessagesCount += m.scriptMessagesCount;
      totals.overflowLines += m.metrics.boxFormat.overflowLines;
      totals.overTwoLines += m.metrics.boxFormat.overTwoLines;
      totals.missingOpeningQuestion += m.metrics.punctuation.missingOpeningQuestion;
      totals.missingOpeningExclamation += m.metrics.punctuation.missingOpeningExclamation;
      totals.unbalancedQuotes += m.metrics.punctuation.unbalancedQuotes;
      totals.invalidVariableRefs += m.metrics.variablesAndNumbers.invalidVariableRefs;
    }
    dialogues = totals;
  }

  let choices = null;
  if (choiceRows.length) {
    const sums = sumTotals(choiceRows, {
      events: 0,
      eventsWithChoices: 0,
      choices: 0,
      optionsDeclared: 0,
      whenBranches: 0,
      cancelBranches: 0,
      cancelableChoices: 0,
      implicitCancelChoices: 0,
      missingBranches: 0,
      duplicatedBranches: 0,
      emptyBranches: 0,
      unclosedChoices: 0,
      missingCancelBranches: 0,
      outOfRangeOptions: 0,
      strayCloses: 0,
      branchesWithActions: 0,
      branchesEndingInTransfer: 0,
      resolvedOptions: 0,
      resolvedBranches: 0,
      unresolvedBranches: 0,
    });
    sums.tasks = choiceRows.length;
    sums.choiceCoverage = sums.optionsDeclared > 0 ? Number(((sums.resolvedOptions / sums.optionsDeclared) * 100).toFixed(2)) : 100;
    choices = sums;
  }

  let conditions = null;
  if (conditionRows.length) {
    const sums = sumTotals(conditionRows, {
      events: 0,
      pages: 0,
      conditionals: 0,
      withElseBranch: 0,
      withoutElseBranch: 0,
      alwaysTrue: 0,
      alwaysFalse: 0,
      bothPathsTestable: 0,
      invalidConditionIds: 0,
      conditionalsWithScript: 0,
      conditionalsOnSwitch: 0,
      conditionalsOnVariable: 0,
      conditionalsOnSelfSwitch: 0,
      byType: {},
    });
    sums.tasks = conditionRows.length;
    conditions = sums;
  }

  let switches = null;
  if (switchRows.length) {
    const measured = switchRows.filter((r) => r.status !== "invalid_spec");
    const ids = measured.reduce((n, r) => n + r.totals.ids, 0);
    switches = {
      tasks: switchRows.length,
      invalidSpecTasks: switchRows.length - measured.length,
      ids,
      complete: measured.reduce((n, r) => n + r.totals.complete, 0),
      withoutReader: measured.flatMap((r) => r.totals.withoutReader),
      withoutWriter: measured.flatMap((r) => r.totals.withoutWriter),
      withoutBothStates: measured.flatMap((r) => r.totals.withoutBothStates),
      ranges: measured.map((r) => r.range),
    };
  }

  let variables = null;
  if (variableRows.length) {
    const ids = variableRows.reduce((n, r) => n + r.totals.ids, 0);
    variables = {
      tasks: variableRows.length,
      ids,
      complete: variableRows.reduce((n, r) => n + r.totals.complete, 0),
      withoutReader: variableRows.flatMap((r) => r.totals.withoutReader),
      withoutWriter: variableRows.flatMap((r) => r.totals.withoutWriter),
      zeroWrites: variableRows.flatMap((r) => r.totals.zeroWrites),
      extremeWrites: variableRows.flatMap((r) => r.totals.extremeWrites),
      ranges: variableRows.map((r) => r.range),
    };
  }

  let selfswitches = null;
  if (selfRows.length) {
    const sums = sumTotals(selfRows, {
      events: 0,
      eventsWithSelfSwitches: 0,
      keys: 0,
      reads: 0,
      writes: 0,
      readWithoutWriter: 0,
      writtenNeverRead: 0,
      withoutBothStates: 0,
      invalidLetters: 0,
    });
    selfswitches = { tasks: selfRows.length, maps: new Set(selfRows.flatMap((r) => r.mapIds ?? [])).size, ...sums };
  }

  let transfers = null;
  if (transferRows.length) {
    const sums = sumTotals(transferRows, {
      events: 0,
      transfers: 0,
      missingMap: 0,
      outOfRange: 0,
      invalidDirection: 0,
      solidDestination: 0,
      passabilityChecked: 0,
      reverseMissing: 0,
      reverseDeclared: 0,
      selfTransfers: 0,
    });
    transfers = { tasks: transferRows.length, maps: new Set(transferRows.flatMap((r) => r.mapIds ?? [])).size, ...sums };
  }

  const kindsSummary = {};
  for (const [kind, rows] of byKind) kindsSummary[kind] = rows.length;

  const hasFail = taskMatrix.some((r) => r.status === "fail");
  const hasReview = taskMatrix.some((r) => r.status === "static_review_runtime_pending" || r.status === "invalid_spec");
  const status = hasFail ? "fail" : hasReview ? "static_review_runtime_pending" : "static_pass_runtime_pending";

  const report = {
    schema: `lote12_fase${phase}_${slug}/1.0`,
    phase,
    tanda,
    tasks: `${start}–${end}`,
    fileLines: fileLineSlice.length ? `${fileLineSlice[0].fileLine}–${fileLineSlice[fileLineSlice.length - 1].fileLine}` : `${start}–${end}`,
    boundaryTaskIdsFromFileLines: fileLineSlice.filter((t) => t.id < start).map((t) => t.id),
    summary: {
      tasks: taskMatrix.length,
      kinds: kindsSummary,
      invalidSpecTasks: invalidRows.map((r) => ({ id: r.id, note: r.note })),
      uniqueMaps: uniqueMaps.length,
      mapRange: uniqueMaps.length ? [uniqueMaps[0], uniqueMaps[uniqueMaps.length - 1]] : [null, null],
      families: [...new Set(taskMatrix.map((r) => r.declaredFamily).filter(Boolean))].sort(),
    },
    dialogues,
    choices,
    conditions,
    switches,
    variables,
    selfswitches,
    transfers,
    findingsByTask: taskMatrix
      .filter((r) => ["fail", "static_review_runtime_pending", "invalid_spec"].includes(r.status))
      .slice(0, 12)
      .map((r) => ({ id: r.id, kind: r.kind, range: r.range, status: r.status })),
    boundaryTasks,
    taskMatrix,
    policy:
      "Las comprobaciones de switches, variables, self-switches y transferencias se calculan sobre el árbol de comandos y las tablas del tileset de los `.rxdata` compilados. «Dos estados» significa que existen escrituras de ON y de OFF en el proyecto, no que ambos caminos se hayan jugado: la ejecución real queda como runtime_pending.",
    status,
  };

  const out = path.join(ROOT, "content", `lote12_fase${phase}_${slug}.json`);
  const doc = path.join(ROOT, "docs", "qa", "lote12", `fase_${phase}_${slug}.md`);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const verify = process.argv.includes("--verify");

  const kindLabel = {
    [PHASE_KINDS.dialogos]: "diálogos",
    [PHASE_KINDS.elecciones]: "elecciones",
    [PHASE_KINDS.condiciones]: "condiciones",
    [EXTRA_KINDS.switches]: "switches",
    [EXTRA_KINDS.variables]: "variables",
    [EXTRA_KINDS.selfswitches]: "self-switches",
    [EXTRA_KINDS.transfers]: "transferencias",
  };

  const lines = [
    `# FASE ${phase} — Tanda ${tanda} (tramo ${report.tasks})`,
    "",
    "## Reproducción",
    "",
    "```bash",
    `node tools/plan2700/${script}`,
    `node tools/plan2700/${script} --verify`,
    "```",
    "",
    "## Reparto de tareas",
    "",
    `- **Tareas procesadas**: ${report.summary.tasks} · ${Object.entries(kindsSummary)
      .map(([k, n]) => `${kindLabel[k] ?? k}: ${n}`)
      .join(" · ")}.`,
    `- **Mapas únicos cubiertos**: ${report.summary.uniqueMaps}${report.summary.mapRange[0] == null ? "" : ` (mapas ${report.summary.mapRange[0]}–${report.summary.mapRange[1]})`} · familias: ${report.summary.families.map((f) => `«${f}»`).join(", ") || "ninguna"}.`,
  ];

  if (report.summary.invalidSpecTasks.length) {
    lines.push(
      "",
      "## Tareas con especificación inválida en `tareas.txt`",
      "",
      ...report.summary.invalidSpecTasks.map((t) => `- **Tarea ${t.id}**: ${t.note}`)
    );
  }

  if (dialogues) {
    lines.push(
      "",
      "## Diálogos",
      "",
      `- **Tareas**: ${dialogues.tasks} (${dialogues.humanReadingTasks} con lectura humana) · **mapas**: ${dialogues.uniqueMaps}.`,
      `- **Bloques 101/401**: ${dialogues.totalBlocks} · mensajes de script: ${dialogues.scriptMessagesCount} · inválidas: ${dialogues.invalidVariableRefs}.`,
      `- **Formato**: ${dialogues.overflowLines} líneas > 53 columnas · ${dialogues.overTwoLines} bloques > 2 líneas · ${dialogues.unbalancedQuotes} comillas impares.`
    );
  }

  if (choices) {
    lines.push(
      "",
      "## Elecciones",
      "",
      `- **Tareas**: ${choices.tasks} · **bloques 102**: ${choices.choices} · **opciones declaradas**: ${choices.optionsDeclared} · **ramas 402**: ${choices.whenBranches} (suma por tarea).`,
      `- **Cobertura de opciones**: ${choices.choiceCoverage} % · **ramas sin resolver**: ${choices.unresolvedBranches} (faltantes ${choices.missingBranches} · duplicadas ${choices.duplicatedBranches} · fuera de rango ${choices.outOfRangeOptions} · bloques sin 404 ${choices.unclosedChoices} · cancelación ausente ${choices.missingCancelBranches}).`,
      `- **Cancelables**: ${choices.cancelableChoices} (${choices.implicitCancelChoices} implícitas) · ramas 403 explícitas: ${choices.cancelBranches} · ramas vacías: ${choices.emptyBranches} · terminan en transferencia: ${choices.branchesEndingInTransfer}.`
    );
  }

  if (conditions) {
    const types = Object.entries(conditions.byType)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([t, n]) => `${t}:${n}`)
      .join(" · ");
    lines.push(
      "",
      "## Condiciones",
      "",
      `- **Tareas**: ${conditions.tasks} · **condicionales 111**: ${conditions.conditionals} en ${conditions.pages} páginas (suma por tarea: los tramos se solapan) · tipos: ${types || "sin datos"}.`,
      `- **Con rama else (411)**: ${conditions.withElseBranch} · **sin else** (falso implícito): ${conditions.withoutElseBranch}.`,
      `- **Ambos caminos posibles**: ${conditions.bothPathsTestable} · **siempre verdaderas**: ${conditions.alwaysTrue} · **siempre falsas**: ${conditions.alwaysFalse} · **IDs inválidos**: ${conditions.invalidConditionIds}.`
    );
  }

  if (switches) {
    lines.push(
      "",
      "## Switches en sus dos estados",
      "",
      `- **Tareas**: ${switches.tasks}${switches.invalidSpecTasks ? ` (${switches.invalidSpecTasks} con rango inválido en la fuente)` : ""} · **IDs medidos**: ${switches.ids} · **completos** (lector + escritor + ON y OFF): ${switches.complete}.`,
      `- **Sin lector**: ${switches.withoutReader.length} → ${mdList(switches.withoutReader)}.`,
      `- **Sin escritor**: ${switches.withoutWriter.length} → ${mdList(switches.withoutWriter)}.`,
      `- **Con escritor pero sin ambos estados**: ${switches.withoutBothStates.length} → ${mdList(switches.withoutBothStates)}.`
    );
  }

  if (variables) {
    lines.push(
      "",
      "## Variables en valores límite",
      "",
      `- **Tareas**: ${variables.tasks} · **IDs medidos**: ${variables.ids} · **completos** (lector, escritor y sin reinicio/desborde): ${variables.complete}.`,
      `- **Sin lector**: ${variables.withoutReader.length} → ${mdList(variables.withoutReader)}.`,
      `- **Sin escritor**: ${variables.withoutWriter.length} → ${mdList(variables.withoutWriter)}.`,
      `- **Escrituras a cero** (posible reinicio): ${variables.zeroWrites.length} → ${mdList(variables.zeroWrites)}.`,
      `- **Escrituras fuera de rango seguro** (|valor| > 99 999 999): ${variables.extremeWrites.length} → ${mdList(variables.extremeWrites)}.`
    );
  }

  if (selfswitches) {
    lines.push(
      "",
      "## Self-switches por evento y letra",
      "",
      `- **Tareas**: ${selfswitches.tasks} · **mapas**: ${selfswitches.maps} · **eventos**: ${selfswitches.events} (${selfswitches.eventsWithSelfSwitches} usan self-switches).`,
      `- **Claves evento+letra**: ${selfswitches.keys} · lecturas: ${selfswitches.reads} · escrituras: ${selfswitches.writes}.`,
      `- **Leídos sin escritor** (dependen de estado externo): ${selfswitches.readWithoutWriter} · **escritos y nunca leídos**: ${selfswitches.writtenNeverRead}.`,
      `- **Sin ambos estados**: ${selfswitches.withoutBothStates} · **letras inválidas**: ${selfswitches.invalidLetters}.`
    );
  }

  if (transfers) {
    lines.push(
      "",
      "## Transferencias en ambos sentidos",
      "",
      `- **Tareas**: ${transfers.tasks} · **mapas**: ${transfers.maps} · **transferencias (201)**: ${transfers.transfers} · celdas con passability comprobada: ${transfers.passabilityChecked}.`,
      `- **Mapa destino ausente**: ${transfers.missingMap} · **coordenada fuera de rango**: ${transfers.outOfRange} · **celda sólida**: ${transfers.solidDestination} · **dirección inválida**: ${transfers.invalidDirection}.`,
      `- **Vuelta declarada**: ${transfers.reverseDeclared} · **sin vuelta**: ${transfers.reverseMissing} · **transferencias al mismo mapa**: ${transfers.selfTransfers}.`
    );
  }

  if (report.findingsByTask.length) {
    lines.push("", "## Tareas con hallazgos", "", "| Tarea | Tipo | Rango | Estado |", "|---:|---|---|---|");
    for (const row of report.findingsByTask) {
      lines.push(`| ${row.id} | ${mdCell(kindLabel[row.kind] ?? row.kind)} | ${row.range[0] ?? "—"}–${row.range[1] ?? "—"} | \`${row.status}\` |`);
    }
  } else {
    lines.push("", "Sin hallazgos en este tramo.");
  }

  lines.push(
    "",
    "## Límite honesto",
    "",
    "Todo se mide sobre los `.rxdata` compilados y las tablas de passability del tileset: no se abre `Game.exe` ni se juega ninguna partida. «Dos estados» acredita que el proyecto contiene escrituras de ON y de OFF para ese ID, no que ambos caminos se hayan recorrido en ejecución. La comprobación interactiva (con y sin partida avanzada) permanece como `runtime_pending`.",
    ""
  );

  const md = lines.join("\n");

  if (verify) {
    if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, out)} está desactualizado`);
    if (!fs.existsSync(doc) || fs.readFileSync(doc, "utf8") !== md) throw new Error(`${path.relative(ROOT, doc)} está desactualizado`);
    console.log(`FASE ${phase}: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · ${JSON.stringify(kindsSummary)} · ${status}`);
    return report;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.mkdirSync(path.dirname(doc), { recursive: true });
  fs.writeFileSync(out, serialized);
  fs.writeFileSync(doc, md);
  console.log(`FASE ${phase}: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · ${JSON.stringify(kindsSummary)} · ${status}`);
  if (status === "fail") process.exitCode = 1;
  return report;
}
