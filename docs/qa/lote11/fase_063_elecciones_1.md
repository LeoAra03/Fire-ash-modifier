# FASE 063 — Lote mixto de la tanda 63 (tramo 6200–6299)

## Reproducción

```bash
node tools/plan2700/lote11_fase063_elecciones_1.mjs
node tools/plan2700/lote11_fase063_elecciones_1.mjs --verify
```

## Reparto de tareas

- **Tareas procesadas**: 100 · diálogos: 28 · elecciones: 70 · condiciones: 2.
- **Mapas únicos cubiertos**: 2290 (mapas 1–4419) · familias: «Atlas Mil», «Campañas ROM», «Fire Ash original», «Horizontes», «Mapas nuevos del DLC».

## Diálogos mostrados y medidos

- **Tareas**: 28 (11 con lectura humana explícita) · **mapas**: 55.
- **Bloques 101/401**: 846 · **mensajes de script**: 0.
- **Formato**: 735 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos**: 8 interrogaciones sin «¿» · 9 exclamaciones sin «¡» · 0 comillas impares.
- **Variables inválidas**: 0.

## Elecciones recorridas (cobertura estática)

- **Tareas**: 70 · **bloques de elección (102)**: 5527 en 5126 eventos.
- **Opciones declaradas**: 11475 · **ramas 402**: 11475 · **cobertura de opciones**: 100 %.
- **Recuento sin duplicar por mapa** (2290 mapas): 5208 bloques 102 · 10773 opciones · 10773 resueltas · cobertura 100 %.
- **Cancelación**: 5510 bloques cancelables (11 con cancelación implícita) · ramas 403 explícitas: 11.
- **Ramas sin resolver**: 0 (faltantes: 0 · duplicadas: 0 · fuera de rango: 0 · bloques sin cierre 404: 0 · cancelación ausente: 0).
- **Ramas con acciones**: 7654 · vacías (al elegirlas no ocurre nada): 3832 · terminan en transferencia/salida: 3994 · cierres 404 huérfanos: 0.

## Condiciones probadas en verdadero y falso (estático)

- **Tareas**: 2 · **condicionales (111)**: 190 en 193 páginas.
- **Tipos**: 0:3 · 1:103 · 2:4 · 6:15 · 7:2 · 12:63.
- **Rutas**: 98 con rama `else` (411) · 92 sin ella (falso implícito).
- **Ambos caminos posibles**: 190 · **siempre verdaderas**: 0 · **siempre falsas**: 0 · **IDs inválidos**: 0.
- **Recuento sin duplicar por mapa** (2290 mapas): 16137 condicionales · 16137 con ambos caminos posibles · 0 constantes · 0 IDs inválidos.

Sin hallazgos de ramas, condiciones o estado en este tramo.

## Límite honesto

La cobertura de elecciones y la doble prueba de condiciones se calculan sobre el árbol de comandos de los `.rxdata` compilados: ninguna rama se ejecuta realmente. Una condición «siempre verdadera» aquí significa que el propio comando 111 la vuelve tautológica o que referencia un ID inexistente, no que el juego la evalúe así en una partida. La ejecución interactiva en `Game.exe` permanece como `runtime_pending`.
