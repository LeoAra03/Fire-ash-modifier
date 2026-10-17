#!/usr/bin/env node
/**
 * Volcado determinista de todos los textos de eventos `PokeMod*`.
 *
 * No modifica mapas ni scripts. La salida es una fuente de auditoría legible
 * para el bloque de diálogos del plan 900: permite contar eventos, páginas,
 * cajas 101/401 y mensajes disparados por Ruby sin depender de un editor.
 *
 * Uso:
 *   node tools/plan900/dump_dialogos.mjs
 *   node tools/plan900/dump_dialogos.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, mapListFromInfos, parseEvent, parseMap } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const OUT = path.join(ROOT, "content", "plan900_dialogos.json");
const VERIFY = process.argv.includes("--verify");
const MARKER = "PokeMod";

function text(value) {
  return value?.text ?? String(value ?? "");
}
function mapFile(id) {
  return path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`);
}
function rubyText(value) {
  const raw = text(value);
  return raw.length ? raw : null;
}
function collectPage(page, pageIndex) {
  const list = page.list ?? [];
  const boxes = [];
  const scripts = [];
  for (let i = 0; i < list.length; i++) {
    const command = cmdOf(list[i]);
    if (command.code === 101) {
      const lines = [rubyText(command.params[0]) ?? ""];
      let j = i + 1;
      while (j < list.length && cmdOf(list[j]).code === 401) {
        lines.push(rubyText(cmdOf(list[j]).params[0]) ?? "");
        j++;
      }
      boxes.push({ comando: i, lineas: lines, texto: lines.join(" ") });
      continue;
    }
    if ([355, 655].includes(command.code)) {
      const value = rubyText(command.params[0]);
      if (value) scripts.push({ comando: i, codigo: command.code, ruby: value });
    }
  }
  return { pagina: pageIndex + 1, cajas: boxes, scripts };
}
function build() {
  const infos = mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  const maps = [];
  let eventCount = 0;
  let pageCount = 0;
  let boxCount = 0;
  let scriptCount = 0;
  for (const info of infos) {
    const file = mapFile(info.id);
    if (!fs.existsSync(file)) continue;
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    const events = [];
    for (const entry of parsed.events) {
      const event = parseEvent(entry.obj);
      if (!event.name.startsWith(MARKER)) continue;
      eventCount++;
      const pages = event.pages.map((page, index) => collectPage(page, index));
      pageCount += pages.length;
      boxCount += pages.reduce((sum, page) => sum + page.cajas.length, 0);
      scriptCount += pages.reduce((sum, page) => sum + page.scripts.length, 0);
      events.push({
        eventoId: event.id,
        nombre: event.name,
        coordenadas: [event.x, event.y],
        paginas: pages,
      });
    }
    if (events.length) maps.push({ mapId: info.id, nombre: info.name, eventos: events });
  }
  return {
    esquema: "plan900_dialogos/1.0",
    criterio: 'evento cuyo nombre empieza por "PokeMod"',
    fuente: "pokemon_fire_ash/Data/Map*.rxdata (solo lectura)",
    totales: {
      mapasConEventos: maps.length,
      eventosPokeMod: eventCount,
      paginas: pageCount,
      cajasTexto: boxCount,
      mensajesRuby: scriptCount,
    },
    mapas: maps,
    regenerar: "node tools/plan900/dump_dialogos.mjs",
  };
}
function serialized(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
const report = build();
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}; regenera el volcado primero.`);
  const actual = fs.readFileSync(OUT, "utf8");
  if (actual !== serialized(report)) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado; ejecuta el generador y revisa el diff.`);
} else {
  fs.writeFileSync(OUT, serialized(report));
}
console.log(`OK: ${report.totales.eventosPokeMod} eventos PokeMod, ${report.totales.cajasTexto} cajas 101/401 y ${report.totales.mensajesRuby} mensajes Ruby en ${report.totales.mapasConEventos} mapas${VERIFY ? " (volcado vigente)" : `; escrito ${path.relative(ROOT, OUT)}`}.`);
