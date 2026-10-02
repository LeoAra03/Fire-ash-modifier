#!/usr/bin/env node
/**
 * dn_build_hub_map.mjs — construye la Antesala de las Grietas (Map2040), el hub
 * del Dimensional Nightmare.
 *
 * Es el único mapa del ciclo que **no** viene de una ficha de los mosaicos: se
 * arma con tiles del juego base, tomando la mejor «ventana jugable» de la Gruta
 * de los Testigos (Map2030) — el mapa donde el GDD sitúa las grietas.
 *
 * «Mejor ventana» = el recorte de 30×24 celdas con más superficie transitable y
 * mejor conectividad (BFS desde el borde inferior). Se copian las tres capas, se
 * registra en `MapInfos` y se heredan los metadatos del 2030.
 *
 * Uso:
 *   node tools/dn_build_hub_map.mjs --find      # muestra las mejores ventanas
 *   node tools/dn_build_hub_map.mjs             # construye (dry-run si --dry-run)
 *   node tools/dn_build_hub_map.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RObject, RString } from "../web/js/marshal.js";
import { parseMap, tableGet, tableToUserDef } from "../web/js/rmxp.js";
import { TileCanvas, buildMapObject, loadSourceMap, passabilityOf, reachableCells } from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const BACKUP = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups", "dimensional_nightmare_maps_originals");
const BUILT_PATH = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const SOURCE_ID = 2030;        // Gruta de los Testigos
const HUB_ID = 2040;           // Antesala de las Grietas
const WIDTH = 30, HEIGHT = 24; // tamaño de diseño del GDD
// Ventana elegida a ojo dentro de la Gruta: una sala amplia con un recodo, apta
// para repartir las seis grietas del hub en el perímetro.
const DEFAULT_WINDOW = [38, 20];
const TITLE = "Antesala de las Grietas";

const argv = process.argv.slice(2);
const FIND = argv.includes("--find");
const VERIFY = argv.includes("--verify");
const DRY = argv.includes("--dry-run");
const RENDER = argv.includes("--render");
const WINDOW_TOKEN = (() => {
  const at = argv.indexOf("--window");
  return at >= 0 && argv[at + 1] ? argv[at + 1] : null;
})();                                             // "ox,oy" para fijar la ventana a mano

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => {
  if (DRY) return;
  fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));
};
const S = (v) => RString.fromText(String(v));

// ------------------------------------------------------------- elegir ventana
const source = loadSourceMap(SOURCE_ID);
const pass = passabilityOf(source, source.tilesetId);

/** Métricas de una ventana: superficie transitable y conectividad desde abajo. */
function scoreWindow(ox, oy) {
  let walkable = 0;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) if (pass.passable(ox + x, oy + y, 8)) walkable++;
  }
  // entrada: la celda transitable más cercana al centro del borde inferior de la ventana
  let entry = null;
  for (let y = HEIGHT - 1; y >= 0 && !entry; y--) {
    for (let dx = 0; dx < WIDTH && !entry; dx++) {
      for (const x of [Math.floor(WIDTH / 2) + dx, Math.floor(WIDTH / 2) - dx]) {
        if (x < 0 || x >= WIDTH) continue;
        if (pass.passable(ox + x, oy + y, 8)) { entry = [ox + x, oy + y]; break; }
      }
    }
  }
  if (!entry) return { walkable, reachable: 0, ratio: 0, entry: null };
  const reach = reachableCells(pass, entry);
  let reachable = 0;
  let isolated = 0;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (!pass.passable(ox + x, oy + y, 8)) continue;
      if (reach.has(`${ox + x},${oy + y}`)) reachable++;
      else isolated++;
    }
  }
  return { walkable, reachable, isolated, ratio: walkable ? reachable / walkable : 0, entry, entryLocal: entry ? [entry[0] - ox, entry[1] - oy] : null };
}

/** Render de un recorte del mapa fuente con su tileset (para la evidencia del hub). */
async function renderWindow(tilesetId, ox, oy, width, height) {
  const tilesets = read("Tilesets.rxdata");
  const name = tilesets[tilesetId]?.getIvar("@tileset_name")?.text;
  const png = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Tilesets", `${name}.png`);
  const image = await loadImage(png);
  const COLUMNS = 8, TILE = 32;
  const canvas = createCanvas(width * TILE, height * TILE);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (const z of [0, 1, 2]) {
        const tile = tableGet(source.table, ox + x, oy + y, z);
        if (!tile) continue;
        ctx.drawImage(image, (tile % COLUMNS) * TILE, Math.floor(tile / COLUMNS) * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
  return canvas;
}

/** Evidencia del hub: ventana de la Gruta | mapa construido | overlay de transitabilidad. */
async function renderHubComparison(hubParsed, hubPass, entry) {
  const TILE = 32;
  const window = await renderWindow(source.tilesetId, win.ox, win.oy, WIDTH, HEIGHT);
  const built = createCanvas(WIDTH * TILE, HEIGHT * TILE);
  const bctx = built.getContext("2d");
  bctx.imageSmoothingEnabled = false;
  const tilesets = read("Tilesets.rxdata");
  const name = tilesets[source.tilesetId]?.getIvar("@tileset_name")?.text;
  const image = await loadImage(path.join(ROOT, "pokemon_fire_ash", "Graphics", "Tilesets", `${name}.png`));
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      for (const z of [0, 1, 2]) {
        const tile = tableGet(hubParsed.table, x, y, z);
        if (!tile) continue;
        bctx.drawImage(image, (tile % 8) * TILE, Math.floor(tile / 8) * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
  const overlay = createCanvas(WIDTH * TILE, HEIGHT * TILE);
  const octx = overlay.getContext("2d");
  const reach = entry ? reachableCells(hubPass, entry) : new Set();
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const walkable = hubPass.passable(x, y, 8);
      octx.fillStyle = walkable ? (reach.has(`${x},${y}`) ? "rgba(0,220,120,0.35)" : "rgba(255,200,0,0.45)") : "rgba(220,40,40,0.45)";
      octx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  const gap = 12;
  const total = createCanvas(WIDTH * TILE * 3 + gap * 4, HEIGHT * TILE + gap * 2);
  const ctx = total.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, total.width, total.height);
  ctx.drawImage(window, gap, gap);
  ctx.drawImage(built, gap * 2 + WIDTH * TILE, gap);
  ctx.globalAlpha = 0.85;
  ctx.drawImage(overlay, gap * 3 + WIDTH * TILE * 2, gap);
  ctx.globalAlpha = 1;
  const dir = path.join(ROOT, "docs", "dn_referencia", "detalle");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${HUB_ID}_comparacion.png`);
  fs.writeFileSync(out, total.toBuffer("image/png"));
  return out;
}

function bestWindow() {
  const candidates = [];
  for (let oy = 0; oy + HEIGHT <= source.height; oy += 2) {
    for (let ox = 0; ox + WIDTH <= source.width; ox += 2) {
      const s = scoreWindow(ox, oy);
      if (s.walkable < 40) continue;                 // demasiado muro
      if (s.ratio < 0.9) continue;                   // zonas aisladas
      candidates.push({ ox, oy, ...s, score: s.walkable * s.ratio });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Ventana elegida: la de `DEFAULT_WINDOW` (a ojo, una sala amplia con recodo) o la
 * forzada con `--window ox,oy`. Ambas deben estar entre las candidatas jugables.
 */
function pickWindow() {
  const candidates = bestWindow();
  if (!candidates.length) return { candidates, win: null };
  if (WINDOW_TOKEN) {
    const [ox, oy] = WINDOW_TOKEN.split(",").map(Number);
    return { candidates, win: candidates.find((c) => c.ox === ox && c.oy === oy) ?? null };
  }
  return { candidates, win: candidates.find((c) => c.ox === DEFAULT_WINDOW[0] && c.oy === DEFAULT_WINDOW[1]) ?? candidates[0] };
}

if (FIND) {
  const best = bestWindow().slice(0, 10);
  console.log(`ventanas jugables en Map${SOURCE_ID} (${source.width}×${source.height}) de ${WIDTH}×${HEIGHT}:`);
  for (const c of best) {
    console.log(`  (${String(c.ox).padStart(3)},${String(c.oy).padStart(3)}) · transitables ${c.walkable} · alcanzables ${c.reachable} (${(c.ratio * 100).toFixed(0)} %)`);
  }
  if (!best.length) console.error("ninguna ventana cumple (¿tileset de la Gruta sin pasajes?)");
  process.exit(best.length ? 0 : 1);
}

/** Comprueba que el hub reproduce exactamente la ventana elegida del mapa fuente. */
function verifyFidelity(parsed) {
  const { win: win2 } = pickWindow();
  if (!win2) return true;
  let diff = 0;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      for (const z of [0, 1, 2]) {
        if (tableGet(parsed.table, x, y, z) !== tableGet(source.table, win2.ox + x, win2.oy + y, z)) diff++;
      }
    }
  }
  console.log(`  fidelidad: ventana (${win2.ox},${win2.oy}) reproducida con ${diff} diferencias`);
  return diff === 0;
}

if (VERIFY) {
  const file = path.join(DATA, `Map${HUB_ID}.rxdata`);
  let failures = 0;
  const ok = (condition, label) => { if (!condition) { failures++; console.error(`  FALLA: ${label}`); } };
  ok(fs.existsSync(file), `falta Map${HUB_ID}.rxdata`);
  if (fs.existsSync(file)) {
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    ok(parsed.width === WIDTH && parsed.height === HEIGHT, `tamaño ${parsed.width}×${parsed.height} ≠ ${WIDTH}×${HEIGHT}`);
    ok(parsed.tilesetId === source.tilesetId, `tileset ${parsed.tilesetId} ≠ ${source.tilesetId}`);
    const hubPass = passabilityOf(parsed, parsed.tilesetId);
    let walkable = 0;
    let entry = null;
    for (let y = HEIGHT - 1; y >= 0 && !entry; y--) {
      for (let x = 0; x < WIDTH; x++) if (hubPass.passable(x, y, 8)) { entry = [x, y]; break; }
    }
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) if (hubPass.passable(x, y, 8)) walkable++;
    ok(!!entry, "sin entrada transitable en el borde inferior");
    if (entry) {
      const reach = reachableCells(hubPass, entry);
      let reachable = 0;
      for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) if (hubPass.passable(x, y, 8) && reach.has(`${x},${y}`)) reachable++;
      ok(reachable / walkable >= 0.9, `BFS ${((reachable / walkable) * 100).toFixed(0)} % < 90 % (umbral del hub reutilizado)`);
      console.log(`  Map${HUB_ID}: ${walkable} celdas transitables · ${reachable} alcanzables desde ${entry}`);
    }
    ok(verifyFidelity(parsed), "el hub no reproduce la ventana del fuente");
    const infos = read("MapInfos.rxdata").pairs;
    ok(infos.some(([key]) => Number(key) === HUB_ID), "falta en MapInfos");
    const metadata = read("map_metadata.dat").pairs;
    ok(metadata.some(([key]) => Number(key) === HUB_ID), "falta en map_metadata.dat");
  }
  console.log(failures === 0 ? `verificación del hub OK` : `verificación del hub con ${failures} fallos`);
  process.exit(failures === 0 ? 0 : 1);
}

const picked = pickWindow();
if (!picked.win) {
  console.error(WINDOW_TOKEN
    ? `La ventana ${WINDOW_TOKEN} no es jugable (revisa --find).`
    : "No hay ventana jugable en el mapa fuente. Revisa el tileset/pasajes del 2030.");
  process.exit(1);
}
const win = picked.win;
console.log(`ventana elegida: (${win.ox},${win.oy}) · ${win.walkable} transitables · BFS ${(win.ratio * 100).toFixed(0)} %`);

// ------------------------------------------------------------- construir mapa
const canvas = new TileCanvas(WIDTH, HEIGHT, source.tilesetId);
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    for (const z of [0, 1, 2]) canvas.set(x, y, z, tableGet(source.table, win.ox + x, win.oy + y, z));
  }
}
const object = buildMapObject(canvas, { bgm: "", encounterStep: 25 });

if (!DRY) {
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const file of ["MapInfos.rxdata", "map_metadata.dat"]) {
    const origin = path.join(DATA, file);
    const copy = path.join(BACKUP, file);
    if (fs.existsSync(origin) && !fs.existsSync(copy)) fs.copyFileSync(origin, copy);
  }
  write(`Map${HUB_ID}.rxdata`, object);

  const infos = read("MapInfos.rxdata");
  infos.pairs = infos.pairs.filter(([key]) => Number(key) !== HUB_ID);
  infos.pairs.push([HUB_ID, new RObject("RPG::MapInfo", [
    ["@scroll_x", 320], ["@name", S(`DN ${HUB_ID} · ${TITLE}`)], ["@expanded", false],
    ["@order", 1200], ["@scroll_y", 240], ["@parent_id", SOURCE_ID],
  ])]);
  write("MapInfos.rxdata", infos);

  const metadata = read("map_metadata.dat");
  const sourceMeta = metadata.pairs.find(([id]) => Number(id) === SOURCE_ID)?.[1];
  if (sourceMeta) {
    const meta = new RObject(sourceMeta.className, sourceMeta.ivars.map(([key, value]) => [key, value]));
    meta.setIvar("id", HUB_ID);
    metadata.pairs = metadata.pairs.filter(([id]) => Number(id) !== HUB_ID);
    metadata.pairs.push([HUB_ID, meta]);
    write("map_metadata.dat", metadata);
  }

  // se registra en el catálogo de construidos (tileset reutilizado del juego base)
  const built = fs.existsSync(BUILT_PATH) ? JSON.parse(fs.readFileSync(BUILT_PATH, "utf8")) : { maps: [] };
  built.maps = built.maps.filter((m) => m.id !== HUB_ID);
  built.maps.push({
    id: HUB_ID,
    episode: "HUB",
    title: TITLE,
    primary: null,
    reusedTileset: true,
    tilesetId: source.tilesetId,
    tiles: null,
    width: WIDTH,
    height: HEIGHT,
    bfs: { entry: win.entryLocal, reachable: win.reachable, walkable: win.walkable, ratio: win.ratio },
    source: `Map${SOURCE_ID} ventana (${win.ox},${win.oy})`,
  });
  built.maps.sort((a, b) => a.id - b.id);
  built.counts = built.maps.length;
  fs.writeFileSync(BUILT_PATH, `${JSON.stringify(built, null, 2)}\n`);
}

if (RENDER && !DRY) {
  const hubParsed = parseMap(object);
  const out = await renderHubComparison(hubParsed, passabilityOf(hubParsed, source.tilesetId), win.entryLocal);
  console.log(`  evidencia → ${path.relative(ROOT, out)}`);
}

console.log(`${DRY ? "[dry-run] " : ""}Map${HUB_ID} ${TITLE} · ${WIDTH}×${HEIGHT} · tileset ${source.tilesetId} (reutilizado) · BFS ${(win.ratio * 100).toFixed(0)} %`);
