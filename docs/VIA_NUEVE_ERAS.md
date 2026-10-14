# La Vía de las Nueve Eras y el Gimnasio Atlas · Las Nueve Eras

**Mapas nuevos: 2195 y 2196.** Se crean en IDs libres; **no se edita ni un
tile del contenido original de Fire Ash**. Es la respuesta a la petición de
«imagina la mejor versión referencial de un mapa y créala», y a la de que
haya **gimnasios nuevos en Atlas**.

La idea es literal: un mapa que se sienta como si **Game Freak de cada época
hubiera dibujado su propio barrio dentro del mismo plano**. Nueve distritos,
uno por generación, cada uno construido con una **ventana real** de una
ciudad canónica de esa generación —no una imitación, el tileado auténtico—,
unidos por avenidas peatonales y recorridos en serpentina para que entrar y
salir nunca obligue a desandar.

---

## 1. Mapa 2195 · Vía de las Nueve Eras

**106 × 106 tiles · tileset 1 · 1 079 tiles distintos · 7 643 celdas
andables (68,0 %) · 0 celdas vacías · 0 celdas inalcanzables · 13 eventos.**

Cada distrito mide 30 × 30 y se elige automáticamente con `mejorVentana()`:
se puntúan **todas** las ventanas posibles del mapa donante por número de
tiles distintos y por proporción de suelo, descartando las que son un muro
compacto (ratio < 0,18) o un descampado (ratio > 0,80). Gana la ventana con
más vocabulario y más suelo; es decir, la que más se parece a «una ciudad de
verdad».

| # | Generación | Ciudad donante | Mapa | Ventana (x,y) | Tiles | Andable |
|---|---|---|---|---|---|---|
| 01 | Kanto | Ciudad Azafrán | 130 | 38,14 | 281 | 41 % |
| 02 | Johto | Ciudad Trigal | 282 | 26,22 | 262 | 58 % |
| 03 | Hoenn | Ciudad Portual | 387 | 36,28 | 156 | 68 % |
| 04 | Sinnoh | Ciudad Pirita | 574 | 16,10 | 185 | 62 % |
| 05 | Unova | Ciudad Mayólica | 686 | 26,16 | 216 | 52 % |
| 06 | Kalos | Ciudad Luminalia | 793 | 16,34 | 200 | 63 % |
| 07 | Alola | Ciudad Malíe | 953 | 2,4 | 208 | 44 % |
| 08 | Galar | Ciudad Artejo | 171 | 26,18 | 234 | 54 % |
| 09 | Glazed | Ciudad Cedolán | 7 | 8,4 | 278 | 57 % |

**Ningún distrito repite a otro**: distintas ciudades, distintas ventanas y
distintos vocabularios de tiles (de 156 a 281 tiles distintos cada uno).

### 1.1 Unión y garantía de recorrido

- Cada distrito se rodea de un **anillo de suelo** del propio mapa donante
  (nunca un tile inventado: se toma el tile **transitable** más frecuente del
  mapa, no el más frecuente a secas — ese error pavimentaba con muros).
- Los nueve distritos se colocan en **serpentina**, de modo que la salida de
  uno cae junto a la entrada del siguiente.
- Las avenidas se tienden con `abrirPasillo()` y después `conectarTodo()`
  mide la conectividad real: abrió **7 pasillos de unión** extra hasta que
  **toda celda andable quedó alcanzable desde todos los eventos**.

Resultado verificado: **0 celdas huérfanas**. El mapa no tiene agujeros
negros ni islas inaccesibles.

### 1.2 Eventos (13)

| Evento | Qué hace |
|---|---|
| Regreso a Puerto Horizonte | vuelta libre y segura a Map1001 (34,23) |
| Baliza | punto de orientación y cura |
| Puerta al Gimnasio | transfiere a Map2196 |
| Guardiana de la Vía | voz de la ruta y del canon |
| 9 Cronistas de Era (`ERAS_01`…`ERAS_09`) | uno por generación: explica su barrio y pelea como recuerdo de esa época |

---

## 2. Mapa 2196 · Gimnasio Atlas · Las Nueve Eras

**46 × 42 tiles · tileset 14 (Gimnasio) · 985 celdas andables (51,0 %) ·
0 celdas vacías · 0 celdas inalcanzables · 11 eventos.**

No es otro eco de Gimnasio Pluvial ni de Ciudad Azafrán: es un **recinto
nuevo**, construido sobre una copia **centrada y única** del Gimnasio de
Petalburgo (Map416) con pasillos perimetrales y una cruz central que lo
atraviesa, de modo que los nueve entrenadores quedan en una retícula
despejada y el combate con la líder se pelea en el fondo del recinto.

| Evento | Detalle |
|---|---|
| Salida | transfiere a Map2195 (8,8) |
| `ERAS_01`…`ERAS_09` | tipo `ATLAS_ERAS_TRAINER`, nivel 100, `FULLRESTORE` |
| Líder **Vera** | tipo `ATLAS_ERAS_LEADER` · equipo ALAKAZAM / TYRANITAR / METAGROSS / GARCHOMP / HYDREIGON / GRENINJA, nivel 100 |
| Medalla | entrega la **Medalla Era** (`ATLASERABADGE`) |

### 2.1 Datos instalados (idempotente)

- `Data/trainer_types.dat` → `ATLAS_ERAS_TRAINER` («Vía Eras», clon de
  GENTLEMAN) y `ATLAS_ERAS_LEADER` («Líder Eras», clon de `LEADER_Brock`).
- `Data/trainers.dat` → 10 entrenadores (`ERAS_01`…`ERAS_09` + `VERA`),
  registrados **tanto** con clave numérica **como** con la clave
  `[type, name, 0]` que usa el motor al invocarlos por nombre.
- `Data/items.dat` → `ATLASERABADGE` («Medalla Era», clon de BOULDERBADGE,
  bolsillo 8).
- Copias de seguridad en
  `pokemon_fire_ash/PokeModBackups/atlas_eras_map/`.

---

## 3. Acceso y canon

La puerta vive en el **hub de Atlas Mil, Map1001, en (35,30)**, como evento
«PokeMod Vía: Puerta — Vía de las Nueve Eras»:

- **Página 1** — exige el **switch 873** (el duelo de Arceus) y transfiere a
  Map2195 (4,4).
- **Página 2** — si el duelo no ha ocurrido, la puerta existe pero no lleva a
  ninguna parte: *«La puerta existe, pero no lleva a ninguna parte…»*.

Se mantiene por tanto la regla de oro del canon: **nada del contenido extra
se abre antes del duelo de La Ruta de Dios**, y la vuelta siempre es libre.

---

## 4. Cómo se reproduce y cómo se verifica

```bash
node tools/apply_atlas_eras_map.mjs            # crea/actualiza 2195 y 2196
node tools/apply_atlas_eras_map.mjs --verify   # comprueba ambos mapas
npm run build:eras
npm run verify:eras
```

La verificación comprueba dimensiones, tileset, que **no haya celdas
vacías**, el porcentaje de suelo, que **todos los eventos sean alcanzables**,
la existencia de los diez entrenadores y de la Medalla Era, la puerta en
Map1001 y su condición de duelo. Es **idempotente**: se puede ejecutar mil
veces y la segunda no duplica nada (0 entrenadores nuevos, medalla ya
existente).

Los dos mapas nuevos entran además en el **paquete de la Expansión
Multiversal** (131 archivos) y en la referencia visual:
`Scripts_corregido/Mapas_PNG_16/Otros_Mapas_16.png` y
`Scripts_corregido/INFORME_REFERENCIAL_MAPAS.md`, que pasa de 1 022 a
**1 024 fichas** con la sección «Vía de las Nueve Eras».
