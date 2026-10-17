# Cierre FASE 020 — presentación, arte y atribución

La tanda cubre los IDs **1900–1999**.

## Entregables

- `tools/plan2700/audit_arte.mjs` y `content/plan2700_arte.json`: inventario
  hashado de Graphics, referencias de charset, duplicados y fases.
- `content/plan2700_arte_faltante.json`: candidatos genéricos y pendientes sin
  presentarlos como recursos ausentes.
- `content/plan2700_npc_density.json`: densidad por mapa/perfil.
- `docs/qa/estilo_personajes.md`, `arte_total.md`, `npc_por_mapa.md`,
  `creditos_arte.md` y esta acta.

## Resultado estático

- 16957 PNG / 74,5 MiB auditados.
- 2028 nombres de personaje referenciados y 0 referencias ausentes reales.
- 18 archivos de arte del plan modificados desde la base; 365 grupos de
  duplicados exactos se mantienen en revisión, sin borrar variantes a ciegas.
- 3465 mapas cruzados para densidad de eventos y perfiles.

## Comandos

```text
npm run audit:plan2700:arte
npm run verify:plan2700:arte
npm run verify:graficos
npm run verify:visor
npm run verify:atavios
```

La validación de paleta, silueta, escala, legibilidad, ritmo y atribución final
requiere revisión humana/visual. La fase no afirma que un inventario hashado
sea una aprobación artística.

La única incoherencia previa de battler/overworld del catálogo (ELECTRAMEW) se
corrigió desde front/back existentes con
`tools/plan2700/repair_electramew_character.mjs`; la coherencia final fue
19/19.
