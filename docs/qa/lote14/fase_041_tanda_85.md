# FASE 041 — tanda 85 (líneas 8400–8499 de `tareas.txt`)

## Integridad del lote

Verificación reproducible: `node tools/plan2700/fase_041_tanda_85.mjs`

- 100 tareas consecutivas; IDs literales 8396–8495.
- Las 100 ventanas de 150 combinaciones son contiguas, no solapadas y tienen universo declarado de 262.144 estados.
- Ventana cubierta: **166,651–181,650**.

## Estado de la prueba funcional

La validación confirma la integridad del plan de muestreo, no la corrección funcional del juego. No hay en el repositorio un runner que materialice el estado compuesto por 7 regiones, 5 campañas y 6 dimensiones, ni un oráculo executable con resultados esperados por combinación (acceso, inventario, banderas, medallas o aspecto de Ash). No se inventan esas reglas: la ejecución funcional queda **pendiente de runtime y oráculo de estado** y no se certifica como aprobada.
