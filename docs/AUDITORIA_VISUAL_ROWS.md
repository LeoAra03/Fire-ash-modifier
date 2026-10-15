# Auditoría de las filas de estilo (`visualRows`) del plano de campañas ROM

Esta auditoría revisa las **35 591 filas de estilo** de `content/rom_campaigns_complete.json` y confirma que **ningún mapa se queda con una sola fila de estilo**. Cubre 5 campañas y 1227 mapas, con una fila por cada fila de alto de cada mapa.

Cada fila tiene estos campos:

- `y`;
- el mapa donante de Fire Ash que se muestrea (`donorMapId`);
- el desfase del suelo (`floorPhase`);
- la cadencia de acentos (`accentEvery`);
- la banda de pasillo (`corridorBand`). Es informativa: el pintor no la usa.

## Dos niveles de revisión

1. **Plano.** Se comprueban:
   - los totales;
   - que haya una fila por cada `y`, contiguas desde 0, con sus cinco campos;
   - que cada mapa tenga un solo donante: el de su ranura, `donors[índice % 6]`;
   - que los parámetros estén en rango;
   - que no haya dos filas consecutivas iguales;
   - que cada mapa tenga al menos 2 estilos.
2. **Efecto.** Cada mapa se pinta con el pintor real y se cuentan sus filas pintadas distintas. Se cuentan dos veces: solo en la capa de suelo y en las tres capas juntas.
   - Una sola fila distinta significa que el mapa ha quedado con una sola fila de estilo, aunque sus parámetros varíen.
   - El pintor está en `tools/lib/rom_campaign_painter.mjs` y es el mismo que usa `tools/apply_complete_rom_campaigns.mjs`.
   - A cada donante se le exige además:
     - tileset 1;
     - al menos 4 teselas de suelo transitable;
     - que ninguna tesela ocupe más del 95 % del suelo transitable.

## Hallazgo (plano del commit `7dae6e75`)

### Plano: correcto

Ningún mapa tiene un solo estilo. El mínimo es de 8 estilos (Map3002, 87×8), y dentro de cada mapa todas las filas son distintas. Pero esta comprobación es casi automática: `floorPhase = (cabecera + 17·y + 31·índice) mod 97` no se repite en 97 filas seguidas.

### Efecto: fallaba

Con el pintor real:

- **414 mapas** tenían todas las filas de suelo idénticas;
- **34 mapas** seguían con una sola fila incluso contando los acentos.

La causa son seis donantes con un suelo transitable degenerado. Cuando el suelo es uniforme, mover la ventana de muestreo (`floorPhase`) no cambia nada.

| Campaña | Donante degenerado | Suelo transitable | Mapas con 1 fila de suelo / en 3 capas |
|---|---|---|---|
| liquid_crystal | 295 Ruins of Alph | 1 tesela | 72 / 4 |
| tfoh | 209 Valencia, 228 Seven Grapefruit Islands, 236 Ascorbia, 245 Pummelo, 491 Metallica | 9, 8, 2, 1 y 1 teselas; una de ellas ocupa del 99,0 % al 100 % | 124 / 10 |
| unbound | los mismos cinco que TFOH | ídem | 218 / 20 |
| glazed, light_platinum | — | variado | 0 / 0 |

Con ese plano, solo el 23,7 % (TFOH) y el 23,6 % (Unbound) de las filas de suelo pintadas eran distintas. El resultado medido entonces se reproduce con:

```bash
git show 7dae6e75:content/rom_campaigns_complete.json > /tmp/plano_7dae6e75.json
node tools/audit_visual_rows.mjs --plan /tmp/plano_7dae6e75.json
```

## Corrección

### Donantes sustituidos

Se cambiaron 11 ranuras en `CONFIGS[].donors` de `tools/create_complete_rom_campaigns.mjs`. Todos los sustitutos cumplen tres condiciones:

- son de tileset 1;
- su suelo es variado;
- encajan en el tema de la campaña. Se eligieron además simulando el resultado con el pintor real.

| Campaña | Antes | Ahora |
|---|---|---|
| Liquid Crystal | 295 Ruins of Alph | 294 Route 36, el camino a las ruinas |
| TFOH y Unbound | 209 Valencia Island | 72 Daroxy Island |
| TFOH y Unbound | 228 Seven Grapefruit Islands | 184 Cinnabar Island |
| TFOH y Unbound | 236 Ascorbia Island | 642 Lily of the Valley Island |
| TFOH y Unbound | 245 Pummelo Island | 517 Cero Island |
| TFOH y Unbound | 491 Metallica Island | 52 Battle Frontier, la «frontera» de ambas paletas |

Se mantiene 211 Tangelo Island.

### Plano regenerado

El plano se regeneró con `node tools/create_complete_rom_campaigns.mjs`, por la ruta de refresco, sin ROMs.

- Solo cambian los 11 valores de `donors` y 18 416 `donorMapId`.
- Totales, altos, fases, cadencias, títulos, NPC y warps quedan idénticos.
- `npm run verify:rom:campaigns:plan` sigue reproducible.

### Pintor compartido

El pintor (`floorPalette` y `paintMap`) salió del instalador a `tools/lib/rom_campaign_painter.mjs`.

- Pinta exactamente igual: 4 458 498 celdas idénticas en los 1227 mapas, tanto con el plano anterior como con el nuevo.
- Así, lo que se audita es lo que se pinta.

## Alcance

Esta corrección no repinta los mapas instalados Map3000–Map4419.

- `node tools/rom_nativo_mapas.mjs --install` ya sustituyó sus teselas por las nativas de cada ROM. `content/rom_nativo.json` cubre los 1227 mapas.
- El pintor estructural solo interviene si se reconstruyen los mapas con `npm run build:rom:campaigns`, antes del paso nativo. A partir de ahora, ese paso intermedio tampoco deja mapas de una sola fila.
- Hay dos verificadores que ya fallaban antes de este cambio y que no tienen relación con las `visualRows`:
  - `npm run verify:rom:nativo` muestra 11 diferencias de una celda. Su salida es idéntica con el plano anterior y con el nuevo.
  - `npm run verify:rom:campaigns` encuentra 3 problemas: NPC de Map3000 y Map3200, y el final de Glazed. La salida del instalador refactorizado es idéntica a la de `7dae6e75`.

## Cómo se ejecuta

```bash
npm run audit:visual:rows                   # audita y regenera el bloque de abajo
npm run verify:visual:rows                  # falla si hay incidencias o el bloque está viejo (va en npm test)
node tools/audit_visual_rows.mjs --json     # resultado completo, mapa a mapa
node tools/audit_visual_rows.mjs --plan <plano.json>   # audita otro plano sin tocar este informe
```

## Resultado actual

<!-- audit_visual_rows:inicio -->
<!-- Bloque generado por tools/audit_visual_rows.mjs: no editar a mano. -->

- Plano: **5 campañas, 1227 mapas y 35591 filas de estilo** (`totals.visualRows` = 35591; suma de altos = 35591).
- Mapas con una sola fila de estilo: **0** en el plano, **0** en el suelo pintado y **0** en las tres capas pintadas.
- Umbrales: al menos 2 filas distintas por mapa; donantes de tileset 1 con al menos 4 teselas de suelo transitable y ninguna por encima del 95.0 %.
- Incidencias: **0**.

### Por campaña

| Campaña | Mapas | Filas de estilo | Alto mín. / mediana / máx. | Estilos por mapa (mín.) | Filas de suelo distintas (mín.) | Filas distintas, 3 capas (mín.) | Mapas con 1 fila (plano / suelo / 3 capas) | Filas de suelo distintas (media) |
|---|---:|---:|---|---:|---:|---:|---|---:|
| glazed | 111 | 2881 | 8 / 20 / 164 | 8 | 7 | 7 | 0 / 0 / 0 | 92.1 % |
| light_platinum | 19 | 363 | 9 / 11 / 48 | 9 | 6 | 7 | 0 / 0 / 0 | 95.4 % |
| liquid_crystal | 432 | 12942 | 8 / 24 / 164 | 8 | 5 | 5 | 0 / 0 / 0 | 84.5 % |
| tfoh | 245 | 6353 | 8 / 20 / 160 | 8 | 5 | 5 | 0 / 0 / 0 | 83.2 % |
| unbound | 420 | 13052 | 8 / 28 / 151 | 8 | 4 | 5 | 0 / 0 / 0 | 84.3 % |

### Donantes

Cada mapa usa el donante de su ranura (`donors[índice % 6]`). «Suelo» son las teselas transitables de la capa 0.

| Campaña | Ranura | Donante | Tamaño | Teselas de suelo | Tesela dominante | Mapas | Filas de suelo distintas (mín.) | Media |
|---|---:|---|---|---:|---:|---:|---:|---:|
| glazed | 0 | Map7 Cedolan City | 60×43 | 44 | 36.9 % | 19 | 7 | 96.7 % |
| glazed | 1 | Map23 Lerucean Town | 41×41 | 41 | 23.8 % | 19 | 7 | 96.1 % |
| glazed | 2 | Map28 National Park | 50×45 | 20 | 18.8 % | 19 | 7 | 90.6 % |
| glazed | 3 | Map31 Route 3 | 70×69 | 53 | 22.1 % | 18 | 7 | 86.9 % |
| glazed | 4 | Map35 Ingido Plateau | 35×40 | 20 | 31.9 % | 18 | 7 | 97.7 % |
| glazed | 5 | Map167 Hoenn Battle Frontier | 40×35 | 11 | 62.2 % | 18 | 7 | 84.4 % |
| light_platinum | 0 | Map2 Lappet Town | 32×21 | 34 | 24.0 % | 4 | 9 | 100.0 % |
| light_platinum | 1 | Map33 Pallet Town | 75×48 | 28 | 65.7 % | 3 | 10 | 87.4 % |
| light_platinum | 2 | Map41 Route 5 | 36×138 | 35 | 57.3 % | 3 | 11 | 100.0 % |
| light_platinum | 3 | Map43 Viridian City | 60×50 | 52 | 68.2 % | 3 | 9 | 99.3 % |
| light_platinum | 4 | Map44 Route 6 | 45×38 | 29 | 73.0 % | 3 | 6 | 83.9 % |
| light_platinum | 5 | Map180 Safari Zone Kanto | 51×34 | 14 | 91.1 % | 3 | 10 | 100.0 % |
| liquid_crystal | 0 | Map251 New Bark Town | 35×35 | 14 | 63.4 % | 72 | 5 | 65.9 % |
| liquid_crystal | 1 | Map254 Route 29 | 51×30 | 17 | 72.8 % | 72 | 6 | 75.3 % |
| liquid_crystal | 2 | Map294 Route 36 | 70×45 | 13 | 65.3 % | 72 | 7 | 93.3 % |
| liquid_crystal | 3 | Map299 Ecruteak City | 60×52 | 22 | 59.3 % | 72 | 8 | 98.1 % |
| liquid_crystal | 4 | Map306 Route 39 | 42×70 | 42 | 70.8 % | 72 | 7 | 98.0 % |
| liquid_crystal | 5 | Map308 Olivine City | 51×50 | 24 | 78.8 % | 72 | 5 | 76.6 % |
| tfoh | 0 | Map72 Daroxy Island | 29×31 | 34 | 58.9 % | 41 | 8 | 83.4 % |
| tfoh | 1 | Map211 Tangelo Island | 80×70 | 34 | 64.5 % | 41 | 6 | 77.7 % |
| tfoh | 2 | Map184 Cinnabar Island | 37×32 | 19 | 55.9 % | 41 | 6 | 76.1 % |
| tfoh | 3 | Map642 Lily of the Valley Island | 60×50 | 10 | 82.5 % | 41 | 8 | 77.6 % |
| tfoh | 4 | Map517 Cero Island | 60×50 | 6 | 73.1 % | 41 | 5 | 86.0 % |
| tfoh | 5 | Map52 Battle Frontier | 44×36 | 34 | 36.1 % | 40 | 9 | 98.8 % |
| unbound | 0 | Map72 Daroxy Island | 29×31 | 34 | 58.9 % | 70 | 7 | 81.4 % |
| unbound | 1 | Map211 Tangelo Island | 80×70 | 34 | 64.5 % | 70 | 4 | 78.6 % |
| unbound | 2 | Map184 Cinnabar Island | 37×32 | 19 | 55.9 % | 70 | 5 | 76.0 % |
| unbound | 3 | Map642 Lily of the Valley Island | 60×50 | 10 | 82.5 % | 70 | 7 | 76.8 % |
| unbound | 4 | Map517 Cero Island | 60×50 | 6 | 73.1 % | 70 | 5 | 93.6 % |
| unbound | 5 | Map52 Battle Frontier | 44×36 | 34 | 36.1 % | 70 | 9 | 99.7 % |

### Los 12 mapas con menos variedad de suelo

| Mapa | Campaña | Título | Pintado | Donante | Filas de suelo distintas | Filas distintas, 3 capas |
|---|---|---|---|---|---:|---:|
| Map4403 | unbound | Pokémon Unbound · Capítulo 34 · cueva 404 | 10×8 | Map211 | 4 de 8 | 5 |
| Map3325 | liquid_crystal | Liquid Crystal · Acantilados & Safari de Johto (Sector 2) | 10×11 | Map308 | 5 de 11 | 5 |
| Map4193 | unbound | Pokémon Unbound · Capítulo 17 · ruta 194 | 16×10 | Map211 | 5 de 10 | 5 |
| Map3284 | liquid_crystal | Liquid Crystal · Rutas 38 & 39 (Granja Mu-mu · Tramo 5) | 9×9 | Map251 | 5 de 9 | 5 |
| Map3908 | tfoh | TFOH · Capítulo 18 · poblado 209 | 10×9 | Map517 | 5 de 9 | 5 |
| Map4178 | unbound | Pokémon Unbound · Capítulo 15 · santuario 179 | 9×9 | Map517 | 5 de 9 | 5 |
| Map4182 | unbound | Pokémon Unbound · Capítulo 16 · instalación 183 | 9×9 | Map184 | 5 de 9 | 5 |
| Map3722 | tfoh | TFOH · Capítulo 02 · instalación 023 | 10×8 | Map517 | 5 de 8 | 5 |
| Map3218 | liquid_crystal | Liquid Crystal · Ruta 32 (Costa Sur · Tramo 3) | 15×11 | Map251 | 6 de 11 | 6 |
| Map3818 | tfoh | TFOH · Capítulo 10 · costa 119 | 11×11 | Map517 | 6 de 11 | 6 |
| Map3529 | liquid_crystal | Liquid Crystal · Kanto · Puerto Carmín & Muelle S.S. Aqua (10) | 13×10 | Map308 | 6 de 10 | 6 |
| Map3911 | tfoh | TFOH · Capítulo 18 · cueva 212 | 15×10 | Map211 | 6 de 10 | 6 |

<!-- audit_visual_rows:fin -->
