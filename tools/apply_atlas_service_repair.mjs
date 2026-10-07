#!/usr/bin/env node
/**
 * Restaura servicios Atlas desde sus mapas fuente sin reponer escenas ni
 * progresión narrativa. Reasigna IDs de evento, conserva páginas/flags y
 * redirige las transferencias internas al equivalente Atlas cuando existe.
 *
 * Uso:
 *   node tools/apply_atlas_service_repair.mjs --plan
 *   node tools/apply_atlas_service_repair.mjs
 *   node tools/apply_atlas_service_repair.mjs --verify
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { marshalDump, marshalLoad, RString } from "../web/js/marshal.js";
import { parseMap, tableGet } from "../web/js/rmxp.js";
import { passabilityOf, reachableCells } from "./lib/map_painter.mjs";
import { DATA, GAME, ROOT, readMarshalData } from "./lib/fire_ash_registry.mjs";

const HIERARCHY = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const REPORT_PATH = path.join(ROOT, "content", "atlas_service_repair_report.json");
const BACKUP_DIR = path.join(GAME, "PokeModBackups", "atlas_service_repair_originals");
const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN_ONLY = process.argv.includes("--plan");
const DRIFT_ONLY = process.argv.includes("--drift");
const WRITE = !VERIFY_ONLY && !PLAN_ONLY;
const pad = (id) => String(id).padStart(3, "0");
const keyOf = (x, y) => `${x},${y}`;
const iv = (object, name) => object?.getIvar?.(name);
const text = (value) => value instanceof RString ? value.text : String(value ?? "");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const eventHash = (event) => hash(Buffer.from(marshalDump(event)));
const cloneMarshal = (value) => marshalLoad(Buffer.from(marshalDump(value)));
const readMap = (id) => marshalLoad(fs.readFileSync(path.join(DATA, `Map${pad(id)}.rxdata`)));
const writeMap = (id, value) => fs.writeFileSync(path.join(DATA, `Map${pad(id)}.rxdata`), Buffer.from(marshalDump(value)));

const maps = HIERARCHY.maps;
const atlasBySource = new Map(maps.map((map) => [Number(map.sourceId), Number(map.mapId)]));
const mapByAtlas = new Map(maps.map((map) => [Number(map.mapId), map]));

const SERVICE_TYPES = new Map([
  ["nurse", "healing"],
  ["mirror nurse", "healing"],
  ["pc", "storage"],
  ["healing balls left", "center_fixture"],
  ["healing balls right", "center_fixture"],
  ["mart", "shop"],
  ["mart door", "shop_door"],
  ["poké center door", "center_door"],
  ["shop", "specialty_shop"],
  ["shop exit", "shop_exit"],
  ["coin seller", "coin_service"],
  ["chefmart", "specialty_shop"],
  ["triple triad card shop", "specialty_shop"],
  ["wonder trade", "wonder_trade"],
  ["game corner door", "game_corner_door"],
]);
const DOOR_TYPES = new Set(["shop_door", "center_door", "shop_exit", "game_corner_door"]);
const STATEFUL_CANDIDATE_NAMES = /^(?:counter\s*\(\d+\)|trader\s*-\s*basic|trade|trade\s*-\s*advanced|trade-basic)$/i;
const SPECIAL_REVIEW_NAMES = /^(?:center|coin case giver|heal[cmgp])$/i;

function normalizedName(value) {
  return text(value).normalize("NFC").trim().toLocaleLowerCase("en-US");
}

function commandsFor(event) {
  const commands = [];
  for (const [pageIndex, page] of (iv(event, "pages") || []).entries()) {
    for (const [commandIndex, command] of (iv(page, "list") || []).entries()) {
      commands.push({ pageIndex, commandIndex, command, code: Number(iv(command, "code")) });
    }
  }
  return commands;
}

function hasCode(event, code) {
  return commandsFor(event).some((entry) => entry.code === code);
}

function hasStoryStateConditions(event) {
  for (const page of iv(event, "pages") || []) {
    const condition = iv(page, "condition");
    if (iv(condition, "switch1_valid") || iv(condition, "switch2_valid") ||
        iv(condition, "variable_valid") || iv(condition, "self_switch_valid")) return true;
  }
  return false;
}

function serviceTypeFor(event) {
  const name = normalizedName(iv(event, "name"));
  if (SERVICE_TYPES.has(name)) return SERVICE_TYPES.get(name);
  if (/^heal(?:ing)?(?:,\s*size\(\d+\s*,\s*\d+\))?$/.test(name)) return "healing";
  // One genuinely generic one-command healer is safe; stateful HealC/G/M/P
  // variants are deliberately handled by the exclusion audit below.
  if (name === "healer" && hasCode(event, 314) && !hasStoryStateConditions(event)) return "healing";
  return null;
}

function transferCommands(event) {
  return commandsFor(event).filter((entry) => entry.code === 201).map((entry) => {
    const params = iv(entry.command, "parameters") || [];
    return {
      pageIndex: entry.pageIndex,
      commandIndex: entry.commandIndex,
      mapId: Number(params[1] ?? 0),
      x: Number(params[2] ?? 0),
      y: Number(params[3] ?? 0),
      direction: Number(params[4] ?? 0),
    };
  });
}

function referencesProtectedVariable(event) {
  const scripts = [];
  for (const { command, code } of commandsFor(event)) {
    const params = iv(command, "parameters") || [];
    if ((code === 355 || code === 655) && /(?:v\s*\[\s*264\s*\]|\$game_variables\s*\[\s*264\s*\])/i.test(text(params[0]))) {
      scripts.push(text(params[0]));
    }
    if (code === 111 && Number(params[0]) === 1 && Number(params[1]) === 264) {
      scripts.push("Conditional branch uses variable 264");
    }
    if (code === 122 && Number(params[0]) <= 264 && Number(params[1]) >= 264) {
      scripts.push(`Control Variables ${params[0]}..${params[1]}`);
    }
  }
  for (const page of iv(event, "pages") || []) {
    const condition = iv(page, "condition");
    if (iv(condition, "variable_valid") && Number(iv(condition, "variable_id")) === 264) {
      scripts.push("Page condition uses variable 264");
    }
  }
  return scripts;
}

function inspectSourceEvent(event) {
  const type = serviceTypeFor(event);
  if (!type) return null;
  const transfers = transferCommands(event);
  const externalTransfers = transfers.filter((transfer) => transfer.mapId > 0 && !atlasBySource.has(transfer.mapId));
  if (externalTransfers.length) {
    return { excluded: true, reason: "destination map has no Atlas counterpart", type, transfers: externalTransfers };
  }
  const protectedVariableRefs = referencesProtectedVariable(event);
  if (protectedVariableRefs.length) {
    return { excluded: true, reason: "references protected variable 264", type, protectedVariableRefs };
  }
  return { excluded: false, type, transfers };
}

function isAtlasGeneratedEvent(name) {
  return /^(?:Return to Puerto Horizonte|Previous Atlas Map|Next Atlas Map|Atlas Tier [123] Beacon \d+|Atlas desafío \d+|PokeMod Tier3: Eco \d+)$/i.test(name);
}

function isProtectedAuthoredEvent(name) {
  return /^PokeMod Tier[12]:/i.test(name) || /^PokeMod Tier3: (?:NPC|Conductor|Decisión|Jefe)/i.test(name);
}

function isAtlasPortalEvent(name) {
  return /^(?:Return to Puerto Horizonte|Previous Atlas Map|Next Atlas Map)$/.test(name) || name.startsWith("PokeMod Atlas Mil:");
}

function mapEventPairs(mapObject) {
  const eventHash = iv(mapObject, "events");
  if (!eventHash?.pairs) throw new Error("El mapa no contiene un hash de eventos RPG::Map");
  return eventHash.pairs;
}

function mapOccupancy(eventPairs) {
  const occupancy = new Map();
  for (const [id, event] of eventPairs) {
    const key = keyOf(Number(iv(event, "x")), Number(iv(event, "y")));
    if (!occupancy.has(key)) occupancy.set(key, []);
    occupancy.get(key).push({ id: Number(id), event });
  }
  return occupancy;
}

function openCell(pass, x, y) {
  return x > 0 && y > 0 && x < pass.width - 1 && y < pass.height - 1 &&
    [2, 4, 6, 8].every((direction) => pass.passable(x, y, direction));
}

function hasClearUpperLayers(parsed, x, y) {
  return tableGet(parsed.table, x, y, 1) === 0 && tableGet(parsed.table, x, y, 2) === 0;
}

function findReturnAnchor(eventPairs, parsed) {
  const pair = eventPairs.find(([, event]) => text(iv(event, "name")) === "Return to Puerto Horizonte");
  if (!pair) return [Math.floor(parsed.width / 2), Math.floor(parsed.height / 2)];
  return [Number(iv(pair[1], "x")), Number(iv(pair[1], "y"))];
}

function collectIncomingSpawns() {
  const incoming = new Map();
  const mapIds = [1001, ...maps.map((map) => Number(map.mapId))];
  for (const mapId of mapIds) {
    const mapObject = readMap(mapId);
    for (const [, event] of mapEventPairs(mapObject)) {
      if (!isAtlasPortalEvent(text(iv(event, "name")))) continue;
      for (const transfer of transferCommands(event)) {
        if (!mapByAtlas.has(transfer.mapId)) continue;
        if (!incoming.has(transfer.mapId)) incoming.set(transfer.mapId, new Set());
        incoming.get(transfer.mapId).add(keyOf(transfer.x, transfer.y));
      }
    }
  }
  return incoming;
}

function nearestFreeReachableCell(parsed, eventPairs, desired, reservedKeys) {
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const occupancy = mapOccupancy(eventPairs);
  const blocked = new Set([...occupancy.keys(), ...reservedKeys]);
  const anchor = findReturnAnchor(eventPairs, parsed);
  const starts = [];
  for (let y = 1; y < parsed.height - 1; y++) {
    for (let x = 1; x < parsed.width - 1; x++) {
      const key = keyOf(x, y);
      if (blocked.has(key) || !openCell(pass, x, y)) continue;
      starts.push({ x, y, key, anchorDistance: Math.abs(x - anchor[0]) + Math.abs(y - anchor[1]) });
    }
  }
  starts.sort((a, b) => a.anchorDistance - b.anchorDistance || a.y - b.y || a.x - b.x);
  if (!starts.length) throw new Error(`Mapa sin celda libre para reubicar un evento`);

  const orderedStarts = [...starts].sort((a, b) => {
    const da = Math.abs(a.x - desired[0]) + Math.abs(a.y - desired[1]);
    const db = Math.abs(b.x - desired[0]) + Math.abs(b.y - desired[1]);
    return a.anchorDistance - b.anchorDistance || da - db || a.y - b.y || a.x - b.x;
  });
  const triedComponents = new Set();
  let best = null;
  for (const start of orderedStarts.slice(0, 48)) {
    if (triedComponents.has(start.key)) continue;
    const reachable = reachableCells(pass, [start.x, start.y], { blocked });
    for (const cellKey of reachable) triedComponents.add(cellKey);
    const componentCandidates = [];
    for (const cellKey of reachable) {
      if (blocked.has(cellKey)) continue;
      const [x, y] = cellKey.split(",").map(Number);
      if (!openCell(pass, x, y)) continue;
      componentCandidates.push({ x, y, clear: hasClearUpperLayers(parsed, x, y), size: reachable.size });
    }
    const clear = componentCandidates.filter((candidate) => candidate.clear);
    const candidates = clear.length ? clear : componentCandidates;
    for (const candidate of candidates) {
      const distance = Math.abs(candidate.x - desired[0]) + Math.abs(candidate.y - desired[1]);
      const score = [distance, candidate.clear ? 0 : 1, -candidate.size, candidate.y, candidate.x];
      const isBetter = !best || score.some((value, index) =>
        value < best.score[index] && score.slice(0, index).every((x, i) => x === best.score[i]));
      if (isBetter) best = { ...candidate, score };
    }
    if (best && best.score[0] <= 1 && start.anchorDistance <= 2) break;
  }
  if (!best) throw new Error(`No hay celda alcanzable cerca de (${desired[0]},${desired[1]})`);
  return { x: best.x, y: best.y, clearUpperLayers: best.clear };
}

function relocateExistingEvent(parsed, eventPairs, occupant, desired, reservedKeys) {
  const event = occupant.event;
  const name = text(iv(event, "name"));
  if (!isAtlasGeneratedEvent(name)) {
    throw new Error(`Colisión con evento no movible: ${name}#${occupant.id} en (${desired[0]},${desired[1]})`);
  }
  const old = [Number(iv(event, "x")), Number(iv(event, "y"))];
  const newCell = nearestFreeReachableCell(parsed, eventPairs, old, reservedKeys);
  event.setIvar("x", newCell.x);
  event.setIvar("y", newCell.y);
  return {
    eventId: occupant.id,
    name,
    from: old,
    to: [newCell.x, newCell.y],
    reason: "restaurar un acceso o servicio original que comparte la celda con una baliza/portal Atlas reubicable",
    placementNote: newCell.clearUpperLayers ? "suelo libre y alcanzable" : "alcanzable; la celda conserva un tile superior del mapa",
  };
}

function cloneServiceEvent(sourceEvent, targetEventId, targetPosition, transfers) {
  const clone = cloneMarshal(sourceEvent);
  clone.setIvar("id", targetEventId);
  clone.setIvar("x", targetPosition[0]);
  clone.setIvar("y", targetPosition[1]);
  const remapped = [];
  for (const transfer of transfers) {
    const mappedId = transfer.mapId > 0 ? atlasBySource.get(transfer.mapId) : transfer.mapId;
    if (mappedId === undefined) continue;
    const page = (iv(clone, "pages") || [])[transfer.pageIndex];
    const command = (iv(page, "list") || [])[transfer.commandIndex];
    const params = iv(command, "parameters");
    const from = Number(params[1] ?? 0);
    if (from !== mappedId) {
      params[1] = mappedId;
      remapped.push({
        sourceMapId: from,
        atlasMapId: mappedId,
        x: transfer.x,
        y: transfer.y,
        direction: transfer.direction,
        pageIndex: transfer.pageIndex,
        commandIndex: transfer.commandIndex,
      });
    }
  }
  return { event: clone, transferRemaps: remapped };
}

function stateEvidence(event) {
  const codes = {};
  const switchConditions = new Set();
  const variableConditions = new Set();
  const selfSwitchPages = [];
  const scriptLines = [];
  for (const page of iv(event, "pages") || []) {
    const condition = iv(page, "condition");
    if (iv(condition, "switch1_valid")) switchConditions.add(Number(iv(condition, "switch1_id")));
    if (iv(condition, "switch2_valid")) switchConditions.add(Number(iv(condition, "switch2_id")));
    if (iv(condition, "variable_valid")) variableConditions.add(Number(iv(condition, "variable_id")));
    if (iv(condition, "self_switch_valid")) selfSwitchPages.push(text(iv(condition, "self_switch_ch")));
  }
  for (const { command, code } of commandsFor(event)) {
    codes[code] = (codes[code] || 0) + 1;
    const params = iv(command, "parameters") || [];
    if (code === 121) for (let id = Number(params[0]); id <= Number(params[1]); id++) switchConditions.add(id);
    if (code === 122) for (let id = Number(params[0]); id <= Number(params[1]); id++) variableConditions.add(id);
    if (code === 355 || code === 655) scriptLines.push(text(params[0]));
  }
  return {
    pageCount: (iv(event, "pages") || []).length,
    switchIds: [...switchConditions].filter(Number.isFinite).sort((a, b) => a - b),
    variableIds: [...variableConditions].filter(Number.isFinite).sort((a, b) => a - b),
    selfSwitchPages,
    commandCounts: codes,
    scriptSamples: [...new Set(scriptLines.filter(Boolean))].slice(0, 4),
  };
}

function candidateInventory() {
  const inventory = {
    sourceMapsScanned: maps.length,
    serviceEvents: [],
    excluded: [],
    nameHits: {},
    statefulCounts: { counters: 0, tradeEvents: 0, specialStateful: 0 },
  };
  for (const map of maps) {
    const sourceMap = parseMap(readMarshalData(`Map${pad(map.sourceId)}.rxdata`));
    for (const { id, obj } of sourceMap.events) {
      const name = text(iv(obj, "name"));
      const lower = normalizedName(name);
      const classification = inspectSourceEvent(obj);
      if (classification) {
        inventory.nameHits[name] = (inventory.nameHits[name] || 0) + 1;
        if (classification.excluded) {
          inventory.excluded.push({ mapId: map.mapId, sourceId: map.sourceId, eventId: id, name, reason: classification.reason, details: classification.transfers || classification.protectedVariableRefs });
          continue;
        }
        inventory.serviceEvents.push({
          mapId: Number(map.mapId), sourceId: Number(map.sourceId), sourceEventId: Number(id), name,
          type: classification.type, x: Number(iv(obj, "x")), y: Number(iv(obj, "y")), transfers: classification.transfers,
        });
        continue;
      }
      if (STATEFUL_CANDIDATE_NAMES.test(name)) {
        inventory.nameHits[name] = (inventory.nameHits[name] || 0) + 1;
        const isCounter = /^counter/i.test(name);
        if (isCounter) inventory.statefulCounts.counters++;
        else inventory.statefulCounts.tradeEvents++;
        inventory.excluded.push({
          mapId: Number(map.mapId), sourceId: Number(map.sourceId), sourceEventId: Number(id), name,
          reason: isCounter
            ? "nombre genérico de evento; no se copia por etiqueta porque los comandos pueden ser historia, combate, regalo o lógica local"
            : "intercambio de Pokémon de un solo uso; el self-switch A está ligado al ID/mapa original y una copia lo reactivaría sin sincronizar la finalización",
          evidence: stateEvidence(obj),
        });
      } else if (SPECIAL_REVIEW_NAMES.test(name)) {
        inventory.nameHits[name] = (inventory.nameHits[name] || 0) + 1;
        inventory.statefulCounts.specialStateful++;
        inventory.excluded.push({
          mapId: Number(map.mapId), sourceId: Number(map.sourceId), sourceEventId: Number(id), name,
          reason: lower === "center" ? "sets the party's respawn/Pokémon Center location; intentionally not duplicated in Atlas" :
            lower === "coin case giver" ? "one-time progression item/event, not a reusable service" :
              "special heal event has map-specific switch, variable, self-switch or cutscene behavior",
          evidence: stateEvidence(obj),
        });
      }
    }
  }
  inventory.serviceEvents.sort((a, b) => a.mapId - b.mapId || a.sourceEventId - b.sourceEventId);
  return inventory;
}

function existingManifestIndex(report) {
  const result = new Map();
  for (const service of report?.services || []) result.set(`${service.mapId}:${service.sourceEventId}`, service);
  return result;
}

function currentOccupantsAt(eventPairs, x, y) {
  return (mapOccupancy(eventPairs).get(keyOf(x, y)) || []).slice();
}

function plannedMap(map, candidates, oldReport, incomingSpawns) {
  const targetObject = readMap(map.mapId);
  const parsed = parseMap(targetObject);
  const targetEventHash = iv(targetObject, "events");
  const eventPairs = targetEventHash.pairs;
  const occupancy = mapOccupancy(eventPairs);
  const previous = existingManifestIndex(oldReport);
  const reservedKeys = new Set([
    ...candidates.map((candidate) => keyOf(candidate.x, candidate.y)),
    ...(incomingSpawns.get(Number(map.mapId)) || []),
  ]);
  const collisions = [];
  const services = [];
  let nextId = Math.max(0, ...eventPairs.map(([id]) => Number(id) || 0)) + 1;
  let changed = false;

  for (const candidate of candidates) {
    const previousEntry = previous.get(`${candidate.mapId}:${candidate.sourceEventId}`);
    if (previousEntry) {
      const current = eventPairs.find(([id]) => Number(id) === Number(previousEntry.targetEventId))?.[1];
      if (!current || eventHash(current) !== previousEntry.targetHash) {
        throw new Error(`Map${map.mapId}: el servicio ${candidate.name}#${candidate.sourceEventId} cambió después de aplicarse; no lo duplico ni sobrescribo`);
      }
      services.push({ ...previousEntry, alreadyInstalled: true });
      continue;
    }

    const sourceMap = parseMap(readMarshalData(`Map${pad(candidate.sourceId)}.rxdata`));
    const sourceEvent = sourceMap.events.find((entry) => entry.id === candidate.sourceEventId)?.obj;
    if (!sourceEvent) throw new Error(`Map${candidate.sourceId}: no existe el evento fuente ${candidate.sourceEventId}`);
    const classification = inspectSourceEvent(sourceEvent);
    if (!classification || classification.excluded) throw new Error(`Map${candidate.sourceId}#${candidate.sourceEventId}: la clasificación cambió durante la planificación`);

    let targetX = candidate.x;
    let targetY = candidate.y;
    const occupants = currentOccupantsAt(eventPairs, targetX, targetY);
    const overlapsEntrySpawn = (incomingSpawns.get(Number(map.mapId)) || new Set()).has(keyOf(targetX, targetY));
    if (occupants.length || overlapsEntrySpawn) {
      const protectedOccupants = occupants.filter(({ event }) => isProtectedAuthoredEvent(text(iv(event, "name"))));
      const movableOccupants = occupants.filter(({ event }) => isAtlasGeneratedEvent(text(iv(event, "name"))));
      const canKeepServiceCell = !overlapsEntrySpawn && protectedOccupants.length === 0 && movableOccupants.length === occupants.length;
      if (canKeepServiceCell) {
        for (const occupant of movableOccupants) {
          const relocation = relocateExistingEvent(parsed, eventPairs, occupant, [targetX, targetY], reservedKeys);
          relocation.mapId = Number(map.mapId);
          collisions.push(relocation);
          const oldKey = keyOf(...relocation.from);
          const newKey = keyOf(...relocation.to);
          occupancy.get(oldKey)?.splice(occupancy.get(oldKey).findIndex((entry) => entry.id === occupant.id), 1);
          if (!occupancy.get(oldKey)?.length) occupancy.delete(oldKey);
          if (!occupancy.has(newKey)) occupancy.set(newKey, []);
          occupancy.get(newKey).push(occupant);
          changed = true;
        }
      } else {
        const hasUnknownOccupant = occupants.some(({ event }) =>
          !isAtlasGeneratedEvent(text(iv(event, "name"))) && !isProtectedAuthoredEvent(text(iv(event, "name"))));
        if (DOOR_TYPES.has(candidate.type) && (overlapsEntrySpawn || protectedOccupants.length || hasUnknownOccupant)) {
          const names = occupants.map(({ event }) => text(iv(event, "name"))).join(", ") || "una coordenada de entrada Atlas";
          throw new Error(`Map${map.mapId}: no se puede mover con seguridad ${candidate.name}; comparte (${targetX},${targetY}) con ${names}`);
        }
        const position = nearestFreeReachableCell(parsed, eventPairs, [targetX, targetY], reservedKeys);
        targetX = position.x;
        targetY = position.y;
        collisions.push({
          mapId: Number(map.mapId),
          serviceEventId: candidate.sourceEventId,
          serviceName: candidate.name,
          from: [candidate.x, candidate.y],
          to: [targetX, targetY],
          reason: overlapsEntrySpawn ? "la coordenada de entrada Atlas se reserva libre y se desplaza el servicio no direccional a una celda alcanzable" : protectedOccupants.length ? "se conserva el NPC/escena Atlas y se desplaza el servicio no direccional a una celda alcanzable" : "la celda original está ocupada por un evento que no pertenece al conjunto Atlas reubicable",
          placementNote: position.clearUpperLayers ? "suelo libre y alcanzable" : "alcanzable; la celda conserva un tile superior del mapa",
        });
      }
    }

    if (occupancy.has(keyOf(targetX, targetY)) && occupancy.get(keyOf(targetX, targetY)).length) {
      throw new Error(`Map${map.mapId}: la reubicación de ${candidate.name} aún colisiona en (${targetX},${targetY})`);
    }

    const generated = cloneServiceEvent(sourceEvent, nextId, [targetX, targetY], classification.transfers);
    const targetEvent = generated.event;
    const entry = {
      mapId: Number(map.mapId),
      sourceId: Number(map.sourceId),
      sourceEventId: Number(candidate.sourceEventId),
      targetEventId: nextId,
      name: candidate.name,
      type: candidate.type,
      sourcePosition: [candidate.x, candidate.y],
      targetPosition: [targetX, targetY],
      sourceHash: eventHash(sourceEvent),
      targetHash: eventHash(targetEvent),
      pages: (iv(sourceEvent, "pages") || []).length,
      transferRemaps: generated.transferRemaps,
      stateReferencesPreserved: true,
    };
    services.push(entry);
    eventPairs.push([nextId, targetEvent]);
    if (!occupancy.has(keyOf(targetX, targetY))) occupancy.set(keyOf(targetX, targetY), []);
    occupancy.get(keyOf(targetX, targetY)).push({ id: nextId, event: targetEvent });
    nextId++;
    changed = true;
  }

  const duplicateKeys = [...mapOccupancy(eventPairs)].filter(([, entries]) => entries.length > 1);
  const addedIds = new Set(services.map((service) => Number(service.targetEventId)));
  const newOverlaps = duplicateKeys.filter(([, entries]) => entries.some((entry) => addedIds.has(entry.id)));
  if (newOverlaps.length) {
    throw new Error(`Map${map.mapId}: quedan ${newOverlaps.length} superposiciones con los servicios restaurados`);
  }

  return { map, targetObject, parsed, eventPairs, services, collisions, changed };
}

function movementCellSignature(mapObject, x, y) {
  const parsed = parseMap(mapObject);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  return [2, 4, 6, 8].map((direction) => pass.passable(x, y, direction));
}

function sourceDestinationSignature(mapObject, x, y) {
  const parsed = parseMap(mapObject);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const entryDirections = [];
  for (const [direction, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
    const fromX = x - dx;
    const fromY = y - dy;
    entryDirections.push(pass.canMove(fromX, fromY, direction));
  }
  return { width: parsed.width, height: parsed.height, entryDirections };
}

function verifyTransferTargets(service, sourceMapCache, targetMapCache, errors) {
  for (const remap of service.transferRemaps || []) {
    const targetId = Number(remap.atlasMapId);
    const sourceId = Number(remap.sourceMapId);
    const map = mapByAtlas.get(targetId);
    if (!map || Number(map.sourceId) !== sourceId) {
      errors.push(`Map${service.mapId}#${service.targetEventId}: transferencia ${sourceId}→${targetId} no corresponde al Atlas`);
      continue;
    }
    if (!sourceMapCache.has(sourceId)) sourceMapCache.set(sourceId, readMap(sourceId));
    if (!targetMapCache.has(targetId)) targetMapCache.set(targetId, readMap(targetId));
    const sourceSig = sourceDestinationSignature(sourceMapCache.get(sourceId), remap.x, remap.y);
    const targetSig = sourceDestinationSignature(targetMapCache.get(targetId), remap.x, remap.y);
    if (remap.x >= sourceSig.width || remap.y >= sourceSig.height || remap.x < 0 || remap.y < 0) {
      errors.push(`Map${service.mapId}#${service.targetEventId}: destino original fuera de Map${sourceId} (${remap.x},${remap.y})`);
    } else if (sourceSig.width !== targetSig.width || sourceSig.height !== targetSig.height ||
               JSON.stringify(sourceSig.entryDirections) !== JSON.stringify(targetSig.entryDirections)) {
      errors.push(`Map${service.mapId}#${service.targetEventId}: Map${sourceId}→Atlas ${targetId} altera la entrada en (${remap.x},${remap.y})`);
    }
  }
}

function loadPreviousReport() {
  if (!fs.existsSync(REPORT_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")); }
  catch (error) { throw new Error(`No se pudo leer ${path.relative(ROOT, REPORT_PATH)}: ${error.message}`); }
}

function verify(report = loadPreviousReport()) {
  const errors = [];
  if (!report || report.status !== "complete") throw new Error("No existe un informe Atlas completo; ejecuta node tools/apply_atlas_service_repair.mjs primero");
  if (report.version !== 1) errors.push(`versión de informe no soportada: ${report.version}`);
  if (report.scope?.hierarchyMaps !== 1000) errors.push(`jerarquía Atlas: ${report.scope?.hierarchyMaps}/1000 mapas`);

  const inventory = candidateInventory();
  const expected = inventory.serviceEvents;
  const expectedNurseCount = expected.filter((entry) => ["nurse", "mirror nurse"].includes(normalizedName(entry.name))).length;
  const respawnNote = report.knownBehaviors?.nurseRespawnCenter;
  if (respawnNote?.copiedEvents !== expectedNurseCount || !String(respawnNote?.effect || "").includes("Kernel.pbSetPokemonCenter")) {
    errors.push("el informe no documenta el efecto de Nurse/Mirror Nurse sobre el centro de reaparición Atlas");
  }
  const recordedAll = report.services || [];
  // Servicios cuya fuente original fue rediseñada por un proyecto posterior
  // aprobado (p. ej. Isla Espejo 997-999 → Ciudad Teckel). El clon instalado se
  // sigue auditando por hash/ubicación/pasabilidad; la fuente ya no existe.
  const repurposed = recordedAll.filter((service) => service.sourceRepurposed);
  const recorded = recordedAll.filter((service) => !service.sourceRepurposed);
  const expectedKeys = new Set(expected.map((entry) => `${entry.mapId}:${entry.sourceEventId}`));
  const recordedKeys = new Set(recorded.map((entry) => `${entry.mapId}:${entry.sourceEventId}`));
  for (const key of expectedKeys) if (!recordedKeys.has(key)) errors.push(`falta servicio esperado ${key}`);
  for (const key of recordedKeys) if (!expectedKeys.has(key)) errors.push(`servicio no esperado en informe ${key}`);
  if (recorded.length !== expected.length) errors.push(`informe contiene ${recorded.length}/${expected.length} servicios`);
  const repurposedNurses = repurposed.filter((service) => ["nurse", "mirror nurse"].includes(normalizedName(service.name))).length;
  if ((respawnNote?.repurposedMirrorNurses || 0) !== repurposedNurses) {
    errors.push(`el informe documenta ${respawnNote?.repurposedMirrorNurses || 0} enfermeras repurposed y el manifiesto tiene ${repurposedNurses}`);
  }

  const sourceCache = new Map();
  const targetCache = new Map();
  const eventsByMap = new Map();
  for (const service of recordedAll) {
    const map = mapByAtlas.get(Number(service.mapId));
    if (!map) { errors.push(`mapa Atlas desconocido ${service.mapId}`); continue; }
    const targetMap = readMap(service.mapId);
    const eventPairs = mapEventPairs(targetMap);
    if (!eventsByMap.has(service.mapId)) eventsByMap.set(service.mapId, eventPairs);
    const pair = eventPairs.find(([id]) => Number(id) === Number(service.targetEventId));
    if (!pair) { errors.push(`Map${service.mapId}: falta evento ${service.name}#${service.targetEventId}`); continue; }
    const targetEvent = pair[1];
    if (eventHash(targetEvent) !== service.targetHash) errors.push(`Map${service.mapId}#${service.targetEventId}: hash de servicio alterado`);
    if (text(iv(targetEvent, "name")) !== service.name) errors.push(`Map${service.mapId}#${service.targetEventId}: nombre desincronizado`);
    if (Number(iv(targetEvent, "x")) !== Number(service.targetPosition?.[0]) || Number(iv(targetEvent, "y")) !== Number(service.targetPosition?.[1])) {
      errors.push(`Map${service.mapId}#${service.targetEventId}: ubicación distinta al manifiesto`);
    }
    if (service.sourceRepurposed) {
      const reparsed = parseMap(targetMap);
      const repurposedPass = passabilityOf(reparsed, reparsed.tilesetId);
      if (!openCell(repurposedPass, service.targetPosition[0], service.targetPosition[1]) || !hasClearUpperLayers(reparsed, service.targetPosition[0], service.targetPosition[1])) {
        errors.push(`Map${service.mapId}#${service.targetEventId}: servicio con fuente repurposed en celda bloqueada o tapada`);
      }
      continue;
    }
    const sourceId = Number(service.sourceId);
    if (!sourceCache.has(sourceId)) sourceCache.set(sourceId, readMap(sourceId));
    const sourceEvent = parseMap(sourceCache.get(sourceId)).events.find((entry) => entry.id === Number(service.sourceEventId))?.obj;
    if (!sourceEvent) { errors.push(`Map${sourceId}: falta evento fuente ${service.sourceEventId}`); continue; }
    if (eventHash(sourceEvent) !== service.sourceHash) errors.push(`Map${sourceId}#${service.sourceEventId}: fuente original cambió`);
    const classification = inspectSourceEvent(sourceEvent);
    if (!classification || classification.excluded) errors.push(`Map${sourceId}#${service.sourceEventId}: dejó de ser un servicio aprobado`);
    else {
      const expectedClone = cloneServiceEvent(sourceEvent, Number(service.targetEventId), service.targetPosition, classification.transfers).event;
      if (eventHash(expectedClone) !== service.targetHash) errors.push(`Map${service.mapId}#${service.targetEventId}: no conserva íntegramente el evento fuente`);
    }
    if (JSON.stringify(service.sourcePosition) === JSON.stringify(service.targetPosition)) {
      const sourcePassability = movementCellSignature(sourceCache.get(sourceId), service.sourcePosition[0], service.sourcePosition[1]);
      const targetPassability = movementCellSignature(targetMap, service.targetPosition[0], service.targetPosition[1]);
      if (JSON.stringify(sourcePassability) !== JSON.stringify(targetPassability)) errors.push(`Map${service.mapId}#${service.targetEventId}: la pasabilidad de la celda del servicio difiere de su fuente`);
    } else {
      const targetParsed = parseMap(targetMap);
      const targetPass = passabilityOf(targetParsed, targetParsed.tilesetId);
      if (!openCell(targetPass, service.targetPosition[0], service.targetPosition[1]) || !hasClearUpperLayers(targetParsed, service.targetPosition[0], service.targetPosition[1])) {
        errors.push(`Map${service.mapId}#${service.targetEventId}: servicio reubicado a una celda bloqueada o tapada`);
      }
    }
    verifyTransferTargets(service, sourceCache, targetCache, errors);
  }

  for (const [mapId, eventPairs] of eventsByMap) {
    const occupancy = mapOccupancy(eventPairs);
    const serviceIds = new Set(recordedAll.filter((service) => service.mapId === mapId).map((service) => Number(service.targetEventId)));
    for (const [position, occupants] of occupancy) {
      const copied = occupants.filter((occupant) => serviceIds.has(occupant.id));
      if (copied.length && occupants.length > 1) errors.push(`Map${mapId}: servicio restaurado superpuesto en ${position}`);
    }
    const ids = eventPairs.map(([id]) => Number(id));
    if (new Set(ids).size !== ids.length) errors.push(`Map${mapId}: hay IDs de evento duplicados`);
  }
  const incomingSpawns = collectIncomingSpawns();
  for (const service of recordedAll) {
    const entryCells = incomingSpawns.get(Number(service.mapId));
    if (entryCells?.has(keyOf(service.targetPosition[0], service.targetPosition[1]))) {
      errors.push(`Map${service.mapId}#${service.targetEventId}: el servicio ocupa una coordenada de entrada Atlas`);
    }
  }

  for (const relocation of report.relocations || []) {
    if (relocation.eventId === undefined) continue; // Las reubicaciones de servicios se validan contra targetPosition arriba.
    const mapObject = readMap(relocation.mapId);
    const occupant = mapEventPairs(mapObject).find(([id]) => Number(id) === Number(relocation.eventId))?.[1];
    if (!occupant || text(iv(occupant, "name")) !== relocation.name ||
        Number(iv(occupant, "x")) !== relocation.to[0] || Number(iv(occupant, "y")) !== relocation.to[1]) {
      errors.push(`Map${relocation.mapId}: la reubicación de ${relocation.name}#${relocation.eventId} no coincide`);
    }
  }

  if (report.safety?.systemFileWritten !== false) errors.push("el informe no certifica que System.rxdata quedó intacto");
  if (report.safety?.switchesAdded !== 0 || report.safety?.variablesAdded !== 0) errors.push("el informe registra cambios de flags/variables globales");
  if (report.safety?.protectedVariable264Written !== false) errors.push("el informe no certifica que v264 quedó intacta");
  if (report.safety?.sourceMapsWritten !== 0 || report.safety?.mapInfosWritten !== false || report.safety?.metadataWritten !== false || report.safety?.scriptsWritten !== false || report.safety?.packageCopiesWritten !== false) {
    errors.push("el informe registra escrituras fuera de los mapas Atlas autorizados");
  }
  if (errors.length) throw new Error(`Verificación Atlas servicios fallida (${errors.length}):\n- ${errors.slice(0, 100).join("\n- ")}`);
  console.log(`Verificación OK: ${recordedAll.length} eventos de servicio (${repurposed.length} con fuente repurposed) en ${new Set(recordedAll.map((entry) => entry.mapId)).size} mapas; ${report.relocations?.length || 0} colisiones resueltas; transferencias Atlas, scripts y flags fuente intactos.`);
}

function main() {
  if (DRIFT_ONLY) {
    const inventory = candidateInventory();
    const report = loadPreviousReport();
    const expected = new Set(inventory.serviceEvents.map((entry) => `${entry.mapId}:${entry.sourceEventId}`));
    const recorded = new Set((report?.services || []).map((entry) => `${entry.mapId}:${entry.sourceEventId}`));
    const soloInforme = [...recorded].filter((key) => !expected.has(key));
    const soloVivo = [...expected].filter((key) => !recorded.has(key));
    console.log(JSON.stringify({ esperado: expected.size, informe: recorded.size, soloInforme, soloVivo }, null, 2));
    const porFuente = {};
    for (const service of report?.services || []) {
      porFuente[service.sourceId] = (porFuente[service.sourceId] || 0) + 1;
    }
    console.log("servicios por fuente:", JSON.stringify(porFuente));
    const nurses = inventory.serviceEvents.filter((entry) => ["nurse", "mirror nurse"].includes(normalizedName(entry.name))).length;
    console.log("nurses vivas esperadas:", nurses);
    return;
  }
  if (process.argv.includes("--heal")) {
    // Reubica servicios con fuente repurposed cuya celda quedó bloqueada o
    // tapada por arte posterior (p. ej. el pulido DN), y sincroniza el informe.
    const report = loadPreviousReport();
    let moved = 0;
    for (const service of report.services || []) {
      if (!service.sourceRepurposed) continue;
      const mapObject = readMap(service.mapId);
      const parsed = parseMap(mapObject);
      const pairs = mapEventPairs(mapObject);
      const pair = pairs.find(([id]) => Number(id) === Number(service.targetEventId));
      if (!pair) continue;
      const [px, py] = service.targetPosition;
      const pass = passabilityOf(parsed, parsed.tilesetId);
      if (openCell(pass, px, py) && hasClearUpperLayers(parsed, px, py)) continue;
      const spot = nearestFreeReachableCell(parsed, pairs, [px, py], new Set());
      pair[1].setIvar("@x", spot.x);
      pair[1].setIvar("@y", spot.y);
      service.targetPosition = [spot.x, spot.y];
      service.targetHash = eventHash(pair[1]);
      writeMap(service.mapId, mapObject);
      moved += 1;
      console.log(`Map${service.mapId}#${service.targetEventId} (${service.name}) reubicada a (${spot.x},${spot.y})`);
    }
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`--heal: ${moved} servicios reubicados`);
    return;
  }
  if (VERIFY_ONLY) return verify();
  let oldReport = loadPreviousReport();
  if (oldReport?.status === "complete") {
    verify(oldReport);
    console.log("Atlas: la reparación ya está aplicada y verificada; no se duplicaron eventos.");
    return;
  }
  if (oldReport?.status === "rolled_back") {
    const restored = (oldReport.scope?.mapIds || []).every((mapId) => {
      const file = `Map${pad(mapId)}.rxdata`;
      const backup = path.join(BACKUP_DIR, file);
      return fs.existsSync(backup) && fs.existsSync(path.join(DATA, file)) &&
        hash(fs.readFileSync(backup)) === hash(fs.readFileSync(path.join(DATA, file)));
    });
    if (!restored) throw new Error(`La reversión anterior no quedó completa; revisa ${path.relative(ROOT, REPORT_PATH)} y el backup ${path.relative(ROOT, BACKUP_DIR)}`);
    fs.unlinkSync(REPORT_PATH);
    oldReport = null;
  }
  if (oldReport) {
    throw new Error(`Hay un informe de reparación ${oldReport.status}; revisa ${path.relative(ROOT, REPORT_PATH)} y restaura los respaldos antes de volver a aplicar`);
  }
  const inventory = candidateInventory();
  const incomingSpawns = collectIncomingSpawns();
  const byMap = new Map();
  for (const service of inventory.serviceEvents) {
    if (!byMap.has(service.mapId)) byMap.set(service.mapId, []);
    byMap.get(service.mapId).push(service);
  }

  const plans = [];
  for (const map of maps) {
    const candidates = byMap.get(Number(map.mapId));
    if (!candidates?.length) continue;
    const plan = plannedMap(map, candidates, oldReport, incomingSpawns);
    if (plan.changed) plans.push(plan);
  }

  const services = plans.flatMap((plan) => plan.services);
  const relocations = plans.flatMap((plan) => plan.collisions);
  const serviceMaps = new Set(inventory.serviceEvents.map((entry) => entry.mapId));
  const transferRemaps = services.reduce((sum, service) => sum + (service.transferRemaps?.length || 0), 0);
  const transferPreflightErrors = [];
  const sourceMapCache = new Map();
  const targetMapCache = new Map();
  for (const service of services) verifyTransferTargets(service, sourceMapCache, targetMapCache, transferPreflightErrors);
  if (transferPreflightErrors.length) {
    throw new Error(`Transferencias Atlas no seguras (${transferPreflightErrors.length}):\n- ${transferPreflightErrors.slice(0, 50).join("\n- ")}`);
  }
  const externalTransfers = inventory.excluded.filter((entry) => entry.reason === "destination map has no Atlas counterpart");
  const report = {
    version: 1,
    status: WRITE ? "complete" : "plan",
    generatedAt: new Date().toISOString(),
    scope: {
      hierarchyMaps: maps.length,
      mapsWithRestoredServices: serviceMaps.size,
      services: inventory.serviceEvents.length,
      includedTypes: [...new Set(inventory.serviceEvents.map((entry) => entry.type))].sort(),
      mapIds: [...serviceMaps].sort((a, b) => a - b),
      entryCellsReserved: [...incomingSpawns.entries()].map(([mapId, cells]) => ({ mapId, cells: [...cells] })),
      method: "Clonado controlado de servicios reutilizables; IDs únicos por mapa; transferencias internas hacia los mapas Atlas equivalentes.",
    },
    summary: {
      filesChanged: plans.length,
      servicesAddedOrConfirmed: services.length,
      atlasGeneratedEventsRelocated: relocations.filter((entry) => entry.eventId !== undefined).length,
      serviceEventsRelocated: relocations.filter((entry) => entry.serviceEventId !== undefined).length,
      transferRemaps,
      unresolvedExternalServiceEvents: externalTransfers.length,
      statefulCountersExcluded: inventory.statefulCounts.counters,
      statefulTradeEventsExcluded: inventory.statefulCounts.tradeEvents,
      specialStatefulEventsExcluded: inventory.statefulCounts.specialStateful,
    },
    services,
    relocations,
    knownBehaviors: {
      nurseRespawnCenter: {
        copiedEvents: inventory.serviceEvents.filter((entry) => ["nurse", "mirror nurse"].includes(normalizedName(entry.name))).length,
        effect: "Nurse/Mirror Nurse conservan Kernel.pbSetPokemonCenter; al usarlas en Atlas, el mapa Atlas actual queda como centro de reaparición, igual que un Centro Pokémon normal.",
        manualQa: "Comprobar en Game.exe que la reaparición ocurre en el centro Atlas esperado y que el evento de salida permite volver al circuito Atlas.",
      },
    },
    exclusions: inventory.excluded,
    audit: {
      nameHits: inventory.nameHits,
      statefulCandidates: inventory.statefulCounts,
      mapLevelVisualReview: "limited_to_repaired_service_cells_and_the_documented_overlaps; no se declara completada una auditoría visual de los 1.000 mapas",
    },
    safety: {
      systemFileWritten: false,
      switchesAdded: 0,
      variablesAdded: 0,
      protectedVariable264Written: false,
      sourceMapsWritten: 0,
      mapInfosWritten: false,
      metadataWritten: false,
      scriptsWritten: false,
      packageCopiesWritten: false,
    },
    backupDirectory: path.relative(ROOT, BACKUP_DIR),
  };

  if (PLAN_ONLY) {
    console.log(JSON.stringify({
      scope: report.scope,
      summary: report.summary,
      collisions: relocations,
      exclusions: inventory.excluded,
    }, null, 2));
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const plan of plans) {
    const file = `Map${pad(plan.map.mapId)}.rxdata`;
    const backup = path.join(BACKUP_DIR, file);
    if (!fs.existsSync(backup)) fs.copyFileSync(path.join(DATA, file), backup);
  }
  report.status = "applying";
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  try {
    for (const plan of plans) writeMap(plan.map.mapId, plan.targetObject);
    report.status = "complete";
    report.appliedAt = new Date().toISOString();
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    const rollbackErrors = [];
    for (const plan of plans) {
      const file = `Map${pad(plan.map.mapId)}.rxdata`;
      const backup = path.join(BACKUP_DIR, file);
      try {
        if (!fs.existsSync(backup)) throw new Error(`falta ${path.relative(ROOT, backup)}`);
        fs.copyFileSync(backup, path.join(DATA, file));
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    report.status = rollbackErrors.length ? "rollback_failed" : "rolled_back";
    report.failure = error.message;
    report.rollbackErrors = rollbackErrors;
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    throw error;
  }
  console.log(`Atlas: ${report.summary.servicesAddedOrConfirmed} servicios en ${report.scope.mapsWithRestoredServices} mapas; ${report.summary.atlasGeneratedEventsRelocated + report.summary.serviceEventsRelocated} colisiones resueltas; ${transferRemaps} transferencias reorientadas. Backup: ${path.relative(ROOT, BACKUP_DIR)}`);
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
