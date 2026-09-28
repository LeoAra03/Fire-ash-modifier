# Informe: Mochila libre en la torre del Grandeur Club y hub postgame del laboratorio de Oak

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

## 4. Hub postgame en el laboratorio de Oak (cierre de continuidad)

Para que la expansión se sienta parte del juego base, `tools/apply_oak_lab_postgame_hub.mjs` instala un tercer transportador en el mismo sótano, con la misma condición (switch 429) y las mismas piezas gráficas de las cápsulas originales (tiles 1827/1828/1829/1839):

| Elemento | Función |
|---|---|
| Cápsula central (evento 302) | Menú de destinos: Isla Espejo, Bosque Susurrante, Puerto Horizonte, Atlas Mil |
| Cápsulas laterales (301/303/304) | Piezas visuales, idénticas al par original |
| Ayudante de Oak (evento 305) | Explica el dispositivo y la Mochila libre |

Las señales se calibran con la progresión real de cada bloque: Isla Espejo siempre está disponible; Bosque Susurrante requiere la misión del guardabosques (`701`); Puerto Horizonte requiere `704`; Atlas Mil requiere `706`. Si falta calibración, la cápsula explica qué paso falta y no teletransporta. Las llegadas son celdas transitables verificadas y todos los accesos originales (Pueblo Paleta, Ciudad Verde) permanecen intactos. No se toca ningún evento original del laboratorio.

```bash
node tools/apply_oak_lab_postgame_hub.mjs
node tools/apply_oak_lab_postgame_hub.mjs --verify
```

Resultado:

```text
Verificación OK: tercer transportador en el laboratorio de Oak (mapa 48) con
4 destinos condicionados por el switch 429, 26 eventos originales intactos y
llegadas transitables.
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
node tools/apply_oak_lab_postgame_hub.mjs --verify    OK
node tools/apply_isla_espejo_expansion.mjs --verify   OK
npm test (51 + 114 + 57)                              OK
```

## 7. Límite de certificación

No se pudo ejecutar `Game.exe` en este entorno (sin Wine). La prueba manual recomendada es: postgame (switch 429 activo) → laboratorio de Oak → sótano → torre del Grandeur Club → abrir la Mochila y usar un objeto en cada etapa (141/151/214) → volver → probar el tercer transportador hacia Isla Espejo y Puerto Horizonte.
