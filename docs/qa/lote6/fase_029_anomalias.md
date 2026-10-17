# Anomalías de mapas y criterio de cierre (FASE 029)

## `Map341 2.rxdata` y `Map813b.rxdata`

- No coinciden con `Map<dígitos>.rxdata`.
- No tienen entrada en `pokemon_fire_ash/Data/MapInfos.rxdata`.
- No son destinos de transferencias válidas del censo.
- No se incluyen en el recuento de 3.465 mapas ni en los ZIP de entrega.

**Decisión:** cuarentena y exclusión (`quarantine_and_exclude`). La cuarentena
es una decisión de auditoría, no una eliminación: los archivos siguen locales
para poder comparar o restaurar si aparece una fuente legítima. Para retirarlos
físicamente hace falta una fase de limpieza con prueba de regresión de
`MapInfos`, referencias y paquetes.

## Qué se verifica después de una limpieza

```bash
node tools/plan2700/lote6_fase029_cobertura.mjs --verify
node tools/inventario_congelado.mjs --verify
npm run verify:package
npm run verify:corregido:zip
```

El número de archivos `Map<dígitos>.rxdata` y el número de entradas válidas de
`MapInfos` deben seguir coincidiendo. Si no coinciden, la limpieza falla y no se
publica.

## Otros hallazgos no silenciados

El mismo JSON lista 100 llegadas sólidas, 3.450 retornos no declarados, cuatro
elecciones con menos ramas y flags sin escritor. No se convierten en
«excepciones» sin una reproducción, una corrección y una regresión documentada
en `docs/qa/defectos.md`.
