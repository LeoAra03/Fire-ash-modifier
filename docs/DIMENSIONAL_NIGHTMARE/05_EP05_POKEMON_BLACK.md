# EPISODIO 05 — POKÉMON BLACK
## «El mundo que se quedó en blanco» · Recursos base: **R5 (sepia/B&N)** + **R1 (Glitch City)**

**Universo**: Pokémon Black (el cartucho que no era de este mundo; inspiración reinterpretada).
**Filosofía de diseño**: **Vacío progresivo**. No hay enemigo que persiga: hay **ausencia**. Cada vez
que el jugador reentra, falta algo: un NPC, un árbol, un tile, un color. El mapa no se corrompe
*por acumulación*: se corrompe **por sustracción**.
**Mapas propuestos**: `Map2104`–`Map2119` (16) · **Resonancia al sellar**: **+16**.
**Prerrequisito**: EP04 sellado (`sw886`) y Rotom nivel ≥2 (Escucha).
**Acceso**: tercera puerta del Árbol Anciano (2103) o Grieta Blanca de la Gruta (2030, 18,22).

> **Nota de diseño (espejo del EP02).** EP05 reutiliza **los mismos tiles R5** del episodio 02, pero
> **vacíos**: es el mismo pueblo, sin nadie y sin color, años después. Reutilizar el tileset es
> intencional: el jugador reconoce el lugar antes que el Rotom. La R1 entra en fases 5–7.

---

## 1. Mapa del episodio

| Mapa | Título | Recurso | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2104 | Pueblo 000 — Entrada | R5-1 vacío | Outer Ciudad (blanco) | 32×24 | Entrada; no hay nadie |
| 2105 | Calle Incompleta | R5-6 vacío | Outer Ciudad | 32×24 | Tiles que faltan (huecos negros) |
| 2106 | Plaza sin Fuente | R5-10 vacío | Outer Ciudad | 30×30 | La fuente ha dejado de existir |
| 2107 | Callejón Terminado | R5-2 vacío | Outer Bosque | 30×24 | Antes lleno de escombros; ahora limpio y vacío |
| 2108 | Bosque Sin Troncos | R5-9 vacío | Outer Bosque | 40×30 | Solo sombras donde había árboles |
| 2109 | Páramo Blanco | R5-3 vacío | Outer Bosque | 30×24 | Blanco total; sin horizonte |
| 2110 | Estanque Vacío | R5-13 vacío | Outer Agua | 30×24 | El agua está en otra parte (tiles huecos) |
| 2111 | Puente Cortado | R5-5 vacío + R1 | Outer Agua | 30×24 | Puente partido en 2; primera R1 |
| 2112 | Colina Erguida | R5-7 vacío | Outer Cementerio | 40×30 | La iglesia está, pero su sombra no |
| 2113 | Cementerio Vacío | R5-3bis vacío | Outer Cementerio | 40×30 | Tumbas **sin inscripción** |
| 2114 | Mausoleo Abierto | R5-15 vacío | Int Cementerio | 30×24 | Dentro, un espejo (miniboss) |
| 2115 | Estación 000 | R5-14 vacío + R1 | Int Estación | 40×24 | Vías que no llevan a ningún sitio |
| 2116 | Biblioteca sin Letras | R5-12 vacío + R1 | Int Biblioteca | 30×24 | Libros en blanco (puzzle) |
| 2117 | Campanario Roto | R5-16 vacío + R1 | Int Campanario | 24×32 | **Recuerdo del EP02**; puerta al glitch |
| 2118 | Pueblo 404 | R1-4 + R1-11 | Outer Glitch | 32×24 | El "pueblo" coral de la R1 |
| 2119 | El Borde del Mundo | R1-6 + R1-16 | Void | 30×30 | **Jefe final**: el Vacío con forma de Ash |

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Se activa en | Cambios | Recurso |
|---:|---|---|---|---|
| 1 | Vacío silencioso | 2104–2105 | Sin NPCs, sin música, colores casi completos | R5 vacío |
| 2 | Sustracción | 2106–2107 | Desaparecen detalles: carteles, vallas, sombras | R5 vacío |
| 3 | Silencio | 2108–2109 | Se pierde el sonido ambiental; el tinte pierde saturación | R5 vacío |
| 4 | Huecos | 2110–2111 | Tiles negros (`id 0`) donde había agua/puente; la R1 asoma | R5 + **R1** |
| 5 | Los que faltan | 2112–2113 | Aparecen **ausencias con forma**: siluetas de NPCs del EP02 | R5 + R1 |
| 6 | Código | 2114–2116 | Bloques hexadecimales en paredes; el suelo se muestra como `0x00` | **R1** |
| 7 | **Ruptura** | 2117–2119 | El mundo es un mapa a medias: caminar por el vacío, paredes invisibles, glifos | **R1 completo** |

### Mecánica de sustracción (sin pérdida real)
```ruby
# Al ENTRAR a un mapa en fase >=2, se elimina 1 elemento por visita (hasta 3):
#   - 1 NPC secundario (switch de ausencia por mapa, no self-switch)
#   - 1 objeto decorativo (tile swap a id 0)
# Al salir del episodio, TODO se restaura (los switches de ausencia se resetean con el sello).
# Regla dura: nunca desaparecen el guardado, la salida, la curación ni ningún objeto de misión.
```

---

## 3. NPCs por mapa
*(En EP05 casi no hay NPCs: los "habitantes" son **ausencias** y proyecciones. Por eso esta tabla
es más corta — es una decisión de diseño, no un hueco.)*

| Mapa | NPC | Tipo | Sprite | Rol y notas |
|---:|---|---|---|---|
| 2104 | Silueta del Guardagujas | Consciente (eco) | `trchar028` opacidad 90 | Repite una frase del EP02, sin voz |
| 2105 | Silueta de la Fontanera | Consciente (eco) | `trchar052` opacidad 90 | Señala un hueco en el suelo |
| 2107 | Silueta del Sepulturero | Interdimensional | `trainer_HIKER` | Fija: «Ya me enterraste una vez. Gracias.» |
| 2109 | El Último Niño | Consciente | `trchar010` | Es el único NPC sólido del episodio; no tiene sombra |
| 2112 | Cura Silenciosa | Interdimensional | `trchar001` | Cura sin hablar (menú de sí/no) |
| 2114 | El Espejo | Interdimensional | (evento sin sprite) | Miniboss opcional: copia el equipo del jugador |
| 2116 | Bibliotecaria Que Se Fue | Consciente (eco) | `trchar070` opacidad 120 | Solo aparece en fase ≥6 |
| 2117 | El Campanero Vacío | Consciente | `trchar042` | Toca una campana que ya no existe |
| 2119 | **EL JUGADOR 000** | Interdimensional | `SECRET_Red` (tinte negro) | Jefe final |

**Ejemplo de 5 estados** (El Último Niño, 2109):
```text
1: "¿Tú también te estás quedando sin partes?"
2: "Ayer tenía dos manos. Hoy tengo una y no me duele."
3: "Si cierras los ojos, el pueblo vuelve. Pero solo si no los abres."
4: "No me mires mucho. Si me miras, te acuerdas de mí. Y olvidar es lo que nos queda."
5: (silencio) El niño sigue de pie. Su contorno tiembla como un sprite mal cargado.
```

---

## 4. Eventos programables

```
EV_BLK_Entrada    — 2104 — Autorun (sw886 ON)
                     → sin música; tone fase 1 (casi normal); mensaje "no hay nadie"
EV_BLK_Ausencia   — Paralelo en 2105..2113 — Cada reentrada en fase >=2
                     → desactiva 1 NPC/tile por visita (switch DN_BLK_AUS_XX); nunca toca curación/salida
EV_BLK_Fuente     — 2106 (15,15) — Interactuar con el hueco de la fuente
                     → texto del EP02; el Rotom guarda la "diferencia" (v274 += 1)
EV_BLK_Escombros  — 2107 (12,3) — En fase >=3 hay un hueco con forma de pala
                     → recoger la PALA del EP02 (si no se tiene); objeto de evento
EV_BLK_Puente     — 2111 (15,10) — El puente está partido
                     → rodeo por la orilla; en fase >=5 el hueco es un tile R1 (glitch visual)
EV_BLK_Tumbas     — 2113 — 6 tumbas sin nombre
                     → con Rotom nivel >=4 (Sintonía), las inscripciones "reaparecen" 2 s
EV_BLK_Espejo     — 2114 (15,12) — Miniboss opcional
                     → batalla con un entrenador que copia el equipo del jugador (ver §7)
EV_BLK_Mausoleo   — 2114 — Tras el Espejo
                     → objeto DN_PHOTO_03 (foto en blanco)
EV_BLK_Vias       — 2115 (20,12) — Caminar por las vías
                     → en fase >=6 las vías se convierten en una línea de código (R1)
EV_BLK_Libros     — 2116 — 4 estanterías vacías
                     → con Rotom nivel >=4, leer los libros "en blanco" reconstruye 4 frases de EP02
EV_BLK_Campana    — 2117 (12,8) — Tocar el hueco de la campana
                     → suena una campana que no existe; abre 2118 (primera zona R1 pura)
EV_BLK_R1Zona     — 2118 (16,12) — Estar 5 s quieto en fase 7
                     → el mapa "renderiza mal": sprites duplicados (eventos espejo), sin daño
EV_BLK_Jefe       — 2119 — Autorun
                     → batalla espejo (ver §7)
EV_BLK_Sello      — 2119 — Tras ganar
                     → sw887 = ON, +16 resonancia, restauración de TODAS las ausencias de EP05
EV_BLK_Salida     — 2119 (15,28) — Salida libre a 2030 / 2021
```

---

## 5. Anomalías (13)

```
[A01] EL PUEBLO SIN PERRO — visual
  Map2104 — (10,10) [R5-1 vacío]. Fase >=1. Hay una caseta de perro sin perro y sin cadena.

[A02] LA CALLE QUE FALTA — espacial
  Map2105 — (16,3). Fase >=2. Al reentrar, un tramo de 4 tiles ya no existe (hueco negro transitable).

[A03] LA FUENTE QUE NO SUENA — auditiva
  Map2106 — (15,15). Fase >=2. Donde el EP02 había agua, ahora hay un silencio "con forma de agua".

[A04] LOS ÁRBOLES QUE SON SOMBRA — visual
  Map2108 — (20,14). Fase >=3. Las sombras de los árboles siguen ahí aunque los árboles no.

[A05] EL PÁRAMO SIN HORIZONTE — visual
  Map2109 — (15,15). Fase >=4. El fondo blanco no tiene horizonte: es una pared a 3 tiles.

[A06] EL ESTANQUE EN OTRO SITIO — espacial
  Map2110 — (12,12). Fase >=4. Al reentrar, el agua aparece 20 tiles más allá (un charco R1).

[A07] EL PUENTE PARTIDO — espacial
  Map2111 — (15,10). Fase >=4. La mitad del puente está en la otra orilla, invertida.

[A08] LA IGLESIA SIN SOMBRA — visual
  Map2112 — (20,10). Fase >=5. La iglesia proyecta sombra de un edificio que ya no está.

[A09] LAS TUMBAS SIN NOMBRE — temporal
  Map2113 — (14,14). Fase >=5. Las 6 tumbas están en blanco; con Sintonía, muestran nombres 2 s.

[A10] EL MAUSOLEO ABIERTO — espacial
  Map2114 — (15,10). Fase >=5. Al reentrar, la puerta del mausoleo está abierta y la de dentro cerrada.

[A11] LAS VÍAS A NINGUNA PARTE — visual
  Map2115 — (20,12). Fase >=6. Las vías se vuelven una línea de código hexadecimal (R1-3).

[A12] LOS LIBROS EN BLANCO — visual
  Map2116 — (10,6). Fase >=6. Los libros no tienen letras; al abrirlos, el texto "casi" aparece.

[A13] LA CAMPANA HUECA — auditiva
  Map2117 — (12,8). Fase >=6. Se oye una campana con 1 s de retraso exacto sobre el gesto de tocarla.
```

---

## 6. Objetos

| Tipo | Objeto | Dónde | Nota |
|---|---|---|---|
| Normales | `HYPER POTION`, `FULL HEAL`, `REVIVE` | 2105, 2110, 2115 | Los únicos objetos "con color" del episodio |
| Normales | `TM_REST` | 2116, tras el puzzle de libros | — |
| Creepypasta | `DN_PHOTO_03` — Foto en blanco | 2114, tras el Espejo | Se archiva; con Sintonía revela una silueta |
| Creepypasta | `DN_PAGE_05` — Página sin tinta | 2117, tras la campana | — |
| Creepypasta | `DN_CARTRIDGE_05` — Cartucho negro | 2119, tras el jefe | 5.º fragmento; el Rotom lo llama "el cartucho 000" |
| Oculto | `BLACK GLASSES` | 2108 (36,4) | Temático |
| Oculto | `MAX REVIVE` | 2118 (28,20), en el glitch | Requiere Rotom nivel ≥3 |
| Oculto | `LEFTOVERS` (si no se obtuvo del v1) | 2113 (4,36), tras el jefe | Recompensa única |

---

## 7. Pokémon y entidades

| Pokémon | Dónde | Cambio |
|---|---|---|
| `PORYGON` / `PORYGON2` / `PORYGON-Z` | 2104–2117 | Nivel 84–94; aparecen tras "ausencias" |
| `DITTO` | Todo el episodio | Nivel 88; se transforma en Pokémon **que no existen** (fallback controlado) |
| `MIMIKYU` (si existe) / `SHUPPET` | 2105–2114 | Nivel 84–92 |
| `ROTOM` (salvaje) | 2115 | Nivel 90, 2 %; el Rotom del jugador "reacciona" (texto) |
| `UNOWN` (letra `?` y `!` si existen) | 2118–2119 | Nivel 88–95 |
| `MISSINGNO`-equivalente | — | **No existe como especie**: se representa con un `UNOWN` corrupto (safe) |

| Entidad | Ficha | Capturable | Cuándo |
|---|---|---|---|
| **EL JUGADOR 000** (#A013) | ANOMALÍA-ESPEJO · ??? | **NO** | Jefe, 2119 |
| **EL ÚLTIMO NIÑO** (#A014) | ANOMALÍA-AUSENCIA · ??? | **CONDICIONAL** (hablarle 5 veces en distintas fases) | 2109 |
| **EL ESPEJO** (#A015) | ANOMALÍA-DOBLE · ??? | **NO** | 2114, miniboss |

---

## 8. Música

| Momento | Pista existente | Modificación |
|---|---|---|
| Fases 1–3 | (ninguna) | silencio absoluto + viento |
| Fases 4–5 | `Lavender Town` | volumen 20 %, con cortes de 2 s |
| Fases 6–7 | `A Trap With No Return` | 40 %, pitch variable (sube/baja 1 semitono por anomalía) |
| Anomalía detectada | (silencio) | ping del Rotom |
| Jefe | `secretred` | invertida, con `SE: Static` cada 4 turnos |

---

## 9. Jefe final del episodio: **EL JUGADOR 000**

**Ficha**: `ANOMALÍA-ESPEJO` · tipo ??? · no capturable · **sprite** `SECRET_Red` con tinte negro.
**Mecánica especial**: **combate espejo**. El jefe **copia el equipo del jugador** (mismas especies,
mismos niveles, mismos movimientos) y además **copia sus objetos de curación**:

| Fase | Mecánica |
|---:|---|
| A — **El espejo** | Se genera un equipo idéntico al del jugador (script `pbPartyCopy`) y se enfrenta en una batalla (canLose). Si el jugador cambia de equipo antes de entrar, el jefe también. |
| B — **La rendija** | Tras la batalla, el escenario 2119 tiene 4 "rendijas" (tiles R1 que se abren al caminar cerca). Cada rendija absorbe 1/4 del 000 y **devuelve** al jugador una copia de un objeto suyo (nunca uno único). |
| C — **El nombre** | Con las 4 rendijas cerradas, el 000 intenta decir el nombre del jugador (lo lee de `\PN`) y no puede. Queda sellado. |

```ruby
# EV_BLK_Jefe — combate espejo (seguro, sin copiar Pokémon del jugador de verdad)
enemy = dn_mirror_party($player.party)   # nueva party con la misma composición
pbTrainerBattle(PBTrainer.new("JUGADOR000", "EL JUGADOR 000"), false, "", true, enemy)
4.times { |i| pbMessage("Una rendija se cierra. La silueta pierde un borde.") }
```
[Nota para desarrollador: `dn_mirror_party` debe clonar especies/niveles/movimientos, **no** clonar
Pokémon concretos del jugador (nada de robar/duplicar instancias). Si el jugador entra con 1 Pokémon,
el jefe usa 1. Equilibrado por diseño.]
- **Al ganar**: `sw887 DN_EP05_SEALED = ON`, `v265 += 16`, `DN_PAGE_05` archivada.
- **Revancha**: el niño de 2109 ofrece «Rendija / Luego».

---

## 10. Conexión con el siguiente universo

- Al sellar, el mundo se repinta durante 5 s… pero **en teal**. Cada color vuelve con un tinte
  azul-verdoso que no es del mundo: es la **antesala del Rey**.
- El Rotom: `RESONANCIA 64/100 — EL VACÍO TE VIÓ Y SE APRENDIÓ TU CARA`.
- La grieta final no es una grieta: son **renglones de código** que suben hacia arriba.
  Tras ellos, una escalera imposible con 16 salas (`Map2120`, EP06).
- El Archivero: «El que escribe los mundos se ha quedado sin papel. Ahora escribe con lo que
  encuentra. Y ha encontrado tu nombre.»
- **Salida libre** al Monte Silver desde 2119.
