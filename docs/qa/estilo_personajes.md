# Estilo técnico de personajes nuevos — FASE 020

## Contrato

- **Overworld humano:** hoja PNG de 4×4, con cuatro direcciones y tres pasos
  por dirección; el tamaño se conserva en la convención del charset del
  motor. Las hojas especiales de 96 px por celda se declaran explícitamente,
  no se escalan por accidente.
- **Trainer:** frente de 128×128 cuando el tipo de trainer lo exige.
- **Battler:** front/back de 96×96; icono en la dimensión declarada por el
  catálogo de especies.
- **Paleta:** contorno legible sobre los fondos del juego, sin fondo blanco
  accidental; no se copian personajes, diálogos o sprites de ROMs invitadas.
- **Nombre:** mayúsculas y prefijos de bloque (`DN_`, `ATLAS_`, etc.) solo cuando
  el recurso es realmente de ese bloque; no se pisa un archivo original.

## Flujo de aprobación

1. Registrar archivo, hash, tamaño, fase y referencia en
   `content/plan2700_arte.json`.
2. Comprobar dimensiones y cuatro direcciones con el visor/partida.
3. Comparar frente y overworld cuando representan al mismo personaje.
4. Revisar en Game.exe/Kirin y solo entonces cambiar el `character_name` del
   mapa.

La corrida actual encuentra 16957 PNG, 0 referencias de character ausentes
(aparte de los sentinelas virtuales como `invisible`) y 265 candidatos
reutilizados/genéricos que requieren priorización artística. Los candidatos
no se presentan como sprites faltantes automáticamente: un recurso frecuente
puede ser una convención legítima del juego.
