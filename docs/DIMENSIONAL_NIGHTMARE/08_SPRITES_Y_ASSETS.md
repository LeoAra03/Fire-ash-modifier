# SPRITES Y ASSETS — Fichas de generación
## Todo lo que falta, con especificación técnica y prioridad

> **Regla del proyecto**: el Nightmare es 100 % jugable con assets **existentes** de Fire Ash.
> Esta lista es la mejora de arte. Nada de aquí bloquea la implementación.

Convenciones del repo (Fire Ash / RPG Maker XP + Essentials v19):
- **Overworld (char set)**: hoja de 4 columnas × 4 filas de celdas de **32×32 px** (formato RMXP
  estándar, 128×128 por personaje). El sprite pedido "32×32 overworld" se materializa como **una celda**.
- **Battler frontal**: PNG **64×64** sobre fondo transparente.
- **Battler trasero**: PNG **64×64** (vista desde atrás, para el Pokémon del jugador).
- **Iconos**: PNG **32×32** (icono de Registro / objetos).
- Paleta: limitada (≤ 32 colores por sprite), estilo GBA pixel art sin antialiasing.

---

## 1. Prioridad ALTA (arte mayor)

### 1.1 `DN_KINGGUS_FRONT.png` — KINGGUS, forma 1 (El Trono)
- **Uso**: batalla final de EP06, primera forma (Map2135).
- **Tamaño**: 64×64 frontal.
- **Descripción**: criatura teal/azul oscuro con **un ojo blanco gigante** en el torso-cabeza y
  **8 ojos pequeños** distribuidos en abanico; boca con mandíbula roja dentada; dos brazos: uno
  termina en garra curva, el otro en pinza; patas robustas con garras blancas y rojas.
- **Paleta**: teal `#2E7F80`, azul oscuro `#123A4A`, blanco `#F2F2F2`, rojo sangre `#8E1B1B`,
  negro `#101418`.
- **Animación** (2 frames): el ojo grande parpadea; los ojos pequeños se desplazan 1 px.

### 1.2 `DN_KINGGUS_FINAL_FRONT.png` — KINGGUS, La Forma Sin Letra
- **Uso**: batalla final de EP06, segunda forma (equipo 120–125).
- **Tamaño**: 64×64 frontal (puede usar `@scale = 1.5` en Essentials para verse más grande).
- **Descripción**: la forma 1 pero **abierta**: el ojo grande sustituido por **7 ojos en fila**
  (uno por letra K-I-N-G-G-U-S); el cuerpo muestra grietas con código hexadecimal teal;
  brazos con 3 garras cada uno; aura de píxeles teal.
- **Uso alternativo**: si no hay arte, `UNOWN` con tinte teal + escala 1.5 (viable).

### 1.3 `DN_KINGGUS_BACK.png` — trasero (solo si se permite captura/uso)
- 64×64. No es obligatorio (KINGGUS no es capturable); incluir solo si se decide el "modo testigo".

### 1.4 `DN_KINGGUS_OVER.png` — overworld
- 1 celda de 32×32 (hoja 4×4 estándar `DN_KINGGUS.png`).
- **Uso**: aparición en la cinemática de 2135 (se levanta del trono) y en la ficha del Registro.

### 1.5 `DN_WHITE_HAND.png` — LA MANO BLANCA (R7-16)
- **Uso**: jefe EP01, segunda fase (Map2056, altar).
- **Tamaño**: **96×96** (evento/escenario, se dibuja sobre el altar; no es battler ni char).
- **Descripción**: mano pálida, dedos largos, sin uñas visibles, muñeca que se pierde en luz blanca;
  fondo transparente; sin gore (estética de "mano de mármol").
- **Estado**: el recurso R7-16 ya contiene la ficha visual; se puede **recortar del mosaico** como
  paso previo (ver §4).

---

## 2. Prioridad MEDIA (apoyo visual)

| Asset | Formato | Uso | Descripción |
|---|---|---|---|
| `DN_UNOWN_FRAGMENT.png` | 32×32 icono | Objeto de EP06 | Fragmento de piedra con una letra Unown grabada; 7 variantes de letra |
| `DN_CARTRIDGE.png` | 32×32 icono | Objetos `DN_CARTRIDGE_0X` | Cartucho GBA con etiqueta arrancada; tinte distinto por episodio |
| `DN_PAGE.png` | 32×32 icono | `DN_PAGE_0X` | Página de cuaderno con borde quemado |
| `DN_PHOTO.png` | 32×32 icono | `DN_PHOTO_0X` | Fotografía sepia; la variante 03 está en blanco |
| `DN_ROTOM_TIME.png` | 32×32 icono | Objeto clave | Rotom dentro de un reloj de bolsillo; aguja partida |
| `DN_GLITCH_WINDOWSKIN.png` | Windowskin 192×128 | Menús en fase ≥5 | Ventana con bordes corruptos, texto legible (nunca ilegible) |
| `DN_FOG_PURPLE.png` | 256×256 tileable | Fases 3–5 | Niebla púrpura tipo R2 |
| `DN_GLITCH_TILES.png` | Autotile/tileset | Fases 6–7 | Bloques hexadecimales verdes/blancos tipo R1 |
| `DN_SNOWFALL_DIGITAL.png` | 256×256 | EP02 fase 7, EP03 | Nieve de píxeles (partículas) |

---

## 3. Prioridad BAJA (variantes y guiños)

| Asset | Formato | Uso |
|---|---|---|
| `DN_CUBONE_NOHORN.png` | 64×64 front | Variante "sin hueso" de EP01 (o usar `CUBONE` + `@form`) |
| `DN_GLALIE_EXTRAEYE.png` | 64×64 front | Variante de EP03 |
| `DN_SILVER_SHADOW.png` | 64×64 front | Silueta de jefe EP02 (o usar `Graphics/Pokemon/Shadow`) |
| `DN_PLAYER000.png` | 4×4 char | Jefe EP05 (sprite `SECRET_Red` con tinte negro ya sirve) |
| `DN_UNOWN_CORO.png` | 4×4 char ×5 | Coro de Unown de EP06 |

---

## 4. Cómo obtener arte desde los mosaicos entregados (sin dibujar)
Los 7 recursos son **mosaicos compilados**. Para convertir a assets del juego:
1. **Recortar** cada ficha del mosaico (coordenadas de rejilla conocidas: R1/R2/R4/R5/R7 = 4×4;
   R6 = 5×3; R3 = imagen única del Rey).
2. **Extraer la paleta** (≤32 colores) y cuantizar a estilo GBA.
3. **Reconstruir el tileset** solo si se quiere el mapa *tal cual*; alternativa recomendada:
   usar los tilesets existentes de Fire Ash (Lanakila Cave, Mt. Pyre, Lavender, Snowpoint) y usar
   los mosaicos como **referencia de composición** (esto ya es lo que hace `tools/lib/map_painter.mjs`).
4. **Los battlers de criatura** (R3) sí conviene limpiarlos a 64×64 con fondo transparente.

Herramientas sugeridas (todas offline, sin dependencias nuevas obligatorias):
- `python tools/…` o un script Node con `sharp` **solo si se autoriza la dependencia**; si no,
  usar un editor de píxeles manual. [Nota para desarrollador: el repo evita dependencias nuevas en
  runtime; el recorte de assets puede ser un script de desarrollo, no de juego.]

---

## 5. Resumen de prioridad

| Prioridad | Assets | Bloquea el juego |
|---|---|---|
| ALTA | 5 (Kinggus ×3, Mano Blanca, icono Unown) | **No** (todo tiene sustituto existente) |
| MEDIA | 9 | No |
| BAJA | 5 | No |
| **Total** | **19** | — |
