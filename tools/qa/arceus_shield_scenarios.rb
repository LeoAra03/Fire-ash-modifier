# ============================================================================
# arceus_shield_scenarios.rb
#
# Escenarios que ejecuta tools/qa/arceus_shield_harness.mjs dentro de un CRuby
# (WebAssembly) sobre los métodos REALES de la sección PokeMod_RutaDeDios.
# La marca __METODOS__ es donde el arnés inyecta esos métodos.
# ============================================================================

# ---------------------------------------------------------------------------
# Entorno mínimo que imita al motor (Essentials / Fire Ash)
# ---------------------------------------------------------------------------
def _INTL(text, *args)
  out = text.to_s.dup
  args.each_with_index { |value, i| out = out.gsub("{#{i + 1}}", value.to_s) }
  return out
end

def pbArceusCinematicImpact(tone = nil); end
def pbWait(frames); end

class Tone
  def initialize(*args); end
end

class Color
  def initialize(*args); end
end

RUTA_ARCEUS_STAGE_COUNT = 6
RUTA_ARCEUS_PHASE_TYPES = [:NORMAL].freeze
RUTA_ARCEUS_TYPE_FORMS = {}.freeze
RUTA_ARCEUS_MOVE_SETS = [[:JUDGMENT]].freeze
# R8/R9/R16 · duelo jugable (los mismos valores que la sección instalada).
RUTA_ARCEUS_ASH_BAR_POWER = 1.25
RUTA_ARCEUS_ASH_BAR_MIN_RATIO = 0.25
RUTA_ARCEUS_ASH_BAR_MAX_RATIO = 0.45
RUTA_ARCEUS_HIT_CAP_RATIO = 0.40
RUTA_ARCEUS_REDLINE_HEAL_RATIO = 0.5

# El motor define PBEffects como un módulo de índices; aquí los efectos del
# battler de prueba son un Hash, así que los nombres actúan de clave.
module PBEffects
  BanefulBunker = :BanefulBunker
  KingsShield = :KingsShield
  Protect = :Protect
  SpikyShield = :SpikyShield
  Obstruct = :Obstruct
  CraftyShield = :CraftyShield
  MatBlock = :MatBlock
  QuickGuard = :QuickGuard
  WideGuard = :WideGuard
end

class FakeSide
  attr_accessor :effects
  def initialize
    @effects = {}
  end
end

class FakeDamageState
  attr_accessor :hpLost, :totalHPLost, :substitute, :disguise, :iceface,
                :endured, :sturdy, :sturdyLegend, :focusSash, :focusBand,
                :unaffected, :missed, :protected
  def initialize
    @hpLost = 0
    @totalHPLost = 0
    @substitute = false
    @disguise = false
    @iceface = false
    @endured = false
    @sturdy = false
    @sturdyLegend = false
    @focusSash = false
    @focusBand = false
    @unaffected = false
    @missed = false
    @protected = false
  end
end

class FakePokemon
  attr_accessor :species, :hp
  def initialize(species)
    @species = species
    @hp = 0
  end
end

class PokeBattle_Battler
  attr_accessor :index, :side, :pokemon, :effects, :battle, :tookDamage
  def initialize(index, side)
    @index = index
    @side = side
    @hp = 0
    @totalhp = 0
    @fainted = false
    @damageState = FakeDamageState.new
    @effects = Hash.new(0)
    @pokemon = FakePokemon.new(:RATTATA)
    @pokemon.hp = 0
  end
  def damageState; @damageState; end
  def hp; @hp; end
  def totalhp; @totalhp; end
  # Rutas reales del motor, tal y como las ve el alias de la modificación.
  def _ruta_arceus_original_set_hp(value)
    @hp = value.to_i
    @pokemon.hp = value.to_i if @pokemon
  end
  def _ruta_arceus_original_reduce_hp(amt, anim = true, registerDamage = true, anyAnim = true)
    amt = amt.round
    amt = @hp if amt > @hp
    amt = 1 if amt < 1 && !fainted?
    old_hp = @hp
    self.hp -= amt
    @tookDamage = true if amt > 0 && registerDamage
    return amt
  end
  def _ruta_arceus_original_cinematic_faint(showMessage = true)
    return if !fainted?
    return if @fainted
    @fainted = true
    return true
  end
  def fainted?; @hp <= 0; end
  def opposes?(i = 0)
    i = i.index if i.respond_to?(:index)
    return (@index & 1) != (i & 1)
  end
  def pbOwnedByPlayer?; @side == 0; end
  def pbThis(lower = false); @pokemon && @pokemon.species == :ARCEUS ? "Arceus" : "Rival"; end
  def pbUpdate; end
  def pbItemHPHealCheck; end
  def level; 200; end
  def pbOwnSide; @ownSide; end
  def ownSide; @ownSide; end
  def ownSide=(side); @ownSide = side; end
end

class PokeBattle_Move
  attr_accessor :battle, :id, :damageState
  def initialize(battle = nil, id = :TACKLE)
    @battle = battle
    @id = id
    @damageState = FakeDamageState.new
  end
  def damagingMove?; true; end
  # Aplicación real del motor: target.hp -= hpLost (sin pasar por pbReduceHP).
  def _ruta_arceus_original_inflict_hp_damage(target)
    if target.damageState.substitute
      target.effects[:SUBSTITUTE] -= target.damageState.hpLost
    else
      target.hp -= target.damageState.hpLost
    end
  end
end

# Ball Breaker (PokeBattle_Move_DF08) hereda de PokeBattle_TwoTurnMove.
class PokeBattle_TwoTurnMove < PokeBattle_Move
end

class PokeBattle_Battle
  attr_accessor :battlers, :scene, :turnCount, :lastMoveUser, :lastMoveUsed, :messages, :priority
  attr_reader :field
  def initialize(battlers = [])
    @battlers = battlers
    @battlers.each { |b| b.instance_variable_set(:@battle, self) }
    @scene = nil
    @field = nil
    @turnCount = 1
    @lastMoveUser = nil
    @lastMoveUsed = nil
    @messages = []
    @endOfRound = false
    @priority = []
    @priorityTrickRoom = false
  end
  # R8: el motor real construye @priority en pbCalculatePriority; aquí se imita
  # esa tabla para poder probar la iniciativa de Ash dentro del duelo.
  # R16: la sección instalada envuelve trainerBattle?/wildBattle?/pbThrowPokeBall
  # con alias; el sandbox aporta los "originales" con la semántica del duelo
  # divino real (batalla de entrenador contra el Creador).
  def _ruta_arceus_original_trainer_battle_flag; true; end
  def _ruta_arceus_original_wild_battle_flag; false; end
  def _ruta_arceus_original_throw_poke_ball(*args); 0; end
  def _ruta_arceus_original_calculate_priority(fullCalc = false, indexArray = nil)
    @priority = @battlers.each_with_index.map do |b, i|
      [b, b.instance_variable_get(:@ruta_fake_speed) || 100, 0, 0, i]
    end
    return @priority
  end
  def pbPriority(onlySpeedSort = false)
    return @priority.reject { |entrada| entrada[0].fainted? }.map { |entrada| entrada[0] }
  end
  def pbDisplay(msg, &block)
    @messages.push(msg.to_s)
    return true
  end
  def pbDisplayPaused(msg, &block)
    @messages.push(msg.to_s)
    return true
  end
  def pbFlash(color = nil, frames = 0); end
  def pbShake(power = 0, speed = 0, frames = 0); end
  def pbToneChangeAll(tone = nil, frames = 0); end
  def pbArceusAnimateHP(battler, old_hp); end
  def pbArceusDistortion; end
  def pbArceusEnsureCaptureBall; end
  def pbArceusPhase(battler, phase); end
end

__METODOS__

# ---------------------------------------------------------------------------
# Escenarios de prueba sobre los métodos reales de PokeMod_RutaDeDios
# ---------------------------------------------------------------------------
$report = []
$ok = 0
$fail = 0

def log(text); $report.push(text); end

def check(condition, texto)
  if condition
    $ok += 1
    log "  OK  #{texto}"
  else
    $fail += 1
    log "  FALLO  #{texto}"
  end
end

def mk_battler(index, side, species, hp)
  b = PokeBattle_Battler.new(index, side)
  b.pokemon = FakePokemon.new(species)
  b.instance_variable_set(:@totalhp, hp)
  b.instance_variable_set(:@hp, hp)
  b.pokemon.hp = hp
  return b
end

def cinematic_battle(boss_hp = 1000)
  boss = mk_battler(1, 1, :ARCEUS, boss_hp)
  boss.pokemon.instance_variable_set(:@ruta_arceus_cinematic_boss, true)
  boss.pokemon.instance_variable_set(:@ruta_arceus_divine, true)
  ally = mk_battler(0, 0, :METAGROSS, 500)
  battle = PokeBattle_Battle.new([ally, boss])
  battle.instance_variable_set(:@ruta_arceus_cinematic_mode, true)
  battle.instance_variable_set(:@ruta_arceus_adaptive_cinematic_boss, true)
  return battle, ally, boss
end

def divine_battle(boss_hp = 1000, infer_divine = false)
  boss = mk_battler(1, 1, :ARCEUS, boss_hp)
  boss.pokemon.instance_variable_set(:@ruta_arceus_divine, true)
  boss.pokemon.instance_variable_set(:@ruta_arceus_phase, 1)
  boss.pokemon.instance_variable_set(:@ruta_arceus_restores, 0)
  boss.pokemon.instance_variable_set(:@ruta_arceus_capture_ready, false)
  boss.pokemon.instance_variable_set(:@ruta_arceus_bars_depleted, 0)
  boss.pokemon.instance_variable_set(:@ruta_arceus_redline_healed_phase, 0)
  ash = mk_battler(0, 0, :METAGROSS, 500)
  battle = PokeBattle_Battle.new([ash, boss])
  battle.turnCount = 7
  battle.lastMoveUser = 0
  battle.lastMoveUsed = :METEORMASH
  battle.instance_variable_set(:@arceus_divine, infer_divine ? nil : true)
  return battle, ash, boss
end

log "== Cinemáticas: Arceus de apoyo contra Cynthia/Steven y Red/Gold =="
battle, ally, boss = cinematic_battle
check(boss.ruta_arceus_cinematic_boss? == true, "el jefe de apoyo se reconoce como cinemático")
check(boss.respond_to?(:hp=), "el setter de PS existe")

before = boss.hp
boss.pbReduceHP(62, false)
check(boss.hp == before, "el granizo de la cumbre no baja ni un PS al Creador")

move = PokeBattle_Move.new(battle, :METEORMASH)
boss.damageState.hpLost = 900
move.pbInflictHPDamage(boss)
check(boss.hp == before && boss.damageState.hpLost == 0,
      "Meteor Mash de Metagross golpea pero no resta PS (hpLost anulado)")

battle.messages.clear
boss.damageState.hpLost = 5000
move.pbInflictHPDamage(boss)
check(boss.hp == before, "un golpe letal tampoco mueve la barra")
check(battle.messages.any? { |m| m.include?("se burla") },
      "el intento letal provoca la burla del Creador en vez de una derrota")

battle.messages.clear
boss.hp = 0
check(boss.hp == before, "una escritura directa de PS (plugins/movimientos custom) se rechaza")

boss.hp -= 400
check(boss.hp == before, "hp -= (ruta de confusión y similares) se rechaza")

boss.instance_variable_set(:@hp, 0)
boss.pbFaint
check(boss.hp == boss.totalhp && !boss.fainted?,
      "pbFaint restaura al jefe y nunca registra su derrota")
boss.instance_variable_set(:@hp, 100)
check(boss.pbReduceHP(500) == 0 && boss.hp == boss.totalhp,
      "si un daño externo lo deja a media vida, el escudo la restaura por completo")

log ""
log "== Duelo divino: Ash (Metagross) contra Arceus nivel 200 =="
battle, ash, boss = divine_battle
check(boss.ruta_arceus_divine_boss? == true, "el jefe del duelo real se reconoce como divino")
check(battle.arceus_divine? == true, "la batalla se marca como divina")

move = PokeBattle_Move.new(battle, :METEORMASH)
techo = (boss.totalhp * RUTA_ARCEUS_ASH_BAR_MAX_RATIO).floor
piso = (boss.totalhp * RUTA_ARCEUS_ASH_BAR_MIN_RATIO).ceil
boss.damageState.hpLost = 1200
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted).to_i == 0,
      "R16: un golpe letal YA NO vacía la barra de una vez: el dios exige un duelo")
check(boss.hp == boss.totalhp - techo, "R16: el golpe arranca de verdad su tope (#{techo}) de la barra")
check(boss.damageState.hpLost == techo, "R16: el daño registrado es el tope ponderado, no el golpe bruto")
check(!boss.fainted?, "Arceus no puede ser derrotado con un solo ataque")

battle.turnCount = 8
boss.damageState.hpLost = 1200
move.pbInflictHPDamage(boss)
battle.turnCount = 9
boss.damageState.hpLost = 1200
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted).to_i == 0 && boss.hp > 1,
      "R16: ni tres golpes letales vacían la barra: el umbral rojo devuelve media barra (una vez por fase)")
battle.turnCount = 10
boss.damageState.hpLost = 1200
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "R16: cuatro golpes a tope vacían la primera barra: el dios no cae de dos golpes")
check(boss.hp == boss.totalhp, "la barra se restaura por completo tras la transición")

same_action_key = battle.arceus_action_key
boss2_key = battle.instance_variable_get(:@ruta_arceus_last_bar_action_key)
check(boss2_key == same_action_key, "la acción que rompió la barra queda registrada")

boss.damageState.hpLost = 900
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "un multigolpe no puede saltar dos barras en la misma acción")
check(boss.hp == boss.totalhp - techo && !boss.fainted?,
      "el impacto extra de la misma acción recorta la barra sin poder derrotarlo")

battle.instance_variable_set(:@arceus_redline_healed_phase, 0)
boss.instance_variable_set(:@hp, piso)
check(battle.pbArceusRedlineHeal(boss, true) == true,
      "el umbral rojo se cruza con la barra baja y devuelve media barra")
check(boss.hp == piso + (boss.totalhp * RUTA_ARCEUS_REDLINE_HEAL_RATIO).round,
      "la curación de umbral rojo devuelve media barra y no borra el avance")

3.times do |k|
  battle.turnCount = 10 + k
  battle.lastMoveUsed = [:ZENHEADBUTT, :BULLETPUNCH, :HAMMERARM][k]
  boss.damageState.hpLost = 1200
  move.pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 2,
      "en los turnos siguientes la segunda barra se agota normalmente")

before = boss.hp
battle.instance_variable_set(:@endOfRound, true)
boss.pbReduceHP(62, false)
check(boss.hp == before, "el granizo de fin de ronda no toca la barra de Arceus")
battle.instance_variable_set(:@endOfRound, false)

boss.hp = 0
check(boss.hp > 0, "una escritura externa de PS no puede derrotar al dios")
boss.instance_variable_set(:@hp, 0)
boss.pbFaint
check(boss.hp > 0 && !boss.fainted?, "pbFaint jamás cierra el duelo con una derrota de Arceus")

log ""
log "== Seis barras y captura: nadie salta el guion =="
battle, ash, boss = divine_battle
move = PokeBattle_Move.new(battle, :METEORMASH)
24.times do |i|
  battle.turnCount = 10 + i
  battle.lastMoveUsed = [:METEORMASH, :ZENHEADBUTT, :BULLETPUNCH, :HAMMERARM][i % 4]
  boss.damageState.hpLost = 1000 + i
  move.pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 6,
      "R16: cuatro golpes letales por barra (veinticuatro en total) agotan exactamente las seis barras")
check(battle.instance_variable_get(:@arceus_capture_ready) == true,
      "tras la sexta barra se habilita la captura determinista")
check(boss.hp == 1, "Arceus queda a 1 PS para la captura final")
check(!boss.fainted?, "sigue en pie: la sexta barra no es una derrota")

boss.damageState.hpLost = 500
move.pbInflictHPDamage(boss)
check(boss.hp == 1, "después de la sexta barra no se puede seguir dañando")

log ""
log "== Inferencia del modo divino sin bandera previa =="
battle, ash, boss = divine_battle(1000, true)
check(battle.arceus_divine? == true, "la batalla reconoce al jefe por la marca del Pokémon")
boss.damageState.hpLost = 2000
move = PokeBattle_Move.new(battle, :METEORMASH)
move.pbInflictHPDamage(boss)
techo_inf = (boss.totalhp * RUTA_ARCEUS_ASH_BAR_MAX_RATIO).floor
check(battle.instance_variable_get(:@arceus_bars_depleted).to_i == 0 && boss.hp == boss.totalhp - techo_inf,
      "aunque nadie marque la batalla, el daño sigue pasando por las barras (con el tope R16)")

log ""
log "== Ball Breaker (DF08): el movimiento de Metagross ya no aborta el combate =="
# Se ejecuta la clase REAL del juego (sección Despacito Despair) con los
# ayudantes que restaura PokeMod_RutaDeDios. Sin ellos, esta misma llamada
# lanzaba NoMethodError: undefined method 'selfProtected?' for an instance of
# PokeBattle_Battler.
battle = PokeBattle_Battle.new([])
target = mk_battler(0, 0, :RATTATA, 300)
target.ownSide = FakeSide.new
target.effects = {}
check(target.respond_to?(:selfProtected?) && target.respond_to?(:sideProtected?),
      "los ayudantes selfProtected? y sideProtected? existen en PokeBattle_Battler")
check(target.selfProtected? == false && target.sideProtected? == false,
      "sin protecciones activas ambos ayudantes devuelven false")

target.effects[PBEffects::Protect] = true
check(target.selfProtected? == true, "selfProtected? detecta Protect")
check(target.sideProtected? == false, "sideProtected? no inventa protecciones de lado")

ball_breaker = PokeBattle_Move_DF08.new(battle)
battle.messages.clear
ball_breaker.pbAttackingTurnEffect(nil, target)
check(battle.messages.any? { |m| m.include?("protection ended") },
      "Ball Breaker avisa de que la protección terminó")
check(target.effects[PBEffects::Protect] == false,
      "Ball Breaker retira la protección individual (Protect, King's Shield…)")
check(target.effects[PBEffects::Obstruct] == false, "y no deja restos de otros escudos")

target.effects[PBEffects::Protect] = true
target.pbOwnSide.effects[PBEffects::WideGuard] = true
check(target.sideProtected? == true, "sideProtected? detecta Wide Guard del lado")
battle.messages.clear
ball_breaker.pbAttackingTurnEffect(nil, target)
check(battle.messages.any? { |m| m.include?("its side ended") },
      "con protección doble avisa al mismo tiempo del escudo y del lado")
check(target.effects[PBEffects::Protect] == false && target.pbOwnSide.effects[PBEffects::WideGuard] == false,
      "Ball Breaker limpia también las protecciones de lado")

battle.messages.clear
ball_breaker.pbAttackingTurnEffect(nil, target)
check(battle.messages.empty?, "sin protecciones no muestra ningún mensaje")

# Ahora la versión blindada que viaja instalada (renombrada por el arnés).
blindada = PokeBattle_Move_DF08Ruta.new(battle)
target.effects[PBEffects::Protect] = true
target.pbOwnSide.effects[PBEffects::QuickGuard] = true
battle.messages.clear
blindada.pbAttackingTurnEffect(nil, target)
check(battle.messages.any? { |m| m.include?("its side ended") },
      "la versión instalada avisa igual del escudo y del lado")
check(target.effects[PBEffects::Protect] == false && target.pbOwnSide.effects[PBEffects::QuickGuard] == false,
      "la versión instalada retira todas las protecciones")
battle.messages.clear
blindada.pbAttackingTurnEffect(nil, nil)
check(battle.messages.empty?, "la versión instalada tolera un objetivo nulo sin lanzar excepción")

log ""
log "== Regresión: un Arceus normal del jugador no lleva escudo =="
normal = mk_battler(0, 0, :ARCEUS, 400)
battle = PokeBattle_Battle.new([normal])
check(normal.pbReduceHP(120) == 120 && normal.hp == 280,
      "el Arceus capturado o de un equipo cualquiera recibe daño normal")
normal.hp = 0
check(normal.hp == 0, "y puede debilitarse como cualquier Pokémon")

log ""
log "== Duelo jugable (R8): iniciativa de Ash, barras que sí se mueven y cero KOs de un golpe =="
battle, ash, boss = divine_battle
ash.instance_variable_set(:@ruta_fake_speed, 5)
boss.instance_variable_set(:@ruta_fake_speed, 9999)
battle.pbCalculatePriority(true)
order = battle.pbPriority
check(order.first.equal?(ash) && order.last.equal?(boss),
      "el lado de Ash abre la ronda aunque Arceus sea mil veces más rápido")
battle.instance_variable_set(:@priorityTrickRoom, true)
battle.pbCalculatePriority(false)
order = battle.pbPriority
check(order.first.equal?(ash),
      "la iniciativa de Ash sobrevive al Espacio Raro de la Etapa 4")
battle.instance_variable_set(:@priorityTrickRoom, false)
battle.instance_variable_set(:@arceus_capture_ready, true)
check(battle.ruta_arceus_ash_first_active? == false,
      "con la sexta barra agotada la regla de iniciativa se apaga")
battle.instance_variable_set(:@arceus_capture_ready, false)
check(battle.ruta_arceus_ash_first_active? == true,
      "mientras el duelo siga vivo, Ash conserva la iniciativa")

battle, ash, boss = divine_battle
ash.instance_variable_set(:@totalhp, 500)
ash.instance_variable_set(:@hp, 500)
battle.messages.clear
ash.damageState.hpLost = 9999
ash.damageState.totalHPLost = 9999
check(battle.ruta_arceus_apply_ohko_guard(boss, ash) == true,
      "la guardia anti-KO reconoce el golpe letal de Arceus")
tope = (500 * RUTA_ARCEUS_HIT_CAP_RATIO).round
check(ash.damageState.hpLost == tope && ash.damageState.endured == true,
      "un golpe mortal de Arceus sólo quita el 40 % de la vida máxima: nunca un KO de un solo turno (R16)")
check(battle.messages.any? { |m| m.include?("se niega a caer") },
      "el vínculo de Ash se narra cuando el golpe mortal es detenido")

ash.instance_variable_set(:@hp, 500 - ash.damageState.hpLost)
ash.damageState.hpLost = 9999
ash.damageState.totalHPLost = tope + 9999
battle.ruta_arceus_apply_ohko_guard(boss, ash)
check(ash.damageState.hpLost == 0,
      "el segundo impacto de la misma acción (multigolpe) tampoco remata")

ash.instance_variable_set(:@hp, 500 - tope)
ash.damageState.hpLost = 9999
ash.damageState.totalHPLost = 9999
battle.ruta_arceus_apply_ohko_guard(boss, ash)
check(ash.damageState.hpLost == tope && ash.instance_variable_get(:@hp) - ash.damageState.hpLost == 500 - 2 * tope,
      "cada acción de Arceus vuelve a toparse: hacen falta tres para tumbar a un Pokémon sano (R16)")

ash.instance_variable_set(:@hp, 500)
ash.damageState.hpLost = 300
ash.damageState.totalHPLost = 300
ash.damageState.endured = false
battle.ruta_arceus_apply_ohko_guard(boss, ash)
check(ash.damageState.hpLost == tope && ash.damageState.endured == false,
      "un golpe fuerte no mortal se recorta al tope sin gastar el relato de aguante")

ash.instance_variable_set(:@hp, tope)
ash.damageState.hpLost = 9999
ash.damageState.totalHPLost = 9999
check(battle.ruta_arceus_apply_ohko_guard(boss, ash) == false && ash.damageState.hpLost == 9999,
      "un Pokémon ya debilitado por debajo del tope sí puede ser derribado: el duelo no se estanca")
check(battle.ruta_arceus_apply_ohko_guard(boss, boss) == false,
      "la guardia nunca protege al propio Arceus")
cinematica, ash_cine, boss_cine = cinematic_battle
check(cinematica.ruta_arceus_apply_ohko_guard(boss_cine, ash_cine) == false,
      "las cinemáticas de apoyo no usan la guardia del duelo")

battle, ash, boss = divine_battle(1000)
move = PokeBattle_Move.new(battle, :METEORMASH)
battle.turnCount = 21
battle.lastMoveUser = 0
battle.lastMoveUsed = :METEORMASH
piso_barra = (boss.totalhp * RUTA_ARCEUS_ASH_BAR_MIN_RATIO).ceil
techo_barra = (boss.totalhp * RUTA_ARCEUS_ASH_BAR_MAX_RATIO).floor
check(battle.ruta_arceus_ash_bar_damage(boss, 40) == piso_barra,
      "un golpe flojo de Ash paga el piso del vínculo (25 % de la barra): nada es inútil (R16)")
check(battle.ruta_arceus_ash_bar_damage(boss, 999_999) == techo_barra,
      "un golpe brutal topa en el 45 % de la barra: el dios exige al menos tres impactos (R16)")
boss.damageState.hpLost = 40
move.pbInflictHPDamage(boss)
check(boss.hp == boss.totalhp - piso_barra,
      "ese mismo golpe mueve de verdad la primera barra del dios (#{piso_barra} PS divinos)")
battle.lastMoveUser = 1
check(battle.ruta_arceus_ash_bar_damage(boss, 40) == 40,
      "el daño que no sale de Ash (retroceso, clima) no recibe el vínculo")

log ""
log "== Ritmo del duelo (R9): seis barras contra un equipo de seis Pokémon =="
# Simulación determinista sobre los métodos reales: cada turno Ash golpea con
# un daño bruto (antes del vínculo) y Arceus responde con su mejor golpe. Se
# cuentan los turnos hasta vaciar las seis barras y las bajas que aguanta un
# equipo de seis Pokémon sanos. Sirve para demostrar que el duelo se puede
# ganar jugando bien y que el umbral rojo no castiga al jugador que pega fuerte.
def simular_duelo(proporcion_golpe, cada_cuanto_falla = nil, max_turnos = 120, curaciones = 90)
  battle, ash, boss = divine_battle(1000)
  move = PokeBattle_Move.new(battle, :METEORMASH)
  bajas = 0
  max_turnos.times do |indice|
    turno = indice + 1
    battle.turnCount = turno
    battle.lastMoveUser = 0
    battle.lastMoveUsed = :METEORMASH
    desperdiciado = cada_cuanto_falla && (turno % cada_cuanto_falla).zero?
    boss.damageState.hpLost = desperdiciado ? 0 : (boss.totalhp * proporcion_golpe).round
    boss.damageState.totalHPLost = boss.damageState.hpLost
    move.pbInflictHPDamage(boss)
    return [turno, bajas, true] if battle.instance_variable_get(:@arceus_capture_ready) == true
    # Turno de Arceus: su mejor golpe contra el Pokémon activo, ya topeado.
    battle.lastMoveUser = boss.index
    battle.lastMoveUsed = :JUDGMENT
    battle.pbArceusRedlineHeal(boss, true)
    ash.damageState.hpLost = ash.totalhp * 4
    ash.damageState.totalHPLost = ash.damageState.hpLost
    battle.ruta_arceus_apply_ohko_guard(boss, ash)
    ash.instance_variable_set(:@hp, [ash.hp - ash.damageState.hpLost, 0].max)
    if ash.hp <= 0
      bajas += 1
      return [turno, bajas, false] if bajas >= 6
      ash.instance_variable_set(:@hp, ash.totalhp)
      ash.pokemon.hp = ash.totalhp
    end
    # R9/R16 · estrategia mínima: curarse por debajo del 40 % (objetos, bayas,
    # relevos). Sin estrategia el duelo R16 es más largo y se pierde; con ella
    # se gana, que es exactamente el balance pedido.
    if ash.hp > 0 && curaciones > 0 && ash.hp * 5 < ash.totalhp * 2
      curaciones -= 1
      ash.instance_variable_set(:@hp, ash.totalhp)
      ash.pokemon.hp = ash.totalhp
    end
  end
  return [max_turnos, bajas, false]
end

turnos_peor, bajas_peor, gano_peor = simular_duelo(0.01)
check(gano_peor == true && turnos_peor <= 45,
      "con los golpes más flojos (piso del vínculo) las seis barras caen en #{turnos_peor} turnos: el dios YA NO cae de dos golpes (R16)")
check(turnos_peor >= 24,
      "el duelo con golpes flojos dura al menos #{turnos_peor} turnos: se siente a dios, no a trámite (R16)")
check(bajas_peor <= 2,
      "ese mismo duelo, curándose cuando toca (estrategia R9), deja a Ash casi intacto (#{bajas_peor} bajas)")
turnos_fuerte, bajas_fuerte, gano_fuerte = simular_duelo(0.35)
check(gano_fuerte == true && turnos_fuerte <= 32 && bajas_fuerte <= 2,
      "golpes fuertes por turno cierran el duelo en #{turnos_fuerte} turnos y #{bajas_fuerte} bajas (R16)")
check(turnos_fuerte <= turnos_peor,
      "hacer más daño nunca alarga el duelo: el umbral rojo no castiga al jugador")
check(bajas_peor < 6 && bajas_fuerte < 6,
      "Arceus no barre el equipo antes de que Ash vacíe las seis barras")

# Jugador descuidado: pierde un turno de cada tres (inmunidades, fallos de
# precisión, cambio de Pokémon, curación con objetos). El duelo sigue ganándose.
turnos_perdidos, bajas_perdidas, gano_perdido = simular_duelo(0.01, 3, 160, 120)
check(gano_perdido == true && bajas_perdidas <= 3 && turnos_perdidos <= 64,
      "un jugador que pierde uno de cada tres turnos igual cierra las seis barras (#{turnos_perdidos} turnos, #{bajas_perdidas} bajas)")

log ""
log "== R16: el dios se adapta al movimiento repetido (Juicio impredecible) =="
module GameData
  module Move
    Dato = Struct.new(:id, :name, :type)
    MAPA = { METEORMASH: :STEEL, JUDGMENT: :NORMAL, PSYCHIC: :PSYCHIC }.freeze
    def self.exists?(s)
      MAPA.key?(s.to_s.to_sym)
    rescue StandardError
      false
    end
    def self.get(s)
      Dato.new(s.to_s.to_sym, s.to_s, MAPA[s.to_s.to_sym])
    end
  end
end
battle, ash, boss = divine_battle
battle.instance_variable_set(:@arceus_phase, 2)
battle.lastMoveUser = ash.index
battle.lastMoveUsed = :JUDGMENT
rota = []
battle.define_singleton_method(:pbArceusRotateType) { |b, fase, idx = nil| rota << [b.equal?(boss), fase, idx] }
boss.define_singleton_method(:pbTypes) { |*a| [:PSYCHIC] }
battle.ruta_arceus_adaptacion(boss)
battle.ruta_arceus_adaptacion(boss)
check(rota.empty?, "dos repeticiones no provocan adaptación: el dios observa antes de responder")
battle.ruta_arceus_adaptacion(boss)
check(rota.length == 1 && rota[0][0] == true && rota[0][2] == RUTA_ARCEUS_PHASE_TYPES.index(:NORMAL),
      "a la tercera repetición Arceus toma el tipo del movimiento: la Tabla adecuada arde (R16)")
3.times { battle.ruta_arceus_adaptacion(boss) }
check(rota.length == 1, "la adaptación no se repite para el mismo tipo en la misma fase")
battle.lastMoveUsed = :METEORMASH
3.times { battle.ruta_arceus_adaptacion(boss) }
check(rota.length == 1, "un tipo sin Tabla en el sandbox no rompe la adaptación ni lanza errores")
GameData.send(:remove_const, :Move)

log ""
log "== R16: captura divina en batalla de entrenador =="
battle, ash, boss = divine_battle
check(battle.trainerBattle? == true && battle.wildBattle? == false,
      "fuera de la ventana el duelo informa su tipo real: batalla de entrenador (R16)")
battle.instance_variable_set(:@ruta_arceus_capture_window, true)
check(battle.trainerBattle? == false && battle.wildBattle? == true,
      "la ventana de captura convierte la batalla en salvaje sólo para la bola (R16)")
battle.instance_variable_set(:@ruta_arceus_capture_window, nil)
check(battle.trainerBattle? == true && battle.wildBattle? == false,
      "la ventana se cierra y el duelo vuelve a ser de entrenador (R16)")
check(battle.respond_to?(:pbThrowPokeBall), "el lanzamiento de bola existe y está envuelto por la ventana divina (R16)")

log ""
log "Resultado: #{$ok} comprobaciones OK, #{$fail} fallos"
$report.join("\n") + "\n\nRESUMEN: #{$ok} OK / #{$fail} FALLOS"
