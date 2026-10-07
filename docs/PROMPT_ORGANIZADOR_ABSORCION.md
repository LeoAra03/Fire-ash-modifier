# Fire Ash Toolkit Organizer + motor de dimensiones ROM

## Estado de esta entrega (7 de octubre de 2026)

La fase de organización ya fue ejecutada en este checkout. Los binarios y recursos de terceros permanecen **locales e ignorados por Git**.

- Tiled 1.12.2, Porymap y Porygion: extraídos en `toolkit/editores/`.
- pokecrystal y pokered: extraídos en `toolkit/descompilaciones/`.
- TIMPS Swarm: 161 definiciones detectadas en `toolkit/agentes/timps_swarm/`.
- Coordinador Pokémon Agent, rvpacker, Swablu y scripts corregidos: extraídos.
- Índice reproducible: `npm run toolkit:index` genera `toolkit/INDICE_HERRAMIENTAS.json`.
- Los RAR multipart se abrieron correctamente con 7-Zip 26.03 obtenido mediante el paquete npm `7zip-bin-full`; no se concatenaron manualmente, porque son volúmenes RAR5 reales.

## ROMs extraídas y análisis forense

| ROM | Base detectada | Mapas | NPC | Diálogos | Integración jugable |
|---|---|---:|---:|---:|---|
| GlazedESPB6 | Emerald | 111 | 770 | 552 | Map2200–2201 |
| LightPlatinumEsp | Ruby | 19 | 188 | 87 | Map2210–2211 |
| LiquidCrystalESP | FireRed | 432 | 2.457 | 1.920 | Map2240–2241 |
| Pokémon TFOH Beta 3 | FireRed | 245 | 2.101 | 1.352 | Map2242–2243 |
| FactoryAdventure | Game Boy | n/d | n/d | n/d | Map2244–2245 |

Comandos usados:

```bash
node tools/inspect_gba_rom.mjs --dir reference/roms_invitadas/entrada
node tools/gba_maps_events.mjs --dir reference/roms_invitadas/entrada
npm run rom:assets
npm run toolkit:index
```

La extracción local produjo, entre otros recursos:

- Factory Adventure: 193 nombres, 190 pares frontal/trasero y 198 sprites sueltos.
- Glazed: 2.399 gráficos LZ77 exportados.
- Light Platinum: 2.274 gráficos LZ77 exportados.
- Liquid Crystal: 1.666 gráficos LZ77 exportados.
- TFOH: 2.611 gráficos LZ77 exportados.

Estos recursos viven en `reference/roms_invitadas/` y no se redistribuyen. Los mapas jugables son reinterpretaciones compatibles con Essentials/RMXP, no copias binarias de los ROMs.

## Campañas completas de los cuatro ROM GBA

La integración profunda posterior añade los 807 mapas detectados: Glazed
Map3000–3110, Light Platinum Map3120–3138, Liquid Crystal Map3200–3631 y TFOH
Map3700–3944. Conserva 5.516 NPC, 3.252 warps y 1.059 desafíos estructurales.
El plano saneado de 411.000+ líneas está en `content/rom_campaigns_complete.json`
y se compila con `npm run build:rom:campaigns`.

## Contrato creativo: Ash es visitante

Cada ROM forma una dimensión separada. Se abre después del duelo de Arceus (switch 873), tiene capitán propio en Puerto Horizonte, barco de regreso incondicional, seis distritos señalizados, cuatro entrenadores, habitantes, cronista, jefe y recompensa. Todas las balizas explican que Ash llega como huésped: observa y participa sin reemplazar al protagonista local.

El instalador es reproducible:

```bash
npm run build:dimensiones
npm run verify:dimensiones
```

El verificador exige cinco dimensiones, IDs de mapa únicos, procedencia forense, presentación de Ash como visitante, retorno libre, balizas para todos los distritos, combates válidos y jefe con recompensa.

## Mapas prioritarios ya protegidos

- **La Ruta de Dios:** siete pisos, aproximación, entrenadores y Arceus nivel 200 verificados con `npm run verify:ruta_de_dios`.
- **Isla Espejo:** tres mapas extensos, 16 jefes, retorno, enfermera y Abra verificados con `npm run verify:isla_espejo`.
- **Atlas Mil:** 1.000 mapas sin defectos de tiles según `npm run verify:atlas:tiles`; su avenida y ocho gimnasios se reconstruyen con `npm run build:circuito`.
- **Team Rocket:** conserva Map2220–2221; los nuevos ROMs usan Map2240–2245 para evitar colisiones.

## Asignación de los 161 agentes TIMPS

| Grupo | Agentes | Responsabilidad |
|---|---:|---|
| Forense ROM | 1–24 | tablas, mapas, flags, entrenadores y catálogos |
| Cartografía | 25–64 | composición, tiles, pasabilidad y conexiones |
| Narrativa visitante | 65–92 | adaptación de Ash, habitantes y continuidad |
| Combate y PBS | 93–116 | equipos, curvas, encuentros y recompensas |
| QA estructural | 117–144 | retornos, colisiones, flags e integridad |
| QA visual/manual | 145–160 | Kirin/Game.exe, capturas y regresión |
| Coordinación | 161 | inventario, dependencias y cierre |

## Pipeline para la siguiente expansión

1. Colocar el ROM únicamente en `reference/roms_invitadas/entrada/`.
2. Ejecutar inspectores y registrar conteos; no asumir que Porymap abre un ROM compilado.
3. Extraer recursos sólo como referencia local con `npm run rom:assets`.
4. Reservar IDs y switches sin colisionar con `docs/AUDITORIA_TOTAL_FLAGS.md`.
5. Añadir la dimensión a `content/dimensiones_barco.json`.
6. Construir y verificar dimensiones, mapas prioritarios y paquete.
7. Probar manualmente en Kirin/Game.exe; el QA estático no sustituye una partida real.

```bash
npm run build:dimensiones
npm run build:rocket
npm run build:circuito
npm run verify:dimensiones
npm run verify:ruta_de_dios
npm run verify:isla_espejo
npm run verify:atlas:tiles
npm run build:expansion:package
npm run verify:all
```
