# Prueba de instrumentación sembrada (FASE 028)

## Fixture descartable

La corrida reproducible está integrada en:

```bash
npm run cobertura
npm run cobertura:check
```

`tools/plan2700/lote6_fase028_instrumentacion.mjs` construye un mapa pequeño
en memoria y no modifica `pokemon_fire_ash/`. Los estados de prueba viven en
`content/.harness-fixture/` solo durante la corrida y se pueden borrar sin
pérdida de fuente; el directorio está excluido de los entregables.

## Cinco fallos intencionados

| Caso | Semilla conceptual | Oráculo | Resultado esperado |
|---|---|---|---|
| Warp roto | destino `9902` no declarado | grafo de rutas | detectado con origen y destino |
| Caja vacía | texto `""` | oráculo de diálogos | detectado como `empty` |
| Flag sin lector | `FLAG_OK` solo se escribe | oráculo de estado/censo de flags | detectado como escritor sin lector |
| Colisión mal puesta | pared que divide la grilla | bot caminante | lista celdas inalcanzables |
| Recurso ausente | personaje/asset que no está en el índice | auditor de recursos | detectado, sin copiar un recurso parecido |

La evidencia JSON debe conservar `seededFaultsDetected: 5` y
`seededFalsePositives: 0`. Se prueba también una ruta sana (el fixture de
movimiento devuelve control y no escribe una partida real).

## Criterio de cierre

La prueba se considera **verde para el orquestador** si los cinco fallos se
detectan, el evento que lanza excepción devuelve el control, el replay queda
aislado y el resultado es reproducible byte a byte. Se considera
`runtime_pending` para el producto hasta repetirla con el adaptador del motor.
