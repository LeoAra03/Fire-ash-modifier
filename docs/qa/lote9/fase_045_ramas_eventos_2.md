# FASE 045 — Ramas de eventos: control y coherencia de estado (tramo 4400–4499)

## Reproducción

```bash
node tools/plan2700/lote9_fase045_ramas_eventos_2.mjs
node tools/plan2700/lote9_fase045_ramas_eventos_2.mjs --verify
```

## Resumen medido (mapas 889–3466)

- **Tareas procesadas**: 100 (`4400–4499`, más líneas de borde `4396–4399` indexadas).
- **Mapas únicos cubiertos**: 1747 · **Eventos**: 16459 · **Páginas**: 25127.
- **Ramas analizadas**: 4340 condicionales (`111`), 1837 ramas `else` (`411`), 4491 bloques de elección (`102`) con 9057 opciones (`402`) y 1 cancelaciones (`403`), 23 bucles (`112`) con 23 salidas (`113`), 35 etiquetas (`118`) y 44 saltos (`119`).
- **Integridad de control y estado**: páginas sin fin (`code 0`): **0** · elecciones desbalanceadas: **0** · transferencias inválidas: **0** · escrituras de estado inválidas: **0** · páginas autorun/paralelas pendientes en DN/Restauración: 31.

## Desglose por familia declarada

| Familia | Tareas | Rango de mapas | Eventos (suma por tarea) | Páginas | Condicionales (111) | Elecciones (102) |
|---|---:|---|---:|---:|---:|---:|
| Fire Ash original | 14 | 889–1001 | 2678 | 5297 | 1803 | 229 |
| Horizontes | 4 | 1001–1029 | 735 | 1359 | 413 | 148 |
| Atlas Mil | 43 | 1030–2032 | 6686 | 10156 | 1805 | 4053 |
| Ruta de Dios + Silver | 1 | 2032–2049 | 156 | 332 | 10 | 1 |
| Dimensional Nightmare | 9 | 2049–2220 | 1420 | 2925 | 73 | 35 |
| Mapas nuevos del DLC | 2 | 2220–3014 | 319 | 377 | 21 | 25 |
| Campañas ROM | 27 | 3014–3466 | 4465 | 4681 | 215 | 0 |

## Límite honesto

Este verificador comprueba el árbol de comandos de todas las páginas en `Map*.rxdata`. La ejecución interactiva en `Game.exe` permanece como `runtime_pending`.
