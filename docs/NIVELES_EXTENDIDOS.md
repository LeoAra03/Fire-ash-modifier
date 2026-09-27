# Crecimiento extendido de nivel

## Estado

El límite global de Pokémon Fire Ash se amplió de **100 a 150**.

La modificación se aplica en `Settings::MAXIMUM_LEVEL`, por lo que los sistemas de Pokémon Essentials que consultan `GameData::GrowthRate.max_level` reconocen el nuevo límite: experiencia, Caramelos Raros, edición, guardería, encuentros modificados, resumen y validadores.

## Compatibilidad de partidas

- Un Pokémon que ya estaba en nivel 100 conserva su experiencia y estadísticas correspondientes a nivel 100.
- Como su experiencia deja de ser la máxima global, puede volver a ganar experiencia normalmente.
- No se cambia ninguna especie, movimiento, IV, EV, habilidad ni objeto de partidas existentes.
- Los formatos competitivos que fijan expresamente nivel 50 o 100 mantienen esa regla local.
- Pickup conserva su tabla de recompensas de nivel 100 para evitar leer índices inexistentes.

## Curvas de experiencia

Se comprobaron los seis grupos entre los niveles 101 y 150:

```text
Medium
Erratic
Fluctuating
Parabolic
Fast
Slow
```

Todas las curvas producen experiencia entera, positiva y estrictamente creciente. La fórmula Fluctuating se normalizó con `floor` para impedir experiencia fraccionaria por encima de 100.

## Escalado narrativo

- Episodios 1–25: niveles 89–98, concebidos como entrada y desarrollo del postgame.
- Episodios 26–30: niveles 100–112, primera fase de crecimiento extendido.
- Episodios 31–35: deberán crecer aproximadamente hasta 125.
- Episodios 36–39: deberán crecer aproximadamente hasta 140.
- Episodio 40: podrá alcanzar 150, siempre con curación, Mochila, contrajuego y derrota segura.

No se utiliza el nivel ampliado para fabricar combates imposibles. La dificultad debe venir de equipos narrativos, cobertura anunciada y decisiones tácticas legibles.

## Reversión

Backup anterior a la instalación:

```text
pokemon_fire_ash/PokeModBackups/extended_level_cap_originals/Scripts.rxdata
```

Instalador y verificador:

```text
node tools/apply_extended_level_cap.mjs
node tools/apply_extended_level_cap.mjs --verify
```
