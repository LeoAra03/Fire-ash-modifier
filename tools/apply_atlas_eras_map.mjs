#!/usr/bin/env node
/**
 * apply_atlas_eras_map.mjs
 *
 * «Imagina la mejor versión referencial de un mapa y créala: debe sentirse
 * como si Game Freak de cada época de cada juego hubiera hecho su mapa, para
 * permitir que se sientan como todos los juegos en uno.»
 *
 * Eso es la **Vía de las Nueve Eras**: un solo mapa continuo, en el tileset
 * exterior de Fire Ash, dividido en nueve distritos. Cada distrito es una
 * ventana REAL copiada de una ciudad de una generación distinta, escogida
 * automáticamente entre todas las ventanas posibles de ese mapa por ser la
 * más rica y la más transitable. No hay ni un tile inventado: cada ladrillo
 * lo dibujó alguien de esa época.
 *
 *   · 2195 — Atlas Mil · Vía de las Nueve Eras (106×106, exterior)
 *       Kanto · Johto · Hoenn · Sinnoh · Unova · Kalos · Alola · Galar · Glazed
 *       recorridas en serpentina, con un cronista por era, un jefe al final y
 *       la puerta del gimnasio en el centro.
 *   · 2196 — Gimnasio Atlas · Las Nueve Eras (46×42, tileset de gimnasio)
 *       nueve entrenadores, uno por generación, y una líder con un equipo que
 *       atraviesa las seis primeras eras. Medalla propia.
 *
 * Reglas del proyecto que se respetan: siempre se puede volver (baliza y
 * retorno a Puerto Horizonte), la puerta desde el Atlas exige el duelo de
 * Arceus, y **no se toca ni un mapa original de Fire Ash**: sólo se leen como
 * fuente.
 *
 * Uso:
 *   node tools/apply_atlas_eras_map.mjs
 *   node tools/apply_atlas_eras_map.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, marshalDump, RHash, RObject, RString, RSymbol } from "../web/js/marshal.js";
import { parseMap, tableGet, tableToUserDef } from "../web/js/rmxp.js";
import { ROOT, GAME, DATA } from "./lib/fire_ash_registry.mjs";
import {
  S, Sym, txt, mapFile, readData, writeData, readMap, writeMap,
  cmd, condition, graphic, page, event, texts, script, transfer, setSwitch, selfSwitch,
  grid, upsertEvents,
} from "./lib/dn_rmxp.mjs";
import { TileCanvas, passabilityOf, reachableCells, tilesets } from "./lib/map_painter.mjs";

const VERIFY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "atlas_eras_map");
const MARKER = "PokeMod Vía:";

const MAPA_VIA = 2195;
const MAPA_GIMNASIO = 2196;
const MAPA_ATLAS_HUB = 1001;
const MAPA_PUERTO = 1001;          // «Return to Puerto Horizonte» vuelve al hub del Atlas
const SW_DUELO = 873;              // canon: sin el duelo de Arceus, la Vía no existe

/* ───────────────────────── las nueve épocas ────────────────────────────── */

const ERAS = [
  { id: 1, era: "Kanto",   generacion: "1.ª generación · Game Boy",       fuente: 130, ciudad: "Ciudad Azafrán",
    cartel: "Kanto, 1996. Cuatro tonos, veredas rectas y la ciudad que inventó la palabra «Pokémon».",
    equipo: ["CHARIZARD", "ALAKAZAM"] },
  { id: 2, era: "Johto",   generacion: "2.ª generación · Game Boy Color", fuente: 282, ciudad: "Ciudad Trigal",
    cartel: "Johto, 1999. Día y noche, y una ciudad que ya sabía que un mapa podía tener memoria.",
    equipo: ["TYRANITAR", "UMBREON"] },
  { id: 3, era: "Hoenn",   generacion: "3.ª generación · Game Boy Advance", fuente: 387, ciudad: "Ciudad Portual",
    cartel: "Hoenn, 2002. El color se abre: mar, mercado y un puerto que huele a sal.",
    equipo: ["METAGROSS", "SALAMENCE"] },
  { id: 4, era: "Sinnoh",  generacion: "4.ª generación · Nintendo DS",    fuente: 574, ciudad: "Ciudad Pirita",
    cartel: "Sinnoh, 2006. La profundidad entra en escena: el mapa ya tiene capas que se pisan.",
    equipo: ["GARCHOMP", "LUCARIO"] },
  { id: 5, era: "Unova",   generacion: "5.ª generación · Nintendo DS",    fuente: 686, ciudad: "Ciudad Mayólica",
    cartel: "Unova, 2010. La ciudad se mueve: luces, altura y una calle principal que no termina.",
    equipo: ["HYDREIGON", "VOLCARONA"] },
  { id: 6, era: "Kalos",   generacion: "6.ª generación · Nintendo 3DS",   fuente: 793, ciudad: "Ciudad Luminalia",
    cartel: "Kalos, 2013. Todo se vuelve polígono: la cámara gira y la ciudad respira en tres dimensiones.",
    equipo: ["GRENINJA", "TALONFLAME"] },
  { id: 7, era: "Alola",   generacion: "7.ª generación · Nintendo 3DS",   fuente: 953, ciudad: "Ciudad Malíe",
    cartel: "Alola, 2016. Se acaban los gimnasios y empieza la isla: el mapa se vuelve ritual.",
    equipo: ["DECIDUEYE", "INCINEROAR"] },
  { id: 8, era: "Galar",   generacion: "8.ª generación · Nintendo Switch", fuente: 171, ciudad: "Ciudad Artejo",
    cartel: "Galar, 2019. Estadio, acero y niebla: la ciudad se diseña para ser vista desde lejos.",
    equipo: ["CORVIKNIGHT", "TOXTRICITY"] },
  { id: 9, era: "Glazed",  generacion: "ROM hack · la era de los creadores", fuente: 7, ciudad: "Ciudad Cedolán",
    cartel: "Glazed, la era de quienes hicieron sus propios mapas. Aquí el homenaje se vuelve canon.",
    equipo: ["DRAGONITE", "ZOROARK"] },
];

/* ───────────────────────────── utilidades ──────────────────────────────── */

const respaldo = (archivo) => {
  fs.mkdirSync(BACKUP, { recursive: true });
  const origen = path.join(DATA, archivo);
  const copia = path.join(BACKUP, archivo);
  if (fs.existsSync(origen) && !fs.existsSync(copia)) fs.copyFileSync(origen, copia);
};

const parseado = new Map();
const fuente = (id) => {
  if (!parseado.has(id)) parseado.set(id, parseMap(readMap(id)));
  return parseado.get(id);
};

/** Tile de suelo más usado en una zona: el que ya pisa la gente en esa ciudad. */
function sueloDe(canvas, x0, y0, w, h) {
  const ts = canvas.tilesetId;
  const pases = tses().get(ts)?.passages;
  const cuenta = new Map();
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const t = canvas.get(x, y, 0);
      if (!t) continue;
      if (pases && (pases.data[t] ?? 0) !== 0) continue;
      cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
    }
  }
  if (!cuenta.size) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const t = canvas.get(x, y, 0);
      if (t) cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
    }
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

let fuenteTses = null;
function tses() {
  if (!fuenteTses) fuenteTses = tilesets();
  return fuenteTses;
}

/* ───────────────── elección de la mejor ventana de cada era ─────────────── */

const LADO = 30;

function mejorVentana(idFuente) {
  const p = fuente(idFuente);
  const pass = passabilityOf(p, p.tilesetId);
  let mejor = null;
  let mejorPunto = -1;
  for (let oy = 0; oy + LADO <= p.height; oy += 2) {
    for (let ox = 0; ox + LADO <= p.width; ox += 2) {
      let libres = 0;
      const tiles = new Set();
      for (let y = oy; y < oy + LADO; y++) {
        for (let x = ox; x < ox + LADO; x++) {
          if (pass.passable(x, y, 8)) libres++;
          for (let z = 0; z < p.table.z; z++) {
            const t = tableGet(p.table, x, y, z);
            if (t) tiles.add(t);
          }
        }
      }
      const ratio = libres / (LADO * LADO);
      // Se premia la variedad y un suelo caminable generoso, y se castiga el
      // desierto (nada que ver) y el hormigón (todo edificio, sin por donde andar).
      if (ratio < 0.18 || ratio > 0.8) continue;
      const punto = tiles.size + ratio * 120;
      if (punto > mejorPunto) { mejorPunto = punto; mejor = { ox, oy, ratio, tiles: tiles.size }; }
    }
  }
  if (!mejor) {
    // Ninguna ventana cumple el mínimo: se coge la de más tiles, sin filtro.
    let tilesMax = 0;
    for (let oy = 0; oy + LADO <= p.height; oy += 4) {
      for (let ox = 0; ox + LADO <= p.width; ox += 4) {
        const tiles = new Set();
        for (let y = oy; y < oy + LADO; y++) for (let x = ox; x < ox + LADO; x++) for (let z = 0; z < p.table.z; z++) {
          const t = tableGet(p.table, x, y, z); if (t) tiles.add(t);
        }
        if (tiles.size > tilesMax) { tilesMax = tiles.size; mejor = { ox, oy, ratio: 0, tiles: tiles.size }; }
      }
    }
  }
  return mejor ?? { ox: 0, oy: 0, ratio: 0, tiles: 0 };
}

/* ─────────────────────────── composición ───────────────────────────────── */

const BORDE = 2;
const HUECO = 6;
const ANCHO = BORDE * 2 + LADO * 3 + HUECO * 2;

const posicion = (fila, col) => [BORDE + col * (LADO + HUECO), BORDE + fila * (LADO + HUECO)];
/** Serpentina: se entra por Kanto y se sale por Glazed sin dar un paso atrás. */
const eraEn = (fila, col) => (fila % 2 === 0 ? fila * 3 + col : fila * 3 + (2 - col));
const celdaDe = (indice) => {
  const fila = Math.floor(indice / 3);
  const col = fila % 2 === 0 ? indice % 3 : 2 - (indice % 3);
  return { fila, col };
};

function abrirPasillo(canvas, desde, hasta, suelo) {
  if (!suelo) return;
  let [x, y] = desde;
  const [tx, ty] = hasta;
  while (x !== tx) { for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0); x += x < tx ? 1 : -1; }
  while (y !== ty) { for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0); y += y < ty ? 1 : -1; }
  for (let z = 0; z < 3; z++) canvas.set(tx, ty, z, z === 0 ? suelo : 0);
}

function regiones(canvas) {
  const pass = passabilityOf(canvas, canvas.tilesetId);
  const libres = [];
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pass.passable(x, y, 8)) libres.push([x, y]);
  return { pass, libres };
}

/** Une todas las zonas caminables: ningún trozo de la Vía queda incomunicado. */
function conectarTodo(canvas, arranques, maxPasillos = 60) {
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
    let mejor = null;
    let mejorD = Infinity;
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
    abiertos++;
  }
  return abiertos;
}

/* ──────────────────────────── el mapa de la Vía ────────────────────────── */

function construirVia() {
  const canvas = new TileCanvas(ANCHO, ANCHO, 1);
  // Suelo base: el tile de exterior más común de las nueve ciudades, para que
  // los huecos entre distritos sean campo y no un agujero negro.
  const cuentaBase = new Map();
  for (const era of ERAS) {
    const p = fuente(era.fuente);
    for (let y = 0; y < p.height; y += 2) for (let x = 0; x < p.width; x += 2) {
      const t = tableGet(p.table, x, y, 0);
      if (!t) continue;
      const pases = tses().get(p.tilesetId)?.passages;
      if (pases && (pases.data[t] ?? 0) !== 0) continue;
      cuentaBase.set(t, (cuentaBase.get(t) ?? 0) + 1);
    }
  }
  const sueloBase = [...cuentaBase.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  canvas.fillAll(0, sueloBase);

  const ventanas = [];
  for (let indice = 0; indice < ERAS.length; indice++) {
    const era = ERAS[indice];
    const { fila, col } = celdaDe(indice);
    const [dx, dy] = posicion(fila, col);
    const ventana = mejorVentana(era.fuente);
    ventanas.push({ era, dx, dy, ...ventana });
    for (let y = 0; y < LADO; y++) {
      for (let x = 0; x < LADO; x++) {
        const p = fuente(era.fuente);
        for (let z = 0; z < 3; z++) {
          canvas.set(dx + x, dy + y, z, tableGet(p.table, ventana.ox + x, ventana.oy + y, z));
        }
      }
    }
  }

  // Un anillo de suelo alrededor de cada distrito: la Vía se lee como nueve
  // plazas unidas por un paseo, no como nueve parches pegados.
  for (const v of ventanas) {
    const suelo = sueloDe(canvas, v.dx, v.dy, LADO, LADO) || sueloBase;
    for (let x = v.dx - 1; x <= v.dx + LADO; x++) {
      for (const y of [v.dy - 1, v.dy + LADO]) {
        if (x < 0 || x >= ANCHO || y < 0 || y >= ANCHO) continue;
        for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0);
      }
    }
    for (let y = v.dy - 1; y <= v.dy + LADO; y++) {
      for (const x of [v.dx - 1, v.dx + LADO]) {
        if (x < 0 || x >= ANCHO || y < 0 || y >= ANCHO) continue;
        for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0);
      }
    }
  }

  // Avenidas: se recorre la serpentina de principio a fin.
  for (let indice = 0; indice < ERAS.length - 1; indice++) {
    const a = celdaDe(indice);
    const b = celdaDe(indice + 1);
    const [ax, ay] = posicion(a.fila, a.col);
    const [bx, by] = posicion(b.fila, b.col);
    const sueloA = sueloDe(canvas, ax, ay, LADO, LADO) || sueloBase;
    const centroY = (f, c) => posicion(f, c)[1] + Math.floor(LADO / 2);
    if (a.fila === b.fila) {
      const y = centroY(a.fila, a.col);
      const desde = a.col < b.col ? [ax + LADO, y] : [ax - 1, y];
      const hasta = a.col < b.col ? [bx - 1, y] : [bx + LADO, y];
      abrirPasillo(canvas, desde, hasta, sueloA);
    } else {
      const x = posicion(a.fila, a.col)[0] + Math.floor(LADO / 2);
      const desde = a.fila < b.fila ? [x, ay + LADO] : [x, ay - 1];
      const hasta = a.fila < b.fila ? [x, by - 1] : [x, by + LADO];
      abrirPasillo(canvas, desde, hasta, sueloA);
    }
  }

  return { canvas, ventanas, sueloBase };
}

/* ───────────────────────── celdas y eventos ────────────────────────────── */

function celdaLibreCerca(canvas, centro, ocupadas, maxDist = 14) {
  const { pass } = regiones(canvas);
  let mejor = null;
  let mejorD = Infinity;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (!pass.passable(x, y, 8)) continue;
      if (ocupadas.has(`${x},${y}`)) continue;
      const d = Math.abs(x - centro[0]) + Math.abs(y - centro[1]);
      if (d < mejorD) { mejorD = d; mejor = [x, y]; }
    }
  }
  return mejorD <= maxDist ? mejor : null;
}

const scriptLineas = (lineas) => cmd(355, [S(lineas.join("\n"))]);

function eventosVia(canvas, ventanas) {
  const ocupadas = new Set();
  const centros = ventanas.map((v) => [v.dx + Math.floor(LADO / 2), v.dy + Math.floor(LADO / 2)]);
  const sitio = (i) => {
    const c = celdaLibreCerca(canvas, centros[i], ocupadas, 20);
    if (c) ocupadas.add(`${c[0]},${c[1]}`);
    return c;
  };

  const llegada = sitio(0);
  const puertaGimnasio = sitio(4);
  const jefe = sitio(8);

  const nombres = [
    `${MARKER} Regreso a Puerto Horizonte`,
    `${MARKER} Baliza de la Vía`,
    `${MARKER} Puerta del Gimnasio`,
    `${MARKER} Guardiana de la Vía`,
    ...ventanas.map((v) => `${MARKER} Cronista — ${v.era.era}`),
  ];

  return upsertEvents(MAPA_VIA, nombres, (baseId) => {
    let id = baseId;
    const fuera = [];

    fuera.push(event(id++, `${MARKER} Regreso a Puerto Horizonte`, llegada[0], llegada[1], [
      page({
        trigger: 0,
        list: [
          ...texts(["El Rotom del Tiempo sostiene la Vía. Puedes irte cuando quieras."]),
          transfer(MAPA_PUERTO, 34, 23, 2),
          cmd(0),
        ],
      }),
    ]));

    fuera.push(event(id++, `${MARKER} Baliza de la Vía`, llegada[0] + 1, llegada[1], [
      page({
        trigger: 0,
        list: [
          ...texts([
            "Baliza del Atlas Mil. Deja aquí tu marca y podrás volver a la Vía",
            "de las Nueve Eras desde cualquier otra baliza.",
          ]),
          cmd(0),
        ],
      }),
    ]));

    fuera.push(event(id++, `${MARKER} Puerta del Gimnasio`, puertaGimnasio[0], puertaGimnasio[1], [
      page({
        trigger: 0,
        list: [
          ...texts([
            "En el centro de la Vía, una puerta que no pertenece a ninguna ciudad:",
            "el Gimnasio de las Nueve Eras.",
          ]),
          transfer(MAPA_GIMNASIO, 6, 6, 2),
          cmd(0),
        ],
      }),
    ]));

    fuera.push(event(id++, `${MARKER} Guardiana de la Vía`, jefe[0], jefe[1], [
      page({
        trigger: 0,
        gfx: graphic("ARCEUS_GATE", 2),
        list: [
          ...texts([
            "Al final del paseo, alguien espera de pie, como si llevara siglos ahí.",
            "\\bGuardiAna: Nueve épocas te han traído hasta aquí. Nueve maneras de",
            "dibujar el mismo mundo. Yo soy la que las recuerda todas.",
          ]),
          scriptLineas([
            "begin",
            "  $game_variables[299] = pbTrainerBattle(PBTrainer.new(\"ATLAS_ERAS_LEADER\", \"VERA\"), false, \"\", true) ? 1 : 0",
            "rescue",
            "  $game_variables[299] = 0",
            "end",
          ]),
          cmd(0),
        ],
      }),
      page({
        cond: condition({ self: "A" }),
        list: [...texts(["La Guardiana asiente. La Vía ya te reconoce."]), cmd(0)],
      }),
    ]));

    for (let i = 0; i < ventanas.length; i++) {
      const v = ventanas[i];
      const celda = sitio(i);
      if (!celda) continue;
      fuera.push(event(id++, `${MARKER} Cronista — ${v.era.era}`, celda[0], celda[1], [
        page({
          trigger: 0,
          list: [
            ...texts([
              `Cronista de ${v.era.era} — ${v.era.generacion}.`,
              v.era.cartel,
              `Este distrito es un trozo real de ${v.era.ciudad}: no está rehecho, está traído.`,
            ]),
            cmd(0),
          ],
        }),
      ]));
    }

    return fuera;
  }, { verbose: false });
}

/* ─────────────────────────── el gimnasio ───────────────────────────────── */

const GIMNASIO_W = 46;
const GIMNASIO_H = 42;
const GIMNASIO_FUENTE = 416;   // Gimnasio Petalburgo (tileset de gimnasio, 40×35)

function construirGimnasio() {
  const canvas = new TileCanvas(GIMNASIO_W, GIMNASIO_H, 14);
  const p = fuente(GIMNASIO_FUENTE);
  // Suelo de gimnasio: el tile más usado en la capa 0 del gimnasio real.
  const pases = tses().get(14)?.passages;
  const cuenta = new Map();
  const todo = new Map();
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    const t = tableGet(p.table, x, y, 0);
    if (!t) continue;
    todo.set(t, (todo.get(t) ?? 0) + 1);
    if (pases && (pases.data[t] ?? 0) !== 0) continue;   // muro: no sirve de suelo
    cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
  }
  const masUsado = (mapa) => [...mapa.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  const suelo = (cuenta.size ? masUsado(cuenta) : 0) || masUsado(todo);
  canvas.fillAll(0, suelo);

  // El gimnasio real se coloca una sola vez, centrado: un pabellón dentro de
  // una sala, no un laberinto repetido hasta los bordes.
  const anchoCopia = Math.min(p.width, GIMNASIO_W - 10);
  const altoCopia = Math.min(p.height, GIMNASIO_H - 10);
  const ox = Math.floor((GIMNASIO_W - anchoCopia) / 2);
  const oy = Math.floor((GIMNASIO_H - altoCopia) / 2);
  for (let y = 0; y < altoCopia; y++) {
    for (let x = 0; x < anchoCopia; x++) {
      for (let z = 0; z < 3; z++) canvas.set(ox + x, oy + y, z, tableGet(p.table, x, y, z));
    }
  }

  // Pasillos perimetrales y una cruz central: el pabellón se puede rodear y
  // atravesar, como en un gimnasio de verdad.
  const pintar = (x, y) => { for (let z = 0; z < 3; z++) canvas.set(x, y, z, z === 0 ? suelo : 0); };
  for (let x = 1; x < GIMNASIO_W - 1; x++) { pintar(x, 1); pintar(x, GIMNASIO_H - 2); }
  for (let y = 1; y < GIMNASIO_H - 1; y++) { pintar(1, y); pintar(GIMNASIO_W - 2, y); }
  const cy = Math.floor(GIMNASIO_H / 2);
  const cx = Math.floor(GIMNASIO_W / 2);
  for (let x = 1; x < GIMNASIO_W - 1; x++) pintar(x, cy);
  for (let y = 1; y < GIMNASIO_H - 1; y++) { pintar(cx, y); pintar(cx - 1, y); }
  for (let y = oy; y < oy + altoCopia; y++) { pintar(ox - 1, y); pintar(ox + anchoCopia, y); }
  return { canvas, suelo };
}

function especiesDisponibles() {
  const sp = readData("species.dat");
  const set = new Set();
  for (const [k] of sp.pairs) if (k && k.name) set.add(k.name);
  return set;
}

function instalarTipos() {
  const tt = readData("trainer_types.dat");
  const cambios = [];
  const plantillas = [
    { id: "ATLAS_ERAS_TRAINER", base: "GENTLEMAN", nombre: "Vía Eras" },
    { id: "ATLAS_ERAS_LEADER", base: "LEADER_Brock", nombre: "Líder Eras" },
  ];
  for (const plantilla of plantillas) {
    if (tt.pairs.some(([k]) => txt(k) === plantilla.id)) { cambios.push({ ...plantilla, added: false }); continue; }
    const [, base] = tt.pairs.find(([k]) => txt(k) === plantilla.base) ?? [];
    if (!base) throw new Error(`no existe el tipo base ${plantilla.base}`);
    const clone = new RObject(base.className, base.ivars.map(([k, v]) => [k, v]));
    const numeros = tt.pairs.map(([, v]) => v.getIvar("@id_number")).filter((n) => typeof n === "number");
    clone.setIvar("@id", Sym(plantilla.id));
    clone.setIvar("@id_number", Math.max(-1, ...numeros) + 1);
    clone.setIvar("@real_name", S(plantilla.nombre));
    tt.pairs.push([Sym(plantilla.id), clone]);
    cambios.push({ ...plantilla, added: true });
  }
  writeData("trainer_types.dat", tt);
  return cambios;
}

function instalarEntrenadores() {
  const especies = especiesDisponibles();
  const d = readData("trainers.dat");
  let siguiente = Math.max(-1, ...d.pairs.filter(([k]) => typeof k === "number").map(([k]) => k)) + 1;
  const altas = [];
  const alta = (tipo, nombre, equipo, nivel, derrota) => {
    if (d.pairs.some(([k]) => Array.isArray(k) && txt(k[0]) === tipo && txt(k[1]) === nombre)) {
      altas.push({ nombre, added: false });
      return;
    }
    const key = [Sym(tipo), S(nombre), 0];
    const obj = new RObject("GameData::Trainer", [
      ["@id", key], ["@id_number", siguiente], ["@trainer_type", key[0]],
      ["@real_name", S(nombre)], ["@version", 0], ["@items", [Sym("FULLRESTORE")]],
      ["@real_lose_text", S(derrota)], ["@numpkmn", 0], ["@guara", 0],
      ["@pokemon", equipo.map((sp) => new RHash([[Sym("species"), Sym(sp)], [Sym("level"), nivel]]))],
    ]);
    d.pairs.push([siguiente, obj], [key, obj]);
    siguiente++;
    altas.push({ nombre, added: true });
  };

  for (const era of ERAS) {
    const equipo = era.equipo.filter((sp) => especies.has(sp));
    if (!equipo.length) continue;
    alta("ATLAS_ERAS_TRAINER", `ERAS_${String(era.id).padStart(2, "0")}`, equipo, 100,
      `${era.era} te cede el paso. Sigue caminando por la Vía.`);
  }
  const equipoLider = ["ALAKAZAM", "TYRANITAR", "METAGROSS", "GARCHOMP", "HYDREIGON", "GRENINJA"]
    .filter((sp) => especies.has(sp));
  alta("ATLAS_ERAS_LEADER", "VERA", equipoLider, 100,
    "Vera: Nueve épocas, un mismo mundo. La Vía es tuya.");
  writeData("trainers.dat", d);
  return altas;
}

function instalarMedalla() {
  const items = readData("items.dat");
  const id = "ATLASERABADGE";
  if (items.pairs.some(([k]) => txt(k) === id)) return { added: false };
  const [, base] = items.pairs.find(([k]) => txt(k) === "BOULDERBADGE") ?? [];
  if (!base) return { added: false, error: "sin medalla base" };
  const clone = new RObject(base.className, base.ivars.map(([k, v]) => [k, v]));
  const numeros = items.pairs.map(([, v]) => v.getIvar("@id_number")).filter((n) => typeof n === "number");
  clone.setIvar("@id", Sym(id));
  clone.setIvar("@id_number", Math.max(-1, ...numeros) + 1);
  clone.setIvar("@real_name", S("Medalla Era"));
  clone.setIvar("@real_name_plural", S("Medallas Era"));
  clone.setIvar("@pocket", 8);
  items.pairs.push([Sym(id), clone]);
  writeData("items.dat", items);
  return { added: true };
}

function eventosGimnasio(canvas) {
  const ocupadas = new Set();
  const { pass } = regiones(canvas);
  const sitio = (centro) => {
    let mejor = null;
    let mejorD = Infinity;
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        if (!pass.passable(x, y, 8)) continue;
        if (ocupadas.has(`${x},${y}`)) continue;
        const d = Math.abs(x - centro[0]) + Math.abs(y - centro[1]);
        if (d < mejorD) { mejorD = d; mejor = [x, y]; }
      }
    }
    if (mejor) ocupadas.add(`${mejor[0]},${mejor[1]}`);
    return mejor;
  };

  const salida = sitio([3, 3]);
  const nombres = [`${MARKER} Salida del Gimnasio`, `${MARKER} Líder Vera`,
    ...ERAS.map((e) => `${MARKER} Entrenador — ${e.era}`)];

  return upsertEvents(MAPA_GIMNASIO, nombres, (baseId) => {
    let id = baseId;
    const fuera = [];

    fuera.push(event(id++, `${MARKER} Salida del Gimnasio`, salida[0], salida[1], [
      page({
        trigger: 0,
        list: [
          ...texts(["La puerta da a la Vía de las Nueve Eras. Puedes volver cuando quieras."]),
          transfer(MAPA_VIA, 8, 8, 2),
          cmd(0),
        ],
      }),
    ]));

    // Nueve entrenadores, uno por generación, repartidos por la sala.
    const Puesto = [
      [6, 5], [20, 5], [34, 5],
      [6, 18], [20, 18], [34, 18],
      [6, 31], [20, 31], [34, 31],
    ];
    let columna = 0;
    for (const era of ERAS) {
      const celda = sitio(Puesto[columna] ?? [20, 18]);
      columna++;
      if (!celda) continue;
      fuera.push(event(id++, `${MARKER} Entrenador — ${era.era}`, celda[0], celda[1], [
        page({
          trigger: 0,
          list: [
            ...texts([
              `Entrenador de ${era.era} — ${era.generacion}.`,
              `«${era.cartel}»`,
            ]),
            scriptLineas([
              "begin",
              `  $game_variables[298] = pbTrainerBattle(PBTrainer.new("ATLAS_ERAS_TRAINER", "ERAS_${String(era.id).padStart(2, "0")}"), false, "", true) ? 1 : 0`,
              "rescue",
              "  $game_variables[298] = 0",
              "end",
            ]),
            cmd(0),
          ],
        }),
      ]));
    }

    const celdaLider = sitio([GIMNASIO_W - 6, GIMNASIO_H - 6]);
    if (celdaLider) {
      fuera.push(event(id++, `${MARKER} Líder Vera`, celdaLider[0], celdaLider[1], [
        page({
          trigger: 0,
          list: [
            ...texts([
              "\\bVera: Soy la líder de este gimnasio y la guardiana del orden en que",
              "llegaron las cosas. Kanto primero. Luego todo lo demás.",
              "Si quieres la Medalla Era, demuéstrame que entiendes las nueve épocas",
              "como una sola. No como nueve juegos: como uno.",
            ]),
            scriptLineas([
              "begin",
              "  $game_variables[299] = pbTrainerBattle(PBTrainer.new(\"ATLAS_ERAS_LEADER\", \"VERA\"), false, \"\", true) ? 1 : 0",
              "rescue",
              "  $game_variables[299] = 0",
              "end",
            ]),
            scriptLineas([
              "begin",
              "  if $game_variables[299] == 1",
              "    pbReceiveItem(:ATLASERABADGE)",
              "  end",
              "rescue",
              "  pbMessage(\"(medalla pendiente de registrar)\")",
              "end",
            ]),
            cmd(0),
          ],
        }),
      ]));
    }
    return fuera;
  }, { verbose: false });
}

/* ───────────────────── registro en MapInfos y metadatos ────────────────── */

function registrar() {
  respaldo("MapInfos.rxdata");
  const infos = readData("MapInfos.rxdata");
  const ids = new Set([MAPA_VIA, MAPA_GIMNASIO]);
  infos.pairs = infos.pairs.filter(([k]) => !ids.has(Number(k)));
  let orden = Math.max(0, ...infos.pairs.map(([, o]) => Number(o.getIvar("@order") ?? 0))) + 1;
  const info = (id, nombre, padre) => new RObject("RPG::MapInfo", [
    ["@scroll_x", 512], ["@name", S(nombre)], ["@expanded", false],
    ["@order", orden++], ["@parent_id", padre], ["@scroll_y", 384],
  ]);
  infos.pairs.push([MAPA_VIA, info(MAPA_VIA, "Atlas Mil · Vía de las Nueve Eras", MAPA_ATLAS_HUB)]);
  infos.pairs.push([MAPA_GIMNASIO, info(MAPA_GIMNASIO, "Gimnasio Atlas · Las Nueve Eras", MAPA_VIA)]);
  writeData("MapInfos.rxdata", infos);

  respaldo("map_metadata.dat");
  const md = readData("map_metadata.dat");
  md.pairs = md.pairs.filter(([k]) => !ids.has(Number(k)));
  const porId = new Map(md.pairs.map(([k, o]) => [Number(k), o]));
  const plantilla = porId.get(1021) ?? porId.get(973);
  for (const id of [MAPA_VIA, MAPA_GIMNASIO]) {
    const meta = plantilla
      ? new RObject(plantilla.className, plantilla.ivars.map(([k, v]) => [k, v]))
      : new RObject("GameData::MapMetadata", [["@id", id]]);
    meta.setIvar("town_map_position", [9, 0, 0]);
    md.pairs.push([id, meta]);
  }
  writeData("map_metadata.dat", md);
}

/** Puerta desde el Atlas Mil: cerrada hasta que Arceus caiga (canon). */
function puertaEnAtlas() {
  const nombre = `${MARKER} Puerta — Vía de las Nueve Eras`;
  const g = grid(MAPA_ATLAS_HUB);
  const ancla = g.events.find((e) => /Cronista/i.test(e.name)) ?? g.events[0];
  const libre = celdaLibreEnAtlasHub(ancla);
  if (!libre) return null;
  return upsertEvents(MAPA_ATLAS_HUB, [nombre], (baseId) => [
    event(baseId, nombre, libre[0], libre[1], [
      page({
        cond: condition({ sw: SW_DUELO }),
        trigger: 0,
        list: [
          ...texts([
            "Una puerta baja, de piedra nueva, que no estaba en ningún plano del Atlas.",
            "Detrás se oyen nueve ciudades respirando al mismo tiempo.",
          ]),
          transfer(MAPA_VIA, 4, 4, 2),
          cmd(0),
        ],
      }),
      page({
        trigger: 0,
        list: [
          ...texts([
            "La puerta existe, pero no lleva a ninguna parte.",
            "Nada de esto se sostiene mientras Arceus no caiga en La Ruta de Dios.",
          ]),
          cmd(0),
        ],
      }),
    ]),
  ], { verbose: false });
}

function celdaLibreEnAtlasHub(ancla) {
  const g = grid(MAPA_ATLAS_HUB);
  const p = parseMap(readMap(MAPA_ATLAS_HUB));
  const pass = passabilityOf(p, p.tilesetId);
  const ocupadas = new Set(g.events.map((e) => `${e.x},${e.y}`));
  let mejor = null;
  let mejorD = Infinity;
  const centro = [ancla.x + 2, ancla.y];
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      if (!pass.passable(x, y, 8)) continue;
      if (ocupadas.has(`${x},${y}`)) continue;
      const d = Math.abs(x - centro[0]) + Math.abs(y - centro[1]);
      if (d < mejorD) { mejorD = d; mejor = [x, y]; }
    }
  }
  return mejorD <= 12 ? mejor : null;
}

/* ───────────────────────────── verificación ────────────────────────────── */

function verificar() {
  const fallos = [];
  const ok = (cond, texto) => { if (!cond) fallos.push(texto); };

  for (const id of [MAPA_VIA, MAPA_GIMNASIO]) {
    if (!fs.existsSync(path.join(DATA, mapFile(id)))) { fallos.push(`falta el mapa ${id}`); continue; }
    const g = grid(id);
    ok(g.width > 10 && g.height > 10, `el mapa ${id} es diminuto`);
    const libres = g.events.filter((e) => passableEn(id, e.x, e.y));
    ok(libres.length === g.events.length, `el mapa ${id} tiene ${g.events.length - libres.length} eventos inalcanzables`);
    ok(g.events.some((e) => /Regreso a Puerto Horizonte|Salida del Gimnasio/.test(e.name)),
      `el mapa ${id} no tiene salida`);
  }

  {
    const g = grid(MAPA_VIA);
    for (const era of ERAS) {
      ok(g.events.some((e) => e.name.includes(`Cronista — ${era.era}`)), `falta el cronista de ${era.era}`);
    }
    ok(g.events.some((e) => /Puerta del Gimnasio/.test(e.name)), "falta la puerta del gimnasio");
    ok(g.events.some((e) => /Guardiana de la Vía/.test(e.name)), "falta la guardiana");
  }

  {
    const g = grid(MAPA_GIMNASIO);
    const entrenadores = g.events.filter((e) => e.name.includes("Entrenador —")).length;
    ok(entrenadores === ERAS.length, `hay ${entrenadores} entrenadores de era (se esperan ${ERAS.length})`);
    ok(g.events.some((e) => /Líder Vera/.test(e.name)), "falta la líder del gimnasio");
  }

  {
    const tt = readData("trainer_types.dat");
    ok(tt.pairs.some(([k]) => txt(k) === "ATLAS_ERAS_TRAINER"), "falta el tipo ATLAS_ERAS_TRAINER");
    ok(tt.pairs.some(([k]) => txt(k) === "ATLAS_ERAS_LEADER"), "falta el tipo ATLAS_ERAS_LEADER");
    const d = readData("trainers.dat");
    for (const era of ERAS) {
      const nombre = `ERAS_${String(era.id).padStart(2, "0")}`;
      ok(d.pairs.some(([k]) => Array.isArray(k) && txt(k[1]) === nombre), `falta el entrenador ${nombre}`);
    }
    ok(d.pairs.some(([k]) => Array.isArray(k) && txt(k[1]) === "VERA"), "falta el entrenador VERA");
    const items = readData("items.dat");
    ok(items.pairs.some(([k]) => txt(k) === "ATLASERABADGE"), "falta la Medalla Era");
  }

  {
    const g = grid(MAPA_ATLAS_HUB);
    const puerta = g.events.find((e) => e.name.includes("Puerta — Vía de las Nueve Eras"));
    ok(!!puerta, "no hay puerta a la Vía en el Atlas Mil");
    if (puerta) {
      const cerrada = puerta.pages.some((p) => {
        const c = p.getIvar("@condition");
        return c && c.getIvar("@switch1_valid") && c.getIvar("@switch1_id") === SW_DUELO;
      });
      ok(cerrada, "la puerta de la Vía no exige el duelo de Arceus");
    }
  }

  const infos = readData("MapInfos.rxdata");
  ok(infos.pairs.some(([k]) => Number(k) === MAPA_VIA), "MapInfos no registra la Vía");
  ok(infos.pairs.some(([k]) => Number(k) === MAPA_GIMNASIO), "MapInfos no registra el gimnasio");
  const md = readData("map_metadata.dat");
  ok(md.pairs.some(([k]) => Number(k) === MAPA_VIA), "map_metadata no registra la Vía");
  ok(md.pairs.some(([k]) => Number(k) === MAPA_GIMNASIO), "map_metadata no registra el gimnasio");

  return fallos;
}

function passableEn(id, x, y) {
  const p = parseMap(readMap(id));
  const pass = passabilityOf(p, p.tilesetId);
  return x >= 0 && y >= 0 && x < p.width && y < p.height && pass.passable(x, y, 8);
}

/* ──────────────────────────────── programa ─────────────────────────────── */

if (VERIFY) {
  const fallos = verificar();
  if (fallos.length) {
    console.log("✘ Vía de las Nueve Eras incompleta:");
    for (const f of fallos) console.log(`   · ${f}`);
    process.exit(1);
  }
  console.log("✔ Vía de las Nueve Eras verificada: 9 distritos reales de 9 épocas, gimnasio nuevo con 9 entrenadores y líder, medalla propia y puerta cerrada hasta el duelo de Arceus.");
  process.exit(0);
}

respaldo("MapInfos.rxdata");
respaldo("map_metadata.dat");
respaldo("trainer_types.dat");
respaldo("trainers.dat");
respaldo("items.dat");

const { canvas, ventanas } = construirVia();
const existeVia = fs.existsSync(path.join(DATA, mapFile(MAPA_VIA)));
const mapaVia = existeVia ? readMap(MAPA_VIA) : null;
if (mapaVia) {
  mapaVia.setIvar("@data", tableToUserDef(canvas.toTable()));
  mapaVia.setIvar("@width", canvas.width);
  mapaVia.setIvar("@height", canvas.height);
  mapaVia.setIvar("@tileset_id", canvas.tilesetId);
  writeMap(MAPA_VIA, mapaVia);
} else {
  const { buildMapObject } = await import("./lib/map_painter.mjs");
  const nuevo = buildMapObject(canvas, { bgm: "", bgs: "" });
  writeMap(MAPA_VIA, nuevo);
}
const arranques = ventanas.map((v) => [v.dx + Math.floor(LADO / 2), v.dy + Math.floor(LADO / 2)]);
const pasillos = conectarTodo(canvas, arranques);
// Se reescribe después de abrir los pasillos.
{
  const mapa = readMap(MAPA_VIA);
  mapa.setIvar("@data", tableToUserDef(canvas.toTable()));
  writeMap(MAPA_VIA, mapa);
}
const resumenVia = eventosVia(canvas, ventanas);

const { canvas: canvasGym } = construirGimnasio();
{
  const mapa = fs.existsSync(path.join(DATA, mapFile(MAPA_GIMNASIO))) ? readMap(MAPA_GIMNASIO) : null;
  if (mapa) {
    mapa.setIvar("@data", tableToUserDef(canvasGym.toTable()));
    mapa.setIvar("@width", canvasGym.width);
    mapa.setIvar("@height", canvasGym.height);
    mapa.setIvar("@tileset_id", canvasGym.tilesetId);
    writeMap(MAPA_GIMNASIO, mapa);
  } else {
    const { buildMapObject } = await import("./lib/map_painter.mjs");
    writeMap(MAPA_GIMNASIO, buildMapObject(canvasGym, { bgm: "", bgs: "" }));
  }
}
conectarTodo(canvasGym, [[3, 3]], 40);
{
  const mapa = readMap(MAPA_GIMNASIO);
  mapa.setIvar("@data", tableToUserDef(canvasGym.toTable()));
  writeMap(MAPA_GIMNASIO, mapa);
}
const resumenGym = eventosGimnasio(canvasGym);

const tipos = instalarTipos();
const entrenadores = instalarEntrenadores();
const medalla = instalarMedalla();
registrar();
const puerta = puertaEnAtlas();

console.log(`✔ Vía de las Nueve Eras creada en ${path.relative(ROOT, GAME)}`);
console.log(`  · mapa ${MAPA_VIA}: ${ANCHO}×${ANCHO}, ${pasillos} pasillos de unión`);
for (const v of ventanas) {
  console.log(`      distrito ${String(v.era.id).padStart(2, "0")} ${v.era.era.padEnd(7)} ← ${v.era.ciudad} (mapa ${v.era.fuente}, ventana ${v.ox},${v.oy} · ${v.tiles} tiles · ${(v.ratio * 100).toFixed(0)}% andable)`);
}
console.log(`  · eventos de la Vía: ${resumenVia.added.length} (${ERAS.length} cronistas, guardiana, puerta, baliza y regreso)`);
console.log(`  · mapa ${MAPA_GIMNASIO}: ${GIMNASIO_W}×${GIMNASIO_H}, gimnasio nuevo con ${resumenGym.added.length} eventos`);
console.log(`  · tipos de entrenador: ${tipos.map((t) => `${t.id}${t.added ? " (nuevo)" : ""}`).join(", ")}`);
console.log(`  · entrenadores nuevos: ${entrenadores.filter((e) => e.added).length} de ${entrenadores.length}`);
console.log(`  · medalla: ${medalla.added ? "Medalla Era registrada" : "ya existía"}`);
console.log(`  · puerta en el Atlas Mil: ${puerta ? `mapa ${MAPA_ATLAS_HUB} en (${puerta.added[0]?.x},${puerta.added[0]?.y}), cerrada hasta el duelo de Arceus` : "no colocada"}`);

const fallos = verificar();
if (fallos.length) {
  console.log("\n✘ La verificación encontró problemas:");
  for (const f of fallos) console.log(`   · ${f}`);
  process.exit(1);
}
console.log("✔ Verificación posterior OK.");
