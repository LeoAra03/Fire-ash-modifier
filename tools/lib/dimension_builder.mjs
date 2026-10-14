/**
 * Compositor de mapas de dimensión.
 *
 * Construye un mapa nuevo a partir de ventanas reales de mapas ya existentes
 * en el juego: cada distrito es un trozo auténtico de un escenario, elegido
 * automáticamente por vocabulario de tiles y por proporción de suelo. Después
 * se rodea de suelo, se unen los distritos con avenidas y se abren los pasillos
 * que hagan falta hasta que **ninguna celda caminable quede incomunicada**.
 *
 * Nunca se edita un mapa existente: el resultado se escribe en un ID nuevo.
 */
import fs from "node:fs";
import {
  DATA, ROOT, iv, marshalLoad, marshalDump, mapFile, readData, writeData,
  switchOn, texts, transfer, endEvent, page, event, graphic, condition, makeChecker,
} from "./dlc_helpers.mjs";
import {
  TileCanvas, stamp, buildMapObject, loadSourceMap, passabilityOf, reachableCells, tilesets,
} from "./map_painter.mjs";
import { parseMap, tableGet } from "../../web/js/rmxp.js";

export { TileCanvas, stamp, buildMapObject, passabilityOf, reachableCells };

/** Tabla de tilesets para consultar pasabilidad. */
export const tses = () => tilesets();

/**
 * Suelo transitable más frecuente de una zona. Ojo: hay que descartar los
 * tiles con pasabilidad 0, si no se acaba pavimentando con muros.
 */
export function sueloDe(canvas, x0 = 0, y0 = 0, w = canvas.width, h = canvas.height) {
  const pases = tses().get(canvas.tilesetId)?.passages;
  const cuenta = new Map();
  const cuentaTodo = new Map();
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const t = canvas.get(x, y, 0);
      if (!t) continue;
      cuentaTodo.set(t, (cuentaTodo.get(t) ?? 0) + 1);
      if (pases && (pases.data[t] ?? 0) !== 0) continue;
      cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
    }
  }
  const fuente = cuenta.size ? cuenta : cuentaTodo;
  let mejor = 0, mejorN = -1;
  for (const [t, n] of fuente) if (n > mejorN) { mejorN = n; mejor = t; }
  return mejor || 0;
}

/** Celdas caminables de un canvas. */
export function regiones(canvas) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const libres = [];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) if (pass.passable(x, y, 8)) libres.push([x, y]);
  }
  return { pass, libres };
}

/** Abre un pasillo en ele entre dos celdas usando el suelo del propio mapa. */
export function abrirPasillo(canvas, desde, hasta, suelo) {
  if (!suelo) return;
  let [x, y] = desde;
  const [tx, ty] = hasta;
  while (x !== tx) { for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0); x += x < tx ? 1 : -1; }
  while (y !== ty) { for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0); y += y < ty ? 1 : -1; }
  for (let z = 0; z < 3; z++) canvas.set(tx, ty, z, z === 0 ? suelo : 0);
}

/** Une todas las zonas caminables: cero celdas huérfanas. */
export function conectarTodo(canvas, arranques, maxPasillos = 600) {
  let abiertos = 0;
  for (let ronda = 0; ronda < maxPasillos; ronda++) {
    const { pass, libres } = regiones(canvas);
    const alcanzable = new Set();
    for (const [x, y] of arranques) if (pass.passable(x, y, 8)) for (const c of reachableCells(pass, [x, y])) alcanzable.add(c);
    if (!alcanzable.size && libres.length) for (const c of reachableCells(pass, libres[0])) alcanzable.add(c);
    const huerfanas = libres.filter(([x, y]) => !alcanzable.has(`${x},${y}`));
    if (!huerfanas.length) break;
    const suelo = sueloDe(canvas, 0, 0, canvas.width, canvas.height);
    if (!suelo) break;
    let mejor = null, mejorD = Infinity;
    for (const [hx, hy] of huerfanas) {
      for (const otra of alcanzable) {
        const [ax, ay] = otra.split(",").map(Number);
        const d = Math.abs(hx - ax) + Math.abs(hy - ay);
        if (d < mejorD) { mejorD = d; mejor = [[ax, ay], [hx, hy]]; }
      }
      if (mejorD <= 1) break;
    }
    if (!mejor) break;
    abrirPasillo(canvas, mejor[0], mejor[1], suelo);
    abiertos += 1;
  }
  return abiertos;
}

/**
 * Elige la mejor ventana cuadrada de un mapa donante: la que tiene más tiles
 * distintos y una proporción de suelo razonable.
 */
export function mejorVentana(sourceId, lado, altoVentana = null) {
  const altoWin = altoVentana ?? lado;
  const p = loadSourceMap(sourceId);
  const pass = passabilityOf(p, p.tilesetId);
  let mejor = null, mejorPunto = -1;
  for (let oy = 0; oy + altoWin <= p.height; oy += 2) {
    for (let ox = 0; ox + lado <= p.width; ox += 2) {
      let libres = 0;
      const tiles = new Set();
      for (let y = oy; y < oy + altoWin; y++) {
        for (let x = ox; x < ox + lado; x++) {
          if (pass.passable(x, y, 8)) libres += 1;
          for (let z = 0; z < p.table.z; z++) {
            const t = tableGet(p.table, x, y, z);
            if (t) tiles.add(t);
          }
        }
      }
      const ratio = libres / (lado * altoWin);
      if (ratio < 0.16 || ratio > 0.82) continue;
      const punto = tiles.size + ratio * 120;
      if (punto > mejorPunto) { mejorPunto = punto; mejor = { ox, oy, ratio, tiles: tiles.size }; }
    }
  }
  if (!mejor) {
    let tilesMax = 0;
    for (let oy = 0; oy + altoWin <= p.height; oy += 4) {
      for (let ox = 0; ox + lado <= p.width; ox += 4) {
        const tiles = new Set();
        for (let y = oy; y < oy + altoWin; y++) for (let x = ox; x < ox + lado; x++) for (let z = 0; z < p.table.z; z++) {
          const t = tableGet(p.table, x, y, z);
          if (t) tiles.add(t);
        }
        if (tiles.size > tilesMax) { tilesMax = tiles.size; mejor = { ox, oy, ratio: 0, tiles: tiles.size }; }
      }
    }
  }
  return mejor ?? { ox: 0, oy: 0, ratio: 0, tiles: 0 };
}

/**
 * Compone un mapa nuevo con `distritos` colocados en retícula serpentina.
 *
 * @returns {{
 *   canvas: TileCanvas, celdas: Array<[number,number]>, suelo: number,
 *   pasillos: number, ventanas: Array<object>
 * }}
 */
export function componer({ tilesetId, distritos, lado = 30, columnas = 3, margen = 4 }) {
  const columnasReales = Math.min(columnas, distritos.length);
  const filas = Math.ceil(distritos.length / columnasReales);
  const ancho = margen + columnasReales * (lado + margen);
  const alto = margen + filas * (lado + margen);
  const canvas = new TileCanvas(ancho, alto, tilesetId);

  // Suelo base: el tile de exterior más común entre todos los donantes, para
  // que los huecos entre distritos sean campo y no un agujero negro.
  const cuentaBase = new Map();
  for (const distrito of distritos) {
    const p = loadSourceMap(distrito.sourceId);
    const pases = tses().get(p.tilesetId)?.passages;
    for (let y = 0; y < p.height; y += 2) {
      for (let x = 0; x < p.width; x += 2) {
        const t = tableGet(p.table, x, y, 0);
        if (!t) continue;
        if (pases && (pases.data[t] ?? 0) !== 0) continue;
        cuentaBase.set(t, (cuentaBase.get(t) ?? 0) + 1);
      }
    }
  }
  const sueloBase = [...cuentaBase.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  canvas.fillAll(0, sueloBase);

  const ventanas = [];
  const centros = [];

  distritos.forEach((distrito, index) => {
    const fila = Math.floor(index / columnasReales);
    let columna = index % columnasReales;
    // Serpentina: en las filas impares se recorre al revés, de modo que la
    // salida de un distrito cae junto a la entrada del siguiente.
    if (fila % 2 === 1) columna = columnasReales - 1 - columna;
    const dx = margen + columna * (lado + margen);
    const dy = margen + fila * (lado + margen);
    const ventana = mejorVentana(distrito.sourceId, lado);
    stamp(canvas, distrito.sourceId, ventana.ox, ventana.oy, lado, lado, dx, dy, { skipZero: false });
    ventanas.push({ ...distrito, ...ventana, dx, dy });
    centros.push([dx + Math.floor(lado / 2), dy + Math.floor(lado / 2)]);
  });

  const suelo = sueloDe(canvas, 0, 0, ancho, alto) || sueloBase;

  // Anillo de suelo alrededor de cada distrito y avenidas en serpentina.
  for (const v of ventanas) {
    for (let x = v.dx - 1; x <= v.dx + lado; x++) {
      for (let y = v.dy - 1; y <= v.dy + lado; y++) {
        if (x < 0 || y < 0 || x >= ancho || y >= alto) continue;
        const dentro = x > v.dx - 1 && x < v.dx + lado && y > v.dy - 1 && y < v.dy + lado;
        if (dentro) continue;
        for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0);
      }
    }
  }
  for (let i = 1; i < centros.length; i++) abrirPasillo(canvas, centros[i - 1], centros[i], suelo);

  const pasillos = conectarTodo(canvas, centros);
  return { canvas, centros, suelo, pasillos, ventanas, ancho, alto };
}

/** Escribe un canvas como mapa nuevo, con MapInfos y metadatos. */
export function publicar(mapId, titulo, canvas, { parentId = 0, bgm = "", bgs = "", encounterStep = 25 } = {}) {
  const map = buildMapObject(canvas, { bgm, bgs, encounterStep });
  fs.writeFileSync(`${DATA}/${mapFile(mapId)}`, Buffer.from(marshalDump(map)));
  return map;
}

/** Estadísticas verificables de un mapa ya escrito. */
export function statsDe(mapId) {
  const p = parseMap(marshalLoad(fs.readFileSync(`${DATA}/${mapFile(mapId)}`)));
  const pass = passabilityOf(p, p.tilesetId);
  const libres = [];
  const vacias = [];
  const tiles = new Set();
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      let hayTile = false;
      for (let z = 0; z < p.table.z; z++) {
        const t = tableGet(p.table, x, y, z);
        if (t) { tiles.add(t); hayTile = true; }
      }
      if (!hayTile) vacias.push([x, y]);
      if (pass.passable(x, y, 8)) libres.push([x, y]);
    }
  }
  return { width: p.width, height: p.height, tilesetId: p.tilesetId, libres, vacias, tiles: tiles.size, pass, parsed: p };
}

/** Celdas libres (caminables y sin evento) del componente mayor de un mapa. */
export function celdasLibres(mapId, reservadas = new Set()) {
  const { width, height, pass, parsed } = statsDe(mapId);
  const ocupadas = new Set();
  const raw = marshalLoad(fs.readFileSync(`${DATA}/${mapFile(mapId)}`));
  for (const [, object] of (iv(raw, "@events")?.pairs ?? [])) {
    ocupadas.add(`${iv(object, "@x")},${iv(object, "@y")}`);
  }
  const key = (x, y) => `${x},${y}`;
  const abiertas = new Set();
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!pass.passable(x, y, 8)) continue;
      if (ocupadas.has(key(x, y)) || reservadas.has(key(x, y))) continue;
      abiertas.add(key(x, y));
    }
  }
  const visto = new Set();
  let mejor = [];
  for (const celda of abiertas) {
    if (visto.has(celda)) continue;
    const [sx, sy] = celda.split(",").map(Number);
    const componente = [];
    const cola = [[sx, sy]];
    visto.add(celda);
    while (cola.length) {
      const [x, y] = cola.pop();
      componente.push([x, y]);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const next = key(nx, ny);
        if (abiertas.has(next) && !visto.has(next)) { visto.add(next); cola.push([nx, ny]); }
      }
    }
    if (componente.length > mejor.length) mejor = componente;
  }
  return mejor.map(([x, y]) => [x, y]);
}

/** Comprueba que un mapa es jugable: sin celdas vacías y sin zonas aisladas. */
export function verificarMapa(check, mapId, titulo, arranques, minimoLibres = 0.3) {
  const stats = statsDe(mapId);
  check.ok(stats.vacias.length === 0, `${titulo}: ${stats.vacias.length} celdas vacías`);
  const ratio = stats.libres.length / (stats.width * stats.height);
  check.ok(ratio >= minimoLibres, `${titulo}: sólo ${(ratio * 100).toFixed(1)}% es transitable`);
  const alcanzable = new Set();
  for (const [x, y] of arranques) {
    if (stats.pass.passable(x, y, 8)) for (const c of reachableCells(stats.pass, [x, y])) alcanzable.add(c);
  }
  const huerfanas = stats.libres.filter(([x, y]) => !alcanzable.has(`${x},${y}`));
  check.ok(huerfanas.length === 0, `${titulo}: ${huerfanas.length} celdas inalcanzables`);
  return stats;
}

/**
 * Construye un gimnasio: una copia centrada y única de un gimnasio real
 * dentro de una sala con pasillos perimetrales y una cruz central.
 */
export function componerGimnasio({ ancho = 46, alto = 42, donante, tilesetId = 14, suplentes = [416, 136, 85, 86, 95] }) {
  const canvas = new TileCanvas(ancho, alto, tilesetId);
  const pases = tses().get(tilesetId)?.passages;
  const esAndable = (t) => t && pases && (pases.data[t] ?? 0) === 0;

  /** Tile de suelo más frecuente de la capa 0 de un mapa. */
  const sueloDe = (origen) => {
    const cuenta = new Map();
    for (let y = 0; y < origen.height; y++) {
      for (let x = 0; x < origen.width; x++) {
        const t = tableGet(origen.table, x, y, 0);
        if (!t || !esAndable(t)) continue;
        cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
      }
    }
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  };

  // El donante manda; si su interior es todo muro, se busca suelo en otros
  // gimnasios del mismo tileset. Sin este relevo, las "calles" del gimnasio se
  // pintarían con pared y la sala quedaría sellada.
  const p = loadSourceMap(donante);
  let suelo = sueloDe(p);
  for (const suplente of suplentes) {
    if (suelo) break;
    try { suelo = sueloDe(loadSourceMap(suplente)); } catch { /* mapa ausente */ }
  }
  if (!suelo) throw new Error(`no hay suelo transitable en el tileset ${tilesetId}`);
  canvas.fillAll(0, suelo);

  // El gimnasio real se coloca una sola vez, centrado: un pabellón dentro de
  // una sala, no un laberinto repetido hasta los bordes.
  const anchoCopia = Math.min(p.width, ancho - 10);
  const altoCopia = Math.min(p.height, alto - 10);
  const ox = Math.floor((ancho - anchoCopia) / 2);
  const oy = Math.floor((alto - altoCopia) / 2);
  // La mejor ventana del donante, no siempre su esquina: así el pabellón
  // conserva el vocabulario de tiles que hace reconocible a cada gimnasio.
  const ventana = mejorVentana(donante, anchoCopia, altoCopia);
  for (let y = 0; y < altoCopia; y++) {
    for (let x = 0; x < anchoCopia; x++) {
      for (let z = 0; z < 3; z++) {
        canvas.set(ox + x, oy + y, z, tableGet(p.table, ventana.ox + x, ventana.oy + y, z));
      }
    }
  }

  // Pasillos perimetrales, cruz central y los dos flancos del pabellón: el
  // gimnasio se puede rodear y atravesar, como uno de verdad.
  const pintar = (x, y) => { for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0); };
  for (let x = 1; x < ancho - 1; x++) { pintar(x, 1); pintar(x, alto - 2); }
  for (let y = 1; y < alto - 1; y++) { pintar(1, y); pintar(ancho - 2, y); }
  const cy = Math.floor(alto / 2);
  const cx = Math.floor(ancho / 2);
  for (let x = 1; x < ancho - 1; x++) pintar(x, cy);
  for (let y = 1; y < alto - 1; y++) { pintar(cx, y); pintar(cx - 1, y); }
  for (let y = oy; y < oy + altoCopia; y++) { pintar(ox - 1, y); pintar(ox + anchoCopia, y); }

  // Zona segura de llegada: (2,2) queda siempre fuera de la copia del donante
  // (el margen mínimo es 5), así que es suelo sí o sí. Se agranda a 3×3 para
  // que el jugador nunca aparezca encajonado.
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) pintar(x, y);

  // Ningún rincón del gimnasio puede quedarse incomunicado.
  const abiertos = conectarTodo(canvas, [[2, 2], [cx, cy], [ancho - 3, alto - 3]], 600);
  return { canvas, suelo, pasillos: abiertos };
}
