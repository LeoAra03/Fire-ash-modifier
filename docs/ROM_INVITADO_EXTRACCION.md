# Cómo aprovechar un ROM invitado (Glazed, Light Platinum, Pokémon Team Rocket)

Este documento explica qué se extrae de un ROM de referencia, cómo se hace en
este repositorio y —lo más importante— **qué no se copia nunca**.

## Qué se extrae (metadatos) y qué no (recursos)

| Se extrae | No se extrae |
|---|---|
| Nombres y tamaños de mapas | Mapas (`Map*.rxdata`) |
| Nombres de **switches y variables** (flags) | Tilesets, panoramas, autotiles |
| NPCs: nombre, sprite usado, posición, diálogos | Sprites de personajes ni de Pokémon |
| Cinemáticas: eventos comunes + bloques de texto | Música (MIDI/OGG) ni efectos de sonido |
| Batallas: entrenadores, equipos, niveles, objetos | Guiones (`Scripts.rxdata`) |
| Catálogos: especies, movimientos, objetos, habilidades | Gráficos de interfaz |

La regla que rigió las fases 1 y 2 era simple: **se estudia la estructura y se
reinterpreta**, nunca se copia. Lo que se genera a partir de ahí es contenido
original: nuestros textos, nuestros mapas, nuestras batallas y nuestra música.

> **Actualización (fase 3).** El usuario autorizó expresamente el siguiente paso:
> *«saca todos los assets de cada juego y guárdalos en otra carpeta para
> ocuparlos… hay aceptación legal y es para uso personal»*. Por eso ahora
> también se **desempaquetan los assets** (sprites, tiles, texto) en una carpeta
> propia. Sigue siendo material de **referencia**: vive en
> `reference/roms_invitadas/` (ignorada por Git) y no se distribuye ni entra en
> el juego; sirve para reconstruir y reimaginar el contenido de forma original
> (p. ej. los Pokégods de `FactoryAdventure.gb`).

## Requisitos y entrega

Dónde dejarlo: **`reference/roms_invitadas/entrada/`** (carpeta ignorada por
Git, así que ningún binario con derechos de terceros entra en el repositorio).

Formatos, de mejor a peor:

1. **Carpeta ya descomprimida** con `Data/`, `Graphics/` y `Audio/`. Es lo ideal.
2. **ZIP** — se abre sin problema en este entorno (`unzip`, con o sin clave).
3. **Multipart GBA protegido** con los cuatro archivos `gba.part01`,
   `gba.part02`, `gba.part03` y `gba.part04` — se abre con
   `node tools/unpack_gba_parts.mjs` (requiere `7z`, `7za` o `7zr`).
4. **RAR de varias partes** distinto del caso anterior — sigue dependiendo de
   que exista `unrar`, `unar`, `7z` o `bsdtar`; si no, hay que descomprimirlo en
   el PC y subir la carpeta, o recomprimirlo como ZIP.

Preparación automática:

```bash
node tools/unpack_guest_rom.mjs --entrada reference/roms_invitadas/entrada --slug team_rocket
node tools/unpack_guest_rom.mjs --entrada reference/roms_invitadas/entrada --slug glazed --clave 12345678
node tools/unpack_gba_parts.mjs --entrada reference/roms_invitadas/entrada --salida "reference/roms_invitadas/entrada/gba roms" --clave 12345678
npm run rom:unpack:gba:parts -- --entrada reference/roms_invitadas/entrada --salida "reference/roms_invitadas/entrada/gba roms" --clave 12345678
```

Busca el contenedor, prueba contraseñas (las que pases con `--clave` y la serie
numérica típica: 1, 12, 123, …, 12345678), descomprime en
`reference/roms_invitadas/<slug>/juego/` y te imprime el comando siguiente. Si
el contenedor es un RAR y no hay herramienta, lo dice y te propone las dos
alternativas.

Para el caso multipart (`gba.part01`…`gba.part04`) el comando crea la carpeta
`gba roms` si no existe, usa `gba.part01` como parte inicial y copia al destino
solo rutas válidas dentro de esa carpeta.

El ROM invitado debe conservar la estructura de RPG Maker XP:

```
<juego>/
  Data/MapInfos.rxdata, Map*.rxdata, System.rxdata, CommonEvents.rxdata,
       trainers.dat, species.dat, moves.dat, items.dat, abilities.dat, types.dat
  Graphics/Characters, Trainers, Pokemon/Front, Tilesets, ...
  Audio/BGM, BGS, ME, SE
```

Si el hack se distribuye como parche (`.ups`, `.ips`, `.xdelta`), hay que
aplicarlo antes sobre un ROM base de Pokémon Esmeralda/Fuego Rojo en español o
inglés; a partir de ahí, el juego parcheado ya tiene la estructura de arriba.

## Los ROM invitados son de GBA, no de RPG Maker XP

Glazed, Light Platinum y Pokémon Team Rocket son **ROMs de Game Boy Advance**,
así que no valen ni Pokémon Studio ni el analizador de Essentials
(`tools/inspect_guest_rom.mjs`). Para estos ROMs está
`tools/inspect_gba_rom.mjs`, que trabaja directamente sobre la ROM:

```bash
node tools/inspect_gba_rom.mjs --dir reference/roms_invitadas/entrada
node tools/inspect_gba_rom.mjs --rom "reference/roms_invitadas/entrada/GlazedESPB6.gba"
```

Qué saca, y con qué método:

| Dato | Cómo se obtiene |
|---|---|
| ROM base (Esmeralda, Rubí…), título interno, revisión | Cabecera de la ROM (0xA0–0xBC) |
| Nombres de especies, movimientos, objetos, habilidades y clases de entrenador | Charmap de la 3ª generación + búsqueda de series de entradas de ancho fijo, **ancladas** por nombres conocidos («BULBASAUR», «PLACAJE», «STENCH»…) |
| **Batallas**: entrenador, clase, equipo con especie y nivel, objetos | Estructura de entrenador de 40 bytes de la 3ª generación, buscando la serie contigua más larga |
| Recursos gráficos | Inventario de bloques LZ77 (mágico 0x10), clasificados por tamaño (64×64 = sprites de Pokémon, 32×32 = iconos…) |

Resultados reales de esta primera pasada:

| ROM | Base | Especies | Movimientos | Habilidades | Entrenadores | Bloques LZ77 |
|---|---|---:|---:|---:|---:|---:|
| GlazedESPB6 | Esmeralda | 203 (+208 en fragmentos) | 86 | 79 | 145 | 32.494 |
| LightPlatinumEsp | Rubí | 413 | 86 | 78 | 37 clases / 66 | 28.694 |
| PkmnTeamRocket | Esmeralda | en progreso | en progreso | — | en progreso | 39.143 |

PkmnTeamRocket es el más difícil: tiene las tablas repunterizadas y partidas en
muchos fragmentos (sólo aparecen nombres sueltos dentro de diálogo), así que
habrá que afinar la detección ROM por ROM.

Salida por ROM, en `reference/roms_invitadas/<nombre>/` (ignorada por Git):
`gba_inventory.json`, `informe_gba.md` y `pbs/` con `pokemon.txt`, `moves.txt`,
`items.txt`, `abilities.txt`, `trainerclasses.txt` y `trainers.txt` — este
último ya en formato PBS, listo para leer en Pokémon Studio.

## Uso

```bash
# Carpeta ya descomprimida
node tools/inspect_guest_rom.mjs --dir /ruta/al/juego --slug team_rocket

# ZIP del juego
node tools/inspect_guest_rom.mjs --zip /ruta/al/juego.zip --slug glazed

# Prueba rápida con los primeros N mapas
node tools/inspect_guest_rom.mjs --dir /ruta --slug light_platinum --limit-maps 200

# Atajo npm (los argumentos van detrás de --)
npm run rom:inspect -- --dir /ruta/al/juego --slug team_rocket
```

## Salidas

Todo va a `reference/roms_invitadas/<slug>/` (carpeta ignorada por Git, porque
contiene metadatos de terceros):

- `inventory.json` — inventario completo y legible por máquina.
- `informe.md` — informe humano: mapas con más contenido, flags más usadas,
  cinemáticas con su texto, recursos y entrenadores.
- `pbs/mapas.txt` — id, nombre, tamaño, tileset, padre y nº de eventos.
- `pbs/flags.txt` — **switches y variables con su nombre real y sus usos**.
- `pbs/entrenadores.txt` — entrenadores en formato PBS (listo para Studio).
- `pbs/species.txt`, `moves.txt`, `items.txt`, `abilities.txt`, `types.txt`.
- `pbs/npc_sprites.txt` — qué sprite usa cada NPC y cuántas veces.

## Prueba de funcionamiento

Ya está validado contra el propio Fire Ash (mismo motor, Pokémon Essentials):

```
Inventario de prueba_fire_ash: 400 mapas · 5415 eventos · 23295 líneas de texto · 7854 entrenadores
```

Con eso se comprueba que el analizador entiende:

- `MapInfos.rxdata` y `Map*.rxdata` (mapas, eventos, páginas, comandos).
- `System.rxdata` → nombres de switches y variables (876 y 298 en Fire Ash).
- `CommonEvents.rxdata` → cinemáticas y sus diálogos.
- `trainers.dat` → `GameData::Trainer` de Essentials v19+ con equipo, nivel,
  objeto y movimientos; también el formato legacy `[tipo, nombre, equipo]`.
- `species.dat`, `moves.dat`, `items.dat`, `abilities.dat`, `types.dat`.
- `Graphics/` (Characters, Trainers, Pokémon Front/Back/Iconos, Tilesets,
  panoramas, nieblas, fondos de combate, objetos, ventanas, títulos).
- `Audio/` (BGM, BGS, ME, SE) y las referencias musicales dentro de los eventos.

## Cómo se usa el inventario para enriquecer Atlas Mil

1. **Flags** → se traducen a nuestros switches/variables con un mapa explícito
   (por ejemplo «Defeated Gym 1» → sello de sector), sin reutilizar ids ajenos.
2. **NPCs** → se destila el *arquetipo* (el reclutador, el soplón, el científico
   culpable, el niño que miente) y se reescriben con nuestra voz.
3. **Cinemáticas** → se reescriben en el DSL de `content/atlas_cutscenes.json`
   (cámara, tono de pantalla, flash, rutas de movimiento, ME, retratos).
4. **Batallas** → se toman la *plantilla de diseño* (nº de Pokémon, curva de
   niveles, objetos, roles) y se montan con especies de Fire Ash.
5. **Música** → se genera música original inspirada en el *uso* (tema de base
   enemiga, tema de persecución), igual que ya se hizo con los 11 MIDI de
   Dimensional Nightmare.
6. **Sprites** → se crean reinterpretaciones originales; el inventario sólo dice
   qué sprite usaba cada NPC y para qué servía.

---

## Desempaquetado de assets (`npm run rom:assets`)

`tools/unpack_assets.mjs` saca los recursos decodificables de las 4 ROMs
invitadas y los deja en `reference/roms_invitadas/<rom>/assets/` (carpeta
ignorada por Git, igual que la de entrada):

| ROM | Qué se extrae | Resultado |
|---|---|---|
| `FactoryAdventure.gb` (GB) | Sprites de Pokémon **frontal y trasero** (RLE de 1ª generación), tabla de 193 especies | 386 PNG + `especies.txt` |
| `GlazedESPB6.gba` | Bloques LZ77 de la BIOS de GBA → tiles 4bpp | 2.399 PNG + 2.399 BIN |
| `LightPlatinumEsp.gba` | Ídem | 2.274 PNG + 2.274 BIN |
| `PkmnTeamRocket.gba` | Ídem | 29 PNG + 29 BIN |

### Cómo se decodifica el GB (Pokégods)

1. **Nombres**: tabla en `0x1C236`, 10 bytes por entrada, mapa de caracteres de
   1ª generación (`A`=0x80, espacio=0x7F, fin=0x50). Salida: **193 especies**.
2. **Sprites**: compresión RLE de 1ª generación —stream de bits MSB-first, dos
   planos de 1bpp escritos por **columnas de 2 píxeles** y empaquetados en
   tiles, con recuento de ceros en código exponencial-Golomb
   (`2^(c+1) - 1` + valor)— seguida de la **decodificación diferencial**
   (modo 0: delta a los dos planos; modo 1: delta+XOR; modo 2: delta, delta y
   XOR). Implementado tal cual `pret/pokered` (`home/uncompress.asm`).
3. **Emparejamiento con la especie**: tabla de estadísticas base de **28 bytes
   por entrada** (localizada automáticamente por votación de punteros; en este
   ROM está en `0x384CE`), con el puntero al frontal en `+0x0B` y al trasero en
   `+0x0D`. El banco del sprite se resuelve probando los 64 bancos.
4. **Validación**: un emparejamiento se considera bueno cuando el trasero está
   justo a continuación del frontal (como almacena la ROM). 190 de 193
   especies cumplen esa condición.

Salidas por ROM: `assets/sprites/<nnn>_<NOMBRE>_frontal.png`,
`assets/sprites/<nnn>_<NOMBRE>_trasero.png`, `assets/sprites_sin_emparejar/`
(entrenadores), `assets/especies.txt` y `assets/indice_assets.json`.
Informe global: `reference/roms_invitadas/ASSETS_DESEMPAQUETADOS.md`.

### Uso previsto

Los PNG extraídos son **referencia visual**, no contenido final: a partir de
ellos se generan assets originales en los formatos de Fire Ash
(Front 96×96, Icons 128×64, Characters 256×256, fondo transparente), que es lo
que realmente se integra en el juego.
