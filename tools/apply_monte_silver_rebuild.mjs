#!/usr/bin/env node
/**
 * Instala/verifica la reconstrucción artesanal del Monte Silver:
 *
 *   - 2021  «Monte Silver — Falda»: mapa dibujado tile a tile con los
 *           materiales del propio Fire Ash (bosque nevado y montaña de la
 *           Ruta 216 / Monte Lanakila), con entrada real a la cueva
 *           (pbCaveEntrance), refugio de curación, placa y casa.
 *   - 2030  «Monte Silver — Gruta de los Testigos»: cueva de hielo NUEVA con
 *           las siete puertas custodiadas por Unown que deletrean TESTIGO.
 *           El contador del catálogo (v264) solo sube al SELLAR una emisión
 *           (victoria del jefe), nunca al entrar en el mapa.
 *   - 2022  «Monte Silver — Cumbre»: reconstruida sobre nieve real (la
 *           anterior era un tejado lleno de objetos Poké Ball), con escalera
 *           de hielo, placa inspeccionable, menú de puertas y música de Red.
 *
 * Se modifican: mapas 2021/2022, mapa nuevo 2030, MapInfos, map_metadata,
 * transferencias externas (mapa 48 y las 7 emisiones) y encounters.dat
 * (se añade 2030_0; 2021_0/2022_0 se conservan). Backups en
 * pokemon_fire_ash/PokeModBackups/monte_silver_rebuild_originals/.
 *
 * Uso:
 *   node tools/apply_monte_silver_rebuild.mjs
 *   node tools/apply_monte_silver_rebuild.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseEvent, parseMap } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";
import {
  TileCanvas, learnMaterial, paintMaterial, rectSet, stamp,
  reachableCells, passabilityOf, buildMapObject,
} from "./lib/map_painter.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "monte_silver_rebuild_originals");
const CATALOG_PATH = path.join(ROOT, "content", "monte_silver_rebuild.json");
const CATALOG = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
const MULTI = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
const MARKER = CATALOG.marker;

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
const S = (v) => RString.fromText(String(v));
const Sym = (v) => new RSymbol(String(v));
const iv = (o, n) => o?.getIvar?.(n);
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));
const pad3 = (n) => String(n).padStart(3, "0");
const mapFile = (id) => `Map${pad3(id)}.rxdata`;
const clone = (v) => marshalLoad(Buffer.from(marshalDump(v)));
const T = CATALOG.texts;
const cmdCode = (c) => Number(c.getIvar("code"));
const cmdParams = (c) => c.getIvar("parameters");

// ---------------------------------------------------------------- RMXP bits
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
}
function condition({ sw = 0, self = "" } = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
    ["@switch2_valid", false], ["@switch2_id", 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
  ]);
}
function graphic(charName = "", dir = 2, pattern = 1, tile = 0, opts = {}) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", tile], ["@character_name", S(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pattern], ["@opacity", opts.opacity ?? 255], ["@blend_type", 0],
  ]);
}
function moveRoute() { return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]); }
function page({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", cond], ["@graphic", gfx],
    ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
    ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
    ["@trigger", trigger], ["@list", list],
  ]);
}
function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}
function texts(lines, indent = 0) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return [cmd(101, [S("")], indent), ...arr.map((line) => cmd(401, [S(line)], indent))];
}
function script(line, indent = 0) { return cmd(355, [S(line)], indent); }
function transfer(map, x, y, dir = 2, indent = 0) { return cmd(201, [0, map, x, y, dir, 1], indent); }
function choices(labels, branches, indent = 0) {
  const list = [cmd(102, [labels.map(S), 2], indent)];
  branches.forEach((branch, i) => {
    list.push(cmd(402, [i, S(labels[i])], indent));
    list.push(...branch);
  });
  list.push(cmd(404, [], indent));
  return list;
}
function inspectEvent(id, name, x, y, lines, { tile = 0 } = {}) {
  return event(id, name, x, y, [page({ gfx: graphic("", 2, 1, tile), trigger: 2, list: [...texts(lines), cmd(0)] })]);
}
function itemBall(id, x, y, item) {
  return event(id, `${MARKER} Objeto`, x, y, [
    page({ gfx: graphic("Object ball"), list: [cmd(111, [12, S(`pbItemBall(:${item})`)]), cmd(123, [S("A"), 0], 1), cmd(411), cmd(412), cmd(0)] }),
    page({ cond: condition({ self: "A" }), gfx: graphic("", 2, 1, 0, { opacity: 0 }), through: true, list: [cmd(0)] }),
  ]);
}
function healerEvent(id, x, y) {
  const list = [
    ...texts(T.refugio),
    ...choices(["Sí", "No"], [
      [cmd(314, [0], 1), ...texts([T.refugioHealed], 1)],
      texts([T.refugioNo], 1),
    ]),
    cmd(0),
  ];
  return event(id, `${MARKER} Guardiana`, x, y, [page({ gfx: graphic("NPC 16"), list })]);
}
function exitEvent(id, name, x, y, targetMap, arrival, message) {
  return event(id, `${MARKER} ${name}`, x, y, [page({
    trigger: 1,
    list: [...texts([message]), transfer(targetMap, arrival[0], arrival[1]), cmd(0)],
  })]);
}
function caveEntranceEvent(id, x, y, targetMap, arrival, message) {
  return event(id, `${MARKER} Entrada de cueva`, x, y, [page({
    trigger: 1,
    list: [...texts([message]), script("pbCaveEntrance"), transfer(targetMap, arrival[0], arrival[1], 8), cmd(0)],
  })]);
}
function caveExitEvent(id, name, x, y, targetMap, arrival, message) {
  return event(id, `${MARKER} ${name}`, x, y, [page({
    trigger: 1,
    list: [...texts([message]), script("pbCaveExit"), transfer(targetMap, arrival[0], arrival[1], 2), cmd(0)],
  })]);
}
function unownDoorEvent(id, zone, index, x, y, targetMap, arrival) {
  const openList = [
    ...texts(T.doorIntro),
    ...texts([CATALOG.unownLetters[index]]),
    ...choices(T.doorChoice, [[transfer(targetMap, arrival[0], arrival[1], 2, 1)], []]),
    cmd(0),
  ];
  const sealed = [...texts(T.doorSealed), cmd(0)];
  return event(id, `${MARKER} Puerta ${index + 1} — ${CATALOG.unownLetters[index]}`, x, y, [
    page({ gfx: graphic(CATALOG.unownSprites[index], 2), list: openList }),
    page({ cond: condition({ sw: 768 + zone }), gfx: graphic(CATALOG.unownSprites[index], 2), list: sealed }),
  ]);
}

// ------------------------------------------------------- materiales aprendidos
function range(a, b) { const s = new Set(); for (let i = a; i <= b; i++) s.add(i); return s; }
const MATERIALS = {
  forest: learnMaterial({
    name: "bosque nevado",
    tiles: new Set([4480, 4481, 4484, 4485, 4488, 4489, 4492, 4493, 4496, 4497, 4500, 4501]),
    sources: [620, 622, 924, 625, 621, 623, 624],
  }),
  mountain: learnMaterial({
    name: "montaña nevada",
    tiles: new Set([...range(1248, 1273)].filter((t) => t !== 1262 && t !== 1264)),
    sources: [620, 622, 924, 625],
  }),
  caveRock: learnMaterial({
    name: "roca de cueva helada",
    tiles: new Set([...range(1296, 3014)].filter((t) => t <= 1314 && t !== 1306 && t !== 1349)),
    sources: [939, 979, 846, 847, 848],
    outsideIsMember: false,
  }),
};
const missingLog = [];
function paint(canvas, region, rules, opts) {
  const missing = paintMaterial(canvas, region, rules, opts);
  if (missing.length) missingLog.push({ material: rules.name, count: missing.length, sample: missing.slice(0, 8) });
  return missing;
}

// ------------------------------------------------------ rejillas de clasificación
function makeGrid(w, h, fill) { return Array.from({ length: h }, () => Array(w).fill(fill)); }
function carve(grid, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (j >= 0 && j < grid.length && i >= 0 && i < grid[0].length) grid[j][i] = ch;
  }
}
function gridRegions(grid) {
  const out = new Map();
  grid.forEach((row, y) => row.forEach((ch, x) => {
    if (!out.has(ch)) out.set(ch, new Set());
    out.get(ch).add(`${x},${y}`);
  }));
  return out;
}
function assertCell(grid, x, y, want, label) {
  if (grid[y]?.[x] !== want) throw new Error(`${label}: (${x},${y}) esperaba '${want}' y es '${grid[y]?.[x]}'`);
}

// ----------------------------------------------------------------- MAPA 2021
const FALDA = { W: 44, H: 41 };
const FALDA_POS = {
  labDoor: [6, 35],            // puerta de la cabaña (abajo)
  labArrival: [6, 36],         // delante de la puerta (corredor)
  cave: [16, 15],              // hoyo de cueva
  caveArrival: [15, 15],       // saliente de la gruta (junto al hoyo)
  routeSign: [37, 23],         // verja a la Ruta 216
  archivist: [29, 8],
  plaqueFalda: [31, 6],
  healer: [34, 6],
  montanero: [26, 38],
  plaqueCave: [14, 15],
  items: [[30, 9], [38, 13], [30, 37]],
};
function faldaGrid() {
  const g = makeGrid(FALDA.W, FALDA.H, "T");
  // montañas
  carve(g, 2, 2, 16, 12, "M");      // macizo oeste-norte
  carve(g, 14, 11, 6, 3, "M");      // respaldo de la cueva
  carve(g, 2, 16, 3, 8, "M");       // península oeste
  carve(g, 4, 27, 7, 6, "M");       // macizo suroeste
  // corredores (mandan sobre la montaña)
  carve(g, 8, 6, 3, 32, ".");       // espina vertical
  carve(g, 11, 7, 16, 3, ".");      // espina -> plaza refugio
  carve(g, 26, 3, 12, 8, ".");      // plaza del refugio
  carve(g, 37, 10, 4, 16, ".");     // borde este
  carve(g, 36, 23, 5, 3, ".");      // tramo de la verja
  carve(g, 4, 14, 13, 3, ".");      // ramal de la cueva
  carve(g, 13, 15, 3, 4, ".");      // bajada al prado
  carve(g, 13, 17, 10, 10, ".");    // prado central
  carve(g, 4, 36, 8, 2, ".");       // corredor del laboratorio
  carve(g, 10, 34, 15, 3, ".");     // espina -> plaza sur
  carve(g, 24, 33, 12, 7, ".");     // plaza sur (casa del montañero)
  return g;
}
function buildFalda() {
  const g = faldaGrid();
  assertCell(g, FALDA_POS.labDoor[0], FALDA_POS.labDoor[1], "T", "puerta lab (puede ser T: se pisa con la casa)");
  assertCell(g, FALDA_POS.cave[0], FALDA_POS.cave[1], ".", "hoyo de cueva");
  assertCell(g, FALDA_POS.caveArrival[0], FALDA_POS.caveArrival[1], ".", "llegada de la gruta");
  assertCell(g, FALDA_POS.labArrival[0], FALDA_POS.labArrival[1], ".", "llegada del laboratorio");
  assertCell(g, FALDA_POS.routeSign[0], FALDA_POS.routeSign[1], ".", "verja");
  assertCell(g, FALDA_POS.archivist[0], FALDA_POS.archivist[1], ".", "archivero");
  assertCell(g, FALDA_POS.healer[0], FALDA_POS.healer[1], ".", "guardiana");
  assertCell(g, FALDA_POS.montanero[0], FALDA_POS.montanero[1], ".", "montañero");
  assertCell(g, FALDA_POS.plaqueCave[0], FALDA_POS.plaqueCave[1], ".", "placa cueva");
  for (const [x, y] of FALDA_POS.items) assertCell(g, x, y, ".", `objeto ${x},${y}`);
  const cv = new TileCanvas(FALDA.W, FALDA.H, 1);
  cv.fillAll(0, 4457);
  const R = gridRegions(g);
  paint(cv, R.get("T"), MATERIALS.forest, { outsideIsMember: true, overhang: true });
  paint(cv, R.get("M"), MATERIALS.mountain, { outsideIsMember: true, overhang: true });
  // hoyo de cueva (montón+agujero de la Ruta 216, celdas de montaña)
  stamp(cv, 924, 19, 34, 1, 3, 16, 14, { layers: [1] });
  // cabaña del laboratorio (abajo), casa del montañero, verja y refugio
  stamp(cv, 620, 19, 13, 4, 3, 5, 33, { layers: [0, 1, 2] }); // puerta real en (6,35)
  stamp(cv, 620, 19, 13, 4, 3, 25, 35, { layers: [0, 1, 2] }); // casa sur
  stamp(cv, 620, 19, 13, 4, 3, 36, 21, { layers: [0, 1, 2] }); // casa de la verja
  stamp(cv, 620, 19, 13, 4, 3, 32, 3, { layers: [0, 1, 2] }); // refugio
  // rocas sueltas por la nieve (decoración transitable, como en la Ruta 217)
  for (const [x, y, t] of [[17, 19, 1308], [21, 23, 1342], [15, 25, 1300], [38, 16, 1301],
    [18, 34, 1309], [33, 38, 1340], [26, 7, 1300]]) cv.set(x, y, 2, t);
  return { cv, g };
}

// ----------------------------------------------------------------- MAPA 2022
const CUMBRE = { W: 32, H: 24 };
const CUMBRE_POS = {
  arrival: [15, 16],   // llegada desde la gruta (al lado de la boca)
  stairsDown: [16, 15], // boca de cueva (tocar el agujero = bajar)
  red: [14, 10],
  doors: [24, 8],
  plaque: [5, 7],
  items: [[5, 9], [26, 17]],
};
function cumbreGrid() {
  const g = makeGrid(CUMBRE.W, CUMBRE.H, "T");
  carve(g, 3, 3, 26, 17, ".");   // meseta nevada
  g[15][19] = "T"; g[15][20] = "T"; g[14][20] = "T";  // arboleda baja
  return g;
}
function buildCumbre() {
  const g = cumbreGrid();
  for (const [label, pos] of [["llegada", CUMBRE_POS.arrival], ["escalera", CUMBRE_POS.stairsDown], ["RED", CUMBRE_POS.red], ["puertas", CUMBRE_POS.doors], ["placa", CUMBRE_POS.plaque]])
    assertCell(g, pos[0], pos[1], ".", label);
  for (const [x, y] of CUMBRE_POS.items) assertCell(g, x, y, ".", `objeto ${x},${y}`);
  const cv = new TileCanvas(CUMBRE.W, CUMBRE.H, 1);
  cv.fillAll(0, 4457);
  const R = gridRegions(g);
  paint(cv, R.get("T"), MATERIALS.forest, { outsideIsMember: true, overhang: true });
  // boca de cueva hacia la gruta (agujero con anillo de rocas, igual que el juego base)
  stamp(cv, 924, 18, 35, 3, 1, 15, 15, { layers: [1] });  // roca | agujero | roca
  // placa de madera con poste (casa pequeña + cartel)
  stamp(cv, 620, 19, 13, 4, 3, 5, 4, { layers: [0, 1, 2] });
  // rocas sueltas y arboleda baja para que la meseta respire
  for (const [x, y, t] of [[20, 12, 1308], [9, 15, 1342], [24, 14, 1300], [8, 8, 1309], [21, 16, 1342]]) cv.set(x, y, 2, t);
  return { cv, g };
}

// ----------------------------------------------------------------- MAPA 2030
const GRUTA = { W: 68, H: 46 };
const GRUTA_POS = {
  exitFalda: [6, 8],       // pie de la escalera oeste (sale a la falda)
  faldaArrival: [6, 9],    // llega desde la falda
  toCumbre: [60, 8],       // pie de la escalera este (sube a la cumbre)
  cumbreArrival: [60, 9],  // llega desde la cumbre
  healer: [4, 6],
  archivist: [10, 6],
  plaque: [12, 6],
  items: [[5, 35], [58, 10], [50, 40]],
};
const GRUTA_DOORS = [[16, 6], [34, 6], [17, 20], [28, 20], [44, 20], [30, 40], [60, 30]];
const EMISION_EXIT = [36, 20];
function grutaGrid() {
  const g = makeGrid(GRUTA.W, GRUTA.H, "#");
  // salas y galerías (suelo blanco: sin tiles encima del 1343)
  carve(g, 3, 4, 10, 5, ".");        // vestíbulo
  carve(g, 12, 5, 44, 3, ".");       // galería norte
  carve(g, 56, 5, 10, 17, ".");      // galería este-alta
  carve(g, 12, 19, 44, 3, ".");      // galería media
  carve(g, 4, 8, 10, 32, ".");       // espina oeste
  carve(g, 12, 38, 50, 5, ".");      // galería sur
  carve(g, 56, 22, 10, 20, ".");     // galería este-baja
  // rampas de hielo (se pintan aparte)
  carve(g, 20, 8, 4, 11, "I");       // norte -> media
  carve(g, 36, 8, 4, 11, "I");
  carve(g, 20, 22, 4, 16, "I");      // media -> sur
  carve(g, 36, 22, 4, 16, "I");
  return g;
}
function buildGruta() {
  const g = grutaGrid();
  assertCell(g, GRUTA_POS.exitFalda[0], GRUTA_POS.exitFalda[1], ".", "salida falda");
  assertCell(g, GRUTA_POS.toCumbre[0], GRUTA_POS.toCumbre[1], ".", "escalera cumbre");
  for (const [label, pos] of [["guardiana", GRUTA_POS.healer], ["archivero", GRUTA_POS.archivist], ["placa", GRUTA_POS.plaque], ["salida emisión", EMISION_EXIT]])
    assertCell(g, pos[0], pos[1], ".", label);
  GRUTA_DOORS.forEach(([x, y], i) => assertCell(g, x, y, ".", `puerta ${i + 1}`));
  for (const [x, y] of GRUTA_POS.items) assertCell(g, x, y, ".", `objeto ${x},${y}`);
  const cv = new TileCanvas(GRUTA.W, GRUTA.H, 6);
  cv.fillAll(0, 1343);
  const R = gridRegions(g);
  paint(cv, R.get("#"), MATERIALS.caveRock, { outsideIsMember: false, overhang: false });
  // hielo: rampas (pasable, terreno 12) con grietas decorativas que bloquean
  for (const cell of R.get("I")) {
    const [x, y] = cell.split(",").map(Number);
    cv.set(x, y, 1, 1328); cv.set(x, y, 2, 0);
  }
  for (const [x, y] of [[21, 12], [37, 13], [22, 30], [37, 33]]) {
    if (g[y][x] === "I") { cv.set(x, y, 2, 1306); }  // grieta = agujero (bloquea)
  }
  // escalera oeste (salida a la falda) y este (subida a la cumbre)
  stamp(cv, 939, 30, 14, 1, 4, 6, 4, { layers: [2] });     // 1306,530,530,1306 en x=6,y=4..7
  stamp(cv, 939, 30, 14, 1, 4, 60, 4, { layers: [2] });    // y=4..7 en x=60
  return { cv, g };
}

// ------------------------------------------------------------- eventos nuevos
function buildFaldaEvents(arrivals) {
  const evs = [];
  let id = 1;
  evs.push(exitEvent(id++, "Bajar al laboratorio", FALDA_POS.labDoor[0], FALDA_POS.labDoor[1],
    MULTI.returnToLab.map, arrivals.lab, T.toLab));
  evs.push(caveEntranceEvent(id++, FALDA_POS.cave[0], FALDA_POS.cave[1], 2030, arrivals.gruta, T.toGruta));
  evs.push(inspectEvent(id++, `${MARKER} Verja`, FALDA_POS.routeSign[0], FALDA_POS.routeSign[1],
    ["La verja da a la Ruta 216, pero el temporal tapó el paso.", "Hacia el este la nieve no se detiene. Ahora mismo no se puede seguir."], { tile: 1343 }));
  evs.push(event(id++, `${MARKER} Archivero`, FALDA_POS.archivist[0], FALDA_POS.archivist[1], [
    page({ gfx: graphic("trchar028"), list: [...texts(T.archivero), cmd(0)] }),
    page({ cond: condition({ sw: 768 }), gfx: graphic("trchar028"), list: [...texts(T.archiveroSealed), cmd(0)] }),
  ]));
  evs.push(inspectEvent(id++, `${MARKER} Placa`, FALDA_POS.plaqueFalda[0], FALDA_POS.plaqueFalda[1], T.plaqueFalda, { tile: 1343 }));
  evs.push(healerEvent(id++, FALDA_POS.healer[0], FALDA_POS.healer[1]));
  evs.push(event(id++, `${MARKER} Montañero`, FALDA_POS.montanero[0], FALDA_POS.montanero[1], [
    page({ gfx: graphic("trainer_HIKER"), list: [...texts(T.montanero), cmd(0)] }),
  ]));
  evs.push(inspectEvent(id++, `${MARKER} Placa de la cueva`, FALDA_POS.plaqueCave[0], FALDA_POS.plaqueCave[1],
    ["GRUTA DE LOS TESTIGOS — Dentro duermen las siete puertas de niebla."], { tile: 1343 }));
  for (const [item, x, y] of CATALOG.items.falda) evs.push(itemBall(id++, x, y, item));
  return evs;
}
function buildRedPages() {
  const boss = MULTI.champion;
  const call = `pbTrainerBattle(:${boss.type},"${boss.name}",nil,false,0,true)`;
  const first = [
    ...texts(boss.intro),
    script(`pbTrainerIntro(:${boss.type})`),
    cmd(111, [12, S(call)]),
    ...texts([boss.win, "El campeón deja una prenda para el camino."], 1),
    script(`pbReceiveItem(:${boss.reward})`, 1),
    cmd(121, [MULTI.sealSwitchBase + 7, MULTI.sealSwitchBase + 7, 0], 1),
    script(`$game_variables[${MULTI.counterVariable}]=$game_variables[${MULTI.counterVariable}].to_i+1`, 1),
    cmd(123, [S("A"), 0], 1),
    cmd(411),
    ...texts([boss.loss], 1),
    cmd(412),
    script("pbTrainerEnd"),
    cmd(0),
  ];
  const rematch = [
    ...texts(boss.rematch),
    ...choices(["Revancha", "Luego"], [
      [script(`pbTrainerIntro(:${boss.type})`, 1), cmd(111, [12, S(call)], 1), ...texts([boss.win], 2), cmd(411, [], 2), ...texts([boss.loss], 2), cmd(412, [], 2), script("pbTrainerEnd", 1)],
      [],
    ]),
    cmd(0),
  ];
  return [
    page({ gfx: graphic(boss.sprite), list: first }),
    page({ cond: condition({ self: "A" }), gfx: graphic(boss.sprite), list: rematch }),
  ];
}
function buildCumbreEvents(arrivals, emissionArrivals) {
  const evs = [];
  let id = 1;
  evs.push(caveExitEvent(id++, "Bajar a la gruta", CUMBRE_POS.stairsDown[0], CUMBRE_POS.stairsDown[1],
    2030, arrivals.grutaCumbre, T.cumbreDown));
  const zones = MULTI.bosses.map((boss) => ({ label: boss.label, map: boss.mapId }));
  const labels = [...zones.map((z) => z.label), "No"];
  const menuList = [...texts(["Las siete puertas de niebla respiran al unísono.", `¿Qué emisión quieres visitar?\\ch[1,${labels.length},${labels.join(",")}]`])];
  zones.forEach((z, i) => {
    menuList.push(cmd(111, [1, 1, 0, i, 0]));
    menuList.push(transfer(z.map, emissionArrivals[z.map][0], emissionArrivals[z.map][1], 2, 1));
    menuList.push(cmd(0, [], 1), cmd(412));
  });
  menuList.push(cmd(0));
  evs.push(event(id++, `${MARKER} Puertas de niebla`, CUMBRE_POS.doors[0], CUMBRE_POS.doors[1], [
    page({ gfx: graphic("Object ball special"), list: menuList }),
  ]));
  evs.push(event(id++, `${MARKER} Jefe RED`, CUMBRE_POS.red[0], CUMBRE_POS.red[1], buildRedPages()));
  evs.push(inspectEvent(id++, `${MARKER} Placa`, CUMBRE_POS.plaque[0], CUMBRE_POS.plaque[1], T.plaqueCumbre, { tile: 1343 }));
  evs.push(inspectEvent(id++, `${MARKER} Estación`, 6, 6,
    ["Estación meteorológica del Monte Silver.", "Un papel en la puerta: «Cerrada por temporal. La cumbre no da tregua»."], { tile: 2065 }));
  for (const [item, x, y] of CATALOG.items.cumbre) evs.push(itemBall(id++, x, y, item));
  return evs;
}
function buildGrutaEvents(arrivals, emissionArrivals) {
  const evs = [];
  let id = 1;
  evs.push(caveExitEvent(id++, "Salir a la falda", GRUTA_POS.exitFalda[0], GRUTA_POS.exitFalda[1],
    2021, FALDA_POS.caveArrival, "La luz de la nieve entra por la boca de la cueva."));
  evs.push(caveExitEvent(id++, "Subir a la cumbre", GRUTA_POS.toCumbre[0], GRUTA_POS.toCumbre[1],
    2022, CUMBRE_POS.arrival, T.toCumbre));
  MULTI.bosses.forEach((boss, i) => {
    const [x, y] = GRUTA_DOORS[i];
    evs.push(unownDoorEvent(id++, boss.zone, i, x, y, boss.mapId, emissionArrivals[boss.mapId]));
  });
  evs.push(healerEvent(id++, GRUTA_POS.healer[0], GRUTA_POS.healer[1]));
  evs.push(inspectEvent(id++, `${MARKER} Placa`, GRUTA_POS.plaque[0], GRUTA_POS.plaque[1], T.plaqueGruta, { tile: 1343 }));
  evs.push(event(id++, `${MARKER} Archivero`, GRUTA_POS.archivist[0], GRUTA_POS.archivist[1], [
    page({ gfx: graphic("trchar028"), list: [...texts(T.archivero), cmd(0)] }),
    page({ cond: condition({ sw: 768 }), gfx: graphic("trchar028"), list: [...texts(T.archiveroSealed), cmd(0)] }),
  ]));
  for (const [item, x, y] of CATALOG.items.gruta) evs.push(itemBall(id++, x, y, item));
  return evs;
}
function addEvents(mapObj, events) {
  const hash = iv(mapObj, "events");
  hash.pairs = [];
  for (const ev of events) hash.pairs.push([iv(ev, "id"), ev]);
}

// ------------------------------------------------------------- instalación
const MAP_IDS = [2021, 2022, 2030];
function backup() {
  fs.mkdirSync(BACKUP, { recursive: true });
  const files = ["MapInfos.rxdata", "map_metadata.dat", "encounters.dat", "Map048.rxdata", ...MAP_IDS.map(mapFile), ...MULTI.bosses.map((b) => mapFile(b.mapId))];
  for (const file of files) {
    const src = path.join(DATA, file);
    const dst = path.join(BACKUP, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"),
    "Copias anteriores a la reconstrucción artesanal del Monte Silver. No contienen partidas.\nPara revertir, copia estos archivos sobre pokemon_fire_ash/Data/.\n");
}
function findArrival(mapId, near) {
  const parsed = parseMap(read(mapFile(mapId)));
  const pass = passabilityOf(parsed, parsed.tilesetId);
  let best = null; let bestD = Infinity;
  for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) {
    if (!pass.passable(x, y, 8)) continue;
    const d = Math.abs(x - near[0]) + Math.abs(y - near[1]);
    if (d < bestD) { bestD = d; best = [x, y]; }
  }
  if (!best) throw new Error(`Sin celda disponible en ${mapId} cerca de ${near}`);
  return best;
}
function installMetadataSpec(spec) {
  const metadata = read("map_metadata.dat");
  const source = metadata.pairs.find(([id]) => Number(id) === spec.metadataFrom)?.[1];
  if (!source) throw new Error(`Sin metadatos para ${spec.metadataFrom}`);
  const battleFrom = metadata.pairs.find(([id]) => Number(id) === CATALOG.battleMusicFrom)?.[1];
  metadata.pairs = metadata.pairs.filter(([id]) => Number(id) !== spec.mapId);
  const meta = clone(source);
  meta.setIvar("id", spec.mapId);
  meta.setIvar("town_map_position", [...CATALOG.townMapPosition]);
  meta.setIvar("weather", spec.weather ? [Sym(spec.weather[0]), spec.weather[1]] : null);
  meta.setIvar("map_BGM", null);
  if (battleFrom) {
    for (const k of ["wild_battle_BGM", "trainer_battle_BGM", "wild_victory_ME", "trainer_victory_ME", "wild_capture_ME"]) {
      const v = battleFrom.getIvar(k);
      if (v !== undefined) meta.setIvar(k, v instanceof RObject ? clone(v) : v);
    }
  }
  metadata.pairs.push([spec.mapId, meta]);
  write("map_metadata.dat", metadata);
}
function installMapInfos() {
  const infos = read("MapInfos.rxdata");
  infos.pairs = infos.pairs.filter(([key]) => !MAP_IDS.includes(Number(key)));
  const specs = [
    { mapId: 2021, title: CATALOG.maps.falda.title, parent: 48, order: 1100 },
    { mapId: 2030, title: CATALOG.maps.gruta.title, parent: 2021, order: 1101 },
    { mapId: 2022, title: CATALOG.maps.cumbre.title, parent: 2030, order: 1102 },
  ];
  for (const spec of specs) {
    infos.pairs.push([spec.mapId, new RObject("RPG::MapInfo", [
      ["@scroll_x", 512], ["@name", S(spec.title)], ["@expanded", false],
      ["@order", spec.order], ["@scroll_y", 320], ["@parent_id", spec.parent],
    ])]);
  }
  write("MapInfos.rxdata", infos);
}
function retargetTransfers(arrivals) {
  const hub = read(mapFile(48));
  let hubFixed = 0;
  for (const [, ev] of iv(hub, "events").pairs) {
    for (const page of iv(ev, "pages")) for (const c of iv(page, "list")) {
      if (cmdCode(c) !== 201) continue;
      const p = cmdParams(c);
      if (Number(p[1]) === 2021) { p[2] = arrivals.labArrival[0]; p[3] = arrivals.labArrival[1]; hubFixed++; }
    }
  }
  if (!hubFixed) throw new Error("No se encontró la transferencia del hub (48) a 2021");
  write(mapFile(48), hub);
  for (const boss of MULTI.bosses) {
    const mapObj = read(mapFile(boss.mapId));
    let fixed = 0;
    for (const [, ev] of iv(mapObj, "events").pairs) {
      const evName = txt(iv(ev, "name"));
      if (!evName.includes("Volver a la cumbre") && !evName.includes("Volver a la gruta")) continue;
      for (const page of iv(ev, "pages")) for (const c of iv(page, "list")) {
        if (cmdCode(c) !== 201) continue;
        const p = cmdParams(c);
        p[1] = 2030; p[2] = arrivals.emisionExit[0]; p[3] = arrivals.emisionExit[1]; p[4] = 2; fixed++;
      }
      ev.setIvar("@name", S(`${MARKER} Volver a la gruta`));
      fixed = fixed || 0;
    }
    if (!fixed) console.warn(`Aviso: ${boss.mapId} sin transferencia de vuelta`);
    write(mapFile(boss.mapId), mapObj);
  }
}
function installEncounters() {
  const encounters = read("encounters.dat");
  encounters.pairs = encounters.pairs.filter(([key]) => (key.name ?? String(key)) !== "2030_0");
  const zone = CATALOG.wildGruta;
  const stepChances = new RHash(Object.entries(zone.step_chances).map(([t, v]) => [Sym(t), v]));
  const types = new RHash(Object.entries(zone.types).map(([t, slots]) => [Sym(t), slots.map(([w, sp, min, max]) => [w, Sym(sp), min, max])]));
  encounters.pairs.push([Sym("2030_0"), new RObject("GameData::Encounter", [
    ["@id", Sym("2030_0")], ["@map", 2030], ["@version", 0],
    ["@step_chances", stepChances], ["@types", types],
  ])]);
  write("encounters.dat", encounters);
}
function persistCatalog(arrivals) {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  catalog.arrivals = {
    lab: arrivals.lab, labArrival: arrivals.labArrival, gruta: GRUTA_POS.faldaArrival,
    grutaExit: GRUTA_POS.exitFalda, grutaCumbre: GRUTA_POS.cumbreArrival,
    cumbre: CUMBRE_POS.arrival, emisionExit: EMISION_EXIT,
  };
  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
}
function install() {
  backup();
  const emissionArrivals = {};
  for (const boss of MULTI.bosses) emissionArrivals[boss.mapId] = MULTI.maps.find((m) => m.mapId === boss.mapId).arrival;
  const arrivals = {
    lab: findArrival(MULTI.returnToLab.map, MULTI.returnToLab.near),
    labArrival: FALDA_POS.labArrival,
    gruta: GRUTA_POS.faldaArrival,
    grutaCumbre: GRUTA_POS.cumbreArrival,
    emisionExit: EMISION_EXIT,
    emissionArrivals,
  };
  const falda = buildFalda();
  const faldaMap = buildMapObject(falda.cv, { bgm: CATALOG.maps.falda.bgm });
  addEvents(faldaMap, buildFaldaEvents(arrivals));
  write(mapFile(2021), faldaMap);
  const gruta = buildGruta();
  const grutaMap = buildMapObject(gruta.cv, { bgm: CATALOG.maps.gruta.bgm });
  addEvents(grutaMap, buildGrutaEvents(arrivals, emissionArrivals));
  write(mapFile(2030), grutaMap);
  const cumbre = buildCumbre();
  const cumbreMap = buildMapObject(cumbre.cv, { bgm: CATALOG.maps.cumbre.bgm });
  addEvents(cumbreMap, buildCumbreEvents(arrivals, emissionArrivals));
  write(mapFile(2022), cumbreMap);
  installMapInfos();
  installMetadataSpec(CATALOG.maps.falda);
  installMetadataSpec(CATALOG.maps.gruta);
  installMetadataSpec(CATALOG.maps.cumbre);
  retargetTransfers(arrivals);
  installEncounters();
  persistCatalog(arrivals);
  console.log(`Monte Silver reconstruido: 2021 falda (${FALDA.W}x${FALDA.H}), 2030 gruta (${GRUTA.W}x${GRUTA.H}), 2022 cumbre (${CUMBRE.W}x${CUMBRE.H}).`);
  console.log(missingLog.length ? `Avisos de pintado: ${JSON.stringify(missingLog)}` : "Todas las celdas encontraron regla de borde aprendida: 0 avisos.");
}

// -------------------------------------------------------------- verificación
function parseEvents(id) {
  const parsed = parseMap(read(mapFile(id)));
  return { parsed, events: parsed.events.map(({ obj }) => parseEvent(obj)) };
}
function transferParams(evObj, nameIncludes) {
  for (const p of evObj.pages) for (const c of p.list) {
    if (cmdCode(c) === 201 && (!nameIncludes || evObj.name.includes(nameIncludes))) return cmdParams(c);
  }
  return null;
}
function verify() {
  const errors = [];
  const ok = (cond, msg) => { if (cond) return; errors.push(msg); };
  const infos = read("MapInfos.rxdata").pairs;
  const expectedTitles = { 2021: CATALOG.maps.falda.title, 2022: CATALOG.maps.cumbre.title, 2030: CATALOG.maps.gruta.title };
  for (const [id, title] of Object.entries(expectedTitles)) {
    const info = infos.find(([k]) => Number(k) === Number(id))?.[1];
    ok(info && txt(iv(info, "name")) === title, `MapInfos: falta ${title}`);
  }
  const metadata = read("map_metadata.dat").pairs;
  for (const id of MAP_IDS) ok(metadata.some(([k]) => Number(k) === id), `map_metadata: falta ${id}`);
  const falda = parseEvents(2021);
  const gruta = parseEvents(2030);
  const cumbre = parseEvents(2022);
  ok(falda.events.filter((e) => e.name.startsWith(MARKER)).length >= 9, "2021: eventos propios insuficientes");
  ok(gruta.events.filter((e) => e.name.startsWith(MARKER)).length >= 12, "2030: eventos propios insuficientes");
  ok(cumbre.events.filter((e) => e.name.startsWith(MARKER)).length >= 5, "2022: eventos propios insuficientes");

  // recorridos a pie (solo tiles: los NPC no bloquean el chequeo)
  const passFalda = passabilityOf(falda.parsed, falda.parsed.tilesetId);
  const reachFalda = reachableCells(passFalda, FALDA_POS.labDoor, { blocked: new Set() });
  for (const [label, cell] of [["cueva", FALDA_POS.cave], ["guardiana", FALDA_POS.healer], ["montañero", FALDA_POS.montanero], ["verja", FALDA_POS.routeSign], ["archivero", FALDA_POS.archivist]]) {
    ok(reachFalda.has(`${cell[0]},${cell[1]}`), `2021: ${label} no alcanzable desde la puerta del lab`);
  }
  ok(passFalda.passable(6, 35, 8) && passFalda.passable(6, 35, 2), "2021: la puerta de la casa no es transitable");
  const passGruta = passabilityOf(gruta.parsed, gruta.parsed.tilesetId);
  const reachGruta = reachableCells(passGruta, GRUTA_POS.faldaArrival, { blocked: new Set() });
  GRUTA_DOORS.forEach(([x, y], i) => ok(reachGruta.has(`${x},${y}`), `2030: la puerta ${i + 1} (${CATALOG.unownLetters[i]}) no es alcanzable`));
  ok(reachGruta.has(`${GRUTA_POS.toCumbre[0]},${GRUTA_POS.toCumbre[1]}`), "2030: escalera a la cumbre no alcanzable");
  const exitToFalda = gruta.events.find((e) => e.name.includes("Salir a la falda"));
  const exitToCumbre = gruta.events.find((e) => e.name.includes("Subir a la cumbre"));
  const pExit = exitToFalda && exitToFalda.pages[0].list.find((c) => cmdCode(c) === 201);
  const pUp = exitToCumbre && exitToCumbre.pages[0].list.find((c) => cmdCode(c) === 201);
  ok(pExit && Number(cmdParams(pExit)[1]) === 2021 && Number(cmdParams(pExit)[2]) === FALDA_POS.caveArrival[0] && Number(cmdParams(pExit)[3]) === FALDA_POS.caveArrival[1], "2030: la salida oeste no va al hoyo de la falda");
  ok(pUp && Number(cmdParams(pUp)[1]) === 2022 && Number(cmdParams(pUp)[2]) === CUMBRE_POS.arrival[0] && Number(cmdParams(pUp)[3]) === CUMBRE_POS.arrival[1], "2030: la escalera este no sube a la cumbre");
  const grutaEntrance = falda.events.find((e) => e.name.includes("Entrada de cueva"));
  const pIn = grutaEntrance && grutaEntrance.pages[0].list.find((c) => cmdCode(c) === 201);
  ok(pIn && Number(cmdParams(pIn)[1]) === 2030 && Number(cmdParams(pIn)[2]) === GRUTA_POS.faldaArrival[0] && Number(cmdParams(pIn)[3]) === GRUTA_POS.faldaArrival[1], "2021: la entrada de cueva no va al vestíbulo");
  ok(reachGruta.has(`${EMISION_EXIT[0]},${EMISION_EXIT[1]}`), "2030: zona de vuelta de emisiones no alcanzable");
  const passCumbre = passabilityOf(cumbre.parsed, cumbre.parsed.tilesetId);
  const reachCumbre = reachableCells(passCumbre, CUMBRE_POS.arrival, { blocked: new Set([`${CUMBRE_POS.red[0]},${CUMBRE_POS.red[1]}`, `${CUMBRE_POS.doors[0]},${CUMBRE_POS.doors[1]}`]) });
  const nearReached = ([x, y]) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => reachCumbre.has(`${x + dx},${y + dy}`));
  ok(nearReached(CUMBRE_POS.red), "2022: RED no es accesible");
  ok(nearReached(CUMBRE_POS.doors), "2022: puertas no son accesibles");
  ok(reachCumbre.has(`${CUMBRE_POS.stairsDown[0]},${CUMBRE_POS.stairsDown[1]}`), "2022: escalera de bajada no alcanzable");

  // metadatos: sin nieve fuera de horario y música de combate coherente
  const meta2021 = metadata.find(([k]) => Number(k) === 2021)?.[1];
  const meta2022 = metadata.find(([k]) => Number(k) === 2022)?.[1];
  const meta2030 = metadata.find(([k]) => Number(k) === 2030)?.[1];
  ok(meta2021 && iv(meta2021, "outdoor_map") === true, "2021: outdoor_map debe ser true");
  ok(meta2022 && iv(meta2022, "outdoor_map") === true, "2022: outdoor_map debe ser true");
  ok(meta2030 && !iv(meta2030, "outdoor_map"), "2030: outdoor_map debe ser nil");
  const weatherOf = (meta) => { const w = iv(meta, "weather"); return w ? [w[0]?.name, w[1]] : null; };
  ok(JSON.stringify(weatherOf(meta2021)) === '["Snow",100]', `2021: weather Snow 100 (real: ${JSON.stringify(weatherOf(meta2021))})`);
  ok(JSON.stringify(weatherOf(meta2022)) === '["Blizzard",100]', `2022: weather Blizzard 100 (real: ${JSON.stringify(weatherOf(meta2022))})`);
  ok(iv(meta2030, "weather") == null, "2030: sin weather");
  for (const [id, meta] of [[2021, meta2021], [2022, meta2022]]) {
    ok(String(iv(meta, "trainer_battle_BGM")?.text ?? "").includes("Johto"), `${id}: BGM de combate no es el de Johto`);
  }
  ok(iv(meta2030, "trainer_battle_BGM")?.text === iv(read("map_metadata.dat").pairs.find(([k]) => Number(k) === CATALOG.battleMusicFrom)?.[1], "trainer_battle_BGM")?.text, "2030: BGM de combate heredado");

  // eventos clave
  for (const { events } of [falda, gruta]) {
    const arch = events.find((e) => e.name.includes("Archivero"));
    ok(arch && arch.pages.length === 2 && arch.pages[1].condition.switch1 === 768, "Archivero sin página TESTIGO (sw768)");
  }
  const doors = gruta.events.filter((e) => e.name.startsWith(`${MARKER} Puerta`));
  ok(doors.length === 7, `2030: ${doors.length}/7 puertas`);
  doors.forEach((door, i) => {
    ok(door.pages.length === 2, `puerta ${i + 1}: faltan páginas`);
    ok(door.pages[1].condition.switch1 === 768 + i, `puerta ${i + 1}: página sellada debe mirar el sello ${768 + i}`);
    const t = door.pages[0].list.find((c) => cmdCode(c) === 201);
    const want = MULTI.bosses.find((b) => b.zone === i).mapId;
    ok(t && Number(cmdParams(t)[1]) === want, `puerta ${i + 1}: debe transferir a ${want}`);
    const letters = CATALOG.unownLetters.join("");
    ok(letters === "TESTIGO", "el alfabeto de puertas debe deletrear TESTIGO");
  });
  // el contador (v264) solo lo escribe RED
  let counterWrites = 0;
  for (const { events } of [falda, gruta, cumbre]) for (const ev of events) for (const p of ev.pages) for (const c of p.list) {
    if ([355, 655].includes(cmdCode(c)) && String(cmdParams(c)[0]).includes(`$game_variables[${MULTI.counterVariable}]`)) counterWrites++;
  }
  ok(counterWrites === 1, `los mapas nuevos deben escribir v264 una sola vez (RED) y escriben ${counterWrites}`);
  // sin orbes sueltos del mapa viejo
  for (const { events } of [falda, cumbre]) for (const ev of events) {
    const g = ev.pages.map((p) => p.graphic).find(Boolean)?.charName ?? "";
    if (g === "Object ball" && !ev.name.includes("Objeto")) errors.push(`orbe suelto: ${ev.name}`);
    if (g === "Object ball special" && !ev.name.includes("Puertas")) errors.push(`orbe de menú fuera de sitio: ${ev.name}`);
  }
  // Acceso a la falda: ya no es el hub del laboratorio (retirado por la
  // Expansión Multiversal), sino el punto de colapso del mundo. Se exige que la
  // falda tenga salida al mundo y que el laboratorio no ofrezca un menú de viaje.
  const faldaExits = [];
  for (const { obj } of falda.events) {
    const ev = parseEvent(obj);
    for (const p of ev.pages) for (const c of p.list) {
      if (cmdCode(c) === 201 && Number(cmdParams(c)[1]) !== 2021) faldaExits.push(Number(cmdParams(c)[1]));
    }
  }
  ok(faldaExits.length > 0 && !faldaExits.includes(48), "la falda debe volver al mundo y no al laboratorio de Oak");
  const lab = parseMap(read(mapFile(48)));
  let labMenus = 0;
  for (const { obj } of lab.events) {
    const ev = parseEvent(obj);
    if (!ev.name.startsWith("PokeMod")) continue;
    for (const p of ev.pages) {
      const destinations = new Set(p.list.filter((c) => cmdCode(c) === 201).map((c) => Number(cmdParams(c)[1])));
      if (destinations.size > 1) labMenus++;
    }
  }
  ok(labMenus === 0, "el laboratorio de Oak no debe ofrecer menús de destinos");
  for (const boss of MULTI.bosses) {
    const { events } = parseEvents(boss.mapId);
    const back = events.find((e) => e.name.includes("Volver a la gruta"));
    ok(Boolean(back), `${boss.mapId}: falta la vuelta renombrada a la gruta`);
    if (back) {
      const t = back.pages[0].list.find((c) => cmdCode(c) === 201);
      ok(t && Number(cmdParams(t)[1]) === 2030, `${boss.mapId}: la vuelta debe apuntar a 2030`);
    }
  }
  // encounters
  const encKeys = read("encounters.dat").pairs.map(([k]) => k.name ?? String(k));
  ok(encKeys.includes("2030_0"), "encounters: falta 2030_0");
  ok(encKeys.filter((k) => ["2021_0", "2022_0", "2030_0"].includes(k)).length === 3, "encounters: duplicados o faltan");
  const enc2030 = read("encounters.dat").pairs.find(([k]) => (k.name ?? String(k)) === "2030_0")?.[1];
  ok(enc2030 && enc2030.getIvar("@types")?.pairs?.length === 1, "2030: tabla de encuentros incorrecta");
  // trainers intactos
  const trainers = read("trainers.dat");
  for (const boss of [...MULTI.bosses, MULTI.champion]) {
    ok(trainers.pairs.some(([key]) => Array.isArray(key) && key[0]?.name === boss.type && txt(key[1]) === boss.name && Number(key[2]) === 0),
      `trainers.dat: falta ${boss.name}`);
  }
  // música de campo
  const bgmOf = (id) => txt(iv(iv(read(mapFile(id)), "bgm"), "name"));
  ok(bgmOf(2021) === CATALOG.maps.falda.bgm, `2021: BGM de campo ${bgmOf(2021)}`);
  ok(bgmOf(2022) === CATALOG.maps.cumbre.bgm, `2022: BGM de campo ${bgmOf(2022)}`);
  ok(bgmOf(2030) === CATALOG.maps.gruta.bgm, `2030: BGM de campo ${bgmOf(2030)}`);

  if (errors.length) throw new Error(`Reconstrucción inválida (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log("Verificación OK: falda 2021 + gruta 2030 + cumbre 2022 con recorridos validados, 7 puertas Unown sellables (sw768-774, TESTIGO), contador solo sellando, transfers re-apuntadas, encounters/música/metadatos correctos.");
}

if (!VERIFY_ONLY) install();
verify();
