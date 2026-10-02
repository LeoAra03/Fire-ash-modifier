# EXPERIENCIA POR MAPA — cada mapa, una experiencia distinta

> Generado por `tools/dn_plan_experience.mjs` (regenerar con `npm run dn:plan:mapas`). Los
> arquetipos y ganchos son la **propuesta base aprobable**; el estado de errores sale de la
> auditoría real (`npm run dn:audit`).

## 1. Reglas de diferenciación (obligatorias)

1. **Un gancho por mapa**: cada mapa tiene una cosa que sólo pasa ahí (una mano, una foto, un eco).
2. **Contraste de vecinos**: dos mapas consecutivos **nunca** comparten arquetipo (lo comprueba
   este mismo plan: sin repeticiones en la lista actual).
3. **Ritmo alterno**: a un mapa largo le sigue uno corto; el descanso es parte del diseño.
4. **Sensación continua**: el tono de pantalla del mundo se mantiene (ver doc 14 §2) y cambia
   sólo al cambiar de mundo — la variedad viene del **espacio**, no de teñir la pantalla distinto.
5. **Una lectura por mapa**: el jugador debe poder decir en una frase qué hacía ahí.
6. **Nada de mapas de relleno**: si un mapa no aporta gancho, se fusiona con su vecino.

## 2. Arquetipos (el vocabulario del tramo)

- **umbral** — llegada y contrato: gancho tipo «una puerta que sólo abre con lo que traes», mecánica «transferencia con condición», ritmo corto.
- **camara** — clímax contenido: gancho tipo «el jefe del tramo observa desde el fondo», mecánica «fase B por pasos», ritmo largo.
- **archivo** — memoria acumulada: gancho tipo «estanterías que responden al progreso», mecánica «NPC que lee tus sellos», ritmo medio.
- **laberinto** — desorientación controlada: gancho tipo «un camino que se cierra detrás de ti», mecánica «pasajes con retorno distinto», ritmo medio.
- **via** — travesía: gancho tipo «un corredor con un destino visible al fondo», mecánica «línea recta con hitos», ritmo corto.
- **plaza** — respiro social: gancho tipo «el único lugar donde alguien te habla sin miedo», mecánica «NPCs con 5 estados de visita», ritmo medio.
- **fosa** — descenso: gancho tipo «la luz queda arriba», mecánica «pendiente y niebla», ritmo medio.
- **torre** — ascenso: gancho tipo «cada piso enseña algo nuevo del mundo», mecánica «plataformas y atajos», ritmo largo.
- **eco** — algo repite lo que haces: gancho tipo «tu propio paso con retraso», mecánica «evento que copia tu posición», ritmo corto.
- **altar** — cierre: gancho tipo «el mundo se ordena alrededor de una figura», mecánica «sellado y salida al hub», ritmo largo.
- **cripta** — intimidad funeraria: gancho tipo «los nombres de los que cayeron», mecánica «inspección de lápidas», ritmo medio.
- **glitch** — el mundo se equivoca: gancho tipo «una celda que no debería existir», mecánica «tiles corruptos y parpadeo», ritmo corto.
- **nucleo** — última verdad: gancho tipo «el origen de la corrupción», mecánica «escena larga + decisión», ritmo largo.
- **colegio** — costumbre y rutina rota: gancho tipo «un aula que sigue en clase», mecánica «cátedras que siguen el guion», ritmo medio.
- **espejo** — identidad invertida: gancho tipo «un doble que no se mueve igual», mecánica «comparación de posición», ritmo medio.
- **vacio** — ausencia total: gancho tipo «nada responde, ni el viento», mecánica «oscuridad con luz propia», ritmo corto.
- **coro** — muchos ojos, una voz: gancho tipo «letras que cantan en orden», mecánica «siete estaciones», ritmo largo.
- **pueblo** — vida detenida: gancho tipo «casas abiertas y nadie dentro», mecánica «puertas inspeccionables», ritmo medio.
- **ladera** — esfuerzo físico: gancho tipo «el viento empuja hacia atrás», mecánica «hielo resbaladizo», ritmo medio.
- **cumbre** — silencio absoluto: gancho tipo «desde arriba no se ve nada», mecánica «ventisca que baja la visión», ritmo largo.
- **casa** — intimidad doméstica rota: gancho tipo «una casa que canta», mecánica «habitaciones con nana», ritmo medio.
- **jardin** — belleza equivocada: gancho tipo «flores que siguen al jugador», mecánica «pétalos que marcan caminos», ritmo medio.
- **pasillo** — urgencia: gancho tipo «puertas que se cierran al pasar», mecánica «velocidad obligatoria», ritmo corto.
- **calle** — ciudad sin nadie: gancho tipo «semáforos que siguen funcionando», mecánica «luces que delatan», ritmo medio.
- **mausoleo** — duelo privado: gancho tipo «una foto en blanco», mecánica «objetos de historia», ritmo medio.
- **mercado** — negocio fantasma: gancho tipo «precios de algo que ya no existe», mecánica «intercambio de objetos», ritmo corto.
- **tren** — huida: gancho tipo «un vagón que no para», mecánica «pasillo móvil», ritmo corto.
- **templo** — reverencia: gancho tipo «una letra por columna», mecánica «orden correcto», ritmo largo.
- **falla** — grieta en la realidad: gancho tipo «el código se ve por debajo», mecánica «tiles del archivo», ritmo medio.
- **sala** — reunión: gancho tipo «todo lo que hiciste está aquí», mecánica «lectura de flags», ritmo largo.
- **portico** — antesala del fin: gancho tipo «un custodio que avisa», mecánica «NPC de advertencia», ritmo medio.
- **arena** — juicio: gancho tipo «el público es la tormenta», mecánica «prueba de vínculo por pasos», ritmo largo.

## 3. Tabla por mapa (103 mapas)

| Mapa | Título | Arquetipo | Sensación | Gancho | Mecánica | Ritmo |
|---|---|---|---|---|---|---|
| **2040** | Antesala de las Grietas | sala | reunión | la antesala de las grietas | lectura de flags | largo (primer mapa del tramo) |
| **2041** | Catacumbas — Entrada Arqueada | umbral | llegada y contrato | una mano impresa que sigue ahí | transferencia con condición | corto (primer mapa del tramo) |
| **2042** | Catacumbas — Sala de las Urnas | cripta | intimidad funeraria | un sepulturero que te confunde con un familiar | inspección de lápidas | medio (tras «umbral») |
| **2043** | Catacumbas — Celdas | pasillo | urgencia | velas que se apagan al pasar | velocidad obligatoria | corto (tras «cripta») |
| **2044** | Catacumbas — Galería de Barrotes | fosa | descenso | un pozo que devuelve susurros | pendiente y niebla | medio (tras «pasillo») |
| **2045** | Catacumbas — Escalera del Arco | archivo | memoria acumulada | un archivero que anota tu nombre | NPC que lee tus sellos | medio (tras «fosa») |
| **2046** | Catacumbas — Cripta de Sarcófagos | plaza | respiro social | el único lugar con luz | NPCs con 5 estados de visita | medio (tras «archivo») |
| **2047** | Catacumbas — Osario | laberinto | desorientación controlada | pasillos que cambian de orden | pasajes con retorno distinto | medio (tras «plaza») |
| **2048** | Catacumbas — Jardín de Raíces | eco | algo repite lo que haces | tu propio paso con retraso | evento que copia tu posición | corto (tras «laberinto») |
| **2049** | Catacumbas — Pasadizo que Respira | cripta | intimidad funeraria | una lápida con tu fecha | inspección de lápidas | medio (tras «eco») |
| **2050** | Catacumbas — Galería de Mausoleos | pasillo | urgencia | puertas que se cierran al pasar | velocidad obligatoria | corto (tras «cripta») |
| **2051** | Catacumbas — Sala de Pedestales | fosa | descenso | el descenso al osario | pendiente y niebla | medio (tras «pasillo») |
| **2052** | Catacumbas — Capilla de la Campana | archivo | memoria acumulada | libros que se reescriben | NPC que lee tus sellos | medio (tras «fosa») |
| **2053** | Catacumbas — Sala de las Bestias | plaza | respiro social | un pueblo bajo tierra | NPCs con 5 estados de visita | medio (tras «archivo») |
| **2054** | Catacumbas — Pared de Inscripciones | laberinto | desorientación controlada | un camino que se pierde | pasajes con retorno distinto | medio (tras «plaza») |
| **2055** | Catacumbas — Sala Ritual | umbral | llegada y contrato | la última puerta | transferencia con condición | corto (tras «laberinto») |
| **2056** | Catacumbas — Cámara de la Mano | camara | clímax contenido | la cámara del jefe | fase B por pasos | largo (tras «umbral») |
| **2057** | Pueblo Sin Color — Entrada | pueblo | vida detenida | un pueblo sepia que no reacciona | puertas inspeccionables | medio (primer mapa del tramo) |
| **2058** | Calle de las Casas Huecas | umbral | llegada y contrato | el umbral del cartucho | transferencia con condición | corto (tras «pueblo») |
| **2059** | Plaza de la Fuente Seca | casa | intimidad doméstica rota | una casa que debería estar vacía | habitaciones con nana | medio (tras «umbral») |
| **2060** | Callejón de Escombros | eco | algo repite lo que haces | una firma idéntica a la tuya | evento que copia tu posición | corto (tras «casa») |
| **2061** | Bosque de Troncos | archivo | memoria acumulada | registros de entrenadores borrados | NPC que lee tus sellos | medio (tras «eco») |
| **2062** | Páramo de Árboles Secos | torre | ascenso | la torre de radio muerta | plataformas y atajos | largo (tras «archivo») |
| **2063** | Estanque Estancado | mercado | negocio fantasma | un mercado sin vendedores | intercambio de objetos | corto (tras «torre») |
| **2064** | Puente de Madera Podrida | pasillo | urgencia | pasillos de cintas | velocidad obligatoria | corto (tras «mercado») |
| **2065** | Colina de la Iglesia | casa | intimidad doméstica rota | la habitación de Silver | habitaciones con nana | medio (tras «pasillo») |
| **2066** | Cementerio Cercado | eco | algo repite lo que haces | el eco de una batalla perdida | evento que copia tu posición | corto (tras «casa») |
| **2067** | Mausoleo Central | archivo | memoria acumulada | la caja de los olvidados | NPC que lee tus sellos | medio (tras «eco») |
| **2068** | Cementerio Grande | plaza | respiro social | la plaza del pueblo | NPCs con 5 estados de visita | medio (tras «archivo») |
| **2069** | Estación Abandonada | torre | ascenso | el último piso de la torre | plataformas y atajos | largo (tras «plaza») |
| **2070** | Biblioteca Polvorienta | umbral | llegada y contrato | la salida que no sale | transferencia con condición | corto (tras «torre») |
| **2071** | Campanario | pasillo | urgencia | el corredor final | velocidad obligatoria | corto (tras «umbral») |
| **2072** | Torre de la Escalera de Caracol | camara | clímax contenido | el duelo con el Sin Nombre | fase B por pasos | largo (tras «pasillo») |
| **2073** | Cara Norte — Vereda Helada | via | travesía | la ruta blanca | línea recta con hitos | corto (primer mapa del tramo) |
| **2074** | Acantilado de Zetas | ladera | esfuerzo físico | una ladera que empuja | hielo resbaladizo | medio (tras «via») |
| **2075** | Sendero de la Cornisa | fosa | descenso | el descenso al lago | pendiente y niebla | medio (tras «ladera») |
| **2076** | Cabaña del Montañés | cumbre | silencio absoluto | la cumbre sin vista | ventisca que baja la visión | largo (tras «fosa») |
| **2077** | Lago Congelado | via | travesía | la ruta de los que subieron | línea recta con hitos | corto (tras «cumbre») |
| **2078** | Pueblo de la Niebla | ladera | esfuerzo físico | la ladera del viento | hielo resbaladizo | medio (tras «via») |
| **2079** | Pueblo Alto | eco | algo repite lo que haces | un eco en la nieve | evento que copia tu posición | corto (tras «ladera») |
| **2080** | Cueva de Bloques de Hielo | cumbre | silencio absoluto | la cumbre del silencio | ventisca que baja la visión | largo (tras «eco») |
| **2081** | Entrada de Cueva | fosa | descenso | la fosa helada | pendiente y niebla | medio (tras «cumbre») |
| **2082** | Caverna de Estalactitas | plaza | respiro social | el refugio de los montañeros | NPCs con 5 estados de visita | medio (tras «fosa») |
| **2083** | Cámara de los Dos Lagos | via | travesía | la ruta corta | línea recta con hitos | corto (tras «plaza») |
| **2084** | Grieta Estrecha | ladera | esfuerzo físico | la ladera de las huellas | hielo resbaladizo | medio (tras «via») |
| **2085** | Cámara de Cristales | cumbre | silencio absoluto | la cumbre del Testigo | ventisca que baja la visión | largo (tras «ladera») |
| **2086** | Templo de las Estatuas | glitch | el mundo se equivoca | una grieta en el hielo | tiles corruptos y parpadeo | corto (tras «cumbre») |
| **2087** | Corazón del Monte | umbral | llegada y contrato | el último tramo | transferencia con condición | corto (tras «glitch») |
| **2088** | Bosque Dormido — Entrada | pueblo | vida detenida | el pueblo que duerme | puertas inspeccionables | medio (primer mapa del tramo) |
| **2089** | Senda del Cartel Torcido | casa | intimidad doméstica rota | la casa de la nana | habitaciones con nana | medio (tras «pueblo») |
| **2090** | Puente de Piedra | colegio | costumbre y rutina rota | el aula que sigue en clase | cátedras que siguen el guion | medio (tras «casa») |
| **2091** | Cabaña de las Ventanas | pasillo | urgencia | el pasillo de las cunas | velocidad obligatoria | corto (tras «colegio») |
| **2092** | Arco de Niebla Púrpura | jardin | belleza equivocada | el jardín que canta | pétalos que marcan caminos | medio (tras «pasillo») |
| **2093** | Cementerio del Bosque | casa | intimidad doméstica rota | la habitación de arriba | habitaciones con nana | medio (tras «jardin») |
| **2094** | Campo de Flores Moradas | colegio | costumbre y rutina rota | el patio del recreo | cátedras que siguen el guion | medio (tras «casa») |
| **2095** | Campamento de Tiendas | eco | algo repite lo que haces | el eco de la nana | evento que copia tu posición | corto (tras «colegio») |
| **2096** | Boca de la Cueva Negra | jardin | belleza equivocada | el jardín trasero | pétalos que marcan caminos | medio (tras «eco») |
| **2097** | Árboles Retorcidos | plaza | respiro social | la plaza del pueblo | NPCs con 5 estados de visita | medio (tras «jardin») |
| **2098** | Estanque de Nenúfares | pueblo | vida detenida | la calle de los dormidos | puertas inspeccionables | medio (tras «plaza») |
| **2099** | Muro de Ruinas | pasillo | urgencia | el pasillo largo | velocidad obligatoria | corto (tras «pueblo») |
| **2100** | Granero Abandonado | colegio | costumbre y rutina rota | el aula del fondo | cátedras que siguen el guion | medio (tras «pasillo») |
| **2101** | Bosque de Luciérnagas | jardin | belleza equivocada | el jardín de los nombres | pétalos que marcan caminos | medio (tras «colegio») |
| **2102** | Muro del Pasaje | umbral | llegada y contrato | la puerta del sótano | transferencia con condición | corto (tras «jardin») |
| **2103** | Árbol Anciano | camara | clímax contenido | la cámara de la Nana | fase B por pasos | largo (tras «umbral») |
| **2104** | Pueblo 000 — Entrada | calle | ciudad sin nadie | la ciudad sin nadie | luces que delatan | medio (primer mapa del tramo) |
| **2105** | Calle Incompleta | vacio | ausencia total | el vacío que responde | oscuridad con luz propia | corto (tras «calle») |
| **2106** | Plaza sin Fuente | espejo | identidad invertida | tu doble un paso tarde | comparación de posición | medio (tras «vacio») |
| **2107** | Callejón Terminado | mausoleo | duelo privado | el mausoleo privado | objetos de historia | medio (tras «espejo») |
| **2108** | Bosque Sin Troncos | calle | ciudad sin nadie | la avenida de los escaparates | luces que delatan | medio (tras «mausoleo») |
| **2109** | Páramo Blanco | vacio | ausencia total | la nada entre edificios | oscuridad con luz propia | corto (tras «calle») |
| **2110** | Estanque Vacío | tren | huida | el tren que no para | pasillo móvil | corto (tras «vacio») |
| **2111** | Puente Cortado | espejo | identidad invertida | el espejo del andén | comparación de posición | medio (tras «tren») |
| **2112** | Colina Erguida | mausoleo | duelo privado | la foto en blanco | objetos de historia | medio (tras «espejo») |
| **2113** | Cementerio Vacío | eco | algo repite lo que haces | el eco del jugador 000 | evento que copia tu posición | corto (tras «mausoleo») |
| **2114** | Mausoleo Abierto | calle | ciudad sin nadie | la calle del cartel roto | luces que delatan | medio (tras «eco») |
| **2115** | Estación 000 | glitch | el mundo se equivoca | la celda que no existe | tiles corruptos y parpadeo | corto (tras «calle») |
| **2116** | Biblioteca sin Letras | nucleo | última verdad | el núcleo del cartucho | escena larga + decisión | largo (tras «glitch») |
| **2117** | Campanario Roto | vacio | ausencia total | el vacío final | oscuridad con luz propia | corto (tras «nucleo») |
| **2118** | Pueblo 404 | umbral | llegada y contrato | la última puerta | transferencia con condición | corto (tras «vacio») |
| **2119** | El Borde del Mundo | camara | clímax contenido | la cámara del Jugador 000 | fase B por pasos | largo (tras «umbral») |
| **2120** | Atrio de las Letras | cripta | intimidad funeraria | la cripta de las letras | inspección de lápidas | medio (primer mapa del tramo) |
| **2121** | Sala de la Inscripción | templo | reverencia | el templo de las columnas | orden correcto | largo (tras «cripta») |
| **2122** | Corredor de Columnas | coro | muchos ojos, una voz | el coro de los siete ojos | siete estaciones | largo (tras «templo») |
| **2123** | Biblioteca Prohibida | glitch | el mundo se equivoca | una celda imposible | tiles corruptos y parpadeo | corto (tras «coro») |
| **2124** | Balcón de los Unown | templo | reverencia | el templo interior | orden correcto | largo (tras «glitch») |
| **2125** | Sala del Ojo | coro | muchos ojos, una voz | el coro que se ordena | siete estaciones | largo (tras «templo») |
| **2126** | Escalinata Interior | cripta | intimidad funeraria | la cripta profunda | inspección de lápidas | medio (tras «coro») |
| **2127** | Cripta de Sarcófagos | glitch | el mundo se equivoca | el glitch que te mira | tiles corruptos y parpadeo | corto (tras «cripta») |
| **2128** | Sala de los Símbolos | templo | reverencia | el templo del rey | orden correcto | largo (tras «glitch») |
| **2129** | Caverna de Cristales | coro | muchos ojos, una voz | el coro final | siete estaciones | largo (tras «templo») |
| **2130** | Galería Inundada | eco | algo repite lo que haces | el eco del trono | evento que copia tu posición | corto (tras «coro») |
| **2131** | Salón de las Estatuas | glitch | el mundo se equivoca | el glitch del nombre | tiles corruptos y parpadeo | corto (tras «eco») |
| **2132** | Galería Menor | nucleo | última verdad | el núcleo del Rey sin Letra | escena larga + decisión | largo (tras «glitch») |
| **2133** | Sala del Trono | coro | muchos ojos, una voz | el coro de los Unown | siete estaciones | largo (tras «nucleo») |
| **2134** | Sala LEAVENOW | umbral | llegada y contrato | la última puerta | transferencia con condición | corto (tras «coro») |
| **2135** | Cámara de KINGGUS | camara | clímax contenido | la cámara de KINGGUS | fase B por pasos | largo (tras «umbral») |
| **2136** | Nexo — Falla Cero | falla | grieta en la realidad | la falla que reunió todo | tiles del archivo | medio (primer mapa del tramo) |
| **2137** | Nexo — Pueblo Reensamblado | pueblo | vida detenida | el pueblo reensamblado | puertas inspeccionables | medio (tras «falla») |
| **2138** | Nexo — Centro Pokémon Sumergido | plaza | respiro social | el centro que aún cura | NPCs con 5 estados de visita | medio (tras «pueblo») |
| **2139** | Nexo — Pasillo de Código | via | travesía | el pasillo de código | línea recta con hitos | corto (tras «plaza») |
| **2140** | Nexo — Sala del Testigo | sala | reunión | la sala del Testigo | lectura de flags | largo (tras «via») |
| **2141** | Liga Oscura — Pórtico del Código | portico | antesala del fin | el custodio que avisa | NPC de advertencia | medio (primer mapa del tramo) |
| **2142** | Liga Oscura — Coliseo del Vínculo | arena | juicio | la tormenta que corre | prueba de vínculo por pasos | largo (tras «portico») |

## 4. Estado de la auditoría (2026-10-02)

| Comprobación | Resultado |
|---|---|
| Mapas auditados | 103 |
| Errores | **0** |
| Avisos | **0** |

Sin errores ni avisos: gráficos, transferencias, tilesets, audio, objetos, trainers, flags y tonos están consistentes.

## 5. Correcciones aplicadas y pendientes

### Aplicadas en esta pasada
| Tipo | Hallazgo | Corrección |
|---|---|---|
| NPC | 39 eventos con gráficos declarados con extensión (sprite invisible en juego) | gráficos sin extensión: trchar000, UNOWN, DN_MADPIKA, Object ball special |
| BATTLE | objetos `DN_PHOTO_01..04` referenciados y no creados | fotos del Sin Nombre creadas con icono propio (y la foto en blanco de EP05 ya existe) |
| BATTLE | **NEXO**: el mapa final generaba `PBTrainer.new("HIKER", "null")` | el bloque de jefe sólo se crea si el episodio tiene jefe |
| FLAGS | 40 switches y 19 variables del ciclo sin nombre en System | `npm run dn:flags` los nombra (`DN_*` y `DN_LIGA_*`) |
| LEVEL DESIGN | muro del Coliseo atravesable | el muro exige bloqueo en las 4 direcciones; salida en la puerta |
| CINEMÁTICA | tonos sin restaurar detectados como error | se distinguen `dn:sensacion` (viaja con la transferencia) y `dn:ambiente` |

### Pendientes por categoría
| Tipo | Pendiente | Cómo se cierra |
|---|---|---|
| LEVEL DESIGN | ganchos por mapa de §3 sin implementar | pasada de guion + eventos por mapa (B6) |
| CINEMÁTICA | escenas largas del Nexo y la Liga sin recursos visuales propios | arte MEDIA (doc 08) |
| BATTLE | combate espejo real de EP05 y forma final de EP06 | equipo 120–125 aprobado + fase C |
| NPC | `trchar052` sigue sin existir (4 NPCs usan `trchar000`) | crear el sprite o aceptar la sustitución |
| TILES | tilesets `DN_*` propios usan la tabla de pasajes del juego base | revisar los pasajes finos por mapa al final de la QA |
| AUDIO | audio alterado por anomalía | composición/edición (B2) |
| CORRUPCIÓN | las 7 fases del GDD no cambian la escena todavía | plan de fase en doc 13 §F3b (tono + huecos + overlays) y verificador de fases (B7) |

## 6. La batalla de La Ruta de Dios — soluciones (M2)

| # | Problema detectado | Solución implementada |
|---|---|---|
| S1 | El Arceus capturado conservaba `@ruta_arceus_divine`, fase, restauraciones y bandera de captura | `pbArceusNormalizeCaptured` limpia los cuatro al capturar; queda sólo un Arceus nv 200 normal |
| S2 | El parche de `Pokemon#level=` permitía **nivel 200 a cualquier Arceus** | el 200 exige `@ruta_arceus_divine`; la instancia divina nace al máximo normal y sube después |
| S2b | El helper cinemático construía un Arceus nv 200 sin marcar como divino (habría fallado con S2) | `pbArceusCinematicPokemon` nace al tope normal, se marca divino y sólo entonces sube a 200 |
| S3 | `minimum_exp_for_level` recortaba a 200 en global | se mantiene el recorte (necesario para la curva del 200) pero ya sólo alcanzable por la instancia divina |
| S4 | Con el último sello roto, si el jugador seguía atacando podía **matar a Arceus** (y el guion se rompía) | con la captura abierta el daño se retiene: el desenlace es la captura |
| S5 | `pbReduceHP` consultaba fase en **todas** las batallas | la rama divina se comprueba una vez (`arceus_divine?`) y el resto va directo al motor |
| S6 | El pseudo-PC podía ofrecer **huevos** | se filtran (`!pkmn.egg?`) |
| S7 | Rendirse salía del combate sin limpiar reglas | se limpian `cannotRun`/`canLose` y se marca `RUTA_DE_DIOS_ARCEUS_RESOLVED` |
| S8 | Sin balls, la captura determinista era inalcanzable | `pbArceusEnsureCaptureBall`: el Rotom materializa una Bola del Testigo y avisa |

Verificación: `npm run verify:ruta_de_dios` comprueba las seis garantías en la sección
`PokeMod_RutaDeDios` ya instalada en `Scripts.rxdata`.
