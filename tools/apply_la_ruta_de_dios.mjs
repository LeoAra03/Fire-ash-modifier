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
 * 3. Aproximación Celestial larga (Map 2038, 52x72): cuatro terrazas, escaleras, santuarios,
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
 *    - Nivel 200 (único Pokémon del juego en alcanzar este nivel) y sólo para la
 *      instancia divina: el 200 exige @ruta_arceus_divine (S2/S2b).
 *    - Sentencia, Distorsión, Corte Vacío, Golpe Umbrío con Tabla Legendaria.
 *    - Seis barras completas, una por cada etapa: cada transición exige agotar
 *      el HP y la sexta abre la captura. No hay umbrales parciales.
 *    - Arceus es inmune a estados, cura la barra al entrar en rojo, gira las 17
 *      Tablas según la ventaja de tipo y elige ataques del catálogo completo.
 *      Sus niveles y los de Ash cambian por etapa; la potencia también progresa.
 *    - Cynthia/Máximo y Red/Gold caminan hacia el altar y se retiran tras perder;
 *      en sus combates Arceus se regenera por completo y se burla de sus rivales.
 *    - Los ecos invocados (Mew, Giratina) usan el nivel máximo legal con empuje
 *      divino, nunca el nivel 200 (R2).
 *    - Se puede capturar o derrotar. El pseudo-PC nunca deja al jugador sin salida:
 *      si no hay candidatos en el PC, el Rotom sostiene al equipo una vez (R4).
 *    - Si derrota al jugador: desmayo oficial y transporte al Centro Pokémon más cercano.
 * 6. Desenlace con Volus:
 *    - Volus sube a la cima tras el combate felicitando a Ash por salvar el cosmos.
 *    - Si capturamos a Arceus: Volus enloquece de obsesión y desafía a Ash con su equipo válido de versión 4 (Nv. 100), reintentable tras perder.
 *    - Si perdemos ante Volus, podemos volver a subir y retarlo hasta derrotarlo.
 *    - Al vencer a Volus, reconoce nuestro vínculo, se marcha y el evento temporal concluye.
 *    - Los entrenadores de los pisos 1-4 desaparecen tras completarse el evento.
 *
 * Uso:
 *   node tools/apply_la_ruta_de_dios.mjs
 *   node tools/apply_la_ruta_de_dios.mjs --verify
 *
 * ORDEN: esta herramienta reconstruye los mapas 2031-2038 desde cero. Si se
 * aplica después de tools/apply_canon_arceus.mjs, el evento del Fragmento del
 * Génesis (mapa 2037) desaparece: ejecutar siempre la ruta primero y el canon
 * después (npm run verify:canon:arceus lo comprueba).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import {
  marshalLoad, marshalDump, RHash, RObject, RString, RSymbol, RUserDef,
} from "../web/js/marshal.js";
import {
  TileCanvas, passabilityOf, reachableCells, buildMapObject, tilesets,
} from "./lib/map_painter.mjs";
import { parseMap, tableGet } from "../web/js/rmxp.js";
import { tableFromUserDef, tableToUserDef, tableSet } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const BACKUP_DIR = path.join(GAME, "PokeModBackups", "la_ruta_de_dios");
const CAPTURED_GOD_MODE_POLICY = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content", "canon_arceus.json"), "utf8"),
).modo_divino_capturado;
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
const SW_SNOWPOINT_PASS = 877;   // Permite cruzar árboles solo durante esta visita a Puntaneva
const SW_ARCEUS_ALLIES_CYNTHIA_STEVEN = 878;
const SW_ARCEUS_ALLIES_GOLD_RED = 879;
const SW_ARCEUS_ALLIES_VOLUS = 880;
const SW_ARCEUS_MERCY = 869;     // R4: el Rotom sostiene al equipo una sola vez (sin candidatos en el PC)
const SW_PRELUDE_SEEN = 881;     // R7: el prólogo cinemático (3 combates CPU) sólo se ve la primera vez

// R8: cada piso 1-4 guarda una reliquia detrás del sello de su guía (el objeto es el sello roto).
const SW_RELIC_GUIDE_1 = 936;    // Maya (1F)
const SW_RELIC_GUIDE_2 = 937;    // Palmer (2F)
const SW_RELIC_GUIDE_3 = 938;    // Quinoa (3F)
const SW_RELIC_GUIDE_4 = 939;    // Cintia (4F)

// ---------------------------------------------------------------------------
// RMXP Event Constructors
// ---------------------------------------------------------------------------
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [
    ["@code", code], ["@indent", indent], ["@parameters", params],
  ]);
}
function tone(red, green, blue, gray = 0) {
  const bytes = Buffer.alloc(32);
  [red, green, blue, gray].forEach((value, index) => bytes.writeDoubleLE(Number(value), index * 8));
  return new RUserDef("Tone", bytes);
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
function cinematicTrainerEvent(id, name, x, y, switchId, characterName) {
  return event(id, name, x, y, [
    page({ list: [cmd(0)] }),
    page({
      cond: condition({ sw: switchId }),
      gfx: graphic(characterName, 2),
      through: true,
      list: [cmd(0)],
    }),
  ]);
}
function textCommands(lines, indent = 0) {
  const arr = Array.isArray(lines) ? lines : [lines];
  // "Maya: ..." -> "\bMaya: ...": el nombre del hablante se resalta en color
  // (el motor convierte \b en una etiqueta <c3=...>), así los diálogos de la
  // ruta se diferencian entre sí en lugar de parecer todos iguales.
  const conHablante = (l) =>
    /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]{0,15}):\s/.test(l) ? "\\b" + l : l;
  return [cmd(101, [S("")], indent), ...arr.map((l) => cmd(401, [S(conHablante(l))], indent))];
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
/**
 * R8: reliquia sellada. Cada piso 1-4 guarda una reliquia detrás del sello de su
 * entrenador; los pisos 5-6, detrás de su guardián. La página 1 sólo existe cuando
 * el sello está roto (`sealSwitch`), así que el objeto es un premio de exploración,
 * no un caramelo tirado en el suelo.
 */
function sealedRelicEvent(id, name, x, y, sealSwitch, itemSym, itemName) {
  const p1 = page({
    cond: condition({ sw: sealSwitch }),
    gfx: graphic("Object ball special", 2),
    list: [
      cmd(101, [S(`¡La reliquia sellada cede! Encontraste ${itemName}.\\1`)]),
      script(`pbReceiveItem(:${itemSym}, 1)`),
      cmd(123, [S("A"), 0]),
      cmd(0),
    ],
  });
  const p2 = page({ cond: condition({ self: "A" }), list: [cmd(0)] });
  const p3 = page({ list: [cmd(0)] });
  return event(id, name, x, y, [p1, p2, p3]);
}

/**
 * R8: busca el rincón sellado del piso: una celda sólida (muro o roca) a la que no se
 * puede entrar pero a la que sí se llega de frente caminando, y que además queda lejos
 * del inicio. El `salt` desempata para que cada piso esconda su reliquia en un lugar
 * distinto. La reliquia es premio de exploración: hay que recorrerse el piso entero.
 */
function sealedRelicSpot(cv, start, salt = 0) {
  const pass = passabilityOf(cv, cv.tilesetId);
  const reachable = reachableCells(pass, start);
  const bloqueada = (x, y) => [2, 4, 6, 8].every((dir) => {
    const [dx, dy] = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[dir];
    return !canMoveInto(pass, x + dx, y + dy, 10 - dir);
  });
  const candidatos = [];
  for (let y = 3; y < cv.height - 3; y++) {
    for (let x = 3; x < cv.width - 3; x++) {
      if (reachable.has(`${x},${y}`)) continue;
      if (!bloqueada(x, y)) continue;   // la reliquia vive sobre piedra, no en un hueco
      const deFrente = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) => reachable.has(`${nx},${ny}`));
      if (!deFrente) continue;
      candidatos.push({ x, y, dist: Math.abs(x - start[0]) + Math.abs(y - start[1]) });
    }
  }
  if (!candidatos.length) throw new Error("R8: no se encontró rincón sellado en el piso");
  // Cuadrante preferido por piso: los pisos no esconden todos la reliquia en la misma esquina.
  const cuadrantes = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const [qx, qy] = cuadrantes[Math.abs(salt) % cuadrantes.length];
  const cx = cv.width / 2, cy = cv.height / 2;
  const lejos = Math.max(...candidatos.map((c) => c.dist));
  const enCuadrante = candidatos.filter((c) => (c.x - cx) * qx > 0 && (c.y - cy) * qy > 0 && c.dist >= lejos * 0.55);
  // Si el acceso está en el borde inferior, puede que la esquina preferida no
  // alcance el umbral de distancia. Mantener al menos el hemisferio indicado
  // conserva veraz la pista norte/sur en lugar de caer en el cuadrante opuesto.
  const enHemisferio = candidatos.filter((c) => (c.y - cy) * qy > 0);
  const pool = enCuadrante.length ? enCuadrante : enHemisferio.length ? enHemisferio : candidatos;
  const score = (c) => c.dist * 100 + ((c.x * 7 + c.y * 13 + salt * 5) % 37);
  return pool.reduce((a, b) => (score(b) > score(a) ? b : a));
}

/** ¿La celda (x, y) es sólida? Se prueba entrando desde sus cuatro vecinos. */
function canMoveInto(pass, x, y, reverseDir) {
  return pass.canMove(x, y, reverseDir);
}

/**
 * R9: peregrinos de la Ruta. Cada piso tiene dos voces: la que recuerda la mitología del
 * lugar y la que apunta hacia la reliquia sellada de ese piso (el rumbo se calcula de la
 * posición real de la reliquia, así la pista siempre dice la verdad). Se colocan en la
 * celda alcanzable más cercana al punto deseado, nunca encima de otro evento.
 */
const PEREGRINOS = {
  "1F": {
    rostros: ["trchar001", "trchar003"],
    lore: [
      "Peregrino: Subí esta ruta cuando el cielo todavía era una sola pieza.",
      "Peregrino: El Gran Uno no vive arriba: vive en lo que uno deja atrás al subir.",
    ],
  },
  "2F": {
    rostros: ["trchar004", "trchar005"],
    lore: [
      "Peregrina: Aquí el aire pesa más que en la costa. Los que suben con prisa bajan con las manos vacías.",
      "Peregrina: Mi abuelo decía que la montaña no se conquista: se respeta.",
    ],
  },
  "3F": {
    rostros: ["trchar006", "trchar007"],
    lore: [
      "Peregrino: El mar de arriba no tiene agua: tiene tiempo. Lo vi una vez y no volví a nadar.",
      "Peregrino: Cada piedra que pisas fue un pokémon que se quedó mirando demasiado la cumbre.",
    ],
  },
  "4F": {
    rostros: ["trchar008", "trchar009"],
    lore: [
      "Peregrina: Pocos llegan hasta aquí. Menos aún entienden por qué suben.",
      "Peregrina: Yo sólo vine a comprobar si el mito aguantaba mi peso. Aguanta.",
    ],
  },
  "5F": {
    rostros: ["trainer_HIKER", "trchar000"],
    lore: [
      "Peregrino: Este piso respira despacio. Un segundo aquí adentro dura un invierno allá afuera.",
      "Peregrino: No le des la espalda a la grieta del techo: eso que brilla es una hora que no fue.",
    ],
  },
  "6F": {
    rostros: ["trainer_SCIENTIST", "trchar001"],
    lore: [
      "Peregrina: Arriba el espacio se dobla. Caminé tres pasos y recorrí mi infancia entera.",
      "Peregrina: Si ves dos veces la misma escalera, elige la que te mire.",
    ],
  },
};

/** Rumbo en palabras de una celda respecto al centro del piso (para las pistas). */
function rumboDe(x, y, cv) {
  const vertical = y < cv.height / 2 ? "norte" : "sur";
  const horizontal = x < cv.width / 2 ? "poniente" : "oriente";
  return `${vertical}, hacia el ${horizontal}`;
}

function installPilgrims(cv, map, floorKey, start, relic) {
  const data = PEREGRINOS[floorKey];
  if (!data) return;
  const pass = passabilityOf(cv, cv.tilesetId);
  const reachable = reachableCells(pass, start);
  const ocupadas = new Set();
  for (const [, ev] of iv(map, "events").pairs) ocupadas.add(`${Number(iv(ev, "x"))},${Number(iv(ev, "y"))}`);

  const libres = [...reachable].filter((k) => !ocupadas.has(k)).map((k) => k.split(",").map(Number));
  if (libres.length < 2) throw new Error(`R9: sin celdas libres para los peregrinos de ${floorKey}`);

  const donde = (target) => {
    let mejor = null;
    for (const [x, y] of libres) {
      if (ocupadas.has(`${x},${y}`)) continue;
      const d = Math.abs(x - target[0]) + Math.abs(y - target[1]);
      if (!mejor || d < mejor.d) mejor = { x, y, d };
    }
    if (mejor) ocupadas.add(`${mejor.x},${mejor.y}`);
    return mejor;
  };

  const esquinas = [[Math.floor(cv.width * 0.25), Math.floor(cv.height * 0.3)],
                    [Math.floor(cv.width * 0.75), Math.floor(cv.height * 0.7)]];
  const pista = [
    `Peregrino: Los antiguos sellaban lo que no debía subir.`,
    `Peregrino: Mira donde el camino se corta: al ${rumboDe(relic.x, relic.y, cv)} hay una roca que no es roca. Sólo se abre cuando el sello del piso está roto.`,
  ];
  const voces = [
    { target: esquinas[0], texto: data.lore, rostro: data.rostros[0], nombre: `Peregrino de la memoria (${floorKey})` },
    { target: esquinas[1], texto: pista, rostro: data.rostros[1], nombre: `Peregrino del sello (${floorKey})` },
  ];
  for (const [i, voz] of voces.entries()) {
    const spot = donde(voz.target);
    if (!spot) break;
    addEventToMap(map, event(40 + i, voz.nombre, spot.x, spot.y, [
      page({ gfx: graphic(voz.rostro, 2), list: [...textCommands(voz.texto, 1), cmd(0)] }),
    ]));
  }
}

function hiddenItemEvent(id, name, x, y, itemSym, itemName) {
  const p1 = page({
    gfx: graphic("Object ball special", 2),
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
# PokeMod: La Ruta de Dios - Arceus Divine Battle
#===============================================================================
# This section deliberately uses only battle APIs present in this Fire Ash build.
# The boss is still hosted by the normal wild-battle loop, so victory, capture,
# EXP, storage and the post-battle event keep their normal engine behaviour.

# Whitelist de mapas derivada de content/canon_arceus.json. Todo mapa que no
# figure explícitamente aquí (incluidos creepypasta y otras dimensiones) usa
# las reglas normales; nunca se infieren mundos por rangos generales.
RUTA_ARCEUS_FIRE_ASH_MAP_RANGES = ${JSON.stringify(CAPTURED_GOD_MODE_POLICY.mapas_permitidos.fire_ash)}
RUTA_ARCEUS_ATLAS_MAP_RANGES = ${JSON.stringify(CAPTURED_GOD_MODE_POLICY.mapas_permitidos.atlas)}
RUTA_ARCEUS_LIQUID_CRYSTAL_MAP_RANGES = ${JSON.stringify(CAPTURED_GOD_MODE_POLICY.mapas_permitidos.liquid_crystal)}
RUTA_ARCEUS_TEAM_ROCKET_MAP_RANGES = ${JSON.stringify(CAPTURED_GOD_MODE_POLICY.mapas_permitidos.team_rocket)}
RUTA_ARCEUS_DIVINE_ALLOWED_MAP_RANGES = RUTA_ARCEUS_FIRE_ASH_MAP_RANGES +
  RUTA_ARCEUS_ATLAS_MAP_RANGES + RUTA_ARCEUS_LIQUID_CRYSTAL_MAP_RANGES +
  RUTA_ARCEUS_TEAM_ROCKET_MAP_RANGES

def pbRutaArceusGodWorldAllowed?(map_id = nil)
  if map_id.nil?
    return false if !$game_map || !$game_map.respond_to?(:map_id)
    map_id = $game_map.map_id
  end
  map_id = map_id.to_i
  allowed = RUTA_ARCEUS_DIVINE_ALLOWED_MAP_RANGES.any? do |range|
    map_id >= range[0].to_i && map_id <= range[1].to_i
  end
  return allowed
rescue StandardError
  return false
end

def pbRutaArceusCapturedPokemon?(pokemon)
  return false if !pokemon || !pokemon.respond_to?(:species) || pokemon.species != :ARCEUS
  return pokemon.instance_variable_get(:@ruta_arceus_captured_god) == true
end

def pbRutaArceusCapturedGodActive?(pokemon)
  return pbRutaArceusCapturedPokemon?(pokemon) && pbRutaArceusGodWorldAllowed?
end

def pbRutaArceusRestorePokemonPP(pokemon)
  return false if !pokemon || !pokemon.respond_to?(:moves)
  (pokemon.moves || []).each do |move|
    next if !move || !move.respond_to?(:total_pp) || !move.respond_to?(:pp=)
    total_pp = move.total_pp.to_i
    next if total_pp <= 0
    move.pp = total_pp
  end
  return true
rescue StandardError
  return false
end

def pbRutaArceusSyncCapturedPokemonMode(pokemon)
  return false if !pbRutaArceusCapturedPokemon?(pokemon)
  active = pbRutaArceusGodWorldAllowed?
  normal_cap = (GameData::GrowthRate.max_level || 150).to_i
  normal_cap = 150 if normal_cap < 1
  saved_item = pokemon.instance_variable_get(:@ruta_arceus_captured_saved_item)
  suspended = pokemon.instance_variable_get(:@ruta_arceus_captured_mode_suspended) == true
  if active
    if suspended
      if (pokemon.item.nil? || pokemon.item == :NONE) && saved_item
        pokemon.item = saved_item
      end
      pokemon.instance_variable_set(:@ruta_arceus_captured_saved_item, nil)
      pokemon.instance_variable_set(:@ruta_arceus_captured_mode_suspended, false)
    end
  else
    unless suspended
      pokemon.instance_variable_set(:@ruta_arceus_captured_saved_item, pokemon.item)
      pokemon.instance_variable_set(:@ruta_arceus_captured_mode_suspended, true)
    end
    pokemon.item = nil if pokemon.item == :LEGENDPLATE
  end
  if pokemon.respond_to?(:form_simple=) && pokemon.respond_to?(:form) && pokemon.form != 0
    pokemon.form_simple = 0
  end
  captured_level = pokemon.instance_variable_get(:@ruta_arceus_captured_god_level).to_i
  captured_level = 200 if captured_level < 1
  desired_level = active ? [captured_level, 200].min : [captured_level, normal_cap].min
  desired_level = [desired_level, 1].max
  if pokemon.level != desired_level
    pokemon.level = desired_level
    pokemon.calc_stats
  end
  pbRutaArceusRestorePokemonPP(pokemon) if active
  return active
rescue StandardError
  return false
end

def pbRutaArceusSyncCapturedPartyModes
  owner = defined?($Trainer) ? $Trainer : nil
  if owner && owner.respond_to?(:party)
    owner.party.each { |pokemon| pbRutaArceusSyncCapturedPokemonMode(pokemon) }
  end
  storage = defined?($PokemonStorage) ? $PokemonStorage : nil
  if storage && storage.respond_to?(:maxBoxes) && storage.respond_to?(:maxPokemon)
    (0...storage.maxBoxes).each do |box|
      (0...storage.maxPokemon(box)).each do |slot|
        pbRutaArceusSyncCapturedPokemonMode(storage[box, slot])
      end
    end
  end
  return true
rescue StandardError
  return false
end

def pbRutaArceusRestoreCapturedAfterBattle
  return false if !pbRutaArceusGodWorldAllowed?
  owner = defined?($Trainer) ? $Trainer : nil
  return false if !owner || !owner.respond_to?(:party)
  restored = false
  owner.party.each do |pokemon|
    next if !pbRutaArceusCapturedGodActive?(pokemon)
    pbRutaArceusSyncCapturedPokemonMode(pokemon)
    pokemon.hp = pokemon.totalhp if pokemon.respond_to?(:hp=) && pokemon.respond_to?(:totalhp)
    pbRutaArceusRestorePokemonPP(pokemon)
    restored = true
  end
  return restored
rescue StandardError
  return false
end

if defined?(Events) && Events.respond_to?(:onEndBattle)
  Events.onEndBattle += proc { |_sender, _event| pbRutaArceusRestoreCapturedAfterBattle }
end

# Level 200 is reserved for the Ruta boss and the captured mode inside its whitelist.
class Pokemon
  alias _ruta_arceus_original_level_set level= unless method_defined?(:_ruta_arceus_original_level_set)
  # Arceus jefe y Arceus capturado sólo alcanzan Nv. 200 bajo sus marcadores
  # respectivos; fuera de la whitelist el capturado vuelve al tope normal.
  def ruta_arceus_divine?
    return @ruta_arceus_divine == true
  end
  def level=(value)
    max = GameData::GrowthRate.max_level
    if @species == :ARCEUS && @ruta_arceus_divine == true
      max = 200
    elsif @species == :ARCEUS && @ruta_arceus_captured_god == true && pbRutaArceusGodWorldAllowed?
      max = 200
    end
    if value < 1 || value > max
      raise ArgumentError.new(_INTL("The level number ({1}) is invalid.", value))
    end
    @exp = growth_rate.minimum_exp_for_level(value)
    @level = value
  end
end

module GameData
  class GrowthRate
    alias _ruta_arceus_original_min_exp minimum_exp_for_level unless method_defined?(:_ruta_arceus_original_min_exp)
    def minimum_exp_for_level(level)
      raise ArgumentError.new("Level #{level} is invalid.") if !level || level <= 0
      level = [level, 200].min
      return @exp_values[level] if @exp_values && level < @exp_values.length
      raise "No Exp formula is defined for growth rate #{name}" if !@exp_formula
      return @exp_formula.call(level)
    end
  end
end

# 2. Temporary Snowpoint tree passage. It is map-specific and is cleared by
# Game_Map#setup, so loading any other map removes the permission automatically.
SNOWPOINT_PASS_SWITCH = 877
SNOWPOINT_TREE_TILE_IDS = [4480, 4481, 4484, 4485, 4488, 4489, 4496, 4497]

def pbSnowpointTreeCell?(x, y)
  return false if !$game_map || $game_map.map_id != 625
  return [2, 1, 0].any? { |z| SNOWPOINT_TREE_TILE_IDS.include?($game_map.data[x, y, z]) }
end

class Game_Map
  alias _ruta_de_dios_original_setup setup unless method_defined?(:_ruta_de_dios_original_setup)
  def setup(map_id)
    _ruta_de_dios_original_setup(map_id)
    $game_switches[SNOWPOINT_PASS_SWITCH] = false if $game_switches
    pbRutaArceusSyncCapturedPartyModes
  end
end

class Game_Player
  alias _ruta_de_dios_original_passable passable? unless method_defined?(:_ruta_de_dios_original_passable)
  def passable?(x, y, d, strict = false)
    result = _ruta_de_dios_original_passable(x, y, d, strict)
    return result if result
    return false if !$game_switches || !$game_switches[SNOWPOINT_PASS_SWITCH]
    new_x = x + (d == 6 ? 1 : d == 4 ? -1 : 0)
    new_y = y + (d == 2 ? 1 : d == 8 ? -1 : 0)
    return false unless pbSnowpointTreeCell?(new_x, new_y)
    blocked = $game_map.events.values.any? do |event|
      event.x == new_x && event.y == new_y && !event.through && event.character_name.to_s != ""
    end
    return false if blocked
    return true
  end
end

# 3. The six-phase encounter uses the battle's existing animation primitives.
ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH = 878
ARCEUS_ALLIES_GOLD_RED_SWITCH = 879
ARCEUS_ALLIES_VOLUS_SWITCH = 880
RUTA_ARCEUS_CAUGHT_SWITCH = 874
RUTA_DE_DIOS_ARCEUS_RESOLVED = 873
RUTA_DE_DIOS_ARCEUS_MERCY_SWITCH = 869
RUTA_DE_DIOS_PRELUDE_SEEN_SWITCH = 881

# Helpers del evento de Volus (Map 513). El evento lee el número de Tablas a
# través de la variable de juego 1 (el diálogo usa \\v[1]) y comprueba si Ash
# reúne las 17 Tablas del Génesis antes de abrir la ruta. RUTA_ARCEUS_PHASE_PLATES
# se define más abajo en esta misma sección; Ruby resuelve la constante en
# tiempo de ejecución, cuando el evento ya la necesita.
def pbCountArceusPlates
  count = 0
  return count if !$PokemonBag || !$PokemonBag.respond_to?(:pbHasItem?)
  RUTA_ARCEUS_PHASE_PLATES.each do |plate|
    count += 1 if GameData::Item.exists?(plate) && $PokemonBag.pbHasItem?(plate)
  end
  $game_variables[1] = count if $game_variables
  return count
end

def pbHasAllArceusPlates?
  return false if !$PokemonBag || !$PokemonBag.respond_to?(:pbHasItem?)
  return RUTA_ARCEUS_PHASE_PLATES.all? { |plate| $PokemonBag.pbHasItem?(plate) }
end

def pbGrantAllArceusPlates
  granted = 0
  return granted if !$PokemonBag || !$PokemonBag.respond_to?(:pbStoreItem)
  RUTA_ARCEUS_PHASE_PLATES.each do |plate|
    next if !GameData::Item.exists?(plate)
    next if $PokemonBag.respond_to?(:pbHasItem?) && $PokemonBag.pbHasItem?(plate)
    granted += 1 if $PokemonBag.pbStoreItem(plate, 1, false)
  end
  return granted
end

# Transacción de memoria para la batalla divina. Arceus puede aparentar reescribir
# reglas, equipo, bolsa y mundo, pero esos cambios no cruzan el límite del encuentro.
# map_factory/game_player se excluyen de la recarga porque el intérprete que llamó al
# combate conserva referencias a ellos; la batalla nunca tiene permiso para mutarlos.
module ArceusSaveSandbox
  PROTECTED_IDS = [
    :player, :frame_count, :game_system, :pokemon_system, :switches, :variables,
    :self_switches, :game_screen, :global_metadata, :map_metadata, :bag,
    :storage_system
  ]
  @depth = 0
  @blocked_writes = 0

  def self.active?
    return @depth > 0
  end

  def self.blocked_writes
    return @blocked_writes
  end

  def self.deep_copy(value)
    return Marshal.load(Marshal.dump(value))
  end

  def self.begin!
    raise "Arceus sandbox already active" if active?
    compiled = SaveData.compile_save_hash
    snapshot = {}
    PROTECTED_IDS.each do |id|
      snapshot[id] = deep_copy(compiled[id]) if compiled.has_key?(id)
    end
    disk = nil
    disk_existed = false
    begin
      disk_existed = File.file?(SaveData::FILE_PATH)
      disk = File.open(SaveData::FILE_PATH, "rb") { |f| f.read } if disk_existed
    rescue StandardError
      # La protección primaria es bloquear SaveData.save_to_file. La copia de disco
      # añade defensa frente a escritores ajenos, pero nunca impide iniciar la escena.
    end
    @depth = 1
    @blocked_writes = 0
    @transaction = { :snapshot => snapshot, :disk => disk, :disk_existed => disk_existed }
    return @transaction
  end

  # ¿Cabe un Pokémon más en el estado al que se revierte el mundo? La captura se
  # inserta tras el rollback, sobre el equipo previo al combate (no sobre el
  # equipo swappeado por el pseudo-PC), así que la comprobación usa la snapshot.
  def self.capture_room?
    return true if !active? || @transaction.nil?
    snapshot = @transaction[:snapshot]
    return true if !snapshot
    player = snapshot[:player]
    storage = snapshot[:storage_system]
    party_full = player && player.respond_to?(:party_full?) ? player.party_full? : true
    boxes_full = storage && storage.respond_to?(:full?) ? storage.full? : true
    return !(party_full && boxes_full)
  end

  def self.restore_values(snapshot)
    errors = []
    values = SaveData.instance_variable_get(:@values)
    values.each do |value|
      id = value.id
      next if !snapshot.has_key?(id)
      begin
        value.load(deep_copy(snapshot[id]))
      rescue StandardError => error
        # Un valor defectuoso no debe impedir que se intenten restaurar todos los
        # demás. Se informa al final, una vez agotado el rollback completo.
        errors.push("#{id}: #{error.class}: #{error.message}")
      end
    end
    return errors
  end

  def self.restore_disk!(transaction)
    return nil if transaction[:disk].nil? && !transaction[:disk_existed]
    path = SaveData::FILE_PATH
    if transaction[:disk_existed]
      current = nil
      current = File.open(path, "rb") { |f| f.read } if File.file?(path)
      if current != transaction[:disk]
        File.open(path, "wb") { |f| f.write(transaction[:disk]) }
      end
    elsif File.file?(path)
      File.delete(path)
    end
    return nil
  rescue StandardError => error
    message = "disk: #{error.class}: #{error.message}"
    echoln("[ArceusSaveSandbox] #{message}")
    return message
  end

  def self.finish!(transaction, captured_pokemon, caught, prelude_seen)
    return if !transaction
    errors = []
    begin
      errors.concat(restore_values(transaction[:snapshot]))
      # Nunca se hace commit parcial: si una clave no pudo volver a su estado
      # inicial, la captura tampoco se inserta sobre un mundo incoherente.
      if errors.empty?
        begin
          $game_switches[RUTA_ARCEUS_CAUGHT_SWITCH] = true if caught && $game_switches
          $game_switches[RUTA_DE_DIOS_PRELUDE_SEEN_SWITCH] = true if prelude_seen && $game_switches
          if caught && captured_pokemon
            pbArceusNormalizeCaptured(captured_pokemon)
            unless pbAddPokemonSilent(captured_pokemon)
              raise "Unable to commit canonical Arceus capture"
            end
          end
        rescue StandardError => error
          errors.push("canonical commit: #{error.class}: #{error.message}")
        end
      end
    ensure
      # La restauración física y la liberación del candado se ejecutan aunque
      # fallen tanto una clave individual como el commit de la captura.
      disk_error = restore_disk!(transaction)
      errors.push(disk_error) if disk_error
      @depth = 0
      @transaction = nil
    end
    if !errors.empty?
      raise "Arceus sandbox rollback failed: #{errors.join(' | ')}"
    end
  end

  def self.note_blocked_write(path)
    @blocked_writes += 1
    echoln("[ArceusSaveSandbox] blocked save write to #{path}")
    return false
  end
end

# Barrera global y deliberadamente estrecha: fuera del encuentro llama al método
# original sin cambiar el sistema normal de guardado.
module SaveData
  class << self
    unless method_defined?(:arceus_unrestricted_save_to_file)
      alias arceus_unrestricted_save_to_file save_to_file
      def save_to_file(file_path)
        if defined?(ArceusSaveSandbox) && ArceusSaveSandbox.active?
          return ArceusSaveSandbox.note_blocked_write(file_path)
        end
        return arceus_unrestricted_save_to_file(file_path)
      end
    end
    unless method_defined?(:arceus_unrestricted_delete_file)
      alias arceus_unrestricted_delete_file delete_file
      def delete_file
        if defined?(ArceusSaveSandbox) && ArceusSaveSandbox.active?
          return ArceusSaveSandbox.note_blocked_write(SaveData::FILE_PATH)
        end
        return arceus_unrestricted_delete_file
      end
    end
  end
end

# La batalla jugable usa seis barras completas: cada agotamiento avanza una
# etapa; el sexto abre la captura canónica sin permitir que el motor registre un KO.
RUTA_ARCEUS_PHASE_PLATES = [
  :FLAMEPLATE, :SPLASHPLATE, :ZAPPLATE, :MEADOWPLATE, :ICICLEPLATE,
  :FISTPLATE, :TOXICPLATE, :EARTHPLATE, :SKYPLATE, :MINDPLATE,
  :INSECTPLATE, :STONEPLATE, :SPOOKYPLATE, :DRACOPLATE, :DREADPLATE,
  :IRONPLATE, :PIXIEPLATE
]
RUTA_ARCEUS_PHASE_TYPES = [
  :FIRE, :WATER, :ELECTRIC, :GRASS, :ICE, :FIGHTING, :POISON, :GROUND,
  :FLYING, :PSYCHIC, :BUG, :ROCK, :GHOST, :DRAGON, :DARK, :STEEL, :FAIRY
]
RUTA_ARCEUS_TYPE_NAMES = [
  "Fuego", "Agua", "Eléctrico", "Planta", "Hielo", "Lucha", "Veneno",
  "Tierra", "Volador", "Psíquico", "Bicho", "Roca", "Fantasma", "Dragón",
  "Siniestro", "Acero", "Hada"
]
RUTA_ARCEUS_TYPE_FORMS = {
  :NORMAL => 0, :FIGHTING => 1, :FLYING => 2, :POISON => 3, :GROUND => 4,
  :ROCK => 5, :BUG => 6, :GHOST => 7, :STEEL => 8, :FIRE => 10,
  :WATER => 11, :GRASS => 12, :ELECTRIC => 13, :PSYCHIC => 14, :ICE => 15,
  :DRAGON => 16, :DARK => 17, :FAIRY => 18
}
RUTA_ARCEUS_FORM_TYPES = RUTA_ARCEUS_TYPE_FORMS.invert
RUTA_ARCEUS_TYPE_TONES = {
  :NORMAL => [35, 35, 45, 0], :FIRE => [180, 35, -75, 0],
  :WATER => [-35, 65, 190, 0], :ELECTRIC => [180, 145, -50, 0],
  :GRASS => [-65, 165, -55, 0], :ICE => [90, 160, 205, 0],
  :FIGHTING => [175, 15, 15, 0], :POISON => [125, -20, 155, 0],
  :GROUND => [140, 90, 25, 0], :FLYING => [65, 125, 190, 0],
  :PSYCHIC => [175, 70, 165, 0], :BUG => [50, 150, -40, 0],
  :ROCK => [145, 115, 75, 0], :GHOST => [80, -15, 145, 0],
  :DRAGON => [75, 45, 195, 0], :DARK => [-70, -75, -35, 0],
  :STEEL => [105, 140, 185, 0], :FAIRY => [195, 115, 185, 0]
}
RUTA_ARCEUS_MOVE_SETS = [
  [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE],
  [:JUDGMENT, :AEROBLAST, :PRECIPICEBLADES, :ORIGINPULSE],
  [:JUDGMENT, :MOONBLAST, :EARTHPOWER, :DARKVOID],
  [:JUDGMENT, :PSYCHOBOOST, :DRACOMETEOR, :SACREDSWORD],
  [:JUDGMENT, :EXTREMESPEED, :VCREATE, :PRECIPICEBLADES],
  [:JUDGMENT, :FURYSWIPES, :COMETPUNCH, :PINMISSILE]
]
# R10 — Fase 6: MEGA ARCEUS, EL DE LOS MIL BRAZOS. Al vaciar la quinta barra el
# dios megaevoluciona y la última barra se pelea contra una multitud: su pool
# pasa a movimientos multigolpe (cada acción son muchos brazos) y cada golpe
# sigue topado por RUTA_ARCEUS_HIT_CAP_RATIO, así que el espectáculo no rompe
# el equilibrio de R9: cuatro acciones suyas por Pokémon sano, igual que antes.
RUTA_ARCEUS_MIL_BRAZOS = [:FURYSWIPES, :COMETPUNCH, :PINMISSILE, :ARMTHRUST]
RUTA_ARCEUS_MEGA_GRITOS = [
  "¡Mil brazos descienden a la vez: ninguno golpea solo!",
  "¡Los brazos tejen un cielo de golpes sobre Ash!",
  "¡Cada brazo recuerda una batalla del prólogo; hoy cobran juntas!",
  "¡La multitud de brazos cierra el anillo: no queda esquina sin dios!"
]
# R11 — FORMA PRIMIGENIA: el rostro verdadero detrás de los mil brazos. Cuando
# la última barra cruza el umbral rojo, los brazos se desploman y queda lo que
# había ANTES de la creación: Arceus primigenio, sin Tabla (su Juicio vuelve al
# tipo original, así que los espectros pueden negarlo) y con un pool de golpes
# anteriores a las reglas. El tope de un tercio por acción de R9 no cambia: la
# forma es espectáculo y estrategia, no dificultad nueva.
RUTA_ARCEUS_PRIMIGENIA_MOVES = [:JUDGMENT, :EXTREMESPEED, :SHADOWFORCE, :GIGAIMPACT]
RUTA_ARCEUS_PRIMIGENIA_GRITOS = [
  "Arceus primigenio golpea como antes de que existir fuera una costumbre.",
  "Sin brazos, sin Tabla, sin testigos: sólo el primer puño del Génesis.",
  "Arceus primigenio no apunta: recuerda dónde estabas y allí apareces.",
  "El vacío original cierra el anillo: Ash, tú también fuiste idea mía."
]
# R12 — EL DIOS JUGADOR. Cuatro sistemas nuevos, todos con escudo propio:
# 1) daño divino VARIABLE por acción (nunca fijo, nunca sobre un tercio);
# 2) mazos de diálogo: ninguna línea se repite hasta agotar su mazo;
# 3) música distinta por fase (pistas reales del juego);
# 4) juegos divinos, invocaciones del lore, copia del equipo y la merced
#    del último Pokémon, todo DENTRO del combate y sin abrir menús externos.
RUTA_ARCEUS_HIT_CAP_MIN = 0.12
RUTA_ARCEUS_HIT_CAP_MIN_TARDIO = 0.18
RUTA_ARCEUS_HIT_CAP_MEGA_EXTRA = 0.04
RUTA_ARCEUS_BGM_POR_FASE = {
  1 => "Legend Sinnoh",
  2 => "Legend Creation Trio",
  3 => "Battle! Legendary Raid",
  4 => "Battle! Eternatus - Phase 1",
  5 => "Battle! Eternatus - Phase 2",
  6 => "Battle! Ultra Necrozma"
}
RUTA_ARCEUS_BGM_PRIMIGENIA = "Battle! Eternatus - Phase 3"
RUTA_ARCEUS_JUEGO_REFUGIOS = ["Tras el fuego", "Tras el agua", "Tras la tierra"]
RUTA_ARCEUS_OFRENDA_ELECCIONES = [
  "Aceptar la merced: equipo y PP al máximo",
  "Rechazarla: ganar con lo que queda"
]
# Mazos de diálogo por categoría: se sacan sin reposición; sólo cuando el mazo
# se agota vuelve a barajarse, así ninguna línea se repite seguidilla.
RUTA_ARCEUS_DIALOGOS = {
  :molestar => [
    "¿{1}? Yo lo soñé entero antes de que existiera su primer ancestro.",
    "Cuida a {1}: lo quiero de una pieza cuando esto termine.",
    "{1} pelea con valentía. La valentía también la inventé yo.",
    "Le diste a {1} un nombre cariñoso, ¿verdad? Lo sé. Lo escucho todo.",
    "{1} recuerda cada entrenamiento. Yo recuerdo cada especie desde la primera.",
    "No odio a {1}. Un dios no odia: corrige.",
    "Ese {1} tuyo confía en ti más que en su propio instinto. Interesante.",
    "He visto extinguirse linajes enteros. {1} todavía respira: aprovéchalo.",
    "¿Sabes qué le prometí a {1} cuando lo diseñé? Que valdría la pena.",
    "Cada vez que {1} te obedece, el mundo recuerda por qué creé el vínculo.",
    "Podría borrar a {1} de la historia. Prefiero ver qué hace contigo.",
    "Tu {1} tiembla y aun así no huye. Eso no lo programé: eso lo aprendió de ti."
  ],
  :juego => [
    "Juguemos. Un dios también se aburre de ganar siempre igual.",
    "Te concedo un juego. Si me sigues el paso, tu premio será aire.",
    "Regla nueva: esta vez no basta con resistir, hay que adivinarme.",
    "El cielo propone un juego. Yo sólo cobro las apuestas.",
    "Descansa del miedo un segundo: juguemos a algo más pequeño.",
    "Todo lo que existe empezó como un juego mío. Juguemos otra vez.",
    "Te dejo elegir. Elige mal y aprenderás; elige bien y me divertiré.",
    "Ni los legendarios se niegan a un juego. Tú tampoco podrás."
  ],
  :invocacion => [
    "No ejecuto yo el apocalipsis: lo ordeno. Que respondan mis creaciones.",
    "Mira hacia arriba, Ash: el cielo se abre cuando se lo pido.",
    "Para borrarte bastaría una palabra mía. Prefiero delegarla.",
    "El Trío, los lagos, los titanes: todos me deben su primer latido.",
    "¿Cansado de mí? Ellos también pegan. Y también obedecen.",
    "Un dios no pelea solo porque no lo necesite: pelea solo porque puede."
  ],
  :copia => [
    "Conozco a {1} golpe por golpe: yo mismo los soñé. Ahora son míos.",
    "Todo lo que les enseñaste a {1} también me lo enseñaste a mí.",
    "Te devolveré tu propio equipo, Ash. Es lo justo: tú empezaste esto.",
    "Guardo copia de cada vínculo que forjaste. La acabo de abrir: {1}.",
    "Tus {1} no tienen secretos para su creador. Sus golpes, tampoco.",
    "Pelea contra lo que tú mismo construiste. Así se conoce a un campeón."
  ],
  :ofrenda => [
    "Queda uno solo en pie. Podría borrarlo ya, pero un dios también sabe ser justo.",
    "Te ofrezco algo que no le ofrecí a nadie: empezar de nuevo, aquí mismo.",
    "Míralo: es el último. ¿Quieres que os cure a todos para que sea parejo?",
    "La piedad es otro poder mío. Hoy te la presto una sola vez."
  ],
  :turno => [
    "Ya respondí con {1} antes de que terminaras de pensarlo.",
    "Observa {1}: así contesta el cielo cuando lo retan.",
    "{1} no es castigo, es lección. Toma apuntes, Ash.",
    "Guardaba {1} para un día como hoy. Hoy es ese día.",
    "¿Ves {1}? Lo escribí la primera mañana del mundo.",
    "Mi respuesta se llama {1}. Tu turno de responder.",
    "Con {1} basta para recordarte quién abrió el cielo.",
    "Cuento tus parpadeos, Ash. Entre dos de ellos cabe {1}.",
    "{1}: la misma palabra con la que separé la luz de la sombra.",
    "Podría haber usado otra cosa. Elegí {1} porque te conoce.",
    "Cada {1} que lanzo recuerda por qué tus Pokémon se niegan a rendirse.",
    "Aprendí {1} viéndote entrenar. Ahora míralo desde este lado."
  ]
}
# Las invocaciones del lore: quién ejecuta qué cuando Arceus da la orden.
# El daño de las invocaciones NUNCA remata (deja al menos 1 PS): el apocalipsis
# presiona, pero el duelo lo cierra Arceus con sus propias acciones.
RUTA_ARCEUS_INVOCACIONES = [
  [:DIALGA,    :ROAROFTIME,     :golpe,   "Dialga congela un segundo del tiempo y lo deja caer entero sobre Ash."],
  [:PALKIA,    :SPACIALREND,    :golpe,   "Palkia rasga el espacio: el golpe llega desde todas partes a la vez."],
  [:GIRATINA,  :SHADOWFORCE,    :golpe,   "Giratina emerge del Mundo Distorsión arrastrando su antimateria."],
  [:REGIGIGAS, :GIGAIMPACT,     :golpe,   "Regigigas empuja la corteza del planeta contra el campo de batalla."],
  [:GROUDON,   :PRECIPICEBLADES,:clima,   "Groudon despierta de su letargo: todos los volcanes obedecen a la vez."],
  [:KYOGRE,    :ORIGINPULSE,    :clima,   "Kyogre despierta: el diluvio que anega continentes cabe en esta cima."],
  [:UXIE,      :PSYCHIC,        :mente,   "Uxie apaga los pensamientos: saber también puede doler."],
  [:MESPRIT,   :PSYCHIC,        :mente,   "Mesprit apaga los sentimientos: sin ellos, el cuerpo pesa el doble."],
  [:AZELF,     :PSYCHIC,        :mente,   "Azelf apaga la voluntad: lo que queda de Ash pelea por inercia."],
  [:MEW,       :AURASPHERE,     :merced,  "Mew, el ancestro, se interpone: hasta el Génesis le debe una chispa de piedad."],
  [:CELEBI,    :HEALPULSE,      :merced,  "Celebi viaja un segundo al futuro y vuelve con la herida ya cerrada."],
  [:RAYQUAZA,  :DRAGONASCENT,   :orden,   "Rayquaza baja del cielo: el equilibrio se somete a la Orden Divina y el campo se aquieta."],
  [:ZYGARDE,   :LANDSWRATH,    :orden,   "Zygarde reúne sus células y calla: cuando el creador ordena el fin, el equilibrio obedece."]
]
RUTA_ARCEUS_STAGE_COUNT = 6
RUTA_ARCEUS_BOSS_LEVELS = [150, 175, 185, 195, 200, 200]
# R8/R9 - el duelo final es jugable de verdad. Ash aprendió mirando cada batalla
# del prólogo, así que sus ataques cuentan contra las barras divinas (nunca
# menos de media barra por impacto) y Arceus no derriba a un Pokémon suyo en un
# solo turno: cada acción enemiga quita como máximo un tercio de la vida máxima
# (cuatro acciones para tumbar a un Pokémon sano) y un Pokémon ya debilitado, por
# debajo de ese tope, sí puede caer. Al cruzar el umbral rojo Arceus ya no borra
# el avance del jugador: sólo recupera media barra, una vez por etapa.
RUTA_ARCEUS_ASH_BAR_POWER = 4.0
RUTA_ARCEUS_ASH_BAR_MIN_RATIO = 0.5
RUTA_ARCEUS_HIT_CAP_RATIO = 0.33
RUTA_ARCEUS_REDLINE_HEAL_RATIO = 0.5
RUTA_ARCEUS_RESTORES = 0
RUTA_ARCEUS_MAIN_RNG_SEED = 0xA2CE05
RUTA_ARCEUS_CINEMATIC_RNG_SEED = 0xC1A0A7

# El motor reserva exactamente cuatro ranuras de movimiento por Pokémon. El
# canon añade movimientos temáticos a las fases, así que nunca se copian listas
# sin límite al objeto Pokémon: se priorizan dos movimientos del canon y se
# completan las ranuras restantes con el set de la fase.
def pbArceusMoveIds(move_ids, phase = nil)
  max_moves = Pokemon::MAX_MOVES
  valid = (move_ids || []).select { |id| GameData::Move.exists?(id) }.uniq
  return valid if valid.length <= max_moves
  canonical = []
  if phase && defined?(CanonArceus) && CanonArceus.respond_to?(:movimientos_para)
    canonical = (CanonArceus.movimientos_para(phase) || []).select { |id| valid.include?(id) }.uniq
  end
  selected = canonical.first([2, max_moves].min)
  valid.each do |id|
    next if canonical.include?(id) || selected.include?(id)
    selected.push(id)
    break if selected.length >= max_moves
  end
  valid.each do |id|
    next if selected.include?(id)
    selected.push(id)
    break if selected.length >= max_moves
  end
  return selected.take(max_moves)
rescue StandardError
  return (move_ids || []).select { |id| GameData::Move.exists?(id) }.uniq.take(Pokemon::MAX_MOVES)
end

# La Ruta de Dios ejecuta combates CPU vs CPU con NPCTrainer también en el
# lado que el motor llama @player. En Essentials v19, pbPlayer devuelve
# @player[0], que allí es un NPCTrainer sin Pokédex. En v20/v21 el dueño real
# es $player; en este build de Fire Ash es $Trainer. Resolver el dex desde el
# jugador global evita el NoMethodError sin cambiar la composición 2v1.
class PokeBattle_Battle
  # Las escenas CPU usan NPCTrainer en @player[0] para controlar sus equipos,
  # pero varias rutinas del motor (velocidad y escalado por medallas) esperan
  # un Player real. En esas escenas, delega esas consultas al dueño global.
  alias _ruta_arceus_original_pb_player pbPlayer unless method_defined?(:_ruta_arceus_original_pb_player)
  def pbPlayer
    battle_player = _ruta_arceus_original_pb_player
    return battle_player if battle_player && battle_player.respond_to?(:badge_count)
    return $player if defined?($player) && $player && $player.respond_to?(:badge_count)
    return $Trainer if defined?($Trainer) && $Trainer && $Trainer.respond_to?(:badge_count)
    return battle_player
  end

  def ruta_arceus_pokedex
    owners = []
    owners.push($player) if defined?($player) && $player
    owners.push($Trainer) if defined?($Trainer) && $Trainer
    owners.each do |owner|
      next if !owner.respond_to?(:pokedex)
      pokedex = owner.pokedex
      return pokedex if pokedex && pokedex.respond_to?(:register)
    end
    # Compatibilidad adicional para batallas antiguas sin variable global
    # disponible: sólo acepta un Player real, nunca un NPCTrainer sin Pokédex.
    battle_players = instance_variable_get(:@player) if instance_variable_defined?(:@player)
    battle_players = [battle_players] if battle_players && !battle_players.is_a?(Array)
    if battle_players
      battle_players.each do |owner|
        next if !owner || !owner.respond_to?(:pokedex)
        pokedex = owner.pokedex
        return pokedex if pokedex && pokedex.respond_to?(:register)
      end
    end
    return nil
  end

  def pbSetSeen(battler)
    return if !battler || !@internalBattle
    pokedex = ruta_arceus_pokedex
    return if !pokedex
    return if !battler.respond_to?(:displaySpecies) || !battler.respond_to?(:displayGender) ||
              !battler.respond_to?(:displayForm)
    pokedex.register(battler.displaySpecies, battler.displayGender, battler.displayForm)

    # En un combate de entrenador registra el equipo rival completo al mostrar
    # el primer Pokémon. Así los seis de Cintia (Spiritomb, Togekiss, Milotic,
    # Lucario, Roserade y Garchomp) quedan vistos aunque uno no llegue a salir.
    if battler.respond_to?(:opposes?) && battler.opposes? && trainerBattle?
      party = pbParty(battler.index)
      party.each do |pokemon|
        next if !pokemon || !pokemon.respond_to?(:species)
        species = pokemon.species
        next if !species
        gender = pokemon.respond_to?(:gender) ? pokemon.gender : 2
        form = pokemon.respond_to?(:form) ? pokemon.form : 0
        pokedex.register(species, gender, form)
      end
    end
  end

  def pbSetBattled(battler)
    return if !battler || !@internalBattle || !battler.respond_to?(:opposes?) || !battler.opposes?
    pokedex = ruta_arceus_pokedex
    return if !pokedex || !pokedex.respond_to?(:register_battled)
    pokedex.register_battled(battler.displaySpecies)
  end
end

class PokeBattle_Battler
  alias _ruta_arceus_original_level level unless method_defined?(:_ruta_arceus_original_level)
  def level
    controlled = instance_variable_get(:@ruta_arceus_effective_level)
    return controlled.to_i if controlled && controlled.to_i > 0
    return _ruta_arceus_original_level
  end

  def ruta_arceus_captured_god?
    return false if !@pokemon
    return pbRutaArceusCapturedPokemon?(@pokemon)
  end

  def ruta_arceus_captured_god_active?
    return ruta_arceus_captured_god? && pbRutaArceusGodWorldAllowed?
  end

  def ruta_arceus_universal_stab?
    return ruta_arceus_captured_god_active?
  end

  alias _ruta_arceus_original_initialize pbInitialize unless method_defined?(:_ruta_arceus_original_initialize)
  def pbInitialize(pkmn, idxParty, batonPass = false)
    pbRutaArceusSyncCapturedPokemonMode(pkmn) if pbRutaArceusCapturedPokemon?(pkmn)
    result = _ruta_arceus_original_initialize(pkmn, idxParty, batonPass)
    pbRutaArceusRestorePokemonPP(pkmn) if ruta_arceus_captured_god_active?
    return result
  end

  alias _ruta_arceus_original_has_type pbHasType? unless method_defined?(:_ruta_arceus_original_has_type)
  def pbHasType?(type)
    return true if type && ruta_arceus_universal_stab?
    return _ruta_arceus_original_has_type(type)
  end

  alias _ruta_arceus_original_set_pp pbSetPP unless method_defined?(:_ruta_arceus_original_set_pp)
  def pbSetPP(move, pp)
    if ruta_arceus_captured_god_active? && move && move.respond_to?(:total_pp) &&
       move.total_pp.to_i > 0 && move.pp.to_i >= 0
      pp = move.total_pp
    end
    return _ruta_arceus_original_set_pp(move, pp)
  end

  alias _ruta_arceus_original_reduce_pp pbReducePP unless method_defined?(:_ruta_arceus_original_reduce_pp)
  def pbReducePP(move)
    if ruta_arceus_captured_god_active? && move && move.respond_to?(:total_pp) &&
       move.total_pp.to_i > 0 && move.pp.to_i >= 0
      pbSetPP(move, move.total_pp) if move.pp.to_i < move.total_pp.to_i
      return true
    end
    return _ruta_arceus_original_reduce_pp(move)
  end

  alias _ruta_arceus_original_reduce_pp_other pbReducePPOther unless method_defined?(:_ruta_arceus_original_reduce_pp_other)
  def pbReducePPOther(move)
    if ruta_arceus_captured_god_active? && move && move.respond_to?(:total_pp) &&
       move.total_pp.to_i > 0 && move.pp.to_i >= 0
      pbSetPP(move, move.total_pp)
      return
    end
    return _ruta_arceus_original_reduce_pp_other(move)
  end

  alias _ruta_arceus_original_change_form pbChangeForm unless method_defined?(:_ruta_arceus_original_change_form)
  def pbChangeForm(newForm, msg)
    changed_type = nil
    changed_index = nil
    if ruta_arceus_captured_god_active? && !fainted? && !@effects[PBEffects::Transform] &&
       @form != newForm
      changed_type = RUTA_ARCEUS_FORM_TYPES[newForm.to_i]
      if changed_type
        changed_index = RUTA_ARCEUS_PHASE_TYPES.index(changed_type)
        @battle.pbArceusCapturedPlateRotation(self, changed_type, changed_index) if @battle
      end
    end
    result = _ruta_arceus_original_change_form(newForm, msg)
    if changed_type && @form == newForm
      pbChangeTypes([changed_type])
      instance_variable_set(:@ruta_arceus_plate_index, changed_index)
      @battle.pbArceusTypeShiftVisual(self, changed_type) if @battle
    end
    return result
  end

  alias _ruta_arceus_original_use_move pbUseMove unless method_defined?(:_ruta_arceus_original_use_move)
  def pbUseMove(choice, specialUsage = false)
    battle = @battle
    depth = battle ? battle.instance_variable_get(:@ruta_arceus_move_resolution_depth).to_i : 0
    battle.instance_variable_set(:@ruta_arceus_move_resolution_depth, depth + 1) if battle
    return _ruta_arceus_original_use_move(choice, specialUsage)
  ensure
    battle.instance_variable_set(:@ruta_arceus_move_resolution_depth, depth) if battle
  end

  # Sólo las instancias marcadas para la cima/prólogo son inmunes: un Arceus
  # normal del jugador conserva las reglas estándar fuera de la whitelist.
  def ruta_arceus_immune_target?
    return false if !@pokemon || @pokemon.species != :ARCEUS
    return true if @pokemon.instance_variable_get(:@ruta_arceus_divine) == true
    return true if @pokemon.instance_variable_get(:@ruta_arceus_cinematic_boss) == true
    return ruta_arceus_captured_god_active?
  end

  # La escena CPU tiene su propio Arceus temporal; el boss capturado usa otro
  # marcador y nunca entra en esta protección.
  def ruta_arceus_cinematic_boss?
    return false if !@pokemon || @pokemon.species != :ARCEUS
    return false if @pokemon.instance_variable_get(:@ruta_arceus_cinematic_boss) != true
    return @battle && @battle.respond_to?(:arceus_cinematic?) && @battle.arceus_cinematic?
  end

  # Sólo el guion de la cima puede escribir los PS del Arceus divino (barras,
  # captura y curaciones). Cualquier otra ruta queda bloqueada por el setter.
  def ruta_arceus_scripted_hp_write
    @ruta_arceus_scripted_hp_write = true
    begin
      yield
    ensure
      @ruta_arceus_scripted_hp_write = false
    end
  end

  # Arceus divino = el jefe real del duelo de Ash (nivel 200, seis barras). No se
  # confunde con el Arceus temporal de las cinemáticas ni con el capturado.
  def ruta_arceus_divine_boss?
    return false if !@pokemon || @pokemon.species != :ARCEUS
    return false if @pokemon.instance_variable_get(:@ruta_arceus_divine) != true
    return false if !@battle || !@battle.respond_to?(:arceus_divine?)
    battlers = @battle.instance_variable_get(:@battlers)
    return false if !battlers || battlers.empty?
    return @battle.arceus_divine? == true
  rescue StandardError
    return false
  end

  # Ninguna ruta externa (clima, retroceso, habilidades, movimientos custom,
  # plugins o una escritura directa de PS) puede lastimar a los Arceus de La Ruta
  # de Dios. El daño legítimo entra por pbReduceHP/pbInflictHPDamage, y el daño
  # del duelo real mueve las seis barras a través del guion.
  alias _ruta_arceus_original_set_hp hp= unless method_defined?(:_ruta_arceus_original_set_hp)
  def hp=(value)
    if !@ruta_arceus_scripted_hp_write
      if ruta_arceus_cinematic_boss?
        if value.to_i < @hp.to_i && @battle && @battle.respond_to?(:pbArceusCinematicAbsorb)
          @battle.pbArceusCinematicAbsorb(self, @hp.to_i - value.to_i)
        end
        return
      end
      if ruta_arceus_divine_boss? && value.to_i < @hp.to_i
        return
      end
    end
    _ruta_arceus_original_set_hp(value)
  end

  alias _ruta_arceus_original_reduce_hp pbReduceHP unless method_defined?(:_ruta_arceus_original_reduce_hp)
  def pbReduceHP(amt, anim = true, registerDamage = true, anyAnim = true)
    if @battle && @battle.respond_to?(:arceus_cinematic?) && @battle.arceus_cinematic?
      amt = @battle.arceus_cinematic_damage(self, amt)
      if amt == :ruta_arceus_cinematic_rebirth
        @battle.pbArceusCinematicRebirth(self)
        return 0
      end
      if amt == :ruta_arceus_cinematic_absorb || amt == :ruta_arceus_hold_at_one
        if @battle.respond_to?(:pbArceusCinematicAbsorb)
          pending = @battle.instance_variable_get(:@ruta_arceus_cinematic_pending_damage).to_i
          @battle.pbArceusCinematicAbsorb(self, pending)
        end
        return 0
      end
    end
    if @battle && @battle.respond_to?(:arceus_divine?) && @battle.arceus_divine?
      amt = @battle.arceus_before_damage(self, amt)
      if amt == :ruta_arceus_stage_break
        @battle.pbArceusDepleteBar(self)
        return 0
      end
      return 0 if amt == :ruta_arceus_hold_at_one || amt == :ruta_arceus_no_damage
      ret = ruta_arceus_scripted_hp_write { _ruta_arceus_original_reduce_hp(amt, anim, registerDamage, anyAnim) }
      if registerDamage && !@battle.instance_variable_get(:@endOfRound)
        @battle.pbArceusRedlineHeal(self)
      end
      return ret
    end
    return ruta_arceus_scripted_hp_write { _ruta_arceus_original_reduce_hp(amt, anim, registerDamage, anyAnim) }
  end

  # Respaldo ante cualquier movimiento/plugin que salte las rutas normales de
  # daño: ni el Arceus de las cinemáticas ni el del duelo real pueden ser
  # derrotados y cerrar la escena como una derrota.
  alias _ruta_arceus_original_cinematic_faint pbFaint unless method_defined?(:_ruta_arceus_original_cinematic_faint)
  def pbFaint(showMessage = true)
    if ruta_arceus_cinematic_boss?
      # El jefe de apoyo jamás cae: se restaura por completo y se burla, aunque
      # una ruta externa haya declarado su derrota.
      ruta_arceus_scripted_hp_write { _ruta_arceus_original_set_hp(totalhp) }
      @battle.pbArceusCinematicRebirth(self) if @battle && @battle.respond_to?(:pbArceusCinematicRebirth)
      return
    end
    if ruta_arceus_divine_boss? && fainted?
      # Red de seguridad del duelo real: sólo la sexta barra deja a Arceus a
      # 1 PS para la captura; nunca se registra una derrota del dios.
      ruta_arceus_scripted_hp_write { _ruta_arceus_original_set_hp([totalhp, 1].max) }
      @battle.pbArceusRedlineHeal(self, true) if @battle && @battle.respond_to?(:pbArceusRedlineHeal)
      return
    end
    return _ruta_arceus_original_cinematic_faint(showMessage)
  end

  alias _ruta_arceus_original_can_inflict_status pbCanInflictStatus? unless method_defined?(:_ruta_arceus_original_can_inflict_status)
  def pbCanInflictStatus?(newStatus, user, showMessages, move = nil, ignoreStatus = false)
    if ruta_arceus_immune_target?
      @battle.pbDisplay(_INTL("El aura divina de Arceus rechaza cualquier cambio de estado.")) if showMessages && @battle
      return false
    end
    return _ruta_arceus_original_can_inflict_status(newStatus, user, showMessages, move, ignoreStatus)
  end

  alias _ruta_arceus_original_can_confuse pbCanConfuse? unless method_defined?(:_ruta_arceus_original_can_confuse)
  def pbCanConfuse?(user = nil, showMessages = true, move = nil, selfInflicted = false)
    if ruta_arceus_immune_target?
      @battle.pbDisplay(_INTL("Arceus no puede ser confundido.")) if showMessages && @battle
      return false
    end
    return _ruta_arceus_original_can_confuse(user, showMessages, move, selfInflicted)
  end

  alias _ruta_arceus_original_can_attract pbCanAttract? unless method_defined?(:_ruta_arceus_original_can_attract)
  def pbCanAttract?(user, showMessages = true)
    if ruta_arceus_immune_target?
      @battle.pbDisplay(_INTL("Arceus no puede ser atraído ni distraído.")) if showMessages && @battle
      return false
    end
    return _ruta_arceus_original_can_attract(user, showMessages)
  end

  alias _ruta_arceus_original_can_sleep_yawn pbCanSleepYawn? unless method_defined?(:_ruta_arceus_original_can_sleep_yawn)
  def pbCanSleepYawn?
    return false if ruta_arceus_immune_target?
    return _ruta_arceus_original_can_sleep_yawn
  end

  alias _ruta_arceus_original_flinch pbFlinch unless method_defined?(:_ruta_arceus_original_flinch)
  def pbFlinch(user = nil)
    return false if ruta_arceus_immune_target?
    return _ruta_arceus_original_flinch(user)
  end

  alias _ruta_arceus_original_can_lower_stage pbCanLowerStatStage? unless method_defined?(:_ruta_arceus_original_can_lower_stage)
  def pbCanLowerStatStage?(stat, user = nil, move = nil, showFailMsg = false, ignoreContrary = false)
    if ruta_arceus_immune_target?
      @battle.pbDisplay(_INTL("El poder de Arceus no puede ser reducido.")) if showFailMsg && @battle
      return false
    end
    return _ruta_arceus_original_can_lower_stage(stat, user, move, showFailMsg, ignoreContrary)
  end

  alias _ruta_arceus_original_lower_stage_basic pbLowerStatStageBasic unless method_defined?(:_ruta_arceus_original_lower_stage_basic)
  def pbLowerStatStageBasic(stat, increment, ignoreContrary = false)
    return 0 if ruta_arceus_immune_target?
    return _ruta_arceus_original_lower_stage_basic(stat, increment, ignoreContrary)
  end

  alias _ruta_arceus_original_lower_stage pbLowerStatStage unless method_defined?(:_ruta_arceus_original_lower_stage)
  def pbLowerStatStage(stat, increment, user, showAnim = true, ignoreContrary = false, ignoreMirrorArmor = false)
    return false if ruta_arceus_immune_target?
    return _ruta_arceus_original_lower_stage(stat, increment, user, showAnim, ignoreContrary, ignoreMirrorArmor)
  end
end

class PokeBattle_Battler
  alias _ruta_arceus_original_success_check pbSuccessCheckAgainstTarget unless method_defined?(:_ruta_arceus_original_success_check)
  def pbSuccessCheckAgainstTarget(move, user, target)
    if move && move.id == :JUDGMENT && user && user.respond_to?(:ruta_arceus_captured_god_active?) &&
       user.ruta_arceus_captured_god_active? && target && !target.fainted? &&
       target.opposes? != user.opposes?
      target.damageState.unaffected = false
      target.damageState.protected = false
      target.damageState.typeMod = Effectiveness::SUPER_EFFECTIVE_ONE
      return true
    end
    return _ruta_arceus_original_success_check(move, user, target)
  end
end

# --- Compatibilidad del motor: Ball Breaker y los ayudantes de protección ----
# La sección "Despacito Despair" define PokeBattle_Move_DF08 (Ball Breaker, el
# movimiento de dos turnos de acero del Metagross de Steven) y allí se consulta
# target.selfProtected? / target.sideProtected?. Esos dos métodos no existen en
# este motor, así que cualquier uso del movimiento abortaba el combate con
# "undefined method 'selfProtected?' for an instance of PokeBattle_Battler"
# (visto en la cima contra el Metagross de las cinemáticas). Se restauran aquí
# con la misma semántica que el motor usa en PokeBattle_Move_0CD (Phantom
# Force/Shadow Force, que también anula las protecciones) y se vuelve a escribir
# el efecto del movimiento para que nunca dependa de métodos ausentes.
module RutaDeDiosBallBreaker
  SELF_FLAGS = [:BanefulBunker, :KingsShield, :Protect, :SpikyShield, :Obstruct].freeze
  SIDE_FLAGS = [:CraftyShield, :MatBlock, :QuickGuard, :WideGuard].freeze

  def self.flag_active?(holder, names)
    return false if !holder || !holder.respond_to?(:effects)
    efectos = holder.effects
    return false if !efectos
    return names.any? { |nombre| efectos[PBEffects.const_get(nombre)] }
  rescue StandardError
    return false
  end

  def self.clear_protections!(target)
    return false if !target
    if target.respond_to?(:effects)
      SELF_FLAGS.each { |nombre| target.effects[PBEffects.const_get(nombre)] = false }
    end
    side = target.respond_to?(:pbOwnSide) ? target.pbOwnSide : nil
    if side && side.respond_to?(:effects)
      SIDE_FLAGS.each { |nombre| side.effects[PBEffects.const_get(nombre)] = false }
    end
    return true
  rescue StandardError
    return false
  end
end

class PokeBattle_Battler
  unless method_defined?(:selfProtected?)
    # ¿Lo protege un movimiento propio (Protect, King's Shield, Obstruct…)?
    def selfProtected?
      return RutaDeDiosBallBreaker.flag_active?(self, RutaDeDiosBallBreaker::SELF_FLAGS)
    end
  end

  unless method_defined?(:sideProtected?)
    # ¿Lo protege un movimiento de su lado (Wide Guard, Crafty Shield…)?
    def sideProtected?
      side = respond_to?(:pbOwnSide) ? pbOwnSide : nil
      return RutaDeDiosBallBreaker.flag_active?(side, RutaDeDiosBallBreaker::SIDE_FLAGS)
    end
  end
end

if defined?(PokeBattle_Move_DF08) && PokeBattle_Move_DF08.is_a?(Class)
  class PokeBattle_Move_DF08
    # Igual que PokeBattle_Move_0CD, pero sin depender de ayudantes ausentes: si
    # existen se aprovechan para el texto y, en cualquier caso, se retiran todas
    # las protecciones del objetivo (Ball Breaker las atraviesa).
    def pbAttackingTurnEffect(user, target)
      return if !target
      self_prot = target.respond_to?(:selfProtected?) ? target.selfProtected? : false
      side_prot = target.respond_to?(:sideProtected?) ? target.sideProtected? : false
      if (self_prot || side_prot) && @battle && @battle.respond_to?(:pbDisplay) && target.respond_to?(:pbThis)
        nombre = target.pbThis
        if self_prot && side_prot
          @battle.pbDisplay(_INTL("All protections on {1} and its side ended!", nombre))
        elsif self_prot
          @battle.pbDisplay(_INTL("{1}'s protection ended!", nombre))
        else
          @battle.pbDisplay(_INTL("All protections on {1}'s side ended!", nombre))
        end
      end
      RutaDeDiosBallBreaker.clear_protections!(target)
      return true
    rescue StandardError
      RutaDeDiosBallBreaker.clear_protections!(target) if target
      return false
    end
  end
end

# En las escenas cinematográficas, Arceus no falla su golpe de guion. El Arceus
# capturado activo obtiene precisión, efectividad y KO garantizados en Judgment.
class PokeBattle_Move
  def ruta_arceus_captured_judgment_active?(user)
    return false if @id != :JUDGMENT || !user ||
                    !user.respond_to?(:ruta_arceus_captured_god_active?)
    return user.ruta_arceus_captured_god_active?
  end

  def ruta_arceus_captured_judgment_attacker
    return nil if @id != :JUDGMENT || !@battle || !@battle.respond_to?(:battlers)
    return nil if !@battle.respond_to?(:lastMoveUsed) || @battle.lastMoveUsed != :JUDGMENT
    index = @battle.lastMoveUser
    return nil if index.nil? || index < 0
    battler = @battle.battlers[index]
    return nil if !ruta_arceus_captured_judgment_active?(battler)
    return battler
  rescue StandardError
    return nil
  end

  alias _ruta_arceus_original_accuracy_check pbAccuracyCheck unless method_defined?(:_ruta_arceus_original_accuracy_check)
  def pbAccuracyCheck(user, target)
    return true if ruta_arceus_captured_judgment_active?(user)
    if @battle && @battle.respond_to?(:arceus_cinematic?) && @battle.arceus_cinematic? &&
       user && user.pokemon && user.pokemon.species == :ARCEUS
      return true
    end
    return _ruta_arceus_original_accuracy_check(user, target)
  end

  alias _ruta_arceus_original_calc_type_mod pbCalcTypeMod unless method_defined?(:_ruta_arceus_original_calc_type_mod)
  def pbCalcTypeMod(moveType, user, target)
    if damagingMove? && user && target && target.respond_to?(:ruta_arceus_captured_god_active?) &&
       target.ruta_arceus_captured_god_active? && @battle &&
       @battle.instance_variable_get(:@ruta_arceus_move_resolution_depth).to_i > 0 &&
       @battle.lastMoveUser == user.index
      @battle.pbArceusReactiveDefense(target, moveType, user) if @battle.respond_to?(:pbArceusReactiveDefense)
    end
    type_mod = _ruta_arceus_original_calc_type_mod(moveType, user, target)
    if ruta_arceus_captured_judgment_active?(user) && target && target.opposes? != user.opposes?
      minimum = Effectiveness::SUPER_EFFECTIVE_ONE
      return type_mod if type_mod && type_mod >= minimum
      return minimum
    end
    return type_mod
  end

  alias _ruta_arceus_original_check_damage_absorption pbCheckDamageAbsorption unless method_defined?(:_ruta_arceus_original_check_damage_absorption)
  def pbCheckDamageAbsorption(user, target)
    return if ruta_arceus_captured_judgment_active?(user)
    return _ruta_arceus_original_check_damage_absorption(user, target)
  end

  alias _ruta_arceus_original_ignores_substitute ignoresSubstitute? unless method_defined?(:_ruta_arceus_original_ignores_substitute)
  def ignoresSubstitute?(user)
    return true if ruta_arceus_captured_judgment_active?(user)
    return _ruta_arceus_original_ignores_substitute(user)
  end

  alias _ruta_arceus_original_ignores_endure ignoresEndure? unless method_defined?(:_ruta_arceus_original_ignores_endure)
  def ignoresEndure?
    return true if ruta_arceus_captured_judgment_attacker
    return _ruta_arceus_original_ignores_endure
  end

  alias _ruta_arceus_original_reduce_damage pbReduceDamage unless method_defined?(:_ruta_arceus_original_reduce_damage)
  def pbReduceDamage(user, target)
    force_judgment_ko = ruta_arceus_captured_judgment_active?(user) && target && target.hp > 0
    total_lost_before = target.damageState.totalHPLost.to_i if force_judgment_ko
    result = _ruta_arceus_original_reduce_damage(user, target)
    if force_judgment_ko
      hp_to_remove = target.hp.to_i
      target.damageState.unaffected = false
      target.damageState.substitute = false
      target.damageState.disguise = false
      target.damageState.iceface = false
      target.damageState.endured = false
      target.damageState.sturdy = false
      target.damageState.sturdyLegend = false
      target.damageState.focusSash = false
      target.damageState.focusBand = false
      target.damageState.typeMod = Effectiveness::SUPER_EFFECTIVE_ONE
      target.damageState.hpLost = hp_to_remove
      target.damageState.totalHPLost = total_lost_before + hp_to_remove
      target.effects[PBEffects::Substitute] = 0 if target.effects[PBEffects::Substitute].to_i > 0
    end
    # R8: la guardia anti-KO vive en la batalla; desde el movimiento se llama a
    # través de @battle (la clase PokeBattle_Move no define esos ayudantes).
    if @battle && @battle.respond_to?(:ruta_arceus_apply_ohko_guard) && target &&
       target.respond_to?(:damageState)
      @battle.ruta_arceus_apply_ohko_guard(user, target)
    end
    return result
  end

  def ruta_arceus_cinematic_boss_target?(target)
    return target && target.respond_to?(:ruta_arceus_cinematic_boss?) &&
           target.ruta_arceus_cinematic_boss?
  end

  def ruta_arceus_divine_boss_target?(target)
    return target && target.respond_to?(:ruta_arceus_divine_boss?) &&
           target.ruta_arceus_divine_boss?
  end

  # Essentials aplica el daño de los movimientos con target.hp -= hpLost, una
  # ruta que no pasa por pbReduceHP. Aquí se cubren los dos Arceus de la cima:
  # el de las cinemáticas absorbe todo sin perder PS y el del duelo divino mueve
  # sus seis barras, así que ni el clima ni un Metagross pueden derrotarlos.
  alias _ruta_arceus_original_inflict_hp_damage pbInflictHPDamage unless method_defined?(:_ruta_arceus_original_inflict_hp_damage)
  def pbInflictHPDamage(target)
    if ruta_arceus_cinematic_boss_target?(target) &&
       !target.damageState.substitute && !target.damageState.disguise && !target.damageState.iceface
      attempted_damage = target.damageState.hpLost.to_i
      target.damageState.hpLost = 0
      target.damageState.totalHPLost = [target.damageState.totalHPLost.to_i - attempted_damage, 0].max
      target.damageState.endured = false
      target.damageState.sturdy = false
      target.damageState.sturdyLegend = false
      target.damageState.focusSash = false
      target.damageState.focusBand = false
      if attempted_damage > 0 && @battle && @battle.respond_to?(:pbArceusCinematicAbsorb)
        @battle.pbArceusCinematicAbsorb(target, attempted_damage)
      end
      return _ruta_arceus_original_inflict_hp_damage(target)
    end
    if ruta_arceus_divine_boss_target?(target) && @battle &&
       @battle.respond_to?(:pbArceusDivineBarDamage)
      attempted_damage = target.damageState.hpLost.to_i
      applied = @battle.pbArceusDivineBarDamage(target, attempted_damage).to_i
      target.damageState.hpLost = applied
      target.damageState.totalHPLost = [target.damageState.totalHPLost.to_i -
                                        (attempted_damage - applied), 0].max
      if applied <= 0
        target.damageState.endured = false
        target.damageState.sturdy = false
        target.damageState.sturdyLegend = false
        target.damageState.focusSash = false
        target.damageState.focusBand = false
      end
      result = target.ruta_arceus_scripted_hp_write do
        _ruta_arceus_original_inflict_hp_damage(target)
      end
      if applied > 0 && @battle.respond_to?(:pbArceusRedlineHeal)
        @battle.pbArceusRedlineHeal(target)
      end
      return result
    end
    return _ruta_arceus_original_inflict_hp_damage(target)
  end
end

class PokeBattle_Move_09F
  alias _ruta_arceus_original_base_type pbBaseType unless method_defined?(:_ruta_arceus_original_base_type)
  def pbBaseType(user)
    return _ruta_arceus_original_base_type(user) if @id != :JUDGMENT || !user
    if user.respond_to?(:ruta_arceus_captured_god?) && user.ruta_arceus_captured_god?
      if !user.ruta_arceus_captured_god_active?
        return :NORMAL if user.item == :LEGENDPLATE
        return _ruta_arceus_original_base_type(user)
      end
      return _ruta_arceus_original_base_type(user) if user.effects[PBEffects::Transform]
      return _ruta_arceus_original_base_type(user) if !@battle ||
        @battle.instance_variable_get(:@ruta_arceus_move_resolution_depth).to_i <= 0
      choice = @battle.choices[user.index] rescue nil
      targets = choice ? user.pbFindTargets(choice, self, user) : []
      targets = user.pbChangeTargets(self, user, targets) if targets && !targets.empty?
      target = targets && targets.find { |candidate| candidate && !candidate.fainted? }
      if target
        chosen_type = @battle.pbArceusBestJudgmentType(user, target)
        new_form = RUTA_ARCEUS_TYPE_FORMS[chosen_type]
        if new_form && user.form != new_form
          user.pbChangeForm(new_form, _INTL("Arceus elige el tipo {1} más eficaz contra {2}.",
                                             GameData::Type.get(chosen_type).name, target.pbThis))
        end
        user.pbChangeTypes([chosen_type])
        user.instance_variable_set(:@ruta_arceus_plate_index, RUTA_ARCEUS_PHASE_TYPES.index(chosen_type))
        return chosen_type
      end
      return :NORMAL
    end
    return _ruta_arceus_original_base_type(user)
  rescue StandardError
    return _ruta_arceus_original_base_type(user)
  end
end

# Las escenas cinematográficas pueden involucrar entrenadores cuyo sprite trasero
# no está cargado; el motor da por hecho que hay bitmap al seguir la mano del
# entrenador (ballTracksHand lee traSprite.bitmap.width) y abortaría el combate
# con "undefined method 'width' for nil". Sin sprite visible, la bola simplemente
# sale desde el borde de la pantalla.
module PokeBattle_BallAnimationMixin
  unless method_defined?(:_ruta_arceus_original_ball_tracks_hand)
    alias _ruta_arceus_original_ball_tracks_hand ballTracksHand
  end

  def ballTracksHand(ball, traSprite, safariThrow = false)
    if !traSprite || !traSprite.bitmap || traSprite.bitmap.disposed?
      return [-6, 202]
    end
    return _ruta_arceus_original_ball_tracks_hand(ball, traSprite, safariThrow)
  end
end

# Entrada a medida: el rival salvaje oculto durante el telón de batalla se revela
# con escala, tono frío, cry y caja de datos. El resto de encuentros conserva la
# animación original del motor.
class PokeBattle_Scene
  alias _ruta_arceus_original_battle_intro pbBattleIntroAnimation unless method_defined?(:_ruta_arceus_original_battle_intro)
  def pbBattleIntroAnimation
    return _ruta_arceus_original_battle_intro if !@battle || !@battle.respond_to?(:arceus_divine?) || !@battle.arceus_divine?
    @squareShinyAnim = pbCommonAnimationExists?("SquareShiny")
    foes = []
    @battle.pbParty(1).each_with_index do |_pokemon, i|
      index = 2 * i + 1
      next if !@battle.battlers[index]
      foes.push(index)
      @sprites["pokemon_#{index}"].visible = false if @sprites["pokemon_#{index}"]
      @sprites["shadow_#{index}"].visible = false if @sprites["shadow_#{index}"]
      @sprites["dataBox_#{index}"].visible = false if @sprites["dataBox_#{index}"]
    end
    intro = BattleIntroAnimation.new(@sprites, @viewport, @battle)
    loop do
      intro.update
      pbUpdate
      break if intro.animDone?
    end
    intro.dispose
    foes.each do |index|
      @sprites["pokemon_#{index}"].visible = false if @sprites["pokemon_#{index}"]
      @sprites["shadow_#{index}"].visible = false if @sprites["shadow_#{index}"]
      @sprites["dataBox_#{index}"].visible = false if @sprites["dataBox_#{index}"]
    end
    foes.each do |index|
      sprite = @sprites["pokemon_#{index}"]
      next if !sprite
      sprite.visible = true
      sprite.opacity = 0
      sprite.zoom_x = 0.46
      sprite.zoom_y = 0.46
      sprite.tone = Tone.new(170, 205, 255, 190)
      32.times do |frame|
        t = (frame + 1).to_f / 32
        ease = t * t * (3 - 2 * t)
        size = 0.46 + 0.54 * ease
        sprite.zoom_x = size
        sprite.zoom_y = size
        sprite.opacity = (255 * ease).round
        sprite.tone = Tone.new((170 * (1 - ease)).round,
                               (205 * (1 - ease)).round,
                               (255 * (1 - ease)).round,
                               (190 * (1 - ease)).round)
        pbUpdate
      end
      sprite.zoom_x = 1.0
      sprite.zoom_y = 1.0
      sprite.opacity = 255
      sprite.tone = Tone.new(0, 0, 0, 0)
      shadow = @sprites["shadow_#{index}"]
      shadow.visible = true if shadow
      sprite.pbPlayIntroAnimation if sprite.respond_to?(:pbPlayIntroAnimation)
      @animations.push(DataBoxAppearAnimation.new(@sprites, @viewport, index))
      while inPartyAnimation?; pbUpdate; end
      if @battle.showAnims && @battle.battlers[index].shiny?
        if Settings::SQUARE_SHINY && @battle.battlers[index].square_shiny? && @squareShinyAnim
          pbCommonAnimation("SquareShiny", @battle.battlers[index])
        else
          pbCommonAnimation("Shiny", @battle.battlers[index])
        end
      end
    end
  rescue StandardError
    @battle.pbParty(1).each_with_index do |_pokemon, i|
      index = 2 * i + 1
      sprite = @sprites["pokemon_#{index}"] if @sprites
      if sprite
        sprite.visible = true
        sprite.zoom_x = 1.0
        sprite.zoom_y = 1.0
        sprite.opacity = 255
        sprite.tone = Tone.new(0, 0, 0, 0)
      end
      @sprites["shadow_#{index}"].visible = true if @sprites && @sprites["shadow_#{index}"]
      @sprites["dataBox_#{index}"].visible = true if @sprites && @sprites["dataBox_#{index}"]
    end
    return _ruta_arceus_original_battle_intro
  end
end

class PokeBattle_Battle
  attr_accessor :arceus_restores_used
  attr_accessor :arceus_bars_depleted

  def pbArceusMoveResolution?
    return @ruta_arceus_move_resolution_depth.to_i > 0
  end

  # La entrada del Arceus capturado elimina el campo antes de que pbSendOut
  # aplique cualquier daño de hazards al Pokémon que acaba de salir.
  def pbArceusPurgeCapturedField
    return false if !@field
    changed = false
    side_defaults = {
      :Spikes => 0, :ToxicSpikes => 0, :StealthRock => false,
      :StickyWeb => false, :StickyWebUser => -1,
      :Reflect => 0, :LightScreen => 0, :AuroraVeil => 0,
      :Safeguard => 0, :Mist => 0, :CraftyShield => false,
      :MatBlock => false, :QuickGuard => false, :WideGuard => false,
      :LuckyChant => 0, :Tailwind => 0, :Rainbow => 0,
      :SeaOfFire => 0, :Swamp => 0
    }
    (@sides || []).each do |side|
      next if !side || !side.respond_to?(:effects)
      side_defaults.each do |name, value|
        next if !PBEffects.const_defined?(name)
        index = PBEffects.const_get(name)
        changed = true if side.effects[index] != value
        side.effects[index] = value
      end
    end
    if @field.respond_to?(:weather=)
      changed = true if @field.weather != :None || @field.defaultWeather != :None || @field.weatherDuration.to_i != 0
      @field.weather = :None
      @field.defaultWeather = :None if @field.respond_to?(:defaultWeather=)
      @field.weatherDuration = 0 if @field.respond_to?(:weatherDuration=)
    end
    if @field.respond_to?(:terrain=)
      changed = true if @field.terrain != :None || @field.defaultTerrain != :None || @field.terrainDuration.to_i != 0
      @field.terrain = :None
      @field.defaultTerrain = :None if @field.respond_to?(:defaultTerrain=)
      @field.terrainDuration = 0 if @field.respond_to?(:terrainDuration=)
    end
    if changed
      pbDisplayPaused(_INTL("La entrada de Arceus purga hazards, pantallas, clima y terreno de ambos lados del campo."))
    end
    return changed
  rescue StandardError
    return false
  end

  def pbArceusRestoreCapturedBattlePP(battler)
    return false if !battler || !battler.respond_to?(:ruta_arceus_captured_god_active?) ||
                    !battler.ruta_arceus_captured_god_active?
    pbRutaArceusRestorePokemonPP(battler.pokemon)
    battler.moves.each do |move|
      next if !move || !move.respond_to?(:total_pp) || move.total_pp.to_i <= 0
      battler.pbSetPP(move, move.total_pp)
    end
    return true
  rescue StandardError
    return false
  end

  alias _ruta_arceus_original_send_out pbSendOut unless method_defined?(:_ruta_arceus_original_send_out)
  def pbSendOut(sendOuts, startBattle = false)
    send_outs = sendOuts || []
    captured_god_entering = send_outs.any? do |entry|
      pokemon = entry && entry[1]
      pbRutaArceusCapturedGodActive?(pokemon)
    end
    if captured_god_entering
      pbArceusPurgeCapturedField
      send_outs.each do |entry|
        pokemon = entry && entry[1]
        next if !pbRutaArceusCapturedGodActive?(pokemon)
        pbRutaArceusSyncCapturedPokemonMode(pokemon)
        pbRutaArceusRestorePokemonPP(pokemon)
        battler = @battlers[entry[0]] if entry && entry[0]
        battler.status = :NONE if battler && battler.status != :NONE
      end
    end
    result = _ruta_arceus_original_send_out(send_outs, startBattle)
    pbArceusPurgeCapturedField if captured_god_entering
    if captured_god_entering
      send_outs.each do |entry|
        next if !entry || !entry[0]
        pbArceusRestoreCapturedBattlePP(@battlers[entry[0]])
      end
    end
    return result
  end

  def pbArceusCapturedPlateRotation(battler, type, selected_index = nil)
    return false if !battler || !type
    type_name = GameData::Type.get(type).name rescue type.to_s
    pbDisplayPaused(_INTL("Las 17 Tablas giran alrededor de Arceus antes de que cambie de color y adopte {1}.",
                          type_name))
    pbArceusPlateRouletteAnimation(selected_index || 0)
    return true
  rescue StandardError
    return false
  end

  def pbArceusTypeShiftVisual(battler, type)
    return false if !battler || !@scene || !@scene.respond_to?(:sprites)
    sprite = @scene.sprites["pokemon_#{battler.index}"]
    return false if !sprite || !sprite.respond_to?(:tone=)
    target = RUTA_ARCEUS_TYPE_TONES[type] || [0, 0, 0, 0]
    origin = battler.instance_variable_get(:@ruta_arceus_visual_tone) || [0, 0, 0, 0]
    frames = 20
    frames.times do |frame|
      progress = (frame + 1).to_f / frames
      eased = progress * progress * (3.0 - 2.0 * progress)
      tone = 4.times.map { |index| (origin[index].to_f + (target[index].to_f - origin[index].to_f) * eased).round }
      sprite.tone = Tone.new(tone[0], tone[1], tone[2], tone[3])
      @scene.pbUpdate if @scene.respond_to?(:pbUpdate)
    end
    sprite.tone = Tone.new(target[0], target[1], target[2], target[3])
    battler.instance_variable_set(:@ruta_arceus_visual_tone, target)
    return true
  rescue StandardError
    return false
  end

  def pbArceusBestJudgmentType(user, target)
    return :NORMAL if !user || !target
    target_types = target.pbTypes(true)
    user_types = user.pbTypes(true)
    best_type = :NORMAL
    best_multiplier = -1.0
    best_tie_break = Float::INFINITY
    current_type = user_types && user_types[0]
    current_index = RUTA_ARCEUS_PHASE_TYPES.index(current_type)
    RUTA_ARCEUS_TYPE_FORMS.each_key do |type|
      next if !GameData::Type.exists?(type)
      if (type == :GROUND && target.airborne?) ||
         (type == :WATER && target.hasActiveAbility?([:DRYSKIN, :STORMDRAIN, :WATERABSORB])) ||
         (type == :FIRE && target.hasActiveAbility?(:FLASHFIRE)) ||
         (type == :GRASS && target.hasActiveAbility?(:SAPSIPPER)) ||
         (type == :ELECTRIC && target.hasActiveAbility?([:LIGHTNINGROD, :MOTORDRIVE, :VOLTABSORB]))
        next
      end
      multiplier = Effectiveness.calculate(type, target_types[0], target_types[1], target_types[2]).to_f /
                   Effectiveness::NORMAL_EFFECTIVE
      next if multiplier <= 0
      if (type == :WATER && [:Sun, :HarshSun].include?(@field.weather)) ||
         (type == :FIRE && [:Rain, :HeavyRain].include?(@field.weather)) ||
         (type == :DRAGON && @field.terrain == :Misty)
        multiplier *= 0.5
      end
      next if target.hasActiveAbility?(:WONDERGUARD) && multiplier <= 1.0
      incoming = (target_types || []).compact.inject(0.0) do |sum, defense_type|
        sum + Effectiveness.calculate_one(defense_type, type).to_f
      end
      index = RUTA_ARCEUS_PHASE_TYPES.index(type)
      # Maximize damage first; on ties, favor the type that resists the rival
      # and retain the current Plate to avoid an unnecessary visual rotation.
      tie_break = incoming - ((index && index == current_index) ? 0.01 : 0.0)
      if multiplier > best_multiplier ||
         (multiplier == best_multiplier && tie_break < best_tie_break)
        best_type = type
        best_multiplier = multiplier
        best_tie_break = tie_break
      end
    end
    return best_type
  rescue StandardError
    return :NORMAL
  end

  def pbArceusReactiveDefense(target, attack_type, attacker)
    return false if !target || !attacker || !pbArceusMoveResolution?
    return false if @lastMoveUser != attacker.index
    return false if !target.respond_to?(:ruta_arceus_captured_god_active?) ||
                    !target.ruta_arceus_captured_god_active?
    return false if !attack_type || !GameData::Type.exists?(attack_type)
    return false if target.effects[PBEffects::Transform]
    current_types = target.pbTypes(true)
    current_type = current_types && current_types[0]
    current_index = target.instance_variable_get(:@ruta_arceus_plate_index)
    current_index = RUTA_ARCEUS_PHASE_TYPES.index(current_type) if current_index.nil?
    choices = []
    RUTA_ARCEUS_PHASE_TYPES.each_with_index do |type, index|
      multiplier = Effectiveness.calculate(attack_type, type, nil, nil).to_f /
                   Effectiveness::NORMAL_EFFECTIVE
      attacker_types = attacker.pbTypes(true)
      offense = Effectiveness.calculate(type, attacker_types[0], attacker_types[1], attacker_types[2]).to_f /
                Effectiveness::NORMAL_EFFECTIVE
      choices.push([multiplier, offense, index, type])
    end
    resistant = choices.select { |choice| choice[0] < 1.0 }
    pool = resistant.empty? ? choices : resistant
    selected = pool.sort_by do |choice|
      [choice[0], -choice[1], choice[2] == current_index ? 0 : 1, choice[2]]
    end[0]
    return false if !selected
    type = selected[3]
    index = selected[2]
    if current_type == type
      target.instance_variable_set(:@ruta_arceus_plate_index, index)
      return false
    end
    move_name = GameData::Move.get(@lastMoveUsed).name rescue attack_type.to_s
    pbDisplayPaused(_INTL("Arceus lee {1}: busca una inmunidad o resistencia; si no existe, elige la menor debilidad.", move_name))
    form = RUTA_ARCEUS_TYPE_FORMS[type]
    if form && target.form != form
      target.pbChangeForm(form, _INTL("Arceus cambia a tipo {1} para soportar el ataque de {2}.",
                                     GameData::Type.get(type).name, attacker.pbThis))
    end
    target.pbChangeTypes([type])
    target.instance_variable_set(:@ruta_arceus_plate_index, index)
    return true
  rescue StandardError
    return false
  end

  def arceus_battler
    return @battlers.find { |b| b && b.opposes? && b.pokemon && b.pokemon.species == :ARCEUS }
  end

  def arceus_divine?
    b = arceus_battler
    return false if !b
    # Los Arceus auxiliares de las escenas CPU son invulnerables por guion, pero
    # no heredan fases, barras ni captura del encuentro jugable de la cima.
    return false if b.pokemon.instance_variable_get(:@ruta_arceus_cinematic_boss) == true
    return true if @arceus_divine == true
    @arceus_divine = b.pokemon.instance_variable_get(:@ruta_arceus_divine) == true
    return @arceus_divine
  end

  def arceus_cinematic?
    return @ruta_arceus_cinematic_mode == true
  end

  def arceus_cinematic_adaptive?
    return arceus_cinematic? && @ruta_arceus_adaptive_cinematic_boss == true
  end

  def arceus_cinematic_source?
    return false if !arceus_cinematic?
    source = @battlers[@lastMoveUser] if @lastMoveUser && @lastMoveUser >= 0
    return source && source.pokemon && source.pokemon.species == :ARCEUS
  end

  # En los combates previos a Ash el Creador es intocable: ningún golpe, clima o
  # efecto mueve sus PS. El aura dorada absorbe el ataque y, si el intento
  # habría sido letal, se juega la burla del dios en lugar de una derrota.
  def arceus_cinematic_damage(battler, amount)
    return amount if !battler || amount.to_i <= 0
    if battler.pokemon && battler.pokemon.species == :ARCEUS
      @ruta_arceus_cinematic_pending_hp = battler.hp.to_i
      @ruta_arceus_cinematic_pending_damage = amount.to_i
      return :ruta_arceus_cinematic_absorb
    end
    return battler.hp if arceus_cinematic_source?
    return amount
  end

  # Narración del escudo cinemático: los PS de Arceus nunca cambian. Se avisa
  # una vez por turno y, ante un intento letal, se reutiliza la burla del
  # Creador (pbArceusCinematicRebirth) sin mostrar una barra vacía.
  def pbArceusCinematicAbsorb(battler, amount = 0)
    return false if !battler || !battler.pokemon || battler.pokemon.species != :ARCEUS
    if battler.hp < battler.totalhp
      old_hp = battler.hp
      battler.ruta_arceus_scripted_hp_write { battler.hp = battler.totalhp }
      pbArceusAnimateHP(battler, old_hp) if respond_to?(:pbArceusAnimateHP)
    end
    lethal = amount.to_i >= battler.hp.to_i
    key = [@turnCount.to_i, @lastMoveUser]
    if lethal || @ruta_arceus_cinematic_absorb_key != key
      @ruta_arceus_cinematic_absorb_key = key
      if lethal
        pbArceusCinematicRebirth(battler)
      else
        pbDisplay(_INTL("El aura dorada de Arceus absorbe el golpe: sus PS permanecen intactos."))
      end
    end
    return true
  rescue StandardError
    return false
  end

  # El Creador de las cinemáticas se burla de sus rivales sin perder vida: la
  # "resurrección" ya no vacía la barra, sólo confirma que su luz sigue intacta
  # y devuelve una línea distinta en cada intento.
  def pbArceusCinematicRebirth(battler)
    return if !battler
    @ruta_arceus_cinematic_rebirths = @ruta_arceus_cinematic_rebirths.to_i + 1
    begin
      if battler.hp < battler.totalhp
        old_hp = battler.hp
        battler.ruta_arceus_scripted_hp_write { battler.hp = battler.totalhp }
        pbArceusAnimateHP(battler, old_hp) if respond_to?(:pbArceusAnimateHP)
      end
      pbDisplayPaused(_INTL("La luz del Creador sigue intacta: ningún golpe ha logrado lastimarlo."))
      pbArceusCinematicImpact(Tone.new(180, 180, 255, 0)) if defined?(pbArceusCinematicImpact)
    rescue StandardError
    end
    taunts = [
      "¿De verdad creyeron que podían arrebatarme la vida?",
      "Eso apenas fue un destello. Vuelvan a intentarlo, mortales.",
      "Cada caída sólo me recuerda quién escribió las reglas.",
    ]
    pbDisplayPaused(_INTL("Arceus se burla: «{1}»",
                          taunts[(@ruta_arceus_cinematic_rebirths - 1) % taunts.length]))
    @ruta_arceus_cinematic_pending_hp = nil
    @ruta_arceus_cinematic_pending_damage = nil
  rescue StandardError
    battler.ruta_arceus_scripted_hp_write { battler.hp = battler.totalhp } if battler && battler.respond_to?(:ruta_arceus_scripted_hp_write)
  end

  def pbArceusAttackCatalog
    return @ruta_arceus_attack_catalog if @ruta_arceus_attack_catalog
    attacks = []
    GameData::Move.each do |move_data|
      power = move_data.base_damage.to_i
      function = move_data.function_code.to_s
      power = 100 if power <= 0 && function =~ /OneHit|OHKO|FixedDamage|Counter|LevelDamage|UserLevelDamage|HalfTargetHP/
      next if power <= 0
      attacks.push([move_data, power])
    end
    @ruta_arceus_attack_catalog = attacks
    return @ruta_arceus_attack_catalog
  rescue StandardError
    @ruta_arceus_attack_catalog = []
    return @ruta_arceus_attack_catalog
  end

  def pbArceusAttackScore(move_data, power, battler, targets)
    return 0.0 if !move_data || !move_data.type || targets.empty?
    attack_type = move_data.type
    # Judgment follows Arceus's currently selected Plate, not its database type.
    if move_data.id == :JUDGMENT
      plate_index = RUTA_ARCEUS_PHASE_PLATES.index(battler.item)
      attack_type = RUTA_ARCEUS_PHASE_TYPES[plate_index] if plate_index
    end
    accuracy = move_data.respond_to?(:accuracy) ? move_data.accuracy.to_i : 100
    accuracy = 100 if accuracy <= 0
    accuracy = [accuracy, 100].min
    best_score = 0.0
    targets.each do |target|
      types = target.pbTypes(true)
      effectiveness = Effectiveness.calculate(attack_type, types[0], types[1], types[2])
      multiplier = effectiveness.to_f / Effectiveness::NORMAL_EFFECTIVE
      next if multiplier <= 0
      score = power.to_f * multiplier * (accuracy.to_f / 100.0)
      score *= 1.5 if battler.pbHasType?(attack_type)
      score += move_data.priority.to_i * 8 if move_data.respond_to?(:priority)
      best_score = score if score > best_score
    end
    phase_index = [[(@arceus_phase || 1) - 1, 0].max, RUTA_ARCEUS_MOVE_SETS.length - 1].min
    best_score += 12 if (RUTA_ARCEUS_MOVE_SETS[phase_index] || []).include?(move_data.id)
    return best_score
  rescue StandardError
    return 0.0
  end

  # Recalcula el repertorio desde el catálogo real y busca cuatro ataques de
  # tipos distintos; Judgment siempre conserva un lugar y sigue a la Tabla.
  def pbArceusBestAttackIds(battler)
    targets = @battlers.select do |target|
      target && !target.fainted? && target.opposes? != battler.opposes?
    end
    scored = pbArceusAttackCatalog.map do |move_data, power|
      score = pbArceusAttackScore(move_data, power, battler, targets)
      [score, move_data.id.to_s, move_data.id, move_data.type]
    end
    scored.select! { |row| row[0] > 0 }
    scored.sort_by! { |row| [-row[0], row[1]] }
    phase_index = [[(@arceus_phase || 1) - 1, 0].max, RUTA_ARCEUS_MOVE_SETS.length - 1].min
    ids = []
    signature = :JUDGMENT
    ids.push(signature) if GameData::Move.exists?(signature)
    used_types = []
    scored.each do |row|
      next if ids.include?(row[2]) || used_types.include?(row[3])
      ids.push(row[2])
      used_types.push(row[3])
      break if ids.length >= Pokemon::MAX_MOVES
    end
    scored.each do |row|
      next if ids.include?(row[2])
      ids.push(row[2])
      break if ids.length >= Pokemon::MAX_MOVES
    end
    ids = RUTA_ARCEUS_MOVE_SETS[phase_index] if ids.empty?
    return pbArceusMoveIds(ids, phase_index + 1)
  rescue StandardError
    phase_index = [[(@arceus_phase || 1) - 1, 0].max, RUTA_ARCEUS_MOVE_SETS.length - 1].min
    return pbArceusMoveIds(RUTA_ARCEUS_MOVE_SETS[phase_index], phase_index + 1)
  end

  # The engine's high-skill trainer scorer evaluates real damage, accuracy,
  # immunities, effects and targets for each attack Arceus has prepared.
  def pbArceusScoreMove(battler, move_index)
    move = battler.moves[move_index]
    return nil if !move || !move.damagingMove?
    choices = []
    if @battleAI && @battleAI.respond_to?(:pbRegisterMoveTrainer)
      skill = PBTrainerAI.highSkill
      @battleAI.pbRegisterMoveTrainer(battler, move_index, choices, skill)
    end
    if choices.empty?
      move_data = GameData::Move.get(move.id) rescue nil
      targets = @battlers.select do |target|
        target && !target.fainted? && target.opposes? != battler.opposes?
      end
      best_score = 0.0
      best_target = -1
      targets.each do |target|
        score = pbArceusAttackScore(move_data, move_data ? move_data.base_damage.to_i : 0,
                                   battler, [target])
        if score > best_score
          best_score = score
          best_target = target.index
        end
      end
      return [move_index, best_score, best_target, move.id]
    end
    choices.sort! { |a, b| b[1] <=> a[1] }
    row = choices[0]
    return [move_index, row[1].to_f, row[2], move.id]
  rescue StandardError
    return [move_index, 0.0, -1, move ? move.id : nil]
  end

  def pbArceusChooseSmartMove(options)
    return nil if !options || options.empty?
    history = @ruta_arceus_move_history || []
    last_move = history[-1]
    fresh = options.reject { |option| option[3] == last_move }
    options = fresh if !fresh.empty?
    recent = history.last(3)
    fresh = options.reject { |option| recent.include?(option[3]) }
    options = fresh if !fresh.empty?
    options.sort! do |a, b|
      if a[1].to_f == b[1].to_f
        a[3].to_s <=> b[3].to_s
      else
        b[1].to_f <=> a[1].to_f
      end
    end
    return options[0]
  end

  def pbArceusRememberMove(move_id)
    @ruta_arceus_move_history ||= []
    @ruta_arceus_move_history.push(move_id)
    @ruta_arceus_move_history.shift while @ruta_arceus_move_history.length > 4
  end

  def pbArceusBattleCommentary(battler, move, target)
    return if !move
    phase = [[(@arceus_phase || 1).to_i, 1].max, RUTA_ARCEUS_STAGE_COUNT].min
    line = nil
    if target && target.totalhp > 0 && target.hp * 3 <= target.totalhp
      line = _INTL("Tu equipo ya siente el peso de este combate. {1} decidirá cuánto resiste.", move.name)
    elsif target && move.type
      types = target.pbTypes(true)
      effect = Effectiveness.calculate(move.type, types[0], types[1], types[2])
      if effect.to_f / Effectiveness::NORMAL_EFFECTIVE >= 2.0
        line = _INTL("Ya encontré la grieta en la defensa de {1}. No hay azar en {2}.", target.name, move.name)
      end
    end
    if !line && target && target.lastMoveUsed
      last_name = GameData::Move.get(target.lastMoveUsed).name rescue target.lastMoveUsed.to_s
      line = _INTL("He analizado {1}. Mi respuesta ya estaba calculada.", last_name)
    end
    if !line
      # R12: el comentario de turno sale del mazo (sin repeticiones hasta
      # agotarlo); los textos antiguos quedan como respaldo.
      base = ruta_arceus_dialogo(:turno)
      if base
        line = _INTL(base, move.name) rescue nil
      end
      if !line
        speeches = {
          1 => ["Ya observé tus decisiones. Ahora responderé antes que tú.", "Tu primer plan ya forma parte de mis cálculos."],
          2 => ["He medido cada resistencia; no existe una defensa que no pueda leer.", "Tu estrategia cambia. Mi juicio se adelanta."],
          3 => ["Cada golpe me enseña cómo vencerte con el siguiente.", "No confundas mi silencio con incertidumbre."],
          4 => ["Ya conozco la forma de tu compañero y también sus límites.", "Tu vínculo no puede ocultarme la próxima decisión."],
          5 => ["Cada estrategia que inventas ya existe en mi memoria.", "Tu siguiente movimiento ya dejó de ser un secreto."],
          6 => ["No queda azar. Sólo el último paso que te permito dar.", "He calculado el final; aún te concedo un turno."],
        }
        lines = speeches[phase]
        line = lines[(@turnCount.to_i + phase) % lines.length]
        line = _INTL("{1} Ahora observa cómo respondo con {2}.", line, move.name)
      end
    end
    pbDisplayPaused(_INTL("Arceus: «{1}»", line))
  rescue StandardError
    pbDisplay(_INTL("Arceus: «Tu siguiente movimiento ya está calculado.»")) rescue nil
  end

  def pbArceusSmartAction(idxBattler, battler)
    boss = arceus_battler || battler
    arceus_state(boss)
    if arceus_cinematic_adaptive?
      pbArceusCinematicHeal(boss)
    else
      pbArceusRedlineHeal(boss, true)
    end
    pbArceusAdaptTypeToRival(boss)
    phase_index = [[(@arceus_phase || 1) - 1, 0].max, RUTA_ARCEUS_MOVE_SETS.length - 1].min
    repertoire = pbArceusBestAttackIds(battler)
    pbArceusSetMoves(battler, repertoire)
    options = []
    battler.moves.each_with_index do |move, index|
      next if !move || !move.damagingMove?
      next if !pbCanChooseMove?(idxBattler, index, false)
      option = pbArceusScoreMove(battler, index)
      options.push(option) if option && option[1].to_f > 0
    end
    selected = pbArceusChooseSmartMove(options)
    if !selected
      pbDisplayPaused(_INTL("Arceus: «Si mis ataques se han agotado, aún puedo convertir la presión en fuerza.»"))
      pbAutoChooseMove(idxBattler, false)
      return true
    end
    move_index = selected[0]
    return false if !pbRegisterMove(idxBattler, move_index, false)
    pbRegisterTarget(idxBattler, selected[2]) if selected[2] && selected[2] >= 0
    move = battler.moves[move_index]
    target = @battlers[selected[2]] if selected[2] && selected[2] >= 0
    target ||= @battlers.find { |candidate| candidate && !candidate.fainted? && candidate.opposes? != battler.opposes? }
    pbArceusRememberMove(move.id)
    pbArceusBattleCommentary(battler, move, target)
    return true
  rescue StandardError
    pbAutoChooseMove(idxBattler, false) rescue nil
    return true
  end

  def pbArceusScriptedAction(idxBattler, mainEncounter = false)
    battler = @battlers[idxBattler]
    return false if !battler || battler.fainted?
    if battler.pokemon && battler.pokemon.species == :ARCEUS &&
       (mainEncounter || arceus_cinematic_adaptive?)
      return pbArceusSmartAction(idxBattler, battler)
    end
    preferred = []
    if battler.pokemon && battler.pokemon.species == :ARCEUS
      battler.moves.each do |move|
        preferred.push(move.id) if move && move.damagingMove?
      end
      preferred = preferred.rotate(@turnCount.to_i % preferred.length) if preferred.length > 1
    else
      battler.moves.each do |move|
        preferred.push(move.id) if move && move.damagingMove?
      end
    end
    indexes = []
    preferred.each do |move_id|
      index = battler.moves.index { |move| move && move.id == move_id }
      indexes.push(index) if index && !indexes.include?(index)
    end
    battler.moves.each_with_index do |move, index|
      indexes.push(index) if move && !indexes.include?(index)
    end
    chosen = nil
    indexes.each do |index|
      move = battler.moves[index]
      next if !move || !move.damagingMove?
      next if !pbCanChooseMove?(idxBattler, index, false)
      chosen = index
      break
    end
    if chosen.nil?
      pbAutoChooseMove(idxBattler, false)
      return true
    end
    return false if !pbRegisterMove(idxBattler, chosen, false)
    move = battler.moves[chosen]
    target_data = move.pbTarget(battler)
    if target_data.num_targets > 0
      target = nil
      @battlers.each_with_index do |candidate, index|
        next if !candidate || candidate.fainted?
        next if !pbMoveCanTarget?(idxBattler, index, target_data)
        target = candidate
        break
      end
      pbRegisterTarget(idxBattler, target.index) if target
    end
    if battler.pokemon && battler.pokemon.species == :ARCEUS
      target ||= @battlers.find { |candidate| candidate && !candidate.fainted? && candidate.opposes? != battler.opposes? }
      pbArceusBattleCommentary(battler, move, target)
    end
    return true
  end

  alias _ruta_arceus_original_pb_random pbRandom unless method_defined?(:_ruta_arceus_original_pb_random)
  def pbRandom(limit)
    limit = limit.to_i
    return 0 if limit <= 1 && (arceus_cinematic? || arceus_divine?)
    return _ruta_arceus_original_pb_random(limit) if limit <= 0
    if arceus_cinematic? || arceus_divine?
      seed = arceus_cinematic? ? RUTA_ARCEUS_CINEMATIC_RNG_SEED : RUTA_ARCEUS_MAIN_RNG_SEED
      @ruta_arceus_rng_state ||= seed
      @ruta_arceus_rng_state = (@ruta_arceus_rng_state * 1103515245 + 12345) % 2147483647
      return @ruta_arceus_rng_state % limit
    end
    return _ruta_arceus_original_pb_random(limit)
  end

  def arceus_state(battler)
    return if !battler || !battler.pokemon
    pkmn = battler.pokemon
    @arceus_phase = pkmn.instance_variable_get(:@ruta_arceus_phase) || 1
    @arceus_restores_used = pkmn.instance_variable_get(:@ruta_arceus_restores) || 0
    @arceus_capture_ready = pkmn.instance_variable_get(:@ruta_arceus_capture_ready) == true
    @arceus_bars_depleted = pkmn.instance_variable_get(:@ruta_arceus_bars_depleted).to_i
    @arceus_redline_healed_phase = pkmn.instance_variable_get(:@ruta_arceus_redline_healed_phase).to_i
    @arceus_phase = 1 if @arceus_phase < 1
    @arceus_phase = RUTA_ARCEUS_STAGE_COUNT if @arceus_phase > RUTA_ARCEUS_STAGE_COUNT
    @arceus_bars_depleted = [[@arceus_bars_depleted, 0].max, RUTA_ARCEUS_STAGE_COUNT].min
  end

  def save_arceus_state(battler)
    return if !battler || !battler.pokemon
    pkmn = battler.pokemon
    pkmn.instance_variable_set(:@ruta_arceus_phase, @arceus_phase)
    pkmn.instance_variable_set(:@ruta_arceus_restores, @arceus_restores_used)
    pkmn.instance_variable_set(:@ruta_arceus_capture_ready, @arceus_capture_ready == true)
    pkmn.instance_variable_set(:@ruta_arceus_bars_depleted, @arceus_bars_depleted.to_i)
    pkmn.instance_variable_set(:@ruta_arceus_redline_healed_phase, @arceus_redline_healed_phase.to_i)
  end

  def arceus_capture_ready?
    return false if !arceus_divine?
    b = arceus_battler
    return false if !b
    arceus_state(b)
    return @arceus_capture_ready == true
  end

  def arceus_player_action?(battler)
    return false if @endOfRound || !@lastMoveUser || @lastMoveUser < 0
    source = @battlers[@lastMoveUser]
    return false if !source || !source.pokemon || source.index == battler.index
    return !source.opposes?
  end

  def arceus_action_key
    return [@turnCount.to_i, @lastMoveUser, @lastMoveUsed]
  end

  def arceus_before_damage(battler, amount)
    return amount if !arceus_divine? || !battler || !battler.pokemon || battler.pokemon.species != :ARCEUS
    arceus_state(battler)
    return :ruta_arceus_no_damage if @endOfRound || amount.to_i <= 0
    # El daño indirecto y el retroceso no pueden terminar una fase. Sólo un
    # ataque del lado de Ash vacía una barra; cualquier daño propio queda en 1 PS.
    if !arceus_player_action?(battler)
      return :ruta_arceus_hold_at_one if battler.hp <= 1
      return [amount.to_i, battler.hp - 1].min
    end
    if @arceus_capture_ready
      return :ruta_arceus_hold_at_one if battler.hp <= 1
      return [amount.to_i, battler.hp - 1].min
    end
    # Una acción de varios impactos puede agotar como máximo una barra, pero
    # los impactos posteriores sí dañan la nueva barra sin poder saltar etapa.
    if @ruta_arceus_last_bar_action_key == arceus_action_key
      return :ruta_arceus_hold_at_one if battler.hp <= 1
      return [amount.to_i, battler.hp - 1].min
    end
    return :ruta_arceus_stage_break if amount.to_i >= battler.hp
    return amount.to_i
  end

  # CanonArceus wraps this hook to apply its six phase-specific rule effects.
  # A phase is advanced only after a complete HP bar was emptied.
  def check_arceus_phase(battler)
    return if !arceus_divine? || !battler || !battler.pokemon || battler.pokemon.species != :ARCEUS
    target_phase = [@arceus_bars_depleted.to_i + 1, RUTA_ARCEUS_STAGE_COUNT].min
    if @arceus_phase < target_phase
      @arceus_phase = target_phase
      pbArceusPhase(battler, @arceus_phase)
    end
    save_arceus_state(battler)
  rescue StandardError
  end

  #---------------------------------------------------------------------------
  # R8 · Duelo final jugable
  #---------------------------------------------------------------------------
  # Ash no pelea con guion: elige sus comandos en el bucle normal del motor
  # (pbCommandPhaseLoop sólo guioniza el lado de Arceus). Aquí se garantizan las
  # tres reglas del duelo: el lado de Ash abre cada ronda, sus golpes mueven las
  # barras de verdad y Arceus jamás derriba a un Pokémon suyo de un solo golpe.

  def ruta_arceus_ash_side?(battler)
    return false if !battler
    return true if battler.respond_to?(:pbOwnedByPlayer?) && battler.pbOwnedByPlayer?
    boss = arceus_battler
    return false if !boss || boss.index == battler.index
    return false if !battler.respond_to?(:opposes?)
    return battler.opposes?(boss.index)
  rescue StandardError
    false
  end

  # La iniciativa es de Ash: su lado abre cada ronda del duelo divino, incluso
  # con el Espacio Raro de la Etapa 4 activo. Protect, Quick Claw y los cambios
  # de prioridad siguen resolviéndose dentro de cada lado.
  def ruta_arceus_ash_first_active?
    return false if !arceus_divine?
    return false if @arceus_capture_ready == true
    boss = arceus_battler
    return false if !boss || boss.fainted?
    return true
  rescue StandardError
    false
  end

  alias _ruta_arceus_original_calculate_priority pbCalculatePriority unless method_defined?(:_ruta_arceus_original_calculate_priority)
  def pbCalculatePriority(fullCalc = false, indexArray = nil)
    # R12: el turno divino (música por fase, apertura, merced, juegos e
    # invocaciones) corre aquí, aislado: si algo fallara, la iniciativa de
    # Ash y el resto de la ronda siguen intactos.
    begin
      ruta_arceus_turno_divino
    rescue StandardError
    end
    result = _ruta_arceus_original_calculate_priority(fullCalc, indexArray)
    return result if !ruta_arceus_ash_first_active?
    return result if !@priority || !@priority.respond_to?(:sort!)
    @priority.sort! do |a, b|
      next 0 if !a || !b || !a[0] || !b[0]
      ash_a = ruta_arceus_ash_side?(a[0])
      ash_b = ruta_arceus_ash_side?(b[0])
      if ash_a != ash_b
        ash_a ? -1 : 1
      elsif a[3] != b[3]
        b[3] <=> a[3]
      elsif a[2] != b[2]
        b[2] <=> a[2]
      elsif @priorityTrickRoom
        (a[1] == b[1]) ? b[4] <=> a[4] : a[1] <=> b[1]
      else
        (a[1] == b[1]) ? b[4] <=> a[4] : b[1] <=> a[1]
      end
    end
    return result
  rescue StandardError
    result
  end

  # Ninguna acción de Arceus quita más de un tercio de la vida máxima de un
  # Pokémon de Ash (R9). El cálculo usa el daño acumulado del movimiento
  # (totalHPLost) para que los ataques de varios impactos tampoco cierren la
  # acción con un KO: un Pokémon sano aguanta cuatro acciones enemigas y sólo
  # puede caer cuando entra al turno ya por debajo del tope, así el duelo se
  # gana peleando y administrando el equipo, no aguantando un solo turno.
  # R10 — Fase 6: la última barra la pelea MEGA ARCEUS, EL DE LOS MIL BRAZOS.
  # La transformación no cambia el equilibrio de R9 (el tope por acción sigue
  # siendo un tercio de la vida máxima): cambia el espectáculo y el pool, que
  # pasa a multigolpes para que cada acción enemiga sean muchos brazos.
  def ruta_arceus_mega?
    return false if !arceus_divine? || @arceus_capture_ready
    @arceus_phase.to_i >= RUTA_ARCEUS_STAGE_COUNT
  end

  def ruta_arceus_mega_aparicion(battler = nil)
    return if !arceus_divine? || @ruta_arceus_mega_visto
    @ruta_arceus_mega_visto = true
    pbDisplayPaused(_INTL("¡La quinta barra se quiebra por dentro! El canon cruje: MEGA EVOLUCIÓN."))
    pbDisplayPaused(_INTL("MEGA ARCEUS, EL DE LOS MIL BRAZOS, DESCIENDE SOBRE LA CIMA."))
    pbDisplayPaused(_INTL("Arceus: «¿Contarlos? Imposible. Cada brazo es una regla que rompí para llegar hasta ti.»"))
    pbDisplayPaused(_INTL("¡Mil brazos se despliegan! La última barra será un duelo contra una multitud."))
    begin
      pbFlash(Color.new(255, 255, 255, 255), 25)
      pbShake(12, 12, 15)
      pbToneChangeAll(Tone.new(120, 60, 160, 0), 4)
      pbToneChangeAll(Tone.new(0, 0, 0, 0), 6)
    rescue StandardError
    end
    begin
      if battler && respond_to?(:pbAnimation) && defined?(GameData::Move) &&
         GameData::Move.exists?(:THOUSANDARROWS)
        pbAnimation(GameData::Move.get(:THOUSANDARROWS).id, battler, [])
      end
    rescue StandardError
    end
    save_arceus_state(battler) if battler && respond_to?(:save_arceus_state)
  rescue StandardError
  end

  # R11 — La Forma Primigenia: lo que había antes de que hubiera algo.
  def ruta_arceus_primigenia?
    return false if !arceus_divine? || @arceus_capture_ready
    @ruta_arceus_primigenia_visto == true
  end

  def ruta_arceus_primigenia_aparicion(battler = nil)
    return if !arceus_divine? || @ruta_arceus_primigenia_visto
    return if @arceus_phase.to_i < RUTA_ARCEUS_STAGE_COUNT
    @ruta_arceus_primigenia_visto = true
    pbDisplayPaused(_INTL("Los mil brazos se desploman como nieve negra. Detrás no queda un dios armado: queda lo que había ANTES de que hubiera algo."))
    pbDisplayPaused(_INTL("ARCEUS PRIMIGENIO, LA FORMA PRIMIGENIA, SE PONE EN PIE SOBRE LA CIMA."))
    pbDisplayPaused(_INTL("Arceus: «¿Mil brazos? Eran adornos. Yo no necesito manos para cerrar lo que abrí.»"))
    pbDisplayPaused(_INTL("Suelta su Tabla: el Juicio vuelve a su tipo original y sólo los espectros podrán negarlo."))
    begin
      pbFlash(Color.new(255, 255, 255, 255), 30)
      pbShake(14, 12, 18)
      pbToneChangeAll(Tone.new(-40, -40, -40, 60), 5)
      pbToneChangeAll(Tone.new(0, 0, 0, 0), 8)
    rescue StandardError
    end
    begin
      battler.item = nil if battler && battler.respond_to?(:item=)
    rescue StandardError
    end
    begin
      pbArceusSetMoves(battler, RUTA_ARCEUS_PRIMIGENIA_MOVES) if battler && respond_to?(:pbArceusSetMoves)
    rescue StandardError
    end
    ruta_arceus_musica_fase(@arceus_phase.to_i)
    save_arceus_state(battler) if battler && respond_to?(:save_arceus_state)
  rescue StandardError
  end

  # R12 — El daño divino VARÍA por acción: nunca es el mismo porcentaje dos
  # veces seguidas, pero jamás supera el tercio de R9. El ratio sale de una
  # mezcla determinista de la clave de acción (turno, usuario, movimiento,
  # fase, mega, primigenia): impredecible para el jugador, reproducible para
  # la QA. Fases tardías pegan más fuerte; la Forma Mega añade peso; el bono
  # de los juegos divinos lo reduce a la mitad.
  def ruta_arceus_divine_ratio
    base = "#{@turnCount}|#{@lastMoveUser}|#{@lastMoveUsed}|#{@arceus_phase}|" \
           "#{ruta_arceus_mega? ? 1 : 0}|#{ruta_arceus_primigenia? ? 1 : 0}"
    h = base.bytes.inject(0) { |acc, b| (acc * 31 + b) % 100003 }
    lo = RUTA_ARCEUS_HIT_CAP_MIN
    lo = RUTA_ARCEUS_HIT_CAP_MIN_TARDIO if @arceus_phase.to_i >= 4
    lo += RUTA_ARCEUS_HIT_CAP_MEGA_EXTRA if ruta_arceus_mega?
    hi = RUTA_ARCEUS_HIT_CAP_RATIO
    lo = hi - 0.05 if lo > hi - 0.05
    ratio = lo + ((hi - lo) * (h % 1000)) / 1000.0
    [[ratio, lo].max, hi].min
  rescue StandardError
    RUTA_ARCEUS_HIT_CAP_RATIO
  end

  # R12 — Mazos de diálogo: cada categoría se baraja una vez y se saca sin
  # reposición; sólo al agotarse vuelve a barajarse. Ninguna línea se repite
  # hasta que salieron todas las demás.
  def ruta_arceus_dialogo(categoria)
    pool = RUTA_ARCEUS_DIALOGOS[categoria]
    return nil if !pool || pool.empty?
    llave = "@ruta_dialogo_mazo_#{categoria}".to_sym
    mazo = instance_variable_get(llave)
    mazo = nil if !mazo.is_a?(Array)
    if !mazo || mazo.empty?
      orden = (0...pool.length).to_a
      begin
        largo = orden.length
        (largo - 1).downto(1) do |i|
          j = pbRandom(i + 1).to_i % (i + 1)
          orden[i], orden[j] = orden[j], orden[i]
        end
      rescue StandardError
      end
      mazo = orden
    end
    indice = mazo.shift
    instance_variable_set(llave, mazo)
    pool[indice]
  rescue StandardError
    nil
  end

  def ruta_arceus_decir(categoria, *args)
    linea = ruta_arceus_dialogo(categoria)
    return if !linea
    begin
      texto = args.empty? ? _INTL(linea) : _INTL(linea, *args)
      pbDisplayPaused(_INTL("Arceus: «{1}»", texto))
    rescue StandardError
    end
  end

  # R12 — Música por fase: cada etapa del duelo suena distinto, con pistas
  # que existen en Audio/BGM del juego. Idempotente por fase (no relanza la
  # misma pista dos veces) y con escudo: si algo falla, la música sigue.
  def ruta_arceus_musica_fase(fase = nil)
    return if !arceus_divine?
    pista = ruta_arceus_primigenia? ? RUTA_ARCEUS_BGM_PRIMIGENIA : RUTA_ARCEUS_BGM_POR_FASE[(fase || @arceus_phase).to_i]
    return if !pista || @ruta_arceus_bgm_actual == pista
    @ruta_arceus_bgm_actual = pista
    pbBGMPlay(pista)
  rescue StandardError
  end

  # R12 — Cinemática EN ACCIÓN: los sprites de batalla se mueven de verdad
  # (el de Ash es alzado por el dios), no sólo texto. Todo con escudo de
  # escena: sin escena (QA, batallas sin gráficos) simplemente no se ve.
  def ruta_arceus_sprite_y(battler, dy_total, frames)
    return if !battler || !@scene || !@scene.respond_to?(:sprites)
    sprite = @scene.sprites["pokemon_#{battler.index}"]
    return if !sprite
    @ruta_sprite_y_base ||= {}
    base = @ruta_sprite_y_base[battler.index] ||= sprite.y.to_i
    pasos = [frames.to_i, 1].max
    (1..pasos).each do |i|
      sprite.y = base - ((dy_total.to_i * i) / pasos)
      @scene.pbUpdate
    end
  rescue StandardError
  end

  def ruta_arceus_senalar_sprite(battler)
    return if !battler || !@scene || !@scene.respond_to?(:sprites)
    ruta_arceus_sprite_y(battler, 20, 6)
    ruta_arceus_sprite_y(battler, 0, 6)
  rescue StandardError
  end

  def ruta_arceus_cinematica_apertura(boss)
    return if !boss
    objetivo = @battlers.find { |b| b && !b.fainted? && ruta_arceus_ash_side?(b) }
    pbDisplayPaused(_INTL("Arceus desciende hasta quedar cara a cara con Ash. No hace falta leerlo: lo ves moverse."))
    begin
      pbArceusScaleSprite(boss, 1.0, 1.18, 10)
      ruta_arceus_sprite_y(objetivo, 46, 14) if objetivo
      pbFlash(Color.new(255, 255, 255, 160), 10)
      pbShake(6, 8, 12)
      pbDisplayPaused(_INTL("Arceus: «Podría matarte ahora mismo, a ti y a tus Pokémon...»"))
      ruta_arceus_senalar_sprite(objetivo) if objetivo
      pbDisplayPaused(_INTL("Arceus: «...pero veamos de qué son capaces.»"))
      ruta_arceus_sprite_y(objetivo, 0, 12) if objetivo
      pbArceusScaleSprite(boss, 1.18, 1.0, 8)
    rescue StandardError
    end
  rescue StandardError
  end

  # R12 — Orquestador por turno: cuelga del alias de pbCalculatePriority, que
  # corre cada ronda del duelo divino. Cada subsistema tiene su propio escudo:
  # si uno falla, la batalla sigue con los demás.
  def ruta_arceus_turno_divino
    return if !arceus_divine? || @arceus_capture_ready
    boss = arceus_battler
    return if !boss || boss.fainted?
    ruta_arceus_musica_fase(@arceus_phase.to_i)
    if @turnCount.to_i <= 1 && @ruta_apertura_hecha != true
      @ruta_apertura_hecha = true
      ruta_arceus_cinematica_apertura(boss)
    end
    ruta_arceus_ofrenda(boss)
    ruta_arceus_jugar(boss)
    ruta_arceus_invocar(boss)
    if @turnCount.to_i > 1 && (@turnCount.to_i % 3).zero? && @ruta_molestar_turno != @turnCount.to_i
      @ruta_molestar_turno = @turnCount.to_i
      objetivo = @battlers.find { |b| b && !b.fainted? && ruta_arceus_ash_side?(b) }
      if objetivo
        ruta_arceus_senalar_sprite(objetivo)
        nombre = objetivo.respond_to?(:name) ? objetivo.name : "tu Pokémon"
        ruta_arceus_decir(:molestar, nombre)
      end
    end
  rescue StandardError
  end

  # R12 — Juegos divinos DENTRO de la batalla: nunca la vuelven imposible
  # (el premio ayuda o es neutro, el fallo no castiga más que el juego normal)
  # y nunca se repiten dos turnos seguidos (enfriamiento de 3 turnos).
  def ruta_arceus_jugar(boss)
    return if !boss || boss.fainted? || @arceus_phase.to_i < 2
    return if @ruta_juego_turno == @turnCount
    return if @turnCount.to_i < 2
    vivos = @battlers.select { |b| b && !b.fainted? && ruta_arceus_ash_side?(b) }
    return if vivos.empty?
    ultimo = @ruta_juego_ultimo_turno.to_i
    return if ultimo > 0 && @turnCount.to_i - ultimo < 3
    @ruta_juego_turno = @turnCount
    semilla = begin; pbRandom(100).to_i; rescue StandardError; 50; end
    if semilla < 45
      @ruta_juego_ultimo_turno = @turnCount.to_i
      ruta_arceus_juicio_ciego(boss, vivos.first)
    elsif semilla < 70
      @ruta_juego_ultimo_turno = @turnCount.to_i
      ruta_arceus_ruleta(boss, vivos.first)
    end
  rescue StandardError
  end

  def ruta_arceus_juicio_ciego(boss, objetivo)
    return if !objetivo || !respond_to?(:pbShowCommands)
    ruta_arceus_decir(:juego)
    nombre = objetivo.respond_to?(:name) ? objetivo.name : "tu Pokémon"
    pbDisplayPaused(_INTL("Arceus alza una esfera de juicio sobre {1}. «Elige dónde esconderte. Si me adivinas, mis próximos dos golpes pesan la mitad.»", nombre))
    eleccion = -1
    begin
      eleccion = pbShowCommands(nil, RUTA_ARCEUS_JUEGO_REFUGIOS, false)
    rescue StandardError
      eleccion = -1
    end
    if !eleccion || eleccion.to_i < 0
      pbDisplayPaused(_INTL("Arceus cierra la esfera. «Otra vez será.»"))
      return
    end
    juicio = begin; pbRandom(RUTA_ARCEUS_JUEGO_REFUGIOS.length).to_i; rescue StandardError; 0; end
    if juicio == eleccion.to_i
      @ruta_juego_bono_acciones = 2
      pbDisplayPaused(_INTL("¡El juicio pasa de largo! Los próximos dos golpes de Arceus pesan la mitad."))
    else
      pbDisplayPaused(_INTL("«El juicio te encontraba igual.» Arceus casi parece divertirse."))
    end
  rescue StandardError
  end

  def ruta_arceus_ruleta(boss, objetivo)
    return if !objetivo
    ruta_arceus_decir(:juego)
    pbDisplayPaused(_INTL("Arceus hace girar una ruleta de estrellas. Lo que salga, sale a favor de Ash: hasta los juegos del Génesis tienen misericordia."))
    giro = begin; pbRandom(5).to_i; rescue StandardError; 0; end
    case giro
    when 0
      objetivo.pbRecoverHP([(objetivo.totalhp.to_i / 4).round, 1].max)
      pbDisplayPaused(_INTL("La ruleta cae en VERDE: {1} recupera un cuarto de su vida.", objetivo.respond_to?(:name) ? objetivo.name : "tu Pokémon"))
    when 1
      objetivo.stages[:ATTACK] = [objetivo.stages[:ATTACK].to_i + 1, 6].min if objetivo.respond_to?(:stages) && objetivo.stages
      pbDisplayPaused(_INTL("La ruleta cae en ROJO: el ataque de Ash sube un nivel."))
    when 2
      objetivo.stages[:SPEED] = [objetivo.stages[:SPEED].to_i + 1, 6].min if objetivo.respond_to?(:stages) && objetivo.stages
      pbDisplayPaused(_INTL("La ruleta cae en AZUL: la velocidad de Ash sube un nivel."))
    when 3
      RutaCampoSeguro.sanitizar!(self) if Object.const_defined?(:RutaCampoSeguro)
      pbDisplayPaused(_INTL("La ruleta cae en BLANCO: el campo se aquieta y todo efecto extraño se borra."))
    else
      pbDisplayPaused(_INTL("La ruleta cae en DORADO: Arceus sólo sonríe. También eso es un regalo."))
    end
    begin
      pbAnimation(:SING, boss, [])
    rescue StandardError
    end
  rescue StandardError
  end

  # R12 — Invocaciones del lore: si Arceus diera la orden divina de destruir
  # el mundo, sus creaciones ejecutarían el apocalipsis. Aquí las presta para
  # jugar: el Trío golpea (sin rematar jamás), Groudon/Kyogre traen su clima,
  # los lagos apagan la mente, Mew/Celebi interceden por Ash y Rayquaza/Zygarde
  # someten el campo. Con enfriamiento y sin repetir leyenda consecutiva.
  def ruta_arceus_invocar(boss)
    return if !boss || boss.fainted? || @arceus_phase.to_i < 2
    return if @turnCount.to_i < 3
    return if @ruta_invocacion_turno == @turnCount
    ultimo = @ruta_invocacion_ultimo_turno.to_i
    return if ultimo > 0 && @turnCount.to_i - ultimo < 4
    semilla = begin; pbRandom(100).to_i; rescue StandardError; 100; end
    return if semilla >= 30
    @ruta_invocacion_turno = @turnCount
    @ruta_invocacion_ultimo_turno = @turnCount.to_i
    lista = RUTA_ARCEUS_INVOCACIONES.reject { |fila| fila[0] == @ruta_invocacion_ultima }
    lista = RUTA_ARCEUS_INVOCACIONES if lista.empty?
    fila = begin; lista[pbRandom(lista.length).to_i]; rescue StandardError; lista.first; end
    return if !fila
    @ruta_invocacion_ultima = fila[0]
    nombre, movimiento, clase, linea = fila
    ruta_arceus_decir(:invocacion)
    pbDisplayPaused(_INTL("Arceus inclina la cabeza hacia el cielo roto. ¡{1} responde a la Orden Divina!", nombre.to_s))
    objetivo = @battlers.find { |b| b && !b.fainted? && ruta_arceus_ash_side?(b) }
    id_mov = begin
      GameData::Move.exists?(movimiento) ? movimiento : :JUDGMENT
    rescue StandardError
      :JUDGMENT
    end
    begin
      pbAnimation(id_mov, boss, objetivo ? [objetivo] : [])
    rescue StandardError
    end
    case clase
    when :clima
      begin
        pbStartWeather(boss, nombre == :KYOGRE ? :Rain : :Sun, false, true, 5)
      rescue StandardError
      end
      pbDisplayPaused(_INTL(linea))
    when :orden
      begin
        RutaCampoSeguro.sanitizar!(self) if Object.const_defined?(:RutaCampoSeguro)
        pbStartWeather(boss, :None, false, true, 5)
      rescue StandardError
      end
      pbDisplayPaused(_INTL(linea))
    when :mente
      if objetivo && objetivo.respond_to?(:stages) && objetivo.stages
        stat = [:ATTACK, :DEFENSE, :SPECIAL_ATTACK, :SPECIAL_DEFENSE, :SPEED][begin; pbRandom(5).to_i; rescue StandardError; 0; end]
        objetivo.stages[stat] = [objetivo.stages[stat].to_i - 1, -6].max
        pbDisplayPaused(_INTL(linea))
        pbDisplayPaused(_INTL("¡El {1} de {2} baja un nivel!", stat.to_s.downcase.tr("_", " "), objetivo.respond_to?(:name) ? objetivo.name : "Ash"))
      else
        pbDisplayPaused(_INTL(linea))
      end
    when :merced
      if objetivo
        begin
          objetivo.pbRecoverHP([(objetivo.totalhp.to_i / 10).round, 1].max)
        rescue StandardError
        end
      end
      pbDisplayPaused(_INTL(linea))
    else
      if objetivo && objetivo.hp.to_i > 1
        danio = [(objetivo.totalhp.to_i * ruta_arceus_divine_ratio * 0.6).round, 1].max
        danio = [danio, objetivo.hp.to_i - 1].min
        objetivo.pbReduceHP(danio) if danio > 0
      end
      pbDisplayPaused(_INTL(linea))
      if objetivo && objetivo.hp.to_i <= 1
        pbDisplayPaused(_INTL("Arceus: «No lo remato. Todavía no. Eso me lo guardo.»"))
      end
    end
  rescue StandardError
  end

  # R12 — Copia del equipo: Arceus conoce cada golpe que Ash enseñó a sus
  # Pokémon (él los soñó primero) y lo demuestra peleando con ellos.
  def ruta_arceus_copiar_equipo(boss)
    return if !arceus_divine? || @arceus_capture_ready || @ruta_copia_equipo_hecha
    return if !boss
    @ruta_copia_equipo_hecha = true
    party = begin; pbParty(pbPlayer); rescue StandardError; []; end
    return if !party || party.empty?
    golpes = []
    nombres = []
    party.each do |pkmn|
      next if !pkmn
      begin
        nombres << GameData::Species.get(pkmn.species).name if GameData::Species.exists?(pkmn.species)
        (pkmn.moves || []).each do |m|
          golpes << m.id if m && GameData::Move.exists?(m.id)
        end
      rescue StandardError
      end
    end
    golpes = golpes.uniq
    return if golpes.empty?
    muestra = begin
      golpes.shuffle(random: Random.new(pbRandom(999983).to_i + 1)).first(3)
    rescue StandardError
      golpes.first(3)
    end
    pool = ([:JUDGMENT] + muestra).uniq.first(4)
    pbAnimation(:TRANSFORM, boss, []) rescue nil
    ruta_arceus_decir(:copia, nombres.first(3).join(", "))
    pbArceusSetMoves(boss, pool)
  rescue StandardError
  end

  # R12 — La merced del último Pokémon: UNA vez por batalla, si a Ash le
  # queda un solo Pokémon en pie, Arceus pregunta si quiere el equipo entero
  # curado (vida, estado y PP) para que sea parejo. El jugador decide.
  def ruta_arceus_ofrenda(boss)
    return if !arceus_divine? || @arceus_capture_ready || @ruta_ofrenda_hecha
    return if @turnCount.to_i < 3
    party = begin; pbParty(pbPlayer); rescue StandardError; []; end
    return if !party || party.empty?
    vivos = []
    party.each do |pkmn|
      begin
        vivos << pkmn if pkmn && !pkmn.fainted?
      rescue StandardError
      end
    end
    return if vivos.length != 1
    @ruta_ofrenda_hecha = true
    ultimo = vivos.first
    nombre = begin; GameData::Species.get(ultimo.species).name; rescue StandardError; ultimo.species.to_s; end
    pbDisplayPaused(_INTL("Arceus detiene el cielo entero y mira a {1}, el último en pie.", nombre))
    ruta_arceus_decir(:ofrenda)
    eleccion = -1
    begin
      eleccion = pbShowCommands(nil, RUTA_ARCEUS_OFRENDA_ELECCIONES, false) if respond_to?(:pbShowCommands)
    rescue StandardError
      eleccion = -1
    end
    if eleccion.to_i == 0
      pbDisplayPaused(_INTL("«Que sea parejo, entonces.» La luz del altar recorre uno por uno a los Pokémon de Ash."))
      begin
        pbAnimation(:HEALPULSE, boss, [])
      rescue StandardError
      end
      party.each do |pkmn|
        begin
          pkmn.heal
        rescue StandardError
        end
      end
      @battlers.each do |otro|
        next if !otro || !ruta_arceus_ash_side?(otro) || otro.fainted?
        begin
          otro.hp = otro.totalhp
        rescue StandardError
        end
      end
      pbDisplayPaused(_INTL("Todo el equipo de Ash recupera la vida, el estado y los PP. El duelo sigue: ahora sí es parejo."))
    else
      pbDisplayPaused(_INTL("Arceus sonríe por primera vez en toda la creación. «Orgullo. Bien. Terminemos esto.»"))
    end
  rescue StandardError
  end

  def ruta_arceus_apply_ohko_guard(user, target)
    return false if !arceus_divine? || !target || !target.pokemon || target.fainted?
    return false if !ruta_arceus_ash_side?(target)
    return false if target.damageState.substitute == true
    return false if !user || !user.respond_to?(:pokemon) || !user.pokemon
    return false if ruta_arceus_ash_side?(user)
    if ruta_arceus_mega? && !ruta_arceus_primigenia? && @ruta_arceus_mega_grito_key != arceus_action_key
      @ruta_arceus_mega_grito_key = arceus_action_key
      begin
        pbDisplay(_INTL(RUTA_ARCEUS_MEGA_GRITOS[@turnCount.to_i % RUTA_ARCEUS_MEGA_GRITOS.length]))
      rescue StandardError
      end
    end
    if ruta_arceus_primigenia? && @ruta_arceus_primigenia_grito_key != arceus_action_key
      @ruta_arceus_primigenia_grito_key = arceus_action_key
      begin
        pbDisplay(_INTL(RUTA_ARCEUS_PRIMIGENIA_GRITOS[@turnCount.to_i % RUTA_ARCEUS_PRIMIGENIA_GRITOS.length]))
      rescue StandardError
      end
    end
    lost = target.damageState.hpLost.to_i
    return false if lost <= 0
    total = target.totalhp.to_i
    return false if total <= 0
    # R12: el tope VARÍA por acción (12%-33%, más pesado en fases tardías y en
    # la Forma Mega); el bono del Juicio Ciego lo parte en dos. Sigue siendo
    # imposible caer de un solo golpe estando sano.
    cap = (total * ruta_arceus_divine_ratio).round
    cap = 1 if cap < 1
    if @ruta_juego_bono_acciones.to_i > 0
      if @ruta_juego_bono_key != arceus_action_key
        @ruta_juego_bono_key = arceus_action_key
        @ruta_juego_bono_acciones = @ruta_juego_bono_acciones.to_i - 1
      end
      cap = [(cap / 2.0).round, 1].max
    end
    return false if target.hp.to_i <= cap
    lost_before = [target.damageState.totalHPLost.to_i - lost, 0].max
    allowed = [cap - lost_before, 0].max
    return false if lost <= allowed
    lethal = lost >= target.hp.to_i
    target.damageState.hpLost = allowed
    target.damageState.totalHPLost = lost_before + allowed
    target.damageState.endured = true if lethal
    announce_key = arceus_action_key
    if lethal && @ruta_arceus_ohko_announced_key != announce_key
      @ruta_arceus_ohko_announced_key = announce_key
      begin
        nombre = target.respond_to?(:name) ? target.name : target.pbThis
        pbDisplay(_INTL("¡{1} se niega a caer! El vínculo que Ash forjó observando al Creador sostiene el golpe mortal.", nombre))
      rescue StandardError
      end
    end
    return true
  rescue StandardError
    false
  end

  # El daño que Ash hace a las seis barras vale por lo que aprendió mirando
  # cada batalla del prólogo: cada impacto multiplica su fuerza y nunca baja de
  # media barra, para que la victoria dependa de pelear bien y no del desgaste.
  def ruta_arceus_ash_bar_damage(battler, amount)
    return amount if !battler || amount.to_i <= 0
    return amount if !arceus_player_action?(battler)
    boosted = (amount.to_i * RUTA_ARCEUS_ASH_BAR_POWER).round
    minimum = (battler.totalhp.to_i * RUTA_ARCEUS_ASH_BAR_MIN_RATIO).ceil
    boosted = minimum if boosted < minimum
    return boosted
  rescue StandardError
    amount
  end

  def pbArceusAnimateHP(battler, old_hp)
    if @scene && @scene.respond_to?(:pbHPChanged)
      @scene.pbHPChanged(battler, old_hp, true)
    else
      battler.pbUpdate if battler.respond_to?(:pbUpdate)
    end
  rescue StandardError
    battler.pbUpdate if battler && battler.respond_to?(:pbUpdate)
  end

  # El daño de los movimientos del motor (target.hp -= hpLost) también pasa por
  # las seis barras: ningún ataque, clima o efecto externo puede saltarse una
  # etapa ni derrotar al dios. Devuelve el daño real que se aplicará.
  def pbArceusDivineBarDamage(battler, amount)
    return 0 if !arceus_divine? || !battler || amount.to_i <= 0
    # R8: el daño del lado de Ash vale por el vínculo que forjó en el prólogo y
    # nunca baja de media barra, así que cada turno del jugador avanza el duelo.
    amount = ruta_arceus_ash_bar_damage(battler, amount)
    resolved = arceus_before_damage(battler, amount)
    if resolved == :ruta_arceus_stage_break
      pbArceusDepleteBar(battler)
      return 0
    end
    return 0 if resolved == :ruta_arceus_hold_at_one || resolved == :ruta_arceus_no_damage
    applied = [resolved.to_i, amount.to_i].min
    applied = 0 if applied < 0
    return applied
  rescue StandardError
    return 0
  end

  # Agotar por completo una barra mueve exactamente una fase. La sexta barra
  # llega visualmente a cero antes de dejar a Arceus a 1 PS para la captura
  # final. Estas escrituras de PS son del guion: el setter protegido las deja
  # pasar sólo dentro de ruta_arceus_scripted_hp_write.
  def pbArceusDepleteBar(battler)
    return if !arceus_divine? || !battler || !battler.pokemon || battler.pokemon.species != :ARCEUS
    arceus_state(battler)
    return if @arceus_capture_ready || !arceus_player_action?(battler)
    @ruta_arceus_last_bar_action_key = arceus_action_key
    @arceus_bars_depleted = [@arceus_bars_depleted.to_i + 1, RUTA_ARCEUS_STAGE_COUNT].min
    old_hp = battler.hp
    battler.ruta_arceus_scripted_hp_write { battler.hp = 0 }
    pbArceusAnimateHP(battler, old_hp)
    pbArceusDistortion
    if @arceus_bars_depleted < RUTA_ARCEUS_STAGE_COUNT
      pbDisplayPaused(_INTL("Ash ha vaciado por completo la barra {1}/{2} de Arceus.",
                            @arceus_bars_depleted, RUTA_ARCEUS_STAGE_COUNT))
      pbDisplayPaused(_INTL("Arceus se alza entre la luz: «¿Pensaste que la creación cabía en una sola barra?»"))
      battler.ruta_arceus_scripted_hp_write { battler.hp = battler.totalhp }
      pbArceusAnimateHP(battler, 0)
      check_arceus_phase(battler)
      # R10: al quedar una sola barra desciende Mega Arceus, el de los Mil Brazos.
      ruta_arceus_mega_aparicion(battler) if @arceus_bars_depleted == RUTA_ARCEUS_STAGE_COUNT - 1
    else
      @arceus_phase = RUTA_ARCEUS_STAGE_COUNT
      battler.ruta_arceus_scripted_hp_write { battler.hp = 1 }
      pbArceusAnimateHP(battler, 0)
      @arceus_capture_ready = true
      pbArceusEnsureCaptureBall
      pbDisplayPaused(_INTL("¡La sexta y última barra está vacía! Arceus queda a 1 PS; sólo una captura puede cerrar el duelo."))
      pbDisplayPaused(_INTL("La probabilidad de captura es del 100 %. Las bolas anteriores no podían afectarlo."))
      begin
        pbFlash(Color.new(255, 255, 255, 255), 20)
        pbShake(10, 10, 12)
      rescue StandardError
      end
    end
    save_arceus_state(battler)
  rescue StandardError
    if battler && battler.respond_to?(:ruta_arceus_scripted_hp_write)
      battler.ruta_arceus_scripted_hp_write { battler.hp = [battler.totalhp, 1].max }
    end
    battler.pbUpdate if battler && battler.respond_to?(:pbUpdate)
  end

  # Sólo Arceus se restaura: la curación sucede al cruzar el umbral rojo y
  # vuelve a comprobarse antes de su turno, incluso si el motor marca fin de ronda.
  def pbArceusRedlineHeal(battler, force = false)
    return false if !arceus_divine? || !battler || !battler.pokemon || battler.pokemon.species != :ARCEUS
    return false if @endOfRound && !force
    return false if !force && !arceus_player_action?(battler)
    arceus_state(battler)
    return false if @arceus_capture_ready || battler.hp <= 0
    redline = [battler.totalhp / 4, 1].max
    # R11: al cruzar el umbral rojo de la última barra caen los mil brazos y
    # despierta la Forma Primigenia, incluso si el altar ya no va a curar.
    if battler.hp <= redline && @arceus_phase.to_i >= RUTA_ARCEUS_STAGE_COUNT &&
       @ruta_arceus_primigenia_visto != true
      ruta_arceus_primigenia_aparicion(battler)
    end
    return false if battler.hp > redline || @arceus_redline_healed_phase == @arceus_phase
    @arceus_redline_healed_phase = @arceus_phase
    old_hp = battler.hp
    restored = [(battler.totalhp * RUTA_ARCEUS_REDLINE_HEAL_RATIO).round, 1].max
    pbDisplayPaused(_INTL("Arceus cruza el umbral rojo. El altar le devuelve media barra, pero el avance de Ash no se borra.")) if !ruta_arceus_primigenia?
    pbDisplayPaused(_INTL("Arceus cruza el umbral rojo. La Forma Primigenia se recuerda a sí misma: media barra vuelve, y no habrá otra.")) if ruta_arceus_primigenia?
    battler.ruta_arceus_scripted_hp_write { battler.hp = [battler.hp + restored, battler.totalhp].min }
    pbArceusAnimateHP(battler, old_hp)
    pbDisplayPaused(_INTL("Arceus: «Toda herida me enseña. Aun así, Ash, este aliento no detiene tu camino.»"))
    save_arceus_state(battler)
    @ruta_arceus_last_heal_phase = @arceus_phase
    @ruta_arceus_last_heal_turn = @turnCount.to_i
    return true
  rescue StandardError
    return false
  end

  # En las batallas de Cynthia/Máximo y Red/Gold sólo el jefe se restaura:
  # recupera los PS perdidos antes de cada acción y responde con una línea propia.
  def pbArceusCinematicHeal(battler)
    return false if !arceus_cinematic_adaptive? || !battler || !battler.pokemon ||
                    battler.pokemon.species != :ARCEUS ||
                    battler.pokemon.instance_variable_get(:@ruta_arceus_cinematic_boss) != true
    return false if battler.hp <= 0 || battler.hp >= battler.totalhp
    old_hp = battler.hp
    healed = battler.totalhp - old_hp
    battler.hp = battler.totalhp
    pbArceusAnimateHP(battler, old_hp)
    speeches = [
      "Las heridas no alteran mi siguiente decisión.",
      "Ya he calculado el golpe que viene; ahora borro el anterior.",
      "No confundas el daño con una ventaja. La creación sigue intacta."
    ]
    speech = speeches[@turnCount.to_i % speeches.length]
    pbDisplayPaused(_INTL("Arceus recupera {1} PS antes de actuar. «{2}»", healed, speech))
    return true
  rescue StandardError
    return false
  end

  # Red de seguridad de la captura final: si el jugador llega sin ninguna ball, el Rotom
  # materializa una Bola del Testigo. Sin esto la fase final podía quedar sin salida.
  # Se reintenta en cada fase de comandos del jugador mientras la captura siga
  # abierta: si la Mochila está llena, el jugador puede liberar espacio usando un
  # objeto y la bola aparece en el siguiente turno.
  def pbArceusEnsureCaptureBall
    return if !$PokemonBag || !$PokemonBag.respond_to?(:pbHasItem?)
    balls = [:POKEBALL, :GREATBALL, :ULTRABALL, :MASTERBALL]
    return if balls.any? { |ball| $PokemonBag.pbHasItem?(ball) }
    return if !$PokemonBag.respond_to?(:pbStoreItem)
    if $PokemonBag.pbStoreItem(:POKEBALL, 1, false)
      pbDisplay(_INTL("El Rotom vibra y materializa una Bola del Testigo: «No vas a dejar el trabajo a medias.»"))
    elsif !@ruta_arceus_ball_warned
      @ruta_arceus_ball_warned = true
      pbDisplay(_INTL("Tu Mochila está llena: usa o guarda objetos para hacer hueco a la Bola del Testigo."))
    end
  rescue StandardError
  end

  def pbArceusDistortion
    begin
      pbShake(9, 9, 10)
      pbFlash(Color.new(180, 220, 255, 180), 12)
      pbToneChangeAll(Tone.new(80, 30, 120, 0), 3)
      pbToneChangeAll(Tone.new(0, 0, 0, 0), 5)
    rescue StandardError
    end
  end

  def pbArceusSetMoves(battler, move_ids)
    valid = pbArceusMoveIds(move_ids, @arceus_phase)
    return if valid.empty?
    old_moves = battler.pokemon.moves || []
    old_ids = old_moves.map { |move| move.id }
    return if old_ids == valid && battler.moves.length == valid.length &&
              battler.moves.all? { |move| move && move.pp.to_i > 0 }
    # Reuse each existing Pokemon::Move object when possible, so adaptive
    # selection never silently resets PP or rebuilds the same move every turn.
    updated = valid.map do |id|
      old = old_moves.find { |move| move.id == id && move.pp.to_i > 0 }
      old || Pokemon::Move.new(id)
    end
    battler.pokemon.moves = updated
    battler.moves.clear
    battler.pokemon.moves.each_with_index do |move, i|
      battler.moves[i] = PokeBattle_Move.from_pokemon_move(self, move)
    end
  rescue StandardError
  end

  def pbArceusBestPlateIndex(battler, phase)
    targets = @battlers.select do |target|
      target && !target.fainted? && target.opposes? != battler.opposes?
    end
    return (phase.to_i - 1) % RUTA_ARCEUS_PHASE_PLATES.length if targets.empty?
    best_index = (phase.to_i - 1) % RUTA_ARCEUS_PHASE_PLATES.length
    best_score = -1.0e9
    RUTA_ARCEUS_PHASE_TYPES.each_with_index do |type, index|
      offensive = []
      incoming = []
      targets.each do |target|
        types = target.pbTypes(true)
        effect = Effectiveness.calculate(type, types[0], types[1], types[2])
        offensive.push(effect.to_f / Effectiveness::NORMAL_EFFECTIVE)
        target.moves.each do |move|
          next if !move || !move.damagingMove?
          move_type = move.type
          next if !move_type
          incoming_effect = Effectiveness.calculate(move_type, type, nil, nil)
          incoming.push(incoming_effect.to_f / Effectiveness::NORMAL_EFFECTIVE)
        end
      end
      max_attack = offensive.max || 1.0
      average_attack = offensive.inject(0.0) { |sum, value| sum + value } / [offensive.length, 1].max
      average_incoming = incoming.empty? ? 1.0 : incoming.inject(0.0) { |sum, value| sum + value } / incoming.length
      score = max_attack * 100.0 + average_attack * 24.0 + (1.0 - average_incoming) * 12.0
      # Mantén variedad cuando dos Tablas ofrecen la misma ventaja.
      score += 0.01 if index == (phase.to_i - 1) % RUTA_ARCEUS_PHASE_PLATES.length
      if score > best_score
        best_score = score
        best_index = index
      end
    end
    return best_index
  rescue StandardError
    return (phase.to_i - 1) % RUTA_ARCEUS_PHASE_PLATES.length
  end

  # Ruleta visual auténtica: las 17 Tablas orbitan en pantalla y la selección
  # ventajosa se detiene arriba antes de cambiar el tipo de Arceus.
  def pbArceusPlateRouletteAnimation(selected_index)
    return if !@scene || !Graphics || !Graphics.respond_to?(:width)
    viewport = nil
    icons = []
    begin
      viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
      viewport.z = 999999
      RUTA_ARCEUS_PHASE_PLATES.each do |plate|
        next if !GameData::Item.exists?(plate)
        icon = ItemIconSprite.new(0, 0, plate, viewport)
        icon.setOffset(PictureOrigin::Center) if icon.respond_to?(:setOffset)
        icon.z = 100
        icon.zoom_x = 0.72
        icon.zoom_y = 0.72
        icon.opacity = 245
        icons.push(icon)
      end
      return if icons.empty?
      selected_index = [[selected_index.to_i, 0].max, icons.length - 1].min
      center_x = Graphics.width / 2
      center_y = (Graphics.height * 0.39).to_i
      radius_x = [Graphics.width * 0.32, 150].min
      radius_y = [Graphics.height * 0.25, 86].min
      step = 2.0 * Math::PI / icons.length
      frames = 78
      finish_angle = (2.0 * Math::PI * 4.0) - (Math::PI / 2.0) - (selected_index * step)
      frames.times do |frame|
        progress = (frame + 1).to_f / frames
        eased = 1.0 - ((1.0 - progress) ** 3)
        offset = finish_angle * eased
        icons.each_with_index do |icon, index|
          angle = offset + index * step
          icon.x = center_x + Math.cos(angle) * radius_x
          icon.y = center_y + Math.sin(angle) * radius_y
          icon.opacity = (190 + 65 * eased).to_i
        end
        @scene.respond_to?(:pbUpdate) ? @scene.pbUpdate : Graphics.update
      end
      chosen = icons[selected_index]
      14.times do |frame|
        pulse = frame.even? ? 1.18 : 0.92
        chosen.zoom_x = pulse
        chosen.zoom_y = pulse
        chosen.opacity = 255
        @scene.respond_to?(:pbUpdate) ? @scene.pbUpdate : Graphics.update
      end
      chosen.zoom_x = 1.12
      chosen.zoom_y = 1.12
    rescue StandardError
    ensure
      icons.each { |icon| icon.dispose rescue nil }
      viewport.dispose if viewport && !viewport.disposed?
    end
  end

  def pbArceusRotateType(battler, phase, selected_index = nil)
    index = selected_index.nil? ? pbArceusBestPlateIndex(battler, phase) : selected_index
    plate = RUTA_ARCEUS_PHASE_PLATES[index]
    type = RUTA_ARCEUS_PHASE_TYPES[index]
    pbDisplayPaused(_INTL("Las 17 Tablas del Génesis giran antes de que Arceus cambie de color."))
    pbArceusPlateRouletteAnimation(index)
    battler.item = plate if GameData::Item.exists?(plate)
    battler.pbChangeTypes([type])
    battler.instance_variable_set(:@ruta_arceus_plate_index, index)
    pbArceusTypeShiftVisual(battler, type)
    targets = @battlers.select { |target| target && !target.fainted? && target.opposes? != battler.opposes? }
    rival = targets.empty? ? _INTL("el combate") : targets[0].name
    plate_name = GameData::Item.exists?(plate) ? GameData::Item.get(plate).name : plate.to_s
    pbDisplayPaused(_INTL("La ruleta se detiene en {1}: Arceus adopta el tipo {2} para ganar ventaja contra {3}.",
                          plate_name, RUTA_ARCEUS_TYPE_NAMES[index], rival))
  end

  # If Ash changes the active Pokémon, recalculate the best Plate before
  # Arceus chooses its next attack. The full roulette only replays if the
  # strategic type actually changes.
  def pbArceusAdaptTypeToRival(battler)
    return false if !battler
    index = pbArceusBestPlateIndex(battler, @arceus_phase || 1)
    plate = RUTA_ARCEUS_PHASE_PLATES[index]
    type = RUTA_ARCEUS_PHASE_TYPES[index]
    active_types = battler.pbTypes(true)
    current_index = battler.instance_variable_get(:@ruta_arceus_plate_index)
    return false if current_index == index && battler.item == plate && active_types[0] == type
    pbDisplayPaused(_INTL("Arceus observa tu cambio y vuelve a calcular la respuesta más ventajosa."))
    pbArceusRotateType(battler, @arceus_phase || 1, index)
    return true
  rescue StandardError
    return false
  end

  # R8: el duelo es reñido, no una humillación. El Juicio del Vínculo (etapa 4)
  # frena a los Pokémon de Ash, pero ya no los apaga: el nivel 1 de la versión
  # anterior los dejaba sin opciones y rompía la premisa de que Ash aprendió a
  # pelear. El resto de etapas conserva su lectura canónica.
  def pbArceusRivalLevel(base_level, phase)
    case phase.to_i
    when 1 then base_level.to_i
    when 2 then [base_level.to_i - 20, 1].max
    when 3 then [base_level.to_i + 20, 200].min
    when 4 then [base_level.to_i - 20, 1].max
    when 5 then [base_level.to_i + 25, 200].min
    else [base_level.to_i + 35, 200].min
    end
  end

  def pbArceusControlLevels(battler, phase, announce = false)
    return if !battler
    phase_index = [[phase.to_i - 1, 0].max, RUTA_ARCEUS_BOSS_LEVELS.length - 1].min
    boss_level = RUTA_ARCEUS_BOSS_LEVELS[phase_index]
    battler.instance_variable_set(:@ruta_arceus_effective_level, boss_level)
    rivals = @battlers.select do |target|
      target && !target.fainted? && target.pokemon && target.opposes? != battler.opposes?
    end
    rivals.each do |target|
      base_level = target.pokemon.level.to_i
      target_level = pbArceusRivalLevel(base_level, phase)
      target.instance_variable_set(:@ruta_arceus_effective_level, target_level)
    end
    if announce && !rivals.empty?
      pbDisplayPaused(_INTL("Arceus reescribe los niveles: él queda en Nv. {1} y {2} pasa a Nv. {3}.",
                            boss_level, rivals[0].name, rivals[0].level))
    end
  rescue StandardError
  end

  def pbArceusApplyStageStats(battler, phase)
    return if !battler
    values = { :ATTACK => 0, :DEFENSE => 0, :SPECIAL_ATTACK => 0,
               :SPECIAL_DEFENSE => 0, :SPEED => 0 }
    if phase.to_i >= 2
      values[:ATTACK] = 2
      values[:SPECIAL_ATTACK] = 2
    end
    if phase.to_i >= 3
      values[:DEFENSE] = 2
      values[:SPECIAL_DEFENSE] = 2
    end
    values[:SPEED] = 2 if phase.to_i >= 4
    if phase.to_i >= 5
      values[:ATTACK] = 4
      values[:SPECIAL_ATTACK] = 4
    end
    if phase.to_i >= 6
      values.keys.each { |stat| values[stat] = 6 }
    end
    values.each { |stat, value| battler.stages[stat] = value }
  rescue StandardError
  end

  def pbArceusApplyStagePower(battler, phase)
    return if !battler
    stats = [:attack, :defense, :spatk, :spdef, :speed]
    base = battler.instance_variable_get(:@ruta_arceus_base_stats)
    if !base
      base = {}
      stats.each { |stat| base[stat] = battler.instance_variable_get(:"@#{stat}") }
      battler.instance_variable_set(:@ruta_arceus_base_stats, base)
    end
    multiplier = 1.0 + ([phase.to_i, 1].max - 1) * 0.15
    multiplier += 0.10 if phase.to_i >= 5
    stats.each do |stat|
      value = base[stat]
      battler.instance_variable_set(:"@#{stat}", (value.to_f * multiplier).round) if value
    end
  rescue StandardError
  end

  def pbArceusSummon(battler, species, label)
    return if !GameData::Species.exists?(species)
    # R2: los ecos no pueden nacer al nivel 200 (reservado al Arceus divino), pero
    # conservan la fuerza de la aparición: nivel máximo legal y un empuje divino.
    summon_level = GameData::GrowthRate.max_level
    summon_level = 150 if !summon_level || summon_level < 1
    summon = Pokemon.new(species, summon_level)
    summon.personalID = 0xA2CE0201 if summon.respond_to?(:personalID=)
    summon.ability_index = 0 if summon.respond_to?(:ability_index=)
    summon.instance_variable_set(:@shiny, false)
    summon.instance_variable_set(:@square_shiny, false)
    summon.nature = :HARDY if summon.respond_to?(:nature=)
    GameData::Stat.each_main { |stat| summon.iv[stat.id] = 31 }
    summon.ev[:HP] = 6
    summon.ev[:SPECIAL_ATTACK] = 252
    summon.ev[:SPEED] = 252
    summon.calc_stats
    temp = PokeBattle_Battler.new(self, battler.index)
    temp.pbInitialize(summon, -1)
    [:attack, :defense, :spatk, :spdef, :speed].each do |stat|
      value = temp.instance_variable_get(:"@#{stat}")
      temp.instance_variable_set(:"@#{stat}", (value.to_f * 1.25).round) if value
    end
    battler.pbTransform(temp)
    pbDisplay(_INTL("¡Arceus invoca a {1}! La aparición legendaria toma el campo durante esta fase.", label))
  rescue StandardError
    pbDisplay(_INTL("¡Una silueta de {1} atraviesa la distorsión!", label))
  end

  def pbArceusCopyActive(battler)
    target = @battlers.find { |b| b && b.pbOwnedByPlayer? && !b.fainted? }
    return if !target
    pbDisplay(_INTL("Arceus extiende una mano de luz hacia {1} y toma a tu Pokémon activo para observarlo.", target.name))
    pbDisplay(_INTL("Con mi creación {1} pretendes hacerme frente, humano?", target.name))
    original_stats = {}
    [:attack, :defense, :spatk, :spdef, :speed].each do |stat|
      original_stats[stat] = battler.instance_variable_get(:"@#{stat}")
    end
    original_stages = {}
    GameData::Stat.each_battle { |stat| original_stages[stat.id] = battler.stages[stat.id] }
    original_ability = battler.instance_variable_get(:@ability_id)
    original_focus = battler.effects[PBEffects::FocusEnergy]
    original_laser = battler.effects[PBEffects::LaserFocus]
    original_weight = battler.effects[PBEffects::WeightChange]
    battler.pbTransform(target)
    copied_ability = battler.instance_variable_get(:@ability_id)
    original_stats.each { |stat, value| battler.instance_variable_set(:"@#{stat}", value) }
    original_stages.each { |stat, value| battler.stages[stat] = value }
    battler.effects[PBEffects::FocusEnergy] = original_focus
    battler.effects[PBEffects::LaserFocus] = original_laser
    battler.effects[PBEffects::WeightChange] = original_weight
    battler.instance_variable_set(:@ability_id, original_ability)
    battler.pbOnAbilityChanged(copied_ability) if battler.respond_to?(:pbOnAbilityChanged)
  end

  def pbArceusScaleSprite(battler, from, to, frames)
    return if !@scene || !@scene.respond_to?(:sprites)
    sprite = @scene.sprites["pokemon_#{battler.index}"]
    return if !sprite
    frames.times do |i|
      ratio = (i + 1).to_f / frames
      size = from + (to - from) * ratio
      sprite.zoom_x = size
      sprite.zoom_y = size
      @scene.pbUpdate
    end
  rescue StandardError
  end

  def pbArceusOpeningRitual(battler, phase)
    return if !battler
    phase_index = [[phase.to_i - 1, 0].max, RUTA_ARCEUS_MOVE_SETS.length - 1].min
    pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[phase_index])
    pbArceusApplyStageStats(battler, phase)
    pbArceusApplyStagePower(battler, phase)
    pbArceusControlLevels(battler, phase, true)
    pbArceusRotateType(battler, phase)
  end

  def pbArceusPhase(battler, phase)
    phase = [[phase.to_i, 1].max, RUTA_ARCEUS_STAGE_COUNT].min
    pbArceusDistortion
    case phase
    when 2
      pbDisplayPaused(_INTL("ETAPA 2/6 — CORONA DEL GÉNESIS: Arceus se recompone con una barra completa."))
      pbArceusScaleSprite(battler, 0.92, 1.08, 18)
    when 3
      pbDisplayPaused(_INTL("ETAPA 3/6 — GIGANTE DEL GÉNESIS: la silueta se expande y el campo se pliega."))
      pbArceusScaleSprite(battler, 1.08, 1.22, 22)
    when 4
      pbDisplayPaused(_INTL("ETAPA 4/6 — JUICIO DEL VÍNCULO: Arceus reproduce la silueta de tu Pokémon activo."))
      pbArceusCopyActive(battler)
      pbArceusScaleSprite(battler, 1.12, 1.24, 20)
    when 5
      battler.effects[PBEffects::Transform] = false
      battler.effects[PBEffects::TransformSpecies] = 0
      pbDisplayPaused(_INTL("ETAPA 5/6 — ECO DE LA CREACIÓN: una silueta de Mew cruza el campo."))
      pbArceusSummon(battler, :MEW, "Mew")
      pbArceusScaleSprite(battler, 1.18, 1.30, 22)
    when 6
      battler.effects[PBEffects::Transform] = false
      battler.effects[PBEffects::TransformSpecies] = 0
      pbDisplayPaused(_INTL("ETAPA 6/6 — ÚLTIMO HORIZONTE: Giratina Origen envuelve a Arceus."))
      pbArceusSummon(battler, :GIRATINA, "Giratina Origen")
      pbArceusScaleSprite(battler, 1.24, 1.38, 24)
    end
    phase_index = phase - 1
    pbArceusSetMoves(battler, RUTA_ARCEUS_MOVE_SETS[phase_index])
    pbArceusApplyStageStats(battler, phase)
    pbArceusApplyStagePower(battler, phase)
    pbArceusControlLevels(battler, phase, true)
    pbArceusRotateType(battler, phase)
    # R12: cada fase estrena música, y el Juicio del Vínculo además copia el
    # equipo de Ash: sus propios golpes, devueltos por quien los soñó.
    begin
      ruta_arceus_musica_fase(phase)
      ruta_arceus_copiar_equipo(battler) if phase == 4
    rescue StandardError
    end
    pbDisplayPaused(_INTL("La barra de Arceus vuelve completa. Ahora golpea con más fuerza en la etapa {1} de {2}.",
                          phase, RUTA_ARCEUS_STAGE_COUNT))
    save_arceus_state(battler)
  end

  def pbArceusClearControlEffects(battler)
    return if !battler || !battler.respond_to?(:ruta_arceus_immune_target?) || !battler.ruta_arceus_immune_target?
    battler.status = :NONE if battler.status != :NONE
    defaults = {
      :Attract => -1, :Confusion => 0, :Curse => false, :Disable => 0,
      :DisableMove => nil, :Embargo => 0, :Encore => 0, :EncoreMove => nil,
      :Flinch => false, :GastroAcid => false, :HealBlock => 0, :LeechSeed => -1,
      :MeanLook => -1, :Nightmare => false, :PerishSong => 0,
      :PerishSongUser => -1, :Taunt => 0, :Torment => false, :Trapping => 0,
      :TrappingMove => nil, :TrappingUser => -1, :Uproar => 0, :Yawn => 0,
    }
    defaults.each do |name, value|
      next if !PBEffects.const_defined?(name)
      battler.effects[PBEffects.const_get(name)] = value
    end
    GameData::Stat.each_battle do |stat|
      current = battler.stages[stat.id]
      battler.stages[stat.id] = 0 if current && current < 0
    end
  rescue StandardError
  end

  alias _ruta_arceus_original_command_loop pbCommandPhaseLoop unless method_defined?(:_ruta_arceus_original_command_loop)
  def pbCommandPhaseLoop(isPlayer)
    if arceus_cinematic?
      @battlers.each_with_index do |battler, index|
        next if !battler || pbOwnedByPlayer?(index) != isPlayer
        next if @choices[index][0] != :None || !pbCanShowCommands?(index)
        pbArceusScriptedAction(index, false)
      end
      return
    end
    if arceus_divine?
      boss = arceus_battler
      if boss
        arceus_state(boss)
        pbArceusClearControlEffects(boss)
        pbArceusApplyStageStats(boss, @arceus_phase)
        pbArceusApplyStagePower(boss, @arceus_phase)
        pbArceusControlLevels(boss, @arceus_phase, false)
        pbArceusRedlineHeal(boss, true)
      end
    end
    if arceus_divine? && !isPlayer
      @battlers.each_with_index do |battler, index|
        next if !battler || pbOwnedByPlayer?(index)
        next if @choices[index][0] != :None || !pbCanShowCommands?(index)
        if battler.pokemon && battler.pokemon.species == :ARCEUS
          pbArceusScriptedAction(index, true)
        else
          @battleAI.pbDefaultChooseEnemyCommand(index)
        end
      end
      return
    end
    # Mientras la sexta barra esté agotada, reintenta materializar la bola:
    # si la Mochila se llenó, puede liberar espacio y volver a intentarlo.
    pbArceusEnsureCaptureBall if isPlayer && arceus_divine? && arceus_capture_ready?
    return _ruta_arceus_original_command_loop(isPlayer)
  end

  alias _ruta_arceus_original_start_send_out pbStartBattleSendOut unless method_defined?(:_ruta_arceus_original_start_send_out)
  def pbStartBattleSendOut(sendOuts)
    return _ruta_arceus_original_start_send_out(sendOuts) if !arceus_divine? || !wildBattle?
    foe = pbParty(1)[0]
    pbDisplayPaused(_INTL("El campo se oscurece; una línea de luz blanca desciende sobre el altar."))
    pbArceusDistortion
    pbDisplayPaused(_INTL("Arceus: Ash, has llegado hasta aquí con los vínculos que elegiste. Ahora demostrarán su fuerza."))
    pbDisplayPaused(_INTL("¡{1} ha descendido en su forma divina!", foe ? foe.name : "Arceus"))
    sent = (sendOuts[0] && sendOuts[0][0]) || []
    msg = ""
    case sent.length
    when 1
      msg = _INTL("¡{1}! ¡Te elijo!", @battlers[sent[0]].name)
    when 2
      msg = _INTL("¡{1} y {2}! ¡Luchemos juntos!", @battlers[sent[0]].name, @battlers[sent[1]].name)
    when 3
      msg = _INTL("¡{1}, {2} y {3}! ¡Vamos!", @battlers[sent[0]].name,
                  @battlers[sent[1]].name, @battlers[sent[2]].name)
    end
    pbDisplayBrief(msg) if msg.length > 0
    to_send_out = sent.map { |index| [index, @battlers[index].pokemon] }
    pbSendOut(to_send_out, true) if to_send_out.length > 0
    boss = arceus_battler
    if boss
      arceus_state(boss)
      pbArceusOpeningRitual(boss, @arceus_phase)
    end
  end

  alias _ruta_arceus_original_pbRun pbRun unless method_defined?(:_ruta_arceus_original_pbRun)
  def pbRun(idxBattler, duringBattle = false)
    if arceus_divine?
      pbDisplayPaused(_INTL("¡Arceus rompe visualmente el botón de escape! No puedes huir de una batalla contra el dios de los Pokémon."))
      begin
        pbShake(12, 10, 14)
        pbFlash(Color.new(255, 40, 40, 180), 12)
      rescue StandardError
      end
      return 0
    end
    return _ruta_arceus_original_pbRun(idxBattler, duringBattle)
  end
end

# 3. Coreographed support battles. Keep the normal Fire Ash battle scene, but
# drive both NPC sides with a fixed move/replacement script and a battle-local
# deterministic PRNG. Arceus cannot faint in these cutaways; each of its hits
# removes one active ally so the planned loss and dialogue are guaranteed.
def pbArceusCinematicStage(switch_id)
  [ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH, ARCEUS_ALLIES_GOLD_RED_SWITCH,
   ARCEUS_ALLIES_VOLUS_SWITCH].each { |id| $game_switches[id] = false }
  $game_switches[switch_id] = true if switch_id
  $game_map.refresh if $game_map
  2.times { Graphics.update }
end

# actor entries are [event_id, spawn_x, spawn_y, spawn_direction, walk_route].
# Move the actual Map2037 events; they are hidden while the combat scene owns
# the trainer sprites, then walk back to their exits before the next pair arrives.
def pbArceusCinematicWalkIn(switch_id, actors)
  pbArceusCinematicStage(nil)
  actors.each do |actor|
    event = $game_map.events[actor[0]] if $game_map && $game_map.events
    next if !event
    event.moveto(actor[1], actor[2])
    event.direction = actor[3]
    event.opacity = 255 if event.respond_to?(:opacity=)
  end
  pbArceusCinematicStage(switch_id)
  pbArceusCinematicImpact(Tone.new(100, 180, 255, 0))
  pbWait(8)
  moving = []
  actors.each do |actor|
    event = $game_map.events[actor[0]] if $game_map && $game_map.events
    next if !event
    route = [PBMoveRoute::ChangeSpeed, 4] + actor[4] + [PBMoveRoute::ChangeSpeed, 3]
    pbMoveRoute(event, route)
    moving.push(event)
  end
  frames = 0
  while frames < 260 && moving.any? { |event| event.move_route_forcing }
    pbWait(1)
    frames += 1
  end
  pbWait(5)
rescue StandardError
  pbArceusCinematicStage(switch_id)
end

def pbArceusCinematicWalkAway(switch_id, actors)
  moving = []
  actors.each do |actor|
    event = $game_map.events[actor[0]] if $game_map && $game_map.events
    next if !event
    route = [PBMoveRoute::ChangeSpeed, 4] + actor[1] + [PBMoveRoute::ChangeSpeed, 3]
    pbMoveRoute(event, route)
    moving.push(event)
  end
  frames = 0
  while frames < 260 && moving.any? { |event| event.move_route_forcing }
    pbWait(1)
    frames += 1
  end
  pbWait(5)
rescue StandardError
ensure
  pbArceusCinematicStage(nil)
end

def pbArceusCinematicImpact(tone = Tone.new(80, 40, 120, 0))
  begin
    pbShake(8, 9, 10)
    pbFlash(Color.new(220, 240, 255, 180), 12)
    pbToneChangeAll(tone, 3)
    pbToneChangeAll(Tone.new(0, 0, 0, 0), 5)
  rescue StandardError
  end
end

# Build a battle-ready Pokémon without borrowing Ash's party. The normal
# Pokemon, move, item, stat and animation code still owns the resulting object.
def pbArceusCinematicPokemon(species, level, moves, item = nil)
  return nil if !GameData::Species.exists?(species)
  max_level = (species == :ARCEUS) ? 200 : (GameData::GrowthRate.max_level || 150).to_i
  max_level = 150 if max_level < 1
  safe_level = [[level.to_i, 1].max, max_level].min
  normal_cap = (GameData::GrowthRate.max_level || 150).to_i
  normal_cap = 150 if normal_cap < 1
  # S2b: sólo el Arceus divino del combate puede nacer por encima del tope normal.
  # Se marca antes de subirle el nivel porque el setter de nivel rechazaría el 200.
  divine = (species == :ARCEUS && safe_level > normal_cap)
  pkmn = Pokemon.new(species, divine ? normal_cap : safe_level)
  if divine
    pkmn.instance_variable_set(:@ruta_arceus_divine, true)
    pkmn.level = safe_level
  end
  pkmn.personalID = 0xA2CE0501 if pkmn.respond_to?(:personalID=)
  pkmn.ability_index = 0 if pkmn.respond_to?(:ability_index=)
  pkmn.instance_variable_set(:@shiny, false)
  pkmn.instance_variable_set(:@square_shiny, false)
  GameData::Stat.each_main { |stat| pkmn.iv[stat.id] = 31 }
  pkmn.nature = :HARDY if pkmn.respond_to?(:nature=)
  # Keep cinematic teams within the standard 510 total EVs.
  pkmn.ev[:HP] = 6
  pkmn.ev[:SPEED] = 252
  pkmn.ev[:SPECIAL_ATTACK] = 252
  pkmn.moves = []
  moves.each do |move_id|
    pkmn.learn_move(move_id) if GameData::Move.exists?(move_id)
  end
  pkmn.item = item if item && GameData::Item.exists?(item)
  if species == :GIRATINA && item == :GRISEOUSORB && pkmn.respond_to?(:form_simple=)
    pkmn.form_simple = 1
  end
  pkmn.calc_stats
  return pkmn
end

def pbArceusCinematicBoss(moves)
  # Rock Slide es un golpe de área sin inmunidades; el PRNG local fija su 95%
  # de precisión para que el 2v1 avance en el mismo orden cada vez.
  cinematic_moves = ([:ROCKSLIDE] + moves.reject { |move| move == :ROCKSLIDE }).take(Pokemon::MAX_MOVES)
  boss = pbArceusCinematicPokemon(:ARCEUS, 200, cinematic_moves, :LEGENDPLATE)
  boss.instance_variable_set(:@ruta_arceus_cinematic_boss, true)
  boss.ev[:HP] = 6
  boss.ev[:SPECIAL_ATTACK] = 252
  boss.ev[:SPEED] = 252
  boss.calc_stats
  return boss
end

# trainer_specs is [[name, trainer_type, party], ...]. Supplying two entries
# creates the real 2v1 double battle used by Cynthia/Steven and Gold/Red.
def pbArceusCinematicCpuBattle(trainer_specs, boss_moves, battle_size)
  old_rules = $PokemonTemp.battleRules.clone
  ash_party_state = $Trainer.party.map { |pkmn| [pkmn, pkmn.hp, pkmn.status, pkmn.pokerus] if pkmn }.compact
  player_trainers = []
  player_party = []
  player_starts = []
  trainer_specs.each do |spec|
    trainer = NPCTrainer.new(spec[0], spec[1])
    trainer.party = spec[2].compact
    player_trainers.push(trainer)
    player_starts.push(player_party.length)
    trainer.party.each { |pkmn| player_party.push(pkmn) }
  end
  boss_trainer = NPCTrainer.new("Arceus", :LEGENDARYPOKEMON)
  boss_trainer.party = [pbArceusCinematicBoss(boss_moves)]
  boss_party = boss_trainer.party
  decision = 0
  begin
    raise _INTL("La batalla cinematográfica necesita Pokémon aliados.") if player_party.empty?
    $PokemonTemp.clearBattleRules
    setBattleRule(battle_size)
    setBattleRule("cannotRun")
    setBattleRule("canLose")
    setBattleRule("noExp")
    setBattleRule("noMoney")
    setBattleRule("setStyle")
    setBattleRule("anims")
    # La nieve de la cumbre (map_metadata de los pisos) no debe convertirse en
    # granizo dentro de la escena: la vida de Arceus no depende del clima.
    setBattleRule("weather", "None")

    scene = pbNewBattleScene
    battle = PokeBattle_Battle.new(scene, player_party, boss_party,
                                   player_trainers, [boss_trainer])
    battle.instance_variable_set(:@ruta_arceus_cinematic_mode, true)
    adaptive_trainer_types = [:ARC_Cynthia, :ARC_Steven, :ARC_Ethan, :SECRET_Red]
    adaptive_cinematic = trainer_specs.any? { |spec| adaptive_trainer_types.include?(spec[1]) }
    battle.instance_variable_set(:@ruta_arceus_adaptive_cinematic_boss, adaptive_cinematic)
    battle.party1starts = player_starts
    battle.party2starts = [0]
    battle.items = [boss_trainer.items]
    battle.endSpeeches = [_INTL("La luz de Arceus permanece intacta.")]
    battle.endSpeechesWin = [_INTL("Los mortales aún no comprenden el peso de la creación.")]
    battle.controlPlayer = true
    pbPrepareBattle(battle)
    # Doble seguro: aunque una regla ajena vuelva a fijar el clima heredado, el
    # campo de la escena arranca limpio antes de que empiece el combate.
    if battle.respond_to?(:field) && battle.field
      battle.field.weather = :None if battle.field.respond_to?(:weather=)
      battle.field.defaultWeather = :None if battle.field.respond_to?(:defaultWeather=)
      battle.field.weatherDuration = 0 if battle.field.respond_to?(:weatherDuration=)
    end
    # pbPrepareBattle reads the standard rules; these assignments are the final
    # guard against a menu, escape or replacement prompt in this special scene.
    battle.controlPlayer = true
    battle.canRun = false
    battle.canLose = true
    battle.expGain = false
    battle.moneyGain = false
    battle.switchStyle = false

    $PokemonTemp.clearBattleRules
    Audio.me_stop
    pbBattleAnimation(pbGetTrainerBattleBGM([boss_trainer]),
                      (battle.singleBattle?) ? 1 : 3, [boss_trainer]) {
      pbSceneStandby {
        decision = battle.pbStartBattle
      }
    }
    Input.update
  ensure
    # The support battle owns every temporary Pokémon. Restore the only global
    # side effect the stock end-of-battle routine can cause: Pokerus spreading.
    ash_party_state.each do |pkmn, hp, status, pokerus|
      pkmn.hp = hp
      pkmn.status = status
      pkmn.pokerus = pokerus
    end
    $PokemonTemp.clearBattleRules
    old_rules.each { |key, value| $PokemonTemp.battleRules[key] = value }
  end
  return decision
end

# When a support Pokémon faints, the stock engine only auto-selects a
# replacement for partners/opponents. The first NPC support is technically
# owner index 0, so redirect that one narrow replacement path to the same AI.
class PokeBattle_Battle
  alias _ruta_arceus_original_pbSwitchInBetween pbSwitchInBetween unless method_defined?(:_ruta_arceus_original_pbSwitchInBetween)
  def pbSwitchInBetween(idxBattler, checkLaxOnly = false, canCancel = false)
    if arceus_cinematic?
      party = pbParty(idxBattler)
      party.each_with_index do |pokemon, index|
        next if !pokemon || !pokemon.able?
        return index if pbCanSwitchLax?(idxBattler, index)
      end
      return -1
    end
    if @controlPlayer
      return @battleAI.pbDefaultChooseNewEnemy(idxBattler, pbParty(idxBattler))
    end
    return _ruta_arceus_original_pbSwitchInBetween(idxBattler, checkLaxOnly, canCancel)
  end
end

def pbArceusAshWill
  viewport = nil
  sprites = []
  begin
    viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    viewport.z = 9990
    $Trainer.party.each_with_index do |pkmn, index|
      next if !pkmn
      sprite = PokemonSprite.new(viewport)
      sprite.setPokemonBitmap(pkmn, false)
      sprite.x = 72 + (index % 3) * 112
      sprite.y = Graphics.height - 90 - (index / 3) * 78
      sprite.zoom_x = 0.42
      sprite.zoom_y = 0.42
      sprite.opacity = 96
      sprite.tone = Tone.new(80, 80, 130, 0)
      sprites.push(sprite)
    end
    12.times { Graphics.update }
    pbMessage(_INTL("Ash da un paso al frente. A su espalda, las siluetas transparentes de todos sus Pokémon se alzan como una sola voluntad."))
  rescue StandardError
    pbMessage(_INTL("Ash da un paso al frente. Detrás de él, la voluntad de sus Pokémon se reúne contra el vacío."))
  ensure
    sprites.each { |sprite| sprite.dispose rescue nil }
    viewport.dispose if viewport
  end
end

def pbArceusCinematicPrelude
  # Cynthia and Steven walk from the southern aisle to the altar before their
  # real CPU-vs-CPU double battle against the god.
  pbArceusCinematicWalkIn(ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH, [
    [4, 19, 16, 2, Array.new(5, PBMoveRoute::Up) + Array.new(2, PBMoveRoute::Right) + [PBMoveRoute::TurnRight]],
    [5, 27, 16, 2, Array.new(5, PBMoveRoute::Up) + Array.new(2, PBMoveRoute::Left) + [PBMoveRoute::TurnLeft]],
  ])
  pbMessage(_INTL("Una grieta se abre detrás de Ash. Cynthia y Máximo llegan al altar; sus retratos aparecen juntos antes de desafiar al Creador."))
  pbMessage(_INTL("\\bCynthia: Mis seis Pokémon están listos. Steven: los míos también. Ninguno de nosotros tocará un comando; dejaremos que el combate hable."))
  cynthia = [
    pbArceusCinematicPokemon(:SPIRITOMB, 145, [:SHADOWBALL, :DARKPULSE, :WILLOWISP, :PAINSPLIT], :LEFTOVERS),
    pbArceusCinematicPokemon(:TOGEKISS, 145, [:AIRSLASH, :DAZZLINGGLEAM, :ROOST, :THUNDERWAVE], :LEFTOVERS),
    pbArceusCinematicPokemon(:MILOTIC, 145, [:SCALD, :ICEBEAM, :RECOVER, :HYPERVOICE], :LEFTOVERS),
    pbArceusCinematicPokemon(:LUCARIO, 145, [:AURASPHERE, :FLASHCANNON, :VACUUMWAVE, :NASTYPLOT], :LUCARIONITE),
    pbArceusCinematicPokemon(:ROSERADE, 145, [:ENERGYBALL, :SLUDGEBOMB, :SLEEPPOWDER, :SYNTHESIS], :BLACKSLUDGE),
    pbArceusCinematicPokemon(:GARCHOMP, 145, [:EARTHQUAKE, :DRAGONCLAW, :STONEEDGE, :SWORDSDANCE], :LIFEORB),
  ]
  steven = [
    pbArceusCinematicPokemon(:SKARMORY, 145, [:BRAVEBIRD, :STEELWING, :ROOST, :STEALTHROCK], :LEFTOVERS),
    pbArceusCinematicPokemon(:METAGROSS, 145, [:METEORMASH, :ZENHEADBUTT, :BULLETPUNCH, :HAMMERARM], :METAGROSSITE),
    pbArceusCinematicPokemon(:AGGRON, 145, [:HEAVYSLAM, :ROCKSLIDE, :EARTHQUAKE, :PROTECT], :AGGRONITE),
    pbArceusCinematicPokemon(:ARMALDO, 145, [:XSCISSOR, :ROCKBLAST, :AQUAJET, :SWORDSDANCE], :LEFTOVERS),
    pbArceusCinematicPokemon(:CLAYDOL, 145, [:PSYCHIC, :EARTHPOWER, :RAPIDSPIN, :LIGHTSCREEN], :LIGHTCLAY),
    pbArceusCinematicPokemon(:CRADILY, 145, [:GIGADRAIN, :POWERGEM, :TOXIC, :RECOVER], :LEFTOVERS),
  ]
  pbArceusCinematicCpuBattle([
    ["Cynthia", :ARC_Cynthia, cynthia],
    ["Steven", :ARC_Steven, steven],
  ], [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE], "2v1")
  pbArceusCinematicWalkAway(ARCEUS_ALLIES_CINTHIA_STEVEN_SWITCH, [
    [4, Array.new(2, PBMoveRoute::Left) + Array.new(5, PBMoveRoute::Down)],
    [5, Array.new(2, PBMoveRoute::Right) + Array.new(5, PBMoveRoute::Down)],
  ])
  pbMessage(_INTL("Derrotados, Cynthia y Máximo se alejan del altar. Arceus recupera su vida completa y se burla de los campeones."))
  pbArceusCinematicImpact(Tone.new(40, 80, 160, 0))
  pbMessage(_INTL("Arceus no se inmuta ante los ataques: un único movimiento de área quiebra la formación de ambos campeones."))
  pbMessage(_INTL("La secuencia está coreografiada: el combate conserva la escena y las animaciones normales, pero el desenlace nunca depende de la IA."))

  # Red and Gold walk onto the same marks after the first champions retreat.
  pbArceusCinematicWalkIn(ARCEUS_ALLIES_GOLD_RED_SWITCH, [
    [6, 18, 22, 2, Array.new(11, PBMoveRoute::Up) + Array.new(3, PBMoveRoute::Right) + [PBMoveRoute::TurnRight]],
    [7, 28, 22, 2, Array.new(11, PBMoveRoute::Up) + Array.new(3, PBMoveRoute::Left) + [PBMoveRoute::TurnLeft]],
  ])
  pbMessage(_INTL("Red y Gold caminan hasta el altar y ocupan el lugar de Cynthia y Máximo. Sus retratos aparecen primero y, sin esperar, sus equipos entran al combate."))
  gold = [
    pbArceusCinematicPokemon(:TYPHLOSION, 150, [:FLAMETHROWER, :ERUPTION, :FOCUSBLAST, :SOLARBEAM], :CHOICESPECS),
    pbArceusCinematicPokemon(:AMPHAROS, 150, [:THUNDERBOLT, :VOLTSWITCH, :SIGNALBEAM, :THUNDERWAVE], :AMPHAROSITE),
    pbArceusCinematicPokemon(:HERACROSS, 150, [:MEGAHORN, :CLOSECOMBAT, :ROCKBLAST, :SWORDSDANCE], :HERACRONITE),
    pbArceusCinematicPokemon(:SUDOWOODO, 150, [:STONEEDGE, :WOODHAMMER, :SUCKERPUNCH, :EARTHQUAKE], :LEFTOVERS),
    pbArceusCinematicPokemon(:TOGEKISS, 150, [:AIRSLASH, :DAZZLINGGLEAM, :ROOST, :THUNDERWAVE], :LEFTOVERS),
    pbArceusCinematicPokemon(:LUGIA, 150, [:AEROBLAST, :PSYCHIC, :ROOST, :ICEBEAM], :LEFTOVERS),
  ]
  red = [
    pbArceusCinematicPokemon(:PIKACHU, 150, [:THUNDERBOLT, :VOLTTACKLE, :IRONTAIL, :QUICKATTACK], :LIGHTBALL),
    pbArceusCinematicPokemon(:CHARIZARD, 150, [:FLAMETHROWER, :AIRSLASH, :DRAGONPULSE, :ROOST], :CHARIZARDITEX),
    pbArceusCinematicPokemon(:BLASTOISE, 150, [:HYDROPUMP, :AURASPHERE, :ICEBEAM, :RAPIDSPIN], :BLASTOISINITE),
    pbArceusCinematicPokemon(:VENUSAUR, 150, [:GIGADRAIN, :SLUDGEBOMB, :SLEEPPOWDER, :SYNTHESIS], :VENUSAURITE),
    pbArceusCinematicPokemon(:SNORLAX, 150, [:BODYSLAM, :CRUNCH, :REST, :CURSE], :LEFTOVERS),
    pbArceusCinematicPokemon(:MEWTWO, 150, [:PSYSTRIKE, :AURASPHERE, :ICEBEAM, :CALMMIND], :MEWTWONITEX),
  ]
  pbArceusCinematicCpuBattle([
    ["Gold/Eco", :ARC_Ethan, gold],
    ["Red", :SECRET_Red, red],
  ], [:JUDGMENT, :ROAROFTIME, :SPACIALREND, :SHADOWFORCE], "2v1")
  pbArceusCinematicWalkAway(ARCEUS_ALLIES_GOLD_RED_SWITCH, [
    [6, Array.new(3, PBMoveRoute::Left) + Array.new(11, PBMoveRoute::Down)],
    [7, Array.new(3, PBMoveRoute::Right) + Array.new(11, PBMoveRoute::Down)],
  ])
  pbMessage(_INTL("Red y Gold se alejan derrotados; Arceus vuelve a sanar por completo y se burla de ellos."))
  pbArceusCinematicImpact(Tone.new(160, 30, 30, 0))
  pbMessage(_INTL("Gold y Red reúnen sus doce Pokémon. Arceus rompe el doble frente sin darles tiempo a reorganizarse."))
  pbMessage(_INTL("La escena fija el orden de las bajas; la selección de movimientos, los impactos y los cambios ya no dependen del azar."))

  # Volus and Giratina get a real single battle, but Arceus ends it immediately.
  pbArceusCinematicStage(ARCEUS_ALLIES_VOLUS_SWITCH)
  pbArceusCinematicImpact(Tone.new(90, 20, 140, 0))
  pbMessage(_INTL("Una última figura cruza la luz rota: Volus. Giratina Origen entra al campo para desafiar al creador."))
  giratina = [pbArceusCinematicPokemon(:GIRATINA, 150,
                                        [:SHADOWFORCE, :DRACOMETEOR, :EARTHPOWER, :AURASPHERE],
                                        :GRISEOUSORB)]
  pbArceusCinematicCpuBattle([
    ["Volus", :SECRET_Volo, giratina],
  ], [:JUDGMENT, :SHADOWFORCE, :ROAROFTIME, :SPACIALREND], "single")
  pbArceusCinematicImpact(Tone.new(120, 10, 180, 0))
  pbMessage(_INTL("Giratina es derrotado antes de poder prolongar la batalla. Volus cae de rodillas: ni siquiera su obsesión puede entrar en la guerra de Ash."))
  pbMessage(_INTL("\\bArceus: Tú no eres un aliado, Volus. Eres otro mortal intentando apropiarse de Mi creación."))

  pbArceusCinematicStage(nil)
  pbArceusAshWill
  pbMessage(_INTL("\\bAsh: Ya fue suficiente. Ahora llegó el momento de luchar personalmente contra Arceus."))
  pbArceusCinematicImpact(Tone.new(255, 255, 255, 0))
end

# 4. Capture gate. This is before the normal Master Ball/unconditional-capture
# check, so even a Master Ball is exactly 0% until the final weakening is over.
module PokeBattle_BattleCommon
  alias _ruta_arceus_original_capture_calc pbCaptureCalc unless method_defined?(:_ruta_arceus_original_capture_calc)
  def pbCaptureCalc(pkmn, battler, catch_rate, ball)
    if battler && battler.pokemon && battler.pokemon.species == :ARCEUS &&
       respond_to?(:arceus_divine?) && arceus_divine?
      if arceus_capture_ready?
        # La captura se inserta tras el rollback, sobre el equipo previo al
        # combate. Si ni el equipo ni las cajas tienen hueco, la bola no se
        # tira en falso: se avisa una vez y el jugador puede rendirse,
        # liberar espacio y volver. Nunca se genera un commit imposible.
        if ArceusSaveSandbox.capture_room?
          return 4
        elsif !@ruta_arceus_room_warned
          @ruta_arceus_room_warned = true
          pbDisplay(_INTL("No hay espacio en tu equipo ni en las cajas: libera un Pokémon antes de capturar a Arceus."))
        end
      end
      return 0
    end
    return _ruta_arceus_original_capture_calc(pkmn, battler, catch_rate, ball)
  end
end

# 4. Pseudo-PC continuation. Defeated teams are moved without healing, then the
# player chooses up to six able Pokémon from storage. Choosing surrender exits
# through the engine's normal start-over path.
def pbArceusStorageCandidates
  ret = []
  return ret if !$PokemonStorage
  for box in 0...$PokemonStorage.maxBoxes
    for index in 0...$PokemonStorage.maxPokemon(box)
      pkmn = $PokemonStorage[box, index]
      ret.push([box, index, pkmn]) if pkmn && pkmn.able? && !(pkmn.respond_to?(:egg?) && pkmn.egg?)
    end
  end
  return ret
end

def pbArceusReplacePartyFromStorage(selected)
  return false if !$PokemonStorage || selected.empty?
  party = $Trainer.party.compact
  selected_keys = selected.map { |entry| [entry[0], entry[1]] }
  free = []
  for box in 0...$PokemonStorage.maxBoxes
    for index in 0...$PokemonStorage.maxPokemon(box)
      next if selected_keys.include?([box, index])
      free.push([box, index]) if !$PokemonStorage[box, index]
    end
  end
  # If fewer replacements than current party members were chosen, the excess
  # defeated Pokémon still need a place. A full PC can therefore be used when
  # six replacements are selected: their six storage slots are swapped safely.
  excess = [party.length - selected.length, 0].max
  return false if free.length < excess
  party.drop(selected.length).first(excess).each_with_index do |pkmn, i|
    $PokemonStorage[free[i][0], free[i][1]] = pkmn
  end
  selected.each_with_index do |entry, i|
    $PokemonStorage[entry[0], entry[1]] = party[i] if i < party.length
  end
  $Trainer.party.clear
  selected.each { |entry| $Trainer.party.push(entry[2]) }
  return true
end

# R4: sin candidatos en el PC el jugador quedaría sin salida. El Rotom concede una
# única restauración parcial (35%) para que el combate pueda continuar; nunca cura
# del todo ni se repite.
def pbArceusRotomMercy
  return false if $game_switches && $game_switches[RUTA_DE_DIOS_ARCEUS_MERCY_SWITCH]
  healed = 0
  $Trainer.party.each do |pkmn|
    next if !pkmn
    pkmn.hp = [(pkmn.totalhp * 0.35).to_i, 1].max if pkmn.hp <= 0
    pkmn.heal_status if pkmn.respond_to?(:heal_status)
    healed += 1
  end
  return false if healed == 0
  $game_switches[RUTA_DE_DIOS_ARCEUS_MERCY_SWITCH] = true if $game_switches
  pbMessage(_INTL("El Rotom de Ash gira sobre sí mismo: «No hay nadie en la caja... pero yo puedo sostenerlos una vez más.»"))
  pbMessage(_INTL("Una descarga cálida levanta al equipo: cada Pokémon recupera el 35% de su vigor. Sólo ocurrirá una vez."))
  return true
rescue StandardError
  return false
end

def pbArceusPseudoPC
  candidates = pbArceusStorageCandidates
  return false if candidates.empty?
  # Selection is transactional. The current team stays in the party until the
  # player confirms a replacement, so surrender can still use the normal
  # blackout/return flow without leaving the player with an empty party.
  pbMessage(_INTL("¡Debes continuar! Los seis Pokémon actuales han caído. Se abre una interfaz de pseudo-PC."))
  pbMessage(_INTL("El pseudo-PC no cura Pokémon. Elige hasta seis Pokémon que todavía puedan luchar."))
  selected = []
  6.times do
    remaining = candidates.reject { |entry| selected.include?(entry) }
    break if remaining.empty?
    commands = remaining.map { |entry| _INTL("{1} (Nv. {2})", entry[2].name, entry[2].level) }
    can_finish = selected.length >= $Trainer.party.compact.length
    commands.push(_INTL("Terminar selección / rendirse")) if can_finish
    cancel_command = can_finish ? commands.length : -1
    choice = pbMessage(_INTL("Selecciona el Pokémon {1}/6 para continuar.", selected.length + 1), commands, cancel_command)
    return false if choice < 0 || choice >= remaining.length
    selected.push(remaining[choice])
  end
  return false if selected.empty?
  return false if !pbArceusReplacePartyFromStorage(selected)
  pbMessage(_INTL("El pseudo-PC se cierra. Ningún Pokémon fue curado. ¡El combate continúa mientras quede voluntad de luchar!"))
  return true
end

def pbArceusSurrenderSequence
  pbMessage(_INTL("\\bAsh: ¡Me rindo! ¡Todos, retiraos!"))
  begin
    3.times do |i|
      pbShake(10 + i * 3, 10, 12)
      pbFlash(Color.new(255, 255, 255, 180), 10)
      pbToneChangeAll(Tone.new(-80 * (i + 1), -80 * (i + 1), -80 * (i + 1), 0), 2)
      pbMessage([_INTL("¡Los entrenadores gritan mientras el santuario se resquebraja!"),
                 _INTL("¡Las rutas celestiales se deshacen en una destrucción progresiva!"),
                 _INTL("¡La Cima del Génesis cae en el vacío!" )][i])
    end
    pbToneChangeAll(Tone.new(0, 0, 0, 0), 4)
  rescue StandardError
  end
  pbMessage(_INTL("La realidad expulsa a Ash. El viaje vuelve a la pantalla principal."))
  begin
    $PokemonTemp.clearBattleRules if $PokemonTemp
    $game_switches[RUTA_DE_DIOS_ARCEUS_RESOLVED] = true if $game_switches
  rescue StandardError
  end
  pbStartOver
end

# 5. Starter. The loop is deliberately outside the normal battle loop: it lets
# the engine finish a battle, show the pseudo-PC, and then start another battle
# with the same Arceus object and its persistent phase/HP state.
# S1: el Arceus capturado deja de ser el dios del combate. Sin esto, el ejemplar que entra
# en la partida conservaba las variables de fase/restauraciones/captura del jefe.
# R6: el duelo contra Volo llega justo después de la batalla divina. El santuario
# concede un descanso explícito para que el reto sea justo (y se repite en cada
# reintento, porque Volo espera).
def pbArceusVoloRest
  $Trainer.heal_party if $Trainer.respond_to?(:heal_party)
  pbMessage(_INTL("El altar del Génesis devuelve las fuerzas a todo el equipo antes del duelo."))
  pbMessage(_INTL("\\bVolo: Tómate tu tiempo, Ash. Quiero vencerte en tu mejor momento."))
rescue StandardError
end

def pbArceusNormalizeCaptured(pkmn)
  return if !pkmn
  # Instancia persistente distinta del jefe: activa el modo únicamente cuando
  # pbRutaArceusGodWorldAllowed? confirma uno de los cuatro mundos autorizados.
  pkmn.instance_variable_set(:@ruta_arceus_divine, false)
  pkmn.instance_variable_set(:@ruta_arceus_cinematic_boss, false)
  pkmn.instance_variable_set(:@ruta_arceus_captured_god, true)
  pkmn.instance_variable_set(:@ruta_arceus_captured_god_level, 200)
  pkmn.instance_variable_set(:@ruta_arceus_captured_mode_suspended, false)
  pkmn.instance_variable_set(:@ruta_arceus_captured_saved_item, nil)
  pkmn.instance_variable_set(:@ruta_arceus_phase, 1)
  pkmn.instance_variable_set(:@ruta_arceus_restores, 0)
  pkmn.instance_variable_set(:@ruta_arceus_capture_ready, false)
  pkmn.instance_variable_set(:@ruta_arceus_bars_depleted, 0)
  pkmn.instance_variable_set(:@ruta_arceus_redline_healed_phase, 0)
  pbRutaArceusSyncCapturedPokemonMode(pkmn)
  pkmn.calc_stats
  pkmn.hp = pkmn.totalhp
  pbRutaArceusRestorePokemonPP(pkmn)
rescue StandardError
end

def pbStartArceusDivineBattle
  transaction = ArceusSaveSandbox.begin!
  canonical_capture = nil
  canonical_caught = false
  begin
  $game_switches[RUTA_ARCEUS_CAUGHT_SWITCH] = false if $game_switches
  pkmn = Pokemon.new(:ARCEUS, GameData::GrowthRate.max_level)
  pkmn.personalID = 0xA2CE0200 if pkmn.respond_to?(:personalID=)
  pkmn.ability_index = 0 if pkmn.respond_to?(:ability_index=)
  pkmn.instance_variable_set(:@shiny, false)
  pkmn.instance_variable_set(:@square_shiny, false)
  pkmn.nature = :HARDY if pkmn.respond_to?(:nature=)
  pkmn.instance_variable_set(:@ruta_arceus_divine, true)
  pkmn.level = 200
  pkmn.instance_variable_set(:@ruta_arceus_phase, 1)
  pkmn.instance_variable_set(:@ruta_arceus_restores, 0)
  pkmn.instance_variable_set(:@ruta_arceus_capture_ready, false)
  pkmn.instance_variable_set(:@ruta_arceus_bars_depleted, 0)
  pkmn.instance_variable_set(:@ruta_arceus_redline_healed_phase, 0)
  GameData::Stat.each_main { |s| pkmn.iv[s.id] = 31 }
  pkmn.item = :LEGENDPLATE if GameData::Item.exists?(:LEGENDPLATE)
  pkmn.moves = pbArceusMoveIds(RUTA_ARCEUS_MOVE_SETS[0], 1).map { |id| Pokemon::Move.new(id) }
  pkmn.calc_stats

  $PokemonGlobal.nextBattleBGM = "Legend Sinnoh"
  $PokemonGlobal.nextBattleBack = "snow"
  $PokemonTemp.clearBattleRules
  $PokemonTemp.recordBattleRule("cannotRun")
  $PokemonTemp.recordBattleRule("canLose")
  # El duelo se decide con las seis barras: la nieve del mapa (categoría granizo)
  # no entra al combate y no puede lastimar a nadie en la cima.
  $PokemonTemp.recordBattleRule("weather", "None")

  # R7: el prólogo son tres combates CPU completos. Repetirlo en cada reintento castiga
  # al jugador que ya lo vio: se muestra una vez y luego se resume en una línea.
  # R8: además, en el primer arranque se puede saltar el prólogo e ir directo al
  # duelo. Ash ya estudió esas batallas; quien quiera pelear de inmediato, puede.
  primera_vez = !($game_switches && $game_switches[RUTA_DE_DIOS_PRELUDE_SEEN_SWITCH])
  saltar_prologo = false
  if primera_vez
    eleccion = pbMessage(_INTL("El prólogo repasa las tres batallas que Ash estudió contra Arceus: Cynthia y Máximo, Gold y Red, y Volus con Giratina."),
                         [_INTL("Ver el prólogo completo"),
                          _INTL("Ir directo al duelo con Arceus")], 0)
    saltar_prologo = (eleccion == 1)
    $game_switches[RUTA_DE_DIOS_PRELUDE_SEEN_SWITCH] = true if $game_switches
  end
  if primera_vez && !saltar_prologo
    pbArceusCinematicPrelude
  else
    pbArceusCinematicImpact(Tone.new(120, 120, 200, 0))
    if saltar_prologo
      pbMessage(_INTL("Ash ya conoce cada movimiento de Arceus: los combates de Cynthia, Máximo, Gold, Red y Volus le enseñaron a leerlo. La cima no espera más."))
      pbMessage(_INTL("Sin prólogo y sin testigos: Ash sube al altar y da el primer paso hacia el Creador."))
    else
      pbMessage(_INTL("Cynthia, Steven, Gold, Red y Volus ya cayeron aquí. Nadie más puede ganar tiempo: es el turno de Ash."))
    end
  end
  active = $Trainer.party.find { |p| p && p.able? }
  pbMessage(_INTL("Arceus toma a {1}, lo observa con la calma de un dios y dice: Con mi creación {1} pretendes hacerme frente, humano?", active ? active.name : $Trainer.name))
  pbMessage(_INTL("La ruleta de las 17 Tablas comienza a girar. Esta no es una batalla normal de seis Pokémon."))

  loop do
    snapshot = $Trainer.party.map { |p| [p, p.hp, p.status] }
    # pbBattleAnimation limpia nextBattleBGM/nextBattleBack tras cada combate del
    # prólogo cinemático; se reasignan aquí para que el duelo divino conserve su
    # música y su fondo nevado en todos los intentos.
    $PokemonGlobal.nextBattleBGM = "Legend Sinnoh"
    $PokemonGlobal.nextBattleBack = "snow"
    decision = pbWildBattleCore(pkmn)
    if decision == 4
      # La captura es el único objeto complejo autorizado a cruzar la transacción.
      # Se clona antes del rollback porque el motor ya insertó esta instancia en
      # equipo/PC; después se restaura el estado inicial y se inserta una sola vez.
      canonical_capture = ArceusSaveSandbox.deep_copy(pkmn)
      canonical_caught = true
      return decision
    end
    return decision if decision == 1
    if decision == 2
      # pbWildBattleCore is run with canLose=true, which normally heals a party
      # after a loss. Restore every HP/status here: the pseudo-PC never heals.
      snapshot.each do |entry|
        p = entry[0]
        p.hp = entry[1]
        p.status = entry[2] if entry[1] > 0
      end
      if pbArceusPseudoPC
        $PokemonTemp.clearBattleRules
        $PokemonTemp.recordBattleRule("cannotRun")
        $PokemonTemp.recordBattleRule("canLose")
        $PokemonTemp.recordBattleRule("weather", "None")
        next
      elsif pbArceusRotomMercy
        $PokemonTemp.clearBattleRules
        $PokemonTemp.recordBattleRule("cannotRun")
        $PokemonTemp.recordBattleRule("canLose")
        $PokemonTemp.recordBattleRule("weather", "None")
        next
      end
      pbArceusSurrenderSequence
      return 2
    end
    if decision == 5
      # R3: un empate no debe cerrar el evento en silencio. Se restaura el estado
      # previo (el motor sí cura con canLose) y se explica que la cima sigue abierta.
      snapshot.each do |entry|
        p = entry[0]
        p.hp = entry[1] if entry[1] > 0
        p.status = entry[2] if entry[1] > 0
      end
      pbMessage(_INTL("El choque de dos voluntades agota el campo: Ash y Arceus caen a la vez, sin vencedor."))
      pbMessage(_INTL("La Cima del Génesis vuelve a cerrarse. Arceus espera de pie, intacto, para un nuevo intento."))
      $PokemonTemp.clearBattleRules
      return 5
    end
    return decision if decision == 3
  end
  ensure
    prelude_seen = ($game_switches && $game_switches[RUTA_DE_DIOS_PRELUDE_SEEN_SWITCH]) ? true : false
    ArceusSaveSandbox.finish!(transaction, canonical_capture, canonical_caught, prelude_seen)
  end
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
  sw[SW_SNOWPOINT_PASS] = S("SNOWPOINT_TEMPORARY_TREE_PASS");
  sw[SW_ARCEUS_ALLIES_CYNTHIA_STEVEN] = S("ARCEUS_CINEMATIC_CYNTHIA_STEVEN");
  sw[SW_ARCEUS_ALLIES_GOLD_RED] = S("ARCEUS_CINEMATIC_GOLD_RED");
  sw[SW_ARCEUS_ALLIES_VOLUS] = S("ARCEUS_CINEMATIC_VOLUS");
  sw[SW_ARCEUS_MERCY] = S("RUTA_DE_DIOS_ARCEUS_MERCY");
  sw[SW_PRELUDE_SEEN] = S("RUTA_DE_DIOS_PRELUDE_SEEN");
  while (sw.length <= SW_RELIC_GUIDE_4) sw.push(null);
  sw[SW_RELIC_GUIDE_1] = S("RUTA_DE_DIOS_RELIQUIA_1F");
  sw[SW_RELIC_GUIDE_2] = S("RUTA_DE_DIOS_RELIQUIA_2F");
  sw[SW_RELIC_GUIDE_3] = S("RUTA_DE_DIOS_RELIQUIA_3F");
  sw[SW_RELIC_GUIDE_4] = S("RUTA_DE_DIOS_RELIQUIA_4F");

  writeRx("System.rxdata", sys);
  console.log("OK: Switches 869..881 y 936..939 registered in System.rxdata.");
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
function paintSnowpointRoute(mapObj) {
  const table = tableFromUserDef(iv(mapObj, "data"));
  // Apertura deliberada de una avenida de nieve: conserva la ciudad y sus
  // árboles laterales, pero elimina solo lo que bloqueaba el santuario. No se
  // pinta una alfombra gris artificial; el suelo nevado original continúa por
  // debajo, como en los mapas profesionales de Puntaneva.
  for (let y = 4; y <= 7; y++) for (let x = 18; x <= 22; x++) {
    for (let z = 1; z <= 2; z++) tableSet(table, x, y, z, 0);
    tableSet(table, x, y, 0, 4457);
  }
  for (let y = 14; y <= 27; y++) for (let x = 18; x <= 22; x++) {
    for (let z = 1; z <= 2; z++) tableSet(table, x, y, z, 0);
    tableSet(table, x, y, 0, 4457);
  }

  mapObj.setIvar("data", tableToUserDef(table));
}

function installSnowpointGuide() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;
  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Volus — Guía Celestial"));
  if (idx !== -1) events.splice(idx, 1);

  const guide = event(103, "Volus — Guía Celestial", 20, 16, [
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

function installSnowpointTreeGuide() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;
  for (let i = events.length - 1; i >= 0; i--) {
    if (txt(iv(events[i][1], "name")) === "Squirtle — Paso Temporal") events.splice(i, 1);
  }
  const squirtle = event(104, "Squirtle — Paso Temporal", 19, 55, [
    page({
      gfx: graphic("SQUIRTLE", 2),
      list: [
        ...textCommands([
          "Squirtle: ¡Squirtle! Los árboles de Puntaneva son muy densos incluso para los viajeros más valientes.",
          "Squirtle: Puedo abrirte paso entre ellos mientras sigas dentro de esta ciudad.",
        ]),
        cmd(121, [SW_SNOWPOINT_PASS, SW_SNOWPOINT_PASS, 0]),
        ...textCommands([
          "Una corriente de agua despeja tus pasos. Ahora puedes atravesar los árboles de Ciudad Puntaneva.",
          "El permiso es temporal: desaparecerá automáticamente al salir del mapa.",
        ]),
        cmd(0),
      ],
    }),
  ]);
  events.push([104, squirtle]);
  writeRx("Map625.rxdata", map625);
}

function clearSnowpointRegigigasArea(mapObj) {
  const table = tableFromUserDef(iv(mapObj, "data"));
  // Remove the old Regigigas temple footprint, its pillars and the trees that
  // made the entrance feel sealed. The new portal plaza remains open snow.
  for (let y = 7; y <= 13; y++) for (let x = 16; x <= 24; x++) {
    tableSet(table, x, y, 0, 4457);
    tableSet(table, x, y, 1, 0);
    tableSet(table, x, y, 2, 0);
  }
  mapObj.setIvar("data", tableToUserDef(table));
}

function installSnowpointPortal() {
  const map625 = readRx("Map625.rxdata");
  const events = iv(map625, "events").pairs;

  // Brandon was the old NPC at the Regigigas entrance. Remove him with the
  // temple so the space is genuinely available for the celestial approach.
  for (let i = events.length - 1; i >= 0; i--) {
    const name = txt(iv(events[i][1], "name"));
    if (name === "Brandon" || name.includes("Regigigas")) events.splice(i, 1);
  }
  clearSnowpointRegigigasArea(map625);

  const idx = events.findIndex(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (idx !== -1) events.splice(idx, 1);

  const id = 102;
  const p1 = page({
    // Recuperación: el portal debe aparecer aunque una partida antigua no conserve
    // correctamente el switch 870. La conversación de Volus sigue siendo la ruta
    // narrativa, pero la entrada no queda bloqueada por una flag perdida.
    cond: condition(),
    gfx: graphic("ARCEUS_GATE", 2),
    trigger: 0,
    list: [
      cmd(101, [S("Una majestuosa fisura de luz celestial resuena ante las puertas del templo.")]),
      cmd(101, [S("¿Deseas ascender por 'La Ruta de Dios' hacia las alturas del cosmos?\\ch[1,2,Ascender,Permanecer en Puntaneva]")]),
      cmd(111, [12, S("$game_variables[1] == 1")]),
      cmd(101, [S("Una ráfaga de viento sagrado envuelve tu cuerpo...")]),
      transfer(2038, 26, 68, 8, 1),
      cmd(412),
      cmd(0),
    ],
  });

  paintSnowpointRoute(map625);
  events.push([id, event(id, "Portal a la Ruta de Dios", 20, 14, [p1])]);
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
  // The route is a natural snowy floor, not a pasted rectangular road. The
  // surrounding cliffs, statues and stair gates provide the navigation cues.
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) canvas.set(x + i, y + j, 0, 4457);
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

  // Sustituye franjas paralelas por terrazas quebradas, praderas orgánicas y una
  // senda visible que serpentea hasta la puerta superior.
  redesignCelestialApproach(cv);
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
  // Kept for legacy call sites. The redesigned maps use hand-authored, asymmetric
  // grove clusters instead of parallel rows.
  const west = [[1, 5], [4, 11], [2, 19], [5, 27], [1, 35]];
  const east = [[W - 4, 8], [W - 2, 17], [W - 6, 26], [W - 3, 34]];
  for (const [x, y] of [...west, ...east]) if (x >= 0 && y >= 3 && x + 1 < W && y < H) drawFrostedPineTree(cv, x, y);
}

const TRAIL_TILE_PALETTES = {
  approach: [1260, 1257], dawn: [1177, 1180], basalt: [1257, 1260],
  aura: [4409, 1260], marble: [4409, 1257], time: [1260, 1257],
  space: [4409, 1260], genesis: [4409, 1257],
};
const TRAIL_SAFE_TILES = new Set([4457, 1177, 1180, 1257, 1260, 4409]);
function resetVisualCanvas(cv) {
  for (let z = 0; z < 3; z++) cv.fillAll(z, 0);
  cv.fillAll(0, 4457);
}
function verifyTrailPalette(cv, palette) {
  const tileset = tilesets().get(cv.tilesetId);
  if (!tileset) throw new Error(`Tileset ${cv.tilesetId} ausente al diseñar la ruta.`);
  const base = 4457;
  for (const tileId of palette) {
    if (!TRAIL_SAFE_TILES.has(tileId)) throw new Error(`Tile ${tileId} no está autorizado para el sendero.`);
    if (tileset.passages.data[tileId] !== tileset.passages.data[base]
      || tileset.priorities.data[tileId] !== tileset.priorities.data[base]
      || tileset.terrain.data[tileId] !== tileset.terrain.data[base]) {
      throw new Error(`El tile ${tileId} altera pasabilidad, prioridad o terreno respecto a la nieve ${base}.`);
    }
  }
}
function rasterLine([x0, y0], [x1, y1]) {
  const cells = [];
  let x = x0, y = y0;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const twice = 2 * error;
    if (twice >= dy) { error += dy; x += sx; }
    if (twice <= dx) { error += dx; y += sy; }
  }
  return cells;
}
function drawWindingTrail(cv, waypoints, palette, { width = 1, wideAt = [] } = {}) {
  verifyTrailPalette(cv, palette);
  const centerline = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = rasterLine(waypoints[i], waypoints[i + 1]);
    centerline.push(...(i ? segment.slice(1) : segment).map(([x, y]) => ({ x, y, segment: i, step: centerline.length })));
  }
  const cells = new Map();
  for (const point of centerline) {
    const expanded = wideAt.some(([x, y]) => Math.abs(x - point.x) + Math.abs(y - point.y) <= 2);
    const radius = expanded ? width + 1 : width;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance > radius) continue;
      const x = point.x + dx, y = point.y + dy;
      if (!cv.inside(x, y) || !TRAIL_SAFE_TILES.has(cv.get(x, y, 0))) continue;
      if (cv.get(x, y, 1) || cv.get(x, y, 2)) continue;
      const key = `${x},${y}`;
      const old = cells.get(key);
      if (!old || distance < old.distance) cells.set(key, { distance, radius, step: point.step, segment: point.segment });
    }
  }
  for (const [key, cell] of cells) {
    const [x, y] = key.split(",").map(Number);
    const edge = cell.distance === cell.radius;
    cv.set(x, y, 0, edge ? palette[1] : palette[0]);
  }
  return cells.size;
}
function drawOrganicGrass(cv, x, y, rows) {
  let placed = 0;
  rows.forEach((row, dy) => [...row].forEach((cell, dx) => {
    if (cell !== "#") return;
    const px = x + dx, py = y + dy;
    if (!cv.inside(px, py) || cv.get(px, py, 1) || cv.get(px, py, 2)) return;
    if (cv.get(px, py, 0) !== 4457) return;
    // La hierba es autotile de capa 2 en el juego: el suelo nevado queda debajo
    // y las zonas transparentes no se convierten en huecos negros.
    cv.set(px, py, 1, 447);
    placed++;
  }));
  return placed;
}
function drawPineCluster(cv, roots) {
  for (const [x, y] of roots) drawFrostedPineTree(cv, x, y);
}
function drawBrokenRidges(cv, segments) {
  for (const [x, y, w, h, stairs = []] of segments) {
    drawCoronetCliff(cv, x, y, w, h, { stairs });
  }
}
function drawDaisSurface(cv, rows, x, y, tile = 4409) {
  for (let dy = 0; dy < rows.length; dy++) for (let dx = 0; dx < rows[dy].length; dx++) {
    if (rows[dy][dx] !== "#") continue;
    const px = x + dx, py = y + dy;
    if (!cv.inside(px, py)) continue;
    if (cv.get(px, py, 1) || cv.get(px, py, 2)) continue;
    cv.set(px, py, 0, tile);
  }
}

function redesignCelestialApproach(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [
    [1, 6], [4, 12], [2, 20], [5, 29], [1, 39], [4, 48], [2, 61], [7, 66],
    [47, 8], [44, 16], [49, 25], [45, 34], [48, 45], [43, 55], [49, 64],
  ]);
  drawBrokenRidges(cv, [
    [5, 56, 11, 3], [38, 55, 10, 3], [9, 39, 9, 3], [36, 38, 11, 3],
    [4, 24, 12, 3], [37, 23, 11, 3], [13, 10, 8, 3], [34, 12, 9, 3],
  ]);
  drawWhiteMarbleDais(cv, 19, 2, 14, 6, { stairs: [24] });
  drawSunburstAltar(cv, 23, 2);
  drawWhiteMarbleDais(cv, 7, 47, 9, 5, { stairs: [10] });
  drawSunburstAltar(cv, 9, 47);
  drawCosmicGateway(cv, 40, 31);
  drawColumn(cv, 38, 29); drawColumn(cv, 44, 34);
  drawGuardianStatue(cv, 10, 54); drawGuardianStatue(cv, 42, 43);
  drawCosmicPool(cv, 7, 17); drawCosmicPool(cv, 42, 17); drawCosmicPool(cv, 39, 52);
  drawMonolith(cv, 9, 31); drawMonolith(cv, 44, 24); drawMonolith(cv, 9, 64);
  drawSacredBoulder(cv, 37, 43); drawSacredBoulder(cv, 13, 29);
  drawOrganicGrass(cv, 7, 34, ["  ####", " ######", "#######", " #####", "  ###"]);
  drawOrganicGrass(cv, 39, 38, ["  ####", "######", " #####", "  ####"]);
  drawOrganicGrass(cv, 7, 58, ["#####", "######", " ####", "  ###"]);
  drawOrganicGrass(cv, 39, 59, [" ######", "#######", " #####", "  ####"]);
  drawWindingTrail(cv, [
    [26, 68], [24, 64], [28, 61], [32, 57], [30, 53], [23, 50], [20, 46],
    [25, 43], [31, 40], [34, 36], [30, 33], [25, 30], [21, 26], [17, 22],
    [17, 18], [21, 15], [25, 12], [29, 9], [26, 5],
  ], TRAIL_TILE_PALETTES.approach, { width: 1, wideAt: [[26, 68], [26, 5], [21, 26], [25, 12]] });
}

function redesignFloor1(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[2, 5], [5, 12], [2, 22], [5, 31], [34, 7], [32, 18], [36, 31]]);
  drawBrokenRidges(cv, [[4, 27, 11, 3], [28, 24, 8, 3], [7, 9, 9, 3], [28, 8, 8, 3]]);
  drawWhiteMarbleDais(cv, 16, 2, 10, 6, { stairs: [19] });
  drawSunburstAltar(cv, 18, 2);
  drawGuardianStatue(cv, 12, 19); drawGuardianStatue(cv, 29, 28); drawGuardianStatue(cv, 14, 34);
  drawColumn(cv, 25, 13); drawColumn(cv, 10, 27); drawMonolith(cv, 32, 34);
  drawSacredBoulder(cv, 6, 12); drawSacredBoulder(cv, 32, 15); drawSacredBoulder(cv, 9, 29, true);
  drawOrganicGrass(cv, 6, 14, ["  ####", "#######", "######", " #####", "  ###"]);
  drawOrganicGrass(cv, 29, 20, [" ####", "######", "#####", " ###"]);
  drawOrganicGrass(cv, 6, 30, ["#####", "######", " ####", "  ##"]);
  drawWindingTrail(cv, [[20, 36], [17, 33], [15, 29], [18, 26], [24, 24], [27, 21], [24, 18], [19, 16], [17, 12], [21, 9], [20, 5]], TRAIL_TILE_PALETTES.dawn, { width: 1, wideAt: [[20, 36], [24, 24], [20, 5]] });
}

function redesignFloor2(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[3, 7], [1, 18], [6, 31], [36, 11], [33, 33]]);
  drawBrokenRidges(cv, [[4, 26, 9, 3], [29, 24, 8, 3], [7, 11, 9, 3], [27, 8, 10, 3]]);
  drawWhiteMarbleDais(cv, 16, 2, 9, 6, { stairs: [19] });
  drawGuardianStatue(cv, 11, 16); drawGuardianStatue(cv, 31, 27); drawGuardianStatue(cv, 28, 13);
  drawMonolith(cv, 10, 29); drawMonolith(cv, 31, 10); drawColumn(cv, 28, 31);
  drawSacredBoulder(cv, 34, 18); drawSacredBoulder(cv, 8, 25, true); drawSacredBoulder(cv, 30, 19);
  drawOrganicGrass(cv, 5, 14, ["####", "######", " #####", "  ###"]);
  drawOrganicGrass(cv, 29, 17, ["  ###", "#####", "######", "####"]);
  drawOrganicGrass(cv, 13, 29, ["###", "####", "  ##"]);
  drawWindingTrail(cv, [[20, 36], [24, 33], [28, 30], [25, 27], [19, 26], [14, 23], [17, 20], [24, 18], [28, 15], [24, 12], [20, 9], [20, 5]], TRAIL_TILE_PALETTES.basalt, { width: 1, wideAt: [[20, 36], [19, 26], [20, 5]] });
}

function redesignFloor3(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[2, 9], [5, 18], [1, 30], [36, 7], [34, 31]]);
  drawBrokenRidges(cv, [[4, 30, 10, 3], [29, 27, 9, 3], [3, 14, 8, 3], [31, 11, 8, 3]]);
  drawWhiteMarbleDais(cv, 15, 2, 12, 6, { stairs: [20] });
  drawCosmicPool(cv, 8, 20); drawCosmicPool(cv, 32, 15); drawCosmicPool(cv, 34, 29);
  drawGuardianStatue(cv, 13, 20); drawGuardianStatue(cv, 30, 26); drawGuardianStatue(cv, 19, 32);
  drawColumn(cv, 27, 13); drawMonolith(cv, 8, 12); drawMonolith(cv, 34, 35);
  drawSacredBoulder(cv, 7, 10); drawSacredBoulder(cv, 33, 30, true); drawSacredBoulder(cv, 8, 34);
  drawOrganicGrass(cv, 5, 17, ["####", "######", "#####", "  ###"]);
  drawOrganicGrass(cv, 31, 24, ["  ###", "######", "#####", " ####"]);
  drawOrganicGrass(cv, 17, 32, ["####", "#####", " ###"]);
  drawWindingTrail(cv, [[21, 38], [18, 35], [15, 31], [18, 27], [24, 24], [27, 20], [23, 17], [18, 14], [20, 10], [21, 5]], TRAIL_TILE_PALETTES.aura, { width: 1, wideAt: [[21, 38], [24, 24], [21, 5]] });
}

function redesignFloor4(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[2, 8], [6, 22], [3, 34], [37, 10], [34, 27]]);
  drawBrokenRidges(cv, [[4, 30, 10, 3], [29, 27, 8, 3], [7, 13, 9, 3], [29, 8, 10, 3]]);
  drawWhiteMarbleDais(cv, 15, 2, 12, 6, { stairs: [20] });
  drawDaisSurface(cv, ["  ####", " #######", "#########", " #######", "  #####"], 17, 18, 4409);
  drawSunburstAltar(cv, 19, 2);
  drawGuardianStatue(cv, 12, 17); drawGuardianStatue(cv, 30, 22); drawGuardianStatue(cv, 15, 30);
  drawColumn(cv, 29, 34); drawColumn(cv, 11, 25); drawMonolith(cv, 33, 13);
  drawSacredBoulder(cv, 35, 12); drawSacredBoulder(cv, 8, 25, true);
  drawOrganicGrass(cv, 5, 15, ["#####", "######", " ####", "  ###"]);
  drawOrganicGrass(cv, 30, 19, ["  ###", "#####", "######", " ####"]);
  drawOrganicGrass(cv, 14, 32, ["###", "#####", " ####"]);
  drawWindingTrail(cv, [[21, 38], [24, 35], [29, 32], [27, 28], [22, 25], [17, 22], [18, 18], [24, 16], [28, 12], [23, 9], [21, 5]], TRAIL_TILE_PALETTES.marble, { width: 1, wideAt: [[21, 38], [22, 25], [21, 5]] });
}

function redesignFloor5(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[2, 8], [5, 27], [33, 31], [35, 9]]);
  drawBrokenRidges(cv, [[4, 25, 8, 3], [27, 23, 8, 3], [5, 7, 9, 3], [26, 7, 8, 3]]);
  drawDaisSurface(cv, [
    "    ######", "  ##########", " ###########", "############",
    " ###########", "  #########", "    #######", "      #####",
  ], 13, 7, 4409);
  drawCosmicPool(cv, 6, 18); drawCosmicPool(cv, 29, 23);
  drawGuardianStatue(cv, 10, 17); drawGuardianStatue(cv, 28, 12); drawGuardianStatue(cv, 26, 28);
  drawColumn(cv, 12, 12); drawMonolith(cv, 30, 10); drawMonolith(cv, 8, 30);
  drawSacredBoulder(cv, 6, 10); drawSacredBoulder(cv, 31, 24, true);
  drawOrganicGrass(cv, 5, 13, ["####", "#####", " ###"]);
  drawOrganicGrass(cv, 28, 28, ["  ###", "#####", " ####"]);
  drawWindingTrail(cv, [[19, 34], [15, 30], [13, 26], [17, 23], [23, 21], [26, 18], [23, 15], [19, 14], [17, 10], [22, 7], [19, 5]], TRAIL_TILE_PALETTES.time, { width: 1, wideAt: [[19, 34], [23, 21], [19, 5]] });
}

function redesignFloor6(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[3, 32], [1, 13], [36, 8], [34, 28]]);
  drawBrokenRidges(cv, [[4, 25, 8, 3], [27, 22, 8, 3], [6, 7, 8, 3], [25, 8, 9, 3]]);
  drawDaisSurface(cv, [
    "      ######", "   ##########", "  ###########", "############",
    " ###########", "  ##########", "    #######",
  ], 13, 8, 4409);
  drawCosmicGateway(cv, 29, 25); drawCosmicGateway(cv, 8, 10);
  drawCosmicPool(cv, 5, 16); drawCosmicPool(cv, 30, 18); drawCosmicPool(cv, 29, 8);
  drawGuardianStatue(cv, 10, 19); drawGuardianStatue(cv, 28, 13);
  drawColumn(cv, 11, 12); drawMonolith(cv, 29, 31);
  drawSacredBoulder(cv, 32, 10); drawSacredBoulder(cv, 6, 24, true);
  drawOrganicGrass(cv, 5, 13, ["####", "#####", " ###"]);
  drawOrganicGrass(cv, 29, 29, ["  ####", "######", " ####"]);
  drawWindingTrail(cv, [[19, 34], [23, 31], [28, 28], [26, 24], [22, 21], [16, 19], [13, 15], [18, 13], [24, 11], [21, 8], [19, 5]], TRAIL_TILE_PALETTES.space, { width: 1, wideAt: [[19, 34], [22, 21], [19, 5]] });
}

function redesignFloor7(cv) {
  resetVisualCanvas(cv);
  drawPineCluster(cv, [[1, 6], [4, 14], [2, 26], [6, 39], [43, 9], [39, 20], [44, 33], [40, 42]]);
  drawBrokenRidges(cv, [[6, 22, 10, 3], [34, 25, 8, 3], [8, 34, 9, 3], [31, 36, 10, 3]]);
  // Terraza de mármol erosionada: un contorno escalonado que se abre hacia el
  // sur, en vez de una plaza rectangular cerrada.
  drawDaisSurface(cv, [
    "         #######", "      ###########", "   ##############",
    " ##################", " ###################", "  #################",
    "   ###############", "     ############", "        ########",
  ], 12, 5, 4409);
  drawSunburstAltar(cv, 21, 5);
  drawCosmicGateway(cv, 11, 8); drawCosmicPool(cv, 34, 11);
  drawGuardianStatue(cv, 13, 10); drawGuardianStatue(cv, 33, 18);
  drawGuardianStatue(cv, 15, 19); drawGuardianStatue(cv, 32, 28);
  drawGuardianStatue(cv, 12, 32); drawGuardianStatue(cv, 28, 37);
  drawColumn(cv, 35, 34); drawMonolith(cv, 14, 35); drawMonolith(cv, 38, 35);
  drawSacredBoulder(cv, 8, 12); drawSacredBoulder(cv, 37, 12, true); drawSacredBoulder(cv, 12, 28);
  drawOrganicGrass(cv, 7, 24, ["  ####", "######", " #####", "  ###"]);
  drawOrganicGrass(cv, 33, 25, ["#####", "######", " ####", " ###"]);
  drawOrganicGrass(cv, 25, 34, ["###", "#####", " ####"]);
  drawWindingTrail(cv, [[23, 40], [20, 36], [16, 32], [18, 28], [24, 26], [29, 23], [27, 19], [22, 17], [19, 14], [23, 10]], TRAIL_TILE_PALETTES.genesis, { width: 1, wideAt: [[23, 40], [24, 26], [23, 10]] });
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

  // R8: el rincón sellado del piso (el altar de roca marca dónde buscar)
  redesignFloor1(cv);
  const relic = sealedRelicSpot(cv, [20, 36], 1);
  drawSacredBoulder(cv, relic.x, relic.y);

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
    cmd(111, [12, S('pbTrainerBattle(:SECRET_Dawn, "Dawn", nil, false, 0, true)')]),
    ...textCommands([
      "Maya: ¡Increíble! Esa fuerza... es la misma que salvó a Sinnoh en el pasado.",
      "Sigue adelante, Ash. El destino de todo este mundo está sobre tus hombros.",
      "¡Toma esto para ayudarte en el ascenso!",
    ], 1),
    script("pbReceiveItem(:RARECANDY, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(121, [SW_RELIC_GUIDE_1, SW_RELIC_GUIDE_1, 0], 1),   // R8: el sello del piso se rompe con el guía
    cmd(411),
    ...textCommands([
      "Maya: Todavía no alcanzas la cima, Ash. Vuelve cuando tu espíritu arda con más fuerza.",
    ], 1),
    cmd(412),
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
  addEventToMap(map, sealedRelicEvent(5, "Reliquia Sellada de la Aurora", relic.x, relic.y, SW_RELIC_GUIDE_1, "BOTTLECAP", "Chapa"));

  installPilgrims(cv, map, "1F", [20, 36], relic);   // R9: peregrinos del piso
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

  // R8: el rincón sellado del piso (el altar de roca marca dónde buscar)
  redesignFloor2(cv);
  const relic = sealedRelicSpot(cv, [20, 36], 2);
  drawSacredBoulder(cv, relic.x, relic.y);

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
    cmd(111, [12, S('pbTrainerBattle(:SECRET_Palmer, "Palmer", nil, false, 0, true)')]),
    ...textCommands([
      "Palmer: Majestuoso. Tu determinación resuena más fuerte que el trueno divino.",
      "Barry: ¡Uau! ¡Sabía que podías hacerlo, Ash! ¡Ahora ve y demuestra de qué estamos hechos los entrenadores!",
      "Palmer: Toma este tónico supremo. Lo necesitarás si planeas desafiar la cúspide.",
    ], 1),
    script("pbReceiveItem(:MAXREVIVE, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(121, [SW_RELIC_GUIDE_2, SW_RELIC_GUIDE_2, 0], 1),   // R8: el sello del piso se rompe con el guía
    cmd(411),
    ...textCommands([
      "Palmer: Aún no demuestras la maestría de un As del Frente de Batalla.",
      "Barry: ¡No te rindas, Ash! ¡Vuelve cuando puedas con mi padre!",
    ], 1),
    cmd(412),
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
  addEventToMap(map, sealedRelicEvent(5, "Reliquia Sellada del Trueno", relic.x, relic.y, SW_RELIC_GUIDE_2, "ABILITYPATCH", "Parche Habilidad"));

  installPilgrims(cv, map, "2F", [20, 36], relic);   // R9: peregrinos del piso
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

  // R8: el rincón sellado del piso (el altar de roca marca dónde buscar)
  redesignFloor3(cv);
  const relic = sealedRelicSpot(cv, [21, 38], 3);
  drawSacredBoulder(cv, relic.x, relic.y);

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
    cmd(111, [12, S('pbTrainerBattle(:SECRET_Riley, "Riley", nil, false, 0, true)')]),
    ...textCommands([
      "Quinoa: Un aura verdaderamente formidable. Has trascendido los límites ordinarios de la comunión con los Pokémon.",
      "Lleva este obsequio. Que tu energía jamás se agote en el combate que se avecina.",
    ], 1),
    script("pbReceiveItem(:PPMAX, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(121, [SW_RELIC_GUIDE_3, SW_RELIC_GUIDE_3, 0], 1),   // R8: el sello del piso se rompe con el guía
    cmd(411),
    ...textCommands([
      "Quinoa: Tu aura aún no está a la altura de este templo. Regresa cuando la comunión con tus Pokémon sea absoluta.",
    ], 1),
    cmd(412),
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
  addEventToMap(map, sealedRelicEvent(5, "Reliquia Sellada de la Isla", relic.x, relic.y, SW_RELIC_GUIDE_3, "MAXELIXIR", "Elixir Máximo"));

  installPilgrims(cv, map, "3F", [21, 38], relic);   // R9: peregrinos del piso
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

  // R8: el rincón sellado del piso (el altar de roca marca dónde buscar)
  redesignFloor4(cv);
  const relic = sealedRelicSpot(cv, [21, 38], 4);
  drawSacredBoulder(cv, relic.x, relic.y);

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
    cmd(111, [12, S('pbTrainerBattle(:SECRET_Cynthia, "Cynthia", nil, false, 0, true)')]),
    ...textCommands([
      "Cintia: Sublime... Una batalla que quedará grabada en las leyendas de nuestro tiempo.",
      "Lleva contigo esta reliquia de los templos de antaño. Si tus Pokémon caen ante el poder divino, esto les otorgará una segunda oportunidad.",
    ], 1),
    script("pbReceiveItem(:SACREDASH, 1)", 1),
    cmd(123, [S("A"), 0], 1),
    cmd(121, [SW_RELIC_GUIDE_4, SW_RELIC_GUIDE_4, 0], 1),   // R8: el sello del piso se rompe con el guía
    cmd(411),
    ...textCommands([
      "Cintia: El cosmos aún no está listo para tu victoria, Ash. Vuelve cuando tu vínculo con tus Pokémon sea inquebrantable.",
    ], 1),
    cmd(412),
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
  addEventToMap(map, sealedRelicEvent(5, "Reliquia Sellada de la Campeona", relic.x, relic.y, SW_RELIC_GUIDE_4, "GOLDBOTTLECAP", "Chapa Dorada"));

  installPilgrims(cv, map, "4F", [21, 38], relic);   // R9: peregrinos del piso
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

  // R8: el rincón sellado del piso (el altar de roca marca dónde buscar)
  redesignFloor5(cv);
  const relic = sealedRelicSpot(cv, [19, 34], 5);
  drawSacredBoulder(cv, relic.x, relic.y);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 5F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 4F", 19, 35, 2034, 21, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras al 6F", 19, 5, 2036, 19, 34, 8));

  const dialgaBattle = [
    cmd(101, [S("¡GYYYROOOHHH!\\1")]),
    cmd(101, [S("El señor del tiempo emite un rugido que desgarra el tejido de los segundos. ¡Una distorsión temporal envuelve el altar!")]),
    script("pbWildBattle(:DIALGA, 150)"),
    cmd(111, [12, S("$game_variables[1] == 1 || $game_variables[1] == 4")]),
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
  addEventToMap(map, sealedRelicEvent(5, "Reliquia Sellada del Tiempo", relic.x, relic.y, SW_DIALGA_DEFEATED, "SACREDASH", "Ceniza Sagrada"));

  installPilgrims(cv, map, "5F", [19, 34], relic);   // R9: peregrinos del piso
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

  // R8: el rincón sellado del piso (el altar de roca marca dónde buscar)
  redesignFloor6(cv);
  const relic = sealedRelicSpot(cv, [19, 34], 6);
  drawSacredBoulder(cv, relic.x, relic.y);

  const map = buildMapObject(cv, { name: "La Ruta de Dios — 6F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 5F", 19, 35, 2035, 19, 6, 2));
  addEventToMap(map, transferEvent(2, "Escaleras a la Cima", 19, 5, 2037, 23, 40, 8));

  const palkiaBattle = [
    cmd(101, [S("¡GRAAAGHHH!\\1")]),
    cmd(101, [S("El amo del espacio emite un alarido desgarrador. Las dimensiones tiemblan bajo el peso de su presencia.")]),
    script("pbWildBattle(:PALKIA, 150)"),
    cmd(111, [12, S("$game_variables[1] == 1 || $game_variables[1] == 4")]),
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
  addEventToMap(map, sealedRelicEvent(5, "Reliquia Sellada del Espacio", relic.x, relic.y, SW_PALKIA_DEFEATED, "ABILITYCAPSULE", "Cápsula Habilidad"));

  installPilgrims(cv, map, "6F", [19, 34], relic);   // R9: peregrinos del piso
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

  // Cima abierta y asimétrica: la ruta se ensancha frente al Altar del Origen.
  redesignFloor7(cv);
  const map = buildMapObject(cv, { name: "La Ruta de Dios — 7F", bgm: "Legend Sinnoh" });

  addEventToMap(map, transferEvent(1, "Escaleras al 6F", 23, 41, 2036, 19, 6, 2));

  // Arceus Boss Event
  const arceusBattle = [
    cmd(223, [tone(255, 255, 255, 160), 20]),
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
    script("pbStartArceusDivineBattle"),
    // Only a surviving party may resolve the encounter. Indents are essential
    // in RGSS: nested event branches at indent 0 can run after being skipped.
    cmd(111, [12, S("$Trainer.party.any? { |p| p && p.hp > 0 }")]),
    cmd(121, [SW_ARCEUS_RESOLVED, SW_ARCEUS_RESOLVED, 0], 1),
    cmd(223, [tone(255, 255, 255, 255), 30], 1),
    ...textCommands([
      "El fulgor del ser supremo desciende en una armonía sobrecogedora...",
      "Arceus: Increíble... Tu voluntad no quebrantó la creación, sino que le ha devuelto su equilibrio.",
    ], 1),
    cmd(111, [12, S("$game_switches[874]")], 1),
    ...textCommands([
      "Arceus: Has demostrado que los humanos y los Pokémon pueden sostener el peso de la eternidad. Acepto caminar a tu lado.",
      "Volo: Espera... ¿Has capturado al mismísimo Gran Uno? ¡No puede ser! ¡Durante eones busqué alcanzar la gloria del creador!",
      "Volo: ¡No permitiré que un joven mortal lo conserve! ¡Te desafío por el derecho a portar la corona de la existencia!",
    ], 2),
    cmd(355, [S("pbArceusVoloRest")], 2),
    cmd(111, [12, S('pbTrainerBattle(:SECRET_Volo, "Volo", nil, false, 4, true)')], 2),
    cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0], 3),
    ...textCommands([
      "Volo: Ja... ja... Es inútil luchar contra el destino, ¿verdad?",
      "Tu lazo con los Pokémon no proviene de la ambición, sino del amor puro por este mundo. Me rindo ante tu verdad, Ash.",
    ], 3),
    cmd(411, [], 2),
    ...textCommands([
      "Volo retrocede, todavía decidido. Recupera fuerzas y vuelve cuando estés preparado.",
    ], 3),
    cmd(412, [], 2),
    cmd(411, [], 1),
    ...textCommands([
      "El silencio absoluto envuelve la cima del monte. Las nubes se disipan, revelando el firmamento infinito.",
      "Volo: ¡Ash! ¡Lo... lo lograste! ¡El cosmos ha sido preservado!",
    ], 2),
    cmd(412, [], 1),
    cmd(111, [12, S("!$game_switches[874] || $game_switches[875]")], 1),
    cmd(121, [SW_COMPLETED, SW_COMPLETED, 0], 2),
    ...textCommands([
      "El portal de Puntaneva resuena con un tono apacible. La crisis divina ha concluido.",
    ], 2),
    cmd(412, [], 1),
    cmd(412, [], 0),
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
      cmd(355, [S("pbArceusVoloRest")]),
      cmd(111, [12, S('pbTrainerBattle(:SECRET_Volo, "Volo", nil, false, 4, true)')]),
      cmd(121, [SW_VOLO_DEFEATED, SW_VOLO_DEFEATED, 0], 1),
      cmd(121, [SW_COMPLETED, SW_COMPLETED, 0], 1),
      ...textCommands([
        "Volo: Lo entiendo ahora... El creador eligió a su campeón. Buen viaje, Ash.",
      ], 1),
      cmd(411, []),
      ...textCommands([
        "Volo retrocede. Recupérate y vuelve a desafiarlo cuando quieras.",
      ], 1),
      cmd(412),
      cmd(0),
    ],
  });
  const p3 = page({ cond: condition({ sw: SW_COMPLETED }), list: [cmd(0)] });

  addEventToMap(map, event(2, "Arceus Creador", 23, 10, [p1, p2, p3]));
  addEventToMap(map, hiddenItemEvent(3, "Item GOLDBOTTLECAP", 8, 12, "GOLDBOTTLECAP", "Chapa Dorada"));

  // Los cinco apoyos aparecen sólo durante la cinemática previa. Sus páginas
  // condicionadas permiten que la cima permanezca limpia durante el combate
  // real de Ash contra Arceus y después del desenlace.
  addEventToMap(map, cinematicTrainerEvent(4, "Apoyo — Cynthia", 19, 16,
    SW_ARCEUS_ALLIES_CYNTHIA_STEVEN, "ARC_Cynthia"));
  addEventToMap(map, cinematicTrainerEvent(5, "Apoyo — Steven", 27, 16,
    SW_ARCEUS_ALLIES_CYNTHIA_STEVEN, "ARC_Steven"));
  addEventToMap(map, cinematicTrainerEvent(6, "Apoyo — Gold", 18, 22,
    SW_ARCEUS_ALLIES_GOLD_RED, "ARC_Ethan"));
  addEventToMap(map, cinematicTrainerEvent(7, "Apoyo — Red", 28, 22,
    SW_ARCEUS_ALLIES_GOLD_RED, "SECRET_Red"));
  addEventToMap(map, cinematicTrainerEvent(8, "Apoyo — Volus", 23, 28,
    SW_ARCEUS_ALLIES_VOLUS, "SECRET_Volo"));

  return { map, cv };
}

// ---------------------------------------------------------------------------
// 6. Metadata, Encounters and MapInfos Registration
// ---------------------------------------------------------------------------
function registerMapsInMapInfos() {
  const infos = readRx("MapInfos.rxdata");
  const floorNames = [
    [2038, "La Ruta de Dios — Aproximación Celestial"],
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
  console.log("OK: Maps 2031..2038 registered in MapInfos.rxdata.");
}

function registerMapMetadata() {
  const meta = readRx("map_metadata.dat");
  for (let id = 2031; id <= 2038; id++) {
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
  console.log("OK: Maps 2031..2038 metadata registered in map_metadata.dat.");
}

function registerEncounters() {
  const enc = readRx("encounters.dat");

  const tables = [
    {
      map: 2038,
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
/** Relee Map<id>.rxdata y devuelve el lienzo, para validar rincones sin depender del build. */
function tileCanvasOf(mapId) {
  const parsed = parseMap(readRx(`Map${mapId}.rxdata`));
  const canvas = new TileCanvas(parsed.width, parsed.height, parsed.tilesetId);
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      for (const z of [0, 1, 2]) canvas.set(x, y, z, tableGet(parsed.table, x, y, z));
    }
  }
  return canvas;
}

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

// Sprites de los aliados cinematográficos (Cynthia, Steven, Ethan, Red, Volus).
// El motor necesita sus sprites traseros para seguir la mano del entrenador al
// lanzar la Poké Ball (PokeBattle_BallAnimationMixin#ballTracksHand lee
// traSprite.bitmap.width sin comprobar nil): si falta el gráfico, la batalla
// cinemática aborta con "undefined method 'width' for nil" antes de empezar.
// Si el sprite existe pero es un placeholder totalmente transparente (la base
// del juego los usa para los entrenadores SECRET), se sustituye por arte real
// del mismo personaje para que los aliados se vean en las cinemáticas.
const CINEMATIC_BACK_SPRITES = [
  ["ARC_Cynthia_back.png", ["CHAMPION_Cynthia_back.png", "SECRET_Cynthia.png"]],
  ["ARC_Steven_back.png", ["ARC_Steven.png", "SECRET_Steven.png"]],
  ["ARC_Ethan_back.png", ["SECRET_Ethan.png"]],
  ["SECRET_Red_back.png", ["SECRET_Red.png"]],
  ["SECRET_Volo_back.png", ["SECRET_Volo.png"]],
];
const CINEMATIC_FRONT_SPRITES = [
  ["ARC_Ethan.png", ["SECRET_Ethan.png"]],
];

// PNG cuyo contenido descomprimido es todo ceros: placeholder transparente.
function isBlankPng(file) {
  try {
    const data = fs.readFileSync(file);
    let offset = 8;
    const idat = [];
    while (offset + 12 <= data.length) {
      const length = data.readUInt32BE(offset);
      const type = data.toString("ascii", offset + 4, offset + 8);
      if (type === "IDAT") idat.push(data.subarray(offset + 8, offset + 8 + length));
      offset += 12 + length;
      if (type === "IEND") break;
    }
    if (idat.length === 0) return false;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    for (const byte of raw) if (byte !== 0) return false;
    return true;
  } catch {
    return false;
  }
}

function ensureCinematicTrainerSprites() {
  const dir = path.join(GAME, "Graphics", "Trainers");
  let updated = 0;
  const ensure = (target, sources) => {
    const dst = path.join(dir, target);
    if (fs.existsSync(dst) && !isBlankPng(dst)) return;
    const src = sources.map((s) => path.join(dir, s)).find((p) => fs.existsSync(p) && !isBlankPng(p));
    if (!src) throw new Error(`Falta un sprite visible para ${target} (buscado en ${sources.join(", ")})`);
    fs.copyFileSync(src, dst);
    updated++;
  };
  for (const [target, sources] of CINEMATIC_BACK_SPRITES) ensure(target, sources);
  for (const [target, sources] of CINEMATIC_FRONT_SPRITES) ensure(target, sources);
  console.log(`OK: sprites de aliados cinematográficos asegurados (${updated} actualizados).`);
}

function install() {
  backupOriginals();

  console.log("Installing Scripts and System Switches...");
  installScriptSection();
  installSwitches();

  console.log("Ensuring cinematic trainer sprites...");
  ensureCinematicTrainerSprites();

  console.log("Installing Volus, the celestial avenue, and the portal in Snowpoint City...");
  installTwinleafVolo();
  installSnowpointPortal();
  installSnowpointGuide();
  installSnowpointTreeGuide();

  console.log("Building the long celestial approach and the 7 Floors of La Ruta de Dios (Maps 2031..2038)...");
  const approach = buildCelestialApproach();
  validateFloorReachability("Celestial approach", approach.map, approach.cv, [26, 68]);
  writeRx("Map2038.rxdata", approach.map);

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
  if (txt(sw[SW_SNOWPOINT_PASS]) !== "SNOWPOINT_TEMPORARY_TREE_PASS") errors.push("Switch 877 not named SNOWPOINT_TEMPORARY_TREE_PASS");
  if (txt(sw[SW_ARCEUS_ALLIES_CYNTHIA_STEVEN]) !== "ARCEUS_CINEMATIC_CYNTHIA_STEVEN") errors.push("Switch 878 not named ARCEUS_CINEMATIC_CYNTHIA_STEVEN");
  if (txt(sw[SW_ARCEUS_ALLIES_GOLD_RED]) !== "ARCEUS_CINEMATIC_GOLD_RED") errors.push("Switch 879 not named ARCEUS_CINEMATIC_GOLD_RED");
  if (txt(sw[SW_ARCEUS_ALLIES_VOLUS]) !== "ARCEUS_CINEMATIC_VOLUS") errors.push("Switch 880 not named ARCEUS_CINEMATIC_VOLUS");
  if (txt(sw[SW_ARCEUS_MERCY]) !== "RUTA_DE_DIOS_ARCEUS_MERCY") errors.push("Switch 869 not named RUTA_DE_DIOS_ARCEUS_MERCY");
  if (txt(sw[SW_PRELUDE_SEEN]) !== "RUTA_DE_DIOS_PRELUDE_SEEN") errors.push("Switch 881 not named RUTA_DE_DIOS_PRELUDE_SEEN");
  for (const [id, name] of [[SW_RELIC_GUIDE_1, "RUTA_DE_DIOS_RELIQUIA_1F"], [SW_RELIC_GUIDE_2, "RUTA_DE_DIOS_RELIQUIA_2F"],
                            [SW_RELIC_GUIDE_3, "RUTA_DE_DIOS_RELIQUIA_3F"], [SW_RELIC_GUIDE_4, "RUTA_DE_DIOS_RELIQUIA_4F"]]) {
    if (txt(sw[id]) !== name) errors.push(`Switch ${id} not named ${name}`);
  }

  // 2. Verify Script Section
  const scripts = readRx("Scripts.rxdata");
  const scriptEntry = scripts.find(([id, title]) => title.text === "PokeMod_RutaDeDios");
  if (!scriptEntry) errors.push("Missing PokeMod_RutaDeDios in Scripts.rxdata");

  // 2b. Garantías de la batalla divina (seis barras, ruleta y cinemática).
  if (scriptEntry) {
    let ruby = "";
    try {
      ruby = zlib.inflateSync(Buffer.from(scriptEntry[2].bytes)).toString("utf-8");
    } catch (error) {
      errors.push(`No se pudo descomprimir la sección PokeMod_RutaDeDios: ${error.message}`);
    }
    const guarantees = [
      ["pbArceusNormalizeCaptured", "normalización del Arceus capturado, separada del jefe"],
      ["@ruta_arceus_captured_god", "marcador propio del Arceus capturado"],
      ["@ruta_arceus_captured_god_level", "nivel 200 persistente del Arceus capturado"],
      ["def pbRutaArceusGodWorldAllowed?", "gating por whitelist explícita de mapas"],
      ["def pbRutaArceusSyncCapturedPokemonMode", "activación/suspensión del modo al cambiar de mapa"],
      ["def pbRutaArceusRestoreCapturedAfterBattle", "recuperación exclusiva de PS/PP del Arceus capturado"],
      ["Events.onEndBattle += proc", "recuperación al final de cada combate"],
      ["def pbSetPP(move, pp)", "PP infinitos para los movimientos del Arceus capturado activo"],
      ["def pbReducePP(move)", "el uso de movimientos no consume PP en modo divino"],
      ["def pbReducePPOther(move)", "presión y reducciones externas tampoco consumen PP"],
      ["def ruta_arceus_universal_stab?", "STAB universal limitado al modo del Arceus capturado"],
      ["def pbHasType?(type)", "las 17 Tablas otorgan STAB universal"],
      ["def pbArceusPurgeCapturedField", "purga de hazards, pantallas, clima y terreno al entrar"],
      ["def pbArceusBestJudgmentType", "Sentencia elige el tipo más eficaz"],
      ["def pbArceusReactiveDefense", "cambio defensivo reactivo del tipo"],
      ["def pbSuccessCheckAgainstTarget", "Judgment ignora protecciones al garantizar el KO"],
      ["def pbCalcTypeMod(moveType, user, target)", "Judgment garantiza efectividad y defensa reactiva en resolución"],
      ["def pbArceusCinematicHeal", "el Arceus jefe se cura antes de las acciones de Cynthia/Máximo y Red/Gold"],
      ["def ruta_arceus_cinematic_boss?", "marcador exclusivo para proteger al Arceus temporal de las cinemáticas"],
      ["def pbInflictHPDamage(target)", "protección en la ruta real de daño por movimiento del motor"],
      ["def ruta_arceus_scripted_hp_write", "sólo el guion puede escribir los PS del Arceus divino"],
      ["def ruta_arceus_divine_boss?", "el jefe del duelo real se distingue del Arceus capturado"],
      ["def hp=(value)", "el setter de PS bloquea el daño externo contra los Arceus de la cima"],
      ["return :ruta_arceus_cinematic_absorb", "los ataques de las cinemáticas se absorben sin mover la barra"],
      ["def pbArceusCinematicAbsorb", "el aura dorada narra la absorción; el Creador nunca pierde PS"],
      ["def pbArceusDivineBarDamage", "el daño de movimientos del motor pasa por las seis barras"],
      ['recordBattleRule("weather", "None")', "el duelo divino no hereda el granizo del mapa"],
      ['setBattleRule("weather", "None")', "las cinemáticas no heredan el clima de la cumbre"],
      ["def pbFaint(showMessage = true)", "respaldo contra rutas de daño especiales que intenten finalizar la escena"],
      ["module RutaDeDiosBallBreaker", "compatibilidad del motor para Ball Breaker y las protecciones"],
      ["def self.flag_active?(holder, names)", "consulta de efectos protectores individuales y de lado"],
      ["def self.clear_protections!(target)", "Ball Breaker vuelve a retirar todas las protecciones del objetivo"],
      ["def selfProtected?", "restaura el ayudante que la sección Despacito Despair da por existente"],
      ["def sideProtected?", "restaura el ayudante de protecciones de lado que Ball Breaker consulta"],
      ["class PokeBattle_Move_DF08", "Ball Breaker reescrito para no abortar el combate con NoMethodError"],
      ["arceus_cinematic_adaptive?", "la IA táctica nueva se limita a Cynthia/Máximo y Red/Gold"],
      ["def pbArceusCapturedPlateRotation", "las 17 Tablas giran antes del cambio de tipo"],
      ["def pbArceusTypeShiftVisual", "cambio visual de color tras la ruleta"],
      ["pbArceusEnsureCaptureBall", "red de seguridad: ball garantizada en el turno de captura"],
      ["@species == :ARCEUS && @ruta_arceus_divine == true", "tope de nivel 200 reservado al Arceus divino"],
      ["!(pkmn.respond_to?(:egg?) && pkmn.egg?)", "pseudo-PC sin huevos"],
      ["divine ? normal_cap : safe_level", "el Arceus cinemático nace al tope normal y sube como divino"],
      ["arceus_capture_ready", "captura determinista tras agotar seis barras"],
      ["RUTA_ARCEUS_STAGE_COUNT = 6", "seis etapas y seis barras completas"],
      ["@ruta_arceus_bars_depleted", "contador de barras agotadas persistido en Arceus"],
      ["def pbArceusDepleteBar", "transición sólo cuando una barra completa llega a cero"],
      ["def check_arceus_phase(battler)", "hook de transición compatible con los efectos canónicos por fase"],
      ["check_arceus_phase(battler)", "el hook canónico se ejecuta al avanzar de etapa"],
      ["return :ruta_arceus_stage_break if amount.to_i >= battler.hp", "el KO se transforma en una transición de etapa"],
      ["@ruta_arceus_last_bar_action_key", "un solo avance de barra por acción multigolpe"],
      ["def pbArceusRedlineHeal", "curación completa de Arceus en rojo una vez por etapa"],
      ["def pbArceusBestAttackIds", "catálogo de ataques puntuado contra el equipo activo"],
      ["GameData::Move.each do |move_data|", "arsenal extraído de todos los ataques del juego"],
      ["@battleAI.pbRegisterMoveTrainer", "puntuación táctica de la IA de alto nivel del motor"],
      ["def pbArceusChooseSmartMove", "memoria para no repetir movimientos mientras haya alternativas"],
      ["@ruta_arceus_move_history", "historial de acciones de Arceus"],
      ["def pbArceusBattleCommentary", "diálogo contextual en cada turno de Arceus"],
      ["def pbArceusAdaptTypeToRival", "Arceus reevalúa la Tabla al cambiar el Pokémon rival"],
      ["pbArceusRedlineHeal(boss, true)", "curación garantizada antes de la acción de Arceus"],
      ["return false if @endOfRound && !force", "la fase de fin de ronda no bloquea la curación forzada"],
      ["def pbArceusPlateRouletteAnimation", "ruleta animada con las 17 Tablas"],
      ["ItemIconSprite.new(0, 0, plate, viewport)", "iconos reales de Tablas en la ruleta"],
      ["def pbArceusControlLevels", "Arceus ajusta su nivel y el del rival por etapa"],
      ["def pbCanInflictStatus?", "inmunidad a estados del Arceus divino y cinemático"],
      ["def pbArceusClearControlEffects", "limpieza de estados y bajadas persistentes"],
      ["def pbArceusScriptedAction", "selección de movimientos y objetivos coreografiada"],
      ["alias _ruta_arceus_original_pb_player pbPlayer", "respaldo de pbPlayer antes de las escenas NPC contra NPC"],
      ["return $Trainer if defined?($Trainer) && $Trainer && $Trainer.respond_to?(:badge_count)", "las escenas automáticas consultan un Player real para sus insignias"],
      ["def pbArceusMoveIds(move_ids, phase = nil)", "máximo de cuatro movimientos por fase para respetar el motor"],
      ["pkmn.moves = pbArceusMoveIds(RUTA_ARCEUS_MOVE_SETS[0], 1).map", "set inicial de Arceus limitado a cuatro movimientos"],
      ["valid = pbArceusMoveIds(move_ids, @arceus_phase)", "transiciones de fase limitadas a cuatro movimientos"],
      ["RUTA_ARCEUS_CINEMATIC_RNG_SEED", "azar local reproducible en los combates de apoyo"],
      ["class PokeBattle_Move", "Arceus no falla ataques durante las escenas de apoyo"],
      ["_ruta_arceus_original_accuracy_check", "la precisión normal se conserva fuera de la cinemática"],
      ["@ruta_arceus_cinematic_mode", "modo determinista activado en el constructor auxiliar"],
      ["def pbStartBattleSendOut(sendOuts)", "diálogo y salida a medida del encuentro divino"],
      ["BattleIntroAnimation.new(@sprites, @viewport, @battle)", "entrada de Arceus con sprite y caja de datos coreografiados"],
      ["pbArceusScaleSprite", "efectos de escala en las fases del combate"],
      ["pbArceusRotomMercy", "el pseudo-PC nunca deja al jugador sin salida (R4)"],
      ["pbArceusVoloRest", "descanso antes del duelo con Volo (R6)"],
      ["summon_level = GameData::GrowthRate.max_level", "los ecos invocados no usan el nivel 200 (R2)"],
      ["RUTA_DE_DIOS_PRELUDE_SEEN_SWITCH", "el prólogo sólo se ve una vez (R7)"],
      ["Ir directo al duelo con Arceus", "el prólogo se puede saltar desde el primer arranque (R8)"],
      ["RUTA_ARCEUS_HIT_CAP_RATIO", "Arceus no derriba de un solo golpe a los Pokémon de Ash (R8/R9)"],
      ["RUTA_ARCEUS_REDLINE_HEAL_RATIO", "el umbral rojo no borra el avance de Ash: media barra (R9)"],
      ["def ruta_arceus_apply_ohko_guard", "tope de daño por acción sobre la ruta real del duelo (R8/R9)"],
      ["def ruta_arceus_mega?", "Mega Arceus activo durante la última barra (R10)"],
      ["def ruta_arceus_mega_aparicion", "megaevolución de los Mil Brazos al agotar la quinta barra (R10)"],
      ["def ruta_arceus_primigenia?", "Forma Primigenia activa en el tramo final (R11)"],
      ["def ruta_arceus_primigenia_aparicion", "la Forma Primigenia despierta en el umbral rojo de la última barra (R11)"],
      ["RUTA_ARCEUS_PRIMIGENIA_MOVES = [:JUDGMENT", "pool del dios sin Tabla ni reglas (R11)"],
      ["def ruta_arceus_divine_ratio", "daño divino variable por acción, nunca fijo (R12)"],
      ["def ruta_arceus_dialogo", "mazos de diálogo sin repeticiones hasta agotarse (R12)"],
      ["RUTA_ARCEUS_BGM_POR_FASE = {", "música distinta en cada fase del duelo (R12)"],
      ["def ruta_arceus_turno_divino", "orquestador divino por turno, aislado de la ronda (R12)"],
      ["def ruta_arceus_jugar", "minijuegos divinos dentro del combate (R12)"],
      ["RUTA_ARCEUS_INVOCACIONES = [", "invocaciones del lore: Trío, lagos, titanes y resistencia (R12)"],
      ["def ruta_arceus_copiar_equipo", "Arceus copia los golpes del equipo de Ash (R12)"],
      ["def ruta_arceus_ofrenda", "merced del último Pokémon: cura total y PP, una vez por batalla (R12)"],
      ["Podría matarte ahora mismo, a ti y a tus Pokémon", "cinemática de apertura con sprites en acción (R12)"],
      ["RUTA_ARCEUS_MIL_BRAZOS = [:FURYSWIPES", "pool multigolpe de la última barra (R10)"],
      ["@ruta_arceus_mega_grito_key", "un grito de los Mil Brazos por acción enemiga (R10)"],
      ["def ruta_arceus_ash_bar_damage", "el daño de Ash a las seis barras se pondera con el vínculo (R8)"],
      ["def pbCalculatePriority(fullCalc = false, indexArray = nil)", "el lado de Ash abre cada ronda del duelo (R8)"],
      ["def pbCountArceusPlates", "helper de conteo de Tablas para el evento de Volus"],
      ["def pbHasAllArceusPlates?", "helper de comprobación de las 17 Tablas del Génesis"],
      ["def pbGrantAllArceusPlates", "helper de concesión de las Tablas del Génesis"],
      ["RUTA_DE_DIOS_ARCEUS_RESOLVED = 873", "constante del switch de Arceus resuelto usada en la rendición"],
      ["def ballTracksHand(ball, traSprite, safariThrow = false)", "guarda de nil en el seguimiento de la mano del entrenador (crash 'width' for nil)"],
      ["pbArceusEnsureCaptureBall if isPlayer && arceus_divine? && arceus_capture_ready?", "la bola se reintenta cuando la sexta barra abre la captura"],
      ["def pbArceusCinematicRebirth", "Arceus se cura por completo y se burla antes del combate de Ash"],
      ["def pbArceusCinematicWalkIn", "Cynthia/Máximo y Red/Gold caminan hasta ocupar el altar"],
      ["def pbArceusCinematicWalkAway", "los aliados derrotados se alejan antes del siguiente grupo"],
      ["def self.capture_room?", "comprobación de espacio en el estado de rollback antes de la captura garantizada"],
      ["if ArceusSaveSandbox.capture_room?", "la captura garantizada no se ofrece si no cabe el Pokémon (commit siempre posible)"],
      ["module ArceusSaveSandbox", "límite transaccional integral del encuentro"],
      ["SaveData.compile_save_hash", "snapshot de todos los valores persistentes"],
      ["alias arceus_unrestricted_save_to_file save_to_file", "barrera de escritura de guardado"],
      ["errors.concat(restore_values(transaction[:snapshot]))", "rollback exhaustivo aunque falle una clave individual"],
      ["disk_error = restore_disk!(transaction)", "restauración física dentro del ensure final"],
      ["alias arceus_unrestricted_delete_file delete_file", "bloqueo de borrado de partida durante el encuentro"],
      ["canonical_capture = ArceusSaveSandbox.deep_copy(pkmn)", "captura canónica aislada del estado transitorio"],
      ["ensure\n    prelude_seen", "finalización transaccional garantizada"],
    ];
    for (const [needle, label] of guarantees) {
      if (ruby && !ruby.includes(needle)) errors.push(`Falta una garantía de la batalla: ${label}`);
    }
    const rangeConstants = {
      fire_ash: "RUTA_ARCEUS_FIRE_ASH_MAP_RANGES",
      atlas: "RUTA_ARCEUS_ATLAS_MAP_RANGES",
      liquid_crystal: "RUTA_ARCEUS_LIQUID_CRYSTAL_MAP_RANGES",
      team_rocket: "RUTA_ARCEUS_TEAM_ROCKET_MAP_RANGES",
    };
    for (const [world, constant] of Object.entries(rangeConstants)) {
      const expectedRanges = CAPTURED_GOD_MODE_POLICY.mapas_permitidos[world];
      if (ruby && !ruby.includes(`${constant} = ${JSON.stringify(expectedRanges)}`)) {
        errors.push(`La whitelist Ruby no coincide con canon_arceus.json para ${world}`);
      }
    }
    const allowedRanges = Object.values(CAPTURED_GOD_MODE_POLICY.mapas_permitidos).flat();
    const isAllowedMap = (mapId) => allowedRanges.some(([first, last]) => mapId >= first && mapId <= last);
    const mapCases = [
      [1, true], [142, true], [143, false], [144, true], [992, true],
      [993, false], [994, true], [999, true], [1000, false], [1020, false],
      [1021, true], [2020, true], [2021, false], [2023, false], [2030, false],
      [2031, true], [2037, true], [2038, true], [2039, false],
      [2191, true], [2192, false], [2194, false], [2195, true], [2196, true],
      [2200, false], [2220, true], [2221, true], [2230, true], [2231, false],
      [2240, true], [2241, true], [2242, false], [2245, false],
      [2250, true], [2257, true], [2258, false], [2280, true], [2286, true], [2287, false],
      [2999, false], [3000, false], [3110, false], [3111, false],
      [3120, false], [3138, false], [3199, false], [3200, true], [3631, true], [3632, false],
      [3699, false], [3700, false], [3944, false], [3945, false],
    ];
    for (const [mapId, expected] of mapCases) {
      if (isAllowedMap(mapId) !== expected) errors.push(`Whitelist de Arceus incorrecta para el mapa ${mapId}`);
    }
    if (ruby.includes("[[1,1020]]") || ruby.includes("[[2190,2300]]")) {
      errors.push("La whitelist de Arceus usa rangos amplios que abarcan otras dimensiones");
    }
    if (ruby.includes("RUTA_ARCEUS_PHASE_THRESHOLDS") || ruby.includes("RUTA_ARCEUS_SEAL_FLOORS") ||
        ruby.includes("def check_arceus_seal") || ruby.includes("@ruta_arceus_seals") ||
        ruby.includes("def pbArceusRealityControl")) {
      errors.push("La progresión usa sellos parciales o Arceus está curando reservas del equipo rival");
    }
    for (const species of ["SPIRITOMB", "TOGEKISS", "MILOTIC", "LUCARIO", "ROSERADE", "GARCHOMP"]) {
      if (!ruby.includes(`:${species}`)) errors.push(`La escena o el dex ya no incluye ${species}`);
    }
  }

  // 2c. Recorrido completo: cada piso tiene bajada y subida, los guías de los
  // pisos 1-4 desaparecen al completar el evento y los guardianes usan su switch.
  const transferTargets = (map) => {
    const out = [];
    for (const [, ev] of iv(map, "events").pairs) {
      for (const page of iv(ev, "pages") ?? []) {
        for (const command of iv(page, "list") ?? []) {
          if (Number(iv(command, "code")) !== 201) continue;
          const params = iv(command, "parameters") ?? [];
          out.push({ name: txt(iv(ev, "name")), x: Number(iv(ev, "x")), y: Number(iv(ev, "y")), target: Number(params[1]), tx: Number(params[2]), ty: Number(params[3]) });
        }
      }
    }
    return out;
  };
  const esperado = { 2031: [625, 2032], 2032: [2031, 2033], 2033: [2032, 2034], 2034: [2033, 2035], 2035: [2034, 2036], 2036: [2035, 2037], 2037: [2036] };
  for (const [id, destinos] of Object.entries(esperado)) {
    const file = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const movs = transferTargets(readRx(`Map${id}.rxdata`));
    for (const destino of destinos) {
      if (!movs.some((m) => m.target === destino)) errors.push(`Map${id} no tiene transferencia a ${destino}`);
    }
  }
  // Nombres reales de los guías/entrenadores de los pisos 1-4 (se ocultan al completar).
  const guias = { 2031: "Maya de la Ruta", 2032: "Palmer del Frente", 2033: "Quinoa de la Isla", 2034: "Cintia Campeona" };
  for (const [id, nombre] of Object.entries(guias)) {
    const file = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const map = readRx(`Map${id}.rxdata`);
    const ev = iv(map, "events").pairs.find(([, e]) => txt(iv(e, "name")).includes(nombre));
    if (!ev) { errors.push(`Map${id} no tiene al guía ${nombre}`); continue; }
    const pages = iv(ev[1], "pages") ?? [];
    const cierre = pages.find((page) => Number(iv(iv(page, "condition"), "switch1_id")) === SW_COMPLETED);
    if (!cierre) { errors.push(`${nombre} (Map${id}) no desaparece tras RUTA_DE_DIOS_COMPLETED`); continue; }
    const oculto = txt(iv(iv(cierre, "graphic"), "character_name")) === "" && (iv(cierre, "list") ?? []).length <= 1;
    if (!oculto) errors.push(`${nombre} (Map${id}) sigue visible o activo tras completar el evento`);
    // La recompensa sólo puede entregarse al vencer: la batalla debe ir como
    // condición de rama (cmd 111 tipo script) y existir rama de derrota.
    const cmdsGuia = iv(pages[0], "list") ?? [];
    const batallaCondicional = cmdsGuia.some((c) => {
      if (Number(iv(c, "code")) !== 111) return false;
      const params = iv(c, "parameters") ?? [];
      return Number(params[0]) === 12 && txt(params[1]).includes("pbTrainerBattle");
    });
    if (!batallaCondicional) errors.push(`${nombre} (Map${id}) no condiciona la recompensa al resultado del combate`);
    const tieneRamaDerrota = cmdsGuia.some((c) => Number(iv(c, "code")) === 411) &&
                             cmdsGuia.some((c) => Number(iv(c, "code")) === 412);
    if (!tieneRamaDerrota) errors.push(`${nombre} (Map${id}) no tiene rama de derrota tras el combate`);
  }
  for (const [id, guardian, swId] of [[2035, "Guardián Dialga", SW_DIALGA_DEFEATED], [2036, "Guardián Palkia", SW_PALKIA_DEFEATED]]) {
    const file = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const map = readRx(`Map${id}.rxdata`);
    const ev = iv(map, "events").pairs.find(([, e]) => txt(iv(e, "name")).includes(guardian));
    if (!ev) { errors.push(`Map${id} no tiene al guardián ${guardian}`); continue; }
    const usaSwitch = (iv(ev[1], "pages") ?? []).some((page) => {
      const cond = iv(page, "condition");
      return Number(iv(cond, "switch1_id")) === swId || Number(iv(cond, "switch2_id")) === swId;
    });
    if (!usaSwitch) errors.push(`El guardián ${guardian} (Map${id}) no se apaga con su switch`);
    // El guardián sólo se desvanece al derrotarlo o capturarlo: la condición
    // post-batalla debe leer la variable de resultado, no sólo los PS del equipo.
    const cmdsGuardia = iv((iv(ev[1], "pages") ?? [])[0], "list") ?? [];
    const resultadoCombate = cmdsGuardia.some((c) => {
      if (Number(iv(c, "code")) !== 111) return false;
      const params = iv(c, "parameters") ?? [];
      return Number(params[0]) === 12 && txt(params[1]).includes("$game_variables[1]");
    });
    if (!resultadoCombate) errors.push(`El guardián ${guardian} (Map${id}) no comprueba el resultado del combate (victoria o captura)`);
  }

  // 2d. Sprites traseros de los aliados cinematográficos: el motor los usa al
  // lanzar la Poké Ball (ballTracksHand lee traSprite.bitmap.width sin comprobar
  // nil) y la batalla aborta con "undefined method 'width' for nil" si faltan.
  // Tampoco pueden ser placeholders transparentes: los aliados dejarían de verse.
  for (const sprite of ["ARC_Cynthia_back.png", "ARC_Steven_back.png", "ARC_Ethan_back.png", "SECRET_Red_back.png", "SECRET_Volo_back.png"]) {
    const spritePath = path.join(GAME, "Graphics", "Trainers", sprite);
    if (!fs.existsSync(spritePath)) {
      errors.push(`Falta el sprite trasero del aliado cinemático ${sprite}`);
    } else if (isBlankPng(spritePath)) {
      errors.push(`El sprite trasero del aliado cinemático ${sprite} es un placeholder transparente`);
    }
  }

  // 2e. Gráficos de los objetos de la ruta y diálogos diferenciados por hablante.
  const patronHablante = /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]{0,15}):\s/;
  for (const id of [2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038]) {
    const file = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const map = readRx(`Map${id}.rxdata`);
    for (const [, ev] of iv(map, "events").pairs) {
      const evName = txt(iv(ev, "name"));
      for (const page of iv(ev, "pages") ?? []) {
        const gfxName = txt(iv(iv(page, "graphic"), "character_name"));
        if (gfxName === "Item ball") errors.push(`Map${id} ev "${evName}" usa el gráfico inexistente "Item ball"`);
        for (const c of iv(page, "list") ?? []) {
          if (Number(iv(c, "code")) !== 401) continue;
          const texto = txt((iv(c, "parameters") ?? [])[0]);
          if (patronHablante.test(texto) && !texto.startsWith("\\b")) {
            errors.push(`Map${id} ev "${evName}": diálogo con hablante sin \\b -> "${texto.slice(0, 40)}..."`);
          }
        }
      }
    }
  }

  // 3. Verify Volo in Map 513
  const map513 = readRx("Map513.rxdata");
  const voloEv = iv(map513, "events").pairs.find(([, ev]) => txt(iv(ev, "name")).includes("Volus de la Ruta"));
  if (!voloEv) errors.push("Missing Volo event in Map 513");

  // 4. Verify Portal in Map 625
  const map625 = readRx("Map625.rxdata");
  const snowEvents = iv(map625, "events").pairs;
  const portalEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Portal a la Ruta de Dios"));
  if (!portalEv) errors.push("Missing Portal event in Map 625");
  else {
    const firstPage = iv(portalEv[1], "pages")?.[0];
    const portalTransfer = iv(firstPage, "list")?.find((command) => Number(iv(command, "code")) === 201);
    if (Number(iv(portalTransfer, "parameters")?.[1]) !== 2038) {
      errors.push("The Snowpoint portal must transfer to Map 2038 (the celestial approach)");
    }
  }
  const guideEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Volus — Guía Celestial"));
  if (!guideEv) errors.push("Missing second Volus guide in Map 625");
  const squirtleEv = snowEvents.find(([, ev]) => txt(iv(ev, "name")).includes("Squirtle — Paso Temporal"));
  if (!squirtleEv) errors.push("Missing temporary Snowpoint tree guide in Map 625");
  if (snowEvents.some(([, ev]) => txt(iv(ev, "name")) === "Brandon" || txt(iv(ev, "name")).includes("Regigigas"))) {
    errors.push("The old Regigigas temple NPC still occupies the Snowpoint plaza");
  }

  // 5. Protect the shared ID allocation: Monte Silver owns 2030; the Ruta
  // approach is 2038 and the seven floors remain 2031-2037.
  const mapInfos = readRx("MapInfos.rxdata");
  const infoName = (id) => {
    const info = mapInfos.pairs.find(([key]) => Number(key) === id)?.[1];
    return txt(iv(info, "name"));
  };
  if (!infoName(2030).includes("Gruta de los Testigos")) {
    errors.push("Map 2030 must remain Monte Silver — Gruta de los Testigos");
  }
  if (!infoName(2038).includes("Aproximación Celestial")) {
    errors.push("Map 2038 must be La Ruta de Dios — Aproximación Celestial");
  }
  // Verify the approach plus the 7 sacred floors, without reading or replacing 2030.
  for (let id = 2031; id <= 2038; id++) {
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

  // 8. R8: reliquias selladas. Cada piso 1-6 esconde una reliquia en un rincón sin
  // salida, y sólo cede cuando el sello de ese piso (su guía o su guardián) está roto.
  const reliquias = [
    [2031, "Reliquia Sellada de la Aurora", SW_RELIC_GUIDE_1],
    [2032, "Reliquia Sellada del Trueno", SW_RELIC_GUIDE_2],
    [2033, "Reliquia Sellada de la Isla", SW_RELIC_GUIDE_3],
    [2034, "Reliquia Sellada de la Campeona", SW_RELIC_GUIDE_4],
    [2035, "Reliquia Sellada del Tiempo", SW_DIALGA_DEFEATED],
    [2036, "Reliquia Sellada del Espacio", SW_PALKIA_DEFEATED],
  ];
  for (const [id, nombre, sello] of reliquias) {
    const file = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(file)) { errors.push(`Falta Map${id} con la reliquia ${nombre}`); continue; }
    const map = readRx(`Map${id}.rxdata`);
    const ev = iv(map, "events").pairs.find(([, e]) => txt(iv(e, "name")) === nombre);
    if (!ev) { errors.push(`Map${id} no tiene la reliquia ${nombre}`); continue; }
    const pages = iv(ev[1], "pages") ?? [];
    const apertura = pages[0];
    if (Number(iv(iv(apertura, "condition"), "switch1_id")) !== sello) {
      errors.push(`${nombre} (Map${id}) no está sellada con el switch ${sello}`);
    }
    // El rincón: la celda de la reliquia no es transitable, pero se llega de frente a ella.
    const canvas = tileCanvasOf(id);
    const pass = passabilityOf(canvas, canvas.tilesetId);
    const x = Number(iv(ev[1], "x")), y = Number(iv(ev[1], "y"));
    const start = { 2031: [20, 36], 2032: [20, 36], 2033: [21, 38], 2034: [21, 38], 2035: [19, 34], 2036: [19, 34] }[id];
    const reachable = reachableCells(pass, start);
    if (reachable.has(`${x},${y}`)) errors.push(`${nombre} (Map${id}) quedó en suelo pisable: no hay rincón que explorar`);
    const deFrente = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) => reachable.has(`${nx},${ny}`));
    if (!deFrente) errors.push(`${nombre} (Map${id}) está en (${x}, ${y}) sin acceso de frente desde el piso`);
  }

  // 9. R9: peregrinos. Dos por piso, en suelo alcanzable, y la voz del sello nombra el
  // rumbo de la reliquia de ese piso (la pista no puede mentir).
  const rumbos = {
    2031: "norte", 2032: "sur", 2033: "sur", 2034: "norte", 2035: "norte", 2036: "sur",
  };
  for (const [id, esperado] of Object.entries(rumbos)) {
    const file = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const map = readRx(`Map${id}.rxdata`);
    const peregrinos = iv(map, "events").pairs.filter(([, e]) => txt(iv(e, "name")).includes("Peregrino"));
    if (peregrinos.length !== 2) { errors.push(`Map${id} tiene ${peregrinos.length} peregrinos (R9 pide 2)`); continue; }
    const canvas = tileCanvasOf(id);
    const pass = passabilityOf(canvas, canvas.tilesetId);
    const start = { 2031: [20, 36], 2032: [20, 36], 2033: [21, 38], 2034: [21, 38], 2035: [19, 34], 2036: [19, 34] }[id];
    const reachable = reachableCells(pass, start);
    for (const [, e] of peregrinos) {
      const x = Number(iv(e, "x")), y = Number(iv(e, "y"));
      if (!reachable.has(`${x},${y}`)) errors.push(`Peregrino de Map${id} en (${x}, ${y}) fuera del piso transitable`);
    }
    const pista = peregrinos.map(([, e]) => iv(iv(e, "pages")[0], "list")).map((l) => l.map((c) => iv(c, "parameters").map(txt).join(" ")).join(" ")).join(" ");
    if (!pista.includes("roca que no es roca")) errors.push(`Map${id}: el peregrino del sello no da la pista de la reliquia`);
    if (!pista.includes(esperado)) errors.push(`Map${id}: la pista no nombra el rumbo ${esperado} de su reliquia`);
  }

  if (errors.length) {
    throw new Error(`La Ruta de Dios verification failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  }
  console.log("Verification OK: La Ruta de Dios fully verified (7 floors, Arceus Lv. 200, Volo, Dialga, Palkia, trainers, switches, and scripts).");
}

if (!VERIFY_ONLY) {
  install();
}
verify();
