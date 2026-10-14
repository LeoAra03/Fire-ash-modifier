#!/usr/bin/env node
/**
 * apply_cajas_dialogo.mjs
 *
 * Diálogos · «Los diálogos no se deben solapar; cada personaje debe tener su
 * propia caja de diálogo.»
 *
 * Inyecta la sección Ruby `PokeMod_Dialogos` en los Scripts.rxdata del juego y
 * del paquete descargable. La sección:
 *
 *   1. **Caja por personaje.** Cada mensaje puede salir en su propia caja de
 *      diálogo identificada por el nombre del hablante:
 *        · Texto con prefijo `Nombre: …` / `Nombre — …` (retroactivo con todos
 *          los diálogos del DLC que ya usan «Arceus: «…»»).
 *        · Etiqueta explícita `\sp[Nombre]` al inicio del mensaje.
 *        · Si el mensaje lo dispara un evento y su nombre parece el de un
 *          personaje (solo letras/espacios), la caja lleva ese nombre.
 *   2. **Anti-solape.** Los mensajes se serializan: nunca se dibujan dos cajas
 *      de texto a la vez (cola con límite de tiempo: el juego jamás se cuelga).
 *   3. **Combate.** Los mensajes de batalla (`pbDisplayMessage` /
 *      `pbDisplayPausedMessage`) también llevan caja del hablante y respetan
 *      la misma regla de no solape.
 *
 * Uso:
 *   node tools/apply_cajas_dialogo.mjs           # inyecta y verifica
 *   node tools/apply_cajas_dialogo.mjs --verify  # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad, marshalDump, RString } from "../web/js/marshal.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const TITULO = "PokeMod_Dialogos";
const DIR = "cajas_dialogo";
const RUBY = fs.readFileSync(new URL("./lib/pokemod_dialogos.rb", import.meta.url), "utf8");


const SCRIPTS = [
  path.join(GAME, "Data", "Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido", "Scripts.rxdata"),
];

function inyectar(archivo) {
  const scripts = marshalLoad(fs.readFileSync(archivo));
  const comprimido = zlib.deflateSync(Buffer.from(RUBY, "utf-8"));
  const idx = scripts.findIndex(([, t]) => t && t.text === TITULO);
  if (idx >= 0) scripts[idx][2] = new RString(comprimido);
  else scripts.splice(scripts.length - 1, 0, [999902, RString.fromText(TITULO), new RString(comprimido)]);
  // Mantener la paridad de secciones juego/paquete: el título debe ser S() como
  // el resto de secciones (RString con encoding UTF-8).
  fs.writeFileSync(archivo, Buffer.from(marshalDump(scripts)));
  return idx >= 0;
}

function respaldo(archivo) {
  const dir = path.join(GAME, "PokeModBackups", DIR);
  fs.mkdirSync(dir, { recursive: true });
  const bak = path.join(dir, path.basename(archivo) + "." + path.basename(path.dirname(archivo)));
  if (!fs.existsSync(bak)) fs.copyFileSync(archivo, bak);
}

function verificar() {
  const fallos = [];
  const esperados = [
    "module PokeModDialogos",
    "def self.dividir",
    "def self.cajaDeNombre",
    "pokemod_orig_pbMessageDisplay",
    "pokemod_orig_pbCreateMessageWindow",
    "pokemod_orig_pbDisplayPausedMessage",
    "alias pbDisplayPaused pbDisplayPausedMessage",
  ];
  const conteos = [];
  for (const archivo of SCRIPTS) {
    if (!fs.existsSync(archivo)) { fallos.push(`falta ${archivo}`); continue; }
    const scripts = marshalLoad(fs.readFileSync(archivo));
    conteos.push(scripts.length);
    const seccion = scripts.find(([, t]) => t && t.text === TITULO);
    if (!seccion) { fallos.push(`${path.basename(path.dirname(archivo))}/${path.basename(archivo)}: falta ${TITULO}`); continue; }
    const ruby = zlib.inflateSync(Buffer.from(seccion[2].bytes)).toString("utf8");
    for (const marca of esperados) if (!ruby.includes(marca)) fallos.push(`${archivo}: falta la marca «${marca}»`);
  }
  if (conteos.length === 2 && conteos[0] !== conteos[1]) {
    fallos.push(`Scripts.rxdata tiene ${conteos[0]} secciones y el paquete ${conteos[1]} (paridad rota)`);
  }
  return fallos;
}

if (!VERIFY_ONLY) {
  for (const archivo of SCRIPTS) {
    if (!fs.existsSync(archivo)) { console.warn(`WARN: ${archivo} no existe; omitido.`); continue; }
    respaldo(archivo);
    const existia = inyectar(archivo);
    console.log(`· ${path.relative(ROOT, archivo)}: ${TITULO} ${existia ? "actualizado" : "inyectado"}.`);
  }
}
const fallos = verificar();
if (fallos.length) {
  console.error("FALLOS:\n" + fallos.map((f) => "  · " + f).join("\n"));
  process.exit(1);
}
console.log("OK: cajas de diálogo por personaje instaladas; mensajes serializados (sin solapes).");
