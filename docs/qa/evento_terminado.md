# Qué significa que un evento esté terminado

Fase 4/46199 (tarea 38). Define **cuándo un evento de PokeMod se puede dar por terminado** —con diálogo
revisado, con flags de una sola escritura, con el texto maquetado para la caja del motor y con salida
garantizada— y lo mide contra los datos compilados, evento por evento y página por página.

- **Registro y alcance**: [`content/evento_terminado.json`](../../content/evento_terminado.json).
- **Verificador**: `npm run verify:evento_terminado` (dentro de `npm test`) y `--censo` para los 3465 mapas.
- **Censo del juego entero**: [`content/evento_terminado_censo.json`](../../content/evento_terminado_censo.json).

Es la capa de abajo de las otras dos: un mundo no puede estar terminado si sus mapas no lo están
([`mapa_terminado.md`](mapa_terminado.md), fase 3), y un mapa no lo está si sus eventos se leen como
notas de diseño, mueven flags compartidas o dejan al jugador en un bucle.

## Las cuatro condiciones

| # | Condición | Definición operativa (lo que comprueba el verificador) |
|---|---|---|
| 1 | **Diálogo revisado** | Todo lo que el jugador lee —los bloques 101/401 y los mensajes que dispara un script (`pbMessage`)— está libre de notas de implementación y de fichas de diseño, sin marcas de relleno («pendiente de registrar», `TODO`) y sin metagame: la regla 13 de [`ESTRATEGIA_PULIDO_ATLAS.md`](../ESTRATEGIA_PULIDO_ATLAS.md) pide que un diálogo importante no mencione niveles, estadísticas ni Pokédex. Y está bien formado: sin texto vacío, sin espacios dobles, sin espacio antes de puntuación y sin códigos de escape sueltos. |
| 2 | **Flag de una sola escritura** | Cada switch de progreso que escribe el evento se enciende en **un solo sitio del juego** (contando los 3465 mapas), **no se apaga en ninguno** y tiene nombre propio en `System.rxdata`. Un switch sin nombre no se puede leer ni depurar: en el editor aparece como «—». |
| 3 | **Texto en dos líneas de caja** | El texto está maquetado para la caja que el motor crea de verdad: ninguna línea que el autor cierra con `\n` supera las **53 columnas** de ancho, y nada depende de que el motor junte las continuaciones 401, porque las une **con un espacio**. El autor no pide una caja más alta: el código `\l[N]` no aparece ni una vez en el plan. |
| 4 | **Salida garantizada** | Toda página termina con la orden de fin (código 0) y ninguna retiene al jugador: una página autorun o paralela tiene que liberarse con un self switch, con borrar evento, con una transferencia o con una flag que su propia condición mire. Si no, el motor la vuelve a arrancar en cuanto termina y el jugador no recupera el control. |

### Los hechos del motor, comprobados en cada corrida

La condición 3 no se apoya en la memoria de nadie: el verificador **lee los `Scripts.rxdata` del juego**
en cada corrida y falla si alguno de estos tres hechos desaparece.

| Hecho | Dónde | Qué significa |
|---|---|---|
| `pbBottomLeftLines(msgwindow,2)` | `Messages#pbCreateMessageWindow` | La caja de mensajes se crea de **2 líneas**. |
| `linecount=(Graphics.height>400) ? 3 : 2` | `Messages#pbMessageDisplay` | Con la pantalla del juego (`Settings::SCREEN_HEIGHT = 384`) la caja muestra 2 líneas. |
| `message += " " …` | `Interpreter_Commands#command_101` | Las continuaciones 401 se unen **con un espacio**, no con un salto de línea. |

Y tres hechos más que el verificador usa y que están escritos en el propio repo: el ancho de referencia
son **53 columnas** (`wrapMessage(text, cols = 53)` y `reflowMessage(text, cols = 53, linesPerBox = 2)` de
[`web/js/rmxp.js`](../../web/js/rmxp.js), con las opciones «53,2», «53,4» y «40,2» y el botón «Ajustar a
la caja» del editor), y la caja **no pierde texto**: `Window_AdvancedTextPokemon#resizeToFit` ajusta el
texto a la ventana con salto automático por píxeles (`getFormattedTextForDims`) y el resto se lee
avanzando (`@scrollstate`, `@scrollY`, `@linesdrawn`). Lo que se pierde cuando una línea pasa de 53
columnas no es el texto: es **la maquetación del autor**, que el motor parte donde quiere.

## Las cinco decisiones que evitan medir ficción

1. **El texto se ensambla como lo ensambla el motor.** Un bloque no es «el 101» ni «cada 401»: es el
   parámetro del 101 más sus continuaciones 401 unidas con un espacio, exactamente como en
   `Interpreter_Commands#command_101`. Medir cada 401 por separado daba 2240 bloques «largos» de 2612
   (85,8 %): ese número era un defecto de la medida, no del juego.
2. **Una nota de diseño se cuenta una vez.** Si un texto ya es una fuga (lleva el id del mapa, la celda,
   el switch o la fase de la ficha), no se le cuentan además el espacio antes de puntuación ni el
   metagame: son consecuencia de la nota, no defectos distintos. Si no, el mismo bloque aparecía tres
   veces en la lista y el diagnóstico se volvía ilegible.
3. **La etiqueta del Registro Dimensional no es una fuga.** El sueño tiene un registro del juego (formato
   `#A0xx`, [`00_MASTER_GDD.md`](../DIMENSIONAL_NIGHTMARE/00_MASTER_GDD.md) §6) y sus páginas dicen
   `[A01] Ya figura en el Registro Dimensional.` a propósito. Lo que el verificador marca es el **volcado
   de la ficha** (código + título en mayúsculas, la forma del índice de
   [`01_EP01_WHITE_HAND.md`](../DIMENSIONAL_NIGHTMARE/01_EP01_WHITE_HAND.md)): `[A05] EL ÁRBOL QUE
   SUSURRA Map2061 — (22,10). Fase >=4. …`. La diferencia entre las dos formas es la diferencia entre el
   juego y el taller.
4. **Las declaraciones van por nombre.** Un evento se identifica como `mapa:nombre`, y el plan tiene
   **10 nombres repetidos dentro del mismo mapa** —tres «PokeMod Multiverso: Objeto» en 2021, tres en
   2030, dos en 2022 y los cinco «PokeMod Barco: Poblador — …»—, así que el plan son **1567 objetos de
   evento y 1557 nombres distintos**. No cambia la medida (el verificador recorre objeto por objeto),
   pero sí la lectura del registro: una declaración por nombre cubre a todos los eventos que se llamen
   así, y son precisamente los que no tienen nombre propio.
5. **Una exención necesita motivo y una deuda necesita cita.** Una exención exige ≥ 20 caracteres de
   motivo (p. ej. el panel de estado de Rotom en la antesala, que enseña sellos, resonancia y nivel
   porque **es** la pantalla de estado del jugador). Un pendiente y una deuda exigen una cita que el
   verificador comprueba leyendo el archivo citado: si la frase no está, la corrida falla.

## Alcance

| Anillo | Qué mide | Cuántos |
|---|---|---|
| **A (bloqueante)** | Todos los eventos de los 173 mapas del plan (los 23 mundos de la métrica, el barco, la Liga Oscura, el Monte Silver, la Antesala de las Grietas, el Nexo y los 150 mapas del Dimensional Nightmare). | **1567 eventos · 3179 páginas** |
| **B (línea base)** | El juego entero (`MapInfos.rxdata`): Fire Ash original más todo lo añadido. | **36 147 eventos · 55 499 páginas** |

## Resultado medido (2026-10-15)

```text
anillo A: 554/1567 eventos terminados · 966 con deuda declarada · 47 con pendiente declarado · 0 con fallo abierto
caja:     2612 bloques · 2247 (86,0 %) con alguna línea más ancha que la caja · peor línea: 492 columnas
          · 1434 juntas 401 sin salto explícito en 1192 bloques · 0 bloques piden una caja más alta (\l[N])
flags:    50 switches (14 con más de un escritor, 0 se apagan, 17 sin nombre en System.rxdata) · 21 variables
salida:   3179 páginas · 0 sin orden de fin · 22 autorun y 7 paralelas sin liberación (29 eventos)
diálogo:  147 fugas de diseño · 18 marcas de relleno · 0 metagame sin exención · 0 fallos de formato
censo:    36 147 eventos · 13 822 terminados · 57 591 bloques (32 753 con línea ancha, 56,9 %) · 1787 switches
```

El reparto del anillo A lo mide el verificador evento por evento y lo resume así: **554 eventos no tienen
nada que declarar** (ni una línea ancha, ni una junta, ni una fuga, ni un switch sin nombre, ni una página
que no se suelte); **966 arrastran deuda declarada** y **47 tienen un pendiente con su cita**. Ninguno
queda con un fallo abierto.

La condición 3 es la que más duele y la que más claro deja qué falta: de los 2612 bloques de caja,
**sólo 365 (14,0 %) respetan las 53 columnas**. De los 2247 que no, 59 se pasan por poco (hasta 60
columnas), 709 llegan a 100 y **1479 pasan de 100** —el peor, 492 columnas, que es una ficha entera
metida en un diálogo. El motor no rompe nada: parte la línea por píxeles y el jugador lee el texto
igual; lo que se rompe es la maquetación que el autor escribió. La herencia de Fire Ash tampoco respeta
la medida (32 753 de 57 591 bloques, el 56,9 %), así que el estándar de 53 columnas es **del repo**, no
del juego original: es el que usan el editor y la revisión.

## Hallazgos (los mide el verificador en cada corrida)

### EVENTO-AUTORUN-SIN-SALIDA — 29 eventos arrancan solos y no se sueltan

El instalador del sueño construyó los eventos del índice con el trigger de la ficha (autorun al entrar)
y el texto de la nota de implementación como diálogo. Como la página no tiene condición ni liberación,
el motor la vuelve a arrancar al terminar: **el jugador queda en un bucle con la nota del diseñador en
pantalla**. Se ve en el primer mapa del sueño (`2041:EV_CAT_Entrada`) y en otros 28 sitios: 22 páginas
autorun y 7 paralelas, todas sin liberación. Son los únicos 29 eventos del plan que fallan la condición
4, y los únicos «graves» de la corrida (una página autorun **sin condición** no espera a nadie: se
dispara al pisar el mapa).

### EVENTO-TEXTO-DE-DISENO — 147 eventos leen la ficha de diseño

Los textos del sueño se generaron desde la ficha de cada evento y de cada anomalía, así que el jugador
lee el id del mapa, la celda, el switch que enciende el evento, el tono, la pista de música y el número
de variable: «`[EV_CAT_Entrada] texto de la Grieta, sw883 = ON parcial, tone fase 1…`». El reparto es
115 textos con id de mapa, 15 con variable, 12 con switch, 3 con tono o música y 2 con coordenadas. El
origen está en el instalador (`texts([…])`, que volcó la ficha como diálogo) y el hallazgo
EVENTO-AUTORUN-SIN-SALIDA es su otra cara: el mismo instalador es el que dejó las páginas sin soltar.

### EVENTO-RELLENO-PENDIENTE — 18 eventos avisan al jugador de que el contenido no está

Cuando el instalador no encuentra la medalla, el objeto o el jefe que la ficha promete, deja un
`rescue` con un mensaje al jugador: «`(cartuchera del testigo pendiente de registrar)`», «`(medalla
DN_MEDAL_WHT pendiente de registrar)`». No son trainers ausentes —`dn:battles:verify` confirma que los
jefes existen—: es el resto de una instalación a medias, y el jugador lo lee. Son 18 eventos en 15
mapas.

### EVENTO-401-SIN-SALTO — 1434 juntas que el motor rellena con un espacio

El patrón del repo es «101 vacío + un 401 por línea de autor». Cuando dos 401 van seguidos y el primero
no cierra con `\n`, el motor los une con un espacio que el autor no escribió
(`Interpreter_Commands#command_101`), así que **lo que ve el jugador no es la maquetación que escribió
el autor**. Es masivo (1192 bloques del plan, 44 459 en el juego entero) y barato de arreglar: cerrar
cada línea con `\n` o dejar el párrafo como una sola línea.

### EVENTO-FLAG-DOBLE — 14 switches del plan se encienden en más de un sitio

`957` (el Nexo) se enciende en 7 sitios; los sellos y las fases de jefe, en 2 o 3 cada uno. En un juego
con 744 switches multi-escritor (`696` de ellos se apagan además en algún sitio), la condición 2 exige
que **el progreso se pueda leer en un solo sitio**: quién enciende qué y dónde. Los 12 del plan son una
decisión de diseño pendiente, no un accidente: hoy están declarados.

## Deudas declaradas

Las deudas no se arreglan en esta fase: se declaran con su cita y su conteo, y el verificador las
**recuenta en cada corrida** (si el número cambia, la corrida falla: nadie puede «arreglar» una deuda
borrándola del registro).

| Deuda | Condición | Alcance medido | Qué falta |
|---|---|---|---|
| **EVENTO-CAJA-ANCHA** | texto en dos líneas de caja | 2247 bloques en 995 eventos y 173 mapas | Reescribir el diálogo para 53 columnas (o subir el estándar, que es una decisión de diseño, no de linter). |
| **EVENTO-JUNTA-401** | texto en dos líneas de caja | 1434 juntas en 1192 bloques | Cerrar cada línea de autor con `\n`. |
| **EVENTO-TEXTO-DE-DISENO** | diálogo revisado | 147 textos en 147 eventos | Sustituir la ficha volcada por diálogo escrito. |
| **EVENTO-FLAG-DOBLE** | flag de una sola escritura | 20 sitios en 18 eventos | Decidir el dueño de cada switch (o documentar por qué se enciende en varios). |
| **EVENTO-FLAG-SIN-NOMBRE** | flag de una sola escritura | 44 usos en 25 eventos (17 switches) | Ponerle nombre a los switches 950–957 y 963 en `System.rxdata`; 940–947 ya tienen nombres del bloque Multiverso. |

## Deudas del proyecto (no las mide este verificador, se publican aquí)

- **CENSO-FIRE-ASH.** El juego entero mide 36 147 eventos: 13 822 terminados y 21 312 con un fallo
  abierto, 1260 páginas autorun sin liberación y 1787 switches de los que 744 tienen más de un escritor
  y 696 se apagan. La línea base de `content/evento_terminado.json` fija esas cifras (más los eventos
  sin fallo de cada condición) para que ninguna fase futura las empeore.
- **PARTIDA-MANUAL-EVENTO.** Ningún evento del plan está jugado por una persona (0/23 partidas
  manuales). Este verificador mide lo que se puede medir sin abrir el juego —lo que el jugador va a leer
  y lo que el motor va a hacer—, pero **no sustituye la pasada manual**: ritmo, clipping y sensación de
  juego sólo se validan jugando ([`docs/QA_MANUAL_PLAYTEST.md`](../QA_MANUAL_PLAYTEST.md)).
- **DN-MAPS-VERIFY.** `npm run dn:maps:verify` sigue bloqueado (`ENOENT
  content/dimensional_nightmare_tiles_2x.json`) y `verify:rom:nativo` arrastra 11 fallos preexistentes:
  ninguna de las dos cosas la toca esta fase.

## Escalera de cierre

| Estado | Qué exige | Hoy (anillo A) |
|---|---|---|
| **Fallo** | Alguna de las cuatro condiciones incumplida y no declarada. | 0 eventos |
| **Con deuda declarada** | El fallo está declarado por barrido, con cita y conteo, y el verificador lo recuenta. | 966 eventos |
| **Pendiente declarado** | Fallo de un evento concreto, declarado con su motivo y su cita; el verificador lo reimprime en cada corrida. | 47 eventos |
| **Terminado** | Las cuatro condiciones cumplidas contra los datos compilados. | **554 eventos** |
| **Jugado** | Además, alguien lo ha recorrido en el juego y lo ha marcado en la checklist manual. | 0 eventos |

## Cómo se mantiene

1. **Evento nuevo.** Se construye y, en el mismo commit, se mide: `node
   tools/qa/evento_terminado_check.mjs --evento <mapa>:<nombre>`. Si escribe un switch, el switch tiene
   nombre en `System.rxdata` y un solo escritor.
2. **Exención nueva.** Mínimo 20 caracteres de motivo, y sólo para textos que se muestran así a
   propósito (una pantalla de estado, una etiqueta del propio juego). Una exención no puede tapar una
   nota de diseño.
3. **Deuda o pendiente nuevos.** Se declaran con `tipos`, alcance, motivo y cita. El conteo (`medido`)
   es obligatorio en las deudas: el verificador lo compara con lo que mide. Un pendiente no se puede
   «arreglar» borrándolo: si la condición falla y no hay declaración, la corrida falla.
4. **Antes de dar el juego por medido.** `npm run verify:evento_terminado` (anillo A) y
   `node tools/qa/evento_terminado_check.mjs --censo` (los 3465 mapas, ~3 s).

## Qué no prueba esta medida

- No prueba que el diálogo sea **bueno**: prueba que lo que el jugador lee es texto del juego y no una
  ficha de taller. La calidad literaria es de la revisión manual y de las puertas de calidad de
  [`PLAN_RECONSTRUCCION_MONTAÑA_CUEVAS_HIELO.md`](../PLAN_RECONSTRUCCION_MONTAÑA_CUEVAS_HIELO.md) y
  [`ESTRATEGIA_PULIDO_ATLAS.md`](../ESTRATEGIA_PULIDO_ATLAS.md) (4/5 en las diez categorías para un
  Tier 1, con prueba dentro de `Game.exe`).
- No prueba que un evento **se pueda completar** (que el jefe sea derrotable, que la llave exista): eso
  lo cubren `dn:audit`, `dn:events:verify`, `dn:battles:verify` y los verificadores de cada familia.
- No mide el **orden** de las flags ni el estado real de una partida: un switch con un solo escritor
  puede seguir apagándose por el motor, y una página con liberación puede liberarse en el sitio
  equivocado. Mide lo que está escrito, que es lo que se puede revisar antes de jugar.
- No sustituye a `npm test`: lo complementa con la pregunta «¿esto es lo que lee el jugador, y puede
  volver a moverse después?».
