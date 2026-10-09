# ============================================================================
# arceus_fuzz_prelude.rb
#
# Motor de combate mínimo para la QA de volumen (R10). Replica exactamente las
# validaciones de GameData de Fire Ash v19: try_get(nil) => nil, un Symbol o
# String desconocido => nil, y cualquier otro tipo (Integer, Float, nil como
# clima…) => ArgumentError con el mensaje real del motor. Así el fuzz detecta
# la clase de fallo que el jugador veía en Kirin ("Expected 5 to be one of
# [Symbol, GameData::BattleWeather, String], but got Integer").
# ============================================================================

def _INTL(text, *args)
  out = text.to_s.dup
  args.each_with_index { |value, i| out = out.gsub("{#{i + 1}}", value.to_s) }
  out
end

def pbMessage(msg); nil; end
def pbWait(frames); end

# R14b: rutas de movimiento de las caminatas cinemáticas (constantes del motor).
class PBMoveRoute
  Up = 1
  Down = 2
  Left = 3
  Right = 4
  TurnRight = 5
  TurnLeft = 6
  ChangeSpeed = 7
end

def pbMoveRoute(event, route)
  event.move_route_forcing = false if event.respond_to?(:move_route_forcing=)
  true
end

# R15: en el juego real Graphics existe; en el sandbox se define SIN width ni
# height para que las guardias de las cinemáticas (`!Graphics.respond_to?(:width)`)
# salgan antes de tocar Viewport/Bitmap. La lógica (barras, fases, mega, merced)
# sigue corriendo intacta: sólo se apaga el dibujo.
unless defined?(Graphics)
  module Graphics
    def self.update; nil; end
    def self.frame_count; 0; end
    def self.frame_rate; 60; end
    def self.freeze; nil; end
    def self.transition(*_args); nil; end
    def self.brightness; 255; end
    def self.brightness=(_v); nil; end
  end
end

class Tone
  def initialize(*args); end
end

class Color
  def initialize(*args); end
end

class Pokemon
  MAX_MOVES = 4
  attr_accessor :species, :level, :moves, :item, :ability, :hp
  def initialize(species = nil, level = 1)
    @species = species
    @level = level
    @moves = []
  end
  def level=(value); @level = value; end
  attr_accessor :totalhp, :status
  def fainted?; @hp.to_i <= 0; end
  def egg?; false; end
  # Pokemon#heal del motor: vida + estado + PP (la merced de Arceus lo usa).
  def heal
    heal_HP
    heal_status
    heal_PP
  end
  def heal_HP; @hp = @totalhp.to_i if @totalhp; end
  def heal_status; @status = 0; end
  def heal_PP; (@moves || []).each { |m| m.pp = m.total_pp if m }; end
  # R14b: el starter arma al Creador y al séquito con la superficie completa del
  # Pokemon del motor (IVs, EVs, naturaleza, stats, nombre y forma).
  def iv; @iv ||= Hash.new(0); end
  def ev; @ev ||= Hash.new(0); end
  def nature; @nature || :HARDY; end
  def nature=(value); @nature = value; end
  # R15: el prólogo cinematográfico enseña golpes con learn_move (motor:
  # Pokemon#learn_move ignora los ya conocidos y reemplaza el más antiguo si
  # el mazo está lleno) y arma a Giratina con form_simple=.
  def learn_move(move_id)
    @moves ||= []
    return if move_id.nil?
    return if @moves.any? { |m| m && m.id == move_id }
    @moves.shift if @moves.length >= MAX_MOVES
    @moves << Pokemon::Move.new(move_id)
  end
  def form_simple=(value); @form_simple = value; end
  def form_simple; @form_simple.to_i; end
  def personalID=(value); @personalID = value; end
  def ability_index=(value); @ability_index = value; end
  def calc_stats
    @totalhp = @totalhp.to_i > 0 ? @totalhp : 100 + @level.to_i * 2
    @hp = @totalhp if @hp.nil? || @hp.to_i > @totalhp
    @hp = @totalhp if @hp.nil?
  end
  def name=(value); @name = value; end
  def name; @name || @species.to_s; end
  def nicknamed?; !@name.nil?; end
  def form; @form || 0; end
  def form=(value); @form = value; end
  def able?; @hp.to_i > 0; end

  class Move
    attr_accessor :id, :pp, :total_pp
    def initialize(id)
      @id = id
      @pp = 10
      @total_pp = 10
    end
  end
end

module GameData
  module Species
    KNOWN_SPECIES = [:ARCEUS, :METAGROSS, :MEW, :GIRATINA, :DIALGA, :PALKIA,
                     :CHARIZARD, :PIKACHU, :REGIGIGAS, :GROUDON, :KYOGRE,
                     :UXIE, :MESPRIT, :AZELF, :CELEBI, :RAYQUAZA, :ZYGARDE].freeze
    Dato = Struct.new(:id, :name)
    def self.exists?(sym)
      KNOWN_SPECIES.include?(sym.to_s.to_sym)
    rescue StandardError
      false
    end
    def self.get(sym)
      raise "Unknown species #{sym.inspect}" if !exists?(sym)
      Dato.new(sym.to_s.to_sym, sym.to_s.capitalize)
    end
  end

  class GrowthRate
    def minimum_exp_for_level(level); level.to_i * 10; end
    # R14b: el starter y las invocaciones leen el tope de nivel legal del motor.
    def self.max_level; 100; end
  end

  # R14b: el séquito y el Arceus divino reparten IVs con el iterador real de stats.
  module Stat
    Dato = Struct.new(:id)
    MAIN = [:HP, :ATTACK, :DEFENSE, :SPECIAL_ATTACK, :SPECIAL_DEFENSE, :SPEED].map { |i| Dato.new(i) }.freeze
    BATTLE = [:ATTACK, :DEFENSE, :SPECIAL_ATTACK, :SPECIAL_DEFENSE, :SPEED,
              :ACCURACY, :EVASION].map { |i| Dato.new(i) }.freeze
    def self.each_main
      MAIN.each { |stat| yield stat }
    end
    def self.each_battle
      BATTLE.each { |stat| yield stat }
    end
  end

  # Misma semántica de validación que 015:Validation / 102:GameData del juego.
  module ValidacionSimbolos
    def validate!(valor)
      return if valor.is_a?(Symbol) || valor.is_a?(String) || valor.is_a?(self)
      raise ArgumentError,
            "Invalid argument passed to method.\nExpected #{valor.inspect} to be one of " \
            "[Symbol, #{self.name}, String], but got #{valor.class.name}."
    end

    def try_get(valor)
      return nil if valor.nil?
      validate!(valor)
      sym = valor.is_a?(String) ? valor.to_sym : (valor.is_a?(Symbol) ? valor : valor.id)
      return nil if !ids.include?(sym)
      instancia(sym)
    end

    def get(valor)
      dato = try_get(valor)
      raise "Unknown ID #{valor.inspect}." if !dato
      dato
    end

    def exists?(valor)
      !try_get(valor).nil?
    rescue StandardError
      false
    end
  end

  class BattleWeather
    extend ValidacionSimbolos
    IDS = [:None, :Sun, :Rain, :Sandstorm, :Hail, :ShadowSky, :Fog,
           :HarshSun, :HeavyRain, :StrongWinds].freeze
    attr_reader :id, :animation
    def initialize(id); @id = id; @animation = 0; end
    def self.ids; IDS; end
    def self.instancia(sym); new(sym); end
  end

  class Terrain
    extend ValidacionSimbolos
    IDS = [:None, :Electric, :Grassy, :Misty, :Psychic].freeze
    attr_reader :id, :animation
    def initialize(id); @id = id; @animation = 0; end
    def self.ids; IDS; end
    def self.instancia(sym); new(sym); end
  end

  class Move
    KNOWN = [:JUDGMENT, :FURYSWIPES, :COMETPUNCH, :PINMISSILE, :ARMTHRUST,
             :THOUSANDARROWS, :RAINDANCE, :SUNNYDAY, :SANDSTORM, :HAIL,
             :EMBARGO, :MAGICROOM, :GASTROACID, :GRAVITY, :COREENFORCER,
             :TRICKROOM, :WONDERROOM, :RECOVER, :TAILWIND, :EXTREMESPEED,
             :PERISHSONG, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE, :AEROBLAST,
             :PRECIPICEBLADES, :ORIGINPULSE, :MOONBLAST, :EARTHPOWER,
             :DARKVOID, :PSYCHOBOOST, :DRACOMETEOR, :SACREDSWORD,
                                       :VCREATE, :METEORMASH, :GIGAIMPACT, :COSMICPOWER, :PSYCHIC,
             :AURASPHERE, :HEALPULSE, :DRAGONASCENT, :LANDSWRATH, :TRANSFORM,
             :SING].freeze
    Dato = Struct.new(:id, :power)
    def self.exists?(id); KNOWN.include?(id); end
    def self.get(id)
      raise "Unknown ID #{id.inspect}." if !KNOWN.include?(id)
      Dato.new(id, 100)
    end
  end

  class Ability
    extend ValidacionSimbolos
    IDS = [:INTIMIDATE, :PRESSURE, :MULTISCALE, :CLOUDNINE, :AIRLOCK].freeze
    attr_reader :id
    def initialize(id); @id = id; end
    def self.ids; IDS; end
    def self.instancia(sym); new(sym); end
  end

  class Item
    extend ValidacionSimbolos
    IDS = [:FLAMEPLATE, :SPLASHPLATE, :ZAPPLATE, :MEADOWPLATE, :ICICLEPLATE,
           :FISTPLATE, :TOXICPLATE, :EARTHPLATE, :SKYPLATE, :MINDPLATE,
           :INSECTPLATE, :STONEPLATE, :SPOOKYPLATE, :DRACOPLATE, :DREADPLATE,
           :IRONPLATE, :PIXIEPLATE, :LEGENDPLATE, :POKEBALL].freeze
    attr_reader :id
    def initialize(id); @id = id; end
    def self.ids; IDS; end
    def self.instancia(sym); new(sym); end
  end
end

module PBEffects
  def self.const_missing(nombre); nombre.to_sym; end
end

class Game_Map
  def setup(*args); end
end

class Game_Player
  def passable?(*args); true; end
end

class FakeSide
  attr_accessor :effects
  def initialize; @effects = {}; end
end

class FakeDamageState
  attr_accessor :hpLost, :totalHPLost, :substitute, :endured, :missed,
                :protected, :unaffected, :disguise, :iceface, :sturdy,
                :sturdyLegend, :focusSash, :focusBand
  def initialize
    @hpLost = 0
    @totalHPLost = 0
    @substitute = false
    @endured = false
  end
end

class PokeBattle_Field
  attr_accessor :weather, :weatherDuration, :terrain, :defaultWeather, :effects
  def initialize
    @weather = :None
    @weatherDuration = 0
    @terrain = :None
    @defaultWeather = :None
    @effects = {}
  end
end

class PokeBattle_Move
  attr_accessor :battle, :id, :function_code
  def initialize(battle = nil, id = nil)
    @battle = battle
    @id = id
  end
  # Rutas originales del motor que los alias de la modificación envuelven.
  def pbReduceDamage(user, target); target.damageState.hpLost.to_i; end
  def pbInflictHPDamage(target)
    lost = target.damageState.hpLost.to_i
    target.hp = target.hp - lost if target.respond_to?(:hp=)
    lost
  end
  def pp; 10; end
  def self.from_pokemon_move(battle, move); new(battle, move.id); end
  def _ruta_arceus_original_reduce_damage(user, target); target.damageState.hpLost.to_i; end
  def _ruta_arceus_original_inflict_hp_damage(target)
    lost = target.damageState.hpLost.to_i
    target.hp = target.hp - lost if target.respond_to?(:hp=)
    lost
  end
end

class PokeBattle_TwoTurnMove < PokeBattle_Move; end
class PokeBattle_Move_09F < PokeBattle_Move; end

class PokeBattle_Battler
  attr_accessor :index, :side, :pokemon, :effects, :battle, :item, :stages, :totalhp
  def initialize(index = 0, side = nil)
    @index = index
    @side = side
    @hp = 0
    @totalhp = 0
    @effects = Hash.new(0)
    @stages = Hash.new(0)
    @damageState = FakeDamageState.new
  end
  def hp; @hp; end
  def hp=(value)
    @hp = value.to_i
    @pokemon.hp = @hp if @pokemon
  end
  def moves; @moves ||= []; end
  def damageState; @damageState; end
  def fainted?; @hp <= 0; end
  def level; @pokemon ? @pokemon.level.to_i : 100; end
  def name; "Combatiente"; end
  def pbThis; "Combatiente"; end
  # Misma firma que el motor (901714:874): el índice es opcional y puede ser
  # otro battler; arceus_battler llama opposes? sin argumentos.
  def opposes?(i = 0)
    i = i.index if i.respond_to?("index")
    (@index & 1) != (i.to_i & 1)
  end
  def pbReduceHP(amount, *rest)
    amount = amount.round
    amount = @hp if amount > @hp
    amount = 1 if amount < 1 && !fainted?
    @hp -= amount
    amount
  end
  def pbFaint(*args); end
  def pbInitialize(*args); end
  def pbHasType?(*args); false; end
  def pbSetPP(*args); end
  def pbReducePP(*args); 0; end
  def pbReducePPOther(*args); 0; end
  def pbChangeForm(*args); end
  def pbUseMove(*args); end
  def pbCanInflictStatus?(*args); true; end
  def pbCanConfuse?(*args); true; end
  def pbCanAttract?(*args); true; end
  def pbCanSleepYawn(*args); true; end
  def pbFlinch(*args); end
  def pbCanLowerStatStage?(*args); true; end
  def pbLowerStatStageBasic(*args); true; end
  def pbLowerStatStage(*args); true; end
  def pbSuccessCheckAgainstTarget(*args); true; end
  def pbAccuracyCheck(*args); true; end
  def pbCalcTypeMod(*args); 1.0; end
  def pbCheckDamageAbsorption(*args); false; end
  def ignoresSubstitute?(*args); false; end
  def ignoresEndure?(*args); false; end
  def pbBaseType(*args); :NORMAL; end
  def pbSendOut(*args); end
  def pbUpdate; end
  def pbRecoverHP(amount, *rest)
    amount = amount.round
    @hp = [@hp + amount, @totalhp].min
    amount
  end

  # ── "Originales" del motor que los alias instalados envuelven ──
  def _ruta_arceus_original_set_hp(value)
    @hp = value.to_i
    @pokemon.hp = @hp if @pokemon
  end
  def _ruta_arceus_original_reduce_hp(amount, anim = true, registerDamage = true, anyAnim = true)
    amount = amount.round
    amount = @hp if amount > @hp
    amount = 1 if amount < 1 && !fainted?
    @hp -= amount
    amount
  end
  def _ruta_arceus_original_cinematic_faint(showMessage = true); end
  def _ruta_arceus_original_can_inflict_status(*args); true; end
  def _ruta_arceus_original_can_confuse(*args); true; end
  def _ruta_arceus_original_can_attract(*args); true; end
  def _ruta_arceus_original_can_sleep_yawn(*args); true; end
  def _ruta_arceus_original_flinch(*args); nil; end
  def _ruta_arceus_original_can_lower_stage(*args); true; end
  def _ruta_arceus_original_lower_stage_basic(*args); true; end
  def _ruta_arceus_original_lower_stage(*args); true; end
  def _ruta_arceus_original_success_check(*args); true; end
  def _ruta_arceus_original_accuracy_check(*args); true; end
  def _ruta_arceus_original_calc_type_mod(*args); 1.0; end
  def _ruta_arceus_original_check_damage_absorption(*args); false; end
  def _ruta_arceus_original_ignores_substitute(*args); false; end
  def _ruta_arceus_original_ignores_endure(*args); false; end
  def _ruta_arceus_original_base_type(*args); :NORMAL; end
  def _ruta_arceus_original_send_out(*args); end
  def _ruta_arceus_original_level; level; end
  def _ruta_arceus_original_initialize(*args); end
  def _ruta_arceus_original_has_type(*args); false; end
  def _ruta_arceus_original_set_pp(*args); end
  def _ruta_arceus_original_reduce_pp(*args); 0; end
  def _ruta_arceus_original_reduce_pp_other(*args); 0; end
  def _ruta_arceus_original_change_form(*args); end
  def _ruta_arceus_original_use_move(*args); end
end

class PokeBattle_Scene
  def pbBattleIntroAnimation(*args); end
end

module PokeBattle_BallAnimationMixin
  def ballTracksHand(ball, traSprite, safariThrow = false); [-6, 202]; end
end

module SaveData
  FILE_PATH = "Save Files/Game.rxdata"
  # R14b: el motor registra los valores del guardado en @values y los compila
  # en un hash; el sandbox de Arceus (begin!/finish!) los lee de verdad, así que
  # el stub debe tener ambos o finish! revienta con NoMethodError sobre nil.
  @values = []
  class << self
    def save_to_file(path); true; end
    def delete_file; true; end
    def compile_save_hash; {}; end
    def values; @values; end
  end
end

class PokeBattle_Battle
  attr_accessor :battlers, :turnCount, :lastMoveUser, :lastMoveUsed, :messages,
                :field, :sides, :battleAI, :endOfRound, :sideSizes,
                :ruta_side_split, :party1starts, :party2starts
  def initialize(battlers = [])
    @battlers = battlers
    @sideSizes = [1, 1]
    @ruta_side_split = 1
    @turnCount = 1
    @lastMoveUser = 0
    @lastMoveUsed = :METEORMASH
    @messages = []
    @field = PokeBattle_Field.new
    @sides = [FakeSide.new, FakeSide.new]
    battlers.each { |b| b.battle = self if b }
  end
  def pbPlayer; 0; end
  def wildBattle?; true; end
  # R16: el duelo divino real es batalla de entrenador; el sandbox mantiene la
  # semántica salvaje por defecto y la ventana de captura la voltea igual que
  # la sección instalada (alias sobre estos stubs).
  def trainerBattle?; false; end
  def pbThrowPokeBall(*args); 0; end
  # El extractor de WANTED carga los cuerpos DEFN sin sus líneas `alias` (sólo
  # extrae métodos), así que los sobreescritos de la ventana de captura deben
  # encontrar aquí los destinos originales, igual que el resto del sandbox:
  def _ruta_arceus_original_wild_battle_flag; true; end
  def _ruta_arceus_original_trainer_battle_flag; false; end
  def _ruta_arceus_original_throw_poke_ball(*args); 0; end
  def pbRecallAndReplace(*args); nil; end
  def pbParty(side); []; end
  def pbDisplay(msg); @messages << msg; nil; end
  def pbDisplayPaused(msg); pbDisplay(msg); end
  def pbCommonAnimation(*args); end
  def pbAnimation(*args); end
  def pbFlash(*args); end
  def pbShake(*args); end
  def pbToneChangeAll(*args); end
  def pbRandom(n); 0; end
  def pbCommandPhaseLoop(*args); end
  def pbStartBattleSendOut(*args); end
  def pbRun(*args); 0; end
  def pbSwitchInBetween(*args); end
  def pbCalculatePriority(*args); []; end
  # R12: ventanas de elección, música y party dentro del combate.
  attr_accessor :comando_script, :comando_log, :bgm_log
  def pbShowCommands(msg, commands, canCancel = true)
    # Réplica fiel del contrato de la escena (Scene_Battle:203): el 3er
    # argumento se usa como `defaultValue>=0`, así que DEBE ser entero. Un
    # booleano aquí lanza NoMethodError en el juego real; lo reproducimos para
    # que ninguna firma mal puesta vuelva a pasar la QA.
    raise NoMethodError, "undefined method `>=' for #{canCancel.inspect}" if !canCancel.is_a?(Integer)
    @comando_log ||= []
    @comando_log << (commands || []).dup
    c = @comando_script
    c = c.call(commands) if c.respond_to?(:call)
    c.nil? ? 0 : c.to_i
  end
  def pbBGMPlay(param, volume = nil, pitch = nil)
    @bgm_log ||= []
    @bgm_log << param
    nil
  end
  def pbParty(idxBattler = 0)
    # En el motor pbParty devuelve objetos Pokemon (no battlers): la merced de
    # Arceus usa .species/.fainted?/.heal de Pokemon. R15c: ruta_side_split
    # permite bando rival de varios Pokémon (la Orden Divina alinea cuatro).
    split = @ruta_side_split.to_i
    split = 1 if split < 1
    split = @battlers.length - 1 if split > @battlers.length - 1
    lado = idxBattler.to_i == pbPlayer ? @battlers[0...(@battlers.length - split)] : @battlers[(@battlers.length - split)..-1].to_a
    lado.compact.map { |b| b.pokemon }.compact
  end
  # R15c — réplica fiel de PokeBattle_Battle#pbPartyStarts / pbAbleTeamCounts
  # (sección 182:354 del motor): el redimensionado salvaje de Battle_StartAndEnd
  # lee estos conteos y con 4 divinos volvía el campo 4v4.
  def pbPartyStarts(side)
    side.to_i == pbPlayer ? (@party1starts || [0]) : (@party2starts || [0])
  end
  def pbAbleTeamCounts(side)
    party = pbParty(side)
    partyStarts = pbPartyStarts(side)
    ret = []
    idxTeam = -1
    nextStart = 0
    party.each_with_index do |pkmn, i|
      if i >= nextStart
        idxTeam += 1
        nextStart = (idxTeam < partyStarts.length - 1) ? partyStarts[idxTeam + 1] : party.length
      end
      next if !pkmn || !pkmn.able?
      ret[idxTeam] = 0 if !ret[idxTeam]
      ret[idxTeam] += 1
    end
    ret
  end
  # El override del guion (R15c) llama a _ruta_arceus_original_able_team_counts;
  # en el sandbox la línea `alias` del generador no se extrae (sólo viajan los
  # def), así que el preludio deja el alias listo.
  alias _ruta_arceus_original_able_team_counts pbAbleTeamCounts unless method_defined?(:_ruta_arceus_original_able_team_counts)
  # Réplica fiel de PokeBattle_Battle#pbStartWeather (730380:679): escribe el
  # clima y LO LEE con GameData::BattleWeather.try_get en la misma llamada.
  def pbStartWeather(user, newWeather, fixedDuration = false, showAnim = true, customDuration = 5)
    return if @field.weather == newWeather
    @field.weather = newWeather
    duration = (fixedDuration) ? customDuration : -1
    @field.weatherDuration = duration
    weather_data = GameData::BattleWeather.try_get(@field.weather)
    pbCommonAnimation(weather_data.animation) if showAnim && weather_data
  end
  def defaultWeather=(value)
    @field.defaultWeather = value
    @field.weather = value
    @field.weatherDuration = -1
  end
  # ── "Originales" del motor que los alias instalados envuelven ──
  def _ruta_arceus_original_pb_player; 0; end
  def _ruta_arceus_original_pb_random(n); 0; end
  def _ruta_arceus_original_calculate_priority(*args); []; end
  def _ruta_arceus_original_command_loop(*args); end
  def _ruta_arceus_original_start_send_out(*args); end
  def _ruta_arceus_original_pbRun(*args); 0; end
  def _ruta_arceus_original_pbSwitchInBetween(*args); true; end
end

module PokeBattle_BattleCommon
  def pbCaptureCalc(*args); 0; end
end

# La fase de fin de ronda del motor (505186:60) lee el campo con try_get: es la
# línea exacta que reventaba en Kirin cuando el campo quedaba sucio.
class Battle_Phase_EndOfRound
  def initialize(battle = nil); @battle = battle; end
  def start_phase
    weather_data = GameData::BattleWeather.try_get(@battle.field.weather)
    @battle.pbCommonAnimation(weather_data.animation) if weather_data
    terrain_data = GameData::Terrain.try_get(@battle.field.terrain)
    @battle.pbCommonAnimation(terrain_data.animation) if terrain_data
  end
end

$game_switches = {}
$game_screen = nil
$PokemonBag = nil
$PokemonTemp = nil
