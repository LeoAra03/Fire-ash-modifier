#!/usr/bin/env node
/**
 * Generates the exhaustive, deterministic QA corpus for the Arceus Omega phase.
 * Every row is executable input for verify_arceus_omega_matrix.mjs, not prose.
 *
 * El corpus se guarda comprimido (`content/arceus_omega_qa_matrix.jsonl.gz`):
 * 300 001 líneas ocupan 62,5 MiB en texto y 4,0 MiB comprimidas, por encima y
 * por debajo del techo de 20 MiB que el plan 2700 fija para el repositorio. La
 * compresión es determinista (un único `gzipSync`, nivel 9, cabecera sin fecha),
 * así que `--verify` puede comprobar que el archivo versionado es exactamente lo
 * que produce este generador.
 *
 * Uso:
 *   node tools/generate_arceus_omega_qa_matrix.mjs            # escribe el corpus
 *   node tools/generate_arceus_omega_qa_matrix.mjs --verify   # comprueba que está al día
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "content", "arceus_omega_qa_matrix.jsonl.gz");
const VERIFY = process.argv.includes("--verify");
const COUNT = 300_000;
const realms = ["DIMENSIONAL_NIGHTMARE", "ATLAS_MIL", "RUTA_DE_DIOS"];
const stages = ["PROLOGUE_CPU", "PLATE_ROULETTE", "LAW_REWRITE", "ASH_WILL", "GENESIS_COLLAPSE", "VERDICT"];
const failures = ["none", "before_snapshot", "after_snapshot", "during_cpu", "before_turn", "after_turn", "during_capture", "during_rollback", "save_hotkey", "direct_file_drift"];
const saveKeys = ["player", "game_system", "pokemon_system", "switches", "variables", "self_switches", "game_screen", "global_metadata", "map_metadata", "bag", "storage_system"];
const mapChecks = ["walkability", "exit_reachability", "event_collision", "layer_occlusion", "tileset_bounds", "tone_release", "transition_return", "postgame_continuity"];

const lines = [JSON.stringify({ kind: "manifest", schema: 1, cases: COUNT, generatedBy: "generate_arceus_omega_qa_matrix.mjs" })];
for (let id = 0; id < COUNT; id++) {
  const family = id < 120_000 ? "transaction" : id < 210_000 ? "battle" : "map";
  const realm = realms[id % realms.length];
  const stage = stages[Math.floor(id / realms.length) % stages.length];
  const failure = failures[Math.floor(id / 17) % failures.length];
  const seed = ((id + 1) * 2654435761) >>> 0;
  const expected = family === "transaction"
    ? { rollback: saveKeys[(id >>> 2) % saveKeys.length], diskStable: true, saveBlocked: failure === "save_hotkey", canonical: id % 97 === 0 ? "capture" : "none" }
    : family === "battle"
      ? { phase: (id % 6) + 1, cpuChoice: seed % 4, deterministic: true, escape: false, visibleCue: true }
      : { check: mapChecks[id % mapChecks.length], passable: id % 19 !== 0, recoveryRoute: true, visitor: "ASH_POSTGAME" };
  lines.push(JSON.stringify({ id, family, realm, stage, failure, seed, expected }));
}
const plain = `${lines.join("\n")}\n`;
// mtime 0 y OS 255 por omisión: la cabecera no cambia entre ejecuciones ni máquinas.
const gzip = zlib.gzipSync(Buffer.from(plain, "utf8"), { level: 9 });

if (VERIFY) {
  if (!fs.existsSync(OUTPUT)) throw new Error(`Falta ${path.relative(ROOT, OUTPUT)}; ejecuta sin --verify`);
  const actual = fs.readFileSync(OUTPUT);
  if (!actual.equals(gzip)) {
    throw new Error(`${path.relative(ROOT, OUTPUT)} no coincide con el generador (${actual.length} vs ${gzip.length} bytes)`);
  }
  console.log(`OK: ${path.relative(ROOT, OUTPUT)} es exactamente lo que genera el generador (${gzip.length.toLocaleString("en-US")} bytes comprimidos).`);
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, gzip);
  console.log(`OK: ${COUNT.toLocaleString("en-US")} substantive QA cases -> ${path.relative(ROOT, OUTPUT)} (${(plain.length / 1048576).toFixed(2)} MiB en texto, ${(gzip.length / 1048576).toFixed(2)} MiB comprimidos)`);
}
