import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Núcleo pequeño y determinista para la instrumentación de FASE 028.
 *
 * No intenta emular Game.exe: ofrece el protocolo que usarán los adaptadores
 * del motor y una implementación segura para fixtures. Todo estado se clona,
 * los guardados se escriben solo bajo el directorio de pruebas y cada fallo
 * conserva mapa/evento/comando. Esto permite probar el orquestador sin meter
 * un headless falso dentro del juego publicado.
 */
export const BOX = Object.freeze({ columns: 53, lines: 2 });
export const INPUTS = new Set(["up", "down", "left", "right", "action", "cancel", "menu", "run"]);

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}
export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function digest(value) {
  return crypto.createHash("sha256").update(stable(value)).digest("hex");
}
export function assertSafePath(root, candidate) {
  const base = path.resolve(root);
  const file = path.resolve(candidate);
  if (file !== base && !file.startsWith(`${base}${path.sep}`)) throw new Error(`ruta fuera del sandbox: ${file}`);
  return file;
}

export function makeReplayHarness({ sandbox, initialState = {} } = {}) {
  const root = path.resolve(sandbox ?? process.cwd());
  fs.mkdirSync(root, { recursive: true });
  const run = ({ state = initialState, inputs = [], map = "fixture" } = {}) => {
    const next = clone(state);
    const trace = [];
    for (const input of inputs) {
      if (!INPUTS.has(input)) throw new Error(`entrada no permitida: ${input}`);
      trace.push({ input, map, state: digest(next) });
      if (input === "up") next.y = Math.max(0, Number(next.y ?? 0) - 1);
      if (input === "down") next.y = Number(next.y ?? 0) + 1;
      if (input === "left") next.x = Math.max(0, Number(next.x ?? 0) - 1);
      if (input === "right") next.x = Number(next.x ?? 0) + 1;
      if (input === "action") next.actions = Number(next.actions ?? 0) + 1;
    }
    return { state: next, trace, savePath: null, writesRealSaves: false };
  };
  const loadSave = (file) => {
    const safe = assertSafePath(root, file);
    return JSON.parse(fs.readFileSync(safe, "utf8"));
  };
  const writeFixtureSave = (name, state) => {
    if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) throw new Error(`nombre de fixture inseguro: ${name}`);
    const file = assertSafePath(root, path.join(root, name));
    fs.writeFileSync(file, `${JSON.stringify(clone(state), null, 2)}\n`);
    return file;
  };
  return { run, loadSave, writeFixtureSave, root };
}

function key(x, y) { return `${x},${y}`; }
export function walkMap({ width, height, passable = () => true, start = [0, 0] }) {
  const reachable = new Set();
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    const k = key(x, y);
    if (x < 0 || y < 0 || x >= width || y >= height || reachable.has(k) || !passable(x, y)) continue;
    reachable.add(k);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const all = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (passable(x, y)) all.push(key(x, y));
  return { reachable: [...reachable].sort(), unreachable: all.filter((cell) => !reachable.has(cell)).sort(), coverage: all.length ? reachable.size / all.length : 1 };
}

export function executeEvents(events, { state = {}, map = 0 } = {}) {
  const next = clone(state);
  const trace = [];
  const errors = [];
  const ordered = [...events].sort((a, b) => Number(a.conditionPriority ?? 0) - Number(b.conditionPriority ?? 0));
  for (const event of ordered) {
    for (const [index, command] of (event.commands ?? []).entries()) {
      const context = { map, event: event.id ?? event.name ?? "?", command: index, op: command.op };
      try {
        if (command.op === "setFlag") next.flags = { ...(next.flags ?? {}), [command.id]: Boolean(command.value) };
        else if (command.op === "setVariable") next.variables = { ...(next.variables ?? {}), [command.id]: command.value };
        else if (command.op === "dialogue") trace.push({ ...context, text: String(command.text ?? "") });
        else if (command.op === "wait") trace.push({ ...context, wait: Number(command.frames ?? 0) });
        else if (command.op === "throw") throw new Error(command.message ?? "fixture exception");
        else if (command.op !== "end") throw new Error(`comando desconocido: ${command.op}`);
      } catch (error) {
        errors.push({ ...context, error: String(error.message ?? error) });
      }
    }
  }
  return { state: next, trace, errors, controlReturned: true, order: ordered.map((event) => event.id ?? event.name) };
}

export function dialogueOracle(texts, { columns = BOX.columns, lines = BOX.lines, language = "es" } = {}) {
  const findings = [];
  const english = /\b(?:the|and|you|your|choose|continue|press|error|cancel)\b/i;
  for (const [index, raw] of texts.entries()) {
    const text = String(raw ?? "");
    if (!text.trim()) findings.push({ index, type: "empty" });
    const rendered = text.replace(/\\(?:sp|c|v)\[[^\]]*\]/g, "");
    const rows = rendered.split(/\\n|\n/);
    if (rows.some((row) => row.length > columns)) findings.push({ index, type: "overflow", max: Math.max(...rows.map((row) => row.length)) });
    if (rows.length > lines) findings.push({ index, type: "three-lines", rows: rows.length });
    if (/\b[A-Za-z]{2,}\b/.test(rendered) && language === "es" && english.test(rendered)) findings.push({ index, type: "english", text: rendered.slice(0, 80) });
    if (/[A-Za-z]$/.test(rendered) && /[¿¡]/.test(rendered) === false && /\?$/.test(rendered)) findings.push({ index, type: "missing-opening-sign" });
  }
  return { ok: findings.length === 0, findings };
}

export function injectState(base, { flags = {}, variables = {}, inventory = [], team = [] } = {}) {
  const next = clone(base);
  next.flags = { ...(next.flags ?? {}), ...clone(flags) };
  next.variables = { ...(next.variables ?? {}), ...clone(variables) };
  next.inventory = clone(inventory);
  next.team = clone(team);
  return next;
}

export function mergeCoverage(...records) {
  const maps = new Set(), events = new Set(), dialogues = new Set(), battles = new Set();
  for (const record of records) {
    for (const item of record.maps ?? []) maps.add(String(item));
    for (const item of record.events ?? []) events.add(String(item));
    for (const item of record.dialogues ?? []) dialogues.add(String(item));
    for (const item of record.battles ?? []) battles.add(String(item));
  }
  return {
    maps: [...maps].sort(), events: [...events].sort(), dialogues: [...dialogues].sort(), battles: [...battles].sort(),
  };
}

export function compareFrames(before, after, { ignored = new Set() } = {}) {
  if (before.length !== after.length) return { equal: false, differences: [{ index: -1, type: "size" }] };
  const differences = [];
  for (let index = 0; index < before.length; index++) if (before[index] !== after[index] && !ignored.has(index)) differences.push({ index, before: before[index], after: after[index] });
  return { equal: differences.length === 0, differences };
}

export function stateOracle(before, after) {
  const findings = [];
  const checkUnique = (name, values) => {
    const seen = new Set();
    for (const value of values ?? []) {
      const id = value.id ?? value;
      if (seen.has(id)) findings.push({ type: `duplicate-${name}`, id });
      seen.add(id);
    }
  };
  checkUnique("item", after.inventory);
  checkUnique("badge", after.badges);
  for (const [key_, value] of Object.entries(before.counters ?? {})) {
    if (Number(after.counters?.[key_] ?? 0) < Number(value)) findings.push({ type: "counter-reset", key: key_, before: value, after: after.counters?.[key_] });
  }
  for (const [key_, value] of Object.entries(after.flags ?? {})) if (value === "partial") findings.push({ type: "partial-flag", key: key_ });
  return { ok: findings.length === 0, findings };
}

export function routeMaps(graph, start) {
  const seen = new Set([String(start)]);
  const queue = [String(start)];
  while (queue.length) for (const next of graph[queue.shift()] ?? []) if (!seen.has(String(next))) { seen.add(String(next)); queue.push(String(next)); }
  const all = new Set(Object.keys(graph).map(String));
  for (const next of Object.values(graph).flat()) all.add(String(next));
  return { reachable: [...seen].sort(), unreachable: [...all].filter((id) => !seen.has(id)).sort() };
}

export function sceneMeter(samples, { budgetSeconds = 8 } = {}) {
  return samples.map((sample) => ({ ...sample, overBudget: Number(sample.seconds) > budgetSeconds, blocked: Boolean(sample.blocked) }));
}

export function exceptionRecord(error, context) {
  return { ...context, message: String(error?.message ?? error), stack: String(error?.stack ?? "").split("\n").slice(0, 4) };
}

export function compareStates(left, right) {
  const keys = new Set([...Object.keys(left ?? {}), ...Object.keys(right ?? {})]);
  const differences = [];
  for (const key_ of [...keys].sort()) if (stable(left?.[key_]) !== stable(right?.[key_])) differences.push({ key: key_, left: left?.[key_], right: right?.[key_] });
  return { equal: differences.length === 0, differences };
}

export function idempotence(apply, value) {
  const first = apply(clone(value));
  const second = apply(clone(first));
  return { before: digest(value), afterFirst: digest(first), afterSecond: digest(second), stable: digest(first) === digest(second), value: second };
}

export function runSelfTest() {
  const replay = makeReplayHarness({ sandbox: fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", "fire-ash-harness-")), initialState: { x: 1, y: 1 } });
  const result = replay.run({ inputs: ["right", "action"] });
  assert.equal(result.state.x, 2);
  assert.equal(result.writesRealSaves, false);
  const walk = walkMap({ width: 3, height: 2, start: [0, 0], passable: (x, y) => !(x === 1 && y === 0) });
  assert.deepEqual(walk.unreachable, [], "el bot debe cubrir el fixture transitable");
  const events = executeEvents({
    0: "unused",
  } ? [{ id: "E1", conditionPriority: 1, commands: [{ op: "setFlag", id: "A", value: true }, { op: "dialogue", text: "Hola" }, { op: "end" }] }, { id: "E2", conditionPriority: 2, commands: [{ op: "throw", message: "sembrado" }] }] : []);
  assert.equal(events.controlReturned, true);
  assert.equal(events.errors[0].event, "E2");
  assert.equal(dialogueOracle(["Hola\\nMundo"]).ok, true);
  assert.equal(dialogueOracle(["the error"]).ok, false);
  const injected = injectState({}, { flags: { F1: true }, variables: { V1: 4 } });
  assert.equal(injected.flags.F1, true);
  assert.equal(compareFrames([0, 1, 2], [0, 1, 3]).differences.length, 1);
  assert.equal(stateOracle({ counters: { x: 2 } }, { counters: { x: 1 }, inventory: ["potion", "potion"] }).ok, false);
  assert.deepEqual(routeMaps({ 1: [2], 2: [], 3: [] }, 1).unreachable, ["3"]);
  assert.equal(sceneMeter([{ id: "slow", seconds: 9 }])[0].overBudget, true);
  assert.equal(compareStates({ a: 1 }, { a: 1 }).equal, true);
  assert.equal(idempotence((value) => ({ ...value, normalized: true }), {}).stable, true);
  return { assertions: 13, status: "pass" };
}
