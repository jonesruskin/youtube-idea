"""Scene + overlay builders for the rogue-planet episode. Every position on the orbit maps comes from ep_rogue/model.py
(the N-body runs); every scene goes through Cam so the stars move with the camera."""
import functools
import numpy as np
import cv2
from engine.core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                         fast_blur, grid, hex2rgb, splat_points, fbm)
from engine.space import space_frame
from engine.planet import render_planet, render_sun_disk
from engine.scenes2 import Cam
from engine import hud, cards
from engine.hud import Layer, text, fade, prog, typed, WHITE, ACC, BLUE, RED, GREEN, DIM
from engine.beats import scene_factory
from ep_rogue import model as M, sim as S

ICE = (0.62, 0.86, 1.0)
VIOLET = (0.78, 0.55, 1.0)
FATE_COL = dict(same=(0.07, 0.085, 0.13), changed=(0.24, 0.27, 0.36), scorched=ACC, frozen=ICE, ejected=RED, hit=RED)
ROGUE_COL = VIOLET
PCOL = dict(Mercury=(0.75, 0.72, 0.7), Venus=(1.0, 0.85, 0.55), Earth=BLUE, Mars=(1.0, 0.5, 0.35),
            Jupiter=(1.0, 0.8, 0.6), Saturn=(0.95, 0.85, 0.6), Uranus=(0.6, 0.9, 1.0), Neptune=(0.45, 0.6, 1.0))


# ═══════════════════════════ the rogue planet itself ═══════════════════════════
_REC = np.array([[0.55, 0.30, 0.25], [0.30, 0.50, 0.30], [0.30, 0.42, 0.62]], np.float32)   # banded, cool slate


def draw_rogue(img, cx, cy, R, light=(0.7, 0.2, 0.5), lit=0.0, glow=1.0, spin=0.0, tilt=0.25):
    """The rogue: Jupiter-sized, banded, cold. Lit by the Sun when `lit` > 0; otherwise only a faint thermal glow
    (its own leftover heat) traces the bands, plus a thin rim of scattered starlight."""
    if R < 0.6:
        glow_dot(img, cx, cy, ROGUE_COL, 1.4, 0.6 + 2.0 * lit)
        return img
    tmp = np.zeros_like(img)
    if lit > 0:
        render_planet(tmp, cx, cy, R, "jupiter", spin=spin, tilt=tilt, light=light, exposure=lit)
    else:   # no sun: a thin crescent of cold starlight from the Milky Way
        render_planet(tmp, cx, cy, R, "jupiter", spin=spin, tilt=tilt, light=(-0.85, -0.35, -0.25), exposure=0.22)
        tmp = tmp * np.array([0.7, 0.85, 1.25], np.float32)
    em = np.zeros_like(img)
    _, alpha = render_planet(em, cx, cy, R, "jupiter", spin=spin, tilt=tilt, light=(0.0, 0.0, 1.0), exposure=0.35, atmo=(0.5, 0.35, 0.9))
    lum = em.mean(2, keepdims=True)
    thermal = (lum ** 1.5) * np.array([0.95, 0.3, 0.6], np.float32) * 0.7 * glow
    body = tmp @ _REC.T
    out = img * (1 - alpha[..., None]) + body + thermal
    # starlight rim + faint violet halo so the silhouette reads against space
    xs, ys = grid()
    r = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / max(R, 1)
    rim = np.exp(-np.abs(r - 1.0) * R / min(2.5 + R * 0.012, 18.0)) * (r > 0.97)
    out += rim[..., None] * np.array(ROGUE_COL, np.float32) * (0.22 if R < 900 else 0.12) * (0.4 + glow)
    return out


@scene_factory(vectors=["pan", "pos", "light"], keys=["view"])
def rogue_scene(view="deep", z=(1.0, 1.08), pan=(40, 0), pos=(960, 560), R=(360, 380), lit=(0.0, 0.0), glow=(1.0, 1.0),
                light=(0.75, 0.15, 0.55), spin=(0.0, 0.25), stars=0.75, sun=None, earth=None, jupiter=None):
    """view: 'deep' (alone in interstellar space), 'sun' (lit, Sun glare off-frame), any label for a new place.
    earth: None or (x, y, R, (light)) to put Earth in the foreground."""
    def f(ctx, t, u, fi):
        ur = ctx.ru(t)
        cam = Cam(u, z=z, pan=pan, pan_u=ur)
        img = cam.stars(gain=stars)
        x, y = cam.p(*pos)
        rr = cam.r(lerp(R[0], R[1], smoother(u)))
        img = draw_rogue(img, x, y, rr, light=light, lit=lerp(lit[0], lit[1], u), glow=lerp(glow[0], glow[1], u),
                         spin=lerp(spin[0], spin[1], ur))
        if sun is not None:
            sx, sy = cam.p(*sun)
            glow_dot(img, sx, sy, (1.0, 0.9, 0.75), 5, 8)
            glow_dot(img, sx, sy, (1.0, 0.75, 0.5), 80, 0.25)
        if jupiter is not None:
            jx, jy = cam.p(jupiter[0], jupiter[1])
            render_planet(img, jx, jy, cam.r(jupiter[2]), "jupiter", spin=0.3 * ur, tilt=0.2, light=(-0.5, 0.2, 0.8))
            ctx.state["jup_xy"] = (jx, jy, cam.r(jupiter[2]))
        if earth is not None:
            ex, ey = cam.p(earth[0], earth[1])
            render_planet(img, ex, ey, cam.r(earth[2]), "earth", spin=1.2 + 0.05 * ur, tilt=0.4,
                          light=earth[3] if len(earth) > 3 else (0.6, 0.2, 0.75))
        ctx.state["rogue_xy"] = (x, y, rr)
        return img, dict(exposure=1.55)
    return f


# ═══════════════════════════ top-down orbit map from the simulation ═══════════════════════════
INC = np.radians(50)


@functools.lru_cache(64)
def _trail(day, t_lo, t_hi, n=220):
    sol, tp = M.run(day)
    ts = tp + np.linspace(t_lo, t_hi, n) / M.YR_D
    return sol.sol(np.clip(ts, sol.t[0], sol.t[-1]))


@scene_factory(vectors=["center"], keys=["run"])
def map_scene(run="d+0.0", t=(-30.0, 0.0), half=(2.0, 2.0), focus=(0.0, 0.0), outer=False, moon=False,
              trail=40.0, rogue_trail=True, labels=True, hud_clock=True, dim_others=0.0, ghost=False, earth_pulse=False,
              belt=False, roche=False):
    """Top-down view of one simulation run (run='d<arrival day>'). t: days from the rogue's closest approach to
    the Sun. half: half-width of the view in AU. focus: 0 = Sun-centred, 1 = Earth-centred. moon: draw the Moon."""
    day = float(run[1:])

    def f(ctx, tt, u, fi):
        ur = ctx.ru(tt)
        ty = lerp(t[0], t[1], u)
        hf = np.exp(lerp(np.log(half[0]), np.log(half[1]), smoother(u)))
        sc = (W * 0.5) / hf
        fo = lerp(focus[0], focus[1], smoother(u))
        st = M.state(day, ty)
        c = st["sun"] * (1 - fo) + st["earth"] * fo

        def scr(P):
            P = np.asarray(P, np.float64)
            d = P[..., :2] - c[:2]
            return np.stack([W / 2 + d[..., 0] * sc, H / 2 + 30 + d[..., 1] * sc * np.cos(INC)], -1)
        img, _ = space_frame(2600 + 180 * ur, 1500, (2.0 / hf) ** 0.12, angle=2 * ur)
        img *= 0.5
        lines = np.zeros((H, W), np.uint8)
        sp = scr(st["sun"])
        for name, a in S.PLANETS:
            if name in ("Jupiter", "Saturn", "Uranus", "Neptune") and not outer:
                continue
            rpx = a * sc
            if rpx < 5 or rpx > 6000:
                continue
            cv2.ellipse(lines, (int(sp[0] * 4), int(sp[1] * 4)), (int(rpx * 4), int(rpx * np.cos(INC) * 4)), 0, 0, 360,
                        110 if name == "Earth" else 60, 1, cv2.LINE_AA, 2)
        img += (lines.astype(np.float32) / 255)[..., None] * np.array([0.5, 0.6, 0.8], np.float32) * 0.45
        if belt:
            ba, bth = _belt()
            Pb = scr(np.stack([st["sun"][0] + ba * np.cos(bth + 0.02 * ty / ba ** 1.5), st["sun"][1] + ba * np.sin(bth + 0.02 * ty / ba ** 1.5)], -1))
            img = splat_points(img, Pb[:, 0], Pb[:, 1], np.full((len(Pb), 3), 0.10, np.float32) * np.array([0.9, 0.85, 0.75], np.float32), sigma=0.8)
        lay = np.zeros((H, W, 3), np.float32)
        ctx.state["scr"] = scr
        ctx.state["st"] = st
        pts = {}
        for k, (name, a) in enumerate(S.PLANETS):
            if name in ("Jupiter", "Saturn", "Uranus", "Neptune") and not outer:
                continue
            i = 12 + 6 * k
            span_d = trail if name == "Earth" else min(trail, 0.25 * a ** 1.5 * 365)
            Y = _trail(day, round(ty - span_d, 2), round(ty, 2))
            P = scr(np.stack([Y[i] - Y[0] + st["sun"][0], Y[i + 1] - Y[1] + st["sun"][1]], -1))
            col = np.array(PCOL[name], np.float32) * (1 - 0.7 * dim_others if name != "Earth" else 1.0)
            m = np.zeros((H, W), np.uint8)
            for j in range(len(P) - 1):
                v = int(25 + 230 * (j / len(P)) ** 1.5)
                if np.all(np.abs(P[j] - [W / 2, H / 2]) < 5000) and np.all(np.abs(P[j + 1] - [W / 2, H / 2]) < 5000):
                    cv2.line(m, tuple((P[j] * 4).astype(int)), tuple((P[j + 1] * 4).astype(int)), v, 3 if name == "Earth" else 2, cv2.LINE_AA, 2)
            lay += (m.astype(np.float32) / 255)[..., None] * col
            q = scr(st[name.lower()])
            pts[name] = q
            if -60 < q[0] < W + 60 and -60 < q[1] < H + 60:
                rad = max(3.4, 6371 / M.AU_KM * sc) if name == "Earth" else 2.4
                glow_dot(img, q[0], q[1], col, rad, 3.0)
                glow_dot(img, q[0], q[1], col, 10, 0.18)
                if name == "Earth" and earth_pulse:
                    rr_ = np.zeros((H, W), np.uint8)
                    cv2.circle(rr_, (int(q[0] * 4), int(q[1] * 4)), int((16 + 5 * np.sin(tt * 3)) * 4), 255, 1, cv2.LINE_AA, 2)
                    img += (rr_.astype(np.float32) / 255)[..., None] * np.array(BLUE, np.float32) * 0.8
                if labels and (a * sc > 70 or name == "Earth") and 40 < q[0] < W - 200 and 60 < q[1] < H - 40 and dim_others < 0.9:
                    cards.label(img, name.upper(), q[0] + 14, q[1] - 14, col * 0.9 + 0.1, 0.85, 17)
        img += lay
        if moon:
            mq = scr(st["moon"])
            if -40 < mq[0] < W + 40 and -40 < mq[1] < H + 40:
                glow_dot(img, mq[0], mq[1], (0.9, 0.9, 0.92), max(2.0, 1737 / M.AU_KM * sc), 2.4)
                Y = _trail(day, round(ty - min(trail, 60), 2), round(ty, 2), 400)
                Y = _trail(day, round(ty - min(trail, 27.0), 2), round(ty, 2), 400)
                Ym = Y[M.IM:M.IM + 2] - Y[M.IE:M.IE + 2]           # the Moon's path around Earth, drawn at Earth's position now
                Pm = scr(np.stack([Ym[0] + st["earth"][0], Ym[1] + st["earth"][1]], -1))
                m = np.zeros((H, W), np.uint8)
                for j in range(len(Pm) - 1):
                    v = int(20 + 200 * (j / len(Pm)) ** 2)
                    if np.all(np.abs(Pm[j] - [W / 2, H / 2]) < 5000):
                        cv2.line(m, tuple((Pm[j] * 4).astype(int)), tuple((Pm[j + 1] * 4).astype(int)), v, 1, cv2.LINE_AA, 2)
                img += (m.astype(np.float32) / 255)[..., None] * np.array([0.8, 0.8, 0.85], np.float32) * 0.8
                if labels:
                    cards.label(img, "MOON", mq[0] + 12, mq[1] + 14, (0.85, 0.85, 0.9), 0.8, 16)
            pts["Moon"] = mq
        # Sun
        glow_dot(img, sp[0], sp[1], (1.0, 0.88, 0.62), 4.5, 6)
        glow_dot(img, sp[0], sp[1], (1.0, 0.7, 0.4), 34, 0.35)
        if labels and 30 < sp[0] < W - 120 and 30 < sp[1] < H - 40:
            cards.label(img, "SUN", sp[0] + 16, sp[1] + 18, (1.0, 0.85, 0.6), 0.8, 17)
        cards.mark("SUN", sp[0], sp[1])
        # the rogue: path (past solid, future dashed) and marker
        sol, tp = M.run(day)
        span_r = max(40.0, hf * 30)
        tr = np.linspace(ty - span_r, ty + span_r, 260)
        Y = sol.sol(np.clip(tp + tr / M.YR_D, sol.t[0], sol.t[-1]))
        P = scr(np.stack([Y[6] - Y[0] + st["sun"][0], Y[7] - Y[1] + st["sun"][1]], -1))
        m = np.zeros((H, W), np.uint8)
        for j in range(len(P) - 1):
            fut = tr[j] > ty
            if fut and (j // 4) % 2:
                continue
            if not rogue_trail and not fut:
                continue
            if np.all(np.abs(P[j] - [W / 2, H / 2]) < 5000) and np.all(np.abs(P[j + 1] - [W / 2, H / 2]) < 5000):
                cv2.line(m, tuple((P[j] * 4).astype(int)), tuple((P[j + 1] * 4).astype(int)), 130 if fut else 220, 2, cv2.LINE_AA, 2)
        img += (m.astype(np.float32) / 255)[..., None] * np.array(ROGUE_COL, np.float32) * 0.6
        rq = scr(st["rogue"])
        pts["Rogue"] = rq
        rpx = max(4.0, S.R_ROGUE * sc)
        if rpx > 5:
            img = draw_rogue(img, rq[0], rq[1], rpx, light=tuple(np.r_[(st["sun"] - st["rogue"])[:2] * [1, -1], 0.3] / (np.linalg.norm(st["sun"] - st["rogue"]) + 1e-9)), lit=0.9, glow=0.4)
        glow_dot(img, rq[0], rq[1], ROGUE_COL, 4, 2.5)
        ring = np.zeros((H, W), np.uint8)
        cv2.circle(ring, (int(rq[0] * 4), int(rq[1] * 4)), int(max(22, rpx + 14) * 4), 255, 1, cv2.LINE_AA, 2)
        img += (ring.astype(np.float32) / 255)[..., None] * np.array(ROGUE_COL, np.float32) * 0.8
        if labels and 30 < rq[0] < W - 320 and 40 < rq[1] < H - 60:
            cards.label(img, "ROGUE · 5 JUPITERS", rq[0] + max(30, rpx + 22), rq[1] - 6, ROGUE_COL, 0.95, 17)
        if roche:
            ring = np.zeros((H, W), np.uint8)
            rr_ = M.roche_km() / M.AU_KM * sc
            for k in range(0, 72, 2):
                a0, a1 = np.radians(k * 5), np.radians(k * 5 + 5)
                cv2.ellipse(ring, (int(rq[0] * 4), int(rq[1] * 4)), (int(rr_ * 4), int(rr_ * np.cos(INC) * 4)), 0, np.degrees(a0), np.degrees(a1), 255, 1, cv2.LINE_AA, 2)
            img += (ring.astype(np.float32) / 255)[..., None] * np.array(RED, np.float32) * 0.9
            ctx.state["roche_px"] = rr_
        ctx.state["pts"] = pts
        ctx.state["sc"] = sc
        if hud_clock:
            dd = ty
            lab = "CLOSEST TO THE SUN" if abs(dd) < 0.5 else (f"T – {abs(dd):,.0f} DAYS" if dd < 0 else f"T + {dd:,.0f} DAYS")
            cards.label(img, lab, 140, 120, (1.0, 0.97, 0.93), 0.95, 28, kind="mono6", tracking=0.16)
            cards.label(img, f"N-BODY SIMULATION · ARRIVAL DATE {_date_lab(day)}", 140, 160, (0.7, 0.74, 0.82), 0.7, 16, tracking=0.25)
            bars = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]
            bar = bars[int(np.clip(np.searchsorted(bars, hf / 4), 0, len(bars) - 1))]
            bl = bar * sc
            cards.hline(img, W - 140 - bl, W - 140, H - 110, (0.85, 0.88, 0.95), 0.7, 1)
            km = bar * M.AU_KM
            cards.label(img, f"{bar:g} AU" if bar >= 0.1 else f"{km / 1e6:,.1f} MILLION KM", W - 140, H - 86, (0.75, 0.78, 0.86), 0.8, 16, anchor="rc")
        return img, dict(exposure=1.4)
    return f


@functools.lru_cache(1)
def _belt():
    rng = np.random.default_rng(7)
    return rng.uniform(2.15, 3.3, 2600), rng.uniform(0, 2 * np.pi, 2600)


def _date_lab(day):
    if abs(day) < 0.01:
        return "DAY 0"
    return f"DAY {day:+g}".replace("-", "–")


def run_id(day):
    return f"d{day:+.2f}"


# ═══════════════════════════ the calendar ring: one tick per half-day ═══════════════════════════
@functools.lru_cache(1)
def year_fates():
    R = S.year_odds()
    return [(r["day"], r["fate"], r["moon_lost"]) for r in R]


CAL_C, CAL_R = (960, 560), 330


def day_angle(day):
    """Calendar ring: arrival day 0 at the top, later dates clockwise."""
    return -np.pi / 2 + 2 * np.pi * day / 365.25


@scene_factory(vectors=["hl"], keys=[])
def calendar_scene(reveal=(1.0, 1.0), show=("same", "changed", "scorched", "frozen", "ejected"), hl=(0.0, 0.0),
                   hl_on=False, moon_marks=False, earth=True, z=(1.0, 1.0), sweep=(0.0, 0.0), r=CAL_R, zt=(0.0, 0.0)):
    """reveal: fraction of the ring drawn (sweeping clockwise from day −182). show: fates in colour (others grey).
    hl: (from day, to day) highlighted arc. sweep: an Earth marker running around the ring (in days)."""
    def f(ctx, t, u, fi):
        ur = ctx.ru(t)
        cam = Cam(u, z=z, pan=(30, 0), pan_u=ur)
        img = cam.stars(gain=0.45)
        rv = lerp(reveal[0], reveal[1], smoother(u))
        cx, cy = cam.p(*CAL_C)
        R = cam.r(r)
        k_z = smoother(clamp(lerp(zt[0], zt[1], smoother(u))))
        R = R * (1 + 3.2 * k_z)
        cy = lerp(cy, 520 + R, k_z)
        wz = 1 + 1.2 * k_z
        m = np.zeros((H, W, 3), np.float32)
        for d, fate, ml in year_fates():
            k = (d + 182.5) / 365.0
            if k > rv:
                continue
            a = day_angle(d)
            col = np.array(FATE_COL[fate] if fate in show else FATE_COL["same"], np.float32)
            big = fate in ("scorched", "frozen", "ejected") and fate in show
            r0, r1 = R - (34 if big else 18) * wz, R + (34 if big else 18) * wz
            if abs((cx + R * np.cos(a)) - W / 2) > W or (cy + R * np.sin(a)) > H + 200:
                continue
            hi = hl_on and (hl[0] <= d <= hl[1])
            g = 1.6 if hi else 1.0
            cv2.line(m, (int((cx + r0 * np.cos(a)) * 4), int((cy + r0 * np.sin(a)) * 4)),
                     (int((cx + r1 * np.cos(a)) * 4), int((cy + r1 * np.sin(a)) * 4)), tuple(float(c * g) for c in col), 1 if not big else 2, cv2.LINE_AA, 2)
            if moon_marks and ml:
                glow_dot(img, cx + (R + 54) * np.cos(a), cy + (R + 54) * np.sin(a), (0.92, 0.92, 0.96), 1.6, 1.6)
        img += m * 0.9 + fast_blur(m, 6) * 0.6
        # the Sun in the middle, Earth marker on the ring
        glow_dot(img, cx, cy, (1.0, 0.88, 0.62), 5, 5)
        glow_dot(img, cx, cy, (1.0, 0.7, 0.4), 40, 0.25)
        if earth:
            dd = lerp(sweep[0], sweep[1], smoother(u))
            a = day_angle(dd)
            ex, ey = cx + (R - 70 * wz) * np.cos(a), cy + (R - 70 * wz) * np.sin(a)
            glow_dot(img, ex, ey, BLUE, 4, 3)
            ctx.state["earth_xy"] = (ex, ey)
        ctx.state["cal"] = (cx, cy, R)
        return img, dict(exposure=1.35)
    return f


def ring_xy(ctx, day, dr=0.0):
    cx, cy, R = ctx.state["cal"]
    a = day_angle(day)
    return cx + (R + dr) * np.cos(a), cy + (R + dr) * np.sin(a)


# ═══════════════════════════ Earth close-ups for each fate ═══════════════════════════
@scene_factory(vectors=["pan", "pos", "light", "rogue_pos", "moon_pos", "sun_pos"], keys=["view"])
def earth_scene(view="space", z=(1.0, 1.06), pan=(-30, 0), pos=(960, 600), R=(330, 340), light=(-0.7, 0.25, 0.6),
                scorch=(0.0, 0.0), ice=(0.0, 0.0), night=1.0, lights=(1.0, 1.0), exposure=(1.0, 1.0),
                rogue_pos=None, rogue_R=(0.0, 0.0), rogue_lit=(0.6, 0.6), moon_pos=None, moon_R=(0.0, 0.0),
                sun_pos=None, sun_R=(0.0, 0.0), stars=0.7, spin=(1.0, 1.3), stretch=(1.0, 1.0), roll=0.0):
    def f(ctx, t, u, fi):
        ur = ctx.ru(t)
        cam = Cam(u, z=z, pan=pan, pan_u=ur)
        img = cam.stars(gain=stars)
        if sun_pos is not None and sun_R[1] > 0:
            sx, sy = cam.p(*sun_pos)
            sr = cam.r(lerp(sun_R[0], sun_R[1], smoother(u)))
            if sr > 3:
                render_sun_disk(img, sx, sy, sr, t, filter_look=False)
            glow_dot(img, sx, sy, (1.0, 0.85, 0.6), max(4, sr * 0.3), 4)
        if rogue_pos is not None and rogue_R[1] > 0:
            rx, ry = cam.p(*rogue_pos)
            img = draw_rogue(img, rx, ry, cam.r(lerp(rogue_R[0], rogue_R[1], smoother(u))), light=(0.8, 0.1, 0.5),
                             lit=lerp(rogue_lit[0], rogue_lit[1], u), glow=0.7, spin=0.3 * ur)
        if moon_pos is not None and moon_R[1] > 0:
            mx, my = cam.p(*moon_pos)
            render_planet(img, mx, my, cam.r(lerp(moon_R[0], moon_R[1], u)), "moon", spin=0.4, tilt=0.1, light=light)
        x, y = cam.p(*pos)
        rr = cam.r(lerp(R[0], R[1], smoother(u)))
        render_planet(img, x, y, rr, "earth", spin=lerp(spin[0], spin[1], ur), tilt=0.42, light=light,
                      scorch=lerp(scorch[0], scorch[1], u), ice=lerp(ice[0], ice[1], u), night=night,
                      lights_fade=lerp(lights[0], lights[1], u), exposure=lerp(exposure[0], exposure[1], u),
                      stretch=lerp(stretch[0], stretch[1], smoother(u)), roll=roll)
        ctx.state["earth_xy"] = (x, y, rr)
        return img, dict(exposure=1.45)
    return f


# ═══════════════════════════ the sky from the ground ═══════════════════════════
@functools.lru_cache(2)
def _horizon(seed=4):
    n = fbm(W + 400, 1, scale=260, octaves=5, seed=seed)[0]
    h = H * 0.80 - 70 * (n - n.mean()) / (n.std() + 1e-6) * 0.6
    xs, ys = grid(W + 400, H)
    m = (ys > h[None, :]).astype(np.float32)
    return cv2.GaussianBlur(m, (0, 0), 1.1), h


@scene_factory(vectors=["obj", "pan"], keys=["view"])
def sky_scene(view="night", obj=(1180, 330), size=(0.0, 0.0), bright=(0.0, 0.0), moon=False, dusk=0.0, pan=(-40, 0),
              z=(1.0, 1.05), phase=0.7, binoc=False):
    """A night sky over a dark ridge. The rogue is a point that brightens (bright: 0..1 star → dazzling) or a disc
    (size in pixels). moon=True shows the full Moon for scale."""
    def f(ctx, t, u, fi):
        ur = ctx.ru(t)
        cam = Cam(u, z=z, pan=pan, pan_u=ur)
        img = cam.stars(gain=0.9, star_zoom=0.3)
        ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
        img += (np.array([0.02, 0.035, 0.07], np.float32) * (ys ** 2) * 1.2 + np.array([0.12, 0.07, 0.04], np.float32) * dusk * ys ** 3)
        ox, oy = cam.p(*obj)
        sz = lerp(size[0], size[1], smoother(u))
        b = lerp(bright[0], bright[1], smoother(u))
        if sz > 1.5:
            img = draw_rogue(img, ox, oy, cam.r(sz), light=(-0.6, 0.4, 0.7 - phase), lit=1.1, glow=0.3, spin=0.2 * ur)
            glow_dot(img, ox, oy, (0.9, 0.8, 1.0), cam.r(sz) * 1.6, 0.08)
        elif b > 0:
            glow_dot(img, ox, oy, (0.95, 0.9, 1.0), 1.6 + 2.5 * b, 1.5 + 14 * b)
            glow_dot(img, ox, oy, (0.85, 0.8, 1.0), 10 + 30 * b, 0.15 * b)
            if b > 0.3:
                star_spikes(img, ox, oy, (0.95, 0.92, 1.0), 40 + 160 * b, 0.35 * b, angle=12)
        if moon:
            mx, my = cam.p(560, 360)
            render_planet(img, mx, my, cam.r(26), "moon", spin=0.3, tilt=0.1, light=(0.05, 0.1, 1.0))
        # the ridge, with a little sky glow on it
        hm, _ = _horizon()
        off = int(np.clip(120 + cam.px * 0.6, 0, 399))
        mask = hm[:, off:off + W][..., None]
        ground = np.array([0.006, 0.008, 0.012], np.float32) + img.mean((0, 1)) * 0.05
        img = img * (1 - mask) + ground * mask
        if binoc:
            from engine.scenes2 import scope_view
            img = scope_view(img)
        ctx.state["obj_xy"] = (ox, oy)
        return img, dict(exposure=1.5)
    return f


# ═══════════════════════════ two Suns, side by side ═══════════════════════════
@scene_factory(keys=[])
def suns_scene(r_today=150.0, r_new=(150.0, 150.0), new_col=(1.0, 1.0, 1.0)):
    def f(ctx, t, u, fi):
        cam = Cam(ctx.ru(t), z=(1.0, 1.04), pan=(20, 0))
        img = cam.stars(gain=0.35)
        a, b = cam.p(600, 540), cam.p(1320, 540)
        render_sun_disk(img, a[0], a[1], cam.r(r_today), t)
        rn = cam.r(lerp(r_new[0], r_new[1], smoother(u)))
        tmp = np.zeros_like(img)
        render_sun_disk(tmp, b[0], b[1], rn, t + 3)
        img += tmp * np.array(new_col, np.float32)
        ctx.state["suns"] = (a, b, cam.r(r_today), rn)
        return img, dict(exposure=1.25)
    return f


# ═══════════════════════════ shared overlays ═══════════════════════════
def over_all(*fns):
    def f(ctx, img, t, u):
        for fn in fns:
            img = fn(ctx, img, t, u)
        return img
    return f


def tag(label, sub=None, at=0.3, x=140, y=None, color=ACC):
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


def big(s, at, y=H - 200, size=80, color=WHITE, sub=None, sub_col=ACC, until=None):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, until if until else ctx.dur, 0.45)
        if a <= 0:
            return img
        img = hud.panel(img, W / 2 - 560, y - 66, W / 2 + 560, y + (66 if not sub else 110), a, 0.45)
        img = text(img, s, W / 2, y, size, color, a, "c", kind="xlight", tracking=0.04, glow=0.2)
        if sub:
            img = text(img, sub, W / 2, y + 72, 22, sub_col, a, "c", tracking=0.35)
        return img
    return f


def stat(big_s, small, at, x=W - 140, y=200, color=ACC, anchor="rc"):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, ctx.dur, 0.4)
        if a <= 0:
            return img
        img = text(img, big_s, x, y, 64, color, a, anchor, kind="light", tracking=0.02)
        img = text(img, small, x, y + 56, 20, DIM, a, anchor, tracking=0.3)
        return img
    return f


def caption(s, at, x=140, y=120, color=DIM, size=20):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        return text(img, typed(s, prog(t, tt, 1.0)), x, y, size, color, fade(t, tt), "lc", tracking=0.3)
    return f


def bars(rows, at=0.3, x0=360, y0=400, w=1200, gap=110, vmax=None):
    """rows: [(label, value, color, value_text)] horizontal bars that grow in on their words."""
    def f(ctx, img, t, u):
        L = Layer()
        vm = vmax or max(r[1] for r in rows)
        for k, (lab, v, col, vt, *wd) in enumerate(rows):
            tt = (ctx.w(wd[0]) if wd else at + 0.35 * k)
            a = fade(t, tt)
            p = smoother(prog(t, tt, 1.0))
            y = y0 + k * gap
            img = text(img, lab, x0, y - 26, 20, DIM, a, "lc", tracking=0.25)
            L.line((x0, y + 8), (x0 + w * v / vm * p, y + 8), color=col, alpha=a, th=16)
            img = text(img, vt, x0 + w * v / vm * p + 24, y + 8, 24, col, a * (p > 0.6), "lc", kind="mono6")
        return L.composite(img, 0.3)
    return f


# ═══════════════════════════ how rogues are made: planet–planet scattering (illustrative) ═══════════════════════════
@scene_factory(keys=[])
def scatter_scene(k=(0.0, 1.0)):
    """A young star with two giants; they swing close and one is flung out along a widening arc. Illustrative."""
    def f(ctx, t, u, fi):
        cam = Cam(ctx.ru(t), z=(1.0, 1.08), pan=(30, 0))
        img = cam.stars(gain=0.5)
        kk = lerp(k[0], k[1], u)
        cx, cy = cam.p(860, 560)
        glow_dot(img, cx, cy, (1.0, 0.9, 0.7), 6, 7)
        glow_dot(img, cx, cy, (1.0, 0.75, 0.5), 50, 0.3)
        ci = np.radians(52)
        m = np.zeros((H, W), np.uint8)
        for a_ in (160, 260):
            cv2.ellipse(m, (int(cx * 4), int(cy * 4)), (int(cam.r(a_) * 4), int(cam.r(a_) * np.cos(ci) * 4)), 0, 0, 360, 60, 1, cv2.LINE_AA, 2)
        img += (m.astype(np.float32) / 255)[..., None] * np.array([0.5, 0.6, 0.8], np.float32) * 0.5
        th1 = 2.0 + 9.0 * kk
        x1, y1 = cx + cam.r(160) * np.cos(th1), cy + cam.r(160) * np.cos(ci) * np.sin(th1)
        render_planet(img, x1, y1, cam.r(16), "jupiter", spin=t * 0.2, tilt=0.2, light=((cx - x1) / 300, (y1 - cy) / 300, 0.6))
        e = smooth(span(kk, 0.45, 1.0))
        th2 = 0.5 + 5.6 * kk
        rr = 260 + 1300 * e ** 1.6
        x2 = cx + cam.r(rr) * np.cos(th2 - 1.2 * e)
        y2 = cy + cam.r(rr) * np.cos(ci) * np.sin(th2 - 1.2 * e)
        tr = []
        for q in np.linspace(max(0, kk - 0.25), kk, 60):
            e_ = smooth(span(q, 0.45, 1.0))
            r_ = 260 + 1300 * e_ ** 1.6
            th_ = 0.5 + 5.6 * q - 1.2 * e_
            tr.append((cx + cam.r(r_) * np.cos(th_), cy + cam.r(r_) * np.cos(ci) * np.sin(th_)))
        m = np.zeros((H, W), np.uint8)
        for j in range(len(tr) - 1):
            cv2.line(m, (int(tr[j][0] * 4), int(tr[j][1] * 4)), (int(tr[j + 1][0] * 4), int(tr[j + 1][1] * 4)), int(40 + 200 * j / len(tr)), 2, cv2.LINE_AA, 2)
        img += (m.astype(np.float32) / 255)[..., None] * np.array(ROGUE_COL, np.float32) * 0.8
        if -50 < x2 < W + 50 and -50 < y2 < H + 50:
            img = draw_rogue(img, x2, y2, cam.r(18), light=((cx - x2), (y2 - cy), 300), lit=0.8 * (1 - e) + 0.1, glow=1.0)
        ctx.state["sc_pts"] = dict(star=(cx, cy), a=(x1, y1), b=(x2, y2))
        return img, dict(exposure=1.45)
    return f


# ═══════════════════════════ the warning: 1,000 AU out (log-scaled rings) ═══════════════════════════
def far_r(au):
    """Screen radius for a distance in AU on the log-scaled warning diagram (1 AU → 40 px, 1,000 AU → 1,000 px)."""
    return 40 * (1000 / 40) ** (np.log10(max(au, 1e-3)) / 3)


@scene_factory(keys=[])
def far_scene(d=(1000.0, 1000.0), sun_xy=(420.0, 600.0)):
    """The Sun at left, rings at 1, 10, 100 and 1,000 AU (log scale), the rogue coming in from the right at d AU."""
    def f(ctx, t, u, fi):
        cam = Cam(ctx.ru(t), z=(1.0, 1.04), pan=(-30, 0))
        img = cam.stars(gain=0.5)
        sx, sy = cam.p(*sun_xy)
        glow_dot(img, sx, sy, (1.0, 0.88, 0.62), 5, 6)
        m = np.zeros((H, W), np.uint8)
        for au in (1, 10, 100, 1000):
            rr = cam.r(far_r(au))
            cv2.ellipse(m, (int(sx * 4), int(sy * 4)), (int(rr * 4), int(rr * 0.55 * 4)), 0, -90, 90, 90 if au != 1000 else 160, 1, cv2.LINE_AA, 2)
        img += (m.astype(np.float32) / 255)[..., None] * np.array([0.5, 0.6, 0.8], np.float32) * 0.6
        dd = np.exp(lerp(np.log(d[0]), np.log(d[1]), u))
        rx = sx + cam.r(far_r(dd))
        glow_dot(img, rx, sy, ROGUE_COL, 3.5, 3.0)
        glow_dot(img, rx, sy, ROGUE_COL, 14, 0.25)
        ctx.state["far"] = (sx, sy, rx, dd, cam)
        return img, dict(exposure=1.4)
    return f
