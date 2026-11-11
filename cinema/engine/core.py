"""Core utilities for the cinematic renderer: maths, noise, compositing, post-processing."""
import os
import numpy as np
import cv2

W, H = 1920, 1080
FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(ROOT)
TEX = os.path.join(ROOT, "assets", "tex")
CACHE = os.path.join(ROOT, "assets", "cache")
FONTS = os.path.join(REPO, "public", "fonts")
os.makedirs(CACHE, exist_ok=True)

cv2.setNumThreads(1)  # we parallelise across processes


# ───────────────────────── easing / maths ─────────────────────────
def clamp(x, a=0.0, b=1.0):
    return np.minimum(np.maximum(x, a), b)


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def smoother(x):
    x = clamp(x)
    return x * x * x * (x * (x * 6 - 15) + 10)


def ease_out(x, p=3):
    x = clamp(x)
    return 1 - (1 - x) ** p


def ease_in(x, p=3):
    return clamp(x) ** p


def lerp(a, b, t):
    return a + (b - a) * t


def span(u, a, b):
    """0→1 as u goes a→b (clamped)."""
    return clamp((u - a) / max(1e-9, b - a))


def window(u, a, b, fade=0.08):
    """1 inside [a,b] with soft edges."""
    return smooth(span(u, a, a + fade)) * (1 - smooth(span(u, b - fade, b)))


def hex2rgb(h, gain=1.0):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32) * gain


# ───────────────────────── grids / noise ─────────────────────────
_GRID = {}


def grid(w=W, h=H):
    k = (w, h)
    if k not in _GRID:
        ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
        _GRID[k] = (xs, ys)
    return _GRID[k]


def fbm(w, h, scale=200.0, octaves=6, seed=0, persistence=0.5):
    """Fractal value noise in [0,1], built by upscaling random grids (fast, smooth)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    s = scale
    for _ in range(octaves):
        gw, gh = max(2, int(w / s) + 2), max(2, int(h / s) + 2)
        g = rng.random((gh, gw)).astype(np.float32)
        up = cv2.resize(g, (int(gw * s), int(gh * s)), interpolation=cv2.INTER_CUBIC)
        ox, oy = rng.integers(0, max(1, up.shape[1] - w)), rng.integers(0, max(1, up.shape[0] - h))
        out += amp * up[oy:oy + h, ox:ox + w]
        tot += amp
        amp *= persistence
        s /= 2.0
        if s < 1.5:
            break
    out /= tot
    lo, hi = np.percentile(out, 1), np.percentile(out, 99)
    return clamp((out - lo) / (hi - lo + 1e-6))


def cached(name, fn):
    p = os.path.join(CACHE, name + ".npy")
    if os.path.exists(p):
        return np.load(p, mmap_mode=None)
    a = fn()
    np.save(p, a)
    return a


# ───────────────────────── image ops ─────────────────────────
def blur(img, sigma):
    if sigma <= 0.3:
        return img
    return cv2.GaussianBlur(img, (0, 0), sigma, borderType=cv2.BORDER_REFLECT)


def fast_blur(img, sigma):
    """Large blurs via downsample → blur → upsample."""
    if sigma < 6:
        return blur(img, sigma)
    f = int(min(16, max(2, sigma // 3)))
    h, w = img.shape[:2]
    small = cv2.resize(img, (w // f, h // f), interpolation=cv2.INTER_AREA)
    small = blur(small, sigma / f)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)


def over(dst, src_rgb, alpha):
    """Alpha-composite src over dst. alpha is HxW or HxWx1."""
    if alpha.ndim == 2:
        alpha = alpha[..., None]
    return dst * (1 - alpha) + src_rgb * alpha


def affine_view(img, cx, cy, zoom, angle=0.0, out_w=W, out_h=H, border=cv2.BORDER_REFLECT):
    """Camera: look at (cx,cy) in img pixels, zoom (out px per img px), rotate (deg)."""
    M = cv2.getRotationMatrix2D((cx, cy), angle, zoom)
    M[0, 2] += out_w / 2 - cx
    M[1, 2] += out_h / 2 - cy
    return cv2.warpAffine(img, M, (out_w, out_h), flags=cv2.INTER_LINEAR, borderMode=border)


def radial(cx, cy, w=W, h=H):
    xs, ys = grid(w, h)
    return np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)


def glow_dot(img, x, y, color, radius, intensity=1.0):
    """Additive gaussian glow centred at (x,y), computed on a local patch."""
    h, w = img.shape[:2]
    r = int(radius * 4) + 2
    x0, x1 = int(max(0, x - r)), int(min(w, x + r))
    y0, y1 = int(max(0, y - r)), int(min(h, y + r))
    if x1 <= x0 or y1 <= y0:
        return img
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    g = np.exp(-((xs - x) ** 2 + (ys - y) ** 2) / (2 * radius * radius)) * intensity
    img[y0:y1, x0:x1] += g[..., None] * np.asarray(color, np.float32)
    return img


def star_spikes(img, x, y, color, length, intensity=1.0, angle=0.0, thick=1.2):
    """Four-point diffraction spikes (additive), local patch."""
    h, w = img.shape[:2]
    r = int(length) + 2
    x0, x1 = int(max(0, x - r)), int(min(w, x + r))
    y0, y1 = int(max(0, y - r)), int(min(h, y + r))
    if x1 <= x0 or y1 <= y0:
        return img
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = xs - x, ys - y
    ca, sa = np.cos(np.radians(angle)), np.sin(np.radians(angle))
    u, v = dx * ca + dy * sa, -dx * sa + dy * ca
    g = np.zeros_like(u)
    for a, b in ((u, v), (v, u)):
        g += np.exp(-(b ** 2) / (2 * thick ** 2)) * np.exp(-np.abs(a) / (length * 0.28))
    img[y0:y1, x0:x1] += (g * intensity)[..., None] * np.asarray(color, np.float32)
    return img


# ───────────────────────── stars ─────────────────────────
def star_color(temp):
    """Approximate blackbody colour for temperature in K (vectorised)."""
    t = np.asarray(temp, np.float32) / 100.0
    r = np.where(t <= 66, 255.0, 329.7 * np.power(np.maximum(t - 60, 1e-3), -0.1332))
    g = np.where(t <= 66, 99.47 * np.log(np.maximum(t, 1e-3)) - 161.1, 288.1 * np.power(np.maximum(t - 60, 1e-3), -0.0755))
    b = np.where(t >= 66, 255.0, np.where(t <= 19, 0.0, 138.5 * np.log(np.maximum(t - 10, 1e-3)) - 305.0))
    c = np.stack([r, g, b], -1) / 255.0
    return np.clip(c, 0, 1).astype(np.float32)


def splat_points(buf, xs, ys, vals, sigma=0.7):
    """Bilinear splat of point fluxes (N,3) into buf, then a tiny PSF blur."""
    h, w = buf.shape[:2]
    x0 = np.floor(xs).astype(np.int64)
    y0 = np.floor(ys).astype(np.int64)
    fx, fy = (xs - x0).astype(np.float32), (ys - y0).astype(np.float32)
    for dx, dy, wt in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        xi, yi = x0 + dx, y0 + dy
        m = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
        idx = yi[m] * w + xi[m]
        for c in range(3):
            buf[..., c] += np.bincount(idx, weights=vals[m, c] * wt[m], minlength=w * h).reshape(h, w).astype(np.float32)
    return blur(buf, sigma) if sigma > 0 else buf


def make_starfield(w, h, n, seed=1, mag_power=2.4, brightness=1.0, sigma=0.75):
    rng = np.random.default_rng(seed)
    xs = rng.random(n) * w
    ys = rng.random(n) * h
    # many faint, few bright
    f = (rng.pareto(mag_power, n) + 1) ** 1.6
    f = np.minimum(f, 60) * 0.08 * brightness
    temp = np.clip(rng.normal(6200, 2600, n), 2600, 30000)
    col = star_color(temp) * 0.6 + 0.4  # desaturate toward white
    buf = np.zeros((h, w, 3), np.float32)
    buf = splat_points(buf, xs, ys, col * f[:, None], sigma=sigma)
    return buf, (xs, ys, f, col)


# ───────────────────────── post ─────────────────────────
_GRAIN = None


def grain_tiles():
    global _GRAIN
    if _GRAIN is None:
        rng = np.random.default_rng(7)
        _GRAIN = [blur(rng.normal(0, 1, (H, W)).astype(np.float32), 0.6) for _ in range(6)]
    return _GRAIN


_VIG = None


def vignette():
    global _VIG
    if _VIG is None:
        xs, ys = grid()
        d = np.sqrt(((xs - W / 2) / (W / 2)) ** 2 * 0.85 + ((ys - H / 2) / (H / 2)) ** 2 * 0.65)
        _VIG = (1 - 0.42 * smooth(span(d, 0.35, 1.25)))[..., None].astype(np.float32)
    return _VIG


def tonemap(x, exposure=1.0):
    """Filmic curve (ACES approximation)."""
    x = np.maximum(x * exposure, 0)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def post(img, frame, bloom=0.55, exposure=1.0, grade=None, grain=0.018, vig=True, ca=0.0):
    """HDR float image → 8-bit RGB frame."""
    hi = np.maximum(img - 0.7, 0)
    if bloom > 0:
        b1 = fast_blur(hi, 6)
        b2 = fast_blur(hi, 22)
        b3 = fast_blur(hi, 70)
        img = img + bloom * (0.45 * b1 + 0.35 * b2 + 0.3 * b3)
    if ca > 0:
        # lateral chromatic aberration: scale R up, B down slightly around centre
        for ch, s in ((0, 1 + ca), (2, 1 - ca)):
            M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, s)
            img[..., ch] = cv2.warpAffine(np.ascontiguousarray(img[..., ch]), M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    if vig:
        img = img * vignette()
    out = tonemap(img, exposure)
    if grade is not None:
        lift, gain = grade
        out = np.clip(out * np.asarray(gain, np.float32) + np.asarray(lift, np.float32) * (1 - out), 0, 1)
    out = np.power(out, 1 / 1.0)
    if grain > 0:
        g = grain_tiles()[frame % 6]
        lum = out.mean(-1, keepdims=True)
        out = out + g[..., None] * grain * (0.35 + 0.65 * (1 - lum))
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)
