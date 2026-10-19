# FASE 069 — Tanda 69 (tramo 6800–6899)

## Reproducción

```bash
node tools/plan2700/lote12_fase069_transferencias_2.mjs
node tools/plan2700/lote12_fase069_transferencias_2.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · transferencias: 100.
- **Mapas únicos cubiertos**: 1081 (mapas 3061–4334) · familias: «Campañas ROM».

## Observaciones de la tanda

- Las transferencias automáticas de «Campañas ROM» («Tramo anterior», «Tramo siguiente» y «Warp N») aterrizan casi todas en la celda **(2,2)** del mapa destino, que el tileset marca como no transitable y sin vecino transitable. Es un patrón sistemático de los mapas generados, no un caso aislado.
- El «Retorno libre» de las campañas apunta a «Puerto Horizonte» (mapa 1001) en (31,27); también cae sobre celda sólida según el tileset, por lo que conviene revisarlo junto con el resto del patrón.
- Estos hallazgos son estáticos: se confirman o descartan al recorrer las campañas dentro de `Game.exe`.

## Transferencias en ambos sentidos

- **Tareas**: 100 · **mapas**: 1081 · **transferencias (201)**: 8543 · celdas con passability comprobada: 8543.
- **Mapa destino ausente**: 0 · **coordenada fuera de rango**: 0 · **celda sólida con salida**: 5035 · **celda sólida sin salida** (riesgo de bloqueo): 3562 · **celda sólida en mapa íntegramente sólido**: 0 · **dirección inválida**: 0.
- **Vuelta declarada**: 6045 · **sin vuelta**: 2492 · **transferencias al mismo mapa**: 6.

### Transferencias con hallazgo (muestra)

| Tarea | Mapa origen | Ev | Tipo | Destino | Celda |
|---:|---:|---|---|---|---|
| 6800 | 3061 | PokeMod Campaña ROM: Tramo siguiente | trapped-destination | 3062 | 2,2 |
| 6800 | 3061 | PokeMod Campaña ROM: Warp 1 | trapped-destination | 3062 | 2,2 |
| 6800 | 3062 | PokeMod Campaña ROM: Tramo anterior | trapped-destination | 3061 | 2,2 |
| 6800 | 3063 | PokeMod Campaña ROM: Tramo anterior | trapped-destination | 3062 | 2,2 |
| 6800 | 3070 | PokeMod Campaña ROM: Tramo siguiente | trapped-destination | 3071 | 2,2 |
| 6801 | 3074 | PokeMod Campaña ROM: Tramo siguiente | trapped-destination | 3075 | 2,2 |
| 6801 | 3074 | PokeMod Campaña ROM: Warp 1 | trapped-destination | 3075 | 2,2 |
| 6801 | 3074 | PokeMod Campaña ROM: Warp 2 | trapped-destination | 3075 | 2,2 |
| 6801 | 3075 | PokeMod Campaña ROM: Tramo anterior | trapped-destination | 3074 | 2,2 |
| 6801 | 3076 | PokeMod Campaña ROM: Tramo anterior | trapped-destination | 3075 | 2,2 |
| 6801 | 3076 | PokeMod Campaña ROM: Tramo siguiente | trapped-destination | 3077 | 2,2 |
| 6801 | 3076 | PokeMod Campaña ROM: Warp 1 | trapped-destination | 3077 | 2,2 |

## Tareas con hallazgos

| Tarea | Tipo | Rango | Estado |
|---:|---|---|---|
| 6800 | transferencias | 3061–3074 | `static_review_runtime_pending` |
| 6801 | transferencias | 3074–3083 | `static_review_runtime_pending` |
| 6802 | transferencias | 3083–3094 | `static_review_runtime_pending` |
| 6803 | transferencias | 3094–3106 | `static_review_runtime_pending` |
| 6804 | transferencias | 3106–3120 | `static_review_runtime_pending` |
| 6805 | transferencias | 3120–3131 | `static_review_runtime_pending` |
| 6806 | transferencias | 3131–3207 | `static_review_runtime_pending` |
| 6807 | transferencias | 3207–3219 | `static_review_runtime_pending` |
| 6808 | transferencias | 3219–3232 | `static_review_runtime_pending` |
| 6809 | transferencias | 3232–3239 | `static_review_runtime_pending` |
| 6810 | transferencias | 3239–3248 | `static_review_runtime_pending` |
| 6811 | transferencias | 3248–3260 | `static_review_runtime_pending` |

## Límite honesto

Todo se mide sobre los `.rxdata` compilados y las tablas de passability del tileset: no se abre `Game.exe` ni se juega ninguna partida. «Dos estados» acredita que el proyecto contiene escrituras de ON y de OFF para ese ID, no que ambos caminos se hayan recorrido en ejecución. En las transferencias, aterrizar sobre una celda no transitable puede ser deliberado en escenas guionizadas: se marca como revisión, no como defecto. La comprobación interactiva (con y sin partida avanzada) permanece como `runtime_pending`.
