# Auditoría de recursos y familias de gameplay

## Contrato de recursos

Una referencia se considera resuelta solo si el nombre exacto, incluyendo
mayúsculas, existe en su carpeta (`Characters`, `Pokemon`, `Trainers`,
`Battlebacks`, `Animations`, `Icons`, `Pictures`, `Transitions`, `Weather`,
`Audio/BGM`, `Audio/BGS`, `Audio/ME` o `Audio/SE`). Un fallback es válido solo
si está declarado en el plan y se puede explicar en la escena. El auditor de
FASE 030 rechaza cero bytes y conserva los cuatro nombres históricos sin
archivo.

```bash
npm run verify:plan2700:fase030
npm run verify:plan2700:arte  # si se necesita el censo general de arte
npm run verify:salud
```

## Familias jugables

| Familia | Señal automática | Prueba que falta |
|---|---|---|
| vuelo/teletransporte | helpers y destinos en Ruby | cada destino visitado y celda transitable |
| corte, surf, fuerza, destello y demás | helpers de movimiento | medallas/flags declarados, borde de mapa y warp |
| pesca | tablas y helpers | agua correcta, tabla correcta, cancelación |
| día/noche | reloj y cambios de tono | interior/dimensión sin ciclo indebido |
| clima | llamadas de clima | restauración al salir/derrota |
| cinemáticas | tono, flash, shake y escenas | control y tono restaurados, no doble disparo |
| victoria/derrota | eventos de batalla y `canLose` | recompensa después del diálogo, derrota sin pérdida |
| economía | tiendas, objetos y curación | máximo de dinero, mochila llena, misión sin bloqueo |
| guardado | rutas y protocolo de recuperación | corte, corrupción, actualización, PC/Android |

## Progresión

Los contratos publicados son fuentes declarativas, no una prueba de alcance:

- Atlas: 8 gimnasios y 8 medallas;
- campañas/dimensiones: se leen desde `dimensiones_barco.json` y
  `rom_campaigns_complete.json`;
- salón: 7 diplomas con condición individual;
- atavíos: 11 entradas y variables 316/317;
- Pokégods: roster y tres formas con requisitos de captura/huida;
- hub: el objetivo de 32 estados y sus 21 eventos actuales se comparan, pero
  las transiciones se deben inyectar y jugar;
- medallas extra y finales: probar cada condición, recompensa, revancha y
  registro después de guardar/cargar.

La guía de pruebas debe crear una copia del guardado para cada límite. Nunca se
usa ni se sobrescribe la partida real del jugador.
