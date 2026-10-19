# FASE 068 — Tanda 68 (tramo 6700–6799)

## Reproducción

```bash
node tools/plan2700/lote12_fase068_transferencias_1.mjs
node tools/plan2700/lote12_fase068_transferencias_1.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · transferencias: 100.
- **Mapas únicos cubiertos**: 1756 (mapas 543–3060) · familias: «Atlas Mil», «Campañas ROM», «Dimensional Nightmare», «Fire Ash original», «Horizontes», «Mapas nuevos del DLC», «Ruta de Dios + Silver».

## Transferencias en ambos sentidos

- **Tareas**: 100 · **mapas**: 1756 · **transferencias (201)**: 8829 · celdas con passability comprobada: 8829.
- **Mapa destino ausente**: 0 · **coordenada fuera de rango**: 0 · **celda sólida con salida**: 426 · **celda sólida sin salida** (riesgo de bloqueo): 308 · **celda sólida en mapa íntegramente sólido**: 0 · **dirección inválida**: 0.
- **Vuelta declarada**: 7250 · **sin vuelta**: 1434 · **transferencias al mismo mapa**: 145.

### Transferencias con hallazgo (muestra)

| Tarea | Mapa origen | Ev | Tipo | Destino | Celda |
|---:|---:|---|---|---|---|
| 6721 | 749 | Event | trapped-destination | 743 | 64,19 |
| 6721 | 749 | Event | trapped-destination | 743 | 64,20 |
| 6744 | 1040 | Next Atlas Map | trapped-destination | 1041 | 16,1 |
| 6744 | 1042 | Previous Atlas Map | trapped-destination | 1041 | 16,1 |
| 6749 | 1155 | Next Atlas Map | trapped-destination | 1156 | 19,20 |
| 6749 | 1157 | Previous Atlas Map | trapped-destination | 1156 | 19,20 |
| 6752 | 1221 | Next Atlas Map | trapped-destination | 1222 | 39,11 |
| 6752 | 1222 | Next Atlas Map | trapped-destination | 1223 | 16,1 |
| 6752 | 1223 | Previous Atlas Map | trapped-destination | 1222 | 39,11 |
| 6752 | 1223 | Next Atlas Map | trapped-destination | 1224 | 16,1 |
| 6752 | 1224 | Previous Atlas Map | trapped-destination | 1223 | 16,1 |
| 6752 | 1225 | Previous Atlas Map | trapped-destination | 1224 | 16,1 |

## Tareas con hallazgos

| Tarea | Tipo | Rango | Estado |
|---:|---|---|---|
| 6700 | transferencias | 543–551 | `static_review_runtime_pending` |
| 6701 | transferencias | 551–555 | `static_review_runtime_pending` |
| 6706 | transferencias | 599–613 | `static_review_runtime_pending` |
| 6707 | transferencias | 614–627 | `static_review_runtime_pending` |
| 6708 | transferencias | 627–643 | `static_review_runtime_pending` |
| 6721 | transferencias | 745–761 | `static_review_runtime_pending` |
| 6722 | transferencias | 761–793 | `static_review_runtime_pending` |
| 6733 | transferencias | 861–877 | `static_review_runtime_pending` |
| 6734 | transferencias | 877–892 | `static_review_runtime_pending` |
| 6735 | transferencias | 893–900 | `static_review_runtime_pending` |
| 6736 | transferencias | 901–912 | `static_review_runtime_pending` |
| 6737 | transferencias | 914–935 | `static_review_runtime_pending` |

## Límite honesto

Todo se mide sobre los `.rxdata` compilados y las tablas de passability del tileset: no se abre `Game.exe` ni se juega ninguna partida. «Dos estados» acredita que el proyecto contiene escrituras de ON y de OFF para ese ID, no que ambos caminos se hayan recorrido en ejecución. En las transferencias, aterrizar sobre una celda no transitable puede ser deliberado en escenas guionizadas: se marca como revisión, no como defecto. La comprobación interactiva (con y sin partida avanzada) permanece como `runtime_pending`.
