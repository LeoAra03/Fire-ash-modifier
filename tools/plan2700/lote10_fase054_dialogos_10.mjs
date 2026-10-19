#!/usr/bin/env node
/**
 * FASE 054 — Tanda 54 (tareas 5300–5399 / líneas 5300–5399 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 189 mapas de «Atlas Mil»
 * (1383–1571) declarados en cada tarea por aspecto: formato de caja,
 * signos/puntuación, idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "054",
  tanda: 54,
  start: 5300,
  end: 5399,
  slug: "dialogos_10",
  script: "lote10_fase054_dialogos_10.mjs",
});
