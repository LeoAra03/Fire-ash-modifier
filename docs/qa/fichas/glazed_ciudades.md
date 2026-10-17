# Fichas visuales — ciudades principales de Glazed

Estas fichas se basan en el plano y en los `Map*.rxdata` instalados, no en los
nombres de la ROM invitada. El contrato visual de Glazed es **escarcha, lagos y
ciudades que recuerdan dos líneas temporales**; los mapas usan tiles propios de
Fire Ash y BGM existente.

| Ciudad / núcleo | Mapas observados | Función narrativa | Señales instaladas |
|---|---:|---|---|
| Pueblo Glenwood / Chocovine | 3000, 3002, 3005, 3008 | llegada, santuario del molino y primera bifurcación | laboratorio, santuario, bosque y gimnasio Sparkfly |
| Ciudad Oceanview | 3012–3021 | puerto, faro y conflicto energético | muelle, central, laboratorio marítimo y gimnasio |
| Isla Serenidad | 3026–3033 | memoria costera y elección de retorno | balneario, faro, gruta, jardín y gimnasio |
| Ciudad Espoir / Cabo Azure | 3039–3047 | costa de transición y academia | acuario, gruta, mirador y conexiones por tierra/agua |

Stormy y Darkwood son núcleos posteriores del ascenso de Mt. Stratus; no se
fusionan con las cuatro fichas principales porque su función es de montaña y
bosque, no de ciudad costera. El plano registra 111 mapas en seis capítulos;
el auditor `content/plan2700_glazed_audit.json` mide eventos, warps, BGM,
tileset y límites por mapa.

## Criterios de revisión

- centro/edificio singular, comercio y curación se deben revisar dentro de
  Game.exe; la auditoría estática sólo certifica que los mapas, eventos y
  retornos existen.
- no se reutilizan mapas, textos ni audio de la ROM: la política de
  `content/rom_campaigns_complete.json` exige adaptación estructural con
  recursos originales de Fire Ash.
- el arte final queda clasificado como `customized-needs-game-preview`; esta
  ficha no sustituye una prueba de cámara, clipping o ritmo.
