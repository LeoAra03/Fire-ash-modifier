# PLAN DE TRABAJO — Recreación total de los mapas del Nightmare
## De los 7 mosaicos a 101 mapas, con enfoque **pixel-identidad** (decisión tomada)

> **Decisiones vigentes (ronda del 2026-10-01):**
> - **Fidelidad: B — pixel-identidad.** Se extraen los tiles de los mosaicos y se generan
>   tilesets derivados; la matriz de cada ficha se vuelca al mapa, de modo que el mapa
>   reproduce la imagen de referencia.
> - **Alcance del primer ciclo: piloto de 3 mapas + EP01 completo (16 mapas).**
> - **Los mosaicos se depositan en `Mapas/crepypasta/`.** `Mapas/Atlas/` **no se toca**
>   en esta fase.
> - **Consecuencia asumida**: el arte derivado es material de terceros. El pipeline lo marca
>   como *uso interno de desarrollo* y **no se empaqueta en el juego distribuido**
>   (`.gitignore` + aviso en el catálogo generado).
>
> Estado de las herramientas: **E0, E1, E2 y la verificación de pixel-identidad ejecutadas sobre
> los mosaicos reales**: 96/96 fichas reconstruidas **sin un solo píxel de diferencia**, tanto a
> resolución nativa (×1) como a la escala de juego (×2). E3 es la etapa en curso.

---

## 1. Estado de partida

| Pieza | Estado |
|---|---|
| GDD funcional (101 mapas, 105 eventos, 77 anomalías, 19 entidades) | ✅ `docs/DIMENSIONAL_NIGHTMARE/` |
| Catálogo de datos | ✅ `content/dimensional_nightmare.json` |
| **E0** los 7 mosaicos en el repo | ✅ `Mapas/Crepypastas/` (7 JPG, subidos por el usuario) |
| **E1** ingesta y medición de los mosaicos | ✅ `npm run dn:ingest` → 96/96 fichas |
| **E2** extracción de tilesets y matrices de mapa | ✅ `npm run dn:tiles` (×1) · `npm run dn:tiles:2x` (×2) |
| **E2-check** reconstrucción píxel a píxel | ✅ `npm run dn:verify` → 96/96 idénticas (×1 y ×2) |
| Pruebas sin los mosaicos reales | ✅ `npm run dn:fixtures` (genera 7 mosaicos sintéticos y corre todo) |
| **E3** volcado a mapas + pasajes | ⏳ siguiente |

### Paso 0 — ya hecho
```bash
npm install                     # dependencias (incluye @napi-rs/canvas)
npm run dn:check                # emparejamiento archivo → recurso (mapping.json verificado)
npm run dn:ingest               # 96 fichas + index.json con medidas
npm run dn:tiles                # 7 tilesets ×1 + 96 matrices de mapa
npm run dn:tiles:2x             # 7 tilesets ×2 (escala de juego RMXP)
npm run dn:verify               # reconstruye las 96 fichas y las compara píxel a píxel
```

**Resultado medido (2026-10-01):** 96/96 fichas con desviación `0.0000 %` en ×1 y en ×2
(5 517 y 25 852 tiles únicos respectivamente). Los mosaicos no se tocan: se leen de
`Mapas/Crepypastas/` mediante `reference/dimensional_nightmare/mapping.json`.

---

## 2. Pipeline (7 etapas)

```
E0 depositar ─► E1 ingesta ✅ ─► E2 tilesets ✅ ─► E3 mapas + pasajes ─► E4 eventos
                                                                          │
                        E6 instalación ◄── E5 verificación ◄──────────────┘
```

### E0 — Depósito ✅
`Mapas/Crepypastas/` (7 JPG) + `mapping.json` verificado por contenido + `npm run dn:check` en
verde. Dos de los mosaicos venían con nombres engañosos (`Gold Lost Silver.jpg` es el set de
montaña nevada R6 y `Pokemon Black GHOST.jpg` el de pueblos sepia R5): por eso la asignación
manual en `mapping.json` tiene prioridad absoluta sobre cualquier heurística por nombre.

### E1 — Ingesta, corte y medición ✅ *construida y probada*
- **Hace**: autodetecta la rejilla de cada mosaico (separadores oscuros), recorta las 96 fichas,
  y mide por ficha: tamaño, tiles aparentes, factor de escala (×1–×4), paleta, luminancia y
  huella 8×8.
- **Salida**: `reference/dimensional_nightmare/slices/<recurso>/NN.png` + `index.json`.
- **Ejecutado sobre los mosaicos reales**: 96/96 fichas (16/16/1/16/16/15/16). Cuatro mosaicos
  por autodetección de separadores y dos por rejilla uniforme (R3 = ficha única; R6 = 3 filas ×
  5 columnas, corregido: la definición y el corte tenían filas/columnas invertidas).
- **Prueba**: `npm run dn:fixtures` (mosaicos sintéticos) y `npm run dn:selftest` (rejilla).
- **Riesgo cubierto**: rejillas raras se corrigen en `layout.json` sin tocar código.

### E2 — Tilesets derivados y matrices ✅ *construida y probada*
- **Hace** (`tools/dn_extract_tileset.mjs`):
  1. Lleva cada ficha a resolución nativa (si el mosaico venía escalado ×2/×3/×4, reduce con
     *nearest neighbor*: sin interpolar, el pixel art no se ensucia).
  2. Ajusta la ficha al múltiplo de 32 más cercano por arriba **extendiendo el borde**, para que
     la rejilla cubra la escena completa (antes se perdían hasta 31 px del borde derecho/inferior).
  3. Corta la ficha en bloques de **32×32** (la celda de RPG Maker XP = 2×2 tiles GBA de 16×16).
     Con `--scale 2` el arte se amplía ×2 con vecino más cercano *antes* de cortar: es la escala
     de juego (el pixel art GBA de 16 px queda como lo muestra RMXP en pantalla).
  4. Deduplica bloques por hash SHA-1 y construye un **PNG de tileset** por recurso
     (8 columnas, formato RMXP; id de tile = 384 + índice).
  5. Escribe la **matriz** de cada ficha: la rejilla de índices que, pintada con ese tileset,
     reproduce la imagen. Es el mapa listo para instalar.
- **Salida**: `reference/dimensional_nightmare/tilesets/<grupo>{,_2x}.png` +
  `content/dimensional_nightmare_tiles{,_2x}.json`.
- **Prueba**: `npm run dn:tiles:selftest` (selftest sintético) y `npm run dn:verify`
  (`tools/dn_verify_slices.mjs`): reconstruye las 96 fichas y las compara **píxel a píxel** contra
  el mosaico → **96/96 idénticas, desviación 0.0000 %**, en ×1 y en ×2. Además genera una vista
  previa `original | reconstruida | diferencias` por ficha (`--preview <grupo> --index N`).
- **Aviso automático** si un grupo supera 1.024 tiles: en ×2 los siete grupos lo superan
  (3 500–4 200 tiles), así que **E3 trocea el tileset por mapa** (cada mapa usa solo sus bloques)
  en vez de instalar un PNG gigante por recurso.

### E3 — Mapas y pasajes ✅ *piloto + EP01 construidos*
- **Plano**: `content/dimensional_nightmare_maps.json` (`npm run dn:plan`) — generado de las
  tablas del GDD (docs 01–07): 101 mapas, 100 con ficha de referencia asignada y su recorte de
  `slices/` ya resuelto. `npm run dn:plan:check` verifica que todos los recortes existan.
- **Herramienta**: `tools/apply_dimensional_nightmare_maps.mjs` (backup → escritura → `--verify`;
  `--dry-run`, `--only`, `--episode`, `--render`).
- **Hace**, por mapa:
  1. **Tileset por mapa** `DN_<id>.png`: solo los bloques que ese mapa usa (~220–250), con entrada
     propia en `Tilesets.rxdata` (7 autotiles vacíos; pasajes/priorities/terrain desde el id 384).
     Así ningún mapa carga un PNG de 3 500–4 200 bloques.
  2. Escribe `Map<id>.rxdata` con la matriz de la ficha ×2 en la capa 1 — el mapa **es** la escena
     de referencia a escala de juego (p. ej. 2041 → 704×352 px = 22×11 bloques).
  3. Registra `MapInfos.rxdata` (`DN 2041 · Catacumbas — Entrada Arqueada`, padre 2030) y copia
     `map_metadata.dat` del mapa 2021 (BGM de combate heredado, sin clima).
  4. **Pasajes**: arranque conservador — todo transitable salvo bloques vacíos. Deliberadamente no
     se infieren muros por color ni por oscuridad: en este arte el azul es agua (R5/R6), glitch
     (R1) y trono (R4) a la vez, y la oscuridad es cueva (R7) y noche (R5). Los muros se declaran
     por mapa en `content/dimensional_nightmare_passability.json` (celdas bloqueadas o liberadas)
     y se revisan sobre el overlay; el BFS (`reachableCells`) valida que no queden zonas aisladas.
  5. **Comparativa visual** en `docs/dn_referencia/<id>_comparacion.png`: ficha de referencia |
     mapa construido | overlay de transitabilidad (verde = alcanzable, ámbar = aislado, rojo = muro).
- **Pasajes**: `tools/dn_propose_passability.mjs` (`npm run dn:pasajes`) propone los muros por
  **estructura** (detalle local de alto contraste agrupado), **puentea** lo imprescindible para no
  partir el mapa, **garantiza un 25 % de suelo alcanzable** desde la entrada y **poda** lo que
  quedaría inaccesible. Los ajustes finos se hacen con `openRects` / `blockRects` (rectángulos
  manuales que mandan sobre la propuesta) y se revisan en el overlay
  `docs/dn_referencia/pasajes/<id>_pasajes.png`. El consumidor instala los pasajes **por tile**
  (RMXP guarda el pasaje por tile: un tile es transitable si alguna de sus celdas lo es).
- **Construido y verificado (2026-10-01)**: piloto `2041` (R7-1, ts #26), `2088` (R2-1, #27),
  `2120` (R4-1, #28) **y EP01 completo `2041`–`2056`** (tilesets #26 y #29–#43, 162–252 tiles
  cada uno). `npm run dn:maps:verify` en verde (16 mapas: mapa, tamaño, tileset, PNG, MapInfos,
  metadatos) y **BFS 100 % en los 16**. Comparativas antes/después de EP01 en
  `docs/dn_referencia/` (referencia | mapa construido | overlay de transitabilidad).
- **Nota de fidelidad**: las fichas traen a veces horneado el sprite del jugador de la ROM de
  referencia; al copiar la escena píxel a píxel ese sprite queda como tile del mapa. Opción
  pendiente `--erase-actor` para sustituir esa zona por el suelo circundante si se quiere limpiar.
- **Decisión de tamaño**: el mapa se construye al tamaño real de la ficha ×2 (no al `30×24` de
  diseño del GDD, que era una estimación de pantalla GBA). A revisar con el piloto: opciones
  `--fit <WxH>` para completar hasta el tamaño de diseño con el borde de la propia escena.
- **Criterio de término por mapa**: checklist §4.

### E4 — Eventos, NPCs y jefes
- **Herramienta a crear**: `tools/apply_dimensional_nightmare_events.mjs`.
- **Entrada**: `10_EVENTOS_Y_FLAGS.md` (105 eventos) y `09_REGISTRO_DIMENSIONAL.md`.
- **Hace**: escribe comandos RMXP (101/401 texto, 111 condiciones, 121 switches, 122 variables,
  123 self-switch, 201 transferencias, 301 batallas) con `canLose`, derrota permanente y
  recompensa única.
- **Criterio de término**: `verify:event-collision` y `verify:defeats` en verde.

### E5 — Verificación
- **Herramienta a crear**: `tools/dn_render_reference.mjs` (variante de
  `render_atlas_visual_reference.mjs`): genera, por lote, `docs/dn_referencia/<lote>_antes.png`
  (las fichas de referencia) y `_despues.png` (los mapas construidos, renderizados desde los
  `.rxdata`), más un **overlay de transitabilidad** para revisar los pasajes de un vistazo.
- **Chequeos**: BFS, pasos direccionales, tiles fuera de rango, eventos fuera de límites,
  colisión de eventos, tono, transferencias, cero escrituras a partidas.
- **Criterio de término**: `npm run dn:verify` + `verify:all` sin regresiones.

### E6 — Instalación y empaquetado
Backups, instalación aditiva, `verify:package` y paso de «diseño» a «instalado» en
`docs/ESTADO_CONTENIDO_Y_PROMPTS.md`. QA manual en `Game.exe` (sección F).

---

## 3. Lotes

**Piloto (3 mapas, 1 sesión)**: `Map2041` (catacumbas), `Map2088` (bosque) y `Map2120` (trono).
Uno por familia de tileset. Fija la calidad de E3 antes de escalar.

**Ciclo aprobado**: piloto + **EP01 completo** (2041–2056, 16 mapas).

| Lote | Mapas | Episodio | Foco |
|---:|---|---|---|
| Piloto | 2041, 2088, 2120 | — | ✅ construido: calibración de E3 |
| L1–L3 | 2041–2056 | EP01 White Hand | 16 mapas, descenso vertical, sala de jefe |

Lotes siguientes (a autorizar con el piloto y EP01 ya vistos): EP02 (16), EP03 (15), EP04 (16),
EP05 (16), EP06 (16), Nexo (5) y antesala (1).

---

## 4. Checklist de aceptación por mapa

1. La matriz reproduce la ficha: el render del mapa coincide con la ficha de referencia.
2. Tamaño coherente (nativo, o ×2 con `--scale 2`).
3. **BFS completo**: entrada → salida → cada objeto, sin atravesar muros.
4. Pasajes: sin celdas "atrapadas" ni huecos por los que caerse del mapa.
5. Todos los eventos del GDD presentes, con su trigger y sus switches.
6. Jefe: `canLose` + derrota permanente + recompensa única (si aplica).
7. Render antes/después + overlay de transitabilidad en `docs/dn_referencia/`.
8. Sin tiles fuera de rango ni eventos fuera de límites (`verify:event-collision`).
9. `verify:tone-safety` y `verify:transition-safety` en verde.
10. Ni una escritura a `Save*.rxdata` / `Game.rxdata`.

---

## 5. Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---:|---|---|---|---|
| 1 | Rejilla distinta a la esperada | media | bajo | autodetección + `layout.json` + fixtures (ya construido) |
| 2 | Mosaico escalado o con artefactos JPEG | alta | medio | `scaleGuess` + reducción *nearest*; umbrales de color adaptativos |
| 3 | Ruido en los tiles: cada bloque casi único | alta | medio | deduplicar por hash; si un grupo pasa de 1.024 tiles, partir el tileset por lote |
| 4 | Pasajes incorrectos | **alta** | alto | BFS obligatorio + overlay visual + `passability.json` de overrides |
| 5 | Ficha ≠ tamaño GBA estándar | media | bajo | `--scale` para normalizar a 30×24/40×40 |
| 6 | Derechos sobre el arte de terceros | alta | **alto** | arte derivado **no se empaqueta**; `.gitignore`, aviso en el catálogo y alternativa de reconstrucción con tiles propios si el juego se publica |
| 7 | Los mapas R1 (glitch) rompen la rejilla | media | medio | tratarlos como *collage* sobre base válida; pasajes validados por BFS |
| 8 | Volumen (101 mapas) | — | alto | piloto + EP01 antes de autorizar el resto |

---

## 6. Decisiones registradas

| # | Decisión | Elegida | Nota |
|---:|---|---|---|
| D1 | Fidelidad | **B (pixel-identidad)** | arte derivado de terceros: uso interno, no empaquetado |
| D2 | Alcance del primer ciclo | **Piloto + EP01** | 3 + 16 mapas |
| D3 | Arte nuevo (Rey Unown, Mano Blanca) | pendiente | se decide al terminar el piloto |
| D4 | Tamaño de mapa | **ficha ×2** (nativo de la escena) | alternativa `--fit WxH` a revisar con el piloto |
| D5 | Pasajes | borrador abierto + overrides | la revisión del overlay del piloto define los muros |

---

## 7. Qué NO entra en este plan

- Tocar `Mapas/Atlas/` o los mapas v1 (2021–2030) y La Ruta de Dios.
- Empaquetar arte derivado de terceros en el juego distribuido.
- Modificar partidas (`Save*.rxdata` / `Game.rxdata`): jamás.

---

## 8. Comandos

```bash
npm ci                    # dependencias (incluye @napi-rs/canvas)
npm run dn:check          # ¿están los 7? ¿cómo se emparejaron?
npm run dn:ingest         # E1: 96 fichas + index.json
npm run dn:tiles          # E2: tilesets ×1 + matrices de mapa
npm run dn:tiles:2x       # E2: tilesets ×2 (escala de juego)
npm run dn:verify         # E2-check: reconstrucción píxel a píxel (96/96)
npm run dn:fixtures       # ensayo general sin los mosaicos reales
npm run dn:selftest       # rejilla de la ingesta
npm run dn:tiles:selftest # reconstrucción píxel a píxel del extractor
```
