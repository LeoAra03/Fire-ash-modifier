#!/usr/bin/env node
/**
 * Reconstrucción canónica. Orquesta los instaladores existentes, en este orden
 * y sin reescribir su lógica:
 *
 *   1. apply_expansion_multiversal
 *   2. apply_canon_arceus
 *   3. apply_tone_safety_fix
 *   4. apply_transition_safety_fix
 *
 * Antes de cada paso comprueba precondiciones. Después corre el --verify del
 * propio instalador. Si alguno falla, se detiene. Al final corre
 * ruby_syntax_check, audit_all_flags y scripts_dangling_calls.
 *
 * Los dos últimos instaladores son idempotentes: si el parche y los artefactos
 * ya coinciden, no regeneran el ZIP. Quedó anotado en sus cabeceras.
 *
 * Uso:
 *   node tools/reconstruccion_canonica.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "docs", "RECONSTRUCCION_CANONICA.md");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const CORRECTED = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
const text = (value) => (value instanceof RString ? value.text : String(value ?? ""));

function runNode(script, args = []) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    script,
    args,
    code: result.status ?? 1,
    signal: result.signal || "",
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error.message || result.error) : "",
    ms: Date.now() - started,
  };
}

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return (result.stdout || "") + (result.stderr || "");
}

function statusSet() {
  return new Set(git(["status", "--short"]).split("\n").map((line) => line.trimEnd()).filter(Boolean));
}

function sectionNames(file) {
  if (!fs.existsSync(file)) return [];
  const scripts = marshalLoad(fs.readFileSync(file));
  return scripts.filter(Boolean).map((row) => text(row[1]));
}

function hasSection(file, name) {
  return sectionNames(file).includes(name);
}

function inflateSection(file, name) {
  const scripts = marshalLoad(fs.readFileSync(file));
  const row = scripts.find((entry) => entry && text(entry[1]) === name);
  if (!row) return "";
  return zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
}

const steps = [
  {
    id: "expansion_multiversal",
    title: "Expansión Multiversal",
    script: "tools/apply_expansion_multiversal.mjs",
    precondition() {
      const missing = ["pokemon_fire_ash/Data/MapInfos.rxdata", "content/expansion_multiversal.json"]
        .filter((file) => !fs.existsSync(path.join(ROOT, file)));
      if (missing.length) return { ok: false, detail: `faltan ${missing.join(", ")}` };
      return { ok: true, detail: "Data del juego y el plano de la expansión están presentes. No exige switches previos: este paso es el que instala los sellos base." };
    },
  },
  {
    id: "canon_arceus",
    title: "Canon de Arceus",
    script: "tools/apply_canon_arceus.mjs",
    precondition() {
      const check = runNode("tools/apply_expansion_multiversal.mjs", ["--verify"]);
      if (check.code !== 0) {
        return {
          ok: false,
          detail: "apply_expansion_multiversal --verify no pasa; el canon no puede cerrar puertas sobre sellos que la expansión no instaló.",
          evidence: check,
        };
      }
      return { ok: true, detail: "La expansión verifica sus sellos, grietas y retornos. El canon puede exigir el duelo encima de esa base.", evidence: check };
    },
  },
  {
    id: "tone_safety",
    title: "Protección de Tone",
    script: "tools/apply_tone_safety_fix.mjs",
    precondition() {
      if (!fs.existsSync(CORRECTED)) return { ok: false, detail: "falta Scripts_corregido/Scripts.rxdata" };
      const names = sectionNames(CORRECTED);
      const missing = ["Game_Screen", "Game_Picture", "PokeMod_CanonArceus"].filter((name) => !names.includes(name));
      if (missing.length) return { ok: false, detail: `Scripts_corregido no tiene ${missing.join(", ")} (el canon debe ir antes para no perder la sección)` };
      return { ok: true, detail: "Game_Screen, Game_Picture y PokeMod_CanonArceus están en el Scripts.rxdata corregido." };
    },
  },
  {
    id: "transition_safety",
    title: "Protección de transition_name",
    script: "tools/apply_transition_safety_fix.mjs",
    precondition() {
      if (!hasSection(CORRECTED, "Scene_Map")) return { ok: false, detail: "falta la sección Scene_Map" };
      let screen = "";
      try { screen = inflateSection(CORRECTED, "Game_Screen"); } catch { /* el verify de tono ya lo habría frenado */ }
      if (!screen.includes("module PokeModToneSafety")) {
        return { ok: false, detail: "Game_Screen todavía no tiene PokeModToneSafety; la transición no debe reempaquetar un Scripts.rxdata sin el parche de tono." };
      }
      return { ok: true, detail: "Scene_Map existe y el parche de tono ya está en Game_Screen." };
    },
  },
];

const qa = [
  { id: "ruby_syntax_check", script: "tools/qa/ruby_syntax_check.mjs", args: [] },
  { id: "audit_all_flags", script: "tools/audit_all_flags.mjs", args: [] },
  { id: "scripts_dangling_calls", script: "tools/qa/scripts_dangling_calls.mjs", args: [] },
];

function fence(text) {
  const body = text && text.trim() ? text.trimEnd() : "(sin salida)";
  return `\`\`\`\n${body}\n\`\`\``;
}

function auditCollisions(result) {
  const match = result.stdout.match(/\{[\s\S]*?\n\}/);
  if (!match) return { ok: false, count: null, detail: "no se pudo leer el resumen JSON de audit_all_flags" };
  try {
    const summary = JSON.parse(match[0]);
    const count = Number(summary.customConflicts);
    return { ok: count === 0, count, detail: `customConflicts=${count}` };
  } catch (error) {
    return { ok: false, count: null, detail: `JSON ilegible: ${error.message}` };
  }
}

const report = [];
const startedAt = new Date().toISOString();
let failed = false;
const beforeAll = statusSet();

console.log("Reconstrucción canónica — orden fijo de 4 instaladores");
for (const step of steps) {
  console.log(`\n── ${step.title} ──`);
  const before = statusSet();
  const pre = step.precondition();
  console.log(`precondición: ${pre.ok ? "OK" : "FALLO"} — ${pre.detail}`);
  const record = { ...step, pre, apply: null, verify: null, changed: [] };
  if (!pre.ok) {
    failed = true;
    record.error = pre.detail;
    report.push(record);
    break;
  }
  record.apply = runNode(step.script);
  process.stdout.write(record.apply.stdout);
  process.stderr.write(record.apply.stderr);
  if (record.apply.code !== 0) {
    console.error(`✘ ${step.script} salió ${record.apply.code}`);
    failed = true;
    record.error = record.apply.error || `exit ${record.apply.code}`;
    record.changed = [...statusSet()].filter((line) => !before.has(line));
    report.push(record);
    break;
  }
  record.verify = runNode(step.script, ["--verify"]);
  process.stdout.write(record.verify.stdout);
  process.stderr.write(record.verify.stderr);
  record.changed = [...statusSet()].filter((line) => !before.has(line));
  if (record.verify.code !== 0) {
    console.error(`✘ ${step.script} --verify salió ${record.verify.code}`);
    failed = true;
    record.error = `verify exit ${record.verify.code}`;
    report.push(record);
    break;
  }
  console.log(`✔ ${step.title}: instalación y --verify OK (${record.apply.ms + record.verify.ms} ms)`);
  report.push(record);
}

const qaResults = [];
if (!failed) {
  console.log("\n── Verificadores finales ──");
  for (const check of qa) {
    const result = runNode(check.script, check.args);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    let ok = result.code === 0;
    let note = `exit ${result.code}`;
    if (check.id === "audit_all_flags") {
      const collisions = auditCollisions(result);
      ok = result.code === 0 && collisions.ok;
      note = collisions.detail;
      result.collisions = collisions;
    }
    qaResults.push({ ...check, result, ok, note });
    console.log(`${ok ? "✔" : "✘"} ${check.script} — ${note}`);
    if (!ok) failed = true;
  }
}

const afterAll = statusSet();
const changedAll = [...afterAll].filter((line) => !beforeAll.has(line));
const diffStat = git(["diff", "--stat"]);

const lines = [
  "# Reconstrucción canónica",
  "",
  `Inicio: ${startedAt}`,
  `Resultado: ${failed ? "FALLO" : "OK"}`,
  "",
  "Orden obligatorio: expansión multiversal, canon de Arceus, protección de `Tone.new`, protección de `transition_name`.",
  "",
  "Idempotencia: `apply_tone_safety_fix.mjs` y `apply_transition_safety_fix.mjs` no reescriben ni regeneran el ZIP si el parche ya está y los tres artefactos coinciden byte a byte. `apply_expansion_multiversal.mjs` y `upsertEvents` reutilizan el ID del evento del mismo nombre; antes cada pasada lo incrementaba.",
  "",
];
for (const step of report) {
  lines.push(`## ${step.title}`, "");
  lines.push(`- Script: \`${step.script}\``);
  lines.push(`- Precondición: ${step.pre.ok ? "OK" : "FALLO"} — ${step.pre.detail}`);
  if (step.apply) lines.push(`- Instalación: exit ${step.apply.code} en ${step.apply.ms} ms`);
  if (step.verify) lines.push(`- Verificación: exit ${step.verify.code} en ${step.verify.ms} ms`);
  if (step.error) lines.push(`- Error: ${step.error}`);
  lines.push(`- Archivos tocados en este paso (git status nuevo respecto al inicio del paso): ${step.changed?.length || 0}`);
  if (step.changed?.length) lines.push("", ...step.changed.map((line) => `- \`${line}\``));
  if (step.pre.evidence) {
    lines.push("", "### Precondición — salida literal", "", fence(`${step.pre.evidence.stdout}\n${step.pre.evidence.stderr}`));
  }
  if (step.apply) lines.push("", "### Instalación — salida literal", "", fence(`${step.apply.stdout}\n${step.apply.stderr}\n${step.apply.error}`));
  if (step.verify) lines.push("", "### --verify — salida literal", "", fence(`${step.verify.stdout}\n${step.verify.stderr}\n${step.verify.error}`));
  lines.push("");
}
if (qaResults.length) {
  lines.push("## Verificadores finales", "");
  for (const check of qaResults) {
    lines.push(`### ${check.script}`, "", `- ${check.ok ? "OK" : "FALLO"} — ${check.note}`, "", fence(`${check.result.stdout}\n${check.result.stderr}\n${check.result.error}`), "");
  }
}
lines.push("## Diff resumido", "", "Cambios de git status aparecidos durante la orquestación:", "");
lines.push(...(changedAll.length ? changedAll.map((line) => `- \`${line}\``) : ["- Ninguno."]));
lines.push("", "```", diffStat.trimEnd() || "(sin diff de texto; los .rxdata se ven como binarios)", "```", "");
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, lines.join("\n"));
console.log(`\nInforme: docs/RECONSTRUCCION_CANONICA.md`);
process.exit(failed ? 1 : 0);
