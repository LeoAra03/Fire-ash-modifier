#!/usr/bin/env node
/** Cinco lotes Tier 2 (25 rutas curadas) para el macrociclo de trabajo 03. */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const N = (name, sprite, role, partnerPokemon, motivation, conflict, before, after) => ({
  name, sprite, role, partnerPokemon, motivation, conflict, dialogue: { before, after },
});
const specs = [
  {
    mapId:1108, title:"La Veta que Firmaba con Luz",
    promise:"En una galería de cuarzo, las marcas luminosas que guían a los mineros resultan ser señales de descanso de una colonia de Sableye.",
    objective:"Comparar tres pulsos minerales y abrir un paso que no atraviese la cámara de alimentación.",
    mechanic:["Cartografía de destellos",["Esperar un ciclo completo antes de marcar.","Distinguir reflejo de señal repetida.","Dejar una franja sin linternas para la colonia."],"La cuerda de salida permanece visible durante toda la observación."],
    npcs:[
      N("Petra Lumbre","trchar008","geóloga de turno","SABLEYE","Quiere mantener abierta la mina sin expulsar a la colonia.","Confundió cada brillo con mineral inerte y trazó el túnel sobre su comedor.",["Mi tiza señala roca; Sableye responde desde dentro.","Un destello aislado puede ser mi lámpara, tres iguales ya son conversación.","La veta vale menos si deja la galería vacía."],["El plano reserva una cámara oscura junto al nuevo paso.","Las marcas de Sableye figuran como señal viva, no como mena.","Mañana mediremos sin encender todas las lámparas."]),
      N("Ciro Faceta","NPC 04","tallador de cuarzo","CARBINK","Busca enseñar cortes seguros usando fragmentos ya desprendidos.","Sus muestras premiaban el brillo más raro y alentaban excavaciones apresuradas.",["Carbink trae piezas caídas; ninguna necesita cincel.","Una faceta hermosa también puede indicar dónde no tocar.","Voy a cerrar la vitrina de trofeos hasta corregir las etiquetas."],["La exposición explica origen, caída y permiso de cada muestra.","Los aprendices practican con vidrio antes de entrar a la galería.","La pieza más brillante quedó donde la colonia la usa."])
    ],
    decision:["¿Cómo quedará señalada la nueva ruta?",["Mapa de pulsos compartido","Corredor oscuro protegido"],["Petra publica horarios y patrones sin marcar nidos.","Ciro instala balizas bajas fuera de la cámara de alimentación."],["Otras cuadrillas podrán reconocer señales vivas.","La colonia conservará una zona sin observadores."]],
    reward:["FOCUSSASH","Recuerda que retirarse a tiempo puede proteger una expedición entera."]
  },
  {
    mapId:1115, title:"El Sendero de las Flechas Prestadas",
    promise:"Los postes de una ruta cambian de dirección cuando pasa una multitud y terminan enviando a los viajeros solos hacia el barro.",
    objective:"Recorrer dos desvíos y fijar señales que indiquen destino, distancia y estado del suelo.",
    mechanic:["Prueba de orientación",["Leer el destino antes del color de la flecha.","Comparar la huella de Mudsdale con la profundidad del barro.","Confirmar el regreso desde ambos sentidos."],"Los postes viejos siguen apuntando al puerto hasta terminar la prueba."],
    npcs:[
      N("Vera Mojón","trchar009","cartógrafa de caminos","LYCANROC","Quiere que una persona pueda orientarse sin seguir a la mayoría.","Diseñó flechas que rotaban hacia el flujo más grande y borraban rutas pequeñas.",["Lycanroc huele el norte aunque cien botas giren al sur.","Una flecha sin destino solo imita a la última persona.","Este desvío merece nombre, distancia y regreso."],["Cada cara del poste explica adónde conduce.","La senda menor ya no desaparece cuando llega un grupo.","Añadí una marca táctil para la niebla."]),
      N("Nelo Surco","NPC 04","arriero de suministros","MUDSDALE","Necesita evitar barro profundo sin cerrar el camino a pie.","Sus huellas pesadas parecían confirmar una ruta que solo servía a su carreta.",["Mudsdale pisa hondo incluso donde el suelo está firme.","Mi surco no debe convertirse en una orden.","Puedo dejar una regla de carga en vez de una prohibición."],["El cartel separa paso peatonal y límite de peso.","La carreta usa el terreno seco sin ocupar todo el sendero.","Ahora registro lluvia antes de dibujar un desvío."])
    ],
    decision:["¿Qué información encabezará los postes?",["Destino y distancia verificables","Estado del suelo por tipo de paso"],["Vera fija nombres legibles desde las dos direcciones.","Nelo publica carga, lluvia y una revisión diaria."],["Los caminos pequeños conservarán identidad propia.","Las rutas podrán cambiar sin ocultar por qué."]],
    reward:["LIGHTCLAY","Da forma a una guía visible sin volver rígido el camino."]
  },
  {
    mapId:1126, title:"La Ciudad que Adelantaba el Mediodía",
    promise:"Un reloj orbital adelanta las tareas de la ciudad cada vez que Rotom detecta una nube, hasta mezclar desayunos, turnos y descansos.",
    objective:"Sincronizar tres relojes públicos con señales observables y devolver a cada barrio su margen local.",
    mechanic:["Ronda de sincronía",["Comparar campana, sombra y reloj doméstico.","Registrar la nube sin tratarla como cambio de hora.","Mantener una señal manual de corrección."],"El centro de descanso no modifica su horario durante la calibración."],
    npcs:[
      N("Ada Meridiana","trchar008","relojera municipal","ORBEETLE","Quiere una hora común que no borre ritmos de barrio.","Ató demasiadas tareas al pronóstico automático de Orbeetle.",["La sombra llega puntual; nuestra alarma es la que se impacienta.","Orbeetle predice nubes, no almuerzos.","Un reloj público debe admitir cuándo fue corregido."],["Las tres esferas muestran hora y última calibración.","Cada barrio conserva diez minutos de margen anunciado.","La campana ya no persigue al cielo."]),
      N("Romo Chispa","NPC 04","electricista de plaza","ROTOM","Busca estabilizar la red sin encerrar a Rotom en un único aparato.","Reiniciaba todos los relojes juntos y convertía una falla local en caos general.",["Rotom salta de esfera porque una sola carcasa se calienta.","Puedo aislar un reloj sin apagar la ciudad.","El botón rojo debe corregir, no castigar el retraso."],["Cada esfera tiene un circuito independiente.","Rotom elige dónde ayudar y deja registro del cambio.","La plaza recuperó un mediodía que dura lo necesario."])
    ],
    decision:["¿Cómo se corregirá una diferencia futura?",["Campana con confirmación vecinal","Panel público de calibración"],["Ada convoca dos lecturas antes de mover las agujas.","Romo muestra fuente, cambio y opción de deshacer."],["Los turnos conservarán un margen humano.","Ninguna nube volverá a reescribir toda la jornada."]],
    reward:["DAMPROCK","Convierte el clima en información útil sin permitirle gobernar el reloj."]
  },
  {
    mapId:1133, title:"El Camarote de las Maletas Huérfanas",
    promise:"En un barco orbital, las maletas sin etiqueta son asignadas al pasajero más cercano y una Lapras mensajera empieza a devolverlas al muelle.",
    objective:"Clasificar equipaje por contenido autorizado, trayecto y punto de reclamo sin abrir recuerdos privados.",
    mechanic:["Mesa de equipaje",["Leer ruta y material exterior antes de abrir.","Separar medicina urgente de objeto personal.","Crear un reclamo que no exija describir el contenido en público."],"El desembarco queda disponible durante toda la clasificación."],
    npcs:[
      N("Iria Bodega","trchar009","sobrecargo de equipaje","LAPRAS","Quiere reunir cada maleta con su viaje verdadero.","Usó proximidad como prueba de propiedad y acumuló entregas equivocadas.",["Esta valija comparte pasillo, no necesariamente dueño.","Lapras reconoce el muelle por la sal pegada a la rueda.","Puedo preguntar por el trayecto sin pedir que narren su intimidad."],["La ficha muestra cubierta, escala y señal exterior.","Las medicinas viajan por un canal urgente y discreto.","Nadie debe abrir una carta para recuperar su abrigo."]),
      N("Paz Cubierta","NPC 04","enlace del muelle","PELIPPER","Busca coordinar reclamos entre barco y costa.","Sus formularios obligaban a enumerar cada objeto ante toda la fila.",["Pelipper trae números de recibo, no listas de pertenencias.","Una marca lateral basta si ambas estaciones la conocen.","Voy a mover el reclamo detrás del biombo."],["El muelle acepta una clave de trayecto y una descripción exterior.","Los paquetes urgentes llegan sin anunciar su contenido.","La fila dejó de escuchar historias ajenas."])
    ],
    decision:["¿Dónde quedará el registro de equipaje?",["Cadena barco–muelle cifrada","Fichas separadas por escala"],["Iria conserva solo identificadores de tránsito.","Paz divide el recorrido para limitar quién consulta cada tramo."],["Los siguientes barcos podrán devolver sin exponer.","Una pérdida local no abrirá todo el historial del viaje."]],
    reward:["HEATROCK","Mantiene a salvo lo necesario durante el viaje sin revelar qué guarda cada maleta."]
  },
  {
    mapId:1140, title:"El Simulacro que Zarpó sin Aviso",
    promise:"Una alarma de evacuación mueve los botes durante un ensayo y deja a quienes estaban aprendiendo a bordo de una cubierta equivocada.",
    objective:"Reconstruir la secuencia de alarma y diseñar un simulacro reconocible antes, durante y después.",
    mechanic:["Ensayo de cubierta",["Identificar tono de práctica y tono real.","Contar personas antes de mover un bote.","Cerrar el ejercicio con una señal inequívoca."],"Un bote permanece amarrado como salida segura en todo momento."],
    npcs:[
      N("Berta Sirena","trchar008","oficial de seguridad","MAGNEZONE","Quiere que cada viajero pueda reconocer una emergencia real.","Probó una alarma idéntica a la real y Magnezone liberó los seguros previstos.",["La alarma funcionó exactamente como la programé; ese es el problema.","Magnezone no distingue ensayo si yo escondo la diferencia.","Un simulacro sorpresa no debe convertirse en una emergencia."],["El tono de práctica comienza con anuncio y luz azul.","Los seguros permanecen manuales hasta completar el conteo.","La señal final devuelve cada cubierta a su estado normal."]),
      N("Daro Lastre","NPC 04","técnico de botes","DRIFBLIM","Necesita probar flotación sin transportar personas involuntariamente.","Celebraba movimientos rápidos y omitía confirmar quién seguía a bordo.",["Drifblim puede elevar un bote vacío para revisar el cable.","Mi cronómetro no cuenta a quien quedó detrás.","Primero lista, luego seguro, al final velocidad."],["La prueba de cable se realiza sin pasajeros.","Cada bote exhibe su lista antes de soltar amarras.","El mejor tiempo ahora incluye volver y confirmar."])
    ],
    decision:["¿Cómo se anunciarán los próximos simulacros?",["Calendario y roles visibles","Ensayo breve con consentimiento en cubierta"],["Berta publica horario, objetivo y señal de cierre.","Daro pregunta quién participa antes de tocar un seguro."],["La tripulación podrá practicar sin fabricar pánico.","Los viajeros conservarán una salida ajena al ejercicio."]],
    reward:["SMOOTHROCK","Aporta estabilidad a una práctica que antes se movía demasiado pronto."]
  },
  {
    mapId:1151, title:"El Club de los Abrigos Invencibles",
    promise:"Un club boreal presta abrigos con rangos de resistencia exagerados y sus socios ocultan que siguen teniendo frío para no perder puntos.",
    objective:"Probar tres capas en condiciones distintas y reemplazar el rango único por indicaciones concretas.",
    mechanic:["Prueba de capas",["Medir viento y humedad por separado.","Permitir cambiar de abrigo sin penalización.","Registrar comodidad además de temperatura."],"La sala calefaccionada permanece abierta entre pruebas."],
    npcs:[
      N("Lena Dobladillo","trchar009","modista térmica","FROSLASS","Quiere confeccionar capas ajustables para cuerpos y climas distintos.","Bordó rangos de prestigio que hicieron difícil admitir incomodidad.",["El hilo azul indica viento, no valentía.","Froslass no necesita este forro; una persona quizá sí.","Un abrigo puede fallar sin que falle quien lo lleva."],["Las etiquetas hablan de humedad, viento y movilidad.","Cambiar una capa ya no resta puntos del club.","Dejé bolsillos para calentadores y decisiones tardías."]),
      N("Talo Entrega","NPC 04","encargado de préstamo","DELIBIRD","Busca repartir equipo antes de cada salida sin convertirlo en premio.","Guardaba las mejores prendas para socios con más insignias.",["Delibird entrega primero a quien sale primero, no a quien presume más.","Tengo tallas útiles guardadas detrás de una vitrina absurda.","El frío no consulta el historial del club."],["El préstamo sigue ruta, duración y talla solicitada.","Las prendas de exhibición volvieron al perchero de uso.","Una devolución mojada recibe secado, no reproche."])
    ],
    decision:["¿Cómo organizará el club su equipo térmico?",["Biblioteca de capas combinables","Kits por clima con cambios libres"],["Lena separa piezas y publica compatibilidades.","Talo prepara kits revisables antes de partir."],["Otros refugios podrán compartir patrones abiertos.","Nadie tendrá que soportar frío para conservar rango."]],
    reward:["ICYROCK","Representa preparación para el frío, no una prueba de dureza."]
  },
  {
    mapId:1158, title:"La Sala de Espera de las Mantas Azules",
    promise:"Un Centro Pokémon asigna mantas según la gravedad visible y deja sin abrigo a pacientes cuyo cansancio no se nota.",
    objective:"Reordenar la entrega de mantas usando solicitud, temperatura y disponibilidad en vez de apariencia.",
    mechanic:["Ronda de confort",["Preguntar antes de interpretar una postura.","Reservar mantas clínicas sin bloquear las de descanso.","Revisar necesidades después de cada curación."],"La máquina de curación y la salida funcionan con normalidad."],
    npcs:[
      N("Mina Turno","trchar008","auxiliar del Centro","AUDINO","Quiere atender malestar invisible sin retrasar urgencias.","Usaba una escala visual demasiado rápida para repartir recursos.",["Audino oye una respiración corta que mi ficha no muestra.","Pedir una manta no compite con pedir una cura.","Voy a separar necesidad clínica y comodidad disponible."],["La recepción pregunta temperatura y preferencia.","Las mantas clínicas tienen reserva, las demás no exigen diagnóstico.","Revisamos el confort después de cada tratamiento."]),
      N("Siro Nube","NPC 04","lavandero nocturno","ALTARIA","Necesita rotar mantas limpias sin reducirlas a un color de prioridad.","El tinte azul terminó funcionando como una etiqueta pública de gravedad.",["Altaria seca dos tandas si no mezclo tamaños imposibles.","El color debería indicar lavado, no lo que alguien padece.","Puedo coser códigos por dentro de la tela."],["Los códigos de limpieza quedaron ocultos en el dobladillo.","La estantería muestra tamaño y calor, no diagnóstico.","La rotación nocturna mantiene un lote siempre disponible."])
    ],
    decision:["¿Cómo se ofrecerán las mantas?",["Estantería de acceso guiado","Entrega durante la ronda de curación"],["Mina deja opciones visibles y ayuda a quien lo pida.","Siro prepara carros con varios tamaños y niveles de abrigo."],["Otros centros distinguirán cuidado y clasificación médica.","La comodidad podrá solicitarse sin explicar una historia privada."]],
    reward:["TERRAINEXTENDER","Amplía un espacio de cuidado sin convertirlo en una frontera rígida."]
  },
  {
    mapId:1165, title:"La Campana que Recordaba Demasiado",
    promise:"En una torre memorial, una campana repite todos los nombres grabados cada noche, incluso aquellos que sus familias pidieron guardar en silencio.",
    objective:"Separar homenaje público, recuerdo familiar y señal de orientación para los Pokémon de la torre.",
    mechanic:["Afinación memorial",["Escuchar qué ecos atraen a Chandelure.","Marcar inscripciones con permiso vigente.","Conservar una campanada de orientación sin recitar nombres."],"La escalera y el punto de descanso permanecen accesibles."],
    npcs:[
      N("Ema Bronce","trchar009","guardiana de campanas","CHANDELURE","Quiere mantener un ritual común sin apropiarse de cada recuerdo.","Programó la campana para leer todo el archivo como si visibilidad significara homenaje.",["Chandelure sigue el tono, no necesita escuchar cada nombre.","Una inscripción puede existir sin convertirse en anuncio.","Esta campana debe reunir, no reclamar."],["La campanada común ya no recita el archivo.","Cada familia elige si su placa participa del ritual público.","El tono bajo sigue guiando a quienes cruzan la torre."]),
      N("Nico Umbral","NPC 04","archivero de despedidas","DUSKNOIR","Busca preservar cartas sin decidir por sus autores cuándo leerlas.","Clasificó silencio como documento incompleto y abrió sobres reservados.",["Dusknoir carga cajas cerradas sin preguntar qué contienen.","Un sobre sellado también comunica una decisión.","Mi índice debe registrar permiso, no curiosidad."],["El archivo distingue público, familiar y cerrado.","Las cartas reservadas conservan solo fecha de custodia.","Ningún silencio vuelve a figurar como error."])
    ],
    decision:["¿Qué forma tendrá el rito nocturno?",["Campanada común sin nombres","Lecturas voluntarias en salas separadas"],["Ema afina un tono que orienta y reúne.","Nico prepara espacios donde cada familia controla su lectura."],["La torre conservará memoria sin exposición automática.","Los futuros homenajes incluirán permiso revisable."]],
    reward:["ROOMSERVICE","Simboliza cuidado discreto que llega sin convertir una habitación en escenario."]
  },
  {
    mapId:1176, title:"El Piso de las Semillas sin Precio",
    promise:"Una tienda etiqueta semillas comunitarias con valores de rareza y las variedades útiles dejan de circular porque nadie quiere abrir el paquete más caro.",
    objective:"Reclasificar semillas por clima, cuidado y fecha de siembra antes de la próxima feria.",
    mechanic:["Mesa de germinación",["Separar rareza comercial de adaptación local.","Abrir una muestra con consentimiento del donante.","Registrar cómo devolver semillas después de la cosecha."],"El ascensor y la salida de la planta permanecen libres."],
    npcs:[
      N("Rina Brote","trchar008","encargada de semillas","LILLIGANT","Quiere que cada variedad llegue al jardín donde puede prosperar.","Aceptó etiquetas de lujo que transformaron intercambio en exhibición.",["Lilligant prefiere esta semilla común porque conoce nuestra lluvia.","El precio dice escasez en tienda, no utilidad en tierra.","Voy a poner calendario donde antes había estrellas doradas."],["Cada sobre indica estación, agua y espacio necesario.","La rareza quedó como dato opcional, no jerarquía.","La devolución de semillas tiene una bandeja propia."]),
      N("Ona Guirnalda","NPC 04","cuidadora de jardines","COMFEY","Busca compartir esquejes sin perder el rastro de cuidados importantes.","Entregaba plantas como adornos y omitía advertir qué flores requerían sombra.",["Comfey trenza una flor; no promete que viva en cualquier ventana.","Una tarjeta bonita no reemplaza saber cuánta luz recibe.","Puedo contar el cuidado sin convertirlo en secreto de experto."],["Los esquejes viajan con una ficha de cuidados corregible.","La mesa separa adorno temporal y planta para cultivar.","Quien devuelve una observación mejora el registro común."])
    ],
    decision:["¿Cómo circularán las semillas del piso?",["Biblioteca con devolución de cosecha","Feria estacional de cuidados"],["Rina abre sobres y registra préstamos por variedad.","Ona organiza mesas según sol, sombra y agua."],["Los jardines compartirán adaptación real.","La tienda dejará de fabricar tesoros que nadie siembra."]],
    reward:["UTILITYUMBRELLA","Protege una planta del clima equivocado sin ocultar qué condiciones necesita."]
  },
  {
    mapId:1183, title:"El Ring de la Campana Honesta",
    promise:"Un torneo de exhibición usa una campana casi inaudible y los luchadores continúan después de pedir pausa porque el público cree que es parte del espectáculo.",
    objective:"Probar señales visuales, sonoras y gestuales que detengan el combate desde cualquier esquina.",
    mechanic:["Ensayo de detención",["Comprobar la campana con ruido de público.","Asignar una señal manual a cada esquina.","Reanudar solo después de confirmar a ambos equipos."],"La práctica no incluye golpes y puede abandonarse en cualquier momento."],
    npcs:[
      N("Tessa Campana","trchar009","árbitra del torneo","HAWLUCHA","Quiere que una pausa sea más importante que la continuidad del show.","Confió en un único sonido que desaparecía bajo los aplausos.",["Hawlucha vio mi mano antes de oír la campana.","Si una señal falla con público, no funciona en el ring.","La pausa no necesita parecer dramática para ser válida."],["Cada esquina tiene luz, gesto y campana propia.","La reanudación exige dos confirmaciones visibles.","El público recibió una explicación antes de la exhibición."]),
      N("Bran Giro","NPC 04","entrenador de equilibrio","HITMONTOP","Busca enseñar caídas seguras sin premiar a quien ignora mareos.","Usaba terminar la secuencia como medida de disciplina.",["Hitmontop se detiene cuando pierde un punto de referencia.","Completar un giro mareado no demuestra control.","Voy a evaluar cómo se corta una rutina, no solo cómo empieza."],["Las prácticas incluyen una salida ensayada.","Informar mareo abre descanso y no reduce puntuación.","La técnica termina cuando ambos recuperan orientación."])
    ],
    decision:["¿Quién podrá detener una exhibición?",["Cualquier esquina con señal triple","Árbitra y participantes por igual"],["Tessa conecta luces y campanas independientes.","Bran incorpora gestos de pausa al entrenamiento."],["Otros torneos reconocerán una detención inequívoca.","El espectáculo no podrá convertir el silencio en consentimiento."]],
    reward:["HEAVYDUTYBOOTS","Permite entrar y salir del terreno sin quedar atrapado por el espectáculo."]
  },
  {
    mapId:1190, title:"La Azotea que Cultivaba Pronósticos",
    promise:"Un jardín doméstico cambia todas sus plantas según un pronóstico semanal y termina arrancando brotes que ya se habían adaptado al tejado.",
    objective:"Comparar predicción, humedad real y respuesta de tres bancales antes de reorganizar la azotea.",
    mechanic:["Diario de bancales",["Tocar la tierra antes de regar.","Anotar predicción y observación en columnas distintas.","Mover macetas antes que arrancar plantas adaptadas."],"La escalera interior y una franja de paso quedan despejadas."],
    npcs:[
      N("Fara Maceta","trchar008","hortelana de azotea","APPLETUN","Quiere que cada brote tenga tiempo para responder al lugar real.","Obedecía el pronóstico como orden y reiniciaba el jardín cada semana.",["Appletun encontró humedad bajo una tierra que parecía seca.","La nube dibujada no ha tocado este tejado todavía.","Puedo mover una maceta sin declarar perdida la temporada."],["El diario separa lo previsto de lo observado.","Los brotes adaptados conservaron su bancal.","Cada traslado incluye una semana de revisión."]),
      N("Galo Brisa","NPC 04","constructor de cortavientos","ELDEGOSS","Busca reducir ráfagas sin encerrar polinizadores.","Levantó paneles continuos que protegían hojas y bloqueaban rutas de vuelo.",["Eldegoss atraviesa huecos que mi primer muro no tenía.","Quitar todo el viento también quita visitas útiles.","Probaré paneles bajos con separaciones medibles."],["Los cortavientos dejan corredores para polinizadores.","Cada panel puede retirarse sin desmontar el jardín.","La azotea registra ráfagas en vez de temer cualquier brisa."])
    ],
    decision:["¿Qué guiará los cambios del jardín?",["Diario local de siete días","Bancales móviles con revisión"],["Fara espera observaciones suficientes antes de cambiar.","Galo instala soportes que permiten probar y revertir."],["Los hogares podrán comparar microclimas reales.","Una predicción dejará de borrar adaptaciones presentes."]],
    reward:["SAFETYGOGGLES","Ayuda a observar viento y polvo sin apartar la mirada del jardín real."]
  },
  {
    mapId:1201, title:"La Lluvia de los Siete Colores",
    promise:"En una llanura prismática, Castform cambia de clima al cruzar reflejos de vidrio abandonado y las señales confunden color con tormenta real.",
    objective:"Retirar tres reflejos falsos y construir una guía que combine color, viento y humedad.",
    mechanic:["Lectura prismática",["Observar el color desde dos ángulos.","Confirmar humedad antes de anunciar lluvia.","Marcar vidrio retirado para evitar otro reflejo."],"Los refugios y el camino de regreso permanecen señalizados."],
    npcs:[
      N("Ivo Espectro","trchar009","observador meteorológico","CASTFORM","Quiere distinguir un fenómeno local de un reflejo sin apagar la curiosidad.","Publicaba alertas al primer cambio de color de Castform.",["Castform responde al calor del vidrio, no a una nube invisible.","El violeta solo no prueba tormenta.","Necesito dos señales físicas antes de mover a toda la llanura."],["La guía combina humedad, viento y color observado.","Cada alerta cita qué señales la activaron.","Los reflejos retirados quedaron registrados como causa local."]),
      N("Cala Muda","NPC 04","recolectora de vidrio","KECLEON","Busca limpiar fragmentos sin borrar marcas útiles del terreno.","Retiraba todo brillo y también desaparecían balizas antiguas.",["Kecleon se esconde junto a vidrio nuevo, no junto a estas piedras pintadas.","Un reflejo cortante y una señal histórica no son lo mismo.","Puedo fotografiar la baliza antes de despejar el fragmento."],["Las balizas antiguas conservan su lugar y descripción.","El vidrio peligroso viaja en cajas opacas.","La llanura mantiene memoria sin fabricar clima."])
    ],
    decision:["¿Cómo se publicarán las alertas prismáticas?",["Dos señales antes de alertar","Mapa de causas locales conocidas"],["Ivo exige humedad o viento además del color.","Cala registra reflejos, balizas y zonas ya limpiadas."],["Los viajeros recibirán avisos menos espectaculares y más fiables.","Un nuevo color podrá investigarse sin cerrar toda la ruta."]],
    reward:["ROCKYHELMET","Recuerda que una superficie brillante puede proteger y también exigir distancia."]
  },
  {
    mapId:1208, title:"La Mansión de los Espejos de Salida",
    promise:"Los espejos de una mansión muestran antiguas rutas de evacuación y los visitantes siguen reflejos que terminan en puertas tapiadas.",
    objective:"Comparar el plano actual con tres reflejos y dejar visible qué salida existe, cuál fue histórica y cuál es ilusión.",
    mechanic:["Contraplano de espejos",["Comprobar la puerta antes de copiar la flecha.","Marcar reflejos históricos sin borrarlos.","Ensayar una salida real con luz baja."],"La entrada principal permanece abierta e iluminada."],
    npcs:[
      N("Selma Azogue","trchar008","restauradora de espejos","ESPEON","Quiere conservar capas históricas sin convertirlas en instrucciones actuales.","Pulió flechas antiguas hasta hacerlas más legibles que el plano vigente.",["Espeon ve una puerta donde el espejo todavía la recuerda.","Restaurar una marca no la vuelve verdadera hoy.","Puedo conservar la capa y cambiar su función."],["Los reflejos históricos llevan marco ámbar y fecha.","Las salidas vigentes usan luz continua fuera del espejo.","El plano explica qué muro cambió y por qué."]),
      N("Tomás Prisma","NPC 04","inspector de evacuación","STARMIE","Busca comprobar rutas en oscuridad y con orientación limitada.","Daba por válida una flecha si coincidía con el plano, sin caminarla.",["Starmie ilumina el pasillo; la puerta sigue sin abrir.","Una ruta se verifica con pasos, no con líneas idénticas.","Haré el recorrido desde el suelo, no desde mi escritorio."],["Cada salida fue recorrida y cronometrada sin público.","Las puertas cerradas llevan una señal no reflectante.","El ensayo incluye volver a la entrada si una ruta falla."])
    ],
    decision:["¿Cómo convivirán plano actual y memoria?",["Marcos fechados para rutas históricas","Galería separada de reflejos antiguos"],["Selma conserva cada capa con contexto visible.","Tomás traslada los espejos ambiguos fuera del circuito de salida."],["La mansión podrá enseñar sus cambios sin confundir una emergencia.","Ningún reflejo volverá a sustituir una puerta comprobada."]],
    reward:["REDCARD","Señala con claridad cuándo una ruta debe detenerse y reconsiderarse."]
  },
  {
    mapId:1215, title:"La Meseta de los Aplausos Diferidos",
    promise:"En la entrada de la Liga, una grabación reproduce aplausos antes de cada resultado y convierte toda derrota en una escena que nadie eligió.",
    objective:"Reordenar las señales del vestíbulo para que anuncio, resultado y celebración no se adelanten entre sí.",
    mechanic:["Secuencia de ceremonia",["Esperar confirmación oficial antes del audio.","Ofrecer una salida silenciosa a ambos equipos.","Separar reconocimiento de resultado competitivo."],"El corredor hacia Puerto Horizonte nunca forma parte de la ceremonia."],
    npcs:[
      N("Dalia Fanfarria","trchar009","directora de ceremonias","AEGISLASH","Quiere celebrar esfuerzo sin escribir el resultado por adelantado.","Automatizó aplausos para evitar silencios y terminó imponiendo una emoción.",["Aegislash baja el estandarte cuando la sala aún no sabe qué ocurrió.","El silencio puede ser cuidado, no un error técnico.","La música debe esperar a quienes acaban de combatir."],["El audio se activa solo después de una confirmación humana.","Cada equipo puede elegir corredor silencioso.","El reconocimiento ya no nombra vencedor antes del acta."]),
      N("Ruy Galería","NPC 04","encargado de espectadores","BRAVIARY","Busca ordenar salidas sin convertir la tribuna en jurado permanente.","Abría primero el corredor más ruidoso porque parecía el más entusiasta.",["Braviary ve dos pasillos libres; yo siempre elegía el de las banderas.","Una multitud no debería decidir por dónde descansa alguien.","Puedo abrir ambos corredores y anunciar sus condiciones."],["La galería muestra ruta tranquila y ruta pública.","Los espectadores esperan la señal oficial antes de levantarse.","Ningún equipo cruza una celebración ajena por obligación."])
    ],
    decision:["¿Cómo terminará cada encuentro?",["Resultado, pausa y celebración opcional","Dos salidas con niveles de exposición"],["Dalia incorpora un intervalo sin música.","Ruy abre corredores equivalentes y claramente descritos."],["La Liga podrá reconocer sin imponer espectáculo.","Los resultados conservarán precisión y una salida digna."]],
    reward:["SHEDSHELL","Representa el derecho a abandonar una escena sin quedar atrapado en su papel."]
  },
  {
    mapId:1226, title:"El Dirigible que Cargaba Sombras",
    promise:"Un dirigible solar calcula su lastre por la sombra de cada pasajero y pierde equilibrio cuando el sol cambia de ángulo.",
    objective:"Comparar peso real, posición y sombra en tres momentos antes de autorizar el despegue.",
    mechanic:["Mesa de lastre solar",["Medir carga sin inferirla del tamaño de la sombra.","Registrar el ángulo del sol por separado.","Dejar un margen para movimiento durante el vuelo."],"La pasarela de desembarque permanece conectada hasta la autorización final."],
    npcs:[
      N("Sol Vareda","trchar008","navegante de altura","SOLROCK","Quiere usar el sol como referencia sin convertirlo en báscula.","Confundió una correlación de mediodía con una regla universal.",["Solrock marca el ángulo; no pesa la maleta.","Una sombra larga puede pertenecer a una carga ligera.","Necesito números que sigan aquí cuando cambie la tarde."],["La carta separa masa, posición y ángulo solar.","El cálculo incluye movimiento y reserva de combustible.","Las sombras volvieron a ser brújula, no juicio."]),
      N("Aro Quemador","NPC 04","técnico de envolvente","TALONFLAME","Busca aprovechar calor sin debilitar la tela del dirigible.","Aumentaba temperatura para compensar cálculos de lastre equivocados.",["Talonflame detectó una costura caliente antes que mi sensor.","Más calor no corrige una cifra inventada.","Voy a bajar la llama y revisar la distribución."],["Los quemadores responden a temperatura y altura reales.","Cada costura tiene un límite visible en la consola.","El dirigible despega estable sin forzar la envolvente."])
    ],
    decision:["¿Qué método autorizará el despegue?",["Pesaje y distribución manual","Sensores dobles con revisión humana"],["Sol dirige una mesa de carga comprobable.","Aro cruza masa, temperatura y posición antes de liberar amarras."],["Las rutas solares conservarán precisión al cambiar la luz.","Ningún pasajero volverá a ser estimado por su sombra."]],
    reward:["AIRBALLOON","Celebra un vuelo ligero sostenido por medidas reales y margen de seguridad."]
  },
  {
    mapId:1233, title:"El Faro que Pintaba el Sol",
    promise:"Un faro insular pinta franjas amarillas sobre las rocas para anunciar sol seguro, pero la marea borra unas antes que otras y crea rutas falsas.",
    objective:"Revisar tres marcas con marea alta y diseñar señales que no dependan de una pintura temporal.",
    mechanic:["Lectura de costa",["Comparar marca, altura y hora de marea.","Usar textura además de color.","Mantener visible la ruta de retirada."],"El embarcadero queda abierto durante toda la inspección."],
    npcs:[
      N("Helia Brocha","trchar009","pintora del faro","HELIOLISK","Quiere que sus marcas orienten sin prometer un mar inmóvil.","Usó el mismo amarillo para sol, roca seca y paso recomendado.",["Heliolisk toma sol donde la roca sigue mojada.","Mi amarillo dice tres cosas y ninguna con suficiente precisión.","La próxima señal debe poder leerse después de perder color."],["Las marcas combinan relieve, símbolo y hora de referencia.","El amarillo quedó reservado para orientación, no seguridad absoluta.","Cada ruta muestra hasta qué marea es transitable."]),
      N("Tano Caldera","NPC 04","cuidador del faro","TORKOAL","Busca mantener la lente seca sin calentar nidos de la cornisa.","Dirigía vapor hacia afuera y cambiaba la temperatura de las rocas cercanas.",["Torkoal seca la lente; el conducto calienta más allá de la ventana.","Los huevos no aparecen en mi plano de mantenimiento.","Puedo girar la salida y conservar el faro limpio."],["El vapor sale hacia una chimenea interior.","La cornisa tiene una franja térmica protegida.","La lente funciona sin convertir el nido en radiador."])
    ],
    decision:["¿Cómo se marcarán los pasos costeros?",["Relieves con tabla de mareas","Balizas móviles revisadas cada día"],["Helia talla símbolos que sobreviven a la pintura.","Tano coloca balizas fuera de nidos y registra cada traslado."],["Los visitantes distinguirán orientación y garantía.","El faro podrá adaptarse sin dejar rastros engañosos."]],
    reward:["ABSORBBULB","Convierte el contacto con el agua en una señal útil, no en una promesa de suelo seco."]
  },
  {
    mapId:1240, title:"La Sombra que Llegaba Primero",
    promise:"En una reserva solar, los refugios móviles persiguen automáticamente a quien proyecta la sombra más corta y dejan atrás a Pokémon lentos.",
    objective:"Observar tres desplazamientos y programar refugios que prioricen temperatura y acceso, no velocidad aparente.",
    mechanic:["Ronda de sombra",["Medir suelo y cuerpo antes de mover el techo.","Reservar espacio para especies de paso lento.","Anunciar cada traslado con una ruta alternativa."],"Un refugio fijo permanece junto al retorno."],
    npcs:[
      N("Mara Alero","trchar008","guardabosques solar","MARACTUS","Quiere repartir sombra donde reduce daño real.","Programó los techos con siluetas rápidas y confundió movimiento con urgencia.",["Maractus soporta este sol; ese Sandshrew no debería demostrar nada.","La sombra corta solo dice dónde está el sol.","Moveré el techo cuando suba la temperatura, no cuando alguien corra."],["Los sensores leen suelo, aire y solicitud manual.","Cada refugio reserva un borde de acceso lento.","El traslado se anuncia antes de cerrar la sombra anterior."]),
      N("Felo Corriente","NPC 04","guía de dunas","FLYGON","Busca usar corrientes frescas sin levantar arena sobre los bebederos.","Abría corredores de viento que ayudaban a viajeros y cubrían fuentes pequeñas.",["Flygon encuentra aire fresco dos metros más arriba.","Mi corredor funciona para mí y llena de arena el bebedero.","Puedo desviar la corriente con paneles bajos."],["Los paneles protegen agua y dejan pasar aire alto.","La ruta fresca incluye pausas bajo refugio fijo.","Cada ráfaga se prueba antes de abrir el sendero."])
    ],
    decision:["¿Cómo decidirán los refugios cuándo moverse?",["Temperatura y solicitud manual","Circuito fijo con reservas lentas"],["Mara combina sensores con un control accesible.","Felo diseña horarios que nunca dejan toda la ruta sin sombra."],["La reserva cuidará necesidad, no apariencia de resistencia.","Los movimientos futuros conservarán un refugio estable."]],
    reward:["CELLBATTERY","Guarda energía para mover protección cuando haga falta, no cuando una silueta lo ordene."]
  },
  {
    mapId:1251, title:"La Casa del Calendario Mojado",
    promise:"Una casa costera adelanta cada tarea cuando la luna llena aparece en el calendario, aunque la marea real llegue horas después.",
    objective:"Comparar calendario, marca del muelle y humedad del sótano para separar previsión y momento de actuar.",
    mechanic:["Reloj de mareas",["Leer la tabla como intervalo, no como campana exacta.","Confirmar agua en la marca exterior.","Mantener pertenencias elevadas sin evacuar antes de tiempo."],"La puerta alta hacia el retorno permanece despejada."],
    npcs:[
      N("Luna Estela","trchar009","lectora de mareas","LUNATONE","Quiere anticipar el agua sin convertir la luna en una orden doméstica.","Anunciaba una hora exacta y hacía repetir falsas alarmas.",["Lunatone señala un ciclo, no el minuto de la primera gota.","La tabla ofrece una ventana; yo la convertí en campana.","Podemos prepararnos sin abandonar la casa demasiado pronto."],["El calendario muestra intervalo y nivel esperado.","La marca del muelle confirma cuándo actuar.","Cada alerta explica qué observación falta."]),
      N("Nora Viga","NPC 04","carpintera de litoral","NOCTOWL","Busca elevar objetos vulnerables sin bloquear ventanas y salidas.","Construyó estantes permanentes que hicieron segura la marea y difícil la vida diaria.",["Noctowl cabe bajo la viga; una persona cargando cajas no.","Proteger del agua no debería cerrar la ventana.","Haré soportes plegables y dejaré libre el pasillo."],["Los estantes bajan cuando termina la ventana de marea.","La salida alta conserva ancho para transportar equipo.","Cada soporte muestra su carga máxima."])
    ],
    decision:["¿Cómo activará la casa su preparación?",["Ventana prevista más marca real","Preparación gradual por niveles"],["Luna combina calendario y lectura del muelle.","Nora eleva primero lo vulnerable y conserva el uso cotidiano."],["Otras casas podrán prepararse sin vivir en alarma.","La luna volverá a orientar sin dictar una hora falsa."]],
    reward:["LUMINOUSMOSS","Conserva una señal suave de humedad sin convertirla en alarma absoluta."]
  },
  {
    mapId:1258, title:"El Jardín que Encendía la Noche",
    promise:"Un jardín lunar ilumina todas sus flores para atraer visitantes y desorienta a los polinizadores que solo trabajan en oscuridad.",
    objective:"Identificar tres rutas de polinización y repartir luz, penumbra y oscuridad sin cerrar el paseo.",
    mechanic:["Mapa de vuelo nocturno",["Observar antes de encender una lámpara.","Distinguir ruta de visitantes y ruta de polinizadores.","Reducir luz de forma gradual y reversible."],"El sendero principal conserva balizas bajas de regreso."],
    npcs:[
      N("Meli Penumbra","trchar008","botánica nocturna","MORELULL","Quiere que las flores mantengan ciclos propios y sigan siendo visitables.","Aceptó iluminación continua para la feria y perdió las rutas de esporas.",["Morelull brilla lo suficiente para encontrarse entre sí.","Una flor visible para nosotros puede quedar invisible para su polinizador.","Apagaré por franjas y observaré qué vuelve."],["El jardín alterna zonas oscuras durante toda la noche.","Las balizas humanas apuntan al suelo y no a las flores.","Cada cambio tiene registro de vuelo y floración."]),
      N("Vito Farol","NPC 04","técnico de iluminación","VOLBEAT","Busca guiar visitantes sin competir con señales naturales.","Sincronizó faroles con Volbeat y multiplicó destellos hasta borrar sus patrones.",["Volbeat repite tres luces; mis faroles responden con treinta.","Una guía útil no necesita imitar a quien vive aquí.","Puedo usar luz fija, baja y fuera de la copa."],["Los faroles dejaron de parpadear.","La ruta pública usa tonos que no imitan llamadas.","Volbeat recuperó una señal legible sobre el estanque."])
    ],
    decision:["¿Cómo funcionará el jardín durante la feria?",["Franjas oscuras permanentes","Visitas por turnos de luz baja"],["Meli protege corredores de polinización toda la noche.","Vito reduce aforo y enciende solo la ruta activa."],["El jardín podrá recibir personas sin perder su noche.","Las futuras ferias medirán también el regreso de polinizadores."]],
    reward:["SNOWBALL","Una esfera clara que invita a usar la luz con mesura y dirección."]
  },
  {
    mapId:1265, title:"El Estadio de la Segunda Luna",
    promise:"Los focos de un estadio proyectan una luna artificial que altera horarios de Pokémon nocturnos y hace comenzar combates antes de que ambos equipos estén listos.",
    objective:"Probar tres escenas de iluminación y fijar una señal de inicio independiente del cielo artificial.",
    mechanic:["Ensayo de focos",["Separar ambientación y orden de inicio.","Confirmar preparación de ambos equipos.","Apagar la luna artificial entre sesiones."],"Las puertas laterales permanecen abiertas fuera de cada prueba."],
    npcs:[
      N("Uma Reflector","trchar009","diseñadora de luces","UMBREON","Quiere crear una noche escénica que no invada el ritmo de los Pokémon.","Mantuvo la luna artificial encendida durante descansos y ensayos.",["Umbreon busca sombra cuando mi luna debería ser decoración.","El estadio no necesita fingir medianoche durante seis horas.","La escena empieza después del acuerdo, no con el interruptor."],["La luna artificial se apaga entre sesiones.","La orden de inicio usa paneles independientes.","Cada equipo puede pedir adaptación gradual de luz."]),
      N("Miro Palco","NPC 04","coordinador deportivo","MISMAGIUS","Busca entradas memorables sin convertir un efecto en regla.","Usaba la aparición de Mismagius como señal automática y adelantaba la apertura.",["Mismagius ensaya una entrada; no está llamando a combatir.","Un efecto teatral no debería tener autoridad deportiva.","Voy a esperar dos confirmaciones antes de abrir el campo."],["El palco recibe confirmación de ambas zonas técnicas.","Las entradas pueden repetirse sin iniciar marcador.","El público conoce la señal oficial y deja de adivinar."])
    ],
    decision:["¿Qué separará espectáculo e inicio?",["Panel doble de confirmación","Campana oficial sin efectos"],["Uma instala controles ajenos a los focos.","Miro reserva una señal sencilla para el reglamento."],["Otros estadios podrán usar ambientación sin confundir preparación.","Los Pokémon nocturnos recuperarán pausas oscuras reales."]],
    reward:["ZOOMLENS","Ayuda a enfocar la señal correcta entre muchos efectos brillantes."]
  },
  {
    mapId:1276, title:"La Sala de los Sueños en Fila",
    promise:"Un Centro Pokémon ordena el descanso según sueños contados al despertar y quienes no recuerdan ninguno pierden su turno de cama.",
    objective:"Rediseñar la lista de descanso usando llegada, necesidad y preferencia sin exigir relatos privados.",
    mechanic:["Turno de reposo",["Registrar llegada sin interpretar sueños.","Reservar camas clínicas por necesidad observable.","Ofrecer espacios de descanso sin obligación de dormir."],"La curación y la salida permanecen disponibles para todos."],
    npcs:[
      N("Sena Almohada","trchar008","coordinadora de descanso","MUSHARNA","Quiere cuidar el sueño sin convertirlo en entrada al servicio.","Usaba las nubes de Musharna para decidir quién había descansado de verdad.",["Musharna ve imágenes; no mide cuánto pesa un párpado.","No recordar un sueño no borra el cansancio.","La cama debe responder a necesidad, no a una historia interesante."],["La lista usa llegada, solicitud y prioridad clínica separada.","Contar un sueño es opcional y no cambia el turno.","También hay sillones para quien prefiere no dormir."]),
      N("Polo Siesta","NPC 04","cuidador de sala","KOMALA","Busca mantener silencio sin imponer el mismo horario a todos.","Apagaba luces a una hora fija y dejaba desorientados a viajeros recién llegados.",["Komala descansa con luz tenue; otra persona puede necesitar verla.","Silencio y oscuridad no son la misma opción.","Pondré cortinas individuales en vez de apagar la sala."],["Cada cama controla luz y cortina por separado.","La zona de paso conserva una guía visible.","Los avisos se entregan sin despertar toda la sala."])
    ],
    decision:["¿Cómo se organizará el descanso?",["Turnos visibles sin relatos","Zonas flexibles de sueño y vigilia"],["Sena publica criterios y protege privacidad.","Polo divide iluminación y ruido por espacios."],["Los centros podrán cuidar cansancio sin clasificar sueños.","Una noche difícil no tendrá que convertirse en explicación pública."]],
    reward:["SCOPELENS","Invita a observar la necesidad concreta sin invadir el contenido de un sueño."]
  },
  {
    mapId:1283, title:"La Isla de las Cartas sin Destino",
    promise:"Dragonite transporta cartas cuyo destino dice solo «donde haga falta» y termina acumulándolas porque nadie se atreve a decidir por sus autores.",
    objective:"Clasificar mensajes por alcance, urgencia y permiso de reenvío sin inventar un destinatario.",
    mechanic:["Mesa de correspondencia",["Distinguir mensaje abierto y carta personal.","Confirmar si existe permiso de reenvío.","Crear un archivo local para lo que no debe viajar."],"El muelle de regreso queda fuera de la ruta postal."],
    npcs:[
      N("Dina Franqueo","trchar009","encargada postal","DRAGONITE","Quiere que cada mensaje llegue sin adjudicarle un dueño ficticio.","Interpretaba frases vagas como autorización universal para reenviar.",["Dragonite puede cruzar el mar; eso no decide quién debe abrir el sobre.","Donde haga falta puede significar aquí, en un tablón público.","Necesito separar alcance y deseo de viajar."],["Las cartas personales exigen destino confirmado.","Los mensajes abiertos tienen tablón y fecha de retiro.","Lo no enviado conserva una nota clara, no una derrota."]),
      N("Salo Corriente","NPC 04","vigía de rutas aéreas","SALAMENCE","Busca evitar vuelos innecesarios durante tormentas.","Priorizaba cualquier sobre marcado urgente aunque la palabra viniera de una plantilla.",["Salamence olió lluvia antes de que yo leyera el sello rojo.","Urgente impreso no explica qué ocurre si espera.","Pediré plazo y consecuencia, no dramatismo."],["Cada envío declara plazo real y alternativa local.","Las tormentas suspenden rutas sin perder el turno postal.","El sello rojo requiere una revisión humana."])
    ],
    decision:["¿Qué ocurrirá con las cartas sin destino?",["Archivo local con revisión periódica","Tablón abierto solo con permiso"],["Dina conserva sobres cerrados y consulta a remitentes cuando sea posible.","Salo publica únicamente mensajes declarados abiertos."],["La isla respetará tanto el viaje como la decisión de no enviarlo.","Las rutas aéreas llevarán menos urgencias fabricadas."]],
    reward:["RAZORCLAW","Simboliza precisión al abrir una ruta, nunca un sobre sin permiso."]
  },
  {
    mapId:1290, title:"La Casa que Despertaba por Turnos",
    promise:"Un hogar conectado despierta una habitación cada vez que Hypno detecta movimiento y termina repartiendo el insomnio por toda la casa.",
    objective:"Separar señales de seguridad, rutinas personales y movimientos normales antes de reprogramar las alarmas.",
    mechanic:["Ronda de despertar",["Identificar qué movimiento requiere aviso.","Probar alarmas dentro de una sola habitación.","Mantener un control manual junto a cada cama."],"La puerta de salida no depende del sistema doméstico."],
    npcs:[
      N("Elo Ronda","trchar008","cuidador nocturno","HYPNO","Quiere detectar riesgos sin convertir cada paso en alarma.","Conectó los pulsos de Hypno a todas las luces de la casa.",["Hypno nota que alguien gira en la cama; no significa que necesite ayuda.","Una señal útil debe llegar a la habitación correcta.","Voy a dejar de despertar a todos para demostrar que vigilo."],["Las alertas se limitan por habitación y tipo de riesgo.","Cada persona controla luz y sonido junto a su cama.","El registro guarda incidentes, no movimientos cotidianos."]),
      N("Lía Felpa","NPC 04","diseñadora de rutinas","DELCATTY","Busca crear avisos suaves para quien sí los solicita.","Usaba la misma melodía para levantarse, medicina y emergencia.",["Delcatty ignora la canción porque ya no significa nada preciso.","Tres avisos distintos merecen tres sonidos distintos.","También necesito una forma clara de posponer sin cancelar."],["Las melodías distinguen rutina, cuidado y emergencia.","Posponer una alarma no desactiva las demás.","Cada horario se revisa con quien duerme en la habitación."])
    ],
    decision:["¿Cómo se repartirán las alertas nocturnas?",["Circuitos privados por habitación","Avisos graduados por tipo de riesgo"],["Elo instala límites físicos y controles locales.","Lía asigna sonidos y niveles acordados."],["La casa podrá cuidar sin sincronizar el insomnio.","Los sistemas futuros tratarán movimiento y peligro como datos distintos."]],
    reward:["QUICKCLAW","Permite responder con rapidez cuando corresponde, no ante cada movimiento nocturno."]
  },
  {
    mapId:1301, title:"La Cocina que Atraía los Cubiertos",
    promise:"Una casa del valle magnético concentra los cubiertos sobre una pared y culpa a Magnemite, aunque el verdadero origen es una batería instalada bajo la mesa.",
    objective:"Rastrear tres campos magnéticos y reorganizar la cocina sin expulsar a los Pokémon que viven en el tejado.",
    mechanic:["Rastreo de polaridad",["Probar un objeto a la vez.","Apagar cada circuito antes de culpar a una fuente externa.","Mantener una ruta sin metal hacia la salida."],"La puerta y el interruptor general quedan siempre accesibles."],
    npcs:[
      N("Mina Polo","trchar009","electricista doméstica","MAGNEMITE","Quiere localizar la fuente real antes de mover a la colonia del tejado.","Asumió que el Pokémon más visible causaba cualquier anomalía magnética.",["Magnemite duerme arriba; el tenedor apunta hacia abajo.","La dirección del tirón ya contradice mi primera historia.","Apagaré circuitos antes de buscar un culpable cómodo."],["La batería bajo la mesa tiene blindaje y corte independiente.","La colonia conserva su nido lejos del cableado.","El plano muestra intensidad y dirección de cada campo."]),
      N("Boro Nivel","NPC 04","constructor de mobiliario","PROBOPASS","Busca fijar armarios sin convertir la cocina en una jaula metálica.","Añadió placas de acero para resistir el tirón y amplificó el problema.",["Probopass señala la pared porque mis placas repiten el campo.","Más metal no siempre significa más estabilidad.","Puedo usar madera, distancia y anclajes pequeños."],["Los armarios usan refuerzos no magnéticos.","Los utensilios tienen un cajón fuera del campo residual.","La ruta de salida quedó libre de objetos atraídos."])
    ],
    decision:["¿Cómo se aislará la cocina?",["Blindaje localizado en la batería","Redistribución con materiales no magnéticos"],["Mina encierra la fuente y conserva acceso al corte.","Boro reemplaza placas y separa almacenamiento."],["Las casas del valle rastrearán dirección antes de culpar a un Pokémon.","Las reparaciones futuras podrán revertirse sin rehacer la vivienda."]],
    reward:["LAGGINGTAIL","Recuerda desacelerar el diagnóstico antes de seguir la primera atracción."]
  },
  {
    mapId:1308, title:"El Almacén de las Garantías Eléctricas",
    promise:"Una tienda rechaza aparatos devueltos si el comprador no puede reproducir la chispa frente al mostrador, aunque la falla solo aparece durante tormentas magnéticas.",
    objective:"Diseñar una prueba segura que acepte fallas intermitentes y conserve evidencia sin provocar otra descarga.",
    mechanic:["Banco de diagnóstico",["Registrar condiciones sin recrear peligro.","Separar daño visible y falla intermitente.","Ofrecer reemplazo temporal durante la revisión."],"El ascensor y el corte general permanecen fuera del banco de prueba."],
    npcs:[
      N("Tera Bobina","trchar008","técnica de garantías","ELECTIVIRE","Quiere comprobar fallas sin exigir una descarga como espectáculo.","Aplicaba una prueba de mostrador diseñada para averías constantes.",["Electivire detecta residuo; no necesitamos fabricar otra chispa.","Que hoy funcione no borra lo ocurrido durante la tormenta.","La garantía debe investigar condiciones, no desconfiar por defecto."],["El banco registra residuo, relato técnico y fecha magnética.","Las pruebas peligrosas se simulan con carga limitada.","Cada revisión entrega un aparato temporal compatible."]),
      N("Gus Etiqueta","NPC 04","encargado de inventario","TOGEDEMARU","Busca rastrear lotes defectuosos sin publicar datos de compradores.","Pegaba nombres personales en cada aparato para seguir devoluciones.",["Togedemaru reconoce el lote por tornillo y serie, no por apellido.","Puedo encontrar un patrón sin convertir clientes en etiquetas.","La ficha necesita modelo, fecha y síntoma; nada más."],["Las devoluciones usan códigos de lote anónimos.","El tablero muestra patrones técnicos sin nombres.","Un lote sospechoso puede retirarse antes de otra falla."])
    ],
    decision:["¿Qué bastará para aceptar una falla intermitente?",["Evidencia técnica y condiciones registradas","Patrón de lote más relato del síntoma"],["Tera abre diagnóstico sin exigir repetición peligrosa.","Gus cruza series anónimas y retira lotes coincidentes."],["Las tiendas del valle reconocerán fallas que no actúan a pedido.","La seguridad pesará más que una demostración inmediata."]],
    reward:["RINGTARGET","Convierte un problema difícil de reproducir en un objetivo de revisión concreto."]
  }
];

if (specs.length !== 25) throw new Error(`Se esperaban 25 rutas y hay ${specs.length}.`);
const blueprints = specs.map((spec, index) => {
  const flag = 758 + index;
  const variable = 154 + index;
  const [mechanicName, rules, failureSafe] = spec.mechanic;
  const [question, options, immediate, later] = spec.decision;
  const [item, meaning] = spec.reward;
  return {
    tier: 2,
    routeBatch: 3 + Math.floor(index / 5),
    mapId: spec.mapId,
    flag,
    variable,
    title: spec.title,
    promise: spec.promise,
    objective: spec.objective,
    mechanic: { name: mechanicName, rules, failureSafe },
    npcs: spec.npcs,
    decision: { question, options, immediate, later },
    reward: { item, meaning },
    progression: { switchId: flag, decisionVariable: variable, freeReturnMapId: 1001 },
    safety: { bagAlwaysAvailable: true, noForcedBattle: true, existingChallengePreserved: true, freeReturn: true, rewardOnce: true },
  };
});
const output = { version: 1, macroCycle: 3, tier2Batches: 5, blueprints };
const target = path.join(ROOT, "content", "atlas_tier2_blueprints_macro03.json");
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Tier 2 macrociclo 03: ${blueprints.length} rutas en ${output.tier2Batches} lotes.`);
