# FASE 030 — recursos, pantallas, progresión y guardado (IDs 2900–2999)

## Auditoría reproducible

```bash
npm run audit:plan2700:fase030
npm run verify:plan2700:fase030
```

El verificador recorre los recursos del juego, las referencias BGM/BGS/ME/SE de
mapas y eventos, las secciones Ruby, los contratos JSON de regiones, campañas,
diplomas, atavíos, Pokégods y expansión, y el aislamiento de los paquetes de
entrega. También enumera señales de vuelo, movimientos de campo, pesca,
día/noche, clima, cinemáticas, derrota/victoria, tiendas, curación y hub.

## Resultado estático

- 16.964 archivos de `Graphics/` y 4.652 de `Audio/` se enumeran;
- no hay archivos de cero bytes;
- cuatro referencias históricas siguen sin homónimo: `secrettitan`,
  `Thunder8`, `002-Battle02` y `Team Rocket OW`, exactamente las cuatro ya
  trazadas en FASE 024;
- el contrato contiene 7 diplomas, 8 gimnasios Atlas, 5 dimensiones, 19
  Pokégods, 11 atavíos y los destinos/campañas declarados en sus JSON;
- la carpeta de entrega queda separada de partidas/backups y el protocolo de
  recuperación está enlazado.

No se copia una pista por similitud ni se cambia un nombre de audio para hacer
pasar la prueba: la ausencia queda en `content/lote6_fase030_integracion.json`
con su familia y número de referencias.

## Qué no puede certificar el checkout

Las referencias de recursos no prueban que una pista suene, que el bucle no se
corte, que una pantalla quepa en todas las resoluciones, que una animación deje
la pantalla limpia, que el ciclo de clima/tiempo se restaure, que una derrota o
victoria conserve el estado, ni que el guardado sobreviva a cortes, Android o
falta de espacio. Esas comprobaciones están en la cola
`manual_pending`/`pending_human_review`.

El hub tiene un objetivo de 32 estados en el plan, pero el censo de eventos no
se convierte en 32 pruebas de partida. Las 48 medallas, finales, objetos
ocultos, tiendas y economía se deben cubrir con estados inyectados y una
partida real antes de declararlos completos.

Estado: `static_review_manual_pending` por los cuatro audios históricos y por
las pruebas de runtime pendientes.
