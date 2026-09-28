#!/usr/bin/env node
/** Inventario verificable de contenido añadido y trabajo/prompt pendiente. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readMarshalData } from "./lib/fire_ash_registry.mjs";
import { parseEvent, parseMap } from "../web/js/rmxp.js";

const content = path.join(ROOT, "content");
const docs = path.join(ROOT, "docs");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJson = (file, value) => fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
const hierarchy = readJson("content/atlas_content_hierarchy.json");
const atlasCatalog = readJson("content/atlas_mil_500.json");
const horizons = readJson("content/horizontes_500.json");
const approved = readJson("content/atlas_tier1_blueprints_approved.json").blueprints;
const prompts = readJson("content/atlas_tier1_prompts.json").prompts;
const studio = readJson("content/atlas_studio_reference.json");
const region = readJson("content/atlas_region_design.json");
const style = readJson("content/atlas_style_baseline.json");
const narrativeBatchFiles = fs.readdirSync(content).filter((file) => /^atlas_tier1_blueprints_batch\d+\.json$/.test(file));
const visualManifestFiles = fs.readdirSync(content).filter((file) => /^atlas_visual_polish_macro\d+\.json$/.test(file));
const visualManifests = visualManifestFiles.map((file) => readJson(`content/${file}`));
const completedVisualBatches = visualManifests.reduce((sum, manifest) => sum + Number(manifest.summary?.visualBatches ?? 0), 0);
const tier2ManifestFiles = fs.readdirSync(content).filter((file) => /^atlas_tier2_blueprints_macro\d+\.json$/.test(file));
const tier2Manifests = tier2ManifestFiles.map((file) => readJson(`content/${file}`));
const completedTier2Batches = tier2Manifests.reduce((sum, manifest) => sum + Number(manifest.tier2Batches ?? 0), 0);
const approvedByMap = new Map(approved.map((entry) => [Number(entry.mapId), entry]));
const promptByMap = new Map(prompts.map((entry) => [Number(entry.mapId), entry]));
const studioByMap = new Map(studio.records.map((entry) => [Number(entry.mapId), entry]));

const atlasMaps = hierarchy.maps.map((entry) => {
  const file = `Map${String(entry.mapId).padStart(3, "0")}.rxdata`;
  const parsed = parseMap(readMarshalData(file));
  const names = parsed.events.map(({ obj }) => parseEvent(obj).name);
  return {
    ...entry,
    file,
    eventCount: names.length,
    hasReturn: names.includes("Return to Puerto Horizonte"),
    hasBeacon: names.some((name) => name === `Atlas Tier ${entry.tier} Beacon ${entry.mapId}`),
    hasGenericChallenge: names.some((name) => name.startsWith("Atlas desafío")),
    hasTier3Rule: names.some((name) => name.startsWith("PokeMod Tier3:")),
    handcraftedEvents: names.filter((name) => name.startsWith("PokeMod Tier1:")).length,
    authoredTier2Events: names.filter((name) => name.startsWith("PokeMod Tier2:")).length,
  };
});

const tier = (number) => atlasMaps.filter((entry) => entry.tier === number);
const tier1 = tier(1);
const tier2 = tier(2);
const tier3 = tier(3);
const authoredTier2 = tier2.filter((entry) => entry.authoredTier2Events === 2);
const pendingTier2 = tier2.filter((entry) => entry.authoredTier2Events !== 2);
const compiledTier1 = tier1.filter((entry) => approvedByMap.has(entry.mapId) && entry.handcraftedEvents === 5);
const pendingTier1 = tier1.filter((entry) => !approvedByMap.has(entry.mapId)).map((entry) => {
  const prompt = promptByMap.get(entry.mapId);
  const studioRecord = studioByMap.get(entry.mapId);
  return {
    mapId: entry.mapId,
    sector: entry.sector,
    sectorName: entry.sectorName,
    promptGenerated: Boolean(prompt?.prompt),
    studioDbSymbol: studioRecord?.dbSymbol ?? null,
    reservedSwitch: studioRecord?.progression?.switchId ?? null,
    reservedDecisionVariable: studioRecord?.progression?.decisionVariable ?? null,
  };
});
const tier3MissingRule = tier3.filter((entry) => !(entry.hasGenericChallenge || entry.hasTier3Rule)).map((entry) => entry.mapId);
const visualPending = style.anchors.filter((entry) => entry.comparison?.exactInheritedGeometry).map((entry) => entry.mapId);
const uniqueApprovedSpecies = new Set(approved.flatMap((blueprint) => blueprint.battle.team.map((pokemon) => pokemon.species))).size;
const batches = (units, size) => Math.ceil(units / size);
const remainingSmallBatchRuns = batches(pendingTier1.length, 5) + batches(visualPending.length, 5) + batches(pendingTier2.length, 5) + batches(tier3MissingRule.length, 20);
const macroPromptCapacity = 5;
const remainingMacroPrompts = batches(remainingSmallBatchRuns, macroPromptCapacity);

const report = {
  version: 1,
  definitions: {
    contentUnit: "Aventura, episodio, jefe o misión diferenciada; no equivale necesariamente a un mapa.",
    promptRun: "Una ejecución de generación/revisión por lote. El número cambia si cambia el tamaño del lote.",
    final: "Solo significa final después de prueba dentro de Game.exe; ningún conteo estático sustituye esa prueba.",
  },
  installed: {
    maps: {
      baseBeforeAdditions: 996,
      mirrorIsland: 3,
      whisperwoodAndHorizons: 21,
      atlas: atlasMaps.length,
      addedTotal: 3 + 21 + atlasMaps.length,
      currentTotal: 2020,
    },
    differentiatedContentUnits: {
      mirrorIslandBossEpisodes: 16,
      hypnoRescueMission: 1,
      horizonsAdventures: horizons.adventures.filter((entry) => entry.implemented).length,
      atlasGenericEventsAndBattles: atlasCatalog.suggestions.filter((entry) => entry.implemented).length,
      atlasHandcraftedAnchorEpisodes: compiledTier1.length,
      atlasAuthoredTier2Routes: authoredTier2.length,
      total: 16 + 1 + horizons.adventures.filter((entry) => entry.implemented).length + atlasCatalog.suggestions.filter((entry) => entry.implemented).length + compiledTier1.length + authoredTier2.length,
      note: "Los episodios Tier 1 y las rutas Tier 2 se superponen a mapas Atlas, pero son eventos narrativos adicionales y no sustituyen el catálogo genérico."
    },
    battlesAndActors: {
      mirrorIslandBosses: 16,
      mirrorIslandFirstAndRematchBattles: 32,
      horizonsTrainerRecords: 100,
      atlasGenericTrainerRecords: 280,
      atlasHandcraftedBosses: compiledTier1.length,
      atlasNamedHandcraftedNpcs: compiledTier1.length * 3,
      atlasHandcraftedMapEvents: compiledTier1.reduce((sum, entry) => sum + entry.handcraftedEvents, 0),
      atlasNamedTier2Npcs: authoredTier2.length * 2,
      atlasTier2AuthoredMapEvents: authoredTier2.reduce((sum, entry) => sum + entry.authoredTier2Events, 0),
      specialWildOrCapturableEncounters: 201,
      compiledTrainerRecordsAdded: 16 + 100 + 280 + compiledTier1.length,
    },
    atlas: {
      sectors: atlasCatalog.sectors.length,
      maps: atlasMaps.length,
      mapsWithReturn: atlasMaps.filter((entry) => entry.hasReturn).length,
      mapsWithTierBeacon: atlasMaps.filter((entry) => entry.hasBeacon).length,
      mapsWithGenericChallenge: atlasMaps.filter((entry) => entry.hasGenericChallenge).length,
      transferInfrastructure: 3039,
      tier1: {
        total: tier1.length,
        approvedBlueprints: approved.length,
        compiledEpisodes: compiledTier1.length,
        generatedPrompts: tier1.filter((entry) => promptByMap.has(entry.mapId)).length,
        namedNpcs: compiledTier1.length * 3,
        persistentDecisions: compiledTier1.length,
        bosses: compiledTier1.length,
        finalConvergencePrerequisiteSeals: approvedByMap.get(1996)?.prerequisiteSeals ?? null,
        completionPercent: Number((compiledTier1.length / tier1.length * 100).toFixed(1)),
      },
      tier2: {
        total: tier2.length,
        infrastructureComplete: tier2.filter((entry) => entry.hasReturn && entry.hasBeacon).length,
        withGenericChallenge: tier2.filter((entry) => entry.hasGenericChallenge).length,
        dedicatedAuthoredRoutes: authoredTier2.length,
        namedNpcs: authoredTier2.length * 2,
        persistentDecisions: authoredTier2.length,
        uniqueRewards: authoredTier2.length,
      },
      tier3: {
        total: tier3.length,
        infrastructureComplete: tier3.filter((entry) => entry.hasReturn && entry.hasBeacon).length,
        withLocalGenericRuleOrChallenge: tier3.filter((entry) => entry.hasGenericChallenge || entry.hasTier3Rule).length,
        withGenericChallenge: tier3.filter((entry) => entry.hasGenericChallenge).length,
        withReversibleLocalRule: tier3.filter((entry) => entry.hasTier3Rule).length,
        missingLocalRule: tier3MissingRule.length,
      },
      authoring: {
        regionBuilderLandmarks: region.landmarks.length,
        compatibleRegionalDexSpecies: region.regionalDex.filter((entry) => entry.compatible).length,
        studioRecords: studio.records.length,
        styleTechnicalPassed: style.summary.technicalPassed,
        exactInheritedAnchorGeometry: style.summary.exactInheritedGeometry,
        customAnchorGeometry: style.summary.customGeometry,
        narrativeBatchesCompleted: narrativeBatchFiles.length,
        visualBatchesCompleted: completedVisualBatches,
        visualMacroCyclesCompleted: visualManifests.length,
        tier2BatchesCompleted: completedTier2Batches,
        tier2MacroCyclesCompleted: tier2Manifests.length,
        approvedTeamSpecies: uniqueApprovedSpecies,
      },
    },
    systems: {
      bagAvailableInInternalBattles: true,
      maximumLevel: 150,
      freeReturnRequired: true,
      canLoseRequiredForStoryBosses: true,
      backupsPerBatch: true,
    },
  },
  workLedger: {
    narrativeBatchesCompleted: narrativeBatchFiles.length,
    visualBatchesCompleted: completedVisualBatches,
    tier2BatchesCompleted: completedTier2Batches,
    totalBatchesCompleted: narrativeBatchFiles.length + completedVisualBatches + completedTier2Batches,
    smallBatchesRemaining: remainingSmallBatchRuns,
    totalTrackedBatches: narrativeBatchFiles.length + completedVisualBatches + completedTier2Batches + remainingSmallBatchRuns,
    batchesPerMacroPrompt: macroPromptCapacity,
    macroPromptsRemaining: remainingMacroPrompts,
  },
  remaining: {
    tier1NarrativeEpisodes: {
      units: pendingTier1.length,
      promptFilesAlreadyGenerated: pendingTier1.filter((entry) => entry.promptGenerated).length,
      promptExecutionsRemaining: pendingTier1.length,
      recommendedBatchSize: 5,
      recommendedPromptRuns: batches(pendingTier1.length, 5),
      maps: pendingTier1,
    },
    anchorVisualPolish: {
      units: visualPending.length,
      reason: `${style.summary.customGeometry}/40 anclas ya tienen una composición de piso propia; ${visualPending.length}/40 todavía conservan geometría fuente exacta. Todas requieren Game.exe antes de certificarse.`,
      recommendedBatchSize: 5,
      recommendedPromptRuns: batches(visualPending.length, 5),
      maps: visualPending,
    },
    tier2AuthoredRoutes: {
      units: pendingTier2.length,
      completedUnits: authoredTier2.length,
      reason: `${authoredTier2.length}/120 rutas ya tienen dos NPCs, objetivo, mecánica, decisión persistente y recompensa única; faltan ${pendingTier2.length}.`,
      recommendedBatchSize: 5,
      recommendedPromptRuns: batches(pendingTier2.length, 5),
      maps: pendingTier2.map((entry) => entry.mapId),
    },
    tier3MissingLocalRules: {
      units: tier3MissingRule.length,
      reason: `${tier3.filter((entry) => entry.hasGenericChallenge).length} Ecos tienen desafío Atlas y ${tier3.filter((entry) => entry.hasTier3Rule).length} tienen regla local reversible; faltan ${tier3MissingRule.length}.`,
      recommendedBatchSize: 20,
      recommendedPromptRuns: batches(tier3MissingRule.length, 20),
      maps: tier3MissingRule,
    },
    manualNonPromptWork: {
      gameExePlaytestsRequired: 40,
      visualClippingAndPacingPasses: 40,
      note: "Estas tareas no deben contarse como prompts: requieren ejecutar y jugar Game.exe."
    },
    promptScenarios: {
      finishTier1NarrativeOnly: {
        contentUnits: pendingTier1.length,
        promptExecutions: pendingTier1.length,
        recommendedBatchRuns: batches(pendingTier1.length, 5),
      },
      staticAnchorCandidate: {
        contentUnits: pendingTier1.length + visualPending.length,
        recommendedBatchRuns: batches(pendingTier1.length, 5) + batches(visualPending.length, 5),
        excludesManualGameExeTesting: true,
      },
      fullLayeredAtlasPolish: {
        contentUnits: pendingTier1.length + visualPending.length + pendingTier2.length + tier3MissingRule.length,
        recommendedBatchRuns: remainingSmallBatchRuns,
        batchesPerMacroPrompt: macroPromptCapacity,
        recommendedMacroPrompts: remainingMacroPrompts,
        batchPlan: {
          tier1: `${batches(pendingTier1.length, 5)} lote de 5`,
          anchorVisuals: `${batches(visualPending.length, 5)} lotes de 5`,
          tier2: `${batches(pendingTier2.length, 5)} lotes de 5`,
          tier3: `${batches(tier3MissingRule.length, 20)} lotes de 20`,
        },
      },
    },
  },
};

const md = [
  "# Estado verificable de contenido y prompts",
  "",
  "> Este informe separa contenido instalado, contenido artesanal, infraestructura y trabajo visual. Un mapa copiado con retorno seguro cuenta como infraestructura, no como mapa visual final.",
  "",
  "## Resumen ejecutivo",
  "",
  `- Mapas añadidos: **${report.installed.maps.addedTotal}** (${report.installed.maps.mirrorIsland} Isla Espejo + ${report.installed.maps.whisperwoodAndHorizons} Bosque/Horizontes + ${report.installed.maps.atlas} Atlas).`,
  `- Unidades diferenciadas instaladas: **${report.installed.differentiatedContentUnits.total}**.`,
  `- Atlas Tier 1 artesanal: **${compiledTier1.length}/40 (${report.installed.atlas.tier1.completionPercent}%)**.`,
  `- Prompts Tier 1 ya escritos: **${report.installed.atlas.tier1.generatedPrompts}/40**; faltan ejecutar **${pendingTier1.length}**.`,
  `- Atlas Tier 2 artesanal: **${authoredTier2.length}/120** rutas; faltan **${pendingTier2.length}**.`,
  `- Infraestructura Atlas con baliza y retorno: **${report.installed.atlas.mapsWithTierBeacon}/${atlasMaps.length}** mapas.`,
  `- Convergencia final: requiere **${report.installed.atlas.tier1.finalConvergencePrerequisiteSeals} sellos previos**; no bloquea la ruta de retorno.`,
  `- Anclas con composición visual propia: **${style.summary.customGeometry}/40**; composición estática pendiente: **${visualPending.length}/40**.`,
  `- Lotes completados: **${report.workLedger.totalBatchesCompleted}/${report.workLedger.totalTrackedBatches}** (${report.workLedger.narrativeBatchesCompleted} narrativos + ${report.workLedger.visualBatchesCompleted} visuales + ${report.workLedger.tier2BatchesCompleted} Tier 2).`,
  `- Quedan **${report.workLedger.smallBatchesRemaining} lotes pequeños**, agrupables en **${report.workLedger.macroPromptsRemaining} prompts** de hasta ${report.workLedger.batchesPerMacroPrompt} lotes.`,
  "",
  "## Contenido instalado",
  "",
  "| Bloque | Cantidad | Estado |",
  "|---|---:|---|",
  `| Isla Espejo | 3 mapas, 16 jefes, 32 combates inicial/revancha | Instalado |`,
  `| Bosque Susurrante + Horizontes | 21 mapas, misión Hypno y ${report.installed.differentiatedContentUnits.horizonsAdventures} aventuras | Instalado |`,
  `| Atlas base | ${atlasMaps.length} mapas, ${report.installed.differentiatedContentUnits.atlasGenericEventsAndBattles} eventos/peleas y 40 sectores | Instalado |`,
  `| Atlas Tier 1 artesanal | ${compiledTier1.length} episodios, ${compiledTier1.length * 3} NPCs, ${compiledTier1.length} jefes y ${compiledTier1.length} decisiones | Instalado |`,
  `| Atlas Tier 2 artesanal | ${authoredTier2.length} rutas, ${authoredTier2.length * 2} NPCs, ${authoredTier2.length} decisiones y ${authoredTier2.length} recompensas únicas | Instalado |`,
  `| Total de unidades diferenciadas | ${report.installed.differentiatedContentUnits.total} | No confundir con mapas |`,
  "",
  "## Qué falta",
  "",
  "| Frente | Unidades | Unidades por lote | Lotes pequeños restantes |",
  "|---|---:|---:|---:|",
  `| Tier 1 narrativo | ${pendingTier1.length} | 5 | ${report.remaining.tier1NarrativeEpisodes.recommendedPromptRuns} |`,
  `| Pulido visual de anclas | ${visualPending.length} | 5 | ${report.remaining.anchorVisualPolish.recommendedPromptRuns} |`,
  `| Tier 2 artesanal | ${pendingTier2.length} | 5 | ${report.remaining.tier2AuthoredRoutes.recommendedPromptRuns} |`,
  `| Reglas faltantes Tier 3 | ${tier3MissingRule.length} | 20 | ${report.remaining.tier3MissingLocalRules.recommendedPromptRuns} |`,
  `| **Pulido completo por capas** | **${report.remaining.promptScenarios.fullLayeredAtlasPolish.contentUnits}** | — | **${report.remaining.promptScenarios.fullLayeredAtlasPolish.recommendedBatchRuns}** |`,
  `| **Prompts agrupando cinco lotes** | — | 5 lotes por prompt | **${report.remaining.promptScenarios.fullLayeredAtlasPolish.recommendedMacroPrompts}** |`,
  "",
  pendingTier1.length ? `## Prompts Tier 1 pendientes (${pendingTier1.length})` : "## Tier 1 narrativo completo",
  "",
  ...pendingTier1.map((entry, index) => `${index + 1}. Mapa **${entry.mapId}**, sector ${entry.sector} — **${entry.sectorName}**; \`${entry.studioDbSymbol}\`; switch ${entry.reservedSwitch}; variable ${entry.reservedDecisionVariable}.`),
  pendingTier1.length
    ? `Los ${pendingTier1.length} textos de prompt ya existen en \`content/atlas_tier1_prompts.json\`. Lo pendiente es ejecutarlos, revisar sus blueprints, compilarlos y probarlos.`
    : "Los 40 prompts Tier 1 fueron ejecutados, aprobados y compilados. No queda autoría narrativa ni composición visual estática Tier 1 pendiente; siguen siendo obligatorias las pruebas manuales.",
  "",
  "## Tres respuestas posibles a “cuántos prompts faltan”",
  "",
  pendingTier1.length
    ? `1. **Para terminar solo las 40 historias Tier 1:** ${pendingTier1.length} prompts individuales, o **${report.remaining.tier1NarrativeEpisodes.recommendedPromptRuns} ejecución por lote de cinco**.`
    : "1. **Para terminar solo las 40 historias Tier 1:** no queda ningún prompt narrativo pendiente.",
  `2. **Para dejar las 40 anclas como candidatas estáticas, incluida composición visual:** **${report.remaining.promptScenarios.staticAnchorCandidate.recommendedBatchRuns} ejecuciones por lotes**.`,
  `3. **Para pulir las tres capas de los 1.000 mapas:** quedan **${report.remaining.promptScenarios.fullLayeredAtlasPolish.recommendedBatchRuns} lotes pequeños**, equivalentes a ${report.remaining.promptScenarios.fullLayeredAtlasPolish.contentUnits} unidades de trabajo y agrupables en **${report.remaining.promptScenarios.fullLayeredAtlasPolish.recommendedMacroPrompts} prompts** de hasta cinco lotes.`,
  "",
  "Además siguen pendientes 40 pruebas manuales en `Game.exe`. No se cuentan como prompts.",
  "",
  "## Criterio de honestidad",
  "",
  `- Los 1.000 mapas Atlas existen y son transitables. ${style.summary.customGeometry} anclas tienen ya una composición de piso propia; los demás mapas conservan geometría heredada en distintos grados.`,
  "- Los 500 desafíos Atlas y las 500 aventuras de Horizontes están instalados, pero no equivalen a 1.000 episodios artesanales.",
  "- Tier 1 sí dispone de blueprint, reparto, decisión, jefe narrativo, curación y retorno.",
  `- Tier 2 tiene ${authoredTier2.length}/120 rutas de autoría dedicada; faltan ${pendingTier2.length}.`,
  `- Tier 3 cubre ${tier3.filter((entry) => entry.hasGenericChallenge || entry.hasTier3Rule).length}/840 Ecos con regla local (${tier3.filter((entry) => entry.hasGenericChallenge).length} desafíos Atlas + ${tier3.filter((entry) => entry.hasTier3Rule).length} reglas reversibles de \`content/atlas_tier3_rules.json\`); faltan ${tier3MissingRule.length}.`,
  "- La certificación final requiere `Game.exe`; ningún linter puede validar ritmo, clipping o sensación de juego.",
  "",
];

fs.mkdirSync(content, { recursive: true });
fs.mkdirSync(docs, { recursive: true });
writeJson("content/atlas_progress.json", report);
fs.writeFileSync(path.join(docs, "ESTADO_CONTENIDO_Y_PROMPTS.md"), md.join("\n"));
console.log(JSON.stringify({
  mapsAdded: report.installed.maps.addedTotal,
  contentUnitsInstalled: report.installed.differentiatedContentUnits.total,
  tier1: `${compiledTier1.length}/40`,
  tier1PromptExecutionsRemaining: pendingTier1.length,
  tier1RecommendedBatchRuns: report.remaining.tier1NarrativeEpisodes.recommendedPromptRuns,
  completedBatches: report.workLedger.totalBatchesCompleted,
  smallBatchesRemaining: report.workLedger.smallBatchesRemaining,
  macroPromptsRemaining: report.workLedger.macroPromptsRemaining,
}, null, 2));
