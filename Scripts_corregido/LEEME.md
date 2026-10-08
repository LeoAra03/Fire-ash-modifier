# Paquete corregido, «La Ruta de Dios», «Dimensional Nightmare» y «Expansión Multiversal»

## Corrección de arranque del 2026-10-07 (error «undefined class/module RPG::MapMetadata»)

Si al abrir el juego veías este cuadro:

```text
Script '<internal:marshal>' line 34: ArgumentError occurred.
undefined class/module RPG::MapMetadata
```

la causa era que los `map_metadata.dat` distribuidos hasta ahora traían 829
entradas serializadas como `RPG::MapMetadata` (clase de Essentials v16 que los
scripts de Fire Ash, modelo v19 con `GameData::MapMetadata`, nunca definen).
Ruby abortaba al hacer `load_data` en el arranque, antes del título.

Los ZIP de esta carpeta ya incluyen la corrección (`tools/repair_map_metadata_classes.mjs`
convierte cada entrada a `GameData::MapMetadata`, y `tools/validate_boot_classes.mjs`
verifica que ninguna clase serializada de ningún `.dat`/`.rxdata` distribuido
quede sin definir en los scripts).

**Si ya tenías instalado un paquete anterior:** vuelve a extraer el ZIP encima
de la raíz del juego, o como mínimo reemplaza `Data/map_metadata.dat` y
`Data/Scripts.rxdata` por los del ZIP nuevo. No toques tus partidas.

Además, desde esta versión los movimientos de campo (Corte, Flash, Surf…)
**no piden medalla ni MO**: si el Pokémon conoce el movimiento por MT, funciona
(`BADGE_FOR_* = -1` en los tres `Scripts.rxdata`).

## Nuevo: Ciudad Teckel, Isla Paraíso y MAXINE (rediseño de la Isla Espejo)

`Fire_Ash_Ciudad_Teckel_Paraiso.zip` aplica el rediseño pedido para la Isla
Espejo y la Dimensión Atlas:

- **Atlas concentra lo extraordinario**: los 20 Pokégods y las versiones
  alternativas de personajes conocidos (antes «Mirror Boss» de Isla Espejo)
  quedan repartidos por los mapas Tier 1 del Atlas, y cada personaje
  alternativo usa un sprite recoloreado propio (`Graphics/Characters/ALT_*`).
- **Map 997 = Ciudad Teckel**: perros Pokémon (Zigzagoon, Poochyena,
  Growlithe, Eevee…) deambulan libres por la ciudad; veterinaria que cura,
  gimnasio y muelle.
- **Map 998 = Gimnasio Teckel**: la líder **Duna** entrega la **Medalla Pata**.
- **Map 999 = Afueras Teckel**: prado con encuentros de perros.
- **Map 2300 = Isla Paraíso**: altar de **MAXINE, la Legendaria Florateck**
  (nivel 125, tipo Planta/Hada), con su osito de peluche.

Flujo: tras cerrar la Ruta de Dios, el **Profesor Atlas** (Puerto Horizonte,
Atlas Mil) entrega el **Ticket Paraíso**; con la Medalla Pata de Duna, en Isla
Paraíso la **Guardiana Nira** pregunta «¿qué le gusta más a MAXINE, el pollo o
la pata?» — la respuesta correcta es **la pata** — y MAXINE despierta para el
combate/captura. Instala este ZIP después del Paquete Directo y del DN QA.

Esta carpeta contiene estas opciones listas para reemplazar sobre una copia de Pokémon Fire Ash 3.7.1:

- `Dimensional_Nightmare_QA.zip`: **paquete integral todo-en-uno (100 % teórico)**. Incluye `Scripts.rxdata` corregido con `PokeMod_RutaDeDios` y `DN_RuntimeSupport`, además de todos los mapas y recursos de Isla Espejo (`Map2001`–`Map2020`), Monte Silver (`Map2021`–`Map2030`), La Ruta de Dios (`Map513`, `Map625`, `Map2031`–`Map2038`) y **Dimensional Nightmare / Protector de la Ceniza** (`Map2040`–`Map2190`, 148 tilesets `DN_*`, sprites originales, 11 temas MIDI `DN_*.mid`, 142 NPCs con estados/memoria, 151 memorias, 151 estatuas/relieves, 13 Centros Pokémon y 13 Tiendas contextuales, 10 decisiones y combates de jefes con espejo real en EP05 y forma final en EP06).
- `Fire_Ash_Paquete_Directo.zip`: **paquete directo de La Ruta de Dios + correcciones base** listo para descomprimir sobre la carpeta del juego.
- `Scripts.rxdata`: archivo corregido de scripts base. Incluye las colisiones de sprites, la interacción con NPCs, la corrección de guardado para Android/Kirin, `La Ruta de Dios` y la corrección de Grandeur Club. También repara tonos serializados como texto (`Tone.new(...)`) antes de interpolarlos en pantalla o imágenes, evitando el `NoMethodError` de Kirin y conservando el efecto original cuando el tono se puede recuperar. Si un guardado antiguo deja `transition_name` en `nil`, usa la transición predeterminada al cambiar de mapa en lugar de generar un `TypeError`.
- `Fire_Ash_Expansion_Multiversal.zip`: **Expansión Multiversal**, el arco posterior a La Ruta de Dios. Siete grietas purgables en Kanto y Johto, punto de colapso en la Torre Pokémon, Liga Oscura (mapas 2192 y 2193), expedición a Atlas Mil desde el puerto de Ciudad Carmín y el espejo del sótano de la Mansión Pokémon que abre la Isla Espejo con sus doce Pokégods. Incluye sus mapas (`Map2191`–`Map2194`), los mapas de Kanto y Johto con grietas, las salidas nuevas del Monte Silver, `trainers.dat`, `species.dat`, los sprites y gritos de los Pokégods y el laboratorio de Oak sin la cápsula nueva.
- `Expansion_Multiversal/`: paquete de la Expansión Multiversal sin comprimir.
- `Paquete_directo/`: paquete directo sin comprimir.

## Orden de instalación recomendado

1. `Fire_Ash_Paquete_Directo.zip` (base corregida y La Ruta de Dios).
2. `Dimensional_Nightmare_QA.zip` (Pesadilla Dimensional, opcional pero recomendado).
3. `Fire_Ash_Expansion_Multiversal.zip` (Expansión Multiversal, el arco final).

Cada ZIP se extrae en la raíz del juego, junto a `Game.exe`, aceptando reemplazar.

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
- Tiene seis fases persistentes. La ruleta de las 17 Tablas cambia su tipo y sus conjuntos de movimientos con distorsiones de pantalla; cada fase conserva el máximo de cuatro movimientos que soporta el motor (incluido el set inicial y el jefe de las escenas automáticas), evitando estados inválidos durante las acciones.
- Sus fases incluyen poderes de Mega Evolución, Gigamax y Movimiento Z adaptados a las APIs disponibles en esta versión de Fire Ash, además de copiar temporalmente al Pokémon activo e invocar ecos legendarios como Mew y Giratina.
- Puede curar o revivir Pokémon del jugador como parte de su control de la realidad. También usa hasta tres Restaura Todo durante el desgaste.
- La captura vale exactamente 0%, incluso con Master Ball, hasta que termina la animación del último debilitamiento. Después de esa animación vale exactamente 100% y Arceus queda a 1 HP para que el lanzamiento tenga un objetivo válido.
- Cuando cae el equipo actual aparece `Debes continuar`. El pseudo-PC permite elegir hasta seis Pokémon capaces de las cajas **sin curarlos**. El combate retoma el mismo Arceus y su progreso de fase mientras queden reservas.
- Si se elige rendirse, hay temblores, destellos, mensajes de destrucción y entrenadores gritando; luego el flujo vuelve a `pbStartOver`. Ganar o capturar mantiene la secuencia posterior normal y el duelo de Volus.

Si Volus dice que la Ruta de Dios ya está abierta pero el portal no aparece, normalmente se copió solo `Scripts.rxdata` y no `Map625.rxdata`. En ese caso instala todo `Paquete_directo`, no únicamente el script.

## Techo de nivel: 175

Todos los Pokémon pueden subir hasta **nivel 175**. Hay dos excepciones deliberadas por encima del techo, y ninguna de las dos se puede encontrar por casualidad:

- **Arceus de La Ruta de Dios: nivel 200.** Es el único Pokémon del juego que lo alcanza.
- **Mad Pikachu: nivel «???».** No se puede vencer por fuerza: hace falta que Arceus lo devuelva al límite o sostener el vínculo contra él en la Liga Oscura.

El techo se instala en los dos `Scripts.rxdata` — el del juego y el de esta carpeta — y se verifica en los dos. La búsqueda por nivel de las cajas ya llega hasta 175 en vez de parar en 100.

## Regiones: Glazed, Light Platinum y Team Rocket

Después del duelo de Arceus, las tres dimensiones dejan de ser dos habitaciones con un gimnasio y pasan a ser regiones que se recorren, con sus rutas de ida y vuelta, sus pobladores y sus encuentros salvajes.

**Glazed (mapas 2260-2265).** Afueras de Cedolán, la ciudad de Cedolán, la Cueva Glaciar y tres interiores. Nieve con niebla propia, clima de nieve en el exterior y la cueva marcada como oscura.

**Light Platinum (mapas 2270-2275).** Senda Luminosa, la ciudad costera, la zona safari y tres interiores. Costa con bruma y horizonte a varias velocidades.

**Team Rocket (mapas 2280-2286).** Siete salas de infiltración industrial: muelle, vestíbulo de reclutas, pasillo, fábrica, almacén, enfermería y sala de comunicaciones. El polvo en suspensión cubre los dos mapas de la base, y en la sala de comunicaciones una alarma roja late sobre el mapa entero.

Se entra como en el canon: **Glazed y Light Platinum por barco**, desde los puertos; **Team Rocket** como infiltrado. Ninguna de las tres atrapa: siempre se puede volver.

### El disfraz del Team Rocket

En la base, Ash no pasea: se infiltra. Habla con el **Intendente Norbert** (en la base subterránea) o con la **Armera Violeta** (en el vestíbulo de reclutas) para ponerte el uniforme. Al hacerlo cambian a la vez tu sprite en el mundo, la música de combate y los sprites de batalla — porque lo que cambia es tu tipo de entrenador — y los centinelas dejan de cortarte el paso. Puedes volver a tu ropa cuando quieras, hablando otra vez con quien te lo dio.

El uniforme es una entrada de jugador nueva: `player_A` y `player_B`, los originales, siguen exactamente igual.

## Visor de medallas región por región

En la **información del jugador** (Tarjeta de Entrenador) las medallas ya no enseñan solo la región actual: con **◀ / ▶** se recorren 15 regiones, cada una con sus 8 huecos de medalla, igual que las regiones base de Fire Ash:

1. Las nueve regiones base del juego (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar y Orange), con el cableado de medallas que ya tenía el juego.
2. **Glazed**, **Light Platinum** y **Liquid Crystal**: sus 8 medallas se encienden al tenerlas en la Mochila. Ya se pueden ganar en el juego: cada campaña coloca 8 líderes de gimnasio (ver «Líderes de las campañas») que entregan su medalla al vencerlos.
3. **Creepypastas**: los 8 huecos se encienden con los sellos de los jefes del multiverso (switches 940-947, incluido el campeón de Monte Silver).
4. **Dimensión Atlas**: las 8 medallas de elemento (Bruma, Veta, Duna, Fragua, Marea, Venta, Flora y Chispa).
5. **Ciudad Teckel**: la Medalla Pata de Duna.

La hoja `Graphics/Pictures/Trainer Card/icon_badges.png` crece de 9 a 15 filas con emblemas nuevos por región (escarcha Glazed, platino, cristal, púrpura creepypasta, oro Atlas y hueso Teckel). Los huecos sin medalla obtenida quedan vacíos, como en las regiones base.

## Líderes de las campañas (Glazed, Light Platinum, Liquid Crystal y Team Rocket)

Las cuatro campañas completas adaptadas (`content/rom_campaigns_complete.json`: 807 mapas, 5516 NPC, 3252 warps y 1059 combates) ya vivían en el juego desde los mapas 3000-3949, pero ninguna entregaba medallas. Ahora cada campaña tiene **8 líderes de gimnasio** repartidos a lo largo de su recorrido, con equipo temático de nivel 85-120 y página de revancha sellada:

- **Glazed** — Celsa, Nivia, Boreas, Crisal, Viska, Polar, Nevara y Albor entregan las 8 medallas Glazed.
- **Light Platinum** — Lumen, Ondina, Farón, Alba, Céfiro, Coral, Brillo y Aurora entregan las 8 medallas Platinum.
- **Liquid Crystal** — Crista, Prisma, Faceta, Cuarzo, Jade, Ámbar, Ópalo y Zafira entregan las 8 medallas Crystal.
- **TFOH (Team Rocket)** — ocho ejecutivos (Kuro, Vex, Mal, Nox, Umbra, Lis, Grajo y el Jefe Sombra) cierran la campaña de infiltración; no sueltan medalla, sueltan ruta.

Cada victoria queda registrada en los switches 700-731 y, en las campañas de medallas, el objeto-medalla entra a la Mochila y enciende su hueco en el visor de la Tarjeta de Entrenador.

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
