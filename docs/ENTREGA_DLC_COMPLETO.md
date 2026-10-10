# Entrega: Fire Ash + DLC completo

Fecha: 2026-10-10 · Rama `arena/03e77d51-fire-ash-modifier` · commit `6332dbf5`

## Criterios — todos cumplidos

| # | Criterio | Estado | Dónde se verifica |
|---|---|---|---|
| 1 | Arceus mega evoluciona con los sprites | ✅ | `node tools/apply_arceus_mega.mjs --verify` — Forma Origen (form 19, `ARCEUS_19`, 820 BST, mil brazos) con Front/Back/Icons/Characters/shiny + audio; forma 18 (hada) restaurada |
| 2 | Diálogos sin solapes; caja por personaje | ✅ | `node tools/qa/dialogos_harness.mjs` (motor Ruby) + `node tools/apply_cajas_dialogo.mjs --verify` — `PokeMod_Dialogos` con `sp[Nombre]`, nombre del evento y cola anti-solape |
| 3 | Todas las aventuras de los ROMs, Ash colado en el mundo | ✅ | `npm run verify:rom:campaigns` — 807 mapas · 5.516 NPC · 3.252 warps · 1.059 combates (Glazed, Light Platinum, Liquid Crystal, TFOH) + atavios de Ash por dimensión |
| 4 | Sprites de Ash para cada dimensión (ponerse en ambiente) | ✅ | 6 charsets propios (`ash_outfit_*.png`) + atavio automático al entrar a cada dimensión (`PokeMod_Atavios`) |
| 5 | Cambiar de outfits en la casa de Ash | ✅ | Ropero en Map003 planta baja (8,5): 9 atavios, fijar/automático |
| 6 | Extensión 2ª planta con más diplomas (Liga Oscura, ligas ROM, Atlas) | ✅ | Map2288 «Salón de Diplomas» con 7 marcos: Ruta de Dios, Liga Oscura (switch 948), Atlas (var 319 ≥ 8), Glazed (990), Light Platinum (991), Liquid Crystal (992), TFOH (993) |
| 7 | Listo para jugar, libre de fallos de script | ✅ | `npm test` verde · `verify:boot` verde · tono/transición verdes · `sync:paquete` + ZIPs verificados |

## El entregable

- **`Scripts_corregido/`** (el juego arreglado): `Scripts.rxdata`, `Paquete_directo/`
  (1.183 archivos idénticos al juego), `Fire_Ash_Paquete_Directo.zip` (50 MB) y
  `Fire-Ash-Scripts-Corregidos.zip` (34.2 MB) — todo sincronizado y verificado.
- `pokemon_fire_ash/` es la fuente viva; la cadena de reconstrucción §6 completa
  se ejecutó (expansión → canon → atavios → diplomas → sync → safety → paquetes).

## Novedades de esta entrega

1. **Mega Arceus** (`tools/apply_arceus_mega.mjs`): 8 sprites + SE propios; la
   Forma Origen entra en el duelo de La Ruta de Dios.
2. **Cajas de diálogo por personaje** (`tools/lib/pokemod_dialogos.rb`): cada
   personaje habla con su propio nombre sobre una caja avanzada; los mensajes se
   serializan y no se solapan nunca (también en combate).
3. **Atavios por dimensión** (`docs/ATAVIOS_Y_DIPLOMAS.md`): Ash se viste solo al
   viajar (Atlas, Creepypasta, Glazed, Light Platinum, Liquid Crystal, TFOH) y el
   ropero de su casa permite cambiarlo o fijarlo (variables 316/317).
4. **Salón de Diplomas** (Map2288): nueva puerta en la planta alta; los marcos se
   llenan al completar cada desafío. El de la Liga Oscura usa el switch nuevo 948,
   que se enciende al vencer al Campeón Silencioso.

## Cómo jugar

Descomprime `Fire-Ash-Scripts-Corregidos.zip` (o usa `Scripts_corregido/` tal
cual) y ejecuta el juego con tu ejecutable habitual (Kirin/Game.exe). Rutina de
prueba rápida: `docs/ATAVIOS_Y_DIPLOMAS.md` §4.

## Deshacer

Cada instalación respalda lo que toca en `PokeModBackups/` (`arceus_mega/`,
`cajas_dialogo/`, `atavios/`, `diplomas_planta/`, …); restaura con `cp -f` desde
esas carpetas, según la Regla de Oro del repositorio.
