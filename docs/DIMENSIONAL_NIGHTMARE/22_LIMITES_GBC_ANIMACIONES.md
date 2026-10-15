# 22 · Límites de la GBC sobre la animación de tiles

> Regla de esta dimensión: **sólo animaciones lentas y sólo donde el original
> de Game Boy Color las tenía.**
>
> Generado por `tools/gbc_tile_animation_limits.mjs` (regenerar con
> `npm run dn:anim:review`; verificar con `npm run dn:anim:check`).
> Los números de la GBC salen del desensamblado de pokecrystal que está en el
> repositorio, no de memoria: `pokecrystal-master.zip`.

## 1. Veredicto

**CUMPLE** — la dimensión no pinta ni una celda animada: no hay ninguna animación de tiles dentro del juego, así que no hay nada fuera de los límites de la GBC

| Dato | Valor |
|---|---:|
| Mapas de la dimensión revisados | 161 |
| Tilesets usados por esos mapas | 156 |
| Autotiles declarados | 14 |
| Autotiles animados (ancho > 96 px) | 14 |
| Celdas animadas realmente pintadas | **0** |
| Procesos paralelos en la dimensión | 7 |
| Procesos paralelos que cambian panorama/imagen | 0 |
| Animaciones más rápidas que el mínimo de 0.2 s | 0 |
| Incumplimientos | 0 |
| Observaciones | 15 |

## 2. Lo que la GBC sí podía animar

El intérprete de animación de tiles de la GBC ejecuta **un comando por VBlank**
(59.7275 Hz) y recorre en bucle la secuencia de cada tileset hasta
`DoneTileAnimation`. Eso fija el ritmo: un ciclo de 8 a 19 comandos son
0.134 s a 0.318 s por paso. Nada más rápido,
porque sólo cabe una escritura de tile por VBlank y además dentro del primer
quinto de éste.

| Tileset del original | Comandos del ciclo | Paso | Escrituras/ciclo | Qué se anima |
|---|---:|---:|---:|---|
| Kanto · 3 tilesets | 11 | 0.184 s | 2 | agua, flores · paleta: paleta-agua |
| Park | 11 | 0.184 s | 3 | agua, flores, fuente · paleta: paleta-agua |
| Forest | 12 | 0.201 s | 6 | agua, arboles, flores · paleta: paleta-agua |
| Johto | 13 | 0.218 s | 6 | agua, flores, remolino · paleta: paleta-agua |
| Flower (secuencia sin usar) | 11 | 0.184 s | 2 | agua, flores |
| Water (secuencia sin usar) | 11 | 0.184 s | 1 | agua |
| Port | 12 | 0.201 s | 1 | agua · paleta: paleta-agua |
| EliteFourRoom | 8 | 0.134 s | 2 | lava |
| Generic (secuencia sin usar) | 12 | 0.201 s | 3 | agua, cascada |
| Font (secuencia sin usar) | 14 | 0.234 s | 3 | agua, cascada |
| Cave · 2 tilesets | 19 | 0.318 s | 2 | agua, cascada · paleta: paleta-agua, paleta-cueva |
| IcePath | 19 | 0.318 s | 2 | agua, cascada · paleta: paleta-agua, paleta-cueva |
| Tower | 16 | 0.268 s | 10 | pilar-torre |
| RocketHouse (secuencia sin usar) | 10 | 0.167 s | 1 | agua |
| BattleTowerOutside · 25 tilesets | 5 | 0.084 s | 0 | — nada, sólo esperas — |

Clases animadas del original, con su ciclo más rápido:

| Clase | Comandos | Paso | Tilesets |
|---|---:|---:|---|
| agua | 11 | 0.184 s | Cave, Forest, IcePath, Johto, Kanto, Park, Port |
| flores | 11 | 0.184 s | Forest, Johto, Kanto, Park |
| fuente | 11 | 0.184 s | Park |
| arboles | 12 | 0.201 s | Forest |
| remolino | 13 | 0.218 s | Johto |
| lava | 8 | 0.134 s | EliteFourRoom |
| cascada | 19 | 0.318 s | Cave, IcePath |
| pilar-torre | 16 | 0.268 s | Tower |

Y lo que **no** se anima es la mayoría: 25 de los 42
tilesets del original comparten una sola secuencia de esperas. En escenarios
como casa, centro Pokémon, tienda, laboratorio, torre de radio, mansión o
estación, la GBC no mueve un solo tile.

Límites duros que explican por qué el original es tan austero:

- Un comando por VBlank: _AnimateTileset ejecuta la función del índice hTileAnimFrame y lo incrementa (engine/tilesets/tileset_anims.asm).
- Se llama desde VBlank (home/vblank.asm) y sólo durante el primer quinto de éste: home/video.asm comprueba LY < LY_VBLANK + 7.
- Se ejecuta con el banco 0 de VRAM seleccionado, así que los tiles $80 y superiores (banco 1) no se pueden animar.
- hMapAnims = 0 desactiva toda la animación de mapa.
- Como máximo sólo VRAM banco 0 (tiles $00–$7F); una escritura de tile por VBlank como máximo.

## 3. Lo que hace el motor de destino

| Dato | Valor |
|---|---|
| Motor | RPG Maker XP sobre mkxp (base de Fire Ash) |
| Ancho de un fotograma de autotile | 96 px |
| Fotogramas que se usan por autotile | 4 |
| Fotogramas de juego por paso | 16 (0.4 s a 40 fps · valor por defecto de RMXP/mkxp; mkxp.json de Fire Ash no lo sobreescribe) |
| Ciclo completo | 1.6 s |
| Cuándo considera animado un autotile | ancho del PNG > 96 px (mkxp src/tilemap.cpp · updateAutotileInfo) |
| Mecánica | el shader del tilemap desplaza la coordenada de textura en (índice de animación) × 96 px |

Consecuencia: la cadencia nativa de RMXP (0.4 s por paso) es
3.0× más lenta que la animación más rápida de la GBC
(0.134 s). Cualquier autotile animado cumple la parte «lenta» de la regla
sin intervención; y no se puede acelerar desde el contenido, porque la cadencia
está en el motor. Lo que sí puede romperla es una animación hecha a mano con
procesos paralelos: por eso se vigila.

## 4. Política aplicada

| Clase | Veredicto | Detectada por | Origen en el original |
|---|---|---|---|
| cascada | permitida | `waterfall`, `cascada` | ScrollTileDown (cueva $40, ruta helada $31) |
| remolino | permitida | `whirlpool`, `remolino` | AnimateWhirlpoolTile (sólo Johto) |
| lava | permitida | `lava` | AnimateLavaBubbleTile1/2 (sala de Élite Four) |
| pilar-torre | permitida | `tower`, `pillar`, `torre`, `pilar` | AnimateTowerPillarTile (torre) |
| flores | permitida | `flower`, `flor` | AnimateFlowerTile ($03) |
| arboles | permitida | `tree`, `arbol`, `forest`, `bosque` | ForestTreeLeft/RightAnimation (bosque) |
| fuente | permitida | `fountain`, `fuente` | AnimateFountainTile (sólo el Parque Nacional, $5f) · Permitida en exterior; prohibida en interior (ver política.interior). |
| orilla | prohibida | `^shore`, `shore$`, `orilla`, `beach`, `playa`, `^sand`, `sand` | sin equivalente en el original · La orilla es estática en GBC: sólo se anima la lámina de agua, no la arena. |
| paleta-agua | prohibida | `water palette`, `paleta` | AnimateWaterPalette: ciclo de paleta, no de tiles · RMXP no cicla paletas de tileset; un tono de pantalla repetido sería una animación nueva, no del original. |
| paleta-cueva | prohibida | `cave palette` | FlickeringCaveEntrancePalette: parpadeo de la entrada de cueva · Parpadeo deliberado: fuera del conjunto lento y del original. |
| agua | permitida | `^sea`, `sea`, `^water$`, `water`, `river`, `pond`, `ocean`, `lagoon`, `agua` | AnimateWaterTile / ScrollTileRightLeft (vTiles2 $14, $03, $35) |

Reglas:

1. Un tile animado sólo se admite si su clase aparece en la tabla del original.
2. La cadencia tiene que ser la nativa del motor (16 fotogramas por paso). Ninguna
   animación de tiles puede ir más rápido de 8 fotogramas
   (0.2 s), que ya es un 1.5× por encima del techo de la GBC.
3. En el original de GBC los tilesets de interior (casa, centro, tienda, laboratorio…) sólo encadenan WaitTileAnimation: no animan nada.
4. Si un autotile animado no está pintado en ningún mapa no cuenta como
   incumplimiento, pero se registra como observación latente: pintarlo
   incumpliría la regla.

## 5. Estado medido del contenido actual

| Tileset | Autotile | PNG | Fotogramas vistos/totales | Clase | Celdas pintadas | Veredicto |
|---|---|---|---:|---|---:|---|
| DN Game Boy 3 (`DN_GB_TS3`) | A0 · `DN_GB_TS3_A0` ← `Fountain2` | 384×128 | 4/4 | fuente | 0 | ✘ no original |
| DN Game Boy 1 (`DN_GB_TS1`) | A0 · `DN_GB_TS1_A0` ← `Sea` | 768×128 | 4/8 | agua | 0 | ✔ original |
| DN Game Boy 1 (`DN_GB_TS1`) | A1 · `DN_GB_TS1_A1` ← `Sea without shore` | 768×128 | 4/8 | agua | 0 | ✔ original |
| DN Game Boy 1 (`DN_GB_TS1`) | A2 · `DN_GB_TS1_A2` ← `Sea deep` | 768×128 | 4/8 | agua | 0 | ✔ original |
| DN Game Boy 1 (`DN_GB_TS1`) | A3 · `DN_GB_TS1_A3` ← `Sand shore` | 768×128 | 4/8 | orilla | 0 | ✘ no original |
| DN Game Boy 1 (`DN_GB_TS1`) | A4 · `DN_GB_TS1_A4` ← `Flowers1` | 160×32 | — | flores | 0 | ✔ original |
| DN Game Boy 1 (`DN_GB_TS1`) | A5 · `DN_GB_TS1_A5` ← `Flowers2` | 160×32 | — | flores | 0 | ✔ original |
| DN Game Boy 1 (`DN_GB_TS1`) | A6 · `DN_GB_TS1_A6` ← `Fountain1` | 480×128 | 4/5 | fuente | 0 | ✔ original |
| DN Game Boy 6 (`DN_GB_TS6`) | A0 · `DN_GB_TS6_A0` ← `Sea` | 768×128 | 4/8 | agua | 0 | ✔ original |
| DN Game Boy 6 (`DN_GB_TS6`) | A1 · `DN_GB_TS6_A1` ← `Sea without shore` | 768×128 | 4/8 | agua | 0 | ✔ original |
| DN Game Boy 6 (`DN_GB_TS6`) | A2 · `DN_GB_TS6_A2` ← `Sea deep` | 768×128 | 4/8 | agua | 0 | ✔ original |
| DN Game Boy 6 (`DN_GB_TS6`) | A4 · `DN_GB_TS6_A4` ← `Waterfall crest` | 128×32 | — | cascada | 0 | ✔ original |
| DN Game Boy 6 (`DN_GB_TS6`) | A5 · `DN_GB_TS6_A5` ← `Waterfall` | 128×32 | — | cascada | 0 | ✔ original |
| DN Game Boy 6 (`DN_GB_TS6`) | A6 · `DN_GB_TS6_A6` ← `Waterfall bottom` | 128×32 | — | cascada | 0 | ✔ original |

## 6. Incumplimientos

- Ninguno.

## 7. Observaciones

- **clase-no-original-latente** · `DN_GB_TS3_A0` (DN_GB_TS3): clase «fuente» declarada animada pero sin pintar en ningún mapa: si se pinta incumpliría la regla (interior (Inside): En el original de GBC los tilesets de interior (casa, centro, tienda, laboratorio…) sólo encadenan WaitTileAnimation: no animan nada.)
- **fotogramas-mudos** · `DN_GB_TS1_A0` (DN_GB_TS1): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **fotogramas-mudos** · `DN_GB_TS1_A1` (DN_GB_TS1): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **fotogramas-mudos** · `DN_GB_TS1_A2` (DN_GB_TS1): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **fotogramas-mudos** · `DN_GB_TS1_A3` (DN_GB_TS1): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **clase-no-original-latente** · `DN_GB_TS1_A3` (DN_GB_TS1): clase «orilla» declarada animada pero sin pintar en ningún mapa: si se pinta incumpliría la regla (La orilla es estática en GBC: sólo se anima la lámina de agua, no la arena.)
- **formato-reducido** · `DN_GB_TS1_A4` (DN_GB_TS1): mide 160×32 px: no ocupa la rejilla de 96×128 que el motor reserva por autotile, así que su ciclo no encaja con el paso de 96 px
- **formato-reducido** · `DN_GB_TS1_A5` (DN_GB_TS1): mide 160×32 px: no ocupa la rejilla de 96×128 que el motor reserva por autotile, así que su ciclo no encaja con el paso de 96 px
- **fotogramas-mudos** · `DN_GB_TS1_A6` (DN_GB_TS1): el PNG trae 5 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 1 fotogramas nunca se ven
- **fotogramas-mudos** · `DN_GB_TS6_A0` (DN_GB_TS6): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **fotogramas-mudos** · `DN_GB_TS6_A1` (DN_GB_TS6): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **fotogramas-mudos** · `DN_GB_TS6_A2` (DN_GB_TS6): el PNG trae 8 fotogramas pero el motor sólo muestra 4 (paso de 96 px): 4 fotogramas nunca se ven
- **formato-reducido** · `DN_GB_TS6_A4` (DN_GB_TS6): mide 128×32 px: no ocupa la rejilla de 96×128 que el motor reserva por autotile, así que su ciclo no encaja con el paso de 96 px
- **formato-reducido** · `DN_GB_TS6_A5` (DN_GB_TS6): mide 128×32 px: no ocupa la rejilla de 96×128 que el motor reserva por autotile, así que su ciclo no encaja con el paso de 96 px
- **formato-reducido** · `DN_GB_TS6_A6` (DN_GB_TS6): mide 128×32 px: no ocupa la rejilla de 96×128 que el motor reserva por autotile, así que su ciclo no encaja con el paso de 96 px

Las que vigilar son las `clase-no-original-latente`: son autotiles animados que
hoy no están pintados en ningún mapa, pero que incumplirían la regla en cuanto
alguien los use. Ahora mismo hay 2:
- `DN_GB_TS3_A0` (clase «fuente»): interior (Inside): En el original de GBC los tilesets de interior (casa, centro, tienda, laboratorio…) sólo encadenan WaitTileAnimation: no animan nada.
- `DN_GB_TS1_A3` (clase «orilla»): La orilla es estática en GBC: sólo se anima la lámina de agua, no la arena.

Los mapas de la dimensión se pintan con la matriz de su ficha de referencia
(ids de tile ≥ 384, ver doc 12 §E3), así que los autotiles de los tilesets
clonados en paleta Game Boy quedan declarados pero sin usar: de ahí que el
censo de celdas animadas sea 0.

## 8. Cómo se comprueba

```bash
npm run dn:anim:review   # regenera límites, informe y este documento
npm run dn:anim:check    # falla si hay animación prohibida o demasiado rápida
npm run dn:anim:strict   # idem, y también falla con las observaciones
```

Salidas: `content/gbc_tile_animation_limits.json` (límites + política),
`content/gbc_tile_animation_review.json` (censo medido) y este documento.
