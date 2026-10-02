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
| W7 | 16 | [`W7.png`](W7.png) |
| W8 | 16 | [`W8.png`](W8.png) |
| W9 | 16 | [`W9.png`](W9.png) |

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
| 2143 | W7 | Strangled Red — Patio de la Casa Rota | R8-1 | #126 | 21×11 | 222 | 100% | W7 |
| 2144 | W7 | Strangled Red — Cuarto del Amo | R8-2 | #127 | 21×11 | 231 | 100% | W7 |
| 2145 | W7 | Strangled Red — Pasillo de Trofeos | R8-3 | #128 | 21×11 | 231 | 100% | W7 |
| 2146 | W7 | Strangled Red — Jardín de la Promesa | R8-4 | #129 | 21×11 | 230 | 100% | W7 |
| 2147 | W7 | Strangled Red — Cocina Fría | R8-5 | #130 | 21×11 | 229 | 100% | W7 |
| 2148 | W7 | Strangled Red — Escalera Que Sube y Baja | R8-6 | #131 | 21×11 | 231 | 100% | W7 |
| 2149 | W7 | Strangled Red — Cripta del Pokémon | R8-7 | #132 | 21×11 | 231 | 100% | W7 |
| 2150 | W7 | Strangled Red — Torre de las Cintas | R8-8 | #133 | 21×11 | 231 | 100% | W7 |
| 2151 | W7 | Strangled Red — Sala de los Reflejos | R8-9 | #134 | 21×11 | 231 | 100% | W7 |
| 2152 | W7 | Strangled Red — Corredor de la Culpa | R8-10 | #135 | 21×11 | 231 | 100% | W7 |
| 2153 | W7 | Strangled Red — Plaza Sin Gente | R8-11 | #136 | 21×11 | 229 | 100% | W7 |
| 2154 | W7 | Strangled Red — Canil Vacío | R8-12 | #137 | 21×11 | 231 | 100% | W7 |
| 2155 | W7 | Strangled Red — Capilla del Nudo | R8-13 | #138 | 21×11 | 231 | 100% | W7 |
| 2156 | W7 | Strangled Red — Espejo Roto | R8-14 | #139 | 21×11 | 231 | 100% | W7 |
| 2157 | W7 | Strangled Red — Umbral del Ahorcado | R8-15 | #140 | 21×11 | 224 | 100% | W7 |
| 2158 | W7 | Strangled Red — Árbol del Ajuste | R8-16 | #141 | 21×11 | 218 | 100% | W7 |
| 2159 | W8 | Buried Alive — Pozo de Entrada | R9-1 | #142 | 21×10 | 205 | 100% | W8 |
| 2160 | W8 | Buried Alive — Túnel Angosto | R9-2 | #143 | 21×10 | 203 | 100% | W8 |
| 2161 | W8 | Buried Alive — Cámara de Tierra | R9-3 | #144 | 21×10 | 210 | 100% | W8 |
| 2162 | W8 | Buried Alive — Galería de Raíces | R9-4 | #145 | 21×10 | 210 | 100% | W8 |
| 2163 | W8 | Buried Alive — Osario Inundado | R9-5 | #146 | 21×10 | 210 | 100% | W8 |
| 2164 | W8 | Buried Alive — Escalera de Tierra | R9-6 | #147 | 21×10 | 210 | 100% | W8 |
| 2165 | W8 | Buried Alive — Cripta del Aire | R9-7 | #148 | 21×10 | 210 | 100% | W8 |
| 2166 | W8 | Buried Alive — Sala de los Sellados | R9-8 | #149 | 21×10 | 210 | 100% | W8 |
| 2167 | W8 | Buried Alive — Pozo Sin Fondo | R9-9 | #150 | 21×10 | 210 | 100% | W8 |
| 2168 | W8 | Buried Alive — Pueblo Enterrado | R9-10 | #151 | 21×10 | 210 | 100% | W8 |
| 2169 | W8 | Buried Alive — Iglesia Boca Abajo | R9-11 | #152 | 21×10 | 209 | 100% | W8 |
| 2170 | W8 | Buried Alive — Campo de Lápidas | R9-12 | #153 | 21×10 | 210 | 100% | W8 |
| 2171 | W8 | Buried Alive — Fosa Común | R9-13 | #154 | 21×10 | 210 | 100% | W8 |
| 2172 | W8 | Buried Alive — Túnel de la Mano | R9-14 | #155 | 21×10 | 210 | 100% | W8 |
| 2173 | W8 | Buried Alive — Umbral del Aire | R9-15 | #156 | 21×10 | 210 | 100% | W8 |
| 2174 | W8 | Buried Alive — Fondo de la Fosa | R9-16 | #157 | 21×10 | 210 | 100% | W8 |
| 2175 | W9 | Lavender Syndrome — Entrada del Pueblo | R10-1 | #158 | 21×11 | 231 | 100% | W9 |
| 2176 | W9 | Lavender Syndrome — Calle del Altavoz | R10-2 | #159 | 21×11 | 231 | 100% | W9 |
| 2177 | W9 | Lavender Syndrome — Casa del Piano | R10-3 | #160 | 21×11 | 231 | 100% | W9 |
| 2178 | W9 | Lavender Syndrome — Escuela de Música | R10-4 | #161 | 21×11 | 230 | 100% | W9 |
| 2179 | W9 | Lavender Syndrome — Capilla de la Campana | R10-5 | #162 | 21×11 | 227 | 100% | W9 |
| 2180 | W9 | Lavender Syndrome — Torre de las Ondas | R10-6 | #163 | 21×11 | 231 | 100% | W9 |
| 2181 | W9 | Lavender Syndrome — Calle del Silencio | R10-7 | #164 | 21×11 | 230 | 100% | W9 |
| 2182 | W9 | Lavender Syndrome — Jardín Sordo | R10-8 | #165 | 21×11 | 227 | 100% | W9 |
| 2183 | W9 | Lavender Syndrome — Mercado de Cintas | R10-9 | #166 | 21×11 | 231 | 100% | W9 |
| 2184 | W9 | Lavender Syndrome — Cine Sin Sonido | R10-10 | #167 | 21×11 | 231 | 100% | W9 |
| 2185 | W9 | Lavender Syndrome — Fosa Acústica | R10-11 | #168 | 21×11 | 231 | 100% | W9 |
| 2186 | W9 | Lavender Syndrome — Túnel de las Voces | R10-12 | #169 | 21×11 | 231 | 100% | W9 |
| 2187 | W9 | Lavender Syndrome — Sala de los Audífonos | R10-13 | #170 | 21×11 | 231 | 100% | W9 |
| 2188 | W9 | Lavender Syndrome — Torre del Canto | R10-14 | #171 | 21×11 | 231 | 100% | W9 |
| 2189 | W9 | Lavender Syndrome — Estudio del Autor | R10-15 | #172 | 21×11 | 231 | 100% | W9 |
| 2190 | W9 | Lavender Syndrome — Campanario Final | R10-16 | #173 | 21×11 | 217 | 93% | W9 |

