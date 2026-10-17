# Pulido universal — antes y después de FASE 019

## Antes

El repositorio no tenía un único informe reproducible que aplicara los diez
puntos de mapa al juego completo. Había verificadores especializados de mapas,
warps, música y eventos, pero sus salidas no compartían un esquema.

## Después

`tools/plan2700/checklist_mapa.mjs` y `tools/plan2700/audit_warps.mjs` forman una
puerta de lectura común:

- censo: **3465 mapas** del `MapInfos.rxdata` que tienen archivo;
- transferencias: **19064** comprobadas;
- destinos/coordenadas inválidos: **0**;
- tileset fuera de rango: **0**;
- páginas autorun/paralelas sin una orden estructural de liberación: **0**;
- mapas sin eventos: **17**, marcados `review`, no ocultados;
- celdas aisladas: **2243 mapas** quedan `review` para inspección de perfil,
  mientras 1222 pasan el umbral heurístico del 95 %;
- simetría, recodos, motivos, costuras y sensación de legibilidad quedan
  `manual/review` por diseño.

No se afirma que los 3465 mapas estén visualmente perfectos. Se cierra la
infraestructura de medición y se conserva la lista priorizable en
`content/plan2700_checklist.json`. Corregir mapas sin un render/partida
reproducible sería inventar cambios, especialmente en contenido original de
Fire Ash.

## Comandos

```text
npm run audit:plan2700:mapas
npm run audit:plan2700:warps
npm run verify:plan2700:mapas
```
