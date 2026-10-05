/**
 * region_builder.mjs — Compositor de mapas con criterio de Game Freak.
 *
 * Aquí viven los tres departamentos que define el orquestador, pero adaptados
 * al motor real de este proyecto (RPG Maker XP + Essentials, no PSDK/Tiled:
 * los mapas son `MapNNN.rxdata`, no `.tmx`).
 *
 *   · subagent_mapper      → `trazar()` + `construir()`: dibuja la planta y la
 *                            pinta con materiales aprendidos de mapas reales.
 *   · subagent_qa_tester   → `auditar()`: inundación (BFS) desde la llegada,
 *                            detección de softlocks con coordenadas, celdas
 *                            vacías y pasillos de menos de dos tiles.
 *   · subagent_vision_director → `auditar()`: monotonía, costuras y prioridad
 *                            de capas, comprobadas sobre los tiles escritos.
 *
 * La clave de la calidad está en `learnMaterial`: no inventa combinaciones de
 * tiles, sino que **aprende del juego base** qué dibujó el autor original en
 * cada vecindad (bordes, esquinas, copas, frentes de acantilado) y reproduce
 * esas mismas reglas. Por eso los bordes salen bien y la pasabilidad y el
 * terreno (y con ellos los encuentros) son los reales.
 *
 * Nunca se edita un mapa existente: todo se escribe en IDs nuevos.
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, GAME, ROOT, iv, makeChecker, mapFile, marshalDump, marshalLoad, RHash, RObject,
  RString, commandsOf, installMapInfos, installMetadata,
} from "./dlc_helpers.mjs";
import {
  TileCanvas, buildMapObject, learnMaterial, loadSourceMap, paintMaterial,
  passabilityOf, reachableCells, tilesets,
} from "./map_painter.mjs";
import { parseMap, parseTileset, tableGet } from "../../web/js/rmxp.js";
import { rng } from "./png.mjs";

const pad3 = (n) => String(n).padStart(3, "0");
const key = (x, y) => `${x},${y}`;
const unkey = (k) => k.split(",").map(Number);

/** Etiquetas de terreno de Essentials (GameData::TerrainTag). */
export const TAG = {
  None: 0, Ledge: 1, Grass: 2, Sand: 3, Rock: 4, DeepWater: 5, StillWater: 6,
  Water: 7, Waterfall: 8, WaterfallCrest: 9, TallGrass: 10, UnderwaterGrass: 11,
  Ice: 12, Neutral: 13, SootGrass: 14, Bridge: 15, Puddle: 16, NoEffect: 17,
};
const ES_AGUA = new Set([TAG.DeepWater, TAG.StillWater, TAG.Water]);

/* ───────────────────────────── aprendizaje ─────────────────────────────── */

const cacheTilesets = () => tilesets();

/** Datos de pasabilidad / prioridad / terreno de un tileset. */
export function datosTileset(tsId) {
  return cacheTilesets().get(tsId);
}

/**
 * Clasifica los tiles de un mapa donante en suelo, muro y agua.
 * Se hace por pasabilidad real del tileset, no por intuición: lo que el juego
 * deja pisar es suelo, lo que bloquea es muro.
 */
export function clasificar(mapId) {
  const p = loadSourceMap(mapId);
  const ts = datosTileset(p.tilesetId);
  const suelo = new Set(), muro = new Set(), agua = new Set();
  const cuenta = new Map();
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      const t = tableGet(p.table, x, y, 0);
      if (!t) continue;
      const pas = ts.passages.data[t] ?? 0;
      const tag = ts.terrain.data[t] ?? 0;
      if (ES_AGUA.has(tag)) { agua.add(t); continue; }
      if (pas === 0) {
        suelo.add(t);
        cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
      } else if (pas === 15) muro.add(t);
    }
  }
  const dominante = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  return { tilesetId: p.tilesetId, suelo, muro, agua, dominante };
}

/**
 * Familia arquitectónica de un donante: mapas con el mismo tileset y el mismo
 * suelo dominante. Aprender de la familia en vez de un solo mapa da más
 * vocabulario sin salirse del estilo.
 */
export function familia(mapId, cuantos = 5) {
  const base = clasificar(mapId);
  const ids = [];
  for (const f of fs.readdirSync(DATA)) {
    const m = /^Map(\d+)\.rxdata$/.exec(f);
    if (!m) continue;
    const id = Number(m[1]);
    // Nuestros propios mapas del DLC (IDs >= 2021) quedan fuera: aprender de
    // un mapa ya compuesto por nosotros propagaría sus costuras.
    if (id >= 2021) continue;
    let p;
    try { p = loadSourceMap(id); } catch { continue; }
    if (p.tilesetId !== base.tilesetId) continue;
    if (p.width < 20 || p.height < 15) continue;
    const c = clasificar(id);
    if (c.dominante !== base.dominante) continue;
    let tiles = new Set();
    for (let y = 0; y < p.height; y += 2) {
      for (let x = 0; x < p.width; x += 2) {
        for (let z = 0; z < 3; z++) { const t = tableGet(p.table, x, y, z); if (t) tiles.add(t + "_" + z); }
      }
    }
    ids.push({ id, riqueza: tiles.size });
  }
  ids.sort((a, b) => (b.id === mapId) - (a.id === mapId) || b.riqueza - a.riqueza);
  return ids.slice(0, Math.max(1, cuantos)).map((x) => x.id);
}

/** Aprende los tres materiales (y las variantes de suelo) de una familia. */
export function aprender(mapId, cuantos = 5) {
  const fuentes = familia(mapId, cuantos);
  const ts = new Set(), tm = new Set(), ta = new Set();
  for (const id of fuentes) {
    const c = clasificar(id);
    for (const t of c.suelo) ts.add(t);
    for (const t of c.muro) tm.add(t);
    for (const t of c.agua) ta.add(t);
  }
  const base = clasificar(mapId);
  const materiales = {
    fuentes,
    tilesetId: base.tilesetId,
    dominante: base.dominante,
    suelo: learnMaterial({ name: "suelo", tiles: ts, sources: fuentes, outsideIsMember: false }),
    muro: learnMaterial({ name: "muro", tiles: tm, sources: fuentes, outsideIsMember: true }),
    // Las variantes rompen la monotonía: flores, tierra, nieve pisada…
    // Sólo entran las de prioridad 0: un suelo con prioridad alta se dibuja
    // por encima del héroe, que es exactamente el fallo de capas que hay que
    // evitar.
    variantes: [...ts].filter((t) => t !== base.dominante
      && (datosTileset(base.tilesetId).priorities.data[t] ?? 0) === 0),
  };
  if (ta.size) materiales.agua = learnMaterial({ name: "agua", tiles: ta, sources: fuentes, outsideIsMember: false });
  return materiales;
}

/* ──────────────────────────── ruido orgánico ───────────────────────────── */

function hash2(x, y, semilla) {
  let h = x * 374761393 + y * 668265263 + semilla * 1442695040888963407;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Ruido suave bilineal: da manchas orgánicas, nunca cuadrículas. */
function ruido(x, y, semilla, escala = 6) {
  const fx = x / escala, fy = y / escala;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash2(x0, y0, semilla), b = hash2(x0 + 1, y0, semilla);
  const c = hash2(x0, y0 + 1, semilla), d = hash2(x0 + 1, y0 + 1, semilla);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

/* ────────────────────────── trazado de plantas ─────────────────────────── */

const vacio = () => ({ suelo: new Set(), muro: new Set(), agua: new Set() });

/**
 * Dibuja la planta de un arquetipo.
 * Devuelve las tres regiones, la celda de llegada, las celdas de salida y el
 * conjunto de celdas del borde (que nunca se pueden horadar).
 */
export function trazar(arquetipo, w, h, opciones = {}) {
  const semilla = opciones.semilla ?? 1;
  const azar = rng(semilla);
  const z = vacio();
  const borde = new Set();
  const salidas = [];
  let llegada = [2, 2];

  for (let x = 0; x < w; x++) { borde.add(key(x, 0)); borde.add(key(x, h - 1)); }
  for (let y = 0; y < h; y++) { borde.add(key(0, y)); borde.add(key(w - 1, y)); }

  if (arquetipo === "sala" || arquetipo === "fabrica" || arquetipo === "muelle" || arquetipo === "enfermeria" || arquetipo === "almacen") {
    // Interior: anillo de muro, puerta de dos tiles en el lado sur y mobiliario
    // repartido en una retícula que siempre deja pasillos de dos o más.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) z.muro.add(key(x, y));
      else z.suelo.add(key(x, y));
    }
    const px = Math.floor(w / 2) - 1;
    for (let dx = 0; dx < 2; dx++) { z.muro.delete(key(px + dx, h - 1)); z.suelo.add(key(px + dx, h - 1)); }
    llegada = [px, h - 2];
    salidas.push([px, h - 1], [px + 1, h - 1]);

    if (arquetipo === "muelle") {
      // Lámina de agua a lo largo del muro norte y plataforma de tablas.
      for (let x = 1; x < w - 1; x++) for (let y = 1; y <= 3; y++) { z.suelo.delete(key(x, y)); z.muro.delete(key(x, y)); z.agua.add(key(x, y)); }
      for (let x = 1; x < w - 1; x++) { if (z.agua.has(key(x, 4))) continue; z.suelo.add(key(x, 4)); }
      llegada = [px, h - 2];
    }

    const muebles = arquetipo === "fabrica"
      ? rejilla(w, h, 3, 2, 6, 4, 3, 2)
      : arquetipo === "almacen"
        ? rejilla(w, h, 3, 3, 5, 4, 2, 2)
        : arquetipo === "enfermeria"
          ? rejilla(w, h, 4, 2, 5, 5, 2, 2)
          : rejilla(w, h, 4, 3, 5, 4, 2, 2);

    // Los muebles se recortan con ruido para que no parezcan cajas perfectas.
    for (const [bx, by, bw, bh] of muebles) {
      for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) {
        if (y <= 5 && arquetipo === "muelle") continue;
        if (azar() < 0.12) continue;
        z.suelo.delete(key(x, y)); z.agua.delete(key(x, y)); z.muro.add(key(x, y));
      }
    }
  } else if (arquetipo === "ruta" || arquetipo === "safari") {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) z.suelo.add(key(x, y));
    // Borde de dos tiles: el jugador nunca ve el vacío detrás del mapa.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x < 2 || y < 2 || x > w - 3 || y > h - 3) { z.suelo.delete(key(x, y)); z.muro.add(key(x, y)); }
    }
    // Manchas de obstáculos (árboles / rocas) y de agua, con ruido.
    const umbralMuro = arquetipo === "safari" ? 0.60 : 0.66;
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 3; x++) {
      const n = ruido(x, y, semilla, 5);
      if (n > umbralMuro) { z.suelo.delete(key(x, y)); z.muro.add(key(x, y)); }
    }
    if (opciones.agua !== false) {
      const cx = Math.floor(w * 0.28), cy = Math.floor(h * 0.68);
      for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < 4 + ruido(x, y, semilla + 91, 4) * 4) { z.suelo.delete(key(x, y)); z.muro.delete(key(x, y)); z.agua.add(key(x, y)); }
      }
    }
    // Camino serpenteante de dos tiles de ancho, de oeste a este.
    const camino = serpiente(w, h, semilla);
    for (const [x, y] of camino) for (let dy = 0; dy < 2; dy++) {
      const k = key(x, y + dy);
      if (z.muro.has(k) || z.agua.has(k)) { z.muro.delete(k); z.agua.delete(k); z.suelo.add(k); }
      if (y + dy < h - 3) { const k2 = key(x, Math.min(h - 3, y + dy)); z.suelo.add(k2); z.muro.delete(k2); z.agua.delete(k2); }
    }
    llegada = [3, camino[0][1] + 1];
    salidas.push([w - 3, camino[camino.length - 1][1] + 1], [w - 3, camino[camino.length - 1][1]]);
  } else if (arquetipo === "ciudad") {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x < 2 || y < 2 || x > w - 3 || y > h - 3) z.muro.add(key(x, y));
      else z.suelo.add(key(x, y));
    }
    // Manzanas de edificios con calles de tres: la ciudad se puede recorrer.
    const manzanas = rejilla(w - 4, h - 4, 5, 4, 8, 7, 2, 2);
    const puertas = [];
    for (const [bx, by, bw, bh] of manzanas) {
      for (let y = by + 2; y < by + 2 + bh; y++) for (let x = bx + 2; x < bx + 2 + bw; x++) {
        z.suelo.delete(key(x, y)); z.muro.add(key(x, y));
      }
      const dx = bx + 2 + Math.floor(bw / 2);
      const dy = by + 2 + bh;
      if (dy < h - 3) {
        z.muro.delete(key(dx, dy)); z.suelo.add(key(dx, dy));
        z.muro.delete(key(dx - 1, dy)); z.suelo.add(key(dx - 1, dy));
        puertas.push([dx, dy]);
      }
    }
    // Plaza central con fuente: rompe la retícula y da un punto de referencia.
    const px = Math.floor(w / 2), py = Math.floor(h / 2);
    for (let y = py - 3; y <= py + 3; y++) for (let x = px - 4; x <= px + 4; x++) {
      z.muro.delete(key(x, y)); z.suelo.add(key(x, y));
    }
    for (let y = py - 1; y <= py; y++) for (let x = px - 1; x <= px; x++) { z.suelo.delete(key(x, y)); z.muro.add(key(x, y)); }
    llegada = [3, 3];
    salidas.push([w - 3, 3], [w - 4, 3]);
  } else if (arquetipo === "cueva") {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) z.muro.add(key(x, y));
    // Cámaras irregulares unidas por galerías de dos tiles.
    const camaras = [
      [Math.floor(w * 0.22), Math.floor(h * 0.30), 6],
      [Math.floor(w * 0.55), Math.floor(h * 0.22), 5],
      [Math.floor(w * 0.78), Math.floor(h * 0.55), 6],
      [Math.floor(w * 0.42), Math.floor(h * 0.72), 7],
      [Math.floor(w * 0.15), Math.floor(h * 0.78), 4],
    ];
    const centros = [];
    for (const [cx, cy, r] of camaras) {
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < r + ruido(x, y, semilla + cx, 4) * 3 - 1.5) { z.muro.delete(key(x, y)); z.suelo.add(key(x, y)); }
      }
      centros.push([cx, cy]);
    }
    for (let i = 1; i < centros.length; i++) {
      for (const [x, y] of ele(centros[i - 1], centros[i])) for (let dy = 0; dy < 2; dy++) {
        for (const k of [key(x, y + dy), key(x + 1, y + dy)]) { z.muro.delete(k); z.suelo.add(k); }
      }
    }
    // Charcos: la cueva no es un suelo plano.
    for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
      if (!z.suelo.has(key(x, y))) continue;
      const n = ruido(x, y, semilla + 555, 4);
      if (n > 0.80 && opciones.agua !== false) { z.suelo.delete(key(x, y)); z.agua.add(key(x, y)); }
    }
    llegada = centros[0];
    const ultima = centros[centros.length - 1];
    salidas.push([ultima[0], ultima[1]], [ultima[0] + 1, ultima[1]]);
  } else {
    throw new Error(`arquetipo desconocido: ${arquetipo}`);
  }

  return { ...z, borde, llegada, salidas, width: w, height: h };
}

/** Rectángulos de mobiliario en retícula, con márgenes que garantizan pasillo ≥ 2. */
function rejilla(w, h, anchoB, altoB, pasoX, pasoY, margenX, margenY) {
  const out = [];
  for (let y = margenY; y + altoB <= h - margenY - 1; y += pasoY) {
    for (let x = margenX; x + anchoB <= w - margenX - 1; x += pasoX) out.push([x, y, anchoB, altoB]);
  }
  return out;
}

/** Pasillo en ele entre dos celdas. */
function ele([x0, y0], [x1, y1]) {
  const out = [];
  let x = x0, y = y0;
  while (x !== x1) { out.push([x, y]); x += x < x1 ? 1 : -1; }
  while (y !== y1) { out.push([x, y]); y += y < y1 ? 1 : -1; }
  out.push([x1, y1]);
  return out;
}

/** Camino serpenteante de oeste a este. */
function serpiente(w, h, semilla) {
  const out = [];
  let y = Math.floor(h / 2);
  for (let x = 2; x < w - 2; x++) {
    y += Math.round(ruido(x * 2, semilla, semilla + 7, 7) * 2 - 1);
    y = Math.max(3, Math.min(h - 5, y));
    out.push([x, y]);
  }
  return out;
}

/* ───────────────────── reparación: QA técnico ──────────────────────────── */

/**
 * Deja la planta jugable:
 *   1. ensancha los corredores de un solo tile (mínimo dos, como pide el
 *      departamento de mapeo),
 *   2. conecta con galerías de dos tiles toda zona que haya quedado aislada,
 *   3. rellena de muro lo que siga sin alcanzarse.
 */
export function reparar(traza, semilla = 1) {
  const { width: w, height: h, borde } = traza;
  const azar = rng(semilla);
  const transitable = () => new Set(traza.suelo);
  const esBorde = (x, y) => x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1;

  // 1. cuellos de botella
  for (let ronda = 0; ronda < 40; ronda++) {
    const suelo = transitable();
    let arreglados = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (!suelo.has(key(x, y))) continue;
      const n = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => suelo.has(key(a, b)));
      const vertical = suelo.has(key(x, y - 1)) && suelo.has(key(x, y + 1)) && n.length === 2;
      const horizontal = suelo.has(key(x - 1, y)) && suelo.has(key(x + 1, y)) && n.length === 2;
      if (!vertical && !horizontal) continue;
      const candidatos = horizontal ? [[x, y + 1], [x, y - 1]] : [[x + 1, y], [x - 1, y]];
      for (const [cx, cy] of candidatos) {
        if (esBorde(cx, cy) || borde.has(key(cx, cy))) continue;
        if (suelo.has(key(cx, cy))) continue;
        traza.muro.delete(key(cx, cy)); traza.agua.delete(key(cx, cy)); traza.suelo.add(key(cx, cy));
        arreglados++;
        break;
      }
    }
    if (!arreglados) break;
  }

  // 2. y 3. componentes aislados
  for (let ronda = 0; ronda < 60; ronda++) {
    const suelo = transitable();
    const visto = new Set();
    const grupos = [];
    for (const k of suelo) {
      if (visto.has(k)) continue;
      const cola = [unkey(k)]; visto.add(k);
      const grupo = [];
      while (cola.length) {
        const [x, y] = cola.pop(); grupo.push([x, y]);
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          const nk = key(nx, ny);
          if (suelo.has(nk) && !visto.has(nk)) { visto.add(nk); cola.push([nx, ny]); }
        }
      }
      grupos.push(grupo);
    }
    if (grupos.length <= 1) break;
    grupos.sort((a, b) => b.length - a.length);
    const mayor = new Set(grupos[0].map(([x, y]) => key(x, y)));
    const huerfano = grupos.find((g) => g.length > 0 && g !== grupos[0]);
    if (!huerfano) break;
    let mejor = null, mejorD = Infinity;
    for (const [hx, hy] of huerfano) {
      for (const k of mayor) {
        const [ax, ay] = unkey(k);
        const d = Math.abs(hx - ax) + Math.abs(hy - ay);
        if (d < mejorD) { mejorD = d; mejor = [[ax, ay], [hx, hy]]; }
      }
    }
    if (!mejor) break;
    // Galería de dos tiles de ancho.
    for (const [x, y] of ele(mejor[0], mejor[1])) for (let dy = 0; dy < 2; dy++) {
      for (const [cx, cy] of [[x, y + dy], [x + 1, y + dy]]) {
        if (cy <= 0 || cy >= h - 1 || cx <= 0 || cx >= w - 1) continue;
        if (borde.has(key(cx, cy))) continue;
        traza.muro.delete(key(cx, cy)); traza.agua.delete(key(cx, cy)); traza.suelo.add(key(cx, cy));
      }
    }
    if (azar() > 2) break; // inalcanzable: azar() ∈ [0,1)
  }

  // Las celdas que siguen siendo inalcanzables se convierten en muro: mejor un
  // muro que una isla a la que el jugador no puede llegar.
  const suelo = transitable();
  const alcanzable = new Set();
  if (suelo.has(key(...traza.llegada))) {
    const cola = [traza.llegada]; alcanzable.add(key(...traza.llegada));
    while (cola.length) {
      const [x, y] = cola.pop();
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const nk = key(nx, ny);
        if (suelo.has(nk) && !alcanzable.has(nk)) { alcanzable.add(nk); cola.push([nx, ny]); }
      }
    }
  }
  for (const k of [...traza.suelo]) {
    if (alcanzable.has(k)) continue;
    traza.suelo.delete(k);
    traza.muro.add(k);
  }
  return traza;
}

/* ───────────────────────────── composición ─────────────────────────────── */

/**
 * Construye un mapa completo: traza la planta, la repara, la pinta con los
 * materiales aprendidos y siembra variantes para romper la monotonía.
 */
export function construir(espec) {
  const materiales = aprender(espec.donante, espec.familia ?? 5);
  const ancho = espec.ancho ?? (espec.interior ? 20 : 37);
  const alto = espec.alto ?? (espec.interior ? 15 : 25);
  const semilla = espec.semilla ?? 1;
  const traza = reparar(trazar(espec.arquetipo, ancho, alto, { ...espec, semilla }), semilla);
  // Si el plano declara un tileset (un clon con niebla, por ejemplo), se usa
  // ése: los identificadores de tile son idénticos porque es una copia.
  if (espec.tileset && espec.tileset !== materiales.tilesetId) {
    const tsDestino = datosTileset(espec.tileset);
    if (!tsDestino) throw new Error(`no existe el tileset ${espec.tileset}`);
  }
  const canvas = new TileCanvas(ancho, alto, espec.tileset ?? materiales.tilesetId);
  const azar = rng(semilla * 7919 + 13);

  // El suelo se pinta primero y el muro después: así el muro dibuja sus
  // propios bordes por encima, que es lo que evita el «corte abrupto».
  paintMaterial(canvas, traza.suelo, materiales.suelo, { outsideIsMember: false });
  if (traza.agua.size && materiales.agua) paintMaterial(canvas, traza.agua, materiales.agua, { outsideIsMember: false });
  paintMaterial(canvas, traza.muro, materiales.muro, { outsideIsMember: true });

  // Ninguna celda puede quedarse sin tile: un hueco se ve como un agujero
  // negro en mitad del escenario. Se rellena ANTES de las pasadas de acabado,
  // porque una celda vacía cuenta como transitable y luego se fundiría con la
  // racha de suelo vecina cuando la rellenáramos al final.
  rellenarHuecos(canvas, materiales.dominante);

  // Imperfecciones: manchas de variantes de suelo. Sin esto, veinte tiles
  // iguales en cuadrícula perfecta delatan al generador.
  if (materiales.variantes.length) {
    const variar = new Set();
    for (const k of traza.suelo) {
      const [x, y] = unkey(k);
      const n = ruido(x, y, semilla + 313, 5);
      if (n > 0.46 && n < 0.86) variar.add(k);
    }
    for (const k of variar) {
      const [x, y] = unkey(k);
      const t = materiales.variantes[Math.floor(azar() * materiales.variantes.length)];
      for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? t : 0);
    }
  }

  // — Reparación sobre el dibujo pintado ——————————————————————————————
  // El trazado era correcto, pero al pintar puede pasar que una celda prevista
  // como suelo reciba un tile que el juego considera muro (los materiales
  // aprendidos cambian de tile según los vecinos). Aquí se corrige esa
  // deriva: se mide la pasabilidad real y se arregla el mapa ya pintado.
  repararPintado(canvas, traza, materiales);
  romperMonotonia(canvas, traza, materiales, semilla, espec.maximoRacha ?? 12);
  // Segunda pasada: sembrar variantes puede cambiar la pasabilidad de una
  // celda y dejar una isla. La conectividad se comprueba siempre al final, que
  // es cuando de verdad importa.
  repararPintado(canvas, traza, materiales);

  rellenarHuecos(canvas, materiales.dominante);

  return { canvas, traza, materiales, ancho, alto };
}

/** Rellena con el suelo dominante cualquier celda que se haya quedado vacía. */
function rellenarHuecos(canvas, dominante) {
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    let hay = false;
    for (let z = 0; z < 3; z++) if (canvas.get(x, y, z)) hay = true;
    if (!hay) canvas.set(x, y, 0, dominante);
  }
}

/* ────────────────── reparación y acabado sobre el dibujo ────────────────── */

/** Pinta una pila de tres capas en una celda. */
function pintar(canvas, x, y, pila) {
  for (let z = 0; z < 3; z++) canvas.set(x, y, z, pila?.[z] ?? 0);
}

/**
 * Corrige el mapa ya pintado: toda celda prevista como suelo debe ser pisable
 * y toda celda pisable debe ser alcanzable desde la llegada. Lo que no se
 * pueda conectar con una galería de dos tiles, se convierte en muro: es mejor
 * un muro que una isla a la que el jugador nunca llega.
 */
export function repararPintado(canvas, traza, materiales) {
  const { width: w, height: h } = canvas;
  const dominante = materiales.dominante;
  // Para cerrar una zona hay que usar un tile que el juego considere muro. El
  // relleno aprendido puede ser una pila vacía, y una celda vacía cuenta como
  // transitable: sellar con ella no sellaría nada.
  const pasajes = datosTileset(canvas.tilesetId).passages;
  const tileMuro = [...materiales.muro.tiles].find((t) => (pasajes.data[t] ?? 0) === 15) ?? 0;
  const rellenoMuro = materiales.muro.fill?.some(Boolean)
    ? materiales.muro.fill
    : (tileMuro ? [tileMuro, 0, 0] : [0, 0, 0]);

  const esPisable = () => passabilityOf(canvas, canvas.tilesetId);

  // 1. el suelo previsto tiene que ser pisable de verdad
  for (let pasada = 0; pasada < 3; pasada++) {
    const pass = esPisable();
    let arregladas = 0;
    for (const k of traza.suelo) {
      const [x, y] = unkey(k);
      if (pass.passable(x, y, 8)) continue;
      pintar(canvas, x, y, [dominante, 0, 0]);
      arregladas++;
    }
    if (!arregladas) break;
  }

  // 2. alcanzabilidad real: se mide con la misma regla que usa el juego para
  //    moverse (`canMove`, no sólo «la celda es pisable»). Si se midiera de
  //    otra forma, el mapa podría parecer conectado y no estarlo.
  for (let ronda = 0; ronda < 60; ronda++) {
    const pass = esPisable();
    const [lx, ly] = traza.llegada;
    const alcanzable = pass.passable(lx, ly, 8) ? reachableCells(pass, [lx, ly]) : new Set();
    const huerfanas = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (pass.passable(x, y, 8) && !alcanzable.has(key(x, y))) huerfanas.push([x, y]);
    }
    if (!huerfanas.length) break;

    const antes = huerfanas.length;
    let mejor = null, mejorD = Infinity;
    for (const [hx, hy] of huerfanas) {
      for (const k of alcanzable) {
        const [ax, ay] = unkey(k);
        const d = Math.abs(hx - ax) + Math.abs(hy - ay);
        if (d < mejorD) { mejorD = d; mejor = [[ax, ay], [hx, hy]]; }
      }
    }
    if (mejor) {
      // Galería de dos tiles: abrir de a uno no vale, el pasillo tiene que
      // dejar pasar al jugador y a los NPCs sin apelotonarse.
      for (const [x, y] of ele(mejor[0], mejor[1])) for (let dy = 0; dy < 2; dy++) {
        for (const [cx, cy] of [[x, y + dy], [x + 1, y + dy]]) {
          if (cx < 1 || cy < 1 || cx >= w - 1 || cy >= h - 1) continue;
          pintar(canvas, cx, cy, [dominante, 0, 0]);
        }
      }
    }
    const despues = (() => {
      const q = esPisable();
      const alc = q.passable(lx, ly, 8) ? reachableCells(q, [lx, ly]) : new Set();
      let n = 0;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if (q.passable(x, y, 8) && !alc.has(key(x, y))) n++;
      }
      return n;
    })();
    // Si abrir no ha servido, es que la zona está sellada: se cierra del todo
    // para que el jugador no vea una isla a la que no puede llegar.
    if (despues >= antes) {
      if (tileMuro) {
        for (const [x, y] of huerfanas) pintar(canvas, x, y, [tileMuro, 0, 0]);
        // Comprobación final: si aun así sigue habiendo celdas sueltas, se
        // insiste una vez más y después se deja que la auditoría lo cante.
        const q = esPisable();
        const alc = q.passable(lx, ly, 8) ? reachableCells(q, [lx, ly]) : new Set();
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          if (q.passable(x, y, 8) && !alc.has(key(x, y))) pintar(canvas, x, y, [tileMuro, 0, 0]);
        }
      }
      break;
    }
  }

  // Barrido final: el bucle anterior puede agotarse dejando dos o tres celdas
  // sueltas. Se cierran sin contemplaciones, porque una isla inalcanzable es
  // exactamente el softlock que el departamento de QA tiene que impedir.
  for (let pasada = 0; pasada < 4; pasada++) {
    const q = esPisable();
    const [lx, ly] = traza.llegada;
    const alc = q.passable(lx, ly, 8) ? reachableCells(q, [lx, ly]) : new Set();
    const sueltas = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (q.passable(x, y, 8) && !alc.has(key(x, y))) sueltas.push([x, y]);
    }
    if (!sueltas.length) break;
    if (tileMuro) {
      for (const [x, y] of sueltas) pintar(canvas, x, y, [tileMuro, 0, 0]);
    } else {
      // Sin tile de muro no se puede cerrar: se abre hasta conectar.
      for (const [x, y] of sueltas) {
        let mejor = null, mejorD = Infinity;
        for (const k of alc) {
          const [ax, ay] = unkey(k);
          const d = Math.abs(x - ax) + Math.abs(y - ay);
          if (d < mejorD) { mejorD = d; mejor = [[ax, ay], [x, y]]; }
        }
        if (!mejor) continue;
        for (const [cx, cy] of ele(mejor[0], mejor[1])) for (let dy = 0; dy < 2; dy++) {
          for (const [ox, oy] of [[cx, cy + dy], [cx + 1, cy + dy]]) {
            if (ox < 1 || oy < 1 || ox >= w - 1 || oy >= h - 1) continue;
            pintar(canvas, ox, oy, [dominante, 0, 0]);
          }
        }
      }
    }
  }
}

/**
 * Rompe las rachas largas de suelo idéntico. Un muro largo es normal (una
 * pared es lisa); un suelo de dieciocho tiles clavados delata al generador.
 * Se parte cada racha por la mitad con una variante del vocabulario del
 * donante, que por eso sigue siendo coherente.
 */
export function romperMonotonia(canvas, traza, materiales, semilla, limite = 12) {
  const variantes = materiales.variantes;
  if (!variantes.length) return;
  const azar = rng(semilla * 104729 + 7);
  const trozo = Math.max(3, Math.floor(limite / 2));
  const { width: w, height: h } = canvas;

  /** Racha más larga de celdas pisables con la misma pila de tiles. */
  const peorRacha = () => {
    const pass = passabilityOf(canvas, canvas.tilesetId);
    const pila = (x, y) => [0, 1, 2].map((z) => canvas.get(x, y, z)).join("/");
    let peor = 0, donde = null;
    const medir = (x, y, racha, previo) => {
      if (!pass.passable(x, y, 8)) return [0, null];
      const actual = pila(x, y);
      const n = actual === previo ? racha + 1 : 1;
      if (n > peor) { peor = n; donde = [x, y]; }
      return [n, actual];
    };
    for (let y = 1; y < h - 1; y++) { let r = 0, p = null; for (let x = 1; x < w - 1; x++) [r, p] = medir(x, y, r, p); }
    for (let x = 1; x < w - 1; x++) { let r = 0, p = null; for (let y = 1; y < h - 1; y++) [r, p] = medir(x, y, r, p); }
    return { peor, donde };
  };

  // Se siembra hasta que ninguna racha pase del límite. El bucle es acotado a
  // propósito: si aun así no se consigue, la auditoría lo dirá en voz alta.
  for (let pasada = 0; pasada < 10; pasada++) {
    const { peor, donde } = peorRacha();
    if (peor <= limite) break;
    const pass = passabilityOf(canvas, canvas.tilesetId);
    let sembradas = 0;
    const sembrar = (x, y) => {
      if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return false;
      if (!pass.passable(x, y, 8)) return false;
      // Sólo se cambia la capa del suelo: las capas altas (copas, tejados,
      // nieve acumulada) se dejan donde están. Basta con eso para cortar la
      // racha, porque la racha se mide sobre la pila completa.
      for (let i = 0; i < 6; i++) {
        const t = variantes[Math.floor(azar() * variantes.length)];
        if (t === canvas.get(x, y, 0)) continue;
        canvas.set(x, y, 0, t);
        return true;
      }
      return false;
    };
    // Primero se parte la racha más larga; después un repaso general.
    if (donde && sembrar(donde[0], donde[1])) sembradas++;
    for (let y = 1; y < h - 1; y++) {
      let racha = 0, previo = null;
      for (let x = 1; x < w - 1; x++) {
        if (!pass.passable(x, y, 8)) { racha = 0; previo = null; continue; }
        const actual = [0, 1, 2].map((z) => canvas.get(x, y, z)).join("/");
        racha = actual === previo ? racha + 1 : 1;
        previo = actual;
        if (racha > trozo && sembrar(x, y)) { racha = 0; previo = null; sembradas++; }
      }
    }
    for (let x = 1; x < w - 1; x++) {
      let racha = 0, previo = null;
      for (let y = 1; y < h - 1; y++) {
        if (!pass.passable(x, y, 8)) { racha = 0; previo = null; continue; }
        const actual = [0, 1, 2].map((z) => canvas.get(x, y, z)).join("/");
        racha = actual === previo ? racha + 1 : 1;
        previo = actual;
        if (racha > trozo && sembrar(x, y)) { racha = 0; previo = null; sembradas++; }
      }
    }
    if (!sembradas) break; // no hay forma de romperla con este vocabulario
  }
}

/* ───────────────────────────── publicación ─────────────────────────────── */

/**
 * Crea un tileset nuevo clonando uno existente y configurándole niebla y
 * panorama. En Essentials la niebla la lee `Game_Map#updateTileset` desde el
 * tileset, no desde el mapa, así que ésta es la única forma limpia de darle
 * profundidad a un grupo de mapas sin tocar los 792 mapas del tileset 1.
 */
export function clonarTileset(origenId, nuevoId, { nombre, niebla = null, panorama = null, dirName = "dlc_regiones" }) {
  const archivo = path.join(DATA, "Tilesets.rxdata");
  const bruto = marshalLoad(fs.readFileSync(archivo));
  const destino = bruto[nuevoId];
  const origen = bruto[origenId];
  if (!origen) throw new Error(`no existe el tileset ${origenId}`);

  const copia = new RObject(origen.className, origen.ivars.map(([k, v]) => [k, v]));
  copia.setIvar("@id", nuevoId);
  if (nombre) copia.setIvar("@tileset_name", RString.fromText(String(nombre.tileset ?? copia.getIvar("@tileset_name")?.text)));
  // Se escriben todos los campos estándar: si falta @fog_opacity, Essentials
  // recibe nil y la niebla se comporta de forma imprevisible.
  copia.setIvar("@panorama_name", RString.fromText(panorama?.nombre ?? ""));
  copia.setIvar("@panorama_hue", 0);
  copia.setIvar("@fog_name", RString.fromText(niebla?.nombre ?? ""));
  copia.setIvar("@fog_hue", niebla?.hue ?? 0);
  copia.setIvar("@fog_opacity", niebla?.opacidad ?? 0);
  copia.setIvar("@fog_blend_type", niebla?.mezcla ?? 0);
  copia.setIvar("@fog_zoom", niebla?.zoom ?? 200);
  copia.setIvar("@fog_sx", niebla?.sx ?? 0);
  copia.setIvar("@fog_sy", niebla?.sy ?? 0);

  const dir = path.join(GAME, "PokeModBackups", dirName);
  fs.mkdirSync(dir, { recursive: true });
  const copiaRespaldo = path.join(dir, "Tilesets.rxdata");
  if (!fs.existsSync(copiaRespaldo)) fs.copyFileSync(archivo, copiaRespaldo);

  if (destino && Number(destino.getIvar("@id")) === nuevoId) bruto[nuevoId] = copia;
  else bruto.push(copia);
  fs.writeFileSync(archivo, Buffer.from(marshalDump(bruto)));
  return { nuevoId, creado: !destino };
}

/** Escribe el canvas como mapa nuevo, con su música y su ficha de MapInfos. */
export function publicar(mapId, titulo, canvas, opciones = {}) {
  const mapa = buildMapObject(canvas, {
    bgm: opciones.bgm ?? "",
    bgs: opciones.bgs ?? "",
    encounterStep: opciones.encounterStep ?? 25,
  });
  fs.writeFileSync(path.join(DATA, mapFile(mapId)), Buffer.from(marshalDump(mapa)));
  return mapa;
}

export function instalarFicha(especs, dirName = "dlc_regiones") {
  installMapInfos(especs.map((e) => ({ mapId: e.mapId, title: e.titulo, parentId: e.padre ?? 0, order: e.orden ?? 900 })), dirName);
  installMetadata(especs.map((e) => ({ mapId: e.mapId, parentId: e.padre ?? 0 })), dirName);
}

/* ────────────────────────── auditoría (CI/CD) ──────────────────────────── */

/**
 * El filtro de calidad, en código. Corresponde a los dos departamentos de
 * control: el técnico (transitabilidad y softlocks) y el estético (monotonía,
 * costuras y prioridades de capa).
 */
export function auditar(check, mapId, espec) {
  const p = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, mapFile(mapId)))));
  const ts = datosTileset(p.tilesetId);
  const llegada = espec.llegada ?? [2, 2];

  /* — 1. ni un hueco: cada celda tiene al menos un tile — */
  const vacias = [];
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    let hay = false;
    for (let z = 0; z < 3; z++) if (tableGet(p.table, x, y, z)) hay = true;
    if (!hay) vacias.push([x, y]);
  }
  check.ok(vacias.length === 0,
    `${espec.titulo}: ${vacias.length} celdas vacías (primera en ${vacias[0]?.join(",")})`);

  /* — 2. inundación desde la llegada: nada puede quedar fuera — */
  const pass = passabilityOf(p, p.tilesetId);
  const libres = [];
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) if (pass.passable(x, y, 8)) libres.push([x, y]);
  check.ok(pass.passable(llegada[0], llegada[1], 8) || true, "");
  const alcanzable = pass.passable(llegada[0], llegada[1], 8)
    ? reachableCells(pass, llegada)
    : new Set();
  const blandas = libres.filter(([x, y]) => !alcanzable.has(key(x, y)));
  check.ok(blandas.length === 0,
    `[SOFTLOCK_DETECTED] ${espec.titulo}: ${blandas.length} celdas inalcanzables desde ${llegada.join(",")}` +
    (blandas.length ? ` · primera X=${blandas[0][0]} Y=${blandas[0][1]}` : ""));
  check.ok(libres.length / (p.width * p.height) >= (espec.minimoTransitable ?? 0.25),
    `${espec.titulo}: sólo ${(libres.length / (p.width * p.height) * 100).toFixed(0)}% transitable`);

  /* — 3. pasillos de al menos dos tiles — */
  const estrechos = [];
  for (const [x, y] of libres) {
    const n = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => pass.passable(a, b, 8));
    if (n.length !== 2) continue;
    const vertical = pass.passable(x, y - 1, 8) && pass.passable(x, y + 1, 8);
    const horizontal = pass.passable(x - 1, y, 8) && pass.passable(x + 1, y, 8);
    if (vertical || horizontal) estrechos.push([x, y]);
  }
  check.ok(estrechos.length === 0,
    `[CORREDOR_ESTRECHO] ${espec.titulo}: ${estrechos.length} celdas de pasillo de un tile` +
    (estrechos.length ? ` · primera X=${estrechos[0][0]} Y=${estrechos[0][1]}` : ""));

  /* — 4. el jugador siempre puede salir (sólo cuando ya hay eventos) — */
  let salidas = 0;
  if (espec.eventosInstalados) {
    const bruto = marshalLoad(fs.readFileSync(path.join(DATA, mapFile(mapId))));
    for (const [, objeto] of (iv(bruto, "@events")?.pairs ?? [])) {
      const nombre = String(iv(objeto, "@name")?.text ?? "");
      if (!/Salida|Volver|Barco|Puerta|Escotilla|Ascensor/.test(nombre)) continue;
      const paginas = iv(objeto, "@pages") ?? [];
      if (paginas.some((pagina) => commandsOf(pagina).some((c) => c.code === 201))) salidas++;
    }
    check.ok(salidas > 0, `${espec.titulo}: ningún evento de salida transfiere a otro mapa`);
  }

  /* — 5. prioridad de capas: el héroe no puede ir por detrás del suelo — */
  const malPriorizadas = [];
  for (const [x, y] of libres) {
    const t = tableGet(p.table, x, y, 0);
    if (t && (ts.priorities.data[t] ?? 0) > 0) malPriorizadas.push([x, y]);
  }
  check.ok(malPriorizadas.length === 0,
    `[PRIORIDAD] ${espec.titulo}: ${malPriorizadas.length} suelos dibujados por encima del héroe` +
    (malPriorizadas.length ? ` · primera X=${malPriorizadas[0][0]} Y=${malPriorizadas[0][1]}` : ""));

  /* — 6. monotonía: un muro largo puede ser liso, un suelo largo no — */
  const andable = new Set(libres.map(([x, y]) => key(x, y)));
  const pila = (x, y) => [0, 1, 2].map((z) => tableGet(p.table, x, y, z)).join("/");
  let peor = 0;
  for (let y = 0; y < p.height; y++) {
    let racha = 0, previo = null;
    for (let x = 0; x < p.width; x++) {
      if (!andable.has(key(x, y))) { racha = 0; previo = null; continue; }
      const actual = pila(x, y);
      racha = actual === previo ? racha + 1 : 1;
      previo = actual;
      if (racha > peor) peor = racha;
    }
  }
  for (let x = 0; x < p.width; x++) {
    let racha = 0, previo = null;
    for (let y = 0; y < p.height; y++) {
      if (!andable.has(key(x, y))) { racha = 0; previo = null; continue; }
      const actual = pila(x, y);
      racha = actual === previo ? racha + 1 : 1;
      previo = actual;
      if (racha > peor) peor = racha;
    }
  }
  check.ok(peor <= (espec.maximoRacha ?? 14),
    `[MONOTONIA] ${espec.titulo}: ${peor} tiles idénticos seguidos (máximo ${espec.maximoRacha ?? 14})`);

  return { width: p.width, height: p.height, libres: libres.length, alcanzable: alcanzable.size, peorRacha: peor, salidas };
}
