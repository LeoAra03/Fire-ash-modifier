# EPISODIO 02 — LOST SILVER
## «El pueblo que se quedó sin color» · Recurso base: **R5 — Pueblos y Tumbas (sepia/B&N)** (16 mapas)

**Universo**: Lost Silver (inspiración; reinterpretado con voz propia).
**Filosofía de diseño**: **Memoria desaturada**. El mundo no es peligroso: es *un recuerdo que se
niega a terminar*. La amenaza no persigue — **recuerda**.
**Mapas propuestos**: `Map2057`–`Map2072` (16) · **Resonancia al sellar**: **+10**.
**Prerrequisito**: EP01 sellado (`sw883`). **Acceso**: Grieta de Cenizas → Grieta del Recuerdo
(Gruta de los Testigos, celda 20,12) o directamente desde la grieta al final de 2056.

> **Continuidad con el v1.** La emisión «La Partida Perdida» (Map2024) es la *primera* capa de este
> universo: una silueta en la nieve. El EP02 es la **capa profunda**: el pueblo entero donde ese
> recuerdo se originó. Nada del v1 se reescribe; se amplía.

---

## 1. Mapa del episodio

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2057 | Pueblo Sin Color — Entrada | R5-1 | Outer Ciudad (gris) | 32×24 | Entrada, reloj parado, NPCs normales |
| 2058 | Calle de las Casas Huecas | R5-6 | Outer Ciudad | 32×24 | Casas abandonadas, primer objeto oculto |
| 2059 | Plaza de la Fuente Seca | R5-10 | Outer Ciudad | 30×30 | Centro; fuente que "recuerda" agua |
| 2060 | Callejón de Escombros | R5-2 | Outer Bosque | 30×24 | Paso bloqueado por escombros (puzzle de pala) |
| 2061 | Bosque de Troncos | R5-9 | Outer Bosque | 40×30 | Combates; árbol retorcido ancla |
| 2062 | Páramo de Árboles Secos | R5-3 | Outer Bosque | 30×24 | Anomalías auditivas |
| 2063 | Estanque Estancado | R5-13 | Outer Agua | 30×24 | Surf simbólico; espejo de agua |
| 2064 | Puente de Madera Podrida | R5-5 | Outer Agua | 30×24 | Puente; se hunde en fase ≥5 |
| 2065 | Colina de la Iglesia | R5-7 | Outer Cementerio | 40×30 | Iglesia; NPC sacerdote |
| 2066 | Cementerio Cercado | R5-3bis (R5-3, variante) | Outer Cementerio | 40×30 | Tumbas legibles (5 estados) |
| 2067 | Mausoleo Central | R5-15 | Int Cementerio | 30×24 | Primer "jefe de campanario" opcional |
| 2068 | Cementerio Grande | R5-11 | Outer Cementerio | 40×40 | Laberinto de cruces |
| 2069 | Estación Abandonada | R5-14 | Int Estación | 40×24 | Vagón que no llega (anomalía temporal) |
| 2070 | Biblioteca Polvorienta | R5-12 | Int Biblioteca | 30×24 | Páginas, lore, traducción |
| 2071 | Campanario | R5-16 | Int Campanario | 24×32 | Campana; verticalidad; subida |
| 2072 | Torre de la Escalera de Caracol | R5-4 + R5-8 | Int Torre | 20×40 | **Jefe final**: el descenso/asceso final |

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Se activa en | Cambios | Mapa base |
|---:|---|---|---|---|
| 1 | Recuerdo nítido | 2057–2058 | Casi normal; sepia suave, NPCs con rutina | R5-1, R5-6 |
| 2 | Desaturación | 2059–2060 | Todo pierde color salvo los ojos de los NPCs | R5-10, R5-2 |
| 3 | El reloj | 2061–2062 | El reloj de la plaza se detiene a las 04:44; música lenta | R5-9, R5-3 |
| 4 | Espejos de agua | 2063–2064 | El agua devuelve reflejos con retraso de 1 s; puente se hunde | R5-13, R5-5 |
| 5 | Los que ya no están | 2065–2067 | Tumbas con nombres legibles; NPCs desaparecen al reentrar | R5-7, R5-3bis, R5-15 |
| 6 | Blanco y negro | 2068–2070 | Tinte `(-110,-110,-110,190)`; textos de libros se borran al leerlos | R5-11, R5-14, R5-12 + **R1** |
| 7 | **Ruptura** | 2071–2072 | La torre se vuelve código; la escalera de caracol gira en bucle; nieve digital | **R5-16/R5-4+R5-8 + R1-2 y R1-5** |

```ruby
# Fase 3 — el reloj (2060, celda 15,12)
$game_variables[266] = 3
$game_screen.tone = Tone.new(-60, -55, -40, 110)
Audio.bgm_pitch = 90
pbMessage("El reloj de la plaza marca las 4:44. \\nNo ha avanzado ni un minuto desde la última vez.")
```

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite | Rol y notas |
|---:|---|---|---|---|
| 2057 | Guardagujas Viejo | Normal | `trchar028` | 5 estados; cree que el tren "llega mañana" desde hace 30 años |
| 2057 | Niña del Columpio | Consciente | `trchar010` | Sabe que el pueblo "se despierta" cuando alguien entra |
| 2058 | Hombre del Sombrero | Normal | `trainer_SCIENTIST` | En fase ≥4 su sombra tiene forma de Pokémon |
| 2059 | Fontanera | Normal | `trchar052` | Repara la fuente que nunca da agua; da la pala |
| 2060 | Sepulturero Nuevo | Normal | `trainer_HIKER` | Bloquea el callejón; pide la pala |
| 2061 | Leñador Ciego | Consciente | `trainer_HIKER` | «El bosque no está muerto. Está esperando.» |
| 2063 | Pescador de Nada | Normal | `SWIMMER_M` | Lanza al agua sin anzuelo; pesca mejores "recuerdos" que peces |
| 2065 | Sacerdote Sepia | Consciente | `trchar001` | Custodia la iglesia; da acceso al mausoleo |
| 2066 | Visitante de Tumbas | Interdimensional | `trchar028` | Fija: «Vi tu gorra antes. En otra tumba.» |
| 2067 | Guardián del Mausoleo | Normal | `trainer_PSYCHIC_M` | Duelo opcional (canLose) |
| 2069 | Jefe de Estación | Normal | `trchar015` | Anomalía A08: cambia de edad según la fase |
| 2070 | Bibliotecaria Ausente | Consciente | `trchar070` | Su voz guía el puzzle de libros sin que esté el sprite |
| 2071 | Campanero Sin Nombre | Consciente | `trchar042` | Toca la campana una vez por fase; la 7.ª vez no suena |
| 2072 | El Entrenador Sin Nombre | Interdimensional | `SECRET_Silver` | **El jefe del episodio**; no habla, solo asiente |

**Ejemplo de 5 estados** (Guardagujas Viejo, 2057):
```text
1: "El último tren pasó hace mucho. Yo sigo aquí por si vuelve."
2: "Hoy el andén estaba más corto. O yo más largo."
3: "¿Oyes? Las vías cantan cuando alguien que no es de aquí las pisa."
4: "No subas al campanario. Arriba el tiempo no corre: se queda."
5: (silencio) El NPC mira las vías y ya no responde.
```

---

## 4. Eventos programables

```
EV_SIL_Entrada       — 2057, celda 16,22 — Autorun (sw883 ON)
                       → presentación, tone fase 1, música "Lavender Town" (tema base) a 60 %
EV_SIL_Reloj         — 2059 — Interactuar con el reloj (15,12)
                       → v266>=3 : el minutero se mueve 1 min y vuelve; detecta anomalía A02
EV_SIL_Pala          — 2059 — Hablar con la Fontanera
                       → objeto de evento PALA; permite desbloquear 2060 (12,3)
EV_SIL_Escombros     — 2060 (12,3) — Usar PALA (comando 111 con variable de objeto)
                       → abre paso; 1 combate salvaje (arena)
EV_SIL_Espejo        — 2063 (10,8) — Autorun de celda
                       → 2 s de retraso en el reflejo del jugador (evento imagen espejo)
EV_SIL_Puente        — 2064 (15,10) — Al pisar la mitad en fase >=5
                       → el puente se hunde; el jugador puede volver por la orilla (sin daño)
EV_SIL_Tumbas        — 2066 — Leer 6 tumbas (5 estados por tumba)
                       → 6.ª tumba con el nombre del jugador ("\PN") en fase >=5
EV_SIL_Mausoleo      — 2067 — Entrar con Rotom nivel >=2
                       → duelo opcional; al ganar: CREEPY_PAGE_02 + llave de la iglesia
EV_SIL_Vagon         — 2069 — Interactuar con el vagón (5,12) en fase >=3
                       → la puerta se abre sola; dentro no hay nada y el reloj del andén cambia
EV_SIL_Libros        — 2070 — 4 estanterías (6,6) (10,6) (18,6) (22,6) con Sintonía (nivel 4)
                       → reconstruye la frase "EL QUE ESPERA NUNCA LLEGA"; abre 2071
EV_SIL_Campana       — 2071 (12,8) — Tocar la campana 6 veces (1 por fase)
                       → en fase 7 no suena: cae nieve digital del techo (marca A12)
EV_SIL_Caracol       — 2072 (10,20) — Pisar el centro de la escalera
                       → bucle visual 3 veces; a la 4.ª aparece el jefe
EV_SIL_Jefe          — 2072 — Autorun tras el bucle
                       → batalla (canLose) + fase de "fotografías" (ver §7)
EV_SIL_Sello         — 2072 — Tras ganar
                       → self-switch A, sw884 = ON, +10 resonancia, recompensa ODD KEystone (no duplicar: si ya existe, REVIVE)
EV_SIL_Salida        — 2072 — Salida libre al Monte Silver (2030)
```

---

## 5. Anomalías (13)

```
[A01] LA SOMBRA CON RETRASO — visual
  Map2058 — (10,7) [R5-6]. Fase >=2. La sombra del jugador camina 1 s después que él.

[A02] EL RELOJ QUE NO AVANZA — temporal
  Map2059 — (15,12). Fase >=3. Cada visita marca 4:44; si se usa el Rotom, marca la hora real.

[A03] LA FUENTE SECA QUE SUENA — auditiva
  Map2059 — (12,14). Fase >=4. Sin agua, se oye un chorro cuando nadie mira.

[A04] EL CALLEJÓN QUE SE ALARGA — espacial
  Map2060 — (3,20). Fase >=5. Al reentrar, el callejón tiene 6 tiles más.

[A05] EL ÁRBOL QUE SUSURRA — auditiva
  Map2061 — (22,10). Fase >=4. Susurra el nombre del pueblo; el texto es distinto si el Rotom está en nivel 4+.

[A06] EL ESTANQUE QUE DEVUELVE OTRA COSA — visual
  Map2063 — (12,9). Fase >=4. El reflejo muestra un pueblo intacto con gente.

[A07] EL PUENTE QUE YA SE HUNDIÓ — espacial
  Map2064 — (15,10). Fase >=5. Al reentrar, el puente está entero otra vez; al pisarlo, se hunde de nuevo.

[A08] EL JEFE DE ESTACIÓN QUE ENVEJECE — temporal
  Map2069 — (8,11). Cada reentrada, el NPC tiene 10 años más (hasta 4 estados de sprite).

[A09] EL VAGÓN QUE LLEGA VACÍO — auditiva
  Map2069 — (5,12). Fase >=3. Se oyen frenos y una puerta; el vagón no se mueve.

[A10] LOS LIBROS QUE SE BORRAN — visual
  Map2070 — (10,6). Fase >=6. Al leer un libro, su texto desaparece de la estantería.

[A11] LA TUMBA CON TU NOMBRE — temporal
  Map2066 — (24,18). Fase >=5. La 6.ª tumba lleva el nombre del jugador; al reentrar, sigue ahí.

[A12] LA NIEVE DIGITAL — visual
  Map2071 — (12,8). Fase 7. Al tocar la campana por 7.ª vez, cae nieve de píxeles (partículas R1).

[A13] LA ESCALERA QUE NO SUBE — espacial
  Map2072 — (10,20). Fase >=6. La escalera de caracol sube 3 pisos idénticos; solo el Rotom distingue la salida.
```

---

## 6. Objetos

| Tipo | Objeto | Dónde | Nota |
|---|---|---|---|
| Normales | `SUPER POTION`, `ANTIDOTE`, `AWAKENING` | 2058, 2061, 2068 | — |
| Normales | `ESCAPE ROPE` | 2064 (20,4) | No funciona (mensaje propio del episodio) |
| Creepypasta | `DN_PHOTO_01` — Foto sepia de un entrenador | 2066, tumba 4 | Se archiva; no ocupa mochila |
| Creepypasta | `DN_PAGE_02` — Página arrancada del Archivero | 2067, tras el guardián | — |
| Creepypasta | `DN_CARTRIDGE_02` — Cartucho gris sin etiqueta | 2069, vagón | 2.º fragmento: el Rotom lo lee y muestra el pueblo "antes" |
| Oculto | `ODD KEystone` | 2071, celda (3,28), solo tras el jefe | Recompensa única (si ya se posee, `REVIVE`) |
| Oculto | `MAX ELIXIR` | 2063 (2,20), bajo el agua | Requiere Rotom nivel ≥3 |
| Oculto | `TM_SLEEP_TALK` | 2070 (26,20), 4.ª estantería | Tras el puzzle de libros |

---

## 7. Pokémon y entidades

| Pokémon | Dónde | Cambio |
|---|---|---|
| `HOOTHOOT` / `NOCTOWL` | 2061 | Nivel 80–86; emiten sonido en vez de grito (silencioso) |
| `HOUNDOUR` / `HOUNDOOM` | 2068 | Nivel 82–88; los ojos brillan en sepia |
| `MISDREAVUS` / `MISMAGIUS` | 2066–2068 | Nivel 80–88 |
| `SHUPPET` / `BANETTE` | 2069 | Nivel 82–88 |
| `DUSKULL` / `DUSCLOPS` | 2070–2072 | Nivel 84–90 |
| `ABSOL` | 2057 (raro, amanecer) | Nivel 92, 1 % — "el que avisa" |
| `MAROWAK` | 2066 | Nivel 88; 5 % |

| Entidad | Ficha | Capturable | Cuándo |
|---|---|---|---|
| **EL SIN NOMBRE** (#A004) | ANOMALÍA-ENTRENADOR · ??? | **CONDICIONAL** (solo si se le gana sin usar objetos tras la 2.ª fase) | Jefe, 2072 |
| **EL QUE ESPERA** (#A005) | ANOMALÍA-ANDÉN · ??? | **NO** | 2069, vagón, fase ≥3 |
| **EL REFLEJO** (#A006) | ANOMALÍA-ESPEJO · ??? | **NO** | 2063, fase ≥4, si el jugador mira 3 veces el agua |

---

## 8. Música

| Momento | Pista existente | Modificación |
|---|---|---|
| Pueblo (fases 1–2) | `Lavender Town` | normal, volumen 60 % |
| Fases 3–4 | `Lavender Town` | pitch −10 %, se entrecorta en cada anomalía |
| Fases 5–6 | `PkmRS-MtPyre` | cruzada con `Lavender Town` al 50 % |
| Fase 7 | — | silencio + zumbido de cinta (`SE: Tape`) |
| Anomalía detectada | (silencio) | ping del Rotom |
| Jefe | `secretred` | pitch −12 %, sin percusión |

---

## 9. Jefe final del episodio: **EL SIN NOMBRE**

**Ficha**: `ANOMALÍA-ENTRENADOR` · tipo ??? · **capturable condicional** ·
mecánica: **no se le puede ganar hasta romper el recuerdo**.
**Sprite**: `SECRET_Silver` (existente).

| Fase | Mecánica |
|---:|---|
| A — **La silueta** | Batalla normal (canLose). El entrenador usa 6 Pokémon con **sprites de silueta** (`Shadow`): Noctowl 100, Marowak 102, Umbreon 101, Gengar 103, Froslass 101, Spiritomb 104. Si el jugador **gana aquí**, la batalla «no cuenta»: el jefe dice «Otra vez.» y se reinicia. Primer aviso de que el problema no es el combate. |
| B — **Las cuatro fotos** | El escenario 2072 tiene 4 fotografías colgadas. El jugador debe **romperlas** en orden (1-4) entre turnos; cada rotura muestra 1 línea de recuerdo (texto propio). Cada rotura quita al jefe 1/4 de "presencia". |
| C — **El nombre** | Con las 4 rotas, el jefe se convierte en **entidad capturable condicional** `#A004`: solo si el jugador **no usa objetos de curación** en esta batalla final, queda el encuentro de registro; si usa uno, el jefe se despide y el sello se obtiene igual (sin captura). |

```ruby
# EV_SIL_Jefe
pbTrainerBattle(PBTrainer.new("SIN_NOMBRE", "EL SIN NOMBRE"), false, "", true)
# Si gana: reinicio de fase (no cuenta)
pbMessage("El entrenador sin nombre vuelve a levantar la mirada. Otra vez.")
# Rota las 4 fotos con el comando de acción sobre cada celda
4.times { |i| pbMessage("La foto #{i + 1} se quema por los bordes.") }
# Fase final sin objetos: registro #A004
```
- **Al perder** en cualquier punto: reintento libre junto al campanario, grupo curado.
- **Al sellar**: `sw884 DN_EP02_SEALED = ON`, `v265 += 10`, página 2 archivada, grieta del Recuerdo estable.
- **Revancha**: «Revancha / Luego» disponible en el campanario tras el sello (nunca forzada).

---

## 10. Conexión con el siguiente universo

- Al sellar, el color **vuelve muy lentamente** al pueblo durante 8 segundos… y luego se vuelve a ir.
  El Rotom anota: `RESONANCIA 22/100 — EL RECUERDO TIENE COLOR DE UN DÍA`.
- En la nieve del campanario queda una **huella que sube hacia arriba** (vertical, contra la gravedad):
  es la **Grieta Blanca**, que abre `EP03 SNOW ON MT. SILVER` (puerta de la cumbre, `Map2022`, celda 8,6).
- El Archivero añade: «Cada recuerdo que sellas deja un testigo. Y los testigos se cuentan entre sí.»
- **Salida libre** al Monte Silver desde 2072.
