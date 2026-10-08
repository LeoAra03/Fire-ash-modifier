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
 *   · `PokeBattle_Move_DF08#pbAttackingTurnEffect` (Ball Breaker, el movimiento de
 *     dos turnos del Metagross de Steven, que exigía `selfProtected?`/`sideProtected?`)
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

function readSection(file, name = SECTION) {
  const scripts = marshalLoad(fs.readFileSync(file));
  const row = scripts.find((entry) => (entry[1]?.text ?? String(entry[1])) === name);
  if (!row) throw new Error(`No se encontró la sección ${name} en ${file}`);
  return zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
}

const DF08_SECTION = "Despacito Despair";

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
const df08Ruby = readSection(scriptsFile, DF08_SECTION);
if (!modRuby.includes("class PokeBattle_Move_DF08")) {
  console.log("FALLO: la sección instalada no blinda PokeBattle_Move_DF08 (Ball Breaker).");
  process.exit(1);
}
const scenarios = fs.readFileSync(path.join(ROOT, "tools/qa/arceus_shield_scenarios.rb"), "utf8");

const extraction = String.raw`
require "base64"
require "json"
SRC = Base64.decode64("__B64__")

WANTED = {
  "PokeBattle_Battler" => ["ruta_arceus_scripted_hp_write", "ruta_arceus_divine_boss?",
                           "hp=", "pbReduceHP", "pbFaint",
                           "ruta_arceus_cinematic_boss?", "ruta_arceus_immune_target?",
                           "selfProtected?", "sideProtected?"],
  "PokeBattle_Battle"  => ["arceus_battler", "arceus_divine?", "arceus_cinematic?",
                           "arceus_cinematic_damage", "pbArceusCinematicAbsorb",
                           "pbArceusCinematicRebirth", "arceus_state", "save_arceus_state",
                           "arceus_player_action?", "arceus_action_key", "arceus_before_damage",
                           "pbArceusDivineBarDamage", "pbArceusDepleteBar", "pbArceusRedlineHeal",
                           "check_arceus_phase", "pbArceusAnimateHP",
                           "ruta_arceus_ash_side?", "ruta_arceus_ash_first_active?",
                           "ruta_arceus_apply_ohko_guard", "ruta_arceus_ash_bar_damage",
                           "ruta_arceus_mega?", "ruta_arceus_mega_aparicion",
                           "ruta_arceus_primigenia?", "ruta_arceus_primigenia_aparicion",
                           "pbCalculatePriority"],
  "PokeBattle_Move"    => ["ruta_arceus_cinematic_boss_target?", "ruta_arceus_divine_boss_target?",
                           "pbInflictHPDamage"]
}

lines = SRC.split("\n")
found = {}
modulos = {}
clases = {}
walk = nil
walk = lambda do |node|
  next if !node.is_a?(RubyVM::AbstractSyntaxTree::Node)
  if node.type == :DEFN
    found[node.children[0].to_s] = [node.first_lineno, node.last_lineno]
  elsif node.type == :MODULE || node.type == :CLASS
    nombre = lines[node.first_lineno - 1].to_s[/\A\s*(?:module|class)\s+([A-Za-z_][A-Za-z0-9_:]*)/, 1]
    if nombre
      destino = (node.type == :MODULE) ? modulos : clases
      destino[nombre] = [node.first_lineno, node.last_lineno]
    end
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
mods = {}
modulos.each { |nombre, rango| mods[nombre] = lines[(rango[0] - 1)..(rango[1] - 1)].join("\n") }
clases_fuente = {}
clases.each { |nombre, rango| clases_fuente[nombre] = lines[(rango[0] - 1)..(rango[1] - 1)].join("\n") }
(!missing.empty?) ? "FALTAN:#{missing.join(",")}" : JSON.generate({ "metodos" => sources, "modulos" => mods, "clases" => clases_fuente })
`;

const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasm)));

const extracted = vm
  .eval(extraction.replace("__B64__", Buffer.from(modRuby, "utf8").toString("base64")))
  .toString();
if (extracted.startsWith("FALTAN:")) {
  console.log(`FALLO: faltan métodos en la sección instalada: ${extracted.slice(7)}`);
  process.exit(1);
}
const { metodos: methodSources, modulos: moduleSources, clases: classSources } = JSON.parse(extracted);
moduleSources.clases = classSources;
if (!moduleSources.RutaDeDiosBallBreaker) {
  console.log("FALLO: la sección instalada no trae el módulo RutaDeDiosBallBreaker");
  process.exit(1);
}

// Clase REAL del juego (Ball Breaker, sección Despacito Despair): el arnés la
// ejecuta tal cual viene instalada para reproducir el NoMethodError original.
const df08Extraction = String.raw`
require "base64"
require "json"
SRC_DF08 = Base64.decode64("__B64__")
lines = SRC_DF08.split("\n")
rango = nil
buscar = lambda do |node|
  next if !node.is_a?(RubyVM::AbstractSyntaxTree::Node)
  if node.type == :CLASS
    nombre = lines[node.first_lineno - 1].to_s[/\A\s*class\s+([A-Za-z_][A-Za-z0-9_:]*)/, 1]
    rango = [node.first_lineno, node.last_lineno] if nombre == "PokeBattle_Move_DF08"
  end
  node.children.each { |child| buscar.call(child) }
end
buscar.call(RubyVM::AbstractSyntaxTree.parse(SRC_DF08))
rango.nil? ? "FALTA_CLASE" : lines[(rango[0] - 1)..(rango[1] - 1)].join("\n")
`;
const df08Source = vm
  .eval(df08Extraction.replace("__B64__", Buffer.from(df08Ruby, "utf8").toString("base64")))
  .toString();
if (df08Source === "FALTA_CLASE") {
  console.log(`FALLO: no se encontró PokeBattle_Move_DF08 en la sección ${DF08_SECTION}`);
  process.exit(1);
}

// La versión blindada que viaja en la sección instalada, renombrada para poder
// probarla al lado de la del juego sin pisarla.
const hardenedSource = moduleSources.clases["PokeBattle_Move_DF08"];
if (!hardenedSource) {
  console.log("FALLO: la sección instalada no reescribe PokeBattle_Move_DF08");
  process.exit(1);
}
const hardenedDf08 = hardenedSource.replace(
  /^(\s*)class\s+PokeBattle_Move_DF08\b.*$/m,
  "$1class PokeBattle_Move_DF08Ruta < PokeBattle_TwoTurnMove",
);
if (!hardenedDf08.includes("PokeBattle_Move_DF08Ruta")) {
  console.log("FALLO: no se pudo preparar la versión blindada de Ball Breaker");
  process.exit(1);
}

const [stubs, checks] = scenarios.split(/^__METODOS__$/m);
if (!checks) {
  console.log("FALLO: falta la marca __METODOS__ en tools/qa/arceus_shield_scenarios.rb");
  process.exit(1);
}
const program = [
  stubs,
  moduleSources.RutaDeDiosBallBreaker,
  `class PokeBattle_Battler\n${methodSources["PokeBattle_Battler"]}\nend`,
  `class PokeBattle_Battle\n${methodSources["PokeBattle_Battle"]}\nend`,
  `class PokeBattle_Move\n${methodSources["PokeBattle_Move"]}\nend`,
  `# --- PokeBattle_Move_DF08 real de ${DF08_SECTION} ---\n${df08Source}`,
  hardenedDf08,
  checks,
].join("\n\n");

const report = vm.eval(program).toString();
console.log(report);
if (!/0 FALLOS\s*$/.test(report)) process.exit(1);
