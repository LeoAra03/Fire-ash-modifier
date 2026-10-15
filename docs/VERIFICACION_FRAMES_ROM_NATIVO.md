# Verificación de los 9 frames 4bpp por personaje (fase 51)

> Antes de armar cada hoja RMXP de 4×4 de un personaje nativo de ROM se
> comprueban sus **nueve frames 4bpp**: las tres poses quietas (abajo, arriba y
> lado) y sus seis pasos. La verificación es una puerta: si los frames no pasan
> el contrato, la hoja no se escribe.

Herramienta: `tools/rom_nativo_sprites.mjs` (con el lector PNG sin dependencias
de `tools/forense/png.mjs`).

```bash
npm run selftest:rom:nativo:frames     # comprobaciones sintéticas (16)
npm run verify:rom:nativo:frames       # audita las 667 hojas escritas
npm run repair:rom:nativo:frames       # cubre los huecos y actualiza el plan
npm run verify:rom:nativo              # frames + mapas + asignación a eventos
```

## El contrato de los nueve frames

El orden lo fija la tabla `overworld_frame` de Gen 3 y vive en una sola
constante (`FRAMES`), que usan el validador, la reparación y la composición de
la hoja para que no puedan divergir:

| Frame | Qué es | Dónde va en la hoja 4×4 |
|---|---|---|
| 0 | pose quieta mirando abajo | fila 0, columnas 0 y 2 |
| 1 | pose quieta mirando arriba | fila 3, columnas 0 y 2 |
| 2 | pose quieta de lado | fila 1, columnas 0 y 2 |
| 3, 4 | pasos de abajo | fila 0, columnas 1 y 3 |
| 5, 6 | pasos de arriba | fila 3, columnas 1 y 3 |
| 7, 8 | pasos de lado | fila 1, columnas 1 y 3 |

Fila 2 es el espejo horizontal de la fila 1 (la ROM sólo trae el lado
izquierdo). Los nueve frames son 4bpp: el tamaño en bytes es `ancho×alto/2` (la
comprobación lleva el `bpp` como parámetro, así que un juego de frames de 2bpp
—cartuchos GB/GBC de cuatro tonos— se rechaza con ese mismo control).

**Errores (la hoja no se arma):** no hay nueve frames, medidas fuera de la
rejilla de tiles 8×8, el tamaño no cabe en bytes de 4bpp, un frame no trae los
bytes RGBA que le tocan, o falta la pose quieta de una dirección (no hay nada
que dibujar en esa fila).

**Avisos (se reparan o se aceptan):** un frame de paso llega vacío (se cubre) o
un paso repite la pose quieta del personaje (animación estática).

## Qué se reparó al auditar las hojas ya entregadas

La auditoría de las **667 hojas** de `pokemon_fire_ash/Graphics/Characters`
encontró **155 frames vacíos en 41 personajes (6,1 %)**: todos los píxeles con
el índice 0, el color transparente. En RMXP eso se ve fatal, porque esas celdas
son fotogramas reales: el personaje parpadea al caminar o desaparece entero si
el hueco es la pose quieta de una dirección.

| Campaña | Hojas con huecos | Cubiertos con su pose quieta | Prestados de la fila de abajo |
|---|---|---|---|
| 0 · Glazed | 27 | 115 | 22 |
| 2 · Liquid Crystal | 6 | 5 | 2 |
| 4 · Unbound | 8 | 9 | 2 |
| **Total** | **41** | **129** | **26** |

Regla de reparación (la misma en la extracción y en la auditoría):

1. **Hueco con pose quieta propia:** la celda se cubre con la pose quieta de la
   **misma** dirección. Mismo dibujo, no se inventa arte.
2. **Dirección sin ninguna pose:** once personajes de Glazed (objetos que en la
   ROM sólo traen el frente, como `g71`–`g75`, `g78`, `g158`) no tienen arte de
   lado ni de arriba. Se **presta** el frame equivalente de la fila de abajo,
   que es lo único que garantiza que el personaje nunca quede invisible.
3. La reparación respeta la propia regla de la hoja: la columna 2 vuelve a
   repetir la 0 y la fila 2 vuelve a ser el espejo de la 1.

Cada ficha del plan (`content/rom_nativo_sprites.json`) guarda lo que se tocó en
`reparados` (paso cubierto con la pose quieta) y `prestados` (frame prestado de
la fila de abajo), así que el hueco original sigue siendo rastreable y una
reextracción con las ROMs lo puede volver a medir.

## Estado tras la fase

- `npm run verify:rom:nativo:frames` → **0 fallos** sobre 667 hojas: los nueve
  frames se recuperan de cada hoja de 4×4 sin huecos, con ≤16 colores por hoja
  (4bpp), la pose quieta repetida en las columnas 0 y 2 y el espejo correcto en
  la fila 2.
- `npm run verify:rom:nativo` empieza por esta comprobación; sigue fallando
  después por la verificación de mapas, que es anterior a esta fase (celdas que
  no coinciden con el ROM en `Map3125`, `Map3323`, `Map3385`, `Map3805`,
  `Map3839`, `Map3874` y dos eventos sobre celdas sólidas en `Map3120`).
- Quedan **336 avisos** que no rompen la hoja: 278 personajes cuyos pasos repiten
  la pose quieta (animación estática, con un solo fotograma de paso tal como
  viene en la ROM), 42 personajes que comparten la misma pose quieta para abajo y
  para arriba, y 16 hojas en disco sin ficha en el plan (restos de extracciones
  anteriores que siguen en uso por eventos, por eso no se borran).
