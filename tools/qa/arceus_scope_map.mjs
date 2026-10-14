// Sonda de ALCANCE REAL (AST): dónde viven realmente cada def y cada constante
// de la sección instalada. La indentación NO define ámbito en Ruby: sólo las
// palabras class/module/end. Esta sonda revela defs "col 0" que en verdad están
// atrapados dentro de un class...end.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { marshalLoad } from "../../web/js/marshal.js";
import { ROOT } from "../lib/fire_ash_registry.mjs";


function wasmBinaryPath() {
  for (const p of [
    path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm"),
    path.join(ROOT, "node_modules/@ruby/wasm-wasi/dist/ruby+stdlib.wasm"),
  ]) if (fs.existsSync(p)) return p;
  return null;
}
const require = createRequire(import.meta.url);
const { DefaultRubyVM } = require("@ruby/wasm-wasi/dist/node");

const posicionales = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const scripts = marshalLoad(fs.readFileSync(path.join(ROOT, posicionales[0] || "pokemon_fire_ash/Data/Scripts.rxdata")));
const nombre = posicionales[1] || "PokeMod_RutaDeDios";
const entrada = scripts.find(([, t]) => t && t.text === nombre);
const src = zlib.inflateSync(Buffer.from(entrada[2].bytes)).toString("utf8");

const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasmBinaryPath())));
const ruby = `
require "json"
src = Base64.decode64("__B64__").force_encoding("UTF-8")
raiz = RubyVM::AbstractSyntaxTree.parse(src)
salida = []
pila = []
walk = lambda do |nodo|
  break if nodo.nil?
  case nodo.type
  when :CLASS, :MODULE
    nombre = nodo.children[0]
    etiqueta = nombre.respond_to?(:children) ? nombre.children.compact.map(&:to_s).join("::") : nombre.to_s
    pila.push(etiqueta)
    nodo.children.each { |h| walk.call(h) if h.is_a?(RubyVM::AbstractSyntaxTree::Node) }
    pila.pop
    break
  when :SCLASS
    pila.push("<sclass>")
    nodo.children.each { |h| walk.call(h) if h.is_a?(RubyVM::AbstractSyntaxTree::Node) }
    pila.pop
    break
  when :DEFN
    salida << [pila.dup, nodo.children[0].to_s, nodo.first_lineno, "def"]
  when :DEFS
    salida << [pila.dup, nodo.children[1].to_s, nodo.first_lineno, "def"]
  when :CDECL, :CASGN
    nombre_const = nodo.type == :CDECL ? nodo.children[0] : nodo.children[1]
    salida << [pila.dup, nombre_const.to_s, nodo.first_lineno, "const"]
  end
  nodo.children.each { |h| walk.call(h) if h.is_a?(RubyVM::AbstractSyntaxTree::Node) }
end
walk.call(raiz)
JSON.generate(salida)
`.replace("__B64__", Buffer.from(src, "utf8").toString("base64"));
const json = JSON.parse(vm.eval(`require "base64"; require "json"; ` + ruby).toString());
const lineas = src.split("\n");
const MANDATORIOS_TOP = [
  "pbStartArceusDivineBattle", "pbArceusBuildLegendario", "pbArceusMoveIds",
  "pbArceusRotomMercy", "pbArceusSurrenderSequence", "pbArceusNormalizeCaptured",
  "pbArceusCinematicPrelude", "pbArceusCinematicCpuBattle",
  "RUTA_ARCEUS_SEQUITO", "RUTA_ARCEUS_INVOCACIONES", "RUTA_ARCEUS_MOVE_SETS",
];
if (process.argv.includes("--audit")) {
  const violaciones = [];
  for (const [scope, name, line, kind] of json) {
    const intencionTop = /^\S/.test(lineas[line - 1] || "");
    if (scope.length > 0 && intencionTop) {
      violaciones.push(`${kind} ${name} (línea ${line}) parece de nivel superior pero vive dentro de ${scope.join(" > ")}`);
    }
  }
  if (nombre === "PokeMod_RutaDeDios") {
    for (const obligatorio of MANDATORIOS_TOP) {
      const item = json.find(([, n]) => n === obligatorio);
      if (!item) violaciones.push(`falta por completo: ${obligatorio}`);
      else if (item[0].length > 0) violaciones.push(`${obligatorio} debe vivir al nivel superior y vive en ${item[0].join(" > ")}`);
    }
  }
  if (violaciones.length) {
    console.log(`✘ ALCANCE R15b (${nombre}): ${violaciones.length} violaciones`);
    for (const v of violaciones) console.log(`  · ${v}`);
    process.exit(1);
  }
  console.log(`✔ ALCANCE R15b (${nombre}): ${json.length} defs/constantes; todo lo que parece de nivel superior lo es de verdad.`);
  process.exit(0);
}
const anidados = json.filter(([scope]) => scope.length > 0);
console.log(`sección ${nombre}: ${json.length} defs/constantes · ${anidados.length} ANIDADOS`);
for (const [scope, name, line, kind] of anidados) {
  console.log(`  ${kind} ${name} (línea ${line}) dentro de: ${scope.join(" > ")}`);
}
const top = json.filter(([scope]) => scope.length === 0 && (name => /BuildLegendario|SEQUITO/.test(name))(json[0][1]) );
for (const [scope, name, line, kind] of json) {
  if (/BuildLegendario|SEQUITO|StartArceusDivineBattle/.test(name)) {
    console.log(`  >> ${kind} ${name} línea ${line} scope=[${scope.join(" > ")}]`);
  }
}
