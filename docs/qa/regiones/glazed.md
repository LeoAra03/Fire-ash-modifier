# Acta QA — región Glazed (FASE 012)

## Alcance instalado

- Rango: **Map3000–Map3110**, **111 mapas**, seis capítulos.
- Entrada: lobby 2200, después de La Ruta de Dios (switch 876).
- Progreso: variable **350**, cierre **990**.
- Líderes: **8** (switches 700–707).
- Encuentros: **14 zonas**, **89 slots**, niveles **4–70**; todas las especies
  existen en `species.dat` y las tablas se instalan en `encounters.dat`.
- Medición estructural: **1 277 eventos**, **588 warps**, máximo **105 eventos
  en un mapa**; el retorno libre existe en los 111 mapas.
- Audio: todos los mapas tienen BGM instalada (`Sinnoh Route.ogg`, existente
  en `Audio/BGM`); no se atribuye escucha humana a esta acta.

La salida reproducible es `content/plan2700_glazed_audit.json`. El auditor
`tools/plan2700/audit_campaign_region.mjs` valida archivos, límites, retorno,
avance, warps, BGM, tilesets, líderes, especies, niveles y el único escritor
ON del switch 990.

## Contenido y contrato

El contrato de Glazed es escarcha, lagos y ciudades que recuerdan dos líneas
temporales. Las fichas de las ciudades y gimnasios están en:

- `docs/qa/fichas/glazed_ciudades.md`
- `docs/qa/fichas/glazed_gimnasios.md`

El sistema no añade un acceso alternativo ni una cápsula de teletransporte. El
capitán y el lobby conservan la puerta postgame común; el jugador puede
abandonar y retomar por el retorno instalado. La política de procedencia está
en `content/rom_campaigns_complete.json` y prohíbe copiar mapas, diálogos,
audio o gráficos de la ROM.

## Verificadores

```text
npm run audit:glazed:region       EXIT 0
npm run verify:glazed             EXIT 0
npm run verify:lideres            EXIT 0
npm run verify:rom:campaigns      EXIT 0 (incluye Glazed)
npm run verify:mapa_terminado    EXIT 0
```

## Límites declarados

La auditoría cuenta y comprueba estructura; no certifica una partida humana,
la curva de ritmo, la unicidad perceptiva de cada puzle, clima durante el
movimiento ni la ausencia de clipping. El mapa 3060 es el más denso (105
eventos) y queda señalado para revisión visual, no oculto en el inventario.
