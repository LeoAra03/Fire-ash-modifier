#!/usr/bin/env node
/**
 * dn_build_liga.mjs — Liga Oscura: el mundo final de los creepypastas (M2).
 *
 * Construye los dos mapas nuevos (ids siguientes al ciclo) con el lenguaje visual del Nexo —el
 * mundo del código— y monta el arco de Mad Pikachu:
 *
 *   2040 Antesala        HUB_LIGA_OSCURA    puerta central; se abre con las seis cartucheras (sw 917)
 *   2141 Pórtico         llegada, salida a la Antesala, custodio, eco y acceso al Coliseo
 *   2142 Coliseo         LIGA_MPIKA (máquina de etapas en v281) + cuatro LIGA_CHISPA_n
 *
 * Arco de Mad Pikachu: el Rotom escanea «nivel 255, fuera de rango» y se niega a calcular la
 * batalla → hay que completar las cuatro chispas del vínculo (rama Pikachu) o las cuatro marcas de
 * velocidad (rama Raichu) → **Arceus interviene y lo nivela a 150** → combate final contra
 * `DN_MPIKA_150` → cierre: se salva al Pikachu y a los mundos, con la Medalla del Vínculo y su
 * cartuchera «Badges of Mad Pikachu».
 *
 * El Pórtico conserva el lenguaje de código del Nexo; el Coliseo cambia con intención a un único
 * tileset funerario original de Fire Ash. Se compone como recinto irregular y asimétrico: bóveda
 * rota, altar teal descentrado, cuatro balizas y llegada separada de la salida.
 *
 * Uso:
 *   node tools/dn_build_liga.mjs            # mapas, eventos, trainer y arte
 *   node tools/dn_build_liga.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalDump, RObject, RHash, RSymbol } from "../web/js/marshal.js";
import { tableGet } from "../web/js/rmxp.js";
import { TileCanvas, buildMapObject, passabilityOf, reachableCells } from "./lib/map_painter.mjs";
import {
  DATA, GRAPHICS, ROOT, BUILT, EVENTS, CATALOG, Sym, S, txt, mapFile, readData, writeData, readMap, writeMap,
  backup, grid, nearestFreeCell, upsertEvents, cmd, condition, graphic, page, event, texts, script,
  transfer, selfSwitch, toneLine, readJson, writeJson, parseMap,
} from "./lib/dn_rmxp.mjs";

const argv = process.argv.slice(2);
const VERIFY = argv.includes("--verify");
const RENDER = argv.includes("--render");
const DRY = argv.includes("--dry-run");

const HUB_ID = 2040;
const PORTICO_ID = 2141;
const COLISEO_ID = 2142;
const SOURCE_ID = 2139;                       // Nexo — Pasillo de Código (estilo del mundo del código)
const COLISEO_SOURCE_ID = 1165;                // Fire Ash — torre funeraria, tileset original morado/piedra
const PORTICO_W = 22, PORTICO_H = 11;
const COLISEO_W = 30, COLISEO_H = 22;
const COLISEO_ENTRY = [14, 20];                // umbral interior: evita volver al Pórtico al aparecer
const COLISEO_EXIT = [14, 21];                 // salida única del anillo, separada del umbral

const SW = { ready: 917, ligaStarted: 918, arceus: 919, cleared: 920, pikaSaved: 921 };
const VAR = { branch: 278, sparks: 279, medals: 280, stage: 281, battle: 282 };
const STAGE = { intro: 0, prueba: 1, arceus: 2, combate: 3, cierre: 4 };
const MADPIKA = { type: "DN_MADPIKA", label: "MAD PIKACHU", species: "PIKACHU", level: 150 };

const CASES = ["DN_CASE_WHT", "DN_CASE_LSV", "DN_CASE_SNO", "DN_CASE_HYP", "DN_CASE_BLK", "DN_CASE_UNO"];
const readyCheck = `begin; $game_switches[${SW.ready}] = [${CASES.map((c) => `:${c}`).join(", ")}].all? { |i| $PokemonBag.pbHasItem?(i) }; rescue; end`;

function tilesetFile(name) {
  const dir = path.join(GRAPHICS, "Tilesets");
  const wanted = `${name}.png`.toLowerCase();
  const match = fs.readdirSync(dir).find((file) => file.toLowerCase() === wanted);
  if (!match) throw new Error(`falta Graphics/Tilesets/${name}.png (búsqueda insensible a mayúsculas)`);
  return path.join(dir, match);
}

const SENS_LIGA = toneLine([-40, -40, -40, 0], 16, "dn:ambiente");   // tono de sala (no va pegado a una transferencia)
const SENS_HUB = toneLine([0, 0, 0, 0], 16, "dn:ambiente");

// ------------------------------------------------------------------ ventanas
function bottomEntry(pass, w, h) {
  let best = null, bestD = Infinity;
  for (let x = 0; x < w; x++) {
    const d = Math.abs(x - Math.floor(w / 2));
    if (pass.passable(x, h - 1, 8) && d < bestD) { bestD = d; best = [x, h - 1]; }
  }
  return best;
}

/** Mejor ventana w×h del mapa fuente: proporción alcanzable desde su borde inferior. */
function bestWindow(source, w, h) {
  let best = null;
  for (let oy = 0; oy + h <= source.height; oy++) {
    for (let ox = 0; ox + w <= source.width; ox++) {
      const canvas = new TileCanvas(w, h, source.tilesetId);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          for (const z of [0, 1, 2]) canvas.set(x, y, z, tableGet(source.table, ox + x, oy + y, z));
        }
      }
      const pass = passabilityOf(canvas, source.tilesetId);
      let walkable = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (pass.passable(x, y, 8)) walkable++;
      const entry = bottomEntry(pass, w, h);
      const reach = entry ? reachableCells(pass, entry).size : 0;
      const ratio = walkable ? reach / walkable : 0;
      const score = ratio * 1000 + reach;
      if (!best || score > best.score) best = { ox, oy, walkable, reach, ratio, entry, score };
    }
  }
  return best;
}

function mostCommonFloor(source, win) {
  const count = new Map();
  for (let y = 0; y < win.h; y++) {
    for (let x = 0; x < win.w; x++) {
      const tile = tableGet(source.table, win.ox + x, win.oy + y, 0);
      if (!tile) continue;
      count.set(tile, (count.get(tile) ?? 0) + 1);
    }
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1343;
}

function buildPortico(source) {
  const win = bestWindow(source, PORTICO_W, PORTICO_H);
  const canvas = new TileCanvas(PORTICO_W, PORTICO_H, source.tilesetId);
  for (let y = 0; y < PORTICO_H; y++) {
    for (let x = 0; x < PORTICO_W; x++) {
      for (const z of [0, 1, 2]) canvas.set(x, y, z, tableGet(source.table, win.ox + x, win.oy + y, z));
    }
  }
  return { canvas, win };
}

/**
 * Coliseo: cámara de piedra tomada de un solo tileset original de Fire Ash (torre funeraria).
 * Se conserva la lectura pixel-art del tileset; el plano no remuestrea ni mezcla capturas: recorta
 * el santuario fuente, abre una galería lateral orgánica y talla una llegada serpenteante.
 */
function buildColiseo(source) {
  const sourcePass = passabilityOf(source, source.tilesetId);
  const floorCounts = new Map();
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    const tile = tableGet(source.table, x, y, 0);
    if (tile >= 384 && sourcePass.passable(x, y, 8)) floorCounts.set(tile, (floorCounts.get(tile) ?? 0) + 1);
  }
  const floor = [...floorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!floor) throw new Error(`Map${COLISEO_SOURCE_ID}: no se pudo identificar el suelo transitable`);

  const canvas = new TileCanvas(COLISEO_W, COLISEO_H, source.tilesetId);
  const voidTile = tableGet(source.table, 0, 0, 0);
  if (sourcePass.passable(0, 0, 8)) throw new Error(`Map${COLISEO_SOURCE_ID}: el tile de vacío del borde no bloquea el movimiento`);
  canvas.fillAll(0, voidTile);
  canvas.fillAll(1, 0);
  canvas.fillAll(2, 0);
  const copyCell = (sx, sy, dx, dy) => {
    if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) return;
    for (const z of [0, 1, 2]) canvas.set(dx, dy, z, tableGet(source.table, sx, sy, z));
  };
  const clearCell = (x, y) => {
    canvas.set(x, y, 0, floor);
    canvas.set(x, y, 1, 0);
    canvas.set(x, y, 2, 0);
  };

  // Núcleo de 25×22 sin escalar (sin estirar lápidas/columnas); el margen asimétrico queda abierto.
  for (let y = 0; y < COLISEO_H; y++) for (let x = 0; x < COLISEO_W; x++) copyCell(x - 2, y + 1, x, y);

  // Costura oriental: la escalera desemboca en una senda de anchura variable, con recodo y alcoba.
  const wing = [
    [21, 9], [22, 9], [23, 9],
    [21, 10], [22, 10], [23, 10], [24, 10],
    [21, 11], [22, 11], [23, 11], [24, 11],
    [22, 12], [23, 12], [24, 12], [25, 12], [26, 12],
    [24, 13], [25, 13], [26, 13], [27, 13],
    [26, 14], [27, 14], [28, 14], [29, 14],
    [27, 15], [28, 15],
  ];
  for (const [x, y] of wing) clearCell(x, y);

  // La escalera occidental colapsó: un borde roto asimétrico sustituye su espejo intacto.
  const collapse = [[2, 9], [3, 9], [2, 10], [3, 10], [4, 10], [2, 11], [3, 11], [4, 11], [3, 12], [4, 12], [5, 12], [4, 13]];
  for (const [x, y] of collapse) {
    canvas.set(x, y, 0, voidTile);
    canvas.set(x, y, 1, 0);
    canvas.set(x, y, 2, 0);
  }

  // Una fisura abre la bóveda por el nordeste; el resto del perímetro conserva la lectura de arco.
  for (const [x, y] of [[18, 1], [19, 1], [19, 2], [20, 2], [21, 3]]) clearCell(x, y);

  // Dos lápidas aisladas reaparecen en la alcoba, no como espejo de los hileros del santuario.
  copyCell(7, 5, 28, 13);
  copyCell(7, 5, 29, 15);

  // Senda de regreso en S: bordea el altar y corta una única hilera de sepulcros, sin calle recta.
  const procession = [[14, 21], [14, 20], [15, 19], [14, 18], [13, 17], [14, 16], [15, 15], [14, 14]];
  const carveLine = (from, to) => {
    let [x, y] = from;
    const [tx, ty] = to;
    const dx = Math.abs(tx - x), sx = x < tx ? 1 : -1;
    const dy = -Math.abs(ty - y), sy = y < ty ? 1 : -1;
    let error = dx + dy;
    while (true) {
      if (x >= 0 && y >= 0 && x < COLISEO_W && y < COLISEO_H) clearCell(x, y);
      if (x === tx && y === ty) break;
      const twice = 2 * error;
      if (twice >= dy) { error += dy; x += sx; }
      if (twice <= dx) { error += dx; y += sy; }
    }
  };
  for (let i = 0; i < procession.length - 1; i++) carveLine(procession[i], procession[i + 1]);

  // Elimina tres lápidas que repetían el espejo; el hueco irregular deja un atajo visual, no obligatorio.
  for (const [x, y] of [[9, 4], [10, 4], [21, 4], [21, 6], [22, 6], [7, 16]]) clearCell(x, y);

  const plazas = [[7, 6], [20, 5], [9, 17], [27, 13]];
  for (const [x, y] of plazas) clearCell(x, y);
  for (const [x, y] of [COLISEO_ENTRY, COLISEO_EXIT]) clearCell(x, y);

  const pass = passabilityOf(canvas, canvas.tilesetId);
  const reached = reachableCells(pass, COLISEO_ENTRY);
  for (const [x, y] of [[14, 11], ...plazas, COLISEO_EXIT]) {
    if (!reached.has(`${x},${y}`)) throw new Error(`Coliseo: ${x},${y} quedó aislado en Map${COLISEO_SOURCE_ID}`);
  }
  return { canvas, floor, plazas, source: COLISEO_SOURCE_ID };
}

// ------------------------------------------------------------------ registro de mapas
function registerMap(id, title, canvas, sourceId, parentId, entryCell = null) {
  const object = buildMapObject(canvas, { bgm: "", encounterStep: 25 });
  const parsed = { width: canvas.width, height: canvas.height };
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const entry = entryCell ?? bottomEntry(pass, parsed.width, parsed.height) ?? [Math.floor(parsed.width / 2), parsed.height - 1];
  if (!pass.passable(entry[0], entry[1], 8)) throw new Error(`Map${id}: entrada ${entry} no transitable`);
  const reach = reachableCells(pass, entry).size;
  let walkable = 0;
  for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) if (pass.passable(x, y, 8)) walkable++;
  if (!DRY) {
    backup(mapFile(id));
    for (const file of ["MapInfos.rxdata", "map_metadata.dat"]) backup(file);
    writeMap(id, object);
    const infos = readData("MapInfos.rxdata");
    infos.pairs = infos.pairs.filter(([key]) => Number(key) !== id);
    infos.pairs.push([id, new RObject("RPG::MapInfo", [
      ["@scroll_x", 320], ["@name", S(`DN ${id} · ${title}`)], ["@expanded", false],
      ["@order", 1300 + (id - PORTICO_ID)], ["@scroll_y", 240], ["@parent_id", parentId],
    ])]);
    writeData("MapInfos.rxdata", infos);
    const metadata = readData("map_metadata.dat");
    const sourceMeta = metadata.pairs.find(([key]) => Number(key) === sourceId)?.[1];
    if (sourceMeta) {
      const copy = new RObject(sourceMeta.className, sourceMeta.ivars.map(([key, value]) => [key, value]));
      copy.setIvar("id", id);
      metadata.pairs = metadata.pairs.filter(([key]) => Number(key) !== id);
      metadata.pairs.push([id, copy]);
      writeData("map_metadata.dat", metadata);
    }
    const built = readJson(BUILT);
    built.maps = built.maps.filter((m) => m.id !== id);
    built.maps.push({
      id, episode: "LIGA", title, primary: null, reusedTileset: true, tilesetId: canvas.tilesetId, tiles: null,
      width: parsed.width, height: parsed.height,
      bfs: { entry, reachable: reach, walkable, ratio: walkable ? reach / walkable : 0 },
      source: `Map${sourceId} · tileset funerario Fire Ash + cámara recortada y galería asimétrica`,
    });
    built.maps.sort((a, b) => a.id - b.id);
    built.counts = built.maps.length;
    writeJson(BUILT, built);
  }
  return { object, entry, reach, walkable, ratio: walkable ? reach / walkable : 0 };
}

// ------------------------------------------------------------------ arte y trainer
async function buildArt() {
  const front = path.join(GRAPHICS, "Pokemon", "Front", "PIKACHU.png");
  if (!fs.existsSync(front)) return { trainer: false, overworld: false, reason: "falta PIKACHU.png" };
  const img = await loadImage(front);
  const trainer = path.join(GRAPHICS, "Trainers", "DN_MADPIKA.png");
  const overworld = path.join(GRAPHICS, "Characters", "DN_MADPIKA.png");
  const tint = (ctx, w, h) => {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(170, 20, 20, 0.30)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  };
  if (!DRY) {
    const t = createCanvas(169, 169);
    const tc = t.getContext("2d");
    tc.imageSmoothingEnabled = false;
    tc.drawImage(img, 0, 0, img.width, img.height, 24, 30, 121, 121);
    tint(tc, 169, 169);
    fs.writeFileSync(trainer, t.toBuffer("image/png"));

    const frame = 48;
    const sheet = createCanvas(frame * 4, frame * 4);
    const sc = sheet.getContext("2d");
    sc.imageSmoothingEnabled = false;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const cell = createCanvas(frame, frame);
        const cc = cell.getContext("2d");
        cc.imageSmoothingEnabled = false;
        const shift = x % 2 === 1 ? 1 : 0;
        cc.drawImage(img, 0, 0, img.width, img.height, 4, 2 + shift, frame - 8, frame - 8);
        tint(cc, frame, frame);
        sc.drawImage(cell, x * frame, y * frame);
      }
    }
    fs.writeFileSync(overworld, sheet.toBuffer("image/png"));
  }
  return { trainer: true, overworld: true };
}

function installTrainerType() {
  const tt = readData("trainer_types.dat");
  if (tt.pairs.some(([key]) => txt(key) === MADPIKA.type)) return { added: false };
  const [, base] = tt.pairs.find(([key]) => txt(key) === "GENTLEMAN") ?? [];
  if (!base) throw new Error("no existe GENTLEMAN en trainer_types.dat");
  const clone = new RObject(base.className, base.ivars.map(([key, value]) => [key, value]));
  const numbers = tt.pairs.map(([, value]) => value.getIvar("@id_number")).filter((n) => typeof n === "number");
  clone.setIvar("@id", Sym(MADPIKA.type));
  clone.setIvar("@id_number", Math.max(-1, ...numbers) + 1);
  clone.setIvar("@real_name", S("Mad Pikachu"));
  clone.setIvar("@base_money", 255);
  tt.pairs.push([Sym(MADPIKA.type), clone]);
  backup("trainer_types.dat");
  if (!DRY) writeData("trainer_types.dat", tt);
  return { added: true };
}

function pokemonHash({ species, level }) {
  return new RHash([[Sym("species"), Sym(species)], [Sym("level"), level]]);
}

function installTrainer() {
  const trainers = readData("trainers.dat");
  if (trainers.pairs.some(([key]) => Array.isArray(key) && txt(key[1]) === MADPIKA.label)) return { added: false };
  const next = Math.max(-1, ...trainers.pairs.filter(([key]) => typeof key === "number").map(([key]) => key)) + 1;
  const key = [Sym(MADPIKA.type), S(MADPIKA.label), 0];
  const obj = new RObject("GameData::Trainer", [
    ["@id", key], ["@id_number", next], ["@trainer_type", key[0]],
    ["@real_name", S(MADPIKA.label)], ["@version", 0], ["@items", [Sym("FULLRESTORE")]],
    ["@real_lose_text", S("...el vínculo aguanta.")], ["@numpkmn", 0], ["@guara", 0],
    ["@pokemon", [pokemonHash(MADPIKA)]],
  ]);
  trainers.pairs.push([next, obj], [key, obj]);
  backup("trainers.dat");
  if (!DRY) writeData("trainers.dat", trainers);
  return { added: true, idNumber: next };
}

// ------------------------------------------------------------------ eventos
/** Celda libre alcanzable dentro de un mapa nuevo (se planifica sobre el canvas, sin eventos). */
function freeFromCanvas(canvas, from, maxDistance = 10) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const entry = bottomEntry(pass, canvas.width, canvas.height) ?? [Math.floor(canvas.width / 2), canvas.height - 1];
  const reach = reachableCells(pass, entry);
  const empty = { width: canvas.width, height: canvas.height, occupied: new Set(), pass };
  return nearestFreeCell(empty, from, { maxDistance, allowed: reach });
}

function buildPorticoEvents(baseId, plan) {
  const events = [];
  let id = baseId;
  events.push(event(id++, "LIGA_LLEGADA", plan.entry[0], plan.entry[1], [
    page({ list: [...texts(["Liga Oscura — Pórtico del Código.", "Vienes de la Antesala. Aquí se juntan las seis firmas, y una más."]), script(SENS_LIGA), cmd(0)] }),
  ]));
  events.push(event(id++, "LIGA_CUSTODIO", plan.custodio[0], plan.custodio[1], [
    page({
      cond: condition({ sw: SW.cleared }),
      gfx: graphic("trchar000", 2, 1),
      list: [...texts(["Custodio: el pulso volvió a su sitio.", "Los mundos respiran. Mad Pikachu te espera en la Antesala, ya sin tormenta."]), cmd(0)],
    }),
    page({
      gfx: graphic("trchar000", 2, 1),
      list: [...texts([
        "Custodio: aquí llegan los que cierran mundos, no los que ganan batallas.",
        "Arriba está el Coliseo. Lo que vive ahí no se mide en niveles normales.",
        "Si llevas un Pikachu, escúchalo antes de atacar. Si llevas un Raichu, ni lo intentes: corre.",
      ]), cmd(0)],
    }),
  ]));
  events.push(event(id++, "LIGA_ECO", plan.eco[0], plan.eco[1], [
    page({
      gfx: graphic("UNOWN", 2, 1, { hue: 200, opacity: 140 }),
      list: [...texts(["Un eco repite tu último paso.", "Después repite el de otra persona. Después el de nadie."]), cmd(0)],
    }),
  ]));
  events.push(event(id++, "LIGA_ACCESO_COLISEO", plan.acceso[0], plan.acceso[1], [
    page({ gfx: graphic("Object ball special", 2, 1), trigger: 1, list: [...texts(["La puerta del Coliseo cede."]), transfer(COLISEO_ID, plan.coliseoEntry[0], plan.coliseoEntry[1], 8), cmd(0)] }),
  ]));
  events.push(event(id++, "LIGA_SALIDA", plan.salida[0], plan.salida[1], [
    page({ gfx: graphic("Object ball special", 2, 1), trigger: 1, list: [...texts(["Vuelves a la Antesala de las Grietas."]), script(SENS_HUB), transfer(HUB_ID, plan.hubCell[0], plan.hubCell[1], 8), cmd(0)] }),
  ]));
  return events;
}

/** Un paso de la prueba: cuenta la chispa y, con las cuatro, llama a Arceus. */
function sparkEvent(id, name, cell, index, branch) {
  return event(id, name, cell[0], cell[1], [
    page({
      cond: condition({ self: "A" }),
      gfx: graphic("Object ball special", 2, 1, { opacity: 90 }),
      list: [...texts(["La chispa ya está contigo."]), cmd(0)],
    }),
    page({
      gfx: graphic("Object ball special", 2, 1, { hue: 32 + index * 24 }),
      list: [
        script([
          "begin",
          `  $game_variables[${VAR.sparks}] = [$game_variables[${VAR.sparks}] + 1, 4].min`,
          `  $game_variables[${VAR.stage}] = ${STAGE.arceus} if $game_variables[${VAR.sparks}] >= 4`,
          "rescue",
          "end",
        ].join("\n")),
        ...texts([
          branch === 2
            ? `Marca de velocidad ${index + 1}: la alcanzas por un pelo.`
            : `Chispa del vínculo ${index + 1}: el Coliseo se sostiene un poco más.`,
          "Rotom: «Quedan #{$game_variables[279]} de 4 chispas.»",
        ]),
        selfSwitch("A"),
        cmd(0),
      ],
    }),
  ]);
}

function buildColiseoEvents(baseId, plan) {
  const events = [];
  let id = baseId;
  events.push(event(id++, "LIGA_ENTRADA_COLISEO", plan.entry[0], plan.entry[1], [
    page({ list: [...texts(["Coliseo del Vínculo.", "El suelo tiembla al ritmo de algo que corre sin parar."]), script(SENS_LIGA), cmd(0)] }),
  ]));
  events.push(event(id++, "LIGA_MPIKA", plan.mpika[0], plan.mpika[1], [
    page({
      cond: condition({ variable: [VAR.stage, STAGE.intro] }),
      gfx: graphic("DN_MADPIKA", 2, 1),
      list: [
        script(SENS_LIGA),
        ...texts([
          "El Coliseo se cierra. Algo pequeño se pone de pie en el centro.",
          "Rotom: «Lectura imposible. NIVEL 255. FUERA DE RANGO.»",
          "Rotom: «No puedo calcular esta batalla. No es un combate: es una tormenta.»",
        ]),
        script([
          "begin",
          "  v = 3",
          "  $Trainer.party.each do |p|",
          "    next if !p",
          "    s = p.species.to_s.upcase",
          "    v = 2 if s.include?(\"RAICHU\")",
          "    v = 1 if s.include?(\"PIKACHU\") && v != 2",
          "  end",
          `  $game_variables[${VAR.branch}] = v`,
          "rescue",
          `  $game_variables[${VAR.branch}] = 3`,
          "end",
        ].join("\n")),
        cmd(111, [0, S(`$game_variables[${VAR.branch}] == 1`)]),
        ...texts(["Mad Pikachu te mira y baja la guardia un instante.", "Rotom: «Reconoce a los suyos. Quiere medir el vínculo, no la fuerza.»"], 1),
        cmd(411, [], 1),
        cmd(111, [0, S(`$game_variables[${VAR.branch}] == 2`)], 1),
        ...texts(["Mad Pikachu no duda ni un segundo: ya está encima de ti.", "Rotom: «Su velocidad es imparable. Aquí no se gana por fuerza: hay que sostener el vínculo.»"], 2),
        cmd(411, [], 2),
        ...texts(["Mad Pikachu te estudia como si fueras código.", "Rotom: «No hay Pikachu ni Raichu en el equipo. Aun así, quiere verte intentarlo.»"], 2),
        cmd(412, [], 1),
        cmd(412, [], 0),
        ...texts(["Cuatro chispas del vínculo sostienen el Coliseo.", "Si se apagan, la tormenta se lleva el mundo entero."]),
        script([`begin; $game_variables[${VAR.stage}] = ${STAGE.prueba}; $game_switches[${SW.ligaStarted}] = true; rescue; end`].join("\n")),
        cmd(0),
      ].flat(),
    }),
    page({
      cond: condition({ variable: [VAR.stage, STAGE.prueba] }),
      gfx: graphic("DN_MADPIKA", 2, 1),
      list: [...texts(["Rotom: «Chispas del vínculo: #{$game_variables[279]}/4.»", "Mad Pikachu espera, recorriendo el Coliseo en círculos imposibles."]), cmd(0)],
    }),
    page({
      cond: condition({ variable: [VAR.stage, STAGE.arceus] }),
      gfx: graphic("DN_MADPIKA", 2, 1),
      list: [
        script(toneLine([240, 240, 255, 0], 8, "dn:ambiente")),
        ...texts([
          "Las cuatro chispas se alinean y el Coliseo se queda en silencio.",
          "Una luz original baja por el centro: ARCEUS.",
          "ARCEUS: «Un nivel que no existe no puede sostener un mundo.»",
          "ARCEUS: «Se te devuelve al límite: 150. Ahora el vínculo sí puede medirse.»",
        ]),
        script([`begin; $game_switches[${SW.arceus}] = true; $game_variables[${VAR.stage}] = ${STAGE.combate}; rescue; end`].join("\n")),
        script(toneLine([-40, -40, -40, 0], 16, "dn:ambiente")),
        cmd(0),
      ],
    }),
    page({
      cond: condition({ variable: [VAR.stage, STAGE.combate] }),
      gfx: graphic("DN_MADPIKA", 2, 1),
      list: [
        ...texts(["Mad Pikachu baja al suelo. Ahora se puede pelear."]),
        script([
          "begin",
          `  $game_variables[${VAR.battle}] = pbTrainerBattle(PBTrainer.new("${MADPIKA.type}", "${MADPIKA.label}"), false, "", true) ? 1 : 0`,
          "rescue",
          `  $game_variables[${VAR.battle}] = 0`,
          "end",
        ].join("\n")),
        cmd(111, [0, S(`$game_variables[${VAR.battle}] == 1`)]),
        ...texts([
          "Mad Pikachu cae de rodillas, agotado, sin entender por qué ya no puede correr.",
          "Rotom: «No lo debilita el golpe: lo sostiene el vínculo.»",
          "El Coliseo se apaga. Los seis mundos respiran.",
          "Rotom: «Medalla del Vínculo obtenida. Cartuchera: Badges of Mad Pikachu.»",
        ], 1),
        script([`begin; pbReceiveItem(:DN_MEDAL_MPK); pbReceiveItem(:DN_CASE_MPK); $game_switches[${SW.cleared}] = true; $game_switches[${SW.pikaSaved}] = true; $game_variables[${VAR.stage}] = ${STAGE.cierre}; rescue; pbMessage("(medalla de la Liga pendiente de registrar)"); end`].join("\n"), 1),
        cmd(412, [], 0),
        cmd(111, [0, S(`$game_variables[${VAR.battle}] == 0`)]),
        ...texts(["Mad Pikachu te devuelve al Pórtico con un empujón de estática.", "Rotom: «El vínculo aguantó, pero no alcanzó. Inténtalo otra vez.»"], 1),
        transfer(PORTICO_ID, plan.porticoEntry[0], plan.porticoEntry[1], 8, 1),
        cmd(412, [], 0),
        cmd(0),
      ].flat(),
    }),
    page({
      cond: condition({ variable: [VAR.stage, STAGE.cierre] }),
      gfx: graphic("DN_MADPIKA", 2, 1),
      list: [...texts(["Mad Pikachu duerme en el centro del Coliseo.", "Ya no hay tormenta: los mundos creepypasta quedaron atrás."]), cmd(0)],
    }),
  ]));
  plan.sparks.forEach((cell, index) => {
    events.push(sparkEvent(id++, `LIGA_CHISPA_${index + 1}`, cell, index, plan.branch));
  });
  events.push(event(id++, "LIGA_SALIDA_COLISEO", plan.salida[0], plan.salida[1], [
    page({ gfx: graphic("Object ball special", 2, 1), trigger: 1, list: [...texts(["Bajas de nuevo al Pórtico."]), transfer(PORTICO_ID, plan.porticoEntry[0], plan.porticoEntry[1], 8), cmd(0)] }),
  ]));
  return events;
}

/** Puerta central de la Antesala: sólo se abre con las seis cartucheras. */
function buildHubGate(plan) {
  return [
    event(plan.id, "HUB_LIGA_OSCURA", plan.cell[0], plan.cell[1], [
      page({
        cond: condition({ sw: SW.ready }),
        gfx: graphic("Object ball special", 2, 1, { hue: 300 }),
        trigger: 1,
        list: [...texts(["La puerta de la Liga Oscura se abre.", "Seis firmas sostienen el mundo del código."]), script(SENS_LIGA), transfer(PORTICO_ID, plan.porticoEntry[0], plan.porticoEntry[1], 8), cmd(0)],
      }),
      page({
        gfx: graphic("Object ball special", 2, 1, { hue: 300, opacity: 160 }),
        list: [
          script(readyCheck),
          ...texts(["Una puerta de código espera las seis firmas.", "Rotom: «Cartucheras listas para la Liga: comprueba la Antesala.»"]),
          script('pbMessage("Rotom: «Cartucheras: #{(1..6).count { |i| $PokemonBag.pbHasItem?([:DN_CASE_WHT, :DN_CASE_LSV, :DN_CASE_SNO, :DN_CASE_HYP, :DN_CASE_BLK, :DN_CASE_UNO][i-1]) }} de 6.»")'),
          cmd(0),
        ],
      }),
    ]),
  ];
}

// ------------------------------------------------------------------ plan y escritura
async function buildPlan() {
  const source = parseMap(readMap(SOURCE_ID));
  const coliseoSource = parseMap(readMap(COLISEO_SOURCE_ID));
  const built = readJson(BUILT);
  const hubMeta = built.maps.find((m) => m.id === HUB_ID);
  const hubCell = readJson(EVENTS).hubMap?.entry ?? hubMeta?.bfs?.entry ?? [15, 22];

  const portico = buildPortico(source);
  const coliseo = buildColiseo(coliseoSource);
  const regPortico = registerMap(PORTICO_ID, "Liga Oscura — Pórtico del Código", portico.canvas, SOURCE_ID, 2140);
  const regColiseo = registerMap(COLISEO_ID, "Liga Oscura — Coliseo del Vínculo", coliseo.canvas, COLISEO_SOURCE_ID, PORTICO_ID, COLISEO_ENTRY);

  const pEntry = regPortico.entry;
  const cEntry = regColiseo.entry;
  const pAccess = { cell: freeFromCanvas(portico.canvas, [Math.floor(PORTICO_W / 2), 0], 8) };
  const pCustodio = { cell: freeFromCanvas(portico.canvas, [Math.floor(PORTICO_W / 2) - 5, Math.floor(PORTICO_H / 2)], 8) };
  const pEco = { cell: freeFromCanvas(portico.canvas, [Math.floor(PORTICO_W / 2) + 5, Math.floor(PORTICO_H / 2)], 8) };
  const pSalida = { cell: freeFromCanvas(portico.canvas, [3, PORTICO_H - 1], 6) };

  const cMpika = { cell: [14, 11] };                // sobre el sello teal central de la bóveda
  const cSparks = coliseo.plazas.map((cell) => cell);
  const cSalida = { cell: [14, COLISEO_H - 1] };   // puerta inferior, junto a la llegada

  const hub = grid(HUB_ID);
  const hubReach = reachableCells(hub.pass, hubGateEntry(hub));
  const gateCell = nearestFreeCell(hub, [Math.floor(hub.width / 2), Math.floor(hub.height / 2)], { maxDistance: 10, allowed: hubReach });

  return { source, portico, coliseo, regPortico, regColiseo, hubCell, hub, gateCell,
    pEntry, cEntry, pAccess, pCustodio, pEco, pSalida, cMpika, cSparks, cSalida };
}

function hubGateEntry(hub) {
  const built = readJson(BUILT).maps.find((m) => m.id === HUB_ID);
  return built?.bfs?.entry ?? [Math.floor(hub.width / 2), hub.height - 2];
}

// ------------------------------------------------------------------ render
async function renderLiga(plan) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const { tableGet } = await import("../web/js/rmxp.js");
  const S = 32, Z = 2, BASE = 384;
  const tilesets = readData("Tilesets.rxdata");
  const panels = [];
  const marks = {
    [PORTICO_ID]: [
      [plan.pEntry, "#2ecc71", "E"], [plan.pSalida.cell, "#3d7bff", "S"],
      [plan.pAccess.cell, "#ffd23d", "C"], [plan.pCustodio.cell, "#ff8ad8", "N"], [plan.pEco.cell, "#b06ad8", "e"],
    ],
    [COLISEO_ID]: [
      [plan.cEntry, "#2ecc71", "E"], [plan.cMpika.cell, "#ff3b30", "M"],
      ...plan.cSparks.map((cell, i) => [cell, "#00d0ff", String(i + 1)]),
      [plan.cSalida.cell, "#3d7bff", "S"],
    ],
  };
  for (const id of [PORTICO_ID, COLISEO_ID]) {
    const map = parseMap(readMap(id));
    const width = map.width, height = map.height;
    const tilesetId = map.tilesetId;
    const name = tilesets[tilesetId]?.getIvar("@tileset_name")?.text;
    const img = await loadImage(tilesetFile(name));
    const cols = Math.max(1, Math.floor(img.width / S));
    const canvas = createCanvas(width * S * Z, height * S * Z);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < 3; z++) {
          const tile = tableGet(map.table, x, y, z);
          if (!tile || tile < BASE) continue;
          const k = tile - BASE;
          ctx.drawImage(img, (k % cols) * S, Math.floor(k / cols) * S, S, S, x * S * Z, y * S * Z, S * Z, S * Z);
        }
      }
    }
    for (const [cell, color, label] of marks[id]) {
      if (!cell) continue;
      const cx = cell[0] * S * Z + S, cy = cell[1] * S * Z + S;
      ctx.beginPath(); ctx.arc(cx, cy, S * Z * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 2; ctx.strokeStyle = "#101418"; ctx.stroke();
      ctx.font = `bold ${Math.round(S * Z * 0.5)}px sans-serif`;
      ctx.fillStyle = "#101418"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, cx, cy + 1);
    }
    panels.push({ canvas, label: `${id}` });
  }
  const gap = 24, labelH = 34;
  const total = createCanvas(Math.max(...panels.map((p) => p.canvas.width)) , panels.reduce((sum, p) => sum + p.canvas.height + labelH, 0) + gap);
  const octx = total.getContext("2d");
  octx.fillStyle = "#1b1f24";
  octx.fillRect(0, 0, total.width, total.height);
  let y = labelH / 2;
  for (const panel of panels) {
    octx.fillStyle = "#e8e8e8";
    octx.font = "bold 20px sans-serif";
    octx.textAlign = "left";
    octx.fillText(`Map${panel.label} — Liga Oscura`, 12, y + 8);
    y += labelH;
    octx.drawImage(panel.canvas, 0, y);
    y += panel.canvas.height + gap / 2;
  }
  const out = path.join(ROOT, "docs", "dn_referencia", "lotes", "LIGA_2141_2142.png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, total.toBuffer("image/png"));
  console.log(`render: ${path.relative(ROOT, out)}`);
}

// ------------------------------------------------------------------ verificación
function axisMismatch(map, axis) {
  let mismatch = 0, total = 0;
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    const ox = axis === "x" ? map.width - 1 - x : x;
    const oy = axis === "y" ? map.height - 1 - y : y;
    if (y * map.width + x >= oy * map.width + ox) continue;
    total++;
    if (tableGet(map.table, x, y, 0) !== tableGet(map.table, ox, oy, 0)) mismatch++;
  }
  return total ? mismatch / total : 0;
}

function verify() {
  const failures = [];
  const ok = (cond, msg) => { if (!cond) failures.push(msg); };
  const built = readJson(BUILT);
  for (const [id, w, h] of [[PORTICO_ID, PORTICO_W, PORTICO_H], [COLISEO_ID, COLISEO_W, COLISEO_H]]) {
    const meta = built.maps.find((m) => m.id === id);
    ok(!!meta, `falta el mapa ${id} en el catálogo de construidos`);
    if (!meta) continue;
    const file = path.join(DATA, mapFile(id));
    ok(fs.existsSync(file), `falta ${mapFile(id)}`);
    const map = readMap(id);
    const parsed = { width: map.getIvar("@width"), height: map.getIvar("@height") };
    ok(parsed.width === w && parsed.height === h, `${id}: tamaño ${parsed.width}×${parsed.height} ≠ ${w}×${h}`);
    ok(readData("MapInfos.rxdata").pairs.some(([key]) => Number(key) === id), `${id}: falta en MapInfos`);
    ok(readData("map_metadata.dat").pairs.some(([key]) => Number(key) === id), `${id}: falta en map_metadata.dat`);
    const g = grid(id);
    ok((meta.bfs?.ratio ?? 0) >= 0.9, `${id}: BFS ${((meta.bfs?.ratio ?? 0) * 100).toFixed(0)} % (< 90 %)`);
    ok(g.events.length > 0, `${id}: sin eventos`);
    if (id === COLISEO_ID) {
      const horizontal = axisMismatch(g.parsed, "x");
      const vertical = axisMismatch(g.parsed, "y");
      ok(horizontal > 0.12 && vertical > 0.12, `${id}: composición demasiado simétrica (X ${(horizontal * 100).toFixed(0)} %, Y ${(vertical * 100).toFixed(0)} %)`);
      const entry = meta.bfs?.entry ?? COLISEO_ENTRY;
      const reached = reachableCells(g.pass, entry);
      for (const name of ["LIGA_ENTRADA_COLISEO", "LIGA_MPIKA", "LIGA_CHISPA_1", "LIGA_CHISPA_2", "LIGA_CHISPA_3", "LIGA_CHISPA_4", "LIGA_SALIDA_COLISEO"]) {
        const point = g.events.find((e) => e.name === name);
        ok(!!point, `Coliseo: falta ${name}`);
        if (point) ok(reached.has(`${point.x},${point.y}`), `Coliseo: ${name} no es alcanzable desde ${entry}`);
      }
      const exit = g.events.find((e) => e.name === "LIGA_SALIDA_COLISEO");
      ok(!exit || entry[0] !== exit.x || entry[1] !== exit.y, "Coliseo: la llegada coincide con el evento de salida (transferencia de retorno inmediata)");
    }
  }
  const portico = grid(PORTICO_ID);
  for (const name of ["LIGA_LLEGADA", "LIGA_CUSTODIO", "LIGA_ECO", "LIGA_ACCESO_COLISEO", "LIGA_SALIDA"]) {
    ok(portico.events.some((e) => e.name === name), `Pórtico ${PORTICO_ID}: falta ${name}`);
  }
  const coliseo = grid(COLISEO_ID);
  for (const name of ["LIGA_ENTRADA_COLISEO", "LIGA_MPIKA", "LIGA_CHISPA_1", "LIGA_CHISPA_2", "LIGA_CHISPA_3", "LIGA_CHISPA_4", "LIGA_SALIDA_COLISEO"]) {
    ok(coliseo.events.some((e) => e.name === name), `Coliseo ${COLISEO_ID}: falta ${name}`);
  }
  const mpika = coliseo.events.find((e) => e.name === "LIGA_MPIKA");
  ok(!!mpika && mpika.pages.length === 5, "LIGA_MPIKA: hacen falta 5 etapas (intro · prueba · Arceus · combate · cierre)");
  const stageOf = (pageObj) => pageObj?.getIvar("@condition")?.getIvar("@variable_value");
  const textsOf = (pageObj) => JSON.stringify((pageObj?.getIvar("@list") ?? []).map((c) => (c.getIvar("@parameters") ?? []).map((p) => txt(p)).join(" ")));
  if (mpika) {
    ok(stageOf(mpika.pages[2]) === STAGE.arceus, "LIGA_MPIKA: la etapa de Arceus no está en la página correcta");
    ok(textsOf(mpika.pages[2]).includes("ARCEUS"), "LIGA_MPIKA: la escena de Arceus no lo nombra");
    ok(textsOf(mpika.pages[2]).includes("150"), "LIGA_MPIKA: Arceus no nivela a 150");
    ok(textsOf(mpika.pages[2]).includes(`[${SW.arceus}]`) || textsOf(mpika.pages[2]).includes(String(SW.arceus)), "LIGA_MPIKA: Arceus no enciende su switch");
    ok(textsOf(mpika.pages[3]).includes(`PBTrainer.new(\\"${MADPIKA.type}\\"`), "LIGA_MPIKA: el combate final no invoca al trainer de Mad Pikachu");
    ok(textsOf(mpika.pages[3]).includes("DN_MEDAL_MPK") && textsOf(mpika.pages[3]).includes("DN_CASE_MPK"), "LIGA_MPIKA: el cierre no entrega medalla y cartuchera");
    ok(textsOf(mpika.pages[0]).includes(`[${VAR.branch}]`), "LIGA_MPIKA: la intro no detecta la rama (Pikachu/Raichu)");
  }
  const sparks = coliseo.events.filter((e) => e.name.startsWith("LIGA_CHISPA_"));
  ok(sparks.length === 4, `Coliseo: ${sparks.length} chispas (se esperan 4)`);
  for (const spark of sparks) ok(spark.pages.length === 2, `${spark.name}: necesita página de recogida y de repetida`);
  // trainer y arte
  const tt = readData("trainer_types.dat");
  ok(tt.pairs.some(([key]) => txt(key) === MADPIKA.type), `trainer_types.dat: falta ${MADPIKA.type}`);
  const trainers = readData("trainers.dat");
  const rec = trainers.pairs.find(([key]) => Array.isArray(key) && txt(key[1]) === MADPIKA.label);
  ok(!!rec, `trainers.dat: falta el entrenador ${MADPIKA.label}`);
  if (rec) {
    const team = rec[1].getIvar("@pokemon") ?? [];
    ok(team.length === 1, `${MADPIKA.label}: ${team.length} Pokémon (se espera 1)`);
    const mon = team[0];
    const byName = (a, b) => txt(a) === txt(b);
    ok(txt(mon.get(Sym("species"), byName)) === MADPIKA.species, `${MADPIKA.label}: especie ≠ ${MADPIKA.species}`);
    ok(mon.get(Sym("level"), byName) === MADPIKA.level, `${MADPIKA.label}: nivel ≠ ${MADPIKA.level} (Arceus lo nivela a 150)`);
  }
  ok(fs.existsSync(path.join(GRAPHICS, "Trainers", "DN_MADPIKA.png")), "falta Graphics/Trainers/DN_MADPIKA.png");
  ok(fs.existsSync(path.join(GRAPHICS, "Characters", "DN_MADPIKA.png")), "falta Graphics/Characters/DN_MADPIKA.png");
  // puerta del hub
  const hub = grid(HUB_ID);
  const gate = hub.events.find((e) => e.name === "HUB_LIGA_OSCURA");
  ok(!!gate, `Antesala ${HUB_ID}: falta HUB_LIGA_OSCURA`);
  if (gate) {
    const open = gate.pages[0];
    ok(open.getIvar("@condition")?.getIvar("@switch1_id") === SW.ready, "HUB_LIGA_OSCURA: la apertura no depende de las seis cartucheras");
    const openText = textsOf(open);
    ok(openText.includes(String(PORTICO_ID)), "HUB_LIGA_OSCURA: no transfiere al Pórtico");
  }
  console.log(`verificación de la Liga Oscura (mapas ${PORTICO_ID}/${COLISEO_ID}, trainer ${MADPIKA.label} nv ${MADPIKA.level}, ${sparks.length} chispas)`);
  console.log(`  Pórtico BFS ${((readJson(BUILT).maps.find((m) => m.id === PORTICO_ID)?.bfs?.ratio ?? 0) * 100).toFixed(0)} % · Coliseo BFS ${((readJson(BUILT).maps.find((m) => m.id === COLISEO_ID)?.bfs?.ratio ?? 0) * 100).toFixed(0)} %`);
  if (failures.length) { for (const f of failures) console.error(`  FALLA: ${f}`); process.exit(1); }
  console.log("verificación de la Liga OK");
}

// ------------------------------------------------------------------ main
if (VERIFY) {
  verify();
} else {
  const plan = await buildPlan();
  if (!plan.gateCell || !plan.cMpika.cell || plan.cSparks.some((c) => !c)) {
    console.error("No se pudieron resolver todas las celdas del plan:", JSON.stringify({ gate: plan.gateCell, mpika: plan.cMpika.cell, sparks: plan.cSparks }));
    process.exit(1);
  }
  const porticoSpec = {
    entry: plan.pEntry, custodio: plan.pCustodio.cell, eco: plan.pEco.cell, acceso: plan.pAccess.cell, salida: plan.pSalida.cell,
    coliseoEntry: plan.cEntry, hubCell: plan.hubCell,
  };
  const coliseoSpec = { entry: plan.cEntry, mpika: plan.cMpika.cell, sparks: plan.cSparks, branch: 1, salida: plan.cSalida.cell, porticoEntry: plan.pEntry };
  const gateSpec = { id: 1, cell: plan.gateCell, porticoEntry: plan.pEntry };
  const portico = DRY
    ? { added: buildPorticoEvents(1, porticoSpec).map((e) => ({ name: txt(e.getIvar("@name")), x: e.getIvar("@x"), y: e.getIvar("@y") })) }
    : upsertEvents(PORTICO_ID, ["LIGA_LLEGADA", "LIGA_CUSTODIO", "LIGA_ECO", "LIGA_ACCESO_COLISEO", "LIGA_SALIDA"], (baseId) => buildPorticoEvents(baseId, porticoSpec), { dry: DRY });
  const coliseo = DRY
    ? { added: buildColiseoEvents(1, coliseoSpec).map((e) => ({ name: txt(e.getIvar("@name")), x: e.getIvar("@x"), y: e.getIvar("@y") })) }
    : upsertEvents(COLISEO_ID, ["LIGA_ENTRADA_COLISEO", "LIGA_MPIKA", "LIGA_CHISPA_1", "LIGA_CHISPA_2", "LIGA_CHISPA_3", "LIGA_CHISPA_4", "LIGA_SALIDA_COLISEO"], (baseId) => buildColiseoEvents(baseId, coliseoSpec), { dry: DRY });
  const gate = upsertEvents(HUB_ID, ["HUB_LIGA_OSCURA"], (baseId) => buildHubGate({ ...gateSpec, id: baseId }), { dry: DRY });
  if (!DRY) {
    const data = readJson(EVENTS);
    data.liga = {
      maps: { portico: PORTICO_ID, coliseo: COLISEO_ID },
      gate: { map: HUB_ID, event: "HUB_LIGA_OSCURA", cell: plan.gateCell },
      entry: { portico: plan.pEntry, coliseo: plan.cEntry },
      exit: { portico: plan.pSalida.cell, coliseo: plan.cSalida.cell },
      mpika: plan.cMpika.cell,
      sparks: plan.cSparks,
      switches: SW, variables: VAR, stage: STAGE,
      trainer: `${MADPIKA.type}/${MADPIKA.label} nv ${MADPIKA.level}`,
    };
    writeJson(EVENTS, data);
  }
  const art = await buildArt();
  const type = installTrainerType();
  const trainer = installTrainer();
  console.log(`Liga Oscura: Map${PORTICO_ID} ${PORTICO_W}×${PORTICO_H} (BFS ${(plan.regPortico.ratio * 100).toFixed(0)} %, ventana ${plan.portico.win.ox},${plan.portico.win.oy})`);
  console.log(`  Map${COLISEO_ID} ${COLISEO_W}×${COLISEO_H} (BFS ${(plan.regColiseo.ratio * 100).toFixed(0)} %, planta orgánica asimétrica, entrada interior ${COLISEO_ENTRY.join(",")} / salida ${COLISEO_EXIT.join(",")})`);
  console.log(`  eventos: Pórtico ${portico.added.length} · Coliseo ${coliseo.added.length} · Antesala ${gate.added.length}`);
  if (DRY) for (const group of [portico, coliseo, gate]) for (const e of group.added) console.log(`    · ${e.name} @ ${e.x},${e.y}`);
  console.log(`  Mad Pikachu: tipo ${type.added ? "creado" : "ya existía"} · trainer ${trainer.added ? `#${trainer.idNumber}` : "ya existía"} · arte ${art.trainer ? "OK" : art.reason}`);
  if (RENDER) await renderLiga(plan);
}
