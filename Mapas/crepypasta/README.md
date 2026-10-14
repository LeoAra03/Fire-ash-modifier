# Mapas/crepypasta — recursos de referencia del Dimensional Nightmare

Deposita aquí los **7 mosaicos** de referencia. Esta carpeta está ignorada por git
(salvo este README): los mosaicos son material de terceros y **no se redistribuyen**
en el repositorio ni en el juego; se usan solo para producir los mapas.

| Archivo esperado | Recurso | Fichas |
|---|---|---:|
| `r1_glitch_city.png` | R1 Glitch City | 16 (4×4) |
| `r2_dark_forest.png` | R2 Creepy Dark Forest | 16 (4×4) |
| `r3_king_unown.png` | R3 Sprite King Unown | 1 |
| `r4_trono_unown.png` | R4 El Trono del Rey Unown | 16 (4×4) |
| `r5_pueblos_tumbas.png` | R5 Pueblos y Tumbas (sepia/B&N) | 16 (4×4) |
| `r6_snowy_mountain.png` | R6 Creepy Snowy Mountain | 15 (5×3) |
| `r7_catacumbas.png` | R7 Catacumbas de Lavanda (Buried Alive) | 16 (4×4) |

No hace falta renombrar si tus archivos llevan las palabras clave en el nombre
(`glitch`, `forest`, `king`, `trono`, `pueblo/tumba`, `snow/mountain`,
`catacumbas/lavanda`); la herramienta los empareja sola. Si hay dudas, ejecuta:

```bash
npm run dn:check
```

y te dirá, archivo por archivo, qué encontró y qué falta.

> `Mapas/Atlas/` no se toca en esta fase: el pipeline solo lee de
> `Mapas/crepypasta/`.

## Flujo

```bash
npm ci                 # dependencias (incluye @napi-rs/canvas)
npm run dn:check       # ¿están los 7? ¿con qué nombre los emparejó?
npm run dn:ingest      # 96 fichas + index.json
npm run dn:tiles       # tilesets derivados + matrices de mapa (enfoque pixel-identidad)
```

¿Sin los mosaicos a mano y quieres ver el pipeline completo? `npm run dn:fixtures`
genera mosaicos sintéticos y ejecuta la ingesta sobre ellos.

Plan completo: `docs/DIMENSIONAL_NIGHTMARE/12_PLAN_DE_RECREACION_DE_MAPAS.md`.
