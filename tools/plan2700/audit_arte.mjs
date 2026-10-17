#!/usr/bin/env node
/**
 * Inventario de arte y auditoría de referencias de la tanda 20 (1900–1999).
 *
 * No genera sprites sintéticos ni elimina duplicados automáticamente: identifica
 * lo que existe, lo que se referencia, lo que falta y lo que requiere dirección
 * artística. La salida principal es content/plan2700_arte.json.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { DATA, GAME, ROOT, eventsOf, iv, pagesOf, readData, txt } from "../lib/dlc_helpers.mjs";

const JSON_MODE = process.argv.includes("--json");
const WRITE = process.argv.includes("--write") || !JSON_MODE;
const OUTPUT = path.join(ROOT, "content", "plan2700_arte.json");
const MISSING_OUTPUT = path.join(ROOT, "content", "plan2700_arte_faltante.json");
const ART_ROOT = path.join(GAME, "Graphics");
const relative = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const filesUnder = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  visit(dir);
  return out.sort();
};
const pngSize = (file) => {
  try {
    const buf = fs.readFileSync(file);
    if (buf.readUInt32BE(0) !== 0x89504e47) return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch { return null; }
};
const category = (rel) => {
  const rest = rel.replace(/^pokemon_fire_ash\/Graphics\//, "");
  return rest.split("/")[0] || "Graphics";
};
const phaseFor = (rel, changed) => {
  if (!changed.has(rel)) return "pre-plan / existente";
  if (/DN_|dimensional|KINGGUS/i.test(rel)) return "FASE 008/018 — Dimensional Nightmare";
  if (/diploma|liga/i.test(rel)) return "FASE 017 — Liga/Diplomas";
  if (/ARCEUS|Genesis|ORIGEN/i.test(rel)) return "FASE 017 — Ruta de Dios";
  if (/ATLAS|atlas/i.test(rel)) return "FASE 018 — Atlas Mil";
  if (/ROMN|Glazed|Light|Platinum|Liquid/i.test(rel)) return "FASE 012/013 — campañas";
  if (/ELECTRAMEW|Pokegod/i.test(rel)) return "FASE 020 — coherencia de arte";
  if (/outfit|atav|rocket|horizonte/i.test(rel)) return "plan DLC — fase previa";
  return "plan2700 — fase por asignar";
};
const changedGraphics = new Set();
try {
  const commands = [
    ["diff", "--name-only", "a33506dc..HEAD", "--", "pokemon_fire_ash/Graphics"],
    ["diff", "--name-only", "--", "pokemon_fire_ash/Graphics"],
    ["ls-files", "--others", "--exclude-standard", "--", "pokemon_fire_ash/Graphics"],
  ];
  for (const args of commands) {
    const text = execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
    for (const line of text.split(/\r?\n/).filter(Boolean)) changedGraphics.add(line);
  }
} catch { /* checkout sin git no invalida el inventario */ }

function mapNames() {
  const infos = readData("MapInfos.rxdata");
  return new Map(infos.pairs.map(([id, info]) => [Number(id), txt(iv(info, "@name"))]));
}
function referencedCharacters() {
  const references = new Map();
  const density = [];
  const mapIds = mapNames();
  for (const [mapId, mapName] of mapIds) {
    const file = path.join(DATA, `Map${String(mapId).padStart(3, "0")}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const entries = eventsOf(mapId);
    let characterEvents = 0;
    for (const entry of entries) {
      const pages = pagesOf(entry);
      for (const page of pages) {
        const graphic = iv(page.obj, "@graphic");
        const name = txt(iv(graphic, "@character_name"));
        if (!name) continue;
        characterEvents += 1;
        const row = references.get(name) ?? { name, uses: 0, maps: new Set(), events: [] };
        row.uses += 1;
        row.maps.add(mapId);
        if (row.events.length < 8) row.events.push({ mapId, event: entry.name });
        references.set(name, row);
      }
    }
    density.push({ mapId, name: mapName, events: entries.length, characterEvents, profile: profileOf(mapId, mapName) });
  }
  return { references, density };
}
function profileOf(mapId, name) {
  if (mapId >= 1021 && mapId <= 2020) return "atlas";
  if (mapId >= 2040 && mapId <= 2194) return "nightmare/multiversal";
  if (mapId >= 3000 && mapId <= 3110) return "glazed";
  if (mapId >= 3120 && mapId <= 3138) return "light_platinum";
  if (mapId >= 3200 && mapId <= 3631) return "liquid_crystal";
  if (mapId >= 3700 && mapId <= 3944) return "tfoh";
  if (mapId >= 4000 && mapId <= 4419) return "unbound";
  if (/gimnasio|gym/i.test(name)) return "gimnasio";
  if (/ciudad|pueblo|town|city/i.test(name)) return "ciudad";
  if (/ruta|route|sendero|camino/i.test(name)) return "ruta";
  if (/cueva|cave|torre|mina|mazmorra/i.test(name)) return "mazmorra";
  return "otro";
}
function resolveCharacter(name, files) {
  const candidates = [name, `${name}.png`];
  for (const candidate of candidates) {
    const exact = files.find((file) => path.basename(file) === candidate || path.basename(file) === `${candidate}.png`);
    if (exact) return exact;
  }
  const lower = new Map(files.map((file) => [path.basename(file).toLowerCase(), file]));
  return lower.get(`${name.toLowerCase()}.png`) ?? lower.get(name.toLowerCase()) ?? null;
}
function newAssetChanged(rel) { return changedGraphics.has(rel); }
function inventory() {
  const files = filesUnder(ART_ROOT).filter((file) => path.extname(file).toLowerCase() === ".png");
  const characterFiles = filesUnder(path.join(ART_ROOT, "Characters")).filter((file) => path.extname(file).toLowerCase() === ".png");
  const { references, density } = referencedCharacters();
  const missing = [];
  const virtualCharacters = new Set(["invisible", "none", "null"]);
  const referenceRows = [];
  for (const row of [...references.values()].sort((a, b) => b.uses - a.uses)) {
    const file = resolveCharacter(row.name, characterFiles);
    const rel = file ? relative(file) : null;
    if (!file && !virtualCharacters.has(row.name.toLowerCase())) missing.push({ kind: "character", name: row.name, uses: row.uses, maps: [...row.maps].sort((a, b) => a - b), examples: row.events });
    referenceRows.push({ name: row.name, uses: row.uses, maps: row.maps.size, file: rel, generic: /^trchar\d+$/i.test(row.name) || row.uses >= 80, examples: row.events });
  }
  const byHash = new Map();
  const assetRows = files.map((file) => {
    const rel = relative(file);
    const hash = sha256(file);
    const row = { path: rel, category: category(rel), phase: phaseFor(rel, changedGraphics), bytes: fs.statSync(file).size, sha256: hash, size: pngSize(file) };
    const group = byHash.get(hash) ?? [];
    group.push(rel); byHash.set(hash, group);
    return row;
  });
  const duplicates = [...byHash.entries()].filter(([, group]) => group.length > 1).map(([hash, group]) => ({ sha256: hash, files: group }));
  const changedRows = assetRows.filter((row) => newAssetChanged(row.path));
  const changedReferenced = new Set(referenceRows.filter((row) => row.file && newAssetChanged(row.file)).map((row) => row.file));
  const unreferencedNew = changedRows.filter((row) => row.category === "Characters" && !changedReferenced.has(row.path)).map((row) => row.path);
  const densitySummary = {};
  for (const row of density) {
    const bucket = densitySummary[row.profile] ?? { maps: 0, events: 0, maxEvents: 0, minEvents: Infinity };
    bucket.maps += 1; bucket.events += row.events; bucket.maxEvents = Math.max(bucket.maxEvents, row.events); bucket.minEvents = Math.min(bucket.minEvents, row.events); densitySummary[row.profile] = bucket;
  }
  return {
    schema: "plan2700_arte/1.0",
    generatedAt: new Date().toISOString(),
    scope: "pokemon_fire_ash/Graphics PNG + referencias de character_name en mapas compilados",
    totalFiles: assetRows.length,
    totalBytes: assetRows.reduce((sum, row) => sum + row.bytes, 0),
    changedByPlanSince: "a33506dc",
    changedFiles: changedRows.length,
    duplicatesExact: duplicates,
    missingReferences: missing,
    genericCandidates: referenceRows.filter((row) => row.generic),
    unreferencedNewCharacterFiles: unreferencedNew,
    densitySummary,
    density,
    characterReferences: referenceRows,
    files: assetRows,
    policy: {
      duplicates: "no se eliminan automáticamente; primero se comprueba que no sean variantes intencionales",
      externalArt: "las campañas usan recursos existentes de Fire Ash; los ROMs invitados solo son referencia estructural",
      manual: ["coherencia visual de silueta", "cuatro direcciones y pasos", "escala de battle sprite", "legibilidad en Game.exe/Kirin"],
    },
  };
}
const result = inventory();
const missing = {
  schema: "plan2700_arte_faltante/1.0",
  generatedAt: result.generatedAt,
  missingReferences: result.missingReferences,
  genericCandidates: result.genericCandidates,
  unreferencedNewCharacterFiles: result.unreferencedNewCharacterFiles,
  nextBatches: [
    "sustituir primero candidatos genéricos de Liga/Atlas/campañas con sprites propios aprobados",
    "validar cada sprite con cuatro direcciones, pasos y escala antes de cambiar referencias",
    "no eliminar duplicados exactos hasta revisar si son alias de runtime",
  ],
};
if (WRITE) {
  fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(MISSING_OUTPUT, `${JSON.stringify(missing, null, 2)}\n`);
}
if (JSON_MODE) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Arte: ${result.totalFiles} PNG · ${(result.totalBytes / 1024 / 1024).toFixed(1)} MiB · ${result.changedFiles} modificados desde a33506dc`);
  console.log(`  referencias de character: ${result.characterReferences.length} · faltantes ${result.missingReferences.length} · candidatos genéricos ${result.genericCandidates.length}`);
  console.log(`  duplicados exactos: ${result.duplicatesExact.length} grupos · nuevos sin referencia ${result.unreferencedNewCharacterFiles.length}`);
  console.log(`  salida: ${relative(OUTPUT)}`);
}
