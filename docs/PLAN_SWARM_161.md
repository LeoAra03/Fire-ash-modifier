# Plan de ejecución con TIMPS Swarm (161 agentes) para la fusión de los tres juegos

**Para:** proyecto Fire Ash — objetivo: convertir Glazed, Light Platinum y Team
Rocket en tres dimensiones paralelas de Fire Ash.
**Con qué contamos:** el paquete `agents/timps-swarm-main.zip` (TIMPS Swarm
v2.2), 161 agentes especialistas + servidor MCP + motor de delegación por oleadas.

---

## 1. Qué es exactamente lo que ha llegado

| Pieza | Qué hace | Estado en este entorno |
|---|---|---|
| `agents/timps-swarm-main/.claude/agents/*.md` (161) | Definiciones de sub-agentes: uno por especialidad, listas para Claude Code, Cursor, Codex, Windsurf… | **Utilizables ya** como manuales de rol |
| `mcp_server/server.py` | Servidor MCP (JSON-RPC 2.0) que expone los 161 agentes como herramientas, con `ThreadPoolExecutor(max_workers=10)` | Requiere dependencias Python (langgraph, fastapi…) y un proveedor de LLM |
| `src/delegation_engine.py` | **DelegationEngine**: contexto → descomposición → oleadas con dependencias → ejecución paralela → normalización → agregación | Es el corazón del plan |
| `src/decomposer.py` | **TaskDecomposer**: reparte una instrucción grande en subtareas (por palabras clave → glob, o por LLM) | Alimenta `timps_batch` |
| `src/context_sharing.py` | **ContextSharer**: inyecta en cada sub-agente el estado de git, el diff reciente, el árbol de ficheros y los ficheros abiertos | Encaja con nuestro modelo de propiedad de archivos |
| `src/failure_recovery.py` | Reintento progresivo (simplificar → reformular → mínimo), máximo 3 | Red de seguridad de las oleadas |
| `src/token_budget.py` | Presupuesto: 0,50 $/tarea, 10 $/ejecución, 50 $/día, con corte duro | Límite económico del plan |
| `cli/` (Node) | Proxy MCP en Node + `install-mcp` + auditoría local; **funciona sin el backend Python** | **Camino ligero**: corre con Node 22 |
| `dashboard/` | UI React con WebSocket para ver el swarm en vivo | Opcional |

**Proveedores:** Gemini (capa gratuita, recomendado por el proyecto), Anthropic,
OpenAI, Groq u Ollama en local (coste cero).

### Lo que sí y lo que no podemos hacer aquí

- **Sí:** usar los 161 `.md` como **manuales de rol** (yo los adopto turno a
  turno) y ejecutar todo el trabajo determinista con nuestras herramientas Node
  (`tools/forense_roms.mjs`, `tools/apply_*.mjs`, `npm run verify:all`).
- **Sí:** correr el proxy MCP de Node (`cli/lib/mcp-proxy.js`) contra un servidor
  que levante el usuario en su máquina vía `TIMPS_API_URL`.
- **No en este espacio de trabajo:** el backend Python con agentes que llaman a
  un LLM. No hay `OLLAMA_HOST` ni claves `GEMINI/ANTHROPIC/OPENAI/GROQ`, e
  instalar `transformers`/`langchain` aquí es inviable. **Esa parte se ejecuta en
  tu equipo**, donde el swarm sí paraleliza de verdad.

Consecuencia práctica: **las manos son nuestras herramientas (deterministas y
verificables) y las cabezas son los agentes**. Ningún agente escribe en el juego
sin pasar por una herramienta que se pueda verificar.

---

## 2. Inventario: los 161 agentes en 12 familias

| # | Familia | Agentes | Utiles para Fire Ash |
|---|---|---|---|
| 1 | **Meta / orquestación** | dispatch, delegate, batch, agent_composer, connect_tools, list_agents, list_providers, run_task, tool_status, memory_agent, context_briefing, context_switcher, self_critic_agent | **13 / 13** |
| 2 | **Investigación y conocimiento** | deep_research_agent, research_agent, research_scout, web_search, web_scraping, local_rag_builder, rag_designer, rag_evaluator, vector_db_agent, trend_monitor, pattern_detector, learning_agent | **11 / 12** |
| 3 | **Arqueología y código** | code_archaeology, refactoring_agent, boilerplate_architect, dependency_agent, dependency_rebel, dependency_sentinel, tech_debt_quantifier, technical_debt, sql_optimizer, db_agent, db_migration_pilot, migration_pilot, embedded_agent | **9 / 13** |
| 4 | **Datos / catálogos / ML** | data_pipeline, data_wrangler, dataset_agent, finetuning_agent, model_evaluator, federated_learning, prompt_engineer, ai_safety_agent, edge_agent, realtime_agent | **6 / 10** |
| 5 | **Pruebas y calidad** | unit_test_writer, test_intelligence, test_data_agent, flaky_test_detector, flaky_test_hunter, visual_regression_detective, api_contract_auditor, api_perf_profiler | **8 / 8** |
| 6 | **Seguridad, licencias y cumplimiento** | security_guard, security_remediation, red_team_agent, threat_intel_analyst, secrets_management, license_compliance_scanner, compliance_auditor, sbom_generator, container_image_scanner, privacy_cleaner, prompt_injection_scanner | **6 / 11** |
| 7 | **Infra y observabilidad** | monitoring_agent, log_detective, log_interpreter, log_pattern_analyzer, incident_responder, incident_response_coordinator, postmortem_agent, game_day_facilitator, disaster_recovery, backup_sentinel, disk_space_prophet, environment_doctor, system_optimizer, tracing_emitter | **5 / 14** |
| 8 | **Documentación** | tech_writer_assistant, docstring_generator, changelog_generator, adr_writer, meeting_condenser, onboarding_mentor | **6 / 6** |
| 9 | **Gestión y flujo git** | sprint_planning_agent, issue_triager, pr_reviewer, merge_conflict_predictor, git_workflow_automator, release_manager, update_manager, sprint_reporter | **8 / 8** |
| 10 | **Contenido, i18n y voz** | i18n_agent, content_multiplier, storybook_story_generator, podcast_show_notes_writer, voice_agent_designer, media_librarian, file_organizer | **7 / 7** |
| 11 | **UI/UX y accesibilidad** | ui_ux_agent, accessibility_tester, browser_automation, computer_use_agent | **4 / 4** |
| 12 | **Dominio ajeno** (agricultura, fiscalidad india, salud, robótica, web3…) | ~30 | **0 / 30** |

**Total aprovechable: 83 de 161.** Los otros 78 son especialistas de dominios que
no tocan este proyecto; no se fuerzan.

---

## 3. Arquitectura de ejecución en tres capas

```
┌──────────────────────────────────────────────────────────────┐
│ CAPA 3 · JUEZ  (verificable, sin opinión)                     │
│   npm run verify:all · tools/fusion/auditar_ids.mjs           │
│   api_contract_auditor · visual_regression_detective          │
│   license_compliance_scanner · pr_reviewer                    │
├──────────────────────────────────────────────────────────────┤
│ CAPA 2 · CABEZAS  (161 agentes, paralelos, por oleadas)       │
│   investigan, redactan, normalizan, revisan                   │
│   NO escriben en el juego: entregan paquetes JSON             │
├──────────────────────────────────────────────────────────────┤
│ CAPA 1 · MANOS  (herramientas Node, deterministas)            │
│   tools/forense_roms.mjs · tools/fusion/*.mjs                 │
│   tools/apply_*.mjs  →  pokemon_fire_ash/Data/*.rxdata        │
└──────────────────────────────────────────────────────────────┘
```

Regla de oro: **un agente propone, la herramienta dispone y el verificador
juzga.** Así el paralelismo masivo no puede romper el juego.

---

## 4. Mapa agente → entregable

### Oleada 0 · Habilitar (3 agentes, secuencial)
`environment_doctor` → `connect_tools` + `list_agents` + `tool_status` → `agent_composer`
**Entrega:** inventario de agentes vivos y los 12 agentes propios del proyecto (§5).

### Oleada 1 · Minería forense (4 frentes · 12 agentes en paralelo)

| Frente | Agentes | Entregable |
|---|---|---|
| Glazed | `code_archaeology`, `data_wrangler`, `pattern_detector` | `content/fusion/glazed/manifiesto.json` |
| Light Platinum | `code_archaeology`, `data_wrangler`, `media_librarian` | `content/fusion/light_platinum/manifiesto.json` |
| Team Rocket | `code_archaeology`, `deep_research_agent`, `web_search` | `content/fusion/team_rocket/manifiesto.json` |
| Factory (GB) | `code_archaeology`, `pattern_detector`, `research_scout` | `content/fusion/pokegods/manifiesto.json` |

Apoyo transversal: `local_rag_builder` (índice de los 60 000 diálogos ya
extraídos), `i18n_agent` (normalización del español de los hacks),
`file_organizer` (inventario de `roms pokemon/`).

### Oleada 2 · Normalización y contratos (8 agentes)
`data_pipeline`, `dataset_agent`, `api_contract_auditor` (valida el esquema
`fusion/1.0` de cada paquete), `i18n_agent`, `visual_regression_detective`
(compara atlas de gráficos), `ui_ux_agent` (legibilidad de iconos e interfaz),
`prompt_engineer`, `self_critic_agent` (revisa cada paquete antes de entregarlo).

### Oleada 3 · Los tres mundos (3 frentes · 15 agentes)

Cada dimensión se lleva 5 agentes:

| Rol en la dimensión | Agente |
|---|---|
| Guion y diálogos | `storybook_story_generator` + `content_multiplier` |
| Misiones y banderas | `issue_triager` (desglose) + `memory_agent` (canon y continuidad) |
| Pruebas del paquete | `unit_test_writer` + `test_intelligence` |
| Coherencia visual | `visual_regression_detective` |
| Crítica antes de entregar | `self_critic_agent` |

Glazed y Light Platinum tratan a Ash como **viajero**; Team Rocket como
**infiltrado** (rango, misiones dobles, sabotaje).

### Oleada 4 · Sistemas compartidos (6 agentes)
`rag_designer` + `vector_db_agent` (biblia de lore compartida entre dimensiones),
`ui_ux_agent` + `accessibility_tester` (accesos y retorno siempre disponibles),
`ab_testing_agent` (dificultad de las Formas de Anomalía), `pattern_detector`
(coherencia de reglas entre dimensiones).

### Oleada 5 · Integración (6 agentes, casi secuencial)
`merge_conflict_predictor` (colisiones de IDs antes de aplicar),
`git_workflow_automator` (commits por agente con prefijo),
`api_contract_auditor` (última validación de contratos),
`tech_debt_quantifier` + `refactoring_agent` (limpieza de lo generado),
`release_manager` (cierre de la oleada).

### Oleada 6 · Calidad y cierre (8 agentes)
`security_guard` y `red_team_agent` (integridad de assets: nada roto, nada
huérfano), `license_compliance_scanner` y `compliance_auditor` (postura legal:
lo derivado se marca y lo copiado no entra), `sbom_generator`,
`unit_test_writer`, `tech_writer_assistant` + `changelog_generator`,
`adr_writer` (decisiones de diseño de la fusión), `sprint_reporter` (informe).

### Vigilancia continua (demonio, 4 agentes)
`monitoring_agent`, `log_detective`, `incident_responder`, `disk_space_prophet`.
El presupuesto lo vigila `token_budget` (0,50 $/tarea · 10 $/ejecución · 50 $/día).

---

## 5. Los 12 agentes propios del proyecto

Los 161 son generalistas. Con `agent_composer` (y `retrain-specialized.sh` +
`build_clean_dataset.py`) se componen **12 especialistas Fire Ash** entrenados
con nuestras convenciones reales: esquemas de `content/*.json`, patrón
`tools/apply_*.mjs` + `--verify`, rangos de mapas y banderas, y el tono del
proyecto.

| Agente propio | Especialidad |
|---|---|
| `fireash-minero-gba` | Extracción de tablas GBA (LZ77/RLE, punteros, paletas) |
| `fireash-minero-gb` | Sprites de Gen 1 y descompresor de pokered |
| `fireash-normalizador-graficos` | Front 96×96, Icons 128×64, Characters 256×256, paleta reducida |
| `fireash-normalizador-textos` | Diálogos en español con el tono del proyecto |
| `fireash-arquitecto-mapas` | Diseño de nivel por dimensión, con retorno libre |
| `fireash-disenador-batallas` | Formas de Anomalía, clima, jefes |
| `fireash-guardian-ids` | Auditoría de mapas, banderas y variables |
| `fireash-verificador` | Puerta única: qué entra y qué no |
| `fireash-pokegods` | Pokégods: sprites originales y criaturas derivadas |
| `fireash-dimension-glazed` | Canon de la primera dimensión |
| `fireash-dimension-lightplatinum` | Canon de la segunda |
| `fireash-dimension-teamrocket` | Canon de la tercera (infiltración) |

Los 12 viven en `.claude/agents/` del repo y heredan el contrato `fusion/1.0`.

---

## 6. Oleadas, paralelismo y puertas

| Oleada | Agentes | Paralelismo | Puerta de salida |
|---|---|---|---|
| 0 | 3 | secuencial | `tool_status` responde y los 12 agentes propios existen |
| 1 | 12 | 4 frentes × 3 | 4 manifiestos con `--verify` en verde |
| 2 | 8 | total | Catálogo común y atlas normalizados |
| 3 | 15 | 3 frentes × 5 | Tres paquetes de dimensión verificados |
| 4 | 6 | total | Accesos, retorno y reglas compartidas |
| 5 | 6 | casi secuencial | Fusión aplicada sin colisión de IDs |
| 6 | 8 | total | `verify:all` verde, licencias revisadas, PR |

Cada puerta la abre la **capa 3 (juez)**, no el agente que produjo el trabajo.
`failure_recovery` reintenta hasta 3 veces (simplificar → reformular → mínimo)
antes de escalar a `incident_responder`.

---

## 7. Cómo se arranca

En tu equipo (donde sí hay proveedor de LLM):

```bash
cd agents/timps-swarm-main
npm i -g timps-swarm && npx timps-swarm install-mcp     # registra los 161
pip install -r requirements.txt                          # backend completo
python3 -m src.main                                      # API en :8000
python3 -m mcp_server.server                             # MCP stdio
```

Con la capa gratuita de Gemini basta (`GEMINI_API_KEY`); con Ollama el coste es
cero. Para este espacio de trabajo, el camino ligero es el proxy de Node:

```bash
TIMPS_API_URL=http://localhost:8000 node cli/lib/mcp-proxy.js
```

Y para ver el swarm en vivo: `make ui` (dashboard en React).

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Sin proveedor de LLM en este espacio | Las manos (Node) hacen el trabajo determinista aquí; el swarm con LLM corre en tu equipo |
| 78 de los 161 agentes son de dominios ajenos | Se descartan explícitamente; se documenta por qué |
| Coste descontrolado con 40 agentes a la vez | `token_budget` con cortes duros de 0,50/10/50 $ |
| Colisión de IDs entre dimensiones | `fireash-guardian-ids` + `merge_conflict_predictor` antes de integrar |
| Deriva de tono en los textos | `i18n_agent` + `self_critic_agent` + verificación de tono del repo |
| Material con derechos de terceros | `license_compliance_scanner`: lo derivado se marca, lo copiado no entra; `roms pokemon/` sigue fuera de Git |

---

## 9. Definición de hecho

- [ ] Los 161 agentes instalados y los 12 propios compuestos con `agent_composer`.
- [ ] 4 manifiestos de minería cerrados y versionados.
- [ ] Catálogo común y atlas de gráficos normalizados.
- [ ] Tres dimensiones con entrada diegética, mundo propio, retorno libre y medallas.
- [ ] Formas de Anomalía, clima dañino y jefes de dimensión.
- [ ] Auditoría de IDs sin colisiones y licencias revisadas.
- [ ] `npm run verify:all` en verde y PR final con el informe de `sprint_reporter`.
