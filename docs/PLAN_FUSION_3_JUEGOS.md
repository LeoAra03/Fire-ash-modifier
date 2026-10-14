# Plan de fusión: Glazed · Light Platinum · Team Rocket como extensión paralela de Fire Ash

**Objetivo.** Que los tres juegos invitados dejen de ser material de consulta y se
conviertan en tres **dimensiones paralelas** de Fire Ash: se entra desde el mundo
original, se juegan con sus propias reglas y se vuelve cuando se quiera. No
sustituyen nada del juego base: se cuelgan de él.

**Principio rector (heredado del repo).** Se estudia la estructura y se
**reinterpreta**: los mapas, diálogos, batallas y gráficos que acaban en Fire Ash
son originales nuestros, escritos a partir de lo aprendido en las ROMs. El
material extraído vive en `roms pokemon/` (ignorado por Git) y sirve de
referencia; nunca se copia en crudo.

---

## 1. Qué significa «extensión paralela»

Cada juego invitado se modela como una **Ruta Paralela** con la misma forma:

| Pieza | Cómo se integra en Fire Ash |
|---|---|
| **Acceso** | Puerta diegética en Kanto/Johto (una grieta, un muelle, un espejo o una base Rocket). Nada de menús de teletransporte. |
| **Mundo** | Bloque propio de mapas con su tileset, sus encuentros y sus NPCs. |
| **Retorno** | El punto de entrada es siempre salida: el jugador nunca queda atrapado. |
| **Progreso** | Medallas propias de la dimensión, independientes de las de Kanto. |
| **Historia** | Una rama con inicio, nudo y desenlace; Ash es **viajero** en Glazed y Light Platinum e **infiltrado** en Team Rocket (cumple órdenes, sube de rango y por detrás avisa, cura y devuelve lo robado). |
| **Cierre** | Cada dimensión aporta una pieza al arco común (Liga Oscura / Grietas del Terror) sin ser obligatoria para terminar Fire Ash. |

Las tres son **independientes entre sí y jugables en cualquier orden**, igual que
las tres aventuras que ya define el proyecto.

---

## 2. Topología de agentes

**Máximo de agentes trabajando a la vez: 14**, repartidos en cinco carriles.
El límite no lo marca la creatividad sino la **propiedad de archivos**: cada
agente es dueño exclusivo de sus rutas, así que ninguno puede pisar el trabajo de
otro. Más de 14 obligaría a compartir ficheros y rompería esa garantía.

### Carril A · Minería (4 agentes, paralelos)

| Agente | Misión | Posee | Entrega |
|---|---|---|---|
| **A1 · ROM-Glazed** | Cerrar la extracción de `GlazedESPB6.gba`: segunda tabla de nombres, mapas, eventos, banderas | `roms pokemon/glazedespb6/**`, `tools/fusion/mineria/glazed.mjs` | `content/fusion/glazed/manifiesto.json` |
| **A2 · ROM-LightPlatinum** | Ídem para `LightPlatinumEsp.gba` (411 nombres ya localizados) | `roms pokemon/lightplatinumesp/**`, `tools/fusion/mineria/light_platinum.mjs` | `content/fusion/light_platinum/manifiesto.json` |
| **A3 · ROM-TeamRocket** | Resolver este ROM: no usa la tabla corrida de Esmeralda, hay que localizar sus punteros | `roms pokemon/pkmnteamrocket/**`, `tools/fusion/mineria/team_rocket.mjs` | `content/fusion/team_rocket/manifiesto.json` |
| **A4 · ROM-Factory (GB)** | Emparejar los 74 nombres de Pokégods con sus 153 frontales de 56×56 | `roms pokemon/factoryadventure/**`, `tools/fusion/mineria/factory.mjs` | `content/fusion/pokegods/manifiesto.json` |

### Carril B · Normalización (2 agentes, paralelos)

| Agente | Misión | Posee | Entrega |
|---|---|---|---|
| **B1 · Catálogos** | Vocabulario común: tabla de equivalencias de especies, movimientos, objetos, habilidades y tipos entre las tres ROMs y Fire Ash | `content/fusion/catalogo_comun.json`, `tools/fusion/normalizar_catalogos.mjs` | JSON de equivalencias + `--verify` |
| **B2 · Gráficos** | Pasar sprites y tiles a la paleta y los tamaños de Fire Ash (Front 96×96, Icons 128×64, Characters 256×256, paleta reducida, fondo transparente) | `content/fusion/graficos/**`, `tools/fusion/normalizar_graficos.mjs` | Atlas normalizados + `--verify` |

### Carril C · Mundos (3 agentes, paralelos)

| Agente | Misión | Posee | Entrega |
|---|---|---|---|
| **C1 · Dimensión Glazed** | Mapas, NPCs, encuentros, misiones y jefes de la primera ruta paralela | `content/fusion/glazed/{mapas,npcs,batallas,misiones,banderas}.json`, `tools/fusion/aplicar_glazed.mjs` | Dimensión instalada + `--verify` |
| **C2 · Dimensión Light Platinum** | Ídem para la segunda | `content/fusion/light_platinum/**`, `tools/fusion/aplicar_light_platinum.mjs` | Ídem |
| **C3 · Dimensión Team Rocket** | Ídem para la tercera, con la mecánica de **infiltración** (rango, misiones dobles, sabotaje) | `content/fusion/team_rocket/**`, `tools/fusion/aplicar_team_rocket.mjs` | Ídem |

### Carril D · Sistemas compartidos (3 agentes, paralelos)

| Agente | Misión | Posee | Entrega |
|---|---|---|---|
| **D1 · Accesos** | Las tres puertas de entrada, los puntos de retorno y el hub que las conecta con Kanto/Johto | `content/fusion/accesos.json`, `tools/fusion/aplicar_accesos.mjs` | Entrar/salir libre verificado |
| **D2 · Historia y diálogos** | Guion unificado de las tres ramas, con el tono del proyecto (seguro, sin material sensible) | `content/fusion/historia/**`, `tools/fusion/aplicar_historia.mjs` | Textos instalados + `--verify` de tono |
| **D3 · Batallas y anomalías** | Formas de Anomalía (Alfa/Beta/Omega), clima dañino, inmunidades extremas y los jefes de dimensión | `content/fusion/batallas/**`, `tools/fusion/aplicar_batallas.mjs` | Encuentros y jefes + `--verify` |

### Carril E · Integración y calidad (2 agentes, secuenciales)

| Agente | Misión | Posee | Entrega |
|---|---|---|---|
| **E1 · Integración** | Único que toca ficheros compartidos: aplica los paquetes de C1-C3 y D1-D3 en el juego, resuelve colisiones de IDs y cierra el paquete | `tools/fusion/integrar.mjs`, `pokemon_fire_ash/Data/**` | Fusión instalada |
| **E2 · Verificación** | Deja la casa en orden: `npm run verify:all` en verde, auditoría de banderas, PR final | `tools/fusion/auditar_ids.mjs`, informes | PR listo para revisión |

---

## 3. Contratos entre agentes

Todo lo que cruza de un agente a otro es un JSON con esta cabecera, para que la
integración sea mecánica y auditable:

```json
{
  "esquema": "fusion/1.0",
  "agente": "C1",
  "dimension": "glazed",
  "origen": "roms pokemon/glazedespb6",
  "derivado": true,
  "nota_legal": "Material de referencia para uso personal; el contenido generado es original.",
  "ids": { "mapas": [4000, 4199], "banderas": [4000, 4199] },
  "depende_de": ["A1", "B1", "B2"],
  "datos": { }
}
```

Reglas del contrato:

- `derivado: true` es obligatorio: **nada entra en el juego sin pasar por
  normalización** (B1/B2). Un agente de carril C que necesite un sprite lo pide
  al contrato de B2, no al ROM.
- `ids` declara el bloque que usa el agente. **Nadie escribe fuera de su bloque.**
- `depende_de` alimenta el grafo de la sección 5.

## 4. Asignación de identificadores

Rangos candidatos (E1 los valida contra los datos reales antes de aplicar nada):

| Bloque | Rango | Uso |
|---|---|---|
| Fire Ash base | existente | Intocable |
| Isla Espejo | 997–999 | Hecho |
| Atlas Mil | bloque propio (1000+) | Hecho |
| Grietas del Terror | 2023–2029 | Hecho |
| Dimensional Nightmare | 2040–2194 | Hecho |
| **Dimensión Glazed** | **4000–4199** | C1 |
| **Dimensión Light Platinum** | **4200–4399** | C2 |
| **Dimensión Team Rocket** | **4400–4599** | C3 |
| **Accesos y hub** | **4600–4699** | D1 |

Banderas y variables siguen el mismo reparto (un bloque de 200 por dimensión).
`tools/fusion/auditar_ids.mjs` (E2) comprueba que ningún bloque pisa otro y que
no hay referencias a assets inexistentes.

## 5. Fases y paralelismo

```
Fase 0 · Cimientos      A1 A2 A3 A4 B1 B2        → 6 agentes en paralelo
                              ↓
Fase 1 · Mundos         C1 C2 C3  D1 D2 D3       → 6 agentes en paralelo
                              ↓
Fase 2 · Integración    E1                        → 1 agente (serializado)
                              ↓
Fase 3 · Calidad        E2                        → 1 agente
```

- **Fase 0** no toca el juego: solo produce manifiestos y catálogos.
- **Fase 1** tampoco toca el juego: produce paquetes `content/fusion/**` con su
  propio `--verify`.
- **Fase 2** es el único punto donde se escriben `pokemon_fire_ash/Data/*.rxdata`,
  y lo hace un solo agente para evitar carreras.
- Cada fase termina con su puerta verde antes de abrir la siguiente.

## 6. Protocolo anti-colisión

1. **Propiedad exclusiva:** la tabla de la sección 2 es la ley. Si un agente
   necesita tocar un archivo ajeno, lo declara y lo hace E1.
2. **Prefijo de commit:** `[AG-C1]`, `[AG-D2]`… así el historial dice quién tocó
   qué y se puede revertir por agente.
3. **Una rama,-commits pequeños:** todas las sesiones comparten
   `arena/01a106d1-fire-ash-modifier`, así que cada agente hace `git fetch` antes
   de commitear y trabaja sobre rutas distintas. Nada de `--force`.
4. **Puerta por agente:** ningún paquete se considera hecho sin su
   `node tools/fusion/... --verify` en verde.
5. **Sin assets huérfanos:** si un paquete referencia un gráfico que no existe,
   el agente lo crea, lo busca o lo adapta; nunca deja la referencia rota.

## 7. Estimación en macroprompts

| Fase | Macroprompts | Comentario |
|---|---|---|
| Fase 0 | **2** (uno para A1-A4, otro para B1-B2) | O 4 si se quiere cerrar cada ROM por separado |
| Fase 1 | **3** (uno por dimensión, D1-D3 se reparte entre ellos) | La parte más larga: es donde se escribe el juego |
| Fase 2 | **1** | Integración y resolución de colisiones |
| Fase 3 | **1** | Verificación, ajustes y PR |
| **Total** | **7 macroprompts** | 5 si se agrupa Fase 1 de dos en dos |

Cada macroprompt puede ser tan simple como «sigue con la fase N»: dentro de un
turno el agente encadena todas las herramientas que hagan falta.

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Team Rocket no suelta sus tablas** (solo 38 bloques LZ77) | A3 trabaja por estructura de punteros y, si no aparece, reconstruye el mundo desde los textos (21 066 cadenas) y los bloques RLE |
| **Colisión de IDs** al crecer | Auditoría automática en E2 antes de aplicar, con bloques holgados de 200 |
| **Deriva de alcance** entre carriles | Los contratos son la única vía de paso entre fases |
| **Pérdida del material extraído** (el espacio de trabajo purga lo ignorado) | Los manifiestos de `content/fusion/**` sí se versionan; si `roms pokemon/` desaparece, los RAR se recuperan del historial de Git y se vuelven a extraer |
| **Verificación en rojo por causas ajenas** (Dimensional Nightmare) | E2 separa los fallos propios de la fusión de los heredados y los reporta aparte |

## 9. Definición de hecho

- [ ] Los tres manifiestos de `content/fusion/*/manifiesto.json` cerrados y versionados.
- [ ] Catálogo común y atlas de gráficos normalizados con su `--verify` en verde.
- [ ] Tres dimensiones instaladas, cada una con **entrada diegética, mundo propio, retorno libre y medallas**.
- [ ] Historia de cada una con el rol de Ash correspondiente (viajero, viajero, infiltrado).
- [ ] Batallas con Formas de Anomalía y jefes de dimensión.
- [ ] `npm run verify:all` en verde y auditoría de banderas sin huecos.
- [ ] PR final con el resumen de lo aportado por cada agente.
