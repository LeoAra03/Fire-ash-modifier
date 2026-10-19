# FASE 066 — Tanda 66 (tramo 6500–6599)

## Reproducción

```bash
node tools/plan2700/lote12_fase066_estados_1.mjs
node tools/plan2700/lote12_fase066_estados_1.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · condiciones: 24 · switches: 12 · variables: 5 · self-switches: 59.
- **Mapas únicos cubiertos**: 2873 (mapas 1–4419) · familias: «Atlas Mil», «Campañas ROM», «Dimensional Nightmare», «Fire Ash original», «Ruta de Dios + Silver».

## Tareas con especificación inválida en `tareas.txt`

- **Tarea 6535**: La tarea declara un rango no numérico (NaN–NaN); no hay IDs que medir.

## Condiciones

- **Tareas**: 24 · **condicionales 111**: 2478 en 22094 páginas (suma por tarea: los tramos se solapan) · tipos: 0:29 · 1:66 · 2:5 · 12:2378.
- **Con rama else (411)**: 1188 · **sin else** (falso implícito): 1290.
- **Ambos caminos posibles**: 2478 · **siempre verdaderas**: 0 · **siempre falsas**: 0 · **IDs inválidos**: 0.

## Switches en sus dos estados

- **Tareas**: 12 (1 con rango inválido en la fuente) · **IDs medidos**: 923 · **completos** (lector + escritor + ON y OFF): 10.
- **Sin lector**: 868 → 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13 … (+856).
- **Sin escritor**: 125 → 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 … (+113).
- **Con escritor pero sin ambos estados**: 677 → 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 35 … (+665).

## Variables en valores límite

- **Tareas**: 5 · **IDs medidos**: 319 · **completos** (lector, escritor y sin reinicio/desborde): 12.
- **Sin lector**: 273 → 6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22 … (+261).
- **Sin escritor**: 97 → 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 … (+85).
- **Escrituras constantes a cero** (revisar si el reinicio es intencional): 205 → 1, 2, 3, 6, 7, 8, 9, 10, 26, 27, 28, 29 … (+193).
- **Escrituras fuera de rango seguro** (|valor| > 99 999 999): 0 → ninguno.

## Self-switches por evento y letra

- **Tareas**: 59 · **mapas**: 906 · **eventos**: 14578 (4498 usan self-switches).
- **Claves evento+letra**: 4751 · lecturas: 75 · escrituras: 5128.
- **Leídos sin escritor** (dependen de estado externo): 1 · **escritos y nunca leídos**: 4676.
- **Sin ambos estados**: 4572 · **letras inválidas**: 0.

## Tareas con hallazgos

| Tarea | Tipo | Rango | Estado |
|---:|---|---|---|
| 6524 | switches | 1–79 | `static_review_runtime_pending` |
| 6525 | switches | 80–154 | `static_review_runtime_pending` |
| 6526 | switches | 155–230 | `static_review_runtime_pending` |
| 6527 | switches | 231–305 | `static_review_runtime_pending` |
| 6528 | switches | 306–382 | `static_review_runtime_pending` |
| 6529 | switches | 383–458 | `static_review_runtime_pending` |
| 6530 | switches | 459–538 | `static_review_runtime_pending` |
| 6531 | switches | 539–678 | `static_review_runtime_pending` |
| 6532 | switches | 679–753 | `static_review_runtime_pending` |
| 6533 | switches | 754–828 | `static_review_runtime_pending` |
| 6534 | switches | 829–923 | `static_review_runtime_pending` |
| 6535 | switches | —–— | `invalid_spec` |

## Límite honesto

Todo se mide sobre los `.rxdata` compilados y las tablas de passability del tileset: no se abre `Game.exe` ni se juega ninguna partida. «Dos estados» acredita que el proyecto contiene escrituras de ON y de OFF para ese ID, no que ambos caminos se hayan recorrido en ejecución. En las transferencias, aterrizar sobre una celda no transitable puede ser deliberado en escenas guionizadas: se marca como revisión, no como defecto. La comprobación interactiva (con y sin partida avanzada) permanece como `runtime_pending`.
