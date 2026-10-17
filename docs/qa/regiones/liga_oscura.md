# Liga Oscura — acta QA (FASE 017)

## Condición real de apertura

La Liga Oscura no se abre por visitar la cumbre. El flujo instalado es:

1. Las siete emisiones de Monte Silver escriben los sellos **940–946** al
   derrotar a sus guardianes. Cada jefe conserva self-switch de derrota,
   derrota permitida y revancha opcional.
2. El contador común **v[264]** registra las emisiones purgadas. La entrada a
   la Liga se ofrece desde el evento `PokeMod Grieta: Umbral de la Liga
   Oscura` en Map2022 cuando la secuencia de Monte Silver está completa.
3. La expansión usa **Map2192** como umbral y **Map2193** como arena. El jefe
   final `LA CONVERGENCIA` escribe una sola condición de progreso lógica,
   **switch 948 `POKEMOD LIGA OSCURA COMPLETA`**; la página de revancha puede
   repetir una asignación idempotente, pero no crea otro evento escritor.
4. El Salón de Diplomas (Map2288) lee el switch 948 para mostrar el Diploma de
   Liga Oscura; no otorga el diploma ni el switch por sí mismo.

La descripción anterior se contrasta contra `content/multiverse_creepypasta.json`,
`content/expansion_multiversal.json`, `content/diplomas_planta.json` y los
mapas compilados. No se afirma que el recorrido humano haya sido jugado.

## Auditoría reproducible

```text
node tools/plan2700/audit_fase017.mjs --json
npm run verify:diplomas
npm run verify:multiverse
npm run verify:multiverse:flags
npm run verify:defeats
```

Resultado de la medición de FASE 017:

- 7 sellos nombrados y 7 guardianes de emisión.
- Umbral 2192 y arena 2193 presentes; un evento final único y al menos una
  escritura ON de 948.
- Diploma con condición exacta `switch 948`.
- Retorno y derrota permitida en las batallas del bloque.

## Ficha visual

- **Umbral 2192:** cámara de transición, voces recogidas y puerta a la arena;
  el fondo de batalla declarado es `distortion`.
- **Arena 2193:** no se presenta como estadio convencional: el plan la trata
  como una sala de reflejos sin gradas, con cinco combates secuenciales y un
  jefe de convergencia.
- El contraste de la Liga con la Cima del Génesis se verifica por sus
  `battleBackdrop`, textos y mapas donantes; no se reutiliza esta acta como
  certificación de escucha o color en Kirin.

## QA pendiente de ejecución humana

El caminante automático, la derrota/reintento real, la escucha de música, la
restauración del tono y la disponibilidad de guardado necesitan una partida en
Kirin/Game.exe. Mientras no exista esa corrida, se mantienen como advertencias,
no como fallos ocultos.
