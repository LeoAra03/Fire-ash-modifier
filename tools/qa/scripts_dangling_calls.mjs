#!/usr/bin/env node
/**
 * scripts_dangling_calls.mjs
 *
 * Auditoría estática de llamadas colgadas en `Data/Scripts.rxdata`.
 *
 * Fire Ash trae secciones escritas por autores distintos (mods, retos, moves
 * custom). Cuando una de ellas llama a un método que el motor no define, el
 * error no aparece hasta el combate: el caso real fue
 * `PokeBattle_Move_DF08#pbAttackingTurnEffect` (Ball Breaker, el movimiento de
 * dos turnos del Metagross de Steven) consultando `target.selfProtected?` y
 * `target.sideProtected?`, dos métodos que no existen en ningún script y que
 * congelaban la cima con:
 *
 *   NoMethodError: undefined method 'selfProtected?' for an instance of
 *   PokeBattle_Battler
 *
 * Este verificador descomprime TODAS las secciones, reúne los métodos que el
 * juego define (`def`, `def self.`, `alias`, `attr_*`, `define_method`) y marca
 * cualquier llamada `objeto.nombre` cuyo nombre no esté definido en ninguna
 * parte ni sea un método del núcleo de Ruby. Sirve como red de seguridad para
 * detectar este tipo de error antes de jugarlo.
 *
 * Uso:
 *   node tools/qa/scripts_dangling_calls.mjs [ruta/a/Scripts.rxdata]
 *
 * Sale con código 1 si encuentra llamadas colgadas.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, "pokemon_fire_ash/Data/Scripts.rxdata");

/** Nombres que el núcleo de Ruby (y las clases base) ya aportan. */
const RUBY_CORE = new Set(
  `new to_s to_i to_f to_a to_h to_sym to_str to_ary to_proc inspect class dup clone
  freeze frozen? nil? is_a? kind_of? instance_of? respond_to? respond_to_missing? send
  public_send __send__ method methods singleton_class instance_variable_get
  instance_variable_set instance_variables instance_variable_defined? instance_eval
  instance_exec binding eval hash eql? equal? == === != <=> =~ !~ + - * / % ** << >>
  & | ^ ~ -@ +@ [] []= <= >= < > ! each each_with_index each_pair each_key each_value
  each_with_object each_slice each_cons each_entry each_index map map! collect collect!
  select select! filter filter_map filter! reject reject! find detect find_index find_all
  index rindex any? all? none? one? count size length empty? include? member? push pop
  shift unshift insert delete delete_at delete_if first last min max min_by max_by sum
  sort sort! sort_by sort_by! reverse reverse_each reverse! uniq uniq! flatten flatten!
  compact compact! zip take take_while drop drop_while group_by partition flat_map reduce
  inject times upto downto step next_float floor ceil round abs divmod modulo remainder
  fdiv truncate integer? zero? positive? negative? nonzero? even? odd? succ pred chr ord
  bytes chars codepoints lines split join gsub gsub! sub sub! tr tr_s squeeze strip
  strip! lstrip rstrip chomp chomp! chop capitalize capitalize! upcase downcase swapcase
  match match? scan replace concat start_with? end_with? center ljust rjust keys values
  key? has_key? value? has_value? store fetch merge merge! update invert to_hash dig
  assoc rassoc tally sample shuffle shuffle! cycle rotate rotate! combination permutation
  product transpose chunk_while slice_when keep_if instance_methods methods
  public_methods private_methods protected_methods define_method method_defined?
  public_method_defined? private_method_defined? protected_method_defined? alias_method
  attr_reader attr_writer attr_accessor include extend prepend ancestors included_modules
  module_eval class_eval class_variable_get class_variable_set const_get const_set
  const_defined? remove_const lambda proc block_given? iterator? caller raise fail catch
  throw loop format sprintf printf print puts p pp sleep rand srand exit exit! abort
  at_exit require require_relative load autoload open gets read readline readlines write
  close closed? seek pos eof flush rewind sync truncate path to_path binmode stat mtime
  ctime expand_path basename dirname extname realpath absolute_path exist? exists? file?
  directory? readlink unlink rename mkdir rmdir entries glob chdir pwd getcwd opendir
  deleted? directory_mtime file_mtime max_to_i min_to_i round table to_int to_c to_r
  rationalize coerce numerator denominator quotient pow taint trust force encoding encode
  slice slice! valid_encoding? ascii_only? unicode_normalize unicode_normalized? ord bytesize
  byteslice getbyte setbyte unpack pack sum hex oct to_d to_time to_date
  singleton_methods private_method called? odd? deep_clone respond_to?`
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * Nombres que no aparecen en ningún script porque los aporta el motor nativo
 * (mkxp: `Bitmap#animated?`, `Input.triggerex?`…) o se definen con nombres
 * dinámicos. La lista es corta a propósito: si un nombre de Fire Ash no está
 * ni aquí ni en los scripts, es la clase de error que congeló la cima.
 */
const ALLOWED = new Set(
  `animated? play goto_and_stop disposed? snapshot blt_bitmap stretch_blt
  load_bitmap save_bitmap to_bitmap source rect width height
  time? triggerex? repeatex? pressex? release? dir4? update?`
    .split(/\s+/)
    .filter(Boolean),
);

function readSections(file) {
  const data = marshalLoad(fs.readFileSync(file));
  const sections = [];
  for (const entry of data) {
    const title = String(entry[1]?.text ?? entry[1]);
    let code = null;
    try {
      code = zlib.inflateSync(Buffer.from(entry[2].bytes)).toString("utf8");
    } catch {
      code = null;
    }
    sections.push({ title, code });
  }
  return sections;
}

function definedNames(sections) {
  const defined = new Set();
  for (const { code } of sections) {
    if (!code) continue;
    for (const m of code.matchAll(/^\s*def\s+(?:self\.)?([A-Za-z_]\w*[?!]?)/gm)) defined.add(m[1]);
    for (const m of code.matchAll(/^\s*alias(?:_method)?\s+([A-Za-z_]\w*[?!]?)/gm)) defined.add(m[1]);
    for (const m of code.matchAll(/^\s*attr_(?:reader|writer|accessor)\s+(.+)$/gm)) {
      for (const name of m[1].matchAll(/:([A-Za-z_]\w*[?!]?)/g)) defined.add(name[1]);
    }
    for (const m of code.matchAll(/define_method\s*\(?\s*:([A-Za-z_]\w*[?!]?)/g)) defined.add(m[1]);
  }
  return defined;
}

const sections = readSections(FILE);
const defined = definedNames(sections);
const known = new Set([...defined, ...RUBY_CORE, ...ALLOWED]);
const findings = new Map();
for (const { title, code } of sections) {
  if (!code) continue;
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    // Llamadas con receptor explícito: objeto.metodo / objeto.metodo? / objeto.metodo!
    for (const m of line.matchAll(/\.([a-z_]\w*[?!])/g)) {
      const name = m[1];
      if (known.has(name)) continue;
      const start = m.index;
      const before = line.slice(0, start);
      const after = line[start + m[0].length] || "";
      if (/[\w=]/.test(after)) continue;      // index.php?showtopic o x.width!=valor
      if (before.endsWith("/") || line.includes("://")) continue; // direcciones web
      if (before.endsWith("&")) continue;      // navegación segura: mkxp/WASM nativo
      if (!findings.has(name)) findings.set(name, []);
      const list = findings.get(name);
      if (list.length < 5) list.push(`${title}:${index + 1}`);
    }
  });
}

// ── R10: patrones de campo que revientan con ArgumentError en plena batalla ──
// El clima y el terreno de v19 son símbolos validados por GameData; un entero,
// un nil o un símbolo inexistente escritos en el campo tumban el fin de ronda
// ("Expected 5 to be one of [Symbol, GameData::BattleWeather, String]"). Estos
// patrones detectan la clase de error antes de jugarlo:
const PATRONES_CAMPO = [
  ["pbStartWeather con símbolo de usuario o movimiento como 1er argumento", /pbStartWeather\(\s*:/],
  ["pbStartWeather con número como clima (2.º argumento)", /pbStartWeather\([^,\n(]+,\s*\d+/],
  ["escritura de .weather con literal no simbólico", /\.weather\s*=\s*(\d+|nil|true|false|["'])/],
  ["escritura de .terrain con literal no simbólico", /\.terrain\s*=\s*(\d+|nil|true|false|["'])/],
  ["setter inexistente weatherduration (minúsculas)", /weatherduration\s*=/],
  ["pbShowCommands con booleano como valor por defecto (la escena exige entero: defaultValue>=0)", /pbShowCommands\([^)\n]*,\s*(?:true|false)\s*\)/],
];
const hallazgosCampo = new Map();
for (const { title, code } of sections) {
  if (!code) continue;
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    if (/^\s*#/.test(line)) return; // comentarios: documentan el fallo, no lo cometen
    for (const [nota, re] of PATRONES_CAMPO) {
      if (!re.test(line)) continue;
      if (!hallazgosCampo.has(nota)) hallazgosCampo.set(nota, []);
      const lista = hallazgosCampo.get(nota);
      if (lista.length < 5) lista.push(`${title}:${index + 1}`);
    }
  });
}

const ordenadas = [...findings.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log(`Secciones analizadas: ${sections.length}`);
console.log(`Métodos definidos en el juego: ${defined.size}`);
console.log(`Llamadas sin definición conocida: ${ordenadas.length}`);
for (const [name, where] of ordenadas) {
  console.log(`  FALLO  ${name}  (${where.join(", ")})`);
}
console.log(`Patrones de campo peligrosos (R10): ${hallazgosCampo.size}`);
for (const [nota, where] of hallazgosCampo) {
  console.log(`  FALLO  ${nota}  (${where.join(", ")})`);
}
if (ordenadas.length > 0 || hallazgosCampo.size > 0) {
  console.log("");
  if (ordenadas.length > 0) {
    console.log("Cada nombre de la primera lista se llama sobre un objeto y no lo define ningún script:");
    console.log("el juego fallará con NoMethodError la primera vez que se ejecute ese camino.");
  }
  if (hallazgosCampo.size > 0) {
    console.log("La segunda lista escribe en el campo valores que GameData rechazará con ArgumentError en plena batalla.");
  }
  process.exit(1);
}
console.log("OK: ninguna llamada apunta a un método inexistente en los scripts instalados.");
console.log("OK: ningún script escribe clima, terreno o talentos que el motor rechace (R10).");
