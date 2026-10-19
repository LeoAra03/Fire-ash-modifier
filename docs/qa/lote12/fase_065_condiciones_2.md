# FASE 065 — Tanda 65 (tramo 6400–6499)

## Reproducción

```bash
node tools/plan2700/lote12_fase065_condiciones_2.mjs
node tools/plan2700/lote12_fase065_condiciones_2.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · condiciones: 100.
- **Mapas únicos cubiertos**: 982 (mapas 505–1487) · familias: «Atlas Mil», «Fire Ash original», «Horizontes».

## Condiciones

- **Tareas**: 100 · **condicionales 111**: 10746 en 25054 páginas (suma por tarea: los tramos se solapan) · tipos: 0:41 · 1:3368 · 2:26 · 6:291 · 7:68 · 12:6952.
- **Con rama else (411)**: 1828 · **sin else** (falso implícito): 8918.
- **Ambos caminos posibles**: 10746 · **siempre verdaderas**: 0 · **siempre falsas**: 0 · **IDs inválidos**: 0.

Sin hallazgos en este tramo.

## Límite honesto

Todo se mide sobre los `.rxdata` compilados y las tablas de passability del tileset: no se abre `Game.exe` ni se juega ninguna partida. «Dos estados» acredita que el proyecto contiene escrituras de ON y de OFF para ese ID, no que ambos caminos se hayan recorrido en ejecución. En las transferencias, aterrizar sobre una celda no transitable puede ser deliberado en escenas guionizadas: se marca como revisión, no como defecto. La comprobación interactiva (con y sin partida avanzada) permanece como `runtime_pending`.
