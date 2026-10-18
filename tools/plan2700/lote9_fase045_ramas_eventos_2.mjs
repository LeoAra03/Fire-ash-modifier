#!/usr/bin/env node
/**
 * FASE 045 — Tanda 45 (tareas 4400–4499 / líneas 4400–4499 de tareas.txt).
 *
 * Audita las ramas de los eventos en los mapas 889–3466 («Fire Ash original»
 * cierre, «Horizontes», «Atlas Mil», «Ruta de Dios + Silver», «Dimensional
 * Nightmare», «Mapas nuevos del DLC» y «Campañas ROM» tramo 1), comprobando
 * que devuelven el control y dejan el estado de partida coherente.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, evaluateTask, getAuditContext, loadTasksRange } from "./lote9_audit_core.mjs";

const OUT = path.join(ROOT, "content", "lote9_fase045_ramas_eventos_2.json");
const DOC = path.join(ROOT, "docs", "qa", "lote9", "fase_045_ramas_eventos_2.md");
const VERIFY = process.argv.includes("--verify");

function buildReport() {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(4400, 4499);
  const boundaryIds = fileLineSlice.filter((t) => t.id < 4400).map((t) => t.id);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < 4400).map((t) => evaluateTask(t, ctx));
  const evaluated = tasks.map((t) => evaluateTask(t, ctx));

  const uniqueMaps = new Set(evaluated.flatMap((r) => r.mapIds ?? []));

  const summary = evaluated.reduce(
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
      acc.unreleasedAutorunPages += r.totals.unreleasedAutorunPages;
      acc.invalidTransfers += r.totals.invalidTransfers;
      acc.invalidStateWrites += r.totals.invalidStateWrites;
      acc.contradictoryBranchWrites += r.totals.contradictoryBranchWrites;
      return acc;
    },
    {
      tasks: 0,
      uniqueMaps: uniqueMaps.size,
      range: [889, 3466],
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
      unreleasedAutorunPages: 0,
      invalidTransfers: 0,
      invalidStateWrites: 0,
      contradictoryBranchWrites: 0,
    }
  );

  const byFamily = {};
  for (const row of evaluated) {
    const fam = row.declaredFamily ?? "other";
    if (!byFamily[fam]) byFamily[fam] = { tasks: 0, firstMap: row.range[0], lastMap: row.range[1], events: 0, pages: 0, conditionalBranches: 0, choiceBlocks: 0 };
    byFamily[fam].tasks++;
    byFamily[fam].lastMap = Math.max(byFamily[fam].lastMap, row.range[1]);
    byFamily[fam].events += row.totals.events;
    byFamily[fam].pages += row.totals.pages;
    byFamily[fam].conditionalBranches += row.totals.conditionalBranches;
    byFamily[fam].choiceBlocks += row.totals.choiceBlocks;
  }

  const hasFail =
    summary.pagesWithoutEnd > 0 ||
    summary.unbalancedChoices > 0 ||
    summary.invalidTransfers > 0 ||
    summary.invalidStateWrites > 0;

  return {
    schema: "lote9_fase045_ramas_eventos_2/1.0",
    phase: "045",
    tasks: "4400–4499",
    fileLines: "4400–4499",
    boundaryTaskIdsFromFileLines: boundaryIds,
    summary,
    byFamily,
    boundaryTasks,
    taskMatrix: evaluated,
    policy: "Se audita estáticamente cada rama condicional (111/411/412), elección (102/402/403/404), bucle (112/113/413) y transición de estado en los mapas 889–3466; la deuda autorun de DN permanece declarada y la corrida en Game.exe queda en runtime_pending.",
    status: hasFail ? "fail" : summary.unreleasedAutorunPages > 0 ? "static_review_runtime_pending" : "static_pass_runtime_pending",
  };
}

function buildMarkdown(report) {
  const s = report.summary;
  const lines = [
    "# FASE 045 — Ramas de eventos: control y coherencia de estado (tramo 4400–4499)",
    "",
    "## Reproducción",
    "",
    "```bash",
    "node tools/plan2700/lote9_fase045_ramas_eventos_2.mjs",
    "node tools/plan2700/lote9_fase045_ramas_eventos_2.mjs --verify",
    "```",
    "",
    "## Resumen medido (mapas 889–3466)",
    "",
    `- **Tareas procesadas**: ${s.tasks} (\`4400–4499\`, más líneas de borde \`4396–4399\` indexadas).`,
    `- **Mapas únicos cubiertos**: ${s.uniqueMaps} · **Eventos**: ${s.events} · **Páginas**: ${s.pages}.`,
    `- **Ramas analizadas**: ${s.conditionalBranches} condicionales (\`111\`), ${s.elseBranches} ramas \`else\` (\`411\`), ${s.choiceBlocks} bloques de elección (\`102\`) con ${s.choiceWhenBranches} opciones (\`402\`) y ${s.choiceCancelBranches} cancelaciones (\`403\`), ${s.loops} bucles (\`112\`) con ${s.loopBreaks} salidas (\`113\`), ${s.labels} etiquetas (\`118\`) y ${s.labelJumps} saltos (\`119\`).`,
    `- **Integridad de control y estado**: páginas sin fin (\`code 0\`): **${s.pagesWithoutEnd}** · elecciones desbalanceadas: **${s.unbalancedChoices}** · transferencias inválidas: **${s.invalidTransfers}** · escrituras de estado inválidas: **${s.invalidStateWrites}** · páginas autorun/paralelas pendientes en DN/Restauración: ${s.unreleasedAutorunPages}.`,
    "",
    "## Desglose por familia declarada",
    "",
    "| Familia | Tareas | Rango de mapas | Eventos (suma por tarea) | Páginas | Condicionales (111) | Elecciones (102) |",
    "|---|---:|---|---:|---:|---:|---:|",
  ];
  for (const [fam, info] of Object.entries(report.byFamily)) {
    lines.push(`| ${fam} | ${info.tasks} | ${info.firstMap}–${info.lastMap} | ${info.events} | ${info.pages} | ${info.conditionalBranches} | ${info.choiceBlocks} |`);
  }
  lines.push(
    "",
    "## Límite honesto",
    "",
    "Este verificador comprueba el árbol de comandos de todas las páginas en `Map*.rxdata`. La ejecución interactiva en `Game.exe` permanece como `runtime_pending`.",
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

console.log(`FASE 045 ramas y estado: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · ${report.summary.events} eventos · ${report.summary.conditionalBranches} ramas 111 · ${report.status}`);
if (report.status === "fail") process.exitCode = 1;
