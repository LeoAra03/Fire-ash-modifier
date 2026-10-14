#!/usr/bin/env node
/**
 * verify_arceus_recursos.mjs — R12/R15 · Auditoría de RECURSOS del duelo divino.
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
 * R15 añade dos auditorías estructurales después del error real que llegó a la
 * partida (NameError: uninitialized constant RUTA_ARCEUS_SEQUITO):
 *   · ALCANCE: ninguna constante RUTA_* y ARCEUS_* ni ningún método del duelo
 *     invocado desde el nivel superior puede quedar definido anidado dentro de
 *     una clase (Ruby los vuelve invisibles para Object y el juego lanza
 *     NameError/NoMethodError en cuanto el evento los toca);
 *   · TODOS LOS TIPOS: además de las tablas fijas, se barren las referencias
 *     genéricas (nextBattleBack, nextBattleBGM, pbBGMPlay, learn_move, item=,
 *     CpuBattle) y se exige que el Paquete_directo distribuya los mismos
 *     recursos que la carpeta del juego.
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
// 2b) séquito de la Orden Divina (R14): movimientos y especies del duelo doble
{
  const inicio = ambas.indexOf("RUTA_ARCEUS_SEQUITO = [");
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
    const trozo = ambas.slice(inicio, i + 1);
    const filas = trozo.split("\n").filter((l) => l.includes("[:"));
    grupos.push(["séquito de la Orden Divina",
      filas.flatMap((l) => {
        const inner = (l.match(/\[:[A-Z_]+,\s*\[([^\]]*)\]/) || [])[1] || "";
        return [...inner.matchAll(/:([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]);
      })]);
    const especies = filas.map((l) => (l.match(/\[:([A-Z_]+),/) || [])[1]).filter(Boolean);
    const faltanEspecies = especies.filter((sp) => !existeEspecie(sp));
    check(especies.length === 3 && faltanEspecies.length === 0,
      `las tres especies del séquito existen en species.dat (${especies.join(", ")})`);
    const sinSprite = especies.filter(
      (sp) => !fs.existsSync(path.join(GAME, "Graphics/Pokemon/Front", `${sp}.png`)));
    check(sinSprite.length === 0,
      `el séquito tiene sprite frontal en el distribuable${sinSprite.length ? `; FALTAN: ${sinSprite.join(", ")}` : ""}`);
  }
}
// 2c) sprites de la Forma Origen (mil brazos) y fondos del cosmos (R14)
check(fs.existsSync(path.join(GAME, "Graphics/Pokemon/Front/ARCEUS_18.png")) &&
  fs.existsSync(path.join(GAME, "Graphics/Pokemon/Back/ARCEUS_18.png")),
  "la Forma Origen de mil brazos tiene sprite frontal y trasero en el distribuable");
check(["genesis1_bg", "genesis2_bg", "genesis3_bg", "genesis1_base0", "genesis1_base1"].every(
  (f) => fs.existsSync(path.join(GAME, "Graphics/Battlebacks", `${f}.png`))),
  "los fondos cósmicos de la Cima (genesis1/2/3 + plataformas) existen como Battlebacks reales");
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
    // R15: se recorre el arreglo HASTA SU CIERRE BALANCEADO. Con un slice fijo
    // se colaban filas del séquito ([:DIALGA, [:ROAROFTIME...]]) y sus MOVIMIENTOS
    // pasaban por especies.
    let i = ambas.indexOf("[", inicio);
    let depth = 0;
    for (; i < ambas.length; i += 1) {
      if (ambas[i] === "[") depth += 1;
      else if (ambas[i] === "]") { depth -= 1; if (depth === 0) break; }
    }
    const trozo = ambas.slice(inicio, i + 1);
    for (const m of trozo.split("\n").filter((l) => l.includes("[:")).map((l) => (l.match(/\[:([A-Z_]+),/) || [])[1]).filter(Boolean)) {
      especiesDuelo.add(m);
    }
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

// ------------------------------------------------- R15 · alcance (col 0)
// El bug que llegó a la partida: RUTA_ARCEUS_SEQUITO y pbArceusBuildLegendario
// quedaron INDENTADOS dentro de `class PokeBattle_Battle`. Ruby los define
// entonces en el ámbito de la clase y el starter (nivel Object) lanza
// NameError/NoMethodError. Esta auditoría hace imposible que la clase de error
// vuelva a distribuirse: (a) ninguna constante del duelo puede definirse
// anidada; (b) toda constante RUTA_* y ARCEUS_* referenciada debe existir en
// columna 0; (c) todo método del duelo llamado sin receptor desde un `def` de
// columna 0 debe estar definido en columna 0.
{
  const lineas = ambas.split("\n");
  const constantesCol0 = new Set();
  const constantesAnidadas = [];
  const defsCol0 = new Set();
  const bloquesTop = []; // [nombre, cuerpo]
  let bloqueActual = null;
  for (const linea of lineas) {
    const mConstCol0 = linea.match(/^([A-Z][A-Z0-9_]*)\s*=/);
    if (mConstCol0) constantesCol0.add(mConstCol0[1]);
    const mConstAnidada = linea.match(/^[ \t]+([A-Z][A-Z0-9_]*)\s*=/);
    if (mConstAnidada && /^(RUTA_|ARCEUS_)/.test(mConstAnidada[1])) {
      constantesAnidadas.push(`${mConstAnidada[1]} («${linea.trim().slice(0, 60)}»)`);
    }
    const mDef = linea.match(/^def ([A-Za-z0-9_!?]+)/);
    if (mDef) {
      defsCol0.add(mDef[1]);
      bloqueActual = [mDef[1], []];
      bloquesTop.push(bloqueActual);
      continue;
    }
    if (/^(class|module)\s/.test(linea) || /^end\b/.test(linea)) bloqueActual = null;
    if (bloqueActual) bloqueActual[1].push(linea);
  }
  check(constantesAnidadas.length === 0,
    `ninguna constante del duelo está definida anidada dentro de una clase${constantesAnidadas.length ? `; ANIDADAS: ${constantesAnidadas.join(", ")}` : ""}`);

  const referidas = new Set();
  for (const m of ambas.matchAll(/\b(RUTA_[A-Z][A-Z0-9_]*|ARCEUS_[A-Z][A-Z0-9_]*)\b/g)) referidas.add(m[1]);
  const constantesHuerfanas = [...referidas].filter((c) => !constantesCol0.has(c));
  check(referidas.size > 0 && constantesHuerfanas.length === 0,
    `las ${referidas.size} constantes RUTA_* y ARCEUS_* referenciadas existen en columna 0${constantesHuerfanas.length ? `; NO DEFINIDAS EN COL 0: ${constantesHuerfanas.join(", ")}` : ""}`);

  const llamadasTop = new Map(); // metodo -> Set(defs que lo llaman)
  for (const [nombre, cuerpo] of bloquesTop) {
    for (const linea of cuerpo) {
      if (/^\s*#/.test(linea)) continue;
      for (const m of linea.matchAll(/(?<![.\w:@$])(pb(?:Arceus|StartArceus|RutaArceus)[A-Za-z0-9_]*\??|ruta_arceus_[A-Za-z0-9_]*\??)(?![A-Za-z0-9_?!])/g)) {
        const llamado = m[1];
        if (llamado === nombre) continue;
        if (!llamadasTop.has(llamado)) llamadasTop.set(llamado, new Set());
        llamadasTop.get(llamado).add(nombre);
      }
    }
  }
  const metodosAnidados = [];
  for (const [llamado, quien] of llamadasTop) {
    if (!defsCol0.has(llamado)) metodosAnidados.push(`${llamado} (lo llaman ${[...quien].join(", ")})`);
  }
  check(llamadasTop.size > 0 && metodosAnidados.length === 0,
    `los ${llamadasTop.size} métodos del duelo invocados desde defs de nivel superior están definidos en columna 0${metodosAnidados.length ? `; INVISIBLES PARA OBJECT: ${metodosAnidados.join(", ")}` : ""}`);
}

// ------------------------------------------- R15 · todos los tipos, genérico
// Barrido de referencias sueltas (fuera de las tablas fijas ya auditadas):
// cualquier recurso NOMBRADO en la sección instalada debe existir en el juego.
{
  const fondos = [...new Set([...ambas.matchAll(/nextBattleBack\s*=\s*"([^"]+)"/g)].map((m) => m[1]))];
  const bbDir = path.join(GAME, "Graphics", "Battlebacks");
  const bbFaltantes = fondos.filter((f) => !fs.readdirSync(bbDir).some((archivo) => archivo.startsWith(f)));
  check(fondos.length > 0 && bbFaltantes.length === 0,
    `los ${fondos.length} fondos de batalla asignados por el guion existen en Graphics/Battlebacks${bbFaltantes.length ? `; FALTAN: ${bbFaltantes.join(", ")}` : ""}`);

  const pistasSueltas = [...new Set([
    ...[...ambas.matchAll(/nextBattleBGM\s*=\s*"([^"]+)"/g)].map((m) => m[1]),
    ...[...ambas.matchAll(/pbBGMPlay\("([^"]+)"/g)].map((m) => m[1]),
  ])];
  const bgmFaltantes = pistasSueltas.filter((t) => !instaladas.has(t));
  check(pistasSueltas.length > 0 && bgmFaltantes.length === 0,
    `las ${pistasSueltas.length} pistas BGM citadas fuera de la tabla por fase existen en Audio/BGM${bgmFaltantes.length ? `; FALTAN: ${bgmFaltantes.join(", ")}` : ""}`);

  const aprendidos = [...new Set([...ambas.matchAll(/learn_move\(:([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]))];
  const movsCpu = [];
  for (const m of ambas.matchAll(/pbArceusCinematicCpuBattle\([^,]+,\s*\[([^\]]*)\]/g)) {
    for (const s2 of m[1].matchAll(/:([A-Z][A-Z0-9_]*)/g)) movsCpu.push(s2[1]);
  }
  const movsGen = [...new Set([...aprendidos, ...movsCpu])];
  const movsGenFaltantes = movsGen.filter((id) => !existeMov(id));
  check(movsGenFaltantes.length === 0,
    `los ${movsGen.length} movimientos citados por learn_move/CpuBattle existen en moves.dat${movsGenFaltantes.length ? `; FALTAN: ${movsGenFaltantes.join(", ")}` : ""}`);

  const itemsGen = [...new Set([...ambas.matchAll(/\.item\s*=\s*:([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]))];
  const itemsGenFaltantes = itemsGen.filter((id) => !existeItem(id));
  check(itemsGenFaltantes.length === 0,
    `los ${itemsGen.length} objetos asignados (.item = :X) existen en items.dat${itemsGenFaltantes.length ? `; FALTAN: ${itemsGenFaltantes.join(", ")}` : ""}`);
}

// ------------------------------------- R15 · el distribuable refleja el juego
// De nada sirve que la carpeta del juego tenga el recurso si el paquete que se
// descarga no lo trae: mismos Battlebacks, sprites de las formas de Arceus,
// pistas y personajes en Scripts_corregido/Paquete_directo.
{
  const PAQ = path.join(ROOT, "Scripts_corregido", "Paquete_directo");
  const faltanPak = [];
  const exigir = (rel) => { if (!fs.existsSync(path.join(PAQ, rel))) faltanPak.push(rel); };
  for (const f of ["genesis1_bg", "genesis2_bg", "genesis3_bg", "genesis1_base0", "genesis1_base1"]) {
    exigir(`Graphics/Battlebacks/${f}.png`);
  }
  exigir("Graphics/Pokemon/Front/ARCEUS_18.png");
  exigir("Graphics/Pokemon/Back/ARCEUS_18.png");
  for (const p of pistas.keys()) exigir(`Audio/BGM/${p}.ogg`);
  for (const pj of personajes) {
    const dir = path.join(PAQ, "Graphics", "Characters");
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((f) => f.startsWith(pj))) faltanPak.push(`Graphics/Characters/${pj}*`);
  }
  check(faltanPak.length === 0,
    `el Paquete_directo distribuye todos los recursos del duelo${faltanPak.length ? `; FALTAN: ${faltanPak.join(", ")}` : ""}`);
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
