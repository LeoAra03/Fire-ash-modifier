#!/usr/bin/env node
/**
 * FASE 060 — Tanda 60 (tareas 5900–5999 / líneas 5900–5999 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 235 mapas de «Campañas ROM»
 * (3494–3796) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "060",
  tanda: 60,
  start: 5900,
  end: 5999,
  slug: "dialogos_16",
  script: "lote10_fase060_dialogos_16.mjs",
});
