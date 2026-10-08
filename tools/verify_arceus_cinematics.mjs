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

const SECCION_CANON = "PokeMod_CanonArceus";
const entradaCanon = scripts.find(([, t]) => t && t.text === SECCION_CANON);
const canon = entradaCanon
  ? zlib.inflateSync(Buffer.from(entradaCanon[2].bytes)).toString("utf8")
  : "";

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

// ------------------------------------------------ duelo final jugable (R8/R9)
check(ruby.includes("RUTA_ARCEUS_HIT_CAP_RATIO") && /def ruta_arceus_apply_ohko_guard/.test(ruby),
  "el duelo final limita el daño de Arceus: ningún turno suyo derriba de un golpe a un Pokémon de Ash");
check(ruby.includes("RUTA_ARCEUS_REDLINE_HEAL_RATIO") &&
  ruby.includes("El altar le devuelve media barra") &&
  !ruby.includes("su barra se restaura por completo"),
  "el umbral rojo de Arceus ya no borra el avance de Ash: recupera media barra por etapa");
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

// ------------------------------------------- R10: cero errores de script visibles
check(/def ruta_arceus_mega\?/.test(ruby) && /def ruta_arceus_mega_aparicion/.test(ruby) &&
  ruby.includes("RUTA_ARCEUS_MIL_BRAZOS = [:FURYSWIPES"),
  "la última barra es la fase de Mega Arceus, el de los Mil Brazos, con pool multigolpe");
check(ruby.includes("MEGA ARCEUS, EL DE LOS MIL BRAZOS, DESCIENDE SOBRE LA CIMA") &&
  ruby.includes("ruta_arceus_mega_aparicion(battler) if @arceus_bars_depleted == RUTA_ARCEUS_STAGE_COUNT - 1"),
  "la megaevolución de los Mil Brazos desciende al agotar la quinta barra");
check(canon.includes("battle.pbStartWeather(nil, clima, true, true, 5)") &&
  !canon.includes("pbStartWeather(clima, 5)"),
  "el clima de las fases usa la firma correcta de v19 (símbolo de clima, no un entero)");
check(canon.includes("module RutaCampoSeguro") && canon.includes("def self.sanitizar!(battle)") &&
  canon.includes("alias ruta_fin_ronda_original start_phase"),
  "la red anti-error sanitiza el campo antes de cada fin de ronda y valida todo clima escrito");
check(!/^\s*otro\.ability = nil/m.test(canon) && canon.includes("PBEffects.const_get(:GastroAcid)"),
  "el silencio de talentos usa el efecto real del motor en vez de borrar el talento");
check(canon.includes("MEGA ARCEUS, EL DE LOS MIL BRAZOS, ESCRIBE LA ÚLTIMA REGLA") &&
  canon.includes(":movs => [:FURYSWIPES, :COMETPUNCH, :PINMISSILE, :ARMTHRUST]"),
  "la fase 6 del canon anuncia a Mega Arceus y arma su pool de mil brazos");

// --------------------------------------------- R11: fases que no revientan y Primigenia
check(canon.includes("def self.paso") && canon.includes("paso { campo(battle, :MagicRoom, 5) }") &&
  canon.includes("def self.verificar_fase"),
  "cada sub-efecto de cada fase corre con su propio escudo y la fase cierra saneando el campo");
check(ruby.includes("RUTA_ARCEUS_PRIMIGENIA_MOVES = [:JUDGMENT") &&
  /def ruta_arceus_primigenia_aparicion/.test(ruby) && /def ruta_arceus_primigenia\?/.test(ruby),
  "la Forma Primigenia existe: pool del dios sin Tabla y métodos de aparición");
check(ruby.includes("ARCEUS PRIMIGENIO, LA FORMA PRIMIGENIA, SE PONE EN PIE SOBRE LA CIMA") &&
  ruby.includes("battler.item = nil if battler && battler.respond_to?(:item=)"),
  "la Forma Primigenia despierta en el umbral rojo de la última barra y suelta la Tabla (Juicio al tipo original)");
check(ruby.includes("RUTA_ARCEUS_PRIMIGENIA_GRITOS") &&
  ruby.includes("ruta_arceus_primigenia? && @ruta_arceus_primigenia_grito_key != arceus_action_key"),
  "la Forma Primigenia tiene una voz por acción enemiga, sin pisar los gritos de los Mil Brazos");
check(ruby.includes("La Forma Primigenia se recuerda a sí misma") &&
  ruby.includes("El altar le devuelve media barra, pero el avance de Ash no se borra"),
  "el umbral rojo conserva su media barra de R9 con mensaje propio en la Forma Primigenia");

// --------------------------------------------- R12: el dios jugador (variable, sin guion repetido)
check(/def ruta_arceus_divine_ratio/.test(ruby) && ruby.includes("RUTA_ARCEUS_HIT_CAP_MIN = 0.12") &&
  ruby.includes("cap = (total * ruta_arceus_divine_ratio).round"),
  "el daño de Arceus varía por acción (12%-33%) en vez de ser un porcentaje fijo");
check(/def ruta_arceus_dialogo/.test(ruby) && ruby.includes("RUTA_ARCEUS_DIALOGOS = {") &&
  ruby.includes("mazo.shift"),
  "los diálogos salen de mazos que no repiten ninguna línea hasta agotarse");
check(/def ruta_arceus_musica_fase/.test(ruby) && ruby.includes("RUTA_ARCEUS_BGM_POR_FASE = {") &&
  ruby.includes("pbBGMPlay(pista)"),
  "cada fase del duelo estrena su propia música");
{
  // Las pistas del mapa existen de verdad en Audio/BGM (con cualquier extensión).
  const bgmDir = path.join(ROOT, "pokemon_fire_ash", "Audio", "BGM");
  const pistasInstaladas = new Set(
    fs.existsSync(bgmDir)
      ? fs.readdirSync(bgmDir).map((f) => f.replace(/\.[^.]+$/, ""))
      : []
  );
  const bloque = ruby.slice(ruby.indexOf("RUTA_ARCEUS_BGM_POR_FASE = {"));
  const nombres = [...bloque.slice(0, bloque.indexOf("}") + 1).matchAll(/=>\s*"([^"]+)"/g)].map((m) => m[1]);
  const primigenia = (ruby.match(/RUTA_ARCEUS_BGM_PRIMIGENIA = "([^"]+)"/) || [])[1];
  if (primigenia) nombres.push(primigenia);
  const faltantes = nombres.filter((n) => !pistasInstaladas.has(n));
  check(nombres.length >= 7 && faltantes.length === 0,
    `las ${nombres.length} pistas del duelo existen en Audio/BGM${faltantes.length ? ` (faltan: ${faltantes.join(", ")})` : ""}`);
}
check(/def ruta_arceus_turno_divino/.test(ruby) &&
  /ruta_arceus_turno_divino\s*\n\s*rescue StandardError/.test(ruby),
  "el turno divino (música, juegos, merced, invocaciones) corre aislado: si falla, la ronda sigue");
check(ruby.includes("RUTA_ARCEUS_INVOCACIONES = [") && ruby.includes(":DIALGA") &&
  ruby.includes(":PALKIA") && ruby.includes(":GIRATINA") && ruby.includes(":UXIE"),
  "Arceus invoca al Trío de la Creación, a los lagos y al resto del lore para ejecutar su orden");
check(ruby.includes("danio = [danio, objetivo.hp.to_i - 1].min"),
  "las invocaciones presionan pero jamás rematan: siempre dejan al menos 1 PS");
check(/def ruta_arceus_copiar_equipo/.test(ruby) && ruby.includes("ruta_arceus_copiar_equipo(battler) if phase == 4"),
  "Arceus copia los golpes del equipo de Ash en el Juicio del Vínculo");
check(/def ruta_arceus_ofrenda/.test(ruby) && ruby.includes("@ruta_ofrenda_hecha = true") &&
  ruby.includes("pkmn.heal") && ruby.includes("RUTA_ARCEUS_OFRENDA_ELECCIONES"),
  "si a Ash le queda un Pokémon, Arceus ofrece una vez por batalla curar todo el equipo (vida, estado y PP)");
check(/def ruta_arceus_cinematica_apertura/.test(ruby) && ruby.includes("ruta_arceus_sprite_y(objetivo, 46, 14)") &&
  ruby.includes("Podría matarte ahora mismo, a ti y a tus Pokémon"),
  "la apertura es acción con sprites en pantalla: Arceus alza al Pokémon de Ash, no sólo lo narra");
check(/def ruta_arceus_jugar/.test(ruby) && ruby.includes("@ruta_juego_bono_acciones = 2") &&
  ruby.includes("cap = [(cap / 2.0).round, 1].max"),
  "los minijuegos divinos premian adivinando el juicio: los golpes siguientes pesan la mitad");

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
