# Banderas canónicas de La Ruta de Dios (868–875)

Este registro separa el bloque histórico de La Ruta de Dios del bloque de
emisiones del Multiverso. Los switches **940–947 no pertenecen a Arceus**:
`940–946` son los siete sellos del Monte Silver y `947` es el sello de RED en
la cumbre. El verificador de esos nombres es
`node tools/qa/name_multiverse_flags.mjs --verify`.

## Tabla canónica

| Switch | Nombre en `System.rxdata` | Significado | Escritura canónica |
|---:|---|---|---|
| 868 | *(reservado histórico; sin uso literal)* | No se asigna a un evento de La Ruta de Dios ni al Multiverso. Se conserva libre para no reabrir la antigua colisión de sellos. | Ninguna |
| 869 | `RUTA_DE_DIOS_ARCEUS_MERCY` | La merced única del Rotom sostuvo al equipo cuando no había candidatos válidos para continuar. | `pbArceusRotomMercy`, una sola vez por partida |
| 870 | `RUTA_DE_DIOS_UNLOCKED` | Volus abrió La Ruta de Dios después de reunir las 17 Tablas. | Evento de apertura de la ruta |
| 871 | `RUTA_DE_DIOS_DIALGA_DEFEATED` | Dialga de la quinta planta fue derrotado/capturado y la ruta puede continuar. | Cierre del combate de Map2035 |
| 872 | `RUTA_DE_DIOS_PALKIA_DEFEATED` | Palkia de la sexta planta fue derrotado/capturado y la ruta puede continuar. | Cierre del combate de Map2036 |
| 873 | `RUTA_DE_DIOS_ARCEUS_RESOLVED` | El duelo de Arceus terminó con resolución válida: derrota o captura; habilita el contenido posterior. | Secuencia de resolución del duelo de Map2037 |
| 874 | `RUTA_DE_DIOS_ARCEUS_CAUGHT` | El jugador capturó al Arceus divino después de agotar la sexta barra y superar el umbral de captura. | Commit de captura, sólo si la captura ocurrió |
| 875 | `RUTA_DE_DIOS_VOLO_DEFEATED` | Volus fue derrotado en el duelo posterior a la captura de Arceus. | Victoria del combate de Volus |

El cierre global **876** (`RUTA_DE_DIOS_COMPLETED`) queda fuera del rango
solicitado, pero se documenta aquí para evitar una lectura incompleta: se
enciende al terminar el evento temporal de Volus y no sustituye a ninguna de
las ocho banderas 868–875.

## Reglas de escritura

1. **Ganar Arceus no escribe el bloque entero.** La resolución escribe 873; 874
   sólo se confirma si hubo captura. No se escriben 869, 870, 871, 872 ni 875
   como efecto lateral de esa victoria.
2. **La merced no es una victoria.** 869 registra únicamente el salvamento del
   Rotom y no abre puertas ni cuenta el duelo.
3. **Derrota o abandono no falsifican el progreso.** La captura se mantiene en
   `false` al iniciar el encuentro y sólo se hace commit después del rollback
   si la captura fue válida; una derrota deja disponible el reintento.
4. **El orden previo es explícito.** 870, 871 y 872 pertenecen a la progresión
   de apertura y de las plantas; 875 y 876 pertenecen al cierre posterior con
   Volus. Ninguno se reutiliza como sello de una emisión.
5. **Las emisiones usan otro bloque.** Los jefes de Map2023–Map2029 escriben
   940–946, RED escribe 947, y cada escritura está detrás de su self-switch A
   para que la derrota permanente y el contador `v[264]` no se dupliquen.

## Evidencia reproducible

- `npm run verify:ruta_de_dios` — EXIT 0; siete plantas, aproximación, Arceus,
  Volus, equipos, switches y scripts.
- `node tools/qa/arceus_scope_map.mjs --audit` — censo estático del alcance de
  las constantes y llamadas de La Ruta de Dios.
- `node tools/qa/name_multiverse_flags.mjs --verify` — EXIT 0; comprueba que
  940–947 tienen nombres del bloque correcto y que no se usan como banderas de
  Arceus.
- `npm run verify:multiverse` — EXIT 0; comprueba las ocho batallas del Monte
  Silver (siete emisiones + RED), sellos, self-switch, contador y revancha.

La prueba interactiva de Game.exe/Kirin no se declara ejecutada en este
checkout; este archivo registra la separación estática de flags y no reemplaza
el playtest manual.
