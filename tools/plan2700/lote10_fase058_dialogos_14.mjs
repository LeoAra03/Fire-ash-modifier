#!/usr/bin/env node
/**
 * FASE 058 — Tanda 58 (tareas 5700–5799 / líneas 5700–5799 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 268 mapas declarados en cada tarea
 * (2135–3232: cierre de «Dimensional Nightmare», «Mapas nuevos del DLC» y
 * tramo de «Campañas ROM») por aspecto: formato de caja, signos/puntuación,
 * idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "058",
  tanda: 58,
  start: 5700,
  end: 5799,
  slug: "dialogos_14",
  script: "lote10_fase058_dialogos_14.mjs",
});
