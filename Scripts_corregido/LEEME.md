# Paquete corregido, «La Ruta de Dios», «Dimensional Nightmare» y «Expansión Multiversal»

## Arreglo 2026-10-09 (9) — R15: el NameError de la cima no puede volver, y ningún recurso puede faltar

Este arreglo atiende la captura de partida real (`NameError: uninitialized
constant RUTA_ARCEUS_SEQUITO` al abrir el duelo en la Cima del Génesis):

- **El bug.** La tabla del séquito divino (`RUTA_ARCEUS_SEQUITO`) y el constructor
  del legendario (`pbArceusBuildLegendario`) habían quedado definidos *dentro*
  de `class PokeBattle_Battle`; Ruby los esconde ahí y el evento de la cima, que
  vive fuera de esa clase, no los encontraba. Ambos se movieron al nivel
  superior y el guion instalado se regeneró completo.
- **Diez mil pruebas nuevas del arranque real.** La batería de fuzz pasó de
  probar piezas sueltas a **ejecutar el evento de inicio del duelo completo
  10 000 veces** (con prólogo incluido en 1 000 de ellas) sobre el código
  instalado: captura, huida, rendición, empate, victoria y la merced única del
  Rotom, en cada orden posible. Resultado: **1 000 000 de escenarios, 0 fallos**.
- **Imposible que falte un recurso de ningún tipo.** La auditoría de recursos
  ahora barre TODA referencia del guion (movimientos, especies y sprites,
  objetos, música, fondos de batalla, personajes) y exige que exista en el
  juego **y en este paquete**. Así se encontró un hueco real: las 6 pistas de
  música del duelo no viajaban en el paquete. Ya están.
- **Imposible que un nombre quede mal definido.** Un auditor nuevo revisa que
  ninguna constante ni método del duelo quede anidado donde el juego no pueda
  verlo: exactamente la clase de error de tu captura.

**Instalación R15:** además de `Data/` y `Graphics/` (ver R14), copia ahora
también la carpeta `Audio/` del paquete: contiene las siete pistas del duelo
(`Legend Creation Trio`, `Battle! Legendary Raid`, `Battle! Eternatus - Phase
1/2/3`, `Battle! Ultra Necrozma`) más `Legend Sinnoh` y `secretvolo`. Sin ellas
las fases cambiarían en silencio. El ZIP raíz y el paquete directo ya las
incluyen.

## Arreglo 2026-10-08 (8) — R14: el Creador como debe verse: batalla doble, mil brazos reales, cosmos que cambia y ni un destello blanco

Este arreglo atiende el reporte de partida real sobre el evento que abre el
DLC, y además incorpora la referencia visual del duelo (sprite de mil brazos,
fondo cósmico y nombre verdadero del Creador):

- **La batalla ya no se repite.** La causa era el pseudo-PC: su error mataba el
  evento antes de marcar la cima como resuelta y la página sin condición volvía
  a lanzar el duelo. El pseudo-PC **se eliminó por completo** (como pediste):
  si cae todo el equipo queda la merced única del Rotom (35 %, una vez) y, si
  no, la rendición cierra el evento por el flujo normal. Al resolver el duelo
  (captura, victoria o empate) los interruptores 873/874/875 y el de evento
  completado quedan firmados y la cima permite **moverse libremente**.
- **Sin curas antes de Volo.** El descanso del altar que curaba al equipo antes
  del duelo con Volo desaparece: Volo te espera tal como quedaste en la cima
  (y también en la revancha de la página 2).
- **Nunca más los mismos ataques.** El repertorio de Arceus se fija por etapa y
  por objetivos vivos (ya no se recalcula idéntico cada turno) y dentro de él
  elige con **azar divino ponderado por el puntaje real del motor** (daño,
  precisión, tipo, objetivo), castigando el golpe que acabas de resistir y sin
  repetir el reciente: amenaza de verdad y distinto cada turno.
- **Tus Pokémon ya no se modifican.** Sólo se escala el bando de Arceus; los
  niveles, stats y movimientos del equipo de Ash quedan intactos siempre.
- **Batalla doble real con la Orden Divina.** Dialga, Palkia y Giratina
  flanquean al Creador desde el primer turno (su nivel sale del equipo de Ash,
  +8, y sólo escala el bando divino); cuando uno cae, el motor envía al
  siguiente. Y cuando Arceus **nombra** a un legendario, éste se hace presente:
  si sigue en pie ejecuta la orden él mismo (se fortalece y golpea); si cayó,
  **reemplaza el cuerpo de Arceus** dos turnos con su sprite, tipos y ataques
  reales (posesión revertible: al terminar, el Creador retoma su forma).
- **La Mega se VE.** Al agotar la quinta barra, Arceus cambia de sprite a la
  **Forma Origen de los mil brazos** (frente y espalda nuevos, rueda dorada y
  halo de brazos) con temblor, tono y escala — y el **fondo de la batalla es el
  cosmos de la Cima**, que cambia con el duelo: `genesis1` (calma estelar),
  `genesis2` (tormenta violeta) y `genesis3` (apocalipsis carmesí), con las
  plataformas de mármol y oro del altar. La Forma Primigenia devuelve el corpo
  al Arceus base sobre la tormenta oscura.
- **Cero pantallas blancas.** No queda ni un `pbFlash` en el código de la Ruta:
  todos los clímax son cinemáticas de tono, sacudida, escala, sprite y fondo.
- **Tu Arceus capturado hereda la Mega.** Una vez por combate, al caer por
  debajo de la mitad de sus PS, despliega los mil brazos (sprite real, +2 de
  ataque, ataque especial y velocidad) y al terminar el combate vuelve a su
  forma base. Sigue teniendo Tabla giratoria, Juicio con STAB universal y modo
  divino en los cuatro mundos autorizados.
- **Nombre verdadero.** El marcador del duelo muestra **ARCEUS ORIGEN**: porque
  siempre, en toda forma y en todo bando, es el dios de los Pokémon.

**Instalación R14:** además de `Data/`, copia ahora las carpetas `Graphics/`
del paquete (`Graphics/Battlebacks/genesis*.png` y
`Graphics/Pokemon/Front|Back/ARCEUS_18.png`): sin ellas el motor seguiría
peleando con los fondos y sprites antiguos. El ZIP raíz y el paquete directo
ya las incluyen.

## Arreglo 2026-10-08 (7) — Pelear contra un dios: daño variable, diálogos que no se repiten, música por fase y los juegos del Génesis

El duelo final deja de ser un patrón fijo y se siente como pelear contra un
dios que **juega** contigo, sin dejar de ser un duelo Pokémon:

- **El % de vida que te quita VARÍA por acción.** Ya no es un porcentaje fijo:
  cada golpe de Arceus pesa entre un **12 % y un 33 %** de la vida máxima del
  objetivo, más pesado en las fases tardías y en la Forma Mega, y el bonus de
  sus juegos lo parte a la mitad. Nunca supera el tercio de R9: siguen siendo
  necesarias al menos tres acciones para derribar a un Pokémon sano, pero ya
  no puedes contarlas de memoria. Puedes perder si te confías.
- **Ningún diálogo se repite.** Todos los textos del dios (burlas, juegos,
  invocaciones, la copia de tu equipo, su merced, sus comentarios de turno)
  salen de **mazos por categoría** que se barajan y se sacan sin reposición:
  una línea sólo puede volver a salir cuando ya salieron todas las demás. Y
  van **con calma**: cada frase espera tu confirmación.
- **La cinemática es ACCIÓN, no texto.** Al abrir el duelo, Arceus desciende
  cara a cara y **alza literalmente el sprite de tu Pokémon en pantalla**
  (sube, queda suspendido, flash, temblor, y vuelve a caer) mientras dice:
  «Podría matarte ahora mismo, a ti y a tus Pokémon... pero veamos de qué son
  capaces». Cada tres turnos señala el sprite del Pokémon que tengas activo y
  te habla **de él por su nombre** («¿Charizard? Yo lo soñé antes de que
  existiera su primer ancestro»).
- **Minijuegos dentro de la batalla.** El **Juicio Ciego**: eliges dónde
  esconderte (tras el fuego, el agua o la tierra) y si adivinas, sus próximos
  dos golpes pesan la mitad. La **Ruleta del Génesis**: gira a tu favor (cura,
  ataque, velocidad, limpieza del campo o la sonrisa del dios). Los juegos
  nunca te ponen peor que la batalla normal: el premio ayuda, el fallo no
  castiga de más.
- **Invocaciones del lore: la Orden Divina.** Si Arceus ordenara el
  apocalipsis, sus creaciones lo ejecutarían: el **Trío de la Creación**
  (Dialga congela el tiempo, Palkia rasga el espacio, Giratina arrastra su
  antimateria) golpea **sin rematar jamás** (siempre te deja al menos 1 PS:
  «No lo remato. Todavía no. Eso me lo guardo»); **Groudon y Kyogre** traen su
  clima real de diluvio y sequía; **Uxie, Mesprit y Azelf** apagan la mente
  (bajan stats); **Mew y Celebi** —la Resistencia Imposible— se interponen y
  te curan; **Rayquaza y Zygarde** someten el equilibrio y aquietan el campo.
  Nunca se repite la misma leyenda dos veces seguidas.
- **Copia de tu equipo.** En el Juicio del Vínculo, Arceus te recuerda que él
  soñó a tus Pokémon primero: te roba hasta tres golpes que tú mismo les
  enseñaste (más el Juicio) y pelea con ellos.
- **La merced del último Pokémon.** Cuando te queda **uno solo** en pie, una
  única vez por batalla, Arceus detiene el cielo y te pregunta en una ventana
  de elección: ¿quieres que cure a todo tu equipo (vida, estado y PP) para que
  sea parejo? Tú decides; si la rechazas, sonríe: «Orgullo. Bien. Terminemos
  esto».
- **La música cambia en cada fase.** Seis pistas reales del juego, una por
  fase (`Legend Sinnoh` → `Legend Creation Trio` → `Battle! Legendary Raid` →
  `Battle! Eternatus - Phase 1` → `Phase 2` → `Battle! Ultra Necrozma`), más
  `Battle! Eternatus - Phase 3` para la Forma Primigenia. La QA verifica que
  cada pista exista de verdad en `Audio/BGM`.
- **Nada de esto puede reventar.** El turno divino cuelga del cálculo de
  prioridad **aislado** (si algo fallara, la ronda sigue intacta) y cada
  sistema (música, apertura, merced, juegos, invocaciones, copia) tiene su
  propio escudo. Las ventanas de elección usan la firma exacta del motor
  (`pbShowCommands` con valor por defecto entero, como el propio motor las
  llama): la B siempre responde bien.
- **Auditoría de recursos reales.** Un verificador nuevo
  (`npm run verify:arceus:recursos`) comprueba que TODO lo que el duelo nombra
  exista en los archivos del juego: los 44 movimientos referenciados en
  `moves.dat`, las 37 especies en `species.dat` con su sprite frontal (y las
  18 formas de Arceus), las 18 Tablas + Poké Ball en `items.dat`, las 7 pistas
  en `Audio/BGM` y los 5 sprites de personaje del prólogo. Resultado: **nada
  falta**. Lo único que el juego no trae son animaciones «Common:» de clima
  (este Fire Ash no las usa en batalla): el motor las salta en silencio y el
  clima funciona igual a nivel mecánico. QA: **1 000 000 de escenarios, 0 fallos**, con una familia
  nueva (F5 · 200 600) dedicada a estos sistemas y 3 000 duelos completos con
  todo activado (1 764 victorias, 333 Formas Primigenias); el verificador de
  cinemáticas sube a **69 invariantes**.

Instalación idéntica: copia `Scripts_corregido/Scripts.rxdata` sobre
`Data/Scripts.rxdata` (o descomprime el ZIP del paquete directo). Si tenías el
duelo a medias, sal de la Cima y vuelve a entrar.

## Arreglo 2026-10-08 (6) — Ninguna fase revienta a medias, y Arceus Primigenio

Revisión fase por fase contra las firmas reales del motor (las 405 secciones
instaladas), más el diseño de la forma verdadera del dios:

- **Cada fase termina entera o no termina.** Antes, un solo error dentro de una
  fase (clima, salas, silencio, tablilla…) abortaba en silencio **todos** los
  sub-efectos que venían después: la fase quedaba a medias sin que nadie lo
  viera. Ahora cada sub-efecto corre con su propio escudo (`CanonArceus.paso`)
  y la fase cierra con `verificar_fase`: campo saneado (clima/terreno válidos)
  y PS de todos los combatientes dentro de rango, pase lo que pase en cada
  paso.
- **Auditoría de firmas ("expected mal firmados").** Se comparó cada llamada
  que nuestras fases hacen al motor contra las firmas reales: objetivos de
  efectos de campo y de lado (`battle.field.effects`, `sides[i].effects`),
  constantes `PBEffects`, setters `item=`/`ability=`, la IA
  (`pbRegisterMoveTrainer` con sus 4 argumentos), los helpers de pantalla
  (`pbFlash`/`pbShake`/`pbToneChangeAll` globales), `from_pokemon_move`,
  `GrowthRate.max_level` y la firma v19 de `pbStartWeather`. No quedan
  llamadas con argumentos de tipo u orden equivocados; el auditor estático de
  patrones de campo sigue en **0 hallazgos sobre 405 secciones**.
- **ARCEUS PRIMIGENIO, LA FORMA PRIMIGENIA.** Cuando la última barra cruza el
  umbral rojo, los mil brazos se desploman y queda lo que había *antes* de la
  creación: cartel y flash propios, **suelta su Tabla** (el Juicio vuelve a su
  tipo original, así que un Pokémon espectro puede negarlo: esa es la puerta
  estratégica), pool primigenio (`Juicio, Velocidad Extrema, Golpe Umbrío,
  Giga Impacto`) y una voz por acción distinta de la de los Mil Brazos. El
  tope de R9 (un tercio de la vida máxima por acción) no cambia: la forma es
  espectáculo y lectura, no dificultad nueva.
- **La QA ahora nota las fases mudas.** El millón de escenarios
  (`npm run verify:arceus:fuzz`) exige que cada fase deje sus efectos visibles
  (mochila sellada + Sala Mágica, clima + Gravedad, silencio + velo de suerte,
  salas invertidas, tablilla, cartel de los Mil Brazos) y que la Forma
  Primigenia suelte la Tabla y rearme su pool: en la muestra corren **593
  duelos con Primigenia**, todos coherentes. Total: **1 000 000 de escenarios,
  0 fallos**.

Instalación idéntica: copia `Scripts_corregido/Scripts.rxdata` sobre
`Data/Scripts.rxdata` (o descomprime el ZIP del paquete directo). Si tenías el
duelo a medias, sal de la Cima y vuelve a entrar.

## Arreglo 2026-10-08 (5) — Cero errores de script en batalla y Mega Arceus de los Mil Brazos

Este arreglo ataca el cartel de error que aparecía **en plena batalla**
(`ArgumentError: Invalid argument passed to method. Expected 5 to be one of
[Symbol, GameData::BattleWeather, String], but got Integer`, con el fin de
ronda en la traza) y añade la fase nueva que pediste:

- **La causa exacta del cartel.** Cada fase del duelo reescribe una regla del
  combate; la fase del cielo sembraba su clima con una llamada mal firmada:
  pasaba el *símbolo de un movimiento* como usuario y el *número 5* como clima.
  El campo quedaba con `weather = 5` y, al cerrar el turno, el motor consultaba
  `GameData::BattleWeather.try_get(5)` y reventaba. Ahora el clima se escribe
  con la firma correcta de v19 (`pbStartWeather(nil, clima, true, true, 5)`) y
  con símbolos reales de clima (`:Rain`, `:Sun`, `:Sandstorm`, `:Hail`, `:Fog`).
- **Red anti-error sobre el campo (R10).** Aunque otro mod o una partida vieja
  escriban basura, ya no puede verse un cartel: `pbStartWeather` y
  `defaultWeather=` **validan antes de escribir**; cada fin de ronda
  **sanitiza** clima y terreno antes de que el motor los lea; y si algo
  inesperado revienta dentro del fin de ronda, el error se absorbe y sanitiza
  ahí mismo en vez de llegar al jugador. El silencio de talentos de la fase 3
  ahora usa el efecto real del motor (Bilis Negra) en vez de borrar el talento.
- **Auditoría de cada fase y cada script.** El auditor estático
  (`npm run verify:scripts:calls`) revisa las 405 secciones instaladas también
  contra patrones de campo peligrosos (clima/terreno escritos con enteros o
  nil, firmas mal puestas): **0 hallazgos**.
- **Fase 6 nueva: MEGA ARCEUS, EL DE LOS MIL BRAZOS.** Al vaciar la quinta
  barra el dios megaevoluciona: cartel y flash propios, animación de mil
  proyectiles, un grito por acción («¡Mil brazos descienden a la vez…!») y un
  pool de movimientos multigolpe (Furia Golpes, Puño Cometa, Pin Misil…).
  El equilibrio de R9 no se toca: cada acción suya sigue topada en un tercio de
  la vida máxima, así que el espectáculo no vuelve imposible el duelo.
- **Un millón de escenarios de QA.** `npm run verify:arceus:fuzz` ejecuta el
  código instalado dentro de Ruby 3.3 (WebAssembly) sobre un motor de prueba
  que replica las validaciones reales de GameData: 800 000 micro-escenarios de
  la guardia anti-KO, 150 000 de clima/terreno sucios con fin de ronda, 6 000
  duelos completos aleatorios (seis barras, umbral rojo, megaevolución y
  captura) y 44 000 barridos de las seis fases: **1 000 000 de escenarios,
  0 fallos**.

Instalación idéntica a la de siempre: copia `Scripts_corregido/Scripts.rxdata`
sobre `Data/Scripts.rxdata` (o descomprime el ZIP del paquete directo). Si
tenías el duelo a medias, sal de la Cima y vuelve a entrar.

## Arreglo 2026-10-08 (4) — Reajuste de dificultad: el duelo final se gana con estrategia

El duelo de la Cima quedó demasiado duro: aunque ya se jugaba y tus golpes
movían las barras, la presión de Arceus ganaba casi siempre la carrera de
desgaste. Este paquete lo reajusta (nada más cambia):

- **Su golpe pesa un tercio.** Ninguna acción de Arceus quita más de un tercio de
  la vida máxima de tu Pokémon activo, multigolpes y movimientos de KO incluidos:
  hacen falta **cuatro acciones suyas** para tumbar a un Pokémon sano. Si un
  Pokémon ya está muy bajo (por debajo de ese tercio), sí puede caer.
- **El umbral rojo ya no borra tu avance.** Cuando Arceus cruza el umbral rojo ya
  no restaura la barra completa: recupera **media barra**, una vez por etapa.
- **Menos castigo en las etapas finales.** Las etapas 5 y 6 suben menos el nivel
  del rival, así que tus Pokémon dejan de pelear cuesta arriba.
- Lo demás sigue igual: tú eliges los comandos, tu lado abre cada ronda, tus
  golpes mueven las seis barras (×4, mínimo media barra por impacto) y la captura
  garantizada de la sexta barra no cambia.

**Ritmo verificado:** `npm run verify:arceus:shield` ahora simula el duelo completo
sobre el código real y da **12 turnos con 2 bajas** incluso en el peor caso (sólo
el daño mínimo del vínculo), y **17 turnos con 4 bajas** si el jugador pierde un
turno de cada tres (inmunidades, fallos, cambios, objetos). Se gana administrando
el equipo, pero Arceus sigue derribando a un Pokémon cada cuatro turnos.

## Arreglo 2026-10-08 (3) — El duelo final contra Arceus ahora se juega de verdad

Si el combate final de la Cima del Génesis se sentía como una derrota anunciada
(Arceus actuaba primero, tus Pokémon podían quedar a nivel 1 y un solo golpe suyo
derribaba de un turno), este paquete cambia el duelo para que **Ash pelee en
persona**:

- **Tú juegas el combate.** El duelo ya no se resuelve por guion: eliges los
  movimientos de siempre y cada golpe mueve las seis barras del dios. La fuerza
  que Ash ganó mirando las batallas del prólogo multiplica el daño que hace a
  cada barra y garantiza que ningún impacto quede en nada (mínimo, media barra).
- **Tu lado abre cada ronda.** Dentro del duelo divino la iniciativa es de Ash:
  Arceus responde después, incluso con el Espacio Raro de la Etapa 4 activo.
- **Arceus no puede noquear de un solo golpe.** El daño de cada turno suyo está
  topeado y repartido: mira el Arreglo 4, arriba, para los valores vigentes.
- **El Juicio del Vínculo ya no te apaga.** La Etapa 4 dejó de bajar a nivel 1 a
  tus Pokémon: ahora aplica un castigo real, pero jugable.
- **Opción de saltar el prólogo.** Al llegar por primera vez a la cima aparece la
  pregunta «Ver el prólogo completo / Ir directo al duelo con Arceus». La segunda
  opción abre el combate de inmediato, sin las tres cinemáticas.

El resto sigue intacto: los tres combates del prólogo, la inmunidad de Arceus en
esas escenas, las seis barras, la captura garantizada y el pseudo-PC de
continuación.

**Instalación:** vuelve a copiar `Data/Scripts.rxdata` de este paquete sobre tu
juego (o extrae otra vez `Fire_Ash_Paquete_Directo.zip`) y carga tu partida. No
toques tus guardados: todo el arreglo va en los scripts. Si ya empezaste el duelo
final, sal y vuelve a entrar a la Cima para que el combate se monte con las
reglas nuevas.

## Arreglo 2026-10-08 (2) — Ball Breaker ya no congela el combate con «undefined method 'selfProtected?'»

Si al pelear contra **Steven (Máximo) y su Metagross** viste el cuadro de error:

```text
Exception: NoMethodError
Message: undefined method 'selfProtected?' for an instance of PokeBattle_Battler
Backtrace: ... 'PokeBattle_Move_DF08#pbAttackingTurnEffect' ...
```

no era un fallo de tus partidas ni del escudo de Arceus: el movimiento **Ball Breaker**
(el ataque de acero de dos turnos que el juego llama «empezó a cargar su bola de
acero») consultaba dos métodos que Fire Ash 3.7 nunca define
(`selfProtected?` y `sideProtected?`). Al usarlo, el combate se detenía ahí.

El paquete ya lo arregla:

- **Ayudantes restaurados:** `PokeBattle_Battler#selfProtected?` y
  `#sideProtected?` vuelven a existir con la misma lógica que usa el motor en
  otros movimientos que atraviesan protecciones (Protect, King's Shield, Spiky
  Shield, Baneful Bunker, Obstruct y, de lado, Crafty Shield, Mat Block, Wide
  Guard y Quick Guard). Si algún día tu copia los define, se respetan los suyos.
- **Movimiento blindado:** el efecto de Ball Breaker se reescribió para que,
  aunque falten esos ayudantes, siempre avise y retire las protecciones en lugar
  de abortar el combate (también tolera un objetivo nulo).
- **Auditoría nueva:** `npm run verify:scripts:calls` recorre las 405 secciones
  de `Scripts.rxdata` y avisa si algún script llama a un método que no existe,
  que es exactamente el tipo de error que provocaba este cuadro. Ya corre dentro
  de `npm test`.

**Instalación:** vuelve a copiar `Data/Scripts.rxdata` de este paquete sobre tu
juego (o extrae otra vez `Fire_Ash_Paquete_Directo.zip`) y carga tu partida. El
error aparecerá una sola vez más si lo tenías en pantalla: cierra el juego,
reemplaza el archivo y continúa desde tu último guardado.

## Arreglo 2026-10-08 — Arceus ya no puede ser derrotado por el granizo ni por Metagross

Si en tu partida el **granizo** o un **Metagross** seguían derrotando a Arceus (en el
prólogo de Cynthia/Máximo, en el de Red/Gold o en el duelo final), vuelve a copiar
`Data/Scripts.rxdata` de este paquete sobre tu juego (o extrae otra vez el ZIP
`Fire_Ash_Paquete_Directo.zip`). No toques tus partidas: el arreglo va en los scripts.

- **Prólogo:** Arceus es intocable. Ningún ataque, crítico, clima, retroceso,
  habilidad, movimiento custom ni escritura directa de PS mueve su barra: el aura
  dorada absorbe el golpe con un mensaje y sólo un intento que habría sido letal
  provoca su burla. Un setter de PS protegido y un respaldo en `pbFaint` impiden
  cualquier derrota del Creador.
- **Sin granizo heredado:** la nieve de la cumbre (`map_metadata`) ya no entra a los
  combates de la cima como granizo (`setBattleRule("weather", "None")` en las
  escenas y `recordBattleRule("weather", "None")` en el duelo divino).
- **Duelo de Ash:** el daño de los movimientos —que el motor aplica con
  `target.hp -= hpLost`, sin pasar por `pbReduceHP`— también pasa por las seis
  barras. Un Metagross ya no puede tumbar a Arceus de un golpe: el KO se convierte
  en transición de etapa y las bolas siguen bloqueadas hasta agotar la sexta barra.

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
- `Scripts.rxdata`: archivo corregido de scripts base. Incluye las colisiones de sprites, la interacción con NPCs, la corrección de guardado para Android/Kirin, `La Ruta de Dios`, la corrección de Grandeur Club y la compatibilidad de **Ball Breaker** (`selfProtected?`/`sideProtected?` restaurados, para que el movimiento de Metagross no cierre el combate con `NoMethodError`). También repara tonos serializados como texto (`Tone.new(...)`) antes de interpolarlos en pantalla o imágenes, evitando el `NoMethodError` de Kirin y conservando el efecto original cuando el tono se puede recuperar. Si un guardado antiguo deja `transition_name` en `nil`, usa la transición predeterminada al cambiar de mapa en lugar de generar un `TypeError`.
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
