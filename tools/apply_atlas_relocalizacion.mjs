// ============================================================================
// apply_atlas_relocalizacion.mjs
// ----------------------------------------------------------------------------
// Rediseño pedido por el usuario: la Dimensión Atlas concentra las VERSIONES
// ALTERNATIVAS de personajes conocidos (los "Mirror Boss") y los POKÉGODS,
// repartidos por sus mapas Tier 1; Isla Espejo queda libre para su nuevo
// propósito (Ciudad Teckel / Isla Paraíso, ver apply_ciudad_teckel_maxine.mjs).
//
// · Cada evento "Mirror Boss: …" se traslada a un mapa Tier 1 del Atlas con su
//   sprite de personaje recoloreado (Graphics/Characters/ALT_<base>.png), para
//   que el eco alternativo se distinga del original.
// · Cada evento "PokeMod Pokégod: …" se traslada igualmente (su sprite ya es
//   una anomalía propia y no se recolorea).
// · Los eventos se eliminan de los mapas 997-999 (Isla Espejo).
//
//   node tools/apply_atlas_relocalizacion.mjs            # aplica
//   node tools/apply_atlas_relocalizacion.mjs --verify   # solo comprueba
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT, GAME, DATA, S, txt, iv, readMapRaw, writeMapRaw, freeCells, makeChecker,
} from "./lib/dlc_helpers.mjs";
import { recolorPng } from "./lib/sprite_fx.mjs";

const VERIFY = process.argv.includes("--verify");
const SOURCE_MAPS = [997, 998, 999];
const PREFIXES = ["Mirror Boss:", "PokeMod Pokégod:"];
const HIERARCHY = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const ATLAS_T1 = HIERARCHY.maps.filter((m) => m.tier === 1).map((m) => m.mapId);
const CHAR_DIR = path.join(GAME, "Graphics", "Characters");
const MANIFEST = path.join(ROOT, "content", "teckel_manifest.json");

const clone = (o) => JSON.parse(JSON.stringify(o)); // solo para el manifest
void clone;

function loadManifest() {
  if (fs.existsSync(MANIFEST)) return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  return { files: [] };
}
function saveManifest(list) {
  const m = loadManifest();
  const set = new Set(m.files);
  for (const f of list) set.add(f);
  m.files = [...set].sort();
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
  return m.files.length;
}

function eventsOfMap(map) { return iv(map, "@events"); }

function collectSources() {
  const moved = [];
  for (const id of SOURCE_MAPS) {
    const map = readMapRaw(id);
    for (const [key, ev] of eventsOfMap(map).pairs) {
      const name = txt(iv(ev, "@name"));
      if (PREFIXES.some((p) => name.startsWith(p))) {
        moved.push({ from: id, key, name, ev, mirror: name.startsWith("Mirror Boss:") });
      }
    }
  }
  return moved;
}

function graphicName(page) {
  const g = iv(page, "@graphic");
  return txt(iv(g, "@character_name"));
}
function setGraphic(page, name) {
  iv(page, "@graphic").setIvar("@character_name", S(name));
}

function targetFor(index) {
  return ATLAS_T1[index % ATLAS_T1.length];
}

async function apply() {
  const manifest = [];
  const moved = collectSources();
  if (!moved.length) {
    console.log("· nada que relocalizar (los mapas origen ya no tienen Mirror Boss/Pokégods)");
    return;
  }

  // Variantes recoloreadas de los personajes alternativos.
  const bases = [...new Set(moved.filter((m) => m.mirror)
    .flatMap((m) => (iv(m.ev, "@pages") ?? []).map(graphicName)))].filter(Boolean);
  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const src = path.join(CHAR_DIR, `${base}.png`);
    const dst = path.join(CHAR_DIR, `ALT_${base}.png`);
    if (!fs.existsSync(src)) { console.log(`· sin sprite base ${base}.png`); continue; }
    if (!fs.existsSync(dst)) {
      fs.writeFileSync(dst, await recolorPng(src, 48 + i * 26));
      console.log(`✔ ALT_${base}.png (matiz +${48 + i * 26}°)`);
    }
    manifest.push(`Graphics/Characters/ALT_${base}.png`);
  }

  // Traslado round-robin a los mapas Tier 1 del Atlas.
  const caches = new Map();
  const getMap = (id) => {
    if (!caches.has(id)) caches.set(id, readMapRaw(id));
    return caches.get(id);
  };
  moved.forEach((item, index) => {
    const target = targetFor(index);
    const map = getMap(target);
    const events = eventsOfMap(map);
    events.pairs = events.pairs.filter(([, e]) => txt(iv(e, "@name")) !== item.name);
    const ev = item.ev;
    let nextId = Math.max(0, ...events.pairs.map(([k]) => Number(k))) + 1;
    ev.setIvar("@id", nextId);
    const cells = freeCells(target);
    const cell = cells[(index * 7) % cells.length] ?? [4, 4];
    ev.setIvar("@x", cell[0]);
    ev.setIvar("@y", cell[1]);
    if (item.mirror) {
      for (const page of iv(ev, "@pages") ?? []) {
        const base = graphicName(page);
        if (base && fs.existsSync(path.join(CHAR_DIR, `ALT_${base}.png`))) setGraphic(page, `ALT_${base}`);
      }
    }
    events.pairs.push([nextId, ev]);
    manifest.push(`Data/Map${String(target).padStart(3, "0")}.rxdata`);
  });
  for (const [id, map] of caches) writeMapRaw(id, map);

  // Limpia los orígenes en Isla Espejo.
  for (const sid of SOURCE_MAPS) {
    const map = readMapRaw(sid);
    const events = eventsOfMap(map);
    const before = events.pairs.length;
    events.pairs = events.pairs.filter(([, e]) =>
      !PREFIXES.some((p) => txt(iv(e, "@name")).startsWith(p)));
    if (events.pairs.length !== before) {
      writeMapRaw(sid, map);
      manifest.push(`Data/Map${String(sid).padStart(3, "0")}.rxdata`);
      console.log(`✔ ${sid}: ${before - events.pairs.length} eventos trasladados al Atlas`);
    }
  }
  const total = saveManifest(manifest);
  console.log(`OK: ${moved.length} eventos relocalizados en el Atlas (${total} archivos en manifest)`);
}

function verify() {
  const check = makeChecker("relocalización Atlas");
  for (const id of SOURCE_MAPS) {
    const map = readMapRaw(id);
    const left = eventsOfMap(map).pairs.filter(([, e]) =>
      PREFIXES.some((p) => txt(iv(e, "@name")).startsWith(p)));
    check.ok(left.length === 0, `el mapa ${id} aún conserva ${left.length} eventos por trasladar`);
  }
  const names = new Set();
  for (const id of ATLAS_T1) {
    const file = path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`);
    if (!fs.existsSync(file)) { check.fail(`falta el mapa atlas ${id}`); continue; }
    for (const [, e] of eventsOfMap(readMapRaw(id)).pairs) {
      const name = txt(iv(e, "@name"));
      if (PREFIXES.some((p) => name.startsWith(p))) {
        check.ok(!names.has(name), `evento duplicado en el Atlas: ${name}`);
        names.add(name);
      }
    }
  }
  check.ok(names.size >= 30, `el Atlas solo recibió ${names.size} eventos (esperaba ≥30)`);
  check.done();
}

if (VERIFY) verify();
else { await apply(); verify(); }
