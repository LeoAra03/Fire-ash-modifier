1. Ejecutar `npm test` completo y anotar en `docs/ESTADO_CONGELADO.md` cualquier verificador en rojo antes de tocar un solo byte del proyecto.
2. Correr `npm run verify:all` y volcar la salida íntegra a `docs/qa/linea_base_verify_all.txt` como fotografía de partida del plan de 900 fases.
3. Regenerar `node tools/inventario_congelado.mjs` y confirmar los 5417 archivos hasheados (Data 5215 + tools 202) sin desviaciones.
4. Verificar con `node tools/inventario_congelado.mjs --verify` que el rango reservado (switches 701–867, variables 101–263) siga libre en su porción no asignada.
5. Rehacer el backup ZIP de `pokemon_fire_ash/Data` y `Scripts.rxdata` en `PokeModBackups/` antes de la primera escritura del plan.
6. Reafirmar la regla de oro en `docs/ESTADO_CONGELADO.md`: ningún mapa, evento, switch o diálogo original de Fire Ash se edita; todo entra por IDs nuevos y aditivos.
7. Documentar el orden de reconstrucción obligatorio (multiversal → canon Arceus → eras → restauración → dimensiones → rocket → circuito → ambience → wild) en `tools/plan900/orden_instalacion.sh`.
8. Crear `tools/plan900/` y registrar ahí, fase por fase, el estado de avance medido con fecha y hash de HEAD.
9. Levantar el censo real de mapas con `node tools/analyze_compiled_fire_ash.mjs` y comparar contra los 3465 `Map*.rxdata` del último recuento.
10. Verificar que los 409 scripts de `Data/Scripts.rxdata` se abren sin error de zlib con `npm run verify:ruby`.
11. Comprobar con `npm run verify:salud` la salud global del árbol antes de empezar cualquier reescritura masiva.
12. Fijar en `docs/qa/politica_ids.md` la tabla maestra de rangos usados: mapas, switches, variables, self-switches y trainer types.
13. Auditar con `npm run verify:defeats` que ninguna derrota de jefe del DLC deje estado inconsistente tras la primera victoria.
14. Verificar `npm run verify:event-collision` y `npm run verify:save-path` para descartar colisiones de eventos y rutas de guardado rotas.
15. Congelar la lista de los 17 mapas nuevos del DLC (2195, 2196, 2200, 2201, 2210, 2211, 2220, 2221, 2230, 2250–2257) y su música asignada en una tabla única.
16. Levantar el inventario de eventos `PokeMod*` por mapa y guardarlo en `content/plan900_inventario_eventos.json`.
17. Confirmar que los 500 eventos `Horizonte N:` siguen instalados en sus 20 mapas (1001–1020) sin corrimiento de índices.
18. Confirmar los 1000 mapas de Atlas Mil (1021–2020) y los 40 anclas Tier 1 (1021–1996, switches 708–747).
19. Verificar los 151 mapas de Dimensional Nightmare (2040–2190) y sus subconjuntos NEXO (2136–2140) y Liga Oscura (2141–2142).
20. Revisar que el switch de postgame (429) y el switch de activación de Volus (870) sean las dos únicas puertas de entrada a todo el contenido extra.
21. Confirmar que nada del DLC sea alcanzable antes de derrotar a Arceus en La Ruta de Dios: auditar cada warp de entrada con `node tools/qa/arceus_scope_map.mjs --audit`.
22. Listar en `docs/qa/puertas_postgame.md` cada warp condicionado y el switch que lo habilita.
23. Revisar `docs/AUDITORIA_TOTAL_FLAGS.md` y marcar los huecos reales de switches y variables que el plan puede consumir.
24. Definir el prefijo de nombres `POKEMOD 900 ` para cualquier switch o variable que se cree durante este plan.
25. Verificar que los 887 switches y 293 variables usados no colisionen con el rango que el plan va a consumir.
26. Establecer que cada fase de este plan termina con al menos un verificador en verde y una línea nueva en el registro de avance.
27. Crear `tools/plan900/checkpoint.mjs` que valide numeración de fases, verificadores e integridad de backups en un solo comando.
28. Añadir `npm run plan900:check` al `package.json` para que el avance del plan sea auditable por CI.
29. Documentar en `docs/qa/rollback.md` el procedimiento exacto de restauración desde `PokeModBackups/` para cada instalador del proyecto.
30. Confirmar que `PokeModBackups/` contenga los originales de todos los mapas que el plan va a tocar antes de tocarlos.
31. Ejecutar `npm run kirin_check` sobre la carpeta del juego y anotar mayúsculas y `.rgssad` que rompen Android.
32. Fijar la meta de rendimiento: boot en Kirin sin parches nuevos y con el mismo tiempo de arranque medido antes del plan.
33. Verificar `npm run verify:package` y `npm run verify:corregido:zip` para saber con qué empaquetado cuenta el proyecto hoy.
34. Fijar el tamaño máximo del ZIP raíz: no superar los 128 MB combinados del artefacto de sesión sin justificación escrita.
35. Congelar el diccionario de términos del proyecto (Vía, Ancla, Emisión, Sello, Fragmento, Dimensión invitada, Liga Oscura) en `docs/qa/glosario.md`.
36. Definir la métrica de éxito del plan: cada dimensión con jefe final, retorno libre, verificador propio y partida de prueba registrada.
37. Documentar qué significa "terminado" para un mapa: transitable, con encuentros, con música, con eventos de entrada y salida y sin celdas huérfanas.
38. Documentar qué significa "terminado" para un evento: diálogo revisado, flag de una sola escritura, texto en dos líneas de caja y salida garantizada.
39. Documentar qué significa "terminado" para un script: sin llamadas colgantes, sintaxis Ruby válida y probado en el arranque del juego.
40. Publicar la primera entrega del plan: `docs/PLAN_900_FASES.md` con las 900 líneas y esta tabla de métricas de cierre.
41. Auditar con `node tools/audit_atlas_tiles.mjs` la correspondencia entre tilesets RMXP y las celdas 16×16 de los ROM de GBC.
42. Verificar que los 212 tilesets nativos `ROMN_<campaña>_p<n>.png` (4,6 MB) existan y tengan sus dimensiones correctas.
43. Confirmar el BASE_ID 384 y que todos los bloques RMXP de 32×32 escalados desde GBC empiecen en ese id y no pisen tiles originales.
44. Revisar la decodificación de `MapLayout` de GBC: dos capas de metatiles, ids desde 384 y elevación conservada celda a celda.
45. Verificar la regla de colisión desde los bits 10-11 de la celda del mapa, ya que los hacks dejan el comportamiento en 0.
46. Auditar que la extracción de GBC no invente terreno: si el bit de colisión no está, la celda se trata como libre y se documenta.
47. Validar `npm run rom:nativo:mapas -- --verify` sobre las 1 486 028 celdas y confirmar 0 fallos y las 874 996 sólidas (58,9 %).
48. Confirmar que cada PNG nativo tenga su huella sha1 registrada y que el verificador la compare en cada corrida.
49. Revisar la calidad de primera generación de las paletas GBC: 4 tonos por paleta, corrección de color a Game Boy Color y sin interpolación.
50. Prohibir escalados bilineales en los tilesets propios: todo tileset GBC se agranda ×2 con vecino más cercano para conservar el pixel art.
51. Verificar los 9 frames 4bpp por personaje de GBC (abajo, arriba, lado y sus pasos) antes de armar cada hoja RMXP de 4×4.
52. Confirmar que las hojas RMXP de sprites GBC queden en 128×192 px (4 columnas × 4 filas de 32×48) y sin fondo verde.
53. Documentar en `docs/qa/gbc_pipeline.md` cada paso desde `gObjectEventGraphicsInfoPointers[]` hasta `$ROMN_<campaña>_g<id>.png`.
54. Verificar la lectura de `sObjectEventSpritePalettes[]` y que ninguna paleta se aplique a un sprite equivocado.
55. Comparar la paleta GBC de cada dimensión invitada contra la paleta declarada en `content/rom_campaigns_complete.json`.
56. Fijar la restricción de fidelidad: donde la GBC solo permitía 4 colores por sprite, el juego moderno no añade degradados.
57. Auditar que los tiles de hierba, agua, arena y nieve de GBC actúen como terreno real (encuentros y animación de crujido).
58. Verificar el terreno `:Grass` heredado de GBC en las 9 zonas del Monte Silver y las 3 de Isla Espejo.
59. Revisar los límites de la GBC sobre animaciones de tiles: solo animaciones lentas donde el original las tenía.
60. Confirmar que las fuentes de diálogo del DLC respeten la caja de dos líneas y el ancho de 40 caracteres del estilo GBC.
61. Revisar que los iconos de Pokémon GBC conserven el contorno negro de un pixel que define la legibilidad de la primera generación.
62. Auditar los back sprites GBC (`creep_back`, `glazed_back` y compañía) contra su front para evitar proporciones distintas.
63. Confirmar que los 19 Pokégods conserven Front, Back, Icons y Characters con la misma convención de nombres.
64. Verificar las formas ALFA (nivel 85), BETA (nivel 100) y OMEGA (nivel 115 shiny) contra la tabla de assets y sus banderas de encuentro.
65. Revisar la corrección cromática de los sprites al pasar de GBC a RMXP: sin pérdida de contraste en sombras de 2 píxeles.
66. Auditar que ningún sprite de GBC quede recortado en los bordes de su celda de 32×48.
67. Verificar la coherencia entre sprite de overworld GBC y sprite de batalla de la misma campaña.
68. Confirmar que el color de fondo eliminado de las láminas de referencia no deje halos verdes en los sprites importados.
69. Documentar la tabla de equivalencias entre ids GBC y trainer types de Fire Ash para las cinco campañas invitadas.
70. Revisar que las 789 entradas de entrenador nuevas de las campañas ROM usen tipos válidos de `trainer_types.dat`.
71. Confirmar que los 9691 NPC de origen de ROM tengan contraparte estructural en los 1227 mapas generados.
72. Verificar la política de 4 NPC de origen máximo por mapa y decidir qué mapas necesitan perfil artesanal propio.
73. Auditar que los interiores de las campañas ROM se marquen como perfiles artesanales separados y no como planos automáticos.
74. Revisar los 35591 `visualRows` del plan de campañas y confirmar que ningún mapa quede con una sola fila de estilo.
75. Confirmar que los 5061 warps de campaña apunten a coordenadas transitables y no a paredes.
76. Verificar que cada campaña ROM tenga su `completeSwitch` (990–994) y su `progressVariable` (350–354) reservados sin uso previo.
77. Confirmar que el switch 876 (`routeOfGodSwitch`) sea la única puerta que abre las cinco campañas ROM.
78. Auditar que los mapas de lobby de campaña (2200 Glazed, 2210 Light Platinum) conecten con el primer mapa de su rango por barco.
79. Revisar los 24 eventos `PokeMod Barco:` y confirmar que cada uno cobre sentido tras La Ruta de Dios.
80. Verificar que los 19 eventos `Gate:` conecten dimensiones sin dejar al jugador en un mapa inalcanzable.
81. Auditar que cada dimensión invitada tenga su propio gimnasio y su propio líder con equipo completo.
82. Confirmar que los líderes nuevos estén en `content/campanas_lideres.json` y que el verificador `verify:lideres` los cubra.
83. Revisar la traducción de los encuentros salvajes de Glazed, Light Platinum y Liquid Crystal en `content/*_wild_encounters.json`.
84. Confirmar que Liquid Crystal use sus encuentros nativos y no una copia de Kanto.
85. Auditar que Unbound (4000–4419) conserve su estructura de 420 mapas y su dificultad declarada.
86. Revisar que TFOH (3700–3944) no quede como campaña huérfana de narrativa: necesita al menos un hilo post-Ruta de Dios.
87. Confirmar que Pokémon Unbound use el charset de Ash de `ash_outfit_unbound.png` derivado de `ash_pokemon_unbound.jpg`.
88. Verificar que el recorte de las tres poses visibles de la lámina Unbound deje 4 direcciones × 4 patrones correctos.
89. Revisar la atribución del arte de los atavíos de Ash y mantenerla en `ashsprites/README` al redistribuir.
90. Auditar que ningún asset de ROM invitada se copie al repositorio: solo mapas adaptados con recursos propios de Fire Ash.
91. Confirmar que los textos originales de las ROM no se guarden en el repositorio por política del proyecto.
92. Documentar en `docs/qa/calidad_gbc.md` los diez criterios de "calidad de primera generación" que rigen toda importación.
93. Verificar que ningún tileset importado rompa la paleta del mapa con más de 16 colores simultáneos.
94. Auditar la nitidez de los mapas de Atlas Mil frente a los tilesets GBC: mismo pixel art, distinta resolución.
95. Confirmar que los mosaicos `atlas_1022_mosaico_XX_de_17_63.png` existan completos y sin huecos.
96. Revisar que la escala ×2 de los tilesets GBC se aplique también a los tilesets propios de Atlas para mantener coherencia visual.
97. Confirmar que las sombras de las esquinas de los autotiles se calculen con el algoritmo exacto de mkxp.
98. Verificar que ningún mapa tenga autotiles mal referenciados que dejen costuras visibles de un pixel.
99. Auditar la línea de horizonte de los mapas exteriores de GBC: sin transparencias falsas entre pradera y agua.
100. Cerrar el bloque GBC con `npm run verify:rom:nativo` en verde y su salida archivada en `docs/qa/gbc_cierre.txt`.
101. Definir "dinamismo" medible: cada mapa visitable tiene al menos un objeto en movimiento, un cambio de estado o un clima propio.
102. Auditar el movimiento de los NPC del DLC: nada de rutinas estáticas salvo estatuas y letreros justificados.
103. Instalar rutinas de patrulla en los guardias de ciudad Teckel con movimiento en cuadrícula y pausa de dos segundos.
104. Añadir caminatas circulares a los aldeanos de la Avenida del Circuito (2230) para que la calle nunca esté quieta.
105. Verificar que las rutinas de movimiento no crucen puertas, warps ni zonas de combate por accidente.
106. Implementar clima dinámico en Monte Silver (ventisca, niebla) activado por variable y desactivado al salir del mapa.
107. Añadir ciclo de día y noche a las ciudades propias del DLC sin que afecte a los mapas originales de Fire Ash.
108. Verificar que el ciclo de día y noche no se aplique en interiores ni en dimensiones donde rompería la atmósfera.
109. Revisar la transición de clima entre mapas: sin cortes secos de música ni de tintes de pantalla.
110. Añadir animación de agua en las pozas cósmicas de la Ruta de Dios con el tile animado nativo del tileset.
111. Implementar parallax en los mapas de la Cima del Génesis para dar profundidad al cielo sin mover colisión.
112. Añadir secuencias de cutscene encadenadas (temblor 6, trueno, destello) al activar el portal de Puntaneva.
113. Verificar que ninguna cutscene deje al jugador sin control más de 8 segundos seguidos.
114. Auditar los fundidos en cascada con `npm run verify:transition-safety` antes y después de cada secuencia nueva.
115. Confirmar que `apply_transition_safety_fix.mjs` siga siendo el último parche de transición aplicado en el orden de instalación.
116. Revisar el tono de cada escena nueva con `npm run verify:tone-safety` para no romper la voz del juego.
117. Implementar cámara lenta y paneo en el duelo de Arceus antes de cada cambio de fase.
118. Añadir animación de entrada de los jefes de dimensión (sprite que camina hasta su casilla y gira al jugador).
119. Verificar que cada jefe de dimensión bloquee la salida hasta ser derrotado y libere el paso después.
120. Implementar diálogos de ambiente rotativos en los hub (Oak, Puerto Horizonte) que cambien según el progreso.
121. Auditar que los NPC de ambiente no repitan la misma frase dos veces seguidas en la misma visita.
122. Añadir reacciones del mundo a los sellos de creepypasta purgados (aldeanos comentan el cambio).
123. Verificar que las reacciones de mundo usen el contador v[264] como fuente única y no switches duplicados.
124. Implementar avisos de la Pokédex y del Pokégear coherentes con las dimensiones desbloqueadas.
125. Añadir mini-cinemáticas de 3 segundos al pisar por primera vez cada ancla de Atlas Mil.
126. Verificar que las 40 anclas Tier 1 disparen su switch 708–747 exactamente una vez.
127. Auditar que los switches de ancla no se puedan rearmar al volver a entrar al mapa.
128. Implementar el guardado de progreso por dimensión usando la variable compartida 103 sin sobrescribir logros anteriores.
129. Añadir contadores de progreso por campaña ROM (350–354) visibles desde el menú de estado.
130. Verificar que los contadores de campaña no se reinicien al cambiar de dimensión ni al perder un combate.
131. Implementar temporizadores de eventos con `wait` encadenado sin bloquear el movimiento del jugador más de lo necesario.
132. Auditar que ningún evento use bucles `loop` sin condición de salida: riesgo de congelar el juego.
133. Añadir animaciones de objetos (interruptores, puertas, altares) con páginas de evento y no con cambios de tileset en vivo.
134. Verificar que los interruptores visibles de cada base de Team Rocket comuniquen su estado con sonido y sprite.
135. Implementar el movimiento de los tres Pokémon acompañantes del hub sin colisión entre ellos.
136. Añadir un sistema de "presencia" que encienda antorchas y lámparas al anochecer en las ciudades propias.
137. Verificar que el sistema de presencia no toque mapas originales de Fire Ash ni sus gráficos.
138. Documentar en `docs/qa/dinamismo.md` cada tipo de objeto dinámico permitido y su costo en eventos por mapa.
139. Fijar el techo de eventos por mapa: no superar 60 eventos nuevos en mapas de 40×40 sin justificación.
140. Auditar el rendimiento de los mapas con más eventos y recortar rutinas redundantes.
141. Implementar la reproducción de música por zona con fundido de 1 segundo entre pistas.
142. Verificar que la música de las dimensiones invitadas respete el archivo declarado en el JSON de campañas.
143. Añadir sonidos de ambiente (viento, agua, estática) en los mapas de creepypasta sin tapar la música.
144. Confirmar que la estática de Ciudad Glitch use SE propio y no un BGM fantasma.
145. Implementar el silencio diegético de la emisión de 1996: música que se degrada por páginas de evento.
146. Verificar que el cambio de BGM por evento no se dispare en bucle al reentrar en la página.
147. Auditar que cada mapa del DLC tenga BGM asignado y ninguno herede la música del mapa anterior por error.
148. Añadir transiciones de batalla temáticas por dimensión donde el motor lo permita sin tocar el núcleo original.
149. Verificar que las transiciones de batalla nuevas no afecten a los combates originales de Fire Ash.
150. Cerrar el bloque de dinamismo con un recorrido de prueba en vídeo-guía descrito en `docs/qa/playtest_dinamismo.md`.
151. Auditar la estructura de La Ruta de Dios: aproximación 2038, siete pisos 2031–2037, gruta de testigos 2030 y altar del origen.
152. Verificar que la aproximación celestial 2038 mida 52×72 y conserve la avenida serpenteante de cinco casillas.
153. Confirmar que el portal de Ciudad Puntaneva (Map625, coordenada 20,14) siga llevando a 2038 y no al primer piso.
154. Reparar el portal con `npm run verify:arceus-portal` si alguna partida antigua perdió el switch 870.
155. Verificar el segundo Volus de Puntaneva en (20,16) y su condición de aparición posterior al switch 870.
156. Auditar el diálogo de Volus de Hisui en Pueblo Hojaverde (Map513, 18,14) y su conteo X/17 de Tablas del Génesis.
157. Confirmar la facilidad de acceso: si faltan Tablas, Volus ofrece despertarlas todas sin obligar a farmear.
158. Verificar las 17 Tablas del Génesis una por una y que ninguna quede inalcanzable tras el postgame.
159. Auditar que el terremoto 6 y el destello de la activación no rompan la pantalla en Kirin.
160. Revisar la calzada despejada entre árboles de Puntaneva y que no queden franjas grises artificiales.
161. Verificar que el Squirtle de paso y el Charmeleon de la zona baja conserven sus coordenadas y su switch temporal 877.
162. Confirmar que el parche de `Game_Player` que permite cruzar árboles solo funcione en el mapa 625 y se apague al salir.
163. Auditar que `Game_Map#setup` apague el permiso de árboles al cargar cualquier otro mapa.
164. Revisar la escalera de dificultad de los siete pisos: Maya 130, Jericor 135, Quinoa 140, Cintia 145, Dialga 150, Palkia 150.
165. Confirmar que Dialga y Palkia primordiales tengan sprite visible bloqueando su tarima antes del combate.
166. Verificar que al caer Dialga el tiempo se restaure con la cinemática prevista y el sprite se desvanezca.
167. Verificar que al caer Palkia las dimensiones se alineen y su sprite se disuelva sin dejar colisión fantasma.
168. Auditar los ítems ocultos de los siete pisos: Caramelo Raro, Revivir Máximo, Más PP, Ceniza Sagrada, Parte Cometa, Cápsula Habilidad, Chapa Dorada.
169. Confirmar que ningún ítem oculto sea recogible dos veces.
170. Revisar el Altar del Origen y la puesta en escena de Arceus nivel 200 con IVs 31 perfectos.
171. Verificar que Arceus nivel 200 sea el único Pokémon del juego que alcanza ese nivel.
172. Auditar las seis reglas borradas de Arceus (OBJETO, CIELO, TALENTO, VELOCIDAD, TIPO, REGLA) contra `content/canon_arceus.json`.
173. Confirmar que cada fase del duelo abuse de la mecánica correcta y no sea una variación cosmética.
174. Revisar que Arceus hable como Omega Flowey: consciente de ser un asset, retando a Ash Ketchum por su nombre.
175. Prohibir la prosa de "deidad benévola" en cualquier diálogo nuevo de Arceus: auditar con `npm run verify:canon:arceus`.
176. Verificar los 25 dobles coreografiados del duelo uno por uno y su registro de auditoría.
177. Auditar `npm run verify:arceus:moves` para que cada movimiento usado por Arceus exista y tenga efecto real.
178. Auditar `npm run verify:arceus:actions` para que ninguna acción de la IA deje el turno colgado.
179. Correr `node tools/qa/arceus_shield_harness.mjs` y confirmar el comportamiento del escudo por fase.
180. Correr `node tools/qa/arceus_moves_harness.mjs` y confirmar los límites de daño y las inmunidades del duelo.
181. Ejecutar `npm run verify:arceus:fuzz` y resolver cualquier semilla que rompa el duelo.
182. Verificar `npm run verify:arceus:cinematics` en cada transición de fase y en la derrota.
183. Confirmar `npm run generate:arceus:omega:qa` y `npm run verify:arceus:omega:qa` sin diferencias.
184. Correr `npm run verify:arceus:sandbox` para probar el duelo sin riesgo de corromper una partida real.
185. Verificar `npm run verify:arceus:assets` y `npm run verify:arceus:recursos` sin recursos ausentes.
186. Auditar `npm run verify:arceus:scope` para que ningún mapa del duelo exponga contenido fuera de alcance.
187. Confirmar los sprites de fase ARCEUS_F1…ARCEUS_F5 y su correspondencia con las cinco reglas borradas.
188. Verificar la Forma Origen de los Mil Brazos en la sexta fase y el regreso a la Forma Primigenia.
189. Revisar la mega evolución de Arceus con `node tools/apply_arceus_mega.mjs --verify`.
190. Confirmar que al derrotar a Arceus suelte el Fragmento que despierta al Rotom del Tiempo.
191. Verificar que el Rotom del Tiempo sostenga las dimensiones como fragmentos y explique el multiverso.
192. Confirmar que si el jugador captura a Arceus, aparezca junto a Oak y antes de Mad Pikachu.
193. Auditar el combate posterior contra Volus como epílogo del ascenso.
194. Verificar que el duelo deje el juego en estado postgame limpio, sin banderas a medio escribir.
195. Confirmar que perder contra Arceus permita reintentar sin castigo permanente.
196. Auditar que ganar el duelo escriba exactamente las banderas esperadas y ninguna de más.
197. Revisar el retorno seguro desde la Cima del Génesis a Puntaneva y desde la aproximación a la ciudad.
198. Verificar que la aproximación 2038 tenga cinco cambios de nivel con escaleras talladas transitables.
199. Auditar las pozas cósmicas, santuarios laterales e hitos de Regiones/Origen/Vínculo de la aproximación.
200. Cerrar La Ruta de Dios con todos sus verificadores en verde y su informe actualizado en `docs/INFORME_LA_RUTA_DE_DIOS.md`.
201. Auditar las siete emisiones de creepypasta y su orden de acceso desde la cumbre del Monte Silver (Map2022).
202. Confirmar los mapas 2023–2029 con sus títulos y sus guardianes: La Torre que Escuchaba, La Partida Perdida, La Fosa del Enterrado, La Cinta Carmesí, Ciudad Glitch, El Eco que Jugó Contigo, La Consola de 1996.
203. Verificar los siete sellos de emisión en el rango 940–947 y que cada uno se escriba una sola vez al ganar.
204. Confirmar que el contador compartido v[264] registre el progreso de purga sin duplicar sellos.
205. Auditar que perder contra un guardián no escriba sello ni deje la emisión a medias.
206. Verificar que las siete emisiones tengan guardiana de curación al lado de la entrada.
207. Confirmar que cada emisión tenga salida libre a la cumbre y evento "Volver al mundo" a su grieta de origen.
208. Auditar las siete grietas de acceso en Kanto y Johto: Torre Pokémon, Islas Espuma, Monte Moon, Torre Quemada, Planta de Energía, Ruinas Alfa y Mansión Pokémon.
209. Verificar que cada grieta pregunte Entrar/Retirarse antes de cruzar y nunca arrastre al jugador.
210. Confirmar que con las siete emisiones purgadas aparezca el punto de colapso en la Torre Pokémon 1F.
211. Verificar que el punto de colapso suba a la falda del Monte Silver (Map2021) y no al hub retirado del laboratorio.
212. Confirmar que la antigua cápsula de grietas del laboratorio de Oak ya no exista en el mapa.
213. Auditar la falda 2021: Archivero Prohibido, curación, entrada y salida del laboratorio, subida a la cumbre.
214. Verificar la cumbre 2022 con las siete puertas de niebla y el menú de siete emisiones.
215. Revisar la Gruta de los Testigos (Map2030) y su función narrativa de testigos de Monte Silver.
216. Confirmar que Red, el Campeón Silencioso, aguarde en la cumbre y solo hable con batallas.
217. Auditar el equipo de Red: Pikachu 108, Venusaur 106, Charizard 106, Blastoise 106, Lapras 105, Snorlax 107.
218. Verificar la recompensa única de cada guardián: CLEANSE TAG, ODD KEYSTONE, SPELL TAG, FLAME ORB, GHOST GEM, SPOOKY PLATE, LIFE ORB, LEFTOVERS.
219. Confirmar que ninguna recompensa se pueda obtener dos veces ni duplicar en el catálogo de objetos.
220. Auditar que todos los combates de creepypasta tengan `canLose` activo y curación accesible.
221. Verificar la revancha amistosa solo por menú ("Revancha / Luego") y que nunca sea forzada.
222. Confirmar que los jefes derrotados queden con self-switch A y sello, y no vuelvan a atacar.
223. Auditar la página de registro de cada emisión purgada y que muestre el estado correcto al volver.
224. Revisar el sprite de Ash para el mundo creepypasta derivado de `ash_crepypastas.jpg` y su charset correspondiente.
225. Verificar que Ash funcione como agente EXTERNO: entra, explora, purga y vuelve; nunca queda atrapado.
226. Auditar que ninguna emisión retenga al jugador por guion: siempre hay salida disponible.
227. Confirmar que el tono de los siete mundos preserve la esencia de cada cuento sin copiar textos ajenos.
228. Verificar que cada emisión conserve su señal de atmósfera propia (canción imposible, nieve, cinta, estática, eco).
229. Auditar la fauna salvaje de las 9 zonas del Monte Silver y las 3 de Isla Espejo en `encounters.dat`.
230. Confirmar la línea de Larvitar en la montaña, los fantasmas de la torre y el hielo perdido en la nieve.
231. Verificar los datos vivos de Ciudad Glitch y el agua ecoica al surfear en la gruta (86 slots, niveles 70–108).
232. Auditar las manadas del Bosque Susurrante y su tabla de encuentros.
233. Confirmar que ninguna tabla de encuentros del DLC pise una tabla original de Fire Ash.
234. Verificar que los niveles de la fauna postgame escalen de 70 a 108 según la zona.
235. Auditar la música y los sonidos de las siete emisiones y que ninguno se corte al cambiar de página.
236. Confirmar que las emisiones usen plantillas de mapa de Fire Ash (Pokémon Tower, Indigo Ice, Burned Tower, Lavender House, Lake Verity Cave).
237. Revisar el Archivero Prohibido y su diálogo de custodia de emisiones.
238. Verificar que los nombres de mapa de las emisiones se resuelvan por el fallback de `MapInfos` sin reescribir paquetes de idioma.
239. Auditar que los 30 eventos `PokeMod Restauración:` sigan presentes y coherentes.
240. Auditar que los 28 eventos `PokeMod Grieta:` sigan presentes y coherentes.
241. Confirmar que los interruptores de emisión vivan en 940–947 y no en 868–875, que son de Arceus.
242. Revisar el uso de las banderas canónicas de Arceus 868–875 y documentar su significado en `docs/qa/flags_arceus.md`.
243. Verificar la Liga Oscura en los mapas 2141–2142 y sus catorce medallas descritas en `docs/DIMENSIONAL_NIGHTMARE/14_MEDALLAS_LIGA_OSCURA_Y_SENSACIONES.md`.
244. Auditar que la Liga Oscura solo se abra con las siete emisiones purgadas.
245. Confirmar que el jefe final de la Liga Oscura marque el switch 948 y entregue el Diploma.
246. Verificar con `npm run verify:diplomas` que el Diploma de la Liga Oscura sea conseguible.
247. Auditar los cinco diplomas de planta y su entrega con `node tools/apply_diplomas_planta.mjs --verify`.
248. Confirmar que el diploma final solo se pueda obtener completando todo el contenido extra.
249. Verificar el atavío de Ash campeón de la Ruta de Dios (`ash_champion_ruta_dios.jpg`) y su charset.
250. Confirmar el atavío secreto final por completar todo (`ash_champion_final_secret_outfit_for_complete_all.jpg`).
251. Auditar `content/outfits_dimension.json` y que cada dimensión tenga su atavío declarado.
252. Verificar la aplicación de atavíos con `npm run verify:atavios`.
253. Confirmar que el cambio de atavío no rompa el sprite de batalla ni las animaciones de surf y buceo.
254. Auditar que ningún atavío se aplique antes de su desbloqueo narrativo.
255. Verificar el atlas de atavíos `ash_atlas.jpg` y su charset para la Expedición Atlas Mil.
256. Confirmar el atavío de Glazed (`ash_pokemon_glazed.jpg`), Liquid Crystal, Team Rocket y Unbound.
257. Revisar que el atavío de Team Rocket sea coherente con el disfraz de infiltración de `apply_rocket_disfraz.mjs`.
258. Auditar que el disfraz no cambie el nombre del jugador ni sus banderas de identidad.
259. Confirmar que quitarse el disfraz en el momento equivocado no rompa la misión de infiltración.
260. Verificar el sprite de Ash maestro y sus direcciones: front, back, left y battle front/back.
261. Auditar `content/rom_nativo_sprites.json` y comprobar los 667 sprites de personaje extraídos del ROM.
262. Confirmar que los 3538 eventos de campaña vistan el personaje que les da la ROM.
263. Verificar que los 759 diálogos originales sustituyan el andamiaje en el primer mensaje del evento.
264. Auditar que ningún diálogo importado quede en inglés o en texto sin traducir en las campañas.
265. Confirmar que los mundos de creepypasta tengan su propio set de sprites y no reutilicen caras de Kanto sin motivo.
266. Revisar que los guardianes tengan sprites propios o justificados: LA LOCUTORA, PLATA PERDIDA, EL ENTERRADO, EL NIÑO DE LA CINTA, EL FALLO CERO, EL ECO AHOGADO, EL JUGADOR DE 1996.
267. Auditar la transición visual al entrar en una emisión: tinte, fundido y cambio de música encadenados.
268. Confirmar que la salida de una emisión devuelva exactamente a la celda de su grieta.
269. Verificar el retorno libre por menú en cada emisión además de la salida física.
270. Auditar que el jugador nunca aparezca en una celda sólida al volver de una emisión.
271. Revisar los 21 eventos HUB de grieta, archivero, progreso, salida y Liga Oscura.
272. Confirmar que el contador de progreso del HUB lea v[264] y los sellos 940–947.
273. Verificar que el HUB avise qué emisión falta cuando el jugador pregunta.
274. Auditar que el HUB no revele contenido antes de que el jugador lo descubra.
275. Confirmar que el guardado entre emisiones no pierda sellos ni contadores.
276. Verificar que una partida guardada dentro de una emisión se pueda recuperar sin quedar bloqueada.
277. Auditar que las siete grietas se puedan visitar en cualquier orden.
278. Confirmar que el orden de purga no altere el desenlace de la Liga Oscura.
279. Verificar que el texto de cada guardián respete la longitud de caja y el tono del proyecto.
280. Auditar que ninguna emisión use assets de audio que no existan en `Audio/BGM` o `Audio/SE`.
281. Confirmar que los jefes de creepypasta no usen Pokémon fuera de `species.dat`.
282. Verificar que los equipos de los guardianes tengan máximo seis Pokémon y niveles entre 100 y 108.
283. Auditar que el truco de shiny de PLATA PERDIDA (Noctowl) y EL FALLO CERO (Unown) esté bien aplicado.
284. Confirmar que las recompensas usen objetos existentes en `items.dat`.
285. Verificar que las recompensas no estén ya entregadas en partidas de prueba anteriores.
286. Auditar los mensajes de obtención de objeto y que no se disparen dos veces por doble página.
287. Confirmar la compatibilidad del Monte Silver con la fauna original del mapa donante.
288. Verificar que la nieve, la niebla y la ventisca de Monte Silver no ralenticen el juego en Kirin.
289. Auditar que la cumbre 2022 no tenga eventos huérfanos tras la derrota de Red.
290. Confirmar que Red deje una recompensa única y no una revancha infinita.
291. Revisar el informe `docs/MULTIVERSO_CREEPYPASTA.md` y actualizarlo con el estado final de las siete emisiones.
292. Auditar que la palabra "emisión" se use con el mismo sentido en el juego, los JSON y los documentos.
293. Confirmar que no existan dos listas distintas de las siete emisiones en el repositorio.
294. Verificar que los nombres de los guardianes estén escritos igual en `trainers.dat`, los JSON y los diálogos.
295. Auditar que los sellos 940–947 tengan nombre legible en el interruptor correspondiente.
296. Confirmar que ningún sello nuevo use un ID fuera del rango reservado.
297. Verificar que la Liga Oscura no se pueda iniciar con sellos falsos: auditar la condición de entrada.
298. Confirmar que el Diploma de la Liga Oscura quede registrado en el menú de diplomas.
299. Auditar que la pantalla de medallas de la Liga Oscura muestre catorce medallas sin huecos.
300. Cerrar el bloque creepypasta con `npm run verify:multiverse` y `npm run verify:defeats` en verde.
301. Auditar la jerarquía completa de Atlas Mil con `node tools/apply_atlas_hierarchy.mjs --verify`.
302. Confirmar los 1000 mapas del rango 1021–2020 y que ninguno quede sin `@tileset_id` válido.
303. Verificar los 40 anclas Tier 1 (1021–1996) y su switch 708–747 con el nombre `POKEMOD ATLAS SEAL NN`.
304. Auditar que cada ancla tenga su narración propia en `content/atlas_narrative_seeds.json`.
305. Confirmar que las 40 anclas se disparen exactamente una vez y alimenten la variable compartida 103.
306. Revisar las etapas de los seis macrobloques Tier 1 y su reparto de 63 mapas cada uno.
307. Auditar los blueprints `content/atlas_tier1_blueprints_batch01..09.json` contra los mapas realmente escritos.
308. Verificar `npm run verify:atlas` (servicio, macro04–05, macro06–07 y reglas Tier 3) en verde.
309. Revisar el servicio de reparación de Atlas con `node tools/apply_atlas_service_repair.mjs --verify`.
310. Auditar las rutas Tier 2 macro04, macro05, macro06 y macro07 con `node tools/apply_tier2_routes.mjs --verify`.
311. Confirmar que cada macro Tier 2 tenga su backup en `PokeModBackups/atlas_tier2_macroNN_originals`.
312. Verificar `content/atlas_tier2_qa_macro03..07.json` y que cada QA documente sus hallazgos.
313. Auditar las reglas Tier 3 con `node tools/apply_atlas_tier3_rules.mjs --verify` y `docs/ATLAS_TIER3_REGLAS.md`.
314. Confirmar la correspondencia entre `docs/ATLAS_TIER2_MACRO03..07.md` y los mapas instalados.
315. Revisar el circuito de ocho gimnasios genuinamente nuevos: Map2230 + Maps 2250–2257.
316. Verificar que los ocho gimnasios no sean ecos de Pewter ni de Cerulean y tengan líder y equipo propios.
317. Confirmar la asignación musical de los ocho gimnasios: `gym.ogg`, `gymleader-1..6.ogg`, `Battle Gym Leader.mid`.
318. Auditar que la Avenida del Circuito (2230) suene `Kalos Town.ogg` al entrar.
319. Verificar los 50 eventos `PokeMod Circuito:` y los 25 eventos `PokeMod Vía:`.
320. Confirmar que el pilar P3 se llegue por PORTAL y no por barco ni por warp directo.
321. Auditar la relación de Atlas con las nueve eras de la Vía (`docs/VIA_NUEVE_ERAS.md`).
322. Verificar `npm run verify:eras` y que la Vía de las Nueve Eras (Map2195) y su gimnasio (2196) estén intactos.
323. Confirmar que el gimnasio de la Vía sea genuinamente nuevo y tenga su propio líder.
324. Auditar que 2195, 2196 y 2230 tengan encuentros salvajes temáticos de tipo Cueva.
325. Verificar el pulido visual macro01 y macro02 con `node tools/render_atlas_visual_reference.mjs --macro 02`.
326. Revisar `content/atlas_visual_polish_macro01.json` y `macro02.json` contra el render generado.
327. Confirmar que las referencias visuales `docs/referencia_tier2_macroNN_antes.png` y `_despues.png` existan y muestren la mejora.
328. Auditar `content/atlas_style_baseline.json` y que todo mapa nuevo lo respete.
329. Verificar `content/atlas_tile_audit.json` y `docs/atlas_tile_audit.md` sin tiles rotos.
330. Correr `npm run repair:atlas:tiles` solo si la auditoría detecta fallos y volver a verificar después.
331. Auditar el sector 01 de Atlas con `node tools/apply_atlas_sector01_floor_layout.mjs --verify`.
332. Verificar `content/atlas_sector01_redesign.json` y `docs/atlas_sector01_pilot.md` contra el mapa real.
333. Confirmar que el piloto del sector 01 sirva de molde de calidad para el resto de Atlas.
334. Revisar `content/atlas_content_hierarchy.json` y que no haya mapas fuera de la jerarquía.
335. Auditar `content/atlas_region_design.json` y la coherencia geográfica entre bloques de mil mapas.
336. Verificar `content/atlas_mil_region.pkregion` como fuente de la región y su integridad.
337. Confirmar que los 1000 mapas se generen desde los blueprints aprobados y no a mano alzada.
338. Auditar que ningún mapa de Atlas tenga celdas sin metatile asignado.
339. Verificar que las rutas de Atlas sean transitables de punta a punta con el caminante automático.
340. Auditar los pasos estrechos de Atlas: ningún pasillo de una celda sin alternativa de salida.
341. Confirmar que Atlas tenga curación y tienda en el hub y cada dos bloques de ruta.
342. Verificar los 500 eventos `Horizonte N:` y `docs/500_AVENTURAS_POSTGAME.md`.
343. Auditar `content/horizontes_500.json` y `docs/INFORME_HORIZONTES_500.md` contra los 20 mapas 1001–1020.
344. Confirmar que los 20 reinos × 25 aventuras sigan completos tras cualquier reinstalación.
345. Verificar `docs/500_EVENTOS_Y_PELEAS_ATLAS_MIL.md` y que las 500 peleas tengan entrenador válido.
346. Auditar que las 500 aventuras no se pisen entre sí al compartir mapa.
347. Confirmar que las recompensas de las 500 aventuras estén en el catálogo y no se repitan.
348. Verificar que las 500 aventuras escalen de dificultad según el orden propuesto en su documento.
349. Auditar la IA de los entrenadores de Atlas Mil y que ninguno use equipos vacíos.
350. Confirmar que los 789 entrenadores de campañas ROM estén en `trainers.dat` con tipo válido.
351. Revisar ciudad Teckel y su manifiesto `content/teckel_manifest.json` archivo por archivo.
352. Verificar `npm run build:teckel` y `npm run verify:teckel` en verde antes de tocar la ciudad.
353. Auditar la relocalización de Atlas con `node tools/apply_atlas_relocalizacion.mjs --verify`.
354. Verificar la instalación de Maxine en ciudad Teckel con `node tools/apply_ciudad_teckel_maxine.mjs --verify`.
355. Confirmar el SE `Audio/SE/MAXINE.ogg` y su uso correcto en la escena.
356. Auditar el sprite `ALTAR_MAXINE.png` y los siete sprites `ALT_SECRET_*`.
357. Revisar los mapas 997, 998, 999 y 2300 del paquete Teckel y su función en el flujo.
358. Confirmar que ciudad Teckel tenga comercio, curación, NPC informativos y salida clara.
359. Auditar que la ciudad no rompa la continuidad con el mapa que la contiene.
360. Verificar que Maxine tenga diálogo revisado y no una plantilla sin terminar.
361. Confirmar la Isla Espejo con sus tres mapas y su acceso desde el espejo del sótano de la Mansión de Cinnabar.
362. Verificar los 16 jefes de Isla Espejo y sus 32 combates (primer combate y revancha).
363. Auditar `npm run verify:isla_espejo` y `npm run rebuild:isla_espejo` antes y después de cualquier cambio.
364. Confirmar el retorno libre de Isla Espejo y que no retenga al jugador.
365. Verificar los 19 Pokégods: 12 clásicos y 7 extraídos de la ROM de GBC.
366. Auditar que cada Pokégod tenga Front, Back, Icons y Characters propios y con la misma convención.
367. Confirmar `content/pokegods_assets.json` y `content/pokegods_originales.json` sin pendientes.
368. Verificar la extracción de los Pokégods con `node tools/pokegods_assets.mjs --verify` y `node tools/pokegods_originales.mjs --verify`.
369. Auditar las formas ALFA, BETA y OMEGA y sus condiciones de captura, huida y shiny.
370. Confirmar que la forma OMEGA sea shiny y que la BETA no permita huir.
371. Verificar que las tres formas tengan entradas válidas en `species.dat` sin tocar especies originales.
372. Auditar los encuentros de Isla Espejo y su coherencia con la fauna de la zona.
373. Confirmar que la Isla Espejo tenga su propia música y no herede la del sótano.
374. Revisar `docs/POKEGODS_ASSETS_FASE3.md` y actualizarlo con el estado final.
375. Auditar que ningún Pokégod se pueda obtener antes del postgame.
376. Verificar que la captura de un Pokégod no bloquee la escena siguiente.
377. Confirmar que los Pokégods tengan descripción de Pokédex coherente con su origen.
378. Auditar que el sprite de overworld de cada Pokégod se corresponda con su sprite de batalla.
379. Verificar que las formas ALFA/BETA/OMEGA se distingan a simple vista en batalla.
380. Confirmar que los iconos de los Pokégods se vean en el equipo y en la caja del PC.
381. Auditar que la Isla Espejo no comparta tabla de encuentros con Monte Silver.
382. Verificar que el acceso por espejo funcione desde cualquier estado del sótano de Cinnabar.
383. Confirmar que el espejo del sótano no se pueda usar dos veces simultáneamente.
384. Auditar que la Isla Espejo tenga eventos de salida redundantes (warp y menú).
385. Revisar el informe `docs/INFORME_FIRE_ASH_ISLA_ESPEJO.md` y su tabla de 16 jefes.
386. Confirmar que los 16 jefes tengan equipo de seis Pokémon o justificación escrita.
387. Auditar la curva de niveles de Isla Espejo frente a Monte Silver y Atlas.
388. Verificar que Isla Espejo use la mochila libre en combate (parche global ya instalado).
389. Confirmar que el switch 674 ya no bloquee la Mochila en ningún combate interno del juego.
390. Auditar `npm run verify:grandeur:bag` y las etapas del Grandeur Club.
391. Verificar la Torre Gratis y el Abra de emergencia con `npm run verify:abra:tower`.
392. Confirmar que el hub postgame del laboratorio de Oak esté activo con `npm run verify:oak:hub`.
393. Auditar `content/restauracion_cromatica.json` y el regreso del color a los mundos purgados.
394. Verificar que la restauración cromática no toque mapas originales ni tilesets base.
395. Confirmar `npm run verify:restauracion` en verde tras cada intervención en creepypasta.
396. Auditar `content/dimensiones_barco.json` y los 24 eventos de barco entre dimensiones.
397. Verificar que el barco de Puerto Horizonte (Map1001) sea la puerta a Glazed y Light Platinum.
398. Confirmar que cada capitán de dimensión explique su regla propia antes de zarpar.
399. Auditar las tres dimensiones paralelas del barco y su vuelta libre en cualquier orden.
400. Cerrar el bloque Isla Espejo con `npm run verify:multiverse`, `verify:isla_espejo` y `verify:pokegods` en verde.
401. Auditar la campaña Glazed (3000–3110, 111 mapas) y su lobby 2200.
402. Verificar el switch 990 de Glazed y la variable de progreso 350 contra colisiones.
403. Confirmar que los 111 mapas de Glazed tengan warp de entrada desde su lobby y retorno.
404. Auditar la narrativa de Glazed: escarcha, lagos y ciudades que recuerdan dos líneas temporales.
405. Verificar `npm run verify:glazed` y los encuentros salvajes en `content/glazed_wild_encounters.json`.
406. Auditar el gimnasio de Glazed (2201) y su líder con equipo nativo de la campaña.
407. Revisar `node tools/apply_glazed_native_lore.mjs --verify` y su lore instalado.
408. Confirmar que Glazed tenga 8 gimnasios jugables si su estructura lo permite y si no, justificarlo por escrito.
409. Verificar que Glazed tenga ciudades, rutas, cuevas e interiores artesanales suficientes para sentirse región.
410. Auditar la campaña Light Platinum (3120–3138, 19 mapas) y su lobby 2210.
411. Verificar el switch 991 y la variable 351 de Light Platinum.
412. Confirmar que Light Platinum tenga su costa, sus rutas y su gimnasio 2211 conectados.
413. Auditar `npm run verify:light_platinum` y `content/light_platinum_wild_encounters.json`.
414. Revisar `node tools/apply_light_platinum_native_lore.mjs --verify`.
415. Expandir Light Platinum de 19 mapas a una región mínima jugable: capital, tres rutas, una cueva y dos gimnasios.
416. Auditar la campaña Liquid Crystal (3200–3631, 432 mapas) y su dimensión propia.
417. Verificar el switch 992 y la variable 352 de Liquid Crystal.
418. Confirmar que Liquid Crystal no reutilice encuentros de Kanto y use `content/liquid_crystal_wild_encounters.json`.
419. Revisar `node tools/apply_liquid_crystal_native_lore.mjs --verify`.
420. Auditar que Liquid Crystal conserve su identidad de cristal líquido y no sea un clon de Johto.
421. Confirmar que la dimensión Liquid Crystal tenga su propio acceso desde el barco o un Gate.
422. Verificar que los 432 mapas de Liquid Crystal sean alcanzables desde su primer mapa.
423. Auditar la campaña TFOH (3700–3944, 245 mapas) y su lugar en la narrativa post-Ruta de Dios.
424. Verificar el switch 993 y la variable 353 de TFOH.
425. Escribir el hilo narrativo mínimo de TFOH y conectarlo al Fragmento de Arceus.
426. Auditar la campaña Unbound (4000–4419, 420 mapas) y su dificultad declarada.
427. Verificar el switch 994 y la variable 354 de Unbound.
428. Confirmar que Unbound use el atavío `ash_outfit_unbound.png` en su recorrido.
429. Auditar `npm run verify:ash:unbound` y `node tools/apply_ash_unbound.mjs --verify`.
430. Verificar que las cinco campañas ROM tengan entrada y salida sin callejones sin salida.
431. Confirmar que la generación de campañas `npm run build:rom:campaigns` sea reproducible y verificable.
432. Auditar `npm run verify:rom:campaigns` y `verify:rom:campaigns:plan` tras cualquier regeneración.
433. Revisar `docs/CAMPANAS_ROM_COMPLETAS.md` y `docs/ROM_INVITADO_EXTRACCION.md` y actualizarlos con las ampliaciones.
434. Confirmar que las campañas ROM no copien gráficos, textos ni audio de las ROMs invitadas.
435. Auditar que ningún mapa de campaña quede con una sola fila de estilo visual (`visualRows` de una entrada).
436. Verificar que los interiores de campaña tengan perfil artesanal propio y no plano automático.
437. Auditar que los 3625 NPC de campaña tengan movimiento y diálogo, no solo presencia.
438. Confirmar que los 5061 warps de campaña no apunten fuera de rango.
439. Verificar que los mapas de campaña respeten el techo de 4 NPC de origen por mapa.
440. Auditar la música de las cinco campañas y que cada una tenga tema de entrada, ruta y gimnasio.
441. Confirmar que Glazed, Light Platinum y Liquid Crystal tengan tablas de encuentros temáticas.
442. Verificar que Unbound y TFOH reciban también tabla de encuentros o una justificación documentada.
443. Auditar el nivel de la fauna de campaña y su coherencia con el postgame (70–110).
444. Confirmar que los líderes de campaña estén en `content/campanas_lideres.json` y en `trainers.dat`.
445. Verificar `npm run verify:lideres` y que cada líder tenga sprite y tipo de entrenador válidos.
446. Auditar que cada campaña tenga al menos un jefe final con recompensa única.
447. Confirmar que las recompensas de campaña no dupliquen objetos ya entregados en otras dimensiones.
448. Verificar que las campañas se puedan recorrer en cualquier orden sin romper banderas.
449. Auditar que ninguna campaña escriba un switch de otra campaña.
450. Cerrar el bloque de dimensiones invitadas con los vérificadores `verify:rom:campaigns`, `verify:glazed`, `verify:light_platinum` y `verify:liquid_crystal` en verde.
451. Auditar la infiltración de Team Rocket en los mapas 2220 (base subterránea) y 2221 (núcleo del mando).
452. Verificar `content/team_rocket_mision.json` y los 22 eventos instalados por `node tools/apply_team_rocket_mision.mjs --verify`.
453. Confirmar el escalafón de seis rangos: Recluta → Agente → Oficial → Teniente → Comandante → Jefe Supremo.
454. Auditar la variable de rango y que subir de rango no se pueda saltar misiones.
455. Verificar el contador de heridos y que cada herido salvado se registre una sola vez.
456. Confirmar que Ash salvaguarde a los heridos como condición explícita del arco.
457. Escribir el guion completo de la Misión 1 (Recluta): entrar, obedecer una orden menor y ver el costo humano.
458. Escribir el guion completo de la Misión 2 (Agente): sabotear sin dañar a los trabajadores.
459. Escribir el guion completo de la Misión 3 (Oficial): proteger un convoy de heridos y ganarse la confianza del rival.
460. Escribir el guion completo de la Misión 4 (Teniente): desobedecer una orden cruel y cubrir el rastro.
461. Escribir el guion completo de la Misión 5 (Comandante): tomar el mando del núcleo para el bien de los habitantes.
462. Auditar el arco completo: obedecer para poder mandar, mandar para cuidar.
463. Verificar que el rival de la infiltración tenga tres apariciones y un desenlace.
464. Confirmar que el rival pueda ser derrotado sin matarlo ni humillarlo.
465. Auditar el disfraz de Rocket con `npm run verify:disfraz` y `node tools/apply_rocket_disfraz.mjs --verify`.
466. Verificar que el disfraz cambie los diálogos de los NPC de la base.
467. Confirmar que vestir el disfraz bloquee el acceso a ciudades aliadas y que quitárselo lo restaure.
468. Auditar que el disfraz no funcione dentro de la Liga Oscura ni en Monte Silver.
469. Verificar la medalla de Team Rocket y su iconografía propia.
470. Confirmar que la medalla se entregue solo al completar la Misión 5.
471. Auditar los rangos visuales: sprite de Ash con uniforme distinto por rango o al menos un distintivo.
472. Verificar que la base 2220 y el núcleo 2221 tengan música propia (`TeamRocket.ogg`, `Team Rocket OW Kanto.ogg`).
473. Confirmar que 2220 tenga encuentros temáticos tipo Cueva en su terreno compatible.
474. Auditar que las cinco misiones se puedan abandonar y retomar sin perder progreso.
475. Verificar que las misiones no se puedan completar dos veces.
476. Confirmar que los heridos tengan diálogo de agradecimiento y no texto genérico.
477. Auditar que ningún NPC de la base repita la misma línea en las cinco misiones.
478. Verificar que la entrada a la base requiera el disfraz y que la salida sea libre.
479. Auditar que salir de la base con misiones abiertas no corrompa el estado.
480. Confirmar que el Jefe Supremo tenga combate de dos fases si la estructura lo permite.
481. Verificar que el Jefe Supremo no use Pokémon fuera de `species.dat`.
482. Auditar que la derrota contra el Jefe Supremo permita reintentar y no castigue permanentemente.
483. Confirmar que ganar contra el Jefe Supremo deje la base en manos de los habitantes.
484. Verificar que el final de la infiltración se refleje en diálogos del mundo (aldeanos, Oak, hub).
485. Auditar que el final de Team Rocket no interfiera con la Liga Oscura.
486. Verificar que el switch de fin de Team Rocket sea único y esté documentado.
487. Confirmar que Team Rocket tenga su propio verificador en `verify:all`.
488. Auditar que las cinco misiones tengan una duración objetivo de 10 a 20 minutos cada una.
489. Verificar que cada misión tenga al menos un combate, una decisión y una consecuencia visible.
490. Auditar las decisiones de las misiones y que al menos una tenga dos resoluciones válidas.
491. Confirmar que las decisiones se registren en variables propias y no en switches compartidos.
492. Verificar que las consecuencias de las decisiones se vean antes del final del arco.
493. Auditar que ningún NPC de la base quede bloqueando un pasillo después de una misión.
494. Confirmar que el mapa 2220 tenga al menos tres entradas y salidas lógicas.
495. Verificar que el núcleo 2221 tenga sala de mando, celda de heridos y sala de máquinas.
496. Auditar que la celda de heridos sea visitable y que curar ahí sea posible.
497. Confirmar que la misión final tenga una cuenta atrás diegética sin bloquear el juego.
498. Verificar que la cuenta atrás se pueda fallar y reintentar sin romper la partida.
499. Auditar que el guion de las cinco misiones esté escrito en `docs/qa/team_rocket_guion.md` antes de instalarlo.
500. Cerrar el bloque Team Rocket con `npm run verify:rocket` y `npm run verify:disfraz` en verde.
501. Auditar las 409 secciones de `Data/Scripts.rxdata` una por una con `npm run verify:ruby`.
502. Correr `node tools/qa/scripts_dangling_calls.mjs` y listar cada llamada a método inexistente.
503. Corregir toda llamada colgante detectada por `npm run verify:scripts:calls` antes de seguir.
504. Auditar el arranque completo con `npm run verify:boot` y `node tools/validate_boot_classes.mjs`.
505. Reparar clases de metadatos de mapa con `npm run fix:metadata` y verificar con `npm run verify:metadata`.
506. Reparar mapas ausentes y datos corruptos con `npm run repair:mapas`.
507. Verificar la reparación de mapas con `npm run verify:mapas` y revisar la lista de mapas tocados.
508. Auditar que ningún arreglo de mapas haya sobrescrito un mapa original de Fire Ash.
509. Correr `npm run verify:graficos` para validar el parche de seguridad gráfica.
510. Auditar que el parche `apply_graficos_safety.mjs` no oculte sprites legítimos.
511. Verificar la seguridad del menú Z con `npm run verify:zmenu`.
512. Auditar que el parche de menú Z no bloquee accesos del juego original.
513. Verificar el tono global con `npm run verify:tone-safety`.
514. Auditar que `apply_tone_safety_fix.mjs` no haya alterado texto original.
515. Verificar las transiciones con `npm run verify:transition-safety`.
516. Auditar que ningún fundido encadenado quede colgado tras un warp.
517. Verificar la colisión de eventos con `npm run verify:event-collision`.
518. Auditar que ninguna página de evento deje al jugador atrapado entre dos colisiones.
519. Verificar la ruta de guardado con `npm run verify:save-path`.
520. Auditar que el guardado nunca escriba en `Save*.rxdata` ni en `Game.rxdata` desde el editor.
521. Verificar el bloqueo de escritura de partidas y el backup automático antes de cada cambio.
522. Correr `node web/js/marshal.test.mjs` y confirmar los 51 tests de Ruby Marshal en verde.
523. Correr `node web/js/history.test.mjs` y validar el historial acotado de deshacer/rehacer.
524. Correr `node web/js/integration.test.mjs` y confirmar la integración de editores.
525. Correr `npm run test:ui` y validar la interfaz de las ocho pestañas.
526. Correr `node tools/qa/atlas_master_suite.test.mjs` con `npm run test:atlas:master`.
527. Correr `node tools/external_authoring.test.mjs` y validar la autoría externa de contenido.
528. Correr `node tools/tone_safety.test.mjs` y `node tools/package_integrity.test.mjs`.
529. Correr `node tools/dn_runtime_support.test.mjs` y validar el soporte en tiempo de ejecución de Dimensional Nightmare.
530. Auditar la integridad zlib de las 402 secciones comprimidas de `Scripts.rxdata`.
531. Revisar que ninguna sección de script quede sin `module` o `class` de cierre.
532. Auditar los `alias` y `super` de los parches del DLC para no romper métodos originales.
533. Verificar que cada parche de `Game_Player`, `Game_Map` o `Sprite_Character` se aplique una sola vez.
534. Auditar que los parches no se reapliquen al cargar partida y dupliquen efectos.
535. Verificar `npm run verify:arceus:shield` y `verify:arceus:actions` tras cualquier parche de combate.
536. Correr `node tools/verify_arceus_action_safety.mjs` y resolver los avisos que emita.
537. Correr `node tools/verify_arceus_recursos.mjs` y confirmar que no falte ningún recurso del duelo.
538. Auditar `node tools/qa/arceus_scope_map.mjs` sobre `PokeMod_CanonArceus` sin diferencias.
539. Verificar `npm run verify:salud` y anotar cada advertencia con su causa y su arreglo.
540. Auditar `npm run dn:audit` y `npm run dn:audit:strict` y resolver los hallazgos estrictos.
541. Verificar `npm run dn:runtime` y que el runtime de Dimensional Nightmare no falle en ningún episodio.
542. Correr `npm run dn:plan:check`, `dn:maps:verify`, `dn:pasajes:verify` y `dn:events:verify` en cadena.
543. Correr `npm run dn:battles:verify`, `dn:medals:verify`, `dn:liga:verify` y `dn:sens:verify`.
544. Correr `npm run dn:flags:verify`, `dn:story:verify`, `dn:audio:verify` y `dn:visual:check`.
545. Correr `npm run dn:mosaicos:check`, `dn:mosaicos:origen:check` y `dn:gameboy:verify`.
546. Auditar que ningún verificador de Dimensional Nightmare quede en rojo por la purga de `reference/dimensional_nightmare/slices/`.
547. Reconstruir con `npm run dn:mosaicos:origen` si algún verificador depende de los mosaicos de origen.
548. Auditar la lista completa de verificadores del `package.json` y agruparlos por bloque temático.
549. Añadir `npm run verify:all` al flujo de CI de GitHub Actions con caché de node_modules.
550. Auditar `.github/workflows` y confirmar que la CI ejecute los mismos verificadores que el flujo local.
551. Revisar que el `pretest` (`npm run build:teckel`) no falle en un clon limpio.
552. Verificar que `npm test` funcione sin el juego descargado, usando datos compilados o fixtures.
553. Auditar cada verificador que dependa de rutas absolutas y convertirlo a ruta relativa al repo.
554. Verificar que ningún script escriba fuera de `pokemon_fire_ash/` y `docs/`.
555. Auditar que ningún instalador escriba sin backup previo: comprobar la carpeta `PokeModBackups/`.
556. Escribir `tools/plan900/audit_instaladores.mjs` que recorra los `apply_*.mjs` y exija backup y `--verify`.
557. Añadir a ese auditor la comprobación de que cada `apply_*.mjs` tenga su `verify:*` correspondiente en `package.json`.
558. Listar los `apply_*.mjs` sin verificador y crear el que falte.
559. Auditar que los instaladores de mapas grandes usen `--max-old-space-size=6144` para no morir por memoria.
560. Verificar que ningún instalador deje el proceso a medias si falla: revisar escritura atómica.
561. Auditar el uso de `fs.writeFileSync` sobre `Map*.rxdata` y exigir escritura temporal + rename.
562. Verificar que toda escritura de `MapInfos.rxdata` se haga en una sola operación.
563. Auditar que `map_metadata.dat` se actualice junto con el mapa y no en un paso separado olvidable.
564. Verificar que `Tilesets.rxdata` registre cada tileset nuevo antes de que un mapa lo use.
565. Auditar que ningún mapa referencie un tileset inexistente tras una importación.
566. Verificar que `encounters.dat` se escriba de forma aditiva y sin reordenar las 298 tablas.
567. Auditar `trainers.dat` y que las 7970 entradas originales conserven su índice.
568. Verificar que `items.dat` no reordene ids al añadir objetos nuevos.
569. Auditar `species.dat` y `moves.dat` para que ninguna forma nueva desplace un id existente.
570. Verificar `abilities.dat` y `trainer_types.dat` con la misma regla de aditividad.
571. Auditar `CommonEvents.rxdata` y sus 50 eventos comunes sin corrimiento de índices.
572. Verificar que ningún evento común del DLC dependa de un switch de mapa.
573. Auditar los eventos comunes de curación y su disponibilidad en cada hub.
574. Verificar que la mochila libre en combate no afecte a los combates de historia originales.
575. Auditar `npm run verify:nobadge` y los movimientos de campo sin medalla.
576. Verificar que los movimientos de campo del DLC funcionen sin badges de Kanto.
577. Auditar que ningún movimiento de campo permita salir de los límites de un mapa.
578. Verificar los pasos de warps inválidos con un script propio `tools/plan900/audit_warps.mjs`.
579. Auditar que cada warp tenga destino existente, coordenada transitable y dirección válida.
580. Verificar que ningún warp del DLC cree un bucle infinito entre dos mapas.
581. Auditar las escaleras y su simetría visual con la colisión real.
582. Verificar que ninguna puerta quede sin sonido de apertura.
583. Auditar los carteles y su texto con `MapInfos` y coordenadas correctas.
584. Verificar que ninguna señal apunte a un mapa con nombre equivocado.
585. Auditar la lista completa de errores históricos corregidos y documentarlos en `docs/qa/errores_corregidos.md`.
586. Añadir a ese documento el ID de fase del plan, el archivo afectado y el verificador que lo cubre.
587. Auditar que cada error corregido tenga una prueba de regresión.
588. Crear `tools/plan900/regresion.test.mjs` con una prueba por error corregido relevante.
589. Añadir la prueba de regresión a `npm test`.
590. Verificar que la suite completa siga por debajo de un tiempo razonable de ejecución.
591. Auditar el uso de memoria de la suite y dividirla si supera el límite del contenedor.
592. Verificar que cada verificador imprima un resumen final legible con conteos.
593. Auditar que los mensajes de error de los verificadores digan qué mapa, evento o switch falla.
594. Verificar que ningún verificador dependa de la hora del sistema para pasar.
595. Auditar que ningún verificador use rutas con espacios sin comillas.
596. Verificar el comportamiento de los verificadores en Windows y Linux (sin rutas absolutas ni separadores fijos).
597. Auditar que los scripts usen `path.join` y no concatenación de cadenas.
598. Verificar que ningún script deje archivos temporales tras un fallo.
599. Auditar la coherencia entre `package.json`, `.github/workflows` y la documentación de verificación.
600. Cerrar el bloque de corrección de scripts con `npm run verify:all` en verde y su salida archivada.
601. Auditar `docs/AUDITORIA_TOTAL_FLAGS.md` y regenerar el conteo real de switches y variables usados.
602. Confirmar que cada switch declarado en un JSON tenga al menos un uso real en los mapas.
603. Auditar los switches declarados y sin uso y decidir si se usan o se liberan con documentación.
604. Verificar que cada variable declarada tenga un mapa que la lea y otro que la escriba.
605. Auditar las variables de progreso 350–354 y su lectura en el hub y en el menú.
606. Verificar que los contadores de heridos, sellos y misiones no compartan el mismo ID.
607. Auditar los self-switches por evento y que ninguno se use como bandera global.
608. Verificar que los self-switches A, B, C y D tengan un significado fijo por convención del proyecto.
609. Auditar los eventos que escriben un switch sin comprobarlo antes.
610. Verificar que cada switch de una sola escritura tenga guarda de idempotencia.
611. Auditar los switches que se apagan y podrían reabrir contenido completado.
612. Verificar que ningún switch del DLC escriba en el rango original de Fire Ash.
613. Auditar la lista de switches libres y reservar los que este plan vaya a consumir.
614. Verificar la porción no asignada del rango reservado (701–867 y 101–263) tras cada bloque del plan.
615. Auditar que los nombres de switch sean legibles y sigan la convención `POKEMOD <bloque> <acción>`.
616. Verificar que ningún switch tenga dos nombres distintos en distintas fuentes.
617. Auditar que los JSON de contenido y el juego declaren los mismos IDs.
618. Verificar que `content/*.json` no contenga IDs de mapa inexistentes.
619. Auditar los IDs de mapa huérfanos: declarados en JSON y sin archivo `Map####.rxdata`.
620. Verificar que cada mapa existente tenga entrada en `MapInfos.rxdata` y en `map_metadata.dat`.
621. Auditar los mapas sin nombre y ponerles uno coherente con su contenido.
622. Verificar que los nombres de mapa no se repitan salvo en duplicados intencionales documentados.
623. Auditar la numeración de mapas y que no haya huecos que rompan supuestos de rango.
624. Verificar que el rango 2040–2190 no colisione con NEXO (2136–2140) ni Liga Oscura (2141–2142).
625. Auditar la documentación que avisa de no sumar dos veces NEXO y Liga Oscura al total.
626. Verificar el total de mapas del proyecto y publicarlo con fecha en `docs/ESTADO_CONGELADO.md`.
627. Auditar la asignación de música por mapa y completar los que no tengan BGM asignado.
628. Verificar que ningún mapa use una pista que no exista en `Audio/BGM`.
629. Auditar las referencias a `Audio/SE` y completar los sonidos que falten.
630. Verificar que ningún evento llame a un gráfico de personaje inexistente.
631. Auditar los `Graphics/Characters` referenciados y comparar contra los archivos reales.
632. Verificar que los charsets nuevos tengan 128×192 px y 4×4 poses.
633. Auditar los charsets importados con fondo transparente real y sin franjas de color.
634. Verificar que ningún charset nuevo pise el nombre de un charset original.
635. Auditar los `Graphics/Battlers` de los jefes nuevos y su resolución.
636. Verificar que los battlers usados en combate existan con el nombre exacto y las mayúsculas correctas.
637. Auditar el uso de mayúsculas y minúsculas en todas las rutas de recursos: es el fallo típico en Kirin.
638. Verificar con `npm run kirin_check` que no queden diferencias de mayúsculas entre referencia y archivo.
639. Auditar los `.rgssad` y confirmar que el juego no dependa de un paquete que el DLC no actualice.
640. Verificar que los recursos nuevos entren en `Data/` o `Graphics/` según el caso y no en carpetas temporales.
641. Auditar la lista completa de recursos añadidos por el plan y guardarla en `content/plan900_recursos.json`.
642. Verificar que ese inventario incluya tamaño, hash y fase que lo introdujo.
643. Auditar que ningún recurso añadido supere el tamaño razonable para un juego RMXP.
644. Verificar que los recursos pesados de audio no dupliquen pistas ya existentes.
645. Cerrar el bloque de flags y recursos con el inventario en verde y el rango reservado intacto.
646. Volcar todos los textos `PokeMod*` a un JSON único con `tools/plan900/dump_dialogos.mjs`.
647. Contar los diálogos y compararlos con los 2741 eventos del DLC y los 759 diálogos originales importados.
648. Auditar que ningún texto supere las dos líneas de caja del estilo del juego.
649. Auditar los textos que corten palabras por la mitad al ajustar la caja.
650. Verificar que ninguna caja quede vacía o con solo espacios.
651. Auditar los signos de interrogación y exclamación de apertura en español en todo el DLC.
652. Verificar que ningún texto mezcle idiomas ni deje cadenas en inglés sin traducir.
653. Auditar los nombres propios: Ash, Ketchum, Arceus, Volus, Oak, Red, Maxine, Teckel.
654. Verificar que el nombre del jugador se inserte con el código correcto y no como texto fijo.
655. Auditar el uso de `\\v[NN]` y `\\n[NN]` en los diálogos y que las variables existan.
656. Verificar que ninguna variable insertada en un texto pueda salir vacía.
657. Auditar los nombres de Pokémon y movimientos usados en los diálogos contra `species.dat` y `moves.dat`.
658. Verificar que los diálogos de jefes mencionen su tipo de especialidad y su equipo real.
659. Auditar las 500 aventuras de Horizontes y revisar tono y longitud.
660. Auditar las 40 anclas Tier 1 y que su narración no repita estructura literal entre anclas.
661. Auditar los 50 eventos `PokeMod Circuito:` y los 25 `PokeMod Vía:` en busca de textos plantilla.
662. Auditar los 24 eventos `PokeMod Barco:` y que cada capitán tenga voz propia.
663. Auditar los 21 eventos HUB y que sus respuestas cubran todos los estados de progreso.
664. Auditar los 40 combates de los siete pisos de La Ruta de Dios y su texto de entrada y salida.
665. Auditar el diálogo completo de Arceus fase por fase y su coherencia con el canon.
666. Auditar el diálogo de Volus en sus tres momentos: activación, entrada y epílogo.
667. Auditar los siete guardianes de creepypasta y su texto de derrota y despedida.
668. Auditar los textos de la Liga Oscura, sus catorce medallas y su jefe final.
669. Auditar los textos de las cinco misiones de Team Rocket por rango.
670. Auditar los textos de ciudad Teckel y de Maxine uno por uno.
671. Auditar los textos de Isla Espejo y de los 16 jefes.
672. Auditar los textos de los líderes de las cinco campañas ROM.
673. Auditar los textos de los hub de campaña (2200 y 2210) y su información de viaje.
674. Auditar los textos de los ocho gimnasios de Atlas y su presentación de líder.
675. Verificar la caja de diálogo con `npm run verify:dialogos:queue` y `node tools/apply_cajas_dialogo.mjs --verify`.
676. Revisar los textos con comillas, guiones largos y puntos suspensivos y normalizarlos.
677. Auditar los textos que usan mayúsculas sostenidas y reducirlas salvo grito justificado.
678. Verificar que ningún diálogo del DLC use lenguaje técnico interno (switch, flag, mapa).
679. Auditar que ningún NPC explique mecánicas del motor en vez de hablar del mundo.
680. Verificar que los textos de instrucción al jugador sean diegéticos.
681. Auditar los diálogos de derrota y que nunca humillen al jugador ni al rival.
682. Verificar que ningún texto prometa algo que el juego no cumpla.
683. Auditar las promesas narrativas abiertas y cerrarlas en el epílogo.
684. Verificar que el epílogo mencione las dimensiones realmente completadas por el jugador.
685. Auditar la voz del narrador y mantenerla consistente en todo el DLC.
686. Verificar que el tono de creepypasta no caiga en gore gratuito ni en parodia.
687. Auditar que los mundos creepypasta conserven su esencia con voz propia del proyecto.
688. Verificar que ningún texto copie líneas de las ROM invitadas ni de sus fangames.
689. Auditar las referencias culturales y eliminarlas si no aportan.
690. Verificar que los chistes, si existen, no rompan la tensión de las misiones serias.
691. Auditar la longitud media de los diálogos por mapa para que ninguno canse.
692. Verificar que ningún mapa tenga más de tres NPC con bloques de texto largos.
693. Auditar los textos repetidos literalmente en más de un mapa y justificar o reescribir.
694. Verificar que cada dimensión tenga al menos una frase memorable propia.
695. Auditar el glosario del proyecto y aplicarlo en todos los textos.
696. Verificar que los nombres de las medallas y diplomas coincidan con los documentos.
697. Auditar los textos de los menús nuevos y su alineación con el estilo de los originales.
698. Verificar que ningún menú nuevo tape la interfaz original en resoluciones pequeñas.
699. Auditar el QA narrativo con `docs/QA_NARRATIVO_ATLAS.md` y ampliarlo al resto del DLC.
700. Cerrar el bloque de diálogos con el volcado revisado, sin cajas vacías y sin textos en inglés.
701. Auditar los atavíos de Ash: base, Atlas, creepypasta, Glazed, Liquid Crystal, Team Rocket, Unbound, campeón y secreto.
702. Verificar que cada atavío tenga sus cuatro direcciones y sus pasos completos.
703. Auditar que el cambio de atavío se refleje en el overworld y en la batalla.
704. Verificar que el atavío secreto solo se active al completar todo el contenido extra.
705. Auditar que ningún atavío se pueda activar por error desde el menú de pruebas.
706. Verificar la coherencia cromática de los atavíos con la paleta GBC de cada dimensión.
707. Auditar los sprites de NPC propios del DLC y crear los que falten para evitar caras prestadas.
708. Verificar que los NPC nuevos no reutilicen el sprite de un personaje con nombre.
709. Auditar las medallas de Atlas y de Team Rocket y crear su iconografía propia.
710. Verificar que las medallas se muestren en el visor con `node tools/apply_badge_viewer.mjs --verify`.
711. Auditar los iconos de objetos nuevos y su tamaño de 24×24 o el estándar del juego.
712. Verificar que ningún objeto nuevo use el icono de otro objeto.
713. Auditar los iconos de Pokémon de las formas nuevas.
714. Verificar que los sprites de batalla de los jefes nuevos estén a la escala correcta.
715. Auditar los tilesets propios del DLC y que no mezclen estilos incompatibles.
716. Verificar que cada tileset nuevo tenga su entrada en `Tilesets.rxdata` con nombre y gráfico correctos.
717. Auditar las autotiles de los tilesets nuevos y sus costuras.
718. Verificar que las paletas de los tilesets nuevos no rompan las sombras del render de mkxp.
719. Auditar la referencia visual de cada región con `npm run verify:map-reference`.
720. Verificar que las imágenes de referencia de mapas (PNG) se regeneren tras cada cambio grande.
721. Auditar `docs/REFERENCIA_VISUAL_ANCLA26.md` y `docs/REFERENCIA_VISUAL_ATLAS_MACRO01.md` y `MACRO02.md`.
722. Verificar que las referencias visuales no se suban al repositorio si superan el tamaño permitido o se ignoren correctamente.
723. Auditar que `.gitignore` cubra los backups, las partidas y los archivos de análisis pesados.
724. Verificar que ningún archivo de partida (`*.rxdata` de save) esté en el repositorio.
725. Auditar que `Game1.rxdata` y `Game2.rxdata` de la raíz no sean partidas reales del jugador.
726. Verificar que el arte fuente de Dimensional Nightmare en `reference/` esté correctamente documentado.
727. Auditar `docs/DIMENSIONAL_NIGHTMARE/08_SPRITES_Y_ASSETS.md` contra los assets instalados.
728. Verificar que el arte de Pokégods y DN no se mezcle entre carpetas.
729. Auditar la nomenclatura de todos los PNG nuevos y su consistencia con los existentes.
730. Verificar que ningún PNG nuevo tenga canal alfa mal recortado en los bordes.
731. Auditar el pipeline de generación de imágenes y su límite de 10 por turno.
732. Verificar que el arte generado se retoque después para encajar en la paleta del juego.
733. Auditar que el arte generado no incluya texto ni marcas de agua.
734. Verificar la resolución de destino de cada tipo de sprite según su uso.
735. Auditar los fondos de batalla nuevos y su compatibilidad con el render.
736. Verificar que los fondos de batalla no tapen la interfaz de combate.
737. Auditar los retratos de diálogo, si existen, y su coherencia de estilo.
738. Verificar que ningún retrato nuevo aparezca con fondo blanco.
739. Auditar las transiciones gráficas de entrada a dimensión y su duración.
740. Verificar que las cinemáticas nuevas no usen imágenes que no estén licenciadas o atribuidas.
741. Auditar la atribución del arte externo en `ashsprites/README` y en un `CREDITS` del proyecto.
742. Verificar que el proyecto no distribuya arte de fangames ajenos sin permiso.
743. Auditar que los sprites de ROM invitada se usen solo como referencia estructural.
744. Verificar que los mapas de campaña se construyan con recursos propios de Fire Ash.
745. Auditar la política del proyecto en `content/rom_campaigns_complete.json` (`policy`) y respetarla.
746. Verificar que ningún plano automático se presente como recreación verificada del fangame.
747. Auditar la documentación que explica esta política y ampliarla al arte de este plan.
748. Verificar que todos los assets nuevos tengan una fase de este plan asociada.
749. Auditar el inventario final de assets del DLC con conteo y hashes.
750. Cerrar el bloque de arte con el inventario en verde y sin recursos huérfanos.
751. Auditar la banda sonora del DLC con `npm run verify:ambience` y `node tools/apply_dlc_ambience.mjs --verify`.
752. Confirmar que cada uno de los 17 mapas nuevos suene su pista al entrar.
753. Auditar la música de las cinco campañas ROM y completar las que no tengan tema propio.
754. Verificar que Liquid Crystal tenga tema de ciudad, ruta y combate de gimnasio.
755. Auditar el audio de Dimensional Nightmare con `npm run dn:audio:verify`.
756. Verificar que Monte Silver tenga ventisca, silencio tenso y tema de cumbre.
757. Auditar las siete emisiones y que cada una tenga su capa sonora propia.
758. Verificar que Ciudad Glitch use estática y no un tema musical limpio.
759. Auditar la degradación progresiva de la música en la emisión de 1996.
760. Verificar que ningún BGM se corte en seco al abrir un diálogo.
761. Auditar el volumen relativo de BGM y SE nuevos frente a los originales.
762. Verificar que ningún SE nuevo sature al reproducirse junto a otro.
763. Auditar los sonidos de portal, sello, medalla y diploma.
764. Verificar que el sonido de sello se reproduzca una sola vez por emisión purgada.
765. Auditar la música de los 40 pisos de La Ruta de Dios y su escalada por piso.
766. Verificar que la música de Arceus cambie por fase.
767. Auditar el silencio antes del ataque final de Arceus y su impacto dramático.
768. Verificar que la música de victoria contra Arceus sea distinta de la de derrota.
769. Auditar las pistas que suenan en los hub y su rotación.
770. Verificar que la música de fondo en Kirin no se corte al cambiar de mapa rápido.
771. Auditar el peso total de audio del DLC y evitar duplicados.
772. Verificar que ningún archivo de audio nuevo esté corrupto o a 0 bytes.
773. Auditar los formatos de audio aceptados por el motor y convertirlos si hace falta.
774. Verificar que las pistas nuevas tengan bucle sin salto audible.
775. Cerrar el bloque de audio con `npm run verify:ambience`, `dn:audio:verify` y una escucha de prueba documentada.
776. Fijar la regla de escalado: nada del contenido extra se abre antes del duelo contra Arceus.
777. Auditar que el switch 429 de postgame sea condición de entrada de todos los accesos extra.
778. Verificar que el switch 870 de Volus no se pueda activar antes de las 17 Tablas del Génesis.
779. Auditar que el switch 876 abra las cinco campañas ROM solo tras La Ruta de Dios.
780. Verificar que los lobbies 2200 y 2210 no permitan zarpar antes de tiempo.
781. Auditar la progresión dentro de cada dimensión: primer jefe, jefe medio y jefe final.
782. Verificar que cada dimensión tenga una curva de niveles ascendente y documentada.
783. Auditar el tope de nivel del juego y el parche de niveles extendidos (`apply_extended_level_cap.mjs`).
784. Verificar que Arceus nivel 200 siga siendo el único caso de nivel extremo.
785. Auditar que los jefes postgame no superen el nivel 150 salvo Arceus y su canon.
786. Verificar la economía del postgame: dinero, objetos de curación y precios de tienda.
787. Auditar que ninguna dimensión deje al jugador sin acceso a curación.
788. Verificar que la curación esté siempre a menos de un mapa de distancia en zonas de jefes.
789. Auditar la mochila libre en combate y su coherencia con la dificultad.
790. Verificar que la dificultad no dependa de objetos consumibles infinitos.
791. Auditar las recompensas por jefe y que ninguna rompa el equilibrio del juego.
792. Verificar que las recompensas únicas se entreguen una sola vez y queden registradas.
793. Auditar la revancha y que nunca sea obligatoria.
794. Verificar que perder contra un jefe no elimine objetos ni progreso.
795. Auditar la persistencia de derrota permitida: reintentar cuando quieras.
796. Verificar que ninguno de los 40 combates de La Ruta de Dios deje un estado a medias.
797. Auditar el orden recomendado de contenido y publicarlo en `docs/INSTALAR_Y_JUGAR.md`.
798. Verificar que ese orden no contradiga el desbloqueo libre por dimensiones.
799. Auditar las instrucciones al jugador dentro del juego (menú y hub) sobre qué hacer después.
800. Verificar que el juego avise qué falta para abrir la Liga Oscura.
801. Auditar el aviso de "puedes volver cuando quieras" en cada dimensión.
802. Verificar que ninguna dimensión prometa recompensas que no dé.
803. Auditar la repetibilidad: qué se puede rejugar y qué no.
804. Verificar que lo rejugable no duplique objetos únicos.
805. Auditar la progresión de medallas y diplomas de punta a punta.
806. Verificar que cada medalla tenga un lugar visible en la interfaz.
807. Auditar que el jugador pueda saber en cualquier momento qué le falta.
808. Verificar que el hub de Oak dé ese resumen sin obligar a volver a cada dimensión.
809. Auditar el escalado de los encuentros salvajes por zona y su coherencia con la curva.
810. Verificar que ninguna zona salvaje quede con niveles por debajo del postgame.
811. Auditar el equilibrio de los equipos de los jefes: sin seis Pokémon del mismo tipo.
812. Verificar que los jefes tengan cobertura contra sus debilidades obvias.
813. Auditar que ningún jefe use un movimiento que su Pokémon no pueda aprender.
814. Verificar que los equipos de los jefes no repitan el mismo Pokémon dos veces sin justificación.
815. Auditar los objetos equipados de los jefes y su efecto real.
816. Verificar que ningún jefe dependa de un objeto que no exista.
817. Auditar la IA de los jefes y que no cometa errores que rompan la dificultad.
818. Verificar que los jefes usen estrategias distintas entre sí.
819. Auditar las nueve eras de la Vía y su escalado interno.
820. Verificar que la Vía de las Nueve Eras sea un recorrido opcional coherente y no un pasillo de relleno.
821. Auditar que las 500 aventuras de Horizontes tengan un escalado propio dentro de su reino.
822. Verificar que las 40 anclas de Atlas representen 40 picos de dificultad reales.
823. Auditar que Atlas tenga jefes intermedios además de las anclas.
824. Verificar que el jugador pueda abandonar Atlas en cualquier momento y volver.
825. Cerrar el bloque de escalado con una tabla de progresión publicada en `docs/qa/progresion.md`.
826. Ejecutar la partida de punta a punta guiada por `docs/QA_MANUAL_PLAYTEST.md`.
827. Registrar cada sesión de prueba con fecha, duración, versión y hallazgos.
828. Probar el arranque en frío desde el menú principal hasta el primer guardado.
829. Probar la carga de una partida guardada antes del duelo de Arceus y su comportamiento.
830. Probar la carga de una partida guardada después del duelo y la entrada al postgame.
831. Probar el duelo completo contra Arceus y sus seis fases sin guardado intermedio.
832. Probar la captura de Arceus y su aparición junto a Oak.
833. Probar las siete emisiones en orden inverso al documentado.
834. Probar la Liga Oscura con los siete sellos completos.
835. Probar perder contra cada jefe final y reintentar.
836. Probar guardar y cargar dentro de cada dimensión.
837. Probar la salida de emergencia de cada dimensión.
838. Probar Atlas Mil con al menos una franja completa de bloques.
839. Probar ciudad Teckel y la escena de Maxine.
840. Probar Isla Espejo y la captura de un Pokégod en cada forma.
841. Probar Glazed y Light Platinum de entrada a gimnasio.
842. Probar Liquid Crystal, TFOH y Unbound en su primer tramo y en su jefe.
843. Probar las cinco misiones de Team Rocket en una sola partida.
844. Probar el disfraz de Rocket y su retirada.
845. Probar los movimientos de campo sin medallas.
846. Probar la mochila libre en combate en cada tipo de combate.
847. Probar el menú Z y el menú de estado tras cada desbloqueo.
848. Probar el juego en ventana pequeña y a pantalla completa.
849. Probar el juego con mando y con teclado.
850. Probar el juego en Android con Kirin.
851. Probar el juego con la APK de PokeMod Studio como editor en paralelo.
852. Probar que el editor no escriba en las partidas durante todo el recorrido.
853. Probar el deshacer y rehacer del editor sobre un mapa del DLC.
854. Probar la auditoría del editor sobre el contenido nuevo.
855. Probar la exportación ZIP desde el editor y su reimportación.
856. Probar el modo lectura sin permisos de escritura.
857. Medir el tiempo de arranque del juego con todo el DLC instalado.
858. Medir el uso de memoria en las zonas con más eventos.
859. Medir la tasa de refresco en Kirin y anotarla.
860. Corregir cualquier ralentización detectada por clima, parallax o eventos animados.
861. Auditar el peso final de la carpeta `Data/` y compararla con la inicial.
862. Auditar el peso final de `Graphics/` y eliminar duplicados exactos.
863. Auditar el peso final de `Audio/` y confirmar que no hay pistas repetidas.
864. Reconstruir el paquete con `npm run build:package` y verificar con `npm run verify:package`.
865. Reconstruir el ZIP de scripts corregidos con `npm run build:corregido:zip`.
866. Verificar el ZIP con `npm run verify:corregido:zip`.
867. Reconstruir el paquete de QA de Dimensional Nightmare con `npm run build:dn:qa`.
868. Verificar con `npm run verify:dn:qa`.
869. Sincronizar el paquete de La Ruta de Dios con `npm run sync:ruta_de_dios:package`.
870. Verificar con `npm run verify:ruta_de_dios:package`.
871. Reconstruir el paquete de expansión con `npm run build:expansion:package` si aplica tras los cambios.
872. Verificar con `npm run verify:expansion:package`.
873. Regenerar el paquete de referencia de mapas con `npm run create:map-reference`.
874. Verificar con `npm run verify:map-reference`.
875. Regenerar los informes de Atlas con `npm run render:atlas:macro02` y sus equivalentes Tier 2.
876. Actualizar `docs/ESTADO_CONGELADO.md` con el inventario final y los hashes.
877. Actualizar `docs/PROMPT_MAESTRO_Y_ESTADO.md` con lo que ahora está hecho y lo que queda.
878. Actualizar `docs/DLC_TOTAL.md` con los pilares completados.
879. Actualizar `docs/ENTREGA_PROYECTO.md` y `docs/ENTREGA_DLC_COMPLETO.md` con la entrega de las 900 fases.
880. Actualizar `docs/INSTALAR_Y_JUGAR.md` con la ruta completa del contenido extra.
881. Añadir un `CHANGELOG` del plan de 900 fases con los cambios agrupados por bloque.
882. Documentar en `docs/qa/limites_conocidos.md` lo que sigue fuera de alcance y por qué.
883. Confirmar que los cinco pilares (Ruta de Dios, creepypastas, Atlas, dimensiones invitadas, Isla Espejo) están al nivel declarado.
884. Confirmar que el sexto pilar (Team Rocket) tiene las cinco misiones completas.
885. Confirmar que la Liga Oscura es alcanzable y su Diploma obtenible.
886. Confirmar que las cinco campañas ROM son regiones explorables y no dos habitaciones.
887. Confirmar que el dinámismo está medido y documentado por mapa.
888. Confirmar que la calidad GBC está aplicada en tilesets, sprites y colisión.
889. Confirmar que los sprites de Ash cubren todas las dimensiones y atavíos.
890. Confirmar que los mapas de Atlas Mil cumplen el estándar visual del sector 01.
891. Confirmar que no queda ninguna llamada de script colgante.
892. Confirmar que no queda ningún diálogo roto, repetido sin motivo o en otro idioma.
893. Confirmar que no queda ningún recurso referenciado y ausente.
894. Confirmar que no queda ningún flag huérfano ni ninguna variable sin lector.
895. Confirmar que ningún contenido extra es alcanzable antes de La Ruta de Dios.
896. Confirmar que todas las dimensiones tienen retorno libre y guardado seguro.
897. Confirmar que la CI ejecuta `npm run verify:all` y `npm run plan900:check` en verde.
898. Publicar la entrega final con el ZIP, los informes y el registro de las 900 fases cerrado.
899. Hacer una última partida de punta a punta sobre la entrega publicada y firmar el acta en `docs/qa/acta_final.md`.
900. Cerrar el proyecto declarando las 900 fases completadas, con cada verificador en verde y cero errores conocidos.
