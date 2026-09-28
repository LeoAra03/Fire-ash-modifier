#!/usr/bin/env python3
"""Chequeo rápido de compatibilidad Kirin/Android para una carpeta de Fire Ash.

Uso:  python tools/kirin_check.py "C:/Juegos/FireAsh"
Sale con código 1 si hay errores.
"""
import os, sys

CORE = ["Game.ini", "Game.exe", "Data/MapInfos.rxdata", "Data/Tilesets.rxdata",
        "Data/System.rxdata", "Data/Scripts.rxdata"]


def main():
    game = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "game")
    print("Chequeo Kirin:", game)
    errors, warns = 0, 0

    def ok(m): print("  [OK]", m)
    def warn(m):
        nonlocal warns; warns += 1; print("  [!]", m)
    def err(m):
        nonlocal errors; errors += 1; print("  [X]", m)

    if not os.path.isdir(game):
        err("la carpeta no existe"); sys.exit(1)
    for f in CORE:
        (ok if os.path.exists(os.path.join(game, f)) else (err if f != "Game.exe" else warn))(f)

    all_files = []
    for root, _d, files in os.walk(game):
        for f in files:
            all_files.append(os.path.relpath(os.path.join(root, f), game))

    enc = [f for f in all_files if f.lower().endswith((".rgssad", ".rgss2a", ".rgss3a"))]
    if enc:
        err(f"{len(enc)} archivo(s) cifrados (.rgssad): Kirin necesita archivos EXTRAÍDOS")
    else:
        ok("sin .rgssad (extraído)")

    audio = [f for f in all_files if f.lower().startswith("audio")]
    mid = [f for f in audio if f.lower().endswith(".mid")]
    ok(f"audio: {len(audio)} archivos")
    if mid:
        warn(f"{len(mid)} MIDIs: en Android pueden no sonar")

    pbs = [f for f in all_files if f.lower().startswith("pbs") and f.lower().endswith(".txt")]
    if pbs:
        ok(f"PBS Essentials: {len(pbs)} archivos")
    else:
        warn("sin carpeta PBS (¿juego incompleto?)")

    saves = [f for f in all_files if os.sep not in f and
             ((f.lower().startswith("save") and f.lower().endswith(".rxdata")) or f.lower() == "game.rxdata")]
    if saves:
        ok(f"partidas protegidas: {', '.join(saves)}")
    else:
        print("  ℹ sin partidas todavía (PokeMod nunca las borra)")

    # Caja: buscar referencias típicas con distinta capitalización
    lowers = {}
    for f in all_files:
        lowers.setdefault(f.lower(), []).append(f)
    dupes = {k: v for k, v in lowers.items() if len(v) > 1}
    if dupes:
        warn(f"{len(dupes)} rutas que solo difieren en mayúsculas (lía a Android)")
    else:
        ok("sin colisiones de mayúsculas")

    print(f"\nResultado: {errors} errores, {warns} avisos")
    print("Consejo: carpeta en ALMACENAMIENTO INTERNO, no microSD.")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
