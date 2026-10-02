#!/usr/bin/env node
/**
 * dn_build_hub_events.mjs — eventos del hub del Dimensional Nightmare.
 *
 * El mapa 2040 (Antesala de las Grietas) se construyó en E3 pero quedó sin eventos: hoy el
 * jugador termina un episodio, cae en la Gruta de los Testigos (Map2030, celda de llegada que
 * fija el GDD) y no tiene forma de volver a entrar al ciclo. Esta herramienta cierra ese lazo:
 *
 *   Map2030  HUB_GRIETA_CAVE   grieta de entrada (se abre con v264 ≥ 3) → Antesala
 *   Map2040  HUB_GRIETA_EPxx   seis grietas, una por episodio (EP01-03 con v264 ≥ 3,
 *                              EP04-06 con v264 ≥ 7) → primer mapa del episodio
 *   Map2040  HUB_GRIETA_W7-W9  segundo anillo: los tres mundos nuevos (v264 ≥ 9 y la
 *                              Liga Oscura cerrada, sw920) → primer mapa del mundo
 *   Map2040  HUB_ARCHIVERO     guía del hub (textos por progreso de sellos)
 *   Map2040  HUB_PROGRESO      monumento: sellos, resonancia y anomalías registradas
 *   Map2040  HUB_SALIDA        borde inferior de la Antesala → de vuelta a la Gruta
 *
 * Las celdas se eligen sobre la malla **real** del mapa (pasabilidad + alcanzabilidad desde la
 * entrada), nunca a ojo: los seis altares se reparten por el perímetro con muestreo de punto más
 * lejano, y la salida se ancla al borde inferior. Todo se guarda en
 * `content/dimensional_nightmare_events_built.json` → `hubMap`, para que la verificación pueda
 * comprobar celdas, tipos de evento y destinos sin abrir el juego.
 *
 * Uso:
 *   node tools/dn_build_hub_events.mjs            # construye/actualiza (idempotente)
 *   node tools/dn_build_hub_events.mjs --dry-run  # muestra el plan sin escribir
 *   node tools/dn_build_hub_events.mjs --verify   # sólo comprueba
 *   node tools/dn_build_hub_events.mjs --render   # además, hoja visual del hub
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RHash, RObject, RString } from "../web/js/marshal.js";
import { parseMap, tableGet } from "../web/js/rmxp.js";
import { passabilityOf, reachableCells } from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const CHAR_DIR = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const BUILT = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const EVENTS = path.join(ROOT, "content", "dimensional_nightmare_events_built.json");
const BACKUP = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups", "dimensional_nightmare_maps_originals");

const OWNED = ["HUB_GRIETA_CAVE", "HUB_ARCHIVERO", "HUB_PROGRESO", "HUB_SALIDA"];   // eventos propios
const OWNS = (name) => OWNED.includes(name) || /^HUB_GRIETA_(EP\d\d|W\d+)$/.test(name);

const CAVE_ID = 2030;          // Gruta de los Testigos (mapa base del juego)
const HUB_ID = 2040;           // Antesala de las Grietas (construida en E3)
const RIFT_STEP = 4;           // separación mínima entre altares
const EPISODES = [
  { key: "EP01", unlock: 3, hue: 0, flavor: "La grieta huele a papel viejo y a tinta." },
  { key: "EP02", unlock: 3, hue: 36, flavor: "Un cartucho gira en el aire, sin consola." },
  { key: "EP03", unlock: 3, hue: 72, flavor: "De la grieta cae nieve que no derrite." },
  { key: "EP04", unlock: 7, hue: 144, flavor: "Alguien tararea una nana al otro lado." },
  { key: "EP05", unlock: 7, hue: 216, flavor: "La grieta devuelve tu propio reflejo, un paso tarde." },
  { key: "EP06", unlock: 7, hue: 288, flavor: "Una letra te observa desde el borde." },
  // Segundo anillo: se abre con la Liga Oscura cerrada (v264 ≥ 9) y son los tres mundos
  // que alimentan la Vitrina del Testigo.
  { key: "W7", unlock: 9, requireSwitch: 920, hue: 12, flavor: "Del segundo anillo llega olor a correa vieja." },
  { key: "W8", unlock: 9, requireSwitch: 920, hue: 30, flavor: "La grieta escupe tierra húmeda y no se cierra." },
  { key: "W9", unlock: 9, requireSwitch: 920, hue: 300, flavor: "Alguien tararea desafinado detrás del muro." },
];

const argv = process.argv.slice(2);
const VERIFY = argv.includes("--verify");
const RENDER = argv.includes("--render");
const DRY = argv.includes("--dry-run");

const S = (v) => RString.fromText(String(v));
const txt = (v) => (v && v.text !== undefined ? v.text : String(v ?? ""));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const readMap = (id) => marshalLoad(fs.readFileSync(path.join(DATA, mapFile(id))));
const warnings = [];

// --------------------------------------------------------------- RMXP bits
const cmd = (code, params = [], indent = 0) => new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
const condition = ({ sw = 0, self = "", variable = null } = {}) => new RObject("RPG::Event::Page::Condition", [
  ["@switch1_valid", !!sw], ["@switch1_id", sw || 1],
  ["@switch2_valid", false], ["@switch2_id", 1],
  ["@variable_valid", !!variable], ["@variable_id", variable ? variable[0] : 1], ["@variable_value", variable ? variable[1] : 0],
  ["@self_switch_valid", !!self], ["@self_switch_ch", S(self || "A")],
]);
const graphic = (charName = "", dir = 2, pattern = 1, opts = {}) => new RObject("RPG::Event::Page::Graphic", [
  ["@tile_id", opts.tile ?? 0], ["@character_name", S(charName)], ["@character_hue", opts.hue ?? 0],
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
const texts = (lines) => [cmd(101, [S("")]), ...[].concat(lines).map((line) => cmd(401, [S(line)]))];
const script = (line) => cmd(355, [S(line)]);
const transfer = (mapId, x, y, dir = 2) => cmd(201, [0, mapId, x, y, dir, 1]);
const graphicOk = (name) => fs.existsSync(path.join(CHAR_DIR, name));

// --------------------------------------------------------------- malla del hub
function grid(id) {
  const raw = readMap(id);
  const parsed = parseMap(raw);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const pairs = raw.getIvar("@events")?.pairs ?? [];
  const events = pairs.map(([, obj]) => ({
    name: txt(obj.getIvar("@name")),
    x: obj.getIvar("@x"),
    y: obj.getIvar("@y"),
    obj,
  }));
  const occupied = new Set(events.filter((e) => !OWNS(e.name)).map((e) => `${e.x},${e.y}`));
  return { raw, parsed, pass, events, occupied, width: parsed.width, height: parsed.height };
}

function buildPlan() {
  const builtMaps = JSON.parse(fs.readFileSync(BUILT, "utf8")).maps;
  const eventData = JSON.parse(fs.readFileSync(EVENTS, "utf8"));
  const hubMeta = builtMaps.find((m) => m.id === HUB_ID);
  if (!hubMeta) throw new Error(`no hay ficha de construcción del mapa ${HUB_ID}; corre \`npm run dn:hub\``);
  const entry = hubMeta.bfs?.entry ?? [Math.floor(hubMeta.width / 2), hubMeta.height - 2];
  const hub = grid(HUB_ID);
  const reach = reachableCells(hub.pass, entry);
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const center = [Math.floor(hub.width / 2), Math.floor(hub.height / 2)];
  const occupied = new Set(hub.occupied);
  const candidates = [...reach]
    .map((k) => k.split(",").map(Number))
    .filter(([x, y]) => !occupied.has(`${x},${y}`) && dist([x, y], entry) >= 2);

  // salida: la celda alcanzable más al sur (borde inferior de la Antesala)
  const exit = [...candidates].sort((a, b) => b[1] - a[1] || Math.abs(a[0] - center[0]) - Math.abs(b[0] - center[0]))[0];
  if (!exit) throw new Error("no hay celdas libres alcanzables en la Antesala");

  // altares: banda de perímetro + muestreo del punto más lejano (reparto parejo)
  const ring = candidates.filter((c) => dist(c, center) >= Math.max(4, Math.floor(Math.min(hub.width, hub.height) / 2)));
  const pool = ring.length >= EPISODES.length ? ring : candidates;
  const chosen = [...pool].sort((a, b) => dist(b, entry) - dist(a, entry))[0] ? [
    [...pool].sort((a, b) => dist(b, entry) - dist(a, entry))[0],
  ] : [];
  const taken = [entry, exit, ...chosen];
  while (chosen.length < EPISODES.length) {
    let best = null, bestScore = -1;
    for (const c of pool) {
      if (taken.includes(c)) continue;
      const score = Math.min(...taken.map((t) => dist(c, t)));
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (!best || bestScore < RIFT_STEP) break;
    chosen.push(best); taken.push(best);
  }
  if (chosen.length < EPISODES.length) warnings.push(`sólo se pudieron repartir ${chosen.length}/${EPISODES.length} altares con separación ≥${RIFT_STEP}`);

  // archivero junto a la salida; monumento junto a la entrada
  const near = (from, min = 1) => [...candidates].filter((c) => !taken.includes(c) && dist(c, from) >= min)
    .sort((a, b) => dist(a, from) - dist(b, from))[0] ?? null;
  const archivero = near(exit, 1);
  if (archivero) taken.push(archivero);
  // monumento en el centro de la sala (calculado después de reservar el archivero)
  const progreso = [...candidates].filter((c) => !taken.includes(c)).sort((a, b) => dist(a, center) - dist(b, center))[0] ?? null;
  if (progreso) taken.push(progreso);

  // grieta de entrada en la Gruta: celda libre junto a la llegada del GDD
  const cave = grid(CAVE_ID);
  const caveOccupied = new Set(cave.occupied);
  const arrival = (eventData.hub?.cell ?? [36, 12]).slice(0, 2);
  if (caveOccupied.has(arrival.join(","))) warnings.push(`la llegada al hub ${arrival} coincide con un evento de la Gruta`);
  const ringCave = [];
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const x = arrival[0] + dx, y = arrival[1] + dy;
      if (x < 0 || y < 0 || x >= cave.width || y >= cave.height) continue;
      if (caveOccupied.has(`${x},${y}`)) continue;
      if (!cave.pass.canMove(x, y, 2) || !cave.pass.canMove(x, y, 8)) continue;
      if (dx === 0 && dy === 0) continue;
      ringCave.push([x, y, Math.abs(dx) + Math.abs(dy)]);
    }
  }
  ringCave.sort((a, b) => a[2] - b[2] || a[1] - b[1]);
  const caveGate = ringCave[0] ?? null;
  if (!caveGate) warnings.push("no se encontró celda libre para la grieta de entrada en la Gruta");

  // destinos: primer mapa de cada episodio y su celda de entrada registrada en E4
  const targets = EPISODES.map((ep) => {
    const ids = Object.entries(eventData.maps ?? {})
      .filter(([, v]) => v.episode === ep.key)
      .map(([id, v]) => ({ id: Number(id), entry: v.entry, exit: v.exit }))
      .sort((a, b) => a.id - b.id);
    const first = ids[0];
    if (!first) warnings.push(`${ep.key}: sin mapas en el catálogo de eventos`);
    return { ...ep, mapId: first?.id ?? null, cell: first?.entry ?? null };
  });

  return { entry, exit, rifts: chosen, archivero, progreso, targets, caveGate, arrival, hub, cave };
}

// --------------------------------------------------------------- eventos
function makeEvents(plan, baseId) {
  const events = [];
  let id = baseId;
  const riftPages = (spec, cell) => [
    page({
      gfx: graphic("UNOWN", 2, 1, { hue: spec.hue }),
      list: [...texts([`La grieta de ${spec.key} está sellada.`, "El Rotom no reconoce su firma todavía."]), cmd(0)],
    }),
    page({
      cond: condition(spec.requireSwitch ? { variable: [264, spec.unlock], sw: spec.requireSwitch } : { variable: [264, spec.unlock] }),
      gfx: graphic("UNOWN", 2, 1, { hue: spec.hue }),
      trigger: 1, // entrar es caminar hacia la grieta
      list: [
        ...texts([`${spec.key} — ${spec.flavor}`]),
        transfer(spec.mapId ?? HUB_ID, spec.cell?.[0] ?? plan.entry[0], spec.cell?.[1] ?? plan.entry[1], 8),
        cmd(0),
      ],
    }),
  ];
  for (const [i, spec] of plan.targets.entries()) {
    const cell = plan.rifts[i] ?? plan.entry;
    events.push(event(id++, `HUB_GRIETA_${spec.key}`, cell[0], cell[1], riftPages(spec, cell)));
  }
  const readyCheck = `begin; $game_switches[917] = [:DN_CASE_WHT, :DN_CASE_LSV, :DN_CASE_SNO, :DN_CASE_HYP, :DN_CASE_BLK, :DN_CASE_UNO].all? { |i| $PokemonBag.pbHasItem?(i) }; rescue; end`;
  if (plan.archivero) {
    events.push(event(id++, "HUB_ARCHIVERO", plan.archivero[0], plan.archivero[1], [
      page({
        cond: condition({ sw: 917 }),
        gfx: graphic("trchar000", 2, 1),
        list: [
          ...texts([
            "Archivero: las seis cartucheras están completas.",
            "La puerta del centro ya responde: la Liga Oscura te espera.",
            "Dentro hay algo que corre más rápido que cualquier nivel que hayas visto.",
          ]),
          cmd(0),
        ],
      }),
      page({
        gfx: graphic("trchar000", 2, 1),
        list: [
          script(readyCheck),
          ...texts([
            "Archivero: cada grieta que se cierra deja un registro.",
            "Los seis sellos de la Gruta son la cuenta del Nightmare.",
            "Cuando estén los seis, el Nexo se abrirá solo.",
          ]),
          script("$game_variables[277] = (883..888).count { |i| $game_switches[i] }"),
          script('pbMessage("Archivero: sellos encendidos, #{$game_variables[277]} de 6.")'),
          cmd(0),
        ],
      }),
      page({
        cond: condition({ variable: [277, 6] }),
        gfx: graphic("trchar000", 2, 1),
        list: [
          script(readyCheck),
          ...texts([
            "Archivero: los seis sellos están en su sitio.",
            "El Nexo de las Grietas te espera al final de la Gruta.",
            "Lo que decidas allí quedará registrado para siempre.",
          ]),
          cmd(0),
        ],
      }),
      page({
        cond: condition({ sw: 889 }),
        gfx: graphic("trchar000", 2, 1),
        list: [...texts(["Archivero: el registro está cerrado.", "La Grieta ya no responde. El Nightmare quedó atrás."]), cmd(0)],
      }),
    ]));
  }
  if (plan.progreso) {
    events.push(event(id++, "HUB_PROGRESO", plan.progreso[0], plan.progreso[1], [
      page({
        gfx: graphic("Object rock", 2, 1),
        list: [
          script("$game_variables[277] = (883..888).count { |i| $game_switches[i] }"),
          script('pbMessage("Sellos: #{$game_variables[277]}/6")'),
          script('pbMessage("Resonancia: #{$game_variables[265]}/100 · Anomalías: #{$game_variables[274]}/77")'),
          script('pbMessage("Rotom: nivel #{$game_variables[275]}")'),
          script('pbMessage("El Nexo sigue abierto.") if $game_switches[889]'),
          cmd(0),
        ],
      }),
    ]));
  }
  events.push(event(id++, "HUB_SALIDA", plan.exit[0], plan.exit[1], [
    page({
      gfx: graphic("Object ball special", 2, 1),
      trigger: 1, // tocar el borde inferior = salir
      list: [transfer(CAVE_ID, plan.arrival[0], plan.arrival[1], 8), cmd(0)],
    }),
  ]));
  return events;
}

function makeCaveGate(plan, baseId) {
  if (!plan.caveGate) return null;
  const [x, y] = plan.caveGate;
  return event(baseId, "HUB_GRIETA_CAVE", x, y, [
    page({
      gfx: graphic("Object ball special", 2, 1),
      list: [...texts(["Una grieta late en la roca, pero el Rotom duerme.", "(Vuelve cuando el Nightmare despierte: progreso 3.)"]), cmd(0)],
    }),
    page({
      cond: condition({ variable: [264, 3] }),
      gfx: graphic("Object ball special", 2, 1),
      trigger: 1, // se baja caminando hacia la grieta
      list: [
        ...texts(["El Rotom reconoce la firma de la grieta."]),
        transfer(HUB_ID, plan.entry[0], plan.entry[1], 8),
        cmd(0),
      ],
    }),
  ]);
}

// --------------------------------------------------------------- escritura
function writeMap(id, add) {
  const full = path.join(DATA, mapFile(id));
  fs.mkdirSync(BACKUP, { recursive: true });
  if (!fs.existsSync(path.join(BACKUP, mapFile(id)))) fs.copyFileSync(full, path.join(BACKUP, mapFile(id)));
  const map = marshalLoad(fs.readFileSync(full));
  const pairs = map.getIvar("@events").pairs;
  const kept = pairs.filter(([, e]) => !OWNS(txt(e.getIvar("@name"))));
  const removed = pairs.length - kept.length;
  const baseId = Math.max(0, ...kept.map(([k]) => (typeof k === "number" ? k : 0))) + 1;
  const added = add(baseId).filter(Boolean);
  map.setIvar("@events", new RHash([...kept, ...added.map((e) => [e.getIvar("@id"), e])]));
  if (!DRY) fs.writeFileSync(full, Buffer.from(marshalDump(map)));
  return { removed, added: added.map((e) => ({ name: txt(e.getIvar("@name")), x: e.getIvar("@x"), y: e.getIvar("@y") })) };
}

// --------------------------------------------------------------- render
/** Hoja visual del hub: mapa 2040 a 2× con las celdas de los eventos marcadas. */
async function renderHub(plan) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const outDir = path.join(ROOT, "docs", "dn_referencia", "lotes");
  fs.mkdirSync(outDir, { recursive: true });
  const parsed = parseMap(readMap(HUB_ID));
  const tilesets = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const name = tilesets[parsed.tilesetId].getIvar("@tileset_name").text;
  const img = await loadImage(path.join(ROOT, "pokemon_fire_ash", "Graphics", "Tilesets", `${name}.png`));
  const S = 32, Z = 2, BASE = 384;            // 0-47 vacío, 48-383 autotiles, 384+ tiles normales
  const COLS = Math.max(1, Math.floor(img.width / S));
  const canvas = createCanvas(parsed.width * S * Z, parsed.height * S * Z);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#101418";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      for (let z = 0; z < 3; z++) {
        const tile = tableGet(parsed.table, x, y, z);
        if (!tile) continue;
        const idx = tile - BASE;                // los tiles normales se indexan desde 384
        if (idx < 0) continue;                  // autotiles: no se dibujan (este mapa no usa)
        ctx.drawImage(img, (idx % COLS) * S, Math.floor(idx / COLS) * S, S, S, x * S * Z, y * S * Z, S * Z, S * Z);
      }
    }
  }
  const dot = (cell, color, label) => {
    if (!cell) return;
    const cx = cell[0] * S * Z + S * Z / 2, cy = cell[1] * S * Z + S * Z / 2;
    ctx.beginPath(); ctx.arc(cx, cy, S * Z * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 2; ctx.strokeStyle = "#101418"; ctx.stroke();
    if (label) {
      ctx.font = `bold ${Math.round(S * Z * 0.55)}px sans-serif`;
      ctx.fillStyle = "#101418"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, cx, cy + 1);
    }
  };
  dot(plan.entry, "#2ecc71", "E");
  dot(plan.exit, "#3d7bff", "S");
  dot(plan.archivero, "#ffd23d", "A");
  dot(plan.progreso, "#ff8ad8", "P");
  plan.rifts.forEach((cell, i) => cell && dot(cell, "#ff3b30", String(i + 1)));
  fs.writeFileSync(path.join(outDir, "HUB_2040.png"), canvas.toBuffer("image/png"));
  console.log(`render: docs/dn_referencia/lotes/HUB_2040.png · grieta de entrada en ${CAVE_ID} @ ${plan.caveGate.join(",")}`);
}

async function main() {
  const plan = buildPlan();
  const hudEvents = (base) => makeEvents(plan, base);
  const caveGate = (base) => [makeCaveGate(plan, base)];

  if (!VERIFY) {
    for (const sprite of ["UNOWN.png", "Object ball special.png", "Object rock.png", "trchar000.png"]) {
      if (!graphicOk(sprite)) warnings.push(`falta el gráfico de personaje ${sprite}`);
    }
  }

  const summary = {
    generatedBy: "tools/dn_build_hub_events.mjs",
    cave: { map: CAVE_ID, arrival: plan.arrival, gate: plan.caveGate },
    hub: {
      map: HUB_ID, entry: plan.entry, exit: plan.exit,
      archivero: plan.archivero, progreso: plan.progreso,
      rifts: Object.fromEntries(plan.targets.map((t, i) => [plan.rifts[i] ? t.key : t.key, { cell: plan.rifts[i] ?? plan.entry, to: t.mapId, cellTo: t.cell }])),
    },
    switches: { unlock: 882, seals: [883, 888], cleared: 889 },
    variables: { epGate: 264, epGateLate: 7, seals: 277 },
  };

  if (!VERIFY) {
    const hub = writeMap(HUB_ID, hudEvents);
    const cave = writeMap(CAVE_ID, caveGate);
    const data = JSON.parse(fs.readFileSync(EVENTS, "utf8"));
    data.hubMap = summary.hub;
    data.hubCave = summary.cave;
    if (!DRY) fs.writeFileSync(EVENTS, JSON.stringify(data, null, 2) + "\n");
    console.log(`Antesala ${HUB_ID}: ${hub.added.length} eventos (${hub.removed} reemplazados)`);
    for (const e of hub.added) console.log(`  ${e.name} @ ${e.x},${e.y}`);
    console.log(`Gruta ${CAVE_ID}: ${cave.added.length} eventos (${cave.removed} reemplazados)`);
    for (const e of cave.added) console.log(`  ${e.name} @ ${e.x},${e.y}`);
  } else {
    const failures = [];
    const ok = (cond, msg) => { if (!cond) failures.push(msg); };
    const data = JSON.parse(fs.readFileSync(EVENTS, "utf8"));
    ok(!!data.hubMap, "events_built.json: falta hubMap (corre `npm run dn:hub:events`)");
    const hub = grid(HUB_ID);
    const names = hub.events.map((e) => e.name);
    for (const want of ["HUB_SALIDA", "HUB_ARCHIVERO", "HUB_PROGRESO", ...plan.targets.map((t) => `HUB_GRIETA_${t.key}`)]) {
      ok(names.includes(want), `Antesala ${HUB_ID}: falta el evento ${want}`);
    }
    const cave = grid(CAVE_ID);
    ok(cave.events.some((e) => e.name === "HUB_GRIETA_CAVE"), `Gruta ${CAVE_ID}: falta la grieta de entrada`);
    const find = (name) => hub.events.find((e) => e.name === name);
    const salida = find("HUB_SALIDA");
    ok(salida && !(salida.x === plan.entry[0] && salida.y === plan.entry[1]), "la salida no puede estar en la celda de llegada (bucle)");
    const pagesOf = (ev) => (ev ? ev.obj.getIvar("@pages") ?? [] : []);
    for (const t of plan.targets) {
      const ev = find(`HUB_GRIETA_${t.key}`);
      ok(!!ev, `falta la grieta de ${t.key}`);
      if (!ev) continue;
      const pages = pagesOf(ev);
      ok(pages.length >= 2, `${t.key}: la grieta necesita página bloqueada y página abierta`);
      const open = pages[pages.length - 1];
      const cond = open.getIvar("@condition");
      ok(cond?.getIvar("@variable_valid") && cond.getIvar("@variable_id") === 264 && cond.getIvar("@variable_value") === t.unlock,
        `${t.key}: condición de apertura distinta de v264 ≥ ${t.unlock}`);
      const codes = (open.getIvar("@list") ?? []).map((c) => c.getIvar("@code"));
      ok(codes.includes(201), `${t.key}: la página abierta no transfiere`);
      const dest = (open.getIvar("@list") ?? []).find((c) => c.getIvar("@code") === 201)?.getIvar("@parameters");
      ok(dest?.[1] === t.mapId, `${t.key}: transfiere a ${dest?.[1]} y no a ${t.mapId}`);
    }
    const gate = cave.events.find((e) => e.name === "HUB_GRIETA_CAVE");
    const gateOpen = pagesOf(gate).slice(-1)[0];
    ok(!!gateOpen && (gateOpen.getIvar("@list") ?? []).some((c) => c.getIvar("@code") === 201), "la grieta de entrada no transfiere a la Antesala");
    if (warnings.length) for (const w of warnings) console.log(`  aviso: ${w}`);
    console.log(`verificación del hub jugable (${hub.events.length} eventos en ${HUB_ID}, ${cave.events.length} en ${CAVE_ID})`);
    if (failures.length) { for (const f of failures) console.error(`  FALLA: ${f}`); process.exit(1); }
    console.log("verificación del hub de eventos OK");
    return;
  }

  if (warnings.length) for (const w of warnings) console.log(`  aviso: ${w}`);
  console.log(DRY ? "(dry-run: no se escribió nada)" : "hub jugable listo");
  if (RENDER) await renderHub(plan);
}

main().catch((e) => { console.error(e); process.exit(1); });
