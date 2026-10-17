# Acta final de cierre — definición operativa y límites

## Qué significa cerrar

En este proyecto, cerrar significa que no queda ningún defecto **conocido y
abierto dentro del alcance que se haya probado**, con reproducción, corrección,
regresión y reverificación enlazadas. No significa que sea imposible que exista
un defecto desconocido. La palabra «perfecto» no es un criterio de entrega y no
se usa para sustituir C1–C5.

## Estado de los cinco criterios

| Criterio | Evidencia estática | Estado real |
|---|---|---|
| C1 — cobertura completa del registro | Censo de mapas/eventos/celdas y comparación con el objetivo declarado | pendiente; el censo observado no se convierte en cobertura jugada |
| C2 — registro de defectos vacío | `docs/qa/defectos.md` conserva pendientes de audio, DN, Kirin, Atlas y playtest | no satisfecho |
| C3 — fuzz, cortes y límites | FASE 031: semillas, mutaciones, límites y cortes del modelo atómico | `static_pass_runtime_pending` |
| C4 — tres rondas ciegas | Protocolo y fichas preparadas, sin rondas observadas en este checkout | `manual_pending` |
| C5 — suite/CI/clon/equipo independiente | `verify:all` necesita las fuentes autorizadas de Dimensional Nightmare; faltan clon limpio, CI y otro equipo | bloqueado/manual_pending |

No se marca C1–C5 simultáneamente como PASS.

## Paquete y hash

`content/lote7_fase036_cierre_final.json` enumera el tamaño y SHA-256 de cada
ZIP requerido que existe en este checkout. El hash solo se puede llamar
publicado cuando una copia accesible al jugador coincide byte a byte y ha sido
instalada en una máquina limpia. `frozenAt`, versión de publicación y firma
humana permanecen pendientes deliberadamente.

## Instalación y partida de cierre

La instalación limpia, el arranque de `Game.exe`, la partida de cierre, las
tres rondas ciegas, Android/Kirin, otra máquina y el 100 % del contenido
visitable necesitan un entorno que no está disponible aquí. No se sustituyen
por el censo de mapas ni por el resultado de Node.

## Texto, créditos y legal

La entrega debe decir que es un fangame no oficial, distinguir contenido
adaptado de contenido creado, conservar créditos de arte/scripts y no atribuir
trabajo ajeno. Los archivos a revisar son `README.md`, los LEEME de los
paquetes, `pokemon_fire_ash/Credits.txt` y `docs/qa/creditos_arte.md`.

Las palabras «próximamente», «bloqueado para siempre» y las promesas de
perfección requieren contexto y revisión; la auditoría lista coincidencias sin
confundir una frase narrativa con una promesa pública. Todo contenido mostrado
como bloqueado necesita una condición de desbloqueo real y documentada.

## Reproducción

```bash
node tools/plan2700/lote7_fase036_cierre_final.mjs
node tools/plan2700/lote7_fase036_cierre_final.mjs --verify
```

El acta no firma una prueba humana ausente. Las correcciones posteriores deben
ser mínimas, tener regresión y no reabrir diseño salvo defecto bloqueante.
