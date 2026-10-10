#!/usr/bin/env bash
# Automated Pokémon development toolkit setup.
# Non-fatal and idempotent: failures are logged and the remaining tools continue.

set -u

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TOOLKIT="$ROOT/toolkit"
LOG_DIR="$TOOLKIT/logs"
LOG_FILE="$LOG_DIR/setup.log"
INDEX="$TOOLKIT/TOOLS_INDEX.json"
mkdir -p "$TOOLKIT/editors" "$TOOLKIT/sources" "$TOOLKIT/agents" "$TOOLKIT/assets" "$LOG_DIR"
: > "$LOG_FILE"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"; }
warn() { log "WARN: $*"; }
have() { command -v "$1" >/dev/null 2>&1; }

run_logged() {
  label=$1; shift
  log "$label"
  "$@" >>"$LOG_FILE" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ]; then warn "$label failed with exit code $rc"; fi
  return "$rc"
}

stage() {
  name=$1; category=$2
  src="$ROOT/$name"
  dst="$TOOLKIT/$category/$name"
  if [ -f "$src" ] && [ ! -e "$dst" ]; then
    run_logged "Moving $name to toolkit/$category" mv -- "$src" "$dst" || true
  elif [ -e "$dst" ]; then
    log "Already staged: toolkit/$category/$name"
  fi
}

log 'Staging archives without deleting originals.'
stage 'Tiled-1.12.2_Linux_x86_64.part1.rar' editors
stage 'Tiled-1.12.2_Linux_x86_64.part2.rar' editors
stage 'Tiled-1.12.2_Linux_x86_64.part3.rar' editors
stage 'Tiled-1.12.2_Linux_x86_64.part4.rar' editors
for n in $(seq 1 15); do
  stage "porymap-master.part$(printf '%02d' "$n").rar" editors
  stage "porymap-master.part${n}.rar" editors
 done
stage 'porygion-master.zip' sources
stage 'porygion-master.rar' sources
stage 'pokecrystal-master.zip' sources
stage 'pokered-master.zip' sources
stage 'rvpacker-txt-rs-main.zip' sources
stage 'pokemon-agent-main.zip' agents
stage 'timps-swarm-main.zip' agents
stage 'swablu (3).zip' assets

# Suggested manual packages; sudo is deliberately never invoked automatically.
# Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y unrar p7zip-full unzip build-essential golang rustc cargo qt5-qmake cmake rgbds nodejs npm
# Arch:          sudo pacman -Sy --needed unrar p7zip unzip base-devel go rust qt5-base cmake rgbds nodejs npm
log 'Dependency check:'
for dep in go rustc cargo qmake cmake rgbds make unrar 7z unzip npm python3; do
  if have "$dep"; then log "  OK  $dep ($(command -v "$dep"))"; else warn "  MISSING $dep"; fi
done

extract() {
  archive=$1; destination=$2; marker="$destination/.toolkit-extracted"
  [ -f "$archive" ] || return 0
  [ -f "$marker" ] && { log "Already extracted: $archive"; return 0; }
  mkdir -p "$destination"
  if [[ "$archive" == *.rar ]] && have unrar; then
    run_logged "Extracting $(basename "$archive") with unrar" unrar x -o+ "$archive" "$destination/" || return 0
  elif have 7z; then
    run_logged "Extracting $(basename "$archive") with 7z" 7z x -y "-o$destination" "$archive" || return 0
  elif [[ "$archive" == *.zip ]] && have unzip; then
    run_logged "Extracting $(basename "$archive") with unzip" unzip -oq "$archive" -d "$destination" || return 0
  else
    warn "No extractor available for $archive"
    return 0
  fi
  : > "$marker"
}

join_parts() {
  prefix=$1; destination=$2; output="$destination/${prefix}.full.rar"
  [ -f "$output" ] && { printf '%s\n' "$output"; return 0; }
  list="$destination/.parts.list"
  : > "$list"
  for n in $(seq 1 99); do
    for part in "$destination/${prefix}.part${n}.rar" "$destination/${prefix}.part$(printf '%02d' "$n").rar"; do
      [ -f "$part" ] && printf '%s\n' "$part" >> "$list"
    done
  done
  awk '!seen[$0]++' "$list" > "$list.tmp" && mv "$list.tmp" "$list"
  expected=0
  [ "$prefix" = 'Tiled-1.12.2_Linux_x86_64' ] && expected=4
  [ "$prefix" = 'porymap-master' ] && expected=15
  count=$(wc -l < "$list")
  if [ "$count" -eq 0 ]; then rm -f "$list"; printf '%s\n' ''; return 0; fi
  if [ "$expected" -gt 0 ] && [ "$count" -lt "$expected" ]; then
    warn "$prefix has $count/$expected parts; not joining an incomplete archive"
    rm -f "$list"; printf '%s\n' ''; return 0
  fi
  log "Joining $count parts for $prefix"
  : > "$output"
  while IFS= read -r part; do cat -- "$part" >> "$output" || warn "Could not append $part"; done < "$list"
  rm -f "$list"
  printf '%s\n' "$output"
}

find_dir() {
  base=$1; pattern=$2
  found=$(find "$base" -type f -name "$pattern" -print -quit 2>/dev/null)
  if [ -n "$found" ]; then dirname "$found"; else printf '%s\n' "$base"; fi
}

full=$(join_parts 'Tiled-1.12.2_Linux_x86_64' "$TOOLKIT/editors")
[ -n "$full" ] && extract "$full" "$TOOLKIT/editors/tiled"
full=$(join_parts 'porymap-master' "$TOOLKIT/editors")
[ -n "$full" ] && extract "$full" "$TOOLKIT/editors/porymap"
extract "$TOOLKIT/sources/porygion-master.zip" "$TOOLKIT/sources/porygion"
extract "$TOOLKIT/sources/porygion-master.rar" "$TOOLKIT/sources/porygion"
extract "$TOOLKIT/sources/pokecrystal-master.zip" "$TOOLKIT/sources/pokecrystal"
extract "$TOOLKIT/sources/pokered-master.zip" "$TOOLKIT/sources/pokered"
extract "$TOOLKIT/sources/rvpacker-txt-rs-main.zip" "$TOOLKIT/sources/rvpacker"
extract "$TOOLKIT/agents/pokemon-agent-main.zip" "$TOOLKIT/agents/pokemon-agent"
extract "$TOOLKIT/agents/timps-swarm-main.zip" "$TOOLKIT/agents/timps-swarm"
extract "$TOOLKIT/assets/swablu (3).zip" "$TOOLKIT/assets/swablu"

porygion_dir=$(find_dir "$TOOLKIT/sources/porygion" go.mod)
rvpacker_dir=$(find_dir "$TOOLKIT/sources/rvpacker" Cargo.toml)
pokecrystal_dir=$(find_dir "$TOOLKIT/sources/pokecrystal" Makefile)
pokered_dir=$(find_dir "$TOOLKIT/sources/pokered" Makefile)
porymap_dir=$(find_dir "$TOOLKIT/editors/porymap" CMakeLists.txt)
agent_dir=$(find_dir "$TOOLKIT/agents/pokemon-agent" package.json)

if [ -f "$porygion_dir/go.mod" ] && have go; then (cd "$porygion_dir" && run_logged 'Building Porygion' go build) || true; fi
if [ -f "$rvpacker_dir/Cargo.toml" ] && have cargo; then (cd "$rvpacker_dir" && run_logged 'Building RV Packer' cargo build --release) || true; fi
for project in "$pokecrystal_dir" "$pokered_dir"; do
  if [ -f "$project/Makefile" ] && have make; then
    (cd "$project" && run_logged "Building $(basename "$project")" bash -c 'make clean && make') || true
  fi
done
if [ -f "$porymap_dir/CMakeLists.txt" ] && have cmake; then
  (cd "$porymap_dir" && run_logged 'Configuring PoryMap with CMake' cmake -S . -B build && run_logged 'Building PoryMap with CMake' cmake --build build) || true
else
  porymap_project=$(find "$TOOLKIT/editors/porymap" -type f -name '*.pro' -print -quit 2>/dev/null)
  if [ -n "$porymap_project" ] && have qmake && have make; then
    porymap_dir=$(dirname "$porymap_project")
    (cd "$porymap_dir" && run_logged 'Building PoryMap with qmake' bash -c 'qmake && make') || true
  else
    warn 'PoryMap build skipped: no CMakeLists.txt/.pro or required build tools.'
  fi
fi
if [ -f "$agent_dir/package.json" ] && have npm; then (cd "$agent_dir" && run_logged 'Installing Pokémon Agent dependencies' npm install) || true; fi

find "$TOOLKIT/editors/tiled" -type f -iname '*.AppImage' -exec chmod +x {} \; 2>/dev/null || true

if have python3; then
  ROOT="$ROOT" TOOLKIT="$TOOLKIT" INDEX="$INDEX" python3 - <<'PY'
import json, os
from pathlib import Path
root, toolkit = Path(os.environ['ROOT']), Path(os.environ['TOOLKIT'])
def rel(p):
    try: return './' + str(p.relative_to(root))
    except ValueError: return str(p)
def first(base, names=(), suffix=None):
    if not base.exists(): return ''
    for p in base.rglob('*'):
        if p.is_file() and ((names and p.name in names) or (suffix and p.name.lower().endswith(suffix.lower()))): return rel(p)
    return ''
def entry(name, category, command, purpose, archives, path='', compiled=False, appimage=False):
    cat = toolkit/category
    present = [rel(cat/a) for a in archives if (cat/a).exists()]
    status = ('appimage' if path else ('source_only' if present else 'not_found')) if appimage else (('compiled' if path else ('failed' if present else 'not_found')) if compiled else ('source_only' if present else 'not_found'))
    return {'name':name,'category':category,'command':command,'purpose':purpose,'archives':present,'path':path,'status':status}
records = [
 entry('Tiled','editors','./toolkit/editors/tiled/<Tiled.AppImage>','Editor de mapas',[Path(f'Tiled-1.12.2_Linux_x86_64.part{i}.rar') for i in range(1,5)],first(toolkit/'editors'/'tiled',suffix='.appimage'),appimage=True),
 entry('PoryMap','editors','./toolkit/editors/porymap/<binary>','Editor de mapas Pokémon',[Path(f'porymap-master.part{i:02d}.rar') for i in range(1,16)],first(toolkit/'editors'/'porymap',names=('porymap','PoryMap')),compiled=True),
 entry('Porygion','sources','./toolkit/sources/porygion/<binary>','Herramientas Go',[Path('porygion-master.zip'),Path('porygion-master.rar')],first(toolkit/'sources'/'porygion',names=('porygion',)),compiled=True),
 entry('RV Packer','sources','./toolkit/sources/rvpacker/target/release/<binary>','Empaquetado de textos',[Path('rvpacker-txt-rs-main.zip')],first(toolkit/'sources'/'rvpacker'/'target'/'release',names=('rvpacker','rvpacker-txt')),compiled=True),
 entry('Pokecrystal','sources','cd toolkit/sources/pokecrystal && make','Fuente Pokémon Crystal',[Path('pokecrystal-master.zip')]),
 entry('Pokered','sources','cd toolkit/sources/pokered && make','Fuente Pokémon Red',[Path('pokered-master.zip')]),
 entry('Pokemon Agent','agents','cd toolkit/agents/pokemon-agent && npm start','Agente Node.js',[Path('pokemon-agent-main.zip')],first(toolkit/'agents'/'pokemon-agent',names=('index.js','pokemon-agent'))),
 entry('Timps Swarm','agents','Consultar toolkit/TOOLS_INDEX.json','Agente swarm opcional',[Path('timps-swarm-main.zip')]),
 entry('Swablu','assets','./toolkit/assets/swablu/','Assets',[Path('swablu (3).zip')]),
]
Path(os.environ['INDEX']).write_text(json.dumps({'generated_by':'setup_toolkit.sh','tools':records},ensure_ascii=False,indent=2)+'\n')
PY
else
  warn 'python3 missing; writing minimal valid index.'
  printf '%s\n' '{"generated_by":"setup_toolkit.sh","tools":[]}' > "$INDEX"
fi

log "Complete. Review $LOG_FILE and $INDEX."
exit 0
