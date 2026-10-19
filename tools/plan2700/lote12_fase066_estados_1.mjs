#!/usr/bin/env node
/**
 * FASE 066 — Tanda 66 (tareas 6500–6599 / líneas 6500–6599 de tareas.txt).
 *
 * Cierra 24 tramos de «Probar las condiciones», comprueba 12 rangos de
 * switches en sus dos estados (ON/OFF, con y sin partida avanzada), 5 rangos
 * de variables en valores límite y 79 tramos de self-switches por mapa,
 * evento y letra.
 */
import { runCoveragePhase } from "./lote12_core.mjs";

runCoveragePhase({
  phase: "066",
  tanda: 66,
  start: 6500,
  end: 6599,
  slug: "estados_1",
  script: "lote12_fase066_estados_1.mjs",
});
