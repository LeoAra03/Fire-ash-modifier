#!/usr/bin/env node
/**
 * dn_propose_passability.mjs — propuesta de muros para los mapas del Nightmare.
 *
 * El color por sí solo no distingue muro de suelo en este arte (el azul es agua en
 * R5/R6, glitch en R1 y trono en R4; la oscuridad es cueva en R7 y noche en R5).
 * Este script usa ESTRUCTURA y CONECTIVIDAD:
 *
 *   1. Un bloque es "estructurado" si tiene mucho detalle local de alto contraste
 *      (árboles, tejados, muros, pilares) o si es casi negro (masa de cueva).
 *   2. Los bloques estructurados que forman un grupo grande (≥ 4) son muro; los
 *      grupos diminutos son ruido de la máscara y se dejan transitables.
 *   3. Un bloque no-muro encerrado entre muros (sin salida al borde del mapa) se
 *      marca muro: no se puede llegar a él.
 *   4. De lo que queda transitable se conserva la componente más grande —donde
 *      está el ancla, el punto de pie que muestra la referencia— y las islas
 *      sueltas pasan a muro, para que el BFS no encuentre zonas inalcanzables.
 *
 * Los ajustes manuales mandan siempre:
 *   content/dimensional_nightmare_passability.json → maps["<id>"].open[]    fuerza transitable
 *                                                                  .blocked[] fuerza muro
 * Al re-ejecutar se conservan `open` y `blocked` (se recalcula solo lo demás).
 *
 * Salida: `content/dimensional_nightmare_passability.json` + overlay por mapa en
 * `docs/dn_referencia/pasajes/<id>_pasajes.png` (verde = transitable, rojo = muro).
 *
 * Uso:
 *   node tools/dn_propose_passability.mjs --only 2041,2088,2120 --render
 *   node tools/dn_propose_passability.mjs --episode EP01
 *   node tools/dn_propose_passability.mjs --only 2041 --edge 0.2 --min 6   # calibrar
 *   node tools/dn_propose_passability.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "content", "dimensional_nightmare_tiles_2x.json");
const BLUEPRINT = path.join(ROOT, "content", "dimensional_nightmare_maps.json");
const OUT = path.join(ROOT, "content", "dimensional_nightmare_passability.json");
const RENDER_DIR = path.join(ROOT, "docs", "dn_referencia", "pasajes");
const TILE = 32;
const COLUMNS = 8;

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const ONLY = option("--only", null)?.split(",").map((s) => Number(s.trim())).filter(Boolean) ?? null;
const EPISODE = option("--episode", null);
const RENDER = argv.includes("--render");
const VERIFY = argv.includes("--verify");
const EDGE = Number(option("--edge", "0.16"));   // fracción de píxeles de borde = bloque estructurado
const VOID = Number(option("--void", "0.8"));    // fracción de píxeles casi negros = masa sólida
const MIN_GROUP = Number(option("--min", "4"));  // grupos menores = ruido, se dejan transitables
const MIN_WALK = Number(option("--min-walk", "0.25")); // suelo mínimo garantizado por mapa

const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT, "utf8"));
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { maps: {} };
const result = {
  generatedBy: "tools/dn_propose_passability.mjs",
  how: "estructura (edge/void) + grupos grandes = muro + huecos internos = muro + componente mayor = transitable; `open`/`blocked` manuales mandan",
  thresholds: { edge: EDGE, void: VOID, minGroup: MIN_GROUP, minWalk: MIN_WALK },
  maps: {},  // se fusiona con el archivo existente: ejecutar con --only no borra el resto
};

const keyOf = (map) => `${map.primary.key}/${path.basename(map.primary.slice)}`;

// ---------------------------------------------------------------- features
const featuresCache = new Map();
async function featuresOf(groupKey, tilesetPath) {
  if (featuresCache.has(groupKey)) return featuresCache.get(groupKey);
  const img = await loadImage(path.join(ROOT, tilesetPath));
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  const luma = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const perTile = new Map();
  const features = (idx) => {
    if (perTile.has(idx)) return perTile.get(idx);
    const x0 = (idx % COLUMNS) * TILE, y0 = Math.floor(idx / COLUMNS) * TILE;
    let edges = 0, dark = 0, n = 0;
    for (let y = 1; y < TILE - 1; y++) {
      for (let x = 1; x < TILE - 1; x++) {
        const i = ((y0 + y) * img.width + x0 + x) * 4;
        const gx = Math.abs(luma(i + 4) - luma(i - 4));
        const gy = Math.abs(luma(i + img.width * 4) - luma(i - img.width * 4));
        if (gx + gy > 34) edges++;
        if (luma(i) < 26) dark++;
        n++;
      }
    }
    const value = { edge: edges / n, dark: dark / (TILE * TILE) };
    perTile.set(idx, value);
    return value;
  };
  const entry = { features, width: img.width };
  featuresCache.set(groupKey, entry);
  return entry;
}

// ------------------------------------------------------------------- máscara
/** Componentes 8-direccionales de la máscara de bloques estructurados. */
function structuralGroups(structured, width, height, minGroup) {
  const seen = structured.map((row) => row.map(() => false));
  const wall = structured.map((row) => row.map(() => false));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!structured[y][x] || seen[y][x]) continue;
      const stack = [[x, y]];
      const comp = [];
      seen[y][x] = true;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        comp.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (structured[ny][nx] && !seen[ny][nx]) { seen[ny][nx] = true; stack.push([nx, ny]); }
          }
        }
      }
      if (comp.length >= minGroup) for (const [cx, cy] of comp) wall[cy][cx] = true;
    }
  }
  return wall;
}

/** BFS 4-direccional desde una celda sobre la máscara transitable. */
function reachFrom(walk, width, height, start) {
  const label = walk.map((row) => row.map(() => false));
  if (!start) return { label, size: 0 };
  const queue = [start];
  label[start[1]][start[0]] = true;
  while (queue.length) {
    const [cx, cy] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (walk[ny][nx] && !label[ny][nx]) { label[ny][nx] = true; queue.push([nx, ny]); }
    }
  }
  let size = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (label[y][x]) size++;
  return { label, size };
}

/** Entrada del mapa: celda transitable más cercana al centro del borde inferior. */
function entryCell(walk, width, height) {
  for (let y = height - 1; y >= 0; y--) {
    for (let x = Math.floor(width / 2); x < width; x++) if (walk[y][x]) return [x, y];
    for (let x = Math.floor(width / 2) - 1; x >= 0; x--) if (walk[y][x]) return [x, y];
  }
  return null;
}

function rectCells(rect, width, height) {
  const [x0, y0, x1, y1] = rect;
  const cells = [];
  for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x++) cells.push(`${x},${y}`);
  }
  return cells;
}

// ------------------------------------------------------------------- main
let entries = blueprint.maps.filter((m) => m.primary);
if (ONLY) entries = entries.filter((m) => ONLY.includes(m.id));
else if (EPISODE) entries = entries.filter((m) => m.episode === EPISODE);
else if (VERIFY) entries = entries.filter((m) => existing.maps?.[String(m.id)]);
else entries = entries.filter((m) => [2041, 2088, 2120].includes(m.id));

for (const [id, value] of Object.entries(existing.maps ?? {})) result.maps[id] = value; // conserva lo no reprocesado
let differences = 0;
for (const entry of entries) {
  const group = catalog.groups.find((g) => g.key === entry.primary.key);
  const ficha = group.maps.find((m) => keyOf(entry) === `${group.key}/${path.basename(m.slice)}`);
  if (!ficha) throw new Error(`Ficha ausente en el catálogo: ${keyOf(entry)}`);
  const { features } = await featuresOf(group.key, group.tileset);
  const width = ficha.matrix[0].length, height = ficha.matrix.length;

  // 1) propuesta automática: bloques estructurados en grupos grandes = muro
  const structured = ficha.matrix.map((row) => row.map((idx) => {
    const f = features(idx);
    return f.edge >= EDGE || f.dark >= VOID;
  }));
  const wall = structuralGroups(structured, width, height, MIN_GROUP);

  // 2) ajustes manuales (mandan sobre la propuesta)
  const previous = existing.maps ?? {};
  const current = previous[String(entry.id)] ?? {};
  const openRects = current.openRects ?? [];
  const blockRects = current.blockRects ?? [];
  const openCells = new Set([...(current.open ?? []), ...openRects.flatMap((r) => rectCells(r, width, height))]);
  const blockedCells = new Set([...(current.blocked ?? []), ...blockRects.flatMap((r) => rectCells(r, width, height))]);

  // 2.5) puenteo acotado: abre el mínimo de bloques de muro para unir la zona
  //      alcanzable desde la entrada con el resto de celdas transitables.
  //      Sin esto, la poda del paso 3 convertiría en muro zonas legítimas que
  //      quedaron separadas por 1-2 bloques (probado en el piloto).
  const bridgeBudget = Math.max(4, Math.round(width * height * 0.03));
  const autoOpen = new Set();   // celdas abiertas por el algoritmo (no manuales)
  const bridged = [];
  const walkOf = () => {
    const w = wall.map((row) => row.map(() => true));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      w[y][x] = !(blockedCells.has(key) || (wall[y][x] && !openCells.has(key) && !autoOpen.has(key)));
    }
    return w;
  };
  for (let attempt = 0; attempt < bridgeBudget; attempt++) {
    const w = walkOf();
    const start = entryCell(w, width, height);
    const { label, size } = reachFrom(w, width, height, start);
    let walkableCount = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (w[y][x]) walkableCount++;
    if (size >= walkableCount || !start) break;
    let best = null, bestScore = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!wall[y][x] || blockedCells.has(`${x},${y}`)) continue;
        let inside = 0, outside = 0;
        // 8 vecinos: dos regiones pueden tocarse solo en diagonal
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (label[ny][nx]) inside++;
            else if (w[ny][nx]) outside++;
          }
        }
        const score = Math.min(inside, 1) * outside;
        if (score > bestScore) { bestScore = score; best = [x, y]; }
      }
    }
    if (!best) break;
    autoOpen.add(`${best[0]},${best[1]}`);
    bridged.push(`${best[0]},${best[1]}`);
  }

  // 2.6) suelo mínimo: si el puenteo no alcanza para dejar el mapa jugable (arte
  //      muy detallado), se abren los bloques más "planos" que toquen la zona
  //      alcanzable hasta llegar a MIN_WALK del mapa. Así ningún mapa del ciclo
  //      sale con un pasillo de 5 celdas.
  // El suelo mínimo se mide sobre el AL CANCE desde la entrada (que es lo que
  // sobrevive a la poda del paso 3), no sobre el total de celdas abiertas.
  const minWalk = Math.min(Math.max(MIN_WALK, 0), 1) * width * height;
  for (let guard = 0; guard < width * height; guard++) {
    const w = walkOf();
    const start = entryCell(w, width, height);
    const { label, size } = reachFrom(w, width, height, start);
    if (size >= minWalk || !start) break;
    let best = null, bestScore = Infinity;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!wall[y][x] || openCells.has(`${x},${y}`) || autoOpen.has(`${x},${y}`)) continue;
        let touchesReach = false;
        for (let dy = -1; dy <= 1 && !touchesReach; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (label[ny][nx]) { touchesReach = true; break; }
          }
        }
        if (!touchesReach) continue;
        const f = features(ficha.matrix[y][x]);
        const score = f.edge + f.dark;
        if (score < bestScore) { bestScore = score; best = [x, y]; }
      }
    }
    if (!best) break;
    autoOpen.add(`${best[0]},${best[1]}`);
    bridged.push(`${best[0]},${best[1]}`);
  }

  // 3) poda: toda celda transitable que no se alcance desde la entrada pasa a muro
  //    (no puede haber zonas transitables inalcanzables: rompe el checklist)
  //    Ojo: se parte de walkOf(), que ya incluye puenteo y suelo mínimo.
  const finalWalk = walkOf();
  const entry0 = entryCell(finalWalk, width, height);
  const reach0 = reachFrom(finalWalk, width, height, entry0);
  const pruned = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (finalWalk[y][x] && !reach0.label[y][x]) { finalWalk[y][x] = false; pruned.push(`${x},${y}`); }
    }
  }
  const walk = finalWalk;
  if (process.env.DN_DEBUG) {
    let walls = 0; for (const row of wall) for (const v of row) if (v) walls++;
    console.log(`  [debug ${entry.id}] wall=${walls} blockedCells=${blockedCells.size} openCells=${openCells.size} autoOpen=${autoOpen.size} walkable=${walk.flat().filter(Boolean).length}`);
  }

  if (VERIFY) {
    const previous = new Set(current.computed ?? []);
    const now = new Set();
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (!walk[y][x]) now.add(`${x},${y}`);
    const added = [...now].filter((k) => !previous.has(k)).length;
    const removed = [...previous].filter((k) => !now.has(k)).length;
    differences += added + removed;
    console.log(`${entry.id}: muros ${now.size}/${width * height} · cambios vs. guardado +${added}/-${removed} · manuales: open ${openCells.size}, blocked ${blockedCells.size}`);
    continue;
  }

  const entryFinal = entryCell(walk, width, height);
  const reach = reachFrom(walk, width, height, entryFinal);
  const blocked = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (!walk[y][x]) blocked.push(`${x},${y}`);
  let walkable = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (walk[y][x]) walkable++;

  const exits = [];
  for (let x = 0; x < width; x++) { if (walk[0][x]) exits.push(`T${x}`); if (walk[height - 1][x]) exits.push(`B${x}`); }
  for (let y = 0; y < height; y++) { if (walk[y][0]) exits.push(`L${y}`); if (walk[y][width - 1]) exits.push(`R${y}`); }

  result.maps[String(entry.id)] = {
    episode: entry.episode,
    title: entry.title,
    ficha: `R${entry.primary.resource.slice(1)}-${entry.primary.index}`,
    slice: entry.primary.slice,
    width, height,
    entry: entryFinal ?? null,
    open: [...openCells],
    blocked: [...blockedCells],
    auto: [...autoOpen],
    computed: blocked,
    stats: { walls: blocked.length, walkable, pruned: pruned.length, bridged: bridged.length },
    note: "computed = propuesta automática podada; open/blocked (celdas o rectángulos) mandan sobre ella.",
  };
  console.log(`${entry.id} ${entry.title}: muros ${blocked.length}/${width * height} (${(100 * blocked.length / (width * height)).toFixed(0)} %) · transitables ${walkable} desde ${entryFinal ?? "—"} · puenteadas ${bridged.length} · podadas ${pruned.length} · salidas al borde ${exits.length ? exits.join(" ") : "ninguna"}`);

  if (RENDER) {
    const img = await loadImage(path.join(ROOT, entry.primary.slice));
    const canvas = createCanvas(width * TILE, height * TILE);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, img.width * 2, img.height * 2);
    const blockedSet = new Set(blocked);
    const prunedSet = new Set(pruned);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        ctx.fillStyle = blockedSet.has(key) ? "rgba(225,45,45,0.45)"
          : openCells.has(key) ? "rgba(60,140,255,0.40)"
          : "rgba(0,220,120,0.22)";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        if (prunedSet.has(key)) {
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.strokeRect(x * TILE + 6, y * TILE + 6, TILE - 12, TILE - 12);
        }
      }
    }
    fs.mkdirSync(RENDER_DIR, { recursive: true });
    const out = path.join(RENDER_DIR, `${entry.id}_pasajes.png`);
    fs.writeFileSync(out, canvas.toBuffer("image/png"));
    console.log(`  overlay → ${path.relative(ROOT, out)} (verde transitable · azul abierto a mano · rojo muro · recuadro = podada)`);
  }
}

if (VERIFY) {
  console.log(differences === 0 ? "passability.json al día" : `hay ${differences} diferencias: re-ejecuta sin --verify para actualizar`);
  process.exit(differences === 0 ? 0 : 1);
}

fs.writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(`\npassability.json → ${path.relative(ROOT, OUT)} (${Object.keys(result.maps).length} mapas)`);
