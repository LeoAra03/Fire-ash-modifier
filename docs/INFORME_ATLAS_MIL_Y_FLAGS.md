# Informe: Atlas Mil y auditoría total de flags

Fecha: 27 de septiembre de 2026  
Estado: instalado sobre la expansión acumulativa de Fire Ash

## 1. Resultado

Se añadieron **1.000 mapas reales**, numerados `1021–2020`, organizados en 40 sectores de 25 mapas. También se diseñaron e instalaron **500 eventos o peleas adicionales** que no repiten las 500 aventuras de Horizontes ni textos literales del juego anterior.

El verificador informa:

```text
Verificación OK: 1.000 mapas, 500 eventos/peleas únicos, 40 sectores y retorno libre.
```

## 2. Construcción de los 1.000 mapas

Cada mapa del Atlas usa un identificador de plantilla distinto entre los datos ya compilados. Se descartaron mapas puramente cinematográficos o sin al menos seis celdas conectadas y transitables. El resultado conserva el estilo visual de Fire Ash sin importar tilesets o recursos incompatibles.

Cada mapa contiene:

- baliza con nombre, sector y procedencia cartográfica;
- salida directa e incondicional a Puerto Horizonte;
- enlace al mapa anterior, salvo el primero;
- enlace al mapa siguiente, salvo el último;
- una ubicación segura de llegada;
- en los primeros 500 mapas, un evento o pelea exclusivo.

Puerto Horizonte incorpora:

- un Cronista Atlas;
- 40 puertas sectoriales;
- acceso directo al primer mapa de cada bloque de 25;
- progreso visible mediante la variable 102.

La red añadida contiene 3.039 transferencias. Todas las llegadas se comprobaron contra celdas abiertas. No es necesario atravesar los mil mapas linealmente y siempre se puede regresar al puerto.

## 3. Las 500 propuestas nuevas

Distribución:

| Tipo | Cantidad | Comportamiento |
|---|---:|---|
| Jefes de facción | 100 | Combates amistosos de seis Pokémon |
| Duelos de especialistas | 80 | Equipos y coberturas exclusivos |
| Combates de supervivencia | 60 | Seis Pokémon y derrota no bloqueante |
| Batallas dobles | 40 | Exigen dos Pokémon utilizables |
| Pokémon élite | 100 | IV perfectos, cuatro movimientos y captura posible |
| Eventos de artefactos | 60 | Decisión, diálogo y objeto |
| Eventos de mediación | 60 | Elección reversible y registro único |
| **Total** | **500** | **500 self-switches y contador separado** |

El catálogo garantiza:

- 500 títulos únicos;
- 500 ganchos únicos;
- 500 Pokémon principales no usados como protagonistas en Horizontes;
- 500 flags locales únicas;
- ningún equipo de entrenador repetido dentro de Atlas;
- ningún equipo idéntico a un entrenador anterior;
- ningún título o gancho idéntico a los diálogos/eventos de mapas 1–1020;
- 280 entrenadores compilados nuevos;
- 100 encuentros salvajes élite;
- 120 eventos narrativos/de decisión.

Lista completa:

```text
docs/500_EVENTOS_Y_PELEAS_ATLAS_MIL.md
```

Catálogo estructurado:

```text
content/atlas_mil_500.json
```

## 4. Flags nuevas

| ID | Nombre | Función |
|---:|---|---|
| 706 | POKEMOD ATLAS MIL OPEN | Atlas desbloqueado |
| 707 | POKEMOD ATLAS MIL 500 COMPLETE | 500 registros resueltos |
| Variable 102 | POKEMOD ATLAS MIL COMPLETED | Contador protegido 0–500 |

Cada desafío usa además su self-switch A local. La operación generada es `0 = ON`, según la semántica correcta de RPG Maker XP.

## 5. Revisión de todas las flags

La auditoría `tools/audit_all_flags.mjs` recorrió:

- los 2.020 mapas actuales;
- todas las páginas y condiciones de evento;
- comandos 111, 121, 122 y 123;
- scripts Ruby de eventos y sus continuaciones 655;
- 50 eventos comunes;
- las 402 secciones de `Scripts.rxdata`;
- accesos literales y expresiones dinámicas a switches, variables y self-switches.

Resumen:

```text
707 slots de switch
645 switches con nombre
632 switches con uso literal
102 slots de variable
93 variables con nombre
63 variables con uso literal
5.674 claves de self-switch observadas
73 expresiones dinámicas distintas
0 conflictos en las reservas PokeMod
```

### Bloques críticos

- `429 = Postgame`: conserva las condiciones de acceso postgame.
- `674 = NO ITEM INBATT`: puede seguir siendo activado por eventos originales, pero ya no es consultado por `pbItemMenu` en combates internos.
- `675 = NO ITEM OUTBATT`: no se modificó.
- `701–705`: misión de Hypno y Horizontes.
- `706–707`: Atlas Mil.
- Variables `101–102`: contadores independientes.

No se reutilizó ningún ID original. Las nuevas flags comienzan inmediatamente después del switch original 700 y las variables después de la variable original 100.

### Precaución sobre flags aparentemente libres

El informe diferencia lecturas, escrituras ON/OFF, accesos Ruby y flags sin uso literal. Una flag sin referencia literal **no debe borrarse automáticamente**, porque el juego contiene expresiones dinámicas que calculan índices durante la ejecución.

Tabla completa de switches 1–707 y variables 1–102:

```text
docs/AUDITORIA_TOTAL_FLAGS.md
```

Ubicaciones detalladas, self-switches y expresiones dinámicas:

```text
pokemon_fire_ash/PokeModBackups/auditoria_flags_total.json
```

## 6. Estado global después de Atlas Mil

```text
2.020 mapas leídos
20.014 eventos
34.043 páginas
33.651 diálogos
4.326 elecciones
9.580 transferencias
3.611 llamadas a combates de entrenador
3.864 entrenadores compilados
1.212 especies referenciadas
402 secciones de script válidas
```

El analizador sigue mostrando 45 avisos heredados: 7 referencias de entrenador y 38 referencias históricas de gráficos/objetos del juego base. El número no aumentó; no existe ninguna incidencia en mapas `997–2020`.

## 7. Backups y reversión

Originales inmediatamente anteriores a Atlas Mil:

```text
pokemon_fire_ash/PokeModBackups/atlas_mil_originals/
```

Para revertir únicamente Atlas:

1. restaurar los archivos de `atlas_mil_originals/` sobre `Data/`;
2. eliminar `Map1021.rxdata` hasta `Map2020.rxdata`.

Los backups anteriores de Isla Espejo y Horizontes permanecen intactos.

## 8. Reproducibilidad

```bash
node tools/generate_atlas_mil_catalog.mjs
node tools/apply_atlas_mil_expansion.mjs
node tools/apply_atlas_mil_expansion.mjs --verify
node tools/audit_all_flags.mjs
node tools/analyze_compiled_fire_ash.mjs
```

El instalador se ejecutó nuevamente y todos los hashes permanecieron iguales, demostrando idempotencia.

No se pudo realizar una prueba visual en `Game.exe` porque el entorno no dispone de Wine. La prueba manual recomendada es: Puerto Horizonte → Cronista Atlas → puerta de un sector → mapa anterior/siguiente → retorno al puerto.
