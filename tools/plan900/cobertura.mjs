#!/usr/bin/env node
/**
 * cobertura.mjs — mide la cobertura REAL del proyecto y deriva de ahí cuántas
 * fases hacen falta para cerrarlo por criterio, no por estimación.
 *
 * Salida: unidades de cobertura (assertions) por familia, fases derivadas y el
 * desglose de lo que exige ojo humano.
 *
 * Uso:
 *   node tools/plan900/cobertura.mjs            (tabla legible)
 *   node tools/plan900/cobertura.mjs --json     (JSON para CI)
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, DATA } from "../lib/fire_ash_registry.mjs";
import { readMapRaw } from "../lib/dlc_helpers.mjs";
import { parseMap, parseEvent } from "../../web/js/rmxp.js";
import { marshalLoad } from "../../web/js/marshal.js";

const JSON_OUT = process.argv.includes("--json");

/* ── 1. censo de mapas ─────────────────────────────────────────────────── */
const files = fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f));
const ids = files.map((f) => parseInt(f.match(/\d+/)[0], 10)).sort((a, b) => a - b);

const cmd = { dialogo: 0, eleccion: 0, condicion: 0, switchOn: 0, varSet: 0, selfSwitch: 0,
  transfer: 0, batalla: 0, espera: 0, rutina: 0, script: 0 };
let mapas = 0, eventos = 0, paginas = 0, comandos = 0, tiles = 0;
let autoplayBgm = 0, conEncuentros = 0, slotsEncuentro = 0;
const switches = new Set(), variables = new Set(), graficos = new Set(), bgms = new Set();
const porRango = {};

const rangoDe = (id) =>
  id < 1000 ? "Fire Ash original" :
  id <= 1020 ? "Horizontes" :
  id <= 2020 ? "Atlas Mil" :
  id <= 2038 ? "Ruta de Dios + Silver" :
  id <= 2190 ? "Dimensional Nightmare" :
  id <= 2300 ? "Mapas nuevos del DLC" :
  id <= 2999 ? "Reserva" :
  id <= 4419 ? "Campañas ROM" : "Otros";

for (const id of ids) {
  let p;
  try { p = parseMap(readMapRaw(id)); } catch { continue; }
  mapas++;
  tiles += p.width * p.height;
  const bgm = p.bgm?.getIvar?.("name");
  if (bgm) { autoplayBgm++; bgms.add(String(bgm)); }
  const enc = p.obj.getIvar("encounter_list");
  if (enc && enc.length) { conEncuentros++; slotsEncuentro += enc.length; }
  const r = rangoDe(id);
  porRango[r] = porRango[r] || { mapas: 0, eventos: 0, paginas: 0, comandos: 0, tiles: 0 };
  porRango[r].mapas++; porRango[r].tiles += p.width * p.height;

  for (const e of p.events) {
    const pe = parseEvent(e.obj);
    eventos++; porRango[r].eventos++;
    const g = pe.pages[0]?.graphic?.charName;
    if (g) graficos.add(String(g));
    for (const pg of pe.pages) {
      paginas++; porRango[r].paginas++;
      if (pg.condition) {
        if (pg.condition.switch1) switches.add(pg.condition.switch1);
        if (pg.condition.switch2) switches.add(pg.condition.switch2);
        if (pg.condition.variable) variables.add(pg.condition.variable.id);
      }
      for (const c of pg.list || []) {
        comandos++; porRango[r].comandos++;
        const code = Number(c.getIvar("code"));
        const pr = c.getIvar("parameters") || [];
        switch (code) {
          case 101: case 401: cmd.dialogo++; break;
          case 102: cmd.eleccion++; break;
          case 111:
            cmd.condicion++;
            if (Number(pr[0]) === 0) switches.add(Number(pr[1]));
            if (Number(pr[0]) === 1) variables.add(Number(pr[1]));
            break;
          case 121: cmd.switchOn++; switches.add(Number(pr[0])); break;
          case 122: cmd.varSet++; variables.add(Number(pr[0])); break;
          case 123: cmd.selfSwitch++; break;
          case 201: cmd.transfer++; break;
          case 301: cmd.batalla++; break;
          case 106: cmd.espera++; break;
          case 209: cmd.rutina++; break;
          case 355: case 655: {
            cmd.script++;
            const linea = String(pr[0]?.text ?? pr[0] ?? "");
            if (/pbTrainerBattle|pbWildBattle|pbDoubleTrainerBattle|pbBattle/.test(linea)) cmd.batalla++;
            break;
          }
          default: break;
        }
      }
    }
  }
}

/* ── 1b. tablas de encuentro reales (encounters.dat) ───────────────────── */
let tablasEnc = 0, slotsEnc = 0;
try {
  const enc = marshalLoad(fs.readFileSync(path.join(DATA, "encounters.dat")));
  if (enc?.pairs) for (const [, v] of enc.pairs) {
    tablasEnc++;
    const types = v?.getIvar?.("types");
    if (types?.pairs) for (const [, arr] of types.pairs) slotsEnc += (arr || []).length;
  }
} catch { /* sin encounters.dat */ }

/* ── 2. unidades de cobertura por familia ──────────────────────────────── */
const U = [];
const add = (familia, unidades, ojo, nota) => U.push({ familia, unidades, ojo, nota });

// Cada mapa se revisa con el checklist de diez puntos; cada evento se ejecuta,
// se comprueba en sus dos estados y se verifica su salida.
add("checklist de mapa (10 puntos)", mapas * 10, 0, "automatizable con tools/plan2700/checklist_mapa.mjs");
add("ejecución de evento (página inicial)", eventos, 0, "harness de replay");
add("ejecución de evento (página final)", eventos, 0, "segunda pasada con estado avanzado");
add("salida garantizada por evento", eventos, 0, "ningún evento deja sin retorno");
add("diálogo mostrado y comprobado", cmd.dialogo, Math.round(cmd.dialogo * 0.25), "formato automático, sentido a ojo");
add("elección con cada rama tomada", cmd.eleccion * 2, 0, "una pasada por rama");
add("condición probada en verdadero y falso", cmd.condicion * 2, 0, "matriz de condiciones");
add("switch comprobado en ambos estados", switches.size * 2, 0, "ida y vuelta");
add("variable comprobada en valores límite", variables.size * 3, 0, "0, valor típico, máximo");
add("self-switch comprobado en ambos estados", cmd.selfSwitch * 2, 0, "por evento y letra");
add("transferencia recorrida en ambos sentidos", cmd.transfer * 2, 0, "ida y vuelta verificada");
add("combate ejecutado y comprobado", cmd.batalla, 0, "equipo, derrota y recompensa");
add("rutina de movimiento completada", cmd.rutina, 0, "sin atascos ni salidas de mapa");
add("espera medida (ni corte ni lentitud)", cmd.espera, 0, "cronómetro de escena");
add("script de evento ejecutado sin error", cmd.script, 0, "captura de excepciones");

/* ── 3. el espacio de experimentación (lo que rompe el juego) ───────────── */
const combinaciones = {
  "estado de progreso (7 regiones + 5 campañas + 6 dimensiones)": 2 ** 18,
  "reserva de mapas fuera de rango": mapas,
  "encuentro salvaje (tabla × slot)": slotsEnc,
  "gráficos de personaje referenciados": graficos.size,
  "pistas de música referenciadas": bgms.size,
  "tablas de encuentro": tablasEnc,
  "mapas con BGM": autoplayBgm,
  "tiles de mapa (celdas)": tiles,
};
for (const [k, v] of Object.entries(combinaciones)) add(k, v, 0, "muestreo dirigido, no exhaustivo donde explota");

/* ── 4. fuzz y adversario ──────────────────────────────────────────────── */
const fuzz = [
  ["fuzz de eventos (semillas)", 20000],
  ["mutación de mapas (celdas alteradas)", 50000],
  ["partida interrumpida en guardado (puntos de corte)", 500],
  ["límites de sistema (mochila, caja, dinero, nivel, nombre)", 400],
  ["sesiones humanas de playtest con cuota de cobertura", 60],
];
for (const [k, v] of fuzz) add(k, v, k.includes("humanas") ? v : 0, "adversario");

const unidades = U.reduce((s, u) => s + u.unidades, 0);
const ojoHumano = U.reduce((s, u) => s + u.ojo, 0);

/* 1 fase = unidad de trabajo que produce y archiva ~150 comprobaciones. */
const POR_FASE = 150;
const fases = Math.ceil(unidades / POR_FASE);
const fasesConOjo = Math.ceil((unidades + ojoHumano * 4) / POR_FASE);

const out = {
  generado: new Date().toISOString().slice(0, 10),
  censo: { mapas, eventos, paginas, comandos, tiles, switches: switches.size, variables: variables.size,
    graficos: graficos.size, bgms: bgms.size, tablasEncuentro: tablasEnc, slotsEncuentro: slotsEnc },
  comandos: cmd,
  porRango,
  unidades: U,
  totales: { unidades, ojoHumano, porFase: POR_FASE, fases, fasesConOjo },
};

if (JSON_OUT) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }

const n = (v) => v.toLocaleString("es-CL");
console.log(`CENSO  mapas ${n(mapas)} · eventos ${n(eventos)} · páginas ${n(paginas)} · comandos ${n(comandos)} · celdas ${n(tiles)}`);
console.log(`       switches ${n(switches.size)} · variables ${n(variables.size)} · gráficos ${n(graficos.size)} · BGM ${n(bgms.size)}`);
console.log(`       tablas de encuentro ${n(tablasEnc)} con ${n(slotsEnc)} slots\n`);
console.log("UNIDADES DE COBERTURA");
for (const u of U) console.log(`  ${String(n(u.unidades)).padStart(12)}  ${u.familia}`);
console.log(`\nTOTAL ${n(unidades)} unidades · ${n(ojoHumano)} exigen ojo humano`);
console.log(`1 fase = ${POR_FASE} unidades  →  ~${n(fases)} fases de cobertura`);
console.log(`con el coste del juicio humano  →  ~${n(fasesConOjo)} fases reales`);
