# EVENTOS, SWITCHES Y VARIABLES — Referencia técnica
## Todo lo que hay que crear para el Dimensional Nightmare

> Rangos **verificados libres** contra los datos compilados:
> `MapInfos.rxdata` llega a `2038` · switches usados hasta `881` · variables usadas hasta `264`.

---

## 1. Switches nuevas (882–902 · segundo anillo 922–934)

| ID | Nombre | Escritura | Lectura |
|---:|---|---|---|
| 882 | `DN_UNLOCKED` | Al hablar con el Archivero en 2030 con `v264≥3` | Puerta de la Grieta de Cenizas (2030) |
| 883 | `DN_EP01_SEALED` | Tras vencer a LA MANO BLANCA (2056) | Grieta 02; resumen del Nexo |
| 884 | `DN_EP02_SEALED` | Tras EL SIN NOMBRE (2072) | Grieta 03 |
| 885 | `DN_EP03_SEALED` | Tras EL CAMINANTE (2087) | Grieta 04 |
| 886 | `DN_EP04_SEALED` | Tras LA NANA (2103) | Grieta 05 |
| 887 | `DN_EP05_SEALED` | Tras EL JUGADOR 000 (2119) | Grieta 06 |
| 888 | `DN_EP06_SEALED` | Tras KINGGUS (2135) | Nexo (2136) |
| 889 | `DN_NEXO_CLEARED` | Al terminar el epílogo (2140) | Consola del Rotom en el laboratorio (48) |
| 890 | `DN_GRIETA_CENIZA` | Al abrir la grieta 01 | Reflejo visual de la grieta |
| 891 | `DN_GRIETA_SILVER` | Al abrir la grieta 02 | idem |
| 892 | `DN_GRIETA_SNOW` | Al abrir la grieta 03 | idem |
| 893 | `DN_GRIETA_DREAM` | Al abrir la grieta 04 | idem |
| 894 | `DN_GRIETA_VOID` | Al abrir la grieta 05 | idem |
| 895 | `DN_GRIETA_CODE` | Al abrir la grieta 06 | idem |
| 896 | `DN_EP01_ANOM_DONE` | 12/12 anomalías EP01 | Página extra del Archivero |
| 897 | `DN_EP02_ANOM_DONE` | 13/13 anomalías EP02 | idem |
| 898 | `DN_EP03_ANOM_DONE` | 12/12 anomalías EP03 | idem |
| 899 | `DN_EP04_ANOM_DONE` | 13/13 anomalías EP04 | idem |
| 900 | `DN_EP05_ANOM_DONE` | 13/13 anomalías EP05 | idem |
| 901 | `DN_EP06_ANOM_DONE` | 14/14 anomalías EP06 | idem |
| 902 | `DN_ROTOM_OBTAINED` | Al recibir el Rotom (Archivero) | Menú de objetos del Rotom |
| 922 | `DN_SELLO_W7_STRANGLED_RED` | Tras EL AMO Y LA CORREA (2158) | Grieta W7 → W8 |
| 923 | `DN_SELLO_W8_BURIED_ALIVE` | Tras EL QUE RESPIRA DEBAJO (2174) | Grieta W8 → W9 |
| 924 | `DN_SELLO_W9_LAVENDER_TOWN_SYNDROME` | Tras EL CORO DEL CAMPANARIO (2190) | Vitrina del Testigo |
| 925–927 | `DN_GRIETA_W7/W8/W9` | Al cruzar cada grieta del segundo anillo | Antesala (2040) |
| 928–930 | `DN_JEFE_W7/W8/W9_FASE_A` | Al ganar la fase A de cada jefe | Marca la fase B pendiente |
| 931 | `DN_TESTIGO_LISTO` | Nueve cartucheras en la mochila | Vitrina del Testigo (`DN_CASE_WIT`) |
| 932–934 | `DN_CUOTA_W7/W8/W9` | 12/12 · 11/11 · 12/12 anomalías del mundo | Archivero y monumento |

## 2. Variables nuevas (265–276 · segundo anillo 283–288)

| ID | Nombre | Rango | Quién la escribe |
|---:|---|---|---|
| 265 | `DN_RESONANCE` | 0–100 | Cada sello (+12/+10/+12/+14/+16/+18) y anomalías (+1 c/3, máx +3/EP) |
| 266 | `DN_PHASE` | 1–7 | Los eventos de fase de cada mapa |
| 267 | `DN_EP_ACTUAL` | 0–6 | Entrada de cada episodio |
| 268 | `DN_EP01_ANOM` | 0–12 | Anomalías de EP01 |
| 269 | `DN_EP02_ANOM` | 0–13 | Anomalías de EP02 |
| 270 | `DN_EP03_ANOM` | 0–12 | Anomalías de EP03 |
| 271 | `DN_EP04_ANOM` | 0–13 | Anomalías de EP04 |
| 272 | `DN_EP05_ANOM` | 0–13 | Anomalías de EP05 |
| 273 | `DN_EP06_ANOM` | 0–14 | Anomalías de EP06 |
| 274 | `DN_ANOM_TOTAL` | 0–112 | Suma de los nueve mundos (primer anillo 77 + segundo 35) |
| 275 | `DN_ROTOM_NIVEL` | 0–5 | Espejo de los umbrales de 265 |
| 276 | `DN_FINAL_CHOICE` | 0–1 | Epílogo del Nexo (0 sellar, 1 dejar abierta) |
| 283–285 | `DN_ANOMALIAS_W7/W8/W9` | 0–12 / 0–11 / 0–12 | Cuota de anomalías de cada mundo del segundo anillo |
| 286 | `DN_W8_AIRE` | 0–5 | Reservas de aire encendidas (fase B de W8) |
| 287 | `DN_W9_CANTO` | 0–4 | Antenas cortadas (fase B de W9) |
| 288 | `DN_W7_CORREAS` | 0–4 | Correas rotas (fase B de W7) |

### Cálculo de nivel del Rotom (evento común)
```ruby
# DN_ROTOM_UPDATE (llamar tras cada cambio de v265)
r = $game_variables[265]
n = 0
n = 1 if r >= 20
n = 2 if r >= 40
n = 3 if r >= 60
n = 4 if r >= 80
n = 5 if r >= 100
$game_variables[275] = n
$game_switches[sw] = true   # según umbral, para condicionar páginas de evento
```

---

## 3. Eventos comunes propuestos (rango sugerido 900–906)

| CE | Nombre | Qué hace |
|---:|---|---|
| 900 | `DN_ROTOM_SCAN` | Menú del Rotom: resonancia, fase, anomalías `n/total`, nivel; opción «Eco» (pista), «Marcador» (destello) |
| 901 | `DN_FASE_APLICAR` | Aplica tinte/clima de `v266` al mapa actual (respetando `PokeModToneSafety`) |
| 902 | `DN_ANOMALIA_MARCAR` | Suma 1 a la variable del episodio, 1 a `v274` (tope 112); cada 3 → +1 a `v265` (tope +3/EP); cuota explícita por episodio (`sw896–901`, `sw932–934`) |
| 903 | `DN_PARTY_CURAR` | Curación completa (fogatas, cabañas, guardiana) |
| 904 | `DN_MIRROR_PARTY` | Genera la party espejo del jefe 000 (EP05) sin tocar la del jugador |
| 905 | `DN_SELLO_JEFE` | Self-switch del jefe + switch de episodio + resonancia + página del Archivero |
| 906 | `DN_GRIETA_ABRIR` | Activa la grieta del episodio siguiente y su switch |

[Nota para desarrollador: los eventos comunes 900–906 deben registrarse en `CommonEvents.rxdata`;
no colisionan con el rango usado por el contenido base según la auditoría de flags.]

---

## 4. Patrón obligatorio: batalla de jefe con derrota permanente

```ruby
# --- Página 1 del evento de jefe (sin condiciones) ---
pbTrainerBattle(PBTrainer.new("CLAVE", "NOMBRE"), false, "", true)   # canLose = true
# al ganar:
$game_self_switches[[map, event, "A"]] = true     # el jefe no vuelve
$game_switches[883] = true                        # sello de episodio
$game_variables[265] = [$game_variables[265] + 12, 100].min
$game_variables[274] = [$game_variables[274] + 3, 77].min   # tope de anomalías del EP
# recompensa única (comprobar posesión antes)
pbItemBall(:SACREDASH) unless $PokemonBag.pbQuantity(:SACREDASH) > 0

# --- Página 2 del evento (condición: self-switch A) ---
pbMessage("Lo que estaba aquí ya no está. Solo queda el hueco.")
```
**Verificación** (`tools/audit_defeat_persistence.mjs`): todo jefe del Nightmare debe salir
`permanent defeat` en la auditoría global, igual que las 8 batallas del v1.

---

## 5. Eventos clave por episodio (índice rápido)

| Episodio | Eventos | Total |
|---|---|---:|
| EP01 | `EV_CAT_Entrada`, `EV_CAT_Urnas`, `EV_CAT_Celdas`, `EV_CAT_Palancas`, `EV_CAT_Escalera`, `EV_CAT_Sarcofagos`, `EV_CAT_Raices`, `EV_CAT_Pasadizo`, `EV_CAT_Campana`, `EV_CAT_Pentagrama`, `EV_CAT_Mano`, `EV_CAT_Sello`, `EV_CAT_Salida`, `EV_CAT_Pozo` | 14 |
| EP02 | `EV_SIL_Entrada`, `EV_SIL_Reloj`, `EV_SIL_Pala`, `EV_SIL_Escombros`, `EV_SIL_Espejo`, `EV_SIL_Puente`, `EV_SIL_Tumbas`, `EV_SIL_Mausoleo`, `EV_SIL_Vagon`, `EV_SIL_Libros`, `EV_SIL_Campana`, `EV_SIL_Caracol`, `EV_SIL_Jefe`, `EV_SIL_Sello`, `EV_SIL_Salida` | 15 |
| EP03 | `EV_SNOW_Fogata`, `EV_SNOW_Ventisca`, `EV_SNOW_Cabana`, `EV_SNOW_Altar`, `EV_SNOW_Tienda`, `EV_SNOW_Campana`, `EV_SNOW_Hielo`, `EV_SNOW_Runas`, `EV_SNOW_Grieta`, `EV_SNOW_Bestia`, `EV_SNOW_Estatuas`, `EV_SNOW_Jefe`, `EV_SNOW_Sello`, `EV_SNOW_Salida` | 14 |
| EP04 | `EV_HYP_Entrada`, `EV_HYP_Carteles`, `EV_HYP_Puente`, `EV_HYP_Abuela`, `EV_HYP_Niebla`, `EV_HYP_Tumbas`, `EV_HYP_Sueno`, `EV_HYP_Campamento`, `EV_HYP_Cueva`, `EV_HYP_Estanque`, `EV_HYP_Musica`, `EV_HYP_Granero`, `EV_HYP_Silenciador`, `EV_HYP_Notas`, `EV_HYP_Jefe`, `EV_HYP_Sello`, `EV_HYP_Salida` | 17 |
| EP05 | `EV_BLK_Entrada`, `EV_BLK_Ausencia`, `EV_BLK_Fuente`, `EV_BLK_Escombros`, `EV_BLK_Puente`, `EV_BLK_Tumbas`, `EV_BLK_Espejo`, `EV_BLK_Mausoleo`, `EV_BLK_Vias`, `EV_BLK_Libros`, `EV_BLK_Campana`, `EV_BLK_R1Zona`, `EV_BLK_Jefe`, `EV_BLK_Sello`, `EV_BLK_Salida` | 15 |
| EP06 | `EV_UNO_Atrio`…`EV_UNO_Salida` (18) + `EV_UNO_Letra*` (7) | 25 |
| Nexo | `EV_NEXO_Falla`, `EV_NEXO_Puertas`, `EV_NEXO_Curar`, `EV_NEXO_Pasillo`, `EV_NEXO_Epilogo` | 5 |
| **Total** | | **105** |

---

## 6. Mapa de tiles y metadatos

| Grupo | Tilesets existentes a usar | Metadatos (`map_metadata`) |
|---|---|---|
| Catacumbas (EP01) | `Int Cueva`, `Int Lavender`, `Int Bosque` | `Cave` (sin encuentros de superficie) |
| Pueblo sepia (EP02/EP05) | `Outer Ciudad`, `Outer Bosque`, `Outer Agua`, `Int Biblioteca` | `Town`/`Route` según mapa; EP02 `Fog`; EP05 `Storm` en fase ≥6 |
| Nieve (EP03) | `Nieve exterior`, `Int Cueva Hielo`, `Int Templo` | `Snow` en exteriores; `Cave` en interiores |
| Bosque (EP04) | `Outer Bosque`, `Int Cueva`, `Int Granero` | `Forest`; `Fog` púrpura en fase ≥3 |
| Glitch (EP05/EP06/Nexo) | `Outer Glitch` (nuevo o reutilizar `Lavender Town`) + tiles R1 | `Glitch` (sin encuentros en fase 7) |

[Nota para desarrollador: si se crea el tileset `Outer Glitch`, debe clonar el formato de los
tilesets existentes (`Tilesets.rxdata`, tablas de pasajes/prioridades) y documentarse en
`docs/FORMATO_RXDATA.md`. Alternativa sin tileset nuevo: reutilizar `Lavender Town` y sustituir
tiles con los de R1 recortados.]

---

## 7. Checklist de verificación (para `verify:dimensional_nightmare`)

- [ ] 151 mapas nuevos en `MapInfos.rxdata` (2040–2190: primer anillo 2040–2140 + segundo 2143–2190), sin tocar 2021–2038.
- [ ] Switches 882–902 y variables 265–276 creadas y con nombre en `System.rxdata`.
- [ ] 6 batallas de jefe con `canLose` + derrota permanente + recompensa única.
- [ ] 105 eventos con el prefijo del episodio (`EV_CAT_`, `EV_SIL_`, `EV_SNOW_`, `EV_HYP_`, `EV_BLK_`, `EV_UNO_`, `EV_NEXO_`).
- [ ] 112 anomalías declaradas y contadas (primer anillo 77 = 12+13+12+13+13+14; segundo 35 = 12+11+12).
- [ ] 19 entidades del Registro Dimensional con su ficha.
- [ ] Resonancia máxima alcanzable = 100 (sin bloqueos).
- [ ] Ninguna escritura sobre `Save*.rxdata` / `Game.rxdata`.
- [ ] IDs libres confirmados tras instalar (sin colisión con v1 ni con La Ruta de Dios).
