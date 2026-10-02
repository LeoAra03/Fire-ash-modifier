# EPISODIO 04 — HYPNOS'S LULLABY
## «El bosque que canta para que no despiertes» · Recurso base: **R2 — Creepy Dark Forest** (16 mapas)

**Universo**: Hypno's Lullaby (inspiración; reinterpretado con voz propia).
**Filosofía de diseño**: **Persecución suave / laberinto que respira**. El bosque no bloquea:
**duerme**. Los caminos se cierran cuando el jugador se detiene demasiado; la música es el enemigo.
**Mapas propuestos**: `Map2088`–`Map2103` (16) · **Resonancia al sellar**: **+14**.
**Prerrequisito**: EP03 sellado (`sw885`) **y** `sw703 POKEMOD CHILDREN RESCUED` (la misión Hypno
del contenido v1 ya resuelta: los niños están a salvo fuera del bosque).
**Acceso**: Grieta del Sueño desde 2087, o la puerta silenciosa de la Gruta de los Testigos (2030, 26,18).

> **Continuidad con el v1.** El v1 ya usa los switches 701–703 (misión Hypno). El Nightmare **no los
> duplica ni los reescribe**: los usa como *prerrequisito narrativo*. La historia aquí ya no va de
> rescatar niños, sino de **lo que el bosque cantó después** — un eco que nadie apagó.

---

## 1. Mapa del episodio

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2088 | Bosque Dormido — Entrada | R2-1 | Outer Bosque | 30×24 | Entrada; primer canto |
| 2089 | Senda del Cartel Torcido | R2-2 | Outer Bosque | 30×24 | Carteles que cambian de texto |
| 2090 | Puente de Piedra | R2-3 | Outer Bosque | 32×24 | Cruce; el agua canta |
| 2091 | Cabaña de las Ventanas | R2-4 | Outer Bosque | 24×24 | Curación; NPCs dormidos |
| 2092 | Arco de Niebla Púrpura | R2-5 | Outer Bosque | 30×30 | Portal (puzzle de niebla) |
| 2093 | Cementerio del Bosque | R2-6 | Outer Bosque | 40×30 | Tumbas de juguetes |
| 2094 | Campo de Flores Moradas | R2-7 | Outer Bosque | 40×30 | Combates; efectos de sueño |
| 2095 | Campamento de Tiendas | R2-8 | Outer Bosque | 30×24 | Refugio; punto seguro de reaparición |
| 2096 | Boca de la Cueva Negra | R2-9 | Outer Cueva | 30×24 | Entrada a cueva; oscuridad |
| 2097 | Árboles Retorcidos | R2-10 | Outer Bosque | 32×32 | Anomalías de susurro |
| 2098 | Estanque de Nenúfares | R2-11 | Outer Agua | 32×32 | Espejo; "el que duerme abajo" |
| 2099 | Muro de Ruinas | R2-12 | Outer Ruinas | 30×24 | Muro con inscripción musical |
| 2100 | Granero Abandonado | R2-13 | Int Granero | 32×24 | Cama donde dormir (opcional) |
| 2101 | Bosque de Luciérnagas | R2-14 | Outer Bosque | 40×30 | Zona preciosa y peligrosa |
| 2102 | Muro del Pasaje | R2-15 | Outer Ruinas | 30×24 | Puzzle de 8 notas |
| 2103 | Árbol Anciano | R2-16 + R1 | Outer Bosque | 40×40 | **Jefe final**: 3 puertas en la base |

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Se activa en | Cambios | Mapa base |
|---:|---|---|---|---|
| 1 | Bosque normal | 2088–2089 | Verde oscuro, niebla baja, luciérnagas | R2-1, R2-2 |
| 2 | La canción empieza | 2090–2091 | Música con voz; los NPCs bostezan | R2-3, R2-4 |
| 3 | Niebla púrpura | 2092–2093 | `Fog` púrpura; pantalla con fatiga visual (parpadeo lento) | R2-5, R2-6 |
| 4 | Los que duermen | 2094–2095 | NPCs acostados en el suelo; el jugador camina más lento | R2-7, R2-8 |
| 5 | El canto elige | 2096–2098 | Aparecen "cunas" de musgo; NPCs desaparecen al reentrar; sueño de 1 turno al azar | R2-9, R2-10, R2-11 |
| 6 | El árbol despierta | 2099–2101 | Raíces en el camino; luciérnagas rojas; música se corta en frases | R2-12, R2-13, R2-14 + **R1** |
| 7 | **Ruptura** | 2102–2103 | El bosque es una partitura de código; los árboles se vuelven glifos; fondo negro con notas | **R2-15, R2-16 + R1-3, R1-12** |

### Mecánica del canto (nunca letal)
```ruby
# Cada 45 s en fase >=3, si el jugador no ha pasado junto a un "silenciador" (tronco hueco):
$game_party.members.each { |p| p.status = :SLEEP if rand(100) < 15 }
pbMessage("Una voz muy dulce te pide que te quedes. \\nEl Rotom marca: RESISTE.")
# Un Pokémon dormido se despierta al llegar a un refugio (2088, 2091, 2095) o con un objeto normal.
# Nunca se pierde un Pokémon, ni dinero, ni progreso por dormirse.
```
[Nota para desarrollador: los "silenciadores" son 6 troncos huecos repartidos en los mapas;
interactuar con uno silencia el canto 60 s. Es el minijuego de ritmo del episodio.]

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite | Rol y notas |
|---:|---|---|---|---|
| 2088 | Leñador Dormido | Normal | `trainer_HIKER` | 5 estados; bosteza entre frases |
| 2088 | Niña del Oso de Trapo | Consciente | `trchar010` | Sabe que "la canción llama a los que tienen nombre" |
| 2089 | Cartelero Mudo | Normal | `trchar015` | Cambia los carteles; nunca habla |
| 2090 | Puentero | Normal | `trchar028` | Cobra peaje en sueños (nunca lo cobra) |
| 2091 | Abuela de la Cabaña | Consciente | `trchar070` | Cura; cuenta las 4 estrofas del canto |
| 2092 | Guardián del Arco | Interdimensional | `trainer_PSYCHIC_M` | Fija: «Ya oíste esta canción. Ayer. Y anteayer.» |
| 2093 | Sepulturera de Juguetes | Normal | `trchar042` | Entierra juguetes; da la pista del silenciador |
| 2095 | Los Cuatro Dormidos | Normal ×4 | `trchar000` | Duermen; en fase 5 son 5, y el 5.º es el jugador |
| 2096 | Voz de la Cueva | Consciente | (sin sprite) | Solo texto, sin gráfico: la cueva responde |
| 2098 | El que Duerme Abajo | Interdimensional | (imagen en el agua) | Aparece en el reflejo; no se puede hablar con él |
| 2100 | Granjero Ausente | Normal | `trainer_HIKER` | Su granero tiene una cama; dormir = ver una visión |
| 2101 | Niños de Luciérnagas | Consciente ×2 | `trchar010` | Cantan la melodía; una nota está "rota" |
| 2103 | **LA NANA** | Interdimensional | `trainer_PSYCHIC_F` | Jefe; canta durante todo el combate |

**Ejemplo de 5 estados** (Leñador Dormido, 2088):
```text
1: "Zzz... ¿eh? Perdona. Últimamente el bosque me da mucho sueño."
2: "He talado el mismo árbol tres veces. Siempre vuelve a estar en pie."
3: "No te pares mucho. Si te paras, la canción te encuentra."
4: "Esta noche he soñado con una cuna. No tengo hijos."
5: (silencio) Está de pie, con los ojos abiertos y la boca cerrada.
```

---

## 4. Eventos programables

```
EV_HYP_Entrada      — 2088 — Autorun (sw885 ON y sw703 ON)
                       → tono fase 1, música "Hypno's Lullaby (base)" al 50 %, texto de la grieta
EV_HYP_Carteles     — 2089 — 4 carteles (5,5) (10,10) (18,6) (22,18)
                       → cada fase muestra un texto distinto; el 4.º cartel lleva el nombre del jugador
EV_HYP_Puente       — 2090 (16,12) — Pisar el centro
                       → el reflejo del agua muestra a Ash durmiendo (anomalía A04)
EV_HYP_Abuela       — 2091 — Hablar 4 veces
                       → enseña las 4 estrofas (pistas del puzzle de 2102); cura
EV_HYP_Niebla       — 2092 (15,15) — 3 antorchas de niebla (8,8) (15,6) (22,20)
                       → apagarlas en orden inverso a su encendido original: abre 2093
EV_HYP_Tumbas       — 2093 — 6 tumbas de juguetes
                       → la 6.ª tumba vacía: primer "silenciador" del mapa
EV_HYP_Sueno        — 2094/2096/2098 — Evento de mapa (paralelo)
                       → cada 45 s, si NO hay silenciador activo: tirada de sueño (15 %)
EV_HYP_Campamento   — 2095 — Dormir en la tienda (opcional)
                       → visión de 12 s con texto de la historia; grupo curado
EV_HYP_Cueva        — 2096 (12,8) — Entrar sin silenciador activo
                       → la cueva "canta" y duerme a 2 Pokémon (se despiertan al salir)
EV_HYP_Estanque     — 2098 (16,16) — Mirar el agua 3 veces
                       → aparece "El que duerme abajo" (anomalía A08); no hay combate
EV_HYP_Musica       — 2099 — Leer el muro de ruinas con Rotom nivel >=4
                       → partitura de 8 notas; sin Sintonía solo son garabatos
EV_HYP_Granero      — 2100 — Dormir en la cama 3 veces
                       → 3 visiones (1: el bosque antes; 2: los niños cantando; 3: una cuna vacía)
EV_HYP_Silenciador  — 6 troncos huecos — Interactuar
                       → silencia el canto 60 s; v267 += 1 por cada uno distinto (máx 6)
EV_HYP_Notas        — 2102 (10,12) — Tocar 8 troncos en el orden de la partitura
                       → abre 2103; el orden correcto es el de las 4 estrofas + eco
EV_HYP_Jefe         — 2103 — Autorun
                       → batalla + fase de "cuna" (ver §7)
EV_HYP_Sello        — 2103 — Tras ganar
                       → sw886 = ON, +14 resonancia, recompensa (ver §6)
EV_HYP_Salida       — 2103 — Salida libre a 2030 / 2021
```

---

## 5. Anomalías (13)

```
[A01] EL BOSQUE QUE RESPIRA — auditiva
  Map2088 — (14,12) [R2-1]. Fase >=2. En los silencios de la música se oye una respiración lenta.

[A02] EL CARTEL QUE TE NOMBRA — temporal
  Map2089 — (22,18). Fase >=4. El cartel dice "\PN" y cambia de dirección cuando el jugador pasa.

[A03] EL PUENTE QUE CANTA — auditiva
  Map2090 — (16,12). Fase >=3. Al pisarlo, el agua entona la primera nota de la canción.

[A04] EL REFLEJO DORMIDO — visual
  Map2090 — (16,14). Fase >=4. El reflejo del jugador está acostado y no se mueve.

[A05] LAS VENTANAS QUE MIRAN — visual
  Map2091 — (6,6). Fase >=5. Las ventanas de la cabaña tienen una figura; al acercarse, ya no.

[A06] LA TUMBA SIN JUGUETE — visual
  Map2093 — (28,22). Fase >=5. La 6.ª tumba está vacía y recién cavada; siempre hay tierra fresca.

[A07] LAS FLORES QUE SE CIERRAN — visual
  Map2094 — (20,15). Fase >=4. Las flores moradas se cierran cuando el jugador se acerca.

[A08] EL QUE DUERME ABAJO — visual
  Map2098 — (16,16). Fase >=5. Mirando el estanque 3 veces aparece una silueta enorme bajo el agua.

[A09] LOS CINCO DORMIDOS — temporal
  Map2095 — (15,12). Fase >=5. Hay 5 dormidos: el 5.º lleva la ropa del jugador.

[A10] LA NOTA QUE FALTA — auditiva
  Map2101 — (24,20). Fase >=6. La melodía de los niños tiene una nota que no suena; el silencio dura 1 s de más.

[A11] LAS LUCES ROJAS — visual
  Map2101 — (10,8). Fase >=6. Una luciérnaga roja sigue al jugador y se apaga si se la mira de frente.

[A12] EL GRANERO QUE SE AGRANDA — espacial
  Map2100 — (16,12). Fase >=6. Al reentrar, el granero tiene una puerta más (4 puertas en total).

[A13] LA CAMA QUE RECUERDA — temporal
  Map2100 — (16,10). Fase >=5. Cada vez que se duerme en ella, el sueño dura 2 s más y muestra una imagen distinta.
```

---

## 6. Objetos

| Tipo | Objeto | Dónde | Nota |
|---|---|---|---|
| Normales | `AWAKENING` ×3, `FULL HEAL`, `HYPER POTION` | 2091, 2095, 2100 | Temáticos (despertar) |
| Normales | `CHESTO BERRY` ×5 | 2094, 2101 | Contra el sueño |
| Creepypasta | `DN_TAPE_01` — Cinta de canción de cuna | 2100, tras las 3 visiones | Se archiva |
| Creepypasta | `DN_PAGE_04` — Página del Archivero | 2102, tras el puzzle de notas | — |
| Creepypasta | `DN_CARTRIDGE_04` — Cartucho con una canción dentro | 2103, tras el jefe | 4.º fragmento |
| Oculto | `POKE FLUTE` | 2103 (20,30), solo tras el jefe | Recompensa única: el objeto que "despierta" |
| Oculto | `PP UP` | 2096 (4,20), en la cueva negra | Requiere Rotom nivel ≥3 |
| Oculto | `SACRED ASH` (si no se obtuvo en EP01) | 2098 (28,28) | Alternativa de diseño sin duplicar |

---

## 7. Pokémon y entidades

| Pokémon | Dónde | Cambio |
|---|---|---|
| `DROWZEE` / `HYPNO` | Todo el bosque | Nivel 82–92; usan `Hypnosis` con prioridad |
| `MUNNA` / `MUSHARNA` | 2094–2098 | Nivel 82–90; emiten "humo de sueño" (efecto visual) |
| `ODDISH` / `GLOOM` | 2088–2093 | Nivel 78–86 |
| `SHROOMISH` / `BRELOOM` | 2097–2101 | Nivel 82–88 |
| `ZUBAT` / `GOLBAT` | 2096 | Nivel 78–86 |
| `SPINARAK` / `ARIADOS` | 2099–2101 | Nivel 80–88 |
| `DROWZEE` (variante) | 2095, fase ≥5 | Nivel 95, 2 %; lleva `CHESTO BERRY` |

| Entidad | Ficha | Capturable | Cuándo |
|---|---|---|---|
| **LA NANA** (#A010) | ANOMALÍA-CANTO · ??? | **NO** (sellarla es el objetivo) | Jefe, 2103 |
| **EL QUE DUERME ABAJO** (#A011) | ANOMALÍA-AGUA · ??? | **NO** | 2098, fase ≥5, mirando 3 veces |
| **LA NIÑA DEL OSO** (#A012) | ANOMALÍA-ECO · ??? | **CONDICIONAL** (hablarle en fase 7 sin silenciador activo) | 2088/2103 |

---

## 8. Música

| Momento | Pista existente | Modificación |
|---|---|---|
| Bosque (fases 1–2) | `Lavender Town` (base de cuna) | volumen 45 %, muy lejos |
| Fases 3–5 | tema de cuna | + coro (`SE: Choir`), volumen 60 % |
| Fase 6–7 | tema de cuna | invertida y a 30 %; silencios de 1 s |
| Silenciador activo | (silencio total) | solo pasos y viento |
| Anomalía detectada | (silencio) | ping del Rotom |
| Jefe | `secretred` + cuna | cruzados; la cuna "canta" cada 3 turnos |

---

## 9. Jefe final del episodio: **LA NANA**

**Ficha**: `ANOMALÍA-CANTO` · tipo ??? · no capturable · **sprite** `trainer_PSYCHIC_F`.
**Mecánica especial**: la canción **es** el jefe. La entrenadora no ataca: **duerme**, y mientras el
equipo del jugador esté dormido, ella no recibe daño. El combate se gana **despertando al equipo y
rompiendo 4 cunas de musgo** del escenario (celdas marcadas en el árbol).

| Fase | Mecánica |
|---:|---|
| A — **La canción** | Batalla de "jefa" (canLose): Musharna 104, Hypno 105, Drowzee 101, Gengar 104, Mismagius 103, Darkrai 106 (si existe en el juego; si no, `Spiritomb 106`). Al inicio, todo el equipo del jugador entra dormido. |
| B — **Las 4 cunas** | 4 cunas de musgo en la base del árbol (celdas (10,12) (20,12) (10,26) (20,26)). Cada una debe **despertarse** (usar `POKE FLUTE`, `AWAKENING` o el comando de interacción) mientras el equipo aguanta. Cada cuna rota = −1/4 de la presencia de la canción. |
| C — **La última estrofa** | La Nana canta su 4.ª estrofa y se apaga la música del mapa durante 10 s. El jefe queda sellado; no hay captura. |

```ruby
# EV_HYP_Jefe
pbTrainerBattle(PBTrainer.new("NANA", "LA NANA"), false, "", true)
pbMessage("La canción baja de tono. Todavía queda algo cantando en el árbol.")
4.times { |i| pbMessage("La cuna #{i + 1} se abre. Dentro no hay nadie. Nunca hubo nadie.") }
$game_screen.start_flash(Color.new(255, 255, 255, 120), 20)
```
- **Al ganar**: `sw886 DN_EP04_SEALED = ON`, `v265 += 14`, `DN_PAGE_04` archivada, `POKE FLUTE`.
- **Revancha**: desde el campamento (2095), «La canción vuelve / Luego».

---

## 10. Conexión con el siguiente universo

- Al sellar, el árbol anciano **cierra sus tres puertas**… y al fondo de la tercera hay una calle
  que no es del bosque: es un pueblo **sin un solo color** (entrada a EP05, `Map2104`).
- El Rotom: `RESONANCIA 48/100 — LA VOZ YA NO CANTA, PERO RECUERDA`.
- El Archivero: «Un sueño se apaga; otro se queda en blanco. El siguiente mundo no se durmió: **se vació**.»
- **Salida libre** al Monte Silver desde 2103.
