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
# R8 · duelo jugable (los mismos valores que la sección instalada).
RUTA_ARCEUS_ASH_BAR_POWER = 4.0
RUTA_ARCEUS_ASH_BAR_MIN_RATIO = 0.5
RUTA_ARCEUS_OHKO_FLOOR_RATIO = 0.30

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
boss.damageState.hpLost = 1200
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "un Metagross que golpea a muerte sólo agota la barra 1/6")
check(boss.hp == boss.totalhp, "la barra se restaura por completo tras la transición")
check(boss.damageState.hpLost == 0, "no se aplica daño real: la barra se vacía por guion")
check(!boss.fainted?, "Arceus no puede ser derrotado con un solo ataque")

same_action_key = battle.arceus_action_key
boss2_key = battle.instance_variable_get(:@ruta_arceus_last_bar_action_key)
check(boss2_key == same_action_key, "la acción que rompió la barra queda registrada")

boss.damageState.hpLost = 900
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "un multigolpe no puede saltar dos barras en la misma acción")
check(boss.hp >= 1 && !boss.fainted?, "el impacto extra de la misma acción no puede derrotarlo")
check(boss.hp == boss.totalhp, "la curación de umbral rojo devuelve la barra nueva a su sitio")

battle.turnCount = 8
battle.lastMoveUsed = :ZENHEADBUTT
boss.damageState.hpLost = 1200
move.pbInflictHPDamage(boss)
check(battle.instance_variable_get(:@arceus_bars_depleted) == 2,
      "en el siguiente turno la segunda barra se agota normalmente")

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
6.times do |i|
  battle.turnCount = 10 + i
  battle.lastMoveUsed = [:METEORMASH, :ZENHEADBUTT, :BULLETPUNCH, :HAMMERARM][i % 4]
  boss.damageState.hpLost = 1000 + i
  move.pbInflictHPDamage(boss)
end
check(battle.instance_variable_get(:@arceus_bars_depleted) == 6,
      "seis ataques letales agotan exactamente las seis barras")
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
check(battle.instance_variable_get(:@arceus_bars_depleted) == 1,
      "aunque nadie marque la batalla, el daño sigue pasando por las barras")

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
check(ash.damageState.hpLost == 350 && ash.damageState.endured == true,
      "el golpe deja a Ash al 30 % de su vida máxima: nunca un KO de un solo turno")
check(battle.messages.any? { |m| m.include?("se niega a caer") },
      "el vínculo de Ash se narra cuando el golpe mortal es detenido")

ash.instance_variable_set(:@hp, 500 - ash.damageState.hpLost)
ash.damageState.hpLost = 9999
ash.damageState.totalHPLost = 350 + 9999
battle.ruta_arceus_apply_ohko_guard(boss, ash)
check(ash.damageState.hpLost == 0,
      "el segundo impacto de la misma acción (multigolpe) tampoco remata")

ash.damageState.hpLost = 9999
ash.damageState.totalHPLost = 9999
battle.ruta_arceus_apply_ohko_guard(boss, ash)
check(ash.damageState.hpLost == 150,
      "un Pokémon que ya entró al turno al 30 % sí puede ser derribado")
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
check(battle.ruta_arceus_ash_bar_damage(boss, 40) >= 500,
      "un golpe flojo de Ash vale al menos media barra por el vínculo del prólogo")
boss.damageState.hpLost = 40
move.pbInflictHPDamage(boss)
check(boss.hp == 500,
      "ese mismo golpe mueve de verdad la primera barra del dios")
battle.lastMoveUser = 1
check(battle.ruta_arceus_ash_bar_damage(boss, 40) == 40,
      "el daño que no sale de Ash (retroceso, clima) no recibe el vínculo")

log ""
log "Resultado: #{$ok} comprobaciones OK, #{$fail} fallos"
$report.join("\n") + "\n\nRESUMEN: #{$ok} OK / #{$fail} FALLOS"
