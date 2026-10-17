# FASE 025 — entrega ZIP, idioma y accesibilidad (IDs 2400–2499)

## Auditoría reproducible

```text
node tools/plan2700/lote5_fase025_texto_accesibilidad.mjs
node tools/plan2700/lote5_fase025_texto_accesibilidad.mjs --verify
npm run verify:dialogos:queue
npm run verify:glosario
npm run verify:canon:arceus
npm run verify:tone-safety
```

La corrida cubre **19 801 cajas**, **67 hablantes**, **5208 elecciones**,
**1317 especies** y **1051 objetos** del catálogo. Encontró 0 fugas de rutas,
0 variables vacías, 0 variantes de nombre de hablante y 0 elecciones vacías.

Hay 200 candidatos de inglés, 100 preguntas sin `¿`, 148 exclamaciones sin
`¡`, 5 identificadores con guion bajo y 6 menciones de jerga técnica. Se
publican con mapa/evento/página para revisión contextual; no se reescriben
nombres propios, mensajes técnicos o citas de catálogo por expresión regular.

Las dos elecciones con más de cuatro opciones pertenecen al vestidor de Map003
(8 y 6 opciones). Son menús paginados/funcionales, no cajas narrativas; quedan
marcadas como excepción de diseño y revisión visual en el JSON.

## Entregables de idioma y accesibilidad

- `docs/qa/estilo_texto.md`: reglas, glosario, puntuación y ejemplos.
- `docs/qa/rendimiento.md`: medición estática de FASE 024 y sus límites.
- `docs/qa/revision_externa.md`: hoja para una persona ajena al proyecto.
- `docs/qa/acta_revision_externa.md`: acta y resolución de hallazgos, pendiente
  de revisión humana.
- `docs/qa/lote5/recuperacion_partida.md`: recuperación segura de guardados.

El JSON separa comprobaciones estáticas de contraste, tamaño de fuente,
lectura temporal, mando, Android y dependencia del color/sonido, que exigen
prueba humana. No se marca la revisión externa como realizada.
