#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import zlib from "node:zlib";
import path from "node:path";
import { validatePkregion } from "./region_builder_adapter.mjs";
import { verify as verifyDirectPackage } from "./build_direct_package.mjs";
import { inspectStudioProject, STUDIO_COLLECTIONS, STUDIO_VERSION } from "./pokemon_studio_adapter.mjs";
import { buildAtlasStyleReport } from "./atlas_style_gate.mjs";
import { ROOT, loadFireAshRegistry, readMarshalData } from "./lib/fire_ash_registry.mjs";
import { marshalLoad, RString, RSymbol } from "../web/js/marshal.js";
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
check(Boolean(arceusPortal) && arceusPortal.x === 20 && arceusPortal.y === 14 &&
  arceusPortal.pages[0]?.condition?.switch1 === 0 && arceusPortal.pages[0]?.graphic?.charName === "ARCEUS_GATE",
  "el portal de Arceus aparece en Puntaneva con un aro de luz accesible aunque se haya perdido la flag 870");
const directPackagePortal = parseMap(marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Map625.rxdata"))));
const directPortal = directPackagePortal.events.map(({ obj }) => parseEvent(obj)).find((event) => event.name === "Portal a la Ruta de Dios");
const directSupportSprites = ["ARC_Cynthia.png", "ARC_Ethan.png", "ARC_Steven.png", "SECRET_Red.png", "SECRET_Volo.png"];
check(Boolean(directPortal) && directPortal.pages[0]?.condition?.switch1 === 0 &&
  fs.existsSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Graphics", "Characters", "ARCEUS_GATE.png")) &&
  fs.existsSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Graphics", "Characters", "SQUIRTLE.png")) &&
  directSupportSprites.every((file) => fs.existsSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Graphics", "Characters", file))),
  "el paquete directo conserva el portal, al Squirtle y los cinco sprites de apoyo cinematográfico");
const snowpointGuide = snowpoint.events.map(({ obj }) => parseEvent(obj)).find((event) => event.name === "Volus — Guía Celestial");
check(Boolean(snowpointGuide) && snowpointGuide.x === 20 && snowpointGuide.y === 16 && snowpointGuide.pages[0]?.condition?.switch1 === 870,
  "Puntaneva muestra al segundo Volus después de hablar con el primero");
const snowpointSquirtle = snowpoint.events.map(({ obj }) => parseEvent(obj)).find((event) => event.name === "Squirtle — Paso Temporal");
check(Boolean(snowpointSquirtle) && snowpointSquirtle.x === 19 && snowpointSquirtle.y === 55 && snowpointSquirtle.pages[0]?.graphic?.charName === "SQUIRTLE" &&
  !snowpoint.events.map(({ obj }) => parseEvent(obj)).some((event) => event.name === "Brandon" || event.name.includes("Regigigas")),
  "la plaza del templo queda libre y Squirtle ofrece el paso temporal junto al Charmeleon");
const approach = parseMap(readMarshalData("Map2038.rxdata"));
const approachEvents = approach.events.map(({ obj }) => parseEvent(obj));
check(approach.width === 52 && approach.height === 72 &&
  approachEvents.some((event) => event.name === "Puerta de la Cima del Génesis") &&
  approachEvents.some((event) => event.name === "Regreso a Ciudad Puntaneva"),
  "la aproximación celestial está en Map2038 y conserva una montaña larga con entrada y retorno");
const grotto = parseMap(readMarshalData("Map2030.rxdata"));
const grottoEvents = grotto.events.map(({ obj }) => parseEvent(obj));
check(grotto.width === 68 && grotto.height === 46 &&
  grottoEvents.some((event) => event.name.includes("Puerta 1")) &&
  !grottoEvents.some((event) => event.name === "Puerta de la Cima del Génesis"),
  "Map2030 sigue siendo la Gruta de los Testigos y no se reemplaza por la aproximación");
const directApproach = parseMap(marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Map2038.rxdata"))));
const directGrotto = parseMap(marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Data", "Map2030.rxdata"))));
check(directApproach.width === 52 && directApproach.height === 72 && directGrotto.width === 68 && directGrotto.height === 46,
  "el paquete directo conserva Map2030 como gruta y Map2038 como aproximación");
let directZipError = null;
try {
  verifyDirectPackage();
} catch (error) {
  directZipError = error.message;
}
check(directZipError === null,
  directZipError === null
    ? "el ZIP descargable está al día con Paquete_directo/"
    : `el ZIP descargable está desactualizado: ${directZipError}`);
const gameScriptRows = readMarshalData("Scripts.rxdata");
const rutaScript = zlib.inflateSync(Buffer.from(gameScriptRows.find((row) => row[1].text === "PokeMod_RutaDeDios")[2].bytes)).toString("utf8");
check(rutaScript.includes("SNOWPOINT_PASS_SWITCH = 877") && rutaScript.includes("pbSnowpointTreeCell?") &&
  rutaScript.includes("class Game_Map") && rutaScript.includes("class Game_Player"),
  "el paso entre árboles está limitado a Puntaneva y se reinicia al cargar otro mapa");
check(rutaScript.includes("pbStartArceusDivineBattle") &&
  rutaScript.includes("RUTA_ARCEUS_SEAL_FLOORS") && rutaScript.includes("pbArceusPseudoPC") &&
  rutaScript.includes("pbArceusSurrenderSequence") && rutaScript.includes("pbArceusCopyActive") &&
  rutaScript.includes("pbArceusCinematicPrelude") && rutaScript.includes("PokemonSprite"),
  "Arceus conserva batalla por fases, pseudo-PC, copia del activo, rendición y prólogo cinematográfico");
check(rutaScript.includes("def ruta_arceus_pokedex") &&
  rutaScript.includes("defined?($player)") && rutaScript.includes("defined?($Trainer)") &&
  rutaScript.includes("owner.respond_to?(:pokedex)") &&
  rutaScript.includes("pokedex.register_battled") && !rutaScript.includes("pbPlayer.pokedex"),
  "pbSetSeen/pbSetBattled resuelven la Pokédex global en v19–v21 sin invocarla sobre NPCTrainer");
const mirrorIsland = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "packs", "isla_espejo.json"), "utf8"));
const ancestralCynthia = mirrorIsland.bosses.find((trainer) => trainer.id === "cintia_anc");
const requiredSeenTeam = ["SPIRITOMB", "TOGEKISS", "MILOTIC", "LUCARIO", "ROSERADE", "GARCHOMP"];
check(ancestralCynthia?.team?.length === 6 &&
  requiredSeenTeam.every((species) => ancestralCynthia.team.some((pokemon) => pokemon.species === species)) &&
  rutaScript.includes("party = pbParty(battler.index)") &&
  rutaScript.includes("pokedex.register(species, gender, form)"),
  "el equipo de Cintia registra como vistos sus seis Pokémon al aparecer el primer rival");
const cpuBattleCount = (rutaScript.match(/pbArceusCinematicCpuBattle\(\[/g) || []).length;
check(cpuBattleCount === 3 &&
  rutaScript.includes("PokeBattle_Battle.new(scene, player_party, boss_party,\n                                   player_trainers, [boss_trainer])") &&
  rutaScript.includes("battle.instance_variable_set(:@ruta_arceus_cinematic_mode, true)") &&
  rutaScript.includes("battle.controlPlayer = true") &&
  rutaScript.includes("battle.canRun = false") &&
  rutaScript.includes("battle.expGain = false") &&
  rutaScript.includes("battle.moneyGain = false") &&
  rutaScript.includes("pbBattleAnimation(pbGetTrainerBattleBGM([boss_trainer])") &&
  rutaScript.includes("pbArceusScriptedAction(index, false)") &&
  rutaScript.includes("RUTA_ARCEUS_CINEMATIC_RNG_SEED") &&
  rutaScript.includes("@ruta_arceus_rng_state * 1103515245 + 12345") &&
  rutaScript.includes("_ruta_arceus_original_accuracy_check") &&
  rutaScript.includes("arceus_cinematic_damage(self, amt)") &&
  rutaScript.includes("@ruta_arceus_cinematic_boss, true") &&
  rutaScript.includes("ash_party_state") &&
  rutaScript.includes("old_rules.each { |key, value| $PokemonTemp.battleRules[key] = value }") &&
  !rutaScript.includes("$Trainer.party = player_party"),
  "los tres apoyos conservan la escena de combate, pero sus comandos, azar y desenlace están coreografiados" );
check(rutaScript.includes(":ARC_Cynthia") && rutaScript.includes(":ARC_Steven") &&
  rutaScript.includes(":ARC_Ethan") && rutaScript.includes(":SECRET_Red") &&
  rutaScript.includes(":SECRET_Volo") && rutaScript.includes("\"2v1\"") &&
  rutaScript.includes("\"single\"") && rutaScript.includes(":GIRATINA") &&
  rutaScript.includes("pbArceusCinematicPokemon(:ARCEUS, 200"),
  "Cynthia/Steven, Gold/Eco/Red y Volus/Giratina tienen equipos reales y Arceus de apoyo nivel 200");
check(rutaScript.includes("return 0") && rutaScript.includes("return 4") &&
  rutaScript.includes("if arceus_capture_ready?") &&
  rutaScript.includes("if ArceusSaveSandbox.capture_room?") &&
  rutaScript.includes("100%") && rutaScript.includes("Master Ball"),
  "la captura de Arceus queda bloqueada antes del debilitamiento final y garantizada después");
check(rutaScript.includes("RUTA_ARCEUS_PHASE_PLATES") && rutaScript.includes("pbArceusRotateType") &&
  rutaScript.includes("RUTA_ARCEUS_SEAL_FLOORS = [0.72, 0.55, 0.38, 0.22]") &&
  rutaScript.includes("target_phase = [@arceus_seals + 1, 6].min") &&
  rutaScript.includes("@ruta_arceus_seal_move_key") &&
  !rutaScript.includes("RUTA_ARCEUS_PHASE_THRESHOLDS") &&
  rutaScript.includes("pbArceusSummon") && rutaScript.includes(":MEW") &&
  rutaScript.includes(":GIRATINA") && rutaScript.includes("pbArceusScaleSprite") &&
  rutaScript.includes("def pbStartBattleSendOut(sendOuts)") &&
  rutaScript.includes("class PokeBattle_Scene"),
  "Arceus avanza por cinco sellos fijos, una fase por golpe y con apariciones/efectos personalizados");
const summitRaw = readMarshalData("Map2037.rxdata");
const summitBoss = summitRaw.getIvar("events").pairs.find(([, event]) =>
  (event.getIvar("name")?.text ?? "").includes("Arceus Creador"))?.[1];
const summitToneCommands = summitBoss?.getIvar("pages")?.[0]?.getIvar("list")?.filter((command) =>
  Number(command.getIvar("code")) === 223) ?? [];
check(summitToneCommands.length >= 2 && summitToneCommands.every((command) => {
  const tone = command.getIvar("parameters")?.[0];
  return tone?.className === "Tone" && tone?.bytes?.length === 32;
}), "los comandos de pantalla de Arceus serializan Tone como objeto RMXP, no como String");
const cinematicAllies = summitRaw.getIvar("events").pairs
  .map(([, event]) => event)
  .filter((event) => (event.getIvar("name")?.text ?? "").startsWith("Apoyo —"));
const cinematicSwitches = cinematicAllies.flatMap((event) => event.getIvar("pages").map((page) =>
  Number(page.getIvar("condition")?.getIvar("switch1_id"))));
check(cinematicAllies.length === 5 && [878, 879, 880].every((id) => cinematicSwitches.includes(id)),
  "Map2037 contiene los cinco entrenadores de apoyo en tres entradas coreografiadas");
const fireAshRegistry = loadFireAshRegistry();
const supportPokemonCalls = [...rutaScript.matchAll(/pbArceusCinematicPokemon\(:([A-Z0-9_]+),\s*(\d+),\s*\[([^\]]*)\],\s*(?::([A-Z0-9_]+))?\)/g)];
const supportSpecies = supportPokemonCalls.map((match) => match[1]);
const supportMoves = supportPokemonCalls.flatMap((match) => [...match[3].matchAll(/:([A-Z0-9_]+)/g)].map((move) => move[1]));
const supportItems = supportPokemonCalls.map((match) => match[4]).filter(Boolean);
const supportLevelErrors = supportPokemonCalls.filter((match) => Number(match[2]) > (match[1] === "ARCEUS" ? 200 : 150));
check(supportPokemonCalls.length === 25 && supportSpecies.every((id) => fireAshRegistry.speciesById.has(id)) &&
  supportMoves.every((id) => fireAshRegistry.moves.has(id)) && supportItems.every((id) => fireAshRegistry.items.has(id)) &&
  supportLevelErrors.length === 0 && rutaScript.includes("safe_level = [[level.to_i, 1].max, max_level].min") &&
  rutaScript.includes('raise ArgumentError.new("Level #{level} is invalid.")') &&
  (rutaScript.match(/pkmn\.ev\[:HP\] = 6/g) || []).length === 1 && rutaScript.includes("boss.ev[:HP] = 6"),
  "los equipos cinemáticos usan especies/movimientos/objetos existentes y respetan el tope de nivel");
const phaseMoveBlock = rutaScript.match(/RUTA_ARCEUS_MOVE_SETS = \[(.*?)\n\]/s)?.[1] ?? "";
const phaseMoves = [...phaseMoveBlock.matchAll(/:([A-Z0-9_]+)/g)].map((match) => match[1]);
check(phaseMoves.length > 0 && phaseMoves.every((id) => fireAshRegistry.moves.has(id)),
  "los seis sets de movimientos de Arceus existen en los datos del juego");
const requiredTrainerTypes = ["ARC_Cynthia", "ARC_Steven", "ARC_Ethan", "SECRET_Red", "SECRET_Volo", "LEGENDARYPOKEMON"];
check(requiredTrainerTypes.every((id) => fireAshRegistry.trainerTypes.has(id)),
  "los tipos de entrenador de las batallas cinemáticas y de Arceus están registrados");
const voloVersion4Exists = readMarshalData("trainers.dat").pairs.some(([key]) => Array.isArray(key) &&
  key[0] instanceof RSymbol && key[0].name === "SECRET_Volo" &&
  key[1] instanceof RString && key[1].text === "Volo" && key[2] === 4);
check(voloVersion4Exists,
  "los datos del juego contienen la versión 4 del equipo de Volus usada por el evento");
const nonArceusLevel200Entries = [];
for (const [, trainer] of readMarshalData("trainers.dat").pairs) {
  for (const pokemon of trainer.getIvar("@pokemon") ?? []) {
    const fields = new Map((pokemon.pairs ?? []).map(([key, value]) => [key instanceof RSymbol ? key.name : "", value]));
    const species = fields.get("species") instanceof RSymbol ? fields.get("species").name : "";
    if (Number(fields.get("level")) === 200 && species !== "ARCEUS") {
      nonArceusLevel200Entries.push(`trainer:${species}`);
    }
  }
}
for (const [, encounter] of readMarshalData("encounters.dat").pairs) {
  for (const [, rows] of encounter.getIvar("@types")?.pairs ?? []) {
    for (const row of rows ?? []) {
      const species = row?.[1] instanceof RSymbol ? row[1].name : "";
      if (species !== "ARCEUS" && (Number(row?.[2]) === 200 || Number(row?.[3]) === 200)) {
        nonArceusLevel200Entries.push(`encounter:${species}`);
      }
    }
  }
}
const level200Constructor = /(?:Pokemon|PokeBattle_Pokemon)\s*\.\s*new\s*\(\s*(?:(?:PBSpecies::)|:)?(?!ARCEUS\b)[A-Z][A-Z0-9_]*\s*,\s*200\b|pbWildBattle(?:Core)?\s*\(\s*(?:(?:PBSpecies::)|:)?(?!ARCEUS\b)[A-Z][A-Z0-9_]*\s*,\s*200\b/g;
const explicitNonArceusLevel200 = [];
function scanForOtherLevel200(source, label) {
  for (const match of source.matchAll(level200Constructor)) explicitNonArceusLevel200.push(`${label}:${match[0]}`);
}
for (const row of gameScriptRows) {
  try { scanForOtherLevel200(zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8"), `script:${row[1]?.text ?? "unknown"}`); } catch {}
}
function collectEventScriptText(commands = []) {
  const lines = [];
  for (const command of commands) {
    const code = Number(command.getIvar("code"));
    const parameters = command.getIvar("parameters") ?? [];
    if (code === 355 || code === 655) {
      if (parameters[0] instanceof RString) lines.push(parameters[0].text);
    } else if (code === 111 && parameters[1] instanceof RString) {
      lines.push(parameters[1].text);
    }
  }
  return lines.join("\n");
}
const gameDataDirectory = path.join(ROOT, "pokemon_fire_ash", "Data");
for (const file of fs.readdirSync(gameDataDirectory).filter((name) => /^Map\d+\.rxdata$/.test(name))) {
  const map = readMarshalData(file);
  for (const [, event] of map.getIvar("events")?.pairs ?? []) {
    for (const page of event.getIvar("pages") ?? []) {
      scanForOtherLevel200(collectEventScriptText(page.getIvar("list") ?? []), `${file}:${event.getIvar("name")?.text ?? "event"}`);
    }
  }
}
const settingsSource = zlib.inflateSync(Buffer.from(gameScriptRows.find((row) => row[1].text === "Settings")[2].bytes)).toString("utf8");
const levelCapIsArceusOnly = /MAXIMUM_LEVEL\s*=\s*175\b/.test(settingsSource) &&
  rutaScript.includes("max = (@species == :ARCEUS && @ruta_arceus_divine == true) ? 200 : GameData::GrowthRate.max_level") &&
  rutaScript.includes("if value < 1 || value > max") && nonArceusLevel200Entries.length === 0 &&
  explicitNonArceusLevel200.length === 0 &&
  rutaScript.includes("pkmn.instance_variable_set(:@ruta_arceus_divine, false)") &&
  rutaScript.includes("divine ? normal_cap : safe_level");
check(levelCapIsArceusOnly,
  "el nivel 200 queda reservado al Arceus divino (equipos, encuentros y scripts sin otro caso), y el Arceus normal no pasa del techo de 175");
check(rutaScript.includes("$game_switches[RUTA_ARCEUS_CAUGHT_SWITCH] = true") &&
  rutaScript.includes("return :ruta_arceus_hold_at_one") && rutaScript.includes("amt == :ruta_arceus_hold_at_one"),
  "capturar Arceus activa la ruta de Volus y el jefe permanece con 1 HP capturable");
const arceusPage = summitBoss?.getIvar("pages")?.[0];
const arceusCommands = arceusPage?.getIvar("list") ?? [];
function validConditionalIndents(commands) {
  const stack = [];
  for (const command of commands) {
    const code = Number(command.getIvar("code"));
    const indent = Number(command.getIvar("indent"));
    if (code === 111) {
      if (stack.length && indent <= stack.at(-1).indent) return false;
      stack.push({ indent, hasElse: false });
      continue;
    }
    if (code === 411) {
      const top = stack.at(-1);
      if (!top || top.indent !== indent || top.hasElse) return false;
      top.hasElse = true;
      continue;
    }
    if (code === 412) {
      const top = stack.pop();
      if (!top || top.indent !== indent) return false;
      continue;
    }
    if (stack.length && indent <= stack.at(-1).indent) return false;
  }
  return stack.length === 0;
}
const arceusRematchCommands = summitBoss?.getIvar("pages")?.[1]?.getIvar("list") ?? [];
const voloBattlePages = [arceusCommands, arceusRematchCommands];
const voloBattleCalls = voloBattlePages.flatMap((commands) => commands.flatMap((command, index) => {
  const source = command.getIvar("parameters")?.[1]?.text ?? "";
  return Number(command.getIvar("code")) === 111 && source.includes("pbTrainerBattle")
    ? [{ commands, index, command, source }] : [];
}));
const voloVictoryGated = voloBattleCalls.length === 2 && voloBattleCalls.every(({ commands, index, command, source }) => {
  const next = commands[index + 1];
  return source === 'pbTrainerBattle(:SECRET_Volo, "Volo", nil, false, 4, true)' &&
    Number(next?.getIvar("code")) === 121 && Number(next?.getIvar("indent")) === Number(command.getIvar("indent")) + 1 &&
    Number(next?.getIvar("parameters")?.[0]) === 875;
});
const completionGateIndex = arceusCommands.findIndex((command) =>
  Number(command.getIvar("code")) === 111 &&
  (command.getIvar("parameters")?.[1]?.text ?? "").includes("!$game_switches[874] || $game_switches[875]"));
check(validConditionalIndents(arceusCommands) && validConditionalIndents(arceusRematchCommands) &&
  voloVictoryGated && completionGateIndex >= 0 &&
  Number(arceusCommands[completionGateIndex + 1]?.getIvar("parameters")?.[0]) === 876,
  "Map2037 tiene ramas RGSS válidas; Volus usa una versión válida y solo una victoria cierra la ruta");

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
const screenToneChange = scriptChanges.find((change) => change.name === "Game_Screen");
const pictureToneChange = scriptChanges.find((change) => change.name === "Game_Picture");
const sceneMapTransitionChange = scriptChanges.find((change) => change.name === "Scene_Map");
check(scriptChanges.length === 9 && grandeurChange && characterChange && eventChange && playerChange && startGameChange && fastForwardChange && screenToneChange && pictureToneChange && sceneMapTransitionChange,
  "el archivo descargable corrige Grandeur Club, colisiones, guardado, tonos y transiciones");
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
check(screenToneChange.corrected.includes("module PokeModToneSafety") &&
  screenToneChange.corrected.includes("@tone = PokeModToneSafety.normalize(@tone)") &&
  screenToneChange.corrected.includes("@tone_target = PokeModToneSafety.normalize(@tone_target)"),
  "Game_Screen recupera los tonos String heredados sin cerrar el juego");
check(pictureToneChange.corrected.includes("PokeModToneSafety.normalize(tone)") &&
  pictureToneChange.corrected.includes("@tone = PokeModToneSafety.normalize(@tone)"),
  "Game_Picture normaliza tonos antes de interpolarlos");
check(sceneMapTransitionChange.corrected.includes("transition_name = $game_temp.transition_name.to_s") &&
  sceneMapTransitionChange.corrected.includes('if transition_name == ""') &&
  !sceneMapTransitionChange.corrected.includes('"Graphics/Transitions/" + $game_temp.transition_name'),
  "Scene_Map usa la transición predeterminada cuando transition_name es nil");
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
// La Expansión Multiversal retiró la cápsula central: el laboratorio vuelve a
// tener solo sus transportadores originales y Oak como consejero.
const hubEvents = oakLab.filter((event) => event.name.startsWith("PokeMod Hub:"));
check(hubEvents.length === 0, `el laboratorio de Oak conserva ${hubEvents.length} cápsulas del hub (debe ser 0)`);
const labMenus = oakLab.filter((event) => event.name.startsWith("PokeMod"))
  .filter((event) => event.pages.some((page) => new Set(page.list
    .filter((command) => command.getIvar("code") === 201)
    .map((command) => Number(command.getIvar("parameters")?.[1]))).size > 1));
check(labMenus.length === 0, `el laboratorio no debe ofrecer menús de destinos (${labMenus.map((event) => event.name).join(", ")})`);
const oakAdvisor = oakLab.find((event) => event.name === "PokeMod Oak: Registro de Grietas");
check(Boolean(oakAdvisor), "Oak aconseja sobre las lecturas de las grietas en el laboratorio");
check(Boolean(oakAdvisor) && oakAdvisor.pages[1]?.condition?.switch1 === 429, "el Oak consejero depende del switch 429 de postgame");
check(Boolean(oakAdvisor) && !oakAdvisor.pages.some((page) => page.list.some((command) => command.getIvar("code") === 201)), "Oak no teletransporta: solo aconseja");
check(Boolean(oakAdvisor) && oakAdvisor.pages[1].list.some((command) => command.getIvar("code") === 401 && String(command.getIvar("parameters")?.[0] ?? "").includes("\\v[264]")), "Oak lee el contador de purgas (\\v[264])");
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
check(multiverseRoster.every((entry) => entry.team.length <= 6 && entry.team.every(([, level]) => level <= 175)), "los equipos del multiverso respetan 6 Pokémon y el techo de 175");
check(multiverseRoster.every((entry) => {
  const events = parseMap(readMarshalData(`Map${entry.mapId}.rxdata`)).events.map(({ obj }) => parseEvent(obj));
  const battle = events.find((event) => event.name.includes(entry.name));
  return Boolean(battle) && battle.pages.length === 2 && battle.pages[1].condition.selfSwitch === "A"
    && battle.pages[0].list.some((command) => command.getIvar("code") === 111 && /pbTrainerBattle/.test(String(command.getIvar("parameters")[1])))
    && battle.pages[1].list.some((command) => command.getIvar("code") === 102);
}), "los 8 jefes del multiverso quedan derrotados para siempre y solo revanchan por menú");

// --- Zonas salvajes -----------------------------------------------------------
const wild = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "wild_zones.json"), "utf8"));
check(wild.zones.length >= 13, `el catálogo define ${wild.zones.length} zonas salvajes (mínimo 13)`);
check(wild.zones.every((zone) => Object.values(zone.types).every((slots) => slots.every(([, species, min, max]) => min >= 1 && max >= min && max <= 175))), "las tablas salvajes respetan niveles 1-175");
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

const dnPolish = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "dimensional_nightmare_map_polish.json"), "utf8"));
check(dnPolish.auditedMapCount === 151 && dnPolish.auditedMaps.length === 151 &&
  new Set(dnPolish.auditedMaps.map((map) => map.id)).size === 151 &&
  JSON.stringify(dnPolish.cleanupTargets.map((entry) => [entry.id, entry.rows])) ===
    JSON.stringify([[2073, 2], [2074, 2], [2075, 3], [2076, 2], [2077, 3]]) &&
  dnPolish.cleanupTargets.every((entry) => entry.baseline?.eventsSha256 && entry.baseline?.collisionSha256 &&
    entry.baseline?.atlasPixelSha256 && entry.baseline?.outsideBandTileSha256),
  "la depuración DN audita los 151 mapas y limita el artefacto de rótulos a cinco bandas con huellas de integridad");

console.log(`\nExternal authoring: ${passed} OK, ${failed} fallos.`);
if (failed) process.exitCode = 1;
