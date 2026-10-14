# Cuatro campañas ROM completas después de La Ruta de Dios

## Objetivo

Esta fase sustituye la representación anterior de «una costa y un gimnasio» por cuatro campañas navegables completas dentro de Fire Ash. Ash no reemplaza al protagonista del ROM: entra como visitante después de completar La Ruta de Dios, escucha a sus habitantes, acepta desafíos y puede regresar al embarcadero desde cada mapa.

No se versionan diálogos, tiles, música ni gráficos extraídos de terceros. El análisis local conserva estructura, dimensiones, NPC, warps y operaciones de guion; el compilador los reconstruye con tiles, sprites, música y datos que ya existen en Fire Ash.

## Cobertura instalada

| Campaña | Mapas detectados/compilados | Rango Fire Ash | NPC | Combates | Acceso |
|---|---:|---|---:|---:|---|
| Glazed | 111/111 | Map3000–Map3110 | 770 | 75 | Map2200 |
| Light Platinum | 19/19 | Map3120–Map3138 | 188 | 7 | Map2210 |
| Liquid Crystal | 432/432 | Map3200–Map3631 | 2.457 | 600 | Map2240 |
| TFOH Beta 3 | 245/245 | Map3700–Map3944 | 2.101 | 377 | Map2242 |
| **Total** | **807/807** | — | **5.516** | **1.059** | — |

Además se reconstruyeron **3.252 warps**. Cuando el destino banco/mapa fue detectado, el warp conserva esa relación. Cuando la minería no pudo resolverlo, utiliza el siguiente tramo seguro. Todos los mapas tienen también navegación lineal anterior/siguiente y retorno incondicional al embarcadero, por lo que ningún fallo heurístico puede encerrar al jugador.

## Progresión postgame

- Requisito global: switch **876**, final de La Ruta de Dios.
- Progreso Glazed: variable 350; final switch 990.
- Progreso Light Platinum: variable 351; final switch 991.
- Progreso Liquid Crystal: variable 352; final switch 992.
- Progreso TFOH: variable 353; final switch 993.
- Los combates usan `canLose=true`.
- La Mochila permanece disponible; no se tocan los switches 674/675.
- Cada último mapa contiene un guardián de campaña, cierre persistente y retorno libre.

## Reconstrucción de mapas

Cada mapa conserva las dimensiones detectadas en el ROM, salvo que necesite crecer para colocar sin solapamientos todos sus eventos. El aspecto se genera mediante 22.539 instrucciones de fila que combinan mapas donantes del propio Fire Ash. Sólo se aceptan tiles transitables del tileset exterior, evitando huecos, tiles inválidos y zonas aisladas.

El plano completo está en:

```text
content/rom_campaigns_complete.json
```

Contiene 411.000+ líneas auditables: fuente banco/mapa, dimensiones, semántica climática, plan visual por fila, NPC, operaciones estructurales, flags de origen, warps y enlaces seguros. No contiene texto ni assets copiados de los ROMs.

## Pipeline reproducible

```bash
# Sólo al cambiar los ROMs locales
node tools/gba_maps_events.mjs --dir reference/roms_invitadas/entrada
npm run create:rom:campaigns

# Compilar dentro de Fire Ash
npm run build:rom:campaigns
npm run verify:rom:campaigns:plan
npm run verify:rom:campaigns

# Sincronizar paquete instalable
npm run sync:paquete
npm run build:package
npm run verify:package
```

## Garantías del verificador

`npm run verify:rom:campaigns` comprueba:

1. Los 807 archivos `Map*.rxdata` existen.
2. Cada campaña sólo se abre tras el switch 876.
3. Cada mapa conserva todos los NPC y warps del plano.
4. Cada mapa tiene avance, retroceso y retorno libre.
5. Los eventos están dentro de sus límites.
6. Hay más de mil combates adaptados y todos pueden perderse sin `game over`.
7. Cada campaña posee un final persistente.
8. Los conteos compilados coinciden exactamente con el análisis forense.

## Límite honesto

«Completo» aquí significa **toda la estructura detectable de los cuatro ROMs integrada y recorrible**. No significa emulación byte por byte ni copia literal de sus guiones y assets. La minería de ROM puede producir falsos positivos y no recupera todos los nombres internos; por eso se conserva un trayecto lineal seguro y la narrativa se reescribe para Ash visitante. La sensación final todavía debe revisarse manualmente en Kirin/Game.exe.
