#!/usr/bin/env node
/**
 * FASE 062 — Tanda 62 (tareas 6100–6199 / líneas 6100–6199 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 231 mapas de «Campañas ROM»
 * (4135–4365) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "062",
  tanda: 62,
  start: 6100,
  end: 6199,
  slug: "dialogos_18",
  script: "lote10_fase062_dialogos_18.mjs",
});
