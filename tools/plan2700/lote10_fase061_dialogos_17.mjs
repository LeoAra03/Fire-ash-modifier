#!/usr/bin/env node
/**
 * FASE 061 — Tanda 61 (tareas 6000–6099 / líneas 6000–6099 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 285 mapas de «Campañas ROM»
 * (3796–4135) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "061",
  tanda: 61,
  start: 6000,
  end: 6099,
  slug: "dialogos_17",
  script: "lote10_fase061_dialogos_17.mjs",
});
