# 22 · Auditoría de terreno (hierba, agua, arena y nieve de GBC)

Fase 57 del backlog: *«Auditar que los tiles de hierba, agua, arena y nieve de GBC actúen como terreno real
(encuentros y animación de crujido)»*.

## 1. Hallazgo

| Comprobación | Antes |
|---|---|
| `@terrain_tags` de los 148 tilesets `DN_<id>` (mapas 2041–2190) | **todo a 0 (`:None`)**, también al regenerarlos (`apply_dimensional_nightmare_maps.mjs`) |
| `encounters.dat` en 2040–2190 | **ninguna tabla**: ni Land ni Cave |
| Consecuencia | El motor sólo entiende «terreno» por la etiqueta de la celda: `:Grass` (2) es la única que da crujido (`shows_grass_rustle` → `Settings::GRASS_ANIMATION_ID`) y encuentros de superficie (`land_wild_encounters`). Con `:None` la hierba, el agua, la arena y la nieve del Nightmare eran decorado: se veían, pero no se comportaban. |

Los clones Game Boy (`DN_GB_TS*`) sí heredan ya las etiquetas de su tileset de origen (verificado celda a celda);
no se modificaron.

## 2. Qué se instaló

Clasificación del material de cada bloque que los mapas pisan de verdad (celdas transitables de
`content/dimensional_nightmare_passability.json`), leyendo el color del bloque en el tileset **a color** del grupo
(`reference/dimensional_nightmare/tilesets/<grupo>_2x.png`), porque el PNG del juego está cuantizado a la paleta
verde de Game Boy. Umbrales calibrados contra los centroides reales del juego base (nieve del Monte Silver
`rgb(245,245,242)` con tag 4; agua `rgb(108,156,204)` con tag 6; hierba `rgb(78,160,99)` con tag 2;
arena `rgb(225,221,137)` con tag 3).

| Material | Etiqueta instalada | Comportamiento |
|---|---|---|
| Hierba | **2 `:Grass`** | crujido + encuentros de superficie |
| Nieve (mundos con fauna) | **2 `:Grass`** | crujido + encuentros (nieve pisable = hierba nevada) |
| Nieve (mapas sin fauna) | 4 `:Rock` | igual que la nieve del Monte Silver del juego base (Map2021/2022) |
| Arena | 3 `:Sand` | ambiente de arena; sin fauna propia en el motor |
| Agua | 5/6/7 `:DeepWater`/`:StillWater`/`:Water` | reflejos, pesca y ambiente de agua, como el agua del juego base |
| Piedra | 4 `:Rock` | — |

En los **mundos de exterior** (`Land`: EP02, EP03, EP04, EP05, W7, W8 y W9) *todo* el suelo pisable que no es agua
recibe `:Grass`: es la única etiqueta que entrega crujido y encuentros a la vez, así que la hierba, la **arena** y la
**nieve** de esos mundos actúan como terreno real en lugar de ser decorado. En los mundos de cueva (EP01 Catacumbas y
EP06 Atrio) el suelo conserva su material y los encuentros son de tipo `Cave`, que dispara en cualquier celda.

Resultado medido (`content/dimensional_nightmare_terrain.json`):

* **9 074** etiquetas escritas en **148** tilesets `DN_<id>`.
* Celdas pisables: `:Grass` **7 669** · `:Rock` 3 497 · agua **1 179** · `:Sand` 906.
* Tablas de salvajes instaladas: **107** (75 `Land` + 32 `Cave`), 9 mundos con fauna, nivel máximo **108**
  (tope del proyecto 150).

## 3. Salvajes del GDD

Las tablas salen de la sección §7 de cada episodio, con sus rangos de mapa, niveles y rarezas
(`docs/DIMENSIONAL_NIGHTMARE/01`–`06` y `16`–`18`): EP01 Catacumbas (paso 5), EP02 Lost Silver, EP03 nieve,
EP04 bosque dormido, EP05 la ausencia, EP06 Atrio (paso 5) y los mundos W7/W8/W9 en los cuatro mapas que cada
documento marca con encuentros. El `UNOWN` #A016 de 2135 no entra en la tabla: lo gestiona su evento tras el jefe.
`STEP_CHANCES` = 21 en exteriores y 5 en cueva, los valores por defecto del motor.

## 4. Verificación

`npm run dn:terreno:verify` (dentro de `dn:verify:all`) comprueba etiqueta a etiqueta contra el catálogo, que el
material de cada celda pisable admite su etiqueta, que los mundos `Land` tienen hierba suficiente para disparar
crujido y encuentros, que cada tabla instalada es exactamente la del GDD con especies existentes en `species.dat`,
que la animación `GRASS_ANIMATION_ID = 1` («Grass rustle») existe en `Animations.rxdata` y que `Overworld` la dibuja,
y que el paquete QA (`Scripts_corregido/Dimensional_Nightmare_QA`) refleja el juego byte a byte.

Evidencia gráfica en `docs/dn_referencia/lotes/`: `TERRENO_<mundo>.png` (10 hojas, mapas con el material encima) y
`MATERIALES_<grupo>.png` (9 hojas de contacto con el material asignado a cada bloque).

## 5. Hallazgos de motor y temas ajenos

* **Surf desactivado en el motor base**: `116_TerrainTag.rb` registra *todas* las etiquetas de agua con
  `:can_surf => false` (también en el juego base), así que el surf y los encuentros de agua no son alcanzables en esta
  entrega. El agua del Nightmare queda con las mismas propiedades que el agua del juego base y no altera el paso.
* **Fuera del Nightmare**: las tablas `Land` de la Ruta de Dios (2031–2038) no tienen ninguna celda con etiqueta de
  hierba en su tileset `Outside`, así que no pueden dispararse; las vigila `verify:ruta_de_dios` y este informe sólo
  las deja anotadas en `content/dimensional_nightmare_terrain.json`.
* Como esta pasada cambia el terreno de cada celda, `dn:terreno` recalcula las huellas de
  `content/dimensional_nightmare_map_polish.json` (`--refresh-plan`), para que `dn:polish:verify` siga comparando
  contra las colisiones reales.

## 6. Reproducir

```bash
npm run dn:terreno          # clasifica, instala etiquetas y tablas, refresca huellas del pulido
npm run build:dn:qa         # el paquete QA copia Data/Tilesets.rxdata y Data/encounters.dat
npm run dn:terreno:verify   # auditoría (falla si algo no cuadra)
node tools/dn_terrain_tags.mjs --materials   # hojas de materiales para revisar la clasificación
node tools/dn_terrain_tags.mjs --render      # hojas de terreno por mundo
```

`dn:maps:all` termina con `dn:terreno`, de modo que volver a construir los mapas no vuelve a dejar el terreno a 0.
