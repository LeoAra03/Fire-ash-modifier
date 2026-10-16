# Presupuesto de tamaño del artefacto de sesión

Fase 14/2680, tarea 34: *fijar el tamaño máximo del ZIP raíz y no superar los 128 MB
combinados del artefacto de sesión sin justificación escrita.*

- **Comprobación**: `npm run verify:presupuesto` (dentro de `npm test`).
- **Autotest de las reglas**: `npm run verify:presupuesto:selftest`.
- **Política editable**: [`content/artifact_budget.json`](../content/artifact_budget.json).
- **Tope duro cableado en el build**: `npm run build:corregido:zip` y
  `npm run verify:corregido:zip` fallan si el ZIP raíz pasa de 64 MiB.

## Reglas

| # | Límite | Tope | ¿Justificable? |
|---|---|---|---|
| 1 | ZIP raíz (`Fire-Ash-Scripts-Corregidos.zip`) | **64 MiB** | No: tope duro |
| 2 | Entregables versionados (ZIP raíz + `Scripts_corregido/*.zip`) | **128 MiB** | Sí, con techo explícito |
| 3 | Insumos de terceros (`.zip`/`.rar`/`.7z` versionados que no se publican) | **128 MiB** | Sí, con techo explícito |
| 4 | Repositorio completo (todo lo versionado) | 1 600 MiB | Sí, con techo explícito |

Unidad de medida: **1 MiB = 1 048 576 bytes**. El techo de la plataforma se lee
como 128 MiB (134 217 728 B); quien lo leyera como MB decimales (128 000 000 B =
122,07 MiB) queda cubierto igualmente por los techos justificados de 136 y
280 MiB que se declaran abajo, porque el exceso sigue siendo el mismo artefacto
y está motivado por escrito.

Una excepción **no es permanente**: la justificación declara un `techo_mb` y, si
lo medido lo supera, la comprobación falla con `JUSTIFICACIÓN VENCIDA` y obliga a
recortar o a reescribir el motivo. Así el número nunca "se olvida" en un límite
antiguo.

## Estado medido (2026-10-15)

| Grupo | Archivos | Peso | Tope | Resultado |
|---|---|---|---|---|
| ZIP raíz | 1 (2 616 entradas) | 46,58 MiB | 64 MiB | OK |
| Entregables versionados | 4 | 133,34 MiB | 128 MiB | JUSTIFICADO (+5,34 MiB) |
| Insumos de terceros | 32 | 260,25 MiB | 128 MiB | JUSTIFICADO (+132,25 MiB) |
| Repositorio completo | 29 235 | 1 445,05 MiB | 1 600 MiB | OK |

Detalle de los entregables: `Fire-Ash-Scripts-Corregidos.zip` 46,58 MiB ·
`Scripts_corregido/Fire_Ash_Paquete_Directo.zip` 60,76 MiB ·
`Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip` 14,32 MiB ·
`Scripts_corregido/Dimensional_Nightmare_QA.zip` 11,67 MiB.

Detalle de los insumos: porymap 1-15 = 144,06 MiB · Tiled 1-4 = 44,26 MiB ·
ROMS (1..3) = 32,56 MiB · Pokemon unbound part1-2 = 16,51 MiB · swablu (3) =
15,81 MiB · pokecrystal, pokered, timps-swarm, pokemon-agent, rvpacker y
porygion ≈ 7,06 MiB.

## Justificación escrita (tarea 34)

**Por qué el ZIP raíz tiene tope propio de 64 MiB.** Es el único artefacto que se
descarga suelto desde la raíz y el que reconstruye `npm run build:corregido:zip`
en cada fase con contenido nuevo. Fijarlo en la mitad del techo de sesión impide
que, por sí solo, se coma el presupuesto completo; hoy ocupa 46,58 MiB, de modo
que la regla ya está actuando con 17,42 MiB de margen. El tope es además el único
de los cuatro que **no admite excepción**: el resto de entregables sí pueden
crecer con motivo escrito, este no.

**Por qué el grupo de entregables supera los 128 MiB en 5,34 MiB.** Cada ZIP es
la vía de instalación de un contenido distinto (scripts corregidos, paquete
directo descomprimible sobre la raíz del juego, mapas referenciales y QA de
Dimensional Nightmare) y los tres primeros están enlazados desde `README.md` y
`Scripts_corregido/LEEME.md`; borrarlos rompería enlaces publicados. Se declara
techo de **136 MiB** en `content/artifact_budget.json` (id `entregables`) y
ningún entregable nuevo puede añadirse sin subir ese techo con motivo explícito.

**Por qué los insumos de terceros suman 260,25 MiB.** No son entregables: son la
materia prima con la que ya se generaron los PNG, tilesets y sprites que sí están
versionados (flujos `rom:*`, `toolkit:*`, `porymap`). Podarlos es una decisión
destructiva que exige confirmación del usuario, así que en esta fase se declara
techo de **280 MiB** (id `insumos`) y se dejan escritas, con su ahorro medido, las
rutas de poda de la sección siguiente.

**Por qué el total versionado (1 445,05 MiB) no contradice la regla.** El techo de
128 MiB se fija sobre lo que una sesión produce y publica, no sobre el material
preexistente heredado (sprites, mapas, documentos y paquetes que ya describe
`README.md`). Fase 34 no puede podar ese material sin destruir contenido del
usuario. Se declara techo de **1 600 MiB** (id `repositorio`) para que una fase
futura que lo infle tenga que justificarlo, y cualquier aumento obliga a
actualizar esa entrada con el motivo.

## Rutas de poda (medidas, no ejecutadas)

| Paso | Qué se quita | Ahorro | Insumos después | ¿Vuelve a ≤128 MiB? |
|---|---|---|---|---|
| P1 | `Tiled-*.rar` (4 volúmenes, binarios Linux del release oficial) | 44,26 MiB | 215,99 MiB | No |
| P2 | P1 + `ROMS (1..3).rar` + `Pokemon unbound gba.part*.rar` | 49,07 MiB más | 166,92 MiB | No |
| P3 | P2 + `porymap-master.part*.rar` (15 volúmenes) | 144,06 MiB más | 22,86 MiB | **Sí** |
| E1 | Eliminar la duplicación ZIP raíz ↔ paquete directo | hasta 46,58 MiB en el grupo de entregables (86,76 MiB) | — | **Sí** |
| E2 | Alternativa a E1: dejar el ZIP raíz en ≤ 41,24 MiB | 5,34 MiB | — | **Sí** |

`npm run verify:presupuesto` imprime el objetivo exacto de E2 calculado con las
medidas del día: hoy **41,24 MiB** para el ZIP raíz.

Antes de ejecutar P1-P3 hay que comprobar que los PNG, tilesets y sprites
derivados siguen versionados (`npm run rom:nativo:verify`, `npm run toolkit:index`)
y que no se planean más reingestas desde esos archivos. La poda no forma parte de
esta fase.

## Cómo se comprueba

```bash
node tools/qa/artifact_budget_check.mjs            # tabla y código de salida
node tools/qa/artifact_budget_check.mjs --json     # medición legible por máquina
node tools/qa/artifact_budget_check.mjs --selftest # 7 reglas, sin tocar el disco
npm run verify:corregido:zip                       # tope duro del ZIP raíz
```

El autotest cubre: medición por debajo de los topes, ZIP raíz sobre 64 MiB (falla
siempre), grupo de entregables sobre 128 MiB sin justificación (falla), el mismo
exceso con justificación vigente (pasa y se informa), justificación vencida
(vuelve a fallar), entregable ausente del repositorio y aritmética del objetivo de
recorte.

## Protocolo para la próxima fase que toque un paquete

1. Ejecutar `npm run verify:presupuesto` antes y después del cambio.
2. Si el resultado sale `EXCEDIDO` o `JUSTIFICACIÓN VENCIDA`: recortar. Solo si
   el recorte es imposible, actualizar `content/artifact_budget.json` subiendo el
   `techo_mb` y reescribiendo el `motivo` con la causa real y la fecha.
3. Si el ZIP raíz se acerca a 64 MiB, el paquete directo es el que se recorta:
   el tope del ZIP raíz no se negocia dentro de una sesión.
4. Este documento y la política se actualizan en el mismo commit que el cambio de
   paquete; si no, la tabla de arriba miente.
