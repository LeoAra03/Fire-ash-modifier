# Guion de playtest con cuota de cobertura

Generado por `tools/plan2700/playtest_guion.mjs`; verificado por
`npm run verify:plan2700:tanda23`. Las cuotas salen del volcado de diálogos: cada
dimensión tiene sus mapas, eventos y cajas contados, y cada sesión de contenido recibe
una fracción que, sumada con las demás de su dimensión, da exactamente 1.

## Contenido a cubrir

El universo es el contenido **con texto de jugador**: mapas que tienen al menos una caja,
eventos que muestran al menos una caja y el total de cajas del volcado. Los mapas con
eventos sin texto (4 en el proyecto) y los eventos sin cajas no entran en la cuota:
se recorren, pero no se pueden medir por diálogo mostrado.

| Dimensión | Mapas | Eventos con cajas | Cajas |
|---|---:|---:|---:|
| atlas | 583 | 884 | 4083 |
| base/dlc | 68 | 379 | 787 |
| glazed | 111 | 1277 | 1395 |
| light_platinum | 19 | 175 | 209 |
| liquid_crystal | 432 | 4253 | 5096 |
| nightmare/multiversal | 5 | 19 | 63 |
| tfoh | 245 | 2321 | 2847 |
| unbound | 420 | 4388 | 5321 |
| **Total** | **1883** | **13696** | **19801** |

## Cuota por sesión

32 sesiones de contenido consumen cuota; 28 de soporte
(interfaz, input, Android, editor, estrés, rendimiento, compatibilidad y cierre) repiten
tramos ya cubiertos y **no** consumen cuota: contarlas dos veces inflaría la cobertura.

| Sesión | Título | Dimensión | Mapas | Eventos | Cajas | Ficha |
|---:|---|---|---:|---:|---:|---|
| 1 | arranque en frío, menú principal y primera partida. | base/dlc | 3 | 19 | 39 | `docs/qa/playtest/sesion-01` |
| 2 | partida guardada anterior al duelo de Arceus y su comportamiento. | base/dlc | 3 | 19 | 39 | `docs/qa/playtest/sesion-02` |
| 3 | duelo de Arceus completo, seis fases, sin guardado intermedio. | base/dlc | 4 | 23 | 47 | `docs/qa/playtest/sesion-03` |
| 4 | captura de Arceus y aparición junto a Oak. | base/dlc | 3 | 19 | 39 | `docs/qa/playtest/sesion-04` |
| 5 | entrada al postgame y primer contacto con el hub de Oak. | base/dlc | 3 | 19 | 39 | `docs/qa/playtest/sesion-05` |
| 6 | las siete grietas de creepypasta y su aviso de Entrar o Retirarse. | base/dlc + nightmare/multiversal | 9 | 44 | 98 | `docs/qa/playtest/sesion-06` |
| 7 | las siete emisiones en orden natural y su purga. | nightmare/multiversal | 2 | 7 | 22 | `docs/qa/playtest/sesion-07` |
| 8 | las siete emisiones en orden inverso y su purga. | nightmare/multiversal | 1 | 6 | 22 | `docs/qa/playtest/sesion-08` |
| 9 | punto de colapso y subida a la falda del Monte Silver. | base/dlc | 5 | 30 | 63 | `docs/qa/playtest/sesion-09` |
| 10 | cumbre, Red y su combate. | base/dlc | 3 | 19 | 39 | `docs/qa/playtest/sesion-10` |
| 11 | Liga Oscura con los siete sellos y su Diploma. | base/dlc | 4 | 23 | 47 | `docs/qa/playtest/sesion-11` |
| 12 | entrada a Atlas y primer lote de franjas. | atlas | 204 | 309 | 1429 | `docs/qa/playtest/sesion-12` |
| 13 | los ocho gimnasios de Atlas y sus puzles. | atlas | 117 | 177 | 817 | `docs/qa/playtest/sesion-13` |
| 14 | anclas Tier 1 y su narración. | atlas | 262 | 398 | 1837 | `docs/qa/playtest/sesion-14` |
| 15 | ciudad Teckel y la escena de Maxine. | base/dlc | 3 | 15 | 31 | `docs/qa/playtest/sesion-15` |
| 16 | Isla Espejo y la captura de un Pokégod por forma. | base/dlc | 3 | 19 | 39 | `docs/qa/playtest/sesion-16` |
| 17 | barco a Glazed y primera ciudad. | glazed | 39 | 447 | 488 | `docs/qa/playtest/sesion-17` |
| 18 | Glazed de punta a punta y su campeón. | glazed | 72 | 830 | 907 | `docs/qa/playtest/sesion-18` |
| 19 | barco a Light Platinum y su capital. | light_platinum | 8 | 70 | 84 | `docs/qa/playtest/sesion-19` |
| 20 | Light Platinum de punta a punta y su campeón. | light_platinum | 11 | 105 | 125 | `docs/qa/playtest/sesion-20` |
| 21 | Liquid Crystal de punta a punta y su campeón. | liquid_crystal | 432 | 4253 | 5096 | `docs/qa/playtest/sesion-21` |
| 22 | TFOH de punta a punta y su cierre narrativo. | tfoh | 245 | 2321 | 2847 | `docs/qa/playtest/sesion-22` |
| 23 | Unbound de punta a punta y su campeón exigente. | unbound | 420 | 4388 | 5321 | `docs/qa/playtest/sesion-23` |
| 24 | las cinco misiones de Team Rocket en una sola partida. | base/dlc | 5 | 30 | 63 | `docs/qa/playtest/sesion-24` |
| 25 | disfraz puesto y quitado dentro de la base. | base/dlc | 3 | 15 | 31 | `docs/qa/playtest/sesion-25` |
| 26 | movimientos de campo sin medallas en las siete regiones. | base/dlc | 3 | 15 | 31 | `docs/qa/playtest/sesion-26` |
| 27 | mochila libre en combate en cada tipo de combate. | base/dlc | 3 | 15 | 31 | `docs/qa/playtest/sesion-27` |
| 28 | menú Z y menú de estado tras cada desbloqueo. | base/dlc | 3 | 15 | 31 | `docs/qa/playtest/sesion-28` |
| 29 | guardar y cargar dentro de cada dimensión. | base/dlc | 3 | 15 | 31 | `docs/qa/playtest/sesion-29` |
| 30 | perder contra cada jefe final y reintentar. | base/dlc | 2 | 11 | 24 | `docs/qa/playtest/sesion-30` |
| 31 | abandonar cada región a mitad y retomar después. | base/dlc | 2 | 11 | 24 | `docs/qa/playtest/sesion-31` |
| 32 | el DLC completo sin usar ninguna guía externa. | base/dlc | 3 | 9 | 20 | `docs/qa/playtest/sesion-32` |
| 33 | prueba en ventana pequeña de escritorio. | soporte (interfaz: ventana pequeña de escritorio) | — | — | — | `docs/qa/playtest/sesion-33` |
| 34 | prueba a pantalla completa de escritorio. | soporte (interfaz: pantalla completa de escritorio) | — | — | — | `docs/qa/playtest/sesion-34` |
| 35 | prueba con mando. | soporte (input: mando) | — | — | — | `docs/qa/playtest/sesion-35` |
| 36 | prueba con teclado. | soporte (input: teclado) | — | — | — | `docs/qa/playtest/sesion-36` |
| 37 | prueba en Android con Kirin. | soporte (android: Kirin) | — | — | — | `docs/qa/playtest/sesion-37` |
| 38 | prueba con la APK de PokeMod Studio como editor en paralelo. | soporte (editor: PokeMod Studio en paralelo) | — | — | — | `docs/qa/playtest/sesion-38` |
| 39 | deshacer y rehacer en el editor sobre un mapa del DLC. | soporte (editor: deshacer y rehacer) | — | — | — | `docs/qa/playtest/sesion-39` |
| 40 | auditoría del editor sobre el contenido nuevo. | soporte (editor: auditoría del contenido nuevo) | — | — | — | `docs/qa/playtest/sesion-40` |
| 41 | exportación ZIP desde el editor y su reimportación. | soporte (editor: exportación ZIP y reimportación) | — | — | — | `docs/qa/playtest/sesion-41` |
| 42 | modo lectura sin permisos de escritura. | soporte (editor: modo lectura) | — | — | — | `docs/qa/playtest/sesion-42` |
| 43 | partida larga de cuatro horas seguidas sin reiniciar. | soporte (estrés: partida larga de cuatro horas) | — | — | — | `docs/qa/playtest/sesion-43` |
| 44 | partida con un guardado muy antiguo del juego original. | soporte (compatibilidad: guardado antiguo del juego original) | — | — | — | `docs/qa/playtest/sesion-44` |
| 45 | partida nueva hasta el postgame sin usar atajos. | soporte (duración: partida nueva hasta el postgame) | — | — | — | `docs/qa/playtest/sesion-45` |
| 46 | prueba de estrés de apertura y cierre de menús en todas las dimensiones. | soporte (estrés: menús en todas las dimensiones) | — | — | — | `docs/qa/playtest/sesion-46` |
| 47 | prueba de estrés de surf y buceo en cada cuerpo de agua nuevo. | soporte (campo: surf y buceo) | — | — | — | `docs/qa/playtest/sesion-47` |
| 48 | prueba de pesca en los mapas nuevos con agua. | soporte (encuentros: pesca) | — | — | — | `docs/qa/playtest/sesion-48` |
| 49 | prueba de vuelo y teletransporte a los mapas nuevos si el juego lo permite. | soporte (navegación: vuelo y teletransporte) | — | — | — | `docs/qa/playtest/sesion-49` |
| 50 | prueba del día y noche en las ciudades nuevas. | soporte (tiempo: día y noche) | — | — | — | `docs/qa/playtest/sesion-50` |
| 51 | prueba de clima extremo y su efecto en el rendimiento. | soporte (rendimiento: clima extremo) | — | — | — | `docs/qa/playtest/sesion-51` |
| 52 | prueba de la niebla en interiores y exteriores. | soporte (render: niebla) | — | — | — | `docs/qa/playtest/sesion-52` |
| 53 | prueba de la restauración del tono de pantalla tras cada cinemática. | soporte (render: restauración del tono) | — | — | — | `docs/qa/playtest/sesion-53` |
| 54 | prueba de las transiciones de batalla nuevas. | soporte (combate: transiciones nuevas) | — | — | — | `docs/qa/playtest/sesion-54` |
| 55 | prueba de las animaciones de los jefes nuevos. | soporte (combate: animaciones de jefes) | — | — | — | `docs/qa/playtest/sesion-55` |
| 56 | prueba de las recompensas únicas en una partida ya completada. | soporte (recompensas: únicas tras completar) | — | — | — | `docs/qa/playtest/sesion-56` |
| 57 | prueba de revancha contra todos los jefes con revancha disponible. | soporte (revancha: jefes con revancha) | — | — | — | `docs/qa/playtest/sesion-57` |
| 58 | prueba de derrota contra todos los jefes con combate obligatorio. | soporte (combates: derrota contra jefes obligatorios) | — | — | — | `docs/qa/playtest/sesion-58` |
| 59 | prueba de huida y captura en los combates especiales. | soporte (combates: huida y captura especiales) | — | — | — | `docs/qa/playtest/sesion-59` |
| 60 | partida de cierre completa desde el arranque hasta el último diploma. | soporte (cierre: partida completa hasta el último diploma) | — | — | — | `docs/qa/playtest/sesion-60` |

## Regla de registro

Cada sesión se anota en su ficha (`README.md` de su carpeta) con
`fecha`, `version_commit`, `entorno`, `duracion_minutos`, `mapas_visitados`, `eventos_ejecutados`, `dialogos_mostrados`, `hallazgos`, `capturas`, `tasa_descubrimiento`.
Una ficha vacía o sin evidencia es `manual_pending`, no PASS. Los hallazgos van
numerados, con gravedad (`bloqueante`, `grave`, `leve`, `cosmético`) y su prueba de
regresión cuando se corrigen.

## Control de esta corrida

- Sesiones: 60 (32 de contenido, 28 de soporte).
- Fichas presentes: 60/60.
- Suma de cuotas: 1883 mapas · 13696 eventos · 19801 cajas = total medido.
- Estado: `manual_pending` — el guion está listo y la partida no se ha hecho.
