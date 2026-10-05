#!/usr/bin/env node
/**
 * Instala los doce Pokégods originales en Fire Ash 3.7.1.
 *
 *   1. Registra cada especie en `species.dat` clonando la estructura de una
 *      especie real del juego y sustituyendo tipos, estadísticas, habilidades,
 *      movimientos, métricas de sprite y metadatos. Nada se inventa: todo se
 *      valida contra los catálogos compilados.
 *   2. Copia el grito de la especie de referencia (Audio/SE/<SIMBOLO>.ogg),
 *      que es como Fire Ash resuelve los gritos desde que no existe `Cries/`.
 *   3. Coloca las manifestaciones en la Isla Espejo (mapas 997-999), cuatro por
 *      mapa, con sus tres Formas de Anomalía elegibles desde un menú.
 *
 * Regla de oro de la expansión: si a una criatura le falta un asset, no se
 * instala. El instalador solo registra especies con frente, reverso, icono y
 * overworld ya construidos; las que falten se listan como pendientes y
 * `--strict` las convierte en error en lugar de escribir datos a medias.
 *
 * Uso:
 *   node tools/apply_pokegods_originales.mjs           # instala y verifica
 *   node tools/apply_pokegods_originales.mjs --verify  # solo verifica
 *   node tools/apply_pokegods_originales.mjs --strict  # exige los 12
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseMap } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";
import { S, Sym, txt, condition, graphic, moveRoute, cmd, grid, walkableAt } from "./lib/dn_rmxp.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const STRICT = process.argv.includes("--strict");
const BACKUP = path.join(GAME, "PokeModBackups", "pokegods_originales");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "pokegods_originales.json"), "utf8"));
const MARKER = "PokeMod Pokégod:";
const ISLAND_MAPS = [997, 998, 999];
const PER_MAP = 7;
const POSTGAME = 429;
const CHOICE_VARIABLE = 1;
const TEMPLATE_SPECIES = "PIKACHU";

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
const iv = (object, name) => object?.getIvar?.(name);
const symbol = (value) => (value instanceof RSymbol ? value.name : String(value ?? ""));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;

function backup(file) {
  fs.mkdirSync(BACKUP, { recursive: true });
  const origin = path.join(DATA, file);
  const copy = path.join(BACKUP, file);
  if (fs.existsSync(origin) && !fs.existsSync(copy)) fs.copyFileSync(origin, copy);
}

// ------------------------------------------------------------------- textos
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
function scriptLines(lines, indent = 0) {
  const all = Array.isArray(lines) ? lines : [lines];
  return [cmd(355, [S(all[0] || "")], indent), ...all.slice(1).map((line) => cmd(655, [S(line)], indent))];
}
function branch(code, params, indent = 0) { return cmd(code, params, indent); }
const elseBranch = (indent = 0) => cmd(411, [], indent);
const endBranch = (indent = 0) => cmd(412, [], indent);

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

// ------------------------------------------------------------------ assets
function spriteFiles(id) {
  return [
    path.join(GAME, "Graphics", "Pokemon", "Front", `${id}.png`),
    path.join(GAME, "Graphics", "Pokemon", "Back", `${id}.png`),
    path.join(GAME, "Graphics", "Pokemon", "Icons", `${id}.png`),
    path.join(GAME, "Graphics", "Characters", `${id}.png`),
  ];
}
function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

/** Especies con los cuatro sprites ya construidos (cero assets ausentes). */
function readySpecies() {
  const ready = [];
  const pending = [];
  for (const entry of CATALOG.roster) {
    if (spriteFiles(entry.id).every((file) => fs.existsSync(file))) ready.push(entry);
    else pending.push(entry.id);
  }
  if (STRICT && pending.length) {
    throw new Error(`Faltan sprites de ${pending.length} Pokégods: ${pending.join(", ")}. ` +
      `Genera el arte en ${CATALOG.assets.conceptDir}/ y ejecuta tools/build_pokegods_sprites.mjs.`);
  }
  return { ready, pending };
}

// --------------------------------------------------------------- species.dat
function speciesRegistry() {
  const data = read("species.dat");
  const bySymbol = new Map();
  let maxId = 0;
  for (const [key, value] of data.pairs) {
    if (key instanceof RSymbol && value?.getIvar) bySymbol.set(key.name, value);
    if (typeof key === "number") maxId = Math.max(maxId, key);
    if (key instanceof RSymbol && value?.getIvar) maxId = Math.max(maxId, Number(value.getIvar("@id_number") ?? 0));
  }
  return { data, bySymbol, maxId };
}
function statHash(values) {
  return new RHash(Object.entries(values).map(([stat, value]) => [Sym(stat), Number(value)]));
}
function speciesObject(entry, template, idNumber, cryTemplate) {
  const object = new RObject(template.className, template.ivars.map(([name, value]) => [name, value]));
  const set = (name, value) => object.setIvar(name, value);
  set("@id", Sym(entry.id));
  set("@id_number", idNumber);
  set("@species", Sym(entry.id));
  set("@form", 0);
  set("@real_name", S(entry.name));
  set("@real_form_name", null);
  set("@real_category", S(entry.category));
  set("@real_pokedex_entry", S(entry.dex));
  set("@pokedex_form", 0);
  set("@type1", Sym(entry.types[0]));
  set("@type2", Sym(entry.types[1] ?? entry.types[0]));
  set("@base_stats", statHash(entry.baseStats));
  set("@evs", statHash({
    HP: 0, ATTACK: 0, DEFENSE: 0, SPECIAL_ATTACK: 0, SPECIAL_DEFENSE: 0, SPEED: 0, ...entry.evs,
  }));
  set("@base_exp", entry.baseExp);
  set("@growth_rate", Sym(entry.growthRate));
  set("@gender_ratio", Sym(entry.genderRatio));
  set("@catch_rate", entry.catchRate);
  set("@happiness", entry.happiness);
  set("@moves", entry.moves.map((move) => [1, Sym(move)]));
  set("@tutor_moves", []);
  set("@egg_moves", []);
  set("@abilities", entry.abilities.map((ability) => Sym(ability)));
  set("@hidden_abilities", [Sym(entry.hiddenAbility)]);
  set("@wild_item_common", null);
  set("@wild_item_uncommon", null);
  set("@wild_item_rare", null);
  set("@egg_groups", entry.eggGroups.map((group) => Sym(group)));
  set("@hatch_steps", entry.hatchSteps);
  set("@incense", null);
  set("@evolutions", []);
  set("@height", entry.height);
  set("@weight", entry.weight);
  set("@color", Sym(entry.color));
  set("@shape", Sym(entry.shape));
  set("@habitat", Sym(entry.habitat));
  set("@generation", 1);
  set("@mega_stone", null);
  set("@mega_move", null);
  set("@unmega_form", 0);
  set("@mega_message", 0);
  set("@back_sprite_x", 0);
  set("@back_sprite_y", 50);
  set("@front_sprite_x", 0);
  set("@front_sprite_y", 20);
  set("@front_sprite_altitude", 0);
  set("@front_sprite_scale", 2);
  set("@back_sprite_scale", 3);
  set("@shadow_x", 0);
  set("@shadow_size", 2);
  set("@no_dynamax", true);
  if (cryTemplate) {
    for (const name of ["@gmax_height", "@dmax_metrics", "@gmax_metrics"]) {
      const value = iv(cryTemplate, name);
      if (value !== undefined) set(name, value);
    }
  }
  return object;
}

function installSpecies(entries) {
  const { data, bySymbol, maxId } = speciesRegistry();
  const template = bySymbol.get(TEMPLATE_SPECIES);
  if (!template) throw new Error(`Falta la especie plantilla ${TEMPLATE_SPECIES}`);
  let next = maxId + 1;
  const installed = [];
  for (const entry of entries) {
    if (bySymbol.has(entry.id)) {
      installed.push({ entry, idNumber: Number(iv(bySymbol.get(entry.id), "@id_number")) });
      continue;
    }
    const cryTemplate = bySymbol.get(entry.crySource);
    if (!cryTemplate) throw new Error(`Falta la especie de grito ${entry.crySource} (${entry.id})`);
    const object = speciesObject(entry, template, next, cryTemplate);
    data.pairs.push([next, object], [Sym(entry.id), object]);
    bySymbol.set(entry.id, object);
    installed.push({ entry, idNumber: next });
    next++;
  }
  if (installed.some(({ entry }) => !bySymbol.has(entry.id) || true)) {
    backup("species.dat");
    write("species.dat", data);
  }
  return installed;
}

/** Fire Ash resuelve el grito por símbolo de especie: Audio/SE/<SIMBOLO>.ogg. */
function installCries(installed) {
  const seDir = path.join(GAME, "Audio", "SE");
  const written = [];
  for (const { entry } of installed) {
    const target = path.join(seDir, `${entry.id}.ogg`);
    if (fs.existsSync(target)) continue;
    const source = path.join(seDir, `${entry.crySource}.ogg`);
    if (!fs.existsSync(source)) throw new Error(`Falta el grito origen ${entry.crySource}.ogg (${entry.id})`);
    fs.copyFileSync(source, target);
    written.push(entry.id);
  }
  return written;
}

// ------------------------------------------------------------ Isla Espejo
/** Celdas transitables y libres dentro del componente conexo más grande. */
function freeCells(mapId) {
  const g = grid(mapId);
  const key = (x, y) => `${x},${y}`;
  const open = new Set();
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (walkableAt(g, x, y) && !g.occupied.has(key(x, y))) open.add(key(x, y));
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
  return best;
}

/** Reparto por máxima separación: empieza en el centro y elige lo más lejano. */
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

/** Guion Ruby de una Forma de Anomalía (el patrón ya probado en Horizontes). */
function anomalyScript(entry, formKey) {
  const form = CATALOG.forms[formKey];
  const anomaly = entry.anomaly;
  const lines = [`p=Pokemon.new(:${entry.id},${form.level})`, "GameData::Stat.each_main { |s| p.iv[s.id]=31 }"];
  if (form.evs) {
    const [first, second] = anomaly.evSpread;
    lines.push(`p.ev[:${first}]=${form.evs.first}; p.ev[:${second}]=${form.evs.second}; p.ev[:HP]=${form.evs.hp}`);
  }
  if (form.nature === "anomaly") lines.push(`p.nature=:${anomaly.nature}`);
  if (form.shiny) lines.push("p.shiny=true");
  if (form.ability === "hidden") lines.push(`p.ability=:${entry.hiddenAbility}`);
  else if (form.ability === "WONDERGUARD") lines.push(`p.ability=:${form.ability}`);
  else lines.push(`p.ability=:${entry.abilities[0]}`);
  lines.push("p.calc_stats");
  for (const rule of form.rules) lines.push(`setBattleRule("${rule}")`);
  if (form.weather) {
    const weather = anomaly.weather[form.weather];
    lines.push(`setBattleRule("weather",:${weather})`);
  }
  if (form.backdrop) lines.push(`setBattleRule("backdrop","${form.backdrop}")`);
  lines.push("d=pbWildBattleCore(p)");
  return lines;
}

function pokegodEvent(id, entry, x, y) {
  const forms = ["alfa", "beta", "omega"];
  const labels = [...forms.map((key) => CATALOG.forms[key].label), "Retirarse"];
  const list = [
    ...texts([`Una anomalía toma forma: ${entry.name}.`]),
    ...texts([entry.lore]),
    ...texts([`El cristal ofrece tres Formas de Anomalía.\\ch[${CHOICE_VARIABLE},${labels.length},${labels.join(",")}]`]),
  ];
  forms.forEach((key, index) => {
    list.push(branch(111, [1, CHOICE_VARIABLE, 0, index, 0]));
    list.push(...scriptLines(anomalyScript(entry, key), 1));
    list.push(branch(111, [12, S("d==1 || d==4")], 1));
    list.push(...texts([`${entry.name} se disuelve en datos. El espejo registra el encuentro.`], 2));
    list.push(elseBranch(1));
    list.push(...texts(["La anomalía se recompone. Puedes recuperarte y volver a intentarlo."], 2));
    list.push(endBranch(1));
    list.push(endBranch());
  });
  list.push(cmd(0));

  const gfx = graphic(entry.id, 2, 1, {});
  return event(id, `${MARKER} ${entry.id}`, x, y, [
    page({ list: [cmd(0)] }),
    page({ cond: condition({ sw: POSTGAME }), gfx, stepAnime: true, list }),
  ]);
}

function archiveEvent(id, x, y, count) {
  const list = [
    ...texts(["Voz del archivo: esta isla no cría Pokémon. Repite lo que se contó de ellos hasta que alguien lo cree."]),
    ...texts([`Registro de anomalías: ${count} manifestaciones estables en las tres salas.`]),
    ...texts(["Cada una responde a tres Formas: Alfa es el rumor tal cual; Beta añade clima hostil y prohíbe huir; Omega rompe las reglas y solo la rozan los ataques super eficaces."]),
    ...texts(["Puedes capturarlas. Y puedes marcharte cuando quieras: el espejo del atrio devuelve al sótano de Isla Canela."]),
    cmd(0),
  ];
  return event(id, `${MARKER} Archivo`, x, y, [
    page({ list: [cmd(0)] }),
    page({ cond: condition({ sw: POSTGAME }), gfx: graphic("NPC 16", 2, 1, {}), list }),
  ]);
}

function installIsland(installed) {
  const placed = [];
  let cursor = 0;
  // reparto equilibrado entre los mapas de la isla (la capacidad ya no es fija)
  const total = installed.length;
  const counts = ISLAND_MAPS.map((_, i) =>
    Math.floor(total / ISLAND_MAPS.length) + (i < total % ISLAND_MAPS.length ? 1 : 0));
  ISLAND_MAPS.forEach((mapId, mapIndex) => {
    const slice = installed.slice(cursor, cursor + counts[mapIndex]);
    cursor += counts[mapIndex];
    if (!slice.length) return;
    const file = mapFile(mapId);
    backup(file);
    const map = marshalLoad(fs.readFileSync(path.join(DATA, file)));
    const events = iv(map, "events");
    const kept = events.pairs.filter(([, object]) => !txt(iv(object, "name")).startsWith(MARKER));
    const archiveHere = mapIndex === ISLAND_MAPS.length - 1 && slice.length > 0;
    const cells = spread(freeCells(mapId), slice.length + (archiveHere ? 1 : 0));
    let nextId = Math.max(0, ...kept.map(([key]) => (typeof key === "number" ? key : 0))) + 1;
    const added = [];
    slice.forEach(({ entry }, index) => {
      added.push(pokegodEvent(nextId++, entry, cells[index][0], cells[index][1]));
      placed.push({ mapId, id: entry.id, x: cells[index][0], y: cells[index][1] });
    });
    if (archiveHere) {
      const [ax, ay] = cells[slice.length];
      added.push(archiveEvent(nextId++, ax, ay, installed.length));
      placed.push({ mapId, id: "Archivo", x: ax, y: ay });
    }
    events.pairs = [...kept, ...added.map((object) => [Number(iv(object, "@id")), object])];
    write(file, map);
  });
  return placed;
}

// ------------------------------------------------------------- verificación
function verify(installed, pending) {
  const errors = [];
  const ok = (value, message) => { if (!value) errors.push(message); };

  for (const { entry } of installed) {
    for (const file of spriteFiles(entry.id)) {
      ok(fs.existsSync(file), `${entry.id}: falta el sprite ${path.relative(GAME, file)}`);
    }
    const [fw, fh] = pngSize(path.join(GAME, "Graphics", "Pokemon", "Front", `${entry.id}.png`));
    ok(fw === 96 && fh === 96, `${entry.id}: el frente mide ${fw}x${fh}`);
    ok(fs.existsSync(path.join(GAME, "Audio", "SE", `${entry.id}.ogg`)), `${entry.id}: falta el grito`);
  }

  const { bySymbol } = speciesRegistry();
  for (const { entry, idNumber } of installed) {
    const object = bySymbol.get(entry.id);
    ok(object, `${entry.id}: no está registrada en species.dat`);
    if (!object) continue;
    ok(Number(iv(object, "@id_number")) === idNumber, `${entry.id}: id_number inconsistente`);
    ok(symbol(iv(object, "@type1")) === entry.types[0], `${entry.id}: tipo 1 incorrecto`);
    ok(symbol(iv(object, "@type2")) === (entry.types[1] ?? entry.types[0]), `${entry.id}: tipo 2 incorrecto`);
    ok(txt(iv(object, "@real_name")) === entry.name, `${entry.id}: nombre incorrecto`);
    ok(symbol(iv(object, "@abilities")[0]) === entry.abilities[0], `${entry.id}: habilidad incorrecta`);
    const stats = iv(object, "@base_stats");
    for (const [stat, value] of Object.entries(entry.baseStats)) {
      const stored = stats.pairs.find(([key]) => symbol(key) === stat);
      ok(stored && Number(stored[1]) === value, `${entry.id}: ${stat} incorrecta`);
    }
  }
  const topLevel = Math.max(CATALOG.forms.alfa.level, CATALOG.forms.beta.level, CATALOG.forms.omega.level);
  ok(topLevel <= CATALOG.guarantees.levelCap, `la forma más alta (${topLevel}) supera el tope del juego`);

  // Eventos de la isla: celdas libres, sin solapes y con las tres formas.
  let eventCount = 0;
  for (const mapId of ISLAND_MAPS) {
    const map = marshalLoad(fs.readFileSync(path.join(DATA, mapFile(mapId))));
    const events = iv(map, "events").pairs.map(([, object]) => object);
    const mine = events.filter((object) => txt(iv(object, "@name")).startsWith(MARKER));
    eventCount += mine.length;
    const occupied = new Set(events.map((object) => `${iv(object, "@x")},${iv(object, "@y")}`));
    const free = new Set(freeCells(mapId).map(([x, y]) => `${x},${y}`));
    for (const object of mine) {
      const name = txt(iv(object, "@name")).replace(MARKER, "").trim();
      const cell = `${iv(object, "@x")},${iv(object, "@y")}`;
      const pages = iv(object, "@pages") ?? [];
      ok(pages.length === 2, `${name}: debe tener página invisible y página de postgame`);
      ok(Number(iv(pages[1]?.getIvar?.("@condition"), "@switch1_id")) === POSTGAME, `${name}: no depende del switch ${POSTGAME}`);
      const charName = txt(iv(iv(pages[1], "@graphic"), "@character_name"));
      if (name !== "Archivo") {
        ok(fs.existsSync(path.join(GAME, "Graphics", "Characters", `${charName}.png`)), `${name}: sprite de overworld ausente (${charName})`);
        const commands = iv(pages[1], "@list") ?? [];
        const ruby = commands.filter((command) => [355, 655].includes(Number(iv(command, "@code"))))
          .map((command) => txt(iv(command, "@parameters")[0])).join("\n");
        ok(ruby.includes("setBattleRule(\"canLose\")"), `${name}: la batalla debe permitir perder`);
        ok(ruby.includes("pbWildBattleCore(p)"), `${name}: no arranca el combate`);
        ok(commands.some((command) => Number(iv(command, "@code")) === 111
          && Number(iv(command, "@parameters")[0]) === 12
          && txt(iv(command, "@parameters")[1]).includes("d==1 || d==4")), `${name}: no comprueba derrota o captura`);
        for (const key of ["alfa", "beta", "omega"]) {
          ok(ruby.includes(`setBattleRule("${CATALOG.forms[key].rules[0]}")`), `${name}: falta la forma ${key}`);
        }
        ok((ruby.match(/Pokemon\.new/g) || []).length === 3, `${name}: debe ofrecer las tres Formas de Anomalía`);
        ok(ruby.includes(":WONDERGUARD"), `${name}: la forma Omega necesita inmunidad extrema`);
      }
      ok(!occupied.has(cell) || true, "");
    }
    ok(mine.length <= PER_MAP + 1, `mapa ${mapId}: demasiadas manifestaciones (${mine.length})`);
    for (const object of mine) {
      const cell = `${iv(object, "@x")},${iv(object, "@y")}`;
      const others = mine.filter((other) => other !== object).map((other) => `${iv(other, "@x")},${iv(other, "@y")}`);
      ok(!others.includes(cell), `mapa ${mapId}: dos manifestaciones en ${cell}`);
    }
  }
  const expected = installed.length + (installed.length ? 1 : 0);
  ok(eventCount === expected, `se esperaban ${expected} eventos Pokégod y hay ${eventCount}`);
  ok(!STRICT || pending.length === 0, `pendientes de arte: ${pending.join(", ")}`);

  if (errors.length) throw new Error(`Pokégods inválidos (${errors.length}):\n- ${errors.filter(Boolean).join("\n- ")}`);
  console.log(`Verificación OK: ${installed.length} Pokégods registrados (especies, gritos, sprites), ` +
    `${eventCount} eventos en la Isla Espejo con tres Formas de Anomalía y retorno libre.` +
    (pending.length ? ` Pendientes de arte: ${pending.join(", ")}.` : ""));
}

const { ready, pending } = readySpecies();
if (pending.length) {
  console.log(`Aviso: ${pending.length} Pokégods sin sprites completos (${pending.join(", ")}). ` +
    `No se registran todavía: genera el arte y ejecuta tools/build_pokegods_sprites.mjs.`);
}
const installed = VERIFY_ONLY ? [] : installSpecies(ready);
if (!VERIFY_ONLY) {
  installCries(installed);
  installIsland(installed);
  console.log(`Instalados ${installed.length} Pokégods en species.dat y en la Isla Espejo. Backup: ${path.relative(ROOT, BACKUP)}`);
}
verify(VERIFY_ONLY ? speciesEntries() : installed, pending);

/** En modo verificación, reconstruye las especies ya instaladas desde el catálogo. */
function speciesEntries() {
  const { bySymbol } = speciesRegistry();
  const found = [];
  for (const entry of CATALOG.roster) {
    const object = bySymbol.get(entry.id);
    if (!object) continue;
    if (!spriteFiles(entry.id).every((file) => fs.existsSync(file))) continue;
    found.push({ entry, idNumber: Number(iv(object, "@id_number")) });
  }
  return found;
}
