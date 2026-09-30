#!/usr/bin/env node
/**
 * Corrige las rutas de ajustes auxiliares de Fire Ash para PC y Android.
 *
 * Algunas instalaciones no crean la carpeta relativa "Save Files". El juego
 * guardaba allí PokemonSystemSettings.dat antes de guardar la partida y
 * terminaba con Errno::ENOENT. Los dos archivos auxiliares se guardan ahora
 * junto al archivo principal Game.rxdata, cuya carpeta ya conoce SaveData.
 *
 * Uso:
 *   node tools/apply_save_path_fix.mjs
 *   node tools/apply_save_path_fix.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const FILE = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
const VERIFY_ONLY = process.argv.includes("--verify");
const text = (value) => value instanceof RString ? value.text : String(value ?? "");
const inflate = (row) => zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
const section = (scripts, name) => scripts.find((row) => text(row[1]) === name);
const setCode = (row, code) => { row[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(code, "utf8"))); };

const patches = [
  {
    section: "StartGame",
    old: '  SYSTEM_SETTINGS_FILE = "Save Files/PokemonSystemSettings.dat"   # Added by: kraegon',
    alreadyApplied: (code) => code.includes('SYSTEM_SETTINGS_FILE = File.join(File.dirname(SaveData::FILE_PATH), "PokemonSystemSettings.dat")'),
    replacement: [
      "  # Guarda este ajuste junto a la partida para que funcione también en Android.",
      '  SYSTEM_SETTINGS_FILE = File.join(File.dirname(SaveData::FILE_PATH), "PokemonSystemSettings.dat")',
    ].join("\r\n"),
  },
  {
    section: "BetterFastForward",
    old: 'SPEED_SETTING_FILE = "Save Files/GameSpeedSetting.dat"',
    alreadyApplied: (code) => code.includes('SPEED_SETTING_FILE = File.join(File.dirname(SaveData::FILE_PATH), "GameSpeedSetting.dat")'),
    replacement: [
      "# La carpeta Save Files no existe en algunas instalaciones de Kirin/Android.",
      'SPEED_SETTING_FILE = File.join(File.dirname(SaveData::FILE_PATH), "GameSpeedSetting.dat")',
    ].join("\r\n"),
  },
  {
    section: "StartGame",
    old: [
      "    # Es un ajuste opcional: si el dispositivo no permite crear este archivo,",
      "    # la partida principal debe continuar guardándose con normalidad.",
      "    begin",
      "      save_data($PokemonSystem, SYSTEM_SETTINGS_FILE)",
      "    rescue IOError, SystemCallError",
      "      # Ignorar el ajuste auxiliar en instalaciones Android de solo acceso.",
      "    end",
    ].join("\r\n"),
    alreadyApplied: (code) => !code.includes("save_data($PokemonSystem, SYSTEM_SETTINGS_FILE)") &&
      code.includes("SaveData.save_to_file(save_file)"),
    replacement: [
      "    # PokemonSystemSettings.dat es opcional y algunas instalaciones Android",
      "    # no permiten crear archivos auxiliares junto a la carpeta del juego.",
      "    # La partida principal se guarda abajo mediante SaveData.save_to_file.",
    ].join("\r\n"),
  },
  {
    section: "BetterFastForward",
    old: [
      "def save_speed_setting(speed)",
      "    begin",
      "        save_data(speed, SPEED_SETTING_FILE)",
      "    rescue IOError, SystemCallError",
      "        # El guardado de velocidad no debe interrumpir el juego.",
      "    end",
      "end",
    ].join("\r\n"),
    alreadyApplied: (code) => !code.includes("save_data(speed, SPEED_SETTING_FILE)") &&
      /def save_speed_setting\(speed\)[\s\S]*?end/.test(code),
    replacement: [
      "def save_speed_setting(speed)",
      "    # El ajuste de velocidad es opcional y no se escribe en Android.",
      "end",
    ].join("\r\n"),
  },
];

const scripts = marshalLoad(fs.readFileSync(FILE));
let changed = 0;
for (const patch of patches) {
  const row = section(scripts, patch.section);
  if (!row) throw new Error(`No se encontró la sección ${patch.section}`);
  const code = inflate(row);
  if (code.includes(patch.replacement) || patch.alreadyApplied?.(code)) continue;
  if (!code.includes(patch.old)) throw new Error(`${patch.section}: no se encontró la ruta de ajustes esperada`);
  if (!VERIFY_ONLY) setCode(row, code.replace(patch.old, patch.replacement));
  changed++;
}

if (VERIFY_ONLY) {
  if (changed !== 0) throw new Error("Scripts_corregido/Scripts.rxdata todavía usa la carpeta Save Files");
  console.log("OK: PokemonSystemSettings.dat ya no se escribe como archivo auxiliar");
  console.log("OK: GameSpeedSetting.dat ya no se escribe como archivo auxiliar");
} else {
  fs.writeFileSync(FILE, Buffer.from(marshalDump(scripts)));
  console.log(`Scripts_corregido/Scripts.rxdata actualizado (${changed} rutas de guardado)`);
}
