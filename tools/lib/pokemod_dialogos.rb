# PokeMod_Dialogos — caja de diálogo por personaje y cola anti-solape.
# Inyectado por tools/apply_cajas_dialogo.mjs en Scripts.rxdata.
#
# Reglas:
#   · «Nombre: texto» / «Nombre — texto» / \sp[Nombre] ponen la caja a nombre
#     de ese personaje (retroactivo con los diálogos que ya usan «Arceus: …»).
#   · Si el mensaje lo dispara un evento y su nombre parece el de un personaje,
#     la caja lleva ese nombre automáticamente.
#   · Nunca se dibujan dos cajas de diálogo a la vez (cola con límite de
#     tiempo: el juego jamás se cuelga).
module PokeModDialogos
  MAX_ESPERA = 600
  @@ocupado = 0

  def self.ocupado?
    return @@ocupado > 0
  end

  def self.entrar
    frames = 0
    while @@ocupado > 0 && frames < MAX_ESPERA
      Graphics.update
      Input.update
      frames += 1
    end
    @@ocupado += 1
  end

  def self.salir
    @@ocupado -= 1 if @@ocupado > 0
  end

  def self.nombreDeEvento(portador = nil)
    return nil if !$game_map
    obj = portador
    return nil if !obj || !obj.respond_to?(:instance_variable_get)
    evid = obj.instance_variable_get(:@event_id)
    return nil if !evid || evid == 0
    ev = $game_map.events[evid]
    return nil if !ev
    nombre = ev.name.to_s.strip
    return nil if nombre == ""
    return nil if nombre =~ /PokeMod|Warp|Tile|Exit|Stairs|Door|Sign|Item|Ball|Machine|Teleport|Hidden|Trigger|NPC/i
    return nil if nombre =~ /[0-9:]/ || nombre.length < 2 || nombre.length > 24
    return nil if nombre !~ /[AEIOUaeiou]/
    return nil if nombre.include?("\\")
    return nombre
  rescue StandardError
    return nil
  end

  def self.dividir(texto, portador = nil)
    s = texto.to_s
    # Etiqueta explícita \sp[Nombre]
    m = s.match(/\\sp\[([^\]]{1,28})\]/)
    if m
      nombre = m[1].to_s.strip
      resto = s.sub(/\\sp\[[^\]]{1,28}\]/, "").sub(/\A\s+/, "")
      return [nombre, resto] if nombre != ""
    end
    # Prefijo «Nombre:» / «Nombre —» (el nombre es corto: 1-4 palabras)
    m = s.match(/\A\s*([^:\n]{2,28}?)\s*[:—]\s+/)
    if m
      nombre = m[1].to_s.strip
      palabras = nombre.split(/\s+/).length
      if nombre != "" && nombre !~ /\A[0-9]/ && nombre =~ /[AEIOUaeiou]/ &&
         !nombre.include?("\\") && nombre !~ /PokeMod/i && palabras <= 4
        resto = s[m.end(0)..-1].to_s
        return [nombre, resto]
      end
    end
    # Nombre del evento que dispara el mensaje
    nombre = nombreDeEvento(portador)
    return [nombre, s] if nombre
    return [nil, s]
  end

  def self.cajaDeNombre(msgwindow, nombre)
    return nil if !msgwindow || !nombre || nombre.to_s == ""
    begin
      caja = Window_AdvancedTextPokemon.new(nombre.to_s)
      begin
        caja.resizeToFit(caja.text, 360) if caja.respond_to?(:resizeToFit)
      rescue StandardError
      end
      begin
        if defined?(MessageConfig) && MessageConfig.respond_to?(:pbGetSpeechFrame)
          caja.setSkin(MessageConfig.pbGetSpeechFrame())
        end
      rescue StandardError
      end
      begin
        caja.z = msgwindow.z + 1
      rescue StandardError
        caja.z = 100000
      end
      begin
        caja.opacity = msgwindow.opacity
      rescue StandardError
      end
      begin
        if msgwindow.y > Graphics.height / 2
          caja.x = msgwindow.x + 6
          caja.y = msgwindow.y - caja.height - 2
          caja.y = 0 if caja.y < 0
        else
          caja.x = msgwindow.x + 6
          caja.y = msgwindow.y + msgwindow.height + 2
          caja.y = Graphics.height - caja.height if caja.y + caja.height > Graphics.height
        end
      rescue StandardError
        caja.x = 8
        caja.y = Graphics.height - 96
      end
      caja.visible = true
      return caja
    rescue StandardError
      return nil
    end
  end

  def self.cerrarCaja(caja)
    begin
      caja.dispose if caja && !caja.disposed?
    rescue StandardError
    end
  end
end

# ── Caja por personaje + anti-solape en el mundo superior ──────────────────
begin
  class Object
    alias pokemod_orig_pbMessageDisplay pbMessageDisplay
    def pbMessageDisplay(msgwindow, message, letterbyletter = true, commandProc = nil, &block)
      hablante, texto = PokeModDialogos.dividir(message, self)
      caja = PokeModDialogos.cajaDeNombre(msgwindow, hablante)
      begin
        return pokemod_orig_pbMessageDisplay(msgwindow, texto, letterbyletter, commandProc, &block)
      ensure
        PokeModDialogos.cerrarCaja(caja)
      end
    end

    alias pokemod_orig_pbCreateMessageWindow pbCreateMessageWindow
    def pbCreateMessageWindow(viewport = nil, skin = nil)
      PokeModDialogos.entrar
      begin
        return pokemod_orig_pbCreateMessageWindow(viewport, skin)
      rescue StandardError
        PokeModDialogos.salir
        raise
      end
    end

    alias pokemod_orig_pbDisposeMessageWindow pbDisposeMessageWindow
    def pbDisposeMessageWindow(msgwindow)
      begin
        return pokemod_orig_pbDisposeMessageWindow(msgwindow)
      ensure
        PokeModDialogos.salir
      end
    end
  end
rescue StandardError
end

# ── Combate: los mensajes de batalla también llevan caja del hablante ──────
begin
  class PokeBattle_Scene
    alias pokemod_orig_pbDisplayMessage pbDisplayMessage
    def pbDisplayMessage(msg, brief = false, &block)
      hablante, texto = PokeModDialogos.dividir(msg, self)
      caja = PokeModDialogos.cajaDeNombre(@sprites ? @sprites["messageWindow"] : nil, hablante)
      begin
        pokemod_orig_pbDisplayMessage(texto, brief, &block)
      ensure
        PokeModDialogos.cerrarCaja(caja)
      end
    end

    alias pokemod_orig_pbDisplayPausedMessage pbDisplayPausedMessage
    def pbDisplayPausedMessage(msg, &block)
      hablante, texto = PokeModDialogos.dividir(msg, self)
      caja = PokeModDialogos.cajaDeNombre(@sprites ? @sprites["messageWindow"] : nil, hablante)
      begin
        pokemod_orig_pbDisplayPausedMessage(texto, &block)
      ensure
        PokeModDialogos.cerrarCaja(caja)
      end
    end

    alias pbDisplay pbDisplayMessage
    alias pbDisplayPaused pbDisplayPausedMessage
  end
rescue StandardError
end
