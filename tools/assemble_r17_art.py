#!/usr/bin/env python3
"""Ensambla el arte R17 (assets_raw/) en los gráficos del juego.

Entrada:  assets_raw/*.png  (generados con IA, un asset por archivo)
Salida:   pokemon_fire_ash/Graphics/...

- Arceus fases 1-5  -> Pokemon/Front/ARCEUS_F1..F5.png (96x96)
  (la fase 6 usa la forma primigenia: Pokemon/Front/ARCEUS.png, ya existente)
- Fondos de batalla -> Battlebacks/genesis{1,2,3}_bg.png (512x288, reemplaza
  el arte de nuestro DLC) y olas_bg / volus_bg (nuevos) con sus bases.
- Ash Maestro       -> Characters/ash_outfit_maestro.png (128x192, 4x4 de 32x48),
  Trainers/POKEMONTRAINER_Red_8.png (158x158) y POKEMONTRAINER_Red_8_back.png
  (812x196 = 4 poses de 203x196).

Los originales reemplazados se respaldan en PokeModBackups/la_ruta_de_dios/graphics/.
Los crudos generados NO son entregables: viven en assets_raw/ (fuera del juego).
"""
import os
import shutil
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets_raw")
GAME = os.path.join(ROOT, "pokemon_fire_ash")
GFX = os.path.join(GAME, "Graphics")
BACKUP = os.path.join(GAME, "PokeModBackups", "la_ruta_de_dios", "graphics")


def load(name):
    p = os.path.join(RAW, name)
    return Image.open(p).convert("RGBA") if os.path.exists(p) else None


def save(img, relpath, quantize_colors=64):
    dest = os.path.join(GFX, relpath)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest):
        os.makedirs(BACKUP, exist_ok=True)
        bak = os.path.join(BACKUP, os.path.basename(dest))
        if not os.path.exists(bak):
            shutil.copy2(dest, bak)
    out = img.convert("RGB")
    if quantize_colors:
        out = out.quantize(colors=quantize_colors, method=Image.MEDIANCUT).convert("RGB")
    out.save(dest)
    print("  ->", os.path.relpath(dest, ROOT), out.size)


def fit(img, w, h):
    return img.resize((w, h), Image.LANCZOS)


def step_frame(base, shift):
    """Marco de paso: piernas (40% inferior) desplazadas, cuerpo 1px arriba."""
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    body = base.crop((0, 0, w, int(h * 0.62)))
    legs = base.crop((0, int(h * 0.62), w, h))
    out.paste(body, (0, -1))
    out.paste(legs, (shift, 0))
    return out


def arceus_fases():
    names = {
        1: "arceus_fase1_cielo.png",
        2: "arceus_fase2_talento.png",
        3: "arceus_fase3_velocidad.png",
        4: "arceus_fase4_tipo.png",
        5: "arceus_fase5_regla.png",
    }
    for n, fn in names.items():
        img = load(fn)
        if img is None:
            print(f"  (falta {fn}, se omite)")
            continue
        save(fit(img, 96, 96), os.path.join("Pokemon", "Front", f"ARCEUS_F{n}.png"))


def fondos():
    mapping = {
        "bg_genesis1_calma.png": "genesis1_bg.png",
        "bg_genesis2_tormenta.png": "genesis2_bg.png",
        "bg_genesis3_apocalipsis.png": "genesis3_bg.png",
        "bg_olas_ritual.png": "olas_bg.png",
        "bg_volus_puerta.png": "volus_bg.png",
    }
    for raw, out in mapping.items():
        img = load(raw)
        if img is None:
            print(f"  (falta {raw}, se omite)")
            continue
        save(fit(img, 512, 288), os.path.join("Battlebacks", out), quantize_colors=96)
    # Bases: copiar las de genesis1 para los fondos nuevos (plataformas del DLC).
    for base_out in ("olas_base0.png", "olas_base1.png", "volus_base0.png", "volus_base1.png"):
        src = os.path.join(GFX, "Battlebacks", base_out.replace("olas", "genesis1").replace("volus", "genesis1"))
        dest = os.path.join(GFX, "Battlebacks", base_out)
        if os.path.exists(src) and not os.path.exists(dest):
            shutil.copy2(src, dest)
            print("  ->", os.path.relpath(dest, ROOT), "(copia de genesis1)")


def ash_maestro():
    front = load("ash_maestro_front.png")
    back = load("ash_maestro_back.png")
    left = load("ash_maestro_left.png")
    if front is not None:
        f = fit(front, 32, 48)
        right = f.transpose(Image.FLIP_LEFT_RIGHT)
        l = fit(left, 32, 48) if left is not None else f
        b = fit(back, 32, 48) if back is not None else f
        r = l.transpose(Image.FLIP_LEFT_RIGHT)
        sheet = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
        # filas RMXP: 0 abajo, 1 izquierda, 2 derecha, 3 arriba
        rows = [(f, right), (l, r), (r, l), (b, b.transpose(Image.FLIP_LEFT_RIGHT))]
        for row, (base, mirrored) in enumerate(rows):
            frames = [base, step_frame(base, -1), base, step_frame(mirrored, 1)]
            for col, fr in enumerate(frames):
                sheet.paste(fr, (col * 32, row * 48))
        save(sheet, os.path.join("Characters", "ash_outfit_maestro.png"), quantize_colors=64)
    else:
        print("  (faltan sprites de Ash, se omite)")
        return
    bat = load("ash_maestro_battle_front.png")
    if bat is not None:
        save(fit(bat, 158, 158), os.path.join("Trainers", "POKEMONTRAINER_Red_8.png"))
    stand = load("ash_maestro_battle_back_stand.png")
    throw = load("ash_maestro_battle_back_throw.png")
    if stand is not None:
        s = fit(stand, 203, 196)
        t = fit(throw, 203, 196) if throw is not None else s
        strip = Image.new("RGBA", (812, 196), (0, 0, 0, 0))
        for i, fr in enumerate([s, s, t, t]):
            strip.paste(fr, (i * 203, 0))
        save(strip, os.path.join("Trainers", "POKEMONTRAINER_Red_8_back.png"), quantize_colors=64)


def main():
    if not os.path.isdir(RAW):
        print("No existe assets_raw/: nada que ensamblar.")
        return 1
    print("== Arceus fases 1-5 ==")
    arceus_fases()
    print("== Fondos de batalla ==")
    fondos()
    print("== Ash Maestro ==")
    ash_maestro()
    print("OK: arte R17 ensamblado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
