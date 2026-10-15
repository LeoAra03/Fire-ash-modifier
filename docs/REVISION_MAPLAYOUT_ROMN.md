# Revisión de la decodificación de MapLayout (tilesets ROMN)

> Fase 44 del backlog. Revisión del código que lee el MapLayout de la ROM y lo
> convierte en mapas RMXP: dos capas de metatiles, ids desde 384 y elevación
> conservada celda a celda.

## Alcance y una corrección previa

- El decodificador revisado es `tools/rom_nativo_mapas.mjs`, que trabaja con las
  ROM **GBA** de `content/rom_nativo.json` (`GlazedESPB6.gba`, `LightPlatinumEsp.gba`,
  `LiquidCrystalESP.gba`, `Pokémon TFOH-Beta3.gba`, `Pokemon unbound gba.gba`).
- La ROM GBC `FactoryAdventure.gb` **no** pasa por este decodificador ni por ningún
  otro de `tools/`. El formato de MapLayout que se revisa aquí es el de Gen 3
  (struct de 26 bytes, metatiles de 16×16 con dos capas, elevación en los bits 12–15).
  No hay un MapLayout de GBC que revisar.

## Qué se comprueba y resultado

| # | Punto | Dónde | Resultado |
|---|---|---|---|
| 1 | Cabecera MapLayout: ancho, alto, punteros a borde y mapa, par de tilesets, tamaño de borde | `leerLayout` (offsets 0–25) | **OK**: coincide con el struct de Gen 3 (`width`, `height`, `border`, `map`, `primaryTileset`, `secondaryTileset`, `borderWidth`, `borderHeight`). |
| 2 | Cabecera de tileset: comprimido, tiles, paletas, metatiles | `cargarPar` (offsets 0, 4, 8, 12) | **OK**. El campo `metatileAttributes` (offset 16) **no se lee** (ver punto 6). |
| 3 | Dos capas de metatiles: 8 u16 por metatile (4 inferiores + 4 superiores) | `renderMetatile` | **OK en el dibujo**: ambas capas se componen en un único bloque RGBA de 32×32. Ver observación A. |
| 4 | Ids desde 384 | `BASE_ID`, `traduce`, `instalarTileset` | **OK**: `BASE_ID = 384` y verificado por `tools/qa/verify_rom_nativo_base_id.mjs` (fase 43). |
| 5 | Colisión (bits 10–11) → variantes libre/sólida | `blockedOf`, variantes en `tilesets` | **OK**: cada metatile usado se emite en las dos variantes, y el paso sólido queda en la tabla de pasajes. |
| 6 | Elevación (bits 12–15) conservada **celda a celda** | `elevationOf`, `traduce`, `elevaciones` | **FALLO** (ver abajo). |
| 7 | Tipo de capa (normal / cubierta / dividida) de cada metatile | tabla `metatileAttributes` | **No decodificado**: no existe lectura de la tabla de atributos. |

### Fallo 6: la elevación se pierde

- `elevationOf` lee bien los bits 12–15 (`mapas[id].elevaciones` lo guarda), pero
  solo como **conjunto por mapa**, no por celda.
- Al instalar, `traduce` hace `ts.porMetatile[celda & 0x3ff]` y devuelve solo el id
  local del tileset. Los bits de elevación se descartan en la celda.
- Las tablas de prioridades de los tilesets ROMN son todas cero, así que la
  elevación tampoco queda ahí.

Datos medidos (`node tools/qa/verify_rom_nativo_elevacion.mjs`):

- 1 211 de 1 227 mapas nativos tienen elevaciones distintas de 0 en su layout de la ROM
  (valores 1–15).
- Celdas instaladas con bits ≥ 4096: **0**.
- Tilesets ROMN con prioridad no nula: **0**.
- Mapas que pierden la elevación: **1 211**.

El verificador sale con código 1 hasta que se corrija. No se añade a `npm test`.

#### Opciones de corrección (no implementadas en esta fase)

1. **Variantes por elevación (RMXP nativo).** Ampliar las variantes por metatile de
   `libre/sólida` a `(bloqueado, elevación)`. Cada combinación tiene su id dentro de
   `[384, 384+tiles)` y la elevación queda en el id de la celda, igual que la colisión.
   Es la única forma que el motor puede leer sin soporte nuevo. Hay que comprobar que
   el número de ids cabe en la rejilla y en la tabla de pasajes (uint16).
2. **Capa de elevación en la tabla de mapa.** RMXP solo lee tres capas: no es viable
   sin cambiar el motor.
3. **Tabla de prioridades por variante.** Solo sirve si la elevación se traduce a
   prioridad por variante, lo que obliga a la misma ampliación que la opción 1.

Requiere extraer de nuevo las ROM (`roms pokemon/`, no versionada) y reinstalar
tilesets y mapas con `tools/rom_nativo_mapas.mjs --extract` / `--install`. Es un
cambio de datos de juego y va en una fase propia.

## Observaciones (no son fallos verificados)

- **A. Dos capas aplanadas.** Las dos capas del metatile se componen en un único
  bloque de 32×32. El mapa RMXP tiene tres capas de tile, pero todas las celdas
  instaladas usan solo una, y la tabla de prioridades está a cero. Si la capa superior
  del GBA (copas de árbol, puentes) debe quedar por encima del personaje, esta
  instalación no lo garantiza. No se ha comprobado en el juego.
- **B. Atributos de metatile sin leer (punto 7).** El campo `metatileAttributes` del
  tileset (offset 16) no se decodifica. Con él se sabría qué metatiles son «cubiertos»
  o «divididos» y decidir la prioridad de cada capa. Es el paso natural antes de
  corregir el fallo 6.

## Cómo reproducir

```bash
node tools/qa/verify_rom_nativo_base_id.mjs     # punto 4: OK
node tools/qa/verify_rom_nativo_elevacion.mjs   # punto 6: FALLO (sale con código 1)
```
