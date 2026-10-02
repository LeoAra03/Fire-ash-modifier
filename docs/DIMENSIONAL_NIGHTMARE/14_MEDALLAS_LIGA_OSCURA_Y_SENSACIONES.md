# MEDALLAS, CARTUCHERAS Y LIGA OSCURA — plan de entablado

## Cómo se conectan los mundos creepypasta, qué se siente en cada uno y cómo termina todo

> Este documento es el plan del tramo «M2» del Dimensional Nightmare: la capa de **medallas**,
> **cartucheras** y **Liga Oscura** que cierra el arco de los mundos creepypasta. Corre en
> paralelo al mundo Atlas y sus aventuras: no toca sus mapas, sus flags ni su catálogo.

---

## 1. Reglas de teletransporte (reconocible y con motivo)

Toda grieta, portal o salto cumple **cinco reglas**:

| # | Regla | Cómo se ve en el juego |
|---|---|---|
| R1 | **Color propio**: cada mundo tiene su `hue` y su tono de pantalla | el sprite de la grieta cambia de color según el mundo |
| R2 | **Cartel de destino**: junto a cada grieta hay un cartel con destino, firma y motivo | evento `HUB_CARTEL_EPxx` con los tres datos en el mismo orden |
| R3 | **Ancla visible**: el objeto que sostiene la grieta está dibujado en la celda | `Object ball special` con el `hue` del mundo |
| R4 | **Simetría de llegada**: el destino te recibe nombrando de dónde vienes | el evento de llegada dice «vuelves de X» / «entras en X» |
| R5 | **Un solo sentido narrativo**: una grieta existe porque un sello se cerró ahí | el texto del cartel dice *por qué* está en la Antesala |

**Motivo de cada grieta en la Antesala de las Grietas (2040)**: el Testigo cierra cada mundo en su
cámara y el sello deja una grieta; la Antesala las reúne porque es la antesala de la Gruta donde se
encontró el Ancla. Ninguna grieta aparece «porque sí»: cada una ocupa el punto donde su sello fue
leído.

---

## 2. Sensación por mundo (cada creepypasta se siente distinto)

| Mundo | Sensación buscada | Tono de pantalla (R,G,B,gris) | Clima / ambiente | Mecánica de mundo |
|---|---|---|---|---|
| **EP01 White Hand** | opresión documental: papel, tinta, manos | `(-30,-20,-20, 40)` sepia sucio | niebla tenue de papel | los NPCs no caminan: te observan |
| **EP02 Lost Silver** | frío estático de cartucho a medio morir | `(-60,-20,+20, 30)` azul frío | lluvia fina | los textos se repiten y se corrompen |
| **EP03 Snow on Mt. Silver** | silencio blanco, duelo en la nieve | `(+30,+30,+40, 0)` blanco cegador | nieve | el suelo resbala (hielo) |
| **EP04 Hypno's Lullaby** | dulce y equivocado, sueño hipnótico | `(+40,-20,+60, 20)` violeta | niebla morada | la pantalla «respira» (pulso de tono) |
| **EP05 Pokémon Black** | ausencia: el mundo se apagó | `(-100,-100,-100, 0)` negro | silencio, sin viento | oscuridad total: sólo el Rotom guía |
| **EP06 King Unown** | ruptura: el código se dobla | `(+20,-40,+20, 80)` verde glitch | estática | glitches intermitentes (parpadeo) |
| **Nexo de las Grietas** | código limpio, archivo | `(0,-20,+40, 20)` azul código | — | ninguna: es el descanso |
| **Liga Oscura** | tensión final, tormenta eléctrica | `(-40,-40,-40, 0)` plomizo | tormenta | la velocidad manda |
| **Atlas (paralelo)** | — | sin tocar | — | — |

Implementación: el tono se aplica **al entrar a cada mapa** (cada transferencia del ciclo inserta su
`pbToneChangeAll` con marca `dn:sensacion`), y salir a la Gruta o al Nexo lo devuelve a neutro. El
clima y el audio quedan como backlog B2 (necesitan archivos de audio propios), documentados aquí
para no perder la intención.

---

## 3. Medallas y cartucheras

Cada mundo entrega una **Medalla** y su **cartuchera**, y la cartuchera se llama exactamente
`Badges of <mundo>`. La medalla se recoge en el **Pedestal del Sello** de la cámara del jefe, que se
enciende cuando el sello del mundo queda cerrado.

| Mundo | Medalla (objeto) | Cartuchera (objeto) | Nombre de la cartuchera |
|---|---|---|---|
| EP01 White Hand | `DN_MEDAL_WHT` Medalla de la Mano Blanca | `DN_CASE_WHT` | **Badges of White Hand** |
| EP02 Lost Silver | `DN_MEDAL_LSV` Medalla del Sin Nombre | `DN_CASE_LSV` | **Badges of Lost Silver** |
| EP03 Snow on Mt. Silver | `DN_MEDAL_SNO` Medalla del Caminante | `DN_CASE_SNO` | **Badges of Snow on Mt. Silver** |
| EP04 Hypno's Lullaby | `DN_MEDAL_HYP` Medalla de la Nana | `DN_CASE_HYP` | **Badges of Hypno's Lullaby** |
| EP05 Pokémon Black | `DN_MEDAL_BLK` Medalla del Jugador 000 | `DN_CASE_BLK` | **Badges of Pokémon Black** |
| EP06 King Unown | `DN_MEDAL_UNO` Medalla del Rey Unown | `DN_CASE_UNO` | **Badges of King Unown** |
| Liga Oscura | `DN_MEDAL_MPK` Medalla del Vínculo | `DN_CASE_MPK` | **Badges of Mad Pikachu** |

Con las seis cartucheras de los mundos, el Archivero abre el acceso a la **Liga Oscura**
(switch `DN_MEDALS_READY`). La séptima cartuchera se entrega al cerrar la Liga.

---

## 4. Liga Oscura (mundo final)

**Mapas nuevos** (ids 2141 y 2142, siguientes a los 101 del ciclo): el **Pórtico** y el **Coliseo**,
construidos con el lenguaje visual del Nexo (tiles glitch del archivo R1) para que se reconozcan como
«el mundo del código»: la Liga no es una creepypasta más, es donde se juntan.

### 4.1 Entrada
En la Antesala aparece `HUB_LIGA_OSCURA` (centro de la sala) cuando el Archivero confirma las seis
cartucheras. Con `DN_MEDALS_READY` encendido, la puerta transfiere al Pórtico; sin él, el texto dice
qué falta.

### 4.2 El encuentro con Mad Pikachu (nivel 255)
El Rotom escanea y marca **NIVEL 255 — FUERA DE RANGO**: el combate directo no está permitido (el
Rotom se niega a calcular la batalla). La sensación de «imparable» se cuenta, no se pelea:

| Rama | Cuándo | Qué hace Mad Pikachu |
|---|---|---|
| **A — Tienes un Pikachu** (`v278 = 1`) | hay un Pikachu en el equipo | **intenta razonar**: reconoce a su especie y te propone un duelo para **medir el vínculo** |
| **B — Tienes un Raichu** (`v278 = 2`) | hay un Raichu en el equipo | **no duda**: te desafía en el acto; su velocidad es imparable |
| **C — Ninguno** (`v278 = 3`) | no hay ni Pikachu ni Raichu | te ignora y te pone una prueba de presencia: «demuéstrame que no eres parte del código» |

### 4.3 La prueba (no se gana a golpes)
Cuatro **chispas del vínculo** (`LIGA_CHISPA_1..4`) repartidas por el Coliseo. En la rama B las
chispas son **marcas de velocidad**: hay que alcanzarlas antes que el pulso de Mad Pikachu (texto y
temporización, sin combate). Completar las cuatro (`v279 = 4`) llama a la escena de Arceus.

### 4.4 La intervención de Arceus (obligatoria)
Escena: la luz original entra en el Coliseo, el tono se lava a blanco y Arceus habla del equilibrio
(«un nivel que no existe no puede sostener un mundo»). **Nivela a Mad Pikachu a 150** y abre el
combate real. Sin esta escena el combate no existe: la Liga no se puede terminar por fuerza bruta.

### 4.5 El combate final y el cierre
- Entrenador `DN_MPIKA_150` (Pikachu nivel 150, velocidad extrema, un solo Pokémon).
- Al ganar: **no se debilita al Pikachu, se lo salva**: el vínculo lo ancla de vuelta y los mundos
  creepypasta quedan libres; la Liga se apaga.
- Recompensa: `DN_MEDAL_MPK` + `DN_CASE_MPK` (**Badges of Mad Pikachu**) y el NPC permanente
  `HUB_MADPIKA` en la Antesala (Mad Pikachu ya salvado).
- Si pierdes, no hay derrota permanente: la Liga te devuelve al Pórtico y puedes reintentar.

---

## 5. Mundos nuevos (segundo anillo) — plan de entablado

Se proponen **tres mundos** más, coherentes con el canon elegido (Ash como anomalía externa, mundos
cerrados, una medalla por mundo). Se construyen **después** de la Liga Oscura, en un segundo anillo de
la Antesala, y cada uno exige su medalla y su cartuchera con la misma nomenclatura.

| # | Mundo | Sensación | Medalla / cartuchera | Por qué existe (motivo) |
|---|---|---|---|---|
| W7 | **Strangled Red** | duelo y culpa; todo rojo apagado | Medalla del Amo · **Badges of Strangled Red** | el primer mundo que se ahorcó a sí mismo: su grieta está manchada |
| W8 | **Buried Alive** | claustrofobia; oscuridad sin aire | Medalla de la Fosa · **Badges of Buried Alive** | la fosa ya está cavada en las catacumbas (arte «BURIED LIVE» del archivo R7) |
| W9 | **Lavender Town Syndrome** | el sonido duele; silencios y ondas | Medalla del Silencio · **Badges of Lavender Town Syndrome** | el pueblo sigue llamando a quien escuche la melodía |

**Requisitos y orden**: cada mundo se construye con el pipeline E0–E5 completo (fichas → tileset →
mapas → eventos → verificación). Los mundos nuevos necesitan **su propio mosaico de referencia** para
mantener la fidelidad B; si no lo hay, se levantan con tiles del juego base como el hub (2040) y la
Liga (2141–2142). Asignación de ids prevista: **2143–2158** (W7), **2159–2174** (W8), **2175–2186**
(W9). El cierre de los nueve mundos habilita la **Vitrina del Testigo** en la Antesala (cartuchera
`DN_CASE_WIT` «Badges of the Witness»).

---

## 6. Convivencia con el mundo Atlas

- Mapas nuevos **solo** desde 2141; el mundo Atlas conserva sus ids.
- Flags nuevas solo en el tramo `917–929` (switches) y `278–289` (variables); ninguna pisa flags
  `868–881` (Atlas T2) ni `882–916` (DN).
- Objetos nuevos con prefijo `DN_`; ids numéricos desde `1040`.
- Los eventos DN instalados en mapas base (Gruta 2030) ya están respaldados en
  `PokeModBackups/`; no se toca ningún archivo de Atlas.

---

## 7. IDs y comandos

| Recurso | Rango | Uso |
|---|---|---|
| Switches | 917 | `DN_MEDALS_READY` (seis cartucheras) |
| Switches | 918–921 | `DN_LIGA_*` (progreso, Arceus, cierre, guardado de Mad Pikachu) |
| Variables | 278–281 | rama de Mad Pikachu, chispas, medallas contadas, velocidad |
| Objetos | 1040–1056 | 7 medallas + 8 cartucheras |
| Mapas | 2141–2142 | Pórtico y Coliseo de la Liga Oscura |

```bash
npm run dn:build:all          # orden obligatorio: hub → medallas → liga → sensaciones
npm run dn:medals             # medallas, cartucheras, iconos y pedestales
npm run dn:liga               # mapas 2141–2142, eventos, trainers y acceso
npm run dn:sens               # tono de cada mundo en todas las transferencias
npm run dn:build:all -- --render
npm run dn:verify:all         # todo el ciclo + hub · medallas · Liga · sensaciones
```

> **Orden**: las herramientas que reconstruyen eventos (`dn:hub:events`, `dn:medals`, `dn:liga`)
> borran lo que reescriben, así que **`dn:sens` va al final** (es el que deja las marcas de tono).
> `dn:build:all` encapsula ese orden.

---

## 8. Resultados de la ejecución (2026-10-02)

| Pieza | Resultado | Comprobación |
|---|---|---|
| Medallas y cartucheras | ✅ 14 objetos (6 medallas + 6 cartucheras + medalla y cartuchera de la Liga) con icono 48×48 y nombre `Badges of <mundo>` | `dn:medals:verify` |
| Pedestales del Sello | ✅ uno por cámara de jefe (2056 · 2072 · 2087 · 2103 · 2119 · 2135); entregan al cerrarse el sello y encienden `sw917` | `dn:medals:verify` |
| Puerta de la Liga | ✅ `HUB_LIGA_OSCURA` en la Antesala (2040), se abre con las seis cartucheras | `dn:hub:events:verify` · `dn:liga:verify` |
| Mapas de la Liga | ✅ **2141 Pórtico del Código** (22×11) y **2142 Coliseo del Vínculo** (30×22), BFS 100 %, tiles del mundo del código | `dn:liga:verify` |
| Arco de Mad Pikachu | ✅ 5 etapas por `v281` (intro → prueba → **Arceus** → combate → cierre), 3 ramas por `v278` (Pikachu / Raichu / ninguno), 4 chispas (`v279`) | `dn:liga:verify` |
| Combate final | ✅ trainer `MAD PIKACHU` nv **150** (Pikachu), tipo `DN_MADPIKA`, sprite propio (`Graphics/Trainers/DN_MADPIKA.png`, hoja de overworld de 48 px) | `dn:liga:verify` |
| Cierre | ✅ al ganar: `sw920` + `sw921`, Medalla del Vínculo y **Badges of Mad Pikachu**; al perder, vuelve al Pórtico (nada permanente) | `dn:liga:verify` |
| Sensaciones | ✅ **212 transferencias** en **103 mapas** con el tono de su mundo (y tono neutro al salir al juego base) | `dn:sens:verify` |
| Hojas de revisión | ✅ `docs/dn_referencia/lotes/HUB_2040.png`, `lotes/LIGA_2141_2142.png`, `arte/preview_cartucheras.png` | — |
| Batería del repo | ✅ `dn:verify:all` · `verify:defeats` · `verify:event-collision` · `npm test` · `verify:package` | verde |

### Reglas de teletransporte: cómo quedaron implementadas

| Regla | Implementación real |
|---|---|
| **R1 Color propio** | cada grieta usa `UNOWN.png` con `hue` propio (EP01 0 · EP02 36 · EP03 72 · EP04 144 · EP05 216 · EP06 288) |
| **R2 Cartel de destino** | el propio evento de la grieta dice **destino, firma y motivo** en su primera página (no hay carteles sueltos) |
| **R3 Ancla visible** | el ancla de cada mundo está dibujada en la celda del evento (`Object ball special` con tono) |
| **R4 Simetría de llegada** | cada mapa de destino recibe con una línea que nombra el mundo de origen («vuelves de…» / «entras en…») |
| **R5 Motivo** | cada grieta declara por qué está ahí: el sello se cerró en esa cámara y la Antesala las reúne |

El texto «vuelves de X» se construye sobre el flavor de cada grieta del hub (documentado en la fila
EPxx de la tabla §2); refrescar los textos de la Antesala es parte de la pasada de guion (B6).

### Pendiente de este tramo
- **W7–W9** (Strangled Red · Buried Alive · Lavender Town Syndrome) siguen en plan: cada uno necesita
  su mosaico de referencia para mantener la fidelidad B (§5).
- Clima y audio propio por mundo (niebla, nieve, lluvia, silencio): necesitan los archivos de audio
  del doc 08 (backlog B2); los tonos de pantalla ya están puestos.
