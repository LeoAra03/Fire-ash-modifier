#!/usr/bin/env node
/**
 * FASE 068 — Tanda 68 (tareas 6700–6799 / líneas 6700–6799 de tareas.txt).
 *
 * Recorre las transferencias de 100 tramos de mapas en ambos sentidos:
 * destino existente, coordenadas en rango, dirección válida, vuelta
 * declarada y celda de llegada transitable según el tileset.
 */
import { runCoveragePhase } from "./lote12_core.mjs";

runCoveragePhase({
  phase: "068",
  tanda: 68,
  start: 6700,
  end: 6799,
  slug: "transferencias_1",
  script: "lote12_fase068_transferencias_1.mjs",
});
