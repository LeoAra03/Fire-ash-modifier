# PLAN DE ELABORACIÓN — Tramo de cierre del Dimensional Nightmare

## Del contenido construido al paquete jugable (E5 → E6)

> **Qué resuelve este documento**: los tramos E1–E4 ya están hechos (101 mapas, 100 con
> eventos, 6 jefes, 77 anomalías, 80 NPCs, 200 transferencias y las verificaciones en verde).
> Este plan ordena **lo que falta para que el Nightmare quede cerrado**: verificación
> integrada, el hub jugable, el arte de prioridad ALTA, el empaquetado y la documentación de
> cierre. Cada fase tiene una **puerta de calidad** verificable por comando.

---

## 1. Estado de partida (línea base medida)

| Pieza | Estado | Comprobación |
|---|---|---|
| Mosaicos → fichas (E1) | ✅ 96/96 | `npm run dn:check` + `dn:ingest` |
| Tilesets derivados ×1 y ×2 (E2) | ✅ 25 852 tiles ×2 | `dn:tiles` · `dn:tiles:2x` |
| Pixel-identidad (E2-check) | ✅ 96/96, 0.0000 % | `dn:verify` |
| Mapas del ciclo (E3) | ✅ **101** (100 fichas + hub 2040) | `dn:maps:verify` |
| Segundo anillo W7–W9 (E8) | ✅ **48** mapas (2143–2190) con hojas origen R8–R10 | `dn:plan:check` · `dn:mosaicos:origen:check` |
| Pasajes revisables | ✅ al día | `dn:pasajes:verify` |
| Eventos, NPCs, anomalías, jefes (E4) | ✅ 100 mapas · 80 NPCs · 77 anomalías · 6 jefes | `dn:events:verify` · `dn:battles:verify` |
| Hub 2040 (mapa) | ✅ construido (ventana de la Gruta) | `dn:hub:verify` |
| Hub 2040 (eventos) | ❌ **pendiente** | — |
| Arte prioridad ALTA (doc 08) | ❌ **pendiente** | — |
| Empaquetado E6 | ⏳ por correr | `verify:package` |

**Los números del ciclo (primer anillo)**: 101 mapas (2040–2140) · 200 transferencias · 80 NPCs · 77 anomalías ·
121 eventos de índice · 6 jefes con fase B · 6 trainers + 6 objetos `DN_*`.

---

## 2. Objetivo del tramo

Dejar el Nightmare **cerrado y reproducible de punta a punta**:

1. que un solo comando compruebe todo lo construido (sin depender de que alguien recuerde los
   seis `dn:*:verify`);
2. que el **hub sea jugable** (hoy es un mapa sin eventos: no se puede entrar, ni elegir grieta,
   ni salir);
3. que los **jefes tengan su arte** (hoy el EP06 pelea con el sprite genérico de GENTLEMAN y la
   Mano Blanca no se ve sobre el altar);
4. que el **paquete** se genere y verifique con las reglas de derechos ya decididas;
5. que quede **documentado** qué falta y cómo se cierra.

---

## 3. Fases y puertas de calidad

```
F0 rehidratar ─► F1 verificación integrada ─► F2 hub jugable ─► F3 arte ALTA ─► F4 paquete ─► F5 cierre
     ✅                (script dn:verify:all)      (eventos 2040)     (5 assets)     (E6)      (docs)
```

| Fase | Entregable | Puerta de calidad |
|---|---|---|
| **F0** Rehidratación | derivados regenerados (`ingest` → `tiles` ×2) | los seis `dn:*:verify` en verde |
| **F1** Verificación integrada | `npm run dn:verify:all` + incluido en `verify:all` | un comando, todo el ciclo comprobado |
| **F2** Hub jugable | eventos de 2040 + entrada en 2030 (`tools/dn_build_hub_events.mjs`) | `dn:hub:verify` ampliado: 6 grietas, entrada/salida y transfers a celdas transitables |
| **F3** Arte ALTA | `tools/dn_install_art.mjs` + 5 assets del doc 08 en `Graphics/` | `dn:art:verify`: tamaños, alfa, paleta ≤32 y referencias (trainer type + eventos) resueltas |
| **F4** Paquete E6 | `build:package` + `verify:package` | sin regresiones; el arte derivado de mosaicos sigue fuera |
| **F5** Cierre documental | doc 12 al día + este doc con resultados + `ESTADO_CONTENIDO_Y_PROMPTS.md` | estado «instalado» y pendientes listados |

### F2 — Qué eventos lleva el hub (y por qué)
El GDD sitúa la entrada del Nightmare en la **Gruta de los Testigos (2030, celda 36,12)** y la
Antesala (2040) como reparto de las nueve grietas:

| Evento | Dónde | Comportamiento |
|---|---|---|
| `DN_GRIETA` | 2030 (36,12) | Entra a 2040; requiere `sw882 DN_UNLOCKED` |
| `HUB_SALIDA` | 2040 (borde inferior) | Vuelve a 2030 (36,12) |
| `HUB_ARCHIVERO` | 2040 (junto a la salida) | NPC guía con los 5 estados de visita |
| `GRIETA_EP01…EP03` | 2040 (perímetro) | Abren con `v264 ≥ 3`; transfer a 2041 / 2057 / 2073 |
| `GRIETA_EP04…EP06` | 2040 (perímetro) | Abren con `v264 = 7`; transfer a 2088 / 2104 / 2120 |
| `HUB_PROGRESO` | 2040 (centro) | Lee sellos (`sw883–888`) y Resonancia (`v265`) |

Las celdas se eligen **sobre el mapa ya construido** (suelo transitable, sin pisar la salida) y
cada una queda registrada en `content/dimensional_nightmare_events_built.json` → `hub`.

### F3 — Los 5 assets de prioridad ALTA (doc 08)

| Asset | Formato | Destino | Uso |
|---|---|---|---|
| `DN_KINGGUS_FRONT.png` | 64×64 battler | `Graphics/Pokemon/Front/` + trainer 128×128 | forma 1 (2135) |
| `DN_KINGGUS_FINAL_FRONT.png` | 64×64 battler | idem | forma final (7 ojos) |
| `DN_KINGGUS_OVER.png` | celda 32×32 | `Graphics/Characters/DN_KINGGUS.png` (hoja 4×4) | aparición en 2135 |
| `DN_WHITE_HAND.png` | 96×96 escena | `Graphics/Characters/` (hoja 4×4 de 96) + `Pictures/` | altar de 2056 |
| `DN_UNOWN_FRAGMENT.png` | 32×32 icono | `Graphics/Items/` (48×48 como el resto de `DN_*`) | objeto de EP06 |

**Criterio de arte**: se **genera arte original** (no se recorta del mosaico) para que sea
empaquetable; el arte derivado de los mosaicos sigue siendo material interno de desarrollo.
El instalador limpia fondo a alfa, recorta, cuantiza a ≤32 colores, escala con vecino más
cercano y **cablea** el arte: nuevo `trainer_type` `DN_KINGGUS` para el jefe de EP06 y gráficos
de los eventos `EV_EP06_JEFE` (2135) y `EV_CAT_Mano` (2056).

### F3b — Variantes de corrupción por fase (FASE 1–7)
El GDD define 7 fases de corrupción por universo. El tramo de cierre **no duplica mapas ni
arte**: la fase se resuelve con tono + huecos + overlays sobre la escena ya construida, de
modo que 103 mapas cubren 7 lecturas sin 721 variantes.

| Fase | Nombre | Tono (R, G, B, A) | Qué cambia | Anomalías activas | Música |
|---|---|---|---|---|---|
| 1 | Normal | 0, 0, 0, 0 | nada: el mundo se ve limpio | 0 | normal |
| 2 | Duda | −8, −8, −8, 0 | un NPC no responde; un objeto menor cambia de sitio | 1 | normal con un corte |
| 3 | Grieta | −24, −24, −24, 0 | primeros huecos de tile (2 % del suelo transitable) | 2 | alterada al 60 % |
| 4 | Ruido | −48, −32, −32, 0 | sprites duplicados; el mapa «respira» (scroll de 1 celda) | 3 | alterada + estática |
| 5 | Pérdida | −64, −48, −48, 0 | un NPC consciente desaparece; se apaga un sector | 4 | alterada lenta |
| 6 | Ruptura parcial | −96, −64, −64, 40 | huecos reales (5 %, paso bloqueado) y texto glitch | 5 | alterada + glitch de R1 |
| 7 | Ruptura | −128, −96, −96, 80 | silueta de R1; la salida normal se sustituye por la grieta | 6 | silencio con zumbido |

**Implementación** (una sola pieza de código, no una por mapa):

- `v266 DN_FASE_CORRUPCION` guarda la fase global (0 = fuera del Nightmare; 1–7 dentro).
  La fija el guion al cerrar anomalías/sellos; el mapa la lee al entrar.
- `PokeMod_DN_Fase` (nueva sección Ruby) aplica al entrar en un mapa `DN_*`:
  `tono_final = tono_base(dn:sensacion) + modificador(fase)`, el overlay de la fase
  (`Graphics/Pictures/DN_FASE_3/6/7.png`, tres PNG de rayas y ruido) y la lista de huecos.
- Los **huecos** son deterministas y viven en `content/dimensional_nightmare_fases.json`:
  el generador elige celdas de suelo con una máscara (celda `(x*7 + y*13 + fase) % 40 == 0`)
  y las marca sin gráfico y sin paso sólo en las fases 6–7; se revierten al restaurar el tono,
  igual que `dn:sensacion`.
- Las anomalías de las fases 2–6 se mapean a las 10–15 ya catalogadas por universo
  (`content/dimensional_nightmare.json`); la fase sólo decide cuántas están activas.
- Nada de esto entra en el ZIP: overlays y huecos se generan en el tramo de arte MEDIA (B1)
  y se verifican en local.

**Puerta de calidad**: `dn:fases:check` (a añadir con el generador) comprobará que la tabla
de 7 fases es completa, que cada mapa `DN_*` declara cómo lee la fase, que los tonos vuelven a
0 al salir y que ningún hueco cae sobre una celda obligatoria (transfers, NPCs, jefes).
Hasta que exista, la fase sólo se documenta aquí y en el doc 15 §5.

### F4 — Empaquetado y derechos
- `npm run build:package` genera `Scripts_corregido/Fire_Ash_Paquete_Directo.zip`;
- `npm run verify:package` comprueba integridad y que **no** se cuelan los PNG derivados de los
  mosaicos (`DN_2xxx.png` de tilesets) ni los recortes;
- el arte nuevo de F3 **sí** se empaqueta (es original).

---

## 4. Qué queda fuera de este tramo (backlog explícito)

| # | Pendiente | Motivo | Cómo se cierra |
|---|---|---|---|
| B1 | Arte prioridad MEDIA/BAJA (14 assets del doc 08) | no bloquea jugar | misma herramienta de F3, tanda siguiente |
| B2 | Pistas de audio alterado de las anomalías auditivas | requiere composición/edición | reemplazar los avisos `pending` del catálogo |
| B3 | QA manual en `Game.exe` (recorrido de EP01, 10 puntos) | necesita ejecutar el juego | sesión de juego + anotar en `ESTADO_CONTENIDO_Y_PROMPTS.md` |
| B4 | Combate espejo real de EP05 | hoy usa equipo fijo equivalente | definir el equipo espejo en el catálogo |
| B5 | Forma final de EP06 (equipo 120–125) | propuesta en el GDD | aprobar equipo y activar la segunda batalla |
| B6 | Guion definitivo de los diálogos | los textos salen de las notas del GDD | pasada de redacción sobre los eventos |
| B7 | Variantes de corrupción por fase (FASE 1–7) | el tramo construyó la escena base | tabla de tono + overlays + huecos deterministas y `dn:fases:check` (F3b) |

---

## 5. Resultados de la ejecución (2026-10-02)

| Fase | Estado | Evidencia |
|---|---|---|
| **F0** Rehidratación | ✅ | `dn:check` 7/7 · `dn:ingest` 96 · `dn:tiles` 6 948 · `dn:tiles:2x` 25 852 |
| **F1** Verificación integrada | ✅ | `dn:verify:all` verde (plan · mapas · pasajes · eventos · jefes · hub · hub de eventos) |
| **F2** Hub jugable | ✅ | 9 eventos en 2040 + `HUB_GRIETA_CAVE` en 2030; `dn:hub:events:verify` OK; hoja `docs/dn_referencia/lotes/HUB_2040.png` |
| **F3** Arte ALTA | ✅ | 7 assets + cableado (`DN_KINGGUS`, jefe EP06, `EV_EP01_JEFE`); `dn:art:verify` OK; `preview_arte.png` |
| **F4** Paquete | ✅ | `verify:package` OK (30 archivos) · `npm test` verde; el ZIP de «Ruta de Dios» no incluye DN |
| **F5** Cierre documental | ✅ | doc 12 §10.9 + este doc + `ESTADO_CONTENIDO_Y_PROMPTS.md` |
| **E7** Mosaicos de referencia | ✅ | 11 hojas en `docs/dn_referencia/recreacion/` (149 mapas · ficha+mapa+transitabilidad) + `INDICE.md`; `dn:mosaicos:check` en `dn:verify:all` |
| **E8** Segundo anillo W7–W9 | ✅ | hojas origen R8–R10 + 48 mapas (2143–2190) + 3 jefes con fase B + Medallas del Amo/Fosa/Silencio + Vitrina del Testigo (`DN_CASE_WIT`) |

Decisiones tomadas al ejecutar:

- **Las grietas se abren a pie**: el bloque de elección (comando 102) no se usa en ningún evento
  del proyecto; las grietas y la entrada usan «tocar el jugador» (trigger 1) con una línea de
  texto. Menos piezas móviles y coherente con el resto del contenido.
- **La entrada al hub vive en la Gruta (2030, celda 36,11)**, pegada a la celda de llegada que ya
  usaban los 200 transfers de E4 (36,12), y se abre con `v264 ≥ 3` (el switch 882 no lo enciende
  hoy ninguna herramienta; documentarlo como decisión pendiente si se quiere un candado propio).
- **El arte se genera original**, no se recorta de los mosaicos: así el ZIP que se distribuya no
  arrastra material de referencia.
- **La salida del hub es una celda distinta de la llegada** para que entrar y salir no forme bucle.

Pendientes que siguen abiertos: B1–B7 del §4 (arte MEDIA/BAJA, audio alterado, QA manual del EP01,
espejo real de EP05, forma final de EP06, guion definitivo y variantes de corrupción por fase).

## 5b. Comandos del tramo

```bash
npm install                      # dependencias de desarrollo (@napi-rs/canvas)
npm run dn:check && npm run dn:ingest && npm run dn:tiles && npm run dn:tiles:2x
npm run dn:verify:all            # F1: todo el ciclo en un comando
npm run dn:art                   # F3: procesa e instala el arte de prioridad ALTA
npm run dn:art:verify
npm run dn:hub:events            # F2: eventos del hub (entrada, grietas, archivero, salida)
npm run dn:hub:verify
npm run build:package && npm run verify:package
npm test && npm run verify:all
```
