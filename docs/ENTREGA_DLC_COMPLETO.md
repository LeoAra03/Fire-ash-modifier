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


## Revisión R17 — rediseño de la batalla con Arceus Origen

Sobre lo entregado arriba, la revisión jugada pidió y se aplicó:

- [x] 3 invocaciones en toda la batalla (3 oleadas wild antes del 1v1); el 1v1 no invoca.
- [x] Arceus usa los sprites de mil manos (forma 19) desde el inicio del 1v1.
- [x] Sin crecimiento de escala innecesario durante la batalla.
- [x] Diálogos sin repeticiones (mazos agotables) y comentario con throttle.
- [x] Fondo negro corregido (reset de screen tone en el evento de la Cima).
- [x] Tras derrotar a los 5 secuencialmente arranca el 1v1 (oleadas → duelo).
- [x] Fase 6: movimientos GIGAMAX a libre albedrío como básicos (clases D000-D024).
- [x] Volus sólo bloquea la salida de la zona; sin curación previa; victoria →
      desaparecen los peregrinos del camino y Volus en 513/625.
- [x] Barras de vida visibles: las oleadas son batallas wild normales.

Ver `docs/CANON_ARCEUS.md` §7 para el detalle y `tools/apply_la_ruta_de_dios.mjs`
para la implementación. Cadena completa verificada: `npm test` en verde.


## Pack de arte R17 — sprites, fondos y atuendo

- [x] Sprites propios para las fases 1-5 de Arceus Origen (`ARCEUS_F1..F5`); la
      fase 6 usa la forma primigenia (sprite clásico).
- [x] Fondos de batalla nuevos: Calma Estelar, Tormenta Violeta, Apocalipsis
      Carmesí, Ritual de Invocación (oleadas) y Puerta del Ocaso (Volus).
- [x] Sin huida en el evento: `cannotRun` en oleadas y 1v1 + guardia `pbRun`
      para todo combate en los mapas 2031-2038.
- [x] Atuendo de Maestro para Ash (tipo hoja GBA: gorra roja, abrigo crema con
      dorado, capa azul marino con emblema dorado), entregado por Oak al
      completar La Ruta de Dios (switch 885), con sprites de overworld y de
      batalla (frente y espalda), integrado con el vestidor (atavio 9).

Ver `docs/CANON_ARCEUS.md` §8 y `tools/assemble_r17_art.py`. Cadena completa
verificada: `npm test` en verde.


## Kits de atuendos por dimensión (referencias del usuario)

- [x] Kit completo del Atuendo de Maestro (caminar/correr/bici/surf/pesca/batalla)
      según el diseño «Campeón del Mundo que derrotó a Arceus».
- [x] Kit completo «Viajero 1ª Gen» para los mundos crepypasta (sabor Rojo/Azul).
- [x] Recoloreado de bici/surf/pesca con la paleta de cada atuendo (sin sprites
      huérfanos al montar la bici o pescar).
- [x] Kits Glazed (slot 12), Light Platinum (13) y Liquid Crystal (14):
      completos (caminar/correr/bici/surf/pesca/batalla) y cableados a las
      dimensiones vía `PokeModAtavios` (ATA 3/4/5 → outfits 12/13/14).
- [x] Todos los kits con transparencia RGBA y estilo pixel-art GBA de Ash
      (marcos 32×48 y batalla 158×158/812×196, como los originales del motor).

Ver `docs/CANON_ARCEUS.md` §9. `npm test` en verde.
