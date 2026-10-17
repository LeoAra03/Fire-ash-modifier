#!/usr/bin/env node
/**
 * Asigna nombres legibles al bloque de sellos del Multiverso en System.rxdata.
 *
 * El bloque 940–947 es deliberado: 940–946 corresponden a las siete
 * emisiones del Monte Silver y 947 al sello de RED en la cumbre. Los
 * switches 868–875 quedan reservados para el canon de La Ruta de Dios.
 *
 * Uso:
 *   node tools/qa/name_multiverse_flags.mjs --apply
 *   node tools/qa/name_multiverse_flags.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalDump, marshalLoad, RString } from "../../web/js/marshal.js";
import { DATA, GAME } from "../lib/fire_ash_registry.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY_ONLY = process.argv.includes("--verify") || !APPLY;
const SYSTEM = path.join(DATA, "System.rxdata");
const BACKUP = path.join(GAME, "PokeModBackups", "multiverse_flags_originals", "System.rxdata");

const EXPECTED = new Map([
  [940, "POKEMOD MULTIVERSO SELLO 01 TORRE"],
  [941, "POKEMOD MULTIVERSO SELLO 02 PARTIDA"],
  [942, "POKEMOD MULTIVERSO SELLO 03 FOSA"],
  [943, "POKEMOD MULTIVERSO SELLO 04 CINTA"],
  [944, "POKEMOD MULTIVERSO SELLO 05 GLITCH"],
  [945, "POKEMOD MULTIVERSO SELLO 06 ECO"],
  [946, "POKEMOD MULTIVERSO SELLO 07 CONSOLA"],
  [947, "POKEMOD MULTIVERSO SELLO 08 RED CUMBRE"],
]);

const text = (value) => (value instanceof RString ? value.text : String(value ?? ""));
const readSystem = () => marshalLoad(fs.readFileSync(SYSTEM));
const writeSystem = (system) => fs.writeFileSync(SYSTEM, Buffer.from(marshalDump(system)));

function verify() {
  const system = readSystem();
  const switches = system.getIvar("switches") ?? system.getIvar("@switches") ?? [];
  const errors = [];
  for (const [id, expected] of EXPECTED) {
    const actual = text(switches[id]);
    if (actual !== expected) errors.push(`${id}: «${actual || "—"}» (esperado «${expected}»)`);
  }
  if (errors.length) throw new Error(`Sellos del Multiverso sin nombre (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log("OK: switches 940–947 tienen nombres legibles y exclusivos del Multiverso (7 emisiones + RED). ");
}

if (APPLY) {
  if (!fs.existsSync(SYSTEM)) throw new Error(`No existe ${SYSTEM}`);
  fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
  if (!fs.existsSync(BACKUP)) fs.copyFileSync(SYSTEM, BACKUP);
  const system = readSystem();
  const switches = system.getIvar("switches") ?? system.getIvar("@switches") ?? [];
  for (const [id, name] of EXPECTED) switches[id] = RString.fromText(name);
  if (system.getIvar("switches") !== undefined) system.setIvar("switches", switches);
  else system.setIvar("@switches", switches);
  writeSystem(system);
  console.log(`Nombres instalados en System.rxdata (940–947). Backup: ${path.relative(process.cwd(), BACKUP)}`);
}

if (VERIFY_ONLY) verify();
