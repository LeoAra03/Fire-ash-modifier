#!/usr/bin/env node
/**
 * Auditoría estática de rendimiento, peso y compatibilidad (FASE 024).
 * No afirma FPS de Android ni tiempos humanos: mide lo que puede reproducirse
 * desde el checkout y deja el resto como pendiente manual.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, mapListFromInfos, parseEvent, parseMap } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const OUT = path.join(ROOT, "content", "lote5_fase024_performance.json");
const VERIFY = process.argv.includes("--verify");
const textOf = (value) => value?.text ?? "";
const audioName = (value) => value?.getIvar?.("name")?.text ?? value?.text ?? "";
const audioKind = { 241: "BGM", 245: "BGS", 249: "ME", 250: "SE" };
const audioRefs = new Map();
const audioFiles = new Map();
function walk(dir, callback, relative = "") {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) walk(abs, callback, rel);
    else callback(abs, rel);
  }
}
function inventory(dir) {
  const rows = [];
  walk(dir, (abs, rel) => {
    const st = fs.statSync(abs);
    rows.push({ path: rel.replaceAll(path.sep, "/"), bytes: st.size });
  });
  return rows.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
}
function audioIndex() {
  for (const kind of Object.values(audioKind)) {
    const folder = path.join(GAME, "Audio", kind);
    walk(folder, (abs, rel) => {
      const base = path.basename(rel, path.extname(rel)).toLowerCase();
      audioFiles.set(`${kind}:${base}`, { path: `Audio/${kind}/${rel.replaceAll(path.sep, "/")}`, bytes: fs.statSync(abs).size });
    });
  }
}
function findAudio(kind, name) {
  const clean = String(name).replace(/^\//, "").replace(/\.[^.]+$/, "").toLowerCase();
  return audioFiles.get(`${kind}:${clean}`) ?? null;
}
function zipListing(file) {
  try {
    return execFileSync("unzip", ["-Z1", file], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).split(/\r?\n/).filter(Boolean).sort();
  } catch {
    return null;
  }
}
function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).split("\0").filter(Boolean);
}
function build() {
  audioIndex();
  const infos = mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  const maps = [];
  const topMaps = [];
  const missingAudio = [];
  let totalEvents = 0;
  let totalPages = 0;
  let parallelPages = 0;
  let autorunPages = 0;
  for (const info of infos) {
    const file = path.join(DATA, `Map${String(info.id).padStart(3, "0")}.rxdata`);
    if (!fs.existsSync(file)) continue;
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    let eventCount = 0;
    let pageCount = 0;
    let mapParallel = 0;
    let mapAutorun = 0;
    for (const entry of parsed.events) {
      const event = parseEvent(entry.obj);
      eventCount += 1;
      for (const page of event.pages) {
        pageCount += 1;
        if (page.trigger === 4) { parallelPages += 1; mapParallel += 1; }
        if (page.trigger === 3) { autorunPages += 1; mapAutorun += 1; }
        for (const command of page.list) {
          const parsedCommand = cmdOf(command);
          const kind = audioKind[parsedCommand.code];
          if (!kind) continue;
          const name = audioName(parsedCommand.params[0]);
          if (!name) continue;
          const key = `${kind}:${name}`;
          const ref = audioRefs.get(key) ?? { kind, name, references: 0, maps: new Set() };
          ref.references += 1;
          ref.maps.add(info.id);
          audioRefs.set(key, ref);
        }
      }
    }
    totalEvents += eventCount;
    totalPages += pageCount;
    maps.push({ id: info.id, name: info.name, events: eventCount, pages: pageCount, parallelPages: mapParallel, autorunPages: mapAutorun });
  }
  const top = [...maps].sort((a, b) => b.events - a.events || b.parallelPages - a.parallelPages || a.id - b.id).slice(0, 100);
  const refs = [...audioRefs.values()].map((ref) => ({ ...ref, maps: [...ref.maps].sort((a, b) => a - b), file: findAudio(ref.kind, ref.name)?.path ?? null })).sort((a, b) => b.references - a.references || a.name.localeCompare(b.name));
  for (const ref of refs) if (!ref.file) missingAudio.push(ref);
  const allAudio = inventory(path.join(GAME, "Audio"));
  const zeroAudio = allAudio.filter((file) => file.bytes === 0);
  const graphics = inventory(path.join(GAME, "Graphics"));
  const data = inventory(DATA);
  const tracked = trackedFiles();
  const largeTracked = tracked.map((rel) => {
    const abs = path.join(ROOT, rel);
    return fs.existsSync(abs) && fs.statSync(abs).isFile() ? { path: rel, bytes: fs.statSync(abs).size } : null;
  }).filter((row) => row && row.bytes > 20 * 1024 * 1024).sort((a, b) => b.bytes - a.bytes);
  const zips = tracked.filter((rel) => rel.toLowerCase().endsWith(".zip")).map((rel) => {
    const entries = zipListing(path.join(ROOT, rel));
    return { path: rel, bytes: fs.existsSync(path.join(ROOT, rel)) ? fs.statSync(path.join(ROOT, rel)).size : null, readable: Boolean(entries), entries: entries?.length ?? null, forbidden: (entries ?? []).filter((entry) => /(?:PokeModBackups|backup|save|Game\.rvdata|\.bak$|\.tmp$|content\/|tools\/)/i.test(entry)).slice(0, 100) };
  });
  const versionedSaves = tracked.filter((rel) => /(?:^|\/)(?:Save\d*|Game\.rvdata|.*\.sav$)/i.test(rel));
  const manual = [
    "FPS y memoria real en Android/Kirin en mapas cargados",
    "tiempos de arranque/carga por región en hardware objetivo",
    "bucle audible y mezcla de volumen de pistas nuevas",
    "partida de cuatro horas, guardados corruptos y tarjeta llena",
    "editor SAF, exportación/reimportación y permisos de escritura",
  ];
  return {
    schema: "lote5_fase024_performance/1.0",
    tasks: "2300–2399",
    source: "checkout local y pokemon_fire_ash/Data/Map*.rxdata",
    static: {
      maps: maps.length,
      events: totalEvents,
      pages: totalPages,
      parallelPages,
      autorunPages,
      audioReferenced: refs.length,
      audioMissing: missingAudio.length,
      audioZeroBytes: zeroAudio.length,
      dataBytes: data.reduce((sum, row) => sum + row.bytes, 0),
      graphicsBytes: graphics.reduce((sum, row) => sum + row.bytes, 0),
      audioBytes: allAudio.reduce((sum, row) => sum + row.bytes, 0),
    },
    budgets: {
      mapEventCeilingCandidate: 100,
      mapsOverCandidate: maps.filter((map) => map.events > 100).map((map) => ({ id: map.id, name: map.name, events: map.events })).slice(0, 100),
      parallelPagesOverCandidate: maps.filter((map) => map.parallelPages > 8).map((map) => ({ id: map.id, name: map.name, parallelPages: map.parallelPages })).slice(0, 100),
      note: "Los techos candidatos son señales para revisión; el perfil narrativo puede justificar una densidad alta.",
    },
    audio: { references: refs.slice(0, 1000), missing: missingAudio.slice(0, 200), zeroBytes: zeroAudio, files: allAudio.length },
    largestMaps: top,
    largestTracked: largeTracked,
    packages: zips,
    versionedSaves,
    manual,
    verdict: "static_pass_manual_runtime_pending",
  };
}
const report = build();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else fs.writeFileSync(OUT, serialized);
console.log(`FASE 024 rendimiento: ${report.static.maps} mapas · ${report.static.events} eventos · ${report.static.audioReferenced} referencias de audio · faltantes ${report.static.audioMissing} · estado ${report.verdict}`);
