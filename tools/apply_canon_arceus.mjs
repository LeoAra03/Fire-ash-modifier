#!/usr/bin/env node
/**
 * apply_canon_arceus.mjs
 *
 * Canon: **el duelo de La Ruta de Dios es el origen de todo lo que viene
 * después.** El mundo creepypasta, Atlas Mil, la Isla Espejo con los Pokégods
 * y los Fragmentos de dimensión (Glazed, Light Platinum y Team Rocket) son
 * astillas del golpe que Arceus abrió al caer.
 *
 * Por eso esta herramienta hace cuatro cosas:
 *
 *   1. Cierra las puertas. Ningún acceso posterior responde si el duelo no
 *      está resuelto (switch 873). Las puertas conservan su condición
 *      original (postgame, cronista, etc.) y le suman la del duelo.
 *   2. Coloca el **Fragmento del Génesis** en la cumbre: la astilla que
 *      Arceus suelta al caer. Al recogerla despierta el **Rotom del Tiempo**
 *      (switch 883), que es quien sostiene abiertas las grietas.
 *   3. Planta un **Rotom del Tiempo** junto a cada puerta: explica por qué
 *      algo está cerrado y, cuando procede, lo abre en la ficción.
 *   4. Si Arceus fue **capturado** (switch 874), aparece en los momentos
 *      ligeros: los diálogos de Oak sobre las dimensiones y el choque contra
 *      el Mad Pikachu.
 *
 * Además inyecta `PokeMod_CanonArceus`, que convierte el combate en un duelo
 * contra un dios: cada fase doblega una regla distinta del juego (mochila
 * sellada, clima, silencio de habilidades, lógica invertida, tablillas y, al
 * final, sus propias reglas), con efectos en pantalla y movimientos que
 * encarnan cada mecánica.
 *
 * Uso:
 *   node tools/apply_canon_arceus.mjs
 *   node tools/apply_canon_arceus.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad, marshalDump, RString } from "../web/js/marshal.js";
import { ROOT, GAME, DATA } from "./lib/fire_ash_registry.mjs";
import {
  S, txt, mapFile, readData, writeData, readMap, writeMap,
  cmd, condition, graphic, page, event, texts, script, selfSwitch,
  grid, nearestFreeCell, upsertEvents,
} from "./lib/dn_rmxp.mjs";

const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "canon_arceus.json"), "utf8"));
const VERIFY = process.argv.includes("--verify");
const SW = CFG.interruptores;
const BACKUP = path.join(GAME, "PokeModBackups", "canon_arceus");

const MARKER = "PokeMod Canon:";
const RESPALDO = path.join(GAME, "PokeModBackups", "canon_arceus");

/** Copia de seguridad propia: el canon toca mapas y Scripts de otras herramientas. */
function respaldo(archivo) {
  fs.mkdirSync(RESPALDO, { recursive: true });
  const origen = path.join(DATA, archivo);
  const copia = path.join(RESPALDO, archivo);
  if (fs.existsSync(origen) && !fs.existsSync(copia)) fs.copyFileSync(origen, copia);
}

/* ────────────────────────────────── Ruby ───────────────────────────────── */

const rubyStr = (texto) => String(texto).replace(/\\/g, "\\\\").replace(/"/g, "'");

const FASES_RUBY = Object.entries(CFG.fases_dios)
  .map(([fase, datos]) => {
    const movs = (datos.movimientos || []).map((m) => `:${m}`).join(", ");
    const partes = [
      `:movs => [${movs}]`,
      `:efecto => :${datos.efecto}`,
      `:msg => "${rubyStr(datos.mensaje)}"`,
      `:concepto => "${rubyStr(datos.concepto)}"`,
      `:cartel => "${rubyStr(datos.cartel)}"`,
      `:linea => "${rubyStr(datos.linea_meta)}"`,
    ];
    return `    ${fase} => { ${partes.join(", ")} },`;
  })
  .join("\n");

/** Bloques de diálogo de la cuarta pared, como constantes Ruby. */
const DIALOGO_RUBY = Object.entries(CFG.meta)
  .filter(([, valor]) => Array.isArray(valor))
  .map(([clave, lineas]) => {
    const items = lineas.map((l) => `    "${rubyStr(l)}",`).join("\n");
    return `  ${clave.toUpperCase()} = [\n${items}\n  ]`;
  })
  .join("\n");

const RUBY = `#===============================================================================
# PokeMod_CanonArceus
#
# Canon: el duelo de La Ruta de Dios es el origen de todas las dimensiones.
# Sin Arceus caido no existen las grietas, ni Atlas Mil, ni la Isla Espejo con
# sus Pokegods, ni los Fragmentos de Glazed, Light Platinum y Team Rocket.
#===============================================================================
module CanonArceus
  SW_DUELO      = ${SW.DUELO_RESUELTO}
  SW_CAPTURADO  = ${SW.ARCEUS_CAPTURADO}
  SW_COMPLETADO = ${SW.EVENTO_COMPLETADO}
  SW_FRAGMENTO  = ${SW.FRAGMENTO_GENESIS}
  SW_ROTOM      = ${SW.ROTOM_TIEMPO}
  SW_SELLO      = ${SW.SELLO_MOCHILA}

  # Cada fase doblega una regla distinta del combate: el dios no solo pega,
  # reescribe el sistema. Y cada fase BORRA UN CONCEPTO: no cambia el terreno,
  # cambia lo que significa jugar.
  FASES = {
${FASES_RUBY}
  }

  def self.sw(id)
    return false if !$game_switches
    $game_switches[id] ? true : false
  end

  def self.duelo_resuelto?
    sw(SW_DUELO) || sw(SW_CAPTURADO)
  end

  def self.capturado?
    sw(SW_CAPTURADO)
  end

  def self.fragmento?
    sw(SW_FRAGMENTO)
  end

  # El Rotom del Tiempo solo sostiene la herida si Arceus cayo y solto su astilla.
  def self.rotom_activo?
    duelo_resuelto? && fragmento?
  end

  # La astilla que Arceus suelta al caer despierta al Rotom del Tiempo.
  def self.entregar_fragmento
    return if !$game_switches
    $game_switches[SW_FRAGMENTO] = true
    $game_switches[SW_ROTOM] = true
  end

  # Puerta canonica: ninguna dimension responde antes del duelo.
  def self.puerta(lugar)
    if !duelo_resuelto?
      pbMessage(_INTL("La herida del Genesis sigue abierta."))
      pbMessage(_INTL("Nada de esto existe mientras Arceus no caiga en La Ruta de Dios."))
      return false
    end
    if !rotom_activo?
      pbMessage(_INTL("El Rotom del Tiempo aun no despierta: le falta el Fragmento del Genesis."))
      pbMessage(_INTL("Esta en la cumbre de La Ruta de Dios, donde Arceus cayo."))
      return false
    end
    pbMessage(_INTL("El Rotom del Tiempo sostiene la grieta de {1}.", lugar.to_s))
    pbMessage(_INTL("Puedes entrar y volver cuando quieras: la herida te obedece a ti."))
    return true
  end

  def self.movimientos_para(fase)
    datos = FASES[fase]
    return [] if !datos
    datos[:movs] || []
  end

  # Efectos de "dios" sobre la propia partida: el combate deja de ser un sitio
  # seguro y pasa a ser una habitacion donde las reglas las pone otro.
  # Arceus habla como quien sabe que esto es un juego: porque lo sabe.
  module Meta
${DIALOGO_RUBY}

    def self.hablar(lineas, battle = nil)
      (lineas || []).each do |linea|
        begin
          if battle && battle.respond_to?(:pbDisplayPaused)
            battle.pbDisplayPaused(_INTL(linea.to_s))
          else
            pbMessage(_INTL(linea.to_s))
          end
        rescue StandardError
        end
      end
    end
  end

  def self.efecto_fase(battle, battler, fase)
    datos = FASES[fase]
    return if !datos
    # 1. El cartel: el dios anuncia qué concepto deja de existir.
    begin
      battle.pbDisplay(_INTL("\\n" + datos[:cartel].to_s)) if battle && battle.respond_to?(:pbDisplay)
    rescue StandardError
    end
    # 2. La voz: se lo dice a Ash mirando al jugador, no al Pokémon.
    Meta.hablar([datos[:linea]], battle)
    # 3. El efecto clásico de la fase.
    begin
      battle.pbDisplay(_INTL(datos[:msg].to_s)) if battle && battle.respond_to?(:pbDisplay)
    rescue StandardError
    end
    begin
      case datos[:efecto]
      when :sello
        # Concepto borrado: OBJETO. La mochila deja de existir aqui dentro.
        $game_switches[SW_SELLO] = true if $game_switches
        campo(battle, :MagicRoom, 5)
      when :clima
        # Concepto borrado: CIELO (y, con el, el de volar).
        batalla_clima(battle, fase)
        campo(battle, :Gravity, 5)
      when :talento
        # Concepto borrado: TALENTO y SUERTE. Sin habilidades y sin criticos.
        silenciar_habilidades(battle, battler)
        campo(battle, :MagicRoom, 5)
        canto_de_suerte(battle, battler)
        $game_screen.start_tone_change(Tone.new(-70, -70, -70, 0), 20) if $game_screen
      when :velocidad
        # Concepto borrado: VELOCIDAD (y, con ella, el de resistencia).
        campo(battle, :TrickRoom, 5)
        campo(battle, :WonderRoom, 5)
        $game_screen.start_shake(8, 6, 20) if $game_screen
      when :tipo
        # Concepto borrado: TIPO.
        cambiar_tablero(battler, fase)
        $game_screen.start_flash(Color.new(255, 255, 255, 200), 12) if $game_screen
      when :regla
        # Concepto borrado: REGLA. Ya no queda nada que respetar.
        cambiar_tablero(battler, fase)
        batalla_clima(battle, fase)
        canto_de_suerte(battle, battler)
        $game_screen.start_flash(Color.new(255, 240, 200, 255), 20) if $game_screen
        $game_screen.start_tone_change(Tone.new(60, -40, -40, 0), 30) if $game_screen
      end
    rescue StandardError
    end
    # El dios se recompone un poco al romper cada regla: no se gana por desgaste.
    begin
      if battler && battler.respond_to?(:totalhp) && battler.hp < battler.totalhp
        extra = (battler.totalhp * 0.10).floor
        battler.pbRecoverHP(extra) if battler.respond_to?(:pbRecoverHP)
      end
    rescue StandardError
    end
  end

  # Borra las habilidades del lado rival mientras dure la fase: lo que tus
  # Pokemon sabian hacer ya no esta escrito en ninguna parte.
  def self.silenciar_habilidades(battle, battler)
    return if !battle || !battle.respond_to?(:battlers)
    (battle.battlers || []).each do |otro|
      next if !otro || !otro.respond_to?(:fainted?)
      next if otro.fainted?
      next if !otro.respond_to?(:opposes?) || !otro.opposes?(battler)
      next if !otro.respond_to?(:ability=)
      otro.ability = nil
    end
  rescue StandardError
  end

  # "Borra el concepto de suerte": nadie golpea a Arceus en el punto debil.
  # El velo sagrado es un efecto real por lado del motor de combate.
  def self.canto_de_suerte(battle, battler)
    return if !battle || !defined?(PBEffects)
    constante = PBEffects.const_get(:LuckyChant) rescue nil
    return if !constante
    indice = nil
    begin
      indice = battler.index if battler && battler.respond_to?(:index)
    rescue StandardError
    end
    return if !indice
    lado = (indice % 2)
    arreglo = battle.respond_to?(:sides) ? battle.sides[lado] : nil
    arreglo = battle.field if !arreglo || !arreglo.respond_to?(:effects)
    return if !arreglo || !arreglo.respond_to?(:effects)
    arreglo.effects[constante] = 5
  rescue StandardError
  end

  # Activa un efecto de campo real del combate (si el motor lo conoce).
  def self.campo(battle, efecto, turnos)
    return if !battle || !defined?(PBEffects)
    constante = PBEffects.const_get(efecto) rescue nil
    return if !constante
    campo_batalla = battle.field if battle.respond_to?(:field)
    return if !campo_batalla || !campo_batalla.respond_to?(:effects)
    campo_batalla.effects[constante] = turnos
  rescue StandardError
  end

  # Arceus cambia de tablilla: su Juicio cambia de tipo sin previo aviso.
  def self.cambiar_tablero(battler, fase)
    return if !battler
    tablillas = [:FLAMEPLATE, :SPLASHPLATE, :ZAPPLATE, :MEADOWPLATE, :ICICLEPLATE,
                 :FISTPLATE, :TOXICPLATE, :EARTHPLATE, :SKYPLATE, :MINDPLATE,
                 :INSECTPLATE, :STONEPLATE, :SPOOKYPLATE, :DRACOPLATE, :DREADPLATE,
                 :IRONPLATE, :PIXIEPLATE]
    tablilla = tablillas[(fase * 5) % tablillas.length]
    return if !battler.respond_to?(:item=)
    begin
      battler.item = tablilla
      battle_msg = "La tablilla cambia: el Juicio de Arceus ya no es el de antes."
      battler.battle.pbDisplay(_INTL(battle_msg)) if battler.battle.respond_to?(:pbDisplay)
    rescue StandardError
    end
  end

  def self.batalla_clima(battle, fase)
    return if !battle
    clima = [:RAINDANCE, :SUNNYDAY, :SANDSTORM, :HAIL, :FOG][fase % 5]
    if battle.respond_to?(:pbStartWeather)
      battle.pbStartWeather(clima, 5)
    elsif battle.respond_to?(:weather=)
      battle.weather = clima
      battle.weatherduration = 5 if battle.respond_to?(:weatherduration=)
    end
  rescue StandardError
  end
end

# Arceus incorpora a cada fase los movimientos que encarnan su mecanica:
# siembra el clima que va a invocar, silencia, invierte, roba o reescribe.
if defined?(RUTA_ARCEUS_MOVE_SETS)
  begin
    RUTA_ARCEUS_MOVE_SETS.each_with_index do |set, i|
      extra = CanonArceus.movimientos_para(i + 1)
      next if !extra || extra.empty?
      set.concat(extra)
      set.uniq!
    end
  rescue StandardError
  end
end

# ------------------------------------------------------------------------------
# ArceusMeta: la cuarta pared. Arceus sabe que esto es un juego, conoce el
# archivo de guardado, ve la mano que pulsa los botones y se lo dice a Ash
# Ketchum por su nombre completo. No es un adorno: cada linea va acompanada de
# un concepto que deja de existir de verdad en el combate.
# ------------------------------------------------------------------------------
module ArceusMeta
  def self.lineas(clave)
    CanonArceus::Meta.const_defined?(clave.to_s.upcase) ? CanonArceus::Meta.const_get(clave.to_s.upcase) : []
  rescue StandardError
    []
  end

  def self.decir(clave, battle = nil)
    CanonArceus::Meta.hablar(lineas(clave), battle)
  end

  # Apertura: se muestra una sola vez por combate, antes de sacar al Pokémon.
  def self.intro(battle)
    return if !battle
    battle.instance_variable_set(:@arceus_meta_ya_hablo, true)
    if CanonArceus.sw(CanonArceus::SW_COMPLETADO)
      decir("rematch", battle)
    else
      decir("intro", battle)
    end
  end

  # Cierre: el dios se despide como quien sabe que el archivo se puede volver
  # a cargar. 1 = victoria, 2 = derrota, 4 = captura. Se usa pbMessage de mapa
  # (sin ventana de combate) para no depender de que la escena siga viva.
  def self.cierre(battle, decision)
    return if !battle
    case decision
    when 1 then decir("victoria")
    when 2 then decir("derrota")
    when 4 then decir("capturado")
    end
  end
end

["PokeBattle_Battle", "Battle"].each do |nombre_clase|
  next if !Object.const_defined?(nombre_clase)
  clase = Object.const_get(nombre_clase)
  next if !clase

  # Apertura de la cuarta pared, solo en el combate divino.
  if clase.method_defined?(:pbStartBattleSendOut) && !clase.method_defined?(:arceus_meta_send_out_original)
    clase.class_eval do
      alias arceus_meta_send_out_original pbStartBattleSendOut

      def pbStartBattleSendOut(*args)
        begin
          divino = respond_to?(:arceus_divine?) && arceus_divine?
          ya = instance_variable_get(:@arceus_meta_ya_hablo)
          if divino && !ya
            salvaje = !respond_to?(:wildBattle?) || wildBattle?
            ArceusMeta.intro(self) if salvaje
          end
        rescue StandardError
        end
        arceus_meta_send_out_original(*args)
      end
    end
  end

  # Despedida: "carga la partida, yo sigo aqui".
  if clase.method_defined?(:pbEndOfBattle) && !clase.method_defined?(:arceus_meta_end_original)
    clase.class_eval do
      alias arceus_meta_end_original pbEndOfBattle

      def pbEndOfBattle(*args)
        begin
          if respond_to?(:arceus_divine?) && arceus_divine?
            ArceusMeta.cierre(self, args[0])
          end
        rescue StandardError
        end
        arceus_meta_end_original(*args)
      end
    end
  end
end

# Cada vez que se rompe un sello, el dios reescribe una regla del combate.
["PokeBattle_Battle", "Battle"].each do |nombre_clase|
  next if !Object.const_defined?(nombre_clase)
  clase = Object.const_get(nombre_clase)
  next if !clase
  next if !clase.method_defined?(:check_arceus_phase)
  next if clase.method_defined?(:canon_arceus_fase_original)
  clase.class_eval do
    alias canon_arceus_fase_original check_arceus_phase

    def check_arceus_phase(battler)
      antes = @arceus_phase
      canon_arceus_fase_original(battler)
      fase = @arceus_phase
      return if !fase || fase == antes
      return if !battler || !battler.pokemon
      return if battler.pokemon.species != :ARCEUS
      CanonArceus.efecto_fase(self, battler, fase)
    rescue StandardError
    end
  end
end
`;

/* ───────────────────────────────── inyección ───────────────────────────── */

const TITULO = "PokeMod_CanonArceus";

/** Escribe la sección en un Scripts.rxdata concreto, antes de Main. */
function escribirSeccion(archivo) {
  const ruta = path.join(GAME, "Data", archivo);
  const scripts = fs.existsSync(ruta)
    ? marshalLoad(fs.readFileSync(ruta))
    : marshalLoad(fs.readFileSync(path.join(ROOT, archivo)));
  const comprimido = zlib.deflateSync(Buffer.from(RUBY, "utf-8"));
  const idx = scripts.findIndex(([, t]) => t && t.text === TITULO);
  if (idx >= 0) scripts[idx][2] = new RString(comprimido);
  else scripts.splice(scripts.length - 1, 0, [scripts.length + 1, S(TITULO), new RString(comprimido)]);
  const destino = fs.existsSync(ruta) ? ruta : path.join(ROOT, archivo);
  fs.writeFileSync(destino, Buffer.from(marshalDump(scripts)));
  return idx >= 0;
}

function inyectarRuby() {
  respaldo("Scripts.rxdata");
  const existia = escribirSeccion("Scripts.rxdata");
  // El paquete descargable lleva su propio Scripts.rxdata con nueve correcciones
  // de estabilidad: el canon tiene que viajar también ahí, en la misma posición.
  const corregido = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
  let descargable = null;
  if (fs.existsSync(corregido)) descargable = escribirSeccion(path.join("Scripts_corregido", "Scripts.rxdata"));
  return { existia, descargable };
}

/* ─────────────────────────── Rotom del Tiempo ──────────────────────────── */

function colocarRotom(punto) {
  const g = grid(punto.mapa);
  const celda = nearestFreeCell(g, punto.cerca_de, { maxDistance: 6 });
  if (!celda) return { punto, error: "sin celda libre" };
  const nombre = `${MARKER} Rotom del Tiempo — ${punto.lugar}`;
  const resumen = upsertEvents(punto.mapa, [nombre], (baseId) => [
    event(baseId, nombre, celda[0], celda[1], [
      page({
        trigger: 0,
        gfx: graphic(CFG.rotom.sprite, 2),
        list: [...texts(CFG.rotom.lineas.activo), script(`CanonArceus.puerta("${punto.lugar}")`), cmd(0)],
      }),
    ]),
  ], { verbose: false });
  return { punto, celda, resumen };
}

/** El Fragmento del Génesis, en la cumbre donde Arceus cayó. */
function colocarFragmento() {
  const mapa = CFG.fragmento.mapa;
  const g = grid(mapa);
  const celda = nearestFreeCell(g, CFG.fragmento.cerca_de, { maxDistance: 5 });
  if (!celda) throw new Error(`sin celda libre para el fragmento en el mapa ${mapa}`);
  const nombre = `${MARKER} Fragmento del Génesis`;
  const resumen = upsertEvents(mapa, [nombre], (baseId) => [
    event(baseId, nombre, celda[0], celda[1], [
      // Página 1: solo aparece si el duelo está resuelto.
      page({
        cond: condition({ sw: SW.DUELO_RESUELTO }),
        trigger: 0,
        list: [
          ...texts(CFG.fragmento.texto),
          script("CanonArceus.entregar_fragmento"),
          selfSwitch("A"),
          cmd(0),
        ],
      }),
      // Página 2: ya recogido, no queda nada.
      page({ cond: condition({ self: "A" }), list: [cmd(0)] }),
    ]),
  ], { verbose: false });
  return resumen;
}

/** Las puertas no responden hasta que el duelo exista. */
function cerrarPuertas() {
  const tocadas = [];
  for (const puerta of CFG.puertas) {
    respaldo(mapFile(puerta.mapa));
    const map = readMap(puerta.mapa);
    const re = new RegExp(puerta.patron, "i");
    let paginas = 0;
    for (const [, ev] of map.getIvar("@events").pairs) {
      if (!re.test(txt(ev.getIvar("@name")))) continue;
      for (const p of ev.getIvar("@pages") || []) {
        const cond = p.getIvar("@condition");
        if (!cond) continue;
        const s1 = cond.getIvar("@switch1_valid");
        const id1 = cond.getIvar("@switch1_id");
        const s2 = cond.getIvar("@switch2_valid");
        const id2 = cond.getIvar("@switch2_id");
        if ((s1 && id1 === SW.DUELO_RESUELTO) || (s2 && id2 === SW.DUELO_RESUELTO)) continue;
        if (s1 && id1 !== SW.DUELO_RESUELTO && !(s2 && id2 !== SW.DUELO_RESUELTO)) {
          cond.setIvar("@switch2_valid", true);
          cond.setIvar("@switch2_id", SW.DUELO_RESUELTO);
        } else if (!s1) {
          cond.setIvar("@switch1_valid", true);
          cond.setIvar("@switch1_id", SW.DUELO_RESUELTO);
        } else {
          continue;
        }
        paginas++;
      }
    }
    if (paginas) writeMap(puerta.mapa, map);
    tocadas.push({ ...puerta, paginas });
  }
  return tocadas;
}

/** Oak explica las dimensiones; si Arceus fue capturado, aparece él también. */
function ampliarOak() {
  const { mapa, patron, texto, texto_arceus } = CFG.oak;
  respaldo(mapFile(mapa));
  const map = readMap(mapa);
  const re = new RegExp(patron, "i");
  let paginas = 0;
  for (const [, ev] of map.getIvar("@events").pairs) {
    if (!re.test(txt(ev.getIvar("@name")))) continue;
    const paginasActuales = ev.getIvar("@pages") || [];
    const propias = paginasActuales.filter((p) => {
      const c = p.getIvar("@condition");
      if (!c) return false;
      return (c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === SW.FRAGMENTO_GENESIS)
        || (c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === SW.ARCEUS_CAPTURADO);
    });
    const limpias = paginasActuales.filter((p) => !propias.includes(p));
    // Se insertan en la segunda posición: Oak habla de las dimensiones cuando
    // no tiene nada más urgente que decir, sin tapar ninguna escena de historia.
    limpias.splice(1, 0,
      page({
        cond: condition({ sw: SW.FRAGMENTO_GENESIS }),
        trigger: 0,
        list: [...texts(texto), cmd(0)],
      }),
      page({
        cond: condition({ sw: SW.ARCEUS_CAPTURADO }),
        trigger: 0,
        list: [...texts(texto_arceus), cmd(0)],
      }));
    ev.setIvar("@pages", limpias);
    paginas += 2;
  }
  if (paginas) writeMap(mapa, map);
  return { mapa, paginas };
}

/** Si Arceus fue capturado, interviene antes del Mad Pikachu. */
function intervencionMadPikachu() {
  const mapa = CFG.mad_pikachu.mapa;
  const re = new RegExp(CFG.mad_pikachu.patron, "i");
  const g = grid(mapa);
  const objetivo = g.events.find((e) => re.test(e.name));
  if (!objetivo) return { mapa, error: "no encuentro al Mad Pikachu" };
  const nombre = `${MARKER} eco del Génesis`;
  const celda = nearestFreeCell(g, CFG.mad_pikachu.cerca_de, { maxDistance: 6 });
  if (!celda) return { mapa, juntoA: objetivo.name, error: "sin celda libre" };
  const resumen = upsertEvents(mapa, [nombre], (baseId) => [
    event(baseId, nombre, celda[0], celda[1], [
      page({
        cond: condition({ sw: SW.ARCEUS_CAPTURADO }),
        trigger: 0,
        gfx: graphic("ARCEUS", 2),
        list: [...texts(CFG.mad_pikachu.texto), cmd(0)],
      }),
    ]),
  ], { verbose: false });
  return { mapa, juntoA: objetivo.name, celda, resumen };
}

/* ─────────────────────────────── verificación ──────────────────────────── */

function verificar() {
  const fallos = [];

  const scripts = readData("Scripts.rxdata");
  const seccion = scripts.find(([, t]) => t && t.text === "PokeMod_CanonArceus");
  if (!seccion) fallos.push("falta la sección Ruby PokeMod_CanonArceus");
  else {
    const ruby = zlib.inflateSync(Buffer.from(seccion[2].bytes)).toString("utf-8");
    for (const nombre of ["module CanonArceus", "def self.puerta", "def self.entregar_fragmento", "check_arceus_phase", "RUTA_ARCEUS_MOVE_SETS"]) {
      if (!ruby.includes(nombre)) fallos.push(`el Ruby no define ${nombre}`);
    }
    const corregido = path.join(ROOT, "Scripts_corregido", "Scripts.rxdata");
    if (fs.existsSync(corregido)) {
      const descargable = marshalLoad(fs.readFileSync(corregido));
      if (descargable.length !== scripts.length) {
        fallos.push(`Scripts_corregido/Scripts.rxdata tiene ${descargable.length} secciones y el juego ${scripts.length}`);
      } else if (!descargable.some(([, t]) => t && t.text === "PokeMod_CanonArceus")) {
        fallos.push("al Scripts_corregido/Scripts.rxdata le falta el canon de Arceus");
      }
    }
  }

  for (const punto of CFG.rotom.puntos) {
    const g = grid(punto.mapa);
    const ok = g.events.some((e) => e.name.startsWith(`${MARKER} Rotom del Tiempo`));
    if (!ok) fallos.push(`falta el Rotom del Tiempo en el mapa ${punto.mapa}`);
  }

  {
    const g = grid(CFG.fragmento.mapa);
    const frag = g.events.find((e) => e.name.includes("Fragmento del Génesis"));
    if (!frag) fallos.push(`falta el Fragmento del Génesis en el mapa ${CFG.fragmento.mapa}`);
    else {
      const conDuelo = frag.pages.some((p) => {
        const c = p.getIvar("@condition");
        return c && c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === SW.DUELO_RESUELTO;
      });
      if (!conDuelo) fallos.push("el fragmento aparece sin haber resuelto el duelo");
    }
  }

  for (const puerta of CFG.puertas) {
    const g = grid(puerta.mapa);
    const re = new RegExp(puerta.patron, "i");
    let cerradas = 0;
    for (const e of g.events) {
      if (!re.test(e.name)) continue;
      for (const p of e.pages) {
        const c = p.getIvar("@condition");
        if (!c) continue;
        const a = c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === SW.DUELO_RESUELTO;
        const b = c.getIvar("@switch2_valid") && c.getIvar("@switch2_id") === SW.DUELO_RESUELTO;
        if (a || b) cerradas++;
      }
    }
    if (!cerradas) fallos.push(`la puerta "${puerta.nota}" (mapa ${puerta.mapa}) no exige el duelo de Arceus`);
  }

  {
    const g = grid(CFG.oak.mapa);
    const re = new RegExp(CFG.oak.patron, "i");
    const oak = g.events.find((e) => re.test(e.name));
    if (!oak) fallos.push("no encuentro al profesor Oak");
    else {
      const con = (id) => oak.pages.some((p) => {
        const c = p.getIvar("@condition");
        return c && c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === id;
      });
      if (!con(SW.FRAGMENTO_GENESIS)) fallos.push("a Oak le falta el diálogo sobre las dimensiones");
      if (!con(SW.ARCEUS_CAPTURADO)) fallos.push("a Oak le falta la aparición de Arceus capturado");
    }
  }

  {
    const g = grid(CFG.mad_pikachu.mapa);
    const eco = g.events.find((e) => e.name.includes("eco del Génesis"));
    if (!eco) fallos.push("falta la intervención de Arceus ante el Mad Pikachu");
    else {
      const condicionado = eco.pages.some((p) => {
        const c = p.getIvar("@condition");
        return c && c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === SW.ARCEUS_CAPTURADO;
      });
      if (!condicionado) fallos.push("el eco del Génesis no depende de la captura de Arceus");
    }
  }

  return fallos;
}

/* ──────────────────────────────── programa ─────────────────────────────── */

if (VERIFY) {
  const fallos = verificar();
  if (fallos.length) {
    console.log("✘ Canon de Arceus incompleto:");
    for (const f of fallos) console.log(`   · ${f}`);
    process.exit(1);
  }
  console.log("✔ Canon de Arceus verificado.");
  console.log("  · todas las puertas exigen el duelo de La Ruta de Dios");
  console.log("  · Fragmento del Génesis en la cumbre, solo tras el duelo");
  console.log("  · Rotom del Tiempo en los tres accesos");
  console.log("  · Oak habla de las dimensiones y Arceus aparece si fue capturado");
  console.log("  · el combate doblega una regla distinta por fase");
  process.exit(0);
}

const inyeccion = inyectarRuby();
const rotoms = CFG.rotom.puntos.map(colocarRotom);
const fragmento = colocarFragmento();
const puertas = cerrarPuertas();
const oak = ampliarOak();
const madPikachu = intervencionMadPikachu();

console.log(`✔ Canon de Arceus aplicado sobre ${path.relative(ROOT, GAME)}`);
console.log(`  · guion PokeMod_CanonArceus: ${inyeccion.existia ? "actualizado" : "inyectado"} (${RUBY.split("\n").length} líneas, ${Object.keys(CFG.fases_dios).length} fases con abuso de mecánicas)`);
if (inyeccion.descargable !== null) {
  console.log(`  · Scripts_corregido/Scripts.rxdata: ${inyeccion.descargable ? "actualizado" : "inyectado"} (mismas nueve correcciones de estabilidad)`);
}
for (const r of rotoms) {
  console.log(`  · Rotom del Tiempo — ${r.punto.lugar}: mapa ${r.punto.mapa} en (${r.celda ? r.celda.join(",") : "—"})`);
}
console.log(`  · Fragmento del Génesis: mapa ${CFG.fragmento.mapa} en (${fragmento.added[0]?.x},${fragmento.added[0]?.y})`);
for (const p of puertas) {
  console.log(`  · puerta cerrada — ${p.nota}: mapa ${p.mapa} (${p.paginas} páginas)`);
}
console.log(`  · Oak: ${oak.paginas} páginas nuevas en el mapa ${oak.mapa}`);
console.log(`  · Mad Pikachu: ${madPikachu ? (madPikachu.celda ? `eco del Génesis en el mapa ${madPikachu.mapa} (${madPikachu.celda.join(",")}), junto a "${madPikachu.juntoA}"` : `mapa ${madPikachu.mapa}: ${madPikachu.error}`) : "no localizado"}`);

const fallos = verificar();
if (fallos.length) {
  console.log("\n✘ La verificación encontró problemas:");
  for (const f of fallos) console.log(`   · ${f}`);
  process.exit(1);
}
console.log("✔ Verificación posterior OK.");
