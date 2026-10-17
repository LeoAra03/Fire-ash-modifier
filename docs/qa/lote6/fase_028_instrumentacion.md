# FASE 028 — harnesses e instrumentación (IDs 2700–2799)

## Entregables

- `tools/plan2700/harness_core.mjs`: replay aislado, bot caminante, ejecutor de
  eventos, oráculo de diálogos/estado, inyector, unión de cobertura,
  comparador de fotogramas, rutas, escenas, excepciones y idempotencia.
- `tools/plan2700/lote6_fase028_instrumentacion.mjs`: censo real del checkout,
  fixture sembrado y generador de evidencia.
- `content/lote6_fase028_instrumentacion.json`: contrato, conteos, anomalías y
  estado runtime.
- `content/cobertura.json`: índice consultable por familia y región.
- `docs/plan_generado/cobertura.html`: panel local sin dependencias externas.
- `docs/plan_generado/fases_pendientes.md`: cola reproducible.
- `docs/qa/harnesses.md` y `docs/qa/harnesses_prueba.md`: uso, límites y prueba
  de cinco fallos.

## Comandos ejecutados

```bash
npm run cobertura
npm run cobertura:plan
npm run cobertura:check
node tools/plan2700/harness_core.mjs   # el self-test se ejecuta desde el auditor
node tools/plan2700/lote6_fase028_instrumentacion.mjs --verify
```

La ejecución recorre `MapInfos` y los `Map<dígitos>.rxdata`, cuenta mapas,
celdas, eventos, páginas, diálogos, opciones, condiciones, flags,
transferencias, combates, movimientos, esperas y scripts, y enumera recursos
con nombre incorrecto o ausente. Las cifras se regeneran; no se escriben a
mano.

## Interpretación

El censo es `indexed_not_runtime_exercised`: `indexed` indica que una unidad
está en el inventario y `exercised` queda en cero hasta que un adaptador
headless/Game.exe la ejecute. Esto evita llamar «100 % cubierto» a un listado
estático. El fixture sí exige 5/5 fallos sembrados y cero falsos positivos.

Las anomalías de nombres (`Map341 2.rxdata`, `Map813b.rxdata` cuando están
presentes) quedan listadas para decisión. No se borran ni se renombran en esta
fase porque podría romper `MapInfos` o referencias históricas.

## Pendientes de runtime

- conectar el contrato de replay a un ejecutable autorizado;
- recorrer rangos en workers con registros atómicos y reanudables;
- capturar FPS/memoria/tiempo de escena en un entorno comparable;
- ejecutar en Android/Kirin y publicar el artefacto de CI;
- completar los cinco defectos en un mapa de prueba real y repetir sobre un
  mapa sano.

Estado: `static_pass_runtime_pending` si el censo no tiene errores de lectura.
