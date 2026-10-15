# Congelación de los 17 mapas nuevos del DLC y su música

`docs/qa/mapas_dlc_musica.md` — congelado en **FASE 15** del plan 900.

Tabla única con los **17 mapas nuevos del DLC** (2195, 2196, 2200, 2201, 2210,
2211, 2220, 2221, 2230 y 2250–2257) y la música que tienen asignada, medida
**sobre el disco** (`pokemon_fire_ash/Data/Map*.rxdata`, campo `@bgm`) y
cotejada contra el plan oficial `content/dlc_ambience.json`.

Estado verificado en la congelación (2026-10-15):

- **17/17 mapas con BGM asignado en disco, idéntico al plan** (plan = disco).
- **17/17 archivos de música existen en `pokemon_fire_ash/Audio/BGM/`** —
  música real del juego, nada inventado.
- Volumen y tono: 100/100 en los 17.
- La columna SHA-256 es el prefijo del hash del `Map<N>.rxdata` congelado; el
  hash completo por archivo vive en `tools/inventario_congelado.json`.
- El plan completo de ambientación cubre 23 mapas (incluye 2240–2245, Liquid
  Crystal/Factory Adventure); esta tabla congela los 17 del alcance de la fase.

## Tabla congelada

| Mapa | Nombre | BGM asignado | Vol/Tono | BGM existe | SHA-256 (prefijo) | Nota del plan |
|---:|---|---|---|---|---|---|
| 2195 | Atlas Mil · Vía de las Nueve Eras | `route.mid` | 100/100 | ✔ | `3d73530aad10` | Música de ruta, como un camino largo entre ciudades. |
| 2196 | Gimnasio Atlas · Las Nueve Eras | `gymleader-stadium.ogg` | 100/100 | ✔ | `c82d0fb7c1e6` | Gimnasio de las Nueve Eras. |
| 2200 | Glazed — Bahía de Cedolán | `DN_SnowSilver.mid` | 100/100 | ✔ | `564c85a1ab5d` | Bahía fría, nieve de plata. |
| 2201 | Gimnasio Glazed — Líder Ámbar | `gymsinnoh.ogg` | 100/100 | ✔ | `f36adc1e2434` | Gimnasio Glazed. |
| 2210 | Light Platinum — Costa de Lappet | `Sinnoh Route.ogg` | 100/100 | ✔ | `d2fabac26484` | Costa luminosa. |
| 2211 | Gimnasio Light Platinum — Líder Resplandor | `gymleader-8.ogg` | 100/100 | ✔ | `45688e8f243e` | Gimnasio Light Platinum. |
| 2220 | Team Rocket — Base Subterránea | `TeamRocket.ogg` | 100/100 | ✔ | `27ab58a7f1f2` | Base Subterránea del Sindicato. |
| 2221 | Team Rocket — Núcleo del Mando | `Team Rocket OW Kanto.ogg` | 100/100 | ✔ | `972cf9d86866` | Núcleo del Mando. |
| 2230 | Atlas — Avenida de los Ocho Gimnasios | `Kalos Town.ogg` | 100/100 | ✔ | `06f931247eb1` | Avenida de los Ocho Gimnasios. |
| 2250 | Gimnasio de Atlas · Bruma | `gym.ogg` | 100/100 | ✔ | `385ded8c5fbb` | Gimnasio de Atlas · Bruma. |
| 2251 | Gimnasio de Atlas · Veta | `gymleader-1.ogg` | 100/100 | ✔ | `aaff8e351d64` | Gimnasio de Atlas · Veta. |
| 2252 | Gimnasio de Atlas · Duna | `gymleader-2.ogg` | 100/100 | ✔ | `bc2361877d96` | Gimnasio de Atlas · Duna. |
| 2253 | Gimnasio de Atlas · Fragua | `gymleader-3.ogg` | 100/100 | ✔ | `d40f9efcc034` | Gimnasio de Atlas · Fragua. |
| 2254 | Gimnasio de Atlas · Marea | `gymleader-4.ogg` | 100/100 | ✔ | `b2a0b18a9237` | Gimnasio de Atlas · Marea. |
| 2255 | Gimnasio de Atlas · Vendaval | `gymleader-5.ogg` | 100/100 | ✔ | `14ebbf00d8b9` | Gimnasio de Atlas · Vendaval. |
| 2256 | Gimnasio de Atlas · Invernadero | `gymleader-6.ogg` | 100/100 | ✔ | `3e0c9fdec651` | Gimnasio de Atlas · Invernadero. |
| 2257 | Gimnasio de Atlas · Cumbre | `Battle Gym Leader.mid` | 100/100 | ✔ | `f4b5faed61d5` | Cumbre, la octava medalla. |

## Recomprobación

```bash
npm run verify:ambience   # plan vs disco (los 23 mapas del plan)
node tools/inventario_congelado.mjs --verify   # hashes congelados de los 17 mapas
```

Cambiar la música de cualquiera de estos 17 mapas exige actualizar esta tabla,
el plan `content/dlc_ambience.json` y regenerar el inventario congelado.
