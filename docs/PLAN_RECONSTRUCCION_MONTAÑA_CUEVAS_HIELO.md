# Plan de reconstrucción orgánica — montaña y cuevas de hielo

**Ámbito:** RPG Maker XP / Pokémon Fire Ash (tiles de 32 px; Essentials v19 en la base actual).  
**Objetivo:** sustituir la lectura de «mosaico cuadriculado» por una ruta legible, erosionada y hecha a mano, sin sacrificar colisiones, eventos, encuentros ni continuidad narrativa.

## 1. Diagnóstico y mapas objetivo

En este repositorio, el episodio EP03 de *Dimensional Nightmare / Ashen Guardian* ocupa **Map2073–Map2087**. El pipeline actual puede copiar a la capa del mapa una ficha visual de referencia a escala de juego. Eso conserva la imagen, pero no garantiza un recorrido con jerarquía espacial: se puede terminar con bordes rectos, explanadas sin función y decoración que parece estampada sobre el suelo.

La reconstrucción debe tratar las fichas R6 como **referencias de paleta y motivos**, no como planos que haya que copiar píxel por píxel. También conviene aplicar el mismo criterio a los mapas de Monte Silver ya presentes en la expansión: **Map2021 (Falda), Map2022 (Cumbre) y Map2030 (Gruta de los Testigos)**.

> No se deben cambiar dimensiones, IDs de eventos, switches, coordenadas de transferencia ni la red de progresión sin actualizar y verificar también sus dependencias. Antes del primer cambio, exportar una copia de cada `.rxdata` y un listado de eventos/transferencias.

## 2. Gramática visual común

### Geometría y lectura

- Bloquear primero tres masas, sin objetos: **macizo/roca no transitable**, **suelo transitable** y **hielo/agua o vacío**. Dibujar la ruta principal como una forma continua; añadir solo después desvíos y decoración.
- Dibujar la silueta desde fuera hacia dentro. Alternar tramos de 1, 2 y 3 tiles en el contorno; desplazar una cornisa o una pared cada 3–6 tiles. No usar una sucesión de rectángulos ni dos bordes paralelos de principio a fin.
- La ruta principal debe leerse en una captura reducida. Mantenerla, normalmente, en **2 tiles de ancho**; abrir a 3 tiles en descansos o zonas de combate. Una garganta de 1 tile puede ser un momento intencional, pero debe ser corta y tener salida visible.
- Diseñar alturas por **terrazas quebradas, repisas, taludes y pasos**, no por bandas horizontales. La nieve se acumula a sotavento; la roca aparece en bordes erosionados, cortes y zonas expuestas.
- Asimetría no significa ruido aleatorio: cada curva, roca grande y abertura debe explicar la dirección del agua, el viento, el hielo o el uso humano.

### Densidad y control del ruido visual

Usar una jerarquía por pantalla, no un relleno uniforme:

1. **Un ancla grande** por cámara o estancia (una cornisa, un lago, una estalagmita monumental, una cabaña contra la roca).
2. **Dos o tres grupos medianos** que sugieran escala y encaucen el movimiento.
3. **Tres a cinco acentos pequeños** —nieve oscura, grietas, piedras, huellas— agrupados en vez de salpicados al azar.

Como punto de partida para una pantalla natural: 60–70 % de suelo base, 20–30 % de variación secundaria en manchas irregulares y 5–10 % de acentos de alto contraste. Mantener un colchón despejado alrededor de NPCs, entradas, objetos, interactuables y cambios de dirección. No colocar más de dos focos de alto contraste en la misma vista.

- En exterior: rocas con nieve en el lado de barlovento, parches de nieve sucia bajo salientes, grava, ramas enterradas y marcas de ventisca.
- En interior: estalagmitas, estalactitas, columnas de hielo y cristales en grupos de tamaños distintos; alternar suelo pulido, roca oscura y hielo fino. Las estalactitas no deben formar una cuadrícula perfecta ni bloquear sin motivo una ruta.
- Dejar espacio negativo deliberado: una explanada solo se conserva si sirve para un combate, un lago, una revelación o un descanso. Si no cumple una función, dividirla con un cambio de material, una repisa o un obstáculo de escala grande.

### Romper líneas de árboles y paredes

- Construir los pinos en **grupos de 2–4**, con troncos desplazados, copas solapadas y uno o dos huecos irregulares. Variar el tamaño/estado visual cuando el tileset lo permita; no repetir el mismo árbol a intervalos constantes.
- Interrumpir las paredes largas con un entrante, una protuberancia, una fractura, una raíz o un cambio de material cada 4–6 tiles. Evitar que una grieta decorativa acabe dibujando otra línea paralela a la pared.
- Las líneas rectas sí se admiten cuando comunican una construcción humana (muelle, muro del templo, escalones tallados); deben ser cortas, estar parcialmente rotas y contrastar con el terreno natural que las rodea.
- Revisar esquinas y autotiles: los bordes diagonales se forman con escalones y piezas de transición, no con «dientes» aislados. Confirmar que el tile de primer plano no abra huecos de colisión invisibles.

## 3. Recorrido geológico de las cuevas

La cueva debe sentirse como una red erosionada, no como pasillos arquitectónicos paralelos. Usar una secuencia de **cámara amplia → cuello de botella corto → cámara desplazada → ramal opcional → cámara de retorno**, con entradas y salidas fuera de un eje común. Las cámaras pueden ser ovaladas, lobuladas o en forma de riñón, pero deben tener irregularidades distintas entre sí.

Cada cámara necesita un hito reconocible (columna, charca, arco de hielo, veta cristalina o derrumbe). El agua y las grietas orientan el flujo; una galería puede estrecharse donde el hielo ha fracturado la roca y volver a abrirse al llegar a una bolsa de aire. Introducir como máximo un puzzle de deslizamiento por tramo y dejar un borde seguro, un punto de parada o una señal visual para que el jugador comprenda dónde terminará el movimiento.

Esquema espacial recomendado:

```text
boca baja ──╮
            ├─ cámara de entrada ── cuello quebrado
repisa alta ╯                         ╲
                              cámara de estalactitas ─ ramal de objeto
                                      ╲
                         lago norte ─ pasarela natural ─ lago sur
                                                     ╲
                                             fisura breve
                                                     ╲
                                      cámara de cristales → templo → corazón
```

Las conexiones no tienen que ser rectas ni repetirse de mapa en mapa. Mantener una opción de retorno segura antes de la grieta irreversible de la historia; la progresión narrativa nunca debe depender de una celda visual que el jugador pueda confundir con suelo.

## 4. Propuesta de composición por mapa

| Mapa | Reconstrucción de macroforma | Landmark y espacio secundario |
|---|---|---|
| **2073 — Vereda Helada** | Entrar por una esquina baja; llevar la senda en S alrededor de un espolón rocoso y salir por el lado opuesto. Evitar el eje vertical recto. | Ventisquero que muerde el camino, un pequeño mirador lateral y huellas que terminan en una pared de nieve. |
| **2074 — Acantilado de Zetas** | Dos repisas en alturas distintas, conectadas por dos cambios de dirección no alineados. Mantener una ruta de regreso clara. | Cuerda vencida por el viento, caída visual segura y una cornisa secundaria con objeto o NPC. |
| **2075 — Sendero de la Cornisa** | Recorrido largo por el contorno del monte: tres tramos de dirección distinta, con un cuello breve antes de la entrada opcional a la cueva. | Un saliente tapa parcialmente la salida para revelarla al acercarse; desvío corto, no un callejón enorme. |
| **2076 — Cabaña del Montañés** | Cabaña compacta apoyada en la cara protegida de una roca, con sendero de llegada curvo y pequeño patio irregular. | Fogata desplazada del centro, leñera cubierta por ventisca y banco libre para que el refugio respire. Dejar despejada la interacción/curación. |
| **2077 — Lago Congelado** | Orilla no rectangular; borde quebrado y una lengua de hielo que invita a cruzar. No convertir toda la superficie en una plaza vacía. | Grietas radiales y diagonales alrededor de un punto profundo; roca/isleta como parada; sombra bajo el hielo como foco. |
| **2078 — Pueblo de la Niebla** | Agrupar 3–5 edificios en dos bolsillos separados por roca y nieve; senderos curvos, sin calles paralelas. | Fachadas ladeadas, faroles dispares, montones de nieve contra paredes y una zona de tienda que siga siendo fácil de leer. |
| **2079 — Pueblo Alto** | Subir por un acceso lateral y rodear una plaza pequeña de forma irregular; casas escalonadas en profundidad. | Campana como foco, con huellas que llegan desde una dirección imposible. No alinear puertas, NPCs y postes. |
| **2080 — Cueva de Bloques de Hielo** | Puzzle en una cámara amplia con masas de hielo de tamaños diferentes; usar un rodeo y dos rutas cortas, no una cuadrícula de bloques simétrica. | Dejar un corredor despejado para comprender el deslizamiento y una poza/borde seguro donde detenerse. |
| **2081 — Entrada de Cueva** | Umbral en diagonal con una bifurcación corta: una rama asciende a una repisa y vuelve a la ruta; la otra continúa hacia el interior. | Gradiente de nieve a roca húmeda, raíz/piedra que enmarca la entrada y un cambio de luz que señale el interior. |
| **2082 — Caverna de Estalactitas** | Tres bolsillos de suelo comunicados por gargantas desplazadas. Situar la masa más grande fuera del centro para que la ruta la rodee. | Estalactitas agrupadas en dos racimos, una columna rota y una zona segura para el combate/NPC. Evitar techo y suelo como rejillas repetidas. |
| **2083 — Cámara de los Dos Lagos** | Dos charcas de forma distinta y en diagonal; unirlas con una franja estrecha de hielo natural. El camino puede rodear una charca y cruzar junto a la otra. | Una runa en una repisa seca, cristales desiguales y una pequeña salida lateral que cierre un bucle opcional. |
| **2084 — Grieta Estrecha** | Hacer la garganta estrecha solo en el segmento narrativo central; ensancharla en dos bolsillos de pausa. Evitar 16×40 de pasillo uniforme. | Fracturas oblicuas, piedra expuesta y una salida visual clara. Las celdas que se cierren por evento deben conservar una alternativa de salida/retorno. |
| **2085 — Cámara de Cristales** | Cámara lobulada con la ruta principal bordeando una veta central. Añadir un desvío corto hacia el miniboss que vuelva a la ruta. | Un gran cristal como silueta, vetas pequeñas en grupos, sombra detrás del cristal y espacio libre alrededor del entrenador. |
| **2086 — Templo de las Estatuas** | Ruina parcialmente tragada por el glaciar: recinto incompleto, una pared derruida y acceso lateral. No usar columnata gemela ni sala perfectamente cuadrada. | Estatuas desiguales, algunas enterradas/inclinadas; el puzzle de orientación debe leerse por sus bases, no por una simetría automática. |
| **2087 — Corazón del Monte** | Cámara final algo más ancha que 2084, con acceso curvo y plataforma focal descentrada. Mantener un área limpia y suficiente para evento/combate. | Altar o figura recortados por hielo oscuro; una salida de retorno visible y un borde de hielo quebrado que enmarque, no encierre, el foco. |
| **2021 — Falda de Monte Silver** | Ruta de ascenso en dos curvas amplias alrededor de afloramientos; una alternativa corta lleva al refugio. | Pinos inclinados en grupos y talud de roca con nieve acumulada en los quiebres. |
| **2022 — Cumbre** | Cresta asimétrica en arco, con un paso expuesto y un claro pequeño para el encuentro; evitar una arena circular vacía. | Mojón desplazado, nieve barrida por el viento y vista/abismo sugerido en un borde. |
| **2030 — Gruta de los Testigos** | Cámara principal irregular con siete nichos en abanico roto, no siete portales idénticos en línea; una rama lateral conecta con la Antesala. | Unown, glifos y cristales marcan el orden narrativo. Preservar IDs, scripts y coordenadas de los eventos hasta actualizar sus ubicaciones a la vez. |

## 5. Flujo de trabajo en RPG Maker XP

1. **Auditoría:** en el editor, anotar tamaño, tileset, conexiones, eventos, posiciones de entrada/salida, páginas condicionales y regiones de encuentro. Guardar la versión anterior fuera de `Data/`.
2. **Silhouette pass:** en una capa temporal o copia del mapa, dibujar solo masa sólida y vacío. Marcar con un color de referencia la ruta principal y, con otro, los bolsillos secundarios. Verificar desde la cámara real, no solo alejado en el editor.
3. **Greybox jugable:** construir la superficie y validar pasabilidad. Reproducir el recorrido desde cada transferencia; comprobar esquinas, rampas, tiles de hielo y obstáculos de eventos. No decorar una celda hasta saber si se puede pisar.
4. **Forma y desnivel:** añadir salientes, taludes, bancos de nieve, bordes de hielo y entrantes. Revisar que pared y suelo no compartan una línea recta larga ni un mismo patrón repetido.
5. **Arte por capas:** capa baja para suelo/material; capa intermedia para transiciones, paredes y agua; capa alta para copas, salientes y estalactitas que deban pasar visualmente por delante del jugador. Confirmar prioridades y oclusión con el personaje caminando.
6. **Dressing:** colocar primero el landmark; luego grupos medianos; al final detalles pequeños y huellas. Eliminar el detalle que no mejore orientación, historia, escala o recompensa.
7. **QA en juego:** recorrer el mapa con el personaje, abrir todos los eventos, probar hielo con cada dirección, activar y desactivar switches y entrar/salir por todas las transferencias. Generar una imagen final por mapa y una vista de pasabilidad.

### Puertas de calidad antes de dar un mapa por terminado

- Se identifica entrada, salida y dirección principal en **3 segundos** de observación.
- Ninguna línea natural de pared/árbol mantiene una recta perfecta durante más de **5 tiles**; toda excepción corresponde a una construcción deliberada.
- Existe al menos **un landmark grande**, **un cambio de anchura** y **un bolsillo opcional** que vuelve a la ruta o entrega una recompensa.
- No hay manchas vacías de más de 5×5 tiles sin función; el espacio limpio restante sirve a movimiento, combate o lectura.
- El camino es continuo y transitable; no hay tiles que parezcan suelo pero bloqueen, ni decoración con prioridad incorrecta.
- Eventos, objetos, NPCs y triggers se pueden alcanzar/interactuar; el flujo de entradas y salidas funciona tras guardar/cargar.
- La captura final se revisa a tamaño de juego y con el jugador visible. Una vista bonita del editor no sustituye la prueba jugable.

## 6. Precaución con el generador existente

`tools/apply_dimensional_nightmare_maps.mjs` reconstruye las escenas R6 desde sus fichas de referencia. Si se retocan a mano los mapas compilados y luego se vuelve a ejecutar ese generador, los cambios manuales pueden sobrescribirse. Para una implementación mantenible, conviene incorporar el layout orgánico como datos de autoría versionados o añadir un generador dedicado y reproducible antes de reemplazar `Map2073–Map2087`. Mantener el render previo, el nuevo mapa y su overlay de pasabilidad como evidencia de cada iteración.
