# Informe acumulativo: Mochila global, misión de Hypno y Horizontes 500

Fecha: 27 de septiembre de 2026  
Estado: instalado en los datos compilados de Pokémon Fire Ash  
Actualización posterior: Atlas Mil añade mapas 1021–2020 y está documentado en `docs/INFORME_ATLAS_MIL_Y_FLAGS.md`.

## 1. Mochila habilitada globalmente

La restricción relevante estaba en `PokeBattle_Battle#pbItemMenu`, sección `Battle_Phase_Command`:

```text
674 = NO ITEM INBATT
```

Ahora el switch 674 **ya no impide abrir la Mochila en ningún combate interno normal del juego**, incluyendo las dos zonas secretas bajo el segundo piso del laboratorio de Oak, la torre dimensional y todas las variantes del escenario Grandeur.

Se mantuvo únicamente `!@internalBattle`, que no es la flag 674 y protege modalidades externas/especiales cuyo sistema no admite el inventario normal. El switch 675, relacionado con objetos fuera de combate, no se modificó.

La sección compilada contiene cero referencias a `$game_switches[674]` dentro de `pbItemMenu`.

## 2. Misión: los niños del Bosque Susurrante

### Inicio

- NPC nuevo en **Ciudad Verde**, mapa 43, coordenadas `(34,25)`.
- Solo aparece en postgame mediante `429 = Postgame`.
- Aceptar la misión activa `701 = POKEMOD HYPNO RESCUE STARTED`.
- El NPC abre una ruta al mapa 1000 sin sustituir eventos originales de Ciudad Verde.

### Bosque nuevo

- Mapa 1000: `Whisperwood Rescue Forest`.
- Está construido sobre geometría y colisiones ya utilizadas por el Bosque Verde.
- Contiene cinco niños, un guardabosques, Hypno y un retorno libre a Ciudad Verde.
- Ninguna derrota encierra al jugador.

### Hypno

El jefe salvaje se crea como un Pokémon real y puede **ser derrotado o capturado**:

- especie: Hypno;
- nivel: 100;
- IV: 31 en las seis estadísticas;
- EV: 252 PS, 252 Ataque Especial y 6 Defensa Especial;
- naturaleza: Modesta;
- objeto: Cuchara Torcida;
- movimientos: Hipnosis, Come Sueños, Psíquico y Onda Certera;
- no permite huir;
- perder no provoca bloqueo de la misión.

Una victoria normal o captura activa `702 = POKEMOD HYPNO SUBDUED`. Hablar con el guardabosques despierta a los niños, entrega una Master Ball y activa `703 = POKEMOD CHILDREN RESCUED` y el acceso a Horizontes.

## 3. Nuevo mundo: Horizontes

La misión desbloquea Puerto Horizonte y veinte lugares postgame conectados. Todos poseen una salida al puerto; el puerto siempre puede regresar a Ciudad Verde.

| Mapa | Lugar | Tema |
|---:|---|---|
| 1001 | Puerto Horizonte | Cartografía dimensional y rutas imposibles |
| 1002 | Jardines Aurora | Flores que almacenan amaneceres |
| 1003 | Arrecife Cinerario | Coral volcánico y ceniza |
| 1004 | Ciudad Engranaje | Tecnología alimentada por amistad |
| 1005 | Ruinas del Eco | Voces antiguas grabadas en piedra |
| 1006 | Selva Prismática | Lluvia que separa los colores |
| 1007 | Caverna Celeste | Cristales y constelaciones |
| 1008 | Corona de Cronos | Senderos detenidos en el tiempo |
| 1009 | Torre de Ceniza | Recuerdos que sobreviven al fuego |
| 1010 | Isla de las Mareas | Corrientes gobernadas por la luna |
| 1011 | Arboleda del Juramento | Promesas convertidas en árboles |
| 1012 | Gruta Boreal | Auroras bajo el hielo |
| 1013 | Caverna Terminal | Rutas abandonadas hacia ningún mapa |
| 1014 | Espacio Umbral | Gravedad y estrellas deformadas |
| 1015 | Ruina Cero | Datos perdidos convertidos en paisaje |
| 1016 | Santuario Dragón | Nidos y corrientes cálidas |
| 1017 | Archipiélago Frutal | Cosechas de estaciones distintas |
| 1018 | Villa Camelia | Casas que florecen con buenas acciones |
| 1019 | Enredo Feérico | Caminos sensibles a las emociones |
| 1020 | Panteón Pokégod | Criaturas de realidades fusionadas |

Los mapas 1000–1020 son aditivos. Los nombres funcionan mediante el fallback seguro de `Game_Map#name`; no se reescribieron los cinco archivos binarios de idioma.

## 4. Las 500 aventuras aplicadas

El catálogo contiene exactamente **500 títulos, ganchos, flags locales y Pokémon principales únicos**. Cada uno se instaló como evento interactivo real y no solo como texto de diseño.

Distribución:

| Tipo | Cantidad | Implementación |
|---|---:|---|
| Historias y lore | 100 | NPC, diálogo propio y registro único |
| Objetos escondidos | 100 | Hallazgos de una sola obtención |
| Pokémon raros | 80 | Encuentros capturables o derrotables |
| Entrenadores | 100 | Equipos nuevos de seis Pokémon |
| Rescates | 40 | Viñetas y NPC propios |
| Anomalías temporales | 40 | Encuentros ligados a líneas alternativas |
| Acertijos | 20 | Elección, recompensa y reintento |
| Manifestaciones Pokégod | 20 | Nivel 100, shiny, IV perfectos y captura posible |
| **Total** | **500** | **500 eventos con self-switch y contador** |

Cada lugar contiene 25 aventuras. Completar una incrementa `101 = POKEMOD HORIZONS COMPLETED` una sola vez y activa su self-switch A con la operación RMXP correcta (`0 = ON`). Al alcanzar 500 se activa `705 = POKEMOD HORIZONS 500 COMPLETE`; el Cronista del puerto reconoce el logro y entrega la recompensa final una sola vez.

La lista completa y legible está en:

```text
docs/500_AVENTURAS_POSTGAME.md
```

El catálogo estructurado que consume el instalador está en:

```text
content/horizontes_500.json
```

## 5. Pokégods

La imagen aportada se usó como inspiración para las criaturas fusionadas y deidades alternativas. Para no romper especies, Pokédex, cries, evoluciones ni gráficos de combate del juego base, las 20 manifestaciones usan especies compiladas existentes como recipiente y añaden:

- nombre individual de Pokégod;
- nivel 100;
- IV perfectos;
- EV competitivos;
- condición shiny;
- cuatro movimientos fuertes definidos en el catálogo;
- combate salvaje real con posibilidad de captura;
- altar y diálogo únicos.

El modelo de sprites enlazado genera retratos de entrenador de 96×96, no hojas de personaje RMXP 4×4. Por seguridad visual y técnica, esta instalación reutiliza sprites nativos verificados en vez de introducir una hoja incompatible.

## 6. Flags y variable añadidas

| ID | Nombre | Función |
|---:|---|---|
| 701 | POKEMOD HYPNO RESCUE STARTED | Misión aceptada |
| 702 | POKEMOD HYPNO SUBDUED | Hypno derrotado o capturado |
| 703 | POKEMOD CHILDREN RESCUED | Niños entregados al guardabosques |
| 704 | POKEMOD HORIZONS OPEN | Nuevo mundo disponible |
| 705 | POKEMOD HORIZONS 500 COMPLETE | Las 500 aventuras terminadas |
| Variable 101 | POKEMOD HORIZONS COMPLETED | Contador protegido 0–500 |

Estos identificadores comienzan justo después de los máximos originales: switch 700 y variable 100. No pisan flags del juego base.

## 7. Seguridad y retorno

- Ciudad Verde no pierde ningún evento original.
- El NPC nuevo usa una marca propia y el instalador es idempotente.
- Los mapas 1000–1020 no sustituyen mapas base.
- Todos los eventos se colocaron en el mayor componente transitable de su plantilla.
- Las 44 transferencias aditivas terminan en celdas abiertas.
- Los 20 lugares tienen retorno.
- El bosque puede regresar a Ciudad Verde antes o después de enfrentar a Hypno.
- Las batallas nuevas permiten perder sin bloquear la partida.
- Los 500 eventos usan flags de una sola ejecución y no duplican progreso.

## 8. Backups

Estado inmediatamente anterior a Horizontes:

```text
pokemon_fire_ash/PokeModBackups/horizontes_originals/
```

Contiene los originales de:

- `System.rxdata`;
- `Map043.rxdata`;
- `MapInfos.rxdata`;
- `map_metadata.dat`;
- `trainers.dat`.

El backup anterior a cualquier modificación del proyecto sigue disponible:

```text
pokemon_fire_ash/PokeModBackups/backup_20260927_040849.zip
```

## 9. Verificación

El instalador informa:

```text
Verificación OK: misión Hypno, 21 mapas, 500 aventuras, 100 entrenadores y retorno libre.
```

El análisis global posterior informa:

```text
1020 mapas leídos
15.475 eventos
29.001 páginas
28.069 diálogos
6.541 transferencias
3.331 llamadas a combates de entrenador
3.584 entrenadores compilados
402 secciones de script válidas
0 incidencias en mapas 1000–1020
```

Las 45 advertencias globales restantes son exactamente las referencias heredadas del juego base ya documentadas; no aumentaron después de instalar Horizontes.

El instalador fue ejecutado dos veces y los hashes de todos sus archivos permanecieron iguales, comprobando idempotencia.

## 10. Reproducción

```bash
node tools/generate_horizontes_500_catalog.mjs
node tools/apply_isla_espejo_expansion.mjs
node tools/apply_horizontes_500_expansion.mjs
node tools/apply_horizontes_500_expansion.mjs --verify
node tools/analyze_compiled_fire_ash.mjs
```

No se pudo ejecutar `Game.exe` en este contenedor porque no dispone de Wine. La comprobación pendiente es visual: iniciar una partida postgame en Windows, hablar con el guardabosques en Ciudad Verde y recorrer la ruta Ciudad Verde → Bosque Susurrante → Puerto Horizonte → Ciudad Verde.
