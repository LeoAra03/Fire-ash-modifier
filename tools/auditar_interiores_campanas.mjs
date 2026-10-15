#!/usr/bin/env node
/**
 * auditar_interiores_campanas.mjs — Fase 73.
 *
 * Audita que los interiores de las campañas ROM se marquen como perfiles
 * artesanales SEPARADOS y no como planos automáticos. Comprueba:
 *   1. Cada mapa candidato de content/perfiles_artesanales_campanas.json existe en el plano
 *      y tiene la misma campaña y el mismo mapId.
 *   2. El plano (content/rom_campaigns_complete.json) no marca ningún mapa como
 *      perfil artesanal: ningún mapa tiene campo `perfil`/`handcrafted` y su
 *      `artDirection` no lo indica.
 *   3. El pipeline de construcción (tools/apply_complete_rom_campaigns.mjs) consume la
 *      lista de perfiles; si no la lee, los candidatos se construyen como planos automáticos.
 *   4. Los mapas instalados (Data/Map<id>.rxdata) de los candidatos no llevan ninguna
 *      marca de perfil artesanal en sus eventos.
 *   5. Cada mapa candidato usa donantes exteriores (`visualRows.donorMapId`), es decir,
 *      se pinta como plano automático.
 *
 * Solo lee archivos. Sale con código 1 si algún candidato se construye como automático.
 *
 * Uso: node tools/auditar_interiores_campanas.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");
const PATRON_PERFIL = /artesanal|handcrafted|perfil/i;

const txt = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Buffer.isBuffer(v.bytes)) return v.bytes.toString("utf8");
  if (v.name) return String(v.name);
  return String(v);
};
const ivars = (obj) => Object.fromEntries((obj.ivars ?? []).map(([k, v]) => [txt(k), v]));

export function auditar() {
  const plano = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));
  const candidatos = JSON.parse(fs.readFileSync(path.join(ROOT, "content/perfiles_artesanales_campanas.json"), "utf8")).mapas;
  const pipeline = fs.readFileSync(path.join(ROOT, "tools/apply_complete_rom_campaigns.mjs"), "utf8");
  const pipelineLeePerfiles = /perfiles_artesanales/.test(pipeline);

  const mapasPlano = new Map();
  for (const c of plano.campaigns) for (const m of c.maps) mapasPlano.set(m.mapId, { campaña: c.id, m });

  const hallazgos = [];
  let marcadosEnPlano = 0, marcadosEnMapa = 0, donantesExteriores = 0, noEncontrados = 0;
  for (const cand of candidatos) {
    const entrada = mapasPlano.get(cand.mapa);
    if (!entrada) { noEncontrados++; hallazgos.push({ mapa: cand.mapa, error: "candidato fuera del plano" }); continue; }
    if (entrada.campaña !== cand.campaña) hallazgos.push({ mapa: cand.mapa, error: `campaña ${entrada.campaña} ≠ ${cand.campaña}` });

    const m = entrada.m;
    const marcaPlano = Object.keys(m).some((k) => PATRON_PERFIL.test(k)) || PATRON_PERFIL.test(m.artDirection ?? "");
    if (marcaPlano) marcadosEnPlano++;

    const archivo = path.join(DATA, `Map${String(cand.mapa).padStart(3, "0")}.rxdata`);
    if (fs.existsSync(archivo)) {
      const iv = ivars(marshalLoad(fs.readFileSync(archivo)));
      const nombres = (iv["@events"]?.pairs ?? []).map(([, o]) => txt(ivars(o)["@name"]));
      if (nombres.some((n) => PATRON_PERFIL.test(n))) marcadosEnMapa++;
    } else {
      hallazgos.push({ mapa: cand.mapa, error: "archivo de mapa ausente" });
    }

    const donantes = (m.visualRows ?? []).map((r) => r.donorMapId);
    if (donantes.length && donantes.every((d) => Number.isInteger(d))) donantesExteriores++;
  }

  const total = candidatos.length;
  const automaticos = total - marcadosEnPlano - marcadosEnMapa;
  return {
    candidatos: total,
    pipelineLeePerfiles,
    marcadosEnPlano,
    marcadosEnMapa,
    noEncontrados,
    donantesExteriores,
    construidosComoAutomaticos: automaticos,
    hallazgos,
  };
}

function main() {
  const r = auditar();
  const fallo = !r.pipelineLeePerfiles || r.construidosComoAutomaticos > 0 || r.hallazgos.length > 0;
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Candidatos a perfil artesanal: ${r.candidatos}`);
    console.log(`Marcados como perfil en el plano: ${r.marcadosEnPlano} · en el mapa instalado: ${r.marcadosEnMapa}`);
    console.log(`Construidos con donantes exteriores (automáticos): ${r.donantesExteriores}`);
    console.log(`El pipeline lee la lista de perfiles: ${r.pipelineLeePerfiles ? "sí" : "no"}`);
    console.log(fallo
      ? `✘ ${r.construidosComoAutomaticos} candidatos se construyen como planos automáticos (ver --json).`
      : "✔ Todos los candidatos están separados como perfiles artesanales.");
  }
  process.exit(fallo ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
