# MUNDO W9 — LAVENDER TOWN SYNDROME
## «El pueblo que sigue llamando a quien escuche» · Recurso base: **R10 — Lavender Town Syndrome** (16 mapas)

> **Canon respetado**: el pueblo no ataca; **canta**. El sonido duele y los silencios
> interrumpen la imagen. Nadie muere en pantalla: los NPCs se tapan los oídos y siguen vivos.
> Ash es el intruso; el Rotom es el único que puede **silenciar** frecuencias.
> Paleta del mundo: violeta, ondas, glitches horizontales que se llevan parte del mapa.

> **Variables del mundo**: `v285` cuenta anomalías de W9 (contador del episodio), `v287` mide el nivel de canto.
---

## 1. Mapa del mundo

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2175 | Lavender Syndrome — Entrada del Pueblo | R10-1 | Outer/Int Lavender | 30×24 | Entrada, NPC guía, guardado |
| 2176 | Lavender Syndrome — Calle del Altavoz | R10-2 | Int Lavender | 30×24 | Primer silencio; objeto oculto |
| 2177 | Lavender Syndrome — Casa del Piano | R10-3 | Int Lavender | 30×24 | Puzzle de 4 notas |
| 2178 | Lavender Syndrome — Escuela de Música | R10-4 | Int Lavender | 30×24 | NPCs conscientes; clase en bucle |
| 2179 | Lavender Syndrome — Capilla de la Campana | R10-5 | Int Lavender | 30×24 | Anomalía ancla: la campana que no suena |
| 2180 | Lavender Syndrome — Torre de las Ondas | R10-6 | Int Lavender | 30×24 | Subida; ondas que desplazan la imagen |
| 2181 | Lavender Syndrome — Calle del Silencio | R10-7 | Outer/Int Lavender | 20×40 | Laberinto; el sonido delata |
| 2182 | Lavender Syndrome — Jardín Sordo | R10-8 | Int Bosque | 30×24 | Curación; plantas que siguen el ruido |
| 2183 | Lavender Syndrome — Mercado de Cintas | R10-9 | Int Lavender | 30×24 | Intercambio de objetos |
| 2184 | Lavender Syndrome — Cine Sin Sonido | R10-10 | Int Lavender | 30×24 | Escena muda; lore |
| 2185 | Lavender Syndrome — Fosa Acústica | R10-11 | Int Cueva | 32×32 | Combates salvajes, eco |
| 2186 | Lavender Syndrome — Túnel de las Voces | R10-12 | Int Cueva | 30×24 | Duelo opcional (canLose) |
| 2187 | Lavender Syndrome — Sala de los Audífonos | R10-13 | Int Lavender | 30×24 | Traducción del Rotom; lore |
| 2188 | Lavender Syndrome — Torre del Canto | R10-14 | Int Lavender | 32×32 | 7 estaciones (antesala del jefe) |
| 2189 | Lavender Syndrome — Estudio del Autor | R10-15 | Int Lavender | 30×24 | Última verdad del mundo |
| 2190 | Lavender Syndrome — Campanario Final | R10-16 | Int Lavender + R1 | 24×24 | **Jefe final**; glitches de R1 |

> **Orden de juego real**: 2175 → … → 2190. La Calle del Silencio (2181) y la Torre del Canto
> (2188) son los tramos que cambian de fase.

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Qué cambia en el mundo |
|---:|---|---|
| 1 | Normal | el pueblo tararea bajito; todo se entiende |
| 2 | Duda | una radio que nadie apagó repite una nota |
| 3 | Grieta | la música se corta en medio de una frase y la imagen tiembla |
| 4 | Ruido | todos los NPCs se tapan los oídos; las ondas se ven |
| 5 | Pérdida | desaparece el director de la escuela; su batuta queda en el aire |
| 6 | Ruptura parcial | bandas de glitch se llevan 5 % del suelo y parte de los textos |
| 7 | Ruptura | la melodía completa suena al revés; aparece la silueta de R1 en el campanario |

```text
# Fase 2 → 3 (al pisar 2180, celda 11,29)
tone(-24,-8,-32,0); v266 = 3; música "Lavender" pitch 90; ondas activas (overlay W9)
# Regla de sonido: cada zona tiene un "nivel de canto" (v287). Sube al acercarse a campanas
# y altavoces; baja al tocar silencios. v287 ≥ 80 = texto distorsionado (no daño).
```

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite existente | Rol y notas |
|---:|---|---|---|---|
| 2175 | El Farolero Sordo | Normal | `trchar028` | 5 estados. No oye la melodía y por eso puede hablar. |
| 2175 | Rotom (silenciador) | Interdimensional | `trchar001` | Marca el nivel de canto; cambia de tono por fase. |
| 2176 | La Mujer del Altavoz | Normal | `trchar042` | 5 estados; en fase 4 sólo señala el altavoz. |
| 2177 | El Pianista Sin Manos | Consciente | `trainer_PSYCHIC_M` | Toca con la mirada; da el orden de las 4 notas. |
| 2178 | La Maestra que Repite | Normal | `trchar058` | Repite la misma clase; el Rotom puede cortarla. Sustituto visual de `trchar052`, ausente en el juego base. |
| 2179 | La Campanera Ciega | Consciente | `trainer_PSYCHIC_F` | Sabe que la campana suena en otra habitación. |
| 2180 | El Vigía de Ondas | Interdimensional | `trchar015` | Cuenta las ondas que pasan: siempre 108. |
| 2182 | La Jardinera Sorda | Normal | `trchar010` | Cura 1 vez por visita; sus plantas siguen el ruido. |
| 2183 | El Cambista de Cintas | Normal | `trainer_YOUNGSTER` | Cambia cintas por objetos (intercambio simbólico). |
| 2184 | El Proyeccionista | Consciente | `trchar070` | Pone una película muda que explica el mundo. |
| 2186 | El Coro de Dos | Consciente ×2 | `trchar028` | Canta a dos voces; una va siempre un tono atrás. |
| 2189 | El Autor | Interdimensional | `trchar001` | Última verdad: escribió el pueblo para no oírlo solo. |

**Ejemplo de diálogos de 5 estados** (El Farolero Sordo, 2175):
```text
Estado 1: "Bienvenido al pueblo. Yo no oigo nada, así que puedo mirarte a la cara."
Estado 2: "La melodía sube a esta hora. Tú la oyes, ¿verdad? Se te nota en los hombros."
Estado 3: "Cuando las ondas se ven, ya no es música: es el pueblo llamando."
Estado 4: "Si te tapa los oídos, ya no puedes sostener la linterna. Elige."
Estado 5: (silencio) "..."   # el evento ya no muestra texto; levanta la linterna hacia el campanario
```

---

## 4. Eventos programables

```
EV_W9_Entrada        — Mapa 2175 — Autorun tras abrir W9 con sw926 (sello de W8; v264 no cambia)
                        → texto de la grieta, sw924 = ON parcial, tone fase 1, música "Lavender"
EV_W9_Canto          — 2175–2190 — Proceso paralelo (no bloquea)
                        → v287 sube cerca de altavoces/campanas, baja en los silencios; ≥80 distorsiona texto
EV_W9_Altavoz        — 2176, celda (15,8) — Inspeccionar el altavoz
                        → el primer silencio: la música se detiene 5 s; marca anomalía A02
EV_W9_Piano          — 2177, 4 teclas (6,6) (12,6) (18,6) (24,6) — Tocar en orden 4-1-3-2
                        → abre 2178; la tecla equivocada repite la nota (sin daño)
EV_W9_Campana        — 2179 — Tocar la campana en fase ≥4
                        → no suena: la campana aparece tocando en 2180 (anomalía ancla A09)
EV_W9_Ondas          — 2180, celda 11,29 — Pisar
                        → fase 3: tono violeta, bandas de glitch activas, música a pitch 90
EV_W9_Silencio       — 2181, 3 puntos — Apagar 3 altavoces en orden
                        → el laberinto se abre; si suena uno fuera de orden, vuelve a empezar
EV_W9_Cintas         — 2183 — Cambiar cintas con el Cambista
                        → 3 intercambios; al 3.º entrega DN_W9_TAPE
EV_W9_Cine           — 2184 — Encender el proyector
                        → escena muda de 12 líneas; revela el nombre del Autor
EV_W9_Estudio        — 2189 — Hablar con el Autor (fase ≥6)
                        → abre 2190; entrega DN_W9_SCORE (partitura completa)
EV_W9_Coro           — 2188, 7 estaciones — Escuchar las 7 estaciones en orden
                        → cada estación sube v287; al 7.º se abre el campanario
EV_W9_Jefe           — 2190 — Hablar con el coro del campanario (autorun de mapa)
                        → fase A (canLose) + fase B de 4 silencios; al cerrar: sw924 = ON, sello
```

---

## 5. Anomalías (12)

```
[A01] LA NOTA QUE FALTA — auditiva
  Map2176 — (15,8) [R10-2]. Fase ≥2. La música salta siempre la misma nota; nadie la recuerda.

[A02] EL ALTAVOZ QUE APUNTA — visual
  Map2176 — (9,14). Fase ≥3. El altavoz gira hacia el jugador cuando entra.

[A03] EL PIANO SIN MANOS — auditiva
  Map2177 — (6,6). Fase ≥4. Suenan teclas que nadie toca; el orden es el correcto.

[A04] LA CLASE QUE SE REPITE — temporal
  Map2178 — (20,12). Fase ≥3. Al reentrar, la maestra está en la misma frase, con 10 años menos.

[A05] LA CAMPANA MUDA — auditiva
  Map2179 — (13,10). Fase ≥4. La campana se mueve sin sonar; el sonido llega desde 2180.

[A06] LAS ONDAS VISIBLES — visual
  Map2180 — (11,29). Fase ≥5. Bandas horizontales que desplazan la imagen 4 px y vuelven.

[A07] EL SILENCIO QUE DUELE — auditiva
  Map2181 — (10,20). Fase ≥5. **Ancla del mundo.** Cinco segundos de silencio total, sin música ni pasos.

[A08] LAS PLANTAS QUE ESCUCHAN — visual
  Map2182 — (16,9). Fase ≥3. Las flores giran hacia el último sonido que hizo el jugador.

[A09] LA CINTA AL REVÉS — auditiva
  Map2183 — (18,14). Fase ≥6. Una cinta reproduce la melodía al revés y todos la tararean igual.

[A10] EL CINE SIN PÚBLICO — temporal
  Map2184 — (14,16). Fase ≥5. Al reentrar, la sala está llena de siluetas que no estaban.

[A11] EL ECO QUE CONTESTA — auditiva
  Map2185 — (16,16). Fase ≥6. El eco no repite lo que el jugador dijo: repite lo que pensó el Autor.

[A12] EL CAMPANARIO QUE LLAMA — visual
  Map2190 — (12,18). Fase ≥7. La silueta de R1 marca el compás desde la torre.
```

---

## 6. Objetos

| Objeto | Tipo | Dónde | Efecto |
|---|---|---|---|
| `DN_W9_EARPLUG` | normal | 2175 (farolero) | Tapones: `v287` sube a la mitad de velocidad |
| `DN_W9_TAPE` | creepypasta | 2183 (cambista) | Cinta de la melodía: se usa en 2188 |
| `DN_W9_BELL` | normal | 2179 (oculta) | Campana muda: resuena en 2180 |
| `DN_W9_SCORE` | creepypasta | 2189 (Autor) | Partitura completa: revela el orden de los silencios |
| `DN_W9_FILM` | normal | 2184 (oculto) | Película muda: se proyecta en 2188 |
| `DN_W9_KEY` | normal | 2186 (coro) | Llave del estudio; abre 2189 |
| `DN_W9_TEA` | normal | 2182 (oculta) | Té sordo: cura 70 PS y baja `v287` 20 puntos |

---

## 7. Pokémon y entidades

- **Salvajes del mundo**: `GASTLY`, `HAUNTER`, `MISDREAVUS`, `MISMAGIUS`, `DROWZEE`, `HYPNO`
  (niveles 100–108, encuentros en 2180, 2181, 2185 y 2186).
- **Entidades** (no capturables):

| Registro | Nombre | Tipo | Capturable | Dónde |
|---|---|---|---|---|
| #A301 | EL CORO DEL CAMPANARIO | ANOMALÍA / ??? | no | 2190 (12,18) |
| #A302 | EL AUTOR | ANOMALÍA / ??? | condicional (partitura) | 2189 (15,8) |
| #A303 | LA VOZ QUE REPITE | ANOMALÍA / ??? | no | 2185 (16,16) |
| #A304 | LA SILUETA QUE MARCA EL COMPÁS | ANOMALÍA / ??? | no | 2190 (6,6) |

---

## 8. Música

| Momento | Pista | Nota |
|---|---|---|
| Exploración W9 (2175–2190) | `DN_LavenderEcho.mid` | Campana de celesta y pausas amplias; composición original para las ondas. |
| Silencio ancla / variantes | Pendiente por evento | El tema está asignado; el silencio de cinco segundos aún requiere un disparador de QA. |
| Combate del jefe | BGM de batalla del juego | No se altera el tema del motor de batalla. |

---

## 9. Jefe final del mundo: **EL CORO DEL CAMPANARIO**

**Mecánica (no es restar PS)**: el jefe es una canción sostenida por cuatro voces. Dos fases:

1. **Fase A — duelo real** (`DN_W9_A`, equipo de 6, `canLose`): pelear mientras `v287` sube.
2. **Fase B — los 4 silencios**: hay que tocar **4 silencios** (celdas (5,5) (20,5) (5,10)
   (20,10)) en el orden que indica `DN_W9_SCORE`. Cada silencio apaga una voz. Si el jugador
   toca fuera de orden, la voz vuelve y `v287` sube +20. Al cuarto silencio, el coro calla y cae
   el sello. Nunca hay daño por fallar: hay que volver a escuchar.

```text
# EV_W9_Jefe — secuencia real
1) pbTrainerBattle(DN_W9_A) → si gana el jugador, el coro "cambia de voz"
2) 4 silencios en orden (score): cada uno → tone(-20,-10,-40,0); apaga una voz
3) fuera de orden → v287 += 20; la voz vuelve; mensaje del Rotom con el orden correcto
4) al 4.º: sw924 = ON, entrega DN_PAGE_W9, vuelve al hub
```

**Recompensa**: `DN_W9_SCORE` + `DN_PAGE_W9` + el silencio del pueblo.

---

## 10. Conexión con el cierre del segundo anillo

El pueblo canta una última vez con todas sus voces y después **enmudece para siempre**. Con los
tres mundos sellados (W7 · W8 · W9), la Antesala completa su **Vitrina del Testigo**
(`DN_CASE_WIT` «Badges of the Witness»): nueve medallas, nueve mundos y una grieta que ya no
necesita gritar para abrirse. El Rotom guarda la partitura: «Cuando el silencio sea tuyo,
podrás volver a escuchar el mundo real.»
