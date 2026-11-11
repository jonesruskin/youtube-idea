"""Deep-space backdrop and gravitational lensing."""
import numpy as np
import cv2
from .core import (W, H, TEX, cached, fbm, make_starfield, blur, fast_blur, clamp, smooth, span, grid)
import os

CW, CH = 5760, 3240  # space canvas (3x output) – camera pans/zooms inside it


def _ridged(w, h, scale, seed, octaves=6):
    n = fbm(w, h, scale=scale, octaves=octaves, seed=seed)
    return 1 - np.abs(2 * n - 1)


def _build_space():
    from .core import splat_points, star_color
    w, h = CW // 2, CH // 2
    xs, ys = np.mgrid[0:h, 0:w].astype(np.float32)[::-1]
    ang = np.radians(-18)
    cx, cy = w * 0.5, h * 0.55
    s = (xs - cx) * np.cos(ang) + (ys - cy) * np.sin(ang)     # along band
    d = -(xs - cx) * np.sin(ang) + (ys - cy) * np.cos(ang)    # across band
    warp = (fbm(w, h, scale=420, seed=21) - 0.5) * 260
    d = d + warp
    sig = 260 + 120 * fbm(w, h, scale=600, seed=22)
    prof = np.exp(-(d ** 2) / (2 * sig ** 2))
    core = np.exp(-((s + 380) ** 2) / (2 * 520 ** 2)) * np.exp(-(d ** 2) / (2 * 230 ** 2))
    clouds = fbm(w, h, scale=160, seed=23) ** 1.6
    fine = fbm(w, h, scale=40, seed=24)
    dens = prof * (0.25 + 1.2 * clouds) * (0.7 + 0.6 * fine) + core * 0.9
    # dust lanes – dark filaments threaded through the band
    rid = _ridged(w, h, 220, 25) * 0.55 + _ridged(w, h, 60, 26) * 0.45
    lane = smooth(span(rid, 0.78, 0.97)) * np.exp(-(d ** 2) / (2 * (sig * 0.55) ** 2))
    lane2 = smooth(span(fbm(w, h, scale=120, seed=27), 0.55, 0.8)) * prof
    dust = np.clip(lane * 0.95 + lane2 * 0.45, 0, 0.97)
    lum = dens * (1 - dust)
    warm = np.array([1.0, 0.8, 0.6], np.float32)
    blue = np.array([0.7, 0.82, 1.0], np.float32)
    t = np.clip(core * 1.6 + dust * 0.6, 0, 1)[..., None]
    col = blue * (1 - t) + warm * t
    band = lum[..., None] * col * 0.07
    # red emission knots (HII regions) along the band
    hii = smooth(span(fbm(w, h, scale=70, seed=28), 0.82, 0.97)) * prof * (1 - dust)
    band += hii[..., None] * np.array([0.5, 0.08, 0.16], np.float32) * 0.09
    # faint nebular wash everywhere
    n1 = fbm(w, h, scale=500, seed=11)
    n2 = fbm(w, h, scale=300, seed=12)
    band += (n1 ** 3)[..., None] * np.array([0.006, 0.012, 0.03], np.float32) + (n2 ** 4)[..., None] * np.array([0.02, 0.004, 0.02], np.float32)
    band = cv2.resize(band, (CW, CH), interpolation=cv2.INTER_CUBIC)
    densf = cv2.resize(dens * (1 - dust * 0.8), (CW, CH), interpolation=cv2.INTER_LINEAR)
    rng = np.random.default_rng(9)
    buf = np.zeros((CH, CW, 3), np.float32)
    # uniform field
    stars, _ = make_starfield(CW, CH, 90000, seed=3, brightness=1.4, sigma=0)
    buf += stars
    # band-concentrated star clouds (rejection sampling)
    n = 5000000
    px, py = rng.random(n) * CW, rng.random(n) * CH
    keep = rng.random(n) < np.clip(densf[py.astype(int), px.astype(int)] / densf.max(), 0, 1) ** 1.2
    px, py = px[keep], py[keep]
    f = (rng.pareto(2.6, px.size) + 1) ** 1.4 * 0.11
    c = star_color(np.clip(rng.normal(5800, 2200, px.size), 2800, 25000)) * 0.55 + 0.45
    buf = splat_points(buf, px, py, c * f[:, None], sigma=0)
    buf = blur(buf, 0.75)
    bright, _ = make_starfield(CW, CH, 1400, seed=5, mag_power=1.5, brightness=2.6, sigma=1.0)
    img = band + buf + bright
    return img.astype(np.float16)


_SPACE = None
_SPACE_BLUR = None


def space():
    global _SPACE, _SPACE_BLUR
    if _SPACE is None:
        _SPACE = cached("space_v6", _build_space).astype(np.float32)
        _SPACE_BLUR = blur(_SPACE, 3.0)
    return _SPACE, _SPACE_BLUR


def camera_maps(cx, cy, zoom, angle=0.0):
    """Output pixel → canvas coordinates for a camera looking at (cx,cy) with given zoom (output px / canvas px)."""
    xs, ys = grid()
    ca, sa = np.cos(np.radians(angle)), np.sin(np.radians(angle))
    dx, dy = (xs - W / 2) / zoom, (ys - H / 2) / zoom
    return (cx + dx * ca - dy * sa).astype(np.float32), (cy + dx * sa + dy * ca).astype(np.float32)


def lens_maps(mx, my, lx, ly, theta_e, shadow=0.36, scale=1.0):
    """Point-lens deflection applied to an existing coordinate map.
    (lx,ly) lens centre in OUTPUT pixels, theta_e Einstein radius in output px; scale converts output px → map units.
    Returns new maps, demagnification weight, shadow alpha."""
    xs, ys = grid()
    dx, dy = xs - lx, ys - ly
    r2 = dx * dx + dy * dy + 1e-3
    k = theta_e * theta_e / r2
    # β = θ(1 - θE²/θ²): shift sampling point back toward/through the lens
    ox, oy = -dx * k, -dy * k
    nmx = mx + ox * scale
    nmy = my + oy * scale
    r = np.sqrt(r2)
    demag = smooth(span(theta_e / r, 1.15, 2.6))
    sh_r = theta_e * shadow
    shade = clamp((r - sh_r) / 1.6)  # 0 inside the shadow
    return nmx, nmy, demag, shade


def sample(img, mx, my, border=cv2.BORDER_REFLECT):
    return cv2.remap(img, mx.astype(np.float32, copy=False), my.astype(np.float32, copy=False), cv2.INTER_LINEAR, borderMode=border)


def space_frame(cx, cy, zoom, angle=0.0, lenses=(), extra_maps=None):
    """Render the deep-space backdrop through the camera, with optional black-hole lenses.
    lenses: list of (lx, ly, theta_e) in output px."""
    sp, spb = space()
    mx, my = camera_maps(cx, cy, zoom, angle)
    shade_tot = np.ones((H, W), np.float32)
    demag_tot = np.zeros((H, W), np.float32)
    for (lx, ly, te) in lenses:
        mx, my, demag, shade = lens_maps(mx, my, lx, ly, te, scale=1.0 / zoom)
        shade_tot *= shade
        demag_tot = np.maximum(demag_tot, demag)
    img = sample(sp, mx, my)
    if len(lenses):
        img = img * (1 - demag_tot[..., None]) + sample(spb, mx, my) * demag_tot[..., None]
        img *= shade_tot[..., None]
    return img, (mx, my, shade_tot)


def lens_image(img, lx, ly, theta_e, shadow=0.36, ring=0.0):
    """Lens an already-rendered output-size image (e.g. a planet scene)."""
    xs, ys = grid()
    mx, my, demag, shade = lens_maps(xs.copy(), ys.copy(), lx, ly, theta_e, shadow=shadow)
    mx, my = mx.astype(np.float32), my.astype(np.float32)
    out = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    ib = fast_blur(img, 3)
    out = out * (1 - demag[..., None]) + cv2.remap(ib, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT) * demag[..., None]
    out *= shade[..., None]
    if ring > 0:
        r = np.sqrt((xs - lx) ** 2 + (ys - ly) ** 2)
        out += (np.exp(-((r - theta_e * shadow * 1.04) ** 2) / 2.0) * ring)[..., None] * np.array([1.0, 0.9, 0.8], np.float32)
    return out
