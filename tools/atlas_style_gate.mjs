#!/usr/bin/env node
/**
 * Compara las 40 anclas de Atlas con mapas reales de Fire Ash.
 * Valida geometría, tilesets, pasabilidad, recursos visuales y eventos sin
 * intentar sustituir la prueba final dentro de Game.exe.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, GAME, DATA, readMarshalData, stringValue } from "./lib/fire_ash_registry.mjs";
import { parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";

const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const pad = (value) => String(value).padStart(3, "0");
const hashTable = (table) => crypto.createHash("sha256").update(Buffer.from(table.data.buffer, table.data.byteOffset, table.data.byteLength)).digest("hex");

const imageInventory = new Map();
function imageExists(folder, name) {
  if (!name) return true;
  if (!imageInventory.has(folder)) {
    const files = fs.existsSync(folder) ? fs.readdirSync(folder) : [];
    imageInventory.set(folder, new Set(files.filter((file) => /\.(png|jpg|jpeg|bmp)$/i.test(file)).map((file) => file.toLowerCase())));
  }
  return [".png", ".jpg", ".jpeg", ".bmp"].some((extension) => imageInventory.get(folder).has(`${name}${extension}`.toLowerCase()));
}

function passabilityRatio(map, tileset) {
  let passable = 0;
  const total = map.width * map.height;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      let directions = 0;
      for (let z = 0; z < map.table.z; z++) {
        const tile = tableGet(map.table, x, y, z);
        if (tile > 0 && tile < tileset.passages.data.length) directions |= tileset.passages.data[tile] & 15;
      }
      if (directions !== 15) passable++;
    }
  }
  return total ? Number((passable / total).toFixed(4)) : 0;
}

function tileSimilarity(left, right) {
  if (left.table.x !== right.table.x || left.table.y !== right.table.y || left.table.z !== right.table.z) return 0;
  let same = 0;
  for (let index = 0; index < left.table.data.length; index++) if (left.table.data[index] === right.table.data[index]) same++;
  return Number((same / Math.max(1, left.table.data.length)).toFixed(4));
}

function mapMetrics(parsed, tileset) {
  const layers = [];
  const uniqueTiles = new Set();
  for (let z = 0; z < parsed.table.z; z++) {
    let occupied = 0;
    for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) {
      const tile = tableGet(parsed.table, x, y, z);
      if (tile) { occupied++; uniqueTiles.add(tile); }
    }
    layers.push({ layer: z, occupied, ratio: Number((occupied / Math.max(1, parsed.width * parsed.height)).toFixed(4)) });
  }
  return {
    width: parsed.width,
    height: parsed.height,
    tilesetId: parsed.tilesetId,
    tileHash: hashTable(parsed.table),
    uniqueTiles: uniqueTiles.size,
    layerOccupancy: layers,
    passabilityRatio: passabilityRatio(parsed, tileset),
    eventCount: parsed.events.length,
  };
}

export function buildAtlasStyleReport() {
  const hierarchy = json(path.join(ROOT, "content", "atlas_content_hierarchy.json"));
  const approved = json(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json")).blueprints ?? [];
  const approvedIds = new Set(approved.map((entry) => Number(entry.mapId)));
  const characters = new Set(fs.readdirSync(path.join(GAME, "Graphics", "Characters"))
    .filter((file) => /\.(png|jpg|jpeg|bmp)$/i.test(file)).map((file) => file.replace(/\.(png|jpg|jpeg|bmp)$/i, "")));
  const rawTilesets = readMarshalData("Tilesets.rxdata");
  const tilesets = new Map();
  for (let index = 1; index < rawTilesets.length; index++) if (rawTilesets[index]) {
    const parsed = parseTileset(rawTilesets[index]);
    tilesets.set(parsed.id, parsed);
  }

  const errors = [];
  const warnings = [];
  const anchors = hierarchy.maps.filter((entry) => entry.tier === 1).map((entry) => {
    const mapFile = path.join(DATA, `Map${pad(entry.mapId)}.rxdata`);
    const sourceFile = path.join(DATA, `Map${pad(entry.sourceId)}.rxdata`);
    if (!fs.existsSync(mapFile) || !fs.existsSync(sourceFile)) {
      errors.push(`${entry.mapId}: falta mapa Atlas o fuente ${entry.sourceId}.`);
      return { mapId: entry.mapId, sourceMapId: entry.sourceId, technicalStatus: "failed" };
    }
    const current = parseMap(readMarshalData(`Map${pad(entry.mapId)}.rxdata`));
    const source = parseMap(readMarshalData(`Map${pad(entry.sourceId)}.rxdata`));
    const currentTileset = tilesets.get(current.tilesetId);
    const sourceTileset = tilesets.get(source.tilesetId);
    if (!currentTileset || !sourceTileset) {
      errors.push(`${entry.mapId}: tileset no registrado.`);
      return { mapId: entry.mapId, sourceMapId: entry.sourceId, technicalStatus: "failed" };
    }
    const currentMetrics = mapMetrics(current, currentTileset);
    const sourceMetrics = mapMetrics(source, sourceTileset);
    const similarity = tileSimilarity(current, source);
    const events = current.events.map(({ obj }) => parseEvent(obj));
    const missingSprites = [...new Set(events.flatMap((event) => event.pages.map((page) => page.graphic?.charName).filter(Boolean)).filter((name) => !characters.has(name)))];
    const outOfBoundsEvents = events.filter((event) => event.x < 0 || event.y < 0 || event.x >= current.width || event.y >= current.height).map((event) => event.id);
    const pokeModEvents = events.filter((event) => event.name.startsWith("PokeMod Tier1:"));
    const hasReturn = events.some((event) => event.name === "Return to Puerto Horizonte");
    const tilesetAssets = {
      tileset: currentTileset.tilesetName,
      tilesetExists: imageExists(path.join(GAME, "Graphics", "Tilesets"), currentTileset.tilesetName),
      missingAutotiles: currentTileset.autotiles.filter((name) => name && !imageExists(path.join(GAME, "Graphics", "Autotiles"), name)),
    };
    const technicalProblems = [];
    if (current.tilesetId !== source.tilesetId) technicalProblems.push("tileset distinto del mapa base");
    if (current.width !== source.width || current.height !== source.height) technicalProblems.push("dimensiones distintas del mapa base");
    if (!tilesetAssets.tilesetExists) technicalProblems.push("gráfico de tileset ausente");
    if (tilesetAssets.missingAutotiles.length) technicalProblems.push("autotiles ausentes");
    if (missingSprites.length) technicalProblems.push("sprites de evento ausentes");
    if (outOfBoundsEvents.length) technicalProblems.push("eventos fuera de límites");
    if (!hasReturn) technicalProblems.push("retorno a Puerto Horizonte ausente");
    if (approvedIds.has(entry.mapId) && pokeModEvents.length !== 5) technicalProblems.push(`episodio aprobado con ${pokeModEvents.length}/5 eventos Tier 1`);
    if (technicalProblems.length) errors.push(`${entry.mapId}: ${technicalProblems.join(", ")}.`);

    const artDirectionStatus = similarity === 1 ? "review-required-inherited-geometry" : "customized-needs-game-preview";
    if (approvedIds.has(entry.mapId) && similarity === 1) warnings.push(`${entry.mapId}: conserva exactamente la geometría fuente; es compatible, pero no debe certificarse como mapa visual final sin una pasada artesanal.`);
    if (approvedIds.has(entry.mapId) && similarity !== 1) warnings.push(`${entry.mapId}: incorpora composición visual propia, pero todavía requiere revisión estática y prueba dentro de Game.exe.`);
    return {
      mapId: entry.mapId,
      sourceMapId: entry.sourceId,
      sector: entry.sector,
      sectorName: entry.sectorName,
      approvedEpisode: approvedIds.has(entry.mapId),
      current: currentMetrics,
      source: sourceMetrics,
      comparison: {
        tileSimilarity: similarity,
        exactInheritedGeometry: similarity === 1,
        passabilityDelta: Number((currentMetrics.passabilityRatio - sourceMetrics.passabilityRatio).toFixed(4)),
        eventDelta: currentMetrics.eventCount - sourceMetrics.eventCount,
      },
      assets: { ...tilesetAssets, missingSprites },
      events: { pokeModEvents: pokeModEvents.length, hasFreeReturn: hasReturn, outOfBounds: outOfBoundsEvents },
      technicalStatus: technicalProblems.length ? "failed" : "passed",
      artDirectionStatus,
    };
  });

  return {
    version: 1,
    purpose: "Comparación de fidelidad visual/técnica contra mapas reales de Fire Ash.",
    scope: {
      anchors: anchors.length,
      approvedEpisodes: anchors.filter((entry) => entry.approvedEpisode).length,
      engine: "RPG Maker XP / Pokémon Essentials",
      finalGamePreviewStillRequired: true,
    },
    summary: {
      technicalPassed: anchors.filter((entry) => entry.technicalStatus === "passed").length,
      technicalFailed: anchors.filter((entry) => entry.technicalStatus === "failed").length,
      exactInheritedGeometry: anchors.filter((entry) => entry.comparison?.exactInheritedGeometry).length,
      customGeometry: anchors.filter((entry) => entry.comparison && !entry.comparison.exactInheritedGeometry).length,
      staticCompositionPending: anchors.filter((entry) => entry.comparison?.exactInheritedGeometry).length,
      artReviewRequired: anchors.filter((entry) => entry.approvedEpisode && entry.artDirectionStatus !== "certified").length,
      gamePreviewRequired: anchors.filter((entry) => entry.approvedEpisode).length,
    },
    integrity: { ok: errors.length === 0, errors, warnings },
    anchors,
  };
}

function argument(name, fallback = null) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}

export function runCli() {
  const report = buildAtlasStyleReport();
  const checkOnly = process.argv.includes("--check");
  const output = path.resolve(argument("--output", path.join(ROOT, "content", "atlas_style_baseline.json")));
  if (!checkOnly) writeJson(output, report);
  console.log(JSON.stringify({ summary: report.summary, integrity: { ok: report.integrity.ok, errors: report.integrity.errors.length, warnings: report.integrity.warnings.length } }, null, 2));
  if (!report.integrity.ok) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { runCli(); } catch (error) { console.error(error.stack ?? error.message); process.exitCode = 1; }
}
