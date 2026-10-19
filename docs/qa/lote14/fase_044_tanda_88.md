# FASE 044 — tanda 88 (líneas 8700–8799 de `tareas.txt`)

## Integridad del lote

Verificación reproducible: `node tools/plan2700/fase_044_tanda_88.mjs`

- 100 tareas consecutivas; IDs literales 8696–8795.
- Las 100 ventanas de 150 combinaciones son contiguas, no solapadas y tienen universo declarado de 262.144 estados.
- Ventana cubierta: **211,651–226,650**.

## Estado de la prueba funcional

La validación confirma la integridad del plan de muestreo, no la corrección funcional del juego. No hay en el repositorio un runner que materialice el estado compuesto por 7 regiones, 5 campañas y 6 dimensiones, ni un oráculo executable con resultados esperados por combinación (acceso, inventario, banderas, medallas o aspecto de Ash). No se inventan esas reglas: la ejecución funcional queda **pendiente de runtime y oráculo de estado** y no se certifica como aprobada.
