#!/usr/bin/env node
/**
 * verify_arceus_recursos.mjs — R12 · Auditoría de RECURSOS del duelo divino.
 *
 * Los otros verificadores prueban la lógica instalada; éste comprueba que todo
 * lo que el duelo NOMBRA exista de verdad en los archivos que se distribuyen:
 *   · movimientos (moves.dat) — pools de fase, Mil Brazos, Primigenia e
 *     invocaciones del lore;
 *   · especies (species.dat + sprite Front) — Arceus, invocaciones y aliados;
 *   · objetos (items.dat) — las 18 Tablas y la Poké Ball de la captura;
 *   · música (Audio/BGM) — las 7 pistas del duelo, una por fase + Primigenia;
 *   · sprites de personaje (Graphics/Characters) — Cynthia/Steven/Red/Gold/Volo;
 *   · archivos de animaciones presentes (el motor degrada con elegancia si una
 *     animación concreta no existe: fallback por tipo y luego salto silencioso).
 *
 * Método: los .dat de v19 son volcados Marshal cuya tabla de símbolos guarda
 * los IDs en texto plano; buscar el símbolo en el binario es una detección
 * fiable (con control negativo: un símbolo inventado NO debe aparecer).
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const GAME = path.join(ROOT, "pokemon_fire_ash");
const SCRIPTS = path.join(GAME, "Data", "Scripts.rxdata");

let ok = 0;
const fallos = [];
const avisos = [];
function check(cond, mensaje) {
  if (cond) ok += 1;
  else fallos.push(mensaje);
}
function warn(mensaje) { avisos.push(mensaje); }

// ---------------------------------------------------------------- secciones
const scripts = marshalLoad(fs.readFileSync(SCRIPTS));
function seccion(nombre) {
  const entrada = scripts.find(([, t]) => t && t.text === nombre);
  if (!entrada) throw new Error(`falta la sección ${nombre} en Scripts.rxdata`);
  return zlib.inflateSync(Buffer.from(entrada[2].bytes)).toString("utf8");
}
const ruta = seccion("PokeMod_RutaDeDios");
const canon = seccion("PokeMod_CanonArceus");
const ambas = ruta + "\n" + canon;

// ---------------------------------------------------------------- helpers
function datos(nombre) {
  const p = path.join(GAME, "Data", nombre);
  if (!fs.existsSync(p)) throw new Error(`falta Data/${nombre}`);
  return fs.readFileSync(p);
}
const movesDat = datos("moves.dat");
const speciesDat = datos("species.dat");
const itemsDat = datos("items.dat");

const FALSO = "ZZZ_SIMBOLO_INVENTADO_QA";
check(!movesDat.includes(FALSO) && !speciesDat.includes(FALSO) && !itemsDat.includes(FALSO),
  "control negativo: el detector de símbolos no da falsos positivos");

function existeMov(id) { return movesDat.includes(id); }
function existeEspecie(id) { return speciesDat.includes(id); }
function existeItem(id) { return itemsDat.includes(id); }

// ---------------------------------------------------------------- movimientos
function movimientosDe(nombreConstante) {
  const inicio = ambas.indexOf(nombreConstante + " =");
  if (inicio < 0) return [];
  const trozo = ambas.slice(inicio, inicio + 2200);
  return [...trozo.matchAll(/:([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]);
}
// MOVE_SETS es un arreglo de arreglos: tomar hasta su cierre balanceado
function moveSets() {
  const inicio = ambas.indexOf("RUTA_ARCEUS_MOVE_SETS =");
  if (inicio < 0) return [];
  let i = ambas.indexOf("[", inicio);
  let depth = 0;
  for (; i < ambas.length; i += 1) {
    if (ambas[i] === "[") depth += 1;
    else if (ambas[i] === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return [...ambas.slice(inicio, i + 1).matchAll(/:([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]);
}
const grupos = [
  ["pools por fase (RUTA_ARCEUS_MOVE_SETS)", moveSets()],
  ["Mil Brazos (fase Mega)", movimientosDe("RUTA_ARCEUS_MIL_BRAZOS")],
  ["Forma Primigenia", movimientosDe("RUTA_ARCEUS_PRIMIGENIA_MOVES")],
];
// 2) invocaciones del lore (segunda columna de la tabla)
{
  const inicio = ambas.indexOf("RUTA_ARCEUS_INVOCACIONES = [");
  if (inicio >= 0) {
    let i = ambas.indexOf("[", inicio);
    let depth = 0;
    for (; i < ambas.length; i += 1) {
      if (ambas[i] === "[") depth += 1;
      else if (ambas[i] === "]") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const filas = ambas.slice(inicio, i + 1).split("\n").filter((l) => l.includes("[:"));
    const movs = filas.map((l) => (l.match(/\[:[A-Z_]+,\s*:([A-Z_]+)/) || [])[1]).filter(Boolean);
    grupos.push(["invocaciones del lore", movs]);
  }
}
// 3) llamadas directas pbAnimation(:X)
grupos.push(["animaciones de movimientos citadas", [...ambas.matchAll(/pbAnimation\(:([A-Z][A-Z0-9_]*)/g)].map((m) => m[1])]);

const movsFaltantes = [];
let movsTotal = 0;
for (const [rotulo, lista] of grupos) {
  const unicos = [...new Set(lista)];
  movsTotal += unicos.length;
  for (const id of unicos) if (!existeMov(id)) movsFaltantes.push(`${rotulo}: ${id}`);
  check(unicos.length > 0, `el grupo de movimientos «${rotulo}» se extrajo de la sección instalada`);
}
check(movsFaltantes.length === 0,
  `todos los movimientos del duelo existen en moves.dat (${movsTotal} referencias)${movsFaltantes.length ? `; FALTAN: ${movsFaltantes.join(", ")}` : ""}`);

// ---------------------------------------------------------------- especies
// Arceus + invocaciones + aliados cinemáticos (todas las especies que el duelo
// pone en pantalla).
const especiesDuelo = new Set(["ARCEUS"]);
{
  const inicio = ambas.indexOf("RUTA_ARCEUS_INVOCACIONES = [");
  if (inicio >= 0) {
    const trozo = ambas.slice(inicio, inicio + 3000);
    for (const m of trozo.matchAll(/\[(:[A-Z_]+),/g)) especiesDuelo.add(m[1].slice(1));
  }
}
for (const m of ambas.matchAll(/pbArceusSummon\(battler, :([A-Z_]+)/g)) especiesDuelo.add(m[1]);
for (const m of ambas.matchAll(/pbArceusCinematicPokemon\(:([A-Z_]+)/g)) especiesDuelo.add(m[1]);
const espFaltantes = [];
const espSinSprite = [];
for (const sp of especiesDuelo) {
  if (!existeEspecie(sp)) espFaltantes.push(sp);
  else if (!fs.existsSync(path.join(GAME, "Graphics", "Pokemon", "Front", `${sp}.png`))) espSinSprite.push(sp);
}
check(espFaltantes.length === 0,
  `todas las especies del duelo existen en species.dat (${especiesDuelo.size})${espFaltantes.length ? `; FALTAN: ${espFaltantes.join(", ")}` : ""}`);
check(espSinSprite.length === 0,
  `todas las especies del duelo tienen sprite frontal${espSinSprite.length ? `; SIN SPRITE: ${espSinSprite.join(", ")}` : ""}`);
check(fs.readdirSync(path.join(GAME, "Graphics", "Pokemon", "Front")).filter((f) => f.startsWith("ARCEUS")).length >= 18,
  "las 18 formas de Arceus (una por Tabla + normal) tienen sprite frontal");

// ---------------------------------------------------------------- objetos
const tablas = [...ambas.matchAll(/:([A-Z]+PLATE)\b/g)].map((m) => m[1]);
const objetos = [...new Set([...tablas, "POKEBALL"])];
const objFaltantes = objetos.filter((id) => !existeItem(id));
check(objFaltantes.length === 0 && objetos.length >= 18,
  `las ${objetos.length} Tablas y la Poké Ball de la captura existen en items.dat${objFaltantes.length ? `; FALTAN: ${objFaltantes.join(", ")}` : ""}`);

// ---------------------------------------------------------------- música
const pistas = new Map();
{
  const inicio = ruta.indexOf("RUTA_ARCEUS_BGM_POR_FASE = {");
  const bloque = ruta.slice(inicio, ruta.indexOf("}", inicio) + 1);
  for (const m of bloque.matchAll(/=>\s*"([^"]+)"/g)) pistas.set(m[1], true);
  const prim = (ruta.match(/RUTA_ARCEUS_BGM_PRIMIGENIA = "([^"]+)"/) || [])[1];
  if (prim) pistas.set(prim, true);
}
const bgmDir = path.join(GAME, "Audio", "BGM");
const instaladas = new Set(fs.readdirSync(bgmDir).map((f) => f.replace(/\.[^.]+$/, "")));
const pistasFaltantes = [...pistas.keys()].filter((p) => !instaladas.has(p));
check(pistas.size >= 7 && pistasFaltantes.length === 0,
  `las ${pistas.size} pistas del duelo existen en Audio/BGM${pistasFaltantes.length ? `; FALTAN: ${pistasFaltantes.join(", ")}` : ""}`);

// ---------------------------------------------------------------- personajes
const personajes = [...new Set([...ambas.matchAll(/:(ARC_[A-Za-z]+|SECRET_[A-Za-z]+)/g)].map((m) => m[1]))];
const charsDir = path.join(GAME, "Graphics", "Characters");
const charsInstalados = fs.readdirSync(charsDir);
const charsFaltantes = personajes.filter((p) => !charsInstalados.some((f) => f.startsWith(p)));
check(personajes.length >= 4 && charsFaltantes.length === 0,
  `los ${personajes.length} sprites de personaje del prólogo existen en Graphics/Characters${charsFaltantes.length ? `; FALTAN: ${charsFaltantes.join(", ")}` : ""}`);

// ---------------------------------------------------------------- animaciones
// El motor degrada con elegancia: pbFindMoveAnimation busca la animación exacta,
// luego el default del tipo, y si nada existe pbAnimation retorna sin hacer
// nada (Scene_Animations:476-482). Aquí se exige que los ARCHIVOS estén y se
// avisa de lo que el juego no trae (para que nadie espere un destello que no
// existe).
check(fs.existsSync(path.join(GAME, "Data", "Animations.rxdata")) &&
  fs.existsSync(path.join(GAME, "Data", "move2anim.dat")),
  "los archivos de animaciones de batalla están instalados");
{
  const anims = fs.readFileSync(path.join(GAME, "Data", "Animations.rxdata"));
  const comunes = [...anims.toString("latin1").matchAll(/Common:[A-Za-z]+/g)].length;
  if (comunes === 0) {
    warn("el juego no trae animaciones «Common:» (clima, etc.): el motor las salta en silencio; el clima sigue funcionando a nivel mecánico");
  }
}

// ---------------------------------------------------------------- informe
console.log("Auditoría de recursos del duelo divino (R12)");
console.log(`  Juego auditado: ${GAME}`);
console.log(`  Movimientos: ${movsTotal} referencias · Especies: ${especiesDuelo.size} · Objetos: ${objetos.length} · Pistas: ${pistas.size} · Personajes: ${personajes.length}`);
console.log("");
for (const a of avisos) console.log(`  ⚠ ${a}`);
if (avisos.length) console.log("");
if (fallos.length) {
  for (const f of fallos) console.log(`  ✘ ${f}`);
  console.log(`\n✘ ${fallos.length} recursos faltantes de ${fallos.length + ok}.`);
  process.exit(1);
}
console.log(`\n✔ ${ok} comprobaciones de recursos: el duelo no nombra nada que el juego no tenga.`);
