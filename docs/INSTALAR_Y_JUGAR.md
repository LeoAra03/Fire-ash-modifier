# Instalar y jugar — entrega final R18 (2026-10-11)

Guía corta y verificable para pasar del ZIP a la partida. Todos los números de
esta página están medidos sobre el repositorio, no recordados.

## Las cuatro respuestas rápidas

| Pregunta | Respuesta |
|---|---|
| **¿El juego está completo?** | Sí, en el sentido jugable: `npm test` en verde (QA propia) + los verificadores de cada pilar. Todo el contenido nuevo está instalado y accesible **después del duelo de Arceus** (switch 873). Lo que queda no es contenido roto: es tu partida de prueba de punta a punta. |
| **¿Arceus tiene un sprite distinto en cada fase?** | **Sí.** Seis barras, seis hojas distintas: `ARCEUS_F1`…`ARCEUS_F5` (una por regla borrada: Cielo, Talento, Velocidad, Tipo, Regla) y en la sexta la **Forma Origen de los Mil Brazos**. La **Forma Primigenia** (última barra en rojo) vuelve al Arceus clásico. Comprobado con `npm run verify:arceus:sprites`. |
| **¿Hay muchas campañas?** | **Sí, cinco campañas ROM completas** (1 227 mapas, 3 625 actores adaptados, 5 061 warps, 794 combates): Glazed, Light Platinum, Liquid Crystal y TFOH desde el barco y **Unbound** por el portal de Puerto Horizonte + **Atlas Mil** (1 000 mapas y 8 gimnasios nuevos) + Horizontes (500 aventuras) + Dimensional Nightmare (149 mapas) + 7 mundos creepypasta + Team Rocket + Islas Espejo. |
| **¿Ash tiene sus outfits y sprites conseguibles?** | **Sí.** Vestidor en la casa de Ash (Map003, junto a la cama): 7 atavíos de dimensión (Atlas, Creepypasta, Glazed, Light Platinum, Liquid Crystal, TFOH y Unbound) + clásico + uniforme de chica + disfraz Rocket, con modo automático o fijo. El **Atuendo de Maestro** lo entrega Oak al completar La Ruta de Dios. |

## Instalación

1. **Copia de seguridad.** Duplica tu carpeta de Fire Ash (o al menos `Game.rxdata`
   y `Save*.rxdata`). Este paquete nunca toca partidas, pero la copia no estorba.
2. **Descomprime sobre la raíz del juego** (la carpeta que contiene `Game.exe`),
   aceptando reemplazar:

   | Orden | Archivo | Qué añade |
   |---|---|---|
   | 1 | `Fire_Ash_Paquete_Directo.zip` | Correcciones base + La Ruta de Dios (scripts, mapas, sprites, música) |
   | 2 | `Dimensional_Nightmare_QA.zip` | Pesadilla Dimensional (opcional, recomendado) |
   | 3 | `Fire_Ash_Expansion_Multiversal.zip` | Grietas creepypasta, Liga Oscura, barco, espejo, Oak postgame |

   Si no puedes descomprimir en Android, copia las carpetas `Data/`, `Graphics/` y
   `Audio/` de `Paquete_directo/` sobre las del juego.
3. **No hace falta** crear ni borrar `Save Files`, y no borres `Game.rxdata`.
4. Entra al juego y carga tu partida. Si estabas en Ciudad Puntaneva, sal y vuelve
   a entrar para que el mapa se refresque.

## La ruta del duelo (el corazón del DLC)

1. **Pueblo Hojaverde (Twinleaf, Map513)** → habla con **Volus** y elige
   `Canalizar resonancia`: activa las 17 Tablas del Génesis y abre la ruta.
2. **Ciudad Puntaneva (Snowpoint, Map625)** → el **portal** de luz en la avenida
   celeste (ya no depende de ninguna flag perdida).
3. **Aproximación celestial (Map2038)** → terrazas, escaleras e hitos hasta la
   **Gruta de los Testigos (Map2030)**.
4. **Siete pisos (Map2031-2037)**: guías, guardianes (Dialga y Palkia
   primordiales, nivel 150) e ítems ocultos.
5. **Cima del Génesis (Map2037)**: prólogo cinematográfico (Cynthia/Steven,
   Gold/Red, Volus con Giratina) y **el duelo de Arceus**:
   - seis barras, una regla borrada por barra;
   - un sprite distinto por fase y la Mega de los Mil Brazos en la sexta;
   - captura 0 % hasta el debilitamiento final y 100 % después;
   - si todo cae, la merced única del Rotom te devuelve una vez;
   - rendición segura: nunca te quedas sin salida.

Al resolverlo (ganar, capturar o empatar) se encienden los switches **873/874/875**
y **todo** el contenido de abajo queda disponible.

## Después del duelo: todo lo que hay

| Contenido | Cómo se llega | Tamaño |
|---|---|---|
| **7 mundos creepypasta** | Grietas en Kanto/Johto (Map149, 979, 90, 303, 412, 295, 190) → emisiones 2023-2029 | 7 mundos + 30 eventos de restauración |
| **Monte Silver** | Punto de colapso en la Torre Pokémon (Map143) con **7 purgas** → falda (2021) y cumbre | Siete puertas y jefes por zona |
| **Liga Oscura** | Con **8 purgas** (incluido Red) se abre el umbral (Map2022) → 2192 y 2193 | 5 combates que se pueden perder + diploma |
| **Atlas Mil** | Capitán en el puerto de **Ciudad Carmín (Map108)** → Muelle de Atlas Mil (2191) → Avenida del Circuito (2230) | 1 000 mapas, 8 gimnasios (2250-2257), 40 anclas artesanales, 120 rutas Tier 2 |
| **Glazed** | Barco en **Puerto Horizonte (Map1001)** | 111 mapas (3000-3110), 8 líderes, medalla |
| **Light Platinum** | Barco en Puerto Horizonte | 19 mapas (3120-3138), 8 líderes, medalla |
| **Liquid Crystal** | Barco en Puerto Horizonte (Map2240) | 432 mapas (3200-3631), 8 líderes, medalla |
| **TFOH (Team Rocket)** | Barco en Puerto Horizonte (Map2242) | 245 mapas (3700-3944), 8 ejecutivos |
| **Islas Espejo / Pokégods** | Espejo del **Sótano Sellado de la Mansión Pokémon (Map192 → 2194)** | 3 mapas, 19 Pokégods con formas ALFA/BETA/OMEGA |
| **Team Rocket (infiltración)** | Base subterránea 2220 y núcleo 2221 | 6 rangos, 5 misiones, medalla |
| **Dimensional Nightmare** | Nexo 2040 y sus nueve grietas | 149 mapas, 9 mundos, Liga Oscura propia |
| **500 Horizontes** | 20 reinos con 25 aventuras cada uno | 500 eventos instalados |
| **La Vía de las Nueve Eras** | 2195 + gimnasio 2196 | Ruta de enlace entre dimensiones |

Nada se alcanza por menú de teletransporte: todo es diegético (barco, espejo,
grieta, portal) y siempre hay retorno.

## Atavíos de Ash

- **Vestidor**: casa de Ash (Map003), junto a la cama. Elige atavío, fíjalo o
  déjalo en automático.
- **Atavío automático**: al entrar a una dimensión, Ash viste su ropa de allí y
  vuelve al clásico al salir. El **disfraz Rocket nunca se pisa** (los mapas
  2220-2221/2281 quedan excluidos).
- **Atuendo de Maestro**: regalo de Oak al completar La Ruta de Dios (switch 885),
  con sprites de caminar, surf, pesca y batalla (frente y espalda).
- Variables de progreso: **316** (atavío actual) y **317** (0 automático / 1 fijo).

## Salón de Diplomas

En la **planta alta de la casa de Ash** hay una puerta nueva al salón (Map2288)
con siete marcos: La Ruta de Dios (876), **Liga Oscura (948)**, Mundo Atlas
(8 medallas), Glazed (990), Light Platinum (991), Liquid Crystal (992) y TFOH
(993). El de la Liga Oscura quedó arreglado en esta entrega: el jefe final
`LA CONVERGENCIA` marca el switch al ganar y en la revancha.

## Verificación reproducible

```bash
npm test                       # cadena completa de QA (incluye los tres candados nuevos)
npm run verify:arceus:sprites  # seis fases, seis sprites distintos, en juego y en el ZIP
npm run verify:diplomas        # los siete marcos tienen hito comprobable
npm run verify:corregido:zip   # el ZIP raíz coincide archivo por archivo
npm run verify:package         # el ZIP directo coincide archivo por archivo
npm run verify:rom:campaigns:plan   # las cinco campañas siguen completas
```

Para reconstruir todo desde cero:

```bash
node tools/apply_expansion_multiversal.mjs   # SIEMPRE primero
node tools/apply_la_ruta_de_dios.mjs         # (usa --solo-scripts para no tocar mapas)
npm run dn:build:all && npm run dn:hub       # Dimensional Nightmare completo
node tools/apply_canon_arceus.mjs            # canon de Arceus DESPUÉS del Nightmare
npm run dn:gameboy                           # paleta Game Boy, tras el canon
node tools/apply_dn_banner_cleanup.mjs --refresh-plan
npm run build:dn:qa && npm run dn:verify:all
npm run sync:paquete && npm run build:package && npm run verify:package
npm run build:corregido:zip && npm run verify:corregido:zip
npm run verify:all
```

> **Orden intocable.** Ejecutar `apply_expansion_multiversal` después de
> `apply_canon_arceus` reescribe las puertas y borra la condición del switch 873
> (el duelo de Arceus). Si pasa: `apply_canon_arceus` otra vez y
> `git checkout --` los mapas afectados.
>
> El Coliseo de la Liga Oscura (Map2142) se **reconstruye** en `dn:build:all`, así
> que el canon y la paleta Game Boy van después: al revés desaparece el evento
> «eco del Génesis» y el verificador de canon se pone rojo.
