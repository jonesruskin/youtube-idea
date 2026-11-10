"""Bake the series' celestial bodies: real geography, drawn in the show's flat cartoon style (docs/00 P13).

The CEO's two rules, in order:
  1. "the Moon and the Earth don't resemble reality" -> every shape comes from a real map: continents and coasts from NASA
     Blue Marble, the Moon's seas from NASA LRO with its big craters at their true positions and sizes, Jupiter's bands
     and Great Red Spot, Mars's dark plains and polar cap, all from mission maps.
  2. "the real image looks odd with the animation" -> those maps are redrawn flat: a handful of solid colours per body
     (posterised, speckle-free), inked coastlines and crater rims, no photographic texture. Light and the ink outline
     are added on screen (src/fx/bodies.tsx, src/fx/PhotoGlobe.tsx) the same way the characters are lit.

Outputs
  public/toon/<map>.png       equirectangular toon maps (earth-day, earth-night, earth-clouds, moon, planets)
  public/bodies/<name>.png    orthographic discs baked from those maps (nearest sampling, so colours stay flat)
  public/bodies/manifest.json sha256 + colour count of every file; scripts/real-bodies.ts refuses anything else
Sources: NASA Blue Marble / Black Marble (public/earth), NASA SVS CGI Moon Kit (public/planets/moon.jpg),
Solar System Scope maps from NASA data (public/planets, CC BY 4.0, credited in every description).
Run: ~/.venv-sun/bin/python scripts/bake_bodies.py
"""
import hashlib
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..")
PUB = os.path.join(ROOT, "public")
TOON = os.path.join(PUB, "toon")
OUT = os.path.join(PUB, "bodies")
W, H = 2048, 1024
N = 1024


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def load(rel, size=(W, H)):
    return Image.open(os.path.join(PUB, rel)).convert("RGB").resize(size, Image.LANCZOS)


def paint(labels, palette):
    """labels (H×W int) -> RGB image using palette[label]."""
    pal = np.array([hexrgb(c) for c in palette], np.uint8)
    return Image.fromarray(pal[labels], "RGB")


def clean(labels, size=7):
    """Mode-filter the label map so regions are solid shapes, not speckle."""
    img = Image.fromarray(labels.astype(np.uint8), "L").filter(ImageFilter.ModeFilter(size))
    return np.asarray(img).astype(np.int32)


def edges(labels, pairs=None):
    """Boolean map of pixels where the label changes (to the right or below); `pairs` limits which borders count."""
    e = np.zeros(labels.shape, bool)
    for dy, dx in ((0, 1), (1, 0)):
        a = labels
        b = np.roll(labels, (-dy, -dx), axis=(0, 1))
        d = a != b
        if pairs is not None:
            m = np.zeros_like(d)
            for p, q in pairs:
                m |= ((a == p) & np.isin(b, q)) | (np.isin(a, q) & (b == p))
            d &= m
        e |= d
    return e


# ── Earth ──────────────────────────────────────────────────────────────────────────────────────────────────
EARTH = ["#2F74B5", "#3F8F4F", "#63A957", "#A9B45C", "#E2C27C", "#F3F6F9"]  # ocean, forest, green, savanna, desert, ice


def earth_day():
    a = np.asarray(load("earth/day.jpg").filter(ImageFilter.GaussianBlur(1.5)), np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (r + g + b) / 3
    sat = a.max(-1) - a.min(-1)
    lab = np.full(lum.shape, 2, np.int32)  # green
    lab[(g >= r) & (lum < 62)] = 1  # forest
    lab[(r > g - 4) & (r < g + 22) & (lum >= 62)] = 3  # savanna / steppe
    lab[(r >= g + 8) & (r > b + 30) & (lum > 95)] = 4  # desert
    lab[(lum > 175) & (sat < 45)] = 5  # ice
    lab[(b > r + 12) & (b >= g - 6) & (lum < 150)] = 0  # ocean (deep and shallow)
    lab = clean(lab, 7)
    img = np.asarray(paint(lab, EARTH)).copy()
    coast = edges(lab, [(0, [1, 2, 3, 4, 5])])
    coast = np.asarray(Image.fromarray(coast.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    img[coast] = hexrgb("#1D4E80")  # inked coastline, dark blue like the show's water outlines
    return Image.fromarray(img), len(EARTH) + 1


def earth_night():
    a = np.asarray(load("earth/night.jpg").filter(ImageFilter.GaussianBlur(1.2)).convert("L"), np.float32)
    on = a > 70
    on = np.asarray(Image.fromarray(on.astype(np.uint8) * 255).filter(ImageFilter.ModeFilter(3))) > 0
    img = np.zeros((H, W, 3), np.uint8)
    img[on] = hexrgb("#FFD27A")
    return Image.fromarray(img), 2


def earth_clouds():
    a = np.asarray(load("earth/clouds.jpg").filter(ImageFilter.GaussianBlur(2.5)).convert("L"), np.float32) / 255
    m = (a > 0.58).astype(np.int32)
    m = clean(m, 9)
    img = np.zeros((H, W, 3), np.uint8)
    img[m == 1] = 255
    return Image.fromarray(img), 2


# ── Moon ───────────────────────────────────────────────────────────────────────────────────────────────────
MOON = ["#9A9684", "#BDB8A6", "#E6E1D0", "#F8F5EA"]  # maria, mixed, highlands, ray-bright
# real craters: (name, lon E, lat, radius km); drawn as inked rims at their true place and size
CRATERS = [
    ("Tycho", -11.4, -43.3, 43), ("Copernicus", -20.1, 9.6, 46.5), ("Kepler", -38.0, 8.1, 15.5), ("Aristarchus", -47.4, 23.7, 20),
    ("Plato", -9.3, 51.6, 50.5), ("Clavius", -14.1, -58.4, 112), ("Grimaldi", -68.3, -5.2, 86), ("Ptolemaeus", -1.9, -9.2, 77),
    ("Langrenus", 61.0, -8.9, 66), ("Theophilus", 26.4, -11.4, 50), ("Petavius", 60.4, -25.3, 94), ("Archimedes", -4.0, 29.7, 41),
    ("Eratosthenes", -11.3, 14.5, 29), ("Posidonius", 29.9, 31.9, 47.5), ("Maginus", -6.3, -50.0, 97), ("Longomontanus", -21.8, -49.6, 72.5),
]


def moon():
    a = np.asarray(load("planets/moon.jpg").filter(ImageFilter.GaussianBlur(3)).convert("L"), np.float32)
    # thresholds by true area (an equirectangular map over-counts the poles): the maria are ~16% of the lunar surface
    wt = np.repeat(np.cos(np.radians(90 - (np.arange(H) + 0.5) / H * 180))[:, None], W, 1).ravel()
    order = np.argsort(a.ravel())
    cum = np.cumsum(wt[order]) / wt.sum()
    q1, q2, q3 = (a.ravel()[order][np.searchsorted(cum, f)] for f in (0.16, 0.21, 0.97))
    lab = np.digitize(a, [q1, q2, q3]).astype(np.int32)
    lab = clean(lab, 7)
    img = paint(lab, MOON)
    d = ImageDraw.Draw(img)
    px = W / 360
    for _, lon, lat, rkm in CRATERS:
        rd = rkm / 1737.4 * 180 / np.pi  # radius in degrees of arc
        cx, cy = (lon + 180) * px, (90 - lat) * px
        rx, ry = rd * px / max(0.2, np.cos(np.radians(lat))), rd * px
        # floor one step darker, rim inked, a lit lip on the upper-left like the show's other round shapes
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=hexrgb("#C9C4B2"), outline=hexrgb("#858070"), width=max(3, int(ry * 0.16)))
        d.arc([cx - rx * 0.86, cy - ry * 0.86, cx + rx * 0.86, cy + ry * 0.86], 150, 300, fill=hexrgb("#F6F3E8"), width=max(1, int(ry * 0.1)))
    return img, len(MOON) + 3


# ── planets ────────────────────────────────────────────────────────────────────────────────────────────────
def posterise(rel, colours, blur=2.0, mode=7, lift=1.0):
    img = load(rel).filter(ImageFilter.GaussianBlur(blur))
    q = img.quantize(colors=colours, method=Image.MEDIANCUT)
    lab = clean(np.asarray(q).astype(np.int32), mode)
    pal = np.array(q.getpalette()[: colours * 3], np.float32).reshape(-1, 3)
    # a touch more saturation: flat cartoon colours, not photo greys
    m = pal.mean(1, keepdims=True)
    pal = np.clip(m + (pal - m) * 1.35 * lift, 0, 255).astype(np.uint8)
    return Image.fromarray(pal[lab], "RGB"), colours


MAPS = {
    "earth-day": earth_day,
    "earth-night": earth_night,
    "earth-clouds": earth_clouds,
    "moon": moon,
    "jupiter": lambda: posterise("planets/jupiter.jpg", 6, 1.5, 5),
    "saturn": lambda: posterise("planets/saturn.jpg", 4, 2.0, 7),
    "mars": lambda: posterise("planets/mars.jpg", 4, 2.5, 7, lift=0.72),
    "venus": lambda: posterise("planets/venus.jpg", 3, 4.0, 9),
    "mercury": lambda: posterise("planets/mercury.jpg", 3, 3.0, 7),
}

# disc name: (map, view lon, lat, clouds)
DISCS = {
    "moon": ("moon", 0, 0, False),
    "earth-atlantic": ("earth-day", -25, 12, False),
    "earth-pacific": ("earth-day", -160, 5, False),
    "earth-asia": ("earth-day", 85, 18, False),
    "venus": ("venus", 0, 0, False),
    "mars": ("mars", -60, 10, False),
    "mercury": ("mercury", 0, 0, False),
    "jupiter": ("jupiter", 0, 0, False),
    "saturn": ("saturn", 0, 0, False),
}


def disc(tex, clouds, lon0, lat0):
    T = np.asarray(tex)
    C = np.asarray(clouds)[..., 0] if clouds is not None else None
    s = (np.arange(N) + 0.5) / N * 2 - 1
    X, Y = np.meshgrid(s, -s)
    R2 = X * X + Y * Y
    Z = np.sqrt(np.clip(1 - R2, 0, 1))
    la0, lo0 = np.radians(lat0), np.radians(lon0)
    lat = np.arcsin(np.clip(Y * np.cos(la0) + Z * np.sin(la0), -1, 1))
    lon = lo0 + np.arctan2(X, Z * np.cos(la0) - Y * np.sin(la0))
    u = (((lon / (2 * np.pi) + 0.5) % 1) * (W - 1)).astype(int)
    v = ((0.5 - lat / np.pi) * (H - 1)).astype(int)
    rgb = T[v, u].astype(np.float32)
    if C is not None:
        cl = (C[v, u] > 127)[..., None]
        rgb = np.where(cl, rgb * 0.15 + 255 * 0.85, rgb)  # flat white cloud shapes
    alpha = np.clip((1 - np.sqrt(R2)) * N / 2, 0, 1)
    out = np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8)
    out[R2 > 1, :3] = 0
    return Image.fromarray(out, "RGBA")


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


if __name__ == "__main__":
    os.makedirs(TOON, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    manifest = {"style": "toon", "files": {}}
    maps = {}
    for name, fn in MAPS.items():
        img, colours = fn()
        p = os.path.join(TOON, f"{name}.png")
        img.save(p, optimize=True)
        maps[name] = img
        manifest["files"][f"toon/{name}.png"] = {"sha256": sha(p), "colours": colours}
        print("map ", name, colours, "colours")
    for name, (m, lo, la, cl) in DISCS.items():
        img = disc(maps[m], maps["earth-clouds"] if cl else None, lo, la)
        p = os.path.join(OUT, f"{name}.png")
        img.save(p, optimize=True)
        manifest["files"][f"bodies/{name}.png"] = {"sha256": sha(p), "from": f"toon/{m}.png"}
        print("disc", name)
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
