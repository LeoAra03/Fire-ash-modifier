#!/usr/bin/env node
/** Regression audit for Arceus's move cap and NPC-vs-NPC battle owners. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";
import { ROOT, loadFireAshRegistry } from "./lib/fire_ash_registry.mjs";

const MAX_MOVES = 4;
const registry = loadFireAshRegistry();
const canon = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "canon_arceus.json"), "utf8"));
const scriptFiles = [
  path.join(ROOT, "pokemon_fire_ash", "Data", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Scripts.rxdata"),
];

function readSection(file, name) {
  assert(fs.existsSync(file), `missing scripts file: ${path.relative(ROOT, file)}`);
  const rows = marshalLoad(fs.readFileSync(file));
  const row = rows.find((entry) => entry[1]?.text === name);
  assert(row, `missing ${name} in ${path.relative(ROOT, file)}`);
  return zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
}

function parseBaseMoveSets(ruby) {
  const block = ruby.match(/RUTA_ARCEUS_MOVE_SETS = \[(.*?)\n\]/s)?.[1];
  assert(block, "RUTA_ARCEUS_MOVE_SETS is missing");
  const rows = [...block.matchAll(/\[([^\]]*)\]/g)].map((match) =>
    [...match[1].matchAll(/:([A-Z0-9_]+)/g)].map((move) => move[1]));
  assert.equal(rows.length, 6, "expected six Arceus phase sets");
  return rows;
}

function unique(values) {
  return [...new Set(values)];
}

// Mirrors the Ruby selector and verifies the actual base + canon data cannot
// hand more than four moves to either Pokemon or PokeBattle_Battler.
function selectBattleMoves(ids, canonIds) {
  const valid = unique(ids).filter((id) => registry.moves.has(id));
  if (valid.length <= MAX_MOVES) return valid;
  const canonical = unique(canonIds.filter((id) => valid.includes(id)));
  const selected = canonical.slice(0, Math.min(2, MAX_MOVES));
  for (const id of valid) {
    if (!canonical.includes(id) && !selected.includes(id)) selected.push(id);
    if (selected.length >= MAX_MOVES) break;
  }
  for (const id of valid) {
    if (!selected.includes(id)) selected.push(id);
    if (selected.length >= MAX_MOVES) break;
  }
  return selected.slice(0, MAX_MOVES);
}

const baseSets = parseBaseMoveSets(readSection(scriptFiles[0], "PokeMod_RutaDeDios"));
const phaseCanonMoves = Object.values(canon.fases_dios).map((phase) => phase.movimientos ?? []);
assert.equal(phaseCanonMoves.length, 6, "expected six canon phase additions");

for (let i = 0; i < baseSets.length; i++) {
  const combined = unique([...baseSets[i], ...phaseCanonMoves[i]]);
  const selected = selectBattleMoves(combined, phaseCanonMoves[i]);
  assert(selected.length <= MAX_MOVES, `phase ${i + 1} exceeds Pokemon::MAX_MOVES`);
  assert.equal(unique(selected).length, selected.length, `phase ${i + 1} contains duplicate moves`);
  assert(selected.every((move) => registry.moves.has(move)), `phase ${i + 1} contains an unknown move`);
  assert(phaseCanonMoves[i].some((move) => selected.includes(move)), `phase ${i + 1} lost its canon signature move`);
}

const cinematicMoves = (["ROCKSLIDE", "JUDGMENT", "ROAROFTIME", "SPACIALREND", "SHADOWFORCE"])
  .slice(0, MAX_MOVES);
assert.equal(cinematicMoves[0], "ROCKSLIDE", "the cinematic Arceus must retain its guaranteed area move");

function resolveBattlePlayer(owner, modernPlayer, legacyTrainer) {
  if (owner && typeof owner.badge_count === "function") return owner;
  if (modernPlayer && typeof modernPlayer.badge_count === "function") return modernPlayer;
  if (legacyTrainer && typeof legacyTrainer.badge_count === "function") return legacyTrainer;
  return owner;
}
const npcOwner = { name: "Cynthia" };
const globalPlayer = { badge_count: () => 8 };
const legacyTrainer = { badge_count: () => 8 };
assert.strictEqual(resolveBattlePlayer(npcOwner, globalPlayer, legacyTrainer), globalPlayer,
  "a CPU-vs-CPU owner must fall back to the v20+ global player for badge checks");
assert.strictEqual(resolveBattlePlayer(npcOwner, null, legacyTrainer), legacyTrainer,
  "a CPU-vs-CPU owner must fall back to the v19 global trainer for badge checks");
assert.strictEqual(resolveBattlePlayer(globalPlayer, legacyTrainer, legacyTrainer), globalPlayer,
  "a real battle player must remain the owner when present");

for (const file of scriptFiles) {
  const route = readSection(file, "PokeMod_RutaDeDios");
  const canonRuby = readSection(file, "PokeMod_CanonArceus");
  assert(route.includes("alias _ruta_arceus_original_pb_player pbPlayer"), `${path.relative(ROOT, file)} does not preserve the engine's pbPlayer`);
  assert(route.includes("def pbPlayer"), `${path.relative(ROOT, file)} does not override pbPlayer`);
  assert(route.includes("return $player if defined?($player) && $player && $player.respond_to?(:badge_count)"), `${path.relative(ROOT, file)} does not fall back to the v20+ global player`);
  assert(route.includes("return $Trainer if defined?($Trainer) && $Trainer && $Trainer.respond_to?(:badge_count)"), `${path.relative(ROOT, file)} does not fall back to the v19 global trainer`);
  assert(route.includes("def pbArceusMoveIds(move_ids, phase = nil)"), `${path.relative(ROOT, file)} is missing the capped selector`);
  assert(route.includes("return selected.take(max_moves)"), `${path.relative(ROOT, file)} does not cap selected phase moves`);
  assert(route.includes("valid = pbArceusMoveIds(move_ids, @arceus_phase)"), `${path.relative(ROOT, file)} does not cap phase transitions`);
  assert(route.includes("pkmn.moves = pbArceusMoveIds(RUTA_ARCEUS_MOVE_SETS[0], 1).map"), `${path.relative(ROOT, file)} does not cap the initial boss moveset`);
  assert(route.includes(".take(Pokemon::MAX_MOVES)"), `${path.relative(ROOT, file)} does not cap the cinematic boss moveset`);
  assert(canonRuby.includes("set.replace(seleccion.take(Pokemon::MAX_MOVES))"), `${path.relative(ROOT, file)} leaves oversized canon phase lists`);
}

console.log("OK: seis fases respetan los cuatro movimientos y los tres paquetes protegen badge_count en combates NPC vs NPC.");
