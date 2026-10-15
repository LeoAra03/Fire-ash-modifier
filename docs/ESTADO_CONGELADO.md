# Estado congelado

Generado: 2026-10-15T04:11:26.319Z

Inventario de solo lectura del juego vivo (`pokemon_fire_ash/Data`) y de los hashes SHA-256 de `Data/`, `Scripts/` y `tools/`. No modifica mapas, scripts ni partidas.

## Bitácora de fases

### FASE 1 — Línea base `npm test`

- **Fecha de la corrida:** 2026-10-15 (Node v22.22.3, npm 10.9.8, dependencias instaladas con `npm ci`, 54 paquetes).
- **Resultado global:** `npm test` completo terminó con **código de salida 0**.
- **Verificadores en rojo: NINGUNO.** No hay ningún paso del suite en estado fallido antes de iniciar las fases del backlog.
- `pretest` (`build:teckel`): OK — `Fire_Ash_Ciudad_Teckel_Paraiso.zip` (72 entradas).
- Tests directos OK: `marshal`, `history`, `integration` (web/js), `external_authoring`, `scripts_dangling_calls`, `verify_arceus_recursos`, `arceus_scope_map --audit` (global y sobre `PokeMod_CanonArceus`), `verify_arceus_action_safety`, `arceus_shield_harness`, `arceus_moves_harness`, `tone_safety`, `package_integrity`, `dn_runtime_support`.
- `npm run` verificados OK: `verify:zmenu`, `verify:graficos`, `verify:ruby`, `verify:mapas`, `verify:boot`, `verify:teckel`, `verify:visor`, `verify:lideres`, `verify:glazed`, `verify:light_platinum`, `verify:liquid_crystal`, `verify:canon:arceus`, `verify:arceus:sprites`, `verify:diplomas`, `verify:corregido:zip` (2616 archivos, 46.6 MB), `verify:ruta_de_dios`.
- Suite maestra final (`test:atlas:master`): **76 258 aserciones superadas, 0 fallos** (1227 mapas de campañas ROM, 8742 warps, 829 combates, 104 mapas DN, 946 eventos creepypasta).
- **Efecto colateral determinista del suite:** el `pretest` (`build:teckel`) re-escenifica `Scripts_corregido/Ciudad_Teckel_Paraiso/Data/` desde el juego vivo; los 5 archivos binarios de ese stage estaban desactualizados respecto a HEAD y quedaron resincronizados (rebuild idempotente, verificado con doble corrida e igual hash). No es un error: es la salida oficial del suite.

### FASE 3 — Regeneración del inventario congelado

- **Regenerado:** `node tools/inventario_congelado.mjs` (2026-10-15). Reescrito `tools/inventario_congelado.json` y este documento; `--verify` posterior en verde.
- **Archivos hasheados confirmados: 5417** (Data 5215, Scripts 0, tools 202) — sin desviaciones de conteo.
- Única desviación de hashes previa a regenerar: los 5 archivos del stage Teckel resincronizados por el `pretest` de la FASE 1 (ver arriba), absorbidos ahora en el JSON oficial. Ningún otro hash cambió.
- Estable tras regenerar: mapas 3465 · scripts 409 · pares ID 9197 · colisiones 0 · rango reservado libre.

### FASE 4 — Verificación del rango reservado

- **`node tools/inventario_congelado.mjs --verify`: exit 0** — "hashes, mapas, anclas, pares y rango reservado coinciden" contra el JSON oficial de la FASE 3.
- `unassignedPortionFree: true`. **Switches 701–867:** 167/167 con asignación canónica, 0 sin asignación, 0 de la porción no asignada en uso. **Variables 101–263:** 163/163 con asignación canónica, 0 sin asignación, 0 de la porción no asignada en uso.
- El rango reservado **sigue libre en su porción no asignada**: ningún ID de esa porción tiene nombre ni uso literal. Sin cambios de contenido; solo este registro.

### FASE 5 — Backup ZIP pre-escritura

- **Rehecho con la herramienta oficial:** `python3 tools/backup.py pokemon_fire_ash` → `pokemon_fire_ash/PokeModBackups/backup_20261015_041420.zip` (19.5 MB, 3530 entradas).
- Cobertura verificada: **3529/3529 archivos de `Data/`** (coincide 1:1 con el disco) **+ `Data/Scripts.rxdata` incluido** + `Game.ini`. Integridad del ZIP comprobada con `testzip`: sin corrupción.
- Creado **antes de la primera escritura del plan**; `PokeModBackups/` está gitignored por convención del repo (artefacto local), así que el ZIP vive en el árbol de trabajo y este registro documenta su existencia, huella y fecha.

## Totales

- **Total de mapas:** 3465 archivos `Map*.rxdata` (3465 entradas en `MapInfos.rxdata`).
- **Total de scripts:** 409 secciones en `pokemon_fire_ash/Data/Scripts.rxdata`.
- **Total de pares ID usados:** 9197 (887 switches + 293 variables + 8017 self-switches).
- **Colisiones detectadas:** 0.

## Rango reservado

Confirmado: el rango reservado (switches 701–867, variables 101–263) **está libre en su porción no asignada**. Switches sin asignación canónica: 0. Variables sin asignación canónica: 0. Ningún ID de esa porción tiene nombre ni uso literal.

Asignación canónica cubierta: switches 167/167, variables 163/163. La porción asignada es 701–707 (base), 708–747 (anclas Tier 1), 748–867 (rutas Tier 2), variables 101–103 (contadores), 104–143 (decisiones Tier 1) y 144–263 (decisiones Tier 2).

## Mapas por rango

- **Horizontes** 1001–1020: **20** / 20
- **Atlas Mil** 1021–2020: **1000** / 1000
- **Dimensional Nightmare** 2040–2190: **151** / 151
- **NEXO** 2136–2140: **5** / 5 (subconjunto de dn; no sumar)
- **Liga Oscura** 2141–2142: **2** / 2 (subconjunto de dn; no sumar)
- **Team Rocket** 2220–2221: **2** / 2

NEXO y Liga Oscura caen dentro de Dimensional Nightmare. Sus conteos no se suman al total.

## Anclas Tier 1

40 anclas, mapIds 1021–1996, switches 708–747, variable compartida 103.

| # | Mapa | Título | Switch | Nombre | Variable |
|---:|---:|---|---:|---|---:|
| 1 | 1021 | Santuario de la Última Campana | 708 | POKEMOD ATLAS SEAL 01 BELL | 103 |
| 2 | 1046 | La Copa del Huevo Vacío | 709 | POKEMOD ATLAS SEAL 02 | 103 |
| 3 | 1071 | El Campeón de Fecha Imposible | 710 | POKEMOD ATLAS SEAL 03 | 103 |
| 4 | 1096 | El Gremio de la Camilla Vacía | 711 | POKEMOD ATLAS SEAL 04 | 103 |
| 5 | 1121 | Operación Rescate Demasiado Perfecto | 712 | POKEMOD ATLAS SEAL 05 | 103 |
| 6 | 1146 | La Sombra que Eligió Quedarse | 713 | POKEMOD ATLAS SEAL 06 | 103 |
| 7 | 1171 | El Jardín de los Dos Juramentos | 714 | POKEMOD ATLAS SEAL 07 | 103 |
| 8 | 1196 | La Persona Fuera del Encuadre | 715 | POKEMOD ATLAS SEAL 08 | 103 |
| 9 | 1221 | El Festival que Olvidó su Motivo | 716 | POKEMOD ATLAS SEAL 09 | 103 |
| 10 | 1246 | La Carta que Recuerda a su Jugador | 717 | POKEMOD ATLAS SEAL 10 | 103 |
| 11 | 1271 | El Compañero del Minuto Cero | 718 | POKEMOD ATLAS SEAL 11 | 103 |
| 12 | 1296 | El Punto que Nadie Quiso Marcar | 719 | POKEMOD ATLAS SEAL 12 | 103 |
| 13 | 1321 | La Señal Hecha de Ausencias | 720 | POKEMOD ATLAS SEAL 13 | 103 |
| 14 | 1346 | La Ciudad a la que Dieron Cuerda | 721 | POKEMOD ATLAS SEAL 14 | 103 |
| 15 | 1371 | El Mosaico de los Nombres Imposibles | 722 | POKEMOD ATLAS SEAL 15 | 103 |
| 16 | 1396 | La Receta que Lloraba por Otros | 723 | POKEMOD ATLAS SEAL 16 | 103 |
| 17 | 1421 | El Caso de las Cuatro Mediasnoches | 724 | POKEMOD ATLAS SEAL 17 | 103 |
| 18 | 1446 | El Museo de lo Todavía No Perdido | 725 | POKEMOD ATLAS SEAL 18 | 103 |
| 19 | 1471 | El Arrecife que Llegó Después | 726 | POKEMOD ATLAS SEAL 19 | 103 |
| 20 | 1496 | Los Dos Nombres del Cometa | 727 | POKEMOD ATLAS SEAL 20 | 103 |
| 21 | 1521 | La Central de las Cenizas Vivas | 728 | POKEMOD ATLAS SEAL 21 | 103 |
| 22 | 1546 | La Profecía Escrita Después | 729 | POKEMOD ATLAS SEAL 22 | 103 |
| 23 | 1571 | La Ciudad que Pagaba con Recuerdos | 730 | POKEMOD ATLAS SEAL 23 | 103 |
| 24 | 1596 | Las Cartas de una Familia Incompatible | 731 | POKEMOD ATLAS SEAL 24 | 103 |
| 25 | 1621 | El Mercado de los Umbrales Pequeños | 732 | POKEMOD ATLAS SEAL 25 | 103 |
| 26 | 1646 | La Estatua que Ensayaba Ciudades | 733 | POKEMOD ATLAS SEAL 26 | 103 |
| 27 | 1671 | La Mina de las Decisiones Sólidas | 734 | POKEMOD ATLAS SEAL 27 | 103 |
| 28 | 1696 | El Peaje de los Sueños Prestados | 735 | POKEMOD ATLAS SEAL 28 | 103 |
| 29 | 1721 | El Campeón de las Dos Banderas | 736 | POKEMOD ATLAS SEAL 29 | 103 |
| 30 | 1746 | La Academia del Error Permitido | 737 | POKEMOD ATLAS SEAL 30 | 103 |
| 31 | 1771 | La Frecuencia que Pide Permiso | 738 | POKEMOD ATLAS SEAL 31 | 103 |
| 32 | 1796 | El Héroe que Pidió un Nombre Pequeño | 739 | POKEMOD ATLAS SEAL 32 | 103 |
| 33 | 1821 | La Victoria que Nadie Ganó | 740 | POKEMOD ATLAS SEAL 33 | 103 |
| 34 | 1846 | La Excavación que Fabricó su Pasado | 741 | POKEMOD ATLAS SEAL 34 | 103 |
| 35 | 1871 | El Refugio que Contestaba Solo | 742 | POKEMOD ATLAS SEAL 35 | 103 |
| 36 | 1896 | El Registro que No Pudo Clasificarte | 743 | POKEMOD ATLAS SEAL 36 | 103 |
| 37 | 1921 | El Acertijo que Cambiaba la Pregunta | 744 | POKEMOD ATLAS SEAL 37 | 103 |
| 38 | 1946 | El Enemigo que Alguien Recordó por Ti | 745 | POKEMOD ATLAS SEAL 38 | 103 |
| 39 | 1971 | La Copia que Aprendió a Despertar | 746 | POKEMOD ATLAS SEAL 39 | 103 |
| 40 | 1996 | El Final que Dejó Cuarenta Puertas Abiertas | 747 | POKEMOD ATLAS SEAL 40 | 103 |

## Colisiones

- Ninguna.

## Hashes

- Archivos hasheados: 5417 (Data 5215, Scripts 0, tools 202).
- Directorios `Scripts/` encontrados: 0 archivo(s). Las secciones Ruby del juego están dentro de `Data/Scripts.rxdata`.
- Algoritmo: SHA-256. El detalle por archivo está en `tools/inventario_congelado.json`.
- Expresiones dinámicas (no se tratan como ID libre): 71.
- Archivos no legibles durante el escaneo: 0.

Regenerar: `node tools/inventario_congelado.mjs`. Comprobar sin reescribir: `node tools/inventario_congelado.mjs --verify`.
