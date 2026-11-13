"""Thumbnail: a wall of Jupiter's storm bands with the Great Red Spot, a tiny ship falling in, hook "NO BOTTOM"."""
import os
import numpy as np, cv2
from engine.core import W, H, post, glow_dot
from engine.scenes2 import Cam
from engine.jupiter import globe, draw_ship, GRS_SPIN, GRS_TILT
from engine import cards


def make(d):
    cam = Cam(0.0, z=(1.0, 1.0), canvas=(2300, 1300))
    img = cam.stars(gain=0.9)
    # Jupiter fills the left two thirds; GRS near the lower middle
    globe(img, 560, 980, 1020, spin=GRS_SPIN + 0.25, tilt=GRS_TILT - 0.1, light=(-0.35, 0.45, 0.82), exposure=0.95)
    # the ship, small, falling toward the clouds, floodlights on
    fog = np.array([0.05, 0.05, 0.07], np.float32)
    img = draw_ship(img, dict(x=980, y=250, r=50, t=0.3, beams=1.0, crush=0.0, hull_glow=0.0), 1.0, fog, 0.0, np.zeros(3, np.float32), 0.0)
    for i in range(12):  # motion streak above the ship
        glow_dot(img, 980, 250 - 60 - i * 14, (0.7, 0.8, 1.0), 3, 0.25 * (1 - i / 12))
    out = post(img, 0, exposure=1.3, bloom=0.5, grain=0.008).astype(np.float32) / 255
    # darken the right side behind the text
    xs = np.arange(W, dtype=np.float32)
    out *= (1 - 0.55 * np.clip((xs - 1150) / 400, 0, 1))[None, :, None]
    lum = out.mean(-1, keepdims=True)
    out = np.clip(lum + (out - lum) * 1.35, 0, 1)   # punchier colour for small sizes

    def big(text, x, y, size, color, kind="semibold", tr=-0.01):
        a = cards.sprite(text, kind, size, tr)
        sh = cv2.GaussianBlur(np.pad(a, 30), (0, 0), 12)[30:-30, 30:-30]
        cards.put(out, sh, x + 5, y + 7, (0, 0, 0), 0.95, "lt")
        cards.put(out, a, x, y, color, 1.0, "lt")
    big("NO", 1290, 210, 230, (1.0, 0.97, 0.93))
    big("BOTTOM", 1180, 450, 170, (1.0, 0.6, 0.25))
    o = (np.clip(out, 0, 1) * 255).astype(np.uint8)[..., ::-1]
    cv2.imwrite(os.path.join(d, "thumbnail.png"), cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
    cv2.imwrite(os.path.join(d, "thumbnail_1080.png"), o)
    return os.path.join(d, "thumbnail.png")
