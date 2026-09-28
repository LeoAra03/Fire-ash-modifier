# Atlas Tier 2 — Macrociclos 04 y 05

## Alcance

Los macrociclos 04 y 05 completan diez lotes de cinco rutas: 50 rutas Tier 2 nuevas en los mapas 1315–1726. Cubren desde Valle Magnético hasta la primera ruta de Bahía Relámpago.

Resultados instalados:

- 10 lotes Tier 2;
- 50 rutas de autoría dedicada;
- 100 NPCs con nombre, motivación, conflicto y estados anterior/posterior;
- 50 objetivos y mecánicas locales;
- 50 decisiones persistentes;
- 50 recompensas únicas;
- 600 líneas de diálogo nuevas sin repeticiones;
- switches 783–832 y variables 179–228;
- geometría y eventos originales preservados;
- retorno incondicional a Puerto Horizonte preservado.

El acumulado alcanza 85/120 rutas Tier 2, 170 NPCs y 1.020 líneas de diálogo sin repeticiones.

## Rutas

| N.º acumulado | Mapa | Episodio | Recompensa |
|---:|---:|---|---|
| 36 | 1315 | El Alfabeto que Cambiaba de Polo | BINDINGBAND |
| 37 | 1326 | La Casa de los Huesos Repuestos | GRIPCLAW |
| 38 | 1333 | El Faro de las Eras Mezcladas | BIGROOT |
| 39 | 1340 | La Isla que Restauraba Pisadas | MENTALHERB |
| 40 | 1351 | El Mercado que Vendía Rocío | WHITEHERB |
| 41 | 1358 | El Puente que Pesaba las Nubes | POWERHERB |
| 42 | 1365 | La Final que Pronosticaba Campeones | PUREINCENSE |
| 43 | 1376 | El Bosque que Seguía una Aguja de Hierro | LUCKINCENSE |
| 44 | 1383 | La Casa que Afinaba sus Clavos | FULLINCENSE |
| 45 | 1390 | La Ciudad que Excavaba sus Cimientos | ODDINCENSE |
| 46 | 1401 | La Costa que Navegaba por Constelaciones Viejas | ROSEINCENSE |
| 47 | 1408 | El Concurso de la Estrella Adicional | WAVEINCENSE |
| 48 | 1415 | El Desierto de las Señales Celestes | ROCKINCENSE |
| 49 | 1426 | La Tetera que Silbaba por Toda la Casa | CHOICEBAND |
| 50 | 1433 | El Puente que Devolvía el Eco Equivocado | CHOICESPECS |
| 51 | 1440 | La Lluvia que Tocaba Todas las Alarmas | CHOICESCARF |
| 52 | 1451 | El Piso de las Cometas Prestadas | LEFTOVERS |
| 53 | 1458 | El Gimnasio que Giraba la Gravedad | BLACKSLUDGE |
| 54 | 1465 | El Concurso que Medía el Viento en Aplausos | LIFEORB |
| 55 | 1476 | El Centro que Diagnosticaba Profundidad | FLAMEORB |
| 56 | 1483 | La Llave del Torneo Sumergido | TOXICORB |
| 57 | 1490 | La Fábrica de los Compañeros Temporales | IRONBALL |
| 58 | 1501 | Los Hitos que Corrían Tras el Cometa | MACHOBRACE |
| 59 | 1508 | El Palacio que Elegía por su Cometa | BLACKBELT |
| 60 | 1515 | La Pirámide de las Habitaciones Fugaces | BLACKGLASSES |
| 61 | 1526 | El Camino que se Plegaba al Llover | SILKSCARF |
| 62 | 1533 | El Mapa que Hacía Pájaros con la Tormenta | SHELLBELL |
| 63 | 1540 | El Centro de los Formularios Infinitos | WISEGLASSES |
| 64 | 1551 | El Vestido de las Mil Facetas | MUSCLEBAND |
| 65 | 1558 | La Sala de Curación Transparente | AMULETCOIN |
| 66 | 1565 | La Ruta de Hielo que Guardaba Pasos | SMOKEBALL |
| 67 | 1576 | El Estadio que Sembraba Rivales | EVERSTONE |
| 68 | 1583 | La Danza del Polvo Meteórico | EVIOLITE |
| 69 | 1590 | La Casa que Ensayaba Impactos | ASSAULTVEST |
| 70 | 1601 | El Pueblo que Iluminaba el Coral | WEAKNESSPOLICY |
| 71 | 1608 | La Casa que Filtraba el Mar | BLUNDERPOLICY |
| 72 | 1615 | El Gimnasio de las Mareas Pintadas | THROATSPRAY |
| 73 | 1626 | La Ciudad que Alquilaba Sombras | ADRENALINEORB |
| 74 | 1633 | La Mina que Cambiaba de Turno con la Luna | ELECTRICSEED |
| 75 | 1640 | La Ciudad que Apagaba su Calefacción | GRASSYSEED |
| 76 | 1651 | El Estadio que Jugaba entre Nubes de Vapor | MISTYSEED |
| 77 | 1658 | La Liga de los Calentamientos Eternos | PSYCHICSEED |
| 78 | 1665 | La Frontera Dibujada con Vapor | NORMALGEM |
| 79 | 1676 | La Casa de las Ventanas Selladas | FIREGEM |
| 80 | 1683 | La Cueva que Confundía Polen con Humo | WATERGEM |
| 81 | 1690 | El Bosque que Numeraba Polinizadores | ELECTRICGEM |
| 82 | 1701 | La Avenida de los Reflejos Patrocinados | GRASSGEM |
| 83 | 1708 | La Ruta que Copiaba al Viajero Más Rápido | ICEGEM |
| 84 | 1715 | La Isla que Reflejaba una Leyenda Distinta | FIGHTINGGEM |
| 85 | 1726 | La Bahía que Cobraba cada Relámpago | POISONGEM |

## Infraestructura base

Los mapas del macrociclo 04 pertenecen al grupo Tier 2 que ya incluía un evento `Atlas desafío`; ese evento fue preservado. Los mapas del macrociclo 05 no tenían desafío genérico previo. En ellos, la ruta artesanal de dos NPCs, su objetivo, mecánica y decisión persistente constituyen la primera capa dedicada; el compilador no afirma que exista una batalla base inexistente.

Todas las rutas mantienen baliza Tier 2 y retorno libre. No añaden combates forzados ni consultan los switches 674 o 675. El progreso solo se activa cuando `pbReceiveItem` confirma la recompensa; con la Mochila llena se puede volver a intentarlo.

## Referencias PNG para crítica

- `docs/referencia_tier2_macro04_antes.png`
- `docs/referencia_tier2_macro04_despues.png`
- `docs/referencia_tier2_macro05_antes.png`
- `docs/referencia_tier2_macro05_despues.png`

Los recuadros amarillos indican las posiciones de los NPCs. Son anotaciones y no forman parte del juego. Estas imágenes no son assets jugables ni sustituyen la revisión dentro de `Game.exe`.

## Fuentes y backups

```text
content/atlas_tier2_blueprints_macro04.json
content/atlas_tier2_blueprints_macro05.json
content/atlas_tier2_qa_macro04.json
content/atlas_tier2_qa_macro05.json
tools/create_tier2_macro04_05.mjs
tools/apply_tier2_routes.mjs
pokemon_fire_ash/PokeModBackups/atlas_tier2_macro04_originals/
pokemon_fire_ash/PokeModBackups/atlas_tier2_macro05_originals/
```

## Límite de certificación

El QA estático comprueba datos, flags, recompensas, eventos originales, retorno y consistencia narrativa. Ritmo, clipping, densidad de NPCs y sensación de recorrido todavía requieren prueba manual en `Game.exe`.
