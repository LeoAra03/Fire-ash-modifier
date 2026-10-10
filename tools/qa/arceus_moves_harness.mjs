#!/usr/bin/env node
/**
 * QA ejecutable del repertorio de Arceus y las invocaciones de La Ruta de Dios.
 * Extrae métodos Ruby de la sección compilada y los corre con CRuby/WASM, usando
 * los moves.dat/species.dat reales del juego para que el filtro no sea una lista
 * de prueba desconectada del contenido instalado.
 *
 * Comprueba: autodaño y huidas excluidos (también al copiar golpes del equipo),
 * rutas de función para cada movimiento del catálogo, puntaje/selección de apoyos
 * y ataques, invocaciones no capturables, y Dragon Tail/Circle Throw sin terminar
 * el wild battle del jefe. No sustituye una partida en RPG Maker: valida el Ruby
 * real, pero sigue necesitando confirmación en el juego para sprites/animación.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";
import { ROOT, stringValue, symbolName, symbolicRecords } from "../lib/fire_ash_registry.mjs";

const require = createRequire(import.meta.url);
const SECTION = "PokeMod_RutaDeDios";
const scriptsFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, "pokemon_fire_ash/Data/Scripts.rxdata");
const wasmCandidates = [
  path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm"),
  path.join(ROOT, "node_modules/@ruby/wasm-wasi/dist/ruby+stdlib.wasm"),
];
const wasmPath = wasmCandidates.find((candidate) => fs.existsSync(candidate));
if (!wasmPath) {
  console.error("Falta el runtime Ruby/WASM. Instálalo sin modificar package.json:");
  console.error("  npm i --no-save @ruby/3.3-wasm-wasi");
  process.exit(2);
}
let DefaultRubyVM;
try {
  ({ DefaultRubyVM } = require("@ruby/wasm-wasi/dist/node"));
} catch (error) {
  console.error(`No se pudo cargar @ruby/wasm-wasi: ${error.message}`);
  process.exit(2);
}

function readSection(file, name = SECTION) {
  assert(fs.existsSync(file), `Falta ${path.relative(ROOT, file)}`);
  const rows = marshalLoad(fs.readFileSync(file));
  const row = rows.find((entry) => (entry[1]?.text ?? String(entry[1])) === name);
  assert(row, `Falta la sección ${name} en ${path.relative(ROOT, file)}`);
  return zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
}

function parseSimpleSymbolArray(ruby, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = ruby.match(new RegExp(`^${escaped}\\s*=\\s*\\[([^\\]]*)\\](?:\\.freeze)?`, "ms"))?.[1];
  assert(block, `No se pudo leer la constante ${name}`);
  return [...block.matchAll(/:([A-Z0-9_]+)/g)].map((match) => match[1]);
}

function parseFunctionArray(ruby, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = ruby.match(new RegExp(`^${escaped}\\s*=\\s*%w\\[([\\s\\S]*?)\\]\\.freeze`, "m"))?.[1];
  assert(block, `No se pudo leer la constante ${name}`);
  return block.trim().split(/\s+/).filter(Boolean);
}

function parsePhaseSets(ruby) {
  const block = ruby.match(/^RUTA_ARCEUS_MOVE_SETS\s*=\s*\[([\s\S]*?)^\]/m)?.[1];
  assert(block, "No se pudo leer RUTA_ARCEUS_MOVE_SETS");
  const rows = [...block.matchAll(/\[([^\[\]]*)\]/g)].map((match) =>
    [...match[1].matchAll(/:([A-Z0-9_]+)/g)].map((move) => move[1]));
  assert.equal(rows.length, 6, "El catálogo debe contener las seis fases");
  return rows;
}

function rubySymbols(values) {
  return `[${values.map((value) => `:${value}`).join(", ")}]`;
}

function rubyNestedSymbols(rows) {
  return `[${rows.map((row) => rubySymbols(row)).join(",\n  ")}]`;
}

const routeRuby = readSection(scriptsFile);
const phaseSets = parsePhaseSets(routeRuby);
const selfDamageMoves = parseSimpleSymbolArray(routeRuby, "RUTA_ARCEUS_SELF_DAMAGING_MOVES");
const selfDamageFunctions = parseFunctionArray(routeRuby, "RUTA_ARCEUS_SELF_DAMAGING_FUNCTIONS");
const scriptBreakingMoves = parseSimpleSymbolArray(routeRuby, "RUTA_ARCEUS_SCRIPT_BREAKING_MOVES");
const scriptBreakingFunctions = parseFunctionArray(routeRuby, "RUTA_ARCEUS_SCRIPT_BREAKING_FUNCTIONS");
const milBrazos = parseSimpleSymbolArray(routeRuby, "RUTA_ARCEUS_MIL_BRAZOS");
const primigeniaMoves = parseSimpleSymbolArray(routeRuby, "RUTA_ARCEUS_PRIMIGENIA_MOVES");
const stageCount = Number(routeRuby.match(/^RUTA_ARCEUS_STAGE_COUNT\s*=\s*(\d+)/m)?.[1]);
assert.equal(stageCount, 6, "El duelo debe mantener seis barras/fases");

const moveRows = symbolicRecords("moves.dat").map(({ id, value }) => ({
  id,
  function_code: stringValue(value.getIvar("function_code")),
  base_damage: Number(value.getIvar("base_damage") ?? 0),
  type: symbolName(value.getIvar("type")) || null,
  accuracy: Number(value.getIvar("accuracy") ?? 100),
  priority: Number(value.getIvar("priority") ?? 0),
  name: stringValue(value.getIvar("name")) || id,
}));
const speciesRow = symbolicRecords("species.dat").find(({ id }) => id === "ARCEUS");
assert(speciesRow, "No existe ARCEUS en species.dat");
const levelMoves = (speciesRow.value.getIvar("moves") ?? []).map((entry) => [
  Number(entry?.[0] ?? 1), symbolName(entry?.[1]),
]).filter((entry) => entry[1]);
const tutorMoves = (speciesRow.value.getIvar("tutor_moves") ?? []).map(symbolName).filter(Boolean);

// Cobertura del dispatcher del motor: toda función que puede recibir Arceus o
// su séquito debe tener clase PokeBattle_Move_XXX instalada en Scripts.rxdata.
const scripts = marshalLoad(fs.readFileSync(scriptsFile));
const moveClasses = new Set();
for (const row of scripts) {
  try {
    const text = zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
    for (const match of text.matchAll(/class\s+PokeBattle_Move_([0-9A-F]{3})\b/g)) moveClasses.add(match[1]);
  } catch {
    // Algunas secciones pueden no ser Ruby/zlib; no forman parte del dispatcher.
  }
}
const movesById = new Map(moveRows.map((move) => [move.id, move]));
const routeMoveIds = new Set([
  ...levelMoves.map((entry) => entry[1]),
  ...tutorMoves,
  ...phaseSets.flat(),
  ...milBrazos,
  ...primigeniaMoves,
]);
const missingMoveData = [...routeMoveIds].filter((id) => !movesById.has(id));
assert.deepEqual(missingMoveData, [], "Hay movimientos de Arceus sin fila en moves.dat");
const missingMoveClasses = [...routeMoveIds]
  .map((id) => movesById.get(id).function_code)
  .filter((code) => code && !moveClasses.has(code));
assert.deepEqual([...new Set(missingMoveClasses)], [], "Falta una clase de efecto de movimiento usada por el repertorio");

// Comprueba que los movimientos peligrosos de su learnset/tutor están realmente
// clasificados, y que las tres rutas de huida del motor no pasan por el catálogo.
const learnable = new Set([...levelMoves.map((entry) => entry[1]), ...tutorMoves]);
const selfDamagingLearnable = [...learnable].filter((id) => {
  const data = movesById.get(id);
  return selfDamageMoves.includes(id) || selfDamageFunctions.includes(data.function_code.toUpperCase());
});
assert.deepEqual(new Set(selfDamagingLearnable), new Set(["HEALINGWISH", "PERISHSONG", "CURSE", "SUBSTITUTE"]),
  "Cambió el conjunto de movimientos de autodaño del learnset/tutor: vuelve a auditar moves.dat");
for (const [id, code] of [["TELEPORT", "0EA"], ["ROAR", "0EB"], ["WHIRLWIND", "0EB"]]) {
  assert(movesById.has(id), `Falta el movimiento ${id}`);
  assert(scriptBreakingMoves.includes(id) && scriptBreakingFunctions.includes(code),
    `${id} ya no está excluido aunque el motor puede cerrar el wild battle`);
  assert.equal(movesById.get(id).function_code.toUpperCase(), code, `Cambió la ruta de ${id}; reaudita su efecto`);
}
for (const id of ["DRAGONTAIL", "CIRCLETHROW"]) {
  assert.equal(movesById.get(id)?.function_code.toUpperCase(), "0EC", `${id} cambió de ruta`);
  assert(routeRuby.includes("class PokeBattle_Move_0EC"), `${id} puede terminar la batalla sin la protección 0EC`);
}

const extraction = String.raw`
require "base64"
require "json"
SRC = Base64.decode64("__B64__")
WANTED = {
  "" => ["pbArceusSelfDamagingMove?", "pbArceusScriptBreakingMove?", "pbArceusSafeMoveIds"],
  "PokeBattle_Battle" => ["pbArceusMoveCatalogIds", "pbArceusStatusMoveScore",
                           "pbArceusAttackScore", "pbArceusScoreMove",
                           "pbArceusChooseSmartMove", "history_resistido?",
                           "pbArceusRememberMove", "pbArceusSmartAction"],
  "PokeBattle_BattleCommon" => ["pbCaptureCalc"],
  "PokeBattle_Move_0EC" => ["pbEffectAgainstTarget"]
}
lines = SRC.split("\n")
found = {}
stack = []
walk = nil
walk = lambda do |node|
  next if !node.is_a?(RubyVM::AbstractSyntaxTree::Node)
  case node.type
  when :CLASS, :MODULE
    named = node.children[0]
    label = named.is_a?(RubyVM::AbstractSyntaxTree::Node) ? named.children.compact.map(&:to_s).join("::") : named.to_s
    stack.push(label)
    node.children.each { |child| walk.call(child) }
    stack.pop
    next
  when :SCLASS
    stack.push("<sclass>")
    node.children.each { |child| walk.call(child) }
    stack.pop
    next
  when :DEFN
    scope = stack.join("::")
    found["#{scope}##{node.children[0]}"] = [node.first_lineno, node.last_lineno]
  end
  node.children.each { |child| walk.call(child) }
end
walk.call(RubyVM::AbstractSyntaxTree.parse(SRC))
missing = []
methods = {}
WANTED.each do |scope, names|
  names.each do |name|
    key = "#{scope}##{name}"
    range = found[key]
    if !range
      missing << key
    else
      methods[key] = lines[(range[0] - 1)..(range[1] - 1)].join("\n")
    end
  end
end
missing.empty? ? JSON.generate(methods) : "MISSING:#{missing.join(",")}"`;

const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasmPath)));
const extracted = vm.eval(extraction.replace("__B64__", Buffer.from(routeRuby).toString("base64"))).toString();
assert(!extracted.startsWith("MISSING:"), `No se pudieron extraer métodos reales: ${extracted}`);
const methods = JSON.parse(extracted);
const method = (scope, name) => methods[`${scope}#${name}`];

const rubyConstants = `
RUTA_ARCEUS_SELF_DAMAGING_MOVES = ${rubySymbols(selfDamageMoves)}.freeze
RUTA_ARCEUS_SELF_DAMAGING_FUNCTIONS = %w[${selfDamageFunctions.join(" ")}].freeze
RUTA_ARCEUS_SCRIPT_BREAKING_MOVES = ${rubySymbols(scriptBreakingMoves)}.freeze
RUTA_ARCEUS_SCRIPT_BREAKING_FUNCTIONS = %w[${scriptBreakingFunctions.join(" ")}].freeze
RUTA_ARCEUS_MOVE_SETS = ${rubyNestedSymbols(phaseSets)}
RUTA_ARCEUS_MIL_BRAZOS = ${rubySymbols(milBrazos)}.freeze
RUTA_ARCEUS_PRIMIGENIA_MOVES = ${rubySymbols(primigeniaMoves)}.freeze
RUTA_ARCEUS_STAGE_COUNT = ${stageCount}
`;
const dataPayload = Buffer.from(JSON.stringify({ moves: moveRows, levelMoves, tutorMoves })).toString("base64");
const objectMethods = [
  method("", "pbArceusSelfDamagingMove?"),
  method("", "pbArceusScriptBreakingMove?"),
  method("", "pbArceusSafeMoveIds"),
].join("\n\n");
const battleMethods = [
  method("PokeBattle_Battle", "pbArceusMoveCatalogIds"),
  method("PokeBattle_Battle", "pbArceusStatusMoveScore"),
  method("PokeBattle_Battle", "pbArceusAttackScore"),
  method("PokeBattle_Battle", "pbArceusScoreMove"),
  method("PokeBattle_Battle", "pbArceusChooseSmartMove"),
  method("PokeBattle_Battle", "history_resistido?"),
  method("PokeBattle_Battle", "pbArceusRememberMove"),
  method("PokeBattle_Battle", "pbArceusSmartAction"),
].join("\n\n");

const prelude = String.raw`
require "base64"
require "json"
QA_DATA = JSON.parse(Base64.decode64("__DATA__"))

def _INTL(text, *args); text; end

module GameData
  MoveEntry = Struct.new(:id, :function_code, :base_damage, :type, :accuracy, :priority, :name)
  SpeciesEntry = Struct.new(:moves, :tutor_moves)
  class Move
    def self.all
      @all ||= QA_DATA.fetch("moves").each_with_object({}) do |row, result|
        id = row.fetch("id").to_sym
        result[id] = MoveEntry.new(id, row["function_code"].to_s,
          row["base_damage"].to_i, row["type"] && row["type"].to_sym,
          row["accuracy"].to_i, row["priority"].to_i, row["name"].to_s)
      end
    end
    def self.exists?(id); all.key?(id.to_sym); end
    def self.get(id); all.fetch(id.to_sym); end
  end
  class Species
    def self.get(id)
      raise "QA sólo contiene el learnset de Arceus" if id.to_sym != :ARCEUS
      levels = QA_DATA.fetch("levelMoves").map { |level, move| [level.to_i, move.to_sym] }
      tutors = QA_DATA.fetch("tutorMoves").map(&:to_sym)
      SpeciesEntry.new(levels, tutors)
    end
  end
end

module Pokemon
  MAX_MOVES = 4
end
module Effectiveness
  NORMAL_EFFECTIVE = 8
  def self.calculate(_attack, _type1, _type2 = nil, _type3 = nil); NORMAL_EFFECTIVE; end
end

class QAPokemon
  attr_reader :species
  def initialize(species); @species = species; end
end
class QAMove
  attr_reader :id, :name, :type
  def initialize(id)
    data = GameData::Move.get(id)
    @id = data.id
    @name = data.name
    @type = data.type
  end
  def damagingMove?; GameData::Move.get(@id).base_damage.to_i > 0; end
  def statusMove?; !damagingMove?; end
end
class QABattler
  attr_accessor :index, :side, :moves, :stages, :hp, :totalhp, :pokemon, :allow_status
  def initialize(index, side, species)
    @index = index; @side = side; @pokemon = QAPokemon.new(species)
    @moves = []; @stages = Hash.new(0); @hp = 300; @totalhp = 400
    @allow_status = true
  end
  def opposes?; @side == 1; end
  def fainted?; @hp <= 0; end
  def pbHasType?(_type); false; end
  def pbTypes(_real = true); [:NORMAL, nil, nil]; end
  def pbCanInflictStatus?(_status, _user = nil, _show = false, _move = nil); @allow_status; end
  def pbCanLowerStatStage?(*_args); @allow_status; end
  def pbThis(*_args); @pokemon.species.to_s; end
end
`;

const battleTail = String.raw`
  attr_reader :registered_move, :registered_target, :messages
  def initialize(battlers)
    @battlers = battlers
    @arceus_phase = 1
    @turnCount = 7
    @ruta_arceus_move_history = []
    @ruta_repertorio_fase = 1
    @ruta_repertorio_objetivos = "PIKACHU"
    @ruta_repertorio_turno = 7
    @messages = []
  end
  def arceus_battler; @battlers.find { |b| b.pokemon && b.pokemon.species == :ARCEUS }; end
  def arceus_state(_battler); true; end
  def arceus_cinematic_adaptive?; false; end
  def pbArceusRedlineHeal(*_args); false; end
  def pbCanChooseMove?(*_args); true; end
  def pbRegisterMove(index, move_index, *_args); @registered_move = [index, move_index]; true; end
  def pbRegisterTarget(index, target_index); @registered_target = [index, target_index]; end
  def pbDisplayPaused(message); @messages << message; end
  def pbArceusBattleCommentary(*_args); true; end
  def pbArceusAdaptTypeToRival(*_args); true; end
  def pbAutoChooseMove(*_args); true; end
  def pbRandom(_max); 0; end
  def arceus_divine?; true; end
  def ruta_arceus_primigenia?; false; end
`;

const captureMethod = method("PokeBattle_BattleCommon", "pbCaptureCalc");
const knockbackMethod = method("PokeBattle_Move_0EC", "pbEffectAgainstTarget");
const rubyProgram = [
  `# Datos marshal reales convertidos a filas QA\n${prelude.replace("__DATA__", dataPayload)}`,
  rubyConstants,
  `class Object\n${objectMethods}\nend`,
  `class PokeBattle_Battle\n${battleMethods}\n${battleTail}\nend`,
  String.raw`
module PokeBattle_BattleCommon
  def pbCaptureCalc(_pkmn, _battler, _catch_rate, _ball)
    @qa_original_capture_calls = @qa_original_capture_calls.to_i + 1
    4
  end
  alias _ruta_arceus_original_capture_calc pbCaptureCalc
` + captureMethod + String.raw`
end
class QACapturePokemon
  attr_reader :species
  def initialize(species); @species = species; end
end
class QACaptureBattler
  attr_reader :index, :pokemon
  def initialize(index, species); @index = index; @pokemon = QACapturePokemon.new(species); end
end
class QACaptureBattle
  include PokeBattle_BattleCommon
  attr_reader :messages
  def initialize(slot)
    @ruta_arceus_invocation_state = { :slot_index => slot }
    @messages = []
    @qa_original_capture_calls = 0
  end
  def arceus_divine?; false; end
  def pbDisplay(message); @messages << message; end
  def original_capture_calls; @qa_original_capture_calls; end
end

class QAKnockbackBattle
  attr_accessor :decision
  attr_reader :messages
  def initialize(divine)
    @divine = divine; @messages = []; @decision = nil
  end
  def arceus_divine?; @divine; end
  def wildBattle?; true; end
  def canRun; true; end
  def pbDisplay(message); @messages << message; end
end
class QAKnockbackUser
  def initialize(divine); @divine = divine; end
  def ruta_arceus_divine_boss?; @divine; end
  def pbThis; "Arceus"; end
end
class PokeBattle_Move_0EC
  def initialize(battle); @battle = battle; end
  def pbEffectAgainstTarget(_user, _target)
    @battle.decision = 3 if @battle.wildBattle? && @battle.canRun
  end
  alias _ruta_arceus_original_wild_knockback pbEffectAgainstTarget
` + knockbackMethod + String.raw`
end
`,
  String.raw`
# 1) Catálogo seguro calculado con moves.dat y el learnset/tutor reales.
battle = PokeBattle_Battle.new([QABattler.new(0, 0, :PIKACHU), QABattler.new(1, 1, :ARCEUS)])
boss = battle.instance_variable_get(:@battlers)[1]
party = battle.instance_variable_get(:@battlers)[0]
catalog = battle.pbArceusMoveCatalogIds
raise "catalog is empty" if catalog.empty?
[:CALMMIND, :JUDGMENT].each { |id| raise "safe move missing: #{id}" unless catalog.include?(id) }
[:HEALINGWISH, :PERISHSONG, :CURSE, :SUBSTITUTE, :ROAR, :WHIRLWIND, :TELEPORT].each do |id|
  raise "unsafe move leaked into catalog: #{id}" if catalog.include?(id)
end

battle.instance_variable_set(:@ruta_arceus_equipo_move_ids, [:EXPLOSION, :TELEPORT, :TACKLE, :DRAGONTAIL])
copied_catalog = battle.pbArceusMoveCatalogIds
raise "copied self-KO leaked" if copied_catalog.include?(:EXPLOSION)
raise "copied escape leaked" if copied_catalog.include?(:TELEPORT)
raise "safe copied move missing" unless copied_catalog.include?(:TACKLE)
raise "Dragon Tail was incorrectly filtered from a copied moveset" unless copied_catalog.include?(:DRAGONTAIL)

sample = pbArceusSafeMoveIds([:TACKLE, :HEALINGWISH, :PERISHSONG, :CURSE, :SUBSTITUTE,
                               :ROAR, :WHIRLWIND, :TELEPORT, :DRAGONTAIL, :NO_SUCH_MOVE])
raise "safe move filter mismatch: #{sample.inspect}" unless sample == [:TACKLE, :DRAGONTAIL]

# 2) La puntuación detecta apoyo propio y un estado aplicable al objetivo.
calm = QAMove.new(:CALMMIND)
raise "Calm Mind not scored" unless battle.pbArceusStatusMoveScore(calm, boss) == [42.0, -1]
thunder = QAMove.new(:THUNDERWAVE)
raise "Thunder Wave target missing" unless battle.pbArceusStatusMoveScore(thunder, boss) == [34.0, party.index]
party.allow_status = false
raise "immune target was selected for status" unless battle.pbArceusStatusMoveScore(thunder, boss) == [0.0, -1]
party.allow_status = true

# 3) El selector real puede registrar un apoyo con objetivo propio (índice -1)
#    y sigue pudiendo registrar un ataque con un objetivo enemigo válido.
boss.moves = [QAMove.new(:CALMMIND), QAMove.new(:TACKLE)]
raise "smart action rejected legal status move" unless battle.pbArceusSmartAction(1, boss)
raise "smart action did not register Calm Mind" unless battle.registered_move == [1, 0]
raise "self-support was given an enemy target" unless battle.registered_target.nil?

battle2 = PokeBattle_Battle.new([QABattler.new(0, 0, :PIKACHU), QABattler.new(1, 1, :ARCEUS)])
boss2 = battle2.instance_variable_get(:@battlers)[1]
boss2.moves = [QAMove.new(:TACKLE)]
raise "smart action rejected a damaging move" unless battle2.pbArceusSmartAction(1, boss2)
raise "damaging move not registered" unless battle2.registered_move == [1, 0]
raise "damaging move has no target" unless battle2.registered_target == [1, 0]

# 4) pokemonIndex=-1 de una invocación no puede llegar a pbRemoveFromParty:
#    la captura falla antes de llamar al cálculo normal (y tampoco bloquea otro slot).
capture = QACaptureBattle.new(3)
result = capture.pbCaptureCalc(nil, QACaptureBattler.new(3, :DIALGA), nil, :POKEBALL)
raise "invocation capture should fail" unless result == 0
raise "normal capture calc was reached for invocation" unless capture.original_capture_calls == 0
raise "invocation capture warning missing" if capture.messages.empty?
result_other = capture.pbCaptureCalc(nil, QACaptureBattler.new(1, :DIALGA), nil, :POKEBALL)
raise "a different slot was blocked" unless result_other == 4 && capture.original_capture_calls == 1

# 5) El efecto de Dragon Tail/Circle Throw no cambia decision=3 en el jefe,
#    pero conserva la ruta original fuera de ese combate.
ash = Object.new
move_battle = QAKnockbackBattle.new(true)
PokeBattle_Move_0EC.new(move_battle).pbEffectAgainstTarget(QAKnockbackUser.new(true), ash)
raise "0EC let the divine wild battle escape" unless move_battle.decision.nil?
move_battle_normal = QAKnockbackBattle.new(false)
PokeBattle_Move_0EC.new(move_battle_normal).pbEffectAgainstTarget(QAKnockbackUser.new(false), ash)
raise "0EC changed normal wild behavior" unless move_battle_normal.decision == 3

"ARCEUS_MOVES_QA_OK: #{catalog.length} movimientos seguros; autodaño/huida filtrados; apoyo y ataques seleccionables; invocación no capturable; 0EC no cierra el duelo."
`,
].join("\n\n");

const program = rubyProgram.replace("__DATA__", dataPayload);
let report;
try {
  report = vm.eval(program).toString();
} catch (error) {
  console.error("FALLO en la QA dinámica de movimientos/invocaciones:");
  const detail = String(error?.message ?? error);
  console.error(detail.split("\n").slice(0, 20).join("\n"));
  const rubyLine = Number(detail.match(/eval:(\d+)/)?.[1] ?? 0);
  if (rubyLine > 0) {
    console.error(program.split("\n").slice(Math.max(0, rubyLine - 7), rubyLine + 6)
      .map((line, index) => `${Math.max(1, rubyLine - 6) + index}: ${line}`).join("\n"));
  }
  process.exit(1);
}
console.log(report);
if (!report.includes("ARCEUS_MOVES_QA_OK")) process.exit(1);
