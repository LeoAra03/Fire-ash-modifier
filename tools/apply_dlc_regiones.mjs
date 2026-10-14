#!/usr/bin/env node
/**
 * apply_dlc_regiones.mjs
 *
 * Convierte Glazed y Light Platinum en regiones y la base del Team Rocket en
 * un edificio por el que se infiltra uno. Antes de esto, las dos invitadas
 * eran dos habitaciones con un gimnasio —un puerto, no una región— y la base
 * del Sindicato era un descampado con uniformes.
 *
 * Ahora son diecinueve mapas conectados: rutas, ciudades, una cueva glaciar,
 * centros, tiendas, un laboratorio, una zona safari y siete salas
 * industriales. Cada uno se dibuja con `region_builder`, que aprende los
 * bordes de los materiales de mapas reales del juego, y cada uno pasa el
 * filtro de los tres departamentos antes de darse por bueno:
 *
 *   · mapeo      → planta trazada y reparada (pasillos de dos, sin islas)
 *   · QA técnico → inundación desde la llegada; softlock con coordenadas
 *   · dirección de arte → monotonía, costuras y prioridad de capas
 *
 * La profundidad se resuelve con dos planos que se mueven a distinta
 * velocidad: la niebla (plano cercano, generada por código, se desplaza con
 * `@fog_sx`/`@fog_sy`) y el clima (partículas, desde `map_metadata`). RPG
 * Maker XP sólo tiene un plano de niebla por mapa, y en Essentials lo lee el
 * tileset, así que cada ambiente se estrena con un tileset clonado: nunca se
 * tocan los 792 mapas que comparten el tileset 1.
 *
 * Nada de esto edita contenido existente: los mapas, los tilesets y las
 * imágenes son nuevos, y de los mapas existentes sólo se tocan los eventos
 * cuyo nombre empieza por el marcador de este instalador.
 *
 * Uso:
 *   node --max-old-space-size=6144 tools/apply_dlc_regiones.mjs
 *   node --max-old-space-size=6144 tools/apply_dlc_regiones.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, GAME, ROOT, S, cmd, condition, endEvent, event, eventsOf, graphic,
  installMapInfos, iv, makeChecker, mapFile, marshalDump, marshalLoad,
  page, pagesOf, spread, texts, tint, transfer, upsert, wait,
} from "./lib/dlc_helpers.mjs";
import { celdasLibres } from "./lib/dimension_builder.mjs";
import {
  auditar, clonarTileset, construir, publicar, reparar, trazar,
} from "./lib/region_builder.mjs";
import { CAPAS, escribirPNG } from "./lib/png.mjs";
import { RSymbol } from "../web/js/marshal.js";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "dlc_regiones.json"), "utf8"));
const BACKUP = "dlc_regiones";
const MARK = PLAN.marcador;
const FOG_DIR = path.join(GAME, "Graphics", "Fogs");

/** Viaje con fundido: fundido a negro, transferencia y fundido de vuelta. */
const viaje = (mapId, x, y, indent = 0) => [
  tint(-255, -255, -255, 0, 6, indent),
  wait(8, indent),
  transfer(mapId, x, y, 2, indent),
  tint(0, 0, 0, 0, 6, indent),
  endEvent(indent),
];

/* ─────────────────────────────── la niebla ──────────────────────────────── */

function instalarNieblas() {
  const escritas = [];
  for (const [nombre, spec] of Object.entries(PLAN.nieblas)) {
    const generar = CAPAS[spec.capa];
    if (!generar) throw new Error(`capa de niebla desconocida: ${spec.capa}`);
    const imagen = generar(640, 480, { semilla: spec.semilla ?? 1, ...spec.opciones });
    const ruta = path.join(FOG_DIR, `${nombre}.png`);
    escribirPNG(ruta, imagen.w, imagen.h, imagen.rgba);
    escritas.push({ nombre, ruta: path.relative(ROOT, ruta) });
  }
  return escritas;
}

/* ──────────────────────────── mapas y fichas ───────────────────────────── */

function instalarTilesets() {
  const nieblaDe = (clave) => {
    const spec = PLAN.nieblas[clave];
    return { nombre: clave, opacidad: spec.opacidad, zoom: spec.zoom, sx: spec.sx, sy: spec.sy, mezcla: 0, hue: 0 };
  };
  return PLAN.tilesets.map((t) => ({
    ...t,
    resultado: clonarTileset(t.origen, t.id, {
      niebla: t.niebla ? nieblaDe(t.niebla) : null,
      dirName: BACKUP,
    }),
  }));
}

function construirMapas() {
  const construidos = new Map();
  for (const espec of PLAN.mapas) {
    const { canvas, traza, materiales } = construir(espec);
    publicar(espec.mapId, espec.titulo, canvas, { bgm: espec.bgm ?? "", encounterStep: 25 });
    construidos.set(espec.mapId, { espec, traza, materiales, canvas });
  }
  return construidos;
}

/**
 * Metadatos por mapa, clonando los del donante para que el fondo de combate y
 * las músicas de batalla sean las que ya corresponden a ese tipo de escenario.
 */
function instalarMetadatos(construidos) {
  const archivo = path.join(DATA, "map_metadata.dat");
  const meta = marshalLoad(fs.readFileSync(archivo));
  const dir = path.join(GAME, "PokeModBackups", BACKUP);
  fs.mkdirSync(dir, { recursive: true });
  const respaldo = path.join(dir, "map_metadata.dat");
  if (!fs.existsSync(respaldo)) fs.copyFileSync(archivo, respaldo);

  for (const { espec } of construidos.values()) {
    const donante = meta.pairs.find(([k]) => Number(k) === Number(espec.donante));
    let objeto;
    if (donante) {
      objeto = new (donante[1].constructor)(donante[1].className, donante[1].ivars.map(([k, v]) => [k, v]));
    } else {
      objeto = new (Object.getPrototypeOf(meta.pairs[0][1]).constructor)("GameData::MapMetadata", []);
    }
    objeto.setIvar("@id", Number(espec.mapId));
    objeto.setIvar("@outdoor_map", !!espec.exterior);
    objeto.setIvar("@announce_location", !!espec.anunciar);
    objeto.setIvar("@can_bicycle", !!espec.exterior);
    objeto.setIvar("@dark_map", !!espec.oscuro);
    objeto.setIvar("@safari_map", !!espec.safari);
    objeto.setIvar("@snap_edges", true);
    if (espec.clima && espec.clima !== "None") objeto.setIvar("@weather", new RSymbol(espec.clima));
    else objeto.setIvar("@weather", null);

    const entrada = meta.pairs.find(([k]) => Number(k) === Number(espec.mapId));
    if (entrada) entrada[1] = objeto;
    else meta.pairs.push([Number(espec.mapId), objeto]);
  }
  fs.writeFileSync(archivo, Buffer.from(marshalDump(meta)));
}

function instalarFichas() {
  installMapInfos(
    PLAN.mapas.map((m) => ({ mapId: m.mapId, title: m.titulo, parentId: m.padre ?? 0, order: 910 })),
    BACKUP,
  );
}

/* ──────────────────────────────── eventos ──────────────────────────────── */

/**
 * Celda de llegada de un mapa. Si se acaba de construir, se reutiliza; si
 * sólo se está verificando, se recalcula trazando la planta otra vez, que es
 * determinista y no necesita pintar nada.
 */
function llegadaDe(mapId, construidos) {
  const propio = construidos.get(mapId);
  if (propio) return propio.traza.llegada;
  const espec = PLAN.mapas.find((m) => m.mapId === mapId);
  if (espec) {
    const semilla = espec.semilla ?? 1;
    const traza = reparar(
      trazar(espec.arquetipo, espec.ancho ?? (espec.interior ? 20 : 37), espec.alto ?? (espec.interior ? 15 : 25), { ...espec, semilla }),
      semilla,
    );
    return traza.llegada;
  }
  return [2, 2];
}

function instalarRutas(construidos) {
  const porMapa = new Map();
  const anadir = (mapId, fabrica) => {
    if (!porMapa.has(mapId)) porMapa.set(mapId, []);
    porMapa.get(mapId).push(fabrica);
  };

  for (const ruta of PLAN.rutas) {
    const tituloDestino = tituloDe(ruta.a);
    const destino = tituloDe(ruta.de);
    anadir(ruta.de, (celda, id) => event(id, `${MARK} Puerta — ${ruta.nombre}`, celda[0], celda[1], [
      page({
        trigger: 1,
        list: [...texts(ruta.texto ?? [`${ruta.nombre}.`]), ...viaje(ruta.a, ...llegadaDe(ruta.a, construidos))],
      }),
    ]));
    anadir(ruta.a, (celda, id) => event(id, `${MARK} Salida — ${destino}`, celda[0], celda[1], [
      page({ trigger: 1, list: [...viaje(ruta.de, ...llegadaDe(ruta.de, construidos))] }),
    ]));
    void tituloDestino;
  }

  // Los pobladores se cuelgan del mapa que les toca.
  for (const p of PLAN.pobladores ?? []) {
    anadir(p.mapa, (celda, id) => event(id, `${MARK} ${p.nombre}`, celda[0], celda[1], [
      page({
        gfx: graphic(p.sprite, 2, 1, {}),
        list: [...texts(p.lineas), endEvent()],
      }),
    ]));
  }

  const colocados = [];
  for (const [mapId, fabricas] of porMapa) {
    upsert(mapId, [MARK], () => [], BACKUP);
    const celdas = spread(celdasLibres(mapId), fabricas.length);
    upsert(mapId, [MARK], (nextId) => {
      let id = nextId;
      return fabricas.map((fabrica, i) => fabrica(celdas[i] ?? celdas[0], id++));
    }, BACKUP);
    colocados.push({ mapId, eventos: fabricas.length });
  }
  return colocados;
}

const tituloDe = (mapId) => PLAN.mapas.find((m) => m.mapId === mapId)?.titulo ?? `Map${mapId}`;

/**
 * Sala de Comunicaciones: la alarma roja late. Un PNG no puede latir, así que
 * el pulso lo da un evento en paralelo moviendo la opacidad de la niebla
 * (comando 206). Son diez latidos y se detiene: RMXP no tiene bucle de
 * eventos y un proceso paralelo que no acaba es una receta para el desastre.
 */
function instalarAlarma() {
  const salas = PLAN.mapas.filter((m) => m.alarma);
  for (const sala of salas) {
    const lista = [];
    for (let i = 0; i < 10; i++) {
      lista.push(cmd(206, [88, 8], 0));   // subir la opacidad
      lista.push(wait(14, 0));
      lista.push(cmd(206, [46, 8], 0));   // bajarla
      lista.push(wait(14, 0));
    }
    lista.push(endEvent(0));
    upsert(sala.mapId, [`${MARK} Alarma`], (nextId) => [
      event(nextId, `${MARK} Alarma`, 1, 1, [
        page({ cond: condition(), trigger: 4, list: lista }),
      ]),
    ], BACKUP);
  }
  return salas.map((s) => s.mapId);
}

/* ───────────────────────────── verificación ────────────────────────────── */

function verify(construidos = new Map()) {
  const check = makeChecker("Regiones del DLC");

  // — las capas de niebla existen y son PNG válidos
  for (const nombre of Object.keys(PLAN.nieblas)) {
    const ruta = path.join(FOG_DIR, `${nombre}.png`);
    check.ok(fs.existsSync(ruta), `falta la capa de niebla ${nombre}.png`);
    if (fs.existsSync(ruta)) {
      const bytes = fs.readFileSync(ruta);
      check.ok(bytes.length > 100 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        `${nombre}.png no es un PNG válido`);
    }
  }

  // — los tilesets clonados conservan la pasabilidad del original
  const ts = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  for (const t of PLAN.tilesets) {
    const clon = ts[t.id];
    check.ok(!!clon, `falta el tileset ${t.id}`);
    if (!clon) continue;
    const original = ts[t.origen];
    check.ok(Buffer.compare(
      Buffer.from(clon.getIvar("@terrain_tags").bytes),
      Buffer.from(original.getIvar("@terrain_tags").bytes),
    ) === 0, `el tileset ${t.id} no conserva la pasabilidad del ${t.origen}`);
    if (t.niebla) {
      const esperado = String(t.niebla);
      const nombre = clon.getIvar("@fog_name");
      check.ok(String(nombre?.text ?? nombre ?? "") === esperado,
        `el tileset ${t.id} no lleva la niebla ${esperado}`);
      check.ok(Number(clon.getIvar("@fog_opacity")) === PLAN.nieblas[t.niebla].opacidad,
        `el tileset ${t.id} no tiene la opacidad de niebla esperada`);
    }
  }

  // — los mapas existen, suenan y pasan el filtro de los tres departamentos
  for (const espec of PLAN.mapas) {
    check.ok(fs.existsSync(path.join(DATA, mapFile(espec.mapId))), `falta Map${espec.mapId}`);
    const bruto = marshalLoad(fs.readFileSync(path.join(DATA, mapFile(espec.mapId))));
    const nombre = iv(iv(bruto, "@bgm"), "@name");
    const texto = typeof nombre === "string" ? nombre : nombre?.text ?? "";
    check.ok(texto === (espec.bgm ?? ""), `Map${espec.mapId} no suena ${espec.bgm} (tiene «${texto}»)`);
    check.ok(fs.existsSync(path.join(GAME, "Audio", "BGM", espec.bgm)),
      `la música ${espec.bgm} del Map${espec.mapId} no existe en Audio/BGM`);
    check.ok(Number(iv(bruto, "@tileset_id")) === espec.tileset,
      `Map${espec.mapId} no usa el tileset ${espec.tileset}`);

    auditar(check, espec.mapId, {
      titulo: espec.titulo,
      llegada: llegadaDe(espec.mapId, construidos),
      eventosInstalados: true,
      minimoTransitable: espec.arquetipo === "cueva" ? 0.28 : 0.25,
    });
  }

  // — los dos sentidos de cada ruta, y que ambos transfieran de verdad
  for (const ruta of PLAN.rutas) {
    const ida = eventsOf(ruta.de).find((e) => e.name === `${MARK} Puerta — ${ruta.nombre}`);
    check.ok(!!ida, `falta la puerta «${ruta.nombre}» en el Map${ruta.de}`);
    if (ida) {
      check.ok(pagesOf(ida)[0].list.some((c) => c.code === 201 && Number(c.params[1]) === ruta.a),
        `la puerta «${ruta.nombre}» no lleva al Map${ruta.a}`);
    }
    const vuelta = eventsOf(ruta.a).find((e) => e.name === `${MARK} Salida — ${tituloDe(ruta.de)}`);
    check.ok(!!vuelta, `falta la salida de vuelta al Map${ruta.de} desde el Map${ruta.a}`);
    if (vuelta) {
      check.ok(pagesOf(vuelta)[0].list.some((c) => c.code === 201 && Number(c.params[1]) === ruta.de),
        `la salida del Map${ruta.a} no vuelve al Map${ruta.de}`);
    }
  }

  // — los pobladores
  for (const p of PLAN.pobladores ?? []) {
    check.ok(eventsOf(p.mapa).some((e) => e.name === `${MARK} ${p.nombre}`),
      `falta el poblador «${p.nombre}» en el Map${p.mapa}`);
  }

  // — la alarma
  for (const sala of PLAN.mapas.filter((m) => m.alarma)) {
    const alarma = eventsOf(sala.mapId).find((e) => e.name === `${MARK} Alarma`);
    check.ok(!!alarma, `Map${sala.mapId}: falta la alarma`);
    if (alarma) {
      const lista = pagesOf(alarma)[0].list;
      check.ok(lista.filter((c) => c.code === 206).length >= 10,
        `Map${sala.mapId}: la alarma no late (hacen falta diez cambios de opacidad)`);
    }
  }

  check.done();
}

/* ──────────────────────────────── main ──────────────────────────────────── */

if (VERIFY_ONLY) {
  verify();
} else {
  const nieblas = instalarNieblas();
  const tilesets = instalarTilesets();
  const construidos = construirMapas();
  instalarFichas();
  instalarMetadatos(construidos);
  const rutas = instalarRutas(construidos);
  const alarmas = instalarAlarma();

  console.log(`✔ Regiones del DLC instaladas`);
  console.log(`  · capas de profundidad: ${nieblas.length} (${nieblas.map((n) => n.nombre).join(", ")})`);
  console.log(`  · tilesets nuevos: ${tilesets.map((t) => `${t.id}←${t.origen}${t.resultado.creado ? " (nuevo)" : " (actualizado)"}`).join(", ")}`);
  console.log(`  · mapas: ${construidos.size}`);
  for (const { espec, traza, materiales } of construidos.values()) {
    console.log(`      Map${espec.mapId} ${traza.width}×${traza.height} ${espec.arquetipo.padEnd(9)} ts${espec.tileset} ← donante ${espec.donante} · familia [${materiales.fuentes.join(",")}]`);
  }
  console.log(`  · rutas de ida y vuelta: ${PLAN.rutas.length}`);
  console.log(`  · pobladores: ${(PLAN.pobladores ?? []).length} en ${rutas.length} mapas`);
  console.log(`  · salas con alarma: ${alarmas.length}`);
  verify(construidos);
}
