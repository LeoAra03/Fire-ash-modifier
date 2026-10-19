# FASE 067 — Tanda 67 (tramo 6600–6699)

## Reproducción

```bash
node tools/plan2700/lote12_fase067_estados_2.mjs
node tools/plan2700/lote12_fase067_estados_2.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · self-switches: 55 · transferencias: 45.
- **Mapas únicos cubiertos**: 3092 (mapas 1–4419) · familias: «Atlas Mil», «Campañas ROM», «Dimensional Nightmare», «Fire Ash original», «Horizontes», «Mapas nuevos del DLC».

## Self-switches por evento y letra

- **Tareas**: 55 · **mapas**: 2550 · **eventos**: 23393 (3807 usan self-switches).
- **Claves evento+letra**: 4211 · lecturas: 13 · escrituras: 4470.
- **Leídos sin escritor** (dependen de estado externo): 0 · **escritos y nunca leídos**: 4198.
- **Sin ambos estados**: 4037 · **letras inválidas**: 56.

## Transferencias en ambos sentidos

- **Tareas**: 45 · **mapas**: 542 · **transferencias (201)**: 4483 · celdas con passability comprobada: 4483.
- **Mapa destino ausente**: 0 · **coordenada fuera de rango**: 0 · **celda sólida en mapa transitable**: 16 · **celda sólida en mapa íntegramente sólido**: 11 · **dirección inválida**: 0.
- **Vuelta declarada**: 4156 · **sin vuelta**: 116 · **transferencias al mismo mapa**: 211.

### Transferencias con hallazgo (muestra)

| Tarea | Mapa origen | Ev | Tipo | Destino | Celda |
|---:|---:|---|---|---|---|
| 6657 | 48 | Door | solid-destination | 786 | 16,16 |
| 6657 | 58 | Single battles NPC | solid-destination | 59 | 2,8 |
| 6657 | 58 | Single battles NPC | solid-destination | 59 | 2,8 |
| 6657 | 58 | Double battles NPC | solid-destination | 59 | 2,8 |
| 6657 | 58 | Double battles NPC | solid-destination | 59 | 2,8 |
| 6657 | 62 | Single battles NPC | solid-destination | 63 | 4,9 |
| 6658 | 62 | Single battles NPC | solid-destination | 63 | 4,9 |
| 6658 | 62 | Single battles NPC | solid-destination | 63 | 4,9 |
| 6658 | 62 | Double battles NPC | solid-destination | 63 | 4,9 |
| 6658 | 62 | Double battles NPC | solid-destination | 63 | 4,9 |
| 6658 | 63 | Guide | solid-destination | 64 | 2,10 |
| 6658 | 63 | Guide | solid-destination | 64 | 2,10 |

## Tareas con hallazgos

| Tarea | Tipo | Rango | Estado |
|---:|---|---|---|
| 6631 | self-switches | 2018–2044 | `static_review_runtime_pending` |
| 6632 | self-switches | 2044–2056 | `static_review_runtime_pending` |
| 6633 | self-switches | 2056–2069 | `static_review_runtime_pending` |
| 6634 | self-switches | 2069–2079 | `static_review_runtime_pending` |
| 6635 | self-switches | 2079–2092 | `static_review_runtime_pending` |
| 6636 | self-switches | 2092–2104 | `static_review_runtime_pending` |
| 6637 | self-switches | 2104–2122 | `static_review_runtime_pending` |
| 6638 | self-switches | 2122–2136 | `static_review_runtime_pending` |
| 6639 | self-switches | 2137–2153 | `static_review_runtime_pending` |
| 6640 | self-switches | 2153–2166 | `static_review_runtime_pending` |
| 6641 | self-switches | 2166–2179 | `static_review_runtime_pending` |
| 6642 | self-switches | 2179–2252 | `static_review_runtime_pending` |

## Límite honesto

Todo se mide sobre los `.rxdata` compilados y las tablas de passability del tileset: no se abre `Game.exe` ni se juega ninguna partida. «Dos estados» acredita que el proyecto contiene escrituras de ON y de OFF para ese ID, no que ambos caminos se hayan recorrido en ejecución. La comprobación interactiva (con y sin partida avanzada) permanece como `runtime_pending`.
