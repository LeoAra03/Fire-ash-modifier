# EPISODIO 06 — KING UNOWN
## «El trono que lee a quien lo mira» · Recursos base: **R4 (El Trono del Rey Unown, 16 mapas)** + **R3 (sprite del Rey)**

**Universo**: King Unown (inspiración; reinterpretado con voz propia).
**Filosofía de diseño**: **Conocimiento prohibido / acertijo total**. Aquí no se combate al principio:
se **lee**. El Rey Unown no quiere tu vida: quiere tu **nombre**. Cada sala es un renglón; cada
renglón es una letra; cada letra es una prueba.
**Mapas propuestos**: `Map2120`–`Map2135` (16) · **Resonancia al sellar**: **+18**.
**Prerrequisito**: los cinco episodios anteriores sellados (`sw883`–`sw887`) y `v264 = 7`.
**Acceso**: escalera de código al final de 2119 → **Atrio de las Letras** (2120).

---

## 1. Mapa del episodio

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2120 | Atrio de las Letras | R4-1 | Int Trono | 30×24 | Entrada; dos estatuas; primer Unown vivo |
| 2121 | Sala de la Inscripción | R4-2 | Int Trono | 30×24 | Texto **KINGGUS / AYO@HERE** en el suelo |
| 2122 | Corredor de Columnas | R4-3 | Int Trono | 40×24 | Trampa de pasos (alfombra que se hunde) |
| 2123 | Biblioteca Prohibida | R4-4 | Int Biblioteca | 40×30 | **Letra K** — puzzle de estanterías |
| 2124 | Balcón de los Unown | R4-5 | Int Trono | 30×24 | Unown flotantes; **Letra I** |
| 2125 | Sala del Ojo | R4-6 | Int Trono | 30×24 | El ojo gigante; **Letra N** |
| 2126 | Escalinata Interior | R4-7 | Int Trono | 30×30 | Vertical; puertas selladas por letra |
| 2127 | Cripta de Sarcófagos | R4-8 | Int Cripta | 40×24 | **Letra G** (1) |
| 2128 | Sala de los Símbolos | R4-9 | Int Trono | 30×30 | Puzzle de suelo Unown; **Letra G** (2) |
| 2129 | Caverna de Cristales | R4-10 | Int Cueva | 30×24 | **Letra U**; miniboss opcional |
| 2130 | Galería Inundada | R4-11 | Int Agua | 32×24 | Unown en el agua; **Letra S** |
| 2131 | Salón de las Estatuas | R4-12 | Int Trono | 30×24 | 4 estatuas que hablan |
| 2132 | Galería Menor | R4-13 | Int Trono | 30×24 | Estatuas pequeñas; objeto oculto |
| 2133 | Sala del Trono | R4-14 | Int Trono | 30×30 | Trono vacío; se abre la cámara final |
| 2134 | Sala LEAVENOW | R4-15 | Int Trono | 30×24 | **Advertencia**; última decisión |
| 2135 | Cámara de KINGGUS | R4-16 + R3 + R1 | Int Trono + Glitch | 32×32 | **Jefe final del juego** |

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Se activa en | Cambios | Recurso |
|---:|---|---|---|---|
| 1 | Trono intacto | 2120–2121 | Púrpuras y grises; Unown decorativos | R4 |
| 2 | Las letras miran | 2122–2123 | Los Unown de las paredes giran hacia el jugador | R4 |
| 3 | El suelo lee | 2124–2125 | Los símbolos del suelo se iluminan al pisarlos | R4 |
| 4 | Las puertas piden | 2126–2127 | Puertas selladas que exigen la letra correcta | R4 |
| 5 | Los Unown despiertan | 2128–2130 | Unown flotantes activos (aparecen, no combaten salvo contacto) | R4 |
| 6 | El código escribe | 2131–2133 | Tiles corruptos en las paredes; texto `AYO@HERE` aparece y desaparece | R4 + **R1** |
| 7 | **Ruptura** | 2134–2135 | El trono se vuelve R1 completo: suelo de código, ojo gigante, sprites corruptos, 16 colores | **R1 + R4-16 + R3** |

### Las 7 letras (puzzle maestro)
Las siete letras de **K-I-N-G-G-U-S** se obtienen en: Biblioteca (K), Balcón (I), Sala del Ojo (N),
Cripta (G), Símbolos (G), Caverna (U), Galería Inundada (S).
En la Cámara (2135) el suelo tiene 7 pedestales; el jugador debe **poner las letras en orden**.
Si el orden es incorrecto, las letras se reinician (sin daño) y el Rey "ríe" (SFX).
```ruby
# Verificación del orden en 2135
orden = ["K","I","N","G","G","U","S"]
if entrada == orden
  pbMessage("El suelo deletrea. El Rey se levanta.")
  activar_jefe
else
  pbMessage("Las letras se revuelven. Vuelve a empezar.")
  resetear_letras
end
```

---

## 3. NPCs por mapa
*(En el Trono los "NPCs" son Unown y custodios; los humanos que quedan son los que ya no pueden salir.)*

| Mapa | NPC | Tipo | Sprite | Rol y notas |
|---:|---|---|---|---|
| 2120 | Custodio del Atrio | Interdimensional | `trchar028` | Fija: «El Rey no lee libros. Lee gente.» |
| 2121 | Escriba Ciego | Consciente | `trainer_SCIENTIST` | Lee el texto del suelo con los dedos |
| 2122 | Los Dos Porteros | Normal ×2 | `trchar015` | Exigen "la primera letra"; uno miente (según fase) |
| 2123 | Bibliotecaria del Rey | Consciente | `trchar070` | Da la letra **K**; sus libros no se pueden leer sin Sintonía |
| 2124 | Unown Coro | Entidad ×5 | `UNOWN` (chars) | No hablan; forman palabras con su posición |
| 2125 | El Ojo | Interdimensional | (evento sin sprite) | Observa; si el jugador parpadea (menú), parpadea |
| 2126 | Escalera Parlante | Consciente | (texto) | Cada 3 escalones dice una letra |
| 2127 | Sepulturero del Rey | Normal | `trainer_HIKER` | Da la letra **G** si se le cuenta una verdad |
| 2128 | Sacerdote de Símbolos | Consciente | `trainer_PSYCHIC_M` | Explica el orden K-I-N-G-G-U-S |
| 2129 | Minero de Cristal | Normal | `trainer_HIKER` | Miniboss opcional; da la letra **U** |
| 2130 | Pescador de Letras | Consciente | `SWIMMER_M` | Da la letra **S** a cambio de una `PEARL` |
| 2131 | Cuatro Estatuas | Interdimensional ×4 | (tiles/estatuas) | Hablan una vez cada una; juntas dan la clave del trono |
| 2133 | El Trono Vacío | Interdimensional | (objeto) | Al sentarse: visión de 20 s (lore completo) |
| 2134 | El Guardián de la Advertencia | Consciente | `trchar137` | Repite **LEAVENOW**; ofrece salir sin pelear |
| 2135 | **KINGGUS** | Jefe final | Sprite **R3** | No habla: **deletrea** |

**Ejemplo de 5 estados** (Escriba Ciego, 2121):
```text
1: "Bajo mis dedos dice: KINGGUS. Arriba dice: AYO@HERE. No sé cuál es la verdad."
2: "El texto de arriba cambia según quién mire. Por eso no miro."
3: "Si el Rey te lee, te escribe. Y lo escrito no se borra."
4: "Los que vinieron antes tenían tu mismo paso. Todos. Absolutamente todos."
5: (silencio) El escriba recorre el suelo con la mano y ya no encuentra nada.
```

---

## 4. Eventos programables

```
EV_UNO_Atrio      — 2120 — Autorun (sw883..887 y v264=7)
                     → presentación; música de trono; Unown decorativos se mueven
EV_UNO_Inscripcion— 2121 — Leer el suelo con Rotom nivel >=4
                     → 2 textos: KINGGUS (arriba) y AYO@HERE (abajo); v274 += 1
EV_UNO_Porteros   — 2122 — Responder "K" a uno de los dos porteros
                     → abre 2123; si se responde al que miente, se retrocede 1 mapa (sin daño)
EV_UNO_LetraK     — 2123 — 6 estanterías; colocar los 6 libros por altura
                     → LETRA K
EV_UNO_LetraI     — 2124 — 5 Unown flotantes; alinearlos con 5 palancas
                     → LETRA I
EV_UNO_LetraN     — 2125 — Mirar el ojo 7 veces (una por fase)
                     → LETRA N; el ojo "parpadea" y el mapa oscurece 2 s
EV_UNO_Puertas    — 2126 — Puertas que piden letra (K/I/N/G/G/U/S)
                     → cada letra obtenida abre su puerta
EV_UNO_LetraG1    — 2127 — Abrir el sarcófago central con la letra N
                     → LETRA G (1)
EV_UNO_LetraG2    — 2128 — Puzzle de suelo: pisar los Unown en orden alfabético
                     → LETRA G (2)
EV_UNO_LetraU     — 2129 — Derrotar al Minero (opcional) o resolver la cueva
                     → LETRA U
EV_UNO_LetraS     — 2130 — Entregar PEARL al Pescador (o encontrar la perla en 2129)
                     → LETRA S
EV_UNO_Estatuas   — 2131 — 4 estatuas en orden (N-O-W / N-O-W invertido)
                     → abre 2132 y 2133
EV_UNO_Oculto     — 2132 — 1 objeto oculto (ver §6)
EV_UNO_Trono      — 2133 — Sentarse en el trono
                     → visión de lore (20 s); se abre 2134
EV_UNO_Leavenow   — 2134 — Leer el suelo: LEAVENOW (3 veces)
                     → 1.ª: advertencia; 2.ª: el Guardián ofrece salida; 3.ª: se abre 2135 (entrada final)
EV_UNO_Jefe       — 2135 — Autorun
                     → batalla final multi-fase (ver §7)
EV_UNO_Sello      — 2135 — Tras ganar
                     → sw888 = ON, +18 resonancia, recompensa única, fin del Nightmare
EV_UNO_Salida     — 2135 — Salida libre a 2030 / 2021 (y al Nexo, ver doc 07)
```

---

## 5. Anomalías (14)

```
[A01] LOS UNOWN QUE ESCUCHAN — visual
  Map2120 — (12,8) [R4-1]. Fase >=1. Los Unown de las paredes giran hacia el jugador al pasar.

[A02] EL TEXTO QUE TE NOMBRA — temporal
  Map2121 — (15,12). Fase >=2. El suelo dice "AYO@HERE" y, si el Rotom nivel >=4, "\PN@HERE".

[A03] LA ALFOMBRA QUE SE HUNDE — espacial
  Map2122 — (20,12). Fase >=3. Al pisarla 2 veces, se hunde 1 tile y vuelve (sin caída).

[A04] EL LIBRO QUE SE ESCRIBE SOLO — visual
  Map2123 — (10,8). Fase >=3. Un libro de la estantería cambia de título cada vez que se mira.

[A05] EL CORO DE UNOWN — auditiva
  Map2124 — (15,12). Fase >=2. Los Unown no suenan; lo que suena es su "sombra" sonora (eco).

[A06] EL OJO QUE PARPADEA — visual
  Map2125 — (15,8). Fase >=4. El ojo gigante parpadea cuando el jugador abre el menú.

[A07] LA ESCALERA QUE LEE — auditiva
  Map2126 — (12,15). Fase >=4. Cada 3 pasos, una voz dice una letra distinta (a veces la equivocada).

[A08] EL SARCÓFAGO VACÍO CON FORMA — visual
  Map2127 — (20,12). Fase >=5. El 4.º sarcófago está abierto y tiene forma de cuerpo (sin cuerpo).

[A09] LOS SÍMBOLOS QUE SE MUEVEN — visual
  Map2128 — (15,15). Fase >=4. Los símbolos del suelo se reorganizan cuando nadie mira.

[A10] EL CRISTAL QUE MUESTRA OTRA SALA — visual
  Map2129 — (22,10). Fase >=6. El cristal grande refleja la Sala del Trono (2133), no esta cueva.

[A11] EL AGUA QUE DELETREA — visual
  Map2130 — (16,12). Fase >=6. Las ondas forman una letra distinta cada vez.

[A12] LA ESTATUA QUE HABLA — auditiva
  Map2131 — (10,8). Fase >=5. La 4.ª estatua dice una frase con la voz del jugador (texto, sin audio real).

[A13] EL TRONO QUE SE GIRA — visual
  Map2133 — (15,10). Fase >=7. Al reentrar, el trono está girado hacia la puerta.

[A14] EL RENGLÓN QUE SE BORRA — temporal
  Map2134 — (15,12). Fase >=6. Al reentrar, "LEAVENOW" tiene una letra menos; a la 6.ª visita solo queda "L".
```

---

## 6. Objetos

| Tipo | Objeto | Dónde | Nota |
|---|---|---|---|
| Normales | `HYPER POTION`, `FULL RESTORE`, `MAX REVIVE` | 2122, 2126, 2131 | Antesala del final |
| Normales | `PEARL` / `BIG PEARL` | 2129 (16,20) | Se canjea por la letra **S** |
| Creepypasta | `DN_UNOWN_FRAGMENT` ×7 | 2123–2130 (uno por letra) | **Fragmentos de Unown**: se archivan; los 7 forman la llave de la Cámara |
| Creepypasta | `DN_PAGE_06` — Última página del Archivero | 2133, tras el trono | — |
| Creepypasta | `DN_CARTRIDGE_06` — Cartucho teal | 2135, tras el jefe | 6.º fragmento; cierra la línea de los cartuchos |
| Oculto | `TWISTED SPOON` | 2132 (24,18) | Requiere Rotom nivel ≥3 |
| Oculto | `LIFE ORB` (si no se obtuvo del v1) | 2135 (16,28) | Recompensa única alternativa |
| **Recompensa única del jefe** | `DN_ANCLA` — **Núcleo del Rotom** | 2135, tras KINGGUS | Mejora narrativa: el Rotom alcanza nivel 5 (Ancla) con `v275` |

---

## 7. Pokémon y entidades

| Pokémon | Dónde | Cambio |
|---|---|---|
| `UNOWN` (A–Z, ?, !) | Todo el episodio | Nivel 88–96; forman palabras con su posición en el mapa |
| `NATU` / `XATU` | 2120–2127 | Nivel 84–92 |
| `BALTOY` / `CLAYDOL` | 2128–2131 | Nivel 86–92 |
| `BRONZOR` / `BRONZONG` | 2122–2133 | Nivel 86–94 |
| `GOTHITA` / `GOTHORITA` / `GOTHITELLE` | 2124–2130 | Nivel 84–92 |
| `SIGILYPH` | 2131–2133 | Nivel 90, 4 % |
| `ELGYEM` / `BEEHEEYEM` | 2129 | Nivel 90, 3 % |
| `UNOWN` **#A016** ("el que deletrea") | 2135 | Nivel 98, solo tras el jefe (en la cámara, 1 vez) |

| Entidad | Ficha | Capturable | Cuándo |
|---|---|---|---|
| **KINGGUS** (#A017) | ANOMALÍA-REY · ??? | **NO** (es el sello final) | Jefe, 2135 |
| **EL OJO** (#A018) | ANOMALÍA-VIGILANTE · ??? | **NO** | 2125, mirando 7 veces |
| **EL CORO** (#A019) | ANOMALÍA-LETRAS · ??? | **NO** | 2124, fase ≥5 |
| **EL UNOWN QUE DELETREA** (#A016) | — | **CONDICIONAL** (vencer a KINGGUS sin usar `REVIVE`) | 2135, tras el sello |

---

## 8. Música

| Momento | Pista existente | Modificación |
|---|---|---|
| Trono (fases 1–2) | `PkmRS-MtPyre` | pitch −4 %, volumen 70 % |
| Fases 3–5 | `PkmRS-MtPyre` + coro | 60 %; Unown hacen eco en cada letra |
| Fases 6–7 | `A Trap With No Return` | 80 %, con cortes rítmicos (una letra por corte) |
| Visión del trono | `secretred` | piano solo (si existe; si no, `secretred` a 30 %) |
| Anomalía detectada | (silencio) | ping del Rotom |
| **Jefe KINGGUS** | `secretred` | invertida + coro + latido a 90 BPM |

---

## 9. Jefe final del juego: **KINGGUS** (y su forma final)

**Ficha**: `ANOMALÍA-REY` · tipo ??? · **no capturable** · sprite **R3** (a generar; ver doc 08).
**Mecánica especial**: **7 fases, una por letra**. No se trata de bajar PS: se trata de **leer**.
Cada fase exige un gesto distinto y solo una de las tres opciones que da el Rey es correcta
(la correcta depende de las letras ya colocadas en el suelo).

| Fase | Letra | Qué pide el Rey | Cómo se resuelve |
|---:|---|---|---|
| 1 | **K** | Que el jugador diga la primera letra del trono | Interactuar con el pedestal 1 (rotación de 3 opciones: K/N/S) |
| 2 | **I** | Que el jugador se **quede quieto** 5 s (el Rey odia el movimiento) | No moverse; si se mueve, reinicia la fase (sin daño) |
| 3 | **N** | Que el jugador mire al Ojo **sin abrir el menú** | Mantener 3 s de pie frente al ojo |
| 4 | **G** | Que el jugador "entregue" una letra (la 1.ª G) | Interactuar con el sarcófago correcto (3 opciones) |
| 5 | **G** | Que el jugador **repita** una letra (la 2.ª G) | Volver a pulsar el mismo pedestal de la fase 4 |
| 6 | **U** | Que el jugador rompa 4 cristales (U) | 4 interacciones en celdas marcadas, con Unown de por medio |
| 7 | **S** | Que el jugador **salga** de la sala (S de *salida*) | Caminar a la puerta: el Rey se levanta y **pelea** |

Entre la fase 6 y la 7 hay **una batalla normal** (canLose) con su equipo de Unown y psíquicos:
`UNOWN 100, Unown 100, Unown 100, Bronzong 106, Sigilyph 104, Xatu 105`.
La batalla **no reduce** al Rey: solo lo obliga a levantarse de la primera forma.
Tras la fase 7, **la forma final** (el sprite R3 con más ojos y garras, el "dios máquina") aparece:
**KINGGUS, EL REY SIN LETRA** — batalla final de verdad, con equipo de 6 y niveles 120–125.
[Nota para desarrollador: si el arte R3 no está listo, la batalla final puede usar `UNOWN` con
escala (`@scale`/`@form`) y tinte teal; el R3 es mejora de arte.]

```ruby
# EV_UNO_Jefe — esqueleto multi-fase
letras = ["K","I","N","G","G","U","S"]
letras.each_with_index do |l, i|
  activar_fase(l)                       # minijuego/gesto
  pbMessage("El suelo brilla: #{l}") if fase_superada?
end
pbTrainerBattle(PBTrainer.new("KINGGUS1", "KINGGUS"), false, "", true)   # forma 1
pbMessage("El Rey se levanta. Ahora ya no hay suelo que deletree.")
pbTrainerBattle(PBTrainer.new("KINGGUS2", "EL REY SIN LETRA"), false, "", true)  # forma final
```
- **Al perder** en cualquier fase: reintento desde 2134 con el grupo curado. **Nunca** se pierden
  letras ya conseguidas ni el progreso del episodio.
- **Al ganar**: `sw888 DN_EP06_SEALED = ON`, `v265 += 18`, recompensa `DN_ANCLA`,
  y si `v265 = 100`, el Rotom **despierta** (nivel 5, Ancla) con una escena propia.
- **Revancha**: desde la Sala del Trono (2133), «El Rey vuelve a leer / Luego» (solo por menú).

---

## 10. Conexión con el siguiente universo (y con el final)

- Al sellar, el trono **se queda sin letras**: los 7 fragmentos de Unown caen al suelo y forman una frase:
  `«ESCRIBE EL FINAL TÚ.»`
- El Rotom marca `RESONANCIA 100/100 — EL TESTIGO HA DEJADO DE SER VISITANTE`.
- La puerta de 2135 conduce al **Nexo de Ruptura** (`Map2136`), donde el Nightmare se cierra o se
  deja abierto (ver `07_MAPA_DE_FLUJO.md`).
- El Archivero, por primera vez, **no está** en la Gruta de los Testigos: dejó su página final sobre
  la mesa de la falda (2021) con dos palabras: «Gracias. Sal.»
