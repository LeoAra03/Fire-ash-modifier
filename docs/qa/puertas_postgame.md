# Puertas del postgame — cada warp condicionado y su switch

`docs/qa/puertas_postgame.md` — fijado en **FASE 22** del plan 900 (continuación
de las auditorías de las FASES 20 y 21). Datos medidos sobre
`pokemon_fire_ash/Data` (transferencias con comando 201 y condiciones de
página de cada evento); sin opinions, todo verificable con
`tools/inventario_congelado.json` y el censo de la FASE 9.

## 1. Puertas desde mapas originales (1–996) hacia contenido extra (≥997)

Son las **24 transferencias** que cruzan la frontera original→extra. El switch
de la columna «habilita» es la condición de la página que contiene el warp.

| # | Origen | Evento (pág.) | Destino | Habilita |
|---:|---|---|---|---|
| 1 | 3 · casa de Ash | `PokeMod Diplomas: puerta del salón` (0) | 2288 Salón de Diplomas | **sin condición** (por diseño: sala de la propia casa) |
| 2 | 33 · Pallet Town | `PokeMod: Aide Isla Espejo` (0) | 997 Ciudad Teckel | **429** Postgame |
| 3 | 43 · Viridian City | `PokeMod: Guardabosques Horizontes` (0) | 1000 Bosque Susurrante | **429** + **873** |
| 4 | 43 · Viridian City | `PokeMod: Guardabosques Horizontes` (1) | 1000 Bosque Susurrante | **701** Hypno iniciada + **873** |
| 5 | 43 · Viridian City | `PokeMod: Guardabosques Horizontes` (2) | 1001 Puerto Horizonte | **703** niños rescatados + **873** |
| 6 | 43 · Viridian City | `PokeMod: Guardabosques Horizontes` (2) | 1000 Bosque Susurrante | **703** + **873** |
| 7 | 90 · Mt Moon B1F | `PokeMod Grieta: La Fosa del Enterrado` (1) | 2025 La Fosa del Enterrado | **429** |
| 8 | 90 · Mt Moon B1F | `PokeMod Grieta: La Fosa del Enterrado` (2) | 2025 La Fosa del Enterrado | **429** + **942** (grieta sellada) |
| 9 | 108 · Vermilion City | `PokeMod Expedición: Capitán` (1) | 2191 Muelle de Atlas Mil | **429** + **873** |
| 10 | 143 · Pokémon Tower 1F | `PokeMod Grieta: Punto de colapso` (1) | 2021 Monte Silver — Falda | **429** + **873** |
| 11 | 149 · Pokémon Tower 7F | `PokeMod Grieta: La Torre que Escuchaba` (1) | 2023 La Torre que Escuchaba | **429** |
| 12 | 149 · Pokémon Tower 7F | `PokeMod Grieta: La Torre que Escuchaba` (2) | 2023 La Torre que Escuchaba | **429** + **940** |
| 13 | 190 · Pokémon Mansion 2F | `PokeMod Grieta: La Consola de 1996` (1) | 2029 La Consola de 1996 | **429** |
| 14 | 190 · Pokémon Mansion 2F | `PokeMod Grieta: La Consola de 1996` (2) | 2029 La Consola de 1996 | **429** + **946** |
| 15 | 192 · Pokémon Mansion B1F | `PokeMod Espejo: Escotilla` (1) | 2194 Sótano Sellado (Isla Espejo) | **429** + **873** |
| 16 | 295 · Ruins of Alph | `PokeMod Grieta: El Eco que Jugó Contigo` (1) | 2028 El Eco que Jugó Contigo | **429** |
| 17 | 295 · Ruins of Alph | `PokeMod Grieta: El Eco que Jugó Contigo` (2) | 2028 El Eco que Jugó Contigo | **429** + **945** |
| 18 | 303 · Burned Tower | `PokeMod Grieta: La Cinta Carmesí` (1) | 2026 La Cinta Carmesí | **429** |
| 19 | 303 · Burned Tower | `PokeMod Grieta: La Cinta Carmesí` (2) | 2026 La Cinta Carmesí | **429** + **943** |
| 20 | 412 · Kanto Power Plant | `PokeMod Grieta: Ciudad Glitch` (1) | 2027 Ciudad Glitch | **429** |
| 21 | 412 · Kanto Power Plant | `PokeMod Grieta: Ciudad Glitch` (2) | 2027 Ciudad Glitch | **429** + **944** |
| 22 | 625 · Snowpoint City | `Portal a la Ruta de Dios` (0) | 2038 Aproximación Celestial | **sin condición** (por diseño: recuperación de la flag 870, ver `INFORME_LA_RUTA_DE_DIOS.md` §3) |
| 23 | 979 · Seafoam Islands | `PokeMod Grieta: La Partida Perdida` (1) | 2024 La Partida Perdida | **429** |
| 24 | 979 · Seafoam Islands | `PokeMod Grieta: La Partida Perdida` (2) | 2024 La Partida Perdida | **429** + **941** |

Las páginas (1) de cada grieta son la entrada disponible en postgame; las (2)
usan el sello de grieta (940–946, sin nombre en `System.rxdata`) que se enciende
al derrotar al jefe de la emisión correspondiente.

## 2. Warps condicionados dentro del contenido extra

### Desde Puerto Horizonte (1001), el hub

| Evento en 1001 | Destino | Habilita |
|---|---|---|
| `PokeMod Atlas Mil: Cronista` (ev900) | 1021 Sector 1 | **704** `POKEMOD HORIZONS OPEN` |
| `PokeMod Atlas Mil: Sector N` (ev901–ev950) | 1021–1996 (40 sectores) | **706** `POKEMOD ATLAS MIL OPEN` |
| `PokeMod Vía: Puerta — Vía de las Nueve Eras` (ev953) | 2195 Vía de las Nueve Eras | **873** `RUTA_DE_DIOS_ARCEUS_RESOLVED` |
| `PokeMod Barco: Capitán — Glazed` (ev954) | 2200 Bahía de Cedolán | **873** |
| `PokeMod Barco: Capitán — Light Platinum` (ev955) | 2210 Costa de Lappet | **873** |
| `PokeMod Barco: Capitán — Liquid Crystal` (ev956) | 2240 Santuario de Johto | **873** |
| `PokeMod Barco: Capitán — TFOH` (ev957) | 2242 TFOH | **873** |
| `PokeMod Barco: Capitán — Factory Adventure` (ev958) | 2244 Factory Adventure | **873** |
| `PokeMod Rocket: Capitán — Team Rocket` (ev959) | 2220 Base Subterránea | **873** |
| `PokeMod Portal: Atlas` (ev960) | 2230 Avenida de los Ocho Gimnasios | **873** |
| `PokeMod Campaña ROM: Portal — Glazed` (ev961) | 3000 Pueblo Glenwood | **876** `RUTA_DE_DIOS_COMPLETED` |
| `PokeMod Campaña ROM: Portal — Light Platinum` (ev962) | 3120 Yellow Town | **876** |
| `PokeMod Campaña ROM: Portal — Liquid Crystal` (ev963) | 3200 Pueblo Primavera | **876** |
| `PokeMod Campaña ROM: Portal — Pokémon Unbound` (ev964) | 4000 Unbound Cap. 01 | **876** |

Los 19 `Gate:` de Horizontes (ev2–ev20 → 1002–1020) no llevan condición: son
las veinte paradas postgame del puerto, ya dentro del área gated.

### Puertas de gimnasio (la puerta abre al completar la dimensión)

| Origen | Evento | Destino | Habilita |
|---|---|---|---|
| 2200 Glazed | `PokeMod Barco: Puerta del Gimnasio — Glazed` | 2201 Gimnasio Glazed | **960** (sin nombre; `dim.abierta`) |
| 2210 Light Platinum | `…— Light Platinum` | 2211 Gimnasio LP | **961** |
| 2240 Liquid Crystal | `…— Liquid Crystal` | 2241 Gimnasio LC | **962** |
| 2242 TFOH | `…— TFOH` | 2243 Gimnasio TFOH | **963** |
| 2244 Factory Adventure | `…— Factory Adventure` | 2245 Gimnasio FA | **964** |

### Circuito de los Ocho Gimnasios de Atlas (2230): cadena de medallas

| Destino | Habilita |
|---|---|
| 2250 Bruma | sin condición (primera puerta abierta) |
| 2251 Veta | **970** (medalla de Bruma) |
| 2252 Duna | **971** (medalla de Veta) |
| 2253 Fragua | **972** |
| 2254 Marea | **973** |
| 2255 Vendaval | **974** |
| 2256 Invernadero | **975** |
| 2257 Cumbre | **976** (la octava medalla; la variable 319 cuenta medallas) |

### Entrada a Dimensional Nightmare

La antesala (2040) se alcanza desde `HUB_GRIETA_CAVE` en **2030** (Monte
Silver — Gruta de los Testigos, ya contenido extra) **sin condición** en el
warp: el gate es transitivo (2030 solo se alcanza tras las puertas de la
sección 1).

## 3. Leyenda de switches

| Switch | Nombre en `System.rxdata` | Significado |
|---:|---|---|
| 429 | `Postgame` | Liga derrotada (juego original); 427 lecturas |
| 701 | `POKEMOD HYPNO RESCUE STARTED` | Misión de Hypno iniciada |
| 703 | `POKEMOD CHILDREN RESCUED` | Niños rescatados (misión completa) |
| 704 | `POKEMOD HORIZONS OPEN` | Horizontes 500 abierto |
| 706 | `POKEMOD ATLAS MIL OPEN` | Atlas Mil abierto |
| 870 | `RUTA_DE_DIOS_UNLOCKED` | Lo activa hablar con Volus (Map513, tras las 17 Tablas) |
| 873 | `RUTA_DE_DIOS_ARCEUS_RESOLVED` | Arceus derrotado en La Ruta de Dios |
| 876 | `RUTA_DE_DIOS_COMPLETED` | La Ruta de Dios completada de principio a fin |
| 940–946 | *(sin nombre)* | Sello de cada grieta multiversal (jefe derrotado) |
| 960–964 | *(sin nombre)* | Dimensión del barco completada (puerta del gimnasio) |
| 970–976 | *(sin nombre)* | Medalla anterior del circuito de Atlas |

**Las dos únicas puertas sin condición son intencionales y documentadas**: el
portal de La Ruta de Dios (recuperación para partidas que perdieron la flag
870) y el Salón de Diplomas (sala inofensiva de la casa de Ash). Todo lo demás
entra por **429**, por la cadena **870→873→876** o por los gates internos
(701/703/704/706, 940–946, 960–964, 970–976).

Regenerar la medición: auditoría de la FASE 20 (transferencias 201 con
condiciones de página) y `node tools/qa/arceus_scope_map.mjs --audit`.
