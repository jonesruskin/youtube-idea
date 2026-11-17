"""Cinematic scenes for the rogue-planet episode (v2). Every scene has a real camera move; positions, distances, sizes
and lighting come from the N-body runs (ep_rogue/model.py) unless a label says 'illustrative' or 'sizes enlarged'."""
import functools
import numpy as np
import cv2
from engine.core import W, H, clamp, smooth, smoother, span, lerp, glow_dot, star_spikes, fast_blur, grid, fbm
from engine.planet import render_planet, render_sun_disk
from engine.beats import scene_factory
from engine import cam3d, cards, hud
from engine.cam3d import Camera, ring_pts
from engine.hud import Layer, text, fade, prog, WHITE, ACC, BLUE, RED, GREEN, DIM
from ep_rogue import model as M, sim as S
from ep_rogue.vis import draw_rogue, FATE_COL, ICE, VIOLET, year_fates
from ep_rogue.clouddeck import flyover
from ep_rogue.ground import ground_view

KM = M.AU_KM
R_ROGUE, R_EARTH, R_MOON, R_SUN = M.R_ROGUE_KM, 6371.0, 1737.4, 696000.0
cards.FONT_FILES.setdefault("black", cards.INTER + "Inter-Black.otf")
cards.FONT_FILES.setdefault("bold", cards.INTER + "Inter-Bold.otf")


def rogue_drawer(lit=1.0, glow=0.8, spin=0.3):
    def d(im, x, y, R, L):
        im[...] = draw_rogue(im, x, y, R, light=L, lit=lit, glow=glow, spin=spin)
    return d


def ease(u):
    return smoother(clamp(u))


# ═══════════════════════════ 1. over the cloud tops (the rogue's own sky) ═══════════════════════════
@scene_factory(keys=[])
def fly_scene(alt=(4000.0, 3500.0), pitch=(-16.0, -12.0), yaw=(0.0, 4.0), scroll=(0.0, 9000.0), glow=1.1,
              sun_bright=(0.0, 0.0), sun_dir=(0.35, 0.10, -1.0), roll=(0.0, -2.0)):
    def f(ctx, t, u, fi):
        k = ctx.ru(t)
        img, cam = flyover(t, alt_km=lerp(alt[0], alt[1], ease(u)), pitch_deg=lerp(pitch[0], pitch[1], ease(u)),
                           yaw_deg=lerp(yaw[0], yaw[1], ease(u)), scroll=lerp(scroll[0], scroll[1], u), glow=glow,
                           sun_dir=sun_dir if max(sun_bright) > 0 else None, sun_bright=lerp(sun_bright[0], sun_bright[1], u),
                           roll_deg=lerp(roll[0], roll[1], ease(u)))
        return img, dict(exposure=1.5, bloom=0.65)
    return f


# ═══════════════════════════ 2. the rogue seen whole: pull-backs, orbits of the camera ═══════════════════════════
@scene_factory(vectors=["axis"], keys=[])
def rogue_orbit(dist=(1.25, 3.2), az=(-20.0, 10.0), el=(8.0, 4.0), lit=0.0, glow=0.75, sun_az=None, fov=50.0,
                aim=(0.0, 0.0), earth=None):
    """Camera at dist × rogue radius, at azimuth/elevation (deg) around the rogue. lit > 0 with sun_az lights it.
    earth: (az, el, dist_in_rogue_radii) to place a small Earth beyond it (illustrative)."""
    def f(ctx, t, u, fi):
        e = ease(u)
        dd = np.exp(lerp(np.log(dist[0]), np.log(dist[1]), e)) * R_ROGUE
        a, b = np.radians(lerp(az[0], az[1], e)), np.radians(lerp(el[0], el[1], e))
        pos = dd * np.array([np.sin(a) * np.cos(b), np.sin(b), np.cos(a) * np.cos(b)])
        tgt = np.array([aim[0], aim[1], 0.0]) * R_ROGUE
        cam = Camera(pos, tgt, fov=fov)
        img = cam.sky(gain=0.9)
        sun = None
        if sun_az is not None:
            sa = np.radians(sun_az)
            sun = np.array([np.sin(sa), 0.15, np.cos(sa)]) * 1e12
        img, _ = cam.body(img, (0, 0, 0), R_ROGUE, "custom", sun=sun, draw=rogue_drawer(lit=lit, glow=glow, spin=0.2 + 0.03 * ctx.ru(t)))
        if earth is not None:
            ea, ee, ed = earth
            p = ed * R_ROGUE * np.array([np.sin(np.radians(ea)) * np.cos(np.radians(ee)), np.sin(np.radians(ee)), np.cos(np.radians(ea)) * np.cos(np.radians(ee))])
            img, xy = cam.body(img, p, R_EARTH, "earth", sun=sun if sun is not None else -p * 1e6, spin=1.2)
        return img, dict(exposure=1.5, bloom=0.6)
    return f


# ═══════════════════════════ 3. the Solar System in 3D, from a simulation run ═══════════════════════════
PL_COL = dict(Mercury=(0.7, 0.68, 0.65), Venus=(1.0, 0.85, 0.55), Earth=BLUE, Mars=(1.0, 0.5, 0.35), Jupiter=(1.0, 0.8, 0.6),
              Saturn=(0.95, 0.85, 0.6), Uranus=(0.6, 0.9, 1.0), Neptune=(0.45, 0.6, 1.0))
PL_KIND = dict(Mercury="mercury", Venus="venus", Earth="earth", Mars="mars", Jupiter="jupiter", Saturn="saturn", Uranus="uranus", Neptune="neptune")


def _xyz(p):
    """Simulation (x, y, z) in the ecliptic → render space with y up."""
    p = np.asarray(p, np.float64)
    return np.stack([p[..., 0], p[..., 2], -p[..., 1]], -1)


@functools.lru_cache(256)
def _track(day, t0, t1, idx, n=300):
    sol, tp = M.run(day)
    ts = tp + np.linspace(t0, t1, n) / M.YR_D
    Y = sol.sol(np.clip(ts, sol.t[0], sol.t[-1]))
    return _xyz(np.stack([Y[idx] - Y[0], Y[idx + 1] - Y[1], Y[idx + 2] - Y[2]], -1))


@scene_factory(vectors=["look"], keys=["run"])
def system3d(run="d+0.00", t=(-120.0, -60.0), dist=(4.0, 3.0), az=(30.0, 40.0), el=(22.0, 16.0), look=(0.0, 0.0),
             follow=(0.0, 0.0), enlarge=1400.0, outer=False, trail=60.0, fov=48.0, moon=False, earth_ghost=True,
             rogue_scale=1.0, focus_rogue=(0.0, 0.0), far_ring=False, moon_x=40.0):
    """A camera flying around the Sun (dist in AU, azimuth/elevation in degrees), aimed at the Sun, Earth (follow → 1)
    or the rogue (focus_rogue → 1). Planets are drawn `enlarge` times their true size (labelled on screen)."""
    day = float(run[1:])

    def f(ctx, tt, u, fi):
        e = ease(u)
        ty = lerp(t[0], t[1], u)
        st = M.state(day, ty)
        sun = np.zeros(3)
        ep = _xyz(st["earth"] - st["sun"])
        rp = _xyz(st["rogue"] - st["sun"])
        fo, fr = lerp(follow[0], follow[1], e), lerp(focus_rogue[0], focus_rogue[1], e)
        tgt = sun * (1 - fo - fr) + ep * fo + rp * fr + np.array([look[0], 0, look[1]])
        dd = lerp(dist[0], dist[1], e)
        a, b = np.radians(lerp(az[0], az[1], e)), np.radians(lerp(el[0], el[1], e))
        pos = tgt + dd * np.array([np.sin(a) * np.cos(b), np.sin(b), np.cos(a) * np.cos(b)])
        cam = Camera(pos, tgt, fov=fov)
        img = cam.sky(gain=0.75)
        # original orbits, faint; Earth's brighter
        for name, a_ in S.PLANETS:
            if name in ("Jupiter", "Saturn", "Uranus", "Neptune") and not outer:
                continue
            col = PL_COL[name]
            if name == "Earth" and not earth_ghost:
                continue
            img = cam.polyline(img, ring_pts(sun, a_, n=360), col, width=2 if name == "Earth" else 1, alpha=0.40 if name == "Earth" else 0.18, glow=0.4)
        # Earth's real track (bright), the rogue's path (dashed ahead)
        Ptr = _track(day, round(ty - trail, 1), round(ty, 1), M.IE)
        img = cam.polyline(img, Ptr, BLUE, width=3, alpha=0.95, glow=0.9)
        Rpath = _track(day, round(ty - 220, 1), round(ty + 220, 1), 6)
        half = len(Rpath) // 2
        img = cam.polyline(img, Rpath[:half + 1], VIOLET, width=2, alpha=0.75, glow=0.6)
        img = cam.polyline(img, Rpath[half:], VIOLET, width=2, alpha=0.45, dashed=True, glow=0.3)
        img = cam.sun(img, sun, (R_SUN / KM) * 5, t=tt, glare=0.45, flare=False)
        if far_ring:
            img = cam.polyline(img, ring_pts(sun, 1000.0, n=720), VIOLET, width=2, alpha=0.6, glow=0.6)
            sol, tp = M.run(day)
            d0 = _xyz(sol.y[6:9, 0] - sol.y[0:3, 0])
            fp = d0 / np.linalg.norm(d0) * 1000.0
            x_, y_, z_ = cam.project(fp)
            if z_ > 0:
                glow_dot(img, x_, y_, VIOLET, 4, 4)
                glow_dot(img, x_, y_, VIOLET, 22, 0.4)
                ctx.state.setdefault("pts3", {})
                far_xy = (x_, y_, 4)
            else:
                far_xy = None
        else:
            far_xy = None
        bodies = []
        for k, (name, a_) in enumerate(S.PLANETS):
            if name in ("Jupiter", "Saturn", "Uranus", "Neptune") and not outer:
                continue
            p = _xyz(st[name.lower()] - st["sun"])
            rad = {"Mercury": 2440, "Venus": 6052, "Earth": 6371, "Mars": 3390, "Jupiter": 69911 / 4, "Saturn": 58232 / 4,
                   "Uranus": 25362 / 2, "Neptune": 24622 / 2}[name] / KM * enlarge
            bodies.append((np.linalg.norm(p - pos), "planet", name, p, rad))
        bodies.append((np.linalg.norm(rp - pos), "rogue", "Rogue", rp, R_ROGUE / KM * enlarge * 0.25 * rogue_scale))
        if moon:
            mp = ep + (_xyz(st["moon"] - st["earth"])) * moon_x
            bodies.append((np.linalg.norm(mp - pos), "moon", "Moon", mp, R_MOON / KM * enlarge))
        pts = {}
        for _, kind, name, p, rad in sorted(bodies, key=lambda x: -x[0]):
            if kind == "rogue":
                img, xy = cam.body(img, p, rad, "custom", sun=sun, draw=rogue_drawer(lit=1.0, glow=0.6))
                if xy is not None and xy[2] < 3:
                    glow_dot(img, xy[0], xy[1], VIOLET, 3, 3)
            else:
                img, xy = cam.body(img, p, rad, PL_KIND.get(name, "moon"), sun=sun, spin=1.0)
                if xy is not None and xy[2] < 3:
                    glow_dot(img, xy[0], xy[1], PL_COL.get(name, WHITE), 2.6, 3)
            if xy is not None:
                pts[name] = xy
        x, y, z = cam.project(sun)
        if z > 0:
            pts["Sun"] = (x, y, 10)
        if far_xy is not None:
            pts["Far"] = far_xy
        ctx.state["pts3"] = pts
        return img, dict(exposure=1.45, bloom=0.65)
    return f


# ═══════════════════════════ 4. the close pass, from beside Earth (real geometry, km) ═══════════════════════════
@scene_factory(vectors=["off"], keys=["run"])
def pass_scene(run="d+0.00", t=(-5.0, -4.2), cam_d=(26000.0, 22000.0), az=(160.0, 200.0), el=(6.0, 10.0), fov=(55.0, 55.0),
               look_rogue=(1.0, 1.0), moon=True, stretch=1.0, shake=0.0):
    """Camera cam_d km from Earth, on the far side from the rogue (az/el measured around the Earth→rogue line), aimed
    between Earth and the rogue. Sun direction, the rogue's distance and the Moon's position are the simulation's."""
    day = float(run[1:])

    def f(ctx, tt, u, fi):
        e = ease(u)
        ty = lerp(t[0], t[1], u)
        st = M.state(day, ty)
        E = _xyz(st["earth"]) * KM
        R = _xyz(st["rogue"]) * KM
        Mo = _xyz(st["moon"]) * KM
        Sn = _xyz(st["sun"]) * KM
        d = R - E
        dn = d / np.linalg.norm(d)
        up = np.array([0.0, 1.0, 0.0])
        side = np.cross(dn, up)
        side /= np.linalg.norm(side)
        up2 = np.cross(side, dn)
        a, b = np.radians(lerp(az[0], az[1], e)), np.radians(lerp(el[0], el[1], e))
        off = (np.cos(a) * dn + np.sin(a) * side) * np.cos(b) + up2 * np.sin(b)
        cd = lerp(cam_d[0], cam_d[1], e)
        pos = E + off * cd
        lk = lerp(look_rogue[0], look_rogue[1], e)
        tgt = E * (1 - lk * 0.5) + (E + dn * 60000) * lk * 0.5
        cam = Camera(pos, tgt, fov=lerp(fov[0], fov[1], e), shake=shake, t=tt)
        img = cam.sky(gain=0.8)
        img = cam.sun(img, Sn, R_SUN, t=tt, glare=0.7)
        items = [(np.linalg.norm(R - pos), "rogue", R), (np.linalg.norm(E - pos), "earth", E)]
        if moon:
            items.append((np.linalg.norm(Mo - pos), "moon", Mo))
        pts = {}
        for _, kind, p in sorted(items, key=lambda x: -x[0]):
            if kind == "rogue":
                img, xy = cam.body(img, p, R_ROGUE, "custom", sun=Sn, draw=rogue_drawer(lit=1.15, glow=0.7, spin=0.25 + 0.4 * u))
            elif kind == "earth":
                img, xy = cam.body(img, p, R_EARTH, "earth", sun=Sn, spin=1.0 + 2 * np.pi * ty, stretch=stretch, night=1.0)
            else:
                img, xy = cam.body(img, p, R_MOON, "moon", sun=Sn)
            if xy is not None:
                pts[kind] = xy
        ctx.state["pts3"] = pts
        ctx.state["dist_km"] = float(np.linalg.norm(d))
        return img, dict(exposure=1.5, bloom=0.65)
    return f


# ═══════════════════════════ 5. chasing Earth as it is flung away (the Sun shrinks behind) ═══════════════════════════
@scene_factory(keys=["run"])
def chase_scene(run="d+0.00", t=(30.0, 400.0), back=(30000.0, 30000.0), look_back=(0.0, 1.0), side=(0.35, 0.2), moon=False, fov=55.0):
    """Camera trails Earth along its velocity. look_back 0 = looking ahead past Earth into the dark, 1 = looking back
    past Earth at the Sun (its true angular size at Earth's distance)."""
    day = float(run[1:])

    def f(ctx, tt, u, fi):
        e = ease(u)
        ty = np.exp(lerp(np.log(max(t[0], 0.5)), np.log(t[1]), u))
        st = M.state(day, ty)
        st2 = M.state(day, ty + 0.5)
        E = _xyz(st["earth"]) * KM
        v = (_xyz(st2["earth"]) * KM - E)
        v /= np.linalg.norm(v)
        Sn = _xyz(st["sun"]) * KM
        up = np.array([0.0, 1.0, 0.0])
        sd = np.cross(v, up)
        sd /= np.linalg.norm(sd)
        lb = lerp(look_back[0], look_back[1], e)
        bk = lerp(back[0], back[1], e)
        s_ = lerp(side[0], side[1], e)
        pos = E - v * bk * (1 - 2 * lb) + sd * bk * s_ + up * bk * 0.12
        tgt = E * (1 - lb) + (E + (Sn - E) / np.linalg.norm(Sn - E) * 1e7) * lb if lb > 0 else E + v * 4e4
        tgt = (E + v * 4e4) * (1 - lb) + (E + (Sn - E) / np.linalg.norm(Sn - E) * 1e7) * lb
        cam = Camera(pos, tgt, fov=fov)
        img = cam.sky(gain=0.9)
        img = cam.sun(img, Sn, R_SUN, t=tt, glare=float(np.clip(2.0 / (np.linalg.norm(Sn - E) / KM), 0.15, 1.0)), flare=False)
        img, xy = cam.body(img, E, R_EARTH, "earth", sun=Sn, spin=1.0 + 2 * np.pi * ty * 0.02, night=1.0)
        if moon:
            Mo = _xyz(st["moon"]) * KM
            img, _ = cam.body(img, Mo, R_MOON, "moon", sun=Sn)
        ctx.state["sun_au"] = float(np.linalg.norm(Sn - E) / KM)
        ctx.state["ty"] = ty
        return img, dict(exposure=1.5, bloom=0.65)
    return f


# ═══════════════════════════ 6. the calendar as Earth's real orbit, one marker per run ═══════════════════════════
@functools.lru_cache(1)
def _cal_geom():
    F = year_fates()
    days = np.array([d for d, _, _ in F])
    th = np.radians(-days * S.DEG_PER_DAY) + np.pi / 2          # marker angle on the ring: the crossing point at +90°
    pos = np.stack([np.cos(th), np.zeros_like(th), -np.sin(th)], -1)
    return days, pos, [f for _, f, _ in F], [m for _, _, m in F]


@scene_factory(vectors=["hl"], keys=[])
def orbit_calendar(dist=(3.2, 2.6), az=(-30.0, 0.0), el=(55.0, 35.0), aim=(0.0, 0.0), show=("scorched", "frozen", "ejected", "changed", "same"),
                   reveal=(1.0, 1.0), hl=(0.0, 0.0), hl_on=False, moon_marks=False, earth_day=None, fov=46.0, path=True, heights=1.0):
    """Earth's orbit (1 AU ring) with 730 markers standing at Earth's position for each arrival date; tall coloured
    markers are the world-ending dates. aim: point on the ring the camera looks at (0 = the Sun; 1 = the crossing point)."""
    def f(ctx, t, u, fi):
        e = ease(u)
        days, P, fates, ml = _cal_geom()
        cross = np.array([0.0, 0.0, -1.0])
        tgt = cross * lerp(aim[0], aim[1], e)
        a, b = np.radians(lerp(az[0], az[1], e)), np.radians(lerp(el[0], el[1], e))
        dd = lerp(dist[0], dist[1], e)
        pos = tgt + dd * np.array([np.sin(a) * np.cos(b), np.sin(b), np.cos(a) * np.cos(b)])
        cam = Camera(pos, tgt, fov=fov)
        img = cam.sky(gain=0.6)
        img = cam.polyline(img, ring_pts(np.zeros(3), 1.0, n=720), BLUE, width=1, alpha=0.35)
        rv = lerp(reveal[0], reveal[1], e)
        x0, y0, z0 = cam.project(P)
        top = P + np.array([0, 1.0, 0]) * np.array([[0.02 if fa in ("same",) else (0.05 if fa == "changed" else 0.16)] for fa in fates]) * heights
        x1, y1, z1 = cam.project(top)
        m = np.zeros((H, W, 3), np.float32)
        order = np.argsort(-z0)
        for i in order:
            k = (days[i] + 182.5) / 365.0
            if k > rv or z0[i] <= 0.01 or z1[i] <= 0.01 or max(abs(x0[i]), abs(x1[i])) > 8 * W or max(abs(y0[i]), abs(y1[i])) > 8 * H:
                continue
            fa = fates[i]
            col = np.array(FATE_COL[fa] if fa in show else FATE_COL["same"], np.float32)
            if fa == "same":
                col = col * 4.0
            hi = hl_on and hl[0] <= days[i] <= hl[1]
            if hi:
                col = col * 1.8
            th = max(1, int(3.0 / max(z0[i], 0.3)))
            cv2.line(m, (int(x0[i] * 4), int(y0[i] * 4)), (int(x1[i] * 4), int(y1[i] * 4)), tuple(float(c) for c in col), th, cv2.LINE_AA, 2)
            if moon_marks and ml[i]:
                glow_dot(img, x1[i], y1[i] - 6, (0.95, 0.95, 1.0), 1.8, 2.0)
        img += m + fast_blur(m, 6) * 0.8
        img = cam.sun(img, np.zeros(3), 0.02, glare=0.6, flare=False)
        if path:
            pp = np.array([[x, 0.0, -1.0 + 0.0 * x] for x in np.linspace(-3.5, 3.5, 120)])
            pp[:, 1] = np.tan(np.radians(4)) * pp[:, 0]
            img = cam.polyline(img, pp, VIOLET, width=2, alpha=0.6, dashed=True, glow=0.5)
        if earth_day is not None:
            dday = lerp(earth_day[0], earth_day[1], e)
            th_ = np.radians(-dday * S.DEG_PER_DAY) + np.pi / 2
            ep = np.array([np.cos(th_), 0.0, -np.sin(th_)])
            img, xy = cam.body(img, ep, 0.03, "earth", sun=np.zeros(3), spin=1.0)
            ctx.state["earth_xy"] = xy
        ctx.state["cal3"] = cam
        return img, dict(exposure=1.4, bloom=0.7)
    return f


def cal_xy(ctx, day, lift=0.22):
    cam = ctx.state["cal3"]
    th = np.radians(-day * S.DEG_PER_DAY) + np.pi / 2
    x, y, z = cam.project(np.array([np.cos(th), lift, -np.sin(th)]))
    return x, y


# ═══════════════════════════ 7. a wall of 730 Earths, one per run ═══════════════════════════
@functools.lru_cache(8)
def _earth_sprite(kind, R=36):
    s = int(R * 2 + 8)
    img = np.zeros((s, s, 3), np.float32)
    kw = dict(scorched=dict(scorch=0.9), frozen=dict(ice=1.0, exposure=0.8), ejected=dict(exposure=0.12, lights_fade=1.6),
              changed=dict(), same=dict()).get(kind, {})
    light = (-0.5, 0.3, 0.8) if kind != "ejected" else (0.2, 0.1, -1.0)
    render_planet(img, s / 2, s / 2, R, "earth", spin=1.0 + hash(kind) % 7 * 0.5, tilt=0.4, light=light, night=1.0, **kw)
    return img


@scene_factory(keys=[])
def wall_scene(cam_x=(-0.2, 0.25), cam_z=(1.6, 0.9), cam_y=(0.5, 0.25), look_x=(0.0, 0.45), fov=50.0, show=True, reveal=(1.0, 1.0)):
    """730 Earths in rows of 40 (one per half-day arrival date, in calendar order) on a plane; the camera glides over
    them. With show=False all look the same (before the result); with show=True each wears its fate."""
    def f(ctx, t, u, fi):
        e = ease(u)
        F = year_fates()
        n = len(F)
        cols = 40
        rows = int(np.ceil(n / cols))
        cam = Camera((lerp(cam_x[0], cam_x[1], e), lerp(cam_y[0], cam_y[1], e), lerp(cam_z[0], cam_z[1], e)),
                     (lerp(look_x[0], look_x[1], e), 0.0, -0.2), fov=fov)
        img = cam.sky(gain=0.5)
        sp = 0.05
        P = np.array([[(i % cols - cols / 2) * sp, 0.0, -(i // cols) * sp + rows * sp / 2] for i in range(n)])
        x, y, z = cam.project(P)
        rv = lerp(reveal[0], reveal[1], e)
        for i in np.argsort(-z):
            if z[i] <= 0.02 or i / n > rv:
                continue
            fa = F[i][1] if show else "same"
            R = cam.f * 0.018 / z[i]
            if R < 1.0 or not (-R < x[i] < W + R and -R < y[i] < H + R):
                continue
            spr = _earth_sprite(fa if fa in ("scorched", "frozen", "ejected") else "same")
            sz = int(max(3, R * 2 * spr.shape[0] / 80))
            sm = cv2.resize(spr, (sz, sz), interpolation=cv2.INTER_AREA)
            x0, y0 = int(x[i] - sz / 2), int(y[i] - sz / 2)
            xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + sz), min(H, y0 + sz)
            if xb <= xa or yb <= ya:
                continue
            patch = sm[ya - y0:yb - y0, xa - x0:xb - x0]
            a_ = np.clip(patch.max(-1, keepdims=True) * 6, 0, 1)
            img[ya:yb, xa:xb] = img[ya:yb, xa:xb] * (1 - a_) + patch
            if show and fa in ("scorched", "frozen", "ejected"):
                glow_dot(img, x[i], y[i], FATE_COL[fa], R * 1.3, 0.25)
        return img, dict(exposure=1.45, bloom=0.7)
    return f


# ═══════════════════════════ 8. infrared: the black planet glows ═══════════════════════════
def _inferno(v):
    v = np.clip(v, 0, 1)[..., None]
    stops = np.array([[0.0, 0.0, 0.02], [0.25, 0.05, 0.40], [0.70, 0.13, 0.35], [0.98, 0.45, 0.10], [1.0, 0.95, 0.65]], np.float32)
    x = v * (len(stops) - 1)
    i = np.clip(x.astype(int), 0, len(stops) - 2)
    fr = x - i
    return stops[i[..., 0]] * (1 - fr) + stops[i[..., 0] + 1] * fr


@scene_factory(keys=[])
def infrared_scene(wipe=(0.0, 1.0), R=(380.0, 400.0), pos=(960.0, 540.0)):
    """The rogue as your eyes would see it (left of the scan line: black, a rim of starlight) and in infrared (right:
    its own heat, false colour). The scan line sweeps across."""
    def f(ctx, t, u, fi):
        cam = Camera((0, 0, 4.2 * R_ROGUE), (0, 0, 0), fov=40)
        img = cam.sky(gain=0.8)
        vis = draw_rogue(img.copy(), pos[0], pos[1], lerp(R[0], R[1], ease(u)), light=(-0.85, -0.3, -0.3), lit=0.0, glow=0.15, spin=0.3 + 0.02 * t)
        em = np.zeros_like(img)
        _, al = render_planet(em, pos[0], pos[1], lerp(R[0], R[1], ease(u)), "jupiter", spin=0.3 + 0.02 * t, tilt=0.25, light=(0, 0, 1), exposure=1.0, atmo=(0, 0, 0))
        lum = em.mean(-1)
        heat = clamp(1.25 - lum * 1.6)                       # dark belts = warmer (deeper) layers
        xs, ys = grid()
        r = np.sqrt((xs - pos[0]) ** 2 + (ys - pos[1]) ** 2) / lerp(R[0], R[1], ease(u))
        heat = heat * (0.55 + 0.45 * np.sqrt(np.clip(1 - r ** 2, 0, 1)))  # limb darkening
        ir = _inferno(heat) * al[..., None] * 1.3 + img * (1 - al[..., None]) * 0.35
        wx = lerp(-100, W + 100, lerp(wipe[0], wipe[1], ease(u)))
        m = clamp((xs - wx) / 3 + 0.5)[..., None]
        out = vis * (1 - m) + ir * m
        out += np.exp(-((xs - wx) / 2.5) ** 2)[..., None] * np.array([0.9, 0.6, 1.0], np.float32) * 0.8
        ctx.state["wipe_x"] = wx
        return out, dict(exposure=1.4, bloom=0.6)
    return f


# ═══════════════════════════ 9. Earth close-ups (fates), with a real camera move ═══════════════════════════
@scene_factory(vectors=["sun_dir"], keys=["view"])
def earth3d(view="space", dist=(3.2, 2.6), az=(-25.0, 15.0), el=(10.0, 14.0), sun_dir=(-1.0, 0.25, 0.35), sun_size=(0.0, 0.0),
            scorch=(0.0, 0.0), ice=(0.0, 0.0), exposure=(1.0, 1.0), lights=(1.0, 1.0), moon=None, rogue=None, fov=40.0, aim=(0.0, 0.0), stretch=(1.0, 1.0)):
    """Earth at the origin (radius 1), camera at dist radii. sun_size > 0 draws the Sun (angular radius in degrees)
    in the sky along sun_dir. moon / rogue: (dir, dist in Earth radii, radius in Earth radii)."""
    def f(ctx, t, u, fi):
        e = ease(u)
        a, b = np.radians(lerp(az[0], az[1], e)), np.radians(lerp(el[0], el[1], e))
        dd = lerp(dist[0], dist[1], e)
        pos = dd * np.array([np.sin(a) * np.cos(b), np.sin(b), np.cos(a) * np.cos(b)])
        cam = Camera(pos, (aim[0], aim[1], 0.0), fov=fov)
        img = cam.sky(gain=0.8)
        sdir = np.asarray(sun_dir, np.float64)
        sdir /= np.linalg.norm(sdir)
        ss = lerp(sun_size[0], sun_size[1], e)
        if ss > 0:
            dsun = 1e6
            img = cam.sun(img, sdir * dsun, np.tan(np.radians(ss)) * dsun, t=t, glare=1.2)
        if rogue is not None:
            rd, rdist, rr = rogue
            rd = np.asarray(rd, np.float64) / np.linalg.norm(rd)
            img, _ = cam.body(img, rd * rdist, rr, "custom", sun=sdir * 1e9, draw=rogue_drawer(lit=1.1, glow=0.7, spin=0.3))
        if moon is not None:
            md, mdist, mr = moon
            md = np.asarray(md, np.float64) / np.linalg.norm(md)
            img, _ = cam.body(img, md * mdist, mr, "moon", sun=sdir * 1e9)
        img, xy = cam.body(img, (0, 0, 0), 1.0, "earth", sun=sdir * 1e9, spin=1.0 + 0.15 * ctx.ru(t), night=1.0,
                           scorch=lerp(scorch[0], scorch[1], u), ice=lerp(ice[0], ice[1], u), exposure=lerp(exposure[0], exposure[1], u),
                           lights_fade=lerp(lights[0], lights[1], u), stretch=lerp(stretch[0], stretch[1], e))
        ctx.state["earth_xy"] = xy
        return img, dict(exposure=1.5, bloom=0.65)
    return f


# ═══════════════════════════ 10. from the ground ═══════════════════════════
@scene_factory(keys=["view"])
def ground_scene(view="night", fg="city", sun_alt=(-25.0, -25.0), sun_az=-60.0, view_az=(0.0, 4.0), pitch=(14.0, 16.0), fov=(60.0, 58.0),
                 rogue_alt=(26.0, 26.0), rogue_az=(12.0, 12.0), rogue_size=(0.0, 0.0), rogue_bright=(0.3, 0.3), rogue_light=(-0.7, 0.3, 0.6),
                 moon_alt=None, moon_az=-18.0, moon_size=(0.52, 0.52), timelapse=(0.0, 0.0), city_lights=1.0, sun_disk=False, sun_size=1.0):
    def f(ctx, t, u, fi):
        e = ease(u)
        rs = lerp(rogue_size[0], rogue_size[1], e)
        rog = dict(alt=lerp(rogue_alt[0], rogue_alt[1], e), az=lerp(rogue_az[0], rogue_az[1], e), size_deg=rs,
                   bright=lerp(rogue_bright[0], rogue_bright[1], e), light=rogue_light, lit=1.1, glow=0.6) if rogue_bright[1] > 0 or rs > 0 else None
        mo = dict(alt=lerp(moon_alt[0], moon_alt[1], e), az=moon_az, size_deg=lerp(moon_size[0], moon_size[1], e)) if moon_alt is not None else None
        img, pos, fpx = ground_view(t, sun_alt=lerp(sun_alt[0], sun_alt[1], e), sun_az=sun_az, view_az=lerp(view_az[0], view_az[1], e),
                                    pitch=lerp(pitch[0], pitch[1], e), fov=lerp(fov[0], fov[1], e), fg=fg, rogue=rog, moon=mo,
                                    timelapse=lerp(timelapse[0], timelapse[1], u), city_lights=city_lights, sun_disk=sun_disk, sun_scale=sun_size)
        if view == "binoc":
            from engine.scenes2 import scope_view
            img = scope_view(img)
        ctx.state["gpos"] = pos
        return img, dict(exposure=1.5, bloom=0.6)
    return f


# ═══════════════════════════ bold typography ═══════════════════════════
def bold(s, at, x=W / 2, y=H / 2, size=150, color=WHITE, anchor="c", sub=None, sub_col=ACC, until=None, kind="black"):
    """Big, heavy words for the moments that matter (used sparingly)."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        a = fade(t, tt, until if until else ctx.dur, 0.3)
        if a <= 0:
            return img
        sc = 1.0 + 0.04 * (1 - smooth(clamp((t - tt) / 0.5)))
        spr = cards.sprite(s, kind, int(size * sc), -0.02)
        sh = cv2.GaussianBlur(np.pad(spr, 40), (0, 0), 16)[40:-40, 40:-40]
        cards.put(img, sh, x + 4, y + 8, (0, 0, 0), 0.85 * a, anchor)
        cards.put(img, spr, x, y, color, a, anchor)
        if sub:
            dy = spr.shape[0] / 2 + 34 if anchor == "c" else spr.shape[0] + 30
            img = text(img, sub, x if anchor == "c" else x + 6, y + dy, 26, sub_col, a, "c" if anchor == "c" else "lc", kind="mono6", tracking=0.25)
        return img
    return f


def small(s, at, x=140, y=120, color=DIM, size=20):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        return text(img, s, x, y, size, color, fade(t, tt), "lc", tracking=0.3)
    return f


def over_all(*fns):
    def f(ctx, img, t, u):
        for fn in fns:
            if fn is not None:
                img = fn(ctx, img, t, u)
        return img
    return f


def tag3(name, label, at=0.3, dx=60, dy=-40, color=WHITE, size=22):
    """A light label next to a body drawn by a 3D scene (pts3)."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        p = ctx.state.get("pts3", {}).get(name)
        if p is None:
            return img
        x, y, R = p
        L = Layer()
        a = fade(t, tt)
        ox, oy = x + (R + 14) * np.sign(dx), y + dy * 0.2
        L.line((ox, oy), (ox + dx, oy + dy), color=color, alpha=a * 0.8, th=1, progress=prog(t, tt, 0.5))
        img = L.composite(img, 0.3)
        return text(img, label, ox + dx + (8 if dx > 0 else -8), oy + dy, size, color, a, "lc" if dx > 0 else "rc", kind="mono6", tracking=0.12)
    return f
