"""Episode 4 visuals, built for this episode only. One river, 3,050 km from the crater, seen at eye level and from
under the water; a slice through the planet for the paths; the evidence 66 million years later.

Conventions: view azimuth 0 = due south (toward the crater), positive = clockwise (west, to the right).
Every scene returns (HDR image, post kwargs)."""
import functools, os
import numpy as np, cv2
from engine.beats import scene_factory
from engine.core import W, H, clamp, smooth, span, lerp, grid, fbm, blur, fast_blur, glow_dot, splat_points
from engine import cards
from engine.hud import text, fade, prog
from ep_tanis import model as M

FONT_DIR = __import__("os").path.join(__import__("os").path.dirname(__import__("os").path.dirname(__file__)), "assets", "fonts")
cards.FONT_FILES.setdefault("iserif", FONT_DIR + "/InstrumentSerif-Italic.woff")
cards.FONT_FILES.setdefault("rserif", FONT_DIR + "/InstrumentSerif-Regular.woff")
cards.FONT_FILES.setdefault("jbm", "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Light.ttf")
cards.FONT_FILES.setdefault("jbm5", "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Medium.ttf")

# palette: fern green, river silt, ember, ash
FERN = np.array([0.30, 0.48, 0.30], np.float32)
SILT = np.array([0.46, 0.40, 0.28], np.float32)
EMBER = np.array([1.00, 0.42, 0.16], np.float32)
ASH = np.array([0.86, 0.84, 0.80], np.float32)
PEACH = (1.0, 0.72, 0.56)
INK = (0.93, 0.92, 0.88)
GLASS = (0.62, 0.95, 0.85)


def ease(u):
    return smooth(clamp(u))


def rng_at(seed):
    return np.random.default_rng(seed)


# ═══════════════════════════════════════════ the sky over the river ═══════════════════════════════════════════
def _cam_dirs(view_az, pitch, fov, w=W, h=H):
    """Per-pixel (azimuth, altitude) in degrees for a pinhole camera (horizontal fov)."""
    xs, ys = grid(w, h)
    f = (w / 2) / np.tan(np.radians(fov) / 2)
    x = (xs - w / 2) / f
    y = -(ys - h / 2) / f
    cp, sp = np.cos(np.radians(pitch)), np.sin(np.radians(pitch))
    # camera looks along +z (south at view_az=0), y up; pitch rotates about x
    dz = cp - y * sp
    dy = sp + y * cp
    dx = x
    az = np.degrees(np.arctan2(dx, dz)) + view_az
    alt = np.degrees(np.arctan2(dy, np.sqrt(dx * dx + dz * dz)))
    return az, alt, f


def alt_to_y(alt, pitch, f):
    return H / 2 - f * np.tan(np.radians(alt - pitch))


def az_to_x(az, view_az, f):
    return W / 2 + f * np.tan(np.radians(az - view_az))


def sky(az, alt, s):
    """Sky radiance. s: dict(glow, heat, dust, sun_alt, sun_az, dark)."""
    a = np.clip(alt, -2, 90)
    t = np.clip(a / 90.0, 0, 1) ** 0.45
    # spring dawn: pale gold at the horizon, clear blue overhead
    hor = np.array([1.00, 0.78, 0.55], np.float32) * 0.9
    zen = np.array([0.20, 0.38, 0.72], np.float32) * 0.75
    img = hor * (1 - t[..., None]) + zen * t[..., None]
    # sun (low in the east, i.e. azimuth -90 when facing south)
    sa, sz = s.get("sun_alt", 6.0), s.get("sun_az", -95.0)
    d = np.sqrt(((az - sz + 180) % 360 - 180) ** 2 * np.cos(np.radians(a)) ** 2 + (a - sa) ** 2)
    img = img + np.exp(-d / 18.0)[..., None] * np.array([1.0, 0.75, 0.45], np.float32) * 0.55
    img = img + (np.exp(-(d / 0.9) ** 2) * 30.0)[..., None] * np.array([1.0, 0.9, 0.75], np.float32) * s.get("sun_vis", 1.0)
    # the impact glow: a dome rising over the southern horizon
    g = s.get("glow", 0.0)
    if g > 0:
        daz = (az + 180) % 360 - 180
        top = 8.0 + 34.0 * g
        dome = np.exp(-(daz / (16 + 34 * g)) ** 2) * np.exp(-np.clip(a - 3.0, 0, None) / max(1.0, top * 0.6))
        col = np.array([1.0, 0.86, 0.66], np.float32) * (1 - 0.4 * g) + EMBER * 0.4 * g
        img = img + (dome * (1.5 + 3.5 * g))[..., None] * col * min(1.0, g * 3)
    h = s.get("heat", 0.0)
    if h > 0:
        img = img * (1 - 0.55 * h) + (EMBER * (0.55 + 0.45 * (1 - t[..., None])) * 1.3 * h)
    du = s.get("dust", 0.0)
    if du > 0:
        murk = np.array([0.36, 0.29, 0.22], np.float32) * (0.55 + 0.45 * (1 - t[..., None]))
        k = min(1.0, du * 1.7)
        img = img * (1 - k) + murk * k * (1 - 0.8 * s.get("dark", 0.0))
    return img.astype(np.float32)


# ─────────────────────────────── the forest panorama (built once, sampled by every riverbank shot) ───────────────
AZ0, AZ1, ALT0, ALT1, PPD = -95.0, 95.0, -3.0, 36.0, 24.0       # panorama extent (deg) and pixels per degree
PW, PH = int((AZ1 - AZ0) * PPD), int((ALT1 - ALT0) * PPD)


def _pano_xy(az, alt):
    return (az - AZ0) * PPD, (ALT1 - alt) * PPD


def _leafy(mask, seed, scale=3.0, k=0.16):
    n = fbm(mask.shape[1], mask.shape[0], scale=scale * 4, octaves=3, seed=seed)
    m = cv2.GaussianBlur(mask, (0, 0), scale)
    return clamp((m - 0.5 + k * (n - 0.5)) * 6 + 0.5)


def _tree_layer(seed, n, base_alt, h_lo, h_hi, conifer_frac, crowd=1.0, emergent=0.0):
    """One band of forest drawn into the panorama: alpha, and a rim-light map (edges facing the low eastern Sun)."""
    r = rng_at(seed)
    a = np.zeros((PH, PW), np.float32)
    for _ in range(n):
        az = r.uniform(AZ0, AZ1)
        h = r.uniform(h_lo, h_hi) * (r.uniform(1.4, 1.9) if r.random() < emergent else 1.0) * PPD
        x, yb = _pano_xy(az, base_alt + r.uniform(-0.1, 0.1))
        if r.random() < conifer_frac:                       # dawn-redwood-like spire: drooping branch tiers
            tiers = int(r.uniform(14, 24))
            cv2.line(a, (int(x), int(yb)), (int(x), int(yb - h)), 1.0, max(1, int(h * 0.012)), cv2.LINE_AA)
            for k in range(tiers):
                f = (k + r.uniform(0, 0.6)) / tiers
                wd = (1 - f) ** 0.85 * h * r.uniform(0.13, 0.19) + 1.5
                yy = yb - h * (0.18 + 0.82 * f)
                for sgn in (-1, 1):
                    tip = (x + sgn * wd, yy + wd * r.uniform(0.15, 0.4))
                    pts = np.array([[x, yy - h * 0.02], [tip[0], tip[1]], [x, yy + h * 0.025]], np.int32)
                    cv2.fillConvexPoly(a, pts, 1.0, cv2.LINE_AA)
        else:                                               # broadleaf: a fractal crown of many small lumps
            cw = h * r.uniform(0.4, 0.7)
            cy = yb - h * 0.6
            cv2.line(a, (int(x), int(yb)), (int(x + r.normal(0, cw * 0.08)), int(cy)), 1.0, max(1, int(h * 0.03)), cv2.LINE_AA)
            for _ in range(int(110 * crowd)):
                rad = np.sqrt(r.random())
                th_ = r.uniform(0, 2 * np.pi)
                ox, oy = np.cos(th_) * rad * cw * 0.5, np.sin(th_) * rad * h * 0.24
                rr = r.uniform(0.035, 0.085) * cw + 1
                cv2.circle(a, (int(x + ox), int(cy + oy)), int(rr), 1.0, -1, cv2.LINE_AA)
    a = _leafy(a, seed + 1, scale=0.9, k=0.9)
    sh = np.roll(np.roll(a, 3, 0), 3, 1)                   # light comes from the upper left (east, low Sun)
    rim = clamp(a - sh) * a
    rim = cv2.GaussianBlur(rim, (0, 0), 1.2)
    return a, rim


@functools.lru_cache(1)
def _forest():
    from engine.core import cached
    def build():
        hills_a = np.zeros((PH, PW), np.float32)
        prof = fbm(PW, 1, scale=900, octaves=5, seed=31)[0] * 1.6 + 0.5      # distant low hills, deg
        yy = np.arange(PH)[:, None]
        hills_a[:] = (yy > (ALT1 - (prof[None, :] - 0.9)) * PPD).astype(np.float32)
        hills_a = cv2.GaussianBlur(hills_a, (0, 0), 1.2)
        mid_a, mid_l = _tree_layer(41, 2600, -0.6, 0.8, 2.2, 0.35, 0.6, 0.15)    # forest beyond the far bank
        far_a, far_l = _tree_layer(51, 900, -0.9, 3.2, 7.5, 0.4, 1.0, 0.18)      # the far bank, ~200 m away
        far_a[int((ALT1 + 0.75) * PPD):] = 1.0                                   # solid bank below the trees
        shrub_a, shrub_l = _tree_layer(61, 1500, -0.95, 0.4, 1.3, 0.0, 0.5)      # bushes at the water's edge
        return np.stack([hills_a, mid_a, mid_l, far_a, far_l, shrub_a, shrub_l]).astype(np.float16)
    return cached("tanis_forest_v5", build).astype(np.float32)


def _sample(layer, az, alt):
    x, y = _pano_xy(az, alt)
    return cv2.remap(layer, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


@functools.lru_cache(1)
def _cloud_tex():
    return (0.6 * fbm(2048, 2048, scale=260, octaves=6, seed=71) + 0.4 * fbm(2048, 2048, scale=70, octaves=5, seed=72)).astype(np.float32)


def clouds(az, alt, t, s):
    """A broken cloud deck in perspective (a plane overhead), lit by the low Sun / the impact glow / the burning sky."""
    up = alt > 0.3
    k = 1.0 / np.tan(np.radians(np.clip(alt, 0.3, 89)))
    X = k * np.sin(np.radians(az)) * 180 + 1024 + t * 1.5
    Y = k * np.cos(np.radians(az)) * 180 + 1024
    tex = cv2.remap(_cloud_tex(), (X % 2048).astype(np.float32), (Y % 2048).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    cov = s.get("cover", 0.55)
    dens = clamp((tex - (1 - cov)) * 3.2) * up * clamp((alt - 0.3) / 4.0)
    fade_far = clamp(1 - k / 40)                            # thin out toward the horizon
    dens = dens * fade_far
    sa, sz = s.get("sun_alt", 6.0), s.get("sun_az", -95.0)
    near_sun = np.exp(-(((az - sz + 180) % 360 - 180) / 50) ** 2)
    base = np.array([0.42, 0.40, 0.46], np.float32)
    gold = np.array([1.25, 0.70, 0.42], np.float32)
    col = base[None, None] * (0.55 + 0.45 * (1 - dens[..., None])) + gold * (near_sun * 0.9)[..., None] * (1 - dens[..., None] * 0.5)
    g = s.get("glow", 0.0)
    if g > 0:
        south = np.exp(-(((az + 180) % 360 - 180) / 40) ** 2) * np.exp(-alt / 25)
        col = col + (south * g * 1.6)[..., None] * np.array([1.0, 0.75, 0.5], np.float32)
    h = s.get("heat", 0.0)
    col = col * (1 - 0.4 * h) + EMBER * 1.4 * h
    du = s.get("dust", 0.0)
    col = col * (1 - 0.7 * du)
    dens = dens * (1 - min(1.0, du * 1.5))
    return dens, col


def streaks(img, t, density, view_az, pitch, f, radiant_alt=43.5, seed=21):
    """Re-entry streaks of the falling glass. Each one has a bright head, a fading train, a life of 0.3–1.2 s, and
    moves away from the radiant (south, 43.5° up: where 45° launches come back in from)."""
    if density <= 0:
        return img
    hw, hh = W // 2, H // 2
    buf = np.zeros((hh, hw, 3), np.float32)
    rx, ry = az_to_x(0.0, view_az, f) / 2, alt_to_y(radiant_alt, pitch, f) / 2
    r = rng_at(seed)
    n = int(1400 * density)
    life = r.uniform(0.3, 1.2, n)
    period = 3.0
    age = (t - r.uniform(0, period, n)) % period
    live = age < life
    ang = r.uniform(0, 2 * np.pi, n)
    d0 = r.uniform(20, 700, n) ** 1.05
    spd = r.uniform(250, 900, n) * (0.5 + d0 / 700)
    br = r.uniform(0.2, 1.0, n) ** 2.2
    for i in np.where(live)[0]:
        a = age[i] / life[i]
        dd = d0[i] + spd[i] * age[i]
        hx, hy = rx + np.cos(ang[i]) * dd, ry + np.sin(ang[i]) * dd * 0.8
        ln = min(dd - d0[i] + 8, 40 + spd[i] * 0.25)
        tx, ty = hx - np.cos(ang[i]) * ln, hy - np.sin(ang[i]) * ln * 0.8
        b = br[i] * np.sin(np.pi * a) ** 0.5 * 1.8
        c = (b, b * 0.82, b * 0.55)
        steps = 6
        for k in range(steps):                               # the train fades toward its tail
            f0, f1 = k / steps, (k + 1) / steps
            p1 = (int(tx + (hx - tx) * f0), int(ty + (hy - ty) * f0))
            p2 = (int(tx + (hx - tx) * f1), int(ty + (hy - ty) * f1))
            w = f1 ** 2
            cv2.line(buf, p1, p2, (c[0] * w, c[1] * w, c[2] * w), 1, cv2.LINE_AA)
        cv2.circle(buf, (int(hx), int(hy)), 1, (b * 2.5, b * 2.2, b * 1.8), -1, cv2.LINE_AA)
    big = cv2.resize(buf, (W, H), interpolation=cv2.INTER_LINEAR)
    return img + big * 1.6 + fast_blur(big, 5) * 1.5 + fast_blur(big, 30) * 0.6


@functools.lru_cache(1)
def _mist_tex():
    n = fbm(W, H // 4, scale=160, octaves=5, seed=5)
    n = cv2.blur(n, (91, 3))
    return cv2.resize(n, (W, H))


@functools.lru_cache(2)
def _reeds(seed=11, n=34):
    r = rng_at(seed)
    side = r.random(n) < 0.55
    x = np.where(side, r.uniform(-80, 330, n), r.uniform(W - 300, W + 80, n))
    hgt = r.uniform(160, 560, n)
    lean = r.uniform(-0.18, 0.18, n)
    wd = r.uniform(4, 9, n)
    ph = r.uniform(0, 6.28, n)
    return x, hgt, lean, wd, ph


def foreground(t, sway, ink):
    """Horsetails (Equisetum, common in Hell Creek wetlands) at the near bank, tapered and jointed, swaying."""
    rx, rh, rl, rw, rp = _reeds()
    lay = np.zeros((H, W), np.float32)
    for i in range(len(rx)):
        segs = 14
        pts = []
        for k in range(segs + 1):
            f = k / segs
            bend = (rl[i] + sway * np.sin(t * 1.1 + rp[i] + f)) * f * f
            pts.append((rx[i] + bend * rh[i], H + 6 - rh[i] * f))
        for k in range(segs):
            th = max(1, int(rw[i] * (1 - k / segs) ** 0.7))
            cv2.line(lay, (int(pts[k][0]), int(pts[k][1])), (int(pts[k + 1][0]), int(pts[k + 1][1])), 1.0, th, cv2.LINE_AA)
            if k % 2 == 1 and k < segs - 2:                  # whorls of thin branches at the joints
                for s_ in (-1, 1):
                    L = rw[i] * 3.0 * (1 - k / segs)
                    cv2.line(lay, (int(pts[k][0]), int(pts[k][1])), (int(pts[k][0] + s_ * L), int(pts[k][1] - L * 0.6)), 1.0, 1, cv2.LINE_AA)
    lay = blur(lay, 1.0)
    return lay


@scene_factory(keys=["phase"])
def riverbank(phase="dawn", view_az=(0.0, 3.0), pitch=(5.0, 5.0), fov=(62.0, 60.0), glow=(0.0, 0.0), streak=(0.0, 0.0),
              heat=(0.0, 0.0), dust=(0.0, 0.0), dark=(0.0, 0.0), shake=(0.0, 0.0), slosh=(0.0, 0.0), level=(0.0, 0.0),
              beads=(0.0, 0.0), mist=(0.7, 0.6), sun_vis=1.0, cover=0.5, buried=(0.0, 0.0), sun_alt=(5.0, 6.0)):
    """Eye level on the riverbank, looking across the channel at the far bank. The sky does the storytelling."""
    def f(ctx, t, u, fi):
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        va, pt, fv = L(view_az), L(pitch), L(fov)
        sh = L(shake)
        if sh > 0:                                          # quake: the camera is thrown about (low-freq + jitter)
            va += sh * (0.6 * np.sin(t * 9.1) + 0.4 * np.sin(t * 23.7 + 1)) * 0.22
            pt += sh * (0.6 * np.sin(t * 11.3 + 2) + 0.4 * np.sin(t * 19.1)) * 0.22
        az, alt, fpx = _cam_dirs(va, pt, fv)
        s = dict(glow=L(glow), heat=L(heat), dust=L(dust), dark=L(dark), sun_vis=sun_vis, cover=cover, sun_alt=L(sun_alt))
        lv = L(level) + L(slosh) * 1.1 * np.sin(t * 0.8)      # water level (deg of view): the seiche
        img = sky(az, alt, s)
        dens, ccol = clouds(az, alt, t, s)
        img = img * (1 - dens[..., None]) + ccol * dens[..., None]
        img = streaks(img, t, L(streak), va, pt, fpx)
        img = _land(img, az, alt, t, s, lv)
        # water below the waterline: reflections stretched by ripples, Fresnel, silt
        xs, ys = grid()
        wl = -0.95 + lv                                       # waterline altitude (deg)
        below = alt < wl
        if below.any():
            mirror_alt = 2 * wl - alt
            rip = (cv2.resize(fbm(W, 128, scale=24, octaves=3, seed=9), (W, H)) - 0.5)
            sl = L(slosh) + 0.3 * L(beads)
            ralt = mirror_alt + rip * (0.25 + 1.2 * sl) + np.sin(ys * 0.11 + t * 1.7) * 0.06 * (1 + 4 * sl)
            raz = az + rip * (0.3 + 0.8 * sl)
            hz, ha = np.ascontiguousarray(raz[::2, ::2]), np.ascontiguousarray(ralt[::2, ::2])   # half resolution: it is smeared anyway
            rimg = sky(hz, ha, s)
            d2, c2 = clouds(hz, ha, t, s)
            rimg = rimg * (1 - d2[..., None]) + c2 * d2[..., None]
            rimg = _land(rimg, hz, ha, t, s, lv)
            rimg = cv2.resize(cv2.blur(rimg, (1, 5)), (W, H), interpolation=cv2.INTER_LINEAR)
            depth = clamp((wl - alt) / 12.0)
            fres = 0.75 - 0.5 * depth                          # grazing angles reflect more
            body = SILT * 0.06 * (1 + 2.0 * s["heat"]) * (1 - 0.7 * s["dust"])
            water = rimg * fres[..., None] + body * (1 - fres[..., None])
            # glitter path under the Sun
            sz = s.get("sun_az", -95.0)
            near = np.exp(-(((az - sz + 180) % 360 - 180) / 4.0) ** 2) * (1 - s["dust"]) * sun_vis
            if near.max() > 0.01:
                r = rng_at(int(t * 30))
                sp = (r.random((H, W)) > 0.9992) * near * 3.0
                water = water + sp[..., None] * np.array([1.0, 0.85, 0.6], np.float32)
            img = np.where(below[..., None], water, img)
            bd = L(beads)
            if bd > 0:                                         # glass beads ticking into the water
                r = rng_at(1000 + int(t * 24))
                nb = int(1200 * bd)
                bx = r.uniform(0, W, nb)
                by_alt = wl - r.uniform(0.2, 1.0, nb) ** 0.5 * 30
                by = alt_to_y(by_alt, pt, fpx)
                m = (by > 0) & (by < H)
                img = splat_points(img, bx[m], by[m], np.tile(np.array([[1.0, 1.0, 1.0]], np.float32), (m.sum(), 1)), sigma=0.7)
        # mist wisps over the water at dawn
        ms = L(mist)
        if ms > 0:
            n = _mist_tex()
            n = np.roll(n, int(t * 14), 1)
            band = np.exp(-((alt - (wl + 0.7)) / 1.6) ** 2) * ms * (0.45 + 0.55 * n) * 0.8
            img = img + band[..., None] * (img.mean((0, 1)) * 0.8 + 0.05)
        # near bank horsetails
        lay = foreground(t, 0.03 + 0.25 * sh / 6.0, None)
        amb = img.mean((0, 1))
        img = img * (1 - lay[..., None]) + lay[..., None] * (amb * 0.04 + 0.004)
        bu = L(buried)
        if bu > 0:
            mud_y = H - bu * H * 1.15 + 18 * np.sin(xs * 0.01 + t * 2)
            m = clamp((ys - mud_y) / 40)
            img = img * (1 - m[..., None]) + (np.array([0.09, 0.07, 0.045], np.float32) * (0.6 + 0.4 * cv2.resize(fbm(480, 270, 30, 4, 3), (W, H))[..., None])) * m[..., None]
        if sh > 1.0:                                      # shaking shows as motion blur
            k_ = int(1 + sh * 3)
            img = cv2.blur(img, (k_, max(1, k_ // 2)))
        exp = 1.15 * (1 - 0.65 * s["dark"])
        return img, dict(exposure=exp, bloom=0.45 + 0.35 * s["heat"] + 0.3 * s["glow"], grain=0.006)
    return f


def _land(img, az, alt, t, s, lv):
    """Composite hills, forest and shrubs over img, lit by the sky (ambient) and the low Sun from the east."""
    P = _forest()
    skyamb = sky(np.array([[0.0, 90.0, -90.0, 180.0]]), np.array([[10.0, 10.0, 10.0, 60.0]]), s).mean((0, 1))
    sunc = np.array([1.0, 0.72, 0.45], np.float32) * (1 - s["dust"]) * (1 - 0.5 * s["heat"]) * s.get("sun_vis", 1.0)
    glowc = np.array([1.0, 0.8, 0.6], np.float32) * s["glow"] * 0.5 + EMBER * s["heat"] * 0.6
    sh = lv * 0.15
    layers = [(0, None, 0.30, np.array([0.30, 0.36, 0.44], np.float32)),     # hills: hazy blue
              (1, 2, 0.12, np.array([0.08, 0.13, 0.08], np.float32)),        # mid forest
              (3, 4, 0.05, np.array([0.035, 0.06, 0.035], np.float32)),      # far bank
              (5, None, 0.06, np.array([0.04, 0.07, 0.035], np.float32))]     # shrubs (no rim light)
    for ai, li, haze, col in layers:
        a = _sample(P[ai], az, alt - sh)
        if a.max() <= 0.001:
            continue
        lit = _sample(P[li], az, alt - sh) if li is not None else 0.0
        c = col[None, None] * (0.5 + 0.6 * skyamb) + (np.asarray(lit)[..., None] if li is not None else 0) * (sunc * 0.35 + glowc * 0.5)
        hz = min(0.85, haze + s['dust'] * 0.5 * (1 if ai < 3 else 0.4))
        c = c * (1 - hz) + skyamb * hz * 0.9
        img = img * (1 - a[..., None]) + c * a[..., None]
    return img


# ═══════════════════════════════════ the whole sky as a dome (for looking up) ═══════════════════════════════════
DOME = 900


def sky_dome(t, s, streak_d=0.0, land=True):
    """Zenith-centred fisheye of the whole sky (equidistant: radius ∝ zenith angle, 90° at the edge). North is up."""
    xs, ys = grid(DOME, DOME)
    dx, dy = (xs - DOME / 2) / (DOME / 2), (ys - DOME / 2) / (DOME / 2)
    r = np.sqrt(dx * dx + dy * dy)
    zen = np.clip(r, 0, 1.2) * 90.0
    alt = 90.0 - zen
    az = np.degrees(np.arctan2(dx, dy))                     # 0 = south at the bottom of the map
    img = sky(az, alt, s)
    d, c = clouds(az, alt, t, s)
    img = img * (1 - d[..., None]) + c * d[..., None]
    if land:
        img = _land(img, az, alt, t, s, 0.0)
        img = np.where((alt < -0.9)[..., None], np.array([0.02, 0.03, 0.02], np.float32), img)
    if streak_d > 0:
        rr = rng_at(77)
        n = int(1100 * streak_d)
        life = rr.uniform(0.3, 1.1, n)
        age = (t - rr.uniform(0, 3.0, n)) % 3.0
        live = age < life
        # radiant: south, 43.5° up -> (0, +46.5° of zenith distance) toward the bottom of the map
        rx, ry = DOME / 2, DOME / 2 + 46.5 / 90 * DOME / 2
        ang = rr.uniform(0, 2 * np.pi, n)
        d0 = rr.uniform(10, 420, n)
        spd = rr.uniform(120, 420, n)
        br = rr.uniform(0.2, 1.0, n) ** 2.2
        buf = np.zeros_like(img)
        for i in np.where(live)[0]:
            a = age[i] / life[i]
            dd = d0[i] + spd[i] * age[i]
            hx, hy = rx + np.cos(ang[i]) * dd, ry + np.sin(ang[i]) * dd
            ln = min(dd - d0[i] + 5, 25 + spd[i] * 0.2)
            tx, ty = hx - np.cos(ang[i]) * ln, hy - np.sin(ang[i]) * ln
            b = br[i] * np.sin(np.pi * a) ** 0.5 * 2.0
            cv2.line(buf, (int(tx), int(ty)), (int(hx), int(hy)), (b * 0.6, b * 0.5, b * 0.33), 1, cv2.LINE_AA)
            cv2.circle(buf, (int(hx), int(hy)), 1, (b * 2.4, b * 2.1, b * 1.7), -1, cv2.LINE_AA)
        img = img + buf * 1.5 + blur(buf, 3) * 1.6
    return img


def _dome_lookup(dome, az, alt):
    zen = np.clip(90.0 - alt, 0, 100)
    rr = zen / 90.0 * DOME / 2
    x = DOME / 2 + rr * np.sin(np.radians(az))
    y = DOME / 2 + rr * np.cos(np.radians(az))
    return cv2.remap(dome, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def _fish_mask(cx, cy, L, ang, gape=0.0, kind="paddle", w=W, h=H, bend=0.0):
    """Backlit silhouette of a paddlefish (long spoon-shaped snout, gaping mouth) or a sturgeon, length L px, seen
    from below, with a gentle swimming bend. Smooth outline from a width profile along the body."""
    m = np.zeros((h, w), np.float32)
    xs = np.linspace(-0.5, 0.5, 80)                      # tail -> head
    if kind == "paddle":
        def wid(x):
            body = 0.085 * np.clip(1 - ((x + 0.06) / 0.44) ** 2, 0, 1) ** 0.5 * (1 + 0.2 * gape * np.exp(-((x - 0.1) / 0.05) ** 2))
            neck = np.clip((0.2 - x) / 0.05, 0, 1)
            body = body * neck
            sx = np.clip((x - 0.16) / 0.34, 0, 1)
            snout = (x > 0.14) * (x < 0.5) * (0.014 + 0.05 * sx ** 1.4) * np.sqrt(np.clip((0.5 - x) / 0.03, 0, 1))
            return np.maximum(body, snout)
    else:
        def wid(x):
            return 0.07 * np.clip(1 - ((x + 0.08) / 0.5) ** 2, 0, 1) ** 0.6 * np.clip((0.5 - x) / 0.25, 0.05, 1) ** 0.9
    wv = wid(xs)
    yc = bend * np.sin((xs + 0.5) * 3.0) * (0.5 - xs) * 0.12   # body wave, stronger toward the tail
    top = np.stack([xs, yc + wv], -1)
    bot = np.stack([xs[::-1], (yc - wv)[::-1]], -1)
    outline = np.concatenate([top, bot]) * L
    ca, sa = np.cos(ang), np.sin(ang)
    pts = np.stack([cx + outline[:, 0] * ca - outline[:, 1] * sa, cy + outline[:, 0] * sa + outline[:, 1] * ca], -1)
    cv2.fillPoly(m, [pts.astype(np.int32)], 1.0, cv2.LINE_AA)
    P = lambda x, y: (int(cx + x * L * ca - y * L * sa), int(cy + x * L * sa + y * L * ca))
    tail = [(-0.44, yc[0] + 0.02), (-0.64, 0.15 + yc[0]), (-0.58, 0.02 + yc[0]), (-0.56, yc[0] - 0.01), (-0.62, -0.09 + yc[0]), (-0.44, yc[0] - 0.02)]
    cv2.fillPoly(m, [np.array([P(x, y) for x, y in tail], np.int32)], 1.0, cv2.LINE_AA)
    yf = bend * np.sin(0.6 * 3.0) * 0.4 * 0.12
    for sgn, fx, sz in ((1, 0.06, 1.0), (-1, 0.06, 1.0), (1, -0.18, 0.6), (-1, -0.18, 0.6)):   # pectoral + pelvic fins
        c = P(fx - 0.03, sgn * (0.085 + 0.03 * sz) + yf)
        cv2.ellipse(m, c, (int(L * 0.05 * sz), int(L * 0.018 * sz)), np.degrees(ang) + sgn * 35 + 180, 0, 360, 1.0, -1, cv2.LINE_AA)
    return blur(m, 1.3)


def _fisheye_dirs(look, yaw, half_v=62.0):
    """Equidistant fisheye pointing `look` degrees above the horizon: per-pixel (azimuth, altitude) in degrees."""
    xs, ys = grid()
    fe = (H / 2) / np.radians(half_v)
    dx, dy = (xs - W / 2) / fe, -(ys - H / 2) / fe
    rho = np.sqrt(dx * dx + dy * dy)
    phi = np.arctan2(dy, dx)
    # direction in camera frame (z forward)
    cz, sr = np.cos(rho), np.sin(rho)
    vx, vy, vz = sr * np.cos(phi), sr * np.sin(phi), cz
    lp = np.radians(look)
    wy = vy * np.cos(lp) + vz * np.sin(lp)
    wz = -vy * np.sin(lp) + vz * np.cos(lp)
    alt = np.degrees(np.arcsin(np.clip(wy, -1, 1)))
    az = np.degrees(np.arctan2(vx, wz)) + yaw
    return az, alt, rho


@scene_factory(keys=[])
def river_under(look=(46.0, 52.0), yaw=(180.0, 188.0), beads=(0.0, 0.0), streak=(0.0, 0.0), glow=(0.0, 0.0),
                heat=(0.0, 0.0), dust=(0.0, 0.0), fish=(1.0, 1.0), murk=(0.0, 0.0), gape=1.0, flash=(0.0, 0.0), school=0):
    """Under the river, looking up through a wide lens. The whole sky is squeezed into Snell's window (a circle 97°
    across); beyond its rim the surface mirrors the dark water. Paddlefish glide across the light, mouths open;
    glass beads sink past."""
    def f(ctx, t, u, fi):
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        s = dict(glow=L(glow), heat=L(heat), dust=L(dust), dark=0.0, cover=0.45, sun_alt=6.0)
        dome = sky_dome(t, s, L(streak))
        az, alt, rho = _fisheye_dirs(L(look), L(yaw), half_v=36.0)
        th_w = 90.0 - alt
        n1 = cv2.resize(fbm(240, 135, scale=22, octaves=3, seed=int(t * 3) % 50), (W, H))
        n2 = cv2.resize(fbm(240, 135, scale=22, octaves=3, seed=int(t * 3 + 1) % 50), (W, H))
        k = (t * 3) % 1
        wob = (n1 * (1 - k) + n2 * k - 0.5) * 1.6
        th = th_w + wob
        crit = np.degrees(np.arcsin(1 / 1.333))
        inside = clamp((crit - th) / 0.8)
        th_a = np.degrees(np.arcsin(np.clip(1.333 * np.sin(np.radians(np.clip(th, 0, crit))), 0, 1)))
        air = _dome_lookup(dome, az + wob, 90.0 - th_a)
        rim = np.exp(-((crit - th) / 3.0) ** 2) * 0.6                     # bright compressed horizon at the rim
        mur = L(murk)
        wc = np.array([0.020, 0.050, 0.040], np.float32) * (1 + 1.5 * L(heat)) * (1 - 0.6 * L(dust))
        att = np.exp(-(0.5 + 2.2 * mur) * (1 + 0.4 * rho))[..., None]
        cn = cv2.resize(fbm(480, 270, scale=26, octaves=3, seed=int(t * 2) % 40), (W, H))
        cn2 = cv2.resize(fbm(480, 270, scale=26, octaves=3, seed=int(t * 2 + 1) % 40), (W, H))
        kk = (t * 2) % 1
        cau = (1 - np.abs(2 * (cn * (1 - kk) + cn2 * kk) - 1)) ** 4 * 0.35     # soft caustic shimmer from surface ripples
        win = air * (0.55 + 0.35 * rim[..., None] + 0.12 * cau[..., None]) * att
        xs, ys = grid()
        vol = wc * (1.6 * np.exp(-rho * 1.2))[..., None] + wc * 0.4             # brighter water near the light
        under = vol * (1 + 0.6 * cau * np.exp(-rho * 2))[..., None]             # the surface underside, mirroring the river
        img = win * inside[..., None] + under * (1 - inside[..., None])
        img = img + fast_blur(win * inside[..., None], 60) * 0.55 * (1 - 0.5 * mur)     # light scattered by the water
        if mur > 0:                                                                     # silt-choked water
            mc = np.array([0.30, 0.23, 0.13], np.float32) * (0.35 + 1.2 * np.exp(-rho * 1.2))[..., None] * (1 - 0.5 * L(dust))
            img = img * (1 - 0.85 * mur) + mc * 0.85 * mur
        # light shafts spreading down from the window
        xs, ys = grid()
        wx, wy = np.mean(np.where(inside > 0.5)[1]) if (inside > 0.5).any() else W / 2, np.mean(np.where(inside > 0.5)[0]) if (inside > 0.5).any() else 0
        th_r = np.arctan2(ys - wy, xs - wx)
        rays = cv2.resize(fbm(720, 1, scale=9, octaves=3, seed=4), (720, 1))[0]
        idx = (((th_r + np.pi) / (2 * np.pi) * 720 + t * 6) % 720).astype(np.int32)
        flick = 0.6 + 0.4 * np.sin(t * 0.7 + rays * 20)
        shaft = rays[idx] ** 6 * (1 - inside) * np.exp(-np.hypot(xs - wx, ys - wy) / 700) * (1 - mur) * flick[idx]
        img = img + shaft[..., None] * (air.mean((0, 1)) * 0.22 + 0.005)
        # fish crossing the light (shot-continuous time, so nothing resets at a beat boundary)
        t = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        if L(fish) > 0:
            crew = [(-600, 330, 900, 120, "paddle"), (2500, 170, 520, -80, "paddle"), (-1400, 560, 1100, 85, "sturgeon")]
            if school:
                crew += [(-200 - 300 * k_, 200 + 140 * k_, 380, 70 + 10 * k_, "paddle") for k_ in range(int(round(school)))]
            for j, (x0, y0, LL, sp, kind) in enumerate(crew):
                cx = x0 + sp * t + 30 * np.sin(t * 0.7 + j)
                cy = y0 + 20 * np.sin(t * 0.5 + j * 2)
                ang = (0.0 if sp > 0 else np.pi) + 0.04 * np.sin(t * 0.9 + j)
                m = _fish_mask(cx, cy, LL, ang, gape=gape * (0.7 + 0.3 * np.sin(t * 2 + j)), kind=kind, bend=np.sin(t * 3.0 + j))
                img = img * (1 - m[..., None] * 0.95 * L(fish)) + m[..., None] * wc * 0.5
        r = rng_at(5)
        nm = 260                                                          # out-of-focus silt drifting in the water
        mx = (r.uniform(0, W, nm) + 8 * np.sin(t * 0.3 + r.uniform(0, 6, nm))) % W
        my = (r.uniform(0, H, nm) + t * r.uniform(-3, 6, nm)) % H
        mote = np.zeros_like(img)
        mote = splat_points(mote, mx, my, np.tile(np.array([[0.4, 0.6, 0.45]], np.float32), (nm, 1)) * r.uniform(0.3, 1, (nm, 1)), sigma=0.0)
        img = img + fast_blur(mote, 3.5) * 1.5
        bd = L(beads)
        if bd > 0:
            nb = int(1500 * bd)
            bx = r.uniform(0, W, nb)
            spd = r.uniform(60, 150, nb)
            by = H - ((r.uniform(0, H + 60, nb) + t * spd) % (H + 60) - 30)
            tw = 0.5 + 0.5 * np.sin(t * r.uniform(4, 11, nb) + r.uniform(0, 6, nb))
            val = np.array([[0.75, 1.0, 0.92]], np.float32) * (0.2 + 1.3 * tw[:, None] ** 4)
            img = splat_points(img, bx, by, val.astype(np.float32), sigma=0.9)
        fl = L(flash)
        if fl > 0:
            img = img * (1 + fl * 2)
        return img, dict(exposure=1.3, bloom=0.7, grain=0.02)
    return f


@scene_factory(keys=[])
def sky_up(spin=(0.0, 10.0), zoom=(1.0, 1.08), streak=(0.0, 0.0), glow=(0.0, 0.0), heat=(0.0, 0.0), dust=(0.0, 0.0),
           dark=(0.0, 0.0), canopy=1.0):
    """Lying on the riverbank looking straight up: a ring of treetops framing the sky."""
    def f(ctx, t, u, fi):
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        s = dict(glow=L(glow), heat=L(heat), dust=L(dust), dark=L(dark), cover=0.45, sun_alt=6.0)
        dome = sky_dome(t, s, L(streak), land=False)
        # rectilinear view up (fov ~110°): map screen to zenith angle
        xs, ys = grid()
        z = L(zoom)
        f_ = (W / 2) / np.tan(np.radians(55)) * z
        dx, dy = (xs - W / 2) / f_, (ys - H / 2) / f_
        r = np.sqrt(dx * dx + dy * dy)
        zen = np.degrees(np.arctan(r))
        az = np.degrees(np.arctan2(dx, dy)) + L(spin)
        img = _dome_lookup(dome, az, 90 - zen)
        if canopy > 0:                                                    # the treetops leaning in around the edge
            P = _forest()
            # treat the far-bank layer as a ring: azimuth -> angle around the ring, altitude -> zenith distance
            ring_alt = 90 - zen
            a = _sample(P[3], ((az + 360) % 190) - 95, (ring_alt - 40) * 0.6 + 4)
            a = np.maximum(a, clamp((zen - 52) / 6))
            amb = img.mean((0, 1))
            img = img * (1 - a[..., None]) + a[..., None] * (amb * 0.05 + 0.006)
        return img, dict(exposure=1.15 * (1 - 0.6 * L(dark)), bloom=0.6, grain=0.016)
    return f


# ═══════════════════════════════════ typography for this episode ═══════════════════════════════════
def put_text(img, s, x, y, size, color, alpha=1.0, anchor="lc", kind="iserif", tracking=0.0, shadow=0.6):
    if alpha <= 0.003 or not s or os.environ.get("QA_NOTEXT"):        # mute test: every word of on-screen text removed
        return img
    if alpha > 0.3:
        cards.mark(s, x, y)
    spr = cards.sprite(s, kind, int(size), tracking)
    if shadow > 0:
        sh = cv2.GaussianBlur(np.pad(spr, 30), (0, 0), max(2, size * 0.08))[30:-30, 30:-30]
        cards.put(img, sh, x + 2, y + 4, (0, 0, 0), shadow * alpha, anchor)
    cards.put(img, spr, x, y, color, alpha, anchor)
    return img


def serif(s, at, x=W / 2, y=H * 0.80, size=74, color=INK, until=None, anchor="c"):
    """A spoken-weight line of italic serif, used for the few sentences that should stay on screen."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, until if until else ctx.dur, 0.35)
        dy = 10 * (1 - smooth(clamp((t - tt) / 0.6)))
        return put_text(img, s, x, y + dy, size, color, a, anchor)
    return f


def tag(s, at, x=140, y=130, color=INK, size=22, sub=None):
    """Specimen-tag label: small mono capitals with a hairline, for places and things."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, ctx.dur, 0.3)
        if a <= 0 or os.environ.get("QA_NOTEXT"):
            return img
        img = put_text(img, s.upper(), x, y, size, color, a, "lc", kind="jbm5", tracking=0.18, shadow=0.5)
        wdt = cards.sprite(s.upper(), "jbm5", size, 0.18).shape[1]
        p = prog(t, tt, 0.6)
        img[int(y + size * 0.9):int(y + size * 0.9) + 1, int(x):int(x + wdt * p)] = img[int(y + size * 0.9):int(y + size * 0.9) + 1, int(x):int(x + wdt * p)] * (1 - a) + np.array(color, np.float32) * a
        if sub:
            img = put_text(img, sub, x, y + size * 1.9, size * 1.25, color, a * 0.85, "lc", kind="iserif", shadow=0.5)
        return img
    return f


ARRIVALS = [(0.0, "IMPACT", "Chicxulub, 3,050 km south"), (1.5, "FIREBALL", "clears the horizon"),
            (5.79, "P WAVE", "the first jolt"), (10.52, "S WAVE", "the ground lurches"),
            (13.03, "SURFACE WAVES", "the river starts to slosh"), (12.3, "GLASS", "shooting stars overhead"),
            (38.0, "SHOCKED QUARTZ", "a second, finer fallout"), (54.0, "GLASS", "on the water"),
            (151.7, "SOUND", "the impact is heard")]


def _fmt(m):
    m = max(0.0, m)
    hh, mm, ss = int(m // 60), int(m % 60), int((m * 60) % 60)
    return f"T + {hh}:{mm:02d}:{ss:02d}"


def _dial(img, m, cx, cy, R, a):
    """The count as a picture: a stopwatch whose hand sweeps once a minute and whose outer arc fills toward the
    sound's arrival at 2 h 32 min (readable with the sound off and the captions covered)."""
    lay = np.zeros(img.shape[:2], np.float32)
    cv2.circle(lay, (int(cx), int(cy)), int(R), 0.35, max(1, int(R * 0.06)), cv2.LINE_AA)
    frac = min(1.0, m / 151.7)
    if frac > 0:
        cv2.ellipse(lay, (int(cx), int(cy)), (int(R * 1.18), int(R * 1.18)), -90, 0, 360 * frac, 1.0, max(2, int(R * 0.09)), cv2.LINE_AA)
    ang = (m * 60.0 % 60.0) / 60.0 * 2 * np.pi
    cv2.line(lay, (int(cx), int(cy)), (int(cx + R * 0.85 * np.sin(ang)), int(cy - R * 0.85 * np.cos(ang))), 1.0, max(2, int(R * 0.07)), cv2.LINE_AA)
    cv2.circle(lay, (int(cx), int(cy)), max(2, int(R * 0.08)), 1.0, -1, cv2.LINE_AA)
    cv2.rectangle(lay, (int(cx - R * 0.12), int(cy - R * 1.42)), (int(cx + R * 0.12), int(cy - R * 1.25)), 1.0, -1, cv2.LINE_AA)
    return img * (1 - 0.5 * lay[..., None] * a) + lay[..., None] * np.array([0.95, 0.93, 0.88], np.float32) * a


def clock(span_min, ledger=False, x=W - 120, y=H - 92, show_from=0.0, big=False):
    """The vigil's clock: minutes after impact, interpolated across the beat. With ledger=True the arrivals so far
    are listed above it, newest at the bottom."""
    def f(ctx, img, t, u):
        a = clamp((t - show_from) / 0.4)
        if a <= 0:
            return img
        m = lerp(span_min[0], span_min[1], clamp(t / max(ctx.dur, 1e-3)))
        img = _dial(img, m, W / 2, H * 0.5, 150, a) if big else _dial(img, m, x - 250, y + 6, 26, 0.9 * a)
        img = put_text(img, _fmt(m), x, y, 34, INK, 0.92 * a, "rc", kind="jbm", tracking=0.06, shadow=0.7)
        img = put_text(img, "AFTER IMPACT", x, y + 34, 15, (0.75, 0.74, 0.70), 0.8 * a, "rc", kind="jbm5", tracking=0.3, shadow=0.6)
        if ledger:
            got = sorted([r for r in ARRIVALS if r[0] <= m + 1e-6], key=lambda r: r[0])[-5:]
            for k, (mm, name, what) in enumerate(reversed(got)):
                yy = y - 70 - k * 54
                al = a * (1.0 if k == 0 else 0.55)
                img = put_text(img, f"{_fmt(mm)[4:]}  {name}", x, yy, 19, PEACH if k == 0 else INK, al, "rc", kind="jbm5", tracking=0.12, shadow=0.6)
                img = put_text(img, what, x, yy + 24, 24, INK, al * 0.85, "rc", kind="iserif", shadow=0.6)
        return img
    return f


def over_all(*fns):
    def f(ctx, img, t, u):
        for fn in fns:
            if fn is not None:
                img = fn(ctx, img, t, u)
        return img
    return f


# ═══════════════════════════════════ the slice through the planet ═══════════════════════════════════
def _layer_col(depth):
    stops = [(0, (0.16, 0.14, 0.12)), (35, (0.10, 0.09, 0.09)), (660, (0.12, 0.08, 0.07)), (2890, (0.22, 0.09, 0.05)), (6371, (0.45, 0.25, 0.08))]
    d = np.asarray(depth)
    out = np.zeros(d.shape + (3,), np.float32)
    for (d0, c0), (d1, c1) in zip(stops, stops[1:]):
        m = (d >= d0) & (d < d1)
        k = ((d - d0) / (d1 - d0))[m][:, None]
        out[m] = np.array(c0) * (1 - k) + np.array(c1) * k
    return out


@scene_factory(keys=[])
def slice_scene(view=((0.0, 6371.0 - 250.0, 2.3), (0.0, 6371.0 - 250.0, 2.1)), tmin=(0.0, 0.0), show=("crater", "tanis"),
                plume=(0.0, 0.0), tilt=0.0):
    """A cut through the Earth along the 3,050 km between the crater (left) and the river (right), with what our
    physics says travels between them: rays through the mantle, surface waves, glass on ballistic arcs, the sound.
    view: (centre x km, centre y km, km per pixel) at the start and end of the beat. tmin: minutes after impact."""
    def f(ctx, t, u, fi):
        e = ease(u)
        (x0, y0, s0), (x1, y1, s1) = view
        cxk, cyk = lerp(x0, x1, e), lerp(y0, y1, e)
        kpp = np.exp(lerp(np.log(s0), np.log(s1), e))
        tm = lerp(tmin[0], tmin[1], clamp(u))
        xs, ys = grid()
        X = (xs - W / 2) * kpp + cxk
        Y = -(ys - H / 2) * kpp + cyk
        r = np.sqrt(X * X + Y * Y)
        img = np.zeros((H, W, 3), np.float32) + np.array([0.012, 0.014, 0.016], np.float32)
        inside = r < M.R_E
        col = _layer_col(np.clip(M.R_E - r, 0, 6371))
        shade = 0.55 + 0.45 * clamp((r - 3000) / 3371)
        img = np.where(inside[..., None], col * shade[..., None] * 0.55, img)
        # atmosphere and space: a thin blue band, then black with faint stars
        atm = np.exp(-np.clip(r - M.R_E, 0, None) / 60.0) * (r >= M.R_E)
        img = img + atm[..., None] * np.array([0.10, 0.20, 0.42], np.float32) * 0.8
        # surface line
        edge = np.exp(-((r - M.R_E) / (1.2 * kpp)) ** 2)
        img = img + edge[..., None] * np.array([0.9, 0.8, 0.6], np.float32) * 0.5
        # mantle discontinuities, very faint
        for dd in (410, 660):
            ring = np.exp(-((r - (M.R_E - dd)) / (1.0 * kpp)) ** 2)
            img = img + ring[..., None] * 0.04
        L_ = M.DELTA
        def P(th, rr):                                    # (theta from the crater, radius) -> screen
            ang = th - L_ / 2
            x, y = rr * np.sin(ang), rr * np.cos(ang)
            return np.stack([(x - cxk) / kpp + W / 2, -(y - cyk) / kpp + H / 2], -1)
        lay = np.zeros((H, W, 3), np.float32)
        def poly(pts, col, w=2, frac=1.0, dash=False):
            n = max(2, int(len(pts) * clamp(frac)))
            q = pts[:n].astype(np.int32)
            if dash:
                for i in range(0, n - 1, 4):
                    cv2.line(lay, tuple(q[i]), tuple(q[min(i + 2, n - 1)]), col, w, cv2.LINE_AA)
            else:
                cv2.polylines(lay, [q.reshape(-1, 1, 2)], False, col, w, cv2.LINE_AA)
            return pts[n - 1]
        c_pt = P(0.0, M.R_E)
        t_pt = P(L_, M.R_E)
        ctx.state["pts"] = dict(crater=tuple(c_pt), tanis=tuple(t_pt))
        if "horizon" in show:                              # line of sight from Tanis grazing the surface
            th = np.linspace(L_, 0, 100)
            hh = M.R_E / np.cos(np.clip(L_ - th, 0, 1.4)) * 1.0
            pts = P(th, M.R_E / np.cos(L_ - th) * np.cos(0))
            poly(P(th, M.R_E / np.cos(L_ - th)), (0.75, 0.75, 0.8), 1, 1.0, dash=True)
            hp = P(0.0, M.R_E + M.horizon_height_km())
            cv2.circle(lay, tuple(hp.astype(int)), 5, (1.0, 0.8, 0.6), -1, cv2.LINE_AA)
            ctx.state["pts"]["h807"] = tuple(hp)
        if "plume" in show:                                # the fireball climbing out of the crater (additive glow)
            hgt = lerp(plume[0], plume[1], e)
            for k in range(60):
                f_ = k / 60
                spread = 0.012 * f_ * np.sin(k * 2.3)
                pp = P(spread, M.R_E + hgt * f_)
                rad = max(2, int((6 + 160 * f_ ** 1.3) / kpp))
                c = (1.0, 0.85 - 0.45 * f_, 0.6 - 0.5 * f_)
                cv2.circle(lay, tuple(pp.astype(int)), rad, tuple(v * 0.22 * (1 - 0.6 * f_) for v in c), -1, cv2.LINE_AA)
        for wave, colr, t_arr in (("P", (0.55, 0.8, 1.0), M.seismic_minutes("P")), ("S", (0.95, 0.6, 1.0), M.seismic_minutes("S"))):
            if wave in show:
                th, rr = M.ray_path(wave)
                head = poly(P(th, rr), colr, 2, tm / t_arr)
                if tm < t_arr:
                    cv2.circle(lay, tuple(head.astype(int)), 6, tuple(c * 2 for c in colr), -1, cv2.LINE_AA)
                ctx.state["pts"][wave] = tuple(P(th, rr)[len(th) // 2])
        if "rings" in show:                                # wavefronts spreading through the planet from the crater
            for k, sp in enumerate((8.5, 4.8)):
                rad_km = sp * tm * 60
                if 0 < rad_km < 9000:
                    ring = np.abs(np.hypot(X - (M.R_E * np.sin(-L_ / 2)), Y - (M.R_E * np.cos(-L_ / 2))) - rad_km) < 2.0 * kpp
                    lay[ring & inside] += np.array([(0.25, 0.4, 0.5), (0.45, 0.3, 0.5)][k], np.float32)
        if "rayleigh" in show:
            th = np.linspace(0, L_, 200)
            fr = tm / M.rayleigh_minutes()
            head = poly(P(th, np.full_like(th, M.R_E + 4 * kpp)), (1.0, 0.85, 0.5), 3, fr)
            ctx.state["pts"]["rayleigh"] = tuple(head)
        if "glass" in show:
            for el, cc in ((30, (0.6, 1.0, 0.85)), (45, (0.6, 1.0, 0.85)), (60, (0.6, 1.0, 0.85))):
                th, rr, tt = M.arc_path(el)
                pts = P(th, rr)
                fr = clamp(tm * 60 / tt[-1])
                head = poly(pts, tuple(c * 0.55 for c in cc), 1, fr)
                if 0 < fr < 1:
                    cv2.circle(lay, tuple(head.astype(int)), 5, tuple(c * 2.2 for c in cc), -1, cv2.LINE_AA)
                ctx.state["pts"][f"glass{el}"] = tuple(pts[int(len(pts) * 0.5)])
        if "sound" in show:
            th = np.linspace(0, L_, 200)
            fr = tm / (M.sound_hours() * 60)
            head = poly(P(th, np.full_like(th, M.R_E + 12 * kpp)), (0.9, 0.9, 0.9), 2, fr, dash=True)
            ctx.state["pts"]["sound"] = tuple(head)
        for nm in ("crater", "tanis"):
            if nm in show:
                pt = c_pt if nm == "crater" else t_pt
                cv2.circle(lay, tuple(pt.astype(int)), 7, (1.0, 0.75, 0.5) if nm == "crater" else (0.6, 1.0, 0.7), -1, cv2.LINE_AA)
        img = img + lay + fast_blur(lay, 6) * 0.8
        return img, dict(exposure=1.2, bloom=0.5, grain=0.012)
    return f


def slice_label(name, text_, at, dx=0, dy=-40, color=INK, size=34, kind="iserif", anchor="c"):
    def f(ctx, img, t, u):
        p = ctx.state.get("pts", {}).get(name)
        if p is None:
            return img
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        return put_text(img, text_, p[0] + dx, p[1] + dy, size, color, fade(t, tt, ctx.dur, 0.3), anchor, kind=kind)
    return f


# ═══════════════════════════════════ the surge ═══════════════════════════════════
@functools.lru_cache(1)
def _flow_tex():
    a = fbm(1024, 256, scale=60, octaves=5, seed=111)
    b = fbm(1024, 256, scale=14, octaves=4, seed=112)
    a = cv2.resize(a, (2048, 512))
    b = cv2.resize(b, (2048, 512))
    c = fbm(1024, 256, scale=5, octaves=3, seed=113)
    c = cv2.resize(c, (2048, 512))
    return cv2.blur(0.45 * a + 0.35 * b + 0.2 * c, (5, 1))       # slightly stretched along the flow


def _log(m, cx, cy, L, ang, wd):
    pts = []
    for k in range(13):
        f = k / 12 - 0.5
        pts.append((f * L, wd * (1 - (2 * f) ** 8) * 0.5))
    pts += [(x, -y) for x, y in pts[::-1]]
    ca, sa = np.cos(ang), np.sin(ang)
    q = np.array([[cx + x * ca - y * sa, cy + x * sa + y * ca] for x, y in pts], np.int32)
    cv2.fillPoly(m, [q], 1.0, cv2.LINE_AA)


@scene_factory(keys=[])
def surge_scene(rise=(0.0, 1.0), view_az=(-14.0, -6.0), heat=0.15, dust=0.35, beads=0.5, under=(0.0, 0.0), speed=1.0):
    """At the water's edge as the river comes back the wrong way: the surface turns to fast brown water racing
    inland (left to right), climbing the bank toward the camera, carrying trunks, until it swallows the view."""
    def f(ctx, t, u, fi):
        e = ease(u)
        rs = lerp(rise[0], rise[1], e)
        bank = riverbank(phase="surge", view_az=view_az, pitch=(2.5, 2.5), fov=(66.0, 66.0), heat=(heat, heat), dust=(dust, dust),
                         slosh=(0.4, 0.4), beads=(0.0, 0.0), mist=(0.0, 0.0), level=(0.0, 0.0), shake=(1.5 * rs, 1.5 * rs))
        img, kw = bank(ctx, t, u, fi)
        xs, ys = grid()
        y_w = alt_to_y(-0.95, 2.5, (W / 2) / np.tan(np.radians(33)))  # far waterline on screen
        top = y_w - rs * 260 + 14 * np.sin(xs * 0.006 - t * 4 * speed) + 8 * np.sin(xs * 0.02 - t * 9 * speed)
        water = ys > top
        depth = clamp((ys - top) / (H - top + 1))
        tex = _flow_tex()
        # perspective scroll: nearer water (lower on screen) moves faster
        sp = (300 + 2600 * depth) * speed
        kk = 0.25 + 2.2 * depth                                   # nearer water: bigger features
        u_ = (((xs - t * sp) / kk * 0.6) % 2048).astype(np.float32)
        v_ = (((ys - top) / kk * 2.2 + 37) % 512).astype(np.float32)
        n = cv2.remap(tex, u_, v_, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        brown = np.array([0.20, 0.15, 0.09], np.float32) * (0.35 + 0.9 * n[..., None])
        foam = clamp((n - 0.56) * 4)[..., None] * np.array([0.62, 0.58, 0.50], np.float32) * (0.5 + 0.5 * depth[..., None])
        sky_tint = img.mean((0, 1)) * 0.25
        wcol = (brown + foam + sky_tint) * (0.55 + 0.45 * depth[..., None])
        crest = np.exp(-((ys - top) / 6.0) ** 2)[..., None] * np.array([0.7, 0.66, 0.58], np.float32) * (0.4 + 0.6 * n[..., None])
        img = np.where(water[..., None], wcol, img) + crest * 0.8
        spray = np.exp(-np.clip(top - ys, 0, None) / 40.0) * (ys < top) * rs
        img = img + spray[..., None] * img.mean((0, 1)) * 0.6
        # trunks riding the current
        r = rng_at(13)
        m = np.zeros((H, W), np.float32)
        for k in range(7):
            d = r.uniform(0.15, 0.9)
            px = (r.uniform(0, W + 900) + t * (300 + 2600 * d) * speed * 0.9) % (W + 900) - 450
            py = top.mean() + d * (H - top.mean()) * 0.9
            L_ = (120 + 700 * d) * r.uniform(0.6, 1.1)
            ang = r.uniform(-0.25, 0.25) + 0.15 * np.sin(t * 1.3 + k)
            _log(m, px, py, L_, ang, L_ * 0.06)
        m = blur(m, 1.5)
        img = img * (1 - m[..., None] * 0.9) + m[..., None] * np.array([0.05, 0.035, 0.022], np.float32)
        uw = lerp(under[0], under[1], e)
        if uw > 0:
            murk = np.array([0.085, 0.065, 0.035], np.float32) * (0.5 + 0.9 * cv2.remap(tex, ((xs - t * 900) % 2048).astype(np.float32), (ys % 512).astype(np.float32), cv2.INTER_LINEAR)[..., None])
            img = img * (1 - uw) + murk * uw
        return img, kw
    return f


# ═══════════════════════════════════ the evidence ═══════════════════════════════════
def _profile_poly(L, cx, cy, wid, n=90):
    xs_ = np.linspace(-0.5, 0.5, n)
    w_ = wid(xs_)
    top = np.stack([xs_, w_], -1)
    bot = np.stack([xs_[::-1], -w_[::-1]], -1)
    return (np.concatenate([top, bot]) * L + [cx, cy]).astype(np.int32)


@scene_factory(keys=["kind"])
def xray_scene(kind="sturgeon", scan=(0.0, 1.0), zoom=(1.0, 1.25), pan=(0.0, 0.0)):
    """A radiograph of the head of a fossil sturgeon, flattened in rock, with impact-glass beads packed among the
    gill rakers. An illustration of the kind of image in DePalma et al. 2019, not the actual X-ray."""
    def f(ctx, t, u, fi):
        e = ease(u)
        z = lerp(zoom[0], zoom[1], e)
        xs, ys = grid()
        cx, cy = W * 0.50 + lerp(pan[0], pan[1], e), H * 0.52
        rock = cv2.resize(fbm(480, 270, scale=40, octaves=6, seed=81), (W, H))
        img = 0.05 + rock * 0.06
        L = 1500 * z
        wid = lambda x: 0.075 * np.clip(1 - ((x + 0.05) / 0.55) ** 2, 0, 1) ** 0.6 * np.clip((0.52 - x) / 0.2, 0.05, 1) ** 0.7
        body = np.zeros((H, W), np.float32)
        cv2.fillPoly(body, [_profile_poly(L, cx - 300 * z, cy, wid)], 1.0, cv2.LINE_AA)
        body = blur(body, 6 * z)
        dens = body * (0.10 + 0.08 * cv2.resize(fbm(240, 135, scale=12, octaves=4, seed=82), (W, H)))
        # skull plates (dermal bones): patchy denser areas over the head
        head = np.exp(-(((xs - (cx + 280 * z)) / (260 * z)) ** 2 + ((ys - cy) / (95 * z)) ** 2) * 2.0) * body
        plates = clamp((cv2.resize(fbm(320, 180, scale=6, octaves=3, seed=83), (W, H)) - 0.45) * 3)
        dens += head * (0.18 + 0.22 * plates)
        bone = np.zeros((H, W), np.float32)
        for k in range(5):                                   # gill arches, curved, behind the skull
            ax = cx + (40 - k * 42) * z
            th = np.linspace(-1.0, 1.0, 50)
            arc = np.stack([ax + 70 * z * np.cos(th) * 0.4, cy + 10 * z + 100 * z * np.sin(th)], -1)
            cv2.polylines(bone, [arc.astype(np.int32).reshape(-1, 1, 2)], False, 0.32, max(2, int(6 * z)), cv2.LINE_AA)
        for k in range(12):                                  # dorsal scutes
            sx = cx + (-60 - k * 62) * z
            cv2.ellipse(bone, (int(sx), int(cy - (98 - k * 4) * z)), (int(24 * z), int(11 * z)), -6, 0, 360, 0.28, -1, cv2.LINE_AA)
        cv2.line(bone, (int(cx - 60 * z), int(cy - 20 * z)), (int(cx - 900 * z), int(cy - 8 * z)), 0.2, max(2, int(12 * z)), cv2.LINE_AA)  # notochord
        cv2.circle(bone, (int(cx + 360 * z), int(cy - 40 * z)), int(30 * z), 0.25, max(2, int(4 * z)), cv2.LINE_AA)
        img = img + dens + blur(bone, 2.0 * z)
        r = rng_at(5)
        nb = 620
        th = r.uniform(-1.0, 1.0, nb)
        kk = r.integers(0, 5, nb)
        bx = cx + (40 - kk * 42 + 70 * np.cos(th) * 0.4 + r.normal(0, 16, nb)) * z
        by = cy + (10 + 100 * np.sin(th) + r.normal(0, 9, nb)) * z
        rad = r.uniform(1.0, 3.6, nb) * z
        dots = np.zeros_like(img)
        for i in range(nb):
            cv2.circle(dots, (int(bx[i]), int(by[i])), max(1, int(rad[i])), 1.0, -1, cv2.LINE_AA)
        img = img + blur(dots, 0.7) * 0.9
        ctx.state["pts"] = dict(gills=(cx - 60 * z, cy - 150 * z))
        sx = lerp(-100, W + 100, lerp(scan[0], scan[1], clamp(u * 1.5)))
        rev = clamp((sx - xs) / 60)
        img = img * rev + 0.05 * (1 - rev)
        line = np.exp(-((xs - sx) / 3) ** 2) * 0.6
        out = np.stack([img * 0.80, img * 0.93, img * 1.04], -1) + line[..., None] * np.array([0.5, 0.9, 1.0], np.float32)
        return out.astype(np.float32), dict(exposure=1.3, bloom=0.45, grain=0.035)
    return f


@scene_factory(keys=[])
def amber_scene(light=(-0.6, 0.6), zoom=(1.0, 1.18), focus=(0.0, 1.0)):
    """A bleb of amber on fossil bark, lit from behind; inside it, spheres of impact glass and a few bubbles."""
    def f(ctx, t, u, fi):
        e = ease(u)
        z = lerp(zoom[0], zoom[1], e)
        xs, ys = grid()
        cx, cy = W * 0.5, H * 0.52
        X, Y = (xs - cx) / z, (ys - cy) / z
        bark = cv2.resize(fbm(256, 960, scale=8, octaves=5, seed=91), (W, H))
        fib = cv2.resize(fbm(1920, 40, scale=3, octaves=3, seed=92), (W, H))
        b = (0.35 * bark + 0.65 * fib)
        img = blur(np.stack([b * 0.09, b * 0.06, b * 0.04], -1), 7)
        lx = lerp(light[0], light[1], e)
        ang = np.arctan2(Y, X)
        edge_n = cv2.resize(fbm(360, 1, scale=20, octaves=4, seed=93), (360, 1))[0]
        rr = 1.0 + 0.16 * (edge_n[((ang + np.pi) / (2 * np.pi) * 359).astype(int)] - 0.5) + 0.08 * np.sin(ang * 3 + 1)
        d = np.sqrt((X / 430) ** 2 + (Y / 290) ** 2) / rr
        drop = clamp((1 - d) * 30)
        thick = np.sqrt(clamp(1 - d ** 2))
        flow = cv2.resize(fbm(480, 270, scale=30, octaves=4, seed=94), (W, H))
        back = np.exp(-(((X / 430) - lx * 0.5) ** 2 + (Y / 290 + 0.15) ** 2) * 2.4)
        amber = np.array([1.0, 0.50, 0.10], np.float32) * (0.85 + 0.3 * flow[..., None]) + np.array([-0.2, -0.15, -0.05], np.float32) * (1 - thick[..., None])
        seen = blur(img, 3) * 3.0                                 # the bark seen through the amber
        col = amber * (0.10 + 0.95 * back[..., None]) * (0.5 + 0.5 * thick[..., None]) + seen * amber * 0.6
        r = rng_at(14)
        inc = np.zeros((H, W, 3), np.float32)
        for k in range(12):
            bx, by, rad = r.uniform(-300, 300), r.uniform(-190, 190), r.uniform(6, 22)
            if (bx / 430) ** 2 + (by / 290) ** 2 > 0.55:
                continue
            m = np.zeros((H, W), np.float32)
            cv2.circle(m, (int(cx + bx * z), int(cy + by * z)), int(rad * z), 1.0, -1, cv2.LINE_AA)
            df = abs(((by + 190) / 380) - lerp(focus[0], focus[1], e))
            m = blur(m, 0.6 + 6 * df)
            col = col * (1 - m[..., None] * 0.9) + m[..., None] * np.array([0.015, 0.04, 0.03], np.float32)
            inc = glow_dot(inc, cx + (bx - rad * 0.35) * z, cy + (by - rad * 0.4) * z, (0.8, 1.0, 0.9), max(1.0, rad * z * 0.16), 1.1 / (1 + 4 * df))
        for k in range(22):
            bx, by, rad = r.uniform(-330, 330), r.uniform(-210, 210), r.uniform(1.5, 6)
            if (bx / 430) ** 2 + (by / 290) ** 2 > 0.7:
                continue
            m = np.zeros((H, W), np.float32)
            cv2.circle(m, (int(cx + bx * z), int(cy + by * z)), max(1, int(rad * z)), 1.0, 1, cv2.LINE_AA)
            col = col + blur(m, 1)[..., None] * np.array([1.0, 0.7, 0.3], np.float32) * 0.35
        spec = np.exp(-(((X / 430) + 0.42 - lx * 0.15) ** 2 * 300 + ((Y / 290) + 0.6) ** 2 * 700)) * 1.4
        rim = np.exp(-((1 - d) / 0.04) ** 2) * drop * 0.25
        col = col + spec[..., None] + inc + rim[..., None] * np.array([1.0, 0.7, 0.4], np.float32)
        img = img * (1 - drop[..., None]) + col * drop[..., None]
        return img, dict(exposure=1.25, bloom=0.55, grain=0.016)
    return f


@scene_factory(keys=[])
def dig_scene(push=(0.0, 1.0), mark=(0.0, 0.0), sun=0.8):
    """An outcrop face in the North Dakota badlands, late afternoon: grey-tan mudstone; the jumbled event bed;
    the thin peach-coloured boundary clay; dark lignite above; a rock hammer for scale. The camera pushes in."""
    def f(ctx, t, u, fi):
        e = ease(u)
        z = lerp(1.0, 1.9, lerp(push[0], push[1], e))
        xs, ys = grid()
        X = (xs - W * 0.5) / z + W * 0.5
        Y = (ys - H * 0.55) / z + H * 0.55
        Yd = Y + 0.03 * (X - W / 2)                               # a gentle dip
        tex = cv2.resize(fbm(640, 360, scale=8, octaves=5, seed=103), (W, H))
        crack = clamp((cv2.resize(fbm(640, 360, scale=3, octaves=3, seed=104), (W, H)) - 0.78) * 6)
        bands = cv2.resize(fbm(1, 2200, scale=10, octaves=5, seed=102), (1, 2200))[:, 0]
        bv = bands[np.clip((Yd + 500).astype(int), 0, 2199)]
        rock = np.array([0.52, 0.48, 0.42], np.float32) * (0.75 + 0.35 * bv[..., None]) * (0.8 + 0.3 * tex[..., None])
        kpg = H * 0.45
        lig = (Yd > kpg - 130) & (Yd < kpg - 9)
        rock = np.where(lig[..., None], np.array([0.10, 0.085, 0.07], np.float32) * (0.7 + 0.6 * tex[..., None]), rock)
        ton = (Yd >= kpg - 9) & (Yd < kpg + 9)
        rock = np.where(ton[..., None], np.array([0.92, 0.64, 0.50], np.float32) * (0.85 + 0.2 * tex[..., None]), rock)
        ev = (Yd >= kpg + 9) & (Yd < kpg + 330)
        clasts = clamp((cv2.resize(fbm(320, 180, scale=5, octaves=3, seed=105), (W, H)) - 0.55) * 4)
        rock = np.where(ev[..., None], rock * (0.8 + 0.25 * clasts[..., None]) * np.array([0.92, 0.9, 0.86], np.float32), rock)
        rock = rock * (1 - 0.5 * crack[..., None])
        light = 0.6 + sun * 0.5 * clamp(1 - Y / H) + 0.15 * tex
        rock = rock * light[..., None] * np.array([1.0, 0.86, 0.70], np.float32)
        sky_m = Y < H * 0.08 + 30 * np.sin(X * 0.004)
        sk = np.array([0.95, 0.72, 0.48], np.float32) * (0.8 + 0.2 * clamp(Y / 100)[..., None])
        img = np.where(sky_m[..., None], sk, rock)
        mk = lerp(mark[0], mark[1], e)
        if mk > 0:
            gl = np.exp(-((Yd - kpg) / 12) ** 2) * mk
            img = img + gl[..., None] * np.array([1.0, 0.7, 0.5], np.float32) * 0.18
        yk = (kpg - H * 0.55) * z + H * 0.55
        ctx.state["pts"] = dict(kpg=(W * 0.08, yk - 0.03 * (W * 0.08 - W / 2) * z), event=(W * 0.08, yk + 160 * z))
        return img * 0.6, dict(exposure=1.15, bloom=0.35, grain=0.02)
    return f


@scene_factory(keys=[])
def next_scene(t_fly=(0.0, 1.0)):
    """Teaser: Earth, the ring of geostationary satellites at 35,786 km, and Apophis passing inside it in 2029."""
    from engine.planet import render_planet
    def f(ctx, t, u, fi):
        e = ease(u)
        img = np.zeros((H, W, 3), np.float32) + 0.006
        r = rng_at(3)
        sx, sy = r.uniform(0, W, 900), r.uniform(0, H, 900)
        img = splat_points(img, sx, sy, np.tile(np.array([[0.6, 0.6, 0.7]], np.float32), (900, 1)) * r.uniform(0.05, 0.6, (900, 1)) ** 2, sigma=0.6)
        R = 140
        cx, cy = W * 0.5, H * 0.55
        render_planet(img, cx, cy, R, "earth", spin=1.0 + 0.03 * t, tilt=0.41, light=(-0.8, 0.3, 0.5), night=1.0)
        geo = R * 42164 / 6371
        lay = np.zeros_like(img)
        cv2.ellipse(lay, (int(cx), int(cy)), (int(geo), int(geo * 0.28)), -8, 0, 360, (0.25, 0.4, 0.6), 1, cv2.LINE_AA)
        for k in range(60):
            a = k / 60 * 2 * np.pi + t * 0.02
            px = cx + geo * np.cos(a) * np.cos(np.radians(8)) + geo * 0.28 * np.sin(a) * np.sin(np.radians(8))
            py = cy - geo * np.cos(a) * np.sin(np.radians(8)) + geo * 0.28 * np.sin(a) * np.cos(np.radians(8))
            cv2.circle(lay, (int(px), int(py)), 2, (0.6, 0.8, 1.0), -1, cv2.LINE_AA)
        # Apophis: closest approach ~31,600 km from Earth's centre (~38,000 km per JPL from the centre? use 31,600 km above surface ~ 38,000 centre)
        rmin = R * 38000 / 6371
        k = lerp(t_fly[0], t_fly[1], e)
        xx = np.linspace(-1.6, 1.6, 200)
        path = np.stack([cx + xx * W * 0.45, cy - min(rmin * 0.28, H * 0.42) + (xx ** 2) * 60], -1)
        cv2.polylines(lay, [path.astype(np.int32).reshape(-1, 1, 2)], False, (0.5, 0.45, 0.4), 1, cv2.LINE_AA)
        hp = path[int(clamp(k) * 199)]
        cv2.circle(lay, (int(hp[0]), int(hp[1])), 5, (1.0, 0.85, 0.6), -1, cv2.LINE_AA)
        ctx.state["pts"] = dict(apophis=tuple(hp), geo=(cx + geo * 0.95, cy - 10))
        img = img + lay + fast_blur(lay, 4) * 0.7
        return img, dict(exposure=1.2, bloom=0.5, grain=0.01)
    return f


# ---------------------------------------------------------------- the river, cut open
SW, SH = 2880, 1620                                   # world texture size (1.5x screen) so close-ups stay sharp


@functools.lru_cache(1)
def _section_tex():
    """Static textures for the cutaway: rock grain, lamina wobble, clast noise, bead positions."""
    grain = cv2.resize(fbm(960, 540, scale=10, octaves=5, seed=201), (SW, SH))
    wob = cv2.resize(fbm(720, 405, scale=6, octaves=3, seed=202), (SW, SH))
    clast = cv2.resize(fbm(720, 405, scale=4, octaves=4, seed=203), (SW, SH))
    r = rng_at(204)
    n = 9000
    bx, by = r.uniform(0, SW, n), r.uniform(0, SH, n)
    bs, bc = r.uniform(0.6, 1.6, n), r.uniform(0, 1, n)
    return grain, wob, clast, (bx, by, bs, bc)


def _channel(X):
    """Channel floor depth (world px) across the section: a broad, slightly asymmetric U."""
    x0, x1 = SW * 0.10, SW * 0.90
    s = np.clip((X - x0) / (x1 - x0), 0, 1)
    return np.where((X > x0) & (X < x1), (np.sin(np.pi * s) ** 0.7) * (1 + 0.12 * (s - 0.5)), 0.0)


@scene_factory(keys=[])
def burial_scene(fill=(0.3, 0.6), zoom=(1.0, 1.06), center=(0.5, 0.55), rain=1.0, glint=0.0):
    """The river channel cut open like a road cut, seen side-on: older floodplain mud on either side, dark water in
    the channel, and the new deposit building up from the bed: two chaotic surge beds full of logs and fish, then
    fine laminae peppered with glass beads; beads still sink through the water above. fill 0..1 (1 = buried)."""
    grain, wob, clast, (bx, by, bs, bc) = _section_tex()
    g0 = SH * 0.30                                    # ground surface
    dep = SH * 0.50                                   # channel depth at the deepest point

    def f(ctx, t, u, fi):
        e = ease(u)
        z = lerp(zoom[0], zoom[1], e)
        fl = lerp(fill[0], fill[1], e)
        cx, cy = center[0] * SW, center[1] * SH
        sc = (SW / W) / z
        xs, ys = grid()
        X = (xs - W / 2) * sc + cx
        Y = (ys - H / 2) * sc + cy
        mx, my = X.astype(np.float32), Y.astype(np.float32)
        S = lambda tex: cv2.remap(tex, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        gr, wb, cl = S(grain), S(wob), S(clast)
        floor = g0 + dep * _channel(X)                # channel bottom y
        inch = (Y > g0) & (Y < floor)
        # old floodplain: grey-green mudstone in thick bands
        band = np.sin((Y + 40 * wb) / 23.0) * 0.5 + 0.5
        fl_lam = np.sin((Y + 25 * wb) / 5.5) * 0.5 + 0.5
        old = np.array([0.22, 0.21, 0.18], np.float32) * (0.78 + 0.18 * band[..., None] + 0.08 * fl_lam[..., None]) * (0.88 + 0.2 * gr[..., None])
        # sky and far bank above the ground line
        sky_c = np.array([0.30, 0.22, 0.14], np.float32) * (0.6 + 0.4 * clamp((g0 - Y) / 600)[..., None])
        ridge = 34 + 46 * (0.5 + 0.5 * np.sin(X / 210.0) * np.cos(X / 77.0)) + 18 * (wb - 0.5)
        trees = (Y > g0 - ridge) & (Y <= g0)
        img = np.where((Y <= g0)[..., None], np.where(trees[..., None], np.float32(0.03), sky_c), old)
        # the new deposit, measured as height above the channel floor (laminae drape the U)
        top = floor - (floor - g0) * fl               # current fill surface
        hfrac = np.where(inch, (floor - Y) / np.maximum(floor - g0, 1), -1.0)
        lam = hfrac + 0.012 * (wb - 0.5)
        sed = inch & (Y >= top)
        surge = (lam < 0.22) | ((lam > 0.36) & (lam < 0.52))           # two chaotic surge beds
        lamin = np.sin(lam * 260.0) * 0.5 + 0.5
        fine = np.array([0.46, 0.38, 0.28], np.float32) * (0.75 + 0.2 * lamin[..., None]) * (0.85 + 0.25 * gr[..., None])
        chaos = np.array([0.33, 0.27, 0.20], np.float32) * (0.72 + 0.3 * cl[..., None] + 0.25 * (gr[..., None] - 0.5)) * (0.9 + 0.1 * np.sin(lam * 90.0)[..., None])
        sedc = np.where(surge[..., None], chaos, fine)
        img = np.where(sed[..., None], sedc, img)
        # water above the deposit: dark, silty, lit a little from the surface
        wat = inch & (Y < top)
        wl = np.array([0.05, 0.075, 0.06], np.float32) * (0.5 + 0.8 * clamp(1 - (Y - g0) / dep)[..., None]) * (0.85 + 0.3 * wb[..., None])
        img = np.where(wat[..., None], wl, img)
        # fish and logs caught in the surge beds (world-placed, only where already deposited)
        m_f = np.zeros((H, W), np.float32)
        m_l = np.zeros((H, W), np.float32)
        r = rng_at(205)
        for k in range(14):
            wx = r.uniform(SW * 0.2, SW * 0.8)
            lf = r.choice([r.uniform(0.04, 0.18), r.uniform(0.39, 0.5)])
            wy = g0 + dep * _channel(np.array([wx]))[0] * (1 - lf)
            fy = g0 + dep * _channel(np.array([wx]))[0]
            if fy - (fy - g0) * lf < fy - (fy - g0) * fl:                # not yet buried
                continue
            px, py = (wx - cx) / sc + W / 2, (wy - cy) / sc + H / 2
            if k % 3 == 0:
                _log(m_l, px, py, r.uniform(160, 420) / sc, r.uniform(-0.3, 0.3), r.uniform(18, 34) / sc)
            else:
                m_f = np.maximum(m_f, _fish_mask(px, py, r.uniform(120, 260) / sc, r.uniform(-0.5, 0.5) + np.pi * (k % 2),
                                                 kind="sturgeon" if k % 4 == 1 else "paddle", bend=r.uniform(-0.6, 0.6)))
        img = img * (1 - 0.85 * m_l[..., None]) + m_l[..., None] * np.array([0.06, 0.04, 0.025], np.float32)
        img = img * (1 - 0.85 * m_f[..., None]) + m_f[..., None] * np.array([0.05, 0.045, 0.04], np.float32)
        # glass beads: in the deposit (densest in the fine layers) and sinking through the water
        sx_, sy_ = (bx - cx) / sc + W / 2, (by - cy) / sc + H / 2
        onscr = (sx_ > -4) & (sx_ < W + 4) & (sy_ > -4) & (sy_ < H + 4)
        flo = g0 + dep * _channel(bx)
        inb = (by > g0) & (by < flo)
        hf = np.where(inb, (flo - by) / np.maximum(flo - g0, 1), -1)
        dens = np.where((hf > 0.22) & (hf < 0.36) | (hf > 0.52), 1.0, 0.25)
        buried = inb & (by >= flo - (flo - g0) * fl) & (bc < dens)
        tw = 1.0 + glint * 1.6 * np.clip(np.sin(t * 2.5 + bc * 40.0), 0, 1) ** 8
        col = np.array([[0.95, 0.80, 0.55]], np.float32) * (0.35 + 0.5 * bc[:, None]) * tw[:, None]
        sel = buried & onscr
        img = splat_points(img, sx_[sel], sy_[sel], col[sel] * 1.8, sigma=max(0.8, 1.5 / sc))
        if rain > 0:                                   # sinking beads in the water column (15 cm/s; slow on screen)
            r2 = rng_at(206)
            k_ = 700
            rx = r2.uniform(SW * 0.12, SW * 0.88, k_)
            ry = (r2.uniform(0, 1, k_) + t * 0.035) % 1.0
            fl2 = g0 + dep * _channel(rx)
            topw = fl2 - (fl2 - g0) * fl
            wy = g0 + ry * np.maximum(topw - g0, 0)
            ok = topw > g0 + 4
            px, py = (rx - cx) / sc + W / 2, (wy - cy) / sc + H / 2
            img = splat_points(img, px[ok], py[ok], np.tile(np.array([[0.7, 0.6, 0.45]], np.float32), (int(ok.sum()), 1)) * 0.35 * rain,
                               sigma=max(0.6, 1.0 / sc))
        # soft front light falling off with depth, and a faint vignette
        lit = 0.85 + 0.25 * clamp(1 - (Y - g0) / (dep * 1.3))
        img = img * lit[..., None]
        return img * (0.75 - 0.2 * clamp((z - 1.4) / 1.0)), dict(exposure=1.1, bloom=0.25, grain=0.02)
    return f
