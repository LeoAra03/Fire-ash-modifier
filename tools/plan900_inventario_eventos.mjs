#!/usr/bin/env node
/**
 * Inventario de eventos `PokeMod*` por mapa (FASE 16 del plan 900).
 *
 * Recorre todos los mapas del juego vivo y registra todo evento cuyo nombre
 * empiece por "PokeMod" (el marcador de autoría del contenido añadido).
 * Solo lee: no modifica mapas, eventos ni partidas.
 *
 * Salida: content/plan900_inventario_eventos.json
 *
 * Uso:
 *   node tools/plan900_inventario_eventos.mjs            # escribe el JSON
 *   node tools/plan900_inventario_eventos.mjs --summary  # solo imprime totales
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../web/js/marshal.js";
import { mapListFromInfos, parseMap, parseEvent } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const OUT = path.join(ROOT, "content", "plan900_inventario_eventos.json");
const SUMMARY_ONLY = process.argv.includes("--summary");
const MARKER = "PokeMod";

const infos = mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
const byId = new Map(infos.map((m) => [m.id, m.name]));

const perMap = [];
let totalEventos = 0;
let mapasConEventos = 0;
const porPrefijo = new Map();

for (const info of infos) {
  const file = path.join(DATA, `Map${String(info.id).padStart(3, "0")}.rxdata`);
  if (!fs.existsSync(file)) continue;
  const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
  const eventos = [];
  for (const { id } of parsed.events) {
    const ev = parseEvent(parsed.events.find((e) => e.id === id).obj);
    if (!ev.name || !ev.name.startsWith(MARKER)) continue;
    eventos.push({ eventoId: ev.id, nombre: ev.name, x: ev.x, y: ev.y, paginas: ev.pages.length });
    totalEventos++;
    const prefijo = ev.name.split(":")[0].trim();
    porPrefijo.set(prefijo, (porPrefijo.get(prefijo) || 0) + 1);
  }
  if (eventos.length) {
    mapasConEventos++;
    perMap.push({ mapId: info.id, nombreMapa: byId.get(info.id) ?? "", total: eventos.length, eventos });
  }
}

const report = {
  esquema: "plan900_inventario_eventos/1.0",
  generado: new Date().toISOString(),
  criterio: 'nombre de evento que empieza por "PokeMod"',
  fuente: "pokemon_fire_ash/Data/Map*.rxdata (solo lectura)",
  totales: {
    mapasEscaneados: infos.length,
    mapasConEventosPokeMod: mapasConEventos,
    eventosPokeMod: totalEventos,
    prefijos: Object.fromEntries([...porPrefijo.entries()].sort((a, b) => b[1] - a[1])),
  },
  porMapa: perMap,
  regenerar: "node tools/plan900_inventario_eventos.mjs",
};

if (!SUMMARY_ONLY) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`Inventario de eventos PokeMod* (FASE 16)`);
console.log(`  mapas escaneados:          ${infos.length}`);
console.log(`  mapas con eventos PokeMod: ${mapasConEventos}`);
console.log(`  eventos PokeMod totales:   ${totalEventos}`);
console.log(`  prefijos: ${JSON.stringify(report.totales.prefijos)}`);
if (!SUMMARY_ONLY) console.log(`  escrito: ${path.relative(ROOT, OUT)}`);
