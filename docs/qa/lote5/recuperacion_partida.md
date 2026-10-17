# Protocolo de recuperación de partida

Documento operativo para las sesiones de playtest y soporte. No se ejecuta
sobre una partida del usuario sin conservar primero una copia.

1. Cerrar el juego y copiar la carpeta de partidas a un directorio externo.
2. No editar el archivo original; trabajar sobre una copia con fecha y hash.
3. Intentar cargar la copia en el mismo entorno y versión que la creó.
4. Si falla, registrar el mensaje exacto y la última escena conocida.
5. Restaurar el último backup íntegro de `pokemon_fire_ash/PokeModBackups/`
   correspondiente al archivo de datos afectado; no sustituir un backup con
   otro de una partida distinta.
6. Cargar de nuevo y comprobar mapa, posición, equipo, medallas, variables y
   switches de progreso.
7. Si la partida sigue dañada, conservar la copia para diagnóstico y entregar
   un reporte sin datos personales: versión/commit, sistema, pasos, mensaje,
   hash del archivo y capturas recortadas.

## Reglas de seguridad

- Nunca borrar una partida o un backup para “probar” una reparación.
- No ejecutar el editor en modo escritura sobre el original.
- No restaurar `Data/` completo encima de una partida sin identificar el
  archivo que falló.
- El jugador debe poder seguir jugando desde el último guardado válido; si no,
  clasificar como bloqueante.

## Ficha mínima

```text
Versión/commit:
Sistema y dispositivo:
Archivo de partida (hash):
Último mapa/escena:
Pasos reproducibles:
Mensaje observado:
Backup probado y hash:
Resultado:
```
