#!/usr/bin/env bash
# ============================================================================
# tools/plan900/orden_instalacion.sh
#
# ORDEN DE RECONSTRUCCIÓN OBLIGATORIO del plan 900 (documentado en FASE 7).
#
# Los instaladores se pisan entre sí: SIEMPRE se debe respetar este orden:
#
#   1. multiversal    node tools/apply_expansion_multiversal.mjs
#   2. canon Arceus   node tools/apply_canon_arceus.mjs
#   3. eras           node --max-old-space-size=6144 tools/apply_atlas_eras_map.mjs
#   4. restauración   node tools/apply_restauracion_cromatica.mjs
#   5. dimensiones    node --max-old-space-size=6144 tools/apply_dimensiones_barco.mjs
#   6. rocket         node --max-old-space-size=6144 tools/apply_team_rocket_mision.mjs
#   7. circuito       node --max-old-space-size=6144 tools/apply_atlas_circuito.mjs
#   8. ambience       node tools/apply_dlc_ambience.mjs
#   9. wild           node tools/apply_wild_zones.mjs
#
# Por qué este orden (y no otro):
#
#   · multiversal va PRIMERO porque reescribe puertas y portales que el canon
#     de Arceus debe cerrar después. Si se salta o se invierte,
#     `npm run verify:canon:arceus` se pone en rojo (docs/DLC_TOTAL.md §7).
#   · canon Arceus va SIEMPRE inmediatamente después del multiversal: cierra
#     las puertas que aquél dejó abiertas.
#   · eras, restauración, dimensiones, rocket y circuito crean/retocan mapas
#     nuevos y sus entradas; dependen de que el canon ya haya sellado el
#     acceso (la Vía de las Nueve Eras exige el switch 873 del duelo).
#   · ambience va tras circuito porque pone BGM a los diecisiete mapas nuevos:
#     los mapas (incluidos los ocho gimnasios de Atlas del circuito) deben
#     existir antes de poder sonar. Además sincroniza el catálogo
#     `content/wild_zones.json`.
#   · wild va ÚLTIMO y es dependencia dura de ambience: consume el catálogo
#     `content/wild_zones.json` que ambience acaba de sincronizar y escribe
#     las tablas de encuentros en `encounters.dat`.
#
# Todo es aditivo (regla de oro, docs/ESTADO_CONGELADO.md): ningún mapa,
# evento, switch o diálogo original de Fire Ash se edita.
#
# Uso:
#   bash tools/plan900/orden_instalacion.sh            # solo imprime el orden
#   bash tools/plan900/orden_instalacion.sh --plan     # ídem (explícito)
#   bash tools/plan900/orden_instalacion.sh --verify   # ejecuta los 9 verificadores
#   bash tools/plan900/orden_instalacion.sh --apply    # ejecuta los 9 instaladores
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."

MODE="plan"
for arg in "$@"; do
  case "$arg" in
    --plan)   MODE="plan" ;;
    --verify) MODE="verify" ;;
    --apply)  MODE="apply" ;;
    *) printf 'Uso: %s [--plan|--verify|--apply]\n' "$0" >&2; exit 2 ;;
  esac
done

# Paso | Etapa | Instalador | Verificador | Script npm equivalente
STEPS=(
  "1|multiversal|node tools/apply_expansion_multiversal.mjs|npm run expansion|npm run verify:expansion"
  "2|canon Arceus|node tools/apply_canon_arceus.mjs|npm run canon:arceus|npm run verify:canon:arceus"
  "3|eras|node --max-old-space-size=6144 tools/apply_atlas_eras_map.mjs|npm run build:eras|npm run verify:eras"
  "4|restauración|node tools/apply_restauracion_cromatica.mjs|npm run build:restauracion|npm run verify:restauracion"
  "5|dimensiones|node --max-old-space-size=6144 tools/apply_dimensiones_barco.mjs|npm run build:dimensiones|npm run verify:dimensiones"
  "6|rocket|node --max-old-space-size=6144 tools/apply_team_rocket_mision.mjs|npm run build:rocket|npm run verify:rocket"
  "7|circuito|node --max-old-space-size=6144 tools/apply_atlas_circuito.mjs|npm run build:circuito|npm run verify:circuito"
  "8|ambience|node tools/apply_dlc_ambience.mjs|npm run build:ambience|npm run verify:ambience"
  "9|wild|node tools/apply_wild_zones.mjs|npm run build:wild|npm run verify:wild"
)

print_plan() {
  printf 'Orden de reconstrucción obligatorio (multiversal → canon Arceus → eras → restauración → dimensiones → rocket → circuito → ambience → wild):\n\n'
  for step in "${STEPS[@]}"; do
    IFS='|' read -r n etiqueta instalar _npm_apply _npm_verify <<<"$step"
    printf '  %s. %-13s %s\n' "$n" "$etiqueta" "$instalar"
  done
  printf '\nEquivalentes npm: expansion, canon:arceus, build:eras, build:restauracion,\n'
  printf 'build:dimensiones, build:rocket, build:circuito, build:ambience, build:wild.\n'
  printf '\n--verify ejecuta los 9 verificadores en este mismo orden; --apply instala.\n'
  printf 'Precaución: --apply reescribe Data/ (con backups en PokeModBackups/).\n'
}

run_verify() {
  printf 'Verificando el orden obligatorio (9 pasos, solo lectura):\n\n'
  for step in "${STEPS[@]}"; do
    IFS='|' read -r n etiqueta _instalar _npm_apply npm_verify <<<"$step"
    printf '==> [%s/9] %s — %s\n' "$n" "$etiqueta" "$npm_verify"
    $npm_verify
    printf '    OK\n\n'
  done
  printf '✔ Los 9 verificadores del orden obligatorio están en verde.\n'
}

run_apply() {
  printf 'ATENCIÓN: esto instala/reconstruye el plan 900 sobre pokemon_fire_ash/Data/.\n'
  printf 'Se respaldará en PokeModBackups/ (FASE 5). Interrumpir a mitad deja pasos\n'
  printf 'posteriores sin aplicar: reejecutar --apply reinstala todo en orden.\n\n'
  for step in "${STEPS[@]}"; do
    IFS='|' read -r n etiqueta instalar _npm_apply _npm_verify <<<"$step"
    printf '==> [%s/9] %s — %s\n' "$n" "$etiqueta" "$instalar"
    $instalar
    printf '    instalado OK\n\n'
  done
  printf '✔ Plan 900 reconstruido en el orden obligatorio.\n'
  printf '  Ejecutar ahora: bash tools/plan900/orden_instalacion.sh --verify\n'
}

case "$MODE" in
  plan)   print_plan ;;
  verify) run_verify ;;
  apply)  run_apply ;;
esac
