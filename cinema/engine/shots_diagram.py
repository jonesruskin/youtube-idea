"""Diagram shots driven by real data: system (N-body sim), orbit (eccentric year), galaxy, moon."""
import os
import numpy as np
import cv2
from .core import (W, H, CACHE, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes,
                   splat_points, blur, fast_blur, grid, star_color, hex2rgb, cached, fbm)
from .space import space_frame, lens_image
from .shots_space import Shot, _lp
from .planet import render_planet
from . import cards
from . import sim as simmod

PCOL = {"Mercury": "#b8b0a8", "Venus": "#f2d7a0", "Earth": "#6fb8ff", "Mars": "#ff8a5c", "Jupiter": "#ffcf9a",
        "Saturn": "#f5e0a8", "Uranus": "#9fe8f0", "Neptune": "#6f8fff"}
ACC = (1.0, 0.62, 0.32)
_SIM = None


def S():
    global _SIM
    if _SIM is None:
        _SIM = simmod.load()
    return _SIM


def _kbo():
    """Kuiper-belt test particles integrated through the same encounter (fixed-step RK4)."""
    s = S()
    rng = np.random.default_rng(5)
    n = 2200
    a = rng.uniform(34, 50, n)
    th = rng.random(n) * 2 * np.pi
    t0, t1, dt = -4.5, -0.5, 0.002
    sun0, sunv = s.sun(t0), s.sun_v(t0)
    pos = sun0 + np.stack([a * np.cos(th), a * np.sin(th)], -1)
    vel = sunv + np.sqrt(simmod.G / a)[:, None] * np.stack([-np.sin(th), np.cos(th)], -1)
    G = simmod.G
    out, ts = [], []

    def acc(p, t):
        sp, bp = s.sun(t), s.bh(t)
        ds, db = sp - p, bp - p
        return G * ds / (np.linalg.norm(ds, axis=1) ** 3)[:, None] + G * simmod.M_BH * db / (np.maximum(np.linalg.norm(db, axis=1), 0.05) ** 3)[:, None]
    t = t0
    k = 0
    while t < t1:
        k1v = acc(pos, t); k1x = vel
        k2v = acc(pos + k1x * dt / 2, t + dt / 2); k2x = vel + k1v * dt / 2
        k3v = acc(pos + k2x * dt / 2, t + dt / 2); k3x = vel + k2v * dt / 2
        k4v = acc(pos + k3x * dt, t + dt); k4x = vel + k3v * dt
        pos = pos + dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x)
        vel = vel + dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v)
        t += dt
        k += 1
        if k % 5 == 0:
            out.append(pos.copy()); ts.append(t)
    return np.array(ts), np.array(out, np.float32)


_KBO = None


def kbo():
    global _KBO
    if _KBO is None:
        p = os.path.join(CACHE, "kbo_v1.npz")
        if not os.path.exists(p):
            ts, ps = _kbo()
            np.savez(p, t=ts, p=ps)
        d = np.load(p)
        _KBO = (d["t"], d["p"])
    return _KBO


def _fmt_t(ty):
    if abs(ty) * 365 < 0.5:
        return "CLOSEST PASS"
    if ty < 0:
        y = -ty
        if y >= 2:
            return f"T – {y:.1f} YEARS"
        if y >= 60 / 365:
            return f"T – {y * 12:.0f} MONTHS"
        return f"T – {y * 365:.0f} DAYS"
    d = ty * 365
    return f"T + {d:.0f} DAYS" if d >= 1 else "CLOSEST PASS"


class System(Shot):
    exposure = 1.4
    INC = np.radians(52)
    ROT = np.radians(8)

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        s = S()
        p = self.p
        if not hasattr(self, "rot"):
            b0 = s.bh(simmod.T0) - s.sun(simmod.T0)
            self.rot = np.pi + 0.42 - np.arctan2(b0[1], b0[0])
        self.ROT = self.rot
        t_a, t_b = p.get("t", (-1, 0))
        ty = _lp(p.get("t", (-1, 0)), u)
        half = _lp(p.get("scale", (40, 40)), u)
        sc = (W * 0.5) / half
        follow = p.get("follow", "sun")
        c = s.bh(ty) if follow == "bh" else s.sun(ty)
        fe = _lp(p.get("focus_earth", (0.0, 0.0)), u)       # 0 = centred as `follow`, 1 = midway to Earth
        if fe:
            c = c + (s.planet(2, ty) - s.sun(ty)) * 0.5 * fe
        cr, sr = np.cos(self.ROT), np.sin(self.ROT)

        def scr(P):
            P = np.asarray(P, np.float64) - c
            x = P[..., 0] * cr - P[..., 1] * sr
            y = P[..., 0] * sr + P[..., 1] * cr
            return np.stack([W / 2 + x * sc, H / 2 + 40 + y * sc * np.cos(self.INC)], -1)
        bh = scr(s.bh(ty))
        s0 = p.get("scale", (half, half))[0]
        img, _ = space_frame(2600 + 200 * ur, 1500, (s0 / half) ** 0.25, angle=3 * ur, lenses=[(bh[0], bh[1], 34)])
        self.last_scr = scr
        img *= 0.55
        lines = np.zeros((H, W), np.uint8)
        trails = np.zeros((H, W, 3), np.float32)
        # original orbits (faint ellipses) around the Sun's current position
        sunp = scr(s.sun(ty))
        for i, (name, a, _, _) in enumerate(simmod.PLANETS):
            rpx = a * sc
            if rpx < 6 or rpx > 4000:
                continue
            cv2.ellipse(lines, (int(sunp[0] * 4), int(sunp[1] * 4)), (int(rpx * 4), int(rpx * np.cos(self.INC) * 4)), np.degrees(self.ROT) * 0, 0, 360, 70, 1, cv2.LINE_AA, 2)
        img += (lines.astype(np.float32) / 255.0)[..., None] * np.array([0.5, 0.6, 0.8], np.float32) * 0.35
        # real trajectories
        for i, (name, a, _, _) in enumerate(simmod.PLANETS):
            period = a ** 1.5
            span_t = min(period * 0.3, max(0.005, ty - t_a) + 0.3 * (t_b - t_a) + 0.004)
            tt = np.linspace(max(simmod.T0, ty - span_t), ty, 140)
            org = s.bh if follow == "bh" else s.sun
            P = scr(np.array([s.planet(i, x) - org(x) + org(ty) for x in tt]))
            col = hex2rgb(PCOL[name])
            lay = np.zeros((H, W), np.uint8)
            for k in range(0, 139, 1):
                v = int(30 + 225 * (k / 139) ** 1.5)
                p0, p1 = P[k], P[k + 1]
                if np.all(np.abs(p0 - [W / 2, H / 2]) < 4000) and np.all(np.abs(p1 - [W / 2, H / 2]) < 4000):
                    cv2.line(lay, tuple((p0 * 4).astype(int)), tuple((p1 * 4).astype(int)), v, 2, cv2.LINE_AA, 2)
            trails += (lay.astype(np.float32) / 255.0)[..., None] * col * 0.9
            q = P[-1]
            if -50 < q[0] < W + 50 and -50 < q[1] < H + 50:
                glow_dot(img, q[0], q[1], col, 2.4, 3.0)
                glow_dot(img, q[0], q[1], col, 9, 0.15)
                if (sc * a > 60 or (name in ("Earth", "Venus") and sc * a > 30)) and 40 < q[0] < W - 260 and 40 < q[1] < H - 40:
                    cards.label(img, name.upper(), q[0] + 14, q[1] - 12, col * 0.9 + 0.1, 0.85, 17)
        img += trails
        # Kuiper belt
        if p.get("scatter"):
            kt, kp = kbo()
            j = int(np.clip(np.searchsorted(kt, ty), 0, len(kt) - 1))
            Q = scr(kp[j])
            fl = np.full((len(Q), 3), 0.05, np.float32) * np.array([0.8, 0.9, 1.0], np.float32)
            img = splat_points(img, Q[:, 0], Q[:, 1], fl, sigma=0.7)
        # Sun
        glow_dot(img, sunp[0], sunp[1], (1.0, 0.85, 0.6), 4, 6)
        glow_dot(img, sunp[0], sunp[1], (1.0, 0.7, 0.4), 30, 0.35)
        if 30 < sunp[0] < W - 120 and 30 < sunp[1] < H - 40:
            cards.label(img, "SUN", sunp[0] + 16, sunp[1] + 16, (1.0, 0.85, 0.6), 0.8, 17)
        # Black hole path (past solid, future dashed) and marker
        tt = np.clip(np.linspace(ty - 3 * max(0.03, half / 60), ty + 3 * max(0.03, half / 60), 200), simmod.T0, simmod.T1)
        P = scr(np.array([s.bh(x) - s.sun(x) + s.sun(ty) for x in tt]))
        lay = np.zeros((H, W), np.uint8)
        for k in range(199):
            future = tt[k] > ty
            if future and (k // 4) % 2:
                continue
            v = 120 if future else 200
            cv2.line(lay, tuple((P[k] * 4).astype(int)), tuple((P[k + 1] * 4).astype(int)), v, 1, cv2.LINE_AA, 2)
        img += (lay.astype(np.float32) / 255.0)[..., None] * np.array([0.75, 0.6, 1.0], np.float32) * 0.5
        ring = np.zeros((H, W), np.uint8)
        cv2.circle(ring, (int(bh[0] * 4), int(bh[1] * 4)), int(46 * 4), 255, 1, cv2.LINE_AA, 2)
        img += (ring.astype(np.float32) / 255.0)[..., None] * np.array(ACC, np.float32) * 0.7
        if 30 < bh[0] < W - 360 and 30 < bh[1] < H - 40:
            cards.label(img, "BLACK HOLE · 10 SUNS", bh[0] + 58, bh[1] - 6, ACC, 0.95, 18)
        elif 30 < bh[0] < W - 30 and 30 < bh[1] < H - 40:
            cards.label(img, "BLACK HOLE · 10 SUNS", bh[0] - 58, bh[1] - 6, ACC, 0.95, 18, anchor="rc")
        # HUD: clock and scale bar
        cards.label(img, _fmt_t(ty), 140, 120, (1.0, 0.97, 0.93), 0.95, 30, kind="mono6", tracking=0.18)
        cards.label(img, "N-BODY SIMULATION", 140, 162, (0.7, 0.74, 0.82), 0.7, 16, tracking=0.3)
        bar_au = [0.5, 1, 2, 5, 10, 20, 50, 100][int(np.clip(np.searchsorted([0.5, 1, 2, 5, 10, 20, 50, 100], half / 4), 0, 7))]
        bl = bar_au * sc
        cards.hline(img, W - 140 - bl, W - 140, H - 110, (0.85, 0.88, 0.95), 0.7, 1)
        cards.label(img, f"{bar_au:g} AU", W - 140, H - 86, (0.75, 0.78, 0.86), 0.8, 16, anchor="rc")
        return img


class Orbit(Shot):
    exposure = 1.4

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        img, _ = space_frame(1500 + 60 * ur, 1800, 1.0 + 0.04 * ur)
        img *= 0.45
        e = _lp(self.p.get("ecc", (0, 0.6)), smooth(span(u, 0.1, 0.6)))
        a = 330.0
        cx, cy = W / 2 + 60, H / 2 + 20
        tilt = np.cos(np.radians(40))
        # Sun at a focus. With r = a(1-e²)/(1+e·cosθ) perihelion (closest, hottest) is at θ = 0, to the RIGHT of the
        # Sun, and aphelion (farthest, coldest) at θ = π, to the left. The ellipse is centred on screen.
        fx = cx + a * e
        th = np.linspace(0, 2 * np.pi, 720)
        r = a * (1 - e * e) / (1 + e * np.cos(th))
        X, Y = fx + r * np.cos(th), cy + r * np.sin(th) * tilt
        lay = np.zeros((H, W, 3), np.float32)
        # colour by distance: hot near the Sun, ice far away
        dn = clamp((r - a * (1 - e)) / max(1, 2 * a * e))
        hot, cold = np.array([1.0, 0.45, 0.15], np.float32), np.array([0.5, 0.8, 1.0], np.float32)
        # (draw with a single polyline per colour band for speed)
        bands = 24
        for bi in range(bands):
            sel = (dn >= bi / bands) & (dn <= (bi + 1) / bands + 0.02)
            if not sel.any():
                continue
            col = hot * (1 - bi / bands) + cold * (bi / bands) if e > 0.05 else np.array([0.6, 0.75, 1.0], np.float32)
            m = np.zeros((H, W), np.uint8)
            idx = np.where(sel)[0]
            groups = np.split(idx, np.where(np.diff(idx) != 1)[0] + 1)
            for g in groups:
                if len(g) > 1:
                    cv2.polylines(m, [np.stack([X[g] * 4, Y[g] * 4], -1).astype(np.int32)], False, 255, 2, cv2.LINE_AA, 2)
            lay += (m.astype(np.float32) / 255)[..., None] * col
        img += lay * 0.8
        # old circular orbit
        m = np.zeros((H, W), np.uint8)
        cv2.ellipse(m, (int(fx * 4), int(cy * 4)), (int(a * 4), int(a * tilt * 4)), 0, 0, 360, 255, 1, cv2.LINE_AA, 2)
        img += (m.astype(np.float32) / 255)[..., None] * 0.18 * (smooth(span(u, 0.1, 0.4)))
        glow_dot(img, fx, cy, (1.0, 0.85, 0.6), 6, 6)
        glow_dot(img, fx, cy, (1.0, 0.7, 0.4), 50, 0.35)
        # Earth moving with Kepler timing
        Mm = (t * 0.55) % (2 * np.pi)
        E = Mm
        for _ in range(12):
            E -= (E - e * np.sin(E) - Mm) / (1 - e * np.cos(E))
        nu = 2 * np.arctan2(np.sqrt(1 + e) * np.sin(E / 2), np.sqrt(1 - e) * np.cos(E / 2))
        rr = a * (1 - e * e) / (1 + e * np.cos(nu))
        ex, ey = fx + rr * np.cos(nu), cy + rr * np.sin(nu) * tilt
        glow_dot(img, ex, ey, (0.45, 0.75, 1.0), 3, 5)
        glow_dot(img, ex, ey, (0.45, 0.75, 1.0), 14, 0.2)
        cards.label(img, "EARTH", ex + 16, ey - 14, (0.6, 0.8, 1.0), 0.85, 17)
        cards.mark("SUN", fx, cy)
        k = smooth(span(u, 0.55, 0.75)) * smooth(clamp(e / 0.3))   # a circle has no hot or cold end: no labels yet
        if k > 0:
            # labels from the same orbit equation that draws the orbit: SCORCHED beside perihelion, FROZEN beside aphelion
            peri_x = fx + a * (1 - e)          # θ = 0
            aph_x = fx - a * (1 + e)           # θ = π
            cards.label(img, "SCORCHED", peri_x + 30, cy, (1.0, 0.55, 0.3), k, 20, anchor="lc", tracking=0.3)
            cards.label(img, "FROZEN", aph_x - 30, cy, (0.6, 0.85, 1.0), k, 20, anchor="rc", tracking=0.3)
        return img


# ───────────────────────── galaxy ─────────────────────────
GS = 3200


def _build_galaxy():
    rng = np.random.default_rng(12)
    buf = np.zeros((GS, GS, 3), np.float32)
    R = GS * 0.46
    n = 1_800_000
    r = rng.exponential(0.42, n) * R
    r = r[r < R * 1.05]
    n = r.size
    th = rng.random(n) * 2 * np.pi
    # spiral arm density (2 main + 2 minor), logarithmic
    pitch = np.radians(13)
    arm_phase = np.log(np.maximum(r, 1) / (R * 0.08)) / np.tan(pitch)
    arm = 0.5 + 0.5 * np.cos(2 * (th - arm_phase))
    arm2 = 0.5 + 0.5 * np.cos(2 * (th - arm_phase) + 1.9)
    keep = (rng.random(n) < (0.1 + 0.9 * np.maximum(arm ** 5, 0.55 * arm2 ** 7))) | (r < R * 0.12)
    r, th, arm = r[keep], th[keep], arm[keep]
    # bar
    nb = 200000
    bx = rng.normal(0, R * 0.12, nb)
    by = rng.normal(0, R * 0.045, nb)
    ang = np.radians(28)
    x = np.concatenate([r * np.cos(th), bx * np.cos(ang) - by * np.sin(ang)]) + GS / 2
    y = np.concatenate([r * np.sin(th), bx * np.sin(ang) + by * np.cos(ang)]) + GS / 2
    rr = np.concatenate([r, np.hypot(bx, by)])
    armv = np.concatenate([arm, np.zeros(nb)])
    temp = np.where(rr < R * 0.2, rng.normal(4300, 600, rr.size), np.where(armv > 0.8, rng.normal(9500, 3000, rr.size), rng.normal(5600, 1500, rr.size)))
    col = star_color(np.clip(temp, 2500, 30000))
    f = (rng.pareto(2.5, rr.size) + 1) * 0.06 * np.where(rr < R * 0.2, 0.3, 1.0)
    buf = splat_points(buf, x, y, col * f[:, None], sigma=0.8)
    glow = fast_blur(buf, 14) * 1.4 + fast_blur(buf, 50) * 0.7
    img = buf + glow
    # HII knots in the arms
    sel = (armv > 0.9) & (rng.random(rr.size) < 0.0025) & (rr > R * 0.25)
    knots = splat_points(np.zeros_like(buf), x[sel], y[sel], np.tile(np.array([[1.0, 0.25, 0.45]], np.float32), (sel.sum(), 1)) * 0.6, sigma=2.2)
    img += knots
    # dust lanes on the inner edge of arms
    yy, xx = np.mgrid[0:GS, 0:GS].astype(np.float32)
    dx, dy = xx - GS / 2, yy - GS / 2
    rad = np.hypot(dx, dy)
    tt = np.arctan2(dy, dx)
    ap = np.log(np.maximum(rad, 1) / (R * 0.08)) / np.tan(pitch)
    lane = (0.5 + 0.5 * np.cos(2 * (tt - ap) - 0.55)) ** 10
    nz = fbm(GS // 4, GS // 4, scale=40, seed=13)
    nz = cv2.resize(nz, (GS, GS))
    dust = clamp(lane * (0.4 + 0.8 * nz) * smooth(span(rad, R * 0.12, R * 0.3)) * (1 - smooth(span(rad, R * 0.8, R))))
    img *= (1 - 0.75 * dust)[..., None]
    return img.astype(np.float16)


_GAL = None


def galaxy_img():
    global _GAL
    if _GAL is None:
        _GAL = cached("galaxy_v2", _build_galaxy).astype(np.float32)
    return _GAL


SUN_G = (GS / 2 + GS * 0.46 * 0.36 * np.cos(np.radians(205)), GS / 2 + GS * 0.46 * 0.36 * np.sin(np.radians(205)))


class Galaxy(Shot):
    exposure = 1.25

    def __init__(self, p, dur, seg_start=0.0):
        super().__init__(p, dur, seg_start)
        rng = np.random.default_rng(31)
        R = GS * 0.46
        r = rng.exponential(0.3, 1400) * R
        th = rng.random(1400) * 2 * np.pi
        self.bhs = np.stack([GS / 2 + r * np.cos(th), GS / 2 + r * np.sin(th)], -1)
        near = rng.normal(0, R * 0.07, (40, 2)) + np.array(SUN_G)
        self.found = near
        self.rog = rng.random((5000, 2)) * GS
        self.rog_ph = rng.random(5000)

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        g = galaxy_img()
        focus = self.p.get("focus")
        z = _lp(self.p.get("zoom", (1, 1)), u)
        fx, fy = SUN_G
        cx = lerp(GS / 2, fx, clamp((z - 1) / 1.2))
        cy = lerp(GS / 2, fy, clamp((z - 1) / 1.2))
        base = W / GS * 1.05 * z
        ang = 18 + 6 * ur
        # oblique: squash y after rotation (warpAffine with a combined matrix)
        tilt = 0.58
        ca, sa = np.cos(np.radians(ang)), np.sin(np.radians(ang))
        A = np.array([[ca, -sa], [sa * tilt, ca * tilt]]) * base
        off = np.array([W / 2, H / 2]) - A @ np.array([cx, cy])
        M = np.hstack([A, off[:, None]]).astype(np.float32)
        bg, _ = space_frame(1200 + 80 * ur, 1200, z ** 0.4, angle=ang * 0.2)
        img = bg * 0.25 + cv2.warpAffine(g, M, (W, H), flags=cv2.INTER_LINEAR)

        def P(pt):
            v = A @ np.asarray(pt, np.float64).T
            return (v.T + off) if np.ndim(pt) > 1 else v + off
        sx, sy = P(SUN_G)
        a = smooth(span(u, 0.1, 0.25))
        glow_dot(img, sx, sy, (1.0, 0.9, 0.7), 3, 3 * a)
        cards.label(img, "YOU ARE HERE", sx + 18, sy + 18, (1.0, 0.92, 0.8), a * 0.9, 17)
        if focus == "ogle":
            ox, oy = P((fx + (GS / 2 - fx) * 0.19, fy + (GS / 2 - fy) * 0.19))
            k = smooth(span(u, 0.35, 0.55))
            m = np.zeros((H, W), np.uint8)
            n = 40
            for i in range(n):
                if i % 2:
                    continue
                p0 = (sx + (ox - sx) * i / n, sy + (oy - sy) * i / n)
                p1 = (sx + (ox - sx) * (i + 1) / n, sy + (oy - sy) * (i + 1) / n)
                cv2.line(m, (int(p0[0] * 4), int(p0[1] * 4)), (int(p1[0] * 4), int(p1[1] * 4)), 255, 1, cv2.LINE_AA, 2)
            img += (m.astype(np.float32) / 255)[..., None] * np.array(ACC, np.float32) * 0.6 * k
            r = np.zeros((H, W), np.uint8)
            cv2.circle(r, (int(ox * 4), int(oy * 4)), int((14 + 6 * np.sin(t * 2)) * 4), 255, 1, cv2.LINE_AA, 2)
            img += (r.astype(np.float32) / 255)[..., None] * np.array(ACC, np.float32) * k
            cards.label(img, "~5,000 LIGHT-YEARS", ox + 26, oy + 6, ACC, k * 0.9, 16)
        elif focus == "rogues":
            Q = P(self.rog)
            tw = 0.4 + 0.6 * np.abs(np.sin(t * 1.3 + self.rog_ph * 30))
            k = smooth(span(u, 0.05, 0.3))
            fl = np.stack([tw * 0.25, tw * 0.75, tw * 0.9], -1).astype(np.float32) * 0.7 * k
            img = splat_points(img, Q[:, 0], Q[:, 1], fl, sigma=0.9)
            cards.label(img, "FREE-FLOATING PLANETS · ILLUSTRATIVE", 140, 120, (0.6, 0.85, 1.0), k * 0.85, 18)
        elif focus == "gaia":
            gx, gy = P((fx + 30, fy - 24))
            k = smooth(span(u, 0.25, 0.5))
            L_ = np.zeros((H, W), np.uint8)
            cv2.line(L_, (int(sx * 4), int(sy * 4)), (int(gx * 4), int(gy * 4)), 255, 1, cv2.LINE_AA, 2)
            cv2.circle(L_, (int(gx * 4), int(gy * 4)), int((12 + 4 * np.sin(t * 2)) * 4), 255, 1, cv2.LINE_AA, 2)
            img += (L_.astype(np.float32) / 255)[..., None] * np.array(ACC, np.float32) * k
            cards.label(img, "~1,560 LIGHT-YEARS", gx + 24, gy - 10, ACC, k * 0.9, 16)
        elif focus == "blackholes":
            k = smooth(span(u, 0.08, 0.5))
            Q = P(self.bhs)
            nshow = int(len(Q) * k)
            fl = np.tile(np.array([[0.55, 0.3, 1.0]], np.float32), (nshow, 1)) * 4.0
            img = splat_points(img, Q[:nshow, 0], Q[:nshow, 1], fl, sigma=1.4)
            k2 = smooth(span(u, 0.4, 0.6))
            F = P(self.found)
            for (qx, qy) in F:
                glow_dot(img, qx, qy, ACC, 2.0, 2.0 * k2)
            cards.label(img, "VIOLET · EACH DOT = ~70,000 BLACK HOLES", 140, 120, (0.75, 0.6, 1.0), k * 0.85, 18)
            cards.label(img, "ORANGE · THE FEW DOZEN WE'VE FOUND", 140, 152, ACC, k2 * 0.85, 18)
        return img


class Moon(Shot):
    """Earth loses the Moon: it slides off its orbit toward the black hole."""

    def render(self, u, t, fi):

        ur = self.p.get("_ur", u)   # progress through the whole continuous shot (camera drift)
        img, _ = space_frame(4200 - 100 * ur, 1900, 1.0 + 0.05 * ur, angle=-1.5 * ur)
        img *= 0.75
        ex, ey, ER = 560, 600, 250
        render_planet(img, ex, ey, ER, "earth", spin=4.0 + t * 0.06, tilt=0.4, light=(0.75, 0.25, 0.6))
        # old orbit
        orb_r = 520
        m = np.zeros((H, W), np.uint8)
        cv2.ellipse(m, (int(ex * 4), int(ey * 4)), (int(orb_r * 4), int(orb_r * 0.32 * 4)), -8, 0, 360, 255, 1, cv2.LINE_AA, 2)
        img += (m.astype(np.float32) / 255)[..., None] * np.array([0.6, 0.7, 0.9], np.float32) * 0.22
        d0, d1 = self.p.get("drift", (0.0, 1.0))
        dd = lerp(d0, d1, u)                       # story progress (continuous across beats)
        k = ease_in(span(dd, 0.25, 1.0), 2.2)
        ang = np.radians(-20 + 50 * dd)
        mx0 = ex + orb_r * np.cos(ang)
        my0 = ey + orb_r * 0.32 * np.sin(ang)
        mx = lerp(mx0, 1750, k)
        my = lerp(my0, 230, k)
        MR = 70 * (1 - 0.55 * k)
        render_planet(img, mx, my, MR, "moon", spin=1.0, tilt=0.1, light=(0.75, 0.25, 0.6), atmo=(0, 0, 0), exposure=1.1)
        cards.label(img, "THE MOON", mx + MR + 14, my + MR * 0.4, (0.85, 0.88, 0.95), 0.8 * (1 - smooth(span(dd, 0.85, 1))), 17)
        img = lens_image(img, 1700, 190, 70, shadow=0.32)
        return img
