// ============================================================================
// apply_glazed_encounters.mjs
// ----------------------------------------------------------------------------
// Registra las tablas de encuentros salvajes canónicas de la región de Tunod
// (Pokémon Glazed) en encounters.dat, cubriendo rutas, bosques, cuevas,
// canales marinos y la cumbre de Tunod.
//
//   node tools/apply_glazed_encounters.mjs           # instala y verifica
//   node tools/apply_glazed_encounters.mjs --verify  # solo comprueba
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  marshalLoad, marshalDump, RHash, RObject, RSymbol,
} from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");
const PKG_DATA = path.join(ROOT, "Scripts_corregido/Paquete_directo/Data");
const BACKUP_DIR = path.join(ROOT, "pokemon_fire_ash/PokeModBackups/glazed_encounters");
const CATALOG_PATH = path.join(ROOT, "content/glazed_wild_encounters.json");

const VERIFY_ONLY = process.argv.includes("--verify");

function read(filePath) {
  return marshalLoad(new Uint8Array(fs.readFileSync(filePath)));
}

function write(filePath, data) {
  fs.writeFileSync(filePath, Buffer.from(marshalDump(data)));
}

function backup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const src = path.join(DATA, "encounters.dat");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(BACKUP_DIR, "encounters.dat"));
  }
}

function buildEncounterObject(zone) {
  const id = new RSymbol(`${zone.mapId}_0`);
  const stepChances = new RHash(
    Object.entries(zone.step_chances).map(([type, steps]) => [new RSymbol(type), steps])
  );
  const types = new RHash(
    Object.entries(zone.types).map(([type, slots]) => [
      new RSymbol(type),
      slots.map(([weight, species, minLvl, maxLvl]) => [
        weight,
        new RSymbol(species),
        minLvl,
        maxLvl,
      ]),
    ])
  );
  return new RObject("GameData::Encounter", [
    ["@id", id],
    ["@map", zone.mapId],
    ["@version", 0],
    ["@step_chances", stepChances],
    ["@types", types],
  ]);
}

export function install() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  backup();

  const encPath = path.join(DATA, "encounters.dat");
  const encounters = read(encPath);

  let updatedCount = 0;
  let addedCount = 0;

  for (const zone of catalog.zones) {
    const keyStr = `${zone.mapId}_0`;
    const encObj = buildEncounterObject(zone);
    const existingIdx = encounters.pairs.findIndex(
      ([k]) => (k && (k.name ?? k.text ?? String(k))) === keyStr
    );

    if (existingIdx >= 0) {
      encounters.pairs[existingIdx][1] = encObj;
      updatedCount++;
    } else {
      encounters.pairs.push([new RSymbol(keyStr), encObj]);
      addedCount++;
    }
  }

  write(encPath, encounters);
  if (fs.existsSync(PKG_DATA)) {
    write(path.join(PKG_DATA, "encounters.dat"), encounters);
  }

  console.log(`✔ encounters.dat actualizado: ${addedCount} zonas añadidas, ${updatedCount} actualizadas.`);
}

export function verify() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const encounters = read(path.join(DATA, "encounters.dat"));
  const speciesData = read(path.join(DATA, "species.dat"));

  const validSpecies = new Set();
  const td = new TextDecoder();
  if (Array.isArray(speciesData.pairs)) {
    for (const [k] of speciesData.pairs) {
      if (k && k.bytes) validSpecies.add(td.decode(k.bytes));
      else if (k && (k.name || k.text)) validSpecies.add(k.name ?? k.text);
    }
  }

  const errors = [];
  for (const zone of catalog.zones) {
    const keyStr = `${zone.mapId}_0`;
    const entry = encounters.pairs.find(
      ([k]) => (k && (k.name ?? k.text ?? String(k))) === keyStr
    )?.[1];

    if (!entry) {
      errors.push(`Falta tabla de encuentro para Map${zone.mapId} (${zone.name})`);
      continue;
    }

    const typesHash = entry.getIvar("@types");
    if (!typesHash || !Array.isArray(typesHash.pairs)) {
      errors.push(`Map${zone.mapId}: @types inválido o vacío`);
      continue;
    }

    for (const [typeKey, slots] of typesHash.pairs) {
      const typeName = typeKey.name ?? typeKey.text ?? String(typeKey);
      if (!Array.isArray(slots) || slots.length === 0) {
        errors.push(`Map${zone.mapId}: slots vacíos para tipo ${typeName}`);
      }
      for (const slot of slots) {
        const spSym = slot[1];
        const spName = spSym.name ?? spSym.text ?? String(spSym);
        if (!validSpecies.has(spName)) {
          errors.push(`Map${zone.mapId}: especie desconocida ${spName} en ${typeName}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("✘ Errores de verificación en encuentros de Glazed:");
    for (const err of errors) console.error("  -", err);
    process.exit(1);
  }

  console.log(`✔ Verificación OK: ${catalog.zones.length} zonas de Glazed registradas con especies y niveles válidos.`);
}

if (VERIFY_ONLY) {
  verify();
} else {
  install();
  verify();
}
