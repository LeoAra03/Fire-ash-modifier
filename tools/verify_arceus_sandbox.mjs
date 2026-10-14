#!/usr/bin/env node
/** Static contract audit + deterministic fault model for ArceusSaveSandbox. */
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";

const scripts = marshalLoad(fs.readFileSync(new URL("../pokemon_fire_ash/Data/Scripts.rxdata", import.meta.url)));
const entry = scripts.find(([, title]) => title?.text === "PokeMod_RutaDeDios");
assert(entry, "PokeMod_RutaDeDios missing");
const ruby = zlib.inflateSync(Buffer.from(entry[2].bytes)).toString("utf8");
const required = [
  "module ArceusSaveSandbox", "SaveData.compile_save_hash", "PROTECTED_IDS",
  "errors.concat(restore_values(transaction[:snapshot]))",
  "disk_error = restore_disk!(transaction)", "@depth = 0",
  "alias arceus_unrestricted_save_to_file save_to_file",
  "alias arceus_unrestricted_delete_file delete_file",
  "canonical_capture = ArceusSaveSandbox.deep_copy(pkmn)",
  "ArceusSaveSandbox.finish!(transaction, canonical_capture, canonical_caught, prelude_seen)"
];
for (const token of required) assert(ruby.includes(token), `sandbox contract missing: ${token}`);
assert(ruby.indexOf("disk_error = restore_disk!(transaction)") < ruby.indexOf("@depth = 0", ruby.indexOf("def self.finish!")), "disk must restore before lock release");

const keys = ["player", "frame_count", "game_system", "pokemon_system", "switches", "variables", "self_switches", "game_screen", "global_metadata", "map_metadata", "bag", "storage_system"];
function runModel({ failKey = null, diskFailure = false, capture = false }) {
  const baseline = Object.fromEntries(keys.map((key, i) => [key, { value: i, nested: [i, i + 1] }]));
  const live = structuredClone(baseline);
  for (const key of keys) live[key] = { value: -1, nested: [999] };
  const errors = [];
  for (const key of keys) {
    if (key === failKey) { errors.push(key); continue; }
    live[key] = structuredClone(baseline[key]);
  }
  let canonical = null;
  if (!errors.length && capture) canonical = { species: "ARCEUS", divine: false };
  let disk = "baseline";
  if (diskFailure) { disk = "drift"; errors.push("disk"); }
  for (const key of keys) {
    if (key === failKey) assert.notDeepEqual(live[key], baseline[key]);
    else assert.deepEqual(live[key], baseline[key], `${key} was not restored after ${failKey ?? "success"}`);
  }
  assert.equal(canonical !== null, capture && !failKey, "canonical commit must be all-or-nothing");
  assert.equal(disk, diskFailure ? "drift" : "baseline");
  return errors;
}

let scenarios = 0;
for (const failKey of [null, ...keys]) {
  for (const diskFailure of [false, true]) {
    for (const capture of [false, true]) {
      const errors = runModel({ failKey, diskFailure, capture });
      assert.equal(errors.length, Number(failKey !== null) + Number(diskFailure));
      scenarios++;
    }
  }
}
console.log(`OK: contrato transaccional instalado y ${scenarios} escenarios dirigidos de rollback/commit aprobados.`);
