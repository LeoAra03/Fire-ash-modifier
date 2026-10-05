# Expansión Multiversal — grietas, Liga Oscura, Atlas Mil e Isla Espejo

Arco posterior a **La Ruta de Dios**. Todo ocurre con `429 = Postgame` encendido y
con la Ruta de Dios ya superada. La regla de diseño que ordena el arco es una
sola: **nada se viaja desde un menú, todo se descubre andando por Kanto y
Johto**. El laboratorio de Oak no gana una cápsula nueva: pierde la que se le
había añadido.

```
npm run expansion            # instala el arco completo (idempotente)
npm run verify:expansion     # verifica la instalación
npm run create:expansion     # regenera el plano content/expansion_multiversal.json
npm run verify:expansion:plan   # el plano coincide con el generador
```

## Cómo instalarlo para jugar

El paquete `Scripts_corregido/Fire_Ash_Expansion_Multiversal.zip` (o la carpeta
`Scripts_corregido/Expansion_Multiversal/`) se extrae **en la raíz de una copia
de Fire Ash 3.7.1**, junto a `Game.exe`, aceptando reemplazar. Trae los 27 mapas
del arco, `trainers.dat`, `species.dat`, los sprites y gritos de los Pokégods y
el laboratorio de Oak sin la cápsula nueva.

Orden recomendado: primero `Fire_Ash_Paquete_Directo.zip` (base + La Ruta de
Dios), después `Dimensional_Nightmare_QA.zip` y por último la Expansión
Multiversal. Requisito de juego: postgame activo (termina el evento de Mew).

```bash
npm run build:expansion:package   # regenera carpeta y ZIP
npm run verify:expansion:package  # comprueba que el paquete es idéntico al juego
```

---

## Bloque 1 — Las Grietas del Terror y la Liga Oscura

Siete grietas se abren en lugares que el jugador ya conoce. Cada una avisa
(energía extraña, sonido imposible) y pregunta **Entrar / Retirarse**. Si entra,
aterriza en una de las siete emisiones prohibidas del Monte Silver; si derriba al
jefe de esa emisión, **la línea temporal queda purgada** (sello `868+n`, y el
contador `\v[264]` suma uno) y la grieta se convierte en una cicatriz inofensiva.
Nunca hay encierro: cada emisión tiene su salida al mundo y conserva la salida
original a la gruta.

| # | Grieta | Dónde | Emisión | Jefe | Sello |
|---|---|---|---|---|---|
| 1 | La Torre que Escuchaba | Torre Pokémon 7F (149) | 2023 | LA LOCUTORA | 868 |
| 2 | La Partida Perdida | Islas Espuma (979) | 2024 | PLATA PERDIDA | 869 |
| 3 | La Fosa del Enterrado | Monte Moon B1F (90) | 2025 | EL ENTERRADO | 870 |
| 4 | La Cinta Carmesí | Torre Quemada (303) | 2026 | EL NIÑO DE LA CINTA | 871 |
| 5 | Ciudad Glitch | Planta de Energía (412) | 2027 | EL FALLO CERO | 872 |
| 6 | El Eco que Jugó Contigo | Ruinas Alfa (295) | 2028 | EL ECO AHOGADO | 873 |
| 7 | La Consola de 1996 | Mansión Pokémon 2F (190) | 2029 | EL JUGADOR DE 1996 | 874 |

**Punto de colapso.** Con las siete purgas (`\v[264] >= 7`) la inestabilidad se
derriba en un único sitio: la **Torre Pokémon 1F (143)**, la torre que abrió la
primera grieta. Esa grieta lleva a la falda del Monte Silver (2021), de donde se
sube por la cueva (2030) hasta la cumbre (2022).

**Liga Oscura.** En la cumbre, el antiguo menú de las siete puertas se sustituye
por el **umbral**: exige `\v[264] >= 8` (las siete purgas más el Campeón
Silencioso, sello 875) y abre dos mapas nuevos:

| Mapa | Nombre | Contenido |
|---|---|---|
| 2192 | Liga Oscura — Umbral | Archivero Prohibido, guardiana que cura, salida al mundo y puerta a la arena |
| 2193 | Liga Oscura — Arena Final | Los cinco combates finales, salida al umbral y salida al mundo |

| Combate | Tipo | Equipo (Nv) | Recompensa |
|---|---|---|---|
| EL CANTO | PSYCHIC_F | Chandelure 110 · Mismagius 112 · Gengar 114 · Drifblim 110 · Banette 110 · Froslass 112 | CHOICESPECS |
| LA ESTÁTICA | SCIENTIST | Porygon2 112 · Porygon-Z 116 · Muk 112 · Electrode 112 · Ditto 113 · Unown 110 | ASSAULTVEST |
| EL SIN ROSTRO | HIKER | Marowak 114 · Golurk 116 · Cofagrigus 114 · Dusknoir 115 · Sableye 113 · Spiritomb 116 | ROCKYHELMET |
| EL ECO | SWIMMER_M | Jellicent 115 · Froslass 114 · Gengar 117 · Mismagius 114 · Spiritomb 118 · Dusknoir 115 | FOCUSSASH |
| LA CONVERGENCIA | CHAMPION | Porygon-Z 120 · Chandelure 120 · Golurk 122 · Dusknoir 122 · Gengar 124 · Spiritomb 125 | MASTERBALL |

Los cinco combates usan `pbTrainerBattle(..., canLose = true)`: perder es
posible y no castiga. La victoria se registra con el self-switch **A**, así que
el encuentro queda cerrado y solo se repite si el jugador pide la **revancha por
menú**. Los mapas de la Liga conservan siempre dos salidas: al umbral y al mundo.

---

## Bloque 2 — Expedición Atlas Mil

Completamente aparte de las grietas: no depende de purgar nada.

1. **Puerto de Ciudad Carmín (108).** El **Capitán Ferrán** (`trchar016`) ofrece
   navegar a aguas sin cartografiar. Si el Cronista de Puerto Horizonte ya abrió
   el Atlas (switch `706`), zarpa; si no, dice qué le falta en lugar de
   teletransportar a ciegas.
2. **Muelle de Atlas Mil (2191)**, nuevo: barco de vuelta a Ciudad Carmín, sendero
   del dique hasta Puerto Horizonte (1001) y un cartel con el nombre del amarre.

El jugador explora Atlas Mil con libertad y vuelve cuando quiere hablando con el
capitán del muelle.

---

## Bloque 3 — Isla Espejo y los Pokégods

Se entra por un **sótano recién abierto en la Mansión Pokémon (B1F, 192)**: una
escotilla que no figuraba en los planos baja al **Sótano Sellado (2194)**, donde
hay un espejo grande como una pared. Al mirarlo, el reflejo no devuelve a Ash:
devuelve **Isla Espejo**. El espejo pregunta si se cruza el umbral.

- **Ida:** Mansión Pokémon B1F (192) → Sótano Sellado (2194) → Isla Espejo (997).
- **Vuelta:** el espejo del atrio de la isla devuelve al sótano, y las escaleras
  del sótano suben a la mansión. El ferry original de Pueblo Paleta sigue ahí.

La isla es un ecosistema fragmentado donde los rumores y los datos corruptos se
hicieron físicos. La habitan los **Pokégods**: doce anomalías de la era del patio
de recreo (Pikablu, Mewthree, Flareth, Lunareon, Solareon, Nidogod, Spooky,
Doomsday, Tricket, Shadybug, Anthrax y Dimonix). No tienen niveles normales:
cada encuentro ofrece tres **Formas de Anomalía** —Alfa (Nv85, capturable),
Beta (Nv100, clima hostil, sin huir) y Omega (Nv115, reglas rotas)— que cambian
la dificultad, el clima y las inmunidades.

El arte de Pikablu ([`tools/build_pikablu_sprite.mjs`](../tools/build_pikablu_sprite.mjs))
está **adaptado del Pikachu del juego** (matiz amarillo/marrón → azul cielo,
cheeks intactos) en lugar de dejar un hueco; en cuanto exista arte conceptual en
`reference/pokegods/concept/PIKABLU.png`, el convertidor oficial toma el relevo.

---

## Bloque 4 — Laboratorio del Profesor Oak

El laboratorio **vuelve a ser el de siempre**:

- se retiran los cinco eventos de la cápsula central nueva (`PokeMod Hub:`);
- se conservan los dos transportadores originales (eventos 15 y 16);
- **Oak** (`PokeMod Oak: Registro de Grietas`) solo investiga: lee el contador de
  purgas `\v[264]`, explica qué falta y señala hacia el mundo (el capitán de
  Ciudad Carmín, el sótano de Isla Canela y las grietas). **No teletransporta a
  nadie** ni ofrece menú de destinos.

---

## Garantías del arco

| Garantía | Cómo se cumple |
|---|---|
| Sin menús de viaje | Ningún evento nuevo reparte más de un destino; no hay cápsula central |
| Siempre se puede volver | Toda grieta, emisión, muelle, sótano, isla y arena tiene salida explícita |
| Enemigo derrotado, derrotado | Sellos `868-875` en las grietas; self-switch A en la Liga Oscura |
| Combates perdonavidas | `canLose` en los cinco combates de la Liga Oscura y en los Pokégods |
| Revancha opcional | Menú del jefe, nunca forzado |
| Cero switches y cero variables nuevos | No quedaban IDs libres: todo vive en `\v[264]` y los sellos `868-875` |
| Cero assets ausentes | Sprites, fondos, tipos de entrenador, objetos y especies verificados antes de grabar |

## Cómo revertirlo

```bash
# restaurar los .rxdata previos a la expansión
cp pokemon_fire_ash/PokeModBackups/expansion_multiversal/*.rxdata pokemon_fire_ash/Data/
rm pokemon_fire_ash/Data/Map2191.rxdata pokemon_fire_ash/Data/Map2192.rxdata \
   pokemon_fire_ash/Data/Map2193.rxdata pokemon_fire_ash/Data/Map2194.rxdata
node tools/apply_expansion_multiversal.mjs --verify   # fallará: ya no está instalado
```

Los backups son solo de datos del juego: **no contienen partidas guardadas**.
