# FASE 046 — tanda 90 (líneas 8900–8999 de `tareas.txt`)

## Revisión estructural

Reproducir: `node tools/plan2700/fase_046_tanda_90.mjs`

- 100 entradas con IDs consecutivos 8896–8995.
- Distribución de tareas:
- Muestreo de estados combinatorios: **100**
- Ventanas combinatorias verificadas por continuidad: **100**, tramo 241,651–256,650 de 262.144.

## Alcance y pendientes

El script valida la integridad y los límites declarados en las tareas; no sustituye a las auditorías de datos/activos ni a una ejecución del juego. Para tareas de mapas, gráficos y música, el estado del archivo/tile/transitabilidad real debe comprobarse contra los `.rxdata`, tilesets y recursos asociados; las tareas de comportamiento requieren además el runtime. No se declara aprobada ninguna propiedad gráfica, musical, de encuentro, metadatos o transitabilidad basándose sólo en el inventario. Esas verificaciones funcionales quedan **pendientes**.
