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

### E3 — Mapas y pasajes ✅ *100/100 mapas construidos (2026-10-01)*
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
- **Construido y verificado (2026-10-01)**: **los 100 mapas con ficha** — piloto (`2041`, `2088`,
  `2120`), EP01 (2041–2056), EP02 (2057–2072), EP03 (2073–2087), EP04 (2088–2103),
  EP05 (2104–2119), EP06 (2120–2135) y Nexo (2136–2140). Tilesets #26–#125 (159–288 tiles cada
  uno; 100 entradas `DN_*` en `Tilesets.rxdata`). `npm run dn:maps:verify` en verde para los 100
  (mapa, tamaño, tileset, PNG, MapInfos, metadatos) y **BFS 100 % en los 100** (sin ninguna celda
  transitable inalcanzable).
- **Revisión visual**: una hoja de contacto por episodio en `docs/dn_referencia/lotes/<EP>.png`
  con una fila por mapa (`referencia | mapa construido | overlay`). El detalle por mapa vive en
  `docs/dn_referencia/detalle/` (ignorado en git).
- **Hub 2040 (Antesala de las Grietas)**: único mapa sin ficha; lo construye
  `tools/dn_build_hub_map.mjs` (`npm run dn:hub`) como **ventana jugable de la Gruta de los
  Testigos (2030)**: busca los recortes de 30×24 con más superficie transitable y mejor
  conectividad, elige la ventana `(38,20)` — una sala amplia con recodo — y copia las tres capas
  tal cual. Reutiliza el tileset del juego base (no gasta una entrada `DN_*`), se registra en
  `MapInfos` (padre 2030) y hereda los metadatos del 2030. Evidencia en
  `docs/dn_referencia/lotes/HUB.png`; `npm run dn:hub:verify` comprueba tamaño, tileset, entrada,
  BFS ≥ 90 % y **fidelidad exacta a la ventana de origen (0 diferencias)**.
- **Ficha reutilizada a propósito**: en EP02 y EP06 el GDD reutiliza una ficha con la marca `bis`
  (`R5-3` en 2062 y 2066) — se construyen dos mapas de la misma escena, como pide el GDD.
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
npm run dn:maps:all       # E3: construye los 100 mapas y sus comparativas
npm run dn:events:plan    # E4: lee los docs 01–07 → events.json
npm run dn:events:check   # E4: valida el plano (7/7 episodios)
npm run dn:events         # E4: instala conexiones + NPCs + eventos + jefes en los 100 mapas
npm run dn:events:ep      # E4: un episodio (--episode EP01)
npm run dn:events:verify  # E4: verifica los mapas ya instalados (no reescribe)
npm run dn:battles        # E4: fase B, trainers DN_* y objetos DN_* (idempotente)
npm run dn:battles:verify # E4: ¿están los trainers, los objetos, los iconos y los pasos de fase B?
```

## 9. Plan de elaboración de los lotes restantes (L4–L9)

**Objetivo del tramo**: pasar de 16 mapas construidos (EP01) a **los 101 del ciclo** con la misma
calidad verificable, sin inventar contenido nuevo y sin tocar partidas.

### 9.1 Alcance y orden

| Lote | Episodio | Mapas | Recurso | Fichas |
|---|---|---:|---|---|
| L4 | EP02 Lost Silver | 16 | R5 | R5-1…R5-16 (dos usos de R5-3, «bis») |
| L5 | EP03 Snow on Mt. Silver | 15 | R6 | R6-1…R6-15 |
| L6 | EP04 Hypno's Lullaby | 16 | R2 | R2-1…R2-16 |
| L7 | EP05 Pokémon Black | 16 | R5 (vacío) + R1 | R5-1…R5-16 + R1-4/R1-6 |
| L8 | EP06 King Unown | 16 | R4 (+ R3 como asset) | R4-1…R4-16 |
| L9 | Nexo de Ruptura | 5 | R1 | R1-6, R1-1, R1-10, R1-3, R1-4 |
| — | Antesala (hub 2040) | 1 | — | sin ficha: ventana de la Gruta 2030 (`dn:hub`) ✅ |

Orden justificado: de menos a más riesgo. R5/R6/R2 son escenas exteriores con separadores claros
(autodetección ya probada). R4 es interior con alfombra y pilares (pasajes a mano, como 2120). R1
es el caso difícil (collage glitch) y va al final, cuando el criterio de pasajes ya está rodado.

### 9.2 Preparación (una vez por sesión)

```bash
npm install                    # node_modules no persiste
npm run dn:ingest              # 96 fichas
npm run dn:tiles && npm run dn:tiles:2x
npm run dn:verify              # E2-check: 96/96 idénticas
```

Los derivados (`reference/.../slices`, `tilesets`, `content/dimensional_nightmare_tiles*.json`)
están **ignorados en git**: se regeneran con esos cuatro comandos y nunca se redistribuyen.

### 9.3 Ciclo por lote (comando a comando)

```bash
node tools/dn_propose_passability.mjs --episode <EP> --render   # muros + overlays
node tools/apply_dimensional_nightmare_maps.mjs --episode <EP> --render
node tools/apply_dimensional_nightmare_maps.mjs --verify
node tools/dn_render_sheets.mjs --episode <EP>                  # hoja de contacto
```

**Criterio de cierre por lote** (los diez puntos del checklist §4, resumidos):

1. `dn:maps:verify` en verde (mapa, tamaño, tileset, PNG, MapInfos, metadatos).
2. **BFS 100 %** en todos los mapas del lote (sin celdas transitables inalcanzables).
3. Suelo alcanzable ≥ 25 % del mapa (garantizado por el algoritmo; se revisa el número).
4. Hoja de contacto del episodio revisada en `docs/dn_referencia/lotes/<EP>.png`.
5. Ajustes de pasajes, si hacen falta, con `openRects`/`blockRects` en
   `content/dimensional_nightmare_passability.json` (mandan sobre el automático y se conservan).
6. `npm test` sin regresiones y commit del lote (herramientas + datos + hoja).

### 9.4 Artefactos: qué se versiona y qué no

- **Se versiona**: una **hoja de contacto por episodio** (`docs/dn_referencia/lotes/<EP>.png`)
  con las filas `referencia | mapa construido | overlay`, más el JSON de plan/pasajes/construidos.
- **No se versiona**: el detalle por mapa (`docs/dn_referencia/detalle/`), los recortes, los
  tilesets derivados y los PNG `DN_*.png` del juego (arte de terceros / regenerable).
- Motivo: 101 comparativas individuales suman ~30 MB; las 7 hojas, ~2 MB, y sirven mejor para
  revisar de un vistazo.

### 9.5 Riesgos del tramo y mitigación

| # | Riesgo | Lote | Mitigación |
|---:|---|---|---|
| 1 | EP05 repite fichas de EP02 (versión «vacía») | L7 | construir la escena base y resolver la variante de corrupción en E4 (tono + tiles ausentes); decisión D6 |
| 2 | R1 es un collage glitch con bordes raros | L9 | pasajes por estructura + revisión de la hoja; el Nexo admite pasillos rotos como diseño |
| 3 | R4 y R1 tienen mucho detalle «decorativo» que el algoritmo marca muro | L8/L9 | `openRects` por zonas (ya probado en 2120) |
| 4 | Mapas con <25 % de suelo tras podar | cualquiera | puenteo + suelo mínimo garantizado; si aun así queda corto, se revisa a mano el mapa |
| 5 | R3 es el **sprite del Rey Unown**, no un mapa | L8 | no se construye como mapa: se usa como asset de jefe (doc 08) |
| 6 | Presupuesto de arte de terceros | todos | los PNG `DN_*` del juego quedan **ignorados**; el pipeline lo avisa en el catálogo |
| 7 | EP05 repite las fichas de EP02 (versión «vacía») | L7 | **D6 tomada**: se construye la escena de EP02 tal cual; la corrupción («vacío», huecos negros, tono) se resuelve en E4/E5 con eventos y el sistema de tono, sin duplicar arte |

### 9.6 Criterio de cierre del tramo

- **100/100 mapas con ficha** construidos y verificados, **más el hub 2040** (101/101 del ciclo).
- `dn:maps:verify` en verde para los 101 y `dn:pasajes:verify` al día.
- 8 hojas de contacto en `docs/dn_referencia/lotes/` (una por episodio + HUB).
- `npm test` y `verify:all` sin regresiones.
- Doc 12 y `content/dimensional_nightmare_maps_built.json` al día; commit y push al PR #12.

**Lo que NO entra en este tramo**: eventos, NPCs, jefes y anomalías (E4); variantes de corrupción
por fase (E5); las conexiones y los eventos del hub 2040 (E4); empaquetado (E6).

---

## 10. Plan de elaboración E4–E6 (sobre los 100 mapas construidos)

Con E3 cerrado (100/100 mapas), el objetivo del tramo es **que los mapas sean jugables**:
recorribles en cadena, con sus NPCs, sus anomalías contadas, sus jefes sellables y su instalación
verificada. Orden: conexiones → NPCs → eventos clave → jefes → verificación → instalación.

**Estado (2026-10-01): E4a–E4d CERRADO, con la fase B de los 6 jefes instalada.** Episodios completos
(EP01–EP06 + NEXO) con conexiones bidireccionales, 80 NPCs, **77 anomalías** (las 12/13/12/13/13/14
del §5 de cada doc), 121 entradas de evento del índice y 6 jefes con sello. `dn:events:verify` y `dn:maps:verify` en verde y
hojas de revisión `docs/dn_referencia/eventos/<EP>.png`. Lo pendiente (fase B de cada jefe,
trainers `DN_*`, objetos `DN_*`) queda anotado por mapa en `events_built.json → pending`.

### 10.1 E4a — Conexiones (transfers)

**Problema**: los mapas son escenas sueltas; sin transferencias no hay episodio.

**Solución implementada**: la malla sale de `content/dimensional_nightmare_passability.json`
(`open` + `openRects` como **suelo curado**, `computed`/`blocked` como bloqueo). El instalador:

1. encadena los mapas del episodio en orden (`2041 → 2042 → … → 2056`) tomando una salida
   inferior/derecha del mapa N y la primera celda transitable del borde opuesto del mapa N+1;
2. crea la transferencia de **ida en el borde** y la de **vuelta** en el mapa siguiente,
   con dirección coherente (2 abajo, 8 arriba, 4 izquierda, 6 derecha);
3. conecta la **entrada del episodio** con la Gruta de los Testigos (`Map2030`, 36,12) y la
   **salida final** (mapa del jefe) con el mismo punto;
4. deja constancia en `content/dimensional_nightmare_events_built.json` (una entrada por mapa con
   `entry`, `exit`, recuento de eventos/NPCs, jefe y `pending`).

**Criterio (cumplido)**: `dn:events:verify` confirma 100 mapas con eventos, que cada transferencia
apunta a un mapa existente y a una celda transitable (o al hub), y que no hay dos eventos en la
misma celda.

**Decisión D7 — celda del hub**: el GDD citaba la Gruta de los Testigos en `(34,12)`/`(34,14)`, pero
tras el rebuild del Monte Silver esa columna es roca. El instalador resuelve la celda transitable
más cercana → **`Map2030 (36,12)`** (el corredor real de la gruta), y los docs 01, 07 y 12 quedan
alineados con ese punto.

**Decisión D8 — entradas y salidas sobre el suelo, no sobre el muro**: el anillo exterior de estos
mapas es banda de muro (transitable para el motor en varios tiles). Las celdas de llegada/salida se
puntúan dando prioridad al **suelo curado** (`open`/`openRects`) y penalizando el anillo exterior,
para que el jugador aparezca en el piso y no caminando sobre la pared.

### 10.2 E4b — NPCs

**Fuente**: tablas «NPCs por mapa» de los docs 01–06 (mapa · nombre · tipo · sprite · notas).

**Instalación**: por NPC, un evento con
- gráfico = sprite declarado (se verifica que exista en `Graphics/Characters`; si no, se intenta
  un sustituto razonable — `SWIMMER_M` → `trainer_SWIMMER_M` — y, en último caso, `trchar000` con
  aviso). Las celdas-placeholder del GDD («Sprite R3», «(sin sprite)», «(imagen fija)») dejan el
  NPC **sin gráfico** y se anotan como arte pendiente: nunca se disfraza al Rey Unown de aldeano;
- colocación en una celda transitable libre cercana a la entrada del mapa (el instalador recorre
  espiral y evita celdas ocupadas);
- páginas por tipo, siguiendo el GDD: **Normal** = una página por fase (v266 ≥ 1/4/6 según
  disponibilidad de diálogo, con el texto de las notas), **Consciente** = una página + una segunda
  condicionada a fase ≥5 donde desaparece (evento vacío), **Interdimensional** = una página con la
  frase fija de las notas (que se completa en E5 con el guion final).

### 10.3 E4c — Eventos clave y anomalías

**Fuente**: §4 «Eventos programables» de los docs 01–06 (nombre · mapa(s) · disparador) + doc 10
(switches 882–902, variables 265–276, los 7 eventos comunes 900–906).

**Instalación**: un evento por entrada del índice, colocado en las celdas que el doc declara
(`(5,5)`, `12,28`…) o junto a la entrada si no las declara, con el disparador que corresponda
(Autorun = `@trigger 1`, Pisar = 1 con `@through`, Interactuar = 0) y la lista de comandos mínima:

- **anomalías**: una por ficha del §5 de cada doc (`ANOM_Axx`), en su celda declarada y con su
  tipo: `v2xx += 1`, `v274 += 1` (tope 77), cada 3 → `v265 += 1` (con tope) y switch de cuota
  `896+(v2xx-268)` al llegar al total — patrón del CE 902 escrito en línea para no depender de que
  el CE esté registrado. Las de tipo **visual** añaden un glitch de tono breve y reversible
  (`pbToneChangeAll` + espera + restauración, dentro de `begin/rescue`); las **auditivas** quedan
  marcadas como pendientes hasta que existan los archivos de música alterada;
- **objetos**: `pbItemBall(:CLAVE)` con el ítem del doc 06 de cada episodio (prefijo `DN_`);
- **guardado/curación**: evento de fogata/cabaña con `pbPokemonFossil`-free → curación por guion
  (`pbHealAll`), sin tocar partidas;
- **sellos y grietas**: switches 883–889 y 890–895 según doc 10.

### 10.4 E4d — Jefes

Por episodio, el instalador escribe en el mapa del jefe (último del rango):

1. **Página 1** (sin condiciones): presentación + batalla de fase A con `canLose` si el doc declara
   dos fases (`pbTrainerBattle(PBTrainer.new(:CLAVE, "NOMBRE"), false, "", true)`);
2. **Página 2** (condición `self-switch A`): el jefe ya no está, con el texto de la página 2 del
   doc 10;
3. **Fase B (implementada)**: los pasos de escenario del §9 — 4 cadenas (EP01), 4 fotos (EP02),
   4 fogatas (EP03, en 2073/2075/2078/2082), 4 cunas (EP04), 4 rendijas (EP05) y 7 letras (EP06) —
   como eventos interactivos (`BOSSB_<EP>_n`) con switch propio (910+) y contador `v277`. **El
   sello lo enciende el último paso**, no la batalla: es la mecánica que el GDD pide («no puedes
   golpearlo: golpea lo que lo sostiene»). Las celdas que el GDD cita para mapas de 40×40 se
   reubican en el suelo más cercano de la ficha real (los mapas son de 30×24/15×11…) y cada
   reubicación queda como aviso;
4. **Sello**: `sw88x = ON` + `v265 += N` (tope 100) + recompensa única (objeto `DN_*`) + grieta;
5. **Salida**: transferencia al hub tras sellar.

Los trainers de la fase A (`DN_EPxx_A`) y los objetos de recompensa ya están **registrados de
verdad**: `apply_dimensional_nightmare_battles.mjs` añade los 6 entrenadores a `trainers.dat` (con
los equipos del §9) y los objetos `DN_PAGE_01`…`DN_PAGE_06`/`DN_ANCLA` a `items.dat` junto con su
icono 48×48 en `Graphics/Items/` (sin icono, la mochila puede fallar). La llamada de batalla sigue
protegida con `begin/rescue` y el catálogo marca `pending` lo que aún no existe (p. ej. el combate
espejo real del EP05).

### 10.5 E5 — Verificación

**Corrido el 2026-10-01:** `dn:events:verify` (100 mapas, celdas transitables, cuota de anomalías) y
`dn:battles:verify` (trainers, objetos, iconos y pasos de fase B) en verde; `verify:defeats`
(1 629 batallas en 718 eventos, 685 con derrota permanente y 64 revanchas por menú), 
`verify:event-collision` y `npm test` (authoring, tone safety, integridad de paquete) también.
Queda pendiente la QA manual en `Game.exe` (B3) y las variantes de corrupción por fase, ya
planificadas en el doc 13 §F3b (tono + huecos deterministas + overlays, sin duplicar mapas)
con su puerta de calidad y el pendiente B7 del backlog de cierre.

- `dn:events:verify` (**en verde**, 100 mapas): transfers a mapas existentes y celdas transitables,
  eventos dentro de límites, sin colisión de eventos en la misma celda, switches ≥882 (rango
  reservado) y lectura **sin reescribir** los mapas.
- Re-ejecutar `dn:maps:verify` (los eventos no deben alterar tiles ni pasajes).
- Hoja de contacto por episodio actualizada (los NPCs y eventos se ven en el overlay).
- `verify:defeats` y `verify:event-collision` del repo en verde.

### 10.6 E6 — Instalación y empaquetado

- Backups ya en `PokeModBackups/dimensional_nightmare_maps_originals/` (Tilesets, MapInfos,
  map_metadata, mapas 2039–2140): el instalador de E4 escribe con copia previa por mapa.
- `verify:package` y `build:package` sin regresiones (los PNG `DN_*` no se empaquetan).
- QA manual en `Game.exe`: recorrer EP01 completo de un tirón (10 puntos del checklist §4) y
  anotar en `docs/ESTADO_CONTENIDO_Y_PROMPTS.md`.

### 10.7 Entregables y criterio de cierre del tramo

| Entregable | Estado | Dónde |
|---|---|---|
| Conexiones de los 6 episodios + Nexo | ✅ 200 transferencias | `Map2xxx.rxdata` + `content/dimensional_nightmare_events_built.json` |
| NPCs (todos los de las tablas del GDD) | ✅ 80 instalados | idem |
| Anomalías del §5 | ✅ 77 (12/13/12/13/13/14) | `ANOM_Axx` en su mapa y celda | 
| Eventos clave del índice | ✅ 121 entradas | idem |
| 6 jefes con fase B (no se ganan a golpes) + sello | ✅ 6 (4+4+4+4+4+7 pasos) | `BOSSB_*` + switch del sello |
| Trainers de jefe y objetos `DN_*` | ✅ 6 trainers + 6 objetos (con icono) | `trainers.dat`, `items.dat`, `Graphics/Items/` |
| Verificación | ✅ `dn:events:verify` + `dn:maps:verify` | verde |
| Revisión | ✅ 7 hojas `docs/dn_referencia/eventos/<EP>.png` | versionadas |

### 10.8 Resultado real por episodio (2026-10-01)

| Episodio | Mapas | NPCs | Anomalías | Eventos de índice | Transferencias | Jefe |
|---|---|---|---|---|---|---|---|
| EP01 White Hand | 16 | 16 | 12 | 24 | 32 | LA MANO BLANCA (2056) |
| EP02 Lost Silver | 16 | 14 | 13 | 18 | 32 | EL SIN NOMBRE (2072) |
| EP03 Snow on Mt. Silver | 15 | 13 | 12 | 19 | 30 | EL CAMINANTE (2087) |
| EP04 Hypno's Lullaby | 16 | 13 | 13 | 24 | 32 | LA NANA (2103) |
| EP05 Pokémon Black | 16 | 9 | 13 | 14 | 32 | EL JUGADOR 000 (2119) |
| EP06 King Unown | 16 | 15 | 14 | 17 | 32 | KINGGUS (2135) |
| NEXO | 5 | — | — | — | 10 | — |
| **Total** | **100** | **80** | **77** | **121** | **200** | **6** |

Fase B por jefe (implementada en `apply_dimensional_nightmare_battles.mjs`, con switch propio 910+ y
contador `v277`): EP01 **4 cadenas** · EP02 **4 fotos** · EP03 **4 fogatas** (2073/2075/2078/2082) ·
EP04 **4 cunas** · EP05 **4 rendijas** · EP06 **7 letras**. El sello lo enciende el último paso, no la
batalla. Pendiente de arte/guion: el combate espejo real del EP05 (hoy usa equipo fijo equivalente),
la forma final del EP06 (equipo 120–125 propuesto) y las pistas de audio alterado de las anomalías
auditivas.

Avisos que quedan en el catálogo (no rompen nada): `trchar052` no existe en `Graphics/Characters`
(4 NPCs usan `trchar000`), `EV_HYP_Silenciador` no declara mapa en el GDD (se instala en el mapa del
jefe) y el arte de KINGGUS/Mano Blanca sigue pendiente (doc 08).

**NO entra**: guion definitivo de cada diálogo (los textos salen de las notas del GDD y se pulen en
la pasada de QA), los eventos del hub 2040 (el mapa ya está construido con `dn:hub`), y el arte
nuevo del Rey Unown / Mano Blanca (lista del doc 08).

---

### 10.9 Cierre E6 (2026-10-02)

El tramo de cierre se ejecutó con su propio plan (`13_PLAN_DE_CIERRE.md`, fases F0–F5). Resultados:

| Pieza | Estado | Comprobación |
|---|---|---|
| Verificación integrada | ✅ `dn:verify:all` (plan · mapas · pasajes · eventos · jefes · hub · hub de eventos) | verde |
| Hub 2040 jugable | ✅ 9 eventos en la Antesala + 1 en la Gruta (36,11) | `dn:hub:events:verify` |
| Arte prioridad ALTA (doc 08) | ✅ 7 assets propios + cableado (tipo `DN_KINGGUS`, gráficos de jefe) | `dn:art:verify` |
| Empaquetado | ✅ `verify:package` OK (30 archivos, 3067 KB), `npm test` verde | — |

**Hub jugable** (`tools/dn_build_hub_events.mjs`, `npm run dn:hub:events`): la Antesala de las
Grietas (2040) reparte las seis grietas por el perímetro — EP01 (0,0) · EP02 (27,4) · EP03 (0,18) ·
EP04 (27,19) · EP05 (16,0) · EP06 (8,1) — con página sellada (texto) y página abierta
(`v264 ≥ 3` para EP01–EP03, `≥ 7` para EP04–EP06) que transfiere al primer mapa del episodio; más
`HUB_ARCHIVERO` (12,22), `HUB_PROGRESO` (18,12, lee sellos/resonancia/anomalías) y `HUB_SALIDA`
(13,22 → Gruta). La entrada se abre en la Gruta de los Testigos con `HUB_GRIETA_CAVE` (36,11,
`v264 ≥ 3`). Las celdas se calculan sobre la malla real del mapa y se registran en
`content/..._events_built.json` → `hubMap` / `hubCave`; la hoja `docs/dn_referencia/lotes/HUB_2040.png`
marca cada celda para revisión.

**Arte ALTA** (`tools/dn_install_art.mjs`, `npm run dn:art`): los originales viven en
`reference/dimensional_nightmare/art_src/` (arte propio, fondo magenta); el instalador recorta,
reduce por media de área, cuantiza a ≤32 colores y escribe los 7 PNG (Front/DN_KINGGUS 64×64,
Front/DN_KINGGUS_FINAL 64×64, Trainers/DN_KINGGUS 128×128, Characters/DN_KINGGUS 128×128,
Characters/DN_WHITE_HAND 384×384, Pictures/DN_WHITE_HAND 96×96, Items/DN_UNOWN_FRAGMENT 48×48,
manifest en `content/dimensional_nightmare_art.json`), da de alta el tipo de entrenador
`DN_KINGGUS`, migra el registro del jefe de EP06 y le pone gráfico a `NPC_KINGGUS` (2135) y a
`EV_EP01_JEFE` (2056). Vista previa: `docs/dn_referencia/arte/preview_arte.png`.

**Empaquetado**: el ZIP de `Scripts_corregido/` corresponde a la línea «Ruta de Dios» y **no**
incluye el contenido DN (ni sus tilesets derivados de los mosaicos); sigue verificado sin
regresiones. Decidir si el Nightmare se distribuye en un paquete propio es un pendiente de
diseño, no un bloqueo técnico.

### 10.10 Tramo M2 — medallas, sensaciones y Liga Oscura (2026-10-02)

Capa nueva, en paralelo del mundo Atlas (doc `14_MEDALLAS_LIGA_OSCURA_Y_SENSACIONES.md`):

| Pieza | Estado |
|---|---|
| Medallas y cartucheras (`Badges of <mundo>`) | ✅ 14 objetos + 6 pedestales del Sello |
| Sensación por mundo | ✅ 212 transferencias en 103 mapas con su tono de pantalla |
| Liga Oscura (2141 Pórtico · 2142 Coliseo) | ✅ construidos, BFS 100 % |
| Mad Pikachu (255 → 150 por Arceus) | ✅ arco de 5 etapas + 3 ramas + trainer `MADPIKA` nv 150 |
| Mundos nuevos W7–W9 | 📋 plan (necesitan mosaico de referencia) |

```bash
npm run dn:build:all     # hub → medallas → liga → sensaciones
npm run dn:verify:all    # todo el ciclo + lo nuevo
```

### 10.11 Mosaicos de referencia de la recreación (E7, 2026-10-02)

El usuario entregó las crepypastas como siete mosaicos de fichas. `tools/dn_render_recreacion.mjs`
devuelve el gesto con el material construido: una hoja por episodio (rejilla, separadores y rótulo
como los mosaicos originales) donde cada celda enfrenta **ficha de la crepypasta · mapa instalado ·
transitabilidad** (verde = alcanzable desde la entrada, ámbar = transitable aislado, rojo = muro,
según `content/dimensional_nightmare_passability.json`). Cierra con un mosaico general de los 101
mapas en el orden del GDD.

| Pieza | Salida |
|---|---|
| Hojas por episodio | `docs/dn_referencia/recreacion/<EP>.png` (HUB · EP01–EP06 · NEXO) |
| Mosaico general | `docs/dn_referencia/recreacion/00_MOSAICO_GENERAL.png` (101 mapas, 2040–2142) |
| Índice con ficha, tileset, tamaño, tiles y BFS por mapa | `docs/dn_referencia/recreacion/INDICE.md` |
| Detalle suelto por mapa | `docs/dn_referencia/recreacion/detalle/<id>_mosaico.png` (ignorado; se regenera) |

```bash
npm run dn:mosaicos              # todas las hojas + mosaico general + índice
node tools/dn_render_recreacion.mjs --episode EP01
node tools/dn_render_recreacion.mjs --only 2041,2042
npm run dn:mosaicos:check        # índice e imágenes presentes (entra en dn:verify:all)
```

Los mosaicos son la evidencia visual versionada de la fidelidad B: cualquier mapa que se salga de su
ficha se ve de inmediato en la celda correspondiente. Las hojas de `lotes/` (E5) siguen siendo el
detalle de la comparación con overlay, y `recreacion/` es la vista de presentación del conjunto.
