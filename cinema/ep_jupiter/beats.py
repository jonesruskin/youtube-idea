"""BEAT SHEET — a fall into Jupiter. One explanatory visual per narration line, synced to words.
Descent beats read the fall simulation (vis.at), so the picture, the HUD and the narration always agree."""
import numpy as np
import cv2
from engine.beats import Beat as B, scene_factory, dimmed
from engine.core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                         fast_blur, grid, splat_points, star_color)
from engine.planet import render_planet
from engine.scenes2 import Cam
from engine import hud
from engine.hud import Layer, text, fade, prog, typed, WHITE, ACC, BLUE, RED, GREEN, DIM
from engine.jupiter import globe, belts, slice_disk, GRS_SPIN, GRS_TILT, RJ_KM, thermal, grs_outline
from ep_jupiter.vis import *  # noqa
from ep_jupiter import vis as V

# ship framings: the camera falls with the ship, so they differ in size and side only, never in height (V.SHIP_Y)
CLOSE, WIDE, LEFT, HIGH, LOW = (0.58, 0.60, 230), (0.66, 0.58, 55), (0.40, 0.58, 120), (0.62, 0.58, 85), (0.60, 0.58, 150)
HUD = hud_descent()
HUDF = hud_descent(reveal_float=True)
ORANGE = (1.0, 0.55, 0.2)
HOVER = (0.62, 0.50, 100)   # hovering above the clouds, before the fall


@scene_factory(vectors=["pan"])
def stars_bg(z=(1.0, 1.05), gain=0.8, pan=(0, 0)):
    def f(ctx, t, u, fi):
        cam = Cam(u, z=z, pan=pan, canvas=(2600, 1200), pan_u=ctx.ru(t))
        ctx.state["cam"] = cam
        return cam.stars(gain=gain), dict(exposure=1.35, bloom=0.45)
    return f


def panel_box(x0, y0, x1, y1, at=0.1, strength=0.5):
    def f(ctx, img, t, u):
        return hud.panel(img, x0, y0, x1, y1, fade(t, at), strength)
    return f


# ═══════════════════════════ OPEN ═══════════════════════════
def o1_earths(ctx, img, t, u, X, Y, R, cam):
    a = fade(t, ctx.w("thirteen") - 0.6)
    if a > 0:
        ex, ey = X + R + 150, Y + R * 0.55
        earth_disc(img, ex, ey, R * 0.0912)
        ctx.state["earth_pt"] = (ex, ey, R * 0.0912)
    return img


def o1_earths_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    tt = ctx.w("thirteen") - 0.6
    if "earth_pt" in ctx.state:
        ex, ey, er = ctx.state["earth_pt"]
        img = text(img, "EARTH, TO SCALE", ex, ey + er + 34, 16, BLUE, fade(t, tt), "c", tracking=0.2)
    th = ctx.w("thirteen")
    img = text(img, "× " + hud.counter(0, 1321, prog(t, th, 1.8)), X + R + 120, Y - 80, 70, WHITE, fade(t, th), "lc", kind="xlight")
    img = text(img, "EARTHS WOULD FIT INSIDE", X + R + 126, Y - 20, 18, ACC, fade(t, th + 0.4), "lc", tracking=0.25)
    return L.composite(img, 0.4)


def o1_fall_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    tf = ctx.w("fall")
    p = prog(t, 0.2, max(1.0, tf + 1.0))
    s0 = np.array([X + R * 1.9, Y - R * 1.0])
    s1 = np.array([X + R * 0.25, Y - R * 0.55])
    pts = np.array([s0 + (s1 - s0) * k + np.array([0, -60 * np.sin(np.pi * k)]) for k in np.linspace(0, 1, 60)])
    L.polyline(pts, WHITE, 0.8 * fade(t, 0.2), 2, progress=p, dash=10)
    q = pts[min(59, int(p * 59))]
    draw_ship_icon(L, q[0], q[1], 10, WHITE, fade(t, 0.2))
    img = text(img, "YOU", q[0] + 22, q[1] - 22, 18, WHITE, fade(t, 0.2), "lc", kind="mono6")
    return L.composite(img, 0.5)


def o1_crash_over(ctx, img, t, u):
    L = Layer()
    tc, tf = ctx.w("crash"), ctx.w("Fall")
    img = hud.panel(img, W / 2 - 420, H - 260, W / 2 + 420, H - 70, fade(t, tc - 0.2), 0.5)
    img = text(img, "NOT CRASH.", W / 2, H - 200, 56, DIM, fade(t, tc), "c", kind="light", tracking=0.08)
    L.line((W / 2 - 210, H - 200), (W / 2 + 210, H - 200), color=RED, alpha=fade(t, tc + 0.4), th=4, progress=prog(t, tc + 0.4, 0.4))
    img = text(img, "FALL.", W / 2, H - 120, 64, WHITE, fade(t, tf), "c", kind="light", tracking=0.12, glow=0.2)
    return L.composite(img, 0.5)


@scene_factory(vectors=["wedge"])
def cutaway_scene(R=(380, 400), wedge=(-90, 0), z=(1.0, 1.06), cx=W / 2, cy=H / 2 + 20, reveal=None, spin_rate=0.01):
    """Globe with a quarter-wedge cut away to show the interior slice."""
    def f(ctx, t, u, fi):
        cam = Cam(u, z=z, canvas=(2400, 1250))
        img = cam.stars(gain=0.8)
        X, Y = cam.p(cx, cy)
        r = cam.r(lerp(R[0], R[1], smoother(min(u, 1))))
        gt = ctx.seg["start"] + ctx.beat.t0 + t
        globe(img, X, Y, r, spin=GRS_SPIN - 0.6 + gt * spin_rate, tilt=0.1)
        k = 1.0 if reveal is None else reveal(ctx, t, u)
        a0, a1 = np.radians(wedge[0]), np.radians(wedge[0] + (wedge[1] - wedge[0]) * k)

        def mask(xs, ys):
            ang = np.arctan2(ys - Y, xs - X)
            return ((ang >= a0) & (ang <= a1)).astype(np.float32)
        if k > 0.01:
            img = slice_disk(img, X, Y, r * 0.995, gt, mask_fn=mask)
        ctx.state["cut"] = (X, Y, r, a0, a1)
        return img, dict(exposure=1.3, bloom=0.45)
    return f


def o2_over(ctx, img, t, u):
    X, Y, r, a0, a1 = ctx.state["cut"]
    L = Layer()
    for i, (w, lab) in enumerate((("ground", "NO GROUND"), ("surface", "NO SURFACE"), ("land", "NOTHING TO LAND ON"))):
        tt = ctx.w(w)
        yy = 330 + i * 90
        img = text(img, lab, 300, yy, 26, WHITE, fade(t, tt), "lc", kind="mono6", tracking=0.18)
        L.cross((262, yy), 13, RED, fade(t, tt), 4, prog(t, tt, 0.4))
    return L.composite(img, 0.5)


def o2b_over(ctx, img, t, u):
    X, Y, r, a0, a1 = ctx.state["cut"]
    L = Layer()
    p = prog(t, 0.3, 2.5)
    x = X + r * 0.62
    L.arrow((x, Y - r * 0.95), (x, Y - r * 0.95 + (r * 0.85) * p), color=WHITE, alpha=fade(t, 0.3), th=3)
    img = text(img, "THICKER", x + 30, Y - r * 0.62, 22, WHITE, fade(t, ctx.w("thicker")), "lc", kind="mono6", tracking=0.2)
    img = text(img, "HOTTER", x + 30, Y - r * 0.32, 22, ORANGE, fade(t, ctx.w("hotter")), "lc", kind="mono6", tracking=0.2)
    img = text(img, "ALL THE WAY DOWN", x + 30, Y - r * 0.04, 22, ACC, fade(t, ctx.w("way")), "lc", kind="mono6", tracking=0.2)
    return L.composite(img, 0.5)


def o3_chart(ctx, img, t, u):
    """Temperature vs depth from the model, with the Galileo-measured stretch highlighted."""
    L = Layer()
    x0, y0, w, h = 420, 250, 1080, 560
    img = hud.panel(img, x0 - 80, y0 - 90, x0 + w + 80, y0 + h + 110, fade(t, 0.05), 0.55)
    zs = np.linspace(-20, 600, 200)
    Ts = np.array([V.M.profile(max(0, z) * 1e3)[0] if z >= 0 else V.M.atm(z * 1e3)[0] for z in zs])
    xs = x0 + (zs + 20) / 620 * w
    ys = y0 + h - (Ts - 100) / 1300 * h
    tg = ctx.w("probe")
    gx1 = x0 + (123 + 20) / 620 * w
    L.rect(x0, y0, gx1, y0 + h, (0.3, 0.6, 1.0), 0.18 * fade(t, tg), fill=True)
    L.polyline(np.stack([xs, ys], -1), ACC, fade(t, 0.2), 3, progress=prog(t, 0.3, 2.6))
    L.line((x0, y0 + h), (x0 + w, y0 + h), color=DIM, alpha=fade(t, 0.05), th=1)
    L.line((x0, y0), (x0, y0 + h), color=DIM, alpha=fade(t, 0.05), th=1)
    img = text(img, "TEMPERATURE", x0, y0 - 40, 16, DIM, fade(t, 0.05), "lc", tracking=0.2)
    img = text(img, "DEPTH", x0 + w, y0 + h + 40, 16, DIM, fade(t, 0.05), "rc", tracking=0.2)
    img = text(img, "MEASURED BY THE GALILEO PROBE (1995)", x0 + 20, y0 + 40, 16, BLUE, fade(t, tg), "lc", tracking=0.15)
    img = text(img, "PHYSICS MODEL", x0 + w - 20, y0 + 40, 16, ACC, fade(t, 1.0), "rc", tracking=0.15)
    return L.composite(img, 0.5)


def big_q(at_word, y=H / 2 - 40):
    def f(ctx, img, t, u):
        a = fade(t, ctx.w(at_word) if isinstance(at_word, str) else at_word)
        return text(img, "?", W / 2, y, 200, WHITE, a * 0.8, "c", kind="thin", glow=0.3)
    return f


# ═══════════════════════════ CH1 · getting there ═══════════════════════════
def c1_ship_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    k = smoother(min(u, 1))
    x = lerp(W + 60, X + R * 1.6, k)
    y = lerp(220, Y - R * 0.6, k)
    draw_ship_icon(L, x, y, 9, WHITE, 1.0, flame=1.0)
    L.line((x + 14, y + 4), (x + 140, y - 40), color=BLUE, alpha=0.5, th=2)
    return L.composite(img, 0.6)


def belts_on(ctx, t, u):
    return fade(t, ctx.w("radiation") - 0.3, None, 0.8)


def c1_belts_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    tr = ctx.w("radiation")
    img = hud.callout(L, img, (X + R * 2.55, Y + 8), "RADIATION BELTS", "TRAPPED ELECTRONS AND IONS", fade(t, tr + 0.4), prog(t, tr + 0.4), dx=-60, dy=-150, color=(0.75, 0.65, 1.0))
    return L.composite(img, 0.5)


def c1_lethal_over(ctx, img, t, u):
    L = Layer()
    th = ctx.w("hours")
    x, y = 260, H - 200
    L.circle((x, y), 34, RED, fade(t, 0.3), th=3)
    L.line((x, y), (x, y - 22), color=RED, alpha=fade(t, 0.3), th=3)
    L.line((x, y), (x + 14 * np.cos(t * 2), y + 14 * np.sin(t * 2)), color=RED, alpha=fade(t, 0.3), th=3)
    img = text(img, "UNSHIELDED: LETHAL WITHIN HOURS", x + 60, y, 26, RED, fade(t, th - 0.4), "lc", kind="mono6", tracking=0.14)
    return L.composite(img, 0.5)


def c1_juno_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    tj = ctx.w("Juno")
    ang = -0.6 + t * 0.18
    jx, jy = X + np.cos(ang) * R * 2.2, Y + np.sin(ang) * R * 0.55
    draw_juno(L, jx, jy, 26, fade(t, 0.1), rot=t * 0.5)
    img = text(img, "JUNO", jx + 50, jy - 30, 18, WHITE, fade(t, tj), "lc", kind="mono6")
    # vault inset
    tv = ctx.w("vault")
    bx, by = 1420, 760
    img = hud.panel(img, bx - 40, by - 150, bx + 400, by + 120, fade(t, tv - 0.2), 0.55)
    s = 90
    L.rect(bx, by - s, bx + s * 1.3, by + s * 0.2, (0.7, 0.72, 0.78), fade(t, tv), 6)
    L.rect(bx + 14, by - s + 14, bx + s * 1.3 - 14, by + s * 0.2 - 14, ACC, fade(t, tv) * 0.6, fill=True)
    img = text(img, "TITANIUM VAULT", bx + s * 1.3 + 30, by - 70, 20, WHITE, fade(t, tv), "lc", kind="mono6", tracking=0.12)
    img = text(img, "1 CM THICK WALLS", bx + s * 1.3 + 30, by - 30, 16, DIM, fade(t, tv + 0.3), "lc", tracking=0.15)
    img = text(img, "ELECTRONICS INSIDE", bx + s * 1.3 + 30, by + 6, 16, ACC, fade(t, tv + 0.6), "lc", tracking=0.15)
    return L.composite(img, 0.5)


def c1_speed_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    ts = ctx.w("sixty")
    k = smoother(clamp((t - 0.3) / max(1.0, ts + 0.8)))
    p0 = np.array([W - 120, 120]); p1 = np.array([X + R * 0.62, Y - R * 0.74])
    q = p0 + (p1 - p0) * ease_in(k, 2)
    L.line(p0, q, color=ACC, alpha=0.4, th=2)
    glow_dot(img, q[0], q[1], (1.0, 0.8, 0.6), 6, 3.0)
    v = 59.5 * np.sqrt(clamp(k))
    img = text(img, f"{v:,.0f} KM/S", W / 2 + 330, 180, 64, WHITE, fade(t, 0.3), "lc", kind="xlight")
    img = text(img, "SPEED AT THE CLOUD TOPS, FALLING FROM DEEP SPACE", W / 2 + 336, 240, 15, ACC, fade(t, ts), "lc", tracking=0.15)
    return L.composite(img, 0.5)


def atlantic_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.04), canvas=(2100, 1350))
    img = cam.stars(gain=0.7)
    X, Y = cam.p(W / 2, H / 2 + 40)
    R = cam.r(470)
    render_planet(img, X, Y, R, "earth", spin=2.15, tilt=-0.62, light=(-0.4, 0.4, 0.8))
    ctx.state["earth"] = (X, Y, R)
    return img, dict(exposure=1.35, bloom=0.45)


def atlantic_over(ctx, img, t, u):
    X, Y, R = ctx.state["earth"]
    L = Layer()
    ta = ctx.w("Atlantic")
    lon_ = np.array([-74.0, 0.0]); lat_ = np.array([40.7, 51.5])
    # orthographic projection matching the globe's spin/tilt (calibrated): centre lon -37, lat 38
    def proj(lon, lat):
        lo, la = np.radians(lon + 37.0), np.radians(lat)
        c0 = np.radians(38.0)
        x = np.cos(la) * np.sin(lo)
        y = np.cos(c0) * np.sin(la) - np.sin(c0) * np.cos(la) * np.cos(lo)
        return X + x * R, Y - y * R
    ks = np.linspace(0, 1, 50)
    pts = np.array([proj(lerp(lon_[0], lon_[1], k), lerp(lat_[0], lat_[1], k) + 9 * np.sin(np.pi * k)) for k in ks])
    p = prog(t, ta, 1.55)
    L.polyline(pts, ACC, fade(t, ta), 3, progress=p)
    for (lo, la, nm, anc, dxx) in ((-74.0, 40.7, "NEW YORK", "rc", -16), (0.0, 51.5, "LONDON", "lc", 16)):
        x, y = proj(lo, la)
        L.circle((x, y), 6, WHITE, fade(t, ta - 0.4), fill=True)
        img = text(img, nm, x + dxx, y, 16, WHITE, fade(t, ta - 0.4), anc, kind="mono6", tracking=0.12)
    sec = 93 * clamp((t - ta) / 1.55)
    img = text(img, f"{int(sec // 60)} MIN {int(sec % 60):02d} S", W / 2, H - 140, 50, WHITE, fade(t, ta), "c", kind="xlight")
    img = text(img, "LONDON TO NEW YORK AT 60 KM/S", W / 2, H - 86, 16, ACC, fade(t, ta), "c", tracking=0.2)
    return L.composite(img, 0.5)


def limb_scene(ctx, t, u, fi):
    """Close to Jupiter: the limb fills the lower part of the frame."""
    cam = Cam(ctx.ru(t), z=(1.0, 1.05), canvas=(2000, 1300))
    img = cam.stars(gain=0.8)
    X, Y = cam.p(W / 2 + 200, H + 1250)
    R = cam.r(1700)
    gt = ctx.seg["start"] + ctx.beat.t0 + t
    globe(img, X, Y, R, spin=GRS_SPIN + 1.2 + gt * 0.004, tilt=0.45, light=(-0.5, 0.55, 0.65))
    ctx.state["limb"] = (X, Y, R)
    return img, dict(exposure=1.3, bloom=0.5)


def probe_entry_over(fire=False, label=True):
    def f(ctx, img, t, u):
        X, Y, R = ctx.state["limb"]
        L = Layer()
        k = smoother(min(u, 1))
        x = lerp(W * 0.18, W * 0.52, k)
        y = lerp(H * 0.2, H * 0.52, k)
        if fire:
            for i in range(14):
                q = i / 14
                glow_dot(img, x - 40 * i * 1.4, y - 30 * i * 1.4 * 0.75, (1.0, 0.6 - 0.3 * q, 0.3), 26 * (1 - q * 0.6), 1.6 * (1 - q))
            glow_dot(img, x + 8, y + 6, (1.0, 0.95, 0.85), 22, 4.0)
        draw_probe(L, x, y, 26, fade(t, 0.1))
        if label:
            img = text(img, "GALILEO PROBE", x + 60, y - 50, 20, WHITE, fade(t, 0.3), "lc", kind="mono6", tracking=0.12)
            img = text(img, "7 DECEMBER 1995", x + 60, y - 14, 16, ACC, fade(t, ctx.w("nineteen")), "lc", tracking=0.2)
        return L.composite(img, 0.5)
    return f


def heatshield_over(ctx, img, t, u):
    L = Layer()
    x0, y0 = 520, 360
    img = hud.panel(img, x0 - 80, y0 - 120, x0 + 960, y0 + 330, fade(t, 0.1), 0.55)
    tt = ctx.w("minutes")
    p = prog(t, 0.6, max(1.2, tt + 0.8))
    th = lerp(14.6, 5.1, ease_in(p, 1.5))
    s = 28
    L.rect(x0, y0, x0 + 14.6 * s, y0 + 120, (0.35, 0.35, 0.38), fade(t, 0.1), 2)
    L.rect(x0, y0, x0 + th * s, y0 + 120, ACC, fade(t, 0.1) * 0.9, fill=True)
    glow_dot(img, x0 + th * s, y0 + 60, (1.0, 0.6, 0.3), 40, 0.6 * p)
    img = text(img, "HEAT SHIELD, FRONT EDGE", x0, y0 - 50, 18, DIM, fade(t, 0.1), "lc", tracking=0.2)
    img = text(img, f"{th:.1f} CM", x0 + 14.6 * s + 40, y0 + 60, 44, WHITE, fade(t, 0.1), "lc", kind="xlight")
    img = text(img, f"T+ {int(110 * p) // 60}:{int(110 * p) % 60:02d}", x0, y0 + 200, 30, ACC, fade(t, 0.4), "lc", kind="mono6")
    img = text(img, "FROM 14.6 CM TO 5.1 CM", x0 + 300, y0 + 200, 20, DIM, fade(t, tt), "lc", tracking=0.15)
    return L.composite(img, 0.5)


# ── c1d: the ship stops above the clouds ──
ABOVE = lambda ctx, t, u: -20.0
STILL = lambda ctx, t, u: 0.0


def thrust_off(ctx, t, u):
    return 1 - smooth(clamp((t - ctx.w("off")) / 0.6))


def c1d_dims(ctx, img, t, u):
    L = Layer()
    x, y, r = W * 0.62, H * 0.55, 150
    a = fade(t, ctx.w("Twelve") - 0.2)
    img = hud.dimension(L, img, (x - r, y + r * 1.25), (x + r, y + r * 1.25), "4 M", a, prog(t, ctx.w("four")), WHITE)
    img = text(img, "12 TONNES · TITANIUM HULL", x - r - 60, y - r * 0.2, 18, WHITE, fade(t, ctx.w("Twelve")), "rc", kind="mono6", tracking=0.14)
    img = text(img, "BUILT LIKE A FULL-DEPTH SUBMARINE", x - r - 60, y + r * 0.15, 15, DIM, fade(t, ctx.w("submarines")), "rc", tracking=0.15)
    return L.composite(img, 0.5)


def hud_in(word):
    def a(ctx, t, u):
        return fade(t, ctx.w(word))
    return hud_descent(alpha=a)


def drop_ship(ctx, t, u):
    """Engines off: the ship drops away below the hovering camera, then the camera falls with it."""
    k = smooth(clamp(u * 1.2))
    return 0.62, 0.50 + (V.SHIP_Y - 0.50) * k, 100


# ═══════════════════════════ CH2 · the clouds ═══════════════════════════
def weight_over(ctx, img, t, u):
    L = Layer()
    tg = ctx.w("two")
    x, y = 300, 760
    img = hud.panel(img, x - 170, y - 300, x + 520, y + 90, fade(t, 0.2), 0.5)
    draw_person(L, x, y, 110, WHITE, fade(t, 0.2))
    kg = lerp(80, 203, smoother(prog(t, tg, 1.4)))
    img = text(img, "ON YOUR BATHROOM SCALE", x + 130, y - 210, 15, DIM, fade(t, 0.2), "lc", tracking=0.2)
    img = text(img, f"{kg:,.0f} KG", x + 130, y - 140, 64, WHITE, fade(t, 0.2), "lc", kind="xlight")
    img = text(img, "ON EARTH: 80 KG", x + 136, y - 74, 16, DIM, fade(t, tg), "lc", tracking=0.15)
    img = text(img, "× 2.5 GRAVITY", x + 136, y - 34, 22, ACC, fade(t, tg + 0.3), "lc", kind="mono6", tracking=0.15)
    L.arrow((x - 120, y - 230), (x - 120, y - 120), color=ACC, alpha=fade(t, tg), th=4)
    return L.composite(img, 0.5)


def cloud_label(s, sub=None, word=None, x=W * 0.30, y=H * 0.74, color=WHITE):
    def f(ctx, img, t, u):
        tt = ctx.w(word) if word else 0.3
        img = text(img, s, x, y, 24, color, fade(t, tt), "c", kind="mono6", tracking=0.2)
        if sub:
            img = text(img, sub, x, y + 40, 16, DIM, fade(t, tt + 0.3), "c", tracking=0.2)
        return img
    return f


def thermo_over(word, val_fn, label, color=BLUE, level=0.1, x=200, y=560):
    def f(ctx, img, t, u):
        L = Layer()
        tt = ctx.w(word)
        img = hud.icon_thermo(L, img, (x, y), 150, level, color, fade(t, tt), val_fn(ctx, t, u))
        img = L.composite(img, 0.4)
        img = text(img, label, x - 60, y + 230, 18, color, fade(t, tt + 0.3), "lc", kind="mono6", tracking=0.14)
        return img
    return f


def grs_scene(ctx, t, u, fi):
    """Close on the Great Red Spot. The planet turns slowly; overlays find the spot with grs_outline()."""
    ru = ctx.ru(t)
    cam = Cam(ru, z=(1.0, 1.08), canvas=(2000, 1300))
    img = cam.stars(gain=0.6)
    X, Y = cam.p(W / 2 - 100, H / 2 + 60)
    R = cam.r(1500)
    spin = GRS_SPIN + 0.10 * (ru - 0.5) * min(1.0, ctx.run_dur / 20.0)
    globe(img, X, Y, R, spin=spin, tilt=GRS_TILT, light=(-0.35, 0.25, 0.9))
    ctx.state["grs"] = (X, Y, R, cam)
    ctx.state["grs_spot"] = grs_outline(X, Y, R, spin, GRS_TILT)
    return img, dict(exposure=1.25, bloom=0.4)


def winds_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["grs"]
    L = Layer()
    tw = ctx.w("five")
    for i, (yy, sgn) in enumerate(((0.18, 1), (0.36, -1), (0.62, 1), (0.82, -1))):
        y = H * yy
        ph = (t * 0.35 * sgn + i * 0.3) % 1.0
        x0 = W * (0.1 + 0.8 * ph) if sgn > 0 else W * (0.9 - 0.8 * ph)
        L.arrow((x0 - sgn * 120, y), (x0 + sgn * 120, y), color=WHITE, alpha=0.7 * fade(t, 0.3), th=3)
    img = text(img, "540 KM/H", W - 120, 120, 50, WHITE, fade(t, tw), "rc", kind="xlight")
    img = text(img, "JET STREAMS CIRCLING THE PLANET", W - 120, 172, 15, ACC, fade(t, tw + 0.3), "rc", tracking=0.2)
    return L.composite(img, 0.5)


def grs_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["grs"]
    L = Layer()
    tg = ctx.w("Great")
    # the outline is projected from the spot's real position in the texture, so it sits on the spot as the planet turns
    pts, (gx, gy), vis = ctx.state["grs_spot"]
    L.polyline(pts, RED, fade(t, tg), 2, progress=prog(t, tg), dash=10)
    top = float(pts[:, 1].min())
    img = text(img, "GREAT RED SPOT", gx, top - 44, 20, RED, fade(t, tg), "c", kind="mono6", tracking=0.15)
    te = ctx.w("Earth")
    er = R * 6371 / RJ_KM
    ex = float(pts[:, 0].max()) + er + 90
    ae = fade(t, te - 0.3)
    if ae > 0:
        e_img = img.copy()
        earth_disc(e_img, ex, gy, er)
        img = img * (1 - ae) + e_img * ae
    img = text(img, "EARTH", ex, gy + er + 34, 18, BLUE, fade(t, te), "c", kind="mono6", tracking=0.15)
    return L.composite(img, 0.5)


def grs_earth_scene(ctx, t, u, fi):
    img, pk = grs_scene(ctx, t, u, fi)
    X, Y, R, cam = ctx.state["grs"]
    te = ctx.w("Earth") - 0.3
    if t > te:
        w_ = R * 16350 / RJ_KM
        er = R * 6371 / RJ_KM
        gx = X
        earth_disc(img, gx + w_ / 2 + er + 120, Y, er)
    return img, pk


# ═══════════════════════════ CH3 · storms ═══════════════════════════
def diver_over(ctx, img, t, u):
    L = Layer()
    tp = ctx.w("pressure")
    td = ctx.w("diving")
    x0, y0 = 540, 300   # clear of the ship (x ~1090..1290) and the readout box (x < 460)
    img = hud.panel(img, x0 - 50, y0 - 60, x0 + 470, y0 + 470, fade(t, tp - 0.2), 0.55)
    img = text(img, f"{hud.counter(1, 6.6, prog(t, tp, 1.0), '{:.1f}')} × EARTH'S AIR", x0, y0, 30, WHITE, fade(t, tp), "lc", kind="mono6")
    L.rect(x0, y0 + 50, x0 + 420, y0 + 420, (0.2, 0.45, 0.7), fade(t, td) * 0.35, fill=True)
    dd = 60 * smoother(prog(t, td, 1.2))
    L.line((x0 + 210, y0 + 50), (x0 + 210, y0 + 50 + dd * 5.6), color=WHITE, alpha=fade(t, td), th=1)
    draw_person(L, x0 + 210, y0 + 80 + dd * 5.6, 26, WHITE, fade(t, td))
    img = text(img, f"{dd:.0f} M UNDERWATER", x0 + 230, y0 + 70 + dd * 5.0, 18, WHITE, fade(t, td), "lc", kind="mono6")
    return L.composite(img, 0.5)


def storm_scene(ctx, t, u, fi):
    """Schematic thunderstorm tower over the water clouds, ice lofted 25 km up, mushballs falling."""
    r = atmos(195, 205, ship=(0, 0, 0), light=0.6)(ctx, t, u, fi)
    img, pk = r
    img = cv2.GaussianBlur(img, (0, 0), 6) * 0.45
    return img, pk


def storm_over(stage):
    def f(ctx, img, t, u):
        L = Layer()
        base = H * 0.80
        cx = W * 0.5
        a = fade(t, 0.1)
        # cloud tower outline
        ang = np.linspace(0, np.pi, 60)
        ks = np.linspace(0, 1, 30)
        left = [(cx - 300 + 150 * k + 18 * np.sin(k * 23), base - k * 440) for k in ks]
        anvil = [(cx - 150 - 330 * smooth(q), base - 440 - 90 * q) for q in np.linspace(0, 1, 14)] + \
                [(cx - 480 + 960 * q, base - 530 - 12 * np.sin(q * 9)) for q in np.linspace(0, 1, 30)] + \
                [(cx + 480 - 330 * smooth(q), base - 530 + 90 * q) for q in np.linspace(0, 1, 14)]
        right = [(cx + 150 - 150 * k + 18 * np.sin(k * 19), base - (1 - k) * 440) for k in ks]
        tower = [(cx - 300, base)] + left + anvil + right + [(cx + 300, base)]
        L.poly(tower, (0.55, 0.6, 0.7), a * 0.28)
        L.polyline(tower, (0.75, 0.8, 0.9), a * 0.7, 2)
        L.line((W * 0.15, base), (W * 0.85, base), color=BLUE, alpha=a * 0.7, th=2)
        img = text(img, "WATER CLOUDS", W * 0.15, base + 30, 16, BLUE, a, "lc", tracking=0.2)
        rng = np.random.default_rng(3)
        if stage >= 1:
            tf = ctx.w("fling") if stage == 1 else 0.0
            img = hud.dimension(L, img, (cx + 470, base), (cx + 470, base - 560), "25 KM", fade(t, tf), prog(t, tf, 1.2), WHITE)
            for i in range(40):
                ph = ((t * 0.25 + rng.random()) % 1.0)
                y = base - ph * 560
                x = cx + rng.normal(0, 120)
                L.circle((x, y), 3, (0.85, 0.95, 1.0), a * (1 - ph) * 0.9, fill=True)
            img = text(img, "ICE THROWN UPWARD", cx + 500, base - 300, 18, WHITE, fade(t, tf + 0.4), "lc", kind="mono6", tracking=0.14)
        if stage >= 2:
            tm = ctx.w("mushballs")
            tt = ctx.w("ammonia")
            img = text(img, "+ AMMONIA GAS = SLUSH", cx - 520, base - 520, 18, ACC, fade(t, tt), "rc", kind="mono6", tracking=0.14)
            for i in range(14):
                ph = ((t * 0.18 + rng.random()) % 1.0)
                y = base - 560 + ph * 640
                x = cx - 200 + rng.random() * 400
                L.circle((x, y), 7 + 4 * rng.random(), (0.95, 0.85, 0.6), fade(t, tm) * 0.9, fill=True)
            img = text(img, "MUSHBALLS", cx - 520, base - 470, 30, WHITE, fade(t, tm), "rc", kind="mono6", tracking=0.14)
            img = text(img, "AMMONIA-WATER HAILSTONES", cx - 520, base - 428, 15, DIM, fade(t, tm + 0.3), "rc", tracking=0.18)
        return L.composite(img, 0.5)
    return f


def nightside_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.06), canvas=(2200, 1250))
    img = cam.stars(gain=0.8)
    X, Y = cam.p(W / 2 + 120, H / 2 + 40)
    R = cam.r(460)
    gt = ctx.seg["start"] + ctx.beat.t0 + t
    globe(img, X, Y, R, spin=GRS_SPIN + gt * 0.01, tilt=0.12, light=(0.92, 0.1, -0.35), exposure=1.0)
    rng = np.random.default_rng(8)
    for i in range(10):
        lat, lon = rng.uniform(-0.8, 0.8), rng.uniform(-1.3, -0.15)
        x = X + R * np.cos(lat) * np.sin(lon)
        y = Y - R * np.sin(lat)
        ph = (gt * 0.7 + rng.random() * 5) % 3.0
        a = np.exp(-ph / 0.08) * (1 + np.sin(ph * 60) ** 2) if ph < 0.5 else 0
        if a > 0.01:
            glow_dot(img, x, y, (0.75, 0.85, 1.0), 4, 4.0 * a)
            glow_dot(img, x, y, (0.6, 0.75, 1.0), 40, 0.6 * a)
    ctx.state["globe"] = (X, Y, R, cam)
    return img, dict(exposure=1.6, bloom=0.6)


# ═══════════════════════════ CH4 · Galileo ═══════════════════════════
def galileo_over(stage):
    def f(ctx, img, t, u):
        L = Layer()
        cx, cy = W * 0.46, H * 0.48
        k = smoother(min(u, 1))
        y = cy + (40 * k if stage == 1 else 0)
        draw_probe(L, cx, y, 34, fade(t, 0.1), chute=1.0)
        if stage == 1:
            ts = ctx.w("silent")
            for i in range(3):
                ph = (t * 0.8 + i / 3) % 1.0
                live = t < ts
                L.circle((cx, y - 40), 40 + ph * 220, BLUE if live else RED, (1 - ph) * 0.6 * (1 if live else max(0, 1 - (t - ts) / 0.8)), th=2)
            img = text(img, "SIGNAL LOST", cx + 300, y - 140, 30, RED, fade(t, ts), "lc", kind="mono6", tracking=0.18)
            img = text(img, "GALILEO PROBE · 1995", cx + 300, y - 96, 16, DIM, fade(t, ts + 0.3), "lc", tracking=0.2)
        if stage == 2:
            th = ctx.w("hour")
            mins = 58 * smoother(prog(t, 0.3, max(1.5, th + 1.0)))
            img = text(img, f"{mins:,.0f} MIN", cx + 300, y - 140, 64, WHITE, fade(t, 0.3), "lc", kind="xlight")
            img = text(img, "OF DATA, ON A PARACHUTE", cx + 306, y - 80, 16, ACC, fade(t, th), "lc", tracking=0.2)
            # data bars
            for i in range(12):
                hh = 20 + 60 * abs(np.sin(i * 1.7 + t * 2))
                L.line((cx + 310 + i * 22, y + 40), (cx + 310 + i * 22, y + 40 - hh * fade(t, 0.3)), color=BLUE, alpha=0.8, th=8)
            tw = ctx.w("overwhelmed")
            img = text(img, "UNTIL THE HEAT KILLED IT", cx + 306, y + 90, 18, RED, fade(t, tw), "lc", kind="mono6", tracking=0.14)
        return L.composite(img, 0.5)
    return f


def deepest_over(ctx, img, t, u):
    L = Layer()
    tn = ctx.w("Nothing")
    st = ctx.state["st"]
    # the Galileo depth as a horizontal line that scrolls upward past the ship
    dz = (st["z"] - 123.3) * 12
    y = H * 0.55 - dz
    if -20 < y < H:
        L.line((80, y), (W - 300, y), color=BLUE, alpha=fade(t, 0.2) * 0.8, th=2, dash=14)
        img = text(img, "DEEPEST POINT EVER REACHED · GALILEO 1995", 90, y - 26, 16, BLUE, fade(t, 0.2), "lc", tracking=0.15)
    return L.composite(img, 0.5)


# ═══════════════════════════ CH5 · glow ═══════════════════════════
def stove_over(ctx, img, t, u):
    L = Layer()
    x, y = 330, 700
    tg = ctx.w("stove")
    img = hud.panel(img, x - 200, y - 200, x + 200, y + 170, fade(t, tg - 0.3), 0.5)
    for r_ in (110, 80, 50):
        L.circle((x, y), r_, (1.0, 0.25, 0.08), fade(t, tg), th=10)
    glow_dot(img, x, y, (1.0, 0.3, 0.1), 140, 0.35 * fade(t, tg))
    img = text(img, "ABOUT 525 °C", x, y + 140, 22, ORANGE, fade(t, tg + 0.3), "c", kind="mono6")
    img = text(img, "WHERE HOT THINGS START TO GLOW", W / 2 + 120, H - 110, 18, DIM, fade(t, tg + 0.6), "c", tracking=0.2)
    return L.composite(img, 0.5)


def colour_strip(word_red, word_orange):
    def f(ctx, img, t, u):
        L = Layer()
        x0, y0, w = 560, H - 150, 800
        a = fade(t, 0.2)
        img = hud.panel(img, x0 - 40, y0 - 70, x0 + w + 40, y0 + 70, a, 0.5)
        for i in range(80):
            T = 700 + i * 12
            c = star_color(T) * clamp((T - 650) / 300)
            L.line((x0 + i * w / 80, y0), (x0 + (i + 1) * w / 80, y0), color=tuple(c), alpha=a, th=18)
        st = ctx.state.get("st", dict(T=800))
        mx = x0 + clamp((st["T"] - 700) / 960) * w
        L.poly([(mx, y0 - 16), (mx - 9, y0 - 32), (mx + 9, y0 - 32)], WHITE, a)
        img = text(img, "RED", x0 + 0.15 * w, y0 + 38, 16, (1, 0.4, 0.3), fade(t, ctx.w(word_red)), "c", kind="mono6", tracking=0.2)
        img = text(img, "ORANGE", x0 + 0.6 * w, y0 + 38, 16, ORANGE, fade(t, ctx.w(word_orange)), "c", kind="mono6", tracking=0.2)
        return L.composite(img, 0.4)
    return f


def cm2_over(obj, word_obj, kg_label):
    def f(ctx, img, t, u):
        L = Layer()
        x, y = W * 0.5, H * 0.62
        a = fade(t, 0.2)
        img = hud.panel(img, x - 420, y - 360, x + 420, y + 190, a, 0.55)
        s = 90
        L.rect(x - s / 2, y, x + s / 2, y + s, (0.6, 0.62, 0.66), a, fill=True)
        img = hud.dimension(L, img, (x - s / 2, y + s + 30), (x + s / 2, y + s + 30), "1 CM", a, 1.0, DIM)
        to = ctx.w(word_obj)
        k = ease_out(prog(t, to, 0.6))
        oy = lerp(y - 420, y - 2, k)
        if obj == "piano":
            draw_piano(L, x, oy, 150, WHITE, fade(t, to))
        else:
            draw_car(L, x, oy, 180, WHITE, fade(t, to))
        img = text(img, kg_label, x + 260, y + 50, 22, ACC, fade(t, to + 0.4), "lc", kind="mono6", tracking=0.12)
        img = text(img, "ON EVERY SQUARE CENTIMETRE", x + 260, y + 90, 15, DIM, fade(t, to + 0.6), "lc", tracking=0.18)
        return L.composite(img, 0.5)
    return f


def pressure_count(v0, v1, word0, word1):
    def f(ctx, img, t, u):
        t0, t1 = ctx.w(word0), ctx.w(word1)
        v = v0 + (v1 - v0) * smoother(clamp((t - t0) / max(0.3, t1 - t0)))
        img = hud.panel(img, W / 2 - 360, H - 300, W / 2 + 360, H - 90, fade(t, t0 - 0.3), 0.5)
        img = text(img, f"{v:,.0f} ×", W / 2, H - 220, 96, WHITE, fade(t, t0 - 0.3), "c", kind="xlight")
        img = text(img, "EARTH'S AIR PRESSURE", W / 2, H - 140, 18, ACC, fade(t, t0), "c", tracking=0.3)
        return img
    return f


# ═══════════════════════════ CH6 · the limit ═══════════════════════════
def trench_over(ctx, img, t, u):
    L = Layer()
    tm = ctx.w("Mariana")
    x0, y0, w, h = 470, 260, 1000, 560
    img = hud.panel(img, x0 - 60, y0 - 80, x0 + w + 60, y0 + h + 80, fade(t, tm - 0.4), 0.55)
    xs = np.linspace(0, 1, 120)
    prof = 0.18 + 0.5 * np.exp(-((xs - 0.55) / 0.08) ** 2) + 0.06 * np.sin(xs * 9)
    pts = [(x0 + x * w, y0 + 40 + p_ * h * 0.95) for x, p_ in zip(xs, prof)]
    L.poly([(x0, y0 + 40)] + pts + [(x0 + w, y0 + 40)], (0.12, 0.3, 0.55), fade(t, tm) * 0.7)
    L.polyline(pts, (0.6, 0.8, 1.0), fade(t, tm), 2, progress=prog(t, tm, 1.0))
    L.line((x0, y0 + 40), (x0 + w, y0 + 40), color=BLUE, alpha=fade(t, tm), th=2)
    bx, by = x0 + 0.55 * w, y0 + 40 + 0.68 * h * 0.95 + 0.06 * np.sin(0.55 * 9) * h
    draw_sub(L, bx, by - 30, 26, WHITE, fade(t, tm + 0.6))
    img = text(img, "MARIANA TRENCH · 11 KM DEEP", x0 + 20, y0 + 6, 18, WHITE, fade(t, tm), "lc", kind="mono6", tracking=0.14)
    img = text(img, "1,086 × EARTH'S AIR", bx + 70, by - 40, 20, ACC, fade(t, tm + 0.8), "lc", kind="mono6")
    return L.composite(img, 0.5)


def sub_limit_over(ctx, img, t, u):
    L = Layer()
    x, y = W * 0.5, H * 0.52
    a = fade(t, 0.2)
    img = hud.panel(img, x - 420, y - 220, x + 420, y + 200, a, 0.55)
    draw_sub(L, x - 200, y, 70, WHITE, a)
    img = text(img, "STRONGEST SUBMARINES", x - 60, y - 60, 22, WHITE, a, "lc", kind="mono6", tracking=0.14)
    img = text(img, "LIMIT: ~1,100 × EARTH'S AIR", x - 60, y - 16, 20, ACC, fade(t, 0.6), "lc", tracking=0.14)
    img = text(img, "YOU ARE HERE", x - 60, y + 40, 20, RED, fade(t, 1.2), "lc", kind="mono6", tracking=0.18)
    return L.composite(img, 0.5)


def crush_fn(ctx, t, u):
    tg = ctx.w("gives")
    return clamp((t - tg) / 0.9)


def crush_flash(ctx, img, t, u):
    tg = ctx.w("gives")
    d = t - tg - 0.45
    if 0 < d < 1.6:
        a = np.exp(-d / 0.25)
        img = img + a * 0.9
        L = Layer()
        r = 120 + d * 900
        L.circle((W * 0.62, H * 0.55), r, (1.0, 0.85, 0.6), np.exp(-d / 0.5), th=4)
        img = L.composite(img, 0.8)
    if d > 0.9:
        img = img * max(0.0, 1 - (d - 0.9) / 0.6) + 0 * img
    return img


@scene_factory(pairs=[("km_per_px0", "km_per_px1")])
def zoom_slice_scene(km_per_px0, km_per_px1, focus_depth=0.0, cy_screen=H * 0.35):
    """Cross-section with a log zoom. Starts showing the top layer at high magnification, ends on the whole planet."""
    def f(ctx, t, u, fi):
        img = np.zeros((H, W, 3), np.float32)
        cam = Cam(u, z=(1.0, 1.0), canvas=(2200, 1300))
        img = cam.stars(gain=0.6)
        k = smoother(min(u, 1))
        kpp = float(np.exp(lerp(np.log(km_per_px0), np.log(km_per_px1), k)))
        Rpx = RJ_KM / kpp
        # keep the focus depth at a fixed screen height early on, then centre the planet
        sy = cy_screen
        top = sy - (focus_depth / kpp)                 # screen y of the cloud tops
        cyc = top + Rpx
        c_final = H / 2
        cyy = lerp(cyc, c_final, smooth(clamp((Rpx * 2 - H) / (H * 0.5)) * 0 + clamp(1 - Rpx / (H * 3))))
        img = slice_disk(img, W / 2, cyy, Rpx, ctx.seg["start"] + ctx.beat.t0 + t)
        ctx.state["slice"] = (W / 2, cyy, Rpx, kpp)
        return img, dict(exposure=1.25, bloom=0.4)
    return f


def depth_marker(depth_km, label, color=RED, sub=None, word=None):
    def f(ctx, img, t, u):
        cx, cy, Rpx, kpp = ctx.state["slice"]
        L = Layer()
        r = Rpx - depth_km / kpp
        a = fade(t, ctx.w(word) if word else 0.2)
        ang = np.linspace(-np.pi * 0.98, -np.pi * 0.02, 240)
        pts = np.stack([cx + r * np.cos(ang), cy + r * np.sin(ang)], -1)
        pts = pts[(pts[:, 1] > -50) & (pts[:, 1] < H + 50) & (pts[:, 0] > -50) & (pts[:, 0] < W + 50)]
        if len(pts) > 2:
            L.polyline(pts, (0.02, 0.02, 0.03), a * 0.8, 6, dash=12)   # dark outline: readable on the bright slice
            L.polyline(pts, color, a, 3, dash=12)
        ty, lx = cy - r, W / 2 + 40
        if not (90 < ty < H - 60) and len(pts) > 2:
            # the top of the line is off-screen: label it where it crosses the upper-right part of the frame
            ok = pts[(pts[:, 1] > 140) & (pts[:, 1] < H - 140) & (pts[:, 0] > W / 2)]
            if len(ok):
                q = ok[np.argmin(ok[:, 1])]
                ty, lx = q[1], min(q[0] + 30, W - 420)
        if 30 < ty < H - 30:
            # dark backing: the slice behind the label is bright orange/cream at these depths
            wl = max(len(label) * 17, len(sub) * 12 if sub else 0) + 40
            img = hud.panel(img, lx - 20, ty - 50, lx - 20 + wl, ty + (46 if sub else -6), a, 0.7)
            img = text(img, label, lx, ty - 28, 20, color, a, "lc", kind="mono6", tracking=0.14)
            if sub:
                img = text(img, sub, lx, ty + 26, 15, DIM, a, "lc", tracking=0.15)
        return L.composite(img, 0.5)
    return f


def percent_over(val, word, at_y=H - 160):
    def f(ctx, img, t, u):
        tt = ctx.w(word)
        img = hud.panel(img, W - 640, at_y - 90, W - 80, at_y + 90, fade(t, tt - 0.2), 0.5)
        img = text(img, val, W - 360, at_y - 10, 84, WHITE, fade(t, tt), "c", kind="xlight")
        img = text(img, "OF THE WAY TO THE CENTRE", W - 360, at_y + 56, 15, ACC, fade(t, tt + 0.3), "c", tracking=0.22)
        return img
    return f


def planet_dim(ctx, img, t, u):
    cx, cy, Rpx, kpp = ctx.state["slice"]
    L = Layer()
    tt = ctx.w("seventy")
    if Rpx < H * 0.6:
        img = hud.dimension(L, img, (cx + Rpx + 50, cy - Rpx), (cx + Rpx + 50, cy), "70,000 KM", fade(t, tt), prog(t, tt), WHITE)
    return L.composite(img, 0.5)


# ═══════════════════════════ CH7 · the float ═══════════════════════════
def imaginary_tag(ctx, img, t, u):
    return text(img, "IMAGINARY: AN UNCRUSHABLE SHIP", W / 2 + 120, H - 90, 18, ACC, fade(t, ctx.w("Imagine") if ctx.beat.line == 1 else 0.3), "c", kind="mono6", tracking=0.2)


def car_speed_over(ctx, img, t, u):
    L = Layer()
    tm, tt = ctx.w("motorway"), ctx.w("town")
    x, y = 300, H - 230
    img = hud.panel(img, x - 140, y - 110, x + 420, y + 110, fade(t, tm - 0.4), 0.5)
    draw_car(L, x, y + 30, 70, WHITE, fade(t, tm))
    lab = "100 KM/H · MOTORWAY" if t < tt else "45 KM/H · IN TOWN"
    img = text(img, lab, x + 110, y + 10, 20, ACC, fade(t, tm), "lc", kind="mono6", tracking=0.1)
    return L.composite(img, 0.5)


def molecules_over(ctx, img, t, u):
    L = Layer()
    tb = ctx.w("squeezed")
    x0, y0 = 1180, 300
    img = hud.panel(img, x0 - 40, y0 - 70, x0 + 480, y0 + 380, fade(t, 0.2), 0.55)
    k = smoother(prog(t, tb, 1.6))
    rng = np.random.default_rng(5)
    n = int(lerp(14, 70, k))
    for i in range(n):
        px = x0 + 20 + rng.random() * 400
        py = y0 + 20 + rng.random() * 280
        L.circle((px, py), 6, (0.75, 0.85, 1.0), fade(t, 0.2), fill=True)
        L.circle((px + 10, py + 3), 6, (0.75, 0.85, 1.0), fade(t, 0.2), fill=True)
    img = text(img, "GAS" if k < 0.5 else "DENSE FLUID", x0 + 220, y0 - 30, 20, WHITE, fade(t, 0.2), "c", kind="mono6", tracking=0.2)
    return L.composite(img, 0.5)


def density_chart(ctx, img, t, u):
    """Hydrogen density vs depth (model) crossing the ship's average density → it floats."""
    L = Layer()
    x0, y0, w, h = 380, 230, 1060, 560
    img = hud.panel(img, x0 - 80, y0 - 90, x0 + w + 120, y0 + h + 100, fade(t, 0.1), 0.6)
    zs = np.linspace(0, 6000, 200)
    rho = np.array([V.M.profile(z * 1e3)[2] for z in zs])
    xs = x0 + zs / 6000 * w
    ys = y0 + h - rho / 450 * h
    L.polyline(np.stack([xs, ys], -1), ORANGE, fade(t, 0.2), 3, progress=prog(t, 0.2, 2.0))
    td = ctx.w("dense")
    ys_ship = y0 + h - 358 / 450 * h
    L.line((x0, ys_ship), (x0 + w, ys_ship), color=WHITE, alpha=fade(t, td), th=2, dash=12)
    img = text(img, "YOUR SHIP: 358 KG PER M³", x0 + 20, ys_ship - 30, 16, WHITE, fade(t, td), "lc", tracking=0.12)
    img = text(img, "HYDROGEN AROUND YOU", x0 + w * 0.35, y0 + h - 90, 16, ORANGE, fade(t, 0.4), "lc", tracking=0.12)
    xf = x0 + 5350 / 6000 * w
    L.circle((xf, ys_ship), 12, GREEN, fade(t, td + 0.6), th=3)
    img = text(img, "FLOAT", xf, ys_ship - 46, 22, GREEN, fade(t, td + 0.6), "c", kind="mono6", tracking=0.2)
    L.line((x0, y0 + h), (x0 + w, y0 + h), color=DIM, alpha=0.6, th=1)
    img = text(img, "DEPTH (KM)", x0 + w, y0 + h + 40, 15, DIM, fade(t, 0.1), "rc", tracking=0.2)
    img = text(img, "DENSITY", x0, y0 - 40, 15, DIM, fade(t, 0.1), "lc", tracking=0.2)
    for d in (0, 2000, 4000, 6000):
        img = text(img, f"{d:,}", x0 + d / 6000 * w, y0 + h + 16, 14, DIM, fade(t, 0.1), "c")
    return L.composite(img, 0.5)


def float_hold(ctx, t, u):
    """Floating: a slow buoyant bob (the fall is over, so gentle up/down motion is now correct)."""
    gt = ctx.seg["start"] + ctx.beat.t0 + t
    return 0.62, V.SHIP_Y + 0.012 * np.sin(gt * 0.8), 100


# ═══════════════════════════ CH8 · the heart ═══════════════════════════
def atoms_over(stage):
    def f(ctx, img, t, u):
        L = Layer()
        x0, y0, w, h = 1120, 260, 600, 440
        a = fade(t, 0.2)
        img = hud.panel(img, x0 - 40, y0 - 80, x0 + w + 40, y0 + h + 60, a, 0.6)
        rng = np.random.default_rng(2)
        pts = [(x0 + 60 + (i % 6) * 96 + (48 if (i // 6) % 2 else 0), y0 + 60 + (i // 6) * 90) for i in range(30)]
        tm = ctx.w("metal") if stage == 0 else 0.0
        k = clamp((t - tm) / 1.2) if stage == 0 else 1.0
        for (px, py) in pts:
            if px > x0 + w - 20:
                continue
            L.circle((px, py), 9, (1.0, 0.6, 0.45), a, fill=True)
            if k < 1:
                L.circle((px, py), 22, BLUE, a * (1 - k) * 0.7, th=1)
        n = 50
        for i in range(n):
            ph = (rng.random() + t * (0.08 + 0.3 * k) * (0.6 + rng.random())) % 1.0
            ex = x0 + 20 + ph * (w - 40)
            ey = y0 + 30 + rng.random() * (h - 60) + np.sin(t * 3 + i) * 6
            L.circle((ex, ey), 3, (0.6, 0.85, 1.0), a * (0.3 + 0.7 * k), fill=True)
        img = text(img, "HYDROGEN NUCLEI", x0, y0 - 40, 15, (1.0, 0.6, 0.45), a, "lc", tracking=0.18)
        img = text(img, "FREE ELECTRONS", x0 + w, y0 - 40, 15, BLUE, a * (0.3 + 0.7 * k), "rc", tracking=0.18)
        if stage == 0:
            img = text(img, "LIQUID METAL", x0 + w / 2, y0 + h + 30, 24, WHITE, fade(t, tm), "c", kind="mono6", tracking=0.22)
        else:
            tw = ctx.w("copper")
            L.line((x0 + 40, y0 + h + 30), (x0 + w - 40, y0 + h + 30), color=(0.95, 0.55, 0.3), alpha=fade(t, tw), th=10)
            img = text(img, "LIKE A COPPER WIRE", x0 + w / 2, y0 + h + 66, 15, (0.95, 0.6, 0.35), fade(t, tw), "c", tracking=0.2)
        return L.composite(img, 0.5)
    return f


def field_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    tf = ctx.w("magnetic")
    for k, Lsh in enumerate((1.6, 2.2, 3.0, 4.2)):
        lam = np.linspace(-1.1, 1.1, 120)
        rr = Lsh * np.cos(lam) ** 2
        for sgn in (-1, 1):
            x = X + sgn * rr * np.cos(lam) * R
            y = Y - rr * np.sin(lam) * R
            ok = (rr >= 1.0)
            L.polyline(np.stack([x[ok], y[ok]], -1), (0.6, 0.7, 1.0), fade(t, tf + k * 0.15) * 0.8, 2, progress=prog(t, tf + k * 0.15, 1.2))
    img = text(img, "STRONGEST MAGNETIC FIELD OF ANY PLANET", W / 2, H - 100, 20, (0.7, 0.8, 1.0), fade(t, tf + 0.5), "c", kind="mono6", tracking=0.15)
    return L.composite(img, 0.5)


def spin_over(ctx, img, t, u):
    X, Y, R, cam = ctx.state["globe"]
    L = Layer()
    ts = ctx.w("spins")
    ang = np.linspace(np.pi * 0.15, np.pi * 0.85, 60)
    L.polyline(np.stack([X + R * 1.15 * np.cos(ang), Y + R * 0.25 * np.sin(ang) + R * 0.0], -1), WHITE, fade(t, ts), 3, progress=prog(t, ts))
    L.arrow((X + R * 1.15 * np.cos(np.pi * 0.2), Y + R * 0.25 * np.sin(np.pi * 0.2)), (X + R * 1.15, Y), color=WHITE, alpha=fade(t, ts + 0.6), th=3)
    img = text(img, "ONE TURN EVERY 9.9 HOURS", X, Y + R + 70, 22, WHITE, fade(t, ctx.w("ten")), "c", kind="mono6", tracking=0.14)
    return L.composite(img, 0.5)


def moon_sky_over(ctx, img, t, u):
    """Night sky: Jupiter as a bright point; its magnetosphere outlined, about the size of the full Moon (shown beside it)."""
    L = Layer()
    jx, jy = W * 0.58, H * 0.36
    a = fade(t, ctx.w("magnetic") - 0.2)
    glow_dot(img, jx, jy, (1.0, 0.95, 0.85), 3.5, 3.0)
    ang = np.linspace(0, 2 * np.pi, 200)
    r = 62
    xs_ = jx + r * np.cos(ang) * (1 + 0.8 * (np.cos(ang) > 0) * np.cos(ang) ** 2 * 2.2)
    ys_ = jy + r * np.sin(ang) * 0.85
    L.polyline(np.stack([xs_, ys_], -1), (0.65, 0.75, 1.0), a * 0.8, 2, closed=True, dash=8)
    mx, my = W * 0.30, H * 0.30
    tm = ctx.w("Moon")
    glow_dot(img, mx, my, (1.0, 0.98, 0.92), 60, 0.0)
    render_planet(img, mx, my, 62, "moon", spin=1.0, tilt=0.1, light=(0.2, 0.1, 1.0), atmo=(0, 0, 0)) if t > tm - 0.4 else None
    img = text(img, "FULL MOON (FOR SCALE)", mx, my + 100, 15, DIM, fade(t, tm), "c", tracking=0.18)
    img = text(img, "JUPITER'S MAGNETIC BUBBLE", jx + 40, jy + 110, 16, (0.7, 0.8, 1.0), a, "c", tracking=0.18)
    return L.composite(img, 0.5)


def diamond_over(ctx, img, t, u):
    L = Layer()
    rng = np.random.default_rng(12)
    td = ctx.w("diamonds")
    for i in range(60):
        ph = (rng.random() + t * 0.12 * (0.5 + rng.random())) % 1.0
        x = W * (0.25 + 0.5 * rng.random())
        y = -40 + ph * (H + 80)
        tw = 0.5 + 0.5 * np.sin(t * 6 + i)
        star_spikes(img, x, y, (0.85, 0.95, 1.0), 10 + 8 * tw, 0.9 * fade(t, td) * tw)
        glow_dot(img, x, y, (0.9, 0.95, 1.0), 2.5, 2.2 * fade(t, td))
    img = text(img, "DIAMOND RAIN?", W / 2, 140, 40, WHITE, fade(t, td), "c", kind="light", tracking=0.1)
    img = text(img, "A HYPOTHESIS · UNCONFIRMED", W / 2, 196, 16, ACC, fade(t, td + 0.4), "c", tracking=0.25)
    return L.composite(img, 0.4)


def core_compare(ctx, img, t, u):
    L = Layer()
    te, tj = ctx.w("expected"), ctx.w("Juno")
    x1, x2, y = 520, 1400, 560
    img = hud.panel(img, x1 - 260, y - 300, x2 + 260, y + 240, fade(t, 0.1), 0.6)
    L.circle((x1, y), 120, (0.75, 0.7, 0.6), fade(t, te), fill=True)
    img = text(img, "EXPECTED: A SOLID BALL", x1, y + 180, 18, DIM, fade(t, te), "c", kind="mono6", tracking=0.14)
    L.cross((x1 + 150, y - 150), 22, RED, fade(t, tj), 4, prog(t, tj, 0.4))
    for r_ in range(200, 10, -10):
        L.circle((x2, y), r_, (1.0, 0.85, 0.6), fade(t, tj) * 0.16, fill=True)
    img = text(img, "JUNO: A FUZZY, DILUTE CORE", x2, y + 230, 18, ACC, fade(t, tj + 0.3), "c", kind="mono6", tracking=0.14)
    return L.composite(img, 0.4)


def recap_over(ctx, img, t, u):
    L = Layer()
    rows = [("seven", "7 MIN", "DEEPER THAN ANYTHING WE'VE SENT", BLUE),
            ("Ninety", "98 MIN", "THE STRONGEST SHIP WE CAN BUILD IS CRUSHED", RED),
            ("six", "6.6 DAYS", "FLOATING, 5,350 KM DOWN · NO BOTTOM", GREEN)]
    img = hud.panel(img, 300, 250, W - 300, 830, fade(t, 0.1), 0.6)
    for i, (w, big, small, col) in enumerate(rows):
        tt = ctx.w(w)
        yy = 360 + i * 170
        img = text(img, big, 560, yy, 64, WHITE, fade(t, tt), "rc", kind="xlight")
        L.line((600, yy - 30), (600, yy + 30), color=col, alpha=fade(t, tt), th=3)
        img = text(img, small, 640, yy, 20, col, fade(t, tt + 0.2), "lc", kind="mono6", tracking=0.12)
    return L.composite(img, 0.5)


def sun_compare_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.04), canvas=(2000, 1200))
    img = cam.stars(gain=0.6)
    gt = ctx.seg["start"] + ctx.beat.t0 + t
    globe(img, *cam.p(W * 0.28, H * 0.5), cam.r(170), spin=GRS_SPIN + gt * 0.02, tilt=0.1, light=(0.7, 0.2, 0.7))
    sx, sy = cam.p(W * 1.42, H * 0.5)
    glow_dot(img, sx, sy, (1.0, 0.85, 0.6), 1500, 0.18)
    from engine.planet import render_sun_disk
    render_sun_disk(img, sx, sy, cam.r(1350), gt, filter_look=False)
    ctx.state["sun"] = (sx, sy)
    return img, dict(exposure=1.0, bloom=0.5)


def composition_over(ctx, img, t, u):
    L = Layer()
    img = hud.panel(img, W * 0.12, H - 330, W * 0.88, H - 130, fade(t, 0.2), 0.6)
    for (x, nm) in ((W * 0.28, "JUPITER"), (W * 0.72, "THE SUN")):
        y = H - 230
        tt = ctx.w("stuff")
        L.line((x - 130, y), (x - 130 + 260 * 0.73 * prog(t, tt), y), color=(0.9, 0.9, 1.0), alpha=fade(t, tt), th=18)
        L.line((x - 130 + 260 * 0.73, y), (x - 130 + 260 * (0.73 + 0.25 * prog(t, tt + 0.4)), y), color=ACC, alpha=fade(t, tt + 0.4), th=18)
        img = text(img, nm, x, y - 56, 20, WHITE, fade(t, 0.2), "c", kind="mono6", tracking=0.2)
        img = text(img, "HYDROGEN · HELIUM", x, y + 40, 14, DIM, fade(t, tt + 0.5), "c", tracking=0.18)
    return L.composite(img, 0.5)


def eighty_over(ctx, img, t, u):
    L = Layer()
    te = ctx.w("eighty")
    n = int(80 * smoother(prog(t, te, 2.0)))
    for i in range(n):
        x = 300 + (i % 16) * 82
        y = 330 + (i // 16) * 82
        L.circle((x, y), 30, (0.95, 0.75, 0.5), fade(t, te) * 0.85, fill=True)
    img = hud.panel(img, 220, H - 270, 1660, H - 90, fade(t, te), 0.5)
    img = text(img, f"× {n}", W / 2, H - 200, 80, WHITE, fade(t, te), "c", kind="xlight")
    img = text(img, "JUPITERS TO IGNITE A STAR", W / 2, H - 126, 18, ACC, fade(t, te + 0.3), "c", tracking=0.25)
    return L.composite(img, 0.5)


def rogue_scene(ctx, t, u, fi):
    cam = Cam(u, z=(1.0, 1.12), canvas=(2400, 1300))
    img = cam.stars(gain=1.0)
    k = smoother(min(u, 1))
    X, Y = cam.p(lerp(W * 0.75, W * 0.55, k), H * 0.5)
    R = cam.r(lerp(120, 330, k))
    xs, ys = grid()
    d = np.sqrt((xs - X) ** 2 + (ys - Y) ** 2)
    m = clamp((R - d) * 1.0)[..., None]
    rim = (np.exp(-((d - R) / 5.0) ** 2) * clamp((xs - X) / R + 0.4))[..., None]
    img = img * (1 - m) + np.array([0.012, 0.012, 0.018], np.float32) * m + rim * np.array([0.5, 0.6, 0.9], np.float32) * 0.6
    return img, dict(exposure=1.3, bloom=0.5)


def tonights(s, at_word, y=H - 110):
    return caption(s, at=at_word, y=y)


# ═══════════════════════════ BEAT SHEET ═══════════════════════════
G = space_globe
BEATS = {
    "open1": [
        B(0, G(R=(330, 370), z=(1.0, 1.05)), None, name="Jupiter"),
        B(1, G(R=(330, 330), cx=W / 2 - 250, extra=o1_earths), o1_earths_over, name="1,321 Earths fit inside; Earth to scale"),
        B(2, G(R=(300, 340), cx=W / 2 - 120), o1_fall_over, name="you fall into it: trajectory"),
        B(3, G(R=(340, 380), cx=W / 2 - 120, z=(1.05, 1.15)), o1_crash_over, name="not crash: fall"),
    ],
    "open2": [
        B(0, cutaway_scene(cx=W / 2 + 280, reveal=lambda c, t, u: smooth(clamp(t / 1.5))), o2_over, name="no ground, no surface (cutaway)"),
        B(1, cutaway_scene(cx=W / 2 + 280, z=(1.06, 1.15)), o2b_over, name="thicker and hotter all the way down"),
    ],
    "open3": [
        B(0, stars_bg(gain=0.5), o3_chart, name="model vs Galileo-measured temperature"),
        B(1, atmos(300, 460), hud_in("Every"), name="every number on screen comes from the sim"),
        B(2, atmos(150000, 160000, glow_boost=0.8), over_all(HUD, big_q("didn't")), name="something unexpected"),
        B(3, atmos(V.T_FLOAT * 0.85, V.T_FLOAT), HUD, name="the falling stops"),
    ],
    "title": [B(0, dimmed(G(R=(380, 400), z=(1.0, 1.04), stars_gain=0.7), 0.32, 2), None, name="title")],
    "c1a": [
        B(0, G(R=(200, 220), cx=W / 2 - 200), c1_ship_over, name="get there: ship approaching"),
        B(1, G(R=(220, 240), cx=W / 2 - 200, belts_a=belts_on), c1_belts_over, name="radiation belts"),
        B(2, G(R=(240, 250), cx=W / 2 - 200, belts_a=lambda c, t, u: 1.0), c1_lethal_over, name="lethal within hours"),
        B(3, G(R=(250, 260), cx=W / 2 - 200, belts_a=lambda c, t, u: 1.0), c1_juno_over, name="Juno's titanium vault"),
    ],
    "c1b": [
        B(0, G(R=(300, 320), cx=W / 2 - 250), None, name="the speed"),
        B(1, G(R=(320, 330), cx=W / 2 - 250), c1_speed_over, name="60 km/s counter"),
        B(2, atlantic_scene, atlantic_over, name="Atlantic in 1.5 minutes"),
    ],
    "c1c": [
        B(0, limb_scene, probe_entry_over(False), name="Galileo probe 1995"),
        B(1, limb_scene, over_all(probe_entry_over(True, False),
                                  thermo_bars([("SURFACE OF THE SUN", 5500, (1.0, 0.85, 0.5), 0.6), ("GAS IN FRONT OF THE PROBE", 16000, ORANGE, "hotter")],
                                              x0=600, y0=640, w=760)), name="hotter than the Sun's surface"),
        B(2, dimmed(limb_scene, 0.5), heatshield_over, name="heat shield burned away"),
    ],
    "c1d": [
        B(0, atmos(0, 0, z_override=ABOVE, v_override=STILL, thrust=1.0, ship=HOVER), cloud_label("STOPPED ABOVE THE CLOUDS", None, "stop", y=H - 120), name="engines stop you above the clouds"),
        B(1, atmos(0, 0, z_override=ABOVE, v_override=STILL, thrust=0.6, ship=(0.62, 0.50, 150)), c1d_dims, name="12 t, 4 m, titanium"),
        B(2, atmos(0, 0, z_override=ABOVE, v_override=STILL, thrust=thrust_off, ship=HOVER), hud_in("off"), name="engines off: HUD appears"),
        B(3, atmos(0, 6, ship=drop_ship), HUD, name="you fall"),
    ],
    "c2a": [
        B(0, atmos(6, 12), over_all(HUD, weight_over), name="weight x2.5"),
        B(1, atmos(12, 17), over_all(HUD, weight_over), name="every move harder"),
        B(2, atmos(17, 22, ship=(0.66, 0.58, 70)), over_all(HUD, cloud_label("AMMONIA ICE CLOUDS", "0.6 – 0.9 BAR", "floor", y=H * 0.82)), name="white cloud floor"),
        B(3, atmos(22, 27, ship=(0.66, 0.58, 70)), over_all(HUD, thermo_over("ammonia", lambda c, t, u: "−130 °C", "COLDER THAN −100 °C")), name="ammonia ice, -130 C"),
    ],
    "c2b": [
        B(0, grs_scene, None, name="it's all moving"),
        B(1, grs_scene, winds_over, name="540 km/h jet streams"),
        B(2, grs_scene, grs_over, name="Great Red Spot wider than Earth"),
    ],
    "c2c": [
        B(0, atmos(27, 38), HUD, name="drop into the white clouds"),
        B(1, atmos(38, 42), HUD, name="thin air, nothing slows you"),
        B(2, atmos(42, 52), over_all(HUD, caption("FASTER THAN TWO AIRLINERS", at="two", y=H - 110)), name="2,000+ km/h at 40 s"),
    ],
    "c2d": [
        B(0, atmos(52, 66), over_all(HUD, cloud_label("AMMONIUM HYDROSULFIDE", "1 – 2 BAR", "Brown", y=H * 0.82, color=ORANGE)), name="brown second layer"),
        B(1, atmos(66, 100), over_all(HUD, caption("SMELLS LIKE ROTTEN EGGS + CLEANING FLUID", at="smell", y=H - 110, color=ORANGE)), name="the smell"),
        B(2, grs_scene, caption("WHAT PAINTS THE STRIPES? STILL DEBATED", at="nobody", y=H - 110), name="colours, still debated"),
    ],
    "c3a": [
        B(0, atmos(140, 156), HUD, name="2.5 min, 50 km, third layer"),
        B(1, atmos(156, 170), over_all(HUD, cloud_label("WATER CLOUDS", "LIKE ON EARTH", "Water", y=H * 0.82, color=BLUE)), name="water clouds"),
        B(2, atmos(170, 182), HUD, name="something strange"),
        B(3, atmos(182, 194), over_all(HUD, thermo_over("twenty", lambda c, t, u: "+20 °C", "A WARM SPRING DAY", color=GREEN, level=0.55)), name="20 C outside"),
        B(4, atmos(194, 200), over_all(HUD, diver_over), name="7x pressure = 60 m underwater"),
    ],
    "c3b": [
        B(0, atmos(200, 210, light=0.7), HUD, name="storms are born here"),
        B(1, storm_scene, storm_over(1), name="ice flung 25 km up"),
        B(2, storm_scene, storm_over(2), name="mushballs"),
        B(3, nightside_scene, caption("LIGHTNING ON JUPITER'S NIGHT SIDE", at="lightning", y=H - 110, color=(0.75, 0.85, 1.0), sub="SEEN BY JUNO"), name="night-side lightning"),
    ],
    "c3c": [
        B(0, atmos(210, 245, light=0.3), HUD, name="last sunlight gone"),
        B(1, atmos(245, 275, light=0.2), HUD, name="completely dark"),
        B(2, atmos(275, 320, light=0.9), HUD, name="only lightning"),
    ],
    "c4a": [
        B(0, atmos(330, 345), over_all(HUD, thermo_over("boiling", lambda c, t, u: "+100 °C", "HOTTER THAN BOILING WATER", color=RED, level=0.75)), name="100 C"),
        B(1, atmos(345, 360, ship=CLOSE), HUD, name="still 800 km/h"),
        B(2, atmos(360, 395, ship=WIDE), over_all(HUD, caption("THICKER AIR = MORE DRAG", at="thicker", y=H - 110)), name="air thicker, slowing you"),
    ],
    "c4b": [
        B(0, atmos(425, 445, ship=LEFT), HUD, name="7 minutes: milestone"),
        B(1, dimmed(atmos(445, 450), 0.4), galileo_over(1), name="Galileo went silent here"),
        B(2, dimmed(atmos(450, 455), 0.4), galileo_over(2), name="58 minutes on a parachute"),
        B(3, atmos(455, 470, ship=HIGH), over_all(HUD, stat("22 × · 150 °C", "WHERE GALILEO DIED", y=H - 230)), name="22x, 150 C"),
        B(4, atmos(470, 520), over_all(HUD, deepest_over), name="nothing has been deeper"),
        B(5, atmos(520, 600, ship=CLOSE), over_all(HUD, caption("FROM HERE ON: PHYSICS, NOT MEASUREMENTS", at="nobody", y=H - 110, color=ACC)), name="beyond: physics"),
    ],
    "c5a": [
        B(0, atmos(1700, 1780, ship=WIDE), HUD, name="half an hour, 300 km"),
        B(1, atmos(1780, 1830, ship=CLOSE), HUD, name="past 500 C"),
        B(2, atmos(1830, 1860, ship=LEFT), HUD, name="something you'd never expect"),
        B(3, atmos(1860, 2000, ship=WIDE), HUD, name="the darkness starts to glow"),
    ],
    "c5b": [
        B(0, atmos(2000, 2080, ship=(0.70, 0.58, 110)), over_all(HUD, stove_over), name="glows like a stove ring"),
        B(1, atmos(2080, 2200, roll=2.5, ship=LOW), HUD, name="the air itself glows"),
        B(2, atmos(2200, 2350, ship=HIGH), over_all(HUD, colour_strip("Red", "orange")), name="red, then orange"),
    ],
    "c5c": [
        B(0, atmos(2350, 2420, ship=CLOSE), HUD, name="pressure climbing"),
        B(1, atmos(2420, 2560, ship=HIGH), over_all(HUD, pressure_count(200, 300, "Two", "three")), name="200x then 300x"),
        B(2, dimmed(atmos(2560, 2600), 0.45), cm2_over("piano", "piano", "ABOUT 320 KG"), name="a grand piano on every cm2"),
    ],
    "c6a": [
        B(0, atmos(5300, 5450, ship=WIDE), HUD, name="an hour and a half"),
        B(1, atmos(5450, 5650, ship=CLOSE), HUD, name="600 km, 1000 C, orange"),
        B(2, atmos(5650, 5800, ship=HIGH), over_all(HUD, pressure_count(1000, 1100, "pressure", "eleven")), name="1,100x"),
        B(3, dimmed(atmos(5800, 5820), 0.4), trench_over, name="= bottom of the Mariana Trench"),
    ],
    "c6b": [
        B(0, dimmed(atmos(5820, 5840), 0.4), sub_limit_over, name="limit of the strongest subs"),
        B(1, dimmed(atmos(5840, 5860), 0.45), cm2_over("car", "car", "ABOUT 1,100 KG"), name="a small car on every cm2"),
        B(2, atmos(5860, V.T_CRUSH + 8, crush=crush_fn, ship=(0.55, 0.58, 210)), over_all(HUD, crush_flash), name="98 minutes: the ship gives way"),
    ],
    "c6c": [
        B(0, zoom_slice_scene(0.95, 0.8, focus_depth=0.0, cy_screen=H * 0.18), depth_marker(579, "YOU: 579 KM", RED), name="perspective: the crush depth"),
        B(1, zoom_slice_scene(0.8, 160.0, cy_screen=H * 0.18), over_all(depth_marker(579, "579 KM", RED), planet_dim), name="600 km vs 70,000 km"),
        B(2, zoom_slice_scene(160.0, 175.0), over_all(planet_dim, percent_over("0.8 %", "percent")), name="not even 1%"),
    ],
    "c7a": [
        B(0, atmos(V.T_CRUSH, V.T_CRUSH + 300, ship=CLOSE), HUD, name="let's cheat"),
        B(1, atmos(V.T_CRUSH + 300, V.T_CRUSH + 900), over_all(HUD, imaginary_tag), name="uncrushable, unmeltable ship"),
        B(2, atmos(V.T_CRUSH + 900, V.T_CRUSH + 1500, ship=WIDE), HUD, name="how far does it get?"),
        B(3, atmos(V.T_CRUSH + 1500, V.T_CRUSH + 2500, ship=LEFT), HUD, name="the simulation surprised us"),
    ],
    "c7b": [
        B(0, atmos(12000, 30000, ship=CLOSE), over_all(HUD, car_speed_over), name="car on a motorway, then in town"),
        B(1, atmos(30000, 60000, ship=HIGH, roll=2.0), HUD, name="hours, then days"),
        B(2, atmos(60000, 140000, ship=WIDE), HUD, name="2,000 km, 3,000 km"),
        B(3, atmos(140000, 200000), over_all(HUD, molecules_over), name="stops behaving like a gas"),
    ],
    "c7c": [
        B(0, atmos(200000, 240000, ship=LOW), over_all(HUD, caption("NO SURFACE. NO SPLASH.", at="splash", y=H - 110)), name="no splash"),
        B(1, atmos(240000, 300000, ship=WIDE, roll=2.0), HUD, name="thicker until it flows like a liquid"),
        B(2, atmos(300000, 520000, ship=LEFT), HUD, name="5,000 km: the ship stops"),
        B(3, atmos(520000, V.T_FLOAT, ship=float_hold, roll=1.5), HUD, name="not because it hit anything"),
        B(4, stars_bg(gain=0.4), density_chart, name="hydrogen as dense as the ship: buoyancy"),
    ],
    "c7d": [
        B(0, atmos(V.T_FLOAT, V.T_FLOAT, ship=float_hold), HUDF, name="you float"),
        B(1, atmos(V.T_FLOAT, V.T_FLOAT, ship=float_hold), over_all(HUDF, stat("6.6 DAYS", "5,350 KM DOWN · NO SURFACE, NO FLOOR", y=H - 230)), name="6.5 days, 5,350 km"),
        B(2, zoom_slice_scene(30.0, 175.0, cy_screen=H * 0.18), over_all(depth_marker(5350, "YOU: FLOATING, 5,350 KM", GREEN), percent_over("7.7 %", "tenth")), name="less than a tenth of the way"),
        B(3, atmos(V.T_FLOAT, V.T_FLOAT, ship=float_hold), caption("JUPITER WON'T LET YOU SINK", at="sink", y=H - 110), name="Jupiter won't let you sink"),
    ],
    "c8a": [
        B(0, zoom_slice_scene(40.0, 120.0, focus_depth=5350, cy_screen=H * 0.25), depth_marker(5350, "YOU STOPPED HERE", GREEN), name="keep going without you"),
        B(1, zoom_slice_scene(120.0, 140.0), depth_marker(10000, "1,000,000 × EARTH'S AIR", WHITE, sub="~10,000 KM DOWN", word="million"), name="a million times the pressure"),
        B(2, zoom_slice_scene(140.0, 150.0), depth_marker(10000, "HYDROGEN CHANGES", WHITE), name="hydrogen turns into something else"),
        B(3, zoom_slice_scene(150.0, 160.0), atoms_over(0), name="a liquid metal"),
    ],
    "c8b": [
        B(0, stars_bg(gain=0.4), atoms_over(1), name="electrons flow like in copper"),
        B(1, G(R=(300, 310)), spin_over, name="spins every 10 hours"),
        B(2, G(R=(260, 270)), field_over, name="strongest magnetic field"),
    ],
    "c8c": [
        B(0, night(set="ridge", time="night"), moon_sky_over, name="magnetosphere ~ full Moon in our sky"),
        B(1, night(set="ridge", time="night"), over_all(moon_sky_over, caption("600+ MILLION KM AWAY", at="six", y=H - 110)), name="600 million km away"),
    ],
    "c8d": [
        B(0, dimmed(atmos(V.T_FLOAT, V.T_FLOAT, ship=(0, 0, 0)), 0.5, 4), diamond_over, name="diamond rain hypothesis"),
        B(1, dimmed(atmos(V.T_FLOAT, V.T_FLOAT, ship=(0, 0, 0)), 0.5, 4), over_all(diamond_over, big_q("Nobody")), name="nobody knows"),
    ],
    "c8e": [
        B(0, zoom_slice_scene(160.0, 120.0), depth_marker(RJ_KM * 0.7, "THE CORE", ACC), name="at the centre, a core"),
        B(1, stars_bg(gain=0.4), core_compare, name="fuzzy core, not a solid ball"),
        B(2, stars_bg(gain=0.4), thermo_bars([("SURFACE OF THE SUN", 5500, (1.0, 0.85, 0.5), 0.4), ("JUPITER'S CENTRE", 20000, ORANGE, "twenty")],
                                             maxv=21000, x0=520, y0=440), name="20,000 C, 3x the Sun's surface"),
        B(3, zoom_slice_scene(120.0, 110.0), stat("40,000,000 ×", "EARTH'S AIR PRESSURE AT THE CENTRE", y=H - 220), name="tens of millions x pressure"),
    ],
    "end1": [
        B(0, zoom_slice_scene(170.0, 170.0), None, name="that's the fall"),
        B(1, stars_bg(gain=0.4), recap_over, name="recap 1"),
        B(2, stars_bg(gain=0.4), recap_over, name="recap 2"),
        B(3, stars_bg(gain=0.4), recap_over, name="recap 3"),
    ],
    "end2": [
        B(0, sun_compare_scene, composition_over, name="same stuff as the Sun"),
        B(1, stars_bg(gain=0.5), eighty_over, name="80x more mass to ignite"),
        B(2, G(R=(360, 380), z=(1.0, 1.06)), caption("THE PLANET THAT NEVER BECAME A STAR", at="never", y=H - 110), name="never became a star"),
    ],
    "end3": [
        B(0, G(R=(360, 120), z=(1.0, 0.9)), None, name="leave the planets behind"),
        B(1, rogue_scene, caption("NEXT: A PLANET WITH NO STAR", at="star", y=H - 110, color=ACC), name="a rogue planet heading our way"),
    ],
    "outro": [B(0, G(R=(150, 160), stars_gain=0.6), None, name="end screen")],
}
