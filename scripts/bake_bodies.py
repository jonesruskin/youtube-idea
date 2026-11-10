"""Bake real celestial bodies into orthographic discs: public/bodies/<name>.png (1024 px, transparent outside the limb).

Sources (docs/00 P13: every Sun, Moon, Earth and planet on screen is drawn from a real map, never by hand):
  moon     NASA SVS CGI Moon Kit (LRO LROC colour mosaic), public domain; near side facing us, as seen from Earth
  earth-*  NASA Blue Marble (public/earth/day.jpg) with clouds (public/earth/clouds.jpg), public domain
  planets  Solar System Scope textures (CC BY 4.0, credited in every episode description), from NASA mission data
Run: ~/.venv-sun/bin/python scripts/bake_bodies.py
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "bodies")
N = 1024

# name: (texture, clouds, view centre lon, lat, limb darkening, tilt degrees)
BODIES = {
    "moon": ("planets/moon.jpg", None, 0, 0, 0.12, 0),
    "earth-atlantic": ("earth/day.jpg", "earth/clouds.jpg", -25, 12, 0.35, 0),
    "earth-pacific": ("earth/day.jpg", "earth/clouds.jpg", -160, 5, 0.35, 0),
    "earth-asia": ("earth/day.jpg", "earth/clouds.jpg", 85, 18, 0.35, 0),
    "venus": ("planets/venus.jpg", None, 0, 0, 0.3, 0),
    "mars": ("planets/mars.jpg", None, -60, 10, 0.3, 0),
    "mercury": ("planets/mercury.jpg", None, 0, 0, 0.15, 0),
    "jupiter": ("planets/jupiter.jpg", None, 0, 0, 0.35, 0),
    "saturn": ("planets/saturn.jpg", None, 0, 0, 0.35, 0),
}


def load(rel):
    return np.asarray(Image.open(os.path.join(ROOT, "public", rel)).convert("RGB"), dtype=np.float32)


def bake(name, tex, clouds, lon0, lat0, limb):
    T = load(tex)
    C = load(clouds) if clouds else None
    h, w, _ = T.shape
    s = (np.arange(N) + 0.5) / N * 2 - 1
    X, Y = np.meshgrid(s, -s)
    R2 = X * X + Y * Y
    inside = R2 <= 1
    Z = np.sqrt(np.clip(1 - R2, 0, 1))
    la0, lo0 = np.radians(lat0), np.radians(lon0)
    # rotate view-space (x right, y up, z towards us) to the body frame
    lat = np.arcsin(np.clip(Y * np.cos(la0) + Z * np.sin(la0), -1, 1))
    lon = lo0 + np.arctan2(X, Z * np.cos(la0) - Y * np.sin(la0))
    u = ((lon / (2 * np.pi) + 0.5) % 1) * (w - 1)
    v = (0.5 - lat / np.pi) * (h - 1)
    ui, vi = u.astype(int), v.astype(int)
    rgb = T[vi, ui]
    if C is not None:
        ch, cw, _ = C.shape
        cl = C[(v / (h - 1) * (ch - 1)).astype(int), (u / (w - 1) * (cw - 1)).astype(int)].mean(axis=2, keepdims=True) / 255
        rgb = rgb * (1 - cl * 0.85) + 255 * cl * 0.85
    if name == "moon":
        # the LRO mosaic is an albedo map (mid-grey); the full Moon in the sky reads bright: stretch so the highlands
        # sit near white and the maria stay clearly darker (the same contrast the eye sees)
        lo, hi = np.percentile(rgb[inside], [1, 99.5])
        rgb = np.clip((rgb - lo) / (hi - lo), 0, 1) ** 0.8 * 250
    shade = (1 - limb) + limb * Z[..., None]
    rgb = np.clip(rgb * shade, 0, 255)
    r = np.sqrt(R2)
    alpha = np.clip((1 - r) * N / 2, 0, 1)  # one-pixel antialiased limb
    out = np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8)
    out[~inside, :3] = 0
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, f"{name}.png"), optimize=True)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, (tex, clouds, lo, la, limb, _tilt) in BODIES.items():
        bake(name, tex, clouds, lo, la, limb)
        print("baked", name)
