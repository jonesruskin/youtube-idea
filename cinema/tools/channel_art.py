"""Channel art: profile picture (800x800), banner (2048x1152), watermark (150x150 transparent PNG).
Usage: python tools/channel_art.py [outdir]   (default ../channel)"""
import os, sys
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.core import W, H, post, glow_dot
from engine.scenes2 import Cam
from engine.jupiter import globe, GRS_SPIN, GRS_TILT
from engine import cards
from engine.brand import CHANNEL, TAGLINE, logo

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "channel")
os.makedirs(OUT, exist_ok=True)
T_SETTLED = 4.0   # logo time after the needle has settled in the red zone


def to8(img):
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)[..., ::-1]


def profile():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.hypot(xx - W / 2, yy - H / 2) / 540
    img = np.zeros((H, W, 3), np.float32)
    img += (np.array([0.05, 0.06, 0.11], np.float32) * np.clip(1 - r, 0, 1)[..., None] ** 1.5)  # soft navy core
    img += 0.012
    img = logo(img, W / 2, H / 2 + 20, 8.2, 1.0, T_SETTLED)
    sq = to8(img)[:, (W - H) // 2:(W + H) // 2]
    cv2.imwrite(os.path.join(OUT, "profile_800.png"), cv2.resize(sq, (800, 800), interpolation=cv2.INTER_AREA))
    # how it looks in a comment thread / subscription list
    small = cv2.resize(sq, (98, 98), interpolation=cv2.INTER_AREA)
    m = np.zeros((98, 98), np.uint8); cv2.circle(m, (49, 49), 49, 255, -1)
    cv2.imwrite(os.path.join(OUT, "_preview_profile_98_circle.png"), small * (m[..., None] > 0))


def watermark():
    img = np.zeros((H, W, 3), np.float32)
    img = logo(img, W / 2, H / 2 + 20, 8.2, 1.0, T_SETTLED)
    sq = np.clip(img[:, (W - H) // 2:(W + H) // 2], 0, 1)
    a = sq.max(-1)
    rgb = np.where(a[..., None] > 1e-4, sq / np.maximum(a[..., None], 1e-4), 0)
    rgba = np.dstack([rgb[..., ::-1], a])
    rgba = cv2.resize((rgba * 255).astype(np.uint8), (150, 150), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUT, "watermark_150.png"), rgba)


def banner():
    cam = Cam(0.0, z=(1.0, 1.0), canvas=(2300, 1300))
    img = cam.stars(gain=0.8)
    # Jupiter rising from the left edge, Great Red Spot facing us
    globe(img, -60, 600, 640, spin=GRS_SPIN + 0.1, tilt=GRS_TILT - 0.05, light=(0.55, -0.15, 0.82), exposure=0.9)
    # Earth at true scale (R_earth / R_jupiter = 6371 / 69911), same sunlight as Jupiter
    from engine.planet import render_planet
    render_planet(img, 1660, 560, 640 * 6371 / 69911, "earth", spin=3.0, tilt=0.35, light=(0.55, -0.15, 0.82))
    out = post(img, 0, exposure=1.15, bloom=0.4, grain=0.006).astype(np.float32) / 255
    # quiet the middle so the wordmark reads
    xs = np.arange(W, dtype=np.float32)
    out *= (1 - 0.5 * np.exp(-((xs - 960) / 420) ** 2))[None, :, None]
    # mobile/desktop safe area at 1920 scale: x 381..1539, y 382..698 -> centre block on y=540
    out = logo(out, W / 2, 458, 1.8, 1.0, T_SETTLED)
    cards.put(out, cards.sprite(CHANNEL, "light", 104, 0.3), W / 2, 565, (1, 1, 1), 1.0, glow=0.25)
    cards.put(out, cards.sprite(TAGLINE, "mono6", 26, 0.5), W / 2, 640, (1.0, 0.62, 0.32), 1.0)
    cards.put(out, cards.sprite("EARTH, TO SCALE", "mono", 18, 0.4), 1660, 640, (0.85, 0.88, 0.95), 1.0)
    big = cv2.resize(to8(out), (2048, 1152), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(os.path.join(OUT, "banner_2048x1152.png"), big)
    # safe-area guide: what phones (1235x338) and desktop (2048x423) actually show
    g = big.copy()
    cv2.rectangle(g, (406, 407), (1641, 745), (0, 255, 0), 3)
    cv2.rectangle(g, (0, 364), (2047, 787), (0, 200, 255), 3)
    cv2.imwrite(os.path.join(OUT, "_preview_banner_safe_areas.png"), cv2.resize(g, (1024, 576)))


if __name__ == "__main__":
    profile(); watermark(); banner()
    print("written to", os.path.abspath(OUT))
