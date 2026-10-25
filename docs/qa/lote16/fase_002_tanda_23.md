# FASE 002 — tanda 23 (líneas 2200–2299 de `tareas.txt`)

Carril de playtest real: sesiones 2–52, registro de cobertura, clasificación de hallazgos
y puerta de regresión. Tareas **2196–2295**.

Reproducir: `npm run playtest:guion && npm run audit:plan2700:tanda23` ·
Verificar: `npm run verify:playtest:guion && npm run verify:playtest:regresiones && npm run verify:plan2700:tanda23`
Artefacto: [`content/plan2700_tanda23.json`](../../../content/plan2700_tanda23.json)

## Lo que ya estaba (y no se rehizo)

Las 60 carpetas `docs/qa/playtest/sesion-NN` y su ficha `manual_pending` existen desde las
fases 022/023 del plan, y `tools/plan2700/lote5_fase023_playtest.mjs` ya inventaría las
sesiones 6–60 con su inventario estático. Esta fase no las reescribe: las engancha a un
guion con cuota medible y a una puerta de regresión.

## Veredicto de las 100 tareas

`instrumentado` 74 · `manual (playtest)` 26 · `hallazgo` 0.

`instrumentado` es un estado propio y no un PASS disfrazado: el instrumento existe, está
medido y verificado, pero el hecho que la tarea pide comprobar exige una persona jugando.
Las 26 tareas manuales son exactamente eso —«verificar que ninguna fuga de memoria arruine
una partida de cuatro horas», «que la niebla no tape la interfaz de combate»— y no se
pueden cerrar leyendo el repositorio.

## Lo que se añadió

| Pieza | Para qué |
|---|---|
| `tools/plan2700/playtest_guion.mjs` → `content/plan2700_playtest_guion.json` | Guion de 60 sesiones: **32 de contenido** con cuota y 28 de soporte sin cuota (interfaz, mando, Android, editor, estrés, rendimiento, compatibilidad, cierre). |
| `docs/qa/playtest_guion.md` | El guion legible, sesión por sesión, con mapas, eventos y cajas que le tocan. |
| `docs/qa/playtest_cobertura.md` | Registro que separa **indexado** (lo que el repo mide) de **ejercido** (0 hoy), con el reparto por dimensión. |
| `tools/qa/playtest_regresiones.mjs` | Puerta de regresión: todo hallazgo `bloqueante`/`grave` en estado `corregido` exige prueba `.mjs` existente; `--selftest` demuestra los siete casos. |

## La cuenta de la cuota

El universo es el contenido **con texto de jugador**: 1 883 mapas, 13 696 eventos con cajas
y 19 801 cajas. Cada dimensión recibe una fracción por sesión y el generador exige que las
fracciones sumen exactamente 1; el redondeo se ajusta en la última sesión, así que la suma
de cuotas coincide con el total —1 883 / 13 696 / 19 801— sin «casi». Si mañana entra
contenido nuevo en una dimensión y nadie lo reparte, `verify:playtest:guion` falla.

Las 28 sesiones de soporte no consumen cuota a propósito: contarlas dos veces inflaría la
cobertura sin haber jugado nada nuevo.

## Estado real

`manual_pending`. No hay fecha, duración, capturas ni hallazgos porque nadie ha jugado. La
puerta de regresión pasa con 0 hallazgos y lo dice con ese número, no con un icono verde:
el día que una ficha declare un hallazgo grave corregido, o trae su prueba o el build cae.

## Límite

Se mide y se instrumenta; no se simula. Ni el guion ni el registro de cobertura sustituyen
una partida: reparten el trabajo para que la partida, cuando ocurra, sea comprobable.
