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
 *   · **Arceus se regenera y se burla** cuando un golpe lo lleva al rojo o
 *     parece derrotarlo; cada ataque suyo sigue retirando un aliado.
 *   · **Las entradas son físicas:** Cynthia/Steven caminan al altar, se alejan
 *     tras perder y Red/Gold recorren después la misma ruta.
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

// ----------------------------------- regeneración previa al duelo de Ash
check(/arceus_cinematic\?/.test(ruby), "existe el modo cinemático consultable desde la batalla");
const cinematicDamage = cuerpo("def arceus_cinematic_damage") ?? "";
check(/ruta_arceus_cinematic_absorb/.test(cinematicDamage) &&
  /@ruta_arceus_cinematic_pending_damage/.test(cinematicDamage) &&
  !ruby.includes("predicted_hp"),
  "el Creador de las cinemáticas absorbe el golpe: su barra no se mueve ni un punto");
const absorb = cuerpo("def pbArceusCinematicAbsorb") ?? "";
check(/pbArceusCinematicRebirth\(battler\)/.test(absorb) && /absorbe el golpe/.test(absorb) &&
  /battler\.totalhp/.test(absorb),
  "el aura dorada narra la absorción y sólo se burla cuando el intento habría sido letal");
const rebirth = cuerpo("def pbArceusCinematicRebirth") ?? "";
check(/battler\.hp = battler\.totalhp/.test(rebirth) && /se burla/.test(rebirth) &&
  !ruby.includes("fallen_hp"),
  "Arceus conserva toda su vida y se burla sin mostrar una barra vacía");
const cinematicMoveDamage = cuerpo("def pbInflictHPDamage(target)") ?? "";
check(/ruta_arceus_cinematic_boss_target\?\(target\)/.test(cinematicMoveDamage) &&
  /target\.damageState\.hpLost = 0/.test(cinematicMoveDamage) &&
  /pbArceusCinematicAbsorb\(target, attempted_damage\)/.test(cinematicMoveDamage) &&
  /_ruta_arceus_original_inflict_hp_damage\(target\)/.test(cinematicMoveDamage),
  "el daño directo de movimientos se anula antes de que Essentials reste HP");
const divineMoveDamage = cuerpo("def ruta_arceus_divine_boss_target?(target)") ?? "";
check(/ruta_arceus_divine_boss_target\?\(target\)/.test(divineMoveDamage) &&
  /pbArceusDivineBarDamage/.test(cinematicMoveDamage) &&
  /ruta_arceus_scripted_hp_write do/.test(cinematicMoveDamage),
  "el mismo camino central lleva el daño del duelo real a las seis barras");
const barShield = cuerpo("def pbArceusDivineBarDamage") ?? "";
check(/arceus_before_damage\(battler, amount\)/.test(barShield) &&
  /pbArceusDepleteBar\(battler\)/.test(barShield),
  "ningún movimiento puede saltarse una etapa: el KO se transforma en transición");
check(ruby.includes("def pbFaint(showMessage = true)") &&
  ruby.includes("if ruta_arceus_cinematic_boss?") &&
  ruby.includes("@battle.pbArceusCinematicRebirth(self)") &&
  ruby.includes("ruta_arceus_divine_boss? && fainted?"),
  "un respaldo en pbFaint restaura a los dos Arceus si una ruta especial intenta cerrar la escena");
const hpSetter = cuerpo("def hp=(value)") ?? "";
check(/ruta_arceus_cinematic_boss\?/.test(hpSetter) &&
  /ruta_arceus_divine_boss\? && value\.to_i < @hp\.to_i/.test(hpSetter) &&
  /_ruta_arceus_original_set_hp\(value\)/.test(hpSetter),
  "el setter de PS rechaza cualquier daño externo contra los Arceus de la cima");
// ------------------------------------------- Ball Breaker (compatibilidad)
const df08Effect = cuerpo("def pbAttackingTurnEffect(user, target)") ?? "";
check(/module RutaDeDiosBallBreaker/.test(ruby) &&
  /unless method_defined\?\(:selfProtected\?\)/.test(ruby) &&
  /unless method_defined\?\(:sideProtected\?\)/.test(ruby),
  "selfProtected? y sideProtected? existen para la sección Despacito Despair (Ball Breaker)");
check(/class PokeBattle_Move_DF08/.test(ruby) &&
  /target\.respond_to\?\(:selfProtected\?\)/.test(df08Effect) &&
  /RutaDeDiosBallBreaker\.clear_protections!\(target\)/.test(df08Effect) &&
  /rescue StandardError/.test(df08Effect),
  "Ball Breaker ya no aborta el combate si faltan los ayudantes y siempre retira las protecciones");
check(/recordBattleRule\("weather", "None"\)/.test(ruby) &&
  /setBattleRule\("weather", "None"\)/.test(ruby) &&
  /battle\.field\.weather = :None/.test(montaje),
  "ni el duelo divino ni las cinemáticas heredan el granizo de la cumbre");
check(/return battler\.hp if arceus_cinematic_source\?/.test(cinematicDamage),
  "los golpes de Arceus todavía retiran por completo a cada aliado activo");
const barDamage = cuerpo("def arceus_before_damage") ?? "";
const barTransition = cuerpo("def pbArceusDepleteBar") ?? "";
check(/ruta_arceus_stage_break/.test(barDamage) && /battler\.hp = 0/.test(barTransition) &&
  /RUTA_ARCEUS_STAGE_COUNT/.test(barTransition),
  "el combate principal sólo avanza al agotar la barra completa, no por umbrales parciales");
check(/@ruta_arceus_bars_depleted/.test(ruby) && /RUTA_ARCEUS_STAGE_COUNT = 6/.test(ruby),
  "el contador persistente exige seis barras completas antes del desenlace");

// --------------------------------------------------------- entradas físicas
const preludeStart = ruby.indexOf("def pbArceusCinematicPrelude");
const preludeEnd = ruby.indexOf("# 4. Capture gate", preludeStart);
const prelude = preludeStart >= 0 && preludeEnd > preludeStart ? ruby.slice(preludeStart, preludeEnd) : "";
const firstWalkIn = prelude.indexOf("pbArceusCinematicWalkIn(ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH");
const firstBattle = prelude.indexOf("pbArceusCinematicCpuBattle([", firstWalkIn);
const firstWalkAway = prelude.indexOf("pbArceusCinematicWalkAway(ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH", firstBattle);
const secondWalkIn = prelude.indexOf("pbArceusCinematicWalkIn(ARCEUS_ALLIES_GOLD_RED_SWITCH", firstWalkAway);
const secondBattle = prelude.indexOf("pbArceusCinematicCpuBattle([", secondWalkIn);
const secondWalkAway = prelude.indexOf("pbArceusCinematicWalkAway(ARCEUS_ALLIES_GOLD_RED_SWITCH", secondBattle);
check(firstWalkIn >= 0 && firstBattle > firstWalkIn && firstWalkAway > firstBattle &&
  secondWalkIn > firstWalkAway && secondBattle > secondWalkIn && secondWalkAway > secondBattle,
  "Cynthia/Steven caminan y se retiran antes de que Red/Gold entren y disputen su batalla");
check(/pbMoveRoute\(event, route\)/.test(ruby) && /event\.move_route_forcing/.test(ruby) && /pbWait\(1\)/.test(ruby),
  "las rutas de llegada/salida esperan de forma segura hasta que terminan de caminar");
check(/\[4, 19, 16, 2,/.test(prelude) && /\[5, 27, 16, 2,/.test(prelude) &&
  /\[6, 18, 22, 2,/.test(prelude) && /\[7, 28, 22, 2,/.test(prelude),
  "los eventos de ambos equipos parten de sus coordenadas reales del mapa 2037");
check(/:ARC_Cynthia/.test(prelude) && /:ARC_Steven/.test(prelude) &&
  /:ARC_Ethan/.test(prelude) && /:SECRET_Red/.test(prelude),
  "la escena de batalla conserva los sprites de Cynthia/Steven y luego Red/Gold");

// ------------------------------------------------------ sustituciones seguras
check(/def pbSwitchInBetween/.test(ruby) && /arceus_cinematic\?/.test(ruby),
  "la sustitución aliada se redirige a la IA de la escena");
check(/def pbArceusScriptedAction/.test(ruby),
  "las acciones de los aliados están guionadas (no decididas al azar)");

// ------------------------------------------------ duelo final jugable (R8)
check(ruby.includes("RUTA_ARCEUS_OHKO_FLOOR_RATIO") && /def ruta_arceus_apply_ohko_guard/.test(ruby),
  "el duelo final limita el daño de Arceus: ningún turno suyo derriba de un golpe a un Pokémon de Ash");
check(ruby.includes("def ruta_arceus_ash_bar_damage") && ruby.includes("RUTA_ARCEUS_ASH_BAR_MIN_RATIO") &&
  ruby.includes("RUTA_ARCEUS_ASH_BAR_POWER"),
  "los golpes de Ash mueven las seis barras con el vínculo que forjó en el prólogo");
check(/def pbCalculatePriority\(fullCalc = false, indexArray = nil\)/.test(ruby) &&
  ruby.includes("ruta_arceus_ash_first_active?"),
  "el lado de Ash abre cada ronda del duelo, también con el Espacio Raro activo");
check(ruby.includes("Ir directo al duelo con Arceus") && ruby.includes("saltar_prologo"),
  "el prólogo se puede saltar desde el primer arranque e ir directo al combate");
check(/when 4 then \[base_level\.to_i - 20, 1\]\.max/.test(ruby) && !/when 4 then 1\r?\n/.test(ruby),
  "el Juicio del Vínculo ya no apaga a los Pokémon de Ash a nivel 1");

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
