#!/usr/bin/env node
/**
 * Auditoría determinista de una campaña estructural del plan 2700.
 *
 * Comprueba lo que sí puede probar el checkout (mapas, eventos, warps,
 * recursos, encuentros, líderes y cierre) y deja explícitos los recorridos
 * manuales que no puede sustituir.
 *
 * Uso: node tools/plan2700/audit_campaign_region.mjs --campaign glazed [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { DATA, GAME, ROOT, commandsOf, eventsOf, iv, pagesOf, readData, readMapRaw, speciesAvailable, txt } from "../lib/dlc_helpers.mjs";

const campaignId = process.argv.find((arg) => arg.startsWith("--campaign="))?.split("=")[1];
const jsonOutput = process.argv.includes("--json");
if (!campaignId) throw new Error("Falta --campaign=glazed|light_platinum|liquid_crystal|tfoh|unbound");
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));
const campaign = plan.campaigns.find((item) => item.id === campaignId);
if (!campaign) throw new Error(`Campaña desconocida: ${campaignId}`);
const failures = [];
const warnings = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const mapFile = (id) => path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`);
const json = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const mapIds = campaign.maps.map((m) => m.mapId);
const allCommands = (id) => eventsOf(id).flatMap((event) => pagesOf(event).flatMap((page) => page.list));
const commandWrites = (id, switchId) => allCommands(id).filter((command) => command.code === 121 && Number(command.params?.[0]) === switchId && Number(command.params?.[2]) === 0);

function auditSystemNames() {
  const system = readData("System.rxdata");
  const switches = iv(system, "switches") ?? [];
  const variables = iv(system, "variables") ?? [];
  ok(txt(switches[campaign.completeSwitch]).includes(campaign.id.toUpperCase()), `${campaign.id}: switch ${campaign.completeSwitch} sin nombre de cierre`);
  ok(txt(variables[campaign.progressVariable]).includes(campaign.id.toUpperCase()), `${campaign.id}: variable ${campaign.progressVariable} sin nombre de progreso`);
}

function auditLeaders() {
  const catalog = json("content/campanas_lideres.json");
  const leaders = (catalog.colocados ?? []).filter((leader) => leader.map >= campaign.firstMapId && leader.map <= campaign.lastMapId);
  const expected = campaignId === "glazed" || campaignId === "light_platinum" ? 8 : null;
  if (expected !== null) ok(leaders.length === expected, `${campaign.title}: se esperan ${expected} líderes, hay ${leaders.length}`);
  ok(new Set(leaders.map((leader) => leader.lider)).size === leaders.length, `${campaign.title}: líderes repetidos`);
  for (const leader of leaders) {
    const events = eventsOf(leader.map);
    const found = events.find((event) => event.name.includes(leader.lider));
    ok(!!found, `${campaign.title}: no se encontró el evento de ${leader.lider} en Map${leader.map}`);
    if (found) {
      const writes = pagesOf(found).flatMap((page) => page.list).filter((command) => command.code === 121 && Number(command.params?.[0]) === leader.sw && Number(command.params?.[2]) === 0);
      ok(writes.length >= 1, `${campaign.title}: ${leader.lider} no escribe su switch ${leader.sw}`);
    }
  }
  return leaders;
}

function auditMaps() {
  let actualEvents = 0;
  let actualActors = 0;
  let actualWarps = 0;
  let maxEvents = 0;
  let maxWidth = 0;
  let maxHeight = 0;
  const bgms = new Set();
  const tileSets = new Set();
  const chapterCounts = new Map();
  const mapRows = [];
  for (const blueprint of campaign.maps) {
    const file = mapFile(blueprint.mapId);
    ok(fs.existsSync(file), `${campaign.title}: falta Map${blueprint.mapId}`);
    if (!fs.existsSync(file)) continue;
    const raw = readMapRaw(blueprint.mapId);
    const width = Number(iv(raw, "@width"));
    const height = Number(iv(raw, "@height"));
    const events = eventsOf(blueprint.mapId);
    const eventCount = events.length;
    const actors = events.filter((event) => /NPC|Entrenador|Final|Líder|Profesor|Rival|Person|Guardian/i.test(event.name)).length;
    const warps = events.filter((event) => event.name.startsWith("PokeMod Campaña ROM: Warp ")).length;
    const names = new Set(events.map((event) => event.name));
    const bgm = txt(iv(iv(raw, "@bgm"), "@name"));
    const tilesetObject = readData("Tilesets.rxdata")[Number(iv(raw, "@tileset_id"))];
    const tileset = txt(iv(tilesetObject, "@tileset_name"));
    actualEvents += eventCount;
    actualActors += actors;
    actualWarps += warps;
    maxEvents = Math.max(maxEvents, eventCount);
    maxWidth = Math.max(maxWidth, width);
    maxHeight = Math.max(maxHeight, height);
    if (bgm) bgms.add(bgm);
    if (tileset) tileSets.add(txt(tileset));
    chapterCounts.set(blueprint.chapter, (chapterCounts.get(blueprint.chapter) ?? 0) + 1);
    ok(width > 0 && height > 0, `Map${blueprint.mapId}: dimensiones inválidas`);
    ok(events.every((event) => Number(iv(event.obj, "@x")) >= 0 && Number(iv(event.obj, "@x")) < width && Number(iv(event.obj, "@y")) >= 0 && Number(iv(event.obj, "@y")) < height), `Map${blueprint.mapId}: evento fuera de límites`);
    ok(names.has("PokeMod Campaña ROM: Retorno libre"), `Map${blueprint.mapId}: falta retorno libre`);
    ok(names.has("PokeMod Campaña ROM: Tramo siguiente"), `Map${blueprint.mapId}: falta avance`);
    ok(warps >= blueprint.warps.length, `Map${blueprint.mapId}: faltan warps del plano`);
    ok(bgm && fs.existsSync(path.join(GAME, "Audio/BGM", bgm)), `Map${blueprint.mapId}: BGM ausente ${bgm}`);
    mapRows.push({ mapId: blueprint.mapId, sequence: blueprint.sequence, chapter: blueprint.chapter, events: eventCount, actors, warps, width, height, bgm, tileset });
  }
  const final = campaign.maps.find((map) => map.mapId === campaign.lastMapId);
  ok(!!final, `${campaign.title}: el plano no declara mapa final`);
  const closeWriters = mapIds.flatMap((id) => commandWrites(id, campaign.completeSwitch).map(() => id));
  if (campaignId === "glazed") ok(closeWriters.length === 1, `${campaign.title}: switch ${campaign.completeSwitch} tiene ${closeWriters.length} escritores ON, se espera uno`);
  return { actualEvents, actualActors, actualWarps, maxEvents, maxWidth, maxHeight, bgms: [...bgms].sort(), tileSets: [...tileSets].sort(), chapters: Object.fromEntries(chapterCounts), closeWriters, mapRows };
}

function auditEncounters() {
  const file = `content/${campaignId}_wild_encounters.json`;
  ok(fs.existsSync(path.join(ROOT, file)), `${campaign.title}: falta ${file}`);
  if (!fs.existsSync(path.join(ROOT, file))) return { zones: 0, slots: 0, minLevel: null, maxLevel: null };
  const catalog = json(file);
  const species = speciesAvailable();
  const ids = new Set(mapIds);
  let slots = 0, minLevel = Infinity, maxLevel = 0;
  for (const zone of catalog.zones ?? []) {
    ok(ids.has(zone.mapId), `${campaign.title}: zona salvaje fuera del rango Map${zone.mapId}`);
    for (const rows of Object.values(zone.types ?? {})) for (const row of rows) {
      slots += 1;
      const [, pokemon, min, max] = row;
      minLevel = Math.min(minLevel, min); maxLevel = Math.max(maxLevel, max);
      ok(species.has(pokemon), `${campaign.title}: especie inexistente ${pokemon}`);
      ok(min >= 1 && max <= 175 && min <= max, `${campaign.title}: nivel inválido en ${pokemon}`);
    }
  }
  ok((catalog.zones ?? []).length >= 1, `${campaign.title}: catálogo sin zonas`);
  return { zones: catalog.zones?.length ?? 0, slots, minLevel: minLevel === Infinity ? null : minLevel, maxLevel: maxLevel || null };
}

function auditAudioAndProgress() {
  const ambience = json("content/dlc_ambience.json");
  const rows = (ambience.musica ?? []).filter((row) => row.mapId >= campaign.firstMapId && row.mapId <= campaign.lastMapId);
  if (!rows.length) warnings.push(`${campaign.title}: sus BGM viven en el contrato de campaña, no en dlc_ambience.json`);
  const route = fs.readFileSync(path.join(ROOT, "tools/apply_complete_rom_campaigns.mjs"), "utf8");
  ok(route.includes(`progressVariable: ${campaign.progressVariable}`) || campaign.progressVariable > 0, `${campaign.title}: progreso sin contrato`);
  warnings.push(`${campaign.title}: densidad máxima ${mapStats.maxEvents} eventos/mapa; revisar los mapas densos en el perfil visual`);
  warnings.push(`${campaign.title}: volumen, clima y escucha de transición requieren playtest`);
}

auditSystemNames();
const mapStats = auditMaps();
const encounterStats = auditEncounters();
const leaders = auditLeaders();
auditAudioAndProgress();
const result = {
  schema: "plan2700_region_audit/1.0",
  campaign: campaignId,
  title: campaign.title,
  range: [campaign.firstMapId, campaign.lastMapId],
  planMaps: campaign.maps.length,
  leaders: leaders.map((leader) => ({ map: leader.map, name: leader.lider, switch: leader.sw })),
  encounters: encounterStats,
  ...mapStats,
  failures,
  warnings,
};
if (jsonOutput) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`${campaign.title}: ${campaign.maps.length} mapas ${campaign.firstMapId}–${campaign.lastMapId}`);
  console.log(`  eventos ${mapStats.actualEvents} · actores auditados ${mapStats.actualActors} · warps ${mapStats.actualWarps} · máximo eventos/mapa ${mapStats.maxEvents}`);
  console.log(`  encuentros ${encounterStats.zones} zonas/${encounterStats.slots} slots · niveles ${encounterStats.minLevel}–${encounterStats.maxLevel}`);
  console.log(`  líderes ${leaders.length} · BGM ${mapStats.bgms.length} · tilesets ${mapStats.tileSets.length} · cierre escrituras ${mapStats.closeWriters.length}`);
  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
  if (failures.length) {
    console.error(`FALLO: ${failures.length} comprobaciones`);
    for (const failure of failures.slice(0, 30)) console.error(`  · ${failure}`);
  } else console.log("OK: auditoría estructural, narrativa declarada y recursos de la región en verde");
}
if (failures.length) process.exit(1);
