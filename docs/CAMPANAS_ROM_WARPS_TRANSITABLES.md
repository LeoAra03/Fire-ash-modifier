# Warps de campaña sobre celdas transitables

> Regla: **ningún warp de campaña puede aterrizar en una pared.** Todos los
> enlaces reconstruidos de las ROMs invitadas dejan al jugador sobre una celda
> transitable en las cuatro direcciones y perteneciente a la misma región conexa
> que el retorno libre del mapa de destino —o, si ese retorno queda aislado, a
> la región con más celdas de aterrizaje—. En los pocos mapas que la ROM pinta
> como muro entero se admite caer sobre la celda de un evento de botón de
> acción: es el único suelo que existe allí.
>
> Generado por `tools/apply_rom_campaign_warp_targets.mjs`
> (regenerar con `npm run rom:warps`; comprobar con `npm run verify:rom:warps`).

## 1. Estado medido

| Dato | Valor |
|---|---:|
| Warps instalados revisados | 5061 |
| Warps esperados según el plano | 5061 |
| Mapas de destino distintos | 1056 |
| Warps que aterrizan en celda transitable | 5061 |
| Warps que apuntan a pared o a una región aislada | 0 |
| Warps sin arreglo posible | 0 |

Veredicto: **CUMPLE** · 5061/5061 warps sobre suelo pisable.

## 2. Corrección aplicada

Última ejecución que tuvo que cambiar algo (la herramienta es idempotente: si
vuelve a correr sobre mapas ya corregidos no reescribe nada).

| Dato | Valor |
|---|---:|
| Warps que ya aterrizaban bien | 1389 |
| Warps corregidos | 3672 |
| Comandos de transferencia reescritos | 3672 |
| Mapas reescritos | 878 |
| Warps sin arreglo posible | 0 |

## 3. Por campaña

| Campaña | Warps | Ya válidos | Corregidos |
|---|---:|---:|---:|
| glazed | 588 | 228 | 360 |
| light_platinum | 53 | 4 | 49 |
| liquid_crystal | 1739 | 562 | 1177 |
| tfoh | 872 | 248 | 624 |
| unbound | 1809 | 347 | 1462 |

## 4. Por qué fallaban

| Causa | Warps |
|---|---:|
| pared | 3533 |
| bolsillo-aislado | 139 |

El origen es conocido: el compilador estructural
(`tools/apply_complete_rom_campaigns.mjs`) reserva la celda (2, 2) de cada mapa
compilado y manda todos los warps a esa celda, porque en su propio pintor el
suelo entero es transitable. La reconstrucción 1:1 de las ROMs
(`tools/rom_nativo_mapas.mjs`) repinta después esos mismos mapas célula a
célula como la ROM —con sus muros— y sólo reabre las celdas que ocupa un
evento. (2, 2) no tiene evento, así que volvió a ser muro en buena parte de los
mapas.

La corrección no toca ni un tile: reescribe el comando de transferencia (código
201) de cada warp para que apunte a la celda válida más cercana a la que pedía.

## 5. Ejemplos de corrección

| Warp | Destino | Antes | Ahora | Causa |
|---|---|---|---|---|
| Map3001 · Warp 1 | Map3002 | (2, 2) | (57, 2) | pared |
| Map3001 · Warp 2 | Map3002 | (2, 2) | (57, 2) | pared |
| Map3002 · Warp 1 | Map3003 | (2, 2) | (2, 3) | pared |
| Map3002 · Warp 2 | Map3003 | (2, 2) | (2, 3) | pared |
| Map3003 · Warp 1 | Map3004 | (2, 2) | (2, 6) | pared |
| Map3003 · Warp 2 | Map3004 | (2, 2) | (2, 6) | pared |
| Map3003 · Warp 3 | Map3013 | (2, 2) | (4, 4) | pared |
| Map3004 · Warp 2 | Map3005 | (2, 2) | (2, 6) | pared |
| Map3004 · Warp 3 | Map3005 | (2, 2) | (2, 6) | pared |
| Map3006 · Warp 1 | Map3007 | (2, 2) | (3, 3) | pared |
| Map3006 · Warp 2 | Map3007 | (2, 2) | (3, 3) | pared |
| Map3009 · Warp 1 | Map3010 | (2, 2) | (2, 4) | pared |

## 6. Calidad del aterrizaje

Salidas transitables que tiene la celda elegida en cada warp corregido:

| Salidas | Warps |
|---|---:|
| con 0 salidas | 64 |
| con 1 salidas | 527 |
| con 2 salidas | 2035 |
| con 3 salidas | 1036 |
| con 4 salidas | 10 |

Las celdas sin salida son los mapas que la ROM pinta como muro entero: allí no
existe ningún suelo más que la celda del propio evento, así que el jugador cae
sobre ella y sale con el botón de acción. Las de una sola salida son los
callejones de un tile de ancho que también vienen de la geometría original de la
ROM: se pisa suelo, aunque sea estrecho.

## 7. Pendientes

- Ninguno: los 5.061 warps aterrizan en celda transitable.

## 8. Cómo se comprueba

```bash
npm run rom:warps         # corrige y regenera este informe
npm run verify:rom:warps  # falla si algún warp apunta a una pared
```

La comprobación va después de `npm run build:rom:campaigns` y de
`npm run rom:nativo:mapas`, porque mide la geometría que deja instalada la
reconstrucción 1:1.

Ya cuelga de `npm run verify:all` (justo detrás de
`npm run verify:rom:campaigns`). Si algún día se recompilan las campañas desde
cero, los warps volverán a apuntar a (2, 2): la verificación lo detectará y
`npm run rom:warps` lo dejará como estaba, porque la herramienta es idempotente.
