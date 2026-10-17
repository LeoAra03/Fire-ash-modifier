#!/usr/bin/env node
/**
 * Inventario reproducible de recursos declarados por los catálogos del plan.
 *
 * El inventario no presume que un nombre exista: resuelve cada referencia
 * contra pokemon_fire_ash/, registra tamaño/hash y falla en --verify si una
 * referencia declarada falta, es de cero bytes, duplica una pista de audio o
 * no cumple las dimensiones RMXP declaradas.
 *
 * Uso:
 *   node tools/plan900/inventario_recursos.mjs
 *   node tools/plan900/inventario_recursos.mjs --verify
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const OUT = path.join(ROOT, "content", "plan900_recursos.json");
const VERIFY = process.argv.includes("--verify");

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const normalize = (value) => String(value).replace(/^pokemon_fire_ash[\\/]/, "").replace(/^\//, "");
const gamePath = (value) => path.join(GAME, normalize(value));
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const pngSize = (file) => {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

const refs = new Map();
function add(relative, tipo, fase, declaracion, expected) {
  const clean = normalize(relative);
  if (!clean || clean.startsWith("$")) return;
  const key = `${tipo}:${clean}`;
  if (!refs.has(key)) refs.set(key, { ruta: clean, tipo, fase, declaraciones: [], esperado: expected ?? null });
  const item = refs.get(key);
  item.declaraciones.push(declaracion);
  if (expected && !item.esperado) item.esperado = expected;
}
function addIfPath(value, tipo, fase, declaracion, expected) {
  if (typeof value === "string" && /\.(png|ogg|mid|wav|mp3|wav)$/i.test(value)) add(value, tipo, fase, declaracion, expected);
}

// Música declarada para los mapas de expansión/DLC.
for (const [catalog, fase] of [
  ["content/dlc_ambience.json", "007"],
]) {
  const data = readJson(catalog);
  for (const entry of data.musica ?? []) add(`Audio/BGM/${entry.bgm}`, "BGM", fase, `${catalog}#${entry.mapId}`);
}
// Recursos visuales de Pokégods, cuando la ruta está incluida en el catálogo.
const gods = readJson("content/pokegods_assets.json");
for (const entry of gods.pokegods ?? []) {
  for (const key of ["frontal", "trasero", "icono", "personaje"]) {
    addIfPath(entry[key], key === "personaje" ? "character" : key, "007", `pokegods_assets:${entry.nombre}`);
  }
}
// Atavíos de Ash: los slots clásicos no son archivos nuevos, los charsets sí.
const outfits = readJson("content/outfits_dimension.json");
for (const entry of outfits.atavios ?? []) {
  if (!entry.charset || entry.player !== null && entry.player !== undefined) continue;
  add(`Graphics/Characters/${entry.charset}.png`, "character", "007", `outfits_dimension:${entry.clave}`, { width: 128, height: 192 });
}
// Los sprites nativos de ROM son un catálogo de referencia real; sólo se
// inventarian los PNG que efectivamente están en el checkout.
const native = readJson("content/rom_nativo_sprites.json");
for (const campaign of Object.values(native.campaigns ?? {})) {
  for (const sprite of Object.values(campaign.sprites ?? {})) {
    const png = sprite.png;
    const candidate = `Graphics/Characters/${png}`;
    if (fs.existsSync(gamePath(candidate))) add(candidate, "character", "007", `rom_nativo:${sprite.nombre}`, { width: sprite.ancho, height: sprite.alto });
  }
}

const entries = [...refs.values()].sort((a, b) => a.ruta.localeCompare(b.ruta));
const resolved = entries.map((entry) => {
  const absolute = gamePath(entry.ruta);
  const exists = fs.existsSync(absolute);
  const bytes = exists ? fs.statSync(absolute).size : 0;
  const dimensions = exists && entry.ruta.toLowerCase().endsWith(".png") ? pngSize(absolute) : null;
  return {
    ...entry,
    declaraciones: [...new Set(entry.declaraciones)].sort(),
    existe: exists,
    bytes,
    sha256: exists && bytes ? sha256(absolute) : null,
    dimensiones: dimensions,
  };
});

const report = {
  esquema: "plan900_recursos/1.0",
  politica: "Sólo referencias declaradas por catálogos versionados; no se inventan assets ausentes.",
  generado: "determinista",
  totales: {
    referencias: resolved.length,
    existentes: resolved.filter((e) => e.existe).length,
    ausentes: resolved.filter((e) => !e.existe).length,
    bytes: resolved.reduce((n, e) => n + e.bytes, 0),
    porTipo: Object.fromEntries([...resolved.reduce((m, e) => m.set(e.tipo, (m.get(e.tipo) ?? 0) + 1), new Map())].sort()),
  },
  recursos: resolved,
  regenerar: "node tools/plan900/inventario_recursos.mjs",
};
function verify(report) {
  const errors = [];
  for (const e of report.recursos) {
    if (!e.existe) errors.push(`${e.tipo}: falta ${e.ruta}`);
    if (e.existe && e.bytes <= 0) errors.push(`${e.tipo}: ${e.ruta} está vacío`);
    if (e.esperado && e.dimensiones && (e.dimensiones.width !== e.esperado.width || e.dimensiones.height !== e.esperado.height)) {
      errors.push(`${e.ruta}: ${e.dimensiones.width}x${e.dimensiones.height}, esperado ${e.esperado.width}x${e.esperado.height}`);
    }
  }
  const audio = report.recursos.filter((e) => e.tipo === "BGM");
  const paths = new Set();
  for (const e of audio) if (paths.has(e.ruta)) errors.push(`BGM duplicado: ${e.ruta}`); else paths.add(e.ruta);
  if (errors.length) throw new Error(`Inventario de recursos inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
}
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}; genera el inventario primero.`);
  const actual = JSON.parse(fs.readFileSync(OUT, "utf8"));
  verify(actual);
  if (JSON.stringify(actual) !== JSON.stringify(report)) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado; regenera y revisa el diff.`);
} else {
  verify(report);
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(`OK: ${report.totales.existentes}/${report.totales.referencias} referencias resueltas, ${report.totales.bytes} bytes, ${report.totales.ausentes} ausentes${VERIFY ? " (inventario vigente)" : `; escrito ${path.relative(ROOT, OUT)}`}.`);
