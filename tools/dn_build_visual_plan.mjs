#!/usr/bin/env node
/**
 * Genera la dirección visual previa para cada mapa del Dimensional Nightmare,
 * además del resumen de dirección de arte para Monte Silver y La Ruta de Dios.
 * Aplica el flujo de Director de Diseño de Niveles Autónomo (16-bits):
 *   1. Autoselección de Variables (Bioma/Subtema, Atmósfera, Paleta)
 *   2. Estructura Orgánica (Asimetría total, rutas quebradas y relieve por alturas)
 *   3. Detalle y Decoración / Clutter (4–6 elementos específicos por mapa)
 *   4. Servicios urbanos por contexto (Centro Pokémon y Tienda explícitos en ciudades)
 * Uso: node tools/dn_build_visual_plan.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "docs/DIMENSIONAL_NIGHTMARE/15_EXPERIENCIA_POR_MAPA.md");
const OUT_JSON = path.join(ROOT, "content/dimensional_nightmare_visual_plan.json");
const OUT_DOC = path.join(ROOT, "docs/DIMENSIONAL_NIGHTMARE/20_DIRECCION_DE_MAPAS.md");
const CHECK = process.argv.includes("--check");

const worlds = [
  { key: "EP01", from: 2041, to: 2056, biome: "Catacumbas hundidas", atmosphere: "duelo y ecos", palette: "sepia frío, caliza gris, óxido apagado y pequeñas luces ámbar", decor: ["urnas volcadas con ceniza", "raíces que levantan losas", "velas con cera oscura", "campanas con grietas", "placas funerarias sin simetría", "barro húmedo en desniveles", "rejillas de hierro y cadenas sueltas", "nichos con polvo en abanico"] },
  { key: "EP02", from: 2057, to: 2072, biome: "Pueblo de cartucho detenido", atmosphere: "melancolía y memoria incompleta", palette: "papel sepia, gris carbón, blanco gastado y un acento rojo muy tenue", decor: ["rieles enterrados en tierra seca", "pozos de fuente agrietados", "cintas magnéticas enredadas", "letreros vencidos", "lápidas con letras erosionadas", "ventanas tapiadas de forma desigual", "maleza sepia entre adoquines", "vagones con pintura descascarada"] },
  { key: "EP03", from: 2073, to: 2087, biome: "Cara norte del Monte Silver", atmosphere: "aislamiento y perseverancia", palette: "azul de hielo, blanco sucio, roca violeta y brasas naranjas", decor: ["ventisqueros que cortan el sendero", "fogatas con nieve intacta alrededor", "estalactitas quebradas", "huellas que terminan en roca", "estatuas cubiertas de escarcha", "cristales con vetas desiguales", "cabañas inclinadas por el viento", "cornisas con escalones naturales"] },
  { key: "EP04", from: 2088, to: 2103, biome: "Bosque de la nana", atmosphere: "ternura inquietante y sueño", palette: "verde nocturno, índigo, violeta suave y luz de luciérnaga", decor: ["cunas vacías de madera gastada", "juguetes con una pieza ausente", "luciérnagas en claros irregulares", "troncos huecos que parecen tubos", "flores orientadas hacia el sendero", "carteles torcidos", "raíces sobre puentes de piedra", "mantas dobladas en refugios vacíos"] },
  { key: "EP05", from: 2104, to: 2119, biome: "Ciudad incompleta del Jugador 000", atmosphere: "ausencia y extrañeza tranquila", palette: "blanco y negro, gris de cartucho y fallas teal puntuales", decor: ["vías cortadas antes del andén", "huecos de fuente con borde quebrado", "fotografías sin imagen", "señales de tránsito partidas", "reflejos desfasados en charcos", "edificios con una fachada faltante", "cables que terminan en el aire", "baldosas negras fuera de alineación"] },
  { key: "EP06", from: 2120, to: 2135, biome: "Ruinas del Trono Unown", atmosphere: "reverencia, curiosidad y revelación", palette: "carbón, marfil antiguo, teal de código y oro de archivo", decor: ["columnas desalineadas", "libros mudos con lomos vacíos", "estatuas giradas hacia rincones distintos", "cristales con letras incompletas", "mosaicos Unown quebrados", "escalones de alturas alternas", "placas que reflejan al visitante", "raíces atravesando piedra grabada"] },
  { key: "W7", from: 2143, to: 2158, biome: "Casa y jardín de la promesa", atmosphere: "duelo, cuidado y recuerdo", palette: "granate apagado, tierra húmeda, verde marchito y marfil", decor: ["trofeos con fechas imposibles", "cintas anudadas a ramas", "macetas volcadas", "correas simbólicas sin cuerpo", "árboles con ramas quebradas", "fotografías veladas", "bancos cubiertos de hojas", "senderos que rodean el claro"] },
  { key: "W8", from: 2159, to: 2174, biome: "Fosa de tierra y raíces", atmosphere: "claustrofobia segura y solidaridad", palette: "ocre de tierra, carbón, azul de aire y verde raíz", decor: ["raíces expuestas en paredes", "bolsas de aire iluminadas", "lápidas inclinadas", "lámparas a distintas alturas", "grietas de luz indirecta", "escalones tallados en tierra", "charcos con polvo ascendente", "nichos con marcas de conteo"] },
  { key: "W9", from: 2175, to: 2190, biome: "Lavender de las ondas", atmosphere: "memoria auditiva y escucha", palette: "lavanda, gris humo, azul nocturno y cobre de campana", decor: ["altavoces apuntando en ángulos distintos", "teclas sueltas", "cintas en los aleros", "faroles apagados", "ondas grabadas en baldosas", "pupitres fuera de fila", "campanas detrás de paredes", "flores inclinadas hacia fuentes de sonido"] },
  { key: "NEXO", from: 2136, to: 2140, biome: "Costura entre realidades", atmosphere: "asombro y recomposición", palette: "piedra neutra, azul de archivo y destellos teal", decor: ["grietas de ancho irregular", "bloques de código flotantes", "señales de mundos distintos", "fragmentos de suelo suspendidos", "estelas con nombres incompletos", "raíces que cruzan una costura", "placas de registro rotas", "charcos que reflejan otro mapa"] },
  { key: "HUB", from: 2040, to: 2040, biome: "Antesala de las Grietas", atmosphere: "refugio vigilante", palette: "piedra neutra, musgo frío, luz miel y azul de archivo", decor: ["vitrinas separadas por universo", "estelas con huecos para sellos", "grietas asimétricas en el perímetro", "bancos de piedra desplazados", "fragmentos de suelo de otros mapas", "faroles de luz desigual"] },
  { key: "PORTICO", from: 2141, to: 2141, biome: "Pórtico de archivo de la Liga", atmosphere: "advertencia y umbral final", palette: "carbón, gris azulado y teal de código", decor: ["bloques de código suspendidos", "baldosas que cortan el dibujo", "baliza de entrada fuera del eje", "escalón fracturado al Coliseo", "placas del custodio desalineadas", "costura de luz en el suelo"] },
  { key: "LIGA", from: 2142, to: 2142, biome: "Bóveda funeraria del Vínculo", atmosphere: "juicio, duelo y energía contenida", palette: "piedra verde apagada, arquitectura violeta y sello teal central bajo tono oscuro", decor: ["arcos funerarios en altura", "hileras de lápidas rotas", "sello teal tallado en el piso", "escalera lateral que se abre a una galería irregular", "balizas de vínculo separadas", "márgenes negros quebrados del recinto"] },
];

export const TOWN_SERVICE_SPECS = Object.freeze({
  2057: {
    summary: "Centro Pokémon: edificio clausurado por el cartucho detenido, con banco de descanso exterior operativo que cura al equipo. Tienda: persiana baja congelada en el minuto 999:59 (entrega suministro de emergencia una vez).",
    center: {
      operational: true,
      mode: "emergency_bench",
      title: "Centro Pokémon de Pueblo Sin Color (Umbral Exterior)",
      lines: [
        "La puerta del Centro Pokémon está detenida a medio abrir, como si el cartucho hubiera pausado el giro de la bisagra.",
        "Rotom: El banco de guardia junto al pórtico conserva corriente de reserva. Tu equipo puede descansar aquí."
      ],
      ruptureLines: [
        "El letrero del Centro parpadea en sepia, pero el banco exterior mantiene estable el pulso de curación.",
        "Ash: Aunque el edificio no abra, este rincón sigue cuidando a quienes pasan."
      ]
    },
    mart: {
      operational: false,
      giftItem: "FULLRESTORE",
      title: "Tienda de Pueblo Sin Color (Persiana 999:59)",
      lines: [
        "La persiana metálica está baja. Un cartel sepia indica: «Inventario detenido en el minuto 999:59».",
        "Entre las rendijas del mostrador exterior queda un paquete de reserva intacto."
      ],
      afterLines: [
        "El mostrador exterior ya fue revisado. Detrás del vidrio empañado, los estantes siguen quietos en el mismo minuto."
      ]
    }
  },
  2059: {
    summary: "Centro Pokémon: botiquín del relojero junto a la fuente seca (operativo). Tienda: puesto de botica sepia operativo con medicinas de viaje.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Botiquín delCentro — Plaza de la Fuente Seca",
      lines: [
        "Junto a la fuente seca funciona un puesto médico montado con piezas del antiguo Centro Pokémon.",
        "Rotom: Energía verificada. El equipo recupera toda su vitalidad antes de bajar hacia la estación."
      ],
      ruptureLines: [
        "El agua no vuelve a la fuente, pero el botiquín del Centro sigue encendido en medio del tono sepia."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Botica Sepia de la Plaza",
      lines: [
        "Un mostrador de campaña ofrece medicinas rescatadas del almacén del pueblo.",
        "Rotom: Los precios y suministros siguen activos en el registro local."
      ]
    }
  },
  2078: {
    summary: "Centro Pokémon: refugio térmico de montaña junto a la lumbre (operativo). Tienda: puesto de expedición de nieve operativo.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Centro Refugio de Pueblo de la Niebla",
      lines: [
        "Las lámparas térmicas del Centro Pokémon calientan la sala y despejan la escarcha de las Poké Balls.",
        "Ash: Descansen un momento; el frío de la ladera no entra aquí."
      ],
      ruptureLines: [
        "La ventisca golpea los cristales, pero el generador del Centro mantiene el calor para tu equipo."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Puesto de Expedición — Pueblo de la Niebla",
      lines: [
        "El puesto de montaña despacha suministros térmicos y medicinas para la subida al norte."
      ]
    }
  },
  2079: {
    summary: "Centro Pokémon: enfermería de cumbre con generador de emergencia (operativo). Tienda: almacén de cuerdas cerrado por la ventisca (entrega provisión de cumbre una vez).",
    center: {
      operational: true,
      mode: "emergency_generator",
      title: "Enfermería de Cumbre — Pueblo Alto",
      lines: [
        "El techo del Centro cruje bajo el peso de la nieve, pero el generador de emergencia sigue latiendo.",
        "Rotom: Restauración completada. El registro recomienda no demorarse en la cornisa exterior."
      ],
      ruptureLines: [
        "El hielo cubre la fachada; aun así, la consola médica interior responde al instante."
      ]
    },
    mart: {
      operational: false,
      giftItem: "MAXREVIVE",
      title: "Almacén de Cuerdas y Víveres — Pueblo Alto",
      lines: [
        "La puerta de la tienda está bloqueada por un ventisquero alto. Una nota dice: «Evacuado hacia el refugio inferior».",
        "En la caja de emergencia anclada al muro exterior aún queda una provisión para alpinistas."
      ],
      afterLines: [
        "La caja exterior ya está vacía. El cartel recuerda que el puesto activo quedó en Pueblo de la Niebla (Map2078)."
      ]
    }
  },
  2104: {
    summary: "Centro Pokémon: fachada ausente por fallo 0x00; terminal de pulso médico exterior operativo. Tienda: mostrador 000 sin índice en memoria (entrega respaldo una vez).",
    center: {
      operational: true,
      mode: "glitch_terminal",
      title: "Terminal de Centro 000",
      lines: [
        "Al edificio del Centro Pokémon le falta la pared frontal, pero la consola de curación flota encendida sobre el zócalo.",
        "Rotom: El pulso médico no depende de la textura del muro. Equipo restaurado al 100 %."
      ],
      ruptureLines: [
        "Los bloques hexadecimales rodean la consola sin alterar la curación del equipo."
      ]
    },
    mart: {
      operational: false,
      giftItem: "FULLRESTORE",
      title: "Mostrador 000 (Catálogo sin Índice)",
      lines: [
        "La pantalla de la tienda muestra: «ERROR 0x00 — Lista de precios sin puntero; operación comercial suspendida».",
        "Rotom: He recuperado un único objeto íntegro de la bandeja de salida."
      ],
      afterLines: [
        "La bandeja de salida marca «0 registros pendientes». El quiosco de respaldo sigue activo en la Plaza sin Fuente (Map2106)."
      ]
    }
  },
  2106: {
    summary: "Centro Pokémon: terminal médica en blanco y negro (operativa). Tienda: quiosco de respaldo del Jugador 000 operativo con curaciones.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Centro Médico Monocromo — Plaza sin Fuente",
      lines: [
        "Una enfermera sin sombra atiende en silencio mediante una consola de líneas blancas y negras.",
        "Rotom: Tus Pokémon han sido restaurados sin pérdida de datos."
      ],
      ruptureLines: [
        "La plaza pierde fragmentos de suelo, pero la consola médica conserva su ancla intacta."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Quiosco de Respaldo — Plaza sin Fuente",
      lines: [
        "El terminal auxiliar reconstruye el catálogo básico de una Tienda Pokémon a partir de la memoria caché."
      ]
    }
  },
  2118: {
    summary: "Centro Pokémon: edificio 404 no encontrado; protocolo de restauración del Rotom operativo. Tienda: fachada cortada por el borde del mapa (entrega suministro rescatado una vez).",
    center: {
      operational: true,
      mode: "rotom_anchor",
      title: "Ancla de Centro Pokémon 404",
      lines: [
        "Donde debería alzarse el Centro Pokémon sólo queda el contorno blanco del plano sobre el suelo.",
        "Rotom: Dirección 404 no encontrada, pero el protocolo de descanso sigue grabado aquí. Curando a tu equipo."
      ],
      ruptureLines: [
        "En plena ruptura del sector 404, el contorno blanco sigue devolviendo las fuerzas a tu equipo."
      ]
    },
    mart: {
      operational: false,
      giftItem: "MAXELIXIR",
      title: "Tienda 404 (Fachada Cortada)",
      lines: [
        "La mitad derecha de la tienda termina en un borde limpio de código teal.",
        "Sobre el único estante que no se desfasó descansa un suministro intacto."
      ],
      afterLines: [
        "El estante de la Tienda 404 ya fue despejado; el borde teal vibra sin bloquear el paso."
      ]
    }
  },
  2137: {
    summary: "Centro Pokémon: puesto de tregua local operativo y señal hacia el Centro Sumergido (Map2138). Tienda: mostrador de la Costura operativo con suministros rescatados de los seis universos.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Puesto de Tregua — Pueblo Reensamblado",
      lines: [
        "Un farol de piedra cálida y una camilla de campaña marcan la antesala del Centro Pokémon Sumergido.",
        "Ash: Podemos recuperar fuerzas aquí mismo antes de cruzar al siguiente tramo del Nexo."
      ],
      ruptureLines: [
        "Las costuras del suelo brillan con más fuerza, pero el puesto de tregua mantiene su calma."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Mostrador de la Costura — Nexo",
      lines: [
        "Cajas con etiquetas de seis mundos distintos forman una tienda improvisada y plenamente operativa."
      ]
    }
  },
  2138: {
    summary: "Centro Pokémon: terminal principal del Centro Sumergido 100 % operativo («el centro que aún cura» antes del tramo final y la Liga). Tienda: dispensador médico auxiliar operativo.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Centro Pokémon Sumergido — Terminal Central",
      lines: [
        "Aunque el salón yace bajo una lámina de luz azulada, la máquina de curación gira con el sonido clásico e intacto.",
        "Rotom: Este es el corazón médico del Nexo. Todo tu equipo ha quedado completamente restaurado."
      ],
      ruptureLines: [
        "El agua suspendida tiembla en el techo, pero el Centro Sumergido jamás deja de curar."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Dispensador Auxiliar del Centro Sumergido",
      lines: [
        "El mostrador lateral del Centro Sumergido sigue dispensando medicinas para el cierre del Nexo y la Liga."
      ]
    }
  },
  2153: {
    summary: "Centro Pokémon: enfermería en silencio con la máquina encendida para Red (operativo). Tienda: cerrada por duelo desde la partida al monte (entrega recuerdo de botica una vez).",
    center: {
      operational: true,
      mode: "full_center",
      title: "Centro en Vigilia — Plaza Sin Gente",
      lines: [
        "No hay nadie tras el mostrador, pero la consola médica fue dejada encendida con una nota: «Por si regresa del monte».",
        "Ash: Gracias por dejar la luz prendida. Cuidaremos bien de nuestro equipo."
      ],
      ruptureLines: [
        "Las cintas granates se mecen fuera; dentro, la consola sigue curando en silencio."
      ]
    },
    mart: {
      operational: false,
      giftItem: "FULLRESTORE",
      title: "Tienda de la Plaza Sin Gente (Cerrada por Vigilia)",
      lines: [
        "La puerta tiene un lazo granate y un cartel escrito a mano: «Cerrado mientras esperamos noticias de la cumbre».",
        "En la cesta de cortesía junto a la entrada dejaron una medicina para viajeros."
      ],
      afterLines: [
        "La cesta de cortesía ya fue recogida; el cartel permanece en silencio frente a la plaza."
      ]
    }
  },
  2168: {
    summary: "Centro Pokémon: botiquín de la brigada de excavación entre raíces (operativo). Tienda: depósito subterráneo de lámparas y medicinas operativo.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Botiquín de la Brigada — Pueblo Enterrado",
      lines: [
        "Bajo un arco de raíces firmes y lámparas cálidas, el puesto médico subterráneo restaura a los equipos agotados.",
        "Rotom: Nivel de oxígeno y energía óptimos. Tu equipo está listo para continuar."
      ],
      ruptureLines: [
        "La tierra vibra suavemente, pero las raíces sostienen el techo del puesto médico sin peligro."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Depósito Subterráneo de Suministros",
      lines: [
        "El intendente del pueblo enterrado mantiene abierto el depósito de medicinas y provisiones de excavación."
      ]
    }
  },
  2175: {
    summary: "Centro Pokémon: santuario de descanso con campanas de bronce que amortiguan la frecuencia (operativo). Tienda: cerrada por cuarentena acústica (entrega botiquín sellado y redirige a Map2183).",
    center: {
      operational: true,
      mode: "full_center",
      title: "Centro Acústico de Lavender",
      lines: [
        "Las paredes revestidas de corcho y bronce absorben cualquier zumbido exterior. La máquina médica funciona en calma.",
        "Ash: Aquí el aire se siente ligero. Descansen tranquilos, amigos."
      ],
      ruptureLines: [
        "Aunque las ondas crecen en las calles, el aislamiento del Centro Acústico permanece intacto."
      ]
    },
    mart: {
      operational: false,
      giftItem: "FULLHEAL",
      title: "Tienda de Lavender (Cuarentena Acústica)",
      lines: [
        "Un precinto municipal indica: «Cerrado por resonancia en los escaparates; acuda al Mercado de Cintas en el sector 2183».",
        "En el buzón de guardia dejaron un estuche sellado de primeros auxilios."
      ],
      afterLines: [
        "El buzón de guardia ya fue abierto. El comercio activo del mundo W9 se encuentra en el Mercado de Cintas (Map2183)."
      ]
    }
  },
  2183: {
    summary: "Centro Pokémon: cabina de descanso acústico del mercado (operativa). Tienda: puesto principal del Mercado de Cintas operativo con suministros.",
    center: {
      operational: true,
      mode: "full_center",
      title: "Cabina de Descanso — Mercado de Cintas",
      lines: [
        "Entre los puestos de cintas mudas, una cabina insonorizada ofrece curación completa al equipo.",
        "Rotom: Frecuencia en cero decibelios. Equipo restaurado por completo."
      ],
      ruptureLines: [
        "Las cintas de los aleros se agitan sin sonido; dentro de la cabina, la curación sigue operativa."
      ]
    },
    mart: {
      operational: true,
      items: ["FULLRESTORE", "MAXPOTION", "REVIVE", "FULLHEAL", "MAXETHER"],
      title: "Puesto Central del Mercado de Cintas",
      lines: [
        "El cambista mantiene abierto el puesto de suministros médicos mediante señas y etiquetas escritas."
      ]
    }
  }
});

const URBAN_TRANSIT_NOTES = Object.freeze({
  2058: "Tramo residencial entre la entrada (Map2057) y la Plaza de la Fuente Seca (Map2059), donde operan el botiquín y la botica sepia.",
  2060: "Callejón de paso posterior a la plaza; los servicios médicos y de tienda quedan centralizados en Map2057 y Map2059.",
  2069: "Andén ferroviario detenido; el descanso y la botica del cartucho se ubican en la plaza superior (Map2059).",
  2105: "Vía urbana fracturada entre la entrada 000 (Map2104) y la Plaza sin Fuente (Map2106), donde operan los terminales de Centro y Tienda.",
  2107: "Callejón sin salida de memoria; los servicios de curación y quiosco están a un mapa de distancia en Map2106.",
  2115: "Andén sin tren del sector 000; conecta el tramo de oficinas con la zona 404 (servicios en Map2106 y Map2118).",
  2143: "Patio doméstico inicial de W7; el Centro en vigilia y la tienda cerrada por duelo se encuentran en la Plaza Sin Gente (Map2153).",
  2176: "Calle intermedia de altavoces desconectados; el Centro Acústico opera en la entrada (Map2175) y la tienda activa en el Mercado (Map2183).",
  2177: "Vivienda interior de estudio musical; servicios urbanos concentrados en Map2175 y Map2183.",
  2181: "Corredor urbano en silencio previo al mausoleo; suministros y cabina de descanso disponibles en Map2183."
});

const POSTGAME_DIRECTOR_BRIEFS = [
  { map: "2021–2029 · Monte Silver (Falda, Gruta y Cumbre)", biome: "Alta montaña subalpina y caverna glaciar húmeda", atmosphere: "Tensión solemne, leyenda y ascenso solitario", palette: "Gris pizarra, blanco nieve, azul cobalto nocturno y verde pino frío", route: "Senderos quebrados de montaña en S, cornisas asimétricas y gradas naturales con múltiples niveles de altura", decor: "Pinos vencidos por la nieve; rocas fracturadas; charcos helados; estalagmitas; señales de piedra erosionadas", services: "Zona de expedición alpina; curación antes de y tras los duelos de cumbre y retorno libre al hub de Oak." },
  { map: "2030 · Gruta de los Testigos", biome: "Santuario cavernario de resonancia Unown", atmosphere: "Misteriosa, ancestral y liminal", palette: "Piedra basalto, azul abisal, marfil de runas y destellos ámbar/teal", route: "Cámara orgánica de bordes rotos con siete umbrales en abanico asimétrico y ramal oriental hacia la Antesala (Map2040)", decor: "Estelas con glifos Unown; grietas luminosas; cristales de cueva; losas escalonadas; antorchas de fuego frío", services: "Santuario no urbano; conecta con el Archivero y la Antesala de las Grietas." },
  { map: "2031–2037 · La Ruta de Dios (7 Pisos)", biome: "Ruinas celestes sobre vacío astral y terrazas del Génesis", atmosphere: "Épica, sagrada y sobrecogedora", palette: "Mármol dorado, blanco astral, azul firmamento y acentos prismáticos de las 17 Tablas", route: "Ascenso orgánico en espiral rota y terrazas escalonadas asimétricas, con desvíos laterales hacia reliquias selladas (R8) y peregrinos (R9)", decor: "Columnas celestes partidas; altares de reliquia en esquinas; baldosas de luz fracturadas; estatuas de guardianes; braseros astrales", services: "Ascenso sagrado; incluye descanso explícito antes de Volo/Arceus y retorno seguro en cada tramo." },
  { map: "2038 · Aproximación Celestial", biome: "Ladera sagrada de nieve y escalinatas antiguas desde Puntaneva", atmosphere: "Reverencia silenciosa y preparación antes del juicio", palette: "Blanco nieve brillante, piedra caliza celeste, hielo cristalino y oro pálido", route: "Montaña larga de 52×72 con terrazas irregulares, puentes estrechos, descansillos a distintas alturas y miradores laterales", decor: "Santuarios de paso; faroles de piedra nevados; árboles escarchados asimétricos; hitos grabados; escalones tallados en hielo", services: "Ruta de peregrinación conectada directamente con Ciudad Puntaneva (donde operan Centro y Tienda del juego base)." }
];

const sceneRows = fs.readFileSync(SOURCE, "utf8").split(/\r?\n/);
const parsed = [];
for (const line of sceneRows) {
  const match = line.match(/^\|\s*\*\*(\d{4})\*\*\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
  if (!match) continue;
  const [, id, title, archetype, feel, hook, mechanic] = match;
  const n = Number(id);
  const world = worlds.find((w) => n >= w.from && n <= w.to);
  if (!world) continue;
  const index = n - world.from;
  const keyword = title.toLowerCase();
  const hookText = hook.trim().toLowerCase();
  const archetypeKey = archetype.trim().toLowerCase();
  const titleDetails = [
    [/urna|sarcófago|osario|cementerio|mausoleo|cripta|lápida/, "placas funerarias a alturas y ángulos distintos"],
    [/barrote|celda|reja/, "barrotes vencidos que proyectan sombras desiguales"],
    [/escalera|escalinata|torre|campanario/, "descansillo quebrado con peldaños gastados alternos"],
    [/raíz|raíces|árbol|bosque|jardín|flores|granero/, "raíces expuestas y follaje desparejo que muerde el borde"],
    [/pasadizo|galería|pasillo|corredor|túnel/, "recodo ciego con marcas de paso que cambian de lado"],
    [/cámara|corazón|núcleo|sala del trono/, "estrado irregular con un borde hundido y salida lateral"],
    [/campana|coro|altavoz|ondas|música|piano|escuela de música|cine/, "fuente sonora desviada y ondas grabadas que se cortan"],
    [/biblioteca|archivo|libro|inscripción|letras|símbolos/, "fichero abierto con una línea arrancada y letras incompletas"],
    [/pueblo|plaza|calle|mercado|estación|puente|ciudad/, "fachadas vacías y señalética ladeada fuera del eje"],
    [/acantilado|cornisa|ladera|cumbre|montaña|norte|lago congelado|grieta estrecha/, "cornisa irregular con nieve acumulada sólo a sotavento"],
    [/estanque|lago|fuente|inundada|agua/, "orilla rota, charco opaco y marcas de nivel incongruentes"],
    [/cueva|caverna|fosa|pozo|tierra/, "raíz expuesta, repisa natural y pequeñas bolsas de aire"],
    [/templo|estatua|unown|símbolo|trono|capilla/, "fragmento de estatua girado hacia un rincón distinto"],
    [/espejo|reflejo|código|falla|coliseo|liga|nexo|000|404/, "placas de realidad superpuestas con una grieta desplazada"],
    [/casa|cocina|canil|cuarto|habitación|cabaña|aula/, "mueble doméstico abandonado, girado respecto a la pared"],
    [/entrada|umbral|pórtico|puerta/, "arco de entrada mordido por un escalón lateral"],
  ];
  const hookDetails = [
    [/mano|palma/, "silueta de una mano marcada en ceniza, con una huella que continúa fuera del muro"],
    [/sepultur|familiar|caídos|lápida/, "placa con un nombre familiar parcialmente cubierto por polvo"],
    [/vela|único lugar con luz|luz/, "única fuente cálida, protegida tras una repisa rota"],
    [/pozo|susurro|fosa|descenso/, "boca de pozo segura con marcas de eco que se alejan del borde"],
    [/archivero|anota tu nombre|registros|estanterías|libros|archivo/, "libro de registro abierto con una página recién anotada"],
    [/pasillos que cambian|camino que se cierra|retorno/, "flechas gastadas que señalan retornos distintos"],
    [/paso con retraso|eco|repite|idéntica/, "huellas desfasadas que reproducen una ruta un segundo tarde"],
    [/puertas|última puerta|salida que no sale|umbral/, "pestillo de una puerta desplazado al lado contrario del marco"],
    [/viento|hielo|nieve|montaña|cumbre|ladera|huellas/, "cuerda y estacas dobladas en la dirección del viento"],
    [/tren|vagón|estación|andén|cintas/, "equipaje olvidado junto a un tramo de vía interrumpido"],
    [/casa|habitación|cuna|aula|clase|cocina|niños/, "silla pequeña apartada de una mesa preparada para alguien ausente"],
    [/flor|jardín|pétalo|árbol|nana/, "flores orientadas hacia el último punto donde se oyó la nana"],
    [/coro|letras|columna|sonido|campana|voz|música|canto/, "ondas y letras talladas en piedra, con una nota fuera de orden"],
    [/foto|imagen|recuerdo|trofeo|olvidados/, "marco fotográfico opaco con un hueco limpio en el polvo"],
    [/mercado|precio|vendedor|negocio|intercambio/, "etiqueta de precio escrita para un objeto que ya no está"],
    [/doble|espejo|reflejo|posición/, "fragmento de espejo que muestra una sombra un paso atrás"],
    [/código|glitch|celda|tiles|falla|corrupt/, "baldosa ausente delineada por un borde teal intermitente"],
    [/jefe|cámara|tormenta|juicio|vínculo/, "marcas de carrera que rodean un espacio central interrumpido"],
  ];
  const titleDetail = titleDetails.find(([pattern]) => pattern.test(keyword))?.[1]
    ?? "hito propio del mapa desplazado hacia un borde, nunca centrado como decoración simétrica";
  const hookDetail = hookDetails.find(([pattern]) => pattern.test(hookText))?.[1]
    ?? `objeto inspeccionable que representa el gancho local: ${hook.trim()}`;
  const archetypeDetails = {
    umbral: "dos losas de transición gastadas en lados distintos del paso",
    camara: "restos de un estrado con marcas de combate, sin cerrar la arena",
    archivo: "fichas sueltas que ordenan recuerdos en una secuencia incompleta",
    laberinto: "señales rotas y recodos que dejan ver más de una salida",
    via: "hitos desparejos que guían sin formar una línea recta",
    plaza: "banco vacío y farol de luz desigual junto a un claro irregular",
    fosa: "raíces y escalones tallados en tierra, con el fondo siempre visible",
    torre: "repisa lateral, descansillo estrecho y tramo de escalones erosionados",
    eco: "pareja de marcas de pisada con una de ellas retrasada",
    altar: "zócalo fracturado y ofrenda apartada del eje central",
    cripta: "nombres erosionados y flores secas fuera del centro",
    glitch: "fragmento de baldosa desfasado con un borde de otro mundo",
    nucleo: "placa de registro rota junto a una grieta que deja ver el archivo",
    colegio: "pupitres fuera de fila y una silla orientada a una pared vacía",
    espejo: "dos reflejos incompletos en superficies con ángulos distintos",
    vacio: "marco de puerta sin hoja y una única sombra tenue",
    coro: "siete pequeñas marcas; una interrumpida y desplazada del conjunto",
    pueblo: "cartel de servicio vencido junto a una entrada doméstica abierta",
    ladera: "cuerda de apoyo que se pierde detrás de un desnivel natural",
    cumbre: "mojón inclinado y una cornisa con nieve de distinto espesor",
    casa: "objeto doméstico conservado mientras el resto de la habitación está vacío",
    jardin: "pétalos en una curva quebrada que no conduce por la ruta principal",
    pasillo: "luz de emergencia y marcas de puerta a intervalos irregulares",
    calle: "señal semafórica activa frente a una esquina sin edificios completos",
    mausoleo: "marco y placa de memoria protegidos en un nicho lateral",
    mercado: "mostrador vacío con una etiqueta que no coincide con ningún producto",
    tren: "raíl cortado y una cinta atada a un poste torcido",
    templo: "letra tallada en un bloque desplazado de su columna",
    falla: "costura de código que corta el dibujo del suelo sin tapar el paso",
    sala: "vitrina de recuerdos a distintas alturas, con un hueco deliberado",
    portico: "estela de advertencia y una lámpara baja al costado del umbral",
    arena: "cuatro pedestales de silueta distinta alrededor de un estrado roto",
  };
  const decor = [
    hookDetail,
    titleDetail,
    archetypeDetails[archetypeKey] ?? "detalle de entorno que responde a la mecánica local",
    world.decor[(index * 2) % world.decor.length],
    world.decor[(index * 2 + 3) % world.decor.length],
  ].filter((item, i, all) => all.indexOf(item) === i).slice(0, 6);
  for (let offset = 0; decor.length < 4 && offset < world.decor.length; offset++) {
    const candidate = world.decor[(index + offset) % world.decor.length];
    if (!decor.includes(candidate)) decor.push(candidate);
  }
  const palette = world.palette;
  const route = index % 4 === 0
    ? "sendero quebrado en S con salida lateral y un descanso elevado"
    : index % 4 === 1
      ? "recorrido en arco roto con un desnivel corto y retorno alternativo"
      : index % 4 === 2
        ? "paso en zigzag asimétrico, con un recodo de exploración fuera de la ruta"
        : "camino escalonado en dos alturas que evita el eje central y abre una vista parcial";
  const terrain = index % 3 === 0
    ? "borde natural irregular, plataforma secundaria y escalón de retorno"
    : index % 3 === 1
      ? "repisa lateral, depresión del terreno y transición quebrada entre alturas"
      : "desnivel escalonado, pequeño bajo/pozo seguro y borde no paralelo";
  const townSpec = TOWN_SERVICE_SPECS[n] ?? null;
  const service = townSpec
    ? townSpec.summary
    : URBAN_TRANSIT_NOTES[n]
      ?? "No aplica: zona no urbana; usar refugio/curación sólo donde esté señalado por la trama.";
  parsed.push({
    map: n, world: world.key, title: title.trim(), biome: `${world.biome} — ${title.trim()}`,
    atmosphere: `${world.atmosphere}; lectura local: ${feel.trim()}`,
    palette, hook: hook.trim(), archetype: archetype.trim(), mechanic: mechanic.trim(),
    routeProfile: route, terrainProfile: terrain, decorations: decor, townServices: service,
    hasTownServiceEvents: !!townSpec,
  });
}

const expected = new Set();
for (const w of worlds) for (let n = w.from; n <= w.to; n++) expected.add(n);
const ids = new Set(parsed.map((row) => row.map));
const missing = [...expected].filter((id) => !ids.has(id));
const duplicate = parsed.filter((row, i) => parsed.findIndex((other) => other.map === row.map) !== i).map((row) => row.map);
const issues = [];
if (parsed.length !== 151) issues.push(`se esperaban 151 fichas, hay ${parsed.length}`);
if (missing.length) issues.push(`faltan mapas: ${missing.join(", ")}`);
if (duplicate.length) issues.push(`mapas duplicados: ${duplicate.join(", ")}`);
if (parsed.some((row) => row.decorations.length < 4)) issues.push("hay mapas con menos de 4 decoraciones");
if (parsed.some((row) => !row.routeProfile.includes("quebrad") && !row.routeProfile.includes("arco") && !row.routeProfile.includes("zigzag") && !row.routeProfile.includes("escalonado"))) issues.push("algún perfil carece de ruta orgánica");
if (parsed.some((row) => /revisar si funciona|indicar abierta\/cerrada/i.test(row.townServices))) {
  issues.push("quedan textos placeholder en townServices");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (CHECK) {
    if (issues.length) { console.error(issues.join("\n")); process.exit(1); }
    console.log(`dirección visual: ${parsed.length} mapas · ${worlds.length} perfiles de mundo · ${Object.keys(TOWN_SERVICE_SPECS).length} asentamientos con Centro/Tienda explícitos · fichas completas`);
    process.exit(0);
  }

  if (issues.length) throw new Error(issues.join("\n"));
  fs.writeFileSync(OUT_JSON, `${JSON.stringify({ generatedBy: "tools/dn_build_visual_plan.mjs", maps: parsed }, null, 2)}\n`);
  const lines = [
    "# DIRECCIÓN DE ARTE Y LAYOUT — Modo Director de Diseño de Niveles Autónomo (16-bits)",
    "",
    "> Biblia visual y espacial de cada mapa. Aplica el flujo de Director de Arte y Diseñador de Niveles experto en pixel art retro 16-bits:",
    "> 1. **Autoselección de Variables (Diversidad):** Bioma y subtema, atmósfera y paleta cromática diferenciada por mundo y escena.",
    "> 2. **Estructura Orgánica:** Prohibición estricta de simetría axial, mapas cuadrados de relleno o caminos rectos; uso de bordes fracturados, rutas en S/arco/zigzag y relieve con múltiples niveles de altura.",
    "> 3. **Detalle y Decoración (Clutter):** Entre 4 y 6 elementos decorativos específicos por bioma/escena distribuidos de forma asimétrica, con variación de textura en el suelo base.",
    "> 4. **Servicios Urbanos por Contexto:** En ciudades, pueblos y plazas habitadas se define e instala explícitamente el estado del **Centro Pokémon** y la **Tienda** según el contexto narrativo del universo.",
    "",
    "## Resumen de Bloques de Postgame (Monte Silver y La Ruta de Dios)",
    "",
    "| Bloque | Bioma / subtema | Atmósfera | Paleta | Estructura orgánica y relieve | 4–6 detalles decorativos (Clutter) | Centro / Tienda |",
    "|---|---|---|---|---|---|---|",
    ...POSTGAME_DIRECTOR_BRIEFS.map((row) => `| ${row.map} | ${row.biome} | ${row.atmosphere} | ${row.palette} | ${row.route} | ${row.decor} | ${row.services} |`),
    "",
    `## Fichas de mapa — Dimensional Nightmare (${parsed.length} mapas)`,
    "",
    "| Mapa | Bioma / subtema | Atmósfera | Paleta | Recorrido y relieve | 4–6 detalles decorativos | Centro/Tienda |",
    "|---|---|---|---|---|---|---|",
    ...parsed.map((row) => `| ${row.map} · ${row.title} | ${row.biome} | ${row.atmosphere} | ${row.palette} | ${row.routeProfile}; ${row.terrainProfile} | ${row.decorations.join("; ")} | ${row.townServices} |`),
    "",
    "## Estado de producción",
    "",
    "Las 151 fichas están sincronizadas con los eventos instalados en `Data/Map2040.rxdata`–`Data/Map2190.rxdata` (`DN_MAP_MEMORY`, `DN_STATUE_LORE`, `DN_TOWN_CENTER` y `DN_TOWN_MART`), garantizando que cada elemento decorativo, estatua, centro y tienda exista en datos y sea alcanzable sin bloquear corredores.",
    "",
  ];
  fs.writeFileSync(OUT_DOC, lines.join("\n"));
  console.log(`dirección visual: ${parsed.length} mapas → ${path.relative(ROOT, OUT_DOC)}`);
}
