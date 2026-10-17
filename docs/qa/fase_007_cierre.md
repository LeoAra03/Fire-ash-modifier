# Cierre FASE 007 — flags, recursos y diálogo (tareas 600–700)

Fecha de medición: 2026-10-17. La fase convierte el inventario disperso en
salidas reproducibles y no presenta un playtest manual como realizado.

## Entregas

- `tools/plan900/name_flags.mjs` nombra y verifica los flags ya usados por el
  plan: 20 switches (950–957, 960–964, 970–976) y 10 variables (310–313,
  315, 318–322). No consume IDs nuevos. El bloque 940–947 se mantiene en su
  herramienta específica del Multiverso.
- `tools/plan900/dump_dialogos.mjs` produce el volcado determinista
  `content/plan900_dialogos.json`: **13 734 eventos PokeMod**, **19 799 cajas
  101/401**, **3 983 mensajes Ruby**, en **1 887 mapas**.
- `tools/plan900/inventario_recursos.mjs` produce
  `content/plan900_recursos.json` con ruta, tipo, fase, tamaño, SHA-256 y
  dimensiones cuando aplica: **769/769 referencias existentes**, **42 002 870
  bytes**, **0 ausentes**.
- `content/mapa_terminado.json`, `content/mapa_terminado_censo.json` y su
  informe registran la deriva real del hallazgo DN: ahora son **15/15** mapas
  con encuentros declarados e implementados (Map2135 se incorporó al censo).
- `docs/AUDITORIA_TOTAL_FLAGS.md` se regeneró desde `System.rxdata`: 994 slots
  de switches, **910 con nombre**, 888 usos literales; 354 slots de variables,
  **316 con nombre**, 293 usos literales; 0 conflictos custom.
- El verificador de eventos queda sin fallos abiertos en el anillo A; el único
  cambio de deuda de flags es `EVENTO-FLAG-SIN-NOMBRE = 0`.

## Verificadores ejecutados

| Comando | Resultado |
|---|---|
| `npm run verify:plan900:flags` | EXIT 0 |
| `npm run verify:plan900:dialogos` | EXIT 0 |
| `npm run verify:plan900:recursos` | EXIT 0 |
| `node tools/qa/dialogos_harness.mjs` | EXIT 0; Ruby/WASM cargó PokeModDialogos |
| `npm run verify:dialogos:queue` | EXIT 0 |
| `npm run verify:evento_terminado` | EXIT 0; 1 567 eventos, 0 fallos abiertos |
| `npm run verify:mapa_terminado` | EXIT 0; 0 fallos abiertos, 2 pendientes declarados |
| `npm test` | EXIT 0; **76 258 aserciones, 0 fallos** |
| `npm run kirin_check` | EXIT 0; 0 errores y 3 avisos conocidos (MIDIs, PBS ausente, 14 colisiones de mayúsculas) |
| `npm run verify:ambience` | EXIT 0 |

También se intentó `npm run verify:all`. La cadena llega hasta
`dn:plan:check` y termina EXIT 1 porque faltan los recortes de referencia
binarios `reference/dimensional_nightmare/slices/...` para los mapas DN
2041–2190. Esa dependencia ya está explicitada por el pipeline (`→ ejecutar
npm run dn:ingest`) y no se inventan PNG en esta fase; las puertas ejecutables
fuera de esa dependencia están en verde. No se declara la verificación global
como verde mientras esos binarios no estén presentes.

## Cobertura de la tanda

Las tareas 601–645 quedan respaldadas por el censo de flags, el inventario de
recursos, los nombres únicos, la comprobación de rutas y `kirin_check`; las
646–700 quedan respaldadas por el volcado, la compuerta de cajas, el harness
Ruby, el chequeo de idioma/longitud del proyecto y `npm test`. Las cuotas que
requieren Game.exe, Android/Kirin visual o escucha humana siguen siendo QA
manual pendiente, no una afirmación estática.
