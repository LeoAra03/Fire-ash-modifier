#!/usr/bin/env node
/**
 * FASE 049 — Tanda 49 (tareas 4800–4899 / líneas 4800–4899 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los mapas de «Fire Ash original»
 * declarados en cada tarea (cierre del bloque «STAGE» y avance por los
 * mapas 303–631) por aspecto: formato de caja, signos/puntuación,
 * idioma/glosario, variables/cantidades y muestras para lectura humana.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "049",
  tanda: 49,
  start: 4800,
  end: 4899,
  slug: "dialogos_5",
  script: "lote10_fase049_dialogos_5.mjs",
});
