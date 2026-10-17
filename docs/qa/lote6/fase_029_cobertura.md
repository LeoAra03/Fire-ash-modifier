# FASE 029 — cobertura estructural y límites de instrumentación (IDs 2800–2899)

## Auditoría reproducible

```bash
npm run audit:plan2700:fase029
npm run verify:plan2700:fase029
```

La auditoría recorre los datos reales, no una muestra:

- 3.465 mapas y 5.493.642 celdas de mapa;
- 36.149 eventos y 55.501 páginas;
- 5.208 elecciones, 10.773 opciones y 11.008 ramas estructurales;
- 33.862 condiciones, 874 switches, 240 variables y self-switches por evento;
- 38.996 comandos de script, 8.444 rutas de movimiento y 7.838 esperas;
- 19.064 transferencias y 680 combates reconocibles por comando;
- 447 tablas y 3.885 slots de encuentros.

Las cifras salen de `content/lote6_fase029_cobertura.json`. «Indexado» significa
que cada unidad descubierta tiene una fila en el ledger. «Ejercitado» permanece
`runtime_pending` hasta que un adaptador del motor ejecute la rama; no se afirma
una cobertura de juego 100 % por contar estructuras.

## Decisiones de datos fuera de norma

`Map341 2.rxdata` y `Map813b.rxdata` no tienen entrada en `MapInfos` ni aparecen
en el grafo runtime. Se decide `quarantine_and_exclude`: se conservan para una
reversión local, no se renombran ni se borran en una fase automatizada y se
excluyen de los paquetes de entrega. El recuento bruto y real de mapas coincide
(3.465) después de no incluir esos nombres como mapas válidos.

La auditoría no encuentra tablas corruptas, tiles fuera del tileset ni
autotiles ausentes. Sí deja visibles 100 llegadas que la comprobación de
pasabilidad marca sólidas, 3.450 aristas sin vuelta declarada, 4 elecciones con
una rama estructural menos y 8 flags que solo se leen. Son colas de reparación,
no un PASS oculto; se deben reproducir antes de cerrar.

## Familias cubiertas

El informe divide mapas, eventos, diálogos, elecciones, condiciones,
transferencias, combates, movimiento, esperas, scripts y celdas por familia y
registra `candidate`, `indexed` y `exercised`. Las ramas verdadero/falso,
resolución de cada opción, doble sentido de cada transferencia, colisión de
escalera, audio, clima, visual y Android necesitan el harness/runtime descrito
en `docs/qa/harnesses.md`.

## Estado

`static_pass_runtime_pending`: la lectura y el inventario estructural son
reproducibles; no se declara que 5,49 millones de celdas hayan sido caminadas,
que todas las ramas se hayan jugado ni que las escenas hayan sonado. Las
referencias de flags sin escritor, llegadas sólidas y elecciones incompletas
siguen en el JSON para que la siguiente corrección tenga una regresión concreta.
