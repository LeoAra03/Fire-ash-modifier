#!/usr/bin/env node
/**
 * Instala/verifica las tablas de encuentros salvajes de content/wild_zones.json
 * en encounters.dat (aditivo: solo las claves "mapId_0" de las zonas nuevas).
 * Backups en pokemon_fire_ash/PokeModBackups/wild_zones_originals/.
 *
 * Uso:
 *   node tools/apply_wild_zones.mjs
 *   node tools/apply_wild_zones.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, marshalDump, RHash, RObject, RSymbol } from "../web/js/marshal.js";
import { parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
// Techo de nivel de la expansión: 175. Arceus (200) y Mad Pikachu (???) viven fuera
// de las tablas salvajes y se controlan desde sus propios eventos.
const MAX_LEVEL = 175;
const BACKUP = path.join(GAME, "PokeModBackups", "wild_zones_originals");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "wild_zones.json"), "utf8"));
const TERRAIN_OK = {
  // tipo de encuentro -> etiquetas de terreno que lo disparan (Cave: cualquier paso)
  Cave: null,
  Land: new Set([2, 10, 11, 14]),
  Water: new Set([5, 6, 7]),
};

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
const pad3 = (n) => String(n).padStart(3, "0");

function dataSymbols(file) {
  const ids = new Set();
  for (const [key] of read(file).pairs) if (key instanceof RSymbol) ids.add(key.name);
  return ids;
}
function tilesetsById() {
  const rows = read("Tilesets.rxdata");
  const out = new Map();
  for (let i = 1; i < rows.length; i++) if (rows[i]) { const t = parseTileset(rows[i]); out.set(t.id, t); }
  return out;
}
function mapTerrainTags(mapId, tilesets) {
  const map = parseMap(read(`Map${pad3(mapId)}.rxdata`));
  const ts = tilesets.get(map.tilesetId);
  const tags = new Set();
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) for (let z = 0; z < map.table.z; z++) {
    const tile = tableGet(map.table, x, y, z);
    if (tile > 0 && tile < ts.terrain.data.length) {
      const tag = ts.terrain.data[tile];
      if (tag > 0) tags.add(tag);
    }
  }
  return tags;
}
function encounterObject(zone) {
  const id = new RSymbol(`${zone.mapId}_0`);
  const stepChances = new RHash(Object.entries(zone.step_chances).map(([type, steps]) => [new RSymbol(type), steps]));
  const types = new RHash(Object.entries(zone.types).map(([type, slots]) => [
    new RSymbol(type),
    slots.map(([weight, species, min, max]) => [weight, new RSymbol(species), min, max]),
  ]));
  return new RObject("GameData::Encounter", [
    ["@id", id], ["@map", zone.mapId], ["@version", 0],
    ["@step_chances", stepChances], ["@types", types],
  ]);
}
function validate() {
  const species = dataSymbols("species.dat");
  const tilesets = tilesetsById();
  const errors = [];
  for (const zone of CATALOG.zones) {
    for (const [type, slots] of Object.entries(zone.types)) {
      if (!(type in TERRAIN_OK)) { errors.push(`${zone.mapId}: tipo de encuentro desconocido ${type}`); continue; }
      const needed = TERRAIN_OK[type];
      if (needed) {
        const tags = mapTerrainTags(zone.mapId, tilesets);
        if (![...needed].some((tag) => tags.has(tag))) errors.push(`${zone.mapId} (${zone.label}): sin tiles para el tipo ${type}`);
      }
      for (const [weight, sp, min, max] of slots) {
        if (!species.has(sp)) errors.push(`${zone.mapId}: especie inexistente ${sp}`);
        if (!(weight > 0)) errors.push(`${zone.mapId}: peso inválido en ${sp}`);
        if (!(min >= 1 && max >= min && max <= MAX_LEVEL)) errors.push(`${zone.mapId}: niveles inválidos en ${sp} (${min}-${max})`);
      }
    }
  }
  return errors;
}
function install() {
  fs.mkdirSync(BACKUP, { recursive: true });
  const src = path.join(DATA, "encounters.dat");
  const dst = path.join(BACKUP, "encounters.dat");
  if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"), "encounters.dat anterior a las zonas salvajes de la expansión. No contiene partidas.\n");
  const encounters = read("encounters.dat");
  const ours = new Set(CATALOG.zones.map((zone) => `${zone.mapId}_0`));
  encounters.pairs = encounters.pairs.filter(([key]) => !ours.has(key.name ?? String(key)));
  for (const zone of CATALOG.zones) {
    const obj = encounterObject(zone);
    encounters.pairs.push([new RSymbol(`${zone.mapId}_0`), obj]);
  }
  write("encounters.dat", encounters);
}
function verify() {
  const errors = validate();
  const encounters = read("encounters.dat");
  for (const zone of CATALOG.zones) {
    const entry = encounters.pairs.find(([key]) => (key.name ?? String(key)) === `${zone.mapId}_0`)?.[1];
    if (!entry) { errors.push(`${zone.mapId}: falta la entrada en encounters.dat`); continue; }
    const types = entry.getIvar("@types");
    const stepChances = entry.getIvar("@step_chances");
    for (const [type, slots] of Object.entries(zone.types)) {
      const stored = types.pairs.find(([key]) => key.name === type)?.[1];
      if (!stored || stored.length !== slots.length) errors.push(`${zone.mapId}: tabla ${type} incorrecta`);
      const steps = stepChances.pairs.find(([key]) => key.name === type)?.[1];
      if (steps !== zone.step_chances[type]) errors.push(`${zone.mapId}: step_chance ${type} incorrecto`);
    }
  }
  if (errors.length) throw new Error(`Zonas salvajes inválidas (${errors.length}):\n- ${errors.join("\n- ")}`);
  const slots = CATALOG.zones.reduce((sum, zone) => sum + Object.values(zone.types).reduce((s, t) => s + t.length, 0), 0);
  console.log(`Verificación OK: ${CATALOG.zones.length} zonas salvajes con ${slots} slots en encounters.dat (especies existentes, niveles ≤ ${MAX_LEVEL}, terrenos compatibles).`);
}

if (!VERIFY_ONLY) { install(); console.log("Zonas salvajes instaladas en encounters.dat. Backup en " + path.relative(ROOT, BACKUP)); }
verify();
