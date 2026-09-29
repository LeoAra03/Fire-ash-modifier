# Paquete corregido y expansión «La Ruta de Dios»

Esta carpeta contiene dos opciones:

- `Scripts.rxdata`: archivo corregido de scripts. Incluye las colisiones de sprites, la interacción con NPCs, la corrección de guardado para Android/Kirin, `La Ruta de Dios` y la corrección de Grandeur Club.
- `Paquete_directo/`: **paquete completo para copiar directamente a la carpeta original del juego**. Incluye los scripts, mapas, datos de mapas, sprites y músicas necesarios para que Volus y el portal de Arceus aparezcan.

## Instalación recomendada: paquete completo

1. Cierra Fire Ash y Kirin.
2. Haz una copia de seguridad de tu carpeta original del juego, especialmente de `Data/Game.rxdata` o de tus partidas.
3. Abre `Scripts_corregido/Paquete_directo/`.
4. Copia su contenido manteniendo la estructura de carpetas sobre la raíz de tu juego:

```text
Paquete_directo/Data/*       → TuFireAsh/Data/
Paquete_directo/Graphics/*   → TuFireAsh/Graphics/
Paquete_directo/Audio/*      → TuFireAsh/Audio/
```

5. Acepta reemplazar los archivos cuando Android/Kirin lo solicite.
6. Inicia el juego y carga tu partida.

También puedes copiar la carpeta `Paquete_directo` completa al lado de `pokemon_fire_ash` y después fusionar sus carpetas `Data`, `Graphics` y `Audio` con las del juego. **No reemplaces ni borres `Game.rxdata` ni tus archivos de partida.**

### Archivos incluidos en `Paquete_directo/Data`

- `Scripts.rxdata`: scripts corregidos y código de la Ruta de Dios.
- `Map513.rxdata`: Volus en Pueblo Hojaverde.
- `Map625.rxdata`: portal en Ciudad Puntaneva.
- `Map2031.rxdata` a `Map2037.rxdata`: los siete pisos hasta Arceus.
- `MapInfos.rxdata`, `System.rxdata`, `map_metadata.dat` y `encounters.dat`: registro y datos necesarios para los mapas nuevos.

También se incluyen los sprites de Volus, Arceus, Dialga, Palkia y el portal, además de las músicas usadas por el evento.

## Cómo iniciar el evento de Arceus

1. Ve a **Pueblo Hojaverde / Twinleaf Town** y habla con **Volus**.
2. Si ofrece `Canalizar resonancia`, elige esa opción. Esto activa las 17 Tablas del Génesis y abre la ruta.
3. Regresa a **Ciudad Puntaneva / Snowpoint City**.
4. Ve a la entrada norte del templo de Regigigas. El portal está aproximadamente en `X 20, Y 3`.
5. Ponte delante de la luz y pulsa **Z**.

Si Volus dice que la Ruta de Dios ya está abierta pero el portal no aparece, normalmente se copió solo `Scripts.rxdata` y no `Map625.rxdata`. En ese caso instala todo `Paquete_directo`, no únicamente el script.

## Opción de solo scripts

Si únicamente quieres la corrección de colisiones y guardado, copia:

```text
Scripts_corregido/Scripts.rxdata
```

sobre:

```text
TuFireAsh/Data/Scripts.rxdata
```

Pero esta opción por sí sola no puede añadir el portal ni los mapas de Arceus a una instalación que todavía tenga sus mapas originales.

## Importante

- Los eventos con `character_name` tienen colisión, pero siguen pudiendo activarse con el botón de acción.
- Los archivos auxiliares `PokemonSystemSettings.dat` y `GameSpeedSetting.dat` no se escriben, evitando el error `Errno::ENOENT` de Android/Kirin.
- No hace falta crear ni borrar la carpeta `Save Files`.
- No borres partidas, `Game.rxdata` ni `Scripts_bak.rxdata`.
- Este paquete corresponde a los datos de este repositorio; haz una copia de seguridad si tu instalación tiene modificaciones propias.
