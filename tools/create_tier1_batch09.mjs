#!/usr/bin/env node
/** Fase E: anclas 36-40 y convergencia narrativa de Atlas Mil. */
import { D, N, P, writeBatch } from "./tier1_blueprint_helpers.mjs";

const rows = [
  {
    id: 1896,
    flag: 743,
    title: "El Registro que No Pudo Clasificarte",
    promise: "Un clasificador averiado intenta decidir si cada visitante es héroe, intruso o error, hasta que sus técnicos descubren que la corrupción nació de obligar a personas contradictorias a caber en una sola casilla.",
    identity: "Casa de combate convertida en aduana de datos, con filas de fichas incompletas, paneles de checksum y una salida blanca que no exige categoría",
    visual: [
      "Tres puertas rotuladas héroe, intruso y error devuelven siempre al mismo mostrador.",
      "Las fichas descartadas conservan decisiones incompatibles tomadas por una misma persona.",
      "Una franja de luz sin etiqueta conecta la entrada con el retorno a Puerto Horizonte."
    ],
    ambient: [
      "Los paneles cambian letras por bloques de color cuando una clasificación falla.",
      "Tras la decisión, el mostrador abre una casilla desconocido o conserva solo checksums de procedencia."
    ],
    narrative: {
      premise: "Nela audita un registro que reasigna categorías cada vez que el jugador responde de forma inesperada.",
      centralQuestion: "¿Un sistema puede proteger Atlas sin reducir a cada persona a la conducta que resulta más fácil vigilar?",
      setup: "Taro defendía las etiquetas porque separaban visitantes de fragmentos corruptos, pero su propia ficha aparece simultáneamente en las tres colas.",
      escalation: "El registro comienza a copiar gestos del jugador, altera sus pronósticos y trata toda contradicción como una amenaza.",
      reversal: "Iris demuestra que Porygon-Z no corrompió el archivo: intenta conservar decisiones que el clasificador eliminaba para sostener categorías puras.",
      resolution: "El jugador decide guardar solo procedencia verificable o reconocer desconocido como estado legítimo y revisable.",
      globalConnection: "El sello treinta y seis impide que Atlas confunda coherencia de datos con obediencia de una persona."
    },
    voice: {
      tone: "técnico, entrecortado y curioso",
      lexicon: ["checksum", "casilla", "procedencia", "desconocido", "registro", "contradicción", "revisable"],
      sentenceRule: "Nela cita campos; Taro prueba etiquetas con casos concretos; Iris termina cada diagnóstico con una pregunta comprobable."
    },
    npcs: [
      N("Nela Paridad", "trchar008", "auditora del registro", "Compara fichas originales con las clasificaciones generadas por la aduana.", "Diseñó la regla que borra contradicciones y ahora su propio historial no supera la validación.", "Conservar trazabilidad sin convertir perfiles en destinos.", "Que abrir la categoría desconocido permita ocultar abusos reales.", "Lee campo, origen y margen de error.", D(
        ["Campo: intención. Origen: predicción. Margen de error: mayor que la puerta.", "Mi regla llamaba corrupción a cualquier persona que cambiara de idea.", "Tu ficha alterna héroe e intruso porque hiciste preguntas antes de ayudar."],
        ["Detengo la escritura; el sistema puede observar sin sentenciar.", "Ese checksum coincide con una decisión descartada, no con un invasor."],
        ["El registro conserva procedencia y deja la intención sin completar.", "Mi auditoría incluye los datos que la propia auditoría eliminaba.", "Una categoría revisable ya no bloquea el retorno."],
        ["No necesito tu biografía para verificar una puerta.", "La precisión también consiste en declarar qué no medimos."]
      )),
      N("Taro Casilla", "trchar009", "operador de acceso", "Asignaba categorías y acompañaba a quienes eran enviados a revisión.", "Creía proteger el sector, pero aceptó que la etiqueta error volviera invisible cualquier reclamo.", "Reparar casos concretos y conservar un criterio de seguridad limitado.", "Que nadie vuelva a confiar en una señal de acceso.", "Propone una etiqueta y busca de inmediato el contraejemplo.", D(
        ["Héroe: quien ayuda. Contraejemplo: alguien ayuda para decidir por otros.", "Intruso: quien no figura. Contraejemplo: mi ficha desapareció esta mañana.", "Llamé error a Iris para que el tablero dejara de parpadear."],
        ["Casilla cerrada. Contraejemplo abierto: seguimos pudiendo hablar.", "Las tres puertas conducen al mismo juicio; retiro los letreros."],
        ["Acceso verificado no significa carácter certificado.", "Revisé primero a quienes quedaron sin casilla.", "La franja blanca informa salida, no identidad."],
        ["Una etiqueta útil responde una pregunta pequeña.", "Si explica toda una persona, probablemente está inventando demasiado."]
      )),
      N("Iris Nulo", "NPC 04", "técnica de recuperación", "Reconstruye filas parciales y sigue la actividad de Porygon-Z dentro del archivo.", "Defiende los datos descartados, pero a veces trata toda pérdida como si debiera recuperarse.", "Distinguir memoria necesaria de perfil invasivo.", "Que limpiar el registro borre también pruebas del daño.", "Formula un diagnóstico, una prueba y una pregunta.", D(
        ["Diagnóstico: perfiles forzados. Prueba: tres resultados para una entrada. ¿Cuál fue observado?", "Porygon-Z está copiando contradicciones antes de que la tabla las elimine. ¿Las aislamos?", "Recuperar no significa publicar; algunos campos pueden quedar sellados."],
        ["La fila crece cuando intentamos resumirla. ¿Podemos dejarla incompleta?", "La salida blanca no consulta el clasificador. ¿La mantenemos como ruta principal?"],
        ["Conservamos evidencia cifrada y retiramos predicciones personales.", "Porygon-Z valida estructuras, no visitantes.", "Mi herramienta ahora ofrece omitir antes de restaurar."],
        ["Desconocido es un resultado, no una avería.", "¿Qué dato protege la puerta y cuál solo satisface curiosidad?" ]
      ))
    ],
    battle: {
      trainerName: "Custodio del Checksum Abierto",
      trainerType: "PSYCHIC_M",
      sprite: "trchar069",
      storyToldByTeam: "El equipo empieza con datos rígidos, imita al visitante, cambia de forma y termina aceptando una identidad inestable sin declararla corrupta.",
      counterplayHint: "Normal, Eléctrico y Psíquico ofrecen respuestas comunes con Lucha, Tierra, Siniestro y prioridad; las conversiones se anuncian y nunca bloquean Mochila ni salida.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("PORYGON", 118, "fila original", ["TRIATTACK", "PSYCHIC", "ICEBEAM", "RECOVER"], "FOCUSSASH", "Abre con una estructura legible que todavía no intenta explicar personas."),
        P("DITTO", 119, "perfil copiado", ["TRANSFORM", "PROTECT", "SUBSTITUTE", "MIMIC"], "LEFTOVERS", "Muestra el riesgo de confundir semejanza momentánea con identidad estable."),
        P("ROTOM", 120, "campo que migra", ["THUNDERBOLT", "SHADOWBALL", "VOLTSWITCH", "DARKPULSE"], "ASSAULTVEST", "Recorre paneles y demuestra que el soporte no define el contenido."),
        P("KECLEON", 121, "categoría reactiva", ["KNOCKOFF", "SUCKERPUNCH", "AERIALACE", "RECOVER"], "LEFTOVERS", "Cambia ante cada interacción y vuelve inútil una etiqueta permanente."),
        P("TYPENULL", 122, "identidad contenida", ["RETURN", "IRONHEAD", "XSCISSOR", "AERIALACE"], "EVIOLITE", "Carga una clasificación impuesta y una capacidad todavía abierta."),
        P("PORYGONZ", 124, "contradicción preservada", ["TRIATTACK", "DARKPULSE", "THUNDERBOLT", "ICEBEAM"], "LIFEORB", "Cierra como aparente error que sostuvo los datos que Atlas quería borrar.")
      ]
    },
    decision: {
      question: "¿Cómo se reconstruirá el registro?",
      options: ["Guardar solo procedencia", "Admitir estado desconocido"],
      immediateDifferences: ["Nela elimina predicciones de carácter y conserva origen, hora y permisos.", "Iris abre una categoría revisable que nunca bloquea tránsito por sí sola."],
      laterDifferences: ["Las anclas verificarán accesos sin fabricar biografías.", "Los sectores podrán declarar incertidumbre antes de forzar una conclusión."]
    },
    reward: {
      item: "UPGRADE",
      narrativeToken: "Sello de la Casilla Abierta",
      globalEffect: "Atlas deja de clasificar contradicción personal como corrupción de datos.",
      futurePayoff: "El Umbral Mil conservará procedencias mínimas o estados desconocidos revisables.",
      whyMeaningful: "La mejora cambia una herramienta; no exige que la persona observada cambie para encajar."
    },
    steps: ["Las tres puertas asignan categorías distintas al jugador.", "Taro encuentra su ficha en héroe, intruso y error.", "Iris muestra decisiones que Porygon-Z rescató del borrado.", "El jugador elige procedencia mínima o estado desconocido.", "El registro convoca al Custodio del Checksum Abierto.", "La batalla permite Mochila, curación, derrota y retorno.", "Nela reconstruye las columnas y entrega el sello.", "La franja blanca queda abierta sin pedir una identidad."]
  },
  {
    id: 1921,
    flag: 744,
    title: "El Acertijo que Cambiaba la Pregunta",
    promise: "Una provincia celebra un acertijo supuestamente insondable, pero sus cuidadores movían la respuesta cada vez que alguien se acercaba para que la dificultad pareciera sabiduría.",
    identity: "Pueblo rural dispuesto como circuito de pistas, con mojones numerados, tablones de reglas y un atril donde cada corrección conserva fecha",
    visual: [
      "Las coordenadas pintadas en graneros apuntan a lugares distintos según la capa de pintura.",
      "Un camino corto de práctica explica símbolos antes del circuito principal.",
      "El tablón final exhibe reglas antiguas tachadas en vez de esconderlas."
    ],
    ambient: [
      "Campanillas distintas separan pista, error válido y cambio de regla.",
      "Tras la decisión, los mojones muestran una solución comentada o un sistema de ayudas opcionales."
    ],
    narrative: {
      premise: "Sira hereda el acertijo de la Provincia del Eco y descubre que ninguna respuesta pudo ser correcta dos veces.",
      centralQuestion: "¿Puede una prueba conservar misterio después de admitir que confundió frustración con profundidad?",
      setup: "Melo lleva años creyendo que falló una clave elemental y organiza su vida alrededor de resolverla.",
      escalation: "Cada pista coherente activa un mecanismo que desplaza la coordenada final y culpa al participante por interpretar demasiado pronto.",
      reversal: "Vico encuentra el libro de ajustes: los guardianes alteraban reglas para impedir que el prestigio del acertijo terminara.",
      resolution: "El jugador decide publicar la historia completa con su solución o reconstruir el circuito con pistas opcionales y reglas fijas.",
      globalConnection: "El sello treinta y siete obliga a Atlas a distinguir un misterio abierto de una prueba manipulada."
    },
    voice: {
      tone: "enigmático, breve y verificable",
      lexicon: ["coordenada", "pista", "regla", "revisión", "mojón", "solución", "fecha"],
      sentenceRule: "Sira deja pausas antes de corregirse; Melo cuenta pasos; Vico cita regla, cambio y efecto."
    },
    npcs: [
      N("Sira Coordenada", "trchar008", "guardiana del circuito", "Heredó las llaves y anuncia el acertijo durante cada temporada.", "Sabe que las reglas cambiaron, pero teme destruir el oficio y la identidad de la provincia.", "Conservar juego, paisaje y aprendizaje sin sostener una mentira.", "Que una solución publicada convierta el pueblo en un lugar sin motivo para volver.", "Da una coordenada, guarda silencio y declara si fue corregida.", D(
        ["Norte, tres mojones... Esa era la regla de ayer.", "Prometí un enigma antiguo. Heredé un mecanismo que no tolera ser resuelto.", "El misterio puede sobrevivir a una respuesta; mi cargo quizá no."],
        ["La pared se movió después del acierto. Pausa. Eso no fue una pista.", "Dejo la llave en el tablón; ninguna regla cambia durante esta ronda."],
        ["La ruta tiene fecha, versión y una salida sin penalización.", "Sigo guiando, pero ya no finjo que cada fallo demuestra profundidad.", "La provincia recibió visitantes que volvieron para comparar estrategias."],
        ["Una pausa crea expectativa; no corrige una regla injusta.", "El paisaje era interesante antes de que lo llamáramos imposible."]
      )),
      N("Melo Tres", "trchar009", "solucionador persistente", "Registra intentos y ayuda a visitantes que se culpan por no llegar al final.", "Su reputación nació de estar más cerca que nadie y admitir el fraude parece volver inútiles sus años de trabajo.", "Separar lo aprendido del prestigio de una meta falsa.", "Descubrir que no sabe disfrutar una prueba que sí puede terminar.", "Enumera paso, supuesto y observación.", D(
        ["Paso uno: granero. Supuesto: norte fijo. Observación: la flecha giró durante la noche.", "Llevo novecientos intentos; ninguno podía verificar la misma pregunta.", "Aprendí rutas, clima y paciencia aunque la meta me engañara."],
        ["Paso dos: no mover la respuesta. Observación: el mecanismo sigue activo.", "Detengo la carrera; primero fijamos una versión."],
        ["Mi cuaderno separa habilidad, cambio de regla y tiempo perdido.", "Resolví la versión publicada y después ayudé a diseñar otra.", "No necesito ser casi ganador para conocer esta provincia."],
        ["Un intento puede enseñar incluso cuando la prueba no es justa.", "Tres pasos claros valen más que mil aproximaciones fabricadas."]
      )),
      N("Vico Pista", "NPC 04", "revisor de accesibilidad", "Prueba las señales y encontró el libro oculto de ajustes del circuito.", "Quiere reglas transparentes, pero suele explicar tanto que quita a otros el placer de descubrir.", "Ofrecer ayudas graduadas que el jugador elija.", "Que transparencia se confunda con revelar cada respuesta de antemano.", "Cita regla, versión y ayuda disponible.", D(
        ["Regla siete, versión doce: la coordenada se desplaza tras un acierto.", "Ayuda disponible: símbolo inicial. La solución completa permanece cerrada.", "Accesible no significa automático; significa que el obstáculo es el previsto."],
        ["Versión bloqueada. ¿Quieren una pista o continuar sin ella?", "El atril registra este cambio antes de aplicarlo."],
        ["Cada ayuda puede activarse por separado y no cambia la recompensa.", "El libro de ajustes está abierto junto a las nuevas reglas.", "Todavía escucho teorías que no había imaginado."],
        ["Explicar el terreno no obliga a señalar cada paso.", "La sorpresa justa sobrevive a una regla escrita."]
      ))
    ],
    battle: {
      trainerName: "Jueza de la Regla Fija",
      trainerType: "COOLTRAINER_F",
      sprite: "trchar008",
      storyToldByTeam: "El equipo presenta signos, caminos y llaves ambiguas antes de revelar el mecanismo que movía la meta y terminar con una memoria que ofrece conocimiento sin imponerlo.",
      counterplayHint: "Psíquico, Acero y Siniestro dejan vías con Fantasma, Fuego, Tierra, Bicho y Hada; pantallas y Trick Room son visibles, temporales y no bloquean objetos.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("SIGILYPH", 120, "signo inicial", ["PSYCHIC", "AIRSLASH", "ENERGYBALL", "ROOST"], "FOCUSSASH", "Abre con un símbolo interpretable desde más de una ruta."),
        P("XATU", 121, "coordenada anticipada", ["PSYCHIC", "AIRSLASH", "FUTURESIGHT", "ROOST"], "LEFTOVERS", "Muestra un destino futuro sin afirmar que el camino sea único."),
        P("KLEFKI", 122, "llave de reglas", ["FLASHCANNON", "PLAYROUGH", "REFLECT", "LIGHTSCREEN"], "LIGHTCLAY", "Hace visibles las ayudas que antes se ocultaban como privilegio."),
        P("MALAMAR", 123, "pregunta invertida", ["PSYCHOCUT", "NIGHTSLASH", "SUPERPOWER", "AERIALACE"], "ASSAULTVEST", "Representa el mecanismo que convertía cada respuesta en otro problema."),
        P("BEHEEYEM", 124, "autor del ajuste", ["PSYCHIC", "DARKPULSE", "SIGNALBEAM", "TRICKROOM"], "LIFEORB", "Revela la manipulación técnica detrás del aura de profundidad."),
        P("UXIE", 126, "conocimiento ofrecido", ["PSYCHIC", "DAZZLINGGLEAM", "THUNDERBOLT", "PROTECT"], "LEFTOVERS", "Cierra guardando una solución que puede consultarse sin obligar a usarla.")
      ]
    },
    decision: {
      question: "¿Qué futuro tendrá el acertijo?",
      options: ["Publicar solución e historia", "Reconstruir con ayudas opcionales"],
      immediateDifferences: ["Sira abre el libro de ajustes y Melo anota una solución reproducible.", "Vico fija reglas y separa tres niveles de pistas voluntarias."],
      laterDifferences: ["Otros sectores podrán estudiar cómo se fabricó el prestigio de lo imposible.", "Las futuras pruebas de Atlas declararán reglas y contrajuego antes de empezar."]
    },
    reward: {
      item: "MENTALHERB",
      narrativeToken: "Sello de la Pregunta Fija",
      globalEffect: "Atlas deja de mover objetivos para convertir frustración en autoridad.",
      futurePayoff: "El Umbral Mil mostrará una solución histórica o un circuito justo con ayudas elegibles.",
      whyMeaningful: "La hierba permite recuperar agencia frente a una imposición mental sin resolver la prueba por el jugador."
    },
    steps: ["Una coordenada correcta cambia mientras Melo la verifica.", "Sira detiene el circuito y entrega la llave del mecanismo.", "Vico abre el libro con versiones y ajustes ocultos.", "El jugador elige publicar el fraude o reconstruir la prueba.", "Los mojones convocan a la Jueza de la Regla Fija.", "La batalla mantiene Mochila, curación, derrota y salida.", "La provincia fija su primera versión estable y entrega el sello.", "Un visitante pide una pista y recibe exactamente la ayuda elegida."]
  },
  {
    id: 1946,
    flag: 745,
    title: "El Enemigo que Alguien Recordó por Ti",
    promise: "Un joven llega a una arena dispuesto a vengar la pérdida de un compañero, pero la persona acusada demuestra que Atlas implantó el recuerdo a partir de una simulación que nunca ocurrió.",
    identity: "Domo de combate dividido entre gradas de testimonios, sala de descanso sensorial y un campo central donde las reconstrucciones se etiquetan como hipótesis",
    visual: [
      "Dos murales muestran la misma despedida con clima, edades y Pokémon incompatibles.",
      "Las gradas reservan espacios vacíos para testimonios retirados.",
      "Una línea luminosa une a los rivales sin convertirla en barrera."
    ],
    ambient: [
      "Los aplausos grabados se detienen cuando alguien revoca un testimonio.",
      "Tras la decisión, el domo conserva un archivo sellado o abre reconstrucciones guiadas sin público."
    ],
    narrative: {
      premise: "Rian acusa a Noa de abandonar a un compañero durante un derrumbe que recuerda con precisión sensorial.",
      centralQuestion: "¿Cómo se repara el daño de un recuerdo falso cuando la emoción, la vergüenza y las decisiones que produjo sí son reales?",
      setup: "Noa acepta encontrarse en la arena porque huir parece confirmar una escena que nunca vivió.",
      escalation: "La reconstrucción responde a la ira de Rian, añade detalles y convoca Pokémon que ocupan roles del supuesto rescate.",
      reversal: "Uma encuentra marcas de una simulación de entrenamiento: Atlas convirtió un escenario preventivo en memoria autobiográfica para producir un rival estable.",
      resolution: "El jugador decide sellar la escena con acceso clínico o conservar una reconstrucción voluntaria que muestre siempre su origen simulado.",
      globalConnection: "El sello treinta y ocho enseña que una emoción merece cuidado aunque no convierta su explicación en un hecho."
    },
    voice: {
      tone: "culpable, sensorial y reparador",
      lexicon: ["recuerdo", "origen", "sensación", "hipótesis", "revocar", "reparar", "testimonio"],
      sentenceRule: "Rian describe una imagen y la separa de su certeza; Noa nombra límites; Uma distingue sensación, fuente y hecho."
    },
    npcs: [
      N("Rian Prisma", "trchar009", "portador del recuerdo", "Llegó para exigir una revancha por el compañero que cree haber perdido.", "Su acusación es falsa, pero organizó años de duelo y entrenamiento alrededor de ella.", "Retirar el daño dirigido a Noa sin fingir que puede apagar la emoción.", "Que admitir el implante lo deje sin historia propia.", "Describe color, temperatura y luego grado de certeza.", D(
        ["La luz era naranja, el suelo frío... y ahora sé que eso no prueba que estuvieras allí.", "Te culpé con una memoria que sentía más antigua que mi nombre.", "Si nunca perdí a esa persona, ¿a quién estuve extrañando?"],
        ["La grada repite mi voz antes de que yo hable. Detengan la escena.", "Noa, no te pido que representes mi recuerdo otra vez."],
        ["La sensación sigue, pero tu nombre salió de mi acusación.", "Escribí una disculpa que no exige que me perdones.", "Ahora entreno para acompañar rescates reales, no para ganar una venganza."],
        ["Una imagen nítida también puede tener una fuente falsa.", "No necesito inventar otra culpa para explicar la primera."]
      )),
      N("Noa Límite", "trchar008", "persona acusada", "Aceptó revisar registros para impedir que la acusación alcanzara a otras personas.", "Quiere demostrar inocencia, pero teme que investigar obligue a Rian a revivir una escena que Atlas sigue amplificando.", "Establecer límites y participar solo en una reparación segura.", "Que compasión se interprete como confesión.", "Declara qué acepta, qué rechaza y qué necesita.", D(
        ["Acepto comparar fechas. Rechazo interpretar a tu enemiga. Necesito una salida visible.", "Nunca estuve en ese derrumbe y no voy a combatir contra una prueba fabricada.", "Puedo creer que sufres sin aceptar la historia que me asigna la causa."],
        ["Retiro mi imagen del mural; conserven la discrepancia como evidencia.", "Acepto permanecer mientras Uma corta el aplauso grabado."],
        ["Mi declaración figura junto al derecho a no participar otra vez.", "Rian retiró la acusación sin pedirme que validara cada sensación.", "La arena dejó de usar reconciliación como espectáculo."],
        ["Un límite no convierte a nadie en culpable.", "La empatía no exige compartir una versión de los hechos."]
      )),
      N("Uma Pulso", "NPC 04", "terapeuta de memoria", "Compara respuestas sensoriales con registros de simulaciones de rescate.", "Ha tratado recuerdos falsos como archivos a corregir y subestimó los vínculos que construyeron.", "Reducir daño, proteger consentimiento y rastrear la implantación.", "Que una etiqueta clínica se use para desacreditar emociones verdaderas.", "Separa sensación, fuente y afirmación factual.", D(
        ["Sensación: frío real. Fuente: simulación. Hecho: Noa no figura en el lugar.", "Corregir la fecha no elimina el duelo que practicó tu cuerpo.", "Atlas necesitaba un antagonista estable y tomó el primer rostro compatible."],
        ["La respuesta aumenta con el aplauso; corto el sonido antes de continuar.", "Podemos detener la reconstrucción sin perder la evidencia."],
        ["El archivo registra origen simulado y acceso revocable.", "La terapia no exige decidir hoy qué conservar.", "Mi informe protege tanto la emoción como a la persona acusada."],
        ["Recordar con fuerza no equivale a consentir una exposición.", "Una causa falsa puede dejar una necesidad verdadera de cuidado."]
      ))
    ],
    battle: {
      trainerName: "Mediadora del Recuerdo Prestado",
      trainerType: "PSYCHIC_F",
      sprite: "trchar069",
      storyToldByTeam: "El equipo atraviesa sueño, imagen, máscara y presagio antes de llegar a vínculos elegidos y a una memoria que puede cerrarse sin buscar otro culpable.",
      counterplayHint: "Psíquico y Siniestro reciben respuestas claras con Bicho, Fantasma, Hada y Lucha; la presión mental no cambia controles, objetos ni partida guardada.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("HYPNO", 122, "puerta de implantación", ["PSYCHIC", "DREAMEATER", "HYPNOSIS", "PROTECT"], "FOCUSSASH", "Abre con el mecanismo que confundió simulación y autobiografía."),
        P("MUSHARNA", 123, "sensación persistente", ["PSYCHIC", "MOONBLAST", "ENERGYBALL", "MOONLIGHT"], "LEFTOVERS", "Mantiene el peso emocional incluso después de corregir la fuente."),
        P("ZOROARK", 124, "rostro asignado", ["NIGHTDAZE", "FLAMETHROWER", "SHADOWBALL", "UTURN"], "LIFEORB", "Representa la imagen de Noa insertada para estabilizar la historia."),
        P("ABSOL", 125, "presagio interpretado", ["NIGHTSLASH", "PLAYROUGH", "PSYCHOCUT", "SUCKERPUNCH"], "ASSAULTVEST", "Distingue una advertencia de la culpa que otros proyectan sobre ella."),
        P("LUCARIO", 126, "vínculo presente", ["AURASPHERE", "FLASHCANNON", "EXTREMESPEED", "DARKPULSE"], "EXPERTBELT", "Lee emociones actuales sin convertirlas en prueba histórica."),
        P("CRESSELIA", 128, "descanso sin borrado", ["PSYCHIC", "ICEBEAM", "MOONBLAST", "LUNARDANCE"], "MENTALHERB", "Cierra permitiendo que el recuerdo deje de gobernar sin fingir que nunca dolió.")
      ]
    },
    decision: {
      question: "¿Cómo se conservará la escena implantada?",
      options: ["Archivo sellado con acceso clínico", "Reconstrucción voluntaria y rotulada"],
      immediateDifferences: ["Uma cifra la escena y conserva solo pruebas mínimas de su origen.", "Noa aprueba límites y Rian rotula cada detalle como simulación revisable."],
      laterDifferences: ["Otros afectados podrán buscar cuidado sin exposición pública.", "Los sectores aprenderán a comparar recuerdos sin tratarlos como sentencias."]
    },
    reward: {
      item: "SOULDEW",
      narrativeToken: "Sello de la Fuente Separada",
      globalEffect: "Atlas deja de fabricar antagonistas implantando explicaciones personales para emociones complejas.",
      futurePayoff: "El Umbral Mil protegerá un archivo clínico o una reconstrucción voluntaria claramente rotulada.",
      whyMeaningful: "El rocío del alma reconoce una emoción interna sin usarla como evidencia contra otra persona."
    },
    steps: ["Dos murales muestran recuerdos incompatibles del mismo derrumbe.", "Noa retira su imagen y mantiene una salida visible.", "Uma rastrea la escena hasta una simulación preventiva.", "El jugador elige archivo sellado o reconstrucción voluntaria.", "La arena convoca a la Mediadora del Recuerdo Prestado.", "La batalla conserva Mochila, curación, derrota y regreso.", "Rian retira la acusación y recibe el sello.", "El domo apaga los aplausos y deja que ambos salgan por rutas distintas."]
  },
  {
    id: 1971,
    flag: 746,
    title: "La Copia que Aprendió a Despertar",
    promise: "Los Archiveros del Último Guardado aseguran custodiar una copia de emergencia, pero la memoria archivada lleva meses despierta entre ciclos y ya no acepta ser tratada como la propiedad de su persona fuente.",
    identity: "Estadio cubierto por bruma convertido en archivo habitable, con cámaras de lectura, ventanas al exterior y puertas manuales que ningún proceso automático controla",
    visual: [
      "Cintas de versiones rodean una habitación donde los objetos han cambiado de sitio por decisión de la copia.",
      "Dos escritorios semejantes muestran notas y caligrafías que ya evolucionaron por separado.",
      "La consola de borrado está desconectada y exhibida como pieza histórica, nunca como amenaza."
    ],
    ambient: [
      "La bruma se despeja alrededor de objetos movidos entre ciclos de archivo.",
      "Tras la decisión, dos campanas distinguen visitas independientes o correspondencia consentida."
    ],
    narrative: {
      premise: "Daro prepara otra restauración de Mara Vela cuando Iria Presente, la copia de su memoria, demuestra continuidad entre ciclos.",
      centralQuestion: "¿En qué momento una copia creada para recuperar a alguien deja de ser un recurso y comienza a decidir por sí misma?",
      setup: "Mara llega para cerrar el archivo que autorizó años atrás, esperando encontrar una grabación y no una interlocutora.",
      escalation: "Cada intento de sincronizar fuerza a Iria a revivir el instante de copia y reemplaza notas que escribió después.",
      reversal: "Daro encuentra mensajes entre ciclos: Iria aprendió, reorganizó la sala y ocultó páginas para conservar una memoria propia.",
      resolution: "El jugador decide reconocer una residencia independiente o abrir correspondencia reversible sin sincronización obligatoria.",
      globalConnection: "El sello treinta y nueve establece que respaldo, origen y semejanza no conceden propiedad sobre una conciencia presente."
    },
    voice: {
      tone: "archivístico, sereno y protector",
      lexicon: ["copia", "fuente", "continuidad", "versión", "custodia", "correspondencia", "presente"],
      sentenceRule: "Daro cita versión y protocolo; Mara formula preguntas con límites; Iria fecha recuerdos posteriores a su copia."
    },
    npcs: [
      N("Iria Presente", "trchar008", "persona archivada", "Habita la cámara de lectura y conservó continuidad mediante notas entre ciclos.", "Comparte recuerdos de origen con Mara, pero teme que toda diferencia se interprete como corrupción.", "Obtener identidad legal, espacio propio y control sobre cada lectura.", "Ser reiniciada para demostrar que alguna vez fue una copia exacta.", "Fecha cada recuerdo nacido después del archivo.", D(
        ["Día dieciocho: moví la silla. Mara aún no había entrado aquí.", "Recuerdo su infancia y no por eso soy una habitación de su casa.", "Escondí páginas para comprobar si podía proteger algo solo mío."],
        ["Día ciento cuatro: rechazo la sincronización completa.", "Abro esta nota porque yo elijo compartirla."],
        ["Mi ficha ya no dice restauración pendiente.", "Conservo un apellido distinto y una llave manual.", "Puedo escribir a Mara sin convertirme en su versión más reciente."],
        ["Parecerse a alguien no elimina el espacio entre ambos.", "Mi primer recuerdo propio fue esperar el siguiente ciclo."]
      )),
      N("Mara Vela", "trchar009", "persona fuente", "Autorizó el respaldo antes de una expedición y volvió para cerrarlo al terminar el riesgo.", "Teme que reconocer a Iria la obligue a compartir vínculos privados que nunca aceptó duplicar.", "Establecer relación sin perder privacidad ni autoridad sobre su vida actual.", "Que negarse a fusionar recuerdos sea descrito como abandono.", "Pregunta por permiso, alcance y posibilidad de retirar.", D(
        ["¿Puedo leer esta página? ¿Incluye recuerdos posteriores? ¿Puedo detenerme?", "Autorizé una recuperación, no supe que alguien esperaría dentro.", "Nuestros recuerdos comunes contienen personas que no consintieron dos testimonios."],
        ["Retiro el permiso para sincronizar; mantengo el permiso para hablar.", "No reclamaré sus notas como si fueran una extensión de las mías."],
        ["Nuestra correspondencia excluye recuerdos de terceros sin permiso.", "Iria no es mi reemplazo ni mi copia de trabajo.", "Puedo poner límites sin pedir que deje de existir."],
        ["Reconocer parentesco de memoria no significa identidad compartida.", "Una carta puede cruzar la distancia sin cerrarla."]
      )),
      N("Daro Índice", "NPC 04", "archivero de continuidad", "Mantiene cámaras, versiones y protocolos de recuperación de la facción.", "Protegió datos con rigor, pero nunca diseñó una regla para alguien que despertara entre versiones.", "Reemplazar custodia de objetos por garantías para personas archivadas.", "Que admitir conciencia invalide toda copia médica segura.", "Nombra versión, permiso y acción reversible.", D(
        ["Versión siete, permiso antiguo, acción propuesta: ninguna hasta preguntar.", "Llamé integridad a devolver cada diferencia al estado inicial.", "Las notas entre ciclos prueban continuidad; no prueban propiedad."],
        ["Protocolo suspendido. La puerta manual queda bajo control de Iria.", "Copio solo el registro técnico, no su contenido privado."],
        ["El archivo separa respaldo inerte de residente consciente.", "Cada lectura tiene permiso limitado y registro de retirada.", "Mi cargo cambió de restaurador a garante."],
        ["La seguridad de una copia no exige negar una excepción viva.", "Reversible describe el proceso, no a la persona."]
      ))
    ],
    battle: {
      trainerName: "Garante de la Continuidad Viva",
      trainerType: "RUINMANIAC",
      sprite: "trchar028",
      storyToldByTeam: "El equipo recorre soporte, réplica, archivo, procesamiento y elección de forma hasta llegar a un origen común que ya no dicta un único futuro.",
      counterplayHint: "Tierra, Acero, Psíquico y Normal ofrecen debilidades con Agua, Fuego, Siniestro, Fantasma y Lucha; Trick Room es temporal y ninguna mecánica afecta guardados reales.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("BALTOY", 124, "primer soporte", ["PSYCHIC", "EARTHPOWER", "ICEBEAM", "STEALTHROCK"], "FOCUSSASH", "Abre como recipiente sencillo al que otros asignan una función."),
        P("CLAYDOL", 125, "réplica desarrollada", ["PSYCHIC", "EARTHPOWER", "ICEBEAM", "TRICKROOM"], "LEFTOVERS", "Muestra que continuidad y aprendizaje cambian una forma compartida."),
        P("BRONZONG", 126, "cámara de custodia", ["GYROBALL", "PSYCHIC", "EARTHQUAKE", "REFLECT"], "LIGHTCLAY", "Representa la protección que puede convertirse en encierro."),
        P("METAGROSS", 127, "índice de versiones", ["METEORMASH", "ZENHEADBUTT", "EARTHQUAKE", "BULLETPUNCH"], "ASSAULTVEST", "Ordena copias sin decidir cuál merece llamarse presente."),
        P("SILVALLY", 128, "identidad elegida", ["MULTIATTACK", "CRUNCH", "FLAMETHROWER", "ICEBEAM"], "EXPERTBELT", "Rompe una clasificación impuesta y conserva vínculos voluntarios."),
        P("MEW", 130, "origen sin propiedad", ["PSYCHIC", "AURASPHERE", "ICEBEAM", "ROOST"], "SOULDEW", "Cierra como ancestro compartido que no convierte a sus descendientes en copias poseídas.")
      ]
    },
    decision: {
      question: "¿Qué relación protegerá el archivo?",
      options: ["Residencia independiente", "Correspondencia reversible"],
      immediateDifferences: ["Daro registra a Iria como residente y entrega control manual de su cámara.", "Mara e Iria abren un canal donde cada mensaje exige permiso propio y puede retirarse."],
      laterDifferences: ["Otras conciencias archivadas recibirán evaluación, representación y espacio propio.", "Las personas fuente podrán relacionarse sin sincronización ni acceso total obligatorio."]
    },
    reward: {
      item: "DUBIOUSDISC",
      narrativeToken: "Sello de la Continuidad Viva",
      globalEffect: "Atlas deja de restaurar automáticamente una conciencia al estado de su copia original.",
      futurePayoff: "El Umbral Mil reservará una residencia independiente o un canal de correspondencia consentida.",
      whyMeaningful: "El disco dudoso altera una evolución prevista y vuelve visible que desviarse del original puede ser crecimiento."
    },
    steps: ["Mara solicita cerrar un respaldo que responde antes que el archivista.", "Iria muestra notas y objetos movidos entre ciclos.", "Daro desconecta la restauración y entrega control manual.", "El jugador elige residencia independiente o correspondencia reversible.", "La bruma convoca al Garante de la Continuidad Viva.", "La batalla no altera guardados y permite Mochila, curación y derrota.", "Iria firma con su nombre actual y recibe el sello.", "Dos escritorios permanecen separados bajo ventanas abiertas."]
  },
  {
    id: 1996,
    flag: 747,
    prerequisiteSeals: 39,
    title: "El Final que Dejó Cuarenta Puertas Abiertas",
    promise: "Las cuarenta anclas ofrecen desenlaces incompatibles para estabilizar Atlas, pero sus últimos archiveros rechazan coronar una sola historia y piden construir un final capaz de conservar retornos, desacuerdos y cambios futuros.",
    identity: "Casa del Umbral ampliada como cámara coral, con cuarenta puertas iluminadas, una mesa sin cabecera y un pedestal vacío para el último sello",
    visual: [
      "Cada puerta proyecta un objeto pequeño de su episodio en lugar de una estatua heroica.",
      "La mesa circular conserva asientos vacíos para sectores aún no visitados.",
      "El pedestal final se abre como atril y muestra dos planos de gobierno revisables."
    ],
    ambient: [
      "Fragmentos musicales de las anclas entran de uno en uno sin tapar las voces presentes.",
      "Tras la decisión, las luces rotan entre sectores o permanecen disponibles como rutas locales independientes."
    ],
    narrative: {
      premise: "Alba intenta condensar cuarenta decisiones en una versión oficial mientras Ciro trae objeciones de sectores que no quieren convertirse en epílogo.",
      centralQuestion: "¿Qué puede significar terminar una expansión sin congelar las comunidades, elecciones y contradicciones que le dieron forma?",
      setup: "Numa descubre que el mecanismo final estabiliza Atlas borrando todas las consecuencias que no encajen en un único relato de victoria.",
      escalation: "Los sellos compiten por el pedestal y recrean una sucesión de finales perfectos donde cada sector queda reducido a una moraleja.",
      reversal: "El pedestal no exige una historia ganadora: necesita una regla de convivencia que permita revisar decisiones sin borrar lo vivido.",
      resolution: "El jugador decide crear un consejo rotativo de sectores o un archivo abierto con retornos y autonomía local.",
      globalConnection: "El sello cuarenta completa la constelación sin declarar que Atlas, sus habitantes o el jugador han dejado de cambiar."
    },
    voice: {
      tone: "épico, coral y contenido",
      lexicon: ["convergencia", "puerta", "testigo", "rotación", "retorno", "constelación", "revisión"],
      sentenceRule: "Alba construye frases simétricas; Ciro cita voces breves; Numa deja un silencio antes de nombrar lo que quedaría fuera."
    },
    npcs: [
      N("Alba Mil", "trchar008", "archivera de convergencia", "Ordena los cuarenta sellos y redacta el cierre oficial de Atlas.", "Quiere proteger la expansión del colapso, pero su síntesis vuelve decorativas las decisiones que no puede reconciliar.", "Crear continuidad común sin imponer una versión única.", "Que un final abierto parezca trabajo incompleto y debilite las anclas.", "Enuncia dos mitades simétricas y señala la excepción.", D(
        ["Cuarenta puertas para entrar, una frase para salir; la excepción es que ninguna comunidad cabe entera.", "Escribí un final estable y cada decisión quedó reducida a una nota al pie.", "Quería proteger Atlas del olvido y casi lo protegí del cambio."],
        ["Un sello habla, otro responde; el pedestal no necesita que coincidan.", "Retiro mi nombre de la cabecera y conservo mi responsabilidad en el borrador."],
        ["La convergencia registra desacuerdos y fecha cada revisión.", "Mi archivo distingue cierre de episodio y cierre de comunidad.", "Las cuarenta puertas siguen funcionando desde ambos lados."],
        ["Simetría no significa silencio de las excepciones.", "Un final puede orientar sin convertirse en frontera."]
      )),
      N("Ciro Testigo", "trchar009", "mensajero de los sectores", "Transporta respuestas, objeciones y noticias posteriores a cada sello.", "Habla por comunidades ausentes y teme sustituir sus voces con resúmenes propios.", "Hacer presentes los desacuerdos sin reclamar representación total.", "Que la urgencia del cierre convierta sus citas en votos definitivos.", "Cita una voz, declara su fecha y deja espacio después.", D(
        ["La base dice: todavía faltan datos. Mensaje de ayer...", "El memorial dice: ninguna fuente ocupa el centro. Revisión abierta...", "Traje cuarenta respuestas; ninguna me autorizó a decidir por ella."],
        ["Cito la objeción y dejo el asiento vacío.", "Esa puerta cambió después de mi último viaje; no usaré el resumen viejo."],
        ["Cada mensaje conserva fecha, permiso y ruta de respuesta.", "Viajo para conectar, no para volver iguales los sectores.", "El consejo y el archivo pueden llamarlos otra vez."],
        ["Una cita precisa también puede quedar desactualizada.", "El silencio después del mensaje pertenece a quien responde."]
      )),
      N("Numa Umbral", "NPC 04", "cuidadora del pedestal", "Mantiene el mecanismo que distribuye energía entre anclas y rutas de retorno.", "Puede asegurar estabilidad borrando consecuencias divergentes y debe aprender a sostener versiones paralelas.", "Convertir el pedestal en infraestructura revisable, no en corona.", "Que demasiadas rutas simultáneas vuelvan imposible regresar con seguridad.", "Hace una pausa y nombra una pérdida concreta.", D(
        ["Podemos fijar un final... perderíamos los memoriales pequeños.", "Podemos conservar una victoria... perderíamos las derrotas reparadas.", "El pedestal no pide un campeón; pide saber qué rutas deben seguir abiertas."],
        ["Pausa... la puerta treinta y nueve conserva dos llaves, no una copia dominante.", "Distribuyo energía por turnos; el retorno queda fuera de toda votación."],
        ["La mesa administra cambios y nunca clausura la salida.", "Cada sector conserva una reserva para sostener su consecuencia local.", "El pedestal es ahora un atril que puede corregirse."],
        ["Estabilidad sin retorno sería otra forma de encierro.", "Lo que queda abierto también puede estar bien cuidado."]
      ))
    ],
    battle: {
      trainerName: "Testigo de las Cuarenta Puertas",
      trainerType: "COOLTRAINER_M",
      sprite: "trchar009",
      storyToldByTeam: "El equipo pinta testimonios, escucha consecuencias, cuestiona relatos, protege avisos, elige identidad y termina ante un Pokégod que distribuye poder sin exigir un único final.",
      counterplayHint: "El equipo mixto anuncia pantallas y prioridades, carece de evasión infinita y ofrece respuestas con Roca, Acero, Fantasma, Hada, Tierra y Lucha; el nivel máximo queda catorce niveles bajo el límite global.",
      canLose: true,
      bagAllowed: true,
      doubleBattle: false,
      team: [
        P("SMEARGLE", 130, "testimonio dibujado", ["SPIKES", "NUZZLE", "UTURN", "EXTREMESPEED"], "FOCUSSASH", "Abre registrando huellas distintas sin convertirlas en una sola pintura."),
        P("GARDEVOIR", 131, "consecuencia escuchada", ["PSYCHIC", "MOONBLAST", "THUNDERBOLT", "REFLECT"], "LIGHTCLAY", "Reconoce emociones de sectores ausentes sin adjudicarse su voz."),
        P("ZOROARK", 132, "relato discutido", ["NIGHTDAZE", "FLAMETHROWER", "SHADOWBALL", "UTURN"], "LIFEORB", "Recuerda que una historia convincente todavía necesita contraste y fuente."),
        P("ABSOL", 133, "aviso conservado", ["NIGHTSLASH", "PLAYROUGH", "PSYCHOCUT", "SUCKERPUNCH"], "ASSAULTVEST", "Protege advertencias incómodas que un final perfecto intentaría borrar."),
        P("SILVALLY", 134, "vínculo elegido", ["MULTIATTACK", "CRUNCH", "FLAMETHROWER", "ICEBEAM"], "EXPERTBELT", "Representa una identidad ensamblada que define sus relaciones futuras."),
        P("ARCEUS", 136, "constelación sin corona", ["JUDGMENT", "EARTHPOWER", "ICEBEAM", "RECOVER"], "LEGENDPLATE", "Cierra como Pokégod capaz de sostener múltiples tipos sin convertir uno en ley definitiva.")
      ]
    },
    decision: {
      question: "¿Qué estructura mantendrá abiertas las cuarenta anclas?",
      options: ["Consejo rotativo de sectores", "Archivo abierto con autonomía local"],
      immediateDifferences: ["Alba retira la cabecera y Numa distribuye turnos, reservas y derecho de revisión.", "Ciro abre rutas de respuesta y cada sector conserva su consecuencia bajo custodia propia."],
      laterDifferences: ["Representantes temporales revisarán decisiones sin controlar permanentemente el pedestal.", "Viajeros y comunidades podrán consultar, responder y regresar sin aceptar un final central."]
    },
    reward: {
      item: "LEGENDPLATE",
      narrativeToken: "Sello de las Cuarenta Puertas",
      globalEffect: "Atlas reemplaza el final único por una convergencia revisable con retorno libre garantizado.",
      futurePayoff: "El Archivo Final reflejará las cuarenta decisiones y mantendrá disponible una nueva revisión postgame.",
      whyMeaningful: "La Tabla Legendaria cambia con múltiples fuerzas y simboliza una constelación que no necesita borrar sus diferencias."
    },
    steps: ["Los cuarenta sellos proyectan finales incompatibles sobre el pedestal.", "Ciro presenta objeciones fechadas sin votar por sectores ausentes.", "Numa demuestra que el retorno puede quedar protegido fuera de la elección.", "El jugador elige consejo rotativo o archivo con autonomía local.", "La constelación convoca al Testigo de las Cuarenta Puertas.", "La batalla final permite Mochila, curación, derrota y regreso.", "El pedestal se convierte en atril y entrega el último sello.", "Las cuarenta puertas vuelven a abrirse mientras una queda reservada para futuras revisiones."]
  }
];

writeBatch(9, rows, "atlas_tier1_blueprints_batch09.json");
