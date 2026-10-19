#!/usr/bin/env node
/**
 * FASE 056 — Tanda 56 (tareas 5500–5599 / líneas 5500–5599 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 181 mapas de «Atlas Mil»
 * (1751–1931) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "056",
  tanda: 56,
  start: 5500,
  end: 5599,
  slug: "dialogos_12",
  script: "lote10_fase056_dialogos_12.mjs",
});
