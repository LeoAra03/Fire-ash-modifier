#!/usr/bin/env node
/**
 * ruby_syntax_full_check.mjs
 *
 * Compila **todas** las secciones Ruby de cada `Scripts.rxdata` con el Ruby WASM
 * del repo, no sólo la lista fija de secciones PokeMod que revisa
 * `tools/qa/ruby_syntax_check.mjs`.
 *
 * Por qué existe: la fase 39 (`docs/DEFINICION_DE_TERMINADO_SCRIPTS.md`) midió que
 * el verificador de lista fija pasaba en verde mientras la sección «Grandeur Club»
 * de la copia de desarrollo tenía una `end` sobrante y no compilaba. Una sección
 * que no está en la lista fija no quedaba cubierta, y el fallo aparecía en mitad
 * de una partida. Este verificador cierra ese hueco: 409/409 secciones o falla.
 *
 * Uso:
 *   node tools/qa/ruby_syntax_full_check.mjs                  # los cuatro paquetes
 *   node tools/qa/ruby_syntax_full_check.mjs --json           # salida legible por máquina
 *   node tools/qa/ruby_syntax_full_check.mjs <ruta.rxdata>    # sólo ese paquete
 *   npm run verify:ruby:full
 *
 * Sale con 0 si todas las secciones de todos los paquetes compilados son Ruby
 * válido, y con 1 en cuanto una no lo es. Si `@ruby/wasm-wasi` no está instalado
 * se salta con 0, igual que el verificador de lista fija (no hay Ruby que valga
 * sin él), y lo dice en voz alta.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(ROOT, "package.json"));

/** Paquetes que se revisan por defecto: la copia de desarrollo y las tres de distribución. */
const PAQUETES = [
  "pokemon_fire_ash/Data/Scripts.rxdata",
  "Scripts_corregido/Scripts.rxdata",
  "Scripts_corregido/Paquete_directo/Data/Scripts.rxdata",
  "Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata",
];

const argv = process.argv.slice(2);
const JSON_OUT = argv.includes("--json");
const posicionales = argv.filter((a) => !a.startsWith("--"));
const objetivos = posicionales.length ? posicionales : PAQUETES;

const wasm = path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm");
if (!fs.existsSync(wasm)) {
  const mensaje = "· @ruby/wasm-wasi no está instalado: se salta la compilación completa de secciones Ruby.";
  if (JSON_OUT) console.log(JSON.stringify({ saltado: true, motivo: "@ruby/wasm-wasi ausente", paquetes: [] }, null, 2));
  else console.log(mensaje);
  process.exit(0);
}

const { DefaultRubyVM } = require("@ruby/wasm-wasi/dist/node");
const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasm)));

/** Un heredoc por sección: el Ruby WASM no ve el sistema de archivos del host. */
function compilar(code) {
  let delimitador = "__POKEMOD_RB__";
  let n = 0;
  while (code.includes(delimitador)) delimitador = `__POKEMOD_RB_${++n}__`;
  const programa = [
    "begin",
    `  RubyVM::InstructionSequence.compile(<<'${delimitador}')`,
    code,
    delimitador,
    '  "ok"',
    "rescue SyntaxError => e",
    "  e.message",
    "end",
  ].join("\n");
  try { return vm.eval(programa).toString(); }
  catch (error) { return String(error?.message || error); }
}

const tituloDe = (valor) => (valor && typeof valor.text === "string" ? valor.text : String(valor ?? ""));

const resultados = [];
let seccionesTotales = 0;
let fallosTotales = 0;

for (const objetivo of objetivos) {
  const archivo = path.isAbsolute(objetivo) ? objetivo : path.join(ROOT, objetivo);
  const relativo = path.relative(ROOT, archivo) || objetivo;
  if (!fs.existsSync(archivo)) {
    if (!JSON_OUT) console.error(`✘ ${relativo}: no existe el archivo`);
    resultados.push({ paquete: relativo, existe: false, secciones: 0, revisadas: 0, fallos: [] });
    fallosTotales++;
    continue;
  }

  let secs;
  try { secs = marshalLoad(fs.readFileSync(archivo)); }
  catch (error) {
    if (!JSON_OUT) console.error(`✘ ${relativo}: no se puede leer como Marshal (${error?.message || error})`);
    resultados.push({ paquete: relativo, existe: true, secciones: 0, revisadas: 0, fallos: [{ seccion: "(archivo)", error: String(error?.message || error) }] });
    fallosTotales++;
    continue;
  }

  const fallos = [];
  let revisadas = 0;
  let indice = 0;
  for (const entrada of secs) {
    indice++;
    seccionesTotales++;
    const titulo = tituloDe(entrada[1]) || `(sin título #${indice})`;
    const comprimido = entrada[2]?.bytes;
    if (!comprimido || !comprimido.length) continue; // sección vacía: nada que compilar
    let code;
    try { code = zlib.inflateSync(Buffer.from(comprimido)).toString("utf8"); }
    catch (error) {
      fallos.push({ seccion: titulo, linea: null, error: `no se puede descomprimir: ${error?.message || error}` });
      continue;
    }
    if (!code.trim()) continue;
    revisadas++;
    const salida = compilar(code);
    if (salida !== "ok") {
      const primera = salida.split("\n").find((l) => l.trim()) || salida;
      const linea = /:(\d+):/.exec(primera)?.[1] ?? null;
      fallos.push({ seccion: titulo, linea: linea ? Number(linea) : null, error: primera.trim() });
    }
  }

  fallosTotales += fallos.length;
  resultados.push({ paquete: relativo, existe: true, secciones: secs.length, revisadas, fallos });
  if (!JSON_OUT) {
    if (fallos.length) {
      console.error(`✘ ${relativo} · ${revisadas - fallos.length}/${revisadas} secciones compilan`);
      for (const f of fallos) console.error(`   · «${f.seccion}»${f.linea ? ` línea ${f.linea}` : ""}: ${f.error}`);
    } else {
      console.log(`✔ ${relativo} · ${revisadas}/${revisadas} secciones compilan`);
    }
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    saltado: false,
    secciones_totales: seccionesTotales,
    secciones_revisadas: resultados.reduce((a, r) => a + r.revisadas, 0),
    fallos: fallosTotales,
    paquetes: resultados,
  }, null, 2));
} else {
  const revisadas = resultados.reduce((a, r) => a + r.revisadas, 0);
  console.log(`\n${revisadas} sección(es) Ruby compiladas en ${resultados.length} paquete(s) · `
    + (fallosTotales ? `✘ ${fallosTotales} con error de sintaxis` : "✔ todas válidas"));
}
process.exit(fallosTotales ? 1 : 0);
