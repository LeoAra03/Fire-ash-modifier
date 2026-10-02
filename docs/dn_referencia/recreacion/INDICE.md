# Mosaicos de referencia — recreación de los 103 mapas

Generado por `npm run dn:mosaicos` (`tools/dn_render_recreacion.mjs`) a partir de las fichas de las
crepypastas (`Mapas/Crepypastas/`, catálogo en `reference/dimensional_nightmare/mapping.json`) y de los
mapas instalados en `pokemon_fire_ash/Data/`.

Cada celda enfrenta la ficha original con el mapa construido y su transitabilidad
(verde = alcanzable desde la entrada, ámbar = transitable aislado, rojo = muro).
La fuente de la transitabilidad es `content/dimensional_nightmare_passability.json`.

## Hojas

| Hoja | Mapas | Archivo |
|---|---|---|
| HUB | 1 | [`HUB.png`](HUB.png) |
| EP01 | 16 | [`EP01.png`](EP01.png) |
| EP02 | 16 | [`EP02.png`](EP02.png) |
| EP03 | 15 | [`EP03.png`](EP03.png) |
| EP04 | 16 | [`EP04.png`](EP04.png) |
| EP05 | 16 | [`EP05.png`](EP05.png) |
| EP06 | 16 | [`EP06.png`](EP06.png) |
| NEXO | 5 | [`NEXO.png`](NEXO.png) |

## Detalle por mapa

| Mapa | Episodio | Título | Ficha | Tileset | Tamaño | Tiles | BFS | Hoja |
|---|---|---|---|---|---|---|---|---|
| 2040 | HUB | Antesala de las Grietas | procedural | #6 | 30×24 | — | 92% | HUB |
| 2041 | EP01 | Catacumbas — Entrada Arqueada | R7-1 | #26 | 22×11 | 242 | 100% | EP01 |
| 2042 | EP01 | Catacumbas — Sala de las Urnas | R7-4 | #29 | 15×11 | 162 | 100% | EP01 |
| 2043 | EP01 | Catacumbas — Celdas | R7-2 | #30 | 21×11 | 226 | 100% | EP01 |
| 2044 | EP01 | Catacumbas — Galería de Barrotes | R7-6 | #31 | 22×11 | 242 | 100% | EP01 |
| 2045 | EP01 | Catacumbas — Escalera del Arco | R7-8 | #32 | 15×11 | 163 | 100% | EP01 |
| 2046 | EP01 | Catacumbas — Cripta de Sarcófagos | R7-3 | #33 | 21×11 | 231 | 100% | EP01 |
| 2047 | EP01 | Catacumbas — Osario | R7-14 | #34 | 21×12 | 252 | 100% | EP01 |
| 2048 | EP01 | Catacumbas — Jardín de Raíces | R7-5 | #35 | 21×11 | 231 | 100% | EP01 |
| 2049 | EP01 | Catacumbas — Pasadizo que Respira | R7-11 | #36 | 21×11 | 231 | 100% | EP01 |
| 2050 | EP01 | Catacumbas — Galería de Mausoleos | R7-9 | #37 | 21×11 | 222 | 100% | EP01 |
| 2051 | EP01 | Catacumbas — Sala de Pedestales | R7-12 | #38 | 20×11 | 220 | 100% | EP01 |
| 2052 | EP01 | Catacumbas — Capilla de la Campana | R7-10 | #39 | 22×11 | 242 | 100% | EP01 |
| 2053 | EP01 | Catacumbas — Sala de las Bestias | R7-13 | #40 | 21×12 | 246 | 100% | EP01 |
| 2054 | EP01 | Catacumbas — Pared de Inscripciones | R7-7 | #41 | 21×11 | 230 | 100% | EP01 |
| 2055 | EP01 | Catacumbas — Sala Ritual | R7-15 | #42 | 15×12 | 180 | 100% | EP01 |
| 2056 | EP01 | Catacumbas — Cámara de la Mano | R7-16 | #43 | 20×12 | 240 | 100% | EP01 |
| 2057 | EP02 | Pueblo Sin Color — Entrada | R5-1 | #44 | 22×12 | 264 | 100% | EP02 |
| 2058 | EP02 | Calle de las Casas Huecas | R5-6 | #45 | 22×12 | 264 | 100% | EP02 |
| 2059 | EP02 | Plaza de la Fuente Seca | R5-10 | #46 | 22×12 | 264 | 100% | EP02 |
| 2060 | EP02 | Callejón de Escombros | R5-2 | #47 | 22×12 | 264 | 100% | EP02 |
| 2061 | EP02 | Bosque de Troncos | R5-9 | #48 | 22×12 | 264 | 100% | EP02 |
| 2062 | EP02 | Páramo de Árboles Secos | R5-3 | #49 | 22×12 | 264 | 100% | EP02 |
| 2063 | EP02 | Estanque Estancado | R5-13 | #50 | 22×12 | 264 | 100% | EP02 |
| 2064 | EP02 | Puente de Madera Podrida | R5-5 | #51 | 22×12 | 263 | 100% | EP02 |
| 2065 | EP02 | Colina de la Iglesia | R5-7 | #52 | 22×12 | 257 | 99% | EP02 |
| 2066 | EP02 | Cementerio Cercado | R5-3bis (R5-3, variante) | #53 | 22×12 | 264 | 100% | EP02 |
| 2067 | EP02 | Mausoleo Central | R5-15 | #54 | 22×12 | 264 | 100% | EP02 |
| 2068 | EP02 | Cementerio Grande | R5-11 | #55 | 22×12 | 264 | 100% | EP02 |
| 2069 | EP02 | Estación Abandonada | R5-14 | #56 | 22×12 | 264 | 100% | EP02 |
| 2070 | EP02 | Biblioteca Polvorienta | R5-12 | #57 | 20×12 | 240 | 100% | EP02 |
| 2071 | EP02 | Campanario | R5-16 | #58 | 20×12 | 239 | 100% | EP02 |
| 2072 | EP02 | Torre de la Escalera de Caracol | R5-4 + R5-8 | #59 | 15×12 | 180 | 100% | EP02 |
| 2073 | EP03 | Cara Norte — Vereda Helada | R6-1 | #60 | 18×16 | 288 | 100% | EP03 |
| 2074 | EP03 | Acantilado de Zetas | R6-2 | #61 | 18×16 | 287 | 100% | EP03 |
| 2075 | EP03 | Sendero de la Cornisa | R6-3 | #62 | 18×16 | 288 | 100% | EP03 |
| 2076 | EP03 | Cabaña del Montañés | R6-4 | #63 | 18×16 | 288 | 100% | EP03 |
| 2077 | EP03 | Lago Congelado | R6-5 | #64 | 18×16 | 286 | 100% | EP03 |
| 2078 | EP03 | Pueblo de la Niebla | R6-6 | #65 | 18×16 | 288 | 100% | EP03 |
| 2079 | EP03 | Pueblo Alto | R6-7 | #66 | 18×16 | 288 | 100% | EP03 |
| 2080 | EP03 | Cueva de Bloques de Hielo | R6-8 | #67 | 18×16 | 288 | 100% | EP03 |
| 2081 | EP03 | Entrada de Cueva | R6-9 | #68 | 18×16 | 288 | 100% | EP03 |
| 2082 | EP03 | Caverna de Estalactitas | R6-10 | #69 | 18×16 | 287 | 100% | EP03 |
| 2083 | EP03 | Cámara de los Dos Lagos | R6-11 | #70 | 18×16 | 253 | 100% | EP03 |
| 2084 | EP03 | Grieta Estrecha | R6-12 | #71 | 18×16 | 287 | 100% | EP03 |
| 2085 | EP03 | Cámara de Cristales | R6-13 | #72 | 18×16 | 288 | 100% | EP03 |
| 2086 | EP03 | Templo de las Estatuas | R6-14 | #73 | 18×16 | 279 | 100% | EP03 |
| 2087 | EP03 | Corazón del Monte | R6-15 + R1 | #74 | 18×16 | 277 | 100% | EP03 |
| 2088 | EP04 | Bosque Dormido — Entrada | R2-1 | #27 | 22×10 | 220 | 100% | EP04 |
| 2089 | EP04 | Senda del Cartel Torcido | R2-2 | #75 | 22×10 | 220 | 100% | EP04 |
| 2090 | EP04 | Puente de Piedra | R2-3 | #76 | 22×10 | 220 | 100% | EP04 |
| 2091 | EP04 | Cabaña de las Ventanas | R2-4 | #77 | 22×10 | 220 | 100% | EP04 |
| 2092 | EP04 | Arco de Niebla Púrpura | R2-5 | #78 | 22×10 | 220 | 100% | EP04 |
| 2093 | EP04 | Cementerio del Bosque | R2-6 | #79 | 22×10 | 220 | 100% | EP04 |
| 2094 | EP04 | Campo de Flores Moradas | R2-7 | #80 | 22×10 | 220 | 100% | EP04 |
| 2095 | EP04 | Campamento de Tiendas | R2-8 | #81 | 22×10 | 220 | 100% | EP04 |
| 2096 | EP04 | Boca de la Cueva Negra | R2-9 | #82 | 22×10 | 220 | 100% | EP04 |
| 2097 | EP04 | Árboles Retorcidos | R2-10 | #83 | 22×10 | 220 | 100% | EP04 |
| 2098 | EP04 | Estanque de Nenúfares | R2-11 | #84 | 22×10 | 220 | 100% | EP04 |
| 2099 | EP04 | Muro de Ruinas | R2-12 | #85 | 22×10 | 220 | 100% | EP04 |
| 2100 | EP04 | Granero Abandonado | R2-13 | #86 | 22×10 | 220 | 100% | EP04 |
| 2101 | EP04 | Bosque de Luciérnagas | R2-14 | #87 | 22×10 | 220 | 100% | EP04 |
| 2102 | EP04 | Muro del Pasaje | R2-15 | #88 | 22×10 | 220 | 100% | EP04 |
| 2103 | EP04 | Árbol Anciano | R2-16 + R1 | #89 | 22×10 | 220 | 100% | EP04 |
| 2104 | EP05 | Pueblo 000 — Entrada | R5-1 vacío | #90 | 22×12 | 264 | 100% | EP05 |
| 2105 | EP05 | Calle Incompleta | R5-6 vacío | #91 | 22×12 | 264 | 100% | EP05 |
| 2106 | EP05 | Plaza sin Fuente | R5-10 vacío | #92 | 22×12 | 264 | 100% | EP05 |
| 2107 | EP05 | Callejón Terminado | R5-2 vacío | #93 | 22×12 | 264 | 100% | EP05 |
| 2108 | EP05 | Bosque Sin Troncos | R5-9 vacío | #94 | 22×12 | 264 | 100% | EP05 |
| 2109 | EP05 | Páramo Blanco | R5-3 vacío | #95 | 22×12 | 264 | 100% | EP05 |
| 2110 | EP05 | Estanque Vacío | R5-13 vacío | #96 | 22×12 | 264 | 100% | EP05 |
| 2111 | EP05 | Puente Cortado | R5-5 vacío + R1 | #97 | 22×12 | 263 | 100% | EP05 |
| 2112 | EP05 | Colina Erguida | R5-7 vacío | #98 | 22×12 | 257 | 99% | EP05 |
| 2113 | EP05 | Cementerio Vacío | R5-3bis vacío | #99 | 22×12 | 264 | 100% | EP05 |
| 2114 | EP05 | Mausoleo Abierto | R5-15 vacío | #100 | 22×12 | 264 | 100% | EP05 |
| 2115 | EP05 | Estación 000 | R5-14 vacío + R1 | #101 | 22×12 | 264 | 100% | EP05 |
| 2116 | EP05 | Biblioteca sin Letras | R5-12 vacío + R1 | #102 | 20×12 | 240 | 100% | EP05 |
| 2117 | EP05 | Campanario Roto | R5-16 vacío + R1 | #103 | 20×12 | 239 | 100% | EP05 |
| 2118 | EP05 | Pueblo 404 | R1-4 + R1-11 | #104 | 22×11 | 242 | 100% | EP05 |
| 2119 | EP05 | El Borde del Mundo | R1-6 + R1-16 | #105 | 22×11 | 240 | 98% | EP05 |
| 2120 | EP06 | Atrio de las Letras | R4-1 | #28 | 22×11 | 242 | 100% | EP06 |
| 2121 | EP06 | Sala de la Inscripción | R4-2 | #106 | 19×11 | 209 | 100% | EP06 |
| 2122 | EP06 | Corredor de Columnas | R4-3 | #107 | 17×11 | 187 | 100% | EP06 |
| 2123 | EP06 | Biblioteca Prohibida | R4-4 | #108 | 21×11 | 231 | 100% | EP06 |
| 2124 | EP06 | Balcón de los Unown | R4-5 | #109 | 22×11 | 242 | 100% | EP06 |
| 2125 | EP06 | Sala del Ojo | R4-6 | #110 | 19×11 | 209 | 100% | EP06 |
| 2126 | EP06 | Escalinata Interior | R4-7 | #111 | 22×11 | 242 | 100% | EP06 |
| 2127 | EP06 | Cripta de Sarcófagos | R4-8 | #112 | 21×11 | 231 | 100% | EP06 |
| 2128 | EP06 | Sala de los Símbolos | R4-9 | #113 | 21×11 | 231 | 100% | EP06 |
| 2129 | EP06 | Caverna de Cristales | R4-10 | #114 | 19×11 | 191 | 100% | EP06 |
| 2130 | EP06 | Galería Inundada | R4-11 | #115 | 22×11 | 240 | 100% | EP06 |
| 2131 | EP06 | Salón de las Estatuas | R4-12 | #116 | 21×11 | 231 | 100% | EP06 |
| 2132 | EP06 | Galería Menor | R4-13 | #117 | 21×11 | 231 | 100% | EP06 |
| 2133 | EP06 | Sala del Trono | R4-14 | #118 | 18×12 | 210 | 100% | EP06 |
| 2134 | EP06 | Sala LEAVENOW | R4-15 | #119 | 16×10 | 159 | 100% | EP06 |
| 2135 | EP06 | Cámara de KINGGUS | R4-16 + R3 + R1 | #120 | 22×12 | 264 | 100% | EP06 |
| 2136 | NEXO | Nexo — Falla Cero | R1-6 (void con código) | #121 | 22×11 | 240 | 98% | NEXO |
| 2137 | NEXO | Nexo — Pueblo Reensamblado | R1-1 + R1-13 | #122 | 22×11 | 242 | 100% | NEXO |
| 2138 | NEXO | Nexo — Centro Pokémon Sumergido | R1-10 (ERROR) | #123 | 22×11 | 242 | 100% | NEXO |
| 2139 | NEXO | Nexo — Pasillo de Código | R1-3 + R1-15 | #124 | 22×11 | 241 | 100% | NEXO |
| 2140 | NEXO | Nexo — Sala del Testigo | R1-4 + R1-16 | #125 | 22×11 | 242 | 100% | NEXO |

