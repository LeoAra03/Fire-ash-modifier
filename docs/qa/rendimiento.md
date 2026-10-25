# Rendimiento — lo medido y lo que falta

Dos capas, y no se mezclan: lo que se puede reproducir desde el checkout (esta
página) y lo que exige hardware (la tabla final). Ninguna cifra de aquí es un
benchmark de FPS.

## Medición estática vigente

La fuente es `content/plan2700_rendimiento.json`, generada y verificada por:

```text
node tools/qa/rendimiento_presupuesto.mjs            # escribe artefacto + acta
node tools/qa/rendimiento_presupuesto.mjs --verify   # comprueba que sigue al día
node tools/qa/rendimiento_presupuesto.mjs --selftest # prueba la regla del presupuesto
python3 tools/kirin_check.py pokemon_fire_ash        # entorno Android/Kirin
```

| Métrica | Valor |
|---|---:|
| Mapas compilados | 3 465 |
| Eventos | 36 149 |
| Páginas de evento | 55 501 |
| Eventos con página automática (autorun o paralela) | 2 129 |
| Páginas automáticas | 2 272 (2 260 autorun + 12 paralelas) |
| Mapas con huella del mod | 1 887 |
| `Data` | 109 912 019 bytes (104,82 MiB) |
| `Graphics` | 87 545 954 bytes (83,49 MiB) |
| `Audio` | 471 932 397 bytes (450,07 MiB) |
| Archivos de audio | 4 652 · 0 de cero bytes |
| Grupos de audio duplicado exacto | 332 (831 archivos; 17 grupos con algún nombre referenciado) |
| Referencias de audio sin archivo | 4 (`BGM/002-Battle02`, `BGM/Team Rocket OW`, `BGM/secrettitan`, `SE/Thunder8`) |
| Repositorio versionado | 1 516 MiB (medido al cerrar la tanda 24) · 2 archivos sobre 20 MiB |

El detalle por mapa — techos, excesos declarados y por qué cada uno los supera —
está en [`rendimiento_presupuesto.md`](rendimiento_presupuesto.md). La auditoría
histórica del carril (FASE 024) sigue en `content/lote5_fase024_performance.json`.

## Definiciones que importan

- Un **proceso automático** es una página *autorun* (trigger 3) o *paralela*
  (trigger 4). Las páginas 0/1/2 (acción, toque del jugador, toque del evento)
  esperan a que el jugador haga algo: no cuestan fotogramas mientras no se tocan.
- Un evento ejecuta **una página a la vez**, así que la cota de procesos
  simultáneos es el número de eventos con página automática, no el de páginas.
- Los eventos de contacto (triggers 1 y 2) suman 6 836 páginas; **no** son
  procesos automáticos y por eso no entran en el presupuesto.

## Audio: duplicados y referencias

332 grupos de archivos byte a byte idénticos. No se borra ninguno en esta fase:

- 17 grupos tienen algún nombre referenciado por un mapa o un evento: borrarlos
  rompería la referencia.
- 315 grupos no están referenciados por mapas ni por los literales de
  `Scripts.rxdata`, pero el motor puede cargar pistas por nombre construido; el
  recorte exige una sesión que escuche el juego. Ahorro medido: 11,81 MiB.

Las 4 referencias sin archivo vienen de mapas del juego base y quedan declaradas
en el artefacto: son silencios reales, no un falso positivo.

## Repositorio

El techo de 20 MiB deja hoy dos archivos por encima: los ZIP de entrega
(`Fire-Ash-Scripts-Corregidos.zip` 46,59 MiB y
`Scripts_corregido/Fire_Ash_Paquete_Directo.zip` 60,78 MiB), ambos declarados en
`content/artifact_budget.json` y reconstruibles con sus scripts. El corpus de QA
de Arceus Omega pasó a versionarse comprimido
(`content/arceus_omega_qa_matrix.jsonl.gz`: 3,88 MiB en vez de 62,46 MiB), con lo
que dejó de ser un archivo grande sin dueño.

## Pendiente de hardware (no medido aquí)

| Medición | Por qué no está | Dónde se anota |
|---|---|---|
| Tiempo de arranque con todo el DLC instalado | exige la máquina y la versión usadas | ficha de la sesión de arranque |
| Tiempo de carga del primer mapa de cada región | exige ejecutar el juego | fichas de sesiones por región |
| Uso de memoria en los mapas con más eventos | exige medir el proceso en caliente | sesión de estrés |
| Tasa de refresco en Android/Kirin | exige dispositivo | sesión de rendimiento |
| Bucle audible y mezcla de volumen del audio nuevo | exige escuchar | sesión de audio |
| Partida de cuatro horas, guardados dañados y tarjeta llena | exige jugar | sesión de cierre |
| Editor SAF, exportación/reimportación, permisos de escritura | exige dispositivo | sesión de editor |

Ninguna de estas filas se puede cerrar leyendo el repositorio, y por eso siguen
**pendientes**: la instrumentación está lista (presupuesto en CI, medición
reproducible, fichas de sesión), la corrida humana no.
