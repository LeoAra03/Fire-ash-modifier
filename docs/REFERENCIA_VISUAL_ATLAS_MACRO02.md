# Referencia visual — Macrociclo Atlas 02

## Alcance

Este macrociclo reúne los tres lotes visuales restantes de cinco mapas y cubre las anclas 26–40, mapas 1646–1996.

La pasada añade composiciones de piso vinculadas a cada episodio: espirales, divisiones, ondas, dameros, constelaciones, rastros y un anillo de convergencia. Reutiliza exclusivamente tiles presentes en los tilesets instalados de Fire Ash.

Resultados verificables:

- 3 lotes visuales;
- 15 anclas modificadas;
- 148 celdas de piso modificadas;
- 0 eventos movidos;
- 0 cambios de pasabilidad;
- 0 cambios de prioridad;
- 0 cambios de terrain tag;
- dimensiones y tilesets preservados;
- desafío, curación y retorno a Puerto Horizonte preservados.

Con el macrociclo 01, el total acumulado es de 8 lotes, 40/40 anclas con composición propia y 397 celdas narrativas intervenidas. El detalle de cada celda, tile anterior, tile nuevo, intención y hashes está en `content/atlas_visual_polish_macro02.json`.

## PNG para crítica

- `docs/referencia_visual_atlas_macro02_antes.png`
- `docs/referencia_visual_atlas_macro02_despues.png`

Los recuadros amarillos señalan las celdas intervenidas para facilitar la comparación; son anotaciones y no forman parte de los mapas jugables. La referencia usa el primer frame de autotiles y sprites, y muestra una ventana de 20 × 14 tiles alrededor de cada motivo.

Los PNG se pueden regenerar con:

```bash
npm ci
node tools/render_atlas_visual_reference.mjs --macro 02
```

## Límites

Estas imágenes son referencias criticables, no assets nuevos ni certificación visual final. No pueden validar:

- clipping durante movimiento;
- prioridad percibida con animaciones;
- ritmo al recorrer el mapa;
- transiciones y fundidos;
- legibilidad bajo todas las páginas de evento;
- comportamiento exacto dentro de `Game.exe`.

Los 15 mapas superan las comprobaciones estáticas y quedan clasificados como `customized-needs-game-preview`. Sumados al macrociclo anterior, las 40 anclas continúan requiriendo revisión artística y prueba manual dentro de `Game.exe`.

## Reversión

El backup local anterior a esta pasada está en:

`pokemon_fire_ash/PokeModBackups/atlas_visual_macro02_originals/`

Restaurar los 15 `MapNNNN.rxdata` de esa carpeta revierte únicamente este macrociclo visual.
