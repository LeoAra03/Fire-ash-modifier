# Cierre FASE 012 — Glazed y preparación de Light Platinum (tareas 1100–1199)

Fecha de medición: 2026-10-17. La fase cierra la ampliación narrativa y
estructural que puede comprobarse sin presentar una partida humana como hecha.

## Glazed cerrado

- Rango **Map3000–Map3110**, 111 mapas en seis capítulos.
- Auditoría instalada en `tools/plan2700/audit_campaign_region.mjs` y salida
  reproducible en `content/plan2700_glazed_audit.json`: **1 277 eventos,
  588 warps, 14 zonas/89 slots de encuentros, niveles 4–70, 8 líderes y un
  único escritor ON del switch 990**.
- `tools/plan2700/glazed_story.mjs` añade tres apariciones de Percy (llegada,
  elección y cumbre), con desenlace no humillante y textos propios. El backup
  queda en `pokemon_fire_ash/PokeModBackups/plan2700_glazed_story`.
- Las fichas visuales de ciudades y gimnasios están en
  `docs/qa/fichas/glazed_ciudades.md` y `docs/qa/fichas/glazed_gimnasios.md`;
  el acta regional está en `docs/qa/regiones/glazed.md`.
- El mapa más denso es Map3060 con 105 eventos; se conserva como hallazgo
  visible para revisión de ritmo/arte, no se maquilla el censo.

## Light Platinum inventariado

- Rango **Map3120–Map3138**, 19 mapas, 54 NPC de plano, 53 warps, 10 zonas y
  61 slots de encuentros, niveles 6–60, 8 líderes y máximo 19 eventos/mapa.
- El inventario está en `content/plan2700_light_platinum_audit.json` y la
  preparación narrativa en `docs/qa/regiones/light_platinum_preparacion.md`.
- Se verifica que la entrada 3120 y el lobby 2210 sean independientes de
  Glazed, compartan la puerta postgame 876 y conserven retorno; el cierre
  narrativo 991 queda para la tanda 013.

## Verificadores reales

| Comando | Resultado |
|---|---|
| `npm run build:glazed:story` + `verify:glazed:story` | EXIT 0 |
| `npm run audit:glazed:region` | EXIT 0 |
| `npm run verify:glazed` | EXIT 0 |
| `npm run audit:light_platinum:region` | EXIT 0 |
| `npm run verify:light_platinum` | EXIT 0 |
| `npm run verify:lideres` | EXIT 0 — líderes Glazed/Light Platinum cableados |
| `npm run verify:rom:campaigns:plan` + `verify:rom:campaigns` | EXIT 0 — 1 227 mapas, 5 061 warps |
| `node tools/inventario_congelado.mjs --verify` | EXIT 0 — 3 465 mapas, 409 scripts, 9 197 pares |
| `npm run verify:package` + `verify:corregido:zip` | EXIT 0 — ZIPs sincronizados |
| `npm test` | EXIT 0 — 76 264 aserciones Atlas, 0 fallos |

La corrección de esta fase también actualiza la cita de la deuda
`EVENTO-FLAG-DOBLE` en `content/evento_terminado.json`: la auditoría de flags
ya nombra el switch 957 y el verificador vuelve a medir sus 20 escrituras
idempotentes como deuda declarada, sin fallos abiertos.

## Límites honestos

El caminante automático, el recorrido en Game.exe/Kirin, la escucha musical,
la unicidad perceptiva de los puzles y la revisión de densidad siguen siendo
QA manual. Las fichas se basan en el plano y los mapas instalados, no en una
certificación visual de la ROM invitada.
