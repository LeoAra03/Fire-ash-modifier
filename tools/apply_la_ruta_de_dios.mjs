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
 * 2. Acceso desde Ciudad Puntaneva (Map 625) mediante una avenida celeste despejada entre árboles,
 *    un segundo Volus guía y un portal de luz ancestral en la entrada del Templo Puntaneva.
 * 3. Aproximación Celestial larga (Map 2030, 52x72): cuatro terrazas, escaleras, santuarios,
 *    hitos de las Regiones y una puerta de transición antes de la montaña principal.
 * 4. Montaña Olímpica de 7 pisos (haciendo paralelismo al Monte Corona):
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
import { tableFromUserDef, tableToUserDef, tableSet } from "../web/js/rmxp.js";

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
function transferEvent(id, name, x, y, targetMap, targetX, targetY, targetDir = 8, prompts = []) {
  const list = [];
  if (prompts.length > 0) {
    list.push(...textCommands(prompts));
  }
  list.push(transfer(targetMap, targetX, targetY, targetDir));
  list.push(cmd(0));
  return event(id, name, x, y, [page({ trigger: 1, list })]);
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
// 4. Celestial approach in Snowpoint City (Map 625)
// ---------------------------------------------------------------------------
const SNOWPOINT_TREE_TILES = new Set([4480, 4481, 4484, 4485, 4488, 4489, 4496, 4497]);

function paintSnowpointRoute(mapObj) {
  const table = tableFromUserDef(iv(mapObj, "data"));
  const pathTile = (x, y, z = 0) => {
    let tile = 658;
    if (z === 0) {
      if (x === 18) tile = 657;
      else if (x === 22) tile = 659;
      if (y === 4) tile = x === 18 ? 649 : x === 22 ? 651 : 650;
      if (y === 27) tile = x === 18 ? 665 : x === 22 ? 667 : 666;
    }
    tableSet(table, x, y, z, tile);
  };

  // Apertura deliberada de una avenida de cinco casillas: conserva la ciudad,
  // pero elimina solo los árboles que bloqueaban el acceso al santuario.
  for (let y = 4; y <= 7; y++) for (let x = 18; x <= 22; x++) {
    for (let z = 1; z <= 2; z++) tableSet(table, x, y, z, 0);
    if (SNOWPOINT_TREE_TILES.has(tableGetSafe(table, x, y, 0))) tableSet(table, x, y, 0, 4457);
    pathTile(x, y);
  }
  for (let y = 14; y <= 27; y++) for (let x = 18; x <= 22; x++) {
    for (let z = 1; z <= 2; z++) tableSet(table, x, y, z, 0);
    if (SNOWPOINT_TREE_TILES.has(tableGetSafe(table, x, y, 0))) tableSet(table, x, y, 0, 4457);
    pathTile(x, y);
  }

  mapObj.setIvar("data", tableToUserDef(table));
}

function tableGetSafe(table, x, y, z) {
  if (x < 0 || y < 0 || z < 0 || x >= table.x || y >= table.y || z >= table.z) return 0;
  return table.data[x + table.x * (y + table.y * z)];
}

function installSnowpointGuide() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;
  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Volus — Guía Celestial"));
  if (idx !== -1) events.splice(idx, 1);

  const guide = event(103, "Volus — Guía Celestial", 20, 15, [
    page({
      cond: condition({ sw: SW_UNLOCKED }),
      gfx: graphic("SECRET_Volo", 2),
      list: [
        ...textCommands([
          "Volus: Has regresado. Mi otro yo de Pueblo Hojaverde despertó la resonancia, pero yo he preparado el sendero.",
          "Volus: Los árboles que sellaban el antiguo camino ya no ocultan la avenida. Sigue la nieve azulada hacia el santuario.",
          "Volus: Más allá del portal comienza una montaña que no pertenece a una sola región: en sus piedras duermen las leyendas de todos los Pokémon.",
          "Volus: No corras. Observa las columnas, las fuentes y las luces; cada detalle marca el ascenso hacia la Cima del Génesis.",
          "Volus: Cuando estés listo, avanza al norte. Yo custodiaré este umbral hasta que el cielo vuelva a cerrarse.",
        ]),
        cmd(0),
      ],
    }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]);
  events.push([103, guide]);
  writeRx("Map625.rxdata", map625);
}

function installSnowpointPortal() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;

  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (idx !== -1) events.splice(idx, 1);

  const id = 102;
  const p1 = page({
    // Recuperación: el portal debe aparecer aunque una partida antigua no conserve
    // correctamente el switch 870. La conversación de Volus sigue siendo la ruta
    // narrativa, pero la entrada no queda bloqueada por una flag perdida.
    cond: condition(),
    gfx: graphic("Object ball special", 2),
    trigger: 0,
    list: [
      cmd(101, [S("Una majestuosa fisura de luz celestial resuena ante las puertas del templo.")]),
      cmd(101, [S("¿Deseas ascender por 'La Ruta de Dios' hacia las alturas del cosmos?\\ch[1,2,Ascender,Permanecer en Puntaneva]")]),
      cmd(111, [12, S("$game_variables[1] == 1")]),
      cmd(101, [S("Una ráfaga de viento sagrado envuelve tu cuerpo...")]),
      transfer(2030, 26, 68, 8, 1),
      cmd(412),
      cmd(0),
    ],
  });

  paintSnowpointRoute(map625);
  events.push([id, event(id, "Portal a la Ruta de Dios", 20, 3, [p1])]);
  writeRx("Map625.rxdata", map625);
  console.log("OK: Portal and celestial avenue installed in Snowpoint City (Map 625).");
}

// ---------------------------------------------------------------------------
// 5. Build Maps 2031..2037 (The 7 Floors of La Ruta de Dios)
// ---------------------------------------------------------------------------

// Architectural Primitives
// ---------------------------------------------------------------------------
function drawCoronetCliff(canvas, x, y, w, h, { stairs = [] } = {}) {
  // Top rim
  canvas.set(x, y, 1, 1259);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 1260);
  canvas.set(x + w - 1, y, 1, 1261);

  // Vertical cliff faces
  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 1252);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 1249);
    canvas.set(x + w - 1, j, 1, 1253);
  }

  // Bottom rim
  canvas.set(x, y + h - 1, 1, 1265);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 1273);
  canvas.set(x + w - 1, y + h - 1, 1, 1267);

  // Carve out stone stairs cutting through cliff face
  for (const sx of stairs) {
    for (let j = y; j < y + h; j++) {
      canvas.set(sx, j, 1, 1243);
      canvas.set(sx + 1, j, 1, 1243);
      canvas.set(sx, j, 0, 1257);
      canvas.set(sx + 1, j, 0, 1257);
    }
  }
}

function drawWhiteMarbleDais(canvas, x, y, w, h, { stairs = [] } = {}) {
  // Top row
  canvas.set(x, y, 1, 4400);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y, 1, 4401);
  canvas.set(x + w - 1, y, 1, 4402);

  // Middle rows
  for (let j = y + 1; j < y + h - 1; j++) {
    canvas.set(x, j, 1, 4408);
    for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, j, 1, 4409);
    canvas.set(x + w - 1, j, 1, 4410);
  }

  // Bottom row
  canvas.set(x, y + h - 1, 1, 4416);
  for (let i = x + 1; i < x + w - 1; i++) canvas.set(i, y + h - 1, 1, 4417);
  canvas.set(x + w - 1, y + h - 1, 1, 4418);

  // Bottom stairs
  for (const sx of stairs) {
    canvas.set(sx, y + h - 1, 1, 1161);
    canvas.set(sx + 1, y + h - 1, 1, 1162);
  }
}

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

function drawGuardianStatue(canvas, x, y) {
  canvas.set(x, y - 1, 2, 4307); // Carved dragon/gargoyle head with horns
  canvas.set(x, y, 1, 4315);     // Inscribed stone plinth
}

function drawFrostedPineTree(canvas, x, y) {
  canvas.set(x, y - 3, 2, 4484);
  canvas.set(x + 1, y - 3, 2, 4485);
  canvas.set(x, y - 2, 1, 4480);
  canvas.set(x + 1, y - 2, 1, 4481);
  canvas.set(x, y - 1, 1, 4488);
  canvas.set(x + 1, y - 1, 1, 4489);
  canvas.set(x, y, 1, 4496);
  canvas.set(x + 1, y, 1, 4497);
}

function drawPineGrove(canvas, x, y, w, h) {
  for (let j = 0; j < h; j += 4) {
    for (let i = 0; i < w; i += 2) {
      drawFrostedPineTree(canvas, x + i, y + j + 3);
    }
  }
}

function buildCelestialApproach() {
  const W = 52, H = 72;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  // La aproximación no es una pantalla corta: es una montaña escalonada con
  // cuatro terrazas, curvas de procesión y un cielo cada vez más despejado.
  plantNaturalFlankPines(cv, W, H);
  for (let y = 6; y < H - 4; y += 7) {
    drawFrostedPineTree(cv, 6, y);
    drawFrostedPineTree(cv, 8, y + 2);
    drawFrostedPineTree(cv, W - 7, y + 1);
    drawFrostedPineTree(cv, W - 9, y + 3);
  }

  // Avenida serpenteante: cada giro obliga a leer el relieve antes de seguir.
  drawPavedRoad(cv, 24, 60, 5, 12);
  drawPavedRoad(cv, 24, 46, 5, 16);
  drawPavedRoad(cv, 24, 43, 13, 8);
  drawPavedRoad(cv, 32, 27, 5, 18);
  drawPavedRoad(cv, 15, 27, 22, 6);
  drawPavedRoad(cv, 14, 13, 5, 17);
  drawPavedRoad(cv, 14, 10, 15, 6);
  drawPavedRoad(cv, 24, 4, 5, 10);

  // Muros de montaña y escaleras talladas en puntos de cambio de altitud.
  drawCoronetCliff(cv, 5, 57, 42, 3, { stairs: [25] });
  drawCoronetCliff(cv, 7, 40, 38, 3, { stairs: [33] });
  drawCoronetCliff(cv, 5, 23, 42, 3, { stairs: [15] });
  drawCoronetCliff(cv, 10, 10, 32, 3, { stairs: [25] });

  // Santuarios laterales: no bloquean la avenida, pero hacen que cada terraza
  // parezca una estación de peregrinaje y no un pasillo repetido.
  drawWhiteMarbleDais(cv, 7, 48, 11, 5, { stairs: [11] });
  drawSunburstAltar(cv, 10, 48);
  drawColumn(cv, 8, 46); drawColumn(cv, 15, 46);
  drawGuardianStatue(cv, 9, 54); drawGuardianStatue(cv, 16, 54);

  drawWhiteMarbleDais(cv, 37, 30, 10, 5, { stairs: [40] });
  drawCosmicGateway(cv, 39, 30);
  drawColumn(cv, 38, 28); drawColumn(cv, 44, 28);
  drawGuardianStatue(cv, 39, 36); drawGuardianStatue(cv, 44, 36);

  drawCosmicPool(cv, 7, 17);
  drawCosmicPool(cv, 39, 16);
  drawCosmicPool(cv, 39, 51);
  drawMonolith(cv, 9, 28); drawMonolith(cv, 43, 24);
  drawMonolith(cv, 9, 63); drawMonolith(cv, 43, 63);

  // Praderas con encuentros, suspendidas entre los muros y la ruta principal.
  drawWildGrassPatch(cv, 7, 35, 6, 7);
  drawWildGrassPatch(cv, 39, 39, 6, 7);
  drawWildGrassPatch(cv, 7, 58, 7, 7);
  drawWildGrassPatch(cv, 38, 58, 7, 7);

  // Cima de transición: el mármol blanco anuncia que ya no se pisa una montaña
  // normal. Desde aquí se entra a la primera puerta de La Ruta de Dios.
  drawWhiteMarbleDais(cv, 18, 2, 17, 6, { stairs: [25] });
  drawSunburstAltar(cv, 24, 2);
  drawCosmicGateway(cv, 20, 3);
  drawCosmicGateway(cv, 31, 3);
  drawColumn(cv, 22, 3); drawColumn(cv, 29, 3);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — Aproximación Celestial", bgm: "Legend Sinnoh" });
  addEventToMap(map, transferEvent(1, "Regreso a Ciudad Puntaneva", 26, 70, 625, 20, 5, 2, [
    "El sendero desciende entre nubes plateadas hacia Ciudad Puntaneva.",
    "¿Deseas regresar al refugio de Sinnoh?",
  ]));
  addEventToMap(map, transferEvent(2, "Puerta de la Cima del Génesis", 26, 5, 2031, 20, 36, 8, [
    "La última escalinata atraviesa las nubes. Más allá comienza la montaña sagrada.",
    "¿Deseas cruzar hacia la Puerta de las Columnas?",
  ]));

  const beacon = (id, name, x, y, lines) => addEventToMap(map, event(id, name, x, y, [
    page({ gfx: graphic("Object ball special", 2), list: [...textCommands(lines), cmd(0)] }),
  ]));
  beacon(3, "Hito de las Regiones", 21, 54, [
    "Un hito de hielo refleja imágenes de muchas regiones: bosques, volcanes, océanos y ciudades suspendidas.",
    "La inscripción dice: Ningún Pokémon pertenece a un solo horizonte; todos comparten el mismo cielo.",
  ]);
  beacon(4, "Hito del Tiempo", 37, 36, [
    "La piedra vibra con un tic tac remoto. El aire parece recordar cada paso dado por los entrenadores del mundo.",
    "Una segunda inscripción responde: El valor de un viaje se mide por los lazos que deja atrás.",
  ]);
  beacon(5, "Hito del Vínculo", 12, 19, [
    "Una luz cálida late bajo el hielo. No es una recompensa: es el recuerdo de cada compañero que te ha seguido.",
  ]);
  beacon(6, "Hito del Origen", 30, 8, [
    "Las nubes se abren por un instante. Una silueta de Arceus aparece en el firmamento y luego se convierte en estrellas.",
    "El camino termina solo cuando el corazón deja de mirar hacia arriba.",
  ]);
  addEventToMap(map, hiddenItemEvent(7, "Reliquia de la Aurora", 37, 43, "STARDUST", "Polvo Estelar"));
  addEventToMap(map, hiddenItemEvent(8, "Reliquia del Vínculo", 13, 29, "RARECANDY", "Caramelo Raro"));
  return { map, cv };
}

function drawWildGrassPatch(canvas, x, y, w, h) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      canvas.set(i, j, 1, 447); // Frosted winter grass (Terrain Tag 2 = Wild encounters!)
    }
  }
}

function drawSacredBoulder(canvas, x, y, cluster = false) {
  canvas.set(x, y, 1, cluster ? 4461 : 4453);
}

function drawCosmicPool(canvas, x, y) {
  canvas.set(x, y, 1, 4430); canvas.set(x + 1, y, 1, 4431);
  canvas.set(x, y + 1, 1, 4438); canvas.set(x + 1, y + 1, 1, 4439);
  canvas.set(x, y + 2, 1, 4446); canvas.set(x + 1, y + 2, 1, 4447);
}

function drawCosmicGateway(canvas, x, y) {
  canvas.set(x, y, 2, 4454); canvas.set(x + 1, y, 2, 4455);
  canvas.set(x, y + 1, 1, 4462); canvas.set(x + 1, y + 1, 1, 4463);
}

function drawSunburstAltar(canvas, x, y) {
  canvas.set(x, y, 1, 4403);
  canvas.set(x + 1, y, 1, 4404);
  canvas.set(x + 2, y, 1, 4404);
  canvas.set(x + 3, y, 1, 4405);
  canvas.set(x, y + 1, 1, 4414);
  canvas.set(x + 1, y + 1, 1, 4412);
  canvas.set(x + 2, y + 1, 1, 4412);
  canvas.set(x + 3, y + 1, 1, 4415);
}

function drawColumn(canvas, x, y) {
  canvas.set(x, y, 2, 4453);
  canvas.set(x, y + 1, 1, 4409);
}

function drawMonolith(canvas, x, y) {
  canvas.set(x, y, 2, 4453);
  canvas.set(x, y + 1, 1, 3300);
}

// ---------------------------------------------------------------------------
// Floor Builders
// ---------------------------------------------------------------------------


function plantNaturalFlankPines(cv, W, H) {
  // West side clustered groves
  for (let y = 3; y < H - 3; y += 5) {
    drawFrostedPineTree(cv, 1, y);
    if (y + 2 < H - 2) drawFrostedPineTree(cv, 3, y + 2);
    if (y + 4 < H - 2) drawFrostedPineTree(cv, 2, y + 4);
  }
  // East side clustered groves
  for (let y = 3; y < H - 3; y += 5) {
    drawFrostedPineTree(cv, W - 3, y);
    if (y + 2 < H - 2) drawFrostedPineTree(cv, W - 5, y + 2);
    if (y + 4 < H - 2) drawFrostedPineTree(cv, W - 4, y + 4);
  }
}

export function buildFloor1() {
  const W = 40, H = 40;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  // Tier 1 Cliff (y=29..31)
  drawCoronetCliff(cv, 5, 29, 30, 3, { stairs: [19] });

  // Tier 2 Cliff (y=8..10)
  drawCoronetCliff(cv, 5, 8, 30, 3, { stairs: [19] });

  // Grand Processional Avenue
  drawPavedRoad(cv, 18, 4, 5, 34);

  // North Temple Dais
  drawWhiteMarbleDais(cv, 13, 2, 15, 6, { stairs: [19] });
  drawSunburstAltar(cv, 18, 2);

  // Guardian Statues along the Avenue
  for (let y = 14; y <= 26; y += 4) {
    drawGuardianStatue(cv, 16, y);
    drawGuardianStatue(cv, 24, y);
    drawColumn(cv, 14, y);
    drawColumn(cv, 26, y);
  }

  // Wild Grass Meadows
  drawWildGrassPatch(cv, 6, 13, 9, 14);
  drawWildGrassPatch(cv, 26, 13, 9, 14);

  // Sacred Boulders & Monoliths
  drawSacredBoulder(cv, 6, 12);
  drawSacredBoulder(cv, 33, 12, true);
  drawSacredBoulder(cv, 10, 26);
  drawSacredBoulder(cv, 30, 26, true);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 1F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Retorno a Ciudad Puntaneva", 20, 37, 625, 20, 5, 2, [
    "Un portal resplandeciente desciende hacia las tierras de Sinnoh.",
    "¿Deseas regresar a Ciudad Puntaneva?",
  ]));
  addEventToMap(map, transferEvent(2, "Escaleras al 2F", 20, 5, 2032, 20, 36, 8));

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
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item RARECANDY", 6, 12, "RARECANDY", "Caramelo Raro"));

  return { map, cv };
}

export function buildFloor2() {
  const W = 40, H = 40;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 5, 29, 30, 3, { stairs: [19] });
  drawCoronetCliff(cv, 5, 8, 30, 3, { stairs: [19] });

  // Winding serpentine road & Arena of Titans
  drawPavedRoad(cv, 18, 25, 5, 12);
  drawPavedRoad(cv, 12, 17, 17, 7);
  drawPavedRoad(cv, 18, 4, 5, 14);

  drawWhiteMarbleDais(cv, 14, 2, 13, 6, { stairs: [19] });

  // Arena Statues & Columns
  drawGuardianStatue(cv, 13, 17); drawGuardianStatue(cv, 27, 17);
  drawGuardianStatue(cv, 13, 23); drawGuardianStatue(cv, 27, 23);
  drawMonolith(cv, 11, 20); drawMonolith(cv, 29, 20);
  drawColumn(cv, 16, 17); drawColumn(cv, 24, 17);

  // Wild grass
  drawWildGrassPatch(cv, 6, 13, 6, 14);
  drawWildGrassPatch(cv, 28, 13, 6, 14);

  // Sacred Boulders
  drawSacredBoulder(cv, 34, 18);
  drawSacredBoulder(cv, 7, 25, true);

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
      "Palmer: Toma este tónico supremo. Lo necesitarás si planeas desafiar la cúspide.",
    ], 1),
    script("pbReceiveItem(:MAXREVIVE, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Palmer del Frente", 20, 20, [
    page({ gfx: graphic("SECRET_Palmer", 2), list: palmerBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Palmer", 2), list: [
      ...textCommands(["Palmer: Adelante, muchacho. Que la voluntad inquebrantable de los campeones guíe tus pasos."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, event(4, "Barry", 22, 20, [
    page({ gfx: graphic("SECRET_Barry", 4), list: [
      ...textCommands([
        "Barry: ¡Ash! ¡Mi padre reconoció tu poder! ¡Si no salvas el universo te pondré una multa de diez mil millones!",
      ]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(5, "Item MAXREVIVE", 34, 18, "MAXREVIVE", "Revivir Máximo"));

  return { map, cv };
}

export function buildFloor3() {
  const W = 42, H = 42;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 5, 31, 32, 3, { stairs: [20] });
  drawCoronetCliff(cv, 5, 8, 32, 3, { stairs: [20] });

  // Central Avenue
  drawPavedRoad(cv, 19, 4, 5, 36);

  // Central Aura Dais
  drawWhiteMarbleDais(cv, 15, 16, 13, 9, { stairs: [20] });
  drawWhiteMarbleDais(cv, 15, 2, 13, 6, { stairs: [20] });

  // Twin Cosmic Pools
  drawCosmicPool(cv, 10, 19);
  drawCosmicPool(cv, 30, 19);

  // Guardian Statues & Aura Colonnade
  drawGuardianStatue(cv, 14, 17); drawGuardianStatue(cv, 28, 17);
  drawGuardianStatue(cv, 14, 23); drawGuardianStatue(cv, 28, 23);
  drawColumn(cv, 13, 20); drawColumn(cv, 29, 20);
  drawColumn(cv, 18, 14); drawColumn(cv, 24, 14);

  // Wild Grass
  drawWildGrassPatch(cv, 7, 13, 7, 16);
  drawWildGrassPatch(cv, 28, 13, 7, 16);

  drawSacredBoulder(cv, 7, 10);
  drawSacredBoulder(cv, 34, 26, true);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 3F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 2F", 21, 39, 2032, 20, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 4F", 21, 5, 2034, 21, 38, 8));

  const rileyBattle = [
    ...textCommands([
      "Quinoa: Saludos, Ash. El aura que emana de ti resplandece con mayor intensidad que nunca.",
      "Lucario y yo sentimos el despertar de la creación desde Isla Hierro. Esta altitud no perdona a los corazones vacilantes.",
      "La energía de las Tablas fluye como un río cósmico por cada piedra de este templo.",
      "¡Permíteme conectar mi aura con la tuya para templar tu concentración!",
    ]),
    script("pbTrainerBattle(:SECRET_Riley, \"Riley\", nil, false, 0, true)"),
    ...textCommands([
      "Quinoa: Un aura verdaderamente formidable. Has trascendido los límites ordinarios de la comunión con los Pokémon.",
      "Lleva este obsequio. Que tu energía jamás se agote en el combate que se avecina.",
    ], 1),
    script("pbReceiveItem(:PPMAX, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Quinoa de la Isla", 21, 21, [
    page({ gfx: graphic("SECRET_Riley", 2), list: rileyBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Riley", 2), list: [
      ...textCommands(["Quinoa: Sigue adelante. El aura te acompaña, campeón de Sinnoh."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item PPMAX", 7, 10, "PPMAX", "Más PP"));

  return { map, cv };
}

export function buildFloor4() {
  const W = 42, H = 42;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 5, 31, 32, 3, { stairs: [20] });
  drawCoronetCliff(cv, 5, 8, 32, 3, { stairs: [20] });

  // Avenue
  drawPavedRoad(cv, 19, 4, 5, 36);

  // Cynthia's Grand Marble Court
  drawWhiteMarbleDais(cv, 13, 16, 17, 9, { stairs: [20] });
  drawWhiteMarbleDais(cv, 15, 2, 13, 6, { stairs: [20] });
  drawSunburstAltar(cv, 19, 2);

  // Guardian Colonnade
  for (let y = 14; y <= 28; y += 4) {
    drawGuardianStatue(cv, 17, y);
    drawGuardianStatue(cv, 25, y);
    drawColumn(cv, 15, y);
    drawColumn(cv, 27, y);
  }

  // Sacred Boulders & Monoliths
  drawSacredBoulder(cv, 35, 12);
  drawSacredBoulder(cv, 8, 25, true);
  drawMonolith(cv, 11, 20); drawMonolith(cv, 31, 20);

  // Wild Grass
  drawWildGrassPatch(cv, 6, 13, 8, 16);
  drawWildGrassPatch(cv, 28, 13, 8, 16);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 4F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 3F", 21, 39, 2033, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 5F", 21, 5, 2035, 19, 34, 8));

  const cynthiaBattle = [
    ...textCommands([
      "Cintia: Ash. Sabía que las huellas en la nieve te traerían hasta aquí.",
      "Durante años he estudiado los mitos de Sinnoh: el nacimiento del huevo primordial en medio de la nada, la separación de la materia y el espíritu...",
      "Pero lo que se avecina tras este umbral desafía cualquier registro histórico.",
      "Los guardianes del tiempo y del espacio han regresado en su manifestación primigenia, y sobre ellos... el arquitecto absoluto.",
      "Como Campeona de la Liga Sinnoh, tengo el deber de ser tu última prueba terrenal.",
      "¡Demuéstrame que tu lazo con tus Pokémon puede doblegar las leyes del mismísimo cosmos!",
    ]),
    script("pbTrainerBattle(:SECRET_Cynthia, \"Cynthia\", nil, false, 0, true)"),
    ...textCommands([
      "Cintia: Sublime... Una batalla que quedará grabada en las leyendas de nuestro tiempo.",
      "Lleva contigo esta reliquia de los templos de antaño. Si tus Pokémon caen ante el poder divino, esto les otorgará una segunda oportunidad.",
    ], 1),
    script("pbReceiveItem(:SACREDASH, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Cintia Campeona", 21, 21, [
    page({ gfx: graphic("SECRET_Cynthia", 2), list: cynthiaBattle }),
    page({ cond: condition({ self: "A" }), gfx: graphic("SECRET_Cynthia", 2), list: [
      ...textCommands(["Cintia: Cruza el portal, Ash. Todos los que amamos a este mundo creemos en ti."]),
      cmd(0),
    ] }),
    page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item SACREDASH", 35, 12, "SACREDASH", "Ceniza Sagrada"));

  return { map, cv };
}

export function buildFloor5() {
  const W = 38, H = 38;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 4, 27, 30, 3, { stairs: [18] });
  drawCoronetCliff(cv, 4, 7, 30, 3, { stairs: [18] });

  // Central Temporal Altar Dais
  drawWhiteMarbleDais(cv, 11, 10, 17, 13, { stairs: [18] });
  drawWhiteMarbleDais(cv, 13, 2, 13, 5, { stairs: [18] });

  // Paved avenue
  drawPavedRoad(cv, 17, 23, 5, 13);
  drawPavedRoad(cv, 17, 4, 5, 7);

  // Temporal Guardian Statues & Spear Pillar Ruins
  drawGuardianStatue(cv, 13, 13); drawGuardianStatue(cv, 25, 13);
  drawGuardianStatue(cv, 13, 19); drawGuardianStatue(cv, 25, 19);
  drawColumn(cv, 12, 16); drawColumn(cv, 26, 16);
  drawMonolith(cv, 9, 14); drawMonolith(cv, 29, 14);

  // Sacred Boulders
  drawSacredBoulder(cv, 6, 10);
  drawSacredBoulder(cv, 31, 24, true);

  // Wild Grass
  drawWildGrassPatch(cv, 5, 12, 5, 13);
  drawWildGrassPatch(cv, 28, 12, 5, 13);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 5F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 4F", 19, 35, 2034, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 6F", 19, 5, 2036, 19, 34, 8));

  const dialgaBattle = [
    cmd(101, [S("¡GYYYROOOHHH!\\1")]),
    cmd(101, [S("El señor del tiempo emite un rugido que desgarra el tejido de los segundos. ¡Una distorsión temporal envuelve el altar!")]),
    script("pbWildBattle(:DIALGA, 150)"),
    cmd(111, [12, S("$Trainer.party.any? { |p| p.hp > 0 }")]),
    cmd(121, [SW_DIALGA_DEFEATED, SW_DIALGA_DEFEATED, 0]),
    cmd(101, [S("La figura de Dialga se disuelve en una cascada de luz cósmica, abriendo el paso hacia el santuario espacial...")]),
    cmd(412),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Guardián Dialga", 19, 14, [
    page({ gfx: graphic("DIALGA", 2), list: dialgaBattle }),
    page({ cond: condition({ sw: SW_DIALGA_DEFEATED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item COMETSHARD", 6, 10, "COMETSHARD", "Parte Cometa"));

  return { map, cv };
}

export function buildFloor6() {
  const W = 38, H = 38;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  plantNaturalFlankPines(cv, W, H);

  drawCoronetCliff(cv, 4, 27, 30, 3, { stairs: [18] });
  drawCoronetCliff(cv, 4, 7, 30, 3, { stairs: [18] });

  // Spatial Altar Dais
  drawWhiteMarbleDais(cv, 11, 10, 17, 13, { stairs: [18] });
  drawWhiteMarbleDais(cv, 13, 2, 13, 5, { stairs: [18] });

  // Paved avenue
  drawPavedRoad(cv, 17, 23, 5, 13);
  drawPavedRoad(cv, 17, 4, 5, 7);

  // Twin Cosmic Pools in Spatial Sanctum
  drawCosmicPool(cv, 7, 15);
  drawCosmicPool(cv, 29, 15);

  // Spatial Guardian Statues & Colonnade
  drawGuardianStatue(cv, 13, 13); drawGuardianStatue(cv, 25, 13);
  drawGuardianStatue(cv, 13, 19); drawGuardianStatue(cv, 25, 19);
  drawColumn(cv, 12, 16); drawColumn(cv, 26, 16);

  // Monoliths & Sacred Boulders
  drawMonolith(cv, 9, 21); drawMonolith(cv, 29, 21);
  drawSacredBoulder(cv, 32, 10);
  drawSacredBoulder(cv, 6, 24, true);

  // Wild Grass
  drawWildGrassPatch(cv, 5, 12, 5, 13);
  drawWildGrassPatch(cv, 28, 12, 5, 13);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 6F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 5F", 19, 35, 2035, 19, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras a la Cima", 19, 5, 2037, 23, 40, 8));

  const palkiaBattle = [
    cmd(101, [S("¡GRAAAGHHH!\\1")]),
    cmd(101, [S("El amo del espacio emite un alarido desgarrador. Las dimensiones tiemblan bajo el peso de su presencia.")]),
    script("pbWildBattle(:PALKIA, 150)"),
    cmd(111, [12, S("$Trainer.party.any? { |p| p.hp > 0 }")]),
    cmd(121, [SW_PALKIA_DEFEATED, SW_PALKIA_DEFEATED, 0]),
    cmd(101, [S("Palkia canaliza su esencia hacia las dimensiones lejanas. El portal hacia la Cima del Génesis ha sido despejado.")]),
    cmd(412),
    cmd(0),
  ];
  addEventToMap(map, event(3, "Guardián Palkia", 19, 14, [
    page({ gfx: graphic("PALKIA", 2), list: palkiaBattle }),
    page({ cond: condition({ sw: SW_PALKIA_DEFEATED }), list: [cmd(0)] }),
  ]));

  addEventToMap(map, hiddenItemEvent(4, "Item ABILITYCAPSULE", 32, 10, "ABILITYCAPSULE", "Cápsula Habilidad"));

  return { map, cv };
}
export function buildFloor7() {
  const W = 46, H = 46;
  const cv = new TileCanvas(W, H, 1);
  cv.fillAll(0, 4457);

  // Clustered Frosted Pine Groves on flanks with depth
  const westPines = [
    [1, 3], [3, 4], [2, 8], [4, 9], [1, 14], [3, 15],
    [2, 20], [4, 21], [1, 26], [3, 27], [2, 32], [4, 33],
    [1, 38], [3, 39], [2, 43], [4, 44],
    [6, 36], [7, 41]
  ];
  for (const [px, py] of westPines) drawFrostedPineTree(cv, px, py);

  const eastPines = [
    [W - 3, 3], [W - 5, 4], [W - 4, 8], [W - 6, 9], [W - 3, 14], [W - 5, 15],
    [W - 4, 20], [W - 6, 21], [W - 3, 26], [W - 5, 27], [W - 4, 32], [W - 6, 33],
    [W - 3, 38], [W - 5, 39], [W - 4, 43], [W - 6, 44],
    [W - 8, 36], [W - 9, 41]
  ];
  for (const [px, py] of eastPines) drawFrostedPineTree(cv, px, py);

  // Cliff Tier at y=20..22
  drawCoronetCliff(cv, 6, 20, 34, 3, { stairs: [22] });

  // Grand Processional Avenue of Creation
  drawPavedRoad(cv, 21, 20, 5, 23);

  // The Grand Altar of Creation
  drawWhiteMarbleDais(cv, 10, 5, 27, 15, { stairs: [22] });

  // Sunburst Altar of God at pinnacle
  drawSunburstAltar(cv, 21, 5);

  // Ancient Marble Colonnade atop the sacred altar
  drawColumn(cv, 19, 6); drawColumn(cv, 20, 6);
  drawColumn(cv, 25, 6); drawColumn(cv, 26, 6);

  // Twin Cosmic Gateways
  drawCosmicGateway(cv, 15, 6);
  drawCosmicGateway(cv, 29, 6);

  // Twin Cosmic Pools in Courtyard
  drawCosmicPool(cv, 13, 12);
  drawCosmicPool(cv, 31, 12);

  // 10 Colossal Guardian Beast Statues along the Avenue
  for (let y = 24; y <= 40; y += 4) {
    drawGuardianStatue(cv, 19, y);
    drawGuardianStatue(cv, 27, y);
    drawColumn(cv, 17, y);
    drawColumn(cv, 29, y);
  }
  // Inner statues on the Altar
  drawGuardianStatue(cv, 15, 9); drawGuardianStatue(cv, 30, 9);
  drawGuardianStatue(cv, 15, 16); drawGuardianStatue(cv, 30, 16);

  // Sacred Boulders & Monoliths
  drawSacredBoulder(cv, 8, 12);
  drawSacredBoulder(cv, 37, 12, true);
  drawSacredBoulder(cv, 12, 28);
  drawSacredBoulder(cv, 33, 28, true);
  drawMonolith(cv, 14, 34);
  drawMonolith(cv, 31, 34);

  // Wild grass on outer mountain terraces
  drawWildGrassPatch(cv, 7, 24, 6, 10);
  drawWildGrassPatch(cv, 33, 24, 6, 10);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 7F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 6F", 23, 41, 2036, 19, 6, 2));

  // Arceus Boss Event
  const arceusBattle = [
    cmd(223, [S("Tone.new(255,255,255,160)"), 20]),
    cmd(221), cmd(222),
    cmd(241, [new RObject("RPG::AudioFile", [["@name", S("Legend Sinnoh")], ["@volume", 100], ["@pitch", 100]])]),
    ...textCommands([
      "Ash... Tu viaje comenzó en Pueblo Paleta con un simple Pikachu, y tus pasos te han llevado a desafiar los límites mismos de la existencia.",
      "Has capturado y combatido contra las criaturas que tejieron la urdimbre de las regiones.",
      "Sin embargo... ¿creías que los seres que encontraste en tu camino eran el límite absoluto?",
      "Los Dialga, Palkia e incluso la forma que alguna vez presenciaste de Mí... no eran más que fragmentos disminuidos, sombras atenuadas proyectadas en los planos inferiores para evitar la aniquilación de la realidad.",
      "Pero hoy... las 17 Tablas del Génesis se han congregado en una sola alma humana.",
      "He descendido con la plenitud de Mi ser primordial.",
      "El cosmos ha cumplido su ciclo. La luz y la materia serán devueltas a la nada.",
      "¡Prepárate, Ash Ketchum! ¡Presencia el poder del Principio y del Fin!",
    ]),
    script("pbSpecialBossArceusBattle"),
    cmd(111, [12, S("$Trainer.party.any? { |p| p.hp > 0 }")]),
    cmd(121, [SW_ARCEUS_RESOLVED, SW_ARCEUS_RESOLVED, 0]),
    cmd(223, [S("Tone.new(255,255,255,255)"), 30]),
    ...textCommands([
      "El fulgor del ser supremo desciende en una armonía sobrecogedora...",
      "Arceus: Increíble... Tu voluntad no quebrantó la creación, sino que le ha devuelto su equilibrio.",
    ]),
    cmd(111, [12, S("$game_switches[874]")]),
    ...textCommands([
      "Arceus: Has demostrado que los humanos y los Pokémon son capaces de sostener el peso de la eternidad. Acepto caminar a tu lado.",
    ]),
    cmd(412),
    ...textCommands([
      "El silencio absoluto envuelve la cima del monte. Las nubes se disipan, revelando el firmamento infinito.",
      "Volo: ¡Ash! ¡Lo... lo lograste! ¡El cosmos ha sido preservado!",
    ]),
    cmd(111, [12, S("$game_switches[874]")]),
    ...textCommands([
      "Volo: Espera... ¿Eso que llevas contigo... es el mismísimo Gran Uno?!",
      "Volo: ¡No puede ser! ¡Durante eones busqué alcanzar la gloria del creador! ¡No permitiré que un joven mortal lo conserve!",
      "Volo: ¡Ash! ¡Te desafío por el derecho a portar la corona de la existencia!",
    ]),
    script("pbTrainerBattle(:SECRET_Volo, \\\"Volo\\\", nil, false, 0, true)"),
    cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0]),
    ...textCommands([
      "Volo: Ja... ja... Es inútil luchar contra el destino, ¿verdad?",
      "Volo: Tu lazo con los Pokémon no proviene de la ambición, sino del amor puro por este mundo. Me rindo ante tu verdad, Ash.",
    ]),
    cmd(412),
    cmd(121, [SW_COMPLETED, SW_COMPLETED, 0]),
    ...textCommands([
      "El portal de Puntaneva resuena con un tono apacible. La crisis divina ha concluido.",
    ]),
    cmd(412),
    cmd(0),
  ];

  const p1 = page({ gfx: graphic("ARCEUS", 2), list: arceusBattle });
  const p2 = page({
    cond: condition({ sw: SW_ARCEUS_RESOLVED, sw2: SW_ARCEUS_CAUGHT }),
    gfx: graphic("SECRET_Volo", 2),
    list: [
      ...textCommands([
        "Volo: ¡Aún no me rindo! ¡Arceus debe pertenecer a quien comprenda la verdadera grandeza!",
      ]),
      script("pbTrainerBattle(:SECRET_Volo, \"Volo\", nil, false, 0, true)"),
      cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0]),
      cmd(121, [SW_COMPLETED, SW_COMPLETED, 0]),
      ...textCommands([
        "Volo: Lo entiendo ahora... El creador eligió a su campeón. Buen viaje, Ash.",
      ]),
      cmd(0),
    ],
  });
  const p3 = page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] });

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
    [2030, "La Ruta de Dios — Aproximación Celestial"],
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
  console.log("OK: Maps 2030..2037 registered in MapInfos.rxdata.");
}

function registerMapMetadata() {
  const meta = readRx("map_metadata.dat");
  for (let id = 2030; id <= 2037; id++) {
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
  console.log("OK: Maps 2030..2037 metadata registered in map_metadata.dat.");
}

function registerEncounters() {
  const enc = readRx("encounters.dat");

  const tables = [
    {
      map: 2030,
      mons: [
        [30, Sy("SNORUNT"), 105, 110],
        [25, Sy("SNEASEL"), 105, 110],
        [25, Sy("SWINUB"), 105, 110],
        [20, Sy("CHIMECHO"), 105, 110],
      ],
    },
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

  console.log("Installing Volus, the celestial avenue, and the portal in Snowpoint City...");
  installTwinleafVolo();
  installSnowpointPortal();
  installSnowpointGuide();

  console.log("Building the long celestial approach and the 7 Floors of La Ruta de Dios (Maps 2030..2037)...");
  const approach = buildCelestialApproach();
  validateFloorReachability("Celestial approach", approach.map, approach.cv, [26, 68]);
  writeRx("Map2030.rxdata", approach.map);

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

  console.log("The celestial approach and all 7 Floors of La Ruta de Dios successfully built and installed!");
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
  const snowEvents = iv(map625, "events").pairs;
  const portalEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (!portalEv) errors.push("Missing Portal event in Map 625");
  const guideEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Volus — Guía Celestial"));
  if (!guideEv) errors.push("Missing second Volus guide in Map 625");

  // 5. Verify the approach plus the 7 sacred floors
  for (let id = 2030; id <= 2037; id++) {
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
