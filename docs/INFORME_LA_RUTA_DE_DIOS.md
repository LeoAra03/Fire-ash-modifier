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
5. **Prólogo de apoyo coreografiado (una sola vez, R7):** Cynthia y Steven caminan desde la avenida hasta el altar, aparecen juntos como entrenadores y disputan un doble 2v1; tras caer, caminan de vuelta y desaparecen. Red y Gold llegan después por el mismo sendero, ocupan sus marcas y combaten en otro doble 2v1; Volus entra al final contra Arceus con Giratina Origen. Se conserva `PokeBattle_Battle`, `pbBattleAnimation`, sprites, cries y animaciones del motor; ambos bandos usan selección de movimientos y reemplazos guionados, la precisión de Arceus está asegurada y un PRNG local sembrado fija los demás resultados. En el prólogo Arceus es **intocable**: ningún ataque, golpe crítico, clima (la nieve de la cumbre ya no entra al combate como granizo), retroceso, habilidad, movimiento custom ni escritura directa de PS mueve su barra; el aura dorada absorbe el golpe, y sólo un intento que habría sido letal provoca su burla. Un setter de PS protegido y un respaldo en `pbFaint` garantizan que ni Metagross ni ninguna ruta externa cierren la escena con una derrota del Creador. Cada ataque suyo sigue retirando al Pokémon activo. La sección de compatibilidad también restaura los ayudantes `PokeBattle_Battler#selfProtected?` y `#sideProtected?` que el motor no define y que la sección «Despacito Despair» usaba en `PokeBattle_Move_DF08` (Ball Breaker, el movimiento de dos turnos de acero del Metagross de Steven): sin ellos, cualquier uso del movimiento abortaba el combate con `NoMethodError: undefined method 'selfProtected?' for an instance of PokeBattle_Battler`. El efecto del movimiento se reescribe además para no depender de esos ayudantes ni de `pbOwnSide`. `battle.controlPlayer = true`, `canRun = false`, `expGain = false` y `moneyGain = false` bloquean la intervención de Ash sin tocar `$Trainer.party`, el compañero global ni el guardado. El switch 881 (`RUTA_DE_DIOS_PRELUDE_SEEN`) evita repetir los tres combates tras cada reintento.
6. **Combate Divino:**
   - **Nivel 200**, IVs 31 en todo, Tabla Legendaria / Multitipo.
   - Movimientos: *Sentencia*, *Distorsión*, *Corte Vacío*, *Golpe Umbrío*.
   - **Seis etapas de resistencia:** cada etapa tiene una barra de HP completa. El mismo Arceus conserva fase, barras agotadas y curaciones al cambiar de equipo; la transición sólo se produce cuando una barra llega a cero. Las etapas 2–6 restauran la barra completa y aumentan estadísticas, poder y nivel de Arceus. La fase 4 copia visualmente al Pokémon activo, pero conserva la identidad y la protección divina; la fase 5 muestra el eco de Mew y la 6 a Giratina Origen.
   - **Ruleta real de las 17 Tablas:** los iconos de las Tablas orbitan en pantalla y la animación se detiene arriba, en el tipo más ventajoso contra el equipo activo. Arceus adapta su tipo y objeto en ese instante; los empates se resuelven de forma reproducible. El hook de canon se ejecuta en cada cambio de etapa y no reemplaza la Tabla estratégica elegida.
   - **Arsenal y niveles adaptativos:** en cada turno, Arceus evalúa los ataques del catálogo completo del juego y equipa los cuatro con mayor daño esperado. Cambia también su nivel de combate y el de Ash por etapa. Es inmune a estados, confusión, atracción, retroceso de estadísticas y efectos equivalentes.
   - **Curación exclusiva de Arceus:** al entrar en rojo, sólo Arceus restaura toda su barra (una vez por etapa), con animación y diálogo dentro del combate. No revive ni cura Pokémon del equipo de Ash y no depende de Restaurar Todo aleatorios.
   - **Barras del Génesis:** un ataque multigolpe no puede agotar más de una barra en la misma acción. Los golpes críticos no saltan etapas: deben agotarse seis barras completas. Tras vaciar la sexta, Arceus queda visualmente a 1 PS y habilita una captura determinista del 100%; las bolas están bloqueadas antes de ese punto.
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
  - Comienza el duelo decisivo contra **Volus** con su tema musical exclusivo (`secretvolo.ogg`) y el equipo registrado de la versión 4 de `SECRET_Volo` (Spiritomb, Giratina y Giratina Forma Origen, Nv. 100). Antes del reto, el altar concede un descanso explícito que cura al equipo (**R6/S14**), y se repite en cada reintento. Si Ash pierde, el duelo queda disponible para volver a intentarlo; solo una victoria cierra la historia.
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
- `npm run verify:arceus:cinematics` audita la escena 2v1 (menús, huida, `canLose`, PRNG, entradas físicas) y ahora exige que el daño cinemático sea absorbido sin mover la barra, que el setter de PS rechace escrituras externas y que ni el prólogo ni el duelo hereden el clima de la cumbre.
- `npm run verify:arceus:shield` (opcional, requiere `npm i --no-save @ruby/3.3-wasm-wasi`) ejecuta los métodos reales de la sección instalada dentro de un CRuby compilado a WebAssembly sobre clases que imitan las rutas de daño del motor: 47 comprobaciones entre granizo, Metagross, escrituras directas, `pbFaint`, las seis barras, la captura final y Ball Breaker (la clase real de «Despacito Despair» corriendo con los ayudantes restaurados), más una regresión que confirma que un Arceus normal del jugador no lleva escudo.
- `npm run verify:scripts:calls` (dentro de `npm test`) descomprime las 405 secciones y marca cualquier llamada `objeto.metodo` que no exista en ningún script ni en el núcleo de Ruby; es la red de seguridad que habría detectado el fallo de `selfProtected?` antes de jugarlo.
- `npm run build:corregido:zip` / `npm run verify:corregido:zip` reconstruyen y comprueban el ZIP descargable de la raíz (`Fire-Ash-Scripts-Corregidos.zip`) a partir de `Paquete_directo/` y `LEEME.md`, conservando el orden y el método de compresión de sus entradas (7,8 MB).
- `npm test` y `npm run test:ui` pasan en este checkout.
- El modo completo de verificación del Dimensional Nightmare sigue bloqueado al inicio por las fichas de referencia ausentes bajo `reference/dimensional_nightmare/slices/`; la limpieza de rótulos tiene verificador propio y no depende de ellas.
- No hay Ruby, RGSS ni `Game.exe` en el entorno, por lo que esta entrega tiene QA estática/estructural, no una prueba dentro del juego. La entrada animada, los tonos y el orden de comandos deben confirmarse en una copia de QA de Fire Ash.
