import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString, RSymbol } from "../../web/js/marshal.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const GAME = path.join(ROOT, "pokemon_fire_ash");
export const DATA = path.join(GAME, "Data");

export const symbolName = (value) => value instanceof RSymbol ? value.name : String(value ?? "");
export const stringValue = (value) => value instanceof RString ? value.text : String(value ?? "");

export function readMarshalData(fileName) {
  const target = path.join(DATA, fileName);
  if (!fs.existsSync(target)) throw new Error(`No existe ${path.relative(ROOT, target)}`);
  return marshalLoad(fs.readFileSync(target));
}

export function symbolicRecords(fileName) {
  return readMarshalData(fileName).pairs
    .filter(([key, value]) => key instanceof RSymbol && value?.getIvar)
    .map(([key, value]) => ({ id: key.name, value }));
}

export function loadFireAshRegistry() {
  const species = symbolicRecords("species.dat").map(({ id, value }) => ({
    id,
    idNumber: Number(value.getIvar("id_number") ?? -1),
    baseSpecies: symbolName(value.getIvar("species")) || id,
    form: Number(value.getIvar("form") ?? 0),
    name: stringValue(value.getIvar("real_name")) || id,
    types: [...new Set([
      symbolName(value.getIvar("type1")),
      symbolName(value.getIvar("type2")),
    ].filter(Boolean))].map((type) => type.toLowerCase()),
  }));
  const speciesById = new Map(species.map((entry) => [entry.id, entry]));
  const canonicalSpecies = species.filter((entry) => entry.form === 0 && entry.idNumber > 0);
  const speciesByPokeApiId = new Map(canonicalSpecies.map((entry) => [entry.idNumber, entry]));

  const ids = (fileName) => new Set(symbolicRecords(fileName).map(({ id }) => id));
  return {
    species,
    canonicalSpecies,
    speciesById,
    speciesByPokeApiId,
    moves: ids("moves.dat"),
    items: ids("items.dat"),
    trainerTypes: ids("trainer_types.dat"),
  };
}
