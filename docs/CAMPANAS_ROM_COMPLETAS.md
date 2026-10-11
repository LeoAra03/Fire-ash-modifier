# Cinco campañas ROM completas después de La Ruta de Dios

## Objetivo

Esta fase sustituye la representación anterior de «una costa y un gimnasio» por cuatro campañas navegables completas dentro de Fire Ash. Ash no reemplaza al protagonista del ROM: entra como visitante después de completar La Ruta de Dios, escucha a sus habitantes, acepta desafíos y puede regresar al embarcadero desde cada mapa.

Desde la fase de **assets originales**, los mapas, los tilesets y los sprites de NPC de cada campaña son los del propio ROM, sin adaptar ni sustituir por material de Fire Ash: se copian byte a byte del cartucho (metatile a metatile) y se registran como tilesets propios (`ROM_<CAMPAÑA>_TS_…`) y charsets propios (`ROM_<CAMPAÑA>_GFX_…`). No se versionan diálogos, música ni guiones de terceros: eso lo aporta Fire Ash y el empalme de guion existente.

## Cobertura instalada

| Campaña | Mapas del ROM | Rango Fire Ash | Tilesets reales | Sprites de NPC | Acceso |
|---|---:|---|---:|---:|---|
| Glazed | 111 | Map3000–Map3110 | 34 | 102 | Map2200 |
| Light Platinum | 19 | Map3120–Map3138 | 7 | 33 | Map2210 |
| Liquid Crystal | 432 | Map3200–Map3631 | 51 | 144 | Map2240 |
| TFOH Beta 3 | 245 | Map3700–Map3944 | 55 | 191 | Map2242 |
| Unbound | 420 | Map4000–Map4419 | 65 | 128 | Map1001 |
| **Total** | **1.227** | — | **212** | **598** | — |

Los 1.227 mapas se verifican pixel a pixel contra el render del propio ROM en los mapas de muestra, y todos los tiles proceden del atlas real de su par de tilesets (`npm run verify:rom:assets:reales`).

Además se reconstruyeron **3.252 warps**. Cuando el destino banco/mapa fue detectado, el warp conserva esa relación. Cuando la minería no pudo resolverlo, utiliza el siguiente tramo seguro. Todos los mapas tienen también navegación lineal anterior/siguiente y retorno incondicional al embarcadero, por lo que ningún fallo heurístico puede encerrar al jugador.

## Progresión postgame

- Requisito global: switch **876**, final de La Ruta de Dios.
- Progreso Glazed: variable 350; final switch 990.
- Progreso Light Platinum: variable 351; final switch 991.
- Progreso Liquid Crystal: variable 352; final switch 992.
- Progreso TFOH: variable 353; final switch 993.
- Los combates usan `canLose=true`.
- La Mochila permanece disponible; no se tocan los switches 674/675.
- Cada último mapa contiene un guardián de campaña, cierre persistente y retorno libre.

## Mapas reales del ROM

Cada mapa se instala con **las dimensiones y las celdas exactas del ROM**. La extracción (`tools/roms_assets.mjs`) lee los bloques del layout, arma un atlas de metatiles por par de tilesets (8 columnas de 32 px, en orden ascendente y estable) y guarda en el catálogo los ids de metatile de cada celda, de modo que el mapa se puede reconstruir sin volver a leer el ROM.

`tools/apply_rom_campaigns_real.mjs` traduce cada celda a un tile del atlas (`384 + índice`) y escribe el `Map<id>.rxdata` con sus tres capas, registrando el tileset (`@tileset_name`, `@passages`, `@priorities`, `@terrain_tags`) con la misma tabla de pasabilidad derivada del arte. Los eventos ya empalmados (guiones, combates, warps, retorno libre, NPC) se conservan: sólo se recolocan sobre el mapa real y se les pone el charset del ROM.

La pasabilidad se deduce del propio arte del tile (un metatile casi opaco bloquea) porque Liquid Crystal y TFOH traen la tabla de colisión del cartucho vacía; Glazed y Light Platinum sí la traen y se usan sus valores cuando existen.

El plano completo está en:

```text
content/rom_campaigns_complete.json
```

Contiene 411.000+ líneas auditables: fuente banco/mapa, dimensiones, semántica climática, plan visual por fila, NPC, operaciones estructurales, flags de origen, warps y enlaces seguros. No contiene texto ni assets copiados de los ROMs.

## Pipeline reproducible

```bash
# Sólo al cambiar los ROMs locales: extraer mapas, tilesets y NPC reales
node tools/roms_assets.mjs --rom "<rom>.gba" --slug <campaña> --out /tmp/extra --sin-png

# Compilar dentro de Fire Ash
npm run build:rom:campaigns          # guiones, combates, warps y NPC
npm run build:rom:assets:reales      # mapas, tilesets y sprites del propio ROM
npm run verify:rom:campaigns:plan
npm run verify:rom:campaigns
npm run verify:rom:assets:reales     # dimensiones, atlas, pasabilidad y pixel a pixel

# Sincronizar paquete instalable
npm run sync:paquete
npm run build:package
npm run verify:package
```

## Garantías del verificador

`npm run verify:rom:campaigns` comprueba:

1. Los 807 archivos `Map*.rxdata` existen.
2. Cada campaña sólo se abre tras el switch 876.
3. Cada mapa conserva todos los NPC y warps del plano.
4. Cada mapa tiene avance, retroceso y retorno libre.
5. Los eventos están dentro de sus límites.
6. Hay más de mil combates adaptados y todos pueden perderse sin `game over`.
7. Cada campaña posee un final persistente.
8. Los conteos compilados coinciden exactamente con el análisis forense.

## Límite honesto

«Completo» aquí significa **toda la estructura detectable de los cuatro ROMs integrada y recorrible**. No significa emulación byte por byte ni copia literal de sus guiones y assets. La minería de ROM puede producir falsos positivos y no recupera todos los nombres internos; por eso se conserva un trayecto lineal seguro y la narrativa se reescribe para Ash visitante. La sensación final todavía debe revisarse manualmente en Kirin/Game.exe.

## Estado y límites conocidos

- **Mapas y tilesets**: 1.227/1.227 con los datos del ROM (verificado pixel a pixel en 15 muestras, 3 por campaña).
- **Sprites de overworld**: 598 charsets del ROM en formato RMXP (4×4 celdas de 16×32). Glazed, Light Platinum, Liquid Crystal y TFOH salen con la paleta del cartucho; **Unbound** sale con la forma correcta pero la paleta del ROM no se ha podido resolver (su tabla de paletas usa un formato distinto al de los otros cuatro), así que sus sprites se ven con colores aproximados.
- **Battlers (Pokémon y entrenadores de combate)**: no se instalan. Los sprites de combate de estos hacks viven en tablas comprimidas y cada ROM usa un esquema de paletas distinto; el análisis está documentado en `docs/INFORME_ASSETS_ROMS.md` y el material extraído (tablas de paletas localizadas, métricas) queda en `reference/`.
- Para volver a los mapas sintéticos anteriores basta con recompilar con `npm run build:rom:campaigns`.
