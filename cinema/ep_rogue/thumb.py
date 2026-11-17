"""Thumbnails: the rogue looming over a small Earth. Main hook '11 DAYS'; A/B variant 'THROWN OUT'. 1280x720 + 1920x1080."""
import os
import numpy as np, cv2
from engine.core import W, H, post, glow_dot
from engine.space import space_frame
from engine.planet import render_planet
from engine import cards
from ep_rogue.vis import draw_rogue

cards.FONT_FILES.setdefault("black", cards.INTER + "Inter-Black.otf")


def _text(out, s, x, y, size, color):
    a = cards.sprite(s, "black", size, -0.02)
    sh = cv2.GaussianBlur(np.pad(a, 40), (0, 0), 14)[40:-40, 40:-40]
    cards.put(out, sh, x + 5, y + 8, (0, 0, 0), 1.0, "lt")
    cards.put(out, a, x, y, color, 1.0, "lt")


def _base():
    img, _ = space_frame(2600, 1500, 1.15, angle=4)
    img *= 0.8
    img = draw_rogue(img, 1400, 560, 640, light=(-0.95, 0.2, 0.12), lit=0.85, glow=1.6, spin=0.4)
    render_planet(img, 480, 830, 200, "earth", spin=1.25, tilt=0.42, light=(0.6, 0.25, 0.75))
    glow_dot(img, 480, 830, (0.4, 0.6, 1.0), 260, 0.06)
    out = post(img, 0, exposure=1.75, bloom=0.7, grain=0.008).astype(np.float32) / 255
    hsv = cv2.cvtColor((np.clip(out, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] *= 1.25
    return cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32) / 255


def _save(out, d, name, big=None):
    o = (np.clip(out, 0, 1) * 255).astype(np.uint8)[..., ::-1]
    cv2.imwrite(os.path.join(d, name), cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
    if big:
        cv2.imwrite(os.path.join(d, big), o)
    return os.path.join(d, name)


def make(d):
    base = _base()
    a = base.copy()
    _text(a, "11", 90, 70, 330, (1.0, 0.58, 0.18))
    _text(a, "DAYS", 110, 400, 150, (1.0, 0.97, 0.93))
    _save(a, d, "thumbnail_B.png")
    # C: the worst day, from the ground: the rogue rising over a city across the bay
    from ep_rogue.ground import ground_view
    img, pos, f = ground_view(2.0, sun_alt=-3.0, sun_az=-60.0, view_az=4.0, pitch=26.0, fov=74.0, fg="bay",
                              rogue=dict(alt=26.0, az=8.0, size_deg=38.0, light=(-0.85, 0.25, 0.35), lit=1.1, glow=0.7),
                              moon=dict(alt=50.0, az=-30.0, size_deg=0.52))
    c = post(img, 0, exposure=1.6, bloom=0.65, grain=0.008).astype(np.float32) / 255
    _text(c, "11", 70, 60, 300, (1.0, 0.58, 0.18))
    _text(c, "DAYS", 90, 360, 140, (1.0, 0.97, 0.93))
    p = _save(c, d, "thumbnail.png", "thumbnail_1080.png")
    b = base.copy()
    _text(b, "THROWN", 80, 80, 170, (1.0, 0.97, 0.93))
    _text(b, "OUT", 80, 270, 230, (1.0, 0.32, 0.28))
    _save(b, d, "thumbnail_C.png")
    return p
