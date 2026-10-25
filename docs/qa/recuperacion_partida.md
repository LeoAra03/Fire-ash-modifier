# Protocolo de recuperación de partida

Qué hacer si el juego no arranca la partida guardada, si el archivo se corrompió
o si una versión nueva no la lee. Escrito para seguirse sin conocimientos
técnicos: cada paso dice qué se toca y qué se espera ver.

## Cómo guarda el juego (para no tocar lo que no hay que tocar)

- La partida vive en **un solo archivo**: `Game.rxdata`, dentro de la carpeta del
  juego (junto a `Game.exe`, `Data/`, `Graphics/` y `Audio/`).
- En Android/Kirin el juego corre desde la carpeta que el usuario elige; el
  archivo es el mismo `Game.rxdata` en esa carpeta.
- **No hace falta** crear ni borrar la carpeta `Save Files` (ver
  [`../INSTALAR_Y_JUGAR.md`](../INSTALAR_Y_JUGAR.md)).
- El juego **no** crea copias automáticas de la partida del jugador. La copia de
  seguridad es el **paso 0** de este protocolo: si no la haces tú, no existe.

## Paso 0 — Copia antes de tocar nada

1. Cierra el juego por completo (en Android: quítalo de la lista de apps
   recientes).
2. Copia `Game.rxdata` a otro sitio **fuera** de la carpeta del juego y cámbiale
   el nombre a `Game.rxdata.manual-AAAA-MM-DD` (o similar).
3. Comprueba que la copia pesa lo mismo que el original. Si no, vuelve a
   copiarla: una copia a medias no sirve.

Todo lo que sigue se hace **sobre la copia**, nunca sobre el único archivo que
queda.

## Paso 1 — Distinguir «no arranca» de «se corrompió»

| Síntoma | Qué suele ser | Paso |
|---|---|---|
| El menú de carga está vacío | el juego no encuentra `Game.rxdata` | 2 |
| El juego se cierra al elegir la partida | archivo cortado o de otra versión | 3 |
| Carga, pero el mapa se ve negro o el jugador cae al vacío | datos de mapa, no la partida | 4 |
| Carga y se pierde el progreso de un capítulo | versión de scripts distinta | 3 |

## Paso 2 — Que el juego encuentre el archivo

1. Verifica que `Game.rxdata` está **en la misma carpeta** que `Game.exe`
   (o que la carpeta elegida en Android).
2. Comprueba el nombre exacto: `Game.rxdata`, sin `(1)`, sin `.bak` pegado y sin
   mayúsculas cambiadas.
3. Arranca y abre el menú de carga. Si aparece la partida, termina aquí.

## Paso 3 — Partida cortada o de otra versión

1. Vuelve a la copia del paso 0.
2. Instala **la misma versión** del juego con la que se creó la partida
   (mismo paquete de scripts). Una partida de una versión no siempre se lee en
   otra.
3. Si el juego arranca, guarda en una ranura distinta antes de seguir jugando.
4. Si sigue sin arrancar, la partida no es recuperable en esta versión: conserva
   el archivo y repórtalo con el síntoma exacto en la ficha de sesión.

## Paso 4 — El mundo se ve mal pero la partida carga

Esto no es un problema de la partida sino de los datos del juego (mapas,
tilesets o gráficos):

1. Reinstala los archivos de datos desde el paquete oficial
   (`Scripts_corregido/Fire_Ash_Paquete_Directo.zip`), que se descomprime sobre
   la raíz del juego **sin** tocar `Game.rxdata`.
2. Si el problema empezó tras cambiar mayúsculas o nombres de archivo, conserva
   siempre la variante **minúscula `.png`**: es la que el motor pide por defecto
   (ver [`kirin_check.md`](kirin_check.md)).
3. Arranca y carga la partida otra vez.

## Qué no hacer

- No borres `Game.rxdata` para «empezar limpio» si aún no tienes copia: es la
  única copia de la partida.
- No uses herramientas que reescriban el archivo sin hacer antes el paso 0.
- No mezcles versiones de scripts con partidas antiguas y luego vuelvas atrás:
  cada guardado puede arrastrar el estado de la versión nueva.

## Si nada funciona

Adjunta a la ficha de la sesión: el síntoma, el paso donde falló, el tamaño de
`Game.rxdata`, la versión (commit o nombre del paquete) y las capturas. Sin esos
datos el reporte no se puede reproducir.

---

Verificado por `npm run verify:plan2700:tanda24`: el documento existe, tiene los
pasos numerados y declara que el juego no crea copias automáticas.
