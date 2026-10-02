#!/usr/bin/env node
/**
 * apply_la_ruta_de_dios.mjs
 *
 * Masterpiece Expansion: "La Ruta de Dios" (The Road of God)
 *
 * Requisitos y características completas:
 * 1. Evento Postgame en Sinnoh con Volus (Volo de Pokémon Leyendas Arceus) en Pueblo Hojaverde (Map 513).
 *    - Requiere las 17 Tablas del Génesis de Arceus.
 *    - Diálogo de sorpresa y asombro ("una oportunidad entre una infinidad").
 *    - Terremoto cinemático interrumpiendo la conversación que abre una fractura en Ciudad Puntaneva (Map 625).
 *    - Canalización opcional para obtener las tablas si se desea iniciar directamente en postgame.
 * 2. Acceso desde Ciudad Puntaneva (Map 625) mediante una avenida celeste despejada entre árboles,
 *    un segundo Volus guía y un portal de luz ancestral en la entrada del Templo Puntaneva.
 * 3. Aproximación Celestial larga (Map 2038, 52x72): cuatro terrazas, escaleras, santuarios,
 *    hitos de las Regiones y una puerta de transición antes de la montaña principal.
 * 4. Montaña Olímpica de 7 pisos (haciendo paralelismo al Monte Corona):
 *    - 1F (Map 2031, 40x40): Puerta de las Columnas. Nieve fresca, estatuas grisáceas (1310/3300), columnas de mármol (4453/4409).
 *         Encuentro y combate contra Maya / Dawn (Lv. 130). Ítem oculto: Caramelo Raro.
 *    - 2F (Map 2032, 40x40): Sendero de los Titanes. Laderas escarpadas, monolitos antiguos, nieve eterna.
 *         Encuentro y combate contra Jericor / Palmer y Benito / Barry (Lv. 135). Ítem oculto: Revivir Máximo.
 *    - 3F (Map 2033, 42x42): Terraza del Aura. Doble columnata de estatuas grisáceas.
 *         Encuentro y combate contra Quinoa / Riley (Lv. 140). Ítem oculto: Más PP.
 *    - 4F (Map 2034, 42x42): Baluarte Celestial. Cima alpina y vientos cósmicos.
 *         Encuentro y combate contra la Campeona Cintia / Cynthia (Lv. 145). Ítem oculto: Ceniza Sagrada.
 *    - 5F (Map 2035, 38x38): Santuario del Tiempo.
 *         Guardián Dialga Primordial (Lv. 150) con sprite bloqueando la escalera. Al ser derrotado o capturado se desvanece. Ítem oculto: Parte Cometa.
 *    - 6F (Map 2036, 38x38): Santuario del Espacio.
 *         Guardián Palkia Primordial (Lv. 150) con sprite bloqueando el acceso a la cima. Al ser derrotado o capturado se desvanece. Ítem oculto: Cápsula Habilidad.
 *    - 7F (Map 2037, 46x46): Cima del Génesis (El Olimpo de Arceus).
 *         Avenida de mármol blanco, 12 estatuas colosales, Altar del Origen con ARCEUS (NIVEL 200, IVs perfectos 31 en todo).
 * 4. Cinemática de Arceus en la Cima:
 *    - Temblores de pantalla, destellos sagrados, música divina (Legend Sinnoh).
 *    - Cuestiona el viaje de Ash, menciona a los Pokémon legendarios atrapados.
 *    - Revela que dejó copias atenuadas de sí mismo, de Dialga y de Palkia a propósito para evitar este despertar.
 *    - Anuncia que ha descendido para desatar el Cataclismo Final y reiniciar el universo.
 * 5. Combate contra Arceus:
 *    - Nivel 200 (único Pokémon del juego en alcanzar este nivel).
 *    - Sentencia, Distorsión, Corte Vacío, Golpe Umbrío con Tabla Legendaria.
 *    - Capacidad de curarse 3 VECES con Restaura Todo cuando su salud baja del 45% (con animación y aviso en pantalla).
 *    - Se puede capturar o derrotar.
 *    - Si derrota al jugador: desmayo oficial y transporte al Centro Pokémon más cercano.
 * 6. Desenlace con Volus:
 *    - Volus sube a la cima tras el combate felicitando a Ash por salvar el cosmos.
 *    - Si capturamos a Arceus: Volus enloquece de obsesión y desafía a Ash con su equipo válido de versión 4 (Nv. 100), reintentable tras perder.
 *    - Si perdemos ante Volus, podemos volver a subir y retarlo hasta derrotarlo.
 *    - Al vencer a Volus, reconoce nuestro vínculo, se marcha y el evento temporal concluye.
 *    - Los entrenadores de los pisos 1-4 desaparecen tras completarse el evento.
 *
 * Uso:
 *   node tools/apply_la_ruta_de_dios.mjs
 *   node tools/apply_la_ruta_de_dios.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import {
  marshalLoad, marshalDump, RHash, RObject, RString, RSymbol, RUserDef,
} from "../web/js/marshal.js";
import {
  TileCanvas, passabilityOf, reachableCells, buildMapObject,
} from "./lib/map_painter.mjs";
import { tableFromUserDef, tableToUserDef, tableSet } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const BACKUP_DIR = path.join(GAME, "PokeModBackups", "la_ruta_de_dios");
const VERIFY_ONLY = process.argv.includes("--verify");

const readRx = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const writeRx = (f, v) => fs.writeFileSync(path.join(DATA, f), Buffer.from(marshalDump(v)));
const S = (text) => RString.fromText(String(text));
const Sy = (text) => new RSymbol(text);
const iv = (obj, name) => obj.getIvar(name);
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));

// Switches dedicados
const SW_UNLOCKED = 870;         // Terremoto ocurrido, ruta abierta en Puntaneva
const SW_DIALGA_DEFEATED = 871;  // Dialga Lv.150 derrotado/capturado en 5F
const SW_PALKIA_DEFEATED = 872;  // Palkia Lv.150 derrotado/capturado en 6F
const SW_ARCEUS_RESOLVED = 873;  // Arceus Lv.200 derrotado o capturado
const SW_ARCEUS_CAUGHT = 874;    // Arceus Lv.200 fue capturado (activa duelo de Volo)
const SW_VOLO_DEFEATED = 875;    // Volo vencido en la cumbre
const SW_COMPLETED = 876;        // Evento temporal concluido con éxito
const SW_SNOWPOINT_PASS = 877;   // Permite cruzar árboles solo durante esta visita a Puntaneva
const SW_ARCEUS_ALLIES_CYNTHIA_STEVEN = 878;
const SW_ARCEUS_ALLIES_GOLD_RED = 879;
const SW_ARCEUS_ALLIES_VOLUS = 880;

// ---------------------------------------------------------------------------
// RMXP Event Constructors
// ---------------------------------------------------------------------------
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [
    ["@code", code], ["@indent", indent], ["@parameters", params],
  ]);
}
function tone(red, green, blue, gray = 0) {
  const bytes = Buffer.alloc(32);
  [red, green, blue, gray].forEach((value, index) => bytes.writeDoubleLE(Number(value), index * 8));
  return new RUserDef("Tone", bytes);
}
function condition({ sw = 0, sw2 = 0, self = "" } = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
    ["@switch2_valid", !!sw2], ["@switch2_id", sw2 || 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
  ]);
}
function graphic(charName = "", dir = 2, pattern = 1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", 0], ["@character_name", S(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pattern], ["@opacity", 255], ["@blend_type", 0],
  ]);
}
function moveRoute() {
  return new RObject("RPG::MoveRoute", [
    ["@repeat", true], ["@skippable", false], ["@list", []],
  ]);
}
function page({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", cond], ["@graphic", gfx],
    ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
    ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
    ["@trigger", trigger], ["@list", list],
  ]);
}
function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [
    ["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages],
  ]);
}
function cinematicTrainerEvent(id, name, x, y, switchId, characterName) {
  return event(id, name, x, y, [
    page({ list: [cmd(0)] }),
    page({
      cond: condition({ sw: switchId }),
      gfx: graphic(characterName, 2),
      through: true,
      list: [cmd(0)],
    }),
  ]);
}
function textCommands(lines, indent = 0) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return [cmd(101, [S("")], indent), ...arr.map((l) => cmd(401, [S(l)], indent))];
}
function script(line, indent = 0) { return cmd(355, [S(line)], indent); }
function transfer(map, x, y, dir = 2, indent = 0) {
  return cmd(201, [0, map, x, y, dir, 1], indent);
}
function transferEvent(id, name, x, y, targetMap, targetX, targetY, targetDir = 8, prompts = []) {
  const list = [];
  if (prompts.length > 0) {
    list.push(...textCommands(prompts));
  }
  list.push(transfer(targetMap, targetX, targetY, targetDir));
  list.push(cmd(0));
  return event(id, name, x, y, [page({ trigger: 1, list })]);
}
function hiddenItemEvent(id, name, x, y, itemSym, itemName) {
  const p1 = page({
    gfx: graphic("Item ball", 2),
    list: [
      cmd(101, [S(`¡Encontraste un ${itemName}!\\1`)]),
      script(`pbReceiveItem(:${itemSym}, 1)`),
      cmd(123, [S("A"), 0]),
      cmd(0),
    ],
  });
  const p2 = page({ cond: condition({ self: "A" }), list: [cmd(0)] });
  return event(id, name, x, y, [p1, p2]);
}
function addEventToMap(mapObj, ev) {
  const events = iv(mapObj, "events");
  events.pairs.push([iv(ev, "id"), ev]);
}

// ---------------------------------------------------------------------------
// 1. Script Section Installation (Scripts.rxdata)
// ---------------------------------------------------------------------------
const RUTA_DE_DIOS_RUBY = `#===============================================================================
# PokeMod: La Ruta de Dios - Arceus Divine Battle
#===============================================================================
# This section deliberately uses only battle APIs present in this Fire Ash build.
# The boss is still hosted by the normal wild-battle loop, so victory, capture,
# EXP, storage and the post-battle event keep their normal engine behaviour.

# 1. Level 200 is reserved for the Arceus encounter.
class Pokemon
  alias _ruta_arceus_original_level_set level= unless method_defined?(:_ruta_arceus_original_level_set)
  # El nivel 200 está reservado al Arceus divino de La Ruta de Dios. Cualquier otro Arceus
  # (intercambio, depuración, futuro evento) sigue topado al máximo normal del juego.
  def ruta_arceus_divine?
    return @ruta_arceus_divine == true
  end
  def level=(value)
    max = (@species == :ARCEUS && @ruta_arceus_divine == true) ? 200 : GameData::GrowthRate.max_level
    if value < 1 || value > max
      raise ArgumentError.new(_INTL("The level number ({1}) is invalid.", value))
    end
    @exp = growth_rate.minimum_exp_for_level(value)
    @level = value
  end
end

module GameData
  class GrowthRate
    alias _ruta_arceus_original_min_exp minimum_exp_for_level unless method_defined?(:_ruta_arceus_original_min_exp)
    def minimum_exp_for_level(level)
      raise ArgumentError.new("Level #{level} is invalid.") if !level || level <= 0
      level = [level, 200].min
      return @exp_values[level] if @exp_values && level < @exp_values.length
      raise "No Exp formula is defined for growth rate #{name}" if !@exp_formula
      return @exp_formula.call(level)
    end
  end
end

# 2. Temporary Snowpoint tree passage. It is map-specific and is cleared by
# Game_Map#setup, so loading any other map removes the permission automatically.
SNOWPOINT_PASS_SWITCH = 877
SNOWPOINT_TREE_TILE_IDS = [4480, 4481, 4484, 4485, 4488, 4489, 4496, 4497]

def pbSnowpointTreeCell?(x, y)
  return false if !$game_map || $game_map.map_id != 625
  return [2, 1, 0].any? { |z| SNOWPOINT_TREE_TILE_IDS.include?($game_map.data[x, y, z]) }
end

class Game_Map
  alias _ruta_de_dios_original_setup setup unless method_defined?(:_ruta_de_dios_original_setup)
  def setup(map_id)
    _ruta_de_dios_original_setup(map_id)
    $game_switches[SNOWPOINT_PASS_SWITCH] = false if $game_switches
  end
end

class Game_Player
  alias _ruta_de_dios_original_passable passable? unless method_defined?(:_ruta_de_dios_original_passable)
  def passable?(x, y, d, strict = false)
    result = _ruta_de_dios_original_passable(x, y, d, strict)
    return result if result
    return false if !$game_switches || !$game_switches[SNOWPOINT_PASS_SWITCH]
    new_x = x + (d == 6 ? 1 : d == 4 ? -1 : 0)
    new_y = y + (d == 2 ? 1 : d == 8 ? -1 : 0)
    return false unless pbSnowpointTreeCell?(new_x, new_y)
    blocked = $game_map.events.values.any? do |event|
      event.x == new_x && event.y == new_y && !event.through && event.character_name.to_s != ""
    end
    return false if blocked
    return true
  end
end

# 3. The six-phase encounter uses the battle's existing animation primitives.
ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH = 878
ARCEUS_ALLIES_GOLD_RED_SWITCH = 879
ARCEUS_ALLIES_VOLUS_SWITCH = 880
RUTA_ARCEUS_CAUGHT_SWITCH = 874

RUTA_ARCEUS_PHASE_THRESHOLDS = [0.84, 0.68, 0.52, 0.38, 0.22]
RUTA_ARCEUS_PHASE_PLATES = [
  :FLAMEPLATE, :SPLASHPLATE, :ZAPPLATE, :MEADOWPLATE, :ICICLEPLATE,
  :FISTPLATE, :TOXICPLATE, :EARTHPLATE, :SKYPLATE, :MINDPLATE,
  :INSECTPLATE, :STONEPLATE, :SPOOKYPLATE, :DRACOPLATE, :DREADPLATE,
  :IRONPLATE, :PIXIEPLATE
]
RUTA_ARCEUS_PHASE_TYPES = [
  :FIRE, :WATER, :ELECTRIC, :GRASS, :ICE, :FIGHTING, :POISON, :GROUND,
  :FLYING, :PSYCHIC, :BUG, :ROCK, :GHOST, :DRAGON, :DARK, :STEEL, :FAIRY
]
RUTA_ARCEUS_TYPE_NAMES = [
  "Fuego", "Agua", "Eléctrico", "Planta", "Hielo", "Lucha", "Veneno",
  "Tierra", "Volador", "Psíquico", "Bicho", "Roca", "Fantasma", "Dragón",
  "Siniestro", "Acero", "Hada"
]
RUTA_ARCEUS_MOVE_SETS = [
  [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE],
  [:JUDGMENT, :AEROBLAST, :PRECIPICEBLADES, :ORIGINPULSE],
  [:JUDGMENT, :MOONBLAST, :EARTHPOWER, :DARKVOID],
  [:JUDGMENT, :PSYCHOBOOST, :DRACOMETEOR, :SACREDSWORD],
  [:JUDGMENT, :EXTREMESPEED, :VCREATE, :PRECIPICEBLADES],
  [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE]
]

class PokeBattle_Battler
  alias _ruta_arceus_original_reduce_hp pbReduceHP unless method_defined?(:_ruta_arceus_original_reduce_hp)
  def pbReduceHP(amt, anim = true, registerDamage = true, anyAnim = true)
    if @battle && @battle.respond_to?(:arceus_divine?) && @battle.arceus_divine?
      amt = @battle.arceus_before_damage(self, amt)
      # The base battler clamps damage to at least 1 HP. Bypass that clamp when
      # Arceus is already at 1 HP, or it would faint before the catch turn.
      if amt == :ruta_arceus_hold_at_one
        @battle.check_arceus_phase(self)
        return 0
      end
      ret = _ruta_arceus_original_reduce_hp(amt, anim, registerDamage, anyAnim)
      @battle.check_arceus_phase(self)
      return ret
    end
    return _ruta_arceus_original_reduce_hp(amt, anim, registerDamage, anyAnim)
  end
end

class PokeBattle_Battle
  attr_accessor :arceus_restores_used

  def arceus_battler
    return @battlers.find { |b| b && b.opposes? && b.pokemon && b.pokemon.species == :ARCEUS }
  end

  def arceus_divine?
    b = arceus_battler
    return false if !b
    return true if @arceus_divine == true
    @arceus_divine = b.pokemon.instance_variable_get(:@ruta_arceus_divine) == true
    return @arceus_divine
  end

  def arceus_state(battler)
    pkmn = battler.pokemon
    @arceus_phase = pkmn.instance_variable_get(:@ruta_arceus_phase) || 1
    @arceus_restores_used = pkmn.instance_variable_get(:@ruta_arceus_restores) || 0
    @arceus_capture_ready = pkmn.instance_variable_get(:@ruta_arceus_capture_ready) == true
    @arceus_phase = 1 if @arceus_phase < 1
  end

  def save_arceus_state(battler)
    pkmn = battler.pokemon
    pkmn.instance_variable_set(:@ruta_arceus_phase, @arceus_phase)
    pkmn.instance_variable_set(:@ruta_arceus_restores, @arceus_restores_used)
    pkmn.instance_variable_set(:@ruta_arceus_capture_ready, @arceus_capture_ready == true)
  end

  def arceus_capture_ready?
    return false if !arceus_divine?
    b = arceus_battler
    return false if !b
    arceus_state(b)
    return @arceus_capture_ready == true
  end

  def arceus_before_damage(battler, amount)
    return amount if !arceus_divine? || !battler || battler.pokemon.species != :ARCEUS
    arceus_state(battler)
    if @arceus_capture_ready
      # La captura está abierta: Arceus ya no puede ser derrotado por daño, sólo capturado.
      return :ruta_arceus_hold_at_one if battler.hp <= 1
      return [amount, battler.hp - 1].min
    end
    # Arceus must stay at 1 HP until phase six is complete and the player has
    # had a real turn to throw a ball. At 1 HP, bypass the stock minimum-1-damage
    # clamp in PokeBattle_Battler#pbReduceHP.
    return :ruta_arceus_hold_at_one if battler.hp <= 1
    return [amount, battler.hp - 1].min if battler.hp - amount <= 0
    return [amount, 0].max
  end

  # Red de seguridad de la captura final: si el jugador llega sin ninguna ball, el Rotom
  # materializa una Bola del Testigo. Sin esto la fase final podía quedar sin salida.
  def pbArceusEnsureCaptureBall
    return if !$PokemonBag || !$PokemonBag.respond_to?(:pbHasItem?)
    balls = [:POKEBALL, :GREATBALL, :ULTRABALL, :MASTERBALL]
    return if balls.any? { |ball| $PokemonBag.pbHasItem?(ball) }
    $PokemonBag.pbStoreItem(:POKEBALL, 1) if $PokemonBag.respond_to?(:pbStoreItem)
    pbDisplay(_INTL("El Rotom vibra y materializa una Bola del Testigo: «No vas a dejar el trabajo a medias.»"))
  rescue StandardError
  end

  def check_arceus_phase(battler)
    return if !arceus_divine? || !battler || battler.pokemon.species != :ARCEUS
    arceus_state(battler)
    return if battler.fainted?
    ratio = battler.hp.to_f / [battler.totalhp, 1].max
    while @arceus_phase <= RUTA_ARCEUS_PHASE_THRESHOLDS.length &&
          ratio <= RUTA_ARCEUS_PHASE_THRESHOLDS[@arceus_phase - 1]
      @arceus_phase += 1
      pbArceusPhase(battler, @arceus_phase)
    end
    if @arceus_restores_used < 3 && @arceus_phase >= 4 && ratio <= 0.45
      @arceus_restores_used += 1
      pbDisplay(_INTL("¡El fulgor del Génesis retuerce la realidad alrededor de Arceus!"))
      pbDisplay(_INTL("¡Arceus utilizó un Restaura Todo divino ({1}/3)!", @arceus_restores_used))
      battler.pbRecoverHP(battler.totalhp)
      battler.pbCureStatus
      save_arceus_state(battler)
      return
    end
    if @arceus_phase >= 6 && battler.hp <= 1 && !@arceus_capture_ready
      @arceus_capture_ready = true
      pbArceusEnsureCaptureBall
      pbDisplay(_INTL("¡La última barrera de Arceus se rompe! El dios queda debilitado, inmóvil y expuesto a la captura."))
      pbDisplay(_INTL("¡La animación del debilitamiento final termina! ¡Desde este instante, la probabilidad de captura es del 100%!"))
      begin
        pbFlash(Color.new(255, 255, 255, 255), 20)
        pbShake(10, 10, 12)
      rescue StandardError
      end
    end
    save_arceus_state(battler)
  end

  def pbArceusDistortion
    begin
      pbShake(9, 9, 10)
      pbFlash(Color.new(180, 220, 255, 180), 12)
      pbToneChangeAll(Tone.new(80, 30, 120, 0), 3)
      pbToneChangeAll(Tone.new(0, 0, 0, 0), 5)
    rescue StandardError
    end
  end

  def pbArceusSetMoves(battler, move_ids)
    valid = move_ids.select { |id| GameData::Move.exists?(id) }
    return if valid.empty?
    battler.pokemon.moves = valid.map { |id| Pokemon::Move.new(id) }
    battler.moves.clear
    battler.pokemon.moves.each_with_index do |move, i|
      battler.moves[i] = PokeBattle_Move.from_pokemon_move(self, move)
    end
  end

  def pbArceusRotateType(battler, phase)
    index = (phase * 3 + @turnCount.to_i) % RUTA_ARCEUS_PHASE_PLATES.length
    plate = RUTA_ARCEUS_PHASE_PLATES[index]
    type = RUTA_ARCEUS_PHASE_TYPES[index]
    battler.item = plate if GameData::Item.exists?(plate)
    battler.pbChangeTypes([type])
    pbDisplay(_INTL("¡La ruleta de las Tablas gira y cambia a Arceus al tipo {1}!", RUTA_ARCEUS_TYPE_NAMES[index]))
  end

  def pbArceusSummon(battler, species, label)
    return if !GameData::Species.exists?(species)
    summon_level = [200, GameData::GrowthRate.max_level].min
    summon = Pokemon.new(species, summon_level)
    temp = PokeBattle_Battler.new(self, battler.index)
    temp.pbInitialize(summon, -1)
    battler.pbTransform(temp)
    pbDisplay(_INTL("¡Arceus invoca a {1}! La aparición legendaria toma el campo durante esta fase.", label))
  rescue StandardError
    pbDisplay(_INTL("¡Una silueta de {1} atraviesa la distorsión!", label))
  end

  def pbArceusCopyActive(battler)
    target = @battlers.find { |b| b && b.pbOwnedByPlayer? && !b.fainted? }
    return if !target
    pbDisplay(_INTL("Arceus extiende una mano de luz hacia {1} y toma a tu Pokémon activo para observarlo.", target.name))
    pbDisplay(_INTL("Con mi creación {1} pretendes hacerme frente, humano?", target.name))
    battler.pbTransform(target)
  end

  def pbArceusRealityControl
    party = pbParty(0)
    active_party = []
    @battlers.each do |b|
      active_party.push(b.pokemon) if b && b.pbOwnedByPlayer?
    end
    # Never alter the HP of an active battler directly: the battle object keeps
    # its own fainted flag. Reality control therefore targets a reserve first.
    fallen = party.find { |p| p && p.hp <= 0 && !active_party.include?(p) }
    if fallen
      fallen.hp = [fallen.totalhp / 2, 1].max
      fallen.heal_status
      pbDisplay(_INTL("¡Arceus reescribe la realidad y revive a {1} con la mitad de sus fuerzas!", fallen.name))
    else
      target = party.find { |p| p && p.hp < p.totalhp && !active_party.include?(p) }
      if target
        target.hp = [target.hp + target.totalhp / 3, target.totalhp].min
        pbDisplay(_INTL("¡Arceus cura a {1} sólo para demostrar que controla su destino!", target.name))
      end
    end
  end

  def pbArceusPhase(battler, phase)
    pbArceusDistortion
    case phase
    when 2
      pbArceusRotateType(battler, phase)
      pbDisplay(_INTL("FASE 2 — MEGA EVOLUCIÓN DEL GÉNESIS: las placas se funden en una corona imposible."))
      battler.pokemon.makeMega if battler.pokemon.respond_to?(:makeMega) && battler.pokemon.hasMegaForm?
      battler.pbRaiseStatStageBasic(:ATTACK, 2)
      battler.pbRaiseStatStageBasic(:SPECIAL_ATTACK, 2)
      pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[1])
    when 3
      pbArceusRotateType(battler, phase)
      pbDisplay(_INTL("FASE 3 — GIGAMAX DEL CREADOR: Arceus crece hasta cubrir el horizonte y altera el ritmo del combate."))
      battler.pbRecoverHP(battler.totalhp / 4)
      battler.pbRaiseStatStageBasic(:DEFENSE, 2)
      battler.pbRaiseStatStageBasic(:SPECIAL_DEFENSE, 2)
      pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[2])
      pbArceusRealityControl
    when 4
      pbArceusRotateType(battler, phase)
      pbDisplay(_INTL("FASE 4 — MOVIMIENTO Z: el juicio de Arceus concentra la energía de todas las regiones."))
      battler.pbRaiseStatStageBasic(:SPEED, 2)
      pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[3])
      pbArceusCopyActive(battler)
    when 5
      battler.effects[PBEffects::Transform] = false
      battler.effects[PBEffects::TransformSpecies] = 0
      battler.pbChangeTypes([:DRAGON])
      pbDisplay(_INTL("FASE 5 — LEGIONES DE LA CREACIÓN: Mew y los ecos de Dialga, Palkia y Giratina responden al llamado."))
      pbArceusSummon(battler, :MEW, "Mew")
      pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[4])
      battler.pbRaiseStatStageBasic(:ATTACK, 1)
      battler.pbRaiseStatStageBasic(:SPECIAL_ATTACK, 1)
    when 6
      battler.effects[PBEffects::Transform] = false
      battler.effects[PBEffects::TransformSpecies] = 0
      pbArceusRotateType(battler, phase)
      pbArceusSummon(battler, :GIRATINA, "Giratina Origen")
      pbDisplay(_INTL("FASE 6 — EL ÚLTIMO SELLO: Arceus puede usar cualquier movimiento, pero su forma divina ya no puede escapar del destino."))
      pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[5])
      pbDisplay(_INTL("¡Debilítalo una vez más para ver la animación final y abrir la captura!"))
    end
    save_arceus_state(battler)
  end

  alias _ruta_arceus_original_pbRun pbRun unless method_defined?(:_ruta_arceus_original_pbRun)
  def pbRun(idxBattler, duringBattle = false)
    if arceus_divine?
      pbDisplayPaused(_INTL("¡Arceus rompe visualmente el botón de escape! No puedes huir de una batalla contra el dios de los Pokémon."))
      begin
        pbShake(12, 10, 14)
        pbFlash(Color.new(255, 40, 40, 180), 12)
      rescue StandardError
      end
      return 0
    end
    return _ruta_arceus_original_pbRun(idxBattler, duringBattle)
  end
end

# 3. Real support battles. The map flags remain a visual cue, but each entrance
# now hands control to the normal Fire Ash battle scene. Every side is an NPC
# trainer and controlPlayer forces the player's side through the battle AI.
def pbArceusCinematicStage(switch_id)
  [ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH, ARCEUS_ALLIES_GOLD_RED_SWITCH,
   ARCEUS_ALLIES_VOLUS_SWITCH].each { |id| $game_switches[id] = false }
  $game_switches[switch_id] = true if switch_id
  $game_map.refresh if $game_map
  2.times { Graphics.update }
end

def pbArceusCinematicImpact(tone = Tone.new(80, 40, 120, 0))
  begin
    pbShake(8, 9, 10)
    pbFlash(Color.new(220, 240, 255, 180), 12)
    pbToneChangeAll(tone, 3)
    pbToneChangeAll(Tone.new(0, 0, 0, 0), 5)
  rescue StandardError
  end
end

# Build a battle-ready Pokémon without borrowing Ash's party. The normal
# Pokemon, move, item, stat and animation code still owns the resulting object.
def pbArceusCinematicPokemon(species, level, moves, item = nil)
  return nil if !GameData::Species.exists?(species)
  max_level = (species == :ARCEUS) ? 200 : (GameData::GrowthRate.max_level || 150).to_i
  max_level = 150 if max_level < 1
  safe_level = [[level.to_i, 1].max, max_level].min
  normal_cap = (GameData::GrowthRate.max_level || 150).to_i
  normal_cap = 150 if normal_cap < 1
  # S2b: sólo el Arceus divino del combate puede nacer por encima del tope normal.
  # Se marca antes de subirle el nivel porque el setter de nivel rechazaría el 200.
  divine = (species == :ARCEUS && safe_level > normal_cap)
  pkmn = Pokemon.new(species, divine ? normal_cap : safe_level)
  if divine
    pkmn.instance_variable_set(:@ruta_arceus_divine, true)
    pkmn.level = safe_level
  end
  GameData::Stat.each_main { |stat| pkmn.iv[stat.id] = 31 }
  # Keep cinematic teams within the standard 510 total EVs.
  pkmn.ev[:HP] = 6
  pkmn.ev[:SPEED] = 252
  pkmn.ev[:SPECIAL_ATTACK] = 252
  pkmn.moves = []
  moves.each do |move_id|
    pkmn.learn_move(move_id) if GameData::Move.exists?(move_id)
  end
  pkmn.item = item if item && GameData::Item.exists?(item)
  if species == :GIRATINA && item == :GRISEOUSORB && pkmn.respond_to?(:form_simple=)
    pkmn.form_simple = 1
  end
  pkmn.calc_stats
  return pkmn
end

def pbArceusCinematicBoss(moves)
  boss = pbArceusCinematicPokemon(:ARCEUS, 200, moves, :LEGENDPLATE)
  boss.ev[:HP] = 6
  boss.ev[:SPECIAL_ATTACK] = 252
  boss.ev[:SPEED] = 252
  boss.calc_stats
  return boss
end

# trainer_specs is [[name, trainer_type, party], ...]. Supplying two entries
# creates the real 2v1 double battle used by Cynthia/Steven and Gold/Red.
def pbArceusCinematicCpuBattle(trainer_specs, boss_moves, battle_size)
  old_rules = $PokemonTemp.battleRules.clone
  ash_party_state = $Trainer.party.map { |pkmn| [pkmn, pkmn.hp, pkmn.status, pkmn.pokerus] if pkmn }.compact
  player_trainers = []
  player_party = []
  player_starts = []
  trainer_specs.each do |spec|
    trainer = NPCTrainer.new(spec[0], spec[1])
    trainer.party = spec[2].compact
    player_trainers.push(trainer)
    player_starts.push(player_party.length)
    trainer.party.each { |pkmn| player_party.push(pkmn) }
  end
  boss_trainer = NPCTrainer.new("Arceus", :LEGENDARYPOKEMON)
  boss_trainer.party = [pbArceusCinematicBoss(boss_moves)]
  boss_party = boss_trainer.party
  decision = 0
  begin
    raise _INTL("La batalla cinematográfica necesita Pokémon aliados.") if player_party.empty?
    $PokemonTemp.clearBattleRules
    setBattleRule(battle_size)
    setBattleRule("cannotRun")
    setBattleRule("canLose")
    setBattleRule("noExp")
    setBattleRule("noMoney")
    setBattleRule("setStyle")
    setBattleRule("anims")

    scene = pbNewBattleScene
    battle = PokeBattle_Battle.new(scene, player_party, boss_party,
                                   player_trainers, [boss_trainer])
    battle.party1starts = player_starts
    battle.party2starts = [0]
    battle.items = [boss_trainer.items]
    battle.endSpeeches = [_INTL("La luz de Arceus permanece intacta.")]
    battle.endSpeechesWin = [_INTL("Los mortales aún no comprenden el peso de la creación.")]
    battle.controlPlayer = true
    pbPrepareBattle(battle)
    # pbPrepareBattle reads the standard rules; these assignments are the final
    # guard against a menu, escape or replacement prompt in this special scene.
    battle.controlPlayer = true
    battle.canRun = false
    battle.canLose = true
    battle.expGain = false
    battle.moneyGain = false
    battle.switchStyle = false

    $PokemonTemp.clearBattleRules
    Audio.me_stop
    pbBattleAnimation(pbGetTrainerBattleBGM([boss_trainer]),
                      (battle.singleBattle?) ? 1 : 3, [boss_trainer]) {
      pbSceneStandby {
        decision = battle.pbStartBattle
      }
    }
    Input.update
  ensure
    # The support battle owns every temporary Pokémon. Restore the only global
    # side effect the stock end-of-battle routine can cause: Pokerus spreading.
    ash_party_state.each do |pkmn, hp, status, pokerus|
      pkmn.hp = hp
      pkmn.status = status
      pkmn.pokerus = pokerus
    end
    $PokemonTemp.clearBattleRules
    old_rules.each { |key, value| $PokemonTemp.battleRules[key] = value }
  end
  return decision
end

# When a support Pokémon faints, the stock engine only auto-selects a
# replacement for partners/opponents. The first NPC support is technically
# owner index 0, so redirect that one narrow replacement path to the same AI.
class PokeBattle_Battle
  alias _ruta_arceus_original_pbSwitchInBetween pbSwitchInBetween unless method_defined?(:_ruta_arceus_original_pbSwitchInBetween)
  def pbSwitchInBetween(idxBattler, checkLaxOnly = false, canCancel = false)
    if @controlPlayer
      return @battleAI.pbDefaultChooseNewEnemy(idxBattler, pbParty(idxBattler))
    end
    return _ruta_arceus_original_pbSwitchInBetween(idxBattler, checkLaxOnly, canCancel)
  end
end

def pbArceusAshWill
  viewport = nil
  sprites = []
  begin
    viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    viewport.z = 9990
    $Trainer.party.each_with_index do |pkmn, index|
      next if !pkmn
      sprite = PokemonSprite.new(viewport)
      sprite.setPokemonBitmap(pkmn, false)
      sprite.x = 72 + (index % 3) * 112
      sprite.y = Graphics.height - 90 - (index / 3) * 78
      sprite.zoom_x = 0.42
      sprite.zoom_y = 0.42
      sprite.opacity = 96
      sprite.tone = Tone.new(80, 80, 130, 0)
      sprites.push(sprite)
    end
    12.times { Graphics.update }
    pbMessage(_INTL("Ash da un paso al frente. A su espalda, las siluetas transparentes de todos sus Pokémon se alzan como una sola voluntad."))
  rescue StandardError
    pbMessage(_INTL("Ash da un paso al frente. Detrás de él, la voluntad de sus Pokémon se reúne contra el vacío."))
  ensure
    sprites.each { |sprite| sprite.dispose rescue nil }
    viewport.dispose if viewport
  end
end

def pbArceusCinematicPrelude
  # Cynthia and Steven: a real CPU-vs-CPU double battle against the god.
  pbArceusCinematicStage(ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH)
  pbArceusCinematicImpact
  pbMessage(_INTL("Una grieta se abre detrás de Ash. Cynthia y Steven llegan juntos para ganar tiempo frente al Creador."))
  pbMessage(_INTL("Cynthia: Mis seis Pokémon están listos. Steven: los míos también. Ninguno de nosotros tocará un comando; dejaremos que el combate hable."))
  cynthia = [
    pbArceusCinematicPokemon(:SPIRITOMB, 145, [:SHADOWBALL, :DARKPULSE, :WILLOWISP, :PAINSPLIT], :LEFTOVERS),
    pbArceusCinematicPokemon(:TOGEKISS, 145, [:AIRSLASH, :DAZZLINGGLEAM, :ROOST, :THUNDERWAVE], :LEFTOVERS),
    pbArceusCinematicPokemon(:MILOTIC, 145, [:SCALD, :ICEBEAM, :RECOVER, :HYPERVOICE], :LEFTOVERS),
    pbArceusCinematicPokemon(:LUCARIO, 145, [:AURASPHERE, :FLASHCANNON, :VACUUMWAVE, :NASTYPLOT], :LUCARIONITE),
    pbArceusCinematicPokemon(:ROSERADE, 145, [:ENERGYBALL, :SLUDGEBOMB, :SLEEPPOWDER, :SYNTHESIS], :BLACKSLUDGE),
    pbArceusCinematicPokemon(:GARCHOMP, 145, [:EARTHQUAKE, :DRAGONCLAW, :STONEEDGE, :SWORDSDANCE], :LIFEORB),
  ]
  steven = [
    pbArceusCinematicPokemon(:SKARMORY, 145, [:BRAVEBIRD, :STEELWING, :ROOST, :STEALTHROCK], :LEFTOVERS),
    pbArceusCinematicPokemon(:METAGROSS, 145, [:METEORMASH, :ZENHEADBUTT, :BULLETPUNCH, :HAMMERARM], :METAGROSSITE),
    pbArceusCinematicPokemon(:AGGRON, 145, [:HEAVYSLAM, :ROCKSLIDE, :EARTHQUAKE, :PROTECT], :AGGRONITE),
    pbArceusCinematicPokemon(:ARMALDO, 145, [:XSCISSOR, :ROCKBLAST, :AQUAJET, :SWORDSDANCE], :LEFTOVERS),
    pbArceusCinematicPokemon(:CLAYDOL, 145, [:PSYCHIC, :EARTHPOWER, :RAPIDSPIN, :LIGHTSCREEN], :LIGHTCLAY),
    pbArceusCinematicPokemon(:CRADILY, 145, [:GIGADRAIN, :POWERGEM, :TOXIC, :RECOVER], :LEFTOVERS),
  ]
  pbArceusCinematicCpuBattle([
    ["Cynthia", :ARC_Cynthia, cynthia],
    ["Steven", :ARC_Steven, steven],
  ], [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE], "2v1")
  pbArceusCinematicImpact(Tone.new(40, 80, 160, 0))
  pbMessage(_INTL("Arceus elige sus movimientos sin recibir órdenes. Sentencia rompe las pantallas y el acero cae uno tras otro."))
  pbMessage(_INTL("Cynthia y Steven pierden todos sus Pokémon. Arceus conserva la calma y el combate termina con los mensajes normales del motor."))

  # Gold/Eco and Red: another real double battle, also fully automatic.
  pbArceusCinematicStage(ARCEUS_ALLIES_GOLD_RED_SWITCH)
  pbArceusCinematicImpact(Tone.new(160, 70, 30, 0))
  pbMessage(_INTL("Antes de que el polvo se asiente, Gold/Eco aparece junto a Red. Sus equipos entran al campo sin que Ash pueda intervenir."))
  gold = [
    pbArceusCinematicPokemon(:TYPHLOSION, 150, [:FLAMETHROWER, :ERUPTION, :FOCUSBLAST, :SOLARBEAM], :CHOICESPECS),
    pbArceusCinematicPokemon(:AMPHAROS, 150, [:THUNDERBOLT, :VOLTSWITCH, :SIGNALBEAM, :THUNDERWAVE], :AMPHAROSITE),
    pbArceusCinematicPokemon(:HERACROSS, 150, [:MEGAHORN, :CLOSECOMBAT, :ROCKBLAST, :SWORDSDANCE], :HERACRONITE),
    pbArceusCinematicPokemon(:SUDOWOODO, 150, [:STONEEDGE, :WOODHAMMER, :SUCKERPUNCH, :EARTHQUAKE], :LEFTOVERS),
    pbArceusCinematicPokemon(:TOGEKISS, 150, [:AIRSLASH, :DAZZLINGGLEAM, :ROOST, :THUNDERWAVE], :LEFTOVERS),
    pbArceusCinematicPokemon(:LUGIA, 150, [:AEROBLAST, :PSYCHIC, :ROOST, :ICEBEAM], :LEFTOVERS),
  ]
  red = [
    pbArceusCinematicPokemon(:PIKACHU, 150, [:THUNDERBOLT, :VOLTTACKLE, :IRONTAIL, :QUICKATTACK], :LIGHTBALL),
    pbArceusCinematicPokemon(:CHARIZARD, 150, [:FLAMETHROWER, :AIRSLASH, :DRAGONPULSE, :ROOST], :CHARIZARDITEX),
    pbArceusCinematicPokemon(:BLASTOISE, 150, [:HYDROPUMP, :AURASPHERE, :ICEBEAM, :RAPIDSPIN], :BLASTOISINITE),
    pbArceusCinematicPokemon(:VENUSAUR, 150, [:GIGADRAIN, :SLUDGEBOMB, :SLEEPPOWDER, :SYNTHESIS], :VENUSAURITE),
    pbArceusCinematicPokemon(:SNORLAX, 150, [:BODYSLAM, :CRUNCH, :REST, :CURSE], :LEFTOVERS),
    pbArceusCinematicPokemon(:MEWTWO, 150, [:PSYSTRIKE, :AURASPHERE, :ICEBEAM, :CALMMIND], :MEWTWONITEX),
  ]
  pbArceusCinematicCpuBattle([
    ["Gold/Eco", :ARC_Ethan, gold],
    ["Red", :SECRET_Red, red],
  ], [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE], "2v1")
  pbArceusCinematicImpact(Tone.new(160, 30, 30, 0))
  pbMessage(_INTL("Onda Trueno y Mewtwo obligan a Arceus a responder. La Tabla cambia, el cielo se pliega y los doce Pokémon son derrotados."))
  pbMessage(_INTL("Gold/Eco y Red han caído. Sus combates, cambios, estados, daños y debilitamientos fueron resueltos por las reglas normales."))

  # Volus and Giratina get a real single battle, but Arceus ends it immediately.
  pbArceusCinematicStage(ARCEUS_ALLIES_VOLUS_SWITCH)
  pbArceusCinematicImpact(Tone.new(90, 20, 140, 0))
  pbMessage(_INTL("Una última figura cruza la luz rota: Volus. Giratina Origen entra al campo para desafiar al creador."))
  giratina = [pbArceusCinematicPokemon(:GIRATINA, 150,
                                        [:SHADOWFORCE, :DRACOMETEOR, :EARTHPOWER, :AURASPHERE],
                                        :GRISEOUSORB)]
  pbArceusCinematicCpuBattle([
    ["Volus", :SECRET_Volo, giratina],
  ], [:JUDGMENT, :SHADOWFORCE, :ROAROFTIME, :SPACIALREND], "single")
  pbArceusCinematicImpact(Tone.new(120, 10, 180, 0))
  pbMessage(_INTL("Giratina es derrotado antes de poder prolongar la batalla. Volus cae de rodillas: ni siquiera su obsesión puede entrar en la guerra de Ash."))
  pbMessage(_INTL("Arceus: Tú no eres un aliado, Volus. Eres otro mortal intentando apropiarse de Mi creación."))

  pbArceusCinematicStage(nil)
  pbArceusAshWill
  pbMessage(_INTL("Ash: Ya fue suficiente. Ahora llegó el momento de luchar personalmente contra Arceus."))
  pbArceusCinematicImpact(Tone.new(255, 255, 255, 0))
end

# 4. Capture gate. This is before the normal Master Ball/unconditional-capture
# check, so even a Master Ball is exactly 0% until the final weakening is over.
module PokeBattle_BattleCommon
  alias _ruta_arceus_original_capture_calc pbCaptureCalc unless method_defined?(:_ruta_arceus_original_capture_calc)
  def pbCaptureCalc(pkmn, battler, catch_rate, ball)
    if battler && battler.pokemon && battler.pokemon.species == :ARCEUS &&
       respond_to?(:arceus_divine?) && arceus_divine?
      return 4 if arceus_capture_ready?
      return 0
    end
    return _ruta_arceus_original_capture_calc(pkmn, battler, catch_rate, ball)
  end
end

# 4. Pseudo-PC continuation. Defeated teams are moved without healing, then the
# player chooses up to six able Pokémon from storage. Choosing surrender exits
# through the engine's normal start-over path.
def pbArceusStorageCandidates
  ret = []
  return ret if !$PokemonStorage
  for box in 0...$PokemonStorage.maxBoxes
    for index in 0...$PokemonStorage.maxPokemon(box)
      pkmn = $PokemonStorage[box, index]
      ret.push([box, index, pkmn]) if pkmn && pkmn.able? && !(pkmn.respond_to?(:egg?) && pkmn.egg?)
    end
  end
  return ret
end

def pbArceusReplacePartyFromStorage(selected)
  return false if !$PokemonStorage || selected.empty?
  party = $Trainer.party.compact
  selected_keys = selected.map { |entry| [entry[0], entry[1]] }
  free = []
  for box in 0...$PokemonStorage.maxBoxes
    for index in 0...$PokemonStorage.maxPokemon(box)
      next if selected_keys.include?([box, index])
      free.push([box, index]) if !$PokemonStorage[box, index]
    end
  end
  # If fewer replacements than current party members were chosen, the excess
  # defeated Pokémon still need a place. A full PC can therefore be used when
  # six replacements are selected: their six storage slots are swapped safely.
  excess = [party.length - selected.length, 0].max
  return false if free.length < excess
  party.drop(selected.length).first(excess).each_with_index do |pkmn, i|
    $PokemonStorage[free[i][0], free[i][1]] = pkmn
  end
  selected.each_with_index do |entry, i|
    $PokemonStorage[entry[0], entry[1]] = party[i] if i < party.length
  end
  $Trainer.party.clear
  selected.each { |entry| $Trainer.party.push(entry[2]) }
  return true
end

def pbArceusPseudoPC
  candidates = pbArceusStorageCandidates
  return false if candidates.empty?
  # Selection is transactional. The current team stays in the party until the
  # player confirms a replacement, so surrender can still use the normal
  # blackout/return flow without leaving the player with an empty party.
  pbMessage(_INTL("¡Debes continuar! Los seis Pokémon actuales han caído. Se abre una interfaz de pseudo-PC."))
  pbMessage(_INTL("El pseudo-PC no cura Pokémon. Elige hasta seis Pokémon que todavía puedan luchar."))
  selected = []
  6.times do
    remaining = candidates.reject { |entry| selected.include?(entry) }
    break if remaining.empty?
    commands = remaining.map { |entry| _INTL("{1} (Nv. {2})", entry[2].name, entry[2].level) }
    can_finish = selected.length >= $Trainer.party.compact.length
    commands.push(_INTL("Terminar selección / rendirse")) if can_finish
    cancel_command = can_finish ? commands.length : -1
    choice = pbMessage(_INTL("Selecciona el Pokémon {1}/6 para continuar.", selected.length + 1), commands, cancel_command)
    return false if choice < 0 || choice >= remaining.length
    selected.push(remaining[choice])
  end
  return false if selected.empty?
  return false if !pbArceusReplacePartyFromStorage(selected)
  pbMessage(_INTL("El pseudo-PC se cierra. Ningún Pokémon fue curado. ¡El combate continúa mientras quede voluntad de luchar!"))
  return true
end

def pbArceusSurrenderSequence
  pbMessage(_INTL("Ash: ¡Me rindo! ¡Todos, retiraos!"))
  begin
    3.times do |i|
      pbShake(10 + i * 3, 10, 12)
      pbFlash(Color.new(255, 255, 255, 180), 10)
      pbToneChangeAll(Tone.new(-80 * (i + 1), -80 * (i + 1), -80 * (i + 1), 0), 2)
      pbMessage([_INTL("¡Los entrenadores gritan mientras el santuario se resquebraja!"),
                 _INTL("¡Las rutas celestiales se deshacen en una destrucción progresiva!"),
                 _INTL("¡La Cima del Génesis cae en el vacío!" )][i])
    end
    pbToneChangeAll(Tone.new(0, 0, 0, 0), 4)
  rescue StandardError
  end
  pbMessage(_INTL("La realidad expulsa a Ash. El viaje vuelve a la pantalla principal."))
  begin
    $PokemonTemp.clearBattleRules if $PokemonTemp
    $game_switches[RUTA_DE_DIOS_ARCEUS_RESOLVED] = true if $game_switches
  rescue StandardError
  end
  pbStartOver
end

# 5. Starter. The loop is deliberately outside the normal battle loop: it lets
# the engine finish a battle, show the pseudo-PC, and then start another battle
# with the same Arceus object and its persistent phase/HP state.
# S1: el Arceus capturado deja de ser el dios del combate. Sin esto, el ejemplar que entra
# en la partida conservaba las variables de fase/restauraciones/captura del jefe.
def pbArceusNormalizeCaptured(pkmn)
  return if !pkmn
  pkmn.instance_variable_set(:@ruta_arceus_divine, false)
  pkmn.instance_variable_set(:@ruta_arceus_phase, 1)
  pkmn.instance_variable_set(:@ruta_arceus_restores, 0)
  pkmn.instance_variable_set(:@ruta_arceus_capture_ready, false)
rescue StandardError
end

def pbStartArceusDivineBattle
  $game_switches[RUTA_ARCEUS_CAUGHT_SWITCH] = false if $game_switches
  pkmn = Pokemon.new(:ARCEUS, GameData::GrowthRate.max_level)
  pkmn.instance_variable_set(:@ruta_arceus_divine, true)
  pkmn.level = 200
  pkmn.instance_variable_set(:@ruta_arceus_phase, 1)
  pkmn.instance_variable_set(:@ruta_arceus_restores, 0)
  pkmn.instance_variable_set(:@ruta_arceus_capture_ready, false)
  GameData::Stat.each_main { |s| pkmn.iv[s.id] = 31 }
  pkmn.item = :LEGENDPLATE if GameData::Item.exists?(:LEGENDPLATE)
  pkmn.moves = RUTA_ARCEUS_MOVE_SETS[0].select { |id| GameData::Move.exists?(id) }.map { |id| Pokemon::Move.new(id) }
  pkmn.calc_stats

  $PokemonGlobal.nextBattleBGM = "Legend Sinnoh"
  $PokemonGlobal.nextBattleBack = "snow"
  $PokemonTemp.clearBattleRules
  $PokemonTemp.recordBattleRule("cannotRun")
  $PokemonTemp.recordBattleRule("canLose")

  pbArceusCinematicPrelude
  active = $Trainer.party.find { |p| p && p.able? }
  pbMessage(_INTL("Arceus toma a {1}, lo observa con la calma de un dios y dice: Con mi creación {1} pretendes hacerme frente, humano?", active ? active.name : $Trainer.name))
  pbMessage(_INTL("La ruleta de las 17 Tablas comienza a girar. Esta no es una batalla normal de seis Pokémon."))

  loop do
    snapshot = $Trainer.party.map { |p| [p, p.hp, p.status] }
    decision = pbWildBattleCore(pkmn)
    if decision == 4
      $game_switches[RUTA_ARCEUS_CAUGHT_SWITCH] = true if $game_switches
      pbArceusNormalizeCaptured(pkmn)
      return decision
    end
    return decision if decision == 1
    if decision == 2
      # pbWildBattleCore is run with canLose=true, which normally heals a party
      # after a loss. Restore every HP/status here: the pseudo-PC never heals.
      snapshot.each do |entry|
        p = entry[0]
        p.hp = entry[1]
        p.status = entry[2] if entry[1] > 0
      end
      if pbArceusPseudoPC
        $PokemonTemp.clearBattleRules
        $PokemonTemp.recordBattleRule("cannotRun")
        $PokemonTemp.recordBattleRule("canLose")
        next
      end
      pbArceusSurrenderSequence
      return 2
    end
    return decision if decision == 3 || decision == 5
  end
end
`;


function installScriptSection() {
  const scripts = readRx("Scripts.rxdata");
  const existingIdx = scripts.findIndex(([id, title]) => title.text === "PokeMod_RutaDeDios");
  const compressed = zlib.deflateSync(Buffer.from(RUTA_DE_DIOS_RUBY, "utf-8"));
  const rstr = new RString(compressed);

  if (existingIdx !== -1) {
    scripts[existingIdx][2] = rstr;
  } else {
    // Insert right before Main
    const mainIdx = scripts.length - 1;
    const newId = 999901;
    const newSection = [newId, S("PokeMod_RutaDeDios"), rstr];
    scripts.splice(mainIdx, 0, newSection);
  }

  writeRx("Scripts.rxdata", scripts);
  console.log("OK: PokeMod_RutaDeDios installed in Scripts.rxdata.");
}

// ---------------------------------------------------------------------------
// 2. System Switches Expansion (System.rxdata)
// ---------------------------------------------------------------------------
function installSwitches() {
  const sys = readRx("System.rxdata");
  const sw = sys.getIvar("@switches");
  while (sw.length <= 880) sw.push(null);

  sw[SW_UNLOCKED] = S("RUTA_DE_DIOS_UNLOCKED");
  sw[SW_DIALGA_DEFEATED] = S("RUTA_DE_DIOS_DIALGA_DEFEATED");
  sw[SW_PALKIA_DEFEATED] = S("RUTA_DE_DIOS_PALKIA_DEFEATED");
  sw[SW_ARCEUS_RESOLVED] = S("RUTA_DE_DIOS_ARCEUS_RESOLVED");
  sw[SW_ARCEUS_CAUGHT] = S("RUTA_DE_DIOS_ARCEUS_CAUGHT");
  sw[SW_VOLO_DEFEATED] = S("RUTA_DE_DIOS_VOLO_DEFEATED");
  sw[SW_COMPLETED] = S("RUTA_DE_DIOS_COMPLETED");
  sw[SW_SNOWPOINT_PASS] = S("SNOWPOINT_TEMPORARY_TREE_PASS");
  sw[SW_ARCEUS_ALLIES_CYNTHIA_STEVEN] = S("ARCEUS_CINEMATIC_CYNTHIA_STEVEN");
  sw[SW_ARCEUS_ALLIES_GOLD_RED] = S("ARCEUS_CINEMATIC_GOLD_RED");
  sw[SW_ARCEUS_ALLIES_VOLUS] = S("ARCEUS_CINEMATIC_VOLUS");

  writeRx("System.rxdata", sys);
  console.log("OK: Switches 870..880 registered in System.rxdata.");
}

// ---------------------------------------------------------------------------
// 3. Volo in Twinleaf Town (Map 513)
// ---------------------------------------------------------------------------
function installTwinleafVolo() {
  const map513 = readRx("Map513.rxdata");
  const events = iv(map513, "events").pairs;

  // Remove existing Volo if already present
  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Volus de la Ruta"));
  if (idx !== -1) events.splice(idx, 1);

  // New Volo Event at (18, 14)
  const id = 101;
  const p1 = page({
    gfx: graphic("SECRET_Volo", 2),
    list: [
      cmd(101, [S("\\bVolus: Ah... ¿eres tú el muchacho que desafía los horizontes de Sinnoh?\\1")]),
      cmd(101, [S("\\bMe llamo Volus. Soy un humilde mercader... y un apasionado buscador de los mitos que forjaron la creación.")]),
      script("pbCount = pbCountArceusPlates"),
      cmd(111, [12, S("pbHasAllArceusPlates?")]),
      // When player HAS all 17 plates:
      cmd(101, [S("\\bVolus: ... ¡¿QUÉ?! ¡¿E-Esas luces que emanan de tu Mochila...?!\\1")]),
      cmd(101, [S("\\b¡¿Es... es imposible?! ¡Tienes contigo TODAS las 17 Tablas del Génesis!")]),
      cmd(101, [S("\\bLa Llama, la Gota, el Trueno, el Prado, el Helado, la Tabla Fuerte, la Tóxica, la Terrestre, la Celeste, la Mental, la Bicho, la Pétrea, la Terrorífica, la Dragón, la Oscura, la Acero y la Duende...")]),
      cmd(101, [S("\\b¡Es una oportunidad entre una infinidad! ¡El mito primordial ha despertado!")]),
      // Earthquake cinematic
      script("$game_screen.start_shake(6, 6, 60)"),
      cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
      cmd(224, [new RUserDef("Color", Buffer.alloc(32)), 30]),
      cmd(101, [S("\\b¡¡RUUUUMBLE!!")]),
      cmd(101, [S("\\b¡Un colosal terremoto cósmico sacude la región entera de Sinnoh!")]),
      cmd(101, [S("\\bVolus: ¡¿Qué ha sido ese temblor divino?! ¡Las Tablas están resonando con la Cima del Mundo!\\1")]),
      cmd(101, [S("\\b¡Una fractura dimensional acaba de rasgar el cielo sobre la entrada del Templo de Ciudad Puntaneva!")]),
      cmd(101, [S("\\b¡El velo de los dioses se ha quebrado! ¡Asciende hacia Ciudad Puntaneva si tienes la osadía de enfrentar lo que aguarda en la cumbre!")]),
      cmd(121, [SW_UNLOCKED, SW_UNLOCKED, 0]), // Set SW_UNLOCKED ON
      cmd(411), // Else (lacks plates)
      cmd(101, [S("\\bVolus: Cuenta la leyenda que el Creador dispersó 17 Tablas elementales antes de sumirse en su letargo.")]),
      cmd(101, [S("\\bActualmente percibo que posees \\v[1] de las 17 Tablas del Génesis.")]),
      cmd(101, [S("¿Deseas que canalice la resonancia de las eras pasadas para despertar las Tablas restantes?\\ch[1,2,Canalizar resonancia,Buscaré por mi cuenta]")]),
      cmd(111, [12, S("$game_variables[1] == 1")]),
      script("pbGrantAllArceusPlates"),
      cmd(101, [S("\\b¡Las 17 Tablas del Génesis han resonado intensamente y se manifiestan en tu Mochila!\\1")]),
      cmd(101, [S("\\bVolus: ¡Increíble! ¡Todas las Tablas están unidas!")]),
      script("$game_screen.start_shake(6, 6, 60)"),
      cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
      cmd(101, [S("\\b¡Un colosal terremoto cósmico sacude la región de Sinnoh!")]),
      cmd(101, [S("\\bVolus: ¡El portal se ha abierto en Ciudad Puntaneva! ¡Hacia allá, aprisa!")]),
      cmd(121, [SW_UNLOCKED, SW_UNLOCKED, 0]),
      cmd(411),
      cmd(101, [S("\\bVolus: Regresa cuando reúnas las Tablas. El destino no esperará por siempre.")]),
      cmd(412),
      cmd(412),
      cmd(0),
    ],
  });

  // Page 2: Route is unlocked
  const p2 = page({
    cond: condition({ sw: SW_UNLOCKED }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      cmd(101, [S("\\bVolus: ¡La Ruta de Dios está abierta en Ciudad Puntaneva!\\1")]),
      cmd(101, [S("\\bNo pierdas tiempo. Lo que aguarda en la Cima del Génesis decidirá la existencia de todo nuestro mundo.")]),
      cmd(0),
    ],
  });

  // Page 3: Completed
  const p3 = page({
    cond: condition({ sw: SW_COMPLETED }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      cmd(101, [S("\\bVolus: La suave brisa de Sinnoh... Ha pasado mucho tiempo desde que sentí tanta paz. Gracias, Ash.")]),
      cmd(0),
    ],
  });

  events.push([id, event(id, "Volus de la Ruta", 18, 14, [p1, p2, p3])]);
  writeRx("Map513.rxdata", map513);
  console.log("OK: Volo installed in Twinleaf Town (Map 513).");
}

// ---------------------------------------------------------------------------
// 4. Celestial approach in Snowpoint City (Map 625)
// ---------------------------------------------------------------------------
function paintSnowpointRoute(mapObj) {
  const table = tableFromUserDef(iv(mapObj, "data"));
  // Apertura deliberada de una avenida de nieve: conserva la ciudad y sus
  // árboles laterales, pero elimina solo lo que bloqueaba el santuario. No se
  // pinta una alfombra gris artificial; el suelo nevado original continúa por
  // debajo, como en los mapas profesionales de Puntaneva.
  for (let y = 4; y <= 7; y++) for (let x = 18; x <= 22; x++) {
    for (let z = 1; z <= 2; z++) tableSet(table, x, y, z, 0);
    tableSet(table, x, y, 0, 4457);
  }
  for (let y = 14; y <= 27; y++) for (let x = 18; x <= 22; x++) {
    for (let z = 1; z <= 2; z++) tableSet(table, x, y, z, 0);
    tableSet(table, x, y, 0, 4457);
  }

  mapObj.setIvar("data", tableToUserDef(table));
}

function installSnowpointGuide() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;
  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Volus — Guía Celestial"));
  if (idx !== -1) events.splice(idx, 1);

  const guide = event(103, "Volus — Guía Celestial", 20, 16, [
    page({
      cond: condition({ sw: SW_UNLOCKED }),
      gfx: graphic("SECRET_Volo", 2),
      list: [
        ...textCommands([
          "Volus: Has regresado. Mi otro yo de Pueblo Hojaverde despertó la resonancia, pero yo he preparado el sendero.",
          "Volus: Los árboles que sellaban el antiguo camino ya no ocultan la avenida. Sigue la nieve azulada hacia el santuario.",
          "Volus: Más allá del portal comienza una montaña que no pertenece a una sola región: en sus piedras duermen las leyendas de todos los Pokémon.",
          "Volus: No corras. Observa las columnas, las fuentes y las luces; cada detalle marca el ascenso hacia la Cima del Génesis.",
          "Volus: Cuando estés listo, avanza al norte. Yo custodiaré este umbral hasta que el cielo vuelva a cerrarse.",
        ]),
        cmd(0),
      ],
    }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]);
  events.push([103, guide]);
  writeRx("Map625.rxdata", map625);
}

function installSnowpointTreeGuide() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;
  for (let i = events.length - 1; i >= 0; i--) {
    if (txt(iv(events[i][1], "name")) === "Squirtle — Paso Temporal") events.splice(i, 1);
  }
  const squirtle = event(104, "Squirtle — Paso Temporal", 19, 55, [
    page({
      gfx: graphic("SQUIRTLE", 2),
      list: [
        ...textCommands([
          "Squirtle: ¡Squirtle! Los árboles de Puntaneva son muy densos incluso para los viajeros más valientes.",
          "Squirtle: Puedo abrirte paso entre ellos mientras sigas dentro de esta ciudad.",
        ]),
        cmd(121, [SW_SNOWPOINT_PASS, SW_SNOWPOINT_PASS, 0]),
        ...textCommands([
          "Una corriente de agua despeja tus pasos. Ahora puedes atravesar los árboles de Ciudad Puntaneva.",
          "El permiso es temporal: desaparecerá automáticamente al salir del mapa.",
        ]),
        cmd(0),
      ],
    }),
  ]);
  events.push([104, squirtle]);
  writeRx("Map625.rxdata", map625);
}

function clearSnowpointRegigigasArea(mapObj) {
  const table = tableFromUserDef(iv(mapObj, "data"));
  // Remove the old Regigigas temple footprint, its pillars and the trees that
  // made the entrance feel sealed. The new portal plaza remains open snow.
  for (let y = 7; y <= 13; y++) for (let x = 16; x <= 24; x++) {
    tableSet(table, x, y, 0, 4457);
    tableSet(table, x, y, 1, 0);
    tableSet(table, x, y, 2, 0);
  }
  mapObj.setIvar("data", tableToUserDef(table));
}

function installSnowpointPortal() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;

  // Brandon was the old NPC at the Regigigas entrance. Remove him with the
  // temple so the space is genuinely available for the celestial approach.
  for (let i = events.length - 1; i >= 0; i--) {
    const name = txt(iv(events[i][1], "name"));
    if (name === "Brandon" || name.includes("Regigigas")) events.splice(i, 1);
  }
  clearSnowpointRegigigasArea(map625);

  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (idx !== -1) events.splice(idx, 1);

  const id = 102;
  const p1 = page({
    // Recuperación: el portal debe aparecer aunque una partida antigua no conserve
    // correctamente el switch 870. La conversación de Volus sigue siendo la ruta
    // narrativa, pero la entrada no queda bloqueada por una flag perdida.
    cond: condition(),
    gfx: graphic("ARCEUS_GATE", 2),
    trigger: 0,
    list: [
      cmd(101, [S("Una majestuosa fisura de luz celestial resuena ante las puertas del templo.")]),
      cmd(101, [S("¿Deseas ascender por 'La Ruta de Dios' hacia las alturas del cosmos?\\ch[1,2,Ascender,Permanecer en Puntaneva]")]),
      cmd(111, [12, S("$game_variables[1] == 1")]),
      cmd(101, [S("Una ráfaga de viento sagrado envuelve tu cuerpo...")]),
      transfer(2038, 26, 68, 8, 1),
      cmd(412),
      cmd(0),
    ],
  });

  paintSnowpointRoute(map625);
  events.push([id, event(id, "Portal a la Ruta de Dios", 20, 14, [p1])]);
  writeRx("Map625.rxdata", map625);
  console.log("OK: Portal and celestial avenue installed in Snowpoint City (Map 625).");
}

// ---------------------------------------------------------------------------
// 5. Build Maps 2031..2037 (The 7 Floors of La Ruta de Dios)
// ---------------------------------------------------------------------------

// Architectural Primitives
// ---------------------------------------------------------------------------
function drawCoronetCliff(canvas, x, y, w, h, { stairs = [] } = {}) {
  // Top rim
  canvas.set(x, y, 1, 1259);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 1260);
  canvas.set(x + w - 1, y, 1, 1261);

  // Vertical cliff faces
  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 1252);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 1249);
    canvas.set(x + w - 1, j, 1, 1253);
  }

  // Bottom rim
  canvas.set(x, y + h - 1, 1, 1265);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 1273);
  canvas.set(x + w - 1, y + h - 1, 1, 1267);

  // Carve out stone stairs cutting through cliff face
  for (const sx of stairs) {
    for (let j = y; j < y + h; j++) {
      canvas.set(sx, j, 1, 1243);
      canvas.set(sx + 1, j, 1, 1243);
      canvas.set(sx, j, 0, 1257);
      canvas.set(sx + 1, j, 0, 1257);
    }
  }
}

function drawWhiteMarbleDais(canvas, x, y, w, h, { stairs = [] } = {}) {
  // Top row
  canvas.set(x, y, 1, 4400);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 4401);
  canvas.set(x + w - 1, y, 1, 4402);

  // Middle rows
  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 4408);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 4409);
    canvas.set(x + w - 1, j, 1, 4410);
  }

  // Bottom row
  canvas.set(x, y + h - 1, 1, 4416);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 4417);
  canvas.set(x + w - 1, y + h - 1, 1, 4418);

  // Bottom stairs
  for (const sx of stairs) {
    canvas.set(sx, y + h - 1, 1, 1161);
    canvas.set(sx + 1, y + h - 1, 1, 1162);
  }
}

function drawPavedRoad(canvas, x, y, w, h) {
  // The route is a natural snowy floor, not a pasted rectangular road. The
  // surrounding cliffs, statues and stair gates provide the navigation cues.
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) canvas.set(x + i, y + j, 0, 4457);
  }
}

function drawGuardianStatue(canvas, x, y) {
  canvas.set(x, y - 1, 2, 4307); // Carved dragon/gargoyle head with horns
  canvas.set(x, y, 1, 4315);     // Inscribed stone plinth
}

function drawFrostedPineTree(canvas, x, y) {
  canvas.set(x, y - 3, 2, 4484);
  canvas.set(x + 1, y - 3, 2, 4485);
  canvas.set(x, y - 2, 1, 4480);
  canvas.set(x + 1, y - 2, 1, 4481);
  canvas.set(x, y - 1, 1, 4488);
  canvas.set(x + 1, y - 1, 1, 4489);
  canvas.set(x, y, 1, 4496);
  canvas.set(x + 1, y, 1, 4497);
}

function drawPineGrove(canvas, x, y, w, h) {
  for (let j = 0; j < h; j += 4) {
    for (let i = 0; i < w; i += 2) {
      drawFrostedPineTree(canvas, x + i, y + j + 3);
    }
  }
}

function buildCelestialApproach() {
  const W = 52, H = 72;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  // La aproximación no es una pantalla corta: es una montaña escalonada con
  // cuatro terrazas, curvas de procesión y un cielo cada vez más despejado.
  plantNaturalFlankPines(cv, W, H);
  for (let y = 6; y < H - 4; y += 7) {
    drawFrostedPineTree(cv, 6, y);
    drawFrostedPineTree(cv, 8, y + 2);
    drawFrostedPineTree(cv, W - 7, y + 1);
    drawFrostedPineTree(cv, W - 9, y + 3);
  }

  // Avenida serpenteante: cada giro obliga a leer el relieve antes de seguir.
  drawPavedRoad(cv, 24, 60, 5, 12);
  drawPavedRoad(cv, 24, 46, 5, 16);
  drawPavedRoad(cv, 24, 43, 13, 8);
  drawPavedRoad(cv, 32, 27, 5, 18);
  drawPavedRoad(cv, 15, 27, 22, 6);
  drawPavedRoad(cv, 14, 13, 5, 17);
  drawPavedRoad(cv, 14, 10, 15, 6);
  drawPavedRoad(cv, 24, 4, 5, 10);

  // Muros de montaña y escaleras talladas en puntos de cambio de altitud.
  drawCoronetCliff(cv, 5, 57, 42, 3, { stairs: [25] });
  drawCoronetCliff(cv, 7, 40, 38, 3, { stairs: [33] });
  drawCoronetCliff(cv, 5, 23, 42, 3, { stairs: [15] });
  drawCoronetCliff(cv, 10, 10, 32, 3, { stairs: [25] });

  // Santuarios laterales: no bloquean la avenida, pero hacen que cada terraza
  // parezca una estación de peregrinaje y no un pasillo repetido.
  drawWhiteMarbleDais(cv, 7, 48, 11, 5, { stairs: [11] });
  drawSunburstAltar(cv, 10, 48);
  drawColumn(cv, 8, 46); drawColumn(cv, 15, 46);
  drawGuardianStatue(cv, 9, 54); drawGuardianStatue(cv, 16, 54);

  drawWhiteMarbleDais(cv, 37, 30, 10, 5, { stairs: [40] });
  drawCosmicGateway(cv, 39, 30);
  drawColumn(cv, 38, 28); drawColumn(cv, 44, 28);
  drawGuardianStatue(cv, 39, 36); drawGuardianStatue(cv, 44, 36);

  drawCosmicPool(cv, 7, 17);
  drawCosmicPool(cv, 39, 16);
  drawCosmicPool(cv, 39, 51);
  drawMonolith(cv, 9, 28); drawMonolith(cv, 43, 24);
  drawMonolith(cv, 9, 63); drawMonolith(cv, 43, 63);

  // Praderas con encuentros, suspendidas entre los muros y la ruta principal.
  drawWildGrassPatch(cv, 7, 35, 6, 7);
  drawWildGrassPatch(cv, 39, 39, 6, 7);
  drawWildGrassPatch(cv, 7, 58, 7, 7);
  drawWildGrassPatch(cv, 38, 58, 7, 7);

  // Cima de transición: el mármol blanco anuncia que ya no se pisa una montaña
  // normal. Desde aquí se entra a la primera puerta de La Ruta de Dios.
  drawWhiteMarbleDais(cv, 18, 2, 17, 6, { stairs: [25] });
  drawSunburstAltar(cv, 24, 2);
  drawCosmicGateway(cv, 20, 3);
  drawCosmicGateway(cv, 31, 3);
  drawColumn(cv, 22, 3); drawColumn(cv, 29, 3);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — Aproximación Celestial", bgm: "Legend Sinnoh" });
  addEventToMap(map, transferEvent(1, "Regreso a Ciudad Puntaneva", 26, 70, 625, 20, 5, 2, [
    "El sendero desciende entre nubes plateadas hacia Ciudad Puntaneva.",
    "¿Deseas regresar al refugio de Sinnoh?",
  ]));
  addEventToMap(map, transferEvent(2, "Puerta de la Cima del Génesis", 26, 5, 2031, 20, 36, 8, [
    "La última escalinata atraviesa las nubes. Más allá comienza la montaña sagrada.",
    "¿Deseas cruzar hacia la Puerta de las Columnas?",
  ]));

  const beacon = (id, name, x, y, lines) => addEventToMap(map, event(id, name, x, y, [
    page({ gfx: graphic("Object ball special", 2), list: [...textCommands(lines), cmd(0)] }),
  ]));
  beacon(3, "Hito de las Regiones", 21, 54, [
    "Un hito de hielo refleja imágenes de muchas regiones: bosques, volcanes, océanos y ciudades suspendidas.",
    "La inscripción dice: Ningún Pokémon pertenece a un solo horizonte; todos comparten el mismo cielo.",
  ]);
  beacon(4, "Hito del Tiempo", 37, 36, [
    "La piedra vibra con un tic tac remoto. El aire parece recordar cada paso dado por los entrenadores del mundo.",
    "Una segunda inscripción responde: El valor de un viaje se mide por los lazos que deja atrás.",
  ]);
  beacon(5, "Hito del Vínculo", 12, 19, [
    "Una luz cálida late bajo el hielo. No es una recompensa: es el recuerdo de cada compañero que te ha seguido.",
  ]);
  beacon(6, "Hito del Origen", 30, 8, [
    "Las nubes se abren por un instante. Una silueta de Arceus aparece en el firmamento y luego se convierte en estrellas.",
    "El camino termina solo cuando el corazón deja de mirar hacia arriba.",
  ]);
  addEventToMap(map, hiddenItemEvent(7, "Reliquia de la Aurora", 37, 43, "STARDUST", "Polvo Estelar"));
  addEventToMap(map, hiddenItemEvent(8, "Reliquia del Vínculo", 13, 29, "RARECANDY", "Caramelo Raro"));
  return { map, cv };
}

function drawWildGrassPatch(canvas, x, y, w, h) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      canvas.set(i, j, 1, 447); // Frosted winter grass (Terrain Tag 2 = Wild encounters!)
    }
  }
}

function drawSacredBoulder(canvas, x, y, cluster = false) {
  canvas.set(x, y, 1, cluster ? 4461 : 4453);
}

function drawCosmicPool(canvas, x, y) {
  canvas.set(x, y, 1, 4430); canvas.set(x + 1, y, 1, 4431);
  canvas.set(x, y + 1, 1, 4438); canvas.set(x + 1, y + 1, 1, 4439);
  canvas.set(x, y + 2, 1, 4446); canvas.set(x + 1, y + 2, 1, 4447);
}

function drawCosmicGateway(canvas, x, y) {
  canvas.set(x, y, 2, 4454); canvas.set(x + 1, y, 2, 4455);
  canvas.set(x, y + 1, 1, 4462); canvas.set(x + 1, y + 1, 1, 4463);
}

function drawSunburstAltar(canvas, x, y) {
  canvas.set(x, y, 1, 4403);
  canvas.set(x + 1, y, 1, 4404);
  canvas.set(x + 2, y, 1, 4404);
  canvas.set(x + 3, y, 1, 4405);
  canvas.set(x, y + 1, 1, 4414);
  canvas.set(x + 1, y + 1, 1, 4412);
  canvas.set(x + 2, y + 1, 1, 4412);
  canvas.set(x + 3, y + 1, 1, 4415);
}

function drawColumn(canvas, x, y) {
  canvas.set(x, y, 2, 4453);
  canvas.set(x, y + 1, 1, 4409);
}

function drawMonolith(canvas, x, y) {
  canvas.set(x, y, 2, 4453);
  canvas.set(x, y + 1, 1, 3300);
}

// ---------------------------------------------------------------------------
// Floor Builders
// ---------------------------------------------------------------------------


function plantNaturalFlankPines(cv, W, H) {
  // West side clustered groves
  for (let y = 3; y < H - 3; y += 5) {
    drawFrostedPineTree(cv, 1, y);
    if (y + 2 < H - 2) drawFrostedPineTree(cv, 3, y + 2);
    if (y + 4 < H - 2) drawFrostedPineTree(cv, 2, y + 4);
  }
  // East side clustered groves
  for (let y = 3; y < H - 3; y += 5) {
    drawFrostedPineTree(cv, W - 3, y);
    if (y + 2 < H - 2) drawFrostedPineTree(cv, W - 5, y + 2);
    if (y + 4 < H - 2) drawFrostedPineTree(cv, W - 4, y + 4);
  }
}

export function buildFloor1() {
  const W = 40, H = 40;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  // Tier 1 Cliff (y=29..31)
  drawCoronetCliff(cv, 5, 29, 30, 3, { stairs: [19] });

  // Tier 2 Cliff (y=8..10)
  drawCoronetCliff(cv, 5, 8, 30, 3, { stairs: [19] });

  // Grand Processional Avenue
  drawPavedRoad(cv, 18, 4, 5, 34);

  // North Temple Dais
  drawWhiteMarbleDais(cv, 13, 2, 15, 6, { stairs: [19] });
  drawSunburstAltar(cv, 18, 2);

  // Guardian Statues along the Avenue
  for (let y = 14; y <= 26; y += 4) {
    drawGuardianStatue(cv, 16, y);
    drawGuardianStatue(cv, 24, y);
    drawColumn(cv, 14, y);
    drawColumn(cv, 26, y);
  }

  // Wild Grass Meadows
  drawWildGrassPatch(cv, 6, 13, 9, 14);
  drawWildGrassPatch(cv, 26, 13, 9, 14);

  // Sacred Boulders & Monoliths
  drawSacredBoulder(cv, 6, 12);
  drawSacredBoulder(cv, 33, 12, true);
  drawSacredBoulder(cv, 10, 26);
  drawSacredBoulder(cv, 30, 26, true);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 1F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Retorno a Ciudad Puntaneva", 20, 37, 625, 20, 5, 2, [
    "Un portal resplandeciente desciende hacia las tierras de Sinnoh.",
    "¿Deseas regresar a Ciudad Puntaneva?",
  ]));
  addEventToMap(map, transferEvent(2, "Escaleras al 2F", 20, 5, 2032, 20, 36, 8));

  const dawnBattle = [
    ...textCommands([
      "Maya: ¡Ash! ¿Tú también lo sentiste, verdad?",
      "Un pulso primordial ha sacudido toda la región de Sinnoh. Los textos antiguos hablaban de una montaña sobre las nubes donde el tiempo no avanza.",
      "Dicen que el Gran Uno dejó las Tablas para que el universo tuviera forma, pero si alguien osa pisar esta senda sin la debida reverencia... ¡el castigo será absoluto!",
      "¡Déjame ver si tu espíritu está preparado para encarar lo que aguarda en la cumbre!",
    ]),
    script("pbTrainerBattle(:SECRET_Dawn, \"Dawn\", nil, false, 0, true)"),
    ...textCommands([
      "Maya: ¡Increíble! Esa fuerza... es la misma que salvó a Sinnoh en el pasado.",
      "Sigue adelante, Ash. El destino de todo este mundo está sobre tus hombros.",
      "¡Toma esto para ayudarte en el ascenso!",
    ], 1),
    script("pbReceiveItem(:RARECANDY, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Maya de la Ruta", 20, 20, [
    page({ gfx: graphic("SECRET_Dawn", 2), list: dawnBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Dawn", 2), list: [
      ...textCommands(["Maya: ¡Sigue ascendiendo, Ash! ¡No permitas que la creación se extinga!"]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item RARECANDY", 6, 12, "RARECANDY", "Caramelo Raro"));

  return { map, cv };
}

export function buildFloor2() {
  const W = 40, H = 40;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 5, 29, 30, 3, { stairs: [19] });
  drawCoronetCliff(cv, 5, 8, 30, 3, { stairs: [19] });

  // Winding serpentine road & Arena of Titans
  drawPavedRoad(cv, 18, 25, 5, 12);
  drawPavedRoad(cv, 12, 17, 17, 7);
  drawPavedRoad(cv, 18, 4, 5, 14);

  drawWhiteMarbleDais(cv, 14, 2, 13, 6, { stairs: [19] });

  // Arena Statues & Columns
  drawGuardianStatue(cv, 13, 17); drawGuardianStatue(cv, 27, 17);
  drawGuardianStatue(cv, 13, 23); drawGuardianStatue(cv, 27, 23);
  drawMonolith(cv, 11, 20); drawMonolith(cv, 29, 20);
  drawColumn(cv, 16, 17); drawColumn(cv, 24, 17);

  // Wild grass
  drawWildGrassPatch(cv, 6, 13, 6, 14);
  drawWildGrassPatch(cv, 28, 13, 6, 14);

  // Sacred Boulders
  drawSacredBoulder(cv, 34, 18);
  drawSacredBoulder(cv, 7, 25, true);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 2F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 1F", 20, 37, 2031, 20, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 3F", 20, 5, 2033, 21, 38, 8));

  const palmerBattle = [
    ...textCommands([
      "Palmer: Ash. Es un honor coincidir en la cúspide de lo imposible.",
      "Barry: ¡Papá y yo vinimos tan pronto como el cielo se rasgó! ¡Iba a ponerle una multa a las nubes por temblar tan fuerte!",
      "Palmer: Silencio, hijo. Observa la piedra bajo tus pies. Esta es la materia primigenia anterior al nacimiento de los astros.",
      "Palmer: Quienquiera que more arriba no es un rival común. Como As del Frente de Batalla, debo comprobar tu maestría antes de permitirte avanzar hacia la tormenta.",
    ]),
    script("pbTrainerBattle(:SECRET_Palmer, \"Palmer\", nil, false, 0, true)"),
    ...textCommands([
      "Palmer: Majestuoso. Tu determinación resuena más fuerte que el trueno divino.",
      "Barry: ¡Uau! ¡Sabía que podías hacerlo, Ash! ¡Ahora ve y demuestra de qué estamos hechos los entrenadores!",
      "Palmer: Toma este tónico supremo. Lo necesitarás si planeas desafiar la cúspide.",
    ], 1),
    script("pbReceiveItem(:MAXREVIVE, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Palmer del Frente", 20, 20, [
    page({ gfx: graphic("SECRET_Palmer", 2), list: palmerBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Palmer", 2), list: [
      ...textCommands(["Palmer: Adelante, muchacho. Que la voluntad inquebrantable de los campeones guíe tus pasos."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, event(4, "Barry", 22, 20, [
    page({ gfx: graphic("SECRET_Barry", 4), list: [
      ...textCommands([
        "Barry: ¡Ash! ¡Mi padre reconoció tu poder! ¡Si no salvas el universo te pondré una multa de diez mil millones!",
      ]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(5, "Item MAXREVIVE", 34, 18, "MAXREVIVE", "Revivir Máximo"));

  return { map, cv };
}

export function buildFloor3() {
  const W = 42, H = 42;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 5, 31, 32, 3, { stairs: [20] });
  drawCoronetCliff(cv, 5, 8, 32, 3, { stairs: [20] });

  // Central Avenue
  drawPavedRoad(cv, 19, 4, 5, 36);

  // Central Aura Dais
  drawWhiteMarbleDais(cv, 15, 16, 13, 9, { stairs: [20] });
  drawWhiteMarbleDais(cv, 15, 2, 13, 6, { stairs: [20] });

  // Twin Cosmic Pools
  drawCosmicPool(cv, 10, 19);
  drawCosmicPool(cv, 30, 19);

  // Guardian Statues & Aura Colonnade
  drawGuardianStatue(cv, 14, 17); drawGuardianStatue(cv, 28, 17);
  drawGuardianStatue(cv, 14, 23); drawGuardianStatue(cv, 28, 23);
  drawColumn(cv, 13, 20); drawColumn(cv, 29, 20);
  drawColumn(cv, 18, 14); drawColumn(cv, 24, 14);

  // Wild Grass
  drawWildGrassPatch(cv, 7, 13, 7, 16);
  drawWildGrassPatch(cv, 28, 13, 7, 16);

  drawSacredBoulder(cv, 7, 10);
  drawSacredBoulder(cv, 34, 26, true);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 3F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 2F", 21, 39, 2032, 20, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 4F", 21, 5, 2034, 21, 38, 8));

  const rileyBattle = [
    ...textCommands([
      "Quinoa: Saludos, Ash. El aura que emana de ti resplandece con mayor intensidad que nunca.",
      "Lucario y yo sentimos el despertar de la creación desde Isla Hierro. Esta altitud no perdona a los corazones vacilantes.",
      "La energía de las Tablas fluye como un río cósmico por cada piedra de este templo.",
      "¡Permíteme conectar mi aura con la tuya para templar tu concentración!",
    ]),
    script("pbTrainerBattle(:SECRET_Riley, \"Riley\", nil, false, 0, true)"),
    ...textCommands([
      "Quinoa: Un aura verdaderamente formidable. Has trascendido los límites ordinarios de la comunión con los Pokémon.",
      "Lleva este obsequio. Que tu energía jamás se agote en el combate que se avecina.",
    ], 1),
    script("pbReceiveItem(:PPMAX, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Quinoa de la Isla", 21, 21, [
    page({ gfx: graphic("SECRET_Riley", 2), list: rileyBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Riley", 2), list: [
      ...textCommands(["Quinoa: Sigue adelante. El aura te acompaña, campeón de Sinnoh."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item PPMAX", 7, 10, "PPMAX", "Más PP"));

  return { map, cv };
}

export function buildFloor4() {
  const W = 42, H = 42;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 5, 31, 32, 3, { stairs: [20] });
  drawCoronetCliff(cv, 5, 8, 32, 3, { stairs: [20] });

  // Avenue
  drawPavedRoad(cv, 19, 4, 5, 36);

  // Cynthia's Grand Marble Court
  drawWhiteMarbleDais(cv, 13, 16, 17, 9, { stairs: [20] });
  drawWhiteMarbleDais(cv, 15, 2, 13, 6, { stairs: [20] });
  drawSunburstAltar(cv, 19, 2);

  // Guardian Colonnade
  for (let y = 14; y <= 28; y += 4) {
    drawGuardianStatue(cv, 17, y);
    drawGuardianStatue(cv, 25, y);
    drawColumn(cv, 15, y);
    drawColumn(cv, 27, y);
  }

  // Sacred Boulders & Monoliths
  drawSacredBoulder(cv, 35, 12);
  drawSacredBoulder(cv, 8, 25, true);
  drawMonolith(cv, 11, 20); drawMonolith(cv, 31, 20);

  // Wild Grass
  drawWildGrassPatch(cv, 6, 13, 8, 16);
  drawWildGrassPatch(cv, 28, 13, 8, 16);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 4F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 3F", 21, 39, 2033, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 5F", 21, 5, 2035, 19, 34, 8));

  const cynthiaBattle = [
    ...textCommands([
      "Cintia: Ash. Sabía que las huellas en la nieve te traerían hasta aquí.",
      "Durante años he estudiado los mitos de Sinnoh: el nacimiento del huevo primordial en medio de la nada, la separación de la materia y el espíritu...",
      "Pero lo que se avecina tras este umbral desafía cualquier registro histórico.",
      "Los guardianes del tiempo y del espacio han regresado en su manifestación primigenia, y sobre ellos... el arquitecto absoluto.",
      "Como Campeona de la Liga Sinnoh, tengo el deber de ser tu última prueba terrenal.",
      "¡Demuéstrame que tu lazo con tus Pokémon puede doblegar las leyes del mismísimo cosmos!",
    ]),
    script("pbTrainerBattle(:SECRET_Cynthia, \"Cynthia\", nil, false, 0, true)"),
    ...textCommands([
      "Cintia: Sublime... Una batalla que quedará grabada en las leyendas de nuestro tiempo.",
      "Lleva contigo esta reliquia de los templos de antaño. Si tus Pokémon caen ante el poder divino, esto les otorgará una segunda oportunidad.",
    ], 1),
    script("pbReceiveItem(:SACREDASH, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Cintia Campeona", 21, 21, [
    page({ gfx: graphic("SECRET_Cynthia", 2), list: cynthiaBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Cynthia", 2), list: [
      ...textCommands(["Cintia: Cruza el portal, Ash. Todos los que amamos a este mundo creemos en ti."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item SACREDASH", 35, 12, "SACREDASH", "Ceniza Sagrada"));

  return { map, cv };
}

export function buildFloor5() {
  const W = 38, H = 38;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 4, 27, 30, 3, { stairs: [18] });
  drawCoronetCliff(cv, 4, 7, 30, 3, { stairs: [18] });

  // Central Temporal Altar Dais
  drawWhiteMarbleDais(cv, 11, 10, 17, 13, { stairs: [18] });
  drawWhiteMarbleDais(cv, 13, 2, 13, 5, { stairs: [18] });

  // Paved avenue
  drawPavedRoad(cv, 17, 23, 5, 13);
  drawPavedRoad(cv, 17, 4, 5, 7);

  // Temporal Guardian Statues & Spear Pillar Ruins
  drawGuardianStatue(cv, 13, 13); drawGuardianStatue(cv, 25, 13);
  drawGuardianStatue(cv, 13, 19); drawGuardianStatue(cv, 25, 19);
  drawColumn(cv, 12, 16); drawColumn(cv, 26, 16);
  drawMonolith(cv, 9, 14); drawMonolith(cv, 29, 14);

  // Sacred Boulders
  drawSacredBoulder(cv, 6, 10);
  drawSacredBoulder(cv, 31, 24, true);

  // Wild Grass
  drawWildGrassPatch(cv, 5, 12, 5, 13);
  drawWildGrassPatch(cv, 28, 12, 5, 13);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 5F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 4F", 19, 35, 2034, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 6F", 19, 5, 2036, 19, 34, 8));

  const dialgaBattle = [
    cmd(101, [S("¡GYYYROOOHHH!\\1")]),
    cmd(101, [S("El señor del tiempo emite un rugido que desgarra el tejido de los segundos. ¡Una distorsión temporal envuelve el altar!")]),
    script("pbWildBattle(:DIALGA, 150)"),
    cmd(111, [12, S("$Trainer.party.any? { |p| p.hp > 0 }")]),
    cmd(121, [SW_DIALGA_DEFEATED, SW_DIALGA_DEFEATED, 0]),
    cmd(101, [S("La figura de Dialga se disuelve en una cascada de luz cósmica, abriendo el paso hacia el santuario espacial...")]),
    cmd(412),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Guardián Dialga", 19, 14, [
    page({ gfx: graphic("DIALGA", 2), list: dialgaBattle }),
    page({ cond: condition({ sw: SW_DIALGA_DEFEATED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item COMETSHARD", 6, 10, "COMETSHARD", "Parte Cometa"));

  return { map, cv };
}

export function buildFloor6() {
  const W = 38, H = 38;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 4, 27, 30, 3, { stairs: [18] });
  drawCoronetCliff(cv, 4, 7, 30, 3, { stairs: [18] });

  // Spatial Altar Dais
  drawWhiteMarbleDais(cv, 11, 10, 17, 13, { stairs: [18] });
  drawWhiteMarbleDais(cv, 13, 2, 13, 5, { stairs: [18] });

  // Paved avenue
  drawPavedRoad(cv, 17, 23, 5, 13);
  drawPavedRoad(cv, 17, 4, 5, 7);

  // Twin Cosmic Pools in Spatial Sanctum
  drawCosmicPool(cv, 7, 15);
  drawCosmicPool(cv, 29, 15);

  // Spatial Guardian Statues & Colonnade
  drawGuardianStatue(cv, 13, 13); drawGuardianStatue(cv, 25, 13);
  drawGuardianStatue(cv, 13, 19); drawGuardianStatue(cv, 25, 19);
  drawColumn(cv, 12, 16); drawColumn(cv, 26, 16);

  // Monoliths & Sacred Boulders
  drawMonolith(cv, 9, 21); drawMonolith(cv, 29, 21);
  drawSacredBoulder(cv, 32, 10);
  drawSacredBoulder(cv, 6, 24, true);

  // Wild Grass
  drawWildGrassPatch(cv, 5, 12, 5, 13);
  drawWildGrassPatch(cv, 28, 12, 5, 13);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 6F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 5F", 19, 35, 2035, 19, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras a la Cima", 19, 5, 2037, 23, 40, 8));

  const palkiaBattle = [
    cmd(101, [S("¡GRAAAGHHH!\\1")]),
    cmd(101, [S("El amo del espacio emite un alarido desgarrador. Las dimensiones tiemblan bajo el peso de su presencia.")]),
    script("pbWildBattle(:PALKIA, 150)"),
    cmd(111, [12, S("$Trainer.party.any? { |p| p.hp > 0 }")]),
    cmd(121, [SW_PALKIA_DEFEATED, SW_PALKIA_DEFEATED, 0]),
    cmd(101, [S("Palkia canaliza su esencia hacia las dimensiones lejanas. El portal hacia la Cima del Génesis ha sido despejado.")]),
    cmd(412),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Guardián Palkia", 19, 14, [
    page({ gfx: graphic("PALKIA", 2), list: palkiaBattle }),
    page({ cond: condition({ sw: SW_PALKIA_DEFEATED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item ABILITYCAPSULE", 32, 10, "ABILITYCAPSULE", "Cápsula Habilidad"));

  return { map, cv };
}
export function buildFloor7() {
  const W = 46, H = 46;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  // Clustered Frosted Pine Groves on flanks with depth
  const westPines = [
    [1, 3], [3, 4], [2, 8], [4, 9], [1, 14], [3, 15],
    [2, 20], [4, 21], [1, 26], [3, 27], [2, 32], [4, 33],
    [1, 38], [3, 39], [2, 43], [4, 44],
    [6, 36], [7, 41]
  ];
  for (const [px, py] of westPines) drawFrostedPineTree(cv, px, py);

  const eastPines = [
    [W - 3, 3], [W - 5, 4], [W - 4, 8], [W - 6, 9], [W - 3, 14], [W - 5, 15],
    [W - 4, 20], [W - 6, 21], [W - 3, 26], [W - 5, 27], [W - 4, 32], [W - 6, 33],
    [W - 3, 38], [W - 5, 39], [W - 4, 43], [W - 6, 44],
    [W - 8, 36], [W - 9, 41]
  ];
  for (const [px, py] of eastPines) drawFrostedPineTree(cv, px, py);

  // Cliff Tier at y=20..22
  drawCoronetCliff(cv, 6, 20, 34, 3, { stairs: [22] });

  // Grand Processional Avenue of Creation
  drawPavedRoad(cv, 21, 20, 5, 23);

  // The Grand Altar of Creation
  drawWhiteMarbleDais(cv, 10, 5, 27, 15, { stairs: [22] });

  // Sunburst Altar of God at pinnacle
  drawSunburstAltar(cv, 21, 5);

  // Ancient Marble Colonnade atop the sacred altar
  drawColumn(cv, 19, 6); drawColumn(cv, 20, 6);
  drawColumn(cv, 25, 6); drawColumn(cv, 26, 6);

  // Twin Cosmic Gateways
  drawCosmicGateway(cv, 15, 6);
  drawCosmicGateway(cv, 29, 6);

  // Twin Cosmic Pools in Courtyard
  drawCosmicPool(cv, 13, 12);
  drawCosmicPool(cv, 31, 12);

  // 10 Colossal Guardian Beast Statues along the Avenue
  for (let y = 24; y <= 40; y += 4) {
    drawGuardianStatue(cv, 19, y);
    drawGuardianStatue(cv, 27, y);
    drawColumn(cv, 17, y);
    drawColumn(cv, 29, y);
  }
  // Inner statues on the Altar
  drawGuardianStatue(cv, 15, 9); drawGuardianStatue(cv, 30, 9);
  drawGuardianStatue(cv, 15, 16); drawGuardianStatue(cv, 30, 16);

  // Sacred Boulders & Monoliths
  drawSacredBoulder(cv, 8, 12);
  drawSacredBoulder(cv, 37, 12, true);
  drawSacredBoulder(cv, 12, 28);
  drawSacredBoulder(cv, 33, 28, true);
  drawMonolith(cv, 14, 34);
  drawMonolith(cv, 31, 34);

  // Wild grass on outer mountain terraces
  drawWildGrassPatch(cv, 7, 24, 6, 10);
  drawWildGrassPatch(cv, 33, 24, 6, 10);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 7F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 6F", 23, 41, 2036, 19, 6, 2));

  // Arceus Boss Event
  const arceusBattle = [
    cmd(223, [tone(255, 255, 255, 160), 20]),
    cmd(221), cmd(222),
    cmd(241, [new RObject("RPG::AudioFile", [["@name", S("Legend Sinnoh")], ["@volume", 100], ["@pitch", 100]])]),
    ...textCommands([
      "Ash... Tu viaje comenzó en Pueblo Paleta con un simple Pikachu, y tus pasos te han llevado a desafiar los límites mismos de la existencia.",
      "Has capturado y combatido contra las criaturas que tejieron la urdimbre de las regiones.",
      "Sin embargo... ¿creías que los seres que encontraste en tu camino eran el límite absoluto?",
      "Los Dialga, Palkia e incluso la forma que alguna vez presenciaste de Mí... no eran más que fragmentos disminuidos, sombras atenuadas proyectadas en los planos inferiores para evitar la aniquilación de la realidad.",
      "Pero hoy... las 17 Tablas del Génesis se han congregado en una sola alma humana.",
      "He descendido con la plenitud de Mi ser primordial.",
      "El cosmos ha cumplido su ciclo. La luz y la materia serán devueltas a la nada.",
      "¡Prepárate, Ash Ketchum! ¡Presencia el poder del Principio y del Fin!",
    ]),
    script("pbStartArceusDivineBattle"),
    // Only a surviving party may resolve the encounter. Indents are essential
    // in RGSS: nested event branches at indent 0 can run after being skipped.
    cmd(111, [12, S("$Trainer.party.any? { |p| p && p.hp > 0 }")]),
    cmd(121, [SW_ARCEUS_RESOLVED, SW_ARCEUS_RESOLVED, 0], 1),
    cmd(223, [tone(255, 255, 255, 255), 30], 1),
    ...textCommands([
      "El fulgor del ser supremo desciende en una armonía sobrecogedora...",
      "Arceus: Increíble... Tu voluntad no quebrantó la creación, sino que le ha devuelto su equilibrio.",
    ], 1),
    cmd(111, [12, S("$game_switches[874]")], 1),
    ...textCommands([
      "Arceus: Has demostrado que los humanos y los Pokémon pueden sostener el peso de la eternidad. Acepto caminar a tu lado.",
      "Volo: Espera... ¿Has capturado al mismísimo Gran Uno? ¡No puede ser! ¡Durante eones busqué alcanzar la gloria del creador!",
      "Volo: ¡No permitiré que un joven mortal lo conserve! ¡Te desafío por el derecho a portar la corona de la existencia!",
    ], 2),
    cmd(111, [12, S('pbTrainerBattle(:SECRET_Volo, "Volo", nil, false, 4, true)')], 2),
    cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0], 3),
    ...textCommands([
      "Volo: Ja... ja... Es inútil luchar contra el destino, ¿verdad?",
      "Tu lazo con los Pokémon no proviene de la ambición, sino del amor puro por este mundo. Me rindo ante tu verdad, Ash.",
    ], 3),
    cmd(411, [], 2),
    ...textCommands([
      "Volo retrocede, todavía decidido. Recupera fuerzas y vuelve cuando estés preparado.",
    ], 3),
    cmd(412, [], 2),
    cmd(411, [], 1),
    ...textCommands([
      "El silencio absoluto envuelve la cima del monte. Las nubes se disipan, revelando el firmamento infinito.",
      "Volo: ¡Ash! ¡Lo... lo lograste! ¡El cosmos ha sido preservado!",
    ], 2),
    cmd(412, [], 1),
    cmd(111, [12, S("!$game_switches[874] || $game_switches[875]")], 1),
    cmd(121, [SW_COMPLETED, SW_COMPLETED, 0], 2),
    ...textCommands([
      "El portal de Puntaneva resuena con un tono apacible. La crisis divina ha concluido.",
    ], 2),
    cmd(412, [], 1),
    cmd(412, [], 0),
    cmd(0),
  ];

  const p1 = page({ gfx: graphic("ARCEUS", 2), list: arceusBattle });
  const p2 = page({
    cond: condition({ sw: SW_ARCEUS_RESOLVED, sw2: SW_ARCEUS_CAUGHT }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      ...textCommands([
        "Volo: ¡Aún no me rindo! ¡Arceus debe pertenecer a quien comprenda la verdadera grandeza!",
      ]),
      cmd(111, [12, S('pbTrainerBattle(:SECRET_Volo, "Volo", nil, false, 4, true)')]),
      cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0], 1),
      cmd(121, [SW_COMPLETED, SW_COMPLETED, 0], 1),
      ...textCommands([
        "Volo: Lo entiendo ahora... El creador eligió a su campeón. Buen viaje, Ash.",
      ], 1),
      cmd(411, []),
      ...textCommands([
        "Volo retrocede. Recupérate y vuelve a desafiarlo cuando quieras.",
      ], 1),
      cmd(412),
      cmd(0),
    ],
  });
  const p3 = page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] });

  addEventToMap(map, event(2, "Arceus Creador", 23, 10, [p1, p2, p3]));
  addEventToMap(map, hiddenItemEvent(3, "Item GOLDBOTTLECAP", 8, 12, "GOLDBOTTLECAP", "Chapa Dorada"));

  // Los cinco apoyos aparecen sólo durante la cinemática previa. Sus páginas
  // condicionadas permiten que la cima permanezca limpia durante el combate
  // real de Ash contra Arceus y después del desenlace.
  addEventToMap(map, cinematicTrainerEvent(4, "Apoyo — Cynthia", 19, 16,
    SW_ARCEUS_ALLIES_CYNTHIA_STEVEN, "ARC_Cynthia"));
  addEventToMap(map, cinematicTrainerEvent(5, "Apoyo — Steven", 27, 16,
    SW_ARCEUS_ALLIES_CYNTHIA_STEVEN, "ARC_Steven"));
  addEventToMap(map, cinematicTrainerEvent(6, "Apoyo — Gold", 18, 22,
    SW_ARCEUS_ALLIES_GOLD_RED, "ARC_Ethan"));
  addEventToMap(map, cinematicTrainerEvent(7, "Apoyo — Red", 28, 22,
    SW_ARCEUS_ALLIES_GOLD_RED, "SECRET_Red"));
  addEventToMap(map, cinematicTrainerEvent(8, "Apoyo — Volus", 23, 28,
    SW_ARCEUS_ALLIES_VOLUS, "SECRET_Volo"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// 6. Metadata, Encounters and MapInfos Registration
// ---------------------------------------------------------------------------
function registerMapsInMapInfos() {
  const infos = readRx("MapInfos.rxdata");
  const floorNames = [
    [2038, "La Ruta de Dios — Aproximación Celestial"],
    [2031, "La Ruta de Dios — 1F: Puerta de las Columnas"],
    [2032, "La Ruta de Dios — 2F: Sendero de los Titanes"],
    [2033, "La Ruta de Dios — 3F: Terraza del Aura"],
    [2034, "La Ruta de Dios — 4F: Baluarte Celestial"],
    [2035, "La Ruta de Dios — 5F: Santuario del Tiempo"],
    [2036, "La Ruta de Dios — 6F: Santuario del Espacio"],
    [2037, "La Ruta de Dios — 7F: Cima del Génesis"],
  ];

  for (const [id, name] of floorNames) {
    const existing = infos.pairs.find(([k]) => k === id);
    const obj = new RObject("RPG::MapInfo", [
      ["@name", S(name)],
      ["@parent_id", 625], // child of Snowpoint City
      ["@order", id],
      ["@expanded", false],
      ["@scroll_x", 0],
      ["@scroll_y", 0],
    ]);
    if (existing) existing[1] = obj;
    else infos.pairs.push([id, obj]);
  }

  writeRx("MapInfos.rxdata", infos);
  console.log("OK: Maps 2031..2038 registered in MapInfos.rxdata.");
}

function registerMapMetadata() {
  const meta = readRx("map_metadata.dat");
  for (let id = 2031; id <= 2038; id++) {
    const existing = meta.pairs.find(([k]) => k === id);
    const obj = new RObject("GameData::MapMetadata", [
      ["@id", id],
      ["@outdoor_map", true],
      ["@announce_location", true],
      ["@can_bicycle", null],
      ["@always_bicycle", null],
      ["@teleport_destination", null],
      ["@weather", [Sy("Snow"), 100]],
      ["@town_map_position", [3, 20, 4]], // Sinnoh
      ["@dive_map_id", null],
      ["@dark_map", null],
      ["@safari_map", null],
      ["@snap_edges", null],
      ["@random_dungeon", null],
      ["@battle_background", S("snow")],
      ["@wild_battle_BGM", S("Legend Sinnoh")],
      ["@trainer_battle_BGM", S("secretvolo")],
      ["@wild_victory_ME", null],
      ["@trainer_victory_ME", null],
      ["@wild_capture_ME", null],
      ["@town_map_size", null],
      ["@battle_environment", Sy("Snow")],
      ["@map_BGM", S("Legend Sinnoh")],
    ]);
    if (existing) existing[1] = obj;
    else meta.pairs.push([id, obj]);
  }

  writeRx("map_metadata.dat", meta);
  console.log("OK: Maps 2031..2038 metadata registered in map_metadata.dat.");
}

function registerEncounters() {
  const enc = readRx("encounters.dat");

  const tables = [
    {
      map: 2038,
      mons: [
        [30, Sy("SNORUNT"), 105, 110],
        [25, Sy("SNEASEL"), 105, 110],
        [25, Sy("SWINUB"), 105, 110],
        [20, Sy("CHIMECHO"), 105, 110],
      ],
    },
    {
      map: 2031,
      mons: [
        [30, Sy("SNORUNT"), 110, 115],
        [25, Sy("SNEASEL"), 110, 115],
        [25, Sy("SWINUB"), 110, 115],
        [20, Sy("CHINGLING"), 110, 115],
      ],
    },
    {
      map: 2032,
      mons: [
        [30, Sy("PILOSWINE"), 115, 120],
        [25, Sy("GLALIE"), 115, 120],
        [25, Sy("ABOMASNOW"), 115, 120],
        [20, Sy("MEDITITE"), 115, 120],
      ],
    },
    {
      map: 2033,
      mons: [
        [30, Sy("LUCARIO"), 120, 125],
        [25, Sy("RIOLU"), 120, 125],
        [25, Sy("MEDICHAM"), 120, 125],
        [20, Sy("BRONZOR"), 120, 125],
      ],
    },
    {
      map: 2034,
      mons: [
        [30, Sy("GIBLE"), 125, 130],
        [25, Sy("GABITE"), 128, 132],
        [25, Sy("BRONZONG"), 125, 130],
        [20, Sy("ABSOL"), 125, 130],
      ],
    },
    {
      map: 2035,
      mons: [
        [30, Sy("TOGETIC"), 130, 135],
        [25, Sy("CHIMECHO"), 130, 135],
        [25, Sy("CLEFAIRY"), 130, 135],
        [20, Sy("WEAVILE"), 132, 136],
      ],
    },
    {
      map: 2036,
      mons: [
        [30, Sy("CLEFABLE"), 135, 140],
        [25, Sy("TOGEKISS"), 135, 140],
        [25, Sy("MAMOSWINE"), 135, 140],
        [20, Sy("GARCHOMP"), 138, 142],
      ],
    },
  ];

  for (const { map, mons } of tables) {
    const key = Sy(`${map}_0`);
    const stepChances = new RHash([[Sy("Land"), 20]]);
    const types = new RHash([[Sy("Land"), mons]]);
    const obj = new RObject("GameData::Encounter", [
      ["@id", Sy(`${map}_0`)],
      ["@map", map],
      ["@version", 0],
      ["@step_chances", stepChances],
      ["@types", types],
    ]);
    const existing = enc.pairs.find(([k]) => k.name === key.name);
    if (existing) existing[1] = obj;
    else enc.pairs.push([key, obj]);
  }

  writeRx("encounters.dat", enc);
  console.log("OK: High-level encounter tables registered in encounters.dat.");
}

// ---------------------------------------------------------------------------
// Reachability Validation
// ---------------------------------------------------------------------------
function validateFloorReachability(name, mapObj, canvas, start) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const reachable = reachableCells(pass, start);

  const events = iv(mapObj, "events").pairs;
  const unreachable = [];

  for (const [id, ev] of events) {
    const x = Number(iv(ev, "x"));
    const y = Number(iv(ev, "y"));
    const evName = txt(iv(ev, "name"));

    const adjacent = [
      [x, y],
      [x + 1, y], [x - 1, y],
      [x, y + 1], [x, y - 1],
    ];

    const canReach = adjacent.some(([ax, ay]) => reachable.has(`${ax},${ay}`));
    if (!canReach) {
      unreachable.push(`Event ${id} "${evName}" at (${x}, ${y}) is unreachable!`);
    }
  }

  if (unreachable.length > 0) {
    throw new Error(`[${name}] Reachability failures:\n  ${unreachable.join("\n  ")}`);
  }

  console.log(`[${name}] OK: ${events.length} events reachable from (${start[0]}, ${start[1]}). Total walkable cells: ${reachable.size}.`);
}

// ---------------------------------------------------------------------------
// Installation & Backups
// ---------------------------------------------------------------------------
function backupOriginals() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const file of ["Map513.rxdata", "Map625.rxdata", "Scripts.rxdata", "System.rxdata", "MapInfos.rxdata", "map_metadata.dat", "encounters.dat"]) {
    const src = path.join(DATA, file);
    const dst = path.join(BACKUP_DIR, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  }
}

function install() {
  backupOriginals();

  console.log("Installing Scripts and System Switches...");
  installScriptSection();
  installSwitches();

  console.log("Installing Volus, the celestial avenue, and the portal in Snowpoint City...");
  installTwinleafVolo();
  installSnowpointPortal();
  installSnowpointGuide();
  installSnowpointTreeGuide();

  console.log("Building the long celestial approach and the 7 Floors of La Ruta de Dios (Maps 2031..2038)...");
  const approach = buildCelestialApproach();
  validateFloorReachability("Celestial approach", approach.map, approach.cv, [26, 68]);
  writeRx("Map2038.rxdata", approach.map);

  const f1 = buildFloor1();
  validateFloorReachability("Floor 1", f1.map, f1.cv, [20, 36]);
  writeRx("Map2031.rxdata", f1.map);

  const f2 = buildFloor2();
  validateFloorReachability("Floor 2", f2.map, f2.cv, [20, 36]);
  writeRx("Map2032.rxdata", f2.map);

  const f3 = buildFloor3();
  validateFloorReachability("Floor 3", f3.map, f3.cv, [21, 38]);
  writeRx("Map2033.rxdata", f3.map);

  const f4 = buildFloor4();
  validateFloorReachability("Floor 4", f4.map, f4.cv, [21, 38]);
  writeRx("Map2034.rxdata", f4.map);

  const f5 = buildFloor5();
  validateFloorReachability("Floor 5", f5.map, f5.cv, [19, 34]);
  writeRx("Map2035.rxdata", f5.map);

  const f6 = buildFloor6();
  validateFloorReachability("Floor 6", f6.map, f6.cv, [19, 34]);
  writeRx("Map2036.rxdata", f6.map);

  const f7 = buildFloor7();
  validateFloorReachability("Floor 7", f7.map, f7.cv, [23, 40]);
  writeRx("Map2037.rxdata", f7.map);

  console.log("Registering Maps, Metadata, and Encounters...");
  registerMapsInMapInfos();
  registerMapMetadata();
  registerEncounters();

  console.log("The celestial approach and all 7 Floors of La Ruta de Dios successfully built and installed!");
}

function verify() {
  const errors = [];

  // 1. Verify Switches
  const sys = readRx("System.rxdata");
  const sw = sys.getIvar("@switches");
  if (txt(sw[SW_UNLOCKED]) !== "RUTA_DE_DIOS_UNLOCKED") errors.push("Switch 870 not named RUTA_DE_DIOS_UNLOCKED");
  if (txt(sw[SW_DIALGA_DEFEATED]) !== "RUTA_DE_DIOS_DIALGA_DEFEATED") errors.push("Switch 871 not named RUTA_DE_DIOS_DIALGA_DEFEATED");
  if (txt(sw[SW_PALKIA_DEFEATED]) !== "RUTA_DE_DIOS_PALKIA_DEFEATED") errors.push("Switch 872 not named RUTA_DE_DIOS_PALKIA_DEFEATED");
  if (txt(sw[SW_ARCEUS_RESOLVED]) !== "RUTA_DE_DIOS_ARCEUS_RESOLVED") errors.push("Switch 873 not named RUTA_DE_DIOS_ARCEUS_RESOLVED");
  if (txt(sw[SW_COMPLETED]) !== "RUTA_DE_DIOS_COMPLETED") errors.push("Switch 876 not named RUTA_DE_DIOS_COMPLETED");
  if (txt(sw[SW_SNOWPOINT_PASS]) !== "SNOWPOINT_TEMPORARY_TREE_PASS") errors.push("Switch 877 not named SNOWPOINT_TEMPORARY_TREE_PASS");
  if (txt(sw[SW_ARCEUS_ALLIES_CYNTHIA_STEVEN]) !== "ARCEUS_CINEMATIC_CYNTHIA_STEVEN") errors.push("Switch 878 not named ARCEUS_CINEMATIC_CYNTHIA_STEVEN");
  if (txt(sw[SW_ARCEUS_ALLIES_GOLD_RED]) !== "ARCEUS_CINEMATIC_GOLD_RED") errors.push("Switch 879 not named ARCEUS_CINEMATIC_GOLD_RED");
  if (txt(sw[SW_ARCEUS_ALLIES_VOLUS]) !== "ARCEUS_CINEMATIC_VOLUS") errors.push("Switch 880 not named ARCEUS_CINEMATIC_VOLUS");

  // 2. Verify Script Section
  const scripts = readRx("Scripts.rxdata");
  const scriptEntry = scripts.find(([id, title]) => title.text === "PokeMod_RutaDeDios");
  if (!scriptEntry) errors.push("Missing PokeMod_RutaDeDios in Scripts.rxdata");

  // 2b. Garantías de la batalla divina (revisión M2)
  if (scriptEntry) {
    let ruby = "";
    try {
      ruby = zlib.inflateSync(Buffer.from(scriptEntry[2].bytes)).toString("utf-8");
    } catch (error) {
      errors.push(`No se pudo descomprimir la sección PokeMod_RutaDeDios: ${error.message}`);
    }
    const guarantees = [
      ["pbArceusNormalizeCaptured", "normalización del Arceus capturado (no arrastra estado divino)"],
      ["pbArceusEnsureCaptureBall", "red de seguridad: ball garantizada en el turno de captura"],
      ["@species == :ARCEUS && @ruta_arceus_divine == true", "tope de nivel 200 reservado al Arceus divino"],
      ["!(pkmn.respond_to?(:egg?) && pkmn.egg?)", "pseudo-PC sin huevos"],
      ["divine ? normal_cap : safe_level", "el Arceus cinemático nace al tope normal y sube como divino"],
      ["arceus_capture_ready", "captura determinista tras el último sello"],
    ];
    for (const [needle, label] of guarantees) {
      if (ruby && !ruby.includes(needle)) errors.push(`Falta una garantía de la batalla: ${label}`);
    }
  }

  // 3. Verify Volo in Map 513
  const map513 = readRx("Map513.rxdata");
  const voloEv = iv(map513, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Volus de la Ruta"));
  if (!voloEv) errors.push("Missing Volo event in Map 513");

  // 4. Verify Portal in Map 625
  const map625 = readRx("Map625.rxdata");
  const snowEvents = iv(map625, "events").pairs;
  const portalEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (!portalEv) errors.push("Missing Portal event in Map 625");
  else {
    const firstPage = iv(portalEv[1], "pages")?.[0];
    const portalTransfer = iv(firstPage, "list")?.find((command) => Number(iv(command, "code")) === 201);
    if (Number(iv(portalTransfer, "parameters")?.[1]) !== 2038) {
      errors.push("The Snowpoint portal must transfer to Map 2038 (the celestial approach)");
    }
  }
  const guideEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Volus — Guía Celestial"));
  if (!guideEv) errors.push("Missing second Volus guide in Map 625");
  const squirtleEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Squirtle — Paso Temporal"));
  if (!squirtleEv) errors.push("Missing temporary Snowpoint tree guide in Map 625");
  if (snowEvents.some(([, ev]) => txt(iv(ev, "name")) === "Brandon" || txt(iv(ev, "name")).includes("Regigigas"))) {
    errors.push("The old Regigigas temple NPC still occupies the Snowpoint plaza");
  }

  // 5. Protect the shared ID allocation: Monte Silver owns 2030; the Ruta
  // approach is 2038 and the seven floors remain 2031-2037.
  const mapInfos = readRx("MapInfos.rxdata");
  const infoName = (id) => {
    const info = mapInfos.pairs.find(([key]) => Number(key) === id)?.[1];
    return txt(iv(info, "name"));
  };
  if (!infoName(2030).includes("Gruta de los Testigos")) {
    errors.push("Map 2030 must remain Monte Silver — Gruta de los Testigos");
  }
  if (!infoName(2038).includes("Aproximación Celestial")) {
    errors.push("Map 2038 must be La Ruta de Dios — Aproximación Celestial");
  }
  // Verify the approach plus the 7 sacred floors, without reading or replacing 2030.
  for (let id = 2031; id <= 2038; id++) {
    const f = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(f)) {
      errors.push(`Missing Map${id}.rxdata`);
      continue;
    }
    const m = readRx(`Map${id}.rxdata`);
    const w = Number(iv(m, "width"));
    const h = Number(iv(m, "height"));
    const evCount = iv(m, "events").pairs.length;
    if (w < 35 || h < 35) errors.push(`Map ${id} dimensions too small (${w}x${h})`);
    if (evCount < 2) errors.push(`Map ${id} has too few events (${evCount})`);
  }

  // 6. Verify Arceus at Summit (Map 2037)
  const map2037 = readRx("Map2037.rxdata");
  const arceusEv = iv(map2037, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Arceus Creador"));
  if (!arceusEv) errors.push("Missing Arceus Creador event in Map 2037");

  // 7. Verify Dialga (Map 2035) and Palkia (Map 2036)
  const map2035 = readRx("Map2035.rxdata");
  const dialgaEv = iv(map2035, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Guardián Dialga"));
  if (!dialgaEv) errors.push("Missing Guardián Dialga in Map 2035");

  const map2036 = readRx("Map2036.rxdata");
  const palkiaEv = iv(map2036, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Guardián Palkia"));
  if (!palkiaEv) errors.push("Missing Guardián Palkia in Map 2036");

  if (errors.length) {
    throw new Error(`La Ruta de Dios verification failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  }
  console.log("Verification OK: La Ruta de Dios fully verified (7 floors, Arceus Lv. 200, Volo, Dialga, Palkia, trainers, switches, and scripts).");
}

if (!VERIFY_ONLY) {
  install();
}
verify();
