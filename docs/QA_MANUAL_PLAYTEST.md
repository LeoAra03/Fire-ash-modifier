# Checklist de prueba manual en Game.exe

> Generada por `tools/generate_manual_qa_checklist.mjs`. Ningún linter sustituye esta pasada: ritmo, clipping, Mochila y sensación de juego solo se validan jugando. El entorno de desarrollo no dispone de Wine.

## A. Ruta crítica del postgame y la Mochila (12 comprobaciones)

- [ ] A1. Partida con el evento de Mew terminado: Oak dispara el switch `429 = Postgame` al volver a casa y el Pokédex de entrenador queda habilitado.
- [ ] A2. Laboratorio de Oak (mapa 48) → sótano: los dos transportadores originales funcionan (holders → mapa 772+, torre → 141).
- [ ] A3. El tercer transportador nuevo (entre los dos originales) abre su menú: Isla Espejo, Bosque Susurrante, Puerto Horizonte, Atlas Mil.
- [ ] A4. El ayudante de Oak (junto a las cápsulas) explica el dispositivo y menciona la Mochila libre.
- [ ] A5. Torre (141 SECRET PEAK): usar un objeto en combate con el switch 674 activo (debe funcionar).
- [ ] A6. Salón Grandeur (151): abrir la Mochila y usar objetos en combates de las etapas Rookie/Veteran/Ace/Mayhem.
- [ ] A7. Escenario (214): la Mochila funciona en batalla; fuera de combate el switch 675 sigue ocultando la Mochila (reto original intacto).
- [ ] A8. Veterano/Ace/Mayhem conservan la mochila de stock fijo que entrega el club y `returnBag` la devuelve al salir.
- [ ] A9. Con una señal sin calibrar (por ejemplo Atlas sin haber hablado con el Cronista), la cápsula explica qué falta y no teletransporta.
- [ ] A10. Isla Espejo (997-999): entrada desde Pueblo Paleta y desde el hub; ferry de vuelta libre; un jefe con Mochila usable y `canLose`.
- [ ] A11. Misión Hypno (Ciudad Verde → 1000): rescate, Hypno capturable/derrotable y, al hablar con el guardabosques, apertura de Horizontes (1001).
- [ ] A12. Puerto Horizonte → Cronista de Atlas Mil: abre Atlas (1021) y las 40 puertas sectoriales funcionan con retorno libre.

## B. Las 40 anclas Tier 1 (40 comprobaciones)

Para cada ancla: entrar por su sector, conversar con los 3–5 NPCs (revisar que las voces no se repiten), jugar la escena y la decisión, enfrentar al jefe con Mochila disponible, perder sin bloqueo, ganar, recibir la recompensa una sola vez, comprobar curación y retorno libre a Puerto Horizonte.

| # | Mapa | Sector | Episodio | Jefe (equipo) | Decisión | Recompensa | Hecho |
|---:|---:|---|---|---|---|---|---|
| 1 | 1021 | 1 · Meridiano Ámbar | Santuario de la Última Campana | Custodio del Silencio (CHIMECHO Nv90, NOIVERN Nv91, MISMAGIUS Nv92, ABSOL Nv93, FROSLASS Nv94, SPIRITOMB Nv96) | ¿Conservar una copia claramente marcada o liberar todas las voces prestadas? | SOOTHEBELL | [ ] |
| 2 | 1046 | 2 · Cuenca Celeste | La Copa del Huevo Vacío | Prefecta Centella (PICHU Nv88, ELEKID Nv89, MAGBY Nv90, RIOLU Nv91, TOGETIC Nv92, RAICHU Nv94) | ¿Cómo debe resolverse la ceremonia? | LUCKYEGG | [ ] |
| 3 | 1071 | 3 · Frontera Carmesí | El Campeón de Fecha Imposible | Campeón Cero (ARCANINE Nv91, LAPRAS Nv92, EXEGGUTOR Nv93, MACHAMP Nv94, ALAKAZAM Nv95, DRAGONITE Nv97) | ¿Cómo debe publicarse el expediente? | ABILITYPATCH | [ ] |
| 4 | 1096 | 4 · Distrito Cuarzo | El Gremio de la Camilla Vacía | Equipo Retorno (PELIPPER Nv89, AUDINO Nv90, EXCADRILL Nv91, CHANDELURE Nv92, LUCARIO Nv93, FLYGON Nv95) | ¿Qué hacer con el túnel? | ESCAPEROPE | [ ] |
| 5 | 1121 | 5 · Órbita Esmeralda | Operación Rescate Demasiado Perfecto | Guardiana del Pulso (TROPIUS Nv90, SAWSBUCK Nv91, ARIADOS Nv92, FLOATZEL Nv93, TALONFLAME Nv94, ZOROARK Nv96) | ¿Cómo retirar la red? | ABILITYCAPSULE | [ ] |
| 6 | 1146 | 6 · Paso Boreal | La Sombra que Eligió Quedarse | Custodio Umbrío (ABSOL Nv91, HOUNDOOM Nv92, CROBAT Nv93, URSARING Nv94, METAGROSS Nv95, TYRANITAR Nv97) | ¿Qué futuro tendrá la cámara? | BLACKGLASSES | [ ] |
| 7 | 1171 | 7 · Jardín Índigo | El Jardín de los Dos Juramentos | Regente Índigo (SAMUROTT Nv90, SERPERIOR Nv91, EMBOAR Nv92, BRAVIARY Nv93, BISHARP Nv94, AEGISLASH Nv96) | ¿Cómo salvar el árbol y el pacto? | KINGSROCK | [ ] |
| 8 | 1196 | 8 · Costa Prisma | La Persona Fuera del Encuadre | Revelador Prisma (SMEARGLE Nv90, KECLEON Nv91, ROTOM Nv92, PORYGON2 Nv93, ZOROARK Nv94, SIGILYPH Nv96) | ¿Qué derecho tendrá Nemi sobre los recuerdos? | WIDELENS | [ ] |
| 9 | 1221 | 9 · Dominio Solar | El Festival que Olvidó su Motivo | Maestra de Juegos (LUDICOLO Nv89, DELIBIRD Nv90, AMBIPOM Nv91, MRMIME Nv92, TOGEKISS Nv93, SNORLAX Nv95) | ¿Qué debe ocurrir con el festival? | AMULETCOIN | [ ] |
| 10 | 1246 | 10 · Velo Lunar | La Carta que Recuerda a su Jugador | Barajadora Lunar (VENUSAUR Nv92, CHARIZARD Nv93, BLASTOISE Nv94, PIKACHU Nv95, MEWTWO Nv97, MEW Nv98) | ¿Qué futuro merece la carta? | REVEALGLASS | [ ] |
| 11 | 1271 | 11 · Nexo Onírico | El Compañero del Minuto Cero | Testigo Sincrónico (XATU Nv91, ESPEON Nv92, UMBREON Nv93, GALLADE Nv94, GARDEVOIR Nv95, CELEBI Nv97) | ¿Cómo continuará la pareja del futuro descartado? | REDCARD | [ ] |
| 12 | 1296 | 12 · Valle Magnético | El Punto que Nadie Quiso Marcar | Directora de Zona (CINDERACE Nv90, TALONFLAME Nv91, CRUSTLE Nv92, GREEDENT Nv93, BLISSEY Nv94, LUCARIO Nv96) | ¿Cómo se reconocerán las jugadas de cuidado? | EJECTBUTTON | [ ] |
| 13 | 1321 | 13 · Arco Fósil | La Señal Hecha de Ausencias | Guardián de Frecuencia (AMPHAROS Nv89, NOCTOWL Nv90, STOUTLAND Nv91, CHIMECHO Nv92, MAGNEZONE Nv93, ZYGARDE Nv95) | ¿Dónde debe vivir la señal de regreso? | POKERADAR | [ ] |
| 14 | 1346 | 14 · Mar de Nubes | La Ciudad a la que Dieron Cuerda | Maestra de la Caja (BANETTE Nv91, AMBIPOM Nv92, BEWEAR Nv93, KLINKLANG Nv94, ROTOM Nv95, MAGEARNA Nv97) | ¿Quién controlará la cuerda de la ciudad? | POKETOY | [ ] |
| 15 | 1371 | 15 · Bosque de Hierro | El Mosaico de los Nombres Imposibles | Geómetra de Hierro (SMEARGLE Nv90, CRUSTLE Nv91, SIGILYPH Nv92, PORYGONZ Nv93, METAGROSS Nv94, AEGISLASH Nv96) | ¿Qué información mostrará el mosaico restaurado? | TOWNMAP | [ ] |
| 16 | 1396 | 16 · Canal Estelar | La Receta que Lloraba por Otros | Chef de la Sobremesa (ALCREMIE Nv89, POLTEAGEIST Nv90, APPLETUN Nv91, SLURPUFF Nv92, INDEEDEE Nv93, BLISSEY Nv95) | ¿Cómo conservarán la receta de Oria? | SWEETHEART | [ ] |
| 17 | 1421 | 17 · Páramo Sonoro | El Caso de las Cuatro Mediasnoches | Inspector de Medianoche (DITTO Nv90, KECLEON Nv91, NOCTOWL Nv92, ZOROARK Nv93, CHIMECHO Nv94, PORYGON2 Nv96) | ¿Cómo cerrará Lena el caso? | SOOTHEBELL | [ ] |
| 18 | 1446 | 18 · Islas del Viento | El Museo de lo Todavía No Perdido | Custodio de Isobaras (CLAYDOL Nv90, CASTFORM Nv91, BRONZONG Nv92, PORYGONZ Nv93, XATU Nv94, DIALGA Nv96) | ¿Qué ocurrirá con los objetos prematuros? | TIMERBALL | [ ] |
| 19 | 1471 | 19 · Anillo Abisal | El Arrecife que Llegó Después | Custodia del Arrecife (CORSOLA Nv90, CURSOLA Nv91, OMASTAR Nv92, CRADILY Nv93, LAPRAS Nv94, SUICUNE Nv96) | ¿Cómo continuará la restauración paradójica? | SHOALSHELL | [ ] |
| 20 | 1496 | 20 · Ruta del Cometa | Los Dos Nombres del Cometa | Mediadora del Cometa (PLUSLE Nv91, MINUN Nv91, ESPEON Nv93, UMBREON Nv93, PORYGON2 Nv95, PORYGONZ Nv97) | ¿Cómo registrará la clínica a Nilo y Vera? | DESTINYKNOT | [ ] |
| 21 | 1521 | 21 · Territorio Origami | La Central de las Cenizas Vivas | Custodia de Decantación (GRIMER Nv90, WEEZING Nv91, GARBODOR Nv92, MUK Nv93, MAGNEZONE Nv94, ZYGARDE Nv96) | ¿Cómo reparará la central el daño? | CELLBATTERY | [ ] |
| 22 | 1546 | 22 · Delta de Cristal | La Profecía Escrita Después | Oráculo de Imprenta (ABSOL Nv90, XATU Nv91, MALAMAR Nv92, GOTHITELLE Nv93, ORANGURU Nv94, MEW Nv96) | ¿Qué reemplazará a la Orden del Prisma? | MENTALHERB | [ ] |
| 23 | 1571 | 23 · Llanura Meteoro | La Ciudad que Pagaba con Recuerdos | Maestra del Plano Vivo (CONKELDURR Nv90, CRUSTLE Nv91, KLINKLANG Nv92, SMEARGLE Nv93, PORYGON2 Nv94, METAGROSS Nv96) | ¿Cómo terminará la reconstrucción? | RELICBAND | [ ] |
| 24 | 1596 | 24 · Cordillera Coral | Las Cartas de una Familia Incompatible | Cartera de las Ramas (EEVEE Nv90, ESPEON Nv91, UMBREON Nv92, SYLVEON Nv93, DELIBIRD Nv94, CELEBI Nv96) | ¿Cómo custodiará la familia las cartas? | PSYCHICMEMORY | [ ] |
| 25 | 1621 | 25 · Ciudad del Eclipse | El Mercado de los Umbrales Pequeños | Guardiana del Contrapeaje (ABRA Nv90, XATU Nv91, DUSKNOIR Nv92, BRONZONG Nv93, PORYGON2 Nv94, HOOPA Nv96) | ¿Qué estructura reemplazará el mercado clandestino? | ESCAPEROPE | [ ] |
| 26 | 1646 | 26 · Archipiélago Vapor | La Estatua que Ensayaba Ciudades | Custodio del Relieve (SIGILYPH Nv100, RUNERIGUS Nv101, CLAYDOL Nv102, GOLURK Nv103, BRONZONG Nv104, CELEBI Nv106) | ¿Qué función tendrá la estatua? | HARDSTONE | [ ] |
| 27 | 1671 | 27 · Santuario de Polen | La Mina de las Decisiones Sólidas | Regente de las Vetas (SABLEYE Nv101, CARBINK Nv102, GIGALITH Nv103, CRADILY Nv104, METAGROSS Nv105, DIANCIE Nv107) | ¿Cómo continuará la economía minera? | EVERSTONE | [ ] |
| 28 | 1696 | 28 · Cañón Espejo | El Peaje de los Sueños Prestados | Revisora del Umbral (HYPNO Nv102, MUSHARNA Nv103, KOMALA Nv104, GOTHITELLE Nv105, DARKRAI Nv106, CRESSELIA Nv108) | ¿Qué futuro tendrá la terminal onírica? | PSYCHICSEED | [ ] |
| 29 | 1721 | 29 · Bahía Relámpago | El Campeón de las Dos Banderas | Árbitra de Dos Ligas (BRAVIARY Nv104, MILOTIC Nv105, LUCARIO Nv106, AEGISLASH Nv107, DRAGAPULT Nv108, CHARIZARD Nv110) | ¿Cómo resolverán los dos títulos? | FRONTIERPASS | [ ] |
| 30 | 1746 | 30 · Meseta de Tinta | La Academia del Error Permitido | Examinadora Transparente (SKARMORY Nv106, ROTOM Nv107, GASTRODON Nv108, WEAVILE Nv109, VOLCARONA Nv110, GARCHOMP Nv112) | ¿Cómo medirá aprendizaje la academia? | EXPCHARM | [ ] |
| 31 | 1771 | 31 · Reserva de Engranajes | La Frecuencia que Pide Permiso | Custodia de la Frecuencia (CHIMECHO Nv108, KRICKETUNE Nv109, NOIVERN Nv110, EXPLOUD Nv111, MISMAGIUS Nv112, MELOETTA Nv114) | ¿Cómo debe conservarse la frecuencia? | THROATSPRAY | [ ] |
| 32 | 1796 | 32 · Círculo de Ceniza | El Héroe que Pidió un Nombre Pequeño | Guardián del Nombre Menor (UNOWN Nv110, SNEASEL Nv111, AMPHAROS Nv112, MAROWAK Nv113, TYPHLOSION Nv114, HOOH Nv116) | ¿Qué reemplazará la estatua incompleta? | SILVERPOWDER | [ ] |
| 33 | 1821 | 33 · Labertino Boreal | La Victoria que Nadie Ganó | Árbitra del Marcador Vacío (BANETTE Nv112, GENGAR Nv113, MIMIKYU Nv114, ZOROARK Nv115, SPIRITOMB Nv116, MARSHADOW Nv118) | ¿Qué ocurrirá con las victorias transferidas? | SPELLTAG | [ ] |
| 34 | 1846 | 34 · República de Musgo | La Excavación que Fabricó su Pasado | Custodio del Estrato Fabricado (YAMASK Nv114, CLAYDOL Nv115, ARCTOZOLT Nv116, DRACOVISH Nv117, GOLURK Nv118, REGIGIGAS Nv120) | ¿Cómo se reparará el fraude sin negar a la criatura? | RAREBONE | [ ] |
| 35 | 1871 | 35 · Cinturón Aurora | El Refugio que Contestaba Solo | Guardiana del Parte Invernal (DELIBIRD Nv116, ABOMASNOW Nv117, MAMOSWINE Nv118, FROSLASS Nv119, AVALUGG Nv120, ARTICUNO Nv122) | ¿Qué función tendrá la baliza después del rescate? | NEVERMELTICE | [ ] |
| 36 | 1896 | 36 · Trinchera de Luz | El Registro que No Pudo Clasificarte | Custodio del Checksum Abierto (PORYGON Nv118, DITTO Nv119, ROTOM Nv120, KECLEON Nv121, TYPENULL Nv122, PORYGONZ Nv124) | ¿Cómo se reconstruirá el registro? | UPGRADE | [ ] |
| 37 | 1921 | 37 · Provincia del Eco | El Acertijo que Cambiaba la Pregunta | Jueza de la Regla Fija (SIGILYPH Nv120, XATU Nv121, KLEFKI Nv122, MALAMAR Nv123, BEHEEYEM Nv124, UXIE Nv126) | ¿Qué futuro tendrá el acertijo? | MENTALHERB | [ ] |
| 38 | 1946 | 38 · Horizonte Fractal | El Enemigo que Alguien Recordó por Ti | Mediadora del Recuerdo Prestado (HYPNO Nv122, MUSHARNA Nv123, ZOROARK Nv124, ABSOL Nv125, LUCARIO Nv126, CRESSELIA Nv128) | ¿Cómo se conservará la escena implantada? | SOULDEW | [ ] |
| 39 | 1971 | 39 · Corona de Bruma | La Copia que Aprendió a Despertar | Garante de la Continuidad Viva (BALTOY Nv124, CLAYDOL Nv125, BRONZONG Nv126, METAGROSS Nv127, SILVALLY Nv128, MEW Nv130) | ¿Qué relación protegerá el archivo? | DUBIOUSDISC | [ ] |
| 40 | 1996 | 40 · Umbral Mil | El Final que Dejó Cuarenta Puertas Abiertas | Testigo de las Cuarenta Puertas (SMEARGLE Nv130, GARDEVOIR Nv131, ZOROARK Nv132, ABSOL Nv133, SILVALLY Nv134, ARCEUS Nv136) | ¿Qué estructura mantendrá abiertas las cuarenta anclas? | LEGENDPLATE | [ ] |
- [ ] B-final. La convergencia (mapa 1996) exige 39 sellos previos; verificar que se anuncia como requisito y que el retorno permanece abierto si faltan sellos.

## C. Tier 2: muestreo de las rutas recientes (10 comprobaciones)

Cada ruta: dos NPCs con estados antes/después, objetivo y mecánica claros, decisión persistente que cambia el diálogo posterior, recompensa entregada una sola vez (con la Mochila llena debe poder reintentarse) y retorno a Puerto Horizonte intacto.

| # | Mapa | Ruta | Mecánica | Recompensa | Hecho |
|---:|---:|---|---|---|---|
| 1 | 1733 | La Antena que Negociaba el Viento | Turnos de ráfaga | STICKYBARB | [ ] |
| 2 | 1740 | El Consejo que Compartía un Campeón | Registro doble | RAZORFANG | [ ] |
| 3 | 1751 | La Academia que Vendía Dificultad | Evaluación de contrajuego | SOFTSAND | [ ] |
| 4 | 1758 | El Análisis que Fichaba a los Jugadores | Hoja de lectura doble | SHARPBEAK | [ ] |
| 5 | 1765 | El Mapa de Tinta que Explicaba Atajos | Doble lectura del mapa | POISONBARB | [ ] |
| 6 | 1776 | La Caja que Guardaba un Latido | Escucha voluntaria | SPELLTAG | [ ] |
| 7 | 1783 | La Casa que Repetía la Canción | Permiso de grabación | TWISTEDSPOON | [ ] |
| 8 | 1790 | La Última Campana del Silencio | Horario de silencio | HARDSTONE | [ ] |
| 9 | 1801 | El Retrato que Pedía No Rehacerse | Restauración con límites | MIRACLESEED | [ ] |
| 10 | 1808 | La Avenida que Contaba los Ausentes | Placa con fecha | REAPERCLOTH | [ ] |

## D. Tier 3: una regla por familia de anomalía (14 comprobaciones)

Cada regla: identificación del eco legible, las tres reglas de contrajuego se entienden, la microdecisión resuelve con self-switch (reversible, sin flags globales) y la baliza/navegación/retorno siguen operativas.

| # | Mapa | Eco | Familia | Variante | Hecho |
|---:|---:|---:|---|---|---|
| 1 | 1522 | 0502 | geografía | Medir dos veces | [ ] |
| 2 | 1523 | 0503 | gravedad | Pesar la mochila | [ ] |
| 3 | 1524 | 0504 | tiempo | Eco con retraso | [ ] |
| 4 | 1525 | 0505 | clima | Paraguas de baldosa | [ ] |
| 5 | 1527 | 0507 | sombras | Sombra de relleno | [ ] |
| 6 | 1528 | 0508 | luz | Encender lo propio | [ ] |
| 7 | 1529 | 0509 | coordenadas | Dos brújulas | [ ] |
| 8 | 1530 | 0510 | pasos | Paso de prestado | [ ] |
| 9 | 1531 | 0511 | silencio | Silencio pactado | [ ] |
| 10 | 1532 | 0512 | materiales | Alinear memoria | [ ] |
| 11 | 1534 | 0514 | compases | Compás de contratiempo | [ ] |
| 12 | 1535 | 0515 | señales | Señal de retraso | [ ] |
| 13 | 1536 | 0516 | mapas | Mapa de capas | [ ] |
| 14 | 1537 | 0517 | nombres | Etiqueta atada | [ ] |

## E. Regresión general (5 comprobaciones)

- [ ] E1. Ninguna batalla interna del juego perdió la Mochila (probar al menos un gimnasio, la Liga y un combate del Grandeur Club).
- [ ] E2. `Save*.rxdata` intactas: guardar/cargar antes y después de recorrer la expansión.
- [ ] E3. Kirin/Android: recorrer la ruta crítica en el dispositivo y confirmar que los mapas nuevos aparecen con nombre.
- [ ] E4. Los textos de los mapas nuevos se ven completos (sin cortes de línea raros) a resolución de la pantalla del dispositivo.
- [ ] E5. Ninguna puerta de salida quedó bloqueada por los NPCs nuevos en el laboratorio de Oak ni en los hub.

## Total

**81 comprobaciones** (12 críticas + 40 anclas + 10 rutas Tier 2 + 14 ecos + 5 regresión). Marca este archivo o una copia local; no hace falta commitearlo.

