#!/usr/bin/env python3
"""Respalda partidas + Data + PBS + Game.ini a un ZIP con fecha. Nunca borra nada.

Uso:
    python tools/backup.py "C:/Juegos/FireAsh"
    python tools/backup.py game --out mis_backups
"""
import argparse, os, zipfile
from datetime import datetime

INCLUDE_DIRS = ("Data", "PBS")
INCLUDE_FILES = ("Game.ini",)


def is_save(base: str) -> bool:
    b = base.lower()
    return (b.startswith("save") and b.endswith(".rxdata")) or b == "game.rxdata" or b.endswith(".sav")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("game_dir", help="carpeta del juego")
    ap.add_argument("--out", default=None, help="carpeta destino (defecto: <juego>/PokeModBackups)")
    args = ap.parse_args()
    game = os.path.abspath(args.game_dir)
    outdir = args.out or os.path.join(game, "PokeModBackups")
    os.makedirs(outdir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = os.path.join(outdir, f"backup_{ts}.zip")
    n = 0
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk(game):
            # no respaldar backups dentro de backups
            if os.path.abspath(root).startswith(os.path.abspath(outdir) + os.sep) and root != game:
                continue
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, game)
                top = rel.split(os.sep)[0]
                if top in INCLUDE_DIRS or (os.sep not in rel and (f in INCLUDE_FILES or is_save(f))):
                    z.write(full, rel)
                    n += 1
    print(f"🧷 {n} archivos → {dest}")


if __name__ == "__main__":
    main()
