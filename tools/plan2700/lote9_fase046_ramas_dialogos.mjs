#!/usr/bin/env node
/**
 * FASE 046 — Tanda 46 (tareas 4500–4599 / líneas 4500–4599 de tareas.txt).
 *
 * 1) Cierra la auditoría de ramas, control y coherencia de estado en los mapas
 *    3466–4419 «Campañas ROM» (tareas 4500–4554).
 * 2) Muestra y comprueba los diálogos de los mapas 1–108 «Fire Ash original»
 *    (tareas 4555–4599) por aspecto (formato de caja, signos/puntuación,
 *    idioma/glosario, variables/cantidades y muestras para lectura humana).
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, evaluateTask, getAuditContext, loadTasksRange } from "./lote9_audit_core.mjs";

const OUT = path.join(ROOT, "content", "lote9_fase046_ramas_dialogos.json");
const DOC = path.join(ROOT, "docs", "qa", "lote9", "fase_046_ramas_dialogos.md");
const VERIFY = process.argv.includes("--verify");

function buildReport() {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(4500, 4599);
  const boundaryIds = fileLineSlice.filter((t) => t.id < 4500).map((t) => t.id);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < 4500).map((t) => evaluateTask(t, ctx));
  const evaluated = tasks.map((t) => evaluateTask(t, ctx));

  const branchRows = evaluated.filter((r) => r.kind === "ramas_control_estado");
  const dialogueRows = evaluated.filter((r) => r.kind === "dialogos_revision");

  const branchMaps = new Set(branchRows.flatMap((r) => r.mapIds ?? []));
  const dialogueMaps = new Set(dialogueRows.flatMap((r) => r.mapIds ?? []));

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
      return acc;
    },
    {
      tasks: 0,
      uniqueMaps: branchMaps.size,
      range: [3466, 4419],
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
    }
  );

  const dialoguesByAspect = {};
  for (const r of dialogueRows) {
    const aspect = r.aspect ?? "general";
    if (!dialoguesByAspect[aspect]) {
      dialoguesByAspect[aspect] = { tasks: 0, humanReadingTasks: 0, totalBlocks: 0, scriptMessagesCount: 0, overflowLines: 0, missingOpeningQuestion: 0, missingOpeningExclamation: 0, englishTokens: 0, glossaryHits: 0, playerNameTokens: 0, variableTokens: 0, invalidVariableRefs: 0 };
    }
    const a = dialoguesByAspect[aspect];
    a.tasks++;
    if (r.requiresHumanReading) a.humanReadingTasks++;
    a.totalBlocks += r.totals.totalBlocks;
    a.scriptMessagesCount += r.totals.scriptMessagesCount;
    a.overflowLines += r.totals.overflowLines;
    a.missingOpeningQuestion += r.totals.missingOpeningQuestion;
    a.missingOpeningExclamation += r.totals.missingOpeningExclamation;
    a.englishTokens += r.totals.englishTokens;
    a.glossaryHits += r.totals.glossaryHits;
    a.playerNameTokens += r.totals.playerNameTokens;
    a.variableTokens += r.totals.variableTokens;
    a.invalidVariableRefs += r.totals.invalidVariableRefs;
  }

  const dialoguesSummary = {
    tasks: dialogueRows.length,
    uniqueMaps: dialogueMaps.size,
    range: [1, 108],
    humanReadingTasks: dialogueRows.filter((r) => r.requiresHumanReading).length,
    invalidVariableRefs: dialogueRows.reduce((n, r) => n + r.totals.invalidVariableRefs, 0),
    byAspect: dialoguesByAspect,
  };

  const hasFail =
    branchesSummary.pagesWithoutEnd > 0 ||
    branchesSummary.unbalancedChoices > 0 ||
    branchesSummary.invalidTransfers > 0 ||
    branchesSummary.invalidStateWrites > 0 ||
    dialoguesSummary.invalidVariableRefs > 0;

  return {
    schema: "lote9_fase046_ramas_dialogos/1.0",
    phase: "046",
    tasks: "4500–4599",
    fileLines: "4500–4599",
    boundaryTaskIdsFromFileLines: boundaryIds,
    branchesSummary,
    dialoguesSummary,
    boundaryTasks,
    taskMatrix: evaluated,
    policy: "Se audita el cierre de ramas en 3466–4419 y se extraen/miden los diálogos de 1–108 por aspecto; los mapas originales de Fire Ash (1–108) están en inglés de origen y la lectura humana de sentido queda explícitamente como manual_pending.",
    status: hasFail ? "fail" : "static_pass_manual_pending",
  };
}

function buildMarkdown(report) {
  const br = report.branchesSummary;
  const dg = report.dialoguesSummary;
  const lines = [
    "# FASE 046 — Cierre de ramas (3466–4419) y revisión de diálogos (mapas 1–108)",
    "",
    "## Reproducción",
    "",
    "```bash",
    "node tools/plan2700/lote9_fase046_ramas_dialogos.mjs",
    "node tools/plan2700/lote9_fase046_ramas_dialogos.mjs --verify",
    "```",
    "",
    "## 1. Cierre de ramas de eventos (tareas 4500–4554 · mapas 3466–4419 «Campañas ROM»)",
    "",
    `- **Tareas**: ${br.tasks} · **Mapas únicos**: ${br.uniqueMaps} · **Eventos**: ${br.events} · **Páginas**: ${br.pages}.`,
    `- **Integridad**: condicionales (\`111\`): ${br.conditionalBranches} · elecciones (\`102\`): ${br.choiceBlocks} · páginas sin fin (\`code 0\`): **${br.pagesWithoutEnd}** · transferencias inválidas: **${br.invalidTransfers}** · escrituras de estado inválidas: **${br.invalidStateWrites}**.`,
    "",
    "## 2. Mostrar y comprobar diálogos (tareas 4555–4599 · mapas 1–108 «Fire Ash original»)",
    "",
    `- **Tareas**: ${dg.tasks} (${dg.humanReadingTasks} con lectura humana de sentido explícita) · **Mapas únicos**: ${dg.uniqueMaps} · **Referencias a variables inválidas**: **${dg.invalidVariableRefs}**.`,
    "",
    "| Aspecto evaluado | Tareas | Lectura humana | Bloques 101/401 | Script msgs | >53 cols | ¿/¡ ausentes | Glosario | `\\PN` / `\\v[n]` |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const [aspect, info] of Object.entries(dg.byAspect)) {
    lines.push(
      `| ${aspect} | ${info.tasks} | ${info.humanReadingTasks} | ${info.totalBlocks} | ${info.scriptMessagesCount} | ${info.overflowLines} | ${info.missingOpeningQuestion + info.missingOpeningExclamation} | ${info.glossaryHits} | ${info.playerNameTokens}/${info.variableTokens} |`
    );
  }
  lines.push(
    "",
    "## Muestras extraídas (mapas 1–108)",
    ""
  );
  const sampleRows = report.taskMatrix.filter((r) => r.kind === "dialogos_revision" && r.samples?.length).slice(0, 8);
  for (const row of sampleRows) {
    const first = row.samples[0];
    lines.push(`- **Tarea ${row.id}** (Mapa ${first.mapId} «${first.mapName}» · Ev ${first.eventId} \`${first.event}\`, pág. ${first.page}, ${first.maxCols} cols): \`${first.text}\``);
  }
  lines.push(
    "",
    "## Límite honesto",
    "",
    "Los mapas `1–108` pertenecen a «Fire Ash original» (cuya política de congelación impide reescribir sus `.rxdata` originales y cuyos textos base están mayoritariamente en inglés). Las métricas de formato, signos, glosario y variables quedan archivadas por tarea y la lectura humana de sentido/tono permanece marcada como `manual_pending`.",
    ""
  );
  return lines.join("\n");
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

console.log(`FASE 046 ramas y diálogos: branchTasks=${report.branchesSummary.tasks} (${report.branchesSummary.uniqueMaps} mapas) · dialogueTasks=${report.dialoguesSummary.tasks} (${report.dialoguesSummary.uniqueMaps} mapas) · ${report.status}`);
if (report.status === "fail") process.exitCode = 1;
