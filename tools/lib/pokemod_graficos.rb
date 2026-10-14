# PokeMod_Graficos — el juego no se cae (ni se queda a negro) por un gráfico.
# Inyectado por tools/apply_graficos_safety.mjs en Scripts.rxdata.
#
# Problemas reales que arregla este parche:
#
#  1) TILESET VACÍO = CRASH.
#     `Game_Map#updateTileset` hace:
#         tileset = $data_tilesets[@map.tileset_id]
#         @tileset_name = tileset.tileset_name
#     Si el mapa apunta a un slot de Tilesets.rxdata SIN nombre (o inexistente),
#     `tileset` es nil y el juego revienta al entrar al mapa. En este repositorio
#     pasaba con el mapa 51 «Dungeon» (tileset 7), al que se llega desde el evento
#     13 de «Rock Cave»: crash garantizado. Aquí se sustituye el slot roto por un
#     tileset válido antes de montar el mapa (el de un mapa hermano si se puede).
#
#  2) NOMBRE DE ARCHIVO CON MAYÚSCULAS DISTINTAS.
#     Windows no distingue mayúsculas pero Android (APK/Kirin) sí: un mapa con
#     «Poke Centre interior» y un archivo «Poke Centre interior.PNG» funciona en
#     el PC y sale NEGRO en el móvil. Aquí se busca el archivo real sin distinguir
#     mayúsculas antes de rendirse.
#
#  3) GRÁFICO QUE FALTA.
#     Un sprite, tileset o autotile inexistente no debe tirar la partida. Se dibuja
#     en blanco y queda anotado en `$pokemod_graficos_faltantes` (el editor y
#     `tools/qa/fire_ash_health.mjs` muestran esa misma lista).
module PokeModGraficos
  @faltantes   = {}   # ruta sin extensión => veces que se pidió
  @resueltos   = {}   # [carpeta, nombre] => nombre real (o nil si no existe)

  class << self
    attr_reader :faltantes

    # Nombre real del archivo (con la caja correcta) o nil si no existe.
    def buscar(folder_name, filename)
      return nil if !filename || filename == ""
      clave = [folder_name, filename]
      return @resueltos[clave] if @resueltos.key?(clave)
      ruta = folder_name + filename
      hallado = (pbResolveBitmap(ruta) rescue nil)
      hallado = buscarPorCaja(folder_name, filename) if !hallado
      if hallado
        base = File.basename(hallado.to_s)
        base = base.sub(/\.[^.\/\\]+\z/, "")
        @resueltos[clave] = base
      else
        @faltantes[ruta] = (@faltantes[ruta] || 0) + 1
        @resueltos[clave] = nil
      end
      return @resueltos[clave]
    end

    # Busca el mismo nombre ignorando mayúsculas, dentro de la carpeta.
    def buscarPorCaja(folder_name, filename)
      carpeta = folder_name.sub(/\/\z/, "")
      return nil if !File.directory?(carpeta)
      objetivo = filename.downcase
      begin
        Dir.entries(carpeta).each do |f|
          next if f == "." || f == ".."
          base = f.sub(/\.[^.\/\\]+\z/, "")
          next if base == f && !File.directory?(File.join(carpeta, f))
          next if base.downcase != objetivo
          return File.join(carpeta, base)
        end
      rescue StandardError
        return nil
      end
      return nil
    end

    # Sustituye el tileset roto del mapa por uno válido antes de montarlo.
    def arreglarTilesetDelMapa(map_id)
      return false if !$data_tilesets || !$data_maps
      mapa = $data_maps[map_id]
      return false if !mapa
      id = mapa.tileset_id.to_i
      actual = ($data_tilesets[id] rescue nil)
      return false if actual && actual.tileset_name && actual.tileset_name != ""
      reserva = tilesetDeReserva(id)
      return false if !reserva
      $data_tilesets[id] = $data_tilesets[reserva]
      ($pokemod_tilesets_rotos ||= []) << [map_id, id, reserva]
      return true
    end

    # Busca un tileset que sirva: primero el del mapa padre, luego el más usado.
    def tilesetDeReserva(idRoto)
      candidatos = []
      info = (pbLoadMapInfos[$game_map.map_id] rescue nil)
      padre = (info.parent_id rescue 0).to_i
      if padre > 0
        mpadre = ($data_maps[padre] rescue nil)
        candidatos << mpadre.tileset_id.to_i if mpadre
      end
      candidatos.concat(tilesetsMasUsados)
      candidatos.uniq.each do |c|
        next if c == idRoto
        t = ($data_tilesets[c] rescue nil)
        return c if t && t.tileset_name && t.tileset_name != ""
      end
      return nil
    end

    def tilesetsMasUsados
      conteo = Hash.new(0)
      ($data_maps || []).each do |m|
        next if !m
        conteo[m.tileset_id.to_i] += 1
      end
      return conteo.sort_by { |_k, v| -v }.map { |k, _v| k }
    end
  end
end

# ── 1. Ningún mapa se monta con un tileset roto ─────────────────────────────
class Game_Map
  if method_defined?(:setup) && !method_defined?(:pokemod_orig_setup)
    alias pokemod_orig_setup setup
  end

  def setup(map_id)
    PokeModGraficos.arreglarTilesetDelMapa(map_id) rescue nil
    return pokemod_orig_setup(map_id)
  end
end

# ── 2 y 3. Todo gráfico pasa por la carpeta correcta y nunca revienta ───────
module RPG
  module Cache
    class << self
      if method_defined?(:load_bitmap) && !method_defined?(:pokemod_orig_load_bitmap)
        alias pokemod_orig_load_bitmap load_bitmap
      end

      # Devuelve el nombre ya corregido; si el archivo no existe, "" (el motor
      # propio de Essentials devuelve un mapa de bits en blanco de 32×32).
      def load_bitmap(folder_name, filename, hue = 0)
        real = (PokeModGraficos.buscar(folder_name, filename) rescue nil)
        return pokemod_orig_load_bitmap(folder_name, real || "", hue)
      end
    end
  end
end

# Herramientas heredadas que reciben el nombre a mano: mismas garantías.
if defined?(pbGetTileset) && !defined?(pokemod_orig_pbGetTileset)
  alias pokemod_orig_pbGetTileset pbGetTileset
  alias pokemod_orig_pbGetAutotile pbGetAutotile

  def pbGetTileset(name, hue = 0)
    return pokemod_orig_pbGetTileset("", hue) if !name || name == ""
    return pokemod_orig_pbGetTileset(name, hue)
  rescue StandardError
    return BitmapWrapper.new(32, 32)
  end

  def pbGetAutotile(name, hue = 0)
    return pokemod_orig_pbGetAutotile("", hue) if !name || name == ""
    return pokemod_orig_pbGetAutotile(name, hue)
  rescue StandardError
    return BitmapWrapper.new(32, 32)
  end
end

# ── 4. Prevención universal de softlocks (posicionamiento seguro del jugador) ──
module PokeModSoftlock
  class << self
    def transitable?(map, x, y, player)
      return false if !map || !map.valid?(x, y)
      [2, 4, 6, 8].each do |d|
        return true if map.playerPassable?(x, y, d, player)
      end
      return map.passable?(x, y, 0, player)
    end

    def celdaJugable?(map, x, y, player)
      return false if !transitable?(map, x, y, player)
      salidas = 0
      [2, 4, 6, 8].each do |d|
        if map.playerPassable?(x, y, d, player)
          nx = x + (d == 6 ? 1 : d == 4 ? -1 : 0)
          ny = y + (d == 2 ? 1 : d == 8 ? -1 : 0)
          salidas += 1 if map.valid?(nx, ny) && transitable?(map, nx, ny, player)
        end
      end
      return salidas >= 1
    end

    def asegurarPosicionValida(player, map)
      return if !player || !map || map.map_id == 0
      return if celdaJugable?(map, player.x, player.y, player)

      max_r = [map.width, map.height, 50].max
      # 1ª pasada: buscar celda jugable con camino abierto
      (1..max_r).each do |r|
        (-r..r).each do |dx|
          [-r, r].each do |dy|
            nx = player.x + dx
            ny = player.y + dy
            if celdaJugable?(map, nx, ny, player)
              player.moveto(nx, ny)
              return true
            end
          end
        end
        (-r..r).each do |dy|
          [-r, r].each do |dx|
            nx = player.x + dx
            ny = player.y + dy
            if celdaJugable?(map, nx, ny, player)
              player.moveto(nx, ny)
              return true
            end
          end
        end
      end

      # 2ª pasada: cualquier celda transitable si el mapa es estrecho
      (1..max_r).each do |r|
        (-r..r).each do |dx|
          [-r, r].each do |dy|
            nx = player.x + dx
            ny = player.y + dy
            if transitable?(map, nx, ny, player)
              player.moveto(nx, ny)
              return true
            end
          end
        end
        (-r..r).each do |dy|
          [-r, r].each do |dx|
            nx = player.x + dx
            ny = player.y + dy
            if transitable?(map, nx, ny, player)
              player.moveto(nx, ny)
              return true
            end
          end
        end
      end
      return false
    end
  end
end

class Game_Player
  if method_defined?(:moveto) && !method_defined?(:pokemod_orig_moveto)
    alias pokemod_orig_moveto moveto
    def moveto(x, y)
      pokemod_orig_moveto(x, y)
      return if @pokemod_reubicando
      if $game_map && $game_map.map_id != 0
        @pokemod_reubicando = true
        PokeModSoftlock.asegurarPosicionValida(self, $game_map) rescue nil
        @pokemod_reubicando = false
      end
    end
  end
end

class Scene_Map
  if method_defined?(:transfer_player) && !method_defined?(:pokemod_orig_transfer_player)
    alias pokemod_orig_transfer_player transfer_player
    def transfer_player(cancelVehicles=true)
      pokemod_orig_transfer_player(cancelVehicles)
      PokeModSoftlock.asegurarPosicionValida($game_player, $game_map) rescue nil
    end
  end
end


