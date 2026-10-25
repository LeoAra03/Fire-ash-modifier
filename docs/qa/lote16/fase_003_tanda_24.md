# FASE 003 — tanda 24 (líneas 2300–2399 de `tareas.txt`)

Cierre del playtest (acta y sesiones 54–60) y carril de rendimiento: presupuesto de
densidad por mapa exigido en CI, peso de las carpetas del juego, audio duplicado,
paquete/ZIP y peso del repositorio. Tareas **2296–2395**.

Reproducir: `npm run audit:rendimiento && npm run audit:plan2700:tanda24` ·
Verificar: `npm run verify:rendimiento:presupuesto && npm run verify:plan2700:tanda24`
Artefacto: [`content/plan2700_tanda24.json`](../../../content/plan2700_tanda24.json)

## Veredicto de las 100 tareas

`verificado_auto` 18 · `instrumentado` 20 · `manual:playtest` 38 · `manual:hardware` 20 ·
`manual:audio` 4 · `hallazgo` 0.

Los carriles manuales se separan a propósito: no es lo mismo «falta jugar» que «falta el
dispositivo» o «falta escuchar». Los 8 hallazgos que aparecieron a mitad de la tanda se
cerraron con la pieza que faltaba (acta, documento, presupuesto en CI, verificadores del
paquete) o se declararon como deuda con dueño; ninguno se quedó abierto sin nombre.

## Lo que se añadió

| Pieza | Para qué |
|---|---|
| `tools/qa/rendimiento_presupuesto.mjs` → `content/plan2700_rendimiento.json` | Mide 3 465 mapas, 36 149 eventos, 2 129 eventos automáticos, peso de `Data`/`Graphics`/`Audio`, 332 grupos de audio duplicado y archivos versionados >20 MiB. `--selftest` prueba la regla del presupuesto aislada de la medición. |
| `docs/qa/rendimiento_presupuesto.md` | Acta por mapa: techos, excesos declarados y el evento que concentra cada exceso. |
| `docs/qa/rendimiento.md` | Reescrito: cifras estáticas vigentes + tabla de lo que exige hardware. |
| `docs/qa/playtest_acta.md` | Acta de las 60 sesiones, **SIN FIRMAR**, con el criterio de firma y la puerta que lo comprueba. |
| `docs/qa/recuperacion_partida.md` | Protocolo de recuperación de `Game.rxdata` con paso de copia previa y qué no hacer. |
| Auditoría de sprites dentro de `fase_003_tanda_24.mjs` | 35 343 referencias de sprite de evento contra 4 172 archivos de `Graphics/Characters`: 0 ausentes, con `invisible` reconocido como centinela documentado. |
| `tools/generate_arceus_omega_qa_matrix.mjs` + verifier | El corpus de QA pasa a versionarse comprimido: **3,88 MiB** en vez de 62,46 MiB, con `--verify` de bytes contra el generador. |

## El presupuesto, con la definición correcta

RPG Maker XP codifica el disparador de página como 0 acción, 1 toque del jugador, 2 toque
del evento, **3 autorun** y **4 paralelo**. Sólo 3 y 4 corren sin que el jugador haga nada,
y un evento ejecuta **una** página a la vez: la cota de procesos simultáneos es el número de
**eventos** con página automática (2 129), no el de páginas (2 272) ni el de páginas de
contacto (6 836, que no son procesos).

Con esa definición, el mod no tiene ningún mapa por encima del techo de procesos: los 12
eventos automáticos de Vermilion City (mapa 108) son el máximo y son del juego base. Los 8
mapas por encima del techo de 60 eventos sí se declaran: 2 del juego base (heredados, no se
recortan sin partida) y 6 del mod (Puerto Horizonte, Mt. Stratus y cuatro mapas de Unbound),
todos con **cero** páginas automáticas — el coste es de contenido hablable, no de fotogramas.
La puerta falla si aparece un noveno exceso sin justificación escrita.

## Repositorio

El único archivo de más de 20 MiB que no era un entregable era el corpus de QA de Arceus
Omega (62,46 MiB de JSONL). Comprimido y verificado byte a byte contra su generador baja a
3,88 MiB; el repositorio pasa de 1 578,54 a **1 516,08 MiB** y los dos únicos archivos sobre
el techo son los ZIP de entrega, declarados en `content/artifact_budget.json`.

## Audio

332 grupos de archivos idénticos (831 archivos). **No se borra ninguno**: 17 grupos tienen
algún nombre referenciado y el resto podría cargarse por nombre construido. El ahorro
posible (11,81 MiB) queda medido y con dueño; el recorte exige una sesión que escuche el
juego. Las 4 referencias sin archivo (`BGM/002-Battle02`, `BGM/Team Rocket OW`,
`BGM/secrettitan`, `SE/Thunder8`) se declaran en el acta: son silencios reales heredados del
juego base, no un falso positivo.

## Estado real

Nada de esta tanda se cierra jugando: el acta sigue **sin firmar**, el arranque, la memoria,
la tasa de refresco y el audio pendiente de hardware o de oído. Lo que sí queda cerrado es
la parte que se puede medir —y ahora se mide sola en cada push, con el número a la vista.
