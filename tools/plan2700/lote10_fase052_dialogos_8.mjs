#!/usr/bin/env node
/**
 * FASE 052 — Tanda 52 (tareas 5100–5199 / líneas 5100–5199 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 178 mapas declarados en cada tarea
 * (1019–1196: cierre de «Horizontes» y arranque de «Atlas Mil») por aspecto:
 * formato de caja, signos/puntuación, idioma/glosario, variables/cantidades
 * y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "052",
  tanda: 52,
  start: 5100,
  end: 5199,
  slug: "dialogos_8",
  script: "lote10_fase052_dialogos_8.mjs",
});
