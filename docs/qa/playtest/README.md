# Playtest LOTE 5

Este directorio contiene fichas de sesiones del plan. Cada ficha debe
registrar fecha, commit/version, entorno, duración, mapas, eventos, diálogos,
hallazgos numerados, capturas y tasa de descubrimiento.

`manual_pending` significa que el guion está preparado pero aún no existe una
corrida humana o un binario ejecutado en ese entorno. No equivale a PASS.

## Registro inicial

- FASE 022: sesiones 1–5, arranque, guardado previo y duelo de Arceus.
- FASE 023: sesiones 6–60, postgame, dimensiones, campañas, estrés y cierre.

## Plantilla de hallazgo

```text
ID:
Sesión:
Gravedad: bloqueante | grave | leve | cosmético
Mapa/evento:
Pasos para reproducir:
Esperado:
Observado:
Evidencia:
Regresión añadida:
Estado: abierto | corregido | verificado
```

## Ficha de sesión (LOTE 2)

Campos obligatorios de cada ficha (definición de la tarea 2193):

- `fecha`, `version_commit`, `duracion_minutos`, `entorno`;
- `guardado_inicial`, `mapas_visitados`, `eventos_ejecutados`, `dialogos_mostrados`;
- `hallazgos` numerados con gravedad, `capturas`, `tasa_descubrimiento`.

El volcado `content/lote5_fase022_playtest.json` declara exactamente estos
campos para las sesiones 1–5 y `content/lote5_fase023_playtest.json` para las
sesiones 6–60. Fichas sin ejecutar quedan en `manual_pending`.
