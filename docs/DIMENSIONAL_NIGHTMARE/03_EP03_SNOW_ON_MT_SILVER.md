# EPISODIO 03 — SNOW ON MT. SILVER
## «La cara del monte que nadie mira» · Recurso base: **R6 — Creepy Snowy Mountain** (15 mapas)

**Universo**: Snow on Mt. Silver (inspiración; reinterpretado con voz propia).
**Filosofía de diseño**: **Supervivencia y visibilidad reducida**. Aquí no hay laberinto de trampas:
hay *frío*, *niebla* y *tiempo*. El jugador ve menos, camina más lento y debe elegir cuándo parar.
**Mapas propuestos**: `Map2073`–`Map2087` (15) · **Resonancia al sellar**: **+12**.
**Prerrequisito**: EP02 sellado (`sw884`). **Acceso**: desde el Monte Silver **Falda** (`Map2021`, celda 6,38)
→ nueva vereda a la **Cara Norte**; también desde la Grieta Blanca de la cumbre.

> **Continuidad con el v1 y el rebuild.** La falda (2021), la Gruta (2030) y la cumbre (2022) ya
> existen y **no se tocan**. EP03 usa la **Cara Norte**: el lado del monte que la tormenta tapa.
> El jefe del v1, **RED**, sigue siendo el campeón silencioso de la cumbre; aquí el testigo es otro.

---

## 1. Mapa del episodio

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2073 | Cara Norte — Vereda Helada | R6-1 | Nieve exterior | 32×24 | Entrada; primera ventisca |
| 2074 | Acantilado de Zetas | R6-2 | Nieve exterior | 30×30 | Escalada; caídas sin daño |
| 2075 | Sendero de la Cornisa | R6-3 | Nieve exterior | 40×30 | Ruta larga; cueva escondida |
| 2076 | Cabaña del Montañés | R6-4 | Nieve exterior | 24×24 | Curación; NPC ancla |
| 2077 | Lago Congelado | R6-5 | Nieve exterior | 32×32 | Altar central bajo el hielo |
| 2078 | Pueblo de la Niebla | R6-6 | Nieve exterior | 40×30 | NPCs normales; tienda |
| 2079 | Pueblo Alto | R6-7 | Nieve exterior | 40×40 | NPCs conscientes; campana |
| 2080 | Cueva de Bloques de Hielo | R6-8 | Int Cueva Hielo | 30×24 | Puzzle de hielo resbaladizo |
| 2081 | Entrada de Cueva | R6-9 | Nieve exterior | 30×24 | Bifurcación (arriba/abajo) |
| 2082 | Caverna de Estalactitas | R6-10 | Int Cueva Hielo | 30×30 | Combates; estalactitas que caen |
| 2083 | Cámara de los Dos Lagos | R6-11 | Int Cueva Hielo | 30×24 | Runas; traducción |
| 2084 | Grieta Estrecha | R6-12 | Int Cueva Hielo | 16×40 | Pasillo de 1 celda; se cierra detrás |
| 2085 | Cámara de Cristales | R6-13 | Int Cueva Hielo | 30×30 | Miniboss opcional: "la Bestia de Hielo" |
| 2086 | Templo de las Estatuas | R6-14 | Int Templo | 32×32 | Estatuas que cambian de pose |
| 2087 | Corazón del Monte | R6-15 + R1 | Int Cueva Hielo | 30×30 | **Jefe final**; ventisca interior |

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Se activa en | Cambios | Mapa base |
|---:|---|---|---|---|
| 1 | Nieve limpia | 2073–2074 | Visibilidad normal; viento moderado | R6-1, R6-2 |
| 2 | Ventisca baja | 2075–2076 | `Weather: Snow`, velocidad −1 | R6-3, R6-4 |
| 3 | Frío que muerde | 2077–2078 | Tinte azul; cada 60 s sin fogata, el brillo baja 1 paso (se recupera al entrar en calor) | R6-5, R6-6 |
| 4 | Niebla blanca | 2079–2080 | `Fog` blanco a 60 %; los NPCs solo se ven a 4 tiles | R6-7, R6-8 |
| 5 | Huellas que no son tuyas | 2081–2083 | Aparecen huellas que llevan a donde el jugador *va a ir*; NPCs desaparecen al reentrar | R6-9, R6-10, R6-11 |
| 6 | Ventisca negra | 2084–2086 | `Weather: Storm` + tinte frío extremo; caminos borrados | R6-12, R6-13, R6-14 + **R1** |
| 7 | **Ruptura** | 2087 | El hielo se vuelve código; copos hexadecimales; la cámara del jefe es un vacío con un altar | **R6-15 + R1-11, R1-7** |

### Mecánica de frío (sin castigo irreversible)
```ruby
# Cada 60 s fuera de refugio, en fase >=3:
$game_variables[2] -= 1                    # variable de sistema libre (temporizador visual)
$game_screen.tone = Tone.new(-120, -110, -90, $game_variables[276])
# Si el jugador queda "helado": NO pierde nada. Queda inmovilizado 3 s, la pantalla se
# vuelve blanca y reaparece en la última fogata con el grupo curado.
pbSet(276, 0)
```
[Nota para desarrollador: el frío **nunca** causa daño a los Pokémon ni pérdida de objetos;
es una mecánica de ritmo. Alternativa aún más suave: solo oscurecer la pantalla.]

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite | Rol y notas |
|---:|---|---|---|---|
| 2073 | Excursionista Perdido | Normal | `trainer_HIKER` | 5 estados; cree que está a 10 min del pueblo |
| 2074 | Escaladora Sola | Consciente | `trchar010` | Sabe que el acantilado "crece" cada noche |
| 2075 | Guarda de la Cornisa | Normal | `trainer_HIKER` | Pide 3 fogatas encendidas para dejar pasar |
| 2076 | Montañés de la Cabaña | Consciente | `trchar015` | Cura; cada visita tiene una línea nueva |
| 2077 | Pescador de Hielo | Normal | `SWIMMER_M` | Habla del "altar bajo el hielo" |
| 2078 | Tendera de Nieve | Normal | `trchar060` | Tienda real (ítems estándar). Sustituto visual de `trchar052`, ausente en el juego base. |
| 2079 | Alcaldesa de Pueblo Alto | Consciente | `trchar070` | Sabe que el pueblo aparece y desaparece del mapa |
| 2080 | Niño del Trineo | Normal | `trchar010` | Marca el camino del hielo resbaladizo |
| 2082 | Minero Ciego | Normal | `trainer_HIKER` | Da pistas de las estalactitas |
| 2083 | Sacerdote de las Runas | Consciente | `trainer_PSYCHIC_M` | Traduce runas con Rotom nivel ≥4 |
| 2085 | Cazadora de Cristales | Normal | `trainer_PSYCHIC_F` | Miniboss opcional |
| 2086 | Los Tres Testigos | Interdimensional ×3 | `trchar028` | Repiten la misma frase en 3 idiomas; cambian en fase 7 |
| 2087 | **EL CAMINANTE** | Interdimensional | `trchar137` | Jefe; camina hacia el jugador durante todo el episodio (aparece en el fondo de 2073, 2079, 2086) |

**Ejemplo de 5 estados** (Montañés de la Cabaña, 2076):
```text
1: "Pasa, pasa. El té está caliente y la tormenta no perdona."
2: "Hoy la nieve pesa más. Mañana pesará menos. Aquí todo se compensa."
3: "¿Viste las huellas del borde? No son mías. Y no llevan a ningún sitio."
4: "El caminante pasó anoche. No se sentó. Nunca se sienta."
5: (silencio) La cabaña tiene dos tazas servidas y un solo banco.
```

---

## 4. Eventos programables

```
EV_SNOW_Fogata      — 2073, 2075, 2078, 2082 — Encender 4 fogatas (una por zona)
                       → cada fogata fija punto de reaparición; la 4.ª quita la ventisca breve
EV_SNOW_Ventisca    — 2075 (20,10) — Zona expuesta
                       → pierde visibilidad 6 s (evento de imagen), empuja 2 tiles hacia atrás (sin daño)
EV_SNOW_Cabana      — 2076 — Interactuar con el Montañés
                       → cura grupo + guarda posición + v276 = 0
EV_SNOW_Altar       — 2077 (16,16) — Golpear el hielo con fuerza 3 veces
                       → el hielo se agrieta; se ve el altar; al 4.º golpe se abre agujero (mapa 2087)
EV_SNOW_Tienda      — 2078 — Tendera
                       → tienda estándar (sin inventario nuevo)
EV_SNOW_Campana     — 2079 (20,12) — Tocar la campana en fase >=3
                       → suena 1 vez; el pueblo entero deja de moverse 10 s
EV_SNOW_Hielo       — 2080 — Zona resbaladiza (terreno 12 ya usado en Lanakila Cave)
                       → puzzle de deslizamiento; sin combates mientras se resbala
EV_SNOW_Runas       — 2083 — 3 losas (8,6) (15,6) (22,6) en orden con Rotom nivel >=4
                       → abre 2084; si el orden es erróneo, se resetean al salir
EV_SNOW_Grieta      — 2084 (8,38) — Autorun al entrar
                       → la grieta se cierra detrás; solo avanza (como en EP01, pero de hielo)
EV_SNOW_Bestia      — 2085 — Miniboss opcional (`trainer_PSYCHIC_F`, canLose)
                       → recompensa FEATHER oculta; no bloquea el progreso
EV_SNOW_Estatuas    — 2086 — 5 estatuas (cada una mira a un lado distinto)
                       → colocarlas todas mirando al centro con 5 interacciones: abre 2087
EV_SNOW_Jefe        — 2087 — Autorun
                       → batalla + fase de "pasos en la nieve" (ver §7)
EV_SNOW_Sello       — 2087 — Tras ganar
                       → sw885 = ON, +12 resonancia, recompensa (ver §6)
EV_SNOW_Salida      — 2087 — Salida libre a 2021 (falda) / 2030 (gruta)
```

---

## 5. Anomalías (12)

```
[A01] LA FOGATA QUE NO DERRITE LA NIEVE — visual
  Map2073 — (18,8) [R6-1]. Fase >=2. A su alrededor la nieve sigue intacta; el calor no deja marca.

[A02] LAS HUELLAS QUE LLEGAN — espacial
  Map2074 — (12,20). Fase >=3. Aparecen huellas que suben hacia donde está el jugador.

[A03] EL ACANTILADO MÁS ALTO — espacial
  Map2074 — (24,6). Fase >=5. Al reentrar, la cima está 4 tiles más arriba (la ruta cambia de largo).

[A04] LA CABEZA EN LA NIEVE — visual
  Map2075 — (5,22). Fase >=4. Una cabeza de estatua asoma; al volver a entrar está más afuera.

[A05] LAS DOS TAZAS — temporal
  Map2076 — (6,10). Fase >=3. La cabaña siempre tiene dos tazas servidas; nadie más está dentro.

[A06] BAJO EL HIELO, ALGO SE MUEVE — visual
  Map2077 — (16,12). Fase >=4. Una sombra grande cruza el lago bajo el hielo; nunca sale.

[A07] LA CAMPANA MUDA — auditiva
  Map2079 — (20,12). Fase >=3. La campana no suena para el jugador, pero los NPCs reaccionan como si sonara.

[A08] EL PUEBLO QUE NO ESTÁ EN EL MAPA — espacial
  Map2079 — (2,2). Fase >=5. Con el Rotom nivel >=3, el minimapa del pueblo no aparece; solo nieve.

[A09] EL BLOQUE DE HIELO QUE RESPIRA — visual
  Map2080 — (14,10). Fase >=4. Un bloque sube y baja 1 tile cada 4 s (se puede pisar igual).

[A10] LAS ESTALACTITAS QUE CUENTAN — auditiva
  Map2082 — (10,14). Fase >=5. Cada estalactita que cae deja un "tic" distinto; el 7.º tic no existe.

[A11] LA GRIETA QUE SE CIERRA — espacial
  Map2084 — (8,20). Fase >=6. Al reentrar, la grieta está cerrada por dentro; hay que salir al 2085 (nunca se atrapa).

[A12] LA ESTATUA QUE CAMBIA DE CARA — visual
  Map2086 — (10,8). Fase >=6. Las estatuas cambian de pose al mirarlas dos veces.
```

---

## 6. Objetos

| Tipo | Objeto | Dónde | Nota |
|---|---|---|---|
| Normales | `HYPER POTION`, `FULL HEAL`, `MAX REVIVE` | 2076, 2078, 2082 | Cabaña, tienda, cueva |
| Normales | `NEVERMELTICE` | 2084 (4,36) | Item clásico de hielo; cae al cerrarse la grieta |
| Creepypasta | `DN_PHOTO_02` — Foto de una cumbre con dos siluetas | 2077, bajo el hielo | Se archiva |
| Creepypasta | `DN_PAGE_03` — Página congelada del Archivero | 2083, tras las runas | — |
| Creepypasta | `DN_CARTRIDGE_03` — Cartucho con hielo dentro | 2086, tras las estatuas | 3.º fragmento |
| Oculto | `HEALTH FEATHER` ×3 | 2085, tras la Bestia | Recompensa única del miniboss |
| Oculto | `RARE CANDY` | 2087 (4,4), solo tras el jefe | Requiere Rotom nivel ≥3 |
| Oculto | `MAX ELIXIR` | 2075 (36,26), bajo la cornisa | — |

---

## 7. Pokémon y entidades

| Pokémon | Dónde | Cambio |
|---|---|---|
| `SNOVER` / `ABOMASNOW` | 2073–2075 | Nivel 80–88; aparecen con niebla densa |
| `SNORUNT` / `GLALIE` | 2077–2082 | Nivel 80–88; los `GLALIE` tienen un ojo extra (sprite `form` alterno si se desea) |
| `SNEASEL` / `WEAVILE` | 2079–2084 | Nivel 82–90 |
| `SWINUB` / `PILOSWINE` / `MAMOSWINE` | 2076–2081 | Nivel 78–90 |
| `VANILLITE` / `VANILLISH` / `VANILLUXE` | 2080–2085 | Nivel 80–90 |
| `FROSLASS` | 2085–2087 | Nivel 92, 3 % |
| `LAPRAS` | 2077 (raro, solo en fase 1) | Nivel 95, 1 % |

| Entidad | Ficha | Capturable | Cuándo |
|---|---|---|---|
| **EL CAMINANTE** (#A007) | ANOMALÍA-VIAJERO · ??? | **CONDICIONAL** (vencerlo sin que el grupo quede a 0 en el intento) | Jefe, 2087 |
| **LA BESTIA DE CRISTAL** (#A008) | ANOMALÍA-HIELO · ??? | **NO** | 2085, miniboss (aparece, se pelea, se desvanece) |
| **LOS TRES TESTIGOS** (#A009) | ANOMALÍA-CORO · ??? | **NO** | 2086, fase ≥5, si se les habla 3 veces |

---

## 8. Música

| Momento | Pista | Nota |
|---|---|---|
| Exploración EP03 (2073–2087) | `DN_SnowSilver.mid` | Composición original de tres pulsos, aireada y sin percusión. |
| Viento / variaciones por fase | Pendiente por evento | La pista base está asignada; los cambios de pitch, BGS y cortes requieren QA/implementación. |
| Combate del jefe | BGM de batalla del juego | Sin cambio al motor de combate. |

---

## 9. Jefe final del episodio: **EL CAMINANTE**

**Ficha**: `ANOMALÍA-VIAJERO` · tipo ??? · capturable condicional · **sprite** `trchar137` (existente).
**Mecánica especial**: el jefe **copia la fase del mapa** y ataca en el mismo turno en que el
jugador "da un paso" fuera de la nieve. El combate se gana **encendiendo las 4 fogatas** que el
Caminante fue dejando atrás en el episodio (2073, 2075, 2078, 2082) — es un jefe que **te obliga a
volver sobre tus pasos**, literalmente.

| Fase | Mecánica |
|---:|---|
| A — **La ventisca** | Batalla normal (canLose): equipo de hielo/normal: Abomasnow 104, Mamoswine 105, Glalie 102, Froslass 103, Weavile 103, Lapras 102. Si el jugador pierde, reaparece en la cabaña (2076) con el grupo curado. |
| B — **Las cuatro fogatas** | Tras ganar la batalla, el Caminante se levanta en el mapa 2087. El jugador debe **volver a visitar** las 4 fogatas (teletransporte corto guiado por el Rotom) y encenderlas con la yesca que da el Montañés. Cada fogata encendida = 1/4 de la "presencia" del Caminante. |
| C — **El último paso** | Con las 4 encendidas, el Caminante se detiene en 2087 y **por primera vez no avanza**. El jugador puede: (1) sellar (siempre) o (2) aceptar la captura condicional `#A007` si no ha usado objetos de curación en toda la fase B. |

```ruby
# EV_SNOW_Jefe
pbTrainerBattle(PBTrainer.new("CAMINANTE", "EL CAMINANTE"), false, "", true)
pbMessage("El caminante da un paso. El suelo tiembla. \\nNo se detendrá hasta llegar al final del monte.")
# Fase B: 4 eventos de fogata con switch DN_SNOW_FOGATA_i
# Fase C: se detiene; registro o sello
```
- **Al ganar**: `sw885 DN_EP03_SEALED = ON`, `v265 += 12`, `DN_PAGE_03` archivada.
- **Recompensa única**: `NEVERMELTICE` + `RARE CANDY` (variantes; ver catálogo).
- **Revancha**: desde la cabaña (2076), opción «Revancha / Luego».

---

## 10. Conexión con el siguiente universo

- Al sellar, las 4 fogatas se apagan a la vez y el viento **cambia de dirección hacia abajo**:
  bajo la nieve aparece una escalera de hielo que desciende hacia lo que no debería haber debajo.
- El Rotom: `RESONANCIA 34/100 — EL FRÍO TIENE MEMORIA LARGA`.
- La escalera conduce a la **Grieta del Sueño** (`Map2088`, EP04): un túnel que huele a flores
  púrpuras y a canción de cuna (transición directa 2087 → 2088).
- El Archivero: «El monte guarda lo que se perdió. Lo que se perdió **abajo** guarda otra cosa.»
- **Salida libre** al Monte Silver desde 2087.
