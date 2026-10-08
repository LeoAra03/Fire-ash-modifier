# ============================================================================
# arceus_fuzz_scenarios.rb
#
# Un millón de escenarios deterministas (semilla fija) sobre el código REAL
# instalado de PokeMod_RutaDeDios + PokeMod_CanonArceus, ejecutados por
# tools/qa/arceus_fuzz_harness.mjs dentro de CRuby 3.3 (WebAssembly). Cada
# familia vive en su propio método: el arnés lanza un VM por familia porque el
# heap de WASM no tolera las cuatro tandas acumuladas en un solo eval.
#
#   F1 · 800 000 · micro-fuzz de la guardia anti-KO (tope de un tercio).
#   F2 · 150 000 · clima/terreno sucios + pbStartWeather con basura + fin de
#                  ronda parcheado + batalla_clima del canon.
#   F3 ·   6 000 · duelos completos aleatorios: seis barras, umbral rojo,
#                  Mega Arceus de los Mil Brazos, bajas y captura.
#   F4 ·  44 000 · barrido de las seis fases del canon sobre campos sucios.
# ============================================================================

CAP = RUTA_ARCEUS_HIT_CAP_RATIO
MIL_BRAZOS = [:FURYSWIPES, :COMETPUNCH, :PINMISSILE, :ARMTHRUST]
BASURA = [5, 0, -3, 3.5, true, :RAINDANCE, :SUNNYDAY, :FOGMOVE, "Sun", "7",
          :Sun, :Rain, :Sandstorm, :Hail, :Fog, :None, :HarshSun, :ShadowSky].freeze

class FuzzMon < PokeBattle_Battler
  def initialize(index, side, species, totalhp)
    super(index, side)
    @pokemon = Pokemon.new(species, 100)
    @totalhp = totalhp
    @hp = totalhp
    @pokemon.hp = totalhp
  end
end

def fuzz_divine_battle(party_n, boss_hp = 1000)
  boss = FuzzMon.new(1, 1, :ARCEUS, boss_hp)
  boss.pokemon.instance_variable_set(:@ruta_arceus_divine, true)
  boss.pokemon.instance_variable_set(:@ruta_arceus_phase, 1)
  boss.pokemon.instance_variable_set(:@ruta_arceus_restores, 0)
  boss.pokemon.instance_variable_set(:@ruta_arceus_capture_ready, false)
  boss.pokemon.instance_variable_set(:@ruta_arceus_bars_depleted, 0)
  boss.pokemon.instance_variable_set(:@ruta_arceus_redline_healed_phase, 0)
  party = (0...party_n).map { |i| FuzzMon.new(0, 0, :METAGROSS, 400 + (i * 37) % 200) }
  battle = PokeBattle_Battle.new(party + [boss])
  battle.instance_variable_set(:@arceus_divine, true)
  battle.turnCount = 1
  [battle, party, boss]
end

# ── F1 · micro-fuzz de la guardia anti-KO ───────────────────────────────────
def fuzz_f1(rng, fallos)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  battle1, party1, boss1 = fuzz_divine_battle(2, 1000)
  objetivo = party1[0]
  f1 = 0
  800_000.times do
    total = 1 + rng.rand(3000)
    hp0 = 1 + rng.rand(total)
    lost = 1 + rng.rand(total + 100)
    objetivo.totalhp = total
    objetivo.hp = hp0
    ds = objetivo.damageState
    ds.hpLost = lost
    ds.totalHPLost = lost
    ds.substitute = false
    ds.endured = false
    battle1.turnCount = 1 + (f1 % 37)
    begin
      battle1.ruta_arceus_apply_ohko_guard(boss1, objetivo)
    rescue StandardError => e
      notar.call("F1 excepción #{e.class}: #{e.message.to_s[0, 60]}")
      f1 += 1
      next
    end
    cap = (total * CAP).round
    cap = 1 if cap < 1
    notar.call("F1 tope violado: hp0=#{hp0} cap=#{cap} aplicado=#{ds.hpLost}") if hp0 > cap && ds.hpLost > cap
    notar.call("F1 daño negativo") if ds.hpLost < 0
    notar.call("F1 endured sin golpe letal") if ds.endured && lost < hp0
    f1 += 1
    GC.start if (f1 % 200_000).zero?
  end
  f1
end

# ── F2 · clima y terreno sucios, fin de ronda parcheado ─────────────────────
def fuzz_f2(rng, fallos)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  battle2, = fuzz_divine_battle(1, 800)
  f2 = 0
  150_000.times do
    valor = BASURA[rng.rand(BASURA.length)]
    begin
      case rng.rand(5)
      when 0 then battle2.pbStartWeather(nil, valor)
      when 1 then battle2.defaultWeather = valor
      when 2 then battle2.field.weather = valor
      when 3 then battle2.field.terrain = valor
      when 4 then CanonArceus.batalla_clima(battle2, rng.rand(12))
      end
    rescue StandardError => e
      notar.call("F2 excepción escapada #{e.class}: #{e.message.to_s[0, 70]}")
    end
    begin
      RutaCampoSeguro.sanitizar!(battle2)
      Battle_Phase_EndOfRound.new(battle2).start_phase
      clima_ok = !GameData::BattleWeather.try_get(battle2.field.weather).nil?
      terreno_ok = !GameData::Terrain.try_get(battle2.field.terrain).nil?
      notar.call("F2 campo inválido tras el fin de ronda: #{battle2.field.weather.inspect}/#{battle2.field.terrain.inspect}") if !clima_ok || !terreno_ok
    rescue StandardError => e
      notar.call("F2 fin de ronda #{e.class}: #{e.message.to_s[0, 70]}")
    end
    f2 += 1
    GC.start if (f2 % 50_000).zero?
  end
  f2
end

# ── F3 · duelos completos aleatorios ────────────────────────────────────────
def fuzz_f3(rng, fallos)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  f3 = 0
  victorias = 0
  6_000.times do
    party_n = 1 + rng.rand(6)
    prop = [0.05, 0.09, 0.12, 0.2, 0.35][rng.rand(5)]
    golpe = [0.2, 0.33, 0.5, 0.9, 1.6][rng.rand(5)]
    falla = [nil, 3, 2][rng.rand(3)]
    battle, party, boss = fuzz_divine_battle(party_n, 1000)
    move = PokeBattle_Move.new(battle, :METEORMASH)
    idx = 0
    bajas = 0
    turno = 0
    gano = false
    mega = false
    mega_pool = false
    erro = nil
    begin
      60.times do |i|
        turno = i + 1
        battle.turnCount = turno
        battle.lastMoveUser = 0
        battle.lastMoveUsed = :METEORMASH
        if !falla || (turno % falla != 0)
          boss.damageState.hpLost = (boss.totalhp * prop).round
          boss.damageState.totalHPLost = boss.damageState.hpLost
          move.pbInflictHPDamage(boss)
        end
        if battle.instance_variable_get(:@arceus_capture_ready)
          gano = true
          break
        end
        if battle.instance_variable_get(:@ruta_arceus_mega_visto) && !mega_pool
          # El motor arma el pool de la fase en pbArceusPhase (línea 2561 del
          # guion): pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[indice]).
          # El sandbox no carga pbArceusPhase (escena y Species reales), así
          # que se replica aquí esa única llamada con los datos instalados.
          mega_pool = true
          battle.pbArceusSetMoves(boss, RUTA_ARCEUS_MOVE_SETS[5])
        end
        mega = true if battle.instance_variable_get(:@ruta_arceus_mega_visto)
        cur = party[idx]
        break if !cur
        if !cur.fainted?
          perdido = (cur.totalhp * golpe).round
          cur.damageState.hpLost = perdido
          cur.damageState.totalHPLost = perdido
          cur.damageState.substitute = false
          cur.damageState.endured = false
          hp_antes = cur.hp
          cap = (cur.totalhp * CAP).round
          cap = 1 if cap < 1
          battle.ruta_arceus_apply_ohko_guard(boss, cur)
          aplicado = cur.damageState.hpLost
          notar.call("F3 tope violado en duelo: aplicado=#{aplicado} cap=#{cap}") if hp_antes > cap && aplicado > cap
          cur.hp = hp_antes - aplicado
          if cur.fainted?
            bajas += 1
            idx += 1
          end
        end
        battle.pbArceusRedlineHeal(boss)
        break if idx >= party.length
      end
    rescue StandardError => e
      erro = e
      notar.call("F3 excepción #{e.class}: #{e.message.to_s[0, 90]}")
    end
    if !erro
      exigente = (party_n == 6 && prop >= 0.09 && falla != 2)
      if exigente
        notar.call("F3 duelo ganable perdido (#{turno} turnos, #{bajas} bajas, prop=#{prop})") if !gano
        notar.call("F3 demasiadas bajas: #{bajas}") if bajas > 4
      end
      if gano
        victorias += 1
        notar.call("F3 victoria sin megaevolución visible") if !mega
        ids = (boss.pokemon.moves || []).map { |m| m.id }
        notar.call("F3 última barra sin pool de mil brazos: #{ids.inspect}") if (ids & MIL_BRAZOS).empty?
      end
    end
    f3 += 1
    GC.start if (f3 % 1_000).zero?
  end
  [f3, victorias]
end

# ── F4 · barrido de fases del canon sobre campos sucios ─────────────────────
def fuzz_f4(rng, fallos)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  battle4, party4, boss4 = fuzz_divine_battle(2, 800)
  f4 = 0
  44_000.times do
    fase = 1 + rng.rand(6)
    battle4.field.weather = [5, :None, :Rain, nil, 0, :Fog][rng.rand(6)]
    battle4.field.terrain = [3, :None, :Misty, nil][rng.rand(4)]
    battle4.turnCount = 1 + rng.rand(40)
    begin
      CanonArceus.efecto_fase(battle4, boss4, fase)
      RutaCampoSeguro.sanitizar!(battle4)
      notar.call("F4 clima inválido tras la fase #{fase}: #{battle4.field.weather.inspect}") if GameData::BattleWeather.try_get(battle4.field.weather).nil?
      notar.call("F4 terreno inválido tras la fase #{fase}") if GameData::Terrain.try_get(battle4.field.terrain).nil?
      notar.call("F4 PS negativos del jefe") if boss4.hp < 0
    rescue StandardError => e
      notar.call("F4 excepción #{e.class}: #{e.message.to_s[0, 70]}")
    end
    f4 += 1
    GC.start if (f4 % 20_000).zero?
  end
  f4
end

"FAMILIAS LISTAS"
