#!/usr/bin/env python3
"""Descarga Pokémon Fire Ash 3.7.1, verifica integridad, extrae y aplica parche.

Solo usa la biblioteca estándar. Tus partidas existentes se respaldan primero
y jamás se sobrescriben.

Ejemplos:
    python tools/download_game.py --full            # juego completo + parche
    python tools/download_game.py --audioless       # sin audio (rápido)
    python tools/download_game.py --audioless --audio  # sin audio + audio aparte
    python tools/download_game.py --full --dir "C:/Juegos/FireAsh"
"""
import argparse, hashlib, os, shutil, sys, time, urllib.request, zipfile
from datetime import datetime

BASE = "https://archive.org/download/pfa_20260926"
FILES = {
    "full": ("Pokemon%20Fire%20Ash%203.7.zip", 546180962, "4230d831424e58191326f1b97078bd70befb79be"),
    "patch": ("3.7.1%20Patch.zip", 1143066, "3b294bc3d904a664d625728d8e439c29fedd4ee5"),
    "audioless": ("Pokemon%20Fire%20Ash%203.7%20(Audioless).zip", 95895197, "f66cf45d8eaca3b25b1d09a7594228dd32f455e8"),
    "audio": ("Pokemon%20Fire%20Ash%203.7%20Audio.zip", 450683558, "9c072c5e11a0b2d769c9d8814ef26a417c12062a"),
}
SAVE_NAMES = ("save", "game.rxdata")  # prefijos protegidos (minúsculas)


def is_save(name: str) -> bool:
    base = os.path.basename(name).lower()
    return base.startswith("save") and base.endswith(".rxdata") or base == "game.rxdata" or base.endswith(".sav")


def download(url: str, dest: str, expect_size: int):
    print(f">> {url}\n   → {dest} ({expect_size/1e6:.0f} MB)")
    req = urllib.request.Request(url, headers={"User-Agent": "PokeModStudio/1.0"})
    have = os.path.getsize(dest) if os.path.exists(dest) else 0
    if have and have < expect_size:  # reanudar
        req.add_header("Range", f"bytes={have}-")
        print(f"   …reanudo desde {have/1e6:.1f} MB")
    elif have == expect_size:
        print("   [OK] ya descargado")
        return
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "ab" if have else "wb") as f:
        total = have + int(r.headers.get("Content-Length", 0) or 0)
        done = have
        t0 = time.time()
        while True:
            chunk = r.read(1024 * 256)
            if not chunk:
                break
            f.write(chunk)
            done += len(chunk)
            el = max(time.time() - t0, 0.01)
            print(f"\r   {done/1e6:.1f}/{total/1e6:.1f} MB · {done/el/1e6:.1f} MB/s", end="", flush=True)
    print("\n   [OK] descarga completa")


def sha1_of(path: str) -> str:
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def backup_saves(game_dir: str):
    saves = [f for f in os.listdir(game_dir) if is_save(f)] if os.path.isdir(game_dir) else []
    if not saves:
        return
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = os.path.join(game_dir, "PokeModBackups", f"pc_{ts}")
    os.makedirs(dest, exist_ok=True)
    for s in saves:
        shutil.copy2(os.path.join(game_dir, s), os.path.join(dest, s))
    print(f"Partidas respaldadas en {dest}: {', '.join(saves)}")


def extract(zip_path: str, game_dir: str):
    print(f"Extrayendo {os.path.basename(zip_path)} → {game_dir}")
    with zipfile.ZipFile(zip_path) as z:
        members = [m for m in z.infolist() if not m.is_dir()]
        # Si el ZIP trae una sola carpeta raíz, extraer su CONTENIDO (evita doble carpeta).
        roots = {m.filename.split("/")[0] for m in members if "/" in m.filename}
        strip = ""
        if len(roots) == 1:
            only = next(iter(roots))
            if all(m.filename.startswith(only + "/") for m in members):
                strip = only + "/"
        n = 0
        for m in members:
            rel = m.filename[len(strip):] if strip else m.filename
            if not rel:
                continue
            target = os.path.join(game_dir, *rel.split("/"))
            if is_save(rel) and os.path.exists(target):
                print(f"   ⏭ partida existente protegida: {rel}")
                continue
            os.makedirs(os.path.dirname(target) or game_dir, exist_ok=True)
            with z.open(m) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            n += 1
            if n % 2000 == 0:
                print(f"   …{n}/{len(members)}", flush=True)
    print(f"   [OK] {n} archivos")


def main():
    ap = argparse.ArgumentParser(description="Descargador de Fire Ash para PokeMod Studio")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--full", action="store_true", help="juego completo 3.7 + parche 3.7.1")
    g.add_argument("--audioless", action="store_true", help="juego sin audio (+parche)")
    ap.add_argument("--audio", action="store_true", help="además descargar el pack de audio")
    ap.add_argument("--dir", default="game", help="carpeta destino (defecto: ./game)")
    ap.add_argument("--keep-zip", action="store_true", help="no borrar los ZIP tras extraer")
    args = ap.parse_args()

    os.makedirs("downloads", exist_ok=True)
    os.makedirs(args.dir, exist_ok=True)
    backup_saves(args.dir)

    want = ["full", "patch"] if args.full else ["audioless"]
    if args.audio:
        want.append("audio")
    if not args.full and not args.audioless:
        want.append("patch")

    for key in want:
        fname_enc, size, sha1 = FILES[key]
        url = f"{BASE}/{fname_enc}"
        dest = os.path.join("downloads", urllib.request.unquote(fname_enc))
        download(url, dest, size)
        print("Verificando SHA-1…", end=" ", flush=True)
        got = sha1_of(dest)
        if got != sha1:
            print(f"\n[X] CORRUPTO: esperaba {sha1}, llegó {got}\nBorra {dest} y reintenta.")
            sys.exit(2)
        print("[OK]")
        extract(dest, args.dir)
        if not args.keep_zip:
            os.remove(dest)

    print("\nListo [OK]. Carpeta:", os.path.abspath(args.dir))
    print("   En Android: copia esa carpeta al almacenamiento interno y ábrela con Kirin (o edítala con la APK PokeMod).")
    print("   Tus partidas (si había) siguen intactas.")


if __name__ == "__main__":
    main()
