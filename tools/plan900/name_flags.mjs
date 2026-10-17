#!/usr/bin/env node
/**
 * Nombres legibles para switches/variables que ya consume el contenido del
 * plan 900. No asigna IDs nuevos: sólo hace auditable el bloque existente.
 *
 * Uso:
 *   node tools/plan900/name_flags.mjs --apply
 *   node tools/plan900/name_flags.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad, RString } from "../../web/js/marshal.js";
import { DATA, GAME } from "../lib/fire_ash_registry.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify") || !APPLY;
const SYSTEM = path.join(DATA, "System.rxdata");
const BACKUP = path.join(GAME, "PokeModBackups", "plan900_flags_originals", "System.rxdata");
const SWITCHES = new Map([
  [950, "POKEMOD RESTAURACION COLOR 01"],
  [951, "POKEMOD RESTAURACION COLOR 02"],
  [952, "POKEMOD RESTAURACION COLOR 03"],
  [953, "POKEMOD RESTAURACION COLOR 04"],
  [954, "POKEMOD RESTAURACION COLOR 05"],
  [955, "POKEMOD RESTAURACION COLOR 06"],
  [956, "POKEMOD RESTAURACION COLOR 07"],
  [957, "POKEMOD RESTAURACION TODAS EN PAZ"],
  [960, "POKEMOD DIMENSION GLAZED COMPLETADA"],
  [961, "POKEMOD DIMENSION LIGHT PLATINUM COMPLETADA"],
  [962, "POKEMOD DIMENSION LIQUID CRYSTAL COMPLETADA"],
  [963, "POKEMOD DIMENSION TFOH COMPLETADA"],
  [964, "POKEMOD DIMENSION FACTORY ADVENTURE COMPLETADA"],
  [970, "POKEMOD ATLAS MEDALLA 01"],
  [971, "POKEMOD ATLAS MEDALLA 02"],
  [972, "POKEMOD ATLAS MEDALLA 03"],
  [973, "POKEMOD ATLAS MEDALLA 04"],
  [974, "POKEMOD ATLAS MEDALLA 05"],
  [975, "POKEMOD ATLAS MEDALLA 06"],
  [976, "POKEMOD ATLAS MEDALLA 07"],
]);
const VARIABLES = new Map([
  [310, "POKEMOD RESTAURACION MUNDOS RECUPERADOS"],
  [311, "POKEMOD ROCKET RANGO"],
  [312, "POKEMOD ROCKET MISIONES CUMPLIDAS"],
  [313, "POKEMOD ROCKET HERIDOS SOCORRIDOS"],
  [315, "POKEMOD CAMPANAS RESULTADO LIGHT PLATINUM"],
  [318, "POKEMOD CAMPANAS PROGRESO 01"],
  [319, "POKEMOD CAMPANAS PROGRESO 02"],
  [320, "POKEMOD CAMPANAS PROGRESO 03"],
  [321, "POKEMOD CAMPANAS PROGRESO 04"],
  [322, "POKEMOD CAMPANAS PROGRESO 05"],
]);
const text = (value) => (value instanceof RString ? value.text : String(value ?? ""));
const read = () => marshalLoad(fs.readFileSync(SYSTEM));
const write = (system) => fs.writeFileSync(SYSTEM, Buffer.from(marshalDump(system)));
function verify() {
  const system = read();
  const switches = system.getIvar("switches") ?? [];
  const variables = system.getIvar("variables") ?? [];
  const errors = [];
  for (const [id, expected] of SWITCHES) if (text(switches[id]) !== expected) errors.push(`switch ${id}: «${text(switches[id]) || "—"}» ≠ «${expected}»`);
  for (const [id, expected] of VARIABLES) if (text(variables[id]) !== expected) errors.push(`variable ${id}: «${text(variables[id]) || "—"}» ≠ «${expected}»`);
  if (errors.length) throw new Error(`Flags del plan 900 sin nombre (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`OK: ${SWITCHES.size} switches y ${VARIABLES.size} variables del plan 900 tienen nombres únicos y legibles.`);
}
if (APPLY) {
  if (!fs.existsSync(SYSTEM)) throw new Error(`Falta ${SYSTEM}`);
  fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
  if (!fs.existsSync(BACKUP)) fs.copyFileSync(SYSTEM, BACKUP);
  const system = read();
  const switches = system.getIvar("switches") ?? [];
  const variables = system.getIvar("variables") ?? [];
  for (const [id, name] of SWITCHES) switches[id] = RString.fromText(name);
  for (const [id, name] of VARIABLES) variables[id] = RString.fromText(name);
  system.setIvar("switches", switches);
  system.setIvar("variables", variables);
  write(system);
  console.log(`Nombres del plan 900 instalados en System.rxdata. Backup: ${path.relative(process.cwd(), BACKUP)}`);
}
if (VERIFY) verify();
