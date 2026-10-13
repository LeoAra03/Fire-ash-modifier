#!/usr/bin/env node
/**
 * apply_graficos_safety.mjs
 *
 * «Muchas crash movimiento z.»
 *
 * La Z del mapa es `Input::SPECIAL` → `pbUseKeyItem` (UI_ReadyMenu). Ese método
 * lee los objetos registrados de la PARTIDA y los busca con `GameData::Item.get`,
 * que lanza un error si el id ya no existe en los datos (los parches del DLC
 * renombran/retiran ítems). Resultado: menú con Z = error en mitad del mapa.
 *
 * Este aplicador inyecta la sección Ruby `PokeMod_Graficos`
 * (tools/lib/pokemod_graficos.rb) que limpia la lista de ids inválidos, deja
 * `registeredIndex` siempre válido y convierte cualquier fallo del menú en un
 * mensaje en pantalla en vez de la pantalla de error de RGSS.
 *
 * Uso:
 *   node tools/apply_graficos_safety.mjs            # aplica
 *   node tools/apply_graficos_safety.mjs --verify   # solo comprueba
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERIFY_ONLY = process.argv.includes("--verify");
const TITULO = "PokeMod_Graficos";
const RUBY = fs.readFileSync(new URL("./lib/pokemod_graficos.rb", import.meta.url), "utf8");

const SCRIPTS = [
  path.join(ROOT, "pokemon_fire_ash", "Data", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA", "Data", "Scripts.rxdata"),
].filter((f) => fs.existsSync(f));

const ESPERADOS = [
  "module PokeModGraficos",
  "def buscarPorCaja",
  "def arreglarTilesetDelMapa",
  "pokemod_orig_setup",
  "pokemod_orig_load_bitmap",
  "pokemod_orig_pbGetTileset",
];

function inyectar(archivo) {
  const scripts = marshalLoad(fs.readFileSync(archivo));
  const comprimido = zlib.deflateSync(Buffer.from(RUBY, "utf-8"));
  const idx = scripts.findIndex(([, t]) => t && t.text === TITULO);
  if (idx >= 0) scripts[idx][2] = new RString(comprimido);
  // Antes de la última sección (Main), como el resto de secciones PokeMod.
  else scripts.splice(scripts.length - 1, 0, [999903, RString.fromText(TITULO), new RString(comprimido)]);
  fs.writeFileSync(archivo, Buffer.from(marshalDump(scripts)));
  return idx >= 0;
}

function verificar(archivo) {
  const fallos = [];
  const scripts = marshalLoad(fs.readFileSync(archivo));
  const seccion = scripts.find(([, t]) => t && t.text === TITULO);
  if (!seccion) return [`${archivo}: falta la sección ${TITULO}`];
  let code = "";
  try { code = zlib.inflateSync(Buffer.from(seccion[2].bytes)).toString("utf8"); }
  catch { return [`${archivo}: la sección ${TITULO} no se puede descomprimir`]; }
  for (const e of ESPERADOS) if (!code.includes(e)) fallos.push(`${archivo}: falta «${e}»`);
  // La sección tiene que ir ANTES de Main (si no, se cargaría después del bucle)
  const iSec = scripts.findIndex(([, t]) => t && t.text === TITULO);
  const iMain = scripts.findIndex(([, t]) => t && t.text === "Main");
  if (iMain >= 0 && iSec > iMain) fallos.push(`${archivo}: ${TITULO} está después de Main`);
  return fallos;
}

let fallos = [];
let cambios = 0;
for (const archivo of SCRIPTS) {
  const rel = path.relative(ROOT, archivo);
  if (VERIFY_ONLY) {
    const f = verificar(archivo);
    fallos = fallos.concat(f);
    console.log(`${f.length ? "✘" : "✔"} ${rel}${f.length ? ` → ${f.join(" · ")}` : ""}`);
    continue;
  }
  const ya = inyectar(archivo);
  cambios += ya ? 0 : 1;
  const f = verificar(archivo);
  fallos = fallos.concat(f);
  console.log(`${f.length ? "✘" : "✔"} ${rel}: ${ya ? "sección actualizada" : "sección añadida"}`);
}

if (VERIFY_ONLY) {
  console.log(fallos.length ? `\n✘ ${fallos.length} problema(s)` : "\n✔ parche de gráficos presente y correcto");
  process.exit(fallos.length ? 1 : 0);
}
console.log(`\n✔ ${SCRIPTS.length} Scripts.rxdata con PokeMod_Graficos (${cambios} nuevos)`);
process.exit(fallos.length ? 1 : 0);
