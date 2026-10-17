# Mapa de conocimiento del proyecto

Este índice responde «¿dónde se comprueba esto?» sin obligar a conocer la
historia de los commits. La columna **evidencia/comando** es la ruta que debe
usarse para regenerar una cifra o abrir un pendiente.

## Núcleo del juego

| Pregunta | Documento o fuente | Evidencia/comando |
|---|---|---|
| ¿Qué mapas existen y qué IDs están reservados? | `tools/inventario_congelado.mjs`, `docs/qa/politica_ids.md`, `docs/ESTADO_CONGELADO.md` | `node tools/inventario_congelado.mjs --verify` |
| ¿Puede entrarse y salir de cada mapa? | `docs/qa/mapa_terminado.md`, `content/mapa_terminado.json` | `npm run verify:mapa_terminado:censo` |
| ¿Qué evento/flag deja una ruta abierta? | `docs/qa/evento_terminado.md`, `content/evento_terminado.json` | `npm run verify:evento_terminado:censo` |
| ¿Qué recursos faltan? | `docs/qa/arte_total.md`, `content/plan2700_arte.json` | `npm run verify:plan2700:arte` |
| ¿Cómo se valida el arranque Ruby? | `tools/validate_boot_classes.mjs`, `tools/qa/ruby_syntax_full_check.mjs` | `npm run verify:boot && npm run verify:ruby:full` |
| ¿Qué hace el guardado y cómo se recupera? | `docs/qa/lote5/recuperacion_partida.md`, `docs/qa/rollback.md` | revisión humana + protocolo de recuperación |

## Texto, tono y accesibilidad

| Pregunta | Documento o fuente | Evidencia/comando |
|---|---|---|
| ¿Cuál es el ancho real de la caja? | `docs/qa/evento_terminado.md`, `tools/qa/evento_terminado_check.mjs` | `npm run verify:evento_terminado:censo` |
| ¿Qué glosario y nombres son canónicos? | `docs/qa/glosario.md`, `content/plan900_recursos.json` | `npm run verify:glosario` |
| ¿Qué candidatos requieren edición humana? | `docs/qa/estilo_texto.md`, `content/lote5_fase025_texto.json` | `node tools/plan2700/lote5_fase025_texto_accesibilidad.mjs --verify` |
| ¿Qué reglas de tono se aplican? | `docs/qa/revision_externa.md`, `tools/apply_tone_safety_fix.mjs` | `npm run verify:tone-safety` |

## Regiones, campañas y dimensiones

| Pregunta | Documento o fuente | Evidencia/comando |
|---|---|---|
| ¿Qué promete cada dimensión? | `docs/qa/metrica_dimensiones.md`, `content/metrica_dimensiones.json` | `npm run verify:metrica` |
| ¿Qué contiene Atlas Mil? | `docs/qa/regiones/atlas_mil.md`, `content/atlas_mil_500.json`, `content/atlas_progress.json` | `npm run test:atlas:master` |
| ¿Qué contiene Dimensional Nightmare? | `docs/qa/regiones/dimensional_nightmare.md`, `content/dimensional_nightmare*.json` | `npm run dn:verify:all` (requiere sus fuentes autorizadas) |
| ¿Qué son las campañas invitadas? | `docs/qa/regiones/glazed.md`, `light_platinum_preparacion.md`, `content/*wild_encounters.json`, `docs/CAMPANAS_ROM_COMPLETAS.md` | `npm run verify:rom:campaigns:plan` |
| ¿Dónde está la Liga Oscura? | `docs/qa/regiones/liga_oscura.md`, `docs/qa/fichas/liga_oscura.md` | `npm run verify:diplomas` |
| ¿Qué parte depende de ROMs? | `docs/ENTREGA_FINAL_LIMITACIONES.md`, `docs/qa/guia_mantenimiento.md` | `npm run verify:plan2700:fase027` |

## Entrega, seguridad y operación

| Pregunta | Documento o fuente | Evidencia/comando |
|---|---|---|
| ¿Cómo se construyen los paquetes? | `Scripts_corregido/LEEME.md`, `docs/qa/lote5/fase_026_entrega.md` | `npm run build:package`, `npm run build:corregido:zip`, `npm run build:dn:qa` |
| ¿Qué no puede entrar a un ZIP? | `tools/package_release.sh`, `tools/plan2700/lote5_fase026_entrega.mjs` | `npm run verify:package && npm run verify:corregido:zip` |
| ¿Cuál es el presupuesto de artefacto? | `content/artifact_budget.json`, `docs/PRESUPUESTO_ARTEFACTO_SESION.md` | `npm run verify:presupuesto` |
| ¿Cómo se registran defectos? | `docs/qa/defectos.md` | `npm run verify:plan2700:fase027` |
| ¿Cómo se revierte un bloque? | `docs/qa/reversion_bloque.md`, `docs/qa/rollback.md` | `node tools/plan2700/lote6_fase027_cierre.mjs --verify` |
| ¿Cómo se mantiene el proyecto? | `docs/qa/guia_mantenimiento.md` | lectura + comandos de cada bloque |
| ¿Qué sigue pendiente? | `docs/ENTREGA_FINAL_LIMITACIONES.md`, `docs/qa/cero_errores.md`, `docs/qa/revision_externa.md` | no convertir `pending_human_review` en PASS |

## Huecos conocidos

- El runtime de Game.exe, Android/Kirin, FPS/memoria y la lectura humana no
  se pueden certificar desde un checkout sin esos entornos.
- Los recortes fuente de Dimensional Nightmare y el backup original de Atlas
  macro02 no se fabrican. Sus documentos dejan la dependencia visible.
- El registro de defectos contiene pendientes reales y sus siguientes acciones;
  una suite estática en verde no los elimina.

La auditoría de FASE 027 comprueba que este mapa, la guía de mantenimiento, la
prueba de reversión, el registro de defectos y la guía de limitaciones estén
presentes y que cada comando publicado tenga una ruta de regeneración.
