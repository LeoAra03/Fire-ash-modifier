# Atlas Mil: tres aventuras en un solo continente

Atlas Mil ya está instalado: **1.000 mapas repartidos en 40 sectores de 21
mapas**, cada uno con su facción (Vigías Ámbar, Navegantes Celestes, Custodios
Carmesí…). Hoy ese continente es un mundo para explorar, pero le falta
**estructura de campaña**: todavía no hay tres historias que se puedan jugar,
ni una de ellas que se pueda jugar sola de principio a fin.

Este documento es el plano de esa transformación: tres aventuras conviviendo en
los mismos 40 sectores, con la campaña **Team Rocket** como hilo jugable en
solitario.

## Reparto del continente

| Aventura | Sectores | Mapas | Inspiración | Tono |
|---|---:|---:|---|---|
| **A. El Mundo que Sangra** | 1–13 | 273 | Glazed | Historia coral, facciones, decisiones con consecuencias |
| **B. La Ruta de los Sellos** | 14–27 | 294 | Light Platinum | Aventura clásica: prueba tras prueba, rival y Liga propia |
| **C. Operación Ceniza** | 28–40 | 273 | Pokémon Team Rocket | Campaña criminal, misiones, rangos y traición |

Las tres comparten el mismo continente y el mismo punto de entrada: **el Muelle
de Atlas Mil (Map2191)**, al que se llega con el Capitán Ferrán desde el puerto
de Ciudad Carmín (Map108). Desde el muelle salen tres caminos y los tres se
pueden recorrer en cualquier orden —o sólo uno.

---

## A. El Mundo que Sangra (sectores 1–13) — estilo Glazed

**Premisa.** Atlas Mil no es un paraíso: es un continente que se está
desgarrando por dentro. Cada facción vive el desastre a su manera y todas
quieren que Ash elija bando.

**Estructura.** Cada sector es una facción con un consejo, una necesidad y un
secreto:

1. Meridiano Ámbar pide escoltar convoyes; el secreto es que venden el ámbar que
   alimenta las grietas.
2. Cuenca Celeste navega con mapas que ya no cuadran.
3. Frontera Carmesí encierra algo detrás de su muralla.
4. …
5. Arco Fósil guarda el registro de la primera grieta.

En cada facción el jugador vive **tres actos**: audiencia (texto con
ramificaciones), encargo (recorrido real por los 21 mapas del sector) y
consecuencia (el consejo cambia de actitud, se abre o se cierra una ruta, y el
NPC que te recibió lo recordará para siempre).

**Progresión.** Una variable de facción por sector. Al cerrar las 13, la grieta
del continente se estabiliza y se abre el consejo final. Las decisiones tomadas
(no los combates) determinan **qué facciones acuden** al final: el desenlace
cambia según a quién ayudaste.

---

## B. La Ruta de los Sellos (sectores 14–27) — estilo Light Platinum

**Premisa.** La ruta clásica, bien hecha: catorce pruebas, un rival que aparece
cuando menos quieres y una Liga al final.

**Estructura.** Un sello por sector, con el patrón que funciona:

- Un **vigía** en la entrada que explica la prueba en dos líneas.
- Un **recorrido** con el obstáculo propio del sector (Mar de Nubes = puentes
  móviles; Bosque de Hierro = herrería y puzzles de peso; Páramo Sonoro =
  ecos que abren puertas…).
- Un **líder** con equipo temático y una frase que se recuerda.
- Un **descanso**: Centro Pokémon, Tienda y un NPC que te cuenta el chisme del
  sector (el chisme es la pista del siguiente).

**Rival.** Un único rival con memoria real: aparece en 6 sectores, se acuerda
del resultado anterior y su equipo cambia según cómo le fue. Al final, la Liga
de Atlas (Santuario de Polen, sector 27).

**Progresión.** 14 sellos en una variable; la Liga se abre con los 14.

---

## C. Operación Ceniza (sectores 28–40) — estilo Pokémon Team Rocket

**Premisa.** Ash no llega a Atlas Mil como héroe: llega como recluta. El
Cañón Espejo (sector 28) es la puerta de reclutamiento del Team Rocket en el
continente, y el jugador decide hasta dónde mancharse las manos.

**Es la aventura que se puede jugar sola.** No depende de A ni de B: se entra,
se asciende y se termina sin pisar las otras dos. Y al revés también: se puede
ignorar por completo.

### Estructura de la campaña

| Rango | Requisito | Qué se desbloquea |
|---|---|---|
| Recluta | Hablar con El Soplón en el Cañón Espejo | Uniforme, base compartida, 3 encargos menores |
| Soldado | 3 encargos + 1 operación | Patrullas aliadas, acceso a los almacenes |
| Sargento | 5 operaciones + lealtad ≥ 60 | Puedes elegir equipo para una misión |
| Ejecutivo | 9 operaciones + lealtad ≥ 80 | Mando propio, decisión final de la campaña |
| — | 13 operaciones | Desenlace en el Umbral Mil (sector 40) |

### Mecánicas propias

- **Lealtad** (variable): sube si cumples sin dañar a inocentes. Determina que
  tus propios hombres te cubran o te dejen tirado en el clímax.
- **Alarma** (variable): fallar un encargo la sube; con alarma alta hay
  patrullas extra, rutas cerradas y recompensas menores.
- **Sigilo**: patrullas con rutas de movimiento reales y cono de visión; si te
  ven, combate doble o huida con alarma.
- **Contrabando**: entregas con límite de tiempo (pasos) entre sectores.
- **Dilema ético por operación**: siempre hay dos formas (soborno / asalto,
  sabotaje / combate, delatar / encubrir). Elige y el continente lo recordará.
- **Base Rocket mejorable**: tres mejoras (enfermería, taller, sala de mapas)
  que cambian la dificultad del tramo final.

### Cruce con las otras dos aventuras (opcional, nunca obligatorio)

- Si liberaste facciones en A, tus operaciones en C encuentran aliados… o
  sabotajes.
- Con sellos de B, los líderes Rocket te reconocen y te ofrecen misiones
  distintas.
- Ninguna recompensa de A o B es necesaria para terminar C.

---

## Presupuesto de flags

El arco actual vive en el contador `264` y los sellos `868‑875`. Para las tres
aventuras se reserva un bloque nuevo, **verificado por el instalador antes de
escribir** (si el rango no está libre, el instalador se detiene y lo dice):

| Aventura | Variables | Switches |
|---|---|---|
| A. El Mundo que Sangra | 265 (progreso), 266 (facción elegida) | 940–952 (13 consejos) |
| B. La Ruta de los Sellos | 267 (sellos), 268 (rival) | 953–966 (14 sellos) |
| C. Operación Ceniza | 269 (rango), 270 (lealtad), 271 (alarma) | 967–979 (13 operaciones) |

El análisis del juego completo da 806 switches en uso (máximo 939) y 216
variables (máximo 263), así que el bloque 940+ está libre; aun así se comprueba
en cada instalación.

---

## Cómo se enriquece todo el continente con el ROM invitado

Lo que aporta cada ROM, y cómo se transforma en contenido original (ver
`docs/ROM_INVITADO_EXTRACCION.md`):

| Del ROM | En Atlas Mil |
|---|---|
| Flags con nombre | Nuestro mapa de progresión por aventura |
| NPCs y sus sprites | Arquetipos reescritos con memoria de lo que hiciste |
| Cinemáticas (eventos comunes) | Nuestras escenas en el DSL de cinemáticas |
| Batallas de entrenadores | Curva de niveles y roles, con especies de Fire Ash |
| Música por situación | Temas originales por sector y por tipo de escena |
| Estructura de misiones | Encargos, dilemas y consecuencias por sector |

## Orden de trabajo propuesto

1. **Corte vertical**: 3 sectores por aventura (63 mapas) con cinemática
   completa, jefe y consecuencias → se puede jugar y evaluar.
2. **Ampliar A y B** a sus 13 y 14 sectores.
3. **Cerrar C** completo (13 operaciones + clímax) como campaña autónoma.
4. **Capa de cinemáticas** sobre los sectores ya instalados (1.000 mapas).
5. **Música y pulido**: temas por sector y revisión de diálogos.
