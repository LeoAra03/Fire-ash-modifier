# FASE 044 — Cierre de páginas finales (4234–4419) y ramas de eventos (1–889)

## Reproducción

```bash
node tools/plan2700/lote9_fase044_ramas_eventos_1.mjs
node tools/plan2700/lote9_fase044_ramas_eventos_1.mjs --verify
```

## 1. Cierre de eventos en página final (tareas 4300–4313 · mapas 4234–4419 «Campañas ROM»)

- **Tareas**: 14 · **Mapas únicos**: 186 · **Eventos**: 2284 (0 con condición avanzada).
- **Banderas y salidas**: lecturas `s=0, v=0, self=0` · escrituras `s=0, v=0, self=0` · 1613 transferencias · **0** flags inválidas · **0** transferencias inválidas.

## 2. Ramas de eventos: control y coherencia de estado (tareas 4314–4399 · mapas 1–889 «Fire Ash original»)

- **Tareas**: 86 · **Mapas únicos**: 889 · **Eventos**: 16053 · **Páginas**: 30029.
- **Ramas analizadas**: 16522 condicionales (`111`), 4093 ramas `else` (`411`), 1167 bloques de elección (`102`) con 2733 opciones (`402`) y 14 cancelaciones (`403`), 63 bucles (`112`) con 63 salidas (`113`), 310 etiquetas (`118`) y 599 saltos (`119`).
- **Integridad de control y estado**: páginas sin fin (`code 0`): **0** · condicionales desbalanceados: **13** · elecciones desbalanceadas: **0** · transferencias inválidas: **0** · escrituras de estado inválidas: **0**.

## Límite honesto

La verificación estática garantiza que todos los bloques `111..412` y `102..404` están balanceados, que todas las páginas terminan con `code 0` y que ninguna rama apunta a mapas/coordenadas o IDs de estado inválidos. La ejecución interactiva dentro de `Game.exe` permanece como `runtime_pending`.
