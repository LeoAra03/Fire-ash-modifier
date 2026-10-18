# FASE 043 — Eventos en página final con estado avanzado (tramo 4200–4299)

## Reproducción

```bash
node tools/plan2700/lote9_fase043_eventos_final_2.mjs
node tools/plan2700/lote9_fase043_eventos_final_2.mjs --verify
```

## Alcance y resumen medido

- **Tareas procesadas**: 100 (`4200–4299`, más líneas de borde `4196–4199` indexadas).
- **Mapas únicos cubiertos**: 1719 (rango `1562–4234`: «Atlas Mil», «Ruta de Dios + Silver», «Dimensional Nightmare», «Mapas nuevos del DLC» y «Campañas ROM»).
- **Eventos evaluados en su página final**: 16051 (2703 multipágina, 0 con condición de estado avanzado).
- **Banderas comprobadas**: lecturas `s=21`, `v=23`, `self=4` · escrituras `s=54`, `v=53`, `self=8` · IDs inválidos: **0**.
- **Salidas comprobadas**: 16051/16051 páginas cerradas con `code 0`, 9792 transferencias verificadas, **0** destinos inválidos, 126 páginas autorun/paralelas sin liberación en el tramo DN/Restauración (ya declaradas en `content/evento_terminado.json`).
- **Textos en página final**: 15332 bloques `101/401` y 38 mensajes de script, **0** caracteres corruptos (``).

## Desglose por familia declarada

| Familia | Tareas | Rango de mapas | Eventos (suma por tarea) | Páginas finales condicionadas | Transferencias | Bloques de texto |
|---|---:|---|---:|---:|---:|---:|
| Atlas Mil | 20 | 1562–2032 | 3100 | 0 | 1440 | 2981 |
| Ruta de Dios + Silver | 1 | 2032–2049 | 156 | 0 | 42 | 70 |
| Dimensional Nightmare | 9 | 2049–2220 | 1420 | 0 | 318 | 907 |
| Mapas nuevos del DLC | 2 | 2220–3014 | 319 | 0 | 145 | 318 |
| Campañas ROM | 68 | 3014–4234 | 11056 | 0 | 7847 | 11056 |

## Límite honesto

Este verificador comprueba los datos compilados (`Map*.rxdata`, `MapInfos.rxdata`, `System.rxdata`) en la página final de cada evento inyectando las condiciones de estado avanzado. Las páginas autorun de Dimensional Nightmare (`EVENTO-AUTORUN-SIN-SALIDA`) se reportan sin ocultarlas; la corrida en vivo dentro de `Game.exe` permanece como `runtime_pending`.
