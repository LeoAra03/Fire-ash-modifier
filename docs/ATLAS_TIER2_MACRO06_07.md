# Atlas Tier 2 — Macrociclos 06 y 07 (cierre del Tier 2)

## Alcance

Los macrociclos 06 y 07 completan los **7 lotes pendientes** de Tier 2: 35 rutas nuevas en los mapas 1733–2015, desde la Antena de Bahía Relámpago hasta la Torre de Umbral Mil. Con ellos, el Tier 2 alcanza **120/120 rutas de autoría dedicada**.

Resultados instalados:

- 7 lotes Tier 2 (5 + 2);
- 35 rutas de autoría dedicada;
- 70 NPCs con nombre, motivación, conflicto, error reconocido y estados anterior/posterior;
- 35 objetivos y mecánicas locales con contrajuego explícito;
- 35 decisiones persistentes;
- 35 recompensas únicas;
- 420 líneas de diálogo nuevas sin repeticiones (antes/después);
- switches 833–867 y variables 229–263;
- geometría, eventos y navegación previos preservados;
- retorno incondicional a Puerto Horizonte preservado.

El acumulado alcanza **120/120 rutas Tier 2**, 240 NPCs y 1.440 líneas de diálogo sin repeticiones.

## Voces por sector

Las 35 rutas usan las voces de los sectores 29–40 ya aprobadas en `content/atlas_narrative_seeds.json`: diplomacia de ligas (Bahía Relámpago), contrajuego deportivo (Meseta de Tinta), horror sonoro susurrado (Reserva de Engranajes), elegía sin gore (Círculo de Ceniza), moral de cartucho negro (Labertino Boreal), macabro sugerido (República de Musgo), rescate invernal (Cinturón Aurora), estabilización glitch (Trinchera de Luz), acertijos justos (Provincia del Eco), culpa y reconciliación (Horizonte Fractal), custodia de memorias (Corona de Bruma) y convergencia coral (Umbral Mil). Los ejes de crossover siguen siendo metadatos de inspiración: el jugador ve reinterpretaciones propias.

Las parejas Pokémon de cada NPC se citan en diálogo con su nombre de presentación («Swanna traslada los pliegos…»), no como símbolo de datos.

## Rutas

| N.º acumulado | Mapa | Episodio | Recompensa |
|---:|---:|---|---|
| 86 | 1733 | La Antena que Negociaba el Viento | STICKYBARB |
| 87 | 1740 | El Consejo que Compartía un Campeón | RAZORFANG |
| 88 | 1751 | La Academia que Vendía Dificultad | SOFTSAND |
| 89 | 1758 | El Análisis que Fichaba a los Jugadores | SHARPBEAK |
| 90 | 1765 | El Mapa de Tinta que Explicaba Atajos | POISONBARB |
| 91 | 1776 | La Caja que Guardaba un Latido | SPELLTAG |
| 92 | 1783 | La Casa que Repetía la Canción | TWISTEDSPOON |
| 93 | 1790 | La Última Campana del Silencio | HARDSTONE |
| 94 | 1801 | El Retrato que Pedía No Rehacerse | MIRACLESEED |
| 95 | 1808 | La Avenida que Contaba los Ausentes | REAPERCLOTH |
| 96 | 1815 | El Jardín de los Nombres Cortados | KEEBERRY |
| 97 | 1826 | La Ofrenda que Ganaba por Nosotros | ROWAPBERRY |
| 98 | 1833 | El Cartucho que Ofrecía Victoria Fácil | EJECTPACK |
| 99 | 1840 | La Curación que Cobraba una Victoria | SITRUSBERRY |
| 100 | 1851 | La Excavación que Ensamblaba un Monstruo | DUBIOUSDISC |
| 101 | 1858 | El Retrato del Esqueleto Inexistente | MICLEBERRY |
| 102 | 1865 | La Piedra que Simulaba un Entierro | ENIGMABERRY |
| 103 | 1876 | El Reporte que Cruzaba la Nieve | NEVERMELTICE |
| 104 | 1883 | El Equipo que No Pedía Rescate | SALACBERRY |
| 105 | 1890 | La Pintura que Esperaba a los Ausentes | SILVERPOWDER |
| 106 | 1901 | El Dato que Intentaba Clasificar al Jugador | METALCOAT |
| 107 | 1908 | La Luz que Purgaba Archivos Rotos | PRISMSCALE |
| 108 | 1915 | La Torre de Datos con Dos Versiones | ELECTIRIZER |
| 109 | 1926 | El Acertijo que Fingía Profundidad | STARFBERRY |
| 110 | 1933 | La Prueba que Ocultaba sus Reglas | APICOTBERRY |
| 111 | 1940 | El Eco que Contestaba Antes de la Pregunta | CUSTAPBERRY |
| 112 | 1951 | El Recuerdo que Enseñaba Venganza | JABOCABERRY |
| 113 | 1958 | La Deuda que Heredó un Hijo | GANLONBERRY |
| 114 | 1965 | La Carta que Volvió Culpable al Mensajero | BRIGHTPOWDER |
| 115 | 1976 | El Guardado que Era una Persona | DEEPSEASCALE |
| 116 | 1983 | El Cofre de Recuerdos en Escena | OVALSTONE |
| 117 | 1990 | El Archivo que Guardaba el Fin de la Historia | PETAYABERRY |
| 118 | 2001 | La Mesa de los Cuarenta Testigos | MARANGABERRY |
| 119 | 2008 | El Escenario que Reunía a los Ausentes | DRAGONFANG |
| 120 | 2015 | La Torre que Reunía los Cuarenta Archivos | PROTECTOR |

## Infraestructura base

Los mapas de estos macrociclos pertenecen al grupo Tier 2 sin desafío genérico previo (el evento `Atlas desafío` solo cubre 60 de las 120 rutas Tier 2). La ruta artesanal de dos NPCs, su objetivo, mecánica y decisión persistente constituyen la capa dedicada; el compilador no afirma que exista una batalla base inexistente.

Todas las rutas mantienen baliza Tier 2 y retorno libre. No añaden combates forzados ni consultan los switches 674 o 675. El progreso solo se activa cuando `pbReceiveItem` confirma la recompensa; con la Mochila llena se puede volver a intentarlo.

## Referencias PNG para crítica

- `docs/referencia_tier2_macro06_antes.png`
- `docs/referencia_tier2_macro06_despues.png`
- `docs/referencia_tier2_macro07_antes.png`
- `docs/referencia_tier2_macro07_despues.png`

Los recuadros amarillos indican las posiciones de los NPCs. Son anotaciones y no forman parte del juego. Estas imágenes no son assets jugables ni sustituyen la revisión dentro de `Game.exe`.

## Fuentes y backups

```text
content/atlas_tier2_blueprints_macro06.json
content/atlas_tier2_blueprints_macro07.json
content/atlas_tier2_qa_macro06.json
content/atlas_tier2_qa_macro07.json
tools/create_tier2_macro06_07.mjs
tools/apply_tier2_routes.mjs
pokemon_fire_ash/PokeModBackups/atlas_tier2_macro06_originals/
pokemon_fire_ash/PokeModBackups/atlas_tier2_macro07_originals/
```

## Límite de certificación

El QA estático comprueba datos, flags, recompensas, eventos originales, retorno y consistencia narrativa (57 pruebas acumuladas en `tools/external_authoring.test.mjs`). Ritmo, clipping, densidad de NPCs y sensación de recorrido todavía requieren prueba manual en `Game.exe`.
