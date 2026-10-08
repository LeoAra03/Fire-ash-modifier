# ============================================================================
# arceus_fuzz_scenarios.rb
#
# Un millón de escenarios deterministas (semilla fija) sobre el código REAL
# instalado de PokeMod_RutaDeDios + PokeMod_CanonArceus, ejecutados por
# tools/qa/arceus_fuzz_harness.mjs dentro de CRuby 3.3 (WebAssembly). Cada
# familia vive en su propio método: el arnés lanza un VM por familia porque el
# heap de WASM no tolera las cuatro tandas acumuladas en un solo eval.
#
#   F1 · 602 400 · micro-fuzz de la guardia anti-KO (tope variable 12%-33%).
#   F5 · ~200 000 · sistemas R12: mazos de diálogo sin repetición, ratio de
#                   daño variable, música por fase, invocaciones del lore que
#                   nunca rematan, bono de los juegos, merced del último
#                   Pokémon (cura total + PP, una vez) y copia del equipo.
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
  # En el motor los PS del battler y del Pokémon van sincronizados: la merced
  # de Arceus (pkmn.heal) y el recuento de "queda 1 en pie" lo exigen.
  def hp=(value)
    @hp = value
    @pokemon.hp = value if @pokemon
  end

  def initialize(index, side, species, totalhp)
    super(index, side)
    @pokemon = Pokemon.new(species, 100)
    @totalhp = totalhp
    @hp = totalhp
    @pokemon.hp = totalhp
    @pokemon.totalhp = totalhp
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
  especies_party = [:METAGROSS, :CHARIZARD, :PIKACHU, :MEW, :DIALGA, :PALKIA]
  golpes_party = [:METEORMASH, :EXTREMESPEED, :PSYCHIC, :AURASPHERE, :SHADOWFORCE, :VCREATE]
  party = (0...party_n).map do |i|
    mon = FuzzMon.new(0, 0, especies_party[i % especies_party.length], 400 + (i * 37) % 200)
    mon.pokemon.moves = [Pokemon::Move.new(golpes_party[i % golpes_party.length])]
    mon
  end
  boss.item = :LEGENDPLATE # el jefe divino real porta la Tabla Leyenda
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
  602_400.times do
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
  primigenias = 0
  3_000.times do
    party_n = 1 + rng.rand(6)
    prop = [0.05, 0.09, 0.12, 0.2, 0.35][rng.rand(5)]
    golpe = [0.2, 0.33, 0.5, 0.9, 1.6][rng.rand(5)]
    falla = [nil, 3, 2][rng.rand(3)]
    battle, party, boss = fuzz_divine_battle(party_n, 1000)
    battle.define_singleton_method(:pbRandom) { |x| x.to_i > 0 ? rng.rand(x) : 0 }
    battle.comando_script = lambda { |cmds| cmds && !cmds.empty? ? rng.rand(cmds.length) : 0 }
    move = PokeBattle_Move.new(battle, :METEORMASH)
    idx = 0
    bajas = 0
    turno = 0
    gano = false
    mega = false
    mega_pool = false
    copia = false
    prim = false
    erro = nil
    begin
      60.times do |i|
        turno = i + 1
        battle.turnCount = turno
        battle.lastMoveUser = 0
        battle.lastMoveUsed = :METEORMASH
        # R12: el turno divino (música por fase, apertura con sprites, merced
        # del último Pokémon, juegos e invocaciones) cuelga del cálculo de
        # prioridad, que en el motor corre cada ronda.
        battle.pbCalculatePriority
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
        if battle.instance_variable_get(:@arceus_phase).to_i >= 4 && !copia
          copia = true
          battle.ruta_arceus_copiar_equipo(boss)
          ids_copia = (boss.pokemon.moves || []).map { |m| m.id }
          permitidos = (party.flat_map { |pm| (pm.pokemon.moves || []).map { |m| m.id } } + [:JUDGMENT]).uniq
          notar.call("F3 copia de equipo con golpes ajenos: #{ids_copia.inspect}") if (ids_copia - permitidos).length > 0
          notar.call("F3 copia de equipo vacía") if ids_copia.empty?
        end
        mega = true if battle.instance_variable_get(:@ruta_arceus_mega_visto)
        prim = true if battle.instance_variable_get(:@ruta_arceus_primigenia_visto)
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
        # La Primigenia despierta dentro del umbral rojo de fin de turno: se
        # lee aquí, porque el turno siguiente puede cerrar con la captura.
        prim = true if battle.instance_variable_get(:@ruta_arceus_primigenia_visto)
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
        # R12: las invocaciones añaden presión constante (nunca rematan) y la
        # merced sólo llega con 5 bajas; el techo realista sube de 4 a 5.
        notar.call("F3 demasiadas bajas: #{bajas}") if bajas > 5
      end
      primigenias += 1 if prim
      if gano
        victorias += 1
        notar.call("F3 victoria sin música divina") if battle.bgm_log.to_a.empty?
        notar.call("F3 victoria sin megaevolución visible") if !mega
        ids = (boss.pokemon.moves || []).map { |m| m.id }
        if prim
          notar.call("F3 Forma Primigenia sin la Tabla soltada") if !boss.item.nil?
          notar.call("F3 Forma Primigenia sin pool primigenio: #{ids.inspect}") if (ids & RUTA_ARCEUS_PRIMIGENIA_MOVES).empty?
        else
          notar.call("F3 última barra sin pool de mil brazos: #{ids.inspect}") if (ids & MIL_BRAZOS).empty?
        end
      end
    end
    f3 += 1
    GC.start if (f3 % 300).zero?
  end
  [f3, victorias, primigenias]
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
      # R11: cada fase debe dejar SUS efectos visibles; un sub-efecto abortado
      # en silencio (rescue que se traga la mitad de la fase) ahora es un fallo.
      fx = battle4.field.effects
      case fase
      when 1
        notar.call("F4 fase 1 sin sello de mochila o Sala Mágica") if $game_switches[CanonArceus::SW_SELLO] != true || fx[:MagicRoom].to_i <= 0
      when 2
        notar.call("F4 fase 2 sin clima sembrado o sin Gravedad") if battle4.field.weather == :None || fx[:Gravity].to_i <= 0
      when 3
        notar.call("F4 fase 3 sin silencio de talentos") if party4[0].effects[:GastroAcid] != true || fx[:MagicRoom].to_i <= 0
        notar.call("F4 fase 3 sin velo de la suerte") if battle4.sides[1].effects[:LuckyChant].to_i <= 0
      when 4
        notar.call("F4 fase 4 sin salas invertidas") if fx[:TrickRoom].to_i <= 0 || fx[:WonderRoom].to_i <= 0
      when 5
        notar.call("F4 fase 5 sin tablilla puesta") if boss4.item.nil?
      when 6
        notar.call("F4 fase 6 sin cartel de los Mil Brazos") if !battle4.messages.any? { |m| m.to_s.include?("MIL BRAZOS") }
      end
    rescue StandardError => e
      notar.call("F4 excepción #{e.class}: #{e.message.to_s[0, 70]}")
    end
    f4 += 1
    GC.start if (f4 % 20_000).zero?
  end
  f4
end

# ── F5 · sistemas R12: mazos, ratio variable, música, invocaciones, juegos ──
def fuzz_f5(rng, fallos)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  f5 = 0

  # (a) Mazos de diálogo: ninguna línea se repite hasta agotar el mazo y el
  #     ciclo completo cubre todo el pool de la categoría.
  battle_a, _pa, _ba = fuzz_divine_battle(2, 1000)
  battle_a.define_singleton_method(:pbRandom) { |x| x.to_i > 0 ? rng.rand(x) : 0 }
  1_200.times do
    RUTA_ARCEUS_DIALOGOS.each_key do |cat|
      pool = RUTA_ARCEUS_DIALOGOS[cat]
      vistos = {}
      pool.length.times do
        linea = battle_a.ruta_arceus_dialogo(cat)
        f5 += 1
        notar.call("F5 mazo #{cat} sacó nil") if linea.nil?
        notar.call("F5 mazo #{cat} repitió antes de agotarse") if vistos[linea]
        vistos[linea] = true
      end
      notar.call("F5 mazo #{cat} no cubrió todo su pool") if vistos.length != pool.length
    end
    GC.start if (f5 % 40_000) < 60
  end

  # (b) Ratio divino variable: nunca fijo, nunca sobre un tercio, con piso
  #     más alto en fases tardías y en la Forma Mega.
  battle_b, _pb, _bb = fuzz_divine_battle(2, 1000)
  distintos = {}
  75_000.times do |i|
    fase = 1 + rng.rand(6)
    mega = (fase == 6 && rng.rand(2) == 1)
    prim = (mega && rng.rand(4) == 0)
    battle_b.turnCount = 1 + rng.rand(40)
    battle_b.lastMoveUser = rng.rand(2)
    battle_b.lastMoveUsed = [:METEORMASH, :JUDGMENT, :PSYCHIC][rng.rand(3)]
    battle_b.instance_variable_set(:@arceus_phase, fase)
    battle_b.instance_variable_set(:@ruta_arceus_mega_visto, mega)
    battle_b.instance_variable_set(:@ruta_arceus_primigenia_visto, prim)
    r = battle_b.ruta_arceus_divine_ratio
    f5 += 1
    notar.call("F5 ratio sobre el tercio: #{r}") if r > RUTA_ARCEUS_HIT_CAP_RATIO + 0.0001
    piso = fase >= 4 ? RUTA_ARCEUS_HIT_CAP_MIN_TARDIO : RUTA_ARCEUS_HIT_CAP_MIN
    piso += RUTA_ARCEUS_HIT_CAP_MEGA_EXTRA if mega
    notar.call("F5 ratio bajo su piso: #{r} < #{piso} (fase #{fase}, mega=#{mega})") if r < piso - 0.0001
    distintos[r.round(3)] = true
    GC.start if (i % 20_000).zero? && i > 0
  end
  notar.call("F5 el daño divino sería fijo: sólo #{distintos.length} ratios distintos") if distintos.length < 20

  # (c) Música por fase: pista correcta, idempotente y distinta entre fases.
  battle_c, _pc, _bc = fuzz_divine_battle(2, 1000)
  10_000.times do
    fase = 1 + rng.rand(6)
    prim = rng.rand(6) == 0
    battle_c.instance_variable_set(:@arceus_phase, fase)
    battle_c.instance_variable_set(:@ruta_arceus_primigenia_visto, prim)
    battle_c.instance_variable_set(:@ruta_arceus_bgm_actual, nil)
    battle_c.bgm_log = []
    battle_c.ruta_arceus_musica_fase(fase)
    battle_c.ruta_arceus_musica_fase(fase)
    f5 += 1
    notar.call("F5 fase #{fase} no estrenó música exactamente una vez") if battle_c.bgm_log.to_a.length != 1
    esperada = prim ? RUTA_ARCEUS_BGM_PRIMIGENIA : RUTA_ARCEUS_BGM_POR_FASE[fase]
    notar.call("F5 pista equivocada en fase #{fase}: #{battle_c.bgm_log.first}") if battle_c.bgm_log.first != esperada
  end
  todas = RUTA_ARCEUS_BGM_POR_FASE.values + [RUTA_ARCEUS_BGM_PRIMIGENIA]
  notar.call("F5 hay fases que comparten música") if todas.uniq.length != todas.length

  # (d) Invocaciones del lore: ninguna remata (mínimo 1 PS), climas válidos,
  #     stats nunca bajo -6, las mercedes curan y los golpes presionan.
  filas = RUTA_ARCEUS_INVOCACIONES
  200.times do
    filas.each_with_index do |fila, k|
      [1, 2, 150, 1000].each do |hp_inicial|
        battle_d, party_d, boss_d = fuzz_divine_battle(2, 1000)
        objetivo = party_d[0]
        objetivo.totalhp = 1000
        objetivo.hp = hp_inicial
        battle_d.instance_variable_set(:@arceus_phase, 2 + rng.rand(5))
        battle_d.turnCount = 10
        # pbRandom sin estado: devuelve k acotado al rango pedido. El diálogo de
        # invocación también baraja con pbRandom, así no puede desordenar la
        # cola; semilla=k (<30, pasa la puerta) y fila=lista[k] quedan fijas.
        kk = k % filas.length
        battle_d.define_singleton_method(:pbRandom) { |x| [kk, x.to_i > 0 ? x - 1 : 0].min }
        battle_d.ruta_arceus_invocar(boss_d)
        f5 += 1
        notar.call("F5 invocación #{fila[0]} remató al objetivo") if objetivo.hp < 1
        notar.call("F5 invocación #{fila[0]} dejó clima inválido") if GameData::BattleWeather.try_get(battle_d.field.weather).nil?
        objetivo.stages.each_value do |v|
          notar.call("F5 invocación #{fila[0]} dejó un stat bajo -6") if v.to_i < -6
        end
        if fila[2] == :merced
          notar.call("F5 invocación #{fila[0]} no curó") if objetivo.hp < hp_inicial
        end
        if fila[2] == :golpe && hp_inicial > 1
          notar.call("F5 invocación #{fila[0]} no presionó") if objetivo.hp >= hp_inicial
        end
      end
    end
    GC.start
  end

  # (e) Bono del Juicio Ciego: parte el tope en dos y se consume por acción.
  battle_e, party_e, boss_e = fuzz_divine_battle(2, 1000)
  30_000.times do |i|
    objetivo = party_e[0]
    total = 100 + rng.rand(900)
    objetivo.totalhp = total
    objetivo.hp = total
    objetivo.damageState.substitute = false
    battle_e.turnCount = i + 1
    battle_e.lastMoveUser = 1
    battle_e.lastMoveUsed = :JUDGMENT
    perdido = (total * 0.9).round
    objetivo.damageState.hpLost = perdido
    objetivo.damageState.totalHPLost = perdido
    battle_e.instance_variable_set(:@arceus_phase, 1 + rng.rand(6))
    con_bono = (i % 2 == 0)
    battle_e.instance_variable_set(:@ruta_juego_bono_acciones, con_bono ? 2 : 0)
    battle_e.instance_variable_set(:@ruta_juego_bono_key, nil)
    battle_e.ruta_arceus_apply_ohko_guard(boss_e, objetivo)
    f5 += 1
    techo = (total * RUTA_ARCEUS_HIT_CAP_RATIO).round
    techo = [(techo / 2.0).round, 1].max if con_bono
    notar.call("F5 bono roto: #{objetivo.damageState.hpLost} > #{techo}") if objetivo.damageState.hpLost > techo + 1
    if con_bono && battle_e.instance_variable_get(:@ruta_juego_bono_acciones) != 1
      notar.call("F5 el bono del juego no se consumió por acción")
    end
    GC.start if (i % 10_000).zero? && i > 0
  end

  # (f) Merced del último Pokémon: se ofrece una sola vez por batalla, cura
  #     vida + estado + PP de TODO el equipo si se acepta, y no cura si no.
  10_000.times do |i|
    battle_f, party_f, boss_f = fuzz_divine_battle(6, 1000)
    acepto = (i % 2 == 0)
    battle_f.comando_script = lambda { |_cmds| acepto ? 0 : 1 }
    battle_f.turnCount = 5
    party_f.each { |pm| (pm.pokemon.moves || []).each { |m| m.pp = 3 } }
    party_f[0, 5].each { |pm| pm.hp = 0 }
    party_f[5].hp = (party_f[5].totalhp / 2)
    battle_f.ruta_arceus_ofrenda(boss_f)
    f5 += 1
    notar.call("F5 la merced no se ofreció") if battle_f.comando_log.to_a.empty?
    notar.call("F5 la merced no quedó marcada") if battle_f.instance_variable_get(:@ruta_ofrenda_hecha) != true
    if acepto
      vivos = party_f.select { |pm| pm.pokemon.hp.to_i > 0 }
      notar.call("F5 merced aceptada dejó a alguien caído") if vivos.length != 6
      party_f.each do |pm|
        notar.call("F5 merced aceptada no curó del todo") if pm.pokemon.hp.to_i != pm.pokemon.totalhp.to_i
        (pm.pokemon.moves || []).each do |m|
          notar.call("F5 merced aceptada no restauró PP") if m.pp.to_i != m.total_pp.to_i
        end
      end
    else
      notar.call("F5 merced rechazada curó igual") if party_f[0].pokemon.hp.to_i != 0
    end
    antes = battle_f.comando_log.to_a.length
    battle_f.ruta_arceus_ofrenda(boss_f)
    notar.call("F5 la merced se ofreció dos veces") if battle_f.comando_log.to_a.length != antes
    GC.start if (i % 2_000).zero? && i > 0
  end

  # (g) Copia del equipo: sólo golpes que Ash enseñó (+Juicio), máximo 4,
  #     una sola vez por batalla.
  7_600.times do
    battle_g, party_g, boss_g = fuzz_divine_battle(1 + rng.rand(6), 1000)
    battle_g.instance_variable_set(:@arceus_phase, 4)
    battle_g.define_singleton_method(:pbRandom) { |x| x.to_i > 0 ? rng.rand(x) : 0 }
    battle_g.ruta_arceus_copiar_equipo(boss_g)
    ids = (boss_g.pokemon.moves || []).map { |m| m.id }
    f5 += 1
    permitidos = (party_g.flat_map { |pm| (pm.pokemon.moves || []).map { |m| m.id } } + [:JUDGMENT]).uniq
    notar.call("F5 copia con golpes ajenos: #{ids.inspect}") if (ids - permitidos).length > 0
    notar.call("F5 copia con más de cuatro golpes") if ids.length > 4
    notar.call("F5 copia vacía") if ids.empty?
    notar.call("F5 copia sin el Juicio") if !ids.include?(:JUDGMENT)
    battle_g.ruta_arceus_copiar_equipo(boss_g)
    ids2 = (boss_g.pokemon.moves || []).map { |m| m.id }
    notar.call("F5 la copia se hizo dos veces") if ids2 != ids
    GC.start if (f5 % 30_000) < 20
  end

  f5
end

"FAMILIAS LISTAS"
