# Qué significa que un mapa esté terminado

Fase 3/46199 (tarea 37). Define **cuándo un mapa de PokeMod se puede dar por terminado** —transitable,
sin celdas huérfanas, con encuentros, con música y con entrada y salida— y lo mide contra los datos
compilados del juego, mapa por mapa.

- **Registro y alcance**: [`content/mapa_terminado.json`](../../content/mapa_terminado.json).
- **Verificador**: `npm run verify:mapa_terminado` (dentro de `npm test`) y `--censo` para los 3465 mapas.
- **Lista de trabajo del censo**: [`content/mapa_terminado_censo.json`](../../content/mapa_terminado_censo.json).

Es la capa de abajo de la métrica de mundos ([`metrica_dimensiones.md`](metrica_dimensiones.md), fase 2):
un mundo no puede estar terminado si sus mapas no lo están.

## Las cinco condiciones

| # | Condición | Definición operativa (lo que comprueba el verificador) |
|---|---|---|
| 1 | **Transitable** | Existe `Map\<id\>.rxdata`, el tileset tiene nombre (sin nombre, el mapa entra en negro y revienta), hay celdas transitables y **la llegada** pisa una celda por la que se camina. |
| 2 | **Sin celdas huérfanas** | Desde la llegada (o llegadas: en el juego base un mapa se entra por varias puertas) se alcanza con el **movimiento real del motor** —cuatro direcciones y deslizamiento en hielo— todo lo que el jugador tiene que poder tocar: los eventos de salida, los objetos, los NPC con gráfico y, si el mapa pertenece a un mundo del plan, **el jefe y las salidas que ese mundo promete**. Las islas de celdas sin nada dentro se cuentan, se publican y no bloquean: es deuda estética, no un atasco. |
| 3 | **Con encuentros** | Si el mapa es **zona salvaje declarada** (los catálogos `content/wild_zones.json` y `content/glazed_wild_encounters.json`), tiene su tabla `Map\<id\>_0` en `encounters.dat` con especies que existen, pesos positivos y niveles entre 1 y el techo de la expansión (175), o combate salvaje por evento (`pbWildBattle`). Si no es zona salvaje, exige una **exención declarada con su motivo**. |
| 4 | **Con música** | El BGM declarado existe en `Audio/BGM` (nombre con o sin extensión), o el mapa **hereda** la música del anterior (`@autoplay_bgm` apagado: el idioma del motor, lo usan 116 mapas, y por eso la Liga Oscura suena a lo que venía sonando), o el silencio está **declarado y citado**. |
| 5 | **Con entrada y salida** | Alguna transferencia real del juego llega al mapa (o está declarado como raíz, como el inicio de partida), y el mapa tiene al menos una salida que transfiere a otro mapa. |

### Tres decisiones que evitan medir ficción

1. **Lo que bloquea es el contenido inalcanzable, no la isla vacía.** Un mapa puede tener un rincón de
   celdas sueltas que nadie pisa —el juego base está lleno—; lo que no puede
   pasar es que una salida, un objeto o un jefe queden al otro lado de un muro. Así el veredicto no
   depende de un porcentaje arbitrario, sino de si el jugador puede terminar lo que el mapa promete.
2. **Se alcanza lo que el motor alcanza.** Un evento se considera alcanzable si se pisa su celda, si se
   activa desde una celda vecina (botón de acción y toque del jugador, que es como funcionan las puertas
   y escaleras de Fire Ash) o si es autorun/paralelo (se ejecuta solo). No se cuentan como alcanzables
   los NPC decorativos sobre tejados o muros, que en el juego base son escenografía.
3. **La medida no modela saltos de una sola dirección** (agujeros de hielo, caídas). Por eso el censo es
   una **línea base**: cualquier mapa con una salida «inalcanzable» puede estar bien en el juego si se
   llega por una caída, y el verificador no lo da por roto, sólo lo cuenta. Donde sí es concluyente es en
   el anillo A, cuyos mapas están construidos por nuestras propias herramientas.

## Alcance

| Anillo | Qué mide | Cuántos mapas |
|---|---|---|
| **A (bloqueante)** | Los mapas del plan: los 23 mundos de la métrica de fase 2, la falda y la cumbre del Monte Silver (2021–2022), la Antesala de las Grietas (2040), los cinco mapas del Nexo (2136–2140) y los 150 mapas del Dimensional Nightmare (2041–2190). | **173** |
| **B (línea base)** | El juego entero (`MapInfos.rxdata`): Fire Ash original más todo lo añadido. | **3465** |

## Resultado medido (2026-10-15)

```text
anillo A: 171/173 mapas terminados · 2 con pendiente declarado · 0 con fallo
censo:     598/3465 completos · transitable 3463 · sin huérfanas 2300 · con encuentros 674 · con música 3463 · con entrada y salida 3406
```

En el anillo A, las cinco condiciones se cumplen en los 173 mapas salvo el hallazgo siguiente, declarado
y citado. En el censo, las cifras son las de la herencia de Fire Ash: 2791 mapas sin tabla de encuentros
(interiores, en su mayoría), 1165 con alguna salida que no se alcanza desde sus puertas, 109 sin entrada
o sin salida declarada y 2 sin música (los «safari»). La lista completa de los que fallan algo está en
`content/mapa_terminado_censo.json` y no se toca desde aquí: es material para quien decida limpiar el
juego base.

## Hallazgos (los mide el verificador en cada corrida)

### MS-PLANTILLA-139 — dos emisiones del Monte Silver reciben al jugador sin salida ni jefe a la vista

**La Cinta Carmesí (2026) y La Consola de 1996 (2029)** comparten la plantilla 139, un mapa de tres islas
separadas por muros. El instalador de las emisiones
([`tools/apply_multiverse_creepypasta.mjs`](../../tools/apply_multiverse_creepypasta.mjs)) elige la isla
del ancla y, cuando los eventos no le caben, **reparte el resto por todas las celdas del mapa**:

```ruby
const region = (component.length >= count ? component : cells).filter(...)
```

Consecuencia medida: la llegada —(20,7)— cae en una isla de **60 celdas** con tres eventos de sabor; el
jefe (`PokeMod Multiverso: Jefe EL NIÑO DE LA CINTA` / `…EL JUGADOR DE 1996`) está en otra isla, y las
salidas `Volver a la gruta` (1,23) y `Volver al mundo` (2,2) en una tercera y en la primera. El jugador
puede volver por el Nexo de emergencia, pero **la emisión no se puede jugar desde su puerta**. Las islas
tampoco se tocan por ningún lado (no hay ni una celda adyacente entre ellas), así que no hay salto, caída
ni ladrillo que lo arregle: es geometría, no interpretación.

Arreglo pendiente (fuera de esta fase, es contenido): o el instalador deja de repartir eventos entre
islas (`placeSlots` debe fallar en vez de usar todo el mapa, o elegir la isla más grande), o las dos
emisiones se rehacen sobre una plantilla de una sola región. Cualquiera de las dos exige volver a pasar
`verify:multiverse` y este verificador.

### DN-SALVAJES-DECLARADOS — el sueño declara salvajes en 14 mapas y no implementa ninguno

Los documentos del Dimensional Nightmare (EP01, EP05, W7, W8 y W9) declaran Pokémon salvajes con nivel y
mapa concreto —`2047, 2115, 2145, 2147, 2150, 2154, 2163, 2167, 2168, 2171, 2180, 2181, 2185, 2186`— y
cuatro fichas lo anuncian en su papel («Combates salvajes, huesos»). Ninguno de los 150 mapas del sueño
tiene tabla en `encounters.dat` ni un solo `pbWildBattle`: **0 implementaciones**. El verificador recuenta
la lista leyendo las fichas cada vez, para que no se quede vieja.

### BGM-SAFARI — dos mapas del juego base piden una música que no está en disco

Map68 y Map1086 declaran el BGM «safari» con autoplay encendido y ese archivo no existe en `Audio/BGM`.
Son los dos únicos mapas del juego que fallan la condición de música sin tener silencio declarado.

## Deudas declaradas

- **CENSO-FIRE-ASH.** El juego base arrastra 2791 mapas sin tabla de encuentros, 1165 con una salida que
  no se alcanza desde sus puertas y 109 sin entrada o sin salida. La línea base de
  `content/mapa_terminado.json` los fija para que ninguna fase futura los empeore.
- **PARTIDA-MANUAL-MAPA.** Ningún mapa está jugado por una persona. Las cinco condiciones se pueden medir
  sin abrir el juego, pero un mapa sólo queda **Certificado** cuando alguien lo recorre: la pasada manual
  sigue pendiente en [`docs/QA_MANUAL_PLAYTEST.md`](../QA_MANUAL_PLAYTEST.md).

## Escalera de cierre

| Estado | Qué exige | Hoy (anillo A) |
|---|---|---|
| **Fallo** | Alguna de las cinco condiciones incumplida y no declarada. | 0 mapas |
| **Pendiente declarado** | Condición incumplida, declarada con su motivo y su cita; el verificador la reimprime en cada corrida. | 2 mapas (2026, 2029) |
| **Terminado** | Las cinco condiciones cumplidas contra los datos compilados. | **171 mapas** |
| **Certificado** | Además, alguien lo ha jugado y lo ha marcado en la checklist manual. | 0 mapas |

## Cómo se mantiene

1. **Mapa nuevo.** Se construye y, en el mismo commit, se mide: `node tools/qa/mapa_terminado_check.mjs
   --mapa <id>`. Si es de campo, se añade su zona a `content/wild_zones.json`; si es interior, su exención
   con motivo a `content/mapa_terminado.json`.
2. **Exención nueva.** Mínimo 20 caracteres de motivo. Si la exención afirma algo del juego (un silencio),
   la cita es obligatoria y el verificador la lee: una exención sin motivo o con una cita que no existe
   rompe la corrida.
3. **Pendiente nuevo.** Se declara con `mapas`, `condicion`, `motivo` y cita. Un pendiente no se puede
   «arreglar» borrándolo: si la condición falla y no hay pendiente, la corrida falla.
4. **Antes de dar el juego por medido.** `npm run verify:mapa_terminado` (anillo A) y
   `node tools/qa/mapa_terminado_check.mjs --censo` (los 3465, ~13 s).

## Qué no prueba esta medida

- No prueba que el mapa sea **bonito** ni que se lea bien: eso es la pasada manual y las puertas de
  calidad de [`PLAN_RECONSTRUCCION_MONTAÑA_CUEVAS_HIELO.md`](../PLAN_RECONSTRUCCION_MONTAÑA_CUEVAS_HIELO.md)
  y [`ESTRATEGIA_PULIDO_ATLAS.md`](../ESTRATEGIA_PULIDO_ATLAS.md) (4/5 en las diez categorías para un
  Tier 1, con prueba dentro de `Game.exe`).
- No prueba que un mapa se pueda **completar** (que el jefe sea derrotable, que la llave exista): eso lo
  cubren `dn:audit`, `dn:events:verify`, `dn:battles:verify` y los verificadores de cada familia.
- No modela caídas ni saltos de una sola dirección, y lo dice: el censo es línea base, no veredicto.
- No sustituye a `npm test`: lo complementa con la pregunta «¿se puede caminar por este mapa y salir de
  él?».
