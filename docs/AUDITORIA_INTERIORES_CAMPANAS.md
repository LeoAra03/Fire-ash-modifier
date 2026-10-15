# Auditoría: interiores de campañas ROM como perfiles artesanales separados (fase 73)

Verificador: `node tools/auditar_interiores_campanas.mjs` (`--json` para el detalle).
Solo lee archivos; no modifica mapas ni el plano.

## Resultado

**No se cumple.** Los 385 candidatos a perfil artesanal de la fase 72 se construyen
como **planos automáticos**, no como perfiles separados:

| Comprobación | Resultado |
|---|---|
| Candidatos (`content/perfiles_artesanales_campanas.json`) | 385 |
| Marcados como perfil artesanal en el plano | **0** |
| Marcados como perfil artesanal en el mapa instalado | **0** |
| Construidos con donantes exteriores (automático) | **385** |
| El pipeline de construcción lee la lista de perfiles | **no** |

## Por qué

- El plano declara `interiorsNeedSeparateHandcraftedProfiles: true`, pero ningún mapa
  tiene un campo de perfil ni una marca en `artDirection`. Los 1 227 mapas tienen
  `category: "A"` y se pintan con filas de donantes exteriores (`visualRows.donorMapId`).
- `tools/apply_complete_rom_campaigns.mjs` no lee `perfiles_artesanales_campanas.json`.
  Sólo `tools/create_complete_rom_campaigns.mjs` lo menciona, y sólo en el plano.
- Por eso la lista de la fase 72 es sólo una **propuesta**: el build no la consume.
- El propio plano avisa de que no es una campaña artesanal completa.

## Consecuencia

Un interior (por ejemplo el Laboratorio de Willow, `Map3000`) se instala con suelo y
estructura exteriores, y ninguna herramienta lo distingue de un exterior.

## Decisión necesaria (no se aplica en esta fase)

Hay dos opciones, y cambian mapas instalados:

- **A. Separar de verdad**: marcar los 385 mapas en el plano como `perfil: "artesanal"`,
  hacer que `apply_complete_rom_campaigns.mjs` los **omita** (no sobrescribe el mapa) y
  mantener una cola de trabajo de arte. Es la opción que cumple la política.
- **B. Marcar sin cambiar el mapa**: seguir construyendo automáticamente, pero añadir
  un evento visible de «perfil artesanal pendiente» en cada candidato. Es rápida, pero
  el interior sigue siendo automático.

Tras elegir, `node tools/auditar_interiores_campanas.mjs` debe salir con código 0.
