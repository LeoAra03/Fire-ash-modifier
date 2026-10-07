# Arceus Omega — contrato transaccional y QA

## Continuidad

El visitante de La Ruta de Dios, Atlas Mil y Dimensional Nightmare es **el Ash postgame de Fire Ash**. No se reemplaza su historia ni se importa un protagonista de una ROM: cada dimensión reconoce su experiencia, equipo y vínculos previos.

## Límite de la ilusión

Arceus puede aparentar cambiar reglas, equipo, bolsa, interruptores, color, música y decisiones de la CPU. `ArceusSaveSandbox` establece un límite real alrededor de `pbStartArceusDivineBattle`:

1. compila y clona en memoria los valores persistentes registrados por `SaveData`;
2. conserva una imagen defensiva del archivo de guardado existente;
3. bloquea `SaveData.save_to_file` mientras el encuentro está activo;
4. ejecuta prólogo, seis etapas, reintentos y captura dentro del límite;
5. en `ensure`, también ante una excepción controlable, restaura jugador, sistemas, switches, variables, self-switches, pantalla, metadatos, bolsa y almacenamiento;
6. restaura cualquier deriva detectada del archivo físico;
7. aplica exclusivamente los resultados canónicos permitidos.

`map_factory` y `game_player` no se recargan porque el intérprete de evento llamante mantiene referencias vivas. El combate no recibe permiso para mutarlos. Reemplazarlos durante el retorno podría dejar al intérprete apuntando a un mapa obsoleto.

## Lista blanca de resultados canónicos

Sólo pueden cruzar el rollback:

- el interruptor que recuerda que el prólogo ya fue visto;
- el interruptor de captura de Arceus;
- una única copia normalizada del Arceus capturado, añadida después de restaurar equipo y PC.

Daño, estados, Pokérus, objetos consumidos, reglas alteradas, tonos, variables y cambios de almacenamiento intermedios se descartan. La progresión exterior posterior al retorno del método sigue siendo responsabilidad del evento canónico que invocó la batalla.

## Fallos y alcance

El `ensure` cubre retorno normal y excepciones Ruby controlables. Un cierre violento del proceso no puede ejecutar código de restauración en memoria; aun así, la barrera de escritura impide que el estado transitorio llegue al archivo mediante el guardado normal. La imagen física añade defensa ante escritores directos mientras el proceso sigue vivo. No se promete recuperar RAM después de matar el proceso o apagar el dispositivo; se promete que el save normal en disco no recibe el estado ilusorio.

## Matriz ejecutable de 300.000 casos

`content/arceus_omega_qa_matrix.jsonl` contiene 300.000 casos sustantivos más una cabecera:

- 120.000 transacciones: claves de save, captura canónica, hotkey bloqueada y deriva física;
- 90.000 estados de batalla: seis etapas, decisiones CPU deterministas, huida bloqueada y cues visibles;
- 90.000 controles de mapas: Dimensional Nightmare, Atlas Mil y La Ruta de Dios, con caminabilidad, salidas, colisión, capas, tiles, tonos, retornos y continuidad postgame.

Cada caso incluye semilla, dimensión, etapa, punto de fallo y oráculo. No son líneas decorativas.

```bash
npm run generate:arceus:omega:qa
npm run verify:arceus:omega:qa
npm run verify:ruta_de_dios
npm run verify:arceus:cinematics
python3 tools/kirin_check.py pokemon_fire_ash
```

La validación visual final de ritmo, animaciones, clipping y audio requiere `Game.exe` o Kirin. El entorno Linux de automatización no incluye Wine/Kirin, por lo que las pruebas aquí son estáticas y simuladas, no una afirmación de ejecución visual real.
