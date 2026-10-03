#!/usr/bin/env node
/**
 * apply_dimensional_nightmare_battles.mjs — E4 fase B: jefes completos, trainers y objetos.
 *
 * Sobre lo ya instalado por `apply_dimensional_nightmare_events.mjs`:
 *   1. OBJETOS: registra en `items.dat` las recompensas del ciclo (`DN_PAGE_*`, `DN_ANCLA`, etc.)
 *      con su icono 48×48 en `Graphics/Items/` (sin icono el juego puede fallar al mostrarlos).
 *   2. TRAINERS: registra en `trainers.dat` los 9 entrenadores de fase A (`DN_EPxx_A`, `DN_Wx_A`)
 *      con los equipos que cada doc declara, sin sustituir entrenadores base.
 *   3. FASE B: instala los eventos de escenario que el doc pide para cada jefe con un contador
 *      independiente por mundo (v289–v297), gated por la victoria de fase A y el paso anterior.
 *      Cada paso se cierra con self-switch A; sólo el último sella el episodio, actualiza la
 *      resonancia, entrega la recompensa y activa la página de epílogo.
 *
 * No toca partidas. Backups en `pokemon_fire_ash/PokeModBackups/dimensional_nightmare_battles_originals/`.
 *
 * Uso:
 *   node tools/apply_dimensional_nightmare_battles.mjs --all
 *   node tools/apply_dimensional_nightmare_battles.mjs --episode EP01
 *   node tools/apply_dimensional_nightmare_battles.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseMap } from "../web/js/rmxp.js";
import { passabilityOf } from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const ITEM_ICONS = path.join(GAME, "Graphics", "Items");
const BACKUP = path.join(GAME, "PokeModBackups", "dimensional_nightmare_battles_originals");
const BLUEPRINT = path.join(ROOT, "content", "dimensional_nightmare_events.json");
const BUILT = path.join(ROOT, "content", "dimensional_nightmare_events_built.json");
const CATALOG = path.join(ROOT, "content", "dimensional_nightmare_battles_built.json");

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const EPISODE = option("--episode", null);
const ALL = argv.includes("--all");
const VERIFY = argv.includes("--verify");
const DRY = argv.includes("--dry-run");

// Fase A: switches 903–908 / 928–930. Fase B: contadores propios 289–297; v264 queda externo/read-only.
const PHASE_B_VARIABLE_BASE = 289; // un contador independiente para cada uno de los nueve mundos
const ITEM_ID_BASE = 1032;       // ids libres de items.dat
const PHASE_A_SWITCHES = Object.freeze({
  EP01: 903, EP02: 904, EP03: 905, EP04: 906, EP05: 907, EP06: 908,
  W7: 928, W8: 929, W9: 930,
});
const WITNESS_SEALS = [883, 884, 885, 886, 887, 888, 922, 923, 924];
const WITNESS_CHECK = `begin; $game_switches[931] = [${WITNESS_SEALS.map((id) => `$game_switches[${id}]`).join(", ")}].all?; rescue; end`;
const ROTOM_LEVEL_UPDATE =
  "$game_variables[275] = 0; $game_variables[275] = 1 if $game_variables[265] >= 20; " +
  "$game_variables[275] = 2 if $game_variables[265] >= 40; $game_variables[275] = 3 if $game_variables[265] >= 60; " +
  "$game_variables[275] = 4 if $game_variables[265] >= 80; $game_variables[275] = 5 if $game_variables[265] >= 100";
function phaseASwitch(ep) {
  const id = ep.bossSwitch ?? PHASE_A_SWITCHES[ep.key];
  if (!id) throw new Error(`${ep.key}: falta switch de fase A`);
  return id;
}
function phaseBVariable(ep) {
  const index = bossEpisodes.findIndex((candidate) => candidate.key === ep.key);
  if (index < 0) throw new Error(`${ep.key}: falta índice de variable de fase B`);
  return PHASE_B_VARIABLE_BASE + index;
}
function phaseBTotal(ep) {
  const spec = ep.boss.phaseB;
  return spec.maps?.length || spec.cells?.length || (spec.kind === "letras" ? 7 : 4);
}

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => { if (!DRY) fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value))); };
const S = (v) => RString.fromText(String(v));
const Sym = (v) => new RSymbol(String(v));
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;

const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT, "utf8"));
const bossEpisodes = blueprint.episodes.filter((episode) => episode.boss);
const built = fs.existsSync(BUILT) ? JSON.parse(fs.readFileSync(BUILT, "utf8")).maps ?? {} : {};
const episodes = blueprint.episodes.filter((ep) => ep.boss && (ALL || !EPISODE || ep.key === EPISODE));
const warnings = [];
const result = { generatedBy: "tools/apply_dimensional_nightmare_battles.mjs", flags: { phaseASwitches: PHASE_A_SWITCHES, phaseBCounterBase: PHASE_B_VARIABLE_BASE, witnessSwitch: 931, itemIdBase: ITEM_ID_BASE }, episodes: {}, items: [] };

// --------------------------------------------------------------- RMXP bits
const cmd = (code, params = [], indent = 0) => new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
const script = (text) => cmd(355, [S(text)]);
const texts = (lines) => [cmd(101, [S("")]), ...[].concat(lines).map((line) => cmd(401, [S(line)]))];
const condition = ({ sw = 0, sw2 = 0, self = "", variable = null } = {}) => new RObject("RPG::Event::Page::Condition", [
  ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
  ["@switch2_valid", !!sw2], ["@switch2_id", sw2 || 1],
  ["@variable_valid", !!variable], ["@variable_id", variable ? variable[0] : 1], ["@variable_value", variable ? variable[1] : 0],
  ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
]);
const graphic = (charName = "", dir = 2, pattern = 1, opts = {}) => new RObject("RPG::Event::Page::Graphic", [
  ["@tile_id", opts.tile ?? 0], ["@character_name", S(charName)], ["@character_hue", 0],
  ["@direction", dir], ["@pattern", pattern], ["@opacity", opts.opacity ?? 255], ["@blend_type", 0],
]);
const moveRoute = () => new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]);
const page = ({ cond = condition(), gfx = graphic(), trigger = 0, through = false, list = [cmd(0)] } = {}) => new RObject("RPG::Event::Page", [
  ["@condition", cond], ["@graphic", gfx],
  ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
  ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
  ["@direction_fix", false], ["@through", through], ["@always_on_top", false],
  ["@trigger", trigger], ["@list", list],
]);
const event = (id, name, x, y, pages) => new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
const selfSwitch = (channel = "A", indent = 0) => cmd(123, [S(channel), 0], indent);

/** Máscara transitable de un mapa del ciclo (misma fuente que el instalador de E4). */
const masks = {};
function maskOf(mapId) {
  if (masks[mapId]) return masks[mapId];
  const parsed = parseMap(read(mapFile(mapId)));
  const pass = passabilityOf(parsed, parsed.tilesetId);
  masks[mapId] = { pass, width: parsed.width, height: parsed.height };
  return masks[mapId];
}
const walkAt = (mask, x, y) => x >= 0 && y >= 0 && x < mask.width && y < mask.height && mask.pass.passable(x, y, 8);

// ------------------------------------------------------------ items.dat
function installItems(list) {
  const items = read("items.dat");
  const ids = new Set(items.pairs.filter(([k]) => k instanceof RSymbol).map(([k]) => k.name));
  let next = Math.max(-1, ...items.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  next = Math.max(next, ITEM_ID_BASE);
  let added = 0;
  for (const item of list) {
    if (ids.has(item.id)) continue;
    const obj = new RObject("GameData::Item", [
      ["@id", Sym(item.id)], ["@id_number", next],
      ["@real_name", S(item.name)], ["@real_name_plural", S(item.namePlural ?? item.name)],
      ["@pocket", 8], ["@price", 0],
      ["@real_description", S(item.description)],
      ["@field_use", 0], ["@battle_use", 0], ["@type", 0], ["@move", null],
    ]);
    items.pairs.push([next, obj], [Sym(item.id), obj]);
    result.items.push({ id: item.id, idNumber: next });
    next++;
    added++;
  }
  write("items.dat", items);
  return added;
}

/** Icono 48×48: pergamino con el número de página (o el Ancla). */
function installItemIcons(list) {
  if (DRY) return 0;
  fs.mkdirSync(ITEM_ICONS, { recursive: true });
  let drawn = 0;
  for (const item of list) {
    const file = path.join(ITEM_ICONS, `${item.id}.png`);
    if (fs.existsSync(file)) continue;
    const canvas = createCanvas(48, 48);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(0, 0, 48, 48);
    if (item.photo) {
      ctx.fillStyle = "#efe9dc";
      ctx.fillRect(6, 6, 36, 30);                 // copia
      ctx.fillStyle = item.photo === 4 ? "#f7f7f2" : "#5c6b7a";
      ctx.fillRect(9, 9, 30, 20);                 // imagen (la 4ª está en blanco)
      ctx.strokeStyle = "#2b2b2b";
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, 36, 30);
      ctx.fillStyle = "#2b2b2b";
      ctx.fillRect(6, 36, 36, 6);                 // pie de foto
      ctx.fillStyle = "#c9a227";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(item.photo), 24, 39);
      fs.writeFileSync(file, canvas.toBuffer("image/png"));
      drawn++;
      continue;
    }
    ctx.fillStyle = item.page ? "#e8dcc0" : "#7fd8ff";
    ctx.fillRect(4, 3, 40, 42);
    ctx.strokeStyle = "#8a7856";
    ctx.strokeRect(4.5, 3.5, 39, 41);
    ctx.fillStyle = "#3a2f1c";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.page ? String(item.page) : "⚓", 24, 25);
    fs.writeFileSync(file, canvas.toBuffer("image/png"));
    drawn++;
  }
  return drawn;
}

// ------------------------------------------------------------ trainers.dat
function dataSymbols(file) {
  const ids = new Set();
  for (const [key] of read(file).pairs) if (key instanceof RSymbol) ids.add(key.name);
  return ids;
}
function pokemonData([species, level]) {
  return new RHash([[Sym("species"), Sym(species)], [Sym("level"), level]]);
}
function installTrainers(roster) {
  const species = dataSymbols("species.dat");
  const types = dataSymbols("trainer_types.dat");
  const items = dataSymbols("items.dat");
  for (const boss of roster) {
    if (!types.has(boss.type)) warnings.push(`${boss.trainer}: tipo de entrenador inexistente ${boss.type}`);
    if (boss.reward && !items.has(boss.reward)) warnings.push(`${boss.trainer}: recompensa inexistente ${boss.reward}`);
    for (const [sp] of boss.team) if (!species.has(sp)) warnings.push(`${boss.trainer}: especie inexistente ${sp}`);
  }
  const trainers = read("trainers.dat");
  let next = Math.max(-1, ...trainers.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  let added = 0;
  for (const boss of roster) {
    const key = [Sym(boss.type), S(boss.name), 0];
    const existing = trainers.pairs.find(([k]) => Array.isArray(k) && txt(k[1]) === boss.name && k[2] === 0);
    let trainerId = next;
    let obj;
    if (existing) {
      // Upsert the DN trainer: updating a curated EP06 roster must not leave the
      // stale all-Unown Lv120–125 party from an earlier build in trainers.dat.
      const existingKey = existing[0];
      obj = existing[1];
      trainerId = obj.getIvar("@id_number");
      existingKey[0] = key[0];
      existingKey[1] = key[1];
      existingKey[2] = 0;
      obj.setIvar("@id", existingKey);
      obj.setIvar("@trainer_type", key[0]);
      obj.setIvar("@real_name", S(boss.name));
      obj.setIvar("@version", 0);
      obj.setIvar("@items", [Sym("FULLRESTORE")]);
      obj.setIvar("@real_lose_text", S(boss.loss ?? "..."));
      obj.setIvar("@pokemon", boss.team.map(pokemonData));
    } else {
      obj = new RObject("GameData::Trainer", [
        ["@id", key], ["@id_number", trainerId], ["@trainer_type", key[0]],
        ["@real_name", S(boss.name)], ["@version", 0], ["@items", [Sym("FULLRESTORE")]],
        ["@real_lose_text", S(boss.loss ?? "...")], ["@numpkmn", 0], ["@guara", 0],
        ["@pokemon", boss.team.map(pokemonData)],
      ]);
      trainers.pairs.push([trainerId, obj], [key, obj]);
      next++;
      added++;
    }
    const prior = result.episodes[boss.episode] ?? {};
    const trainerRecord = { role: boss.role ?? "phaseA", trainer: boss.trainer, type: boss.type, name: boss.name, trainerId };
    const records = [...(prior.trainers ?? []), trainerRecord];
    result.episodes[boss.episode] = {
      ...prior,
      trainers: records,
      ...(trainerRecord.role === "final" ? { finalTrainer: trainerRecord.trainer, finalTrainerId: trainerId } : { trainer: boss.trainer, trainerId }),
    };
  }
  write("trainers.dat", trainers);
  return added;
}

// ------------------------------------------------------------ fase B (eventos)
const phaseBText = (spec, index) => spec.texts?.[index] ?? `${spec.noun} ${index + 1}`;
const KINGGUS_LETTERS = ["K", "I", "N", "G", "G", "U", "S"];
const KINGGUS_PREREQUISITES = [883, 884, 885, 886, 887];

/** Las siete letras son un puzzle previo a las batallas del Rey, no su fase posterior. */
function kinggusLetterStep(ep, index, total) {
  const letter = KINGGUS_LETTERS[index];
  const variable = phaseBVariable(ep);
  const seals = KINGGUS_PREREQUISITES.map((switchId) => `$game_switches[${switchId}]`).join(" && ");
  const prerequisites = `${seals} && $game_variables[264].to_i >= 7`;
  const inOrder = `$game_variables[${variable}].to_i == ${index}`;
  const list = [
    ...texts([`Pedestal ${index + 1}/7. La inscripción pide formar K-I-N-G-G-U-S de principio a fin.`]),
    cmd(111, [12, S(prerequisites)]),
    cmd(111, [12, S(inOrder)], 1),
    ...texts([`La letra ${letter} queda en su lugar. El suelo conserva el orden.`], 2),
    script(`$game_variables[${variable}] = ${index + 1}`, 2),
    ...(index === total - 1 ? texts(["La S completa KINGGUS. El Rey se levanta: primero deletreará; después dejará de tener letra."], 2) : []),
    selfSwitch("A", 2),
    cmd(411, [], 1),
    ...texts([`Esta letra llega después. La secuencia correcta es K-I-N-G-G-U-S; busca la siguiente letra pendiente.`], 2),
    cmd(412, [], 1),
    cmd(411),
    ...texts(["La puerta aún no reconoce el itinerario: sella EP01–EP05 y llega con las siete emisiones de Monte Silver (v264 = 7). No se modifica ese contador."], 1),
    cmd(412),
    cmd(0),
  ];
  const donePage = page({
    cond: condition({ self: "A" }), gfx: graphic(""), through: true,
    list: [...texts([`La letra ${letter} permanece escrita en el pedestal.`]), cmd(0)],
  });
  return [page({ cond: condition(), gfx: graphic(""), trigger: 0, through: true, list }), donePage];
}

/** Un paso ordenado, de un solo uso; el último cierra el episodio y sus flags dependientes. */
function phaseBStep(ep, spec, index, total) {
  if (ep.key === "EP06") return kinggusLetterStep(ep, index, total);
  const last = index === total - 1;
  const switchA = phaseASwitch(ep);
  const variable = phaseBVariable(ep);
  const list = [
    ...texts([phaseBText(spec, index)]),
    script(`$game_variables[${variable}] += 1`),
  ];
  if (last) {
    list.push(...texts([`El último gesto cierra el episodio: ${ep.bossName} se hunde.`]));
    list.push(cmd(121, [ep.seal, ep.seal, 0]));
    list.push(script(`$game_variables[265] = [$game_variables[265] + ${ep.resonance}, 100].min`));
    list.push(script(ROTOM_LEVEL_UPDATE));
    list.push(script(`begin; pbItemBall(:${ep.boss.reward}); rescue; pbMessage("(recompensa ${ep.boss.reward} pendiente)"); end`));
    if (ep.grieta) list.push(cmd(121, [ep.grieta, ep.grieta, 0]));
    list.push(script(WITNESS_CHECK));
  }
  // Cierra el evento después de todas las escrituras: cambiar de página no puede cortar el contador ni la recompensa.
  list.push(selfSwitch("A"));
  list.push(cmd(0));
  const usedPage = page({
    cond: condition({ sw: switchA, variable: [variable, index] }),
    gfx: graphic(""), trigger: 0, through: true, list,
  });
  const donePage = page({
    cond: condition({ self: "A" }), gfx: graphic(""), through: true,
    list: [...texts([`Este paso (${index + 1}/${total}) ya quedó registrado.`]), cmd(0)],
  });
  return [usedPage, donePage];
}

function installPhaseB(ep) {
  const spec = ep.boss.phaseB;
  const bossMap = ep.mapRange.to;
  // Los pasos pueden venir como celdas del mapa del jefe, como mapas sueltos (fogatas del EP03)
  // o sin ubicación (se reparten alrededor de la entrada del mapa del jefe).
  const targets = [];
  if (spec.maps?.length) {
    for (const mapId of spec.maps) targets.push([mapId, null]);
  } else if (spec.cells?.length) {
    for (const cell of spec.cells) targets.push([bossMap, cell]);
  }
  const total = targets.length || (spec.kind === "letras" ? 7 : 4);
  // sin celdas declaradas: se reparten en anillo alrededor de la entrada del mapa del jefe
  const fallbackCells = [];
  if (!targets.length) {
    const mask = maskOf(bossMap);
    const entry = built[bossMap]?.entry ?? [Math.floor(mask.width / 2), Math.floor(mask.height / 2)];
    for (let i = 0; i < total; i++) {
      const angle = (Math.PI * 2 * i) / total;
      const x = Math.min(mask.width - 2, Math.max(1, Math.round(entry[0] + Math.cos(angle) * 4)));
      const y = Math.min(mask.height - 2, Math.max(1, Math.round(entry[1] + Math.sin(angle) * 3)));
      fallbackCells.push([bossMap, [x, y]]);
    }
    warnings.push(`${ep.key}: la fase B (${spec.kind}) no declara celdas; se reparten alrededor de la entrada de ${bossMap}`);
  }

  const placed = [];
  const byMap = new Map();
  const used = new Map();   // celdas ya ocupadas por otros eventos (o por pasos previos)
  for (let i = 0; i < total; i++) {
    const [mapId, declared] = targets[i] ?? fallbackCells[i];
    const mask = maskOf(mapId);
    if (!used.has(mapId)) {
      const taken = new Set();
      for (const [, ev] of read(mapFile(mapId)).getIvar("@events").pairs) {
        // los pasos propios de este episodio no bloquean su propia celda declarada:
        // sin esto, cada pasada de dn:battles movía un poco los marcadores de fase B.
        if ((ev.getIvar("@name")?.text ?? "").startsWith(`BOSSB_${ep.key}_`)) continue;
        taken.add(`${ev.getIvar("@x")},${ev.getIvar("@y")}`);
      }
      used.set(mapId, taken);
    }
    const taken = used.get(mapId);
    // sin celda declarada: junto a la entrada de ese mapa
    const entryCell = built[mapId]?.entry ?? [Math.floor(mask.width / 2), Math.floor(mask.height / 2)];
    let [x, y] = declared ?? entryCell;
    if (!walkAt(mask, x, y) || taken.has(`${x},${y}`)) {
      // celda declarada fuera del suelo: se busca la transitable más cercana
      let best = null, bestD = Infinity;
      for (let j = 1; j < mask.height - 1; j++) {
        for (let k = 1; k < mask.width - 1; k++) {
          if (!walkAt(mask, k, j) || taken.has(`${k},${j}`)) continue;
          const d = Math.abs(k - x) + Math.abs(j - y);
          if (d < bestD) { bestD = d; best = [k, j]; }
        }
      }
      if (best) {
        if (declared) warnings.push(`${ep.key}: ${spec.noun} ${i + 1} movida de ${x},${y} a ${best[0]},${best[1]} (celda ocupada o bloqueada)`);
        [x, y] = best;
      } else {
        warnings.push(`${ep.key}: sin sitio libre para ${spec.noun} ${i + 1} en Map${mapId}`);
      }
    }
    taken.add(`${x},${y}`);
    if (!byMap.has(mapId)) byMap.set(mapId, []);
    byMap.get(mapId).push({ index: i, cell: [x, y] });
  }

  for (const [mapId, steps] of byMap) {
    const mapObject = read(mapFile(mapId));
    const hash = mapObject.getIvar("@events");
    let nextId = Math.max(0, ...hash.pairs.map(([k]) => Number(k))) + 1;
    for (const step of steps) {
      const name = `BOSSB_${ep.key}_${step.index + 1}`;
      const existing = hash.pairs.find(([, ev]) => ev.getIvar("@name")?.text === name);
      const built_event = event(nextId, name, step.cell[0], step.cell[1], phaseBStep(ep, spec, step.index, total));
      if (existing) existing[1] = built_event;
      else hash.pairs.push([nextId, built_event]);
      nextId++;
      placed.push({ map: mapId, cell: step.cell, step: step.index + 1 });
    }
    mapObject.setIvar("@events", hash);
    write(mapFile(mapId), mapObject);
  }
  return { kind: spec.kind, total, counterVariable: phaseBVariable(ep), phaseASwitch: phaseASwitch(ep), placed };
}

/** Epílogo del jefe: la última página del evento jefe pasa a depender del sello del episodio. */
function installBossEpilogue(ep) {
  const bossMap = ep.mapRange.to;
  const mapObject = read(mapFile(bossMap));
  const hash = mapObject.getIvar("@events");
  const boss = hash.pairs.find(([, ev]) => (ev.getIvar("@name")?.text ?? "").startsWith(`EV_${ep.key}_JEFE`));
  if (!boss) { warnings.push(`${ep.key}: no se encontró EV_${ep.key}_JEFE en ${bossMap}`); return false; }
  const pages = boss[1].getIvar("@pages");
  const epilogue = [page({
    cond: condition({ sw: ep.seal, sw2: phaseASwitch(ep), variable: [phaseBVariable(ep), phaseBTotal(ep)] }),
    gfx: graphic(""), list: [...texts([`${ep.bossName} ya no está. El sello aguanta (resonancia v265).`]), cmd(0)],
  })];
  const already = pages.some((p) => {
    const cond = p.getIvar("@condition");
    return cond?.getIvar("@switch1_id") === ep.seal && cond?.getIvar("@switch1_valid")
      && cond?.getIvar("@switch2_id") === phaseASwitch(ep) && cond?.getIvar("@switch2_valid")
      && cond?.getIvar("@variable_id") === phaseBVariable(ep)
      && cond?.getIvar("@variable_value") === phaseBTotal(ep)
      && cond?.getIvar("@variable_valid");
  });
  if (already) return true;
  pages.push(epilogue[0]);
  boss[1].setIvar("@pages", pages);
  mapObject.setIvar("@events", hash);
  write(mapFile(bossMap), mapObject);
  return true;
}

function bossEvent(mapObject, name) {
  const hash = mapObject.getIvar("@events");
  const pair = hash?.pairs.find(([, ev]) => txt(ev.getIvar("@name")) === name);
  return pair ? { hash, pair, event: pair[1] } : null;
}

function replaceTrainerBattleCondition(mapObject, name, replacement) {
  const found = bossEvent(mapObject, name);
  if (!found) return 0;
  let changed = 0;
  for (const eventPage of found.event.getIvar("@pages") ?? []) {
    for (const command of eventPage.getIvar("@list") ?? []) {
      if (command.getIvar("@code") !== 111) continue;
      const params = command.getIvar("@parameters") ?? [];
      if (params[0] !== 12 || !txt(params[1]).includes("pbTrainerBattle")) continue;
      params[1] = S(replacement);
      command.setIvar("@parameters", params);
      changed++;
    }
  }
  return changed;
}

function installEp05Mirror(mapId, name, mirrorName) {
  const mapObject = read(mapFile(mapId));
  const found = bossEvent(mapObject, name);
  if (!found) { warnings.push(`EP05: falta ${name} en Map${mapId}`); return false; }
  const battleCall = `begin; dn_mirror_battle(${JSON.stringify(mirrorName)}); rescue; pbMessage("El espejo se repliega sin alterar tu equipo."); false; end`;
  const changed = replaceTrainerBattleCondition(mapObject, name, battleCall);
  if (name === "EV_BLK_Espejo") {
    const choiceList = [
      ...texts(["El Espejo ofrece tu misma composición, nivel y movimientos; ningún Pokémon ni objeto se mueve de tu equipo.", "¿Quieres probar el reflejo ahora?"]),
      cmd(102, [[S("Enfrentar"), S("Luego")], 1]),
      cmd(402, [0, S("Enfrentar")]),
      cmd(111, [12, S(`dn_mirror_battle("${mirrorName}")`)], 1),
      ...texts(["El reflejo se disuelve. No ha podido recordar quién es su dueño."], 2),
      selfSwitch("A", 2),
      cmd(411, [], 1),
      ...texts(["La forma se deshace, pero el mausoleo conserva el combate. Puedes volver a intentarlo."], 2),
      cmd(412, [], 1),
      cmd(402, [1, S("Luego")]),
      ...texts(["El espejo espera en silencio. La salida sigue libre."], 1),
      cmd(404), cmd(0),
    ];
    const done = page({ cond: condition({ self: "A" }), gfx: graphic(""), list: [...texts(["El reflejo ya reconoció que este equipo es tuyo." ]), cmd(0)] });
    found.event.setIvar("@pages", [page({ cond: condition(), gfx: graphic(""), trigger: 0, list: choiceList }), done]);
  }
  found.hash.pairs[found.hash.pairs.indexOf(found.pair)][1] = found.event;
  mapObject.setIvar("@events", found.hash);
  write(mapFile(mapId), mapObject);
  return changed > 0 || name === "EV_BLK_Espejo";
}

function kinggusCompletionCommands(ep, indent = 1) {
  return [
    ...texts(["El Rey deja caer el Ancla del Testigo. Las siete letras quedan guardadas; el camino de salida vuelve a abrirse."], indent),
    cmd(121, [phaseASwitch(ep), phaseASwitch(ep), 0], indent),
    cmd(121, [ep.seal, ep.seal, 0], indent),
    script(`$game_variables[265] = [$game_variables[265] + ${ep.resonance}, 100].min`, indent),
    script(ROTOM_LEVEL_UPDATE, indent),
    script(`begin; pbItemBall(:${ep.boss.reward}); rescue; pbMessage("(recompensa ${ep.boss.reward} pendiente)"); end`, indent),
    ...(ep.grieta ? [cmd(121, [ep.grieta, ep.grieta, 0], indent)] : []),
    script(WITNESS_CHECK, indent),
  ];
}

function installEp06FinalBoss(ep) {
  const mapId = ep.mapRange.to;
  const mapObject = read(mapFile(mapId));
  const found = bossEvent(mapObject, `EV_${ep.key}_JEFE`);
  if (!found) { warnings.push(`EP06: falta EV_${ep.key}_JEFE en Map${mapId}`); return false; }
  const variable = phaseBVariable(ep);
  const sequence = "dn_kinggus_final_sequence";
  const battleBranch = (retry) => [
    ...texts([retry ? "Las siete letras siguen en orden. ¿Vuelves a afrontar las dos formas del Rey?" : "El suelo termina de deletrear KINGGUS." ]),
    cmd(111, [12, S(sequence)]),
    ...kinggusCompletionCommands(ep, 1),
    cmd(411),
    ...texts(["La Cámara del Trono restaura a tu equipo. Las letras no se pierden: prepara lo que necesites y vuelve a interactuar para reintentar."], 1),
    ...(retry ? [] : [selfSwitch("A", 1)]),
    cmd(412), cmd(0),
  ];
  const pages = [
    page({
      cond: condition({ variable: [variable, 7] }), gfx: graphic(""), trigger: 3, through: true,
      list: battleBranch(false),
    }),
    page({
      cond: condition({ self: "A" }), gfx: graphic(""), trigger: 0, through: true,
      list: battleBranch(true),
    }),
    page({
      cond: condition({ sw: phaseASwitch(ep), variable: [variable, 7] }), gfx: graphic(""), through: true,
      list: [...texts(["La Cámara reconoce las siete letras. El Rey ya no puede volver a levantarse." ]), cmd(0)],
    }),
    page({
      cond: condition({ sw: ep.seal, sw2: phaseASwitch(ep), variable: [variable, 7] }), gfx: graphic(""), through: true,
      list: [...texts(["EL REY SIN LETRA queda sellado. El Ancla y las siete letras permanecen en tu itinerario." ]), cmd(0)],
    }),
  ];
  found.event.setIvar("@pages", pages);
  found.hash.pairs[found.hash.pairs.indexOf(found.pair)][1] = found.event;
  mapObject.setIvar("@events", found.hash);
  write(mapFile(mapId), mapObject);
  return true;
}

function installBossSpecificEvents(ep) {
  if (ep.key === "EP05") {
    installEp05Mirror(2114, "EV_BLK_Espejo", "EL ESPEJO");
    const bossMap = read(mapFile(2119));
    const patched = replaceTrainerBattleCondition(bossMap, "EV_EP05_JEFE",
      'begin; dn_mirror_battle("EL JUGADOR 000"); rescue; pbMessage("El espejo se repliega sin alterar tu equipo."); false; end');
    const found = bossEvent(bossMap, "EV_EP05_JEFE");
    if (found) {
      found.hash.pairs[found.hash.pairs.indexOf(found.pair)][1] = found.event;
      bossMap.setIvar("@events", found.hash);
      write(mapFile(2119), bossMap);
    } else warnings.push("EP05: falta EV_EP05_JEFE en Map2119");
    return { mirrorMiniBoss: true, mirrorBossPagesPatched: patched };
  }
  if (ep.key === "EP06") return { finalBoss: installEp06FinalBoss(ep), lettersBeforeBattle: true };
  return {};
}

// ------------------------------------------------------------ main
const roster = episodes.flatMap((ep) => {
  const trainers = [{
    episode: ep.key, role: "phaseA", trainer: ep.boss.phaseA.trainer, type: ep.boss.phaseA.type,
    name: ep.boss.phaseA.label, team: ep.boss.team, reward: ep.boss.reward,
    loss: ep.boss.notes ?? "...",
  }];
  if (ep.boss.finalForm) trainers.push({
    episode: ep.key, role: "final", trainer: ep.boss.finalForm.trainer, type: ep.boss.finalForm.type,
    name: ep.boss.finalForm.label, team: ep.boss.finalForm.team,
    loss: ep.boss.finalForm.loss ?? "El Rey sin Letra permanece en el trono.",
  });
  return trainers;
});

const itemList = [];
for (const ep of episodes) {
  if (ep.boss.reward.startsWith("DN_PAGE_")) {
    const page = Number(ep.boss.reward.slice(-2));
    itemList.push({ id: ep.boss.reward, name: `Página Quemada ${String(page).padStart(2, "0")}`, namePlural: `Páginas Quemadas ${String(page).padStart(2, "0")}`, page, description: `Una página quemada por los bordes, rescatada del ${ep.bossName}. Forma parte del itinerario del Nightmare y queda archivada en la Gruta de los Testigos.` });
    for (let n = 1; n <= 4; n++) {
      itemList.push({
        id: `DN_PHOTO_0${n}`, name: `Foto ${n} del Sin Nombre`, namePlural: `Fotos del Sin Nombre`, photo: n,
        description: n === 4
          ? "La cuarta foto está en blanco: el nombre que aparece en ella es el de quien la sostiene."
          : `Foto ${n} rescatada de las ruinas de Lost Silver: el Sin Nombre la firmó con otra letra.`,
      });
    }
  } else if (ep.boss.reward === "DN_ANCLA") {
    itemList.push({ id: "DN_ANCLA", name: "Ancla del Testigo", namePlural: "Anclas del Testigo", page: 0, description: "El ancla que el Rey sin Letra dejó al caer: con ella el Rotom despierta y el itinerario se cierra." });
  }
}

if (VERIFY) {
  let failures = 0;
  const ok = (cond, label) => { if (!cond) { failures++; console.error(`  FALLA: ${label}`); } };
  const items = dataSymbols("items.dat");
  const trainers = read("trainers.dat");
  const trainerKeys = new Set();
  for (const [k] of trainers.pairs) if (Array.isArray(k)) trainerKeys.add(`${txt(k[1])}`);
  console.log("verificación de fase B (jefes, trainers y objetos)");
  const catalog = fs.existsSync(CATALOG) ? JSON.parse(fs.readFileSync(CATALOG, "utf8")).episodes : {};
  for (const ep of blueprint.episodes.filter((e) => e.boss)) {
    if (!ALL && EPISODE && ep.key !== EPISODE) continue;
    const info = catalog[ep.key];
    if (!info) { ok(false, `${ep.key}: sin registro de instalación`); continue; }
    ok(trainerKeys.has(ep.boss.phaseA.label), `${ep.key}: falta el trainer ${ep.boss.phaseA.label}`);
    if (ep.boss.finalForm) ok(trainerKeys.has(ep.boss.finalForm.label), `${ep.key}: falta el trainer de forma final ${ep.boss.finalForm.label}`);
    ok(items.has(ep.boss.reward), `${ep.key}: falta el objeto ${ep.boss.reward}`);
    ok(fs.existsSync(path.join(ITEM_ICONS, `${ep.boss.reward}.png`)), `${ep.key}: falta el icono ${ep.boss.reward}.png`);
    const total = info.phaseB?.total ?? 0;
    ok(total > 0, `${ep.key}: fase B sin pasos`);
    const phaseASw = phaseASwitch(ep);
    const counterVariable = phaseBVariable(ep);
    const expectedTotal = phaseBTotal(ep);
    ok(total === expectedTotal, `${ep.key}: fase B tiene ${total} pasos; el plano declara ${expectedTotal}`);
    const eventByName = (mapId, name) => {
      const mapObject = read(mapFile(mapId));
      return (mapObject.getIvar("@events")?.pairs ?? []).map(([, ev]) => ev)
        .find((ev) => txt(ev.getIvar("@name")) === name) ?? null;
    };
    const pageCondition = (pageObj) => pageObj?.getIvar("@condition");
    const pageList = (pageObj) => pageObj?.getIvar("@list") ?? [];
    const bossMap = ep.mapRange.to;
    const bossEvent = eventByName(bossMap, `EV_${ep.key}_JEFE`);
    ok(!!bossEvent, `${ep.key}: falta EV_${ep.key}_JEFE en Map${bossMap}`);
    if (bossEvent) {
      const bossPages = bossEvent.getIvar("@pages") ?? [];
      ok(bossPages.length === 4, `${ep.key}: jefe necesita 4 páginas (autorun, reintento, fase B, epílogo)`);
      const mainCommands = pageList(bossPages[0]);
      const retryCommands = pageList(bossPages[1]);
      const mainScripts = mainCommands.filter((c) => c.getIvar("@code") === 355).map((c) => txt(c.getIvar("@parameters")?.[0])).join("\n");
      const allBossScripts = bossPages.flatMap(pageList).filter((c) => c.getIvar("@code") === 355).map((c) => txt(c.getIvar("@parameters")?.[0])).join("\n");
      if (ep.key === "EP06") {
        const startCond = pageCondition(bossPages[0]);
        ok(startCond?.getIvar("@variable_valid") && startCond.getIvar("@variable_id") === counterVariable
          && startCond.getIvar("@variable_value") === total,
        "EP06: el Rey debe esperar a que las siete letras estén ordenadas");
        ok(mainCommands.some((c) => c.getIvar("@code") === 111 && txt(c.getIvar("@parameters")?.[1]).includes("dn_kinggus_final_sequence")),
          "EP06: falta la secuencia de combate intermedio + forma final");
        ok(!allBossScripts.includes(`$game_variables[${counterVariable}] = 0`), "EP06: un combate no debe borrar el puzzle de siete letras");
        const successSwitches = mainCommands.filter((c) => c.getIvar("@code") === 121).map((c) => c.getIvar("@parameters")?.[0]);
        ok(successSwitches.includes(phaseASw) && successSwitches.includes(ep.seal), "EP06: al completar ambas batallas deben activarse fase A y sello");
        ok(mainScripts.includes(`pbItemBall(:${ep.boss.reward})`) && mainScripts.includes("$game_variables[265]"),
          "EP06: la victoria final debe dar el Ancla y sumar resonancia");
        ok(mainCommands.some((c) => c.getIvar("@code") === 123 && txt(c.getIvar("@parameters")?.[0]) === "A"),
          "EP06: una derrota inicial debe dejar una página de reintento");
        const retryCond = pageCondition(bossPages[1]);
        ok(retryCond?.getIvar("@self_switch_valid") && txt(retryCond.getIvar("@self_switch_ch")) === "A",
          "EP06: falta página interactiva de reintento tras derrota");
        ok(retryCommands.some((c) => c.getIvar("@code") === 111 && txt(c.getIvar("@parameters")?.[1]).includes("dn_kinggus_final_sequence")),
          "EP06: el reintento debe ofrecer las dos formas del Rey");
        const pendingCond = pageCondition(bossPages[2]);
        ok(pendingCond?.getIvar("@switch1_valid") && pendingCond.getIvar("@switch1_id") === phaseASw,
          "EP06: falta página de jefe ya vencido");
        const endingCond = pageCondition(bossPages[3]);
        ok(endingCond?.getIvar("@switch1_id") === ep.seal && endingCond?.getIvar("@switch2_id") === phaseASw
          && endingCond?.getIvar("@variable_id") === counterVariable && endingCond?.getIvar("@variable_value") === total,
        "EP06: el epílogo no espera sello, ambas batallas y siete letras");
        ok(!/\$game_variables\[264\]\s*(?:=(?!=)|\+=|-=|\*=|\/=)/.test(allBossScripts), "EP06: altera v264, reservado a Monte Silver");
      } else {
        const battleNeedle = ep.key === "EP05" ? "dn_mirror_battle" : "pbTrainerBattle";
        const battleCommand = mainCommands.find((c) => c.getIvar("@code") === 111 && txt(c.getIvar("@parameters")?.[1]).includes(battleNeedle));
        ok(!!battleCommand, `${ep.key}: la página de fase A no evalúa su batalla`);
        const call = txt(battleCommand?.getIvar("@parameters")?.[1]);
        if (ep.key === "EP05") {
          ok(call.includes('dn_mirror_battle("EL JUGADOR 000")'), "EP05: el jefe no copia la party actual de forma temporal");
          const mirrorMap = read(mapFile(2114));
          const mirrorEvent = (mirrorMap.getIvar("@events")?.pairs ?? []).map(([, ev]) => ev)
            .find((ev) => txt(ev.getIvar("@name")) === "EV_BLK_Espejo");
          const mirrorPages = mirrorEvent?.getIvar("@pages") ?? [];
          const mirrorScripts = mirrorPages.flatMap(pageList).filter((c) => c.getIvar("@code") === 111)
            .map((c) => txt(c.getIvar("@parameters")?.[1])).join("\n");
          ok(mirrorScripts.includes('dn_mirror_battle("EL ESPEJO")'), "EP05: el miniboss del mausoleo no es un combate espejo");
          ok(mirrorPages.length === 2 && pageCondition(mirrorPages[1])?.getIvar("@self_switch_valid"),
            "EP05: el miniboss opcional no se cierra una sola vez tras la victoria");
        } else {
          ok(/false,\s*"",\s*true/.test(call), `${ep.key}: la batalla no permite perder sin bloquear la progresión`);
        }
        const successSwitch = mainCommands.find((c) => c.getIvar("@code") === 121);
        ok(successSwitch?.getIvar("@parameters")?.[0] === phaseASw
          && successSwitch?.getIvar("@parameters")?.[1] === phaseASw
          && successSwitch?.getIvar("@parameters")?.[2] === 0,
        `${ep.key}: el switch de fase A no se activa con parámetros RMXP válidos tras ganar`);
        const resetIndex = mainCommands.findIndex((c) => c.getIvar("@code") === 355
          && txt(c.getIvar("@parameters")?.[0]).includes(`$game_variables[${counterVariable}] = 0`));
        const successIndex = mainCommands.indexOf(successSwitch);
        ok(resetIndex >= 0 && successIndex > resetIndex,
          `${ep.key}: el contador de fase B debe reiniciarse antes de activar el switch de fase A`);
        const retryResetIndex = retryCommands.findIndex((c) => c.getIvar("@code") === 355
          && txt(c.getIvar("@parameters")?.[0]).includes(`$game_variables[${counterVariable}] = 0`));
        const retrySuccessIndex = retryCommands.findIndex((c) => c.getIvar("@code") === 121
          && c.getIvar("@parameters")?.[0] === phaseASw && c.getIvar("@parameters")?.[2] === 0);
        ok(retryResetIndex >= 0 && retrySuccessIndex > retryResetIndex,
          `${ep.key}: el reintento debe reiniciar fase B antes de activar su switch`);
        ok(mainCommands.some((c) => c.getIvar("@code") === 123 && txt(c.getIvar("@parameters")?.[0]) === "A"),
          `${ep.key}: tras perder el autorun no se cierra con self-switch A para permitir reintento manual`);
        const retryCond = pageCondition(bossPages[1]);
        ok(retryCond?.getIvar("@self_switch_valid") && txt(retryCond.getIvar("@self_switch_ch")) === "A",
          `${ep.key}: falta página interactiva de reintento tras derrota`);
        const pendingCond = pageCondition(bossPages[2]);
        ok(pendingCond?.getIvar("@switch1_valid") && pendingCond.getIvar("@switch1_id") === phaseASw,
          `${ep.key}: la fase B no depende del switch correcto de victoria en fase A`);
        const endingCond = pageCondition(bossPages[3]);
        ok(endingCond?.getIvar("@switch1_id") === ep.seal && endingCond?.getIvar("@switch2_id") === phaseASw
          && endingCond?.getIvar("@variable_id") === counterVariable && endingCond?.getIvar("@variable_value") === total,
        `${ep.key}: el epílogo no espera sello, victoria y contador completo de fase B`);
      }
    }
    const steps = new Map();
    for (const placed of info.phaseB?.placed ?? []) {
      const stepName = `BOSSB_${ep.key}_${placed.step}`;
      const stepEvent = eventByName(placed.map, stepName);
      ok(!!stepEvent, `${ep.key}: falta ${stepName} en Map${placed.map}`);
      if (!stepEvent) continue;
      steps.set(placed.step, stepEvent);
      const pages = stepEvent.getIvar("@pages") ?? [];
      const activeCond = pageCondition(pages[0]);
      const commands = pageList(pages[0]);
      const allPageCommands = pages.flatMap(pageList);
      const writesMonteSilver = allPageCommands.some((c) => c.getIvar("@code") === 355
        && /\$game_variables\[264\]\s*(?:=(?!=)|\+=|-=|\*=|\/=)/.test(txt(c.getIvar("@parameters")?.[0])));
      if (ep.key === "EP06") {
        ok(pages.length === 2 && !activeCond?.getIvar("@switch1_valid") && !activeCond?.getIvar("@variable_valid"),
          `${stepName}: pedestal de letra debe poder comprobar orden y prerrequisitos en su rama`);
        const branches = commands.filter((c) => c.getIvar("@code") === 111).map((c) => txt(c.getIvar("@parameters")?.[1])).join("\n");
        ok(KINGGUS_PREREQUISITES.every((switchId) => branches.includes(`$game_switches[${switchId}]`))
          && branches.includes("$game_variables[264].to_i >= 7")
          && branches.includes(`$game_variables[${counterVariable}].to_i == ${placed.step - 1}`),
        `${stepName}: debe verificar los cinco sellos, v264=7 y el orden exacto`);
        const letterWrite = commands.find((c) => c.getIvar("@code") === 355
          && txt(c.getIvar("@parameters")?.[0]).includes(`$game_variables[${counterVariable}] = ${placed.step}`));
        const lockIndex = commands.findIndex((c) => c.getIvar("@code") === 123 && txt(c.getIvar("@parameters")?.[0]) === "A");
        const letterIndex = commands.indexOf(letterWrite);
        ok(!!letterWrite && letterIndex >= 0 && lockIndex > letterIndex,
          `${stepName}: la letra ordenada debe persistir antes de cerrar el pedestal`);
        ok(pageCondition(pages[1])?.getIvar("@self_switch_valid")
          && txt(pageCondition(pages[1])?.getIvar("@self_switch_ch")) === "A",
        `${stepName}: falta recuerdo persistente de la letra resuelta`);
        ok(!writesMonteSilver, `${stepName}: altera v264, reservado al contador de Monte Silver`);
        if (placed.step === total) {
          ok(!commands.some((c) => c.getIvar("@code") === 121 && c.getIvar("@parameters")?.[0] === ep.seal),
            `${stepName}: no debe sellar EP06 antes de las batallas del Rey`);
          ok(!commands.some((c) => c.getIvar("@code") === 355
            && txt(c.getIvar("@parameters")?.[0]).includes(`pbItemBall(:${ep.boss.reward})`)),
          `${stepName}: no debe entregar el Ancla antes de la forma final`);
        }
      } else {
        ok(activeCond?.getIvar("@switch1_id") === phaseASw && activeCond?.getIvar("@switch1_valid")
          && activeCond?.getIvar("@variable_id") === counterVariable && activeCond?.getIvar("@variable_value") === placed.step - 1,
        `${stepName}: acceso no sincronizado con fase A y el paso anterior`);
        ok(pageCondition(pages[1])?.getIvar("@self_switch_valid")
          && txt(pageCondition(pages[1])?.getIvar("@self_switch_ch")) === "A",
        `${stepName}: falta cierre one-shot por self-switch A`);
        const lockIndex = commands.findIndex((c) => c.getIvar("@code") === 123 && txt(c.getIvar("@parameters")?.[0]) === "A");
        const counterIndex = commands.findIndex((c) => c.getIvar("@code") === 355
          && txt(c.getIvar("@parameters")?.[0]).includes(`$game_variables[${counterVariable}] += 1`));
        ok(lockIndex >= 0 && counterIndex >= 0 && counterIndex < lockIndex,
          `${stepName}: debe incrementar su contador antes de cerrarse con self-switch A`);
        ok(!writesMonteSilver, `${stepName}: altera v264, reservado al contador de Monte Silver`);
        for (const command of commands.filter((c) => c.getIvar("@code") === 121)) {
          const params = command.getIvar("@parameters") ?? [];
          ok(params.length >= 3 && params[0] === params[1] && (params[2] === 0 || params[2] === 1),
            `${stepName}: comando 121 con parámetros inválidos (${params.join(",")})`);
        }
        if (placed.step === total) {
          ok(commands.some((c) => c.getIvar("@code") === 121 && c.getIvar("@parameters")?.[0] === ep.seal
            && c.getIvar("@parameters")?.[1] === ep.seal && c.getIvar("@parameters")?.[2] === 0),
          `${stepName}: el último paso no enciende el sello del episodio`);
          const witnessIndex = commands.findIndex((c) => c.getIvar("@code") === 355
            && txt(c.getIvar("@parameters")?.[0]).includes("$game_switches[931]"));
          const rewardIndex = commands.findIndex((c) => c.getIvar("@code") === 355
            && txt(c.getIvar("@parameters")?.[0]).includes(`pbItemBall(:${ep.boss.reward})`));
          ok(witnessIndex >= 0, `${stepName}: no recalcula DN_TESTIGO_LISTO tras cerrar un sello`);
          ok(rewardIndex >= 0 && rewardIndex < lockIndex && witnessIndex < lockIndex,
            `${stepName}: recompensa y vitrina deben resolverse antes del cierre self-switch A`);
        }
      }
    }
    ok(steps.size === total, `${ep.key}: sólo hay ${steps.size}/${total} eventos de fase B`);
    console.log(`  ${ep.key}: ${ep.bossName} · ${info.phaseB?.kind} ×${total} (v${counterVariable}) · trainer ${ep.boss.phaseA.trainer} · objeto ${ep.boss.reward}`);
  }
  console.log(failures === 0 ? "verificación OK" : `verificación con ${failures} fallos`);
  process.exit(failures === 0 ? 0 : 1);
}

if (!DRY) {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const file of ["items.dat", "trainers.dat"]) {
    const target = path.join(BACKUP, file);
    if (!fs.existsSync(target)) fs.copyFileSync(path.join(DATA, file), target);
  }
}

const itemsAdded = installItems(itemList);
const iconsDrawn = installItemIcons(itemList);
const trainersAdded = installTrainers(roster);
for (const ep of episodes) {
  const phaseB = installPhaseB(ep);
  const epilogue = installBossEpilogue(ep);
  const mechanics = installBossSpecificEvents(ep);
  result.episodes[ep.key] = { ...(result.episodes[ep.key] ?? {}), bossName: ep.bossName, phaseB, epilogue, mechanics };
}

if (!DRY) fs.writeFileSync(CATALOG, `${JSON.stringify(result, null, 2)}\n`);
console.log(`jefes: ${episodes.length} · objetos nuevos: ${itemsAdded} (iconos ${iconsDrawn}) · trainers nuevos: ${trainersAdded}`);
for (const [key, info] of Object.entries(result.episodes)) {
  console.log(`  ${key}: fase B ${info.phaseB.kind} ×${info.phaseB.total} en ${[...new Set(info.phaseB.placed.map((p) => p.map))].map((m) => `Map${m}`).join(", ")}`);
}
if (warnings.length) {
  console.log(`avisos (${warnings.length}):`);
  for (const w of warnings.slice(0, 10)) console.log(`  - ${w}`);
}
