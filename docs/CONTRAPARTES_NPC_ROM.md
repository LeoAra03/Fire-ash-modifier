# Contrapartes estructurales de NPC · ROM → mapas Fire Ash (fase 71)

Verificador: `node tools/verify_npc_contrapartes_rom.mjs` (`--json` para el detalle).
Lee `content/rom_campaigns_complete.json` y `pokemon_fire_ash/Data/Map<id>.rxdata`.
No modifica datos.

## Respuesta corta

**No se puede confirmar «los 9 691 NPC de origen tienen contraparte».** Por diseño del
plano sólo se instalan 3 625 (máximo 4 por mapa). De esos 3 625, **3 620 tienen
contraparte** y **5 no la tienen**.

## Cifras

| Concepto | Total |
|---|---:|
| NPC de origen ROM (`sourceCount`) | 9 691 |
| NPC instalados según el plano | 3 625 |
| NPC de origen sin instalar (por selección, diseño) | 6 066 |
| Instalados **con** contraparte en el mapa | 3 620 |
| Instalados **sin** contraparte | 5 |

Mapas revisados: 1 227 (todos existen como `Map<id>.rxdata`).

Cómo se empareja cada NPC instalado:

1. **Por nombre**: evento `…NPC — <campaña>_<secuencia>_<n>` o `Entrenador — …` (3 616).
2. **Por posición exacta** (x, y) entre eventos que no son navegación, líder ni final (4).

## Por campaña

| Campaña | Mapas | Origen | Instalados | Por nombre | Por posición | Sin contraparte |
|---|---:|---:|---:|---:|---:|---:|
| Glazed | 111 | 770 | 345 | 341 | 4 | 0 |
| Light Platinum | 19 | 188 | 54 | 50 | 0 | **4** |
| Liquid Crystal | 432 | 2 457 | 1 203 | 1 202 | 0 | **1** |
| TFOH Beta 3 | 245 | 2 101 | 705 | 705 | 0 | 0 |
| Pokémon Unbound | 420 | 4 175 | 1 318 | 1 318 | 0 | 0 |

## Los 5 casos sin contraparte

Los dos mapas afectados tienen los NPC renombrados por el pase de «lore nativo»
(`apply_light_platinum_native_lore` / `apply_liquid_crystal_native_lore`), que los
recoloca y cambia su número, así que el nombre del plano ya no aparece:

- **Mapa 3120 (Light Platinum)**: el plano tiene 4 NPC en (33,22), (34,22), (20,15) y
  (32,5). Los eventos instalados son «Prof. Jasmine», «Kaori», «Rival Diamond» y «Team
  Steam Scout», en (18,20), (22,21), (16,24) y (25,26). Hay 4 eventos para 4 NPC, pero
  ninguna posición coincide.
- **Mapa 3200 (Liquid Crystal)**: el plano tiene 1 NPC en (9,3). Hay 4 eventos
  («Prof. Elm», «Rival Silver», «Lyra», «Eusine») y ninguno está en (9,3). Sobran 3
  eventos y falta 1 contraparte.

Los NPC de «Glazed» emparejados por posición (4) son los de `Map3000`: sus eventos se
llaman «PokeMod Glazed: …» y están exactamente en las coordenadas del plano.

## Corrección pendiente (requiere decisión)

Para cerrar los 5 casos hay que decidir si el pase de lore nativo debe **respetar**
las posiciones y el número de NPC del plano (y regenerar esos dos mapas) o si el plano
debe actualizarse a lo que ese pase dejó. Cambiar cualquiera de las dos cosas toca
los mapas instalados, así que no se hace en esta fase. Tras la corrección,
`node tools/verify_npc_contrapartes_rom.mjs` debe salir con código 0.
