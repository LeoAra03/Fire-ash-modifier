# FASE 046 — Cierre de ramas (3466–4419) y revisión de diálogos (mapas 1–108)

## Reproducción

```bash
node tools/plan2700/lote9_fase046_ramas_dialogos.mjs
node tools/plan2700/lote9_fase046_ramas_dialogos.mjs --verify
```

## 1. Cierre de ramas de eventos (tareas 4500–4554 · mapas 3466–4419 «Campañas ROM»)

- **Tareas**: 55 · **Mapas únicos**: 831 · **Eventos**: 8875 · **Páginas**: 9554.
- **Integridad**: condicionales (`111`): 678 · elecciones (`102`): 0 · páginas sin fin (`code 0`): **0** · transferencias inválidas: **0** · escrituras de estado inválidas: **0**.

## 2. Mostrar y comprobar diálogos (tareas 4555–4599 · mapas 1–108 «Fire Ash original»)

- **Tareas**: 45 (18 con lectura humana de sentido explícita) · **Mapas únicos**: 108 · **Referencias a variables inválidas**: **0**.

| Aspecto evaluado | Tareas | Lectura humana | Bloques 101/401 | Script msgs | >53 cols | ¿/¡ ausentes | Glosario | `\PN` / `\v[n]` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 9 | 3 | 1126 | 0 | 421 | 321 | 314 | 87/82 |
| signos de apertura, comillas y puntuación | 9 | 2 | 1290 | 0 | 510 | 406 | 341 | 95/93 |
| idioma, glosario y nombres propios | 9 | 2 | 1270 | 0 | 474 | 367 | 287 | 92/53 |
| variables, cantidades y nombres insertados | 9 | 2 | 1365 | 0 | 476 | 363 | 332 | 103/65 |
| sentido, tono y lectura humana | 9 | 9 | 1186 | 0 | 392 | 403 | 307 | 120/76 |

## Muestras extraídas (mapas 1–108)

- **Tarea 4555** (Mapa 1 «Intro» · Ev 1 `Intro`, pág. 1, 28 cols): `\bHello! Sorry to keep you waiting!`
- **Tarea 4556** (Mapa 3 «\PN's house» · Ev 5 `Voice Recorder, download files`, pág. 1, 15 cols): `Choose a topic.`
- **Tarea 4557** (Mapa 3 «\PN's house» · Ev 5 `Voice Recorder, download files`, pág. 1, 15 cols): `Choose a topic.`
- **Tarea 4558** (Mapa 3 «\PN's house» · Ev 5 `Voice Recorder, download files`, pág. 1, 15 cols): `Choose a topic.`
- **Tarea 4559** (Mapa 8 «Daisy's house» · Ev 2 `Daisy`, pág. 1, 7 cols): `\rDaisy: Hi, \PN!`
- **Tarea 4560** (Mapa 10 «Cedolan Gym» · Ev 2 `Gym Guy`, pág. 1, 32 cols): `\bThis is an example of a Pokémon Gym.`
- **Tarea 4561** (Mapa 12 «Cedolan City Condo» · Ev 2 `Move Deleter`, pág. 1, 30 cols): `\bUh...\nOh, yes, I'm the Move Deleter.`
- **Tarea 4562** (Mapa 13 «Game Corner» · Ev 16 `Voltorb Flip`, pág. 1, 68 cols): `Mr. Game: \bShow me how you play and make my  heart pound with excitement!`

## Límite honesto

Los mapas `1–108` pertenecen a «Fire Ash original» (cuya política de congelación impide reescribir sus `.rxdata` originales y cuyos textos base están mayoritariamente en inglés). Las métricas de formato, signos, glosario y variables quedan archivadas por tarea y la lectura humana de sentido/tono permanece marcada como `manual_pending`.
