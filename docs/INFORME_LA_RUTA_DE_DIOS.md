# Informe Técnico: Expansión Maestra «La Ruta de Dios»

## 1. Visión General
**«La Ruta de Dios»** es una expansión postgame de escala mítica integrada en la región de Sinnoh. Está inspirada en el Monte Olimpo y en la arquitectura sagrada de la Columna Lanza del Monte Corona, estructurada en un ascenso de **7 pisos** monumentales que culminan en el **Altar del Origen**, donde aguarda el **Creador del Universo: Arceus a Nivel 200 con IVs perfectos (31 en todas las estadísticas)**, siendo el único Pokémon de todo el juego en alcanzar dicho nivel.

---

## 2. Activación del Evento (Pueblo Hojaverde)
- **Ubicación:** Pueblo Hojaverde / Twinleaf Town (`Map513.rxdata`), en las coordenadas centrales `(18, 14)`.
- **NPC:** **Volus de Hisui** (sprite `SECRET_Volo`).
- **Condición de activación:** Estado de postgame y posesión de las **17 Tablas del Génesis** de Arceus (`:FLAMEPLATE`, `:SPLASHPLATE`, `:ZAPPLATE`, `:MEADOWPLATE`, `:ICICLEPLATE`, `:FISTPLATE`, `:TOXICPLATE`, `:EARTHPLATE`, `:SKYPLATE`, `:MINDPLATE`, `:INSECTPLATE`, `:STONEPLATE`, `:SPOOKYPLATE`, `:DRACOPLATE`, `:DREADPLATE`, `:IRONPLATE`, `:PIXIEPLATE`).
- **Diálogo y cinemática:**
  - Volus observa la Mochila de Ash y cae en el asombro más absoluto: *«¡¿Es... es imposible?! ¡Tienes contigo TODAS las 17 Tablas del Génesis! ¡Es una oportunidad entre una infinidad! ¡El mito primordial ha despertado!»*.
  - La conversación es interrumpida abruptamente por un **colosal terremoto cósmico** (temblor de pantalla de intensidad 6, sonido de trueno y destello de luz).
  - Volus anuncia que el velo de los dioses se ha rasgado y que en la entrada del templo de **Ciudad Puntaneva (Snowpoint City)** se ha manifestado la fractura hacia la Cima del Mundo.
  - *Facilidad de acceso:* Si el jugador aún no posee todas las tablas, Volus le indica cuántas tiene (`X/17`) y le ofrece canalizar la resonancia de las eras para que despierten en su Mochila inmediatamente.

---

## 3. Acceso en Ciudad Puntaneva
- **Ubicación:** Ciudad Puntaneva (`Map625.rxdata`), en las coordenadas `(20, 14)`, justo delante de la entrada del antiguo templo de Regigigas, en una casilla transitable.
- **Plaza de acceso:** se retiraron la fachada del antiguo templo de Regigigas y el NPC que ocupaba la entrada. El espacio queda libre y nevado, sin un edificio bloqueando el portal.
- **Avenida celeste:** se despejó una calzada natural entre los árboles, desde la zona central de la ciudad hasta la plaza, sin franjas grises artificiales. La ruta conserva los árboles en los flancos.
- **Segundo Volus:** aparece en `(20, 16)` solo después de hablar con el Volus de Pueblo Hojaverde y activar el switch 870. Explica el significado de la montaña, las balizas y el camino antes de que el jugador entre.
- **Squirtle de paso:** junto al Charmeleon de la zona baja (`19,55`), el evento activa el switch temporal 877. Un parche de `Game_Player` permite cruzar únicamente celdas de árbol en el mapa 625; `Game_Map#setup` lo apaga al cargar cualquier mapa, por lo que no atraviesa árboles en otras ciudades ni conserva el permiso al regresar.
- **Portal:** aro de luz celestial animado (`ARCEUS_GATE.png`), visible incluso si una partida antigua perdió el switch 870.
- Al interactuar, transporta al jugador a la aproximación larga (`Map2038`, 26, 68), no directamente al primer piso.

---


> **Asignación de IDs:** la aproximación celestial está en `Map2038`; los siete pisos siguen en `Map2031–Map2037`. `Map2030` se reserva para la **Gruta de los Testigos** de Monte Silver.

## 4. Aproximación Celestial (`Map2038`)
La entrada conduce a una montaña de **52×72 casillas**, con una avenida serpenteante de cinco casillas, cuatro cambios de nivel con escaleras talladas, bosques de pinos escarchados, praderas de encuentros, pozas cósmicas, santuarios laterales, hitos de las Regiones/Origen/Vínculo y retorno seguro a Puntaneva. En la cima hay una puerta de transición hacia `Map2031`. La composición busca que la zona se sienta como un resumen sagrado de toda la franquicia Pokémon, sin reducirla a una sola región.

---

## 5. Estructura de los 7 Pisos (Arquitectura Olímpica y Monte Corona)

Todos los mapas han sido construidos con las paletas y reglas de diseño arquitectónico auténticas de **Monte Corona Pasado (`Map990`)**, **Columna Lanza (`Map970`)** y las **Ruinas Blancas (`Map771`)**:
- **Acantilados Escalonados del Monte Corona (`1249..1273`):** Cornisas superiores sombreadas, fachadas de roca viva y cornisas inferiores, con escaleras de piedra tallada (`1243`) transitables sobre suelo de basalto (`1257`).
- **Plataformas de Mármol Sagrado (`4400..4418`):** Tarimas ceremoniales de mármol blanco con bordes labrados curvos y escalinatas de plata y piedra (`1161..1162`).
- **Columnata de Estatuas Guardianas Colosales (`4307` / `4315`):** Estatuas de dos piezas de bestias sagradas y dragones ancestrales sobre pedestales grabados con inscripciones míticas.
- **Bosques de Pinos Escarchados de Sinnoh (`4480..4497`):** Árboles perennes cubiertos de nieve agrupados orgánicamente con profundidad en los flancos de la cordillera.
- **Hierba Nevada Silvestre (`447`):** Hierba con etiqueta de terreno 2 (`:Grass`), que activa encuentros salvajes y animación de crujido en la nieve.
- **Pozas Celestiales y Portales Cósmicos (`4430..4463`):** Fuentes de agua mística y arcos de distorsión azul zafiro.
- **Sprites Oficiales de Overworld:** Sprites canónicos para **Dialga (`DIALGA.png`)**, **Palkia (`PALKIA.png`)** y **Arceus (`ARCEUS.png`)**.

| Piso | Mapa | Dimensiones | Nombre | Descripción y Encuentros |
| :--- | :--- | :---: | :--- | :--- |
| **1F** | `Map2031` | 40×40 | **Puerta de las Columnas** | Estribaciones alpinas con bosques de pinos escarchados, doble columnata de estatuas guardianas en pedestal, praderas de hierba nevada y tarima de mármol al norte. Combate contra **Maya / Dawn** (Lv. 130). Ítem oculto: Caramelo Raro. |
| **2F** | `Map2032` | 40×40 | **Sendero de los Titanes** | Meseta escarpada de vientos eternos, monolitos ancestrales y arena de combate de piedra basalto. Combate contra **Jericor / Palmer** y diálogo con **Benito / Barry** (Lv. 135). Ítem oculto: Revivir Máximo. |
| **3F** | `Map2033` | 42×42 | **Terraza del Aura** | Cañón flanqueado por altos riscos de roca, tarima de mármol del aura, pozas de agua cósmica y estatuas guardianas. Combate contra **Quinoa / Riley** (Lv. 140). Ítem oculto: Más PP. |
| **4F** | `Map2034` | 42×42 | **Baluarte Celestial** | Calzada procesional de los campeones flanqueada por estatuas monumentales, columnas quebradas y gran corte de mármol. Combate contra la **Campeona Cintia / Cynthia** (Lv. 145). Ítem oculto: Ceniza Sagrada. |
| **5F** | `Map2035` | 38×38 | **Santuario del Tiempo** | Altar temporal sobre acantilados del Monte Corona. **Guardián Dialga Primordial (Lv. 150)** con sprite visible sobre la tarima del tiempo bloqueando el paso. Al caer, el tiempo se restaura y Dialga se desvanece. Ítem oculto: Parte Cometa. |
| **6F** | `Map2036` | 38×38 | **Santuario del Espacio** | Altar espacial con pozas cósmicas que reflejan las dimensiones. **Guardián Palkia Primordial (Lv. 150)** con sprite visible sobre la tarima espacial. Al caer, las dimensiones se alinean y Palkia se disuelve. Ítem oculto: Cápsula Habilidad. |
| **7F** | `Map2037` | 46×46 | **Cima del Génesis** | El Olimpo de la Creación sobre la estratósfera. Gran avenida procesional con 10 estatuas colosales, pórticos cósmicos gemelos, Altar del Solsticio Dorado y el Ser Supremo **ARCEUS (Nivel 200)** con sprite visible sobre el Altar del Origen. Duelo clímax posterior contra **Volus**. Ítem oculto: Chapa Dorada. |

---

## 6. Cinemática de Arceus y Combate contra Dios
Al alcanzar el Altar del Origen en la Cima del Génesis (`Map2037`, 23, 10):
1. **Puesta en escena:** La música se eleva con el tema sagrado *Legend Sinnoh*. La pantalla tiembla violentamente (intensidades 6, 7 y 8) con relámpagos divinos.
2. **Cuestionamiento del Viaje:**
   - Arceus contempla a Ash: *«Dime... ¿Por qué caminas? ¿Por qué desafías las leyes de la existencia? ¿Acaso crees que coleccionar criaturas y doblegar voluntades te otorga el derecho de pararte ante la Consciencia Primordial?»*.
   - Habla de las leyendas que Ash ha enfrentado a lo largo de su viaje (las aves de Kanto, los señores del magma y del océano en Hoenn, los dragones de las dimensiones).
3. **La Revelación de las Copias:**
   - Arceus confiesa con severidad: *«¿Crees que aquellos a los que llamaste 'Dialga', 'Palkia' o 'Arceus' en tus viajes eran la plenitud de nuestro ser? ¡Ingenuo! Me esforcé durante eones en dejar fragmentos, ecos y copias atenuadas de mí mismo y de mis guardianes a lo largo y ancho del cosmos... ¡Específicamente para evitar esto! Para que ningún mortal fuera capaz de despertar el núcleo original ni perturbar el descanso del Arquitecto.»*.
4. **El Cataclismo Final:**
   - *«Y sin embargo... reuniste las diecisiete Tablas del Génesis. No he descendido para coronarte campeón. He venido a desatar el Cataclismo Final. La existencia de esta línea temporal ha excedido su propósito. ¡Desaparece ante el juicio del Creador!»*.
5. **Prólogo de apoyo coreografiado (una sola vez, R7):** Cynthia y Steven caminan desde la avenida hasta el altar, aparecen juntos como entrenadores y disputan un doble 2v1; tras caer, caminan de vuelta y desaparecen. Red y Gold llegan después por el mismo sendero, ocupan sus marcas y combaten en otro doble 2v1; Volus entra al final contra Arceus con Giratina Origen. Se conserva `PokeBattle_Battle`, `pbBattleAnimation`, sprites, cries y animaciones del motor; ambos bandos usan selección de movimientos y reemplazos guionados, la precisión de Arceus está asegurada y un PRNG local sembrado fija los demás resultados. En el prólogo Arceus es **intocable**: ningún ataque, golpe crítico, clima (la nieve de la cumbre ya no entra al combate como granizo), retroceso, habilidad, movimiento custom ni escritura directa de PS mueve su barra; el aura dorada absorbe el golpe, y sólo un intento que habría sido letal provoca su burla. Un setter de PS protegido y un respaldo en `pbFaint` garantizan que ni Metagross ni ninguna ruta externa cierren la escena con una derrota del Creador. Cada ataque suyo sigue retirando al Pokémon activo. La sección de compatibilidad también restaura los ayudantes `PokeBattle_Battler#selfProtected?` y `#sideProtected?` que el motor no define y que la sección «Despacito Despair» usaba en `PokeBattle_Move_DF08` (Ball Breaker, el movimiento de dos turnos de acero del Metagross de Steven): sin ellos, cualquier uso del movimiento abortaba el combate con `NoMethodError: undefined method 'selfProtected?' for an instance of PokeBattle_Battler`. El efecto del movimiento se reescribe además para no depender de esos ayudantes ni de `pbOwnSide`. `battle.controlPlayer = true`, `canRun = false`, `expGain = false` y `moneyGain = false` bloquean la intervención de Ash sin tocar `$Trainer.party`, el compañero global ni el guardado. El switch 881 (`RUTA_DE_DIOS_PRELUDE_SEEN`) evita repetir los tres combates tras cada reintento. Desde R8, la primera vez que arranca el evento aparece además la elección **«Ver el prólogo completo / Ir directo al duelo con Arceus»**: la segunda opción marca el switch y salta directamente al combate final, porque Ash ya estudió esas batallas (`saltar_prologo` en `pbStartArceusDivineBattle`).
6. **Combate Divino:**
   - **Nivel 200**, IVs 31 en todo, Tabla Legendaria / Multitipo.
   - Movimientos: *Sentencia*, *Distorsión*, *Corte Vacío*, *Golpe Umbrío*.
   - **Seis etapas de resistencia:** cada etapa tiene una barra de HP completa. El mismo Arceus conserva fase, barras agotadas y curaciones al cambiar de equipo; la transición sólo se produce cuando una barra llega a cero. Las etapas 2–6 restauran la barra completa y aumentan estadísticas, poder y nivel de Arceus. La fase 4 copia visualmente al Pokémon activo, pero conserva la identidad y la protección divina; la fase 5 muestra el eco de Mew y la 6 a Giratina Origen.
   - **Ruleta real de las 17 Tablas:** los iconos de las Tablas orbitan en pantalla y la animación se detiene arriba, en el tipo más ventajoso contra el equipo activo. Arceus adapta su tipo y objeto en ese instante; los empates se resuelven de forma reproducible. El hook de canon se ejecuta en cada cambio de etapa y no reemplaza la Tabla estratégica elegida.
   - **Arsenal y niveles adaptativos:** en cada turno, Arceus evalúa los ataques del catálogo completo del juego y equipa los cuatro con mayor daño esperado. Cambia también su nivel de combate y el de Ash por etapa. Es inmune a estados, confusión, atracción, retroceso de estadísticas y efectos equivalentes.
   - **Curación exclusiva de Arceus (R9):** al entrar en rojo, sólo Arceus se restaura, y desde R9 recupera **media barra** (una vez por etapa) en lugar de la barra completa: el avance del jugador ya no se borra. La curación se narra dentro del combate, no revive ni cura Pokémon del equipo de Ash y no depende de Restaurar Todo aleatorios.
   - **Barras del Génesis:** un ataque multigolpe no puede agotar más de una barra en la misma acción. Los golpes críticos no saltan etapas: deben agotarse seis barras completas. Tras vaciar la sexta, Arceus queda visualmente a 1 PS y habilita una captura determinista del 100%; las bolas están bloqueadas antes de ese punto.
   - **Duelo jugable (R8/R9):** el combate final ya no es una derrota anunciada. Ash elige sus comandos en el bucle normal del motor (sólo el lado de Arceus está guionizado) y **su lado abre cada ronda**: `pbCalculatePriority` reordena `@priority` poniendo primero a los Pokémon del jugador dentro del duelo divino, incluso con el Espacio Raro de la Etapa 4 activo. **Arceus no puede derribar de un solo golpe a un Pokémon de Ash:** `ruta_arceus_apply_ohko_guard` topa cada acción enemiga en **un tercio de la vida máxima** del objetivo (multi-impactos y movimientos de KO incluidas, porque todos pasan por `pbReduceDamage`), de modo que un Pokémon sano aguanta **cuatro acciones** de Arceus; si el Pokémon ya entró al turno por debajo de ese tercio, sí puede caer. **Los golpes de Ash cuentan de verdad:** `ruta_arceus_ash_bar_damage` multiplica por 4 el daño del lado del jugador contra las barras y garantiza un mínimo de media barra por impacto, mientras las barras siguen avanzando una por acción. **El umbral rojo no castiga al jugador:** `pbArceusRedlineHeal` ya no restaura la barra completa, sólo media barra y una vez por etapa, así que pegar más fuerte nunca alarga el duelo. El Juicio del Vínculo (etapa 4) no baja a nivel 1 a los Pokémon de Ash (`pbArceusRivalLevel`), y las etapas 5 y 6 suben menos el nivel del rival (`base + 25` y `base + 35`).
   - **Ritmo verificado del duelo (R9):** `npm run verify:arceus:shield` simula el duelo completo sobre los métodos reales y mide turnos y bajas. Con sólo el daño mínimo del vínculo las seis barras caen en **12 turnos y 2 bajas**; un golpe fuerte por turno da el mismo resultado (pegar más nunca alarga la pelea); y un jugador que pierde un turno de cada tres (inmunidades, fallos de precisión, cambios, objetos) igual cierra el duelo en **17 turnos con 4 bajas**. Arceus sigue derribando a un Pokémon cada cuatro turnos: el duelo se gana administrando el equipo, no aguantando.
   - **Cero errores de script y Mega Arceus (R10):** el cartel de `ArgumentError`
     que aparecía en plena batalla venía de la fase del cielo: `batalla_clima`
     sembraba el clima con la firma antigua (`pbStartWeather(clima, 5)`: el
     símbolo de un movimiento como usuario y el número 5 como clima), así que
     el campo quedaba con `weather = 5` y el fin de ronda reventaba en
     `GameData::BattleWeather.try_get(5)`. Ahora el clima usa la firma v19 con
     símbolos reales, y la red anti-error `RutaCampoSeguro` hace imposible que
     un campo sucio llegue al jugador: `pbStartWeather`/`defaultWeather=`
     validan antes de escribir, cada `Battle_Phase_EndOfRound#start_phase`
     sanitiza clima y terreno antes de leerlos, y cualquier error residual del
     fin de ronda se absorbe sanitizando en vez de mostrarse. El silencio de
     talentos de la fase 3 usa el efecto real `PBEffects::GastroAcid`. La
     **fase 6 es ahora MEGA ARCEUS, EL DE LOS MIL BRAZOS**: al agotar la quinta
     barra desciende con cartel, flash, animación de mil proyectiles y un grito
     por acción, y su pool pasa a multigolpes (`RUTA_ARCEUS_MIL_BRAZOS`), sin
     tocar el tope de un tercio por acción de R9.
   - **QA de un millón de escenarios (R10):** `npm run verify:arceus:fuzz`
     ejecuta el código instalado (secciones `PokeMod_RutaDeDios` y
     `PokeMod_CanonArceus`) dentro de CRuby 3.3 en WebAssembly sobre un motor
     de prueba que replica las validaciones de GameData: 800 000 micro-escenarios
     de la guardia anti-KO, 150 000 escrituras sucias de clima/terreno con fin
     de ronda parcheado, 6 000 duelos completos aleatorios y 44 000 barridos de
     las seis fases del canon. Cada familia corre en su propio VM porque el
     heap de WASM no tolera las tandas acumuladas. Resultado: **1 000 000 de
     escenarios, 0 fallos**. El auditor estático añade patrones de campo
     (clima/terreno con literales inválidos, firmas mal puestas) sobre las 405
     secciones: 0 hallazgos.
   - **Fases que no revientan a medias y Forma Primigenia (R11):** la revisión
     fase por fase contra las firmas reales del motor (objetivos de
     `field.effects`/`sides[].effects`, constantes `PBEffects`, setters
     `item=`/`ability=`, `pbRegisterMoveTrainer` con 4 argumentos, helpers de
     pantalla globales, `from_pokemon_move`, `GrowthRate.max_level`) no dejó
     llamadas mal firmadas; el cambio estructural es que `efecto_fase` aplica
     cada sub-efecto con su propio escudo (`CanonArceus.paso`) y cierra con
     `verificar_fase` (campo saneado y PS en rango), así un error ya no deja la
     fase a medias en silencio. Y la última barra tiene tercer acto: al cruzar
     el umbral rojo despierta **ARCEUS PRIMIGENIO, LA FORMA PRIMIGENIA**
     (`ruta_arceus_primigenia_aparicion`): suelta la Tabla (el Juicio vuelve a
     su tipo original y los espectros pueden negarlo), rearma un pool
     primigenio (`RUTA_ARCEUS_PRIMIGENIA_MOVES`) y habla con voz propia
     (`RUTA_ARCEUS_PRIMIGENIA_GRITOS`), sin tocar el tope de un tercio de R9.
     El fuzz exige ahora que cada fase deje sus efectos visibles y que la
     Primigenia suelte la Tabla: 593 duelos con Primigenia en la muestra de
     6 000, **1 000 000 de escenarios totales, 0 fallos**.
   - **El dios jugador (R12):** el duelo deja de ser un patrón fijo. El daño
     de Arceus **varía por acción** (`ruta_arceus_divine_ratio`: 12%-33% de la
     vida máxima, más pesado en fases tardías y en Mega, determinista por
     clave de acción para la QA; el tope de R9 sigue siendo techo absoluto).
     Los diálogos salen de **mazos por categoría** (`ruta_arceus_dialogo`) que
     no repiten ninguna línea hasta agotarse y se muestran con pausa. La
     apertura es **acción con sprites**: Arceus alza al Pokémon de Ash en
     pantalla (`ruta_arceus_sprite_y`) y dice «Podría matarte ahora mismo, a
     ti y a tus Pokémon... pero veamos de qué son capaces»; cada tres turnos
     señala al activo y lo nombra. Dentro del combate corren **minijuegos**
     (Juicio Ciego con ventana de elección: acierto = dos golpes enemigos a la
     mitad; Ruleta del Génesis siempre a favor del jugador), **invocaciones
     del lore** (el Trío de la Creación ejecuta la Orden Divina sin rematar
     nunca —mínimo 1 PS—, Groudon/Kyogre traen clima real, los lagos bajan
     stats, Mew/Celebi interceden curando, Rayquaza/Zygarde aquietan el
     campo), la **copia del equipo** (en la fase 4 Arceus toma hasta tres
     golpes que Ash enseñó a sus Pokémon) y **la merced del último Pokémon**
     (con uno solo en pie, una vez por batalla, ofrece curar vida, estado y PP
     de todo el equipo; el jugador acepta o rechaza por ventana). La **música
     cambia por fase** con siete pistas reales verificadas contra
     `Audio/BGM`. Todo cuelga de `ruta_arceus_turno_divino`, aislado dentro
     del alias de `pbCalculatePriority`: si un sistema fallara, la ronda
     sigue. QA: familia nueva F5 (200 600 escenarios de mazos, ratio, música,
     invocaciones, juegos, merced y copia), F3 con el turno divino completo
     (3 000 duelos: 1 764 victorias, 333 Primigenias) y **1 000 000 de
     escenarios totales, 0 fallos**; cinemáticas en **69 invariantes**.
     `verify:arceus:recursos` audita además los ARCHIVOS del juego contra lo
     que el duelo nombra: 44 movimientos en `moves.dat`, 37 especies en
     `species.dat` con sprite frontal (18 formas de Arceus incluidas), 18
     Tablas + Poké Ball en `items.dat`, 7 pistas en `Audio/BGM` y 5 sprites de
     personaje: **0 recursos faltantes** (el juego no trae animaciones
     «Common:» de clima y el motor las salta en silencio, sin romper nada).
     De paso se cazó y corrigió una firma mal puesta: las ventanas de elección
     pasaban `false` donde la escena del motor exige un entero
     (`defaultValue>=0`); ahora usan `-1` como el propio motor, el stub de QA
     reproduce el contrato y el auditor estático lo vigila.
   - **Camino único de daño:** el motor aplica el daño de los movimientos con `target.hp -= hpLost` (sin pasar por `pbReduceHP`); ese camino también pasa por las barras y por el setter de PS protegido. Un Metagross, el granizo del mapa o cualquier escritura externa de PS no pueden saltarse una etapa ni derrotar a Arceus: el KO se convierte siempre en transición de barra. El duelo se inicia sin el clima heredado de la cumbre (`recordBattleRule("weather", "None")`).
   - **Ecos legales (R2/S10):** las invocaciones de Mew y Giratina nacen al nivel máximo legal del juego (150) y reciben un empuje divino ×1,25; el nivel 200 queda reservado al Arceus divino.
   - **Azar reproducible:** los combates principales y de apoyo usan semillas locales; la selección de etapa, ventajas de tipo y ataques se basa en el estado visible del rival.
   - **Captura estricta:** la captura está bloqueada al 0 %, incluida la Master Ball, hasta que la sexta barra se agota por completo y se muestra la transición final.
   - **Sin huida:** el comando de escape muestra una rotura visual, temblor y destello antes de ser rechazado.
   - **Continuación fuera de seis Pokémon:** al caer el equipo activo aparece `Debes continuar` y un pseudo-PC permite elegir hasta seis Pokémon capaces desde las cajas. El pseudo-PC mueve los datos sin curarlos (filtra huevos). Si no hay candidatos, **el Rotom sostiene al equipo una sola vez (35 %)** —R4/S12— para que nunca exista un callejón sin salida; el interruptor 869 (`RUTA_DE_DIOS_ARCEUS_MERCY`) registra ese auxilio.
   - **Empate (R3/S11):** si el combate termina en empate, se restaura el estado previo del equipo, se explica la escena y la cima queda abierta para reintentar; el evento nunca se cierra en silencio.
   - **Rendición:** muestra temblores, destrucción progresiva de la presentación de los mapas y entrenadores gritando antes de usar el retorno normal del motor (`pbStartOver`).
   - **Derrota:** si no quedan Pokémon activos ni reservas y no se elige continuar, se conserva el flujo de derrota del motor. La victoria y la captura regresan a la secuencia posterior normal de Volus.

---

## 7. Desenlace y Traición de Volus
Tras concluir el combate contra Arceus (derrota o captura):
- Volus sube apresuradamente la escalinata del Altar y felicita a Ash por haber detenido la aniquilación universal.
- **Si el jugador capturó a Arceus:**
  - Volus palidece y su expresión se transforma en locura y fanatismo: *«Espera... ¿Has... has CAPTURADO a Arceus? ¡¿Cómo te atreves?! ¡Ese poder me corresponde a mí para moldear un nuevo mundo sin dolor! ¡Si no me lo entregas por las buenas, te lo arrebataré en batalla!»*.
  - Comienza el duelo decisivo contra **Volus** con su tema musical exclusivo (`secretvolo.ogg`) y el equipo registrado de la versión 4 de `SECRET_Volo` (Spiritomb, Giratina y Giratina Forma Origen, Nv. 100). **R14:** el descanso del altar que curaba al equipo antes de este duelo se eliminó por petición expresa: Volo espera al equipo tal como quedó en la cima, también en cada reintento. Si Ash pierde, el duelo queda disponible para volver a intentarlo; solo una victoria cierra la historia.
  - *Sin castigo de bloqueo:* Si el jugador es derrotado por Volus, puede volver a subir a la cima cuantas veces necesite para enfrentarlo de nuevo.
  - Al vencer a Volus, este se arrodilla, admite que Arceus no fue dominado sino que eligió a Ash por su corazón puro, entrega 5 Caramelos Raros y se disuelve pacíficamente en la niebla del tiempo.
- **Fin del Evento Temporal:**
  - Se activa el interruptor 876 (`RUTA_DE_DIOS_COMPLETED`).
  - La fisura dimensional se estabiliza.
  - Los entrenadores de los pisos 1 a 4 (Maya, Palmer, Barry, Quinoa, Cintia) desaparecen de la montaña, habiendo cumplido su misión de salvaguardar la cumbre.
  - Para el resto de Sinnoh y del mundo de Pokémon Fire Ash, la paz continúa como si hubiera sido un fenómeno mitológico transitorio.

---

## 8. Verificación automatizada y límites
- `npm run verify:ruta_de_dios` revisa switches, recorrido, equipos y el código instalado de las seis barras, la ruleta animada, los ataques/niveles adaptativos, inmunidad a estados, caminatas y curaciones.
- `npm run verify:ruta_de_dios:package` y `npm run verify:package` comparan los datos/scripts del paquete directo y su ZIP.
- `npm run verify:arceus:cinematics` audita la escena 2v1 (menús, huida, `canLose`, PRNG, entradas físicas) y ahora exige que el daño cinemático sea absorbido sin mover la barra, que el setter de PS rechace escrituras externas, que ni el prólogo ni el duelo hereden el clima de la cumbre y, desde R8/R9, que existan la guardia anti-KO, el vínculo de las barras, la iniciativa de Ash, la opción de saltar el prólogo, el Juicio del Vínculo jugable y el umbral rojo que no borra el avance (69 invariantes).
- `npm run verify:arceus:shield` (opcional, requiere `npm i --no-save @ruby/3.3-wasm-wasi`) ejecuta los métodos reales de la sección instalada dentro de un CRuby compilado a WebAssembly sobre clases que imitan las rutas de daño del motor: 69 comprobaciones entre granizo, Metagross, escrituras directas, `pbFaint`, las seis barras, la captura final, la guardia que topa cada acción de Arceus en un tercio de la vida máxima (incluido el multigolpe que no puede rematar), la iniciativa de Ash con Espacio Raro, el vínculo que mueve al menos media barra, la **simulación del ritmo del duelo** (turnos y bajas hasta la sexta barra, con jugador flojo, fuerte y descuidado) y Ball Breaker (la clase real de «Despacito Despair» corriendo con los ayudantes restaurados), más una regresión que confirma que un Arceus normal del jugador no lleva escudo.
- `npm run verify:scripts:calls` (dentro de `npm test`) descomprime las 405 secciones y marca cualquier llamada `objeto.metodo` que no exista en ningún script ni en el núcleo de Ruby; es la red de seguridad que habría detectado el fallo de `selfProtected?` antes de jugarlo.
- `npm run build:corregido:zip` / `npm run verify:corregido:zip` reconstruyen y comprueban el ZIP descargable de la raíz (`Fire-Ash-Scripts-Corregidos.zip`) a partir de `Paquete_directo/` y `LEEME.md`, conservando el orden y el método de compresión de sus entradas (7,8 MB).
- `npm test` y `npm run test:ui` pasan en este checkout.
- El modo completo de verificación del Dimensional Nightmare sigue bloqueado al inicio por las fichas de referencia ausentes bajo `reference/dimensional_nightmare/slices/`; la limpieza de rótulos tiene verificador propio y no depende de ellas.
- No hay Ruby, RGSS ni `Game.exe` en el entorno, por lo que esta entrega tiene QA estática/estructural, no una prueba dentro del juego. La entrada animada, los tonos y el orden de comandos deben confirmarse en una copia de QA de Fire Ash.

---

## 9. Addendum R14 — El Creador como debe verse (reporte de partida + referencia visual)

Motivado por el reporte directo de quien jugó el evento que abre el DLC y por la
captura de referencia del duelo (sprite de mil brazos, cosmos y nombre
verdadero). Cambios instalados en `PokeMod_RutaDeDios` y en los assets del jogo:

1. **Batalla que no se repite.** La repetición nacía del pseudo-PC: su interfaz
   levantaba una excepción en partida que mataba el evento antes de firmar el
   interruptor 873, dejando viva la página sin condición del evento de la cima.
   R14 elimina `pbArceusPseudoPC` (y sus helpers de cajas) por completo; la red
   de seguridad pasa a ser la merced única del Rotom y, tras ella, la rendición
   con flujo oficial. Con 873/874/875 y el switch de completado firmados, la
   página 3 del evento queda vacía: movimiento libre sin re-encuentros.
2. **Sin cura previa a Volo.** Se elimina `pbArceusVoloRest` y sus dos llamadas
   de evento (página 1 y página 2 de la cima).
3. **IA que varía y amenaza.** El repertorio ya no se recalcula idéntico cada
   turno: se fija al cambiar de etapa o de objetivos vivos
   (`pbArceusBestAttackIds` con azar entre candidatos >=85 % del mejor puntaje)
   y la elección por turno reparte probabilidad entre los candidatos >=75 % del
   óptimo real del motor (`pbArceusChooseSmartMove`), con memoria que castiga el
   golpe resistido y veta el golpe recién usado. Se acabó el bucle A-B-A-B.
4. **Sólo se modifica el bando de Arceus.** `pbArceusControlLevels` ya no escribe
   niveles efectivos sobre los Pokémon del jugador (y desaparece
   `pbArceusRivalLevel`); el anuncio de etapa sólo habla del nivel del Creador.
5. **Orden Divina con presencia.** `pbArceusOrdenDivina`: si el legendario
   nombrado pelea junto al Creador (séquito), ejecuta la orden en persona
   (curación parcial, +1 a dos stats, animación de su golpe); si no,
   `pbArceusSummon` + `pbArceusRedibujar` hacen que el legendario **reemplaza el
   cuerpo de Arceus** dos turnos (sprite por especie visual, tipos y ataques
   reales vía Transform del motor), con reversa limpia en
   `pbArceusPosesionFin`. Las fases 5 y 6 pasan por el mismo camino.
6. **Duelo doble real.** `pbStartArceusDivineBattle` arma `foeParty` con Arceus
   más `RUTA_ARCEUS_SEQUITO` (Dialga, Palkia y Giratina al nivel del equipo de
   Ash +8, topado al máximo legal): el motor los envía de a dos y repone caídas;
   la IA de los acompañantes es la del motor (`pbDefaultChooseEnemyCommand`), y
   las barras, la guardia anti-KO y la captura siguen ancladas al objeto Pokémon
   de Arceus.
7. **Mega visible y fondo que cambia.** La quinta barra aplica
   `pbChangeForm(18)` (sprite nuevo de mil brazos, frente y espalda) más escala,
   tono, sacudida y cambio de fondo; `pbArceusFondo` reutiliza los sprites vivos
   de la escena (`battle_bg`, `battle_bg2`, `base_0`, `base_1`) para cambiar entre
   las familias nuevas `genesis1/2/3` sin recrear la escena. La Forma Primigenia
   devuelve la forma 0 sobre la tormenta oscura. El metadata de la cima también
   declara `genesis1` como battleback.
8. **Cero destellos.** No queda ninguna llamada `pbFlash` en la sección (ni en
   eventos: los `cmd(223)` blancos de la cima se volvieron tono púrpura y
   sacudida). El auditor estático `PATRONES_RUTA` lo exige en cada `npm test`.
9. **Mega del capturado.** `pbArceusMilibrazosDespertar`: una vez por combate,
   con el Arceus capturado por debajo de la mitad de sus PS, despliega la forma
   18 con +2 a ataque, ataque especial y velocidad y la cinemática de tono y
   sacudida; `pbRutaArceusRestoreCapturedAfterBattle` la repliega al terminar.
10. **Assets nuevos distribuidos.** `Graphics/Battlebacks/genesis{1,2,3}_bg.png`,
    `genesis1_base0/base1.png` y `Graphics/Pokemon/{Front,Back}/ARCEUS_18.png`
    viajan en el paquete directo y en el ZIP raíz (manifiesto `ASSET_FILES` y
    adopción de novedades en `refresh_corregido_zip`); el LEEME documenta la
    copia de `Graphics/` en la instalación.
11. **Nombre verdadero.** El Pokémon del duelo se presenta como «ARCEUS ORIGEN»
    (`pkmn.name`), coherente con la referencia: siempre es el dios de los
    Pokémon, en el bando que sea.

QA R14: fuzz 1 000 000/0 (F1 602 400 · F2 150 000 · F3 3 000 · F4 44 000 · F5
200 600), escudos 69/0, cinemáticas 77/77 (8 invariantes R14 nuevas), recursos
19/19 (séquito, Forma Origen y fondos auditados contra moves.dat/species.dat y
el árbol de Graphics), llamadas colgantes 0 y patrones de campo 0, `npm test`
completo en verde y artefactos reconstruidos y verificados (ZIP raíz 1151
archivos / 8,9 MB; paquete directo 1151 / 24,8 MB; DN QA 422 / 20,9 MB).

## 10. Addendum R15 — El error que llegó a la partida y la red que lo hace imposible

Motivado por la captura real del juego: `NameError: uninitialized constant
RUTA_ARCEUS_SEQUITO` en `pbStartArceusDivineBattle` (mapa 2037, evento 2), más
la exigencia expresa de evaluar 10 000 escenarios contra esta clase de error y
de que **sea imposible que falte un recurso de ningún tipo**.

1. **Causa raíz (dos bugs reales, misma clase).** `RUTA_ARCEUS_SEQUITO` y
   `pbArceusBuildLegendario` se generaban INDENTADOS dentro de
   `class PokeBattle_Battle`: Ruby los define en el ámbito de la clase y el
   starter (nivel Object) no los ve. Ambos se movieron a columna 0 en el
   generador (`apply_la_ruta_de_dios.mjs`) y la sección instalada se regeneró
   con su canon.
2. **Familia F6 del fuzz: 10 000 arranques reales del duelo.** El harness
   (`tools/qa/arceus_fuzz_harness.mjs`) ahora extrae TODAS las constantes de
   columna 0 y los métodos de nivel Object del duelo (starter, cinemáticas,
   merced, rendición, normalize, `pbArceusMoveIds`, `pbArceusBuildLegendario`)
   y los evalúa dentro de `class Object`, igual que el motor. Cada escenario
   ejecuta `pbStartArceusDivineBattle` completo contra un `pbWildBattleCore`
   instrumentalizado con colas de decisión (captura, huida, rendición, empate,
   victoria, merced única) y un oráculo fiel al starter (la merced ocurre una
   vez: el segundo «2» de la cola rinde). El prólogo completo corre en 1 000 de
   los 10 000 arranques. Por memoria del heap wasm, F6 se parte en tres tandas
   con VMs frescos (F6a 3 334 · F6b 3 333 · F6c 3 333); F1 se rebalanceó a
   592 400 y el total sigue siendo **1 000 000 exactos**.
3. **Fidelidad del sandbox.** El preludio (`tools/qa/arceus_fuzz_prelude.rb`)
   incorporó la superficie que el starter toca de verdad: `SaveData`
   (values/compile_save_hash), `GrowthRate.max_level`, `GameData::Stat`,
   `Pokemon` completo (iv/ev/nature/calc_stats/learn_move/form_simple/able?),
   `PBMoveRoute` + `pbMoveRoute`, y un `Graphics` SIN width/height para que las
   guardias visuales (`!Graphics.respond_to?(:width)`) apaguen sólo el dibujo:
   la lógica (barras, fases, Mega, merced) corre intacta.
4. **Auditoría de alcance (nueva, en `verify_arceus_recursos.mjs`).** Hace
   imposible que la clase de error se redistribuya: (a) ninguna constante
   `RUTA_*`/`ARCEUS_*` puede definirse anidada dentro de una clase; (b) toda
   constante referenciada debe existir en columna 0; (c) todo método del duelo
   llamado sin receptor desde un `def` de nivel superior debe estar definido en
   columna 0 (detecta el `pbArceusBuildLegendario` anidado).
5. **Auditoría de recursos de TODOS los tipos.** Al barrido R12 (movimientos,
   especies+sprite, objetos, BGM por fase, personajes, battlebacks, animaciones)
   se suma el barrido genérico: cualquier `nextBattleBack`, `nextBattleBGM`,
   `pbBGMPlay`, `learn_move(:X)`, movimiento de `pbArceusCinematicCpuBattle` y
   `.item = :X` nombrado en la sección instalada debe existir en el juego; y el
   `Paquete_directo` debe distribuir los mismos recursos que la carpeta del
   juego. **Hueco real encontrado y cerrado:** las 6 pistas del duelo
   (Legend Creation Trio, Battle! Legendary Raid, Eternatus 1/2/3, Ultra
   Necrozma) viajaban sólo en el juego; ahora están en el manifiesto
   `ASSET_FILES` del sincronizador, en el paquete directo y en los dos ZIP.

QA R15: fuzz **1 000 000/0** (F1 592 400 · F2 150 000 · F3 3 000 — 1 764
victorias, 333 Primigenias · F4 44 000 · F5 200 600 · F6 10 000 arranques del
starter), escudos 69/0, cinemáticas 77/77, recursos **27/27** (8 comprobaciones
nuevas R15), llamadas colgantes 0, `npm test` completo en verde y artefactos
reconstruidos y verificados (ZIP raíz 1157 archivos / 33,7 MB; paquete directo
1157 / 50,2 MB; DN QA 422 / 20,9 MB).

## 11. Addendum R15b — El ámbito real contra la indentación (y el candado que lo vigila)

La segunda captura de partida (`NoMethodError: undefined method
'pbArceusBuildLegendario' for an instance of Interpreter`) demostró que R15
había movido la columna del texto pero no el ámbito: el `def` seguía escrito
entre `class PokeBattle_Battle` y su `end`, y Ruby define el ámbito con
palabras clave, no con espacios. El Interpreter del evento (nivel Object) no
ve métodos de otra clase: de ahí el error.

1. **Fix estructural en el generador.** `apply_la_ruta_de_dios.mjs` cierra
   `PokeBattle_Battle` inmediatamente antes del comentario R14b y la reabre
   justo después del `end` de `pbArceusBuildLegendario`. Verificado con árbol
   de sintaxis: `scope=[]` para la constante del séquito, el constructor y el
   starter.
2. **`tools/qa/arceus_scope_map.mjs` (+ `npm run verify:arceus:scope`, dentro
   de `npm test`).** Recorre el AST de `PokeMod_RutaDeDios` y
   `PokeMod_CanonArceus` con pila de `class/module` y denuncia (a) todo def o
   constante escrito en columna 0 pero anidado de verdad, y (b) la ausencia o
   anidamiento de los once nombres que el nivel superior exige
   (`pbStartArceusDivineBattle`, `pbArceusBuildLegendario`, `pbArceusMoveIds`,
   merced, rendición, normalize, prólogo, CpuBattle y las tres tablas).
   Prueba en negativo: contra el Scripts.rxdata entregado en R15 el auditor
   sale 1 señalando `pbArceusBuildLegendario` dentro de `PokeBattle_Battle`.
3. **Candado anti-ocultamiento en el fuzz.** El extractor AST del harness
   guarda ahora el ámbito real de cada `def` y compara contra el ámbito
   esperado del grupo que lo envuelve (`Object` → top-level; `PokeBattle_Battle`
   /`_Battler`/`_Move` → su clase). Cualquier desvío aborta el millón de
   escenarios con el nombre y el ámbito exactos: re-envolver y disimular ya no
   es posible. Con el guion R15 entregado, el harness falla citando
   `Object#pbArceusBuildLegendario (definido en [PokeBattle_Battle]...)`.
   Ajuste derivado: `pbArceusMoveIds` vive al nivel superior (lo llaman starter
   y constructor) y por tanto pertenece al grupo Object, no al de Battle.
4. **Entrega todo-en-uno verificada.** El ZIP raíz abre con `Data/`,
   `Graphics/`, `Audio/` y `LEEME.txt` en su raíz: sustitución directa sobre la
   carpeta del juego, sin pasos intermedios. El manifiesto del sincronizador y
   la auditoría de paridad mantienen las siete pistas, los fondos y los sprites
   dentro de todos los distribuíbles.

QA R15b: alcance AST 227+46 · fuzz 1 000 000/0 · escudos 69/0 · cinemáticas
77/77 · recursos 27/27 · npm test verde · ZIP raíz 1157/33,7 MB · paquete
directo 1157/50,2 MB · DN QA 422/20,9 MB.
