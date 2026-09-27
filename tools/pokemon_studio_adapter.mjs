#!/usr/bin/env node
/**
 * Puente de solo lectura para Pokémon Studio/PSDK y manifiesto de autoría neutral.
 *
 * Pokémon Studio no edita Pokémon Essentials. Este adaptador puede inspeccionar
 * un proyecto PSDK sin modificarlo y aplica sus ideas de símbolos estables,
 * registros separados e integridad referencial al contenido de Fire Ash.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, GAME, loadFireAshRegistry } from "./lib/fire_ash_registry.mjs";

export const STUDIO_VERSION = "2.11.0";
export const STUDIO_COLLECTIONS = [
  "abilities", "dex", "groups", "items", "moves", "pokemon", "quests",
  "trainers", "types", "worldmaps", "maplinks", "zones", "maps", "natures", "events",
];
const MAX_JSON_BYTES = 16 * 1024 * 1024;
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function safeJson(file, root) {
  const resolved = path.resolve(file);
  const realRoot = fs.realpathSync(root);
  const realFile = fs.realpathSync(resolved);
  const relative = path.relative(realRoot, realFile);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Ruta fuera del proyecto: ${file}`);
  const stat = fs.lstatSync(resolved);
  if (stat.isSymbolicLink()) throw new Error(`Enlace simbólico rechazado: ${relative}`);
  if (!stat.isFile() || stat.size > MAX_JSON_BYTES) throw new Error(`JSON inválido o demasiado grande: ${relative}`);
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function recordsFromJson(value) {
  if (Array.isArray(value)) return value.filter(isObject);
  if (isObject(value)) return [value];
  return [];
}

function topLevelDbSymbols(value) {
  return recordsFromJson(value).map((record) => record.dbSymbol).filter((symbol) => typeof symbol === "string" && symbol);
}

export function inspectStudioProject(projectPath) {
  const project = path.resolve(projectPath);
  const errors = [];
  const warnings = [];
  const metadataFile = path.join(project, "project.studio");
  const dataRoot = path.join(project, "Data", "Studio");
  if (!fs.existsSync(metadataFile)) throw new Error("No se encontró project.studio.");
  const metadata = safeJson(metadataFile, project);
  if (typeof metadata.title !== "string" || !metadata.title.trim()) errors.push("project.studio: title inválido.");
  if (typeof metadata.studioVersion !== "string") errors.push("project.studio: studioVersion inválido.");
  else if (metadata.studioVersion !== STUDIO_VERSION) warnings.push(`Proyecto creado con Studio ${metadata.studioVersion}; referencia fijada en ${STUDIO_VERSION}.`);
  if (!Array.isArray(metadata.languagesTranslation)) warnings.push("project.studio no declara languagesTranslation.");
  if (!fs.existsSync(dataRoot)) errors.push("Falta Data/Studio.");

  const collections = {};
  const allSymbols = new Map();
  for (const name of STUDIO_COLLECTIONS) {
    const folder = path.join(dataRoot, name);
    if (!fs.existsSync(folder)) {
      collections[name] = { files: 0, records: 0, dbSymbols: 0, duplicates: [] };
      warnings.push(`Colección ausente: ${name}.`);
      continue;
    }
    const files = fs.readdirSync(folder).filter((file) => file.endsWith(".json")).sort();
    if (!files.length && !["maps", "events"].includes(name)) warnings.push(`Colección vacía: ${name}.`);
    let recordCount = 0;
    const symbols = [];
    for (const file of files) {
      try {
        const value = safeJson(path.join(folder, file), project);
        recordCount += recordsFromJson(value).length;
        symbols.push(...topLevelDbSymbols(value));
      } catch (error) {
        errors.push(`${name}/${file}: ${error.message}`);
      }
    }
    const seen = new Set();
    const duplicates = [...new Set(symbols.filter((symbol) => seen.has(symbol) || !seen.add(symbol)))];
    if (duplicates.length) errors.push(`${name}: dbSymbol duplicados: ${duplicates.join(", ")}.`);
    for (const symbol of symbols) {
      if (!allSymbols.has(symbol)) allSymbols.set(symbol, []);
      allSymbols.get(symbol).push(name);
    }
    collections[name] = { files: files.length, records: recordCount, dbSymbols: new Set(symbols).size, duplicates };
  }
  const crossCollectionSymbols = [...allSymbols.entries()]
    .filter(([, names]) => new Set(names).size > 1)
    .map(([dbSymbol, names]) => ({ dbSymbol, collections: [...new Set(names)].sort() }));

  return {
    version: 1,
    source: {
      format: "project.studio + Data/Studio JSON",
      readOnly: true,
      requestedStudioVersion: STUDIO_VERSION,
      projectTitle: metadata.title ?? null,
      projectStudioVersion: metadata.studioVersion ?? null,
    },
    collections,
    integrity: {
      ok: errors.length === 0,
      errors,
      warnings,
      crossCollectionSymbols,
    },
    compatibility: {
      runtime: "PSDK/LiteRGSS",
      targetRuntime: "Pokémon Essentials/RGSS",
      directImportAllowed: false,
      policy: "Solo referencia neutral. Nunca copiar Data/Studio ni psdk.dat sobre Fire Ash.",
    },
  };
}

export function buildFireAshStudioReference({ registry, blueprints, hierarchy }) {
  const errors = [];
  const warnings = [];
  const characters = new Set(fs.readdirSync(path.join(GAME, "Graphics", "Characters"))
    .filter((file) => /\.png$/i.test(file)).map((file) => file.replace(/\.png$/i, "")));
  const maps = new Set(hierarchy.maps.map((entry) => Number(entry.mapId)));
  const anchors = hierarchy.maps.filter((entry) => Number(entry.tier) === 1).sort((a, b) => a.sector - b.sector);
  const blueprintByMap = new Map(blueprints.map((entry) => [Number(entry.mapId), entry]));
  const symbols = new Set();
  const records = anchors.map((anchor, index) => {
    const blueprint = blueprintByMap.get(Number(anchor.mapId));
    const dbSymbol = `atlas_anchor_${String(index + 1).padStart(2, "0")}`;
    if (symbols.has(dbSymbol)) errors.push(`dbSymbol duplicado: ${dbSymbol}.`);
    symbols.add(dbSymbol);
    if (!maps.has(Number(anchor.mapId))) errors.push(`${dbSymbol}: mapId ${anchor.mapId} no pertenece a Atlas.`);
    if (!fs.existsSync(path.join(GAME, "Data", `Map${String(anchor.mapId).padStart(3, "0")}.rxdata`))) errors.push(`${dbSymbol}: mapa compilado ausente.`);
    if (!blueprint) return {
      id: index + 1,
      dbSymbol,
      mapId: Number(anchor.mapId),
      title: null,
      state: "planned",
      trainer: null,
      cast: [],
      progression: {
        switchId: 708 + index,
        sealCounterVariable: 103,
        decisionVariable: 104 + index,
        freeReturnMapId: 1001,
      },
    };
    if (!registry.trainerTypes.has(blueprint.battle.trainerType)) errors.push(`${dbSymbol}: trainerType inválido.`);
    if (!characters.has(blueprint.battle.sprite)) errors.push(`${dbSymbol}: sprite de jefe inexistente.`);
    for (const npc of blueprint.npcs) if (!characters.has(npc.sprite)) errors.push(`${dbSymbol}: sprite NPC inexistente ${npc.sprite}.`);
    for (const pokemon of blueprint.battle.team) {
      if (!registry.speciesById.has(pokemon.species)) errors.push(`${dbSymbol}: especie inválida ${pokemon.species}.`);
      for (const move of pokemon.moves) if (!registry.moves.has(move)) errors.push(`${dbSymbol}: movimiento inválido ${move}.`);
      if (pokemon.item && !registry.items.has(pokemon.item)) errors.push(`${dbSymbol}: objeto inválido ${pokemon.item}.`);
    }
    if (blueprint.battle.team.length !== 6) warnings.push(`${dbSymbol}: el jefe no usa seis Pokémon.`);
    return {
      id: index + 1,
      dbSymbol,
      mapId: Number(blueprint.mapId),
      title: blueprint.title,
      state: "approved-and-compiled",
      trainer: {
        dbSymbol: `${dbSymbol}_trainer`,
        trainerType: blueprint.battle.trainerType,
        name: blueprint.battle.trainerName,
        sprite: blueprint.battle.sprite,
        party: blueprint.battle.team.map((pokemon, slot) => ({
          slot: slot + 1,
          species: pokemon.species,
          level: pokemon.level,
          moves: pokemon.moves,
          item: pokemon.item ?? null,
          narrativeRole: pokemon.narrativeRole,
        })),
      },
      cast: blueprint.npcs.map((npc, slot) => ({
        dbSymbol: `${dbSymbol}_npc_${slot + 1}`,
        name: npc.name,
        role: npc.role,
        sprite: npc.sprite,
      })),
      progression: {
        switchId: blueprint.flags.globalSwitches[0].id,
        sealCounterVariable: 103,
        decisionVariable: 104 + (blueprint.flags.globalSwitches[0].id - 708),
        freeReturnMapId: blueprint.exits.find((entry) => entry.condition === "always")?.destination ?? null,
      },
    };
  });
  const knownSwitches = new Set();
  for (const record of records) {
    if (knownSwitches.has(record.progression.switchId)) errors.push(`Switch repetido ${record.progression.switchId}.`);
    knownSwitches.add(record.progression.switchId);
  }

  return {
    version: 1,
    format: "fire-ash-neutral-authoring-manifest",
    inspiredBy: {
      tool: "Pokémon Studio",
      version: STUDIO_VERSION,
      concepts: ["dbSymbol estable", "colecciones separadas", "integridad referencial", "datos textuales revisables"],
      containsPokemonStudioCode: false,
      isPsdkProject: false,
    },
    target: {
      engine: "Pokémon Essentials/RGSS",
      game: "Pokémon Fire Ash",
      maximumLevel: 150,
    },
    registries: {
      species: registry.speciesById.size,
      moves: registry.moves.size,
      items: registry.items.size,
      trainerTypes: registry.trainerTypes.size,
      characterSprites: characters.size,
    },
    records,
    integrity: {
      ok: errors.length === 0,
      errors,
      warnings,
      invariant: "Este manifiesto nunca reemplaza Data/*.rxdata; el compilador Essentials sigue siendo la única salida jugable.",
    },
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
    console.log("  node tools/pokemon_studio_adapter.mjs inspect --project /ruta/proyecto-psdk [--output informe.json]");
    console.log("  node tools/pokemon_studio_adapter.mjs fire-ash-reference [--output content/atlas_studio_reference.json]");
    return;
  }
  if (command === "inspect") {
    const project = argument("--project");
    if (!project) throw new Error("inspect requiere --project.");
    const report = inspectStudioProject(project);
    const output = argument("--output");
    if (output) writeJson(path.resolve(output), report);
    console.log(JSON.stringify(report.integrity, null, 2));
    if (!report.integrity.ok) process.exitCode = 1;
    return;
  }
  if (command === "fire-ash-reference") {
    const approved = json(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json"));
    const hierarchy = json(path.join(ROOT, "content", "atlas_content_hierarchy.json"));
    const report = buildFireAshStudioReference({
      registry: loadFireAshRegistry(),
      blueprints: approved.blueprints ?? [],
      hierarchy,
    });
    const output = path.resolve(argument("--output", path.join(ROOT, "content", "atlas_studio_reference.json")));
    writeJson(output, report);
    console.log(`Referencia Studio: ${report.records.length} registros, integridad=${report.integrity.ok}.`);
    if (!report.integrity.ok) process.exitCode = 1;
    return;
  }
  throw new Error(`Comando desconocido: ${command}.`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { runCli(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
