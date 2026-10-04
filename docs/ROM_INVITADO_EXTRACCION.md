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

La regla es simple: **se estudia la estructura y se reinterpreta**, nunca se
copia. Lo que se genera a partir de ahí es contenido original: nuestros textos,
nuestros mapas, nuestras batallas y nuestra música. Así el DLC no arrastra
derechos de terceros y, además, encaja con el tono de Fire Ash.

## Requisitos

El ROM debe llegar **descomprimido** (o en ZIP) conservando la estructura de
RPG Maker XP:

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
