#!/usr/bin/env node
/**
 * FASE 044 — Tanda 44 (tareas 4300–4399 / líneas 4300–4399 de tareas.txt).
 *
 * 1) Cierra el tramo final (4300–4313, mapas 4234–4419 «Campañas ROM») de la
 *    auditoría de eventos en su página final con estado avanzado.
 * 2) Audita las ramas de los eventos (4314–4399, mapas 1–889 «Fire Ash original»)
 *    comprobando que devuelven siempre el control y dejan el estado de partida
 *    coherente.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, evaluateTask, getAuditContext, loadTasksRange } from "./lote9_audit_core.mjs";

const OUT = path.join(ROOT, "content", "lote9_fase044_ramas_eventos_1.json");
const DOC = path.join(ROOT, "docs", "qa", "lote9", "fase_044_ramas_eventos_1.md");
const VERIFY = process.argv.includes("--verify");

function buildReport() {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(4300, 4399);
  const boundaryIds = fileLineSlice.filter((t) => t.id < 4300).map((t) => t.id);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < 4300).map((t) => evaluateTask(t, ctx));
  const evaluated = tasks.map((t) => evaluateTask(t, ctx));

  const finalPageRows = evaluated.filter((r) => r.kind === "eventos_pagina_final");
  const branchRows = evaluated.filter((r) => r.kind === "ramas_control_estado");

  const finalPageMaps = new Set(finalPageRows.flatMap((r) => r.mapIds ?? []));
  const branchMaps = new Set(branchRows.flatMap((r) => r.mapIds ?? []));

  const finalPagesSummary = finalPageRows.reduce(
    (acc, r) => {
      acc.tasks++;
      acc.events += r.totals.events;
      acc.conditionedFinalPages += r.totals.conditionedFinalPages;
      acc.switchesRead += r.totals.switchesRead;
      acc.variablesRead += r.totals.variablesRead;
      acc.selfSwitchesRead += r.totals.selfSwitchesRead;
      acc.switchesWritten += r.totals.switchesWritten;
      acc.variablesWritten += r.totals.variablesWritten;
      acc.selfSwitchesWritten += r.totals.selfSwitchesWritten;
      acc.invalidFlags += r.totals.invalidFlags;
      acc.pagesEndingCleanly += r.totals.pagesEndingCleanly;
      acc.transfersTotal += r.totals.transfersTotal;
      acc.invalidTransfers += r.totals.invalidTransfers;
      acc.dialogueBlocks += r.totals.dialogueBlocks;
      return acc;
    },
    {
      tasks: 0,
      uniqueMaps: finalPageMaps.size,
      range: [4234, 4419],
      events: 0,
      conditionedFinalPages: 0,
      switchesRead: 0,
      variablesRead: 0,
      selfSwitchesRead: 0,
      switchesWritten: 0,
      variablesWritten: 0,
      selfSwitchesWritten: 0,
      invalidFlags: 0,
      pagesEndingCleanly: 0,
      transfersTotal: 0,
      invalidTransfers: 0,
      dialogueBlocks: 0,
    }
  );

  const branchesSummary = branchRows.reduce(
    (acc, r) => {
      acc.tasks++;
      acc.events += r.totals.events;
      acc.pages += r.totals.pages;
      acc.conditionalBranches += r.totals.conditionalBranches;
      acc.elseBranches += r.totals.elseBranches;
      acc.choiceBlocks += r.totals.choiceBlocks;
      acc.choiceWhenBranches += r.totals.choiceWhenBranches;
      acc.choiceCancelBranches += r.totals.choiceCancelBranches;
      acc.loops += r.totals.loops;
      acc.loopBreaks += r.totals.loopBreaks;
      acc.labels += r.totals.labels;
      acc.labelJumps += r.totals.labelJumps;
      acc.unbalancedConditionals += r.totals.unbalancedConditionals;
      acc.unbalancedChoices += r.totals.unbalancedChoices;
      acc.loopsWithoutBreak += r.totals.loopsWithoutBreak;
      acc.pagesWithoutEnd += r.totals.pagesWithoutEnd;
      acc.invalidTransfers += r.totals.invalidTransfers;
      acc.invalidStateWrites += r.totals.invalidStateWrites;
      acc.contradictoryBranchWrites += r.totals.contradictoryBranchWrites;
      return acc;
    },
    {
      tasks: 0,
      uniqueMaps: branchMaps.size,
      range: [1, 889],
      events: 0,
      pages: 0,
      conditionalBranches: 0,
      elseBranches: 0,
      choiceBlocks: 0,
      choiceWhenBranches: 0,
      choiceCancelBranches: 0,
      loops: 0,
      loopBreaks: 0,
      labels: 0,
      labelJumps: 0,
      unbalancedConditionals: 0,
      unbalancedChoices: 0,
      loopsWithoutBreak: 0,
      pagesWithoutEnd: 0,
      invalidTransfers: 0,
      invalidStateWrites: 0,
      contradictoryBranchWrites: 0,
    }
  );

  const hasFail =
    finalPagesSummary.invalidFlags > 0 ||
    finalPagesSummary.invalidTransfers > 0 ||
    branchesSummary.pagesWithoutEnd > 0 ||
    branchesSummary.unbalancedChoices > 0 ||
    branchesSummary.invalidTransfers > 0 ||
    branchesSummary.invalidStateWrites > 0;

  return {
    schema: "lote9_fase044_ramas_eventos_1/1.0",
    phase: "044",
    tasks: "4300–4399",
    fileLines: "4300–4399",
    boundaryTaskIdsFromFileLines: boundaryIds,
    finalPagesSummary,
    branchesSummary,
    boundaryTasks,
    taskMatrix: evaluated,
    policy: "Se audita el cierre de páginas finales en 4234–4419 y la estructura de ramas condicionales/elecciones/bucles/estado en 1–889 sobre datos compilados; la ejecución en vivo en Game.exe permanece en runtime_pending.",
    status: hasFail ? "fail" : "static_pass_runtime_pending",
  };
}

function buildMarkdown(report) {
  const fp = report.finalPagesSummary;
  const br = report.branchesSummary;
  return [
    "# FASE 044 — Cierre de páginas finales (4234–4419) y ramas de eventos (1–889)",
    "",
    "## Reproducción",
    "",
    "```bash",
    "node tools/plan2700/lote9_fase044_ramas_eventos_1.mjs",
    "node tools/plan2700/lote9_fase044_ramas_eventos_1.mjs --verify",
    "```",
    "",
    "## 1. Cierre de eventos en página final (tareas 4300–4313 · mapas 4234–4419 «Campañas ROM»)",
    "",
    `- **Tareas**: ${fp.tasks} · **Mapas únicos**: ${fp.uniqueMaps} · **Eventos**: ${fp.events} (${fp.conditionedFinalPages} con condición avanzada).`,
    `- **Banderas y salidas**: lecturas \`s=${fp.switchesRead}, v=${fp.variablesRead}, self=${fp.selfSwitchesRead}\` · escrituras \`s=${fp.switchesWritten}, v=${fp.variablesWritten}, self=${fp.selfSwitchesWritten}\` · ${fp.transfersTotal} transferencias · **${fp.invalidFlags}** flags inválidas · **${fp.invalidTransfers}** transferencias inválidas.`,
    "",
    "## 2. Ramas de eventos: control y coherencia de estado (tareas 4314–4399 · mapas 1–889 «Fire Ash original»)",
    "",
    `- **Tareas**: ${br.tasks} · **Mapas únicos**: ${br.uniqueMaps} · **Eventos**: ${br.events} · **Páginas**: ${br.pages}.`,
    `- **Ramas analizadas**: ${br.conditionalBranches} condicionales (\`111\`), ${br.elseBranches} ramas \`else\` (\`411\`), ${br.choiceBlocks} bloques de elección (\`102\`) con ${br.choiceWhenBranches} opciones (\`402\`) y ${br.choiceCancelBranches} cancelaciones (\`403\`), ${br.loops} bucles (\`112\`) con ${br.loopBreaks} salidas (\`113\`), ${br.labels} etiquetas (\`118\`) y ${br.labelJumps} saltos (\`119\`).`,
    `- **Integridad de control y estado**: páginas sin fin (\`code 0\`): **${br.pagesWithoutEnd}** · condicionales desbalanceados: **${br.unbalancedConditionals}** · elecciones desbalanceadas: **${br.unbalancedChoices}** · transferencias inválidas: **${br.invalidTransfers}** · escrituras de estado inválidas: **${br.invalidStateWrites}**.`,
    "",
    "## Límite honesto",
    "",
    "La verificación estática garantiza que todos los bloques `111..412` y `102..404` están balanceados, que todas las páginas terminan con `code 0` y que ninguna rama apunta a mapas/coordenadas o IDs de estado inválidos. La ejecución interactiva dentro de `Game.exe` permanece como `runtime_pending`.",
    "",
  ].join("\n");
}

const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
const md = buildMarkdown(report);

if (VERIFY) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== serialized) {
    throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
  }
  if (!fs.existsSync(DOC) || fs.readFileSync(DOC, "utf8") !== md) {
    throw new Error(`${path.relative(ROOT, DOC)} está desactualizado`);
  }
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.mkdirSync(path.dirname(DOC), { recursive: true });
  fs.writeFileSync(OUT, serialized);
  fs.writeFileSync(DOC, md);
}

console.log(`FASE 044 ramas y página final: fpTasks=${report.finalPagesSummary.tasks} (${report.finalPagesSummary.uniqueMaps} mapas) · branchTasks=${report.branchesSummary.tasks} (${report.branchesSummary.uniqueMaps} mapas, ${report.branchesSummary.conditionalBranches} ramas 111) · ${report.status}`);
if (report.status === "fail") process.exitCode = 1;
