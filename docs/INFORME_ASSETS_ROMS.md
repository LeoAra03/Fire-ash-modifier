# Assets originales de los ROMs invitados

Informe de la fase «los ROMs al 100 %, sin adaptar». Explica qué se extrae de cada
cartucho, cómo se instala dentro de Fire Ash, cómo se comprueba y qué queda fuera
(y por qué).

## Qué se extrae y de dónde

| Pieza | Origen en el ROM | Formato | Destino en Fire Ash |
|---|---|---|---|
| Mapa | layout: ancho, alto y bloques de metatile (16×16) | `tiles` en base36, 2 caracteres por celda | `Data/Map<id>.rxdata` (3 capas, celdas ×2) |
| Tileset | par primario/secundario del layout | atlas PNG 256 px de ancho, celdas de 32 px | `Graphics/Tilesets/ROM_<CAMPAÑA>_TS_<a>_<b>.png` |
| Pasabilidad | tabla de colisión del ROM, o deducida del arte | 384 + n entradas | `@passages` del tileset |
| Sprite de NPC | tabla de object events + struct de overworld | charset RMXP 4×4 de 16×32 | `Graphics/Characters/ROM_<CAMPAÑA>_GFX_<id>.png` |

Los extractores son `tools/roms_assets.mjs` (mapas, tilesets y NPC) sobre el lector
`tools/lib/gba_map_assets.mjs` (`cargarROM`, `buscarMapLayouts`, `leerBloques`,
`leerTileset`, `metatileDe`, `renderMetatile`, `colisionDe`, `parTilesets`).

La extracción completa de los cinco cartuchos se guarda en
`reference/roms_invitados_extraidos/<campaña>/` (catálogo, atlas de los tilesets que
usa la campaña, charsets de NPC y 3 mapas de muestra por ROM).

## Cómo se instala

`tools/apply_rom_campaigns_real.mjs` recorre las campañas de
`content/rom_campaigns_complete.json` y, mapa por mapa:

1. crea o reutiliza el tileset del par de tilesets (`@tileset_name`,
   `@passages`, `@priorities`, `@terrain_tags`, `@autotile_names`),
2. escribe las celdas del ROM traducidas a tiles del atlas (`384 + índice`, porque
   0–383 están reservados a los autotiles de RMXP),
3. conserva los eventos ya empalmados (guiones, combates, warps, retorno libre) y los
   recoloca en la celda transitable más cercana si el mapa real no los admite,
4. viste a cada NPC con un charset del ROM.

Todo es idempotente y hace copia de seguridad en
`pokemon_fire_ash/PokeModBackups/rom_campaigns_real/` antes de tocar nada.

## Cómo se comprueba

`tools/verify_rom_campaigns_real.mjs` (encadenado a `npm test` y a `npm run verify:all`
como `verify:rom:assets:reales`) revisa:

- que cada mapa del plan tenga su `Map<id>.rxdata` con las dimensiones del ROM;
- que el número de celdas y los metatiles cuadren con el catálogo real;
- que ninguna celda apunte fuera del atlas y que el atlas mida 256 px de ancho;
- que `@passages` tenga `384 + 8·ceil(tiles/8)` entradas;
- que los NPC usen charsets `ROM_…` existentes;
- y, en los mapas de muestra, que el render del `.rxdata` sea **idéntico píxel a píxel**
  al render del ROM.

Resultado actual: **1.227 mapas · 15 comparaciones pixel a pixel · 2.836 NPCs**.

## Límites conocidos

- **Battlers (Pokémon y entrenadores de combate)**: no se instalan. Los sprites de
  combate de estos hacks están comprimidos y las paletas se referencian con esquemas
  distintos en cada ROM (tablas de 8 bytes `{ptr, tag, pad}` en Glazed/Unbound, por
  ejemplo). Se localizaron las tablas de paletas y se probaron los métodos de
  selección (color semántico, planitud, desplazamientos), pero ningún criterio resultó
  fiable en los cinco cartuchos, así que se decidió no publicar sprites con colores
  inventados. El material de análisis queda en `tools/tmp/bat*.mjs` y `tools/tmp/paltag.mjs`.
- **Paleta de los NPC de Unbound**: su tabla de overworld usa un formato distinto;
  los charsets salen con la forma correcta del personaje y colores aproximados. En
  Glazed, Light Platinum, Liquid Crystal y TFOH la paleta es la del cartucho.
- La pasabilidad de Liquid Crystal y TFOH se deduce del arte del metatile (casi opaco
  = bloqueado) porque su tabla de colisión viene vacía en el ROM.
