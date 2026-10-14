#!/usr/bin/env node
/**
 * cobertura.mjs — mide la cobertura REAL del proyecto y muestra de dónde sale
 * el número de fases. No calcula nada por su cuenta: usa el mismo plan() que
 * emite las fases, para que las dos cifras no puedan divergir.
 *
 * Uso:
 *   node tools/plan900/cobertura.mjs           → informe legible
 *   node tools/plan900/cobertura.mjs --json    → JSON para CI
 */
import { plan, POR_FASE, PESO_OJO, DESDE } from "./emitir_fases.mjs";
import { nf } from "./censo_lib.mjs";

const p = plan();
const { censo: c, mapas, familias, totalLineas, totalUnidades } = p;

const salida = {
  generado: new Date().toISOString().slice(0, 10),
  formula: { unidadesPorFase: POR_FASE, pesoJuicioHumano: PESO_OJO, numeracionDesde: DESDE },
  censo: {
    mapas: mapas.length, eventos: c.eventos, paginas: c.paginas, comandos: c.comandos,
    celdas: c.tiles, switches: c.switches.length, variables: c.variables.length,
    graficos: c.graficos.length, bgms: c.bgms.length,
    tablasEncuentro: c.tablasEnc, slotsEncuentro: c.slotsEnc,
  },
  campos: c.campos,
  totales: { lineas: totalLineas, unidades: totalUnidades, desde: DESDE, hasta: DESDE + totalLineas - 1 },
  familias: familias.map((f) => ({ familia: f.familia, lineas: f.lineas, unidades: f.unidades, desde: f.desde, hasta: f.hasta })),
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(salida, null, 1));
  process.exit(0);
}

console.log(`CENSO  mapas ${nf(mapas.length)} · eventos ${nf(c.eventos)} · páginas ${nf(c.paginas)} · comandos ${nf(c.comandos)} · celdas ${nf(c.tiles)}`);
console.log(`       switches ${nf(c.switches.length)} · variables ${nf(c.variables.length)} · gráficos ${nf(c.graficos.length)} · BGM ${nf(c.bgms.length)}`);
console.log(`       tablas de encuentro ${nf(c.tablasEnc)} con ${nf(c.slotsEnc)} slots\n`);
console.log("FAMILIA".padEnd(58), "UNIDADES".padStart(11), "FASES".padStart(8), "DESDE–HASTA".padStart(22));
for (const f of familias) {
  console.log(f.familia.padEnd(58), nf(f.unidades).padStart(11), nf(f.lineas).padStart(8), `${nf(f.desde)}–${nf(f.hasta)}`.padStart(22));
}
console.log(`\nTOTAL ${nf(totalUnidades)} unidades de cobertura`);
console.log(`1 fase = ${POR_FASE} unidades · el juicio humano pesa ×${PESO_OJO}`);
console.log(`FASES ${nf(totalLineas)}  (${nf(DESDE)}–${nf(DESDE + totalLineas - 1)})`);
console.log(`regenerar el listado:  node tools/plan900/emitir_fases.mjs --md docs/PLAN_COBERTURA_FASES.md`);
