#!/usr/bin/env node
/**
 * apply_dlc_ambience.mjs
 *
 * Los diecisiete mapas nuevos salieron del compositor sin banda sonora: eran
 * mundos mudos. Esta herramienta les pone música real del juego (sólo archivos
 * que ya existen en Audio/BGM, nunca uno inventado) y añade tablas de
 * encuentros temáticas a los mapas que tienen terreno compatible.
 *
 * La música no es decorativa: cada dimensión suena a lo que es. Glazed lleva
 * nieve, Light Platinum lleva costa, la base del Sindicato lleva su propio tema
 * y los ocho gimnasios de Atlas suenan cada uno distinto.
 *
 * Los encuentros se escriben en `content/wild_zones.json`, que es el catálogo
 * que consume `tools/apply_wild_zones.mjs`; aquí sólo se sincronizan.
 *
 * Uso:
 *   node tools/apply_dlc_ambience.mjs
 *   node tools/apply_dlc_ambience.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { DATA, GAME, ROOT, RString, iv, makeChecker, mapFile, readMapRaw, writeMapRaw } from "./lib/dlc_helpers.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "dlc_ambience.json"), "utf8"));
const WILD_PATH = path.join(ROOT, "content", "wild_zones.json");
const BGM_DIR = path.join(GAME, "Audio", "BGM");
const BACKUP = "dlc_ambience";

function backupFile(file) {
  const dir = path.join(GAME, "PokeModBackups", BACKUP);
  fs.mkdirSync(dir, { recursive: true });
  const source = path.join(DATA, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dir, file));
}

/* ─────────────────────────────── la música ──────────────────────────────── */

function instalarMusica() {
  const aplicadas = [];
  const fallidas = [];
  for (const fila of PLAN.musica) {
    const archivo = mapFile(fila.mapId);
    if (!fs.existsSync(path.join(DATA, archivo))) { fallidas.push(`${fila.mapId}: no existe el mapa`); continue; }
    if (!fs.existsSync(path.join(BGM_DIR, fila.bgm))) { fallidas.push(`${fila.mapId}: no existe ${fila.bgm}`); continue; }
    backupFile(archivo);
    const map = readMapRaw(fila.mapId);
    const bgm = iv(map, "@bgm");
    if (!bgm) { fallidas.push(`${fila.mapId}: el mapa no tiene @bgm`); continue; }
    bgm.setIvar("@name", RString.fromText(fila.bgm));
    bgm.setIvar("@volume", 100);
    bgm.setIvar("@pitch", 100);
    map.setIvar("@autoplay_bgm", true);
    writeMapRaw(fila.mapId, map);
    aplicadas.push(fila);
  }
  return { aplicadas, fallidas };
}

/* ──────────────────────────── los encuentros ───────────────────────────── */

function sincronizarZonas() {
  const catalogo = JSON.parse(fs.readFileSync(WILD_PATH, "utf8"));
  const porMapa = new Map(catalogo.zones.map((z) => [z.mapId, z]));
  let anadidas = 0;
  for (const zona of PLAN.zonas) {
    if (porMapa.has(zona.mapId)) Object.assign(porMapa.get(zona.mapId), zona);
    else { catalogo.zones.push(zona); anadidas += 1; }
  }
  fs.writeFileSync(WILD_PATH, `${JSON.stringify(catalogo, null, 2)}\n`);
  return { anadidas, total: catalogo.zones.length };
}

function instalar() {
  const musica = instalarMusica();
  const zonas = sincronizarZonas();
  return { musica, zonas };
}

/* ──────────────────────────── verificación ──────────────────────────────── */

function verify() {
  const check = makeChecker("Ambientación del DLC");

  for (const fila of PLAN.musica) {
    const archivo = path.join(DATA, mapFile(fila.mapId));
    check.ok(fs.existsSync(archivo), `no existe Map${fila.mapId}`);
    if (!fs.existsSync(archivo)) continue;
    check.ok(fs.existsSync(path.join(BGM_DIR, fila.bgm)),
      `la música ${fila.bgm} del Map${fila.mapId} no existe en Audio/BGM`);
    const map = readMapRaw(fila.mapId);
    const nombre = iv(iv(map, "@bgm"), "@name");
    const texto = typeof nombre === "string" ? nombre : nombre?.text ?? "";
    check.ok(texto === fila.bgm, `Map${fila.mapId} no suena ${fila.bgm} (tiene «${texto}»)`);
    check.ok(iv(map, "@autoplay_bgm") === true, `Map${fila.mapId} no reproduce la música al entrar`);
  }

  const catalogo = JSON.parse(fs.readFileSync(WILD_PATH, "utf8"));
  for (const zona of PLAN.zonas) {
    const guardada = catalogo.zones.find((z) => z.mapId === zona.mapId);
    check.ok(!!guardada, `falta la zona salvaje del Map${zona.mapId} en wild_zones.json`);
    if (!guardada) continue;
    for (const tipo of Object.keys(zona.types)) {
      check.ok((guardada.types[tipo] ?? []).length === zona.types[tipo].length,
        `Map${zona.mapId}: la tabla ${tipo} no coincide`);
    }
  }

  check.done();
}

/* ──────────────────────────────── main ──────────────────────────────────── */

if (VERIFY_ONLY) {
  verify();
} else {
  const resultado = instalar();
  console.log(`✔ Ambientación del DLC instalada`);
  console.log(`  · música asignada: ${resultado.musica.aplicadas.length} de ${PLAN.musica.length} mapas`);
  if (resultado.musica.fallidas.length) {
    for (const f of resultado.musica.fallidas) console.error(`   ✘ ${f}`);
  }
  console.log(`  · zonas salvajes: ${resultado.zonas.anadidas} nuevas (${resultado.zonas.total} en el catálogo)`);
  console.log("  · ahora hay que aplicar el catálogo: node tools/apply_wild_zones.mjs");
  verify();
}
