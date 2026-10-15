# Pipeline de sprites de personaje nativos: de `gObjectEventGraphicsInfoPointers[]` a `$ROMN_<campaña>_g<id>.png`

> Documenta **cada paso** del recorrido que hace `tools/rom_nativo_sprites.mjs`
> desde el array de punteros de la ROM hasta el PNG de personaje que consume
> RPG Maker XP / Pokémon Essentials. Los nombres de structs y arrays son los de
> `pokeemerald` (`struct ObjectEventGraphicsInfo`, `overworld_frame`,
> `sObjectEventSpritePalettes`), que es contra lo que se verificó el lector.
>
> Las cinco ROMs del plan (`content/rom_nativo.json`) son cartuchos `.gba` y sus
> personajes son **4bpp**. Un cartucho GB/GBC de 2bpp (cuatro tonos) no puede
> pasar el control de tamaño de frame (§7): se rechaza en vez de escribir una
> hoja corrupta. Para cabeceras y sprites de 2bpp está `tools/forense/gb.mjs`.

```text
ROM (.gba)
 └─ 1  cabecera + plan de campañas .................. content/rom_nativo.json
 └─ 2  gObjectEventGraphicsInfoPointers[] ........... tablaGraficos()
     └─ 3  struct ObjectEventGraphicsInfo (0x24 B) .. esFichaGrafico()
         ├─ 4  paletteTag → sObjectEventSpritePalettes[] ... tablaPaletas() / paletaDe()
         │      └─ 16 colores BGR555 (índice 0 transparente)
         │      └─ verificación del join tag → paleta ... verificarPaletasRom() / auditarPaletas()
         └─ 5  images → SpriteFrameImage[9] (8 B c/u) ...... spriteDe()
             └─ 6  tiles 8×8 en 4bpp (32 B/tile) ........... decodificación nibble
                 └─ 7  verificación de los 9 frames ........ validarFrames() / repararFrames()
                     └─ 8  hoja RMXP 4×4 reescalada ×2 ..... hojaRmxp()
                         └─ 9  PNG indexado ................. escribirPng()
                             └─ $ROMN_<campaña>_g<id>.png  +  content/rom_nativo_sprites.json
                                 └─ 10 instalación en eventos ... instalar()
                                     └─ 11 verificación ......... verificar() / verificarFrames()
```

Comandos:

```bash
npm run rom:nativo:sprites -- --extract --dir "roms pokemon"   # pasos 1-9  (+ plan)
npm run rom:nativo:sprites -- --install                        # paso 10
npm run verify:rom:nativo                                      # paso 11 (+ mapas)
npm run verify:rom:nativo:frames                               # paso 7 sobre lo entregado
npm run repair:rom:nativo:frames                               # cubre huecos de frames
npm run selftest:rom:nativo:frames                             # 35 comprobaciones sintéticas
npm run verify:rom:nativo:paletas                              # paso 4.1 (ROM + entregado)
npm run audit:campanas:paletas                                 # paso 13 (paleta de campaña vs declarada)
npm run verify:campanas:paletas                                # paso 13, recalcula y compara
npm run selftest:campanas:paletas                              # 16 comprobaciones sintéticas
npm run verify:gbc:fidelidad                                   # paso 14 (4 colores por sprite, sin degradados)
npm run fix:gbc:fidelidad                                      # paso 14, corrige y registra la reparación
```

La carpeta `roms pokemon/` está ignorada por Git: los binarios nunca entran al
repositorio, sólo el plan y los PNG derivados.

---

## 1. Cabecera de la ROM y plan de campañas

`--extract` lee `content/rom_nativo.json` (lo escribió antes `rom_nativo_mapas.mjs`)
y recorre sus cinco campañas. Cada entrada trae el nombre del archivo de ROM y, por
cada mapa, la lista de NPCs con sus coordenadas, y **cada NPC guarda el
`graphicsId` que usa el juego**. Si la ROM no está en `--dir` (por defecto
`roms pokemon/`) la campaña se omite con un aviso, sin abortar el resto.

| clave | ROM | mapas | NPCs |
|---|---|---|---|
| `0` | `GlazedESPB6.gba` | 111 | 770 |
| `1` | `LightPlatinumEsp.gba` | 19 | 188 |
| `2` | `LiquidCrystalESP.gba` | 432 | 2 457 |
| `3` | `Pokémon TFOH-Beta3.gba` | 245 | 2 101 |
| `4` | `Pokemon unbound gba.gba` | 420 | 4 175 |

`spritesUsados()` cuenta esos `graphicsId` (de más a menos usados). **Sólo se
extraen los personajes que la campaña realmente viste**: eso reduce la búsqueda en
la ROM y hace que la tabla de gráficos se pueda identificar por cobertura (§2).

---

## 2. Localizar `gObjectEventGraphicsInfoPointers[]`

`tablaGraficos(data, ids)` no confía en la dirección del símbolo (los hacks mueven
todo), así que **busca el array por su forma y lo puntúa por cobertura**:

1. Recorre la ROM de 4 en 4 bytes probando cada offset como posible inicio de array.
2. En cada candidato lee hasta 60 punteros seguidos y cuenta cuántos resuelven a un
   `ObjectEventGraphicsInfo` válido (`esFichaGrafico`, §3). Se toleran huecos de
   hasta `HUECO_CANDIDATO = 40` entradas porque varios hacks dejan tramos nulos
   (Unbound, por ejemplo).
3. Un offset es candidato si tiene **≥ 25 fichas válidas**. A propósito **no** se
   descartan solapamientos: un sub-array desplazado del real también parece válido
   y tiene que competir.
4. `puntuar()` mide dos cosas por candidato: la **cobertura** (cuántos de los
   `graphicsId` que usan los NPCs de la campaña resuelven) y el **número de fichas**
   hasta el primer hueco mayor de 12 entradas.
5. Gana el candidato con más cobertura; a igualdad, el array **más largo**, porque
   un array posterior suele ser un sub-array desplazado del verdadero.

El resultado (`{ o, cobertura, fichas, hasta }`) se guarda en el plan como
`gfxTab`, `gfxCobertura` y `gfxFichas`:

| campaña | `gfxTab` | cobertura |
|---|---|---|
| Glazed | `0x505620` | 105 / 105 |
| Light Platinum | `0x36dc40` | 40 / 41 |
| Liquid Crystal | `0xab4e60` | 113 / 122 |
| TFOH | `0x7d24f4` | 195 / 198 |
| Unbound | `0x8110e0` | 193 / 207 |

Los `graphicsId` que no resuelven son los `faltantes` del plan (no se inventa una
hoja para ellos).

---

## 3. `struct ObjectEventGraphicsInfo` (0x24 bytes)

`esFichaGrafico(data, t)` decide si `t` es una ficha real. Campos que usa, con su
offset dentro del struct:

| Offset | Campo | Comprobación |
|---|---|---|
| `0x02` | `paletteTag` | rango 0x1100–0x1FFF (el clásico es 0x1100–0x11FF; los hacks reasignan) |
| `0x08` | ancho en píxeles | 8 ≤ ancho ≤ 64 y múltiplo de 8 |
| `0x0A` | alto en píxeles | 8 ≤ alto ≤ 64 y múltiplo de 8 |
| `0x10` | tabla de OAM | puntero válido (0x08xxxxxx dentro de la ROM) |
| `0x14` | subconjuntos | puntero válido |
| `0x18` | animaciones | puntero válido |
| `0x1C` | `images` → tabla de frames | puntero válido y coherente con §5 |
| `0x20` | animaciones afines | 0 o puntero válido |

Además se exige que la tabla de frames empiece con una entrada coherente (puntero
válido y `size` = `ancho×alto/2`) y que **al menos 6 de los 9** frames lo estén:
ese detalle es lo que distingue la tabla real de un array de punteros parecido.

El rango 8–64 px es el del **detector** de fichas, no un límite del pipeline: un
`graphicsId` ya identificado puede declarar frames mayores (Glazed tiene 96×40 y
Unbound 128×64, los «objetos grandes») y el contrato de §7 los acepta mientras
caigan en la rejilla de tiles de 8×8.

---

## 4. `sObjectEventSpritePalettes[]` y la paleta BGR555

`preparar()` recoge los `paletteTag` de las fichas en uso y busca con
`tablaPaletas(data, tags)` el array `{ const u16 *data; u16 tag; }` de 8 bytes por
entrada que cubre más tags:

- `esPaleta` exige tag en 0x1100–0x1FFF, puntero válido y **al menos 4 de los 16
  colores distintos de cero** (evita confundir buffers vacíos con paletas).
- Igual que en §2, se toleran huecos de hasta 12 entradas y el candidato se elige
  por cobertura de tags.
- `paletasDe()` construye el mapa `tag → puntero` y `paletaDe()` lo convierte en 16
  colores RGBA. La conversión es BGR555 → 8 bits por canal
  (`r = (v & 31) * 255 / 31`, `g = ((v >> 5) & 31) * 255 / 31`,
  `b = ((v >> 10) & 31) * 255 / 31`) y **el índice 0 se marca transparente**
  (`alpha = 0`), que es la convención de los OBJ de GBA y la que espera
  `escribirPng`.

El plan guarda `palTab`, `palPaletas` (35 · 37 · 20 · 147 · 287 paletas válidas en
el array) y `palCobertura` (117 · 40 · 123 · 196 · 191, una paleta resuelta por
cada personaje extraído).

### 4.1 Cómo se verifica la lectura (fase 54)

El join `tag → paleta` es **por tag**, nunca por índice: el `paletteTag` que
declara el struct (§3, offset 0x02) se busca en las entradas del array y se lee la
paleta de la entrada que lleva **ese mismo tag**. `verificarPaletasRom()` lo
comprueba contra la ROM:

| # | Comprobación | Qué descarta |
|---|---|---|
| 1 | **Cobertura**: todos los tags de los personajes usados resuelven | una tabla incompleta o mal detectada |
| 2 | **Sin duplicados**: ningún tag apunta a dos paletas distintas | un join ambiguo (¿cuál de las dos?) |
| 3 | **Entrada bien formada**: puntero 4-alineado, 16 colores BGR555, índice 0 = cero | una «paleta» leída de datos cualesquiera |
| 4 | **Paleta fuera de los frames del propio personaje** | una paleta sacada de sus propios píxeles |
| 5 | **`reflectionPaletteTag` (0x04)** también está en el array | que el array detectado no sea `sObjectEventSpritePalettes[]` (evidencia independiente: los dos tags de un mismo struct apuntan al mismo array) |
| 6 | **Cabeza del array**: la entrada anterior ya no es una paleta | estar leyendo una cola del array y perder las primeras paletas |
| 7 | **Huecos de tag**: si el array va en orden creciente pero no consecutivo, se avisa de que un join por índice daría otra paleta | que alguien indexe por posición en vez de por tag |

Y sobre el material ya entregado, sin necesidad de ROM (`auditarPaletas()`):

- **Con registro en el plan** (`paletas`: `tags`, `refs` con el volcado de 32 bytes
  de cada paleta y su sha1, escrito por `--extract` o `--paletas`): cada hoja tiene
  que usar su tag, el tag tiene que apuntar a una paleta del registro y **todos los
  colores de la hoja tienen que estar en esa paleta**. Si a un sprite se le hubiera
  aplicado la paleta de otro, aparecerían colores que no son de su tag.
- **Sin registro**: el invariante que sí se puede medir — todas las hojas que
  comparten un tag tienen que caber en **una sola** paleta de 16 colores. Si a una
  de ellas se le hubiera aplicado otra paleta, la unión se saldría de 16.

```bash
npm run verify:rom:nativo:paletas    # ROM (si está) + material entregado
npm run refresh:rom:nativo:paletas   # relee el array de la ROM y refresca el registro del plan
npm run selftest:rom:nativo:frames   # 35 comprobaciones, con ROM sintética
```

La autocomprobación monta una **ROM sintética** en memoria (tiles 4bpp, tabla
`SpriteFrameImage[9]`, structs de 0x24 bytes, `gObjectEventGraphicsInfoPointers[]`
y `sObjectEventSpritePalettes[]` con una paleta distinta por tag) y comprueba que
el array se localiza en su sitio, que cada `graphicsId` se pinta con **su** paleta
(el rojo de la entrada 1 es distinto por paleta), que el circuito completo
ROM → hoja → PNG → color vuelve a dar los colores de esa paleta, y que los tres
engaños se detectan: tag repetido con dos paletas, array con los índices
desordenados y lectura de una cola del array en vez de su cabeza.

Estado medido sobre lo entregado: **667 hojas · 241 tags distintos · 241/241
grupos dentro de 16 colores** (≤15 colores opacos por hoja) y **0 fallos**. El
registro `paletas` se escribe en el plan la próxima vez que se ejecute
`--extract`/`--paletas` con las ROMs delante; entonces la comprobación pasa a ser
color a color. Las ROMs de este entorno llegan en RAR de varias partes
(`RAR5`), que no se puede abrir aquí: por eso la lectura se valida con la ROM
sintética de la autocomprobación.

---

## 5. La tabla de frames: `SpriteFrameImage[9]`

`images` apunta a 9 structs consecutivos de 8 bytes:

```c
struct SpriteFrameImage {
    const void *data;   // 0x00  puntero a los tiles del frame
    u16 size;           // 0x04  bytes del frame: ancho × alto / 2 (4bpp)
};                      // 0x06-0x07 relleno hasta 8
```

`spriteDe()` lee los nueve punteros y **cae a la tira consecutiva cuando una
entrada no cuadra**: si `data` no es un puntero válido o `size` no es exactamente
`ancho×alto/2`, el frame se lee desde `base + f × tamFrame`, donde `base` es el
primer frame del conjunto. Así los hacks con tablas irregulares no rompen la
extracción (a cambio, alguna entrada puede llegar vacía: lo detecta §7).

Los frames se usan siempre en este orden (`FRAMES`, única fuente de verdad):

| Frame | Contenido |
|---|---|
| 0 · 1 · 2 | poses quietas: abajo, arriba, lado |
| 3 · 4 | pasos de abajo |
| 5 · 6 | pasos de arriba |
| 7 · 8 | pasos de lado |

---

## 6. Decodificación 4bpp: tiles de 8×8 dentro del frame

Cada frame es una **tira de tiles GBA**: `ancho/8` tiles de ancho por `alto/8` de
alto, **32 bytes por tile** (8×8 píxeles a 4 bits), barridos por filas:

```text
tile (tx, ty) → offset = (ty × (ancho/8) + tx) × 32
píxel (x, y) del tile → byte = tile[y*4 + (x >> 1)]
                        índice = (x & 1) ? byte >> 4 : byte & 0x0f   // nibble alto = píxel derecho
color   = paleta[índice]  (16 colores BGR555; índice 0 transparente)
```

El resultado es un frame RGBA (`ancho × alto × 4` bytes) listo para componer. Los
tamaños vistos en las campañas van de 16×16 a 128×64 (p. ej. Glazed tiene 16×16,
16×32, 32×32, 64×64 y 96×40; Unbound llega a 128×64).

---

## 7. Verificación de los 9 frames (antes de armar la hoja)

`validarFrames(sprite)` se ejecuta **antes** de componer y separa dos niveles:

**Errores — la hoja no se escribe** (`rechazados` en el plan, con el motivo):
no hay 9 frames; medidas fuera de la rejilla de tiles 8×8; el frame no cabe en
bytes de 4bpp (`ancho×alto/2` no entero — así se rechaza un juego de 2bpp de
GB/GBC); un frame no trae sus `ancho×alto×4` bytes RGBA; falta la pose quieta de
una dirección.

**Avisos — se reparan o se aceptan**: frame vacío (todos los píxeles con índice 0)
o paso que repite la pose quieta (animación estática).

`repararFrames()` cubre los huecos, porque en RMXP esa celda **es** un fotograma
real: el personaje parpadearía al caminar o desaparecería entero si el hueco es la
pose quieta.

1. Si la dirección tiene pose quieta → el hueco se copia de ahí (`reparados`).
2. Si esa dirección no trae ninguna pose (objetos que en la ROM sólo tienen el
   frente) → se presta el frame equivalente de la fila de abajo (`prestados`).

La extracción anota `reparados` y `prestados` por personaje en el plan, así que el
hueco original sigue siendo rastreable. `hojaRmxp()` vuelve a validar y **lanza
error** si alguien intenta componer con frames que no pasan el contrato.

`--verify-frames [--repair]` aplica el mismo contrato a las hojas **ya escritas**:
lee cada PNG con el lector propio (`tools/forense/png.mjs`, sin canvas en Node) y
comprueba que los 9 frames se puedan recuperar de la rejilla, que la hoja tenga 16
colores o menos (4bpp), que la pose quieta se repita en las columnas 0 y 2 y que la
fila 2 sea el espejo de la 1. `--selftest` cubre esta lógica con 16 comprobaciones
sintéticas, sin ROM.

Detalle de la auditoría y de lo reparado en el material entregado:
[`docs/VERIFICACION_FRAMES_ROM_NATIVO.md`](../VERIFICACION_FRAMES_ROM_NATIVO.md).

---

## 8. Composición de la hoja RMXP de 4×4 y reescalado ×2

Escala: los mapas nativos reescalan cada metatile de 16×16 al bloque RMXP de 32×32
(`BASE_ID = 384` en `rom_nativo_mapas.mjs`), así que el personaje se reescala **×2**
para que pise el mapa con la proporción del juego. `hojaRmxp(sprite, 2)` arma una
hoja de 4 columnas × 4 filas:

| Fila | Contenido | Columnas |
|---|---|---|
| 0 | abajo | `[quieto, paso1, quieto, paso2]` = frames `0, 3, 0, 4` |
| 1 | lado (izquierda) | `2, 7, 2, 8` |
| 2 | lado (derecha) | espejo horizontal de la fila 1 |
| 3 | arriba | `1, 5, 1, 6` |

La ROM sólo trae el lado izquierdo: la fila 2 se pinta con `espejo = true`. Las
columnas 0 y 2 repiten la pose quieta (ciclo `0-1-2-3` de RMXP). Tamaños reales:
frame 16×32 → hoja **128×256**; 32×32 → **256×256**; 128×64 → **1024×512**.

---

## 9. Escritura del PNG y nombre del archivo

`escribirPng(rgba, ancho, alto)` (`tools/rom_nativo_mapas.mjs`) vectoriza los
colores y escribe un **PNG indexado** (`pngIndizado`). El bit-depth lo decide el
tamaño de la paleta: 4 bits si cabe en 16 entradas (15 colores + el transparente)
y 8 bits si no (16 colores + el transparente). En las 667 hojas entregadas salen
**559 a 4 bits y 124 a 8 bits**, todas de 16 colores o menos; si un dibujo pasara
de 255 colores, `escribirPng` cae a PNG RGBA directo.

El nombre sale de la clave de campaña y del `graphicsId`:

```text
$ROMN_<clave de campaña>_g<graphicsId>.png       p. ej. $ROMN_2_g97.png
```

- `$` = **un solo personaje** por hoja (RMXP divide la hoja en 4×4 celdas).
- `<clave>` = `0` Glazed · `1` Light Platinum · `2` Liquid Crystal · `3` TFOH · `4` Unbound.
- `g<id>` = el `graphicsId` de la ROM, para poder volver a la ficha original.

Destino: `pokemon_fire_ash/Graphics/Characters/` (y su copia en el paquete directo,
`Scripts_corregido/Paquete_directo/…`, que viaja en los ZIP descargables).

---

## 10. Plan: `content/rom_nativo_sprites.json`

Un JSON de una línea con todo lo que hizo la extracción, por campaña:

| Campo | Qué guarda |
|---|---|
| `rom` | archivo de ROM usado |
| `gfxTab`, `gfxFichas`, `gfxCobertura` | offset y calidad de `gObjectEventGraphicsInfoPointers[]` |
| `palTab`, `palPaletas`, `palCobertura` | offset y calidad de `sObjectEventSpritePalettes[]` |
| `paletas` | registro del array: `tags` (tag → puntero), `refs` (volcado de 32 bytes y sha1 de cada paleta), entradas, cabeza exacta y duplicados (se escribe al extraer con ROM; §4.1) |
| `sprites[<id>]` | `nombre`, `png`, `sha1`, `ancho`, `alto`, `frame`, `tag`, `paleta` (puntero de la paleta que le toca), `usos` y, si hubo huecos, `reparados` / `prestados` |
| `faltantes` | `graphicsId` usados que no resuelven en la ROM |
| `rechazados` | personajes cuyo contrato de 9 frames falló, con el motivo |
| `resumen` | `sprites` (667) y `bytes` (1 039 209) |

Resultado real por campaña:

| Campaña | Personajes | Faltantes | Tamaños de frame | PNG |
|---|---|---|---|---|
| Glazed | 117 | 0 | 16×16 · 16×32 · 32×32 · 64×64 · 96×40 | 165 KB |
| Light Platinum | 40 | 1 | 16×32 · 32×32 · 64×64 | 53 KB |
| Liquid Crystal | 123 | 9 | 16×16 · 16×32 · 32×16 · 32×32 · 64×64 | 136 KB |
| TFOH | 196 | 3 | 16×32 · 32×32 · 64×64 | 290 KB |
| Unbound | 191 | 14 | 16×16 · 16×32 · 32×32 · 64×64 · 128×64 | 371 KB |
| **Total** | **667** | **27** | | **≈1,0 MB** |

---

## 11. Instalación en los eventos (`--install`)

`instalar()` no toca la ROM: viste los eventos que ya se habían creado a partir de
ella (`Map<id>.rxdata` de las campañas).

1. Hace copia de seguridad del mapa en `pokemon_fire_ash/PokeModBackups/rom_nativo_sprites/`
   la primera vez.
2. `planEstructural()` reconstruye, desde `content/rom_campaigns_complete.json`, la
   lista de NPCs por mapa: el nombre del evento termina en `_<k>` y ese `k` es la
   posición del NPC en la ROM, así que el `graphicsId` se recupera en orden; si el
   evento se movió de celda, se usa el NPC de esa celda como respaldo.
3. Sólo se visten los eventos cuyo nombre es de personaje
   (`PokeMod Campaña ROM: NPC` · `Entrenador` · `Líder`): warps, carteles y el
   retorno al puerto se quedan igual.
4. En la primera página del evento se escriben **tres campos RMXP**:
   `@character_name` = `$ROMN_<campaña>_g<id>`, `@character_index` = `0` y
   `@tile_id` = `0`.

Resultado: **3 529 eventos** de las cinco campañas muestran el personaje de su ROM.

---

## 12. Verificación de lo entregado

`npm run verify:rom:nativo` encadena cuatro comprobaciones:

1. `rom_nativo_sprites.mjs --verify-frames` (§7): 667 hojas, 0 fallos, avisos
   contados por tipo.
2. `rom_nativo_sprites.mjs --verify-paletas` (§4.1): relee
   `sObjectEventSpritePalettes[]` si están las ROMs y siempre comprueba el join
   tag → paleta sobre las hojas entregadas (241/241 grupos dentro de 16 colores).
3. `rom_nativo_mapas.mjs --verify`: celdas de los mapas, `@tileset_id` y tilesets.
4. `rom_nativo_sprites.mjs --verify`: cada evento de personaje usa el PNG que le
   toca, con las dimensiones del plan y su huella **sha1**.

`npm test` añade además la comprobación de los ZIP descargables y la suite maestra
(76 258 aserciones). Estado a la fecha de este documento: la verificación de
sprites y de frames da 0 fallos; la de mapas sigue fallando por celdas que no
coinciden con el ROM en `Map3125`, `Map3323`, `Map3385`, `Map3805`, `Map3839`,
`Map3874` y dos eventos sobre celdas sólidas en `Map3120`, todo anterior a este
pipeline de sprites.

---

## 13. La paleta de campaña contra la paleta declarada

Hasta aquí se ha verificado **de qué sprite es cada paleta** (§4.1). El paso que
cierra el círculo es el contrario: comprobar que la paleta de cada dimensión
invitada se parece a la que esa dimensión **declara** en
`content/rom_campaigns_complete.json` (`campaigns[].palette`), que es texto
narrativo, y que ninguna quedó teñida con el verde de la dimensión creepypasta.
Lo mide `tools/audit_campaign_palettes.mjs`; el informe vive en
[`docs/qa/paletas_campanas.md`](paletas_campanas.md) con los números en
`content/campanas_paletas.json`.

```bash
npm run audit:campanas:paletas      # mide el arte y reescribe el informe
npm run verify:campanas:paletas     # recalcula y compara con el informe guardado
npm run selftest:campanas:paletas   # 16 comprobaciones sintéticas
```

**Cómo se mide.** Sobre el arte nativo ya extraído de esa dimensión (los 212
tilesets `ROMN_<índice>_p<n>.png` y las 667 hojas `$ROMN_<índice>_g<id>.png`), se
cuenta cada color con su frecuencia y se reduce a una **paleta GBC de cuatro
tonos** por cuantiles de luminancia —el mismo formato de cuatro tonos que la
paleta verde de la dimensión creepypasta (`#0f380f · #306230 · #8bac0f ·
#9bbc0f`)—, más el reparto por familias de tono, la temperatura (frío / cálido /
neutro) y la luminosidad y saturación medias. La unión declaración ↔ arte es
`sourceRom` → `rom` de `content/rom_nativo.json`.

**Cómo se compara.** El texto declarado se trocea por comas y conjunciones y cada
término se cruza con la tabla `PALABRAS` (qué familia de tono nombra y qué
temperatura o brillo implica). Veredictos: **coincide**, **parcial** (el color
está pero el brillo o la temperatura no cuadran) y **no coincide** (el término
nombra una familia ausente del arte). Sólo hacen fallar la verificación
`no coincide`, la falta de arte, una declaración vacía y que una dimensión haya
quedado con el verde de la dimensión creepypasta (`esVerdeGameBoy`, umbral 30).

**Estado medido** (5 dimensiones · 895 archivos · 7 283 colores):

| Dimensión | Paleta GBC medida | Lum. | Frío | Términos |
|---|---|---|---|---|
| `glazed` | #352a2a #716859 #9a9e85 #d5d6be | 0.503 | 23.8 % | 3/3 |
| `light_platinum` | #322d35 #6d5f73 #8b9577 #cccab3 | 0.478 | 35.7 % | 3/3 |
| `liquid_crystal` | #3b3338 #7c6c66 #9da97c #d5d7c5 | 0.526 | 24.3 % | 4/4 |
| `tfoh` | #332d31 #736a5e #9ca37c #d0dcb4 | 0.512 | 22.5 % | 3/3 |
| `unbound` | #292530 #626163 #889781 #c6d4b5 | 0.476 | 24.6 % | 2/3 |

15 términos confirmados, 0 parciales, 0 sin respaldo, 3 avisos (un término de
Unbound no es medible en color —«decisiones difíciles»—, Glazed es la cuarta de
cinco en frío y Light Platinum la cuarta en luminancia), **0 fallos**. Conclusión
documentada: las cinco comparten base azul + verde y se separan sobre todo por
amarillo y rojo, así que la paleta declarada describe la **intención narrativa**
de cada dimensión más que una firma cromática exclusiva.

---

## 14. Fidelidad Game Boy: cuatro colores por sprite, sin degradados

Medir la paleta de una dimensión (§13) dice *qué colores* tiene; esta sección fija
la otra mitad del contrato: **donde la GBC sólo permitía 4 colores por sprite, el
juego moderno no añade degradados**. La máquina de referencia dibuja sprites de
2 bpp contra cuatro tonos y una **máscara de un bit** por píxel, así que la regla
queda fijada en `content/dimensional_nightmare_visual_contract.json` → `fidelidad`
y se traduce en tres comprobaciones sobre el arte entregado:

1. **Cuatro tonos planos**: todo píxel visible es exactamente uno de
   `#0f380f · #306230 · #8bac0f · #9bbc0f`. Cualquier otro color sólo puede haber
   entrado por interpolación (mezcla, antialiasing, escalado suave) → degradado.
2. **Máscara de un bit**: el alfa sólo vale 0 o 255.
3. **Cuatro tonos por sprite**: ninguna celda de 16×16 px (la microcuadrícula del
   contrato) usa más tonos que los permitidos.

Alcance: los 260 PNG de la dimensión (`Graphics/**/DN_*.png` y el traje creep
`Graphics/Characters/ash_outfit_creep.png`). El resto del juego es GBA/RMXP y no le
aplica este techo.

```bash
npm run audit:gbc:fidelidad     # mide y reescribe el informe
npm run fix:gbc:fidelidad       # corrige los degradados añadidos y reescribe el informe
npm run verify:gbc:fidelidad    # recalcula y compara con el informe guardado
npm run selftest:gbc:fidelidad  # 17 comprobaciones sintéticas
npm run dn:gameboy:selftest     # 6 comprobaciones de la transformación 2×2 + máscara
```

**Qué se midió.** De los 260 archivos, **238 ya eran fieles** y **22 añadían
degradados**: los 21 iconos de medalla/cartuchera que dibuja
`tools/dn_apply_medals.mjs` (curvas y glifos con antialiasing: hasta 35 tonos por
icono, 132 píxeles con alfa parcial) y el traje creep (14 tonos, 118 píxeles con
alfa parcial). El motivo es siempre el mismo: arte «moderno» —bordes suavizados y
tonos intermedios— donde la máquina sólo podía poner un bit y cuatro colores.

**Cómo quedó.** `npm run fix:gbc:fidelidad` cuantiza cada píxel al tono permitido
más cercano y colapsa el alfa a 0/255; la reparación queda registrada en el informe
con el antes y el después (sha1 incluido), así que no se pierde la evidencia.
Estado medido: **260/260 fieles · 0 degradados · 288 píxeles de tono y 1 834 de
alfa corregidos · 0 fallos**, con la silueta conservada (peor intersección sobre
unión 0,94 y media 0,97: cambia el borde, no el dibujo). Los generadores ya no pueden reintroducirlos: los
iconos se pasan por la máscara antes de escribirse y `transformPixels()` de
`dn_apply_gameboy_palette.mjs` deja máscara dura (un bloque 2×2 que no llega al
umbral de alfa queda transparente). Informe con la lista de reparaciones:
[`docs/qa/gbc_fidelidad.md`](gbc_fidelidad.md) (+ `content/gbc_fidelidad.json`).

Nota: `npm run dn:gameboy:verify` sigue informando 14 problemas **ajenos a la
paleta** (sprites de `Map2142`, `Map2192`, `Map2193` y `Map2194` sin copia DN). Las
dos entregas guardan su propia copia del arte, así que hasta reejecutarlas siguen
sirviendo el anterior: el **paquete QA** 22 copias (`npm run build:dn:qa`) y el
**paquete directo** la del traje creep (`npm run sync:paquete` y luego
`npm run build:corregido:zip`); el informe lo avisa en cada pasada.
