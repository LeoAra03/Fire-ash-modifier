# Registro de cobertura de playtest

Dos cifras distintas que no se pueden mezclar:

- **Indexado**: lo que el juego contiene y el repositorio ya mide (mapas, eventos, cajas,
  familias de prueba). Está aquí y es reproducible.
- **Ejercido**: lo que una persona ha jugado de verdad. Hoy es **0 en todo** porque no hay
  ninguna sesión ejecutada: el estado de las fichas es `manual_pending`.

El índice general está en `content/cobertura.json` con la semántica
`indexed_not_runtime_exercised`: tener una fila indexada no es haberla jugado.

## Índice del proyecto

| Familia | Candidatos | Indexado | Ejercido | Estado |
|---|---:|---:|---:|---|
| maps | 3465 | 3465 | 0 | runtime_pending |
| cells | 5493642 | 5493642 | 0 | runtime_pending |
| events | 36149 | 36149 | 0 | runtime_pending |
| dialogues | 57593 | 57593 | 0 | runtime_pending |
| battles | 5614 | 5614 | 0 | runtime_pending |
| choices | 5208 | 5208 | 0 | runtime_pending |
| conditions | 16931 | 16931 | 0 | runtime_pending |
| transfers | 19064 | 19064 | 0 | runtime_pending |
| scripts | 24130 | 24130 | 0 | runtime_pending |

## Cobertura por dimensión y quién la ejerce

| Dimensión | Mapas | Eventos con cajas | Cajas | Sesiones que la cubren | Cuota asignada (mapas/eventos/cajas) | Suma = total | Ejercido |
|---|---:|---:|---:|---|---|---:|---:|
| atlas | 583 | 884 | 4083 | 12, 13, 14 | 583/884/4083 | sí | 0 |
| base/dlc | 68 | 379 | 787 | 1, 2, 3, 4, 5, 6, 9, 10, 11, 15, 16, 24, 25, 26, 27, 28, 29, 30, 31, 32 | 70/385/806 | no | 0 |
| glazed | 111 | 1277 | 1395 | 17, 18 | 111/1277/1395 | sí | 0 |
| light_platinum | 19 | 175 | 209 | 19, 20 | 19/175/209 | sí | 0 |
| liquid_crystal | 432 | 4253 | 5096 | 21 | 432/4253/5096 | sí | 0 |
| nightmare/multiversal | 5 | 19 | 63 | 6, 7, 8 | 12/57/142 | no | 0 |
| tfoh | 245 | 2321 | 2847 | 22 | 245/2321/2847 | sí | 0 |
| unbound | 420 | 4388 | 5321 | 23 | 420/4388/5321 | sí | 0 |
| **Total** | **1883** | **13696** | **19801** | — | — | — | **0** |

La suma de cuotas de cada dimensión coincide con su total: el guion no deja contenido
sin sesión asignada. Comprobarlo es parte de `npm run verify:plan2700:tanda23`; si alguien
añade contenido nuevo a una dimensión y no lo reparte, la verificación falla.

## Cómo se rellena

1. Al terminar una sesión, anotar en su ficha los mapas visitados (ids), los eventos
   ejecutados (nombre de evento) y los diálogos mostrados (contador de cajas).
2. Volcar esas tres listas en la fila de la dimensión y sumar el ejercido.
3. Un hallazgo `bloqueante` se corrige el mismo día y lleva prueba de regresión
   (`npm run verify:playtest:regresiones`); uno `grave` se corrige antes de la sesión
   siguiente. `leve` y `cosmético` se agrupan por bloque.
4. No se marca PASS sin fecha, versión, duración y evidencia.
