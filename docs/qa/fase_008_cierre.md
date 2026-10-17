# Cierre FASE 008 — arte, audio, progresión y entrega (tareas 701–799)

Medición: 2026-10-17. Este acta distingue las comprobaciones estáticas de
las pruebas que necesitan Game.exe/Kirin o una escucha humana.

## Cambios instalados

- Se auditó el armario de Ash: **11 atavíos**, variables 316/317 y exclusiones
  de Team Rocket conservadas. `ash_outfit_unbound.png` queda comprobado en
  128×192 y cada charset declarado existe.
- Se completó el contrato Game Boy de Dimensional Nightmare para los mapas que
  aún tenían eventos compartidos: se ajustaron Map2142 y Map2192–2194; el
  verificador queda en **260 imágenes, 161 mapas, máximo 3 personajes y 1
  Poké Ball por mapa**. El manifiesto de arte mantiene 7 assets DN y sus hashes.
- Se actualizó `pokemon_fire_ash/Credits.txt` con la procedencia de los
  outfits y del arte DN, y se dejó explícita la política de campañas: son
  adaptaciones estructurales con recursos de Fire Ash, no emulación ni
  redistribución de texto/arte de fangames.
- Se publicó en `docs/INSTALAR_Y_JUGAR.md` el orden recomendado: postgame 429,
  Ruta de Dios 870/876, campañas libres después de la puerta, Liga Oscura y
  lectura de estado en Oak/hubs.
- Se sincronizó el paquete directo y sus ZIPs después de los cambios de mapas;
  la comprobación de integridad confirma 2 616 archivos.
- Se corrigieron dos falsos rojos de verificadores: las variantes de
  `trainers.dat` ahora se validan por secuencia cubierta (no por ordinal
  rígido) y los nombres diegéticos históricos de Glazed se aceptan en sus
  mapas de entrada/final. Los 2 índices huérfanos legacy quedan como aviso
  explícito, no como fallo de tipos.
- `tools/plan900/fase008_check.mjs` concentra el inventario con hashes, assets,
  audio, gates, política ROM, `.gitignore` y fixtures Game1/Game2.

## Verificadores ejecutados

| Comando | Resultado |
|---|---|
| `npm run audit:plan900:fase008` | EXIT 0 — 769/769 recursos, 11 atavíos, 7 assets DN |
| `npm run verify:atavios` / `verify:disfraz` / `verify:ash:unbound` | EXIT 0 |
| `npm run dn:art:verify` / `npm run dn:gameboy:verify` | EXIT 0 |
| `npm run verify:ambience` / `npm run dn:audio:verify` | EXIT 0 — 11 pistas y 149 mapas DN |
| `npm run verify:trainer_types:campanas` | EXIT 0 — 0 tipos inválidos; 2 avisos legacy declarados |
| `npm run verify:rom:campaigns:plan` / `verify:rom:campaigns` | EXIT 0 — 1 227 mapas, 3 625 actores, 5 061 warps, 794 combates |
| `npm run verify:glazed` / `verify:light_platinum` / `verify:liquid_crystal` | EXIT 0 |
| `npm run verify:ruta_de_dios` / `node tools/apply_extended_level_cap.mjs --verify` | EXIT 0 — Arceus 200, techo general 175 |
| `npm run verify:canon:arceus` / `verify:expansion:plan` / `verify:expansion` / `verify:multiverse` | EXIT 0 |
| `npm run verify:oak:hub` / `verify:grandeur:bag` / `verify:abra:tower` / `verify:defeats` / `verify:wild` / `verify:monte_silver` / `verify:isla_espejo` | EXIT 0 |
| `npm run verify:visor` / `verify:diplomas` / `verify:map-reference` | EXIT 0 |
| `npm run verify:package` / `npm run verify:corregido:zip` | EXIT 0 — ZIPs sincronizados |
| `npm run verify:presupuesto` | EXIT 0 con las justificaciones de presupuesto ya documentadas |

El cierre de audio queda documentado como escucha **automática**: los MIDI y
BGM se validaron por cabecera, hash, asignación, volumen y fin de pista, pero
no se afirma una escucha humana dentro de esta sesión.

## Dependencia que queda bloqueada

`npm run dn:terreno:verify` y el tramo `dn:verify:all` no pueden ejecutarse
porque falta el catálogo binario/generado
`content/dimensional_nightmare_tiles_2x.json`, que sólo se crea después de
aportar los recortes de referencia indicados por
`reference/dimensional_nightmare/README.md`. `npm run verify:all` alcanza las
puertas de campañas, arte y ZIP y se detiene en esa dependencia; no se inventa
el catálogo ni PNG sintéticos para declarar el terreno en verde.

Las corridas reales en Game.exe, el caminante automático y el playtest de ritmo
siguen siendo QA manual pendiente; las cuotas se registran como tales y no se
presentan como realizadas.
