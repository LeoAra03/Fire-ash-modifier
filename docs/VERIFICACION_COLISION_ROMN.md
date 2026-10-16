# Verificación de la regla de colisión ROMN (bits 10–11)

> Fase 45 del backlog. Comprobar que la colisión de cada celda sale de los bits 10–11
> de la celda original de la ROM, y no de la tabla de comportamientos del tileset,
> que en los hacks queda a 0.

## Regla

```text
celda bloqueada  ⇔  (celda & 0x0c00) ≠ 0          (COLISION_MASK, bits 10–11)
paso del id instalado = 0x0f si está bloqueada, 0 si no   (PASS_BLOCK)
```

El generador (`tools/rom_nativo_mapas.mjs`) emite dos variantes por metatile, libre y
sólida, y asigna cada celda a una u otra según sus bits 10–11. La tabla de
comportamientos (`comportamiento`) nunca se escribe: queda a cero.

## Verificador

```bash
node tools/gba_maps_events.mjs --rom "roms pokemon/GlazedESPB6.gba"   # índice de mapas, una vez
node tools/qa/verify_rom_nativo_colision.mjs
```

`tools/qa/verify_rom_nativo_colision.mjs` hace tres comprobaciones:

1. **Código.** `COLISION_MASK = 0x0c00`, `PASS_BLOCK = 0x0f`, `blockedOf` basado en la
   máscara y ninguna escritura en la tabla de comportamientos. **OK.**
2. **Manifiesto** (`content/rom_nativo.json`). Los 212 tilesets tienen
   `comportamiento` = 0; cada variante libre tiene paso 0 y cada sólida, paso 0x0f. **OK.**
3. **ROM contra instalación.** Para cada mapa de la campaña con ROM disponible,
   lee la celda cruda de la ROM (cabecera MapLayout Gen 3, ver
   `docs/REVISION_MAPLAYOUT_ROMN.md`) y compara su colisión con el paso del id que
   quedó en `Map*.rxdata`.

## Resultado

| Comprobación | Resultado |
|---|---|
| Regla en el código | OK |
| Comportamiento en el manifiesto | OK (0 en 212 tilesets) |
| Campaña 0 (`GlazedESPB6.gba`), 110 mapas, 82 518 celdas | **82 178 coinciden** · 337 excepciones por evento (documentadas) · **3 discrepan** |
| Mapa 3060 | **Dimensiones distintas**: instalado 15×24, ROM 13×24 |
| Campañas 1–4 | **No verificadas**: sus ROM no están extraídas en `roms pokemon/` |

### Discrepancias

| Mapa | Celda | Celda ROM | Id instalado | Paso instalado | Paso esperado |
|---|---|---|---|---|---|
| Map3031 | (8,4) | `0x0655` (bloqueada) | 450 (libre) | 0 | 15 |
| Map3079 | (20,17) | `0x0653` (bloqueada) | 742 (libre) | 0 | 15 |
| Map3094 | (9,5) | `0x0600` (bloqueada) | 388 (libre) | 0 | 15 |

Ninguna de las tres tiene evento encima, así que no son las excepciones de
`abrirCeldasDeEventos`. El manifiesto tiene el id sólido (451, 743, 389) en esas
celdas: **el mapa instalado ya no coincide con el manifiesto**.

El **Map3060** tiene 15 columnas instaladas y 13 en la ROM, así que su geometría
no proviene del generador ROMN.

### Origen probable

`tools/rom_nativo_mapas.mjs --verify` ya falla hoy con 11 fallos del mismo tipo
(Map3031, Map3079, Map3094, Map3120, Map3125, Map3323, Map3385, Map3805, Map3839,
Map3874: «1 celdas no coinciden con el ROM», y eventos sobre celdas sólidas en
Map3120). Es decir, el fallo no lo introduce esta fase.

`tools/apply_complete_rom_campaigns.mjs` escribe `Map${mapId}.rxdata` con los mismos
ids de campaña (línea 210). Es el candidato más probable a haber sobrescrito la
geometría ROMN. **No está verificado**: habría que reinstalar en orden y comparar.

## Conclusión

La regla de colisión por bits 10–11 **es correcta en el generador** y se cumple en
la gran mayoría de celdas (82 178 de 82 518 en la campaña 0). Pero **la instalación
actual no la conserva** en 3 celdas y en un mapa, y el propio verificador existente
ya lo marca. No se corrige en esta fase: exige decidir qué pipeline gana sobre
los mapas compartidos y reinstalar.

## Pendiente

1. Decidir si `apply_complete_rom_campaigns.mjs` debe dejar intactos los mapas
   ROMN o si el generador ROMN debe ejecutarse después.
2. Reinstalar los mapas afectados (3031, 3060, 3079, 3094, y los del `--verify`)
   y volver a correr este verificador y `rom_nativo_mapas.mjs --verify`.
3. Extraer las ROM de las campañas 1–4 (`ROMS (1).rar`, `ROMS (2).rar`, y la
   unbound en partes) para verificarlas también.
