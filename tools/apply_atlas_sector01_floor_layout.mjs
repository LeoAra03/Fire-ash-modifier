#!/usr/bin/env node
/**
 * Completa el suelo de tres interiores del piloto Meridiano Ámbar usando solo
 * tiles ya presentes en sus mapas Fire Ash. No mueve eventos ni altera otras capas.
 *
 *   node tools/apply_atlas_sector01_floor_layout.mjs          # aplica/idempotente
 *   node tools/apply_atlas_sector01_floor_layout.mjs --verify  # solo verifica
 *   node tools/apply_atlas_sector01_floor_layout.mjs --restore # revierte solo capa 0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";
import { parseEvent, parseMap, parseTileset, tableGet, tableSet, tableToUserDef } from "../web/js/rmxp.js";
import { passabilityOf, reachableCells } from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const BACKUP = path.join(GAME, "PokeModBackups", "atlas_sector01_floor_layout_main_4763ec19_originals");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_sector01_floor_layout.json"), "utf8"));
const VERIFY_ONLY = process.argv.includes("--verify");
const RESTORE = process.argv.includes("--restore");
if (VERIFY_ONLY && RESTORE) throw new Error("Usa --verify o --restore, no ambos.");

const iv = (object, name) => object?.getIvar?.(name);
const text = (value) => value instanceof RString ? value.text : String(value ?? "");
const pad = (value) => String(value).padStart(3, "0");
const mapFile = (mapId) => `Map${pad(mapId)}.rxdata`;
const filePath = (mapId) => path.join(DATA, mapFile(mapId));
const backupPath = (mapId) => path.join(BACKUP, mapFile(mapId));
const readRaw = (mapId) => marshalLoad(fs.readFileSync(filePath(mapId)));
const readParsed = (mapId) => parseMap(readRaw(mapId));
const writeBuffer = (mapId, buffer) => fs.writeFileSync(filePath(mapId), buffer);
const errors = [];
const ok = (condition, message) => { if (!condition) errors.push(message); };

function countTile(table, tileId, layer) {
  let count = 0;
  for (let y = 0; y < table.y; y++) for (let x = 0; x < table.x; x++) {
    if (tableGet(table, x, y, layer) === tileId) count++;
  }
  return count;
}
function tileProperty(tileset, property, tileId) {
  return Number(tileset?.[property]?.data?.[tileId] ?? -1);
}
function commandList(event) {
  return (iv(event, "pages") || []).flatMap((page) => iv(page, "list") || []);
}
function eventByName(mapId, name) {
  const raw = readRaw(mapId);
  return iv(raw, "events")?.pairs?.find(([, event]) => text(iv(event, "name")) === name)?.[1] ?? null;
}
function transferForEvent(mapId, name) {
  const event = eventByName(mapId, name);
  if (!event) throw new Error(`Mapa ${mapId}: no existe el evento de transferencia «${name}».`);
  const command = commandList(event).find((entry) => Number(iv(entry, "code")) === 201);
  if (!command) throw new Error(`Mapa ${mapId}: «${name}» no contiene una transferencia válida.`);
  const params = iv(command, "parameters") || [];
  return { mapId: Number(params[1]), x: Number(params[2]), y: Number(params[3]) };
}
function oneStepAvailable(mapId, x, y) {
  const parsed = readParsed(mapId);
  if (x < 0 || y < 0 || x >= parsed.width || y >= parsed.height) return false;
  const pass = passabilityOf(parsed, parsed.tilesetId);
  return [2, 4, 6, 8].some((direction) => pass.canMove(x, y, direction));
}
function assertUsableTransfer(sourceMapId, eventName, expectedTargetId) {
  const destination = transferForEvent(sourceMapId, eventName);
  ok(destination.mapId === expectedTargetId,
    `Transferencia ${sourceMapId}/${eventName}: destino ${destination.mapId}, esperado ${expectedTargetId}.`);
  const destinationFile = filePath(destination.mapId);
  if (!fs.existsSync(destinationFile)) {
    errors.push(`Transferencia ${sourceMapId}/${eventName}: falta ${mapFile(destination.mapId)}.`);
    return destination;
  }
  const target = readParsed(destination.mapId);
  ok(destination.x >= 0 && destination.y >= 0 && destination.x < target.width && destination.y < target.height,
    `Llegada ${destination.mapId} (${destination.x},${destination.y}) fuera del mapa.`);
  ok(oneStepAvailable(destination.mapId, destination.x, destination.y),
    `Llegada ${destination.mapId} (${destination.x},${destination.y}) no permite salir caminando.`);
  return destination;
}

function expectedEntry(mapId) {
  if (mapId === 1021) return { sourceMapId: CONFIG.entryHub.mapId, eventName: CONFIG.entryHub.eventName };
  const layout = CONFIG.maps.find((entry) => Number(entry.mapId) === mapId);
  if (layout?.entry) return { sourceMapId: Number(layout.entry.fromMapId), eventName: layout.entry.eventName };
  if (mapId >= 1022 && mapId <= 1025) return { sourceMapId: mapId - 1, eventName: "Next Atlas Map" };
  throw new Error(`No se definió punto de entrada para el mapa ${mapId}.`);
}
function eventAccessibleFromReachableCell(event, reachable, width, height) {
  if (reachable.has(`${event.x},${event.y}`)) return true;
  // RMXP action-button events on wall-mounted objects (for example a PC tile)
  // are activated while facing the event from an adjacent walkable square.
  if (!event.pages.some((page) => Number(page.trigger) === 0)) return false;
  return [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => {
    const x = event.x + dx;
    const y = event.y + dy;
    return x >= 0 && y >= 0 && x < width && y < height && reachable.has(`${x},${y}`);
  });
}
function auditPilotReachability() {
  const pilotMaps = [1021, 1022, 1023, 1024, 1025];
  for (const mapId of pilotMaps) {
    const incoming = expectedEntry(mapId);
    const spawn = transferForEvent(incoming.sourceMapId, incoming.eventName);
    ok(spawn.mapId === mapId, `Entrada a ${mapId} desde ${incoming.sourceMapId}: el destino es ${spawn.mapId}.`);
    if (spawn.mapId !== mapId) continue;

    const parsed = readParsed(mapId);
    const pass = passabilityOf(parsed, parsed.tilesetId);
    const reachable = reachableCells(pass, [spawn.x, spawn.y]);
    ok(spawn.x >= 0 && spawn.y >= 0 && spawn.x < parsed.width && spawn.y < parsed.height,
      `${mapId}: punto de entrada (${spawn.x},${spawn.y}) fuera del mapa.`);
    ok(reachable.size > 1, `${mapId}: punto de entrada bloqueado o sin salida (${spawn.x},${spawn.y}).`);
    for (const { obj } of parsed.events) {
      const event = parseEvent(obj);
      ok(eventAccessibleFromReachableCell(event, reachable, parsed.width, parsed.height), `${mapId}: evento inalcanzable «${event.name}» (${event.x},${event.y}).`);
    }

    const exits = [
      { name: "Return to Puerto Horizonte", target: 1001, required: true },
      { name: "Previous Atlas Map", target: mapId - 1, required: mapId > 1021 },
      { name: "Next Atlas Map", target: mapId + 1, required: true },
    ];
    for (const exit of exits) {
      const event = eventByName(mapId, exit.name);
      if (exit.required) ok(Boolean(event), `${mapId}: falta la salida «${exit.name}».`);
      if (event) assertUsableTransfer(mapId, exit.name, exit.target);
    }
  }
}

function verifyFloorLayouts() {
  const tilesetsRaw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const tileset = parseTileset(tilesetsRaw[CONFIG.tilesetId]);
  ok(tileset.tilesetName === CONFIG.tilesetName,
    `Tileset ${CONFIG.tilesetId}: nombre «${tileset.tilesetName}», esperado «${CONFIG.tilesetName}».`);
  for (const spec of CONFIG.maps) {
    const parsed = readParsed(spec.mapId);
    ok(parsed.width === spec.width && parsed.height === spec.height,
      `${spec.mapId}: dimensiones ${parsed.width}x${parsed.height}, esperadas ${spec.width}x${spec.height}.`);
    ok(parsed.tilesetId === CONFIG.tilesetId,
      `${spec.mapId}: tileset ${parsed.tilesetId}, esperado ${CONFIG.tilesetId}.`);
    const voidCount = countTile(parsed.table, CONFIG.voidTile, CONFIG.layer);
    const floorCount = countTile(parsed.table, spec.floorTile, CONFIG.layer);
    ok(voidCount === 0, `${spec.mapId}: quedan ${voidCount} celdas vacías con tile ${CONFIG.voidTile}.`);
    ok(floorCount === spec.floorCellsAfter,
      `${spec.mapId}: suelo ${spec.floorTile} aparece ${floorCount} veces, esperado ${spec.floorCellsAfter}.`);
    ok(tileProperty(tileset, "passages", spec.floorTile) === 0,
      `${spec.mapId}: tile de suelo ${spec.floorTile} no es plenamente transitable.`);
    ok(tileProperty(tileset, "priorities", spec.floorTile) === 0,
      `${spec.mapId}: tile de suelo ${spec.floorTile} tiene prioridad distinta de cero.`);
    ok(tileProperty(tileset, "terrain", spec.floorTile) === 0,
      `${spec.mapId}: tile de suelo ${spec.floorTile} altera la etiqueta de terreno.`);
  }
}

function verify() {
  for (const spec of CONFIG.maps) {
    if (!fs.existsSync(filePath(spec.mapId))) {
      errors.push(`Falta ${mapFile(spec.mapId)}.`);
      continue;
    }
  }
  if (!errors.length) {
    verifyFloorLayouts();
    auditPilotReachability();
  }
  if (errors.length) throw new Error(`Diseño del Sector 1 inválido (${errors.length}):\n- ${errors.slice(0, 100).join("\n- ")}`);
  const replacements = CONFIG.maps.reduce((sum, entry) => sum + entry.voidCellsBefore, 0);
  console.log(`Verificación OK: ${CONFIG.maps.length} interiores, ${replacements} celdas de vacío rellenadas con tiles nativos; 5/5 mapas alcanzables, eventos accesibles y retornos/portales transitables.`);
}

function backupOriginals(beforeBuffers) {
  // Preflight all existing/new backups before writing any backup or map.
  for (const spec of CONFIG.maps) {
    const target = backupPath(spec.mapId);
    const source = fs.existsSync(target)
      ? fs.readFileSync(target)
      : beforeBuffers.get(spec.mapId);
    const backupMap = parseMap(marshalLoad(source));
    const voidCount = countTile(backupMap.table, CONFIG.voidTile, CONFIG.layer);
    const floorCount = countTile(backupMap.table, spec.floorTile, CONFIG.layer);
    if (voidCount !== spec.voidCellsBefore || floorCount !== spec.floorCellsBefore) {
      throw new Error(`Backup ${mapFile(spec.mapId)} no coincide con el mapa base esperado; no se modificó ningún mapa.`);
    }
  }
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const spec of CONFIG.maps) {
    const target = backupPath(spec.mapId);
    if (!fs.existsSync(target)) fs.writeFileSync(target, beforeBuffers.get(spec.mapId));
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), [
    "Copia anterior al relleno de los interiores del Sector 1.",
    "El script --restore revierte solo la capa 0 y conserva eventos u otros campos que se hayan editado después.",
    "Los archivos son backups de trabajo y no se distribuyen en Git.",
    "",
  ].join("\n"));
}

function apply() {
  const beforeBuffers = new Map();
  const afterBuffers = new Map();
  let pending = 0;
  for (const spec of CONFIG.maps) {
    const beforeBuffer = fs.readFileSync(filePath(spec.mapId));
    beforeBuffers.set(spec.mapId, beforeBuffer);
    const raw = marshalLoad(beforeBuffer);
    const parsed = parseMap(raw);
    const voidCount = countTile(parsed.table, CONFIG.voidTile, CONFIG.layer);
    const floorCount = countTile(parsed.table, spec.floorTile, CONFIG.layer);
    const alreadyApplied = voidCount === 0 && floorCount === spec.floorCellsAfter;
    const cleanBase = voidCount === spec.voidCellsBefore && floorCount === spec.floorCellsBefore;
    if (!alreadyApplied && !cleanBase) {
      throw new Error(`${spec.mapId}: estado no reconocido (vacío=${voidCount}, suelo=${floorCount}); se abortó antes de escribir.`);
    }
    if (alreadyApplied) continue;

    for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) {
      if (tableGet(parsed.table, x, y, CONFIG.layer) === CONFIG.voidTile) {
        tableSet(parsed.table, x, y, CONFIG.layer, spec.floorTile);
        pending++;
      }
    }
    raw.setIvar("data", tableToUserDef(parsed.table));
    const afterBuffer = Buffer.from(marshalDump(raw));
    const reparsed = parseMap(marshalLoad(afterBuffer));
    if (countTile(reparsed.table, CONFIG.voidTile, CONFIG.layer) !== 0
      || countTile(reparsed.table, spec.floorTile, CONFIG.layer) !== spec.floorCellsAfter) {
      throw new Error(`${spec.mapId}: serialización del suelo no pasó la comprobación de vuelta.`);
    }
    afterBuffers.set(spec.mapId, afterBuffer);
  }

  if (pending === 0) {
    verify();
    console.log("No hubo cambios: el diseño ya estaba aplicado.");
    return;
  }
  backupOriginals(beforeBuffers);
  const staged = [];
  try {
    for (const [mapId, buffer] of afterBuffers) {
      const temporary = `${filePath(mapId)}.sector01-layout.tmp`;
      fs.writeFileSync(temporary, buffer);
      staged.push({ mapId, temporary });
    }
    for (const entry of staged) fs.renameSync(entry.temporary, filePath(entry.mapId));
    verify();
    console.log(`Diseño visual aplicado: ${pending} celdas de piso. Backup: ${path.relative(ROOT, BACKUP)}`);
  } catch (error) {
    for (const entry of staged) {
      try { fs.rmSync(entry.temporary, { force: true }); } catch { /* limpieza best-effort */ }
    }
    for (const [mapId, buffer] of beforeBuffers) {
      try { writeBuffer(mapId, buffer); } catch { /* el backup permanece para recuperación manual */ }
    }
    throw error;
  }
}

function restore() {
  const beforeBuffers = new Map();
  const restoredBuffers = new Map();
  for (const spec of CONFIG.maps) {
    if (!fs.existsSync(backupPath(spec.mapId))) throw new Error(`No existe backup para ${mapFile(spec.mapId)}.`);
    const currentRaw = readRaw(spec.mapId);
    const current = parseMap(currentRaw);
    const originalRaw = marshalLoad(fs.readFileSync(backupPath(spec.mapId)));
    const original = parseMap(originalRaw);
    if (current.width !== original.width || current.height !== original.height || current.tilesetId !== original.tilesetId) {
      throw new Error(`${spec.mapId}: mapa cambió de dimensiones/tileset; rollback bloqueado para evitar sobrescritura.`);
    }
    let isOriginal = true;
    let isApplied = true;
    for (let z = 0; z < current.table.z; z++) for (let y = 0; y < current.height; y++) for (let x = 0; x < current.width; x++) {
      const oldTile = tableGet(original.table, x, y, z);
      const currentTile = tableGet(current.table, x, y, z);
      const expectedApplied = z === CONFIG.layer && oldTile === CONFIG.voidTile ? spec.floorTile : oldTile;
      if (currentTile !== oldTile) isOriginal = false;
      if (currentTile !== expectedApplied) isApplied = false;
    }
    if (!isOriginal && !isApplied) {
      throw new Error(`${spec.mapId}: geometría cambió después del layout; rollback bloqueado para no borrar trabajo ajeno.`);
    }
    if (isOriginal) continue;
    beforeBuffers.set(spec.mapId, fs.readFileSync(filePath(spec.mapId)));
    currentRaw.setIvar("data", iv(originalRaw, "data"));
    restoredBuffers.set(spec.mapId, Buffer.from(marshalDump(currentRaw)));
  }
  if (restoredBuffers.size === 0) {
    console.log("No hubo cambios: la capa 0 ya estaba restaurada.");
    return;
  }
  const staged = [];
  try {
    for (const [mapId, buffer] of restoredBuffers) {
      const temporary = `${filePath(mapId)}.sector01-layout-restore.tmp`;
      fs.writeFileSync(temporary, buffer);
      staged.push({ mapId, temporary });
    }
    for (const entry of staged) fs.renameSync(entry.temporary, filePath(entry.mapId));
    console.log(`Rollback OK: capa 0 restaurada en ${CONFIG.maps.map((entry) => entry.mapId).join(", ")}; eventos y otros campos actuales conservados.`);
  } catch (error) {
    for (const entry of staged) {
      try { fs.rmSync(entry.temporary, { force: true }); } catch { /* limpieza best-effort */ }
    }
    for (const [mapId, buffer] of beforeBuffers) {
      try { writeBuffer(mapId, buffer); } catch { /* el backup permanece para recuperación manual */ }
    }
    throw error;
  }
}

if (RESTORE) restore();
else if (VERIFY_ONLY) verify();
else apply();
