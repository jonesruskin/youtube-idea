"""Reusable scene + overlay builders for the black-hole episode's beat sheet."""
import numpy as np
import cv2
from engine.core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                         fast_blur, grid, hex2rgb, splat_points)
from engine.space import space_frame, lens_image
from engine.planet import render_planet, render_sun_disk, render_rings, coast_mask
from engine.scenes2 import Cam, scope_view, city_aerial, cross_section, earth_cutaway, ice_column, icy_bodies
from engine import hud
from engine.hud import Layer, text, fade, prog, WHITE, ACC, BLUE, RED, GREEN, DIM
from engine import sim as simmod
from engine.beats import scene_factory


SHOT_VECTORS = ["lens", "lens_xy", "pan", "crawl", "canvas", "light", "focus"]


@scene_factory(vectors=SHOT_VECTORS, keys=["typ", "set", "time", "body"])
def shot(typ, **p):
    """Scene from an existing shot class; instance cached per beat. Parameters are re-read every frame (they glide
    between beats of one continuous shot); `_ur` is the progress through the whole shot, for camera drift."""
    def f(ctx, t, u, fi):
        from engine.render import SHOTS
        if "shot" not in ctx.state:
            ctx.state["shot"] = SHOTS[typ](dict(p), ctx.dur, ctx.seg["start"] + ctx.beat.t0)
        s = ctx.state["shot"]
        s.p = dict(p, _ur=ctx.ru(t))
        dyn = p.get("_dyn")
        if dyn:
            dyn(ctx, s, t, u)
        img = s.render(min(u, 1.0), ctx.seg["start"] + ctx.beat.t0 + t, fi)
        return img, s.post_kw()
    return f


def night(**p):
    return shot("night", **p)


def over_all(*fns):
    def f(ctx, img, t, u):
        for fn in fns:
            img = fn(ctx, img, t, u)
        return img
    return f


def tag(label, sub=None, at=0.3, x=140, y=None, color=ACC):
    """Lower-left caption."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, ctx.dur - 0.05, 0.4)
        yy = H - 150 if y is None else y
        L = Layer()
        L.line((x, yy - 34), (x + 70 * prog(t, tt), yy - 34), color=color, alpha=a, th=2)
        img = L.composite(img, 0.3)
        img = text(img, label, x, yy, 30, WHITE, a, "lc", kind="mono6", tracking=0.14)
        if sub:
            img = text(img, sub, x, yy + 40, 21, DIM, a, "lc")
        return img
    return f


def big_label(s, at, y=H - 210, size=88, color=WHITE, sub=None, until=None):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, until if until else ctx.dur, 0.45)
        if a <= 0:
            return img
        img = hud.panel(img, W / 2 - 520, y - 70, W / 2 + 520, y + (70 if not sub else 110), a, 0.45)
        img = text(img, s, W / 2, y, size, color, a, "c", kind="xlight", tracking=0.04, glow=0.2)
        if sub:
            img = text(img, sub, W / 2, y + 74, 22, ACC, a, "c", tracking=0.4)
        return img
    return f


# ───────────── telescope view with flaring stars ─────────────
STARS_SCOPE = [(760, 600), (905, 520), (1050, 440), (1195, 360)]


@scene_factory(keys=[])
def scope_scene(zoom=2.4, flares=lambda ctx, t: [], lens_path=None, sweep=False):
    def f(ctx, t, u, fi):
        cam = Cam(ctx.ru(t), z=(1.0, 1.06), pan=(-40, 10) if not sweep else (-900, 120))
        img, _ = space_frame(3900 - cam.px / zoom, 2100 - cam.py / zoom, zoom * cam.z, angle=6)
        img *= 0.75
        lenses = []
        for k, (x, y) in enumerate(STARS_SCOPE):
            b = flares(ctx, t)[k] if k < len(flares(ctx, t)) else 0.0
            sx, sy = cam.p(x, y)
            glow_dot(img, sx, sy, (0.95, 0.97, 1.0), 1.6, 1.2 + 12 * b)
            glow_dot(img, sx, sy, (0.7, 0.82, 1.0), 9, 0.5 * b)
            if b > 0.05:
                star_spikes(img, sx, sy, (0.9, 0.94, 1.0), 50 + 90 * b, 0.4 * b, angle=10)
        if lens_path is not None:
            p0, p1 = lens_path
            k = lens_path_k(ctx, t)
            lx, ly = lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)
            lx, ly = cam.p(lx, ly)
            img = lens_image(img, lx, ly, 46, shadow=0.0)
        return scope_view(img), dict(exposure=1.5)
    return f


def lens_path_k(ctx, t):
    return clamp(t / max(1, ctx.dur))


def lightcurve(L, img, x0, y0, w, h, bumps, p, color=ACC, alpha=1.0, xlabel="TIME", ylabel="BRIGHTNESS"):
    xs = np.linspace(0, 1, 160)
    ys = np.full_like(xs, 0.12)
    for c, a, wd in bumps:
        ys = ys + a * (1 / np.sqrt(((xs - c) / wd) ** 2 + 1) - 0.0) * np.exp(-((xs - c) / (wd * 4)) ** 2)
    ys = np.clip(ys, 0, 1)
    return hud.chart(L, img, x0, y0, w, h, xs, ys, p, color, alpha, xlabel, ylabel)


# ───────────── side-view ray diagram ─────────────
def ray_scene(ctx, t, u, fi, bh_y=540.0, lens_on=True):
    flare = 0.0
    if ctx.state.get("slide"):
        # the hole is already in line (same shot as the beat before); Earth's flare builds as the narration says "front"
        tf = ctx.w("front")
        flare = smoother(span(t, 0.0, tf + 0.6))
    ctx.state["bh_y"] = bh_y
    gt = ctx.seg["start"] + ctx.beat.t0 + t
    cam = Cam(ctx.ru(t), z=(1.0, 1.04), pan=(0, 0), canvas=(1600, 2600))
    img = cam.stars(lenses=[(cam.p(960, bh_y)[0], cam.p(960, bh_y)[1], 70)] if lens_on else [], gain=0.55)
    sx, sy = cam.p(250, 540)
    al = flare
    glow_dot(img, sx, sy, (1.0, 0.95, 0.85), 5, 7)
    glow_dot(img, sx, sy, (1.0, 0.9, 0.7), 40, 0.25)
    if ctx.state.get("slide"):
        ex_, ey_ = cam.p(1680, 540)
        glow_dot(img, ex_, ey_, (1.0, 0.9, 0.7), 70, 0.9 * al ** 3)
    ex, ey = cam.p(1680, 540)
    render_planet(img, ex, ey, cam.r(38), "earth", spin=2.0 + gt * 0.1, tilt=0.4, light=(-0.9, 0.1, 0.4))
    return img


@scene_factory()
def ray(slide=0.0):
    """Side view of light rays passing the black hole. slide=1: the 'lined up' beat, where Earth's flare builds."""
    def f(ctx, t, u, fi):
        if slide > 0.5:
            ctx.state["slide"] = True
        return ray_scene(ctx, t, u, fi)
    return f


def ray_overlay(stage):
    """stage: 'straight' | 'bend' | 'focus'"""
    def f(ctx, img, t, u):
        cam = Cam(u, z=(1.0, 1.04), canvas=(1600, 2600))
        L = Layer()
        S = np.array(cam.p(250, 540))
        E = np.array(cam.p(1680, 540))
        BHy = ctx.state.get("bh_y", 540.0)
        B = np.array(cam.p(960, BHy))
        k_bend = 0.0 if stage == "straight" else smooth(span(t, ctx.w("bends") if stage == "bend" else 0, (ctx.w("bends") if stage == "bend" else 0) + 1.2))
        if stage == "focus":
            k_bend = 1 - clamp(abs(BHy - 540) / 260)
        n = 7
        a_in = fade(t, 0.2)
        for i in range(n):
            off = (i - (n - 1) / 2) * 34
            mid_y = B[1] + off
            p_mid = np.array([B[0], mid_y])
            straight_end = S + (p_mid - S) * (1700 - S[0]) / max(1, p_mid[0] - S[0])
            focus_end = E + np.array([0, off * 0.04])
            end = lerp(straight_end, focus_end, k_bend)
            # smooth bend through p_mid
            pts = [S]
            for s in np.linspace(0, 1, 30):
                q = S + (p_mid - S) * s
                pts.append(q)
            for s in np.linspace(0, 1, 30):
                q = p_mid + (end - p_mid) * s
                pts.append(q)
            pts = np.array(pts)
            col = ACC if abs(off) < 60 or k_bend < 0.5 else (1.0, 0.8, 0.55)
            L.polyline(pts, col, 0.55 * a_in, 2, progress=prog(t, 0.2 + i * 0.05, 1.4))
            # travelling photons
            ph = ((t * 0.45 + i * 0.13) % 1.0)
            idx = int(ph * (len(pts) - 1))
            L.circle(pts[idx], 4, (1.0, 0.95, 0.8), 0.9 * a_in, fill=True)
        L.circle(B, 18, (0.02, 0.02, 0.02), 1.0, fill=True)
        L.circle(B, 22, DIM, 0.6, th=1)
        img = L.composite(img, 0.6)
        img = text(img, "STAR", S[0], S[1] + 70, 20, DIM, a_in, "c")
        img = text(img, "EARTH", E[0], E[1] + 70, 20, DIM, a_in, "c")
        img = text(img, "BLACK HOLE", B[0], B[1] - 60, 20, ACC, a_in, "c", kind="mono6")
        return img
    return f


# ───────────── timeline + three endings ─────────────
TL_X0, TL_X1, TL_Y = 260, 1360, 470


def timeline_overlay(show_branches=False, highlight=None, from_t=0.2):
    marks = [("TODAY", 0.0), ("T–30 MONTHS", 0.46), ("T–7 MONTHS", 0.66), ("T–30 DAYS", 0.86)]
    def f(ctx, img, t, u):
        L = Layer()
        a = fade(t, 0.0, None, 0.4)
        p = prog(t, from_t, 1.6)
        L.line((TL_X0, TL_Y), (TL_X0 + (TL_X1 - TL_X0) * p, TL_Y), color=WHITE, alpha=0.8 * a, th=3)
        img2 = img
        # log-ish layout so the last months get room
        def x_of(f_):
            return TL_X0 + (TL_X1 - TL_X0) * f_
        for i, (lab, f_) in enumerate(marks):
            xm = x_of(f_)
            am = a * smooth(span(p, f_ * 0.95, f_ * 0.95 + 0.05)) if f_ > 0 else a
            L.line((xm, TL_Y - 14), (xm, TL_Y + 14), color=WHITE, alpha=am, th=2)
            img2 = text(img2, lab, xm, TL_Y + 48, 20, DIM, am, "c", kind="mono6", tracking=0.06)
        ax = TL_X1
        L.circle((ax, TL_Y), 10, ACC, a * smooth(span(p, 0.95, 1.0)), fill=True)
        img2 = text(img2, "CLOSEST PASS", ax, TL_Y + 92, 20, ACC, a * smooth(span(p, 0.95, 1.0)), "c", kind="mono6", tracking=0.06)
        img2 = text(img2, "THE NEXT 30 YEARS  ·  NOT TO SCALE", TL_X0, TL_Y - 130, 20, DIM, a, "lc", tracking=0.25)
        if show_branches:
            tb = ctx.w("three") if show_branches == "words" else -10.0
            ends = [(1700, 260), (1720, 470), (1700, 680)]
            names = ["?", "?", "?"]
            for k, (bx, by) in enumerate(ends):
                pb = prog(t, tb + k * 0.18, 0.9)
                hl = 1.0
                col = WHITE
                if highlight is not None:
                    th0 = ctx.w(highlight) if isinstance(highlight, str) else 0
                    hl = 1 - 0.75 * smooth(span(t, th0, th0 + 0.5)) if k != 2 else 1.0
                    col = ACC if k == 2 and t > th0 else WHITE
                pts = np.array([[ax, TL_Y], [ax + 120, TL_Y], [bx - 160, by], [bx, by]], float)
                xs = np.linspace(0, 1, 40)
                bez = ((1 - xs) ** 3)[:, None] * pts[0] + (3 * (1 - xs) ** 2 * xs)[:, None] * pts[1] + (3 * (1 - xs) * xs ** 2)[:, None] * pts[2] + (xs ** 3)[:, None] * pts[3]
                L.polyline(bez, col, a * hl, 3, progress=pb)
                L.circle((bx, by), 26, col, a * hl * smooth(span(pb, 0.8, 1)), th=2)
                img2 = text(img2, str(k + 1), bx, by, 24, col, a * hl * smooth(span(pb, 0.8, 1)), "c", kind="mono6")
            if highlight is not None:
                th0 = ctx.w(highlight) if isinstance(highlight, str) else 0
                img2 = text(img2, "MOST LIKELY", 1700, 740, 22, ACC, fade(t, th0 + 0.3), "c", kind="mono6", tracking=0.3)
        return L.composite(img2, 0.5)
    return f


@scene_factory(vectors=["lens_xy", "pan", "canvas"])
def dark_space(lens_xy=None, lens_r=60, gain=0.5, z=(1.0, 1.06), pan=(60, 0), canvas=(2600, 1500)):
    def f(ctx, t, u, fi):
        cam = Cam(u, z=z, pan=pan, canvas=canvas, pan_u=ctx.ru(t))
        lenses = []
        if lens_xy:
            lx, ly = cam.p(*lens_xy)
            lenses = [(lx, ly, cam.r(lens_r))]
        return cam.stars(lenses=lenses, gain=gain)
    return f


# ───────────── force line (Sun – Earth – black hole) ─────────────
FL_SUN, FL_EARTH, FL_BH = (330, 560), (700, 560), (1560, 560)


def force_scene(ctx, t, u, fi):
    gt = ctx.seg["start"] + ctx.beat.t0 + t
    cam = Cam(ctx.ru(t), z=(1.0, 1.03), canvas=(3400, 1500))
    bx, by = cam.p(*FL_BH)
    img = cam.stars(lenses=[(bx, by, cam.r(85))], gain=0.5)
    sx, sy = cam.p(*FL_SUN)
    glow_dot(img, sx, sy, (1.0, 0.9, 0.7), 18, 8)
    glow_dot(img, sx, sy, (1.0, 0.8, 0.5), 90, 0.45)
    ex, ey = cam.p(*FL_EARTH)
    render_planet(img, ex, ey, cam.r(40), "earth", spin=2.5 + gt * 0.1, tilt=0.4, light=(-0.95, 0.1, 0.3))
    return img


def force_overlay(stage):
    def f(ctx, img, t, u):
        cam = Cam(u, z=(1.0, 1.03), canvas=(3400, 1500))
        L = Layer()
        S, E, B = [np.array(cam.p(*q)) for q in (FL_SUN, FL_EARTH, FL_BH)]
        if stage == "distance":
            img = hud.dimension(L, img, S, E, "1 AU", fade(t, 0.4), prog(t, 0.4), WHITE, offset=-80)
            img = hud.dimension(L, img, E, B, "~2.3 AU", fade(t, ctx.w("twice")), prog(t, ctx.w("twice")), ACC, offset=-80)
        else:
            img = hud.dimension(L, img, S, E, "1 AU", 1.0, 1.0, WHITE, offset=-80)
            img = hud.dimension(L, img, E, B, "~2.3 AU", 1.0, 1.0, ACC, offset=-80)
            t0 = ctx.w("heavier")
            img = text(img, "×10 MASS", B[0], B[1] + 120, 26, ACC, fade(t, t0), "c", kind="mono6")
            t1 = ctx.w("pulling")
            L.arrow(E - [44, 0], E - [44 + 150 * prog(t, t1), 0], color=(1.0, 0.85, 0.5), th=5)
            L.arrow(E + [44, 0], E + [44 + 285 * prog(t, t1 + 0.4), 0], color=ACC, th=5)
            img = text(img, "SUN'S PULL: 1", E[0] - 130, E[1] - 62, 20, (1.0, 0.85, 0.5), fade(t, t1 + 0.3), "c", kind="mono6")
            img = text(img, "BLACK HOLE'S PULL: 1.9", E[0] + 200, E[1] + 66, 20, ACC, fade(t, t1 + 0.7), "c", kind="mono6")
            img = text(img, "10 ÷ 2.3²  ≈  1.9", W / 2, H - 170, 34, WHITE, fade(t, t1 + 1.2), "c", kind="light", tracking=0.04)
        return L.composite(img, 0.5)
    return f


# ───────────── binocular view ─────────────
@scene_factory(vectors=["crawl"])
def binoc_scene(zoom=3.4, lens_r=95, crawl=(0, 0)):
    def f(ctx, t, u, fi):
        ur = ctx.ru(t)
        cam = Cam(u, z=(1.0, 1.12), pan=crawl, pan_u=ur)
        bimg, _ = space_frame(2350 + 160 * ur, 1180, zoom * cam.z, angle=28, lenses=[(W * 0.52 + cam.px, H * 0.47 + cam.py, cam.r(lens_r))])
        xs, ys = grid()
        r1 = np.sqrt((xs - W * 0.37) ** 2 + (ys - H / 2) ** 2)
        r2 = np.sqrt((xs - W * 0.63) ** 2 + (ys - H / 2) ** 2)
        mask = clamp((470 - np.minimum(r1, r2)) / 18)
        return bimg * mask[..., None] * 1.15, dict(exposure=1.55)
    return f


# ───────────── Saturn with its gravity bubble ─────────────
@scene_factory()
def saturn_scene(z=(1.0, 0.42), drift=0.0):
    def f(ctx, t, u, fi):
        gt = ctx.seg["start"] + ctx.beat.t0 + t
        cam = Cam(u, z=z, pan=(0, 0), canvas=(3000, 1400))
        lx, ly = cam.p(1500, 330)
        img = cam.stars(lenses=[(lx, ly, cam.r(120))], gain=0.85)
        cx, cy = cam.p(860 + drift * 300 * smooth(u), 560)
        R = cam.r(170)
        render_rings(img, cx, cy, R, front=False)
        render_planet(img, cx, cy, R, "saturn", spin=0.6 + gt * 0.03, tilt=0.3, light=(-0.65, 0.1, 0.75), roll=0.12)
        render_rings(img, cx, cy, R, front=True)
        ctx.state["sat"] = (cx, cy, R, cam.z)
        return img
    return f


# ───────────── Jupiter and the Galilean moons ─────────────
MOONS = [("IO", 0.42, 1.0), ("EUROPA", 0.67, 0.9), ("GANYMEDE", 1.07, 1.45), ("CALLISTO", 1.88, 1.35)]  # million km, size


def jupiter_moons_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.25, 1.15), canvas=(1800, 2600))
    lx, ly = cam.p(1700, 180)
    img = cam.stars(lenses=[(lx, ly, cam.r(110))], gain=0.6)
    jx, jy = cam.p(760, 600)
    render_planet(img, jx, jy, cam.r(46), "jupiter", spin=t * 0.05, tilt=0.1, light=(-0.4, 0.2, 0.9))
    scale = 300 / 1.07  # px per million km (Ganymede orbit at 300 px)
    tg = ctx.w("Ganymede")
    pos = {}
    for k, (name, a, s) in enumerate(MOONS):
        r = a * scale
        ang = t * (0.9 / a ** 1.5) + k * 1.7
        x, y = 760 + r * np.cos(ang), 600 + r * np.sin(ang) * 0.42
        if name in ("GANYMEDE", "CALLISTO"):
            k2 = ease_in(span(t, tg + 0.6, ctx.dur), 2.2) if name == "GANYMEDE" else ease_in(span(t, tg + 1.4, ctx.dur), 2.0) * 0.6
            x, y = lerp(x, 1700, k2), lerp(y, 180, k2)
        X, Y = cam.p(x, y)
        render_planet(img, X, Y, cam.r(9 * s), "moon", spin=1, tilt=0.1, light=(-0.4, 0.2, 0.9), atmo=(0, 0, 0), exposure=1.2)
        pos[name] = (X, Y)
    ctx.state["moons"] = (pos, cam, scale)
    return img


def jupiter_moons_overlay(ctx, img, t, u):
    pos, cam, scale = ctx.state["moons"]
    cam = Cam(u, z=(1.25, 1.15), canvas=(1800, 2600))
    L = Layer()
    jx, jy = cam.p(760, 600)
    grip = 0.78 * scale
    a = fade(t, 0.3)
    L.ellipse((jx, jy), cam.r(grip), cam.r(grip * 0.42), ACC, 0.8 * a, 2, dash=10)
    img = text(img, "JUPITER'S GRIP", jx, jy + cam.r(grip * 0.42) + 28, 18, ACC, a, "c", kind="mono6")
    for k, (name, aa, s) in enumerate(MOONS):
        L.ellipse((jx, jy), cam.r(aa * scale), cam.r(aa * scale * 0.42), DIM, 0.25 * a, 1)
    tc = ctx.w("closest")
    for name in ("IO", "EUROPA"):
        X, Y = pos[name]
        d = np.array([X - jx, Y - jy], np.float32)
        d /= max(1e-3, float(np.hypot(*d)))
        img = text(img, name, X + d[0] * 20, Y + d[1] * 20 + (-10 if d[1] <= 0 else 10), 18, GREEN, fade(t, tc),
                   "lc" if d[0] >= 0 else "rc", kind="mono6")
    tg = ctx.w("Ganymede")
    X, Y = pos["GANYMEDE"]
    img = hud.callout(L, img, (X, Y), "GANYMEDE", "LARGEST MOON IN THE SOLAR SYSTEM", fade(t, tg), prog(t, tg), dx=-110, dy=-195, color=RED)
    return L.composite(img, 0.5)


# ───────────── tidal bulge diagram ─────────────
def bulge_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.05), canvas=(1200, 2400))
    tb = ctx.w("Now")
    k = smooth(span(t, tb, tb + 1.4))
    bx, by = cam.p(250, 400)
    lenses = [(bx, by, cam.r(90) * k)] if k > 0.01 else []
    img = cam.stars(lenses=lenses, gain=0.5)
    ex, ey = cam.p(960, 560)
    R = cam.r(170)
    # ocean bulge: translucent blue ellipse aligned with the pulling body
    ang = lerp(0.0, np.arctan2(400 - 560, 250 - 960), k)
    stretch = lerp(1.18, 1.75, k)
    xs, ys = grid()
    dx, dy = xs - ex, ys - ey
    ca, sa = np.cos(ang), np.sin(ang)
    u_ = (dx * ca + dy * sa) / (R * stretch)
    v_ = (-dx * sa + dy * ca) / (R * 1.02)
    bul = clamp((1 - (u_ ** 2 + v_ ** 2)) * 20) * 0.45
    img += bul[..., None] * np.array([0.1, 0.35, 0.9], np.float32) * 0.35
    render_planet(img, ex, ey, R, "earth", spin=1.0 + t * 0.04, tilt=0.4, light=(-0.6, 0.3, 0.7))
    mx, my = cam.p(1620, 560)
    render_planet(img, mx, my, cam.r(42) * (1 - 0.6 * k), "moon", spin=1, tilt=0.1, light=(-0.6, 0.3, 0.7), atmo=(0, 0, 0))
    ctx.state["bulge"] = (ex, ey, R, k, (bx, by), (mx, my))
    return img


def bulge_overlay(ctx, img, t, u):
    ex, ey, R, k, (bx, by), (mx, my) = ctx.state["bulge"]
    L = Layer()
    img = text(img, "OCEAN BULGE", ex, ey - R * 1.35, 22, BLUE, fade(t, 0.3) * (1 - k), "c", kind="mono6")
    img = text(img, "THE MOON", mx, my + 70, 20, DIM, fade(t, 0.3) * (1 - k), "c")
    img = text(img, "TIDE FROM THE MOON: ~0.4 m", W / 2, H - 150, 24, WHITE, fade(t, 0.6) * (1 - k), "c")
    img = text(img, "BLACK HOLE", bx, by - 130, 22, ACC, k, "c", kind="mono6")
    img = text(img, "TIDE FROM THE BLACK HOLE: ~100× STRONGER", W / 2, H - 150, 24, ACC, k * fade(t, ctx.w("heavier")), "c")
    return L.composite(img, 0.4)


# ───────────── eclipse glasses mask ─────────────
def glasses_mask():
    xs, ys = grid()
    e1 = ((xs - 690) / 330) ** 2 + ((ys - 540) / 250) ** 2
    e2 = ((xs - 1230) / 330) ** 2 + ((ys - 540) / 250) ** 2
    return clamp((1 - np.minimum(e1, e2)) * 30)


@scene_factory(vectors=["focus"], keys=[])
def sun_scene(z=(1.0, 1.0), focus=(0.0, 0.0), glasses=False, transit=(0.0, 1.0), R0=420, lens_te=62, shadow=0.16):
    def f(ctx, t, u, fi):
        cam = Cam(u, z=z, pan=focus, pan_u=ctx.ru(t))
        img = np.zeros((H, W, 3), np.float32)
        cx, cy = cam.p(960 if not glasses else 960, 540)
        R = cam.r(R0)
        render_sun_disk(img, cx, cy, R, ctx.seg["start"] + ctx.beat.t0 + t)
        a, b = transit
        k = lerp(a, b, smoother(u))
        lx = cx + R * lerp(-0.9, 0.8, k)
        ly = cy + R * lerp(-0.3, 0.15, k)
        img = lens_image(img, lx, ly, cam.r(lens_te), shadow=shadow)
        ctx.state["sunlens"] = (lx, ly, cam.r(lens_te), cx, cy, R)
        if glasses:
            m = glasses_mask()
            img = img * m[..., None]
        return img, dict(exposure=1.0, bloom=0.35, grade=((0, 0, 0), (1, 1, 1)))
    return f


# ───────────── Venus captured, orbiting the hole ─────────────
def venus_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.12), canvas=(3800, 1300))
    bx, by = cam.p(960, 520)
    img = cam.stars(gain=0.8)
    ang = t * 0.55 + 0.4
    rx, ry = 520, 140
    vx, vy = cam.p(960 + rx * np.cos(ang), 520 + ry * np.sin(ang))
    behind = np.sin(ang) < 0
    vR = cam.r(46 + 10 * np.sin(ang))
    if behind:
        render_planet(img, vx, vy, vR, "venus", spin=t * 0.1, tilt=0.2, light=(-0.5, 0.3, 0.8), atmo=(1.0, 0.85, 0.6))
        img = lens_image(img, bx, by, cam.r(120), shadow=0.35)
    else:
        img = lens_image(img, bx, by, cam.r(120), shadow=0.35)
        render_planet(img, vx, vy, vR, "venus", spin=t * 0.1, tilt=0.2, light=(-0.5, 0.3, 0.8), atmo=(1.0, 0.85, 0.6))
    ctx.state["venus"] = (vx, vy, bx, by, cam)
    return img


# ───────────── galaxy-scale bars / counters ─────────────
def bars_overlay(rows, at=0.3, x0=260, y0=420, w=1400, gap=110, scale_fn=None):
    """rows: list of (label, value, color, appear_word_or_time). Linear bars; scale_fn(t) → value at full width."""
    def f(ctx, img, t, u):
        L = Layer()
        img = hud.panel(img, x0 - 60, y0 - 90, x0 + w + 60, y0 + gap * len(rows), fade(t, 0.0), 0.82)
        full = scale_fn(ctx, t) if scale_fn else max(r[1] for r in rows)
        for i, (lab, val, col, when) in enumerate(rows):
            tw = when if isinstance(when, (int, float)) else ctx.w(when)
            a = fade(t, tw)
            frac = clamp(val / full) * prog(t, tw, 1.2)
            y = y0 + i * gap
            L.rect(x0, y, x0 + max(2, w * frac), y + 34, col, 0.85 * a, fill=True)
            img = text(img, lab, x0, y - 18, 20, DIM, a, "lc")
            if val / full > 1.0:
                img = text(img, "off the chart  >", x0 + w - 8, y + 17, 18, col, a, "rc")
        return L.composite(img, 0.3)
    return f


@scene_factory()
def timeline_scene(from_t=0.2):
    """Starfield + small rendered planets above the timeline milestones (synced with timeline_overlay)."""
    def f(ctx, t, u, fi):
        cam = Cam(ctx.ru(t), z=(1.0, 1.04), pan=(40, 0), canvas=(2600, 1500))
        lx, ly = cam.p(1650, 200)
        img = cam.stars(lenses=[(lx, ly, cam.r(40))], gain=0.45)
        tr = ctx.seg["start"] + ctx.beat.t0 + t - ctx.run_t0     # planets already shown earlier in this shot stay
        p = max(prog(t, from_t, 1.6), prog(tr, 0.2, 1.6))
        for f_, body, r in ((0.46, "neptune", 30), (0.66, "saturn", 30), (0.86, "earth", 30)):
            a = smooth(span(p, f_ * 0.95, f_ * 0.95 + 0.06))
            if a <= 0:
                continue
            x = TL_X0 + (TL_X1 - TL_X0) * f_
            tmp = img.copy()
            if body == "saturn":
                render_rings(tmp, x, TL_Y - 70, r, front=False)
            render_planet(tmp, x, TL_Y - 70, r, body, spin=1.0 + t * 0.05, tilt=0.3, light=(-0.6, 0.3, 0.7))
            if body == "saturn":
                render_rings(tmp, x, TL_Y - 70, r, front=True)
            img = img * (1 - a) + tmp * a
        return img
    return f
