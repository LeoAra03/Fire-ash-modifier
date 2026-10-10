#!/usr/bin/env bash
# Automated Pokémon development toolkit setup.
# This script is intentionally non-fatal: one unavailable archive, dependency,
# or compiler must not prevent the remaining tools from being prepared.

set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT="$SCRIPT_DIR"
TOOLKIT="$ROOT/toolkit"
LOG_DIR="$TOOLKIT/logs"
LOG_FILE="$LOG_DIR/setup.log"
INDEX="$TOOLKIT/TOOLS_INDEX.json"
mkdir -p "$TOOLKIT/editors" "$TOOLKIT/sources" "$TOOLKIT/agents" "$TOOLKIT/assets" "$LOG_DIR"
: > "$LOG_FILE"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"
}
warn() { log "WARN: $*"; }

run_step() {
  label=$1
  shift
  log "$label"
  "$@" >>"$LOG_FILE" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ]; then
    warn "$label failed with exit code $rc; continuing."
  fi
  return 0
}

have() { command -v "$1" >/dev/null 2>&1; }

# Archives are moved, never deleted. Existing destination files are preserved.
move_archive() {
  name=$1
  category=$2
  src="$ROOT/$name"
  dst="$TOOLKIT/$category/$name"
  if [ -f "$src" ]; then
    if [ -e "$dst" ]; then
      log "Archive already staged: $dst"
    else
      run_step "Moving $name to toolkit/$category" mv -- "$src" "$dst"
    fi
  fi
}

log "Staging original archives under toolkit/"
move_archive 'Tiled-1.12.2_Linux_x86_64.part1.rar' editors
move_archive 'Tiled-1.12.2_Linux_x86_64.part2.rar' editors
move_archive 'Tiled-1.12.2_Linux_x86_64.part3.rar' editors
move_archive 'Tiled-1.12.2_Linux_x86_64.part4.rar' editors
for n in $(seq 1 15); do
  part=$(printf '%02d' "$n")
  move_archive "porymap-master.part${part}.rar" editors
  move_archive "porymap-master.part${n}.rar" editors
 done
move_archive 'porygion-master.zip' sources
move_archive 'porygion-master.rar' sources
move_archive 'pokecrystal-master.zip' sources
move_archive 'pokered-master.zip' sources
move_archive 'rvpacker-txt-rs-main.zip' sources
move_archive 'pokemon-agent-main.zip' agents
move_archive 'timps-swarm-main.zip' agents
move_archive 'swablu (3).zip' assets

# Ubuntu/Debian (manual, because CI/Arena environments may not have sudo):
# sudo apt-get update && sudo apt-get install -y unrar p7zip-full unzip build-essential golang rustc cargo qt5-qmake cmake rgbds nodejs npm
# Arch Linux (manual):
# sudo pacman -Sy --needed unrar p7zip unzip base-devel go rust qt5-base cmake rgbds nodejs npm

extract_archive() {
  archive=$1
  destination=$2
  marker="$destination/.toolkit-extracted"
  [ -f "$archive" ] || return 0
  if [ -f "$marker" ]; then
    log "Already extracted: $archive"
    return 0
  fi
  mkdir -p "$destination"
  if have unrar && [[ "$archive" == *.rar ]]; then
    run_step "Extracting $(basename "$archive") with unrar" unrar x -o+ "$archive" "$destination/"
  elif have 7z; then
    run_step "Extracting $(basename "$archive") with 7z" 7z x -y "-o$destination" "$archive"
  elif [[ "$archive" == *.zip ]] && have unzip; then
    run_step "Extracting $(basename "$archive") with unzip" unzip -oq "$archive" -d "$destination"
  else
    warn "No extractor available for $archive (install unrar, 7z, or unzip)."
    return 0
  fi
  # A marker makes repeated executions cheap; failed extraction can be retried
  # by deleting this marker.
  : > "$marker"
}

join_parts() {
  prefix=$1
  destination=$2
  output="$destination/${prefix}.full.rar"
  [ -f "$output" ] && { printf '%s\n' "$output"; return 0; }
  parts=""
  for n in $(seq 1 99); do
    p1="$destination/${prefix}.part${n}.rar"
    p2="$destination/${prefix}.part$(printf '%02d' "$n").rar"
    if [ -f "$p1" ]; then parts="$parts\n$p1"; fi
    if [ "$p2" != "$p1" ] && [ -f "$p2" ]; then parts="$parts\n$p2"; fi
  done
  if [ -z "$parts" ]; then
    printf '%s\n' ""
    return 0
  fi
  # Sort by the numeric suffix and avoid duplicate part01/part1 entries.
  list_file="$destination/.parts.list"
  printf '%b\n' "$parts" | awk 'NF && !seen[$0]++' | awk '{ match($0, /part[0-9]+/); print substr($0, RSTART, RLENGTH) "\t" $0 }' | sort -V | cut -f2- > "$list_file"
  count=$(wc -l < "$list_file")
  if [ "$count" -gt 0 ]; then
    log "Joining $count parts for $prefix"
    : > "$output"
    while IFS= read -r part; do cat -- "$part" >> "$output" || warn "Could not join $part"; done < "$list_file"
  fi
  rm -f "$list_file"
  printf '%s\n' "$output"
}

find_dir_with() {
  base=$1
  filename=$2
  find "$base" -type f -name "$filename" -print -quit 2>/dev/null | sed 's#/[^/]*$##'
}

# Join and extract multipart RARs.
tiled_full=$(join_parts 'Tiled-1.12.2_Linux_x86_64' "$TOOLKIT/editors")
[ -n "$tiled_full" ] && extract_archive "$tiled_full" "$TOOLKIT/editors/tiled"
porymap_full=$(join_parts 'porymap-master' "$TOOLKIT/editors")
[ -n "$porymap_full" ] && extract_archive "$porymap_full" "$TOOLKIT/editors/porymap"

# Extract regular archives. The destination names are stable even when the
# archive itself contains a different top-level directory.
extract_archive "$TOOLKIT/sources/porygion-master.zip" "$TOOLKIT/sources/porygion"
extract_archive "$TOOLKIT/sources/porygion-master.rar" "$TOOLKIT/sources/porygion"
extract_archive "$TOOLKIT/sources/pokecrystal-master.zip" "$TOOLKIT/sources/pokecrystal"
extract_archive "$TOOLKIT/sources/pokered-master.zip" "$TOOLKIT/sources/pokered"
extract_archive "$TOOLKIT/sources/rvpacker-txt-rs-main.zip" "$TOOLKIT/sources/rvpacker"
extract_archive "$TOOLKIT/agents/pokemon-agent-main.zip" "$TOOLKIT/agents/pokemon-agent"
extract_archive "$TOOLKIT/agents/timps-swarm-main.zip" "$TOOLKIT/agents/timps-swarm"
extract_archive "$TOOLKIT/assets/swablu (3).zip" "$TOOLKIT/assets/swablu"

# Resolve the actual source directory, including archives with one nested root.
source_dir() {
  base=$1
  marker=$2
  found=$(find_dir_with "$base" "$marker")
  if [ -n "$found" ]; then printf '%s\n' "$found"; else printf '%s\n' "$base"; fi
}

porygion_dir=$(source_dir "$TOOLKIT/sources/porygion" go.mod)
rvpacker_dir=$(source_dir "$TOOLKIT/sources/rvpacker" Cargo.toml)
pokecrystal_dir=$(source_dir "$TOOLKIT/sources/pokecrystal" Makefile)
pokered_dir=$(source_dir "$TOOLKIT/sources/pokered" Makefile)
porymap_dir=$(source_dir "$TOOLKIT/editors/porymap" CMakeLists.txt)
[ "$porymap_dir" = "$TOOLKIT/editors/porymap" ] && porymap_dir=$(source_dir "$TOOLKIT/editors/porymap" '*.pro')
agent_dir=$(source_dir "$TOOLKIT/agents/pokemon-agent" package.json)

if [ -f "$porygion_dir/go.mod" ] && have go; then
  (cd "$porygion_dir" && run_step 'Building Porygion' go build)
fi
if [ -f "$rvpacker_dir/Cargo.toml" ] && have cargo; then
  (cd "$rvpacker_dir" && run_step 'Building RV Packer' cargo build --release)
fi
for project in "$pokecrystal_dir" "$pokered_dir"; do
  if [ -f "$project/Makefile" ] && have make; then
    (cd "$project" && run_step "Building $(basename "$project")" bash -c 'make clean && make')
  fi
done
if [ -f "$porymap_dir/CMakeLists.txt" ] && have cmake; then
  (cd "$porymap_dir" && mkdir -p build && run_step 'Configuring PoryMap with CMake' cmake -S . -B build && run_step 'Building PoryMap with CMake' cmake --build build)
elif [ -f "$porymap_dir/porymap.pro" ] && have qmake && have make; then
  (cd "$porymap_dir" && run_step 'Building PoryMap with qmake' bash -c 'qmake && make')
else
  warn 'PoryMap build skipped: no supported project file or qmake/cmake unavailable.'
fi
if [ -f "$agent_dir/package.json" ] && have npm; then
  (cd "$agent_dir" && run_step 'Installing Pokémon Agent dependencies' npm install)
fi

# Make Tiled AppImages executable.
while IFS= read -r appimage; do
  [ -n "$appimage" ] || continue
  run_step "Making Tiled executable: $appimage" chmod +x "$appimage"
done < <(find "$TOOLKIT/editors/tiled" -type f -iname '*.AppImage' 2>/dev/null)

# Convert an absolute path into a repository-relative path for the index.
relative_path() {
  path=$1
  case "$path" in
    "$ROOT"/*) printf './%s\n' "${path#"$ROOT"/}" ;;
    *) printf '%s\n' "$path" ;;
  esac
}

find_binary() {
  base=$1
  shift
  for candidate in "$@"; do
    found=$(find "$base" -type f -name "$candidate" -print -quit 2>/dev/null)
    [ -n "$found" ] && { relative_path "$found"; return 0; }
  done
  printf '%s\n' ''
}

# Generate valid JSON using Python when available. The fallback is valid JSON
# with conservative source_only/not_found statuses.
if have python3; then
  export ROOT TOOLKIT INDEX LOG_FILE
  python3 - <<'PY'
import json, os
from pathlib import Path
root = Path(os.environ['ROOT'])
toolkit = root / 'toolkit'

def rel(p):
    try: return './' + str(p.relative_to(root))
    except ValueError: return str(p)

def first_file(base, names=(), suffix=None):
    if not base.exists(): return ''
    for p in base.rglob('*'):
        if p.is_file() and ((names and p.name in names) or (suffix and p.name.lower().endswith(suffix.lower()))):
            return rel(p)
    return ''

def has(base, name): return any(base.rglob(name)) if base.exists() else False

def entry(name, category, command, purpose, archive_names, binary='', compiled=False, appimage=False):
    category_path = toolkit / category
    archives = [rel(category_path / n) for n in archive_names if (category_path / n).exists()]
    if appimage:
        status = 'appimage' if binary else ('source_only' if archives else 'not_found')
    elif compiled:
        status = 'compiled' if binary else ('failed' if archives else 'not_found')
    else:
        status = 'source_only' if (archives or category_path.exists()) else 'not_found'
    return {'name': name, 'category': category, 'command': command, 'purpose': purpose,
            'archives': archives, 'path': binary, 'status': status}

tiled = first_file(toolkit/'editors'/'tiled', suffix='.appimage')
porymap = first_file(toolkit/'editors'/'porymap', names=('porymap','PoryMap'))
porygion = first_file(toolkit/'sources'/'porygion', names=('porygion',))
rvpacker = first_file(toolkit/'sources'/'rvpacker'/'target'/'release', names=('rvpacker','rvpacker-txt'))
pokecrystal = first_file(toolkit/'sources'/'pokecrystal', suffix='.gbc')
pokered = first_file(toolkit/'sources'/'pokered', suffix='.gb')
agent = first_file(toolkit/'agents'/'pokemon-agent', names=('pokemon-agent','index.js'))
records = [
 entry('Tiled','editors','./toolkit/editors/tiled/<Tiled.AppImage>','Editor de mapas', [f'Tiled-1.12.2_Linux_x86_64.part{i}.rar' for i in range(1,5)], tiled, appimage=True),
 entry('PoryMap','editors','./toolkit/editors/porymap/<binary>','Editor de mapas de Pokémon', [f'porymap-master.part{i:02d}.rar' for i in range(1,16)], porymap, compiled=True),
 entry('Porygion','sources','./toolkit/sources/porygion/<binary>','Herramientas basadas en Go', ['porygion-master.zip','porygion-master.rar'], porygion, compiled=True),
 entry('RV Packer','sources','./toolkit/sources/rvpacker/target/release/<binary>','Empaquetado/desempaquetado de textos', ['rvpacker-txt-rs-main.zip'], rvpacker, compiled=True),
 entry('Pokecrystal','sources','./toolkit/sources/pokecrystal/<output>.gbc','Fuente de Pokémon Crystal', ['pokecrystal-master.zip'], pokecrystal),
 entry('Pokered','sources','./toolkit/sources/pokered/<output>.gb','Fuente de Pokémon Red', ['pokered-master.zip'], pokered),
 entry('Pokemon Agent','agents','cd toolkit/agents/pokemon-agent && npm start','Agente/automatización Pokémon', ['pokemon-agent-main.zip'], agent),
 entry('Timps Swarm','agents','./toolkit/agents/timps-swarm/<entrypoint>','Agente swarm opcional', ['timps-swarm-main.zip']),
 entry('Swablu','assets','./toolkit/assets/swablu/','Assets y recursos', ['swablu (3).zip']),
]
(toolkit/'TOOLS_INDEX.json').write_text(json.dumps({'generated_by':'setup_toolkit.sh','tools':records}, indent=2, ensure_ascii=False)+'\n')
PY
else
  warn 'python3 is unavailable; writing a conservative fallback index.'
  cat > "$INDEX" <<'JSON'
{"generated_by":"setup_toolkit.sh","tools":[]}
JSON
fi

chmod +x "$ROOT/setup_toolkit.sh" 2>/dev/null || true
log "Toolkit setup complete. Review $LOG_FILE and $INDEX."
exit 0
