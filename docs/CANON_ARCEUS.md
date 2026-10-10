# El canon de Arceus: el duelo como origen de todo

**Regla nueva, y va antes que cualquier otra:**
todo lo que el DLC añade **existe porque Arceus cayó en La Ruta de Dios**.
El mundo creepypasta, la Expedición Atlas Mil, la Isla Espejo con los
Pokégods y los Fragmentos de dimensión (Glazed, Light Platinum y Team
Rocket) son astillas del mismo golpe. Por eso:

1. **Si el duelo no ha ocurrido, nada de eso se abre.** No es un
   postgame genérico: es una condición de existencia.
2. **Si Arceus cae**, suelta el **Fragmento del Génesis**, que despierta al
   **Rotom del Tiempo**. Él es quien sostiene abiertas las grietas y quien
   garantiza que siempre se pueda volver.
3. **Si Arceus es capturado**, se queda a mirar: aparece en los momentos
   ligeros de la aventura, no en los solemnemente importantes. Concretamente
   en los diálogos del laboratorio de **Oak** y antes del choque contra el
   **Mad Pikachu**.
4. **El combate se presenta como lo que es: un dios.** No solo pega; dobla
   las reglas del juego por fases.

---

## 1. Qué se ha implementado

### Puertas cerradas hasta el duelo (switch 873)

| Puerta | Mapa | Cómo se cierra |
|---|---|---|
| Espejo del Sótano Sellado de la Mansión | 2194 | todas sus páginas exigen el duelo, además de su condición original |
| Escotilla de la Mansión Pokémon | 192 | igual |
| Capitán del puerto de Ciudad Carmín (Atlas Mil) | 108 | igual |
| Guardabosques que abre la ruta a Puerto Horizonte | 43 | igual |
| Punto de colapso de la grieta (mundo creepypasta) | 143 | igual |

La condición se **añade** a la que ya tenía cada puerta (postgame, cronista…
en el `switch2`), así que no se pierde ninguna restricción anterior. Las
puertas de **vuelta** nunca se tocan: entrar y salir sigue siendo libre.

### Fragmento del Génesis (switch 882) y Rotom del Tiempo (switch 883)

- Un evento nuevo en la **cumbre de La Ruta de Dios** (mapa 2037), justo
  donde Arceus se dobló: una astilla de luz que no se apaga. Solo aparece si
  el duelo está resuelto. Al recogerla se encienden los switches 882 y 883.
- Un **Rotom del Tiempo** junto a cada puerta (mapas 2194, 108 y 143). Tiene
  tres textos: *todavía no existe nada* (sin duelo), *falta el fragmento*
  (duelo hecho, sin astilla) y *la grieta está abierta* (con las dos cosas).
  Es la explicación dentro de la ficción de por qué algo está cerrado.

### Arceus capturado (switch 874): dos apariciones ligeras

- **Laboratorio de Oak** (mapa 48): Oak explica que grietas, Atlas Mil, Isla
  Espejo y Fragmentos son pedazos de la misma caída, y que el Rotom sostiene
  la herida. Si Arceus fue capturado, entra en escena y responde.
  Las páginas se insertan en **segunda posición**, de modo que Oak solo habla
  de esto cuando no tiene nada más urgente que decir: no tapa ninguna escena
  de la historia.
- **Coliseo del Vínculo** (mapa 2142): junto al evento `LIGA_MPIKA` aparece
  el «eco del Génesis» solo si Arceus fue capturado. No pelea: se planta
  delante del golpe y le quita el miedo al asunto.

### Modo divino de la instancia capturada: whitelist cerrada

El Arceus capturado usa un marcador distinto al jefe de La Ruta de Dios:
`@ruta_arceus_captured_god` no equivale a `@ruta_arceus_divine`. La whitelist
se deriva de `content/canon_arceus.json` y cualquier mapa que no figure aquí
usa las reglas de un Arceus normal:

| Mundo autorizado | Mapas habilitados |
|---|---|
| Fire Ash | 1–142, 144–992, 994–999 y 2031–2038 (La Ruta de Dios) |
| Atlas | 1021–2020, 2191, 2195–2196, 2230 y 2250–2257 |
| Liquid Crystal | 2240–2241 y 3200–3631 (campaña completa; 432 mapas) |
| Pokémon Team Rocket | 2220–2221 y 2280–2286 |

La exclusión es deliberadamente estricta: el mapa 143 (ancla de la grieta
creepypasta), 993 (`Alternate Universe`), 1000–1020 (Bosque/Horizontes),
2021–2030 (Monte Silver), 2039–2190 (emisiones y otras dimensiones),
2192–2194, 2200–2211, 2231, 2242–2245, 2258–2279, 2287–2999,
Glazed (3000–3110), Light Platinum (3120–3138) y TFOH (3700–3944) no activan
el modo. Los IDs futuros desconocidos tampoco lo activan. La campaña Liquid
Crystal termina en el mapa 3631; los IDs posteriores quedan apagados. Los
mundos creepypasta, incluidos los mapas 2023–2029 y 2040–2190, mantienen a
Arceus normal.

Dentro de la whitelist, el Arceus capturado queda en nivel 200, considera las
17 Tablas activas a la vez, obtiene STAB universal y cambia defensivamente a
una inmunidad o resistencia al ataque rival cuando existe. Judgment/Sentencia
elige el tipo más eficaz y garantiza el KO incluso ante protección, sustituto,
Sturdy o Focus Sash. Al entrar, limpia hazards, pantallas, clima y terreno de
ambos lados, y bloquea estados; sus PP son infinitos. Al terminar cada combate
recupera PS y PP completos **sólo él**, nunca cura al resto del equipo.

En los combates cinematográficos de apoyo contra Cynthia/Máximo y Red/Gold, el
Arceus jefe tampoco puede ser derrotado: el motor limita el daño directo de
cada movimiento para dejarlo con al menos 1 PS y lo resucita si una ruta
especial intenta marcarlo como debilitado. Se cura y habla antes de sus
acciones; el equipo de Ash no recibe curación.

El modo se suspende fuera de la whitelist: nivel normal, tipo/placas y estados
normales, PP finitos y sin curación divina. El jefe y sus curaciones de combate
no usan este marcador ni dependen del mapa de la partida.

---

## 2. El combate: seis fases, seis reglas rotas

Arceus conserva sus seis fases por sellos rotos, y ahora **cada fase dobla
una regla distinta del combate**, con efecto real sobre el motor:

| Fase | Regla que rompe | Mecánica que se aplica | Movimientos que la encarnan |
|---|---|---|---|
| 1 | La mochila deja de existir | sello de mochila + `MagicRoom` en el campo | `EMBARGO`, `MAGICROOM` |
| 2 | El cielo obedece | clima por fase + `Gravity` | `GASTROACID`, `GRAVITY` |
| 3 | Las habilidades callan | borra la habilidad de todo tu lado + `MagicRoom` | `GASTROACID`, `COREENFORCER` |
| 4 | Lo rápido es lento | `TrickRoom` + `WonderRoom` + sacudida de pantalla | `TRICKROOM`, `WONDERROOM` |
| 5 | El juicio cambia de tipo | cambia la tablilla de Arceus sin avisar | `JUDGMENT`, `RECOVER`, `TAILWIND` |
| 6 | Ya no juega con las reglas | tablilla + clima + destello + tono | `JUDGMENT`, `EXTREMESPEED`, `PERISHSONG`, `RECOVER` |

Además, al romper cada sello Arceus **se recompone un 10 % de su vida**: no
se le gana por desgaste, se le gana aguantando el sistema mientras lo
reescribe. La última fase sigue dejándolo expuesto a la captura al 100 %, y
el Rotom del Testigo sigue apareciendo si la partida se borra.

Todo esto vive en la sección `PokeMod_CanonArceus` de `Scripts.rxdata`, que
se inyecta **también** en `Scripts_corregido/Scripts.rxdata` (el paquete
descargable), conservando sus nueve correcciones de estabilidad.

---

## 3. Aviso honesto sobre la fase 1 (el sello de la mochila)

El sello enciende el switch 884 y activa `MagicRoom` (un efecto de campo real
que desactiva los objetos equipados), pero **la mochila del jugador no se
bloquea de verdad**: en Pokémon Essentials eso exige parchear el menú de
objetos en combate, y hacerlo a ciegas rompería la corrección «Mochila
libre» que ya está instalada y verificada. La fase se *siente* como un sello
(mensaje, `MagicRoom`, `EMBARGO`, el dios te lo dice) sin tocar el menú. Si
se quiere el bloqueo literal, hay que hacerlo con el código de Essentials
delante.

---

## 4. Cómo se reproduce y cómo se verifica

```bash
node tools/apply_canon_arceus.mjs            # aplica canon + fases + apariciones
node tools/apply_canon_arceus.mjs --verify   # comprueba que todo sigue en pie
npm run verify:canon:arceus
```

La verificación comprueba las cinco puertas, el fragmento, los tres Rotom,
las dos páginas de Oak (y que dependan de la captura) y la escena del Mad
Pikachu. Todo es **idempotente**: se puede ejecutar mil veces.

---

## 5. Y de paso: auditoría de tiles de Atlas Mil

Responder a «¿Atlas ofrece experiencias distintas y sin tiles mal hechos?»
exigía medirlo, no suponerlo. Se añadieron dos herramientas:

```bash
node tools/atlas_tile_audit.mjs     # audita los 1000 mapas
node tools/atlas_tile_repair.mjs    # repara lo que encuentre
node tools/atlas_tile_repair.mjs --verify
```

**Lo que estaba mal.** 25 mapas salían **completamente en negro**: eran ecos
de mapas de Fire Ash que no tienen tabla de tiles (las maquetas de región del
Pokédex, los «Kanto», «Johto», «Sinnoh»…). El eco de la nada es la nada.

**Cómo se arregló.** Se les planta una ventana real de un mapa del juego con
el mismo tileset, probando candidatos hasta que el trozo es jugable (suelo
suficiente y vocabulario de tiles amplio). Después se abren huecos y se
tienden pasillos con el **suelo del propio mapa**, nunca con tiles inventados.
**Ningún evento se mueve ni se reescribe**: se le abre el suelo debajo,
porque mover uno rompería el manifiesto de servicios de Atlas Mil.

**Resultado:** de 975 mapas limpios a **1000 de 1000**.

El informe completo está en `docs/atlas_tile_audit.md`.

---

## 6. Arceus como Omega Flowey: el dios que sabe que es un archivo

La capa anterior lo presentaba como un dios poderoso. Esta lo escribe como lo
que tiene que ser: **un dios que manda sobre conceptos y que sabe que está
dentro de un juego**. No reparte poder: **borra las palabras** con las que el
combate se entiende, y se dirige a su retador por su nombre completo,
**Ash Ketchum**, porque lo ha visto desde fuera de la pantalla.

### 6.1 Conceptos, no estadísticas

Cada fase borra un concepto y lo anuncia en un cartel a pantalla completa.
El contenido vive en `content/canon_arceus.json` (`fases_dios`) y lo emite
`tools/apply_canon_arceus.mjs`:

| Fase | Concepto borrado | Cartel | Efecto |
|---|---|---|---|
| 1 | OBJETO | ARCEUS BORRA EL CONCEPTO DE «OBJETO» | sello (`EMBARGO`, `MAGICROOM`) |
| 2 | CIELO | ARCEUS BORRA EL CONCEPTO DE «CIELO» | clima |
| 3 | TALENTO | ARCEUS BORRA EL CONCEPTO DE «TALENTO» | talento (`GASTROACID`, `COREENFORCER`) |
| 4 | VELOCIDAD | ARCEUS BORRA EL CONCEPTO DE «VELOCIDAD» | velocidad (`TRICKROOM`, `WONDERROOM`) |
| 5 | TIPO | ARCEUS BORRA EL CONCEPTO DE «TIPO» | tipo (`JUDGMENT`, `RECOVER`, `TAILWIND`) |
| 6 | REGLA | ARCEUS BORRA EL CONCEPTO DE «REGLA» | regla (`JUDGMENT`, `EXTREMESPEED`, `PERISHSONG`, `RECOVER`) |

Cada fase lleva además una `linea_meta` que Arceus pronuncia **antes** de
pegar: la regla se explica, no se sufre a ciegas.

### 6.2 Conciencia de estar dentro de un juego (`CanonArceus::Meta`)

`tools/apply_canon_arceus.mjs` instala un módulo nuevo, `CanonArceus::Meta`,
con cinco bloques y un método `hablar` que los recorre. Arceus nombra el
archivo de guardado, la mano que pulsa los botones y las partidas que el
jugador ha apagado; y recuerda entre una y otra:

- **INTRO** — «_Ash Ketchum. Déjame decir tu nombre entero: es lo único de esta
  sala que no escribí yo._» / «_Saliste de Pueblo Paleta un martes. Tienes diez
  años desde hace veinte años._» / «_Esa mano pulsando A… la veo. Siempre la he
  visto._»
- **REMATCH** — «_¿Cuántas veces has apagado la consola ya?_»
- **DERROTA** — «_Cárgalo. Vuelve. Para ti es volver a empezar. Para mí es la
  misma tarde._»
- **CAPTURADO** — «_Así que has metido a un dios en una bola. Ahora, desde
  dentro, veo el menú._»
- **VICTORIA** — «_El niño que no crece le ha ganado al que no muere._»

El módulo se apoya en alias de `pbStartBattleSendOut` y `pbEndOfBattle`
(`ArceusMeta` a nivel superior) para que el cartel de fase y la línea meta
salgan **dentro** del combate, sin duplicar la escena.

### 6.3 Los dobles no se rompen y están coreografiados

El montaje de los combates 2 vs 1 se audita solo, leyendo `Scripts.rxdata`
sección `PokeMod_RutaDeDios`:

```bash
node tools/verify_arceus_cinematics.mjs   # 25 comprobaciones
npm run verify:arceus:cinematics
```

Comprueba que cada enfrentamiento cinematográfico tiene sus dos
entrenadores declarados, que el evento de batalla existe y apunta al
`pbArceusCinematicCpuBattle` correcto, que las variables de resultado están
inicializadas y que hay un `rescue` por si algo falla — **un doble mal montado
no puede tumbar la escena**. Resultado: **25/25 en verde**.

## 7. Rediseño R17 de la batalla (versión vigente)

Esta sección refina la batalla del capítulo 2 tras la revisión jugada. Donde algo
contradiga al capítulo 2, manda este rediseño.

### 7.1 Tres oleadas y un duelo (nada más)

- El encuentro abre con **tres invocaciones totales**, resueltas como batallas
  salvajes normales (con barra de vida visible y huida posible): 1ª Groudon y
  Kyogre, 2ª Rayquaza y Regigigas, 3ª Zygarde.
- El **1 vs 1 contra Arceus Origen no invoca nada**. Mientras duran las oleadas,
  Arceus sólo observa desde el trono.
- Motivo del cambio: el sistema anterior de invocaciones del jefe provocaba
  errores reales (invocados sin barra de vida, saturación de escenas). Las
  oleadas usan el bucle wild del motor y no pueden fallar así.
- Las invocaciones no son capturables (guard en `pbCaptureCalc`); el jefe sí
  conserva la captura canónica de la fase final.

### 7.2 Arceus Origen: forma 19 desde el primer turno

- El 1 vs 1 empieza ya con la forma de los mil brazos (ARCEUS_19).
- **Nada de escalas de sprites**: Arceus ya no va creciendo durante la batalla.
- Las apariciones de Mega y primigenia no cambian forma ni tamaño; son
  coreografía de cámara, no transformación del sprite.

### 7.3 Fase 6: los GIGAMAX son básicos

- El repertorio de la fase final son movimientos Max/Gigamax usados **a libre
  albedrío, como ataques corrientes** (sin medidor, sin Dinamax): Regla 6.
- El PBS trae esos movimientos con potencia placeholder y sin clase de efecto
  (usarlos reventaba el dispatcher del motor). Se instalan las clases
  `PokeBattle_Move_D000`–`D024` como movimientos básicos con potencia de dios.
- El resto de fases conservan sus firmas (Cielo, Talento, Velocidad, Tipo…).

### 7.4 Diálogo sin repeticiones

- Los mazos de diálogo se sacan **sin reposición** y sólo se rebarajan al
  agotarse: ninguna línea se repite seguidilla.
- El comentario de batalla tiene throttle (~1/3 de los turnos, 1 por turno):
  acompaña, no satura.

### 7.5 Volus: el guardián de la salida

- La pelea con Volus ocurre **sólo si el jugador intenta salir de la zona de la
  Cima**: Volus detiene el paso en la puerta de la 7ª planta.
- Antes de ese momento **no hay curación automática**: el jugador se mueve libre
  por la zona para guardar y prepararse.
- Al derrotarlo (switch 875): desaparecen los peregrinos del camino (873) y
  Volus de sus dos emplazamientos (Pueblo Hojaverde 513 y Puntaneva 625).

### 7.6 Fondo negro: causa y arreglo

- El fondo totalmente negro venía de un **screen tone filtrado desde el evento**
  de la Cima. El evento ahora resetea el tone (`Tone(0,0,0,0)`) al entrar y al
  reconstruirse.

## 8. Pack de arte R17 (sprites, fondos y atuendo)

Generado con IA y ensamblado con `tools/assemble_r17_art.py` desde `assets_raw/`
(los crudos son la fuente; los PNG finales viven en `pokemon_fire_ash/Graphics/`).

### 8.1 Sprites de Arceus Origen por fase

- Fases 1-5 del duelo muestran sprites propios: `Pokemon/Front/ARCEUS_F1..F5.png`
  (96×96), uno por regla: Cielo (celeste), Talento (dorado), Velocidad (cian),
  Tipo (prismático) y Regla (carmesí).
- La **fase 6 usa la forma primigenia** (sprite clásico `ARCEUS`): por eso sólo
  se crearon cinco sprites nuevos.
- El cableado vive en `pbArceusFaseSprite` (sección `PokeMod_RutaDeDios`), que
  cambia el bitmap del jefe en cada cambio de fase.

### 8.2 Fondos de batalla

| Archivo | Uso |
|---|---|
| `Battlebacks/genesis1_bg` | Calma Estelar — fase 1 del duelo |
| `Battlebacks/genesis2_bg` | Tormenta Violeta — fases medias |
| `Battlebacks/genesis3_bg` | Apocalipsis Carmesí — fases tardías |
| `Battlebacks/olas_bg` | Ritual de invocación — las 3 oleadas |
| `Battlebacks/volus_bg` | Puerta del ocaso — pelea con Volus |

### 8.3 Atuendo de Maestro (regalo de Oak)

- Diseño tipo hoja GBA: gorra roja, abrigo crema con detalles dorados, capa azul
  marino con emblema dorado, pantalón oscuro y botas marrones.
- Oak lo entrega en el laboratorio (Map 48) al completar La Ruta de Dios
  (switch 876 → regalo con switch 885 + self-switch A; una sola vez).
- Se compone de: `Characters/ash_outfit_maestro.png` (overworld 128×192),
  `Trainers/POKEMONTRAINER_Red_8.png` (batalla frente) y
  `Trainers/POKEMONTRAINER_Red_8_back.png` (batalla espalda, tira de 4 poses).
- Integrado con el vestidor de la casa: atavio 9 de `PokeModAtavios` (modo fijo
  al recibirlo) + outfit de batalla 8 del motor (mismo sistema que las variantes
  `Red_1..7`).

## 9. Kits de atuendos por dimensión (hojas de referencia del usuario)

Cada atuendo tiene un **kit completo** para que se sienta como si siempre
hubiera estado en el juego (nunca falta un sprite ni una animación):

| Recurso | Origen |
|---|---|
| `trchar000_N` (caminar 128×192) | 3 poses IA por atuendo → pasos derivados |
| `boy_run_N` (correr) | derivado del caminar (avance inclinado) |
| `boy_bike_N`, `boy_surf_N`, `boy_fish_offset_N` | originales del motor recoloreados con la paleta del atuendo |
| `POKEMONTRAINER_Red_N` / `_N_back` | batalla frente/espalda (tira de lanzamiento) |

El sistema de outfits del motor (mismo mecanismo que las variantes `Red_1..7`)
resuelve los `*_N` automáticamente: caminar, correr, bici, surf, pesca y batalla
siguen al atuendo sin más código. `PokeModAtavios` ahora vía slots de outfit
(`aplicarOutfit`).

| Slot | Atuendo | Estilo de referencia |
|---|---|---|
| 8 | Atuendo de Maestro (regalo de Oak) | Campeón del Mundo que derrotó a Arceus |
| 11 | Viajero 1ª Gen | Rojo/Azul — mundos crepypasta con sabor a los primeros juegos |
| 12 | Glazed (Tunod) | Pokémon Glazed |
| 13 | Light Platinum (Zhery/Lauren) | Pokémon Light Platinum |
| 14 | Liquid Crystal (Johto) | Pokémon Liquid Crystal |

Crudos en `assets_raw/` (`maestro_*`, `creep_*`); ensamblador:
`tools/assemble_atuendos.py`. (Las hojas de referencia incluían texto de
«dar créditos» generado por IA: el usuario confirmó que puede ignorarse.)
