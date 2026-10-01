# PLAN DE TRABAJO — Recreación total de los mapas del Nightmare
## De los 7 mosaicos de referencia a 101 mapas jugables en Fire Ash 3.7.1

> Estado: **plan aprobable**. La Fase 1 ya tiene su herramienta construida y probada
> (`tools/dn_ingest_reference.mjs`, selftest en verde). Las fases 2–6 se especifican aquí.

---

## 0. Qué significa "recrear en su totalidad"

Los 7 recursos son **mosaicos de imagen** (16 fichas GBA por mosaico, 15 en la montaña,
1 sprite), no mapas de RPG Maker. "Recrear en su totalidad" se traduce en **dos niveles
de fidelidad**, y hay que elegir uno antes de empezar:

| Nivel | Nombre | Qué garantiza | Qué no garantiza |
|---|---|---|---|
| **A** | **Reconstrucción guiada** (recomendado) | Composición 1:1 de cada ficha (misma distribución, mismas zonas, misma ambientación), con los **tilesets del propio Fire Ash**; 100 % jugable y distribuible | Pixel-identidad: los tiles no son los del romhack de origen |
| **B** | **Tileset adquirido del mosaico** | Pixel-identidad (se extraen los tiles del mosaico y se genera un tileset nuevo) | Regla del proyecto «solo assets existentes»; **riesgo de derechos**: los mosaicos provienen de romhacks de terceros y no se pueden redistribuir dentro del juego |
| **A+B** | **Híbrido** | A para los 101 mapas; B **solo como referencia interna de desarrollo** (nunca empaquetado) para calibrar proporciones y materiales | Igual que A en el juego publicado |

**Recomendación**: **A + B-solo-interno**. El juego se distribuye con assets propios/existentes;
las fichas sirven como patrón de medida (¿cuántos tiles mide la sala?, ¿dónde va cada prop?),
que es precisamente lo que extrae la Fase 1.

---

## 1. Estado de partida (verificado)

| Pieza | Estado |
|---|---|
| GDD funcional (12 documentos, 101 mapas, 105 eventos, 77 anomalías) | ✅ completo en `docs/DIMENSIONAL_NIGHTMARE/` |
| Catálogo de datos | ✅ `content/dimensional_nightmare.json` |
| Herramienta de ingesta de referencia | ✅ `tools/dn_ingest_reference.mjs` (selftest OK) |
| Los 7 mosaicos dentro del repo | ❌ **falta depositarlos** (los uploads del chat no persisten) |
| Reconstrucción de mapas | ⏳ depende del punto anterior |

### Bloqueo actual (Paso 0, 2 minutos de trabajo manual)
Copiar los 7 archivos a `reference/dimensional_nightmare/recursos/` con los nombres exactos
(los indica `reference/dimensional_nightmare/README.md`) y ejecutar:

```bash
npm run dn:check     # confirma que están los 7
npm run dn:ingest    # corta 96 fichas y mide cada una
```

---

## 2. El pipeline (7 etapas)

```
E0 depósito ─► E1 ingesta ─► E2 materiales ─► E3 reconstrucción ─► E4 eventos
                                                                      │
                          E6 instalación ◄─ E5 verificación ◄─────────┘
```

### E0 — Depósito de recursos ✅ manual
- **Entrada**: 7 mosaicos. **Salida**: `reference/dimensional_nightmare/recursos/*.png`.
- **Criterio de término**: `npm run dn:check` termina en 0.

### E1 — Ingesta, corte y medición ✅ *herramienta construida*
- **Herramienta**: `tools/dn_ingest_reference.mjs`.
- **Hace**: autodetecta la rejilla (separadores oscuros), recorta cada ficha, mide tamaño,
  tiles aparentes, factor de escala (×1…×4), paleta dominante, luminancia y huella 8×8
  (para detectar fichas repetidas entre recursos).
- **Salida**: `reference/dimensional_nightmare/slices/<recurso>/NN.png` + `index.json`.
- **Criterio de término**: 96 fichas y `index.json` sin avisos de rejilla.
- **Riesgo cubierto**: si un mosaico tiene rejilla distinta, `layout.json` la corrige a mano.

### E2 — Clasificación de materiales y mapa de tiles
- **Herramienta a crear**: `tools/dn_material_map.mjs`.
- **Entrada**: `index.json` + fichas + tilesets reales del juego (`Tilesets.rxdata`, PNGs).
- **Hace**, por ficha:
  1. Reduce la ficha a su rejilla de celdas (16×16 px tras aplicar el factor de escala).
  2. Clasifica cada celda en un material: `hierba, camino, tierra, agua, hielo, nieve, roca,
     muro interior, suelo interior, madera, valla, techo, vegetación, vacío, prop`.
  3. Elige el material por color medio + varianza + reglas de vecindad (una celda con
     varianza alta y borde recto suele ser muro; con varianza baja y color de agua, agua…).
  4. Escribe `content/dimensional_nightmare_materials.json`: por ficha, matriz de materiales
     y lista de props detectados (estatuas, campanas, sarcófagos, portales…).
- **Salida**: matriz de materiales por mapa + propuesta de tileset por episodio.
- **Criterio de término**: el 90 % de las celdas de cada ficha queda etiquetada; las dudosas
  se listan para revisión humana en `materials.md`.
- **Reutiliza**: `learnMaterial()` y `paintMaterial()` de `tools/lib/map_painter.mjs`, que ya
  aprenden las reglas de borde reales de los mapas del juego.

### E3 — Reconstrucción de mapas (la etapa grande)
- **Herramienta a crear**: `tools/apply_dimensional_nightmare.mjs` (patrón exacto de
  `apply_monte_silver_rebuild.mjs`).
- **Hace**, por mapa:
  1. Crea el `TileCanvas` con el tamaño declarado en el GDD (30×24, 32×32, 40×40…).
  2. Pinta el terreno por regiones usando los materiales de E2 y los tilesets existentes
     (bosque nevado ← Ruta 216/Lanakila; criptas ← Mt. Pyre/Lavender; biblioteca ←
     interiores de ciudad; hielo ← Frost Cavern…).
  3. Coloca props y tiles únicos (estatuas, altar, campana, trono, ojo) buscando el gráfico
     más parecido del juego; lo que no exista se implementa como **evento con sprite**
     (no requiere tileset nuevo).
  4. Valida con `reachableCells()` (BFS con hielo y bloqueos direccionales).
- **Salida**: `Map2040`–`Map2140` escritos en `pokemon_fire_ash/Data/` + entradas en `MapInfos`
  y `map_metadata`.
- **Criterio de término por mapa**: ver checklist §4.
- **Backups**: `pokemon_fire_ash/PokeModBackups/dimensional_nightmare_originals/`.

### E4 — Eventos, NPCs y jefes
- **Herramienta a crear**: `tools/apply_dimensional_nightmare_events.mjs` (o la misma de E3).
- **Entrada**: doc `10_EVENTOS_Y_FLAGS.md` (105 eventos) y `09_REGISTRO_DIMENSIONAL.md`.
- **Hace**: escribe los eventos por mapa con los comandos RMXP (101/401 texto, 111 condiciones,
  121 switches, 122 variables, 123 self-switch, 201 transferencias, 301 batallas), respetando
  `canLose`, derrota permanente y recompensa única.
- **Criterio de término**: `npm run verify:event-collision` y `verify:defeats` en verde para
  los 101 mapas.

### E5 — Verificación (nada se da por bueno sin imagen y sin BFS)
- **Herramienta a crear**: `tools/dn_render_reference.mjs` (variante de
  `render_atlas_visual_reference.mjs`, que ya produce pares antes/después).
- **Genera**, por lote: `docs/dn_referencia/<lote>_antes.png` (mosaico de referencia) y
  `_despues.png` (render de los mapas construidos) — el mismo patrón visual que ya usa el
  repo para Tier 2.
- **Chequeos automáticos por mapa**: BFS de transitabilidad, pasos direccionales, tiles fuera
  de rango, eventos fuera de límites, colisión de eventos, tono (`PokeModToneSafety`),
  transferencias seguras, cero escrituras a partidas.
- **Criterio de término**: `npm run dn:verify` (nuevo) y `npm run verify:all` sin regresiones.

### E6 — Instalación y empaquetado
- **Hace**: backups, instalación aditiva, `verify:package` + `package_integrity` y
  actualización de `docs/ESTADO_CONTENIDO_Y_PROMPTS.md` (pasar de «diseño» a «instalado»).
- **Criterio de término**: `npm run verify:dimensional_nightmare` en verde y QA manual
  (sección F de `docs/QA_MANUAL_PLAYTEST.md`) ejecutada en `Game.exe`.

---

## 3. Orden de trabajo y lotes

**Piloto (3 mapas, 1 sesión)**: `Map2041` (catacumbas), `Map2088` (bosque) y `Map2120`
(trono). Uno por familia de tileset. Sirve para calibrar E2–E5 antes de escalar.
Si el piloto no cumple el checklist, **no se sigue**: se ajusta el pipeline.

Después, lotes de **5 mapas**, en el orden de prioridad del GDD:

| Lote | Mapas | Episodio | Foco |
|---:|---|---|---|
| L1–L3 | 2041–2056 | EP01 White Hand | Interior/criptas, 4 pisos, sala de jefe |
| L4–L6 | 2057–2072 | EP02 Lost Silver | Exterior sepia, cementerios, torre |
| L7–L9 | 2073–2087 | EP03 Snow | Nieve, cuevas de hielo, templo |
| L10–L12 | 2088–2103 | EP04 Hypno | Bosque, niebla, campamento |
| L13–L15 | 2104–2119 | EP05 Black | Reutiliza R5 en versión vacía + R1 |
| L16–L18 | 2120–2135 | EP06 King Unown | Trono, bibliotecas, cámara final |
| L19 | 2136–2140 | Nexo | Glitch puro, 5 mapas |
| L20 | 2040 | Antesala | Hub de puertas |

**Total**: 1 piloto + 20 lotes ≈ 101 mapas. Cada lote se cierra con: render antes/después,
verificaciones en verde y commit propio (histórico limpio y reversible).

---

## 4. Checklist de aceptación por mapa (obligatorio)

1. Tamaño exacto declarado en `11_ASIGNACION_DE_RECURSOS.md`.
2. Composición reconocible: comparando la ficha y el render, se identifican las mismas zonas.
3. **BFS completo**: se puede ir de la entrada a la salida y a cada objeto sin atravesar muros.
4. Bordes limpios: se usaron las reglas de `learnMaterial`/`paintMaterial` (nada de costuras).
5. Todos los eventos del GDD presentes, con su trigger y sus switches.
6. Jefe: `canLose` + derrota permanente + recompensa única (si aplica).
7. Render antes/después generado en `docs/dn_referencia/`.
8. Sin tiles fuera de rango ni eventos fuera de límites (`verify:event-collision`).
9. `verify:tone-safety` y `verify:transition-safety` en verde.
10. Ni una escritura a `Save*.rxdata` / `Game.rxdata`.

---

## 5. Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---:|---|---|---|---|
| 1 | Rejilla del mosaico distinta a la esperada | media | bajo | autodetección + `layout.json` + selftest (ya construido) |
| 2 | Mosaicos escalados o con artefactos JPEG | alta | medio | detectar factor ×2/×3/×4 y reducir con nearest; umbrales adaptativos de color |
| 3 | Props sin equivalente en los tilesets del juego | alta | medio | reutilizar el prop más cercano o implementarlo como **evento con sprite**; nunca bloquear el mapa |
| 4 | Ficha de un mapa ≠ tamaño GBA estándar | media | medio | normalizar al tamaño del GDD y rellenar con el material dominante |
| 5 | 101 mapas es un volumen alto | — | alto | lotes de 5 con aceptación por lote; el piloto decide si se escala o se ajusta |
| 6 | Derechos sobre tiles de romhacks de terceros | alta | **alto** | **no** empaquetar tiles derivados; usarlos solo como referencia interna (enfoque A+B-interno) |
| 7 | Los mapas R1 (glitch) no tienen lógica de bordes | media | medio | tratarlos como "collage": tiles sueltos colocados a mano sobre base válida + BFS |
| 8 | Ruido visual de las fases 6–7 rompe la legibilidad | media | medio | el glitch es **capa de eventos/tinte**, no tiles ilegibles; se valida con render |

---

## 6. Decisiones que hacen falta antes de E2

| # | Decisión | Opciones | Recomendación |
|---:|---|---|---|
| D1 | Fidelidad | A (reconstrucción) · B (tileset derivado) · A+B interno | **A + B-interno** |
| D2 | Alcance del primer ciclo | Piloto+EP01 · los 101 · solo los 6 jefes | **Piloto + EP01** (calibrar y ver) |
| D3 | Arte nuevo (Rey Unown, Mano Blanca) | generar con IA · dejarlo para el final · no generar | **generar al final**, cuando el pipeline esté estable |

---

## 7. Qué NO entra en este plan

- Reescribir el contenido v1 (Map2021–2030) ni La Ruta de Dios.
- Sustituir los tilesets del juego o añadir especies nuevas.
- Modificar partidas (`Save*.rxdata` / `Game.rxdata`): jamás.
- Distribuir tiles de terceros dentro del juego.

---

## 8. Primeros comandos (cuando estén los 7 archivos)

```bash
npm ci                                   # instala @napi-rs/canvas y el tooling
cp <tus 7 imágenes> reference/dimensional_nightmare/recursos/   # con los nombres del README
npm run dn:check                         # 7/7
npm run dn:ingest                        # 96 fichas + index.json
npm run dn:selftest                      # rejilla OK
# ← aquí termina la fase 1 y empieza la construcción de E2 (tools/dn_material_map.mjs)
```
