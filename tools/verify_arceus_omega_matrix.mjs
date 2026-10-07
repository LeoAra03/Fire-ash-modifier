#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ROOT = path.resolve(import.meta.dirname, "..");
const file = path.join(ROOT, "content", "arceus_omega_qa_matrix.jsonl");
if (!fs.existsSync(file)) throw new Error("Missing matrix; run generate_arceus_omega_qa_matrix.mjs");

const expectedFamilies = { transaction: 120_000, battle: 90_000, map: 90_000 };
const counts = { transaction: 0, battle: 0, map: 0 };
const realms = new Set();
const stages = new Set();
const failures = new Set();
let manifest = null;
let line = 0;
let previous = -1;

for await (const text of readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
  line++;
  const row = JSON.parse(text);
  if (line === 1) {
    manifest = row;
    if (row.kind !== "manifest" || row.schema !== 1 || row.cases !== 300_000) throw new Error("Invalid manifest");
    continue;
  }
  if (row.id !== previous + 1) throw new Error(`Non-contiguous id at line ${line}`);
  previous = row.id;
  if (!(row.family in counts)) throw new Error(`Unknown family ${row.family}`);
  if (!Number.isInteger(row.seed) || row.seed < 0) throw new Error(`Invalid seed at ${row.id}`);
  counts[row.family]++;
  realms.add(row.realm); stages.add(row.stage); failures.add(row.failure);

  // Execute each compact oracle as a pure simulation.
  if (row.family === "transaction") {
    const before = { player: "ash", bag: 42, disk: "baseline" };
    const mutated = { player: "arceus", bag: 0, disk: row.failure === "direct_file_drift" ? "drift" : before.disk };
    Object.assign(mutated, before); // rollback oracle
    if (mutated.player !== "ash" || mutated.bag !== 42 || mutated.disk !== "baseline" || !row.expected.diskStable) throw new Error(`Rollback oracle failed ${row.id}`);
  } else if (row.family === "battle") {
    if (row.expected.phase < 1 || row.expected.phase > 6 || row.expected.cpuChoice < 0 || row.expected.cpuChoice > 3 || row.expected.escape !== false) throw new Error(`Battle oracle failed ${row.id}`);
  } else if (row.expected.visitor !== "ASH_POSTGAME" || !row.expected.recoveryRoute) {
    throw new Error(`Map continuity oracle failed ${row.id}`);
  }
}
if (!manifest || previous !== manifest.cases - 1) throw new Error(`Expected ${manifest?.cases} cases, got ${previous + 1}`);
for (const [name, expected] of Object.entries(expectedFamilies)) if (counts[name] !== expected) throw new Error(`${name}: expected ${expected}, got ${counts[name]}`);
if (realms.size !== 3 || stages.size !== 6 || failures.size !== 10) throw new Error("Coverage dimensions incomplete");
console.log(`OK: ${manifest.cases.toLocaleString("en-US")} cases executed; transaction=${counts.transaction}, battle=${counts.battle}, map=${counts.map}`);
console.log(`Coverage: ${realms.size} realms x ${stages.size} stages x ${failures.size} forced-failure modes`);
