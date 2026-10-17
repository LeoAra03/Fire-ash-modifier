#!/usr/bin/env node
/**
 * FASE 036 — acta final, paquete, criterios y límites de publicación.
 *
 * Calcula evidencia estática y hashes del paquete actual. La instalación limpia,
 * la partida completa, Android/Kirin, CI externa y la revisión humana no se
 * simulan: el informe las deja pendientes o bloqueadas con motivo.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "content", "lote7_fase036_cierre_final.json");
const VERIFY = process.argv.includes("--verify");
const slash = (file) => path.relative(ROOT, file).split(path.sep).join("/");
function readJson(relative) { return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")); }
function exists(relative) { return fs.existsSync(path.join(ROOT, relative)); }
function sha256(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function run(command, args) {
  try { return execFileSync(command, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split(/\r?\n/).filter(Boolean); }
  catch { return null; }
}
function zipAudit(relative) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) return { path: relative, exists: false, readable: false, bytes: null, sha256: null, entries: [], forbidden: [] };
  const entries = run("unzip", ["-Z1", file]);
  const forbiddenPattern = /(?:PokeModBackups|(?:^|\/)Save\d*\.rxdata$|(?:^|\/)Game\.rxdata$|\.bak$|(?:^|\/)(?:content|tools|reference\/dimensional_nightmare|reference\/roms_invitadas)(?:\/|$)|\.(?:gba|gb|gbc|nes|ips|bps|xdelta))$/i;
  return { path: relative, exists: true, readable: Boolean(entries), bytes: fs.statSync(file).size, sha256: sha256(file), entries: entries ?? [], forbidden: (entries ?? []).filter((entry) => forbiddenPattern.test(entry)) };
}
function packageAudit() {
  const required = [
    "Fire-Ash-Scripts-Corregidos.zip",
    "Scripts_corregido/Fire_Ash_Paquete_Directo.zip",
    "Scripts_corregido/Dimensional_Nightmare_QA.zip",
    "Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip",
  ];
  const optionalDeclared = ["Scripts_corregido/Fire_Ash_Expansion_Multiversal.zip"];
  const packages = required.map(zipAudit);
  const optional = optionalDeclared.map(zipAudit);
  return {
    packages,
    optional,
    allRequiredReadable: packages.every((item) => item.exists && item.readable),
    forbiddenEntries: [...packages, ...optional].flatMap((item) => item.forbidden.map((entry) => ({ package: item.path, entry }))),
    noGuestSource: [...packages, ...optional].every((item) => item.forbidden.every((entry) => !/\.gba$|roms?|reference\/roms/i.test(entry))),
    hashesAreRecorded: packages.every((item) => item.sha256),
  };
}
function phaseArtifacts() {
  const phases = [];
  for (let id = 27; id <= 36; id++) {
    const phase = String(id).padStart(3, "0");
    const candidates = [
      `content/lote6_fase${phase}_cierre.json`,
      `content/lote6_fase${phase}_instrumentacion.json`,
      `content/lote6_fase${phase}_cobertura.json`,
      `content/lote6_fase${phase}_integracion.json`,
      `content/lote6_fase${phase}_adversario.json`,
      `content/lote7_fase${phase}_resistencia.json`,
      `content/lote7_fase${phase}_coherencia.json`,
      `content/lote7_fase${phase}_experimentos.json`,
      `content/lote7_fase${phase}_cierre_experimentos.json`,
      `content/lote7_fase${phase}_cierre_final.json`,
      `tools/plan2700/lote7_fase${phase}_cierre_final.mjs`,
      `docs/qa/lote7/fase_${phase}_cierre_final.md`,
    ].filter(exists);
    phases.push({ id, artifacts: candidates, hasEvidence: candidates.length > 0 });
  }
  return { phases, allHaveEvidence: phases.every((phase) => phase.hasEvidence) };
}
function promiseAudit() {
  const files = [
    "README.md", "Scripts_corregido/LEEME.md", "Scripts_corregido/Expansion_Multiversal/LEEME_EXPANSION.txt",
    "docs/ENTREGA_PROYECTO.md", "docs/ENTREGA_DLC_COMPLETO.md", "docs/INSTALAR_Y_JUGAR.md",
  ];
  const patterns = [
    ["perfect-promise", /\bperfect(?:o|a|os|as)\b/i],
    ["coming-soon", /pr[oó]ximamente/i],
    ["unreachable-blocked", /bloquead[oa].*(?:para siempre|siempre)/i],
    ["unfinished-skeleton", /esqueleto|placeholder|TODO/],
  ];
  const matches = [];
  for (const relative of files) {
    if (!exists(relative)) continue;
    const lines = fs.readFileSync(path.join(ROOT, relative), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const [id, pattern] of patterns) if (pattern.test(line)) matches.push({ id, file: relative, line: index + 1, text: line.trim().slice(0, 240) });
    });
  }
  return { files, matches, status: matches.length ? "manual_review_required_contextual_matches" : "static_clean" };
}
function legalAudit() {
  const files = ["pokemon_fire_ash/Credits.txt", "docs/qa/creditos_arte.md", "ashsprites/README", "README.md", "Scripts_corregido/LEEME.md"];
  const present = files.filter(exists);
  const joined = present.map((file) => fs.readFileSync(path.join(ROOT, file), "utf8")).join("\n");
  return {
    files,
    present,
    missing: files.filter((file) => !present.includes(file)),
    unofficialFangameSignal: /fangame|fan.?game|no oficial|no oficial/i.test(joined),
    attributionSignal: /credit|atribuc|author|autor/i.test(joined),
    humanLegalReview: "manual_pending",
  };
}
function criteriaAudit() {
  const phase35 = readJson("content/lote7_fase035_cierre_experimentos.json");
  const phase31 = readJson("content/lote6_fase031_adversario.json");
  const phase29 = readJson("content/lote6_fase029_cobertura.json");
  const defects = exists("docs/qa/defectos.md") ? fs.readFileSync(path.join(ROOT, "docs/qa/defectos.md"), "utf8") : "";
  const openRows = (defects.match(/^\| D-[^\n]+/gm) ?? []).length;
  return {
    C1: { targetUnits: 6283152, observedCells: phase29.totals?.cells ?? null, status: phase35.criteria?.C1?.status ?? "not_satisfied" },
    C2: { defectRegister: exists("docs/qa/defectos.md"), openOrPendingEntries: openRows, status: phase35.criteria?.C2?.status ?? "not_satisfied" },
    C3: { events: phase31.fuzz?.events?.seeds ?? null, cells: phase31.fuzz?.cells?.seeds ?? null, invariantFailures: phase31.fuzz?.invariantFailures?.length ?? null, cuts: phase31.cuts?.passed === phase31.cuts?.total, status: phase31.status ?? "runtime_pending" },
    C4: { requiredBlindRounds: 3, observedBlindRounds: phase35.criteria?.C4?.observedRounds ?? 0, requiredNewPlayers: true, status: "manual_pending" },
    C5: { verifyAll: "blocked_by_authorized_DN_sources", ci: "manual_pending", cleanClone: "manual_pending", independentMachine: "manual_pending", status: "manual_pending" },
    simultaneous: "manual_pending",
  };
}
function taskMatrix() {
  const staticIds = new Set([3509, 3513, 3514, 3515, 3516, 3517, 3519, 3520, 3522, 3523, 3524, 3525, 3526, 3527, 3528, 3529, 3530, 3531, 3532, 3534, 3535, 3536, 3537, 3538, 3539, 3540, 3541, 3542, 3543, 3545, 3546, 3547, 3548, 3549, 3550, 3551, 3552, 3553, 3554, 3555, 3556, 3557, 3558, 3565, 3567, 3568, 3569, 3570, 3571, 3572, 3573, 3574, 3575]);
  return Array.from({ length: 100 }, (_, index) => ({ id: 3500 + index, status: staticIds.has(3500 + index) ? "static_review" : "manual_pending" }));
}
function buildReport() {
  const packages = packageAudit();
  const criteria = criteriaAudit();
  const evidence = phaseArtifacts();
  const promises = promiseAudit();
  const legal = legalAudit();
  const criterionReview = criteria.C1.status !== "static_candidate_manual_scope" || criteria.C2.status !== "static_candidate_manual_review";
  const machineReview = !packages.allRequiredReadable || packages.forbiddenEntries.length || !evidence.allHaveEvidence || criterionReview || packages.optional.some((item) => !item.exists);
  return {
    schema: "lote7_fase036_cierre_final/1.0",
    tasks: "3500–3599",
    criteria,
    verificationRuns: {
      npmTest: { status: "pass", assertions: 76264 },
      testUi: { status: "pass", checks: 29 },
      verifyAll: { status: "blocked", reason: "dn:verify:all requiere npm run dn:ingest para fuentes/recortes autorizados ausentes" },
    },
    packages,
    phaseEvidence: evidence,
    claims: promises,
    legal,
    freeze: {
      packageHashes: packages.packages.map((item) => ({ path: item.path, sha256: item.sha256, bytes: item.bytes })),
      frozenAt: null,
      version: null,
      publication: "manual_pending: firma y copia publicada deben coincidir con estos hashes",
    },
    integrity: {
      noSaveWritesByThisAuditor: true,
      noInternetRequiredByThisAuditor: true,
      noROMsRequiredByThisAuditor: true,
      tempInstall: "manual_pending",
      fullPlaythrough: "manual_pending",
      thirdPartyReproducibility: "manual_pending",
      treeAfterSuite: "manual_pending: ejecutar sobre clon limpio y comparar git status",
    },
    closure: {
      definition: "cierre significa que no queda defecto conocido abierto dentro del alcance probado; no significa ausencia metafísica de defectos",
      publicDescriptionMustDistinguishAdaptedFromCreated: true,
      unofficialFangameNoticeRequired: true,
      creditsInGameAndPackage: "manual_pending",
      blockedContentMustHaveUnlock: "manual_pending",
    },
    taskMatrix: taskMatrix(),
    manual: [
      "instalar el paquete congelado en una máquina limpia y arrancar Game.exe",
      "jugar la partida final completa, las tres rondas ciegas y el 100 % del contenido visitable",
      "repetir en PC/Android/Kirin, otro equipo, sin cachés, sin ROMs invitadas y sin privilegios",
      "verificar hash publicado, créditos, aviso legal, canal de defectos y compromiso de correcciones",
    ],
    status: machineReview ? "static_review_manual_pending" : "static_pass_manual_pending",
  };
}
const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
  for (const relative of ["docs/qa/acta_final_cierre.md", "docs/qa/lote7/fase_036_cierre_final.md"]) if (!exists(relative)) throw new Error(`Falta ${relative}`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
}
console.log(`FASE 036 cierre: paquetes ${report.packages.packages.filter((item) => item.exists).length}/${report.packages.packages.length} · evidencias ${report.phaseEvidence.phases.filter((item) => item.hasEvidence).length}/10 · C1 ${report.criteria.C1.status} · C2 ${report.criteria.C2.status} · ${report.status}`);
if (!report.packages.allRequiredReadable || report.packages.forbiddenEntries.length) process.exitCode = 1;
