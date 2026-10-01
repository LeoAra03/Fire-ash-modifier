# Referencia visual — Dimensional Nightmare

Aquí viven los **7 mosaicos de referencia** que originan los mapas del Nightmare
(ver `docs/DIMENSIONAL_NIGHTMARE/12_PLAN_DE_RECREACION_DE_MAPAS.md`).

## Qué subir (con estos nombres exactos)

Deposita los archivos en `reference/dimensional_nightmare/recursos/`. Se aceptan
`.png`, `.jpg`, `.jpeg` y `.webp`; **se prefiere PNG** (sin recompresión JPEG, que
introduce artefactos en los tiles).

| Archivo | Recurso | Fichas | Contenido |
|---|---|---:|---|
| `r1_glitch_city.png` | R1 | 16 (4×4) | Glitch City: tiles corruptos, hexadecimal, ERROR |
| `r2_dark_forest.png` | R2 | 16 (4×4) | Bosque oscuro con niebla púrpura y ruinas |
| `r3_king_unown.png` | R3 | 1 | Sprite del Rey Unown (boss final) |
| `r4_trono_unown.png` | R4 | 16 (4×4) | Trono del Rey Unown: trono, bibliotecas, criptas, KINGGUS |
| `r5_pueblos_tumbas.png` | R5 | 16 (4×4) | Pueblos y tumbas en sepia / blanco y negro |
| `r6_snowy_mountain.png` | R6 | 15 (5×3) | Montaña nevada: templos, cuevas de hielo, lagos |
| `r7_catacumbas.png` | R7 | 16 (4×4) | Catacumbas de Lavanda / Buried Alive |

> Si un mosaico tiene otra composición de rejilla (por ejemplo R6 en 3×5 en vez de
> 5×3), no pasa nada: ajusta `layout.json` y el script usará esa rejilla.

## Comandos

```bash
npm run dn:check     # ¿están los 7 recursos? (no corta nada)
npm run dn:ingest    # corta las fichas y genera index.json + slices/
npm run dn:selftest  # prueba la autodetección de rejilla con un fixture sintético
```

Salidas:

- `slices/<recurso>/NN.png` — una ficha por mapa (no se versiona: se regenera).
- `index.json` — medidas por ficha: tamaño, tiles aparentes, factor de escala,
  paleta dominante, luminancia y huella 8×8 (para detectar fichas repetidas).
  **Sí se versiona**: es la entrada de las fases de reconstrucción.

## Por qué se recorta y se mide

Los mosaicos son **imágenes**, no mapas de RPG Maker. El pipeline del plan
necesita, por cada ficha: saber cuántos tiles tiene, si viene escalada (×2, ×3…),
qué materiales dominan y cuánta luz recibe (para elegir las fases de corrupción
del GDD). Eso es exactamente lo que mide `index.json`.
