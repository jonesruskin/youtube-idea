"""BEAT SHEET — every narration line gets a picture that explains it.
BEATS[segment_id] = [Beat(line, scene, overlay, at=word, cut=bool), ...]  (voice + dialogue unchanged)."""
import numpy as np
import cv2
from engine.beats import Beat as B
from engine.core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                         fast_blur, grid, hex2rgb, splat_points)
from engine.space import space_frame, lens_image
from engine.planet import render_planet, render_sun_disk, render_rings, coast_mask
from engine.scenes2 import Cam, scope_view, city_aerial, cross_section, earth_cutaway, ice_column, icy_bodies
from engine import hud
from engine.hud import Layer, text, fade, prog, typed, WHITE, ACC, BLUE, RED, GREEN, DIM
from engine import sim as simmod
from ep_blackhole.vis import *  # noqa

# ═══════════════════════════ helpers specific to this episode ═══════════════════════════


def flare_env(t, t0, t1):
    m = (t0 + t1) / 2
    return float(np.exp(-((t - m) / max(0.2, (t1 - t0) * 0.35)) ** 2)) if t1 > t0 else 0.0


def night_flare(star, start_word=None, start=None, length=4.0, **p):
    """Night scene whose target star flares starting at a given word."""
    def dyn(ctx, s, t, u):
        t0 = ctx.w(start_word) if start_word else (start or 0.0)
        a, b = t0 / ctx.dur, (t0 + length) / ctx.dur
        s.p["flare"] = [dict(star=star, t0=a, t1=b)]
    return night(_dyn=dyn, **p)


# ── open1 ─────────────────────────────────────────────────────────────────────────────
def o1_over(ctx, img, t, u):
    s = ctx.state["shot"]
    L = Layer()
    tc = ctx.w("Chile")
    img = text(img, typed("ATACAMA DESERT · CHILE", prog(t, tc, 1.0)), 140, 120, 22, DIM, fade(t, tc), "lc", tracking=0.3)
    tt = ctx.w("telescope")
    if hasattr(s, "dome"):
        dx, dy = s.dome
        X = W / 2 + (dx - s.off[0] - W / 2) * (1 + 0.06 * 1.7 * smoother(u))
        Y = H + (dy - s.off[1] - H) * (1 + 0.06 * 1.7 * smoother(u))
        img = hud.callout(L, img, (X, Y), "SURVEY TELESCOPE", None, fade(t, tt), prog(t, tt), dx=-160, dy=-110, color=WHITE, size=20)
    ts = ctx.w("star")
    sx, sy = s.star(0)
    L.circle((sx, sy), 30, ACC, fade(t, ts) * 0.9, th=2, progress=prog(t, ts))
    img = text(img, "ONE ORDINARY STAR", sx + 44, sy - 6, 18, ACC, fade(t, ts + 0.3), "lc")
    return L.composite(img, 0.5)


def o1b_flares(ctx, t):
    return [smooth(span(t, 0.0, ctx.dur * 0.9)) * 0.8 + 0.1, 0, 0, 0]


def o1b_over(ctx, img, t, u):
    L = Layer()
    te, tb, tbr = ctx.w("exploding"), ctx.w("burning"), ctx.w("brighter", 0)
    x0, y0 = 1420, 300
    img = hud.panel(img, x0 - 30, y0 - 60, x0 + 430, y0 + 330, fade(t, 0.1), 0.5)
    img = text(img, "WHAT'S HAPPENING?", x0, y0 - 24, 20, DIM, fade(t, 0.1), "lc", tracking=0.25)
    img = text(img, "EXPLOSION", x0 + 60, y0 + 40, 26, WHITE, fade(t, te), "lc", kind="mono6")
    L.cross((x0 + 20, y0 + 40), 14, RED, fade(t, te + 0.3), progress=prog(t, te + 0.3, 0.5))
    img = text(img, "FIRE / FLARE", x0 + 60, y0 + 100, 26, WHITE, fade(t, tb), "lc", kind="mono6")
    L.cross((x0 + 20, y0 + 100), 14, RED, fade(t, tb + 0.3), progress=prog(t, tb + 0.3, 0.5))
    tbx = ctx.w("just")
    img = text(img, "BRIGHTER", x0 + 60, y0 + 160, 26, ACC, fade(t, tbx), "lc", kind="mono6")
    L.check((x0 + 20, y0 + 160), 14, GREEN, fade(t, tbx + 0.2), progress=prog(t, tbx + 0.2, 0.5))
    img = lightcurve(L, img, x0, y0 + 210, 380, 90, [(0.75, 0.75, 0.08)], prog(t, tbx, 1.5), ACC, fade(t, tbx), "WEEKS", "")
    return L.composite(img, 0.5)


# ── open2 ─────────────────────────────────────────────────────────────────────────────
def o2_flares(ctx, t):
    w1 = ctx.w("same")
    w2 = ctx.w("after") if ctx.beat.line >= 1 else 99
    return [0.1, smooth(span(t, w1 - 0.8, w1 + 0.4)) * (1 - smooth(span(t, w1 + 2.5, w1 + 4))) * 0.9, 0.0, 0.0]


def o2_over_a(ctx, img, t, u):
    L = Layer()
    cam = Cam(u, z=(1.0, 1.06), pan=(-40, 10))
    labels = [("WEEK 0", 0), ("WEEK 3", ctx.w("same") - 0.5)]
    for k, (lab, tw) in enumerate(labels):
        x, y = cam.p(*STARS_SCOPE[k])
        img = text(img, lab, x, y + 40, 18, ACC if k == 1 else DIM, fade(t, max(0, tw)), "c")
    img = lightcurve(L, img, 1420, 760, 380, 90, [(0.3, 0.6, 0.05), (0.7, 0.75 * prog(t, ctx.w("same"), 1.0), 0.05)], 1.0, ACC, fade(t, 0.2), "WEEKS", "BRIGHTNESS")
    return L.composite(img, 0.5)


def o2b_flares(ctx, t):
    return [0.1, 0.1, smooth(span(t, 0.0, 0.6)) * 0.9, 0.0]


def o2_over_b(ctx, img, t, u):
    L = Layer()
    cam = Cam(u, z=(1.0, 1.06), pan=(-40, 10))
    for k, lab in enumerate(["WEEK 0", "WEEK 3", "WEEK 6"]):
        x, y = cam.p(*STARS_SCOPE[k])
        img = text(img, lab, x, y + 40, 18, ACC if k == 2 else DIM, 1.0 if k < 2 else fade(t, 0.1), "c")
    img = lightcurve(L, img, 1420, 760, 380, 90, [(0.2, 0.6, 0.04), (0.5, 0.6, 0.04), (0.8, 0.75 * prog(t, 0.1, 0.8), 0.04)], 1.0, ACC, 1.0, "WEEKS", "BRIGHTNESS")
    return L.composite(img, 0.5)


def o2c_flares(ctx, t):
    k = clamp(t / ctx.dur)
    out = []
    for i in range(4):
        pos = i / 3
        out.append(0.85 * np.exp(-((k * 1.25 - 0.1 - pos) / 0.12) ** 2) + 0.08)
    return out


def o2c_lenspath(ctx, t):
    return clamp(t / ctx.dur * 1.25 - 0.1)


def o2_over_c(ctx, img, t, u):
    L = Layer()
    cam = Cam(u, z=(1.0, 1.06), pan=(-40, 10))
    p0, p1 = np.array(cam.p(640, 680)), np.array(cam.p(1320, 300))
    L.line(p0, p1, color=ACC, alpha=0.6 * fade(t, 0.3), th=2, progress=prog(t, 0.3, 2.5))
    k = clamp(t / ctx.dur * 1.25 - 0.1)
    q = p0 + (p1 - p0) * (0.0 + k * 1.0)
    tm = ctx.w("moving")
    img = hud.callout(L, img, q, "SOMETHING IS HERE", "invisible — but it bends the light behind it", fade(t, tm), prog(t, tm), dx=140, dy=-120, color=ACC, size=22)
    return L.composite(img, 0.5)


# ── open3 ─────────────────────────────────────────────────────────────────────────────
def o3a_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.1), pan=(30, 0), canvas=(3050, 1560))
    tp, tc, tl = ctx.w("planet"), ctx.w("comet"), ctx.w("light")
    kl = smooth(span(t, tl - 0.2, tl + 0.8))
    img = cam.stars(lenses=[(cam.p(960, 520)[0], cam.p(960, 520)[1], cam.r(60) * kl)] if kl > 0.01 else [], gain=0.8)
    ap = fade(t, tp - 0.3, tc - 0.1, 0.3)
    if ap > 0:
        x, y = cam.p(700, 520)
        tmp = img.copy()
        render_planet(tmp, x, y, cam.r(70), "mars", spin=1, tilt=0.3, light=(-0.6, 0.3, 0.7))
        img = img * (1 - ap) + tmp * ap
    ac = fade(t, tc - 0.3, tl - 0.1, 0.3)
    if ac > 0:
        x, y = cam.p(1230, 520)
        L = Layer()
        hud.icon_comet(L, (x, y), 90, (0.6, 0.85, 1.0), ac)
        img = L.composite(img * 1.0, 1.2)
    return img


def o3a_over(ctx, img, t, u):
    cam = Cam(u, z=(1.0, 1.1), pan=(30, 0))
    L = Layer()
    tp, tc, tl = ctx.w("planet"), ctx.w("comet"), ctx.w("light")
    x, y = cam.p(700, 520)
    L.cross((x, y), 90, RED, fade(t, tp + 0.15, tc - 0.1), progress=prog(t, tp + 0.15, 0.4))
    img = text(img, "PLANET", x, y + 130, 22, WHITE, fade(t, tp, tc - 0.1), "c", kind="mono6")
    x2, y2 = cam.p(1230, 520)
    L.cross((x2 + 60, y2 - 30), 90, RED, fade(t, tc + 0.15, tl - 0.1), progress=prog(t, tc + 0.15, 0.4))
    img = text(img, "COMET", x2 + 60, y2 + 110, 22, WHITE, fade(t, tc, tl - 0.1), "c", kind="mono6")
    x3, y3 = cam.p(960, 520)
    img = text(img, "NO LIGHT AT ALL", x3, y3 + 140, 24, ACC, fade(t, tl + 0.1), "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.5)


def o3c_scene(ctx, t, u, fi):
    """Ten Suns appear, rush together and collapse into a black ball."""
    cam = Cam(u, z=(1.0, 1.08), canvas=(3050, 1560))
    tc = ctx.w("crushed")
    kc = ease_in(span(t, tc - 0.1, tc + 0.6), 2.0)
    img = cam.stars(gain=0.6)
    if kc < 0.98:
        for k in range(10):
            appear = fade(t, 0.1 + k * 0.12, None, 0.25)
            if appear <= 0:
                continue
            a = np.radians(-90 + k * 36)
            x = 960 + 330 * np.cos(a) * (1 - kc)
            y = 540 + 300 * np.sin(a) * (1 - kc)
            X, Y = cam.p(x, y)
            tmp = np.zeros_like(img)
            render_sun_disk(tmp, X, Y, cam.r(62) * (1 - 0.7 * kc), t + k)
            img = img + tmp * appear * 0.9
    if kc > 0.6:
        bx, by = cam.p(960, 540)
        g = smooth(span(kc, 0.6, 1.0))
        glow_dot(img, bx, by, (1.0, 0.7, 0.4), 60 * (1 - g) + 6, 3 * (1 - g))
        img = lens_image(img, bx, by, cam.r(90) * g, shadow=0.42)
    return img


def o3c_over(ctx, img, t, u):
    n = int(clamp((t - 0.1) / 0.12 + 1, 0, 10))
    tc = ctx.w("crushed")
    a = fade(t, 0.2, tc + 0.4)
    img = text(img, f"{n} × THE SUN" if n > 1 else "THE SUN", W / 2, 140, 34, WHITE, a, "c", kind="light", tracking=0.08)
    img = text(img, "CRUSHED INTO ONE TINY BALL", W / 2, H - 140, 24, ACC, fade(t, tc + 0.8), "c", kind="mono6", tracking=0.3)
    return img


def o3d_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 0.92), pan=(-40, 0))
    city, pxpm = city_aerial(cam.z, cam.px)
    # map: 2048 px ≈ 120 km → 60 km ≈ 1024 map px (as wide as a whole metropolis)
    r = 1024 / 2 * pxpm
    img = lens_image(city, W / 2 + cam.px * 0.0, H / 2, r * 0.55, shadow=0.0)
    xs, ys = grid()
    d = np.sqrt((xs - W / 2) ** 2 + (ys - H / 2) ** 2)
    img = img * clamp((d - r * 0.98) / 2.0)[..., None]
    ctx.state["r"] = r
    return img, dict(exposure=1.6)


def o3d_over(ctx, img, t, u):
    r = ctx.state["r"]
    L = Layer()
    img = hud.dimension(L, img, (W / 2 - r, H / 2 + r + 50), (W / 2 + r, H / 2 + r + 50), "60 KM", fade(t, 0.3), prog(t, 0.3), WHITE)
    img = text(img, "A CITY AT NIGHT, SEEN FROM ABOVE", 140, 120, 20, DIM, fade(t, 0.5), "lc", tracking=0.3)
    img = text(img, "10 SUNS OF MASS", W / 2, H / 2 - r - 60, 24, ACC, fade(t, 0.8), "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.4)


# ── open4 ─────────────────────────────────────────────────────────────────────────────
def o4a_over(ctx, img, t, u):
    s = ctx.state["shot"]
    if not hasattr(s, "last_scr"):
        return img
    S = simmod
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    ty = lerp(-32, -31, smoother(u))
    bh = s.last_scr(sim.bh(ty))
    sun = s.last_scr(sim.sun(ty))
    L = Layer()
    L.arrow(bh, bh + (sun - bh) * 0.55, color=ACC, th=4, progress=prog(t, 0.2, 1.0), alpha=fade(t, 0.2))
    img = text(img, "HEADING FOR US", (bh[0] + sun[0]) / 2, (bh[1] + sun[1]) / 2 - 40, 24, ACC, fade(t, 0.5), "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.5)


# ── c1b / galaxy helpers ──────────────────────────────────────────────────────────────
def paper_over(ctx, img, t, u):
    a = fade(t, 0.05)
    img = hud.panel(img, 420, 250, 1500, 830, a, 0.88)
    img = text(img, "ASTROPHYSICAL JOURNAL · 2022", 500, 330, 22, DIM, a, "lc", tracking=0.2)
    img = text(img, "An isolated stellar-mass black hole", 500, 430, 48, WHITE, a, "lc", kind="light", tracking=0.0)
    img = text(img, "detected through microlensing", 500, 500, 48, WHITE, a, "lc", kind="light", tracking=0.0)
    img = text(img, "Sahu et al. · Lam et al.", 500, 580, 24, DIM, a, "lc")
    L = Layer()
    st = prog(t, 0.5, 0.4)
    L.rect(1080, 670, 1420, 770, GREEN, a * st, 3)
    img = text(img, "CONFIRMED", 1250, 720, 30, GREEN, a * st, "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.3)


def ogle_curve_over(ctx, img, t, u):
    L = Layer()
    x0, y0, w, h = 420, 330, 1080, 380
    img = hud.panel(img, x0 - 60, y0 - 80, x0 + w + 60, y0 + h + 90, fade(t, 0.05), 0.65)
    xs = np.linspace(0, 1, 300)
    tE, u0 = 0.16, 0.12
    uu = np.sqrt(u0 ** 2 + ((xs - 0.5) / tE) ** 2)
    A = (uu ** 2 + 2) / (uu * np.sqrt(uu ** 2 + 4))
    ys = 0.08 + (A - 1) / (A.max() - 1) * 0.85
    img = hud.chart(L, img, x0, y0, w, h, xs, ys, prog(t, 0.2, 2.5), ACC, fade(t, 0.05), "2011  –  2012", "BRIGHTNESS OF A DISTANT STAR")
    img = hud.dimension(L, img, (x0 + w * 0.3, y0 + h + 40), (x0 + w * 0.7, y0 + h + 40), "SEVERAL MONTHS", fade(t, 1.5), prog(t, 1.5), WHITE)
    ti = ctx.w("invisible")
    img = text(img, "CAUSE: NOTHING VISIBLE", x0 + w, y0 - 30, 22, RED, fade(t, ti), "rc", kind="mono6", tracking=0.25)
    return L.composite(img, 0.5)


def gal_dist_over(ctx, img, t, u):
    s = ctx.state.get("shot")
    tf = ctx.w("forty")
    a = fade(t, tf)
    img = hud.panel(img, 1240, 640, 1820, 900, a, 0.55)
    img = text(img, "45 KM/S", 1290, 700, 54, WHITE, a, "lc", kind="xlight", tracking=0.02)
    img = text(img, "≈ 160,000 KM/H", 1290, 770, 24, ACC, a, "lc", kind="light", tracking=0.02)
    img = text(img, "EARTH TO MOON IN 2.5 HOURS", 1290, 830, 20, DIM, a, "lc")
    return img


# ── c1c ───────────────────────────────────────────────────────────────────────────────
def c1c_over_dist(ctx, img, t, u):
    s = ctx.state["shot"]
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    ty = lerp(-30.6, -30.2, smoother(u))
    bh, sun = s.last_scr(sim.bh(ty)), s.last_scr(sim.sun(ty))
    L = Layer()
    tf = ctx.w("three")
    img = hud.dimension(L, img, bh, sun, "300 × EARTH–SUN DISTANCE", fade(t, tf), prog(t, tf, 1.2), ACC, offset=60)
    img = text(img, "SAME SPEED: 45 KM/S", bh[0] + 60, bh[1] + 50, 20, WHITE, fade(t, 0.4), "lc", kind="mono6")
    return L.composite(img, 0.5)


def maths_over(ctx, img, t, u):
    a = fade(t, 0.05)
    img = hud.panel(img, 240, 340, 1680, 740, a, 0.8)
    img = text(img, "300 AU", 450, 500, 80, WHITE, fade(t, 0.1), "c", kind="xlight")
    img = text(img, "÷", 690, 500, 80, DIM, fade(t, 0.4), "c", kind="xlight")
    img = text(img, "45 km/s", 940, 500, 80, WHITE, fade(t, 0.6), "c", kind="xlight")
    img = text(img, "=", 1190, 500, 80, DIM, fade(t, 0.9), "c", kind="xlight")
    v = hud.counter(0, 31.6, prog(t, 1.0, 1.0), "{:.0f}")
    img = text(img, v + " yrs", 1450, 500, 80, ACC, fade(t, 1.0), "c", kind="xlight")
    img = text(img, "…and it speeds up as it falls in", W / 2, 620, 24, DIM, fade(t, 1.6), "c")
    return img


def countdown_over(ctx, img, t, u):
    a = fade(t, 0.0)
    img = hud.panel(img, 460, 330, 1460, 760, a, 0.75)
    img = text(img, "≈ 30 YEARS", W / 2, 470, 120, WHITE, a, "c", kind="xlight", tracking=0.04, glow=0.25)
    secs = 30 * 365.25 * 86400 - t * 86400 * 41
    d = int(secs // 86400)
    yrs, days = d // 365, d % 365
    img = text(img, f"{yrs:02d} Y  {days:03d} D  {int((secs % 86400) // 3600):02d} H", W / 2, 620, 36, ACC, a, "c", kind="mono6", tracking=0.2)
    return img


def news_over(ctx, img, t, u):
    L = Layer()
    tw, tn, tt = 0.0, ctx.w("news"), ctx.w("Tuesday")
    # path uncertainty narrowing
    a1 = fade(t, 0.0, tn + 0.2)
    for k in range(9):
        spread = (k - 4) * 70 * (1 - smooth(span(t, 0.4, tn)))
        L.line((260, 540), (1660, 540 + spread), color=ACC, alpha=0.35 * a1, th=2)
    wk = int(1 + 3 * clamp(t / max(0.1, tn)))
    img = text(img, f"PREDICTED PATH · WEEK {wk}", 260, 470, 22, ACC, a1, "lc", kind="mono6", tracking=0.2)
    img = L.composite(img, 0.5)
    a2 = fade(t, tn)
    if a2 > 0:
        L = Layer()
        img = hud.panel(img, 0, 0, W, H, a2, 0.6)
        cx, cy = 960, 540
        hud.icon_phone(L, img, (cx, cy), 440, WHITE, a2)
        img = L.composite(img, 0.2)
        img = text(img, "08:14", cx, cy - 330, 30, DIM, a2, "c", kind="mono")
        img = text(img, "TUESDAY", cx, cy - 260, 58, WHITE, a2 * fade(t, tt), "c", kind="light", tracking=0.06, glow=0.2)
        img = hud.panel(img, cx - 200, cy - 110, cx + 200, cy + 110, a2 * fade(t, tn + 0.3), 0.75)
        img = text(img, "BREAKING NEWS", cx - 175, cy - 70, 18, RED, a2 * fade(t, tn + 0.3), "lc", kind="mono6", tracking=0.2)
        img = text(img, "Black hole on course", cx - 175, cy - 20, 26, WHITE, a2 * fade(t, tn + 0.4), "lc", kind="regular", tracking=0.0)
        img = text(img, "for the Solar System", cx - 175, cy + 20, 26, WHITE, a2 * fade(t, tn + 0.4), "lc", kind="regular", tracking=0.0)
        img = text(img, "Arrival in about 30 years", cx - 175, cy + 70, 20, DIM, a2 * fade(t, tn + 0.5), "lc", kind="regular", tracking=0.0)
    return img


# ── c1d: the simulation ───────────────────────────────────────────────────────────────
def simparam_over(ctx, img, t, u):
    rows = [("MASS", "10 SUNS", "Ten"), ("SPEED", "45 KM/S", "forty"), ("CLOSEST PASS", "~1 AU FROM THE SUN", "passing")]
    a = fade(t, 0.2)
    img = hud.panel(img, 1240, 220, 1820, 560, a, 0.65)
    img = text(img, "GRAVITY SIMULATION · INPUTS", 1280, 270, 18, DIM, a, "lc", tracking=0.25)
    for i, (k, v, wd) in enumerate(rows):
        tw = ctx.w(wd)
        img = text(img, k, 1280, 340 + i * 70, 18, DIM, fade(t, tw), "lc")
        img = text(img, typed(v, prog(t, tw, 0.8)), 1280, 370 + i * 70, 26, WHITE, fade(t, tw), "lc", kind="mono6")
    return img


def ff_over(ctx, img, t, u):
    img = text(img, ">>  FAST-FORWARD", W - 140, 120, 24, ACC, fade(t, 0.1), "rc", kind="mono6", tracking=0.25)
    tm = ctx.w("maths")
    img = text(img, "NOTHING HERE IS HAND-ANIMATED", W / 2, H - 120, 22, WHITE, fade(t, tm), "c", kind="mono6", tracking=0.3)
    return img


# ── w1: rockets ───────────────────────────────────────────────────────────────────────
def rockets_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.05), canvas=(3050, 1560))
    bx, by = cam.p(1420, 540)
    return cam.stars(lenses=[(bx, by, cam.r(150))], gain=0.75)


def rockets_over(ctx, img, t, u):
    cam = Cam(u, z=(1.0, 1.05))
    L = Layer()
    te, tf, tm = ctx.w("Every"), ctx.w("fired"), ctx.w("measure")
    k = 0
    for i in range(6):
        for j in range(9):
            x, y = cam.p(220 + j * 62, 300 + i * 80 + (j % 2) * 20)
            a = fade(t, te + k * 0.015)
            hud.icon_rocket(L, (x, y), 32, WHITE, a * 0.9, flame=smooth(span(t, tf, tf + 0.5)) * (0.7 + 0.3 * np.sin(t * 20 + k)), angle=np.pi / 2)
            k += 1
    bx, by = cam.p(1420, 540)
    L.arrow((820, 540), (1180, 540), color=ACC, th=5, progress=prog(t, tf, 0.8), alpha=fade(t, tf))
    img = L.composite(img, 0.5)
    img = text(img, "EVERY ROCKET EVER BUILT", 520, 200, 24, WHITE, fade(t, te), "c", kind="mono6", tracking=0.25)
    a = fade(t, tm - 0.6)
    img = hud.panel(img, 1140, 780, 1820, 960, a, 0.65)
    img = text(img, "BLACK HOLE'S SPEED CHANGE", 1180, 820, 18, DIM, a, "lc", tracking=0.2)
    img = text(img, "0.00000000000000000002 m/s", 1180, 880, 30, ACC, a, "lc", kind="mono6", tracking=0.02)
    return img


def earth_push_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.06), canvas=(1700, 2100))
    img = cam.stars(gain=0.6)
    ex, ey = cam.p(1100, 560)
    render_planet(img, ex, ey, cam.r(300), "earth", spin=2.2 + t * 0.05, tilt=0.4, light=(-0.7, 0.3, 0.6))
    return img


def earth_push_over(ctx, img, t, u):
    cam = Cam(u, z=(1.0, 1.06))
    L = Layer()
    for i in range(5):
        x, y = cam.p(560, 360 + i * 100)
        hud.icon_rocket(L, (x, y), 30, WHITE, fade(t, 0.1 + i * 0.05), flame=0.8 + 0.2 * np.sin(t * 25 + i), angle=np.pi / 2)
    img = L.composite(img, 0.5)
    a = fade(t, 0.5)
    img = text(img, "EARTH'S SPEED CHANGE: ~0", W / 2, H - 120, 28, ACC, a, "c", kind="mono6", tracking=0.2)
    return img


def nowhere_over(ctx, img, t, u):
    s = ctx.state["shot"]
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    ty = lerp(-0.25, -0.2, smoother(u))
    L = Layer()
    tm = ctx.w("Mars")
    tmo = ctx.w("Moon")
    mars = s.last_scr(sim.planet(3, ty))
    earth = s.last_scr(sim.planet(2, ty))
    img = hud.callout(L, img, mars, "MARS", "IN THE PATH", fade(t, tm), prog(t, tm), dx=120, dy=-70, color=RED, size=22)
    img = hud.callout(L, img, earth, "THE MOON", "IN THE PATH", fade(t, tmo), prog(t, tmo), dx=-140, dy=-80, color=RED, size=22)
    te = ctx.w("every")
    img = text(img, "EVERY WORLD WE COULD REACH", W / 2, H - 120, 26, RED, fade(t, te), "c", kind="mono6", tracking=0.25)
    return L.composite(img, 0.5)


# ── w2: underground ───────────────────────────────────────────────────────────────────
def dig_scene(ctx, t, u, fi):
    td = ctx.w("Dig")
    return cross_section(t, dig=ease_out(span(t, td, td + 2.0)) * 0.3, shelters=0.0, lights=0.0), dict(exposure=1.6)


def shelter_scene(ctx, t, u, fi):
    tn, tg = ctx.w("nuclear"), ctx.w("geothermal")
    return cross_section(t, dig=0.3 + 0.7 * smooth(span(t, 0, 2.5)), shelters=smooth(span(t, 0.4, 3.0)) * 1.0, lights=smooth(span(t, tn, tn + 1)),
                         heat=smooth(span(t, tg, tg + 1))), dict(exposure=1.6)


def shelter_over(ctx, img, t, u):
    L = Layer()
    items = [("SEALED", "sealed", (520, 440), None), ("NUCLEAR POWER", "nuclear", (960, 620), "atom"), ("GEOTHERMAL HEAT", "geothermal", (1400, 1010), "heat"),
             ("SEED VAULTS", "Seed", (380, 520), "seed"), ("LIBRARIES", "Libraries", (1560, 780), "book")]
    for lab, wd, (x, y), ic in items:
        tw = ctx.w(wd)
        a = fade(t, tw)
        if ic == "atom":
            hud.icon_atom(L, (x + 150, y - 10), 26, WHITE, a, t)
        elif ic == "heat":
            hud.icon_heat(L, (x, y - 60), 26, ACC, a, t)
        elif ic == "seed":
            hud.icon_seed(L, (x, y - 70), 26, GREEN, a)
        elif ic == "book":
            hud.icon_book(L, (x, y - 70), 26, WHITE, a)
        img = text(img, lab, x, y, 20, WHITE, a, "c", kind="mono6", tracking=0.2)
    img = L.composite(img, 0.5)
    tt = ctx.w("Thirty")
    yr = int(1 + 29 * prog(t, tt, 2.0))
    img = text(img, f"YEAR {yr} OF 30", W - 140, 260, 26, ACC, fade(t, tt), "rc", kind="mono6", tracking=0.2)
    L = Layer()
    L.line((150, 216), (150, 980), color=DIM, alpha=0.6, th=1)
    img = L.composite(img, 0)
    img = text(img, "SURFACE", 166, 216, 16, DIM, 1.0, "lc")
    img = text(img, "−1 KM", 166, 980, 16, DIM, 1.0, "lc")
    return img


def years_over(ctx, img, t, u):
    y = 2026 + int(t / ctx.dur * 25)
    img = text(img, f"{y}", W - 140, 120, 34, WHITE, fade(t, 0.3) * 0.9, "rc", kind="light", tracking=0.08)
    img = text(img, "LIFE GOES ON", W - 140, 166, 18, DIM, fade(t, 0.6), "rc", tracking=0.3)
    return img


# ── c2a ───────────────────────────────────────────────────────────────────────────────
def trails_over(ctx, img, t, u):
    y = 2031 + int(t / ctx.dur * 20)
    return text(img, f"YEAR {y}", W - 140, 120, 30, WHITE, fade(t, 0.2) * 0.9, "rc", kind="mono6", tracking=0.2)


def seasons_over(ctx, img, t, u):
    names = ["WINTER", "SPRING", "SUMMER", "AUTUMN"]
    ph = (u * 2.0) % 1.0
    k = int(ph * 4) % 4
    return text(img, names[k], W - 140, 120, 30, WHITE, fade(t, 0.2) * 0.9, "rc", kind="mono6", tracking=0.3)


def sys_highlight_over(name_idx, label, at=0.3, color=ACC):
    def f(ctx, img, t, u):
        s = ctx.state["shot"]
        sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
        tA, tB = s.p["t"]
        ty = lerp(tA, tB, smoother(min(u, 1)))
        L = Layer()
        sunp = s.last_scr(sim.sun(ty))
        a_ = simmod.PLANETS[name_idx][1]
        half = lerp(*s.p["scale"], smoother(min(u, 1)))
        sc = (W * 0.5) / half
        L.ellipse(sunp, a_ * sc, a_ * sc * np.cos(s.INC), color, 0.8 * fade(t, at), 2, progress=prog(t, at, 1.2))
        img = text(img, label, sunp[0] + a_ * sc * 0.72, sunp[1] - a_ * sc * np.cos(s.INC) * 0.72 - 20, 20, color, fade(t, at + 0.6), "c", kind="mono6", tracking=0.2)
        return L.composite(img, 0.5)
    return f


# ── c2b Neptune ───────────────────────────────────────────────────────────────────────
def nep_orbit_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 0.94), canvas=(3400, 1500))
    img = cam.stars(gain=0.5)
    sx, sy = cam.p(960, 560)
    glow_dot(img, sx, sy, (1.0, 0.85, 0.6), 8, 6)
    glow_dot(img, sx, sy, (1.0, 0.7, 0.4), 50, 0.4)
    ang = t * 2.6
    nx, ny = cam.p(960 + 420 * np.cos(ang), 560 + 420 * 0.42 * np.sin(ang))
    render_planet(img, nx, ny, cam.r(16), "neptune", spin=1, tilt=0.3, light=(np.cos(ang + np.pi), 0, 0.4))
    ctx.state["nep"] = (cam, ang)
    return img


def nep_orbit_over(ctx, img, t, u):
    cam, ang = ctx.state["nep"]
    L = Layer()
    sx, sy = cam.p(960, 560)
    L.ellipse((sx, sy), cam.r(420), cam.r(420 * 0.42), BLUE, 0.7, 2)
    a = np.linspace(ang - 1.8, ang, 60)
    L.polyline(np.stack([sx + cam.r(420) * np.cos(a), sy + cam.r(420 * 0.42) * np.sin(a)], -1), BLUE, 0.9, 3)
    img = L.composite(img, 0.6)
    n = hud.counter(0, 27_000_000, prog(t, 0.2, ctx.dur - 0.4))
    img = text(img, "ORBITS COMPLETED", W / 2, 150, 20, DIM, fade(t, 0.2), "c", tracking=0.25)
    img = text(img, n, W / 2, 200, 48, WHITE, fade(t, 0.2), "c", kind="xlight", tracking=0.04)
    img = text(img, "OVER ~4.5 BILLION YEARS", W / 2, H - 130, 22, ACC, fade(t, ctx.w("billions")), "c", kind="mono6", tracking=0.25)
    return img


def pull_arrow_over(ctx, img, t, u):
    L = Layer()
    tn = ctx.w("pulling")
    L.arrow((960 + 40, 540), (960 + 40 + 340 * prog(t, tn), 540 - 60 * prog(t, tn)), color=ACC, th=6, alpha=fade(t, tn))
    img = L.composite(img, 0.6)
    img = text(img, "10× THE SUN'S MASS", 1400, 420, 22, ACC, fade(t, ctx.w("ten")), "c", kind="mono6", tracking=0.25)
    return img


def nep_break_over(ctx, img, t, u):
    s = ctx.state["shot"]
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    tA, tB = s.p["t"]
    ty = lerp(tA, tB, smoother(min(u, 1)))
    L = Layer()
    tt = np.linspace(max(-2.9, ty - 1.2), ty, 120)
    pts = np.array([s.last_scr(sim.planet(7, x) - sim.sun(x) + sim.sun(ty)) for x in tt])
    L.polyline(pts, BLUE, 1.0, 5)
    q = pts[-1]
    ts, tbk = ctx.w("stretches"), ctx.w("breaks")
    img = L.composite(img, 0.7)
    img = text(img, "STRETCHES", q[0] + 30, q[1] - 30, 24, WHITE, fade(t, ts, tbk), "lc", kind="mono6", tracking=0.2)
    img = text(img, "BREAKS FREE", q[0] + 30, q[1] - 30, 26, RED, fade(t, tbk), "lc", kind="mono6", tracking=0.2)
    return img


def neptune_leave_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 0.85), canvas=(2200, 1100))
    img = cam.stars(gain=0.8)
    k = ease_in(span(t, 0, ctx.dur), 1.6)
    x, y = cam.p(lerp(960, 1500, k), lerp(540, 380, k))
    render_planet(img, x, y, cam.r(lerp(300, 40, k)), "neptune", spin=0.6 + t * 0.03, tilt=0.45, light=(-0.75, 0.15, 0.62), exposure=1.3)
    return img


def calm_earth_over(ctx, img, t, u):
    img = text(img, "ON EARTH: NOTHING CHANGES", W / 2, 150, 26, WHITE, fade(t, 0.3), "c", kind="mono6", tracking=0.3)
    return img


# ── c2c ───────────────────────────────────────────────────────────────────────────────
def icy_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.12), pan=(-60, 0), canvas=(2400, 900))
    img = cam.stars(gain=0.8)
    glow_dot(img, *cam.p(260, 240), (1.0, 0.95, 0.85), 3, 4)
    return icy_bodies(img, t, n=24, cam=cam)


def kbo_arrows_over(ctx, img, t, u):
    s = ctx.state["shot"]
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    tA, tB = s.p["t"]
    ty = lerp(tA, tB, smoother(min(u, 1)))
    sunp = np.array(s.last_scr(sim.sun(ty)))
    L = Layer()
    tout, tin = ctx.w("flung"), ctx.w("inward")
    for k in range(5):
        ang = np.radians(200 + k * 25)
        p0 = sunp + np.array([np.cos(ang), np.sin(ang) * 0.6]) * 420
        L.arrow(p0, p0 + np.array([np.cos(ang), np.sin(ang) * 0.6]) * 160, color=BLUE, th=3, progress=prog(t, tout + k * 0.08), alpha=fade(t, tout))
    for k in range(3):
        ang = np.radians(230 + k * 30)
        p0 = sunp + np.array([np.cos(ang), np.sin(ang) * 0.6]) * 430
        L.arrow(p0, p0 - np.array([np.cos(ang), np.sin(ang) * 0.6]) * 200, color=RED, th=3, progress=prog(t, tin + k * 0.1), alpha=fade(t, tin))
    img = L.composite(img, 0.5)
    img = text(img, "TO DEEP SPACE", 260, 160, 22, BLUE, fade(t, tout), "lc", kind="mono6", tracking=0.2)
    img = text(img, "INWARD · ARRIVING IN DECADES", 260, 200, 22, RED, fade(t, tin), "lc", kind="mono6", tracking=0.2)
    return img


# ── c3s Saturn ────────────────────────────────────────────────────────────────────────
def saturn_grip_over(ctx, img, t, u):
    cx, cy, R, z = ctx.state["sat"]
    L = Layer()
    tr = 0.2
    L.ellipse((cx, cy), R * 2.27, R * 2.27 * np.sin(0.32), WHITE, 0.0, 2)
    img = text(img, "RINGS: ~140,000 KM ACROSS", cx, cy + R * 1.2 + 30, 20, WHITE, fade(t, tr) * smooth(span(R, 50, 90)), "c", kind="mono6", tracking=0.15)
    tg = ctx.w("close")
    gr = R * 2.27 * (3_000_000 / 140_000)
    L.circle((cx, cy), min(gr, 1400), ACC, fade(t, tg) * 0.9, th=2)
    img = text(img, "SATURN'S GRIP · ~3,000,000 KM", cx, max(110, cy - min(gr, 1400) - 30), 22, ACC, fade(t, tg + 0.3), "c", kind="mono6", tracking=0.15)
    img = text(img, "SATURN + RINGS", cx + R * 2.4 + 20, cy, 18, WHITE, fade(t, tg + 0.8) * smooth(span(R, 60, 20)), "lc", kind="mono6")
    tc = ctx.w("carried")
    img = text(img, "RINGS AND ALL", W / 2, H - 120, 24, WHITE, fade(t, tc), "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.5)


# ── c3a Jupiter mass bars ─────────────────────────────────────────────────────────────
def jup_bars_scale(ctx, t):
    tm = ctx.w("doesn't")
    return lerp(330, 3_330_000, ease_in(span(t, tm, tm + 1.6), 3))


# ── c3b garden: Jupiter wandering ─────────────────────────────────────────────────────
def jupiter_garden(**p):
    def dyn(ctx, s, t, u):
        pass
    return night(**p)


def jup_wander_over(ctx, img, t, u):
    s = ctx.state["shot"]
    L = Layer()
    # normal path (dashed ecliptic) and the actual drifting positions
    p0, p1 = np.array([300, 420]), np.array([1700, 260])
    L.line(p0, p1, color=DIM, alpha=0.7 * fade(t, 0.4), th=2, progress=prog(t, 0.4, 1.4))
    img = text(img, "JUPITER'S NORMAL PATH", 360, 380, 18, DIM, fade(t, 0.8), "lc", tracking=0.2)
    n = int(clamp(t / ctx.dur) * 9) + 1
    pts = []
    for i in range(n):
        f = i / 8
        base = p0 + (p1 - p0) * (0.25 + 0.5 * f)
        dev = np.array([0, 1]) * (f ** 2.2) * 260 + np.array([1, 0]) * np.sin(f * 3) * 40
        pts.append(base + dev)
    for i, q in enumerate(pts):
        last = i == len(pts) - 1
        glow_r = 7 if last else 4
        L.circle(q, glow_r, (1.0, 0.92, 0.75), 1.0 if last else 0.55, fill=True)
    if len(pts) > 1:
        L.polyline(np.array(pts), ACC, 0.6, 2)
    img = L.composite(img, 0.6)
    q = pts[-1]
    img = text(img, "JUPITER", q[0] + 20, q[1] + 4, 20, WHITE, 1.0, "lc", kind="mono6", tracking=0.2)
    img = text(img, "ONE DOT PER WEEK", 140, H - 120, 20, DIM, fade(t, 1.0), "lc", tracking=0.25)
    return img


def binoc_over_a(ctx, img, t, u):
    return text(img, "THROUGH BINOCULARS", W / 2, H - 70, 18, DIM, fade(t, 0.4), "c", tracking=0.3)


def binoc_over_b(ctx, img, t, u):
    L = Layer()
    cam = Cam(u, z=(1.0, 1.12), pan=(120, -40))
    cx, cy = W * 0.52 + cam.px, H * 0.47 + cam.py
    img = hud.callout(L, img, (cx, cy + cam.r(95)), "STARS SMEARED INTO A RING", None, fade(t, ctx.w("ring")), prog(t, ctx.w("ring")), dx=200, dy=120, color=ACC, size=20)
    tm = ctx.w("Moon")
    am = fade(t, tm)
    if am > 0:
        img = hud.panel(img, 1440, 640, 1860, 1000, am, 0.85)
        L2 = Layer()
        L2.circle((1590, 820), 120, (0.55, 0.55, 0.55), am, fill=True)
        for (dx, dy, rr) in ((-30, -20, 22), (40, 30, 16), (10, 60, 12), (-50, 50, 10)):
            L2.circle((1590 + dx, 820 + dy), rr, (0.4, 0.4, 0.42), am, fill=True)
        L2.circle((1790, 820), 4, ACC, am, th=2)
        img = L2.composite(img, 0.2)
        img = text(img, "THE MOON", 1590, 970, 16, WHITE, am, "c", kind="mono6")
        img = text(img, "THE RING", 1790, 780, 16, ACC, am, "c", kind="mono6")
        img = text(img, "1/30 THE WIDTH", 1650, 670, 16, DIM, am, "c")
    tc = ctx.w("constellations")
    rng = np.random.default_rng(4)
    pts = np.array([[620, 330], [760, 280], [880, 360], [1010, 300], [1180, 410], [1300, 360], [1420, 470]], float)
    L.polyline(pts, DIM, fade(t, tc) * 0.6, 1, progress=prog(t, tc, 1.5))
    for q in pts:
        L.circle(q, 3, WHITE, fade(t, tc) * 0.8, fill=True)
    return L.composite(img, 0.5)


# ── c4a tug of war ────────────────────────────────────────────────────────────────────
def tug_over(ctx, img, t, u):
    L = Layer()
    k = smooth(span(t, 0.4, ctx.dur))
    ex, ey = W / 2, H / 2 + 10
    L.arrow((ex - 440, ey), (ex - 440 - 260 * (1 - 0.45 * k), ey), color=(1.0, 0.85, 0.5), th=7)
    L.arrow((ex + 440, ey), (ex + 440 + 260 * (1 + 0.6 * k), ey), color=ACC, th=7)
    img = L.composite(img, 0.6)
    img = text(img, "SUN", ex - 600, ey + 50, 24, (1.0, 0.85, 0.5), 1.0, "c", kind="mono6", tracking=0.3)
    img = text(img, "BLACK HOLE", ex + 640, ey + 50, 24, ACC, 1.0, "c", kind="mono6", tracking=0.3)
    tl = ctx.w("losing")
    img = text(img, "THE SUN IS LOSING", ex + 640, ey + 150, 26, RED, fade(t, tl), "c", kind="mono6", tracking=0.3)
    return img


# ── c4b tides ─────────────────────────────────────────────────────────────────────────
def tide_dyn(levels):
    """levels: list of (word, metres) → tide scene follows the narration exactly."""
    def dyn(ctx, s, t, u):
        pts = [(0.0, levels[0][1])] + [(ctx.w(wd) + 0.2, m) for wd, m in levels[1:]]
        m = pts[0][1]
        for (ta, ma), (tb, mb) in zip(pts, pts[1:] + [(ctx.dur, pts[-1][1])]):
            if t >= ta:
                m = lerp(ma, mb, smooth(span(t, ta, ta + 1.2))) if mb != ma else ma
        s.metres = m
    return dyn


def coast_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.06), canvas=(1700, 2100))
    img = cam.stars(gain=0.5)
    pulse = 0.5 + 0.5 * np.sin(t * np.pi * 2 / 1.6)
    render_planet(img, *cam.p(960, 560), cam.r(400), "earth", spin=1.3 + t * 0.06, tilt=0.4, light=(-0.6, 0.3, 0.7),
                  emit=(coast_mask(), (1.0, 0.35, 0.2), 0.6 + 1.4 * pulse))
    return img


def coast_over(ctx, img, t, u):
    img = text(img, "EVERY COASTLINE", W / 2, 130, 30, RED, fade(t, 0.2), "c", kind="mono6", tracking=0.3)
    img = text(img, "TWICE A DAY", W / 2, 180, 22, WHITE, fade(t, 0.6), "c", kind="mono6", tracking=0.3)
    return img


# ── c4c Sun ───────────────────────────────────────────────────────────────────────────
def align_over(ctx, img, t, u):
    L = Layer()
    a = fade(t, 0.3)
    x0, y0 = 1460, 820
    img = hud.panel(img, x0 - 30, y0 - 70, x0 + 420, y0 + 90, a, 0.6)
    L.circle((x0 + 30, y0 + 10), 22, (1.0, 0.7, 0.3), a, fill=True)
    L.circle((x0 + 200, y0 + 10), 7, (0.02, 0.02, 0.02), a, fill=True)
    L.circle((x0 + 200, y0 + 10), 10, ACC, a, th=1)
    L.circle((x0 + 370, y0 + 10), 12, BLUE, a, fill=True)
    L.line((x0 + 52, y0 + 10), (x0 + 358, y0 + 10), color=DIM, alpha=a * 0.6, th=1, dash=8)
    img = L.composite(img, 0.4)
    img = text(img, "SUN", x0 + 30, y0 + 54, 14, DIM, a, "c")
    img = text(img, "BLACK HOLE", x0 + 200, y0 + 54, 14, ACC, a, "c")
    img = text(img, "YOU", x0 + 370, y0 + 54, 14, BLUE, a, "c")
    img = text(img, "VIEW THROUGH A SOLAR FILTER", 140, 120, 18, DIM, fade(t, 0.5), "lc", tracking=0.3)
    return img


def warped_over(ctx, img, t, u):
    lx, ly, te, cx, cy, R = ctx.state["sunlens"]
    L = Layer()
    tw = ctx.w("warped")
    img = hud.callout(L, img, (lx, ly - te * 0.9), "A TINY WARPED CIRCLE", None, fade(t, tw), prog(t, tw), dx=160, dy=-130, color=WHITE, size=20)
    img = text(img, "ECLIPSE GLASSES", W / 2, H - 90, 18, DIM, fade(t, 0.4), "c", tracking=0.3)
    return L.composite(img, 0.5)


def bend_sun_over(ctx, img, t, u):
    lx, ly, te, cx, cy, R = ctx.state["sunlens"]
    L = Layer()
    for k in range(-3, 4):
        if k == 0:
            continue
        b = te * (0.9 + abs(k) * 0.35) * np.sign(k)
        x = np.linspace(lx - 520, lx + 520, 120)
        y = ly + b - np.sign(k) * min(0.55 * abs(b), te * 0.9 / abs(k)) * np.exp(-((x - lx) / (te * 2.2)) ** 2)
        L.polyline(np.stack([x, y], -1), (1.0, 0.95, 0.85), 0.65 * fade(t, 0.3), 2, progress=prog(t, 0.3 + abs(k) * 0.1, 1.2))
    img = L.composite(img, 0.6)
    img = text(img, "SUNLIGHT, BENT AROUND NOTHING", W / 2, H - 100, 24, WHITE, fade(t, ctx.w("bending")), "c", kind="mono6", tracking=0.25)
    return img


# ── c4d closest pass ──────────────────────────────────────────────────────────────────
def speed_over(ctx, img, t, u):
    ts = ctx.w("hundred")
    a = fade(t, max(0, ts - 1.0))
    img = hud.panel(img, 1340, 760, 1820, 960, a, 0.6)
    v = hud.counter(110, 147, prog(t, ts - 1.0, 1.5))
    img = text(img, "BLACK HOLE SPEED", 1380, 800, 18, DIM, a, "lc", tracking=0.2)
    img = text(img, f"{v} KM/S", 1380, 870, 52, ACC, a, "lc", kind="xlight", tracking=0.02)
    return img


def orbit_taken_over(ctx, img, t, u):
    s = ctx.state["shot"]
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    tA, tB = s.p["t"]
    ty = lerp(tA, tB, smoother(min(u, 1)))
    L = Layer()
    sunp = s.last_scr(sim.sun(ty))
    half = lerp(*s.p["scale"], smoother(min(u, 1)))
    sc = (W * 0.5) / half
    L.ellipse(sunp, sc, sc * np.cos(s.INC), BLUE, 0.8, 2, dash=12)
    tt = np.linspace(-0.04, ty, 80)
    pts = np.array([s.last_scr(sim.planet(2, x) - sim.sun(x) + sim.sun(ty)) for x in tt])
    L.polyline(pts, (0.6, 0.85, 1.0), 1.0, 5)
    img = L.composite(img, 0.6)
    img = text(img, "EARTH'S OLD ORBIT", sunp[0] - sc * 0.7, sunp[1] + sc * np.cos(s.INC) * 0.75 + 20, 20, BLUE, fade(t, 0.3), "c", kind="mono6", tracking=0.2)
    q = pts[-1]
    img = text(img, "EARTH'S NEW PATH", q[0] + 24, q[1] - 24, 20, WHITE, fade(t, 0.5), "lc", kind="mono6", tracking=0.2)
    return img


# ── c4e Moon ──────────────────────────────────────────────────────────────────────────
def grip_over(ctx, img, t, u):
    L = Layer()
    ex, ey = 560, 600
    orb = 520  # px for 384,000 km
    k = smooth(span(t, 0.3, ctx.dur * 0.85))
    grip_km = lerp(1_500_000, 270_000, k)
    r = orb * grip_km / 384_000
    L.circle((ex, ey), min(r, 2500), ACC if grip_km > 384_000 else RED, 0.9, th=3)
    img = L.composite(img, 0.6)
    img = text(img, "EARTH'S GRIP", ex, ey - min(r, 470) - 24, 22, ACC if grip_km > 384_000 else RED, fade(t, 0.3), "c", kind="mono6", tracking=0.25)
    img = text(img, f"{grip_km:,.0f} KM", W - 140, 200, 40, WHITE, fade(t, 0.3), "rc", kind="xlight", tracking=0.02)
    img = text(img, "MOON'S ORBIT: 384,000 KM", W - 140, 250, 20, DIM, fade(t, 0.3), "rc")
    return img


# ── c4f Venus + fan ───────────────────────────────────────────────────────────────────
def venus_over(ctx, img, t, u):
    vx, vy, bx, by, cam = ctx.state["venus"]
    L = Layer()
    img = hud.callout(L, img, (vx, vy), "VENUS", "NOW ORBITING THE BLACK HOLE", fade(t, ctx.w("captures")), prog(t, ctx.w("captures")), dx=150, dy=-110, color=ACC, size=22)
    return L.composite(img, 0.5)


def fan_over(ctx, img, t, u):
    L = Layer()
    p0 = np.array([700, 600])
    cols = [RED, (1.0, 0.85, 0.5), BLUE]
    names = ["FALLS IN", "STAYS, STRETCHED", "THROWN OUT"]
    ends = [np.array([980, 420]), np.array([520, 330]), np.array([1700, 260])]
    for k in range(3):
        c1 = p0 + np.array([150, -40])
        xs = np.linspace(0, 1, 60)
        if k == 0:
            ang = np.linspace(0, 5.5, 80)
            rr = np.linspace(260, 10, 80)
            pts = np.stack([980 + rr * np.cos(ang + 2.4), 420 + rr * np.sin(ang + 2.4) * 0.5], -1)
            pts = np.vstack([p0, pts])
        else:
            pts = ((1 - xs) ** 2)[:, None] * p0 + (2 * (1 - xs) * xs)[:, None] * c1 + (xs ** 2)[:, None] * ends[k]
        L.polyline(pts, cols[k], 0.9 * fade(t, 0.2 + k * 0.3), 3, progress=prog(t, 0.2 + k * 0.3, 1.5))
        img = text(img, names[k], pts[-1][0] + 20, pts[-1][1] - 20, 18, cols[k], fade(t, 1.0 + k * 0.3) * 0.0, "lc")
    L.circle(p0, 8, BLUE, 1.0, fill=True)
    img = L.composite(img, 0.6)
    img = text(img, "EARTH", p0[0] - 20, p0[1] + 30, 20, BLUE, 1.0, "rc", kind="mono6")
    img = text(img, "A FEW HUNDRED THOUSAND KM DECIDES WHICH", W / 2, H - 120, 22, WHITE, fade(t, ctx.w("hundred")), "c", kind="mono6", tracking=0.2)
    return img


# ── f1 ────────────────────────────────────────────────────────────────────────────────
def spiral_over(ctx, img, t, u):
    L = Layer()
    c = np.array([1160, 540])
    ts, tn = ctx.w("straight"), ctx.w("Nothing")
    L.arrow((420, 540), (1100, 540), color=WHITE, th=4, progress=prog(t, 0.1, 0.6), alpha=fade(t, 0.1, tn + 0.5))
    L.cross((760, 540), 50, RED, fade(t, ts), progress=prog(t, ts, 0.5))
    ang = np.linspace(0, 4.2 * np.pi, 300)
    rr = np.linspace(560, 22, 300)
    pts = np.stack([c[0] + rr * np.cos(ang + np.pi), c[1] + rr * np.sin(ang + np.pi) * 0.45], -1)
    L.polyline(pts, ACC, fade(t, tn), 3, progress=prog(t, tn, 2.0))
    img = L.composite(img, 0.6)
    img = text(img, "IT SPIRALS", W / 2, H - 120, 26, ACC, fade(t, tn + 1.0), "c", kind="mono6", tracking=0.3)
    return img


def stretch_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.1), canvas=(2600, 1700))
    bx, by = cam.p(360, 540)
    img = cam.stars(lenses=[(bx, by, cam.r(130))], gain=0.65)
    k = smooth(span(t, 0.6, ctx.dur))
    render_planet(img, *cam.p(1200, 540), cam.r(220), "earth", spin=2.0 + t * 0.1, tilt=0.4, light=(-0.9, 0.1, 0.4), stretch=1 + 0.75 * k)
    return img


def stretch_over(ctx, img, t, u):
    cam = Cam(u, z=(1.0, 1.1))
    L = Layer()
    k = smooth(span(t, 0.6, ctx.dur))
    ex, ey = cam.p(1200, 540)
    R = cam.r(220)
    near = ex - R * (1 + 0.75 * k)
    far = ex + R * (1 + 0.75 * k)
    tn = ctx.w("near")
    L.arrow((near, ey), (near - 260, ey), color=ACC, th=7, progress=prog(t, tn), alpha=fade(t, tn))
    L.arrow((far, ey), (far - 110, ey), color=(1.0, 0.85, 0.5), th=7, progress=prog(t, tn + 0.5), alpha=fade(t, tn + 0.5))
    img = L.composite(img, 0.6)
    img = text(img, "NEAR SIDE: PULLED HARDER", near - 140, ey - 70, 18, ACC, fade(t, tn), "c", kind="mono6")
    img = text(img, "FAR SIDE: PULLED LESS", far + 30, ey - 70, 18, (1.0, 0.85, 0.5), fade(t, tn + 0.5), "c", kind="mono6")
    tm = ctx.w("million")
    bx, by = cam.p(360, 540)
    img = hud.dimension(L, img, (bx, ey + 300), (near, ey + 300), "~1,000,000 KM", fade(t, tm), prog(t, tm), WHITE)
    return L.composite(img, 0.4)


def cutaway_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.06), canvas=(1700, 2100))
    img = cam.stars(gain=0.5)
    return earth_cutaway(img, *cam.p(820, 560), cam.r(400), 2.6 + t * 0.03, reveal=smooth(span(t, 0.0, 0.8)))


def cutaway_over(ctx, img, t, u):
    cam = Cam(u, z=(1.0, 1.06))
    cx, cy = cam.p(820, 560)
    R = cam.r(400)
    L = Layer()
    a0 = np.radians(-90 + 40)
    items = [("OCEANS", "Oceans", (-0.55, -0.62), (cx + R + 160, cy - 260)), ("CRUST", "Crust", (0.30, -0.95), (cx + R + 160, cy - 120)),
             ("MANTLE", "Mantle", (0.32, -0.62), (cx + R + 160, cy + 20)), ("IRON CORE", "iron", (0.06, -0.12), (cx + R + 160, cy + 160))]
    for lab, wd, (ox, oy), (lx, lyy) in items:
        p = (cx + R * ox, cy + R * oy)
        tw = ctx.w(wd)
        img = hud.callout(L, img, p, lab, None, fade(t, tw), prog(t, tw, 0.5), dx=lx - p[0] - 90, dy=lyy - p[1], color=WHITE, size=24)
    return L.composite(img, 0.5)


def heat_over(ctx, img, t, u):
    v = hud.counter(10_000, 3_000_000, prog(t, 0.2, ctx.dur - 0.3))
    img = text(img, "TEMPERATURE", W - 140, 140, 18, DIM, fade(t, 0.2), "rc", tracking=0.25)
    img = text(img, f"{v} °C", W - 140, 200, 50, ACC, fade(t, 0.2), "rc", kind="xlight", tracking=0.02)
    return img


def target_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.04))
    img = cam.stars(gain=0.45)
    glow_dot(img, *cam.p(960, 540), (1.0, 0.85, 0.6), 7, 5)
    return img


def target_over(ctx, img, t, u):
    L = Layer()
    cam = Cam(u, z=(1.0, 1.04))
    c = np.array(cam.p(960, 540))
    L.ellipse(c, cam.r(420), cam.r(420 * 0.42), BLUE, 0.8, 2)
    img = text(img, "EARTH'S ORBIT · 300 MILLION KM ACROSS", c[0], c[1] - cam.r(420 * 0.42) - 30, 20, BLUE, fade(t, 0.2), "c", kind="mono6", tracking=0.15)
    p = c + np.array([cam.r(300), cam.r(-120)])
    tt = ctx.w("target")
    img = hud.callout(L, img, p, "BLACK HOLE: 60 KM WIDE", "far smaller than one pixel at this scale", fade(t, tt), prog(t, tt), dx=-120, dy=-200, color=ACC, size=22)
    img = text(img, "THE LEAST LIKELY ENDING", W / 2, H - 120, 24, WHITE, fade(t, ctx.w("least")), "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.5)


# ── f2 ────────────────────────────────────────────────────────────────────────────────
def ecc_over(ctx, img, t, u):
    tc, to = ctx.w("circle"), ctx.w("oval")
    img = text(img, "TODAY: ALMOST A PERFECT CIRCLE", 140, 140, 22, BLUE, fade(t, tc, to), "lc", kind="mono6", tracking=0.2)
    img = text(img, "AFTER: A LONG OVAL", 140, 140, 22, ACC, fade(t, to), "lc", kind="mono6", tracking=0.2)
    return img


def thermo_over(level0, level1, label, color, at=0.3, extra=None):
    def f(ctx, img, t, u):
        L = Layer()
        lv = lerp(level0, level1, prog(t, at, max(0.5, ctx.dur - at - 0.4)))
        img = hud.icon_thermo(L, img, (180, 520), 240, lv, color, fade(t, at), None)
        img = L.composite(img, 0.4)
        import textwrap  # wrap to ~12 chars so the label never runs into the planet
        for k, ln in enumerate(textwrap.wrap(label, 12)):
            img = text(img, ln, 90, 840 + 40 * k, 26, color, fade(t, at), "lc", kind="mono6", tracking=0.15)
        if extra:
            img = text(img, extra, 180, 900, 18, DIM, fade(t, at + 0.4), "lc")
        return img
    return f


def lucky_over(ctx, img, t, u):
    return text(img, "THE \"LUCKY\" ENDING", W / 2, H - 120, 28, WHITE, fade(t, 0.2), "c", kind="mono6", tracking=0.3)


# ── f3 ────────────────────────────────────────────────────────────────────────────────
def escape_over(ctx, img, t, u):
    s = ctx.state["shot"]
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    tA, tB = s.p["t"]
    ty = lerp(tA, tB, smoother(min(u, 1)))
    L = Layer()
    tt = np.linspace(-0.05, ty, 120)
    pts = np.array([s.last_scr(sim.planet(2, x) - sim.sun(x) + sim.sun(ty)) for x in tt])
    L.polyline(pts, (0.6, 0.85, 1.0), 1.0, 5)
    img = L.composite(img, 0.6)
    q = pts[-1]
    img = text(img, "EARTH · ESCAPING", q[0] + 24, q[1] - 24, 22, WHITE, fade(t, 0.3), "lc", kind="mono6", tracking=0.2)
    return img


def leave_speed_over(ctx, img, t, u):
    sim = __import__("engine.shots_diagram", fromlist=["S"]).S()
    tt = sim.t[-1]
    v = np.linalg.norm(sim.planet_v(2, tt) - sim.sun_v(tt)) * 4.74
    img = text(img, "SPEED AWAY FROM THE SUN", 140, 140, 18, DIM, fade(t, 0.3), "lc", tracking=0.25)
    img = text(img, f"≈ {v:.0f} KM/S", 140, 200, 50, ACC, fade(t, 0.3), "lc", kind="xlight", tracking=0.02)
    return img


def freeze_dyn(ctx, s, t, u):
    s.p["freeze"] = (0.0, 1.0)


def cities_over(ctx, img, t, u):
    return text(img, "CITY LIGHTS GOING OUT", W / 2, H - 120, 24, WHITE, fade(t, ctx.w("lights")), "c", kind="mono6", tracking=0.3)


def ice_thermo_over(ctx, img, t, u):
    L = Layer()
    v = hud.counter(-60, -200, prog(t, 0.2, ctx.dur - 0.4), "{:.0f}")
    lv = lerp(0.35, 0.05, prog(t, 0.2, ctx.dur - 0.4))
    img = hud.icon_thermo(L, img, (180, 560), 260, lv, BLUE, fade(t, 0.2), f"{v} °C")
    img = L.composite(img, 0.4)
    img = text(img, "COLDEST EVER RECORDED", 90, H - 170, 18, WHITE, fade(t, 0.5), "lc", tracking=0.15)
    img = text(img, "ON EARTH: −89 °C", 90, H - 138, 18, WHITE, fade(t, 0.5), "lc", tracking=0.15)
    return img


def airsnow_over(ctx, img, t, u):
    L = Layer()
    img = hud.icon_thermo(L, img, (180, 560), 260, 0.03, BLUE, fade(t, 0.1), "−200 °C")
    img = L.composite(img, 0.4)
    img = text(img, "THE AIR ITSELF CONDENSES", W / 2, 140, 26, WHITE, fade(t, 0.3), "c", kind="mono6", tracking=0.3)
    img = text(img, "NITROGEN + OXYGEN SNOW", W / 2, 190, 20, BLUE, fade(t, ctx.w("snow", default=1.6)), "c", kind="mono6", tracking=0.3)
    return img


def descent_scene(d0, d1):
    def f(ctx, t, u, fi):
        return ice_column(lerp(d0, d1, smoother(u)), t), dict(exposure=1.7)
    return f


def descent_over(ctx, img, t, u):
    th = ctx.w("Heat")
    d0, d1 = ctx.state.get("dd", (0.15, 0.62))
    depth_km = max(0.0, (lerp(d0, d1, smoother(u)) * (5200 - 1080) + 540 - 600) / 2000 * 3)
    img = text(img, f"DEPTH {depth_km:4.1f} KM", W - 140, 140, 26, WHITE, fade(t, 0.2), "rc", kind="mono6", tracking=0.15)
    img = text(img, "ICE · KILOMETRES THICK", 140, 140, 22, (0.7, 0.85, 1.0), fade(t, 0.3, th + 0.5), "lc", kind="mono6", tracking=0.2)
    img = text(img, "LIQUID OCEAN BELOW", 140, H - 140, 22, BLUE, fade(t, ctx.w("ocean")), "lc", kind="mono6", tracking=0.2)
    L = Layer()
    for k in range(5):
        x = 360 + k * 300
        L.arrow((x, H - 40), (x, H - 40 - 160 * prog(t, th + k * 0.1)), color=ACC, th=4, alpha=fade(t, th))
    img = L.composite(img, 0.5)
    img = text(img, "HEAT FROM EARTH'S CORE", W / 2, H - 230, 22, ACC, fade(t, th + 0.4), "c", kind="mono6", tracking=0.25)
    return img


def vent_over(ctx, img, t, u):
    L = Layer()
    img = hud.callout(L, img, (880, 330), "HYDROTHERMAL VENT", "~400 °C water from the sea floor", fade(t, ctx.w("vents")), prog(t, ctx.w("vents")), dx=220, dy=-90, color=ACC, size=22)
    img = hud.callout(L, img, (700, 960), "TUBE WORMS", "life with no sunlight", fade(t, ctx.w("creatures")), prog(t, ctx.w("creatures")), dx=-200, dy=-160, color=WHITE, size=22)
    return L.composite(img, 0.5)


def drift_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.6, 0.8), canvas=(4300, 1700))
    img = cam.stars(gain=0.95)
    x, y = cam.p(lerp(820, 1160, u), 560)
    render_planet(img, x, y, cam.r(150), "earth", spin=2.0 + t * 0.02, tilt=0.4, light=(-0.95, 0.15, 0.2), ice=1.0, lights_fade=0.0,
                  exposure=0.12, night=0.0)
    return img


def drift_over(ctx, img, t, u):
    return text(img, "BILLIONS OF YEARS", W / 2, H - 120, 26, WHITE, fade(t, ctx.w("billions")), "c", kind="mono6", tracking=0.3)


def rogues_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.1), pan=(-80, 0), canvas=(3300, 1500))
    img = cam.stars(gain=0.9)
    for k, (x, y, r, sp) in enumerate([(380, 360, 90, 30), (1300, 700, 150, 18), (1650, 260, 50, 40), (820, 820, 60, 25)]):
        X, Y = cam.p(x + sp * t, y - sp * 0.3 * t)
        render_planet(img, X, Y, cam.r(r), ["neptune", "earth", "mars", "uranus"][k], spin=k + t * 0.02, tilt=0.3, light=(-0.9, 0.2, 0.3),
                      exposure=0.06, night=0.0, ice=1.0 if k == 1 else 0.0)
    return img


# ── end ───────────────────────────────────────────────────────────────────────────────
def bh_count_over(ctx, img, t, u):
    th, tf = ctx.w("hundred"), ctx.w("few")
    a = fade(t, th)
    img = hud.panel(img, 1260, 700, 1820, 960, a, 0.6)
    v = hud.counter(0, 100_000_000, prog(t, th, 1.2))
    img = text(img, "BLACK HOLES IN OUR GALAXY", 1300, 740, 16, DIM, a, "lc", tracking=0.2)
    img = text(img, f"≈ {v}", 1300, 800, 44, (0.75, 0.6, 1.0), a, "lc", kind="xlight", tracking=0.02)
    img = text(img, "FOUND SO FAR: A FEW DOZEN", 1300, 880, 22, ACC, fade(t, tf), "lc", kind="mono6", tracking=0.15)
    return img


def nearest_over(ctx, img, t, u):
    tn = ctx.w("isn't")
    img = text(img, "NOT HEADED OUR WAY", W / 2, 150, 28, GREEN, fade(t, tn), "c", kind="mono6", tracking=0.3)
    return img


def wait_over(ctx, img, t, u):
    a = fade(t, 0.1)
    img = hud.panel(img, 260, 380, 1660, 720, a, 0.7)
    img = text(img, "TYPICAL WAIT FOR A PASS THIS CLOSE", W / 2, 440, 20, DIM, a, "c", tracking=0.25)
    s = "100,000,000,000,000,000"
    img = text(img, typed(s, prog(t, 0.3, 2.5)), W / 2, 540, 80, WHITE, a, "c", kind="xlight", tracking=0.02, glow=0.2)
    img = text(img, "YEARS", W / 2, 640, 30, ACC, fade(t, 2.0), "c", kind="mono6", tracking=0.4)
    return img


def universe_bar_scale(ctx, t):
    return lerp(1.5e10, 1e17, ease_in(span(t, 0.4, 2.4), 3))


def wink_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.15))
    img, _ = space_frame(3900, 2100, 2.6 * cam.z, angle=6)
    img *= 0.75
    sx, sy = W / 2, H / 2
    k = smooth(span(t, 0.1, 0.7)) * (1 - smooth(span(t, 0.7, 1.2)))
    glow_dot(img, sx, sy, (0.95, 0.97, 1.0), 1.6, 1.5 + 5 * k)
    img = lens_image(img, lerp(sx - 140, sx + 140, clamp(t / 1.2)), sy + 10, 40 * k, shadow=0.0)
    return scope_view(img) * (1 - smooth(span(t, 0.9, ctx.dur)))


def lc_inset(ctx, img, t, u):
    L = Layer()
    tf = ctx.w("front")
    al = smoother(span(t, 0.0, tf + 0.6))
    img = hud.panel(img, 1290, 80, 1830, 330, fade(t, 0.3), 0.6)
    xs = np.linspace(0, 1, 120)
    ys = 0.1 + 0.85 * np.exp(-((xs - 0.75) / 0.07) ** 2)
    img = hud.chart(L, img, 1330, 150, 460, 140, xs, ys, al * 0.95, ACC, fade(t, 0.3), "TIME", "BRIGHTNESS SEEN FROM EARTH")
    img = text(img, "THE STAR FLARES", W / 2, H - 120, 26, ACC, fade(t, ctx.w("flares")), "c", kind="mono6", tracking=0.3)
    return L.composite(img, 0.5)


def search_over(ctx, img, t, u):
    L = Layer()
    x = 960 + 260 * np.sin(t * 1.3)
    y = 540 + 150 * np.sin(t * 0.9 + 1)
    L.circle((x, y), 46, ACC, 0.9, th=2)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        L.line((x + dx * 56, y + dy * 56), (x + dx * 80, y + dy * 80), color=ACC, alpha=0.9, th=2)
    img = L.composite(img, 0.6)
    img = text(img, "SEARCHING…" if int(t * 2) % 2 == 0 else "SEARCHING", x + 100, y - 60, 20, ACC, 0.9, "lc", kind="mono6", tracking=0.2)
    img = text(img, "NOTHING TO SEE", W / 2, H - 120, 24, DIM, fade(t, 1.2), "c", kind="mono6", tracking=0.3)
    return img


# ═══════════════════════════════════ THE BEAT SHEET ═══════════════════════════════════
DS = dark_space

BEATS = {
    "open1": [
        B(0, night_flare(0, "ordinary", length=3.2, set="observatory", push=0.07), o1_over, name="observatory in Chile, one star brightening"),
        B(1, scope_scene(flares=o1b_flares), o1b_over, covers=[1, 2], name="telescope view: not exploding, not burning, just brighter"),
    ],
    "open2": [
        B(0, scope_scene(flares=o2_flares), o2_over_a, cut=True, name="next star flares weeks later + light curve"),
        B(1, scope_scene(flares=o2b_flares), o2_over_b, cut=True, name="then the next one"),
        B(2, scope_scene(flares=o2c_flares, lens_path=((640, 680), (1320, 300))), o2_over_c, name="invisible thing moving, stars light up as it passes"),
    ],
    "open3": [
        B(0, o3a_scene, o3a_over, name="not a planet (crossed), not a comet (crossed), no light"),
        B(1, shot("lens", zoom=(1.0, 1.45), drift=(0.04, 0.0), mass=(0.7, 1.0)), tag("A BLACK HOLE", at="black"), cut=True, name="black hole reveal push-in"),
        B(2, o3c_scene, o3c_over, name="ten Suns appear and are crushed together"),
        B(2, o3d_scene, o3d_over, at="sixty", name="60 km ball over a city for scale (lenses city lights)"),
    ],
    "open4": [
        B(0, shot("system", view="far", t=(-32.0, -31.0), scale=(420, 330), label_bh=True), o4a_over, name="trajectory heading for the Solar System"),
        B(1, timeline_scene(), timeline_overlay(), name="30-year timeline of the story"),
        B(2, timeline_scene(-10), timeline_overlay(show_branches="words", from_t=-10), cut=True, name="three possible endings branch off"),
        B(3, timeline_scene(-10), timeline_overlay(show_branches=True, highlight="likely", from_t=-10), cut=True, name="the most likely one highlighted"),
    ],
    "title": [B(0, shot("lens", zoom=(1.6, 1.75), drift=(0.02, 0.0), mass=(1.15, 1.2), dim=0.35), None, name="title")],
    "c1a": [
        B(0, scope_scene(sweep=True, flares=lambda c, t: [0.05] * 4), search_over, name="telescope searching an empty sky"),
        B(1, lambda c, t, u, f: ray_scene(c, t, u, f), ray_overlay("straight"), name="side view: star light travels straight to Earth; black hole invisible"),
        B(2, lambda c, t, u, f: ray_scene(c, t, u, f), ray_overlay("bend"), cut=True, name="its gravity bends the rays like a lens made of nothing"),
        B(3, lambda c, t, u, f: (c.state.__setitem__("slide", True), ray_scene(c, t, u, f))[1], over_all(ray_overlay("focus"), lc_inset),
          cut=True, name="lined up: light focused toward Earth → the star flares"),
    ],
    "c1b": [
        B(0, shot("galaxy", focus="none", zoom=(1.0, 1.05)), paper_over, name="real 2022 discovery (citation)"),
        B(1, shot("galaxy", focus="ogle", zoom=(1.0, 2.2)), tag("OGLE-2011-BLG-0462", "a black hole drifting alone · confirmed 2022", at="confirmed"), name="where it is in the galaxy"),
        B(2, shot("galaxy", focus="ogle", zoom=(2.2, 2.3)), ogle_curve_over, name="real-event light curve: brightened for months, cause invisible"),
        B(3, shot("galaxy", focus="ogle", zoom=(2.3, 2.5)), gal_dist_over, name="5,000 light-years away, 45 km/s explained"),
    ],
    "c1c": [
        B(0, shot("system", view="far", t=(-30.6, -30.2), scale=(380, 340), label_bh=True), c1c_over_dist, name="ours: same speed, 300× Earth–Sun distance"),
        B(1, DS(gain=0.4), maths_over, name="the maths: 300 AU ÷ 45 km/s"),
        B(2, DS(gain=0.4), countdown_over, cut=True, name="≈ 30 years countdown"),
        B(3, DS(gain=0.35), news_over, name="path pinned down in weeks → news on a Tuesday"),
    ],
    "c1d": [
        B(0, shot("system", view="outer", t=(-31.0, -30.0), scale=(70, 62)), tag("THE SIMULATION", "everything from here on is computed", at=0.3), name="intro to the simulation"),
        B(1, shot("system", view="outer", t=(-29.5, -28.0), scale=(60, 50)), simparam_over, name="a real gravity simulation"),
        B(1, shot("system", view="outer", t=(-28.0, -26.5), scale=(36, 30)), simparam_over, at="Ten", name="simulation inputs typed in as they're said"),
        B(2, shot("system", view="inner", t=(-2.5, 1.5), scale=(40, 9)), ff_over, name="fast-forward: what the maths decides"),
    ],
    "w1": [
        B(0, shot("earth", zoom=(1.0, 1.06), night=1.0, nightside=True), None, name="Earth at night — what would we do?"),
        B(1, rockets_scene, rockets_over, name="every rocket ever built pushing a black hole: Δv ≈ 0"),
        B(2, earth_push_scene, earth_push_over, name="can't move Earth either"),
        B(3, shot("system", view="inner", t=(-0.25, -0.2), scale=(3.0, 2.8)), nowhere_over, name="Mars, the Moon — all in the same path"),
    ],
    "w2": [
        B(0, dig_scene, tag("DIG", at="Dig"), name="cross-section: the digging starts"),
        B(1, shelter_scene, shelter_over, name="shelters, sealed, nuclear, geothermal, seed vaults, libraries, 30 years"),
        B(2, night(set="garden", figure="scope", push=0.03), years_over, name="ordinary years roll by"),
    ],
    "c2a": [
        B(0, night(set="ridge", figure="scope", trails=True, push=0.0), trails_over, name="star-trail time-lapse: years pass, nothing happens"),
        B(1, night(set="ridge", figure="scope", seasons=True, push=0.02), seasons_over, name="seasons come and go"),
        B(2, shot("system", view="outer", t=(-3.0, -2.4), scale=(48, 40)), sys_highlight_over(7, "NEPTUNE'S ORBIT", at=0.3), name="black hole reaches Neptune's orbit"),
    ],
    "c2b": [
        B(0, shot("planet", body="neptune", lens=False, pull=False, path=((1.4, -0.2), (1.3, -0.2)), zoom=(1.0, 1.06)), tag("NEPTUNE", at=0.3), name="Neptune"),
        B(1, nep_orbit_scene, nep_orbit_over, name="same orbit for billions of years: 27 million laps"),
        B(2, shot("planet", body="neptune", lens=True, pull=False, path=((1.25, -0.2), (0.85, -0.05)), zoom=(1.06, 1.12)), pull_arrow_over, name="something 10× the Sun pulling from the dark"),
        B(3, shot("system", view="outer", t=(-2.5, -1.7), scale=(42, 46)), nep_break_over, name="orbit stretches, then breaks (simulated)"),
        B(4, neptune_leave_scene, tag("THROWN OUT", "of the Solar System", at=0.3), name="Neptune thrown out"),
        B(4, night(set="garden", figure="scope", push=0.03), calm_earth_over, at="nobody", name="Earth: nobody feels a thing"),
    ],
    "c2c": [
        B(0, icy_scene, tag("KUIPER BELT", "billions of icy bodies beyond Neptune", at=0.4), name="icy bodies scattered like gravel"),
        B(1, shot("system", view="outer", t=(-2.3, -1.6), scale=(48, 44), scatter=True), kbo_arrows_over, name="some flung out, some aimed inward (decades away)"),
        B(2, shot("system", view="outer", t=(-1.6, -1.3), scale=(44, 30)), tag("THE REAL PROBLEM", "keeps coming", at=0.2), name="least of our problems — the hole keeps coming"),
    ],
    "c3s": [
        B(0, shot("system", view="mid", t=(-0.72, -0.56), scale=(16, 14)), sys_highlight_over(5, "SATURN'S ORBIT", at=0.3), name="crosses Saturn's orbit"),
        B(1, shot("planet", body="saturn", lens=True, path=((1.2, 0.25), (0.75, 0.0)), zoom=(1.0, 1.08)), tag("SATURN'S RINGS", "survive", at="survive"), name="Saturn's rings survive"),
        B(2, saturn_scene(z=(1.0, 0.055), drift=0.0), saturn_grip_over, name="rings sit deep inside Saturn's gravity bubble; carried off rings and all"),
    ],
    "c3a": [
        B(0, shot("planet", body="jupiter", lens=True, path=((1.3, 0.15), (0.8, 0.05)), zoom=(1.05, 1.12)), tag("JUPITER", "T – 3 months", at=0.3), name="it reaches Jupiter"),
        B(1, shot("planet", body="jupiter", lens=True, path=((0.8, 0.05), (0.62, 0.02)), zoom=(1.12, 1.15)),
          bars_overlay([("EARTH · 1", 1, BLUE, 0.2), ("JUPITER · 318 EARTHS", 318, (1.0, 0.85, 0.6), 0.5), ("BLACK HOLE · 3,300,000 EARTHS", 3_330_000, ACC, "doesn't")], scale_fn=jup_bars_scale, y0=330, x0=300, w=1320),
          name="mass bars: Jupiter 318 Earths vs black hole 3.3 million"),
        B(2, jupiter_moons_scene, jupiter_moons_overlay, name="keeps Io & Europa; Ganymede pulled away"),
    ],
    "c3b": [
        B(0, night(set="garden", figure="scope", push=0.04), tag("YOUR BACK GARDEN", at=0.4), name="your back garden"),
        B(1, night(set="garden", figure="scope", push=0.02, dim=0.15), jup_wander_over, name="Jupiter wandering off its normal path"),
        B(2, binoc_scene(), binoc_over_a, name="through binoculars"),
        B(3, binoc_scene(zoom=3.8, crawl=(120, -40)), binoc_over_b, cut=True, name="a tiny ring of smeared stars; Moon for scale; crawling through constellations"),
    ],
    "c4a": [
        B(0, force_scene, force_overlay("distance"), name="distances: Sun 1 AU, black hole 2.3 AU"),
        B(1, force_scene, force_overlay("force"), cut=True, name="10× mass ÷ 2.3² → pulls 1.9× harder than the Sun"),
        B(2, shot("earth", lens=(0.92, 0.5), lens_r=(0.03, 0.045), zoom=(1.0, 1.05), night=0.6), tug_over, name="tug of war, the Sun losing"),
    ],
    "c4b": [
        B(0, shot("tide", rise=(0.0, 0.0), _dyn=tide_dyn([("", 0.3)])), tag("THE SEA", at=0.3), name="calm sea"),
        B(1, bulge_scene, bulge_overlay, name="tidal bulge from the Moon → from the black hole"),
        B(2, shot("tide", _dyn=tide_dyn([("", 0.4), ("metre", 1.0), ("five", 5.0)])), None, name="a metre higher, then five"),
        B(3, shot("tide", _dyn=tide_dyn([("", 5.0), ("days", 38.0)])), None, name="dozens of metres, twice a day"),
        B(3, coast_scene, coast_over, at="every", name="every coastline on Earth"),
    ],
    "c4c": [
        B(0, sun_scene(transit=(0.0, 0.35)), align_over, name="black hole slides in front of the Sun (alignment diagram)"),
        B(1, sun_scene(z=(1.0, 1.25), focus=(0, 0), transit=(0.3, 0.85), glasses=True), warped_over, name="through eclipse glasses: tiny warped circle"),
        B(2, sun_scene(z=(2.4, 2.8), focus=(0, 0), transit=(0.6, 0.62)), bend_sun_over, name="sunlight bent around nothing"),
    ],
    "c4d": [
        B(0, shot("system", view="inner", t=(-0.05, -0.012), scale=(3.4, 2.7)), None, name="closest pass approaching"),
        B(1, shot("system", view="inner", t=(-0.012, 0.012), scale=(2.7, 2.5)), speed_over, name="over in days, >100 km/s"),
        B(2, shot("system", view="inner", t=(0.012, 0.05), scale=(2.5, 3.2)), orbit_taken_over, name="takes Earth's orbit with it"),
    ],
    "c4e": [
        B(0, shot("moon", drift=(0.0, 0.12)), tag("THE MOON", at=0.2), name="the Moon"),
        B(1, shot("moon", drift=(0.12, 0.25)), grip_over, cut=True, name="Earth's gravitational grip shrinks inside the Moon's orbit"),
        B(2, shot("moon", drift=(0.25, 1.0)), tag("GONE", "after 4.5 billion years", at="drifts"), cut=True, name="the Moon drifts away for good"),
    ],
    "c4f": [
        B(0, shot("system", view="inner", t=(0.0, 0.15), scale=(3.6, 4.2), follow="bh"), tag("THE BLACK HOLE", "leaves the Solar System", at=0.3), name="the black hole leaves"),
        B(1, venus_scene, venus_over, name="Venus captured, orbiting the black hole"),
        B(2, DS(lens_xy=(980, 420), lens_r=50, gain=0.45), fan_over, name="three possible paths for Earth"),
        B(3, timeline_scene(-10), timeline_overlay(show_branches=True, from_t=-10), name="three endings"),
    ],
    "f1a": [
        B(0, shot("spaghetti", phase=(0.0, 0.1)), None, name="ending 1: Earth falls in"),
        B(1, DS(lens_xy=(1160, 540), lens_r=70, gain=0.45), spiral_over, name="not straight in — it spirals"),
        B(2, stretch_scene, stretch_over, name="near side pulled harder than far side, a million km out"),
        B(2, shot("spaghetti", phase=(0.14, 0.3)), tag("TORN APART", at=0.2), at="comes", name="the planet comes apart"),
    ],
    "f1b": [
        B(0, cutaway_scene, cutaway_over, name="oceans, crust, mantle, iron core"),
        B(1, shot("spaghetti", phase=(0.42, 0.78)), tag("A STREAM", "wrapping around the hole", at="stream"), name="unwound into a stream around the hole"),
        B(2, shot("spaghetti", phase=(0.78, 0.94)), heat_over, name="heats to millions of degrees"),
        B(3, shot("spaghetti", phase=(0.94, 1.0)), None, post_kw=dict(exposure=1.9, bloom=0.9), name="Earth's last light"),
        B(4, target_scene, target_over, name="a tiny target → least likely"),
    ],
    "f2a": [
        B(0, shot("orbit", ecc=(0.0, 0.0)), tag("EARTH STAYS", "but its path changes", at=0.3), name="Earth stays with the Sun"),
        B(1, shot("orbit", ecc=(0.0, 0.62)), ecc_over, name="circle stretched into an oval"),
    ],
    "f2b": [
        B(0, shot("earth", zoom=(1.05, 1.12), scorch=1.0), thermo_over(0.6, 0.95, "SCORCHING", RED), post_kw=dict(exposure=1.7),
          name="summer close in: seas steam, scalding sky"),
        B(1, shot("earth", zoom=(1.12, 1.15), freeze=(0.75, 0.9)), thermo_over(0.4, 0.05, "COLDER THAN ANTARCTICA", BLUE), name="far end: winter everywhere"),
        B(2, lambda c, t, u, f: (cross_section(t, dig=1.0, shelters=1.0, lights=1.0), dict(exposure=1.6)), tag("UNDERGROUND", "some survive, for a while", at=0.3), name="survivors underground"),
        B(3, shot("orbit", ecc=(0.62, 0.62)), lucky_over, name="the lucky ending"),
    ],
    "f3a": [
        B(0, timeline_scene(-10), timeline_overlay(show_branches=True, highlight=0.0, from_t=-10), name="ending 3 = most likely"),
        B(1, shot("system", view="inner", t=(0.02, 0.6), scale=(3.0, 9.0)), escape_over, name="Earth thrown out of the Solar System (simulated)"),
        B(2, shot("leave", t=(0.0, 0.25)), leave_speed_over, name="leaving the Sun at tens of km/s"),
        B(3, shot("leave", t=(0.25, 1.0)), None, name="sunlight falls to 1/50, then a star"),
    ],
    "f3b": [
        B(0, shot("earth", freeze=(0.2, 0.8), zoom=(1.0, 1.06), dark=True, nightside=True, _dyn=lambda c, s, t, u: s.p.update(lights_cut=smooth(span(t, c.w("lights"), c.dur)))), cities_over,
          name="oceans freeze; city lights go out one by one"),
        B(1, shot("earth", freeze=(0.8, 1.0), zoom=(1.06, 1.1), dark=True), ice_thermo_over, name="centuries later: colder than ever recorded"),
    ],
    "f3c": [
        B(0, shot("ice", snow=(0.0, 0.3)), airsnow_over, name="the air itself freezes"),
        B(1, shot("ice", snow=(0.4, 1.0)), airsnow_over, cut=True, name="and falls as snow"),
    ],
    "f3d": [
        B(0, descent_scene(0.0, 0.15), None, name="and yet — diving through the ice"),
        B(1, descent_scene(0.15, 0.62), descent_over, name="under km of ice: liquid ocean, heat from the core"),
        B(2, shot("vent"), vent_over, name="vents, creatures with no sunlight"),
        B(3, drift_scene, drift_over, name="the frozen planet drifting for billions of years"),
    ],
    "f3e": [
        B(0, rogues_scene, tag("ROGUE PLANETS", "worlds with no star", at=0.3), name="planets like that might not be rare"),
        B(1, shot("galaxy", focus="rogues", zoom=(2.0, 1.0)),
          bars_overlay([("STARS IN THE MILKY WAY", 1.0, (1.0, 0.9, 0.7), 0.3), ("LONE PLANETS (ESTIMATE)", 1.6, (0.6, 0.85, 1.0), "more")], y0=760, x0=360, w=1200),
          name="more lone planets than stars"),
    ],
    "end1": [
        B(0, night(set="ridge", figure="scope", push=0.03), None, name="should you worry?"),
        B(1, shot("galaxy", focus="blackholes", zoom=(1.0, 1.15)), bh_count_over, name="100 million black holes; a few dozen found"),
        B(2, shot("galaxy", focus="gaia", zoom=(1.3, 2.4)), over_all(tag("GAIA BH1", "nearest known · ~1,560 light-years", at=0.4), nearest_over), name="nearest: Gaia BH1, not coming here"),
    ],
    "end2": [
        B(0, shot("lens", zoom=(1.2, 1.1), drift=(0.05, 0.0), mass=(0.8, 0.8), dim=0.3), wait_over, name="10^17 years"),
        B(1, DS(gain=0.4), bars_overlay([("AGE OF THE UNIVERSE · 13.8 BILLION YEARS", 1.38e10, BLUE, 0.1), ("TYPICAL WAIT · 100 QUADRILLION YEARS", 1e17, ACC, 0.6)], scale_fn=universe_bar_scale, y0=480),
          name="universe's age is a sliver of the wait"),
    ],
    "end3": [
        B(0, night_flare(0, start=1.4, length=3.0, set="ridge", figure="scope", push=0.06), None, name="tonight a star looks brighter"),
        B(1, night(set="ridge", figure="scope", push=0.02, show_stars=[0]), None, cut=True, name="almost certainly nothing"),
        B(2, wink_scene, None, cut=True, name="almost… (a faint lens wink)"),
    ],
    "outro": [B(0, night(set="ridge", figure="scope", push=0.02, dim=0.55), None, name="outro / end screen")],
}
