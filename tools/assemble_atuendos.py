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

Los crudos IA son pixel-art estilo GBA de Ash con cada atuendo; aquí se les
quita el fondo (flood-fill desde los bordes -> alfa 0), se recorta el personaje
y se ajusta al tamaño exacto de los sprites del motor (marco 32x48 de
primera/tercera generación en RMXP, batalla 158x158 / tira 812x196), siempre
RGBA con transparencia para que no desentonen con el juego.
"""
import os
import sys
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets_raw")
GFX = os.path.join(ROOT, "pokemon_fire_ash", "Graphics")
CHARS = os.path.join(GFX, "Characters")
TRAINERS = os.path.join(GFX, "Trainers")

# slot de outfit del motor -> prefijo de crudos en assets_raw/
KITS = {
    8: "ash_maestro",  # Campeón del Mundo (regalo de Oak, La Ruta de Dios)
    11: "creep",       # Viajero dimensional 1ª Gen (mundos crepypasta)
    12: "glazed",      # Pokémon Glazed (Tunod)
    13: "lp",          # Pokémon Light Platinum (Zhery y Lauren)
    14: "lc",          # Pokémon Liquid Crystal (Johto)
}


def load(name):
    p = os.path.join(RAW, name)
    return Image.open(p).convert("RGBA") if os.path.exists(p) else None


def remove_bg(img, tol=40):
    """Flood-fill desde los bordes sobre el color de fondo -> alfa 0."""
    im = img.convert("RGBA")
    w, h = im.size
    px = im.load()
    samples = []
    for x in range(0, w, max(1, w // 64)):
        samples.append(px[x, 0][:3])
        samples.append(px[x, h - 1][:3])
    for y in range(0, h, max(1, h // 64)):
        samples.append(px[0, y][:3])
        samples.append(px[w - 1, y][:3])
    samples.sort(key=lambda c: c[0] + c[1] + c[2])
    bg = samples[len(samples) // 2]

    def near(c):
        return (abs(c[0] - bg[0]) <= tol and abs(c[1] - bg[1]) <= tol
                and abs(c[2] - bg[2]) <= tol)

    seen = bytearray(w * h)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if not seen[i] and near(px[x, y][:3]):
                seen[i] = 1
                dq.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if not seen[i] and near(px[x, y][:3]):
                seen[i] = 1
                dq.append((x, y))
    while dq:
        x, y = dq.popleft()
        px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not seen[i] and near(px[nx, ny][:3]):
                    seen[i] = 1
                    dq.append((nx, ny))
    return im


def isolate(img):
    """Recorta el personaje; si hay varias figuras en fila toma la izquierda."""
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    if w > h * 1.1:  # hoja con varias figuras -> quédate con la de la izquierda
        mid = (x0 + x1) // 2
        left = img.crop((x0, y0, mid, y1))
        b2 = left.getbbox()
        return left.crop(b2) if b2 else left
    return img.crop(bbox)


def fit_aspect(img, w, h):
    """Ajusta conservando proporción, centrado horizontal y pies abajo."""
    iw, ih = img.size
    if iw <= 0 or ih <= 0:
        return Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s = min(w / iw, h / ih)
    nw, nh = max(1, int(round(iw * s))), max(1, int(round(ih * s)))
    r = img.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(r, ((w - nw) // 2, h - nh), r)
    return out


def save(img, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img.convert("RGBA").save(dest)
    print("  ->", os.path.relpath(dest, ROOT), img.size)


def step_frame(base, shift):
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cut = int(h * 0.62)
    body = base.crop((0, 0, w, cut))
    legs = base.crop((0, cut, w, h))
    out.paste(body, (0, -1), body)
    out.paste(legs, (shift, cut), legs)
    return out


def run_frame(base, shift):
    """Marco de carrera: inclinación hacia delante + zancada mayor."""
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cut = int(h * 0.60)
    body = base.crop((0, 0, w, cut))
    legs = base.crop((0, cut, w, h))
    out.paste(body, (2, -2), body)
    out.paste(legs, (2 + shift, cut + 1), legs)
    return out


def walk_sheet(front, back, left, step=step_frame):
    f = fit_aspect(front, 32, 48)
    b = fit_aspect(back, 32, 48)
    l = fit_aspect(left, 32, 48)
    r = l.transpose(Image.FLIP_LEFT_RIGHT)
    sheet = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
    rows = [(f, f.transpose(Image.FLIP_LEFT_RIGHT)), (l, r), (r, l),
            (b, b.transpose(Image.FLIP_LEFT_RIGHT))]
    for row, (base, mirrored) in enumerate(rows):
        frames = [base, step(base, -1), base, step(mirrored, 1)]
        for col, fr in enumerate(frames):
            sheet.paste(fr, (col * 32, row * 48), fr)
    return sheet


def _opaque_cols(img, max_w=8192):
    im = img.convert("RGBA")
    data = im.tobytes()
    cols = [(data[i], data[i + 1], data[i + 2])
            for i in range(0, len(data), 4) if data[i + 3] > 0]
    if not cols:
        return None
    if len(cols) > max_w:
        step = len(cols) / max_w
        cols = [cols[int(j * step)] for j in range(max_w)]
    strip = Image.new("RGB", (len(cols), 1))
    strip.putdata(cols)
    return strip


def _used_palette(q):
    pal = q.getpalette() or []
    used = sorted({i for _, i in (q.getcolors() or [])})
    return [tuple(pal[i * 3:i * 3 + 3]) for i in used] or [(0, 0, 0)]


def palette_transfer(orig, donor, n=16):
    """Recolorea `orig` con la paleta de `donor`, conservando su alfa.

    Las paletas se calculan solo con píxeles opacos (el alfa de los PNG no
    contamina los colores) y se emparejan por rango de luminancia.
    """
    o = orig.convert("RGBA")
    w, h = o.size
    ostrip = _opaque_cols(o)
    dstrip = _opaque_cols(donor)
    if ostrip is None or dstrip is None:
        return o
    o_pal = _used_palette(ostrip.quantize(colors=n, method=Image.MEDIANCUT))
    d_pal = _used_palette(dstrip.quantize(colors=n, method=Image.MEDIANCUT))

    def lum(c):
        return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]

    o_sorted = sorted(o_pal, key=lum)
    d_sorted = sorted(d_pal, key=lum)
    lut = []
    for rank in range(len(o_sorted)):
        pos = int(round(rank * (len(d_sorted) - 1) / max(1, len(o_sorted) - 1)))
        lut.append(d_sorted[min(max(pos, 0), len(d_sorted) - 1)])

    cache = {}

    def nearest(c):
        i = cache.get(c)
        if i is None:
            i = min(range(len(o_sorted)),
                    key=lambda k: (o_sorted[k][0] - c[0]) ** 2
                    + (o_sorted[k][1] - c[1]) ** 2
                    + (o_sorted[k][2] - c[2]) ** 2)
            cache[c] = i
        return i

    data = o.tobytes()
    outb = bytearray(w * h * 4)
    j = 0
    for i in range(0, len(data), 4):
        a = data[i + 3]
        if a:
            c = lut[nearest((data[i], data[i + 1], data[i + 2]))]
            outb[j] = c[0]
            outb[j + 1] = c[1]
            outb[j + 2] = c[2]
        outb[j + 3] = a
        j += 4
    out = Image.new("RGBA", (w, h))
    out.frombytes(bytes(outb))
    return out


def battle_back_strip(stand, throw):
    if stand is None and throw is None:
        return None
    if stand is None:
        stand = throw
    if throw is None:
        throw = stand
    s = fit_aspect(stand, 203, 196)
    t = fit_aspect(throw, 203, 196)
    strip = Image.new("RGBA", (812, 196), (0, 0, 0, 0))
    for i, fr in enumerate([s, s, t, t]):
        strip.paste(fr, (i * 203, 0), fr)
    return strip


def build_kit(slot, raw):
    front = load(f"{raw}_front.png")
    back = load(f"{raw}_back.png")
    left = load(f"{raw}_left.png")
    if front is None or back is None or left is None:
        print(f"  (kit {raw}: faltan poses de caminar, se omite)")
        return False
    print(f"== kit {raw} (outfit {slot}) ==")
    front = isolate(remove_bg(front))
    back = isolate(remove_bg(back))
    left = isolate(remove_bg(left))
    # caminar
    save(walk_sheet(front, back, left),
         os.path.join(CHARS, f"trchar000_{slot}.png"))
    # correr (derivado)
    save(walk_sheet(front, back, left, step=run_frame),
         os.path.join(CHARS, f"boy_run_{slot}.png"))
    # bici / surf / pesca: paleta del atuendo sobre los originales del juego
    for orig_name, out_name in [
        ("boy_bike.png", f"boy_bike_{slot}.png"),
        ("boy_surf.png", f"boy_surf_{slot}.png"),
        ("boy_fish_offset.png", f"boy_fish_offset_{slot}.png"),
    ]:
        p = os.path.join(CHARS, orig_name)
        orig = Image.open(p).convert("RGBA") if os.path.exists(p) else None
        if orig is None:
            print(f"  (falta {orig_name}, se omite)")
            continue
        save(palette_transfer(orig, front), os.path.join(CHARS, out_name))
    # batalla
    bf = load(f"{raw}_battle_front.png")
    if bf is not None:
        save(fit_aspect(isolate(remove_bg(bf)), 158, 158),
             os.path.join(TRAINERS, f"POKEMONTRAINER_Red_{slot}.png"))
    bs = load(f"{raw}_battle_back_stand.png")
    bt = load(f"{raw}_battle_back_throw.png")
    if bs is not None:
        bs = isolate(remove_bg(bs))
    if bt is not None:
        bt = isolate(remove_bg(bt))
    if bs is None and back is not None:
        bs = back  # deriva la pose quieta desde la espalda de caminar
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
