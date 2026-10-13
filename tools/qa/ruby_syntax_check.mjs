#!/usr/bin/env node
/**
 * ruby_syntax_check.mjs
 *
 * Comprueba con el Ruby WASM del repo que las secciones Ruby que PokeMod inyecta
 * en `Scripts.rxdata` (cajas de diálogo, parche del botón Z, atavíos, regiones)
 * son Ruby válido. Un error de sintaxis aquí dejaría al juego sin cargar la
 * sección y el fallo aparecería en pleno mapa, no al instalar.
 *
 * Uso:
 *   node tools/qa/ruby_syntax_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(ROOT, "package.json"));

const SECCIONES = [
  ["pokemon_fire_ash/Data/Scripts.rxdata", ["PokeMod_Dialogos", "PokeMod_ZMenu", "PokeMod_Graficos", "PokeMod_Atavios", "PokeMod_BadgeRegions", "PokeMod_CanonArceus"]],
  ["Scripts_corregido/Scripts.rxdata", ["PokeMod_Dialogos", "PokeMod_ZMenu", "PokeMod_Graficos", "PokeMod_Atavios", "PokeMod_BadgeRegions", "PokeMod_CanonArceus"]],
  ["Scripts_corregido/Paquete_directo/Data/Scripts.rxdata", ["PokeMod_Dialogos", "PokeMod_ZMenu", "PokeMod_Graficos"]],
  ["Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata", ["PokeMod_Dialogos", "PokeMod_ZMenu", "PokeMod_Graficos"]],
];

const wasm = path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm");
if (!fs.existsSync(wasm)) {
  console.log("· @ruby/wasm-wasi no está instalado: se salta la comprobación de sintaxis Ruby.");
  process.exit(0);
}
const { DefaultRubyVM } = require("@ruby/wasm-wasi/dist/node");
const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasm)));

let fallos = 0;
let revisados = 0;

for (const [rel, titulos] of SECCIONES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const secs = marshalLoad(fs.readFileSync(file));
  for (const titulo of titulos) {
    const s = secs.find(([, t]) => t && t.text === titulo);
    if (!s) continue; // no todas las secciones van en todos los paquetes
    let code;
    try { code = zlib.inflateSync(Buffer.from(s[2].bytes)).toString("utf8"); }
    catch { console.error(`✘ ${rel} · ${titulo}: no se puede descomprimir`); fallos++; continue; }
    revisados++;
    // El Ruby WASM no ve el sistema de archivos del host: el código va dentro
    // de un heredoc, sin interpolar nada.
    const programa = [
      "begin",
      "  RubyVM::InstructionSequence.compile(<<'__POKEMOD_RB__')",
      code,
      "__POKEMOD_RB__",
      '  "ok"',
      "rescue SyntaxError => e",
      "  e.message",
      "end",
    ].join("\n");
    let out;
    try { out = vm.eval(programa).toString(); }
    catch (e) { out = String(e.message || e); }
    if (out === "ok") console.log(`✔ ${rel} · ${titulo}`);
    else { fallos++; console.error(`✘ ${rel} · ${titulo}\n   ${out.split("\n").slice(0, 4).join("\n   ")}`); }
  }
}
console.log(`\n${revisados} sección(es) Ruby revisadas · ${fallos ? `✘ ${fallos} con error de sintaxis` : "✔ sin errores"}`);
process.exit(fallos ? 1 : 0);
