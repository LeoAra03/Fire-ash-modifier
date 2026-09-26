# Guía Kirin + PokeMod Studio

**Kirin** es el emulador nuevo para jugar RPG Maker XP (y fangames Pokémon con
Essentials, como Fire Ash) en Android **sin plugins**. PokeMod Studio es el
editor compañero: modifica mapas, eventos, NPCs y Pokémon de tu copia de
Fire Ash sin romperla y **sin tocar tus partidas**.

> Kirin está en alpha: la compatibilidad varía por juego y versión. PokeMod
> incluye un chequeo para detectar los problemas más comunes.

## 1. Instalar Fire Ash para Kirin

1. En PC (o en el celular con un buen descompresor), descarga Fire Ash 3.7.1:
   - `tools/download_game.py --full` (verifica SHA-1 y aplica el parche), o
   - los ZIP de [pokemonfireash.net/windows](https://pokemonfireash.net/windows/).
2. **Extrae el ZIP completo** (no juegues dentro del ZIP).
3. Copia la carpeta extraída al **almacenamiento interno** del celular, por ejemplo:
   `Almacenamiento interno/FireAsh/`. Evita la microSD (da lag y errores).
4. Debe verse así dentro:
   `Game.exe`, `Game.ini`, `Data/`, `Graphics/`, `Audio/`, `PBS/`.

## 2. Instalar Kirin

1. Descarga Kirin de su página oficial (`maxr99.itch.io/kirin-rpgmaker-xp-emulator-for-android`).
2. Instala el APK (permite "instalar apps desconocidas" solo para el instalador).
3. Abre Kirin → añade juego → elige la carpeta `FireAsh` → juega.

## 3. Instalar PokeMod Studio (APK editora)

1. Descarga `PokeMod-Studio-FireAsh.apk` desde los **Artefactos del Actions**
   de este repo (o la Release).
2. Instálala. Funciona en **ARM64 (chips Kirin/Snapdragon/Exynos)**,
   ARMv7 y x86_64: no lleva código nativo.
3. Ábrela → **Abrir carpeta de Fire Ash** → elige la MISMA carpeta que usa Kirin.
   El permiso se guarda; no hay que repetirlo.
4. (Opcional, en PC) abre `web/index.html` servida por HTTP, o usa Chrome/Edge
   con "Abrir carpeta (PC)".

## 4. Flujo de trabajo recomendado

1. **Juega con Kirin**, guarda tu partida normalmente (queda en la carpeta).
2. **Cierra Kirin** antes de editar (evita que pise archivos mientras editas).
3. **Edita con PokeMod**: diálogos, NPCs, PBS, o crea la **Sala PokeMod**
   (pestaña Mods) para viajar a todos los mapas.
4. PokeMod respalda cada archivo en `PokeModBackups/<fecha>/` antes de tocarlo.
5. **Vuelve a Kirin** y sigue jugando: tu partida sigue intacta.

## 5. Tus partidas están protegidas

- Las partidas viven en la carpeta del juego (`Save*.rxdata`).
- PokeMod **rechaza escribir o borrar** cualquier partida por diseño
  (lista `PROTECTED` en `web/js/fs.js`, más `pmDelete` que también las protege).
- Los backups (`backup ahora` / automáticos) SÍ copian las partidas para
  cuidarlas, pero nunca las modifican ni las incluyen en ZIPs de cambios.

## 6. Problemas típicos

| Síntoma | Causa probable | Solución |
|---|---|---|
| Pantalla negra al abrir en Kirin | ZIP sin extraer o `.rgssad` cifrado | Extrae en PC; usa el chequeo PokeMod |
| Falta música/sonido | MIDIs sin soporte | Normal en Android; no bloquea |
| Sprites/tiles invisibles | Mayúsculas distintas (`Hero.png` vs `hero.png`) | Pestaña Mods → Análisis profundo |
| Kirin no ve la carpeta | Permisos / microSD | Mueve a almacenamiento interno, re-otorga permiso |
| Edité y algo falló | Cambio incompatible | Mods → Backups → Restaurar archivo |

## 7. Notas sobre guardado y mods

- Añadir eventos/mapas (como la Sala PokeMod) **no rompe partidas viejas**.
- Borrar eventos que tu partida "recuerda" (self-switches) puede dar errores:
  PokeMod evita borrados masivos y todo es reversible vía backup.
- Los valores de interruptores/variables viven en la partida: PokeMod edita
  sus **nombres y usos**, no sus valores (así no hay riesgo).
