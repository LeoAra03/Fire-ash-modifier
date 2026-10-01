# POKÉMON FIRE ASH — DIMENSIONAL NIGHTMARE
## GDD funcional · Documento maestro (v1.0)

> **Coherencia con el proyecto.** Este GDD es una **expansión aditiva** de la capa ya instalada
> «Fire Ash: A Través del Multiverso — Emisiones Prohibidas del Monte Silver»
> (`content/multiverse_creepypasta.json`, Map2021–2030, sellos, contador v264).
> No reescribe nada de lo existente: **añade** una segunda profundidad, el *Dimensional
> Nightmare*, detrás de las siete emisiones.
>
> Los siete recursos visuales entregados (R1–R7) se catalogan y asignan en
> `11_ASIGNACION_DE_RECURSOS.md`.

---

## 0. Resumen ejecutivo

| Campo | Valor |
|---|---|
| Nombre | Pokémon Fire Ash: **Dimensional Nightmare** |
| Tipo | Expansión postgame narrativa (6 episodios + nexo final) |
| Motor | RPG Maker XP + Pokémon Essentials v19 (Fire Ash 3.7.1) |
| Protagonista | **Ash** — anomalía externa que entra en mundos cerrados |
| Regla de oro narrativa | Cada universo **conserva su canon interno intacto**; Ash es el intruso |
| Herramienta central | **Rotom de Tiempo** (detector dimensional) |
| Sistemas originales | Resonancia (0–100) · 7 Fases de Corrupción · Anomalías · Registro Dimensional |
| Mapas nuevos | `Map2040`–`Map2140` (101 mapas; rango 2039+ verificado libre) |
| Flags nuevas | Switches `882`–`902` · Variables `265`–`276` (verificado libre: switches usados hasta 881, variables hasta 264) |
| Prerrequisito | `v264 ≥ 3` (emisiones selladas del Monte Silver) para EP01–EP03; `v264 = 7` para EP04–EP06 y el Nexo |
| Assets | 100 % jugable con tiles/sprites/species **existentes**; el arte nuevo (R3 y derivados) es mejora opcional — ver `08_SPRITES_Y_ASSETS.md` |
| Tono | Terror atmosférico y misterio. Sin gore explícito, sin contenido auto-dañino, sin copiar textos de las obras originales: **homenajes reinterpretados con voz propia** (regla ya vigente del repo) |

---

## 1. Filosofía de diseño

### 1.1 Ash como anomalía externa
Ash **no pertenece** a ninguno de estos mundos. No es un elegido, no es el héroe profetizado:
es una *interferencia*. Los mundos creepypasta llevan décadas cerrándose sobre sí mismos; la
entrada de Ash **los desestabiliza**. Por eso:

- Los NPCs locales **nunca** reconocen a Ash como salvador: lo tratan como una grieta andante.
- El canon de cada historia **no se corrige ni se explica**: se explora desde dentro.
- El jugador no "arregla" el pasado: **lo deja en paz** o lo *sella* para que no se derrame.
- Cada episodio termina con Ash **saliendo** del mundo y el mundo **quedándose atrás**, intacto.

### 1.2 Estructura de episodio (idéntica en los seis)
1. **Entrada**: la grieta se abre desde una puerta ya existente del Monte Silver.
2. **Descubrimiento**: mapa base en fase baja (1–2), NPCs normales, trama local.
3. **Inmersión**: fases 3–5; el Rotom empieza a medir; NPCs conscientes e interdimensionales.
4. **Ruptura**: fases 6–7; el mapa deja de parecer Pokémon (Recurso 1).
5. **Jefe**: batalla con mecánica especial (nunca solo "bajar PS").
6. **Sello y grieta**: resonancia, desbloqueo de la siguiente grieta, retorno libre.

### 1.3 Tres tipos de NPC (obligatorio en todos los mapas)
| Tipo | Qué es | Qué sabe | Diálogos |
|---|---|---|---|
| **Normal** | Habitante del mundo cerrado | Solo su rutina. Su realidad es la correcta | 5 estados de visita (`01`–`05`) |
| **Consciente** | Sabe que el mundo se repite | Sabe del bucle, no de Ash | 3 estados + 1 confesión final |
| **Interdimensional** | Ha visto a Ash antes (¿o después?) | Sabe del Rotom y de las grietas | 1 línea fija + 1 línea que cambia por fase |

**Sistema de 5 estados (NPCs normales)** — variable local de mapa `this._dnVisit` (self-switch A–E):
1. Presentación · 2. Rutina aumentada · 3. Primer indicio extraño · 4. Miedo (la fase los afecta) ·
5. Silencio: el NPC ya no responde con texto, solo mira (a partir de fase 6, muchos desaparecen).

---

## 2. El Rotom de Tiempo (mecánica central)

**Objeto clave**: `ROTOM DE TIEMPO` (key item; propuesto en `Items.rxdata`, `@key_item = true`).
**Entrada**: menú de objetos → *Usar* → llama al evento común `900 DN_ROTOM_SCAN`.

### 2.1 Niveles de sintonía (desbloqueo por Resonancia)

| Nivel | Nombre | Umbral | Qué desbloquea |
|---:|---|---:|---|
| 0 | Calibración | 0 | Reloj + brújula; el mundo se ve normal |
| 1 | **Eco** | 20 | Resalta **anomalías visuales** del mapa (contador `n/15`) y pista de la más cercana |
| 2 | **Escucha** | 40 | Detecta **anomalías auditivas**; subtitula susurros (nunca texto de las obras originales) |
| 3 | **Marcador** | 60 | Marca **objetos ocultos** con un destello una vez por mapa |
| 4 | **Sintonía** | 80 | **Traduce Unown / inscripciones** y permite *visiones* (flashbacks jugables de 1 mapa) |
| 5 | **Ancla** | 100 | El mundo **no puede borrar a Ash**: bloquea el "borrado" de NPCs y la pérdida de mapa en fase 7 |

### 2.2 Regla de Resonancia
- Sube **solo** al sellar a un jefe (+ valores de la tabla del §4) y al **registrar anomalías**
  (+1 por cada 3 anomalías registradas, tope +3 por episodio).
- **Nunca baja.** No es una barra de castigo: es una llave de acceso.
- La Resonancia **no** afecta a las batallas (nada de buffs/debuffs numéricos): es narrativa y de exploración.
- `v265 DN_RESONANCE` (0–100) · `v275 DN_ROTOM_NIVEL` (0–5, espejo para el menú).

### 2.3 Sobrecarga (sabor, nunca castigo)
Con la fase ≥ 5, el menú del Rotom puede mostrar **texto corrupto** 1 de cada 4 usos
(`String#tr` sobre vocales, glifos `▓░`), pero **jamás** bloquea un comando ni pierde datos.
[Nota para desarrollador: la sobrecarga es puramente cosmética; implementar con `@windowskin`
alternativo `DN_GLITCH`, no con fallos reales.]

---

## 3. Las 7 Fases de Corrupción (sistema común)

Cada mapa del Nightmare tiene una fase activa `v266 DN_PHASE` (1–7). La fase sube por hitos de
episodio (no por tiempo) y se refleja con **4 canales**: tinte (`Tone`), clima, tiles, y eventos.

| Fase | Nombre | Tinte (`Tone.new`) | Clima | Tiles / eventos | Uso de recursos |
|---:|---|---|---|---|---|
| 1 | Normal | `(0,0,0,0)` | el del mapa | Mapa base intacto | R7/R5/R6/R2 según episodio |
| 2 | Desaturación | `(-30,-30,-30,60)` | sin cambio | 1–2 tiles cambiados por mapa | Base + variante gris |
| 3 | Primer eco | `(-40,-35,-20,90)` | `Fog` púrpura tenue | Objetos movidos ±1 celda | Base + R2 (niebla) |
| 4 | Inversión | `(-60,-50,-20,120)` | `Fog` densa | Rutas reordenadas; pasajes que cierran | Base + elementos del episodio anterior |
| 5 | Presencia | `(-80,-60,-30,150)` | clima del mapa forzado | NPCs desaparecen al reentrar; siluetas | Base + R7 (raíces/criptas) |
| 6 | Sepultamiento | `(-110,-90,-60,190)` | `Storm`/`Snow`/`Fog` extremo | Tiles corruptos aislados; **R1** irrumpe | Base + **R1** (bloques de código) |
| 7 | **Ruptura** | `(-160,-140,-120,240)` | glitch | El mapa **deja de parecer Pokémon**: código hexadecimal, caminar por el vacío | **R1 completo** |

[Nota para desarrollador: nunca guardar el `Tone` como string. El repo ya blindó esto con
`PokeModToneSafety` (`apply_tone_safety_fix.mjs`); usar siempre `Tone.new(r,g,b,gray)` real.]

---

## 4. Los seis universos y su Resonancia

| EP | Universo (inspiración) | Recurso base | Mapas propuestos | Resonancia al sellar | Umbral que desbloquea |
|---:|---|---|---|---:|---|
| 01 | **White Hand / Buried Alive** | R7 (16) | 2041–2056 | **+12** | Eco (20) tras EP02 |
| 02 | **Lost Silver** | R5 (16) | 2057–2072 | **+10** | Escucha (40) tras EP04 |
| 03 | **Snow on Mt. Silver** | R6 (15) | 2073–2087 | **+12** | — |
| 04 | **Hypno's Lullaby** | R2 (16) | 2088–2103 | **+14** | Marcador (60) tras EP05 |
| 05 | **Pokémon Black** | R5+R1 (16) | 2104–2119 | **+16** | Sintonía (80) tras EP06 |
| 06 | **King Unown** | R4+R3 (16) | 2120–2135 | **+18** | **Ancla (100)** con el Nexo |
| — | **Nexo de Ruptura** (cierre) | R1 (5) | 2136–2140 | +18 | 100 → Ancla |
| — | Antesala de las Grietas (hub) | — | 2040 | — | Entrada del Nightmare |

**Total acumulado:** 12+10+12+14+16+18 = **82** + hasta 18 por anomalías (6×3) + 18 del Nexo = **100 exacto**.
Diseño intencional: el jugador que registra anomalías y sella los seis jefes ve **Ancla** justo antes del Nexo.

---

## 5. Anomalías (sistema)

- **Cuota**: mínimo 10, máximo 15 por universo (este GDD entrega 12/13/12/13/13/14).
- **Tipos**: visuales (objetos que cambian de lugar), auditivas (música que cambia o se detiene),
  temporales (NPCs que desaparecen al reentrar), espaciales (rutas que no coinciden).
- **Registro**: cada anomalía avistada se anota con el Rotom (nivel Eco o superior) en
  `v267–v273 DN_EP0X_ANOMALIAS` y suma al cómputo global `v274`.
- **Recompensa de cuota**: completar las anomalías de un episodio enciende `sw896–sw901`
  y hace que el **Archivero Prohibido** (Monte Silver, mapa 2030) abra una página extra.
- **Plantilla de ficha** (usada en cada episodio):

```
[A##] NOMBRE — Tipo: visual/auditiva/temporal/espacial
  Ubicación: MapXXXX — celda (x,y) [mapa base: Rn-fila,col]
  Cuándo: fase ≥ N / al reentrar / con Rotom nivel ≥ N
  Qué se ve · Qué se oye · Qué cambia
  Documentarla: acercarse y usar el Rotom (1 vez)
```

---

## 6. Registro Dimensional (formato `#A0xx`)

Toda entidad anómala entra en el **Registro Dimensional** del Rotom, con ficha normalizada:

```
#A0## — NOMBRE
Universo: EP0X — <universo>
Clasificación: ANOMALÍA <clase>   Tipo de batalla: ??? (interno)
Capturable: NO | CONDICIONAL (<condición>)
Aparece en: MapXXXX (celda x,y) — fase ≥ N
Descripción: 2 líneas, voz propia.
Riesgo: bajo/medio/alto (siempre recuperable; nada irreversible)
```

Las entidades **no capturables** nunca pueden guardarse en la caja: si el jugador lo intenta,
el Rotom imprime `«NO ES UN POKÉMON. ES UN TESTIMONIO.»`.
Las entidades **capturables condicionales** se registran como especies existentes con
`@form`/`@nickname` alterado y un icono distinto (ver §9).

---

## 7. Integración técnica con el repo

### 7.1 Puntos de anclaje (ya existentes)
| Elemento | Dónde | Uso en el Nightmare |
|---|---|---|
| `Map2030` Gruta de los Testigos | Monte Silver | Las 7 puertas de niebla; la 8.ª puerta (sellada) abre el Nightmare |
| `Map2022` Cumbre | Monte Silver | La grieta se manifiesta aquí tras EP01 |
| `v264` contador de emisiones | multiverso v1 | Prerrequisito: `≥3` EP01–03, `=7` EP04–06 y Nexo |
| `sw701–703` misión Hypno | contenido v1 | Prerrequisito narrativo de EP04 (`sw703` = niños rescatados) |
| Archivero Prohibido | 2021/2030 | Archiva las anomalías completadas; entrega el Rotom de Tiempo |
| `sw429` postgame | v1 | El Nightmare vive dentro del postgame ya existente |

### 7.2 Bloques nuevos propuestos (verificados libres)
- **Mapas**: `2040`–`2140` (MapInfos.rxdata llega hoy a `2038`).
- **Switches**: `882`–`902` (el juego usa hasta `881`).
- **Variables**: `265`–`276` (el juego usa hasta `264`).
- Detalle completo, con nombres y comandos RMXP: `10_EVENTOS_Y_FLAGS.md`.

### 7.3 Reglas de oro heredadas (obligatorias)
1. `canLose` en **todas** las batallas; curación a un paso.
2. **Derrota permanente** del jefe al ganar: self-switch + sello + página de registro. No vuelve a atacar.
3. **Revancha solo por menú** («Revancha / Luego»), nunca forzada.
4. **Recompensa única** por primera victoria; sin duplicar objetos ya entregados por el v1.
5. Equipos ≤ 6 Pokémon; niveles **100–125** (tope del juego: 150; Arceus 200 sigue siendo la única excepción).
6. Mochila libre en batalla (patch global ya instalado).
7. Sin partidas: el Nightmare **jamás** escribe `Save*.rxdata`/`Game.rxdata`.
8. Tiles, sprites, especies, tipos de entrenador y objetos **existentes** por defecto; el arte nuevo es opcional.

### 7.4 Flujo de trabajo de implementación (siguiendo la casa)
```bash
# 1. Autoría del catálogo (este GDD → JSON)
npm run create:dimensional_nightmare     # tools/create_dimensional_nightmare.mjs
# 2. Instalación aditiva sobre los datos compilados
npm run apply:dimensional_nightmare      # tools/apply_dimensional_nightmare.mjs
# 3. Verificación (estructura, derrota permanente, canLose, recompensas, IDs libres)
npm run verify:dimensional_nightmare
# 4. QA manual
docs/QA_MANUAL_PLAYTEST.md  → Sección F (Nightmare)
```
[Nota para desarrollador: los scripts `create_*`/`apply_*` no existen aún; este GDD es su
especificación. El catálogo de datos propuesto ya está en `content/dimensional_nightmare.json`.]

---

## 8. Seguridad de tono (obligatoria)

- Los originales de estas creepypastas abordan muerte, pérdida y obsesión. Este proyecto
  **conserva la atmósfera** (soledad, niebla, silencio) y **elimina** cualquier contenido gráfico,
  auto-dañino o instrucción peligrosa.
- No se copian textos, canciones ni personajes ajenos: personajes **reinterpretados** con voz propia
  (p. ej. «el entrenador sin nombre» en lugar del nombre ajeno).
- El juego **nunca** castiga al jugador de forma irreversible: no hay pérdida de partida,
  no hay Pokémon borrados, no hay "corrupción" real de archivos.
- Los sustos son de **atmósfera y audio**; el "glitch" es estético (R1) y siempre reversible.

---

## 9. Entregables de este GDD

| Archivo | Contenido |
|---|---|
| `00_MASTER_GDD.md` | Este documento |
| `01_EP01_WHITE_HAND.md` … `06_EP06_KING_UNOWN.md` | Los seis episodios completos (fases, NPCs, eventos, anomalías, objetos, entidades, música, jefe, conexión) |
| `07_MAPA_DE_FLUJO.md` | Nexo de Ruptura + mapa de flujo general Kanto/Monte Silver + epílogo |
| `08_SPRITES_Y_ASSETS.md` | Sprites faltantes con fichas técnicas (64×64 frontal/trasero, 32×32 overworld) |
| `09_REGISTRO_DIMENSIONAL.md` | Entradas `#A001`–`#A0xx` de todas las entidades |
| `10_EVENTOS_Y_FLAGS.md` | Switches, variables, eventos comunes y comandos RMXP listos para copiar |
| `11_ASIGNACION_DE_RECURSOS.md` | Los 7 recursos: catálogo de sus 16/15 mapas con destino, tileset y propósito |
| `content/dimensional_nightmare.json` | Catálogo de datos propuesto para `create_*`/`apply_*` |

---

*Fin del documento maestro. Los episodios priorizados en la entrega original fueron 01, 02, 03,
04, 05 y 06, en ese orden.*
