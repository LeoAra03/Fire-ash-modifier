# Registro de defectos y cierre reproducible

Estado de referencia: `pending_human_review` para las pruebas que necesitan
Game.exe, Android/Kirin o una persona. Este registro no convierte un aviso en
un PASS ni borra un defecto por llamarlo «conocido».

## Regla de ciclo

Un defecto solo puede pasar a `resolved` cuando se cumplen, en este orden:

1. **Reproducción:** existe una entrada con pasos, versión, entorno y evidencia.
2. **Clasificación:** se asigna gravedad (`bloqueante`, `grave`, `leve` o
   `cosmético`) y familia afectada.
3. **Corrección:** se identifica el archivo/commit que cambia el comportamiento.
4. **Regresión:** se ejecuta una prueba que fallaba antes y pasa después.
5. **Impacto cruzado:** se comprueba que no rompe mapas, eventos, texto,
   guardado, audio, rendimiento o compatibilidad.
6. **Reverificación:** se repite el verificador del bloque y se enlaza su
   salida.

Si falta una etapa, el estado no es `resolved`. Un defecto cosmético tampoco se
puede saltar para declarar terminado el plan.

## Estados permitidos

- `open`: reproducido y todavía sin corrección;
- `known_nonblocking`: reproducido, no bloquea terminar el juego, pero sigue
  abierto para una versión posterior y debe aparecer en las limitaciones;
- `pending_human_review`: la herramienta está lista, pero falta una sesión
  humana, un binario o un dispositivo;
- `resolved`: ciclo completo con regresión y reverificación enlazadas;
- `wont_fix`: solo para una decisión explícita, con motivo, impacto y prueba de
  que no impide terminar ni corrompe una partida.

## Inventario vigente

| ID | Estado | Familia | Reproducción | Regresión / evidencia | Alcance y siguiente acción |
|---|---|---|---|---|---|
| D-024-AUDIO | `known_nonblocking` | audio | `node tools/plan2700/lote5_fase024_performance.mjs` conserva cuatro referencias históricas sin archivo homónimo | no se inventa una pista; revisar con fuente autorizada y ejecutar la auditoría de audio | no bloquea el análisis estático, pero puede afectar a esas escenas; requiere decisión de audio |
| D-024-KIRIN | `pending_human_review` | compatibilidad | `python3 tools/kirin_check.py pokemon_fire_ash` da 0 errores y 3 avisos | falta dispositivo/emulador Kirin para regresión real | revisar MIDI, mayúsculas y PBS en dispositivo; no es PASS de Android |
| D-026-DN | `pending_human_review` | contenido DN | `npm run verify:all` se detiene en recortes fuente ausentes de Dimensional Nightmare | no se crean PNG ni catálogos sintéticos; repetir al disponer de la fuente autorizada | el paquete QA está verificado, pero el cierre total queda pendiente |
| D-026-ATLAS | `pending_human_review` | referencia visual | `npm run render:atlas:macro02` requiere el backup original ausente | conservar referencias existentes; regenerar solo con el backup correcto | pendiente de revisión visual, sin sobrescribir evidencia |
| D-026-BACKUP | `known_nonblocking` | higiene de entrega | `pokemon_fire_ash/Data/Map081.BAK` aparece versionado | `lote5_fase026_entrega.mjs` confirma que no entra en los ZIP | queda fuera de paquetes; la limpieza del árbol canónico requiere una fase explícita para no destruir una fuente |
| D-027-PLAYTEST | `pending_human_review` | runtime | no se puede arrancar Game.exe ni instalar una descarga desde este checkout | acta de partida, logs y revisión externa todavía no existen | instalar copia limpia, jugar el recorrido y completar `docs/qa/revision_externa.md` |

La tabla es deliberadamente honesta: contiene pendientes reales aunque las
familias automáticas estén verdes. `node tools/plan2700/lote6_fase027_cierre.mjs`
comprueba que el registro conserve los campos `ID`, `Estado`, `Reproducción`,
`Regresión` y `Alcance`.

## Plantilla para una entrada nueva

```text
ID:
Estado: open | known_nonblocking | pending_human_review | resolved | wont_fix
Fecha:
Versión/commit:
Familia:
Entorno:
Pasos de reproducción:
Resultado observado:
Resultado esperado:
Evidencia:
Gravedad: bloqueante | grave | leve | cosmético
Corrección / commit:
Prueba de regresión:
Impacto cruzado:
Verificador y salida:
Limitación comunicada:
```

## Cierre de una tanda

```bash
node tools/plan2700/lote6_fase027_cierre.mjs
node tools/plan2700/lote6_fase027_cierre.mjs --verify
# Después de cualquier corrección tardía:
npm run verify:all
```

`verify:all` puede requerir entradas de referencia no redistribuibles; si no
termina, se registra la causa exacta en vez de ocultarla.
