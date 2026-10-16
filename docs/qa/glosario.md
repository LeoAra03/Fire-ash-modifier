# Glosario congelado del proyecto

Diccionario de términos de Fire Ash Modifier, **congelado** el 2026-10-15 por la fase
1/46199 (tarea 35). Los siete términos de abajo son la referencia única: cuando dos
documentos o dos scripts usen una de estas palabras, manda lo que dice aquí.

**Qué significa «congelado».** El contenido de este archivo está sellado por hash en
[`content/qa_glosario_congelado.json`](../../content/qa_glosario_congelado.json). Cualquier
edición de este archivo hace fallar `npm run verify:glosario` hasta que se presente una
revisión nueva con `node tools/qa/glosario_check.mjs --recongelar`, que sube la revisión,
actualiza el hash y deja la fecha registrada. Añadir un término nuevo, cambiar una
definición o tocar una fuente también rompe el sello: congelar no quiere decir «no se
puede tocar», quiere decir que **no se puede tocar sin decirlo**.

**Alcance.** Este glosario no define mecánicas nuevas ni flags nuevas: describe lo que ya
está instalado en el repositorio y apunta al archivo donde se comprueba. Cada término
lleva sus fuentes y, cuando corresponde, los identificadores exactos (mapas, switches,
variables) que hoy tienen ese significado.

**Términos congelados:** Vía · Ancla · Emisión · Sello · Fragmento · Dimensión invitada ·
Liga Oscura.

---

## Vía

**Definición.** Corredor urbano de enlace dentro de Atlas Mil: un mapa continuo con un
distrito por generación y un gimnasio propio, accesible sólo después del duelo de Arceus.
Hoy existe una sola: la **Vía de las Nueve Eras**, mapa **2195** (106×106), con el
gimnasio **2196** «Las Nueve Eras» y su líder Vera. Cada distrito se construyó con una
ventana real de una ciudad canónica de su generación (Azafrán, Trigal, Portual, Pirita,
Mayólica, Luminalia, Malíe, Artejo y Cedolán) y se unen en serpentina, con anillo de
suelo del propio mapa donante.

**Qué no es.** No es un Tier 2 del Atlas (eso son las **rutas**, 120 lotes intermedios
entre anclas y ecos) ni «La Ruta de Dios» (mapa 2037, la aproximación al duelo de
Arceus). «Vía» sin apellido no es un tipo de mapa genérico del repositorio: es el nombre
propio de este corredor.

**Dónde aparece.** Mapa 2195 · gimnasio 2196 · puerta desde el hub Atlas con
`switch 873` (sin el duelo resuelto, la Vía no existe).

**Fuentes.** `docs/VIA_NUEVE_ERAS.md` · `tools/apply_atlas_eras_map.mjs` ·
`docs/DLC_TOTAL.md`.

---

## Ancla

**Definición.** Término con dos sentidos vivos, ambos anclados a un número:

1. **Ancla Tier 1 (Atlas Mil).** Cada uno de los **40** mapas que encabezan un sector del
   Atlas: 40 sectores de 25 mapas, ids **1021–1996** (una ancla cada 25), switches
   **708–747** (`POKEMOD ATLAS SEAL 01…40`) y la variable compartida **103**. El ancla abre
   su sector y su switch es la prueba de haberlo cerrado; la jerarquía completa es 40
   anclas · 120 rutas · 840 ecos.
2. **Ancla (Dimensional Nightmare).** El nivel **5** de sintonía del Rotom: umbral
   **v265 = 100**, espejo en **v275 = 5**. Con Ancla activa el mundo «no puede borrar a
   Ash» (no desaparecen NPCs ni se pierde el mapa en la fase 7). La misma palabra aparece
   en la regla **R3 «Ancla visible»** de las grietas (el objeto dibujado en la celda que
   sostiene la grieta) y como «ancla narrativa» del episodio (el NPC que sobrevive a
   todas las fases).

**Qué no es.** No es una medalla ni un sello: el ancla se **cierra** con un switch/sello,
pero el ancla es el lugar. En Dimensional Nightmare, «Ancla» (nivel de sintonía) tampoco
es «el Ancla» del hallazgo de la Gruta de los Testigos (2030): esa es la pieza narrativa
que reúne las grietas.

**Dónde aparece.** Atlas: 40 anclas, switches 708–747, variable 103 · DN: v265, v275,
regla R3, mapa 2030.

**Fuentes.** `docs/ESTADO_CONGELADO.md` · `docs/ATLAS_TIER3_REGLAS.md` ·
`docs/INFORME_ATLAS_MIL_Y_FLAGS.md` ·
`docs/DIMENSIONAL_NIGHTMARE/00_MASTER_GDD.md` ·
`docs/DIMENSIONAL_NIGHTMARE/14_MEDALLAS_LIGA_OSCURA_Y_SENSACIONES.md`.

---

## Emisión

**Definición.** Cada una de las **siete** historias del Monte Silver, contadas como
señales: mapas **2023–2029**, con la falda 2021, la cumbre 2022 (las siete puertas de
niebla y RED) y la Gruta de los Testigos (2030) como vestíbulo. El Archivero Prohibido
las custodia; el jugador entra en cada emisión y se la puede recorrer entera. El contador
**v264** sólo sube al **sellar** una emisión (victoria sobre su jefe), nunca al abrir su
baliza; **v264 ≥ 3** abre los episodios EP01–EP03 de Dimensional Nightmare y **v264 = 7**
los EP04–EP06 y el Nexo.

**Qué no es.** No es un «episodio» de Dimensional Nightmare: EP01–EP06 y el Nexo
(2041–2140) son mundos creepypasta aparte, con sus propios sellos y su propia medalla, y
las reglas del proyecto prohíben tocar v264 desde ellos. Dentro de la ficción, «emisión»
también se usa para una **señal de radio con memoria** (el santuario de la ancla 26,
Santuario de la Última Campana, recibe «una emisión que conoce recuerdos que nadie
contó»): ese es uso narrativo local, no el contador del Monte Silver.

**Dónde aparece.** Mapas 2021–2030 · contador v264 · sellos sw768–774.

**Fuentes.** `docs/MULTIVERSO_CREEPYPASTA.md` · `docs/MONTE_SILVER_REBUILD.md` ·
`content/multiverse_creepypasta.json` · `content/atlas_tier1_blueprints_approved.json`.

---

## Sello

**Definición.** Marca de progreso que **cierra** un contenido y abre el siguiente. Tiene
tres usos instalados, todos con switch propio:

1. **Sello Tier 1 (Atlas Mil).** Los switches **708–747** (`POKEMOD ATLAS SEAL NN`) que
   se encienden al resolver la decisión y ganar la prueba; incrementan la variable 103.
2. **Sello del Monte Silver.** Los switches **768–774** de las siete puertas Unown
   sellables (las siete zonas); la placa «siete emisiones callaron» se activa con el sello
   768. Con los siete cierres, v264 llega a 7.
3. **Sello de Dimensional Nightmare.** El cierre del jefe de cada mundo (EP01–EP06); el
   sellado enciende el **Pedestal del Sello** de su cámara, que entrega la medalla y la
   cartuchera, y deja una grieta en la Antesala (2040). Con las seis cartucheras se
   enciende **`DN_MEDALS_READY` (switch 917)**, la llave de la Liga Oscura.

**Qué no es.** No es una medalla: el sello es el cierre del mundo, la medalla es el objeto
que se recoge en el pedestal. «La Ruta de los Sellos» (Atlas, sectores 14–27, estilo Light
Platinum) usa la misma palabra para su progresión propia: **14 sellos, switches 953–966**,
y con los 14 se abre la **Liga de Atlas** del Santuario de Polen (sector 27), que **no** es
la Liga Oscura.

**Dónde aparece.** Atlas: 708–747 y 953–966 · Monte Silver: 768–774 · DN: `DN_MEDALS_READY`
(917) y pedestales por mundo.

**Fuentes.** `docs/ESTADO_CONGELADO.md` · `docs/ATLAS_MIL_TRES_AVENTURAS.md` ·
`docs/MONTE_SILVER_REBUILD.md` · `docs/DIMENSIONAL_NIGHTMARE/01_EP01_WHITE_HAND.md` ·
`docs/DIMENSIONAL_NIGHTMARE/14_MEDALLAS_LIGA_OSCURA_Y_SENSACIONES.md` ·
`tools/dn_name_flags.mjs`.

---

## Fragmento

**Definición.** Trozo desprendido del golpe de Arceus: todo lo que el DLC añade es una
astilla de la misma caída (canon de Arceus), y el término nombra cada astilla.

1. **Fragmento del Génesis.** La astilla que suelta Arceus al caer, en la cumbre de La
   Ruta de Dios (mapa 2037). Al recogerla se encienden **switch 882** (fragmento) y
   **883** (Rotom del Tiempo). Sin ella, las puertas que exigen el duelo siguen cerradas.
2. **Fragmento de dimensión.** Cada mundo construido a partir de una ROM invitada. El
   canon lo dice literal: «los Fragmentos de dimensión (Glazed, Light Platinum y Team
   Rocket) son astillas del mismo golpe». `content/dimensiones_barco.json` lo repite
   dimensión por dimensión: «cada ROM se conserva como un Fragmento independiente».
3. **Fragmentos de Dimensional Nightmare.** El **Fragmento de cartucho** (`DN_CARTRIDGE_01`,
   el primero del juego, tras el puzzle de cráneos) y los **siete Fragmentos de Unown**
   (`DN_UNOWN_FRAGMENT` ×7, uno por letra), que se archivan y forman la llave de la Cámara.

**Qué no es.** No es un objeto de inventario único ni una moneda: hay fragmentos de
naturaleza distinta y cada uno se guarda en su propio sistema (switch, evento u objeto).
Tampoco es sinónimo de «dimensión invitada»: la dimensión es el mundo, el fragmento es la
razón por la que existe.

**Dónde aparece.** Mapas 2037 (Génesis), 2051 (cartucho), 2123–2130 (Unown) · switches
882 y 883 · dimensiones de barco.

**Fuentes.** `docs/CANON_ARCEUS.md` · `content/dimensiones_barco.json` ·
`docs/DIMENSIONAL_NIGHTMARE/01_EP01_WHITE_HAND.md` ·
`docs/DIMENSIONAL_NIGHTMARE/06_EP06_KING_UNOWN.md`.

---

## Dimensión invitada

**Definición.** Mundo jugable original de Fire Ash construido a partir de una **ROM
invitada**: se entra después del duelo de Arceus (switch **873**), Ash llega como
**visitante** —no sustituye al protagonista de esa ROM ni a sus criaturas—, el mundo trae
su propio gimnasio, su líder y su medalla, y **la vuelta nunca está cerrada**.

Las dimensiones invitadas navegables por barco son **cinco**, todas desde Puerto Horizonte
(mapa 1001): Glazed (2200/2201, switch 960), Light Platinum (2210/2211, 961), Liquid
Crystal (2240/2241, 962), TFOH (2242/2243, 963) y Factory Adventure (2244/2245, 964). La
**dimensión Team Rocket** (2220–2221, «Base Subterránea» y «Núcleo del Mando») sigue el
mismo patrón con otra entrada: Ash se **infiltra** en lugar de visitar.

**Qué no es.** No es una «ROM invitada»: el ROM es el binario de referencia, que vive
fuera de Git y sólo alimenta el análisis forense local; la dimensión invitada es el
material reinterpretado con recursos de Fire Ash. Tampoco es una región de Fire Ash ni un
mapa del Atlas: los mapas del Atlas son 1021–2020 y 2191–2257, y las dimensiones invitadas
tienen ids propios.

**Dónde aparece.** Mapas 2200/2201, 2210/2211, 2220–2221, 2240–2245, 3000–3110,
3120–3138, 3700–3944 · switches 873, 960–964, 992, 993 · puerto 1001.

**Fuentes.** `tools/apply_dimensiones_barco.mjs` · `content/dimensiones_barco.json` ·
`docs/PLAN_FUSION_3_JUEGOS.md` · `docs/PROMPT_MAESTRO_Y_ESTADO.md` ·
`docs/ROM_INVITADO_EXTRACCION.md` · `docs/CANON_ARCEUS.md`.

---

## Liga Oscura

**Definición.** El mundo final de Dimensional Nightmare, donde se juntan todos los mundos
creepypasta. Son **dos mapas**: **2141** «Liga Oscura — Pórtico del Código» y **2142**
«Liga Oscura — Coliseo del Vínculo», construidos con el lenguaje visual del Nexo (tiles
glitch del archivo R1). Se abre con **`DN_MEDALS_READY` (switch 917)**, que se enciende
cuando el jugador tiene las **seis cartucheras** de los mundos EP01–EP06 (una medalla por
mundo: `DN_MEDAL_WHT`, `DN_MEDAL_LSV`, `DN_MEDAL_SNO`, `DN_MEDAL_HYP`, `DN_MEDAL_BLK`,
`DN_MEDAL_UNO`).

Contenido: la antesala `HUB_LIGA_OSCURA` en la Antesala de las Grietas (2040); el
encuentro con **Mad Pikachu** marcado «NIVEL 255 — FUERA DE RANGO» (rama `v278`: Pikachu =
razonar, Raichu = desafiar, ninguno = prueba de presencia); las cuatro **chispas del
vínculo** (`LIGA_CHISPA_1..4`, `v279 = 4`); la **intervención obligatoria de Arceus** que
nivela a Mad Pikachu a 150 y abre el combate real (`DN_MPIKA_150`); y el cierre, donde el
Pikachu **no se debilita: se lo salva**. Recompensa: `DN_MEDAL_MPK` + `DN_CASE_MPK`
(«Badges of Mad Pikachu») y el NPC permanente `HUB_MADPIKA`. Perder no deja derrota
permanente: se vuelve al Pórtico y se reintenta. El **switch 948** (`POKEMOD LIGA OSCURA
COMPLETA`) es el que marca la Liga terminada y habilita el diploma.

**Qué no es.** No es la **Liga de Atlas** (Santuario de Polen, sector 27, 14 sellos):
esa es la liga de la Ruta de los Sellos. Tampoco es una creepypasta más: es el mapa donde
las creepypastas se juntan, con el código del Nexo como estética. Y no confundir con el
«eco del Génesis» del **Coliseo del Vínculo** (mapa **2142**), que aparece en el canon de
Arceus capturado: mismo mapa, otra escena.

**Dónde aparece.** Mapas 2141–2142 · switches 917 y 948 · variables v278, v279 · entrada
desde 2040.

**Fuentes.** `docs/DIMENSIONAL_NIGHTMARE/14_MEDALLAS_LIGA_OSCURA_Y_SENSACIONES.md` ·
`docs/DIMENSIONAL_NIGHTMARE/15_EXPERIENCIA_POR_MAPA.md` · `docs/ESTADO_CONGELADO.md` ·
`docs/AUDITORIA_TOTAL_FLAGS.md` · `tools/apply_diplomas_planta.mjs`.

---

## Divergencias conocidas

Registradas al congelar. No se resuelven aquí: se dejan escritas para que ninguna fase
posterior «descubra» la contradicción y decida por su cuenta.

- **D1 · Cuántas dimensiones invitadas son «las» dimensiones invitadas.** El pilar P4 del
  prompt maestro habla de **dos** (Glazed y Light Platinum) y de la **dimensión Team
  Rocket** como pieza aparte; `content/dimensiones_barco.json` y el instalador declaran
  **cinco** navegables por barco. Lectura congelada: «dimensión invitada» admite las dos
  formas y, cuando importe el conteo, manda el archivo de contenido (hoy cinco más la de
  Team Rocket), no el prompt.
- **D2 · La llave de la Liga Oscura.** `docs/PROMPT_MAESTRO_Y_ESTADO.md` dice que purgar
  las siete emisiones abre la Liga Oscura; el documento de Dimensional Nightmare dice que
  la abre el Archivero con las **seis cartucheras** (`DN_MEDALS_READY`, switch 917). El
  contenido instalado es el segundo: el contador de emisiones (v264) sólo se consulta para
  los gates antiguos (≥3 y =7), y ninguna emisión escribe en 917. Lectura congelada: la
  Liga Oscura se abre con las seis cartucheras; las emisiones son el prerrequisito de los
  mundos, no su llave.
- **D3 · «Vía» con dos grafías de familia.** La jerarquía del Atlas llama **rutas** a los
  Tier 2 y **Vía** sólo existe como nombre propio (Vía de las Nueve Eras). Cualquier
  texto que use «vía» en minúscula para un Tier 2 es un error de nomenclatura, no un
  cuarto nivel de la jerarquía.

---

## Protocolo de congelación

1. **Comprobar:** `npm run verify:glosario` (corre también dentro de `npm test`). Verifica
   el hash del sello, que los siete términos y sólo ellos estén como encabezado, que cada
   fuente declarada exista y que cada cita literal que sostiene el sello siga en su
   archivo.
2. **Tocar el glosario:** editar normalmente, después `node tools/qa/glosario_check.mjs
   --recongelar`. Eso sube la revisión (R1 → R2), actualiza el hash y la fecha, e imprime
   qué cambió. El nuevo sello se commitea **en el mismo commit** que la edición.
3. **Término nuevo:** añadirlo al archivo **y** a `terminos` del sello. Sin las dos cosas,
   la comprobación falla a propósito: el diccionario no crece por accidente.
4. **Cambio de significado de un identificador** (por ejemplo, mover la Liga Oscura de
   mapa o renumerar un switch): actualizar la sección, la cita del sello y el documento
   fuente que lo declaraba; si el número viejo aparece en un documento histórico, dejarlo
   y anotarlo en «Divergencias conocidas».

## Cómo se comprueba

```bash
npm run verify:glosario                                  # sello + términos + fuentes + citas
node tools/qa/glosario_check.mjs --json                  # lo mismo, legible por máquina
node tools/qa/glosario_check.mjs --recongelar            # sella la revisión actual
```

Sello: `content/qa_glosario_congelado.json` (revisión, fecha, hash SHA-256 y citas).
