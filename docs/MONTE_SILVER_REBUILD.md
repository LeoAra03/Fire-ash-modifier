# Monte Silver — reconstrucción artesanal (2021 · 2030 · 2022)

> Estado: instalado y verificado. Referencia visual: `docs/referencia_monte_silver_rebuild.png`.

Los mapas 2021/2022 del multiverso se generaron clonando plantillas del juego base
(una ciudad, un tejado…). Este documento describe su reconstrucción manual, tile a
tile, con los tilesets y la paleta del propio Fire Ash: mismo estilo que las nieves
de la Ruta 216 y el Monte Lanakila (árbol nevado, montaña, cueva de hielo).

## Mapas

| Mapa | Tamaño | Contenido |
|------|--------|-----------|
| **2021 — Monte Silver · Falda** | 44×41 | Bosque nevado, macizo rocoso, boca de cueva real (`pbCaveEntrance`), refugio con Guardiana (curación), Archivero Prohibido (con página de fin sellado, sw768), montañero, 3 placas legibles (cartel visible en el tile), 3 objetos, puerta al laboratorio de Oak. |
| **2030 — Gruta de los Testigos** (NUEVO) | 68×46 | Vestíbulo con escaleras a falda y cumbre, siete puertas de niebla custodiadas por **Unown que deletrean T-E-S-T-I-G-O**, galerías de roca helada con rampas de hielo (terreno 12) y grietas bloqueantes, curación, Archivero, 3 objetos, encuentros salvajes tipo Cueva. |
| **2022 — Monte Silver · Cumbre** | 32×24 | Meseta nevada con boca de cueva (anillo de rocas), RED el Campeón Silencioso, menú de las 7 emisiones, cabaña de la estación meteorológica, placa, 2 objetos. **Borrizón (Blizzard)** al 100 %. |

> **Separación de IDs:** `Map2030` permanece como Gruta de los Testigos; la aproximación de La Ruta de Dios usa `Map2038`, y sus siete pisos siguen en `Map2031–Map2037`. Ningún generador de la Ruta debe escribir sobre `Map2030`.

## Cambios de comportamiento

- **El contador (v264) solo sube al SELLAR una emisión** (victoria sobre el jefe):
  antes subía al abrir la baliza de la emisión. Ahora la placa de la gruta
  «siete emisiones callaron» se activa con el sello 768 (las 7 zonas).
- **Siete interrupciones sellables**: sw768–774. La página 2 de cada puerta Unown
  se activa con su sello y cambia el texto («esta historia tiene testigo»).
- **Transferencias re-apuntadas**: el hub del laboratorio (mapa 48) entra por la
  puerta nueva de la falda; las 7 emisiones vuelven a la **gruta** (2030), no a la
  cumbre.
- **Música**: campo `Johto Route` (falda), `PkmRS-MtPyre` (gruta), `secretred`
  (cumbre, el tema de Red); batallas Deluxe Johto en exteriores.
- **Metadatos**: nieve en falda, borrizón en cumbre, cueva en gruta; sin lluvia
  «sobre tejados» fuera de sitio.

## Cómo se construyó

`tools/lib/map_painter.mjs` **aprende las reglas de borde** de materiales a partir
de mapas reales (bosque nevado ← Ruta 216/217, Lanakila, Snowpoint; montaña ←
Ruta 216/Lanakila; roca de cueva ← Lanakila Cave, Seafoam, Frost Cavern): para
cada celda guarda qué tiles usa el juego según sus 8 vecinos. Al pintar una región
nueva salen los mismos bordes, copas de árbol y caras de acantilado que el autor
original. El recorrido a pie se valida con BFS (incl. pasos direccionales y
bloqueos de evento) antes de dar por bueno el mapa.

## Uso

```bash
npm run rebuild:monte_silver          # instala (backups en PokeModBackups/)
npm run verify:monte_silver           # solo verificación
```

Tras instalar, `tools/apply_multiverse_creepypasta.mjs` **se niega a ejecutarse**
(si existe `Map2030`, sus plantillas fueron sustituidas); su `--verify` sigue en verde.

## Pendiente

- Prueba manual en `Game.exe` (la sala completa de QA sigue sin ejecutar en Windows).
- Puzles de niebla por Unown (ahora entran directamente a la emisión).
