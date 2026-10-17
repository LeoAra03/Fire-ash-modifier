# Atlas Mil — acta maestra QA (FASE 018)

## Censo real

- Mapas **1021–2020: 1000/1000**.
- Eventos instalados: **6410**, media **6,41 por mapa**, máximo **46**; no
  existe un mapa por encima de 60 eventos en el censo actual.
- 40 anclas Tier 1, con baliza, conductor, switch 708–747, narración y
  decisión persistente.
- Tier 2: 120 rutas autorales distribuidas en los blueprints macro02–07.
- Tier 3: 420 reglas compiladas; `verify:tier3:rules` informa 840 ecos con
  baliza y retorno, 420 desafíos y 420 reglas locales reversibles.
- Avenida del Circuito: Map2230 con portal, servicios, tablón, rivales,
  cuadrillas y las ocho puertas; gimnasios Map2250–2257.

## Lotes

Los 16 ficheros de `docs/qa/lotes/atlas_*.md` dividen honestamente los 1000
mapas en quince lotes de 63 y un lote final de 55. La especificación de tareas
menciona además un lote final de 40, pero 16×63+40 no cabe en 1000; no se
inventa un rango fuera de Atlas.

## Verificadores ejecutados

```text
npm run verify:atlas:repair
npm run verify:tier2:macro04-05
npm run verify:tier2:macro06-07
npm run verify:tier3:rules
npm run verify:atlas:tiles
```

Todos los comandos terminaron en código 0. `content/plan2700_fase018_audit.json`
congela el censo y lista las advertencias de recorrido manual.

## Límite

La transitabilidad estructural, los warps, los flags y la existencia de
recursos están cubiertos. La calidad de la silueta, la diferencia perceptiva
entre gimnasios, la dificultad y el ritmo necesitan una partida; ningún conteo
estático se presenta como sustituto.
