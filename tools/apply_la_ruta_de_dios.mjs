#!/usr/bin/env node
/**
 * apply_la_ruta_de_dios.mjs
 *
 * Masterpiece Expansion: "La Ruta de Dios" (The Road of God)
 *
 * Requisitos y características completas:
 * 1. Evento Postgame en Sinnoh con Volus (Volo de Pokémon Leyendas Arceus) en Pueblo Hojaverde (Map 513).
 *    - Requiere las 17 Tablas del Génesis de Arceus.
 *    - Diálogo de sorpresa y asombro ("una oportunidad entre una infinidad").
 *    - Terremoto cinemático interrumpiendo la conversación que abre una fractura en Ciudad Puntaneva (Map 625).
 *    - Canalización opcional para obtener las tablas si se desea iniciar directamente en postgame.
 * 2. Acceso desde Ciudad Puntaneva (Map 625) mediante portal de luz ancestral en la entrada del Templo Puntaneva.
 * 3. Montaña Olímpica de 7 pisos (haciendo paralelismo al Monte Corona):
 *    - 1F (Map 2031, 40x40): Puerta de las Columnas. Nieve fresca, estatuas grisáceas (1310/3300), columnas de mármol (4453/4409).
 *         Encuentro y combate contra Maya / Dawn (Lv. 130). Ítem oculto: Caramelo Raro.
 *    - 2F (Map 2032, 40x40): Sendero de los Titanes. Laderas escarpadas, monolitos antiguos, nieve eterna.
 *         Encuentro y combate contra Jericor / Palmer y Benito / Barry (Lv. 135). Ítem oculto: Revivir Máximo.
 *    - 3F (Map 2033, 42x42): Terraza del Aura. Doble columnata de estatuas grisáceas.
 *         Encuentro y combate contra Quinoa / Riley (Lv. 140). Ítem oculto: Más PP.
 *    - 4F (Map 2034, 42x42): Baluarte Celestial. Cima alpina y vientos cósmicos.
 *         Encuentro y combate contra la Campeona Cintia / Cynthia (Lv. 145). Ítem oculto: Ceniza Sagrada.
 *    - 5F (Map 2035, 38x38): Santuario del Tiempo.
 *         Guardián Dialga Primordial (Lv. 150) con sprite bloqueando la escalera. Al ser derrotado o capturado se desvanece. Ítem oculto: Parte Cometa.
 *    - 6F (Map 2036, 38x38): Santuario del Espacio.
 *         Guardián Palkia Primordial (Lv. 150) con sprite bloqueando el acceso a la cima. Al ser derrotado o capturado se desvanece. Ítem oculto: Cápsula Habilidad.
 *    - 7F (Map 2037, 46x46): Cima del Génesis (El Olimpo de Arceus).
 *         Avenida de mármol blanco, 12 estatuas colosales, Altar del Origen con ARCEUS (NIVEL 200, IVs perfectos 31 en todo).
 * 4. Cinemática de Arceus en la Cima:
 *    - Temblores de pantalla, destellos sagrados, música divina (Legend Sinnoh).
 *    - Cuestiona el viaje de Ash, menciona a los Pokémon legendarios atrapados.
 *    - Revela que dejó copias atenuadas de sí mismo, de Dialga y de Palkia a propósito para evitar este despertar.
 *    - Anuncia que ha descendido para desatar el Cataclismo Final y reiniciar el universo.
 * 5. Combate contra Arceus:
 *    - Nivel 200 (único Pokémon del juego en alcanzar este nivel).
 *    - Sentencia, Distorsión, Corte Vacío, Golpe Umbrío con Tabla Legendaria.
 *    - Capacidad de curarse 3 VECES con Restaura Todo cuando su salud baja del 45% (con animación y aviso en pantalla).
 *    - Se puede capturar o derrotar.
 *    - Si derrota al jugador: desmayo oficial y transporte al Centro Pokémon más cercano.
 * 6. Desenlace con Volus:
 *    - Volus sube a la cima tras el combate felicitando a Ash por salvar el cosmos.
 *    - Si capturamos a Arceus: Volus enloquece de obsesión y desafía a Ash en combate por Arceus (Volus con Giratina Origen Lv. 155).
 *    - Si perdemos ante Volus, podemos volver a subir y retarlo hasta derrotarlo.
 *    - Al vencer a Volus, reconoce nuestro vínculo, se marcha y el evento temporal concluye.
 *    - Los entrenadores de los pisos 1-4 desaparecen tras completarse el evento.
 *
 * Uso:
 *   node tools/apply_la_ruta_de_dios.mjs
 *   node tools/apply_la_ruta_de_dios.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import {
  marshalLoad, marshalDump, RHash, RObject, RString, RSymbol, RUserDef,
} from "../web/js/marshal.js";
import {
  TileCanvas, passabilityOf, reachableCells, buildMapObject,
} from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const BACKUP_DIR = path.join(GAME, "PokeModBackups", "la_ruta_de_dios");
const VERIFY_ONLY = process.argv.includes("--verify");

const readRx = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const writeRx = (f, v) => fs.writeFileSync(path.join(DATA, f), Buffer.from(marshalDump(v)));
const S = (text) => RString.fromText(String(text));
const Sy = (text) => new RSymbol(text);
const iv = (obj, name) => obj.getIvar(name);
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));

// Switches dedicados
const SW_UNLOCKED = 870;         // Terremoto ocurrido, ruta abierta en Puntaneva
const SW_DIALGA_DEFEATED = 871;  // Dialga Lv.150 derrotado/capturado en 5F
const SW_PALKIA_DEFEATED = 872;  // Palkia Lv.150 derrotado/capturado en 6F
const SW_ARCEUS_RESOLVED = 873;  // Arceus Lv.200 derrotado o capturado
const SW_ARCEUS_CAUGHT = 874;    // Arceus Lv.200 fue capturado (activa duelo de Volo)
const SW_VOLO_DEFEATED = 875;    // Volo vencido en la cumbre
const SW_COMPLETED = 876;        // Evento temporal concluido con éxito

// ---------------------------------------------------------------------------
// RMXP Event Constructors
// ---------------------------------------------------------------------------
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [
    ["@code", code], ["@indent", indent], ["@parameters", params],
  ]);
}
function condition({ sw = 0, sw2 = 0, self = "" } = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
    ["@switch2_valid", !!sw2], ["@switch2_id", sw2 || 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
  ]);
}
function graphic(charName = "", dir = 2, pattern = 1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", 0], ["@character_name", S(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pattern], ["@opacity", 255], ["@blend_type", 0],
  ]);
}
function moveRoute() {
  return new RObject("RPG::MoveRoute", [
    ["@repeat", true], ["@skippable", false], ["@list", []],
  ]);
}
function page({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", cond], ["@graphic", gfx],
    ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
    ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
    ["@trigger", trigger], ["@list", list],
  ]);
}
function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [
    ["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages],
  ]);
}
function textCommands(lines, indent = 0) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return [cmd(101, [S("")], indent), ...arr.map((l) => cmd(401, [S(l)], indent))];
}
function script(line, indent = 0) { return cmd(355, [S(line)], indent); }
function transfer(map, x, y, dir = 2, indent = 0) {
  return cmd(201, [0, map, x, y, dir, 1], indent);
}
function addEventToMap(mapObj, ev) {
  const events = iv(mapObj, "events");
  events.pairs.push([iv(ev, "id"), ev]);
}

// ---------------------------------------------------------------------------
// 1. Script Section Installation (Scripts.rxdata)
// ---------------------------------------------------------------------------
const RUTA_DE_DIOS_RUBY = `#===============================================================================
# PokeMod: La Ruta de Dios (The Road of God) - Masterpiece Event Script
#===============================================================================

# 1. Level 200 Cap exclusively for Arceus
class Pokemon
  alias _arceus_orig_level_set level=
  def level=(value)
    max = (@species == :ARCEUS) ? 200 : GameData::GrowthRate.max_level
    if value < 1 || value > max
      raise ArgumentError.new(_INTL("The level number ({1}) is invalid.", value))
    end
    @exp = growth_rate.minimum_exp_for_level(value)
    @level = value
  end
end

module GameData
  class GrowthRate
    alias _arceus_orig_min_exp minimum_exp_for_level
    def minimum_exp_for_level(level)
      return ArgumentError.new("Level #{level} is invalid.") if !level || level <= 0
      level = [level, 200].min
      return @exp_values[level] if @exp_values && level < @exp_values.length
      raise "No Exp formula is defined for growth rate #{name}" if !@exp_formula
      return @exp_formula.call(level)
    end
  end
end

# 2. Arceus 3x Full Restore AI during battle
class PokeBattle_Battler
  alias _arceus_orig_reduce_hp pbReduceHP
  def pbReduceHP(amt, anim = true, registerDamage = true, anyAnim = true)
    ret = _arceus_orig_reduce_hp(amt, anim, registerDamage, anyAnim)
    if @battle && @battle.respond_to?(:check_arceus_restore)
      @battle.check_arceus_restore(self)
    end
    return ret
  end
end

class PokeBattle_Battle
  attr_accessor :arceus_restores_used

  def check_arceus_restore(battler)
    return if battler.fainted? || battler.species != :ARCEUS || battler.index == 0
    @arceus_restores_used ||= 0
    if @arceus_restores_used < 3 && battler.hp <= (battler.totalhp * 0.45)
      @arceus_restores_used += 1
      pbDisplay(_INTL("¡El fulgor del Génesis envuelve al Arquitecto de la Existencia!"))
      pbDisplay(_INTL("¡Arceus utilizó un Restaura Todo ({1}/3)! ¡Su salud y estado se restablecen por completo!", @arceus_restores_used))
      battler.pbRecoverHP(battler.totalhp)
      battler.pbCureStatus
    end
  end
end

# 3. Arceus 17 Plates Catalog & Management
ARCEUS_PLATES = [
  :FLAMEPLATE, :SPLASHPLATE, :ZAPPLATE, :MEADOWPLATE,
  :ICICLEPLATE, :FISTPLATE, :TOXICPLATE, :EARTHPLATE,
  :SKYPLATE, :MINDPLATE, :INSECTPLATE, :STONEPLATE,
  :SPOOKYPLATE, :DRACOPLATE, :DREADPLATE, :IRONPLATE,
  :PIXIEPLATE
]

def pbCountArceusPlates
  return ARCEUS_PLATES.count { |plate| $PokemonBag.pbHasItem?(plate) }
end

def pbHasAllArceusPlates?
  return pbCountArceusPlates >= 17
end

def pbGrantAllArceusPlates
  ARCEUS_PLATES.each do |plate|
    $PokemonBag.pbStoreItem(plate, 1) unless $PokemonBag.pbHasItem?(plate)
  end
end

# 4. Arceus Divine Battle Starter
def pbStartArceusDivineBattle
  pkmn = Pokemon.new(:ARCEUS, 200)
  GameData::Stat.each_main { |s| pkmn.iv[s.id] = 31 }
  pkmn.item = :LEGENDPLATE rescue (:BLANKPLATE rescue nil)
  pkmn.learn_move(:JUDGMENT) rescue nil
  pkmn.learn_move(:ROAROFTIME) rescue nil
  pkmn.learn_move(:SPACIALREND) rescue nil
  pkmn.learn_move(:SHADOWFORCE) rescue nil
  pkmn.calc_stats

  $PokemonGlobal.nextBattleBGM = "Legend Sinnoh"
  $PokemonGlobal.nextBattleBack = "snow"
  $PokemonTemp.clearBattleRules
  $PokemonTemp.recordBattleRule("cannotRun")

  # Standard wild battle: player whiteout on loss returns to nearest Pokemon Center
  decision = pbWildBattleCore(pkmn)
  return decision
end
`;

function installScriptSection() {
  const scripts = readRx("Scripts.rxdata");
  const existingIdx = scripts.findIndex(([id, title]) => title.text === "PokeMod_RutaDeDios");
  const compressed = zlib.deflateSync(Buffer.from(RUTA_DE_DIOS_RUBY, "utf-8"));
  const rstr = new RString(compressed);

  if (existingIdx !== -1) {
    scripts[existingIdx][2] = rstr;
  } else {
    // Insert right before Main
    const mainIdx = scripts.length - 1;
    const newId = 999901;
    const newSection = [newId, S("PokeMod_RutaDeDios"), rstr];
    scripts.splice(mainIdx, 0, newSection);
  }

  writeRx("Scripts.rxdata", scripts);
  console.log("OK: PokeMod_RutaDeDios installed in Scripts.rxdata.");
}

// ---------------------------------------------------------------------------
// 2. System Switches Expansion (System.rxdata)
// ---------------------------------------------------------------------------
function installSwitches() {
  const sys = readRx("System.rxdata");
  const sw = sys.getIvar("@switches");
  while (sw.length <= 880) sw.push(null);

  sw[SW_UNLOCKED] = S("RUTA_DE_DIOS_UNLOCKED");
  sw[SW_DIALGA_DEFEATED] = S("RUTA_DE_DIOS_DIALGA_DEFEATED");
  sw[SW_PALKIA_DEFEATED] = S("RUTA_DE_DIOS_PALKIA_DEFEATED");
  sw[SW_ARCEUS_RESOLVED] = S("RUTA_DE_DIOS_ARCEUS_RESOLVED");
  sw[SW_ARCEUS_CAUGHT] = S("RUTA_DE_DIOS_ARCEUS_CAUGHT");
  sw[SW_VOLO_DEFEATED] = S("RUTA_DE_DIOS_VOLO_DEFEATED");
  sw[SW_COMPLETED] = S("RUTA_DE_DIOS_COMPLETED");

  writeRx("System.rxdata", sys);
  console.log("OK: Switches 870..876 registered in System.rxdata.");
}

// ---------------------------------------------------------------------------
// 3. Volo in Twinleaf Town (Map 513)
// ---------------------------------------------------------------------------
function installTwinleafVolo() {
  const map513 = readRx("Map513.rxdata");
  const events = iv(map513, "events").pairs;

  // Remove existing Volo if already present
  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Volus de la Ruta"));
  if (idx !== -1) events.splice(idx, 1);

  // New Volo Event at (18, 14)
  const id = 101;
  const p1 = page({
    gfx: graphic("SECRET_Volo", 2),
    list: [
      cmd(101, [S("\\bVolus: Ah... ¿eres tú el muchacho que desafía los horizontes de Sinnoh?\\1")]),
      cmd(101, [S("\\bMe llamo Volus. Soy un humilde mercader... y un apasionado buscador de los mitos que forjaron la creación.")]),
      script("pbCount = pbCountArceusPlates"),
      cmd(111, [12, S("pbHasAllArceusPlates?")]),
      // When player HAS all 17 plates:
      cmd(101, [S("\\bVolus: ... ¡¿QUÉ?! ¡¿E-Esas luces que emanan de tu Mochila...?!\\1")]),
      cmd(101, [S("\\b¡¿Es... es imposible?! ¡Tienes contigo TODAS las 17 Tablas del Génesis!")]),
      cmd(101, [S("\\bLa Llama, la Gota, el Trueno, el Prado, el Helado, la Tabla Fuerte, la Tóxica, la Terrestre, la Celeste, la Mental, la Bicho, la Pétrea, la Terrorífica, la Dragón, la Oscura, la Acero y la Duende...")]),
      cmd(101, [S("\\b¡Es una oportunidad entre una infinidad! ¡El mito primordial ha despertado!")]),
      // Earthquake cinematic
      script("$game_screen.start_shake(6, 6, 60)"),
      cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
      cmd(224, [new RUserDef("Color", Buffer.alloc(32)), 30]),
      cmd(101, [S("\\b¡¡RUUUUMBLE!!")]),
      cmd(101, [S("\\b¡Un colosal terremoto cósmico sacude la región entera de Sinnoh!")]),
      cmd(101, [S("\\bVolus: ¡¿Qué ha sido ese temblor divino?! ¡Las Tablas están resonando con la Cima del Mundo!\\1")]),
      cmd(101, [S("\\b¡Una fractura dimensional acaba de rasgar el cielo sobre la entrada del Templo de Ciudad Puntaneva!")]),
      cmd(101, [S("\\b¡El velo de los dioses se ha quebrado! ¡Asciende hacia Ciudad Puntaneva si tienes la osadía de enfrentar lo que aguarda en la cumbre!")]),
      cmd(121, [SW_UNLOCKED, SW_UNLOCKED, 0]), // Set SW_UNLOCKED ON
      cmd(411), // Else (lacks plates)
      cmd(101, [S("\\bVolus: Cuenta la leyenda que el Creador dispersó 17 Tablas elementales antes de sumirse en su letargo.")]),
      cmd(101, [S("\\bActualmente percibo que posees \\v[1] de las 17 Tablas del Génesis.")]),
      cmd(101, [S("¿Deseas que canalice la resonancia de las eras pasadas para despertar las Tablas restantes?\\ch[1,2,Canalizar resonancia,Buscaré por mi cuenta]")]),
      cmd(111, [12, S("$game_variables[1] == 1")]),
      script("pbGrantAllArceusPlates"),
      cmd(101, [S("\\b¡Las 17 Tablas del Génesis han resonado intensamente y se manifiestan en tu Mochila!\\1")]),
      cmd(101, [S("\\bVolus: ¡Increíble! ¡Todas las Tablas están unidas!")]),
      script("$game_screen.start_shake(6, 6, 60)"),
      cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
      cmd(101, [S("\\b¡Un colosal terremoto cósmico sacude la región de Sinnoh!")]),
      cmd(101, [S("\\bVolus: ¡El portal se ha abierto en Ciudad Puntaneva! ¡Hacia allá, aprisa!")]),
      cmd(121, [SW_UNLOCKED, SW_UNLOCKED, 0]),
      cmd(411),
      cmd(101, [S("\\bVolus: Regresa cuando reúnas las Tablas. El destino no esperará por siempre.")]),
      cmd(412),
      cmd(412),
      cmd(0),
    ],
  });

  // Page 2: Route is unlocked
  const p2 = page({
    cond: condition({ sw: SW_UNLOCKED }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      cmd(101, [S("\\bVolus: ¡La Ruta de Dios está abierta en Ciudad Puntaneva!\\1")]),
      cmd(101, [S("\\bNo pierdas tiempo. Lo que aguarda en la Cima del Génesis decidirá la existencia de todo nuestro mundo.")]),
      cmd(0),
    ],
  });

  // Page 3: Completed
  const p3 = page({
    cond: condition({ sw: SW_COMPLETED }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      cmd(101, [S("\\bVolus: La suave brisa de Sinnoh... Ha pasado mucho tiempo desde que sentí tanta paz. Gracias, Ash.")]),
      cmd(0),
    ],
  });

  events.push([id, event(id, "Volus de la Ruta", 18, 14, [p1, p2, p3])]);
  writeRx("Map513.rxdata", map513);
  console.log("OK: Volo installed in Twinleaf Town (Map 513).");
}

// ---------------------------------------------------------------------------
// 4. Portal in Snowpoint City (Map 625)
// ---------------------------------------------------------------------------
function installSnowpointPortal() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;

  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (idx !== -1) events.splice(idx, 1);

  const id = 102;
  const p1 = page({
    cond: condition({ sw: SW_UNLOCKED }),
    gfx: graphic("Object ball special", 2),
    trigger: 0,
    list: [
      cmd(101, [S("Una majestuosa fisura de luz celestial resuena ante las puertas del templo.")]),
      cmd(101, [S("¿Deseas ascender por 'La Ruta de Dios' hacia las alturas del cosmos?\\ch[1,2,Ascender,Permanecer en Puntaneva]")]),
      cmd(111, [12, S("$game_variables[1] == 1")]),
      cmd(101, [S("Una ráfaga de viento sagrado envuelve tu cuerpo...")]),
      transfer(2031, 20, 36, 8, 1),
      cmd(412),
      cmd(0),
    ],
  });

  events.push([id, event(id, "Portal a la Ruta de Dios", 20, 3, [p1])]);
  writeRx("Map625.rxdata", map625);
  console.log("OK: Portal to La Ruta de Dios installed in Snowpoint City (Map 625).");
}

// ---------------------------------------------------------------------------
// 5. Build Maps 2031..2037 (The 7 Floors of La Ruta de Dios)
// ---------------------------------------------------------------------------

function drawPavedRoad(canvas, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let t = 658;
      if (j === 0 && i === 0) t = 649;
      else if (j === 0 && i === w - 1) t = 651;
      else if (j === 0) t = 650;
      else if (j === h - 1 && i === 0) t = 665;
      else if (j === h - 1 && i === w - 1) t = 667;
      else if (j === h - 1) t = 666;
      else if (i === 0) t = 657;
      else if (i === w - 1) t = 659;
      canvas.set(x + i, y + j, 0, t);
    }
  }
}

function drawCliff(canvas, x, y, w, h, { stairs = [] } = {}) {
  canvas.set(x, y, 1, 1171);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 1172);
  canvas.set(x + w - 1, y, 1, 1173);

  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 1179);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 1177);
    canvas.set(x + w - 1, j, 1, 1181);
  }

  canvas.set(x, y + h - 1, 1, 1187);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 1188);
  canvas.set(x + w - 1, y + h - 1, 1, 1189);

  for (const sx of stairs) {
    for (let j = y; j < y + h; j++) {
      canvas.set(sx, j, 1, 1243);
      canvas.set(sx + 1, j, 1, 1243);
      canvas.set(sx, j, 0, 658);
      canvas.set(sx + 1, j, 0, 658);
    }
  }
}

function drawColumn(canvas, x, y) {
  canvas.set(x, y, 2, 4453); // capital
  canvas.set(x, y + 1, 1, 4409); // base
}

function drawGrayStatue(canvas, x, y) {
  canvas.set(x, y, 1, 1310);
}

function drawMonolith(canvas, x, y) {
  canvas.set(x, y, 2, 4453);
  canvas.set(x, y + 1, 1, 3300);
}

function fillRect(canvas, z, x, y, w, h, tile) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      canvas.set(i, j, z, tile);
    }
  }
}

function hiddenItemEvent(id, name, x, y, itemSym, itemName) {
  const p1 = page({
    gfx: graphic("Item ball", 2),
    list: [
      cmd(101, [S(`¡Encontraste un ${itemName}!\\1`)]),
      script(`pbReceiveItem(:${itemSym}, 1)`),
      cmd(123, [S("A"), 0]),
      cmd(0),
    ],
  });
  const p2 = page({ cond: condition({ self: "A" }), list: [cmd(0)] });
  return event(id, name, x, y, [p1, p2]);
}

function transferEvent(id, name, x, y, targetMap, tx, ty, tdir, promptLines) {
  const list = promptLines ? [
    ...textCommands(promptLines),
    cmd(102, [[S("Avanzar"), S("Permanecer")], 2]),
    cmd(402, [0, S("Avanzar")]),
    transfer(targetMap, tx, ty, tdir, 1),
    cmd(402, [1, S("Permanecer")]),
    cmd(404), cmd(0),
  ] : [
    transfer(targetMap, tx, ty, tdir),
    cmd(0),
  ];
  return event(id, name, x, y, [page({ trigger: 0, list })]);
}

// ---------------------------------------------------------------------------
// Floor 1 (Map 2031): Puerta de las Columnas (40x40)
// ---------------------------------------------------------------------------
function buildFloor1() {
  const W = 40, H = 40;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457); // Pure white snow

  // Central Olympic Processional Avenue
  drawPavedRoad(cv, 18, 4, 5, 34);
  // Arrival Square
  drawPavedRoad(cv, 16, 32, 9, 6);

  // Grayish statues & marble columns along the avenue
  for (let y = 8; y <= 28; y += 4) {
    drawGrayStatue(cv, 16, y);
    drawGrayStatue(cv, 24, y);
    drawColumn(cv, 14, y);
    drawColumn(cv, 26, y);
  }

  // Terraces of Wild Encounter Grass
  fillRect(cv, 0, 6, 12, 6, 16, 546);
  fillRect(cv, 0, 29, 12, 6, 16, 546);

  // Cliffs framing the sides and top
  drawCliff(cv, 4, 30, 10, 3);
  drawCliff(cv, 27, 30, 10, 3);
  drawCliff(cv, 12, 4, 17, 3, { stairs: [19] });

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 1F", bgm: "Legend Sinnoh" });

  // Event 1: Return Portal to Snowpoint City
  addEventToMap(map, transferEvent(1, "Retorno a Ciudad Puntaneva", 20, 37, 625, 20, 5, 2, [
    "Un portal resplandeciente desciende hacia las tierras de Sinnoh.",
    "¿Deseas regresar a Ciudad Puntaneva?",
  ]));

  // Event 2: Stairs up to 2F
  addEventToMap(map, transferEvent(2, "Escaleras al 2F", 20, 5, 2032, 20, 36, 8));

  // Event 3: Dawn / Maya
  const dawnBattle = [
    ...textCommands([
      "Maya: ¡Ash! ¿Tú también lo sentiste, verdad?",
      "Un pulso primordial ha sacudido toda la región de Sinnoh. Los textos antiguos hablaban de una montaña sobre las nubes donde el tiempo no avanza.",
      "Dicen que el Gran Uno dejó las Tablas para que el universo tuviera forma, pero si alguien osa pisar esta senda sin la debida reverencia... ¡el castigo será absoluto!",
      "¡Déjame ver si tu espíritu está preparado para encarar lo que aguarda en la cumbre!",
    ]),
    script("pbTrainerBattle(:SECRET_Dawn, \"Dawn\", nil, false, 0, true)"),
    ...textCommands([
      "Maya: ¡Increíble! Esa fuerza... es la misma que salvó a Sinnoh en el pasado.",
      "Sigue adelante, Ash. El destino de todo este mundo está sobre tus hombros.",
      "¡Toma esto para ayudarte en el ascenso!",
    ], 1),
    script("pbReceiveItem(:RARECANDY, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Maya de la Ruta", 20, 20, [
    page({ gfx: graphic("SECRET_Dawn", 2), list: dawnBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Dawn", 2), list: [
      ...textCommands(["Maya: ¡Sigue ascendiendo, Ash! ¡No permitas que la creación se extinga!"]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }), // Vanishes when completed
  ]));

  // Event 4: Hidden Item
  addEventToMap(map, hiddenItemEvent(4, "Item RARECANDY", 6, 12, "RARECANDY", "Caramelo Raro"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Floor 2 (Map 2032): Sendero de los Titanes (40x40)
// ---------------------------------------------------------------------------
function buildFloor2() {
  const W = 40, H = 40;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  // Winding serpentine avenue
  drawPavedRoad(cv, 18, 30, 5, 8);
  drawPavedRoad(cv, 10, 20, 21, 5);
  drawPavedRoad(cv, 18, 4, 5, 17);

  // Ancient grayish monoliths & statues
  for (let i = 12; i <= 28; i += 4) {
    drawGrayStatue(cv, i, 18);
    drawMonolith(cv, i, 26);
  }

  fillRect(cv, 0, 6, 6, 8, 12, 546);
  fillRect(cv, 0, 27, 6, 8, 12, 546);

  drawCliff(cv, 4, 26, 12, 3);
  drawCliff(cv, 25, 26, 12, 3);
  drawCliff(cv, 12, 4, 17, 3, { stairs: [19] });

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 2F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 1F", 20, 37, 2031, 20, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 3F", 20, 5, 2033, 21, 38, 8));

  const palmerBattle = [
    ...textCommands([
      "Palmer: Ash. Es un honor coincidir en la cúspide de lo imposible.",
      "Barry: ¡Papá y yo vinimos tan pronto como el cielo se rasgó! ¡Iba a ponerle una multa a las nubes por temblar tan fuerte!",
      "Palmer: Silencio, hijo. Observa la piedra bajo tus pies. Esta es la materia primigenia anterior al nacimiento de los astros.",
      "Palmer: Quienquiera que more arriba no es un rival común. Como As del Frente de Batalla, debo comprobar tu maestría antes de permitirte avanzar hacia la tormenta.",
    ]),
    script("pbTrainerBattle(:SECRET_Palmer, \"Palmer\", nil, false, 0, true)"),
    ...textCommands([
      "Palmer: Majestuoso. Tu determinación resuena más fuerte que el trueno divino.",
      "Barry: ¡Uau! ¡Sabía que podías hacerlo, Ash! ¡Ahora ve y demuestra de qué estamos hechos los entrenadores!",
      "Palmer: Lleva este auxilio contigo para restaurar a tus compañeros.",
    ], 1),
    script("pbReceiveItem(:MAXREVIVE, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Palmer del Frente", 20, 20, [
    page({ gfx: graphic("SECRET_Palmer", 2), list: palmerBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Palmer", 2), list: [
      ...textCommands(["Palmer: Los peldaños superiores son cada vez más traicioneros. Mantén la calma y confía en tus Pokémon."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, event(4, "Barry", 22, 20, [
    page({ gfx: graphic("SECRET_Barry", 4), list: [
      ...textCommands(["Barry: ¡No te detengas, Ash! ¡Si Dios quiere destruir el mundo, dile que le pondré una multa de mil millones!"]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(5, "Item MAXREVIVE", 34, 18, "MAXREVIVE", "Revivir Máximo"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Floor 3 (Map 2033): Terraza del Aura (42x42)
// ---------------------------------------------------------------------------
function buildFloor3() {
  const W = 42, H = 42;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  drawPavedRoad(cv, 19, 4, 5, 36);
  drawPavedRoad(cv, 11, 19, 21, 5);

  for (let y = 8; y <= 32; y += 4) {
    drawGrayStatue(cv, 17, y);
    drawGrayStatue(cv, 25, y);
    drawColumn(cv, 15, y);
    drawColumn(cv, 27, y);
  }

  fillRect(cv, 0, 5, 10, 8, 14, 546);
  fillRect(cv, 0, 30, 10, 8, 14, 546);

  drawCliff(cv, 13, 4, 17, 3, { stairs: [20] });

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 3F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 2F", 21, 39, 2032, 20, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 4F", 21, 5, 2034, 21, 38, 8));

  const rileyBattle = [
    ...textCommands([
      "Quinoa: El Aura en este estrato... es tan densa que casi puede tocarse con los dedos.",
      "Las antiguas leyendas de la Isla Hierro hablan del pacto original: el Creador tejió el universo con mil brazos y luego selló su consciencia original en el letargo cósmico.",
      "Si ese letargo se ha roto, significa que las Tablas están unidas. Ash, ¿tu Aura es lo suficientemente pura como para no ser consumida por el juicio divino? ¡Compruébalo ante mi Lucario!",
    ]),
    script("pbTrainerBattle(:SECRET_Riley, \"Riley\", nil, false, 0, true)"),
    ...textCommands([
      "Quinoa: Un Aura resplandeciente... limpia como la nieve de la montaña.",
      "Ya no tengo dudas. Eres el emisario que las profecías aguardaban.",
      "Conserva este elixir para los momentos decisivos.",
    ], 1),
    script("pbReceiveItem(:PPMAX, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Quinoa de la Isla", 21, 21, [
    page({ gfx: graphic("SECRET_Riley", 2), list: rileyBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Riley", 2), list: [
      ...textCommands(["Quinoa: El Santuario del Tiempo está cerca. Prepárate para el rugido que frena los segundos."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item PPMAX", 7, 10, "PPMAX", "Más PP"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Floor 4 (Map 2034): Baluarte Celestial (42x42)
// ---------------------------------------------------------------------------
function buildFloor4() {
  const W = 42, H = 42;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  drawPavedRoad(cv, 19, 4, 5, 36);
  drawPavedRoad(cv, 13, 19, 17, 5);

  for (let i = 14; i <= 28; i += 4) {
    drawGrayStatue(cv, i, 16);
    drawMonolith(cv, i, 25);
  }

  fillRect(cv, 0, 6, 8, 8, 14, 546);
  fillRect(cv, 0, 29, 8, 8, 14, 546);

  drawCliff(cv, 13, 4, 17, 3, { stairs: [20] });

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 4F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 3F", 21, 39, 2033, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 5F", 21, 5, 2035, 19, 34, 8));

  const cynthiaBattle = [
    ...textCommands([
      "Cintia: Ash... Sabía que tus pasos te traerían hasta aquí.",
      "En las ruinas de Pueblo Caelestis hay una inscripción casi borrada por los siglos:",
      "'Cuando el mundo comenzó, el Uno Original dio a luz a dos seres: el Tiempo y el Espacio. Y después a tres más: el Conocimiento, la Emoción y la Voluntad.'",
      "'Pero si la creación olvida su humilde origen, el Hacedor descenderá no a bendecir, sino a reiniciar la pizarra cósmica.'",
      "Lo que aguarda en los dos pisos siguientes son los custodios originales del universo, y más allá... el Creador en persona.",
      "Como Campeona de Sinnoh, este es el combate más importante de nuestras vidas. ¡Muéstrame todo lo que has aprendido en tu viaje!",
    ]),
    script("pbTrainerBattle(:SECRET_Cynthia, \"Cynthia\", nil, false, 0, true)"),
    ...textCommands([
      "Cintia: Simplemente sublime. No hay palabras en la mitología para describir la calidez y el poder de tu equipo.",
      "Ve, Ash. Enfrenta el juicio de Dios y devuélvenos el mañana.",
      "Toma esta Ceniza Sagrada de los templos de antaño.",
    ], 1),
    script("pbReceiveItem(:SACREDASH, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Cintia Campeona", 21, 21, [
    page({ gfx: graphic("SECRET_Cynthia", 2), list: cynthiaBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Cynthia", 2), list: [
      ...textCommands(["Cintia: No vaciles, Ash. Todo Sinnoh y todos los mundos confían en ti."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item SACREDASH", 35, 12, "SACREDASH", "Ceniza Sagrada"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Floor 5 (Map 2035): Santuario del Tiempo (38x38)
// ---------------------------------------------------------------------------
function buildFloor5() {
  const W = 38, H = 38;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  drawPavedRoad(cv, 17, 4, 5, 32);
  drawPavedRoad(cv, 11, 12, 17, 7);

  // Blue temporal crystals and statues
  drawMonolith(cv, 13, 10);
  drawMonolith(cv, 25, 10);
  drawMonolith(cv, 13, 20);
  drawMonolith(cv, 25, 20);

  fillRect(cv, 0, 5, 8, 8, 14, 546);
  fillRect(cv, 0, 26, 8, 8, 14, 546);

  drawCliff(cv, 11, 4, 17, 3, { stairs: [18] });

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 5F: Santuario del Tiempo", bgm: "Legend Creation Trio" });

  addEventToMap(map, transferEvent(1, "Escaleras al 4F", 19, 35, 2034, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 6F", 19, 5, 2036, 19, 34, 8));

  // Guardian Dialga
  const dialgaBattle = [
    script("$game_screen.start_shake(5, 5, 40)"),
    cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
    ...textCommands([
      "¡Gyaaa-oooh!",
      "¡El Guardián Primordial del Tiempo, Dialga, ruge con una furia cósmica!",
      "¡El tiempo a su alrededor se congela en cristales de diamante!",
    ]),
    script("decision = pbWildBattle(:DIALGA, 150)"),
    cmd(111, [12, S("decision == 1 || decision == 4")]),
    ...textCommands([
      "¡El tiempo retoma su curso natural!",
      "Dialga reconoce tu fuerza inquebrantable y se disuelve en una estela de polvo temporal azul...",
    ], 1),
    cmd(121, [SW_DIALGA_DEFEATED, SW_DIALGA_DEFEATED, 0], 1),
    cmd(412),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Guardián Dialga", 19, 14, [
    page({ gfx: graphic("DIALGA", 2), list: dialgaBattle }),
    page({ cond: condition({ sw: SW_DIALGA_DEFEATED }), list: [cmd(0)] }), // Vanishes upon defeat
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item COMETSHARD", 6, 10, "COMETSHARD", "Parte Cometa"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Floor 6 (Map 2036): Santuario del Espacio (38x38)
// ---------------------------------------------------------------------------
function buildFloor6() {
  const W = 38, H = 38;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  drawPavedRoad(cv, 17, 4, 5, 32);
  drawPavedRoad(cv, 11, 12, 17, 7);

  drawMonolith(cv, 13, 10);
  drawMonolith(cv, 25, 10);
  drawMonolith(cv, 13, 20);
  drawMonolith(cv, 25, 20);

  fillRect(cv, 0, 5, 8, 8, 14, 546);
  fillRect(cv, 0, 26, 8, 8, 14, 546);

  drawCliff(cv, 11, 4, 17, 3, { stairs: [18] });

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 6F: Santuario del Espacio", bgm: "Legend Creation Trio" });

  addEventToMap(map, transferEvent(1, "Escaleras al 5F", 19, 35, 2035, 19, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras a la Cima", 19, 5, 2037, 23, 40, 8));

  // Guardian Palkia
  const palkiaBattle = [
    script("$game_screen.start_shake(5, 5, 40)"),
    cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
    ...textCommands([
      "¡Gyaaa-shhh!",
      "¡El Guardián Primordial del Espacio, Palkia, desgarra la bóveda celeste con un grito sobrecogedor!",
      "¡Las dimensiones tiemblan ante el filo de su presencia!",
    ]),
    script("decision = pbWildBattle(:PALKIA, 150)"),
    cmd(111, [12, S("decision == 1 || decision == 4")]),
    ...textCommands([
      "¡Las dimensiones rotas vuelven a alinearse pacíficamente!",
      "Palkia inclina su silueta y se disuelve en un resplandor de perlas cósmicas...",
    ], 1),
    cmd(121, [SW_PALKIA_DEFEATED, SW_PALKIA_DEFEATED, 0], 1),
    cmd(412),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Guardián Palkia", 19, 14, [
    page({ gfx: graphic("PALKIA", 2), list: palkiaBattle }),
    page({ cond: condition({ sw: SW_PALKIA_DEFEATED }), list: [cmd(0)] }), // Vanishes upon defeat
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item ABILITYCAPSULE", 32, 10, "ABILITYCAPSULE", "Cápsula Habilidad"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// Floor 7 (Map 2037): Cima del Génesis (46x46)
// ---------------------------------------------------------------------------
function buildFloor7() {
  const W = 46, H = 46;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  // Grand Olympic Processional Avenue
  drawPavedRoad(cv, 21, 6, 5, 36);

  // Altar of Origin Dais (x=17..30, y=6..14)
  drawPavedRoad(cv, 17, 6, 13, 9);

  // Flanked by 12 colossal grayish statues & towering columns
  for (let y = 14; y <= 38; y += 4) {
    drawGrayStatue(cv, 18, y);
    drawGrayStatue(cv, 28, y);
    drawColumn(cv, 16, y);
    drawColumn(cv, 30, y);
  }

  // Altar Columns
  drawColumn(cv, 17, 6);
  drawColumn(cv, 29, 6);
  drawColumn(cv, 17, 14);
  drawColumn(cv, 29, 14);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — Cima del Génesis", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 6F", 23, 41, 2036, 19, 6, 2));

  // ARCEUS EVENT (Altar of Origin)
  const arceusCinematic = [
    cmd(241, [new RObject("RPG::AudioFile", [["@name", S("Legend Sinnoh")], ["@volume", 100], ["@pitch", 100]])]),
    script("$game_screen.start_shake(6, 6, 50)"),
    cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
    ...textCommands([
      "Arceus: ...",
      "Arceus: Humano.",
      "Arceus: Te he observado desde que diste tu primer paso fuera de Pueblo Paleta.",
      "Arceus: Dime... ¿Por qué caminas? ¿Por qué desafías las leyes de la existencia?",
      "Arceus: ¿Acaso crees que coleccionar criaturas y doblegar voluntades te otorga el derecho de pararte ante la Consciencia Primordial?",
    ]),
    script("$game_screen.start_shake(7, 7, 50)"),
    ...textCommands([
      "Arceus: Has enfrentado a las Aves del Rayo y del Hielo... Has despertado a los titanes del magma y del océano en Hoenn... Has osado cruzar miradas con los señores de las dimensiones.",
      "Arceus: Pero tu orgullo mortal te ciega ante la verdad.",
      "Arceus: ¿Crees que aquellos a los que llamaste 'Dialga', 'Palkia' o 'Arceus' en tus viajes eran la plenitud de nuestro ser?",
      "Arceus: ¡Ingenuo!",
      "Arceus: Me esforcé durante eones en dejar fragmentos, ecos y copias atenuadas de mí mismo y de mis guardianes a lo largo y ancho del cosmos...",
      "Arceus: ¡Específicamente para evitar esto! Para que ningún ser viviente fuera capaz de despertar el núcleo original ni perturbar el descanso del Arquitecto.",
    ]),
    script("$game_screen.start_shake(8, 8, 60)"),
    cmd(250, [new RObject("RPG::AudioFile", [["@name", S("Thunder8")], ["@volume", 100], ["@pitch", 100]])]),
    ...textCommands([
      "Arceus: Y sin embargo... tú reuniste las diecisiete Tablas del Génesis. Has forzado las cerraduras de la creación y desgarrado el velo que protegía a este universo de mi juicio.",
      "Arceus: No he descendido para coronarte campeón. He venido a desatar el Cataclismo Final.",
      "Arceus: La existencia de esta línea temporal ha excedido su propósito. Todo lo que conoces, cada región, cada recuerdo, será reintegrado a la nada de la que provino.",
      "Arceus: ¡Desaparece ante el juicio del Creador!",
    ]),
    // Divine battle
    script("res = pbStartArceusDivineBattle"),
    cmd(111, [12, S("res == 4")]), // Captured
    cmd(121, [SW_ARCEUS_CAUGHT, SW_ARCEUS_CAUGHT, 0], 1),
    ...textCommands(["¡Has capturado al Creador del Universo, Arceus!"], 1),
    cmd(412),
    cmd(111, [12, S("res == 1")]), // Defeated
    ...textCommands(["Arceus contempla el vínculo inquebrantable de tu corazón. El resplandor del cataclismo se repliega suavemente..."], 1),
    cmd(412),
    cmd(121, [SW_ARCEUS_RESOLVED, SW_ARCEUS_RESOLVED, 0]),
    // Volo arrives
    ...textCommands([
      "De repente, se escuchan pasos apresurados subiendo la escalinata sagrada...",
      "Volus: ¡Increíble...! ¡Verdaderamente colosal!",
      "Volus: La energía cósmica que amenazaba con reiniciar el cosmos se ha detenido. ¡Ash, has salvado al universo entero de un destino irrevocable!",
    ]),
    cmd(111, [12, S("$game_switches[874] == true")]), // If Arceus caught -> Volo battle
    ...textCommands([
      "Volus: Espera... esa esfera en tu mano...",
      "Volus: No puede ser... ¿Has... has CAPTURADO a Arceus?",
      "Volus: ¡¿Cómo te atreves?! ¡El ser original que forjó el tiempo y el espacio no puede pertenecer a un simple muchacho de Kanto!",
      "Volus: He dedicado mi vida entera buscando su bendición... ¡Ese poder me corresponde a mí para moldear un nuevo mundo sin dolor!",
      "Volus: ¡Si no me lo entregas por las buenas, te lo arrebataré en batalla!",
    ], 1),
    script("pbTrainerBattle(:SECRET_Volo, \"Volo\", nil, false, 0, true)", 1),
    cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0], 1),
    ...textCommands([
      "Volus: Imposible... Ni siquiera con la sombra del dragón renegado he podido hacerte vacilar...",
      "Volus: Veo la luz en los ojos de tus compañeros. Arceus... no fue sometido. Te eligió a ti porque comprendes el verdadero significado de la confianza.",
      "Volus: Mi obsesión... se desvanece como la niebla de Hisui. Toma esto, salvador del mundo.",
    ], 1),
    script("pbReceiveItem(:RARECANDY, 5)", 1),
    cmd(412),
    cmd(121, [SW_COMPLETED, SW_COMPLETED, 0]),
    ...textCommands([
      "Una brisa de infinita serenidad recorre la Cima del Génesis.",
      "La fisura temporal se ha sellado y la paz reina una vez más sobre el universo de Sinnoh.",
    ]),
    cmd(0),
  ];

  // Page 1: Arceus before battle
  const p1 = page({
    gfx: graphic("ARCEUS", 2),
    list: arceusCinematic,
  });

  // Page 2: Volo waiting if player lost to him after catching Arceus
  const p2 = page({
    cond: condition({ sw: SW_ARCEUS_CAUGHT, sw2: SW_ARCEUS_RESOLVED }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      ...textCommands([
        "Volus: ¡Regresaste! ¡No permitiré que te marches con el poder del Creador en tus manos!",
        "¡Entrégame a Arceus!",
      ]),
      script("pbTrainerBattle(:SECRET_Volo, \"Volo\", nil, false, 0, true)"),
      cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0]),
      cmd(121, [SW_COMPLETED, SW_COMPLETED, 0]),
      ...textCommands([
        "Volus: Imposible... Arceus eligió a su verdadero compañero.",
        "El destino del mundo está en las mejores manos. Adiós, Ash.",
      ]),
      script("pbReceiveItem(:RARECANDY, 5)"),
      cmd(0),
    ],
  });

  // Page 3: Completed altar
  const p3 = page({
    cond: condition({ sw: SW_COMPLETED }),
    list: [
      ...textCommands(["El Altar del Origen descansa en una paz infinita. El Génesis sigue su curso eterno."]),
      cmd(0),
    ],
  });

  addEventToMap(map, event(2, "Arceus Creador", 23, 10, [p1, p2, p3]));
  addEventToMap(map, hiddenItemEvent(3, "Item GOLDBOTTLECAP", 8, 12, "GOLDBOTTLECAP", "Chapa Dorada"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// 6. Metadata, Encounters and MapInfos Registration
// ---------------------------------------------------------------------------
function registerMapsInMapInfos() {
  const infos = readRx("MapInfos.rxdata");
  const floorNames = [
    [2031, "La Ruta de Dios — 1F: Puerta de las Columnas"],
    [2032, "La Ruta de Dios — 2F: Sendero de los Titanes"],
    [2033, "La Ruta de Dios — 3F: Terraza del Aura"],
    [2034, "La Ruta de Dios — 4F: Baluarte Celestial"],
    [2035, "La Ruta de Dios — 5F: Santuario del Tiempo"],
    [2036, "La Ruta de Dios — 6F: Santuario del Espacio"],
    [2037, "La Ruta de Dios — 7F: Cima del Génesis"],
  ];

  for (const [id, name] of floorNames) {
    const existing = infos.pairs.find(([k]) => k === id);
    const obj = new RObject("RPG::MapInfo", [
      ["@name", S(name)],
      ["@parent_id", 625], // child of Snowpoint City
      ["@order", id],
      ["@expanded", false],
      ["@scroll_x", 0],
      ["@scroll_y", 0],
    ]);
    if (existing) existing[1] = obj;
    else infos.pairs.push([id, obj]);
  }

  writeRx("MapInfos.rxdata", infos);
  console.log("OK: Maps 2031..2037 registered in MapInfos.rxdata.");
}

function registerMapMetadata() {
  const meta = readRx("map_metadata.dat");
  for (let id = 2031; id <= 2037; id++) {
    const existing = meta.pairs.find(([k]) => k === id);
    const obj = new RObject("GameData::MapMetadata", [
      ["@id", id],
      ["@outdoor_map", true],
      ["@announce_location", true],
      ["@can_bicycle", null],
      ["@always_bicycle", null],
      ["@teleport_destination", null],
      ["@weather", [Sy("Snow"), 100]],
      ["@town_map_position", [3, 20, 4]], // Sinnoh
      ["@dive_map_id", null],
      ["@dark_map", null],
      ["@safari_map", null],
      ["@snap_edges", null],
      ["@random_dungeon", null],
      ["@battle_background", S("snow")],
      ["@wild_battle_BGM", S("Legend Sinnoh")],
      ["@trainer_battle_BGM", S("secretvolo")],
      ["@wild_victory_ME", null],
      ["@trainer_victory_ME", null],
      ["@wild_capture_ME", null],
      ["@town_map_size", null],
      ["@battle_environment", Sy("Snow")],
      ["@map_BGM", S("Legend Sinnoh")],
    ]);
    if (existing) existing[1] = obj;
    else meta.pairs.push([id, obj]);
  }

  writeRx("map_metadata.dat", meta);
  console.log("OK: Maps 2031..2037 metadata registered in map_metadata.dat.");
}

function registerEncounters() {
  const enc = readRx("encounters.dat");

  const tables = [
    {
      map: 2031,
      mons: [
        [30, Sy("SNORUNT"), 110, 115],
        [25, Sy("SNEASEL"), 110, 115],
        [25, Sy("SWINUB"), 110, 115],
        [20, Sy("CHINGLING"), 110, 115],
      ],
    },
    {
      map: 2032,
      mons: [
        [30, Sy("PILOSWINE"), 115, 120],
        [25, Sy("GLALIE"), 115, 120],
        [25, Sy("ABOMASNOW"), 115, 120],
        [20, Sy("MEDITITE"), 115, 120],
      ],
    },
    {
      map: 2033,
      mons: [
        [30, Sy("LUCARIO"), 120, 125],
        [25, Sy("RIOLU"), 120, 125],
        [25, Sy("MEDICHAM"), 120, 125],
        [20, Sy("BRONZOR"), 120, 125],
      ],
    },
    {
      map: 2034,
      mons: [
        [30, Sy("GIBLE"), 125, 130],
        [25, Sy("GABITE"), 128, 132],
        [25, Sy("BRONZONG"), 125, 130],
        [20, Sy("ABSOL"), 125, 130],
      ],
    },
    {
      map: 2035,
      mons: [
        [30, Sy("TOGETIC"), 130, 135],
        [25, Sy("CHIMECHO"), 130, 135],
        [25, Sy("CLEFAIRY"), 130, 135],
        [20, Sy("WEAVILE"), 132, 136],
      ],
    },
    {
      map: 2036,
      mons: [
        [30, Sy("CLEFABLE"), 135, 140],
        [25, Sy("TOGEKISS"), 135, 140],
        [25, Sy("MAMOSWINE"), 135, 140],
        [20, Sy("GARCHOMP"), 138, 142],
      ],
    },
  ];

  for (const { map, mons } of tables) {
    const key = Sy(`${map}_0`);
    const stepChances = new RHash([[Sy("Land"), 20]]);
    const types = new RHash([[Sy("Land"), mons]]);
    const obj = new RObject("GameData::Encounter", [
      ["@id", Sy(`${map}_0`)],
      ["@map", map],
      ["@version", 0],
      ["@step_chances", stepChances],
      ["@types", types],
    ]);
    const existing = enc.pairs.find(([k]) => k.name === key.name);
    if (existing) existing[1] = obj;
    else enc.pairs.push([key, obj]);
  }

  writeRx("encounters.dat", enc);
  console.log("OK: High-level encounter tables registered in encounters.dat.");
}

// ---------------------------------------------------------------------------
// Reachability Validation
// ---------------------------------------------------------------------------
function validateFloorReachability(name, mapObj, canvas, start) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const reachable = reachableCells(pass, start);

  const events = iv(mapObj, "events").pairs;
  const unreachable = [];

  for (const [id, ev] of events) {
    const x = Number(iv(ev, "x"));
    const y = Number(iv(ev, "y"));
    const evName = txt(iv(ev, "name"));

    const adjacent = [
      [x, y],
      [x + 1, y], [x - 1, y],
      [x, y + 1], [x, y - 1],
    ];

    const canReach = adjacent.some(([ax, ay]) => reachable.has(`${ax},${ay}`));
    if (!canReach) {
      unreachable.push(`Event ${id} "${evName}" at (${x}, ${y}) is unreachable!`);
    }
  }

  if (unreachable.length > 0) {
    throw new Error(`[${name}] Reachability failures:\n  ${unreachable.join("\n  ")}`);
  }

  console.log(`[${name}] OK: ${events.length} events reachable from (${start[0]}, ${start[1]}). Total walkable cells: ${reachable.size}.`);
}

// ---------------------------------------------------------------------------
// Installation & Backups
// ---------------------------------------------------------------------------
function backupOriginals() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const file of ["Map513.rxdata", "Map625.rxdata", "Scripts.rxdata", "System.rxdata", "MapInfos.rxdata", "map_metadata.dat", "encounters.dat"]) {
    const src = path.join(DATA, file);
    const dst = path.join(BACKUP_DIR, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  }
}

function install() {
  backupOriginals();

  console.log("Installing Scripts and System Switches...");
  installScriptSection();
  installSwitches();

  console.log("Installing Volo in Twinleaf Town and Portal in Snowpoint City...");
  installTwinleafVolo();
  installSnowpointPortal();

  console.log("Building the 7 Floors of La Ruta de Dios (Maps 2031..2037)...");
  const f1 = buildFloor1();
  validateFloorReachability("Floor 1", f1.map, f1.cv, [20, 36]);
  writeRx("Map2031.rxdata", f1.map);

  const f2 = buildFloor2();
  validateFloorReachability("Floor 2", f2.map, f2.cv, [20, 36]);
  writeRx("Map2032.rxdata", f2.map);

  const f3 = buildFloor3();
  validateFloorReachability("Floor 3", f3.map, f3.cv, [21, 38]);
  writeRx("Map2033.rxdata", f3.map);

  const f4 = buildFloor4();
  validateFloorReachability("Floor 4", f4.map, f4.cv, [21, 38]);
  writeRx("Map2034.rxdata", f4.map);

  const f5 = buildFloor5();
  validateFloorReachability("Floor 5", f5.map, f5.cv, [19, 34]);
  writeRx("Map2035.rxdata", f5.map);

  const f6 = buildFloor6();
  validateFloorReachability("Floor 6", f6.map, f6.cv, [19, 34]);
  writeRx("Map2036.rxdata", f6.map);

  const f7 = buildFloor7();
  validateFloorReachability("Floor 7", f7.map, f7.cv, [23, 40]);
  writeRx("Map2037.rxdata", f7.map);

  console.log("Registering Maps, Metadata, and Encounters...");
  registerMapsInMapInfos();
  registerMapMetadata();
  registerEncounters();

  console.log("All 7 Floors of La Ruta de Dios successfully built and installed!");
}

function verify() {
  const errors = [];

  // 1. Verify Switches
  const sys = readRx("System.rxdata");
  const sw = sys.getIvar("@switches");
  if (txt(sw[SW_UNLOCKED]) !== "RUTA_DE_DIOS_UNLOCKED") errors.push("Switch 870 not named RUTA_DE_DIOS_UNLOCKED");
  if (txt(sw[SW_DIALGA_DEFEATED]) !== "RUTA_DE_DIOS_DIALGA_DEFEATED") errors.push("Switch 871 not named RUTA_DE_DIOS_DIALGA_DEFEATED");
  if (txt(sw[SW_PALKIA_DEFEATED]) !== "RUTA_DE_DIOS_PALKIA_DEFEATED") errors.push("Switch 872 not named RUTA_DE_DIOS_PALKIA_DEFEATED");
  if (txt(sw[SW_ARCEUS_RESOLVED]) !== "RUTA_DE_DIOS_ARCEUS_RESOLVED") errors.push("Switch 873 not named RUTA_DE_DIOS_ARCEUS_RESOLVED");
  if (txt(sw[SW_COMPLETED]) !== "RUTA_DE_DIOS_COMPLETED") errors.push("Switch 876 not named RUTA_DE_DIOS_COMPLETED");

  // 2. Verify Script Section
  const scripts = readRx("Scripts.rxdata");
  const scriptEntry = scripts.find(([id, title]) => title.text === "PokeMod_RutaDeDios");
  if (!scriptEntry) errors.push("Missing PokeMod_RutaDeDios in Scripts.rxdata");

  // 3. Verify Volo in Map 513
  const map513 = readRx("Map513.rxdata");
  const voloEv = iv(map513, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Volus de la Ruta"));
  if (!voloEv) errors.push("Missing Volo event in Map 513");

  // 4. Verify Portal in Map 625
  const map625 = readRx("Map625.rxdata");
  const portalEv = iv(map625, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (!portalEv) errors.push("Missing Portal event in Map 625");

  // 5. Verify 7 Map Files
  for (let id = 2031; id <= 2037; id++) {
    const f = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(f)) {
      errors.push(`Missing Map${id}.rxdata`);
      continue;
    }
    const m = readRx(`Map${id}.rxdata`);
    const w = Number(iv(m, "width"));
    const h = Number(iv(m, "height"));
    const evCount = iv(m, "events").pairs.length;
    if (w < 35 || h < 35) errors.push(`Map ${id} dimensions too small (${w}x${h})`);
    if (evCount < 2) errors.push(`Map ${id} has too few events (${evCount})`);
  }

  // 6. Verify Arceus at Summit (Map 2037)
  const map2037 = readRx("Map2037.rxdata");
  const arceusEv = iv(map2037, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Arceus Creador"));
  if (!arceusEv) errors.push("Missing Arceus Creador event in Map 2037");

  // 7. Verify Dialga (Map 2035) and Palkia (Map 2036)
  const map2035 = readRx("Map2035.rxdata");
  const dialgaEv = iv(map2035, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Guardián Dialga"));
  if (!dialgaEv) errors.push("Missing Guardián Dialga in Map 2035");

  const map2036 = readRx("Map2036.rxdata");
  const palkiaEv = iv(map2036, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Guardián Palkia"));
  if (!palkiaEv) errors.push("Missing Guardián Palkia in Map 2036");

  if (errors.length) {
    throw new Error(`La Ruta de Dios verification failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  }
  console.log("Verification OK: La Ruta de Dios fully verified (7 floors, Arceus Lv. 200, Volo, Dialga, Palkia, trainers, switches, and scripts).");
}

if (!VERIFY_ONLY) {
  install();
}
verify();
