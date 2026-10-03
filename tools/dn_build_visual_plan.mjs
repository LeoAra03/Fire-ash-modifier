#!/usr/bin/env node
/**
 * Genera la dirección visual previa para cada mapa del Dimensional Nightmare.
 * No modifica Map*.rxdata; deja una ficha explícita antes de cualquier pase de layout.
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
  const isTown = /pueblo|ciudad|plaza|calle|mercado|casa|estación/i.test(title);
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
  const service = isTown
    ? /centro|pueblo|ciudad|plaza/i.test(title)
      ? "Centro Pokémon: revisar si funciona según la historia; si está cerrado, dejar señal y refugio narrativo. Tienda: indicar abierta/cerrada por contexto, nunca dejarla implícita."
      : "No se fuerza Centro/Tienda en una calle, estación o vivienda; si el asentamiento tiene servicios, se documentan en el mapa social más cercano."
    : "No aplica: zona no urbana; usar refugio/curación sólo donde esté señalado por la trama.";
  parsed.push({
    map: n, world: world.key, title: title.trim(), biome: `${world.biome} — ${title.trim()}`,
    atmosphere: `${world.atmosphere}; lectura local: ${feel.trim()}`,
    palette, hook: hook.trim(), archetype: archetype.trim(), mechanic: mechanic.trim(),
    routeProfile: route, terrainProfile: terrain, decorations: decor, townServices: service,
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

if (CHECK) {
  if (issues.length) { console.error(issues.join("\n")); process.exit(1); }
  console.log(`dirección visual: ${parsed.length} mapas · ${worlds.length} perfiles de mundo · fichas completas`);
  process.exit(0);
}

if (issues.length) throw new Error(issues.join("\n"));
fs.writeFileSync(OUT_JSON, `${JSON.stringify({ generatedBy: "tools/dn_build_visual_plan.mjs", maps: parsed }, null, 2)}\n`);
const lines = [
  "# DIRECCIÓN DE ARTE Y LAYOUT — Dimensional Nightmare",
  "",
  "> Fichas previas de cada mapa. Son una guía de producción y de auditoría, no sustituyen la validación visual en el motor.",
  "> Cada fila aplica el resumen solicitado: bioma/subtema, atmósfera, paleta, recorrido, relieve y decoración.",
  "",
  "## Reglas de composición",
  "",
  "- Nada de simetría deliberada, mapas cuadrados de relleno ni ruta principal en línea recta.",
  "- El rectángulo técnico de RMXP no obliga a componer en rectángulo: bordes de escena, terreno y decoración deben quebrarse de forma legible.",
  "- Cada escena usa 4–6 detalles, tres alturas/planos visuales cuando el tileset lo permita y al menos un desvío de exploración que no bloquee la salida.",
  "- El Centro Pokémon y la Tienda se explicitan en asentamientos; su estado responde a la historia.",
  "- Las rutas obligatorias conservan transitabilidad; el detalle nunca tapa transferencias, NPCs, objetos o jefes.",
  "- Se mantiene lenguaje visual Fire Ash/RPG Maker XP: paleta compacta por mundo, tiles compatibles y sin collage de estilos.",
  "",
  `## Fichas de mapa (${parsed.length})`,
  "",
  "| Mapa | Bioma / subtema | Atmósfera | Paleta | Recorrido y relieve | 4–6 detalles decorativos | Centro/Tienda |",
  "|---|---|---|---|---|---|---|",
  ...parsed.map((row) => `| ${row.map} · ${row.title} | ${row.biome} | ${row.atmosphere} | ${row.palette} | ${row.routeProfile}; ${row.terrainProfile} | ${row.decorations.join("; ")} | ${row.townServices} |`),
  "",
  "## Estado de producción",
  "",
  "Estas fichas fijan las decisiones artísticas antes de regenerar/refinar layouts. La auditoría de transitabilidad confirma datos, no belleza: el pase visual final y el comportamiento de alturas se confirman en la prueba manual del usuario.",
  "",
];
fs.writeFileSync(OUT_DOC, lines.join("\n"));
console.log(`dirección visual: ${parsed.length} mapas → ${path.relative(ROOT, OUT_DOC)}`);
