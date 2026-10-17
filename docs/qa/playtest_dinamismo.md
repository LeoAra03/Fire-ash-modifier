# Playtest de dinamismo del DLC

Este protocolo cubre las tareas 101–150 de `tareas.txt`. La compuerta estática
es `node tools/qa/dinamismo_check.mjs`; las comprobaciones de transiciones,
tone, ambiente y encuentros se ejecutan con los comandos npm indicados abajo.
El repositorio no redistribuye `Game.exe` ni una partida de usuario, así que el
resultado de la prueba interactiva se registra aquí sin inventar una ejecución
que no se haya podido hacer.

## Preparación reproducible

1. Instalar dependencias: `npm ci`.
2. Abrir una copia de prueba de Fire Ash, nunca `Save*.rxdata` del usuario.
3. Respaldar la carpeta mediante `python3 tools/backup.py pokemon_fire_ash`.
4. Ejecutar `node tools/qa/dinamismo_check.mjs`.
5. Ejecutar, en este orden, `npm run verify:transition-safety`,
   `npm run verify:tone-safety`, `npm run verify:ambience` y `npm run verify:wild`.
6. Ejecutar `npm run verify:ruta_de_dios`, `npm run verify:arceus-portal`,
   `npm run verify:multiverse`, `npm run verify:rocket` y los verificadores de
   Atlas que correspondan al mapa visitado.

## Recorrido y criterios de aceptación

| ID | Recorrido | Qué observar | Resultado |
|---:|---|---|---|
| 1 | Ciudad Teckel | Dos guardias patrullan en cuadrícula, esperan dos segundos y nunca atraviesan puerta o warp. | Pendiente de Game.exe |
| 2 | Avenida del Circuito, Map2230 | Los aldeanos completan su paseo circular; el portal y las casillas de combate quedan libres. | Pendiente de Game.exe |
| 3 | Monte Silver, Map2021–2022 | Ventisca/niebla cambia por variable, la música no corta y el clima desaparece al salir. | Pendiente de Game.exe |
| 4 | Cima del Génesis, Map2037 | El cielo/parallax no mueve la colisión; la cámara acompaña sin superar ocho segundos de control retenido. | Pendiente de Game.exe |
| 5 | Puntaneva, Map625 | El portal encadena temblor, trueno y destello; una partida antigua sin switch 870 puede recuperarlo. | Pendiente de Game.exe |
| 6 | Anclas Atlas Tier 1 | Cada ancla dispara una única escena, escribe 708–747 y suma v[103]; al volver no se rearma. | Pendiente de Game.exe |
| 7 | Puerto Horizonte y Oak | Las frases de ambiente cambian con v[264]/progreso y no repiten dos veces seguidas. | Pendiente de Game.exe |
| 8 | Emisiones 2023–2029 | Cada guardián tiene entrada, curación, BGM/SE de atmósfera, salida física y retorno por menú. | Pendiente de Game.exe |
| 9 | Ciudad Glitch | La estática se oye como SE propio; no se inicia un BGM fantasma ni se repite al reentrar. | Pendiente de Game.exe |
| 10 | La Consola de 1996 | La música se degrada por páginas, el jugador conserva una salida y la escena se puede reintentar. | Pendiente de Game.exe |
| 11 | Base Rocket 2220–2221 | Interruptores, puertas, antorchas y estado del disfraz comunican su cambio con sprite y sonido. | Pendiente de Game.exe |
| 12 | Ruta de Dios, pisos 1–7 | Agua animada, entrada de guardianes, bloqueo/liberación de salida, cámara por fase y retorno seguro. | Pendiente de Game.exe |

## Resultado automatizado de esta fase

- `npm run verify:rom:nativo`: **EXIT=0**, 1227 mapas, 212 tilesets, 667
  personajes y 0 fallos.
- `node tools/qa/dinamismo_check.mjs`: **EXIT=0**, 50 controles declarados,
  23 mapas con BGM, 9 emisiones y 40 anclas Tier 1.
- `npm run verify:transition-safety`: **EXIT=0**.
- `npm run verify:tone-safety`: **EXIT=0**.
- `npm run verify:ambience`: **EXIT=0**.
- `npm run verify:wild`: **EXIT=0**.
- `npm run verify:ruta_de_dios`, `verify:arceus-portal` y `verify:canon:arceus`:
  **EXIT=0**.
- `verify:arceus:moves`, `verify:arceus:actions`, `verify:arceus:cinematics`,
  `verify:arceus:omega:qa`, `verify:arceus:sandbox`, `verify:arceus:assets`,
  `verify:arceus:recursos` y `verify:arceus:scope`: **EXIT=0** tras `npm ci`.

La columna `Resultado` del recorrido interactivo sólo se cambia después de
jugar una copia controlada en Game.exe/Kirin y guardar fecha, versión y mapa de
salida. La prueba estática no se presenta como sustituto de esa partida.
