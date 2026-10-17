# Entrega: alcance y limitaciones conocidas

## Limitaciones conocidas

## Qué se entrega

La entrega es un conjunto de parches y paquetes para una instalación existente
de Fire Ash. El paquete directo se extrae sobre la carpeta que contiene
`Game.exe`; no contiene el ejecutable base ni las partidas del jugador. Las
fuentes, comandos de generación y verificadores están en este repositorio.

Construcción reproducible:

```bash
npm run build:package && npm run verify:package
npm run build:corregido:zip && npm run verify:corregido:zip
npm run build:dn:qa && npm run verify:dn:qa
npm run build:expansion:package && npm run verify:expansion:package
npm run create:map-reference && npm run verify:map-reference
node tools/inventario_congelado.mjs --verify
```

Los paquetes no contienen backups, partidas, `Game.rxdata`, `content/`,
`tools/`, ROMs invitadas ni mosaicos derivados de una ROM invitada. Las fuentes
no redistribuibles se quedan fuera y cualquier extracción nativa requiere una
fuente local explícita.

## Limitaciones concretas

- La ejecución final de Game.exe, una instalación descargada desde GitHub,
  Android/Kirin, FPS, memoria, tiempo de carga y permisos de almacenamiento
  necesita el binario y un entorno humano/dispositivo. Las auditorías estáticas
  no los convierten en PASS.
- Cuatro referencias históricas de audio no tienen archivo homónimo; no se
  copia una pista arbitraria para ocultarlo.
- `npm run verify:all` conserva un pendiente cuando faltan recortes fuente
  autorizados de Dimensional Nightmare. No se generan sustitutos sintéticos.
- La comparación visual Atlas macro02 no se puede regenerar sin su backup
  original; se conservan las referencias existentes.
- `pokemon_fire_ash/Data/Map081.BAK` sigue siendo un artefacto versionado
  histórico fuera de los ZIP de entrega; retirarlo requiere una decisión de
  mantenimiento separada para no destruir una fuente.
- La revisión externa, la accesibilidad en dispositivo y el playtest de punta a
  punta permanecen `pending_human_review` hasta que exista un acta firmada.
- Las cifras publicadas son las de la herramienta y el checkout que se
  indican junto a ellas; no son estimaciones de rendimiento del dispositivo.

## Cómo comunicar una limitación

Una limitación debe decir qué se midió, qué no se pudo medir, por qué importa y
qué comando o sesión la resolvería. No se debe ocultar con «conocido», marcar
`resolved` sin regresión ni prometer una campaña que no figura en el alcance
real. El registro canónico está en `docs/qa/defectos.md`.

## Cierre honesto del bloque

FASE 027 deja `static_pass_manual_pending`: la higiene de paquetes, la
trazabilidad documental y los comandos son auditables; la partida completa, las
firmas del playtest, la CI remota final y la revisión externa siguen pendientes.
