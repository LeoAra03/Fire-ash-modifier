#!/usr/bin/env bash
# ============================================================================
# tools/plan900/avance.sh — medidor del registro de avance (FASE 8).
#
# Imprime la medición actual (fecha + hash de HEAD + última fase registrada)
# lista para copiar en tools/plan900/avance.md al abrir o cerrar una fase.
#
# Uso:
#   bash tools/plan900/avance.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."

FECHA=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
HASH=$(git rev-parse HEAD)
CORTO=$(git rev-parse --short HEAD)
ASUNTO=$(git log -1 --format='%s')

echo "Medición de avance del plan 900"
echo "  Fecha:      $FECHA"
echo "  HEAD:       $HASH"
echo "  HEAD corto: $CORTO"
echo "  Asunto:     $ASUNTO"
ULTIMA=$(grep -E '^\| [0-9]+ \|' tools/plan900/avance.md | tail -1 | awk -F'|' '{gsub(/ /,"",$2); print $2}')
echo "  Última fase registrada en avance.md: $ULTIMA"
