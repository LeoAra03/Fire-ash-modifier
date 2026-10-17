# FASE 027 — cierre documental, entrega y mantenimiento (IDs 2600–2699)

## Alcance

Esta tanda convierte el cierre en un proceso trazable: higiene de ZIPs,
registro de defectos, limitaciones de instalación, mantenimiento, mapa de
conocimiento, reproducibilidad y receta de reversión. Las tareas que exigen
Game.exe, Android/Kirin, una descarga desde GitHub o una persona siguen
marcadas `pending_human_review`; no se presentan como pruebas automáticas.

## Auditoría ejecutada

```bash
npm run audit:plan2700:fase027
npm run verify:plan2700:fase027
```

El verificador comprueba cinco paquetes, legibilidad ZIP, ausencia de partidas,
backups, fuentes de ROM y nombres de mosaicos derivados de ROM invitada. También
comprueba que existan el registro de defectos, la guía de mantenimiento, el
mapa de conocimiento, la receta de reversión y esta acta. El detalle estable se
archiva en `content/lote6_fase027_cierre.json`.

## Evidencia estática

- La instalación se describe como parche sobre una carpeta existente; el
  manifiesto mínimo comprueba `Data/Scripts.rxdata`, `Data/MapInfos.rxdata` y
  `LEEME.txt`.
- `docs/qa/defectos.md` exige reproducción, clasificación, corrección,
  regresión, impacto cruzado y reverificación. Conserva pendientes reales: no
  se cierra el plan con un defecto cosmético «conocido» para saltarlo.
- `docs/ENTREGA_FINAL_LIMITACIONES.md` es la sección de limitaciones conocidas
  que se debe entregar al jugador. Distingue los checks verdes de las pruebas
  de runtime que todavía no tienen entorno.
- `docs/qa/guia_mantenimiento.md` contiene el flujo de mapa, región, IDs,
  verificadores, rollback y un ejemplo completo que escribe solo en una carpeta
  temporal.
- `docs/qa/mapa_conocimiento.md` enlaza las preguntas del proyecto con su
  fuente y comando de regeneración.
- `docs/qa/reversion_bloque.md` conserva la prueba de reversión aislada; el
  acta queda pendiente hasta ejecutar una copia Git separada.

## Resultado honesto

Estado: `static_pass_manual_pending` cuando el JSON no encuentra fallos
estáticos. No significa «cero errores conocidos» ni «partida completa». La
instalación limpia, las tres sesiones humanas sin descubrimientos, la etiqueta
final, la CI remota, las firmas de playtest y la revisión externa continúan en
la cola manual del JSON.

Después de cualquier corrección tardía se debe ejecutar, como mínimo:

```bash
npm run verify:all
```

Si una dependencia no redistribuible impide la suite, se conserva el motivo
en `docs/qa/cero_errores.md` y en el registro de defectos.
