# Estado congelado

Generado: 2026-10-15T04:11:26.319Z

Inventario de solo lectura del juego vivo (`pokemon_fire_ash/Data`) y de los hashes SHA-256 de `Data/`, `Scripts/` y `tools/`. No modifica mapas, scripts ni partidas.

## Regla de oro (reafirmada en FASE 6)

**Ningún mapa, evento, switch o diálogo original de Fire Ash se edita. Todo el contenido nuevo entra por IDs nuevos y aditivos.**

- El hack original Fire Ash es **intocable**: sus mapas, eventos, diálogos, switches y variables se leen, nunca se reescriben.
- El contenido PokeMod entra por **IDs nuevos**: mapas a partir de 1000 (Horizontes 1001–1020, Atlas Mil 1021–2020, Dimensional Nightmare 2040–2190, Team Rocket 2220–2221), switches reservados **701–867** y variables reservadas **101–263** (verificado libres en su porción no asignada en FASE 4).
- Los archivos contenedores compartidos (`MapInfos.rxdata`, `map_metadata.dat`, `trainers.dat`, `species.dat`, …) solo se **extienden de forma aditiva** para registrar los IDs nuevos; jamás se alteran las entradas originales.
- Las partidas originales siguen cargando y todo lo nuevo tiene **retorno libre**: nada bloquea la historia principal, la Mochila ni la salida.
- Mecanismo de aplicación: el `inventario_congelado --verify` detecta cualquier cambio de hash en un archivo original y las herramientas `apply_*.mjs --verify` auditan que cada transformación siga siendo aditiva respecto al original respaldado en `PokeModBackups/`.

## Bitácora de fases

### FASE 1 — Línea base `npm test`

- **Fecha de la corrida:** 2026-10-15 (Node v22.22.3, npm 10.9.8, dependencias instaladas con `npm ci`, 54 paquetes).
- **Resultado global:** `npm test` completo terminó con **código de salida 0**.
- **Verificadores en rojo: NINGUNO.** No hay ningún paso del suite en estado fallido antes de iniciar las fases del backlog.
- `pretest` (`build:teckel`): OK — `Fire_Ash_Ciudad_Teckel_Paraiso.zip` (72 entradas).
- Tests directos OK: `marshal`, `history`, `integration` (web/js), `external_authoring`, `scripts_dangling_calls`, `verify_arceus_recursos`, `arceus_scope_map --audit` (global y sobre `PokeMod_CanonArceus`), `verify_arceus_action_safety`, `arceus_shield_harness`, `arceus_moves_harness`, `tone_safety`, `package_integrity`, `dn_runtime_support`.
- `npm run` verificados OK: `verify:zmenu`, `verify:graficos`, `verify:ruby`, `verify:mapas`, `verify:boot`, `verify:teckel`, `verify:visor`, `verify:lideres`, `verify:glazed`, `verify:light_platinum`, `verify:liquid_crystal`, `verify:canon:arceus`, `verify:arceus:sprites`, `verify:diplomas`, `verify:corregido:zip` (2616 archivos, 46.6 MB), `verify:ruta_de_dios`.
- Suite maestra final (`test:atlas:master`): **76 258 aserciones superadas, 0 fallos** (1227 mapas de campañas ROM, 8742 warps, 829 combates, 104 mapas DN, 946 eventos creepypasta).
- **Efecto colateral determinista del suite:** el `pretest` (`build:teckel`) re-escenifica `Scripts_corregido/Ciudad_Teckel_Paraiso/Data/` desde el juego vivo; los 5 archivos binarios de ese stage estaban desactualizados respecto a HEAD y quedaron resincronizados (rebuild idempotente, verificado con doble corrida e igual hash). No es un error: es la salida oficial del suite.

### FASE 3 — Regeneración del inventario congelado

- **Regenerado:** `node tools/inventario_congelado.mjs` (2026-10-15). Reescrito `tools/inventario_congelado.json` y este documento; `--verify` posterior en verde.
- **Archivos hasheados confirmados: 5417** (Data 5215, Scripts 0, tools 202) — sin desviaciones de conteo.
- Única desviación de hashes previa a regenerar: los 5 archivos del stage Teckel resincronizados por el `pretest` de la FASE 1 (ver arriba), absorbidos ahora en el JSON oficial. Ningún otro hash cambió.
- Estable tras regenerar: mapas 3465 · scripts 409 · pares ID 9197 · colisiones 0 · rango reservado libre.

### FASE 4 — Verificación del rango reservado

- **`node tools/inventario_congelado.mjs --verify`: exit 0** — "hashes, mapas, anclas, pares y rango reservado coinciden" contra el JSON oficial de la FASE 3.
- `unassignedPortionFree: true`. **Switches 701–867:** 167/167 con asignación canónica, 0 sin asignación, 0 de la porción no asignada en uso. **Variables 101–263:** 163/163 con asignación canónica, 0 sin asignación, 0 de la porción no asignada en uso.
- El rango reservado **sigue libre en su porción no asignada**: ningún ID de esa porción tiene nombre ni uso literal. Sin cambios de contenido; solo este registro.

### FASE 5 — Backup ZIP pre-escritura

- **Rehecho con la herramienta oficial:** `python3 tools/backup.py pokemon_fire_ash` → `pokemon_fire_ash/PokeModBackups/backup_20261015_041420.zip` (19.5 MB, 3530 entradas).
- Cobertura verificada: **3529/3529 archivos de `Data/`** (coincide 1:1 con el disco) **+ `Data/Scripts.rxdata` incluido** + `Game.ini`. Integridad del ZIP comprobada con `testzip`: sin corrupción.
- Creado **antes de la primera escritura del plan**; `PokeModBackups/` está gitignored por convención del repo (artefacto local), así que el ZIP vive en el árbol de trabajo y este registro documenta su existencia, huella y fecha.

### FASE 6 — Regla de oro reafirmada

- Añadida la sección **"Regla de oro"** al inicio de este documento: ningún mapa, evento, switch o diálogo original de Fire Ash se edita; todo entra por IDs nuevos y aditivos (mapas ≥ 1000, switches 701–867, variables 101–263, extensiones aditivas de contenedores, retorno libre).
- Coherente con el estado verificado: rango reservado libre (FASE 4), backup previo a escrituras (FASE 5) e inventario congelado en verde (FASE 3). Solo documentación; sin cambios de contenido.

### FASE 7 — Orden de reconstrucción obligatorio documentado

- Creado **`tools/plan900/orden_instalacion.sh`** con el orden obligatorio: **multiversal → canon Arceus → eras → restauración → dimensiones → rocket → circuito → ambience → wild**, con la justificación de cada posición (el multiversal reescribe puertas que el canon cierra; ambience necesita los 17 mapas nuevos ya creados; wild consume el catálogo `content/wild_zones.json` que ambience sincroniza).
- Tres modos: por defecto solo imprime el orden (`--plan`), `--verify` ejecuta los 9 verificadores npm en ese orden, `--apply` instala. Nada se ejecuta por accidente.
- Probado con resultados reales: modo plan exit 0 y modo `--verify` exit 0 con **los 9 verificadores en verde** (expansion, canon:arceus, eras, restauracion, dimensiones, rocket, circuito, ambience, wild).

### FASE 8 — Registro de avance del plan 900

- Creado **`tools/plan900/avance.md`**: registro fase por fase con **fecha y hash de HEAD** (base y cierre) más estado y verificación de cada fase. Fases 1–7 reconstruidas con datos reales de `git log`; la FASE 2 no fue enviada por el backlog y consta como no ejecutada.
- Creado **`tools/plan900/avance.sh`**: medidor que imprime fecha, hash de HEAD y última fase registrada, para reutilizar en cada fase futura (probado: exit 0).

### FASE 9 — Censo real de mapas

- **Ejecutado:** `node tools/analyze_compiled_fire_ash.mjs` (exit 0, solo lectura; informe detallado en `pokemon_fire_ash/PokeModBackups/analisis_total_fire_ash.json`, artefacto local gitignored).
- **Comparación contra el último recuento: COINCIDENCIA EXACTA.** El censo reporta **3465 entradas en `MapInfos.rxdata` y 3465 mapas leídos**, igual que los 3465 del inventario congelado (FASE 3). Conteo estricto en disco: 3465 archivos `Map<N>.rxdata` (rango de IDs 1–4419). El glob laxo `Map*.rxdata` da 3468 porque arrastra `MapInfos.rxdata`, `Map341 2.rxdata` y `Map813b.rxdata` (variantes preexistentes ajenas al censo; también existe `Map081.BAK` con otra extensión).
- Cruzado adicional con el inventario: 887 switches y 293 variables referenciados, 409 secciones de script — todo coincide.
- Otros totales del censo: 399 tilesets · 36147 eventos · 55499 páginas · 20779 NPCs · 57591 diálogos · 5208 elecciones · 19054 transfers · 4616 combates de entrenador · 5547 entrenadores · 1317 especies · 1025 objetos.
- Hallazgos del análisis estático (preexistentes, no rompen `npm test`): 41 issues — 8 errores de "entrenador compilado inexistente" (CAMPER/Wyatt m606, LASS/Lyra m630, COOLTRAINER_F/Victoria m355, COOLTRAINER_F/Kahili m959 ×2, SCIENTIST/Faba m960 ×2, SECRET_Volo/Volus m2037) y 33 avisos (23 sprite ausente, 10 objeto simbólico no definido).

### FASE 10 — Apertura zlib de los 409 scripts

- **`npm run verify:ruby`: exit 0** — 18 secciones Ruby revisadas con Ruby WASM, sin errores de sintaxis (6 del juego vivo `pokemon_fire_ash/Data/Scripts.rxdata`, 6 de `Scripts_corregido/Scripts.rxdata`, 3 del Paquete directo, 3 del paquete DN QA).
- **Barrido zlib completo (solo lectura): 409/409 secciones** de `pokemon_fire_ash/Data/Scripts.rxdata` descomprimidas con `zlib.inflateSync` **sin un solo error** — coincide con las 409 secciones del inventario congelado (FASE 3) y del censo (FASE 9).

### FASE 11 — Salud global del árbol (pre-reescritura)

- **`npm run verify:salud`: exit 0 — sin fallos graves** (`graves: []`), medido antes de empezar cualquier reescritura masiva.
- Mapas: 3465 entradas de MapInfos · 3465 archivos · sin archivo: ninguno · tileset vacío/fuera de rango: ninguno · transferencias rotas: ninguna · llamadas a métodos inexistentes: ninguna.
- Parches instalados: botón Z (`Input::SPECIAL`) ✔ y parche de gráficos ✔; secciones PokeMod presentes (RutaDeDios, CanonArceus, BadgeRegions, Dialogos, Atavios, ZMenu, Graficos).
- Diálogos: 57591 bloques, 0 vacíos, 40 líneas largas (cosmético, cajas de 53 car.).
- **1 aviso (no bloqueante):** 12 páginas «automático» sin espera (riesgo de bucle). Hallazgos informativos: ~16 mapas marcador de región sin tiles (Kanto, Johto, Sinnoh, etc., casi todos con 0 eventos) y 4 slots de tileset vacíos — preexistentes del juego base.

### FASE 12 — Política de IDs fijada

- Creado **`docs/qa/politica_ids.md`**: tabla maestra de rangos usados medida sobre datos reales (inventario congelado, censo y `MapInfos`/`System`/`trainer_types.dat`).
- Mapas: 3465 en disco, IDs 1–4419 — original 1–996, PokeMod desde 997 (Teckel) con todos los bloques etiquetados (Horizontes, Atlas Mil, Monte Silver/Ruta de Dios, DN, DLC, campañas ROM 3000–4419) e IDs libres listados.
- Switches: 887 usados (1–994), techo original 700; reservado 701–867 verificado; bloques Ruta de Dios 868–880, DN 882–939, campañas 990–994. Variables: 293 usadas (1–354), techo original 100; DN 264–307, atavíos, progreso campañas 350–354.
- Self-switches: 8017 pares `mapa:evento:letra` (A–E) en 2405 mapas — espacio propio por mapa, sin reserva global. Trainer types: 556 (0–593) — original 0–261, **libres 262–299**, `SECRET_*` 300–515, `SYGNA_*` 516–558, `DOJO_/ANNI_/Arc` 559–593.

### FASE 13 — Auditoría de persistencia de derrotas

- **`npm run verify:defeats`: exit 0 — sin anomalías.** Regla verificada: «si lo derrotaste una vez, queda derrotado» (con `canLose` para reintentar tras perder y revanchas solo tras elección explícita por menú).
- Total auditado: **1702 batallas en 747 eventos** — derrota permanente 691/747, revanchas opcionales por menú 70. Por bloque: Horizontes 241/241 permanentes (canLose 241/241), Atlas Mil 456 (437 permanentes + 56 revanchas + 19 salvajes Pokégod repetibles por diseño), Monte Silver 8/8, Multiversal 5/5, Teckel/Isla Espejo 4 (líder con revancha por menú).
- La Torre Grandeur Club (33 eventos, Map 141/151/214) es repetible **por diseño del juego original** y se reporta aparte; sus entradas «sin canLose» no son contenido DLC. Ningún jefe del DLC deja estado inconsistente tras la primera victoria.

### FASE 14 — Colisiones de eventos y rutas de guardado

- **`npm run verify:event-collision`: exit 0** — `Game_Character` bloquea eventos con sprite aunque estén marcados `Through`; `Game_Event` hace sólidos los eventos con `character_name`; `Game_Player` conserva la interacción con sprites sólidos (también al cargar el mapa encima). Sin colisiones de eventos.
- **`npm run verify:save-path`: exit 0** — `PokemonSystemSettings.dat` y `GameSpeedSetting.dat` ya no se escriben como auxiliares en «Save Files»: se guardan junto a `Game.rxdata`, cuya carpeta ya conoce `SaveData`. Descartado el `Errno::ENOENT` en PC/Android (Kirin). Sin rutas de guardado rotas.

### FASE 15 — Congelación de los 17 mapas del DLC y su música

- Creado **`docs/qa/mapas_dlc_musica.md`**: tabla única con los 17 mapas nuevos del DLC (2195, 2196, 2200, 2201, 2210, 2211, 2220, 2221, 2230, 2250–2257), su nombre, BGM asignado, volumen/tono, existencia del archivo y prefijo SHA-256 del mapa congelado.
- Verificado sobre disco: **17/17 con BGM idéntico al plan** (`content/dlc_ambience.json`), **17/17 archivos de música existentes** en `Audio/BGM/`, volumen/tono 100/100. Los ocho gimnasios de Atlas suenan cada uno distinto (Bruma→Cumbre).

### FASE 16 — Inventario de eventos PokeMod*

- Creado **`content/plan900_inventario_eventos.json`** con la herramienta reproducible `tools/plan900_inventario_eventos.mjs` (solo lectura, criterio: nombre de evento que empieza por `PokeMod`).
- Resultado real: **13 734 eventos PokeMod\* en 1887 de 3465 mapas**. Desglose por prefijo: Campaña ROM 12 379 · Tier3 420 · Tier2 240 · Tier1 200 · Barco 92 · Multiverso 59 · Región 57 · Circuito 50 · Atlas Mil 41 · Grieta 28 · Vía 25 · Restauración 23 · Rocket 22 · Pokégod 20 · Diplomas 9 · Canon 5 · Espejo 5 · Glazed 5 · y resto de marcadores puntuales (líderes de gimnasio, portal, vestidor, Oak…).
- Cada entrada registra mapId, nombre de mapa, eventoId, nombre, x/y y páginas; el JSON incluye totales y prefijos.

### FASE 17 — Integridad de los 500 eventos Horizonte N:

- **Confirmado: 500/500 eventos `Horizonte N:` instalados sin corrimiento de índices.** Cruzado catálogo (`content/horizontes_500.json`) ↔ disco: mapa esperado, **eventoId = slot+99** y nombre completo `Horizonte NNN: título` coinciden en los 500; IDs 1–500 completos, sin duplicados ni eventos fuera de catálogo; 25 aventuras exactas por cada uno de los 20 mapas (1001–1020).
- Las 92 transferencias (comando 201) de esos 20 mapas apuntan todas a mapas existentes (0 inválidas).
- **Hallazgo preexistente documentado:** `node tools/apply_horizontes_500_expansion.mjs --verify` termina en rojo con «se esperaban 44 transferencias aditivas; hay 56» — expectativa desfasada del verificador (el contenido posterior añadió transferencias válidas; el informe original hablaba de 44). No afecta a los eventos Horizonte ni a `npm test` (ese verificador no forma parte del suite de la FASE 1). Pendiente de ajuste en su fase.

### FASE 18 — Confirmación de Atlas Mil y las anclas Tier 1

- **1000/1000 mapas de Atlas Mil (1021–2020)** presentes en disco y con entrada en `MapInfos.rxdata` — cero faltantes.
- **40/40 anclas Tier 1 confirmadas:** mapas 1021–1996 (un ancla cada 25 mapas: 1021, 1046, 1071 … 1996), switches 708–747 — los 40 nombrados con el patrón `POKEMOD ATLAS SEAL*` (el 708 es `SEAL 01 BELL`, del 722–747 `SEAL 15–40`), variable compartida 103 (`POKEMOD ATLAS NARRATIVE SEALS`) y decisiones 104–143 las 40 nombradas.
- Cada mapa ancla tiene instalados su evento `PokeMod Tier1: Conductor <título de ancla>` y sus NPCs `PokeMod Tier1: NPC <nombre>` (verificado 40/40, 0 fallos).

### FASE 19 — Dimensional Nightmare y sus subconjuntos

- **151/151 mapas de Dimensional Nightmare (2040–2190)** presentes en disco y en `MapInfos.rxdata`: de `DN 2040 · Antesala de las Grietas` a `DN 2190 · Lavender Syndrome — Campanario Final`.
- **NEXO (2136–2140): 5/5** — Falla Cero, Pueblo Reensamblado, Centro Pokémon Sumergido, Pasillo de Código, Sala del Testigo. **Liga Oscura (2141–2142): 2/2** — Pórtico del Código, Coliseo del Vínculo. Ambos son subconjuntos de DN: sus conteos no se suman al total.
- Verificadores oficiales ejecutados: **`dn:liga:verify` exit 0** (mapas 2141/2142, MAD PIKACHU nv 175, 4 chispas, Pórtico BFS 100 % · Coliseo BFS 97 %), **`dn:events:verify` exit 0** (anomalías por episodio verificadas) y **`dn:flags:verify` exit 0** (54 switches, 43 variables DN).
- Nota preexistente: `dn:maps:verify` no es ejecutable en este espacio de trabajo porque falta `content/dimensional_nightmare_tiles_2x.json`, dependiente de `reference/dimensional_nightmare/slices/` purgado — el límite conocido documentado en `docs/DLC_TOTAL.md` §9; el paquete DN se construye bien y la suite maestra (FASE 1) ya auditó 104 mapas y 946 eventos creepypasta en verde.

### FASE 20 — Puertas de entrada al contenido extra (429 / 870)

- **Auditoría real de las 24 transferencias desde mapas originales (1–996) hacia contenido extra (≥997):**
  - **19 puertas tras el switch 429 (Postgame)**: las 7 grietas multiversales (páginas 429 y 429+sello 940–946), el Aide de Isla Espejo (Pallet→997, 429), la Escotilla (Mansión B1F→2194, 429+873), el Capitán de la Expedición (Carmín→2191, 429+873) y la página 429+873 del Guardabosques.
  - **3 puertas tras la cadena Volus**: Guardabosques de Ciudad Verde (→1000/1001) con 701/703 (misión Hypno) **+ 873** (`RUTA_DE_DIOS_ARCEUS_RESOLVED`, que solo se enciende ganando el duelo tras activar a Volus).
  - **2 puertas sin condición, ambas por diseño documentado**: el propio **portal de la Ruta de Dios** (Puntaneva→2038, sin requisito de 870 a propósito — recuperación para partidas antiguas que perdieron la flag, ver `INFORME_LA_RUTA_DE_DIOS.md` §3 y README) y la **puerta del Salón de Diplomas** (casa de Ash→2288, extensión inofensiva de la propia casa sin combates).
- **Origen del 870**: solo lo activa hablar con **Volus en Pueblo Hojaverde** (`Map513 ev101`, comando 121 ×2 tras la cinemática de las 17 Tablas, con opción de resonancia para otorgarlas). El 870 gobierna el diálogo posterior de Volus y al segundo Volus guía de Puntaneva (`Map625 ev103`), no al portal.
- **Todo el DLC y las campañas ROM se entra desde Puerto Horizonte (1001) u otros mapas extra** — transitivamente detrás de esas puertas. **Veredicto: la afirmación se sostiene en lo sustancial** (22/24 puertas tras 429 o la cadena Volus 870→873; las 2 excepciones son el mecanismo de recuperación y la sala de la casa, ambas intencionales y documentadas).

## Totales

- **Total de mapas:** 3465 archivos `Map*.rxdata` (3465 entradas en `MapInfos.rxdata`).
- **Total de scripts:** 409 secciones en `pokemon_fire_ash/Data/Scripts.rxdata`.
- **Total de pares ID usados:** 9197 (887 switches + 293 variables + 8017 self-switches).
- **Colisiones detectadas:** 0.

## Rango reservado

Confirmado: el rango reservado (switches 701–867, variables 101–263) **está libre en su porción no asignada**. Switches sin asignación canónica: 0. Variables sin asignación canónica: 0. Ningún ID de esa porción tiene nombre ni uso literal.

Asignación canónica cubierta: switches 167/167, variables 163/163. La porción asignada es 701–707 (base), 708–747 (anclas Tier 1), 748–867 (rutas Tier 2), variables 101–103 (contadores), 104–143 (decisiones Tier 1) y 144–263 (decisiones Tier 2).

## Mapas por rango

- **Horizontes** 1001–1020: **20** / 20
- **Atlas Mil** 1021–2020: **1000** / 1000
- **Dimensional Nightmare** 2040–2190: **151** / 151
- **NEXO** 2136–2140: **5** / 5 (subconjunto de dn; no sumar)
- **Liga Oscura** 2141–2142: **2** / 2 (subconjunto de dn; no sumar)
- **Team Rocket** 2220–2221: **2** / 2

NEXO y Liga Oscura caen dentro de Dimensional Nightmare. Sus conteos no se suman al total.

## Anclas Tier 1

40 anclas, mapIds 1021–1996, switches 708–747, variable compartida 103.

| # | Mapa | Título | Switch | Nombre | Variable |
|---:|---:|---|---:|---|---:|
| 1 | 1021 | Santuario de la Última Campana | 708 | POKEMOD ATLAS SEAL 01 BELL | 103 |
| 2 | 1046 | La Copa del Huevo Vacío | 709 | POKEMOD ATLAS SEAL 02 | 103 |
| 3 | 1071 | El Campeón de Fecha Imposible | 710 | POKEMOD ATLAS SEAL 03 | 103 |
| 4 | 1096 | El Gremio de la Camilla Vacía | 711 | POKEMOD ATLAS SEAL 04 | 103 |
| 5 | 1121 | Operación Rescate Demasiado Perfecto | 712 | POKEMOD ATLAS SEAL 05 | 103 |
| 6 | 1146 | La Sombra que Eligió Quedarse | 713 | POKEMOD ATLAS SEAL 06 | 103 |
| 7 | 1171 | El Jardín de los Dos Juramentos | 714 | POKEMOD ATLAS SEAL 07 | 103 |
| 8 | 1196 | La Persona Fuera del Encuadre | 715 | POKEMOD ATLAS SEAL 08 | 103 |
| 9 | 1221 | El Festival que Olvidó su Motivo | 716 | POKEMOD ATLAS SEAL 09 | 103 |
| 10 | 1246 | La Carta que Recuerda a su Jugador | 717 | POKEMOD ATLAS SEAL 10 | 103 |
| 11 | 1271 | El Compañero del Minuto Cero | 718 | POKEMOD ATLAS SEAL 11 | 103 |
| 12 | 1296 | El Punto que Nadie Quiso Marcar | 719 | POKEMOD ATLAS SEAL 12 | 103 |
| 13 | 1321 | La Señal Hecha de Ausencias | 720 | POKEMOD ATLAS SEAL 13 | 103 |
| 14 | 1346 | La Ciudad a la que Dieron Cuerda | 721 | POKEMOD ATLAS SEAL 14 | 103 |
| 15 | 1371 | El Mosaico de los Nombres Imposibles | 722 | POKEMOD ATLAS SEAL 15 | 103 |
| 16 | 1396 | La Receta que Lloraba por Otros | 723 | POKEMOD ATLAS SEAL 16 | 103 |
| 17 | 1421 | El Caso de las Cuatro Mediasnoches | 724 | POKEMOD ATLAS SEAL 17 | 103 |
| 18 | 1446 | El Museo de lo Todavía No Perdido | 725 | POKEMOD ATLAS SEAL 18 | 103 |
| 19 | 1471 | El Arrecife que Llegó Después | 726 | POKEMOD ATLAS SEAL 19 | 103 |
| 20 | 1496 | Los Dos Nombres del Cometa | 727 | POKEMOD ATLAS SEAL 20 | 103 |
| 21 | 1521 | La Central de las Cenizas Vivas | 728 | POKEMOD ATLAS SEAL 21 | 103 |
| 22 | 1546 | La Profecía Escrita Después | 729 | POKEMOD ATLAS SEAL 22 | 103 |
| 23 | 1571 | La Ciudad que Pagaba con Recuerdos | 730 | POKEMOD ATLAS SEAL 23 | 103 |
| 24 | 1596 | Las Cartas de una Familia Incompatible | 731 | POKEMOD ATLAS SEAL 24 | 103 |
| 25 | 1621 | El Mercado de los Umbrales Pequeños | 732 | POKEMOD ATLAS SEAL 25 | 103 |
| 26 | 1646 | La Estatua que Ensayaba Ciudades | 733 | POKEMOD ATLAS SEAL 26 | 103 |
| 27 | 1671 | La Mina de las Decisiones Sólidas | 734 | POKEMOD ATLAS SEAL 27 | 103 |
| 28 | 1696 | El Peaje de los Sueños Prestados | 735 | POKEMOD ATLAS SEAL 28 | 103 |
| 29 | 1721 | El Campeón de las Dos Banderas | 736 | POKEMOD ATLAS SEAL 29 | 103 |
| 30 | 1746 | La Academia del Error Permitido | 737 | POKEMOD ATLAS SEAL 30 | 103 |
| 31 | 1771 | La Frecuencia que Pide Permiso | 738 | POKEMOD ATLAS SEAL 31 | 103 |
| 32 | 1796 | El Héroe que Pidió un Nombre Pequeño | 739 | POKEMOD ATLAS SEAL 32 | 103 |
| 33 | 1821 | La Victoria que Nadie Ganó | 740 | POKEMOD ATLAS SEAL 33 | 103 |
| 34 | 1846 | La Excavación que Fabricó su Pasado | 741 | POKEMOD ATLAS SEAL 34 | 103 |
| 35 | 1871 | El Refugio que Contestaba Solo | 742 | POKEMOD ATLAS SEAL 35 | 103 |
| 36 | 1896 | El Registro que No Pudo Clasificarte | 743 | POKEMOD ATLAS SEAL 36 | 103 |
| 37 | 1921 | El Acertijo que Cambiaba la Pregunta | 744 | POKEMOD ATLAS SEAL 37 | 103 |
| 38 | 1946 | El Enemigo que Alguien Recordó por Ti | 745 | POKEMOD ATLAS SEAL 38 | 103 |
| 39 | 1971 | La Copia que Aprendió a Despertar | 746 | POKEMOD ATLAS SEAL 39 | 103 |
| 40 | 1996 | El Final que Dejó Cuarenta Puertas Abiertas | 747 | POKEMOD ATLAS SEAL 40 | 103 |

## Colisiones

- Ninguna.

## Hashes

- Archivos hasheados: 5417 (Data 5215, Scripts 0, tools 202).
- Directorios `Scripts/` encontrados: 0 archivo(s). Las secciones Ruby del juego están dentro de `Data/Scripts.rxdata`.
- Algoritmo: SHA-256. El detalle por archivo está en `tools/inventario_congelado.json`.
- Expresiones dinámicas (no se tratan como ID libre): 71.
- Archivos no legibles durante el escaneo: 0.

Regenerar: `node tools/inventario_congelado.mjs`. Comprobar sin reescribir: `node tools/inventario_congelado.mjs --verify`.
