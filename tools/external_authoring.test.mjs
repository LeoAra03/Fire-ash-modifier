#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import zlib from "node:zlib";
import path from "node:path";
import { validatePkregion } from "./region_builder_adapter.mjs";
import { inspectStudioProject, STUDIO_COLLECTIONS, STUDIO_VERSION } from "./pokemon_studio_adapter.mjs";
import { buildAtlasStyleReport } from "./atlas_style_gate.mjs";
import { ROOT, readMarshalData } from "./lib/fire_ash_registry.mjs";
import { marshalLoad } from "../web/js/marshal.js";
import { parseEvent, parseMap } from "../web/js/rmxp.js";

let passed = 0;
let failed = 0;
function check(condition, message) {
  if (condition) { passed++; console.log(`OK: ${message}`); }
  else { failed++; console.error(`FALLA: ${message}`); }
}

const approvedBlueprints = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json"), "utf8")).blueprints;
const expectedApproved = approvedBlueprints.length;
const expectedDexSpecies = new Set(approvedBlueprints.flatMap((blueprint) => blueprint.battle.team.map((pokemon) => pokemon.species))).size;
const visualManifestFiles = fs.readdirSync(path.join(ROOT, "content")).filter((file) => /^atlas_visual_polish_macro\d+\.json$/.test(file));
const expectedCustomMaps = new Set(visualManifestFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", file), "utf8")).maps.map((entry) => Number(entry.mapId)))).size;
const tier2ManifestFiles = fs.readdirSync(path.join(ROOT, "content")).filter((file) => /^atlas_tier2_blueprints_macro\d+\.json$/.test(file));
const tier2Blueprints = tier2ManifestFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", file), "utf8")).blueprints);
const tier2QaFiles = fs.readdirSync(path.join(ROOT, "content")).filter((file) => /^atlas_tier2_qa(?:_macro\d+)?\.json$/.test(file));
const tier2QaReports = tier2QaFiles.map((file) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", file), "utf8")));
const tier2NpcNames = tier2Blueprints.flatMap((entry) => entry.npcs.map((npc) => npc.name));
const tier2DialogueLines = tier2Blueprints.flatMap((entry) => entry.npcs.flatMap((npc) => [...npc.dialogue.before, ...npc.dialogue.after]));
const region = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_region.pkregion"), "utf8"));
const regionValidation = validatePkregion(region);
check(regionValidation.ok, "el .pkregion de Atlas cumple el formato v1");
check(regionValidation.stats.landmarks === 40, "Region Builder contiene los 40 sectores");
check(regionValidation.stats.pokedexEntries === expectedDexSpecies, `la Pokédex regional contiene las ${expectedDexSpecies} especies aprobadas`);
check(regionValidation.stats.waterCells > 0 && regionValidation.stats.pathCells > 0, "las capas de agua y caminos tienen contenido");
const corrupt = structuredClone(region);
corrupt.version = 2;
check(!validatePkregion(corrupt).ok, "el adaptador rechaza versiones .pkregion desconocidas");
const dangling = structuredClone(region);
dangling.mapData.cells[0][0].landmarkId = "missing";
check(!validatePkregion(dangling).ok, "el adaptador rechaza referencias a landmarks inexistentes");

const neutral = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_region_design.json"), "utf8"));
check(neutral.compatibility.readyForNarrativePipeline, "el diseño neutral supera la compuerta narrativa");
check(neutral.compatibility.readyForRmxpCompilation === false, "un .pkregion nunca se declara compilable directamente");
check(neutral.landmarks.filter((entry) => entry.episode.status === "approved").length === expectedApproved, `el plano distingue ${expectedApproved} episodios aprobados`);
check(neutral.landmarks.filter((entry) => entry.episode.status === "pending").length === 40 - expectedApproved, `el plano mantiene ${40 - expectedApproved} anclas pendientes`);

const studioReference = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_studio_reference.json"), "utf8"));
check(studioReference.integrity.ok, "el manifiesto de autoría estilo Studio tiene integridad referencial");
check(studioReference.records.length === 40, "Studio reference indexa las 40 anclas");
check(studioReference.records.filter((entry) => entry.state === "approved-and-compiled").length === expectedApproved, `Studio reference separa ${expectedApproved} episodios compilados`);
check(studioReference.records.filter((entry) => entry.state === "planned").length === 40 - expectedApproved, `Studio reference reserva ${40 - expectedApproved} registros futuros`);
check(studioReference.inspiredBy.containsPokemonStudioCode === false, "el manifiesto no copia código de Pokémon Studio");
check(studioReference.inspiredBy.isPsdkProject === false, "el manifiesto no se presenta como proyecto PSDK");
check(studioReference.records.every((entry) => entry.progression.freeReturnMapId === 1001), "todos los registros conservan retorno libre");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "studio-adapter-"));
try {
  fs.writeFileSync(path.join(temp, "project.studio"), JSON.stringify({
    title: "Fixture neutral",
    studioVersion: STUDIO_VERSION,
    iconPath: "graphics/icons/game.png",
    languagesTranslation: [{ code: "es", name: "Español" }],
  }));
  const dataRoot = path.join(temp, "Data", "Studio");
  for (const collection of STUDIO_COLLECTIONS) {
    const folder = path.join(dataRoot, collection);
    fs.mkdirSync(folder, { recursive: true });
    if (!["maps", "events"].includes(collection)) fs.writeFileSync(path.join(folder, "fixture.json"), JSON.stringify({ id: 1, dbSymbol: `${collection}_fixture` }));
  }
  const inspection = inspectStudioProject(temp);
  check(inspection.integrity.ok, "el inspector abre un proyecto Studio 2.11.0 de solo lectura");
  check(inspection.compatibility.directImportAllowed === false, "el inspector bloquea importación PSDK directa");
  check(inspection.collections.pokemon.dbSymbols === 1, "el inspector indexa dbSymbol por colección");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const style = buildAtlasStyleReport();
check(style.integrity.ok, "los 40 mapas superan compatibilidad técnica de estilo");
check(style.summary.technicalPassed === 40, "style gate aprobó 40/40 anclas");
check(style.summary.customGeometry === expectedCustomMaps, `style gate reconoce ${expectedCustomMaps}/40 anclas con composición propia`);
check(style.summary.exactInheritedGeometry === 40 - expectedCustomMaps, `style gate conserva ${40 - expectedCustomMaps}/40 anclas con geometría totalmente heredada`);
check(style.summary.staticCompositionPending === 40 - expectedCustomMaps, "el backlog visual está derivado de la geometría real");
check(style.summary.artReviewRequired === 40, "ningún mapa se certifica visualmente sin revisión humana");
check(style.summary.gamePreviewRequired === 40, "las 40 anclas siguen requiriendo Game.exe");
check(style.scope.finalGamePreviewStillRequired === true, "la prueba dentro de Game.exe sigue siendo obligatoria");

check(tier2Blueprints.length > 0 && tier2Blueprints.length % 5 === 0, `los manifiestos definen ${tier2Blueprints.length} rutas Tier 2 en lotes completos`);
check(tier2QaReports.reduce((sum, report) => sum + report.summary.passed, 0) === tier2Blueprints.length && tier2QaReports.every((report) => report.summary.failed === 0), `las ${tier2Blueprints.length} rutas Tier 2 superan su QA dedicado`);
check(new Set(tier2Blueprints.map((entry) => entry.mapId)).size === tier2Blueprints.length, "los mapas Tier 2 de autoría son únicos");
check(new Set(tier2Blueprints.map((entry) => entry.flag)).size === tier2Blueprints.length, "los switches Tier 2 reservados son únicos");
check(new Set(tier2Blueprints.map((entry) => entry.variable)).size === tier2Blueprints.length, "las variables de decisión Tier 2 son únicas");
check(new Set(tier2Blueprints.map((entry) => entry.reward.item)).size === tier2Blueprints.length, "las recompensas Tier 2 son únicas en el catálogo acumulado");
check(new Set(tier2NpcNames).size === tier2NpcNames.length, "los NPCs Tier 2 tienen nombres únicos");
check(new Set(tier2DialogueLines).size === tier2DialogueLines.length, "el catálogo Tier 2 no repite líneas de diálogo");
const sortedTier2Flags = tier2Blueprints.map((entry) => entry.flag).sort((left, right) => left - right);
check(sortedTier2Flags[0] === 748 && sortedTier2Flags.every((flag, index) => index === 0 || flag === sortedTier2Flags[index - 1] + 1), "los switches Tier 2 forman una reserva continua sin huecos");
check(tier2Blueprints.every((entry) => entry.npcs.length === 2 && entry.decision.options.length === 2 && entry.progression.switchId === entry.flag && entry.progression.decisionVariable === entry.variable && entry.safety.bagAlwaysAvailable && entry.safety.noForcedBattle && entry.safety.existingChallengePreserved && entry.safety.freeReturn && entry.safety.rewardOnce), "cada ruta Tier 2 conserva dos NPCs, decisión persistente y garantías de seguridad");
check(tier2Blueprints.every((entry) => {
  const events = parseMap(readMarshalData(`Map${entry.mapId}.rxdata`)).events.map(({ obj }) => parseEvent(obj));
  return events.filter((event) => event.name.startsWith("PokeMod Tier2:")).length === 2
    && (entry.safety.baseChallengeExpected === false || events.some((event) => event.name.startsWith("Atlas desafío")))
    && events.some((event) => event.name === "Return to Puerto Horizonte");
}), `las ${tier2Blueprints.length} rutas compiladas conservan el desafío base cuando existe, dos NPCs y retorno libre`);

// --- Tier 3: reglas locales de los Ecos ---------------------------------------
const tier3Catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier3_rules.json"), "utf8"));
const tier3Entries = tier3Catalog.entries ?? [];
const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const atlasCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8"));
const challengeMaps = new Set(atlasCatalog.suggestions.map((entry) => Number(entry.mapId)));
const tier3WithoutChallenge = hierarchy.maps.filter((entry) => entry.tier === 3 && !challengeMaps.has(entry.mapId)).map((entry) => entry.mapId).sort((a, b) => a - b);
check(tier3Entries.length === 420, `el catálogo Tier 3 define ${tier3Entries.length}/420 reglas locales`);
check(tier3Catalog.guarantees?.bagAlwaysAvailable && tier3Catalog.guarantees?.noForcedBattle && tier3Catalog.guarantees?.freeReturn && tier3Catalog.guarantees?.reversibleDecision && tier3Catalog.guarantees?.usesGlobalSwitches === false && tier3Catalog.guarantees?.usesGlobalVariables === false, "el catálogo Tier 3 declara Mochila libre, sin combates, retorno libre y 0 flags globales");
check(new Set(tier3Entries.map((entry) => entry.mapId)).size === 420 && tier3Entries.map((entry) => entry.mapId).sort((a, b) => a - b).join() === tier3WithoutChallenge.join(), "las reglas cubren exactamente los Ecos sin desafío Atlas");
check(tier3Entries.every((entry) => entry.echoId === entry.mapId - 1020 && entry.tier === 3 && entry.anomaly && entry.rule?.name && entry.rule?.rules?.length === 3 && entry.rule?.outcome && entry.flavor?.includes("Eco")), "cada regla Tier 3 identifica su eco, su anomalía y tres reglas de contrajuego");
check(new Set(tier3Catalog.families).size === 14 && tier3Entries.every((entry) => tier3Catalog.families.includes(entry.family)), "las 420 reglas pertenecen a las 14 familias de anomalía declaradas");
check(tier3Entries.every((entry) => !/\b67[45]\b/.test([entry.anomaly, entry.flavor, entry.rule.name, entry.rule.outcome, ...entry.rule.rules].join(" "))), "ningún texto Tier 3 menciona los switches 674/675");
const tier3Compiled = tier3Entries.every((entry) => {
  const events = parseMap(readMarshalData(`Map${String(entry.mapId).padStart(3, "0")}.rxdata`)).events.map(({ obj }) => parseEvent(obj));
  const rules = events.filter((event) => event.name.startsWith("PokeMod Tier3:"));
  const commands = rules.flatMap((event) => event.pages.flatMap((page) => page.list));
  return rules.length === 1
    && events.some((event) => event.name === "Return to Puerto Horizonte")
    && events.some((event) => event.name === `Atlas Tier 3 Beacon ${entry.mapId}`)
    && commands.some((command) => command.getIvar("code") === 102)
    && commands.some((command) => command.getIvar("code") === 123 && Number(command.getIvar("parameters")?.[1]) === 0);
});
check(tier3Compiled, "las 420 reglas compiladas conservan baliza, retorno, microdecisión y self-switch A");

const snowpoint = parseMap(readMarshalData("Map625.rxdata"));
const arceusPortal = snowpoint.events.map(({ obj }) => parseEvent(obj)).find((event) => event.name === "Portal a la Ruta de Dios");
check(Boolean(arceusPortal) && arceusPortal.x === 20 && arceusPortal.y === 3 && arceusPortal.pages[0]?.condition?.switch1 === 0,
  "el portal de Arceus aparece en Puntaneva aunque una partida antigua haya perdido la flag 870");
const directPackagePortal = parseMap(marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Map625.rxdata"))));
const directPortal = directPackagePortal.events.map(({ obj }) => parseEvent(obj)).find((event) => event.name === "Portal a la Ruta de Dios");
check(Boolean(directPortal) && directPortal.pages[0]?.condition?.switch1 === 0,
  "el paquete directo conserva el portal de recuperación sin condición");
const snowpointGuide = snowpoint.events.map(({ obj }) => parseEvent(obj)).find((event) => event.name === "Volus — Guía Celestial");
check(Boolean(snowpointGuide) && snowpointGuide.x === 20 && snowpointGuide.y === 15 && snowpointGuide.pages[0]?.condition?.switch1 === 870,
  "Puntaneva muestra al segundo Volus después de hablar con el primero");
const approach = parseMap(readMarshalData("Map2030.rxdata"));
const approachEvents = approach.events.map(({ obj }) => parseEvent(obj));
check(approach.width === 52 && approach.height === 72 &&
  approachEvents.some((event) => event.name === "Puerta de la Cima del Génesis") &&
  approachEvents.some((event) => event.name === "Regreso a Ciudad Puntaneva"),
  "la aproximación celestial conserva una montaña larga con entrada y retorno");
const directApproach = parseMap(marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Map2030.rxdata"))));
check(directApproach.width === 52 && directApproach.height === 72,
  "el paquete directo incluye la montaña celestial previa a los siete pisos");

// --- Archivo descargable corregido --------------------------------------------
const gameScripts = readMarshalData("Scripts.rxdata");
const downloadableScripts = marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Scripts.rxdata")));
check(downloadableScripts.length === gameScripts.length, "el Scripts.rxdata descargable conserva todas las secciones");
const scriptChanges = downloadableScripts.flatMap((row, index) => {
  const original = gameScripts[index];
  const sameMetadata = row[0] === original[0] && row[1].text === original[1].text;
  const source = zlib.inflateSync(Buffer.from(original[2].bytes)).toString("utf8");
  const corrected = zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
  if (!sameMetadata) return [{ index, name: row[1].text, invalidMetadata: true }];
  return source === corrected ? [] : [{ index, name: row[1].text, source, corrected }];
});
const grandeurChange = scriptChanges.find((change) => change.name === "Grandeur Club");
const characterChange = scriptChanges.find((change) => change.name === "Game_Character");
const eventChange = scriptChanges.find((change) => change.name === "Game_Event");
const playerChange = scriptChanges.find((change) => change.name === "Game_Player");
const startGameChange = scriptChanges.find((change) => change.name === "StartGame");
const fastForwardChange = scriptChanges.find((change) => change.name === "BetterFastForward");
check(scriptChanges.length === 6 && grandeurChange && characterChange && eventChange && playerChange && startGameChange && fastForwardChange,
  "el archivo descargable solo cambia Grandeur Club, colisiones y rutas de ajustes");
check(grandeurChange.corrected === grandeurChange.source.replace("end\nend\r\n\r\ndef givePassive", "end\n\r\ndef givePassive"),
  "Grandeur Club conserva la corrección del end sobrante");
check(!/(?<=\n)end\r?\nend\r?\n\r?\ndef givePassive\b/.test(grandeurChange.corrected),
  "el script descargable no contiene un end extra antes de givePassive");
check(characterChange.corrected.includes("next if event.through && event.character_name == \"\"") &&
  characterChange.corrected.includes("Los eventos con gráfico son sólidos"),
  "Game_Character bloquea sprites aunque la página del evento marque Through");
check(eventChange.corrected.includes("@through              = @page.through && @character_name == \"\"") &&
  eventChange.corrected.includes("Through solo vale para eventos invisibles"),
  "Game_Event hace sólidos los eventos con character_name al refrescarse");
check(playerChange.corrected.includes("event.over_trigger? && event.character_name == \"\"") &&
  (playerChange.corrected.match(/event\.over_trigger\? && event\.character_name/g) || []).length === 5,
  "Game_Player conserva la interacción con sprites sólidos");
check(!startGameChange.corrected.includes("save_data($PokemonSystem, SYSTEM_SETTINGS_FILE)") &&
  !startGameChange.corrected.includes("Save Files/PokemonSystemSettings.dat") &&
  startGameChange.corrected.includes("SaveData.save_to_file(save_file)"),
  "la partida principal no depende del archivo auxiliar PokemonSystemSettings");
check(!fastForwardChange.corrected.includes("save_data(speed, SPEED_SETTING_FILE)") &&
  !fastForwardChange.corrected.includes("Save Files/GameSpeedSetting.dat"),
  "la velocidad no depende de una carpeta Save Files inexistente");

// --- Mochila libre en el Grandeur Club ---------------------------------------
const scriptsRow = (name) => {
  for (const entry of readMarshalData("Scripts.rxdata")) {
    const label = entry.getIvar ? entry.getIvar("name") : entry[1];
    const text = label?.text ?? String(label ?? "");
    if (text === name) return entry;
  }
  return null;
};
const inflateSection = (name) => {
  const row = scriptsRow(name);
  const bytes = row?.getIvar ? row.getIvar("script")?.bytes ?? row.getIvar("script") : row?.[2]?.bytes;
  return zlib.inflateSync(Buffer.from(bytes)).toString("utf8");
};
const useItemCode = inflateSection("Battle_Action_UseItem");
check(useItemCode.includes("switch 674 (NO ITEM INBATT) no longer blocks"), "Battle_Action_UseItem aplica el parche de Mochila libre");
check(!/\$game_switches\s*\[\s*674\s*\]/.test(useItemCode), "pbCanUseItemOnPokemon? ya no consulta el switch 674");
check(useItemCode.includes("PBEffects::Embargo") && useItemCode.includes("itemsRemaining == 0"), "pbCanUseItemOnPokemon? conserva Embargo y el límite de objetos por combate");
const phaseCommandCode = inflateSection("Battle_Phase_Command");
check(phaseCommandCode.includes("switch 674 no longer disables") && !/\$game_switches\s*\[\s*674\s*\]/.test(phaseCommandCode) && phaseCommandCode.includes("if !@internalBattle"), "pbItemMenu conserva Mochila libre y la regla de combates externos");

// --- Torre del Grandeur Club e hub del laboratorio de Oak ---------------------
const towerLocks = [141, 151, 214].flatMap((mapId) => parseMap(readMarshalData(`Map${mapId}.rxdata`)).events)
  .flatMap(({ obj }) => parseEvent(obj)).flatMap((event) => event.pages.flatMap((page) => page.list))
  .filter((command) => command.getIvar("code") === 121 && Number(command.getIvar("parameters")?.[2]) === 0 && Number(command.getIvar("parameters")?.[0]) <= 674 && Number(command.getIvar("parameters")?.[1]) >= 674);
check(towerLocks.length === 8, `la torre conserva sus 8 activaciones originales del switch 674 (${towerLocks.length})`);
const oakLab = parseMap(readMarshalData("Map048.rxdata")).events.map(({ obj }) => parseEvent(obj));
const hubEvents = oakLab.filter((event) => event.name.startsWith("PokeMod Hub:"));
check(hubEvents.length === 5, `el laboratorio de Oak tiene ${hubEvents.length}/5 eventos del hub postgame`);
check(hubEvents.every((event) => event.pages.length === 2 && event.pages[1].condition?.switch1 === 429), "todo el hub del laboratorio depende del switch 429 de postgame");
const hubPod = hubEvents.find((event) => event.name.endsWith("Transportador"));
const hubTransfers = hubPod ? hubPod.pages[1].list.filter((command) => command.getIvar("code") === 201).map((command) => Number(command.getIvar("parameters")?.[1])) : [];
check(hubTransfers.join() === "997,1000,1001,1021,2021", `la cápsula nueva enlaza Isla Espejo, Bosque, Horizontes, Atlas y Monte Silver (${hubTransfers.join()})`);
const hubGates = hubPod ? hubPod.pages[1].list.filter((command) => command.getIvar("code") === 111 && Number(command.getIvar("parameters")?.[0]) === 0).map((command) => Number(command.getIvar("parameters")?.[1])) : [];
check([701, 704, 706].every((flag) => hubGates.includes(flag)), "las señales del hub se calibran con los switches 701/704/706 de la progresión real");
const originalDoors = oakLab.filter((event) => [15, 16].includes(event.id));
check(originalDoors.length === 2 && originalDoors.every((event) => event.pages[1]?.condition?.switch1 === 429 && event.pages[1].list.some((command) => command.getIvar("code") === 201)), "los transportadores originales siguen intactos y condicionados por el postgame");
const towerDoor = originalDoors.find((event) => event.id === 16);
check(Boolean(towerDoor) && towerDoor.pages[1].list.some((command) => command.getIvar("code") === 201 && Number(command.getIvar("parameters")?.[1]) === 141), "la puerta de la torre sigue llevando al mapa 141 (SECRET PEAK)");

// --- Monte Silver: Emisiones Prohibidas (multiverso creepypasta) -------------
const multiverse = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
check(multiverse.maps.length === 9 && multiverse.bosses.length === 7 && multiverse.champion.mapId === 2022, "el catálogo del multiverso define 9 mapas, 7 emisiones y al Campeón Silencioso");
check(multiverse.guarantees.reinterpretedHomagesOnly && multiverse.guarantees.existingAssetsOnly && multiverse.guarantees.canLoseEveryBattle && multiverse.guarantees.permanentDefeat && multiverse.guarantees.optionalRematchByMenu && multiverse.guarantees.freeReturn, "el multiverso declara homenajes reinterpretados, canLose, derrota permanente, revancha por menú y retorno libre");
const multiverseRoster = [...multiverse.bosses, multiverse.champion];
check(new Set(multiverseRoster.map((entry) => entry.reward)).size === multiverseRoster.length, "las recompensas del multiverso son únicas");
check(multiverseRoster.every((entry) => entry.team.length <= 6 && entry.team.every(([, level]) => level <= 150)), "los equipos del multiverso respetan 6 Pokémon y nivel 150");
check(multiverseRoster.every((entry) => {
  const events = parseMap(readMarshalData(`Map${entry.mapId}.rxdata`)).events.map(({ obj }) => parseEvent(obj));
  const battle = events.find((event) => event.name.includes(entry.name));
  return Boolean(battle) && battle.pages.length === 2 && battle.pages[1].condition.selfSwitch === "A"
    && battle.pages[0].list.some((command) => command.getIvar("code") === 111 && /pbTrainerBattle/.test(String(command.getIvar("parameters")[1])))
    && battle.pages[1].list.some((command) => command.getIvar("code") === 102);
}), "los 8 jefes del multiverso quedan derrotados para siempre y solo revanchan por menú");

// --- Zonas salvajes -----------------------------------------------------------
const wild = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "wild_zones.json"), "utf8"));
check(wild.zones.length === 13, `el catálogo define ${wild.zones.length}/13 zonas salvajes`);
check(wild.zones.every((zone) => Object.values(zone.types).every((slots) => slots.every(([, species, min, max]) => min >= 1 && max >= min && max <= 150))), "las tablas salvajes respetan niveles 1-150");
check(wild.zones.some((zone) => zone.mapId === 2021) && wild.zones.some((zone) => zone.mapId === 1000) && wild.zones.some((zone) => zone.types.Water), "hay Monte Silver, Bosque Susurrante y encuentros de agua (surf)");
{
  const species = new Set();
  for (const [key] of readMarshalData("species.dat").pairs) if (key.name) species.add(key.name);
  check(wild.zones.every((zone) => Object.values(zone.types).every((slots) => slots.every(([, sp]) => species.has(sp)))), "todas las especies salvajes existen en Fire Ash");
}
{
  const encounters = readMarshalData("encounters.dat").pairs;
  check(wild.zones.every((zone) => {
    const entry = encounters.find(([key]) => (key.name ?? String(key)) === `${zone.mapId}_0`)?.[1];
    return Boolean(entry) && Object.keys(zone.types).every((type) => (entry.getIvar("@types").pairs.some(([key]) => key.name === type)));
  }), "las 13 tablas están instaladas en encounters.dat");
}

console.log(`\nExternal authoring: ${passed} OK, ${failed} fallos.`);
if (failed) process.exitCode = 1;
