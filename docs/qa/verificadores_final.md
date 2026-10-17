# Cuadro de verificadores finales

## Verde

| Comando | Resultado |
|---|---|
| `npm test` | 0 fallos; salida archivada en `cierre_npm_test.txt` |
| `npm run test:ui` | 29 OK, 0 fallos |
| `npm run verify:package` | 2616 archivos OK |
| `npm run verify:corregido:zip` | ZIP raíz idéntico al paquete directo |
| `npm run verify:dn:qa` | 487 archivos, 152 mapas, 150 tilesets |
| `npm run verify:ruta_de_dios:package` | paquete sincronizado |
| `npm run verify:expansion:package` | carpeta y ZIP sincronizados |
| `npm run verify:map-reference` | 1000 Atlas + 45 complementarios |
| `node tools/inventario_congelado.mjs --verify` | 3465 mapas, 0 colisiones |
| `node tools/qa/artifact_budget_check.mjs --json` | presupuesto dentro de política |
| `python3 tools/kirin_check.py pokemon_fire_ash` | 0 errores; 3 avisos documentados |
| `npm run verify:dialogos:queue` | sin solapes ni cajas mal formadas |
| `npm run verify:glosario` | glosario congelado OK |
| `npm run verify:canon:arceus` | canon OK |
| `npm run verify:tone-safety` | tono/pantalla OK |

## No verde, con causa trazada

| Comando | Causa | Tratamiento |
|---|---|---|
| `npm run verify:all` | `dn:plan:check` encuentra recortes fuente ausentes para mapas DN | no crear sustitutos; conservar bloqueo en `cierre_verify_all.txt` |
| `npm run verify:plan900:recursos` | volcado histórico desactualizado frente al estado actual | regenerar en una fase de recursos, no ocultar el diff aquí |
| `npm run render:atlas:macro02` | falta `PokeModBackups/atlas_visual_macro02_originals/Map1646.rxdata` | conservar referencias existentes y marcar regeneración manual |

## Pendiente manual

No se contabilizan como PASS: instalación sobre copia limpia, descarga desde
GitHub, Game.exe/Kirin real, Android, 60 sesiones de playtest, FPS/memoria,
revisión externa de texto/accesibilidad y desinstalación desde backups. Las
fichas de estas actividades conservan estado `manual_pending`.
