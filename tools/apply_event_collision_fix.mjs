#!/usr/bin/env node
/**
 * Corrige la colisión de los eventos con gráfico de personaje.
 *
 * El juego trae páginas de evento marcadas como Through en parte del contenido
 * añadido. Eso permite que el jugador atraviese NPCs, entrenadores y objetos
 * con sprite. El parche se aplica en tiempo de ejecución para que también
 * cubra eventos añadidos en el futuro:
 *
 *   - cualquier evento con character_name no vacío ocupa su casilla;
 *   - un evento visible sigue pudiendo activarse con el botón de acción, incluso
 *     si el jugador ya estaba sobre su casilla al cargar un mapa;
 *   - un evento sin gráfico conserva el comportamiento Through normal;
 *   - el cambio no modifica mapas ni partidas guardadas.
 *
 * Uso:
 *   node tools/apply_event_collision_fix.mjs
 *   node tools/apply_event_collision_fix.mjs --verify
 *
 * La salida es el archivo que se entrega para copiar a Data/Scripts.rxdata.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const INPUT = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
const OUTPUT = INPUT;
const VERIFY_ONLY = process.argv.includes("--verify");

const text = (value) => value instanceof RString ? value.text : String(value ?? "");
const section = (scripts, name) => scripts.find((row) => text(row[1]) === name);
const inflate = (row) => zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
const setCode = (row, code) => { row[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(code, "utf8"))); };

function patchGameCharacter(code) {
  const old = "      next if self == event || !event.at_coordinate?(new_x, new_y) || event.through";
  const replacement = [
    "      # Los eventos con gráfico son sólidos aunque su página marque Through.",
    "      # Los eventos invisibles conservan el comportamiento original.",
    "      next if self == event || !event.at_coordinate?(new_x, new_y)",
    "      next if event.through && event.character_name == \"\"",
  ].join("\r\n");
  if (code.includes(replacement)) return { code, changed: false };
  if (!code.includes(old)) throw new Error("Game_Character: no se encontró la comprobación de colisión esperada");
  return { code: code.replace(old, replacement), changed: true };
}

function patchGameEvent(code) {
  const old = "    @through              = @page.through";
  const replacement = [
    "    # Un evento con gráfico ocupa su casilla; Through solo vale para eventos invisibles.",
    "    @through              = @page.through && @character_name == \"\"",
  ].join("\r\n");
  if (code.includes(replacement)) return { code, changed: false };
  if (!code.includes(old)) throw new Error("Game_Event: no se encontró la asignación de Through esperada");
  return { code: code.replace(old, replacement), changed: true };
}

function patchGamePlayer(code) {
  const old = "next if event.jumping? || event.over_trigger?";
  const replacement = "next if event.jumping? || (event.over_trigger? && event.character_name == \"\")";
  if (code.includes(replacement)) return { code, changed: false };
  const occurrences = code.split(old).length - 1;
  if (occurrences !== 5) throw new Error(`Game_Player: se esperaban 5 comprobaciones de interacción, se encontraron ${occurrences}`);
  return { code: code.replaceAll(old, replacement), changed: true };
}

function inspect() {
  const scripts = marshalLoad(fs.readFileSync(INPUT));
  const character = section(scripts, "Game_Character");
  const event = section(scripts, "Game_Event");
  const player = section(scripts, "Game_Player");
  if (!character || !event || !player) throw new Error("No se encontraron las secciones de colisión esperadas");
  const characterCode = inflate(character);
  const eventCode = inflate(event);
  const playerCode = inflate(player);
  return {
    scripts,
    characterCode,
    eventCode,
    playerCode,
    characterFixed: characterCode.includes("next if event.through && event.character_name == \"\"")
      && characterCode.includes("Los eventos con gráfico son sólidos"),
    eventFixed: eventCode.includes("@page.through && @character_name == \"\"")
      && eventCode.includes("Un evento con gráfico ocupa su casilla"),
    playerFixed: playerCode.includes(replacementForPlayer())
      && playerCode.includes("event.character_name == \"\""),
  };
}

function replacementForPlayer() {
  return "next if event.jumping? || (event.over_trigger? && event.character_name == \"\")";
}

const state = inspect();
if (VERIFY_ONLY) {
  if (!state.characterFixed || !state.eventFixed || !state.playerFixed) {
    throw new Error("Scripts_corregido/Scripts.rxdata todavía no contiene la corrección completa de colisiones");
  }
  console.log("OK: Game_Character bloquea eventos con sprite aunque estén marcados Through");
  console.log("OK: Game_Event hace sólidos los eventos con character_name");
  console.log("OK: Game_Player conserva la interacción con sprites sólidos");
} else {
  let changes = 0;
  const character = section(state.scripts, "Game_Character");
  const event = section(state.scripts, "Game_Event");
  const player = section(state.scripts, "Game_Player");
  const characterPatch = patchGameCharacter(state.characterCode);
  const eventPatch = patchGameEvent(state.eventCode);
  const playerPatch = patchGamePlayer(state.playerCode);
  if (characterPatch.changed) { setCode(character, characterPatch.code); changes++; }
  if (eventPatch.changed) { setCode(event, eventPatch.code); changes++; }
  if (playerPatch.changed) { setCode(player, playerPatch.code); changes++; }
  fs.writeFileSync(OUTPUT, Buffer.from(marshalDump(state.scripts)));
  console.log(`Scripts_corregido/Scripts.rxdata actualizado (${changes} secciones de colisión)`);
}
