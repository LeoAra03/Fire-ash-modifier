# Equivalencias de entrenador · campañas ROM invitadas

> Documento generado por `tools/equivalencias_entrenador_campanas.mjs`. No editar a mano.

## Aviso sobre «ids GBC»

Las cinco campañas invitadas proceden de ROMs **GBA** (Glazed, Light Platinum, Liquid Crystal, TFOH Beta 3 y Pokémon Unbound). Ninguna procede de la ROM GBC `FactoryAdventure.gb`, que sólo se usa para los Pokégods. Por tanto **no existen ids GBC que mapear en estas campañas**: la tabla siguiente usa los valores GBA que sí constan en el repositorio.

## Qué es cada columna

- **tipoEntrenador (ROM)**: campo `u16` en +0x0C de cada evento de objeto del mapa GBA (`tools/gba_maps_events.mjs`). Un valor `0` es NPC normal; `> 0` marca un combate de entrenador. Se conserva en `sourceTrainerType` del plano.
- **Tipo Fire Ash**: `id` y `id_number` del tipo de entrenador creado en `pokemon_fire_ash/Data/trainer_types.dat`, clonado de la plantilla base `GENTLEMAN` (número 17).

## Regla de conversión

Toda NPC de combate de una campaña (`sourceTrainerType > 0`) se convierte en un combate `pbTrainerBattle(:<TIPO>, …)` con el **tipo Fire Ash propio de esa campaña**. El valor original no elige el tipo: sólo decide si el NPC lucha. El combate final usa el mismo tipo.

## Tabla por campaña

| Campaña | ROM fuente | Mapas Fire Ash | NPC totales | Con entrenador | Interruptor final | Variable | Tipo Fire Ash | id_number |
|---|---|---|---:|---:|---:|---:|---|---:|
| Glazed | GlazedESPB6 | 111 (3000–3110) | 345 | 33 | 990 | 350 | `GLAZED_ARCHIVE` · "Glazed · Visitante" | 622 |
| Light Platinum | LightPlatinumEsp | 19 (3120–3138) | 54 | 4 | 991 | 351 | `PLATINUM_ARCHIVE` · "Light Platinum · Visitante" | 623 |
| Liquid Crystal | LiquidCrystalESP | 432 (3200–3631) | 1203 | 273 | 992 | 352 | `CRYSTAL_ARCHIVE` · "Liquid Crystal · Visitante" | 624 |
| TFOH | Pokémon TFOH-Beta3 | 245 (3700–3944) | 705 | 169 | 993 | 353 | `TFOH_ARCHIVE` · "TFOH · Visitante" | 625 |
| Pokémon Unbound | Pokemon unbound gba | 420 (4000–4419) | 1318 | 310 | 994 | 354 | `UNBOUND_ARCHIVE` · "Pokémon Unbound · Ash · protagonista" | 627 |

## Valores de origen observados por campaña

| Campaña | Tipo Fire Ash | id_number | tipoEntrenador (ROM) observado (nº de NPC) |
|---|---|---:|---|
| Glazed | `GLAZED_ARCHIVE` | 622 | 1 (33) |
| Light Platinum | `PLATINUM_ARCHIVE` | 623 | 1 (4) |
| Liquid Crystal | `CRYSTAL_ARCHIVE` | 624 | 1 (272), 67 (1) |
| TFOH | `TFOH_ARCHIVE` | 625 | 1 (162), 3 (1), 27 (1), 34 (1), 69 (1), 71 (1), 77 (1), 88 (1) |
| Pokémon Unbound | `UNBOUND_ARCHIVE` | 627 | 1 (285), 3 (6), 26 (4), 65 (1), 66 (2), 79 (1), 81 (1), 84 (1), 85 (1), 90 (3), 104 (1), 159 (4) |

## Tipo base y totales

- Base de clonado: `GENTLEMAN` (id_number 17).
- Combates de entrenador convertidos en total: 789, consistentes con `totals.trainers` del plano.

## Límites conocidos

- `tipoEntrenador` **no** es la clase de entrenador de la ROM (la clase vive en la tabla `trainers` de 40 bytes, que se extrae a `reference/roms_invitadas/`, ignorado por Git y no versionado). Por eso no hay equivalencia clase ROM → clase Fire Ash: todo combate de una campaña cae en un único tipo.
- Los conteos proceden del plano `rom_campaigns_complete.json`; si se regenera el plano, ejecutar de nuevo este script.
