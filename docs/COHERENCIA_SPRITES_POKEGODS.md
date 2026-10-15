# Coherencia overworld ↔ batalla · Pokégods (fase 67)

Verificador: `node tools/verify_overworld_battle_coherence.mjs` (`--json` para salida máquina).
Solo lee assets. Compara, por Pokégod del roster (`content/pokegods_originales.json`):

- **Dimensiones**: Front/Back 96×96, Icons 128×64, Characters 256×256.
- **Paleta**: intersección de histogramas 4×4×4 entre el frame de pie (abajo, celda 0,0) y el frontal ≥ 0,35; distancia de color medio ≤ 90.
- **Área**: el área opaca del overworld, escalada ×(96/64)², debe estar en [0,8 ; 1,25] del área del frontal (el overworld es el frontal reducido).

## Resultado (19 Pokégods)

18/19 coherentes. Una incoherencia real:

| Pokégod | Intersección | Δ color | Área ow/batalla | Estado |
|---|---|---|---|---|
| **ELECTRAMEW** | 0,67 | 17,2 | **2,33** | ✘ El overworld tiene ~2,3× el área opaca del frontal escalado. Front y Characters no provienen del mismo recorte/escala. |
| RATICLAW | 0,60 | 35,5 | 1,17 | ✔ Dentro de umbral, pero vigilar: paleta notablemente distinta. |

Los demás tienen área ratio 0,99–1,01 e intersección ≥ 0,72.

## Pendiente

- **ELECTRAMEW**: decidir cuál arte es canónico (concepto en `reference/pokegods/concept/`, que hoy no tiene ELECTRAMEW) y regenerar Front/Back/Icons/Characters desde ese mismo origen con `tools/generar_assets_pokegods.mjs`. No se ha hecho en esta fase.
- **RATICLAW**: revisar paleta a simple vista antes del siguiente build.
