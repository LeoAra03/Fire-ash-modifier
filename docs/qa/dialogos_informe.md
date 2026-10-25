# Informe de diálogos del plan 2700

Fase 001 del lote · tanda 22 de `tareas.txt` (líneas 2100–2199,
tareas 2096–2195). Este informe se **regenera** con
`npm run audit:plan2700:tanda22` y se **verifica** con `npm run verify:plan2700:tanda22`:
si el contenido cambia y el informe no, la verificación falla.

## Conteos medidos

| Qué | Cuánto |
|---|---|
| Cajas de texto de evento (bloques 101/401) | 19801 |
| Mapas con cajas / mapas con eventos PokeMod | 1883 / 1887 |
| Eventos PokeMod | 13736 |
| Páginas de evento | 15556 |
| Hablantes distintos (sp[Nombre] o «Nombre:») | 67 |
| Literales de jugador en secciones Ruby `PokeMod_*` | 370 |
| Códigos de escape reconocidos por el motor | 32 |

El volcado tiene 19801 cajas de texto y 370 literales Ruby: esas dos cifras
son la referencia de todo lo demás. El veredicto de las 100 tareas —qué se verificó automáticamente,
qué es hallazgo abierto y qué queda en el carril de playtest o en el editorial— está en
`content/plan2700_tanda22.json`, fila por fila, con su sonda y su conteo.

## Control de formato

`node tools/qa/dialogos_formato_check.mjs` recorre las 19801 cajas con las reglas de
`REGLAS_FORMATO` (una sola definición, compartida con las sondas de la tanda):

- **Errores:** 0. Un error rompe el build: caja vacía, código de escape que el
  motor no trata, variable insertada inexistente o sin nombre, etiqueta de hablante vacía, comillas
  desbalanceadas, comilla recta y salto de línea forzado.
- **Avisos:** 400. Se publican y no rompen.

| Regla | Casos |
|---|---|
| `raya_sin_espacio` | 1 |
| `doble_guion` | 1 |
| `palabra_pegada` | 329 |
| `espacio_doble` | 8 |
| `signo_apertura` | 198 |

La autoprueba (`--selftest`) demuestra que cada regla dispara con una caja que la incumple y calla
con una caja correcta: 17 casos, 13 reglas.

## Sondas de la tanda

| Sonda | Veredicto | Casos | Universo | Qué mide |
|---|---|---|---|---|
| conteo_coherente | ok | 0 | 19801 | Conteo de cajas coherente con eventos y páginas |
| creditos | hallazgo | 6 | — | Atribuciones de las campañas invitadas |
| cuarenta_lideres | ok | 0 | 32 | Cuarenta líderes con switch, texto y primera línea propia |
| cupo_campanas | ok | 0 | 14767 | Cinco campañas invitadas |
| cupo_espejo | hallazgo | 8 | 26 | Dieciséis jefes de Isla Espejo |
| cupo_misiones_rocket | ok | 0 | 27 | Cinco misiones de Team Rocket |
| cupo_mundos_teckel | hallazgo | 1 | 0 | Textos de Ciudad Teckel y Maxine |
| diplomas | ok | 0 | — | Diplomas con condición, texto y nombre coincidente |
| editor | hallazgo | 35 | 1486 | Textos de error del editor sin jerga y en español |
| emisiones | hallazgo | 1 | 111 | Siete emisiones numeradas y su degradación |
| formato | ok | 0 | 19801 | Formato de las cajas de diálogo |
| glosario_estricto | hallazgo | 4 | 19801 | Términos congelados con una sola forma |
| gore | ok | 0 | 236 | Gore gratuito en textos de terror |
| horizontes | hallazgo | 1 | 500 | 500 aventuras de Horizontes sin plantilla literal |
| hub_oak | hallazgo | 15 | 49 | Hub de Oak (mapa 48): páginas por estado y textos |
| humillacion | ok | 0 | 504 | Textos de derrota que humillan |
| jerga | hallazgo | 5034 | 20171 | Jerga de motor o de taller en texto de jugador |
| perfil_glazed | hallazgo | 69 | 1395 | Campaña Glazed con textos propios |
| promesas | ok | 0 | 80 | Promesas narrativas que el juego no cumple |
| repeticion_anclas | ok | 0 | 45 | texto repetido entre eventos |
| repeticion_emisiones | hallazgo | 3 | 111 | texto repetido entre eventos |
| repeticion_guardias | hallazgo | 1 | 51 | texto repetido entre eventos |
| repeticion_heridos | hallazgo | 1 | 12 | texto repetido entre eventos |
| repeticion_jefes | hallazgo | 8 | 499 | texto repetido entre eventos |
| repeticion_jefes_espejo | ok | 0 | 26 | texto repetido entre eventos |
| repeticion_mundos | hallazgo | 1 | 125 | texto repetido entre eventos |
| repeticion_pokegods | hallazgo | 2 | 175 | texto repetido entre eventos |
| repeticion_profesores | ok | 0 | 3 | texto repetido entre eventos |
| repeticion_rivales | ok | 0 | 12 | texto repetido entre eventos |
| repeticion_rocket | hallazgo | 3 | 62 | texto repetido entre eventos |
| repeticion_testigos | ok | 0 | 11 | texto repetido entre eventos |
| repeticion_transportes | hallazgo | 4 | 165 | texto repetido entre eventos |
| sin_datos_guardado | ok | 0 | 6 | Avisos de guardado |
| sin_datos_objetos | ok | 0 | 3 | Objetos examinables y carteles |
| sin_datos_recompensas | ok | 0 | 6 | Textos de recompensas |
| sin_datos_sellos | ok | 0 | 2 | Anuncios de sellos |
| variables_insertadas | ok | 0 | — | Variables insertadas inexistentes o vacías |
| volcado_regenerable | ok | 0 | — | Volcado regenerable y verificado por script |
| voz_campeones | hallazgo | 1 | 24 | Campeones con discurso propio |
| voz_heridos | hallazgo | 1 | 12 | Heridos de Team Rocket con nombre y voz propia |
| voz_jefes | hallazgo | 11 | 256 | Jefes con voz propia |
| voz_lideres | hallazgo | 6 | 172 | Líderes con voz propia |
| voz_pokegods | hallazgo | 2 | 175 | Pokégods con presentación propia |
| voz_profesores | ok | 0 | 3 | Profesores e investigadores con voz propia |
| voz_rocket | hallazgo | 4 | 62 | Team Rocket con voz propia |
| voz_rotom | hallazgo | 1 | 3 | Rotom del Tiempo con voz propia |
| voz_testigos | ok | 0 | 11 | Testigos con voz propia |

## Textos reescritos en esta fase

**Ninguno.** Esta fase audita y mide; no reescribe contenido. Cada reescritura de una voz, de una
promesa o de un bloque largo es trabajo editorial y se hace con el hallazgo delante, no a ciegas: por
eso esta fase entrega **candidatos con su motivo** y no cambios de texto. La lista de candidatos es lo
que la tarea 2178 pide tener por escrito antes de tocar una sola caja:

| Sonda | Casos | Primer motivo medido |
|---|---|---|
| creditos | 6 | sin atribución |
| cupo_espejo | 8 | faltan 8 de 16 |
| cupo_mundos_teckel | 1 | faltan 1 de 1 |
| editor | 35 | Data/Map${pad3(id)}.rxdata |
| emisiones | 1 | la numeración de las siete emisiones no se lee en el texto; la degradación progresiva es editorial |
| glosario_estricto | 4 | — |
| horizontes | 1 | Una grieta mezcla el presente con otra línea temporal de «realm». «pokemon» sirve de ancla |
| hub_oak | 15 | página 5 de «Oak» sin texto |
| jerga | 5034 | Enlace reconstruido del banco 0, mapa 0. La geometría se adaptó a Fire Ash; el destino conse |
| perfil_glazed | 69 | Enlace reconstruido del banco 10, mapa 3. La geometría se adaptó a Fire Ash; el destino co |
| repeticion_emisiones | 3 | ¿Entrar o retirarte? |
| repeticion_guardias | 1 | Vuelve cuando lo necesites. |
| repeticion_heridos | 1 | Pasas de largo. Nadie te ha visto. Tú sí. |
| repeticion_jefes | 8 | Tu victoria demuestra la fuerza de tu vínculo con tus Pokémon. Sigue adelante, Ash. |
| repeticion_mundos | 1 | Siete mundos rotos han vuelto a su tarde. No los has purgado: los has dejado descansar. Ar |
| repeticion_pokegods | 2 | El cristal ofrece tres Formas de Anomalía. |
| repeticion_rocket | 3 | Todavía no tienes rango para este encargo. Sigue haciendo lo que te manden. |
| repeticion_transportes | 4 | Vuelve cuando quieras. |
| voz_campeones | 1 | Haz espacio en la Mochila y vuelve a hablar conmigo. La decisión aún puede revisarse y la  |
| voz_heridos | 1 | Pasas de largo. Nadie te ha visto. Tú sí. |
| voz_jefes | 11 | Tu victoria demuestra la fuerza de tu vínculo con tus Pokémon. Sigue adelante, Ash. |
| voz_lideres | 6 | Tu victoria demuestra la fuerza de tu vínculo con tus Pokémon. Sigue adelante, Ash. |
| voz_pokegods | 2 | El cristal ofrece tres Formas de Anomalía. |
| voz_rocket | 4 | Todavía no tienes rango para este encargo. Sigue haciendo lo que te manden. |
| voz_rotom | 1 | El Rotom del Tiempo se ilumina y el aire se ordena a tu alrededor. Sostiene la grieta para |

Cada candidato lleva su sonda, su conteo y una muestra; el detalle completo de las 5223 observaciones
está en `content/plan2700_tanda22.json`, con el mapa y el evento de cada caso.

## Límite de este informe

Lo que aquí se mide es **estructura y forma sobre los datos compilados**: cajas, códigos, variables,
comillas, repeticiones literales entre eventos, conteos y presencia de registro. Lo que **no** se mide:
si una voz es buena, si un chiste hace gracia, si una escena se entiende jugando, si un jefe da miedo.
Eso exige partida y queda en el carril de playtest con su ficha. Ninguna tarea editorial se marca como
verificada por leer un archivo: las que solo se pueden juzgar así están declaradas `manual` en el
artefacto, con su carril.
