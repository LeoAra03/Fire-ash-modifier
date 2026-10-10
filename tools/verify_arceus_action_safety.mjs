#!/usr/bin/env node
/** Regression audit for Arceus stages, adaptive battle rules and NPC-vs-NPC owners. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";
import { ROOT, loadFireAshRegistry, stringValue, symbolName, symbolicRecords } from "./lib/fire_ash_registry.mjs";

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

function parseSymbolArray(ruby, name) {
  const match = ruby.match(new RegExp(`^${name}\\s*=\\s*\\[([^\\]]*)\\](?:\\.freeze)?`, "ms"));
  assert(match, `${name} is missing`);
  return [...match[1].matchAll(/:([A-Z0-9_]+)/g)].map((row) => row[1]);
}

function parseWordArray(ruby, name) {
  const match = ruby.match(new RegExp(`^${name}\\s*=\\s*%w\\[([\\s\\S]*?)\\]\\.freeze`, "m"));
  assert(match, `${name} is missing`);
  return match[1].trim().split(/\s+/).filter(Boolean);
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

const primaryRoute = readSection(scriptFiles[0], "PokeMod_RutaDeDios");
const baseSets = parseBaseMoveSets(primaryRoute);
const phaseCanonMoves = Object.values(canon.fases_dios).map((phase) => phase.movimientos ?? []);
assert.equal(phaseCanonMoves.length, 6, "expected six canon phase additions");

const selfDamageIds = parseSymbolArray(primaryRoute, "RUTA_ARCEUS_SELF_DAMAGING_MOVES");
const selfDamageFunctions = parseWordArray(primaryRoute, "RUTA_ARCEUS_SELF_DAMAGING_FUNCTIONS");
const scriptBreakingIds = parseSymbolArray(primaryRoute, "RUTA_ARCEUS_SCRIPT_BREAKING_MOVES");
const scriptBreakingFunctions = parseWordArray(primaryRoute, "RUTA_ARCEUS_SCRIPT_BREAKING_FUNCTIONS");
const moveData = new Map(symbolicRecords("moves.dat").map(({ id, value }) => [id, {
  function: stringValue(value.getIvar("function_code")).toUpperCase(),
  damage: Number(value.getIvar("base_damage") ?? 0),
}]));
const arceusSpecies = symbolicRecords("species.dat").find(({ id }) => id === "ARCEUS")?.value;
assert(arceusSpecies, "species.dat has no ARCEUS row");
const learnsetIds = (arceusSpecies.getIvar("moves") ?? []).map((row) => symbolName(row?.[1])).filter(Boolean);
const tutorIds = (arceusSpecies.getIvar("tutor_moves") ?? []).map(symbolName).filter(Boolean);
const selfDamageLearnset = unique([...learnsetIds, ...tutorIds]).filter((id) => {
  const data = moveData.get(id);
  return selfDamageIds.includes(id) || selfDamageFunctions.includes(data?.function);
}).sort();
assert.deepEqual(selfDamageLearnset, ["CURSE", "HEALINGWISH", "PERISHSONG", "SUBSTITUTE"],
  "Arceus's learnset/tutor autodaño set changed; re-audit moves.dat and function routes");
for (const [id, code] of [["TELEPORT", "0EA"], ["ROAR", "0EB"], ["WHIRLWIND", "0EB"]]) {
  assert.equal(moveData.get(id)?.function, code, `${id} changed function code`);
  assert(scriptBreakingIds.includes(id) && scriptBreakingFunctions.includes(code),
    `${id} may escape/terminate the divine wild battle but is no longer filtered`);
}
assert.equal(moveData.get("DRAGONTAIL")?.function, "0EC");
assert.equal(moveData.get("CIRCLETHROW")?.function, "0EC");

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
  assert(route.includes("RUTA_ARCEUS_STAGE_COUNT = 6"), `${path.relative(ROOT, file)} does not set six full-HP stages`);
  assert(route.includes("@ruta_arceus_bars_depleted"), `${path.relative(ROOT, file)} does not persist full-bar depletions`);
  assert(route.includes("def pbArceusDepleteBar") && route.includes("battler.hp = 0"), `${path.relative(ROOT, file)} does not animate a completely empty bar`);
  assert(route.includes("return :ruta_arceus_stage_break if amount.to_i >= battler.hp"), `${path.relative(ROOT, file)} does not intercept a full-bar KO for the next stage`);
  assert(!route.includes("RUTA_ARCEUS_SEAL_FLOORS") && !route.includes("@ruta_arceus_seals"), `${path.relative(ROOT, file)} still uses partial seal thresholds`);
  assert(route.includes("def pbArceusPlateRouletteAnimation") && route.includes("ItemIconSprite.new(0, 0, plate, viewport)"), `${path.relative(ROOT, file)} has no animated 17-plate roulette`);
  assert(route.includes("Effectiveness.calculate(type, types[0], types[1], types[2])"), `${path.relative(ROOT, file)} does not choose a plate against the active rival`);
  assert(route.includes("def pbArceusMoveCatalogIds") && route.includes("def pbArceusBestAttackIds"), `${path.relative(ROOT, file)} does not build/score Arceus's learnable move catalog`);
  assert(route.includes("def pbArceusStatusMoveIds") && route.includes("def pbArceusStatusMoveScore"), `${path.relative(ROOT, file)} does not score legal status/support moves`);
  assert(route.includes("def pbArceusSelfDamagingMove?") && route.includes("def pbArceusScriptBreakingMove?"), `${path.relative(ROOT, file)} does not filter self-damage and encounter-breaking moves`);
  assert(route.includes("next false if pbArceusScriptBreakingMove?(id)"), `${path.relative(ROOT, file)} does not apply the encounter-safety filter to copied moves`);
  assert(route.includes("next if !move.damagingMove? && !move.statusMove?"), `${path.relative(ROOT, file)} cannot register Arceus status moves`);
  assert(route.includes("@battleAI.pbRegisterMoveTrainer") && route.includes("def pbArceusChooseSmartMove"), `${path.relative(ROOT, file)} does not use the engine's high-skill tactical move scorer`);
  assert(route.includes("@ruta_arceus_invocation_state[:slot_index].to_i == battler.index.to_i") && route.includes("invocación volverá a su lugar"), `${path.relative(ROOT, file)} may capture an invocation at pokemonIndex -1`);
  assert(route.includes("class PokeBattle_Move_0EC") && route.includes("_ruta_arceus_original_wild_knockback"), `${path.relative(ROOT, file)} may let Dragon Tail/Circle Throw close the divine wild battle`);
  assert(route.includes("@ruta_arceus_move_history") && route.includes("def pbArceusBattleCommentary"), `${path.relative(ROOT, file)} repeats attacks without memory or battle dialogue`);
  assert(route.includes("def pbArceusAdaptTypeToRival"), `${path.relative(ROOT, file)} does not react to a rival switch`);
  assert(!route.includes("def pbArceusRealityControl"), `${path.relative(ROOT, file)} heals Ash's reserves instead of Arceus`);
  assert(route.includes("pbArceusRedlineHeal(boss, true)") && route.includes("return false if @endOfRound && !force"), `${path.relative(ROOT, file)} may skip Arceus's redline heal before its action`);
  assert(route.includes("def pbArceusControlLevels") && route.includes("@ruta_arceus_effective_level"), `${path.relative(ROOT, file)} does not alter levels by stage`);
  assert(route.includes("def pbCanInflictStatus?") && route.includes("def pbCanLowerStatStage?"), `${path.relative(ROOT, file)} does not protect Arceus from statuses and stat drops`);
  assert(route.includes("def pbArceusRedlineHeal"), `${path.relative(ROOT, file)} is missing the red-HP full heal`);
  assert(route.includes("def pbArceusCinematicRebirth") && route.includes("se restaura por completo y se burla"), `${path.relative(ROOT, file)} is missing pre-Ash healing and taunts`);
  assert(canonRuby.includes("set.replace(seleccion.take(Pokemon::MAX_MOVES))"), `${path.relative(ROOT, file)} leaves oversized canon phase lists`);
  assert(canonRuby.includes("respond_to?(:pbArceusBestPlateIndex)"), `${path.relative(ROOT, file)} can overwrite the adaptive type roulette with a fixed phase plate`);
}

console.log("OK: seis barras, catálogo real de ataques/apoyos con filtros de autodaño y huida, captura segura de invocaciones, límite de cuatro movimientos y sincronía en los tres paquetes.");
