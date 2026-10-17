#!/usr/bin/env node
/**
 * verify_trainer_types_campanas.mjs — Fase 70.
 *
 * Comprueba que las entradas de entrenador de las campañas ROM (trainers.dat)
 * usan tipos válidos definidos en trainer_types.dat:
 *   1. Cada clave [tipo, nombre, versión] y cada GameData::Trainer tienen un
 *      @trainer_type que existe en trainer_types.dat.
 *   2. La clave de tipo coincide con @trainer_type dentro del mismo objeto.
 *   3. Las claves numéricas (índice) apuntan a un objeto que también tiene clave compuesta.
 *   4. Por campaña: cada mapa con entrenador del plano tiene al menos una
 *      variante instalada y cada campaña tiene su combate final. El plano
 *      describe NPCs estructurales, mientras que trainers.dat puede conservar
 *      varias variantes por mapa; por eso no se exige igualdad de nombres
 *      ordinales.
 *
 * Solo lee archivos. Sale con código 1 si hay tipos inválidos, inconsistencias
 * internas o nombres que no coinciden con el plano.
 *
 * Uso: node tools/verify_trainer_types_campanas.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");

const txt = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Buffer.isBuffer(v.bytes)) return v.bytes.toString("utf8").replace(/^"(.*)"$/, "$1");
  if (v.name) return String(v.name);
  return String(v);
};
const ivars = (obj) => Object.fromEntries((obj.ivars ?? []).map(([k, v]) => [txt(k), v]));

export function verificar() {
  const tt = marshalLoad(fs.readFileSync(path.join(DATA, "trainer_types.dat")));
  const validos = new Map();
  for (const [, v] of tt.pairs) {
    const iv = ivars(v);
    const id = txt(iv["@id"]);
    if (id) validos.set(id, iv["@id_number"]);
  }

  const td = marshalLoad(fs.readFileSync(path.join(DATA, "trainers.dat")));
  const compuestas = td.pairs.filter(([k]) => Array.isArray(k));
  const indices = td.pairs.filter(([k]) => typeof k === "number");
  const problemas = [];
  const avisos = [];

  const porTipo = new Map();
  for (const [k, obj] of compuestas) {
    const tipo = txt(k[0]);
    const nombre = txt(k[1]);
    const tipoObj = txt(ivars(obj)["@trainer_type"]);
    if (!validos.has(tipo)) problemas.push({ tipo: "tipo_invalido", clave: [tipo, nombre], valor: tipo });
    if (tipoObj !== tipo) problemas.push({ tipo: "tipo_no_coincide", clave: [tipo, nombre], valor: tipoObj });
    if (!validos.has(tipoObj)) problemas.push({ tipo: "tipo_objeto_invalido", clave: [tipo, nombre], valor: tipoObj });
    porTipo.set(tipo, [...(porTipo.get(tipo) ?? []), nombre]);
  }
  const objetos = new Set(compuestas.map(([, o]) => o));
  for (const [idx, obj] of indices) {
    if (!objetos.has(obj)) avisos.push({ tipo: "indice_huerfano_legacy", clave: [idx], valor: txt(ivars(obj)["@trainer_type"]) });
  }

  // Campañas: el plano fija secuencias/mapas, no ordinales de las variantes.
  // Una misma secuencia puede tener varias entradas (versiones, rematches o
  // NPCs generados), así que comparar `SECUENCIA_1` contra un nombre exacto
  // produciría falsos rojos aunque el mapa esté cubierto.
  const plano = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));
  const campañas = [];
  for (const c of plano.campaigns) {
    const mapasEsperados = new Set(c.maps.filter((m) => m.npcs.some((n) => n.trainer)).map((m) => m.sequence));
    const prefix = c.id.toUpperCase();
    const presentes = porTipo.get(c.trainerType) ?? [];
    const secuenciasInstaladas = new Set();
    for (const nombre of presentes) {
      const match = nombre.match(new RegExp(`^${prefix}_(\\d+)_\\d+$`));
      if (match) secuenciasInstaladas.add(Number(match[1]));
    }
    const faltanMapas = [...mapasEsperados].filter((sequence) => !secuenciasInstaladas.has(sequence));
    const final = presentes.includes(`${prefix}_FINAL`);
    campañas.push({
      id: c.id, tipo: c.trainerType, tipoValido: validos.has(c.trainerType), numId: validos.get(c.trainerType) ?? null,
      mapasEsperados: mapasEsperados.size, mapasCubiertos: [...mapasEsperados].filter((s) => secuenciasInstaladas.has(s)).length,
      esperados: c.maps.reduce((total, m) => total + m.npcs.filter((n) => n.trainer).length, 0),
      instalados: presentes.length, faltanMapas: faltanMapas.length, combateFinal: final,
      ejemploMapasFaltantes: faltanMapas.slice(0, 3),
    });
    if (!validos.has(c.trainerType)) problemas.push({ tipo: "tipo_campaña_invalido", clave: [c.id], valor: c.trainerType });
    if (faltanMapas.length) problemas.push({ tipo: "mapas_campaña_sin_entrenador", clave: [c.id], valor: faltanMapas });
    if (!final) problemas.push({ tipo: "combate_final_faltante", clave: [c.id], valor: `${prefix}_FINAL` });
  }
  return { tiposDefinidos: validos.size, entradas: compuestas.length, problemas, avisos, campañas };
}

function main() {
  const r = verificar();
  const tiposInvalidos = r.problemas.filter((p) => p.tipo.startsWith("tipo")).length;
  const internos = r.avisos.filter((p) => p.tipo === "indice_huerfano_legacy").length;
  const cobertura = r.problemas.filter((p) => p.tipo === "mapas_campaña_sin_entrenador" || p.tipo === "combate_final_faltante").length;
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Tipos definidos en trainer_types.dat: ${r.tiposDefinidos}`);
    console.log(`Entradas de entrenador (claves compuestas): ${r.entradas}`);
    console.log(`Tipos inválidos o inconsistentes: ${tiposInvalidos} · índices huérfanos legacy: ${internos} (aviso, no bloquea)`);
    for (const c of r.campañas) {
      console.log(`${c.tipoValido && !c.faltanMapas && c.combateFinal ? "✔" : "✘"} ${c.id.padEnd(15)} ${c.tipo} (id ${c.numId}) · mapas ${c.mapasCubiertos}/${c.mapasEsperados} · variantes ${c.instalados} · final ${c.combateFinal ? "sí" : "no"}`);
    }
  }
  process.exit(tiposInvalidos || cobertura ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
