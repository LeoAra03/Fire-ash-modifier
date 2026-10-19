#!/usr/bin/env node
/**
 * FASE 055 — Tanda 55 (tareas 5400–5499 / líneas 5400–5499 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 181 mapas de «Atlas Mil»
 * (1571–1751) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "055",
  tanda: 55,
  start: 5400,
  end: 5499,
  slug: "dialogos_11",
  script: "lote10_fase055_dialogos_11.mjs",
});
