# Revisión de tipos de entrenador · entradas de campañas ROM (fase 70)

Verificador: `node tools/verify_trainer_types_campanas.mjs` (`--json` para el detalle).
Lee `pokemon_fire_ash/Data/trainers.dat` y `trainer_types.dat`, y el plano
`content/rom_campaigns_complete.json`. No modifica datos.

## Resultado

**Todos los tipos usados son válidos.** Ninguna entrada de entrenador referencia un
tipo que no esté definido en `trainer_types.dat`:

- 590 tipos definidos; 5 545 claves compuestas `[tipo, nombre, versión]`.
- 0 tipos inválidos, 0 tipos inconsistentes entre clave y `@trainer_type`.
- Los 5 tipos de campaña existen con su `id_number`:

| Campaña | Tipo | id_number |
|---|---|---:|
| Glazed | `GLAZED_ARCHIVE` | 622 |
| Light Platinum | `PLATINUM_ARCHIVE` | 623 |
| Liquid Crystal | `CRYSTAL_ARCHIVE` | 624 |
| TFOH Beta 3 | `TFOH_ARCHIVE` | 625 |
| Pokémon Unbound | `UNBOUND_ARCHIVE` | 627 |

## Hallazgo: los nombres instalados no coinciden con el plano

Aunque los tipos son válidos, **las entradas instaladas no corresponden al plano
actual**. Se compara por campaña el conjunto de nombres esperados
(`<CAMPAÑA>_<secuencia>_<n>` por cada combate de NPC, más `<CAMPAÑA>_FINAL`) con los
nombres presentes con ese tipo:

| Campaña | Esperados | Instalados | Faltan | Sobran |
|---|---:|---:|---:|---:|
| Glazed | 34 | 86 | 16 | 68 |
| Light Platinum | 5 | 10 | 3 | 8 |
| Liquid Crystal | 274 | 695 | 80 | 501 |
| TFOH Beta 3 | 170 | 411 | 27 | 268 |
| Pokémon Unbound | 311 | 311 | 108 | 108 |

Consecuencias:

- **Faltan 234 entradas** que el plano sí espera (por ejemplo `GLAZED_8_1`,
  `LIQUID_CRYSTAL_39_1`, `UNBOUND_11_1`). Si los eventos llaman a `pbTrainerBattle`
  con esos nombres, el combate no encontrará su entrenador.
- **Sobran 845 entradas** de instalaciones anteriores con otra secuenciación. No son
  inválidas, pero no las usa ningún evento del plano actual.
- El total de combates esperado es 789 NPC + 5 finales = 794. Los tipos de campaña
  contienen 1 513 claves: el conteo no coincide con el plano.

El instalador (`installTrainers` en `tools/lib/dlc_helpers.mjs`) sólo **añade** las
entradas que faltan y no elimina las obsoletas, así que volver a ejecutarlo no basta.

## Otros hallazgos (fuera de las campañas)

- 2 índices numéricos huérfanos (`374` → `POKEMONTRAINER_Lana`, `1407` →
  `COOLTRAINER_M`): anteriores a las campañas, no se tocan aquí.

## Corrección pendiente (requiere decisión)

Reconstruir las entradas de los 5 tipos de campaña a partir del plano: eliminar las
claves de esos tipos que no estén en el plano y añadir las que faltan. Esto modifica
`trainers.dat` y su copia en `Scripts_corregido/Paquete_directo/Data/`, por lo que se
deja a decisión explícita. Tras ello, `node tools/verify_trainer_types_campanas.mjs`
debe salir con código 0.
