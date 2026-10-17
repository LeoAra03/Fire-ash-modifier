# La Ruta de Dios — acta QA (FASE 017)

## Cobertura instalada

- **Map2030:** Gruta de los Testigos, entrada/salida del bloque.
- **Map2031–Map2037:** siete pisos con escaleras encadenadas, testigos,
  reliquias y objetos de posición única.
- **Map2038:** aproximación a la Cima del Génesis, retorno a Puntaneva y cuatro
  hitos visuales.
- El plano conserva el corredor de cinco casillas de la aproximación y la
  salida al mundo original. El evento del duelo de Arceus permanece en el
  alcance del canon de `PokeMod_RutaDeDios`.

## Evidencia reproducible

```text
npm run verify:ruta_de_dios
npm run verify:arceus:cinematics
npm run verify:arceus:sprites
npm run verify:arceus:recursos
npm run verify:arceus:actions
npm run verify:arceus:moves
node tools/plan2700/audit_fase017.mjs --json
```

La medición de la tanda encuentra siete objetos `Item ...` en los pisos y
mantiene los mapas dentro de sus límites. Los verificadores del duelo cubren
las seis barras, sprites por fase, recursos, movimientos, restauración de
estado y derrota reintentable.

## Límite de la evidencia

La auditoría no convierte la existencia de un evento en una certificación de
ritmo. Cámara lenta, paneo, tiempo sin control, resolución visual del puzle,
recorrido con una partida real y abandono/reanudación deben jugarse en
Kirin/Game.exe. El hecho de que esos puntos estén pendientes se conserva en
`content/plan2700_fase017_audit.json`.
