# FASE 049 — tanda 93 (líneas 9200–9299 de `tareas.txt`)

## Revisión estructural

Reproducir: `node tools/plan2700/fase_049_tanda_93.mjs`

- 100 entradas con IDs consecutivos 9196–9295.
- Distribución de tareas:
- Celdas de mapas/transiciones: **100**
- Tareas de celdas/transiciones parseadas y comprobadas contra límites declarados: **100** (14 transiciones entre mapas).

## Alcance y pendientes

El script valida la integridad y los límites declarados en las tareas; no sustituye a las auditorías de datos/activos ni a una ejecución del juego. Para tareas de mapas, gráficos y música, el estado del archivo/tile/transitabilidad real debe comprobarse contra los `.rxdata`, tilesets y recursos asociados; las tareas de comportamiento requieren además el runtime. No se declara aprobada ninguna propiedad gráfica, musical, de encuentro, metadatos o transitabilidad basándose sólo en el inventario. Esas verificaciones funcionales quedan **pendientes**.
