# FASE 001 — tanda 22 (líneas 2100–2199 de `tareas.txt`)

Carril de diálogos: de la auditoría de voz de los jefes al cierre del carril con el
control de formato en CI y el informe publicado. Tareas **2096–2195**, cien líneas,
ids consecutivos.

Reproducir: `npm run audit:plan2700:tanda22` · Verificar: `npm run verify:plan2700:tanda22`
Artefacto: [`content/plan2700_tanda22.json`](../../../content/plan2700_tanda22.json) ·
Informe: [`docs/qa/dialogos_informe.md`](../dialogos_informe.md)

## Qué se añadió

| Pieza | Para qué |
|---|---|
| `tools/plan2700/tanda_textos_core.mjs` | Núcleo compartido: corta la tanda, carga el corpus real (cajas 101/401 del volcado + literales de las secciones Ruby `PokeMod_*`), define `REGLAS_FORMATO` una sola vez y reparte veredictos con sonda, carril y conteo. |
| `tools/qa/dialogos_formato_check.mjs` | Control de formato del volcado, con `--selftest`: 17 casos que demuestran que cada regla detecta lo que dice detectar. |
| `tools/plan2700/fase_001_tanda_22.mjs` | Las 100 tareas de la tanda contra el contenido compilado; escribe el artefacto y el informe. |
| `.github/workflows/build-apk.yml` | Paso «Control de formato de diálogos» antes de `verify:all`. |

## Veredicto de las 100 tareas

`verificado_auto` 50 · `hallazgo` 45 · `manual (playtest)` 4 · `manual (editorial)` 1.

Ninguna tarea se marca verificada por leer un archivo sin medir nada: cada fila del
artefacto lleva su sonda y su conteo, y lo que exige partida o criterio editorial está
declarado `manual` con su carril.

## Lo que se midió (y lo que apareció)

- **Formato del volcado:** 19 801 cajas, **0 errores**, 400 avisos
  (`palabra_pegada` 329, `signo_apertura` 198, `espacio_doble` 8, `raya_sin_espacio` 1,
  `doble_guion` 1). Los 32 códigos de escape se leen de `Messages` en cada corrida: el
  control no cree que `\ch[1,2,…]` sea un error porque el motor lo trata.
- **Jerga de motor en texto de jugador:** 5 034 casos. El grueso son los textos de warp
  de las campañas («Enlace reconstruido del banco 0, mapa 0…»), más menciones de
  `Map…rxdata`, `tileset` y `switch N`. Es el hallazgo más grande de la tanda.
- **Hub de Oak (mapa 48):** 49 páginas, 40 con texto, **9 sin texto**, 30 estados de
  switch distintos, 6 estados repetidos entre NPC, 3 páginas de postgame (switch 429) y
  la página del mod. **27 páginas en inglés y 13 en español**: el hub conserva el texto
  de la base sin traducir.
- **Discursos de jefe:** 8 textos repetidos literalmente entre eventos distintos (hasta
  37 eventos con la misma frase de victoria); 100 eventos de jefe auditados, 499 cajas.
- **Líderes:** 40 (32 de campaña con switch nombrado + 8 de Atlas), 0 duplicados; 6
  textos de líder repetidos entre eventos.
- **Glosario:** los siete términos congelados se usan 223 veces; 4 términos aparecen con
  forma distinta de la congelada (`emisión`, `sello`, `fragmento` en minúscula dentro de
  prosa, que el glosario admite sólo si se decide). Queda como hallazgo editorial, no se
  reescribe a ciegas.
- **Horizontes:** 500 aventuras, 0 títulos y 0 ganchos idénticos; 1 plantilla de gancho
  se repite más de 20 veces al normalizar el Pokémon y el realm.
- **Diplomas:** 7, todos con condición, textos de marco vacío/ganado y nombre coincidente
  con `docs/ATAVIOS_Y_DIPLOMAS.md`.
- **Créditos:** las seis campañas invitadas no figuran por nombre en
  `docs/qa/creditos_arte.md`; el documento remite a `Credits.txt` y declara que no se
  incorporan textos de las ROMs invitadas.
- **Editor:** 35 literales de `web/js` con jerga de motor (`Data/Map….rxdata`, `tileset`).
  Son mensajes de diagnóstico del editor, no del juego; se listan para decidir tono.
- **Conteos:** 19 801 cajas coherentes con 15 556 páginas, 13 736 eventos y 1 883 mapas;
  el volcado tiene generador, normalizador y `verify` en `package.json`.

## Límite

Se mide forma, estructura y repetición sobre los datos compilados. No se mide si una voz
es buena ni si una escena se entiende jugando: eso sigue en el carril de playtest con su
ficha. Esta fase **no reescribe texto**: entrega candidatos con motivo para que la
reescritura se decida con el hallazgo delante.
