# MUNDO W7 — STRANGLED RED
## «El duelo que se ahorcó a sí mismo» · Recurso base: **R8 — Strangled Red** (16 mapas)

> **Canon respetado**: el mundo ya terminó antes de que Ash llegue. No hay villano al que
> derrotar: hay un amo que sigue buscando a su Pokémon y una correa que nunca se soltó.
> Ash es el intruso; su Rotom es lo único que puede traducir el duelo.
> Paleta del mundo: rojo apagado, sombras que no siguen al dueño, líneas de correa cruzando el aire.

> **Variables del mundo**: `v283` cuenta anomalías de W7 (contador del episodio), `v288` cuenta correas cortadas.
---

## 1. Mapa del mundo

| Mapa | Título | Recurso (ficha) | Tileset | Tamaño | Rol |
|---:|---|---|---|---|---|
| 2143 | Strangled Red — Patio de la Casa Rota | R8-1 | Outer/Int Lavender | 30×24 | Entrada, NPC guía, guardado |
| 2144 | Strangled Red — Cuarto del Amo | R8-2 | Int Lavender | 30×24 | Primera correa, objeto de historia |
| 2145 | Strangled Red — Pasillo de Trofeos | R8-3 | Int Lavender | 40×24 | Trofeos que nombran a los caídos |
| 2146 | Strangled Red — Jardín de la Promesa | R8-4 | Int Bosque | 30×24 | Escena de duelo (anomalía ancla) |
| 2147 | Strangled Red — Cocina Fría | R8-5 | Int Lavender | 30×24 | Combates salvajes, objeto oculto |
| 2148 | Strangled Red — Escalera Que Sube y Baja | R8-6 | Int Cueva | 24×30 | Vertical, transición de fase |
| 2149 | Strangled Red — Cripta del Pokémon | R8-7 | Int Cueva | 30×24 | Lápida con el nombre real |
| 2150 | Strangled Red — Torre de las Cintas | R8-8 | Int Lavender | 30×24 | Puzzle de correas (4 puntos) |
| 2151 | Strangled Red — Sala de los Reflejos | R8-9 | Int Lavender | 30×24 | Espejos que muestran a Red |
| 2152 | Strangled Red — Corredor de la Culpa | R8-10 | Int Cueva | 20×40 | Laberinto; se cierra por detrás |
| 2153 | Strangled Red — Plaza Sin Gente | R8-11 | Outer/Int Lavender | 30×24 | NPCs con 5 estados |
| 2154 | Strangled Red — Canil Vacío | R8-12 | Int Cueva | 30×24 | Segundo duelo opcional (canLose) |
| 2155 | Strangled Red — Capilla del Nudo | R8-13 | Int Lavender | 30×24 | Anomalía ancla: la correa se ata sola |
| 2156 | Strangled Red — Espejo Roto | R8-14 | Int Lavender | 30×24 | Traducción del Rotom; lore |
| 2157 | Strangled Red — Umbral del Ahorcado | R8-15 | Int Cueva | 32×32 | Antesala del jefe |
| 2158 | Strangled Red — Árbol del Ajuste | R8-16 | Int Cueva + R1 | 24×24 | **Jefe final**; rojo de sangre |

> **Orden de juego real**: 2143 → 2144 → … → 2158. La Escalera (2148) y el Corredor (2152)
> son los descensos que cambian de fase.

---

## 2. Progresión de las 7 fases

| Fase | Nombre | Qué cambia en el mundo |
|---:|---|---|
| 1 | Normal | el rojo es un rojo vivo; el mundo parece una casa habitada |
| 2 | Duda | la correa del umbral aparece anudada; un NPC no responde |
| 3 | Grieta | las sombras dejan de seguir a su dueño durante 1 s |
| 4 | Ruido | se oye una respiración que no es de nadie; los trofeos giran |
| 5 | Pérdida | desaparece el NPC guía; el patio pierde sus flores |
| 6 | Ruptura parcial | huecos en el suelo (5 %), textos con el nombre del Pokémon borrado |
| 7 | Ruptura | silueta de R1 tras el árbol; la salida normal se vuelve la grieta |

```text
# Fase 2 → 3 (al pisar 2148, celda 12,28)
tone(-24,-24,-24,0); v266 = 3; música "PkmRS-MtPyre" pitch 90
# Fase 5 → 6 (al abrir la 3.ª correa en 2150)
tone(-96,-64,-64,40); v266 = 6; huecos activos (content/dimensional_nightmare_fases.json)
```

---

## 3. NPCs por mapa

| Mapa | NPC | Tipo | Sprite existente | Rol y notas |
|---:|---|---|---|---|
| 2143 | El Sepulturero del Patio | Normal | `trchar028` | 5 estados. Cree que Ash viene a devolver algo. Estado 5: mira la correa y calla. |
| 2143 | Rotom (proyección) | Interdimensional | `trchar001` | Traduce el duelo en texto; cambia por fase. |
| 2144 | La Madre del Amo | Normal | `trchar042` | Guarda la ropa del Pokémon. Estado 4: la dobla sin mirar. |
| 2145 | El Niño del Trofeo | Consciente | `trchar010` | Lee los trofeos: cada uno tiene un año que no existe. |
| 2146 | La Jardinera de Promesas | Normal | `trchar052` | Cura 1 vez por visita; en fase 5 ya no está, pero su regadera sí. |
| 2147 | Cocinera Sin Fuego | Normal | `trainer_PSYCHIC_F` | Cambia objetos por recuerdos (intercambio simbólico). |
| 2149 | El Criptero | Consciente | `trainer_HIKER` | Sabe el nombre real del Pokémon y no lo dice hasta la fase 6. |
| 2150 | La Tejedora de Cintas | Normal | `trchar015` | Explica el orden de las correas; una de ellas desaparece en fase 4. |
| 2151 | El Reflejo de Red | Interdimensional | `trchar028` | Repite la última frase del jugador con la voz de Red. |
| 2153 | El Vecino Que No Mira | Normal | `trchar070` | 5 estados; nunca mira a los ojos, siempre a la correa. |
| 2154 | El Cuidador del Canil | Consciente | `trainer_YOUNGSTER` | Reta a duelo opcional: quiere saber si Ash también perdió a alguien. |
| 2155 | Los Cuatro Anudados | Consciente ×4 | `trchar028` | No hablan; si el jugador se acerca al nudo, señalan el árbol. |
| 2156 | El Traductor de Cintas | Interdimensional | `trchar001` | Traduce (con Rotom Sintonía ≥4) la inscripción del árbol. |

**Ejemplo de diálogos de 5 estados** (El Sepulturero del Patio, 2143):
```text
Estado 1: "Otro que viene a preguntar por la casa. Ya no queda nadie, chico."
Estado 2: "El amo la quería más que a su propio nombre. Eso también es querer."
Estado 3: "Anoche la correa estaba en el patio. Hoy está en el árbol. Yo no la moví."
Estado 4: "Si vas a subir, sube con alguien que te espere abajo."
Estado 5: (silencio) "..."   # el evento ya no muestra texto; mira la correa y se gira
```

---

## 4. Eventos programables

```
EV_W7_Entrada        — Mapa 2143 — Autorun al entrar (v264≥9)
                        → texto de la grieta, sw922 = ON parcial, tone fase 1, música "PkmRS-MtPyre"
EV_W7_Cuarto         — 2144, 3 puntos — Al inspeccionar la cama, la correa y la foto
                        → v288 += 1; al 3.º: aparece la primera correa (celda inicial de 2150)
EV_W7_Trofeos        — 2145 — Al hablar con el Niño del Trofeo
                        → lista de nombres con años imposibles; marca anomalía A02
EV_W7_Jardin         — 2146 — Pisar el centro del jardín en fase ≥3
                        → la música se corta 4 s; el jardín se marchita (tile swap) y vuelve al salir
EV_W7_Escalera       — 2148, celda 12,28 — Pisar
                        → fase 3: tono rojo apagado, 3 antorchas OFF, sombras desincronizadas
EV_W7_Correas        — 2150, 4 puntos (5,5) (24,5) (5,18) (24,18)
                        → orden correcto 2-4-1-3: cada correa rota sube v288 y quita un paso al jefe
EV_W7_Reflejos       — 2151 — Al pisar cada espejo
                        → el reflejo copia la posición del jugador con 1 s de retraso (eco)
EV_W7_Corredor       — 2152 — Autorun al entrar
                        → el pasaje se cierra detrás (tile swap); la única salida es avanzar
EV_W7_Nudo           — 2155 — Tocar el nudo con la 3.ª correa rota
                        → la correa se ata sola; queda marcada la anomalía ancla A09
EV_W7_Umbral         — 2157 — 4 velas encendidas en las esquinas (5,5) (26,5) (5,26) (26,26)
                        → abre 2158; en fase 6 una vela se apaga sola
EV_W7_Jefe           — 2158 — Hablar con el amo (autorun de mapa)
                        → fase A (canLose) + fase B de 4 correas; al cerrar: sw922 = ON, sello
```

---

## 5. Anomalías (12)

```
[A01] LA CORREA QUE VUELVE — visual
  Map2144 — (7,6) [R8-2]. Fase ≥2. La correa colgada está en el suelo al reentrar, y viceversa.

[A02] TROFEOS QUE GIRAN — visual
  Map2145 — (14,9). Fase ≥4. Los trofeos miran hacia la puerta cuando el jugador entra.

[A03] LA PROMESA SIN FLORES — temporal
  Map2146 — (19,11). Fase ≥5. Al salir y volver, el jardín está seco y la regadera llena.

[A04] LA COCINA QUE HUELE — auditiva
  Map2147 — (9,4). Fase ≥3. Se oye una olla silbando; al entrar a la cocina, silencio total.

[A05] LA ESCALERA QUE REPITE — espacial
  Map2148 — (12,28). Fase ≥4. Bajar dos veces seguidas devuelve al jugador al mismo escalón.

[A06] LA LÁPIDA SIN NOMBRE — temporal
  Map2149 — (16,7). Fase ≥6. El nombre aparece sólo si el jugador ya rompió 2 correas.

[A07] LAS CINTAS QUE CUENTAN — auditiva
  Map2150 — (24,5). Fase ≥3. Al romper la 1.ª correa suena una cinta con una voz que llama a un Pokémon.

[A08] EL REFLEJO TARDE — visual
  Map2151 — (11,12). Fase ≥2. El reflejo del espejo repite la posición anterior del jugador.

[A09] LA CORREA QUE SE ATA SOLA — visual
  Map2155 — (16,12). Fase ≥5. **Ancla del mundo.** Al reentrar, la correa del altar tiene un nudo nuevo.

[A10] LA PLAZA DESHABITADA — temporal
  Map2153 — (15,12). Fase ≥5. Al reentrar después de hablar con el Vecino, no queda ningún NPC.

[A11] EL CANIL VACÍO — auditiva
  Map2154 — (13,10). Fase ≥4. Se oye un collar moviéndose; al acercarse, la caseta está cerrada.

[A12] EL ÁRBOL QUE RESPIRA — visual
  Map2158 — (12,20). Fase ≥7. La corteza sube y baja; la silueta de R1 aparece tras el tronco.
```

---

## 6. Objetos

| Objeto | Tipo | Dónde | Efecto |
|---|---|---|---|
| `DN_W7_LEASH` | creepypasta | 2144 (cama) | La correa rota: se muestra en el inventario y no se puede tirar |
| `DN_W7_PHOTO` | creepypasta | 2144 (foto) | Foto del amo con su Pokémon; el nombre está raspado |
| `DN_W7_TROPHY` | normal | 2145 (trofeo) | Trofeo de un año imposible; se intercambia en 2147 |
| `DN_W7_SEED` | normal | 2146 (oculto) | Semilla de la promesa; cura 1 vez por combate |
| `DN_W7_MILK` | normal | 2147 (oculta) | Leche de la cocina fría; cura 60 PS |
| `DN_W7_RIBBON` | creepypasta | 2150 (correa 4) | Cinta con el nombre real del Pokémon |
| `DN_W7_WATER` | normal | 2153 (Vecino) | Regadera prestada; desbloquea la lápida de 2149 |

---

## 7. Pokémon y entidades

- **Salvajes del mundo**: `HOUNDOUR`, `POOCHYENA`, `MIGHTYENA`, `SPINARAK`, `ARIADOS`, `MURKROW`
  (niveles 96–104, encuentros en 2145, 2147, 2150 y 2154).
- **Entidades** (no capturables, `Registro Dimensional`):

| Registro | Nombre | Tipo | Capturable | Dónde |
|---|---|---|---|---|
| #A101 | EL QUE ESPERA EN LA PUERTA | ANOMALÍA / ??? | no | 2143 (7,10) |
| #A102 | SOMBRA SIN DUEÑO | ANOMALÍA / ??? | condicional (Rotom ≥3) | 2145 (20,14) |
| #A103 | EL NOMBRE RASPADO | ANOMALÍA / ??? | no | 2149 (16,7) |
| #A104 | EL AMO (memoria) | ANOMALÍA / ??? | no | 2158 (12,18) |

---

## 8. Música

| Momento | Pista | Nota |
|---|---|---|
| Mundo normal | `PkmRS-MtPyre` | tono base del mundo |
| Fases 3–5 | `PkmRS-MtPyre` pitch 90 | la melodía se arrastra |
| Anomalías auditivas | `PkmRS-MtPyre` + corte de 4 s | silencio incómodo, no jump scare |
| Jefe | `Legend Sinnoh` pitch 80 | el duelo del amo |
| Cierre | `PkmRS-MtPyre` pitch 100 | vuelve el rojo vivo 8 s antes de la grieta |

---

## 9. Jefe final del mundo: **EL AMO Y LA CORREA**

**Mecánica (no es restar PS)**: el amo pelea con la correa en la mano. Tiene dos fases:

1. **Fase A — duelo real** (`DN_W7_A`, equipo de 6, `canLose`): se pelea normal, pero al ganar
   el combate **no termina**: el amo se levanta y ata la correa al árbol.
2. **Fase B — las 4 correas**: hay que **cortar 4 correas** repartidas por 2158 (celdas
   (6,4) (20,4) (6,10) (20,10)). Cada correa cortada baja un paso la defensa del amo y sube
   `v288`. Al cortar la cuarta, el amo suelta el nombre del Pokémon y el sello del mundo cae.

```text
# EV_W7_Jefe — secuencia real
1) pbTrainerBattle(DN_W7_A)  → si gana el jugador, NO cierra el evento
2) 4 correas: interactuar con cada celda → v288+=1; tone(-40,-40,-40,0); texto de corte
3) al 4.º: sw922 = ON, entrega DN_PAGE_W7, vuelve al hub con la grieta marcada
```

**Recompensa**: `DN_W7_LEASH` (correa del amo) + `DN_PAGE_W7` (página del archivero).

---

## 10. Conexión con el siguiente mundo

Al caer el sello, la casa se ordena: la correa cuelga recta y el rojo vuelve a ser rojo vivo.
En el patio, la grieta cambia de firma y muestra **una losa con aire saliendo de debajo**
(→ W8, *Buried Alive*). El Rotom registra: «El amo no se ha ido. Se ha enterrado con él.»
