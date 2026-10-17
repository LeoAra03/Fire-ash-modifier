# FASE 022 — diálogos y apertura del playtest

## Alcance

Tanda **2100–2199** de `tareas.txt`: cierre estático del carril de texto,
verificación de cajas y apertura del protocolo de playtest.

La auditoría reproducible es:

```text
node tools/plan2700/lote5_fase022_dialogos.mjs
node tools/plan2700/lote5_fase022_dialogos.mjs --verify
npm run verify:dialogos:queue
```

## Resultado medido

La corrida sobre `pokemon_fire_ash/Data/Map*.rxdata` encontró:

- 3465 mapas escaneados y 1887 con eventos `PokeMod`;
- 13 736 eventos, 15 556 páginas, 19 801 cajas y 3983 mensajes Ruby;
- 0 cajas vacías, 0 variables `\\v[]` vacías, 0 candidatos de gore/parodia y
  0 candidatos de humillación;
- 242 candidatos de idioma inglés, 100 candidatos de signo de apertura y 2
  menciones de jerga de motor: se conservan como hallazgos editoriales con
  contexto, no se sustituyen automáticamente;
- repetidos literales, campañas, jefes, emisiones, hubs, carteles y objetos
  quedan agrupados en `content/lote5_fase022_dialogos.json`.

El auditor distingue advertencias de aprobaciones: un candidato de idioma,
una pregunta narrativa o un nombre propio no prueban por sí solos un error.

## Protocolo de lectura

Cada hallazgo debe conservar mapa, evento, página y texto. La lectura final de
voz, canon, promesas narrativas y ausencia de copia requiere una partida o
revisión humana; la herramienta no inventa esa evidencia.

Los textos de atribución se contrastan con `pokemon_fire_ash/Credits.txt` y
los términos con `docs/qa/glosario.md`. Los controles ejecutables de cajas y
sintaxis se mantienen separados de la revisión literaria.

## Playtest abierto

Se creó `content/lote5_fase022_playtest.json` y la ficha en
`docs/qa/playtest/README.md`. Las sesiones 1–5 tienen carpeta y ficha:

1. arranque en frío y primera partida;
2. partida guardada antes del duelo de Arceus;
3. duelo completo de Arceus;
4. captura de Arceus y aparición junto a Oak;
5. entrada al postgame y primer contacto con el hub.

El estado inicial de cada ficha es `manual_pending`; no se presenta una
partida humana inexistente como evidencia automática. Las sesiones siguientes
se incorporan en la FASE 023.
