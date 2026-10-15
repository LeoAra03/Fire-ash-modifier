#!/usr/bin/env node
/**
 * verify_npc_contrapartes_rom.mjs — Fase 71.
 *
 * Confirma la contraparte estructural de los NPC de origen ROM en los mapas
 * instalados de Fire Ash:
 *   · Universo de origen: `npcSelection.sourceCount` (9 691 NPC en total).
 *   · Universo instalado: `npcs` del plano content/rom_campaigns_complete.json
 *     (3 625 NPC), que es lo que el plano decide conservar (máx. 4 por mapa).
 *   · Para cada NPC instalado busca su evento en Data/Map<id>.rxdata:
 *       1. por nombre («NPC — <campaña>_<secuencia>_<n>» o «Entrenador — …»),
 *       2. si no, por posición exacta (x, y) entre los eventos no-navegación.
 *   · Excluye navegación (Retorno, Tramo, Warp), líderes (PokeMod Líder) y finales.
 *   · Comprueba que cada mapa existe y que las posiciones son únicas y dentro de límites.
 *
 * Los NPC de origen que no están en el plano (sourceCount − npcs) no tienen
 * contraparte por diseño: se reportan como «sin contraparte por selección».
 *
 * Solo lee archivos. Sale con código 1 si algún NPC instalado no tiene evento
 * (o un mapa no existe / tiene posiciones no válidas).
 *
 * Uso: node tools/verify_npc_contrapartes_rom.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");
const NAV = /PokeMod Campaña ROM: (Retorno libre|Tramo (anterior|siguiente)|Warp \d+|Portal)/;
const NO_NPC = /PokeMod Líder|Final/i;

const txt = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Buffer.isBuffer(v.bytes)) return v.bytes.toString("utf8");
  if (v.name) return String(v.name);
  return String(v);
};
const ivars = (obj) => Object.fromEntries((obj.ivars ?? []).map(([k, v]) => [txt(k), v]));

function eventosDelMapa(mapId) {
  const file = path.join(DATA, `Map${String(mapId).padStart(3, "0")}.rxdata`);
  if (!fs.existsSync(file)) return null;
  const iv = ivars(marshalLoad(fs.readFileSync(file)));
  const ancho = iv["@width"], alto = iv["@height"];
  const eventos = (iv["@events"]?.pairs ?? []).map(([, o]) => {
    const e = ivars(o);
    return { nombre: txt(e["@name"]), x: e["@x"], y: e["@y"] };
  });
  return { ancho, alto, eventos };
}

export function verificar() {
  const plano = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));
  const resumen = [];
  const problemas = [];
  let origen = 0, instalados = 0, porNombre = 0, porPosicion = 0, mapas = 0;

  for (const c of plano.campaigns) {
    const r = { campaña: c.id, mapas: 0, origen: 0, instalados: 0, porNombre: 0, porPosicion: 0, sinContraparte: 0, errores: 0 };
    for (const m of c.maps) {
      mapas++; r.mapas++;
      const sel = m.npcSelection ?? {};
      r.origen += sel.sourceCount ?? 0; origen += sel.sourceCount ?? 0;
      const npcs = m.npcs ?? [];
      r.instalados += npcs.length; instalados += npcs.length;

      const mapa = eventosDelMapa(m.mapId);
      if (!mapa) { problemas.push({ mapa: m.mapId, error: "archivo ausente" }); r.errores++; r.sinContraparte += npcs.length; continue; }
      const cand = mapa.eventos.filter((e) => !NAV.test(e.nombre) && !NO_NPC.test(e.nombre));
      const usados = new Set();
      npcs.forEach((npc, i) => {
        const clave = `${c.id}_${m.sequence}_${i + 1}`;
        let hit = cand.find((e) => !usados.has(e) && e.nombre.includes(clave));
        if (hit) { r.porNombre++; porNombre++; usados.add(hit); return; }
        hit = cand.find((e) => !usados.has(e) && e.x === npc.x && e.y === npc.y);
        if (hit) { r.porPosicion++; porPosicion++; usados.add(hit); return; }
        r.sinContraparte++; r.errores++;
        problemas.push({ mapa: m.mapId, error: `NPC ${clave} (${npc.x},${npc.y}) sin evento` });
      });
      const pos = new Set();
      for (const e of mapa.eventos) {
        const k = `${e.x},${e.y}`;
        if (pos.has(k)) { problemas.push({ mapa: m.mapId, error: `posición duplicada ${k}` }); r.errores++; }
        pos.add(k);
        if (mapa.ancho != null && (e.x < 0 || e.y < 0 || e.x >= mapa.ancho || e.y >= mapa.alto)) {
          problemas.push({ mapa: m.mapId, error: `evento fuera de límites (${e.x},${e.y})` }); r.errores++;
        }
      }
    }
    resumen.push(r);
  }
  const contraparte = porNombre + porPosicion;
  return {
    mapas, origen, instalados, contraparte,
    sinContrapartePorSeleccion: origen - instalados,
    sinContraparteInstalado: instalados - contraparte,
    resumen, problemas,
  };
}

function main() {
  const r = verificar();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Mapas revisados: ${r.mapas}`);
    console.log(`NPC de origen: ${r.origen} · instalados en el plano: ${r.instalados} · con contraparte: ${r.contraparte} · sin contraparte instalada: ${r.sinContraparteInstalado}`);
    console.log(`Sin contraparte por selección (no instalados): ${r.sinContrapartePorSeleccion}`);
    for (const c of r.resumen) {
      console.log(`${c.errores ? "✘" : "✔"} ${c.campaña.padEnd(15)} mapas ${c.mapas} · origen ${c.origen} · instalados ${c.instalados} · por nombre ${c.porNombre} · por posición ${c.porPosicion} · sin contraparte ${c.sinContraparte}`);
    }
    if (r.problemas.length) console.log(`✘ ${r.problemas.length} problemas (ver --json)`);
    else console.log("✔ Todos los NPC instalados tienen contraparte estructural");
  }
  process.exit(r.problemas.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
