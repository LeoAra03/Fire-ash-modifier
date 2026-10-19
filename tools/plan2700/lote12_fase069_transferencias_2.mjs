#!/usr/bin/env node
/**
 * FASE 069 — Tanda 69 (tareas 6800–6899 / líneas 6800–6899 de tareas.txt).
 *
 * Recorre las transferencias de 100 tramos de «Campañas ROM» en ambos
 * sentidos: destino existente, coordenadas en rango, dirección válida,
 * vuelta declarada y celda de llegada transitable según el tileset.
 */
import { runCoveragePhase } from "./lote12_core.mjs";

runCoveragePhase({
  phase: "069",
  tanda: 69,
  start: 6800,
  end: 6899,
  slug: "transferencias_2",
  script: "lote12_fase069_transferencias_2.mjs",
  notes: [
    "Las transferencias automáticas de «Campañas ROM» («Tramo anterior», «Tramo siguiente» y «Warp N») aterrizan casi todas en la celda **(2,2)** del mapa destino, que el tileset marca como no transitable y sin vecino transitable. Es un patrón sistemático de los mapas generados, no un caso aislado.",
    "El «Retorno libre» de las campañas apunta a «Puerto Horizonte» (mapa 1001) en (31,27); también cae sobre celda sólida según el tileset, por lo que conviene revisarlo junto con el resto del patrón.",
    "Estos hallazgos son estáticos: se confirman o descartan al recorrer las campañas dentro de `Game.exe`.",
  ],
});
