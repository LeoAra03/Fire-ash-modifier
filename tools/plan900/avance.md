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
| 10 | 2026-10-15 (este commit) | `33b14e03` | *(este commit)* | OK | `npm run verify:ruby` exit 0 (18 secciones Ruby sin errores de sintaxis) y barrido zlib completo: **409/409 secciones de `Data/Scripts.rxdata` descomprimidas sin error**. |
