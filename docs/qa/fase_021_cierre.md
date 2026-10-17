# Cierre FASE 021 — arte y diálogos (IDs 2000–2099)

Esta fase deja un carril reproducible para el cierre editorial de atavíos,
arte y diálogos. No se incorporan recursos de ROMs o fangames invitados: se
usan como referencia estructural y el paquete conserva la política de
atribución de `docs/qa/creditos_arte.md`.

## Evidencia por bloque

| IDs | Resultado | Evidencia ejecutable |
|---|---|---|
| 2000–2004 | PASS técnico | `npm run verify:atavios`, `npm run verify:transition-safety`, `npm run verify:plan2700:arte` |
| 2005–2016 | PASS de inventario/política | `content/plan2700_arte.json`, `content/plan2700_arte_faltante.json`, `docs/qa/arte_total.md`, `pokemon_fire_ash/Credits.txt` |
| 2017–2051 | Censo y revisión | inventario hashado, referencias de charset, 19/19 Pokégods coherentes; duplicados exactos quedan como candidatos de revisión y no se eliminan a ciegas |
| 2052–2070 | PASS técnico + revisión visual | `npm run verify:graficos`, `npm run verify:visor`, `npm run verify:atavios`, `npm run verify:plan2700:arte`; la legibilidad visual sigue siendo revisión manual |
| 2071–2073 | PASS de volcado | `content/plan2700_dialogos.json` conserva mapa, evento, página, líneas, hablante y texto; fuente reproducible `content/plan900_dialogos.json` |
| 2074–2076 | QA automatizado | 0 cajas vacías, 0 palabras indivisibles; las cajas que superan dos líneas a 43 columnas quedan listadas como revisión editorial |
| 2077–2086 | QA de candidatos | signos, anglicismos, variables y nombres de catálogo quedan separados en `checks` y `catalog`; variables vacías: 0 |
| 2087–2090 | QA de ritmo | se registran longitud por caja, 20 conversaciones de más de ocho cajas y literales repetidos para reescritura contextual |
| 2091–2099 | QA de voz/canon | candidatos de frase memorable por perfil, revisión de nombres y tono; `verify:canon:arceus`, `verify:tone-safety`, `verify:glosario` y la sintaxis Ruby pasan |

## Censo de diálogo

La auditoría final (`npm run audit:plan2700:dialogos`) registra:

- **13 736 eventos `PokeMod`**, en **1 887 mapas** de la fuente;
- **19 801 cajas** de texto en **1 883 mapas con cajas**;
- **67 hablantes** identificados por `\\sp[Nombre]`;
- **0 cajas vacías**, **0 variables `\\v[]` vacías** y **0 palabras
  indivisibles** por encima del ancho de ajuste de 43 columnas;
- **12 586 cajas candidatas** a más de dos líneas a 43 columnas y **20
  conversaciones** de más de ocho cajas seguidas. Son salidas de revisión
  editorial contextual, no se corrigen por sustitución ciega porque el texto
  puede pertenecer a una escena, un nombre propio o un mensaje de sistema;
- **242 candidatos de idioma inglés** y literales repetidos conservados como
  lista de revisión, sin alterar nombres propios, menús ni mensajes técnicos
  automáticamente.

El objetivo editorial del plan de **2 741 eventos** y **759 diálogos
importados** queda conservado en `scope` del JSON. El censo distingue eventos
estructurales de campañas (warps, retornos y tramos) de NPC/Entrenador para no
presentar una equivalencia numérica falsa; el cotejo uno a uno con la voz
original requiere lectura humana con las fuentes invitadas.

## Comandos de cierre

```text
npm run audit:plan2700:dialogos
npm run verify:plan2700:dialogos
npm run verify:plan900:dialogos
npm run verify:dialogos:queue
npm run verify:ruby:full
npm run verify:glosario
npm run verify:canon:arceus
npm run verify:tone-safety
```

Los verificadores técnicos no convierten una heurística en aprobación literaria:
la revisión de voz, tono, signos, frase memorable y ausencia de copia queda
explícitamente trazada en el JSON y en las listas de revisión.
