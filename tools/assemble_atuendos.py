#!/usr/bin/env python3
"""Ensambla los kits de atuendos de Ash (assets_raw/) en gráficos del juego.

Kit completo por atuendo (que no falte ningún sprite ni animación):
- trchar000_N.png          caminar  (128x192, 4x4 de 32x48)   <- 3 poses IA
- boy_run_N.png            correr   (128x192)                 <- derivado (avance)
- boy_bike_N.png           bici     (192x192, 6x4 de 32x48)   <- paleta del atuendo
- boy_surf_N.png           surf     (128x192)                 <- paleta del atuendo
- boy_fish_offset_N.png    pesca    (384x320)                 <- paleta del atuendo
- POKEMONTRAINER_Red_N.png batalla frente (158x158)           <- IA
- POKEMONTRAINER_Red_N_back.png batalla espalda (812x196)     <- IA

El sistema de outfits del motor resuelve *_N automáticamente (mismo mecanismo
que las variantes Red_1..7), así que caminar, bici, surf, correr y pesca siguen
al atuendo sin más código. Bici/surf/pesca se recolorean desde los originales
del juego con la paleta del atuendo: se sienten como si siempre hubieran estado.
"""
import os
import shutil
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets_raw")
GFX = os.path.join(ROOT, "pokemon_fire_ash", "Graphics")
CHARS = os.path.join(GFX, "Characters")
TRAINERS = os.path.join(GFX, "Trainers")

# slot de outfit del motor -> prefijo de crudos en assets_raw/
KITS = {
    8: "maestro",    # Campeón del Mundo (regalo de Oak, La Ruta de Dios)
    11: "creep",     # Viajero dimensional 1ª Gen (mundos crepypasta)
    12: "glazed",    # Pokémon Glazed (Tunod)
    13: "lp",        # Pokémon Light Platinum (Zhery y Lauren)
    14: "lc",        # Pokémon Liquid Crystal (Johto)
}


def load(name):
    p = os.path.join(RAW, name)
    return Image.open(p).convert("RGBA") if os.path.exists(p) else None


def fit(img, w, h):
    return img.resize((w, h), Image.LANCZOS)


def save(img, dest, quantize=64):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    out = img.convert("RGB")
    if quantize:
        out = out.quantize(colors=quantize, method=Image.MEDIANCUT).convert("RGB")
    out.save(dest)
    print("  ->", os.path.relpath(dest, ROOT), out.size)


def step_frame(base, shift):
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    body = base.crop((0, 0, w, int(h * 0.62)))
    legs = base.crop((0, int(h * 0.62), w, h))
    out.paste(body, (0, -1))
    out.paste(legs, (shift, 0))
    return out


def run_frame(base, shift):
    """Marco de carrera: incline hacia delante + zancada mayor."""
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    body = base.crop((0, 0, w, int(h * 0.60)))
    legs = base.crop((0, int(h * 0.60), w, h))
    out.paste(body, (2, -2))          # torso adelantada
    out.paste(legs, (2 + shift, 1))
    return out


def walk_sheet(front, back, left, step=step_frame):
    f = fit(front, 32, 48)
    b = fit(back, 32, 48)
    l = fit(left, 32, 48)
    r = l.transpose(Image.FLIP_LEFT_RIGHT)
    sheet = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
    rows = [(f, f.transpose(Image.FLIP_LEFT_RIGHT)), (l, r), (r, l),
            (b, b.transpose(Image.FLIP_LEFT_RIGHT))]
    for row, (base, mirrored) in enumerate(rows):
        frames = [base, step(base, -1), base, step(mirrored, 1)]
        for col, fr in enumerate(frames):
            sheet.paste(fr, (col * 32, row * 48))
    return sheet


def palette_transfer(orig, donor, n=16):
    """Recolorea `orig` usando la paleta de `donor` emparejada por luminancia."""
    o = orig.convert("RGB").quantize(colors=n, method=Image.MEDIANCUT)
    d = donor.convert("RGB").quantize(colors=n, method=Image.MEDIANCUT)
    o_pal = o.getpalette() or []
    d_pal = d.getpalette() or []
    o_n = max(1, len(o_pal) // 3)
    d_n = max(1, len(d_pal) // 3)

    def lum(i, pal):
        r, g, b = pal[i * 3:i * 3 + 3]
        return 0.299 * r + 0.587 * g + 0.114 * b

    o_sorted = sorted(range(o_n), key=lambda i: lum(i, o_pal))
    d_sorted = sorted(range(d_n), key=lambda i: lum(i, d_pal))
    lut = {}
    for rank, oi in enumerate(o_sorted):
        pos = int(round(rank * (d_n - 1) / max(1, o_n - 1)))
        di = d_sorted[min(max(pos, 0), d_n - 1)]
        lut[oi] = tuple(d_pal[di * 3:di * 3 + 3])
    px = o.load()
    out = Image.new("RGB", o.size)
    op = out.load()
    for y in range(o.size[1]):
        for x in range(o.size[0]):
            op[x, y] = lut.get(px[x, y], (255, 255, 255))
    return out.convert("RGBA")


def battle_back_strip(stand, throw):
    s = fit(stand, 203, 196) if stand is not None else None
    t = fit(throw, 203, 196) if throw is not None else None
    if s is None and t is None:
        return None
    if s is None:
        s = t
    if t is None:
        t = s
    strip = Image.new("RGBA", (812, 196), (0, 0, 0, 0))
    for i, fr in enumerate([s, s, t, t]):
        strip.paste(fr, (i * 203, 0))
    return strip


def build_kit(slot, raw):
    front = load(f"{raw}_front.png")
    back = load(f"{raw}_back.png")
    left = load(f"{raw}_left.png")
    if front is None or back is None or left is None:
        print(f"  (kit {raw}: faltan poses de caminar, se omite)")
        return False
    print(f"== kit {raw} (outfit {slot}) ==")
    # caminar
    walk = walk_sheet(front, back, left)
    save(walk, os.path.join(CHARS, f"trchar000_{slot}.png"))
    # correr (derivado)
    run = walk_sheet(front, back, left, step=run_frame)
    save(run, os.path.join(CHARS, f"boy_run_{slot}.png"))
    # bici / surf / pesca: paleta del atuendo sobre los originales del juego
    for orig_name, out_name, size in [
        ("boy_bike.png", f"boy_bike_{slot}.png", (192, 192)),
        ("boy_surf.png", f"boy_surf_{slot}.png", (128, 192)),
        ("boy_fish_offset.png", f"boy_fish_offset_{slot}.png", (384, 320)),
    ]:
        p = os.path.join(CHARS, orig_name)
        orig = Image.open(p).convert("RGBA") if os.path.exists(p) else None
        if orig is None:
            print(f"  (falta {orig_name}, se omite)")
            continue
        rec = palette_transfer(orig, front.resize((32, 48)))
        save(rec, os.path.join(CHARS, out_name), quantize=32)
    # batalla
    bf = load(f"{raw}_battle_front.png")
    if bf is not None:
        save(fit(bf, 158, 158), os.path.join(TRAINERS, f"POKEMONTRAINER_Red_{slot}.png"))
    bs = load(f"{raw}_battle_back_stand.png")
    bt = load(f"{raw}_battle_back_throw.png")
    strip = battle_back_strip(bs, bt)
    if strip is not None:
        save(strip, os.path.join(TRAINERS, f"POKEMONTRAINER_Red_{slot}_back.png"))
    return True


def main():
    hechos = 0
    for slot, raw in KITS.items():
        if build_kit(slot, raw):
            hechos += 1
    print(f"OK: {hechos} kits de atuendo ensamblados.")
    return 0 if hechos else 1


if __name__ == "__main__":
    sys.exit(main())
