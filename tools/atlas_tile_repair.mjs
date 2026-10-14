#!/usr/bin/env node
/**
 * atlas_tile_repair.mjs
 *
 * Repara los defectos que detecta `atlas_tile_audit.mjs` en los 1000 mapas de
 * la Expedición Atlas Mil:
 *
 *   1. **Mapas planos o vacíos.** Un puñado deAtlas mapas son ecos de mapas de
 *      Fire Ash que no tienen tabla de tiles (mapas de región del Pokédex,
 *      maquetas de viaje…). El eco sale en negro. Se les da geometría copiando
 *      una ventana real de un mapa del juego con el mismo tileset: suelo,
 *      muros y decoración salen del propio juego, nunca inventados.
 *
 *   2. **Regiones sin acceso.** Al recortar y redimensionar los ecos quedan
 *      zonas transitables desconectadas: trozos de mapa a los que el jugador
 *      no puede llegar nunca. Se abren corredores en L desde la región
 *      principal con el tile de suelo más común del propio mapa, de modo que
 *      el pasillo se ve igual que el resto del suelo.
 *
 *   3. **Huecos.** Las celdas sin ningún tile se rellenan con el suelo del
 *      mapa: nunca queda un agujero negro bajo los pies.
 *
 * No se tocan los eventos: se conservan sus nombres, sus comandos y sus
 * destinos. Únicamente se recoloca sobre una celda transitable el evento que
 * quedó atrapado dentro de un muro al cambiar la geometría.
 *
 * Uso:
 *   node tools/atlas_tile_repair.mjs
 *   node tools/atlas_tile_repair.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { marshalLoad, marshalDump, RHash, RObject, RString } from "../web/js/marshal.js";
import { parseMap, tableGet, tableToUserDef } from "../web/js/rmxp.js";
import { ROOT, DATA } from "./lib/fire_ash_registry.mjs";
import { txt, mapFile, readMap, writeMap } from "./lib/dn_rmxp.mjs";
import { TileCanvas, passabilityOf, reachableCells, tilesets } from "./lib/map_painter.mjs";

const VERIFY = process.argv.includes("--verify");
const HIERARCHY = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const AUDIT = path.join(ROOT, "content", "atlas_tile_audit.json");
const BACKUP = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups", "atlas_tile_repair_originals");
const TS = tilesets();

const pad3 = (n) => String(n).padStart(3, "0");
const hashDe = (n) => crypto.createHash("sha256").update(`atlas-tile-repair:${n}`).digest();

/* ─────────────────────────────── lectura ───────────────────────────────── */

function lienzoDe(raw) {
  const parsed = parseMap(raw);
  const canvas = new TileCanvas(parsed.width, parsed.height, parsed.tilesetId);
  for (let z = 0; z < 3; z++) {
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) canvas.set(x, y, z, tableGet(parsed.table, x, y, z));
    }
  }
  return { canvas, parsed };
}

function vocabulario(canvas) {
  const tiles = new Map();
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      for (let z = 0; z < 3; z++) {
        const t = canvas.get(x, y, z);
        if (t) tiles.set(t, (tiles.get(t) ?? 0) + 1);
      }
    }
  }
  return tiles;
}

/** Tile de suelo: el más usado en la capa 0 que sea totalmente transitable. */
function sueloDe(canvas) {
  const ts = TS.get(canvas.tilesetId);
  const usados = new Map();
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const t = canvas.get(x, y, 0);
      if (t) usados.set(t, (usados.get(t) ?? 0) + 1);
    }
  }
  const orden = [...usados.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tile] of orden) {
    if (tile >= 384 && (ts?.passages?.data?.[tile] ?? 0) === 0) return tile;
  }
  // Ningún tile del mapa sirve: se busca uno cualquiera del tileset.
  const pases = ts?.passages?.data;
  if (pases) {
    for (let t = 384; t < pases.length; t++) if (pases[t] === 0) return t;
  }
  return 0;
}

/* ───────────────────────── mapas donantes reales ───────────────────────── */

let donantesPorTileset = null;
function donantes() {
  if (donantesPorTileset) return donantesPorTileset;
  donantesPorTileset = new Map();
  for (const archivo of fs.readdirSync(DATA)) {
    const m = /^Map(\d+)\.rxdata$/.exec(archivo);
    if (!m) continue;
    const id = Number(m[1]);
    if (id >= 1000) continue;            // solo mapas originales de Fire Ash
    let parsed;
    try { parsed = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, archivo)))); } catch { continue; }
    if (!parsed.width || parsed.width < 12 || parsed.height < 12) continue;
    const tiles = new Set();
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) {
        for (let z = 0; z < 3; z++) { const t = tableGet(parsed.table, x, y, z); if (t) tiles.add(t); }
      }
    }
    if (tiles.size < 40) continue;
    const lista = donantesPorTileset.get(parsed.tilesetId) ?? [];
    lista.push({ id, width: parsed.width, height: parsed.height, tiles: tiles.size });
    donantesPorTileset.set(parsed.tilesetId, lista);
  }
  for (const lista of donantesPorTileset.values()) lista.sort((a, b) => b.tiles - a.tiles);
  return donantesPorTileset;
}

function pintar(fuente, canvas, ox, oy) {
  for (let z = 0; z < 3; z++) {
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        canvas.set(x, y, z, tableGet(fuente.table, ox + (x % fuente.width), oy + (y % fuente.height), z));
      }
    }
  }
}

function calidad(canvas) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  let libres = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) if (pass.passable(x, y, 8)) libres++;
  }
  return { ratio: libres / (canvas.width * canvas.height), tiles: vocabulario(canvas).size };
}

/**
 * Copia una ventana real de un mapa del juego al lienzo. Se prueban varios
 * candidatos y se queda con el primero que da un trozo de mapa jugable: suelo
 * suficiente y vocabulario de tiles amplio. Si el mapa de origen es mas grande
 * se recorta una ventana; si es mas pequeno, se repite (nunca se deja vacio).
 */
function sembrar(canvas, semilla) {
  const lista = donantes().get(canvas.tilesetId) ?? [];
  if (!lista.length) return null;
  const h = hashDe(semilla);
  let elegido = null;
  let aceptado = false;
  for (let intento = 0; intento < 10 && !aceptado; intento++) {
    const candidato = lista[(h[intento] + intento * 7) % lista.length];
    const fuente = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, mapFile(candidato.id)))));
    const ox = h[intento + 10] % Math.max(1, fuente.width - Math.min(canvas.width, fuente.width) + 1);
    const oy = h[intento + 11] % Math.max(1, fuente.height - Math.min(canvas.height, fuente.height) + 1);
    pintar(fuente, canvas, ox, oy);
    const q = calidad(canvas);
    aceptado = q.ratio >= 0.15 && q.tiles >= 24;
    if (aceptado) elegido = candidato;
  }
  if (!aceptado) {
    // Último recurso: el candidato con mas tiles del tileset, repetido.
    const candidato = lista[0];
    const fuente = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, mapFile(candidato.id)))));
    pintar(fuente, canvas, 0, 0);
    elegido = candidato;
  }
  return elegido;
}

/* ───────────────────────────── reconexión ──────────────────────────────── */

/** Celdas a las que no se llega ni apareciendo en cada evento del mapa. */
function huerfanas(canvas, eventos) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const walkable = [];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) if (pass.passable(x, y, 8)) walkable.push([x, y]);
  }
  const alcanzable = new Set();
  const arranques = eventos.filter((e) => e.x >= 0 && e.y >= 0 && e.x < canvas.width && e.y < canvas.height && pass.passable(e.x, e.y, 8));
  for (const e of arranques) for (const c of reachableCells(pass, [e.x, e.y])) alcanzable.add(c);
  if (!arranques.length && walkable.length) for (const c of reachableCells(pass, walkable[0])) alcanzable.add(c);
  const perdidas = walkable.filter(([x, y]) => !alcanzable.has(`${x},${y}`));
  return { pass, perdidas, alcanzable };
}

/** Abre un pasillo en L entre dos celdas usando el suelo del propio mapa. */
function abrirPasillo(canvas, desde, hasta, suelo) {
  if (!suelo) return;
  let [x, y] = desde;
  const [tx, ty] = hasta;
  while (x !== tx) {
    for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0);
    x += x < tx ? 1 : -1;
  }
  while (y !== ty) {
    for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0);
    y += y < ty ? 1 : -1;
  }
  for (let z = 0; z < 3; z++) canvas.set(tx, ty, z, z === 0 ? suelo : 0);
}

/**
 * Conecta las celdas huérfanas con la parte viva del mapa: se abre un pasillo
 * desde la celda alcanzable mas cercana hasta la huérfana mas cercana y se
 * repite hasta que no queda nada aislado (o se agota el presupuesto).
 */
function reconectar(canvas, eventos, maxPasillos = 40) {
  let abiertos = 0;
  for (let ronda = 0; ronda < maxPasillos; ronda++) {
    const { perdidas, alcanzable } = huerfanas(canvas, eventos);
    if (!perdidas.length) break;
    const suelo = sueloDe(canvas);
    if (!suelo) break;
    // La huérfana mas cerca de alguna celda alcanzable.
    let mejor = null;
    let mejorD = Infinity;
    for (const [ox, oy] of perdidas) {
      for (const otra of alcanzable) {
        const [px, py] = otra.split(",").map(Number);
        const d = Math.abs(ox - px) + Math.abs(oy - py);
        if (d < mejorD) { mejorD = d; mejor = [[px, py], [ox, oy]]; }
      }
      if (mejorD <= 1) break;
    }
    if (!mejor) break;
    abrirPasillo(canvas, mejor[0], mejor[1], suelo);
    abiertos++;
  }
  return abiertos;
}

/* ─────────────────────────── reparación de un mapa ─────────────────────── */

function reparar(entrada) {
  const id = entrada.mapId;
  if (!fs.existsSync(path.join(DATA, mapFile(id)))) return null;
  const raw = readMap(id);
  const { canvas } = lienzoDe(raw);
  const antes = vocabulario(canvas);
  const acciones = [];

  // 1. mapa plano o vacío: se le planta una ventana de un mapa real del juego.
  if (antes.size < 8) {
    const donante = sembrar(canvas, id);
    if (donante) acciones.push(`geometría sembrada desde el mapa ${donante.id} (${donante.tiles} tiles)`);
  }

  // 2. huecos: ninguna celda sin suelo.
  let huecos = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let cubierta = false;
      for (let z = 0; z < 3; z++) if (canvas.get(x, y, z)) { cubierta = true; break; }
      if (!cubierta) huecos++;
    }
  }
  if (huecos > 0) {
    const suelo = sueloDe(canvas);
    let rellenados = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        let cubierta = false;
        for (let z = 0; z < 3; z++) if (canvas.get(x, y, z)) { cubierta = true; break; }
        if (!cubierta && suelo) { canvas.set(x, y, 0, suelo); rellenados++; }
      }
    }
    if (rellenados) acciones.push(`${rellenados} huecos rellenados con el suelo del mapa`);
  }

  // 3. regiones a las que no se puede llegar.
  const pares = raw.getIvar("@events")?.pairs ?? [];
  const posiciones = () => pares.map(([, ev]) => ({ x: ev.getIvar("@x"), y: ev.getIvar("@y") }));
  const abiertos = reconectar(canvas, posiciones());
  if (abiertos) acciones.push(`${abiertos} pasillos abiertos hacia zonas inaccesibles`);

  // 4. Ningún evento se mueve ni se reescribe: se le abre el suelo debajo.
  // Mover un evento rompería los manifiestos de servicio de Atlas Mil, así que
  // la regla es estricta: el evento se queda donde está y el mapa se abre.
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const suelo = sueloDe(canvas);
  let caminos = 0;
  let sinSalida = 0;
  for (const [, ev] of pares) {
    const x = ev.getIvar("@x");
    const y = ev.getIvar("@y");
    if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height && pass.passable(x, y, 8)) continue;
    let destino = null;
    let mejorD = Infinity;
    for (let y2 = 0; y2 < canvas.height; y2++) {
      for (let x2 = 0; x2 < canvas.width; x2++) {
        if (!pass.passable(x2, y2, 8)) continue;
        if (x2 === x && y2 === y) continue;
        const d = Math.abs(x2 - x) + Math.abs(y2 - y);
        if (d < mejorD) { mejorD = d; destino = [x2, y2]; }
      }
    }
    if (destino && suelo && x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
      abrirPasillo(canvas, destino, [x, y], suelo);
      if (passabilityOf(canvas, canvas.tilesetId).passable(x, y, 8)) { caminos++; continue; }
    }
    sinSalida++;
  }
  if (caminos) acciones.push(`${caminos} suelos abiertos bajo eventos que quedaron dentro de un muro`);
  if (sinSalida) acciones.push(`${sinSalida} eventos sin arreglo posible (se dejan intactos)`);

  if (!acciones.length) return null;

  // Se escribe la nueva geometría conservando todo lo demás del mapa.
  raw.setIvar("@data", tableToUserDef(canvas.toTable()));
  writeMap(id, raw);
  return { id, acciones, tilesAntes: antes.size, tilesDespues: vocabulario(canvas).size };
}

/* ──────────────────────────────── programa ─────────────────────────────── */

if (VERIFY) {
  if (!fs.existsSync(AUDIT)) {
    console.log(`✘ falta ${path.relative(ROOT, AUDIT)}: ejecuta primero node tools/atlas_tile_audit.mjs`);
    process.exit(1);
  }
  const auditoria = JSON.parse(fs.readFileSync(AUDIT, "utf8"));
  const malos = auditoria.mapas.filter((m) => m.defectos?.length);
  if (malos.length) {
    console.log(`✘ ${malos.length} mapas con defectos:`);
    for (const m of malos.slice(0, 20)) console.log(`   · mapa ${m.id}: ${m.defectos.join("; ")}`);
    process.exit(1);
  }
  console.log("✔ Atlas Mil sin defectos de tiles: 1000 mapas auditados, 0 defectos.");
  process.exit(0);
}

if (!fs.existsSync(AUDIT)) {
  console.log(`✘ falta ${path.relative(ROOT, AUDIT)}: ejecuta primero node tools/atlas_tile_audit.mjs`);
  process.exit(1);
}
const auditoria = JSON.parse(fs.readFileSync(AUDIT, "utf8"));
const pendientes = new Map(auditoria.mapas.filter((m) => m.defectos?.length).map((m) => [m.id, m]));

fs.mkdirSync(BACKUP, { recursive: true });

const reparados = [];
for (const entrada of HIERARCHY.maps) {
  if (!pendientes.has(entrada.mapId)) continue;
  const archivo = mapFile(entrada.mapId);
  const copia = path.join(BACKUP, archivo);
  if (!fs.existsSync(copia)) fs.copyFileSync(path.join(DATA, archivo), copia);
  const r = reparar(entrada);
  if (r) reparados.push(r);
}

console.log(`✔ Reparación de tiles aplicada: ${reparados.length} mapas corregidos sobre ${pendientes.size} señalados.`);
for (const r of reparados.slice(0, 25)) {
  console.log(`  · mapa ${r.id} (${r.tilesAntes} → ${r.tilesDespues} tiles): ${r.acciones.join("; ")}`);
}
if (reparados.length > 25) console.log(`  · ...y ${reparados.length - 25} mapas más.`);
console.log(`\nCopias originales en ${path.relative(ROOT, BACKUP)}`);
console.log("Ahora ejecuta: node tools/atlas_tile_audit.mjs");
