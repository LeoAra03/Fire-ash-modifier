#!/usr/bin/env node
/**
 * Reconciliación de accesos de la instalación nativa de campañas ROM.
 *
 * La conversión nativa conserva cada celda del ROM, pero los instaladores de
 * campaña pueden haber dejado una celda transitable donde el manifiesto espera
 * su gemelo sólido, o un NPC/warp sobre una celda sólida. Este paso corrige
 * únicamente esa deriva: restaura la celda esperada fuera de eventos y abre el
 * gemelo transitable del mismo metatile bajo los eventos.
 *
 * Uso:
 *   node tools/qa/repair_rom_nativo_access.mjs --apply
 *   node tools/qa/repair_rom_nativo_access.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalDump, marshalLoad, RString } from "../../web/js/marshal.js";
import { parseMap, tableGet, tableSet, tableToUserDef, tableFromUserDef } from "../../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const PLAN_PATH = path.join(ROOT, "content", "rom_nativo.json");
const BACKUP = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups", "rom_nativo_access");
const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");

if (!APPLY && !VERIFY) {
  console.error("Uso: repair_rom_nativo_access.mjs --apply|--verify");
  process.exit(2);
}

const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const text = (value) => value instanceof RString
  ? value.text
  : value?.bytes ? Buffer.from(value.bytes).toString("utf8") : String(value ?? "");
const cellsFromBase64 = (value) => {
  const bytes = Buffer.from(value, "base64");
  const cells = new Uint16Array(bytes.length / 2);
  for (let i = 0; i < cells.length; i += 1) cells[i] = bytes.readUInt16LE(i * 2);
  return cells;
};

function eventCells(map) {
  const cells = new Map();
  for (const [, event] of map.getIvar("@events").pairs) {
    const x = Number(event.getIvar("@x"));
    const y = Number(event.getIvar("@y"));
    cells.set(`${x},${y}`, text(event.getIvar("@name")));
  }
  return cells;
}

function mapPlan() {
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
  const result = [];
  for (const campaign of Object.values(plan.campaigns)) {
    const tilesets = new Map(campaign.tilesets.map((tileset) => [tileset.nombre, tileset]));
    for (const [id, blueprint] of Object.entries(campaign.maps)) {
      result.push({ id: Number(id), blueprint, tileset: tilesets.get(blueprint.tileset) });
    }
  }
  return result;
}

function auditOne(entry, apply) {
  const filename = mapFile(entry.id);
  const file = path.join(DATA, filename);
  if (!fs.existsSync(file)) return { id: entry.id, missing: true, changed: false, issues: ["mapa ausente"] };

  const map = marshalLoad(fs.readFileSync(file));
  const parsed = parseMap(map);
  const expected = cellsFromBase64(entry.blueprint.celdas);
  const actual = parsed.table;
  const variants = new Map();
  for (const [metatile, pair] of Object.entries(entry.tileset.porMetatile)) {
    const [free, solid] = pair;
    variants.set(free, { metatile: Number(metatile), free: true, solid: false });
    if (solid) variants.set(solid, { metatile: Number(metatile), free: false, solid: true });
  }
  const eventAt = eventCells(map);
  const issues = [];
  const repairs = [];
  const opened = [];

  for (let y = 0; y < entry.blueprint.height; y += 1) {
    for (let x = 0; x < entry.blueprint.width; x += 1) {
      const index = y * entry.blueprint.width + x;
      const expectedTile = expected[index];
      const actualTile = tableGet(actual, x, y, 0);
      const key = `${x},${y}`;
      const eventName = eventAt.get(key);
      const expectedVariant = variants.get(expectedTile);
      const actualVariant = variants.get(actualTile);

      if (actualTile !== expectedTile) {
        if (eventName && expectedVariant?.solid && actualTile === entry.tileset.porMetatile[String(expectedVariant.metatile)]?.[0]) {
          // Ya es la apertura documentada por el instalador nativo; no es deriva.
          continue;
        }
        repairs.push({ x, y, from: actualTile, to: expectedTile, reason: eventName ? "evento" : "deriva" });
      }

      if (eventName && (entry.tileset.pasajes[actualTile] ?? 0) !== 0) {
        const pair = entry.tileset.porMetatile[String(expectedVariant?.metatile ?? actualVariant?.metatile)];
        const free = pair?.[0];
        if (free != null && actualTile !== free) {
          repairs.push({ x, y, from: actualTile, to: free, reason: "evento-sobre-solida" });
          opened.push({ x, y, name: eventName, expected: expectedTile, actual: free });
        } else if (free == null) {
          issues.push(`${eventName} @${x},${y}: no existe gemelo transitable`);
        }
      }
    }
  }

  if (apply && repairs.length) {
    fs.mkdirSync(BACKUP, { recursive: true });
    const backup = path.join(BACKUP, filename);
    if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
    const table = tableFromUserDef(map.getIvar("@data"));
    for (const repair of repairs) tableSet(table, repair.x, repair.y, 0, repair.to);
    map.setIvar("@data", tableToUserDef(table));
    fs.writeFileSync(file, Buffer.from(marshalDump(map)));
  }

  return {
    id: entry.id,
    missing: false,
    changed: repairs.length > 0,
    repairs,
    opened,
    issues,
  };
}

const results = mapPlan().map((entry) => auditOne(entry, APPLY));
const missing = results.filter((result) => result.missing);
const issues = results.flatMap((result) => result.issues ?? []);
const changed = results.filter((result) => result.changed);
const repairedCells = results.reduce((sum, result) => sum + (result.repairs?.length ?? 0), 0);
const openedCells = results.reduce((sum, result) => sum + (result.opened?.length ?? 0), 0);

for (const result of changed) {
  console.log(`${APPLY ? "REPARADO" : "DERIVA"} Map${result.id}: ${result.repairs.length} celda(s)`);
  for (const repair of result.repairs) console.log(`  · (${repair.x},${repair.y}) ${repair.from} → ${repair.to} [${repair.reason}]`);
}
for (const result of results.filter((item) => item.opened?.length)) {
  console.log(`ACCESO Map${result.id}: ${result.opened.length} evento(s) con gemelo transitable`);
}
for (const message of [...missing.map((item) => `Map${item.id}: ${item.issues[0]}`), ...issues]) {
  console.error(`FALLO: ${message}`);
}

console.log(`${APPLY ? "reconciliación" : "auditoría"} de accesos nativos: ${results.length} mapas · ${changed.length} con deriva · ${repairedCells} celdas ${APPLY ? "reparadas" : "a reparar"} · ${openedCells} accesos de evento`);
if (missing.length || issues.length || (!APPLY && repairedCells > 0)) process.exit(1);
console.log("OK: cada celda conserva el valor nativo o una apertura de evento documentada.");
