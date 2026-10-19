#!/usr/bin/env node
/**
 * FASE 053 — Tanda 53 (tareas 5200–5299 / líneas 5200–5299 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 188 mapas de «Atlas Mil»
 * (1196–1383) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "053",
  tanda: 53,
  start: 5200,
  end: 5299,
  slug: "dialogos_9",
  script: "lote10_fase053_dialogos_9.mjs",
});
