# Informe final: análisis de Fire Ash y expansión Isla Espejo

Fecha del análisis: 27 de septiembre de 2026  
Juego analizado: Pokémon Fire Ash 3.7.1, datos compilados Ruby Marshal/RMXP  
Estado: expansión instalada; comprobaciones estáticas y automatizadas superadas

## 1. Resultado ejecutivo

Se examinó la copia completa del juego antes de escribir en `Data/`. Después se instaló contenido postgame aditivo llamado **Isla Espejo**, con acceso desde Pueblo Paleta, tres mapas, 16 jefes y 32 encuentros de entrenador (primer combate y revancha de cada jefe).

También se corrigió la restricción de Mochila del secreto postgame situado bajo el laboratorio de Oak. Una petición posterior amplió el parche: el switch 674 ya no bloquea la Mochila en ningún combate interno del juego, incluidas todas las etapas del Grandeur Club.

Resultado de la verificación del instalador:

```text
Verificación OK: 3 mapas, 16 jefes, 32 combates y retorno libre.
```

No se alteraron partidas guardadas. Antes de escribir se creó un backup ZIP integral de `Data/`, `Game.ini`, PBS/partidas si existieran y, además, copias individuales de todos los datos base afectados. Los recursos pesados inmutables de Audio/Graphics no forman parte del ZIP.

## 2. Método de análisis

El juego no contiene PBS de texto, por lo que se analizaron directamente sus datos compilados. El analizador reproducible `tools/analyze_compiled_fire_ash.mjs` abre Ruby Marshal 4.8 y recorre:

- `MapInfos.rxdata` y todos los `MapXXX.rxdata`;
- árboles de eventos, páginas, condiciones, diálogos, elecciones y scripts de evento;
- switches, variables y self-switches con identificadores literales;
- transferencias directas y validez de mapa/coordenadas de destino;
- tilesets y una clasificación estática de transitabilidad por celda;
- NPC y referencias a sprites locales;
- objetos, especies, tipos de entrenador y equipos compilados;
- llamadas a combates y existencia de la combinación tipo/nombre/versión;
- eventos comunes;
- metadatos de mapa y posiciones regionales;
- las 402 secciones comprimidas de `Scripts.rxdata`, incluida su integridad zlib.

El informe completo, de unos 20 MB, queda fuera de Git junto a los backups:

```text
pokemon_fire_ash/PokeModBackups/analisis_total_fire_ash.json
```

Se puede regenerar sin modificar el juego mediante:

```bash
node tools/analyze_compiled_fire_ash.mjs
```

## 3. Inventario global obtenido

| Elemento | Resultado |
|---|---:|
| Mapas registrados y leídos | 999 |
| Tilesets | 25 |
| Celdas de mapa examinadas | 1.859.635 |
| Celdas estáticamente bloqueadas | 1.232.264 |
| Celdas parcialmente restringidas | 20.805 |
| Eventos de mapa | 14.926 |
| Páginas de evento | 27.940 |
| Eventos con gráfico clasificados como NPC | 9.687 |
| Bloques de diálogo | 26.624 |
| Elecciones | 1.104 |
| Bloques de script dentro de eventos | 15.201 |
| Transferencias directas | 6.497 |
| Llamadas estáticas a combates de entrenador | 3.231 |
| Eventos comunes | 50 |
| Secciones de script zlib válidas | 402 |
| Switches con referencia literal | 624 |
| Variables con referencia literal | 61 |
| Definiciones de especies | 1.295 |
| Especies referenciadas | 876 |
| Definiciones de objetos | 979 |
| Clases de objeto referenciadas | 757 |
| Tipos de entrenador | 556 |
| Registros numéricos de entrenador | 3.484 |
| Índices regionales encontrados | 10 |

Los diez índices regionales contienen, respectivamente, 157, 99, 114, 134, 127, 86, 71, 42, 1 y 31 mapas con posición regional. Los interiores sin posición propia siguen estando representados en el árbol completo de `MapInfos` y en el JSON.

### Límites de estas métricas

- «NPC» es una categoría estática: evento cuya primera página muestra un gráfico. Incluye algunos objetos animados y no intenta adivinar intención narrativa.
- La colisión es una auditoría conservadora basada en las banderas de paso de los tiles del mapa. La resolución dinámica del motor puede variar por páginas de evento, `through`, puentes, terreno y scripts.
- Los conteos de flags y llamadas cubren referencias literales. Ruby permite construir identificadores de forma dinámica, algo que ningún análisis estático puede enumerar con certeza absoluta.
- El chequeo de sprites mira los archivos distribuidos localmente; una referencia puede proceder del RTP o ser un nombre centinela intencionado.

## 4. Lógica postgame y Mochila

La causa concreta de la restricción era el switch:

```text
674 = NO ITEM INBATT
```

La comprobación se encontraba en `PokeBattle_Battle#pbItemMenu`, sección compilada `Battle_Phase_Command`. El switch relacionado con objetos fuera del combate es:

```text
675 = NO ITEM OUTBATT
```

El alcance completo del desafío secreto Grandeur es:

| Mapa | Nombre |
|---:|---|
| 141 | SECRET PEAK |
| 151 | GRANDEUR LOUNGE |
| 214 | STAGE |

Actualización posterior solicitada: el switch 674 ya no bloquea la Mochila en ningún combate interno del juego. Esto cubre 141, 151, 214 y también cualquier otra instalación que active esa flag. Se conserva únicamente la regla `!@internalBattle` de modalidades externas/especiales, y el switch 675 no se modificó. El estado acumulativo está documentado en `docs/INFORME_HORIZONTES_500.md`.

## 5. Expansión instalada: Isla Espejo

### Acceso y progresión

- Se añadió el NPC `PokeMod: Aide Isla Espejo` a Pueblo Paleta, mapa 33, coordenadas `(39,24)`.
- Su página está condicionada por `429 = Postgame`, por lo que no interrumpe la historia principal.
- El NPC transfiere al jugador al atrio, mapa 997, coordenadas `(14,10)`.
- El ferry del atrio siempre devuelve directamente a Pueblo Paleta, mapa 33, `(39,25)`.
- Las dos alas tienen una salida incondicional al atrio.
- Perder ante cualquier jefe está permitido (`canLose=true`) y no encierra al jugador.
- Hay curación en cada mapa.

### Mapas

| ID | Nombre | Eventos | Diálogos | NPC | Salidas | Transitabilidad estática |
|---:|---|---:|---:|---:|---:|---|
| 997 | Mirror Island - Atrium | 9 | 31 | 8 | 3 | 436 abiertas / 204 bloqueadas |
| 998 | Mirror Island - Gallery of Legends | 9 | 41 | 7 | 1 | 436 abiertas / 204 bloqueadas |
| 999 | Mirror Island - Zero Archive | 9 | 41 | 7 | 1 | 436 abiertas / 204 bloqueadas |

Los mapas usan una geometría ya probada del mapa 973, tileset 10, fondo de combate `distortion` y metadatos compatibles. Sus eventos son nuevos. El análisis no encontró transferencias inválidas, coordenadas fuera del mapa, sprites ausentes ni referencias de entrenador rotas en 997–999.

Los archivos de idioma compilados no se reescribieron. `Game_Map#name` tiene ahora un fallback a `MapInfos` solo cuando no existe una traducción compilada, de modo que los mapas aditivos muestran su nombre sin provocar un diff binario grande en cinco paquetes de idioma.

### Jefes y tono creativo

El atrio presenta cuatro reflejos de manga y líneas alternativas:

1. Yellow;
2. Green;
3. Blue como comandante Rocket;
4. Cynthia con armadura ancestral.

La Galería de Leyendas contiene seis especialistas y versiones alternativas:

5. Sabrina de la tríada Rocket;
6. Koga de la tríada Rocket;
7. Lt. Surge como mayor Rocket;
8. Steven arqueólogo;
9. Wally miembro de la élite;
10. un Profesor Oak joven.

El Archivo Cero contiene seis encuentros de anomalías, glitches y desenlaces:

11. Red poseído por el Monte Plateado;
12. Giovanni con armadura de contención;
13. el científico de una fusión fallida;
14. un coleccionista de Pokémon shiny;
15. el programador olvidado;
16. Game Over.

Los equipos usan entre cuatro y seis Pokémon de nivel 78–96. Cada jefe tiene introducción, texto de victoria/derrota y diálogo de revancha propios. La primera victoria entrega una única `RARECANDY`; después se activa el self-switch A y queda disponible una revancha repetible sin duplicar el premio.

Se comprobó explícitamente la semántica RMXP del comando 123: operación `0` enciende el self-switch y operación `1` lo apaga. Tanto el instalador como `web/js/create.js` usan ahora la operación correcta, y existe una prueba de regresión dedicada.

## 6. Rutas de retorno verificadas

El grafo aditivo de transferencias es:

```text
Pueblo Paleta (33)
  -> Atrio (997)
       -> Pueblo Paleta (33)
       -> Galería (998) -> Atrio (997)
       -> Archivo Cero (999) -> Atrio (997)
```

Todas las rutas usan destinos existentes y coordenadas válidas. No dependen de haber derrotado a un jefe ni de consumir un objeto.

## 7. Hallazgos heredados del juego base

La auditoría conservadora mantiene visibles 45 avisos: 7 referencias de entrenador sin coincidencia exacta y 38 advertencias de recursos/objetos. Ninguna está en los mapas nuevos ni en el NPC de acceso.

Referencias de entrenador base sin combinación exacta tipo/nombre/versión:

- `CAMPER / Wyatt / 0`, mapa 606;
- `LASS / Lyra / 0`, mapa 630;
- `COOLTRAINER_F / Victoria / 0`, mapa 355;
- `COOLTRAINER_F / Kahili / 0 y 1`, mapa 959;
- `SCIENTIST / Faba / 0 y 1`, mapa 960.

Los avisos gráficos base incluyen nombres como `invisible`, `BUTTERFREE Shiny`, `trchar352` y `trchar002`; pueden ser centinelas, dependencias RTP o referencias antiguas. Los diez símbolos de objeto base que no coinciden con `items.dat` son nombres históricos de correo/curación/objetos X (`AIRMAIL`, `BLOOMMAIL`, `BUBBLEMAIL`, `FLAMEMAIL`, `GRASSMAIL`, `SPACEMAIL`, `TUNNELMAIL`, `PARLYZHEAL`, `XDEFEND`, `XSPECIAL`).

No se corrigieron automáticamente porque no fueron introducidos por Isla Espejo y alterar contenido base sin una prueba de juego específica sería más arriesgado que conservarlo.

## 8. Backups y reversión

Backup de todos los datos editables previo a cualquier escritura (1.061 archivos; integridad ZIP comprobada):

```text
pokemon_fire_ash/PokeModBackups/backup_20260927_040849.zip
```

Copias individuales de los originales afectados:

```text
pokemon_fire_ash/PokeModBackups/isla_espejo_originals/
```

Para revertir solo la expansión:

1. copiar los archivos de `isla_espejo_originals/` sobre `pokemon_fire_ash/Data/`;
2. eliminar `Map997.rxdata`, `Map998.rxdata` y `Map999.rxdata` de `Data/`.

El ZIP permite restaurar íntegramente `Data/`, `Game.ini` y cualquier PBS/partida incluida; Audio y Graphics no se tocaron y no requieren restauración.

## 9. Validación ejecutada

```text
node tools/apply_isla_espejo_expansion.mjs --verify
  Verificación OK: 3 mapas, 16 jefes, 32 combates y retorno libre.

node web/js/marshal.test.mjs
  marshal.js: 51 OK, 0 fallos

node web/js/integration.test.mjs
  integración: 114 OK, 0 fallos

git diff --check
  sin errores

node tools/analyze_compiled_fire_ash.mjs
  999 mapas leídos; 402 scripts válidos; 0 incidencias en los mapas añadidos
```

No se pudo ejecutar una prueba visual dentro de `Game.exe`: este entorno no dispone de Wine ni de un ejecutable Linux compatible. La validación realizada es estructural, referencial y de integración; conviene hacer una última prueba manual en Windows recorriendo Pueblo Paleta → las tres salas → Pueblo Paleta y abriendo la Mochila en cada etapa de Grandeur.

## 10. Archivos principales del cambio

- `pokemon_fire_ash/Data/Map033.rxdata`
- `pokemon_fire_ash/Data/Map997.rxdata`
- `pokemon_fire_ash/Data/Map998.rxdata`
- `pokemon_fire_ash/Data/Map999.rxdata`
- `pokemon_fire_ash/Data/MapInfos.rxdata`
- `pokemon_fire_ash/Data/Scripts.rxdata`
- `pokemon_fire_ash/Data/trainers.dat`
- `pokemon_fire_ash/Data/map_metadata.dat`
- `tools/apply_isla_espejo_expansion.mjs`
- `tools/analyze_compiled_fire_ash.mjs`
- `web/js/analyze.js`
- `web/js/create.js`
- `web/js/integration.test.mjs`
