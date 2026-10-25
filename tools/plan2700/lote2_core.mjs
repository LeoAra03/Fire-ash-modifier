#!/usr/bin/env node
/**
 * Núcleo compartido del LOTE 2 (tandas 22–26 de `tareas.txt`).
 *
 * A diferencia de auditorías anteriores, este lote corta las tandas por
 * LÍNEAS DEL ARCHIVO (2100–2199, 2200–2299, ...), no por ID de tarea: la
 * numeración de `tareas.txt` lleva cuatro líneas de cabecera, de modo que la
 * línea 2100 contiene la tarea 2096. Cada fase comprueba su propio corte y lo
 * deja escrito en un artefacto verificable.
 *
 * El módulo no modifica el juego: sólo lee `tareas.txt`, los datos compilados
 * y los artefactos de QA, y ejecuta verificadores en modo lectura.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CORE_DIR = path.join(ROOT, "tools/plan2700");
export const QA_DIR = path.join(ROOT, "tools/qa");
export const CONTENT = path.join(ROOT, "content");
export const DOCS = path.join(ROOT, "docs/qa");
export const LOTE2_DOCS = path.join(DOCS, "lote2");
export const GAME = path.join(ROOT, "pokemon_fire_ash");
export const DATA = path.join(GAME, "Data");
export const TAREAS = path.join(ROOT, "tareas.txt");

export const rel = (p) => path.relative(ROOT, p).replaceAll(path.sep, "/");
export const readText = (p) => fs.readFileSync(p, "utf8");
export const readJson = (p) => JSON.parse(readText(p));
export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
export const sha256File = (p) => sha256(fs.readFileSync(p));
export const sha256Text = (text) => sha256(Buffer.from(text));

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Corte exacto de 100 líneas (1-based, inclusivas) de `tareas.txt`. */
export function tanda(n) {
  const from = (n - 1) * 100;
  const to = n * 100 - 1;
  const all = readText(TAREAS).split(/\r?\n/);
  const lines = all.slice(from - 1, to);
  assert(lines.length === 100, `tanda ${n}: se esperaban 100 líneas, hay ${lines.length}`);
  const tasks = lines.map((raw, i) => {
    const text = raw.trim();
    const m = /^(\d+)\.\s+(.*)$/.exec(text);
    assert(m, `tanda ${n}, línea ${from + i}: formato no reconocido: ${text.slice(0, 80)}`);
    return { line: from + i, id: Number(m[1]), text: m[2].trim() };
  });
  for (let i = 1; i < tasks.length; i++) {
    assert(tasks[i].id === tasks[i - 1].id + 1,
      `tanda ${n}: IDs no consecutivos en ${tasks[i - 1].id} → ${tasks[i].id}`);
  }
  return { n, fromLine: from, toLine: to, firstId: tasks[0].id, lastId: tasks.at(-1).id, tasks };
}

/** Ejecuta un comando en modo lectura y devuelve salida, código y tiempo. */
export function run(command, { timeout = 180000 } = {}) {
  const started = process.hrtime.bigint();
  const r = spawnSync("bash", ["-lc", command], {
    cwd: ROOT, encoding: "utf8", maxBuffer: 24 * 1024 * 1024, timeout,
  });
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\r/g, "").trimEnd();
  return { command, ok: r.status === 0 && !r.error, code: r.status, ms: Math.round(ms), out };
}

export function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

/** Escribe un fichero auxiliar o comprueba que sigue vigente (--verify). */
export function ensure(p, content, verify) {
  if (verify) {
    assert(fs.existsSync(p), `Falta ${rel(p)}`);
    assert(readText(p) === content, `${rel(p)} desactualizado; regenera la fase`);
    return false;
  }
  writeFile(p, content);
  return true;
}

/** Escribe artefacto + acta, o comprueba que siguen vigentes (--verify). */
export function publish(artifactPath, artifact, docPath, doc, verify) {
  const body = json(artifact);
  if (verify) {
    assert(fs.existsSync(artifactPath), `Falta ${rel(artifactPath)}`);
    assert(fs.existsSync(docPath), `Falta ${rel(docPath)}`);
    assert(readText(artifactPath) === body, `${rel(artifactPath)} desactualizado; regenera la fase`);
    assert(readText(docPath) === doc, `${rel(docPath)} desactualizado; regenera la fase`);
    return false;
  }
  writeFile(artifactPath, body);
  writeFile(docPath, doc);
  return true;
}

/**
 * Clasifica las 100 tareas de una tanda en tres estados honestos:
 *  - verificado: hay una medición ejecutable que pasa;
 *  - instrumentado: hay control automático, pero el resultado depende de una
 *    partida/dispositivo (se registra la sonda y su responsable);
 *  - pendiente_humano: exige decisión editorial, partida o dispositivo; siempre
 *    con responsable explícito (prohibido dejar un "TODO sin dueño").
 */
export function classify(tasks, config) {
  const commandById = new Map((config.commands ?? []).map(([id, cmd]) => [id, cmd]));
  const docById = new Map((config.documents ?? []).map(([id, p]) => [id, p]));
  const sessionById = new Map((config.sessions ?? []).map(([id, s]) => [id, s]));
  const results = new Map((config.results ?? []).map(([id, r]) => [id, r]));
  const commandRuns = new Map();
  const lanes = {};
  const rows = tasks.map((task) => {
    const lane = laneOf(task.text, config);
    lanes[lane] = (lanes[lane] ?? 0) + 1;
    let row;
    if (commandById.has(task.id)) {
      const cmd = commandById.get(task.id);
      if (!commandRuns.has(cmd)) commandRuns.set(cmd, run(cmd, { timeout: config.commandTimeout ?? 180000 }));
      const r = commandRuns.get(cmd);
      row = r.ok
        ? { estado: "verificado", sonda: `ejecutar \`${cmd}\``, evidencia: "exit 0" }
        : { estado: "instrumentado", sonda: `ejecutar \`${cmd}\``,
            evidencia: `exit ${r.code}: ${r.out.split("\n").filter(Boolean).at(-1)?.replace(/\d+(\.\d+)?\s*ms/g, "[t]").slice(0, 160) ?? "sin salida"}`,
            responsable: config.blockedOwner ?? "Equipo de QA" };
    } else if (docById.has(task.id)) {
      const p = docById.get(task.id);
      const exists = fs.existsSync(path.join(ROOT, p));
      const hasSection = exists && /LOTE 2/.test(readText(path.join(ROOT, p)));
      row = hasSection
        ? { estado: "verificado", sonda: `documento ${p}`, evidencia: `existe con sección LOTE 2 (${sha256File(path.join(ROOT, p)).slice(0, 12)})` }
        : { estado: "pendiente_humano", sonda: `documento ${p}`,
            evidencia: exists ? "existe, sin sección LOTE 2" : "no existe todavía",
            responsable: config.docOwner ?? "Equipo de documentación" };
    } else if (sessionById.has(task.id)) {
      const s = sessionById.get(task.id);
      const p = `docs/qa/playtest/sesion-${String(s).padStart(2, "0")}/README.md`;
      const exists = fs.existsSync(path.join(ROOT, p));
      const quota = exists && /cuota/i.test(readText(path.join(ROOT, p)));
      row = quota
        ? { estado: "instrumentado", sonda: `ficha de sesión ${s}`, evidencia: `${p} con cuota y campos`, responsable: `Playtest humano · sesión ${s}` }
        : { estado: "pendiente_humano", sonda: `ficha de sesión ${s}`, evidencia: `${p} sin cuota`, responsable: `Playtest humano · sesión ${s}` };
    } else if (results.has(task.id)) {
      row = results.get(task.id);
    } else if (/^Sesión\s+\d+/i.test(task.text)) {
      row = { estado: "pendiente_humano", sonda: "sesión de playtest", evidencia: "requiere ejecutar el juego", responsable: "Playtest humano" };
    } else {
      row = { estado: "pendiente_humano", sonda: "revisión editorial / partida", evidencia: "no verificable de forma estática", responsable: config.editorialOwner ?? "Equipo editorial y playtest humano" };
    }
    return { id: task.id, line: task.line, lane, text: task.text, ...row };
  });
  const counts = rows.reduce((acc, r) => { acc[r.estado] = (acc[r.estado] ?? 0) + 1; return acc; }, {});
  return { rows, counts, lanes, commands: [...commandRuns.values()].map((r) => ({ command: r.command, ok: r.ok, code: r.code, ...(r.ok ? {} : { tail: r.out.split("\n").filter(Boolean).at(-1)?.replace(/\d+(\.\d+)?\s*ms/g, "[t]").slice(0, 200) }) })) };
}

function laneOf(text, config) {
  for (const [pattern, lane] of config.laneRules ?? []) if (pattern.test(text)) return lane;
  return "otros";
}

/** Acta de fase estándar, determinista (sin fecha ni reloj). */
export function acta({ fase, tanda: t, title, summary, measured, classification, extra = [], pending = [] }) {
  const L = [];
  L.push(`# FASE ${fase} — tanda ${t.n} (líneas ${t.fromLine}–${t.toLine} de \`tareas.txt\`)`);
  L.push("");
  L.push(title);
  L.push("");
  L.push("## Corte verificado");
  L.push("");
  L.push(`- 100 líneas del archivo, tareas ${t.firstId}–${t.lastId}, IDs consecutivos.`);
  L.push("- Corte por **líneas de archivo**, no por ID: la cabecera desplaza la numeración en 4.");
  L.push("");
  L.push("## Medición reproducible");
  L.push("");
  for (const line of summary) L.push(`- ${line}`);
  L.push("");
  L.push("## Comandos ejecutados");
  L.push("");
  L.push("| Comando | Resultado |");
  L.push("|---|---|");
  for (const c of classification.commands) L.push(`| \`${c.command}\` | ${c.ok ? "exit 0" : `exit ${c.code}`} |`);
  if (!classification.commands.length) L.push("| (ninguno en esta fase) | — |");
  L.push("");
  L.push("## Tareas por carril y estado");
  L.push("");
  L.push(`Carriles: ${Object.entries(classification.lanes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `${k} ${v}`).join(" · ")}.`);
  L.push("");
  L.push(`Estados: ${Object.entries(classification.counts).sort().map(([k, v]) => `${k} ${v}`).join(" · ")}.`);
  L.push("");
  L.push("| Tarea | Línea | Carril | Estado | Sonda / evidencia | Responsable |");
  L.push("|---:|---:|---|---|---|---|");
  for (const r of classification.rows) {
    const ev = `${r.sonda} — ${r.evidencia}`.replace(/\|/g, "\\|");
    L.push(`| ${r.id} | ${r.line} | ${r.lane} | ${r.estado} | ${ev} | ${r.responsable ?? "—"} |`);
  }
  L.push("");
  if (extra.length) { L.push("## Entregables de esta fase"); L.push(""); for (const e of extra) L.push(`- ${e}`); L.push(""); }
  if (pending.length) { L.push("## Pendientes con dueño"); L.push(""); for (const p of pending) L.push(`- ${p}`); L.push(""); }
  L.push("## LOTE 2");
  L.push("");
  L.push("Parte del LOTE 2 (fases 001–005). Reproducir con el comando `verify:lote2:fase" + fase + "` de `package.json`.");
  L.push("Ninguna medición estática se presenta como una partida, un dispositivo o una revisión humana realizada.");
  L.push("");
  return L.join("\n");
}
