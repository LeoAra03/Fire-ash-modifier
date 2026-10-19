#!/usr/bin/env node
/**
 * FASE 050 — Tanda 50 (tareas 4900–4999 / líneas 4900–4999 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 271 mapas de «Fire Ash original»
 * (631–901) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "050",
  tanda: 50,
  start: 4900,
  end: 4999,
  slug: "dialogos_6",
  script: "lote10_fase050_dialogos_6.mjs",
});
