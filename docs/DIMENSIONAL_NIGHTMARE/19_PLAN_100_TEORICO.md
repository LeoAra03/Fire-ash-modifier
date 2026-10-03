# CIERRE TEÓRICO AL 100 % — Dimensional Nightmare

## Propósito y límite de la entrega

Dejar una compilación **instalable y lista para que el usuario la pruebe manualmente** en Fire Ash compatible. «100 % teórico» significa que cada contenido pedido está diseñado, cableado, tiene recursos presentes y pasa verificaciones estáticas; **no** significa que el juego se haya ejecutado en `Game.exe`. Esa última validación la hará el usuario.

La salida será un parche de QA separado en `Scripts_corregido/Dimensional_Nightmare_QA.zip`, más su carpeta descomprimida. No se sustituye ni se mezcla silenciosamente con el ZIP de *La Ruta de Dios*. Se incluye una guía de instalación y una lista de pruebas manuales.

## Reglas que no se negocian

- `v264` sigue siendo el contador de emisiones de Monte Silver: el Nightmare sólo lo consulta para desbloqueos. Ningún generador, evento o final lo escribe.
- No se toca `docs/AUDITORIA_TOTAL_FLAGS.md` ni `docs/qa_render/`.
- Cada combate de historia permite perder y volver a intentar; curación segura, recompensas únicas y nada de castigos irreversibles.
- Se conservan las especies y recursos compatibles con Fire Ash; los mapas mantienen coherencia visual de juego y no se resuelven como una mezcla de tiles inconexa.
- Sin gore, daño a partidas, eliminación de Pokémon, escenas gráficas ni instrucciones peligrosas.
- Los mosaicos derivados se pueden incluir **sólo en el ZIP interno de prueba**, identificado como material de QA no redistribuible; no se incorporan por ello al parche público de *La Ruta de Dios*.

## Fases y puertas de calidad

### F0 — Congelar línea base y límites de IDs
- Inventariar mapas, eventos, objetos, trainers, sprites, música, switches y variables.
- Reservar IDs DN después del mayor ID usado; documentar nombres y verificar que no haya colisiones.
- Puerta: lectura/escritura prohibida de `v264` desde DN; los comandos de flags informan cero colisiones.

### F1 — Biblia de mapas y revisión de layout
- Para cada mapa jugable, fijar subtema, atmósfera, paleta y **4–6 detalles decorativos propios** antes de tocar su layout.
- Rechazar simetría axial deliberada, arenas cuadradas de relleno y rutas principales rectas. Usar bordes rotos, desnivel legible, recodos y espacios secundarios con propósito.
- Revisar centro/tienda cuando el subtema sea una ciudad: decidir explícitamente si funcionan, están cerrados o cumplen otro uso narrativo.
- Puerta: ficha visual para todos los mapas; test de topología que detecta simetría exacta, rutas rectas y áreas inalcanzables; ninguna conexión obligatoria bloqueada.

### F2 — Guion y actuación
- Escribir escenas de entrada, descubrimiento, quiebre, jefe, epílogo y regreso para los seis episodios, el Nexo, la Liga y W7–W9.
- Dar a cada NPC estados de diálogo reales: rutina, variación por visita, reacción a fase/entorno y, según su tipo, conciencia del bucle o de Ash. Los NPC conscientes reciben confesión de cierre.
- Convertir los ganchos de experiencia por mapa en objetos, estatuas, placas, fotografías, altares o señales inspeccionables con texto propio.
- Puerta: todos los NPC tienen diálogo no-placeholder y se distingue la voz por mundo; cada uno de los mapas de juego tiene por lo menos un punto de exploración útil; ninguna escena automática se repite al reentrar.

### F3 — Decisiones y consecuencias narrativas
- Añadir una decisión sin bloqueo por episodio/mundo, con ambas ramas válidas y guardadas en flags DN.
- Cada decisión obtiene una respuesta posterior del Archivo/Rotom/NPC; ningún camino pierde progreso, medallas ni objetos esenciales.
- Mantener la decisión final del Nexo y registrar finales «sellado» y «abierto».
- Puerta: comprobar las dos ramas de cada decisión, estado al reentrar y textos del epílogo; todos los valores son independientes de `v264`.

### F4 — Sistemas, puzzles y combates
- Implementar las fases de corrupción 1–7 por hitos de historia: tono, audio, reacciones de NPC y obstáculos visuales seguros. Los huecos no pueden caer sobre salidas, eventos, jefes o celdas obligatorias.
- Cerrar los rompecabezas de urnas, palancas, runas, estatuas, campanas, fotos, cunas, letras y silencios con instrucciones/pistas suficientes, orden validado y recuperación sin softlocks.
- Hacer espejo real de EP05 (copia temporal del equipo actual del jugador) y forma final/combate C de EP06 después del puzzle de siete letras.
- Verificar jefes EP01–EP06 y W7–W9: `canLose`, reintento, restauración, contador propio, recompensas únicas y sellos sólo tras completar todos los pasos.
- Puerta: prueba estática de cada rama, objeto, switch y contador; ninguna escritura a partidas ni a `v264`.

### F5 — Arte y audio de juego
- Completar los assets que necesita el contenido en estilo 16-bit compatible; los originales se guardan en la carpeta de recursos fuente y las imágenes del motor en `Graphics/`.
- Crear música/variantes de ambiente originales para las anomalías auditivas; no reutilizar ni alterar una pista comercial para fingir que es una composición nueva.
- Puerta: comprobar dimensiones, transparencias, nombres referenciados, formatos reproducibles y ausencia de dependencias locales.

### F6 — Empaquetado de QA
- Incluir mapas/índices, scripts corregidos, flags, objetos, trainers, tilesets requeridos, arte original, portada y audio en el ZIP de QA.
- Excluir partidas, ejecutables del juego y copias de archivos de guardado. Añadir instalación aditiva, backup y aviso de compatibilidad.
- Puerta: construir desde cero, verificar hash/igualdad carpeta↔ZIP, probar `unzip -t`, y auditar referencias y lista de archivos.

### F7 — Entrega al usuario
- Entregar la ruta exacta del ZIP, instrucciones para extraer sobre una copia limpia del juego y el checklist manual.
- Estado visible: «listo para QA manual» sólo si F0–F6 pasan. No declarar «probado en juego» hasta que el usuario devuelva resultados de `Game.exe`.

## Checklist manual que queda para el usuario

1. Instalar sobre copia de seguridad y cargar una partida postgame.
2. Confirmar entrada desde Monte Silver con 3 y 7 emisiones; comprobar que `v264` no cambia al completar DN.
3. Recorrer hub, los seis episodios, Nexo/Liga y W7–W9, probando salidas, retornos y puertas.
4. Hablar varias veces con NPC normales, conscientes e interdimensionales en fases distintas.
5. Inspeccionar un objeto/estatua por mapa y probar anomalías, puzzle, pistas y decisiones de cada mundo.
6. Perder/reintentar cada combate; comprobar curación, fase B/C, sello y recompensa única.
7. Confirmar música, tonos, lectura de textos, sprites, centros/tiendas cuando correspondan, y que no haya bloqueos de movimiento.
8. Probar ambos finales del Nexo y la vitrina de recuerdos; cargar/reiniciar una partida para confirmar persistencia.

## Registro de cierre

Este archivo es la puerta y no una declaración de éxito anticipada. Cada fase se marcará con fecha, comandos y resultado sólo después de ejecutarla. El pendiente que no se puede cerrar desde la validación estática es F7: la partida real en `Game.exe`, responsabilidad del usuario.