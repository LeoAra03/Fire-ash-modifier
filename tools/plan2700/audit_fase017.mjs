#!/usr/bin/env node
/**
 * Auditoría reproducible de la tanda 17 (IDs 1600–1699).
 *
 * La tanda mezcla tres entregables: Diploma/Liga Oscura, las siete emisiones
 * del Multiverso y La Ruta de Dios. Este auditor no inventa un playtest: separa
 * invariantes que se pueden leer de la ROMXP de recorridos humanos que quedan
 * listados como QA manual.
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, GAME, ROOT, eventsOf, iv, pagesOf, readData, readMapRaw, txt,
} from "../lib/dlc_helpers.mjs";

const JSON_OUTPUT = process.argv.includes("--json");
const errors = [];
const warnings = [];
const check = (value, message) => { if (!value) errors.push(message); };
const warn = (message) => warnings.push(message);
const load = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const mapFile = (id) => path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`);
const commandOf = (command) => ({ code: Number(command.code), params: command.params ?? [] });
const allCommands = (mapId) => eventsOf(mapId).flatMap((entry) => pagesOf(entry).flatMap((page) => page.list.map(commandOf)));
const hasCode = (commands, code, predicate = () => true) => commands.some((command) => command.code === code && predicate(command));

function mapAudit(mapId) {
  check(fs.existsSync(mapFile(mapId)), `Map${mapId}: archivo ausente`);
  if (!fs.existsSync(mapFile(mapId))) return null;
  const map = readMapRaw(mapId);
  const width = Number(iv(map, "@width"));
  const height = Number(iv(map, "@height"));
  const events = eventsOf(mapId);
  check(width > 0 && height > 0, `Map${mapId}: dimensiones inválidas`);
  for (const entry of events) {
    const x = Number(iv(entry.obj, "@x"));
    const y = Number(iv(entry.obj, "@y"));
    check(x >= 0 && x < width && y >= 0 && y < height, `Map${mapId}: ${entry.name} fuera de límites`);
  }
  return { mapId, width, height, events: events.length, names: events.map((entry) => entry.name) };
}

function auditLiga() {
  const plan = load("content/diplomas_planta.json");
  const multiverse = load("content/multiverse_creepypasta.json");
  const system = readData("System.rxdata");
  const switches = iv(system, "switches") ?? [];
  const sealIds = multiverse.maps.filter((map) => map.role === "emision").map((map) => multiverse.sealSwitchBase + map.zone);
  const expansion = load("content/expansion_multiversal.json");
  const arenaId = expansion.darkLeague.maps.find((map) => map.role === "arena")?.mapId ?? 2193;
  const liga = eventsOf(arenaId);
  const finalEvents = liga.filter((entry) => entry.name.endsWith(expansion.darkLeague.battles.at(-1).name));
  const finalWrites = finalEvents.flatMap((entry) => pagesOf(entry).flatMap((page) => page.list.map(commandOf)))
    .filter((command) => command.code === 121 && Number(command.params[0]) === 948 && Number(command.params[2]) === 0);
  check(sealIds.length === 7, `Liga Oscura: se esperaban 7 emisiones, hay ${sealIds.length}`);
  check(sealIds.every((id) => Number(txt(switches[id] ?? "").length) > 0), "Liga Oscura: hay sellos sin nombre en System.rxdata");
  check(txt(switches[948]).includes("LIGA OSCURA"), "Liga Oscura: switch 948 sin nombre legible");
  check(finalEvents.length === 1, `Liga Oscura: hay ${finalEvents.length} eventos del jefe final (se espera 1)`);
  check(finalWrites.length >= 1, `Liga Oscura: el jefe final no escribe switch 948`);
  const diploma = plan.diplomas.find((entry) => entry.clave === "oscura");
  check(diploma?.condicion?.switch === 948, "Diploma de Liga Oscura: condición distinta de switch 948");
  check(liga.some((entry) => /Grieta|Liga|Jefe/.test(entry.name)), "Liga Oscura: faltan eventos de entrada/salida");
  return {
    maps: [2141, 2142, 2192, 2193].map(mapAudit),
    sealIds,
    arenaId,
    finalEvents: finalEvents.length,
    finalWrites: finalWrites.length,
    diplomaCondition: diploma?.condicion ?? null,
    switches: sealIds.concat(948).map((id) => ({ id, name: txt(switches[id] ?? "") })),
  };
}

function auditEmissions() {
  const catalog = load("content/multiverse_creepypasta.json");
  const wild = load("content/wild_zones.json");
  const emissions = catalog.maps.filter((map) => map.role === "emision");
  const rows = [];
  for (const spec of emissions) {
    const boss = catalog.bosses.find((candidate) => candidate.mapId === spec.mapId);
    const events = eventsOf(spec.mapId);
    const bossEvent = events.find((entry) => entry.name.includes(`Jefe ${boss?.name ?? ""}`));
    const commands = bossEvent ? pagesOf(bossEvent).flatMap((page) => page.list.map(commandOf)) : [];
    const seal = catalog.sealSwitchBase + Number(boss?.zone ?? -1);
    const zones = (wild.zones ?? []).filter((zone) => zone.mapId === spec.mapId);
    check(!!boss, `Map${spec.mapId}: emisión sin guardián en el catálogo`);
    check(!!bossEvent, `Map${spec.mapId}: falta evento del guardián ${boss?.name ?? "desconocido"}`);
    check(hasCode(commands, 121, (command) => Number(command.params[0]) === seal && Number(command.params[2]) === 0), `Map${spec.mapId}: el guardián no escribe el sello ${seal}`);
    check(hasCode(commands, 123), `Map${spec.mapId}: el guardián no libera su self-switch tras ganar`);
    check(events.some((entry) => entry.name.includes("Volver a la gruta") || entry.name.includes("Volver al mundo")), `Map${spec.mapId}: falta salida de retorno`);
    check(zones.length === 1, `Map${spec.mapId}: tabla salvaje ausente o duplicada (${zones.length})`);
    rows.push({
      mapId: spec.mapId,
      title: spec.title,
      boss: boss?.name ?? null,
      seal,
      events: events.length,
      mapsInEmission: 1,
      wildSlots: zones.reduce((sum, zone) => Object.values(zone.types ?? {}).reduce((n, slots) => n + slots.length, sum), 0),
      manualExpansion: "La estructura instalada conserva una emisión por mapa; una ampliación a 2–3 mapas requiere diseño visual/playtest, no se afirma como hecha.",
    });
  }
  check(emissions.length === 7, `Multiverso: se esperaban siete emisiones y hay ${emissions.length}`);
  check(Number(catalog.counterVariable) === 264, "Multiverso: contador distinto de v[264]");
  warn("El número de mapas de cada emisión es 1 en el estado instalado; la expansión a 2–3 mapas es una tarea creativa pendiente y no se maquilla en el informe.");
  warn("El recorrido automático y la partida real de las siete emisiones requieren ejecución en Kirin/Game.exe.");
  return { maps: [2021, 2022, ...emissions.map((map) => map.mapId)].map(mapAudit), emissions: rows, counterVariable: catalog.counterVariable };
}

function auditRuta() {
  const ids = [2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038];
  const maps = ids.map(mapAudit);
  const names = maps.flatMap((map) => map?.names ?? []);
  const scriptPath = path.join(DATA, "Scripts.rxdata");
  const scriptsText = fs.existsSync(scriptPath) ? fs.statSync(scriptPath).size : 0;
  check(ids.every((id) => fs.existsSync(mapFile(id))), "Ruta de Dios: falta algún mapa del rango 2030–2038");
  check(names.some((name) => /Arceus/i.test(name)), "Ruta de Dios: falta el evento del altar/Arceus");
  check(names.some((name) => /Cintia|Cynthia/i.test(name)), "Ruta de Dios: falta un testigo campeón");
  check(names.filter((name) => /Item /i.test(name)).length >= 7, "Ruta de Dios: faltan objetos ocultos narrados");
  warn("La comprobación de cámara lenta, paneo, tiempos de control y ritmo de partida no puede sustituir un recorrido humano.");
  return { maps, scriptBytes: scriptsText, floors: ids.slice(1, 8), hiddenItems: names.filter((name) => /Item /i.test(name)).length };
}

function auditWildAndNoTouch() {
  const wild = load("content/wild_zones.json");
  const ids = new Set(wild.zones?.map((zone) => Number(zone.mapId)) ?? []);
  const relevant = [2021, 2022, ...Array.from({ length: 7 }, (_, index) => 2023 + index)];
  for (const mapId of relevant) check(ids.has(mapId), `Fauna: falta zona de emisión Map${mapId}`);
  const levels = wild.zones.filter((zone) => relevant.includes(Number(zone.mapId)))
    .flatMap((zone) => Object.values(zone.types ?? {}).flatMap((slots) => slots.map((row) => [Number(row[2]), Number(row[3])])))
    .flat();
  check(levels.length > 0 && Math.min(...levels) >= 70 && Math.max(...levels) <= 108, `Fauna de emisiones fuera del rango 70–108 (${Math.min(...levels)}–${Math.max(...levels)})`);
  return { zones: wild.zones.filter((zone) => relevant.includes(Number(zone.mapId))).length, slots: levels.length / 2, minLevel: Math.min(...levels), maxLevel: Math.max(...levels) };
}

const result = {
  schema: "plan2700_fase017_audit/1.0",
  phase: "017",
  tasks: [1600, 1699],
  ligaOscura: auditLiga(),
  emisiones: auditEmissions(),
  rutaDeDios: auditRuta(),
  wild: auditWildAndNoTouch(),
  manualQa: [
    "recorrido automático de Liga Oscura y de las siete emisiones",
    "partida real con siete sellos, derrota y reintento",
    "escucha de BGM y clima, restauración de tono al salir",
    "recorrido completo de La Ruta de Dios en Kirin/Game.exe",
    "verificación humana de que cada puzle tiene pista diegética",
  ],
  failures: errors,
  warnings,
};

if (JSON_OUTPUT) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`FASE 017: Liga ${result.ligaOscura.finalWrites} escritor ON de 948 · emisiones ${result.emisiones.emissions.length} · Ruta ${result.rutaDeDios.floors.length} pisos`);
  console.log(`  fauna emisiones ${result.wild.zones} zonas/${result.wild.slots} slots · niveles ${result.wild.minLevel}–${result.wild.maxLevel}`);
  for (const message of warnings) console.warn(`  ⚠ ${message}`);
  if (errors.length) {
    console.error(`FALLO: ${errors.length} comprobaciones`);
    for (const message of errors) console.error(`  · ${message}`);
    process.exit(1);
  }
  console.log("OK: invariantes instaladas de Liga Oscura, emisiones y Ruta de Dios en verde");
}
if (errors.length) process.exit(1);
