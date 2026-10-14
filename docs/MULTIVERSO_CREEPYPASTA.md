# Fire Ash: A Través del Multiverso — Emisiones Prohibidas del Monte Silver

> Capa creepypasta del mod, autorizada por `tools/create_multiverse_creepypasta.mjs` e instalada por `tools/apply_multiverse_creepypasta.mjs` sobre los datos compilados de Fire Ash 3.7.1. **Homenajes reinterpretados**: cada cuento conserva su esencia con voz propia del mundo, sin copiar textos ni personajes ajenos. Solo assets existentes de Fire Ash.

## Concepto

El **Monte Silver** —la montaña de las historias sin testigos— es visitable en el postgame (switch 429) desde la quinta opción del transportador del laboratorio de Oak. En su falda, el **Archivero Prohibido** custodia las *emisiones*: siete dimensiones donde viven los cuentos que se contaron a media voz sobre Pokémon. En la cumbre, entre las siete puertas de niebla, un entrenador de gorra roja aguarda en silencio.

## Mapas (2021–2029)

| Mapa | Nombre | Plantilla | Contenido |
|---:|---|---|---|
| 2021 | Monte Silver — Falda | Rock Cave | Archivero Prohibido, curación, entrada/salida del laboratorio, subida a la cumbre |
| 2022 | Monte Silver — Cumbre | Tower Summit | Puertas de niebla (menú de 7 emisiones) + **RED, el Campeón Silencioso** |
| 2023 | La Torre que Escuchaba | Pokémon Tower 1F | LA LOCUTORA |
| 2024 | La Partida Perdida | Indigo Ice | PLATA PERDIDA |
| 2025 | La Fosa del Enterrado | Burned Tower | EL ENTERRADO |
| 2026 | La Cinta Carmesí | Lavender House | EL NIÑO DE LA CINTA |
| 2027 | Ciudad Glitch | Lavender Town | EL FALLO CERO |
| 2028 | El Eco que Jugó Contigo | Lake Verity Cave | EL ECO AHOGADO |
| 2029 | La Consola de 1996 | Lavender House | EL JUGADOR DE 1996 |

Cada emisión: señal de atmósfera, guardiana de curación, jefe y salida libre a la cumbre.

## Los homenajes (esencia preservada, voz reinterpretada)

| Emisión | Cuento de origen | Cómo se conserva la esencia |
|---|---|---|
| La Torre que Escuchaba | Lavender Town Syndrome | Una canción imposible que elige oyentes; la torre suena a voces grabadas |
| La Partida Perdida | Lost Silver | El entrenador sin nombre que camina en círculos sobre la nieve, atrapado en su partida |
| La Fosa del Enterrado | Buried Alive | Lo que excavaron donde no debían, y que ya no es del todo persona |
| La Cinta Carmesí | Strangled Red | Un niño y su partida guardada dentro de una cinta carmesí que no termina |
| Ciudad Glitch | Glitch City | Calles que se desbordaron de datos; un científico corrigiendo un error del que forma parte |
| El Eco que Jugó Contigo | las partidas que se niegan a morir | Un reflejo con retraso que repite tus movimientos y olvidó su propio nombre |
| La Consola de 1996 | la cartucho embrujada | Una partida que sigue jugándose sola desde 1996, esperando a alguien que la termine |
| La cumbre | Red en el Monte Silver | El campeón silencioso que solo habla con batallas (personaje canónico del propio Fire Ash) |

## Batallas (8)

Todas siguen las reglas de oro del proyecto:

- **`canLose` en todas** (perder = reintentar cuando quieras, con curación al lado).
- **Derrota permanente al ganar**: self-switch A + sello (`868–875`) + contador (`v[264]`) + página de registro; **no vuelven a atacar**.
- **Revancha amistosa solo por menú** («Revancha / Luego»): nunca forzada.
- **Recompensa única** por primera victoria (8 objetos, sin duplicados en el catálogo).
- Equipos ≤6 Pokémon y niveles 100–108 (tope del juego: 150).
- Mochila libre en batalla (patch global ya instalado).

| Jefe | Tipo | Equipo | Recompensa |
|---|---|---|---|
| LA LOCUTORA | PSYCHIC_F | Chandelure 102, Mismagius 101, Gengar 103, Drifblim 100, Banette 100, Froslass 101 | CLEANSE TAG |
| PLATA PERDIDA | POKEMONTRAINER_Silver | Noctowl 100 (shiny), Marowak 102, Umbreon 101, Gengar 103, Froslass 101, Spiritomb 104 | ODD KEystone |
| EL ENTERRADO | HIKER | Marowak 103, Golurk 105, Cofagrigus 103, Dusknoir 104, Sableye 101, Spiritomb 105 | SPELL TAG |
| EL NIÑO DE LA CINTA | YOUNGSTER | Porygon-Z 104, Magnezone 103, Metagross 106, Rotom 102, Electrode 101, Ditto 102 | FLAME ORB |
| EL FALLO CERO | SCIENTIST | Porygon2 103, Porygon-Z 105, Muk 102, Electrode 102, Ditto 103, Unown 101 (shiny) | GHOST GEM |
| EL ECO AHOGADO | SWIMMER_M | Jellicent 104, Froslass 103, Gengar 105, Mismagius 103, Spiritomb 106, Dusknoir 104 | SPOOKY PLATE |
| EL JUGADOR DE 1996 | SUPERNERD | Porygon-Z 105, Rotom 104, Gengar 105, Chandelure 104, Banette 103, Dusknoir 105 | LIFE ORB |
| **RED** | CHAMPION_Red | Pikachu 108, Venusaur 106, Charizard 106, Blastoise 106, Lapras 105, Snorlax 107 | LEFTOVERS |

## Fauna salvaje

Las 9 zonas del Monte Silver y las 3 de Isla Espejo tienen tablas de encuentros temáticas en `encounters.dat` (`content/wild_zones.json`): la línea de Larvitar en la montaña, fantasmas en la torre, hielo perdido en la nieve, datos vivos en Ciudad Glitch, agua ecoica al surfear en la gruta (86 slots, niveles 70–108). El Bosque Susurrante suma sus manadas en hierba.

## Integración

- **Entrada**: **siete grietas** instaladas por la Expansión Multiversal en Kanto y Johto (Torre Pokémon, Islas Espuma, Monte Moon, Torre Quemada, Planta de Energía, Ruinas Alfa y Mansión Pokémon). Cada grieta avisa y pregunta Entrar/Retirarse antes de cruzar. Con las siete purgadas aparece el **punto de colapso** de la Torre Pokémon 1F, que sube a la falda. La antigua cápsula del hub del laboratorio de Oak **ya no existe**.
- **Retorno libre**: cada emisión tiene un evento «Volver al mundo» que devuelve a la celda de su grieta, además de la salida original a la gruta; la falda baja al mundo por la torre.
- Nombres de mapa resueltos por el fallback de `MapInfos` (sin reescribir paquetes de idiomas).
- 8 equipos nuevos en `trainers.dat` (aditivos), 9 mapas nuevos, `MapInfos` y `map_metadata` actualizados.
- Backups: `pokemon_fire_ash/PokeModBackups/multiverse_creepypasta_originals/`.

## Verificación

```bash
npm run create:multiverse   # regenera content/multiverse_creepypasta.json
npm run verify:multiverse   # estructura, derrota permanente, canLose, recompensas
npm run verify:expansion    # grietas purgables, colapso, Liga Oscura, Atlas Mil y espejo
npm run verify:defeats      # auditoría global de persistencia (incluye 2021-2029)
npm test                    # 51 + 114 + 62 pruebas
```

La checklist manual incluye la sección E con las 12 comprobaciones del Monte Silver y la sección G con las 10 de la Expansión Multiversal (`docs/QA_MANUAL_PLAYTEST.md`, 106 en total). El arco completo está en [`EXPANSION_MULTIVERSAL.md`](EXPANSION_MULTIVERSAL.md).
