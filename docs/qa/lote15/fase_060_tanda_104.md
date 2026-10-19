# FASE 060 — tanda 104 (líneas 10300–10399 de `tareas.txt`)

## Validación estática RXDATA

Reproducir: `node tools/plan2700/fase_060_tanda_104.mjs`

- 100 tareas consecutivas; IDs 10296–10395.
- El auditor carga mapas compilados `MapNNN.rxdata`, compara el total declarado con ancho × alto, comprueba índices 1-based dentro del mapa y valida los índices de origen/destino en las transiciones.
- El script informa rangos, transiciones y mapas comprobados.

## Límite

Se verifican dimensiones e índices, no passability por tileset, altura, autotile, alineación visual de escaleras ni comportamiento en el juego. Esos aspectos requieren auditoría específica y/o runtime; no se consideran aprobados por esta comprobación.
