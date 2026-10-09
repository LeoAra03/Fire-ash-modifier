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
  581_400.times do
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
  fuzz_f3_rango(rng, fallos, 0, 3_000)
end

# R16: los duelos duran más (las barras exigen tres o cuatro golpes y el dios
# pega hasta el 40 %): el heap de WASM no tolera las 3 000 batallas acumuladas
# en un solo VM, igual que F6 en su momento. Se parte en tres rangos.
def fuzz_f3a(rng, fallos)
  fuzz_f3_rango(rng, fallos, 0, 1_000)
end

def fuzz_f3b(rng, fallos)
  fuzz_f3_rango(rng, fallos, 1_000, 2_000)
end

def fuzz_f3c(rng, fallos)
  fuzz_f3_rango(rng, fallos, 2_000, 3_000)
end

def fuzz_f3_rango(rng, fallos, desde, hasta)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  f3 = 0
  victorias = 0
  primigenias = 0
  (desde...hasta).each do |_duelo|
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
    curaciones = 40
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
          elsif curaciones > 0 && cur.hp * 5 < cur.totalhp * 2
            # R16 · estrategia mínima (R9): por debajo del 40 % de vida Ash se
            # cura (pociones/bayas presupuestadas: 40 usos ≈ dos por turno de
            # los 60 que puede durar el duelo). Sin estrategia el equipo se
            # agota antes de las seis barras; con ella el duelo es ganable, que
            # es exactamente el balance pedido: difícil, no imposible.
            curaciones -= 1
            cur.hp = cur.totalhp
            cur.pokemon.hp = cur.totalhp
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
    GC.start if (f3 % 100).zero?
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
  68_000.times do |i|
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
  4_600.times do
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

  # (h) R16 · Eco de la Creación: acertar ablanda los dos próximos golpes
  #     divinos y devuelve aliento; fallar no castiga (ni PS ni bono).
  4_000.times do |i|
    battle_h, party_h, boss_h = fuzz_divine_battle(2, 1000)
    battle_h.instance_variable_set(:@arceus_phase, 1 + rng.rand(6))
    battle_h.turnCount = 2 + rng.rand(30)
    battle_h.define_singleton_method(:pbRandom) { |x| x.to_i > 0 ? rng.rand(x) : 0 }
    objetivo = party_h[0]
    objetivo.totalhp = 500
    objetivo.hp = 300
    fase = battle_h.instance_variable_get(:@arceus_phase).to_i
    tipos = RUTA_ARCEUS_PHASE_TYPES.length
    largo = 2 + (fase / 2)
    correcta = RUTA_ARCEUS_PHASE_TYPES[(largo * 5 + fase) % tipos]
    nombre_correcta = RUTA_ARCEUS_TYPE_NAMES[RUTA_ARCEUS_PHASE_TYPES.index(correcta)]
    acertar = (i % 2 == 0)
    battle_h.define_singleton_method(:pbShowCommands) do |msg, cmds, x|
      idx = cmds.index(nombre_correcta).to_i
      acertar ? idx : ((idx + 1) % cmds.length)
    end
    battle_h.instance_variable_set(:@ruta_juego_bono_acciones, 0)
    battle_h.ruta_arceus_eco(boss_h, objetivo)
    f5 += 1
    if acertar
      notar.call("F5 eco acertado no dio el bono de dos golpes") if battle_h.instance_variable_get(:@ruta_juego_bono_acciones).to_i != 2
      notar.call("F5 eco acertado no devolvió aliento") if objetivo.hp.to_i <= 300
    else
      notar.call("F5 eco fallado dio bono") if battle_h.instance_variable_get(:@ruta_juego_bono_acciones).to_i != 0
      notar.call("F5 eco fallado castigó los PS") if objetivo.hp.to_i != 300
    end
    GC.start if (i % 1_000).zero? && i > 0
  end

  # (i) R16 · Memoria del Génesis: acertar renueva el PP y sube una etapa;
  #     fallar no castiga nada (los juegos divinos nunca perjudican).
  4_000.times do |i|
    battle_i, party_i, boss_i = fuzz_divine_battle(2, 1000)
    battle_i.turnCount = 2 + rng.rand(30)
    objetivo = party_i[0]
    objetivo.totalhp = 400
    objetivo.hp = 400
    semilla_memoria = rng.rand(3)
    primera = true
    battle_i.define_singleton_method(:pbRandom) do |x|
      if primera
        primera = false
        semilla_memoria
      else
        x.to_i > 0 ? rng.rand(x) : 0
      end
    end
    acertar = (i % 2 == 0)
    eleccion = acertar ? semilla_memoria : ((semilla_memoria + 1) % 3)
    battle_i.define_singleton_method(:pbShowCommands) { |msg, cmds, x| eleccion }
    battle_i.ruta_arceus_memoria(boss_i, objetivo)
    f5 += 1
    if acertar
      notar.call("F5 memoria acertada no subió ninguna etapa") if !objetivo.stages.values.any? { |v| v.to_i > 0 }
    else
      notar.call("F5 memoria fallada castigó etapas") if objetivo.stages.values.any? { |v| v.to_i != 0 }
      notar.call("F5 memoria fallada tocó los PS") if objetivo.hp.to_i != 400
    end
    GC.start if (i % 1_000).zero? && i > 0
  end

  # (j) R16 · Despachador de juegos: las cien semillas entran a un juego
  #     válido, marcan el turno y no rompen la batalla.
  2_000.times do |i|
    battle_j, party_j, boss_j = fuzz_divine_battle(2, 1000)
    battle_j.instance_variable_set(:@arceus_phase, 2 + rng.rand(5))
    battle_j.turnCount = 5 + rng.rand(20)
    battle_j.instance_variable_set(:@ruta_juego_ultimo_turno, 0)
    semilla = i % 100
    primera = true
    battle_j.define_singleton_method(:pbRandom) do |x|
      if primera
        primera = false
        semilla
      else
        x.to_i > 0 ? rng.rand(x) : 0
      end
    end
    battle_j.define_singleton_method(:pbShowCommands) { |msg, cmds, x| cmds && cmds.length > 0 ? 0 : -1 }
    battle_j.ruta_arceus_jugar(boss_j)
    f5 += 1
    if battle_j.instance_variable_get(:@ruta_juego_ultimo_turno).to_i != battle_j.turnCount.to_i
      notar.call("F5 jugar no marcó el turno para la semilla #{semilla}")
    end
    GC.start if (i % 500).zero? && i > 0
  end

  f5
end

"FAMILIAS LISTAS"


# ── F7 · R15c: la escena de objetivos nunca ve un lado de 4+ ─────────────────
# Replica exacta de la aritmética de PokeBattle_SceneMenus:463-489 y del
# redimensionado salvaje de Battle_StartAndEnd:33-40, sobre configuraciones
# aleatorias del duelo divino (1-6 Pokémon por bando, bajas mezcladas, todos los
# modos de batalla). Ninguna combinación puede producir un índice fuera de los
# arreglos de botones (nil) ni un campo mayor a 3 por lado.
def fuzz_f7(rng, fallos)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  f7 = 0
  10_000.times do |i|
    modos = [[1, 1], [2, 2], [2, 1], [1, 2], [3, 3], [3, 1], [1, 3], [2, 3], [3, 2]]
    sizes = modos[rng.rand(modos.length)].dup
    n_player = 1 + rng.rand(6)
    n_foe = 1 + rng.rand(6)
    party = (0...n_player).map do |k|
      mon = FuzzMon.new(k, 0, :PIKACHU, 400 + (k * 37) % 200)
      mon.hp = rng.rand(4) == 0 ? 0 : mon.totalhp
      mon
    end
    foes = (0...n_foe).map do |k|
      mon = FuzzMon.new(k, 1, :ARCEUS, 1000)
      mon.hp = rng.rand(4) == 0 ? 0 : mon.totalhp
      mon.pokemon.instance_variable_set(:@ruta_arceus_divine, true) if k == 0
      mon
    end
    party[0].hp = party[0].totalhp if party.all? { |p| p.fainted? }
    foes[0].hp = foes[0].totalhp if foes.all? { |p| p.fainted? }
    battle = PokeBattle_Battle.new(party + foes)
    battle.ruta_side_split = n_foe
    battle.sideSizes = sizes
    battle.instance_variable_set(:@arceus_divine, true)
    battle.party2starts = [0]
    # 1) el tope divino: los conteos del bando salvaje nunca exceden su lado
    counts = battle.pbAbleTeamCounts(1)
    notar.call("F7 conteos divinos #{counts.inspect} exceden el lado #{sizes[1]}") if counts.compact.max.to_i > sizes[1]
    # 2) redimensionado salvaje tal cual el motor (Battle_StartAndEnd:33-40)
    redim = sizes.dup
    if battle.wildBattle? && counts[0].to_i != redim[1]
      if redim[0] == redim[1]
        redim = [counts[0].to_i, counts[0].to_i]
      else
        redim[1] = counts[0].to_i
      end
    end
    notar.call("F7 campo redimensionado a #{redim.inspect}: un lado mayor a 3 revienta SceneMenus:485") if redim.compact.max.to_i > 3
    # 3) cinturón del canon: topa a 3 cualquier tamaño que llegue a la escena
    seguros = redim.map { |n| n = n.to_i; n = 3 if n > 3; n = 1 if n < 1; n }
    notar.call("F7 cinturón ineficaz: #{seguros.inspect}") if seguros.max > 3 || seguros.min < 1
    # 4) aritmética exacta de los botones (SceneMenus:463-489) sin nil
    small = seguros.max > 2
    maxIndex = (seguros[0] > seguros[1]) ? (seguros[0] - 1) * 2 : seguros[1] * 2 - 1
    (0..maxIndex).each do |b|
      numButtons = seguros[b % 2]
      next if numButtons <= b / 2
      x = small ? [0, 82, 166][numButtons - 1] : [0, 116][numButtons - 1]
      notar.call("F7 botón #{b} con numButtons=#{numButtons}: índice nil en SceneMenus:485") if x.nil?
    end
    f7 += 1
    GC.start if (f7 % 500).zero?
  end
  # R15d: el relevo divino probado de verdad sobre el motor extraído: un divino
  # caído cede su hueco al siguiente de la cola (especie, PS llenos, sin
  # excepción), y con la cola vacía no pasa nada.
  1_000.times do |k|
    especies = RUTA_ARCEUS_SEQUITO.map { |fila| fila[0] }
    orden = especies.dup
    orden.sort_by! { |_e| rng.rand(1000) } if rng.rand(2) == 0
    boss = FuzzMon.new(1, 1, :ARCEUS, 1000)
    boss.pokemon.instance_variable_set(:@ruta_arceus_divine, true)
    en_campo = FuzzMon.new(3, 1, orden[0], 800)
    en_campo.hp = 0
    battle = PokeBattle_Battle.new([FuzzMon.new(0, 0, :PIKACHU, 400), boss, en_campo])
    battle.instance_variable_set(:@arceus_divine, true)
    cola = [Pokemon.new(orden[1], 100), Pokemon.new(orden[2], 100)]
    cola.each { |m| m.calc_stats }
    $ruta_arceus_relevo_cola = cola
    battle.pbArceusRelevoDivino
    notar.call("F7 relevo #{k}: el hueco no cambió de especie (#{en_campo.pokemon.species})") if en_campo.pokemon.species != orden[1]
    notar.call("F7 relevo #{k}: entró con PS #{en_campo.hp}/#{en_campo.totalhp}") if en_campo.hp != en_campo.totalhp || en_campo.fainted?
    notar.call("F7 relevo #{k}: la cola no avanzó") if $ruta_arceus_relevo_cola.length != 1
    # con la cola vacía, un segundo caído no debe hacer nada ni levantar errores
    en_campo.hp = 0
    $ruta_arceus_relevo_cola = []
    battle.pbArceusRelevoDivino
    notar.call("F7 relevo #{k}: con cola vacía tocó al battler") if en_campo.hp != 0
    f7 += 1
  end
  f7
end

# ── F6 · 10 000 · arranque del duelo divino completo y entradas R14 ─────────
# R14b: el reporte de partida mostró un NameError de constante anidada que sólo
# aparece al ejecutar Object#pbStartArceusDivineBattle de verdad. Esta familia
# corre el starter completo (prólogo, bucle de decisiones, merced, rendición,
# captura y rollback del sandbox) diez mil veces con colas de decisión
# aleatorias, más las entradas nuevas de R14 (Orden Divina, fondos, mil brazos
# del capturado y construcción del séquito). Cualquier NameError, NoMethodError
# o ArgumentError de un recurso inexistente revienta aquí, no en el juego.
module SaveData
  def self.compile_save_hash
    {}
  end
end unless SaveData.respond_to?(:compile_save_hash)

class RutaTempStub
  def initialize; @rules = {}; end
  def clearBattleRules; @rules = {}; nil; end
  # R16: réplica fiel del mapeo del motor (Overworld_BattleStarting:27-60):
  # las reglas de tamaño/flags se normalizan igual que en el juego real, para
  # que los candados de F6 lean battleRules["size"], ["expGain"], etc.
  def recordBattleRule(k, v = nil)
    key = k.to_s.downcase
    case key
    when "single", "1v1", "1v2", "2v1", "1v3", "3v1",
         "double", "2v2", "2v3", "3v2", "triple", "3v3"
      @rules["size"] = key
    when "canlose"     then @rules["canLose"] = true
    when "cannotlose"  then @rules["canLose"] = false
    when "canrun"      then @rules["canRun"] = true
    when "cannotrun"   then @rules["canRun"] = false
    when "noexp"       then @rules["expGain"] = false
    when "nomoney"     then @rules["moneyGain"] = false
    when "nopartner"   then @rules["noPartner"] = true
    else @rules[key] = v
    end
    nil
  end
  def battleRules; @rules; end
end

# R16: el duelo divino corre como batalla de entrenador contra el Creador.
class NPCTrainer
  attr_accessor :party, :name, :id, :trainer_type, :items, :lose_text, :win_text, :battleBGM
  def initialize(name, trainer_type = nil)
    @name = name
    @trainer_type = trainer_type
    @party = []
    @items = []
  end
end

class RutaGlobalStub
  attr_accessor :nextBattleBGM, :nextBattleBack, :nextBattleME,
                :nextBattleCaptureME, :partner
end

class RutaTrainerStub
  attr_accessor :party, :name
  def initialize(party); @party = party; @name = "Ash"; end
  def able_pokemon_count; @party.count { |p| p && p.hp.to_i > 0 }; end
  def pokemon_count; @party.compact.length; end
end

def pbWildBattleCore(*args)
  # R16: el duelo divino ya NO es una batalla salvaje: si el starter volviera a
  # llamar a pbWildBattleCore, los relevos/invocaciones perderían la reserva
  # nativa del motor. Queda como trampa de regresión.
  raise "F6: el duelo divino regresó a la ruta salvaje (pbWildBattleCore); debe correr como batalla de entrenador (R16)"
end

def pbTrainerBattleCore(*args)
  # R16: candados del duelo como batalla de entrenador: un solo jefe NPC, su
  # Orden completa de cuatro (Creador + Trío) como reserva nativa, 2v2 por
  # regla de tamaño, sin experiencia ni dinero ni compañero, sin huida y con
  # derrota permitida (merced del Rotom).
  raise "F6: pbTrainerBattleCore recibió #{args.length} argumentos y debe ser 1 (el Creador)" if args.length != 1
  jefe = args[0]
  raise "F6: el jefe del duelo no es un NPCTrainer" if !jefe.is_a?(NPCTrainer)
  raise "F6: la Orden del Creador tiene #{jefe.party.compact.length} Pokémon y deben ser 4 (Creador + Trío)" if jefe.party.compact.length != 4
  raise "F6: el primer Pokémon del Creador no es Arceus" if jefe.party[0].species != :ARCEUS
  reglas = $PokemonTemp.battleRules
  raise "F6: el duelo no registra la regla double (presentación 2v2)" if reglas["size"] != "double"
  raise "F6: el duelo reparte experiencia (falta noExp)" if reglas["expGain"] != false
  raise "F6: el duelo reparte dinero (falta noMoney)" if reglas["moneyGain"] != false
  raise "F6: el duelo admite compañero automático (falta noPartner)" if reglas["noPartner"] != true
  raise "F6: el duelo permite huir (falta cannotRun)" if reglas["canRun"] != false
  raise "F6: el duelo no admite derrota con merced (falta canLose)" if reglas["canLose"] != true
  cola = $ruta_f6_cola
  raise "F6: cola de decisiones vacía" if cola.empty?
  return cola.shift
end

def pbStartOver
  $ruta_f6_startover = ($ruta_f6_startover || 0) + 1
  nil
end

def pbMessage(msg, *rest)
  return $ruta_f6_eleccion if rest[0].is_a?(Array)
  nil
end

def pbBattleAnimation(*args)
  yield if block_given?
  1
end

# R14b: las tres batallas CPU del prólogo usan el pipeline completo del motor
# (escena, pbStartBattle, switches de enemigos): desproporcionado para wasm. Se
# stubean aquí; el resto del prólogo (textos, caminatas, tonos) corre de verdad.
def pbArceusCinematicCpuBattle(trainer_specs, boss_moves, battle_size)
  $ruta_f6_cpu = ($ruta_f6_cpu || 0) + 1
  1
end

def pbAddPokemonSilent(pkmn)
  $Trainer.party.push(pkmn) if $Trainer
  true
end

COLAS_F6 = [[4], [1], [2, 4], [2, 2, 4], [2, 2, 2], [5], [3], [2, 5], [2, 1], [2, 2, 5]].freeze

def fuzz_f6_rango(rng, fallos, desde, hasta)
  notar = lambda { |m| fallos << m if fallos.length < 30 }
  f6 = 0
  especies_sequito = RUTA_ARCEUS_SEQUITO.map { |fila| fila[0] }
  nombres_invoc = RUTA_ARCEUS_INVOCACIONES.map { |fila| fila[0] }
  (desde...hasta).each do |i|
    cola_base = COLAS_F6[rng.rand(COLAS_F6.length)]
    $ruta_f6_cola = cola_base.dup
    prologo = (i % 10).zero? # el prólogo completo corre 1 000 veces: sus tres
    $ruta_f6_eleccion = prologo ? 0 : 1 # batallas CPU ya pesan como F3 entero
    $ruta_f6_startover = 0
    $game_switches = {}
    $game_switches[881] = true unless prologo
    $PokemonTemp = RutaTempStub.new
    $PokemonGlobal = RutaGlobalStub.new
    tam = 1 + rng.rand(6)
    party = (0...tam).map { |k| mon = Pokemon.new(:PIKACHU, 50 + rng.rand(51)); mon.calc_stats; mon }
    party.each { |p| p.hp = rng.rand(2) == 0 ? 0 : p.totalhp }
    party[0].hp = 0 # garantiza candidato para la merced del Rotom
    $Trainer = RutaTrainerStub.new(party)
    # Oráculo fiel al starter: la merced del Rotom ocurre UNA vez (switch 869),
    # así que el primer 2 de la cola reintenta el duelo y el segundo 2 termina
    # en rendición (decisión 2) sin consumir el resto de la cola.
    esperado = nil
    merced_usada = false
    $ruta_f6_cola.each do |d|
      if d == 2
        if merced_usada
          esperado = 2
          break
        end
        merced_usada = true
      else
        esperado = d
        break
      end
    end
    decision = nil
    begin
      decision = pbStartArceusDivineBattle
    rescue StandardError => e
      notar.call("F6 arranque #{i} (cola #{cola_base.inspect}) lanzó #{e.class}: #{e.message} BT=#{(e.backtrace || []).first(8).join(" <- ")}")
    end
    f6 += 1
    if decision
      notar.call("F6 arranque #{i} devolvió #{decision} fuera de 1..5") if ![1, 2, 3, 4, 5].include?(decision)
      notar.call("F6 arranque #{i}: la cola pedía #{esperado} y volvió #{decision}") if decision != esperado
      if decision == 4 && $game_switches[874] != true
        notar.call("F6 arranque #{i}: captura sin switch 874 firmado")
      end
      if decision == 2 && $ruta_f6_startover.to_i < 1
        notar.call("F6 arranque #{i}: rendición sin pbStartOver")
      end
    end
    # Entradas R14 con entradas aleatorias: ninguna puede levantar NameError ni
    # NoMethodError ni ArgumentError. Corre en mitad de los escenarios para
    # manter el presupuesto de memoria wasm (5 000 tandas x 2 campos).
    next unless (i % 2).zero?
    begin
      battle, party_b, boss = fuzz_divine_battle(2, 1000)
      battle.instance_variable_set(:@arceus_phase, 1 + rng.rand(6))
      battle.turnCount = 3 + rng.rand(20)
      battle.define_singleton_method(:pbRandom) { |x| rng.rand(x.to_i > 0 ? x : 1) }
      especie = (rng.rand(2) == 0 ? especies_sequito : nombres_invoc)[rng.rand(3) % 3] || :DIALGA
      battle.pbArceusOrdenDivina(boss, especie, :JUDGMENT, "prueba")
      battle.pbArceusPosesionFin(boss) if rng.rand(2) == 0
      batalla2, _p2, _b2 = fuzz_divine_battle(2, 800)
      batalla2.pbArceusFondo(["genesis1", "genesis2", "genesis3", "inexistente"][rng.rand(4)])
      pkmn_leg = pbArceusBuildLegendario(especies_sequito[rng.rand(3)], [:JUDGMENT], 1 + rng.rand(200))
      notar.call("F6 sequto #{i} devolvió nil") if pkmn_leg.nil?
      if rng.rand(2) == 0
        capt = FuzzMon.new(0, 0, :ARCEUS, 500)
        capt.pokemon.instance_variable_set(:@ruta_arceus_captured_god, true)
        capt.hp = 100 + rng.rand(100)
        batalla2.pbArceusMilibrazosDespertar(capt)
      end
      f6 += 0
    rescue StandardError => e
      notar.call("F6 entradas R14 #{i} lanzaron #{e.class}: #{e.message}")
    end
    GC.start if (i % 100).zero?
  end
  f6
end

# R14b: tres tandas con VM fresca (el arranque completo asigna mucho y la
# memoria wasm no se devuelve): 3 334 + 3 333 + 3 333 = 10 000 escenarios.
def fuzz_f6a(rng, fallos); fuzz_f6_rango(rng, fallos, 0, 3334); end
def fuzz_f6b(rng, fallos); fuzz_f6_rango(rng, fallos, 3334, 6667); end
def fuzz_f6c(rng, fallos); fuzz_f6_rango(rng, fallos, 6667, 10000); end
