# Atavios por dimensión y Salón de Diplomas

Estado: **instalado y verificado** (2026-10-10). Cierra los criterios 4, 5 y 6 del
brief del DLC completo: *«sprites de Ash para cada dimensión»*, *«cambiar de
outfits en la casa de Ash como siempre se ha hecho»* y *«extensión del segundo
piso de la casa de Ash para más diplomas»*.

## 1. Atavios de Ash (criterios 4 y 5)

### Sprites propios por dimensión

| Atavio | Charset (`Graphics/Characters/`) | Dimensión que lo usa |
|---|---|---|
| Explorador Atlas | `ash_outfit_atlas.png` | Atlas (1021–2020, 2191, 2195–2196, 2230, 2250–2257) |
| Abrigo Creepypasta | `ash_outfit_creep.png` | Creepypasta (2023–2029, 2058–2194) |
| Playera Glazed | `ash_outfit_glazed.png` | Glazed (2200–2201, 3000–3110) |
| Abrigo Invernal | `ash_outfit_lp.png` | Light Platinum (2210–2211, 3120–3138) |
| Chamarra Náutica | `ash_outfit_lc.png` | Liquid Crystal (2240–2241, 3200–3631) |
| Capa del Viajero | `ash_outfit_tfoh.png` | TFOH (2231, 2242–2245, 3700–3944) |
| Clásico / Leaf / Rocket | `trchar000` / `trchar001` / `trainer_TEAMROCKET_M` | Pueblo Paleta y el resto |

Cada hoja es un charset RMXP **128×192** (4×4 de 32×48) construido por
`tools/build_outfit_sheets.mjs` desde los bocetos de `assets_outfit/`
(recorte de rejilla, fondo transparente, 16/16 celdas verificadas).

### Atavio automático («ponerse en ambiente»)

Sección de scripts **`PokeMod_Atavios`** (id 999903, en `Data/Scripts.rxdata` y
`Scripts_corregido/Scripts.rxdata`). Un hook sobre `Game_Map#setup` evalúa el
mapa al entrar:

- si el mapa pertenece a una dimensión → Ash viste su atavio;
- fuera de dimensión → vuelve al clásico;
- el **disfraz Rocket nunca se pisa** (si la identidad es TEAMROCKET_M no se
  toca nada, y los mapas 2220–2221/2281 quedan excluidos);
- con modo fijo, el atavio elegido no cambia solo.

La identidad de entrenador no cambia en los atavios de dimensión (Ash viaja
como viajero: sigue siendo POKEMONTRAINER_Red). Clásico/Leaf/Rocket pasan por
`pbChangePlayer` (slots de metadata 0/1/3, los únicos existentes).

### Vestidor en la casa de Ash

Evento nuevo **`PokeMod Vestidor: armario`** en Map003, planta baja, celda
(8,5), junto a la cama. Menú con los seis atavios de dimensión + Clásico, y un
submenú: Uniforme (chica), Uniforme Rocket, **Fijar este atavio** (modo fijo),
**Atavio automático** (modo auto + reevalúa el mapa actual).

### Flags nuevos (Regla de Oro)

- Variable **316** `POKEMOD ATAVIO ACTUAL` — atavio equipado.
- Variable **317** `POKEMOD ATAVIO MODO` — 0 automático / 1 fijo.

## 2. Salón de Diplomas (criterio 6)

Extensión de la planta alta: mapa nuevo **2288 «Casa de Ash — Salón de
Diplomas»** (24×14, tileset 3 de la casa, suelo/muro muestreados de Map003),
con puerta nueva en la planta alta de Map003 (24,5) y retorno.

Siete marcos con dos estados (vacío / conseguido) y caja de nombre por marco:

| Diploma | Condición |
|---|---|
| La Ruta de Dios | switch 876 |
| **Liga Oscura** | **switch 948** `POKEMOD LIGA OSCURA COMPLETA` (nuevo) |
| Mundo Atlas | variable 319 ≥ 8 (ocho medallas del Circuito) |
| Glazed | switch 990 |
| Light Platinum | switch 991 |
| Liquid Crystal | switch 992 |
| TFOH | switch 993 |

El switch 948 se enciende al ganar al **último jefe de la arena de la Liga
Oscura** (parche en `apply_expansion_multiversal.mjs`: `bossEvent(..., esFinal)`
marca el switch en la victoria y en la revancha). Gráficos propios
`diploma_*.png`, `diploma_vacio.png`, `event_puerta_salon.png`, `event_armario.png`.

## 3. Pipeline reproducible

```bash
node tools/build_outfit_sheets.mjs          # assets_outfit/ → Graphics/Characters/
node tools/apply_outfits_dimensiones.mjs    # PokeMod_Atavios + vestidor + variables
node tools/apply_diplomas_planta.mjs        # Map2288 + diplomas + switch 948
# orden §3.6: apply_expansion_multiversal ANTES de apply_canon_arceus
npm run sync:paquete
node tools/apply_tone_safety_fix.mjs
node tools/apply_transition_safety_fix.mjs
npm run build:package && npm run verify:package
npm run build:corregido:zip
```

Verificación: `node tools/apply_outfits_dimensiones.mjs --verify`,
`node tools/apply_diplomas_planta.mjs --verify` (incluye la marca del switch
948 en la arena), `npm run verify:boot`, `npm test`.

Respaldos: `PokeModBackups/atavios/` (charsets y Scripts.rxdata previos) y
`PokeModBackups/diplomas_planta/` (mapas previos).

## 4. Prueba manual rápida (Kirin/Game.exe)

1. Entra a la casa de Ash: a la derecha de la cama hay un **ropero** — intercambia
   y prueba «Fijar este atavio» y «Atavio automático».
2. Viaja al barco hacia Glazed (Map2200): Ash debe vestir la playera al entrar
   y volver al clásico al regresar a Pueblo Paleta.
3. Sube a la planta alta: junto a la meseta, la **puerta nueva** abre el Salón
   de Diplomas. Los marcos del DLC ya conquistado deben mostrar el diploma; los
   pendientes muestran el marco vacío con su condición.
4. En la arena de la Liga Oscura, gana al quinto combate: al volver, el diploma
   de la Liga Oscura debe estar concedido (switch 948).
