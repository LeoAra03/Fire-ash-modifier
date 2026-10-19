#!/usr/bin/env node
/**
 * FASE 048 — Tanda 48 (tareas 4700–4799 / líneas 4700–4799 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los mapas de «Fire Ash original»
 * declarados en cada tarea (con predominio de los tramos de «STAGE» 214
 * y de los mapas 214–303) por aspecto: formato de caja, signos/puntuación,
 * idioma/glosario, variables/cantidades y muestras para lectura humana.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "048",
  tanda: 48,
  start: 4700,
  end: 4799,
  slug: "dialogos_4",
  script: "lote10_fase048_dialogos_4.mjs",
});
