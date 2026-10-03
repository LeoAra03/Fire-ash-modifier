# Paquete corregido, expansión «La Ruta de Dios» y «Dimensional Nightmare»

Esta carpeta contiene estas opciones listas para reemplazar sobre una copia de Pokémon Fire Ash 3.7.1:

- `Dimensional_Nightmare_QA.zip`: **paquete integral todo-en-uno (100 % teórico)**. Incluye `Scripts.rxdata` corregido con `PokeMod_RutaDeDios` y `DN_RuntimeSupport`, además de todos los mapas y recursos de Isla Espejo (`Map2001`–`Map2020`), Monte Silver (`Map2021`–`Map2030`), La Ruta de Dios (`Map513`, `Map625`, `Map2031`–`Map2038`) y **Dimensional Nightmare / Protector de la Ceniza** (`Map2040`–`Map2190`, 148 tilesets `DN_*`, sprites originales, 11 temas MIDI `DN_*.mid`, 142 NPCs con estados/memoria, 151 memorias, 151 estatuas/relieves, 13 Centros Pokémon y 13 Tiendas contextuales, 10 decisiones y combates de jefes con espejo real en EP05 y forma final en EP06).
- `Fire_Ash_Paquete_Directo.zip`: **paquete directo de La Ruta de Dios + correcciones base** listo para descomprimir sobre la carpeta del juego.
- `Scripts.rxdata`: archivo corregido de scripts base. Incluye las colisiones de sprites, la interacción con NPCs, la corrección de guardado para Android/Kirin, `La Ruta de Dios` y la corrección de Grandeur Club. También repara tonos serializados como texto (`Tone.new(...)`) antes de interpolarlos en pantalla o imágenes, evitando el `NoMethodError` de Kirin y conservando el efecto original cuando el tono se puede recuperar. Si un guardado antiguo deja `transition_name` en `nil`, usa la transición predeterminada al cambiar de mapa en lugar de generar un `TypeError`.
- `Paquete_directo/`: paquete directo sin comprimir.

## Instalación recomendada: ZIP completo

1. Cierra Fire Ash y Kirin.
2. Haz una copia de seguridad de tu carpeta original del juego, especialmente de `Data/Game.rxdata` o de tus partidas.
3. Descomprime `Fire_Ash_Paquete_Directo.zip` **dentro de la carpeta raíz de tu juego**, la que contiene `Game.exe` o `Game.ini`.
4. El ZIP ya trae las carpetas `Data`, `Graphics` y `Audio` en la raíz. Al extraerlo, acepta reemplazar los archivos existentes.
5. Inicia el juego y carga tu partida.
6. Si estabas dentro de Ciudad Puntaneva mientras copiabas los archivos, sal de la ciudad y vuelve a entrar para que el mapa se refresque.

El portal ahora es una recuperación segura: no depende del switch 870, así que también aparece en partidas antiguas donde la flag se perdió o se activó antes de instalar los mapas. La avenida celeste de Puntaneva abre un camino de cinco casillas entre los árboles hasta el templo. Después de hablar con el primer Volus de Pueblo Hojaverde, aparece un segundo Volus en esa avenida (`20,16`) para guiarte antes de entrar. La conversación de Volus continúa disponible como contexto narrativo.

La estructura final debe quedar así:

```text
TuFireAsh/Data/Scripts.rxdata
TuFireAsh/Data/Map625.rxdata
TuFireAsh/Graphics/Characters/ARCEUS_GATE.png
TuFireAsh/Audio/BGM/secretvolo.ogg
```

No dejes una carpeta intermedia como `TuFireAsh/Fire_Ash_Paquete_Directo/Data/`. **No reemplaces ni borres `Game.rxdata` ni tus archivos de partida.**

Si no puedes descomprimir ZIP desde Android, usa la carpeta `Paquete_directo/` y copia sus carpetas `Data`, `Graphics` y `Audio` sobre las equivalentes del juego.

### Archivos incluidos en `Paquete_directo/Data`

- `Scripts.rxdata`: scripts corregidos y código de la Ruta de Dios.
- `Map513.rxdata`: Volus en Pueblo Hojaverde.
- `Map625.rxdata`: portal en Ciudad Puntaneva.
- `Map2038.rxdata`: aproximación celestial larga, con terrazas, escaleras, santuarios, hitos y retorno a Puntaneva.
- `Map2030.rxdata`: Gruta de los Testigos de Monte Silver (siete puertas Unown y conexión con falda/cumbre).
- `Map2031.rxdata` a `Map2037.rxdata`: los siete pisos hasta Arceus.
- `MapInfos.rxdata`, `System.rxdata`, `map_metadata.dat` y `encounters.dat`: registro y datos necesarios para los mapas nuevos.

También se incluyen los sprites de Volus, Arceus, Dialga, Palkia y el portal, los cinco sprites de apoyo del combate automático (Cynthia, Steven, Ethan, Red y Volus) y las músicas usadas por el evento.

El ZIP se genera de forma reproducible con `npm run build:package` y se comprueba con `npm run verify:package`, que compara cada archivo del ZIP con `Paquete_directo/`. Si alguna vez se toca el paquete sin rehacer el ZIP, esa verificación falla.

## Cómo iniciar el evento de Arceus

1. Ve a **Pueblo Hojaverde / Twinleaf Town** y habla con **Volus**.
2. Si ofrece `Canalizar resonancia`, elige esa opción. Esto activa las 17 Tablas del Génesis y abre la ruta.
3. Regresa a **Ciudad Puntaneva / Snowpoint City**.
4. La antigua fachada del templo de Regigigas y el NPC que ocupaba la entrada fueron retirados para dejar una plaza nevada completamente libre.
5. El segundo Volus está aproximadamente en `X 20, Y 16` y te explica el ascenso.
6. El portal está delante de la plaza, aproximadamente en `X 20, Y 14`. Ponte frente al aro de luz y pulsa **Z**.
7. Junto al Charmeleon de la zona baja, aproximadamente en `X 19, Y 55`, encontrarás un Squirtle. Al hablarle podrás atravesar árboles únicamente mientras permanezcas en Ciudad Puntaneva. Al salir del mapa, el permiso se desactiva automáticamente.
8. El portal lleva primero a `Map2038`, una montaña larga de terrazas celestiales. Al llegar arriba podrás entrar a los siete pisos de la Ruta de Dios.

### Batalla divina de Arceus

Antes de que Ash tome el control, la cima muestra tres combates Pokémon reales y totalmente automáticos:

- Cynthia y Steven llegan como primer dúo y luchan en un doble 2v1 CPU vs CPU contra Arceus. Sus equipos completos entran, eligen movimientos, cambian, sufren estados, reciben daño y son debilitados por el motor normal.
- Gold/Eco y Red llegan como segundo dúo y repiten otro doble 2v1 CPU vs CPU, con paralización, Bola Luminosa, Megaevolución y Mewtwo. Ash no puede elegir movimientos, cambios, objetos ni huir.
- Volus aparece con Giratina Origen y disputa un combate individual CPU vs CPU. Arceus lo derrota inmediatamente, antes de que pueda convertirse en una batalla prolongada.
- Después de que los cinco entrenadores caen, Ash avanza con representaciones transparentes de sus Pokémon y declara que el duelo debe terminar.

La batalla de `Map2037` no es un combate salvaje normal:

- Arceus bloquea la huida y rompe visualmente el comando de escape con temblor y destello.
- Tiene seis fases persistentes. La ruleta de las 17 Tablas cambia su tipo y sus conjuntos de movimientos con distorsiones de pantalla.
- Sus fases incluyen poderes de Mega Evolución, Gigamax y Movimiento Z adaptados a las APIs disponibles en esta versión de Fire Ash, además de copiar temporalmente al Pokémon activo e invocar ecos legendarios como Mew y Giratina.
- Puede curar o revivir Pokémon del jugador como parte de su control de la realidad. También usa hasta tres Restaura Todo durante el desgaste.
- La captura vale exactamente 0%, incluso con Master Ball, hasta que termina la animación del último debilitamiento. Después de esa animación vale exactamente 100% y Arceus queda a 1 HP para que el lanzamiento tenga un objetivo válido.
- Cuando cae el equipo actual aparece `Debes continuar`. El pseudo-PC permite elegir hasta seis Pokémon capaces de las cajas **sin curarlos**. El combate retoma el mismo Arceus y su progreso de fase mientras queden reservas.
- Si se elige rendirse, hay temblores, destellos, mensajes de destrucción y entrenadores gritando; luego el flujo vuelve a `pbStartOver`. Ganar o capturar mantiene la secuencia posterior normal y el duelo de Volus.

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
