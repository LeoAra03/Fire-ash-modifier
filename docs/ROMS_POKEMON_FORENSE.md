# Extracción forense de las ROMs invitadas

Las cuatro ROMs viven en **`roms pokemon/`** (carpeta ignorada por Git: los
binarios con derechos de terceros no entran nunca en el repositorio) y ahí
mismo se vuelca todo lo que se puede reconstruir de cada juego.

```bash
node tools/forense_roms.mjs                       # las cuatro
node tools/forense_roms.mjs --rom "roms pokemon/GlazedESPB6.gba"
```

## Qué se desarma y con qué decodificador

| Pieza | Cómo se obtiene | Dónde queda |
|---|---|---|
| Cabecera (título, código, tipo de cartucho) | Campos del encabezado de GBA (`0xA0`) y de GB (`0x134`) | `00_cabecera.json` |
| Nombres de especie | Entradas de 11 bytes con terminador `0xFF` (GBA) y de 10 bytes con `0x50` (GB) | `pokemon/nombres.json` |
| Estadísticas base | Estructuras de 28 bytes con tipos, grupos huevo y habilidades plausibles | `pokemon/estadisticas_base.json` |
| Evoluciones | Cinco ramas de 8 bytes por especie | `pokemon/evoluciones.json` |
| Aprendizaje por nivel | Listas de pares `(movimiento, nivel)` acabadas en `0xFFFF` | `pokemon/aprendizaje_nivel.json` |
| Sprites GBA | LZ77 de la BIOS (`0x10`) → tiles de 4 bpp → PNG indexado con su paleta BGR555 | `sprites/frontal`, `sprites/iconos` |
| Sprites GB | Descompresor de Gen 1 (ver abajo) → dos planos de 1 bpp → PNG en 4 tonos | `sprites/cadena_XX` |
| Diálogos y textos | Barrido de cadenas en el mapa de caracteres de cada generación | `dialogos/textos.json`, `dialogos.txt` |
| Catálogos | Tablas de punteros a cadenas (objetos, movimientos, tipos, mapas…) | `catalogos/` |
| Tiles y mapas | Censo de bloques LZ77 (`0x10`) y RLE (`0x30`) con su desplazamiento y muestra en PNG | `tiles/` |

### El descompresor de sprites de Gen 1

Está implementado desde el desensamblado de `pret/pokered`
(`home/uncompress.asm`), no por ingeniería inversa a ojo:

1. Lector de bits **MSB-primero** (`rlca` rota antes de leer el bit 0).
2. Cada plano empieza con un bit que indica si arranca con ceros.
3. Los ceros van codificados por longitudes: se cuentan los unos seguidos y
   después se leen `n+1` bits, sumando el desplazamiento `2^(n+1) - 1`.
4. Se escriben pares de bits en el buffer por **bandas de 8 píxeles**: cada
   banda ocupa `alto` bytes y el puntero avanza de `alto` en `alto`.
5. Los dos planos se combinan según el modo (0 = ambos diferenciales,
   1 = XOR, 2 = ambos diferenciales y XOR) y se les aplica la
   **decodificación diferencial por nybbles** (XOR acumulado, con tabla
   invertida si el sprite va volteado).

Validación: los sprites reales encadenan (el sprite *n* termina justo donde
empieza el *n*+1) y dejan un anillo exterior limpio. Con eso se separan de
los falsos positivos sin intervención manual.

## Resultado por juego

| ROM | Base | Nombres | Sprites | Diálogos | Bloques comprimidos |
|---|---|---|---|---|---|
| `FactoryAdventure.gb` | Gen 1 (GB, 1 MB) | 74 (Pokégods: SPIROCATE, MORPHUS, APACOLYPSE…) | 349 en 30 cadenas (153 de 56×56 y 176 de 32×32) | 3 999 | — |
| `GlazedESPB6.gba` | Esmeralda (BPEE, 32 MB) | 202 (+ tablas secundarias) | 282 frontales + iconos | 16 258 | 4 062 (3 456 LZ77 / 606 RLE) |
| `LightPlatinumEsp.gba` | Rubí (AXVE, 16 MB) | 411 | 385 frontales + iconos | 13 446 | 4 080 (3 531 LZ77 / 549 RLE) |
| `PkmnTeamRocket.gba` | Esmeralda (BPEE, 32 MB) | pendiente (el hack no usa la tabla corrida) | pendiente | 21 066 | 1 343 (38 LZ77 / 1 305 RLE) |

`roms pokemon/00_resumen.json` recoge el mismo resumen en formato legible por
máquina.

## Pendiente

- **Team Rocket Edition**: no usa la tabla de nombres corrida de Esmeralda
  (solo 38 bloques LZ77: probablemente recomprimió los gráficos). Hay que
  localizar sus punteros por otro camino.
- **Nombres ↔ sprites** en `FactoryAdventure.gb`: hace falta la tabla de
  punteros (banco + dirección) para emparejar los 74 nombres de Pokégods con
  sus 153 frontales.
- **Mapas, flags y misiones**: el censo de bloques comprimidos ya da el
  material bruto (tilesets y mapas de baldosas); el siguiente paso es
  reconstruir las cabeceras de mapa y los scripts de evento a partir de ahí.
- **Historia**: se puede reconstruir hilando los textos de `dialogos/` por
  desplazamiento y banco.
