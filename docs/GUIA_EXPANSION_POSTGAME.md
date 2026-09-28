# Guía de la expansión postgame — Orden de juego recomendado

> Cómo acceder a todo el contenido nuevo con una partida de Fire Ash ya en postgame. La expansión es **100% aditiva**: no cambia la historia principal, no bloquea la Mochila ni la salida, y todo tiene retorno libre.

## 0. El gatillo: el evento de Mew

La expansión entera se habilita con el postgame convencional de Fire Ash: termina el evento de Mew (Proyecto Mew) y vuelve a casa. Oak visita el laboratorio y dispara `429 = Postgame`. A partir de ahí:

- el **Pokédex de entrenador** queda habilitado (la escena clásica de Oak);
- en el **segundo piso del laboratorio de Oak** aparece la zona secreta y sus transportadores cuánticos.

## 1. El sótano del laboratorio de Oak (hub de la expansión)

Baja las escaleras del laboratorio. Verás dos cápsulas originales y una **tercera cápsula nueva** entre ellas, con su ayudante:

| Cápsula | Destino | Condición |
|---|---|---|
| Original izquierda | Pokédex holders (23 dimensiones alternativas) | Postgame |
| **Nueva (menú)** | Isla Espejo | Siempre |
| | Bosque Susurrante | Misión del guardabosques aceptada (habla con él en Ciudad Verde) |
| | Puerto Horizonte | Rescatados los niños del Bosque Susurrante |
| | Atlas Mil | Que el Cronista de Puerto Horizonte lo haya abierto |
| Original derecha | **Torre del Grandeur Club** (mapa 141) | Postgame |

Si una señal todavía no está calibrada, la cápsula te dice qué te falta en vez de teletransportarte a ciegas.

## 2. La torre del Grandeur Club — con Mochila libre

Esta es la petición central de la expansión: **la torre se juega con la Mochila disponible en batallas**. El reto sigue siendo el del club (stock de objetos fijo en las etapas Veterano/Ace/Mayhem, reglas de dificultad, el Escenario sin Mochila fuera de combate), pero ya no se te bloquea el uso de objetos dentro del combate.

Recorrido:

1. **141 SECRET PEAK** — entrenamiento y acceso; la vista de la cumbre.
2. **151 GRANDEUR LOUNGE** — el club completo: Práctica, Gauntlet, Club, Mayhem, Duet, Sygna, Titan. Habla con los ADMIN para entender cada etapa; el jugador elige dificultad (Rookie conserva tu Mochila; Veterano/Ace te entregan una mochila de stock fijo que se devuelve al salir).
3. **214 STAGE** — el escenario de las etapas; aquí el switch 675 sigue ocultando la Mochila fuera de combate (es parte del reto), pero **en combate usarás objetos con normalidad**.

Consejo: pierde sin miedo — ninguna etapa te encierra.

## 3. Isla Espejo (mapas 997–999)

También accesible desde Pueblo Paleta con el NPC del ferry (postgame). Tres salas con 16 jefes de líneas alternativas (reflejos de manga, especialistas reimaginados, anomalías) y 32 combates con revancha. Cada jefe permite perder (`canLose`) y hay curación y ferry de vuelta siempre.

## 4. La misión de Hypno y Horizontes (mapas 1000–1020)

1. Habla con el **guardabosques de Ciudad Verde** (postgame) y acepta el rescate de los niños del Bosque Susurrante.
2. Entra al bosque (mapa 1000): cinco niños, un Hypno de nivel 100 que puedes **derrotar o capturar**, y salida libre en todo momento.
3. Al entregar los niños al guardabosques se abre **Puerto Horizonte** (1001) y sus 20 territorios con las **500 aventuras** (100 historias, 100 objetos escondidos, 80 Pokémon raros, 100 entrenadores, 40 rescates, 40 anomalías, 20 acertijos y 20 manifestaciones Pokégod capturables).
4. El Cronista del puerto lleva la cuenta (`\v[101]`) y premia al llegar a 500.

## 5. Atlas Mil (mapas 1021–2020)

El Cronista de Puerto Horizonte abre el Atlas: **1.000 mapas en 40 sectores**, cada uno con puerta directa desde el puerto.

- **Tier 1 — 40 anclas artesanales** (una por sector): episodios completos con 3–5 NPCs con conflictos cruzados, escena con decisión persistente, jefe de equipo narrativo, recompensa con lectura futura, curación y retorno. Cada ancla entrega un **sello** (switches 708–747); la convergencia final del mapa 1996 pide 39 sellos.
- **Tier 2 — 120 rutas estables**: dos NPCs, mecánica clara con contrajuego, decisión persistente y recompensa única (switches 748–867). Sin combates forzados.
- **Tier 3 — 840 Ecos dimensionales**: baliza, navegación anterior/siguiente, retorno libre y una **regla local breve** reversible (420 con desafío Atlas y 420 con reglas de anomalía: geografía que respira, gravedad prestada, sombras dobles, coordenadas que mienten…).

## Reglas de oro de la expansión

1. **La Mochila siempre funciona** en las batallas internas — también en la torre.
2. **Ningún combate es obligatorio ni imposible**: los jefes de historia permiten perder y hay curación antes de reintentar.
3. **Todo tiene salida**: cada zona de la expansión puede volver a Puerto Horizonte y al laboratorio de Oak sin requisitos.
4. **Las recompensas principales se entregan una sola vez**; con la Mochila llena puedes reintentarlo.
5. **Un enemigo derrotado queda derrotado**: cada victoria cierra el encuentro (registro/«completado») y no vuelve a atacarte. Si pierdes puedes reintentar cuando quieras, y algunos jefes (Isla Espejo y los conductores de Atlas) te ofrecen una **revancha amistosa por menú** — nunca forzada. Las etapas de entrenamiento del Grandeur Club (Práctica, Gauntlet, Mayhem…) siguen siendo repetibles a propósito: es el gimnasio de la torre donde entrenar hasta nivel 150.
6. Las partidas guardadas jamás se tocan; los backups de desarrollo están en `pokemon_fire_ash/PokeModBackups/`.

## Verificación antes de publicar tu mod

```bash
npm test                      # 51 + 114 + 57 pruebas
npm run verify:atlas          # Tier 2 y Tier 3 compilados y seguros
npm run verify:grandeur:bag   # Mochila libre en la torre
npm run verify:oak:hub        # transportador postgame de Oak
npm run verify:defeats        # derrotas permanentes + revanchas solo por menú
python tools/kirin_check.py pokemon_fire_ash
```

La checklist de prueba manual (84 comprobaciones) está en [`QA_MANUAL_PLAYTEST.md`](QA_MANUAL_PLAYTEST.md).

## Entrenar hasta nivel 150

El tope del juego está en **nivel 150** (`Settings::MAXIMUM_LEVEL`) con las seis curvas de experiencia válidas por encima de 100. Para subir sin grind repetitivo: las ~1.200 batallas únicas de la expansión (Nv78–150) financian la progresión normal, y las **etapas del Grandeur Club** (líderes y campeones con equipos alternativos, repetibles) son el gimnasio libre para el tramo final. El juego incluye `EXPSHARE`, `LUCKYEGG`, caramelos de experiencia (XS/S/M/L/XL) y `RARECANDY`; Horizontes reparte 40 caramelos como recompensas.
