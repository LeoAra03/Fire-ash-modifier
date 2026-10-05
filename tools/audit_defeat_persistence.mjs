#!/usr/bin/env node
/**
 * Audita la persistencia de derrotas en el contenido de la expansión y la torre.
 * Regla exigida: "si lo derrotaste una vez, queda derrotado".
 *
 * Patrones aceptados de cierre tras ganar (ambos con canLose para poder reintentar
 * tras perder):
 *   A) IF pbTrainerBattle(...)/pbWildBattle(...) → self-switch o sello → página cerrada.
 *   B) d=pbWildBattleCore(p) + IF d==1 || d==4 → self-switch o contador → página cerrada.
 * Las revanchas solo se aceptan tras elección explícita (menú Rematch/Later).
 * El contenido base del Grandeur Club (etapas de entrenamiento) es repetible por
 * diseño del juego original y se reporta aparte.
 *
 * Uso: node tools/audit_defeat_persistence.mjs
 */
import { readMarshalData } from "./lib/fire_ash_registry.mjs";
import { parseMap, parseEvent } from "../web/js/rmxp.js";

const dec = (value) => (value?.bytes ? Buffer.from(value.bytes).toString("utf8") : String(value ?? ""));
const battlePattern = /pbTrainerBattle|pbWildBattle|pbWildBattleCore|pbBattleStart|pbGhostBattle|pbBeginBattle/;

function argsOf(call, name) {
  const start = call.indexOf("(");
  const inner = call.slice(start + 1, call.lastIndexOf(")"));
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of inner) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) { parts.push(current.trim()); current = ""; } else current += char;
  }
  parts.push(current.trim());
  return parts;
}

function canLoseOf(scriptBlock) {
  if (/setBattleRule\("canLose"\)/.test(scriptBlock)) return true;
  for (const line of scriptBlock.split("\n")) {
    if (/pbTrainerBattle\(/.test(line)) {
      const args = argsOf(line.slice(line.indexOf("pbTrainerBattle")));
      if (args.length >= 6 && args[5] === "true") return true;
    }
    if (/pbWildBattle\(/.test(line)) {
      const args = argsOf(line.slice(line.indexOf("pbWildBattle")));
      if (args.length >= 5 && args[4] === "true") return true;
    }
  }
  return false;
}

function analyze(event) {
  const pages = event.pages;
  const battleScripts = pages.flatMap((page) => page.list).map((command) => {
    const code = command.getIvar("code");
    const params = command.getIvar("parameters");
    return code === 111 && params?.[0] === 12 ? dec(params[1]) : (code === 355 || code === 655 ? dec(params[0]) : "");
  }).filter((text) => battlePattern.test(text));
  if (!battleScripts.length) return null;

  const fullBlock = pages.flatMap((page) => page.list).map((command) => {
    const code = command.getIvar("code");
    const params = command.getIvar("parameters");
    return code === 111 && params?.[0] === 12 ? `IF ${dec(params[1])}` : (code === 355 || code === 655 ? dec(params[0]) : "");
  }).filter(Boolean).join("\n");

  let winGated = false;
  let locked = false;
  const sealedSwitches = new Set();
  pages.forEach((page) => {
    const texts = page.list.map((command) => {
      const code = command.getIvar("code");
      const params = command.getIvar("parameters");
      return { code, params, text: code === 111 && params?.[0] === 12 ? dec(params[1]) : (code === 355 || code === 655 ? dec(params[0]) : "") };
    });
    texts.forEach((entry, index) => {
      const isIfBattle = entry.code === 111 && entry.params?.[0] === 12 && battlePattern.test(entry.text);
      const isBattleDo = (entry.code === 355 || entry.code === 655) && battlePattern.test(entry.text);
      const winIfAfterCore = isBattleDo && texts.slice(index + 1, index + 6).some((next) => next.code === 111 && next.params?.[0] === 12 && /d==1 *\|\| *d==4|\$game_switches\[/.test(dec(next.params[1])));
      if (isIfBattle || winIfAfterCore) winGated = true;
    });
    texts.forEach((entry) => {
      if (entry.code === 123 && entry.params?.[1] === 0) locked = true;
      if (entry.code === 121 && entry.params?.[2] === 0) sealedSwitches.add(Number(entry.params?.[0]));
      if (entry.code === 355 || entry.code === 655) {
        const switchSet = entry.text.match(/\$game_switches\[(\d+)\] *= *(?:true|1)/);
        if (switchSet) sealedSwitches.add(Number(switchSet[1]));
      }
    });
  });
  if (sealedSwitches.size) locked = true;

  const postPage = pages.slice(1).some((page) =>
    page.condition.selfSwitch === "A" ||
    (page.condition.switch1 > 0 && (sealedSwitches.has(Number(page.condition.switch1)) || page.condition.switch1 >= 700)));
  const persistent = winGated && locked && postPage;

  const defeatedPages = pages.filter((page) => page.condition.selfSwitch === "A" || (page.condition.switch1 > 0 && page.condition.switch1 >= 700));
  const optionalRematch = defeatedPages.some((page) => page.list.some((command) => command.getIvar("code") === 102 || /revancha|Rematch|repetirse|repetir/i.test(dec(command.getIvar("parameters")?.[0]))));

  return {
    id: event.id,
    name: event.name,
    battles: battleScripts.length,
    persistent,
    winGated,
    optionalRematch,
    canLose: canLoseOf(fullBlock),
  };
}

const zones = [
  { name: "Torre Grandeur Club (141/151/214) — etapas de entrenamiento del juego base", maps: [141, 151, 214], vanilla: true },
  { name: "Isla Espejo (997-999)", maps: [997, 998, 999], wild: true },
  { name: "Bosque/Hypno + Horizontes (1000-1020)", maps: Array.from({ length: 21 }, (_, i) => 1000 + i) },
  { name: "Atlas Mil (1021-2020)", maps: Array.from({ length: 1000 }, (_, i) => 1021 + i) },
  { name: "Monte Silver — Emisiones (2021-2029)", maps: Array.from({ length: 9 }, (_, i) => 2021 + i) },
  { name: "Expansión Multiversal (2191-2194)", maps: [2191, 2192, 2193, 2194] },
];

let totalBattles = 0;
let totalEvents = 0;
let totalPersistent = 0;
let totalRematch = 0;
const anomalies = [];

console.log("Persistencia de derrotas — «si lo derrotaste una vez, queda derrotado\"\n");
for (const zone of zones) {
  const events = [];
  for (const mapId of zone.maps) {
    let map;
    try { map = parseMap(readMarshalData(`Map${mapId}.rxdata`)); } catch { continue; }
    for (const { obj } of map.events) {
      const result = analyze(parseEvent(obj));
      if (result) events.push({ mapId, ...result });
    }
  }
  const persistent = events.filter((entry) => entry.persistent);
  const rematches = events.filter((entry) => entry.optionalRematch);
  const noLose = events.filter((entry) => !entry.canLose);
  const repeats = events.filter((entry) => !entry.persistent);
  totalBattles += events.reduce((sum, entry) => sum + entry.battles, 0);
  totalEvents += events.length;
  totalPersistent += persistent.length;
  totalRematch += rematches.length;
  console.log(`${zone.name}`);
  console.log(`  ${events.length} eventos con batalla | derrota permanente: ${persistent.length} | revancha opcional (menú): ${rematches.length} | canLose: ${events.length - noLose.length}/${events.length}`);
  for (const entry of repeats) {
    // Los Pokégods son encuentros salvajes con tres Formas de Anomalía: se
    // repiten a propósito, igual que el resto de la fauna de la isla.
    const wild = zone.wild ?? false;
    const pokégod = wild && /PokeMod Pokégod:/.test(entry.name);
    const label = zone.vanilla ? "repetible por diseño del club base"
      : pokégod ? "salvaje repetible (Pokégod)" : "¡ANOMALÍA!";
    console.log(`  [${label}] Map${entry.mapId} ev${entry.id} ${JSON.stringify(entry.name)}`);
    if (!zone.vanilla && !pokégod) anomalies.push({ mapId: entry.mapId, ...entry });
  }
  for (const entry of noLose) {
    console.log(`  [sin canLose] Map${entry.mapId} ev${entry.id} ${JSON.stringify(entry.name)}`);
    if (!zone.vanilla) anomalies.push({ mapId: entry.mapId, ...entry, issue: "sin canLose" });
  }
}
console.log(`\nTOTAL: ${totalBattles} batallas en ${totalEvents} eventos; derrota permanente ${totalPersistent}/${totalEvents}; revanchas opcionales por menú: ${totalRematch}.`);
if (anomalies.length) {
  console.log(`ANOMALÍAS en contenido de la expansión: ${anomalies.length}`);
  process.exitCode = 1;
} else {
  console.log("Sin anomalías: todo el contenido de la expansión queda derrotado tras ganar (con reintentos tras perder) y las revanchas son opcionales.");
}
