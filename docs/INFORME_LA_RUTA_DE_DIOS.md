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
- **Ubicación:** Ciudad Puntaneva (`Map625.rxdata`), en las coordenadas `(20, 3)` justo frente a la entrada del antiguo templo de Regigigas.
- **Portal:** Manifestación de luz celestial (gráfico `Object ball special`), visible cuando el interruptor 870 (`RUTA_DE_DIOS_UNLOCKED`) está activo.
- Al interactuar, transporta al jugador al primer estrato de la montaña (`Map2031`, 20, 36).

---

## 4. Estructura de los 7 Pisos (Paralelismo al Monte Corona)

| Piso | Mapa | Dimensiones | Nombre | Descripción y Encuentros |
| :--- | :--- | :---: | :--- | :--- |
| **1F** | `Map2031` | 40×40 | **Puerta de las Columnas** | Meseta nevada con estatuas grisáceas (`1310/3300`) y columnas de mármol blanco. Portal de regreso a Puntaneva. Combate contra **Maya / Dawn** (Lv. 130). Ítem oculto: Caramelo Raro. |
| **2F** | `Map2032` | 40×40 | **Sendero de los Titanes** | Laderas escarpadas, nieve eterna y monolitos antiguos. Combate contra **Jericor / Palmer** y diálogo con **Benito / Barry** (Lv. 135). Ítem oculto: Revivir Máximo. |
| **3F** | `Map2033` | 42×42 | **Terraza del Aura** | Doble columnata de estatuas sagradas. Combate contra **Quinoa / Riley** (Lv. 140), quien advierte del despertar de la Consciencia Primordial. Ítem oculto: Más PP. |
| **4F** | `Map2034` | 42×42 | **Baluarte Celestial** | Cima alpina y vientos cósmicos. Combate contra la **Campeona Cintia / Cynthia** (Lv. 145), quien recita el verso original de Caelestis. Ítem oculto: Ceniza Sagrada. |
| **5F** | `Map2035` | 38×38 | **Santuario del Tiempo** | Templo temporal con cristales y monolitos. **Guardián Dialga Primordial (Lv. 150)** bloquea la escalinata al 6F. Al ser derrotado o capturado, el tiempo retoma su curso y Dialga se desvanece en polvo temporal azul. Ítem oculto: Parte Cometa. |
| **6F** | `Map2036` | 38×38 | **Santuario del Espacio** | Templo espacial con distorsiones dimensionales. **Guardián Palkia Primordial (Lv. 150)** bloquea la escalinata final. Al ser derrotado o capturado, las dimensiones se alinean y Palkia se disuelve en perlas cósmicas. Ítem oculto: Cápsula Habilidad. |
| **7F** | `Map2037` | 46×46 | **Cima del Génesis** | El Olimpo de Arceus. Calzada procesional de mármol blanco flanqueada por 12 estatuas colosales. Altar del Origen con **ARCEUS (Nivel 200)**. Ítem oculto: Chapa Dorada. |

---

## 5. Cinemática de Arceus y Combate contra Dios
Al alcanzar el Altar del Origen en la Cima del Génesis (`Map2037`, 23, 10):
1. **Puesta en escena:** La música se eleva con el tema sagrado *Legend Sinnoh*. La pantalla tiembla violentamente (intensidades 6, 7 y 8) con relámpagos divinos.
2. **Cuestionamiento del Viaje:**
   - Arceus contempla a Ash: *«Dime... ¿Por qué caminas? ¿Por qué desafías las leyes de la existencia? ¿Acaso crees que coleccionar criaturas y doblegar voluntades te otorga el derecho de pararte ante la Consciencia Primordial?»*.
   - Habla de las leyendas que Ash ha enfrentado a lo largo de su viaje (las aves de Kanto, los señores del magma y del océano en Hoenn, los dragones de las dimensiones).
3. **La Revelación de las Copias:**
   - Arceus confiesa con severidad: *«¿Crees que aquellos a los que llamaste 'Dialga', 'Palkia' o 'Arceus' en tus viajes eran la plenitud de nuestro ser? ¡Ingenuo! Me esforcé durante eones en dejar fragmentos, ecos y copias atenuadas de mí mismo y de mis guardianes a lo largo y ancho del cosmos... ¡Específicamente para evitar esto! Para que ningún mortal fuera capaz de despertar el núcleo original ni perturbar el descanso del Arquitecto.»*.
4. **El Cataclismo Final:**
   - *«Y sin embargo... reuniste las diecisiete Tablas del Génesis. No he descendido para coronarte campeón. He venido a desatar el Cataclismo Final. La existencia de esta línea temporal ha excedido su propósito. ¡Desaparece ante el juicio del Creador!»*.
5. **Combate Divino:**
   - **Nivel 200**, IVs 31 en todo, Tabla Legendaria / Multitipo.
   - Movimientos: *Sentencia*, *Distorsión*, *Corte Vacío*, *Golpe Umbrío*.
   - **Mecánica de 3 Restaura Todo:** Implementada en el motor de batalla (`PokeBattle_Battler#pbReduceHP`). Cada vez que la salud de Arceus cae al 45% o menos, se activa una animación sagrada: *«¡El fulgor del Génesis envuelve al Arquitecto de la Existencia! ¡Arceus utilizó un Restaura Todo (X/3)! ¡Su salud y estado se restablecen por completo!»*.
   - Una vez agotados los 3 usos, el jugador puede desgastarlo para debilitarlo o atraparlo.
   - **Derrota:** Si el equipo del jugador es derrotado, el motor ejecuta el desmayo tradicional y lo traslada al Centro Pokémon más cercano.

---

## 6. Desenlace y Traición de Volus
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

## 7. Verificación Automatizada
- Comprobación de integridad y sintaxis: `npm run verify:ruta_de_dios`
- Validación de tests del proyecto: `npm test`
- Verificación del Hub de Oak y de Pueblo Paleta: `npm run verify:oak:hub` y `npm run verify:abra:tower`
- Todo el conjunto de pruebas se ejecuta con 0 errores y 100% de aprobación.
