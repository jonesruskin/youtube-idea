"""Space shots: lens, planet, earth, sun, leave, spaghetti."""
import os
import numpy as np
import cv2
from .core import (W, H, CACHE, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes,
                   splat_points, blur, fast_blur, grid, star_color)
from .space import space_frame, lens_image, CW, CH
from .planet import render_planet, render_sun_disk, render_rings, tex
from . import cards


def _lp(a, u):
    """Interpolate a (start, end) tuple param with smooth easing."""
    if isinstance(a, (tuple, list)) and len(a) == 2 and not isinstance(a[0], (tuple, list)):
        return lerp(a[0], a[1], smoother(u))
    return a


class Shot:
    exposure = 1.45
    grade = ((0.012, 0.014, 0.03), (1.0, 1.0, 1.0))
    bloom = 0.55

    def __init__(self, p, dur, seg_start=0.0):
        self.p, self.dur, self.seg_start = p, dur, seg_start

    def post_kw(self):
        return dict(exposure=self.exposure, grade=self.grade, bloom=self.bloom)


class Lens(Shot):
    def render(self, u, t, fi):
        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        p = self.p
        zoom = _lp(p.get("zoom", (1, 1)), u)
        dx, dy = p.get("drift", (0, 0))
        cx = 3050 + dx * W * (ur - 0.5) * 2
        cy = 1560 + dy * H * (ur - 0.5) * 2
        mass = _lp(p.get("mass", (1, 1)), u)
        te = 150 * mass * zoom ** 0.5
        lx, ly = W * 0.5, H * 0.47
        if p.get("sweep"):
            lx = lerp(W * 0.18, W * 0.82, smoother(u))
            ly = H * 0.5 + 60 * np.sin(u * 3)
        if p.get("earth"):
            lx, ly = W * 0.36, H * 0.33
        img, _ = space_frame(cx, cy, zoom, angle=4 * (ur - 0.5), lenses=[(lx, ly, te)])
        if p.get("earth"):
            img *= 0.8
            render_planet(img, 1560, 1520 - 40 * smoother(u), 980, "earth", spin=1.9 + 0.05 * u, tilt=0.5, light=(-0.75, 0.45, 0.35))
        img *= (1 - p.get("dim", 0))
        return img


class Planet(Shot):
    def render(self, u, t, fi):
        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        p = self.p
        body = p["body"]
        zoom = _lp(p.get("zoom", (1, 1)), u)
        img, _ = space_frame(2200 + 300 * ur, 1100 + 80 * ur, zoom ** 0.7, angle=2 * ur)
        img *= 0.9
        R = {"neptune": 330, "jupiter": 420, "saturn": 250}[body] * zoom
        (ax, ay), (bx, by) = p["path"]
        lu = smoother(span(u, 0.0, 1.0))
        lx, ly = lerp(ax, bx, lu) * W, H / 2 + lerp(ay, by, lu) * H
        pull = ease_in(span(u, 0.55, 1.0), 2.4) if body == "neptune" else ease_in(span(u, 0.7, 1.0), 2.0) * 0.35
        if not p.get("pull", True):
            pull = 0.0
        dirx, diry = (bx - ax), (by - ay)
        n = np.hypot(dirx, diry) + 1e-6
        pcx = W / 2 + 40 + dirx / n * pull * W * 0.55
        pcy = H / 2 + diry / n * pull * W * 0.55 * 0.4
        light = (-0.75, 0.15, 0.62) if body == "neptune" else (-0.65, 0.1, 0.75)
        if body == "saturn":
            render_rings(img, pcx, pcy, R, front=False)
        render_planet(img, pcx, pcy, R, body, spin=0.6 + t * (0.05 if body == "jupiter" else 0.03), tilt={"jupiter": 0.12, "saturn": 0.3}.get(body, 0.45),
                      light=light, exposure=1.0 if body in ("jupiter", "saturn") else 1.3, roll=0.12 if body == "saturn" else 0.0)
        if body == "saturn":
            render_rings(img, pcx, pcy, R, front=True)
        if p.get("lens"):
            img = lens_image(img, lx, ly, 125 * zoom ** 0.5, shadow=0.3)
        return img


class Earth(Shot):
    def render(self, u, t, fi):
        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        p = self.p
        zoom = _lp(p.get("zoom", (1, 1)), u)
        img, _ = space_frame(1700 - 200 * ur, 2100, zoom ** 0.7, angle=-2 * ur)
        R = 420 * zoom
        spin = 3.2 + t * 0.05
        light = np.array([-0.8, 0.3, 0.55]) if not p.get("nightside") else np.array([0.9, 0.25, -0.45])
        kw = dict(night=p.get("night", 1.0))
        exposure = 1.0
        if p.get("seasons"):
            ph = np.sin(u * 2 * np.pi * 1.5 - 0.5)
            kw["scorch"] = float(max(0, ph))
            kw["ice"] = float(max(0, -ph)) * 0.85
            exposure = 1.0 + 0.7 * max(0, ph) - 0.55 * max(0, -ph)
        if p.get("freeze"):
            f = _lp(p["freeze"], u)
            kw["ice"] = float(f)
            kw["lights_fade"] = float(1 - smooth(span(f, 0.25, 0.95)))
            exposure = 0.35 - 0.2 * f
            light = np.array([-0.95, 0.15, 0.2])
        if p.get("scorch"):
            kw["scorch"] = p["scorch"]
            exposure = 1.5
        if p.get("lights_cut"):
            kw["lights_cut"] = float(p["lights_cut"])
        render_planet(img, W / 2, H / 2 + 10, R, "earth", spin=spin, tilt=0.38, light=tuple(light), exposure=exposure, **kw)
        if p.get("lens"):
            lx, ly = p["lens"]
            r0, r1 = p.get("lens_r", (0.05, 0.08))
            img = lens_image(img, lx * W - 60 * ur, ly * H + 30 * ur, lerp(r0, r1, smooth(u)) * W, shadow=0.3)
        return img


class Sun(Shot):
    exposure = 1.0
    grade = ((0.0, 0.0, 0.0), (1.0, 1.0, 1.0))
    bloom = 0.35

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        img = np.zeros((H, W, 3), np.float32)
        R = 440 + 25 * u
        render_sun_disk(img, W / 2, H / 2, R, t)
        a, b = self.p.get("transit", (0.1, 0.9))
        k = smoother(span(u, 0, 1))
        lx = lerp(W / 2 - R * 0.95, W / 2 + R * 0.75, lerp(a, b, k))
        ly = H / 2 - R * 0.25 + R * 0.35 * lerp(a, b, k)
        img = lens_image(img, lx, ly, 62, shadow=0.16)
        return img


class Leave(Shot):
    """Earth leaves the Sun behind: sunlight falls with the inverse square of distance."""

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        ta, tb = self.p.get("t", (0.0, 1.0))
        u = lerp(ta, tb, u)
        k = smoother(span(u, 0.05, 0.98))
        d = 10 ** lerp(0.0, 1.72, k)  # 1 AU → ~52 AU
        flux = 1.0 / d ** 2
        img, _ = space_frame(4300 - 200 * u, 1300, 1.0 + 0.04 * u, angle=1.5 * u)
        img *= 0.8
        sx, sy = 1380, 360
        glow_dot(img, sx, sy, (1.0, 0.92, 0.8), 6 + 30 * flux ** 0.5, 40 * flux ** 0.5 + 3)
        glow_dot(img, sx, sy, (1.0, 0.85, 0.65), 60 + 260 * flux ** 0.5, 0.6 * flux ** 0.35)
        star_spikes(img, sx, sy, (1.0, 0.92, 0.85), 120 + 500 * flux ** 0.4, 0.8 * flux ** 0.25 + 0.15, angle=12)
        L = np.array([0.55, 0.42, -0.2])
        render_planet(img, 380, 1480, 1150, "earth", spin=2.6 + t * 0.03, tilt=0.4, light=tuple(L),
                      exposure=0.4 + 1.2 * flux ** 0.5, lights_fade=1.0, ice=float(smooth(span(u, 0.6, 1.0)) * 0.3))
        # HUD
        a = smooth(span(u, 0.05, 0.15))
        cards.label(img, "DISTANCE FROM THE SUN", 1460, 790, (0.75, 0.78, 0.86), a, 20)
        cards.label(img, f"{d:5.1f} AU", 1460, 836, (1, 0.97, 0.93), a, 40, kind="light", tracking=0.04)
        cards.label(img, "SUNLIGHT", 1460, 900, (0.75, 0.78, 0.86), a, 20)
        pct = flux * 100
        s = f"{pct:.0f}%" if pct >= 10 else (f"{pct:.1f}%" if pct >= 1 else f"{pct:.2f}%")
        cards.label(img, s, 1460, 946, (1.0, 0.62, 0.32), a, 40, kind="light", tracking=0.04)
        return img


# ───────────────────────── tidal disruption ─────────────────────────
GM = 17.2           # 10 Msun in (10^6 km)^3 / hr^2
N_P = 70000
STEPS = 420


def _tde_sim(N_P=N_P):
    """Test-particle tidal disruption. The planet moves rigidly (self-gravity) until it reaches the release
    radius, then each particle follows its own orbit: half the debris is bound and winds into a ring, half escapes."""
    rng = np.random.default_rng(4)
    Rv = 0.022
    v = rng.normal(size=(N_P, 3))
    v /= np.linalg.norm(v, axis=1)[:, None]
    rad = rng.random(N_P) ** (1 / 3)
    rad[: N_P // 2] = 0.97 + 0.03 * rng.random(N_P // 2)
    loc = v * rad[:, None] * Rv
    r0 = np.array([4.0, 1.6, 0.0])
    rn = np.linalg.norm(r0)
    Lh = np.sqrt(2 * GM * 0.24)
    vtan = Lh / rn
    vrad = -np.sqrt(max(2 * GM / rn - vtan ** 2, 0))
    rhat = r0 / rn
    that = np.array([-rhat[1], rhat[0], 0])
    com, vcom = r0.copy(), rhat * vrad + that * vtan
    lat = np.arcsin(np.clip(v[:, 2], -1, 1))
    lon = np.arctan2(v[:, 1], v[:, 0])
    out = np.zeros((STEPS, N_P, 3), np.float16)
    temp = np.zeros((STEPS, N_P), np.float16)
    T_total = 6.0
    sub = 30
    dt = T_total / (STEPS * sub)
    heat = np.zeros(N_P, np.float32)
    released, t_rel = False, None
    pos = vel = None
    R_REL = 0.25

    def acc(x):
        r = np.linalg.norm(x, axis=-1, keepdims=True)
        return -GM * x / np.maximum(r, 0.02) ** 3, r[..., 0]

    for st in range(STEPS):
        for _ in range(sub):
            if not released:
                a_, r_ = acc(com)
                vcom = vcom + a_ * dt * 0.5
                com = com + vcom * dt
                a_, r_ = acc(com)
                vcom = vcom + a_ * dt * 0.5
                if r_ < R_REL:
                    released, t_rel = True, st
                    pos = com + loc
                    vel = np.tile(vcom, (N_P, 1))
                continue
            a, r = acc(pos)
            vel += a * dt * 0.5
            pos += vel * dt
            a, r = acc(pos)
            vel += a * dt * 0.5
            if st > t_rel + STEPS * 0.12:
                inside = r < 0.9
                vr = np.sum(vel * pos, axis=1) / np.maximum(r, 1e-3) ** 2
                vel[inside] -= (vr[inside, None] * pos[inside]) * 0.0012
                vel[inside] *= 0.99985
            heat = np.maximum(heat * 0.9997, np.clip(0.3 / np.maximum(r, 0.05) - 0.3, 0, 2.0))
        out[st] = (com + loc) if not released else pos
        temp[st] = heat
    return out, temp, lat.astype(np.float32), lon.astype(np.float32), rad.astype(np.float32)


_TDE = None


def tde():
    global _TDE
    if _TDE is None:
        p = os.path.join(CACHE, "tde_v5.npz")
        if not os.path.exists(p):
            o, tp, la, lo, ra = _tde_sim()
            np.savez(p, pos=o, temp=tp, lat=la, lon=lo, rad=ra)
        d = np.load(p)
        _TDE = (d["pos"], d["temp"], d["lat"], d["lon"], d["rad"])
    return _TDE


def _particle_colors(lat, lon, rad):
    day = tex("8k_earth_daymap.jpg", 2048)
    u = (((lon / (2 * np.pi)) + 0.5) % 1.0) * (day.shape[1] - 1)
    v = (0.5 - lat / np.pi) * (day.shape[0] - 1)
    c = day[v.astype(int), u.astype(int)]
    inner = rad < 0.96
    mantle = np.array([0.9, 0.32, 0.08], np.float32)
    core = np.array([1.0, 0.75, 0.4], np.float32)
    c[inner] = np.where((rad[inner] < 0.55)[:, None], core, mantle)
    return c.astype(np.float32)


class Spaghetti(Shot):
    exposure = 1.3

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        pos, temp, lat, lon, rad = tde()
        a, b = self.p.get("phase", (0, 1))
        ph = lerp(a, b, u)
        si = ph * (STEPS - 1)
        i0 = int(np.floor(si))
        i1 = min(STEPS - 1, i0 + 1)
        f = si - i0
        P = pos[i0].astype(np.float32) * (1 - f) + pos[i1].astype(np.float32) * f
        T = temp[i0].astype(np.float32) * (1 - f) + temp[i1].astype(np.float32) * f
        # camera: orbit plane tilted, slow orbit around BH; distance pulls in over time
        inc = np.radians(72)
        yaw = np.radians(160 + 35 * ph)
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        xr = x * np.cos(yaw) - y * np.sin(yaw)
        yr = x * np.sin(yaw) + y * np.cos(yaw)
        # tilt: camera looks down at the plane from above-ish
        yc = yr * np.cos(inc) - z * np.sin(inc)
        zc = yr * np.sin(inc) + z * np.cos(inc)
        cam_d = lerp(5.2, 3.6, smooth(ph))
        depth = cam_d + zc
        fpx = lerp(1000, 1750, smooth(span(ph, 0.25, 0.7)))
        sx = W / 2 + xr / depth * fpx
        sy = H / 2 + 60 - yc / depth * fpx
        te = 0.62 / cam_d * fpx * 0.9
        bx, by = W / 2, H / 2 + 60
        img, _ = space_frame(2600 + 400 * ph + np.degrees(yaw) * 3, 1700, (5.2 / cam_d) ** 0.5, lenses=[(bx, by, te)])
        img *= 0.7
        com = P.mean(0)
        spread = np.std(np.linalg.norm(P - com, axis=1))
        intact = 1 - smooth(span(spread, 0.0095, 0.03))
        col = _particle_colors(lat, lon, rad)
        Tn = clamp(T / 2.0)[:, None]
        hotcol = np.array([1.0, 0.7, 0.4], np.float32) * (1 - clamp(Tn * 2 - 1)) + np.array([0.75, 0.88, 1.0], np.float32) * clamp(Tn * 2 - 1)
        emis = col * 0.5 * (1 - clamp(Tn * 3)) + hotcol * clamp(Tn * 3) * (0.8 + 3.0 * Tn)
        flux = emis * (0.1 * (1 - intact)) * (3.6 / np.maximum(depth, 1.0)[:, None]) ** 2 * smooth(span(depth, 0.9, 1.8))[:, None]
        # occlusion: debris behind the hole is hidden by its shadow
        rs = np.sqrt((sx - bx) ** 2 + (sy - by) ** 2)
        ok = (depth > 0.3) & ~((zc > 0) & (rs < te * 0.42))
        layer = np.zeros((H, W, 3), np.float32)
        layer = splat_points(layer, sx[ok], sy[ok], flux[ok], sigma=0.9)
        layer = layer + fast_blur(layer, 5) * 0.9 + fast_blur(layer, 22) * 0.5
        layer = 1.8 * layer / (1 + 0.8 * layer)
        img = img + layer
        if intact > 0.01:
            yrc = com[0] * np.sin(yaw) + com[1] * np.cos(yaw)
            xrc = com[0] * np.cos(yaw) - com[1] * np.sin(yaw)
            dep = cam_d + yrc * np.sin(inc)
            ccx = W / 2 + xrc / dep * fpx
            ccy = H / 2 + 60 - yrc * np.cos(inc) / dep * fpx
            Rp = 0.065 / dep * fpx
            pl = img.copy()
            pl, pa = render_planet(pl, ccx, ccy, Rp, "earth", spin=t * 0.4, tilt=0.4, light=(-0.6, 0.2, 0.7), exposure=1.0)
            img = img * (1 - intact) + pl * intact
        return img
