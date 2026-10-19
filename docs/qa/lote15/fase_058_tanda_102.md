# FASE 058 — tanda 102 (líneas 10100–10199 de `tareas.txt`)

## Validación estática RXDATA

Reproducir: `node tools/plan2700/fase_058_tanda_102.mjs`

- 100 tareas consecutivas; IDs 10096–10195.
- El auditor carga mapas compilados `MapNNN.rxdata`, compara el total declarado con ancho × alto, comprueba índices 1-based dentro del mapa y valida los índices de origen/destino en las transiciones.
- El script informa rangos, transiciones y mapas comprobados.

## Límite

Se verifican dimensiones e índices, no passability por tileset, altura, autotile, alineación visual de escaleras ni comportamiento en el juego. Esos aspectos requieren auditoría específica y/o runtime; no se consideran aprobados por esta comprobación.
