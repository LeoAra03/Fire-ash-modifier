# Informe: Mochila libre en la torre del Grandeur Club y laboratorio de Oak

Fecha: 28 de septiembre de 2026
Estado: instalado en los datos compilados de Pokémon Fire Ash 3.7.1

## 1. La petición

Jugar la torre que se habilita en el laboratorio de Oak después del evento de Mew (postgame: Pokédex habilitados, torre accesible en el laboratorio) con la Mochila utilizable en batallas, para poder jugarla libremente.

## 2. Qué es la torre y por qué la Mochila fallaba

El sótano del laboratorio de Oak (mapa 48) habilita con el switch `429 = Postgame` dos transportadores cuánticos originales: los Pokédex holders (evento 15) y la torre del Grandeur Club (evento 16). La torre cubre:

| Mapa | Nombre |
|---:|---|
| 141 | SECRET PEAK |
| 151 | GRANDEUR LOUNGE |
| 214 | STAGE |

Ocho eventos de contacto de la torre encienden el switch `674 = NO ITEM INBATT` (siete de ellos también `675 = NO ITEM OUTBATT`). Los parches anteriores solo habían quitado el switch 674 de `PokeBattle_Battle#pbItemMenu` (Battle_Phase_Command): la Mochila se abría dentro del combate, pero `pbCanUseItemOnPokemon?` (Battle_Action_UseItem) seguía consultando el switch 674 y rechazaba cada objeto con «You can't use items here!».

## 3. Parche aplicado

`tools/apply_grandeur_bag_freedom.mjs` retira la comprobación del switch 674 de `pbCanUseItemOnPokemon?`:

- el jugador usa objetos en cualquier combate interno aunque el evento encienda el switch 674;
- se conservan íntegras las demás reglas del método (Embargo, límite de objetos por combate `itemsRemaining`);
- se conserva `!@internalBattle`, que protege los sistemas externos (Bug Contest, Safari, Battle Records, Challenge Battles);
- el switch 675 (Mochila fuera de combate en el Escenario) **no se toca**: forma parte del reto de acceso del Escenario y no de la batalla;
- ninguna sección de `Scripts.rxdata` vuelve a consultar el switch 674 (verificación explícita);
- las 8 activaciones originales del switch 674 en la torre se conservan intactas y ahora son inofensivas dentro del combate.

Idempotente, con `--verify` y backup:

```text
pokemon_fire_ash/PokeModBackups/grandeur_bag_originals/
```

```bash
node tools/apply_grandeur_bag_freedom.mjs
node tools/apply_grandeur_bag_freedom.mjs --verify
```

Resultado:

```text
Verificación OK: la Mochila funciona dentro de la torre del laboratorio de Oak
(transportador evento 16, mapas 141/151/214); 8 activaciones del switch 674
conservadas pero inofensivas; 0 secciones de script consultan el switch 674.
```

## 4. La cápsula del hub, retirada (cierre de continuidad)

El sótano del laboratorio tuvo un tercer transportador instalado por
`tools/apply_oak_lab_postgame_hub.mjs`: una cápsula central con menú de destinos
(Isla Espejo, Bosque Susurrante, Puerto Horizonte, Atlas Mil) y un ayudante que
lo explicaba.

**Ese transportador se retiró.** La dirección de diseño cambió: el viaje
multiversal no se elige en un menú de laboratorio, se descubre andando. La
herramienta sigue existiendo, pero ahora solo **retira los restos** de la cápsula
en instalaciones antiguas y verifica el estado correcto del laboratorio:

| Estado actual del mapa 48 | |
|---|---|
| Transportadores | Solo los dos originales (eventos 15 y 16: holders y torre) |
| Oak | `PokeMod Oak: Registro de Grietas`: lee `\v[264]`, aconseja y no teletransporta |
| Menús de destinos | Ninguno |
| Eventos | 26 originales + el Oak consejero |

El relevo lo toma la **Expansión Multiversal** (`tools/apply_expansion_multiversal.mjs`):
siete grietas purgables en Kanto y Johto, punto de colapso en la Torre Pokémon,
Liga Oscura en la cumbre del Monte Silver, capitán de Ciudad Carmín hacia Atlas
Mil y espejo del sótano de la Mansión Pokémon hacia Isla Espejo. Todo con retorno
libre y sin crear ni un switch ni una variable nueva. Detalle en
[`EXPANSION_MULTIVERSAL.md`](EXPANSION_MULTIVERSAL.md).

```bash
node tools/apply_oak_lab_postgame_hub.mjs          # retira los restos de la cápsula
node tools/apply_oak_lab_postgame_hub.mjs --verify # verifica el laboratorio
```

Resultado:

```text
Verificación OK: el laboratorio de Oak (mapa 48) conserva sus 26 eventos
originales, sus dos transportadores de siempre, ningún menú de destinos y Oak
como consejero.
```

## 5. Backups

```text
pokemon_fire_ash/PokeModBackups/grandeur_bag_originals/Scripts.rxdata
pokemon_fire_ash/PokeModBackups/oak_lab_hub_originals/Map048.rxdata
```

Restaurar cada archivo sobre `Data/` revierte su cambio sin afectar al otro.

## 6. Pruebas ejecutadas

```text
node tools/apply_grandeur_bag_freedom.mjs --verify    OK
node tools/apply_oak_lab_postgame_hub.mjs --verify    OK (cápsula retirada)
node tools/apply_expansion_multiversal.mjs --verify   OK
node tools/apply_isla_espejo_expansion.mjs --verify   OK
npm test (51 + 114 + 57)                              OK
```

## 7. Límite de certificación

No se pudo ejecutar `Game.exe` en este entorno (sin Wine). La prueba manual recomendada es: postgame (switch 429 activo) → laboratorio de Oak → sótano → torre del Grandeur Club → abrir la Mochila y usar un objeto en cada etapa (141/151/214) → volver → probar el tercer transportador hacia Isla Espejo y Puerto Horizonte.
