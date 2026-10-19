# FASE 064 — Lote mixto de la tanda 64 (tramo 6300–6399)

## Reproducción

```bash
node tools/plan2700/lote11_fase064_condiciones_1.mjs
node tools/plan2700/lote11_fase064_condiciones_1.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · diálogos: 0 · elecciones: 0 · condiciones: 100.
- **Mapas únicos cubiertos**: 493 (mapas 13–505) · familias: «Fire Ash original».

## Condiciones probadas en verdadero y falso (estático)

- **Tareas**: 100 · **condicionales (111)**: 54884 en 50578 páginas.
- **Tipos**: 0:1370 · 1:16335 · 2:166 · 6:2721 · 7:168 · 12:34124.
- **Rutas**: 29279 con rama `else` (411) · 25605 sin ella (falso implícito).
- **Ambos caminos posibles**: 54884 · **siempre verdaderas**: 0 · **siempre falsas**: 0 · **IDs inválidos**: 0.
- **Recuento sin duplicar por mapa** (493 mapas): 7535 condicionales · 7535 con ambos caminos posibles · 0 constantes · 0 IDs inválidos.

Sin hallazgos de ramas, condiciones o estado en este tramo.

## Límite honesto

La cobertura de elecciones y la doble prueba de condiciones se calculan sobre el árbol de comandos de los `.rxdata` compilados: ninguna rama se ejecuta realmente. Una condición «siempre verdadera» aquí significa que el propio comando 111 la vuelve tautológica o que referencia un ID inexistente, no que el juego la evalúe así en una partida. La ejecución interactiva en `Game.exe` permanece como `runtime_pending`.
