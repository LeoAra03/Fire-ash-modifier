#!/usr/bin/env node
/**
 * FASE 067 — Tanda 67 (tareas 6600–6699 / líneas 6600–6699 de tareas.txt).
 *
 * Continúa la comprobación de self-switches por mapa, evento y letra (56
 * tramos) y estrena el recorrido de transferencias (44 tramos): destino
 * existente, coordenadas en rango, dirección válida, vuelta declarada y
 * celda de llegada transitable según el tileset.
 */
import { runCoveragePhase } from "./lote12_core.mjs";

runCoveragePhase({
  phase: "067",
  tanda: 67,
  start: 6600,
  end: 6699,
  slug: "estados_2",
  script: "lote12_fase067_estados_2.mjs",
});
