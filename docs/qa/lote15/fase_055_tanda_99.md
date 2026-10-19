# FASE 055 — tanda 99 (líneas 9800–9899 de `tareas.txt`)

## Validación estática RXDATA

Reproducir: `node tools/plan2700/fase_055_tanda_99.mjs`

- 100 tareas consecutivas, IDs 9796–9895.
- El auditor carga mapas compilados `MapNNN.rxdata`, compara el total declarado con ancho × alto, comprueba índices 1-based dentro del mapa y valida las celdas de origen/destino de transferencias entre mapas.
- El informe del script indica cuántos rangos, transiciones y mapas se comprobaron.

## Límite

Esto verifica dimensiones e índices, no la corrección de passability por tileset, altura, autotile o alineación visual de escaleras, ni ejecuta el juego. Esos aspectos siguen pendientes de auditoría específica/ejecución en runtime; no se infiere aprobación a partir de que el índice esté dentro de límites.
