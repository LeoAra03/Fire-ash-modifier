# FASE 036 — cierre final, hashes y publicación (IDs 3500–3599)

## Auditoría reproducible

```bash
node tools/plan2700/lote7_fase036_cierre_final.mjs
node tools/plan2700/lote7_fase036_cierre_final.mjs --verify
```

El auditor enumera la evidencia de FASE 027–036, calcula SHA-256 de los ZIP de
entrega que existen, inspecciona entradas prohibidas (partidas, backups, fuentes
invitadas y herramientas), vuelve a leer C1–C5 y lista coincidencias
contextuales de promesas públicas. El acta final está en
`docs/qa/acta_final_cierre.md`.

## Qué sí se comprueba aquí

- artefactos de fase enlazables y reproducibles;
- ZIP legibles, tamaño y hash del checkout;
- ausencia de partidas/backups/fuentes invitadas dentro de los ZIP auditados;
- censo, fuzz y registro de defectos sin maquillar sus límites;
- presencia de créditos, documentación y contrato de fangame no oficial;
- definición operativa de cierre distinta de «perfecto».

## Qué queda bloqueado

Instalar una máquina limpia, jugar la partida completa, comprobar el 100 % del
contenido visitable, hacer tres rondas ciegas con personas nuevas, probar otro
equipo/Android/Kirin, confirmar la copia publicada y completar
`npm run verify:all` con las fuentes autorizadas de Dimensional Nightmare son
pruebas externas. El auditor deja `manual_pending` o `blocked_by_authorized_DN_sources`.

No se declara que el paquete esté congelado solo porque tenga un SHA-256:
`frozenAt`, versión publicada, firma humana y comparación contra la copia
accesible al jugador siguen pendientes.
