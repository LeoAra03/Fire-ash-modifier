# FASE 047 — tanda 91 (líneas 9000–9099 de `tareas.txt`)

## Revisión estructural

Reproducir: `node tools/plan2700/fase_047_tanda_91.mjs`

- 100 entradas con IDs consecutivos 8996–9095.
- Distribución de tareas:
- Muestreo de estados combinatorios: **37**
- Auditoría de rangos/metadata de mapas: **24**
- Slots de encuentros salvajes: **23**
- Tablas de encuentros: **3**
- Gráficos de personaje: **13**
- Ventanas combinatorias verificadas por continuidad: **37**, tramo 256,651–262,144 de 262.144.

## Alcance y pendientes

El script valida la integridad y los límites declarados en las tareas; no sustituye a las auditorías de datos/activos ni a una ejecución del juego. Para tareas de mapas, gráficos y música, el estado del archivo/tile/transitabilidad real debe comprobarse contra los `.rxdata`, tilesets y recursos asociados; las tareas de comportamiento requieren además el runtime. No se declara aprobada ninguna propiedad gráfica, musical, de encuentro, metadatos o transitabilidad basándose sólo en el inventario. Esas verificaciones funcionales quedan **pendientes**.
