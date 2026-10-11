# Plan de mejora de PokeMod Studio para Fire Ash

## Objetivo

Mejorar la experiencia de modificación de Fire Ash con una regla de calidad concreta: que editar sea más seguro y rápido que cambiar datos a mano, sin escribir ni borrar partidas y sin prometer compatibilidad que no se haya probado en Kirin.

Este plan mejora primero **la herramienta del repositorio**; no afirma que el juego base o su historia ya hayan sido sustituidos o superados.

## Plan por etapas

| Etapa | Resultado | Criterio de aceptación | Estado |
|---|---|---|---|
| 1. Ediciones reversibles | Deshacer/rehacer en Eventos, NPCs, Flags y Pokémon/PBS; controles en la barra superior y atajos de teclado. Historial acotado en memoria y separado por sesión. | Pruebas de snapshots, integración con los modelos y prueba de UI; deshacer después de guardar deja visible el cambio pendiente. | **Hecha** |
| 2. Editor visual de mapas | Pintar las capas 1–3 con paleta/selector de tiles; mostrar pasabilidad y respetar las dimensiones y tilesets RMXP. Integrar cada trazo con el mismo historial. | Cambios de tiles reproducibles byte a byte al guardar; deshacer/rehacer, mapas de prueba y auditoría de límites. | Pendiente |
| 3. Flujo seguro de prueba | Comparar antes/después, validar mapas/eventos/PBS antes de exportar y mostrar una lista de advertencias accionables. | Exportación no toca partidas; pruebas de estructura y una comprobación manual con Kirin/JoiPlay en Android y un runtime de PC. | Pendiente |
| 4. Pulido de móvil y accesibilidad | Controles cómodos con una mano, foco/teclado accesible, estados de guardado claros y menos pasos para llegar a un evento desde el mapa. | Prueba de UI en varios anchos y recorrido manual en pantalla pequeña. | Pendiente |

## Etapa 1 ejecutada

- Se añadió un historial transaccional con límite de **40 entradas** y **24 MiB** aproximados de snapshots; se reinicia al abrir otro proyecto y al pasar a secciones con operaciones masivas no registradas.
- Cubre cambios del modelo en propiedades/comandos de eventos, sprite y propiedades de NPC, nombres de interruptores/variables y edición PBS.
- Deshacer/rehacer de mapas y PBS deja el documento marcado como pendiente de guardar. Para Flags, el archivo `System.rxdata` se vuelve a guardar al aplicar deshacer/rehacer, como sucede al renombrar.
- Los botones `↶`/`↷` y `Ctrl+Z` / `Ctrl+Y` (`Cmd+Z` / `Cmd+Y` en Mac) operan desde la barra superior. En campos de texto y modales se conserva el atajo nativo del navegador.
- Los snapshots solo viven en memoria: no son una copia de seguridad persistente. Los backups automáticos existentes continúan siendo la recuperación entre sesiones.

### Límites deliberados

La primera etapa no registra las acciones masivas de **Crear**, instalación/desinstalación de la Sala PokeMod, restauración de backups ni importación de secciones Ruby. Al entrar a esas secciones se vacía el historial para que Deshacer no salte una operación sin registrar. La pintura de tiles aún no está implementada; corresponde a la etapa 2.

Las pruebas automatizadas verifican el modelo y la interfaz simulada, no sustituyen una prueba de juego con Fire Ash/Kirin. No se ha modificado ni validado ninguna partida real.

## Verificación de la etapa 1

```bash
node web/js/history.test.mjs
node web/js/integration.test.mjs
node --experimental-vm-modules web/js/ui.test.mjs
```

Para la siguiente etapa, empezar inspeccionando `web/js/rmxp.js`, `web/js/render.js` y `web/js/ui.js`, y añadir primero una prueba de lectura/escritura de las tres capas antes de conectar herramientas de pintura.
