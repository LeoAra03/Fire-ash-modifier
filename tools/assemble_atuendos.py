#!/usr/bin/env python3
"""Ensambla los kits de atuendos de Ash (assets_raw/) en gráficos del juego.

Kit completo por atuendo (que no falte ningún sprite ni animación):
- trchar000_N.png          caminar  (128x192, 4x4 de 32x48)   <- 3 poses IA
- boy_run_N.png            correr   (128x192)                 <- derivado (avance)
- boy_bike_N.png           bici     (192x192, 6x4 de 32x48)   <- paleta del atuendo
- boy_surf_N.png           surf     (128x192)                 <- paleta del atuendo
- boy_fish_offset_N.png    pesca    (384x320)                 <- paleta del atuendo
- POKEMONTRAINER_Red_N.png batalla frente (158x158)           <- IA
- POKEMONTRAINER_Red_N_back.png batalla espalda (812x196 = 5 marcos de 162x196,
                                la rejilla con la que el motor corta la tira)

Los crudos IA son pixel-art estilo GBA de Ash con cada atuendo; aquí se les
quita el fondo (flood-fill desde los bordes -> alfa 0), se recorta el personaje
y se ajusta al tamaño exacto de los sprites del motor (marco 32x48 de
primera/tercera generación en RMXP, batalla 158x158 / tira 812x196), siempre
RGBA con transparencia para que no desentonen con el juego.

Las espaldas se conforman a su frente antes de escalar (auditoría de back
sprites, docs/AUDITORIA_BACK_SPRITES.md): misma proporción cabeza/alto, misma
escala de personaje y mismo eje del cuerpo. El resumen de lo aplicado queda en
content/atuendos_espaldas.json y se verifica con `npm run verify:back:sprites`.
"""
import json
import math
import os
import sys
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets_raw")
GFX = os.path.join(ROOT, "pokemon_fire_ash", "Graphics")
CHARS = os.path.join(GFX, "Characters")
TRAINERS = os.path.join(GFX, "Trainers")
INFORME = os.path.join(ROOT, "content", "atuendos_espaldas.json")

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


# ---------------------------------------------------------------------------
# Conformación de espaldas contra su frente (auditoría de back sprites).
#
# Las poses IA de espalda no comparten proporciones con su frente: la cabeza de
# glazed_back es, relativa a su altura, un 27 % más ancha que la de
# glazed_front, lp_front es chibi y lp_back no, la bufanda de lc_back descentra
# el recorte... Escalar cada pose a
# su caja por separado (fit_aspect) heredaba esas diferencias, y en batalla la
# pose de lanzar (con el brazo alzado y la Poké Ball dentro de la caja) salía
# más pequeña que la quieta. Ahora la espalda se conforma a SU frente:
#   1) cabeza: el ancho de cabeza relativo a la altura se iguala al del frente
#      escalando solo la cabeza, con el corte en el cuello (el cuerpo no se
#      toca); caminar se compara con <kit>_front y batalla con
#      <kit>_battle_front, cada una con su frente;
#   2) escala: misma altura de personaje que el frente en el marco 32x48 y, en
#      batalla, misma altura en pie que el frente 158x158, con la pose de
#      lanzar a la misma escala que la quieta;
#   3) eje: se alinea el eje del cuerpo (centroide de los pies), no el
#      recorte, que bufandas, capas y la Poké Ball descentran.
# ---------------------------------------------------------------------------
HEAD_TOL = 0.05          # desviación de cabeza que no merece retoque
HEAD_K = (0.6, 1.8)      # límites de seguridad del factor de cabeza
BACK_STRIP = (812, 196)  # tamaño de la tira trasera original del motor
BACK_FRAMES = 5          # Scene_Initialize: src_rect.width = bitmap.width / 5
BACK_POSES = ("quieto", "quieto", "lanzar", "lanzar", "lanzar")


def alpha_rows(img):
    """Perfil por fila: (opacos, racha opaca más larga, x mínima, x máxima)."""
    im = img.convert("RGBA")
    w, h = im.size
    a = im.getchannel("A").tobytes()
    rows = []
    for y in range(h):
        row = a[y * w:(y + 1) * w]
        cnt = best = cur = 0
        lo = hi = -1
        for x in range(w):
            if row[x]:
                cnt += 1
                cur += 1
                if cur > best:
                    best = cur
                if lo < 0:
                    lo = x
                hi = x
            else:
                cur = 0
        rows.append((cnt, best, lo, hi))
    return rows


def neck_row(rows):
    """Fila del cuello: el estrechamiento más marcado entre el 18 % y el 50 %
    de la altura. None si no hay uno claro (casco de astronauta, capucha)."""
    h = len(rows)
    if h < 8:
        return None
    k = max(1, h // 100)
    cnt = [r[0] for r in rows]
    sm = []
    for y in range(h):
        seg = cnt[max(0, y - k):y + k + 1]
        sm.append(sum(seg) / float(len(seg)))
    lo, hi = int(0.18 * h), int(0.50 * h)
    if hi <= lo:
        return None
    y = min(range(lo, hi), key=lambda i: sm[i])
    head = max(sm[:y]) if y else 0.0
    body = max(sm[y:max(y + 1, int(0.70 * h))])
    if sm[y] < 0.85 * head and sm[y] < 0.75 * body:
        return y
    return None


def head_ratio(img, rows=None):
    """(ancho de cabeza / alto, fila del cuello) de una figura recortada. La
    cabeza son las filas sobre el cuello (o el 30 % superior si no hay)."""
    rows = rows if rows is not None else alpha_rows(img)
    h = len(rows)
    n = neck_row(rows)
    top = n if n else max(1, int(0.30 * h))
    return max(r[1] for r in rows[:top]) / float(h), n


def standing_height(img, rows=None):
    """Altura en pie: de la coronilla (primera fila cuya racha opaca llega al
    15 % del alto, así no cuentan la mano alzada ni la Poké Ball) a los pies."""
    rows = rows if rows is not None else alpha_rows(img)
    ys = [y for y, r in enumerate(rows) if r[0]]
    if not ys:
        return 0
    top, bot = ys[0], ys[-1]
    thr = 0.15 * (bot - top + 1)
    head = next((y for y in range(top, bot + 1) if rows[y][1] >= thr), top)
    return bot - head + 1


def body_axis(img):
    """Eje del cuerpo: centroide de las x opacas del 15 % inferior (los pies).
    No se deja arrastrar por bufandas, capas, brazos ni la Poké Ball, y con
    dos pies separados cae entre ambos (la mediana caería en el borde de uno)."""
    im = img.convert("RGBA")
    w, h = im.size
    a = im.getchannel("A").tobytes()
    bbox = im.getbbox()
    if not bbox:
        return w / 2.0
    y0 = bbox[3] - max(1, int(round((bbox[3] - bbox[1]) * 0.15)))
    total = 0
    acc = 0
    for y in range(y0, bbox[3]):
        row = a[y * w:(y + 1) * w]
        for x in range(w):
            if row[x]:
                total += 1
                acc += x
    if not total:
        return w / 2.0
    return acc / float(total) + 0.5


def conform_head(img, ref):
    """Iguala la proporción cabeza/alto de `img` (una espalda) a la de `ref`
    (su frente) escalando solo la cabeza, con el corte en el cuello.

    Devuelve (imagen, k, cabeza_ref, cabeza_antes, cuello_relativo)."""
    rows = alpha_rows(img)
    rb, n = head_ratio(img, rows)
    rf, _ = head_ratio(ref)
    w, h = img.size
    neck = round(n / float(h), 3) if n else None
    if n is None or rb <= 0 or rf <= 0 or abs(rb / rf - 1.0) <= HEAD_TOL:
        return img, 1.0, rf, rb, neck
    denom = rb * h - rf * n
    if denom <= 0:
        return img, 1.0, rf, rb, neck
    k = max(HEAD_K[0], min(HEAD_K[1], rf * (h - n) / denom))
    lo, hi = rows[n][2], rows[n][3]
    cx = (lo + hi) / 2.0 if lo >= 0 else w / 2.0
    head = img.crop((0, 0, w, n)).resize(
        (max(1, int(round(w * k))), max(1, int(round(n * k)))), Image.LANCZOS)
    body = img.crop((0, n, w, h))
    left = max(cx * k, cx)
    right = max((w - cx) * k, w - cx)
    out = Image.new("RGBA", (int(math.ceil(left + right)) + 2,
                             head.height + body.height), (0, 0, 0, 0))
    ax = left + 1
    out.alpha_composite(body, (int(round(ax - cx)), head.height))
    out.alpha_composite(head, (int(round(ax - cx * k)), 0))
    return out.crop(out.getbbox()), k, rf, rb, neck


def place(img, cw, ch, s, axis_to, axis_from, margin=0):
    """Escala `img` por `s` y la coloca en un lienzo cw x ch con los pies
    abajo y su eje `axis_from` (px de img) en `axis_to` (px del lienzo), sin
    salirse del lienzo (dejando `margin` px a cada lado si cabe)."""
    iw, ih = img.size
    nw, nh = max(1, int(round(iw * s))), max(1, int(round(ih * s)))
    r = img.resize((nw, nh), Image.LANCZOS)
    x = int(round(axis_to - axis_from * s))
    if nw + 2 * margin <= cw:
        x = max(margin, min(cw - margin - nw, x))
    else:
        x = (cw - nw) // 2
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    out.paste(r, (x, ch - nh), r)
    return out


def walk_back(back, front, cw=32, ch=48):
    """Marco de espalda para caminar conformado a su frente: proporción de
    cabeza del frente, misma altura de personaje que el frente ajustado por
    fit_aspect y eje del cuerpo alineado con el suyo. Devuelve (marco, info)."""
    b, k, rf, rb, neck = conform_head(back, front)
    fw0, fh0 = front.size
    sf = min(cw / float(fw0), ch / float(fh0))
    nwf, nhf = max(1, int(round(fw0 * sf))), max(1, int(round(fh0 * sf)))
    axis = (cw - nwf) // 2 + body_axis(front) * (nwf / float(fw0))
    iw, ih = b.size
    s = nhf / float(ih)
    if iw * s > cw:
        s = cw / float(iw)
    cell = place(b, cw, ch, s, axis, body_axis(b))
    return cell, {
        "cabeza_frente": round(rf, 3),
        "cabeza_espalda": round(rb, 3),
        "cuello_espalda": neck,
        "k_cabeza": round(k, 3),
        "cabeza_conformada": round(head_ratio(b)[0], 3),
        "alto_px": int(round(ih * s)),
    }


def save(img, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img.convert("RGBA").save(dest)
    print("  ->", os.path.relpath(dest, ROOT), img.size)


def step_frame(base, shift):
    """Marco de paso: cuerpo 1 px arriba y piernas desplazadas `shift` px.

    El cuerpo se recorta con 1 fila de más: al subirlo 1 px ya no queda una
    fila transparente entre cuerpo y piernas (cortaba la figura en dos en
    cada paso; lo detecta tools/audit_back_sprites.mjs)."""
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cut = int(h * 0.62)
    body = base.crop((0, 0, w, cut + 1))
    legs = base.crop((0, cut, w, h))
    out.paste(body, (0, -1), body)
    out.paste(legs, (shift, cut), legs)
    return out


def run_frame(base, shift):
    """Marco de carrera: inclinación hacia delante + zancada mayor.

    Cuerpo 2 px arriba (recortado con 2 filas de más para no dejar hueco) y
    piernas apoyadas en la línea base: antes bajaban 1 px, se perdía la fila
    de los pies y quedaban 3 filas transparentes en mitad de la figura."""
    w, h = base.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cut = int(h * 0.60)
    body = base.crop((0, 0, w, cut + 2))
    legs = base.crop((0, cut, w, h))
    out.paste(body, (2, -2), body)
    out.paste(legs, (2 + shift, cut), legs)
    return out


def walk_sheet(front, back, left, step=step_frame, back_cell=None):
    f = fit_aspect(front, 32, 48)
    b = back_cell if back_cell is not None else walk_back(back, front)[0]
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


def battle_back_strip(stand, throw, front=None):
    """Tira trasera en la rejilla del motor.

    Scene_Initialize trata como animada toda tira con width > 2*height y la
    corta en `width / 5`: la de 812x196 son 5 marcos de 162x196 (los 2 px
    sobrantes quedan vacíos), y PlayerFadeAnimation/trainerThrowingFrames
    recorren los marcos 1-4. Orden: [quieto, quieto, lanzar, lanzar, lanzar].

    Ambas poses comparten escala de personaje (misma altura en pie, sin
    contar la mano alzada ni la Poké Ball) y, si se da `front` (el frente de
    batalla ya ensamblado), la de su frente; el factor se reduce lo justo
    para que las dos quepan en el marco. Pies abajo (oy = alto del bitmap),
    eje del cuerpo en el centro del marco y 1 px de margen: ninguna figura
    cruza al marco vecino."""
    if stand is None and throw is None:
        return None, None
    stand = stand if stand is not None else throw
    throw = throw if throw is not None else stand
    W, H = BACK_STRIP
    fw = W // BACK_FRAMES
    poses = {}
    for name, img in (("quieto", stand), ("lanzar", throw)):
        poses[name] = (img, standing_height(img), body_axis(img))
    goal = float(standing_height(front)) if front is not None else float(H)
    target = goal
    for img, sh, _ in poses.values():
        s = target / sh
        iw, ih = img.size
        target *= min(1.0, H / (ih * s), (fw - 2) / (iw * s))
    frames = {name: place(img, fw, H, target / sh, fw / 2.0, ax, margin=1)
              for name, (img, sh, ax) in poses.items()}
    strip = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for i, name in enumerate(BACK_POSES):
        strip.paste(frames[name], (i * fw, 0))
    return strip, {
        "marcos": f"{BACK_FRAMES}x{fw}x{H}",
        "orden": list(BACK_POSES),
        "altura_en_pie_frente": int(goal),
        "altura_en_pie_espalda": int(round(target)),
    }


def build_kit(slot, raw, informe=None):
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
    # caminar: la espalda se conforma a su frente (cabeza, altura y eje)
    back_cell, walk_info = walk_back(back, front)
    save(walk_sheet(front, back, left, back_cell=back_cell),
         os.path.join(CHARS, f"trchar000_{slot}.png"))
    # correr (derivado)
    save(walk_sheet(front, back, left, step=run_frame, back_cell=back_cell),
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
    bf_iso = bf_out = None
    if bf is not None:
        bf_iso = isolate(remove_bg(bf))
        bf_out = fit_aspect(bf_iso, 158, 158)
        save(bf_out, os.path.join(TRAINERS, f"POKEMONTRAINER_Red_{slot}.png"))
    bs = load(f"{raw}_battle_back_stand.png")
    bt = load(f"{raw}_battle_back_throw.png")
    stand_src = f"{raw}_battle_back_stand.png"
    if bs is not None:
        bs = isolate(remove_bg(bs))
    if bt is not None:
        bt = isolate(remove_bg(bt))
    if bs is None and back is not None:
        bs = back  # deriva la pose quieta desde la espalda de caminar
        stand_src = f"{raw}_back.png"
    battle_info = {"quieto": stand_src,
                   "lanzar": f"{raw}_battle_back_throw.png" if bt is not None else stand_src}
    if bs is not None and bf_iso is not None:
        bs, k, rf, rb, neck = conform_head(bs, bf_iso)
        battle_info.update({
            "frente": f"{raw}_battle_front.png",
            "cabeza_frente": round(rf, 3),
            "cabeza_quieto": round(rb, 3),
            "cuello_quieto": neck,
            "k_cabeza": round(k, 3),
            "cabeza_conformada": round(head_ratio(bs)[0], 3),
        })
    strip, strip_info = battle_back_strip(bs, bt, bf_out)
    if strip is not None:
        battle_info.update(strip_info)
        save(strip, os.path.join(TRAINERS, f"POKEMONTRAINER_Red_{slot}_back.png"))
    print(f"  espalda conformada: caminar k={walk_info['k_cabeza']}"
          f" ({walk_info['cabeza_espalda']} -> {walk_info['cabeza_conformada']},"
          f" frente {walk_info['cabeza_frente']}), batalla k={battle_info.get('k_cabeza', 1.0)}")
    if informe is not None:
        walk_info.update({"frente": f"{raw}_front.png", "espalda": f"{raw}_back.png"})
        informe[str(slot)] = {"crudo": raw, "caminar": walk_info, "batalla": battle_info}
    return True


def write_informe(kits):
    data = {
        "generado_por": "tools/assemble_atuendos.py",
        "auditoria": "tools/audit_back_sprites.mjs (docs/AUDITORIA_BACK_SPRITES.md)",
        "criterio": ("la espalda se conforma a su frente: proporción cabeza/alto "
                     "(solo se escala la cabeza, corte en el cuello), misma "
                     "escala de personaje y mismo eje del cuerpo"),
        "tolerancia_cabeza": HEAD_TOL,
        "limites_k_cabeza": list(HEAD_K),
        "tira_trasera": {"tamano": list(BACK_STRIP), "marcos": BACK_FRAMES,
                         "orden": list(BACK_POSES)},
        "kits": kits,
    }
    os.makedirs(os.path.dirname(INFORME), exist_ok=True)
    with open(INFORME, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("  ->", os.path.relpath(INFORME, ROOT))


def main():
    hechos = 0
    kits = {}
    for slot, raw in KITS.items():
        if build_kit(slot, raw, kits):
            hechos += 1
    if kits:
        write_informe(kits)
    print(f"OK: {hechos} kits de atuendo ensamblados.")
    return 0 if hechos else 1


if __name__ == "__main__":
    sys.exit(main())
