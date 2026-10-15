# Auditoría de back sprites contra su frente

Ítem 62 del backlog: auditar los back sprites de los kits de atuendo (`creep_back`,
`glazed_back` y compañía) contra su frente, para que la espalda no tenga
proporciones distintas.

- **Herramienta:** `tools/audit_back_sprites.mjs`
  (`npm run verify:back:sprites`, incluida en `npm test`).
- **Ensamblador corregido:** `tools/assemble_atuendos.py`.
- **Registro de la conformación aplicada:** `content/atuendos_espaldas.json`.

## 1. Alcance

| Slot | Kit | Crudos de espalda (`assets_raw/`) | Gráficos del juego auditados |
|---|---|---|---|
| 8 | Maestro (regalo de Oak) | `ash_maestro_back`, `ash_maestro_battle_back_stand`, `ash_maestro_battle_back_throw` | `trchar000_8`, `boy_run_8`, `POKEMONTRAINER_Red_8_back` |
| 11 | Viajero 1ª Gen (crepypasta, «GBC») | `creep_back`, `creep_battle_back_throw` | `trchar000_11`, `boy_run_11`, `POKEMONTRAINER_Red_11_back` |
| 12 | Glazed | `glazed_back`, `glazed_battle_back_throw` | `trchar000_12`, `boy_run_12`, `POKEMONTRAINER_Red_12_back` |
| 13 | Light Platinum | `lp_back`, `lp_battle_back_throw` | `trchar000_13`, `boy_run_13`, `POKEMONTRAINER_Red_13_back` |
| 14 | Liquid Crystal | `lc_back`, `lc_battle_back_throw` | `trchar000_14`, `boy_run_14`, `POKEMONTRAINER_Red_14_back` |

Cada espalda se compara con **su** frente:

- La de caminar (fila 3 de la hoja) con la fila 0.
- La tira de batalla con `POKEMONTRAINER_Red_N` (158×158).

Los frentes, laterales, frentes de batalla y bici/surf/pesca no se tocan.

## 2. Cómo usa el motor estos sprites

- **Caminar y correr:** hoja 4×4 de 32×48. La fila 3 es la espalda (mirando
  arriba) y las columnas 1 y 3 son los pasos.
- **Tira trasera de batalla:** `Scene_Initialize` trata como animada toda tira
  con `width > 2*height`:
  - La corta en `src_rect.width = width / 5`, con `ox = width/2` y
    `oy = height` (pies abajo).
  - La de 812×196 son, por tanto, **5 marcos de 162×196**; los 2 px
    sobrantes quedan vacíos.
  - `trainerThrowingFrames` recorre los marcos 1-4 al lanzar la Poké Ball.

## 3. Hallazgos (estado anterior)

Medidas con la misma herramienta sobre los PNG que había antes de esta fase:

| Slot | Caminar: cabeza/alto frente → espalda | Desvío | Batalla: altura en pie frente → quieto | Batalla: desvío de cabeza | Lanzar vs quieto (rejilla de 203 px) | Bordes de 162 px cruzados |
|---|---|---|---|---|---|---|
| 8 | 0.296 → 0.249 | −15.7 % | 154 → 190 px (+23.4 %) | −9.6 % | −2.6 % | x=324, 486, 648 |
| 11 | 0.460 → 0.401 | −12.8 % | 155 → 192 px (+23.9 %) | +15.7 % | 0.0 % | x=324, 486, 648 |
| 12 | 0.259 → 0.352 | +35.5 % | 154 → 192 px (+24.7 %) | +19.7 % | −15.6 % | x=324, 486 |
| 13 | 0.388 → 0.290 | −25.3 % | 155 → 191 px (+23.2 %) | −5.4 % | −14.7 % | x=324, 486 |
| 14 | 0.312 → 0.238 | −23.4 % | 154 → 192 px (+24.7 %) | −22.5 % | −5.7 % | x=324, 486, 648 |

1. **Proporciones de caminar.** Cada pose IA se escalaba por separado a su
   caja de 32×48, así que la espalda heredaba las diferencias del crudo:
   - La gorra de `glazed_back` es mucho más ancha que la de `glazed_front`.
   - `lp_front` es chibi y `lp_back` no.
   - El casco de `creep_back` es más pequeño que el de `creep_front`.
   - La bufanda de `lc_back` desplazaba el recorte: el cuerpo quedaba 5,4 px
     a la izquierda del eje del frente.
2. **Tiras de batalla en una rejilla equivocada.** Estaban montadas como 4 poses
   de 203 px, pero el motor las corta en quintos de 162 px:
   - Los marcos 1-4 mostraban trozos de dos figuras.
   - Al lanzar, la animación saltaba entre medias figuras.
3. **Escala de batalla.**
   - La pose quieta llenaba los 196 px de alto: medía de 190 a 192 px en pie,
     contra 154-155 px de su frente (+23 a +25 %).
   - En glazed y lp, la pose de lanzar se encogía un 15 % para meter la mano
     alzada y la Poké Ball en la caja.
4. **Pasos partidos.** El derivado de los pasos dejaba una figura cortada en
   todas las filas de los 5 kits, también en los frentes:
   - Caminar: una fila transparente en mitad de la figura.
   - Correr: tres filas transparentes, y además perdía la fila de los pies.
5. **Charsets heredados `ash_outfit_{creep,glazed,lp,lc}`.** Son de los atavíos
   por dimensión (`PokeModAtavios`, atavíos 2-5) y no forman parte de los kits:
   - Tienen las 16 celdas con dos medias figuras.
   - En `lp`, la fila 3 son vistas laterales.
   - Se reportan abajo sin bloquear (ver §6).

## 4. Corrección aplicada en `tools/assemble_atuendos.py`

1. **Cabeza.** La proporción ancho de cabeza / alto de la espalda se iguala a la
   de su frente:
   - Caminar se mide contra `<kit>_front` y batalla contra
     `<kit>_battle_front`.
   - Se escala solo la cabeza con un factor `k` (límites 0,6-1,8), cortando en
     el cuello detectado. El cuerpo no se toca.
   - Sin cuello claro, o con menos de un 5 % de desvío, no se retoca.
2. **Escala y eje en caminar.** La espalda ocupa la misma altura que el frente
   en el marco de 32×48, con los pies en la misma línea. El eje del cuerpo (el
   centroide de los pies) se alinea con el del frente.
3. **Tira de batalla en la rejilla del motor.**
   - 812×196 = 5 marcos de 162×196 en el orden quieto, quieto, lanzar, lanzar,
     lanzar.
   - Cada marco lleva el eje del cuerpo centrado, los pies en la fila 195 y
     1 px de margen: ninguna figura cruza al marco vecino.
   - Ambas poses comparten la escala de su frente de batalla: misma altura en
     pie, sin contar la mano alzada ni la Poké Ball.
4. **Pasos sin huecos.** El cuerpo se recorta con las filas que sube y las
   piernas quedan apoyadas en la línea base.
5. **Registro.** El ensamblador escribe en `content/atuendos_espaldas.json` las
   proporciones medidas, el cuello, `k` y las alturas.
6. **Sin pisar los kits.** `tools/assemble_r17_art.py` ya no escribe
   `Red_8`/`Red_8_back` (lo hacía con la tira antigua); los delega en el kit 8.

## 5. Tolerancias de la auditoría

Todo se mide sobre los PNG del juego con alfa ≥ 128. La proporción de cabeza
se pondera por alfa, para que el borde suavizado cuente su fracción.

| Comprobación | Tolerancia | Por qué |
|---|---|---|
| Caminar: altura espalda vs frente | ±1 px | Las dos se escalan al mismo alto. |
| Caminar: pies | misma fila | La celda los apoya en la fila 47. |
| Caminar: eje del cuerpo | ±1,5 px | Medio píxel de redondeo por lado. |
| Caminar: cabeza/alto | ±15 % | En una celda de 48 px, 1 px de cabeza ya es un 5 %. |
| Caminar/correr: celdas | sin figuras partidas ni filas transparentes | — |
| Batalla: rejilla | 5 marcos con figura, pies abajo, 0 cruces y 0 px fuera de los marcos | Igual que el motor. |
| Batalla: altura en pie quieto vs frente | ±10 % | — |
| Batalla: cabeza/alto quieto vs frente | ±10 % | — |
| Batalla: escala lanzar vs quieto | ±10 % | — |

La tira clásica `POKEMONTRAINER_Red_back.png` se audita como referencia y debe
pasar la rejilla. El estado anterior acumulaba 120 incidencias; el actual
ninguna.

## 6. Pendiente recomendado (fuera de esta fase)

Recablear los atavíos 2-5 de `PokeModAtavios` (hoy `ash_outfit_*` con outfit 0)
a los slots de outfit 11-14, como ya hace el atavío 9 con el slot 8:

- Así usarían los kits conformados y auditados (caminar, correr, bici, surf,
  pesca y batalla).
- Los charsets heredados dejarían de verse partidos.

## 7. Regenerar y verificar

```bash
python3 tools/assemble_atuendos.py        # reensambla los kits (requiere Pillow)
node tools/audit_back_sprites.mjs          # mide y reescribe el bloque de abajo
npm run verify:back:sprites                # falla si algo se sale de tolerancia
```

## 8. Medidas actuales

<!-- audit_back_sprites:inicio -->
<!-- Bloque generado por tools/audit_back_sprites.mjs: no editar a mano. -->

Resultado: **todo dentro de tolerancia** (5 kits, 698 comprobaciones).

#### Caminar: frente (fila 0) contra espalda (fila 3), marco quieto

| Slot | Kit | Alto frente / espalda (px) | Pies (y) | Eje frente / espalda (x) | Cabeza/alto frente / espalda | Desvío cabeza | Celdas partidas o con huecos (caminar + correr) |
|---|---|---|---|---|---|---|---|
| 8 | ash_maestro | 48 / 48 | 47 / 47 | 15.8 / 16.0 | 0.296 / 0.289 | -2.3 % | 0 |
| 11 | creep | 48 / 48 | 47 / 47 | 15.5 / 15.8 | 0.460 / 0.487 | +6.0 % | 0 |
| 12 | glazed | 48 / 48 | 47 / 47 | 16.0 / 15.5 | 0.259 / 0.269 | +3.6 % | 0 |
| 13 | lp | 48 / 48 | 47 / 47 | 16.0 / 16.5 | 0.388 / 0.419 | +8.0 % | 0 |
| 14 | lc | 48 / 48 | 47 / 47 | 15.5 / 14.5 | 0.312 / 0.321 | +3.0 % | 0 |

#### Batalla: tira trasera contra su frente

| Slot | Tira | Marcos (motor) | Cruces de marco | En pie frente / quieto (px) | Escala quieto vs frente | Cabeza/alto frente / quieto | Desvío cabeza | Escala marcos 1-4 vs quieto |
|---|---|---|---|---|---|---|---|---|
| 8 | 812x196 | 5 x 162 px | 0 | 154 / 154 | +0.0 % | 0.303 / 0.308 | +1.5 % | +0.0 %, +0.0 %, +0.0 %, +0.0 % |
| 11 | 812x196 | 5 x 162 px | 0 | 155 / 156 | +0.6 % | 0.350 / 0.350 | -0.2 % | +0.0 %, +0.0 %, +0.0 %, +0.0 % |
| 12 | 812x196 | 5 x 162 px | 0 | 154 / 153 | -0.6 % | 0.299 / 0.301 | +0.6 % | +0.0 %, +0.7 %, +0.7 %, +0.7 % |
| 13 | 812x196 | 5 x 162 px | 0 | 155 / 156 | +0.6 % | 0.308 / 0.295 | -4.2 % | +0.0 %, -0.6 %, -0.6 %, -0.6 % |
| 14 | 812x196 | 5 x 162 px | 0 | 154 / 154 | +0.0 % | 0.329 / 0.329 | -0.1 % | +0.0 %, +0.6 %, +0.6 %, +0.6 % |

Referencia del motor: `POKEMONTRAINER_Red_back.png` 812x196, 5 marcos de 162 px, 0 cruces de marco, 5/5 marcos con figura.

#### Conformación aplicada por el ensamblador (`content/atuendos_espaldas.json`)

Proporción cabeza/alto medida en los crudos IA y factor `k` con el que se escaló solo la cabeza de la espalda (1 = sin retoque).

| Slot | Crudos | Caminar: frente / espalda → conformada | k caminar | Batalla: frente / quieto → conformada | k batalla | En pie frente / espalda (px) |
|---|---|---|---|---|---|---|
| 8 | `ash_maestro_back.png` / `ash_maestro_battle_back_stand.png` | 0.331 / 0.301 → 0.333 | 1.15 | 0.310 / 0.277 → 0.314 | 1.16 | 155 / 155 |
| 11 | `creep_back.png` / `creep_back.png` | 0.490 / 0.410 → 0.490 | 1.32 | 0.354 / 0.410 → 0.357 | 0.81 | 156 / 156 |
| 12 | `glazed_back.png` / `glazed_back.png` | 0.286 / 0.362 → 0.292 | 0.71 | 0.302 / 0.362 → 0.309 | 0.77 | 154 / 154 |
| 13 | `lp_back.png` / `lp_back.png` | 0.426 / 0.297 → 0.434 | 1.75 | 0.311 / 0.297 → 0.297 | 1.00 | 156 / 156 |
| 14 | `lc_back.png` / `lc_back.png` | 0.344 / 0.260 → 0.345 | 1.46 | 0.333 / 0.260 → 0.336 | 1.40 | 155 / 155 |

#### Charsets heredados de los atavíos por dimensión (informativo, no bloquea)

| Charset | Tamaño | Celdas con la figura partida | Celdas con huecos | Celdas vacías |
|---|---|---|---|---|
| `ash_outfit_creep` | 128x192 | 16/16 | 0/16 | 0/16 |
| `ash_outfit_glazed` | 128x192 | 16/16 | 0/16 | 0/16 |
| `ash_outfit_lp` | 128x192 | 16/16 | 0/16 | 0/16 |
| `ash_outfit_lc` | 128x192 | 16/16 | 0/16 | 0/16 |

<!-- audit_back_sprites:fin -->
