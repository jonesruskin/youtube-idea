"""Thumbnail: the ship, crushed and glowing, 579 km inside Jupiter; a depth gauge that runs off the frame.
Hook on a slab (a different look from the black hole episode's two-line hook): "STILL NO GROUND"."""
import os
import numpy as np, cv2
from engine.core import W, H, post, glow_dot
from engine.hud import Layer
from engine import cards
from ep_jupiter.vis import D, at, T_CRUSH
from engine.jupiter import thermal


def make(d):
    st = at(T_CRUSH + 4)
    gt = 300.0
    sh = dict(x=740, y=520, r=230, t=gt, beams=0.35, crush=0.5, hull_glow=0.8)
    img = D().render(st["z"], st["v"], st["T"], gt, ship=sh, glow_boost=1.15)
    out = post(img, 0, exposure=0.95, bloom=0.7, grain=0.008).astype(np.float32) / 255
    lum = out.mean(-1, keepdims=True)
    out = np.clip(lum + (out - lum) * 1.3, 0, 1)
    # dark vignette: the heat haze closes in around the ship; right side darker for the gauge
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rr = np.hypot((xx - 740) / 900, (yy - 520) / 620)
    out *= np.clip(1.15 - 0.85 * rr ** 1.6, 0.18, 1.1)[..., None]
    out *= (1 - 0.35 * np.clip((xx - 1350) / 400, 0, 1))[..., None]

    # depth gauge: top = cloud tops, runs off the bottom of the frame
    gx, y0, ycr = 1600, 70, 560
    L = Layer()
    L.line((gx, y0), (gx, ycr), color=(1.0, 0.97, 0.93), alpha=0.95, th=8)
    L.line((gx, ycr), (gx, H + 10), color=(1.0, 0.45, 0.2), alpha=0.95, th=8, dash=26)
    for y in (y0, ycr):
        L.line((gx - 34, y), (gx + 34, y), color=(1.0, 0.97, 0.93), alpha=1.0, th=8)
    L.poly([(gx + 50, ycr), (gx + 96, ycr - 28), (gx + 96, ycr + 28)], (1.0, 0.97, 0.93), 1.0)
    out = L.composite(out, 0.5)
    def lab(t, x, y, size, col, anchor="lc", kind="semibold"):
        a = cards.sprite(t, kind, size, 0.02)
        sh_ = cv2.GaussianBlur(np.pad(a, 20), (0, 0), 7)[20:-20, 20:-20]
        cards.put(out, sh_, x + 3, y + 4, (0, 0, 0), 0.9, anchor)
        cards.put(out, a, x, y, col, 1.0, anchor)
    lab("0 KM", gx - 60, y0, 64, (1.0, 0.97, 0.93), "rc")
    lab("579 KM", gx - 60, ycr, 84, (1.0, 0.97, 0.93), "rc")
    lab("?", gx + 60, 900, 190, (1.0, 0.97, 0.93), "lc")

    # hook on a slab, bottom-left
    a = cards.sprite("STILL NO GROUND", "semibold", 118, 0.0)
    h, w = a.shape
    x0, yb = 70, 880
    out[yb - 22:yb + h + 18, x0 - 30:x0 + w + 30] = out[yb - 22:yb + h + 18, x0 - 30:x0 + w + 30] * 0.1 + np.array([1.0, 0.97, 0.93]) * 0.9
    cards.put(out, a, x0, yb, (0.06, 0.04, 0.03), 1.0, "lt")
    o = (np.clip(out, 0, 1) * 255).astype(np.uint8)[..., ::-1]
    cv2.imwrite(os.path.join(d, "thumbnail.png"), cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
    cv2.imwrite(os.path.join(d, "thumbnail_1080.png"), o)
    return os.path.join(d, "thumbnail.png")
