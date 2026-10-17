# Plan de cobertura generado

Fuente: `tools/plan2700/lote6_fase028_instrumentacion.mjs`.

- 3465 archivos de mapa y 36149 eventos están indexados.
- El índice es reproducible; `exercised: 0` significa que falta el adaptador
  headless/Game.exe, no que se hayan omitido unidades.
- Ejecutar `npm run cobertura:check` después de cada cambio.
- Las referencias de mapa fuera de norma se tratan como defectos y no se
  silencian: Map341 2.rxdata, Map813b.rxdata.

## Próximas colas

1. conectar el protocolo de replay a un runtime autorizado;
2. ejecutar rangos de mapas en workers aislados y fundir sus registros por unión;
3. publicar el JSON como artefacto de CI;
4. repetir los cinco fallos sembrados y conservar evidencia.
