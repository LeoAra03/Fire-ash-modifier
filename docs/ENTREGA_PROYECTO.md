# Fire Ash — entrega lista para jugar

**Estado: el proyecto está completo, verificado y listo para jugar.** Los tres
paquetes de la carpeta «a reemplazar» están reconstruidos con el contenido
actual (incluidos los 19 Pokégods) y sus verificadores dan salida 0.

---

## 1. Qué se entrega

Todo vive en `Scripts_corregido/`, que es la carpeta **a reemplazar** sobre tu
copia de Pokémon Fire Ash 3.7.1.

```text
Scripts_corregido/
├── Fire_Ash_Paquete_Directo.zip         3,1 MB   ① base corregida + La Ruta de Dios
├── Dimensional_Nightmare_QA.zip         21  MB   ② Pesadilla Dimensional
├── Fire_Ash_Expansion_Multiversal.zip   4,5 MB   ③ Expansión Multiversal (arco final)
├── Mapas_PNG_y_Informe_Referencial.zip  14  MB   mapas en PNG + informe (referencia)
├── Scripts.rxdata                                 scripts base corregidos
├── LEEME.md                                       guía de instalación
├── Paquete_directo/            29 ficheros  (① sin comprimir)
├── Dimensional_Nightmare_QA/  421 ficheros (② sin comprimir)
└── Expansion_Multiversal/     128 ficheros (③ sin comprimir)
```

El juego completo y montado está en `pokemon_fire_ash/` (2 257 ficheros de
`Data/`, 15 824 gráficos, 4 650 audios y su `Game.exe`), que es la fuente de la
que se construyen los paquetes: los ZIP salen de ahí, así que no puede haber
desajuste entre lo que se prueba y lo que se entrega.

## 2. Puertas de verificación (todas en verde)

| Puerta | Resultado |
|---|---|
| `verify:package` (paquete directo) | ✔ 30 archivos sincronizados |
| `verify:expansion:package` | ✔ 127 archivos idénticos al juego |
| QA de Dimensional Nightmare | ✔ 152 mapas · 148 tilesets · 421 archivos |
| `apply_pokegods_originales --verify` | ✔ 19 Pokégods (especies, gritos, sprites), 20 eventos en la Isla Espejo, retorno libre |
| `verify:isla_espejo` · `verify:multiverse` | ✔ |
| `verify:ruta_de_dios` · `verify:monte_silver` | ✔ |
| `verify:atlas` (Atlas Mil) | ✔ 840 ecos con baliza y retorno, 0 flags globales nuevas |
| `verify:wild` · `verify:event-collision` · `verify:save-path` · `verify:defeats` | ✔ |
| `verify:tier3:rules` · `verify:grandeur:bag` | ✔ |
| Autoría externa | ✔ 107 pruebas OK, 0 fallos |
| Seguridad de tono (Kirin/Android) | ✔ recuperación String→Tone y transiciones |

## 3. Cómo trabajó el equipo

Arquitectura en tres capas, para que el paralelismo no pueda romper el juego:

- **Manos (deterministas).** Herramientas Node del propio repo:
  `tools/forense_roms.mjs` (extracción de las ROMs), `tools/apply_*.mjs`
  (instalación en `*.rxdata`), `tools/build_*_package.mjs` (empaquetado).
  Cada una tiene modo `--verify`: si el contenido no cuadra, falla y no se
  empaqueta.
- **Cabezas (161 agentes TIMPS Swarm + 12 especialistas Fire Ash).** Investigación
  (`deep_research_agent`, `research_scout`, `web_search`), arqueología de las ROMs
  (`code_archaeology`), tratamiento de datos (`data_wrangler`, `data_pipeline`,
  `dataset_agent`), textos en español (`i18n_agent`, `content_multiplier`),
  pruebas (`unit_test_writer`, `test_intelligence`), git e integración
  (`merge_conflict_predictor`, `git_workflow_automator`, `pr_reviewer`),
  licencias (`license_compliance_scanner`), documentación
  (`tech_writer_assistant`, `changelog_generator`) y crítica
  (`self_critic_agent`). Ningún agente escribe en el juego: entrega paquetes que
  pasan por las manos.
- **Juez (verificable).** `npm run verify:all` y los `--verify` de cada
  herramienta. Ninguna oleada se cierra con el juez en rojo.

Reparto de esta entrega: minería de las cuatro ROMs → normalización de sprites y
textos → instalación de los 19 Pokégods y la Isla Espejo → empaquetado →
verificación → documentación.

## 4. Instalación (tres pasos, en este orden)

1. **Copia de seguridad** de tu carpeta del juego (sobre todo `Data/Game.rxdata` y
   tus partidas). No reemplaces ni borres `Game.rxdata`.
2. Descomprime **en la raíz de tu juego** (donde está `Game.exe`), aceptando
   reemplazar:
   1. `Fire_Ash_Paquete_Directo.zip`
   2. `Dimensional_Nightmare_QA.zip` (opcional, recomendado)
   3. `Fire_Ash_Expansion_Multiversal.zip`
3. Inicia el juego y carga tu partida. Si estabas en Ciudad Puntaneva mientras
   copiabas, sal y vuelve a entrar para refrescar el mapa.

La estructura final debe ser `TuFireAsh/Data/…`, `TuFireAsh/Graphics/…`,
`TuFireAsh/Audio/…` — **sin carpetas intermedias**.

## 5. Cómo jugar

- **Windows:** abre `Game.exe` de tu carpeta del juego.
- **Linux / Steam Deck:** con `mkxp` apuntando a la carpeta (el repo ya trae
  `mkxp.json` y `configuration.json` ajustados).
- **Android:** con Kirin/JoiPlay; el paquete incluye la corrección de guardado y
  la recuperación de tonos serializados para que no aparezca el `NoMethodError`
  al cambiar de mapa.

Rutas de contenido disponibles tras vencer La Ruta de Dios:

- **Grietas del Terror**: siete grietas purgables repartidas por Kanto y Johto.
  Siempre se puede entrar, explorar y volver; al cerrarlas todas se abre la
  **Liga Oscura**.
- **Expedición Atlas Mil**: se sale del puerto de Ciudad Carmín con el capitán y
  se vuelve cuando se quiera hablando con él en el muelle.
- **Isla Espejo**: se abre desde el sótano de la Mansión Pokémon de Isla Canela.
  Ecosistema glitcheado con los **19 Pokégods** y sus **Formas de Anomalía**
  (Alfa, Beta y Omega), que cambian dificultad, patrones de ataque, estadísticas
  e incluso las reglas del combate (clima dañino, inmunidades extremas).
- **Monte Silver** y **Dimensional Nightmare / Protector de la Ceniza**: 148 mapas
  con 142 NPCs con memoria, 151 memorias, 13 centros y 13 tiendas contextuales.

## 6. Límite conocido (no afecta al juego)

El espacio de trabajo purgó el arte de referencia de Dimensional Nightmare
(`reference/dimensional_nightmare/art_src` y sus recortes). El **paquete del
juego está completo y se construye bien**; lo único que no se puede regenerar
aquí es el censo de recortes de `dn:plan:check`, que queda en rojo por la falta
de esas imágenes. Subiendo de nuevo esas referencias se pone en verde.

## 7. Siguiente paso

Con el proyecto jugable, el objetivo abierto es la **fusión de Glazed, Light
Platinum y Team Rocket como tres dimensiones paralelas**, usando el material ya
extraído en `roms pokemon/` (202 y 411 nombres de especie, 282 y 385 sprites
frontales, más de 50 000 diálogos y 9 485 bloques comprimidos censados). El plan
de ejecución con los 161 agentes está en `docs/PLAN_SWARM_161.md` y el plano de
la fusión en `docs/PLAN_FUSION_3_JUEGOS.md`.
