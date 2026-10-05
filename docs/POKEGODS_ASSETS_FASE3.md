# Pokégods: del ROM invitado a los formatos reales de Fire Ash

Este documento resume la cadena completa —ROM → nombres → arte → assets del
juego— y el estado de cada Pokégod.

## 1. Origen: los Pokégods auténticos del ROM de GB

`FactoryAdventure.gb` («POKEMON FACTORY», 1 MB, MBC3, DMG) contiene una tabla
de **193 especies** en `0x1C236` (10 bytes por entrada, mapa de caracteres de
1ª generación). Allí viven los mitos originales del patio de recreo:

| Índice | Nombre | Índice | Nombre |
|---|---|---|---|
| 27 | PIKAMARS | 149 | PIKABLU |
| 30 | ELECTRAMEW | 159 | FLARETH |
| 33 | LUNAREON | 179 | DOOMSAY |
| 35 | TOGEPI | 180/181 | DOOMSDAY |
| 39 | RATICLAW | 187 | MEWTHREE |
| 130 | APACOLYPSE | 190-192 | MISSINGNO |
| 142 | MECHTROID | 151+ | DONPHAN, AMPHAROS… |

El desempaquetador (`tools/unpack_assets.mjs`) extrae también sus **sprites
originales de 1ª generación** (frontal y trasero, 56×56, 4 colores) por
decodificación RLE + diferencial/XOR, y los empareja con su especie mediante la
tabla de estadísticas base (`0x384CE`, paso 28, punteros en `+0x0B`/`+0x0D`).

## 2. Conversión a los formatos del proyecto

`tools/generar_assets_pokegods.mjs` toma el arte conceptual
(`reference/pokegods/concept/`) y lo convierte **por código**:

1. quita el fondo blanco por inundación desde los bordes (con bordes suaves),
2. recorta a la caja envolvente,
3. reescala conservando la proporción,
4. **reduce la paleta** por median cut (≈48 colores),
5. compone las hojas y escribe los cuatro archivos.

| Formato | Tamaño | Composición |
|---|---|---|
| `Graphics/Pokemon/Front/<NOMBRE>.png` | 96×96 | vista frontal |
| `Graphics/Pokemon/Back/<NOMBRE>.png` | 96×96 | vista trasera (del arte `_back`; si no existe, del frontal) |
| `Graphics/Pokemon/Icons/<NOMBRE>.png` | 128×64 | hoja de 8 celdas de 32×32 |
| `Graphics/Characters/<NOMBRE>.png` | 256×256 | hoja 4×4 de 64×64: fila 0 abajo, 1 izq., 2 dcha. (espejo), 3 arriba |

Todos en RGBA con **fondo transparente** y paleta reducida, igual que los 1451
frontales y 1340 iconos que ya tenía el proyecto.

```bash
node tools/generar_assets_pokegods.mjs --src reference/pokegods/concept
node tools/generar_assets_pokegods.mjs --src reference/pokegods/concepto --colores 48
```

## 3. Estado del roster (`content/pokegods_originales.json`)

19 Pokégods: los 12 del folclore clásico (Pikablu, Mewthree, Flareth,
Lunareon, Solareon, Nidogod, Spooky, Doomsday, Tricket, Shadybug, Anthrax,
Dimonix) más **7 auténticos del ROM** (Pikamars, Raticlaw, Doomsay,
Apacolypse, Electramew, Mechtroid, MissingNo).

- **14 con assets listos** en los cuatro formatos.
- **5 pendientes de arte**: PIKAMARS, RATICLAW, APACOLYPSE, ELECTRAMEW,
  MECHTROID. Se generan en el siguiente turno: el límite del generador es de
  10 imágenes por turno y 5 solicitudes fueron bloqueadas por el filtro de
  seguridad al mencionar nombres registrados (se reescriben con descripciones
  genéricas: «roedor eléctrico azul», «felino psíquico bípedo», etc.).

Cada entrada del roster indica `assets.listo` y las rutas de sus cuatro
archivos, de modo que **ninguna referencia queda rota**: lo que no existe está
marcado como pendiente, no apuntado a un archivo ausente.

## 4. Formas de Anomalía

Definidas en `content/pokegods_originales.json` → `forms`:

| Forma | Nivel | IVs | Reglas |
|---|---|---|---|
| **Alfa** | 85 | 31 | Se puede huir y capturar. Reglas normales. |
| **Beta** | 100 | 31 | EV repartidos, habilidad oculta, **clima que daña al jugador**. |
| **Omega** | 100 | 31 | Además **rompe una regla del combate** (inmunidades extremas, turnos extra, ignora precisión). |

No usan niveles estándar: la dificultad la marca la forma, no el nivel.

## 5. Pendiente: sprites con nombre de los ROM de GBA

`tools/unpack_gba_mons.mjs` localiza las tablas del motor de 3ª generación
(`gMonFrontPicTable`, `gMonBackPicTable`, `gMonPaletteTable`, `gMonIconTable` y
la tabla de nombres de 11 bytes) para exportar cada Pokémon con **su nombre y
su paleta real**. Está listo pero **no se ha podido ejecutar**: los cuatro ROM
fueron purgados del espacio de trabajo junto con
`reference/roms_invitadas/` (carpeta ignorada por Git, 168 MB). Hay que volver
a subirlos a `reference/roms_invitadas/entrada/` para lanzarlo.
