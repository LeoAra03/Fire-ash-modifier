# FASE 001 — tanda 22 (líneas 2100–2199 de `tareas.txt`)

Carril de diálogos: corte de tanda, control de formato con autoprueba, informe publicado y cierre con control en CI. Esta fase no reescribe contenido del juego.

## Corte verificado

- 100 líneas del archivo, tareas 2096–2195, IDs consecutivos.
- Corte por **líneas de archivo**, no por ID: la cabecera desplaza la numeración en 4.

## Medición reproducible

- control de formato: 19801 cajas, 0 errores, 4206 avisos (13 reglas; 31 códigos de motor leídos de Messages)
- autoprueba: 17 casos / 13 reglas en verde
- conteo coherente: 19801 cajas · 13736 eventos · 1887 mapas · 67 hablantes
- tono: 0 gore/parodia, 0 humillación · derrotas: 691/747 permanentes en 1702 batallas / 747 eventos, sin anomalías
- reescrituras: 0 · cola de cajas: sin solapes · playtest: 60 carpetas abiertas en estado manual_pending

## Comandos ejecutados

| Comando | Resultado |
|---|---|
| `node tools/plan2700/lote5_fase022_dialogos.mjs --verify` | exit 0 |
| `npm run verify:glosario` | exit 0 |
| `npm run verify:diplomas` | exit 0 |
| `npm run verify:defeats` | exit 0 |
| `npm run verify:canon:arceus` | exit 0 |
| `npm run verify:dialogos:queue` | exit 0 |
| `node tools/apply_cajas_dialogo.mjs --verify` | exit 0 |
| `npm run verify:plan2700:dialogos` | exit 0 |
| `npm run verify:plan900:dialogos` | exit 0 |
| `node tools/qa/dialogos_formato_check.mjs` | exit 0 |

## Tareas por carril y estado

Carriles: mundo_vivo 24 · dimensiones 20 · infraestructura 18 · hubs 10 · gimnasios 7 · tono 7 · playtest_apertura 5 · jefes 4 · editor 2 · glosario 2 · canon 1.

Estados: instrumentado 1 · pendiente_fase 1 · pendiente_humano 71 · verificado 27.

| Tarea | Línea | Carril | Estado | Sonda / evidencia | Responsable |
|---:|---:|---|---|---|---|
| 2096 | 2100 | tono | verificado | ejecutar `node tools/plan2700/lote5_fase022_dialogos.mjs --verify` — exit 0 | — |
| 2097 | 2101 | tono | verificado | ejecutar `node tools/plan2700/lote5_fase022_dialogos.mjs --verify` — exit 0 | — |
| 2098 | 2102 | tono | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2099 | 2103 | tono | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2100 | 2104 | tono | verificado | ejecutar `node tools/plan2700/lote5_fase022_dialogos.mjs --verify` — exit 0 | — |
| 2101 | 2105 | gimnasios | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2102 | 2106 | gimnasios | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2103 | 2107 | gimnasios | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2104 | 2108 | gimnasios | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2105 | 2109 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2106 | 2110 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2107 | 2111 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2108 | 2112 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2109 | 2113 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2110 | 2114 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2111 | 2115 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2112 | 2116 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2113 | 2117 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2114 | 2118 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2115 | 2119 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2116 | 2120 | glosario | verificado | ejecutar `npm run verify:glosario` — exit 0 | — |
| 2117 | 2121 | glosario | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2118 | 2122 | gimnasios | verificado | ejecutar `npm run verify:diplomas` — exit 0 | — |
| 2119 | 2123 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2120 | 2124 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2121 | 2125 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2122 | 2126 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2123 | 2127 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2124 | 2128 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2125 | 2129 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2126 | 2130 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2127 | 2131 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2128 | 2132 | jefes | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2129 | 2133 | jefes | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2130 | 2134 | jefes | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2131 | 2135 | tono | verificado | ejecutar `npm run verify:defeats` — exit 0 | — |
| 2132 | 2136 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2133 | 2137 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2134 | 2138 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2135 | 2139 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2136 | 2140 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2137 | 2141 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2138 | 2142 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2139 | 2143 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2140 | 2144 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2141 | 2145 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2142 | 2146 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2143 | 2147 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2144 | 2148 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2145 | 2149 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2146 | 2150 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2147 | 2151 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2148 | 2152 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2149 | 2153 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2150 | 2154 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2151 | 2155 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2152 | 2156 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2153 | 2157 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2154 | 2158 | canon | verificado | ejecutar `npm run verify:canon:arceus` — exit 0 | — |
| 2155 | 2159 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2156 | 2160 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2157 | 2161 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2158 | 2162 | hubs | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2159 | 2163 | tono | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2160 | 2164 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2161 | 2165 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2162 | 2166 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2163 | 2167 | dimensiones | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2164 | 2168 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2165 | 2169 | gimnasios | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2166 | 2170 | gimnasios | verificado | ejecutar `npm run verify:diplomas` — exit 0 | — |
| 2167 | 2171 | jefes | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2168 | 2172 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2169 | 2173 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2170 | 2174 | mundo_vivo | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2171 | 2175 | editor | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2172 | 2176 | editor | pendiente_humano | revisión editorial / partida — no verificable de forma estática | Equipo editorial y playtest humano |
| 2173 | 2177 | infraestructura | verificado | ejecutar `npm run verify:dialogos:queue` — exit 0 | — |
| 2174 | 2178 | infraestructura | verificado | ejecutar `node tools/apply_cajas_dialogo.mjs --verify` — exit 0 | — |
| 2175 | 2179 | infraestructura | verificado | ejecutar `npm run verify:plan2700:dialogos` — exit 0 | — |
| 2176 | 2180 | infraestructura | verificado | ejecutar `npm run verify:plan900:dialogos` — exit 0 | — |
| 2177 | 2181 | infraestructura | verificado | documento docs/qa/dialogos_informe.md — existe con sección LOTE 2 (030831ab6b98) | — |
| 2178 | 2182 | infraestructura | verificado | documento docs/qa/dialogos_informe.md — existe con sección LOTE 2 (030831ab6b98) | — |
| 2179 | 2183 | infraestructura | verificado | docs/qa/dialogos_informe.md · Reescrituras — 0 reescrituras en la fase; sin cambio de sentido que verificar | — |
| 2180 | 2184 | infraestructura | pendiente_humano | releído completo de escenas clave — la releída exige contexto de escena y versión jugada | Lectura humana · equipo editorial |
| 2181 | 2185 | infraestructura | verificado | documento docs/qa/dialogos_informe.md — existe con sección LOTE 2 (030831ab6b98) | — |
| 2182 | 2186 | infraestructura | instrumentado | 13 reglas sobre todas las cajas — cada caja pasa por el control; la lectura de voz queda abierta | Equipo editorial |
| 2183 | 2187 | infraestructura | verificado | ejecutar `npm run verify:plan900:dialogos` — exit 0 | — |
| 2184 | 2188 | infraestructura | verificado | ejecutar `node tools/qa/dialogos_formato_check.mjs` — exit 0 | — |
| 2185 | 2189 | infraestructura | verificado | node tools/qa/dialogos_formato_check.mjs — corre en memoria sobre el volcado, sin red ni procesos externos | — |
| 2186 | 2190 | infraestructura | verificado | autoprueba --selftest — detecta «A6 caja única por encima de 53 columnas» | — |
| 2187 | 2191 | infraestructura | verificado | autoprueba --selftest — detecta «A1 pregunta sin ¿» y «A2 exclamación sin ¡» | — |
| 2188 | 2192 | infraestructura | verificado | autoprueba --selftest — detecta «A3 comillas rectas» y «A4 guion doble», «A4 guion con espacios» | — |
| 2189 | 2193 | infraestructura | verificado | autoprueba --selftest — detecta «E3 variable vacía», «E3 variable fuera de rango» | — |
| 2190 | 2194 | infraestructura | verificado | documento docs/qa/dialogos_informe.md — existe con sección LOTE 2 (030831ab6b98) | — |
| 2191 | 2195 | playtest_apertura | verificado | docs/qa/playtest/ — README con plantilla y 60 carpetas de sesión abiertas | — |
| 2192 | 2196 | playtest_apertura | pendiente_fase | guion con cuota por sesión — la cuota de celdas, eventos y diálogos se instala en docs/qa/playtest_cobertura.md | LOTE 2 · fase 002 |
| 2193 | 2197 | playtest_apertura | verificado | documento docs/qa/playtest/README.md — existe con sección LOTE 2 (e67670580e1b) | — |
| 2194 | 2198 | playtest_apertura | verificado | docs/qa/playtest/sesion-01 … sesion-60 — 60 carpetas con ficha mínima | — |
| 2195 | 2199 | playtest_apertura | pendiente_humano | ficha de sesión 1 — docs/qa/playtest/sesion-01/README.md sin cuota | Playtest humano · sesión 1 |

## Entregables de esta fase

- `docs/qa/dialogos_informe.md`: conteos, 13 reglas, cola, tono, reescrituras (0) y cierre del carril.
- `content/lote2_fase001_tanda22.json`: artefacto con el formato completo, la autoprueba y las 100 tareas clasificadas.
- `content/plan2700_dialogos.json`: sección `lote2` con corte, formato e informe (tarea 2175).
- `tools/qa/dialogos_formato_check.mjs`: control con `--selftest`; `docs/qa/playtest/README.md` gana la ficha obligatoria (2193).
- CI: paso «Volcado y formato de diálogos (LOTE 2)» antes de `verify:all`.

## Pendientes con dueño

- Reescrituras editoriales de los avisos con contexto de escena — Equipo editorial (2109, 2117, 2136, 2138).
- Releído de escenas clave tras reescrituras — Lectura humana (2180).
- Cuota de playtest por sesión — LOTE 2 fase 002 (2192); sesiones 1–60 — playtest humano.

## LOTE 2

Parte del LOTE 2 (fases 001–005). Reproducir con el comando `verify:lote2:fase001` de `package.json`.
Ninguna medición estática se presenta como una partida, un dispositivo o una revisión humana realizada.
