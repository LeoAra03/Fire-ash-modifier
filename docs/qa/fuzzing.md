# Modelo adversario y pruebas de corte

## Invariantes intocables

Toda mutación debe preservar estas reglas:

1. una partida válida sigue siendo recuperable;
2. nunca se escribe sobre la partida real;
3. los archivos temporales quedan dentro del sandbox y se renombran
   atómicamente;
4. una excepción devuelve el control y conserva mapa/evento/comando;
5. dinero, niveles, inventario, equipo y caja no desbordan sus rangos;
6. un recurso o destino inválido se rechaza o usa un fallback documentado, nunca
   un `nil` silencioso;
7. repetir la misma semilla da el mismo resultado.

## Ejecución

```bash
npm run audit:plan2700:fase031
npm run verify:plan2700:fase031
```

El modelo usa `seed = índice + 1`, guarda fallos con semilla exacta y clasifica
`game`, `mutator` o `acceptable`. Ejecuta 20.000 mutaciones de eventos y 50.000
de celdas en memoria aislada. El resultado versionado es
`content/lote6_fase031_adversario.json`.

Mutaciones incluidas: tabla de tiles, warp a sólido/fuera de rango, recurso
visual, música, nombre de entrenador, truncado de mapa, evento duplicado,
evento referenciado ausente, switch inexistente y variable imposible. El
verificador de Node confirma que las 70.000 corridas no rompen el contrato;
repetirlas con Game.exe y Android es todavía `runtime_pending`.

## Límites y cortes

La matriz cubre mochila/caja/equipo llenos, dinero máximo, 999 objetos, nivel
máximo, nombres vacío/largo/especial, cero Pokémon sanos y derrota. También
simula guardar, transferencia, cinemática, combate, pérdida de energía, disco
lleno, tarjeta retirada, corrupción, versión anterior y versión futura.

La simulación garantiza el protocolo (copia anterior, checksum, rechazo seguro,
restauración de control/tono), no demuestra la conducta de un sistema de
archivos o dispositivo real. Para cerrar se necesita repetir cada caso sobre
una copia, registrar el mensaje visible y comprobar que el guardado anterior
no desaparece.

## Interferencias

Se conserva una fila para menú durante cinemática/combate, movimiento de campo
sobre warp, eventos paralelos, bicicleta, surf en borde, teletransporte a DLC,
cambio de atavío durante misión, disfraz Rocket, Liga con sellos incompletos y
barco antes del postgame. Todas exigen una partida humana; ninguna se declara
jugada por la matriz estática.
