# Fidelidad Game Boy: donde la GBC sólo permitía 4 colores, sin degradados

> Generado por `node tools/gbc_fidelidad.mjs` (comprobar sin reescribir:
> `npm run verify:gbc:fidelidad`). **No se edita a mano.**

La dimensión creepypasta emula una máquina concreta: la **Game Boy Color**, que dibuja
sprites de **2 bpp** contra una paleta de **cuatro tonos** y una **máscara de un bit** por
píxel. La restricción queda fijada en `content/dimensional_nightmare_visual_contract.json` → `fidelidad` y se traduce en
tres comprobaciones sobre el arte entregado:

1. **Cuatro tonos planos**: todo píxel visible es exactamente uno de
   `#0f380f` · `#306230` · `#8bac0f` · `#9bbc0f`. Cualquier otro color sólo puede
   haber entrado por interpolación (mezcla, antialiasing, escalado suave) → **degradado**.
2. **Máscara de un bit**: el alfa sólo vale 0 o 255; los bordes semitransparentes son
   degradados de la máscara.
3. **Cuatro tonos por sprite**: ninguna celda de 16×16 px
   (la microcuadrícula del contrato) usa más tonos que los permitidos.

Alcance: 260 PNG del arte de la dimensión
(`Graphics/**/DN_*.png`, `Graphics/Characters/ash_outfit_creep.png`), 46.734.054 píxeles visibles.
El resto del juego es GBA/RMXP y no le aplica este techo.

## Resumen

| Archivo | Fieles | Con degradados | Píxeles fuera de paleta | Píxeles con alfa parcial | Máx. tonos | Máx. tonos por sprite |
|---|---|---|---|---|---|---|
| 260 PNG de la dimensión | 260 | 0 | 0 | 0 | 4 | 4 |

**260 de 260 archivos son fieles**: ningún sprite añade un tono
ni un borde que la máquina no pudiera dibujar. Los 22 que sí lo hacían quedaron corregidos y constan abajo (la silueta se conserva: peor intersección sobre unión 0.9426).

## Por categoría

| Categoría | Archivos | Fieles | Máx. tonos | Máx. tonos por sprite | Píxeles |
|---|---|---|---|---|---|
| autotiles | 14 | 14 | 4 | 4 | 807.152 |
| batallas | 2 | 2 | 4 | 4 | 3400 |
| entrenadores | 2 | 2 | 4 | 4 | 7333 |
| escenarios | 1 | 1 | 4 | 4 | 3591 |
| objetos | 34 | 34 | 4 | 4 | 51.099 |
| personajes | 52 | 52 | 4 | 4 | 725.514 |
| tilesets | 155 | 155 | 4 | 4 | 45.135.965 |

## Incumplimientos medidos

| Archivo | Tonos | Fuera de paleta | Alfa parcial | Fuera por sprite | Motivos |
|---|---|---|---|---|---|
| — | — | — | — | — | sin incumplimientos |

## Reparaciones registradas

El «antes» es lo que había en el repositorio; el «después» se recalcula en cada pasada
(y lo comprueba `--verify` contra el sha1 del archivo).

| Archivo | Tonos antes | Fuera antes | Alfa parcial antes | Tonos ahora | Fuera ahora | Alfa parcial ahora | Silueta conservada | sha1 |
|---|---|---|---|---|---|---|---|---|
| `Characters/ash_outfit_creep.png` | 14 | 55 | 118 | 4 | 0 | 0 | 0.9989 | d8e436541566 |
| `Items/DN_CASE_AMO.png` | 13 | 16 | 36 | 3 | 0 | 0 | 0.9887 | 410d64b7f535 |
| `Items/DN_CASE_BLK.png` | 15 | 18 | 36 | 3 | 0 | 0 | 0.9887 | 945b62b640cf |
| `Items/DN_CASE_FOS.png` | 15 | 18 | 36 | 3 | 0 | 0 | 0.9887 | afe6473ae34a |
| `Items/DN_CASE_HYP.png` | 16 | 18 | 36 | 4 | 0 | 0 | 0.9887 | 62d621517be6 |
| `Items/DN_CASE_LSV.png` | 15 | 17 | 36 | 4 | 0 | 0 | 0.9887 | 5a6b71ef8b9a |
| `Items/DN_CASE_MPK.png` | 16 | 17 | 36 | 4 | 0 | 0 | 0.9887 | 3fc8c195762e |
| `Items/DN_CASE_SIL.png` | 14 | 16 | 36 | 4 | 0 | 0 | 0.9887 | e8df060eab20 |
| `Items/DN_CASE_SNO.png` | 16 | 17 | 36 | 4 | 0 | 0 | 0.9887 | 3fc8c195762e |
| `Items/DN_CASE_UNO.png` | 17 | 17 | 36 | 4 | 0 | 0 | 0.9887 | d48d61b519c0 |
| `Items/DN_CASE_WHT.png` | 16 | 17 | 36 | 4 | 0 | 0 | 0.9887 | 0b8eb9ed8fa2 |
| `Items/DN_CASE_WIT.png` | 16 | 18 | 36 | 4 | 0 | 0 | 0.9887 | 027e7adbdec5 |
| `Items/DN_MEDAL_AMO.png` | 34 | 63 | 132 | 4 | 0 | 0 | 0.9426 | c584cf67bb1d |
| `Items/DN_MEDAL_BLK.png` | 32 | 90 | 132 | 3 | 0 | 0 | 0.9426 | f36a2a3edbfb |
| `Items/DN_MEDAL_FOS.png` | 34 | 62 | 132 | 4 | 0 | 0 | 0.9426 | 6e13b378bde3 |
| `Items/DN_MEDAL_HYP.png` | 34 | 67 | 132 | 4 | 0 | 0 | 0.9426 | 2d2c7b24d262 |
| `Items/DN_MEDAL_LSV.png` | 33 | 61 | 132 | 4 | 0 | 0 | 0.9426 | 30bbeeddd918 |
| `Items/DN_MEDAL_MPK.png` | 34 | 70 | 132 | 4 | 0 | 0 | 0.9426 | a9009cbc078f |
| `Items/DN_MEDAL_SIL.png` | 30 | 61 | 132 | 4 | 0 | 0 | 0.9426 | 66c0beb9d253 |
| `Items/DN_MEDAL_SNO.png` | 32 | 64 | 132 | 4 | 0 | 0 | 0.9426 | 5eca44453a5c |
| `Items/DN_MEDAL_UNO.png` | 30 | 61 | 132 | 4 | 0 | 0 | 0.9426 | 53bb17e103d8 |
| `Items/DN_MEDAL_WHT.png` | 35 | 62 | 132 | 4 | 0 | 0 | 0.9426 | a1e4a2533ae6 |

## Avisos

- el paquete QA de Dimensional Nightmare conserva 22 copias con el arte anterior: renuévalo con `npm run build:dn:qa`
- el paquete directo conserva 1 copia con el arte anterior: renuévalo con `npm run sync:paquete && npm run build:corregido:zip`

## Cómo se reproduce

```bash
npm run audit:gbc:fidelidad    # mide el arte de la dimensión y reescribe este informe
npm run fix:gbc:fidelidad      # corrige los degradados añadidos y reescribe el informe
npm run verify:gbc:fidelidad   # recalcula y comprueba que nada añadió degradados
npm run selftest:gbc:fidelidad # comprobaciones sintéticas de la regla
```
