#!/usr/bin/env node
/**
 * FASE 043 — Tanda 43 (tareas 4200–4299 / líneas 4200–4299 de tareas.txt).
 *
 * Audita y traza la página final con estado avanzado (banderas, salidas y
 * textos) de los eventos en los mapas 1562–4234 («Atlas Mil» tramo 2,
 * «Ruta de Dios + Silver», «Dimensional Nightmare», «Mapas nuevos del DLC» y
 * «Campañas ROM»). La ejecución interactiva en Game.exe permanece en
 * runtime_pending.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, evaluateTask, getAuditContext, loadTasksRange } from "./lote9_audit_core.mjs";

const OUT = path.join(ROOT, "content", "lote9_fase043_eventos_final_2.json");
const DOC = path.join(ROOT, "docs", "qa", "lote9", "fase_043_eventos_final_2.md");
const VERIFY = process.argv.includes("--verify");

function buildReport() {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(4200, 4299);
  const boundaryIds = fileLineSlice.filter((t) => t.id < 4200).map((t) => t.id);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < 4200).map((t) => evaluateTask(t, ctx));
  const evaluated = tasks.map((t) => evaluateTask(t, ctx));

  const uniqueMapIds = new Set();
  for (const row of evaluated) for (const id of row.mapIds ?? []) uniqueMapIds.add(id);

  const summary = evaluated.reduce(
    (acc, row) => {
      acc.tasks++;
      acc.events += row.totals.events;
      acc.multiPageEvents += row.totals.multiPageEvents;
      acc.conditionedFinalPages += row.totals.conditionedFinalPages;
      acc.switchesRead += row.totals.switchesRead;
      acc.variablesRead += row.totals.variablesRead;
      acc.selfSwitchesRead += row.totals.selfSwitchesRead;
      acc.switchesWritten += row.totals.switchesWritten;
      acc.variablesWritten += row.totals.variablesWritten;
      acc.selfSwitchesWritten += row.totals.selfSwitchesWritten;
      acc.unnamedSwitches += row.totals.unnamedSwitches;
      acc.unnamedVariables += row.totals.unnamedVariables;
      acc.invalidFlags += row.totals.invalidFlags;
      acc.pagesEndingCleanly += row.totals.pagesEndingCleanly;
      acc.autorunOrParallel += row.totals.autorunOrParallel;
      acc.unreleasedAutorun += row.totals.unreleasedAutorun;
      acc.transfersTotal += row.totals.transfersTotal;
      acc.invalidTransfers += row.totals.invalidTransfers;
      acc.dialogueBlocks += row.totals.dialogueBlocks;
      acc.scriptMessages += row.totals.scriptMessages;
      acc.wideLines += row.totals.wideLines;
      acc.replacementChars += row.totals.replacementChars;
      return acc;
    },
    {
      tasks: 0,
      uniqueMaps: uniqueMapIds.size,
      events: 0,
      multiPageEvents: 0,
      conditionedFinalPages: 0,
      switchesRead: 0,
      variablesRead: 0,
      selfSwitchesRead: 0,
      switchesWritten: 0,
      variablesWritten: 0,
      selfSwitchesWritten: 0,
      unnamedSwitches: 0,
      unnamedVariables: 0,
      invalidFlags: 0,
      pagesEndingCleanly: 0,
      autorunOrParallel: 0,
      unreleasedAutorun: 0,
      transfersTotal: 0,
      invalidTransfers: 0,
      dialogueBlocks: 0,
      scriptMessages: 0,
      wideLines: 0,
      replacementChars: 0,
    }
  );

  const byFamily = {};
  for (const row of evaluated) {
    const fam = row.declaredFamily ?? "other";
    if (!byFamily[fam]) byFamily[fam] = { tasks: 0, firstMap: row.range[0], lastMap: row.range[1], events: 0, conditionedFinalPages: 0, transfersTotal: 0, dialogueBlocks: 0 };
    byFamily[fam].tasks++;
    byFamily[fam].lastMap = Math.max(byFamily[fam].lastMap, row.range[1]);
    byFamily[fam].events += row.totals.events;
    byFamily[fam].conditionedFinalPages += row.totals.conditionedFinalPages;
    byFamily[fam].transfersTotal += row.totals.transfersTotal;
    byFamily[fam].dialogueBlocks += row.totals.dialogueBlocks;
  }

  return {
    schema: "lote9_fase043_eventos_final_2/1.0",
    phase: "043",
    tasks: "4200–4299",
    fileLines: "4200–4299",
    boundaryTaskIdsFromFileLines: boundaryIds,
    mapRange: [1562, 4234],
    summary,
    byFamily,
    boundaryTasks,
    taskMatrix: evaluated,
    policy: "Se audita y simula estáticamente la página final de cada evento bajo su estado avanzado requerido (@condition); las páginas autorun pendientes de liberación en DN (2041–2190) y Restauración (2023–2029) quedan registradas como deuda declarada y la corrida en Game.exe permanece en runtime_pending.",
    status: summary.invalidFlags > 0 || summary.invalidTransfers > 0 ? "fail" : summary.unreleasedAutorun > 0 ? "static_review_runtime_pending" : "static_pass_runtime_pending",
  };
}

function buildMarkdown(report) {
  const s = report.summary;
  const lines = [
    "# FASE 043 — Eventos en página final con estado avanzado (tramo 4200–4299)",
    "",
    "## Reproducción",
    "",
    "```bash",
    "node tools/plan2700/lote9_fase043_eventos_final_2.mjs",
    "node tools/plan2700/lote9_fase043_eventos_final_2.mjs --verify",
    "```",
    "",
    "## Alcance y resumen medido",
    "",
    `- **Tareas procesadas**: ${s.tasks} (\`4200–4299\`, más líneas de borde \`4196–4199\` indexadas).`,
    `- **Mapas únicos cubiertos**: ${s.uniqueMaps} (rango \`1562–4234\`: «Atlas Mil», «Ruta de Dios + Silver», «Dimensional Nightmare», «Mapas nuevos del DLC» y «Campañas ROM»).`,
    `- **Eventos evaluados en su página final**: ${s.events} (${s.multiPageEvents} multipágina, ${s.conditionedFinalPages} con condición de estado avanzado).`,
    `- **Banderas comprobadas**: lecturas \`s=${s.switchesRead}\`, \`v=${s.variablesRead}\`, \`self=${s.selfSwitchesRead}\` · escrituras \`s=${s.switchesWritten}\`, \`v=${s.variablesWritten}\`, \`self=${s.selfSwitchesWritten}\` · IDs inválidos: **${s.invalidFlags}**.`,
    `- **Salidas comprobadas**: ${s.pagesEndingCleanly}/${s.events} páginas cerradas con \`code 0\`, ${s.transfersTotal} transferencias verificadas, **${s.invalidTransfers}** destinos inválidos, ${s.unreleasedAutorun} páginas autorun/paralelas sin liberación en el tramo DN/Restauración (ya declaradas en \`content/evento_terminado.json\`).`,
    `- **Textos en página final**: ${s.dialogueBlocks} bloques \`101/401\` y ${s.scriptMessages} mensajes de script, **${s.replacementChars}** caracteres corruptos (\`\`).`,
    "",
    "## Desglose por familia declarada",
    "",
    "| Familia | Tareas | Rango de mapas | Eventos (suma por tarea) | Páginas finales condicionadas | Transferencias | Bloques de texto |",
    "|---|---:|---|---:|---:|---:|---:|",
  ];
  for (const [fam, info] of Object.entries(report.byFamily)) {
    lines.push(`| ${fam} | ${info.tasks} | ${info.firstMap}–${info.lastMap} | ${info.events} | ${info.conditionedFinalPages} | ${info.transfersTotal} | ${info.dialogueBlocks} |`);
  }
  lines.push(
    "",
    "## Límite honesto",
    "",
    "Este verificador comprueba los datos compilados (`Map*.rxdata`, `MapInfos.rxdata`, `System.rxdata`) en la página final de cada evento inyectando las condiciones de estado avanzado. Las páginas autorun de Dimensional Nightmare (`EVENTO-AUTORUN-SIN-SALIDA`) se reportan sin ocultarlas; la corrida en vivo dentro de `Game.exe` permanece como `runtime_pending`.",
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

console.log(`FASE 043 eventos página final: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · ${report.summary.events} eventos · invalidFlags=${report.summary.invalidFlags} · invalidTransfers=${report.summary.invalidTransfers} · ${report.status}`);
if (report.status === "fail") process.exitCode = 1;
