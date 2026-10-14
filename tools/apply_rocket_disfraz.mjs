#!/usr/bin/env node
/**
 * apply_rocket_disfraz.mjs
 *
 * P6 · «Team Rocket = infiltración industrial: tuberías, luces rojas de alarma,
 * Ash con un disfraz del Team Rocket.»
 *
 * Este instalador monta las tres piezas que faltaban para que la dimensión del
 * Team Rocket se *juegue* como una infiltración y no como una visita guiada:
 *
 *   · **El disfraz.** metadata.dat gana una entrada de jugador nueva
 *     (`@player_D`, id 3) con el tipo de entrenador TEAMROCKET_M y el charset
 *     `trainer_TEAMROCKET_M`. `pbChangePlayer(3)` cambia a la vez la música y
 *     el sprite de combate (porque cambia el trainer type) y el charset del
 *     mundo. No se toca ni player_A ni player_B: es una entrada que estaba
 *     vacía, y el instalador se niega a escribir si algo la ocupa.
 *
 *   · **El polvo en suspensión.** La base (2220) y el Núcleo (2221) pasan a un
 *     clon del tileset 3 — el 179 — con la niebla `polvo_rocket`. El tileset 3
 *     original no se modifica, así que ningún mapa del juego base cambia.
 *
 *   · **La gente.** Dos intendentes reparten y recogen el uniforme, y dos
 *     centinelas reaccionan a si Ash lo lleva puesto. La variable 315 guarda
 *     el estado y se nombra en System.rxdata para poder depurarla.
 *
 * Uso:
 *   node tools/apply_rocket_disfraz.mjs
 *   node tools/apply_rocket_disfraz.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, marshalDump, RSymbol, RString } from "../web/js/marshal.js";
import { parseTileset } from "../web/js/rmxp.js";
import {
  DATA, ROOT, backup, choice, choiceCase, choiceEnd, condition, endEvent, event,
  eventsOf, graphic, makeChecker, page, pagesOf, place, script, texts, tint, varSet, wait,
} from "./lib/dlc_helpers.mjs";
import { clonarTileset } from "./lib/region_builder.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "rocket_disfraz.json"), "utf8"));
const MARK = PLAN.marcador;
const VAR = PLAN.variable;
const JUG = PLAN.jugador;
const DIR = "rocket_disfraz";
const plano = (lista) => lista.flat(Infinity).filter(Boolean);

/* ─────────────────────────── el disfraz ─────────────────────────── */

function instalarJugador() {
  backup(DIR, ["metadata.dat"]);
  const archivo = path.join(DATA, "metadata.dat");
  const datos = marshalLoad(fs.readFileSync(archivo));
  let global = null;
  for (const [clave, valor] of datos.pairs) {
    if ((clave?.name ?? String(clave)) === "0") { global = valor; break; }
  }
  if (!global) throw new Error("metadata.dat no tiene la entrada global (clave 0)");
  // [tipo de entrenador, andar, bici, surf, correr, buceo, pesca, pesca]
  const planeado = [
    new RSymbol(JUG.tipo),
    ...Array.from({ length: 7 }, () => RString.fromText(JUG.charset)),
  ];
  const antes = global.getIvar(JUG.ivan);
  if (antes !== null && antes !== undefined) {
    const esNuestro = Array.isArray(antes) && antes.length === 8
      && antes[0]?.name === JUG.tipo
      && antes.slice(1).every((valor) => textura(valor) === JUG.charset);
    if (!esNuestro) {
      throw new Error(`${JUG.ivan} ya estaba ocupado por contenido que no es de la expansión: no se sobreescribe.`);
    }
  }
  global.setIvar(JUG.ivan, planeado);
  fs.writeFileSync(archivo, Buffer.from(marshalDump(datos)));
}

function instalarNombreVariable() {
  backup(DIR, ["System.rxdata"]);
  const archivo = path.join(DATA, "System.rxdata");
  const sistema = marshalLoad(fs.readFileSync(archivo));
  const variables = sistema.getIvar("@variables");
  if (!variables) throw new Error("System.rxdata no tiene @variables");
  while (variables.length < VAR) variables.push(RString.fromText(""));
  variables[VAR - 1] = RString.fromText(PLAN.nombreVariable);
  fs.writeFileSync(archivo, Buffer.from(marshalDump(sistema)));
}

/* ─────────────────── la niebla de polvo industrial ─────────────────── */

function instalarNiebla() {
  const niebla = PLAN.niebla;
  const copia = clonarTileset(niebla.origen, niebla.nuevo, {
    nombre: {},
    niebla: {
      nombre: niebla.nombre,
      opacidad: niebla.opacidad,
      zoom: niebla.zoom,
      sx: niebla.sx,
      sy: niebla.sy,
      hue: 0,
      mezcla: 0,
    },
    dirName: DIR,
  });
  for (const mapId of niebla.mapas) {
    const nombre = `Map${String(mapId).padStart(3, "0")}.rxdata`;
    backup(DIR, [nombre]);
    const archivo = path.join(DATA, nombre);
    const mapa = marshalLoad(fs.readFileSync(archivo));
    mapa.setIvar("@tileset_id", niebla.nuevo);
    fs.writeFileSync(archivo, Buffer.from(marshalDump(mapa)));
  }
  return copia;
}

/* ───────────────────────────── los eventos ───────────────────────────── */

/** Fundido corto: Ash tarda lo suyo en cambiarse de ropa. */
const cuello = (dentro) => [
  tint(-255, -255, -255, 0, 6, 0),
  wait(8, 0),
  ...plano(dentro(0)),
  tint(0, 0, 0, 0, 6, 0),
];

/**
 * Las dos páginas del intendente. RPG XP elige la última página cuya condición
 * se cumple, así que la de «sin uniforme» va primero y la de «con uniforme»
 * después: en cuanto la variable vale 1, gana la segunda.
 */
function paginasIntendente(charset, extra) {
  const T = { ...PLAN.textos, ...(extra ?? {}) };
  return [
    page({
      cond: condition({ variable: [VAR, 0] }),
      gfx: graphic(charset),
      trigger: 0,
      list: [
        ...texts(T.ponerse, 0),
        choice(["Ponértelo", "Dejarlo donde está"], 0),
        choiceCase(0, "Ponértelo", 0),
        ...cuello(() => [
          texts(T.puesto, 1),
          script(`pbChangePlayer(${JUG.id})`, 1),
          varSet(VAR, 1, 1),
        ]),
        choiceCase(1, "Dejarlo donde está", 0),
        ...texts(T.rechazo, 1),
        choiceEnd(0),
        endEvent(0),
      ],
    }),
    page({
      cond: condition({ variable: [VAR, 1] }),
      gfx: graphic(charset),
      trigger: 0,
      list: [
        ...texts(T.yaPuesto, 0),
        choice(["Volver a tu ropa", "Seguir de uniforme"], 0),
        choiceCase(0, "Volver a tu ropa", 0),
        ...cuello(() => [
          texts(T.quitarse, 1),
          script("pbChangePlayer(0)", 1),
          varSet(VAR, 0, 1),
        ]),
        choiceCase(1, "Seguir de uniforme", 0),
        ...texts(T.seguirPuesto, 1),
        choiceEnd(0),
        endEvent(0),
      ],
    }),
  ];
}

function instalarIntendentes() {
  const hechos = [];
  for (const intendente of PLAN.intendentes) {
    const celda = place(
      intendente.mapa,
      [`${MARK}${intendente.nombre}`],
      intendente.pista,
      ([x, y], nextId) => event(
        nextId,
        `${MARK}${intendente.nombre}`,
        x,
        y,
        paginasIntendente(intendente.charset, PLAN.textos[intendente.textos]),
      ),
      DIR,
    );
    hechos.push({ mapa: intendente.mapa, nombre: intendente.nombre, celda });
  }
  return hechos;
}

function instalarCentinelas() {
  const hechos = [];
  for (const centinela of PLAN.centinelas) {
    const celda = place(
      centinela.mapa,
      [`${MARK}${centinela.nombre}`],
      [4, 4],
      ([x, y], nextId) => event(nextId, `${MARK}${centinela.nombre}`, x, y, [
        // Sin uniforme (sin condición): la base.
        page({
          cond: condition(),
          gfx: graphic(centinela.charset),
          trigger: 0,
          list: [...texts(centinela.sinDisfraz, 0), endEvent(0)],
        }),
        // Con uniforme: gana cuando la variable vale 1.
        page({
          cond: condition({ variable: [VAR, 1] }),
          gfx: graphic(centinela.charset),
          trigger: 0,
          list: [...texts(centinela.conDisfraz, 0), endEvent(0)],
        }),
      ]),
      DIR,
    );
    hechos.push({ mapa: centinela.mapa, nombre: centinela.nombre, celda });
  }
  return hechos;
}

/* ──────────────────────────── verificación ──────────────────────────── */

function entradaGlobal(datos) {
  for (const [clave, valor] of datos.pairs) {
    if ((clave?.name ?? String(clave)) === "0") return valor;
  }
  return null;
}
const textura = (valor) => String(valor?.text ?? valor ?? "");

function recogerNombres(valor, destino, profundidad = 0) {
  if (!valor || profundidad > 8) return;
  if (Array.isArray(valor)) { valor.forEach((x) => recogerNombres(x, destino, profundidad + 1)); return; }
  if (valor.pairs) {
    valor.pairs.forEach(([clave, v]) => {
      if (clave?.name) destino.add(clave.name);
      recogerNombres(v, destino, profundidad + 1);
    });
  }
}

function verificar() {
  const check = makeChecker("Disfraz del Team Rocket");

  // 1. La entrada de jugador nueva, intacta y completa.
  const datos = marshalLoad(fs.readFileSync(path.join(DATA, "metadata.dat")));
  const global = entradaGlobal(datos);
  check.ok(!!global, "metadata.dat no tiene la entrada global (clave 0)");
  const jugador = global?.getIvar(JUG.ivan);
  check.ok(Array.isArray(jugador) && jugador.length === 8,
    `metadata.dat no tiene ${JUG.ivan} con las 8 posiciones`);
  if (Array.isArray(jugador)) {
    check.ok(jugador[0]?.name === JUG.tipo,
      `${JUG.ivan}[0] debería ser :${JUG.tipo} y es ${jugador[0]?.name}`);
    for (let i = 1; i < 8; i++) {
      check.ok(textura(jugador[i]) === JUG.charset, `${JUG.ivan}[${i}] debería ser ${JUG.charset}`);
    }
  }
  // 2. El contenido original no se ha tocado.
  check.ok(global?.getIvar("@player_A")?.[0]?.name === "POKEMONTRAINER_Red",
    "@player_A ha cambiado: eso es contenido original");
  check.ok(!!global?.getIvar("@player_B"), "@player_B ha desaparecido");

  // 3. Existen el charset y el tipo de entrenador.
  const charset = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters", `${JUG.charset}.png`);
  check.ok(fs.existsSync(charset), `no existe el charset Graphics/Characters/${JUG.charset}.png`);
  const tipos = new Set();
  recogerNombres(marshalLoad(fs.readFileSync(path.join(DATA, "trainer_types.dat"))), tipos);
  check.ok(tipos.has(JUG.tipo), `no existe el tipo de entrenador :${JUG.tipo}`);

  // 4. La variable está nombrada.
  const sistema = marshalLoad(fs.readFileSync(path.join(DATA, "System.rxdata")));
  const variables = sistema.getIvar("@variables") ?? [];
  check.ok(textura(variables[VAR - 1]) === PLAN.nombreVariable,
    `la variable ${VAR} no se llama ${PLAN.nombreVariable}`);

  // 5. La niebla industrial: el clon la tiene, el original no.
  const bruto = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const ts = [...bruto].map((fila) => (fila ? parseTileset(fila) : null));
  const clon = ts[PLAN.niebla.nuevo];
  check.ok(!!clon, `no existe el tileset ${PLAN.niebla.nuevo}`);
  if (clon) {
    check.ok(clon.tilesetName === ts[PLAN.niebla.origen]?.tilesetName,
      `el tileset ${PLAN.niebla.nuevo} no usa el gráfico del ${PLAN.niebla.origen}`);
    check.ok(textura(clon.obj.getIvar("@fog_name")) === PLAN.niebla.nombre,
      `el tileset ${PLAN.niebla.nuevo} no tiene la niebla ${PLAN.niebla.nombre}`);
    check.ok(Number(clon.obj.getIvar("@fog_opacity")) === PLAN.niebla.opacidad,
      "la opacidad de la niebla industrial no coincide");
  }
  check.ok(textura(ts[PLAN.niebla.origen]?.obj.getIvar("@fog_name")) === "",
    "¡el tileset original ha cogido niebla! Eso tocaría contenido del juego base");
  for (const mapId of PLAN.niebla.mapas) {
    const mapa = marshalLoad(fs.readFileSync(path.join(DATA, `Map${String(mapId).padStart(3, "0")}.rxdata`)));
    check.ok(Number(mapa.getIvar("@tileset_id")) === PLAN.niebla.nuevo,
      `Map${mapId} no usa el tileset ${PLAN.niebla.nuevo}`);
  }

  // 6. Los intendentes: dos páginas, las dos con cambio de jugador, una vuelve.
  for (const intendente of PLAN.intendentes) {
    const encontrados = eventsOf(intendente.mapa).filter((ev) => ev.name === `${MARK}${intendente.nombre}`);
    check.ok(encontrados.length === 1,
      `Map${intendente.mapa}: se esperaba 1 «${intendente.nombre}» y hay ${encontrados.length}`);
    if (encontrados.length !== 1) continue;
    const paginas = pagesOf(encontrados[0]);
    check.ok(paginas.length === 2, `${intendente.nombre} debería tener 2 páginas y tiene ${paginas.length}`);
    const conScript = paginas.filter((p) => p.list.some((c) => Number(c.code) === 355));
    check.ok(conScript.length === 2, `${intendente.nombre}: las 2 páginas deben llamar a pbChangePlayer`);
    const ponerse = paginas.some((p) => p.list.some((c) => Number(c.code) === 355
      && new RegExp(`pbChangePlayer\\(${JUG.id}\\)`).test(textura(c.params?.[0]))));
    const volver = paginas.some((p) => p.list.some((c) => Number(c.code) === 355
      && /pbChangePlayer\(0\)/.test(textura(c.params?.[0]))));
    check.ok(ponerse, `${intendente.nombre}: ninguna página pone el uniforme`);
    check.ok(volver, `${intendente.nombre}: ninguna página devuelve a Ash a su ropa`);
  }

  // 7. Los centinelas: dos páginas con texto distinto según el uniforme.
  for (const centinela of PLAN.centinelas) {
    const encontrados = eventsOf(centinela.mapa).filter((ev) => ev.name === `${MARK}${centinela.nombre}`);
    check.ok(encontrados.length === 1,
      `Map${centinela.mapa}: se esperaba 1 «${centinela.nombre}» y hay ${encontrados.length}`);
    if (encontrados.length !== 1) continue;
    const paginas = pagesOf(encontrados[0]);
    check.ok(paginas.length === 2, `${centinela.nombre} debería tener 2 páginas y tiene ${paginas.length}`);
    const [base, uniformado] = paginas;
    check.ok(Number(base.condition?.getIvar("@variable_valid") ?? 1) === 0,
      `${centinela.nombre}: la primera página no debe tener condición`);
    check.ok(Number(uniformado.condition?.getIvar("@variable_id")) === VAR
      && Number(uniformado.condition?.getIvar("@variable_value")) === 1,
      `${centinela.nombre}: la segunda página debe depender de la variable ${VAR} = 1`);
    const lineas = (p) => p.list.filter((c) => Number(c.code) === 401).length;
    check.ok(lineas(base) >= 2 && lineas(uniformado) >= 2,
      `${centinela.nombre}: las dos páginas deberían tener texto`);
  }

  check.done();
  console.log(`✔ Disfraz del Team Rocket: verificación OK (${JUG.ivan}=:${JUG.tipo}/${JUG.charset}, `
    + `variable ${VAR} «${PLAN.nombreVariable}», niebla ${PLAN.niebla.nombre} sobre `
    + `${PLAN.niebla.mapas.length} mapas, ${PLAN.intendentes.length} intendentes, `
    + `${PLAN.centinelas.length} centinelas).`);
}

/* ──────────────────────────────── arranque ──────────────────────────────── */

if (!VERIFY_ONLY) {
  instalarJugador();
  instalarNombreVariable();
  const copia = instalarNiebla();
  const intendentes = instalarIntendentes();
  const centinelas = instalarCentinelas();
  console.log(`  · disfraz: ${JUG.ivan} = :${JUG.tipo} con charset ${JUG.charset}`);
  console.log(`  · variable ${VAR} («${PLAN.nombreVariable}»): 0 = tu ropa, 1 = uniforme`);
  console.log(`  · niebla industrial: tileset ${copia.nuevoId} (${copia.creado ? "creado" : "actualizado"})`
    + ` ← ${PLAN.niebla.origen} en los mapas ${PLAN.niebla.mapas.join(", ")}`);
  for (const hecho of [...intendentes, ...centinelas]) {
    console.log(`  · Map${hecho.mapa}: «${hecho.nombre}» en (${hecho.celda[0]}, ${hecho.celda[1]})`);
  }
  console.log(`  · respaldo en pokemon_fire_ash/PokeModBackups/${DIR}/`);
}
verificar();
