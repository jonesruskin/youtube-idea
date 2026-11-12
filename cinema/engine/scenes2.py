"""Scene helpers for line-by-line explanation. All space backgrounds go through `Cam`, so when the camera
zooms or pans the stars zoom and pan with everything else (no frozen starfields)."""
import os
import numpy as np
import cv2
from PIL import Image, ImageDraw
from .core import (W, H, CACHE, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                   fast_blur, fbm, hex2rgb, cached, splat_points, star_color, grid)
from .space import space_frame, lens_image
from .planet import render_planet, render_sun_disk, render_rings, tex, coast_mask


class Cam:
    """A 2D camera over a scene: zoom about the screen centre plus a slow pan. Use it for BOTH the starfield and
    everything placed in the scene."""

    def __init__(self, u, z=(1.0, 1.08), pan=(0.0, 0.0), canvas=(2800, 1500), angle=(0.0, 0.0)):
        k = smoother(u)
        self.z = lerp(z[0], z[1], k)
        self.px, self.py = pan[0] * (k - 0.5), pan[1] * (k - 0.5)
        self.canvas = canvas
        self.ang = lerp(angle[0], angle[1], k)

    def p(self, x, y):
        """Scene point (designed at zoom 1) → screen."""
        return W / 2 + (x - W / 2) * self.z + self.px, H / 2 + (y - H / 2) * self.z + self.py

    def r(self, rr):
        return rr * self.z

    def stars(self, lenses=(), star_zoom=0.6, gain=1.0):
        """Starfield through the camera. Stars are 'far': they take a fraction of the zoom (like a real dolly+zoom)."""
        sz = self.z ** star_zoom
        cx = self.canvas[0] - self.px / sz * 0.6
        cy = self.canvas[1] - self.py / sz * 0.6
        img, _ = space_frame(cx, cy, sz, angle=self.ang, lenses=lenses)
        return img * gain


def black(gain=0.0):
    return np.zeros((H, W, 3), np.float32) + gain


# ───────────── telescope eyepiece view ─────────────
def scope_view(img, strength=1.0, reticle=True):
    xs, ys = grid()
    r = np.sqrt((xs - W / 2) ** 2 + (ys - H / 2) ** 2)
    m = clamp((470 - r) / 14)
    vig = 1 - 0.35 * clamp(r / 470) ** 3
    out = img * (m * vig)[..., None]
    return out * strength + img * (1 - strength)


# ───────────── night city seen from orbit/aircraft ─────────────
def _city_map():
    rng = np.random.default_rng(21)
    S = 2048
    m = np.zeros((S, S), np.float32)
    # radial density, major roads, grid streets
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    dens = np.exp(-(((xx - S * 0.5) ** 2 + (yy - S * 0.52) ** 2) / (2 * (S * 0.32) ** 2)))
    dens = dens * (0.6 + 0.8 * fbm(S, S, scale=120, seed=22))
    img = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(img)
    for k in range(9):
        a = k * np.pi / 9 + rng.uniform(-0.1, 0.1)
        x0, y0 = S / 2 - np.cos(a) * S, S * 0.52 - np.sin(a) * S
        x1, y1 = S / 2 + np.cos(a) * S, S * 0.52 + np.sin(a) * S
        d.line([(x0, y0), (x1, y1)], fill=255, width=4)
    for r_ in (260, 520):
        d.ellipse([S / 2 - r_, S * 0.52 - r_, S / 2 + r_, S * 0.52 + r_], outline=200, width=3)
    roads = np.asarray(img, np.float32) / 255
    grid_ = ((xx % 23 < 1.6) | (yy % 23 < 1.6)).astype(np.float32)
    warp = fbm(S, S, scale=300, seed=23)
    grid_ = cv2.remap(grid_, (xx + warp * 60).astype(np.float32), (yy + warp * 60).astype(np.float32), cv2.INTER_LINEAR)
    m = roads * 0.35 + grid_ * dens * 0.8
    dots = (rng.random((S, S)) < dens * 0.09).astype(np.float32) * rng.random((S, S))
    blobs = fbm(S, S, scale=40, seed=24) ** 3 * dens
    m = m * (0.4 + 1.2 * fbm(S, S, scale=25, seed=25)) + dots * 1.8 + blobs * 0.6
    # river
    m *= clamp(dens * 2.2)
    m = blur(m, 0.8) + blur(m, 6) * 0.5
    return m.astype(np.float16)


def city_aerial(cam_z=1.0, panx=0.0):
    m = cached("city_v3", _city_map).astype(np.float32)
    S = m.shape[0]
    z = 0.62 * cam_z
    M = cv2.getRotationMatrix2D((S / 2, S / 2), 12, z)
    M[0, 2] += W / 2 - S / 2 + panx
    M[1, 2] += H / 2 - S / 2
    v = cv2.warpAffine(m, M, (W, H), flags=cv2.INTER_LINEAR)
    col = np.array([1.0, 0.62, 0.28], np.float32)
    base = np.zeros((H, W, 3), np.float32) + np.array([0.004, 0.006, 0.01], np.float32)
    return base + v[..., None] * col * 0.55, 0.62 * cam_z * 1.0  # px per map px


# ───────────── underground cross-section ─────────────
def _strata():
    w, h = W, H
    yy = np.arange(h, dtype=np.float32)[:, None]
    n1 = fbm(w, h, scale=90, seed=31, octaves=5)
    n2 = fbm(w, h, scale=12, seed=32, octaves=3)
    band = np.sin((yy + n1 * 160) / 38.0) * 0.5 + 0.5
    base = np.stack([0.20 + 0.06 * band, 0.15 + 0.04 * band, 0.12 + 0.03 * band], -1) * (0.75 + 0.5 * n2[..., None])
    deep = clamp((yy - 300) / 700)[..., None]
    base = base * (1 - deep * 0.45) + np.array([0.12, 0.1, 0.11], np.float32) * deep * 0.5
    return (base * 0.5).astype(np.float16)


def cross_section(t, dig=1.0, shelters=1.0, lights=1.0, heat=0.0, people=0.0):
    """Side cut through the ground: sky strip, soil, rock strata, shafts and shelters being built."""
    img = cached("strata_v2", _strata).astype(np.float32).copy()
    surf = 250
    img[:surf] = lerp(hex2rgb("#071230"), hex2rgb("#203450"), (np.arange(surf)[:, None, None] / surf)) * 0.35
    stars, _ = space_frame(1400 + t * 4, 900, 1.6)
    img[:surf] += stars[:surf] * 0.4
    img[surf:surf + 26] = img[surf:surf + 26] * 0.6 + np.array([0.02, 0.035, 0.015], np.float32)
    # surface town silhouette
    rng = np.random.default_rng(3)
    x = 0
    while x < W:
        bw, bh = rng.integers(30, 80), rng.integers(10, 60)
        img[surf - bh:surf, x:x + bw] = 0.006
        for wy in range(surf - bh + 6, surf - 4, 10):
            for wx in range(x + 4, x + bw - 4, 9):
                if rng.random() < 0.35:
                    img[wy:wy + 4, wx:wx + 3] += np.array([1.2, 0.8, 0.35], np.float32) * 0.25
        x += bw + rng.integers(4, 30)
    L = np.zeros((H, W), np.float32)
    # main shaft dug progressively
    depth = surf + 26 + (H - 140 - surf) * clamp(dig)
    shaft_x = 960
    L[surf:int(depth), shaft_x - 22:shaft_x + 22] = 1
    # shelters: three levels
    rooms = [(520, 520, 420), (960, 700, 560), (1400, 860, 420)]
    for k, (cx, cy, wd) in enumerate(rooms):
        a = clamp(shelters * 3 - k)
        if a <= 0 or cy > depth + 40:
            continue
        hw = wd / 2 * smooth(a)
        L[int(cy - 55):int(cy + 55), int(cx - hw):int(cx + hw)] = 1
        L[int(cy - 6):int(cy + 6), min(shaft_x, int(cx)):max(shaft_x, int(cx))] = 1
    Ls = blur(L, 1.2)
    inner = np.array([0.05, 0.055, 0.07], np.float32)
    img = img * (1 - Ls[..., None]) + inner * Ls[..., None]
    # warm interior lights
    for k, (cx, cy, wd) in enumerate(rooms):
        a = clamp(shelters * 3 - k) * lights
        if a <= 0:
            continue
        for lx in np.arange(cx - wd / 2 + 30, cx + wd / 2 - 20, 60):
            glow_dot(img, lx, cy - 40, (1.0, 0.8, 0.5), 6, 0.6 * a)
        img[int(cy - 55):int(cy + 55), int(cx - wd / 2):int(cx + wd / 2)] += np.array([0.08, 0.06, 0.035], np.float32) * a
    if heat > 0:
        yy = np.arange(H, dtype=np.float32)[:, None, None]
        img += clamp((yy - 820) / 260) * np.array([0.5, 0.15, 0.03], np.float32) * 0.35 * heat
    rim = (L - blur(L, 3)).clip(0, 1)
    img += rim[..., None] * np.array([0.6, 0.5, 0.4], np.float32) * 0.5
    if dig < 1:
        glow_dot(img, shaft_x, depth, (1.0, 0.75, 0.4), 14, 1.2)
        glow_dot(img, shaft_x, depth, (1.0, 0.6, 0.3), 60, 0.25)
    return img


# ───────────── Earth cutaway (layers) ─────────────
def earth_cutaway(img, cx, cy, R, spin, reveal=1.0, light=(-0.7, 0.3, 0.65)):
    """Earth with a wedge removed showing crust, mantle, outer and inner core."""
    img, a = render_planet(img, cx, cy, R, "earth", spin=spin, tilt=0.35, light=light)
    if reveal <= 0:
        return img
    xs, ys = grid()
    dx, dy = xs - cx, ys - cy
    r = np.sqrt(dx * dx + dy * dy) / R
    ang = np.arctan2(dy, dx)
    open_ang = np.radians(80) * smooth(reveal)
    wedge = (ang > -np.pi / 2 - 0.0) & (ang < -np.pi / 2 + open_ang) & (r < 1)
    wedge = wedge.astype(np.float32)
    layers = np.zeros((H, W, 3), np.float32)
    def band(r0, r1, c0, c1):
        k = clamp((r - r0) / (r1 - r0))
        m = ((r >= r0) & (r < r1)).astype(np.float32)
        return m[..., None] * lerp(np.asarray(c0, np.float32), np.asarray(c1, np.float32), k[..., None])
    layers += band(0.0, 0.19, (2.2, 1.9, 1.3), (1.8, 1.4, 0.7))      # inner core
    layers += band(0.19, 0.55, (1.6, 0.8, 0.25), (1.2, 0.45, 0.12))   # outer core
    layers += band(0.55, 0.985, (0.9, 0.28, 0.08), (0.45, 0.16, 0.08))  # mantle
    layers += band(0.985, 1.0, (0.4, 0.33, 0.25), (0.35, 0.3, 0.25))   # crust
    edge = np.exp(-np.abs(ang - (-np.pi / 2)) * R / 3) + np.exp(-np.abs(ang - (-np.pi / 2 + open_ang)) * R / 3)
    shade = 0.8 + 0.2 * (1 - np.clip(edge, 0, 1))
    img = img * (1 - wedge[..., None]) + layers * wedge[..., None] * shade[..., None]
    return img


# ───────────── vertical descent through ice into the dark ocean ─────────────
def ice_column(depth_frac, t):
    """depth_frac 0 = at the frozen surface looking down the column, 1 = deep ocean with the sea floor."""
    yy = np.arange(H, dtype=np.float32)[:, None, None]
    span_px = 5200
    y0 = depth_frac * (span_px - H)
    Y = yy + y0
    ice_top, ice_bot = 600, 2600
    sky = (Y < ice_top).astype(np.float32)
    icem = ((Y >= ice_top) & (Y < ice_bot)).astype(np.float32)
    water = (Y >= ice_bot).astype(np.float32)
    n = fbm(W, H, scale=60, seed=81, octaves=4)
    cr = 1 - np.abs(2 * fbm(W, H, scale=110, seed=82, octaves=4) - 1)
    img = sky * np.array([0.004, 0.006, 0.014], np.float32)
    st, _ = space_frame(3000, 1400 + y0 * 0.05, 1.2)
    img = img + st * sky * 0.6
    ice_c = lerp(np.array([0.10, 0.16, 0.22], np.float32), np.array([0.01, 0.025, 0.05], np.float32), clamp((Y - ice_top) / (ice_bot - ice_top)))
    xs_ = np.arange(W, dtype=np.float32)[None, :, None]
    shaft = np.exp(-((xs_ - W / 2) / 520) ** 2)
    ice_c = ice_c * (0.85 + 0.25 * n[..., None]) * (0.55 + 0.9 * shaft) + (cr > 0.985)[..., None] * 0.012
    img = img + icem * ice_c * 0.5
    bubbles = np.zeros((H, W, 3), np.float32)
    rng = np.random.default_rng(83)
    pts = rng.random((900, 2))
    by = (pts[:, 1] * span_px - y0)
    sel = (by > 0) & (by < H) & ((pts[:, 1] * span_px > ice_top) & (pts[:, 1] * span_px < ice_bot))
    bubbles = splat_points(bubbles, pts[sel, 0] * W, by[sel], np.full((sel.sum(), 3), 0.25, np.float32), sigma=1.2)
    img += bubbles
    wc = lerp(np.array([0.004, 0.02, 0.04], np.float32), np.array([0.0, 0.004, 0.01], np.float32), clamp((Y - ice_bot) / 2000))
    img = img + water * wc
    floor = 4900
    fl = clamp((Y - floor + (fbm(W, 1, scale=80, seed=84)[0][None, :, None] - 0.5) * 120) / 3)
    img = img * (1 - fl) + fl * np.array([0.01, 0.008, 0.008], np.float32)
    # faint warm glow from the vents on the floor
    xs = np.arange(W, dtype=np.float32)[None, :, None]
    img += np.exp(-((xs - 1100) ** 2) / (2 * 220 ** 2)) * np.exp(-np.clip(floor - Y, 0, None) / 500) * water * np.array([0.5, 0.18, 0.04], np.float32) * 0.6
    return img


# ───────────── icy bodies ─────────────
def icy_bodies(img, t, n=26, seed=91, speed=1.0, out_frac=0.0, cam=None):
    rng = np.random.default_rng(seed)
    for k in range(n):
        x0, y0 = rng.random() * W, rng.random() * H
        r = rng.uniform(4, 60) ** 1.0
        vx, vy = rng.normal(0, 22), rng.normal(0, 14)
        x = (x0 + vx * t * speed) % (W + 200) - 100
        y = (y0 + vy * t * speed) % (H + 200) - 100
        if cam is not None:
            x, y = cam.p(x, y)
            r = cam.r(r)
        tmp = np.zeros_like(img)
        render_planet(tmp, x, y, r, "moon", spin=rng.random() * 6 + t * rng.uniform(-0.3, 0.3), tilt=rng.uniform(-1, 1),
                      light=(-0.85, 0.25, 0.35), atmo=(0, 0, 0), exposure=0.35 + rng.random() * 0.35, stretch=rng.uniform(1.0, 1.6),
                      roll=rng.uniform(0, 3))
        m = (tmp.max(-1, keepdims=True) > 1e-4).astype(np.float32)
        img = img * (1 - m) + tmp * np.array([0.85, 0.95, 1.1], np.float32)
    return img
