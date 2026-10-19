# FASE 050 — tanda 94 (líneas 9300–9399 de `tareas.txt`)

## Revisión estructural

Reproducir: `node tools/plan2700/fase_050_tanda_94.mjs`

- 100 entradas con IDs consecutivos 9296–9395.
- Distribución de tareas:
- Celdas de mapas/transiciones: **100**
- Tareas de celdas/transiciones parseadas y comprobadas contra límites declarados: **100** (9 transiciones entre mapas).

## Alcance y pendientes

El script valida la integridad y los límites declarados en las tareas; no sustituye a las auditorías de datos/activos ni a una ejecución del juego. Para tareas de mapas, gráficos y música, el estado del archivo/tile/transitabilidad real debe comprobarse contra los `.rxdata`, tilesets y recursos asociados; las tareas de comportamiento requieren además el runtime. No se declara aprobada ninguna propiedad gráfica, musical, de encuentro, metadatos o transitabilidad basándose sólo en el inventario. Esas verificaciones funcionales quedan **pendientes**.
