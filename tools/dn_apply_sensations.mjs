#!/usr/bin/env node
/**
 * dn_apply_sensations.mjs — la «sensación» de cada mundo creepypasta (M2).
 *
 * Cada mundo debe sentirse distinto al entrar. Esta herramienta recorre **todas** las
 * transferencias de los mapas del ciclo y les inserta, justo antes, un cambio de tono de pantalla
 * con la paleta del mundo de destino:
 *
 *   EP01 White Hand          sepia sucio        (-30,-20,-20, 40)   papel y tinta
 *   EP02 Lost Silver         azul de cartucho   (-60,-20,+20, 30)   frío estático
 *   EP03 Snow on Mt. Silver  blanco cegador     (+30,+30,+40,  0)   silencio de nieve
 *   EP04 Hypno's Lullaby     violeta            (+40,-20,+60, 20)   sueño hipnótico
 *   EP05 Pokémon Black       negro total       (-100,-100,-100, 0)  ausencia
 *   EP06 King Unown          verde glitch       (+20,-40,+20, 80)   ruptura
 *   NEXO / HUB / LIGA        azules de código   (0,-20,+40,20) etc. archivo y tormenta
 *   resto (juego base)       neutro             (0,0,0,0)           al salir se limpia el tono
 *
 * Las líneas llevan la marca `dn:sensacion`, así que se refrescan sin duplicarse: primero se
 * borran las marcas anteriores de esa transferencia y después se escribe la correcta.
 *
 * Uso:
 *   node tools/dn_apply_sensations.mjs            # aplica/refresca
 *   node tools/dn_apply_sensations.mjs --verify
 *   node tools/dn_apply_sensations.mjs --dry-run
 */
import {
  BUILT, mapFile, readMap, writeMap, backup, script, txt, toneLine, isToneLine, readJson,
} from "./lib/dn_rmxp.mjs";

const argv = process.argv.slice(2);
const VERIFY = argv.includes("--verify");
const DRY = argv.includes("--dry-run");

const DURATION = 24;
const MARKER = "dn:sensacion";
const PHASE_MARKER = "dn:fase";
const TONES = {
  EP01: [-30, -20, -20, 40],
  EP02: [-60, -20, 20, 30],
  EP03: [30, 30, 40, 0],
  EP04: [40, -20, 60, 20],
  EP05: [-100, -100, -100, 0],
  EP06: [20, -40, 20, 80],
  W7: [-40, -20, -20, 20],   // rojo apagado: duelo y culpa
  W8: [-60, -50, -40, 10],   // tierra y penumbra: claustrofobia
  W9: [20, -20, 60, 30],     // violeta y ondas: el sonido duele
  NEXO: [0, -20, 40, 20],
  HUB: [0, -10, 30, 10],
  LIGA: [-40, -40, -40, 0],
  DEFAULT: [0, 0, 0, 0],
};

function episodeIndex() {
  const index = new Map(readJson(BUILT).maps.map((m) => [m.id, m.episode]));
  index.set(2030, "DEFAULT");           // Gruta de los Testigos (juego base): al salir, tono neutro
  return index;
}

function mapIds() {
  return [...new Set([2030, ...readJson(BUILT).maps.map((map) => map.id)])].sort((a, b) => a - b);
}

const PHASE_OFFSETS = {
  1: [0, 0, 0, 0],
  2: [-8, -8, -8, 0],
  3: [-24, -24, -24, 0],
  4: [-48, -32, -32, 0],
  5: [-64, -48, -48, 0],
  6: [-96, -64, -64, 40],
  7: [-128, -96, -96, 80],
};
const PHASE_RANGES = [
  [2041, 2056], [2057, 2072], [2073, 2087], [2088, 2103], [2104, 2119], [2120, 2135],
  [2136, 2140], [2143, 2158], [2159, 2174], [2175, 2190],
];

function phaseOf(mapId, index) {
  const key = index.get(Number(mapId));
  if (!key || key === "HUB" || key === "DEFAULT") return 0;
  if (key === "LIGA") return Number(mapId) === 2141 ? 5 : 7;
  const range = PHASE_RANGES.find(([from, to]) => Number(mapId) >= from && Number(mapId) <= to);
  if (!range) return 0;
  const [from, to] = range;
  const span = Math.max(1, to - from);
  return Math.max(1, Math.min(7, Math.round(((Number(mapId) - from) / span) * 6) + 1));
}

function toneOf(mapId, index) {
  const base = TONES[index.get(Number(mapId))] ?? TONES.DEFAULT;
  const phase = phaseOf(mapId, index);
  const offset = PHASE_OFFSETS[phase] ?? [0, 0, 0, 0];
  return base.map((value, channel) => Math.max(channel === 3 ? 0 : -255, Math.min(255, value + offset[channel])));
}
const toneText = (tone) => `Tone.new(${tone.join(", ")})`;
const phaseLine = (phase) => `begin; $game_variables[266] = ${phase}; rescue; end # ${PHASE_MARKER}`;

/** Transferencias (comando 201) de un mapa, agrupadas por lista para poder editar en orden inverso. */
function transfersOf(map) {
  const byList = new Map();
  for (const [, ev] of map.getIvar("@events")?.pairs ?? []) {
    for (const page of ev.getIvar("@pages") ?? []) {
      const list = page.getIvar("@list") ?? [];
      list.forEach((command, index) => {
        if (command.getIvar("@code") !== 201) return;
        if (!byList.has(list)) byList.set(list, []);
        byList.get(list).push(index);
      });
    }
  }
  return byList;
}

const scriptText = (command) => (command?.getIvar("@parameters") ?? []).map((p) => txt(p)).join("");
const isToneCommand = (command) => command?.getIvar("@code") === 355 && isToneLine(scriptText(command), MARKER);
const isPhaseCommand = (command) => command?.getIvar("@code") === 355 && scriptText(command).includes(`# ${PHASE_MARKER}`);
const isManagedCommand = (command) => isToneCommand(command) || isPhaseCommand(command);

function applyToMap(mapId, index) {
  const map = readMap(mapId);
  const byList = transfersOf(map);
  let inserted = 0, removed = 0;
  for (const [list, indices] of byList) {
    for (const at of [...indices].sort((a, b) => b - a)) {
      const destination = (list[at].getIvar("@parameters") ?? [])[1];
      const indent = list[at].getIvar("@indent") ?? 0;
      let head = at;
      while (head > 0 && isManagedCommand(list[head - 1])) { list.splice(head - 1, 1); head--; removed++; }
      list.splice(head, 0,
        script(phaseLine(phaseOf(destination, index)), indent),
        script(toneLine(toneOf(destination, index), DURATION, MARKER), indent));
      inserted++;
    }
  }
  if (inserted && !DRY) {
    backup(mapFile(mapId));
    writeMap(mapId, map);
  }
  return { inserted, removed };
}

function verify(index) {
  const failures = [];
  const maps = mapIds();
  let checked = 0, orphans = 0;
  for (const mapId of maps) {
    const map = readMap(mapId);
    for (const [, ev] of map.getIvar("@events")?.pairs ?? []) {
      for (const page of ev.getIvar("@pages") ?? []) {
        const list = page.getIvar("@list") ?? [];
        list.forEach((command, at) => {
          if (isToneCommand(command) && (list[at + 1]?.getIvar("@code") ?? 0) !== 201) {
            orphans++;
            failures.push(`Map${mapId}: línea de sensación sin transferencia detrás (comando ${at})`);
          }
          if (isPhaseCommand(command) && !isToneCommand(list[at + 1])) {
            orphans++;
            failures.push(`Map${mapId}: línea de fase sin tono de transferencia detrás (comando ${at})`);
          }
          if (command.getIvar("@code") !== 201) return;
          const destination = (list[at].getIvar("@parameters") ?? [])[1];
          const previous = list[at - 1];
          const phasePrevious = list[at - 2];
          if (!isToneCommand(previous)) {
            failures.push(`Map${mapId}: transferencia a ${destination} sin línea de sensación`);
            return;
          }
          if (!isPhaseCommand(phasePrevious) || !scriptText(phasePrevious).includes(`$game_variables[266] = ${phaseOf(destination, index)}`)) {
            failures.push(`Map${mapId}: transferencia a ${destination} sin su fase de corrupción`);
          }
          if (!scriptText(previous).includes(toneText(toneOf(destination, index)))) {
            failures.push(`Map${mapId}: transferencia a ${destination} con tono equivocado`);
          }
          checked++;
        });
      }
    }
  }
  console.log(`verificación de sensaciones (${checked} transferencias en ${maps.length} mapas${orphans ? `, ${orphans} huérfanas` : ""})`);
  for (const [episode, tone] of Object.entries(TONES)) console.log(`  ${episode.padEnd(8)} ${toneText(tone)}`);
  if (failures.length) { for (const f of failures.slice(0, 12)) console.error(`  FALLA: ${f}`); process.exit(1); }
  console.log("verificación de sensaciones OK");
}

const index = episodeIndex();
if (VERIFY) {
  verify(index);
} else {
  const maps = mapIds();
  let inserted = 0, removed = 0;
  for (const mapId of maps) {
    const result = applyToMap(mapId, index);
    inserted += result.inserted;
    removed += result.removed;
  }
  console.log(`${DRY ? "[dry-run] " : ""}sensaciones: ${inserted} transferencias marcadas (${removed} marcas viejas) en ${maps.length} mapas`);
}
