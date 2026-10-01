# NEXO DE RUPTURA Y MAPA DE FLUJO GENERAL
## Cierre del Dimensional Nightmare y conexión de las seis grietas

---

## 1. El Nexo de Ruptura (`Map2136`–`Map2140`)

Cinco mapas finales que **no** pertenecen a ningún universo: son el lugar donde el Nightmare
"se dobla". Uso completo del **Recurso 1 (Glitch City)**.

| Mapa | Título | Recurso (ficha) | Tamaño | Rol |
|---:|---|---|---|---|
| 2136 | Nexo — Falla Cero | R1-6 (void con código) | 30×30 | Entrada; 6 puertas (una por episodio) |
| 2137 | Nexo — Pueblo Reensamblado | R1-1 + R1-13 | 32×24 | Los mundos se pegan: casa de EP02 sobre calle de EP05 |
| 2138 | Nexo — Centro Pokémon Sumergido | R1-10 (ERROR) | 30×24 | **Curación final** (la única enfermera del Nexo) |
| 2139 | Nexo — Pasillo de Código | R1-3 + R1-15 | 24×40 | Último pasillo; cada paso muestra una anomalía registrada |
| 2140 | Nexo — Sala del Testigo | R1-4 + R1-16 | 30×30 | **Epílogo jugable**: la decisión de Ash |

**Puertas del Nexo (2136)**: una por episodio; se abren con `sw883`–`sw888`. Cada puerta muestra
un "resumen vivo" del episodio (3 eventos de texto + 1 objeto conmemorativo del universo).

### Epílogo (2140) — dos finales, ambos válidos
| Opción | Qué hace | Consecuencia |
|---|---|---|
| **Sellar** (elegir el Rotom) | Ash cierra las seis grietas y vuelve al laboratorio de Oak | `sw889 DN_NEXO_CLEARED = ON`; final "El Testigo"; el Archivero queda en la falda; los 6 objetos de colección se exhiben en el laboratorio (evento decorativo) |
| **Dejar abierta** (elegir la grieta) | Ash deja una rendija abierta "por si alguien más necesita entrar" | mismo `sw889`, final "La Rendija"; añade 1 NPC permanente en la Gruta (2030) que ofrece revivir cualquier jefe sellado por menú |

[Nota para desarrollador: la decisión se guarda en `v276` (0 = sellar, 1 = dejar abierta) **antes**
de encender `sw889`; el epílogo no bloquea contenido en ningún caso.]

---

## 2. Mapa de flujo general

```
                                   POKÉMON FIRE ASH 3.7.1
                                             │
                          (postgame sw429 · hub laboratorio de Oak, mapa 48)
                                             │
                                    MONTE SILVER
                    ┌────────────────────────┴────────────────────────┐
                    │                    Map2021 Falda               │
                    │  Archivero Prohibido · Guardiana · placas       │
                    └──────┬─────────────────────────────────┬────────┘
                           │                                 │
                 Map2030 Gruta de los Testigos        Map2022 Cumbre
                (7 puertas Unown · T-E-S-T-I-G-O)      RED el Campeón Silencioso
                           │                                 │
        ┌──────────────────┴───────────┐                     │
        │  7 EMISIONES (contenido v1)  │                     │
        │  2023 Torre que Escuchaba    │                     │
        │  2024 Partida Perdida        │                     │
        │  2025 Fosa del Enterrado     │                     │
        │  2026 Cinta Carmesí          │                     │
        │  2027 Ciudad Glitch          │                     │
        │  2028 Eco que Jugó Contigo   │                     │
        │  2029 Consola de 1996        │                     │
        └──────────────────┬───────────┘                     │
                           │                                 │
                    v264 = emisiones selladas                 │
                           │                                 │
                ┌──────────┴──────────┐                      │
                │  v264 >= 3          │  v264 = 7            │
                ▼                     ▼                      │
    ╔══════════════════════════════════════════════════════════════════╗
    ║              DIMENSIONAL NIGHTMARE (capa nueva)                  ║
    ║                                                                  ║
    ║  EP01 White Hand/Buried Alive   Map2041–2056  R7   → +12         ║
    ║        │  Grieta de Cenizas                                       ║
    ║  EP02 Lost Silver               Map2057–2072  R5   → +10         ║
    ║        │  Grieta Blanca (huella vertical)                        ║
    ║  EP03 Snow on Mt. Silver        Map2073–2087  R6   → +12         ║
    ║        │  Grieta del Sueño                                       ║
    ║  EP04 Hypno's Lullaby           Map2088–2103  R2   → +14         ║
    ║        │  Grieta del Vacío                                       ║
    ║  EP05 Pokémon Black             Map2104–2119  R5+R1→ +16         ║
    ║        │  Grieta del Código (renglones que suben)                ║
    ║  EP06 King Unown                Map2120–2135  R4+R3→ +18         ║
    ║        │  Trono sin letras                                       ║
    ║  NEXO DE RUPTURA                Map2136–2140  R1   → +18 (100)   ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
                           │
                  v265 = 100 → ROTOM NIVEL 5 (ANCLA)
                           │
                  FINALES: "El Testigo" / "La Rendija"
                           │
                  Retorno libre al laboratorio de Oak (mapa 48)
```

### Conexiones alternativas (atajos de diseño)
- La **Gruta de los Testigos (2030)** es el hub de retorno de **todos** los episodios: cada uno tiene
  salida libre desde su mapa final.
- La **Cumbre (2022)** funciona como "vista general": un NPC (el Guardián de la Cumbre, nuevo)
  muestra en texto el progreso `v265/100` y las grietas abiertas.
- El **hub del laboratorio (mapa 48)** gana una **consola del Rotom** tras el primer sello del
  Nightmare: permite viajar a la entrada de cualquier episodio ya desbloqueado (postgame QoL, sin
  alterar el flujo narrativo).

---

## 3. Prerrequisitos y desbloqueos (tabla única)

| Contenido | Se desbloquea con | Se cierra/sella con |
|---|---|---|
| Nightmare (Grieta de Cenizas visible) | `v264 ≥ 3` | — |
| EP01 White Hand | Grieta de Cenizas (2030, 34,12) | `sw883` |
| EP02 Lost Silver | `sw883` | `sw884` |
| EP03 Snow | `sw884` | `sw885` |
| EP04 Hypno | `sw885` **y** `sw703` | `sw886` |
| EP05 Pokémon Black | `sw886` **y** Rotom ≥ 2 | `sw887` |
| EP06 King Unown | `sw887` **y** `v264 = 7` | `sw888` |
| Nexo de Ruptura | `sw888` | `sw889` + `v276` |
| Rotom nivel 5 (Ancla) | `v265 = 100` | — |
| Revancha de jefes sellados | epílogo "La Rendija" | — |

---

## 4. Ritmo de Resonancia (diseño verificado)

| Hito | Ganancia | Acumulado | Umbral alcanzado |
|---|---:|---:|---|
| EP01 sellado | +12 | 12 | — |
| EP02 sellado | +10 | 22 | **Eco (20)** |
| Anomalías EP01+EP02 (máx. +6) | +6 | 28 | — |
| EP03 sellado | +12 | 40 | **Escucha (40)** |
| Anomalías EP03 (+3) | +3 | 43 | — |
| EP04 sellado | +14 | 57 | — |
| Anomalías EP04 (+3) | +3 | 60 | **Marcador (60)** |
| EP05 sellado | +16 | 76 | — |
| Anomalías EP05 (+3) | +3 | 79 | — |
| EP06 sellado | +18 | 97 | — |
| Anomalías EP06 (+3) | +3 | **100** | **Ancla (100)** |
| Nexo | +18 (tope) | 100 | — |

> El jugador que **no** registra anomalías puede llegar al Nexo con 82/100 y despertar el Ancla
> dentro del propio Nexo (los 5 mapas finales reparten +18). **Todo el contenido es accesible**;
> las anomalías solo aceleran la lectura del Rotom.

---

## 5. Qué queda fuera (y por qué)

- **R1 completo en cada episodio**: la R1 se usa en las fases 6–7 de cada universo y en el Nexo,
  como pide el diseño; **no** en fase 1 para no romper la sorpresa.
- **Recurso 3 (Rey Unown)**: solo se usa en 2135 y como icono del Registro. Es el único asset nuevo
  obligatorio de "arte mayor" (ver doc 08).
- **Batallas contra entidades no capturables** (#A001, #A002, #A010, #A013, #A017…): tienen
  **mecánica de evento**, no combate clásico, salvo KINGGUS (batalla final de 2 formas).
- **Nuevos tipos de Pokémon**: no se crean. Todo usa tipos existentes; el tipo "???" es interno.
