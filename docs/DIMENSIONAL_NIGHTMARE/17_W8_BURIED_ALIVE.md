# MUNDO W8 — BURIED ALIVE
## «La fosa ya estaba cavada» · Recurso base: **R9 — Buried Alive** (16 mapas)

> **Canon respetado**: nadie murió: alguien fue enterrado y sigue respirando debajo.
> El mundo es una fosa que se ensancha; el aire es el recurso, no el tiempo.
> Ash es el intruso; el Rotom mide el aire y avisa cuando el mundo aprieta.
> Paleta del mundo: penumbra de tierra, viñeta cerrada, polvo suspendido.

> **Variables del mundo**: `v284` cuenta anomalías de W8 (contador del episodio), `v286` mide el aire.
---

## 1. Mapa del mundo

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2159 | Buried Alive — Pozo de Entrada | R9-1 | Int Cueva | 30×24 | Entrada, NPC guía, guardado |
| 2160 | Buried Alive — Túnel Angosto | R9-2 | Int Cueva | 20×40 | Laberinto de una sola línea |
| 2161 | Buried Alive — Cámara de Tierra | R9-3 | Int Cueva | 30×24 | Primera bolsa de aire; objeto oculto |
| 2162 | Buried Alive — Galería de Raíces | R9-4 | Int Bosque | 30×24 | Raíces que aprietan (puzzle) |
| 2163 | Buried Alive — Osario Inundado | R9-5 | Int Cueva | 40×24 | Combates salvajes, agua negra |
| 2164 | Buried Alive — Escalera de Tierra | R9-6 | Int Cueva | 24×30 | Vertical, transición de fase |
| 2165 | Buried Alive — Cripta del Aire | R9-7 | Int Cueva | 30×24 | Anomalía ancla: el aire se oye |
| 2166 | Buried Alive — Sala de los Sellados | R9-8 | Int Cueva | 30×24 | NPCs conscientes; 5 ataúdes |
| 2167 | Buried Alive — Pozo Sin Fondo | R9-9 | Int Cueva | 30×24 | Descenso; luz que sube |
| 2168 | Buried Alive — Pueblo Enterrado | R9-10 | Outer/Int Lavender | 40×30 | Pueblo tapado; NPCs con 5 estados |
| 2169 | Buried Alive — Iglesia Boca Abajo | R9-11 | Int Lavender | 30×24 | Segunda bolsa de aire; objeto |
| 2170 | Buried Alive — Campo de Lápidas | R9-12 | Int Cueva | 30×24 | Duelo opcional (canLose) |
| 2171 | Buried Alive — Fosa Común | R9-13 | Int Cueva | 32×32 | Anomalía de conteo (faltan cuerpos) |
| 2172 | Buried Alive — Túnel de la Mano | R9-14 | Int Cueva | 30×24 | Traducción del Rotom; lore |
| 2173 | Buried Alive — Umbral del Aire | R9-15 | Int Cueva | 32×32 | Antesala del jefe |
| 2174 | Buried Alive — Fondo de la Fosa | R9-16 | Int Cueva + R1 | 24×24 | **Jefe final**; sin cielo |

> **Orden de juego real**: 2159 → … → 2174. El aire se gasta al **correr y al pelear**
> (variable de mundo `v286`): las bolsas de aire lo reponen. Nunca mata: obliga a ritmo.

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Qué cambia en el mundo |
|---:|---|---|
| 1 | Normal | la fosa parece un túnel excavado con cuidado |
| 2 | Duda | el aire pesa: el paso del jugador suena más fuerte |
| 3 | Grieta | primeras paredes que se cierran al pasar (2 % del suelo) |
| 4 | Ruido | se oye respirar a través de la tierra; los NPCs bajan la voz |
| 5 | Pérdida | desaparece un NPC sellado; las velas se apagan solas |
| 6 | Ruptura parcial | huecos reales (5 %) y textos sin aire («…») |
| 7 | Ruptura | la salida normal se tapa; sólo queda el fondo de la fosa |

```text
# Fase 2 → 3 (al pisar 2164, celda 12,28)
tone(-32,-24,-16,0); v266 = 3; v286 (aire) = 100
# Regla de aire: correr gasta 1 punto/segundo, combatir gasta 5 por combate.
# Con v286 ≤ 20 el mapa muestra aviso; con v286 = 0 el paso se hace lento pero no hay daño.
```

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite existente | Rol y notas |
|---:|---|---|---|---|
| 2159 | El Pozo | Normal | `trchar028` | 5 estados. Pregunta si Ash bajó por alguien o por curiosidad. |
| 2159 | Rotom (medidor) | Interdimensional | `trchar001` | Marca el aire restante; cambia de color por fase. |
| 2161 | El Minero Viejo | Normal | `trainer_HIKER` | Vende aire por objetos (intercambio simbólico). |
| 2162 | La Niña de las Raíces | Consciente | `trchar010` | Dice qué raíz se puede cortar y cuál no. |
| 2163 | El Sepulturero Inundado | Normal | `trchar042` | 5 estados; en fase 5 ya no está, pero su pala sí. |
| 2166 | El Sellado Número 4 | Consciente | `trainer_PSYCHIC_M` | Sabe que hay cinco ataúdes y cuatro nombres. |
| 2166 | Los Sellados | Consciente ×4 | `trchar028` | No hablan; cuentan con los dedos cuántos faltan. |
| 2168 | El Alcalde Enterrado | Normal | `trchar070` | 5 estados; niega que el pueblo esté debajo. |
| 2169 | La Campanera Boca Abajo | Consciente | `trainer_PSYCHIC_F` | Toca la campana aunque no suene. |
| 2170 | El Cuidandero de Lápidas | Normal | `trainer_YOUNGSTER` | Duelo opcional: quiere compañía, no ganar. |
| 2171 | La Contadora de Cuerpos | Interdimensional | `trchar015` | Cuenta 47 y faltan 3; da la pista del jefe. |
| 2172 | El Traductor de Tierra | Interdimensional | `trchar028` | Traduce las marcas del túnel (Rotom Sintonía ≥5). |

**Ejemplo de diálogos de 5 estados** (El Pozo, 2159):
```text
Estado 1: "Bajas. Todos bajan. Nadie pregunta cuánto aire queda."
Estado 2: "Aprieta el pecho, ¿verdad? Es el mundo que se cierra, no tú."
Estado 3: "Las velas se apagan de a una. Yo las cuento y no me equivoco."
Estado 4: "Si oyes respirar detrás de la pared, no respondas."
Estado 5: (silencio) "..."   # el evento ya no muestra texto; hace sonar el pozo
```

---

## 4. Eventos programables

```
EV_W8_Entrada        — Mapa 2159 — Autorun al entrar (v264≥9)
                        → texto de la grieta, sw923 = ON parcial, tone fase 1, música "PkmRS-MtPyre"
EV_W8_Aire           — 2159–2174 — Proceso paralelo (no bloquea)
                        → v286 baja al correr/pelear; ≤20 aviso del Rotom; 0 = paso lento
EV_W8_Bolsa1         — 2161, celda (15,6) — Inspeccionar la grieta de aire
                        → v286 = 100; marca anomalía A02; el aire mueve el polvo (animación)
EV_W8_Raices         — 2162, 4 puntos — Cortar raíz correcta (orden 3-1-4-2)
                        → se abre paso a 2163; raíz equivocada cierra la anterior (sin daño)
EV_W8_Escalera       — 2164, celda 12,28 — Pisar
                        → fase 3: tono de tierra, 4 velas OFF, las paredes se cierran al pasar
EV_W8_Ataudes        — 2166 — Abrir los 5 ataúdes
                        → 4 tienen nombre y 1 está rayado; al cerrar el 5.º aparece el Sellado Número 4
EV_W8_Pozo           — 2167 — Autorun al pisar el borde
                        → descenso: la luz sube en vez de bajar; +1 al contador de anomalías si es la 1.ª vez
EV_W8_Campana        — 2169 — Tocar la campana en fase ≥5
                        → suena una sola vez aunque el sprite no se mueva; marca A09
EV_W8_Lapidas        — 2170 — Inspeccionar la lápida sin nombre
                        → si el jugador trae DN_W8_LAMP, aparece el nombre del Sellado
EV_W8_Fosa           — 2171 — Contar los cuerpos con la Contadora
                        → 47 contados, 3 ausentes; los 3 son el amo, el Pokémon y el jugador
EV_W8_Umbral         — 2173 — Encender 4 lámparas con v286 ≥ 60
                        → abre 2174; con v286 < 60 las lámparas se apagan al encenderse
EV_W8_Jefe           — 2174 — Hablar con el que respira (autorun de mapa)
                        → fase A (canLose) + fase B de 5 bolsas de aire; al cerrar: sw923 = ON, sello
```

---

## 5. Anomalías (11)

```
[A01] EL POLVO QUE SUBE — visual
  Map2161 — (15,6) [R9-3]. Fase ≥2. El polvo flota hacia arriba en una franja de 3 tiles.

[A02] LA BOLSA DE AIRE — auditiva
  Map2161 — (9,14). Fase ≥3. Se oye una exhalación larga al entrar; sólo una vez por visita.

[A03] LA RAÍZ QUE APRIETA — espacial
  Map2162 — (18,9). Fase ≥4. Al reentrar, la raíz ocupa una celda más del pasillo.

[A04] EL AGUA NEGRA — visual
  Map2163 — (20,12). Fase ≥3. El agua refleja un cielo que no existe en el mundo.

[A05] LAS VELAS QUE VUELVEN — temporal
  Map2166 — (14,17). Fase ≥5. Las velas apagadas están encendidas al reentrar.

[A06] EL ATAÚD RAYADO — temporal
  Map2166 — (22,17). Fase ≥6. El nombre rayado cambia cada vez que se mira.

[A07] LA LÁMPARA AL REVÉS — visual
  Map2173 — (8,8). Fase ≥5. La lámpara alumbra hacia el suelo, no hacia el techo.

[A08] LA CAMPANA SORDA — auditiva
  Map2169 — (13,10). Fase ≥4. Suena una campana que no existe; el sprite no se mueve.

[A09] EL AIRE QUE SE OYE — auditiva
  Map2165 — (16,12). Fase ≥5. **Ancla del mundo.** Al quedarse quieto 10 s se oye respirar al otro lado.

[A10] EL PUEBLO QUE FALTA — temporal
  Map2168 — (20,15). Fase ≥6. Al reentrar, una casa menos; nadie recuerda que estaba.

[A11] LA FOSA QUE CUENTA — visual
  Map2171 — (16,16). Fase ≥7. Aparecen 3 cuerpos más, tapados con la misma tierra.
```

---

## 6. Objetos

| Objeto | Tipo | Dónde | Efecto |
|---|---|---|---|
| `DN_W8_LAMP` | creepypasta | 2159 (pozo) | Lámpara de minero: revela nombres de lápida |
| `DN_W8_SHOVEL` | normal | 2163 (oculta) | Pala del sepulturero; abre la raíz de 2162 |
| `DN_W8_MASK` | normal | 2165 (oculta) | Máscara de polvo: reduce el gasto de aire a la mitad |
| `DN_W8_RING` | creepypasta | 2166 (ataúd 4) | Anillo del Sellado Número 4 |
| `DN_W8_BELL` | normal | 2169 (campana) | Campana sorda: se usa en el umbral (2173) |
| `DN_W8_LETTER` | creepypasta | 2172 (túnel) | Carta sin remitente: «Saquen a mi hermano de ahí» |
| `DN_W8_SEED` | normal | 2168 (oculta) | Semilla enterrada; cura 80 PS |

---

## 7. Pokémon y entidades

- **Salvajes del mundo**: `DUGTRIO`, `SANDSHREW`, `SANDSLASH`, `TRAPINCH`, `VIBRAVA`, `GASTLY`
  (niveles 98–106, encuentros en 2163, 2167, 2168 y 2171).
- **Entidades** (no capturables):

| Registro | Nombre | Tipo | Capturable | Dónde |
|---|---|---|---|---|
| #A201 | EL QUE RESPIRA DEBAJO | ANOMALÍA / ??? | no | 2174 (12,18) |
| #A202 | EL SELLADO NÚMERO 4 | ANOMALÍA / ??? | condicional (Rotom ≥4) | 2166 (18,17) |
| #A203 | LA MANO QUE SALE DE LA TIERRA | ANOMALÍA / ??? | no | 2171 (16,16) |
| #A204 | EL AIRE CON FORMA | ANOMALÍA / ??? | no | 2165 (16,12) |

---

## 8. Música

| Momento | Pista | Nota |
|---|---|---|
| Mundo normal | `PkmRS-MtPyre` | tono de tierra, volumen 80 |
| Aire bajo (v286 ≤ 20) | `PkmRS-MtPyre` pitch 70 | la música se apaga por momentos |
| Anomalías auditivas | silencio + respiración de 2 s | nunca un grito |
| Jefe | `Legend Sinnoh` pitch 70 | el que respira pelea sin moverse |
| Cierre | `PkmRS-MtPyre` volume 100 | el aire vuelve a entrar |

---

## 9. Jefe final del mundo: **EL QUE RESPIRA DEBAJO**

**Mecánica (no es restar PS)**: el jefe no lucha: **respira y tapa el aire**. Tiene dos fases:

1. **Fase A — duelo real** (`DN_W8_A`, equipo de 6, `canLose`): ganar sólo lo despierta.
2. **Fase B — las 5 bolsas de aire**: hay que abrir **5 bolsas** (celdas (5,5) (20,5) (12,8)
   (5,8) (20,8)) antes de que `v286` llegue a 0. Cada bolsa abierta sube `v286` a 100 y
   quita un turno de ventaja al jefe. Al abrir la quinta, el jefe suelta el nombre y cae el sello.

```text
# EV_W8_Jefe — secuencia real
1) pbTrainerBattle(DN_W8_A) → si gana el jugador, el jefe "vuelve a respirar"
2) 5 bolsas: cada una → v286 = 100; tone(-20,-16,-8,0); texto breve
3) si v286 llega a 0 durante la fase: no hay derrota; el paso se vuelve lento hasta abrir otra bolsa
4) al 5.º: sw923 = ON, entrega DN_PAGE_W8, vuelve al hub
```

**Recompensa**: `DN_W8_LAMP` + `DN_PAGE_W8` + la máscara del aire.

---

## 10. Conexión con el siguiente mundo

El aire entra de golpe y el pueblo enterrado vuelve a oler a tierra mojada. En el fondo de la
fosa, la grieta ya no está: se oye **una melodía lejana** que viene de arriba (→ W9,
*Lavender Town Syndrome*). El Rotom sentencia: «Aquí abajo ya no falta aire. Falta silencio.»
