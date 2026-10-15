# Política de 4 NPC por mapa y perfiles artesanales · campañas ROM (fase 72)

Generado por `tools/perfiles_artesanales_campanas.mjs` (`--check` lo verifica).
Lista completa en `content/perfiles_artesanales_campanas.json`.

## 1. Verificación de la política

La política «máximo 4 NPC por mapa» (`MAX_NPCS_PER_MAP` en
`tools/create_complete_rom_campaigns.mjs`) **se cumple en los 1 227 mapas**:

- `installedCount = min(sourceCount, 4)` en todos los mapas.
- La lista `npcs` tiene exactamente `installedCount` entradas.
- Ningún mapa instala más de 4.

Se pierden **6 066 NPC** de origen (de 9 691) en 654 mapas. La selección
(`selectNpcs`) prioriza entrenadores (hasta 2) y luego NPC con señales estructurales.

## 2. Qué mapas necesitan perfil artesanal propio

Sólo entran mapas que pierden NPC (`sourceCount > 4`) y cumplen **una** de estas reglas:

| Regla | Criterio | Mapas |
|---|---|---:|
| R1 interior | `mapType` 8 (INDOOR) o 9 (SECRET_BASE) | 9 |
| R1b interior probable | `mapType` 0, dimensión máx. ≤ 20, ≥ 1 warp | 97 |
| R2 saturación | `sourceCount` ≥ 12: el plano conserva ≤ 1/3 de los NPC | 297 |

Total: **385 mapas** con perfil artesanal propio, que concentran **5 062 de los 6 066**
NPC perdidos. Por campaña: Unbound 157, TFOH 98, Liquid Crystal 83, Glazed 36,
Light Platinum 11.

Motivo de la regla R1: el generador sólo usa tiles **exteriores** de Fire Ash
(`mapVisualRows` / donantes exteriores), así que un interior se pintaría con suelo de
exterior. El propio contrato del plano lo declara: `interiorsNeedSeparateHandcraftedProfiles: true`.

## 3. Límites de la decisión

- El plano **no marca interiores**. El `mapType` de la ROM es un byte de la cabecera
  sin una semántica estable; por eso R1b es una **estimación** y debe revisarse a mano.
  Ejemplo: el Laboratorio de Willow (`Map3000`, 13×13, tipo 0) cae en R1b y es un
  interior claro.
- La regla R2 usa 12 como umbral. Es una decisión de diseño, no un dato de la ROM.
- Esta fase **no construye** los perfiles: sólo decide qué mapas los necesitan. Cada
  perfil es una tarea de arte y de mapeo aparte.

## 4. Siguiente paso recomendado

1. Revisar a mano los 97 mapas R1b (interiores probables) y confirmar o descartar.
2. Priorizar los 9 interiores confirmados por `mapType` (todos de Unbound y TFOH, salvo
   uno de Glazed/TFOH en tipo 8/9).
3. Para los 297 mapas R2 (exteriores saturados), valorar primero si basta con
   aumentar el cupo en zonas de ciudad antes de hacer un perfil completo.
