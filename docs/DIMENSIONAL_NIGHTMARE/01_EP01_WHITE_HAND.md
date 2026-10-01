# EPISODIO 01 — WHITE HAND / BURIED ALIVE
## «Las Catacumbas que se hunden» · Recurso base: **R7 — Catacumbas de Lavanda** (16 mapas)

**Universo**: White Hand / Buried Alive (inspiración; reinterpretado con voz propia).
**Filosofía de diseño**: **Descenso vertical**. El jugador *baja*, nunca sube: cada piso es una
fase de corrupción y cada fase es una forma de enterramiento (tierra, escombros, raíces, agua, olvido).
**Mapas propuestos**: `Map2041`–`Map2056` (16) · **Resonancia al sellar**: **+12**.
**Prerrequisito**: `v264 ≥ 3` (tres emisiones del Monte Silver selladas) y `v265 = 20` (Eco activo).
**Acceso**: octava puerta de la Gruta de los Testigos (`Map2030`, celda 34,12) — la puerta sin Unown.

---

## 1. Mapa del episodio

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2041 | Catacumbas — Entrada Arqueada | R7-1 | Outer/Int Lavender | 30×24 | Entrada, NPC guía, guardado |
| 2042 | Catacumbas — Sala de las Urnas | R7-4 | Int Cueva | 30×24 | Primeras anomalías, objeto oculto |
| 2043 | Catacumbas — Celdas | R7-2 | Int Cueva | 40×24 | NPCs conscientes, llave de celda |
| 2044 | Catacumbas — Galería de Barrotes | R7-6 | Int Cueva | 40×30 | Puzzle de puertas (4 palancas) |
| 2045 | Catacumbas — Escalera del Arco | R7-8 | Int Cueva | 24×30 | Vertical, transición de fase |
| 2046 | Catacumbas — Cripta de Sarcófagos | R7-3 | Int Cueva | 30×24 | Sarcófagos que se abren (fase 3+) |
| 2047 | Catacumbas — Osario | R7-14 | Int Cueva | 30×24 | Combates salvajes, huesos |
| 2048 | Catacumbas — Jardín de Raíces | R7-5 | Int Bosque | 30×24 | Raíces vivas, curaciones |
| 2049 | Catacumbas — Pasadizo que Respira | R7-11 | Int Cueva | 20×40 | Laberinto; se cierra por detrás |
| 2050 | Catacumbas — Galería de Mausoleos | R7-9 | Int Cueva | 40×24 | NPC "La Campanera" |
| 2051 | Catacumbas — Sala de Pedestales | R7-12 | Int Cueva | 30×24 | Puzzle de cráneos (4 pedestales) |
| 2052 | Catacumbas — Capilla de la Campana | R7-10 | Int Lavender | 30×24 | **Anomalía ancla**: la campana rota |
| 2053 | Catacumbas — Sala de las Bestias | R7-13 | Int Cueva | 30×24 | Guardianes; miniboss opcional |
| 2054 | Catacumbas — Pared de Inscripciones | R7-7 | Int Lavender | 30×24 | Traducción (Rotom Sintonía); lore |
| 2055 | Catacumbas — Sala Ritual | R7-15 | Int Lavender | 32×32 | Puzzle de pentagrama; antesala del jefe |
| 2056 | Catacumbas — Cámara de la Mano | R7-16 | Int Cueva + R1 | 24×24 | **Jefe final**; rojo sangre |

> **Orden de juego real**: 2041 → 2042 → 2043 → 2044 → 2045 → 2046 → 2047 → 2048 → 2049 → 2050
> → 2051 → 2052 → 2053 → 2054 → 2055 → 2056. Un piso = un mapa; la Escalera del Arco (2045) y
> el Pasadizo (2049) son los "descensos" que cambian de fase.

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Se activa en | Cambios visuales | Mapa base / recurso |
|---:|---|---|---|---|
| 1 | Entrada | 2041–2042 | Piedra seca, antorchas naranjas, polvo | R7-1, R7-4 |
| 2 | Humedad | 2043–2044 | Tinte gris verdoso; goteras; antorchas azules | R7-2, R7-6 |
| 3 | Primer eco | 2045–2046 | Tinte sepia; la campana suena a lo lejos; 3 antorchas apagadas | R7-8, R7-3 |
| 4 | Inversión | 2047–2048 | Raíces atraviesan paredes; huesos reordenados en el suelo | R7-14, R7-5 |
| 5 | Presencia | 2049–2051 | Siluetas encapuchadas en los bordes; NPCs desaparecen al reentrar | R7-11, R7-9, R7-12 |
| 6 | Sepultamiento | 2052–2054 | Arena y escombros caen (clima `Storm` en interior); bloques corruptos | R7-10, R7-13, R7-7 + **R1** |
| 7 | **Ruptura** | 2055–2056 | El mármol se vuelve código hexadecimal; el suelo desaparece por celdas; fondo negro | **R7-16 + R1-6 y R1-16** |

### Cambios por fase (comandos de referencia)
```ruby
# Fase 2 → 3 (al pisar 2045, celda 12,28)
$game_screen.tone = Tone.new(-40, -35, -20, 90)
$game_screen.start_flash(Color.new(255, 255, 255, 80), 20)
$game_map.change_fog("FogPurple", 0.4, 0.4, 0, 8)     # opcional; clima púrpura tenue
pbSet(266, 3)                                          # v266 DN_PHASE
```
[Nota para desarrollador: los cambios de fase se disparan **una vez** con `sw` de fase por mapa
(`DN_PHASE_2045`…), no en paralelo, para no relanzar el tinte al reentrar.]

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite existente | Rol y notas |
|---:|---|---|---|---|
| 2041 | Sepulturero Anciano | Normal | `trchar028` | 5 estados. Cree que Ash es un familiar. Estado 4: deja de excavar. |
| 2041 | Archivero (proyección) | Interdimensional | `trchar001` | Fija: «Otro visitante. O el mismo.» Cambia por fase. |
| 2042 | Mujer de las Urnas | Normal | `trchar042` | Cuenta las ánforas: siempre 47, aunque cambien. |
| 2042 | Niño de la Vela | Consciente | `trchar010` | Sabe que el piso "se repite" cada vez que llora. |
| 2043 | Carcelero Ciego | Normal | `trainer_HIKER` | Puzzle de celdas; no ve la fase hasta la 5. |
| 2043 | Preso 13 | Consciente | `trainer_YOUNGSTER` | «Cada vez que sales, vuelvo a entrar yo.» Da la llave si le muestras el Rotom. |
| 2044 | Custodio Doble | Normal ×2 | `trchar015` | Explican las 4 palancas; uno de ellos desaparece en fase 5. |
| 2046 | La Campanera | Consciente | `trainer_PSYCHIC_F` | Sabe que la Campana rota "se oye sola". Vende curaciones simbólicas (gratis). |
| 2047 | Aprendiz de Huesos | Normal | `trainer_YOUNGSTER` | Anomalía A03 depende de sus diálogos. |
| 2048 | Jardinera de Raíces | Consciente | `trchar052` | Cura 1 vez por visita; en fase 6 ya no está, pero su jaula de flores sí. |
| 2050 | Eco del Archivero | Interdimensional | `trchar001` | Repite la frase exacta del Archivero pero al revés. |
| 2051 | Sacerdote de los Cráneos | Normal | `trainer_PSYCHIC_M` | Puzzle; en fase 6 sus cráneos "lo miran". |
| 2052 | La que Escucha la Campana | Consciente | `trchar070` | Ancla narrativa del episodio; sobrevive a todas las fases. |
| 2053 | Guardián de las Bestias | Normal | `trainer_HIKER` | Reta a duelo opcional (canLose). |
| 2054 | Sombra Traductora | Interdimensional | `trchar028` | Traduce inscripciones (con Sintonía, nivel 4). |
| 2055 | Los Cuatro Encapuchados | Consciente ×4 | `trchar028` | No hablan; si el jugador se acerca al pentagrama, señalan el centro. |

**Ejemplo de diálogos de 5 estados** (Sepulturero Anciano, 2041):
```text
Estado 1: "Ah, un visitante. Hacía años que nadie bajaba a las Catacumbas."
Estado 2: "Cuarenta y siete ánforas, ¿ves? Siempre cuarenta y siete."
Estado 3: "Juraría que esta mañana había una antorcha más. Habrá sido el viento."
Estado 4: "No te acerques al pozo. Cuando el pozo respira, la gente baja sola."
Estado 5: (silencio) "..."   # el evento ya no muestra texto, solo mira hacia el pozo
```

---

## 4. Eventos programables

```
EV_CAT_Entrada        — Sala 2041 — Autorun al entrar (v264≥3)
                        → texto de la Grieta, sw883 = ON parcial, tone fase 1, música PkmRS-MtPyre
EV_CAT_Urnas          — 2042, 4 puntos — Al interactuar cada ánfora (en orden 3-1-4-2)
                        → v267 += 1; al 4.º: abre paso a 2043 y aparece objeto oculto A07
EV_CAT_Celdas         — 2043 — Hablar con "Preso 13" con Rotom nivel ≥1
                        → entrega llave de celda (event flag), sw de puerta 2044
EV_CAT_Palancas       — 2044 — 4 palancas en celdas (5,5) (24,5) (5,18) (24,18)
                        → orden correcto = arranca sonido de campana; error = reinicio sonoro (sin daño)
EV_CAT_Escalera       — 2045, celda 12,28 — Pisar
                        → fase 3: tinte sepia, fog, 3 antorchas OFF (sw por mapa)
EV_CAT_Sarcofagos     — 2046 — Abrir 3 sarcófagos (9,7) (15,7) (21,7)
                        → 3 combates salvajes encadenados; al ganar: objeto DN_PAGE_01
EV_CAT_Raices         — 2048 — Interactuar raíz central en fase ≥4
                        → curación completa al grupo + visión de 10 s (texto del Archivero)
EV_CAT_Pasadizo       — 2049 — Autorun al entrar
                        → el pasaje se cierra detrás (tile swap), la única salida es avanzar
EV_CAT_Campana        — 2052 — Pisar la plaza con la campana rota (fase ≥5)
                        → la música se detiene 4 s, suena 1 campana, sube v268, anomalía A09 queda marcada
EV_CAT_Pentagrama     — 2055 — 4 antorchas encendidas en las esquinas (5,5) (26,5) (5,26) (26,26)
                        → si las 4 están ON con v266=7: se abre 2056; si falta una, se apagan todas
EV_CAT_Mano          — 2056 — Autorun al entrar
                        → presentación de la Mano Blanca, batalla 2 fases (ver §7)
EV_CAT_Sello         — 2056 — Tras ganar
                        → self-switch A del jefe, sello 883, +12 resonancia, item SACRED ASH
EV_CAT_Salida        — 2056, celda 12,22 — Tras ganar
                        → teletransporte a la Gruta de los Testigos (2030, 34,14); v264 se respeta (no se toca)
```

---

## 5. Anomalías (12)

```
[A01] LA ANTORCHA QUE VUELVE — visual
  Map2042 — (7,6) [R7-4]. Fase ≥2. La antorcha apagada está encendida al reentrar, y viceversa.
  Documentar: usar Rotom junto a la antorcha.

[A02] CUARENTA Y OCHO ÁNFORAS — temporal
  Map2042 — (19,11). Fase ≥3. Al salir y volver a entrar, hay 48 ánforas y la mujer sigue contando 47.

[A03] EL APRENDIZ QUE NO RESPIRA — visual
  Map2047 — (14,18). Fase ≥4. El aprendiz no tiene sombra; al hablarle, su sprite mira al jugador.

[A04] LA CELDA 13 — espacial
  Map2043 — (24,9). Fase ≥3. Al reentrar, la celda 13 está abierta y vacía; el Preso 13 ya está fuera.

[A05] GOTERAS AL REVÉS — visual
  Map2044 — (12,3). Fase ≥2. El agua cae hacia arriba en una franja de 3 tiles.

[A06] LA ESCALERA INFINITA — espacial
  Map2045 — (12,2). Fase ≥5. Si se sube 3 veces seguidas sin bajar, se llega al mismo sitio con 1 fase más.

[A07] EL HUESO QUE SE MUEVE — visual
  Map2047 — (6,20). Cualquier fase. El hueso cambia de orientación según la dirección del jugador.

[A08] LA RAÍZ CON LATIDO — auditiva
  Map2048 — (15,12). Fase ≥4. Al pisar la raíz central la música baja a 50 % durante 6 s (latido).

[A09] LA CAMPANA QUE SUENA SOLA — auditiva
  Map2052 — (12,10). Fase ≥5. Al reentrar, suena una campana aunque el mapa esté en silencio.

[A10] EL AGUA QUE SUBE — visual/temporal
  Map2050 — (8,9). Fase ≥6. Cada reentrada el nivel de agua sube 1 tile; nunca supera la rodilla.

[A11] LOS CRÁNEOS QUE MIRAN — visual
  Map2051 — (15,8). Fase ≥6. Los 4 cráneos de los pedestales siguen al jugador con la mirada.

[A12] LA INSCRIPCIÓN QUE CAMBIA — auditiva/visual
  Map2054 — (12,4). Fase ≥6. Con Rotom nivel ≥4, las runas dicen una frase distinta en cada visita
  (5 frases rotativas). Sin Sintonía, solo se oyen susurros.
```

---

## 6. Objetos

| Tipo | Objeto | Dónde | Nota |
|---|---|---|---|
| Normales | `ANTIDOTE`, `SUPER POTION`, `REVIVE` | 2042, 2047, 2050 | Sobre sarcófagos y ánforas (visibles) |
| Normales | `ESCAPE ROPE` | 2044 (celda 24,18) | Guiño: en las catacumbas **no** funciona (mensaje propio) |
| Creepypasta | `DN_PAGE_01` — Página quemada del Archivero | 2046, tras los 3 sarcófagos | Se archiva; no ocupa mochila |
| Creepypasta | `DN_TOOTH_01` — Diente de hueso pulido | 2047 (12,22) | Objeto de colección (Registro) |
| Creepypasta | `DN_CARTRIDGE_01` — Fragmento de cartucho | 2051, tras el puzzle de cráneos | Primer fragmento del juego; enciende la línea argumental del Nexo |
| Oculto | `SACRED ASH` | 2056, celda (12,10), solo tras el jefe | Recompensa única del episodio |
| Oculto | `RARE CANDY` | 2049 (3,37), tras cerrarse el pasadizo | Requiere Rotom nivel ≥3 (Marcador) |
| Oculto | `PP MAX` | 2053 (22,12), detrás de la bestia derecha | Detrás de un guardián opcional |

---

## 7. Pokémon y entidades

| Pokémon alterado | Dónde | Cambio |
|---|---|---|
| `CUBONE` | 2046–2047 | Nivel 78–84; algunos llevan `THICK CLUB` y **siempre** huyen a 1 PS |
| `MAROWAK` | 2046 | Nivel 88; variante "sin hueso" (icónico del episodio) |
| `GASTLY` / `HAUNTER` | 2042–2052 | Nivel 76–86; aparecen en zonas sin antorcha |
| `DUSKULL` / `DUSCLOPS` | 2049–2051 | Nivel 80–86 |
| `YAMASK` / `COFAGRIGUS` | 2050–2053 | Nivel 82–88 |
| `GOLETT` / `GOLURK` | 2048, 2053 | Nivel 84–90 |
| `SPIRITOMB` | 2056 (raro) | Nivel 92, 1 % |

| Entidad | Ficha | Capturable | Cuándo aparece |
|---|---|---|---|
| **EL QUE RESPIRA** (#A001) | ANOMALÍA-POZO · tipo ??? | **NO** | Fase ≥6, mapa 2049 (si el jugador se queda quieto 20 s) |
| **LA MANO BLANCA** (#A002) | ANOMALÍA-ALTAR · tipo ??? | **NO** | Jefe de 2056 (2.ª fase) |
| **LA CAMPANERA** (#A003) | ANOMALÍA-TESTIGO · tipo ??? | **NO** | 2052, aparece en fase 7 en el pentagrama |

**Mecánica de "El que respira"** (encuentro, no captura):
```ruby
# EV_CAT_Pozo — Map2049 (10,36)
# Si el jugador permanece 20 s sin moverse y v266>=6:
pbPlayCry("SPIRITOMB")
pbMessage("El pozo inspira. El suelo se mueve hacia arriba. \\nEl Rotom marca: #A001 — EL QUE RESPIRA.")
pbSet(274, $game_variables[274] + 1)   # anomalía registrada
# Nunca inicia batalla: la entidad "respira" y el mapa recupera el silencio.
```

---

## 8. Música

| Momento | Pista (existente en `Audio/BGM`) | Modificación |
|---|---|---|
| Pisos 1–2 | `PkmRS-MtPyre` | normal |
| Pisos 3–5 | `PkmRS-MtPyre` | pitch −8 %, volumen 85 %, reverb |
| Pisos 6–7 | `A Trap With No Return` | volumen 70 %, se corta 4 s en cada anomalía auditiva |
| Anomalía detectada | (silencio) | 1.5 s de silencio + `SE: Rotom ping` |
| **Jefe — 1.ª fase** | `A Trap With No Return` | + `SE: Bell` cada 4 turnos |
| **Jefe — 2.ª fase (Mano)** | `secretred` (procesado) | pitch −15 %, coro invertido |
[Nota para desarrollador: reutilizar pistas existentes; si se desea un tema propio del jefe,
componerlo es decisión de arte, no requisito de implementación.]

---

## 9. Jefe final del episodio: **LA MANO BLANCA**

**Ficha**: entidad `ANOMALÍA-ALTAR`, tipo ??? · no capturable · 2 fases ·
mecánica especial: **el jefe no tiene PS visibles**.

| Fase | Qué pasa | Cómo se "daña" |
|---:|---|---|
| A — **EL SEPULTADO** | Entrenador `HIKER` (sprite sepulturero) con equipo de tierra/roca: Marowak 103, Golurk 105, Cofagrigus 103, Dusknoir 104, Sableye 101, Spiritomb 105 | Igual que una batalla normal (canLose). Al ganar, **no** termina. |
| B — **LA MANO BLANCA** | La Mano emerge del altar. El rotom avisa: «No puedes golpearla. Golpea lo que la sostiene.» | El jugador debe activar **4 cadenas** del escenario entre turnos (interactuar con celdas (6,4) (17,4) (6,19) (17,19)). Cada cadena rota = 1/4. Si recibe un golpe del "turno de Mano" no hay daño real: solo se pierde un turno (mensaje). |

```ruby
# EV_CAT_Mano — secuencia real de la batalla
pbTrainerBattle(PBTrainer.new("SEPULTADO", "EL SEPULTADO"), false, "", true)  # f1 (canLose)
# f2: sin batalla de PS; evento con turnos
4.times do |i|
  pbMessage("Una cadena sostiene la Mano. (#{i}/4)")
  pbWait(20)
  # el jugador tiene 3 s para llegar a la cadena y pulsar acción
  pbMoveRoute($game_player, [PBMoveRoute::StepForward])
end
# al romper las 4: la Mano se hunde; self-switch A del jefe; sello
```
- **Al perder**: se reanuda junto a la entrada de 2056 con el grupo curado. No hay penalización.
- **Al ganar**: `sw883 DN_EP01_SEALED = ON`, self-switch A del evento jefe, `v265 += 12` (tope 100),
  recompensa única `SACRED ASH`, página `DN_PAGE_01` sellada en el Archivero.
- **Revancha**: no aplica (jefe sellado); el Sepulturero de la entrada ofrece un reencuentro opcional por menú.

---

## 10. Conexión con el siguiente universo

1. Al sellar, el altar se apaga y en el suelo aparece la **Grieta de Cenizas** (una grieta vertical de ceniza).
2. El Rotom anota: `RESONANCIA 12/100 — EL MUNDO DE ABAJO YA TIENE TESTIGO`.
3. La grieta teje un pasillo de niebla hasta el **Bosque Sepia** (EP02, `Map2057`):
   se desbloquea la puerta `DN_GRIETA_02` en la Gruta de los Testigos (sw por mapa).
4. El Archivero (2030) añade la primera página del itinerario y avisa:
   «Lo que bajó contigo no puede volver a bajar. Pero puede **recordar**.»
5. **Salida libre** desde 2056 al Monte Silver en cualquier momento posterior.
