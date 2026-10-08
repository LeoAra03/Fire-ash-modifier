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
  class GrowthRate
    def minimum_exp_for_level(level); level.to_i * 10; end
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
             :VCREATE, :METEORMASH].freeze
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
  class << self
    def save_to_file(path); true; end
    def delete_file; true; end
  end
end

class PokeBattle_Battle
  attr_accessor :battlers, :turnCount, :lastMoveUser, :lastMoveUsed, :messages,
                :field, :sides, :battleAI, :endOfRound
  def initialize(battlers = [])
    @battlers = battlers
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
