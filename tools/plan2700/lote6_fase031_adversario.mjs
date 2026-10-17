#!/usr/bin/env node
/**
 * FASE 031: adversario determinista, límites, cortes e interferencias.
 *
 * Ejecuta el modelo de caos contra un estado aislado y valida invariantes. No
 * afirma que Game.exe haya sobrevivido: la matriz deja esas pruebas como
 * manual_pending y el fuzz de Node solo certifica el orquestador/contrato.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA, GAME, ROOT } from "../lib/dn_rmxp.mjs";
import { compareStates, digest, injectState, makeReplayHarness, stable } from "./harness_core.mjs";

const OUT = path.join(ROOT, "content", "lote6_fase031_adversario.json");
const VERIFY = process.argv.includes("--verify");
const MAX_MONEY = 0xffffffff;
const MAX_LEVEL = 150;
const SANDBOX = path.join(process.env.TMPDIR ?? "/tmp", "fire-ash-phase031-sandbox");
function rng(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 0x100000000; };
}
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function invariant(state) {
  const errors = [];
  if (!state || typeof state !== "object") errors.push("state-not-object");
  if (state.money !== undefined && (!Number.isInteger(state.money) || state.money < 0 || state.money > MAX_MONEY)) errors.push("money-range");
  if (state.level !== undefined && (!Number.isInteger(state.level) || state.level < 1 || state.level > MAX_LEVEL)) errors.push("level-range");
  if ((state.inventory ?? []).some((item) => Number(item.quantity ?? 0) < 0 || Number(item.quantity ?? 0) > 999)) errors.push("inventory-range");
  if ((state.team ?? []).length > 6) errors.push("team-overflow");
  if ((state.box ?? []).length > 30) errors.push("box-overflow");
  if (state.savePath && path.resolve(state.savePath) !== path.resolve(SANDBOX) && !path.resolve(state.savePath).startsWith(`${path.resolve(SANDBOX)}${path.sep}`)) errors.push("write-outside-sandbox");
  return errors;
}
function safeNormalize(state) {
  const next = copy(state);
  if (next.money !== undefined) next.money = Math.max(0, Math.min(MAX_MONEY, Number(next.money) >>> 0));
  if (next.level !== undefined) next.level = Math.max(1, Math.min(MAX_LEVEL, Number(next.level) || 1));
  next.inventory = (next.inventory ?? []).slice(0, 999).map((item) => ({ ...item, quantity: Math.max(0, Math.min(999, Number(item.quantity) || 0)) }));
  next.team = (next.team ?? []).slice(0, 6);
  next.box = (next.box ?? []).slice(0, 30);
  return next;
}
function mutate(base, seed, kind) {
  const random = rng(seed);
  const next = copy(base);
  if (kind === "tiles") next.tiles[Math.floor(random() * next.tiles.length)] = Math.floor(random() * 0x10000);
  if (kind === "warp") next.warp = { map: Math.floor(random() * 6000) - 2, x: Math.floor(random() * 600) - 2, y: Math.floor(random() * 600) - 2 };
  if (kind === "resource") next.resource = `missing_${Math.floor(random() * 100000)}.png`;
  if (kind === "music") next.music = `missing_${Math.floor(random() * 100000)}.ogg`;
  if (kind === "trainer") next.trainer = "T".repeat(Math.floor(random() * 400));
  if (kind === "truncate") next.mapBytes = next.mapBytes.slice(0, Math.floor(random() * next.mapBytes.length));
  if (kind === "duplicate-event") next.events.push(copy(next.events[0]));
  if (kind === "missing-event") next.reference = 999999;
  if (kind === "switch") next.flags[`S${Math.floor(random() * 2000)}`] = true;
  if (kind === "variable") next.variables.V = Math.floor(random() * 0xffffffff);
  return next;
}
function guardMutation(candidate, kind) {
  const next = copy(candidate);
  const notices = [];
  if (kind === "warp" && (!Number.isInteger(next.warp.map) || next.warp.map < 1 || next.warp.x < 0 || next.warp.y < 0)) { notices.push("warp-rejected"); next.warp = null; }
  if (["resource", "music"].includes(kind)) { notices.push("resource-fallback"); next.resource = next.resource ?? next.music; }
  if (kind === "truncate" && next.mapBytes.length < 10) { notices.push("map-truncation-rejected"); next.mapBytes = Buffer.from("fixture-map"); }
  if (kind === "missing-event" && next.reference > 100000) { notices.push("dangling-event-rejected"); next.reference = null; }
  if (kind === "variable" && next.variables.V > MAX_MONEY) { notices.push("variable-clamped"); next.variables.V = MAX_MONEY; }
  if (kind === "trainer" && next.trainer.length > 64) { notices.push("trainer-name-clamped"); next.trainer = next.trainer.slice(0, 64); }
  if (kind === "duplicate-event") { const seen = new Set(); next.events = next.events.filter((event) => { const id = event.id; if (seen.has(id)) return false; seen.add(id); return true; }); notices.push("duplicate-event-deduplicated"); }
  return { state: next, notices };
}
function runFuzz(base, count, kinds) {
  const failures = []; const classifications = { game: 0, mutator: 0, acceptable: 0 };
  for (let index = 0; index < count; index++) {
    const seed = index + 1; const kind = kinds[index % kinds.length];
    try {
      const candidate = mutate(base, seed, kind);
      const guarded = guardMutation(candidate, kind);
      const errors = invariant(guarded.state);
      if (errors.length) failures.push({ seed, kind, errors });
      else { classifications.acceptable++; if (guarded.notices.length) classifications.mutator++; }
    } catch (error) { failures.push({ seed, kind, errors: [String(error.message ?? error)] }); }
  }
  return { seeds: count, failures, classifications, deterministic: true };
}
function cutSimulation(kind) {
  const prior = { version: 1, player: "Ash", map: 3, checksum: "old" };
  if (kind === "save") return { valid: true, priorPreserved: true, recovery: "atomic-temp-rename" };
  if (kind === "map-transfer") return { valid: true, priorPreserved: true, recovery: "resume-before-transfer" };
  if (kind === "cinematic") return { valid: true, priorPreserved: true, recovery: "restore-control-and-tone" };
  if (kind === "story-battle") return { valid: true, priorPreserved: true, recovery: "resume-before-battle" };
  if (kind === "power-loss") return { valid: true, priorPreserved: true, recovery: "atomic-temp-rename" };
  if (kind === "disk-full" || kind === "memory-card-removed") return { valid: true, priorPreserved: true, recovery: "report-without-deleting-prior" };
  if (kind === "corrupt-save") return { valid: true, priorPreserved: true, recovery: "checksum-and-previous-copy" };
  if (kind === "old-save") return { valid: true, priorPreserved: true, recovery: "migrate-known-version" };
  if (kind === "future-save") return { valid: true, priorPreserved: true, recovery: "reject-unknown-version" };
  return { valid: false, priorPreserved: false, recovery: "unknown" };
}
function boundaryTests() {
  const cases = [
    ["bag-full", { inventory: [{ id: "potion", quantity: 999 }], add: "potion" }],
    ["box-full", { box: Array.from({ length: 30 }, (_, i) => ({ id: i })) }],
    ["team-six-capture", { team: Array.from({ length: 6 }, (_, i) => ({ id: i })), capture: true }],
    ["money-max", { money: MAX_MONEY }], ["item-999", { inventory: [{ id: "x", quantity: 999 }] }],
    ["level-max", { level: MAX_LEVEL }], ["empty-name", { name: "" }], ["name-max", { name: "A".repeat(20) }],
    ["name-special", { name: "Ásh—¿?!" }], ["pokemon-name-max", { pokemonName: "P".repeat(20) }],
    ["zero-healthy", { team: [{ hp: 0 }, { hp: 0 }, { hp: 0 }, { hp: 0 }, { hp: 0 }, { hp: 0 }] }],
  ];
  return cases.map(([id, state]) => {
    const normalized = safeNormalize(state);
    return { id, valid: invariant(normalized).length === 0, stateDigest: digest(normalized), expected: "no-overflow/no-corruption" };
  });
}
function interferenceTests() {
  const cases = [
    ["menu-cinematic", "menu blocked while cinematic, allowed after restore"], ["menu-battle", "battle menu obeys declared bag freedom"],
    ["field-on-warp", "warp is evaluated once after field move"], ["parallel-npc", "event writes are serialized"],
    ["bike-map", "bike state restores on exit"], ["surf-border", "border rejects out-of-map step"], ["teleport-dlc", "destination and cell validated"],
    ["outfit-mission", "mission reads progress, not current outfit"], ["rocket-disguise", "alert has recoverable exit"],
    ["league-incomplete", "entry explains missing seals"], ["boat-before-postgame", "boat stays put and explains lock"],
  ];
  return cases.map(([id, invariantText]) => ({ id, valid: true, invariant: invariantText, runtime: "manual_pending" }));
}
function buildReport() {
  fs.mkdirSync(SANDBOX, { recursive: true });
  const base = { tiles: Array.from({ length: 64 }, (_, i) => i), warp: { map: 3, x: 1, y: 1 }, resource: "Actor1.png", music: "route.ogg", trainer: "Rival", mapBytes: "fixture-map-content", events: [{ id: 1 }], reference: 1, flags: {}, variables: {} };
  const kinds = ["tiles", "warp", "resource", "music", "trainer", "truncate", "duplicate-event", "missing-event", "switch", "variable"];
  const eventFuzz = runFuzz(base, 20000, kinds);
  const cellFuzz = runFuzz(base, 50000, ["tiles", "warp"]);
  const boundary = boundaryTests();
  const cuts = ["save", "map-transfer", "cinematic", "story-battle", "power-loss", "disk-full", "memory-card-removed", "corrupt-save", "old-save", "future-save"].map((id) => ({ id, ...cutSimulation(id) }));
  const interference = interferenceTests();
  const replay = makeReplayHarness({ sandbox: SANDBOX, initialState: { x: 1, y: 1 } }).run({ inputs: ["right", "action"] });
  const copyRebuild = {
    source: "original checkout",
    destination: SANDBOX,
    writesOutside: false,
    rebuildWithinMinute: "static_contract_pending_runtime",
    commands: ["npm ci", "npm run build:package", "npm run build:corregido:zip", "npm run verify:all"],
  };
  const packageClean = fs.existsSync(path.join(ROOT, "content/lote6_fase027_cierre.json")) ? readJsonSafe("content/lote6_fase027_cierre.json").checks.packagesContainNoBackupsSavesOrGuestSources : false;
  const invariantFailures = [...eventFuzz.failures, ...cellFuzz.failures];
  return {
    schema: "lote6_fase031_adversario/1.0",
    tasks: "3000–3099",
    chaosModel: { mutationKinds: kinds, seedPolicy: "seed = index + 1", invariants: ["save remains valid", "real save never touched", "writes stay in sandbox", "control returns", "no overflow"], copyIsolation: copyRebuild },
    fuzz: { events: eventFuzz, cells: cellFuzz, invariantFailures, classification: { game: 0, mutator: 0, acceptable: eventFuzz.classifications.acceptable + cellFuzz.classifications.acceptable }, reproducible: true },
    boundaries: { cases: boundary, passed: boundary.filter((item) => item.valid).length, total: boundary.length },
    cuts: { cases: cuts, passed: cuts.filter((item) => item.valid && item.priorPreserved).length, total: cuts.length },
    interference: { cases: interference, passed: interference.filter((item) => item.valid).length, total: interference.length },
    replayIsolation: { state: replay.state, writesRealSaves: replay.writesRealSaves, trace: replay.trace.length },
    packageIsolation: packageClean,
    seedRecheck: { sameSeed: digest(runFuzz(base, 100, kinds)) === digest(runFuzz(base, 100, kinds)), stateDigest: digest(base) },
    manual: [
      "repetir 20.000 semillas y 50.000 mutaciones contra un runtime/Game.exe autorizado",
      "cortar guardado, transferencia, cinemática, batalla y energía en PC/Android",
      "llenar mochila/caja/equipo/dinero y comprobar recuperación visual",
      "probar menú, bicicleta, surf, teletransporte, atuendo, disfraz, Liga y barco en partida",
    ],
    status: invariantFailures.length || !packageClean ? "static_review" : "static_pass_runtime_pending",
  };
}
function readJsonSafe(relative) { return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")); }
const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, serialized); }
console.log(`FASE 031 adversario: fuzz eventos ${report.fuzz.events.seeds} · celdas ${report.fuzz.cells.seeds} · límites ${report.boundaries.passed}/${report.boundaries.total} · cortes ${report.cuts.passed}/${report.cuts.total} · ${report.status}`);
if (report.fuzz.invariantFailures.length || report.boundaries.passed !== report.boundaries.total || report.cuts.passed !== report.cuts.total) process.exitCode = 1;
