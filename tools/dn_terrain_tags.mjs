#!/usr/bin/env node
/**
 * dn_terrain_tags.mjs — FASE 57: los tiles de hierba, agua, arena y nieve del
 * Dimensional Nightmare tienen que ser TERRENO de verdad (encuentros y crujido).
 *
 * El problema medido en el repositorio:
 *   · Los 148 mapas `DN_<id>` usan un tileset propio por mapa y
 *     `apply_dimensional_nightmare_maps.mjs` los registró con `@terrain_tags` = 0.
 *   · Con tag 0 (`:None`) el motor no ve hierba: no hay `shows_grass_rustle`
 *     (sin animación de crujido) ni `land_wild_encounters`, y `encounters.dat`
 *     no tenía ninguna tabla para 2040–2190.
 *   Resultado: la hierba, el agua, la arena y la nieve del Nightmare se ven pero
 *   no se comportan como terreno.
 *
 * Qué hace este script (una sola pieza; no duplica los otros generadores):
 *   1. Clasifica el material de cada bloque que los mapas pisan de verdad
 *      (celdas transitables de `content/dimensional_nightmare_passability.json`)
 *      leyendo el color del bloque en el tileset a color del grupo (×2), porque
 *      el PNG del juego ya está cuantizado a la paleta Game Boy verde.
 *      Materiales del motor: Grass, Snow, Sand, Water, Rock.
 *   2. Traduce material → etiqueta de terreno (`GameData::TerrainTag`, sección
 *      `TerrainTag` de `Scripts.rxdata`):
 *         hierba  → 2 :Grass  (crujido + encuentros de Land)
 *         nieve   → 2 :Grass en los mundos con fauna (nieve pisable = hierba nevada)
 *                   4 :Rock  en el resto (igual que la nieve del Monte Silver base, Map2021/2022)
 *         arena   → 3 :Sand   (ambiente de arena; sin fauna propia)
 *         agua    → 5/6/7 :DeepWater/:StillWater/:Water (reflejos, pesca, ambiente de agua)
 *         piedra  → 4 :Rock
 *      En los mundos de exterior (`Land`) TODO el suelo pisable que no sea agua
 *      recibe :Grass: es la única etiqueta del motor que da crujido y encuentros
 *      a la vez, así que la hierba, la arena y la nieve de esos mundos "actúan
 *      como terreno real" en lugar de ser decorado.
 *   3. Instala las tablas de salvajes del GDD (docs/DIMENSIONAL_NIGHTMARE §7 de
 *      01–06 y 16–18) en `encounters.dat`, con los rangos de mapa, los niveles y
 *      las rarezas que documentan los episodios; `Land` en los exteriores y
 *      `Cave` en Catacumbas/Atrio (el motor elige Land si la celda es de hierba
 *      y Cave en cualquier otra).
 *   4. Verifica la cadena completa: etiqueta instalada ↔ material ↔ tabla de
 *      encuentros ↔ animación de crujido (`Settings::GRASS_ANIMATION_ID` existe
 *      de verdad en `Animations.rxdata` y `Overworld` la dibuja al pisar).
 *
 * Hallazgo de motor que la auditoría deja documentado: en `116_TerrainTag.rb`
 * TODAS las etiquetas de agua tienen `:can_surf => false`, también en el juego
 * base, así que el surf y los encuentros de agua son inalcanzables en esta
 * entrega; el agua del Nightmare queda con las mismas propiedades que el agua del
 * juego base (reflejos, pesca y ambiente de combate) y no altera el paso.
 *
 * Uso:
 *   node tools/dn_terrain_tags.mjs --plan          # escribe el catálogo (no toca el juego)
 *   node tools/dn_terrain_tags.mjs --render        # hojas de evidencia por mundo
 *   node tools/dn_terrain_tags.mjs --materials     # hoja de materiales por grupo (calibración)
 *   node tools/dn_terrain_tags.mjs --apply         # instala etiquetas + encuentros
 *   node tools/dn_terrain_tags.mjs --verify        # auditoría (falla si hay incoherencias)
 * Tras `--apply` hay que regenerar el paquete QA: npm run build:dn:qa
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RHash, RObject, RSymbol } from "../web/js/marshal.js";
import { parseMap, parseTileset, tableGet, tableToUserDef } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const GRAPHICS = path.join(GAME, "Graphics", "Tilesets");
const BACKUP = path.join(GAME, "PokeModBackups", "dn_terrain_originals");
const CATALOG_PATH = path.join(ROOT, "content", "dimensional_nightmare_terrain.json");
const TILES_CATALOG_PATH = path.join(ROOT, "content", "dimensional_nightmare_tiles_2x.json");
const PASSABILITY_PATH = path.join(ROOT, "content", "dimensional_nightmare_passability.json");
const BLUEPRINT_PATH = path.join(ROOT, "content", "dimensional_nightmare_maps.json");
const SHEETS_DIR = path.join(ROOT, "docs", "dn_referencia", "lotes");
const BASE_ID = 384;
const TILE = 32;
const COLUMNS = 8;
const GDD = "docs/DIMENSIONAL_NIGHTMARE";

const argv = process.argv.slice(2);
const PLAN = argv.includes("--plan");
const APPLY = argv.includes("--apply");
const VERIFY = argv.includes("--verify");
const RENDER = argv.includes("--render");
const MATERIALS = argv.includes("--materials");
const ONLY = (() => {
  const at = argv.indexOf("--only");
  return at >= 0 && argv[at + 1] ? new Set(argv[at + 1].split(",").map((s) => Number(s.trim()))) : null;
})();
const show = (message) => console.log(message);

// ---------------------------------------------------------------- terreno real
/** Etiquetas de terreno del juego (`GameData::TerrainTag`, Scripts.rxdata §116). */
const TAGS = {
  None: 0, Ledge: 1, Grass: 2, Sand: 3, Rock: 4, DeepWater: 5, StillWater: 6,
  Water: 7, Waterfall: 8, WaterfallCrest: 9, TallGrass: 10, UnderwaterGrass: 11,
  Ice: 12, Neutral: 13, SootGrass: 14, Bridge: 15, Puddle: 16, NoEffect: 17,
};
const RUSTLE_TAGS = new Set([TAGS.Grass, TAGS.TallGrass, TAGS.SootGrass]);
const LAND_ENCOUNTER_TAGS = new Set([TAGS.Grass, TAGS.TallGrass, TAGS.UnderwaterGrass, TAGS.SootGrass]);
const WATER_TAGS = new Set([TAGS.DeepWater, TAGS.StillWater, TAGS.Water, TAGS.Waterfall, TAGS.WaterfallCrest]);
/** Material → etiquetas admitidas (la primera es la que se instala sin fauna). */
const MATERIAL_TAGS = {
  Grass: [TAGS.Grass], Snow: [TAGS.Rock], Sand: [TAGS.Sand],
  Water: [TAGS.Water, TAGS.StillWater, TAGS.DeepWater], Rock: [TAGS.Rock],
};

// -------------------------------------------------- salvajes del GDD (01–06, 16–18)
/**
 * Mundos del Nightmare con su tabla de salvajes del GDD. `species[].maps` son los
 * rangos de mapa que documenta el episodio (`null` = todo el mundo); si un mapa no
 * aparece en ningún rango se usa la lista completa del mundo como reserva, de forma
 * que ninguna tabla quede vacía. `landMaps` (W7/W8/W9) limita el mundo a los mapas
 * que el documento marca con encuentros.
 */
const WORLDS = [
  {
    key: "EP01", label: "White Hand — Catacumbas", type: "Cave", range: [2041, 2056], stepChance: 5,
    doc: `${GDD}/01_EP01_WHITE_HAND.md §7`,
    species: [
      { name: "GASTLY", min: 76, max: 86, weight: 20, maps: [[2042, 2052]], note: "zonas sin antorcha" },
      { name: "HAUNTER", min: 76, max: 86, weight: 10, maps: [[2042, 2052]] },
      { name: "CUBONE", min: 78, max: 84, weight: 20, maps: [[2046, 2047]], note: "algunos con THICK CLUB" },
      { name: "MAROWAK", min: 88, max: 88, weight: 5, maps: [[2046, 2046]], note: "variante sin hueso" },
      { name: "DUSKULL", min: 80, max: 86, weight: 10, maps: [[2049, 2051]] },
      { name: "DUSCLOPS", min: 80, max: 86, weight: 10, maps: [[2049, 2051]] },
      { name: "YAMASK", min: 82, max: 88, weight: 10, maps: [[2050, 2053]] },
      { name: "COFAGRIGUS", min: 82, max: 88, weight: 5, maps: [[2050, 2053]] },
      { name: "GOLETT", min: 84, max: 90, weight: 5, maps: [[2048, 2048], [2053, 2053]] },
      { name: "GOLURK", min: 84, max: 90, weight: 4, maps: [[2048, 2048], [2053, 2053]] },
      { name: "SPIRITOMB", min: 92, max: 92, weight: 1, maps: [[2056, 2056]], note: "1 %" },
    ],
  },
  {
    key: "EP02", label: "Lost Silver — pueblo sepia", type: "Land", range: [2057, 2072], stepChance: 21,
    doc: `${GDD}/02_EP02_LOST_SILVER.md §7`,
    species: [
      { name: "HOOTHOOT", min: 80, max: 86, weight: 18, maps: [[2061, 2061]] },
      { name: "NOCTOWL", min: 80, max: 86, weight: 8, maps: [[2061, 2061]] },
      { name: "MISDREAVUS", min: 80, max: 88, weight: 15, maps: [[2066, 2068]] },
      { name: "MISMAGIUS", min: 80, max: 88, weight: 6, maps: [[2066, 2068]] },
      { name: "HOUNDOUR", min: 82, max: 88, weight: 12, maps: [[2068, 2068]] },
      { name: "HOUNDOOM", min: 82, max: 88, weight: 5, maps: [[2068, 2068]] },
      { name: "SHUPPET", min: 82, max: 88, weight: 12, maps: [[2069, 2069]] },
      { name: "BANETTE", min: 82, max: 88, weight: 5, maps: [[2069, 2069]] },
      { name: "DUSKULL", min: 84, max: 90, weight: 8, maps: [[2070, 2072]] },
      { name: "DUSCLOPS", min: 84, max: 90, weight: 5, maps: [[2070, 2072]] },
      { name: "MAROWAK", min: 88, max: 88, weight: 5, maps: [[2066, 2066]], note: "5 %" },
      { name: "ABSOL", min: 92, max: 92, weight: 1, maps: [[2057, 2057]], note: "1 %, amanecer" },
    ],
  },
  {
    key: "EP03", label: "Snow on Mt. Silver — nieve", type: "Land", range: [2073, 2087], stepChance: 21,
    doc: `${GDD}/03_EP03_SNOW_ON_MT_SILVER.md §7`,
    species: [
      { name: "SNOVER", min: 80, max: 88, weight: 14, maps: [[2073, 2075]] },
      { name: "ABOMASNOW", min: 80, max: 88, weight: 6, maps: [[2073, 2075]] },
      { name: "SNORUNT", min: 80, max: 88, weight: 14, maps: [[2077, 2082]] },
      { name: "GLALIE", min: 80, max: 88, weight: 6, maps: [[2077, 2082]] },
      { name: "SNEASEL", min: 82, max: 90, weight: 10, maps: [[2079, 2084]] },
      { name: "WEAVILE", min: 82, max: 90, weight: 4, maps: [[2079, 2084]] },
      { name: "SWINUB", min: 78, max: 90, weight: 12, maps: [[2076, 2081]] },
      { name: "PILOSWINE", min: 78, max: 90, weight: 6, maps: [[2076, 2081]] },
      { name: "MAMOSWINE", min: 78, max: 90, weight: 4, maps: [[2076, 2081]] },
      { name: "VANILLITE", min: 80, max: 90, weight: 10, maps: [[2080, 2085]] },
      { name: "VANILLISH", min: 80, max: 90, weight: 6, maps: [[2080, 2085]] },
      { name: "VANILLUXE", min: 80, max: 90, weight: 4, maps: [[2080, 2085]] },
      { name: "FROSLASS", min: 92, max: 92, weight: 3, maps: [[2085, 2087]], note: "3 %" },
      { name: "LAPRAS", min: 95, max: 95, weight: 1, maps: [[2077, 2077]], note: "1 %" },
    ],
  },
  {
    key: "EP04", label: "Hypno's Lullaby — bosque dormido", type: "Land", range: [2088, 2103], stepChance: 21,
    doc: `${GDD}/04_EP04_HYPNOS_LULLABY.md §7`,
    species: [
      { name: "DROWZEE", min: 82, max: 92, weight: 16, maps: null, note: "todo el bosque" },
      { name: "HYPNO", min: 82, max: 92, weight: 6, maps: null },
      { name: "MUNNA", min: 82, max: 90, weight: 10, maps: [[2094, 2098]] },
      { name: "MUSHARNA", min: 82, max: 90, weight: 5, maps: [[2094, 2098]] },
      { name: "ODDISH", min: 78, max: 86, weight: 14, maps: [[2088, 2093]] },
      { name: "GLOOM", min: 78, max: 86, weight: 6, maps: [[2088, 2093]] },
      { name: "SHROOMISH", min: 82, max: 88, weight: 10, maps: [[2097, 2101]] },
      { name: "BRELOOM", min: 82, max: 88, weight: 5, maps: [[2097, 2101]] },
      { name: "ZUBAT", min: 78, max: 86, weight: 8, maps: [[2096, 2096]] },
      { name: "GOLBAT", min: 78, max: 86, weight: 5, maps: [[2096, 2096]] },
      { name: "SPINARAK", min: 80, max: 88, weight: 8, maps: [[2099, 2101]] },
      { name: "ARIADOS", min: 80, max: 88, weight: 5, maps: [[2099, 2101]] },
      { name: "DROWZEE", min: 95, max: 95, weight: 2, maps: [[2095, 2095]], note: "variante, 2 %, CHESTO BERRY" },
    ],
  },
  {
    key: "EP05", label: "Pokémon Black — la ausencia", type: "Land", range: [2104, 2119], stepChance: 21,
    doc: `${GDD}/05_EP05_POKEMON_BLACK.md §7`,
    species: [
      { name: "PORYGON", min: 84, max: 94, weight: 18, maps: [[2104, 2117]] },
      { name: "PORYGON2", min: 84, max: 94, weight: 8, maps: [[2104, 2117]] },
      { name: "PORYGONZ", min: 84, max: 94, weight: 4, maps: [[2104, 2117]] },
      { name: "DITTO", min: 88, max: 88, weight: 14, maps: null, note: "todo el episodio" },
      { name: "SHUPPET", min: 84, max: 92, weight: 14, maps: [[2105, 2114]] },
      { name: "ROTOM", min: 90, max: 90, weight: 2, maps: [[2115, 2115]], note: "2 %, salvaje" },
      { name: "UNOWN", min: 88, max: 95, weight: 40, maps: [[2118, 2119]], note: "sustituye al MISSINGNO inexistente" },
    ],
  },
  {
    key: "EP06", label: "King Unown — Atrio de las Letras", type: "Cave", range: [2120, 2135], stepChance: 5,
    doc: `${GDD}/06_EP06_KING_UNOWN.md §7`,
    species: [
      { name: "UNOWN", min: 88, max: 96, weight: 22, maps: null, note: "letras A–Z, ? y !" },
      { name: "NATU", min: 84, max: 92, weight: 10, maps: [[2120, 2127]] },
      { name: "XATU", min: 84, max: 92, weight: 8, maps: [[2120, 2127]] },
      { name: "BRONZOR", min: 86, max: 94, weight: 10, maps: [[2122, 2133]] },
      { name: "BRONZONG", min: 86, max: 94, weight: 6, maps: [[2122, 2133]] },
      { name: "GOTHITA", min: 84, max: 92, weight: 10, maps: [[2124, 2130]] },
      { name: "GOTHORITA", min: 84, max: 92, weight: 6, maps: [[2124, 2130]] },
      { name: "GOTHITELLE", min: 84, max: 92, weight: 4, maps: [[2124, 2130]] },
      { name: "BALTOY", min: 86, max: 92, weight: 10, maps: [[2128, 2131]] },
      { name: "CLAYDOL", min: 86, max: 92, weight: 6, maps: [[2128, 2131]] },
      { name: "SIGILYPH", min: 90, max: 90, weight: 4, maps: [[2131, 2133]], note: "4 %" },
      { name: "ELGYEM", min: 90, max: 90, weight: 3, maps: [[2129, 2129]], note: "3 %" },
    ],
  },
  {
    key: "W7", label: "Strangled Red", type: "Land", range: [2143, 2158], stepChance: 21,
    doc: `${GDD}/16_W7_STRANGLED_RED.md`, landMaps: [2145, 2147, 2150, 2154],
    species: [
      { name: "POOCHYENA", min: 96, max: 102, weight: 20, maps: null },
      { name: "HOUNDOUR", min: 96, max: 104, weight: 20, maps: null },
      { name: "MIGHTYENA", min: 100, max: 104, weight: 15, maps: null },
      { name: "SPINARAK", min: 96, max: 102, weight: 15, maps: null },
      { name: "ARIADOS", min: 100, max: 104, weight: 15, maps: null },
      { name: "MURKROW", min: 98, max: 104, weight: 15, maps: null },
    ],
  },
  {
    key: "W8", label: "Buried Alive", type: "Land", range: [2159, 2174], stepChance: 21,
    doc: `${GDD}/17_W8_BURIED_ALIVE.md`, landMaps: [2163, 2167, 2168, 2171],
    species: [
      { name: "DUGTRIO", min: 98, max: 106, weight: 20, maps: null },
      { name: "SANDSHREW", min: 98, max: 104, weight: 20, maps: null },
      { name: "SANDSLASH", min: 102, max: 106, weight: 14, maps: null },
      { name: "TRAPINCH", min: 98, max: 104, weight: 16, maps: null },
      { name: "VIBRAVA", min: 100, max: 106, weight: 16, maps: null },
      { name: "GASTLY", min: 98, max: 104, weight: 14, maps: null },
    ],
  },
  {
    key: "W9", label: "Lavender Syndrome", type: "Land", range: [2175, 2190], stepChance: 21,
    doc: `${GDD}/18_W9_LAVENDER_SYNDROME.md`, landMaps: [2180, 2181, 2185, 2186],
    species: [
      { name: "GASTLY", min: 100, max: 108, weight: 20, maps: null },
      { name: "HAUNTER", min: 100, max: 108, weight: 16, maps: null },
      { name: "MISDREAVUS", min: 100, max: 108, weight: 16, maps: null },
      { name: "MISMAGIUS", min: 100, max: 108, weight: 14, maps: null },
      { name: "DROWZEE", min: 100, max: 108, weight: 18, maps: null },
      { name: "HYPNO", min: 100, max: 108, weight: 16, maps: null },
    ],
  },
];
const WORLD_BY_KEY = new Map(WORLDS.map((world) => [world.key, world]));
/** El episodio de cada mapa manda; W7/W8/W9 sólo cuentan en los mapas con encuentros. */
function worldOfMap(map) {
  const world = WORLD_BY_KEY.get(map.episode);
  if (!world) return null;
  if (!world.landMaps) return world;
  return world.landMaps.includes(map.id) ? world : null;
}
/** Especies que el GDD pone en este mapa (o la lista completa del mundo como reserva). */
function speciesForMap(world, mapId) {
  const direct = world.species.filter((entry) => !entry.maps || entry.maps.some(([from, to]) => mapId >= from && mapId <= to));
  return direct.length ? direct : world.species;
}
function slotsForMap(world, mapId) {
  return speciesForMap(world, mapId).map(({ name, min, max, weight }) => ({ weight, species: name, min, max }));
}

// ------------------------------------------------------------------ catálogos
const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, "utf8"));
const tilesCatalog = JSON.parse(fs.readFileSync(TILES_CATALOG_PATH, "utf8"));
const passability = JSON.parse(fs.readFileSync(PASSABILITY_PATH, "utf8"));
const groupByKey = new Map(tilesCatalog.groups.map((group) => [group.key, group]));
const readData = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const rawTilesets = readData("Tilesets.rxdata");
const tilesetsById = new Map();
for (let i = 1; i < rawTilesets.length; i++) {
  if (!rawTilesets[i]) continue;
  const parsed = parseTileset(rawTilesets[i]);
  tilesetsById.set(parsed.id, parsed);
}
const speciesIds = new Set(readData("species.dat").pairs.map(([key]) => key.name ?? String(key)));

/** Usuarios de cada tileset dentro del rango del Nightmare (para el informe de clones). */
const cloneUsers = new Map();
for (let id = 2020; id <= 2195; id++) {
  const file = path.join(DATA, mapFile(id));
  if (!fs.existsSync(file)) continue;
  const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
  const tileset = tilesetsById.get(parsed.tilesetId);
  if (!tileset) continue;
  cloneUsers.set(tileset.tilesetName, [...(cloneUsers.get(tileset.tilesetName) ?? []), id]);
}

// ------------------------------------------------------------------ selección
const selectedMaps = blueprint.maps.filter((map) => {
  if (!map.primary) return false;
  if (ONLY && !ONLY.has(map.id)) return false;
  return fs.existsSync(path.join(DATA, mapFile(map.id)));
});

// ------------------------------------------------------------------ clasificar
const contextCache = new Map();
async function contextOf(group) {
  if (!contextCache.has(group.key)) {
    const image = await loadImage(path.join(ROOT, group.tileset));
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    contextCache.set(group.key, context);
  }
  return contextCache.get(group.key);
}
/**
 * Huella del bloque: media del cuartil más claro (relleno del material) y del más
 * oscuro (contorno), más la cobertura. Se lee del tileset a color del grupo porque
 * el PNG del juego está cuantizado a la paleta Game Boy verde y ahí hierba, agua,
 * arena y nieve comparten los mismos cuatro tonos.
 */
function blockFeatures(context, block) {
  const x0 = (block % COLUMNS) * TILE, y0 = Math.floor(block / COLUMNS) * TILE;
  const data = context.getImageData(x0, y0, TILE, TILE).data;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (!pixels.length) return null;
  const lum = (p) => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
  pixels.sort((a, b) => lum(a) - lum(b));
  const average = (list) => list.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]).map((v) => v / list.length);
  const high = average(pixels.slice(Math.floor(pixels.length * 0.75)));
  const low = average(pixels.slice(0, Math.max(1, Math.floor(pixels.length * 0.25))));
  return {
    high: high.map(Math.round), low: low.map(Math.round), L: Math.round(lum(high)),
    sat: Math.round(Math.max(...high) - Math.min(...high)),
    blue: Math.round(high[2] - high[0]), blueGap: Math.round(high[2] - high[1]),
    green: Math.round(high[1] - high[0]), greenGap: Math.round(high[1] - high[2]),
    warm: Math.round(high[0] - high[2]), coverage: Math.round(pixels.length / (TILE * TILE) * 100),
  };
}
/**
 * Material del bloque. Umbrales calibrados contra los centroides reales del juego
 * base (Monte Silver nevado rgb(245,245,242) con tag 4; agua rgb(108,156,204) con
 * tag 6; hierba rgb(78,160,99) con tag 2; arena rgb(225,221,137) con tag 3).
 */
function materialOf(features) {
  if (!features) return "Void";
  if (features.L >= 168 && features.sat <= 62) return "Snow";
  if (features.blue >= 24 && features.blueGap >= 10 && features.green >= 6) return "Water";
  if (features.green >= 8 && features.greenGap >= 8) return "Grass";
  if (features.warm >= 20 && features.L >= 105 && features.sat <= 95) return "Sand";
  return "Rock";
}
/** Agua oscura (profunda), agua pálida (quieta, con reflejos) o agua corriente. */
function waterKindOf(block) {
  if (block.material !== "Water" || !block.features) return "shallow";
  if (block.features.L < 120) return "deep";
  if (block.features.sat <= 62) return "still";
  return "shallow";
}
function rectCellsIn(rect, width, height) {
  const [x0, y0, x1, y1] = rect;
  const cells = new Set();
  for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) cells.add(`${x},${y}`);
  }
  return cells;
}
function walkableGrid(mapId, width, height) {
  const entry = passability.maps?.[String(mapId)];
  if (!entry) return null;
  const open = new Set(entry.open ?? []);
  const blocked = new Set([...(entry.computed ?? []), ...(entry.blocked ?? [])]);
  for (const rect of entry.openRects ?? []) for (const cell of rectCellsIn(rect, width, height)) { open.add(cell); blocked.delete(cell); }
  for (const rect of entry.blockRects ?? []) for (const cell of rectCellsIn(rect, width, height)) { blocked.add(cell); open.delete(cell); }
  return (x, y) => open.has(`${x},${y}`) || !blocked.has(`${x},${y}`);
}
/** Etiqueta que se instala para un material dentro de un mapa concreto. */
function tagFor(info, material, waterKind, walk) {
  if (material === "Void") return TAGS.None;
  if (material === "Water") {
    if (waterKind === "deep") return TAGS.DeepWater;   // agua oscura: como el agua profunda del juego base
    if (waterKind === "still") return TAGS.StillWater; // agua pálida/helada: reflejos, como el agua quieta del juego base
    return TAGS.Water;
  }
  if (info.landEncounter && walk > 0) return TAGS.Grass;  // suelo pisable de un mundo de exterior: crujido + encuentros
  return MATERIAL_TAGS[material][0];           // hierba 2 · arena 3 · nieve 4 (Monte Silver) · piedra 4
}

async function analyze() {
  const maps = {};
  for (const map of selectedMaps) {
    const group = groupByKey.get(map.primary.key);
    const base = path.basename(map.primary.slice);
    const catalogMap = group?.maps.find((entry) => path.basename(entry.slice) === base);
    if (!catalogMap) throw new Error(`Map${map.id}: la ficha ${map.primary.slice} no está en el catálogo ×2`);
    const parsed = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, mapFile(map.id)))));
    const tileset = tilesetsById.get(parsed.tilesetId);
    if (!tileset) throw new Error(`Map${map.id}: tileset ${parsed.tilesetId} inexistente`);
    const context = await contextOf(group);
    const order = [];
    const seen = new Map();
    for (const row of catalogMap.matrix) {
      for (const value of row) if (!seen.has(value)) { seen.set(value, order.length); order.push(value); }
    }
    const walk = walkableGrid(map.id, parsed.width, parsed.height);
    const counters = new Map();
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) {
        const tile = tableGet(parsed.table, x, y, 0);
        if (!tile) continue;
        const block = tile - BASE_ID;
        if (order[block] === undefined) continue;      // variantes de la limpieza de rótulos
        const current = counters.get(block) ?? { block, original: order[block], walk: 0, blocked: 0 };
        if (walk && !walk(x, y)) current.blocked++; else current.walk++;
        counters.set(block, current);
      }
    }
    const world = worldOfMap(map);
    const blocks = [];
    for (const current of counters.values()) {
      const features = blockFeatures(context, current.original);
      blocks.push({ ...current, material: materialOf(features), features });
    }
    const soilCells = new Map();
    for (const block of blocks) {
      if (block.material === "Water" || block.material === "Void") continue;
      soilCells.set(block.material, (soilCells.get(block.material) ?? 0) + block.walk);
    }
    const dominantSoil = [...soilCells.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Rock";
    const info = {
      id: map.id, episode: map.episode, group: group.key, title: map.title,
      tilesetId: parsed.tilesetId, tileset: tileset.tilesetName,
      landEncounter: Boolean(world && world.type === "Land"),
      caveEncounter: Boolean(world && world.type === "Cave"),
      world: world?.key ?? null, dominantSoil,
      walkableCells: blocks.reduce((sum, block) => sum + block.walk, 0),
    };
    info.blocks = blocks.map((block) => ({
      block: block.block, original: block.original, material: block.material,
      walk: block.walk, blocked: block.blocked, features: block.features,
      tag: tagFor(info, block.material, waterKindOf(block), block.walk),
    }));
    if (world) info.encounter = { type: world.type, stepChance: world.stepChance, slots: slotsForMap(world, map.id) };
    maps[map.id] = info;
  }
  return maps;
}

/** Clones Game Boy del rango: etiquetas heredadas de su origen (informe del catálogo). */
function inspectClones() {
  const raw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  return cloneReport(raw).clones;
}
function buildCatalog(maps, extras = {}) {
  const worlds = WORLDS.map((world) => ({
    key: world.key, label: world.label, type: world.type, range: world.range,
    doc: world.doc, stepChance: world.stepChance, landMaps: world.landMaps ?? null,
    maps: Object.values(maps).filter((info) => info.world === world.key).map((info) => info.id).sort((a, b) => a - b),
    species: world.species.map(({ name, min, max, weight, maps: ranges, note }) => ({ species: name, min, max, weight, maps: ranges ?? "todo el mundo", ...(note ? { note } : {}) })),
  }));
  const materialTally = {};
  for (const info of Object.values(maps)) {
    materialTally[info.episode] ??= {};
    for (const block of info.blocks) {
      if (!block.walk) continue;
      materialTally[info.episode][block.material] = (materialTally[info.episode][block.material] ?? 0) + block.walk;
    }
  }
  return {
    generatedBy: "tools/dn_terrain_tags.mjs",
    how: "material por color del bloque a color (×2) en las celdas transitables · material → etiqueta de terreno del juego · tablas de salvajes del GDD",
    rules: {
      materials: {
        Water: "azul del relleno: b-r ≥ 24, b-g ≥ 10 y g-r ≥ 6",
        Grass: "verde del relleno: g-r ≥ 8 y g-b ≥ 8",
        Snow: "claro y poco saturado: L ≥ 168 y saturación ≤ 62",
        Sand: "cálido claro: r-b ≥ 20, L ≥ 105, saturación ≤ 95",
        Rock: "resto (piedra, gris, oscuro)",
      },
      materialsToTags: {
        Grass: [TAGS.Grass], Snow: [TAGS.Rock], Sand: [TAGS.Sand],
        Water: [TAGS.Water, TAGS.StillWater, TAGS.DeepWater], Rock: [TAGS.Rock],
      },
      notes: [
        "En los mundos de exterior (Land) todo el suelo pisable que no es agua recibe :Grass: es la única etiqueta que da crujido y encuentros a la vez, así que hierba, arena y nieve se comportan como terreno.",
        "En los mundos de cueva (EP01 Catacumbas, EP06 Atrio) el suelo conserva su material: los encuentros son de tipo Cave y no dependen de la etiqueta.",
        "La nieve de un mapa sin fauna recibe :Rock, igual que el suelo nevado del Monte Silver del juego base (Map2021/2022, tag 4).",
        "El agua recibe :Water (o :DeepWater si el bloque es oscuro): reflejos, pesca y ambiente de agua, como el agua del juego base.",
      ],
      engine_findings: [
        "116_TerrainTag.rb registra TODAS las etiquetas de agua con :can_surf => false (también en el juego base): el surf y los encuentros de agua no son alcanzables en esta entrega.",
        "Con tag :None el motor no reconoce ni hierba ni agua, y ninguna tabla Land se dispara: era la causa del hallazgo de esta fase.",
        "Un mapa de cueva con tabla Cave dispara encuentros en cualquier celda; en un mapa Land sólo en celdas con :Grass/:TallGrass/:SootGrass/:UnderwaterGrass.",
      ],
    },
    tags: TAGS,
    rustleTags: [...RUSTLE_TAGS],
    landEncounterTags: [...LAND_ENCOUNTER_TAGS],
    waterTags: [...WATER_TAGS],
    materialTally,
    codebook: {
      "maps[].blocks[]": ["bloque (id − 384 en el tileset)", "material clasificado", "etiqueta de terreno instalada", "celdas pisables", "celdas bloqueadas"],
      "maps[].encounter": "tabla de salvajes instalada en encounters.dat (tipo, step_chance y ranuras)",
    },
    clones: extras.clones ?? [],
    audit: extras.audit ?? {},
    worlds,
    maps: Object.fromEntries(Object.entries(maps).map(([id, info]) => [id, {
      episode: info.episode, group: info.group, tileset: info.tileset, title: info.title,
      landEncounter: info.landEncounter, caveEncounter: info.caveEncounter, world: info.world,
      dominantSoil: info.dominantSoil, walkableCells: info.walkableCells,
      encounter: info.encounter ?? null,
      materials: Object.fromEntries([...new Set(info.blocks.filter((b) => b.walk).map((b) => b.material))].map((material) => [
        material,
        info.blocks.filter((b) => b.walk && b.material === material).reduce((sum, b) => sum + b.walk, 0),
      ])),
      // columnas: [bloque, material, etiqueta de terreno, celdas pisables, celdas bloqueadas]
      blocks: info.blocks.map((block) => [block.block, block.material, block.tag, block.walk, block.blocked]),
    }])),
    measurements: {
      maps: Object.keys(maps).length,
      landMaps: Object.values(maps).filter((info) => info.landEncounter).length,
      caveMaps: Object.values(maps).filter((info) => info.caveEncounter).length,
      grassCells: Object.values(maps).reduce((sum, info) => sum + info.blocks.filter((b) => b.tag === TAGS.Grass).reduce((s, b) => s + b.walk, 0), 0),
      waterCells: Object.values(maps).reduce((sum, info) => sum + info.blocks.filter((b) => WATER_TAGS.has(b.tag)).reduce((s, b) => s + b.walk, 0), 0),
      sandCells: Object.values(maps).reduce((sum, info) => sum + info.blocks.filter((b) => b.tag === TAGS.Sand).reduce((s, b) => s + b.walk, 0), 0),
      rockCells: Object.values(maps).reduce((sum, info) => sum + info.blocks.filter((b) => b.tag === TAGS.Rock).reduce((s, b) => s + b.walk, 0), 0),
    },
  };
}

// ----------------------------------------------------------------- instalación
function backupOnce(source, destination) {
  if (fs.existsSync(destination)) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
/**
 * Los clones Game Boy (`DN_GB_TS<origen>`) son copias de un tileset del juego con
 * la paleta aplicada; tienen que heredar su `@terrain_tags` para que la hierba, el
 * agua, la arena y la nieve se comporten igual que en su tileset de origen.
 */
function cloneReport(raw) {
  const byId = new Map(), byName = new Map();
  for (let i = 1; i < raw.length; i++) {
    if (!raw[i]) continue;
    const parsed = parseTileset(raw[i]);
    byId.set(i, { raw: raw[i], parsed });
    byName.set(parsed.tilesetName, { raw: raw[i], parsed });
  }
  const clones = [];
  for (const [id, entry] of byId) {
    const match = /^DN_GB_TS(\d+)$/.exec(entry.parsed.tilesetName);
    if (!match) continue;
    const origin = byId.get(Number(match[1]));
    if (!origin) continue;
    const clone = new Uint16Array(entry.parsed.terrain.data);
    const source = new Uint16Array(origin.parsed.terrain.data);
    let fixed = 0;
    for (let k = 0; k < source.length; k++) {
      if (clone[k] === source[k]) continue;
      fixed++;
    }
    if (fixed) {
      entry.raw.setIvar("terrain_tags", tableToUserDef({ dim: 1, x: source.length, y: 1, z: 1, data: source }));
    }
    clones.push({
      id, name: entry.parsed.tilesetName, origin: Number(match[1]), originName: origin.parsed.tilesetName,
      tags: source.filter((value) => value !== 0).length, restored: fixed,
      users: [...(cloneUsers.get(entry.parsed.tilesetName) ?? [])].sort((a, b) => a - b),
    });
  }
  return { byName, clones };
}
function writeTilesets(maps) {
  const file = path.join(DATA, "Tilesets.rxdata");
  backupOnce(file, path.join(BACKUP, "Tilesets.rxdata"));
  const raw = marshalLoad(fs.readFileSync(file));
  const { byName, clones } = cloneReport(raw);
  let tilesets = 0, blocks = 0;
  for (const info of Object.values(maps)) {
    const entry = byName.get(info.tileset);
    if (!entry) throw new Error(`Map${info.id}: el tileset ${info.tileset} no está en Tilesets.rxdata`);
    const table = new Uint16Array(entry.parsed.terrain.data);
    for (const block of info.blocks) {
      const id = BASE_ID + block.block;
      if (id >= table.length) throw new Error(`Map${info.id}: el bloque ${block.block} queda fuera de ${info.tileset}`);
      if (table[id] === block.tag) continue;
      table[id] = block.tag;
      blocks++;
    }
    entry.raw.setIvar("terrain_tags", tableToUserDef({ dim: 1, x: table.length, y: 1, z: 1, data: table }));
    tilesets++;
  }
  fs.writeFileSync(file, Buffer.from(marshalDump(raw)));
  show(`Tilesets.rxdata: ${tilesets} tilesets DN, ${blocks} etiquetas de terreno escritas`);
  for (const clone of clones) {
    show(`  clon ${clone.name} ← ${clone.originName}: ${clone.tags} etiquetas heredadas de su origen${clone.restored ? `, ${clone.restored} restauradas` : " (ya coincidía)"}`);
  }
  return clones;
}
function encounterObject(world, mapId) {
  return new RObject("GameData::Encounter", [
    ["@id", new RSymbol(`${mapId}_0`)], ["@map", mapId], ["@version", 0],
    ["@step_chances", new RHash([[new RSymbol(world.type), world.stepChance]])],
    ["@types", new RHash([[new RSymbol(world.type), world.slots.map(({ weight, species, min, max }) => [weight, new RSymbol(species), min, max])]])],
  ]);
}
function writeEncounters(maps) {
  const file = path.join(DATA, "encounters.dat");
  backupOnce(file, path.join(BACKUP, "encounters.dat"));
  const data = marshalLoad(fs.readFileSync(file));
  const wanted = new Map();
  for (const info of Object.values(maps)) {
    if (!info.encounter) continue;
    const world = WORLD_BY_KEY.get(info.world);
    wanted.set(`${info.id}_0`, encounterObject({ ...world, slots: info.encounter.slots }, info.id));
  }
  // El rango del Nightmare queda con exactamente las tablas del catálogo.
  data.pairs = data.pairs.filter(([key]) => {
    const name = String(key.name ?? key);
    const id = Number(name.split("_")[0]);
    if (wanted.has(name)) return false;
    if (id >= 2040 && id <= 2190) return false;
    return true;
  });
  for (const [key, value] of wanted) data.pairs.push([new RSymbol(key), value]);
  data.pairs.sort(([a], [b]) => Number(String(a.name ?? a).split("_")[0]) - Number(String(b.name ?? b).split("_")[0]));
  fs.writeFileSync(file, Buffer.from(marshalDump(data)));
  show(`encounters.dat: ${wanted.size} tablas de salvajes instaladas (2040–2190 sin tablas ajenas)`);
}

// ---------------------------------------------------------------- verificación
/** Tilesets leídos del disco en el momento de verificar (tras `--apply` no vale la caché). */
function liveTilesets() {
  const raw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const byName = new Map();
  const byId = new Map();
  for (let i = 1; i < raw.length; i++) {
    if (!raw[i]) continue;
    const parsed = parseTileset(raw[i]);
    byName.set(parsed.tilesetName, parsed);
    byId.set(i, parsed);
  }
  return { byName, byId };
}
/**
 * Tablas de salvajes del rango 2021–2195 que no cubre el catálogo del Nightmare:
 * cuenta, mapa a mapa, las celdas transitables que pueden disparar cada tipo de
 * encuentro (una tabla Land necesita una etiqueta de hierba; Cave dispara en
 * cualquier celda; Water exige surf, que el motor tiene desactivado).
 */
function rangeTables(maps = {}) {
  const { byId } = liveTilesets();
  const encounters = readData("encounters.dat");
  const rows = [];
  for (const [key, entry] of encounters.pairs) {
    const id = Number(String(key.name ?? key).split("_")[0]);
    if (id < 2021 || id > 2195 || maps[id]?.encounter) continue;
    const file = path.join(DATA, mapFile(id));
    if (!fs.existsSync(file)) continue;
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    const tileset = byId.get(parsed.tilesetId);
    if (!tileset) continue;
    const types = (entry.getIvar("@types")?.pairs ?? []).map(([key]) => key.name);
    let land = 0, water = 0, other = 0;
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) {
        const tile = tableGet(parsed.table, x, y, 0);
        if ((tileset.passages ? tileset.passages.data[tile] : 0) & 0x0f) continue;
        const tag = tileset.terrain ? tileset.terrain.data[tile] : 0;
        if (LAND_ENCOUNTER_TAGS.has(tag)) land++;
        else if (WATER_TAGS.has(tag)) water++;
        else other++;
      }
    }
    rows.push({ map: id, tileset: tileset.tilesetName, types, landCells: land, waterCells: water, otherCells: other });
  }
  return rows.sort((a, b) => a.map - b.map);
}
function readScript(name) {
  const data = marshalLoad(fs.readFileSync(path.join(DATA, "Scripts.rxdata")));
  const section = data.find((entry) => String(entry?.[1]?.text ?? entry?.[1]) === name);
  if (!section?.[2]?.bytes) return null;
  return import("node:zlib").then((zlib) => zlib.inflateSync(Buffer.from(section[2].bytes)).toString("utf8"));
}
async function verify(maps) {
  const errors = [];
  const notes = [];
  const { byName: tilesetByName, byId: tilesetById } = liveTilesets();

  // 1) etiquetas instaladas
  for (const info of Object.values(maps)) {
    const tileset = tilesetByName.get(info.tileset);
    if (!tileset) { errors.push(`Map${info.id}: falta el tileset ${info.tileset}`); continue; }
    for (const block of info.blocks) {
      const tag = tileset.terrain ? tileset.terrain.data[BASE_ID + block.block] : 0;
      if (tag !== block.tag) errors.push(`Map${info.id}: bloque ${block.block} (${block.material}) tiene tag ${tag}, se esperaba ${block.tag}`);
    }
  }

  // 2) material ↔ etiqueta y coherencia con el comportamiento esperado
  for (const info of Object.values(maps)) {
    for (const block of info.blocks.filter((b) => b.walk)) {
      const allowed = MATERIAL_TAGS[block.material] ?? [TAGS.None];
      const ok = allowed.includes(block.tag) || (info.landEncounter && block.material !== "Water" && block.tag === TAGS.Grass);
      if (!ok) errors.push(`Map${info.id}: material ${block.material} con etiqueta ${block.tag} en una celda pisable`);
    }
    if (info.landEncounter) {
      const grass = info.blocks.filter((b) => b.walk && b.tag === TAGS.Grass).reduce((sum, b) => sum + b.walk, 0);
      if (!grass) errors.push(`Map${info.id}: mundo Land sin ninguna celda pisable con :Grass (no habría crujido ni encuentros)`);
      const rustled = info.blocks.filter((b) => b.walk && RUSTLE_TAGS.has(b.tag)).reduce((sum, b) => sum + b.walk, 0);
      if (!rustled) errors.push(`Map${info.id}: ninguna celda pisable con animación de crujido`);
    }
  }

  // 3) tablas de encuentros == plan del GDD
  const encounters = readData("encounters.dat");
  const byKey = new Map(encounters.pairs.map(([key, value]) => [String(key.name ?? key), value]));
  let tables = 0;
  for (const info of Object.values(maps)) {
    if (!info.encounter) {
      if (byKey.has(`${info.id}_0`)) errors.push(`Map${info.id}: no debería tener tabla de salvajes`);
      continue;
    }
    const entry = byKey.get(`${info.id}_0`);
    if (!entry) { errors.push(`Map${info.id}: falta la tabla ${info.encounter.type} del GDD`); continue; }
    tables++;
    const steps = entry.getIvar("@step_chances")?.pairs?.find(([key]) => key.name === info.encounter.type)?.[1];
    if (steps !== info.encounter.stepChance) errors.push(`Map${info.id}: step_chance ${steps} ≠ ${info.encounter.stepChance}`);
    const stored = (entry.getIvar("@types")?.pairs?.find(([key]) => key.name === info.encounter.type)?.[1] ?? [])
      .map(([weight, species, min, max]) => ({ weight, species: String(species.name ?? species), min, max }));
    const plan = info.encounter.slots;
    const key = (slot) => `${slot.species}|${slot.weight}|${slot.min}|${slot.max}`;
    const storedKeys = stored.map(key).sort();
    const planKeys = plan.map(key).sort();
    if (JSON.stringify(storedKeys) !== JSON.stringify(planKeys)) {
      errors.push(`Map${info.id}: la tabla instalada no coincide con el GDD (${storedKeys.length} vs ${planKeys.length} ranuras)`);
    }
    for (const slot of stored) {
      if (!speciesIds.has(slot.species)) errors.push(`Map${info.id}: especie inexistente ${slot.species}`);
      if (!(slot.weight > 0)) errors.push(`Map${info.id}: peso inválido en ${slot.species}`);
      if (!(slot.min >= 1 && slot.max >= slot.min && slot.max <= 175)) errors.push(`Map${info.id}: niveles inválidos en ${slot.species} (${slot.min}-${slot.max})`);
    }
    if (info.landEncounter && info.encounter.type !== "Land") errors.push(`Map${info.id}: mundo de exterior con tabla ${info.encounter.type}`);
  }
  for (const [name] of byKey) {
    const id = Number(name.split("_")[0]);
    if (id > 2040 && id < 2190 && maps[id] && !maps[id].encounter) errors.push(`Map${id}: tabla de salvajes ajena al catálogo`);
  }
  const levels = Object.values(maps).flatMap((info) => (info.encounter?.slots ?? []).map((slot) => slot.max));
  notes.push(`${tables} tablas de salvajes del GDD · nivel máximo ${Math.max(0, ...levels)} (tope del proyecto 150)`);

  // 4) crujido: etiqueta → animación real del juego
  const terrainScript = await readScript("TerrainTag");
  if (!terrainScript) errors.push("no se pudo leer la sección TerrainTag de Scripts.rxdata");
  else {
    if (!/:id\s*=>\s*:Grass,[\s\S]{0,200}?:shows_grass_rustle\s*=>\s*true/.test(terrainScript)) errors.push(":Grass no define shows_grass_rustle");
    if (!/:id\s*=>\s*:Grass,[\s\S]{0,200}?:land_wild_encounters\s*=>\s*true/.test(terrainScript)) errors.push(":Grass no activa land_wild_encounters");
    for (const tag of RUSTLE_TAGS) notes.push(`tag ${tag} con crujido declarado en TerrainTag`);
  }
  const overworldScript = await readScript("Overworld");
  if (!overworldScript) errors.push("no se pudo leer la sección Overworld de Scripts.rxdata");
  else if (!/shows_grass_rustle[\s\S]{0,160}GRASS_ANIMATION_ID/.test(overworldScript)) errors.push("Overworld no dibuja GRASS_ANIMATION_ID al pisar hierba");
  const settingsScript = await readScript("Settings");
  const animationId = Number(/GRASS_ANIMATION_ID\s*=\s*(\d+)/.exec(settingsScript ?? "")?.[1] ?? 0);
  if (!animationId) errors.push("Settings::GRASS_ANIMATION_ID no está definido");
  else {
    const animations = readData("Animations.rxdata");
    if (!animations[animationId]) errors.push(`la animación de crujido ${animationId} no existe en Animations.rxdata`);
    else notes.push(`animación de crujido ${animationId} «${animations[animationId].getIvar("@name")?.text ?? ""}» presente en Animations.rxdata`);
  }

  // 5) los clones Game Boy heredan las etiquetas de su tileset de origen
  for (const [id, tileset] of tilesetById) {
    const match = /^DN_GB_TS(\d+)$/.exec(tileset.tilesetName);
    if (!match) continue;
    const origin = tilesetById.get(Number(match[1]));
    if (!origin) { errors.push(`${tileset.tilesetName}: no existe su tileset de origen ${match[1]}`); continue; }
    const a = tileset.terrain?.data ?? [];
    const b = origin.terrain?.data ?? [];
    for (let k = 0; k < b.length; k++) {
      if ((a[k] ?? 0) === b[k]) continue;
      errors.push(`${tileset.tilesetName}: el bloque ${k} tiene tag ${a[k] ?? 0} y su origen ${origin.tilesetName} usa ${b[k]}`);
      break;
    }
  }

  // 6) tablas del rango del Nightmare: ¿pueden dispararse de verdad?
  const rangeNotes = rangeTables(maps);
  for (const row of rangeNotes) {
    notes.push(`Map${row.map} (${row.tileset}, ${row.types.join("/")}): ${row.landCells} celdas con etiqueta de hierba, ${row.waterCells} de agua, ${row.otherCells} otras${row.types.includes("Land") && !row.types.includes("Cave") && !row.landCells ? " · tabla Land sin hierba: no puede dispararse" : ""}`);
  }
  if (rangeNotes.length) notes.push(`${rangeNotes.length} tablas del rango 2021–2195 revisadas fuera del catálogo del Nightmare (las de la Ruta de Dios 2031–2038 usan Land sin celdas de hierba en su tileset Outside y las vigila verify:ruta_de_dios)`);

  // 7) el paquete QA tiene que reflejar el juego
  const qaTilesets = path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA", "Data", "Tilesets.rxdata");
  const qaEncounters = path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA", "Data", "encounters.dat");
  for (const [file, gameFile] of [[qaTilesets, "Tilesets.rxdata"], [qaEncounters, "encounters.dat"]]) {
    if (!fs.existsSync(file)) { errors.push(`falta ${path.relative(ROOT, file)}: ejecuta npm run build:dn:qa`); continue; }
    const same = Buffer.compare(fs.readFileSync(file), fs.readFileSync(path.join(DATA, gameFile))) === 0;
    if (!same) errors.push(`${path.relative(ROOT, file)} no coincide con Data/${gameFile}: ejecuta npm run build:dn:qa`);
  }

  const tally = {};
  for (const info of Object.values(maps)) {
    for (const block of info.blocks.filter((b) => b.walk)) tally[block.material] = (tally[block.material] ?? 0) + block.walk;
  }
  return { errors, notes, tally, tables, rangeNotes, worlds: new Set(Object.values(maps).map((info) => info.world).filter(Boolean)).size };
}

// ------------------------------------------------------------------- evidencia
const MATERIAL_COLOUR = { Grass: "#3cdc5a", Snow: "#ffffff", Sand: "#ffd23c", Water: "#2878ff", Rock: "#808080", Void: "#ff00ff" };
/**
 * Hoja de contacto por grupo con cada bloque que los mapas pisan, recortado del
 * tileset a color y rodeado por el material asignado. Es la evidencia con la que
 * se calibró la clasificación.
 */
async function renderMaterials(maps) {
  fs.mkdirSync(SHEETS_DIR, { recursive: true });
  const byGroup = new Map();
  for (const info of Object.values(maps)) byGroup.set(info.group, [...(byGroup.get(info.group) ?? []), ...info.blocks]);
  const cell = 40, columns = 24, labelHeight = 12;
  const files = [];
  for (const [key, list] of byGroup) {
    const unique = new Map();
    for (const block of list) unique.set(block.original, block);
    const blocks = [...unique.values()]
      .sort((a, b) => (a.material === b.material ? (b.walk + b.blocked) - (a.walk + a.blocked) : a.material.localeCompare(b.material)))
      .slice(0, 720);
    const source = (await contextOf(groupByKey.get(key))).canvas;
    const rows = Math.ceil(blocks.length / columns);
    const canvas = createCanvas(columns * cell, rows * (cell + labelHeight));
    const target = canvas.getContext("2d");
    target.fillStyle = "#0d1116";
    target.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < blocks.length; i++) {
      const x = (i % columns) * cell, y = Math.floor(i / columns) * (cell + labelHeight);
      target.imageSmoothingEnabled = false;
      target.drawImage(source, (blocks[i].original % COLUMNS) * TILE, Math.floor(blocks[i].original / COLUMNS) * TILE, TILE, TILE, x + 4, y + 4, cell - 8, cell - 8);
      target.strokeStyle = MATERIAL_COLOUR[blocks[i].material] ?? "#ff00ff";
      target.lineWidth = 2;
      target.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
      target.fillStyle = "#cfe3ff";
      target.font = "10px monospace";
      target.fillText(`${blocks[i].material[0]}${blocks[i].walk}`, x + 3, y + cell + 10);
    }
    const file = path.join(SHEETS_DIR, `MATERIALES_${key}.png`);
    fs.writeFileSync(file, canvas.toBuffer("image/png"));
    files.push(path.relative(ROOT, file));
  }
  show(`hojas de materiales: ${files.length}`);
  return files;
}
/** Un mundo por hoja: cada mapa dibujado con el tileset del juego y el material encima. */
async function renderSheets(maps) {
  fs.mkdirSync(SHEETS_DIR, { recursive: true });
  const palette = { Grass: "rgba(60,220,90,0.45)", Snow: "rgba(255,255,255,0.55)", Sand: "rgba(255,210,60,0.45)", Water: "rgba(40,120,255,0.5)", Rock: "rgba(150,150,150,0.35)", Void: "rgba(255,0,255,0.4)" };
  const groups = new Map();
  for (const info of Object.values(maps)) {
    const key = info.world ?? info.episode;
    groups.set(key, [...(groups.get(key) ?? []), info]);
  }
  const files = [];
  for (const [key, list] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const canvases = [];
    let maxWidth = 0, totalHeight = 0;
    for (const info of [...list].sort((a, b) => a.id - b.id)) {
      const tilesetImage = await loadImage(path.join(GRAPHICS, `${info.tileset}.png`));
      const parsed = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, mapFile(info.id)))));
      const canvas = createCanvas(parsed.width * TILE, parsed.height * TILE + 14);
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      const byBlock = new Map(info.blocks.map((block) => [block.block, block]));
      for (let y = 0; y < parsed.height; y++) {
        for (let x = 0; x < parsed.width; x++) {
          const tile = tableGet(parsed.table, x, y, 0);
          if (!tile) continue;
          const block = tile - BASE_ID;
          context.drawImage(tilesetImage, (block % COLUMNS) * TILE, Math.floor(block / COLUMNS) * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
          const entry = byBlock.get(block);
          if (!entry || !entry.walk) continue;
          context.fillStyle = palette[entry.material] ?? palette.Void;
          context.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
      context.fillStyle = "#000";
      context.fillRect(0, parsed.height * TILE, canvas.width, 14);
      context.fillStyle = "#fff";
      context.font = "10px monospace";
      const label = `Map${info.id} · ${info.encounter ? info.encounter.type : "sin tabla"} · suelo ${info.dominantSoil} · ${info.blocks.filter((b) => b.walk && b.tag === TAGS.Grass).reduce((s, b) => s + b.walk, 0)} celdas de hierba`;
      context.fillText(label, 2, parsed.height * TILE + 11);
      canvases.push(canvas);
      maxWidth = Math.max(maxWidth, canvas.width);
      totalHeight += canvas.height + 6;
    }
    const sheet = createCanvas(maxWidth, totalHeight);
    const context = sheet.getContext("2d");
    context.fillStyle = "#101418";
    context.fillRect(0, 0, sheet.width, sheet.height);
    let offset = 0;
    for (const canvas of canvases) { context.drawImage(canvas, 0, offset); offset += canvas.height + 6; }
    const file = path.join(SHEETS_DIR, `TERRENO_${key}.png`);
    fs.writeFileSync(file, sheet.toBuffer("image/png"));
    files.push(path.relative(ROOT, file));
  }
  show(`hojas de evidencia: ${files.length}`);
  return files;
}

// ------------------------------------------------------------------------ main
async function main() {
  const maps = await analyze();
  const clones = inspectClones();
  const rangeNotes = rangeTables(maps);
  const catalog = buildCatalog(maps, {
    clones,
    audit: {
      rangeTables: rangeNotes,
      engineFindings: [
        "Todas las etiquetas de agua del juego tienen :can_surf => false: el surf y los encuentros de agua no son alcanzables.",
        "Los clones Game Boy (DN_GB_TS*) heredan exactamente las etiquetas de su tileset de origen; los que vienen de interiores no tienen hierba, agua, arena ni nieve que etiquetar.",
        "Las tablas Land del rango 2021–2195 fuera del Nightmare (Ruta de Dios 2031–2038) siguen sin celdas de hierba: las vigila verify:ruta_de_dios.",
      ],
    },
  });
  show(`Clasificación: ${Object.entries(catalog.measurements).map(([key, value]) => `${key}=${value}`).join(" ")}`);

  if (PLAN) {
    fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
    show(`catálogo: ${path.relative(ROOT, CATALOG_PATH)}`);
  }
  if (MATERIALS) await renderMaterials(maps);
  if (RENDER) await renderSheets(maps);
  if (APPLY) {
    writeTilesets(maps);
    writeEncounters(maps);
    fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
    show(`catálogo actualizado: ${path.relative(ROOT, CATALOG_PATH)} (recuerda npm run build:dn:qa)`);
  }
  if (VERIFY || APPLY || (!PLAN && !MATERIALS && !RENDER)) {
    const { errors, notes, tally, tables, worlds } = await verify(maps);
    show(`Verificación: ${worlds} mundos con fauna · ${tables} tablas · celdas pisables por material → ${Object.entries(tally).map(([key, value]) => `${key}=${value}`).join(" ")}`);
    for (const note of notes) show(`  · ${note}`);
    if (errors.length) {
      console.error(`✘ Terreno del Nightmare: ${errors.length} problema(s)`);
      for (const error of errors.slice(0, 40)) console.error(`  · ${error}`);
      process.exit(1);
    }
    show("✔ Terreno del Nightmare: hierba, agua, arena y nieve con etiqueta real, encuentros del GDD instalados y crujido verificado.");
  }
}
main().catch((error) => { console.error(error); process.exit(1); });
