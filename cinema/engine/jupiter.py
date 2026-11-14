"""Jupiter scenes: the descent environment (cloud decks in perspective, fading sunlight, lightning, thermal glow,
the falling ship), the globe with its radiation belts, and the interior slice.

Physical layout of the cloud decks (depth below the 1-bar level, km; positive = down):
  ammonia ice      -12 … 4     (0.6–1.1 bar)   white/cream
  NH4SH            14 … 30     (1.5–2.5 bar)   brown/orange
  water            46 … 70     (4–7 bar)       blue-grey
"""
import numpy as np
import cv2
from .core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, blur, fast_blur, cached,
                   star_color, grid, splat_points)
from .planet import render_planet, tex

F = 900.0  # focal length (px) of the descent camera

DECKS = [
    dict(name="nh3", top=-12.0, bot=-4.0, col=(1.0, 0.95, 0.88), seed=11, S=70.0, hmax=3.2),
    dict(name="nh4sh", top=14.0, bot=30.0, col=(0.88, 0.55, 0.30), seed=23, S=60.0, hmax=3.0),
    dict(name="h2o", top=46.0, bot=58.0, col=(0.68, 0.74, 0.84), seed=37, S=55.0, hmax=6.0),
]


def tile_fbm(n=1024, scale=128, octaves=6, seed=0, persistence=0.55):
    """Seamlessly tileable fractal noise in [0,1]."""
    rng = np.random.default_rng(seed)
    out = np.zeros((n, n), np.float32)
    amp, tot, s = 1.0, 0.0, float(scale)
    for _ in range(octaves):
        g = max(2, int(round(n / s)))
        grd = rng.random((g, g)).astype(np.float32)
        pad = np.pad(grd, 2, mode="wrap")
        up = cv2.resize(pad, ((g + 4) * n // g, (g + 4) * n // g), interpolation=cv2.INTER_CUBIC)
        o = 2 * n // g
        out += amp * up[o:o + n, o:o + n]
        tot += amp
        amp *= persistence
        s /= 2
        if s < 2:
            break
    out /= tot
    lo, hi = np.percentile(out, 1), np.percentile(out, 99)
    return clamp((out - lo) / (hi - lo + 1e-6))


def _cloud_tex(seed):
    def mk():
        a = tile_fbm(1024, 160, 7, seed)
        b = tile_fbm(1024, 40, 5, seed + 1)
        c = np.clip(a * 0.75 + b * 0.35 - 0.05, 0, 1) ** 1.3
        return c.astype(np.float32)
    return cached(f"jcloud_{seed}", mk)


_TEX = {}


def cloud_levels(seed):
    if seed not in _TEX:
        t0 = _cloud_tex(seed)
        def wblur(a, s):  # wrap-around blur (tileable)
            p = int(s * 3) + 2
            return cv2.GaussianBlur(np.pad(a, p, mode="wrap"), (0, 0), s)[p:-p, p:-p]
        _TEX[seed] = [t0] + [wblur(t0, s) for s in (2.0, 6.0, 16.0)]
    return _TEX[seed]


def sunlight(z):
    """Fraction of sunlight reaching depth z (km): dimmed by each deck, gone below the water clouds."""
    s = 1.0
    s *= lerp(1.0, 0.5, smooth(span(z, -12, -4)))
    s *= lerp(1.0, 0.4, smooth(span(z, 14, 30)))
    s *= lerp(1.0, 0.0, smooth(span(z, 56, 78)))
    return float(s)


def thermal(T):
    """Visible thermal glow (display-scaled) and its colour, for air at T kelvin. Nothing below the Draper point
    (~798 K), a dull red just above it, orange by ~1,300 K."""
    e = 0.34 * smooth(clamp((T - 795.0) / 220.0)) + 0.30 * smooth(clamp((T - 1000.0) / 450.0)) + 0.14 * clamp((T - 1450.0) / 3000.0)
    col = star_color(max(800.0, min(T, 1450.0))) * 0.55
    return float(e), np.asarray(col, np.float32)


def fog_len(z):
    """Visibility (km) through the haze at depth z."""
    return float(np.interp(z, [-40, 0, 40, 80, 160, 320, 700, 3000], [400, 260, 90, 45, 18, 6, 2.5, 1.2]))


def haze_col(z, S):
    c = np.array([0.80, 0.78, 0.74], np.float32) if z < 10 else (np.array([0.62, 0.48, 0.34], np.float32) if z < 40 else np.array([0.42, 0.46, 0.52], np.float32))
    return c * (0.08 + 0.92 * S)


def lightning_events(seed, dur, rate=0.5):
    rng = np.random.default_rng(seed)
    ev, t = [], rng.uniform(0.3, 1.2)
    while t < dur:
        ev.append(dict(t=t, x=rng.uniform(0.1, 0.9), y=rng.uniform(0.0, 1.0), s=rng.uniform(0.6, 1.4), seed=int(rng.integers(1e6))))
        t += rng.exponential(1.0 / rate) + 0.25
    return ev


def flash_env(t, t0):
    d = t - t0
    if d < 0 or d > 0.7:
        return 0.0
    return float(np.exp(-d / 0.09) * (1 + 0.8 * np.sin(d * 70) ** 2))


class Descent:
    """The falling-camera environment. z: depth below 1 bar (km); v: speed (km/h); T: air temperature (K)."""

    def __init__(self, seed=5, horizon=0.40):
        self.seed = seed
        self.hz = horizon
        rng = np.random.default_rng(seed)
        self.np_ = 260
        self.px = rng.uniform(0, W, self.np_)
        self.py = rng.uniform(0, H + 300, self.np_)
        self.pk = rng.uniform(0.3, 1.0, self.np_) ** 2
        self.turb = cached(f"jturb_{seed}", lambda: tile_fbm(1024, 120, 6, seed + 7))
        self.cells = cached(f"jcells_{seed}", lambda: tile_fbm(1024, 260, 5, seed + 9))

    # ── 3D cloud tops (ray-marched heightfield at half resolution) ──
    def _field(self, deck):
        key = ("hf", deck["seed"])
        if key not in _TEX:
            def mk():
                a = tile_fbm(1024, 180, 6, deck["seed"] + 500, persistence=0.5)
                b = tile_fbm(1024, 45, 4, deck["seed"] + 501, persistence=0.5)
                h = np.clip(a * 0.85 + b * 0.25 - 0.42, 0, None)
                h = h / (h.max() + 1e-6)
                h = np.sqrt(np.clip(1 - (1 - h) ** 2, 0, 1))      # rounded, billowy tops
                p_ = 12
                h = cv2.GaussianBlur(np.pad(h, p_, mode="wrap"), (0, 0), 3.0)[p_:-p_, p_:-p_]
                return (h / h.max()).astype(np.float32)
            h = cached(f"jhf2_{deck['seed']}", mk)
            gy, gx = np.gradient(h)
            tint = tile_fbm(1024, 340, 4, deck["seed"] + 600)
            _TEX[key] = (h, gx.astype(np.float32), gy.astype(np.float32), tint)
        return _TEX[key]

    def _clouds(self, deck, hc, t, below=True, hmax=4.0, drift=0.0):
        """Ray-march a cumulus heightfield seen from height hc (km) above (below=True) or under its base.
        Returns colour factor (shade), mask, distance at full resolution."""
        w, hh = W // 2, H // 2
        xs, ys = grid(w, hh)
        yh = hh * self.hz
        f = F / 2
        dx = (xs - w / 2) / f
        dy = (ys - yh) / f if below else (yh - ys) / f
        S = deck["S"]
        h, gx, gy, tint = self._field(deck)
        hit = np.zeros((hh, w), bool)
        dist = np.full((hh, w), 1e6, np.float32)
        hv = np.zeros((hh, w), np.float32)
        sk = np.geomspace(0.15, 420.0, 150).astype(np.float32)
        prev_s, prev_g = None, None
        for s_ in sk:
            Y = hc - s_ * dy                       # ray height above the deck base
            if (Y > hmax).all():
                prev_s, prev_g = s_, None
                continue
            X = s_ * dx
            u = ((X / S + drift + t * 0.003) * 1024) % 1024
            vv = np.full_like(u, ((s_ / S) * 1024) % 1024)
            hs = cv2.remap(h, u.astype(np.float32), vv.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * hmax
            g_ = Y - hs
            new = (~hit) & (g_ <= 0)
            if new.any():
                if prev_g is not None:
                    fr = np.clip(prev_g / np.maximum(prev_g - g_, 1e-6), 0, 1)   # refine the crossing
                    sh = prev_s + (s_ - prev_s) * fr
                else:
                    sh = np.full_like(g_, s_)
                dist[new] = sh[new]
                hv[new] = hs[new] / hmax
                hit |= new
            prev_s, prev_g = s_, g_
            if hit.all():
                break
        # shading at the hit point
        X = dist * dx
        u = (((X / S + drift + t * 0.003) * 1024) % 1024).astype(np.float32)
        v = (((dist / S) * 1024) % 1024).astype(np.float32)
        nx = cv2.remap(gx, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * hmax * 1024 / S
        nz = cv2.remap(gy, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * hmax * 1024 / S
        tn = cv2.remap(tint, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        L = np.array([-0.5, 0.75, 0.42])  # sun from upper left, behind
        nrm = np.sqrt(nx * nx + nz * nz + 1)
        lam = np.clip((-nx * L[0] + 1 * L[1] - nz * L[2]) / nrm, 0, 1)
        shade = (0.32 + 0.72 * lam) * (0.45 + 0.65 * hv ** 0.7)
        if not below:
            shade = 0.25 + 0.35 * hv
        up = lambda a: cv2.GaussianBlur(cv2.resize(a.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 1.2)
        shade = shade * (0.55 + 0.45 * smooth(clamp(hv * 3.0)))
        return up(shade), up(hit.astype(np.float32)), up(np.minimum(dist, 1e4)), up(tn), up(hv)

    def render(self, z, v, T, t, ship=None, light_rate=0.0, cam_roll=0.0, sun=(0.22, 0.12), glow_boost=1.0,
               flash_seed=None, deep=False, extra_flash=0.0, scroll=None, motion=None):
        """scroll: how far the world has streamed UP past the camera (px, continuous, from fall_scroll(z));
        motion: px it moved since the previous frame (sets streak length / motion blur). None → legacy speed-based."""
        if scroll is None:
            scroll, motion = t * v * 0.9, v * 0.9 / 30.0
        S = sunlight(z)
        e, gcol = thermal(T)
        e *= glow_boost
        xs, ys = grid()
        yh = H * self.hz
        Lf = fog_len(z)
        hz = haze_col(z, S)
        fogc = hz + gcol * e * 0.9
        # lightning (in and below the storm layer)
        fl, fx, fy, fev = 0.0, 0.5, 0.7, None
        if light_rate > 0:
            for ev in lightning_events(flash_seed if flash_seed is not None else self.seed, t + 2, light_rate):
                a = flash_env(t, ev["t"]) * ev["s"]
                if a > fl:
                    fl, fx, fy, fev = a, ev["x"], ev["y"], ev
        fl += extra_flash
        # sky / background
        sky_top = np.array([0.03, 0.08, 0.26], np.float32) * S
        sky_hor = np.array([0.72, 0.74, 0.80], np.float32) * S
        g = clamp((yh - ys) / yh)[..., None]
        img = sky_hor * (1 - g ** 0.6) + sky_top * g ** 0.6
        if S > 0.3 and z < -5:
            sx, sy = W * sun[0], H * sun[1]
            glow_dot(img, sx, sy, (1.0, 0.95, 0.85), 10, 2.5 * S)
            glow_dot(img, sx, sy, (1.0, 0.9, 0.75), 160, 0.25 * S)
        # nearest deck below (floor) and above (ceiling). Crossing a deck boundary swaps which deck is the floor or the
        # ceiling; those swaps are blended over 2.5 km of depth so the picture never jumps (docs/QUALITY_GATE.md #8).
        below = [d for d in DECKS if d["top"] > z]
        above = [d for d in DECKS if d["bot"] < z]
        inside = [d for d in DECKS if d["top"] <= z <= d["bot"]]
        XZ = 2.5

        def ceiling(im, dk):
            if dk is None:
                return im
            dz = max(0.2, z - dk["bot"])
            c, m, d, tn, hv = self._clouds(dk, dz, t, below=False, hmax=3.0)
            col = np.asarray(dk["col"], np.float32) * (0.05 + sunlight(dk["top"]) * 0.45) * (0.75 + 0.3 * hv[..., None])
            col = cv2.GaussianBlur(col, (0, 0), 6)
            f = np.exp(-d / (Lf * 0.5))[..., None]
            col = col * f + fogc * (1 - f)
            return im * (1 - m[..., None]) + col * m[..., None]

        def floor(im, dk):
            if dk is None:
                return np.where((ys > yh)[..., None], fogc, im)     # no deck below: haze all the way down
            hmax = dk.get("hmax", 5.0)
            dz = max(0.15, dk["top"] - z + hmax * 0.85)
            c, m, d, tn, hv = self._clouds(dk, dz, t, below=True, hmax=hmax)
            St = sunlight(dk["top"] - 0.5)
            base = np.asarray(dk["col"], np.float32)
            base = base * (0.85 + 0.3 * tn[..., None]) * np.array([1.0, 0.98, 0.96], np.float32) ** (tn[..., None] * 4)
            col = base * c[..., None] * (0.05 + 1.05 * St)
            vf = ((1 - smooth(clamp(hv * 2.2))) * 0.75)[..., None]      # haze pooled in the valleys
            col = col * (1 - vf) + (base * (0.06 + 0.7 * St) * 0.75 + fogc * 0.3) * vf
            if fl > 0:      # lightning lights the deck from inside
                lx, ly = W * fx, yh + (H - yh) * (0.25 + 0.7 * fy)
                r2 = ((xs - lx) ** 2 + ((ys - ly) * 1.8) ** 2) / (260 * (1 + fy)) ** 2
                col = col + (np.exp(-r2) * fl * (0.6 + 0.6 * c))[..., None] * np.array([0.8, 0.85, 1.0], np.float32) * 2.2
            f = np.exp(-d / Lf)[..., None]
            col = col * f + fogc * (1 - f)
            return im * (1 - m[..., None]) + col * m[..., None]

        cur_c = above[-1] if above else None
        out = ceiling(img, cur_c)
        if cur_c is not None and z - cur_c["bot"] < XZ:          # just left a deck: it only now became the ceiling
            old = above[-2] if len(above) > 1 else None
            w = smooth(clamp((z - cur_c["bot"]) / XZ))
            out = ceiling(img, old) * (1 - w) + out * w
        img = out
        cur_f = below[0] if below else None
        out = floor(img, cur_f)
        entered = [d for d in DECKS if 0 <= z - d["top"] < XZ]  # just entered a deck: it was the floor a moment ago
        if entered:
            w = smooth(clamp((z - entered[0]["top"]) / XZ))
            out = floor(img, entered[0]) * (1 - w) + out * w
        img = out
        # soften the horizon seam between ceiling and floor
        band = np.exp(-((ys - yh) / 26.0) ** 2)[..., None]
        img = img * (1 - band) + cv2.GaussianBlur(img, (0, 0), 14) * band
        # blend toward the fog everywhere in deep/murky air (aerial perspective of the whole frame)
        murk = clamp(1 - Lf / 60.0)
        img = img * (1 - murk) + fogc * murk
        # inside a deck: fog, rushing upward past the camera. The mist starts 1.5 km ABOVE the deck top, so plunging
        # into a cloud layer at speed reads as a dive into mist, not as the screen suddenly filling.
        near = inside + [d for d in DECKS if d["top"] - 1.5 < z < d["top"]]
        for dk in near:
            k = min(1.0, (z - (dk["top"] - 1.5)) / 3.0, (dk["bot"] - z) / 1.5)
            k = smooth(clamp(k))
            off = scroll % 1024
            tu = self._scroll(self.turb, off, 1.0)
            tc = self._scroll(self.cells, off * 0.5, 2.0)
            dens = clamp(0.35 + 0.55 * tu * tc + 0.2 * tu)
            mb = min(60.0, motion * 0.6)
            if mb > 1.0:     # streaking fog: motion blur along the fall; fractional length so it never steps
                k0 = int(mb)
                d0 = cv2.blur(dens, (1, k0)) if k0 > 1 else dens
                d1 = cv2.blur(dens, (1, k0 + 1))
                dens = d0 + (d1 - d0) * (mb - k0)
            St = sunlight(z)
            fc = np.asarray(dk["col"], np.float32) * (0.10 + 0.95 * St) * (0.55 + 0.6 * dens[..., None])
            if fl > 0:
                fc = fc + np.array([0.8, 0.85, 1.0], np.float32) * min(fl, 0.8) * 0.6 * (0.5 + dens[..., None])
            img = img * (1 - k * 0.92) + fc * k * 0.92
        # deep convective glow structure
        if e > 0.02:
            off = (scroll * 0.5 + t * 4.0) % 2048
            tu = self._scroll(self.cells, off, 1.6, sx=0.6)
            tb = self._scroll(self.turb, off * 1.7, 0.8)
            plume = self._scroll(self.turb, off * 2.2, 2.4, sx=0.18)       # tall rising columns
            st = (0.25 + 1.5 * (tu * 0.5 + tb * 0.2 + plume * 0.5) ** 2.2)[..., None]
            img = img * (1 - e * 0.65) + gcol * e * st * 1.1
            # heat shimmer: warp the frame slightly with drifting noise
            xs, ys = grid()
            dxw = (self._scroll(self.cells, off * 3.0, 0.7) - 0.5) * 6 * e
            img = cv2.remap(img, (xs + dxw).astype(np.float32), (ys + dxw * 0.6).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        # global lightning flash
        if fl > 0:
            img = img + np.array([0.75, 0.82, 1.0], np.float32) * fl * (0.25 if S < 0.2 else 0.08)
            if fev is not None and flash_env(t, fev["t"]) > 0.4:
                img = self._bolt(img, fev, yh, fl)
        # particles: ice / droplets / embers rushing up past the camera
        img = self._particles(img, scroll, motion, t, S, fogc, e, gcol, inside, z)
        if ship is not None:
            img = draw_ship(img, ship, S, fogc, e, gcol, fl)
        if cam_roll:
            M = cv2.getRotationMatrix2D((W / 2, H / 2), cam_roll, 1.03)
            img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return img

    def _scroll(self, tx, off, scale, sx=1.0):
        """Map a tileable texture onto the screen, scrolled upward by off texels (we are falling)."""
        xs, ys = grid()
        u = ((xs * sx / scale) % 1024).astype(np.float32)
        v = ((ys / scale + off) % 1024).astype(np.float32)
        return cv2.remap(tx, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)

    def _bolt(self, img, ev, yh, fl):
        rng = np.random.default_rng(ev["seed"])
        x = W * ev["x"]
        y0 = yh + (H - yh) * (0.05 + 0.4 * ev["y"])
        pts = [(x, y0)]
        for _ in range(14):
            x += rng.normal(0, 18)
            y0 += rng.uniform(10, 26)
            pts.append((x, y0))
        m = np.zeros((H, W), np.uint8)
        cv2.polylines(m, [np.round(np.array(pts) * 16).astype(np.int32)], False, 255, 2, cv2.LINE_AA, 4)
        mm = m.astype(np.float32) / 255.0
        g = fast_blur(mm, 6)
        return img + (mm * 3.0 + g * 2.5)[..., None] * np.array([0.85, 0.9, 1.0], np.float32) * min(1.0, fl)

    def _particles(self, img, scroll, motion, t, S, fogc, e, gcol, inside, z):
        """Ice / droplets / embers streaming UP past the falling camera. Each streak is exactly the distance the particle
        moved this frame, bright at its leading (upper) end and fading behind it, so the direction is unambiguous."""
        n = int(self.np_ * (0.6 if inside else 0.25)) if e < 0.05 else int(self.np_ * 0.5)
        par = 0.4 + self.pk[:n]                                   # parallax: near particles move faster
        y = (self.py[:n] - scroll * 0.75 * par) % (H + 300) - 150
        x = self.px[:n] + np.sin(t * 0.7 + self.py[:n]) * 10
        Lst = np.clip(motion * 0.75 * par, 1.5, 160)
        m = np.zeros((H, W), np.uint8)
        for xi, yi, li, ki in zip(x, y, Lst, self.pk[:n]):
            a = 60 + 195 * ki
            th = 1 + int(ki * 2)
            X = int(xi * 16)
            for s0, s1, g in ((0.0, 0.25, 1.0), (0.25, 0.6, 0.55), (0.6, 1.0, 0.22)):
                cv2.line(m, (X, int((yi + li * s0) * 16)), (X, int((yi + li * s1) * 16)), int(a * g), th, cv2.LINE_AA, 4)
        mm = m.astype(np.float32) / 255.0
        col = fogc * 1.6 + np.array([0.6, 0.65, 0.7], np.float32) * S * 0.9 + gcol * e * 4.0
        return img + mm[..., None] * col * (0.28 + 0.5 * e)


# ───────────────────────────── the ship ─────────────────────────────
def _mask_poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.round(np.asarray(pts) * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    return m.astype(np.float32) / 255.0


def draw_ship(img, sh, S, fogc, e, gcol, fl):
    """A 4-metre titanium crew sphere with a keel ring of lights, two tail fins and a mast (it falls fins-up like a dart),
    plus floodlights that cut cones through the haze. sh: dict(x, y, r, t, crush, hull_glow, beams, tilt)."""
    cx, cy, R = sh["x"], sh["y"], sh["r"]
    t = sh.get("t", 0.0)
    crush = sh.get("crush", 0.0)
    if crush >= 1.0:
        return img
    beams = sh.get("beams", 0.0) * (1 - crush)
    amb = fogc * 0.9 + gcol * e * 1.2
    # floodlight cones (drawn first, behind the hull)
    if beams > 0:
        xs, ys = grid()
        for sgn in (-1, 1):
            ox, oy = cx + sgn * 0.42 * R, cy + 0.82 * R
            ang = np.radians(90 - sgn * 14)
            dxv, dyv = np.cos(ang), np.sin(ang)
            px, py = xs - ox, ys - oy
            along = px * dxv + py * dyv
            perp = np.abs(-px * dyv + py * dxv)
            wid = 0.24 * along + 6
            cone = clamp(1 - perp / np.maximum(wid, 1)) ** 1.5 * (along > 0) * np.exp(-np.maximum(along, 0) / 650.0)
            img = img + cone[..., None] * np.array([1.0, 0.92, 0.78], np.float32) * beams * 0.55
    x0, x1 = int(max(0, cx - R * 2.2)), int(min(W, cx + R * 2.2))
    y0, y1 = int(max(0, cy - R * 2.8)), int(min(H, cy + R * 2.0))
    if x1 <= x0 or y1 <= y0:
        return img
    # tail fins + mast (behind the sphere's upper half)
    metal = np.array([0.42, 0.44, 0.48], np.float32)
    for sgn in (-1, 1):
        fin = [(cx + sgn * 0.35 * R, cy - 0.8 * R), (cx + sgn * 0.95 * R, cy - 1.55 * R), (cx + sgn * 0.85 * R, cy - 1.75 * R),
               (cx + sgn * 0.12 * R, cy - 1.05 * R)]
        if crush > 0:
            fin = [(cx + (x - cx) * (1 - 0.5 * crush), cy + (y - cy) * (1 - 0.5 * crush)) for x, y in fin]
        m = _mask_poly(fin)[..., None]
        shade = metal * (0.25 + 0.9 * S * (0.6 if sgn < 0 else 0.35)) + amb * 0.55
        img = img * (1 - m) + shade * m
    mm = _mask_poly([(cx - R * 0.03, cy - R * 0.9), (cx + R * 0.03, cy - R * 0.9), (cx + R * 0.015, cy - R * 2.0), (cx - R * 0.015, cy - R * 2.0)])[..., None]
    img = img * (1 - mm) + (metal * 0.5 + amb * 0.4) * mm
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = (xs - cx) / R, (ys - cy) / R
    ang = np.arctan2(dy, dx)
    rr = np.sqrt(dx * dx + dy * dy)
    if crush > 0:
        dent = 1 - crush * 0.5 * (0.65 + 0.35 * np.sin(ang * 5 + 1.3) * np.sin(ang * 3 - 0.4))
        rr = rr / np.maximum(0.2, dent)
    nz = np.sqrt(np.maximum(0, 1 - np.minimum(rr, 1) ** 2))
    k = np.minimum(rr, 1) / np.maximum(rr, 1e-3)
    nx, ny = dx * k, dy * k
    base = np.array([0.58, 0.60, 0.64], np.float32)
    Ld = np.array([-0.55, -0.55, 0.62], np.float32)
    ndl = np.clip(nx * Ld[0] + ny * Ld[1] + nz * Ld[2], 0, 1)
    rim = (1 - nz) ** 2.4
    below = np.clip(ny * 0.5 + 0.5, 0, 1)
    col = base * (ndl * 1.5 * S + 0.10)[..., None]
    col = col + base * amb[None, None, :] * (0.45 + 0.55 * (1 - below))[..., None] * 0.8
    col = col + amb[None, None, :] * rim[..., None] * 1.1
    col = col + gcol[None, None, :] * e * below[..., None] * 0.8
    if fl > 0:
        col = col + np.array([0.8, 0.85, 1.0], np.float32) * fl * 0.6 * (0.3 + 0.7 * below)[..., None]
    hdir = np.array([Ld[0], Ld[1], Ld[2] + 1.0]); hdir = hdir / np.linalg.norm(hdir)
    spec = np.clip(nx * hdir[0] + ny * hdir[1] + nz * hdir[2], 0, 1) ** 70 * 1.8 * S
    col = col + spec[..., None]
    # panel seams (meridians + latitudes) for scale
    lat = np.arcsin(np.clip(-ny, -1, 1))
    lon = np.arctan2(nx, np.maximum(nz, 1e-3))
    seam = (np.abs(np.sin(lon * 4)) < 0.05) | (np.abs(np.sin(lat * 4)) < 0.045)
    col = col * (1 - 0.22 * (seam & (nz > 0.15))[..., None])
    # keel ring: a thick dark band around the equator with running lights
    band = np.exp(-((ny - 0.08) / 0.09) ** 2) * (nz > 0)
    col = col * (1 - 0.65 * band[..., None]) + np.array([0.12, 0.12, 0.14], np.float32) * band[..., None] * 0.5
    # viewport: framed porthole with warm cabin light
    vx, vy = -0.30, -0.18
    vr = np.sqrt((nx - vx) ** 2 + (ny - vy) ** 2)
    vp = clamp((0.17 - vr) * 70) * (nz > 0.3)
    frame = clamp(1 - np.abs(vr - 0.19) * 45) * (nz > 0.3)
    cabin = np.array([1.0, 0.70, 0.40], np.float32) * (1.5 - 1.2 * crush)
    col = col * (1 - frame[..., None] * 0.75)
    col = col * (1 - vp[..., None]) + cabin * vp[..., None]
    hg = sh.get("hull_glow", 0.0)
    if hg > 0:
        col = col + gcol[None, None, :] * hg * (0.5 + 0.5 * nz)[..., None] * 0.9
    a = clamp((1 - rr) * R * 0.9)
    reg = img[y0:y1, x0:x1]
    img[y0:y1, x0:x1] = reg * (1 - a[..., None]) + col * a[..., None]
    if crush < 0.6:
        # running lights on the keel ring, beacon on the mast, cabin spill
        for i in range(7):
            th = -np.pi * 0.8 + i * np.pi * 1.6 / 6
            lx, ly = cx + np.sin(th) * R * 0.99, cy + 0.08 * R + np.cos(th) * 0.0
            if np.cos(th) > 0.05:
                glow_dot(img, lx, ly, (0.75, 0.9, 1.0), 2.2 + R / 60, 2.0 * (0.6 + 0.4 * np.sin(t * 3 + i)))
        if np.sin(t * 5.0) > 0.4:
            glow_dot(img, cx, cy - R * 2.0, (1.0, 0.18, 0.12), 3 + R / 30, 4.0)
            glow_dot(img, cx, cy - R * 2.0, (1.0, 0.2, 0.1), 34, 0.25)
        for sgn in (-1, 1):
            glow_dot(img, cx + sgn * 0.42 * R, cy + 0.82 * R, (1.0, 0.95, 0.85), 4 + R / 25, 3.0 * max(0.2, beams))
    glow_dot(img, cx + vx * R, cy + vy * R, (1.0, 0.7, 0.4), R * 0.45, 0.16 * (1 - crush))
    return img


# ───────────────────────────── globe + belts ─────────────────────────────
# Great Red Spot in the texture (8k_jupiter.jpg, measured): centre at longitude fraction 0.3699, latitude −20°;
# the visible oval spans ~19° of longitude and ~9.5° of latitude.
GRS_LON, GRS_LAT = 2 * np.pi * 0.3699, np.radians(-20.0)
GRS_HALF_LON, GRS_HALF_LAT = np.radians(9.5), np.radians(4.8)
GRS_SPIN = GRS_LON            # brings the Great Red Spot to the centre of the disk
GRS_TILT = 0.33               # ~19° south


def sphere_to_screen(cx, cy, R, lat, lon, spin, tilt):
    """Inverse of planet._rot: a point on the globe (lat, texture longitude) → screen (x, y) and depth nz (>0 = visible)."""
    a = lon - spin
    cl = np.cos(lat)
    nx, z1, y1 = cl * np.sin(a), cl * np.cos(a), np.sin(lat)
    ct, st = np.cos(tilt), np.sin(tilt)
    ny = y1 * ct + z1 * st
    nz = -y1 * st + z1 * ct
    return cx + nx * R, cy - ny * R, nz


def grs_outline(cx, cy, R, spin, tilt, pad=1.15, n=96):
    """Screen outline of the Great Red Spot for the globe as drawn: (points Nx2, centre (x, y), visible fraction)."""
    th = np.linspace(0, 2 * np.pi, n)
    lat = GRS_LAT + GRS_HALF_LAT * pad * np.sin(th)
    lon = GRS_LON + GRS_HALF_LON * pad * np.cos(th)
    x, y, nz = sphere_to_screen(cx, cy, R, lat, lon, spin, tilt)
    gx, gy, gz = sphere_to_screen(cx, cy, R, GRS_LAT, GRS_LON, spin, tilt)
    return np.stack([x, y], -1), (float(gx), float(gy)), float(np.mean(nz > 0))


def globe(img, cx, cy, R, spin=GRS_SPIN, tilt=0.06, light=(-0.75, 0.2, 0.62), exposure=1.0):
    render_planet(img, cx, cy, R, "jupiter", spin=spin, tilt=tilt, light=light, exposure=exposure)
    return img


def belts(img, cx, cy, R, t, alpha=1.0, incl=0.18, n=26000, seed=4):
    """Radiation belts: a thin glowing torus of trapped particles, occluded by the planet."""
    if alpha <= 0:
        return img
    rng = np.random.default_rng(seed)
    rad = np.concatenate([rng.normal(1.65, 0.12, n // 2), rng.normal(2.6, 0.35, n // 2)])
    th = rng.uniform(0, 2 * np.pi, n) + t * 0.15 / rad
    hgt = rng.normal(0, 0.05, n) * rad
    x = rad * np.cos(th)
    zz = rad * np.sin(th)
    y = hgt
    ci, si = np.cos(incl + np.pi / 2 - 0.0), np.sin(incl)
    sy = cy + (y * np.cos(incl) - zz * np.sin(incl)) * R
    sx = cx + x * R
    depth = y * np.sin(incl) + zz * np.cos(incl)  # >0 toward the viewer
    on_disk = ((sx - cx) ** 2 + (sy - cy) ** 2) < (R * 0.995) ** 2
    vis = ~(on_disk & (depth < 0))
    buf = np.zeros((H, W, 3), np.float32)
    ok = vis & (sx > 0) & (sx < W - 1) & (sy > 0) & (sy < H - 1)
    col = np.array([0.55, 0.45, 1.0], np.float32)
    buf = splat_points(buf, sx[ok], sy[ok], np.tile(col * 0.9, (int(ok.sum()), 1)), 0.9)
    g = fast_blur(buf, 5)
    return img + (buf * 0.5 + g * 3.0) * alpha


# ───────────────────────────── interior slice ─────────────────────────────
RJ_KM = 69911.0


def slice_color(depth_km):
    """Interior colours ordered by depth: cloud bands, the dark water-cloud zone, the glowing red/orange molecular
    envelope, the blue-grey metallic-hydrogen ocean, and the white-hot diffuse core."""
    d = np.asarray(depth_km, np.float32)
    stops = np.array([0, 40, 80, 160, 310, 600, 1500, 5000, 8500, 12000, 25000, 42000, 58000, 69911], np.float32)
    cols = np.array([[0.95, 0.80, 0.60], [0.75, 0.55, 0.38], [0.30, 0.34, 0.42], [0.06, 0.06, 0.08], [0.30, 0.05, 0.02],
                     [0.95, 0.32, 0.06], [1.05, 0.50, 0.14], [1.05, 0.62, 0.26], [0.70, 0.45, 0.30], [0.26, 0.32, 0.55],
                     [0.32, 0.40, 0.68], [0.60, 0.55, 0.62], [1.25, 0.95, 0.65], [1.7, 1.45, 1.1]], np.float32)
    return np.stack([np.interp(d, stops, cols[:, c]) for c in range(3)], -1).astype(np.float32)


def slice_disk(img, cx, cy, Rpx, t=0.0, mask_fn=None, alpha=1.0):
    """Cross-section of Jupiter centred at (cx, cy) with radius Rpx (may be far larger than the screen)."""
    xs, ys = grid()
    r = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    d = (1 - r / Rpx) * RJ_KM
    inside = d >= 0
    if not inside.any():
        return img
    col = slice_color(np.clip(d, 0, RJ_KM))
    # convective texture
    n = cached("jcells_slice", lambda: tile_fbm(1024, 140, 6, 77))
    kpp = RJ_KM / Rpx
    # one noise tile spans ~700 px on screen at any zoom (a fixed km cap made it repeat every ~70 px
    # when the whole planet was visible); a second, rotated, incommensurate layer hides the period
    tile = max(30.0, kpp * 700)
    dx, dy = (xs - cx) * kpp / tile, (ys - cy) * kpp / tile
    def samp(a, b):
        return cv2.remap(n, ((a * 1024) % 1024).astype(np.float32), ((b * 1024) % 1024).astype(np.float32),
                         cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    ca, sa = np.cos(0.61), np.sin(0.61)
    tx = 0.6 * samp(dx + t * 0.01, dy) + 0.4 * samp((dx * ca - dy * sa) * 1.618 + 0.37, (dx * sa + dy * ca) * 1.618 + 0.11)
    tx = (tx - 0.5) * 1.35 + 0.5
    col = col * (0.85 + 0.3 * tx[..., None])
    a = clamp((Rpx - r) * 1.0) * alpha
    if mask_fn is not None:
        a = a * mask_fn(xs, ys)
    return img * (1 - a[..., None]) + col * a[..., None]
