#!/usr/bin/env node
/** Dos lotes Tier 2 (diez rutas estables) para el macrociclo de trabajo 02. */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const N = (name, sprite, role, partnerPokemon, motivation, conflict, before, after) => ({
  name, sprite, role, partnerPokemon, motivation, conflict, dialogue: { before, after },
});
const rows = [
  {
    mapId: 1026, flag: 748, variable: 144,
    title: "El Semáforo de las Promesas Tardías",
    promise: "Un cruce cambia de prioridad cada vez que alguien promete volver pronto, hasta que dos trabajadores separan urgencia real de cortesía automática.",
    objective: "Revisar tres ciclos de faroles y abrir un cruce que no premie la promesa más insistente.",
    mechanic: { name: "Secuencia de faroles", rules: ["Observar quién espera y desde cuándo.", "Distinguir emergencia de prisa declarada.", "Elegir un criterio que pueda revisarse."], failureSafe: "Cualquier elección mantiene abierta la acera de retorno." },
    npcs: [
      N("Mara Ámbar", "trchar008", "técnica de señales", "AMPHAROS", "Quiere que la luz responda a necesidades observables.", "Programó prioridad para quien dijera vuelvo pronto y creó una fila permanente.", ["El farol no mide apuro; mide quién repite la frase correcta.", "Ampharos puede iluminar el cruce, no decidir quién importa más.", "Tres ciclos bastan para demostrar que la promesa no es un reloj."], ["La señal muestra tiempo de espera y permite revisión.", "Nadie necesita inventar una emergencia para cruzar.", "Dejé una fase libre para quien no puede usar el pulsador."]),
      N("Timo Giro", "trchar009", "mensajero vecinal", "DODRIO", "Necesita cumplir rutas sin convertir velocidad en privilegio.", "Usó la prioridad automática hasta descubrir que retrasaba ambulancias y peatones lentos.", ["Llegué primero porque Dodrio corre; eso no explica quién debe cruzar primero.", "Mis entregas dicen urgente incluso cuando llevan pan frío.", "Puedo esperar un ciclo si el criterio está escrito."], ["Mi hoja separa entrega crítica y horario cómodo.", "El cruce dejó de tratar mis ruedas como argumento.", "Ahora aviso una demora sin prometer lo imposible."])
    ],
    decision: { question: "¿Qué criterio gobernará el cruce?", options: ["Turnos visibles por espera", "Pulsador de necesidad revisable"], immediate: ["Mara publica el orden y reserva una fase accesible.", "Timo prueba un pulsador que declara necesidad sin exigir explicación pública."], later: ["Otros cruces mostrarán sus reglas.", "Las señales podrán revisarse sin registrar perfiles personales."] },
    reward: { item: "EJECTBUTTON", meaning: "Permite retirarse a tiempo; no obliga a ganar prioridad mediante una promesa." }
  },
  {
    mapId: 1033, flag: 749, variable: 145,
    title: "La Devolución que Conservó su Historia",
    promise: "Un almacén borra toda procedencia de los objetos devueltos para venderlos otra vez, aunque algunas etiquetas contienen despedidas y permisos que sus dueños no querían perder.",
    objective: "Clasificar recibos, etiquetas privadas y objetos reutilizables sin convertir la devolución en exposición.",
    mechanic: { name: "Mesa de procedencias", rules: ["Separar dato de venta y recuerdo personal.", "Marcar qué etiqueta puede retirarse.", "Conservar una ruta clara hacia el mostrador de salida."], failureSafe: "Las categorías pueden corregirse antes de cerrar el registro." },
    npcs: [
      N("Lía Recibo", "trchar008", "encargada de devoluciones", "KLEFKI", "Quiere que cada objeto encuentre uso sin perder derechos de origen.", "Destruía etiquetas para proteger privacidad y borró también permisos de reparación.", ["Este recibo prueba compra; esta nota no me autoriza a leerla.", "Klefki separó llaves de nombres antes de que llegáramos.", "Devolver no significa renunciar a toda historia."], ["La ficha conserva material, reparación y permiso vigente.", "Las notas privadas regresaron en sobres cerrados.", "El mostrador acepta corregir una categoría después de la entrega."]),
      N("Kade Estante", "NPC 04", "restaurador de segunda mano", "MUNCHLAX", "Busca reparar objetos con piezas recuperadas.", "Confundía señales de uso con defectos que debía ocultar.", ["La marca de una taza puede explicar cómo reforzarla sin decir quién la usó.", "Munchlax encontró una fiambrera y no la convierte en inventario hasta revisar la etiqueta.", "Un objeto usado no necesita parecer recién nacido."], ["Cada reparación deja visible qué pieza fue reemplazada.", "El estante comunitario no muestra nombres personales.", "Conservar una cicatriz puede ser parte de devolver bien."])
    ],
    decision: { question: "¿Cómo circularán las devoluciones reparadas?", options: ["Cadena de retorno documentada", "Archivo comunitario anónimo"], immediate: ["Lía registra procedencia técnica y devuelve recuerdos privados.", "Kade abre fichas anónimas de reparación y uso."], later: ["Los sectores podrán rastrear fallos sin rastrear personas.", "Las técnicas de reparación quedarán disponibles para otros talleres."] },
    reward: { item: "SOOTHEBELL", meaning: "Conserva el vínculo elegido sin transformar el recuerdo en una etiqueta de venta." }
  },
  {
    mapId: 1040, flag: 750, variable: 146,
    title: "Las Huellas que Caminaban al Revés",
    promise: "Un sendero interpreta huellas invertidas como una invasión, pero una rastreadora descubre que los Pokémon retroceden para evitar una zona de ruido que el mapa oficial no registra.",
    objective: "Comparar tres rastros y señalar una ruta migratoria sin perseguir a la manada.",
    mechanic: { name: "Lectura de rastros", rules: ["Comparar profundidad antes que dirección aparente.", "Escuchar el ruido fuera del sendero.", "Marcar refugio y no ubicación exacta de la manada."], failureSafe: "El jugador puede retirarse sin cerrar ninguna salida natural." },
    npcs: [
      N("Nara Rastro", "trchar008", "rastreadora de migraciones", "STANTLER", "Quiere proteger rutas estacionales sin publicar guaridas.", "Dibujó flechas demasiado precisas y atrajo curiosos hacia los nidos.", ["La pezuña apunta al norte; el peso quedó al sur.", "Stantler retrocede cuando el zumbido sube, no cuando ve intrusos.", "Una ruta segura puede ser deliberadamente imprecisa."], ["El mapa señala temporada y ruido, no coordenadas de descanso.", "Las flechas ahora distinguen observación e hipótesis.", "La manada volvió sin encontrar espectadores en el refugio."]),
      N("Oren Flecha", "trchar009", "mantenedor del sendero", "FURRET", "Necesita guiar viajeros sin convertir cada desvío en sospecha.", "Puso barreras siguiendo un mapa que nunca midió el ruido.", ["Cerré el camino donde las huellas giraban y las obligué a girar otra vez.", "Furret encontró metal vibrando bajo el cartel.", "Una barrera fácil de ver puede ocultar un problema más ruidoso."], ["Retiré la placa suelta y dejé un desvío silencioso.", "El cartel explica por qué una ruta cambia por temporada.", "Nadie llama invasión a una maniobra de cuidado."])
    ],
    decision: { question: "¿Cómo se marcará la migración?", options: ["Corredor estacional amplio", "Circuito silencioso señalizado"], immediate: ["Nara dibuja una franja sin revelar nidos.", "Oren retira metal vibrante y marca límites de ruido."], later: ["Los mapas futuros protegerán incertidumbre ecológica.", "Los senderos incluirán impacto acústico además de distancia."] },
    reward: { item: "WIDELENS", meaning: "Premia observar mejor sin convertir precisión en derecho a localizarlo todo." }
  },
  {
    mapId: 1051, flag: 751, variable: 147,
    title: "El Puente que Esperaba Dos Pesos",
    promise: "Un puente móvil solo se abre con dos cargas idénticas y deja aislados a viajeros pequeños, hasta que sus cuidadores entienden que equilibrio no significa igualdad de peso.",
    objective: "Distribuir tres cargas y conservar un paso seguro para personas y Pokémon de tamaños distintos.",
    mechanic: { name: "Balanza de paso", rules: ["Medir fuerza sobre el puente, no valor del viajero.", "Usar contrapesos retirables.", "Mantener un carril de regreso abierto."], failureSafe: "Los contrapesos pueden reiniciarse sin caída ni bloqueo." },
    npcs: [
      N("Sena Cauce", "trchar008", "inspectora del puente", "AZUMARILL", "Quiere un cruce estable para cargas y caminantes.", "Confundió simetría mecánica con trato justo.", ["Dos pesos iguales estabilizan la tabla, pero no llegan en parejas.", "Azumarill cruza con fuerza distinta a la que su tamaño sugiere.", "El puente debe adaptarse al viaje, no seleccionar viajeros."], ["Los contrapesos indican rango, no categoría de cuerpo.", "El carril lateral permanece abierto durante cada ajuste.", "La inspección incluye una prueba con carga desigual."]),
      N("Boro Carga", "trchar009", "transportista de suministros", "MACHOKE", "Necesita mover cajas sin monopolizar la estructura.", "Llenaba ambos lados para activarla y cerraba el paso a los demás.", ["Mis cajas equilibran la tabla y desequilibran todo el horario.", "Machoke puede sostener una carga, no justificar prioridad eterna.", "Separaré medicinas de mercancía aplazable."], ["Los suministros críticos tienen turno publicado.", "Dejo contrapesos disponibles después de cruzar.", "La carga ya no ocupa el segundo carril como si fuera suyo."])
    ],
    decision: { question: "¿Cómo se adaptará el puente?", options: ["Contrapesos públicos", "Plataformas de apoyo gradual"], immediate: ["Sena instala pesos retirables con instrucciones visibles.", "Boro coloca apoyos que distribuyen la fuerza durante el cruce."], later: ["Otros puentes admitirán cargas desiguales.", "Las rutas podrán ajustarse sin clasificar cuerpos ni equipos."] },
    reward: { item: "FLOATSTONE", meaning: "Aligera una carga concreta sin afirmar que todos deban pesar lo mismo." }
  },
  {
    mapId: 1058, flag: 752, variable: 148,
    title: "El Manantial de las Botellas Vacías",
    promise: "Una ruta presume agua ilimitada mientras acumula recipientes desechados río abajo, y dos guardianes deben decidir si reparar el hábito o rediseñar por completo el abastecimiento.",
    objective: "Rastrear tres puntos de consumo y detener residuos sin restringir el acceso al agua.",
    mechanic: { name: "Ciclo de recipientes", rules: ["Contar envases sin culpar a quien necesita agua.", "Separar relleno, lavado y retorno.", "Mantener hidratación gratuita durante la transición."], failureSafe: "El manantial nunca se cierra como castigo." },
    npcs: [
      N("Cira Vaso", "trchar008", "guardiana del manantial", "VAPOREON", "Quiere agua limpia y accesible en toda la ruta.", "Entregaba botellas nuevas para resolver cada emergencia y creó otra corriente de residuos.", ["El agua vuelve; el plástico también, pero por otra orilla.", "Vaporeon limpia el cauce y no puede decidir qué envase necesita cada viajero.", "Cerrar la fuente castigaría primero a quien no trajo reserva."], ["La estación separa beber, rellenar y lavar.", "Nadie paga por agua ni por devolver un recipiente.", "El cauce conserva un contador público de residuos recuperados."]),
      N("Melo Filtro", "NPC 04", "técnico de recuperación", "TRUBBISH", "Busca convertir residuos en material útil sin ocultar cuánto se produce.", "Celebraba cada tonelada reciclada y dejó de preguntar por qué crecía.", ["Trubbish clasifica tapas; mi informe debe clasificar causas.", "Reciclar cien botellas no vuelve necesaria la botella ciento uno.", "El filtro sirve después de reducir, no en lugar de reducir."], ["Publicamos entradas, retornos y pérdidas por separado.", "Los recipientes prestados llevan una marca reparable.", "Mi meta bajó de reciclar más a desperdiciar menos."])
    ],
    decision: { question: "¿Qué sistema reemplazará las botellas desechables?", options: ["Estaciones de relleno", "Depósito comunitario retornable"], immediate: ["Cira instala surtidores y lavaderos abiertos.", "Melo entrega recipientes prestados con depósito recuperable."], later: ["Las rutas medirán acceso y residuos juntos.", "Los sectores compartirán recipientes reparables en vez de marcas incompatibles."] },
    reward: { item: "MYSTICWATER", meaning: "Representa agua valiosa por su cuidado y disponibilidad, no por el envase." }
  },
  {
    mapId: 1065, flag: 753, variable: 149,
    title: "La Bicicleta que No Quería Ser Premio",
    promise: "Una puerta conserva bicicletas sin dueño como trofeos de velocidad, aunque las propias máquinas Rotom prefieren volver a circular y ser reparadas.",
    objective: "Revisar tres bicicletas, separar recuerdo deportivo de transporte y abrir un préstamo seguro.",
    mechanic: { name: "Banco de bicicletas", rules: ["Comprobar frenos antes que récords.", "Registrar préstamo sin perfilar al viajero.", "Reservar una salida peatonal permanente."], failureSafe: "Nadie necesita montar para atravesar la puerta." },
    npcs: [
      N("Tana Rueda", "trchar008", "mecánica de la puerta", "ROTOM", "Quiere devolver bicicletas reparadas a la ruta.", "Conservó modelos famosos inmóviles para atraer visitantes.", ["Esta bicicleta ganó una carrera y perdió diez años colgada.", "Rotom enciende la luz cuando oye una rueda fuera.", "Un trofeo puede documentarse sin inmovilizar la herramienta."], ["Cada préstamo incluye frenos, talla y ruta de devolución.", "La bicicleta histórica conserva una placa, no una cadena.", "La puerta peatonal nunca depende del banco de ruedas."]),
      N("Ivo Candado", "trchar009", "administrador de préstamos", "KLINK", "Necesita prevenir pérdidas sin vigilar trayectos completos.", "Instaló rastreo continuo porque confundía custodia con propiedad.", ["Puedo registrar que volvió sin registrar por dónde pasó.", "Klink reconoce un candado; no necesita reconocer a la persona.", "La garantía debe cubrir reparación, no comprar obediencia."], ["El préstamo guarda hora y estado, no recorrido.", "Los candados se abren también con asistencia manual.", "Una devolución tardía ofrece reparación antes que sanción."])
    ],
    decision: { question: "¿Cómo volverán a circular las bicicletas?", options: ["Biblioteca de préstamo", "Cooperativa de reparación"], immediate: ["Ivo abre turnos anónimos con revisión de seguridad.", "Tana enseña reparación y entrega custodia rotativa."], later: ["Otros accesos tendrán transporte compartido.", "Las piezas y conocimientos circularán junto a las bicicletas."] },
    reward: { item: "METRONOME", meaning: "Marca un ritmo sostenible sin convertir la velocidad máxima en requisito." }
  },
  {
    mapId: 1076, flag: 754, variable: 150,
    title: "El Palacio que Anunciaba la Jugada",
    promise: "Un palacio táctico llama intuición a reglas que solo conocen sus jueces, hasta que dos estrategas convierten el misterio en lectura, elección y contrajuego.",
    objective: "Revisar tres órdenes tácticas y publicar suficiente información para responder sin resolver el combate de antemano.",
    mechanic: { name: "Tablero de intención", rules: ["Anunciar categoría de jugada, no movimiento exacto.", "Ofrecer una pista opcional.", "Permitir retirarse y preparar otro equipo."], failureSafe: "El desafío genérico local conserva Mochila y derrota segura." },
    npcs: [
      N("Vale Aviso", "trchar008", "jueza táctica", "GALLADE", "Quiere pruebas exigentes que midan adaptación.", "Ocultaba reglas para proteger sorpresa y terminaba midiendo conocimiento previo.", ["Gallade muestra postura ofensiva; no necesita decir el movimiento.", "Una pista útil abre decisiones, no entrega una victoria.", "Si la regla aparece después del fallo, nunca fue una prueba justa."], ["El tablero anuncia presión, defensa o cambio.", "La pista opcional no reduce recompensa.", "Cada revisión queda fechada junto al desafío."]),
      N("Uri Turno", "trchar009", "analista de contrajuego", "ORANGURU", "Busca que cada estrategia tenga al menos dos respuestas comunes.", "Explicaba soluciones completas y anulaba la experimentación.", ["Dos respuestas bastan para empezar; veinte instrucciones terminan el juego.", "Oranguru señala el turno crítico y deja que el equipo decida.", "Contrajuego visible no significa combate fácil."], ["Las ayudas aparecen por capas y pueden ignorarse.", "El registro separa derrota, pista usada y adaptación posterior.", "Todavía hay sorpresas dentro de reglas estables."])
    ],
    decision: { question: "¿Cómo se comunicará la dificultad?", options: ["Tablero público de intención", "Pistas opcionales por turno"], immediate: ["Vale publica categorías y ventanas de respuesta.", "Uri activa ayudas graduadas que no alteran la recompensa."], later: ["Las arenas distinguirán sorpresa de información oculta.", "Los jugadores podrán elegir cuánto apoyo táctico consultar."] },
    reward: { item: "EXPERTBELT", meaning: "Premia reconocer ventajas y respuestas, no memorizar una trampa secreta." }
  },
  {
    mapId: 1083, flag: 755, variable: 151,
    title: "El Pasillo de los Equipos Prestados",
    promise: "Una fábrica intercambia Pokémon para probar adaptabilidad, pero sus fichas tratan vínculos y límites como piezas reemplazables del inventario.",
    objective: "Preparar un préstamo de equipo que registre cuidado, preferencia y derecho a retirarse.",
    mechanic: { name: "Ficha de préstamo vivo", rules: ["Registrar rutinas y señales de estrés.", "Permitir rechazo sin penalización.", "Devolver al mismo cuidador después de la prueba."], failureSafe: "El desafío puede omitirse y todas las transferencias permanecen abiertas." },
    npcs: [
      N("Luma Ficha", "trchar008", "coordinadora de equipos", "DITTO", "Quiere enseñar adaptación sin reducir compañeros a estadísticas.", "Diseñó fichas perfectas para movimientos y vacías para preferencias.", ["La ficha dice cuatro ataques y nada sobre cómo pide descanso.", "Ditto puede copiar una forma; no copia consentimiento.", "Un préstamo empieza con la posibilidad real de decir no."], ["Cada ficha incluye cuidador, rutina y señal de retirada.", "Los equipos vuelven a la misma persona después de la prueba.", "Una negativa ya no baja la puntuación táctica."]),
      N("Roque Turno", "NPC 04", "cuidador de rotaciones", "PORYGON2", "Busca que los cambios de equipo no rompan tratamientos ni vínculos.", "Priorizó rotación rápida y perdió información entre turnos.", ["Porygon2 conserva datos; yo debo conservar contexto.", "Cambiar de equipo no reinicia una medicación.", "La fábrica medía tiempo de entrega y no tiempo de adaptación."], ["Cada relevo incluye una conversación entre cuidadores.", "La rotación se detiene si aparece una señal de estrés.", "El cronómetro empieza después de la adaptación, no antes."])
    ],
    decision: { question: "¿Qué modelo usará la fábrica?", options: ["Préstamo con cuidador estable", "Rotación voluntaria y pausada"], immediate: ["Luma vincula cada ficha a un cuidador disponible.", "Roque abre pausas y permite rechazar cada relevo."], later: ["Los formatos prestados conservarán continuidad de cuidado.", "Las pruebas medirán adaptación sin forzar participación."] },
    reward: { item: "DESTINYKNOT", meaning: "Representa un vínculo que acompaña la prueba sin convertirlo en propiedad intercambiable." }
  },
  {
    mapId: 1090, flag: 756, variable: 152,
    title: "La Playa de la Bandera Neutral",
    promise: "Dos ligas plantan banderas en una playa usada para descansar, y sus guardianes deben crear una zona neutral que no se convierta en una tercera reclamación permanente.",
    objective: "Retirar marcas competitivas, proteger nidos costeros y establecer una neutralidad revisable.",
    mechanic: { name: "Límite sin conquista", rules: ["Distinguir orientación de posesión.", "Dejar nidos fuera de ceremonias.", "Revisar la señal al cambiar la temporada."], failureSafe: "Ninguna opción bloquea costa, navegación ni retorno." },
    npcs: [
      N("Alba Orilla", "trchar008", "guardiana costera", "LAPRAS", "Quiere una playa segura para descanso y desembarco.", "Aceptó dos banderas para evitar pelea y duplicó la presión sobre el lugar.", ["Dos banderas no hacen neutral una playa; hacen dos reclamaciones.", "Lapras llega por la marea, no por una liga.", "La señal debe orientar sin quedarse con la costa."], ["Los nidos quedan fuera de cualquier ceremonia.", "La marca neutral tiene fecha de revisión.", "Desembarcar no exige declarar una afiliación."]),
      N("Ciro Poste", "trchar009", "enlace entre ligas", "PELIPPER", "Necesita informar acuerdos sin inventar una autoridad nueva.", "Convirtió cada aviso temporal en un poste permanente.", ["Pelipper trae mensajes y no clava fronteras.", "Un acuerdo de hoy no necesita una estatua mañana.", "Puedo registrar responsables sin registrar dueños."], ["El acta distingue uso, cuidado y propiedad inexistente.", "Los postes estacionales se retiran después de la marea alta.", "Las ligas responden juntas por daños sin gobernar la playa."])
    ],
    decision: { question: "¿Cómo se señalará la zona neutral?", options: ["Bandera rotativa y temporal", "Límite natural sin bandera"], immediate: ["Ciro alterna una señal fechada y sin emblemas de liga.", "Alba marca mareas y vegetación sin instalar una tercera bandera."], later: ["Las ligas revisarán la neutralidad por temporada.", "Los acuerdos podrán existir sin símbolo territorial permanente."] },
    reward: { item: "CLEANSETAG", meaning: "Permite atravesar la zona sin atraer una confrontación que nadie fue a buscar." }
  },
  {
    mapId: 1101, flag: 757, variable: 153,
    title: "La Habitación que Reservó una Ausencia",
    promise: "Una casa mantiene una sala médica vacía para una emergencia profetizada, mientras necesidades presentes esperan afuera y nadie se atreve a cambiar el plan.",
    objective: "Revisar suministros y abrir la habitación al presente sin eliminar su capacidad de responder a una emergencia.",
    mechanic: { name: "Reserva flexible", rules: ["Separar equipo móvil y espacio fijo.", "Definir tiempo máximo sin uso.", "Mantener salida y privacidad para cada visitante."], failureSafe: "La habitación puede volver a configuración médica sin expulsar a nadie durante una crisis." },
    npcs: [
      N("Mara Reserva", "trchar008", "encargada de cuidados", "AUDINO", "Quiere responder a una emergencia sin abandonar necesidades cotidianas.", "Protegió una predicción durante años y convirtió la prevención en habitación intocable.", ["El botiquín está listo; la persona anunciada nunca llegó.", "Audino escucha a quienes esperan hoy, no a una fecha escrita.", "Reservar capacidad no exige reservar cada silla."], ["El equipo crítico cabe en carros sellados y revisados.", "La sala tiene horario de uso y protocolo de reconversión.", "Nadie pierde privacidad cuando cambia la función del espacio."]),
      N("Teo Plano", "NPC 04", "diseñador de espacios", "CHANSEY", "Busca que la casa cambie sin improvisar durante una crisis.", "Trataba cada pared como garantía de seguridad.", ["Una pared fija no es un plan de emergencia.", "Chansey puede mover suministros sin mover a una persona descansando.", "Dibujaré primero las rutas de salida y después los muebles."], ["El plano muestra configuración diaria y médica.", "La reconversión se ensayó sin pacientes dentro.", "La ausencia dejó de ocupar más espacio que el cuidado presente."])
    ],
    decision: { question: "¿Qué uso tendrá la habitación mientras espera?", options: ["Consulta comunitaria flexible", "Sala tranquila con equipo móvil"], immediate: ["Mara abre turnos breves y conserva carros médicos sellados.", "Teo crea un espacio de descanso que puede reconvertirse sin ruido."], later: ["Las reservas de Atlas tendrán plazo y revisión.", "Los refugios separarán capacidad de emergencia y espacio inmovilizado."] },
    reward: { item: "FULLRESTORE", meaning: "Representa capacidad real de cuidado disponible ahora, no una promesa guardada para siempre." }
  }
];

const blueprints = rows.map((row, index) => ({
  tier: 2,
  routeBatch: index < 5 ? 1 : 2,
  ...row,
  progression: { switchId: row.flag, decisionVariable: row.variable, freeReturnMapId: 1001 },
  safety: { bagAlwaysAvailable: true, noForcedBattle: true, existingChallengePreserved: true, freeReturn: true, rewardOnce: true },
}));
const output = { version: 1, macroCycle: 2, tier2Batches: 2, blueprints };
const file = path.join(ROOT, "content", "atlas_tier2_blueprints_macro02.json");
fs.writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Tier 2 macrociclo 02: ${blueprints.length} rutas en ${output.tier2Batches} lotes.`);
