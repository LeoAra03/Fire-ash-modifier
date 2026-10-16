# Auditoría: la extracción GBC no inventa terreno

> Fase 46 del backlog. Comprobar que la extracción de la ROM GBC no inventa terreno y
> documentar la regla para las celdas sin bit de colisión: si el bit no está, la celda
> se trata como libre.

Verificador: `tools/qa/audit_gbc_terreno.mjs` (script `audit:gbc:terreno`).

```bash
node tools/forense_roms.mjs --rom "roms pokemon/FactoryAdventure.gb"   # extracción GB, una vez
node tools/qa/audit_gbc_terreno.mjs                                    # auditoría
node tools/qa/audit_gbc_terreno.mjs --escribir                         # regenera la documentación
```

## Qué ROM GBC hay y qué se extrae de ella

- ROM: `FactoryAdventure.gb` (1 MB, en `ROMS (1).rar`, extraída en `roms pokemon/`, sin
  versionar). La cabecera dice `POKEMON FACTORY`, plataforma GB, **`cgb = 0`**: según su
  propia cabecera es una ROM de Game Boy clásica, no marcada para GBC.
- `tools/forense_roms.mjs`, rama GB (`forenseGB`), solo produce:
  - `pokemon/nombres.json` (74 nombres de especie),
  - `sprites/` (349 sprites en 30 cadenas),
  - `dialogos/textos.json` y `dialogos.txt` (3 999 cadenas).
- Ninguna rama GB escribe mapas, colisión, pasajes ni terreno.

## Resultados

| Comprobación | Resultado |
|---|---|
| **A.** Claves de `01_indice.json` de la extracción GB | `nombresEspecie`, `sprites`, `textos`: **ninguna de terreno** |
| **A.** Ficheros de la extracción con nombre de mapa, colisión o pasaje | **Ninguno** |
| **B.** `content/dimensiones_barco.json` → `factoryadventure.rom` | `mapasDetectados = 0`, `npcsDetectados = 0`, `dialogosDetectados = 0` |
| **C.** Celdas sin bit de colisión (GBA, campaña 0) | **30 871** de 82 518 celdas comparadas quedan libres (paso 0) en lo instalado; **0 incumplen** |
| **C.** Mapas no comparables | **1** (Map3060: la instalación tiene 15×24 y la ROM 13×24) |

La dimensión Factory Adventure toma su terreno de **ventanas de mapas del propio juego**
(`tools/apply_dimensiones_barco.mjs`, con `dimension_builder`), no de la ROM GB. Por eso
su registro declara 0 mapas del ROM. Los pasillos de unión que se añaden son geometría
del generador, no datos extraídos de la ROM.

## Regla para celdas sin bit

En el MapLayout de Gen 3 (ROM GBA), los bits 10–11 de una celda son la colisión:
`0` = transitable, `1–3` = bloqueada. Una celda sin bit no es un dato perdido: en ese
formato significa **libre**. El generador (`blockedOf` en `tools/rom_nativo_mapas.mjs`)
la trata así y el verificador lo confirma:

- 30 871 celdas de la campaña 0 (37 %) no tienen bit de colisión y quedan con paso 0.
- El detalle por mapa está en `content/colision_libres_sin_bit.json` (campos
  `totales` y `mapas`; `libresSinBit: null` marca los mapas no comparables).

Esta documentación se regenera con `--escribir` y la auditoría falla si no coincide con
lo calculado.

## Estado

- **A:** OK. La extracción GB no contiene terreno.
- **B:** OK. El ROM GB aporta 0 mapas a la dimensión Factory Adventure.
- **C:** Regla confirmada en 82 518 celdas; **falla en Map3060** (dimensiones distintas).
  Es el mismo mapa que ya se señaló en `docs/VERIFICACION_COLISION_ROMN.md` (fase 45).
  No se corrige en esta fase.

## Límites

- Las campañas 1–4 no están extraídas: su regla no se ha comprobado con su ROM.
- La cabecera `cgb = 0` contradice llamar «GBC» a `FactoryAdventure.gb`. El ROM se trata
  como Game Boy. Si el usuario lo considera GBC, la rama GB sigue sin producir terreno.
