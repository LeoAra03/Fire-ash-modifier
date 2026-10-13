# PokeMod_ZMenu — el botón Z (Input::SPECIAL) no debe poder reventar la partida.
# Inyectado por tools/apply_z_menu_safety.mjs en Scripts.rxdata.
#
# Por qué existe:
#   En Fire Ash (Essentials v19) la Z es `Input::SPECIAL`. En el mapa hace:
#
#     Scene_Map#update → Input.trigger?(Input::SPECIAL) → $PokemonTemp.keyItemCalling
#                      → pbUseKeyItem  (UI_ReadyMenu:301)
#
#   y `pbUseKeyItem` recorre `$PokemonBag.registeredItems` con
#
#     itm = GameData::Item.get(i).id
#
#   `GameData::Item.get` **revienta** si el id ya no existe en los datos del
#   juego (ítems renombrados o retirados por los parches del DLC). Como los
#   objetos registrados viven en la PARTIDA guardada, un jugador con partida
#   antigua abría el menú con Z y el motor lanzaba un error en mitad del mapa:
#   «muchas crash movimiento z».
#
# Qué hace este parche (pequeño y sin reescribir el motor):
#   1. Antes de que el motor lea la lista, tira los ids que ya no existen.
#   2. `registeredIndex` siempre devuelve un índice válido (Array de 3).
#   3. Si aun así algo falla, se avisa por pantalla y el juego continúa:
#      nunca se queda en la pantalla de error de RGSS.
module PokeModZMenu
  def self.objetoValido?(id)
    return false if id.nil?
    itm = (GameData::Item.try_get(id) rescue nil)
    return false if !itm
    return true
  end

  def self.limpiarRegistro
    return 0 if !$PokemonBag || !$PokemonBag.respond_to?(:registeredItems)
    lista = $PokemonBag.registeredItems
    return 0 if !lista || !lista.respond_to?(:reject!)
    antes = lista.length
    lista.reject! { |id| !objetoValido?(id) }
    ($PokemonBag.instance_variable_set(:@registeredIndex, nil) rescue nil) if lista.length != antes
    return antes - lista.length
  end
end

# 1. El índice de la rueda (PokemonBag) tolera partidas viejas.
class PokemonBag
  if method_defined?(:registeredIndex) && !method_defined?(:pokemod_orig_registeredIndex)
    alias pokemod_orig_registeredIndex registeredIndex
  end

  def registeredItems
    @registeredItems = [] if !@registeredItems
    @registeredItems = @registeredItems.compact
    return @registeredItems
  end

  def registeredIndex
    idx = (pokemod_orig_registeredIndex rescue nil)
    idx = [0, 0, 0] if !idx || !idx.is_a?(Array) || idx.length < 3
    idx[0] = idx[0].to_i rescue 0
    idx[1] = idx[1].to_i rescue 0
    idx[2] = (idx[2].to_i == 1) ? 1 : 0
    return idx
  end
end

# 2. Z (objeto/movimiento registrado): limpiar la lista y no morir por un id raro.
if defined?(pbUseKeyItem) && !defined?(pokemod_orig_pbUseKeyItem)
  alias pokemod_orig_pbUseKeyItem pbUseKeyItem

  def pbUseKeyItem
    PokeModZMenu.limpiarRegistro
    return pokemod_orig_pbUseKeyItem
  rescue StandardError
    ($PokemonTemp.keyItemCalling = false rescue nil)
    (pbMessage(_INTL("El menú del botón Z tuvo un problema, pero la partida sigue.")) rescue nil)
    return false
  end
end
