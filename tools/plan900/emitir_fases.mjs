/**
 * emitir_fases.mjs — FASE 2765 del plan.
 *
 * Convierte el censo real del proyecto en la lista completa de fases de
 * cobertura, una por línea, en el mismo formato de los documentos anteriores
 * ("N. texto"), continuando la numeración publicada (1–3600).
 *
 * Regla única: una fase = 150 unidades de cobertura. Una comprobación que
 * exige juicio humano pesa 4 veces más que una automática. El número de líneas
 * NO se elige: sale del censo y se recalcula cada vez que el contenido crece.
 *
 * Uso:
 *   node tools/plan900/emitir_fases.mjs                             → tabla
 *   node tools/plan900/emitir_fases.mjs --md docs/PLAN_COBERTURA_FASES.md
 */
import fs from "node:fs";
import path from "node:path";
import { censo, rangoDe, nf } from "./censo_lib.mjs";

const arg = (nombre) => {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : null;
};

export const POR_FASE = 150;   // unidades de cobertura por fase
export const PESO_OJO = 4;     // coste relativo de una comprobación con juicio humano
export const DESDE = 3601;     // continúa la numeración publicada 1–3600

/** Construye el plan completo: una fase = 150 unidades de cobertura. */
export function plan() {
  const c = censo();
  const mapas = c.mapas;

/* ── reparto exacto: la fase k cubre las unidades [k·150, (k+1)·150) ───── */

function lineasPorUnidades(items, medida, plantilla) {
  const total = items.reduce((s, it) => s + medida(it), 0);
  const nFases = Math.max(1, Math.ceil(total / POR_FASE));
  const rangos = [];
  let acc = 0;
  for (const it of items) {
    const v = medida(it);
    if (v <= 0) continue;
    rangos.push({ it, ini: acc, fin: acc + v, v });
    acc += v;
  }
  const out = [];
  let j = 0;
  for (let k = 0; k < nFases; k++) {
    const w0 = k * POR_FASE;
    const w1 = Math.min((k + 1) * POR_FASE, total);
    while (j < rangos.length && rangos[j].fin <= w0) j++;
    const tocados = [];
    for (let t = j; t < rangos.length && rangos[t].ini < w1; t++) tocados.push(rangos[t]);
    out.push(plantilla({ tocados, w0, w1, k, nFases, total, unidades: w1 - w0 }));
  }
  return { textos: out, total, nFases };
}

/** Referencia legible a los mapas tocados por una ventana. */
function refMapas(t) {
  const ids = t.tocados.map((x) => x.it.id);
  const a = Math.min(...ids), b = Math.max(...ids);
  if (a === b) {
    const m = t.tocados[0].it;
    const nombre = m.nombre ? ` «${m.nombre}»` : "";
    const parcial = t.tocados[0].v > t.unidades;
    return `el mapa ${a}${nombre} «${rangoDe(a)}»${parcial ? " (parte)" : ""}`;
  }
  return `los mapas ${a}–${b} «${rangoDe(a)}»`;
}

const familias = [];
const emitir = (familia, res, unidades, peso = 1) => {
  familias.push({ familia, textos: res.textos, lineas: res.textos.length, unidades, peso });
};

/* ── 1. checklist de diez puntos (10 unidades por mapa) ────────────────── */
emitir("checklist de mapa (10 puntos)",
  lineasPorUnidades(mapas, () => 10, (t) =>
    `Auditar los diez puntos del checklist (topología, warps, costuras, música, motivo, contenido mínimo, control y salidas) en ${refMapas(t)} y archivar el informe por mapa.`),
  mapas.length * 10);

/* ── 2–4. ejecución de eventos (tres pasadas) ──────────────────────────── */
{
  const inicial = lineasPorUnidades(mapas, (m) => m.eventos, (t) =>
    `Ejecutar los eventos de ${refMapas(t)} en su página inicial y comprobar que ninguno deja el control bloqueado ni se reejecuta al reentrar.`);
  const final = lineasPorUnidades(mapas, (m) => m.eventos, (t) =>
    `Ejecutar los eventos de ${refMapas(t)} en su página final con el estado avanzado y comprobar banderas, salidas y textos.`);
  const salida = lineasPorUnidades(mapas, (m) => m.eventos, (t) =>
    `Comprobar que las ramas de los eventos de ${refMapas(t)} devuelven siempre el control y dejan el estado de partida coherente.`);
  emitir("ejecución de evento (página inicial)", inicial, c.eventos);
  emitir("ejecución de evento (página final)", final, c.eventos);
  emitir("salida garantizada por evento", salida, c.eventos);
}

/* ── 5. diálogos (una de cada cuatro fases con lectura humana) ─────────── */
{
  const ASPECTOS = [
    "formato de caja y longitud de línea",
    "signos de apertura, comillas y puntuación",
    "idioma, glosario y nombres propios",
    "variables, cantidades y nombres insertados",
    "sentido, tono y lectura humana",
  ];
  const pesoDialogo = 1 + 0.25 * (PESO_OJO - 1); // 25 % de las comprobaciones exigen ojo humano
  const res = lineasPorUnidades(mapas, (m) => Math.round(m.dialogos * pesoDialogo), (t) => {
    const humano = t.k % 4 === 0 ? " Con lectura humana de sentido." : "";
    return `Mostrar y comprobar los diálogos de ${refMapas(t)}: ${ASPECTOS[t.k % ASPECTOS.length]}.${humano}`;
  });
  emitir("diálogo mostrado y comprobado", res,
    c.campos.dialogo + Math.ceil(c.campos.dialogo * 0.25) * PESO_OJO);
}

/* ── 6–7. elecciones y condiciones (2 unidades cada una) ───────────────── */
emitir("elección con cada rama tomada",
  lineasPorUnidades(mapas, (m) => m.elecciones * 2, (t) =>
    `Recorrer las elecciones de ${refMapas(t)} tomando cada rama al menos una vez y comprobando que ninguna queda sin resolver.`),
  c.campos.eleccion * 2);

emitir("condición probada en verdadero y falso",
  lineasPorUnidades(mapas, (m) => m.condiciones * 2, (t) =>
    `Probar las condiciones de ${refMapas(t)} en verdadero y en falso, y comprobar que ninguna es siempre verdadera ni siempre falsa.`),
  c.campos.condicion * 2);

/* ── 8–9. switches (2 u) y variables (3 u), por ID ─────────────────────── */
emitir("switch comprobado en ambos estados",
  lineasPorUnidades(c.switches.map((id) => ({ id })), () => 2, (t) => {
    const ids = t.tocados.map((x) => x.it.id);
    const a = Math.min(...ids), b = Math.max(...ids);
    const sujeto = a === b ? `el switch ${a}` : `los switches ${a}–${b}`;
    return `Comprobar en sus dos estados ${sujeto} (${nf(ids.length)} IDs) con y sin partida avanzada, y verificar que ninguno quede sin escritor ni sin lector.`;
  }),
  c.switches.length * 2);

emitir("variable comprobada en valores límite",
  lineasPorUnidades(c.variables.map((id) => ({ id })), () => 3, (t) => {
    const ids = t.tocados.map((x) => x.it.id);
    const a = Math.min(...ids), b = Math.max(...ids);
    const sujeto = a === b ? `la variable ${a}` : `las variables ${a}–${b}`;
    return `Comprobar ${sujeto} (${nf(ids.length)} IDs) en sus valores límite (cero, típico y máximo) y verificar que ninguna se reinicie ni desborde.`;
  }),
  c.variables.length * 3);

/* ── 10–15. el resto de familias por mapa ──────────────────────────────── */
{
  const defs = [
    ["self-switch comprobado en ambos estados", (m) => m.selfswitches * 2, (t) =>
      `Comprobar los self-switches de ${refMapas(t)} en sus dos estados por evento y letra, sin usarlos como bandera global.`],
    ["transferencia recorrida en ambos sentidos", (m) => m.transfers * 2, (t) =>
      `Recorrer las transferencias de ${refMapas(t)} en ambos sentidos y verificar celda de llegada, dirección, vuelta declarada y ausencia de celdas sólidas.`],
    ["combate ejecutado y comprobado", (m) => m.batallas, (t) =>
      `Ejecutar los combates de evento de ${refMapas(t)} comprobando equipo, derrota con reintento y recompensa única.`],
    ["rutina de movimiento completada", (m) => m.rutinas, (t) =>
      `Completar las rutinas de movimiento de ${refMapas(t)} y verificar que ninguna atraviesa pared, warp ni borde, ni se atasca.`],
    ["espera medida (ni corte ni lentitud)", (m) => m.esperas, (t) =>
      `Medir las esperas de ${refMapas(t)} y comprobar que ninguna escena supera el presupuesto de control ni queda colgada.`],
    ["script de evento ejecutado sin error", (m) => m.scripts, (t) =>
      `Ejecutar los comandos de script de ${refMapas(t)} y capturar cualquier excepción con su mapa, evento y comando exactos.`],
  ];
  for (const [familia, medida, plantilla] of defs) {
    emitir(familia, lineasPorUnidades(mapas, medida, plantilla),
      mapas.reduce((s, m) => s + medida(m), 0));
  }
}

/* ── 16. estado de progreso (matriz muestreada) ────────────────────────── */
{
  const total = 2 ** 18;
  const ASPECTOS = [
    "inventario, objetos y dinero",
    "banderas, contadores y sellos de emisión",
    "medallas, diplomas y visor",
    "atavíos de Ash y su reversión",
    "mensajes del hub y resumen de progreso",
    "acceso a cada región, campaña y dimensión",
  ];
  emitir("estado de progreso (7 regiones + 5 campañas + 6 dimensiones)",
    lineasPorUnidades(Array.from({ length: total }, (_, i) => i), () => 1, (t) =>
      `Probar las combinaciones ${nf(t.w0 + 1)}–${nf(t.w1)} de ${nf(total)} del estado de progreso (7 regiones, 5 campañas y 6 dimensiones) y comprobar ${ASPECTOS[t.k % ASPECTOS.length]}.`),
    total);
}

/* ── 17. reserva de mapas fuera de rango ───────────────────────────────── */
emitir("reserva de mapas fuera de rango",
  lineasPorUnidades(mapas, () => 1, (t) =>
    `Auditar ${refMapas(t)}: entrada en MapInfos, metadata, coherencia de rango y ausencia de duplicados como «Map341 2.rxdata».`),
  mapas.length);

/* ── 18–22. encuentros, gráficos, música, tablas y BGM ─────────────────── */
emitir("encuentro salvaje (tabla × slot)",
  lineasPorUnidades(Array.from({ length: c.slotsEnc }, (_, i) => i), () => 1, (t) =>
    `Comprobar los slots de encuentro salvaje ${nf(t.w0 + 1)}–${nf(t.w1)} de ${nf(c.slotsEnc)}: especie válida, nivel en rango y probabilidades que sumen lo previsto.`),
  c.slotsEnc);

emitir("tablas de encuentro",
  lineasPorUnidades(Array.from({ length: c.tablasEnc }, (_, i) => i), () => 1, (t) =>
    `Comprobar las tablas de encuentro ${nf(t.w0 + 1)}–${nf(t.w1)} de ${nf(c.tablasEnc)}: mapas asociados, terreno compatible y sin pisar tablas originales.`),
  c.tablasEnc);

emitir("gráficos de personaje referenciados",
  lineasPorUnidades(mapas, () => 1, (t) =>
    `Comprobar los gráficos de personaje de ${refMapas(t)}: existencia, tamaño estándar, transparencia y mayúsculas correctas.`),
  c.graficos.length);

emitir("pistas de música referenciadas",
  lineasPorUnidades(Array.from({ length: c.bgms.length }, (_, i) => i), () => 1, (t) =>
    `Comprobar las pistas de música ${nf(t.w0 + 1)}–${nf(t.w1)} de ${nf(c.bgms.length)}: existencia, integridad, bucle sin salto y corte limpio al cambiar de mapa.`),
  c.bgms.length);

emitir("mapas con BGM",
  lineasPorUnidades(mapas, () => 1, (t) =>
    `Verificar la música asignada de ${refMapas(t)}: existencia de la pista, ausencia de herencia del mapa anterior y sin reinicio al reentrar.`),
  mapas.length);

/* ── 23. celdas: el grueso del plan, 150 por fase ──────────────────────── */
{
  let total = 0;
  for (const m of mapas) { m._ini = total; total += m.tiles; }
  const res = lineasPorUnidades(mapas, (m) => m.tiles, (t) => {
    const primera = t.tocados[0];
    const ultima = t.tocados[t.tocados.length - 1];
    if (primera.it.id === ultima.it.id) {
      const m = primera.it;
      const desde = t.w0 - primera.ini + 1;
      const hasta = t.w1 - primera.ini;
      return `Verificar transitabilidad, altura y autotile de las celdas ${nf(desde)}–${nf(hasta)} de las ${nf(m.tiles)} del mapa ${m.id}${m.nombre ? ` «${m.nombre}»` : ""} «${rangoDe(m.id)}»: sin celdas huérfanas, autotiles ausentes ni escaleras desalineadas.`;
    }
    const desde = t.w0 - primera.ini + 1;
    const hasta = t.w1 - ultima.ini;
    return `Verificar transitabilidad, altura y autotile desde la celda ${nf(desde)} del mapa ${primera.it.id}${primera.it.nombre ? ` «${primera.it.nombre}»` : ""} hasta la celda ${nf(hasta)} del mapa ${ultima.it.id}${ultima.it.nombre ? ` «${ultima.it.nombre}»` : ""} «${rangoDe(primera.it.id)}»: sin celdas huérfanas ni autotiles ausentes.`;
  });
  emitir("tiles de mapa (celdas)", res, c.tiles);
}

/* ── 24. fuzz, límites y playtest humano ───────────────────────────────── */
{
  const bloques = [
    ["fuzz de eventos (semillas)", 20000, (t) =>
      `Ejecutar el fuzz de eventos con las semillas ${nf(t.w0 + 1)}–${nf(t.w1)} de 20.000 y comprobar que ninguna deja el juego colgado, atascado ni con una partida inutilizable.`],
    ["mutación de mapas (celdas alteradas)", 50000, (t) =>
      `Ejecutar la mutación de celdas ${nf(t.w0 + 1)}–${nf(t.w1)} de 50.000 y comprobar que ninguna rompe los invariantes de partida ni escribe fuera de la copia de prueba.`],
    ["partida interrumpida en guardado (puntos de corte)", 500, (t) =>
      `Ejecutar los puntos de corte ${nf(t.w0 + 1)}–${nf(t.w1)} de 500 durante el guardado y comprobar que siempre queda una partida válida y una copia anterior recuperable.`],
    ["límites de sistema (mochila, caja, dinero, nivel, nombre)", 400, (t) =>
      `Probar los límites de sistema ${nf(t.w0 + 1)}–${nf(t.w1)} de 400 (mochila, caja, dinero, nivel y nombre) y comprobar el comportamiento previsto sin desbordes ni pérdidas silenciosas.`],
  ];
  for (const [familia, total, plantilla] of bloques) {
    emitir(familia, lineasPorUnidades(Array.from({ length: total }, (_, i) => i), () => 1, plantilla), total);
  }
  emitir("sesiones humanas de playtest con cuota de cobertura",
    lineasPorUnidades(Array.from({ length: 60 }, (_, i) => i), () => 1 + PESO_OJO, (t) =>
      `Sesiones humanas de playtest ${Math.floor(t.w0 / (1 + PESO_OJO)) + 1}–${Math.floor((t.w1 - 1) / (1 + PESO_OJO)) + 1} de 60 con cuota de cobertura: registrar celdas visitadas, eventos ejecutados, diálogos mostrados, hallazgos y tasa de descubrimiento.`),
    60 * (1 + PESO_OJO));
}

  /* ── totales ─────────────────────────────────────────────────────────── */
  let cursor = DESDE;
  for (const f of familias) { f.desde = cursor; cursor += f.lineas; f.hasta = cursor - 1; }
  const totalLineas = familias.reduce((s, f) => s + f.lineas, 0);
  const totalUnidades = familias.reduce((s, f) => s + f.unidades, 0);

  return { censo: c, mapas, familias, totalLineas, totalUnidades, desde: DESDE };
}

function main() {
  const { censo: c, mapas, familias, totalLineas, totalUnidades } = plan();
  const md = arg("--md");
if (md) {
  const trozos = [];
  let k = DESDE;
  for (const f of familias) for (const t of f.textos) { trozos.push(`${k}. ${t}`); k++; }
  fs.mkdirSync(path.dirname(md), { recursive: true });
  fs.writeFileSync(md, trozos.join("\n") + "\n");
  console.log(`escrito: ${md} — ${nf(trozos.length)} líneas, ${(fs.statSync(md).size / 1048576).toFixed(1)} MB`);
}

const manifiesto = {
  schema: "fire_ash_plan_cobertura/1.0",
  generado: new Date().toISOString().slice(0, 10),
  generadoPor: "tools/plan900/emitir_fases.mjs",
  formula: { unidadesPorFase: POR_FASE, pesoJuicioHumano: PESO_OJO, numeracionDesde: DESDE },
  censo: {
    mapas: mapas.length, eventos: c.eventos, paginas: c.paginas, comandos: c.comandos,
    celdas: c.tiles, switches: c.switches.length, variables: c.variables.length,
    graficos: c.graficos.length, bgms: c.bgms.length,
    tablasEncuentro: c.tablasEnc, slotsEncuentro: c.slotsEnc,
  },
  totales: { lineas: totalLineas, unidades: totalUnidades, desde: DESDE, hasta: DESDE + totalLineas - 1 },
  familias: familias.map((f) => ({ familia: f.familia, lineas: f.lineas, unidades: f.unidades, desde: f.desde, hasta: f.hasta })),
};
fs.mkdirSync("content", { recursive: true });
fs.writeFileSync("content/plan_cobertura_manifest.json", JSON.stringify(manifiesto, null, 1) + "\n");

console.log(`\nFASES ${nf(totalLineas)}  (${nf(DESDE)}–${nf(DESDE + totalLineas - 1)})  sobre ${nf(totalUnidades)} unidades\n`);
console.log("FAMILIA".padEnd(58), "FASES".padStart(8), "DESDE–HASTA".padStart(22));
for (const f of familias) {
  console.log(f.familia.padEnd(58), nf(f.lineas).padStart(8), `${nf(f.desde)}–${nf(f.hasta)}`.padStart(22));
}

}
if (process.argv[1] && process.argv[1].endsWith("emitir_fases.mjs")) main();
