# Inventario de arte total — FASE 020

## Censo

`content/plan2700_arte.json` contiene el inventario SHA-256 de los PNG bajo
`pokemon_fire_ash/Graphics` y las referencias de charset halladas en los mapas.
La corrida de esta fase registra:

- **16957 PNG**, **74,5 MiB**;
- **18 archivos modificados desde a33506dc**, todos trazables a la familia de
  medallas/cartucheras DN ya instalada;
- **2028 nombres de character** referenciados;
- **0 referencias ausentes** después de reconocer `invisible` como sentinel del
  motor;
- **365 grupos de duplicados exactos**. No se borran en automático: algunos
  son alias o variantes de runtime y su eliminación sin revisar referencias
  rompería mapas.

`content/plan2700_arte_faltante.json` separa candidatos genéricos, referencias
faltantes y PNG nuevos sin referencia. La corrida actual no encuentra PNG de
Characters nuevos sin referencia.

## Política de atribución

Los mapas de campañas y dimensiones se construyen con recursos de Fire Ash y
adaptaciones originales. Los ROMs invitados son referencia estructural; no se
redistribuyen sus arte, textos o música. Las atribuciones heredadas y las notas
de fuentes están en `pokemon_fire_ash/Credits.txt`.

## Verificadores

```text
npm run verify:graficos
npm run verify:visor
npm run verify:atavios
npm run verify:plan2700:arte
```

El peso y la resolución se auditan automáticamente; la coherencia estética,
la legibilidad y la escala final siguen siendo revisión manual.

### Corrección comprobable de ELECTRAMEW

`tools/plan2700/repair_electramew_character.mjs` reconstruye la hoja
`Characters/ELECTRAMEW.png` desde sus front/back ya existentes, con cuatro
filas de dirección. `npm run verify:coherencia:sprites` queda en **19/19
Pokégods OK**; no se añade arte externo ni se cambia la especie.
