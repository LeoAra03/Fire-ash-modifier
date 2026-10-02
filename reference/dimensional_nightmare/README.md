# Referencia visual — Dimensional Nightmare

Carpeta de trabajo del pipeline de recreación (enfoque **pixel-identidad**).
Los mosaicos se depositan en **`Mapas/crepypasta/`**; aquí quedan los artefactos
que produce `npm run dn:ingest` y `npm run dn:tiles`.

## Dónde va cada cosa

| Carpeta | Qué contiene | Se versiona |
|---|---|---|
| `Mapas/crepypasta/` | los 7 mosaicos que deposita el usuario | no (salvo su README) |
| `reference/dimensional_nightmare/recursos/` | ubicación alternativa aceptada | no |
| `reference/dimensional_nightmare/slices/` | 96 fichas recortadas | no (se regeneran) |
| `reference/dimensional_nightmare/tilesets/` | tilesets derivados (bloques de 32×32) | no |
| `reference/dimensional_nightmare/index.json` | medidas de cada ficha | no (se regenera) |
| `reference/dimensional_nightmare/layout.json` | overrides de rejilla | **sí** |
| `content/dimensional_nightmare_tiles.json` | matrices de mapa (ficha → índices de tile) | no |

## Nombres esperados

`r1_glitch_city`, `r2_dark_forest`, `r3_king_unown`, `r4_trono_unown`,
`r5_pueblos_tumbas`, `r6_snowy_mountain` (5×3), `r7_catacumbas`.
Si tus archivos llevan palabras clave (`glitch`, `forest`, `king`, `trono`,
`pueblo`/`tumba`, `snow`/`mountain`, `catacumbas`/`lavanda`) el emparejamiento
es automático: compruébalo con `npm run dn:check`.

## Comandos

```bash
npm run dn:check          # ¿están los 7? ¿cómo se emparejaron?
npm run dn:ingest         # corta las 96 fichas y las mide
npm run dn:tiles          # extrae los tiles únicos y las matrices de mapa
npm run dn:fixtures       # ensayo general con mosaicos sintéticos
npm run dn:selftest       # prueba la rejilla de la ingesta
npm run dn:tiles:selftest # prueba la reconstrucción píxel a píxel
```

Plan completo y checklist de aceptación:
`docs/DIMENSIONAL_NIGHTMARE/12_PLAN_DE_RECREACION_DE_MAPAS.md`.
