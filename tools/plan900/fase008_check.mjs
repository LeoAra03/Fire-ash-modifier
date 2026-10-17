#!/usr/bin/env node
/**
 * Compuerta estática de FASE 008 (tareas 701–799).
 * No inventa recursos: comprueba los catálogos declarados, los assets DN,
 * las hojas de Ash, audio, exclusiones de vestidor, política de ROM y higiene
 * del checkout. La prueba de movimiento/escucha continúa siendo manual.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";

const ROOT = path.resolve(import.meta.dirname, "../..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const failures = [];
const warnings = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const warn = (condition, message) => { if (!condition) warnings.push(message); };
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const exists = (relative) => fs.existsSync(path.join(GAME, relative));
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function pngInfo(file) {
  const b = fs.readFileSync(file);
  ok(b.length > 24, `PNG vacío o truncado: ${path.relative(ROOT, file)}`);
  ok(b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `firma PNG inválida: ${path.relative(ROOT, file)}`);
  if (b.length < 24) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
}

function auditResourceInventory() {
  const inventory = readJson("content/plan900_recursos.json");
  ok(inventory.totales?.referencias === inventory.totales?.existentes, "inventario plan900 tiene referencias ausentes");
  ok(inventory.totales?.ausentes === 0, `inventario plan900 declara ${inventory.totales?.ausentes} ausentes`);
  for (const item of inventory.recursos) {
    const file = path.join(GAME, item.ruta);
    ok(fs.existsSync(file), `falta recurso declarado: ${item.ruta}`);
    if (!fs.existsSync(file)) continue;
    ok(fs.statSync(file).size === item.bytes, `tamaño cambiado sin regenerar inventario: ${item.ruta}`);
    ok(sha256(file) === item.sha256, `hash cambiado sin regenerar inventario: ${item.ruta}`);
    if (item.dimensiones) {
      const info = pngInfo(file);
      if (info) ok(info.width === item.dimensiones.width && info.height === item.dimensiones.height, `dimensiones cambiadas: ${item.ruta}`);
    }
  }
  return inventory.totales;
}

function auditOutfits() {
  const plan = readJson("content/outfits_dimension.json");
  ok(plan.atavios.length === 11, `se esperan 11 atavíos, hay ${plan.atavios.length}`);
  for (const outfit of plan.atavios) ok(exists(`Graphics/Characters/${outfit.charset}.png`), `falta charset de atavío: ${outfit.charset}`);
  ok(JSON.stringify(plan.excluidos).includes("2220") && JSON.stringify(plan.excluidos).includes("2281"), "faltan exclusiones del Rocket/vestidor");
  ok(plan.variables?.atavio === 316 && plan.variables?.modo === 317, "variables de atavío cambiaron de contrato");
}

function auditArt() {
  const manifest = readJson("content/dimensional_nightmare_art.json");
  ok(manifest.assets?.length === 7, `el manifiesto DN no tiene 7 assets (${manifest.assets?.length ?? 0})`);
  for (const asset of manifest.assets ?? []) {
    const file = path.join(GAME, asset.out);
    ok(fs.existsSync(file), `falta arte DN: ${asset.out}`);
    if (!fs.existsSync(file)) continue;
    const info = pngInfo(file);
    ok(info?.width === asset.w && info?.height === asset.h, `dimensión inesperada en ${asset.out}`);
    ok(fs.statSync(file).size > 0, `arte DN de cero bytes: ${asset.out}`);
  }
  for (const source of ["kinggus_form1.png", "kinggus_final.png", "kinggus_over.png", "unown_fragment.png", "white_hand.png"]) {
    ok(fs.existsSync(path.join(ROOT, "reference/dimensional_nightmare/art_src", source)), `falta fuente DN documentada: ${source}`);
  }
  const readme = fs.readFileSync(path.join(ROOT, "reference/dimensional_nightmare/README.md"), "utf8");
  ok(readme.includes("npm run dn:ingest") && readme.includes("reference/dimensional_nightmare/slices"), "README DN no documenta ingesta y arte fuente");
}

function auditAudio() {
  const ambience = readJson("content/dlc_ambience.json");
  const maps = new Set(ambience.musica.map((row) => row.mapId));
  ok(maps.size >= 17, `ambientación declara ${maps.size} mapas, se requieren al menos 17`);
  for (const row of ambience.musica) ok(fs.existsSync(path.join(GAME, "Audio/BGM", row.bgm)), `BGM declarada ausente: ${row.bgm}`);
  const dn = readJson("content/dimensional_nightmare_audio.json");
  ok(dn.tracks?.length === 11, `manifiesto DN declara ${dn.tracks?.length ?? 0} pistas, se esperan 11`);
  const assignedMaps = (dn.mapAssignments ?? []).reduce((total, row) => total + row.to - row.from + 1, 0);
  ok(assignedMaps === 149, `audio DN cubre ${assignedMaps} mapas, se esperan 149`);
  for (const track of dn.tracks ?? []) {
    const file = path.join(GAME, "Audio/BGM", path.basename(track.file));
    ok(fs.existsSync(file) && fs.statSync(file).size > 0, `pista DN inválida: ${track.file}`);
  }
}

function auditGatesAndPolicy() {
  const campaigns = readJson("content/rom_campaigns_complete.json");
  ok(campaigns.policy.includes("no son emulación") && campaigns.policy.includes("contenido original de Fire Ash") && campaigns.policy.includes("no incorporan"), "política de campañas ROM no protege la procedencia");
  ok(campaigns.campaigns.length === 5 && campaigns.campaigns.every((c) => c.routeOfGodSwitch === 876), "no todas las campañas están detrás de La Ruta de Dios (876)");
  const oak = fs.readFileSync(path.join(ROOT, "tools/apply_oak_lab_postgame_hub.mjs"), "utf8");
  ok(/const POSTGAME\s*=\s*429/.test(oak), "hub postgame no conserva el switch 429");
  const ruta = fs.readFileSync(path.join(ROOT, "tools/apply_la_ruta_de_dios.mjs"), "utf8");
  ok(/SW_UNLOCKED\s*=\s*870/.test(ruta) && /SW_COMPLETED\s*=\s*876/.test(ruta), "contrato de 870/876 no está declarado en la Ruta de Dios");
  const level = fs.readFileSync(path.join(ROOT, "tools/apply_extended_level_cap.mjs"), "utf8");
  ok(/MAX_LEVEL=175/.test(level) && level.includes("Arceus de La Ruta de Dios: nivel 200"), "contrato de niveles extendidos no está documentado");
  const ignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  for (const pattern of ["Save*.rxdata", "Game.rxdata", "PokeModBackups/", "reference/dimensional_nightmare/slices/"]) ok(ignore.includes(pattern), `.gitignore no cubre ${pattern}`);
  for (const save of ["Game1.rxdata", "Game2.rxdata"]) {
    const file = path.join(ROOT, save);
    ok(fs.existsSync(file), `falta fixture ${save}`);
    if (!fs.existsSync(file)) continue;
    const root = marshalLoad(fs.readFileSync(file));
    const keys = new Set((root.pairs ?? []).map(([key]) => String(key?.name ?? key?.text ?? key)));
    ok(keys.has("player") && keys.has("switches") && keys.has("variables"), `${save} no tiene forma de fixture RMXP`);
  }
}

const inventory = auditResourceInventory();
auditOutfits();
auditArt();
auditAudio();
auditGatesAndPolicy();
if (failures.length) {
  console.error(`FASE 008: ${failures.length} fallo(s)`);
  for (const failure of failures) console.error(`  ✘ ${failure}`);
  process.exit(1);
}
console.log(`FASE 008 OK: ${inventory.existentes}/${inventory.referencias} recursos con hash; 11 atavíos; 7 assets DN; audio ambience/DN; política y gates auditados.`);
for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
