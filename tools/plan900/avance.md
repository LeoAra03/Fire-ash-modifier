# Registro de avance del plan 900 (FASE 8)

`tools/plan900/avance.md` — registro fase por fase del estado de avance, medido
con **fecha** y **hash de HEAD**.

Convenciones:

- **HEAD base**: hash de HEAD medido al *iniciar* la fase (estado heredado).
- **HEAD cierre**: hash del commit que *cerró* la fase (contiene su entrega).
  Para la fase en curso es el propio commit que transporta este registro y se
  confirma en el registro siguiente.
- Una fase solo se marca `OK` cuando su verificación real terminó en exit 0.
- Las fases se registran en el orden en que llegan desde el backlog. La
  **FASE 2 no fue enviada** en esta sesión (el backlog saltó de la 1 a la 3);
  no consta como ejecutada.

Medidor: `bash tools/plan900/avance.sh` imprime fecha, hash de HEAD y última
fase registrada, listo para copiar al abrir o cerrar una fase.

**Protocolo de cierre de fase (establecido en FASE 26):** toda fase de este
plan termina con **al menos un verificador en verde (exit 0)** —citado en su
fila— y **una línea nueva en esta tabla**. Una fase sin verificador o sin fila
no se considera cerrada. Si el verificador de cierre sale en rojo por deriva
legítima (p. ej. archivos nuevos en `tools/`), se regenera el inventario
congelado en la misma fase antes de commitear.

## Tabla de avance

| Fase | Fecha (cierre, UTC) | HEAD base | HEAD cierre | Estado | Entrega / verificación |
|---:|---|---|---|---|---|
| 1 | 2026-10-15 04:09:54 | `d6e4b3e2` | `9cb35fd5` | OK | `npm test` completo exit 0: 76 258 aserciones, 0 fallos, 0 verificadores en rojo; línea base anotada en `docs/ESTADO_CONGELADO.md`. |
| 3 | 2026-10-15 04:12:16 | `9cb35fd5` | `49c8620e` | OK | Inventario congelado regenerado: 5417 archivos hasheados (Data 5215 + Scripts 0 + tools 202), `--verify` exit 0 sin desviaciones. |
| 4 | 2026-10-15 04:13:20 | `49c8620e` | `5eaacdc2` | OK | `inventario_congelado --verify` exit 0: rango reservado (switches 701–867, variables 101–263) libre en su porción no asignada. |
| 5 | 2026-10-15 04:15:03 | `5eaacdc2` | `84cf10a6` | OK | Backup ZIP rehecho con `tools/backup.py`: 3530 entradas (3529/3529 de `Data/`, `Scripts.rxdata` incluido), integridad `testzip` OK. |
| 6 | 2026-10-15 04:16:28 | `84cf10a6` | `7f37430f` | OK | Regla de oro reafirmada en `docs/ESTADO_CONGELADO.md`: nada original se edita, todo entra por IDs nuevos y aditivos. |
| 7 | 2026-10-15 04:19:29 | `7f37430f` | `40c09369` | OK | `tools/plan900/orden_instalacion.sh` con el orden obligatorio (multiversal → canon Arceus → eras → restauración → dimensiones → rocket → circuito → ambience → wild); `--verify` exit 0 con 9/9 verificadores en verde. |
| 8 | 2026-10-15 (este commit) | `40c09369` | `1d124acb` | OK | Creado este registro de avance en `tools/plan900/` más el medidor `avance.sh`; fases 1–7 reconstruidas con fechas y hashes reales de `git log`. |
| 9 | 2026-10-15 (este commit) | `1d124acb` | `33b14e03` | OK | Censo real con `analyze_compiled_fire_ash.mjs`: 3465 mapInfos / 3465 mapas leídos = **coincidencia exacta** con los 3465 `Map*.rxdata` del último recuento; sin desviación. |
| 10 | 2026-10-15 (este commit) | `33b14e03` | `7b076188` | OK | `npm run verify:ruby` exit 0 (18 secciones Ruby sin errores de sintaxis) y barrido zlib completo: **409/409 secciones de `Data/Scripts.rxdata` descomprimidas sin error**. |
| 11 | 2026-10-15 (este commit) | `7b076188` | `f2feb86a` | OK | `npm run verify:salud` exit 0: **sin fallos graves**; 1 aviso (12 páginas automáticas sin espera) y hallazgos cosméticos documentados. Árbol sano antes de cualquier reescritura masiva. |
| 12 | 2026-10-15 (este commit) | `f2feb86a` | `f9433dcf` | OK | Fijada la tabla maestra de rangos en **`docs/qa/politica_ids.md`** (mapas 1–4419, switches 1–994, variables 1–354, self-switches A–E, trainer types 0–593) medida sobre datos reales. |
| 13 | 2026-10-15 (este commit) | `f9433dcf` | `f669d5ff` | OK | `npm run verify:defeats` exit 0: **sin anomalías** — 1702 batallas en 747 eventos, derrota permanente 691/747, revanchas solo opcionales por menú; ningún jefe del DLC deja estado inconsistente tras la primera victoria. |
| 14 | 2026-10-15 (este commit) | `f669d5ff` | `9edfc3ef` | OK | `npm run verify:event-collision` exit 0 (eventos con sprite sólidos aunque estén Through, interacción conservada) y `npm run verify:save-path` exit 0 (ajustes auxiliares junto a `Game.rxdata`, sin `Errno::ENOENT`). Sin colisiones ni rutas de guardado rotas. |
| 15 | 2026-10-15 (este commit) | `9edfc3ef` | `a23851f7` | OK | Congelados los **17 mapas del DLC y su música** en `docs/qa/mapas_dlc_musica.md`: tabla única con BGM real de disco (17/17 = plan, archivos existentes, 100/100) y prefijos SHA-256 de cada mapa. |
| 16 | 2026-10-15 (este commit) | `a23851f7` | `3bc3ba31` | OK | Inventario de eventos `PokeMod*` en **`content/plan900_inventario_eventos.json`**: 13 734 eventos en 1887/3465 mapas, con desglose por prefijo (Campaña ROM 12 379, Tier3 420, Tier2 240, Tier1 200…). Herramienta reproducible `tools/plan900_inventario_eventos.mjs`. |
| 17 | 2026-10-15 (este commit) | `3bc3ba31` | `11ec6f5c` | OK | **500/500 eventos `Horizonte N:` intactos** en los 20 mapas (1001–1020, 25 por mapa): coincidencia exacta catálogo↔disco en mapa, eventoId (slot+99) y nombre — **sin corrimiento de índices**. Nota: el `--verify` propio de la expansión falla por expectativa desfasada (44 vs 56 transferencias), preexistente y fuera de `npm test`. |
| 18 | 2026-10-15 (este commit) | `11ec6f5c` | `4402afaa` | OK | **Atlas Mil confirmado**: 1000/1000 mapas 1021–2020 en disco y en MapInfos; 40/40 anclas Tier 1 (mapas 1021–1996 cada 25, switches 708–747 todos `POKEMOD ATLAS SEAL*`, variable 103 compartida, decisiones 104–143) con Conductor + NPCs instalados. |
| 19 | 2026-10-15 (este commit) | `4402afaa` | `9381446d` | OK | **Dimensional Nightmare confirmado**: 151/151 mapas 2040–2190 en disco y MapInfos; NEXO 2136–2140 **5/5** y Liga Oscura 2141–2142 **2/2** (subconjuntos, no suman). `dn:liga:verify`, `dn:events:verify` y `dn:flags:verify` exit 0; `dn:maps:verify` no ejecutable por el límite conocido de tiles purgados (DLC_TOTAL §9). |
| 20 | 2026-10-15 (este commit) | `9381446d` | `22a5331f` | OK | **Auditadas las 24 puertas original→extra**: 22/24 tras **429** (19) o la **cadena Volus 870→duelo→873** (3 del Guardabosques, con misión Hypno 701/703); las 2 restantes sin condición son por diseño documentado (portal de la Ruta de Dios con recuperación de flag, y Salón de Diplomas en la casa de Ash). |
| 21 | 2026-10-15 (este commit) | `22a5331f` | `c869da87` | OK | **DLC inalcanzable antes de derrotar a Arceus**: `arceus_scope_map --audit` exit 0 (R15b RutaDeDios 280 defs y CanonArceus 48 defs) y audit warp a warp de los 17 mapas DLC: 34 entradas, **0 desde mapas originales**, todas vía Puerto Horizonte con **873** o intra-DLC. |
| 22 | 2026-10-15 (este commit) | `c869da87` | `595c5f61` | OK | Listado cada warp condicionado en **`docs/qa/puertas_postgame.md`**: las 24 puertas original→extra con su switch, los warps gated del hub 1001 (873/876/706/704), gimnasios (960–964, 970–976) y leyenda de switches. |
| 23 | 2026-10-15 (este commit) | `595c5f61` | *(este commit)* | OK | Marcados los **huecos reales** en `docs/AUDITORIA_TOTAL_FLAGS.md`: switches consumibles 949, 958, 959, 965–969, 978–989 (20) y variables 308, 309, 323–329, 334–340, 349 (17); 12 switches y 5 variables "libres aparentes" resultaron reservados (constantes RutaDeDios/CanonArceus y registro DN); recomendación: crecer por 995+/355+. |
| 24 | 2026-10-15 (este commit) | `91d15cbc` | `f64cbcf2` | OK | **Definido el prefijo `POKEMOD 900 `** para todo switch/variable del plan (sección en `docs/qa/politica_ids.md` + regla de consumo en la auditoría): asignación solo en ≥995/≥355 o huecos reales, nombre obligatorio, prefijo verificado libre (0 colisiones). |
| 25 | 2026-10-15 (este commit) | `f64cbcf2` | `ad37649a` | OK | **Sin colisiones** entre lo usado (887 switches, max 994; 293 variables, max 354) y el rango a consumir (≥995/≥355 + 20/17 huecos): 8/8 comprobaciones en verde, incluida ausencia del prefijo `POKEMOD 900` y no solapamiento con el rango reservado. |
| 26 | 2026-10-15 (este commit) | `ad37649a` | `f8b4866a` | OK | **Establecido el protocolo de cierre** (verificador en verde + fila nueva, fijado en las convenciones de este registro). Su primera aplicación cazó deriva real: inventario regenerado a **5421 archivos (Data 5215 + tools 206)** y `inventario_congelado --verify` exit 0. |
| 27 | 2026-10-15 (este commit) | `f8b4866a` | `bfcaee77` | OK | Creado **`tools/plan900/checkpoint.mjs`**: valida numeración (hueco 2 documentado), verificadores citados por fila (excepciones históricas 6 y 23) e integridad de backups ZIP en un solo comando. Ejecución exit 0: 25 fases, 25/25 verificadores, 1 backup íntegro (19,5 MB). |
| 28 | 2026-10-15 (este commit) | `bfcaee77` | `4ecdccb5` | OK | Añadido **`npm run plan900:check`** al `package.json` y paso «Auditoría de avance del plan 900» al workflow de CI. Ejecución exit 0 (26 fases, 26/26 verificadores, backup íntegro). Checkpoint ajustado: 0 ZIP en CI = advertencia, no error (`PokeModBackups/` está gitignored). |
| 29 | 2026-10-15 (este commit) | `4ecdccb5` | `b5c8c37d` | OK | Creado **`docs/qa/rollback.md`**: las 3 capas de restauración (git / ZIP de backup.py / originales por instalador), procedimiento quirúrgico y total con comandos exactos, y mapa completo de 42 carpetas de `PokeModBackups/` con sus 38 scripts npm. Verificador propio en verde: carpeta a carpeta contra constantes reales de `tools/`. |
| 30 | 2026-10-15 (este commit) | `b5c8c37d` | `c5f6ba42` | OK | Creado **`tools/plan900/verificar_originales.mjs`** y confirmado: **3465/3465 mapas existentes tienen original** en `backup_20261015_041420.zip` (snapshot virgen: 0 diferencias de CRC), y los 6534 IDs libres donde el plan creará mapas nuevos están sin archivo (no requieren original, sin colisiones). exit 0. |
| 31 | 2026-10-15 (este commit) | `c5f6ba42` | *(este commit)* | OK | **`npm run kirin_check`** añadido (envuelve `tools/kirin_check.py`) y ejecutado: **0 errores, 3 avisos**. Anotados en **`docs/qa/kirin_check.md`**: 0 archivos `.rgssad` (juego extraído) y las **14 colisiones de mayúsculas** (pares `.PNG`↔`.png` en `Graphics/Tilesets/`, idénticos 14/14 byte a byte, referenciados sin extensión). Regla: el plan no crea assets que colisionen por case. |
| 32 | 2026-10-16 (este commit) | `e9a87880` | *(este commit)* | OK | **Cerrado el hallazgo bloqueante de la FASE 39**: fuera el `end` sobrante (línea 710, `end\r\n`) de la sección «Grandeur Club» en `pokemon_fire_ash/Data/Scripts.rxdata` — 56 837 → 56 832 caracteres, sección ahora idéntica byte a byte a la de `Scripts_corregido/`. Copia previa en `PokeModBackups/grandeur_club_end_originals/` y volcado Marshal quirúrgico verificado (409 secciones, ids y títulos intactos, 1 sola sección distinta). Causa raíz corregida en `apply_emergency_abra_and_free_tower.mjs`: el regex que contaba cuatro `end` se sustituye por reemplazo estructural hasta el `end` de columna 0 (`tools/lib/ruby_method_patch.mjs`). Nuevo verificador `npm run verify:ruby:full` (`tools/qa/ruby_syntax_full_check.mjs`) compila **todas** las secciones de los cuatro paquetes: antes 322/323 en el juego (exit 1, «Grandeur Club» línea 710), ahora **1293/1293 · exit 0**. Verificación: `verify:ruby:full` exit 0 · `verify:grandeur:end` exit 0 · `verify:grandeur:end:selftest` 8/8 · `verify:ruby` 18/18 · `verify:abra:tower` exit 0 · `external_authoring.test.mjs` 110 OK 0 fallos · `test:atlas:master` 76 258 pruebas · `verify:corregido:zip` y `verify:presupuesto` en verde (el ZIP no cambia). Documentado en `docs/REPARACION_GRANDEUR_CLUB_END.md` y actualizado `docs/DEFINICION_DE_TERMINADO_SCRIPTS.md`. Rojo preexistente ajeno a esta fase, medido igual en un worktree limpio de `e9a87880`: `verify:mapa_terminado` (hallazgo `DN-SALVAJES-DECLARADOS` sin confirmar, 15 mapas frente a 14 declarados) detiene `npm test` en el paso 38 de 40; los 37 anteriores en verde y los 2 posteriores ejecutados por separado, también en verde. |
