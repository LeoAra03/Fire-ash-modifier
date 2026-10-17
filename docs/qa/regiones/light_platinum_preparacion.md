# Preparación QA — Light Platinum (FASE 012)

La tanda 012 deja auditado el punto de partida de Light Platinum antes del
bloque de escritura 1200–1260:

- **19 mapas**, Map3120–Map3138.
- **54 NPC de plano**, 53 warps y cuatro entrenadores de campaña; los mapas
  instalados contienen 175 eventos estructurales y máximo 19 eventos por mapa.
- Ocho líderes ya cableados en 3124, 3126, 3128, 3130, 3132, 3134, 3136 y
  3138; el catálogo usa switches 708–715.
- Diez zonas de encuentros y 61 slots, niveles 6–60, con especies existentes.
- Contrato visual declarado en `content/rom_campaigns_complete.json`:
  **costas luminosas, rutas largas y plazas de una liga viajera**.
- Entrada y salida: lobby 2210, bloqueada por la misma Ruta de Dios que Glazed;
  la llegada de Map3120 conserva su escena/eventos propios.

La medición completa está en `content/plan2700_light_platinum_audit.json` y se
repite con:

```text
npm run audit:light_platinum:region
npm run verify:light_platinum
npm run verify:lideres
```

El acta de cierre de la región, sus nueve rutas, dos cuevas, ocho gimnasios y
la comprobación del switch 991 quedan para la FASE 013. La auditoría no
presenta este inventario como recorrido humano.
