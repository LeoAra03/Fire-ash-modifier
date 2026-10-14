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
# R8/R9 · duelo jugable (los mismos valores que la sección instalada).
RUTA_ARCEUS_ASH_BAR_POWER = 1.35
RUTA_ARCEUS_ASH_BAR_MIN_RATIO = 0.12
RUTA_ARCEUS_ASH_BAR_MAX_RATIO = 0.38
RUTA_ARCEUS_HIT_CAP_RATIO = 0.48
RUTA_ARCEUS_REDLINE_HEAL_RATIO = 0.25

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
  ash2 = mk_battler(2, 0, :PIKACHU, 500)
  battle = PokeBattle_Battle.new([ash, boss, ash2])
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
ash2 = battle.battlers[2]
# La barra tiene un tope real del 38% por acción. Dos golpes no la vacían,
# incluso al cruzar el umbral rojo (que devuelve un cuarto de barra una vez).
[[7, 0, :METEORMASH], [8, 2, :EXTREMESPEED]].each do |turno, usuario, id|
  battle.turnCount = turno
  battle.lastMoveUser = usuario
  battle.lastMoveUsed = id
  boss.damageState.hpLost = 1200
  PokeBattle_Move.new(battle, id).pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 0,
      "Arceus no cae en dos golpes: la barra sobrevive y se restaura al umbral rojo")
check(boss.hp == (boss.totalhp * (1.0 - 2 * RUTA_ARCEUS_ASH_BAR_MAX_RATIO +
                  RUTA_ARCEUS_REDLINE_HEAL_RATIO)).round,
      "dos golpes dejan la barra abierta tras recuperar un cuarto")

# Dos acciones más cruzan la barra, pero el impacto extra de esa MISMA acción
# no puede saltar a la siguiente.
[[9, 0, :METEORMASH], [10, 2, :EXTREMESPEED]].each do |turno, usuario, id|
  battle.turnCount = turno
  battle.lastMoveUser = usuario
  battle.lastMoveUsed = id
  boss.damageState.hpLost = 1200
  PokeBattle_Move.new(battle, id).pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "cuatro ataques y la curación roja agotan exactamente la primera barra")
check(boss.hp == boss.totalhp && !boss.fainted?, "la primera barra se restaura completa tras la transición")
check(boss.damageState.hpLost == 0, "la transición no aplica daño real ni derrota a Arceus")
same_action_key = battle.arceus_action_key
boss2_key = battle.instance_variable_get(:@ruta_arceus_last_bar_action_key)
check(boss2_key == same_action_key, "la acción que rompió la barra queda registrada")
boss.damageState.hpLost = 900
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1 && boss.hp == boss.totalhp,
      "un multigolpe no puede saltar dos barras en la misma acción")
check(!boss.fainted?, "ningún golpe aislado puede derrotar al Creador")

# El umbral rojo es real y sólo devuelve un cuarto de la barra en esa fase.
boss.ruta_arceus_scripted_hp_write { boss.hp = boss.totalhp / 5 }
battle.pbArceusRedlineHeal(boss, true)
check(boss.hp == (boss.totalhp / 5) + (boss.totalhp * RUTA_ARCEUS_REDLINE_HEAL_RATIO).round,
      "la curación de umbral rojo devuelve un cuarto, no borra el avance")

# La segunda fase también permite agotar una barra completa sin saltos.
boss.ruta_arceus_scripted_hp_write { boss.hp = boss.totalhp }
[[11, 0, :METEORMASH], [12, 2, :EXTREMESPEED], [13, 0, :METEORMASH]].each do |turno, usuario, id|
  battle.turnCount = turno
  battle.lastMoveUser = usuario
  battle.lastMoveUsed = id
  boss.damageState.hpLost = 1200
  PokeBattle_Move.new(battle, id).pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) >= 2,
      "la segunda barra se agota con la progresión completa, sin saltos")

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
6.times do |fase|
  acciones = 0
  while battle.instance_variable_get(:@arceus_bars_depleted).to_i == fase && acciones < 8
    battle.turnCount = 10 + fase * 8 + acciones
    battle.lastMoveUser = acciones.even? ? 0 : 2
    id = acciones.even? ? :METEORMASH : :EXTREMESPEED
    battle.lastMoveUsed = id
    boss.damageState.hpLost = 1000 + acciones
    boss.damageState.totalHPLost = boss.damageState.hpLost
    PokeBattle_Move.new(battle, id).pbInflictHPDamage(boss)
    acciones += 1
    break if battle.instance_variable_get(:@arceus_capture_ready) == true
  end
  break if battle.instance_variable_get(:@arceus_capture_ready) == true
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 6,
      "seis barras se agotan con golpes limitados a 38% y sus transiciones")
check(battle.instance_variable_get(:@arceus_capture_ready) == true,
      "tras la sexta barra se habilita la captura determinista")
check(boss.hp == 1, "Arceus queda a 1 PS para la captura final")
check(!boss.fainted?, "sigue en pie: la sexta barra no es una derrota")

move = PokeBattle_Move.new(battle, :METEORMASH)
boss.damageState.hpLost = 500
move.pbInflictHPDamage(boss)
check(boss.hp == 1, "después de la sexta barra no se puede seguir dañando")

log ""
log "== Inferencia del modo divino sin bandera previa =="
battle, ash, boss = divine_battle(1000, true)
check(battle.arceus_divine? == true, "la batalla reconoce al jefe por la marca del Pokémon")
[[1, 0, :METEORMASH], [2, 2, :EXTREMESPEED], [3, 0, :METEORMASH],
 [4, 2, :EXTREMESPEED]].each do |turno, usuario, id|
  battle.turnCount = turno
  battle.lastMoveUser = usuario
  battle.lastMoveUsed = id
  boss.damageState.hpLost = 2000
  PokeBattle_Move.new(battle, id).pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "sin bandera previa, cuatro acciones reales también avanzan una barra")

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
check(order.take(2).all? { |battler| battler.side == 0 } && order.last.equal?(boss),
      "todo el lado de Ash abre la ronda aunque Arceus sea mil veces más rápido")
battle.instance_variable_set(:@priorityTrickRoom, true)
battle.pbCalculatePriority(false)
order = battle.pbPriority
check(order.take(2).all? { |battler| battler.side == 0 } && order.last.equal?(boss),
      "la iniciativa del lado de Ash sobrevive al Espacio Raro de la Etapa 4")
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
      "un golpe mortal de Arceus sólo quita como máximo el 48%: nunca un KO de un solo turno")
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
      "cada acción de Arceus vuelve a toparse: hacen falta tres para tumbar a un Pokémon sano")

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
check(battle.ruta_arceus_ash_bar_damage(boss, 40) == 120,
      "un golpe flojo de Ash conserva el mínimo del 12% y el vínculo del prólogo")
boss.damageState.hpLost = 40
move.pbInflictHPDamage(boss)
check(boss.hp == 880,
      "el golpe mínimo mueve de verdad la barra del dios por la ruta de daño")
battle.lastMoveUser = 1
check(battle.ruta_arceus_ash_bar_damage(boss, 40) == 40,
      "el daño que no sale de Ash (retroceso, clima) no recibe el vínculo")

log ""
log "== Ritmo del duelo (R9): seis barras contra un equipo de seis Pokémon =="
# Simulación del duelo doble sobre las rutas REALES: dos acciones de Ash por
# turno golpean las barras (cada una con su tope), Arceus responde una vez y la
# guardia permite que un equipo competente gane, pero no rescata a uno débil.
def simular_duelo(proporcion_golpe, cada_cuanto_falla = nil, max_turnos = 40)
  battle, ash, boss = divine_battle(1000)
  ash2 = battle.battlers[2]
  bajas = 0
  max_turnos.times do |indice|
    turno = indice + 1
    desperdiciado = cada_cuanto_falla && (turno % cada_cuanto_falla).zero?
    [[0, :METEORMASH], [2, :EXTREMESPEED]].each do |usuario, move_id|
      next if desperdiciado
      battle.turnCount = turno
      battle.lastMoveUser = usuario
      battle.lastMoveUsed = move_id
      boss.damageState.hpLost = (boss.totalhp * proporcion_golpe).round
      boss.damageState.totalHPLost = boss.damageState.hpLost
      PokeBattle_Move.new(battle, move_id).pbInflictHPDamage(boss)
      return [turno, bajas, true] if battle.instance_variable_get(:@arceus_capture_ready) == true
    end
    # Respuesta del jefe sobre un slot activo. El resto del equipo es la cola de
    # reemplazos: seis bajas terminan el combate y hacen posible perder.
    battle.turnCount = turno
    battle.lastMoveUser = boss.index
    battle.lastMoveUsed = :JUDGMENT
    battle.pbArceusRedlineHeal(boss, true)
    target = turno.even? ? ash2 : ash
    target.damageState.hpLost = target.totalhp * 4
    target.damageState.totalHPLost = target.damageState.hpLost
    battle.ruta_arceus_apply_ohko_guard(boss, target)
    target.instance_variable_set(:@hp, [target.hp - target.damageState.hpLost, 0].max)
    target.pokemon.hp = target.hp
    if target.hp <= 0
      bajas += 1
      return [turno, bajas, false] if bajas >= 6
      target.instance_variable_set(:@hp, target.totalhp)
      target.pokemon.hp = target.totalhp
    end
  end
  return [max_turnos, bajas, false]
end

turnos_debiles, bajas_debiles, gano_debil = simular_duelo(0.01)
check(gano_debil == false && bajas_debiles >= 1,
      "un equipo que apenas rasguña la barra puede perder el combate (#{turnos_debiles} turnos, #{bajas_debiles} bajas)")
turnos_fuerte, bajas_fuerte, gano_fuerte = simular_duelo(0.40)
check(gano_fuerte == true && turnos_fuerte <= 18 && bajas_fuerte < 6,
      "dos ataques bien preparados por turno pueden vaciar seis barras (#{turnos_fuerte} turnos, #{bajas_fuerte} bajas)")
check(turnos_fuerte < turnos_debiles,
      "un equipo con buen daño avanza más rápido que uno mal preparado")

# Incluso un equipo fuerte resiste perder una ronda de cada tres, aunque la
# Orden Divina cobra bajas; el escenario débil de arriba sigue demostrando que
# perder también es posible.
turnos_perdidos, bajas_perdidas, gano_perdido = simular_duelo(0.40, 3)
check(gano_perdido == true && bajas_perdidas >= 1 && bajas_perdidas < 6,
      "un equipo fuerte puede recuperarse de rondas perdidas, con bajas reales (#{turnos_perdidos} turnos, #{bajas_perdidas} bajas)")

log ""
log "Resultado: #{$ok} comprobaciones OK, #{$fail} fallos"
$report.join("\n") + "\n\nRESUMEN: #{$ok} OK / #{$fail} FALLOS"
