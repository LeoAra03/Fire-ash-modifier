#!/usr/bin/env node
/**
 * perfiles_artesanales_campanas.mjs — Fase 72.
 *
 * 1. Verifica la política de NPC por mapa en content/rom_campaigns_complete.json:
 *    · installedCount ≤ MAX (4) en todos los mapas.
 *    · installedCount = min(sourceCount, 4): ningún mapa instala de más ni de menos.
 * 2. Decide qué mapas necesitan perfil artesanal propio y lo escribe en
 *    content/perfiles_artesanales_campanas.json. Reglas (cualquiera basta):
 *    · R1 interior: mapType ∈ {8 INDOOR, 9 SECRET_BASE} (tipo GBA estándar).
 *    · R1b interior probable: mapType 0, máx. dimensión ≤ 20, ≥ 1 warp
 *      (el plano no marca interiores; se señala como «probable» para revisión).
 *    · R2 saturación: sourceCount ≥ 12 (la selección conserva ≤ 1/3 de los NPC).
 *    Sólo entran mapas que de verdad pierden NPC (sourceCount > 4).
 *
 * Uso:
 *   node tools/perfiles_artesanales_campanas.mjs            # escribe el JSON
 *   node tools/perfiles_artesanales_campanas.mjs --check    # verifica política y JSON al día
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PLANO = path.join(ROOT, "content/rom_campaigns_complete.json");
const SALIDA = path.join(ROOT, "content/perfiles_artesanales_campanas.json");
const MAX = 4;
const TIPOS_INTERIOR = new Set([8, 9]);
const SATURACION = 12;

export function analizar() {
  const plano = JSON.parse(fs.readFileSync(PLANO, "utf8"));
  const violaciones = [];
  const mapas = [];
  for (const c of plano.campaigns) {
    for (const m of c.maps) {
      const sel = m.npcSelection;
      const sem = m.sourceSemantics;
      const esperado = Math.min(sel.sourceCount, MAX);
      if (sel.installedCount !== esperado || m.npcs.length !== sel.installedCount) {
        violaciones.push({ mapa: m.mapId, instalados: sel.installedCount, esperado, lista: m.npcs.length });
      }
      if (sel.installedCount > MAX) violaciones.push({ mapa: m.mapId, error: `supera ${MAX}` });
      if (sel.sourceCount <= MAX) continue; // no pierde NPC: no es candidato
      const maxDim = Math.max(m.dimensions.width, m.dimensions.height);
      const motivos = [];
      if (TIPOS_INTERIOR.has(sem.mapType)) motivos.push("R1 interior (tipo " + sem.mapType + ")");
      else if (sem.mapType === 0 && maxDim <= 20 && sem.warpCount >= 1) motivos.push("R1b interior probable");
      if (sel.sourceCount >= SATURACION) motivos.push(`R2 saturación (${sel.sourceCount} → ${sel.installedCount})`);
      if (!motivos.length) continue;
      mapas.push({
        campaña: c.id,
        mapa: m.mapId,
        titulo: m.title,
        origen: sel.sourceCount,
        instalados: sel.installedCount,
        perdidos: sel.sourceCount - sel.installedCount,
        tipoMapa: sem.mapType,
        dimension: `${m.dimensions.width}x${m.dimensions.height}`,
        motivos,
      });
    }
  }
  const perdidosPlan = plano.campaigns.reduce((t, c) => t + c.maps.reduce((s, m) => s + m.npcSelection.sourceCount - m.npcSelection.installedCount, 0), 0);
  const resumen = {
    mapasConPerfil: mapas.length,
    perdidosEnMapasConPerfil: mapas.reduce((s, x) => s + x.perdidos, 0),
    perdidosTotalesDelPlan: perdidosPlan,
    porRegla: {
      R1_interior: mapas.filter((x) => x.motivos.some((m) => m.startsWith("R1 "))).length,
      R1b_probable: mapas.filter((x) => x.motivos.some((m) => m.startsWith("R1b"))).length,
      R2_saturacion: mapas.filter((x) => x.motivos.some((m) => m.startsWith("R2"))).length,
    },
  };
  return { politica: { maxPorMapa: MAX, mapasRevisados: plano.campaigns.reduce((s, c) => s + c.maps.length, 0), violaciones }, resumen, mapas };
}

function main() {
  const r = analizar();
  const json = JSON.stringify({ generado: "tools/perfiles_artesanales_campanas.mjs", reglas: { MAX, TIPOS_INTERIOR: [...TIPOS_INTERIOR], SATURACION }, ...r }, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(SALIDA) ? fs.readFileSync(SALIDA, "utf8") : "";
    const ok = actual === json && r.politica.violaciones.length === 0;
    console.log(`Política: ${r.politica.violaciones.length} violaciones en ${r.politica.mapasRevisados} mapas.`);
    console.log(`Perfiles artesanales: ${r.mapas.length} mapas (${r.resumen.perdidosEnMapasConPerfil} de ${r.resumen.perdidosTotalesDelPlan} NPC perdidos).`);
    if (actual !== json) console.log("✘ content/perfiles_artesanales_campanas.json desactualizado: ejecutar sin --check.");
    console.log(ok ? "✔ Política respetada y lista al día." : "✘ Revisar.");
    process.exit(ok ? 0 : 1);
  }
  fs.writeFileSync(SALIDA, json);
  console.log(`✔ Escrito ${path.relative(ROOT, SALIDA)}: ${r.mapas.length} mapas con perfil artesanal propio.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
