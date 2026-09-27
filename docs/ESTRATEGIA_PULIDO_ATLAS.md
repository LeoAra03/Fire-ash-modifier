# Estrategia de pulido por capas: Atlas Mil

## Principio rector

Cantidad no equivale a importancia. El jugador debe saber qué contenido merece atención narrativa y qué contenido existe como reto opcional. La estructura convierte la repetición inevitable en una propiedad explícita del mundo, no en un defecto accidental.

## Jerarquía de contenido

### Tier 1 — Anclas artesanales

- **Cantidad:** 40 mapas, uno por sector.
- **Posición:** primer mapa de cada bloque de 25.
- **Promesa:** episodio comparable a una misión principal postgame.
- **Contenido mínimo:** 3–5 NPCs con conflictos cruzados, una escena de al menos 7 pasos, decisión con consecuencia, jefe de equipo narrativo, recompensa con lectura futura, curación y retorno.
- **Presupuesto sugerido:** 20–35 minutos por primera visita.
- **QA:** revisión humana obligatoria y dos pasadas de similitud/flags.

### Tier 2 — Rutas estables

- **Cantidad:** 120 mapas, tres por sector.
- **Posición:** mapas 6, 13 y 20 de cada bloque.
- **Promesa:** ruta, cueva o instalación con identidad y una mecánica clara.
- **Contenido mínimo:** 1–2 NPCs, objetivo observable, una pelea o puzzle, una variación de estado y recompensa funcional.
- **Presupuesto sugerido:** 8–15 minutos.
- **QA:** validación automática más muestreo humano de 25%.

### Tier 3 — Ecos dimensionales

- **Cantidad:** 840 mapas restantes.
- **Promesa:** anomalías opcionales, retos breves y geografía inestable.
- **Justificación:** Atlas reconstruye lugares a partir de recuerdos incompletos; similitudes espaciales son “ecos”, no regiones principales.
- **Contenido mínimo:** baliza única, identificación del eco, regla local breve, navegación anterior/siguiente y salida directa.
- **Presupuesto sugerido:** 2–6 minutos.
- **QA:** integridad, transitabilidad, retorno y ausencia de bloqueos.

## Los 40 ejes de crossover

Cada sector usa una sola voz y combina como máximo tres influencias para evitar una mezcla sin foco:

1. Pokémon Adventures, TCG y radio de Pueblo Lavanda.
2. The Electric Tale of Pikachu, humor de anime y torneos escolares.
3. Pokémon Origins, archivos de Oak y prototipos de Liga.
4. Mystery Dungeon, gremios y lenguaje de exploradores.
5. Pokémon Ranger, operaciones de rescate y ecología.
6. Colosseum/XD, desierto y rehabilitación de Pokémon oscuros.
7. Pokémon Conquest, clanes y juramentos tácticos.
8. Pokémon Snap, fotografía y conducta natural.
9. PokéPark, festivales y pruebas sin malicia.
10. Pokémon TCG, duelos rituales y cartas como memoria.
11. Pokémon Masters EX, parejas compi y líneas alternativas.
12. Pokémon Unite, deporte y estrategia por objetivos.
13. Pokémon GO, investigación comunitaria y señales remotas.
14. Pokémon Rumble, juguetes conscientes de su rol.
15. Trozei/Picross, lógica visual y mensajes cifrados.
16. Café Remix, comunidad y conflictos cotidianos.
17. Detective Pikachu, investigación y testigos contradictorios.
18. Legends: Arceus, distorsiones y expediciones históricas.
19. Scarlet/Violet, ecología de paradojas sin copiar Área Cero.
20. Infinite Fusion como debate ético sobre identidades mezcladas.
21. Homenaje a Uranium: energía peligrosa y restauración ambiental.
22. Homenaje a Insurgence: propaganda, cultos reinterpretados y libre elección.
23. Homenaje a Reborn: reconstrucción urbana y consecuencias sociales.
24. Homenaje a Rejuvenation: memoria temporal y familias separadas.
25. Homenaje a Unbound: contrabando de portales y fronteras.
26. Homenaje a Gaia: arqueología, regis y civilizaciones.
27. Homenaje a Prism: minería, minerales y responsabilidad.
28. Homenaje a Glazed: tránsito entre dimensiones y sueños.
29. Homenaje a Light Platinum: diplomacia entre ligas.
30. Homenaje a Radical Red: academia de estrategia con contrajuego justo.
31. Mito de Lavender: horror sonoro sugerido y opcional.
32. Homenaje no gráfico a Lost Silver: identidad, memoria y duelo.
33. Leyenda del cartucho negro: decisiones y un fantasma que no daña partidas.
34. Mito de Buried Alive: arqueología falsa y explicación Pokémon.
35. Nieve del Monte Plateado: aislamiento y rescate, no shock gore.
36. MissingNo. y glitches como datos estabilizables.
37. Pale Luna y acertijos imposibles convertidos en puzzle justo.
38. Strangled Red reinterpretado como culpa y reconciliación, sin violencia gráfica.
39. Facción original: Archiveros del Último Guardado.
40. Convergencia final de campeones, rivales, Pokégods y cronistas.

Los nombres de fangames funcionan como metadatos de inspiración. El jugador ve reinterpretaciones propias; no se importan diálogos, mapas ni assets ajenos.

## Bucle de producción

### Loop 0 — Inventario

1. Cargar mapa, tileset, eventos, flags, especies, objetos y sprites disponibles.
2. Determinar tier y perfil de voz.
3. Reservar IDs sin tocar 429, 674, 675 ni 701–707.

### Loop 1 — Generación

1. Construir el prompt del mapa.
2. Generar blueprint JSON contra el schema.
3. Rechazar cualquier salida incompleta antes de editar `Data/`.

### Loop 2 — QA anti-procedural

1. Comparar n-gramas con contenido previo.
2. Detectar frases genéricas y exposición tipo Pokédex.
3. Comparar nombres, motivos, equipos y recompensas.
4. Validar variedad de longitud, tono y vocabulario entre NPCs.
5. Emitir prompt de revisión para cada fallo.

### Loop 3 — QA técnico

1. Confirmar especies, movimientos, objetos, trainer types y sprites.
2. Validar flags, páginas y operación correcta de self-switch.
3. Rechazar referencias a 674/675.
4. Confirmar `canLose=true`, niveles ≤100 y equipos ≤6.
5. Validar salida libre y celda de destino transitable.

### Loop 4 — Integración

1. Crear backup por lote.
2. Aplicar solo blueprints aprobados.
3. Ejecutar verificadores globales.
4. Comparar número de avisos antes/después; el lote no puede agregar incidencias.

### Loop 5 — Prueba humana

1. Jugar ruta crítica.
2. Medir tiempo, claridad del objetivo y frecuencia de combate.
3. Revisar clipping, ritmo de texto, dificultad y recompensa.
4. Reescribir; nunca corregir una mala escena añadiendo más texto.

## Reglas anti-procedural

1. Ningún NPC existe solo para explicar lore.
2. Todo NPC importante quiere algo y teme una consecuencia.
3. Una escena Tier 1 cambia al menos un NPC, objeto, sonido o estado del mapa.
4. Ningún jefe se define únicamente por tipo elemental.
5. Ningún equipo repite una composición anterior.
6. Máximo tres referencias crossover centrales por mapa.
7. Toda creepypasta es opcional, no destructiva y apta para el tono Pokémon.
8. Nunca se simulan errores fuera de la ventana del juego ni pérdida de guardado.
9. Mochila siempre disponible; jamás activar un bloqueo de objetos como dificultad.
10. La dificultad proviene de información, sinergia y decisiones, no de trampas inevitables.
11. Tier 3 puede ser extraño o fragmentario, pero debe declararse como Eco antes de que el jugador invierta tiempo.
12. Assets únicamente del manifiesto existente o creados y validados expresamente para RMXP.
13. Los diálogos importantes deben sobrevivir sin mencionar niveles, estadísticas ni entradas de Pokédex.
14. Una recompensa principal debe tener una lectura futura.
15. Cada lote falla si aumenta las incidencias globales del analizador.

## Criterio de “Official Expansion Pack”

Un mapa Tier 1 solo se considera terminado con puntuación mínima 4/5 en voz, conflicto, espacio, escena, equipo narrativo, contrajuego, recompensa, continuidad, originalidad y compatibilidad; además necesita una prueba dentro de `Game.exe`. Sin prueba visual se clasifica como “candidato aprobado estáticamente”, no como final.
