#!/usr/bin/env node
/**
 * FASE 063 — Tanda 63 (tareas 6200–6299 / líneas 6200–6299 de tareas.txt).
 *
 * Tramo mixto: cierra los diálogos de «Campañas ROM» (6200–6227) y recorre
 * las elecciones de 72 tramos de todas las familias (6228–6299), comprobando
 * que cada opción declarada tiene su rama 402 con cuerpo y que ninguna queda
 * sin resolver.
 */
import { runMixedPhase } from "./lote11_core.mjs";

runMixedPhase({
  phase: "063",
  tanda: 63,
  start: 6200,
  end: 6299,
  slug: "elecciones_1",
  script: "lote11_fase063_elecciones_1.mjs",
});
