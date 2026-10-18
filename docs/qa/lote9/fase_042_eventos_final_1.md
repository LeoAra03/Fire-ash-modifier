# FASE 042 — Eventos en página final con estado avanzado (tramo 4100–4199)

## Reproducción

```bash
node tools/plan2700/lote9_fase042_eventos_final_1.mjs
node tools/plan2700/lote9_fase042_eventos_final_1.mjs --verify
```

## Alcance y resumen medido

- **Tareas procesadas**: 100 (`4100–4199`, más líneas de borde `4096–4099` indexadas).
- **Mapas únicos cubiertos**: 1278 (rango `285–1562`: «Fire Ash original», «Horizontes» y «Atlas Mil»).
- **Eventos evaluados en su página final**: 17816 (8644 multipágina, 0 con condición de estado avanzado).
- **Banderas comprobadas**: lecturas `s=30`, `v=1004`, `self=32` · escrituras `s=271`, `v=215`, `self=40` · IDs inválidos: **0**.
- **Salidas comprobadas**: 17816/17816 páginas cerradas con `code 0`, 4142 transferencias verificadas, **0** destinos inválidos.
- **Textos en página final**: 12843 bloques `101/401` y 1 mensajes de script, **0** caracteres corruptos (``).

## Desglose por familia declarada

| Familia | Tareas | Rango de mapas | Eventos (suma por tarea) | Páginas finales condicionadas | Transferencias | Bloques de texto |
|---|---:|---|---:|---:|---:|---:|
| Fire Ash original | 73 | 285–1001 | 13495 | 0 | 2367 | 8440 |
| Horizontes | 4 | 1001–1029 | 735 | 0 | 119 | 750 |
| Atlas Mil | 23 | 1030–1562 | 3586 | 0 | 1656 | 3653 |

## Límite honesto

Este verificador comprueba los datos compilados (`Map*.rxdata`, `MapInfos.rxdata`, `System.rxdata`) en la página final de cada evento inyectando las condiciones de estado avanzado. La corrida interactiva dentro de `Game.exe` permanece como `runtime_pending`.
