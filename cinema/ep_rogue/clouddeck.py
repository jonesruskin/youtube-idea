"""Flying over the rogue's cloud tops: a procedural banded, turbulent cloud deck projected in perspective onto a
curved planet below the camera (ray–sphere intersection), lit only by its own heat and faint starlight; optional
distant Sun. Gives true parallax: the deck scrolls under the camera and the horizon curves away."""
import functools
import numpy as np
import cv2
from engine.core import W, H, clamp, smooth, span, lerp, glow_dot, fbm, fast_blur, star_spikes
from engine import cam3d

TS = 4096          # texture size (periodic in longitude)


def _tileable(n):
    S0, S1 = n.shape
    a = (np.arange(S1, dtype=np.float32) / S1)[None, :]
    b = (np.arange(S0, dtype=np.float32) / S0)[:, None]
    rx, ry = np.roll(n, S1 // 2, 1), np.roll(n, S0 // 2, 0)
    rxy = np.roll(rx, S0 // 2, 0)
    wa = np.abs(2 * a - 1)          # 1 at the edges, 0 in the middle: edges come from the rolled copy (whose middle is the seam-free original edge)
    wb = np.abs(2 * b - 1)
    out = n * (1 - wa) * (1 - wb) + rx * wa * (1 - wb) + ry * (1 - wa) * wb + rxy * wa * wb
    return (out - out.mean()) / (out.std() + 1e-6)


@functools.lru_cache(1)
def deck():
    """Tileable cloud field (TS × TS): zonal bands sheared by jets, turbulent eddies, ridged cloud edges, storm ovals.
    Returns (cloud thickness 0..1, hot-spot map 0..1)."""
    from engine.core import cached

    def build():
        S = TS
        n1 = _tileable(fbm(S, S, scale=520, octaves=5, seed=41))
        n2 = _tileable(fbm(S, S, scale=140, octaves=5, seed=42))
        n3 = _tileable(fbm(S, S, scale=36, octaves=4, seed=43))
        r1 = _tileable(1 - np.abs(2 * fbm(S, S, scale=90, octaves=5, seed=44) - 1))
        # wind-stretched streaks: noise squashed across the bands (×5 along the flow)
        st = _tileable(cv2.resize(fbm(S // 5, S, scale=50, octaves=5, seed=45), (S, S), interpolation=cv2.INTER_CUBIC))
        yy = (np.arange(S, dtype=np.float32) / S)[:, None]
        lat = yy + n1 * 0.035 + n2 * 0.012
        bands = np.sin(lat * 2 * np.pi * 9 + 1.5 * np.sin(lat * 2 * np.pi * 3))
        thick = 0.55 + 0.30 * bands + 0.10 * st + 0.06 * n2 + 0.04 * n3 + 0.06 * r1
        rng = np.random.default_rng(5)
        xs = np.arange(S, dtype=np.float32)[None, :]
        ys = np.arange(S, dtype=np.float32)[:, None]
        for _ in range(45):
            cx, cy = rng.uniform(0, S), rng.uniform(0, S)
            rx, ry = rng.uniform(30, 160), rng.uniform(14, 60)
            dx = (xs - cx + S / 2) % S - S / 2
            dy = (ys - cy + S / 2) % S - S / 2
            d = (dx / rx) ** 2 + (dy / ry) ** 2
            thick += np.exp(-d) * (0.18 + 0.12 * np.sin(np.sqrt(d + 1e-6) * 10 + np.arctan2(dy, dx) * 2))
        thick = smooth(span(np.clip(thick, 0, 1), 0.22, 0.88))
        hot = smooth(span(1 - thick, 0.62, 0.98)) * (0.55 + 0.45 * (0.5 + 0.5 * n3))
        return np.stack([thick, hot], -1).astype(np.float32)
    return cached("rogue_deck_v4", build)


def flyover(t, alt_km=2500.0, pitch_deg=-8.0, yaw_deg=0.0, speed=1.0, fov=62.0, glow=1.0, sun_dir=None, sun_bright=0.0,
            radius_km=74051.0, roll_deg=0.0, scroll=0.0):
    """Camera alt_km above the cloud tops, looking pitch_deg (negative = down) toward yaw. scroll advances the deck
    under the camera (in degrees of longitude), for forward motion."""
    f = (W / 2) / np.tan(np.radians(fov) / 2)
    cam = cam3d.Camera((0, radius_km + alt_km, 0),
                       (np.sin(np.radians(yaw_deg)) * 1e5, radius_km + alt_km + np.tan(np.radians(pitch_deg)) * 1e5, -np.cos(np.radians(yaw_deg)) * 1e5),
                       fov=fov, roll=np.radians(roll_deg))
    img = cam.sky(gain=0.9)
    xs = (np.arange(W, dtype=np.float32) - W / 2) / f
    ys = -(np.arange(H, dtype=np.float32) - H / 2) / f
    X, Y = np.meshgrid(xs, ys)
    Rt = cam.R.astype(np.float32)
    d = X[..., None] * Rt[0] + Y[..., None] * Rt[1] - Rt[2]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    o = np.array([0, radius_km + alt_km, 0], np.float32)
    b = d @ o
    c = o @ o - radius_km ** 2
    disc = b * b - c
    hit = (disc > 0) & (b < 0)
    tt = -b - np.sqrt(np.maximum(disc, 0))
    P = o[None, None, :] + d * tt[..., None]
    # flat mapping around the camera's sub-point onto a patch of the real Jupiter cloud map (8k, 55 km per pixel)
    from engine.planet import tex as ptex
    jt = ptex("8k_jupiter.jpg", 8192)
    KM_PX = 449000.0 / jt.shape[1]
    u = (P[..., 0] + scroll) / KM_PX + jt.shape[1] * 0.40
    v = P[..., 2] / KM_PX * 0.9 + jt.shape[0] * 0.62
    cimg = cv2.remap(jt, u.astype(np.float32), np.clip(v, 0, jt.shape[0] - 2).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    lum = cimg.mean(-1)
    lo, hi = 0.23, 0.52
    val = clamp((lum - lo) / (hi - lo))                       # bright zones = thick, cold cloud tops
    # fine structure the 8k map can't resolve up close: a tileable eddy field at 2,600 km per tile
    dt = deck()[..., 0]
    du = ((P[..., 0] + scroll) / 2600.0 % 1.0) * TS
    dv = (P[..., 2] / 2600.0 % 1.0) * TS
    det = cv2.remap(np.ascontiguousarray(dt), du.astype(np.float32), dv.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    near = 1 - clamp(np.where(hit, tt, 1e9) / (alt_km * 6))
    val = clamp(val + (det - 0.5) * (0.05 + 0.32 * near ** 1.5))
    hot = smooth(span(1 - val, 0.45, 1.0))                     # dark belts = thin cloud, the warm depths show through
    dist = np.where(hit, tt, 1e9)
    k = clamp(dist / (np.sqrt(2 * radius_km * alt_km) * 1.15))
    nrm = P / radius_km
    mu = np.clip(-(d * nrm).sum(-1), 0, 1)
    tops = (val ** 1.8)[..., None] * np.array([0.075, 0.04, 0.10], np.float32)
    g = (hot ** 1.6)[..., None]
    glowc = g * np.array([1.0, 0.30, 0.34], np.float32) * (0.45 + 0.55 * mu[..., None]) + (hot ** 4)[..., None] * np.array([0.45, 0.28, 0.08], np.float32)
    col = (tops + glowc * 0.85) * glow
    if sun_dir is not None and sun_bright > 0:
        sd = np.asarray(sun_dir, np.float32)
        sd /= np.linalg.norm(sd)
        ndl = np.clip((nrm * sd).sum(-1), 0, 1)
        col += (val ** 0.8)[..., None] * ndl[..., None] * np.array([0.95, 0.9, 0.95], np.float32) * sun_bright
    haze = np.array([0.30, 0.10, 0.32], np.float32) * glow * 0.35
    col = col * (1 - k[..., None] ** 1.5) + haze * (k[..., None] ** 1.5)
    # thin glowing limb above the horizon
    limb = np.exp(-np.maximum(np.sqrt(np.maximum(-disc, 0)) / radius_km * 0, 0))
    img = np.where(hit[..., None], col, img)
    hor = np.where(hit, 0, 1).astype(np.float32)
    edge = cv2.GaussianBlur(1 - hor, (0, 0), 6) * hor
    img += edge[..., None] * np.array([0.55, 0.2, 0.6], np.float32) * 0.6 * glow
    if sun_dir is not None:
        sx, sy, sz = cam.project(np.asarray(sun_dir) * 1e9 + o)
        if sz > 0 and -200 < sx < W + 200 and -200 < sy < H + 200:
            glow_dot(img, sx, sy, (1.0, 0.92, 0.8), 2.5 + 3 * sun_bright, 6 + 20 * sun_bright)
            glow_dot(img, sx, sy, (1.0, 0.8, 0.55), 60, 0.3 + sun_bright)
            star_spikes(img, sx, sy, (1.0, 0.95, 0.85), 120 + 400 * sun_bright, 0.3 + sun_bright, angle=8)
    return img, cam
