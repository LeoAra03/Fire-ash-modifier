# Chequeo Kirin/Android sobre la carpeta del juego (FASE 31)

**Comando:** `npm run kirin_check` → `python3 tools/kirin_check.py pokemon_fire_ash`
**Ejecución real (2026-10-15): exit 0 — 0 errores, 3 avisos.**

```
  [OK] Game.ini · Game.exe · Data/MapInfos.rxdata · Data/Tilesets.rxdata
  [OK] Data/System.rxdata · Data/Scripts.rxdata
  [OK] sin .rgssad (extraído)
  [OK] audio: 4652 archivos
  [!]  40 MIDIs: en Android pueden no sonar
  [!]  sin carpeta PBS (¿juego incompleto?)
  [!]  14 rutas que solo difieren en mayúsculas (lía a Android)
```

## 1. `.rgssad` que rompen Android: **ninguno (0)**

El árbol `pokemon_fire_ash/` está **totalmente extraído**: 0 archivos
`.rgssad` / `.rgss2a` / `.rgss3a` (escaneo completo por extensión). Kirin
necesita archivos extraídos — este punto está en verde y el plan no debe
introducir jamás un archivo cifrado.

## 2. Mayúsculas que rompen Android: **14 pares `.PNG` ↔ `.png`**

Las 14 «rutas que solo difieren en mayúsculas» son **duplicados de tileset
en `Graphics/Tilesets/`**, herencia de la distribución original de Fire Ash
— el mismo tileset guardado dos veces con distinta capitalización:

| # | Base (`Graphics/Tilesets/`) | # | Base |
|---:|---|---:|---|
| 1 | `Bike shop interior` | 8 | `Mansion interior` |
| 2 | `Boat` | 9 | `Mart interior` |
| 3 | `Department store interior` | 10 | `Multiplayer rooms` |
| 4 | `Factory interior` | 11 | `Museum interior` |
| 5 | `Game Corner interior` | 12 | `Poke Centre interior` |
| 6 | `Graveyard tower interior` | 13 | `Ruins interior` |
| 7 | `Interior general` | 14 | `Underground path` |

**Verificación adicional de esta fase:**

- Los 14 pares son **idénticos byte a byte** (SHA-1 y tamaño: 14/14).
- `Data/Tilesets.rxdata` referencia los 14 nombres **sin extensión** (formato
  RMXP: el motor añade `.png` al cargar) — el juego no distingue case en su
  referencia.

**Por qué rompe Android:** en Windows (FS insensible a mayúsculas) ambos
ficheros colapsan en uno y todo funciona. En Android (FS sensible), los dos
coexisten; el problema llega al **copiar/empaquetar** la carpeta: muchos
extractores ZIP, ADB, sincronizadores y empaquetadores APK colapsan u
omiten «duplicados» que solo difieren en mayúsculas. Si el superviviente es
`.PNG` y el motor pide `.png`, el tileset desaparece y los mapas se ven
negros.

**Tratamiento (decisión de esta fase):**

1. **No se borra ningún fichero**: son contenido original (regla de oro) y
   mientras existan ambos, cualquier resolución de mayúsculas funciona.
2. El plan 900 **no debe crear nunca** archivos que difieran solo en
   mayúsculas/minúsculas con otro existente (los nuevos assets van en
   minúsculas, sin espacios problemáticos).
3. Si una herramienta de copia colapsa duplicados, conservar la variante
   **minúscula `.png`** (la que el motor pide por defecto).
4. `npm run kirin_check` queda como verificador disponible: cualquier fase
   que añada assets puede reejecutarlo y esperar «0 errores» y que el
   contador de colisiones de mayúsculas **no crezca de 14**.

## 3. Avisos restantes (no bloqueantes)

- **40 MIDIs** (`Audio/`): en Android pueden no sonar; es una limitación
  conocida del formato, sin acción del plan.
- **Sin carpeta PBS** en `pokemon_fire_ash/`: el árbol del repo trabaja
  sobre `Data/`; la PBS completa vive en la descarga del juego original
  (`tools/download_game.py --full`). No afecta a Kirin.
