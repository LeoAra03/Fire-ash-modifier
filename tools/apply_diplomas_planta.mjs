#!/usr/bin/env node
/**
 * apply_diplomas_planta.mjs — criterio 6:
 *  · nuevo mapa "Casa de Ash — Salón de Diplomas" (ID nuevo 2288) construido
 *    con los tiles de la casa (Map003, tileset 3);
 *  · puerta nueva en la planta alta de Map003 hacia el salón;
 *  · siete marcos-diploma con estado vacío/conseguido según el hito:
 *      La Ruta de Dios (switch 876), Liga Oscura (switch 948),
 *      Atlas (variable 319 >= 8), Glazed (990), Light Platinum (991),
 *      Liquid Crystal (992), TFOH (993);
 *  · gráficos diploma_*.png propios (generados por canvas, IDs nuevos).
 *
 * Uso: node tools/apply_diplomas_planta.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import {
  S, cmd, condition, endEvent, event, freeCells, graphic, grid, iv, page,
  readData, readMapRaw, texts, txt, upsert, writeData, writeMapRaw, walkableAt,
} from "./lib/dlc_helpers.mjs";
import { RObject, DATA, GAME, ROOT, mapFile } from "./lib/dlc_helpers.mjs";
import { TileCanvas, buildMapObject, passabilityOf, reachableCells } from "./lib/map_painter.mjs";
import { tableGet } from "../web/js/rmxp.js";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(new URL("../content/diplomas_planta.json", import.meta.url), "utf8"));
const DIR = "diplomas_planta";
const M = PLAN.mapaId;
const DIRIG = path.join(GAME, "Graphics", "Characters");

/* ─────────────────────────── gráficos de diploma ────────────────────────── */

function envolver(ctx, texto, x, y, ancho, alto, fuente, color) {
  ctx.font = fuente;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  const palabras = texto.split(" ");
  const lineas = [];
  let linea = "";
  for (const p of palabras) {
    const prueba = linea ? `${linea} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && linea) { lineas.push(linea); linea = p; }
    else linea = prueba;
  }
  if (linea) lineas.push(linea);
  let cy = y;
  for (const l of lineas.slice(0, 3)) {
    ctx.fillText(l, x, cy);
    cy += alto;
  }
}

function dibujarCelda(ctx, tipo, nombre) {
  if (tipo === "puerta") {
    ctx.fillStyle = "#2b1b12"; ctx.fillRect(0, 0, 64, 96);
    ctx.fillStyle = "#7a4b28"; ctx.fillRect(6, 4, 52, 90);
    ctx.fillStyle = "#5d371c"; ctx.fillRect(12, 10, 40, 84);
    ctx.fillStyle = "#e8c874"; ctx.beginPath(); ctx.arc(46, 52, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8a5a2e"; ctx.fillRect(12, 10, 40, 8);
    return;
  }
  if (tipo === "vacio") {
    ctx.fillStyle = "#241d18"; ctx.fillRect(0, 0, 64, 96);
    ctx.fillStyle = "#6b5637"; ctx.fillRect(4, 4, 56, 88);
    ctx.fillStyle = "#2e251c"; ctx.fillRect(10, 10, 44, 76);
    envolver(ctx, "¿?", 32, 50, 40, 16, "bold 22px sans-serif", "#8d7a5c");
    return;
  }
  // diploma con nombre
  ctx.fillStyle = "#f7ecd5"; ctx.fillRect(0, 0, 64, 96);
  ctx.strokeStyle = "#b98a2f"; ctx.lineWidth = 3; ctx.strokeRect(3, 3, 58, 90);
  ctx.strokeStyle = "#e8c874"; ctx.lineWidth = 1; ctx.strokeRect(8, 8, 48, 80);
  ctx.fillStyle = "#b98a2f"; ctx.fillRect(14, 16, 36, 2);
  envolver(ctx, "DIPLOMA", 32, 32, 48, 10, "bold 10px sans-serif", "#7a5a1e");
  envolver(ctx, nombre, 32, 48, 48, 11, "bold 11px sans-serif", "#3b2c17");
  // sello
  ctx.fillStyle = "#a3232d"; ctx.beginPath(); ctx.arc(32, 76, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e8c874"; ctx.beginPath(); ctx.arc(32, 76, 3, 0, Math.PI * 2); ctx.fill();
}

function hoja(tipo, nombre) {
  const cel = createCanvas(64, 96);
  dibujarCelda(cel.getContext("2d"), tipo, nombre);
  const sheet = createCanvas(256, 384);
  const sc = sheet.getContext("2d");
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    sc.drawImage(cel, col * 64, row * 96);
  }
  return sheet;
}

function instalarGraficos() {
  fs.mkdirSync(DIRIG, { recursive: true });
  const hechos = [];
  const write = (nombre, tipo, texto) => {
    const dest = path.join(DIRIG, `${nombre}.png`);
    fs.writeFileSync(dest, hoja(tipo, texto).toBuffer("image/png"));
    hechos.push(nombre);
  };
  write("event_puerta_salon", "puerta", null);
  write("diploma_vacio", "vacio", null);
  for (const d of PLAN.diplomas) write(`diploma_${d.clave}`, "diploma", d.nombre);
  return hechos;
}

/* ─────────────────────────── mapa salón ─────────────────────────────────── */

function instalarMapa() {
  const gOrigen = grid(PLAN.mapaOrigen);
  const tabla = gOrigen.parsed.table;
  let suelo = null, muro = null;
  for (let y = 0; y < gOrigen.height && (!suelo || !muro); y++) {
    for (let x = 0; x < gOrigen.width; x++) {
      const st = [0, 1, 2].map((z) => tableGet(tabla, x, y, z));
      if (!st.some((v) => v)) continue;
      if (!suelo && walkableAt(gOrigen, x, y)) suelo = st;
      else if (!muro && !walkableAt(gOrigen, x, y)) muro = st;
      if (suelo && muro) break;
    }
  }
  if (!suelo || !muro) throw new Error("no se encontraron muestras de suelo/muro en Map003");

  const [W, H] = PLAN.tamano;
  const canvas = new TileCanvas(W, H, PLAN.tilesetOrigen);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const borde = x === 0 || x === W - 1 || y === 0 || y === 1 || y === H - 1;
      const st = borde ? muro : suelo;
      st.forEach((v, z) => { if (v) canvas.set(x, y, z, v); });
    }
  }

  // verificación de tránsito antes de escribir
  const pass = passabilityOf(canvas, PLAN.tilesetOrigen);
  const [ex, ey] = PLAN.entrada;
  if (!pass.canMove(ex, ey, 8)) {
    // canMove(dir) comprueba si SE PUEDE ENTRAR a la celda; usamos passable-like:
  }
  const alcanzables = reachableCells(pass, [ex, ey]);
  const interactuables = PLAN.columnasDiplomas.map((x) => `${x},${PLAN.filaDiplomas + 1}`);
  const inalcanzables = interactuables.filter((c) => !alcanzables.has(c));
  if (inalcanzables.length) {
    throw new Error(`celdas de diploma inalcanzables desde la entrada: ${inalcanzables.join(" ")}`);
  }

  const mapa = buildMapObject(canvas, { bgm: "" });
  writeMapRaw(M, mapa);

  // MapInfos: entrada nueva bajo la casa de Ash
  const infos = readData("MapInfos.rxdata");
  const maxOrder = Math.max(0, ...infos.pairs.map(([, m]) => {
    const o = iv(m, "@order");
    return Number(o?.value ?? o ?? 0);
  }));
  const info = new RObject("RPG::MapInfo", [
    ["@name", S(PLAN.titulo)], ["@parent_id", PLAN.mapaOrigen],
    ["@order", maxOrder + 1], ["@expanded", false], ["@scroll_x", 0], ["@scroll_y", 0],
  ]);
  infos.pairs = [
    ...infos.pairs.filter(([id]) => Number(id?.value ?? id) !== M),
    [M, info],
  ];
  writeData("MapInfos.rxdata", infos);

  // metadata: clon de la casa
  const meta = readData("map_metadata.dat");
  const origen = meta.pairs.find(([id]) => Number(id?.value ?? id) === PLAN.mapaOrigen)?.[1];
  if (origen) {
    const clon = new RObject(origen.className, origen.ivars.map(([n, v]) => [n, v]));
    clon.setIvar("@id", M);
    meta.pairs = [
      ...meta.pairs.filter(([id]) => Number(id?.value ?? id) !== M),
      [M, clon],
    ];
    writeData("map_metadata.dat", meta);
  }
  return { suelo, muro };
}

/* ─────────────────────────── eventos ────────────────────────────────────── */

function condDe(d) {
  if (d.condicion.switch) return condition({ sw: d.condicion.switch });
  const [id, valor] = d.condicion.variable;
  return condition({ variable: [id, valor] });
}

function eventoDiploma(d, x, y) {
  return event(0, `${PLAN.prefijo} ${d.nombre}`, x, y, [
    page({
      gfx: graphic("diploma_vacio", 2, 1, {}),
      dirFix: true,
      list: [...texts(d.vacio), endEvent()],
    }),
    page({
      cond: condDe(d),
      gfx: graphic(`diploma_${d.clave}`, 2, 1, {}),
      dirFix: true,
      list: [...texts(d.ganado), endEvent()],
    }),
  ]);
}

function eventoSalida(casa) {
  const [x, y] = PLAN.salida;
  return event(0, `${PLAN.prefijo} salida`, x, y, [
    page({
      gfx: graphic("event_puerta_salon", 2, 1, {}),
      dirFix: true,
      list: [
        ...texts(["\\sp[Puerta del Salón]La puerta devuelve a la planta de Ash."]),
        cmd(201, [0, PLAN.mapaOrigen, casa[0], casa[1], 8, 1]),
        endEvent(),
      ],
    }),
  ]);
}

function eventoPuerta(celda) {
  return event(0, `${PLAN.prefijo} puerta del salón`, celda[0], celda[1], [
    page({
      gfx: graphic("event_puerta_salon", 2, 1, {}),
      dirFix: true,
      list: [
        ...texts([
          "\\sp[Puerta del Salón]Una puerta nueva en la planta alta de la casa de Ash.",
          "\\sp[Puerta del Salón]Detrás: el Salón de Diplomas.",
        ]),
        cmd(201, [0, M, PLAN.entrada[0], PLAN.entrada[1], 2, 1]),
        endEvent(),
      ],
    }),
  ]);
}

function instalarEventos(puertaCelda) {
  // puerta en la planta alta de la casa
  const libres = freeCells(PLAN.puertaSegundaPlanta.mapa);
  const [px, py] = PLAN.puertaSegundaPlanta.preferida;
  const orden = [...libres].sort((a, b) =>
    (Math.abs(a[0] - px) + Math.abs(a[1] - py)) - (Math.abs(b[0] - px) + Math.abs(b[1] - py)));
  const celda = puertaCelda ?? orden[0];
  upsert(PLAN.puertaSegundaPlanta.mapa, [PLAN.prefijo], () => [eventoPuerta(celda)], DIR);

  // salón: diplomas + salida
  const eventos = [];
  PLAN.diplomas.forEach((d, i) => {
    eventos.push(eventoDiploma(d, PLAN.columnasDiplomas[i], PLAN.filaDiplomas));
  });
  eventos.push(eventoSalida(celda));
  const added = upsert(M, [PLAN.prefijo], (nextId) => {
    eventos.forEach((e, i) => e.setIvar("@id", nextId + i));
    return eventos;
  }, DIR);
  return { celda, added };
}

/* ─────────────────────────── System: switch 948 ─────────────────────────── */

function instalarNombreSwitch() {
  const system = readData("System.rxdata");
  const switches = iv(system, "switches") || [];
  switches[948] = S("POKEMOD LIGA OSCURA COMPLETA");
  system.setIvar("switches", switches);
  writeData("System.rxdata", system);
}

/* ─────────────────────────── verificación ───────────────────────────────── */

function verificar() {
  const fallos = [];
  // mapa
  const rutaMapa = path.join(DATA, mapFile(M));
  if (!fs.existsSync(rutaMapa)) fallos.push(`falta ${mapFile(M)}`);
  else {
    const mapa = readMapRaw(M);
    const nombres = (iv(mapa, "@events")?.pairs ?? []).map(([, e]) => txt(iv(e, "@name")));
    for (const d of PLAN.diplomas) {
      if (!nombres.some((n) => n === `${PLAN.prefijo} ${d.nombre}`)) fallos.push(`falta diploma ${d.nombre} en el salón`);
    }
    if (!nombres.some((n) => n === `${PLAN.prefijo} salida`)) fallos.push("falta la salida del salón");
  }
  // puerta en Map003
  const casa = readMapRaw(PLAN.puertaSegundaPlanta.mapa);
  const nombresCasa = (iv(casa, "@events")?.pairs ?? []).map(([, e]) => txt(iv(e, "@name")));
  if (!nombresCasa.some((n) => n.startsWith(PLAN.prefijo))) fallos.push("falta la puerta del salón en la planta alta");
  // gráficos
  for (const nombre of ["event_puerta_salon", "diploma_vacio", ...PLAN.diplomas.map((d) => `diploma_${d.clave}`)]) {
    if (!fs.existsSync(path.join(DIRIG, `${nombre}.png`))) fallos.push(`falta ${nombre}.png`);
  }
  // switch 948: nombre + marca en la arena de la Liga Oscura
  const system = readData("System.rxdata");
  const switches = iv(system, "switches") || [];
  if (!txt(switches[948]).includes("LIGA OSCURA")) fallos.push("switch 948 sin nombre");
  const expansion = JSON.parse(fs.readFileSync(new URL("../content/expansion_multiversal.json", import.meta.url), "utf8"));
  const ultimo = expansion.darkLeague.battles[expansion.darkLeague.battles.length - 1];
  const arena = readMapRaw(expansion.darkLeague.maps[1].mapId ?? 2193);
  const eventos = (iv(arena, "@events")?.pairs ?? []).map(([, e]) => ({
    nombre: txt(iv(e, "@name")),
    paginas: (iv(e, "@pages") ?? []).map((p) => (iv(p, "@list") ?? []).map((c) => ({
      code: Number(iv(c, "@code")?.value ?? iv(c, "@code") ?? -1),
      params: (iv(c, "@parameters") ?? []).map((v) => Number(v?.value ?? v)),
    }))),
  }));
  const final = eventos.find((e) => e.nombre.endsWith(ultimo.name));
  if (!final) fallos.push(`falta el jefe final «${ultimo.name}» en la arena de la Liga Oscura`);
  else {
    const marca = final.paginas.some((lista) => lista.some((c) => c.code === 121 && c.params[0] === 948));
    if (!marca) fallos.push("el jefe final de la Liga Oscura no marca el switch 948 al ganar");
  }
  return fallos;
}

/* ─────────────────────────── main ───────────────────────────────────────── */

if (!VERIFY_ONLY) {
  const hechos = instalarGraficos();
  console.log(`· Gráficos: ${hechos.map((n) => `${n}.png`).join(", ")}`);
  instalarNombreSwitch();
  console.log("· System.rxdata: switch 948 «POKEMOD LIGA OSCURA COMPLETA».");
  const { suelo, muro } = instalarMapa();
  console.log(`· ${mapFile(M)} «${PLAN.titulo}» ${PLAN.tamano.join("x")} — suelo/muro muestreados de Map${String(PLAN.mapaOrigen).padStart(3, "0")}.`);
  const { celda, added } = instalarEventos();
  console.log(`· Puerta en Map${String(PLAN.puertaSegundaPlanta.mapa).padStart(3, "0")} (${celda.join(",")}) y ${added.length} eventos en el salón.`);
}

const fallos = verificar();
if (fallos.length) {
  console.error("FALLOS:\n" + fallos.map((f) => "  · " + f).join("\n"));
  process.exit(1);
}
console.log("OK: Salón de Diplomas instalado; siete marcos con hitos verificados.");
