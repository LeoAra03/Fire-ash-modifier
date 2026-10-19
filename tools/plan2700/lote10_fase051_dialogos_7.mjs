#!/usr/bin/env node
/**
 * FASE 051 — Tanda 51 (tareas 5000–5099 / líneas 5000–5099 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 119 mapas declarados en cada tarea
 * (901–1019: cierre de «Fire Ash original» y arranque de «Horizontes») por
 * aspecto: formato de caja, signos/puntuación, idioma/glosario,
 * variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "051",
  tanda: 51,
  start: 5000,
  end: 5099,
  slug: "dialogos_7",
  script: "lote10_fase051_dialogos_7.mjs",
});
