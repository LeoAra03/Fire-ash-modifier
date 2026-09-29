# Paquete corregido y expansión «La Ruta de Dios»

Esta carpeta contiene estas opciones:

- `Scripts.rxdata`: archivo corregido de scripts. Incluye las colisiones de sprites, la interacción con NPCs, la corrección de guardado para Android/Kirin, `La Ruta de Dios` y la corrección de Grandeur Club.
- `Paquete_directo/`: paquete completo sin comprimir.
- `Fire_Ash_Paquete_Directo.zip`: **paquete completo listo para descomprimir sobre la carpeta del juego**. Es la opción recomendada para Android/Kirin.

## Instalación recomendada: ZIP completo

1. Cierra Fire Ash y Kirin.
2. Haz una copia de seguridad de tu carpeta original del juego, especialmente de `Data/Game.rxdata` o de tus partidas.
3. Descomprime `Fire_Ash_Paquete_Directo.zip` **dentro de la carpeta raíz de tu juego**, la que contiene `Game.exe` o `Game.ini`.
4. El ZIP ya trae las carpetas `Data`, `Graphics` y `Audio` en la raíz. Al extraerlo, acepta reemplazar los archivos existentes.
5. Inicia el juego y carga tu partida.
6. Si estabas dentro de Ciudad Puntaneva mientras copiabas los archivos, sal de la ciudad y vuelve a entrar para que el mapa se refresque.

El portal ahora es una recuperación segura: no depende del switch 870, así que también aparece en partidas antiguas donde la flag se perdió o se activó antes de instalar los mapas. La conversación de Volus continúa disponible como contexto narrativo.

La estructura final debe quedar así:

```text
TuFireAsh/Data/Scripts.rxdata
TuFireAsh/Data/Map625.rxdata
TuFireAsh/Graphics/Characters/ARCEUS.png
TuFireAsh/Audio/BGM/secretvolo.ogg
```

No dejes una carpeta intermedia como `TuFireAsh/Fire_Ash_Paquete_Directo/Data/`. **No reemplaces ni borres `Game.rxdata` ni tus archivos de partida.**

Si no puedes descomprimir ZIP desde Android, usa la carpeta `Paquete_directo/` y copia sus carpetas `Data`, `Graphics` y `Audio` sobre las equivalentes del juego.

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
