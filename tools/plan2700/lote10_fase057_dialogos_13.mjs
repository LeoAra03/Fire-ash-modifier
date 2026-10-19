#!/usr/bin/env node
/**
 * FASE 057 — Tanda 57 (tareas 5600–5699 / líneas 5600–5699 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los 204 mapas declarados en cada tarea
 * (1931–2135: cierre de «Atlas Mil», «Ruta de Dios + Silver» y arranque de
 * «Dimensional Nightmare») por aspecto: formato de caja, signos/puntuación,
 * idioma/glosario, variables/cantidades y sentido.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "057",
  tanda: 57,
  start: 5600,
  end: 5699,
  slug: "dialogos_13",
  script: "lote10_fase057_dialogos_13.mjs",
});
