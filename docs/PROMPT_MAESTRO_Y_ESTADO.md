# Fire Ash Modificada — Prompt maestro y estado real del proyecto

> **Para qué sirve este documento.** Es la referencia única. Si mañana arrancas una
> sesión nueva con cualquier agente, le pegas la §1 y ya sabe qué estamos haciendo.
> Si quieres saber qué hay hecho y qué falta sin leer código, lees la §3 y la §4.
> Todo número de aquí está **medido sobre el árbol real**, no recordado de memoria.
>
> Generado: 2026-10-05 · rama `arena/01a106d1-fire-ash-modifier` · HEAD `7ccb26d0`
> Censo de esa instantánea: 2210 mapas · 23 591 eventos · 2741 eventos del DLC · 16/16 verificadores en verde.
>
> **Aviso de vigencia:** esa cabecera corresponde a otra rama/commit y no describe el checkout actual. En la rama actual el `MapInfos.rxdata` y los mapas coinciden en **2229** entradas; la auditoría vigente de los archivos, ROMs y herramientas está en [`AUDITORIA_REPOSITORIO_Y_RECURSOS.md`](AUDITORIA_REPOSITORIO_Y_RECURSOS.md).

---

## 1. EL PROMPT DEL JUEGO

*(Este es el bloque para copiar y pegar. Es la definición completa y vigente del proyecto.)*

```
PROYECTO: Fire Ash Modificada — DLC post "La Ruta de Dios"
MOTOR:    RPG Maker XP + Pokémon Essentials (Fire Ash, hack original intocable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LA REGLA DE ORO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sin tocar el contenido original de Fire Ash. Todo el contenido nuevo va en IDs
nuevos: mapas, eventos, switches, variables, banderas. Nunca se edita un mapa,
un evento ni un diálogo que ya existiera. Si algo hay que deshacer, se restaura
con cp -f desde PokeModBackups/.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. EL CANON (de dónde sale todo)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Todo el contenido extra existe POR el duelo contra Arceus en La Ruta de Dios.
Nada es accesible antes de ese duelo. Al derrotarlo, Arceus suelta un Fragmento
que despierta al Rotom del Tiempo, y el Rotom sostiene las dimensiones como
"fragmentos de dimensión". Si capturas a Arceus, aparece junto a Oak y antes
de Mad Pikachu. La batalla abusa de las mecánicas según la fase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ARCEUS ESCRITO COMO OMEGA FLOWEY (no negociable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arceus no es un "dios de la creación" genérico. Arceus:
  · manda sobre CONCEPTOS, no sobre criaturas: OBJETO, CIELO, TALENTO,
    VELOCIDAD, TIPO, REGLA.
  · SABE que está dentro de un juego y lo dice.
  · reta a ASH KETCHUM por su nombre.
  · pelea en dobles coreografiados (25/25 auditados).
Prosa de "deidad benévola" = incorrecta. Arceus es un antagonistacon
conciencia de ser un asset en un cartucho.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. LOS SEIS PILARES DEL DLC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P1 RUTA DE DIOS. El duelo de Arceus, su canon, sus fases, el Fragmento.
P2 LOS SIETE MUNDOS CREEPYPASTA. Grietas del Terror en Kanto/Johto
   (Maps 2023–2029). Fieles a su fuente, pero Ash es el agente EXTERNO que
   devuelve el color y la paz. Nunca atrapan al jugador: se entra, se explora,
   se vuelve. Purgar las siete abre la LIGA OSCURA.
P3 EXPEDICIÓN ATLAS MIL. Se llega por PORTAL. Región propia con circuito de
   OCHO gimnasios genuinamente nuevos (no ecos de Pewter/Cerulean): Map 2230
   + Maps 2250–2257.
P4 GLAZED y LIGHT PLATINUM. Dos dimensiones invitadas que se alcanzan en
   BARCO desde Puerto Horizonte (Maps 2200/2201 y 2210/2211). Ash viaja como
   viajero. Cada una con su capitán y su barco esperando para volver.
P5 ISLAS ESPEJO / POKÉGODS. 19 Pokégods originales de la época temprana,
   con Formas Anomalía ALFA / BETA / OMEGA. Se entra por el espejo del
   sótano de la Mansión de Cinnabar, y sólo por ahí. Sprites propios.
P6 LA DIMENSIÓN TEAM ROCKET. Ash NO es turista: se INFILTRA. Se pone el
   uniforme, hace misiones, asciende por el escalafón (Recluta → Agente →
   Oficial → Teniente → Comandante → Jefe Supremo) y en cada misión
   salvaguarda a los heridos. Cuando por fin manda, manda para bien: la
   dimensión pasa a cuidar a los suyos en vez de usarlos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. REGLAS DE DISEÑO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  · Sin menús de teletransporte artificiales. Nada de cápsulas en el lab.
    Todo acceso es diegético y está integrado en el mundo.
  · El jugador siempre puede entrar, explorar y volver sano y salvo al mundo
    principal. Libertad total, en cualquier orden.
  · Cada mapa del DLC es DISTINTO de los demás y no tiene tiles mal puestos.
  · Si falta un asset, se crea, se busca o se adapta. No se deja el hueco.
  · El laboratorio Oak se queda como está: transportadores originales y Oak
    como NPC consultivo. Sin cápsula nueva.
  · Investigación: recrear los Pokégods originales de la primera época a
    partir de la ROM GBC FactoryAdventure.gb ("POKEMON FACTORY").
  · Análisis forense de las 4 ROMs invitadas: se desarman como si fueran
    evidencia, con decodificadores reales (LZ77, tiles 4bpp/2bpp, paletas).
  · "No te limites en ningún aspecto."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. ENTREGA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Todo queda instalado y LISTO PARA JUGAR en Scripts_corregido/:
Scripts.rxdata + Data/ + los paquetes generados. No basta con que esté en
pokemon_fire_ash/. La cadena completa de reconstrucción debe haberse ejecutado.
```

---

## 2. MAPA DEL REPOSITORIO

| Carpeta | Qué es |
|---|---|
| `pokemon_fire_ash/` | El juego vivo (708 MB). Aquí se edita. 2213 mapas versionados. |
| `Scripts_corregido/` | **El entregable jugable.** `Scripts.rxdata` + `Data/` + 3 ZIPs. |
| `tools/` | 116 herramientas `.mjs` + `tools/lib/` (6 módulos). Un instalador por pilar. |
| `content/` | 62 JSONs: los *datos* de todo el contenido nuevo, separados del código. |
| `docs/` | 45 documentos. `DLC_TOTAL.md` es el acta narrativa; éste es el estado. |
| `web/js/` | `marshal.js` (Ruby Marshal) y `rmxp.js` (RXData). Las entrañas del formato. |
| `reference/` | 19 MB: arte fuente de Dimensional Nightmare y concept art de Pokégods. |
| `agents/` | Definiciones de agentes del enjambre. |

---

## 3. LO QUE TENEMOS (medido)

### 3.1 El juego base

| Dato | Valor |
|---|---:|
| Mapas (`Data/Map*.rxdata`) | **2210** |
| Eventos totales | **23 591** |
| Eventos puestos por el DLC | **2741** |
| `species.dat` | 2628 entradas (especies + formas) |
| `moves.dat` | 2138 entradas |
| `items.dat` | 2062 entradas |
| `trainers.dat` | 7970 entradas |
| `abilities.dat` | 872 entradas |
| `trainertypes.dat` | 223 |
| `Tilesets.rxdata` | 173 tilesets |
| `CommonEvents.rxdata` | 50 |
| `encounters.dat` | 298 tablas, de las cuales 18 son nuestras (133 slots) |
| `Audio/BGM/` | 332 pistas |

### 3.2 Los 17 mapas nuevos del DLC

| ID | Qué es | Música |
|---:|---|---|
| 2195 | Vía de las Nueve Eras | `route.mid` |
| 2196 | Gimnasio de la Vía (genuinamente nuevo) | `gymleader-stadium.ogg` |
| 2200 | Glazed — Bahía de Cedolán | `DN_SnowSilver.mid` |
| 2201 | Gimnasio Glazed | `gymsinnoh.ogg` |
| 2210 | Light Platinum — Costa | `Sinnoh Route.ogg` |
| 2211 | Gimnasio Light Platinum | `gymleader-8.ogg` |
| 2220 | Team Rocket — Base Subterránea | `TeamRocket.ogg` |
| 2221 | Team Rocket — Núcleo del Mando | `Team Rocket OW Kanto.ogg` |
| 2230 | Atlas Mil — Avenida del Circuito | `Kalos Town.ogg` |
| 2250–2257 | Los ocho gimnasios de Atlas | `gym.ogg` + `gymleader-1..6.ogg` + `Battle Gym Leader.mid` |

Los 17 suenan y reproducen la música al entrar. Los cinco que tienen terreno
compatible llevan encuentros salvajes temáticos: 2195 y 2220 y 2230 tipo Cueva,
2200 y 2210 tipo Tierra.

### 3.3 Los seis pilares, uno por uno

| # | Pilar | Estado |
|---|---|---|
| **P1** | Ruta de Dios / duelo de Arceus | ✔ Instalado. Canon en `content/canon_arceus.json`, `docs/CANON_ARCEUS.md`. Duelo con conceptos, 25/25 dobles auditados. |
| **P2** | Siete mundos creepypasta + Liga Oscura | ✔ Instalado. Maps 2023–2029, 30 eventos `PokeMod Restauración:` + 28 `PokeMod Grieta:`. Los interruptores de emisión viven en **940–947**, no en 868–875 (873/874 son flags canónicas de Arceus). |
| **P3** | Expedición Atlas Mil | ✔ Instalado. 50 eventos `PokeMod Circuito:`, 25 `PokeMod Vía:`. Ocho gimnasios nuevos. |
| **P4** | Glazed + Light Platinum en barco | ✔ Acceso instalado (24 eventos `PokeMod Barco:`), pero **sólo 2 mapas por dimensión** — ver §4.2. |
| **P5** | Islas Espejo / Pokégods | ✔ Completo. **19 Pokégods** (12 clásicos + 7 extraídos de la ROM GBC), con Front, Back, Icons y Characters propios, y formas ALFA / BETA / OMEGA. Acceso por el espejo del sótano de la Mansión de Cinnabar. |
| **P6** | Team Rocket — infiltración | ✔ Estructura instalada. Escalafón de 6 rangos, 5 misiones, heridos, medalla. 22 eventos. — ver §4.3. |

### 3.4 Otro contenido ya dentro del juego

- **500 Horizontes**: 20 reinos × 25 aventuras. Los **500 eventos `Horizonte N:` están instalados** en 20 mapas.
- **Pokégods**: 19, `assets.pendientes` vacío. Formas: ALFA (nivel 85, IVs 31, capturable), BETA (nivel 100, EVs 252/252/6, no se puede huir), OMEGA (nivel 115, shiny).
- **Dimensional Nightmare**: mundo propio con arte, audio, batallas y mapas (`docs/DIMENSIONAL_NIGHTMARE/`).
- **DLC de ambientes**: banda sonora y encuentros en los 17 mapas (esta entrega).
- **21 eventos HUB** de grieta, archivero, progreso, salida y Liga Oscura.
- **19 puertas `Gate:`** de conexión entre dimensiones.

### 3.5 Verificación

**16 de 16 verificadores en verde:**

```
verify:canon:arceus  verify:atlas:tiles   verify:arceus:cinematics  verify:eras
verify:restauracion  verify:dimensiones   verify:rocket             verify:circuito
verify:ambience      verify:wild          verify:package            verify:expansion:package
verify:atlas         verify:arceus-portal verify:tone-safety        verify:transition-safety
```

Único rojo: `dn:plan:check`, y sólo porque se purgó `reference/dimensional_nightmare/slices/`.
No afecta al juego.

### 3.6 Orden de reconstrucción (obligatorio, no alterar)

```
apply_expansion_multiversal.mjs   ← siempre primero
apply_canon_arceus.mjs            ← siempre DESPUÉS del anterior
apply_atlas_eras_map.mjs
apply_restauracion_cromatica.mjs
apply_dimensiones_barco.mjs
apply_team_rocket_mision.mjs
apply_atlas_circuito.mjs
apply_dlc_ambience.mjs  →  apply_wild_zones.mjs   ← esta entrega
build_direct_package.mjs
apply_tone_safety_fix.mjs
apply_transition_safety_fix.mjs   ← protege los fundidos en cascada
build_expansion_package.mjs
generate_map_reference_package.mjs --refresh-report --force
```

Los cuatro instaladores de mapas necesitan `node --max-old-space-size=6144`.

---

## 4. LO QUE NOS FALTA

### 4.1 Pendiente real, por orden de importancia

| # | Hueco | Por qué importa | Cómo se cierra |
|---|---|---|---|
| **1** | **Nadie ha jugado el DLC de punta a punta.** | Todo lo demás es teoría hasta que una partida real entra, explora y vuelve. | Partida de prueba guiada por `docs/QA_MANUAL_PLAYTEST.md`. |
| **2** | **Las dimensiones invitadas son un puerto, no una región.** Glazed y Light Platinum tienen 2 mapas cada una cuando las ROMs originales son regiones completas. | El pilar P4 pide "explorarlas", y ahora mismo son una bahía y un gimnasio. | Extraer más mapas de las ROMs invitadas y generarlos con `tools/lib/dimension_builder.mjs`. |
| **3** | **Team Rocket tiene la estructura pero no la carne.** 22 eventos para 6 rangos, 5 misiones, heridos y un rival. | La infiltración es el bucle de juego más original del DLC y está en esqueleto. | Escribir el guion de las 5 misiones y poblar 2220/2221. |
| **4** | **El plan de los 161 agentes está escrito, no ejecutado.** `docs/PLAN_SWARM_161.md` existe. | Es el plan de producción para rellenar los huecos 2 y 3 a escala. | Arrancar los carriles que faltan. |
| **5** | **Los charsets y sprites propios son parciales.** Hay arte para Pokégods y Dimensional Nightmare; los NPC del DLC reutilizan gráficos existentes. | Un mundo nuevo con caras conocidas se siente prestado. | `generate_image` (máx. 10 por turno) + adaptación. |
| **6** | **Las ROMs invitadas no están en este clon.** `roms pokemon/` no existe aquí; sólo quedó la extracción en `reference/roms_invitadas/` (gitignorada). | Sin las ROMs no se puede seguir extrayendo. | Subirlas otra vez y `git fetch` + `checkout`. |
| **7** | **Falta auditoría de diálogos.** 2741 eventos puestos; nadie ha leído los textos uno por uno buscando cortes, repeticiones o tono roto. | La calidad narrativa es el punto fuerte del proyecto. | Volcado de todos los textos `PokeMod*` a un JSON y revisión. |
| **8** | **Las medallas de Atlas y Rocket** están declaradas en JSON pero su iconografía es prestada. | Cada dimensión debe tener su identidad visual. | Assets propios. |

### 4.2 Detalle: Glazed y Light Platinum

Lo que hay ahora: un puerto (`Puerto Horizonte`, Map 1001), un capitán por
dimensión, un barco en cada orilla, un mapa de llegada y un gimnasio.

Lo que pide el brief: *"tres dimensiones paralelas con puertas diegéticas,
reglas y medallas propias, vuelta libre y en cualquier orden"*. Es decir,
regiones explorables. Hoy son **dos habitaciones**, no dos regiones.

Para cerrarlo hay que volver a abrir las ROMs y sacar más territorio.
`docs/ROM_INVITADO_EXTRACCION.md` y `docs/ROMS_POKEMON_FORENSE.md` ya
documentan el formato.

### 4.3 Detalle: Team Rocket

Lo que hay: escalafón de 6 rangos (`Recluta → Agente → Oficial → Teniente →
Comandante → Jefe Supremo`), 5 misiones declaradas, contador de heridos,
variable de rango, medalla, rival y los mapas 2220 (base) y 2221 (núcleo).

Lo que falta: **el contenido de las 5 misiones**. El escalafón está, pero
subir de rango no tiene historia detrás. Y el brief es específico: Ash
salvaguarda a los heridos y toma el control *para el bien de los habitantes*.
Ese arco — obedecer para poder mandar, y mandar para cuidar — es lo que hoy no
está escrito.

---

## 5. CÓMO SEGUIR

Por si quieres retomar en una sesión nueva:

1. **Comprueba primero que el árbol está bien.** El clon se ha revertido solo
   al commit base más de una vez. Antes de creer que algo se perdió:
   ```bash
   git log --oneline -1
   git ls-remote origin arena/01a106d1-fire-ash-modifier
   ```
   Si el remoto tiene más, recupera con:
   ```bash
   git fetch -q origin arena/01a106d1-fire-ash-modifier
   git reset -q --hard origin/arena/01a106d1-fire-ash-modifier
   ```
2. **Lee `docs/DLC_TOTAL.md`** para la narrativa y este documento para el estado.
3. **Corre los 16 verificadores.** Si todos están en verde, el juego está sano
   y puedes tocar lo que quieras.
4. **Elige un hueco de la §4 y ataca sólo ése.** Cada pilar tiene su propio
   instalador y su propio verificador; se construyen de uno en uno.
5. **Nunca te saltes `apply_transition_safety_fix.mjs`.** Protege los fundidos
   encadenados de la Vía de las Nueve Eras.
