"""Scene + overlay builders for the Jupiter episode. Every descent frame reads its depth / speed / temperature / pressure
from the fall simulation (ep_jupiter/model.py), so the picture and the on-screen counters always agree."""
import numpy as np
import cv2
from engine.core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                         fast_blur, grid, cached, splat_points, star_color)
from engine.planet import render_planet
from engine.scenes2 import Cam
from engine import hud
from engine.hud import Layer, text, fade, prog, typed, WHITE, ACC, BLUE, RED, GREEN, DIM
from engine.jupiter import Descent, globe, belts, slice_disk, slice_color, GRS_SPIN, GRS_TILT, RJ_KM, thermal
from ep_jupiter import model as M
from engine.beats import scene_factory, kw_at
from ep_blackhole.vis import night  # noqa  (night-sky sets from engine.ground2)

# ═══════════════════════════ simulation lookup ═══════════════════════════


def _sim():
    def mk():
        a = M.fall(dt=0.1, z_max=600e3)
        d, _ = M.deep_fall(z0=a[-1, 1], t0=a[-1, 0])
        return np.vstack([a[::5], d]).astype(np.float64)
    return cached("jup_sim_v2", mk)


SIM = _sim()
TAU_END = float(SIM[-1, 0])


def at(tau):
    """State of the fall tau seconds after release: z (km), v (km/h), T (K), P (bar)."""
    tau = float(np.clip(tau, 0, TAU_END))
    t = SIM[:, 0]
    return dict(tau=tau, z=float(np.interp(tau, t, SIM[:, 1])) / 1e3, v=float(np.interp(tau, t, SIM[:, 2])) * 3.6,
                T=float(np.interp(tau, t, SIM[:, 3])), P=float(np.interp(tau, t, SIM[:, 4])))


def tau_at(col, value):
    i = int(np.argmax(SIM[:, col] >= value))
    return float(SIM[i, 0])


T_CRUSH = tau_at(4, 1100.0)          # ~98 min
T_GALILEO = tau_at(4, 22.0)          # ~7.4 min
T_GLOW = tau_at(3, 798.0)            # ~31 min
T_WATER = tau_at(1, 50e3)
T_FLOAT = TAU_END                    # ~6.6 days


def lerp_tau(a, b, k):
    """Interpolate sim time; geometric when the range spans orders of magnitude (time-lapse)."""
    if a > 0 and b / a > 6:
        return float(np.exp(np.log(a) + (np.log(b) - np.log(a)) * k))
    return a + (b - a) * k


# ═══════════════════════════ the descent scene ═══════════════════════════
_D = {}


def D():
    if "d" not in _D:
        _D["d"] = Descent(seed=5)
    return _D["d"]


# The camera falls WITH the ship, so the ship's height on screen is fixed: any upward move would read as climbing.
SHIP_Y = 0.58


@scene_factory(pairs=[("tau0", "tau1", "log")], dyn=["ship", "thrust", "crush", "z_override", "v_override"])
def atmos(tau0, tau1, ship=(0.62, SHIP_Y, 100), light=0.0, beams=None, crush=None, glow_boost=1.0, ease=None,
          z_override=None, v_override=None, thrust=0.0, roll=0.0, exposure=None, ship_move=None):
    """Descent scene for one beat. tau runs from tau0 to tau1 (sim seconds) across the beat."""
    def f(ctx, t, u, fi):
        k = min(u, 1.0) if ease is None else ease(min(u, 1.0))
        tau = lerp_tau(tau0, tau1, k)
        st = at(tau)
        z = st["z"] if z_override is None else z_override(ctx, t, u)
        v = st["v"] if v_override is None else v_override(ctx, t, u)
        ctx.state["tau"] = tau
        ctx.state["st"] = st
        gt = ctx.seg["start"] + ctx.beat.t0 + t
        sp = ship if ship_move is None else ship_move
        sx, sy, sr = sp(ctx, t, u) if callable(sp) else sp
        bob = np.sin(gt * 3.1) * 1.5 * clamp(v / 1500)      # buffeting only; no slow up/down drift
        e0, _ = thermal(st["T"])
        bm = clamp((z - 55) / 25) * (1 - 0.8 * clamp(e0 / 0.4)) if beams is None else beams
        cr = 0.0 if crush is None else crush(ctx, t, u)
        sh = dict(x=W * sx + np.sin(gt * 0.4) * 12, y=H * sy + bob, r=sr, t=gt, beams=bm, crush=cr,
                  hull_glow=clamp((st["T"] - 950) / 700) * (1 - cr))
        # how far the world has streamed past the falling camera: the integral of the ship's real speed over the whole
        # continuous shot. It never pauses while the ship is falling, slows only as the ship slows, stops when it
        # floats, and never runs backwards (docs/QUALITY_GATE.md #10, #14)
        scroll, motion = run_scroll(ctx, gt)
        img = D().render(z, v, st["T"], gt, ship=sh if sr > 0 else None, light_rate=light, flash_seed=int(ctx.seg["start"] * 7) % 997,
                         glow_boost=glow_boost, cam_roll=roll * np.sin(gt * 0.9), scroll=scroll, motion=motion)
        if callable(thrust) or thrust > 0:
            th = thrust if not callable(thrust) else thrust(ctx, t, u)
            if th > 0:
                for sgn in (-1, 1):
                    glow_dot(img, sh["x"] + sgn * 0.42 * sr, sh["y"] + 0.95 * sr, (0.6, 0.75, 1.0), 10, 3.0 * th)
                    glow_dot(img, sh["x"] + sgn * 0.42 * sr, sh["y"] + 1.3 * sr, (0.5, 0.7, 1.0), 50, 0.6 * th)
        e, _ = thermal(st["T"])
        ex = exposure if exposure is not None else (1.45 - 0.75 * clamp(e / 0.6) + 0.25 * clamp((z - 75) / 30) * (1 - clamp(e / 0.3)))
        return img, dict(exposure=ex, bloom=0.5)
    return f


def flow_speed(v_kmh):
    """Screen speed (px/s) of the world streaming past for a fall speed in km/h: log-compressed so 2,000 km/h reads
    fast (~440 px/s) and 20 km/h still visibly moves (~65 px/s); zero when the ship is at rest."""
    return 220.0 * np.log10(1.0 + max(0.0, v_kmh) / 20.0)


def _speed_at(c, g):
    """Fall speed (km/h) of the descent beat c at global time g, following exactly what that beat renders."""
    kw, u = kw_at(c, g)
    if kw is None or "tau0" not in kw:
        return 0.0
    u = float(np.clip(u, 0.0, 1.0))
    k = u if kw.get("ease") is None else kw["ease"](u)
    vo = kw.get("v_override")
    if vo is not None:
        return float(vo(c, g - (c.seg["start"] + c.beat.t0), u))
    return float(at(lerp_tau(kw["tau0"], kw["tau1"], k))["v"])


def run_scroll(ctx, g):
    """(scroll px, motion px/frame) at global time g, integrated over the continuous shot ctx belongs to."""
    cache = getattr(ctx, "run_cache", None)
    if cache is None:
        cache = ctx.run_cache = {}
        ctx.run = [ctx]
    if "scroll" not in cache:
        run = ctx.run
        t0 = run[0].seg["start"] + run[0].beat.t0
        t1 = run[-1].seg["start"] + run[-1].beat.t1
        ts = np.arange(t0, t1 + 1 / 30, 1 / 30)
        sp = np.zeros(len(ts))
        j = 0
        for i, gg in enumerate(ts):
            while j + 1 < len(run) and gg >= run[j + 1].seg["start"] + run[j + 1].beat.t0:
                j += 1
            sp[i] = flow_speed(_speed_at(run[j], gg))
        sp = np.convolve(sp, np.ones(9) / 9, mode="same")          # no instant speed changes at beat boundaries
        cache["scroll"] = (ts, np.concatenate([[0.0], np.cumsum(sp[1:] * np.diff(ts))]), sp)
    ts, cum, sp = cache["scroll"]
    return float(np.interp(g, ts, cum)), float(np.interp(g, ts, sp)) / 30.0


def fall_scroll(z):
    """Screen pixels the world has streamed upward past the camera at depth z (km). Log-compressed: ~180 px per km near
    the cloud tops, ~30 px per km at 400 km, so the apparent speed stays readable through a 5,000 km fall."""
    return 13760.0 * np.log1p(max(0.0, z + 30.0) / 58.8)


# ═══════════════════════════ the descent HUD ═══════════════════════════
MILESTONES = [(-12, "CLOUD TOPS", None), (50, "WATER CLOUDS", None), (123.3, "GALILEO LOST", None),
              (307, "AIR GLOWS", None), (579, "SUBS CRUSHED", None), (5350, "?", "FLOAT")]
GX, GY0, GY1 = 1790, 150, 930


def gauge_y(d):
    L = np.log10(1 + (max(d, -20) + 20) / 2)
    return GY0 + (GY1 - GY0) * L / np.log10(1 + 6020 / 2)


def fmt_clock(tau):
    if tau < 3600 * 3:
        h, r = divmod(int(tau), 3600)
        m, s = divmod(r, 60)
        return f"T+ {h:01d}:{m:02d}:{s:02d}"
    d, r = divmod(int(tau), 86400)
    h = r // 3600
    return f"T+ {d} D {h:02d} H"


def fmt_P(P):
    if P < 10:
        return f"{P:.1f} ×"
    if P < 1e4:
        return f"{P:,.0f} ×"
    return f"{P / 1e3:,.0f},000 ×"


def hud_descent(alpha=1.0, reveal_float=False, show_gauge=True):
    def f(ctx, img, t, u):
        st = ctx.state.get("st")
        if st is None:
            return img
        a = alpha if not callable(alpha) else alpha(ctx, t, u)
        if a <= 0:
            return img
        L = Layer()
        x0, y0 = 70, 70
        img = hud.panel(img, x0 - 30, y0 - 34, x0 + 390, y0 + 214, a, 0.42)
        img = text(img, fmt_clock(st["tau"]), x0, y0, 26, ACC, a, "lc", kind="mono6", tracking=0.08)
        rows = [("DEPTH", f"{st['z']:,.0f} KM" if st["z"] >= 0 else f"{-st['z']:,.0f} KM ABOVE"),
                ("PRESSURE", fmt_P(st["P"]) + " EARTH"),
                ("OUTSIDE", f"{st['T'] - 273.15:,.0f} °C"),
                ("SPEED", f"{st['v']:,.0f} KM/H")]
        for i, (k, v) in enumerate(rows):
            yy = y0 + 46 + i * 38
            img = text(img, k, x0, yy, 15, DIM, a, "lc", tracking=0.2)
            img = text(img, v, x0 + 360, yy, 18, WHITE, a, "rc", kind="mono6", tracking=0.06)
        if show_gauge:
            img = hud.panel(img, GX - 230, GY0 - 40, GX + 70, GY1 + 40, a * 0.8, 0.32)
            # depth strip with cloud-deck colours
            for (d0, d1, col) in [(-20, -12, (0.25, 0.35, 0.6)), (-12, 4, (0.9, 0.88, 0.82)), (14, 30, (0.85, 0.55, 0.3)),
                                  (46, 70, (0.6, 0.66, 0.78)), (300, 6000, (1.0, 0.45, 0.15))]:
                L.line((GX, gauge_y(d0)), (GX, gauge_y(d1)), color=col, alpha=a * 0.9, th=6)
            L.line((GX, GY0), (GX, GY1), color=DIM, alpha=a * 0.5, th=1)
            for d, lab, alt in MILESTONES:
                yy = gauge_y(d)
                passed = st["z"] >= d
                c = ACC if passed else DIM
                L.line((GX - 12, yy), (GX + 12, yy), color=c, alpha=a, th=2)
                s = alt if (alt and (reveal_float or passed)) else lab
                img = text(img, s, GX - 22, yy, 14, c, a * (1.0 if passed else 0.75), "rc", tracking=0.14)
            yy = gauge_y(st["z"])
            L.poly([(GX + 16, yy), (GX + 34, yy - 10), (GX + 34, yy + 10)], WHITE, a)
            img = text(img, "YOU", GX + 40, yy, 14, WHITE, a, "lc", kind="mono6")
        return L.composite(img, 0.4)
    return f


# ═══════════════════════════ space / globe ═══════════════════════════


@scene_factory(vectors=["pan", "light", "canvas"], dyn=["belts_a"])
def space_globe(R=(400, 430), cx=W / 2, cy=H / 2, spin0=GRS_SPIN - 0.25, spin_rate=0.012, tilt=0.12, z=(1.0, 1.05),
                pan=(0, 0), belts_a=0.0, light=(-0.75, 0.2, 0.62), extra=None, stars_gain=1.0, canvas=(2300, 1300)):
    def f(ctx, t, u, fi):
        cam = Cam(u, z=z, pan=pan, canvas=canvas, pan_u=ctx.ru(t))
        img = cam.stars(gain=stars_gain)
        k = smoother(min(u, 1))
        r = lerp(R[0], R[1], k)
        X, Y = cam.p(cx, cy)
        gt = ctx.seg["start"] + ctx.beat.t0 + t
        globe(img, X, Y, cam.r(r), spin=spin0 + gt * spin_rate, tilt=tilt, light=light)
        ba = belts_a(ctx, t, u) if callable(belts_a) else float(belts_a)
        if ba > 0:
            img = belts(img, X, Y, cam.r(r), gt, ba)
        ctx.state["globe"] = (X, Y, cam.r(r), cam)
        if extra:
            img = extra(ctx, img, t, u, X, Y, cam.r(r), cam)
        return img, dict(exposure=1.35, bloom=0.45)
    return f


def earth_disc(img, x, y, r, spin=3.0):
    render_planet(img, x, y, r, "earth", spin=spin, tilt=0.35, light=(-0.75, 0.2, 0.62))
    return img


# ═══════════════════════════ small drawn props ═══════════════════════════


def draw_ship_icon(L, x, y, s, color=WHITE, alpha=1.0, flame=0.0):
    L.circle((x, y), s, color, alpha, th=2)
    L.line((x - s * 0.95, y + s * 0.1), (x + s * 0.95, y + s * 0.1), color=color, alpha=alpha, th=2)
    for sg in (-1, 1):
        L.polyline([(x + sg * 0.35 * s, y - 0.8 * s), (x + sg * 0.95 * s, y - 1.55 * s), (x + sg * 0.12 * s, y - 1.05 * s)], color, alpha, 2)
    if flame > 0:
        for sg in (-1, 1):
            L.line((x + sg * 0.4 * s, y + s), (x + sg * 0.4 * s, y + s * (1 + 1.6 * flame)), color=BLUE, alpha=alpha * flame, th=3)


def draw_probe(L, x, y, s, alpha=1.0, color=WHITE, chute=0.0):
    """Galileo entry probe: a blunt cone with a heat shield, optionally under a parachute."""
    L.polyline([(x - s, y), (x - s * 0.55, y - s * 0.75), (x + s * 0.55, y - s * 0.75), (x + s, y)], color, alpha, 2, closed=True)
    L.ellipse((x, y), s, s * 0.22, color=ACC, alpha=alpha, th=3)
    if chute > 0:
        top = y - s * (0.75 + 3.2 * chute)
        L.ellipse((x, top), s * 1.6 * chute, s * 0.5 * chute, color=color, alpha=alpha * chute, th=2, progress=0.5, rot=np.pi)
        for sg in (-1, 1):
            L.line((x + sg * s * 1.6 * chute, top), (x + sg * s * 0.5, y - s * 0.75), color=color, alpha=alpha * chute * 0.7, th=1)


def draw_juno(L, x, y, s, alpha=1.0, rot=0.0):
    """Juno: hexagonal body with three long solar wings."""
    ang = np.linspace(0, 2 * np.pi, 7) + rot
    L.polyline(np.stack([x + s * 0.32 * np.cos(ang), y + s * 0.32 * np.sin(ang)], -1), WHITE, alpha, 2)
    for k in range(3):
        a = rot + k * 2 * np.pi / 3
        d = np.array([np.cos(a), np.sin(a)])
        n = np.array([-d[1], d[0]])
        p0 = np.array([x, y]) + d * s * 0.32
        p1 = p0 + d * s * 1.6
        L.poly([p0 + n * s * 0.12, p1 + n * s * 0.12, p1 - n * s * 0.12, p0 - n * s * 0.12], (0.35, 0.45, 0.75), alpha * 0.9)
        L.polyline([p0 + n * s * 0.12, p1 + n * s * 0.12, p1 - n * s * 0.12, p0 - n * s * 0.12], WHITE, alpha * 0.8, 1, closed=True)


def draw_person(L, x, y, s, color=WHITE, alpha=1.0, lean=0.0):
    L.circle((x + lean * s * 0.3, y - s * 1.7), s * 0.22, color, alpha, fill=True)
    L.line((x + lean * s * 0.25, y - s * 1.45), (x, y - s * 0.6), color=color, alpha=alpha, th=max(2, int(s * 0.12)))
    for sg in (-1, 1):
        L.line((x, y - s * 0.6), (x + sg * s * 0.28, y), color=color, alpha=alpha, th=max(2, int(s * 0.11)))
        L.line((x + lean * s * 0.2, y - s * 1.3), (x + sg * s * 0.45, y - s * 0.85), color=color, alpha=alpha, th=max(2, int(s * 0.09)))


def draw_piano(L, x, y, s, color=WHITE, alpha=1.0):
    """Grand piano silhouette (side view)."""
    pts = [(-1.0, 0), (-1.0, -0.42), (0.1, -0.42), (0.55, -0.55), (1.0, -0.4), (1.0, 0)]
    L.poly([(x + px * s, y + py * s) for px, py in pts], color, alpha)
    L.poly([(x - 1.0 * s, y - 0.42 * s), (x - 0.2 * s, y - 0.95 * s), (x - 0.12 * s, y - 0.9 * s), (x - 0.8 * s, y - 0.42 * s)], color, alpha * 0.7)
    for lx in (-0.85, 0.0, 0.85):
        L.line((x + lx * s, y), (x + lx * s, y + 0.45 * s), color=color, alpha=alpha, th=max(2, int(s * 0.06)))


def draw_car(L, x, y, s, color=WHITE, alpha=1.0):
    pts = [(-1.0, 0), (-1.0, -0.28), (-0.62, -0.32), (-0.35, -0.6), (0.3, -0.6), (0.62, -0.32), (1.0, -0.26), (1.0, 0)]
    L.poly([(x + px * s, y + py * s) for px, py in pts], color, alpha)
    for wx in (-0.6, 0.6):
        L.circle((x + wx * s, y + 0.02 * s), 0.2 * s, (0.1, 0.1, 0.12), alpha, fill=True)
        L.circle((x + wx * s, y + 0.02 * s), 0.2 * s, color, alpha, th=2)


def draw_sub(L, x, y, s, color=WHITE, alpha=1.0):
    """Deep-diving submersible: sphere + float."""
    L.rect(x - s, y - s * 0.55, x + s, y - s * 0.05, color, alpha, 2)
    L.circle((x, y + s * 0.25), s * 0.32, color, alpha, th=2)


# ═══════════════════════════ shared overlays ═══════════════════════════


def caption(s, at=0.3, y=H - 110, color=WHITE, size=24, until=None, sub=None, x=W / 2, anchor="c"):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, until if until else None)
        if a <= 0:
            return img
        img = text(img, s, x, y, size, color, a, anchor, kind="mono6", tracking=0.22)
        if sub:
            img = text(img, sub, x, y + 40, 18, DIM, a, anchor, tracking=0.2)
        return img
    return f


def stat(big, small, at=0.3, y=H - 220, color=WHITE, sub_color=ACC, panel=True, x=W / 2, until=None, size=96):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, until)
        if a <= 0:
            return img
        bg = big(ctx, t, u) if callable(big) else big
        if panel:
            img = hud.panel(img, x - 470, y - 80, x + 470, y + 100, a, 0.45)
        img = text(img, bg, x, y, size, color, a, "c", kind="xlight", tracking=0.03, glow=0.2)
        img = text(img, small, x, y + 76, 20, sub_color, a, "c", tracking=0.32)
        return img
    return f


def over_all(*fns):
    def f(ctx, img, t, u):
        for fn in fns:
            img = fn(ctx, img, t, u)
        return img
    return f


def thermo_bars(items, at=0.3, x0=560, y0=380, w=800, maxv=16000, unit="°C"):
    """Horizontal comparison bars: [(label, value, colour, word)]."""
    def f(ctx, img, t, u):
        L = Layer()
        img = hud.panel(img, x0 - 60, y0 - 80, x0 + w + 200, y0 + len(items) * 110 + 10, fade(t, 0.1), 0.5)
        for i, (lab, val, col, wd) in enumerate(items):
            tt = ctx.w(wd) if isinstance(wd, str) else (wd if wd is not None else at + i * 0.6)
            p = prog(t, tt, 1.2)
            yy = y0 + i * 110
            img = text(img, lab, x0, yy - 28, 18, DIM, fade(t, tt), "lc", tracking=0.2)
            L.line((x0, yy + 10), (x0 + w * val / maxv * ease_out(p), yy + 10), color=col, alpha=fade(t, tt), th=16)
            img = text(img, f"{val * ease_out(p):,.0f} {unit}", x0 + w * val / maxv * ease_out(p) + 24, yy + 10, 22, col, fade(t, tt), "lc", kind="mono6")
        return L.composite(img, 0.5)
    return f
