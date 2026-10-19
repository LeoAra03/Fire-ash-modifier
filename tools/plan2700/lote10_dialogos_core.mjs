/**
 * Núcleo común del LOTE 10 — tandas de revisión de diálogos (fases 047–049).
 *
 * Cada fase procesa 100 tareas de `tareas.txt` del tipo
 * «Mostrar y comprobar los diálogos de ... «Fire Ash original»: <aspecto>»,
 * reutilizando el auditor estático del lote 9 (`lote9_audit_core.mjs`) y
 * archivando la matriz por tarea en `content/` junto al acta en `docs/qa/lote10/`.
 *
 * Los `.rxdata` de «Fire Ash original» están congelados: esta tanda mide y
 * muestra, no reescribe. La lectura humana de sentido queda como
 * `manual_pending` y la ejecución en `Game.exe` como `runtime_pending`.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, auditDialoguesMap, evaluateTask, getAuditContext, loadTasksRange } from "./lote9_audit_core.mjs";

export const ASPECT_ORDER = [
  "formato de caja y longitud de línea",
  "signos de apertura, comillas y puntuación",
  "idioma, glosario y nombres propios",
  "variables, cantidades y nombres insertados",
  "sentido, tono y lectura humana",
];

function zeroTotals() {
  return {
    tasks: 0,
    humanReadingTasks: 0,
    eventsWithDialogue: 0,
    totalBlocks: 0,
    scriptMessagesCount: 0,
    overflowLines: 0,
    overTwoLines: 0,
    missingOpeningQuestion: 0,
    missingOpeningExclamation: 0,
    unbalancedQuotes: 0,
    englishTokens: 0,
    glossaryHits: 0,
    playerNameTokens: 0,
    variableTokens: 0,
    numericTokens: 0,
    invalidVariableRefs: 0,
  };
}

function addRow(acc, row) {
  acc.tasks++;
  if (row.requiresHumanReading) acc.humanReadingTasks++;
  const t = row.totals ?? {};
  acc.eventsWithDialogue += t.eventsWithDialogue ?? 0;
  acc.totalBlocks += t.totalBlocks ?? 0;
  acc.scriptMessagesCount += t.scriptMessagesCount ?? 0;
  acc.overflowLines += t.overflowLines ?? 0;
  acc.overTwoLines += t.overTwoLines ?? 0;
  acc.missingOpeningQuestion += t.missingOpeningQuestion ?? 0;
  acc.missingOpeningExclamation += t.missingOpeningExclamation ?? 0;
  acc.unbalancedQuotes += t.unbalancedQuotes ?? 0;
  acc.englishTokens += t.englishTokens ?? 0;
  acc.glossaryHits += t.glossaryHits ?? 0;
  acc.playerNameTokens += t.playerNameTokens ?? 0;
  acc.variableTokens += t.variableTokens ?? 0;
  acc.numericTokens += t.numericTokens ?? 0;
  acc.invalidVariableRefs += t.invalidVariableRefs ?? 0;
  return acc;
}

function plural(count, singular, pluralForm) {
  return count === 1 ? singular : pluralForm;
}

function mdCode(value) {
  return String(value ?? "")
    .replace(/`/g, "'")
    .replace(/\r?\n/g, " ")
    .trim();
}

function mdCell(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function mdInline(value) {
  return mdCell(value).replace(/`/g, "'");
}

function rangesSummary(rows) {
  const ids = rows.flatMap((r) => r.mapIds ?? []);
  if (!ids.length) return { count: 0, min: null, max: null };
  return { count: ids.length, min: Math.min(...ids), max: Math.max(...ids) };
}

function policyAndLimit(families) {
  const onlyFireAsh = families.length === 1 && families[0] === "Fire Ash original";
  if (onlyFireAsh) {
    return {
      policy:
        "Se muestran y miden los diálogos (bloques 101/401 y mensajes de script) de los mapas declarados en cada tarea por aspecto: formato de caja, signos, idioma/glosario, variables/cantidades y sentido. Los `.rxdata` de «Fire Ash original» están congelados: esta tanda no reescribe textos. La lectura humana de sentido y la corrida en Game.exe quedan pendientes.",
      limit:
        "Los mapas de «Fire Ash original» están congelados por política del proyecto: esta fase **muestra y mide** sus diálogos, no reescribe los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.",
    };
  }
  const list = families.length === 1
    ? `«${families[0]}»`
    : `${families.slice(0, -1).map((f) => `«${f}»`).join(", ")} y «${families[families.length - 1]}»`;
  return {
    policy:
      `Se muestran y miden los diálogos (bloques 101/401 y mensajes de script) de los mapas declarados en cada tarea (familias ${list}) por aspecto: formato de caja, signos, idioma/glosario, variables/cantidades y sentido. Los \`.rxdata\` de «Fire Ash original» están congelados y el resto de familias se auditan sin reescribir sus textos en esta tanda. La lectura humana de sentido y la corrida en Game.exe quedan pendientes.`,
    limit:
      `Los mapas auditados pertenecen a ${list}. Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los \`.rxdata\`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como \`manual_pending\` y la ejecución interactiva en \`Game.exe\` como \`runtime_pending\`.`,
  };
}

export function buildBatchReport({ phase, tanda, start, end, slug }) {
  const ctx = getAuditContext();
  const { tasks, fileLineSlice } = loadTasksRange(start, end);
  const boundaryTasks = fileLineSlice.filter((t) => t.id < start).map((t) => evaluateTask(t, ctx));
  const taskMatrix = tasks.map((t) => evaluateTask(t, ctx));

  const dialogueRows = taskMatrix.filter((r) => r.kind === "dialogos_revision");
  const otherRows = taskMatrix.filter((r) => r.kind !== "dialogos_revision");

  const uniqueMaps = new Set(dialogueRows.flatMap((r) => r.mapIds ?? []));
  const mapIds = [...uniqueMaps].sort((a, b) => a - b);

  const summary = dialogueRows.reduce(addRow, {
    ...zeroTotals(),
    tasksWithoutMap: 0,
    unmeasuredTasks: otherRows.length,
    uniqueMaps: uniqueMaps.size,
    mapRange: mapIds.length ? [mapIds[0], mapIds[mapIds.length - 1]] : [null, null],
    tasksWithFindings: 0,
  });

  summary.tasksWithoutMap = dialogueRows.filter((r) => (r.mapIds ?? []).length === 0).length;
  summary.tasksWithFindings = dialogueRows.filter((r) => {
    const t = r.totals ?? {};
    return (
      (t.overflowLines ?? 0) > 0 ||
      (t.overTwoLines ?? 0) > 0 ||
      (t.missingOpeningQuestion ?? 0) > 0 ||
      (t.missingOpeningExclamation ?? 0) > 0 ||
      (t.unbalancedQuotes ?? 0) > 0 ||
      (t.invalidVariableRefs ?? 0) > 0
    );
  }).length;
  summary.cleanTasks = dialogueRows.length - summary.tasksWithFindings;

  const uniqueMapMetrics = mapIds.reduce(
    (acc, mapId) => {
      const m = auditDialoguesMap(mapId, "general", ctx);
      if (!m) return acc;
      acc.maps++;
      acc.eventsWithDialogue += m.eventsWithDialogue;
      acc.totalBlocks += m.totalBlocks;
      acc.scriptMessagesCount += m.scriptMessagesCount;
      acc.overflowLines += m.metrics.boxFormat.overflowLines;
      acc.overTwoLines += m.metrics.boxFormat.overTwoLines;
      acc.missingOpeningQuestion += m.metrics.punctuation.missingOpeningQuestion;
      acc.missingOpeningExclamation += m.metrics.punctuation.missingOpeningExclamation;
      acc.unbalancedQuotes += m.metrics.punctuation.unbalancedQuotes;
      acc.englishTokens += m.metrics.languageAndGlossary.englishTokens;
      acc.glossaryHits += m.metrics.languageAndGlossary.glossaryHits;
      acc.playerNameTokens += m.metrics.variablesAndNumbers.playerNameTokens;
      acc.variableTokens += m.metrics.variablesAndNumbers.variableTokens;
      acc.numericTokens += m.metrics.variablesAndNumbers.numericTokens;
      acc.invalidVariableRefs += m.metrics.variablesAndNumbers.invalidVariableRefs;
      return acc;
    },
    {
      maps: 0,
      eventsWithDialogue: 0,
      totalBlocks: 0,
      scriptMessagesCount: 0,
      overflowLines: 0,
      overTwoLines: 0,
      missingOpeningQuestion: 0,
      missingOpeningExclamation: 0,
      unbalancedQuotes: 0,
      englishTokens: 0,
      glossaryHits: 0,
      playerNameTokens: 0,
      variableTokens: 0,
      numericTokens: 0,
      invalidVariableRefs: 0,
    }
  );

  const byAspect = {};
  for (const aspect of ASPECT_ORDER) byAspect[aspect] = { ...zeroTotals(), uniqueMaps: 0 };
  const aspectMaps = new Map();
  for (const row of dialogueRows) {
    const key = row.aspect && byAspect[row.aspect] ? row.aspect : "otros";
    if (!byAspect[key]) byAspect[key] = { ...zeroTotals(), uniqueMaps: 0 };
    addRow(byAspect[key], row);
    if (!aspectMaps.has(key)) aspectMaps.set(key, new Set());
    for (const id of row.mapIds ?? []) aspectMaps.get(key).add(id);
  }
  for (const [key, set] of aspectMaps) byAspect[key].uniqueMaps = set.size;

  const byFamily = {};
  for (const row of dialogueRows) {
    const fam = row.declaredFamily ?? "sin familia declarada";
    if (!byFamily[fam]) byFamily[fam] = { tasks: 0, humanReadingTasks: 0, totalBlocks: 0, scriptMessagesCount: 0, invalidVariableRefs: 0, mapIds: new Set() };
    const info = byFamily[fam];
    info.tasks++;
    if (row.requiresHumanReading) info.humanReadingTasks++;
    info.totalBlocks += row.totals?.totalBlocks ?? 0;
    info.scriptMessagesCount += row.totals?.scriptMessagesCount ?? 0;
    info.invalidVariableRefs += row.totals?.invalidVariableRefs ?? 0;
    for (const id of row.mapIds ?? []) info.mapIds.add(id);
  }
  for (const info of Object.values(byFamily)) {
    const ids = [...info.mapIds].sort((a, b) => a - b);
    info.uniqueMaps = ids.length;
    info.mapRange = ids.length ? [ids[0], ids[ids.length - 1]] : [null, null];
    delete info.mapIds;
  }

  const samples = [];
  for (const aspect of [...ASPECT_ORDER, "otros"]) {
    const rows = dialogueRows.filter((r) => (r.aspect ?? "otros") === aspect && (r.samples ?? []).length);
    for (const row of rows.slice(0, 2)) {
      const s = row.samples[0];
      samples.push({
        taskId: row.id,
        aspect: row.aspect ?? "otros",
        mapId: s.mapId,
        mapName: s.mapName,
        eventId: s.eventId,
        event: s.event,
        page: s.page,
        maxCols: s.maxCols,
        lines: s.lines,
        text: s.text,
      });
    }
  }

  const topFindings = dialogueRows
    .map((r) => {
      const t = r.totals ?? {};
      return {
        id: r.id,
        aspect: r.aspect ?? "otros",
        mapRange: r.range,
        mapName: r.declaredMapName ?? (r.declaredFamily ? `«${r.declaredFamily}»` : ""),
        totalBlocks: t.totalBlocks ?? 0,
        overflowLines: t.overflowLines ?? 0,
        overTwoLines: t.overTwoLines ?? 0,
        punctuationIssues: (t.missingOpeningQuestion ?? 0) + (t.missingOpeningExclamation ?? 0),
        unbalancedQuotes: t.unbalancedQuotes ?? 0,
        score:
          (t.overflowLines ?? 0) +
          (t.overTwoLines ?? 0) +
          (t.missingOpeningQuestion ?? 0) +
          (t.missingOpeningExclamation ?? 0) +
          (t.unbalancedQuotes ?? 0),
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, 10);

  const status = summary.invalidVariableRefs > 0 ? "fail" : "static_measured_manual_reading_pending";

  return {
    schema: `lote10_fase${phase}_${slug}/1.0`,
    phase,
    tanda,
    tasks: `${start}–${end}`,
    fileLines: fileLineSlice.length ? `${fileLineSlice[0].fileLine}–${fileLineSlice[fileLineSlice.length - 1].fileLine}` : `${start}–${end}`,
    boundaryTaskIdsFromFileLines: fileLineSlice.filter((t) => t.id < start).map((t) => t.id),
    summary,
    uniqueMapMetrics,
    byAspect,
    byFamily,
    topFindings,
    samples,
    boundaryTasks,
    taskMatrix,
    policy: policyAndLimit(Object.keys(byFamily)).policy,
    status,
  };
}

export function renderMarkdown(report, script) {
  const s = report.summary;
  const scriptPath = `tools/plan2700/${script}`;
  const mapRange = s.mapRange[0] == null ? "sin mapas" : `mapas ${s.mapRange[0]}–${s.mapRange[1]}`;
  const lines = [
    `# FASE ${report.phase} — Mostrar y comprobar diálogos (tramo ${report.tasks})`,
    "",
    "## Reproducción",
    "",
    "```bash",
    `node ${scriptPath}`,
    `node ${scriptPath} --verify`,
    "```",
    "",
    "## Resumen medido",
    "",
    `- **Tareas procesadas**: ${s.tasks} (${s.humanReadingTasks} con lectura humana de sentido explícita · ${s.tasksWithoutMap} sin mapas localizables).`,
    `- **Mapas únicos cubiertos**: ${s.uniqueMaps} (${mapRange}) · familias declaradas: ${Object.keys(report.byFamily).map((f) => `«${f}»`).join(", ") || "ninguna"}.`,
    `- **Suma por tarea** (los tramos se solapan): ${s.eventsWithDialogue} eventos con diálogo · ${s.totalBlocks} bloques 101/401 · ${s.scriptMessagesCount} ${plural(s.scriptMessagesCount, "mensaje", "mensajes")} de script.`,
    `- **Recuento sin duplicar por mapa** (${report.uniqueMapMetrics.maps} mapas): ${report.uniqueMapMetrics.eventsWithDialogue} eventos con diálogo · ${report.uniqueMapMetrics.totalBlocks} bloques 101/401 · ${report.uniqueMapMetrics.scriptMessagesCount} ${plural(report.uniqueMapMetrics.scriptMessagesCount, "mensaje", "mensajes")} de script.`,
    `- **Formato de caja (sin duplicar)**: ${report.uniqueMapMetrics.overflowLines} líneas superan las 53 columnas · ${report.uniqueMapMetrics.overTwoLines} bloques pasan de 2 líneas.`,
    `- **Signos (sin duplicar)**: ${report.uniqueMapMetrics.missingOpeningQuestion} interrogaciones sin «¿» · ${report.uniqueMapMetrics.missingOpeningExclamation} exclamaciones sin «¡» · ${report.uniqueMapMetrics.unbalancedQuotes} comillas impares.`,
    `- **Idioma y glosario (sin duplicar)**: ${report.uniqueMapMetrics.englishTokens} bloques con marcas de inglés · ${report.uniqueMapMetrics.glossaryHits} aciertos de glosario.`,
    `- **Variables y cantidades (sin duplicar)**: \\PN en ${report.uniqueMapMetrics.playerNameTokens} bloques · \\v[n] en ${report.uniqueMapMetrics.variableTokens} ocasiones · ${report.uniqueMapMetrics.numericTokens} bloques con cifras · **referencias inválidas: ${report.uniqueMapMetrics.invalidVariableRefs}**.`,
    `- **Tareas con alguna incidencia de formato/signos**: ${s.tasksWithFindings}/${s.tasks}. Estado: \`${report.status}\`.`,
    "",
    "## Cobertura por aspecto",
    "",
    "| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\\PN` / `\\v[n]` | Inválidas |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const [aspect, info] of Object.entries(report.byAspect)) {
    lines.push(
      `| ${mdCell(aspect)} | ${info.tasks} | ${info.humanReadingTasks} | ${info.uniqueMaps} | ${info.totalBlocks} | ${info.scriptMessagesCount} | ${info.overflowLines} | ${info.overTwoLines} | ${info.missingOpeningQuestion + info.missingOpeningExclamation} | ${info.unbalancedQuotes} | ${info.glossaryHits} | ${info.playerNameTokens}/${info.variableTokens} | ${info.invalidVariableRefs} |`
    );
  }

  lines.push("", "## Cobertura por familia declarada", "", "| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |", "|---|---:|---:|---:|---|---:|---:|---:|");
  for (const [fam, info] of Object.entries(report.byFamily)) {
    lines.push(
      `| ${mdCell(fam)} | ${info.tasks} | ${info.humanReadingTasks} | ${info.uniqueMaps} | ${info.mapRange[0]}–${info.mapRange[1]} | ${info.totalBlocks} | ${info.scriptMessagesCount} | ${info.invalidVariableRefs} |`
    );
  }

  lines.push("", "## Tareas con más incidencias", "");
  if (report.topFindings.length) {
    lines.push("| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |", "|---:|---|---|---:|---:|---:|---:|---:|");
    for (const row of report.topFindings) {
      lines.push(
        `| ${row.id} | ${mdCell(row.aspect)} | ${row.mapRange[0]}${row.mapRange[1] !== row.mapRange[0] ? `–${row.mapRange[1]}` : ""} ${mdCell(row.mapName)} | ${row.totalBlocks} | ${row.overflowLines} | ${row.overTwoLines} | ${row.punctuationIssues} | ${row.unbalancedQuotes} |`
      );
    }
  } else {
    lines.push("Sin incidencias de formato, signos o comillas en este tramo.");
  }

  lines.push("", "## Muestras extraídas", "");
  if (report.samples.length) {
    for (const sample of report.samples) {
      lines.push(
        `- **Tarea ${sample.taskId}** (${mdCell(sample.aspect)} · Mapa ${sample.mapId} «${mdInline(sample.mapName)}» · Ev ${sample.eventId} \`${mdCode(sample.event)}\`, pág. ${sample.page}, ${sample.maxCols} cols): \`${mdCode(sample.text)}\``
      );
    }
  } else {
    lines.push("Sin bloques de diálogo recuperables en los mapas declarados.");
  }

  lines.push("", "## Límite honesto", "", policyAndLimit(Object.keys(report.byFamily)).limit, "");
  return lines.join("\n");
}

export function runPhase({ phase, tanda, start, end, slug, script }) {
  const report = buildBatchReport({ phase, tanda, start, end, slug });
  const out = path.join(ROOT, "content", `lote10_fase${phase}_${slug}.json`);
  const doc = path.join(ROOT, "docs", "qa", "lote10", `fase_${phase}_${slug}.md`);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const md = renderMarkdown(report, script);
  const verify = process.argv.includes("--verify");

  if (verify) {
    if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== serialized) {
      throw new Error(`${path.relative(ROOT, out)} está desactualizado`);
    }
    if (!fs.existsSync(doc) || fs.readFileSync(doc, "utf8") !== md) {
      throw new Error(`${path.relative(ROOT, doc)} está desactualizado`);
    }
    console.log(
      `FASE ${phase} diálogos: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · ${report.summary.totalBlocks} bloques · inválidas=${report.summary.invalidVariableRefs} · ${report.status}`
    );
    return report;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.mkdirSync(path.dirname(doc), { recursive: true });
  fs.writeFileSync(out, serialized);
  fs.writeFileSync(doc, md);
  console.log(
    `FASE ${phase} diálogos: ${report.summary.tasks} tareas · ${report.summary.uniqueMaps} mapas · ${report.summary.totalBlocks} bloques · inválidas=${report.summary.invalidVariableRefs} · ${report.status}`
  );
  if (report.status === "fail") process.exitCode = 1;
  return report;
}
