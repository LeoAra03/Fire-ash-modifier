# Cierre FASE 017 — Liga Oscura, emisiones y Ruta de Dios

La tanda cubre los IDs **1600–1699** con evidencia reproducible y separa las
pruebas estáticas de los recorridos que requieren una ROM abierta.

## Entregables

- `tools/plan2700/audit_fase017.mjs`: auditor de la condición del Diploma,
  sellos 940–946, cierre 948, siete emisiones, fauna de Monte Silver y mapas
  2030–2038.
- `content/plan2700_fase017_audit.json`: salida congelada de la medición.
- `docs/qa/regiones/liga_oscura.md` y
  `docs/qa/regiones/ruta_de_dios.md`: actas con condición real y límites.
- `docs/qa/fichas/liga_oscura.md`: ficha visual basada en Map2192/2193.

## Medición

| Área | Resultado estático |
|---|---:|
| Sellos de emisiones | 7, 940–946, nombrados |
| Arena de Liga | Map2193, evento final único |
| Cierre de Liga | switch 948, escritura presente |
| Diploma | Map2288, condición switch 948 |
| Emisiones | 7 guardianes, 7 retornos, tablas salvajes presentes |
| Ruta de Dios | Map2030–2038, 7 objetos de piso, límites válidos |
| Verificadores de Arceus | en verde |

## Comandos ejecutados

```text
node tools/plan2700/audit_fase017.mjs --json
npm run verify:diplomas
npm run verify:multiverse
npm run verify:wild
npm run verify:defeats
npm run verify:ruta_de_dios
npm run verify:arceus:cinematics
npm run verify:arceus:sprites
npm run verify:arceus:recursos
npm run verify:arceus:actions
npm run verify:arceus:moves
```

Todos terminaron con código 0. El auditor deja como advertencias honestas la
partida real, la escucha, el caminante y la ampliación creativa de cada emisión
a 2–3 mapas; esos puntos no se convierten en evidencia inventada.
