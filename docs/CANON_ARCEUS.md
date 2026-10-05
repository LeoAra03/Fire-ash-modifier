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
