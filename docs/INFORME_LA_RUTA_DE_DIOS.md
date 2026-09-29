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
- Al interactuar, transporta al jugador a la aproximación larga (`Map2030`, 26, 68), no directamente al primer piso.

---

## 4. Aproximación Celestial (`Map2030`)
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
5. **Prólogo de apoyo con combates reales CPU vs CPU:** antes de que Ash tome el control, la cima recibe tres entradas escénicas. Cynthia y Steven luchan en un doble 2v1 contra Arceus; Gold/Eco y Red disputan otro doble 2v1; Volus entra en un combate individual con Giratina Origen. Cada duelo usa `PokeBattle_Battle`, `pbBattleAnimation`, movimientos, objetivos, daño, estados, cambios, debilitamientos, mensajes y animaciones normales. `battle.controlPlayer = true`, `canRun = false`, `expGain = false` y `moneyGain = false` bloquean toda intervención de Ash sin tocar `$Trainer.party`, el compañero global ni el guardado. Arceus derrota los cinco equipos y Volus cae antes de que su intento pueda prolongarse. Ash avanza al final con representaciones transparentes de su equipo y declara el duelo definitivo.
6. **Combate Divino:**
   - **Nivel 200**, IVs 31 en todo, Tabla Legendaria / Multitipo.
   - Movimientos: *Sentencia*, *Distorsión*, *Corte Vacío*, *Golpe Umbrío*.
   - **Seis fases progresivas:** el motor conserva el mismo Arceus entre fases, cambia las Tablas y sus movimientos, y muestra distorsiones, destellos, tonos de pantalla y temblores. Las fases incluyen Mega Evolución del Génesis, Gigamax del Creador, Movimiento Z, copia del Pokémon activo, invocaciones legendarias (Mew/Giratina y ecos de Dialga/Palkia) y el último sello.
   - **Ruleta de tipos:** en cada transición Arceus alterna entre las 17 Tablas y se actualiza su tipo con una animación contextual.
   - **Control de la realidad:** puede curar o revivir un Pokémon del jugador durante una transición, y puede copiar temporalmente al Pokémon activo. También rota conjuntos de movimientos para cubrir ataques legendarios y de todas las familias disponibles en el motor.
   - **Mecánica de 3 Restaura Todo:** implementada en el motor de batalla (`PokeBattle_Battler#pbReduceHP`). Cuando la salud alcanza el umbral, se activa la animación sagrada y el estado se restaura hasta tres veces.
   - **Captura estricta:** la captura está bloqueada al 0%, incluyendo la Master Ball, antes de la animación final. El golpe que rompe el último sello deja a Arceus con 1 HP, muestra la animación de debilitamiento y habilita una captura determinista del 100%.
   - **Sin huida:** el comando de escape muestra una rotura visual, temblor y destello antes de ser rechazado.
   - **Continuación fuera de seis Pokémon:** al caer el equipo activo aparece `Debes continuar` y un pseudo-PC permite elegir hasta seis Pokémon capaces desde las cajas. El pseudo-PC mueve los datos sin curarlos. La batalla continúa mientras haya Pokémon disponibles o hasta que el jugador elija rendirse.
   - **Rendición:** muestra temblores, destrucción progresiva de la presentación de los mapas y entrenadores gritando antes de usar el retorno normal del motor (`pbStartOver`).
   - **Derrota:** si no quedan Pokémon activos ni reservas y no se elige continuar, se conserva el flujo de derrota del motor. La victoria y la captura regresan a la secuencia posterior normal de Volus.

---

## 7. Desenlace y Traición de Volus
Tras concluir el combate contra Arceus (derrota o captura):
- Volus sube apresuradamente la escalinata del Altar y felicita a Ash por haber detenido la aniquilación universal.
- **Si el jugador capturó a Arceus:**
  - Volus palidece y su expresión se transforma en locura y fanatismo: *«Espera... ¿Has... has CAPTURADO a Arceus? ¡¿Cómo te atreves?! ¡Ese poder me corresponde a mí para moldear un nuevo mundo sin dolor! ¡Si no me lo entregas por las buenas, te lo arrebataré en batalla!»*.
  - Comienza el duelo decisivo contra **Volus** con su tema musical exclusivo (`secretvolo.ogg`) y su equipo legendario (Giratina Forma Origen Lv. 155, Garchomp Lv. 152, Lucario Lv. 150, Togekiss Lv. 150, Roserade Lv. 150, Spiritomb Lv. 150).
  - *Sin castigo de bloqueo:* Si el jugador es derrotado por Volus, puede volver a subir a la cima cuantas veces necesite para enfrentarlo de nuevo.
  - Al vencer a Volus, este se arrodilla, admite que Arceus no fue dominado sino que eligió a Ash por su corazón puro, entrega 5 Caramelos Raros y se disuelve pacíficamente en la niebla del tiempo.
- **Fin del Evento Temporal:**
  - Se activa el interruptor 876 (`RUTA_DE_DIOS_COMPLETED`).
  - La fisura dimensional se estabiliza.
  - Los entrenadores de los pisos 1 a 4 (Maya, Palmer, Barry, Quinoa, Cintia) desaparecen de la montaña, habiendo cumplido su misión de salvaguardar la cumbre.
  - Para el resto de Sinnoh y del mundo de Pokémon Fire Ash, la paz continúa como si hubiera sido un fenómeno mitológico transitorio.

---

## 8. Verificación Automatizada
- Comprobación de integridad y sintaxis: `npm run verify:ruta_de_dios`
- Validación de tests del proyecto: `npm test`
- Verificación del Hub de Oak y de Pueblo Paleta: `npm run verify:oak:hub` y `npm run verify:abra:tower`
- Todo el conjunto de pruebas se ejecuta con 0 errores y 100% de aprobación.
