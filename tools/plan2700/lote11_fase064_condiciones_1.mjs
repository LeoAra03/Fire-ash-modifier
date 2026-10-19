#!/usr/bin/env node
/**
 * FASE 064 — Tanda 64 (tareas 6300–6399 / líneas 6300–6399 de tareas.txt).
 *
 * Prueba estáticamente las condiciones de 100 tramos de «Fire Ash original»
 * (mapas 13–505): clasifica cada 111, detecta condiciones siempre verdaderas o
 * siempre falsas y valida los IDs de switch, variable y self-switch.
 */
import { runMixedPhase } from "./lote11_core.mjs";

runMixedPhase({
  phase: "064",
  tanda: 64,
  start: 6300,
  end: 6399,
  slug: "condiciones_1",
  script: "lote11_fase064_condiciones_1.mjs",
});
