#!/usr/bin/env node
/**
 * arceus_fuzz_harness.mjs
 *
 * QA de volumen (R10): ejecuta el código REAL instalado de las secciones
 * `PokeMod_RutaDeDios` y `PokeMod_CanonArceus` dentro de CRuby 3.3 (WebAssembly)
 * sobre un motor de combate mínimo que replica las validaciones de GameData de
 * Fire Ash (las mismas que producían el ArgumentError visible en Kirin:
 * "Expected 5 to be one of [Symbol, GameData::BattleWeather, String]").
 *
 * Corre un millón de escenarios aleatorios deterministas en cuatro familias:
 *
 *   F1 · micro-fuzz de la guardia anti-KO (tope de un tercio por acción);
 *   F2 · fuzz de clima/terreno: escrituras sucias, pbStartWeather con basura,
 *        fin de ronda parcheado y batalla_clima del canon;
 *   F3 · duelos completos aleatorios (seis barras, umbral rojo, megaevolución
 *        de los Mil Brazos, efectos de fase del canon);
 *   F4 · barrido de las seis fases del canon sobre campos contaminados.
 *
 * Uso:
 *   npm i --no-save @ruby/3.3-wasm-wasi
 *   npm run verify:arceus:fuzz
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function wasmBinaryPath() {
  const candidates = [
    path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm"),
    path.join(ROOT, "node_modules/@ruby/wasm-wasi/dist/ruby+stdlib.wasm"),
  ];
  return candidates.find((c) => fs.existsSync(c)) || null;
}

function readSection(file, name) {
  const scripts = marshalLoad(fs.readFileSync(file));
  const row = scripts.find((entry) => (entry[1]?.text ?? String(entry[1])) === name);
  if (!row) throw new Error(`No se encontró la sección ${name} en ${file}`);
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
const modRuby = readSection(scriptsFile, "PokeMod_RutaDeDios");
const canonRuby = readSection(scriptsFile, "PokeMod_CanonArceus");

// ── Constantes RUTA_* tal cual viajan instaladas (una por bloque, con sus
//    continuaciones) para que el fuzz use los números reales del juego. ──
const constantes = [];
{
  const lines = modRuby.split("\n");
  const abierta = (texto) => {
    let balance = 0;
    for (const ch of texto) {
      if (ch === "[" || ch === "{" || ch === "(") balance += 1;
      else if (ch === "]" || ch === "}" || ch === ")") balance -= 1;
    }
    return balance > 0;
  };
  for (let i = 0; i < lines.length; i++) {
    if (!/^RUTA_[A-Z0-9_]+\s*=/.test(lines[i])) continue;
    let bloque = lines[i];
    while (i + 1 < lines.length && (abierta(bloque) || /[+,\\]\s*$/.test(bloque))) {
      i += 1;
      bloque += "\n" + lines[i];
    }
    constantes.push(bloque);
  }
}
if (!constantes.some((c) => c.startsWith("RUTA_ARCEUS_HIT_CAP_RATIO"))) {
  console.log("FALLO: no se pudieron extraer las constantes RUTA_* de la sección instalada.");
  process.exit(1);
}

// ── Extracción de métodos reales (AST) hacia las clases de prueba. ──
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
                           "pbArceusSetMoves", "pbArceusMoveIds", "pbArceusEnsureCaptureBall",
                           "pbArceusDistortion", "ruta_arceus_divine_ratio", "ruta_arceus_dialogo", "ruta_arceus_decir",
                           "ruta_arceus_musica_fase", "ruta_arceus_sprite_y",
                           "ruta_arceus_senalar_sprite", "ruta_arceus_cinematica_apertura",
                           "ruta_arceus_turno_divino", "ruta_arceus_jugar",
                           "ruta_arceus_juicio_ciego", "ruta_arceus_ruleta",
                           "ruta_arceus_invocar", "ruta_arceus_copiar_equipo",
                           "ruta_arceus_ofrenda", "pbCalculatePriority"],
  "PokeBattle_Move"    => ["ruta_arceus_cinematic_boss_target?", "ruta_arceus_divine_boss_target?",
                           "pbInflictHPDamage", "pbReduceDamage"]
}

lines = SRC.split("\n")
found = {}
modulos = {}
walk = nil
walk = lambda do |node|
  next if !node.is_a?(RubyVM::AbstractSyntaxTree::Node)
  if node.type == :DEFN
    found[node.children[0].to_s] = [node.first_lineno, node.last_lineno]
  elsif node.type == :MODULE
    nombre = lines[node.first_lineno - 1].to_s[/\A\s*module\s+([A-Za-z_][A-Za-z0-9_:]*)/, 1]
    modulos[nombre] = [node.first_lineno, node.last_lineno] if nombre
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
(!missing.empty?) ? "FALTAN:#{missing.join(",")}" : JSON.generate({ "metodos" => sources, "modulos" => mods })
`;

const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasm)));

const extracted = vm
  .eval(extraction.replace("__B64__", Buffer.from(modRuby, "utf8").toString("base64")))
  .toString();
if (extracted.startsWith("FALTAN:")) {
  console.log(`FALLO: faltan métodos en la sección instalada: ${extracted.slice(7)}`);
  process.exit(1);
}
const { metodos: methodSources, modulos: moduleSources } = JSON.parse(extracted);

const prelude = fs.readFileSync(path.join(ROOT, "tools/qa/arceus_fuzz_prelude.rb"), "utf8");
const scenarioFile = process.env.FUZZ_SCENARIO
  ? path.resolve(process.env.FUZZ_SCENARIO)
  : path.join(ROOT, "tools/qa/arceus_fuzz_scenarios.rb");
const scenarios = fs.readFileSync(scenarioFile, "utf8");

const boot = [
  prelude,
  "# ── constantes instaladas ──",
  constantes.join("\n"),
  "# ── módulos instalados ──",
  Object.values(moduleSources).join("\n\n"),
  "# ── métodos instalados: PokeBattle_Battler ──",
  "class PokeBattle_Battler\n" + methodSources["PokeBattle_Battler"] + "\nend",
  "# ── métodos instalados: PokeBattle_Battle ──",
  "class PokeBattle_Battle\n" + methodSources["PokeBattle_Battle"] + "\nend",
  "# ── métodos instalados: PokeBattle_Move ──",
  "class PokeBattle_Move\n" + methodSources["PokeBattle_Move"] + "\nend",
  "# ── sección canon completa (fases, red anti-error, parches de campo) ──",
  canonRuby,
].join("\n");

let bootError = null;
try {
  vm.eval(boot);
} catch (e) {
  bootError = String(e && e.message ? e.message : e);
}
if (bootError) {
  console.log("FALLO: el arranque del sandbox de fuzz lanzó un error:");
  console.log(bootError.split("\n").slice(0, 12).join("\n"));
  process.exit(1);
}

// Un VM por familia: el heap de WASM no tolera las cuatro tandas acumuladas
// en un solo eval (memory access out of bounds), y así cada tanda corre con
// la memoria acotada y el resultado agregado es el mismo.
const FAMILIAS = [
  { id: 1, rotulo: "F1 guardia anti-KO:           ", llamada: "fuzz_f1(rng, fallos)" },
  { id: 2, rotulo: "F2 clima/terreno + fin de ronda:", llamada: "fuzz_f2(rng, fallos)" },
  { id: 3, rotulo: "F3 duelos completos aleatorios: ", llamada: "fuzz_f3(rng, fallos)" },
  { id: 4, rotulo: "F4 barrido de fases del canon:  ", llamada: "fuzz_f4(rng, fallos)" },
  { id: 5, rotulo: "F5 sistemas R12 del dios:       ", llamada: "fuzz_f5(rng, fallos)" },
];

const modulo = await WebAssembly.compile(fs.readFileSync(wasm));

// Modo sonda: un solo VM que corre el guion alternativo tal cual (depuración).
if (process.env.FUZZ_SCENARIO && process.env.FUZZ_PROBE) {
  const { vm: vmP } = await DefaultRubyVM(modulo);
  let out = "";
  let err = null;
  try {
    vmP.eval(boot);
    out = vmP.eval(scenarios).toString();
  } catch (e) {
    err = String(e && e.message ? e.message : e);
  }
  console.log(out);
  if (err) {
    console.log("ERROR DE SONDA:");
    console.log(err.split("\n").slice(0, 10).join("\n"));
    process.exit(1);
  }
  process.exit(0);
}

const lineas = ["FUZZ R10 sobre el código instalado (semillas 0xA2CE11..4):"];
const fallosTodos = [];
let total = 0;
let victorias = 0;

for (const fam of FAMILIAS) {
  const { vm: vmF } = await DefaultRubyVM(modulo);
  let error = null;
  let crudo = "";
  try {
    vmF.eval(boot);
    vmF.eval(scenarios);
    crudo = vmF
      .eval(
        `fallos = []
rng = Random.new(0xA2CE10 + ${fam.id})
resultado = Array(${fam.llamada}).flatten
(resultado[0].to_i.to_s) + "|" + (resultado[1] ? resultado[1].to_i.to_s : "0") + "|" +
          (resultado[2] ? resultado[2].to_i.to_s : "0") + "|" + fallos.join("~")`,
      )
      .toString();
  } catch (e) {
    error = String(e && e.message ? e.message : e);
  }
  if (error) {
    console.log(lineas.join("\n"));
    console.log(`FALLO: la familia ${fam.id} lanzó un error no capturado:`);
    console.log(error.split("\n").slice(0, 12).join("\n"));
    process.exit(1);
  }
  const [nStr, vStr, vStr2, fallosStr] = crudo.split("|");
  const n = Number(nStr);
  victorias += Number(vStr);
  const fallos = fallosStr ? fallosStr.split("~").filter(Boolean) : [];
  fallosTodos.push(...fallos);
  total += n;
  const extra = fam.id === 3 ? ` (${victorias} victorias, ${Number(vStr2)} Forma Primigenia)` : "";
  lineas.push(`  ${fam.rotulo} ${n} escenarios, ${fallos.length} fallos${extra}`);
}

console.log(lineas.join("\n"));
if (fallosTodos.length) {
  console.log("  Primeros fallos:");
  for (const f of fallosTodos.slice(0, 30)) console.log(`   · ${f}`);
}
console.log(`RESUMEN FUZZ: ${total} escenarios, ${fallosTodos.length} fallos`);
if (process.env.FUZZ_PROBE) process.exit(fallosTodos.length > 0 ? 1 : 0);
if (total < 1_000_000) {
  console.log(`FALLO: se pedía 1 000 000 de escenarios y sólo corrieron ${total}.`);
  process.exit(1);
}
if (fallosTodos.length > 0) process.exit(1);
console.log("OK: un millón de escenarios sobre el código instalado, cero fallos.");
