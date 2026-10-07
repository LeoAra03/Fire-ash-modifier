#!/usr/bin/env node
/**
 * Instala la Expansión Multiversal (post-Ruta de Dios) sobre Fire Ash 3.7.1.
 *
 * Lo que hace, en el orden del plano:
 *
 *   1. Siete grietas en Kanto y Johto. Cada una avisa, pregunta Entrar o
 *      Retirarse y lleva a una emisión del Monte Silver. Al derrotar a su jefe
 *      se enciende el sello 868+n y la grieta queda sellada para siempre.
 *   2. Cada emisión gana una salida nueva: volver al mundo por donde entraste.
 *      La salida original a la gruta se conserva.
 *   3. Con siete purgas aparece el punto de colapso en la Torre Pokémon: lleva
 *      al Monte Silver. Con las ocho (incluido Red) se abre el umbral de la
 *      Liga Oscura en la cumbre, que sustituye al antiguo menú de niebla.
 *   4. Liga Oscura: dos mapas nuevos con cinco combates que se pueden perder.
 *   5. Expedición Atlas Mil: capitán en el puerto de Ciudad Carmín y muelle
 *      propio en Atlas Mil con barco de vuelta y paso a Puerto Horizonte.
 *   6. Isla Espejo: escotilla nueva en el B1F de la Mansión Pokémon, sótano
 *      sellado con el espejo, cruce a la isla y espejo de vuelta en el atrio.
 *   7. Laboratorio de Oak: se retira la cápsula central nueva (eventos
 *      "PokeMod Hub:") y Oak se queda como consejero de las lecturas.
 *
 * No se crea ni un switch ni una variable nueva: todo el progreso vive en el
 * contador 264 y en los sellos 868-875, de modo que ninguna partida guardada
 * puede quedarse sin slots. Toda transferencia termina en una celda abierta y
 * todo destino tiene retorno: se verifica al final.
 *
 * Uso:
 *   node tools/apply_expansion_multiversal.mjs           # instala y verifica
 *   node tools/apply_expansion_multiversal.mjs --verify  # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol, RUserDef } from "../web/js/marshal.js";
import { parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";
import { S, Sym, txt, cmd, condition, graphic, moveRoute, grid, walkableAt } from "./lib/dn_rmxp.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "expansion_multiversal");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "expansion_multiversal.json"), "utf8"));
const MULTIVERSE = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
const MARKER = "PokeMod Grieta:";
const MIRROR_MARKER = "PokeMod Espejo:";
const ATLAS_MARKER = "PokeMod Expedición:";
const HUB_MARKER = PLAN.oakLab.hubMarker;
const RIFT_SPRITE = "ARCEUS_GATE";
const POSTGAME = PLAN.postgameSwitch;
const COUNTER = PLAN.counterVariable;

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
const iv = (object, name) => object?.getIvar?.(name);
const symbol = (value) => (value instanceof RSymbol ? value.name : String(value ?? ""));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const characterDir = path.join(GAME, "Graphics", "Characters");

function backup(files) {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const file of files) {
    const origin = path.join(DATA, file);
    const copy = path.join(BACKUP, file);
    if (fs.existsSync(origin) && !fs.existsSync(copy)) fs.copyFileSync(origin, copy);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"),
    "Copias anteriores a la Expansión Multiversal. No contienen partidas.\n" +
    "Para revertir, copia estos archivos sobre pokemon_fire_ash/Data/ y borra los Map2191-2194.rxdata.\n");
}

// ------------------------------------------------------------------- comandos
function wrap(input, max = 43) {
  const output = [];
  for (const paragraph of String(input).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if (`${line} ${word}`.length <= max) line += ` ${word}`;
      else { output.push(line); line = word; }
    }
    if (line) output.push(line);
  }
  return output.length ? output : ["..."];
}
function texts(lines, indent = 0) {
  const flat = (Array.isArray(lines) ? lines : [lines]).flatMap((line) => wrap(line));
  return [cmd(101, [S(flat[0])], indent), ...flat.slice(1).map((line) => cmd(401, [S(line)], indent))];
}
const script = (line, indent = 0) => cmd(355, [S(line)], indent);
const wait = (frames, indent = 0) => cmd(106, [frames], indent);
/** Mensaje con menú \ch: no se parte en líneas, o el motor perdería la opción. */
const choiceText = (line, indent = 0) => cmd(101, [S(line)], indent);
const transfer = (mapId, x, y, dir = 2, indent = 0) => cmd(201, [0, mapId, x, y, dir, 1], indent);
/** Fundido a negro, transferencia y tono de vuelta: el fundido sin restaurar dejaría la pantalla negra. */
const fadeTransfer = (mapId, x, y, dir = 2, indent = 0) => [
  cmd(223, [toneObject(-255, -255, -255), 6], indent),
  cmd(106, [8], indent),
  transfer(mapId, x, y, dir, indent),
  cmd(223, [toneObject(0, 0, 0), 6], indent),
];
const branch = (code, params, indent = 0) => cmd(code, params, indent);
const elseBranch = (indent = 0) => cmd(411, [], indent);
const endBranch = (indent = 0) => cmd(412, [], indent);
const choice = (labels, indent = 0) => cmd(102, [labels.map(S), 2], indent);
const choiceCase = (index, label, indent = 0) => cmd(402, [index, S(label)], indent);
const choiceEnd = (indent = 0) => cmd(404, [], indent);
function page(opts) {
  return new RObject("RPG::Event::Page", [
    ["@condition", opts.cond ?? condition()],
    ["@graphic", opts.gfx ?? graphic()],
    ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", moveRoute()],
    ["@walk_anime", opts.walkAnime ?? false],
    ["@step_anime", opts.stepAnime ?? false],
    ["@direction_fix", opts.directionFix ?? true],
    ["@through", false],
    ["@always_on_top", false],
    ["@trigger", opts.trigger ?? 0],
    ["@list", opts.list ?? [cmd(0)]],
  ]);
}
function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}
/** Página invisible antes del postgame + página activa en postgame. */
function postgamed(name, x, y, gfx, list, extra = {}) {
  return event(0, name, x, y, [
    page({ list: [cmd(0)] }),
    page({ cond: condition({ sw: POSTGAME }), gfx, ...extra, list }),
    ...(extra.extraPages ?? []),
  ]);
}

// -------------------------------------------------------------- transitables
const tilesets = new Map();
{
  const rows = read("Tilesets.rxdata");
  for (let index = 1; index < rows.length; index++) {
    const raw = rows[index];
    if (raw) { const parsed = parseTileset(raw); tilesets.set(parsed.id, parsed); }
  }
}
function openCell(parsed, x, y) {
  const tileset = tilesets.get(parsed.tilesetId);
  if (x < 0 || y < 0 || x >= parsed.width || y >= parsed.height) return false;
  let bits = 0;
  for (let z = 0; z < parsed.table.z; z++) {
    const tile = tableGet(parsed.table, x, y, z);
    if (tile > 0 && tile < tileset.passages.data.length) bits |= tileset.passages.data[tile] & 15;
  }
  return bits === 0;
}
/** Celdas libres (transitables y sin evento) del componente conexo mayor. */
function freeCells(mapId, reserved = new Set()) {
  const g = grid(mapId);
  const key = (x, y) => `${x},${y}`;
  const open = new Set();
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (walkableAt(g, x, y) && !g.occupied.has(key(x, y)) && !reserved.has(key(x, y))) open.add(key(x, y));
    }
  }
  const seen = new Set();
  let best = [];
  for (const cell of open) {
    if (seen.has(cell)) continue;
    const [sx, sy] = cell.split(",").map(Number);
    const component = [];
    const queue = [[sx, sy]];
    seen.add(cell);
    while (queue.length) {
      const [x, y] = queue.pop();
      component.push([x, y]);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const next = key(nx, ny);
        if (open.has(next) && !seen.has(next)) { seen.add(next); queue.push([nx, ny]); }
      }
    }
    if (component.length > best.length) best = component;
  }
  return best.map(([x, y]) => [x, y]);
}
function nearest(cells, hint) {
  let best = cells[0], bestDistance = Infinity;
  for (const cell of cells) {
    const distance = Math.abs(cell[0] - hint[0]) + Math.abs(cell[1] - hint[1]);
    if (distance < bestDistance) { bestDistance = distance; best = cell; }
  }
  return best;
}
function spread(cells, count) {
  if (cells.length < count) throw new Error("El mapa no tiene celdas libres suficientes");
  const centroid = cells.reduce((acc, [x, y]) => [acc[0] + x / cells.length, acc[1] + y / cells.length], [0, 0]);
  const distance = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  let start = cells[0];
  for (const cell of cells) if (distance(cell, centroid) < distance(start, centroid)) start = cell;
  const chosen = [start];
  while (chosen.length < count) {
    let best = null, bestScore = -1;
    for (const cell of cells) {
      if (chosen.some((c) => c[0] === cell[0] && c[1] === cell[1])) continue;
      const score = Math.min(...chosen.map((c) => distance(c, cell)));
      if (score > bestScore) { bestScore = score; best = cell; }
    }
    chosen.push(best);
  }
  return chosen;
}

/** Alta idempotente: sustituye los eventos de esta herramienta y añade los nuevos. */
function upsert(mapId, ownedPrefixes, build) {
  const file = mapFile(mapId);
  backup([file]);
  const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  const events = iv(map, "events");
  const kept = events.pairs.filter(([, object]) => !ownedPrefixes.some((prefix) => txt(iv(object, "@name")).startsWith(prefix)));
  let nextId = Math.max(0, ...kept.map(([key]) => (typeof key === "number" ? key : 0))) + 1;
  const added = build(nextId).map((object) => {
    object.setIvar("@id", nextId);
    return object;
  }).map((object) => { const id = Number(iv(object, "@id")); nextId = id + 1; return [id, object]; });
  events.pairs = [...kept, ...added];
  write(file, map);
  return added.map(([, object]) => ({ name: txt(iv(object, "@name")), x: iv(object, "@x"), y: iv(object, "@y") }));
}

/** Reparte varios eventos propios: limpia antes para que las celdas no bailen. */
function placeMany(mapId, owned, count, build) {
  upsert(mapId, owned, () => []);
  const cells = spread(freeCells(mapId), count);
  upsert(mapId, owned, () => build(cells));
  return cells;
}

/**
 * Coloca un evento de esta herramienta en la celda libre más cercana a la pista.
 * Limpia primero los eventos propios: si no, la grieta vieja ocupa su propia
 * celda y la nueva nace un tile más allá en cada ejecución.
 */
function place(mapId, owned, hint, build) {
  upsert(mapId, owned, () => []);
  const cell = nearest(freeCells(mapId), hint);
  upsert(mapId, owned, () => [build(cell)]);
  return cell;
}

// --------------------------------------------------------------- 1. grietas
function emissionArrival(mapId) {
  const spec = MULTIVERSE.maps.find((entry) => entry.mapId === mapId);
  if (!spec?.arrival) throw new Error(`El catálogo del Monte Silver no tiene llegada para ${mapId}`);
  return spec.arrival;
}

function riftEvent(rift, cell) {
  const arrival = emissionArrival(rift.emissionMap);
  const list = [
    ...texts(rift.warning),
    choiceText(`¿Entrar o retirarte?\\ch[1,2,Entrar,Retirarse]`),
    branch(111, [1, 1, 0, 0, 0]),
    ...texts([rift.enter], 1),
    ...fadeTransfer(rift.emissionMap, arrival[0], arrival[1], 2, 1),
    endBranch(),
    ...texts([rift.retreat], 1),
    endBranch(),
    cmd(0),
  ];
  return event(0, `${MARKER} ${rift.label}`, cell[0], cell[1], [
    page({ list: [cmd(0)] }),
    page({
      cond: condition({ sw: POSTGAME }),
      gfx: graphic(RIFT_SPRITE, 2, 1, {}),
      stepAnime: true,
      list,
    }),
    // Página sellada: la amenaza se purgó, pero la cicatriz sigue siendo una
    // puerta. Sin ella, las revanchas de los jefes quedarían inalcanzables.
    page({
      cond: condition({ sw: POSTGAME, sw2: rift.seal }),
      gfx: graphic(RIFT_SPRITE, 2, 1, {}),
      list: [
        ...texts([rift.closed, rift.scar]),
        choiceText(rift.scarAsk),
        branch(111, [1, 1, 0, 0, 0]),
        ...fadeTransfer(rift.emissionMap, arrival[0], arrival[1], 2, 1),
        endBranch(),
        ...texts(["La dejas en paz. La cicatriz no se mueve."], 1),
        endBranch(),
        cmd(0),
      ],
    }),
  ]);
}

function installRifts() {
  for (const rift of PLAN.rifts) upsert(rift.world.mapId, [MARKER], () => []);
  return PLAN.rifts.map((rift) => {
    const cell = nearest(freeCells(rift.world.mapId), rift.world.hint);
    upsert(rift.world.mapId, [MARKER], () => [riftEvent(rift, cell)]);
    return { ...rift, cell };
  });
}

/** Cada emisión gana una salida al mundo por donde entró el jugador. */
function worldReturnEvent(rift, cell) {
  return event(0, `${MARKER} Volver al mundo`, cell[0], cell[1], [
    page({
      trigger: 0,
      gfx: graphic("", 2, 1, {}),
      list: [
        ...texts([PLAN.emissionsReturn.exitMessage]),
        // El gris de la ceniza es de la emisión, no del mundo: se limpia antes
        // de cruzar. (apply_restauracion_cromatica mantiene este mismo gesto.)
        cmd(223, [toneObject(0, 0, 0), 6]),
        wait(8),
        transfer(rift.world.mapId, rift.cell[0], rift.cell[1], 2),
        cmd(0),
      ],
    }),
  ]);
}
function installEmissionReturns(placed) {
  for (const rift of placed) {
    upsert(rift.emissionMap, [MARKER], () => []);
    const cell = nearest(freeCells(rift.emissionMap), [2, 2]);
    upsert(rift.emissionMap, [MARKER], () => [worldReturnEvent(rift, cell)]);
  }
}

// ------------------------------------------------------- 2. punto de colapso
function collapseEvent(cell) {
  const target = MULTIVERSE.maps.find((entry) => entry.mapId === PLAN.collapse.targetMap);
  const list = [
    ...texts(PLAN.collapse.lines),
    ...texts([PLAN.collapse.enter]),
    choiceText(`¿Subir o quedarte?\\ch[1,2,Subir,Quedarse]`),
    branch(111, [1, 1, 0, 0, 0]),
    ...fadeTransfer(PLAN.collapse.targetMap, target.arrival[0], target.arrival[1], 2, 1),
    endBranch(),
    ...texts([PLAN.collapse.retreat], 1),
    endBranch(),
    cmd(0),
  ];
  // Página 1: invisible. Página 2: postgame y siete purgas -> la grieta respira.
  return event(0, `${MARKER} Punto de colapso`, cell[0], cell[1], [
    page({ list: [cmd(0)] }),
    page({
      cond: condition({ sw: POSTGAME, variable: [COUNTER, PLAN.purgeGoal] }),
      gfx: graphic(RIFT_SPRITE, 2, 1, {}),
      stepAnime: true,
      list,
    }),
  ]);
}

function installCollapse() {
  return place(PLAN.collapse.mapId, [MARKER], PLAN.collapse.hint, (cell) => collapseEvent(cell));
}

/** La falda ya no baja al laboratorio: baja al mundo por la torre. */
function installFaldaExit(collapseCell) {
  const file = mapFile(PLAN.falda.mapId);
  backup([file]);
  const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  const events = iv(map, "events");
  let changed = false;
  // Idempotente: acepta el nombre original y el que deja una instalación previa.
  const accepted = new Set([PLAN.falda.eventName, PLAN.falda.newName]);
  for (const [, object] of events.pairs) {
    if (!accepted.has(txt(iv(object, "@name")))) continue;
    object.setIvar("@name", S(PLAN.falda.newName));
    for (const pageObject of iv(object, "@pages") ?? []) {
      const list = (iv(pageObject, "@list") ?? []).filter((command) => Number(iv(command, "@code")) !== 201);
      const cut = list.findIndex((command) => Number(iv(command, "@code")) === 0);
      const head = cut >= 0 ? list.slice(0, cut) : list;
      pageObject.setIvar("@list", [
        ...head,
        transfer(PLAN.collapse.mapId, collapseCell[0], collapseCell[1], 2),
        cmd(0),
      ]);
    }
    changed = true;
  }
  if (!changed) throw new Error(`No se encontró la salida de la falda ("${PLAN.falda.eventName}") en el mapa ${PLAN.falda.mapId}`);
  write(file, map);
}

// --------------------------------------------------------- 3. Liga Oscura
function trainerObject(boss, idNumber) {
  const name = S(boss.name);
  const key = [Sym(boss.type), name, 0];
  return {
    key,
    obj: new RObject("GameData::Trainer", [
      ["@id", key], ["@id_number", idNumber], ["@trainer_type", key[0]],
      ["@real_name", name], ["@version", 0], ["@items", [Sym("FULLRESTORE")]],
      ["@real_lose_text", S(boss.loss)], ["@numpkmn", 0], ["@guara", 0],
      ["@pokemon", boss.team.map(([species, level]) => new RHash([["species", Sym(species)], ["level", level]]))],
    ]),
  };
}
function trainerKeyMatches(key, boss) {
  return Array.isArray(key) && symbol(key[0]) === boss.type && txt(key[1]) === boss.name && Number(key[2]) === 0;
}
function installDarkLeagueTrainers() {
  const species = new Set(read("species.dat").pairs.filter(([k]) => k instanceof RSymbol).map(([k]) => k.name));
  const types = new Set(read("trainer_types.dat").pairs.filter(([k]) => k instanceof RSymbol).map(([k]) => k.name));
  const items = new Set(read("items.dat").pairs.filter(([k]) => k instanceof RSymbol).map(([k]) => k.name));
  for (const boss of PLAN.darkLeague.battles) {
    if (!types.has(boss.type)) throw new Error(`Tipo de entrenador inexistente: ${boss.type}`);
    if (!items.has(boss.reward)) throw new Error(`Recompensa inexistente: ${boss.reward}`);
    for (const [name] of boss.team) if (!species.has(name)) throw new Error(`Especie inexistente: ${name}`);
    if (!fs.existsSync(path.join(characterDir, `${boss.sprite}.png`))) throw new Error(`Sprite ausente: ${boss.sprite}.png`);
  }
  const trainers = read("trainers.dat");
  let next = Math.max(-1, ...trainers.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  let added = 0;
  for (const boss of PLAN.darkLeague.battles) {
    if (trainers.pairs.some(([key]) => trainerKeyMatches(key, boss))) continue;
    const built = trainerObject(boss, next);
    trainers.pairs.push([next, built.obj], [built.key, built.obj]);
    next++;
    added++;
  }
  if (added) { backup(["trainers.dat"]); write("trainers.dat", trainers); }
  return added;
}

function bossEvent(boss, cell) {
  const call = `pbTrainerBattle(:${boss.type},"${boss.name}",nil,false,0,true)`;
  const first = [
    ...texts(boss.intro),
    script(`pbTrainerIntro(:${boss.type})`),
    branch(111, [12, S(call)]),
    ...texts([boss.win], 1),
    script(`pbReceiveItem(:${boss.reward})`, 1),
    cmd(123, [S("A"), 0], 1),
    cmd(411),
    ...texts([boss.loss], 1),
    cmd(412),
    script("pbTrainerEnd"),
    cmd(0),
  ];
  const rematch = [
    ...texts([boss.rematch]),
    choice(["Revancha", "Luego"]),
    choiceCase(0, "Revancha"),
    script(`pbTrainerIntro(:${boss.type})`, 1),
    branch(111, [12, S(call)], 1),
    ...texts([boss.win], 2),
    cmd(411, [], 1),
    ...texts([boss.loss], 2),
    cmd(412, [], 1),
    script("pbTrainerEnd", 1),
    choiceCase(1, "Luego"),
    choiceEnd(),
    cmd(0),
  ];
  return event(0, `${MARKER} ${boss.name}`, cell[0], cell[1], [
    page({ gfx: graphic(boss.sprite, 2, 1, {}), list: first }),
    page({ cond: condition({ self: "A" }), gfx: graphic(boss.sprite, 2, 1, {}), list: rematch }),
  ]);
}

function healerEvent(cell) {
  return event(0, `${MARKER} Guardiana`, cell[0], cell[1], [
    page({
      gfx: graphic("NPC 16", 2, 1, {}),
      list: [
        ...texts(["Guardiana: Aquí el descanso no se negocia. ¿Restauro a tu equipo?"]),
        choice(["Sí", "No"]),
        choiceCase(0, "Sí"),
        cmd(314, [0], 1),
        ...texts(["Equipo restaurado. La Liga Oscura espera."], 1),
        choiceCase(1, "No"),
        ...texts(["Vuelve cuando lo necesites."], 1),
        choiceEnd(),
        cmd(0),
      ],
    }),
  ]);
}
function returnEvent(name, cell, targetMap, target, message, ask) {
  return event(0, name, cell[0], cell[1], [
    page({
      gfx: graphic("", 2, 1, {}),
      list: [
        ...texts([ask]),
        choice(["Volver", "Quedarse"]),
        choiceCase(0, "Volver"),
        ...texts([message], 1),
        ...fadeTransfer(targetMap, target[0], target[1], 2, 1),
        choiceCase(1, "Quedarse"),
        ...texts(["Te quedas. Nadie te cierra la puerta."], 1),
        choiceEnd(),
        cmd(0),
      ],
    }),
  ]);
}
function gateEvent(name, cell, targetMap, target, message, ask, opts = {}) {
  const body = page({
      cond: opts.cond ?? condition(),
      gfx: graphic("", 2, 1, {}),
      list: [
        ...texts([ask]),
        choice(["Entrar", "Esperar"]),
        choiceCase(0, "Entrar"),
        ...texts([message], 1),
        ...fadeTransfer(targetMap, target[0], target[1], 2, 1),
        choiceCase(1, "Esperar"),
        ...texts(["Esperas. El umbral no tiene prisa: la tiene el mundo de fuera."], 1),
        choiceEnd(),
        cmd(0),
      ],
    });
  return event(0, name, cell[0], cell[1], opts.cond ? [page({ list: [cmd(0)] }), body] : [body]);
}
function loreEvent(name, cell, lines, sprite = "trchar028") {
  return event(0, name, cell[0], cell[1], [
    page({ gfx: graphic(sprite, 2, 1, {}), list: [...texts(lines), cmd(0)] }),
  ]);
}
function signEvent(name, cell, lines) {
  return event(0, name, cell[0], cell[1], [
    page({ gfx: graphic("", 2, 1, {}), list: [...texts(lines), cmd(0)] }),
  ]);
}

function cloneTemplate(templateId, mapId) {
  const source = marshalLoad(fs.readFileSync(path.join(DATA, mapFile(templateId))));
  const clone = marshalLoad(Buffer.from(marshalDump(source)));
  clone.setIvar("@events", new RHash([]));
  clone.setIvar("@encounter_list", new RHash([]));
  return clone;
}
function installMapInfos(specs) {
  const infos = read("MapInfos.rxdata");
  for (const spec of specs) {
    infos.pairs = infos.pairs.filter(([key]) => Number(key) !== spec.mapId);
    infos.pairs.push([spec.mapId, new RObject("RPG::MapInfo", [
      ["@scroll_x", 512], ["@name", S(spec.title)], ["@expanded", false],
      ["@order", 1200 + specs.indexOf(spec)], ["@scroll_y", 320], ["@parent_id", spec.parentId],
    ])]);
  }
  write("MapInfos.rxdata", infos);
}
function installMetadata(specs) {
  const metadata = read("map_metadata.dat");
  for (const spec of specs) {
    const source = metadata.pairs.find(([id]) => Number(id) === spec.template)?.[1];
    if (!source) throw new Error(`No hay metadatos para la plantilla ${spec.template}`);
    metadata.pairs = metadata.pairs.filter(([id]) => Number(id) !== spec.mapId);
    const clone = new RObject(source.className, source.ivars.map(([name, value]) => [name, value]));
    clone.setIvar("@id", spec.mapId);
    if (spec.battleBackdrop) clone.setIvar("@battle_background", S(spec.battleBackdrop));
    metadata.pairs.push([spec.mapId, clone]);
  }
  write("map_metadata.dat", metadata);
}

function toneObject(red, green, blue, gray = 0) {
  const buffer = Buffer.alloc(32);
  [red, green, blue, gray].forEach((value, index) => buffer.writeDoubleLE(value, index * 8));
  return new RUserDef("Tone", Uint8Array.from(buffer));
}

function installDarkLeague(collapseCell) {
  const specs = [
    { ...PLAN.darkLeague.maps[0], parentId: PLAN.collapse.targetMap },
    { ...PLAN.darkLeague.maps[1], parentId: PLAN.darkLeague.maps[0].mapId },
  ];
  for (const spec of specs) {
    if (fs.existsSync(path.join(DATA, mapFile(spec.mapId)))) continue;
    backup([mapFile(spec.mapId)]);
    write(mapFile(spec.mapId), cloneTemplate(spec.template, spec.mapId));
  }
  installMapInfos(specs);
  installMetadata(specs);

  const [umbral, arena] = specs;
  // Limpieza previa: las celdas se reparten sobre el mapa desnudo, de modo que
  // reinstalar no mueve nada.
  upsert(umbral.mapId, [MARKER], () => []);
  upsert(arena.mapId, [MARKER], () => []);
  const umbralCells = spread(freeCells(umbral.mapId), 4);
  const arenaCells = spread(freeCells(arena.mapId), PLAN.darkLeague.battles.length + 2);

  upsert(umbral.mapId, [MARKER], () => [
    loreEvent(`${MARKER} Archivero`, umbralCells[0], [
      "Archivero Prohibido: Esto no es un transportador ni una cápsula. Es una puerta, y se abre cuando las historias se acaban.",
      ...PLAN.darkLeague.maps[0].lines,
    ]),
    healerEvent(umbralCells[1]),
    returnEvent(`${MARKER} Salir al mundo`, umbralCells[2], PLAN.collapse.mapId, collapseCell,
      "El aire de la torre te devuelve de una pieza.", "La grieta del mundo sigue abierta. ¿Sales?"),
    gateEvent(`${MARKER} Puerta de la arena`, umbralCells[3], arena.mapId, arenaCells[0],
      "La puerta se abre hacia la arena.", "Al otro lado esperan las siete voces hechas una. ¿Entras?"),
  ]);

  upsert(arena.mapId, [MARKER], () => {
    const battles = PLAN.darkLeague.battles.map((boss, index) => bossEvent(boss, arenaCells[index]));
    return [
      ...battles,
      returnEvent(`${MARKER} Volver al umbral`, arenaCells[battles.length], umbral.mapId, umbralCells[0],
        "Vuelves al umbral. La arena se queda como estaba.", "¿Vuelves al umbral?"),
      returnEvent(`${MARKER} Salir al mundo`, arenaCells[battles.length + 1], PLAN.collapse.mapId, collapseCell,
        "Sales directo al mundo. La Liga Oscura no retiene a nadie.", "¿Sales al mundo?"),
    ];
  });

  // El umbral de la cumbre sustituye al antiguo menú de las siete puertas.
  const file = mapFile(PLAN.darkLeague.gate.mapId);
  backup([file]);
  const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  const events = iv(map, "events");
  let replaced = false;
  const accepted = new Set([PLAN.darkLeague.gate.eventName, PLAN.darkLeague.gate.newName]);
  for (const [, object] of events.pairs) {
    if (!accepted.has(txt(iv(object, "@name")))) continue;
    object.setIvar("@name", S(PLAN.darkLeague.gate.newName));
    object.setIvar("@pages", [
      page({
        cond: condition({ sw: POSTGAME }),
        gfx: graphic(RIFT_SPRITE, 2, 1, {}),
        stepAnime: true,
        list: [
          branch(111, [1, COUNTER, 0, PLAN.finalGoal, 1]),
          ...texts([PLAN.darkLeague.gate.open], 1),
          ...fadeTransfer(umbral.mapId, umbralCells[0][0], umbralCells[0][1], 2, 1),
          elseBranch(),
          ...texts([PLAN.darkLeague.gate.locked], 1),
          endBranch(),
          cmd(0),
        ],
      }),
    ]);
    replaced = true;
  }
  if (!replaced) throw new Error(`No se encontró el evento "${PLAN.darkLeague.gate.eventName}" ni "${PLAN.darkLeague.gate.newName}" en ${PLAN.darkLeague.gate.mapId}`);
  write(file, map);
  return { umbral, arena, umbralCells, arenaCells };
}

// --------------------------------------------------------- 4. Expedición Atlas
function captainEvent(cell, dockCell) {
  const atlas = PLAN.atlas;
  return event(0, `${ATLAS_MARKER} Capitán`, cell[0], cell[1], [
    page({ list: [cmd(0)] }),
    page({
      cond: condition({ sw: POSTGAME }),
      gfx: graphic(atlas.captainSprite, 2, 1, {}),
      list: [
        ...texts([atlas.ask]),
        choice(["Zarpar", "Ahora no"]),
        choiceCase(0, "Zarpar"),
        branch(111, [0, atlas.gate, 0], 1),
        ...texts([atlas.setSail], 2),
        ...fadeTransfer(atlas.dock.mapId, dockCell[0], dockCell[1], 2, 2),
        elseBranch(1),
        ...texts([atlas.notYet], 2),
        endBranch(1),
        choiceCase(1, "Ahora no"),
        ...texts(["El capitán asiente y vuelve a sus cuerdas."], 1),
        choiceEnd(),
        cmd(0),
      ],
    }),
  ]);
}

function installAtlas() {
  const atlas = PLAN.atlas;
  if (!fs.existsSync(path.join(DATA, mapFile(atlas.dock.mapId)))) {
    backup([mapFile(atlas.dock.mapId)]);
    write(mapFile(atlas.dock.mapId), cloneTemplate(atlas.dock.template, atlas.dock.mapId));
  }
  installMapInfos([{ ...atlas.dock, parentId: atlas.portMap }]);
  installMetadata([atlas.dock]);

  // Primero el muelle: así la llegada del barco se calcula sin pisar a nadie.
  const dockCells = placeMany(atlas.dock.mapId, [ATLAS_MARKER], 3, (cells) => [
    returnEvent(`${ATLAS_MARKER} Barco a Ciudad Carmín`, cells[0], atlas.captainMap, [0, 0],
      "El barco atraca en Ciudad Carmín con la marea exacta.", atlas.back),
    returnEvent(`${ATLAS_MARKER} Paso a Puerto Horizonte`, cells[1], atlas.portMap, [34, 23],
      "Caminas por el dique hasta el puerto del Cronista.", "El sendero del dique lleva a Puerto Horizonte. ¿Vas?"),
    signEvent(`${ATLAS_MARKER} Cartel del muelle`, cells[2], [
      "MUELLE DE ATLAS MIL — Amarre del Capitán Ferrán.",
      "Desde aquí se navega al mundo y se vuelve cuando se quiera.",
    ]),
  ]);
  const dockCell = nearest(freeCells(atlas.dock.mapId), [2, 2]);
  // El barco de vuelta apunta a la celda del capitán; se repunta al final.
  const captainCell = place(atlas.captainMap, [ATLAS_MARKER], atlas.captainHint, (cell) => captainEvent(cell, dockCell));
  const file = mapFile(atlas.dock.mapId);
  const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  for (const [, object] of iv(map, "events").pairs) {
    if (txt(iv(object, "@name")) !== `${ATLAS_MARKER} Barco a Ciudad Carmín`) continue;
    for (const pageObject of iv(object, "@pages") ?? []) {
      const list = (iv(pageObject, "@list") ?? []).map((command) => {
        if (Number(iv(command, "@code")) !== 201) return command;
        return transfer(atlas.captainMap, captainCell[0], captainCell[1], 2, iv(command, "@indent"));
      });
      pageObject.setIvar("@list", list);
    }
  }
  write(file, map);
  return captainCell;
}

// ------------------------------------------------------------- 5. Isla Espejo
function installMirror() {
  const mirror = PLAN.mirror;
  if (!fs.existsSync(path.join(DATA, mapFile(mirror.basement.mapId)))) {
    backup([mapFile(mirror.basement.mapId)]);
    write(mapFile(mirror.basement.mapId), cloneTemplate(mirror.basement.template, mirror.basement.mapId));
  }
  installMapInfos([{ ...mirror.basement, parentId: mirror.mansionMap }]);
  installMetadata([mirror.basement]);

  // Ciudad Teckel rediseñó el atrio de la antigua Isla Espejo: la llegada del
  // espejo debe ser una celda abierta del mapa actual, no la coordenada vieja.
  mirror.islandArrival = nearest(freeCells(mirror.islandMap), mirror.islandArrival);
  fs.writeFileSync(path.join(ROOT, "content", "expansion_multiversal.json"), `${JSON.stringify(PLAN, null, 2)}\n`);

  // Sótano: se limpia y se reparten las celdas antes de colocar nada.
  upsert(mirror.basement.mapId, [MIRROR_MARKER], () => []);
  const basementCells = spread(freeCells(mirror.basement.mapId), 3);

  // Escotilla en el B1F de la Mansión Pokémon.
  const hatchCell = place(mirror.mansionMap, [MIRROR_MARKER], mirror.mansionHint, (cell) =>
    gateEvent(`${MIRROR_MARKER} Escotilla`, cell, mirror.basement.mapId, basementCells[2],
      mirror.hatch, "La escotilla baja a un sótano que no figuraba en los planos. ¿Bajas?",
      // Igual que las grietas y el capitán: cerrada hasta el postgame.
      { cond: condition({ sw: POSTGAME }) }));

  upsert(mirror.basement.mapId, [MIRROR_MARKER], () => [
    event(0, `${MIRROR_MARKER} Espejo`, basementCells[0][0], basementCells[0][1], [
      page({
        gfx: graphic("", 2, 1, {}),
        list: [
          ...texts(mirror.lines),
          choiceText(`¿Cruzar el umbral?\\ch[1,2,Cruzar,Retirarse]`),
          branch(111, [1, 1, 0, 0, 0]),
          ...texts([mirror.cross], 1),
          ...fadeTransfer(mirror.islandMap, mirror.islandArrival[0], mirror.islandArrival[1], 2, 1),
          endBranch(),
          ...texts([mirror.retreat], 1),
          endBranch(),
          cmd(0),
        ],
      }),
    ]),
    returnEvent(`${MIRROR_MARKER} Escaleras`, basementCells[1], mirror.mansionMap, hatchCell,
      "Subes las escaleras y la mansión vuelve a tener la planta de siempre.",
      "Las escaleras suben al B1F de la mansión. ¿Subes?"),
    signEvent(`${MIRROR_MARKER} Placa`, basementCells[2], [
      "SÓTANO SELLADO — Mansión Pokémon, Isla Canela.",
      "El espejo no devuelve quien se mira: devuelve lo que se contó.",
    ]),
  ]);

  // Espejo de vuelta dentro del atrio de la Isla Espejo.
  const atriumCell = place(mirror.islandMap, [MIRROR_MARKER],
    [mirror.islandArrival[0] + 2, mirror.islandArrival[1]], (cell) =>
    event(0, `${MIRROR_MARKER} Espejo de vuelta`, cell[0], cell[1], [
      page({
        gfx: graphic("", 2, 1, {}),
        list: [
          ...texts([mirror.backAsk]),
          choice(["Cruzar", "Quedarse"]),
          choiceCase(0, "Cruzar"),
          ...texts([mirror.back], 1),
          ...fadeTransfer(mirror.basement.mapId, basementCells[0][0], basementCells[0][1] + 1, 2, 1),
          choiceCase(1, "Quedarse"),
          ...texts([mirror.stay], 1),
          choiceEnd(),
          cmd(0),
        ],
      }),
    ]));
  return { hatchCell, basementCells, atriumCell };
}

// ---------------------------------------------------- 6. Laboratorio de Oak
function removeLabOwned(lab) {
  const file = mapFile(lab.mapId);
  backup([file]);
  const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  const events = iv(map, "events");
  const owned = [HUB_MARKER, lab.name];
  const kept = events.pairs.filter(([, object]) => !owned.some((prefix) => txt(iv(object, "@name")).startsWith(prefix)));
  const removed = events.pairs.length - kept.length;
  events.pairs = kept;
  write(file, map);
  return removed;
}

function installOakLab() {
  const lab = PLAN.oakLab;
  // Primero se limpia, y solo después se mide dónde cabe el consejero.
  const removed = removeLabOwned(lab);
  const cell = nearest(freeCells(lab.mapId), lab.hint);
  const file = mapFile(lab.mapId);
  const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  const events = iv(map, "events");
  const id = Math.max(0, ...events.pairs.map(([key]) => (typeof key === "number" ? key : 0))) + 1;
  const oak = event(id, lab.name, cell[0], cell[1], [
    page({ list: [cmd(0)] }),
    page({
      cond: condition({ sw: POSTGAME }),
      gfx: graphic(lab.sprite, 2, 1, {}),
      list: [...texts(lab.lines), cmd(0)],
    }),
  ]);
  events.pairs.push([id, oak]);
  write(file, map);
  return { removed, cell, total: events.pairs.length };
}

// ------------------------------------------------------------- verificación
function eventsOf(mapId) {
  const map = marshalLoad(fs.readFileSync(path.join(DATA, mapFile(mapId))));
  return iv(map, "events").pairs.map(([id, object]) => ({
    id: Number(id), name: txt(iv(object, "@name")), x: iv(object, "@x"), y: iv(object, "@y"),
    pages: (iv(object, "@pages") ?? []).map((pageObject) => ({
      condition: {
        sw1: iv(iv(pageObject, "@condition"), "@switch1_id"),
        sw1valid: iv(iv(pageObject, "@condition"), "@switch1_valid"),
        sw2: iv(iv(pageObject, "@condition"), "@switch2_id"),
        sw2valid: iv(iv(pageObject, "@condition"), "@switch2_valid"),
        variable: iv(iv(pageObject, "@condition"), "@variable_id"),
        variableValid: iv(iv(pageObject, "@condition"), "@variable_valid"),
        variableValue: iv(iv(pageObject, "@condition"), "@variable_value"),
        self: txt(iv(iv(pageObject, "@condition"), "@self_switch_ch")),
        selfValid: iv(iv(pageObject, "@condition"), "@self_switch_valid"),
      },
      graphic: txt(iv(iv(pageObject, "@graphic"), "@character_name")),
      list: (iv(pageObject, "@list") ?? []).map((command) => ({
        code: Number(iv(command, "@code")), params: iv(command, "@parameters") ?? [],
      })),
    })),
  }));
}
function transfersOf(entry) {
  const out = [];
  for (const pageObject of entry.pages) {
    for (const command of pageObject.list) {
      if (command.code === 201 && Number(command.params[0]) === 0) {
        out.push({ map: Number(command.params[1]), x: Number(command.params[2]), y: Number(command.params[3]) });
      }
    }
  }
  return out;
}
function cellOpen(mapId, x, y) {
  return openCell(parseMap(marshalLoad(fs.readFileSync(path.join(DATA, mapFile(mapId))))), x, y);
}

const mirrorAskSnippet = () => (PLAN.mirror.ask || "Cruzar").split(" ")[0];

function verify() {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };

  // 1. Grietas: siete, en celdas abiertas, con Entrar/Retirarse y sello.
  for (const rift of PLAN.rifts) {
    const events = eventsOf(rift.world.mapId).filter((entry) => entry.name.startsWith(MARKER));
    ok(events.length === 1, `${rift.id}: hay ${events.length} grietas en ${rift.world.mapId}`);
    const rift_event = events[0];
    if (!rift_event) continue;
    ok(cellOpen(rift.world.mapId, rift_event.x, rift_event.y), `${rift.id}: grieta sobre celda bloqueada`);
    ok(rift_event.pages.length === 3, `${rift.id}: la grieta necesita tres páginas (invisible, activa, sellada)`);
    const active = rift_event.pages[1];
    ok(active.condition.sw1 === POSTGAME && active.condition.sw1valid, `${rift.id}: la grieta no depende del postgame`);
    ok(rift_event.pages[2].condition.sw2 === rift.seal && rift_event.pages[2].condition.sw2valid, `${rift.id}: la página sellada no usa el sello ${rift.seal}`);
    // Purgada la grieta, el contenido debe seguir siendo visitable (revanchas).
    ok(transfersOf(rift_event).every((t) => t.map === rift.emissionMap), `${rift.id}: purgada la grieta debe seguir llevando a la emisión`);
    const target = transfersOf(rift_event)[0];
    ok(target && target.map === rift.emissionMap, `${rift.id}: la grieta no lleva a la emisión ${rift.emissionMap}`);
    if (target) ok(cellOpen(target.map, target.x, target.y), `${rift.id}: la llegada a ${target.map} está bloqueada`);
    ok(active.list.some((command) => command.code === 101 && txt(command.params[0]).includes("\\ch[1,2,Entrar,Retirarse]")), `${rift.id}: falta la advertencia con Entrar/Retirarse`);
    ok(fs.existsSync(path.join(characterDir, `${active.graphic}.png`)), `${rift.id}: falta el sprite de la grieta ${active.graphic}.png`);
    // Retorno al mundo desde la emisión.
    const emission = eventsOf(rift.emissionMap);
    const back = emission.find((entry) => entry.name === `${MARKER} Volver al mundo`);
    ok(back, `${rift.id}: la emisión ${rift.emissionMap} no tiene salida al mundo`);
    if (back) {
      const home = transfersOf(back)[0];
      ok(home && home.map === rift.world.mapId, `${rift.id}: la salida no vuelve al mundo (${rift.world.mapId})`);
      if (home) ok(cellOpen(home.map, home.x, home.y), `${rift.id}: la salida aterriza en celda bloqueada`);
      ok(cellOpen(rift.emissionMap, back.x, back.y), `${rift.id}: la salida está sobre celda bloqueada`);
    }
    // La salida original a la gruta se conserva.
    ok(emission.some((entry) => entry.name.includes("Volver a la gruta")), `${rift.id}: se perdió la salida original de la emisión`);
  }

  // 2. Punto de colapso: exige las siete purgas y lleva a la falda.
  {
    const collapse = eventsOf(PLAN.collapse.mapId).find((entry) => entry.name === `${MARKER} Punto de colapso`);
    ok(collapse, `no existe el punto de colapso en ${PLAN.collapse.mapId}`);
    if (collapse) {
      const pageObject = collapse.pages[1];
      ok(pageObject?.condition.variableValid && pageObject.condition.variable === COUNTER
        && pageObject.condition.variableValue === PLAN.purgeGoal,
        `el colapso no exige el contador ${COUNTER} >= ${PLAN.purgeGoal}`);
      const target = transfersOf(collapse)[0];
      ok(target && target.map === PLAN.collapse.targetMap, "el colapso no lleva al Monte Silver");
      if (target) ok(cellOpen(target.map, target.x, target.y), "la llegada del colapso está bloqueada");
    }
    const falda = eventsOf(PLAN.falda.mapId);
    const exit = falda.find((entry) => entry.name === PLAN.falda.newName);
    ok(exit, `la falda no tiene salida al mundo (${PLAN.falda.newName})`);
    if (exit) {
      const home = transfersOf(exit)[0];
      ok(home && home.map === PLAN.collapse.mapId, "la falda ya no vuelve al mundo por la torre");
      if (home) ok(cellOpen(home.map, home.x, home.y), "la salida de la falda aterriza en celda bloqueada");
    }
    ok(!falda.some((entry) => transfersOf(entry).some((t) => t.map === PLAN.oakLab.mapId)),
      "la falda todavía devuelve al laboratorio de Oak");
  }

  // 3. Liga Oscura: sin menú de niebla, con umbral que exige las ocho purgas.
  {
    const cumbre = eventsOf(PLAN.darkLeague.gate.mapId);
    ok(!cumbre.some((entry) => entry.name === PLAN.darkLeague.gate.eventName),
      "la cumbre conserva el menú de las siete puertas");
    const gate = cumbre.find((entry) => entry.name === PLAN.darkLeague.gate.newName);
    ok(gate, "falta el umbral de la Liga Oscura en la cumbre");
    if (gate) {
      const list = gate.pages[0].list;
      ok(list.some((command) => command.code === 111 && Number(command.params[0]) === 1
        && Number(command.params[1]) === COUNTER && Number(command.params[3]) === PLAN.finalGoal
        && Number(command.params[4]) === 1), "el umbral no exige las ocho purgas");
      const target = transfersOf(gate)[0];
      ok(target && target.map === PLAN.darkLeague.maps[0].mapId, "el umbral no lleva a la Liga Oscura");
    }
    for (const spec of PLAN.darkLeague.maps) {
      ok(fs.existsSync(path.join(DATA, mapFile(spec.mapId))), `falta el mapa ${spec.mapId}`);
      ok(read("MapInfos.rxdata").pairs.some(([key]) => Number(key) === spec.mapId), `MapInfos no registra ${spec.mapId}`);
      ok(read("map_metadata.dat").pairs.some(([key]) => Number(key) === spec.mapId), `map_metadata no registra ${spec.mapId}`);
    }
    const arena = eventsOf(PLAN.darkLeague.maps[1].mapId).filter((entry) => entry.name.startsWith(MARKER));
    for (const boss of PLAN.darkLeague.battles) {
      const found = arena.find((entry) => entry.name === `${MARKER} ${boss.name}`);
      ok(found, `falta el combate de ${boss.name}`);
      if (!found) continue;
      ok(cellOpen(PLAN.darkLeague.maps[1].mapId, found.x, found.y), `${boss.name}: sobre celda bloqueada`);
      const first = found.pages[0].list;
      ok(first.some((command) => command.code === 111 && Number(command.params[0]) === 12
        && txt(command.params[1]).includes(`pbTrainerBattle(:${boss.type}`)
        && txt(command.params[1]).includes("true")), `${boss.name}: la batalla debe permitir perder`);
      ok(first.some((command) => command.code === 123), `${boss.name}: falta la derrota permanente`);
      ok(found.pages[1]?.condition.self === "A" && found.pages[1].condition.selfValid, `${boss.name}: la revancha debe colgar del self-switch A`);
      ok(found.pages[1]?.list.some((command) => command.code === 102), `${boss.name}: la revancha debe pedirse por menú`);
    }
    // Retorno: la arena y el umbral siempre pueden volver al mundo.
    for (const spec of PLAN.darkLeague.maps) {
      const events = eventsOf(spec.mapId).filter((entry) => entry.name.startsWith(MARKER));
      const home = events.flatMap(transfersOf).filter((t) => t.map === PLAN.collapse.mapId);
      ok(home.length >= 1, `${spec.title}: no tiene salida directa al mundo`);
      for (const t of home) ok(cellOpen(t.map, t.x, t.y), `${spec.title}: la salida al mundo aterriza en celda bloqueada`);
    }
    const trainers = read("trainers.dat");
    for (const boss of PLAN.darkLeague.battles) {
      ok(trainers.pairs.some(([key]) => trainerKeyMatches(key, boss)), `trainers.dat: falta ${boss.name}`);
    }
  }

  // 4. Atlas Mil: capitán en Carmín, barco de vuelta en el muelle.
  {
    const atlas = PLAN.atlas;
    const captain = eventsOf(atlas.captainMap).find((entry) => entry.name.startsWith(ATLAS_MARKER));
    ok(captain, "no hay capitán en Ciudad Carmín");
    if (captain) {
      ok(cellOpen(atlas.captainMap, captain.x, captain.y), "el capitán está sobre celda bloqueada");
      const list = captain.pages[1].list;
      ok(list.some((command) => command.code === 111 && Number(command.params[0]) === 0 && Number(command.params[1]) === atlas.gate),
        "el capitán no comprueba que el Cronista abrió el Atlas");
      const out = transfersOf(captain)[0];
      ok(out && out.map === atlas.dock.mapId, "el capitán no lleva al muelle de Atlas Mil");
      if (out) ok(cellOpen(out.map, out.x, out.y), "la llegada al muelle está bloqueada");
    }
    const dock = eventsOf(atlas.dock.mapId).filter((entry) => entry.name.startsWith(ATLAS_MARKER));
    const back = dock.find((entry) => transfersOf(entry).some((t) => t.map === atlas.captainMap));
    ok(back, "el muelle no tiene barco de vuelta a Ciudad Carmín");
    if (back) {
      const home = transfersOf(back).find((t) => t.map === atlas.captainMap);
      ok(cellOpen(home.map, home.x, home.y), "el barco de vuelta aterriza en celda bloqueada");
    }
    ok(dock.some((entry) => transfersOf(entry).some((t) => t.map === atlas.portMap)), "el muelle no conecta con Puerto Horizonte");
    ok(fs.existsSync(path.join(DATA, mapFile(atlas.dock.mapId))), "falta el mapa del muelle");
    ok(read("MapInfos.rxdata").pairs.some(([key]) => Number(key) === atlas.dock.mapId), "MapInfos no registra el muelle");
  }

  // 5. Isla Espejo: cadena completa mansión -> sótano -> isla -> sótano.
  {
    const mirror = PLAN.mirror;
    ok(fs.existsSync(path.join(DATA, mapFile(mirror.basement.mapId))), "falta el sótano sellado");
    const hatch = eventsOf(mirror.mansionMap).find((entry) => entry.name.startsWith(MIRROR_MARKER));
    ok(hatch, "no hay escotilla en la Mansión Pokémon");
    if (hatch) {
      ok(hatch.pages[1]?.condition.sw1 === POSTGAME && hatch.pages[1].condition.sw1valid,
        "la escotilla de la mansión debe esperar al postgame");
      const down = transfersOf(hatch)[0];
      ok(down && down.map === mirror.basement.mapId, "la escotilla no baja al sótano");
      if (down) ok(cellOpen(down.map, down.x, down.y), "la llegada al sótano está bloqueada");
    }
    const basement = eventsOf(mirror.basement.mapId);
    const mirrorEvent = basement.find((entry) => entry.name === `${MIRROR_MARKER} Espejo`);
    ok(mirrorEvent, "falta el espejo del sótano");
    if (mirrorEvent) {
      const across = transfersOf(mirrorEvent)[0];
      ok(across && across.map === mirror.islandMap, "el espejo no cruza a la Isla Espejo");
      if (across) ok(cellOpen(across.map, across.x, across.y), "la llegada a la isla está bloqueada");
      ok(mirrorEvent.pages[0].list.some((command) => command.code === 101 && txt(command.params[0]).includes("\\ch[1,2,Cruzar,Retirarse]")),
        "el espejo no pregunta si cruzar el umbral");
      ok(mirrorEvent.pages[0].list.some((command) => command.code === 101 || command.code === 401
        ? txt(command.params[0]).includes(mirrorAskSnippet()) : false),
        "el espejo debe avisar antes de ofrecer el paso");
    }
    ok(basement.some((entry) => transfersOf(entry).some((t) => t.map === mirror.mansionMap)), "el sótano no sube a la mansión");
    const back = eventsOf(mirror.islandMap).find((entry) => entry.name === `${MIRROR_MARKER} Espejo de vuelta`);
    ok(back, "falta el espejo de vuelta en el atrio");
    if (back) {
      const home = transfersOf(back)[0];
      ok(home && home.map === mirror.basement.mapId, "el espejo de vuelta no regresa al sótano");
      if (home) ok(cellOpen(home.map, home.x, home.y), "el regreso del espejo aterriza en celda bloqueada");
    }
    const ferry = eventsOf(mirror.islandMap).some((entry) => transfersOf(entry).some((t) => t.map === 33));
    ok(ferry, "se perdió el ferry original de Pueblo Paleta");
  }

  // 6. Laboratorio de Oak: sin cápsula nueva y con Oak como consejero.
  {
    const lab = eventsOf(PLAN.oakLab.mapId);
    ok(!lab.some((entry) => entry.name.startsWith(HUB_MARKER)), "la cápsula central nueva sigue en el laboratorio");
    const oak = lab.find((entry) => entry.name === PLAN.oakLab.name);
    ok(oak, "falta el Oak consejero");
    if (oak) {
      ok(cellOpen(PLAN.oakLab.mapId, oak.x, oak.y), "el Oak consejero está sobre celda bloqueada");
      ok(oak.pages[1].condition.sw1 === POSTGAME, "el Oak consejero no depende del postgame");
      ok(oak.pages[1].list.every((command) => command.code !== 201), "Oak no debe teletransportar a nadie");
      ok(oak.pages[1].list.some((command) => command.code === 401 && txt(command.params[0]).includes("\\v[264]")),
        "Oak debe leer el contador de purgas");
    }
    for (const id of [15, 16]) {
      const original = lab.find((entry) => entry.id === id);
      ok(original, `se perdió el transportador original ${id} del laboratorio`);
    }
    ok(fs.existsSync(path.join(characterDir, `${PLAN.oakLab.sprite}.png`)), "falta el sprite de Oak");
  }

  // 7. Regla global: ningún menú de destinos nuevo.
  for (const mapId of [...PLAN.rifts.map((r) => r.world.mapId), PLAN.collapse.mapId, PLAN.darkLeague.gate.mapId,
    PLAN.atlas.captainMap, PLAN.atlas.dock.mapId, PLAN.mirror.mansionMap, PLAN.mirror.basement.mapId,
    PLAN.mirror.islandMap, PLAN.oakLab.mapId, ...PLAN.darkLeague.maps.map((m) => m.mapId)]) {
    for (const entry of eventsOf(mapId)) {
      if (!entry.name.startsWith(MARKER) && !entry.name.startsWith(MIRROR_MARKER) && !entry.name.startsWith(ATLAS_MARKER)
        && entry.name !== PLAN.oakLab.name) continue;
      const destinations = new Set(transfersOf(entry).map((t) => t.map));
      ok(destinations.size <= 1, `${entry.name} (mapa ${mapId}): reparte varios destinos como un menú`);
    }
  }

  if (errors.length) throw new Error(`Expansión Multiversal inválida (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: ${PLAN.rifts.length} grietas con Entrar/Retirarse y retorno al mundo,` +
    ` punto de colapso con ${PLAN.purgeGoal} purgas, Liga Oscura (${PLAN.darkLeague.maps.length} mapas,` +
    ` ${PLAN.darkLeague.battles.length} combates que se pueden perder), capitán de Atlas Mil,` +
    ` espejo de Isla Canela y laboratorio de Oak sin cápsula nueva.`);
}

if (!VERIFY_ONLY) {
  backup(["MapInfos.rxdata", "map_metadata.dat", "trainers.dat", "species.dat"]);
  const placed = installRifts();
  installEmissionReturns(placed);
  const collapseCell = installCollapse();
  installFaldaExit(collapseCell);
  installDarkLeagueTrainers();
  installDarkLeague(collapseCell);
  installAtlas();
  installMirror();
  const lab = installOakLab();
  console.log(`Expansión Multiversal instalada. Cápsulas retiradas del laboratorio: ${lab.removed}. ` +
    `Eventos del laboratorio ahora: ${lab.total}. Backup: ${path.relative(ROOT, BACKUP)}`);
}
verify();
