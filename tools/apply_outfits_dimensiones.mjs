#!/usr/bin/env node
/**
 * apply_outfits_dimensiones.mjs — criterios 4+5:
 *  · sprites de Ash por dimensión (hojas ash_outfit_*.png construidas por
 *    tools/build_outfit_sheets.mjs desde assets_outfit/);
 *  · atavio automático al entrar a cada dimensión (sección PokeMod_Atavios);
 *  · vestidor en la casa de Ash (Map003) para cambiar de outfit a mano.
 *
 * Uso: node tools/apply_outfits_dimensiones.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createCanvas } from "@napi-rs/canvas";
import {
  backup, choice, choiceCase, choiceEnd, cmd, endEvent, event, freeCells, grid, graphic, page,
  readMapRaw, script, texts, txt, upsert, walkableAt, writeMapRaw,
} from "./lib/dlc_helpers.mjs";
import { DATA, GAME, ROOT, RObject, RString, marshalLoad, marshalDump } from "./lib/dlc_helpers.mjs";
import { readData, writeData, S, Sym, iv } from "./lib/dlc_helpers.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(new URL("../content/outfits_dimension.json", import.meta.url), "utf8"));
const TITULO = PLAN.seccionScripts.titulo;
const SECCION_ID = PLAN.seccionScripts.id;
const DIR = "atavios";
const RUBY = fs.readFileSync(new URL("./lib/pokemod_atavios.rb", import.meta.url), "utf8");
const SCRIPTS = [
  path.join(GAME, "Data", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Scripts.rxdata"),
];

/* ─────────────────────────── gráfico del armario ────────────────────────── */

function instalarGraficoArmario() {
  const cel = createCanvas(64, 96);
  const ctx = cel.getContext("2d");
  ctx.fillStyle = "#3b2415"; ctx.fillRect(0, 0, 64, 96);
  ctx.fillStyle = "#8a5a30"; ctx.fillRect(6, 4, 52, 90);
  ctx.fillStyle = "#6d4423"; ctx.fillRect(10, 8, 20, 82);
  ctx.fillRect(34, 8, 20, 82);
  ctx.fillStyle = "#e8c874";
  ctx.beginPath(); ctx.arc(27, 50, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(37, 50, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#c9a24a"; ctx.fillRect(10, 8, 44, 4);
  const sheet = createCanvas(256, 384);
  const sc = sheet.getContext("2d");
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) sc.drawImage(cel, col * 64, row * 96);
  const dest = path.join(GAME, "Graphics", "Characters", "event_armario.png");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, sheet.toBuffer("image/png"));
  return dest;
}

/* ─────────────────────────── sección de scripts ─────────────────────────── */

function inyectar(archivo) {
  const scripts = marshalLoad(fs.readFileSync(archivo));
  const comprimido = zlib.deflateSync(Buffer.from(RUBY, "utf-8"));
  const idx = scripts.findIndex(([, t]) => t && t.text === TITULO);
  if (idx >= 0) scripts[idx][2] = new RString(comprimido);
  else scripts.splice(scripts.length - 1, 0, [SECCION_ID, RString.fromText(TITULO), new RString(comprimido)]);
  fs.writeFileSync(archivo, Buffer.from(marshalDump(scripts)));
  return idx >= 0;
}

function respaldoSeccion(archivo) {
  const dir = path.join(GAME, "PokeModBackups", DIR);
  fs.mkdirSync(dir, { recursive: true });
  const bak = path.join(dir, path.basename(archivo) + "." + path.basename(path.dirname(archivo)));
  if (!fs.existsSync(bak)) fs.copyFileSync(archivo, bak);
}

/* ─────────────────────────── System.rxdata ──────────────────────────────── */

function instalarNombres() {
  const system = readData("System.rxdata");
  const variables = iv(system, "variables") || [];
  for (const [id, nombre] of Object.entries(PLAN.nombresVariables)) {
    variables[Number(id)] = S(nombre);
  }
  system.setIvar("variables", variables);
  writeData("System.rxdata", system);
}

/* ─────────────────────────── vestidor en Map003 ─────────────────────────── */

const plano = (x) => (Array.isArray(x) ? x.flat(Infinity) : [x]);

function elegir(opciones, indent = 0) {
  // opciones: [{ etiqueta, rama: (indent) => cmds }]
  return [
    choice(opciones.map((o) => o.etiqueta), indent),
    ...opciones.flatMap((o, i) => [
      choiceCase(i, o.etiqueta, indent),
      ...plano(o.rama(indent + 1)),
    ]),
    choiceEnd(indent),
  ];
}

function confirmar(frase, indent = 0) {
  return texts([`\\sp[Armario de Ash]${frase}`, "\\sp[Armario de Ash]Prueba a dar una vuelta. Se nota en el paso."], indent);
}

function vestirEvento() {
  const principales = PLAN.atavios.filter((a) => a.id <= 6);
  const ramaAtavio = (a) => (i) => [
    script(`PokeModAtavios.poner(${a.id}, false)`, i),
    ...confirmar(a.frase, i),
    cmd(0, [], i),
  ];
  return event(0, PLAN.vestidor.prefijo + " armario", CeldaVestidor[0], CeldaVestidor[1], [
    page({
      gfx: graphic("event_armario", 2, 1, {}),
      dirFix: true,
      list: [
        ...texts([
          "\\sp[Armario de Ash]El armario de Ash. Cuelgan los atavios de cada dimensión.",
          "\\sp[Armario de Ash]El atavio se pone solo al viajar; aquí puedes cambiarlo o fijarlo.",
        ]),
        ...elegir([
          ...principales.map((a) => ({ etiqueta: a.nombre, rama: ramaAtavio(a) })),
          {
            etiqueta: "Más atavios…",
            rama: (i) => [
              ...elegir([
                {
                  etiqueta: "Uniforme (chica)",
                  rama: (j) => [script("PokeModAtavios.poner(7, false)", j), ...confirmar(PLAN.atavios[7].frase, j), cmd(0, [], j)],
                },
                {
                  etiqueta: "Uniforme Rocket",
                  rama: (j) => [script("PokeModAtavios.poner(8, false)", j), ...confirmar(PLAN.atavios[8].frase, j), cmd(0, [], j)],
                },
                {
                  etiqueta: "Fijar este atavio",
                  rama: (j) => [
                    script("PokeModAtavios.modo(true)", j),
                    ...texts(["\\sp[Armario de Ash]Atavio fijado: no cambiará solo al viajar."], j),
                    cmd(0, [], j),
                  ],
                },
                {
                  etiqueta: "Atavio automático",
                  rama: (j) => [
                    script("PokeModAtavios.modo(false)", j),
                    script("PokeModAtavios.revisar", j),
                    ...texts(["\\sp[Armario de Ash]Modo automático: cada dimensión pondrá su atavio."], j),
                    cmd(0, [], j),
                  ],
                },
                {
                  etiqueta: "Nada por ahora",
                  rama: (j) => [...texts(["\\sp[Armario de Ash]Como quieras."], j), cmd(0, [], j)],
                },
              ], i),
              cmd(0, [], i),
            ],
          },
        ]),
        endEvent(),
      ],
    }),
  ]);
}

let CeldaVestidor = PLAN.vestidor.preferida;

function instalarVestidor() {
  const mapa = PLAN.vestidor.mapa;
  // planta baja solamente (x <= 15): el componente mayor puede ser el piso de arriba
  const g = grid(mapa);
  const [px, py] = PLAN.vestidor.preferida;
  const ocupadas = new Set(
    g.events.filter((e) => !e.name.startsWith(PLAN.vestidor.prefijo)).map((e) => `${e.x},${e.y}`)
  );
  const libres = [];
  for (let y = 1; y < g.height - 1; y++) {
    for (let x = 1; x <= 15; x++) {
      if (!walkableAt(g, x, y)) continue;
      if (ocupadas.has(`${x},${y}`)) continue;
      libres.push([x, y]);
    }
  }
  const key = (c) => Math.abs(c[0] - px) + Math.abs(c[1] - py);
  const celda = libres.sort((a, b) => key(a) - key(b))[0];
  if (!celda) throw new Error("no hay celda libre para el vestidor");
  CeldaVestidor = celda;
  const added = upsert(mapa, [PLAN.vestidor.prefijo], (nextId) => [vestirEvento()], DIR);
  return added;
}

/* ─────────────────────────── verificación ───────────────────────────────── */

function verificar() {
  const fallos = [];
  const marcas = [
    "module PokeModAtavios",
    "def self.poner",
    "def self.revisar",
    "pokemod_atavios_setup",
    "VAR_ATAVIO = 316",
    "VAR_MODO = 317",
  ];
  for (const archivo of SCRIPTS) {
    if (!fs.existsSync(archivo)) { fallos.push(`falta ${archivo}`); continue; }
    const scripts = marshalLoad(fs.readFileSync(archivo));
    const seccion = scripts.find(([, t]) => t && t.text === TITULO);
    if (!seccion) { fallos.push(`falta ${TITULO} en ${archivo}`); continue; }
    const ruby = zlib.inflateSync(Buffer.from(seccion[2].bytes)).toString("utf8");
    for (const m of marcas) if (!ruby.includes(m)) fallos.push(`sección sin la marca «${m}»`);
  }
  // charsets
  if (!fs.existsSync(path.join(GAME, "Graphics", "Characters", "event_armario.png"))) fallos.push("falta event_armario.png");
  for (const a of PLAN.atavios) {
    const p = path.join(GAME, "Graphics", "Characters", `${a.charset}.png`);
    if (!fs.existsSync(p)) fallos.push(`falta charset ${a.charset}.png`);
  }
  // nombres de variables
  const system = readData("System.rxdata");
  const variables = iv(system, "variables") || [];
  for (const [id, nombre] of Object.entries(PLAN.nombresVariables)) {
    const actual = txt(variables[Number(id)]);
    if (!actual.includes(nombre.slice(8, 24))) fallos.push(`variable ${id} sin nombre «${nombre}»`);
  }
  // vestidor
  const mapa = readMapRaw(PLAN.vestidor.mapa);
  const eventos = iv(mapa, "@events").pairs.map(([, e]) => txt(iv(e, "@name")));
  if (!eventos.some((n) => n.startsWith(PLAN.vestidor.prefijo))) fallos.push("falta el vestidor en Map003");
  return fallos;
}

/* ─────────────────────────── main ───────────────────────────────────────── */

if (!VERIFY_ONLY) {
  console.log(`· Gráfico: ${path.basename(instalarGraficoArmario())}`);
  for (const archivo of SCRIPTS) {
    if (!fs.existsSync(archivo)) { console.warn(`WARN: ${archivo} no existe; omitido.`); continue; }
    respaldoSeccion(archivo);
    const existia = inyectar(archivo);
    console.log(`· ${path.relative(ROOT, archivo)}: ${TITULO} ${existia ? "actualizado" : "inyectado"}.`);
  }
  instalarNombres();
  console.log(`· System.rxdata: nombres de variables ${Object.keys(PLAN.nombresVariables).join(", ")}.`);
  const eventos = instalarVestidor();
  console.log(`· Map003: vestidor en (${CeldaVestidor.join(",")}) — ${eventos.map((e) => `${e.name}@(${e.x},${e.y})`).join(", ")}`);
}

const fallos = verificar();
if (fallos.length) {
  console.error("FALLOS:\n" + fallos.map((f) => "  · " + f).join("\n"));
  process.exit(1);
}
console.log("OK: atavios por dimensión instalados; vestidor de la casa disponible.");
