#!/usr/bin/env node
/**
 * Mochila libre en la torre del laboratorio de Oak (Grandeur Club).
 *
 * Contexto verificado en los datos compilados de Fire Ash 3.7.1:
 *   - El segundo transportador cuántico del sótano del laboratorio de Oak
 *     (mapa 48, evento 16, condicionado por el switch 429 = Postgame) lleva al
 *     Pico Secreto (141), al Salón Grandeur (151) y al Escenario (214).
 *   - Ocho eventos de contacto de esa torre encienden el switch
 *     674 = NO ITEM INBATT (siete de ellos también 675 = NO ITEM OUTBATT).
 *   - El parche previo solo eliminó el switch 674 de `pbItemMenu`
 *     (Battle_Phase_Command). La Mochila se abría, pero
 *     `pbCanUseItemOnPokemon?` (Battle_Action_UseItem) seguía rechazando el
 *     objeto con "You can't use items here!".
 *
 * Este instalador termina el trabajo: el switch 674 deja de tener efecto sobre
 * el jugador dentro de cualquier combate interno. No se tocan los eventos de la
 * torre, la regla `!@internalBattle` de los sistemas externos ni el switch 675.
 *
 * Uso:
 *   node tools/apply_grandeur_bag_freedom.mjs            # instala y verifica
 *   node tools/apply_grandeur_bag_freedom.mjs --verify   # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";
import { parseEvent, parseMap, cmdOf } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "grandeur_bag_originals");
const TOWER_MAPS = [141, 151, 214];
const OAK_LAB = 48;
const text = (value) => value instanceof RString ? value.text : String(value ?? "");
const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));

// --- Parche 1: Battle_Action_UseItem#pbCanUseItemOnPokemon? -----------------
const OLD_USE_GUARD = [
  "    # Player isn't allowed to use items",
  "    if $game_switches[674] && !(battler && !battler.pbOwnedByPlayer?)",
  "      scene.pbDisplay(_INTL(\"You can't use items here!\")) if showMessages",
  "      return false",
  "    end",
].join("\r\n");
const NEW_USE_GUARD = [
  "    # PokeMod: switch 674 (NO ITEM INBATT) no longer blocks the player's items.",
  "    # The Grandeur Club tower under Oak's lab sets it on entry; the Bag must",
  "    # stay usable there so the challenge can be played freely.",
].join("\r\n");
const USE_MARKER = "switch 674 (NO ITEM INBATT) no longer blocks";

// --- Parche 2: Battle_Phase_Command#pbItemMenu (instalado por Isla Espejo) ---
const OLD_MENU_GUARD = "    if !@internalBattle || $game_switches[674]";
const NEW_MENU_GUARD = [
  "    # PokeMod: switch 674 no longer disables the Bag in internal battles.",
  "    # Keep the original rule for external/special battle systems.",
  "    if !@internalBattle",
].join("\r\n");
const MENU_MARKER = "switch 674 no longer disables";

function sectionCode(scripts, name) {
  const row = scripts.find((entry) => text(entry[1]) === name);
  if (!row) throw new Error(`No se encontró la sección ${name} en Scripts.rxdata`);
  return { row, code: zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8") };
}
function storeCode(row, code) {
  row[2].bytes = Uint8Array.from(zlib.deflateSync(Buffer.from(code, "utf8")));
}
function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  const target = path.join(BACKUP, "Scripts.rxdata");
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(DATA, "Scripts.rxdata"), target);
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), "Scripts.rxdata anterior a la Mochila libre del Grandeur Club. Restaura este archivo sobre Data/ para revertir el parche.\n");
}
function install() {
  const scripts = read("Scripts.rxdata");
  let changed = false;
  const use = sectionCode(scripts, "Battle_Action_UseItem");
  if (!use.code.includes(USE_MARKER)) {
    if (!use.code.includes(OLD_USE_GUARD)) throw new Error("Battle_Action_UseItem no contiene la comprobación original del switch 674");
    storeCode(use.row, use.code.replace(OLD_USE_GUARD, NEW_USE_GUARD));
    changed = true;
  }
  const menu = sectionCode(scripts, "Battle_Phase_Command");
  if (!menu.code.includes(MENU_MARKER)) {
    if (!menu.code.includes(OLD_MENU_GUARD)) throw new Error("Battle_Phase_Command no contiene la comprobación original del switch 674");
    storeCode(menu.row, menu.code.replace(OLD_MENU_GUARD, NEW_MENU_GUARD));
    changed = true;
  }
  if (changed) write("Scripts.rxdata", scripts);
  return changed;
}

function methodBody(code, signature) {
  const start = code.indexOf(signature);
  if (start < 0) return "";
  const rest = code.slice(start);
  const end = rest.search(/\r?\n  def /);
  return end < 0 ? rest : rest.slice(0, end);
}
function towerBagLocks() {
  const locks = [];
  for (const mapId of TOWER_MAPS) {
    const parsed = parseMap(read(`Map${String(mapId).padStart(3, "0")}.rxdata`));
    for (const { obj } of parsed.events) {
      const event = parseEvent(obj);
      for (const page of event.pages) for (const command of page.list) {
        const cmd = cmdOf(command);
        if (cmd.code !== 121) continue;
        const [from, to, operation] = cmd.params.map(Number);
        if (operation === 0 && from <= 674 && 674 <= to) locks.push({ mapId, eventId: event.id, name: event.name, page: page.index });
      }
    }
  }
  return locks;
}
function oakLabTowerDoor() {
  const parsed = parseMap(read(`Map${String(OAK_LAB).padStart(3, "0")}.rxdata`));
  for (const { obj } of parsed.events) {
    const event = parseEvent(obj);
    for (const page of event.pages) {
      const gated = page.condition?.switch1 === 429 || page.condition?.switch2 === 429;
      const transfers = page.list.map(cmdOf).filter((cmd) => cmd.code === 201 && Number(cmd.params[1]) === 141);
      if (gated && transfers.length) return { eventId: event.id, page: page.index };
    }
  }
  return null;
}
function verify() {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };
  const scripts = read("Scripts.rxdata");
  const use = sectionCode(scripts, "Battle_Action_UseItem");
  const useBody = methodBody(use.code, "def pbCanUseItemOnPokemon?");
  ok(useBody.length > 0, "no se encontró pbCanUseItemOnPokemon?");
  ok(use.code.includes(USE_MARKER), "falta el parche de Battle_Action_UseItem");
  ok(!/\$game_switches\s*\[\s*674\s*\]/.test(useBody), "pbCanUseItemOnPokemon? todavía consulta el switch 674");
  ok(useBody.includes("itemsRemaining == 0"), "pbCanUseItemOnPokemon? perdió el límite de objetos por combate");
  ok(useBody.includes("PBEffects::Embargo"), "pbCanUseItemOnPokemon? perdió la regla de Embargo");
  const menu = sectionCode(scripts, "Battle_Phase_Command");
  const menuBody = methodBody(menu.code, "def pbItemMenu");
  ok(menu.code.includes(MENU_MARKER), "falta el parche de Battle_Phase_Command");
  ok(!/\$game_switches\s*\[\s*674\s*\]/.test(menuBody), "pbItemMenu todavía consulta el switch 674");
  ok(menuBody.includes("if !@internalBattle"), "pbItemMenu perdió la regla de combates externos");
  for (const entry of scripts) {
    if (!(entry[2] instanceof RString)) continue;
    let code = "";
    try { code = zlib.inflateSync(Buffer.from(entry[2].bytes)).toString("utf8"); } catch { errors.push(`sección ${text(entry[1])} ilegible`); continue; }
    if (/\$game_switches\s*\[\s*674\s*\]/.test(code)) errors.push(`la sección ${text(entry[1])} aún consulta el switch 674`);
  }
  const door = oakLabTowerDoor();
  ok(door, "el laboratorio de Oak no conserva el transportador a la torre (mapa 141) condicionado por el switch 429");
  const locks = towerBagLocks();
  ok(locks.length === 8, `la torre debería conservar sus 8 activaciones originales del switch 674 (7 dobles 674-675 y 1 simple) y tiene ${locks.length}`);
  if (errors.length) throw new Error(`Mochila libre inválida (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: la Mochila funciona dentro de la torre del laboratorio de Oak (transportador evento ${door.eventId}, mapas ${TOWER_MAPS.join("/")}); ${locks.length} activaciones del switch 674 conservadas pero inofensivas; 0 secciones de script consultan el switch 674.`);
}

if (!VERIFY_ONLY) {
  backup();
  const changed = install();
  console.log(changed ? `Parche aplicado a Scripts.rxdata. Backup: ${path.relative(ROOT, BACKUP)}` : "Scripts.rxdata ya contenía la Mochila libre; sin cambios.");
}
verify();
