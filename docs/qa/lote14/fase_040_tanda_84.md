# FASE 040 — tanda 84 (líneas 8300–8399 de `tareas.txt`)

## Integridad del lote

Verificación reproducible: `node tools/plan2700/fase_040_tanda_84.mjs`

- 100 tareas consecutivas; IDs literales 8296–8395.
- Las 100 ventanas de 150 combinaciones son contiguas, no solapadas y tienen universo declarado de 262.144 estados.
- Ventana cubierta: **151,651–166,650**.

## Estado de la prueba funcional

La validación confirma la integridad del plan de muestreo, no la corrección funcional del juego. No hay en el repositorio un runner que materialice el estado compuesto por 7 regiones, 5 campañas y 6 dimensiones, ni un oráculo executable con resultados esperados por combinación (acceso, inventario, banderas, medallas o aspecto de Ash). No se inventan esas reglas: la ejecución funcional queda **pendiente de runtime y oráculo de estado** y no se certifica como aprobada.
