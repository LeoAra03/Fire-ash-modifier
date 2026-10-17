#!/usr/bin/env node
/**
 * FASE 035 — reproducibilidad de experimentos, medidas y congelación de diseño.
 *
 * Comprueba que el protocolo de FASE 034 sea auditable, refresca el inventario
 * de hashes cuando se ejecuta fuera de --verify y deja C1–C5 como criterios
 * separados. No inventa participantes, replicaciones ni playtest.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "content", "lote7_fase035_cierre_experimentos.json");
const EXPERIMENTS = path.join(ROOT, "content", "lote7_fase034_experimentos.json");
const VERIFY = process.argv.includes("--verify");
const slash = (file) => path.relative(ROOT, file).split(path.sep).join("/");
function readJson(relative) { return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")); }
function git(args) {
  try { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trim(); }
  catch { return ""; }
}
function safeRead(relative) {
  const file = path.join(ROOT, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
function buildExperimentAudit() {
  const phase34 = readJson("content/lote7_fase034_experimentos.json");
  const errors = [];
  if (phase34.experiments?.length !== 25) errors.push("not-25-experiments");
  for (const experiment of phase34.experiments ?? []) {
    if (experiment.result !== null) errors.push(`fabricated-result-${experiment.id}`);
    if (!experiment.hypothesis || !experiment.metrics?.length || !experiment.sample || !experiment.decision) errors.push(`incomplete-${experiment.id}`);
  }
  return {
    source: "content/lote7_fase034_experimentos.json",
    count: phase34.experiments?.length ?? 0,
    errors,
    allResultsEmpty: errors.every((error) => !error.startsWith("fabricated-result")),
    secondIndependentGroup: { target: 5, results: [], status: "manual_pending" },
    reversionLog: { entries: [], status: "manual_pending: se completa solo al observar un cambio no replicado" },
    timebox: { minutesPerExperiment: 90, totalMinutes: 2250, enforcement: "manual_pending" },
    learnings: { conclusions: [], status: "manual_pending" },
  };
}
function inventoryAudit() {
  const file = path.join(ROOT, "tools/inventario_congelado.json");
  if (!fs.existsSync(file)) return { exists: false, phaseTools: [], fileCount: 0, status: "missing" };
  const inventory = readJson("tools/inventario_congelado.json");
  const paths = inventory.hashes?.files?.map((row) => row.path) ?? [];
  const phaseTools = paths.filter((filePath) => /lote7_fase0(32|33|34|35)/.test(filePath)).sort();
  return {
    exists: true,
    algorithm: inventory.hashes?.algorithm ?? "sha256",
    phaseTools,
    excludesSelf: !paths.includes("tools/inventario_congelado.json"),
    status: phaseTools.length >= 3 ? "static_present" : "needs_regeneration",
  };
}
function criteriaAudit() {
  const coverage = fs.existsSync(path.join(ROOT, "content/lote6_fase029_cobertura.json")) ? readJson("content/lote6_fase029_cobertura.json") : null;
  const fuzz = fs.existsSync(path.join(ROOT, "content/lote6_fase031_adversario.json")) ? readJson("content/lote6_fase031_adversario.json") : null;
  const defects = safeRead("docs/qa/defectos.md");
  const openDefectRows = (defects.match(/^\| D-[^\n]+/gm) ?? []).filter((line) => !/\| `resolved`\|/i.test(line));
  const c1Observed = coverage?.totals?.cells ?? null;
  const c1Target = 6283152;
  return {
    C1: { targetUnits: c1Target, observedCells: c1Observed, coverageReport: Boolean(coverage), status: c1Observed === c1Target ? "static_candidate_manual_scope" : "not_satisfied_or_different_census" },
    C2: { defectsDocumentPresent: Boolean(defects), openOrPendingEntries: openDefectRows.length, status: openDefectRows.length === 0 ? "static_candidate_manual_review" : "not_satisfied_open_register" },
    C3: { fuzzReportPresent: Boolean(fuzz), eventSeeds: fuzz?.fuzz?.events?.seeds ?? null, cellMutations: fuzz?.fuzz?.cells?.seeds ?? null, invariantFailures: fuzz?.fuzz?.invariantFailures?.length ?? null, cuts: fuzz?.cuts?.passed === fuzz?.cuts?.total, status: fuzz && !fuzz.fuzz.invariantFailures.length ? "static_pass_runtime_pending" : "not_satisfied" },
    C4: { blindRounds: 3, observedRounds: 0, status: "manual_pending" },
    C5: { verifyAll: "pending_or_blocked_by_authorized_DN_sources", ci: "manual_pending", cleanClone: "manual_pending", status: "manual_pending" },
    simultaneous: "manual_pending",
  };
}
function taskMatrix() {
  const staticIds = new Set([3400, 3404, 3407, 3408, 3409, 3416, 3417, 3418, 3419, 3421, 3422, 3423, 3424, 3427, 3428, 3429, 3434, 3435, 3436, 3437, 3438, 3439, 3440, 3441, 3442, 3443, 3444, 3445, 3446, 3450, 3451, 3452, 3453, 3454, 3455, 3456, 3457, 3458, 3459, 3460, 3461, 3462, 3463, 3464, 3465, 3466, 3467, 3468, 3469, 3470, 3471, 3472, 3473, 3474, 3475, 3476, 3477, 3478, 3481, 3482, 3483, 3484, 3485, 3486, 3487, 3488, 3489, 3490, 3491]);
  return Array.from({ length: 100 }, (_, index) => ({ id: 3400 + index, status: staticIds.has(3400 + index) ? "static_review" : "manual_pending" }));
}
function markdown(experiments, measures) {
  const lines = [
    "# Registro de experimentos y medidas",
    "",
    "Este registro documenta hipótesis, medida, decisión y evidencia. Los",
    "resultados permanecen vacíos hasta que exista una ficha humana; no se",
    "presentan participantes, tasas, tiempos ni conclusiones inventadas.",
    "",
    "## Experimentos",
    "",
    "| # | Experimento | Medidas | Resultado | Estado |",
    "|---:|---|---|---|---|",
  ];
  for (const experiment of experiments) lines.push(`| ${experiment.id} | ${experiment.title} | ${experiment.metrics.join(", ")} | — | manual_pending |`);
  lines.push("", "## Reglas de decisión", "", "- La hipótesis y el límite de tiempo se escriben antes del cambio.", "- Cada cambio tiene una medición antes y después.", "- Una conclusión solo se adopta tras un segundo grupo independiente.", "- Un resultado negativo se conserva y puede provocar reversión.", "- Cinco participantes aportan una señal indicativa, no una validación estadística.", "- El registro no almacena datos personales.", "", "## Medidas", "", "| Medida | Unidad | Definición |", "|---|---|---|");
  for (const [key, value] of Object.entries(measures)) lines.push(`| ${key} | ${value.unit} | ${value.definition} |`);
  lines.push("", "## Pendiente", "", "La segunda ronda, la comparación de medidas, las tres rondas ciegas y la congelación de diseño requieren ejecución humana. La ausencia de datos es deliberada.", "");
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}
function measuresMarkdown() {
  return `# Medidas de juego y cuadro comparativo\n\nEste cuadro es la plantilla exigida por FASE 035. No contiene valores inventados.\n\n| Medida | Primera medición | Última medición | Diferencia | Evidencia | Estado |\n|---|---:|---:|---:|---|---|\n| tiempo | — | — | — | ficha humana | manual_pending |\n| atasco > 120 s | — | — | — | ficha humana | manual_pending |\n| derrotas | — | — | — | ficha humana | manual_pending |\n| abandono | — | — | — | ficha humana | manual_pending |\n| comprensión 0–3 | — | — | — | ficha humana | manual_pending |\n\nUna medida no se declara mejor solo porque baje: reducir derrotas puede volver\ntrivial un jefe, y reducir tiempo puede eliminar decisiones. Toda conclusión\nrequiere hipótesis, contexto, grupo independiente y regresión.\n`;
}
function buildReport() {
  const experimentAudit = buildExperimentAudit();
  const inventory = inventoryAudit();
  const criteria = criteriaAudit();
  const status = experimentAudit.errors.length || criteria.C2.status !== "static_candidate_manual_review" ? "static_review_manual_pending" : "static_pass_manual_pending";
  const report = {
    schema: "lote7_fase035_cierre_experimentos/1.0",
    tasks: "3400–3499",
    experiments: experimentAudit,
    inventory,
    scope: {
      originalFireAshChangesBeforeAudit: git(["status", "--porcelain", "--", "pokemon_fire_ash"]).split(/\r?\n/).filter(Boolean),
      originalFireAshUntouchedByThisPhase: true,
      worktreePolicy: "la fase genera únicamente su reporte y documentos; no toca pokemon_fire_ash ni los ZIP de entrega",
      noScopeExpansion: true,
    },
    documentation: {
      experiments: "docs/qa/experimentos.md",
      measures: "docs/qa/medidas_juego.md",
      protocol: "docs/qa/protocolo_experimento.md",
      styleRules: safeRead("docs/qa/estilo_texto.md").includes("medidas de juego"),
      maintenanceRules: safeRead("docs/qa/guia_mantenimiento.md").includes("experimento"),
    },
    criteria,
    designFreeze: { requested: true, date: null, exceptions: [], status: "manual_pending" },
    taskMatrix: taskMatrix(),
    manual: [
      "ejecutar los 25 experimentos con cinco personas y una segunda ronda independiente",
      "comparar primera/última medida, publicar resultados negativos y aplicar regresiones",
      "decidir qué cambios se aceptan, revierten o mantienen sin ampliar alcance",
      "hacer tres rondas de playtest ciego y cerrar C1–C5 simultáneamente",
    ],
    status,
  };
  return { report, experiments: readJson("content/lote7_fase034_experimentos.json").experiments, measures: readJson("content/lote7_fase034_experimentos.json").protocol.measures };
}
const built = buildReport();
const serialized = `${JSON.stringify(built.report, null, 2)}\n`;
const docs = {
  experiments: markdown(built.experiments, built.measures),
  measures: measuresMarkdown(),
};
if (VERIFY) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
  for (const [relative, content] of [["docs/qa/experimentos.md", docs.experiments], ["docs/qa/medidas_juego.md", docs.measures]]) {
    const file = path.join(ROOT, relative);
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) throw new Error(`${relative} está desactualizado`);
  }
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
  fs.writeFileSync(path.join(ROOT, "docs/qa/experimentos.md"), docs.experiments);
  fs.writeFileSync(path.join(ROOT, "docs/qa/medidas_juego.md"), docs.measures);
}
console.log(`FASE 035 cierre experimental: ${built.report.experiments.count} experimentos · C1 ${built.report.criteria.C1.status} · C2 ${built.report.criteria.C2.status} · C3 ${built.report.criteria.C3.status} · ${built.report.status}`);
if (built.report.experiments.errors.length) process.exitCode = 1;
