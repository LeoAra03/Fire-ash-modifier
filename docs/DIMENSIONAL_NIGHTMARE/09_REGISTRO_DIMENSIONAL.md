# REGISTRO DIMENSIONAL — Entradas #A001–#A019

> Fichas normalizadas de todas las entidades del Dimensional Nightmare.
> **Regla**: una entidad "no capturable" **jamás** entra en la caja ni en el equipo; el Rotom
> responde `«NO ES UN POKÉMON. ES UN TESTIMONIO.»` a cualquier intento.
> Las "capturables condicionales" se registran como su especie más cercana con `@nickname` y
> `@form` propios; nunca son obligatorias para el 100 %.

Formato de ficha:
```
#A0## — NOMBRE
Universo · Clasificación · Tipo de batalla: ??? (interno)
Capturable: NO | CONDICIONAL (condición)
Aparece: MapXXXX (x,y) — fase ≥ N
Descripción · Riesgo
```

---

## EP01 — White Hand / Buried Alive

```
#A001 — EL QUE RESPIRA
ANOMALÍA-POZO · tipo ??? (interno) · no capturable
Aparece: Map2049 (10,36) — fase ≥ 6, tras 20 s sin moverse
Descripción: El pozo sube y baja. No hay criatura dentro: hay una respiración.
             El Rotom la registra como "pozo vivo" y recomienda no volver.
Riesgo: bajo (no hay combate; nunca persigue).
```

```
#A002 — LA MANO BLANCA
ANOMALÍA-ALTAR · tipo ??? (interno) · no capturable
Aparece: Map2056 (16,12) — jefe, 2.ª fase
Descripción: Una mano de mármol sostiene la sala desde debajo del altar.
             No se puede golpear: solo se puede soltar lo que la sostiene.
Riesgo: medio (jefe con reintento libre; no hay penalización).
```

```
#A003 — LA CAMPANERA
ANOMALÍA-TESTIGO · tipo ??? (interno) · no capturable
Aparece: Map2052 (12,10) — fase 7
Descripción: Mujer que escucha la campana rota. Es la única que no envejece
             ni desaparece en las fases altas. Está en el pentagrama en fase 7.
Riesgo: nulo (narrativa pura).
```

---

## EP02 — Lost Silver

```
#A004 — EL SIN NOMBRE
ANOMALÍA-ENTRENADOR · tipo ??? (interno) · CAPTURABLE CONDICIONAL
Condición: ganar la fase final sin usar objetos de curación en esa batalla
Aparece: Map2072 (10,20) — jefe
Descripción: Entrenador que perdió su partida y se quedó dentro. No tiene nombre
             porque nadie lo guardó. Solo asiente.
Riesgo: medio (combate con reintento libre).
```

```
#A005 — EL QUE ESPERA
ANOMALÍA-ANDÉN · tipo ??? (interno) · no capturable
Aparece: Map2069 (5,12) — fase ≥ 3
Descripción: Alguien espera un tren que no llega desde antes de que el pueblo
             existiera. Si se le habla, no recuerda qué esperaba.
Riesgo: nulo.
```

```
#A006 — EL REFLEJO
ANOMALÍA-ESPEJO · tipo ??? (interno) · no capturable
Aparece: Map2063 (12,9) — fase ≥ 4, tras mirar el agua 3 veces
Descripción: El reflejo del agua muestra un pueblo intacto con gente que saluda.
             El reflejo saluda al jugador. El jugador no está en el reflejo.
Riesgo: bajo (nunca sale del agua).
```

---

## EP03 — Snow on Mt. Silver

```
#A007 — EL CAMINANTE
ANOMALÍA-VIAJERO · tipo ??? (interno) · CAPTURABLE CONDICIONAL
Condición: completar las 4 fogatas sin que el grupo llegue a 0 en la fase B
Aparece: Map2087 (15,15) — jefe
Descripción: Camina hacia la cumbre desde antes de que existiera la cumbre.
             Nunca se sienta, nunca se detiene, nunca habla. Solo da pasos.
Riesgo: medio (combate + fase de exploración).
```

```
#A008 — LA BESTIA DE CRISTAL
ANOMALÍA-HIELO · tipo ??? (interno) · no capturable
Aparece: Map2085 (15,14) — miniboss opcional
Descripción: Forma de cristal que imita a un Pokémon de hielo. Si se la mira
             demasiado, imita al jugador.
Riesgo: bajo (opcional, sin bloqueo).
```

```
#A009 — LOS TRES TESTIGOS
ANOMALÍA-CORO · tipo ??? (interno) · no capturable
Aparece: Map2086 (15,16) — fase ≥ 5, tras 3 conversaciones
Descripción: Tres figuras que repiten la misma frase en tres idiomas distintos.
             En fase 7 la dicen al unísono y luego ninguna.
Riesgo: nulo.
```

---

## EP04 — Hypno's Lullaby

```
#A010 — LA NANA
ANOMALÍA-CANTO · tipo ??? (interno) · no capturable
Aparece: Map2103 (20,20) — jefe
Descripción: Una canción con forma de mujer. Duerme a quien la escucha para
             que no se vaya. No es malvada: no sabe hacer otra cosa.
Riesgo: medio (combate con mecánica de sueño; sin daño permanente).
```

```
#A011 — EL QUE DUERME ABAJO
ANOMALÍA-AGUA · tipo ??? (interno) · no capturable
Aparece: Map2098 (16,16) — fase ≥ 5, tras mirar el estanque 3 veces
Descripción: Una silueta enorme bajo los nenúfares. Duerme desde antes del bosque.
             Si se la despierta (no se puede), el bosque dejaría de cantar.
Riesgo: bajo.
```

```
#A012 — LA NIÑA DEL OSO
ANOMALÍA-ECO · tipo ??? (interno) · CAPTURABLE CONDICIONAL
Condición: hablarle en fase 7 sin ningún silenciador activo
Aparece: Map2088 (10,8) y Map2103 (14,22)
Descripción: Es la misma niña en dos sitios a la vez. Su oso de trapo está en el EP02
             y su voz en el EP04. Se queda donde la dejen.
Riesgo: nulo.
```

---

## EP05 — Pokémon Black

```
#A013 — EL JUGADOR 000
ANOMALÍA-ESPEJO · tipo ??? (interno) · no capturable
Aparece: Map2119 (15,15) — jefe
Descripción: Un entrenador idéntico al jugador, en negro. Su equipo es el del jugador.
             No tiene nombre propio: usa el del jugador sin poder pronunciarlo.
Riesgo: medio (combate espejo; el equipo del jugador nunca se modifica de verdad).
```

```
#A014 — EL ÚLTIMO NIÑO
ANOMALÍA-AUSENCIA · tipo ??? (interno) · CAPTURABLE CONDICIONAL
Condición: hablarle 5 veces en 5 fases distintas
Aparece: Map2109 (15,12)
Descripción: El único habitante sólido. Cada visita tiene una parte menos.
             No le duele. Pregunta si el jugador también se está quedando sin partes.
Riesgo: nulo.
```

```
#A015 — EL ESPEJO
ANOMALÍA-DOBLE · tipo ??? (interno) · no capturable
Aparece: Map2114 (15,12) — miniboss
Descripción: Superficie que muestra al jugador haciendo lo que NO hizo.
             Si se le gana, muestra el pueblo lleno de gente por 3 segundos.
Riesgo: bajo.
```

---

## EP06 — King Unown

```
#A016 — EL UNOWN QUE DELETREA
ANOMALÍA-LETRA · tipo ??? (interno) · CAPTURABLE CONDICIONAL
Condición: vencer a KINGGUS sin usar REVIVE en ninguna fase
Aparece: Map2135 (16,16) — tras el sello
Descripción: Un Unown que no representa una letra: representa la palabra completa.
             Se queda deletreando el nombre del jugador, en bucle, sin cansarse.
Riesgo: nulo.
```

```
#A017 — KINGGUS
ANOMALÍA-REY · tipo ??? (interno) · no capturable
Aparece: Map2135 (16,10) — jefe final, 2 formas
Descripción: El Rey Unown. No lee libros: lee gente. No quiere tu vida:
             quiere tu nombre. Al final del combate se queda sin letras.
Riesgo: alto (jefe final; reintento libre, sin pérdida de progreso).
```

```
#A018 — EL OJO
ANOMALÍA-VIGILANTE · tipo ??? (interno) · no capturable
Aparece: Map2125 (15,8) — tras mirarlo 7 veces
Descripción: Ojo tallado en la pared que sigue al jugador. Si el jugador abre el menú,
             el ojo "abre" y "cierra" a la vez (parpadeo espejo).
Riesgo: nulo.
```

```
#A019 — EL CORO
ANOMALÍA-LETRAS · tipo ??? (interno) · no capturable
Aparece: Map2124 (15,12) — fase ≥ 5
Descripción: Cinco Unown que no hablan: se colocan en posiciones que deletrean
             palabras. En fase 7 deletrean "SAL" y luego "YA".
Riesgo: nulo.
```

---

## Tabla resumen

| # | Entidad | EP | Capturable | Mapa |
|---|---|---|---|---|
| A001 | El que Respira | 01 | NO | 2049 |
| A002 | La Mano Blanca | 01 | NO | 2056 |
| A003 | La Campanera | 01 | NO | 2052 |
| A004 | El Sin Nombre | 02 | CONDICIONAL | 2072 |
| A005 | El que Espera | 02 | NO | 2069 |
| A006 | El Reflejo | 02 | NO | 2063 |
| A007 | El Caminante | 03 | CONDICIONAL | 2087 |
| A008 | La Bestia de Cristal | 03 | NO | 2085 |
| A009 | Los Tres Testigos | 03 | NO | 2086 |
| A010 | La Nana | 04 | NO | 2103 |
| A011 | El que Duerme Abajo | 04 | NO | 2098 |
| A012 | La Niña del Oso | 04 | CONDICIONAL | 2088/2103 |
| A013 | El Jugador 000 | 05 | NO | 2119 |
| A014 | El Último Niño | 05 | CONDICIONAL | 2109 |
| A015 | El Espejo | 05 | NO | 2114 |
| A016 | El Unown que Deletrea | 06 | CONDICIONAL | 2135 |
| A017 | KINGGUS | 06 | NO | 2135 |
| A018 | El Ojo | 06 | NO | 2125 |
| A019 | El Coro | 06 | NO | 2124 |

**Totales**: 19 entidades · 5 capturables condicionales · 14 no capturables · 0 permanentes.

---

## Segundo anillo — W7 · W8 · W9

| # | Entidad | Mundo | Capturable | Mapa |
|---|---|---|---|---|
| A101 | El que Espera en la Puerta | W7 | NO | 2143 |
| A102 | Sombra Sin Dueño | W7 | CONDICIONAL (Rotom ≥3) | 2145 |
| A103 | El Nombre Raspado | W7 | NO | 2149 |
| A104 | El Amo (memoria) | W7 | NO | 2158 |
| A201 | El que Respira Debajo | W8 | NO | 2174 |
| A202 | El Sellado Número 4 | W8 | CONDICIONAL (Rotom ≥4) | 2166 |
| A203 | La Mano que Sale de la Tierra | W8 | NO | 2171 |
| A204 | El Aire con Forma | W8 | NO | 2165 |
| A301 | El Coro del Campanario | W9 | NO | 2190 |
| A302 | El Autor | W9 | CONDICIONAL (partitura) | 2189 |
| A303 | La Voz que Repite | W9 | NO | 2185 |
| A304 | La Silueta que Marca el Compás | W9 | NO | 2190 |

**Totales del ciclo (9 mundos)**: 31 entidades · 7 capturables condicionales · 24 no capturables · 0 permanentes.
