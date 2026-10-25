# Informe de diálogos — LOTE 2 · tanda 22

Corte: líneas 2100–2199 de `tareas.txt` (tareas 2096–2195).
Reproducir: `npm run verify:dialogos:formato`, `npm run verify:lote2:fase001`.

## Conteos

| Métrica | Valor |
|---|---:|
| Cajas 101/401 en el volcado | 19801 |
| Eventos `PokeMod` | 13736 |
| Páginas de evento | 15556 |
| Mapas con eventos `PokeMod` | 1887 |
| Mensajes Ruby (355/655) | 3983 |
| Mapas con cajas de texto | 1883 |
| Hablantes distintos (\sp[...]) | 67 |

Los conteos son coherentes entre sí: cada caja pertenece a una página de
un evento del volcado (19801 cajas sobre 13736 eventos) y el
volcado se regenera desde los mapas con `npm run dump:plan900:dialogos`.

## Control de formato (13 reglas, tarea 2184)

| Regla | Nivel | Cantidad |
|---|---|---:|
| E1 caja_vacia — caja sin texto visible | error | 0 |
| E2 escape_desconocido — código de escape que el motor no define | error | 0 |
| E3 argumento_invalido — argumento de escape vacío o fuera de rango | error | 0 |
| E4 corchete_desbalanceado — escape con `[` sin `]` de cierre | error | 0 |
| E5 caracter_no_imprimible — carácter de control dentro del texto | error | 0 |
| E6 solo_escape — caja cuya parte visible queda vacía | error | 0 |
| A1 signo_pregunta — `?` sin signo de apertura `¿` | aviso | 100 |
| A2 signo_exclamacion — `!` sin signo de apertura `¡` | aviso | 148 |
| A3 comillas_rectas — comillas rectas `"` en voz narrativa | aviso | 0 |
| A4 guion_dudoso — guion doble `--` o guion medio rodeado de espacios | aviso | 5 |
| A5 jerga_motor — jerga de motor visible para el jugador | aviso | 2 |
| A6 caja_unica_ancha — caja de una sola línea por encima de 53 columnas | aviso | 3709 |
| A7 posible_ingles — candidato de texto en inglés | aviso | 242 |

- Errores: **0** (el control termina en verde).
- Avisos: **4206**, publicados con mapa/evento/página en `content/lote2_fase001_tanda22.json`.
- Códigos de escape del motor: **31**, leídos de `Messages`/`PokeMod_Dialogos` en cada corrida;
  observados en el volcado: b, ch, sp, v.
- Autoprueba: **17 casos / 13 reglas** en verde con `node tools/qa/dialogos_formato_check.mjs --selftest`.
- El control corre en memoria sobre el volcado, sin red ni procesos externos
  (tarea 2185) y está en el flujo de CI como paso previo a `verify:all`.

## Cola de cajas por personaje (tareas 2173–2174)

`npm run verify:dialogos:queue` → OK: cajas de diálogo por personaje instaladas;
mensajes serializados, sin solapes. `node tools/apply_cajas_dialogo.mjs --verify` termina en exit 0.

## Tono: derrotas, creepypasta y dignidad (tareas 2096–2100)

- candidatos de gore/parodia: **0**;
- candidatos de humillación: **0**;
- candidatos de inglés: 242 (editoriales, con contexto en el JSON);
- batallas auditadas sin anomalías: 1702 en 747 eventos, derrota permanente
  691/747 y revanchas sólo por menú (`npm run verify:defeats`).

Los tres orígenes son reproducibles: `content/lote5_fase022_dialogos.json`
(barrido de tono) y `npm run verify:defeats` (persistencia de derrotas).

## Reescrituras (tareas 2178–2179)

**0 reescrituras** en esta fase: no se modificó ningún texto del juego.
Con cero reescrituras no existe cambio de sentido que verificar (2179)
y la lista de reescrituras queda declarada vacía, con su motivo, en esta sección.

| Texto reescrito | Motivo |
|---|---|
| — | — |

Los avisos son candidatos editoriales, no reescrituras automáticas: algunos
son nombres propios, menús o mensajes de sistema, y se reescriben sólo con
contexto de escena y releído completa (tarea 2180, pendiente humana).

## Carril de diálogos: cerrado con control en CI (tareas 2181/2190)

Condiciones cumplidas: volcado vigente (`verify:plan900:dialogos`), artefacto
al día (`verify:plan2700:dialogos`), 0 errores de formato, cola de cajas sin
solapes, informe publicado y control en `.github/workflows/build-apk.yml`
(paso «Volcado y formato de diálogos (LOTE 2)»).

Quedan abiertos, con dueño explícito: la lectura editorial de voz y avisos
(equipo editorial) y el playtest humano de escenas clave (fases 002–003
del LOTE 2). Ninguna medición sustituye a esas corridas.

## LOTE 2

Parte del LOTE 2 (fases 001–005) de `tareas.txt`.
