# Rollback y restauración desde `PokeModBackups/` (FASE 29)

Procedimiento exacto de restauración para cada instalador del proyecto.
Todo instalador de este repo respalda **el archivo original de `Data/` antes
de tocarlo** en `pokemon_fire_ash/PokeModBackups/<carpeta>/<archivo>` (copia
plana, mismo nombre de archivo: `tools/lib/dlc_helpers.mjs` → `backup()`).
Además, `tools/backup.py` crea **snapshots ZIP completos** (`backup_*.zip`).

**Nunca se borra nada de `PokeModBackups/`.** La carpeta está en
`.gitignore`: existe solo en local. Si se pierde, los instaladores la
regeneran la próxima vez que corran (respaldando el estado vigente, no el
original histórico).

---

## 0. Las tres capas de restauración

| Capa | Qué contiene | Cuándo usarla |
|---|---|---|
| **Git** (`git restore pokemon_fire_ash/Data`) | El estado **canónico commiteado** del juego con el plan instalado (inventario congelado en verde). | Daño accidental **no commiteado** (un script a medias, un `--apply` sin verificar). Es siempre el primer intento. |
| **ZIP puntual** (`backup_YYYYMMDD_HHMMSS.zip`) | Snapshot de `Data/` completo (3529 archivos) + `Game.ini` en un instante dado. | Volver **atrás en el tiempo** todo el árbol de una vez (p. ej. antes de una reconstrucción completa con `orden_instalacion.sh --apply`). |
| **Originales por instalador** (`PokeModBackups/<carpeta>/`) | Los archivos exactos que ese instalador modificó, en su estado **previo a ese instalador**. | Deshacer **quirúrgicamente** un solo instalador. |

Decisión rápida:

1. ¿Se rompió algo y NO hay commit? → **Git** (§1).
2. ¿Hay que deshacer un instalador concreto? → **quirúrgico** (§2).
3. ¿Hay que volver al estado de un momento dado? → **ZIP** (§3).

---

## 1. Capa Git — revertir daño no commiteado

```bash
cd <repo>
git status --short pokemon_fire_ash/Data        # qué cambió sin commitear
git restore pokemon_fire_ash/Data               # volver al estado canónico
npm run plan900:check                           # auditoría del plan en verde
node tools/inventario_congelado.mjs --verify    # ✔ hashes coinciden
```

El estado commiteado es el único que tiene todos los verificadores en
verde: si `--verify` del inventario está en rojo tras un `git restore`,
el daño tocó también archivos fuera de `Data/` (revisar `git status`).

---

## 2. Restauración quirúrgica de un instalador

Devuelve **solo los archivos que ese instalador respaldó** a su estado
previo. Busca la carpeta del instalador en el mapa (§4).

```bash
cd pokemon_fire_ash
CARPETA=wild_zones_originals          # ← carpeta del instalador (ver §4)

# 1) Ver qué respaldó (y su LEEME.txt explicativo si existe)
ls "PokeModBackups/$CARPETA/"

# 2) Copiar cada respaldo de vuelta a Data/ (LEEME.txt no es un archivo del juego)
for f in PokeModBackups/$CARPETA/*; do
  b=$(basename "$f"); [ "$b" = "LEEME.txt" ] && continue
  cp "$f" "Data/$b" && echo "restaurado Data/$b"
done
```

Después, **re-sincronizar el paquete directo** (los instaladores también
escriben en `Scripts_corregido/Paquete_directo/Data/`):

```bash
cd <repo>
npm run verify:paquete    # detecta divergencia juego ↔ paquete
npm run sync:paquete      # re-sincroniza el paquete desde el juego
npm run <verificador del instalador>   # ver §4: p. ej. npm run verify:wild
```

**Reglas de la restauración quirúrgica:**

- **Un solo instalador con verificador en verde** = rollback limpio.
- Si se restauran **varios instaladores a mano**, hacerlo en **orden inverso
  al de instalación** (9→1 del orden obligatorio): el respaldo de un
  instalador tardío contiene archivos ya modificados por los anteriores, y
  el original verdadero debe quedar encima.
- Los respaldos de un instalador son **previos a ese instalador**, no
  vírgenes del juego base: si un instalador anterior tocó el mismo archivo,
  restaurar este carpeta también deshace parte del anterior. Tras un
  rollback quirúrgico, si se quiere el resto del plan intacto, reinstalar
  hacia adelante: `bash tools/plan900/orden_instalacion.sh --apply` (es
  idempotente y rerespalda solo lo que falte).
- El inventario congelado quedará **en rojo a propósito** tras un rollback:
  el estado ya no es el canónico commiteado. Para volver al canónico:
  `git restore pokemon_fire_ash/Data tools/inventario_congelado.json`.

---

## 3. Restauración total desde un ZIP de `backup.py`

`tools/backup.py` empaqueta `Data/` + `Game.ini` (+ `PBS/` y partidas si
existieran en la carpeta del juego). Restaurar = extraer y copiar encima:

```bash
cd pokemon_fire_ash
ZIP=PokeModBackups/backup_20261015_041420.zip        # ← el snapshot elegido

# 1) Inspeccionar antes de restaurar (siempre)
python3 -m zipfile -l "$ZIP" | head                  # ver contenido
python3 -m zipfile --test "$ZIP" && echo "ZIP íntegro"

# 2) Extraer a una carpeta temporal, nunca directamente encima
python3 -m zipfile -e "$ZIP" /tmp/restaurar_plan900

# 3) Copiar encima del juego (el ZIP preserva rutas relativas: Data/, Game.ini)
cp -a /tmp/restaurar_plan900/Data/. Data/
cp -a /tmp/restaurar_plan900/Game.ini .              # si el snapshot lo trae

# 4) Re-sincronizar paquete y verificar
cd <repo>
npm run sync:paquete
npm run plan900:check
```

Crear un snapshot nuevo antes de cualquier operación masiva:

```bash
python3 tools/backup.py pokemon_fire_ash
# → Backup: N archivos → pokemon_fire_ash/PokeModBackups/backup_<ts>.zip
```

**Advertencia:** el ZIP es un punto en el tiempo, no el juego original
virgen de Fire Ash. El snapshot más antiguo disponible marca el límite
máximo de retroceso.

---

## 4. Mapa instalador → carpeta de respaldo

Todos los respaldos viven en `pokemon_fire_ash/PokeModBackups/`. Columna
«verificador» = script npm que debe quedar en verde tras reinstalar; tras
un rollback quirúrgico se usa para confirmar que el instalador quedó
**desinstado** (el verificador puede fallar: es lo esperado).

### 4.1 Los nueve del orden obligatorio (`tools/plan900/orden_instalacion.sh`)

| # | Instalador (npm) | Script | Carpeta en `PokeModBackups/` | Verificador |
|---:|---|---|---|---|
| 1 | `expansion` | `tools/apply_expansion_multiversal.mjs` | `expansion_multiversal/` | `npm run verify:expansion` |
| 2 | `canon:arceus` | `tools/apply_canon_arceus.mjs` | `canon_arceus/` | `npm run verify:canon:arceus` |
| 3 | `build:eras` | `tools/apply_atlas_eras_map.mjs` | `atlas_eras_map/` | `npm run verify:eras` |
| 4 | `build:restauracion` | `tools/apply_restauracion_cromatica.mjs` | `restauracion_cromatica/` | `npm run verify:restauracion` |
| 5 | `build:dimensiones` | `tools/apply_dimensiones_barco.mjs` | `dimensiones_barco/` | `npm run verify:dimensiones` |
| 6 | `build:rocket` | `tools/apply_team_rocket_mision.mjs` | `team_rocket_mision/` | `npm run verify:rocket` |
| 7 | `build:circuito` | `tools/apply_atlas_circuito.mjs` | `atlas_circuito/` | `npm run verify:circuito` |
| 8 | `build:ambience` | `tools/apply_dlc_ambience.mjs` | `dlc_ambience/` | `npm run verify:ambience` |
| 9 | `build:wild` | `tools/apply_wild_zones.mjs` | `wild_zones_originals/` | `npm run verify:wild` |

### 4.2 Familia Atlas

| Instalador | Carpeta | Verificador |
|---|---|---|
| `apply_atlas_mil_expansion.mjs` | `atlas_mil_originals/` | `npm run test:atlas:master` |
| `apply_atlas_hierarchy.mjs` | `atlas_hierarchy_originals/` | (auditoría interna) |
| `apply_atlas_service_repair.mjs` | `atlas_service_repair_originals/` | `npm run verify:atlas:repair` |
| `apply_atlas_tier3_rules.mjs` | `atlas_tier3_rules_originals/` | `npm run verify:tier3:rules` |
| `apply_tier2_routes.mjs` | `atlas_tier2_routes_originals/` (o la que se pase con `--backup`) | `npm run verify:tier2:macro04…07` |
| `apply_tier1_batch.mjs` | la que reciba como `backupName` | `npm run test:atlas:master` |
| `apply_atlas_sector01_redesign.mjs` | `atlas_sector01_redesign_main_4763ec19_originals/` | `npm run verify:atlas:sector01` |
| `apply_atlas_sector01_floor_layout.mjs` | `atlas_sector01_floor_layout_main_4763ec19_originals/` | `npm run verify:atlas:sector01` |
| `apply_atlas_visual_macro01.mjs` | `atlas_visual_macro01_originals/` | (auditoría interna) |
| `apply_atlas_visual_macro02.mjs` | `atlas_visual_macro02_originals/` | `npm run render:atlas:macro02` (regenera) |
| `atlas_tile_repair.mjs` | `atlas_tile_repair_originals/` | `npm run verify:atlas:tiles` |
| `apply_horizontes_500_expansion.mjs` | `horizontes_originals/` | (auditoría interna) |

### 4.3 Familia Dimensional Nightmare (DN)

| Instalador | Carpeta | Verificador |
|---|---|---|
| `apply_dimensional_nightmare_maps.mjs` | `dimensional_nightmare_maps_originals/` | `npm run dn:maps:verify` |
| `dn_build_hub_map.mjs` / `dn_build_hub_events.mjs` | `dimensional_nightmare_maps_originals/` | `npm run dn:hub:verify` / `dn:hub:events:verify` |
| `apply_dimensional_nightmare_battles.mjs` | `dimensional_nightmare_battles_originals/` | `npm run dn:battles:verify` |
| `dn_install_art.mjs` | `dimensional_nightmare_art_originals/` | `npm run dn:art:verify` |
| `apply_dn_banner_cleanup.mjs` | `dn_map_banner_cleanup_originals/` | `npm run dn:polish:verify` |
| `dn_apply_gameboy_palette.mjs` | `dn_gameboy_palette/` | `npm run dn:gameboy:verify` |

### 4.4 Campañas y otros contenidos

| Instalador | Carpeta | Verificador |
|---|---|---|
| `apply_multiverse_creepypasta.mjs` | `multiverse_creepypasta_originals/` | `npm run verify:multiverse` |
| `apply_monte_silver_rebuild.mjs` | `monte_silver_rebuild_originals/` | `npm run verify:monte_silver` |
| `apply_isla_espejo_maps_rebuild.mjs` | `isla_espejo_maps_rebuild/` | `npm run verify:isla_espejo` |
| `apply_isla_espejo_expansion.mjs` | `isla_espejo_originals/` | (auditoría interna) |
| `apply_la_ruta_de_dios.mjs` | `la_ruta_de_dios/` | `npm run verify:ruta_de_dios` |
| `apply_dlc_regiones.mjs` | `dlc_regiones/` | `npm run verify:regiones` |
| `apply_arceus_mega.mjs` | `arceus_mega/` | (auditoría interna) |
| `apply_pokegods_originales.mjs` | `pokegods_originales/` | (auditoría interna) |
| `apply_oak_lab_postgame_hub.mjs` | `oak_lab_hub_originals/` | `npm run verify:oak:hub` |
| `apply_emergency_abra_and_free_tower.mjs` | `emergency_abra_and_tower_originals/` | `npm run verify:abra:tower` |
| `apply_grandeur_bag_freedom.mjs` | `grandeur_bag_originals/` | `npm run verify:grandeur:bag` |
| `apply_extended_level_cap.mjs` | `extended_level_cap_originals/` | (auditoría interna) |
| `apply_cajas_dialogo.mjs` | `cajas_dialogo/` | `npm run verify:dialogos:queue` |

### 4.5 Reparaciones, gráficos y material ROM (objetivos fuera de `Data/`)

| Herramienta | Carpeta | Restauración |
|---|---|---|
| `repair_map_data.mjs` | `datos_reparados/` | Copiar de vuelta a `Data/` (§2). |
| `rom_nativo_mapas.mjs` | `rom_nativo_mapas/` | Objetivo: mapas derivados de ROM; restaurar según `LEEME` de la carpeta. `npm run verify:rom:nativo`. |
| `rom_nativo_sprites.mjs` | `rom_nativo_sprites/` | Ídem sprites. `npm run verify:rom:nativo`. |
| `apply_outfits_dimensiones.mjs` | `atavios/` | Atavíos (gráficos): restaurar los PNG sobre `Graphics/` correspondiente. `npm run verify:atavios`. |
| `build_outfit_sheets.mjs` | `atavios/` | Hojas de atavíos regenerables: reejecutar en vez de restaurar. |
| `build_unbound_ash_outfit.mjs` | `atavios/ash_outfit_unbound.png` | Regenerable: `npm run build:ash:unbound`. |

### 4.6 Lo que NO es un respaldo

- `PokeModBackups/analisis_total_fire_ash.json` — salida del análisis
  (`analyze_compiled_fire_ash.mjs`), no un respaldo.
- `PokeModBackups/auditoria_flags_total.json` — salida de auditoría.
- `LEEME.txt` dentro de cada carpeta — nota explicativa, nunca se copia.

---

## 5. Verificación tras cualquier rollback

```bash
npm run plan900:check                            # registro del plan + backups
node tools/inventario_congelado.mjs --verify     # verde solo en estado canónico
bash tools/plan900/orden_instalacion.sh --verify # los 9 verificadores en orden
npm run verify:ruby                              # Scripts.rxdata sin errores
python3 -m zipfile --test pokemon_fire_ash/PokeModBackups/*.zip  # ZIP sanos
```

Estado esperado: tras **`git restore`** todo verde; tras un **rollback
quirúrgico o de ZIP** el inventario puede quedar en rojo (estado no
canónico) hasta reinstalar (`orden_instalacion.sh --apply`) o commitear el
nuevo estado como canónico (regenerando el inventario, protocolo FASE 26).
