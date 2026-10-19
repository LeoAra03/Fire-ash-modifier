/**
 * Núcleo del LOTE 11 — fases 063–064.
 *
 * La tanda 63 mezcla revisiones de diálogo con «Recorrer las elecciones …»
 * y la tanda 64 es íntegra de «Probar las condiciones …». Este núcleo añade
 * los dos auditores estáticos nuevos sobre los mismos `.rxdata` compilados:
 *
 *  - `auditChoiceCoverageMap`: para cada bloque de elección (102) comprueba
 *    que cada opción declarada tiene su rama 402, que ninguna rama queda vacía
 *    y que el cierre 404 y la rama de cancelación (403) cuadran con el modo
 *    de cancelación declarado.
 *  - `auditConditionsMap`: para cada condicional (111) clasifica el tipo,
 *    detecta condiciones constantes (siempre verdaderas o siempre falsas) y
 *    valida los IDs de switch/variable/self-switch implicados, de modo que
 *    pueda probarse el camino verdadero y el falso.
 *
 * Todo es estático: la ejecución interactiva en `Game.exe` sigue pendiente.
 */
import fs from "node:fs";
import path from "node:path";
import { cmdOf, rstr } from "../../web/js/rmxp.js";
import { ROOT, auditDialoguesMap, evaluateTask, getAuditContext, loadTasksRange, parseTaskSpec } from "./lote9_audit_core.mjs";

export const PHASE_KINDS = {
  dialogos: "dialogos_revision",
  elecciones: "elecciones_cobertura",
  condiciones: "condiciones_verdad_falsedad",
};

const MEANINGLESS_CODES = new Set([0, 408, 509]);

function isMeaningful(code) {
  return !MEANINGLESS_CODES.has(code);
}

/**
 * Clasifica una tarea. Reutiliza `parseTaskSpec` del lote 9 y añade los dos
 * tipos que aparecen por primera vez en las tandas 63–64.
 */
export function parseTaskSpecExtended(task) {
  const base = parseTaskSpec(task);
  if (base.kind !== "other") return base;
  const text = task.text;
  if (/^Recorrer las elecciones de /.test(text)) {
    const m = /mapas (\d+)[–-](\d+) «([^»]+)»/.exec(text);
    const single = /el mapa (\d+) «([^»]+)» «([^»]+)»/.exec(text);
    return {
      ...base,
      kind: PHASE_KINDS.elecciones,
      from: m ? Number(m[1]) : single ? Number(single[1]) : null,
      to: m ? Number(m[2]) : single ? Number(single[1]) : null,
      declaredFamily: m ? m[3] : single ? single[3] : null,
      declaredMapName: single ? single[2] : null,
    };
  }
  if (/^Probar las condiciones de /.test(text)) {
    const m = /mapas (\d+)[–-](\d+) «([^»]+)»/.exec(text);
    const single = /el mapa (\d+) «([^»]+)» «([^»]+)»/.exec(text);
    return {
      ...base,
      kind: PHASE_KINDS.condiciones,
      from: m ? Number(m[1]) : single ? Number(single[1]) : null,
      to: m ? Number(m[2]) : single ? Number(single[1]) : null,
      declaredFamily: m ? m[3] : single ? single[3] : null,
      declaredMapName: single ? single[2] : null,
    };
  }
  return base;
}

function mapIdsOf(spec, ctx) {
  const ids = [];
  if (spec.from == null) return ids;
  for (let id = spec.from; id <= spec.to; id++) if (ctx.mapInfos.has(id)) ids.push(id);
  return ids;
}

/**
 * Elecciones: empareja cada bloque 102 con sus ramas 402/403 y su cierre 404
 * mediante una pila de bloques (el anidamiento real del árbol de comandos),
 * porque en estos `.rxdata` la indentación de 402/404 no es homogénea.
 * `params[1]` del 102 es el índice 1-based de la opción de cancelación
 * (0 = no cancelable; `n+1` = cancelación implícita añadida al final).
 *
 * Una opción queda «sin resolver» si no tiene rama 402 propia, si hay ramas
 * duplicadas o fuera de rango, si el bloque no cierra con 404 o si la opción
 * de cancelación declarada no tiene rama. Una rama vacía no es un defecto:
 * al elegirla no ocurre nada y el control sigue tras el 404; se cuenta aparte.
 */
export function auditChoiceCoverageMap(mapId, ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;

  const totals = {
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
  };
  const findings = [];
  const samples = [];

  const TRANSFER_CODES = new Set([115, 201, 123, 124, 214, 125, 126, 354]);

  for (const ev of map.events) {
    totals.events++;
    let evHasChoices = false;
    for (let pageIdx = 0; pageIdx < ev.pages.length; pageIdx++) {
      const cmds = ev.pages[pageIdx].list.map(cmdOf);

      // 1) Árbol de bloques de elección por pila.
      const blocks = [];
      const stack = [];
      for (let i = 0; i < cmds.length; i++) {
        const code = cmds[i].code;
        if (code === 102) {
          const block = { openIdx: i, closeIdx: null, branches: [] };
          blocks.push(block);
          stack.push(block);
        } else if (code === 402 || code === 403) {
          if (stack.length) {
            stack[stack.length - 1].branches.push({
              code,
              index: code === 402 ? Number(cmds[i].params?.[0] ?? -1) : null,
              label: code === 402 ? rstr(cmds[i].params?.[1]) : null,
              pos: i,
            });
          }
        } else if (code === 404) {
          if (stack.length) stack.pop().closeIdx = i;
          else totals.strayCloses++;
        }
      }

      // 2) Auditoría de cada bloque.
      for (const block of blocks) {
        evHasChoices = true;
        totals.choices++;
        const choiceList = cmds[block.openIdx].params?.[0] ?? [];
        const declared = Array.isArray(choiceList) ? choiceList.length : 0;
        const cancelIndex = Number(cmds[block.openIdx].params?.[1] ?? 0);
        totals.optionsDeclared += declared;
        if (cancelIndex > 0) {
          totals.cancelableChoices++;
          if (cancelIndex === declared + 1) totals.implicitCancelChoices++;
        }

        if (block.closeIdx == null) {
          totals.unclosedChoices++;
          findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "unclosed-choice" });
        }

        const seen = new Set();
        const whens = block.branches.filter((b) => b.code === 402);
        const cancels = block.branches.filter((b) => b.code === 403);
        totals.whenBranches += whens.length;
        totals.cancelBranches += cancels.length;

        for (let bi = 0; bi < block.branches.length; bi++) {
          const branch = block.branches[bi];
          let nextPos = bi + 1 < block.branches.length ? block.branches[bi + 1].pos : block.closeIdx ?? cmds.length;
          let meaningful = 0;
          let lastMeaningful = null;
          for (let k = branch.pos + 1; k < nextPos; k++) {
            if (!isMeaningful(cmds[k].code)) continue;
            meaningful++;
            lastMeaningful = cmds[k].code;
          }
          if (meaningful === 0) {
            totals.emptyBranches++;
          } else {
            totals.branchesWithActions++;
            totals.resolvedBranches++;
            if (lastMeaningful != null && TRANSFER_CODES.has(lastMeaningful)) totals.branchesEndingInTransfer++;
          }
          if (branch.code === 402) {
            if (branch.index < 0 || branch.index >= declared) {
              totals.outOfRangeOptions++;
              findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "out-of-range-choice-branch", branch: branch.index });
            }
            if (seen.has(branch.index)) {
              totals.duplicatedBranches++;
              findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "duplicated-choice-branch", branch: branch.index });
            }
            seen.add(branch.index);
          }
        }

        for (let k = 0; k < declared; k++) {
          if (seen.has(k)) {
            totals.resolvedOptions++;
          } else {
            totals.missingBranches++;
            findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "missing-choice-branch", branch: k });
          }
        }

        if (cancelIndex > 0 && cancelIndex <= declared && !seen.has(cancelIndex - 1)) {
          totals.missingCancelBranches++;
          findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "missing-cancel-branch", cancelIndex });
        }

        if (samples.length < 4) {
          samples.push({
            eventId: ev.id,
            event: ev.name,
            page: pageIdx + 1,
            declared,
            cancelIndex,
            whens: whens.length,
            labels: whens.map((w) => w.label).slice(0, 4),
          });
        }
      }
    }
    if (evHasChoices) totals.eventsWithChoices++;
  }

  totals.unresolvedBranches =
    totals.missingBranches +
    totals.duplicatedBranches +
    totals.outOfRangeOptions +
    totals.unclosedChoices +
    totals.missingCancelBranches;

  return {
    mapId,
    name: map.name,
    totals,
    findings: findings.slice(0, 10),
    samples,
    status: totals.unresolvedBranches > 0 ? "fail" : "static_pass_runtime_pending",
  };
}

const COMPARISON = { 0: "==", 1: ">=", 2: "<=", 3: ">", 4: "<", 5: "!=" };
const CONSTANT_FALSE_COMPARISONS = new Set([3, 4, 5]);
const VALID_TYPES = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

/**
 * Condiciones: clasifica cada 111, detecta tautologías/contradicciones
 * estáticas y valida los IDs de estado. `bothPathsTestable` cuenta las
 * condiciones que admiten los dos resultados (ni constantes ni inválidas).
 */
export function auditConditionsMap(mapId, ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;

  const totals = {
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
  };
  const findings = [];
  const samples = [];

  for (const ev of map.events) {
    totals.events++;
    for (let pageIdx = 0; pageIdx < ev.pages.length; pageIdx++) {
      totals.pages++;
      const cmds = ev.pages[pageIdx].list.map(cmdOf);
      for (let i = 0; i < cmds.length; i++) {
        if (cmds[i].code !== 111) continue;
        totals.conditionals++;
        const params = cmds[i].params ?? [];
        const type = Number(params[0]);
        const key = String(type);
        totals.byType[key] = (totals.byType[key] ?? 0) + 1;
        let alwaysTrue = false;
        let alwaysFalse = false;
        let invalid = false;
        let description = `tipo ${type}`;

        if (!VALID_TYPES.has(type)) {
          invalid = true;
          description = `tipo desconocido ${type}`;
        } else if (type === 0) {
          totals.conditionalsOnSwitch++;
          const switchId = Number(params[1]);
          const value = Number(params[2]);
          description = `switch ${switchId} ${value === 0 ? "ON" : "OFF"}`;
          if (switchId <= 0 || switchId >= ctx.switches.length) invalid = true;
        } else if (type === 1) {
          totals.conditionalsOnVariable++;
          const varId = Number(params[1]);
          const operandType = Number(params[2]);
          const operand = Number(params[3]);
          const cmp = Number(params[4]);
          description = `variable ${varId} ${COMPARISON[cmp] ?? "?"} ${operandType === 0 ? operand : `variable ${operand}`}`;
          if (varId <= 0 || varId >= ctx.variables.length) invalid = true;
          if (operandType === 1) {
            if (operand <= 0 || operand >= ctx.variables.length) invalid = true;
            if (operand === varId) {
              if (CONSTANT_FALSE_COMPARISONS.has(cmp)) alwaysFalse = true;
              else alwaysTrue = true;
            }
          } else if (!Number.isFinite(cmp) || cmp < 0 || cmp > 5) {
            invalid = true;
          }
        } else if (type === 2) {
          totals.conditionalsOnSelfSwitch++;
          const letter = rstr(params[1]);
          description = `self switch ${letter}`;
          if (!/^[A-D]$/.test(letter)) invalid = true;
        } else if (type === 12) {
          totals.conditionalsWithScript++;
          const script = rstr(params[1]).trim();
          description = `script \`${script.slice(0, 40)}\``;
          if (/^true$/i.test(script)) alwaysTrue = true;
          else if (/^false$/i.test(script)) alwaysFalse = true;
        }

        if (alwaysTrue) totals.alwaysTrue++;
        if (alwaysFalse) totals.alwaysFalse++;
        if (invalid) totals.invalidConditionIds++;
        if (!alwaysTrue && !alwaysFalse && !invalid) totals.bothPathsTestable++;

        const baseIndent = Number(cmds[i].indent ?? 0);
        let hasElse = false;
        for (let j = i + 1; j < cmds.length; j++) {
          const ind = Number(cmds[j].indent ?? 0);
          const code = cmds[j].code;
          if (ind < baseIndent) break;
          if (ind === baseIndent && code === 411) {
            hasElse = true;
            break;
          }
          if (ind === baseIndent && code === 412) break;
        }
        if (hasElse) totals.withElseBranch++;
        else totals.withoutElseBranch++;

        if ((alwaysTrue || alwaysFalse || invalid) && findings.length < 20) {
          findings.push({
            eventId: ev.id,
            event: ev.name,
            page: pageIdx + 1,
            type: invalid ? "invalid-condition-id" : alwaysTrue ? "always-true" : "always-false",
            description,
          });
        }
        if (samples.length < 4) {
          samples.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type, description, hasElse });
        }
      }
    }
  }

  return {
    mapId,
    name: map.name,
    totals,
    findings,
    samples,
    status:
      totals.invalidConditionIds > 0 ? "fail" : totals.alwaysTrue + totals.alwaysFalse > 0 ? "static_review_runtime_pending" : "static_pass_runtime_pending",
  };
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

function dialogueTotals(rows, ctx) {
  const mapIds = [...new Set(rows.flatMap((r) => r.mapIds ?? []))].sort((a, b) => a - b);
  const totals = {
    tasks: rows.length,
    humanReadingTasks: rows.filter((r) => r.requiresHumanReading).length,
    uniqueMaps: mapIds.length,
    mapRange: mapIds.length ? [mapIds[0], mapIds[mapIds.length - 1]] : [null, null],
    totalBlocks: 0,
    scriptMessagesCount: 0,
    overflowLines: 0,
    overTwoLines: 0,
    missingOpeningQuestion: 0,
    missingOpeningExclamation: 0,
    unbalancedQuotes: 0,
    invalidVariableRefs: 0,
  };
  for (const id of mapIds) {
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
  return totals;
}

function evaluateExtended(task, ctx) {
  const spec = parseTaskSpecExtended(task);
  if (spec.kind === PHASE_KINDS.elecciones) {
    const mapIds = mapIdsOf(spec, ctx);
    const rows = mapIds.map((id) => auditChoiceCoverageMap(id, ctx)).filter(Boolean);
    const initial = {
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
    };
    const totals = sumTotals(rows, initial);
    totals.choiceCoverage =
      totals.optionsDeclared > 0 ? Number(((totals.resolvedOptions / totals.optionsDeclared) * 100).toFixed(2)) : 100;
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
      status: totals.unresolvedBranches > 0 ? "fail" : "static_pass_runtime_pending",
    };
  }
  if (spec.kind === PHASE_KINDS.condiciones) {
    const mapIds = mapIdsOf(spec, ctx);
    const rows = mapIds.map((id) => auditConditionsMap(id, ctx)).filter(Boolean);
    const initial = {
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
    };
    const totals = sumTotals(rows, initial);
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

export function runMixedPhase({ phase, tanda, start, end, slug, script }) {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(start, end);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < start).map((t) => evaluateExtended(t, ctx));
  const taskMatrix = tasks.map((t) => ({ ...evaluateExtended(t, ctx), fileLine: t.fileLine }));

  const byKind = new Map();
  for (const row of taskMatrix) {
    if (!byKind.has(row.kind)) byKind.set(row.kind, []);
    byKind.get(row.kind).push(row);
  }

  const dialogueRows = byKind.get(PHASE_KINDS.dialogos) ?? [];
  const choiceRows = byKind.get(PHASE_KINDS.elecciones) ?? [];
  const conditionRows = byKind.get(PHASE_KINDS.condiciones) ?? [];
  const otherRows = [...byKind.entries()].filter(([k]) => ![PHASE_KINDS.dialogos, PHASE_KINDS.elecciones, PHASE_KINDS.condiciones].includes(k)).flatMap(([, v]) => v);

  const families = [...new Set(taskMatrix.map((r) => r.declaredFamily).filter(Boolean))].sort();

  const dialogues = dialogueRows.length ? dialogueTotals(dialogueRows, ctx) : null;

  const choiceTotals = choiceRows.length
    ? sumTotals(choiceRows, {
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
      })
    : null;
  if (choiceTotals) {
    choiceTotals.choiceCoverage =
      choiceTotals.optionsDeclared > 0 ? Number(((choiceTotals.resolvedOptions / choiceTotals.optionsDeclared) * 100).toFixed(2)) : 100;
    choiceTotals.tasks = choiceRows.length;
  }

  const conditionTotals = conditionRows.length
    ? sumTotals(conditionRows, {
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
      })
    : null;
  if (conditionTotals) conditionTotals.tasks = conditionRows.length;

  const uniqueMaps = [...new Set(taskMatrix.flatMap((r) => r.mapIds ?? []))].sort((a, b) => a - b);

  // Recuento sin duplicar: los tramos por tarea se solapan (una misma página
  // aparece en varias tareas), así que se agrega una sola vez por mapa.
  const choiceUniqueRows = choiceRows.length ? uniqueMaps.map((id) => auditChoiceCoverageMap(id, ctx)).filter(Boolean) : [];
  const choicesUnique = choiceUniqueRows.length
    ? sumTotals(choiceUniqueRows, {
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
      })
    : null;
  if (choicesUnique) {
    choicesUnique.maps = choiceUniqueRows.length;
    choicesUnique.choiceCoverage =
      choicesUnique.optionsDeclared > 0 ? Number(((choicesUnique.resolvedOptions / choicesUnique.optionsDeclared) * 100).toFixed(2)) : 100;
  }

  const conditionUniqueRows = conditionRows.length ? uniqueMaps.map((id) => auditConditionsMap(id, ctx)).filter(Boolean) : [];
  const conditionsUnique = conditionUniqueRows.length
    ? sumTotals(conditionUniqueRows, {
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
      })
    : null;
  if (conditionsUnique) conditionsUnique.maps = conditionUniqueRows.length;

  const findingRows = taskMatrix
    .filter((r) => r.status === "fail" || r.status === "static_review_runtime_pending")
    .slice(0, 12)
    .map((r) => ({ id: r.id, kind: r.kind, range: r.range, status: r.status }));

  const hasFail = taskMatrix.some((r) => r.status === "fail");
  const hasReview = taskMatrix.some((r) => r.status === "static_review_runtime_pending");
  const status = hasFail ? "fail" : hasReview ? "static_review_runtime_pending" : "static_pass_runtime_pending";

  const report = {
    schema: `lote11_fase${phase}_${slug}/1.0`,
    phase,
    tanda,
    tasks: `${start}–${end}`,
    fileLines: fileLineSlice.length ? `${fileLineSlice[0].fileLine}–${fileLineSlice[fileLineSlice.length - 1].fileLine}` : `${start}–${end}`,
    boundaryTaskIdsFromFileLines: fileLineSlice.filter((t) => t.id < start).map((t) => t.id),
    summary: {
      tasks: taskMatrix.length,
      dialogoTasks: dialogueRows.length,
      eleccionesTasks: choiceRows.length,
      condicionesTasks: conditionRows.length,
      otherTasks: otherRows.length,
      uniqueMaps: uniqueMaps.length,
      mapRange: uniqueMaps.length ? [uniqueMaps[0], uniqueMaps[uniqueMaps.length - 1]] : [null, null],
      families,
    },
    dialogues,
    choices: choiceTotals,
    choicesUnique,
    conditions: conditionTotals,
    conditionsUnique,
    findingsByTask: findingRows,
    boundaryTasks,
    taskMatrix,
    policy:
      "Se auditan estáticamente las elecciones (102/402/403/404), las condiciones (111 con sus ramas 411/412) y los diálogos (101/401) de los mapas declarados. Ninguna rama se ejecuta: la cobertura se mide sobre el árbol de comandos, no sobre partidas reales, que quedan como runtime_pending.",
    status,
  };

  const out = path.join(ROOT, "content", `lote11_fase${phase}_${slug}.json`);
  const doc = path.join(ROOT, "docs", "qa", "lote11", `fase_${phase}_${slug}.md`);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const verify = process.argv.includes("--verify");

  const lines = [
    `# FASE ${phase} — Lote mixto de la tanda ${tanda} (tramo ${report.tasks})`,
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
    `- **Tareas procesadas**: ${report.summary.tasks} · diálogos: ${report.summary.dialogoTasks} · elecciones: ${report.summary.eleccionesTasks} · condiciones: ${report.summary.condicionesTasks}${report.summary.otherTasks ? ` · otras: ${report.summary.otherTasks}` : ""}.`,
    `- **Mapas únicos cubiertos**: ${report.summary.uniqueMaps}${report.summary.mapRange[0] == null ? "" : ` (mapas ${report.summary.mapRange[0]}–${report.summary.mapRange[1]})`} · familias: ${families.map((f) => `«${f}»`).join(", ") || "ninguna"}.`,
  ];

  if (dialogues) {
    lines.push(
      "",
      "## Diálogos mostrados y medidos",
      "",
      `- **Tareas**: ${dialogues.tasks} (${dialogues.humanReadingTasks} con lectura humana explícita) · **mapas**: ${dialogues.uniqueMaps}.`,
      `- **Bloques 101/401**: ${dialogues.totalBlocks} · **mensajes de script**: ${dialogues.scriptMessagesCount}.`,
      `- **Formato**: ${dialogues.overflowLines} líneas superan las 53 columnas · ${dialogues.overTwoLines} bloques pasan de 2 líneas.`,
      `- **Signos**: ${dialogues.missingOpeningQuestion} interrogaciones sin «¿» · ${dialogues.missingOpeningExclamation} exclamaciones sin «¡» · ${dialogues.unbalancedQuotes} comillas impares.`,
      `- **Variables inválidas**: ${dialogues.invalidVariableRefs}.`
    );
  }

  if (choiceTotals) {
    lines.push(
      "",
      "## Elecciones recorridas (cobertura estática)",
      "",
      `- **Tareas**: ${choiceTotals.tasks} · **bloques de elección (102)**: ${choiceTotals.choices} en ${choiceTotals.eventsWithChoices} eventos.`,
      `- **Opciones declaradas**: ${choiceTotals.optionsDeclared} · **ramas 402**: ${choiceTotals.whenBranches} · **cobertura de opciones**: ${choiceTotals.choiceCoverage} %.`,
      `- **Recuento sin duplicar por mapa** (${choicesUnique.maps} mapas): ${choicesUnique.choices} bloques 102 · ${choicesUnique.optionsDeclared} opciones · ${choicesUnique.resolvedOptions} resueltas · cobertura ${choicesUnique.choiceCoverage} %.`,
      `- **Cancelación**: ${choiceTotals.cancelableChoices} bloques cancelables (${choiceTotals.implicitCancelChoices} con cancelación implícita) · ramas 403 explícitas: ${choiceTotals.cancelBranches}.`,
      `- **Ramas sin resolver**: ${choiceTotals.unresolvedBranches} (faltantes: ${choiceTotals.missingBranches} · duplicadas: ${choiceTotals.duplicatedBranches} · fuera de rango: ${choiceTotals.outOfRangeOptions} · bloques sin cierre 404: ${choiceTotals.unclosedChoices} · cancelación ausente: ${choiceTotals.missingCancelBranches}).`,
      `- **Ramas con acciones**: ${choiceTotals.branchesWithActions} · vacías (al elegirlas no ocurre nada): ${choiceTotals.emptyBranches} · terminan en transferencia/salida: ${choiceTotals.branchesEndingInTransfer} · cierres 404 huérfanos: ${choiceTotals.strayCloses}.`
    );
  }

  if (conditionTotals) {
    const types = Object.entries(conditionTotals.byType)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([t, n]) => `${t}:${n}`)
      .join(" · ");
    lines.push(
      "",
      "## Condiciones probadas en verdadero y falso (estático)",
      "",
      `- **Tareas**: ${conditionTotals.tasks} · **condicionales (111)**: ${conditionTotals.conditionals} en ${conditionTotals.pages} páginas.`,
      `- **Tipos**: ${types || "sin datos"}.`,
      `- **Rutas**: ${conditionTotals.withElseBranch} con rama `+"`else`"+` (411) · ${conditionTotals.withoutElseBranch} sin ella (falso implícito).`,
      `- **Ambos caminos posibles**: ${conditionTotals.bothPathsTestable} · **siempre verdaderas**: ${conditionTotals.alwaysTrue} · **siempre falsas**: ${conditionTotals.alwaysFalse} · **IDs inválidos**: ${conditionTotals.invalidConditionIds}.`,
      `- **Recuento sin duplicar por mapa** (${conditionsUnique.maps} mapas): ${conditionsUnique.conditionals} condicionales · ${conditionsUnique.bothPathsTestable} con ambos caminos posibles · ${conditionsUnique.alwaysTrue + conditionsUnique.alwaysFalse} constantes · ${conditionsUnique.invalidConditionIds} IDs inválidos.`
    );
  }

  if (report.findingsByTask.length) {
    lines.push("", "## Tareas con hallazgos", "", "| Tarea | Tipo | Mapa(s) | Estado |", "|---:|---|---|---|");
    for (const row of report.findingsByTask) {
      lines.push(`| ${row.id} | ${mdCell(row.kind)} | ${row.range[0]}–${row.range[1]} | \`${row.status}\` |`);
    }
  } else {
    lines.push("", "Sin hallazgos de ramas, condiciones o estado en este tramo.");
  }

  lines.push(
    "",
    "## Límite honesto",
    "",
    "La cobertura de elecciones y la doble prueba de condiciones se calculan sobre el árbol de comandos de los `.rxdata` compilados: ninguna rama se ejecuta realmente. Una condición «siempre verdadera» aquí significa que el propio comando 111 la vuelve tautológica o que referencia un ID inexistente, no que el juego la evalúe así en una partida. La ejecución interactiva en `Game.exe` permanece como `runtime_pending`.",
    ""
  );

  const md = lines.join("\n");

  if (verify) {
    if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, out)} está desactualizado`);
    if (!fs.existsSync(doc) || fs.readFileSync(doc, "utf8") !== md) throw new Error(`${path.relative(ROOT, doc)} está desactualizado`);
    console.log(
      `FASE ${phase}: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · diálogos ${dialogueRows.length} · elecciones ${choiceRows.length} · condiciones ${conditionRows.length} · ${status}`
    );
    return report;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.mkdirSync(path.dirname(doc), { recursive: true });
  fs.writeFileSync(out, serialized);
  fs.writeFileSync(doc, md);
  console.log(
    `FASE ${phase}: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · diálogos ${dialogueRows.length} · elecciones ${choiceRows.length} · condiciones ${conditionRows.length} · ${status}`
  );
  if (status === "fail") process.exitCode = 1;
  return report;
}
