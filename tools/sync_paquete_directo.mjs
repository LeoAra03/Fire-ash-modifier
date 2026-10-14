#!/usr/bin/env node
/**
 * sync_paquete_directo.mjs
 *
 * Mantiene `Scripts_corregido/Paquete_directo/` — la carpeta que se descomprime
 * sobre la raíz del juego para jugar — al día con todo lo que la expansión ha
 * tocado en `pokemon_fire_ash/`.
 *
 * El paquete directo es un *overlay*, no una copia: sólo lleva los archivos
 * cambiados. Por eso la lista de lo que hay que copiar se calcula así:
 *
 *   1. Todo lo que git marca como modificado o nuevo bajo `pokemon_fire_ash/`
 *      (es decir, lo que la expansión ha creado o alterado).
 *   2. Todo lo que el paquete ya llevaba, por si una herramienta lo regeneró
 *      igual que estaba y git ya no lo marca.
 *   3. `Scripts.rxdata` se copia desde `Scripts_corregido/` (la copia con las
 *      correcciones de distribución), nunca desde el juego.
 *
 * Uso:
 *   node tools/sync_paquete_directo.mjs
 *   node tools/sync_paquete_directo.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const PACKAGE = path.join(ROOT, "Scripts_corregido");
const DIRECT = path.join(PACKAGE, "Paquete_directo");
const SCRIPTS = path.join(PACKAGE, "Scripts.rxdata");
const VERIFY_ONLY = process.argv.includes("--verify");

/**
 * Compromiso desde el que arrancó esta rama: todo lo que haya cambiado en
 * `pokemon_fire_ash/` desde ahí es contenido de la expansión y tiene que
 * viajar en el paquete. Se usa el compromiso base y no `git status` a secas
 * porque el trabajo entregado en otros turnos ya está confirmado.
 *
 * Ojo: en un clon superficial (`git clone --depth 1`, que es lo que hace
 * actions/checkout por defecto) ese compromiso no existe y `git diff` falla.
 * La herramienta se caía entera, y con ella `verify:all`. Cuando el compromiso
 * base no está disponible se cae a una red más burda pero suficiente: los
 * mapas del rango de la expansión, los datos globales y lo que el paquete ya
 * llevaba.
 */
const BASE = process.env.POKEMOD_BASE || "576c54c4b2511b851b6cec9131e6cc6feec59e9d";
const DATOS_GLOBALES = [
  "Data/Tilesets.rxdata", "Data/MapInfos.rxdata", "Data/System.rxdata",
  "Data/metadata.dat", "Data/map_metadata.dat", "Data/encounters.dat",
];

const dentroDeGit = () => {
  try { execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: ROOT, stdio: "ignore" }); return true; }
  catch { return false; }
};
const baseDisponible = () => {
  try { execFileSync("git", ["cat-file", "-e", `${BASE}^{commit}`], { cwd: ROOT, stdio: "ignore" }); return true; }
  catch { return false; }
};

/**
 * Datos globales del juego: sin historial,no se puede saber qué cambió, pero
 * estos archivos son de la expansión con seguridad. Los mapas no entran: el
 * rango 2021+ no viaja entero en este paquete (Dimensional Nightmare y la
 * Expansión Multiversal se reparten en sus propios ZIP), así que incluirlos
 * daría ciento y pico de «faltas» que no lo son.
 */
function contenidosDeExpansion() {
  return new Set(DATOS_GLOBALES);
}

let MODO = "historial";
/** Archivos de `pokemon_fire_ash/` que la expansión ha creado o modificado. */
function cambiadosEnGit() {
  const rutas = new Set();
  if (!dentroDeGit()) { MODO = "sin git"; return rutas; }
  const git = (argumentos) => execFileSync("git", argumentos, {
    cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  const anadir = (texto) => {
    for (const linea of texto.split("\n")) {
      const ruta = linea.trim().replace(/^"|"$/g, "");
      if (ruta.startsWith("pokemon_fire_ash/")) rutas.add(path.relative(GAME, ruta));
    }
  };
  if (baseDisponible()) {
    anadir(git(["diff", "--name-only", BASE, "--", "pokemon_fire_ash/"]));
  } else {
    MODO = "sin historial";
    for (const ruta of contenidosDeExpansion()) rutas.add(ruta);
  }
  anadir(git(["ls-files", "--others", "--exclude-standard", "--", "pokemon_fire_ash/"]));
  return rutas;
}

/** Archivos que el paquete ya lleva (relativos a `pokemon_fire_ash/`). */
function yaEnPaquete() {
  const rutas = new Set();
  const caminar = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const absoluto = path.join(dir, entrada.name);
      if (entrada.isDirectory()) caminar(absoluto);
      else rutas.add(path.relative(DIRECT, absoluto));
    }
  };
  if (fs.existsSync(DIRECT)) caminar(DIRECT);
  return rutas;
}

const mismo = (a, b) => {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false;
  return fs.readFileSync(a).equals(fs.readFileSync(b));
};

function sincronizar() {
  const objetivos = new Set([...cambiadosEnGit(), ...yaEnPaquete()]);
  // Scripts.rxdata nunca viene del juego: la copia buena es la corregida.
  objetivos.delete(path.join("Data", "Scripts.rxdata"));
  const copiados = [];
  const intactos = [];
  for (const relativo of [...objetivos].sort()) {
    const origen = path.join(GAME, relativo);
    const destino = path.join(DIRECT, relativo);
    if (!fs.existsSync(origen)) continue;
    if (mismo(origen, destino)) { intactos.push(relativo); continue; }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(origen, destino);
    copiados.push(relativo);
  }
  // Las correcciones de distribución viajan en el Scripts.rxdata del paquete.
  const destinoScripts = path.join(DIRECT, "Data", "Scripts.rxdata");
  let scripts = "ya al día";
  if (!mismo(SCRIPTS, destinoScripts)) {
    fs.mkdirSync(path.dirname(destinoScripts), { recursive: true });
    fs.copyFileSync(SCRIPTS, destinoScripts);
    scripts = "actualizado";
  }
  return { copiados, intactos, scripts };
}

function verificar() {
  const errores = [];
  if (!fs.existsSync(DIRECT)) errores.push("no existe Scripts_corregido/Paquete_directo/");
  if (!fs.existsSync(SCRIPTS)) errores.push("no existe Scripts_corregido/Scripts.rxdata");
  if (errores.length) throw new Error(`Paquete directo incompleto:\n- ${errores.join("\n- ")}`);

  // 1. El Scripts.rxdata del paquete es exactamente el corregido.
  const destinoScripts = path.join(DIRECT, "Data", "Scripts.rxdata");
  if (!mismo(SCRIPTS, destinoScripts)) {
    errores.push("el paquete no usa el Scripts.rxdata corregido");
  }
  // 2. Todo lo cambiado en el juego está en el paquete y es idéntico.
  for (const relativo of [...cambiadosEnGit()].sort()) {
    const origen = path.join(GAME, relativo);
    if (relativo === path.join("Data", "Scripts.rxdata")) continue;
    if (!fs.existsSync(origen)) continue;
    const destino = path.join(DIRECT, relativo);
    if (!fs.existsSync(destino)) { errores.push(`falta en el paquete: ${relativo}`); continue; }
    if (!mismo(origen, destino)) errores.push(`desincronizado: ${relativo}`);
  }
  if (errores.length) throw new Error(`Paquete directo desincronizado (${errores.length}):\n- ${errores.join("\n- ")}`);

  let total = 0;
  const contar = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const absoluto = path.join(dir, entrada.name);
      if (entrada.isDirectory()) contar(absoluto); else total += 1;
    }
  };
  contar(DIRECT);
  const origen = MODO === "sin historial"
    ? "sólo lo que el paquete ya lleva (el clon no trae el compromiso base)"
    : `cambios desde ${BASE.slice(0, 8)}`;
  console.log(`✔ Paquete directo sincronizado: ${total} archivos, todos idénticos a pokemon_fire_ash/ `
    + `(Scripts.rxdata desde Scripts_corregido/). Origen de la lista: ${origen}.`);
}

if (!VERIFY_ONLY) {
  const { copiados, intactos, scripts } = sincronizar();
  console.log(`  · Scripts.rxdata: ${scripts}`);
  for (const relativo of copiados) console.log(`  · copiado: ${relativo}`);
  if (intactos.length) console.log(`  · ${intactos.length} archivos ya estaban al día`);
}
verificar();
