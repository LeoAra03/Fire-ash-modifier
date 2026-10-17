# FASE 023 — matriz de playtest y cobertura (IDs 2200–2299)

## Resultado estático

`tools/plan2700/lote5_fase023_playtest.mjs` genera y verifica
`content/lote5_fase023_playtest.json` a partir de los mapas compilados. La
matriz contiene **55 sesiones (6–60)**, **1887 mapas con eventos PokeMod**,
**13 736 eventos** y **19 801 cajas**.

Cada sesión exige fecha, commit, entorno, duración, mapas, eventos, diálogos,
hallazgos y capturas. El estado es `manual_pending`: el inventario estático no
se hace pasar por una partida real.

## Sesiones 6–60

- 6–11: postgame, siete emisiones, Monte Silver, Red y Liga Oscura.
- 12–16: Atlas, gimnasios, anclas, Teckel e Isla Espejo.
- 17–23: Glazed, Light Platinum, Liquid Crystal, TFOH y Unbound.
- 24–32: Team Rocket, sistemas, guardado, derrotas, retorno y recorrido sin
  guía.
- 33–42: ventana/pantalla completa, entradas, Android/Kirin y operaciones del
  editor (ZIP, lectura, deshacer/rehacer).
- 43–55: sesiones largas, guardados antiguos, menús, campo, pesca, clima,
  niebla, tonos, transiciones y animaciones.
- 56–60: recompensas, revanchas, derrotas, huida/captura y partida final.

Las carpetas `docs/qa/playtest/sesion-06/` a `sesion-60/` contienen la ficha
mínima. Los hallazgos se clasifican como bloqueante, grave, leve o cosmético y
una corrección grave exige una regresión.

## Límite de evidencia

No existe en este entorno una ejecución humana de escritorio, Android/Kirin,
mando o PokeMod Studio. Por ello el informe prepara la cobertura y deja las
sesiones `manual_pending`; no inventa duración, tasa de descubrimiento,
capturas ni resultados de rendimiento. La cobertura se puede cerrar cuando se
disponga del binario y del entorno de prueba.

## Comandos

```text
node tools/plan2700/lote5_fase023_playtest.mjs
node tools/plan2700/lote5_fase023_playtest.mjs --verify
```
