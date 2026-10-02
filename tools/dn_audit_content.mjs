#!/usr/bin/env node
/**
 * dn_audit_content.mjs — auditoría de contenido del Dimensional Nightmare.
 *
 * Recorre los 103 mapas construidos (100 de ficha + hub + Liga) y sus eventos buscando **errores
 * reales**, clasificados por tipo:
 *
 *   LEVEL DESIGN : celdas aisladas, BFS bajo, NPCs sobre muro, eventos apilados en la misma celda,
 *                  transferencias fuera de rango o a celdas no transitables
 *   NPC          : gráficos de personaje inexistentes (evento invisible o fallo al dibujar)
 *   TILES        : tileset del mapa ausente
 *   CINEMÁTICA   : cambios de tono que no vuelven a neutro en la misma página
 *   BATTLE       : trainers de jefe inexistentes, especies inexistentes, niveles fuera de rango
 *   AUDIO        : BGM/BGS declarados que no están en Audio/
 *   FLAGS        : switches/variables sin nombre o pisando los rangos reservados del Atlas
 *
 * Salida: informe por consola + `docs/dn_referencia/auditoria/dn_audit.json`.
 * Código de salida 1 si hay errores (los avisos no fallan salvo `--strict`).
 *
 * Uso:
 *   node tools/dn_audit_content.mjs [--strict]
 */
import fs from "node:fs";
import path from "node:path";
import { parseMap } from "../web/js/rmxp.js";
import {
  GAME, DATA, GRAPHICS, ROOT, BUILT, EVENTS, txt, mapFile, readData, readMap, readJson, writeJson,
  grid, passabilityOf, reachableCells, isToneLine,
} from "./lib/dn_rmxp.mjs";

const STRICT = process.argv.includes("--strict");
const errors = [];
const warnings = [];
const err = (kind, msg) => errors.push({ kind, msg });
const warn = (kind, msg) => warnings.push({ kind, msg });

// --------------------------------------------------------------- recursos
const withoutExt = (dir) => new Set(fs.readdirSync(path.join(GAME, "Audio", dir)).map((f) => f.replace(/\.[a-z0-9]+$/i, "")));
const characters = new Set(fs.readdirSync(path.join(GRAPHICS, "Characters")).map((f) => f.replace(/\.png$/i, "")));
const bgmSet = withoutExt("BGM"), bgsSet = withoutExt("BGS");
const itemSymbols = new Set(readData("items.dat").pairs.filter(([k]) => k && k.name !== undefined).map(([k]) => k.name));
const trainerKeys = new Set(readData("trainers.dat").pairs
  .filter(([k]) => Array.isArray(k) && k.length === 3)
  .map(([k]) => `${txt(k[0])}|${txt(k[1])}`));
const speciesSet = new Set(readData("species.dat").pairs.filter(([k]) => k && k.name !== undefined).map(([k]) => k.name));
const tilesets = readData("Tilesets.rxdata");
const system = readData("System.rxdata");
const switchNames = system.getIvar("@switches");
const variableNames = system.getIvar("@variables");
const mapIds = new Set(fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f)).map((f) => Number(f.match(/\d+/)[0])));
const built = readJson(BUILT).maps;
const eventsBuilt = readJson(EVENTS).maps ?? {};
const catalog = readJson(path.join(ROOT, "content", "dimensional_nightmare_events.json"));

/** Rangos ajenos, detectados por el NOMBRE en System.rxdata (no por número fijo). */
const ATLAS = /ATLAS/i;
const RUTA = /RUTA_DE_DIOS|ARCEUS_CINEMATIC|SNOWPOINT/i;
const nameOf = (table, id) => (id < table.length ? txt(table[id]) : "");
const foreignFlag = (table, id) => {
  const name = nameOf(table, id);
  if (ATLAS.test(name)) return "Atlas";
  if (RUTA.test(name)) return "La Ruta de Dios";
  return null;
};

// --------------------------------------------------------------- helpers de eventos
const pairEvents = (raw) => raw.getIvar("@events")?.pairs ?? [];
const pagesOfEvent = (raw) => {
  const out = [];
  for (const [, ev] of pairEvents(raw)) {
    for (const page of ev.getIvar("@pages") ?? []) out.push({ event: txt(ev.getIvar("@name")), page });
  }
  return out;
};
const listOf = (page) => page.getIvar("@list") ?? [];
const codeOf = (command) => command.getIvar("@code");
const paramsOf = (command) => command.getIvar("@parameters") ?? [];
const textOf = (command) => paramsOf(command).map((p) => txt(p)).join(" ");

// caché de mapas (transferencias cruzadas)
const cache = new Map();
function mapInfo(id) {
  if (cache.has(id)) return cache.get(id);
  const parsed = parseMap(readMap(id));
  const value = {
    width: parsed.width, height: parsed.height,
    pass: passabilityOf(parsed, parsed.tilesetId),
    occupied: new Set((parsed.events ?? []).map((e) => `${e.x},${e.y}`)),
  };
  cache.set(id, value);
  return value;
}

// --------------------------------------------------------------- 1. mapas
const mapStats = [];
for (const info of built) {
  const file = path.join(DATA, mapFile(info.id));
  if (!fs.existsSync(file)) { err("TILES", `Map${info.id}: falta el archivo del mapa`); continue; }
  const raw = readMap(info.id);
  const parsed = parseMap(raw);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  if (!tilesets[parsed.tilesetId]) err("TILES", `Map${info.id}: tileset #${parsed.tilesetId} ausente`);

  // level design: alcanzabilidad desde la entrada
  const entry = info.bfs?.entry ?? [Math.floor(parsed.width / 2), parsed.height - 1];
  const reach = reachableCells(pass, entry);
  let walkable = 0;
  for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) if (pass.passable(x, y, 8)) walkable++;
  const ratio = walkable ? reach.size / walkable : 0;
  if (ratio < 0.9) warn("LEVEL DESIGN", `Map${info.id}: BFS ${(ratio * 100).toFixed(0)} % (${walkable - reach.size} celdas aisladas)`);
  mapStats.push({ id: info.id, walkable, reachable: reach.size, ratio: Number(ratio.toFixed(3)) });

  // eventos: celdas, NPCs y gráficos
  const cells = new Map();
  for (const [, ev] of pairEvents(raw)) {
    const name = txt(ev.getIvar("@name"));
    const x = ev.getIvar("@x"), y = ev.getIvar("@y");
    const key = `${x},${y}`;
    if (cells.has(key)) warn("LEVEL DESIGN", `Map${info.id}: eventos apilados en (${x},${y}) — ${cells.get(key)} y ${name}`);
    cells.set(key, name);
    if (/^NPC_/.test(name) && !pass.passable(x, y, 8)) warn("LEVEL DESIGN", `Map${info.id}: ${name} sobre celda no transitable (${x},${y})`);
    if (/^(EV_|CONN_|LIGA_|HUB_|MEDALLA_|BOSSB_)/.test(name) && !reach.has(key)) {
      warn("LEVEL DESIGN", `Map${info.id}: ${name} en celda aislada (${x},${y})`);
    }
    for (const page of ev.getIvar("@pages") ?? []) {
      const graphic = txt(page.getIvar("@graphic")?.getIvar("@character_name"));
      if (graphic && !characters.has(graphic)) err("NPC", `Map${info.id}: ${name} usa un gráfico inexistente «${graphic}»`);
    }
  }

  // transferencias, cinemática y flags
  for (const { event, page } of pagesOfEvent(raw)) {
    let tinted = false;
    for (const command of listOf(page)) {
      const code = codeOf(command);
      const text = textOf(command);
      if (code === 201) {
        const [, to, tx, ty] = paramsOf(command);
        if (!mapIds.has(to)) { err("LEVEL DESIGN", `Map${info.id}: ${event} transfiere a un mapa inexistente (${to})`); continue; }
        const target = mapInfo(to);
        if (tx < 0 || ty < 0 || tx >= target.width || ty >= target.height) {
          err("LEVEL DESIGN", `Map${info.id}: ${event} transfiere fuera de Map${to} (${tx},${ty})`);
        } else if (!target.pass.passable(tx, ty, 8) && !target.occupied.has(`${tx},${ty}`)) {
          warn("LEVEL DESIGN", `Map${info.id}: ${event} transfiere a celda no transitable de Map${to} (${tx},${ty})`);
        }
      }
      if (code === 355 && text.includes("Tone.new")) {
        const neutral = /Tone\.new\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(text);
        // `dn:sensacion` va pegado a una transferencia (el tono viaja al mapa destino);
        // `dn:ambiente` es un tono de sala que se restaura en otro comando. Ninguno se marca.
        const carried = isToneLine(text, "dn:sensacion") || isToneLine(text, "dn:ambiente");
        if (!neutral && !carried) tinted = true;
      }
      for (const match of text.matchAll(/\$game_switches\[(\d+)\]/g)) {
        const id = Number(match[1]);
        const owner = foreignFlag(switchNames, id);
        if (owner) err("FLAGS", `Map${info.id}: ${event} usa el switch ${id} reservado por ${owner}`);
        else if (!nameOf(switchNames, id)) warn("FLAGS", `Map${info.id}: ${event} usa el switch ${id} sin nombre en System.rxdata`);
      }
      for (const match of text.matchAll(/\$game_variables\[(\d+)\]/g)) {
        const id = Number(match[1]);
        const owner = foreignFlag(variableNames, id);
        if (owner) err("FLAGS", `Map${info.id}: ${event} usa la variable ${id} reservada por ${owner}`);
        else if (!nameOf(variableNames, id)) warn("FLAGS", `Map${info.id}: ${event} usa la variable ${id} sin nombre en System.rxdata`);
      }
      for (const match of text.matchAll(/(?:pbReceiveItem|pbItemBall)\(:([A-Z0-9_]+)/g)) {
        if (!itemSymbols.has(match[1])) err("BATTLE", `Map${info.id}: ${event} entrega el objeto inexistente ${match[1]}`);
      }
      for (const match of text.matchAll(/PBTrainer\.new\("([A-Z0-9_]+)",\s*"([^"]+)"\)/g)) {
        if (!trainerKeys.has(`${match[1]}|${match[2]}`)) err("BATTLE", `Map${info.id}: ${event} invoca al trainer inexistente ${match[1]}/${match[2]}`);
      }
    }
    if (tinted) warn("CINEMÁTICA", `Map${info.id}: ${event} cambia el tono y no lo devuelve a neutro en la misma página`);
  }

  // audio del mapa
  const mapBgm = txt(raw.getIvar("@bgm")?.getIvar("@name"));
  const mapBgs = txt(raw.getIvar("@bgs")?.getIvar("@name"));
  if (mapBgm && mapBgm !== "(OFF)" && !bgmSet.has(mapBgm)) warn("AUDIO", `Map${info.id}: BGM «${mapBgm}» no está en Audio/BGM`);
  if (mapBgs && mapBgs !== "(OFF)" && !bgsSet.has(mapBgs)) warn("AUDIO", `Map${info.id}: BGS «${mapBgs}» no está en Audio/BGS`);
}

// --------------------------------------------------------------- 2. jefes del ciclo
for (const episode of catalog.episodes ?? []) {
  const boss = episode.boss;
  if (!boss) continue;
  const key = `${boss.phaseA.type}|${boss.phaseA.label}`;
  if (!trainerKeys.has(key)) err("BATTLE", `${episode.key}: el trainer del jefe «${key}» no existe en trainers.dat`);
  for (const [speciesId, level] of boss.team ?? []) {
    if (!speciesSet.has(speciesId)) err("BATTLE", `${episode.key}: especie inexistente en el equipo del jefe (${speciesId})`);
    if (level > 150) warn("BATTLE", `${episode.key}: ${speciesId} nv ${level} por encima del máximo del juego`);
  }
}
for (const [id, info] of Object.entries(eventsBuilt)) {
  const g = grid(Number(id));
  const reach = reachableCells(g.pass, info.entry ?? [Math.floor(g.width / 2), g.height - 2]);
  for (const ev of g.events) {
    if (/JEFE|MEDALLA|BOSSB_|SELLO/.test(ev.name) && !reach.has(`${ev.x},${ev.y}`)) {
      warn("LEVEL DESIGN", `Map${id}: ${ev.name} (${ev.x},${ev.y}) fuera de la zona alcanzable`);
    }
  }
}

// --------------------------------------------------------------- 3. Liga Oscura
const liga = readJson(EVENTS).liga;
if (liga) {
  // cada comprobación se hace sobre el mapa donde vive el evento
  const checks = [
    { id: liga.maps?.coliseo, cells: [["LIGA_MPIKA", liga.mpika], ...(liga.sparks ?? []).map((c, i) => [`LIGA_CHISPA_${i + 1}`, c])] },
    { id: liga.maps?.portico, cells: [["LIGA_LLEGADA", liga.entry?.portico], ["LIGA_ACCESO_COLISEO", null], ["LIGA_SALIDA", liga.exit?.portico]] },
  ];
  for (const check of checks) {
    if (!check.id) continue;
    const g = grid(Number(check.id));
    const start = liga.entry?.[Number(check.id) === liga.maps.coliseo ? "coliseo" : "portico"] ?? [Math.floor(g.width / 2), g.height - 2];
    const reach = reachableCells(g.pass, start);
    for (const [name, cell] of check.cells) {
      if (!cell) continue;
      if (!reach.has(`${cell[0]},${cell[1]}`)) warn("LEVEL DESIGN", `Map${check.id}: ${name} fuera de la zona alcanzable`);
    }
  }
}

// --------------------------------------------------------------- informe
const byKind = (list) => list.reduce((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }), {});
const report = {
  generatedBy: "tools/dn_audit_content.mjs",
  maps: built.length,
  stats: { errors: errors.length, warnings: warnings.length, byKind: { errors: byKind(errors), warnings: byKind(warnings) } },
  levelDesign: mapStats.sort((a, b) => a.ratio - b.ratio).slice(0, 15),
  errors,
  warnings,
};
const outDir = path.join(ROOT, "docs", "dn_referencia", "auditoria");
fs.mkdirSync(outDir, { recursive: true });
writeJson(path.join(outDir, "dn_audit.json"), report);

console.log(`auditoría de ${built.length} mapas · ${errors.length} errores · ${warnings.length} avisos`);
for (const [kind, count] of Object.entries(report.stats.byKind.errors)) console.log(`  ERROR ${kind}: ${count}`);
for (const [kind, count] of Object.entries(report.stats.byKind.warnings)) console.log(`  aviso ${kind}: ${count}`);
if (errors.length) { console.log("  — errores —"); for (const e of errors.slice(0, 25)) console.error(`  FALLA [${e.kind}] ${e.msg}`); }
if (warnings.length) { console.log("  — avisos (máx. 25) —"); for (const w of warnings.slice(0, 25)) console.log(`  aviso [${w.kind}] ${w.msg}`); }
console.log("informe: docs/dn_referencia/auditoria/dn_audit.json");
process.exit(errors.length || (STRICT && warnings.length) ? 1 : 0);
