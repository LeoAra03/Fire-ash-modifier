# Auditoría de tiles — Expedición Atlas Mil

Informe generado por `tools/atlas_tile_audit.mjs` sobre **1000 mapas** de Atlas Mil.

## 1. ¿Ofrece cada mapa una experiencia distinta?

- Huellas de geometría únicas: **819 de 1000**.
- Mapas idénticos entre sí (clones exactos): **65**.
- Pares con más del 90 % de vocabulario de tiles compartido: **2980**.
- De esos pares, con la **misma disposición** de tiles en más del 97 % de las celdas: **2731** (2074 dentro de los grupos de interiores estándar).
- Grupos de mapas idénticos que son edificios de servicio (Centros Pokémon, Tiendas…): **39** de 65.
- Tamaño medio: **41.414 × 35.518** celdas.
- Tiles distintos por mapa: media **81.616** (mín. 10, máx. 468).
- Transitabilidad media: **0.311**.

### Clones exactos

- `df86ed990cf3` (5 mapas): 1348, 1487, 1580, 1681, 1826
- `b32f33c8e186` (4 mapas): 1078, 1699, 1729, 1762
- `6586334b1482` (4 mapas): 1369, 1660, 1886, 1888
- `0a3c004833bf` (4 mapas): 1573, 1574, 1575, 1576
- `2703f0525e84` (4 mapas): 1987, 2011, 2012, 2013
- `84e254081b7f` (3 mapas): 1368, 1482, 1483
- `38f6e9a16132` (2 mapas): 1030, 1206
- `fea23e9b5af8` (2 mapas): 1056, 1219
- `b1f0c1610dcf` (2 mapas): 1062, 2015
- `dd722c305cc0` (2 mapas): 1081, 1083
- `b458cb20c203` (2 mapas): 1085, 1197
- `2a2e9b766adf` (2 mapas): 1099, 2014
- `de32ef0b322a` (2 mapas): 1143, 1145
- `45f7ac6d2d73` (2 mapas): 1217, 1887
- `eabb028f29e1` (2 mapas): 1328, 2019
- `ac2b39584636` (2 mapas): 1370, 1484
- `0191830a05ea` (2 mapas): 1385, 2018
- `739f1a1fbf44` (2 mapas): 1441, 2020
- `1c88fc72c393` (2 mapas): 1447, 1747
- `2b4704e5a87b` (2 mapas): 1480, 1659
- `56829113ec27` (2 mapas): 1485, 1486
- `cc408ba4ad18` (2 mapas): 1700, 1763
- `6c9970d674ae` (2 mapas): 1767, 1900
- `7331bad1f5ba` (2 mapas): 1925, 2016
- `54fbb41f9820` (2 mapas): 1963, 2017

### Pares más parecidos (≥ 90 % de materiales compartidos)

| Mapa A | Mapa B | Materiales | Misma disposición |
|---|---|---|---|
| 1027 | 1608 | 1 | 100.0 % |
| 1027 | 1620 | 1 | 100.0 % |
| 1030 | 1206 | 1 | 100.0 % |
| 1045 | 1131 | 1 | 100.0 % |
| 1045 | 1568 | 1 | 100.0 % |
| 1045 | 1742 | 1 | 100.0 % |
| 1045 | 1852 | 1 | 100.0 % |
| 1065 | 1092 | 1 | 100.0 % |
| 1078 | 1699 | 1 | 100.0 % |
| 1078 | 1729 | 1 | 100.0 % |
| 1078 | 1762 | 1 | 100.0 % |
| 1081 | 1083 | 1 | 100.0 % |
| 1085 | 1197 | 1 | 100.0 % |
| 1131 | 1568 | 1 | 100.0 % |
| 1131 | 1742 | 1 | 100.0 % |
| 1131 | 1852 | 1 | 100.0 % |
| 1143 | 1145 | 1 | 100.0 % |
| 1270 | 1315 | 1 | 100.0 % |
| 1348 | 1487 | 1 | 100.0 % |
| 1348 | 1580 | 1 | 100.0 % |
| 1348 | 1681 | 1 | 100.0 % |
| 1348 | 1826 | 1 | 100.0 % |
| 1408 | 1423 | 1 | 100.0 % |
| 1408 | 1445 | 1 | 100.0 % |
| 1408 | 1465 | 1 | 100.0 % |
| 1408 | 1477 | 1 | 100.0 % |
| 1408 | 1492 | 1 | 100.0 % |
| 1408 | 1981 | 1 | 100.0 % |
| 1423 | 1445 | 1 | 100.0 % |
| 1423 | 1465 | 1 | 100.0 % |

- Mapas cuya **combinación de NPCs y eventos** no se repite en ningún otro mapa: **0**.
- Firmas de contenido distintas: **1** para 1000 mapas.

## 2. ¿Hay tiles mal hechos?

- Mapas sin ningún defecto detectado: **1000 de 1000**.

Ninguno de los defectos comprobados aparece en ningún mapa.

## 3. Qué comprueba exactamente esta auditoría

- ids de tile fuera del rango del tileset (basura en la tabla de tiles);
- celdas sin ningún tile en las tres capas (huecos negros bajo el suelo);
- regiones transitables aisladas de la entrada (zonas a las que no se puede llegar);
- mapas sin ninguna celda transitable;
- eventos sobre celdas bloqueadas o fuera de los límites;
- mapas sin evento de salida (el jugador podría quedarse atrapado);
- mapas planos: menos de 8 tiles distintos, es decir, sin diseño.
