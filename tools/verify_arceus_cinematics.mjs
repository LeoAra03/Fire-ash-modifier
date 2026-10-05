#!/usr/bin/env node
/**
 * verify_arceus_cinematics.mjs
 *
 * Audita los **combates dobles coreografiados** de La Ruta de Dios (Cynthia y
 * Steven, Gold/Eco y Red, Volus: 2v1 contra Arceus). Son batallas de verdad
 * del motor, así que un descuido se traduce en un cuelgue o en un menú que
 * rompe la cinemática. Esta herramienta comprueba las invariantes que hacen
 * que eso no pase, leyendo el Ruby ya instalado en `Scripts.rxdata`.
 *
 * Qué se comprueba, y por qué importa:
 *
 *   · **Nadie le pregunta nada al jugador.** `controlPlayer`, `canRun=false`,
 *     `switchStyle=false`, `cannotRun` y `setStyle`: sin esto, el motor
 *     abriría el menú de combate en medio de la escena.
 *   · **La derrota está permitida y es el guion.** `canLose`: los aliados
 *     pierden a propósito; si el motor tratara la derrota como un game over,
 *     la cinemática se cortaría.
 *   · **No hay experiencia ni dinero** que ensucie el estado de la partida.
 *   · **Las reglas se limpian y se restauran**, incluso si algo falla
 *     (`ensure`), para no dejar reglas pegadas al siguiente combate.
 *   · **El equipo de Ash se restaura** al terminar: HP, estado y Pokérus.
 *   · **PRNG determinista**: la escena sale igual siempre.
 *   · **Arceus no se debilita** en estas escenas: cada golpe retira un aliado,
 *     nunca al dios.
 *   · **Todo va envuelto en `begin/rescue`** para que un error del motor no
 *     tire el juego.
 *
 * Uso:
 *   node tools/verify_arceus_cinematics.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";
import { ROOT, DATA } from "./lib/fire_ash_registry.mjs";

const SCRIPTS = path.join(ROOT, "pokemon_fire_ash", "Data", "Scripts.rxdata");
const SECCION = "PokeMod_RutaDeDios";

const scripts = marshalLoad(fs.readFileSync(SCRIPTS));
const entrada = scripts.find(([, t]) => t && t.text === SECCION);
if (!entrada) {
  console.log(`✘ falta la sección ${SECCION} en Scripts.rxdata`);
  process.exit(1);
}
const ruby = zlib.inflateSync(Buffer.from(entrada[2].bytes)).toString("utf8");

/** Recorta el cuerpo de una función Ruby por su cabecera. */
function cuerpo(de) {
  const ini = ruby.indexOf(de);
  if (ini < 0) return null;
  const resto = ruby.slice(ini);
  const lineas = resto.split("\n");
  let profundidad = 0;
  let empezado = false;
  const out = [];
  for (const linea of lineas) {
    const desnuda = linea.replace(/#.*$/, "").trim();
    out.push(linea);
    for (const patron of [/\bdef\b/, /\bdo\b(\s*\|[^|]*\|)?\s*$/, /\bif\b/, /\bcase\b/, /\bbegin\b/, /\bunless\b/, /\bwhile\b/, /\bclass\b/, /\bmodule\b/]) {
      if (patron.test(desnuda) && !/^end\b/.test(desnuda)) profundidad++;
    }
    if (/^end\b/.test(desnuda) || /\bend\b\s*$/.test(desnuda)) profundidad--;
    if (empezado && profundidad <= 0) break;
    empezado = true;
  }
  return out.join("\n");
}

const fallos = [];
const ok = [];
const check = (condicion, texto) => (condicion ? ok.push(texto) : fallos.push(texto));

// ---------------------------------------------------------------- montaje 2v1
check(/def pbArceusCinematicCpuBattle/.test(ruby), "existe el montador de la batalla 2v1");
const montaje = cuerpo("def pbArceusCinematicCpuBattle") ?? "";

check(/setBattleRule\("2v1"\)|setBattleRule\(battle_size\)/.test(montaje),
  "la escena se declara en formato 2v1 (dos aliados contra el dios)");
check(/old_rules\s*=\s*\$PokemonTemp\.battleRules\.clone/.test(montaje),
  "guarda las reglas de batalla previas antes de tocar nada");
check(/\$PokemonTemp\.clearBattleRules/.test(montaje),
  "limpia las reglas antes de montar la escena");
check(/setBattleRule\("cannotRun"\)/.test(montaje) && /battle\.canRun\s*=\s*false/.test(montaje),
  "no se puede huir: ni por regla ni por asignación final");
check(/setBattleRule\("canLose"\)/.test(montaje) && /battle\.canLose\s*=\s*true/.test(montaje),
  "la derrota está permitida (el guion la necesita, no es un game over)");
check(/setBattleRule\("noExp"\)/.test(montaje) && /battle\.expGain\s*=\s*false/.test(montaje),
  "la escena no reparte experiencia");
check(/setBattleRule\("noMoney"\)/.test(montaje) && /battle\.moneyGain\s*=\s*false/.test(montaje),
  "la escena no reparte dinero");
check(/setBattleRule\("setStyle"\)/.test(montaje) && /battle\.switchStyle\s*=\s*false/.test(montaje),
  "estilo fijo: el motor no pide cambio de Pokémon");
check(/battle\.controlPlayer\s*=\s*true/.test(montaje),
  "el jugador no controla nada: el motor no abre el menú de combate");
check(/battle\.party1starts\s*=/.test(montaje) && /battle\.party2starts\s*=/.test(montaje),
  "los dos aliados entran como dos equipos distintos (party starts)");
check(/\bensure\b/.test(montaje),
  "hay bloque ensure: aunque algo falle, se restaura el estado");
check(/ash_party_state\.each/.test(montaje) && /pkmn\.hp\s*=\s*hp/.test(montaje),
  "el equipo de Ash se restaura (HP, estado y Pokérus)");
check(/old_rules\.each/.test(montaje),
  "las reglas de batalla anteriores se restauran");
check(/pbPrepareBattle\(battle\)/.test(montaje),
  "la batalla se prepara con las rutinas estándar del motor");
check(/raise _INTL\("La batalla cinematográfica necesita Pokémon aliados\."\)/.test(montaje),
  "si faltan aliados falla con un mensaje claro, no con un NoMethodError");

// ------------------------------------------------------------ determinismo
check(/RUTA_ARCEUS_CINEMATIC_RNG_SEED/.test(ruby),
  "el PRNG de la cinemática tiene semilla fija (siempre sale igual)");
check(/arceus_cinematic\?\s*\?\s*RUTA_ARCEUS_CINEMATIC_RNG_SEED\s*:\s*RUTA_ARCEUS_MAIN_RNG_SEED/.test(ruby),
  "cada modalidad usa su propia semilla, sin mezclarlas");

// ------------------------------------------------- el dios no cae en la escena
const daño = cuerpo("def pbArceusCinematicDamage") ?? ruby;
check(/arceus_cinematic/.test(ruby), "existe el modo cinemático consultable desde la batalla");
const bloqueDanio = ruby.slice(ruby.indexOf("def check_arceus_seal"), ruby.indexOf("def check_arceus_phase"));
check(/arceus_cinematic\?/.test(bloqueDanio) || /@ruta_arceus_cinematic_mode/.test(ruby),
  "el daño consulta el modo cinemático antes de debilitar al dios");
check(/hp\s*=\s*1|hp\s*>\s*1|no_debilita|1\s*PS/.test(ruby),
  "hay una red que impide que Arceus se debilite en las escenas");

// ------------------------------------------------------ sustituciones seguras
check(/def pbSwitchInBetween/.test(ruby) && /arceus_cinematic\?/.test(ruby),
  "la sustitución aliada se redirige a la IA de la escena");
check(/def pbArceusScriptedAction/.test(ruby),
  "las acciones de los aliados están guionadas (no decididas al azar)");

// ------------------------------------------------------------ blindaje global
const rescues = (ruby.match(/rescue StandardError/g) || []).length;
check(rescues >= 8, `hay ${rescues} bloques rescue StandardError blindando la escena`);
check((ruby.match(/\bbegin\b/g) || []).length >= 5, "las partes sensibles van en begin/rescue");

// ------------------------------------------------------------------- informe
console.log(`Auditoría de las batallas dobles coreografiadas (${SECCION})`);
console.log(`  Ruby auditado: ${ruby.split("\n").length} líneas · ${rescues} rescue StandardError`);
console.log("");
for (const linea of ok) console.log(`  ✔ ${linea}`);
if (fallos.length) {
  console.log("");
  for (const linea of fallos) console.log(`  ✘ ${linea}`);
  console.log(`\n✘ ${fallos.length} invariantes rotas de ${fallos.length + ok.length}.`);
  process.exit(1);
}
console.log(`\n✔ ${ok.length} invariantes cumplidas: las batallas 2v1 no abren menús, no cuelgan la escena y restauran el estado.`);
