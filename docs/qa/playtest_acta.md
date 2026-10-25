# Acta de playtest completo

**Estado: SIN FIRMAR — 0 de 60 sesiones ejecutadas.**

Esta acta es el cierre del carril de playtest del plan 2700. El guion está listo y
medido ([`playtest_guion.md`](playtest_guion.md), [`playtest_cobertura.md`](playtest_cobertura.md)),
pero **no se ha jugado ninguna sesión**: las 60 fichas de [`playtest/`](playtest/README.md)
siguen en `manual_pending`. Una ficha vacía no es un aprobado; esta acta tampoco lo es.

## Qué se firmaría y con qué evidencia

Cada sesión se firma en su propia ficha (`docs/qa/playtest/sesion-NN/README.md`) con
fecha, versión/commit, entorno, duración, mapas visitados, eventos ejecutados, diálogos
mostrados, hallazgos numerados con gravedad, capturas y tasa de descubrimiento. El acta
sólo pasa a firmada cuando las 60 fichas tienen esos campos **y** todos los hallazgos
`bloqueante` o `grave` están cerrados con su prueba de regresión.

La puerta automática de esa regla es `npm run verify:playtest:regresiones`; el guion y sus
cuotas son `npm run verify:playtest:guion`. Hoy ambas pasan porque describen el estado
real: guion completo, cero sesiones ejecutadas.

## Las 60 sesiones

| # | Sesión | Tipo | Estado | Ficha |
|---:|---|---|---|---|
| 1 | arranque en frío, menú principal y primera partida. | contenido | manual_pending | [sesion-01](playtest/sesion-01/README.md) |
| 2 | partida guardada anterior al duelo de Arceus y su comportamiento. | contenido | manual_pending | [sesion-02](playtest/sesion-02/README.md) |
| 3 | duelo de Arceus completo, seis fases, sin guardado intermedio. | contenido | manual_pending | [sesion-03](playtest/sesion-03/README.md) |
| 4 | captura de Arceus y aparición junto a Oak. | contenido | manual_pending | [sesion-04](playtest/sesion-04/README.md) |
| 5 | entrada al postgame y primer contacto con el hub de Oak. | contenido | manual_pending | [sesion-05](playtest/sesion-05/README.md) |
| 6 | las siete grietas de creepypasta y su aviso de Entrar o Retirarse. | contenido | manual_pending | [sesion-06](playtest/sesion-06/README.md) |
| 7 | las siete emisiones en orden natural y su purga. | contenido | manual_pending | [sesion-07](playtest/sesion-07/README.md) |
| 8 | las siete emisiones en orden inverso y su purga. | contenido | manual_pending | [sesion-08](playtest/sesion-08/README.md) |
| 9 | punto de colapso y subida a la falda del Monte Silver. | contenido | manual_pending | [sesion-09](playtest/sesion-09/README.md) |
| 10 | cumbre, Red y su combate. | contenido | manual_pending | [sesion-10](playtest/sesion-10/README.md) |
| 11 | Liga Oscura con los siete sellos y su Diploma. | contenido | manual_pending | [sesion-11](playtest/sesion-11/README.md) |
| 12 | entrada a Atlas y primer lote de franjas. | contenido | manual_pending | [sesion-12](playtest/sesion-12/README.md) |
| 13 | los ocho gimnasios de Atlas y sus puzles. | contenido | manual_pending | [sesion-13](playtest/sesion-13/README.md) |
| 14 | anclas Tier 1 y su narración. | contenido | manual_pending | [sesion-14](playtest/sesion-14/README.md) |
| 15 | ciudad Teckel y la escena de Maxine. | contenido | manual_pending | [sesion-15](playtest/sesion-15/README.md) |
| 16 | Isla Espejo y la captura de un Pokégod por forma. | contenido | manual_pending | [sesion-16](playtest/sesion-16/README.md) |
| 17 | barco a Glazed y primera ciudad. | contenido | manual_pending | [sesion-17](playtest/sesion-17/README.md) |
| 18 | Glazed de punta a punta y su campeón. | contenido | manual_pending | [sesion-18](playtest/sesion-18/README.md) |
| 19 | barco a Light Platinum y su capital. | contenido | manual_pending | [sesion-19](playtest/sesion-19/README.md) |
| 20 | Light Platinum de punta a punta y su campeón. | contenido | manual_pending | [sesion-20](playtest/sesion-20/README.md) |
| 21 | Liquid Crystal de punta a punta y su campeón. | contenido | manual_pending | [sesion-21](playtest/sesion-21/README.md) |
| 22 | TFOH de punta a punta y su cierre narrativo. | contenido | manual_pending | [sesion-22](playtest/sesion-22/README.md) |
| 23 | Unbound de punta a punta y su campeón exigente. | contenido | manual_pending | [sesion-23](playtest/sesion-23/README.md) |
| 24 | las cinco misiones de Team Rocket en una sola partida. | contenido | manual_pending | [sesion-24](playtest/sesion-24/README.md) |
| 25 | disfraz puesto y quitado dentro de la base. | contenido | manual_pending | [sesion-25](playtest/sesion-25/README.md) |
| 26 | movimientos de campo sin medallas en las siete regiones. | contenido | manual_pending | [sesion-26](playtest/sesion-26/README.md) |
| 27 | mochila libre en combate en cada tipo de combate. | contenido | manual_pending | [sesion-27](playtest/sesion-27/README.md) |
| 28 | menú Z y menú de estado tras cada desbloqueo. | contenido | manual_pending | [sesion-28](playtest/sesion-28/README.md) |
| 29 | guardar y cargar dentro de cada dimensión. | contenido | manual_pending | [sesion-29](playtest/sesion-29/README.md) |
| 30 | perder contra cada jefe final y reintentar. | contenido | manual_pending | [sesion-30](playtest/sesion-30/README.md) |
| 31 | abandonar cada región a mitad y retomar después. | contenido | manual_pending | [sesion-31](playtest/sesion-31/README.md) |
| 32 | el DLC completo sin usar ninguna guía externa. | contenido | manual_pending | [sesion-32](playtest/sesion-32/README.md) |
| 33 | prueba en ventana pequeña de escritorio. | soporte | manual_pending | [sesion-33](playtest/sesion-33/README.md) |
| 34 | prueba a pantalla completa de escritorio. | soporte | manual_pending | [sesion-34](playtest/sesion-34/README.md) |
| 35 | prueba con mando. | soporte | manual_pending | [sesion-35](playtest/sesion-35/README.md) |
| 36 | prueba con teclado. | soporte | manual_pending | [sesion-36](playtest/sesion-36/README.md) |
| 37 | prueba en Android con Kirin. | soporte | manual_pending | [sesion-37](playtest/sesion-37/README.md) |
| 38 | prueba con la APK de PokeMod Studio como editor en paralelo. | soporte | manual_pending | [sesion-38](playtest/sesion-38/README.md) |
| 39 | deshacer y rehacer en el editor sobre un mapa del DLC. | soporte | manual_pending | [sesion-39](playtest/sesion-39/README.md) |
| 40 | auditoría del editor sobre el contenido nuevo. | soporte | manual_pending | [sesion-40](playtest/sesion-40/README.md) |
| 41 | exportación ZIP desde el editor y su reimportación. | soporte | manual_pending | [sesion-41](playtest/sesion-41/README.md) |
| 42 | modo lectura sin permisos de escritura. | soporte | manual_pending | [sesion-42](playtest/sesion-42/README.md) |
| 43 | partida larga de cuatro horas seguidas sin reiniciar. | soporte | manual_pending | [sesion-43](playtest/sesion-43/README.md) |
| 44 | partida con un guardado muy antiguo del juego original. | soporte | manual_pending | [sesion-44](playtest/sesion-44/README.md) |
| 45 | partida nueva hasta el postgame sin usar atajos. | soporte | manual_pending | [sesion-45](playtest/sesion-45/README.md) |
| 46 | prueba de estrés de apertura y cierre de menús en todas las dimensiones. | soporte | manual_pending | [sesion-46](playtest/sesion-46/README.md) |
| 47 | prueba de estrés de surf y buceo en cada cuerpo de agua nuevo. | soporte | manual_pending | [sesion-47](playtest/sesion-47/README.md) |
| 48 | prueba de pesca en los mapas nuevos con agua. | soporte | manual_pending | [sesion-48](playtest/sesion-48/README.md) |
| 49 | prueba de vuelo y teletransporte a los mapas nuevos si el juego lo permite. | soporte | manual_pending | [sesion-49](playtest/sesion-49/README.md) |
| 50 | prueba del día y noche en las ciudades nuevas. | soporte | manual_pending | [sesion-50](playtest/sesion-50/README.md) |
| 51 | prueba de clima extremo y su efecto en el rendimiento. | soporte | manual_pending | [sesion-51](playtest/sesion-51/README.md) |
| 52 | prueba de la niebla en interiores y exteriores. | soporte | manual_pending | [sesion-52](playtest/sesion-52/README.md) |
| 53 | prueba de la restauración del tono de pantalla tras cada cinemática. | soporte | manual_pending | [sesion-53](playtest/sesion-53/README.md) |
| 54 | prueba de las transiciones de batalla nuevas. | soporte | manual_pending | [sesion-54](playtest/sesion-54/README.md) |
| 55 | prueba de las animaciones de los jefes nuevos. | soporte | manual_pending | [sesion-55](playtest/sesion-55/README.md) |
| 56 | prueba de las recompensas únicas en una partida ya completada. | soporte | manual_pending | [sesion-56](playtest/sesion-56/README.md) |
| 57 | prueba de revancha contra todos los jefes con revancha disponible. | soporte | manual_pending | [sesion-57](playtest/sesion-57/README.md) |
| 58 | prueba de derrota contra todos los jefes con combate obligatorio. | soporte | manual_pending | [sesion-58](playtest/sesion-58/README.md) |
| 59 | prueba de huida y captura en los combates especiales. | soporte | manual_pending | [sesion-59](playtest/sesion-59/README.md) |
| 60 | partida de cierre completa desde el arranque hasta el último diploma. | soporte | manual_pending | [sesion-60](playtest/sesion-60/README.md) |

## Firmas

Ninguna. Este bloque queda vacío hasta que exista una corrida humana por sesión.

```text
Sesión:      sin firmar
Ejecutado:   0 de 60
Hallazgos:   sin registrar
Fecha:       —
```

## Lo que esta acta no dice

- No dice que el juego esté libre de defectos: dice que nadie lo ha jugado entero.
- No sustituye a [`playtest_cobertura.md`](playtest_cobertura.md), que separa lo indexado
  de lo ejercido, ni a las mediciones estáticas de [`rendimiento.md`](rendimiento.md) y
  [`rendimiento_presupuesto.md`](rendimiento_presupuesto.md).
