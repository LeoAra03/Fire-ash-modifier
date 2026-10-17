#!/usr/bin/env node
/** Auditoría estática de la tanda 18 (1700–1799): Atlas Mil y Dimensional Nightmare. */
import fs from "node:fs";
import path from "node:path";
import { DATA, ROOT, eventsOf, iv, readData, txt } from "../lib/dlc_helpers.mjs";

const jsonMode = process.argv.includes("--json");
const failures = [];
const warnings = [];
const check = (value, message) => { if (!value) failures.push(message); };
const warn = (message) => warnings.push(message);
const load = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const mapPath = (id) => path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`);

function auditAtlas() {
  const approved = load("content/atlas_tier1_blueprints_approved.json");
  const blueprints = approved.blueprints ?? [];
  const progress = load("content/atlas_progress.json");
  const system = readData("System.rxdata");
  const switches = iv(system, "switches") ?? [];
  let events = 0;
  let maxEvents = 0;
  const over60 = [];
  const absent = [];
  for (let id = 1021; id <= 2020; id += 1) {
    if (!fs.existsSync(mapPath(id))) { absent.push(id); continue; }
    const count = eventsOf(id).length;
    events += count;
    maxEvents = Math.max(maxEvents, count);
    if (count > 60) over60.push({ mapId: id, events: count });
  }
  check(absent.length === 0, `Atlas: faltan ${absent.length} mapas`);
  check(blueprints.length === 40, `Atlas: blueprints Tier 1 ${blueprints.length}/40`);
  const anchors = [];
  for (const [index, blueprint] of blueprints.entries()) {
    const mapId = Number(blueprint.mapId);
    const switchId = Number(blueprint.flags?.globalSwitches?.[0]?.id);
    const names = eventsOf(mapId).map((entry) => entry.name);
    const beacon = names.some((name) => name.includes("Tier 1 Beacon") || name.includes("Tier 3 Beacon"));
    const conductor = names.some((name) => name.includes("PokeMod Tier1: Conductor"));
    check(beacon, `Atlas ancla ${index + 1}: falta baliza en Map${mapId}`);
    check(conductor, `Atlas ancla ${index + 1}: falta conductor en Map${mapId}`);
    check(switchId >= 708 && switchId <= 747, `Atlas ancla ${index + 1}: switch fuera de 708–747`);
    check(txt(switches[switchId] ?? "").includes("ATLAS"), `Atlas ancla ${index + 1}: switch ${switchId} sin nombre`);
    anchors.push({ index: index + 1, mapId, switchId, title: blueprint.title ?? "", events: eventsOf(mapId).length });
  }
  const tier2Files = fs.readdirSync(path.join(ROOT, "content"))
    .filter((name) => /^atlas_tier2_blueprints_macro\d+\.json$/.test(name)).sort();
  const tier2 = tier2Files.map((name) => ({ file: name, count: (load(`content/${name}`).blueprints ?? []).length }));
  const tier2Total = tier2.reduce((sum, row) => sum + row.count, 0);
  check(tier2Total >= 120, `Atlas Tier 2: solo ${tier2Total} rutas auditables`);
  const tier3 = load("content/atlas_tier3_rules.json");
  check((tier3.rules ?? tier3.entries ?? tier3.maps ?? []).length > 0, "Atlas Tier 3: reglas ausentes");
  check(events > 0, "Atlas: censo de eventos vacío");
  if (over60.length) warn(`Atlas: ${over60.length} mapas superan 60 eventos; se conservan como excepciones explícitas.`);
  warn("La legibilidad del puzle, la escucha musical y el recorrido humano de franjas Atlas no se prueban con Marshal.");
  return {
    maps: 1000,
    absent,
    events,
    averageEvents: Number((events / 1000).toFixed(3)),
    maxEvents,
    over60,
    anchors,
    tier2,
    tier2Total,
    tier3Rules: (tier3.rules ?? tier3.entries ?? tier3.maps ?? []).length,
    progressSummary: progress.installed?.atlas ?? null,
  };
}

function auditNightmare() {
  const plan = load("content/dimensional_nightmare.json");
  const events = load("content/dimensional_nightmare_events.json");
  const built = load("content/dimensional_nightmare_events_built.json");
  const battles = load("content/dimensional_nightmare_battles_built.json");
  const maps = load("content/dimensional_nightmare_maps_built.json");
  const episodes = events.episodes ?? [];
  const anomalyCount = episodes.reduce((sum, episode) => sum + Number(episode.anomalies?.declared ?? 0), 0);
  const expectedMaps = Number(plan.mapRange?.count ?? 151);
  let actualMaps = 0;
  let actualEvents = 0;
  for (let id = Number(plan.mapRange?.from ?? 2040); id <= Number(plan.mapRange?.to ?? 2190); id += 1) {
    if (fs.existsSync(mapPath(id))) { actualMaps += 1; actualEvents += eventsOf(id).length; }
  }
  check(expectedMaps === 151, `Nightmare: el plan no declara 151 mapas (${expectedMaps})`);
  check(actualMaps === 151, `Nightmare: mapas instalados ${actualMaps}/151`);
  check(episodes.length >= 9, `Nightmare: episodios ${episodes.length}/9`);
  check(anomalyCount >= 77, `Nightmare: anomalías declaradas ${anomalyCount}/77`);
  check(Object.keys(built).length > 0, "Nightmare: events_built vacío");
  check(Object.keys(battles).length > 0, "Nightmare: battles_built vacío");
  check(Object.keys(maps).length > 0, "Nightmare: maps_built vacío");
  check(plan.flags?.externalVariablesReadOnly?.["264"], "Nightmare: falta contrato de lectura de v[264]");
  const missing2x = !exists("content/dimensional_nightmare_tiles_2x.json");
  if (missing2x) warn("Nightmare: falta content/dimensional_nightmare_tiles_2x.json; dn:verify:all queda bloqueado por ese catálogo ausente y no se inventa.");
  if (plan.status === "design (GDD funcional; sin instalar)") warn("Nightmare: el JSON conserva su etiqueta histórica de GDD aunque hay mapas/eventos compilados; no se reescribe sin decidir una política de estado.");
  return {
    plannedMaps: expectedMaps,
    actualMaps,
    actualEvents,
    episodes: episodes.map((episode) => ({ key: episode.key, mapRange: episode.mapRange, anomalies: episode.anomalies?.declared ?? 0 })),
    anomalyCount,
    flags: { switches: plan.flags?.switchRange ?? null, variables: plan.flags?.variableRange ?? null, readonly264: true },
    missingTiles2xCatalog: missing2x,
  };
}

const result = {
  schema: "plan2700_fase018_audit/1.0",
  phase: "018",
  tasks: [1700, 1799],
  atlas: auditAtlas(),
  nightmare: auditNightmare(),
  manualQa: [
    "recorrido humano de franjas Atlas y dos franjas en partida real",
    "comprobación de ritmo de jefes, ciudades, curación y tienda",
    "recorrido de los episodios DN en Game.exe/Kirin",
    "verificación perceptiva de arte y audio DN",
  ],
  failures,
  warnings,
};
if (jsonMode) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`FASE 018: Atlas ${result.atlas.maps} mapas · ${result.atlas.events} eventos · DN ${result.nightmare.actualMaps}/${result.nightmare.plannedMaps} mapas`);
  console.log(`  anclas ${result.atlas.anchors.length} · Tier 2 ${result.atlas.tier2Total} · anomalías DN ${result.nightmare.anomalyCount}`);
  for (const message of warnings) console.warn(`  ⚠ ${message}`);
  if (failures.length) {
    console.error(`FALLO: ${failures.length} comprobaciones`);
    for (const message of failures) console.error(`  · ${message}`);
    process.exit(1);
  }
  console.log("OK: estructura Atlas y contenido verificable del Nightmare en verde");
}
if (failures.length) process.exit(1);
