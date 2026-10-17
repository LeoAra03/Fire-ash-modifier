# Dimensional Nightmare — acta QA (FASE 018)

## Instalación comprobable

- Rango **Map2040–Map2190**, 151 mapas presentes; el censo compilado contiene
  1359 eventos, media 9 por mapa y máximo 23.
- Episodios EP01–EP06 y W7–W9: 9 episodios y 112 anomalías declaradas en el
  plano de eventos; los auditores de eventos y batallas verifican sus cuotas,
  estados, jefes, objetos y reintentos.
- Hub Map2040, gruta de testigos Map2030, Liga Map2141/2142, mapas W7–W9,
  medallas, cartucheras, flags, story, audio, sensaciones y arte tienen
  verificadores individuales en verde.
- `v[264]` es contrato de **solo lectura** para DN; los flags DN están en sus
  rangos propios.

## Verificadores ejecutados en esta fase

```text
npm run dn:art:verify
npm run dn:audio:verify
npm run dn:maps:verify
npm run dn:polish:verify
npm run dn:medals:verify
npm run dn:liga:verify
npm run dn:sens:verify
npm run dn:flags:verify
npm run dn:story:verify
npm run dn:hub:verify
npm run dn:events:verify
npm run dn:battles:verify
npm run dn:hub:events:verify
```

## Dependencia no inventada

`npm run dn:verify:all` aún no puede cerrar el último eslabón porque
`tools/apply_dimensional_nightmare_maps.mjs` lee el catálogo binario/visual
`content/dimensional_nightmare_tiles_2x.json`, ausente del checkout. Tampoco
se fabrican PNG de referencia para disfrazar esa ausencia. La salida queda
registrada como `missingTiles2xCatalog: true` en
`content/plan2700_fase018_audit.json`; el resto de comprobaciones de la tanda
sí se ejecuta y queda en verde.
