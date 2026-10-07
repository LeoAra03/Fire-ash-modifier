# El DLC completo: cómo queda cada punto y cómo se reproduce

Este documento es el mapa de la entrega. Resume **qué existe**, **qué se ha
añadido** y **cómo se verifica**. Todo se ha construido sin tocar el contenido
original de Fire Ash: cada cosa nueva vive en un identificador nuevo.

## 0. El canon que lo ata todo

**Sin el duelo de Arceus no existe nada de esto.** El mundo creepypasta, Atlas
Mil, la Isla Espejo con los Pokégods, las dos dimensiones de barco y la
dimensión Team Rocket son astillas del mismo golpe. Todas las puertas nuevas
exigen el **switch 873** (duelo resuelto) además de su condición anterior, y
**ninguna puerta de vuelta está jamás cerrada**.

Detalle: `docs/CANON_ARCEUS.md`.

---

## 1. La Ruta de Dios

**Estado: construida.**

| Pieza | Dónde |
|---|---|
| Siete pisos 1F–7F | Map2031–Map2037 |
| Aproximación celestial | Map2038 |
| Cima del Génesis (Arceus) | Map2037 |
| Fragmento del Génesis | Map2037, switch 882 |
| Rotom del Tiempo | switch 883, junto a cada puerta |
| Seis fases que doblan una regla | `PokeMod_CanonArceus` + `PokeMod_RutaDeDios` |

Arceus se escribe como un dios que **manda sobre conceptos** y **sabe que está
dentro de un juego**: cada fase borra una palabra del combate (OBJETO, CIELO,
TALENTO, VELOCIDAD, TIPO, REGLA), la anuncia en un cartel y la explica antes de
pegar. El módulo `CanonArceus::Meta` le hace hablar del archivo de guardado, de
la mano que pulsa los botones y de las partidas que el jugador ha apagado, y
llama a su retador por su nombre completo: **Ash Ketchum**.

Los combates dobles cinematográficos están montados para no tumbar la escena y
se auditan solos: **`npm run verify:arceus:cinematics`** (25 comprobaciones).

---

## 2. Creepypasta y Liga Oscura

**Estado: construido, y corregido un fallo de canon.**

### 2.1 El fallo que había

Los sellos de las siete emisiones vivían en los switches **868–875**. El canon
usa el **873** para «duelo de Arceus resuelto» y el **874** para «Arceus
capturado»: purgar la sexta o la séptima emisión habría abierto en falso todas
las puertas del canon. Se han trasladado al bloque **940–947**, comprobadamente
libre (el juego no pasa de 939). `npm run verify:restauracion` lo vigila.

### 2.2 Restaurar el color (Ash, agente externo)

Purgar una emisión la **cierra**; no la **salva**. Después hay que volver y
tocar su **Nexo de Color**: Ash habla como lo que es —alguien que viene de
fuera de esas dimensiones— y devuelve al mundo su **momento de paz**. El gris
se va, los pobladores dejan de repetir su trauma y la emisión deja de doler.

| Pieza | Dónde |
|---|---|
| Siete emisiones | Map2023–Map2029 |
| Purga (derrotar al jefe) | sellos 940–946 |
| Restauración (tocar el nexo) | switches 950–956, variable 310 |
| Las siete en paz | switch 957 |
| Censo Cromático y Registro del Agente | Map2021 |
| Liga Oscura | Map2192 (Umbral) y Map2193 (Arena Final) |

Cada emisión es **fiel a su creepypasta**: la torre que escuchaba, la partida
sin guardar, la fosa, la cinta carmesí, la ciudad fallida, el eco y el cartucho
de 1996. Cada una tiene dos pobladores que hablan distinto antes y después.
El gris se aplica al entrar y **se limpia al salir**, así que nunca se escapa
al mundo.

```bash
npm run build:restauracion
npm run verify:restauracion
```

---

## 3. Atlas, Glazed y Light Platinum

### 3.1 Atlas: portal y circuito de ocho gimnasios

Atlas ya era un mundo nuevo de mil mapas accesible por barco; le faltaba una
liga propia. Ahora tiene un **Portal de Atlas** en Puerto Horizonte (Map1001)
y, al otro lado, la **Avenida de los Ocho Gimnasios**.

| Pieza | Dónde |
|---|---|
| Portal de Atlas | Map1001, cerrado hasta el duelo |
| Avenida de los Ocho Gimnasios | Map2230 |
| Ocho gimnasios | Map2250–Map2257 |
| Ocho medallas | switches 970–977, variable 319 |
| Tres rivales | Dalia, Íñigo y Néstor (Avenida) |
| Cuatro cuadrillas | Bruma, Veta, Marea y Chispa |
| Vía de las Nueve Eras | Map2195 + gimnasio Map2196 (Líder Vera) |

Los ocho líderes son **originales de Atlas** y encadenados: la primera puerta
está abierta y cada una se abre con la medalla anterior.

| # | Gimnasio | Tipo | Líder | Medalla |
|---|---|---|---|---|
| 1 | Bruma | Fantasma | Néboa | ATLASBRUMABADGE |
| 2 | Veta | Roca | Canto | ATLASVETABADGE |
| 3 | Duna | Tierra | Ágata | ATLASDUNABADGE |
| 4 | Fragua | Fuego | Crisol | ATLASFRAGUABADGE |
| 5 | Marea | Agua | Náyade | ATLASMAREABADGE |
| 6 | Vendaval | Volador | Cierzo | ATLASVENTABADGE |
| 7 | Invernadero | Planta | Retoño | ATLASFLORABADGE |
| 8 | Cumbre | Eléctrico | Chispa | ATLASCHISPABADGE |

```bash
npm run build:circuito
npm run verify:circuito
```

### 3.2 Cinco ROMs como dimensiones de barco

Se llega **en barco desde Puerto Horizonte**, igual que a Atlas: un capitán por
dimensión y, en cada orilla, el mismo barco esperando para volver. Ash entra
como visitante y no reemplaza al protagonista ni reclama la historia local.

| Dimensión | Mapa | Gimnasio | Líder | Medalla/sello |
|---|---|---|---|---|
| Glazed | Map2200 «Bahía de Cedolán» | Map2201 | Ámbar | GLAZEDBADGE |
| Light Platinum | Map2210 «Costa de Lappet» | Map2211 | Resplandor | PLATINUMBADGE |
| Liquid Crystal | Map2240 «Santuario de Johto» | Map2241 | Nerea | CRYSTALBADGE |
| TFOH | Map2242 «Frontera del Origen» | Map2243 | Alba | ORIGINBADGE |
| Factory Adventure | Map2244 «Distrito Primigenio» | Map2245 | Ensamble | FACTORYSEAL |

Cada embarcadero tiene seis distritos, seis balizas de orientación, cronista,
cuatro entrenadores y dos pobladores. La vuelta nunca está cerrada. Además, los
cuatro ROM GBA abren desde allí sus campañas completas: Glazed Map3000–3110,
Light Platinum Map3120–3138, Liquid Crystal Map3200–3631 y TFOH Map3700–3944.
En conjunto son 807 mapas, 5.516 NPC, 3.252 warps y 1.059 combates adaptados.
Los IDs 2220–2221 siguen reservados a Team Rocket y Map2230 al circuito Atlas.

```bash
npm run build:dimensiones
npm run verify:dimensiones
```

---

## 4. Isla Espejo y los Pokégods

**Estado: construido antes de esta entrega y sin cambios.**

| Pieza | Dónde |
|---|---|
| Atrio de llegada | Map997 |
| Galería de Leyendas | Map998 |
| Archivo Cero | Map999 |
| Panteón Pokégod | Map1020 (25 horizontes) |
| Acceso | Espejo del Sótano Sellado de la Mansión (Map2194 ← Map192) |

Veintiún Pokégods originales con sus formas de anomalía, más el Panteón con
veinticinco escenas.

---

## 5. La dimensión Team Rocket: Ash, infiltrado

**Estado: construido en esta entrega.**

| Pieza | Dónde |
|---|---|
| Base Subterránea | Map2220 |
| Núcleo del Mando | Map2221 |
| Capitán del barco negro | Puerto Horizonte (Map1001), switch 962 |
| Rango | variable 311 (0 Recluta → 5 Jefe Supremo) |
| Misiones cumplidas | variable 312 |
| Heridos socorridos | variable 313 |
| Toma del mando | switch 963 + Insignia del Infiltrado |

Ash **no entra como viajero: entra con uniforme**. Hace las misiones que le
mandan y asciende, pero cada misión la aprovecha para lo que ha venido a hacer:

1. **Entrega en el almacén** (Recluta → Agente)
2. **Ronda de los tres guardias** (Agente → Oficial)
3. **El interrogatorio** (Oficial → Teniente) — se resuelve peleando
4. **Sabotaje del generador** (Teniente → Comandante) — apaga las celdas
5. **El juicio del Comandante** (Comandante → Jefe Supremo) — se resuelve peleando

Y por el camino, **los heridos**: tres personas tiradas por la base a las que
Ash puede pararse a curar (variable 313). Socorrer no puntúa para el ascenso;
socorrer es lo que hace cuando nadie le ve, y el juego lo subraya.

Al llegar a **Jefe Supremo** se abre el Núcleo del Mando y Ash toma el control
de la dimensión. Lo primero que hace es dictar tres órdenes, y ninguna es de
poder: **ningún herido se queda tirado, las celdas se vacían y la dimensión
queda abierta para quien quiera irse o quedarse**. Escala para mandar, y manda
para que los de ahí estén bien.

```bash
npm run build:rocket
npm run verify:rocket
```

---

## 6. Mapas nuevos de esta entrega

Diecisiete mapas, todos con **0 celdas vacías y 0 celdas inalcanzables**:

| Mapa | Tamaño | Tileset | Tiles | Andable | Eventos |
|---|---|---|---|---|---|
| 2195 Vía de las Nueve Eras | 106×106 | 1 | 1 079 | 68,0 % | 13 |
| 2196 Gimnasio de las Nueve Eras | 46×42 | 14 | 36 | 51,0 % | 11 |
| 2200 Glazed — Bahía de Cedolán | 106×72 | 1 | 629 | 68,5 % | 9 |
| 2201 Gimnasio Glazed | 46×42 | 14 | 63 | 90,4 % | 2 |
| 2210 Light Platinum — Costa de Lappet | 106×72 | 1 | 514 | 65,7 % | 9 |
| 2211 Gimnasio Light Platinum | 46×42 | 14 | 63 | 90,4 % | 2 |
| 2220 Team Rocket — Base Subterránea | 106×72 | 3 | 305 | 55,3 % | 18 |
| 2221 Team Rocket — Núcleo del Mando | 72×72 | 3 | 269 | 49,3 % | 3 |
| 2230 Avenida de los Ocho Gimnasios | 106×72 | 1 | 902 | 70,9 % | 18 |
| 2250–2257 Ocho gimnasios de Atlas | 46×42 | 14 | 13–36 | 51–78 % | 4 cada uno |

---

## 7. Orden de reconstrucción (importante)

Los instaladores se pisan entre sí: hay que respetar este orden.

```bash
node tools/apply_expansion_multiversal.mjs    # grietas, Liga Oscura, espejo, Oak
node tools/apply_canon_arceus.mjs             # SIEMPRE después: cierra las puertas
node --max-old-space-size=6144 tools/apply_atlas_eras_map.mjs
node tools/apply_restauracion_cromatica.mjs
node --max-old-space-size=6144 tools/apply_dimensiones_barco.mjs
node --max-old-space-size=6144 tools/apply_team_rocket_mision.mjs
node --max-old-space-size=6144 tools/apply_atlas_circuito.mjs
node tools/build_direct_package.mjs
node tools/apply_tone_safety_fix.mjs && node tools/apply_transition_safety_fix.mjs
node tools/build_expansion_package.mjs
node tools/generate_map_reference_package.mjs --refresh-report --force
```

Si se salta el paso del canon, `verify:canon:arceus` se pone en rojo: la
Expansión Multiversal reescribe las puertas que el canon había cerrado.

## 8. Verificación

```bash
npm run verify:all
```

Catorce verificadores en verde: canon de Arceus, tiles de Atlas, cinemáticas de
los dobles, Eras, restauración cromática, dimensiones de barco, Team Rocket,
circuito de gimnasios, paquete directo, paquete de expansión, Atlas, portal de
Arceus, tonos y transiciones.

## 9. Límite conocido

`dn:plan:check` sigue en rojo porque el espacio de trabajo purgó
`reference/dimensional_nightmare/slices/`. El paquete de Dimensional Nightmare
se construye bien; lo que no se puede regenerar aquí es el censo de recortes.
Subiendo esas imágenes se pone en verde. No afecta al juego.
