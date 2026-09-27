#!/usr/bin/env node
/**
 * Macrociclo visual 02: tres lotes de cinco anclas (sectores 26-40).
 *
 * Añade composiciones de piso pequeñas y específicas para cada episodio usando
 * únicamente tiles ya existentes en el tileset activo. Cada sustitución exige
 * pasabilidad, prioridad y terrain tag idénticos, no mueve eventos y conserva
 * todas las rutas. La salida sigue necesitando revisión dentro de Game.exe.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { marshalDump, marshalLoad } from "../web/js/marshal.js";
import { parseEvent, parseMap, parseTileset, tableGet, tableSet, tableToUserDef } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT, readMarshalData } from "./lib/fire_ash_registry.mjs";

const OUTPUT = path.join(ROOT, "content", "atlas_visual_polish_macro02.json");
const BACKUP = path.join(GAME, "PokeModBackups", "atlas_visual_macro02_originals");
const VERIFY_ONLY = process.argv.includes("--verify");
const pad = (value) => String(value).padStart(3, "0");
const sha = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const tableHash = (table) => sha(Buffer.from(table.data.buffer, table.data.byteOffset, table.data.byteLength));

const PATTERNS = {
  ring: [[-2,-1],[-2,0],[-2,1],[2,-1],[2,0],[2,1],[-1,-2],[0,-2],[1,-2],[-1,2],[0,2],[1,2]],
  cross: [[0,0],[-2,0],[-1,0],[1,0],[2,0],[0,-2],[0,-1],[0,1],[0,2]],
  split: [[-2,-2],[-2,-1],[-2,0],[-2,1],[-2,2],[2,-2],[2,-1],[2,0],[2,1],[2,2]],
  diamond: [[0,-2],[-1,-1],[1,-1],[-2,0],[0,0],[2,0],[-1,1],[1,1],[0,2]],
  trail: [[-3,0],[-2,0],[-1,0],[0,0],[1,0],[2,0],[3,0],[3,-1],[3,-2]],
  checker: [[-2,-1],[0,-1],[2,-1],[-1,0],[1,0],[-2,1],[0,1],[2,1]],
  constellation: [[-3,-1],[-2,1],[-1,-2],[0,0],[1,2],[2,-1],[3,1],[0,3]],
  threshold: [[-2,2],[-2,1],[-2,0],[-2,-1],[-1,-2],[0,-2],[1,-2],[2,-1],[2,0],[2,1],[2,2]],
  wave: [[-3,-1],[-2,0],[-1,1],[0,0],[1,-1],[2,0],[3,1],[-3,2],[-2,3],[-1,2],[0,1],[1,2],[2,3],[3,2]],
  spiral: [[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[2,-1],[2,0],[1,0],[0,0],[0,1],[0,2],[-1,2],[-2,2]],
  single: [[0,0]],
};

const CONFIGS = [
  { mapId:1646, motif:"spiral", source:[856], accent:[865,904,913], intent:"Plano de ciudades futuras que deja visible la revisión pública" },
  { mapId:1671, motif:"split", source:[664], accent:[673], intent:"Dos vetas separan decisiones reversibles de renuncias sólidas" },
  { mapId:1696, motif:"wave", source:[722], accent:[721], intent:"Oleaje onírico que hace visible el peaje entre dimensiones" },
  { mapId:1721, motif:"split", source:[1129], accent:[1132], intent:"Dos delegaciones avanzan sin apropiarse del mismo campeón" },
  { mapId:1746, motif:"checker", source:[385], accent:[386,388], intent:"Tablero de práctica con errores permitidos y contrajuego legible" },
  { mapId:1771, motif:"wave", source:[448], accent:[457,465], intent:"Frecuencia visual que puede interrumpirse antes de ocupar toda la sala" },
  { mapId:1796, motif:"constellation", source:[386], accent:[385,388], intent:"Objetos cotidianos dispersos alrededor de un memorial sin estatua" },
  { mapId:1821, motif:"split", source:[448], accent:[473,457], intent:"Marcador dividido entre resultado anulado y exhibición transparente" },
  { mapId:1846, motif:"spiral", source:[385], accent:[386,388], intent:"Estratos fabricados que revelan dónde termina el montaje" },
  { mapId:1871, motif:"trail", source:[385], accent:[386,388], intent:"Ruta de banderines físicos más allá del reporte automático" },
  { mapId:1896, motif:"checker", source:[856], accent:[865,904], intent:"Casillas revisables que dejan de clasificar a la persona" },
  { mapId:1921, motif:"constellation", source:[386], accent:[385,388], intent:"Coordenadas fijas que ya no cambian después de un acierto" },
  { mapId:1946, motif:"single", source:[2642], accent:[856], intent:"Una única costura distingue recuerdo emocional y hecho comprobado" },
  { mapId:1971, motif:"split", source:[388], accent:[385,386], intent:"Dos continuidades relacionadas que conservan espacio propio" },
  { mapId:1996, motif:"ring", source:[1000], accent:[1009,936], intent:"Mesa sin cabecera para cuarenta puertas que siguen abiertas" },
];

function loadTilesets() {
  const raw = readMarshalData("Tilesets.rxdata");
  const result = new Map();
  for (let index = 1; index < raw.length; index++) if (raw[index]) {
    const parsed = parseTileset(raw[index]);
    result.set(parsed.id, parsed);
  }
  return result;
}
const tilesets = loadTilesets();
const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const blueprints = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json"), "utf8")).blueprints;
const hierarchyByMap = new Map(hierarchy.maps.map((entry) => [Number(entry.mapId), entry]));
const blueprintByMap = new Map(blueprints.map((entry) => [Number(entry.mapId), entry]));

function tileProperty(table, id) {
  return Number(table?.data?.[id] ?? 0);
}
function equivalent(tileset, oldId, newId) {
  return tileProperty(tileset.passages, oldId) === tileProperty(tileset.passages, newId)
    && tileProperty(tileset.priorities, oldId) === tileProperty(tileset.priorities, newId)
    && tileProperty(tileset.terrain, oldId) === tileProperty(tileset.terrain, newId);
}
function occupiedPositions(parsed) {
  return new Set(parsed.events.map(({ obj }) => {
    const event = parseEvent(obj);
    return `${event.x},${event.y}`;
  }));
}
function conductorPosition(parsed) {
  const event = parsed.events.map(({ obj }) => parseEvent(obj)).find((entry) => entry.name.startsWith("PokeMod Tier1: Conductor"));
  return event ? [event.x, event.y] : [Math.floor(parsed.width / 2), Math.floor(parsed.height / 2)];
}
function findPlacement(parsed, config) {
  const occupied = occupiedPositions(parsed);
  const source = new Set(config.source);
  const visible = (x, y, buffered = true) => {
    if (x < 1 || y < 1 || x >= parsed.width - 1 || y >= parsed.height - 1) return false;
    if (!source.has(tableGet(parsed.table, x, y, 0))) return false;
    if (tableGet(parsed.table, x, y, 1) || tableGet(parsed.table, x, y, 2)) return false;
    if (occupied.has(`${x},${y}`)) return false;
    if (buffered) for (const key of occupied) {
      const [ex, ey] = key.split(",").map(Number);
      if (Math.abs(ex - x) + Math.abs(ey - y) <= 1) return false;
    }
    return true;
  };
  const origin = conductorPosition(parsed);
  const centers = [];
  for (let y = 2; y < parsed.height - 2; y++) for (let x = 2; x < parsed.width - 2; x++) {
    centers.push([x, y, (x - origin[0]) ** 2 + (y - origin[1]) ** 2]);
  }
  centers.sort((left, right) => left[2] - right[2] || left[1] - right[1] || left[0] - right[0]);
  const offsets = PATTERNS[config.motif];
  for (const buffered of [true, false]) for (const [cx, cy] of centers) {
    const cells = offsets.map(([dx, dy]) => [cx + dx, cy + dy]);
    if (cells.every(([x, y]) => visible(x, y, buffered))) return { center: [cx, cy], cells, buffered };
  }
  const eligible = [];
  for (let y = 1; y < parsed.height - 1; y++) for (let x = 1; x < parsed.width - 1; x++) if (visible(x, y, false)) {
    eligible.push([x, y, (x - origin[0]) ** 2 + (y - origin[1]) ** 2]);
  }
  eligible.sort((left, right) => left[2] - right[2] || left[1] - right[1] || left[0] - right[0]);
  if (eligible.length < offsets.length) throw new Error(`${config.mapId}: no hay ${offsets.length} celdas visibles compatibles.`);
  const cells = eligible.slice(0, offsets.length).map(([x, y]) => [x, y]);
  return { center: cells[0], cells, buffered: false, fallback: true };
}
function mapFile(mapId) {
  return `Map${pad(mapId)}.rxdata`;
}
function backupFiles() {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const config of CONFIGS) {
    const file = mapFile(config.mapId);
    const source = path.join(DATA, file);
    const target = path.join(BACKUP, file);
    if (!fs.existsSync(target)) fs.copyFileSync(source, target);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), "Originales anteriores al macrociclo visual 02 (sectores 26-40). Restaura estos mapas para revertir únicamente las composiciones de piso.\n");
}
function applyMap(config) {
  const file = mapFile(config.mapId);
  const filePath = path.join(DATA, file);
  const beforeBuffer = fs.readFileSync(filePath);
  const raw = marshalLoad(beforeBuffer);
  const parsed = parseMap(raw);
  const tileset = tilesets.get(parsed.tilesetId);
  if (!tileset) throw new Error(`${config.mapId}: tileset ${parsed.tilesetId} ausente.`);
  for (const oldId of config.source) for (const newId of config.accent) if (!equivalent(tileset, oldId, newId)) {
    throw new Error(`${config.mapId}: tile ${oldId} y ${newId} no preservan pasabilidad/prioridad/terrain tag.`);
  }
  const beforeTableHash = tableHash(parsed.table);
  const placement = findPlacement(parsed, config);
  const changes = placement.cells.map(([x, y], index) => {
    const oldTileId = tableGet(parsed.table, x, y, 0);
    const newTileId = config.accent[index % config.accent.length];
    if (!equivalent(tileset, oldTileId, newTileId)) throw new Error(`${config.mapId}: sustitución insegura ${oldTileId}->${newTileId}.`);
    tableSet(parsed.table, x, y, 0, newTileId);
    return { x, y, layer: 0, oldTileId, newTileId };
  });
  raw.setIvar("data", tableToUserDef(parsed.table));
  const afterBuffer = Buffer.from(marshalDump(raw));
  fs.writeFileSync(filePath, afterBuffer);
  const reparsed = parseMap(marshalLoad(afterBuffer));
  const changed = changes.every((entry) => tableGet(reparsed.table, entry.x, entry.y, entry.layer) === entry.newTileId);
  if (!changed || tableHash(reparsed.table) === beforeTableHash) throw new Error(`${config.mapId}: la composición visual no quedó persistida.`);
  return {
    mapId: config.mapId,
    sector: hierarchyByMap.get(config.mapId)?.sector,
    sectorName: hierarchyByMap.get(config.mapId)?.sectorName,
    episode: blueprintByMap.get(config.mapId)?.title,
    visualBatch: Math.floor(CONFIGS.indexOf(config) / 5) + 6,
    motif: config.motif,
    intent: config.intent,
    tilesetId: parsed.tilesetId,
    tilesetName: tileset.tilesetName,
    center: placement.center,
    usedFallbackPlacement: Boolean(placement.fallback),
    keptOneTileBufferFromEvents: placement.buffered,
    changedCells: changes.length,
    changes,
    safety: {
      eventsMoved: 0,
      passabilityChangedCells: 0,
      priorityChangedCells: 0,
      terrainTagChangedCells: 0,
      dimensionsChanged: false,
      tilesetChanged: false,
    },
    before: { fileSha256: sha(beforeBuffer), tileSha256: beforeTableHash },
    after: { fileSha256: sha(afterBuffer), tileSha256: tableHash(reparsed.table) },
  };
}
function verify(report) {
  const errors = [];
  for (const entry of report.maps) {
    const filePath = path.join(DATA, mapFile(entry.mapId));
    if (!fs.existsSync(filePath)) { errors.push(`${entry.mapId}: mapa ausente`); continue; }
    const buffer = fs.readFileSync(filePath);
    const parsed = parseMap(marshalLoad(buffer));
    if (sha(buffer) !== entry.after.fileSha256) errors.push(`${entry.mapId}: hash de archivo no coincide`);
    if (tableHash(parsed.table) !== entry.after.tileSha256) errors.push(`${entry.mapId}: hash de geometría no coincide`);
    for (const change of entry.changes) if (tableGet(parsed.table, change.x, change.y, change.layer) !== change.newTileId) errors.push(`${entry.mapId}: celda ${change.x},${change.y} perdió el acento visual`);
    if (!parsed.events.some(({ obj }) => parseEvent(obj).name === "Return to Puerto Horizonte")) errors.push(`${entry.mapId}: retorno ausente`);
    if (parsed.events.filter(({ obj }) => parseEvent(obj).name.startsWith("PokeMod Tier1:")).length !== 5) errors.push(`${entry.mapId}: eventos Tier 1 incompletos`);
  }
  if (report.maps.length !== 15) errors.push(`macrociclo incompleto: ${report.maps.length}/15 mapas`);
  if (report.summary.visualBatches !== 3) errors.push(`lotes incorrectos: ${report.summary.visualBatches}/3`);
  if (errors.length) throw new Error(`Macrociclo visual inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: ${report.summary.visualBatches} lotes visuales, ${report.maps.length} anclas y ${report.summary.changedCells} celdas narrativas; pasabilidad, eventos y retorno preservados.`);
}

if (VERIFY_ONLY) {
  if (!fs.existsSync(OUTPUT)) throw new Error("Falta content/atlas_visual_polish_macro02.json.");
  verify(JSON.parse(fs.readFileSync(OUTPUT, "utf8")));
} else if (fs.existsSync(OUTPUT)) {
  const previous = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
  const allCurrent = previous.maps.every((entry) => {
    const file = path.join(DATA, mapFile(entry.mapId));
    return fs.existsSync(file) && sha(fs.readFileSync(file)) === entry.after.fileSha256;
  });
  if (!allCurrent) throw new Error("Ya existe un manifiesto del macrociclo, pero los mapas no coinciden. Restaura el backup o revisa el diff antes de reaplicar.");
  verify(previous);
} else {
  backupFiles();
  const maps = CONFIGS.map(applyMap);
  const report = {
    version: 1,
    macroCycle: 2,
    scope: {
      visualBatches: [6,7,8],
      sectors: [26,40],
      maps: maps.map((entry) => entry.mapId),
      method: "Composición de piso narrativa con tiles existentes y equivalencia estricta de colisión.",
    },
    summary: {
      visualBatches: 3,
      maps: maps.length,
      changedCells: maps.reduce((sum, entry) => sum + entry.changedCells, 0),
      exactPatternPlacements: maps.filter((entry) => !entry.usedFallbackPlacement).length,
      adaptivePatternPlacements: maps.filter((entry) => entry.usedFallbackPlacement).length,
      eventsMoved: 0,
      passabilityChangedCells: 0,
      inheritedGeometryRemainingAfterStyleGate: 0,
    },
    certification: {
      staticTechnicalGate: "required",
      gameExePreview: "required",
      playableArtCertified: false,
      note: "Los PNG de referencia permiten crítica estática, pero no sustituyen ritmo, clipping ni prueba visual dentro de Game.exe.",
    },
    maps,
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  verify(report);
  console.log(`Macrociclo visual 02 aplicado. Backup: ${path.relative(ROOT, BACKUP)}`);
}
