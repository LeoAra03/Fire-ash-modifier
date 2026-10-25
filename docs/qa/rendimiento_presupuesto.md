# Presupuesto de rendimiento por mapa

Generado por `tools/qa/rendimiento_presupuesto.mjs`; exigido en CI por
`npm run verify:rendimiento:presupuesto`.

## Definiciones

- **Evento**: cada entrada de `@events` del mapa compilado.
- **Evento automático**: evento con alguna página *autorun* (trigger 3) o *paralela*
  (trigger 4). Son las dos únicas que el motor ejecuta sin que el jugador las toque
  (0 acción, 1 toque del jugador, 2 toque del evento, 3 autorun, 4 paralelo).
- **Huella del mod**: eventos cuyo nombre empieza por «PokeMod». El presupuesto se aplica a
  los 1887 mapas con huella, no a los del juego base que el mod no reescribe.

## Techos y estado

| Techo | Valor | Mapas por encima |
|---|---:|---:|
| Eventos por mapa | 60 | 8 |
| Eventos automáticos por mapa | 12 | 0 |
| Archivo versionado | 20 MiB | 2 |

Las **páginas** automáticas también se miden (2272 en 2129 eventos de todo el
juego, referencia de 40 por mapa) pero no se ponen como techo: un evento ejecuta una sola
página a la vez, así que un evento con 33 páginas paralelas cuesta **un** proceso, no 33.

Ningún exceso puede existir sin una excepción declarada: eso es lo que comprueba la puerta.
Un exceso declarado no es un aprobado: queda con dueño y con su nombre en esta tabla.

## Excesos declarados

| Mapa | Nombre | Familia | Eventos | Del mod | Eventos automáticos | Páginas autorun/paralelo | Estado |
|---|---|---:|---:|---:|---:|---|---|
| 43 | Viridian City | base | 66 | 1 | 9 | 9/0 | heredado |
| 108 | Vermilion City | base | 145 | 2 | 12 | 12/0 | heredado |
| 1001 | Puerto Horizonte | horizontes | 100 | 53 | 0 | 0/0 | en_revision |
| 3060 | Glazed · Mt. Stratus (Cumbre Helada) | glazed | 105 | 105 | 0 | 0/0 | en_revision |
| 4059 | Pokémon Unbound · Capítulo 05 · bosque 060 | unbound | 61 | 61 | 0 | 0/0 | en_revision |
| 4150 | Pokémon Unbound · Capítulo 13 · poblado 151 | unbound | 61 | 61 | 0 | 0/0 | en_revision |
| 4234 | Pokémon Unbound · Capítulo 20 · costa 235 | unbound | 61 | 61 | 0 | 0/0 | en_revision |
| 4334 | Pokémon Unbound · Capítulo 28 · poblado 335 | unbound | 61 | 61 | 0 | 0/0 | en_revision |

## Por qué cada exceso pasa del techo

- **43 · Viridian City** (heredado): mapa del juego base con 66 eventos de los que sólo 1 son del mod: la densidad viene de la campaña original; 9 eventos con página automática (9 autorun, 0 paralelas en 9 páginas).
- **108 · Vermilion City** (heredado): mapa del juego base con 145 eventos de los que sólo 2 son del mod: la densidad viene de la campaña original; 12 eventos con página automática (12 autorun, 0 paralelas en 12 páginas).
- **1001 · Puerto Horizonte** (en_revision): mapa horizontes con 100 eventos (53 del mod); ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos.
- **3060 · Glazed · Mt. Stratus (Cumbre Helada)** (en_revision): mapa glazed con 105 eventos (105 del mod); ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos.
- **4059 · Pokémon Unbound · Capítulo 05 · bosque 060** (en_revision): mapa unbound con 61 eventos (61 del mod); ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos.
- **4150 · Pokémon Unbound · Capítulo 13 · poblado 151** (en_revision): mapa unbound con 61 eventos (61 del mod); ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos.
- **4234 · Pokémon Unbound · Capítulo 20 · costa 235** (en_revision): mapa unbound con 61 eventos (61 del mod); ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos.
- **4334 · Pokémon Unbound · Capítulo 28 · poblado 335** (en_revision): mapa unbound con 61 eventos (61 del mod); ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos.

Decisión de esta fase: **no se recorta ningún mapa sin una partida**. Borrar páginas paralelas de un
mapa compilado puede dejar una escena automática a medias (una puerta que ya no se abre, un cartel que
ya no aparece) y el plan prohíbe cerrar algo así sin verlo. Los 6 excesos propios
del mod quedan como deuda con dueño, medidos y visibles; los heredados del juego base no se tocan.

## Densidad por familia

| Familia | Mapas | Con huella | Eventos | Máx. eventos | Máx. eventos automáticos |
|---|---:|---:|---:|---:|---:|
| base | 1021 | 29 | 15123 | 165 | 21 |
| horizontes | 20 | 1 | 594 | 100 | 0 |
| atlas | 1000 | 583 | 6410 | 46 | 6 |
| nightmare | 155 | 5 | 1377 | 23 | 3 |
| dlc_base | 42 | 42 | 231 | 21 | 1 |
| glazed | 111 | 111 | 1277 | 105 | 0 |
| light_platinum | 19 | 19 | 175 | 19 | 0 |
| liquid_crystal | 432 | 432 | 4253 | 47 | 0 |
| tfoh | 245 | 245 | 2321 | 26 | 0 |
| unbound | 420 | 420 | 4388 | 61 | 0 |

## Peso del juego

| Carpeta | Archivos | MiB |
|---|---:|---:|
| Data | 3529 | 104.82 |
| Graphics | 16964 | 83.49 |
| Audio | 4652 | 450.07 |

## Audio

4652 archivos · 0 de cero bytes · 332 grupos duplicados exactos (831 archivos) ·
17 grupos con algún nombre referenciado y 315 sin referencia.

Un duplicado **referenciado** no se borra: dos nombres iguales de contenido pueden estar
pedidos por mapas distintos y borrar uno rompe la referencia. Sólo los grupos sin ninguna
referencia serían eliminables (11.81 MiB), y
tampoco se borran en esta fase: el motor puede cargar pistas por nombre construido, así que el
recorte exige una sesión que escuche el juego. Queda medido, con dueño y sin ejecutar.

### Referencias sin archivo

- `BGM/002-Battle02` — pedido por un mapa o evento y sin archivo homónimo
- `BGM/Team Rocket OW` — pedido por un mapa o evento y sin archivo homónimo
- `BGM/secrettitan` — pedido por un mapa o evento y sin archivo homónimo
- `SE/Thunder8` — pedido por un mapa o evento y sin archivo homónimo

Son 4 nombres que el juego pide y no existen: quedan sonando en silencio. Vienen de mapas
del juego base (no del mod) y arreglarlos exige o bien autorar el audio o bien editar el mapa compilado;
ninguna de las dos cosas se hace sin una partida, así que se declaran aquí en vez de taparse.

| Grupo (duplicados exactos) | Tamaño | Referenciados |
|---|---:|---:|
| ME/Battle victory wild.ogg = ME/Battle victory.ogg | 623 KiB | 0/2 |
| SE/Anim/PRSFX- Catastropika6.wav = SE/Anim/PRSFX- Dream Eater1.wav = SE/Anim/PRSFX- Fly2.wav = SE/Anim/PRSFX- High Horse Power1.wav = SE/Anim/PRSFX- Psystrike1.wav = SE/Anim/PRSFX- SinisterArrowRaid4.wav = SE/Anim/PRSFX- Trop Kick1.wav | 45 KiB | 0/7 |
| SE/Anim/PRSFX- Catastropika4.wav = SE/Anim/PRSFX- Electric Terrain2.wav = SE/Anim/PRSFX- Fell Stinger3.wav = SE/Anim/PRSFX- Freeze Shock3.wav = SE/Anim/PRSFX- Gigavolt Havoc3.wav = SE/Anim/PRSFX- Techno Blast 2.wav = SE/Anim/PRSFX- Thunderbolt2.wav = SE/Anim/PRSFX- Thundershock.wav | 37 KiB | 0/8 |
| SE/Anim/PRSFX- Double Slap.wav = SE/Anim/PRSFX- Fake Out1.wav = SE/Anim/PRSFX- Pay Day1.wav = SE/Anim/PRSFX- Power Trip5.wav = SE/Anim/PRSFX- Smellingsalts.wav = SE/Anim/PRSFX- Wake Up Slap.wav | 45 KiB | 0/6 |
| SE/Anim/PRSFX- Bloom Doom2.wav = SE/Anim/PRSFX- Energy Ball2.wav = SE/Anim/PRSFX- Thousand Waves1.wav = SE/Anim/PRSFX- Twinkle Tackle2.wav = SE/Anim/PRSFX- Weather Ball2.wav | 53 KiB | 0/5 |
| SE/Anim/PRSFX- Guard Split.wav = SE/Anim/PRSFX- Guard Swap.wav = SE/Anim/PRSFX- Heart Swap.wav = SE/Anim/PRSFX- Power Split.wav = SE/Anim/PRSFX- Power Swap.wav = SE/Anim/PRSFX- Power Trick.wav = SE/Anim/PRSFX- Skill Swap.wav = SE/Anim/PRSFX- Speed Swap.wav | 31 KiB | 0/8 |
| SE/Anim/PRSFX- Origin Pulse.wav = SE/Anim/PRSFX- Origin Pulse1.wav | 119 KiB | 0/2 |
| SE/Anim/PRSFX- LTBTS1.wav = SE/Anim/PRSFX- Roar of Time.wav | 110 KiB | 0/2 |
| SE/Anim/PRSFX- Oceanic Operetta3.wav = SE/Anim/PRSFX- Rainbow Field.wav = SE/Anim/PRSFX- Stored Power2.wav = SE/Anim/PRSFX- Twinkle Tackle3.wav = SE/Anim/PRSFX- ZPower2.wav | 44 KiB | 0/5 |
| SE/Anim/PRSFX- Catastropika3.wav = SE/Anim/PRSFX- Plasma Fist1.wav = SE/Anim/PRSFX- Thunder Punch1.wav = SE/Anim/PRSFX- Thunder.wav = SE/Anim/PRSFX- Thunderbolt1.wav | 42 KiB | 0/5 |

## Repositorio

Archivos versionados por encima del techo de 20 MiB (el total del repositorio cambia con cada
commit y se publica en `rendimiento.md`, no aquí):

- `Scripts_corregido/Fire_Ash_Paquete_Directo.zip` — 60.78 MiB
- `Fire-Ash-Scripts-Corregidos.zip` — 46.59 MiB

Los ZIP son entregables declarados en `content/artifact_budget.json` y los reconstruyen sus
scripts; el corpus de QA de Arceus Omega pasa a versionarse comprimido
(`content/arceus_omega_qa_matrix.jsonl.gz`, 3,88 MiB en vez de 62,46 MiB), así que el techo de
20 MiB queda sólo para los dos ZIP de entrega.

## Resultado

- Excesos sin declarar: 0.
- Deudas del carril de rendimiento: 6 (mapas con exceso propio, con dueño asignado).
- Runtime (FPS, memoria, arranque, cargas por región): **pendiente de hardware**, ver
  [`rendimiento.md`](rendimiento.md).
