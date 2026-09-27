# Referencia visual — Macrociclo Atlas 01

## Alcance

Este macrociclo reúne cinco lotes visuales de cinco mapas y cubre las anclas 01–25, mapas 1021–1621.

La pasada añade una composición de piso relacionada con cada episodio: anillos, umbrales, rastros, mosaicos, ondas, divisiones o constelaciones. Se reutilizan exclusivamente tiles presentes en los tilesets instalados de Fire Ash.

Resultados verificables:

- 5 lotes visuales;
- 25 anclas modificadas;
- 249 celdas de piso modificadas;
- 9 motivos con patrón geométrico exacto;
- 16 motivos adaptados a la superficie transitable disponible del mapa heredado;
- 0 eventos movidos;
- 0 cambios de pasabilidad;
- 0 cambios de prioridad;
- 0 cambios de terrain tag;
- dimensiones y tilesets preservados;
- retorno a Puerto Horizonte preservado.

El detalle exacto de cada celda, tile anterior, tile nuevo, intención narrativa y hashes está en `content/atlas_visual_polish_macro01.json`.

## PNG para crítica

- `docs/referencia_visual_atlas_macro01_antes.png`
- `docs/referencia_visual_atlas_macro01_despues.png`

Los recuadros amarillos son una anotación de revisión: señalan las celdas intervenidas y no forman parte del mapa jugable. Las imágenes muestran el primer frame de autotiles y sprites para permitir una comparación estática rápida.

## Límites

Estas imágenes son referencias criticables, no una certificación visual final. No pueden validar:

- clipping durante movimiento;
- prioridad percibida con animaciones;
- ritmo al recorrer el mapa;
- transiciones y fundidos;
- legibilidad bajo todas las páginas de evento;
- comportamiento exacto dentro de `Game.exe`.

Los 25 mapas superan las comprobaciones estáticas, pero siguen marcados como `customized-needs-game-preview`. Los otros 15 mapas Tier 1 conservan todavía geometría fuente exacta y forman los tres lotes visuales pendientes.

## Reversión

El backup local anterior a esta pasada está en:

`pokemon_fire_ash/PokeModBackups/atlas_visual_macro01_originals/`

Restaurar los 25 `MapNNNN.rxdata` de esa carpeta revierte únicamente este macrociclo visual.
