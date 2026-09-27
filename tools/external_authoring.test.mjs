#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validatePkregion } from "./region_builder_adapter.mjs";
import { inspectStudioProject, STUDIO_COLLECTIONS, STUDIO_VERSION } from "./pokemon_studio_adapter.mjs";
import { buildAtlasStyleReport } from "./atlas_style_gate.mjs";
import { ROOT } from "./lib/fire_ash_registry.mjs";

let passed = 0;
let failed = 0;
function check(condition, message) {
  if (condition) { passed++; console.log(`OK: ${message}`); }
  else { failed++; console.error(`FALLA: ${message}`); }
}

const region = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_region.pkregion"), "utf8"));
const regionValidation = validatePkregion(region);
check(regionValidation.ok, "el .pkregion de Atlas cumple el formato v1");
check(regionValidation.stats.landmarks === 40, "Region Builder contiene los 40 sectores");
check(regionValidation.stats.pokedexEntries === 126, "la Pokédex regional contiene las 126 especies aprobadas");
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
check(neutral.landmarks.filter((entry) => entry.episode.status === "approved").length === 30, "el plano distingue 30 episodios aprobados");
check(neutral.landmarks.filter((entry) => entry.episode.status === "pending").length === 10, "el plano mantiene 10 anclas pendientes");

const studioReference = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_studio_reference.json"), "utf8"));
check(studioReference.integrity.ok, "el manifiesto de autoría estilo Studio tiene integridad referencial");
check(studioReference.records.length === 40, "Studio reference indexa las 40 anclas");
check(studioReference.records.filter((entry) => entry.state === "approved-and-compiled").length === 30, "Studio reference separa 30 episodios compilados");
check(studioReference.records.filter((entry) => entry.state === "planned").length === 10, "Studio reference reserva 10 registros futuros");
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
check(style.summary.exactInheritedGeometry === 40, "style gate detecta honestamente geometría heredada en 40/40");
check(style.summary.artReviewRequired === 40, "ningún mapa heredado se certifica visualmente sin revisión humana");
check(style.scope.finalGamePreviewStillRequired === true, "la prueba dentro de Game.exe sigue siendo obligatoria");

console.log(`\nExternal authoring: ${passed} OK, ${failed} fallos.`);
if (failed) process.exitCode = 1;
