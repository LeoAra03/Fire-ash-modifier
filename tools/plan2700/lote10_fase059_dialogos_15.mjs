#!/usr/bin/env node
/**
 * FASE 059 — Tanda 59 (tareas 5800–5899 / líneas 5800–5899 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 263 mapas de «Campañas ROM»
 * (3232–3494) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "059",
  tanda: 59,
  start: 5800,
  end: 5899,
  slug: "dialogos_15",
  script: "lote10_fase059_dialogos_15.mjs",
});
