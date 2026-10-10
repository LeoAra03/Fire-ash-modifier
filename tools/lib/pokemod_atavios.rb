# PokeMod_Atavios — atavios de Ash por dimensión y vestidor de la casa.
# Instalado por tools/apply_outfits_dimensiones.mjs como sección PokeMod_Atavios.
# Regla de oro: contenido nuevo; no modifica datos originales (solo añade hook de mapa y
# cambia el charset del jugador, como hace el propio juego con pbChangePlayer).
#
# Modo automático (modo = 0): al entrar a un mapa de una dimensión, Ash se pone el
# atavio de esa dimensión; al salir, vuelve al clásico. El disfraz Rocket nunca se pisa.
# Modo fijo (modo = 1): el atavio elegido en el armario no cambia solo.

module PokeModAtavios
  VAR_ATAVIO = 316
  VAR_MODO = 317

  ATA = {
    0 => { "c" => "trchar000", "p" => 0 },
    1 => { "c" => "ash_outfit_atlas", "p" => nil },
    2 => { "c" => "ash_outfit_creep", "p" => nil },
    3 => { "c" => "ash_outfit_glazed", "p" => nil },
    4 => { "c" => "ash_outfit_lp", "p" => nil },
    5 => { "c" => "ash_outfit_lc", "p" => nil },
    6 => { "c" => "ash_outfit_tfoh", "p" => nil },
    7 => { "c" => "trchar001", "p" => 1 },
    8 => { "c" => "trainer_TEAMROCKET_M", "p" => 3 },
  }

  DIM = {
    1 => [[1021, 2020], [2191, 2191], [2195, 2196], [2230, 2230], [2250, 2257]],
    2 => [[2023, 2029], [2058, 2190], [2192, 2194]],
    3 => [[2200, 2201], [3000, 3110]],
    4 => [[2210, 2211], [3120, 3138]],
    5 => [[2240, 2241], [3200, 3631]],
    6 => [[2231, 2231], [2242, 2245], [3700, 3944]],
  }

  EXC = [[2220, 2221], [2281, 2281]]

  def self.enRango?(mapa, rangos)
    return false if mapa.nil?
    rangos.each { |r| return true if mapa >= r[0] && mapa <= r[1] }
    false
  end

  def self.atavioDe(mapa)
    return nil if enRango?(mapa, EXC)
    DIM.each { |id, rangos| return id if enRango?(mapa, rangos) }
    nil
  end

  def self.identidadBase
    if $Trainer && $Trainer.character_ID != 0
      pbChangePlayer(0) rescue nil
      true
    else
      false
    end
  end

  def self.poner(id, fijo = false)
    a = ATA[id]
    return false if a.nil?
    if a["p"]
      pbChangePlayer(a["p"]) if $Trainer rescue nil
    else
      identidadBase
      $game_player.character_name = a["c"] if $game_player
    end
    if $game_variables
      $game_variables[VAR_ATAVIO] = id
      $game_variables[VAR_MODO] = fijo ? 1 : 0
    end
    true
  end

  def self.modo(v)
    $game_variables[VAR_MODO] = (v ? 1 : 0) if $game_variables
  end

  def self.vestirCharset(id)
    a = ATA[id]
    return false if a.nil? || a["p"]
    identidadBase
    $game_player.character_name = a["c"] if $game_player
    $game_variables[VAR_ATAVIO] = id if $game_variables
    true
  end

  # Reevalúa el atavio para el mapa actual (usado por el armario y por el hook).
  def self.revisar(mapa = nil)
    return true if $game_variables && $game_variables[VAR_MODO] == 1
    return true if $Trainer && $Trainer.character_ID == 3  # disfraz Rocket activo
    mapa = $game_map.map_id if mapa.nil? && $game_map
    objetivo = atavioDe(mapa)
    if objetivo
      return true if $game_variables && $game_variables[VAR_ATAVIO] == objetivo
      return vestirCharset(objetivo)
    end
    # fuera de dimensión: clásico
    return true if $game_variables && $game_variables[VAR_ATAVIO] == 0
    if $Trainer && $Trainer.character_ID != 0
      identidadBase
    elsif $game_player
      $game_player.character_name = ATA[0]["c"]
    end
    $game_variables[VAR_ATAVIO] = 0 if $game_variables
    true
  end

  def self.alEntrar(mapa)
    revisar(mapa) rescue nil
  end
end

class Game_Map
  unless method_defined?(:pokemod_atavios_setup)
    alias pokemod_atavios_setup setup
    def setup(map_id)
      pokemod_atavios_setup(map_id)
      PokeModAtavios.alEntrar(map_id) rescue nil
    end
  end
end
