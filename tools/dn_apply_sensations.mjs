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

const toneOf = (mapId, index) => TONES[index.get(mapId)] ?? TONES.DEFAULT;
const toneText = (tone) => `Tone.new(${tone.join(", ")})`;

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

const isToneCommand = (command) =>
  command?.getIvar("@code") === 355 && isToneLine((command.getIvar("@parameters") ?? []).map((p) => txt(p)).join(""), MARKER);

function applyToMap(mapId, index) {
  const map = readMap(mapId);
  const byList = transfersOf(map);
  let inserted = 0, removed = 0;
  for (const [list, indices] of byList) {
    for (const at of [...indices].sort((a, b) => b - a)) {
      const destination = (list[at].getIvar("@parameters") ?? [])[1];
      const indent = list[at].getIvar("@indent") ?? 0;
      let head = at;
      while (head > 0 && isToneCommand(list[head - 1])) { list.splice(head - 1, 1); head--; removed++; }
      list.splice(head, 0, script(toneLine(toneOf(destination, index), DURATION, MARKER), indent));
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
  const maps = readJson(BUILT).maps.map((m) => m.id);
  let checked = 0, orphans = 0;
  for (const mapId of maps) {
    const map = readMap(mapId);
    for (const [, ev] of map.getIvar("@events")?.pairs ?? []) {
      for (const page of ev.getIvar("@pages") ?? []) {
        const list = page.getIvar("@list") ?? [];
        list.forEach((command, at) => {
          const text = (command.getIvar("@parameters") ?? []).map((p) => txt(p)).join("");
          const adjacentToTransfer = (list[at + 1]?.getIvar("@code") ?? 0) === 201 || (list[at - 1]?.getIvar("@code") ?? 0) === 201;
          if (isToneCommand(command) && !adjacentToTransfer) {
            orphans++;
            failures.push(`Map${mapId}: línea de sensación sin transferencia detrás (comando ${at})`);
          }
          if (command.getIvar("@code") !== 201) return;
          const destination = (command.getIvar("@parameters") ?? [])[1];
          const previous = list[at - 1];
          if (!isToneCommand(previous)) {
            failures.push(`Map${mapId}: transferencia a ${destination} sin línea de sensación`);
            return;
          }
          const previousText = (previous.getIvar("@parameters") ?? []).map((p) => txt(p)).join("");
          if (!previousText.includes(toneText(toneOf(destination, index)))) {
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
  const maps = readJson(BUILT).maps.map((m) => m.id);
  let inserted = 0, removed = 0;
  for (const mapId of maps) {
    const result = applyToMap(mapId, index);
    inserted += result.inserted;
    removed += result.removed;
  }
  console.log(`${DRY ? "[dry-run] " : ""}sensaciones: ${inserted} transferencias marcadas (${removed} marcas viejas) en ${maps.length} mapas`);
}
