#!/usr/bin/env node
/**
 * Checklist universal de mapa (FASE 019, tareas 1800–1899).
 *
 * Lee todos los mapas que existen, no los reescribe. Los puntos que necesitan
 * percepción humana se devuelven como `manual`, nunca como un falso PASS.
 *
 * Uso:
 *   node tools/plan2700/checklist_mapa.mjs --write
 *   node tools/plan2700/checklist_mapa.mjs --range=1021-2020 --write
 *   node tools/plan2700/checklist_mapa.mjs --json
 */
import fs from "node:fs";
import path from "node:path";
import { DATA, ROOT, grid, iv, mapFile, readData, readMapRaw, txt, walkableAt, eventsOf, pagesOf } from "../lib/dlc_helpers.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const jsonMode = args.includes("--json");
const rangeArg = args.find((arg) => arg.startsWith("--range="))?.slice(8);
const range = rangeArg?.match(/^(\d+)-(\d+)$/) ? rangeArg.split("-").map(Number) : null;
const OUTPUT = path.join(ROOT, "content", "plan2700_checklist.json");
const POINTS = [
  "simetria",
  "recodo",
  "alcance",
  "warps",
  "tileset",
  "musica",
  "motivo",
  "contenido",
  "control",
  "salida",
];
const mapInfos = readData("MapInfos.rxdata");
const allIds = mapInfos.pairs.map(([id]) => Number(id)).filter((id) => Number.isInteger(id) && fs.existsSync(path.join(DATA, mapFile(id)))).sort((a, b) => a - b);
const mapIds = range ? allIds.filter((id) => id >= range[0] && id <= range[1]) : allIds;
const tilesets = readData("Tilesets.rxdata");
const tilesetCount = Array.isArray(tilesets) ? tilesets.length : 0;
const existingBgm = new Set();
for (const dir of ["Audio/BGM", "Audio/BGM"] ) {
  const absolute = path.join(DATA, "..", dir);
  if (fs.existsSync(absolute)) for (const file of fs.readdirSync(absolute)) existingBgm.add(file);
}
// GAME/Data/.. is pokemon_fire_ash; Audio actually lives alongside Data.
const audioDir = path.join(DATA, "..", "Audio", "BGM");
if (fs.existsSync(audioDir)) for (const file of fs.readdirSync(audioDir)) existingBgm.add(file);

function number(value) {
  return Number(value?.value ?? value ?? 0);
}
function commandsFor(entries) {
  return entries.flatMap((entry) => pagesOf(entry).flatMap((page) => page.list));
}
function commandParam(command, index) {
  return number(command.params?.[index]);
}
function mapBgm(raw) {
  const bgm = iv(raw, "@bgm");
  return txt(iv(bgm, "@name"));
}
function firstPassable(g) {
  for (let y = 0; y < g.height; y += 1) for (let x = 0; x < g.width; x += 1) if (walkableAt(g, x, y)) return [x, y];
  return null;
}
function reachability(mapId) {
  try {
    const g = grid(mapId);
    const start = firstPassable(g);
    if (!start) return { status: "review", passable: 0, reachable: 0, ratio: 0, note: "no hay celda transitable; revisar manualmente" };
    let passable = 0;
    for (let y = 0; y < g.height; y += 1) for (let x = 0; x < g.width; x += 1) if (walkableAt(g, x, y)) passable += 1;
    const seen = new Set();
    const queue = [start];
    const key = ([x, y]) => `${x},${y}`;
    seen.add(key(start));
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const next of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const k = key(next);
        if (!seen.has(k) && walkableAt(g, next[0], next[1])) { seen.add(k); queue.push(next); }
      }
    }
    const ratio = passable ? seen.size / passable : 1;
    return { status: ratio >= 0.95 ? "pass" : "review", passable, reachable: seen.size, ratio: Number(ratio.toFixed(4)), note: ratio >= 0.95 ? "componente principal" : "hay componentes aislados; revisar entrada/ornamento" };
  } catch (error) {
    return { status: "review", passable: null, reachable: null, ratio: null, note: `no se pudo medir: ${error.message}` };
  }
}
function auditMap(mapId) {
  const raw = readMapRaw(mapId);
  const width = number(iv(raw, "@width"));
  const height = number(iv(raw, "@height"));
  const tilesetId = number(iv(raw, "@tileset_id"));
  const entries = eventsOf(mapId);
  const commands = commandsFor(entries);
  const warps = commands.filter((command) => command.code === 201).map((command) => ({
    map: commandParam(command, 1), x: commandParam(command, 2), y: commandParam(command, 3),
  }));
  const invalidWarps = warps.filter((warp) => warp.map <= 0 || !fs.existsSync(path.join(DATA, mapFile(warp.map))) || warp.x < 0 || warp.y < 0);
  const autorunPages = entries.flatMap((entry) => pagesOf(entry)).filter((page) => page.trigger === 3 || page.trigger === 4);
  const unsafePages = autorunPages.filter((page) => !page.list.some((command) => [0, 115, 123, 201, 214, 122, 121, 355].includes(command.code)));
  const reach = reachability(mapId);
  const bgm = mapBgm(raw);
  const points = {
    simetria: { status: "manual", note: "la simetría axial deliberada exige revisión visual" },
    recodo: { status: "manual", note: "la longitud de una ruta jugable exige lectura visual" },
    alcance: reach,
    warps: { status: invalidWarps.length ? "fail" : "pass", total: warps.length, invalid: invalidWarps },
    tileset: { status: tilesetId > 0 && tilesetId < tilesetCount ? "pass" : "fail", tilesetId, tilesetCount, note: "costuras/autotiles requieren render visual" },
    musica: { status: bgm && existingBgm.has(bgm) ? "pass" : bgm ? "review" : "manual", bgm, note: bgm ? "archivo encontrado" : "mapa sin BGM explícita; revisar herencia intencional" },
    motivo: { status: "review", events: entries.length, note: "la existencia de motivo decorativo requiere lectura visual" },
    contenido: { status: entries.length >= 1 ? "pass" : "review", events: entries.length, note: entries.length ? "hay contenido estructural" : "mapa sin eventos; revisar perfil" },
    control: { status: unsafePages.length ? "review" : "pass", autorunPages: autorunPages.length, unsafePages: unsafePages.length, note: "se comprueba liberación estructural; duración de la escena es manual" },
    salida: { status: warps.length ? "pass" : "review", transfers: warps.length, note: "una segunda salida para mazmorra requiere perfil visual" },
  };
  return { mapId, width, height, tilesetId, events: entries.length, points };
}

const rows = [];
for (const mapId of mapIds) rows.push(auditMap(mapId));
const counts = Object.fromEntries(POINTS.map((point) => [point, Object.fromEntries(["pass", "review", "manual", "fail"].map((status) => [status, rows.filter((row) => row.points[point].status === status).length]))]));
const result = {
  schema: "plan2700_checklist_mapa/1.0",
  generatedAt: new Date().toISOString(),
  range: range ?? [mapIds[0] ?? null, mapIds.at(-1) ?? null],
  maps: rows.length,
  points: POINTS,
  summary: counts,
  policy: "Los puntos perceptivos se marcan manual/review; este informe no certifica un playtest.",
  mapsDetail: rows,
};
if (write) fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
if (jsonMode) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Checklist de mapa: ${rows.length} mapas (${result.range[0]}–${result.range[1]})`);
  for (const point of POINTS) console.log(`  ${point}: ${counts[point].pass} pass · ${counts[point].review} review · ${counts[point].manual} manual · ${counts[point].fail} fail`);
  if (write) console.log(`  salida: ${path.relative(ROOT, OUTPUT)}`);
}
if (rows.some((row) => POINTS.some((point) => row.points[point].status === "fail"))) process.exitCode = 1;
