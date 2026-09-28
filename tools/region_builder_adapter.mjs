#!/usr/bin/env node
/**
 * Adaptador limpio para archivos .pkregion de Pokémon Region Builder.
 *
 * Solo intercambia JSON de diseño. Nunca escribe Data/*.rxdata y no contiene
 * código del editor externo. La salida neutral debe pasar por los compiladores
 * Essentials/RMXP de este repositorio antes de convertirse en contenido jugable.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, loadFireAshRegistry } from "./lib/fire_ash_registry.mjs";

const LANDMARK_TYPES = new Set(["city", "town", "route", "cave", "special"]);
const MAP_STYLES = new Set(["rs", "dp"]);
const TERRAIN_SCALE = 4;
const MAX_DIMENSION = 256;
const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isInteger = (value) => Number.isInteger(value);
const digest = (text) => crypto.createHash("sha256").update(text).digest("hex");
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

export function validatePkregion(region) {
  const errors = [];
  const warnings = [];
  const fail = (message) => errors.push(message);
  const warn = (message) => warnings.push(message);

  if (!isObject(region)) {
    return { ok: false, errors: ["La raíz debe ser un objeto JSON."], warnings, stats: {} };
  }
  if (region.version !== 1) fail("version debe ser 1.");
  if (typeof region.name !== "string" || !region.name.trim()) fail("name debe ser texto no vacío.");
  const map = region.mapData;
  if (!isObject(map)) {
    fail("mapData debe ser un objeto.");
    return { ok: false, errors, warnings, stats: {} };
  }
  if (!MAP_STYLES.has(map.style)) fail("mapData.style debe ser rs o dp.");
  if (!isInteger(map.width) || map.width < 1 || map.width > MAX_DIMENSION) fail(`mapData.width debe estar entre 1 y ${MAX_DIMENSION}.`);
  if (!isInteger(map.height) || map.height < 1 || map.height > MAX_DIMENSION) fail(`mapData.height debe estar entre 1 y ${MAX_DIMENSION}.`);
  const width = isInteger(map.width) ? map.width : 0;
  const height = isInteger(map.height) ? map.height : 0;

  if (map.background !== null && typeof map.background !== "string") fail("mapData.background debe ser null o data URL.");
  if (typeof map.background === "string") {
    if (!map.background.startsWith("data:image/")) fail("background externo rechazado: use una data URL de imagen.");
    if (Buffer.byteLength(map.background, "utf8") > MAX_BACKGROUND_BYTES) fail("background supera el límite seguro de 8 MiB.");
  }
  const transform = map.backgroundTransform;
  if (!isObject(transform) || !["offsetX", "offsetY", "scale", "rotation"].every((key) => Number.isFinite(transform[key]))) {
    fail("backgroundTransform debe contener offsetX, offsetY, scale y rotation numéricos.");
  } else if (transform.scale <= 0) fail("backgroundTransform.scale debe ser positivo.");

  if (!Array.isArray(map.cells) || map.cells.length !== height) {
    fail(`cells debe tener exactamente ${height} filas.`);
  }
  const referencedLandmarks = new Set();
  let waterCells = 0;
  let pathCells = 0;
  const terrainHistogram = { "-1": 0, "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };
  if (Array.isArray(map.cells)) {
    map.cells.forEach((row, y) => {
      if (!Array.isArray(row) || row.length !== width) {
        fail(`cells[${y}] debe tener exactamente ${width} columnas.`);
        return;
      }
      row.forEach((cell, x) => {
        if (!isObject(cell)) return fail(`cells[${y}][${x}] debe ser un objeto.`);
        if (typeof cell.water !== "boolean") fail(`cells[${y}][${x}].water debe ser booleano.`);
        if (typeof cell.path !== "boolean") fail(`cells[${y}][${x}].path debe ser booleano.`);
        if (!isInteger(cell.terrain) || cell.terrain < -1 || cell.terrain > 4) fail(`cells[${y}][${x}].terrain fuera de -1..4.`);
        if (cell.landmarkId !== null && typeof cell.landmarkId !== "string") fail(`cells[${y}][${x}].landmarkId debe ser texto o null.`);
        if (cell.landmarkId) referencedLandmarks.add(cell.landmarkId);
        if (cell.water) waterCells++;
        if (cell.path) pathCells++;
        if (String(cell.terrain) in terrainHistogram) terrainHistogram[String(cell.terrain)]++;
      });
    });
  }

  if (map.terrainGrid !== null && map.terrainGrid !== undefined) {
    const expected = width * TERRAIN_SCALE * height * TERRAIN_SCALE;
    if (!Array.isArray(map.terrainGrid) || map.terrainGrid.length !== expected) {
      fail(`terrainGrid debe contener ${expected} valores o ser null.`);
    } else {
      map.terrainGrid.forEach((value, index) => {
        if (!isInteger(value) || value < -1 || value > 4) fail(`terrainGrid[${index}] fuera de -1..4.`);
      });
    }
  }

  const landmarkIds = new Set();
  const landmarkPokemon = new Set();
  if (!Array.isArray(map.landmarks)) fail("mapData.landmarks debe ser una lista.");
  for (const [index, landmark] of (Array.isArray(map.landmarks) ? map.landmarks : []).entries()) {
    const prefix = `landmarks[${index}]`;
    if (!isObject(landmark)) { fail(`${prefix} debe ser un objeto.`); continue; }
    if (typeof landmark.id !== "string" || !landmark.id) fail(`${prefix}.id debe ser texto no vacío.`);
    else if (landmarkIds.has(landmark.id)) fail(`landmark id duplicado: ${landmark.id}.`);
    else landmarkIds.add(landmark.id);
    for (const key of ["x", "y", "width", "height"]) if (!isInteger(landmark[key])) fail(`${prefix}.${key} debe ser entero.`);
    if (![1, 2].includes(landmark.width) || ![1, 2].includes(landmark.height)) fail(`${prefix} solo admite huellas 1x1, 1x2, 2x1 o 2x2.`);
    if (isInteger(landmark.x) && isInteger(landmark.width) && (landmark.x < 0 || landmark.x + landmark.width > width)) fail(`${prefix} sale del ancho del mapa.`);
    if (isInteger(landmark.y) && isInteger(landmark.height) && (landmark.y < 0 || landmark.y + landmark.height > height)) fail(`${prefix} sale del alto del mapa.`);
    if (!LANDMARK_TYPES.has(landmark.type)) fail(`${prefix}.type no es válido.`);
    if (typeof landmark.name !== "string" || !landmark.name.trim()) fail(`${prefix}.name debe ser texto no vacío.`);
    if (typeof landmark.description !== "string") fail(`${prefix}.description debe ser texto.`);
    if (!Array.isArray(landmark.pokemon) || landmark.pokemon.some((id) => typeof id !== "string" || !id)) fail(`${prefix}.pokemon debe ser una lista de IDs textuales.`);
    else landmark.pokemon.forEach((id) => landmarkPokemon.add(id));
  }
  for (const id of referencedLandmarks) if (!landmarkIds.has(id)) fail(`Una celda referencia el landmark inexistente ${id}.`);
  for (const id of landmarkIds) if (!referencedLandmarks.has(id)) warn(`El landmark ${id} no ocupa ninguna celda.`);

  const pokedex = Array.isArray(region.pokedex) ? region.pokedex : [];
  if (!Array.isArray(region.pokedex)) fail("pokedex debe ser una lista.");
  const dexNumbers = new Set();
  const dexPokemon = new Set();
  for (const [index, entry] of pokedex.entries()) {
    const prefix = `pokedex[${index}]`;
    if (!isObject(entry)) { fail(`${prefix} debe ser un objeto.`); continue; }
    if (!isInteger(entry.dexNumber) || entry.dexNumber < 1) fail(`${prefix}.dexNumber debe ser entero positivo.`);
    else if (dexNumbers.has(entry.dexNumber)) fail(`dexNumber duplicado: ${entry.dexNumber}.`);
    else dexNumbers.add(entry.dexNumber);
    if (!(typeof entry.pokemonId === "string" || isInteger(entry.pokemonId))) fail(`${prefix}.pokemonId debe ser texto o entero.`);
    else dexPokemon.add(String(entry.pokemonId));
    if (typeof entry.isCustom !== "boolean" || typeof entry.isRegional !== "boolean") fail(`${prefix} requiere isCustom e isRegional booleanos.`);
    if (entry.types !== undefined && (!Array.isArray(entry.types) || entry.types.some((type) => typeof type !== "string"))) fail(`${prefix}.types debe ser una lista de textos.`);
  }
  for (const id of landmarkPokemon) if (!dexPokemon.has(id)) fail(`El encuentro ${id} aparece en el mapa pero no en la Pokédex regional.`);
  for (const id of dexPokemon) if (!landmarkPokemon.has(id)) warn(`La entrada Pokédex ${id} no está asignada a ningún landmark.`);

  for (const key of ["customPokemon", "customMoves", "customAbilities"]) {
    if (!Array.isArray(region[key])) fail(`${key} debe ser una lista.`);
  }
  const customIds = new Set((Array.isArray(region.customPokemon) ? region.customPokemon : []).map((entry) => entry?.id).filter(Boolean));
  for (const entry of pokedex.filter((entry) => entry?.isCustom)) if (!customIds.has(entry.pokemonId)) fail(`Pokémon personalizado sin definición: ${entry.pokemonId}.`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      width,
      height,
      cells: width * height,
      waterCells,
      pathCells,
      terrainHistogram,
      landmarks: landmarkIds.size,
      pokedexEntries: pokedex.length,
      customPokemon: customIds.size,
    },
  };
}

function atlasCoordinates(index) {
  const row = Math.floor(index / 8);
  const offset = index % 8;
  const column = row % 2 === 0 ? offset : 7 - offset;
  return { x: 3 + column * 10, y: 4 + row * 11 };
}

function paintLine(cells, from, to) {
  let x = from.x;
  let y = from.y;
  while (x !== to.x) { cells[y][x].path = true; x += Math.sign(to.x - x); }
  while (y !== to.y) { cells[y][x].path = true; y += Math.sign(to.y - y); }
  cells[y][x].path = true;
}

export function buildAtlasPkregion({ catalog, hierarchy, blueprints, seeds, registry }) {
  const width = 80;
  const height = 60;
  const cells = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => ({
    water: x < 2 || x >= width - 2 || y < 2 || y >= height - 2,
    terrain: (Math.floor(x / 16) + Math.floor(y / 12)) % 5,
    path: false,
    landmarkId: null,
  })));
  for (const row of cells) for (const cell of row) if (cell.water) cell.terrain = -1;

  const blueprintByMap = new Map(blueprints.map((entry) => [Number(entry.mapId), entry]));
  const seedByMap = new Map(seeds.map((entry) => [Number(entry.mapId), entry]));
  const landmarkSpecies = new Map();
  const landmarks = catalog.sectors.map((sector, index) => {
    const anchor = hierarchy.maps.find((entry) => entry.sector === sector.id && entry.tier === 1);
    const blueprint = blueprintByMap.get(anchor.mapId);
    const seed = seedByMap.get(anchor.mapId);
    const position = atlasCoordinates(index);
    const species = blueprint ? [...new Set(blueprint.battle.team.map((entry) => entry.species))] : [];
    landmarkSpecies.set(sector.id, species);
    const status = blueprint ? `Episodio aprobado: ${blueprint.title}.` : `Ancla ${String(sector.id).padStart(2, "0")} pendiente de diseño artesanal.`;
    return {
      id: `atlas-sector-${String(sector.id).padStart(2, "0")}`,
      x: position.x,
      y: position.y,
      width: 2,
      height: 2,
      type: sector.id % 10 === 0 ? "city" : sector.id % 4 === 0 ? "town" : sector.id % 3 === 0 ? "cave" : "special",
      name: sector.name,
      description: `Sector ${String(sector.id).padStart(2, "0")} · ${sector.faction}. ${status} ${seed?.coreMystery ?? "Su conflicto debe validarse antes de compilar."}`,
      pokemon: species.map((id) => {
        const record = registry.speciesById.get(id);
        if (!record || record.form !== 0 || record.idNumber < 1) throw new Error(`No se puede representar ${id} como especie canónica de Region Builder.`);
        return String(record.idNumber);
      }),
    };
  });

  const centers = landmarks.map((landmark) => ({ x: landmark.x, y: landmark.y }));
  for (let index = 1; index < centers.length; index++) paintLine(cells, centers[index - 1], centers[index]);
  for (const landmark of landmarks) {
    for (let y = landmark.y; y < landmark.y + landmark.height; y++) {
      for (let x = landmark.x; x < landmark.x + landmark.width; x++) {
        cells[y][x].water = false;
        cells[y][x].terrain = Math.floor(Number(landmark.id.slice(-2)) / 8) % 5;
        cells[y][x].landmarkId = landmark.id;
      }
    }
  }

  const allSpecies = [...new Set([...landmarkSpecies.values()].flat())]
    .map((id) => registry.speciesById.get(id))
    .filter(Boolean)
    .sort((a, b) => a.idNumber - b.idNumber);
  const pokedex = allSpecies.map((entry, index) => ({
    dexNumber: index + 1,
    pokemonId: entry.idNumber,
    isCustom: false,
    isRegional: false,
    baseFormId: null,
    types: entry.types,
  }));

  return {
    version: 1,
    name: "Atlas Mil",
    mapData: {
      style: "rs",
      width,
      height,
      background: null,
      backgroundTransform: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
      cells,
      landmarks,
      terrainGrid: null,
    },
    pokedex,
    customPokemon: [],
    customMoves: [],
    customAbilities: [],
  };
}

export function importPkregion(region, { rawText = JSON.stringify(region), registry, catalog, hierarchy, blueprints }) {
  const validation = validatePkregion(region);
  if (!validation.ok) throw new Error(`.pkregion inválido:\n- ${validation.errors.join("\n- ")}`);
  const blueprintByMap = new Map(blueprints.map((entry) => [Number(entry.mapId), entry]));
  const sectorById = new Map(catalog.sectors.map((entry) => [Number(entry.id), entry]));
  const unknownPokemon = new Set();
  const customPokemon = new Set();
  const resolvedLandmarks = region.mapData.landmarks.map((landmark) => {
    const match = /^atlas-sector-(\d{2})$/.exec(landmark.id);
    const sectorId = match ? Number(match[1]) : null;
    const sector = sectorById.get(sectorId);
    const anchor = sectorId ? hierarchy.maps.find((entry) => entry.sector === sectorId && entry.tier === 1) : null;
    const encounters = landmark.pokemon.map((externalId) => {
      if (externalId.startsWith("custom-")) {
        customPokemon.add(externalId);
        return { regionBuilderId: externalId, essentialsSpecies: null, compatible: false, reason: "Requiere sprite y datos RMXP validados." };
      }
      const number = Number(externalId);
      const record = registry.speciesByPokeApiId.get(number);
      if (!record) unknownPokemon.add(externalId);
      return {
        regionBuilderId: externalId,
        essentialsSpecies: record?.id ?? null,
        compatible: Boolean(record),
        reason: record ? null : "No existe como forma base canónica en species.dat de Fire Ash.",
      };
    });
    return {
      id: landmark.id,
      sectorId,
      sectorName: sector?.name ?? landmark.name,
      faction: sector?.faction ?? null,
      anchorMapId: anchor?.mapId ?? null,
      tier2Maps: sectorId ? hierarchy.maps.filter((entry) => entry.sector === sectorId && entry.tier === 2).map((entry) => entry.mapId) : [],
      mapRange: sectorId ? [1021 + (sectorId - 1) * 25, 1045 + (sectorId - 1) * 25] : null,
      name: landmark.name,
      description: landmark.description,
      type: landmark.type,
      position: { x: landmark.x, y: landmark.y, width: landmark.width, height: landmark.height },
      encounters,
      episode: anchor && blueprintByMap.has(anchor.mapId) ? {
        status: "approved",
        title: blueprintByMap.get(anchor.mapId).title,
        switchId: blueprintByMap.get(anchor.mapId).flags.globalSwitches[0].id,
      } : { status: "pending" },
    };
  });
  const unassignedSectors = catalog.sectors.filter((sector) => !resolvedLandmarks.some((landmark) => landmark.sectorId === sector.id)).map((sector) => sector.id);
  const duplicateSectors = catalog.sectors.filter((sector) => resolvedLandmarks.filter((landmark) => landmark.sectorId === sector.id).length > 1).map((sector) => sector.id);
  const pendingEncounters = resolvedLandmarks.filter((landmark) => landmark.encounters.length === 0).map((landmark) => landmark.id);
  const compatibilityErrors = [
    ...[...unknownPokemon].map((id) => `Pokémon externo no disponible en Fire Ash: ${id}.`),
    ...[...customPokemon].map((id) => `Pokémon personalizado bloqueado hasta validar datos y sprites RMXP: ${id}.`),
    ...unassignedSectors.map((id) => `Falta el sector Atlas ${id}.`),
    ...duplicateSectors.map((id) => `El sector Atlas ${id} está duplicado.`),
  ];
  const compatibilityWarnings = [
    ...validation.warnings,
    ...pendingEncounters.map((id) => `${id} aún no tiene encuentros aprobados.`),
  ];

  return {
    version: 1,
    source: {
      format: "pkregion",
      formatVersion: region.version,
      authoringTool: "Pokémon Region Builder",
      sha256: digest(rawText),
      policy: "Entrada de diseño neutral; no es un mapa RMXP jugable.",
    },
    region: {
      name: region.name,
      style: region.mapData.style,
      width: region.mapData.width,
      height: region.mapData.height,
      layers: {
        backgroundReference: Boolean(region.mapData.background),
        waterCells: validation.stats.waterCells,
        pathCells: validation.stats.pathCells,
        terrainHistogram: validation.stats.terrainHistogram,
      },
    },
    landmarks: resolvedLandmarks,
    regionalDex: region.pokedex.map((entry) => {
      const record = !entry.isCustom ? registry.speciesByPokeApiId.get(Number(entry.pokemonId)) : null;
      return {
        dexNumber: entry.dexNumber,
        regionBuilderId: String(entry.pokemonId),
        essentialsSpecies: record?.id ?? null,
        types: entry.types ?? record?.types ?? [],
        compatible: Boolean(record) && !entry.isCustom,
      };
    }),
    compatibility: {
      target: "Pokémon Essentials/RGSS de Fire Ash",
      directPsdkWrite: false,
      customAssetsBlocked: customPokemon.size,
      unknownPokemon: unknownPokemon.size,
      errors: compatibilityErrors,
      warnings: compatibilityWarnings,
      readyForNarrativePipeline: compatibilityErrors.length === 0 && resolvedLandmarks.length === 40,
      readyForRmxpCompilation: false,
      requiredNextGate: "Blueprint aprobado + style gate + compilador RMXP con backup.",
    },
  };
}

function loadAtlasInputs() {
  const catalog = json(path.join(ROOT, "content", "atlas_mil_500.json"));
  const hierarchy = json(path.join(ROOT, "content", "atlas_content_hierarchy.json"));
  const approved = json(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json"));
  const seedsFile = json(path.join(ROOT, "content", "atlas_narrative_seeds.json"));
  return {
    catalog,
    hierarchy,
    blueprints: approved.blueprints ?? [],
    seeds: seedsFile.seeds ?? [],
    registry: loadFireAshRegistry(),
  };
}

function argument(name, fallback = null) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}

export function runCli() {
  const command = process.argv[2] ?? "help";
  if (command === "help" || process.argv.includes("--help")) {
    console.log("Uso:");
    console.log("  node tools/region_builder_adapter.mjs export [--output content/atlas_mil_region.pkregion]");
    console.log("  node tools/region_builder_adapter.mjs validate --input archivo.pkregion");
    console.log("  node tools/region_builder_adapter.mjs import --input archivo.pkregion [--output content/atlas_region_design.json]");
    return;
  }
  const inputs = loadAtlasInputs();
  if (command === "export") {
    const output = path.resolve(argument("--output", path.join(ROOT, "content", "atlas_mil_region.pkregion")));
    const region = buildAtlasPkregion(inputs);
    const report = validatePkregion(region);
    if (!report.ok) throw new Error(report.errors.join("\n"));
    writeJson(output, region);
    console.log(`Region Builder: ${report.stats.landmarks} sectores y ${report.stats.pokedexEntries} especies exportados a ${path.relative(ROOT, output)}.`);
    return;
  }
  const inputArg = argument("--input");
  if (!inputArg) throw new Error(`${command} requiere --input archivo.pkregion.`);
  const input = path.resolve(inputArg);
  const rawText = fs.readFileSync(input, "utf8");
  const region = JSON.parse(rawText);
  const report = validatePkregion(region);
  if (command === "validate") {
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
    return;
  }
  if (command === "import") {
    const output = path.resolve(argument("--output", path.join(ROOT, "content", "atlas_region_design.json")));
    const manifest = importPkregion(region, { ...inputs, rawText });
    writeJson(output, manifest);
    console.log(`Diseño neutral importado: ${manifest.landmarks.length} landmarks; compatible=${manifest.compatibility.readyForNarrativePipeline}.`);
    if (!manifest.compatibility.readyForNarrativePipeline) process.exitCode = 1;
    return;
  }
  throw new Error(`Comando desconocido: ${command}.`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { runCli(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
