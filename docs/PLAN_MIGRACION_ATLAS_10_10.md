# Plan verificable para llevar Atlas a 10/10 en Fire Ash

## Decisión de alcance y límites

Este plan convierte la petición de «transferir todo» en una migración trazable y por etapas. **No promete una extracción masiva ni copia ciegamente un ROM completo.** El repositorio no contiene un inventario de ROMs de origen ni permisos/licencias de sus recursos; además, la guía de autoría del proyecto prohíbe incorporar sprites o imágenes externos sin comprobar sus licencias. Por ello, cualquier importación de gráficos, mapas, música, textos o datos extraídos de un juego de terceros queda bloqueada hasta documentar autorización suficiente para incorporarlos y redistribuirlos.

No se guardarán archivos ROM ni dumps en Git. Si un recurso no tiene autorización clara, se reemplazará por arte original o por materiales que ya estén disponibles legítimamente en Fire Ash. Ser propietario de una copia de un juego no se considerará, por sí solo, permiso para publicar sus recursos extraídos.

**«Sin margen de error» no se puede garantizar literalmente.** El método de abajo reduce el riesgo con compuertas *fail-closed*: si falla una comprobación, no se instala ni se avanza de lote. Solo se declara 10/10 después de las verificaciones automáticas y manuales enumeradas aquí.

## Situación real al abrir este plan

- El PR #33 añade un **piloto parcial** a los mapas 1021–1025: nombres regionales, objetos de orientación contextuales, la Campana de Alba y Auralume como especie original con encuentro opcional.
- El piloto **no redibuja todavía la geometría del terreno** y no equivale a una transferencia completa de la región.
- Los mapas 1026–1045 no forman parte de este piloto. El Atlas compilado completo ocupa 1021–2020 (1.000 mapas/40 sectores), pero que exista un mapa compilado no significa que esté rediseñado o revisado.
- No se importó ningún recurso de Pokémon Reloaded ni de otro ROM externo. El arte nuevo del piloto se creó para este proyecto y usa herramientas/formatos del juego.
- El juego debe probarse todavía dentro de `Game.exe` y Kirin; los renderizados PNG no sustituyen esa prueba.

## Definición medible de «10/10»

Para cada lote aprobado, todos estos puntos deben estar en verde; un solo fallo bloquea su entrega:

1. **Cobertura:** cada mapa, evento, Pokémon, entrenador, sprite, interacción y salida incluida en el alcance tiene una fila con estado final en el manifiesto de migración. No hay filas omitidas ni extras fuera de alcance.
2. **Procedencia:** cada recurso externo tiene origen, hash, licencia/permiso, atribución y destino registrados. Los recursos sin autorización se rechazan, no se «prueban a ver si funcionan».
3. **Integridad de datos:** IDs de mapas/especies/eventos únicos; especies, formas, tipos, habilidades, movimientos, objetos y entrenadores resuelven a datos existentes; referencias a gráficos resuelven a archivos con dimensiones compatibles.
4. **Integridad espacial:** mapas y eventos están dentro de límites; entradas y llegadas son transitables; todas las rutas previstas tienen retorno libre; no hay softlocks, portales rotos ni transferencias a coordenadas bloqueadas.
5. **Integridad de eventos:** scripts se analizan, flags y self-switches no colisionan, las elecciones tienen ramas válidas y las interacciones críticas pueden repetirse o terminar correctamente tras ganar, perder o cancelar.
6. **Legibilidad visual:** 100% de los mapas del lote tienen render de revisión y aprobación humana. No se usan Poké Balls como sustitutos genéricos de puertas, señales, objetos o Pokémon.
7. **Ejecución:** 100% de los mapas del lote se recorren en una copia de prueba de `Game.exe` y Kirin, incluyendo entrada, salida, objetos, diálogos y cada batalla/encuentro nuevo.
8. **Reproducibilidad y reversión:** instalación idempotente, backup previo verificado y rollback probado. Tras aplicar, solo difieren los archivos listados en el manifiesto.
9. **Suite:** `npm run verify:all` pasa, además de la verificación específica del lote, `git diff --check` y sincronización de los paquetes afectados.
10. **Cierre:** una persona revisa el informe de cobertura y las pruebas del lote; no se marca 10/10 si queda una comprobación manual pendiente.

## Fases y compuertas

### Fase 0 — Fijar el alcance y la procedencia (bloqueante)

- Confirmar si «todo» significa el rediseño del Atlas (mapas 1021–2020) o también contenidos de otros juegos/ROMs. Este plan asume Atlas Mil; una petición más amplia requiere una matriz de destino aparte.
- Crear un manifiesto de origen/destino antes de tocar datos: ID de fuente, ID de Fire Ash, categoría, transformación prevista, licencia, hash de origen y estado de revisión.
- Mantener fuera del repositorio los ROMs y datos binarios de origen. Registrar solo la información necesaria para auditar la procedencia.
- **No-go:** si no hay permiso/licencia clara para redistribuir un recurso, excluirlo y dibujar/autorizar un reemplazo original. Ningún lote supera esta fase con un recurso externo sin procedencia.

**Salida:** alcance firmado y manifiesto sin recursos de estado «desconocido».

### Fase 1 — Inventario congelado y copia de seguridad

- Registrar el estado base de Fire Ash 3.7.1: MapInfos, mapas, tilesets/pasabilidad, eventos, metadata, encuentros, especies, movimientos, habilidades, gráficos y paquetes.
- Guardar hashes de los archivos que se van a modificar y backups fuera de Git; verificar que cada backup se puede volver a leer.
- Asignar IDs de destino sin reutilizar números y crear una matriz fuente → destino. Mantener los saves originales fuera del proceso: las pruebas se hacen con copia.

**Salida:** inventario con conteos y hashes; cero sobrescrituras sin aprobación.

### Fase 2 — Cerrar primero el piloto 1021–1025

- Conservar el trabajo del PR #33 como base, pero completar la composición visual de los cinco mapas con materiales nativos compatibles con Fire Ash y una identidad local consistente.
- Revisar la Campana de Alba, la navegación, todos los encuentros y el flujo de Auralume; auditar que cada transición y evento sea accesible.
- Producir antes/después, un informe por mapa y resultado de pruebas en `Game.exe`/Kirin.

**Salida:** 5/5 mapas con todas las diez compuertas en verde. El estado actual es **parcial**, no aprobado como 10/10.

### Fase 3 — Terminar Meridiano Ámbar en lotes de cinco

- Secuenciar 1026–1045 en los cuatro lotes 1026–1030, 1031–1035, 1036–1040 y 1041–1045.
- Para cada lote: diseño → instalación idempotente → verificación estática → render → revisión humana → prueba de juego/Kirin → backup/rollback comprobado.
- No iniciar el siguiente lote si el anterior conserva advertencias o pruebas manuales pendientes.

**Salida:** Sector 1 completo, con cobertura 25/25 y un informe de excepciones igual a cero.

### Fase 4 — Escalar al resto del Atlas

- Si el alcance confirmado sigue siendo Atlas Mil, procesar sectores 2–40 en lotes de cinco mapas: cinco lotes por sector (195 lotes después del piloto completo).
- Reusar infraestructura, nunca copiar diálogos/mapas externos por lotes. Cada sector obtiene su propia paleta narrativa, props, especies/encuentros originales cuando proceda y manifiesto de procedencia.
- Conservar las reglas existentes de retorno libre, Mochila permitida, derrota segura y límites de IDs/flags.

**Salida:** matriz de 40/40 sectores y 1.000/1.000 mapas aprobados; si se confirma un alcance mayor que Atlas, no mezclarlo con este conteo.

### Fase 5 — Ensamble, regresión y publicación

- Sincronizar `MapInfos.rxdata`, mapas, metadata, especies, gráficos y paquetes descargables afectados; refrescar informes y referencias generadas.
- Ejecutar `npm run verify:all`, las verificaciones específicas de cada lote y pruebas manuales registradas. Comparar hashes y `git diff` contra la lista autorizada.
- Publicar por PR con tabla de cobertura, capturas, pruebas, licencias/atribuciones y rollback. No redistribuir ROMs ni el juego base.

**Salida:** entrega reproducible y auditable; solo entonces marcar 10/10.

## Protocolo por lote — abortar ante cualquier diferencia

1. Leer el manifiesto y bloquear cualquier recurso con licencia/procedencia incompleta.
2. Verificar que el backup coincide con los hashes de la Fase 1.
3. Aplicar solo el lote indicado; el instalador debe abortar si encuentra ID ocupado, referencia faltante o tile inválido.
4. Ejecutar las pruebas estáticas; producir un informe con conteo esperado y real.
5. Renderizar cada mapa y revisar visualmente todos los sprites, rutas, límites y textos.
6. Jugar el lote en una instalación limpia de prueba y una copia de guardado; no tocar el juego ni la partida original.
7. Comparar el diff con el manifiesto. Si aparece un archivo adicional, un fallo o una ambigüedad, revertir el lote completo y registrar el bloqueo.
8. Aprobar el lote solo con resultado 100%, pruebas manuales adjuntas y rollback confirmado.

## Bloqueos pendientes para empezar la transferencia amplia

- Alcance inequívoco: Atlas Mil completo u otra colección concreta.
- Fuente de cada recurso y permiso/licencia que autorice su uso y redistribución. No añadir ROMs al repo.
- Aprobación de la identidad visual y del primer redibujo del terreno de 1021–1025.
- Pruebas dentro de `Game.exe` y Kirin del piloto actual.

Mientras falte alguno de estos puntos, el trabajo seguro es continuar creando contenido original con los assets disponibles en Fire Ash, no extraer ni importar recursos dudosos.
