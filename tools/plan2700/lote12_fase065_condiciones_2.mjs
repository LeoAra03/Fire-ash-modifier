#!/usr/bin/env node
/**
 * FASE 065 — Tanda 65 (tareas 6400–6499 / líneas 6400–6499 de tareas.txt).
 *
 * Prueba estáticamente las condiciones de 100 tramos (mapas de «Fire Ash
 * original», «Horizontes» y «Atlas Mil»): clasifica cada 111, detecta
 * condiciones constantes y valida los IDs de switch, variable y self-switch.
 */
import { runCoveragePhase } from "./lote12_core.mjs";

runCoveragePhase({
  phase: "065",
  tanda: 65,
  start: 6400,
  end: 6499,
  slug: "condiciones_2",
  script: "lote12_fase065_condiciones_2.mjs",
});
