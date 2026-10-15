# Verificación de Formas de Anomalía (Alfa / Beta / Omega)

Fecha: 2026-10-15. Fase 64 del backlog.

## Formas contra `content/pokegods_originales.json` → `forms`

| Forma | Nivel | Shiny | Habilidad | Huir | Captura | Estado |
|---|---|---|---|---|---|---|
| Alfa | 85 | no | primaria | sí | sí | OK |
| Beta | 100 | no | oculta | no | sí | OK |
| Omega | 115 | sí | Wonder Guard | no | sí | OK |

- Coinciden con `docs/PROMPT_MAESTRO_Y_ESTADO.md` (líneas 168 y siguientes).
- `docs/POKEGODS_ASSETS_FASE3.md` decía Omega nivel 100: **corregido a 115** y se añadieron las banderas de huida y shiny.

## Tabla de assets (`content/pokegods_assets.json`)

- 18 entradas. **PIKABLU** no aparece en la tabla, aunque sus 4 archivos existen en `pokemon_fire_ash/Graphics/` (pendiente de añadir a la tabla).
- **ELECTRAMEW, PIKAMARS, RATICLAW**: sin sprites (frontal, trasero, icono, personaje). Siguen pendientes de arte.
- Resto: 15 entradas con los cuatro archivos presentes.

## Banderas de encuentro en mapas

- `node tools/apply_pokegods_originales.mjs --verify` **FALLA**: `se esperaban 20 eventos Pokégod y hay 0`.
- Mapas 997, 998 y 999 (Isla Espejo) no contienen eventos "PokeMod Pokégod:". Las manifestaciones con las tres formas no están instaladas en los datos del juego.
- Pendiente: ejecutar el instalador (modifica `pokemon_fire_ash/Data/*.rxdata`) y repetir la verificación. No se ha hecho en esta fase.

## Resultado

Formas de datos: **correctas**. Assets y encuentros en juego: **incompletos** (ver arriba).
