# Cierre FASE 018 — Atlas Mil y Dimensional Nightmare

La tanda cubre los IDs **1700–1799**.

## Resultado

- Atlas: 1000 mapas, 6410 eventos, 40 anclas Tier 1, 120 rutas Tier 2 y 420
  reglas Tier 3; sin mapas >60 eventos en el censo actual.
- Nightmare: 151 mapas presentes, 9 episodios, 112 anomalías declaradas y
  cadena de hub/eventos/batallas/medallas/historia/audio verificada.
- Se añadieron el auditor `tools/plan2700/audit_fase018.mjs`, su salida JSON,
  el acta maestra de cada región y las actas por lote de Atlas.

## Evidencia

```text
npm run verify:atlas:repair
npm run verify:tier2:macro04-05
npm run verify:tier2:macro06-07
npm run verify:tier3:rules
npm run verify:atlas:tiles
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

La puerta agregada `npm run dn:verify:all` sigue declaradamente pendiente por
el catálogo ausente `content/dimensional_nightmare_tiles_2x.json`; no se crea
un sustituto sintético. Los recorridos humanos y la evaluación perceptiva
siguen listados como QA manual.
