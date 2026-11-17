"""Views from the ground: a city skyline (lit windows), an ocean horizon, or a ridge, under a real sky (cam3d.ground_sky)
with objects placed by altitude/azimuth: the rogue (point → banded disc), the Moon, the Sun, the Milky Way."""
import functools
import numpy as np
import cv2
from engine.core import W, H, clamp, smooth, span, lerp, glow_dot, star_spikes, fbm, fast_blur, grid
from engine.planet import render_planet, render_sun_disk
from engine import cam3d


@functools.lru_cache(4)
def skyline(seed=3, horizon=0.78, scale=1.0):
    """City silhouette (mask) and its window lights, at output resolution, extended 600 px for camera pans."""
    rng = np.random.default_rng(seed)
    w = W + 600
    hy = int(H * horizon)
    mask = np.zeros((H, w), np.float32)
    lights = np.zeros((H, w, 3), np.float32)
    x = 0
    while x < w:
        bw = max(3, int(rng.integers(26, 120) * scale))
        tall = rng.random() < (0.12 if scale >= 1 else 0.05)
        bh = max(2, int((rng.integers(20, 120) + (rng.integers(150, 420) if tall else 0)) * scale))
        top = hy - bh
        mask[top:, x:x + bw] = 1.0
        if tall and rng.random() < (0.5 if scale >= 1 else 0.15):      # spire
            sx = x + bw // 2
            mask[top - rng.integers(30, 90):top, sx - 1:sx + 2] = 1.0
        # windows
        step_y, step_x = max(2, int(9 * scale)), max(2, int(7 * scale))
        for yy in range(top + 2, hy, step_y):
            for xx in range(x + 1, x + bw - 1, step_x):
                if rng.random() < 0.22:
                    c = np.array([1.0, 0.78, 0.45]) if rng.random() < 0.8 else np.array([0.75, 0.85, 1.0])
                    q = max(1, int(3 * scale))
                    lights[yy:yy + q, xx:xx + q] = c * rng.uniform(0.25, 1.0)
        x += bw + int(rng.integers(0, 10) * scale)
    # far skyline layer, lower and hazier
    far = np.zeros((H, w), np.float32)
    x = 0
    while x < w:
        bw = max(4, int(rng.integers(40, 160) * scale))
        bh = max(2, int(rng.integers(10, 90) * scale))
        far[hy - bh - int(18 * scale):hy, x:x + bw] = 1.0
        x += bw
    mask = cv2.GaussianBlur(mask, (0, 0), 0.6)
    return mask, lights * mask[..., None], cv2.GaussianBlur(far, (0, 0), 1.2), hy


@functools.lru_cache(2)
def ridge(seed=4, horizon=0.80):
    n = fbm(W + 600, 1, scale=300, octaves=5, seed=seed)[0]
    h = H * horizon - 90 * (n - n.mean()) / (n.std() + 1e-6) * 0.6
    xs, ys = grid(W + 600, H)
    return cv2.GaussianBlur((ys > h[None, :]).astype(np.float32), (0, 0), 1.0)


def ocean(img, horizon_y, t, sky_ref, glints=()):
    """Water below the horizon: reflected sky (darker, rippled), with glitter paths under bright objects."""
    ys = np.arange(H, dtype=np.float32)
    below = ys > horizon_y
    out = img.copy()
    k = np.clip((ys - horizon_y) / (H - horizon_y + 1e-6), 0, 1)
    refl_rows = np.clip(2 * horizon_y - ys, 0, H - 1).astype(np.int32)
    ref = sky_ref[refl_rows] * (0.35 + 0.25 * (1 - k))[:, None, None]
    xs = np.arange(W, dtype=np.float32)
    rip = (np.sin(xs[None, :] * 0.08 + ys[:, None] * 0.9 - t * 2.0) * np.sin(xs[None, :] * 0.021 - t * 0.7 + ys[:, None] * 0.13)) * k[:, None]
    ref = ref * (0.85 + 0.25 * rip[..., None])
    for gx, col, strength, width in glints:
        g = np.exp(-((xs[None, :] - gx) / (width * (0.3 + 1.6 * k[:, None]))) ** 2) * np.clip(rip * 1.8 + 0.4, 0, 1)
        ref += g[..., None] * np.asarray(col, np.float32) * strength * (0.4 + 0.6 * k[:, None, None])
    out[below] = ref[below] + np.array([0.004, 0.008, 0.014], np.float32)
    return out


def ground_view(t, sun_alt=-20.0, sun_az=0.0, view_az=0.0, pitch=12.0, fov=60.0, fg="city", pan=0.0,
                rogue=None, moon=None, sun_disk=False, stars=1.0, haze=1.0, city_lights=1.0, timelapse=0.0, sun_scale=1.0):
    """rogue: dict(alt, az, size_deg, bright (0..1 when a point), phase light vector, glow).
    moon: dict(alt, az, size_deg). Returns HDR image + screen positions."""
    sky, alt, az, f, day = cam3d.ground_sky(pitch, sun_alt, sun_az, view_az, fov, haze)
    img = sky.copy()
    # stars + Milky Way, faded by daylight and near the horizon (rotating slowly for a time-lapse)
    if stars > 0 and day < 0.95:
        cam = cam3d.Camera((0, 0, 0), (np.sin(np.radians(view_az + timelapse)), np.sin(np.radians(pitch)), np.cos(np.radians(view_az + timelapse))), fov=fov)
        st = cam.sky(gain=1.0, bright=True)
        ext = clamp((alt + 2) / 25.0) ** 1.2
        img += st * (ext * (1 - day) * stars * 2.0)[..., None]
    pos = {}
    if sun_disk:
        p = cam3d.altaz_to_screen(sun_alt, sun_az, pitch, view_az, f)
        if p is not None:
            R = f * np.radians(0.53 * sun_scale) / 2
            render_sun_disk(img, p[0], p[1], R * 1.0, t, filter_look=False)
            glow_dot(img, p[0], p[1], (1.0, 0.9, 0.75), R * 2, 6 * max(day, 0.3))
            glow_dot(img, p[0], p[1], (1.0, 0.7, 0.45), 260, 0.25)
            pos["sun"] = p
    if moon is not None:
        p = cam3d.altaz_to_screen(moon["alt"], moon["az"], pitch, view_az, f)
        if p is not None:
            R = f * np.radians(moon.get("size_deg", 0.52)) / 2
            render_planet(img, p[0], p[1], R, "moon", spin=0.3, tilt=0.1, light=moon.get("light", (0.05, 0.1, 1.0)), exposure=moon.get("exposure", 1.0))
            glow_dot(img, p[0], p[1], (0.85, 0.88, 1.0), R * 2.5, 0.05)
            pos["moon"] = p
    if rogue is not None:
        p = cam3d.altaz_to_screen(rogue["alt"], rogue["az"], pitch, view_az, f)
        if p is not None:
            R = f * np.radians(rogue.get("size_deg", 0.0)) / 2
            if R > 1.5:
                from ep_rogue.vis import draw_rogue
                tmp = draw_rogue(np.zeros_like(img), p[0], p[1], R, light=rogue.get("light", (-0.6, 0.3, 0.6)),
                                 lit=rogue.get("lit", 1.1), glow=rogue.get("glow", 0.6), spin=0.25 + 0.02 * t)
                xs, ys = grid()
                disc = clamp((R - np.sqrt((xs - p[0]) ** 2 + (ys - p[1]) ** 2)) + 0.5)
                img = img * (1 - disc[..., None] * (1 - 0.6 * day)) + tmp + sky * disc[..., None] * 0.35 * day
                glow_dot(img, p[0], p[1], (0.85, 0.75, 1.0), R * 1.4, 0.05)
            else:
                b = rogue.get("bright", 0.3)
                glow_dot(img, p[0], p[1], (0.95, 0.9, 1.0), 1.6 + 2.5 * b, 1.5 + 14 * b)
                glow_dot(img, p[0], p[1], (0.85, 0.8, 1.0), 10 + 30 * b, 0.15 * b)
                if b > 0.3:
                    star_spikes(img, p[0], p[1], (0.95, 0.92, 1.0), 40 + 160 * b, 0.35 * b, angle=12)
            pos["rogue"] = (p[0], p[1], R)
    # foreground
    off = int(np.clip(300 + pan, 0, 599))
    if fg == "city":
        m, li, far, hy = skyline()
        m, li, far = m[:, off:off + W], li[:, off:off + W], far[:, off:off + W]
        hz = img[max(0, hy - 30):hy].mean((0, 1)) if hy > 30 else img.mean((0, 1))
        farc = hz * 0.55 + 0.004
        img = img * (1 - far[..., None]) + farc * far[..., None]
        base = np.array([0.006, 0.007, 0.010], np.float32) + img.mean((0, 1)) * 0.06
        img = img * (1 - m[..., None]) + base * m[..., None] + li * city_lights * (1 - 0.8 * day)
        # light dome over the city
        ys = np.arange(H, dtype=np.float32)[:, None, None]
        img += np.array([0.05, 0.035, 0.02], np.float32) * np.exp(-np.clip(hy - ys, 0, None) / 120) * (ys < hy) * city_lights * (1 - day)
    elif fg == "ocean":
        hy = int(H * 0.66)
        img = ocean(img, hy, t, sky_ref=img.copy(), glints=[(p_[0], (1.0, 0.95, 0.9), 1.4, 40) for k_, p_ in pos.items() if k_ in ("sun", "moon")] +
                    ([(pos["rogue"][0], (0.9, 0.85, 1.0), 0.6, 90)] if "rogue" in pos else []))
    elif fg == "bay":
        # a distant city across dark water, a ridge behind it; lights shimmer in the water
        hy = int(H * 0.70)
        rm = ridge(seed=8, horizon=0.66)[:, off:off + W]
        hz = img[max(0, hy - 40):hy].mean((0, 1))
        img = img * (1 - rm[..., None] * 0.92) + (hz * 0.25 + 0.003) * rm[..., None] * 0.92
        m, li, far, _ = skyline(seed=11, horizon=0.70, scale=0.45)
        m, li, far = m[:, off:off + W], li[:, off:off + W], far[:, off:off + W]
        img = img * (1 - far[..., None]) + (hz * 0.35 + 0.004) * far[..., None]
        img = img * (1 - m[..., None]) + (np.array([0.004, 0.005, 0.008], np.float32) + hz * 0.12) * m[..., None] + li * 2.2 * city_lights * (1 - 0.85 * day)
        ys = np.arange(H, dtype=np.float32)[:, None, None]
        img += np.array([0.06, 0.04, 0.025], np.float32) * np.exp(-np.abs(hy - 12 - ys) / 40) * city_lights * (1 - day)
        above = img[:hy].copy()
        refl = above[::-1]
        n = H - hy
        rf = np.zeros((n, W, 3), np.float32)
        rf[:min(n, hy)] = refl[:min(n, hy)]
        rf = cv2.GaussianBlur(rf, (0, 0), sigmaX=1.5, sigmaY=9)
        xs = np.arange(W, dtype=np.float32)[None, :]
        yy = np.arange(n, dtype=np.float32)[:, None]
        shift = (np.sin(yy * 0.7 + t * 1.6) * (2 + yy * 0.06) + np.sin(xs * 0.05 + yy * 0.3 - t) * 1.5).astype(np.float32)
        mx = np.clip(xs + shift, 0, W - 1).astype(np.float32)
        my = np.repeat(yy, W, 1).astype(np.float32)
        rf = cv2.remap(rf, mx, my, cv2.INTER_LINEAR)
        img[hy:] = rf * 0.55 + np.array([0.002, 0.004, 0.007], np.float32)
    elif fg == "ridge":
        m = ridge()[:, off:off + W]
        img = img * (1 - m[..., None]) + (np.array([0.005, 0.006, 0.009], np.float32) + img.mean((0, 1)) * 0.05) * m[..., None]
    return img, pos, f
