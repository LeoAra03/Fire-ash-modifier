#!/usr/bin/env node
/**
 * Macrociclo visual 01: cinco lotes de cinco anclas (sectores 01-25).
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

const OUTPUT = path.join(ROOT, "content", "atlas_visual_polish_macro01.json");
const BACKUP = path.join(GAME, "PokeModBackups", "atlas_visual_macro01_originals");
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
};

const CONFIGS = [
  { mapId:1021, motif:"ring", source:[401], accent:[409,393], intent:"Anillo de campana alrededor del archivo de memoria" },
  { mapId:1046, motif:"diamond", source:[1060], accent:[1077,1069], intent:"Óvalo quebrado para la copa y el huevo ausente" },
  { mapId:1071, motif:"split", source:[448], accent:[457], intent:"Dos cronologías enfrentadas para el campeón imposible" },
  { mapId:1096, motif:"trail", source:[448], accent:[465,458], intent:"Pasillo de camilla y encargos que llegan desde otro tiempo" },
  { mapId:1121, motif:"cross", source:[448], accent:[473,457], intent:"Marca de rescate con salida visible y centro libre" },
  { mapId:1146, motif:"trail", source:[386], accent:[388,385], intent:"Rastro oscuro que decide quedarse sin bloquear el camino" },
  { mapId:1171, motif:"split", source:[728], accent:[737], intent:"Dos juramentos paralelos que comparten una misma sala" },
  { mapId:1196, motif:"threshold", source:[769], accent:[761], intent:"Encuadre abierto para la persona ausente de la fotografía" },
  { mapId:1221, motif:"ring", source:[1174], accent:[1193], intent:"Ruedo del festival conservado sin imponer un motivo" },
  { mapId:1246, motif:"constellation", source:[385], accent:[386,388], intent:"Trazos dispersos de una carta que recuerda al jugador" },
  { mapId:1271, motif:"ring", source:[624], accent:[657,634], intent:"Reloj del minuto cero con un centro todavía revisable" },
  { mapId:1296, motif:"diamond", source:[386], accent:[385,388], intent:"Zona de puntuación que deja el punto central sin marcar" },
  { mapId:1321, motif:"trail", source:[452], accent:[446], intent:"Señal fragmentada construida a partir de ausencias" },
  { mapId:1346, motif:"cross", source:[658], accent:[652,654,655], intent:"Plano de ciudad de juguete que no copia a sus habitantes" },
  { mapId:1371, motif:"checker", source:[602], accent:[606,612,614], intent:"Mosaico legible entre los nombres imposibles del suelo" },
  { mapId:1396, motif:"diamond", source:[760], accent:[769], intent:"Mesa-receta que separa emociones propias y prestadas" },
  { mapId:1421, motif:"constellation", source:[448], accent:[457,465], intent:"Cuatro grupos de medianoche sin una versión dominante" },
  { mapId:1446, motif:"threshold", source:[584], accent:[593], intent:"Vitrina abierta para objetos que todavía no se perdieron" },
  { mapId:1471, motif:"wave", source:[760], accent:[769], intent:"Dos ondas de restauración para el arrecife paradójico" },
  { mapId:1496, motif:"checker", source:[1060], accent:[1077,1069], intent:"Dos trayectorias alternadas que conservan los nombres del cometa" },
  { mapId:1521, motif:"spiral", source:[388], accent:[385,386], intent:"Espiral de ceniza que vuelve visible el residuo vivo" },
  { mapId:1546, motif:"threshold", source:[610], accent:[604,606,612], intent:"Umbral ritual que expone la profecía fabricada" },
  { mapId:1571, motif:"checker", source:[824], accent:[833], intent:"Parcelas de memoria que la ciudad ya no puede cobrar" },
  { mapId:1596, motif:"split", source:[420], accent:[429,437,430], intent:"Dos columnas de cartas familiares sin futuro obligatorio" },
  { mapId:1621, motif:"threshold", source:[388], accent:[386,385], intent:"Portal pequeño con costo visible y retorno despejado" },
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
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), "Originales anteriores al macrociclo visual 01 (sectores 01-25). Restaura estos mapas para revertir únicamente las composiciones de piso.\n");
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
    visualBatch: Math.floor(CONFIGS.indexOf(config) / 5) + 1,
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
  if (report.maps.length !== 25) errors.push(`macrociclo incompleto: ${report.maps.length}/25 mapas`);
  if (report.summary.visualBatches !== 5) errors.push(`lotes incorrectos: ${report.summary.visualBatches}/5`);
  if (errors.length) throw new Error(`Macrociclo visual inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: ${report.summary.visualBatches} lotes visuales, ${report.maps.length} anclas y ${report.summary.changedCells} celdas narrativas; pasabilidad, eventos y retorno preservados.`);
}

if (VERIFY_ONLY) {
  if (!fs.existsSync(OUTPUT)) throw new Error("Falta content/atlas_visual_polish_macro01.json.");
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
    macroCycle: 1,
    scope: {
      visualBatches: [1,2,3,4,5],
      sectors: [1,25],
      maps: maps.map((entry) => entry.mapId),
      method: "Composición de piso narrativa con tiles existentes y equivalencia estricta de colisión.",
    },
    summary: {
      visualBatches: 5,
      maps: maps.length,
      changedCells: maps.reduce((sum, entry) => sum + entry.changedCells, 0),
      exactPatternPlacements: maps.filter((entry) => !entry.usedFallbackPlacement).length,
      adaptivePatternPlacements: maps.filter((entry) => entry.usedFallbackPlacement).length,
      eventsMoved: 0,
      passabilityChangedCells: 0,
      inheritedGeometryRemainingAfterStyleGate: 15,
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
  console.log(`Macrociclo visual 01 aplicado. Backup: ${path.relative(ROOT, BACKUP)}`);
}
