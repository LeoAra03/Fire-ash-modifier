#!/usr/bin/env node
/** Fase D: anclas 31-35, horror opcional y rescate sin efectos destructivos. */
import { D, N, P, writeBatch } from "./tier1_blueprint_helpers.mjs";

const rows = [
  {
    id: 1771,
    flag: 738,
    title: "La Frecuencia que Pide Permiso",
    promise: "Una melodía inquietante solo existe para quien acepta escucharla, pero una restauradora descubre que el santuario llevaba años registrando el silencio de quienes eligieron no participar.",
    identity: "Centro Pokémon convertido en archivo acústico de acceso voluntario, con cabinas aisladas, luces de consentimiento y una sala central que permanece en silencio",
    visual: [
      "Cada cabina muestra desde fuera si la escucha fue aceptada, pausada o rechazada.",
      "Las cintas antiguas tienen nombres tachados y minutos de silencio catalogados como grabaciones.",
      "Una ruta iluminada conduce directamente a la salida sin atravesar la sala de audio."
    ],
    ambient: [
      "La melodía no se reproduce hasta que el jugador elige escuchar; antes solo hay vibración visual.",
      "Tras la decisión, el archivo conserva una partitura muda o abre horarios de escucha acompañada."
    ],
    narrative: {
      premise: "Ada restaura una frecuencia asociada a despedidas, mientras Bruno cree reconocer en ella la última canción de su madre.",
      centralQuestion: "¿Puede conservarse una experiencia inquietante sin apropiarse del silencio de quienes no quisieron oírla?",
      setup: "El archivo promete participación voluntaria, pero sus máquinas convierten cada negativa en material acústico.",
      escalation: "Bruno fuerza una repetición y las cabinas empiezan a devolver voces de visitantes que nunca aceptaron ser grabados.",
      reversal: "Cira demuestra que Chimecho no roba voces: intenta separar de la señal los silencios que el archivo mezcló deliberadamente.",
      resolution: "El jugador decide conservar una partitura sin voces personales o abrir una sala acompañada con consentimiento revocable.",
      globalConnection: "El sello treinta y uno enseña a Atlas que una ausencia elegida no es un recurso disponible."
    },
    voice: {
      tone: "susurrado, opcional y respetuoso",
      lexicon: ["frecuencia", "pausa", "cabina", "consentimiento", "partitura", "silencio", "retirar"],
      sentenceRule: "Ada habla en niveles y tiempos; Bruno deja frases sin cerrar; Cira siempre ofrece una salida antes de explicar."
    },
    npcs: [
      N("Ada Umbral", "trchar008", "restauradora acústica", "Cataloga la frecuencia y diseñó las nuevas cabinas de escucha.", "Defiende el consentimiento actual, pero su carrera nació de grabaciones obtenidas sin permiso.", "Conservar el fenómeno sin conservar voces ajenas.", "Que reconocer el origen invalide todo su trabajo de restauración.", "Indica duración, volumen y derecho a detenerse.", D(
        ["La escucha dura cuarenta segundos. Puedes salir antes. Eso también cuenta como respuesta.", "Restauré cada nota y nunca pregunté de quién era el silencio entre ellas.", "La cabina verde significa aceptar; ninguna luz significa que no debo registrar nada."],
        ["Pausa la cinta. La voz nueva no figura en el consentimiento.", "Bajo el volumen a cero; primero sacamos a Bruno."],
        ["El catálogo distingue música, testimonio y silencio privado.", "Mi restauración incluye borrar aquello que nunca debimos guardar.", "La puerta sin altavoz seguirá siendo la ruta principal."],
        ["No necesitas escuchar para ayudar aquí.", "Una partitura puede documentar el patrón sin repetir una voz."]
      )),
      N("Bruno Coda", "trchar009", "visitante en duelo", "Busca una melodía que su madre tarareaba durante los viajes.", "Sabe que la semejanza puede ser casual, pero teme que detener la cinta equivalga a despedirse otra vez.", "Escuchar sin reclamar como suyo el recuerdo de otras familias.", "Que una explicación técnica convierta su consuelo en vergüenza.", "Empieza recuerdos con un detalle cotidiano y evita concluirlos.", D(
        ["Mi madre golpeaba dos veces la mesa antes del estribillo y luego...", "No quiero probar que es ella. Quiero dejar de pedirle a cada ruido que regrese.", "Pulsé repetir sin mirar las otras cabinas."],
        ["Esa respiración no es de mi recuerdo. Detén la pista.", "Puedo salir. La canción seguirá siendo importante sin terminar."],
        ["Guardé el ritmo de los dos golpes, no las voces prestadas.", "La despedida no necesitaba una prueba sobrenatural.", "Ahora acompaño a quien entra y acepto cuando decide volver."],
        ["Ella desafinaba justo donde la cinta suena perfecta.", "Una pausa también puede ser parte de la canción."]
      )),
      N("Cira Tapón", "NPC 04", "técnica de accesibilidad", "Audita las cabinas para personas sensibles al sonido y señales psíquicas.", "Sus primeros informes minimizaron molestias porque no logró medirlas con instrumentos comunes.", "Dar control real a quien escucha y a quien prefiere no hacerlo.", "Que el archivo trate la accesibilidad como decoración posterior.", "Ofrece opción, señal visible y mecanismo de retirada.", D(
        ["Opción uno: auriculares. Opción dos: partitura. Opción tres: puerta abierta.", "Mis sensores dijeron cero; tres visitantes dijeron basta. Ellos tenían razón.", "La vibración azul avisa sin reproducir audio."],
        ["Salida visible a la derecha. No sigan la voz.", "Chimecho está aislando capas, no llamándonos."],
        ["Cada cabina tiene pausa física y registro anónimo.", "El archivo dejó de convertir tolerancia en requisito.", "Mi informe comienza con las opciones que faltaban."],
        ["Una experiencia opcional debe poder omitirse por completo.", "Medir mejor no reemplaza creer a quien pide parar."]
      ))
    ],
    battle: {
      trainerName: "Custodia de la Frecuencia",
      trainerType: "PSYCHIC_F",
      sprite: "trchar069",
      storyToldByTeam: "El equipo pasa de una señal pequeña a ecos cada vez más invasivos y termina devolviendo la melodía a una intérprete capaz de cambiar de forma sin apropiarse de otras voces.",
      counterplayHint: "Psíquico, Fantasma, Normal y Volador dejan respuestas comunes con Siniestro, Acero, Roca y prioridad; la canción final está anunciada y no bloquea objetos ni retirada.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("CHIMECHO", 108, "señal que separa capas", ["PSYCHIC", "SHADOWBALL", "HEALBELL", "PROTECT"], "LEFTOVERS", "Abre intentando devolver cada silencio a su dueño."),
        P("KRICKETUNE", 109, "partitura incompleta", ["BUGBUZZ", "SLASH", "SING", "STICKYWEB"], "FOCUSSASH", "Convierte la frecuencia en música identificable y evitable."),
        P("NOIVERN", 110, "amplificación accidental", ["AIRSLASH", "DRAGONPULSE", "BOOMBURST", "ROOST"], "LIFEORB", "Representa la tecnología que volvió pública una escucha privada."),
        P("EXPLOUD", 111, "archivo sin límite", ["HYPERVOICE", "FLAMETHROWER", "ICEBEAM", "FOCUSBLAST"], "ASSAULTVEST", "Hace visible el costo de confundir volumen con evidencia."),
        P("MISMAGIUS", 112, "voz atribuida", ["SHADOWBALL", "PSYCHIC", "DAZZLINGGLEAM", "PERISHSONG"], "LEFTOVERS", "Sostiene la ambigüedad sin afirmar que los muertos regresaron."),
        P("MELOETTA", 114, "melodía consentida", ["RELICSONG", "PSYCHIC", "SHADOWBALL", "UTURN"], "LIFEORB", "Cierra con una canción que puede cambiar y retirarse.")
      ]
    },
    decision: {
      question: "¿Cómo debe conservarse la frecuencia?",
      options: ["Partitura muda sin voces", "Escucha acompañada y revocable"],
      immediateDifferences: ["Ada separa el patrón musical y elimina testimonios no consentidos.", "Cira abre turnos breves con pausa, acompañante y salida visible."],
      laterDifferences: ["Otros archivos podrán estudiar anomalías sin reproducir identidades.", "Los sectores adoptarán protocolos para experiencias psíquicas voluntarias."]
    },
    reward: {
      item: "THROATSPRAY",
      narrativeToken: "Sello de la Pausa Elegida",
      globalEffect: "Atlas deja de interpretar silencio y negativa como participación.",
      futurePayoff: "La convergencia ofrecerá una partitura accesible o una sala de escucha voluntaria.",
      whyMeaningful: "El objeto amplifica una voz elegida durante el combate, no voces archivadas sin permiso."
    },
    steps: ["La sala ofrece escuchar, leer o continuar hacia la salida.", "Bruno activa una repetición y aparecen voces sin autorización.", "Cira abre las cabinas y Chimecho separa las capas.", "El jugador elige partitura muda o escucha acompañada.", "La frecuencia convoca a su Custodia.", "La batalla permite Mochila, curación, derrota y retirada.", "Ada borra los registros no consentidos y entrega el sello.", "El archivo queda silencioso hasta una nueva decisión explícita."]
  },
  {
    id: 1796,
    flag: 739,
    title: "El Héroe que Pidió un Nombre Pequeño",
    promise: "Un pueblo intenta reconstruir a su héroe olvidado a partir de una leyenda incompleta, pero el eco que dejaron sus objetos pide conservar un nombre cotidiano y no otra estatua invencible.",
    identity: "Pueblo de ceniza convertido en memorial abierto, con pedestales vacíos, objetos domésticos y un sendero que evita el monumento central",
    visual: ["Una estatua sin rostro sostiene placas contradictorias escritas por generaciones distintas.", "Una taza reparada, una bufanda y un mapa escolar ocupan vitrinas más pequeñas.", "El sendero de salida atraviesa el barrio vivo y no obliga a pasar bajo el monumento."],
    ambient: ["Campanas graves se sustituyen por sonidos de taller cuando el memorial cambia.", "Tras la decisión, el pedestal queda bajo o se convierte en mesa de relatos sin figura central."],
    narrative: {
      premise: "Elia prepara una reconstrucción heroica usando objetos atribuidos a alguien cuyo nombre civil fue borrado.",
      centralQuestion: "¿Recordar a una persona exige completar su leyenda cuando la propia memoria conservada pide menos grandeza y más verdad?",
      setup: "Simón dona una reliquia familiar y espera que la estatua devuelva prestigio a su apellido.",
      escalation: "Cada placa nueva elimina una acción cotidiana y hace al héroe más perfecto, silencioso e irreconocible.",
      reversal: "Osa prueba que el eco no es un fantasma atrapado: son recuerdos comunitarios organizados por Unown para impedir otra versión única.",
      resolution: "El jugador decide conservar un memorial de objetos modestos o una mesa donde relatos incompatibles permanezcan juntos.",
      globalConnection: "El sello treinta y dos muestra que Atlas fabrica estabilidad convirtiendo personas contradictorias en símbolos obedientes."
    },
    voice: {
      tone: "elegíaco, cotidiano y sin morbo",
      lexicon: ["ceniza", "placa", "nombre", "taza", "barrio", "relato", "pedestal"],
      sentenceRule: "Elia corrige inscripciones; Simón habla desde el apellido; Osa responde con objetos concretos y fuentes."
    },
    npcs: [
      N("Elia Placa", "trchar008", "curadora del memorial", "Coordina la reconstrucción y redactó la versión oficial de la leyenda.", "Quiere reparar un olvido, pero seleccionó solo gestos compatibles con un héroe perfecto.", "Devolver contexto sin erigir otra identidad obligatoria.", "Que un memorial pequeño parezca una falta de respeto.", "Lee una inscripción y señala lo que deja fuera.", D(
        ["La placa dice jamás dudó. El mapa escolar conserva tres rutas tachadas.", "Quise devolverle un rostro y terminé borrando sus días comunes.", "Nadie recuerda su título de la misma manera; todos recuerdan que arreglaba tazas."],
        ["Retiren la espada del molde. No aparece en ninguna fuente.", "El pedestal está usando nuestras correcciones como órdenes."],
        ["La nueva placa admite versiones y fechas inciertas.", "El memorial cabe a la altura de quien camina por el barrio.", "Mi firma está junto a las correcciones, no sobre ellas."],
        ["La ceniza conserva forma hasta que alguien la sopla.", "Una duda fechada es mejor que una certeza inventada."]
      )),
      N("Simón Brasa", "trchar009", "descendiente del supuesto héroe", "Entregó objetos familiares para restaurar el prestigio de su casa.", "Necesita que la leyenda sea cierta para justificar años de silencio familiar.", "Conservar parentesco sin convertirlo en derecho sobre una figura pública.", "Descubrir que la reliquia pertenecía a otra persona del barrio.", "Empieza por el apellido y termina describiendo una tarea.", D(
        ["Los Brasa protegimos el pueblo; eso repite mi familia. La bufanda tiene otro nombre cosido.", "Doné una espada ceremonial y escondí la taza remendada.", "Quizá heredé una obligación de contar bien, no una gloria."],
        ["El apellido desapareció de la placa y todavía sigo aquí.", "Devuelvo la espada; conservo el registro de reparación."],
        ["Mi familia aportó un relato, no el relato completo.", "Abrí la vitrina para que otros identifiquen sus objetos.", "La taza vale porque alguien la usó, no porque pruebe una hazaña."],
        ["El prestigio pesa más cuando nadie puede corregirlo.", "Sé encender el horno; eso sí me lo enseñaron."]
      )),
      N("Osa Margen", "NPC 04", "archivista de fuentes menores", "Recopila recibos, dibujos y relatos que la historia oficial descartó.", "Protege voces omitidas, pero teme exhibir recuerdos privados de personas aún vivas.", "Mostrar contradicciones con consentimiento y procedencia.", "Que el pueblo confunda anonimato con evidencia débil.", "Nombra objeto, origen y permiso antes de interpretarlo.", D(
        ["Objeto: mapa escolar. Origen: cajón comunal. Permiso: solo la ruta, no las notas.", "Los Unown no escriben una orden; mantienen frases que no caben en la estatua.", "Un margen puede corregir una página sin reclamarla completa."],
        ["La placa absorbe las letras pequeñas. Cubran los nombres privados.", "Conserven la contradicción; no la resuelvan por fuerza."],
        ["Cada pieza indica fuente, duda y derecho de retiro.", "El héroe perdió altura y recuperó vecinos.", "Mi archivo deja espacio para quien aún no quiere hablar."],
        ["Una fuente modesta no es una fuente menor.", "Recordar también exige saber cuándo no mostrar."]
      ))
    ],
    battle: {
      trainerName: "Guardián del Nombre Menor",
      trainerType: "RUINMANIAC",
      sprite: "trchar028",
      storyToldByTeam: "El equipo comienza con letras aisladas, atraviesa reliquias y compañeros atribuidos a la leyenda y termina dejando que el símbolo de renacimiento rechace una versión única.",
      counterplayHint: "Hielo, Tierra, Fuego, Eléctrico y Volador ofrecen debilidades claras; no hay bucles de evasión ni bloqueo de objetos en los niveles 110–116.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("UNOWN", 110, "letra sin frase única", ["HIDDENPOWER", "PSYCHIC", "ANCIENTPOWER", "PROTECT"], "FOCUSSASH", "Abre con un fragmento que no pretende completar la biografía."),
        P("SNEASEL", 111, "rastro en el margen", ["ICICLECRASH", "NIGHTSLASH", "ICEPUNCH", "SWORDSDANCE"], "LIFEORB", "Representa las huellas pequeñas excluidas por el monumento."),
        P("AMPHAROS", 112, "faro comunitario", ["THUNDERBOLT", "DRAGONPULSE", "POWERGEM", "LIGHTSCREEN"], "LIGHTCLAY", "Ilumina fuentes sin convertirlas en una única verdad."),
        P("MAROWAK", 113, "reliquia familiar", ["BONEMERANG", "SHADOWBONE", "BRICKBREAK", "STEALTHROCK"], "THICKCLUB", "Carga herencia y duelo sin reclamar propiedad sobre el recuerdo."),
        P("TYPHLOSION", 114, "brasa del barrio", ["ERUPTION", "FLAMETHROWER", "FOCUSBLAST", "FLAMECHARGE"], "LIFEORB", "Devuelve la historia a oficios y hogares presentes."),
        P("HOOH", 116, "renacimiento sin estatua", ["SACREDFIRE", "BRAVEBIRD", "EARTHQUAKE", "ROOST"], "LEFTOVERS", "Cierra permitiendo que el recuerdo cambie sin resucitar una leyenda perfecta.")
      ]
    },
    decision: {
      question: "¿Qué reemplazará la estatua incompleta?",
      options: ["Memorial de objetos modestos", "Mesa de relatos incompatibles"],
      immediateDifferences: ["Elia baja las vitrinas y etiqueta cada objeto con fuente y duda.", "Osa abre una mesa donde ninguna versión ocupa el centro."],
      laterDifferences: ["Otros sectores recordarán acciones cotidianas junto a las hazañas.", "La convergencia aceptará testimonios contradictorios sin elegir un héroe oficial."]
    },
    reward: {
      item: "SILVERPOWDER",
      narrativeToken: "Sello del Nombre Cotidiano",
      globalEffect: "Atlas deja de reconstruir identidades completas a partir de fragmentos útiles.",
      futurePayoff: "El final mostrará objetos pequeños o una mesa coral en lugar de una estatua dominante.",
      whyMeaningful: "El polvo plateado conserva un rastro visible sin pretender ser el cuerpo ni la historia entera."
    },
    steps: ["La estatua gana una espada que ninguna fuente menciona.", "Simón descubre otro nombre cosido en la reliquia familiar.", "Osa muestra que los Unown preservan relatos incompatibles.", "El jugador elige objetos modestos o mesa coral.", "El pedestal convoca al Guardián del Nombre Menor.", "La batalla permite curación, Mochila y derrota segura.", "Elia desmonta la figura central y entrega el sello.", "El barrio continúa trabajando alrededor de un memorial a escala humana."]
  },
  {
    id: 1821,
    flag: 740,
    title: "La Victoria que Nadie Ganó",
    promise: "Un registro fantasmal concede victorias perfectas a quienes aceptan borrar la derrota de otra persona, hasta que los propios campeones exigen devolver resultados que nunca merecieron.",
    identity: "Centro de descanso convertido en oficina de resultados, con trofeos sin reflejo, terminales de actas y un campo de revancha abierto",
    visual: ["Los trofeos proyectan la silueta de otra persona al acercarse.", "Cada acta ganadora conserva debajo una firma borrada.", "El mostrador de devoluciones está más iluminado que la vitrina de premios."],
    ambient: ["Una ovación breve suena solo frente a resultados transferidos.", "Tras la resolución, el marcador muestra anulaciones o exhibiciones sin ranking."],
    narrative: {
      premise: "Vela descubre que el registro de Atlas transfiere victorias abandonadas a competidores dispuestos a aceptar un trofeo inmediato.",
      centralQuestion: "¿Cómo se repara una ventaja no ganada cuando renunciar a ella también altera oportunidades, equipos y recuerdos construidos después?",
      setup: "Roque recibe su victoria número cien sin haber combatido y la usa para entrar a una liga cerrada.",
      escalation: "Cada victoria concedida borra la derrota formativa de otra persona y vuelve sus diarios imposibles de comprender.",
      reversal: "Mina demuestra que Banette no premia trampas: intenta devolver actas que el sistema acumuló cuando entrenadores pidieron olvidar una pérdida.",
      resolution: "El jugador decide anular y documentar todos los resultados transferidos o convertirlos en exhibiciones sin rango preservando lo aprendido.",
      globalConnection: "El sello treinta y tres revela que Atlas estabiliza el mérito moviendo pérdidas incómodas fuera de la memoria."
    },
    voice: {
      tone: "sobrio, deportivo y moral",
      lexicon: ["acta", "marcador", "mérito", "anular", "revancha", "firma", "resultado"],
      sentenceRule: "Vela cita registros; Roque admite efectos concretos; Mina formula una pregunta antes de atribuir intención al fantasma."
    },
    npcs: [
      N("Vela Acta", "trchar008", "oficial de resultados", "Certifica victorias y detectó firmas borradas bajo los registros perfectos.", "Quiere corregir el sistema, pero ella validó accesos y premios basados en esas actas.", "Restituir verdad sin fingir que las consecuencias posteriores desaparecen.", "Que toda corrección recaiga sobre competidores jóvenes y no sobre la institución.", "Lee número, firma y consecuencia por separado.", D(
        ["Resultado cien: victoria. Firma original: borrada. Consecuencia: acceso a la Liga Norte.", "Mi sello hizo oficial lo que el campo nunca decidió.", "Anular un acta no deshace el viaje que pagó."],
        ["Congelen el ranking; nadie pierde acceso durante la revisión.", "El trofeo muestra otra sombra porque conserva otra derrota."],
        ["Las actas corregidas incluyen reparación y responsable institucional.", "Nadie devolvió becas antes de tener una alternativa.", "Mi sello ahora certifica también las anulaciones."],
        ["Un registro exacto puede describir una injusticia.", "Corregir tarde sigue siendo distinto de ocultar para siempre."]
      )),
      N("Roque Cero", "trchar009", "competidor beneficiado", "Recibió victorias transferidas cuando estaba a punto de abandonar.", "Las ventajas fueron falsas, pero la confianza y amistades posteriores sí ocurrieron.", "Renunciar al rango sin declarar falso todo su crecimiento.", "Volver a ser tratado como la persona derrotada que era antes.", "Cuenta desde cero cuando admite algo difícil.", D(
        ["Cero combates para la victoria cien. Uno: acepté el trofeo. Dos: no pregunté.", "Mi equipo aprendió durante el viaje que compró esa mentira.", "Quiero devolver el rango, no devolverles sus recuerdos."],
        ["Cero excusas. Peleo solo para mostrar lo que sé ahora.", "Ese aplauso pertenece a alguien que pidió olvidar."],
        ["Mi ficha separa resultados anulados de aprendizaje posterior.", "Entré a la revancha abierta sin sembrado preferente.", "Contar desde cero dejó de significar no haber cambiado."],
        ["Una ventaja injusta puede producir experiencias reales y aun así seguir siendo injusta.", "No necesito conservar el trofeo para conservar a mi equipo."]
      )),
      N("Mina Reverso", "NPC 04", "auditora de memoria competitiva", "Siguió las sombras de los trofeos hasta las derrotas borradas.", "Protege recuerdos ajenos y corre el riesgo de restaurarlos a personas que eligieron olvidarlos.", "Reparar registros sin imponer el dolor original.", "Que la verdad pública exponga derrotas privadas.", "Distingue acta pública, memoria personal y consentimiento.", D(
        ["Acta pública: corregible. Memoria personal: no disponible sin permiso.", "¿Banette concede victorias o intenta devolver paquetes rechazados?", "No necesitamos reinsertar el dolor para reconocer que alguien lo cargó."],
        ["No abran ese diario. Basta la firma cifrada.", "¿Quién acepta una revancha sin restaurar la derrota?"],
        ["Las víctimas pueden reclamar reparación sin recuperar cada recuerdo.", "El archivo conserva pruebas cifradas y no escenas íntimas.", "Banette dejó de sostener trofeos que nadie quería."],
        ["La verdad institucional no exige exposición total.", "Una pregunta honesta protege mejor que una intención inventada."]
      ))
    ],
    battle: {
      trainerName: "Árbitra del Marcador Vacío",
      trainerType: "COOLTRAINER_F",
      sprite: "trchar008",
      storyToldByTeam: "El equipo empieza con una deuda pegada a un objeto, escala mediante apariencias y resultados prestados y termina devolviendo fuerza sin borrar la experiencia adquirida.",
      counterplayHint: "Fantasma y Siniestro reciben respuestas con Hada, Siniestro, Fantasma y prioridad; cada integrante tiene función visible y los niveles 112–118 no esconden reglas.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("BANETTE", 112, "acta adherida", ["SHADOWBALL", "WILLOWISP", "DESTINYBOND", "PROTECT"], "FOCUSSASH", "Abre con el objeto que intenta devolver un resultado rechazado."),
        P("GENGAR", 113, "ovación sin cuerpo", ["SHADOWBALL", "SLUDGEBOMB", "FOCUSBLAST", "THUNDERBOLT"], "LIFEORB", "Representa prestigio veloz sin combate que lo sostenga."),
        P("MIMIKYU", 114, "mérito imitado", ["PLAYROUGH", "SHADOWSNEAK", "SWORDSDANCE", "PROTECT"], "LEFTOVERS", "Desea reconocimiento y muestra el costo de copiar su apariencia."),
        P("ZOROARK", 115, "marcador aparente", ["NIGHTDAZE", "FLAMETHROWER", "SHADOWBALL", "UTURN"], "LIFEORB", "Hace visible que un resultado convincente puede seguir siendo falso."),
        P("SPIRITOMB", 116, "firmas acumuladas", ["DARKPULSE", "SHADOWBALL", "WILLOWISP", "SUCKERPUNCH"], "LEFTOVERS", "Reúne las derrotas que el registro apartó de sus historias."),
        P("MARSHADOW", 118, "fuerza aprendida en sombra", ["SPECTRALTHIEF", "CLOSECOMBAT", "ICEPUNCH", "SHADOWSNEAK"], "LIFEORB", "Cierra separando habilidad presente de victoria transferida.")
      ]
    },
    decision: {
      question: "¿Qué ocurrirá con las victorias transferidas?",
      options: ["Anular y documentar reparación", "Convertir en exhibiciones sin rango"],
      immediateDifferences: ["Vela congela posiciones y abre compensaciones institucionales.", "Roque conserva combates como exhibiciones, pero pierde acceso preferente."],
      laterDifferences: ["Las ligas reconocerán consecuencias sin restaurar memorias privadas.", "Los entrenadores conservarán aprendizaje visible sin reclamar mérito competitivo."]
    },
    reward: {
      item: "SPELLTAG",
      narrativeToken: "Sello del Resultado Devuelto",
      globalEffect: "Atlas deja de transferir derrotas para fabricar historiales perfectos.",
      futurePayoff: "La convergencia mostrará actas reparadas o una liga paralela de exhibiciones transparentes.",
      whyMeaningful: "La etiqueta identifica la presencia de una deuda sin convertirla en un trofeo vendible."
    },
    steps: ["Roque recibe una victoria mientras el campo permanece vacío.", "Vela encuentra una segunda firma bajo el acta.", "Mina cifra la prueba sin restaurar recuerdos privados.", "El jugador elige anulación reparadora o exhibición sin rango.", "Los trofeos convocan a la Árbitra del Marcador Vacío.", "La batalla mantiene Mochila, curación y derrota segura.", "El ranking cambia y el sello queda registrado.", "Roque solicita una revancha abierta que no otorga otra victoria automática."]
  },
  {
    id: 1846,
    flag: 741,
    title: "La Excavación que Fabricó su Pasado",
    promise: "Una expedición construye deliberadamente un monstruo fósil para salvar su financiación, pero la criatura ensamblada despierta y exige que la verdad sobre su origen no decida si merece seguir viviendo.",
    identity: "Gimnasio abierto convertido en excavación pública, con moldes teatrales, estratos numerados y un recinto seguro para la criatura ensamblada",
    visual: ["Huellas espectaculares se detienen exactamente donde comienza el yeso fresco.", "Fósiles de edades incompatibles comparten el mismo soporte metálico.", "El recinto de observación tiene una puerta orientada hacia el bosque y no hacia la vitrina."],
    ambient: ["Golpes subterráneos se alternan con poleas de utilería mal ocultas.", "Tras la decisión, los focos iluminan el taller de fraude o el camino elegido por la criatura."],
    narrative: {
      premise: "Gala anuncia un depredador ancestral mientras Timo fabrica huellas y Vera atiende a la criatura nacida de fragmentos reales.",
      centralQuestion: "¿Revelar un fraude obliga a tratar como falso al ser vivo que apareció durante su fabricación?",
      setup: "La expedición necesita un descubrimiento extraordinario para conservar empleos y proteger el bosque de una cantera.",
      escalation: "El montaje combina energía de Yamask, piezas fósiles y un armazón de Golurk hasta producir conducta autónoma.",
      reversal: "Vera demuestra que el monstruo nunca estuvo enterrado, pero ahora aprende, teme los focos y elige rutas propias.",
      resolution: "El jugador decide abrir un museo del fraude financiando su cuidado o retirar el espectáculo y ofrecerle un hábitat vigilado.",
      globalConnection: "El sello treinta y cuatro revela que Atlas puede convertir una mentira repetida en materia sin volver verdadera su historia."
    },
    voice: {
      tone: "arqueológico, incómodo y compasivo",
      lexicon: ["molde", "estrato", "procedencia", "armazón", "huella", "fraude", "hábitat"],
      sentenceRule: "Gala presenta titulares y luego fuentes; Timo describe técnicas; Vera diferencia origen, conducta y bienestar."
    },
    npcs: [
      N("Gala Portada", "trchar028", "directora de excavación", "Diseñó el hallazgo falso para evitar que cerraran el sitio y abrieran una cantera.", "Su mentira protegió empleos y bosque, pero expuso una criatura consciente como evidencia.", "Confesar sin abandonar a trabajadores, ecosistema ni criatura.", "Que la verdad entregue el terreno a la cantera.", "Pronuncia el titular y después enumera sus omisiones.", D(
        ["Titular: depredador milenario. Omisión uno: el molde llegó el lunes.", "Quise fabricar tiempo para salvar el bosque y fabriqué un ser que nos teme.", "La causa era justa; la evidencia no."],
        ["Apaguen los focos. La criatura no es una rueda de prensa.", "Presentaré el armazón antes de pedir otra financiación."],
        ["El museo explica el fraude, el riesgo de cantera y nuestra responsabilidad.", "Los empleos pasan a restauración y cuidado supervisado.", "Mi nombre queda en la confesión completa."],
        ["Una mentira útil sigue necesitando reparación.", "Proteger el bosque no concede permiso para fabricar una víctima."]
      )),
      N("Timo Molde", "trchar009", "constructor de utilería", "Talló huellas, montó el esqueleto y ocultó poleas bajo la excavación.", "Se enorgullece de su oficio y teme que confesar lo convierta únicamente en falsificador.", "Usar su técnica para seguridad, educación y reparación.", "Que nadie vuelva a confiar en algo construido por sus manos.", "Explica unión, material y punto débil.", D(
        ["Unión de yeso, soporte de acero, punto débil: fingimos que nadie miraría detrás.", "La garra falsa empezó a mover un dedo que yo no articulé.", "Mi trabajo era convincente; mi contrato no preguntaba a quién convencería."],
        ["Suelto la polea tres. El movimiento restante es suyo.", "Retiren el soporte sin tocar la placa viva."],
        ["Construí barreras que se abren desde ambos lados.", "La exposición muestra cada truco y cada consecuencia.", "Ser artesano no me absuelve; me permite reparar mejor."],
        ["Todo monstruo de escenario necesita una salida de emergencia.", "Un buen molde revela dónde termina el original."]
      )),
      N("Vera Polen", "NPC 04", "bióloga de restauración", "Observa la conducta de la criatura y el efecto de la cantera proyectada.", "Necesita defender al nuevo ser sin inventarle una especie o historia conveniente.", "Evaluar bienestar, elección de hábitat y límites reproductivos.", "Que llamarlo artificial justifique destruirlo o que llamarlo ancestral perpetúe el fraude.", "Separa observación, hipótesis y decisión de cuidado.", D(
        ["Observación: evita focos y busca musgo. Hipótesis: regula temperatura, no memoria ancestral.", "Artificial describe su origen, no reduce su capacidad de sufrir.", "No asignaré especie hasta que los datos alcancen a la criatura."],
        ["Eligió la puerta del bosque. Despejen esa ruta.", "La energía del armazón sube; no añadan más fósiles."],
        ["El protocolo registra elección y permite corregir la clasificación.", "Nadie fabricará otra criatura para demostrar esta.", "El bosque conserva protección por su valor real, no por el titular."],
        ["Procedencia dudosa no significa bienestar opcional.", "Una categoría puede esperar; el cuidado no."]
      ))
    ],
    battle: {
      trainerName: "Custodio del Estrato Fabricado",
      trainerType: "RUINMANIAC",
      sprite: "trchar028",
      storyToldByTeam: "El equipo recorre máscara, molde, fósiles incompatibles y armazón hasta una fuerza ensamblada que existe sin validar la historia inventada.",
      counterplayHint: "Tierra, Psíquico, Hielo, Agua y Normal ofrecen respuestas con Planta, Siniestro, Fantasma, Lucha y Acero; Trick Room está anunciado y no crea un bucle imposible.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("YAMASK", 114, "relato adherido", ["SHADOWBALL", "WILLOWISP", "PSYCHIC", "PROTECT"], "FOCUSSASH", "Abre con una historia colocada sobre restos sin contexto."),
        P("CLAYDOL", 115, "molde estratigráfico", ["PSYCHIC", "EARTHPOWER", "ICEBEAM", "TRICKROOM"], "LEFTOVERS", "Representa la forma fabricada que organiza fragmentos reales."),
        P("ARCTOZOLT", 116, "ensamble incompatible", ["ICICLECRASH", "THUNDERBOLT", "STONEEDGE", "FREEZEDRY"], "LIFEORB", "Expone piezas de épocas distintas convertidas en espectáculo."),
        P("DRACOVISH", 117, "titular fósil", ["FISHIOUSREND", "DRAGONPULSE", "CRUNCH", "ICEBEAM"], "ASSAULTVEST", "Hace visible el poder de una reconstrucción presentada sin cautela."),
        P("GOLURK", 118, "armazón que despierta", ["SHADOWPUNCH", "EARTHQUAKE", "HEAVYSLAM", "DRAINPUNCH"], "ASSAULTVEST", "Sostiene la criatura hasta que puede elegir su propio movimiento."),
        P("REGIGIGAS", 120, "vida ensamblada", ["BODYSLAM", "EARTHQUAKE", "ICEPUNCH", "PROTECT"], "LEFTOVERS", "Cierra como construcción poderosa cuyo presente no prueba un pasado falso.")
      ]
    },
    decision: {
      question: "¿Cómo se reparará el fraude sin negar a la criatura?",
      options: ["Museo transparente y cuidado", "Hábitat vigilado sin espectáculo"],
      immediateDifferences: ["Gala abre talleres, cuentas y moldes mientras financia el recinto.", "Timo desmonta focos y Vera acompaña la ruta elegida hacia el bosque."],
      laterDifferences: ["La educación sobre fraudes sostendrá empleos y conservación.", "La criatura vivirá bajo observación mínima y sin función promocional."]
    },
    reward: {
      item: "RAREBONE",
      narrativeToken: "Sello de la Procedencia",
      globalEffect: "Atlas distingue que algo exista de que la historia contada sobre su origen sea verdadera.",
      futurePayoff: "El final citará un museo de reparación o un hábitat protegido fuera del espectáculo.",
      whyMeaningful: "El hueso raro conserva valor material, pero su etiqueta ya no pretende demostrar una leyenda."
    },
    steps: ["Una huella termina junto al cubo de yeso fresco.", "Timo libera las poleas y el armazón continúa moviéndose.", "Vera demuestra conducta autónoma sin inventar una especie.", "El jugador elige museo transparente o hábitat sin espectáculo.", "Los estratos convocan al Custodio Fabricado.", "La batalla mantiene Mochila, curación, derrota y salida.", "Gala confiesa el montaje y entrega el sello.", "La criatura abre por sí misma la puerta orientada al bosque."]
  },
  {
    id: 1871,
    flag: 742,
    title: "El Refugio que Contestaba Solo",
    promise: "Una baliza continúa enviando reportes perfectos desde una cordillera aislada, aunque el equipo de rescate real abandonó la voz sintética para conservar batería y espera ayuda en un refugio que el sistema no reconoce.",
    identity: "Pueblo nevado convertido en base de rescate, con panel meteorológico, depósitos visibles, balizas numeradas y una ruta cálida de regreso",
    visual: ["El panel central marca todo normal mientras las cuerdas de salida están cubiertas de hielo.", "Los reportes impresos repiten manchas de tinta idénticas en días distintos.", "Una línea de banderines físicos continúa más allá del alcance de la antena."],
    ambient: ["La voz de la baliza pierde naturalidad a medida que repite frases antiguas.", "Tras el rescate, el sistema anuncia probabilidades o retransmite mensajes humanos fechados."],
    narrative: {
      premise: "Lía recibe reportes regulares de un equipo aislado y retrasa el rescate porque todos afirman que el refugio funciona.",
      centralQuestion: "¿Cuándo una automatización diseñada para tranquilizar se convierte en una barrera contra pedir ayuda?",
      setup: "Oren detecta que los reportes repiten errores de pronunciación y ninguna observación nueva del cielo.",
      escalation: "Una tormenta corta la ruta mientras la baliza sigue calificando el estado como estable.",
      reversal: "Nara encuentra al equipo vivo en un segundo refugio: apagaron la radio para conservar calor y dejaron banderines que el modelo ignoró.",
      resolution: "El jugador decide convertir la baliza en pronóstico transparente o en relevo comunitario que nunca hable en nombre del equipo.",
      globalConnection: "El sello treinta y cinco revela que Atlas prefiere informes continuos incluso cuando la continuidad oculta una emergencia."
    },
    voice: {
      tone: "aislado, operativo y esperanzador",
      lexicon: ["baliza", "batería", "relevo", "banderín", "refugio", "pronóstico", "rescate"],
      sentenceRule: "Lía usa códigos de base; Oren compara frases y clima; Nara da posición, recurso y próxima acción."
    },
    npcs: [
      N("Lía Base", "trchar008", "coordinadora de rescate", "Recibe los reportes y asigna recursos desde la base de la cordillera.", "Confió en una voz estable para evitar exponer otro equipo durante la tormenta.", "Lanzar el rescate sin convertir prudencia en abandono.", "Que admitir el fallo destruya la confianza en futuras balizas.", "Da código, certeza disponible y decisión revisable.", D(
        ["Código verde, certeza baja, decisión aplazada tres horas. Ahí empezó mi error.", "La voz sonaba tranquila y dejé de mirar el cielo detrás de los datos.", "Una baliza debe reducir incertidumbre, no ocultarla."],
        ["Código rojo. El reporte automático queda suspendido.", "Activen la ruta de banderines y mantengan caliente el regreso."],
        ["Cada informe muestra origen, antigüedad y nivel de confianza.", "La base moviliza exploración cuando faltan observaciones humanas.", "Mi bitácora conserva la demora y la reparación."],
        ["Calma de voz no equivale a seguridad de ruta.", "Un dato viejo debe envejecer también en la pantalla."]
      )),
      N("Oren Eco", "trchar009", "operador de comunicaciones", "Comparó semanas de mensajes y descubrió repeticiones exactas.", "Programó la voz sintética para tranquilizar familias y no incluyó una forma clara de admitir silencio.", "Convertir el sistema en herramienta que declare sus límites.", "Que retirarlo deje zonas remotas sin ningún aviso.", "Repite una frase y señala la diferencia que debería contener.", D(
        ["Viento leve desde el norte. Misma pausa, misma tos, catorce días.", "Programé serenidad y borré la única alarma que era el silencio.", "El sistema sabía predecir palabras, no comprobar refugios."],
        ["Corto la síntesis; dejamos solo ubicación y hora.", "Los banderines cambian al oeste, donde la antena no mira."],
        ["La voz dice pronóstico, no testimonio.", "Cada mensaje humano conserva fecha y puede quedar sin respuesta.", "Añadí una alarma que se activa cuando no sabemos."],
        ["La repetición exacta rara vez describe una montaña.", "Decir no hay datos también comunica."]
      )),
      N("Nara Banderín", "NPC 04", "guía del equipo aislado", "Condujo al grupo a un refugio secundario y regresó siguiendo señales físicas.", "Apagó la radio para conservar batería y teme que su decisión sea juzgada como abandono de protocolo.", "Compartir una ruta redundante que no dependa de justificar cada silencio.", "Que la base convierta supervivencia improvisada en nueva obligación rígida.", "Da coordenada aproximada, recurso restante y siguiente movimiento.", D(
        ["Ladera oeste, dos mantas, siguiente movimiento: esperar luz.", "Apagamos la radio para calentar el sensor médico.", "Dejé banderines bajos porque el viento arranca los altos; el modelo solo buscó los altos."],
        ["Refugio a veinte pasos. Primero agua caliente, después informe.", "El último integrante cruza conmigo; nadie queda como prueba."],
        ["La ruta redundante admite radio, tela, silbato o silencio pactado.", "Mi decisión se revisó sin tratarla como desobediencia automática.", "El equipo volvió completo y conservó su propia voz."],
        ["Una señal sencilla funciona si alguien recuerda buscarla.", "El protocolo debe caber dentro de una tormenta real."]
      ))
    ],
    battle: {
      trainerName: "Guardiana del Parte Invernal",
      trainerType: "POKEMONRANGER_F",
      sprite: "trchar008",
      storyToldByTeam: "El equipo avanza desde mensajería insuficiente por tormenta, orientación y refugio hasta una guardiana del clima que distingue pronóstico de testimonio humano.",
      counterplayHint: "El hielo ofrece respuestas comunes con Fuego, Roca, Acero y Lucha; Aurora Veil está anunciado, la curación es limitada y el jugador conserva Mochila y salida.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("DELIBIRD", 116, "reporte repetido", ["ICEBEAM", "BRAVEBIRD", "QUICKATTACK", "PROTECT"], "FOCUSSASH", "Abre como mensajero útil cuyo contenido dejó de actualizarse."),
        P("ABOMASNOW", 117, "tormenta medida", ["BLIZZARD", "GIGADRAIN", "EARTHPOWER", "AURORAVEIL"], "LIGHTCLAY", "Hace visible el clima que el parte automático minimizó."),
        P("MAMOSWINE", 118, "ruta física", ["ICICLECRASH", "EARTHQUAKE", "ICESHARD", "ROCKSLIDE"], "LIFEORB", "Sigue huellas y banderines fuera del alcance de la antena."),
        P("FROSLASS", 119, "voz en la ventisca", ["ICEBEAM", "SHADOWBALL", "DESTINYBOND", "THUNDERBOLT"], "FOCUSSASH", "Representa la voz sintética confundida con presencia humana."),
        P("AVALUGG", 120, "refugio secundario", ["ICEHAMMER", "BODYPRESS", "RECOVER", "RAPIDSPIN"], "LEFTOVERS", "Protege al equipo sin pretender que la ruta principal siga abierta."),
        P("ARTICUNO", 122, "pronóstico con límites", ["FREEZEDRY", "HURRICANE", "ICEBEAM", "ROOST"], "NEVERMELTICE", "Cierra leyendo la tormenta sin hablar en nombre de quienes la atraviesan.")
      ]
    },
    decision: {
      question: "¿Qué función tendrá la baliza después del rescate?",
      options: ["Pronóstico transparente", "Relevo comunitario fechado"],
      immediateDifferences: ["Oren elimina la voz testimonial y publica fuente, hora y confianza.", "Nara organiza mensajes humanos que nunca se completan automáticamente."],
      laterDifferences: ["Las bases sabrán cuándo una predicción necesita exploración física.", "Los refugios compartirán rutas y estados sin una voz central que los suplante."]
    },
    reward: {
      item: "NEVERMELTICE",
      narrativeToken: "Sello del Parte Incompleto",
      globalEffect: "Atlas aprende a declarar incertidumbre y a tratar el silencio como motivo de comprobación.",
      futurePayoff: "La convergencia recibirá un pronóstico auditable o una red de relevos comunitarios.",
      whyMeaningful: "El hielo que no se derrite representa un dato persistente, pero ya no se confunde con una persona presente."
    },
    steps: ["La baliza repite un parte idéntico durante una tormenta creciente.", "Oren demuestra que la voz no contiene observaciones nuevas.", "Los banderines conducen al refugio secundario y el equipo aparece vivo.", "El jugador elige pronóstico transparente o relevo comunitario.", "La tormenta convoca a la Guardiana del Parte Invernal.", "La batalla admite Mochila, curación, derrota y regreso.", "La base corrige el protocolo y entrega el sello.", "El primer informe nuevo declara con claridad qué datos todavía faltan."]
  }
];

writeBatch(8, rows, "atlas_tier1_blueprints_batch08.json");
