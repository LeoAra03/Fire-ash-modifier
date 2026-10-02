#!/usr/bin/env node
/**
 * apply_dimensional_nightmare_battles.mjs — E4 fase B: jefes completos, trainers y objetos.
 *
 * Sobre lo ya instalado por `apply_dimensional_nightmare_events.mjs`:
 *   1. OBJETOS: registra en `items.dat` los objetos clave de la saga (`DN_PAGE_01`…`DN_PAGE_06`,
 *      `DN_ANCLA`) con su icono 48×48 en `Graphics/Items/` (sin icono el juego puede fallar al
 *      mostrarlos en la mochila).
 *   2. TRAINERS: registra en `trainers.dat` los 6 entrenadores de fase A (`DN_EPxx_A`) con los
 *      equipos que el §9 de cada doc declara, sin sustituir entrenadores base.
 *   3. FASE B: instala los eventos de escenario que el doc pide para cada jefe (4 cadenas, 4 fotos,
 *      4 fogatas, 4 cunas, 4 rendijas, 7 letras) con su switch propio (910+) y su variable de
 *      conteo (277). Al completar el último paso se sella el episodio: switch del sello, resonancia,
 *      recompensa y página de epílogo del jefe.
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

// Rangos nuevos (por encima de lo reservado en el doc 10 §5: switches 882–902, variables 265–276)
const CHAIN_SWITCH_BASE = 910;   // 910..916: un switch por paso de fase B
const CHAIN_VARIABLE = 277;      // contador de pasos de la fase B del episodio en curso
const ITEM_ID_BASE = 1032;       // ids libres de items.dat

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => { if (!DRY) fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value))); };
const S = (v) => RString.fromText(String(v));
const Sym = (v) => new RSymbol(String(v));
const txt = (v) => (v instanceof RString ? v.text : String(v ?? ""));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;

const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT, "utf8"));
const built = fs.existsSync(BUILT) ? JSON.parse(fs.readFileSync(BUILT, "utf8")).maps ?? {} : {};
const episodes = blueprint.episodes.filter((ep) => ep.boss && (ALL || !EPISODE || ep.key === EPISODE));
const warnings = [];
const result = { generatedBy: "tools/apply_dimensional_nightmare_battles.mjs", flags: { chainSwitchBase: CHAIN_SWITCH_BASE, chainVariable: CHAIN_VARIABLE, itemIdBase: ITEM_ID_BASE }, episodes: {}, items: [] };

// --------------------------------------------------------------- RMXP bits
const cmd = (code, params = [], indent = 0) => new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
const script = (text) => cmd(355, [S(text)]);
const texts = (lines) => [cmd(101, [S("")]), ...[].concat(lines).map((line) => cmd(401, [S(line)]))];
const condition = ({ sw = 0 } = {}) => new RObject("RPG::Event::Page::Condition", [
  ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
  ["@switch2_valid", false], ["@switch2_id", 1],
  ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
  ["@self_switch_valid", false], ["@self_switch_ch", S("A")],
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
    if (!items.has(boss.reward)) warnings.push(`${boss.trainer}: recompensa inexistente ${boss.reward}`);
    for (const [sp] of boss.team) if (!species.has(sp)) warnings.push(`${boss.trainer}: especie inexistente ${sp}`);
  }
  const trainers = read("trainers.dat");
  let next = Math.max(-1, ...trainers.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  let added = 0;
  for (const boss of roster) {
    const key = [Sym(boss.type), S(boss.name), 0];
    const exists = trainers.pairs.some(([k]) => Array.isArray(k) && txt(k[1]) === boss.name && k[2] === 0);
    if (exists) continue;
    const obj = new RObject("GameData::Trainer", [
      ["@id", key], ["@id_number", next], ["@trainer_type", key[0]],
      ["@real_name", S(boss.name)], ["@version", 0], ["@items", [Sym("FULLRESTORE")]],
      ["@real_lose_text", S(boss.loss ?? "...")], ["@numpkmn", 0], ["@guara", 0],
      ["@pokemon", boss.team.map(pokemonData)],
    ]);
    trainers.pairs.push([next, obj], [key, obj]);
    result.episodes[boss.episode] = { ...(result.episodes[boss.episode] ?? {}), trainer: boss.trainer, trainerId: next };
    next++;
    added++;
  }
  write("trainers.dat", trainers);
  return added;
}

// ------------------------------------------------------------ fase B (eventos)
const phaseBText = (spec, index) => spec.texts?.[index] ?? `${spec.noun} ${index + 1}`;

/** Un paso de fase B: cuenta y, al completar, sella el episodio. */
function phaseBStep(ep, spec, index, total) {
  const sw = CHAIN_SWITCH_BASE + index;
  const last = index === total - 1;
  const list = [];
  list.push(...texts([phaseBText(spec, index)]));
  list.push(cmd(121, [sw, 0]));                       // switch del paso = ON
  list.push(script(`$game_variables[${CHAIN_VARIABLE}] += 1`));
  if (last) {
    list.push(...texts([`El último gesto cierra el episodio: ${ep.bossName} se hunde.`]));
    list.push(cmd(121, [ep.seal, 0]));                 // sello del episodio
    list.push(script(`$game_variables[265] = [$game_variables[265] + ${ep.resonance}, 100].min`));
    list.push(script(`begin; pbItemBall(:${ep.boss.reward}); rescue; pbMessage("(recompensa ${ep.boss.reward} pendiente)"); end`));
    if (ep.grieta) list.push(cmd(121, [ep.grieta, 0])); // grieta al siguiente universo
    list.push(script(`$game_variables[${CHAIN_VARIABLE}] = 0`));
  }
  list.push(cmd(0));
  return [page({ gfx: graphic(""), trigger: 0, through: true, list })];
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
  return { kind: spec.kind, total, placed };
}

/** Epílogo del jefe: la última página del evento jefe pasa a depender del sello del episodio. */
function installBossEpilogue(ep) {
  const bossMap = ep.mapRange.to;
  const mapObject = read(mapFile(bossMap));
  const hash = mapObject.getIvar("@events");
  const boss = hash.pairs.find(([, ev]) => (ev.getIvar("@name")?.text ?? "").startsWith(`EV_${ep.key}_JEFE`));
  if (!boss) { warnings.push(`${ep.key}: no se encontró EV_${ep.key}_JEFE en ${bossMap}`); return false; }
  const pages = boss[1].getIvar("@pages");
  const epilogue = [page({ cond: condition({ sw: ep.seal }), gfx: graphic(""), list: [...texts([`${ep.bossName} ya no está. El sello aguanta (resonancia v265).`]), cmd(0)] })];
  const already = pages.some((p) => p.getIvar("@condition")?.getIvar("@switch1_id") === ep.seal && p.getIvar("@condition")?.getIvar("@switch1_valid"));
  if (already) return true;
  pages.push(epilogue[0]);
  boss[1].setIvar("@pages", pages);
  mapObject.setIvar("@events", hash);
  write(mapFile(bossMap), mapObject);
  return true;
}

// ------------------------------------------------------------ main
const roster = episodes.map((ep) => ({
  episode: ep.key, trainer: ep.boss.phaseA.trainer, type: ep.boss.phaseA.type,
  name: ep.boss.phaseA.label, team: ep.boss.team, reward: ep.boss.reward,
  loss: ep.boss.notes ?? "...",
}));

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
    ok(items.has(ep.boss.reward), `${ep.key}: falta el objeto ${ep.boss.reward}`);
    ok(fs.existsSync(path.join(ITEM_ICONS, `${ep.boss.reward}.png`)), `${ep.key}: falta el icono ${ep.boss.reward}.png`);
    const total = info.phaseB?.total ?? 0;
    ok(total > 0, `${ep.key}: fase B sin pasos`);
    for (const placed of info.phaseB?.placed ?? []) {
      const mapObject = read(mapFile(placed.map));
      const found = (mapObject.getIvar("@events")?.pairs ?? []).some(([, ev]) => (ev.getIvar("@name")?.text ?? "").startsWith(`BOSSB_${ep.key}_`));
      ok(found, `${ep.key}: no se encontró el evento de fase B en Map${placed.map}`);
    }
    console.log(`  ${ep.key}: ${ep.bossName} · ${info.phaseB?.kind} ×${total} · trainer ${ep.boss.phaseA.trainer} · objeto ${ep.boss.reward}`);
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
  result.episodes[ep.key] = { ...(result.episodes[ep.key] ?? {}), bossName: ep.bossName, phaseB, epilogue };
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
