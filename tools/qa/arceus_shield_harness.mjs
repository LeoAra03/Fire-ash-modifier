#!/usr/bin/env node
/**
 * arceus_shield_harness.mjs
 *
 * QA *en vivo* de las protecciones de Arceus de La Ruta de Dios. El resto de
 * verificadores del repositorio son estáticos (leen el Ruby instalado y buscan
 * cadenas); este ejecuta el código real dentro de un CRuby (Ruby 3.3 compilado a
 * WebAssembly) sobre clases de prueba que imitan las rutas de daño del motor:
 *
 *   · `PokeBattle_Battler#hp=`            (escrituras directas de PS)
 *   · `PokeBattle_Battler#pbReduceHP`     (granizo, retroceso, daño indirecto)
 *   · `PokeBattle_Move#pbInflictHPDamage` (target.hp -= hpLost de los movimientos)
 *   · `PokeBattle_Battler#pbFaint`
 *
 * Con eso se comprueba que ni el granizo de la cumbre, ni un Metagross, ni una
 * ruta externa (habilidad, movimiento custom, plugin) pueden lastimar al Arceus
 * de las cinemáticas ni derrotar al Arceus divino del duelo de Ash, y que el
 * Arceus capturado o cualquier otro Arceus conserva las reglas normales.
 *
 * Uso:
 *   npm i --no-save @ruby/3.3-wasm-wasi      # dependencia opcional de QA
 *   node tools/qa/arceus_shield_harness.mjs  # lee pokemon_fire_ash/Data/Scripts.rxdata
 *   node tools/qa/arceus_shield_harness.mjs ruta/a/Scripts.rxdata
 *
 * No forma parte de `npm test` porque el binario de Ruby (~36 MB) se descarga
 * aparte; úsalo al tocar la sección PokeMod_RutaDeDios.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SECTION = "PokeMod_RutaDeDios";

function wasmBinaryPath() {
  const candidates = [
    path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm"),
    path.join(ROOT, "node_modules/@ruby/wasm-wasi/dist/ruby+stdlib.wasm"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function readSection(file) {
  const scripts = marshalLoad(fs.readFileSync(file));
  const row = scripts.find((entry) => (entry[1]?.text ?? String(entry[1])) === SECTION);
  if (!row) throw new Error(`No se encontró la sección ${SECTION} en ${file}`);
  return zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
}

const wasm = wasmBinaryPath();
if (!wasm) {
  console.error("Falta el runtime de Ruby para la QA en vivo. Instálalo sin tocar package.json:");
  console.error("  npm i --no-save @ruby/3.3-wasm-wasi");
  process.exit(2);
}
let DefaultRubyVM;
try {
  ({ DefaultRubyVM } = require("@ruby/wasm-wasi/dist/node"));
} catch {
  console.error("No se pudo cargar @ruby/wasm-wasi. Vuelve a ejecutar:");
  console.error("  npm i --no-save @ruby/3.3-wasm-wasi");
  process.exit(2);
}

const scriptsFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, "pokemon_fire_ash/Data/Scripts.rxdata");
const modRuby = readSection(scriptsFile);
const scenarios = fs.readFileSync(path.join(ROOT, "tools/qa/arceus_shield_scenarios.rb"), "utf8");

const extraction = String.raw`
require "base64"
require "json"
SRC = Base64.decode64("__B64__")

WANTED = {
  "PokeBattle_Battler" => ["ruta_arceus_scripted_hp_write", "ruta_arceus_divine_boss?",
                           "hp=", "pbReduceHP", "pbFaint",
                           "ruta_arceus_cinematic_boss?", "ruta_arceus_immune_target?"],
  "PokeBattle_Battle"  => ["arceus_battler", "arceus_divine?", "arceus_cinematic?",
                           "arceus_cinematic_damage", "pbArceusCinematicAbsorb",
                           "pbArceusCinematicRebirth", "arceus_state", "save_arceus_state",
                           "arceus_player_action?", "arceus_action_key", "arceus_before_damage",
                           "pbArceusDivineBarDamage", "pbArceusDepleteBar", "pbArceusRedlineHeal",
                           "check_arceus_phase", "pbArceusAnimateHP"],
  "PokeBattle_Move"    => ["ruta_arceus_cinematic_boss_target?", "ruta_arceus_divine_boss_target?",
                           "pbInflictHPDamage"]
}

lines = SRC.split("\n")
found = {}
walk = nil
walk = lambda do |node|
  next if !node.is_a?(RubyVM::AbstractSyntaxTree::Node)
  if node.type == :DEFN
    found[node.children[0].to_s] = [node.first_lineno, node.last_lineno]
  end
  node.children.each { |child| walk.call(child) }
end
walk.call(RubyVM::AbstractSyntaxTree.parse(SRC))

missing = []
sources = {}
WANTED.each do |klass, names|
  bodies = names.map do |name|
    range = found[name]
    if range.nil?
      missing.push("#{klass}##{name}")
      next nil
    end
    lines[(range[0] - 1)..(range[1] - 1)].join("\n")
  end.compact
  sources[klass] = bodies.join("\n\n")
end
(!missing.empty?) ? "FALTAN:#{missing.join(",")}" : JSON.generate(sources)
`;

const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasm)));

const extracted = vm
  .eval(extraction.replace("__B64__", Buffer.from(modRuby, "utf8").toString("base64")))
  .toString();
if (extracted.startsWith("FALTAN:")) {
  console.log(`FALLO: faltan métodos en la sección instalada: ${extracted.slice(7)}`);
  process.exit(1);
}
const methodSources = JSON.parse(extracted);

const [stubs, checks] = scenarios.split(/^__METODOS__$/m);
if (!checks) {
  console.log("FALLO: falta la marca __METODOS__ en tools/qa/arceus_shield_scenarios.rb");
  process.exit(1);
}
const program = [
  stubs,
  `class PokeBattle_Battler\n${methodSources["PokeBattle_Battler"]}\nend`,
  `class PokeBattle_Battle\n${methodSources["PokeBattle_Battle"]}\nend`,
  `class PokeBattle_Move\n${methodSources["PokeBattle_Move"]}\nend`,
  checks,
].join("\n\n");

const report = vm.eval(program).toString();
console.log(report);
if (!/0 FALLOS\s*$/.test(report)) process.exit(1);
