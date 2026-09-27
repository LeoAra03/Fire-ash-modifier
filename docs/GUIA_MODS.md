# Guía de mods con PokeMod Studio

Todo lo que sigue funciona igual en la **APK Android**, en **PC (Chrome/Edge)**
y en **modo lectura** (exportando ZIP). Si algo sale mal: Mods → Backups →
Restaurar. Tus partidas nunca se tocan.

## Cambiar un diálogo

1. Mapas → elige el mapa → toca el evento (o su chip).
2. En Eventos verás los comandos. Toca el comando **Texto**.
3. Edita y guarda. Pulsa **Guardar mapa**.
4. En Kirin habla con ese NPC: verás tu texto.

## Mover o cambiar un NPC

- Opción rápida: NPCs → Escanear → toca el NPC → cambia X/Y/sprite → Guardar.
- Opción completa: Eventos → nombre, posición, sprite (con vista previa),
  dirección, movimiento (fijo/aleatorio/acercar), disparador.

## Ver para qué sirve un flag (switch/variable)

1. Flags → busca el número o nombre.
2. Pulsa **Usos**: escanea todos los mapas y lista cada evento/página que
   lo lee o lo cambia. Toca un resultado para saltar a ese evento.
3. Puedes renombrar flags (se guarda en `System.rxdata`).

## Viajar a todos los mapas (Sala PokeMod)

1. Mods → **Sala PokeMod**: elige el mapa de la puerta, casilla X/Y y un
   sprite para la puerta.
2. **Crear Sala**: genera un mapa nuevo con una casilla por cada mapa del juego
   (solo destinos con suelo caminable verificado) + puerta de vuelta.
3. En Kirin entra por la puerta y pisa casillas para viajar.
4. Para quitarla: **Desinstalar** (restaura todo, borra el mapa sala).

## Editar Pokémon, encuentros y entrenadores (PBS)

1. Pokémon → elige archivo (`pokemon.txt`, `encounters.txt`, `trainers.txt`,
   `map_metadata.txt`, `items.txt`, `moves.txt`…).
2. Busca la especie/sección, edita el formulario (o el crudo por sección).
3. **Guardar**. PokeMod solo reescribe las líneas que tocaste.
4. Nota Essentials: los PBS se recompilan al arrancar el juego; si cambias
   muchas especies, arrancar puede tardar un poco la primera vez.

## Scripts (avanzado)

1. Mods → **Cargar scripts** → busca la sección.
2. Ver, ↓ exportar el `.rb`, edítalo fuera, ↑ importar, **Guardar Scripts**.
3. Siempre hay backup previo. Si el juego no arranca tras un cambio, restaura
   `Data/Scripts.rxdata` desde Backups.

## Compartir cambios / modo lectura

1. Edita normalmente; en modo lectura los cambios quedan "pendientes".
2. Mods o Inicio → **Exportar ZIP** → copia el ZIP al celular/PC.
3. Extrae el ZIP **sobre** la carpeta del juego (respeta las rutas).
4. El ZIP nunca incluye partidas.

## Consejos de seguridad

- Edita con Kirin **cerrado**.
- Un backup manual antes de una sesión larga: Mods → **Backup ahora**.
- Cambia una cosa cada vez y prueba en Kirin; así sabes qué rompió qué.
- No renombres archivos de `Graphics/` a mano: usa el Análisis profundo para
  detectar problemas de mayúsculas (en PC funcionan, en Android no).
