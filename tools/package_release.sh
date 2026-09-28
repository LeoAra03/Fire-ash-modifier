#!/usr/bin/env bash
# Empaqueta la carpeta del juego lista para jugar (sin backups de desarrollo).
# Uso: bash tools/package_release.sh [destino.zip]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-Pokemon-Fire-Ash-Multiverso.zip}"
rm -f "$OUT"
zip -r -q "$OUT" pokemon_fire_ash \
  -x "pokemon_fire_ash/PokeModBackups/*" \
  -x "pokemon_fire_ash/Save*" \
  -x "pokemon_fire_ash/Game.rxdata"
echo "Listo: $OUT ($(du -h "$OUT" | cut -f1))"
