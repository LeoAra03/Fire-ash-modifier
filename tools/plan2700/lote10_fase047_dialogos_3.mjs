#!/usr/bin/env node
/**
 * FASE 047 — Tanda 47 (tareas 4600–4699 / líneas 4600–4699 de tareas.txt).
 *
 * Muestra y comprueba los diálogos de los mapas de «Fire Ash original»
 * declarados en cada tarea (151 «GRANDEUR LOUNGE», 162 «Game Corner»,
 * 171 «Wyndon», 177 «Wyndon Stadium», 214 «STAGE», 153–214, etc.) por
 * aspecto: formato de caja, signos/puntuación, idioma/glosario,
 * variables/cantidades y muestras para lectura humana.
 */
import { runPhase } from "./lote10_dialogos_core.mjs";

runPhase({
  phase: "047",
  tanda: 47,
  start: 4600,
  end: 4699,
  slug: "dialogos_3",
  script: "lote10_fase047_dialogos_3.mjs",
});
