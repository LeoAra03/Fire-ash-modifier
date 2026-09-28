#!/usr/bin/env node
/**
 * Genera el catálogo de reglas locales de los Ecos Tier 3 sin regla.
 *
 * Atlas Mil tiene 840 Ecos (mapas 1023–2020 excluyendo anclas y rutas). La mitad
 * ya contiene un evento `Atlas desafío`; los otros 420 conservan baliza, retorno
 * y navegación, pero les falta la regla local breve que exige la jerarquía:
 * identificar el eco, declarar su regla y ofrecer una microdecisión reversible.
 *
 * Este generador deriva las 420 reglas de 14 familias de anomalía × 3 variantes
 * de contrajuego, enriquecidas con el eco, su mapa de origen y el sector. No
 * copia textos de Horizontes ni de las 500 aventuras.
 *
 * Uso: node tools/create_atlas_tier3_rules.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8"));
const challengeMaps = new Set(catalog.suggestions.map((entry) => Number(entry.mapId)));

const families = [
  { key: "geografía", anomaly: "La geografía {src} respira: los pasos se alargan o se encogen según quién mire el mapa.", variants: [
    ["Medir dos veces", ["Contar los pasos de ida antes de confiar en la vuelta.", "Marcar el borde que cambió con una piedra propia.", "No correr mientras el eco respire."], "Quien sigue la regla cruza sin fatiga; quien corre vuelve al inicio del sendero."],
    ["Andar al revés", ["Recorrer el tramo mirando hacia atrás.", "Pisar solo las baldosas que no brillaron antes.", "Detenerse cuando el eco inspire."], "El sendero se estabiliza para quien camina al revés y se encorva para quien persigue la salida."],
    ["Esperar la marea", ["No entrar mientras el borde suba.", "Usar las piedras altas como medida.", "Salir antes de que el mapa bostece."], "La pausa abre el paso corto; la prisa devuelve al visitante a la entrada."]] },
  { key: "gravedad", anomaly: "La gravedad de {src} está prestada y reclama devolución en el tramo más estrecho.", variants: [
    ["Pesar la mochila", ["Vaciar un bolsillo antes del tramo.", "Caminar pegado a la pared pesada.", "No saltar aunque el suelo lo pida."], "El tramo acepta a quien llega ligero y empuja cuesta arriba a quien cargó de más."],
    ["Prestar lo justo", ["Tomar gravedad prestada solo para el salto.", "Devolverla pisando la baldosa de yeso.", "Nunca dos préstamos seguidos."], "La baldosa devuelve impulso a quien devuelve la gravedad y hunde a quien la guarda."],
    ["Cruzar cargado", ["Atravesar con la mochila cerrada y lenta.", "Respirar contando cuatro por cada paso.", "Saludar al eco antes de entrar."], "La devolución llega suave para quien pide permiso y brusca para quien se cuela."]] },
  { key: "tiempo", anomaly: "Los pasos en {src} vuelven tarde, como ecos de un minuto que ya pasó.", variants: [
    ["Eco con retraso", ["Esperar el retorno de cada paso.", "No repetir el paso hasta oír su eco.", "Marcar el ritmo con un dedo."], "El ritmo lento despeja el camino; la repetición rápida multiplica los pasos falsos."],
    ["Cuenta atrás", ["Contar diez antes de cada cruce.", "Hablar solo cuando el eco calle.", "Guardar las preguntas para la salida."], "La cuenta fija abre el cruce; la conversación despierta ecos dormidos en el techo."],
    ["Regreso programado", ["Entrar cuando el reloj marque cuarto.", "Salir antes de la media.", "No ajustar el reloj del eco."], "La ventana horaria despeja la niebla de pasos y la trampa de tiempo se retrae."]] },
  { key: "clima", anomaly: "El clima de {src} viene fragmentado: llueve en una calle y hace sol en la siguiente baldosa.", variants: [
    ["Paraguas de baldosa", ["Elegir tramos secos y medir el húmedo.", "No correr bajo la lluvia de baldosa.", "Dejar el paraguas en el borde seco."], "El tramo seco se ensancha para quien lo pide y el chubasco se cierra sobre la prisa."],
    ["Leer el cielo", ["Observar la nube antes de girar.", "Cambiar de tramo cuando relampaguee la baldosa vecina.", "Volver si el cielo se reparte en tres."], "La lectura anticipada abre paso seco; el avance a ciegas empapa el mapa y lo vuelve resbaladizo."],
    ["Tormenta en conserva", ["Atravesar durante la tregua anunciada.", "Guardar la chaqueta para el último tramo.", "No recoger agua de ecos."], "La tregua devuelve el tramo largo; la codicia del agua llama a la segunda tormenta."]] },
  { key: "sombras", anomaly: "Las sombras en {src} se duplican y solo una de ellas sigue al visitante.", variants: [
    ["Sombra de relleno", ["Mirar cuál sombra imita tarde.", "Pisar la luz, nunca la copia.", "No saludar a la sombra extra."], "La luz se abre para quien descubre la copia; saludar a la falsa desorienta el cruce."],
    ["Cuenta de sombras", ["Contar las sombras antes de girar.", "Detenerse cuando aparezca una de más.", "Retroceder sin dar la espalda."], "El conteo exacto revela el pasillo bueno; avanzar con tres sombras devuelve a la esquina."],
    ["Sombras en fila", ["Caminar cuando las sombras marquen compás.", "Esperar el turno de la propia.", "No cortar la fila del eco."], "La fila desfila hacia la salida; quien corta se queda sin sombra y sin dirección."]] },
  { key: "luz", anomaly: "La luz de {src} recuerda dónde estuvo ayer y se niega a iluminar lo nuevo.", variants: [
    ["Encender lo propio", ["Traer luz prestada de la baliza.", "No tapar la luz vieja del eco.", "Marcar lo que la luz ignora."], "La luz prestada cubre el hueco nuevo; tapar la vieja apaga todo el tramo."],
    ["Fotografiar la sombra", ["Anotar dónde cae la luz al mediodía.", "Avanzar por lo que ya fue iluminado.", "Dejar lo oscuro para el regreso."], "La memoria lumínica dibuja el paso firme; forzar la oscuridad deshace el mapa."],
    ["Prestar luminosidad", ["Encender la linterna en el umbral.", "Apagarla al salir para que el eco descanse.", "No llevarse la luz del tramo."], "El tramo agradece el préstamo con un atajo; la luz sustraida vuelve al anochecer como niebla."]] },
  { key: "coordenadas", anomaly: "Las coordenadas de {src} mienten con educación: la X señala bien y la Y se equivoca a propósito.", variants: [
    ["Dos brújulas", ["Cruzar lectura de X con lectura de Y.", "Confiar en la que titubea menos.", "Anotar el error antes de corregir."], "La doble lectura fija la posición real; fiarse de una sola eje desplaza el destino."],
    ["Preguntar al poste", ["Leer los postes de kilómetro en orden.", "Ignorar la flecha nueva sin marca.", "Volver al poste 0 si algo baila."], "Los postes viejos ordenan la ruta; la flecha nueva conduce al mapa vecino del eco."],
    ["Coordenada honesta", ["Escribir la posición propia en el suelo.", "Compararla con la del mapa.", "Corregir el mapa, no el suelo."], "La anotación personal prevalece sobre el error y el mapa aprende la corrección."]] },
  { key: "pasos", anomaly: "En {src} se usan pasos prestados: los pies ajenos cruzan antes que los propios.", variants: [
    ["Paso de prestado", ["Ceder el paso a la fila de ecos.", "Pisar cuando la fila repose.", "Devolver el paso con una reverencia."], "La cortesía ordena la fila y abre el pasillo; la competencia con los ecos bloquea el tramo."],
    ["Andar propio", ["Marcar el ritmo con el propio compás.", "No imitar el paso de nadie.", "Descansar cuando los ecos crucen."], "El paso propio despeja el camino; imitar la fila multiplica los desvíos."],
    ["Prestar un paso", ["Ofrecer un paso al eco cansado.", "Caminar de a dos con el invitado.", "Cobrar el paso prestado al salir."], "El paso ofrecido se devuelve doble en el puente; la usura del paso deja al visitante parado."]] },
  { key: "silencio", anomaly: "El silencio de {src} es activo: escucha, ordena y se enfada con el ruido.", variants: [
    ["Silencio pactado", ["Hablar solo en los círculos de piedra.", "Pisar sin arrastrar.", "Agradecer el silencio al salir."], "Los círculos reciben conversación; el ruido fuera de ellos cierra el paso corto."],
    ["Escuchar primero", ["Parar a oír el eco antes de cada giro.", "No repetir sonidos ajenos.", "Responder solo si preguntan."], "La escucha revela el giro bueno; el eco de sonidos robados tapa la salida."],
    ["Silencio prestado", ["Pedir prestado un minuto de silencio.", "Devolverlo limpio, sin quejas.", "Guardar el resto para la baliza."], "El préstamo ordena la sala; el silencio mal devuelto regresa como rumor que desorienta."]] },
  { key: "materiales", anomaly: "Los materiales de {src} recuerdan su forma anterior y se niegan a la reforma.", variants: [
    ["Alinear memoria", ["Pedir a la piedra su forma vieja.", "No forzar la nueva.", "Reformar solo con permiso del material."], "La memoria alineada refuerza el puente; la reforma forzada parte la pasarela."],
    ["Prestar textura", ["Llevar una pieza prestada del taller.", "Intercambiarla por la pieza cansada.", "Devolver textura al salir."], "El trueque refuerza el paso; la pieza sin devolver se agrieta con quien la lleva."],
    ["Escuchar la veta", ["Seguir la veta de la madera.", "Parar cuando la veta se quiebre.", "No clavar nada en el eco."], "La veta conduce al tramo firme; los clavos del visitante despiertan la reforma del eco."]] },
  { key: "compases", anomaly: "Los compases de {src} se desfasan: la música va por delante de las baldosas.", variants: [
    ["Compás de contratiempo", ["Pisar en contratiempo deliberado.", "Seguir al tambor lento.", "No adelantarse a la melodía."], "El contratiempo abre la escalera; el adelanto cae en los tramos sin baldosa."],
    ["Cantar despacio", ["Marcar el compás con voz propia.", "Esperar el eco del tambor.", "Cambiar de tono en los cruces."], "La voz propia sincroniza el suelo; el eco del tambor ajeno arrastra a la trampa rítmica."],
    ["Silencio de compás", ["Pisar solo en los silencios.", "Guardar la melodía para la baliza.", "Aplaudir al terminar el tramo."], "Los silencios pisan firme; las notas sueltas convierten el suelo en tambor y en hueco."]] },
  { key: "señales", anomaly: "Las señales de {src} responden tarde: la flecha de hoy avisa del camino de ayer.", variants: [
    ["Señal de retraso", ["Leer la señal con un día de atraso.", "Confiar en la señal borrada.", "Actualizar solo la flecha rota."], "El atraso corregido señala la salida real; la flecha nueva desvía al tramo de ayer."],
    ["Preguntar a la señal", ["Repetir la pregunta hasta la segunda respuesta.", "Descartar la primera.", "Anotar el margen de error."], "La segunda respuesta corrige la ruta; la primera confunde la bifurcación con un muro."],
    ["Responder tarde", ["Caminar con respuesta diferida.", "Detenerse hasta que la señal confirme.", "No presionar el poste."], "La señal confirmada abre el paso; el poste presionado repite la respuesta equivocada."]] },
  { key: "mapas", anomaly: "Los mapas de {src} se corrigen solos y el trazo nuevo tapa el camino aprendido.", variants: [
    ["Mapa de capas", ["Leer el trazo viejo bajo el nuevo.", "Corregir con lápiz, no con memoria.", "Guardar las dos versiones."], "Las dos capas enseñan el desvío bueno; confiar en la última corrección devuelve al inicio."],
    ["Copia de viaje", ["Copiar el mapa antes de entrar.", "Comparar copia y original al salir.", "No entregar la copia al eco."], "La copia protege la ruta aprendida; el eco que recibe la copia redibuja el tramo entero."],
    ["Trazo de retorno", ["Dibujar el regreso antes de avanzar.", "Respetar el trazo propio.", "Borrar solo con borrador del eco."], "El trazo de retorno se mantiene; borrarlo a mano desorienta ambas direcciones."]] },
  { key: "nombres", anomaly: "Los nombres de {src} cambian de asiento: la etiqueta de un lugar se pasea al vecino.", variants: [
    ["Etiqueta atada", ["Atar la etiqueta con cordel propio.", "Leer el lugar, no su nombre.", "Cambiar de asiento solo con testigo."], "La etiqueta atada regresa a su sitio; la etiqueta libre se sienta en la salida y la esconde."],
    ["Nombre de prestado", ["Prestar un nombre al lugar sin etiqueta.", "Recuperarlo antes del cruce.", "No firmar nombres ajenos."], "El préstamo ordena el mapa; el nombre sin recuperar se pasea y enreda las señales."],
    ["Llamar por señas", ["Saludar al lugar con gestos.", "Recordar su forma, no su nombre.", "Dejar el diccionario en la baliza."], "Las señas orientan sin error; el diccionario del eco cambia la mitad del tramo."]] },
];

function buildEntry(mapId, index) {
  const map = hierarchy.maps.find((entry) => entry.mapId === mapId);
  const family = families[index % families.length];
  const variant = family.variants[Math.floor(index / families.length) % family.variants.length];
  const echoId = mapId - 1020;
  const [ruleName, rules, outcome] = variant;
  return {
    mapId,
    echoId,
    tier: 3,
    sector: map.sector,
    sectorName: map.sectorName,
    sourceName: map.sourceName,
    anomaly: family.anomaly.replace("{src}", map.sourceName),
    rule: {
      name: `${ruleName} — Eco ${String(echoId).padStart(4, "0")}`,
      rules: rules.map((line) => line.replace("{src}", map.sourceName)),
      outcome,
    },
    flavor: `Eco ${String(echoId).padStart(4, "0")} del sector ${map.sectorName}: recuerdo incompleto de ${map.sourceName}. La baliza de retorno y la navegación del Atlas permanecen abiertas.`,
    family: family.key,
    variant: ruleName,
  };
}

const missing = hierarchy.maps.filter((entry) => entry.tier === 3 && !challengeMaps.has(entry.mapId)).map((entry) => entry.mapId).sort((a, b) => a - b);
if (missing.length !== 420) throw new Error(`Se esperaban 420 Ecos sin regla y hay ${missing.length}`);
const entries = missing.map(buildEntry);
const output = {
  version: 1,
  scope: "Reglas locales breves para los 420 Ecos Tier 3 sin evento Atlas desafío.",
  guarantees: {
    bagAlwaysAvailable: true,
    noForcedBattle: true,
    freeReturn: true,
    reversibleDecision: true,
    usesGlobalSwitches: false,
    usesGlobalVariables: false,
  },
  families: families.map((family) => family.key),
  entries,
};
const target = path.join(ROOT, "content", "atlas_tier3_rules.json");
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Tier 3: ${entries.length} reglas locales escritas en ${path.relative(ROOT, target)} (${families.length} familias × ${families[0].variants.length} variantes).`);
