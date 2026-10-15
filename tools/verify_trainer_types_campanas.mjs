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
 *   4. Por campaña: nº de entradas y coincidencia de nombres con el plano
 *      content/rom_campaigns_complete.json (combates de NPC + final).
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
    if (!objetos.has(obj)) problemas.push({ tipo: "indice_huerfano", clave: [idx], valor: txt(ivars(obj)["@trainer_type"]) });
  }

  // Campañas: nombres esperados según el plano.
  const plano = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));
  const campañas = [];
  for (const c of plano.campaigns) {
    const esperados = [];
    for (const m of c.maps) {
      let i = 0;
      for (const n of m.npcs) if (n.trainer) esperados.push(`${c.id.toUpperCase()}_${m.sequence}_${++i}`);
    }
    esperados.push(`${c.id.toUpperCase()}_FINAL`);
    const presentes = porTipo.get(c.trainerType) ?? [];
    const sp = new Set(presentes), se = new Set(esperados);
    const faltan = esperados.filter((n) => !sp.has(n));
    const sobran = presentes.filter((n) => !se.has(n));
    campañas.push({
      id: c.id, tipo: c.trainerType, tipoValido: validos.has(c.trainerType), numId: validos.get(c.trainerType) ?? null,
      esperados: esperados.length, instalados: presentes.length, faltan: faltan.length, sobran: sobran.length,
      ejemploFaltan: faltan.slice(0, 3), ejemploSobran: sobran.slice(0, 3),
    });
    if (!validos.has(c.trainerType)) problemas.push({ tipo: "tipo_campaña_invalido", clave: [c.id], valor: c.trainerType });
  }
  return { tiposDefinidos: validos.size, entradas: compuestas.length, problemas, campañas };
}

function main() {
  const r = verificar();
  const tiposInvalidos = r.problemas.filter((p) => p.tipo.startsWith("tipo")).length;
  const internos = r.problemas.filter((p) => p.tipo === "indice_huerfano").length;
  const desfase = r.campañas.some((c) => c.faltan || c.sobran);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Tipos definidos en trainer_types.dat: ${r.tiposDefinidos}`);
    console.log(`Entradas de entrenador (claves compuestas): ${r.entradas}`);
    console.log(`Tipos inválidos o inconsistentes: ${tiposInvalidos} · índices huérfanos: ${internos}`);
    for (const c of r.campañas) {
      console.log(`${c.tipoValido ? "✔" : "✘"} ${c.id.padEnd(15)} ${c.tipo} (id ${c.numId}) · esperados ${c.esperados} · instalados ${c.instalados} · faltan ${c.faltan} · sobran ${c.sobran}`);
    }
    if (desfase) console.log("✘ Los nombres de entrenador instalados no coinciden con el plano actual (ver --json).");
  }
  process.exit(tiposInvalidos || internos || desfase ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
