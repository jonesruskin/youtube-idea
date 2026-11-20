"""Episode 5 scenes, part 3: the archive, the explainers and the road.

  dome        a mountaintop observatory under the stars (Kitt Peak, 2004: impression)
  blink       two exposures of the same patch of sky, alternating: every star stays put, one dot moves
  odds_meter  where Apophis could be in April 2029 (the cloud of possible paths) against Earth's disc: the cloud
              shrinks night by night; while Earth sits inside it, the odds go UP; old pictures move it off Earth
  radar       a delay-Doppler radar image made from our shape model: two lobes
  tide        the pull on the near end vs the far end, and the stretch that is the tide
  orbit_map   the Sun, Earth's orbit, and Apophis's orbit before and after (Horizons elements and vectors)
  road        a cyclist at dusk; a truck passes too close; the truck goes on, the bike wobbles
plus overlay helpers (labels, the Universal Time clock)."""
import functools, os
import numpy as np, cv2
from engine.beats import scene_factory
from engine.core import W, H, clamp, smooth, span, lerp, grid, fbm, blur, fast_blur, glow_dot, splat_points, cached, make_starfield
from engine import cards
from engine.hud import text, fade, prog, Layer
from engine.cam3d import Camera
from ep_apophis import model as M
from ep_apophis.scene_sky import draw_earth, ease, L2, GOLD, CYAN, INK, SAT, SODIUM

DIM = (0.70, 0.74, 0.80)
RED = (1.0, 0.38, 0.32)
GREEN = (0.55, 1.0, 0.65)


# ═══════════════════════════════════════════ overlays ═══════════════════════════════════════════
def over_all(*fns):
    def f(ctx, img, t, u):
        for fn in fns:
            if fn is not None:
                img = fn(ctx, img, t, u)
        return img
    return f


def _at(ctx, at):
    return at if isinstance(at, (int, float)) else ctx.w(at)


def label(s, at=0.2, x=W / 2, y=H * 0.86, size=40, color=INK, kind="light", until=None, anchor="c", panel=True):
    """One line of on-screen text (Inter Light), fading in on its word."""
    def f(ctx, img, t, u):
        a = fade(t, _at(ctx, at), until if until else ctx.dur, 0.35)
        if a <= 0 or os.environ.get("QA_NOTEXT"):
            return img
        if panel:
            spr = cards.sprite(s, kind, int(size * 1.2) if size < 60 else size, 0.02)
            hh, ww = spr.shape
            x0 = x - ww / 2 if anchor == "c" else (x if anchor[0] == "l" else x - ww)
            ys, xs = int(max(0, y - hh)), int(min(H, y + hh))
            xa, xb = int(max(0, x0 - 40)), int(min(W, x0 + ww + 40))
            yy = np.linspace(-1, 1, ys and (xs - ys) or (xs - ys))[:, None]
            xx = np.linspace(-1, 1, xb - xa)[None, :]
            m = np.exp(-(yy ** 2 * 2 + xx ** 8)) * 0.55 * a
            img[ys:xs, xa:xb] *= (1 - m)[..., None]
        return text(img, s, x, y, size=size, color=color, alpha=a, anchor=anchor, kind=kind, tracking=0.02)
    return f


def tag(s, at=0.2, x=120, y=110, sub=None, color=INK):
    """Small mono capitals with a hairline: places, dates, things."""
    def f(ctx, img, t, u):
        a = fade(t, _at(ctx, at), ctx.dur, 0.3)
        if a <= 0 or os.environ.get("QA_NOTEXT"):
            return img
        img = text(img, s.upper(), x, y, size=24, color=color, alpha=a, anchor="lc", kind="mono6", tracking=0.2)
        wd = cards.sprite(s.upper(), "mono6", 29, 0.2).shape[1]
        p = prog(t, _at(ctx, at), 0.6)
        img[int(y + 22):int(y + 24), int(x):int(x + wd * p)] = img[int(y + 22):int(y + 24), int(x):int(x + wd * p)] * (1 - a) + np.array(GOLD, np.float32) * a
        if sub:
            img = text(img, sub, x, y + 52, size=24, color=DIM, alpha=a * 0.9, anchor="lc", kind="mono", tracking=0.08)
        return img
    return f


def utc(h0, h1=None, at=0.0, x=W - 110, y=96):
    """The Universal Time clock (top right): the one thing always moving on the ground and on the asteroid."""
    def f(ctx, img, t, u):
        a = fade(t, _at(ctx, at), ctx.dur, 0.3)
        if a <= 0 or os.environ.get("QA_NOTEXT"):
            return img
        hh = h0 if h1 is None else lerp(h0, h1, u)
        hh = ctx.state.get("h", hh) if h1 is None and "h" in ctx.state else hh
        hm = M.hhmm(hh)
        img = text(img, hm, x, y, size=64, color=INK, alpha=a, anchor="rc", kind="light", tracking=0.04)
        img = text(img, "UT · 13 APRIL 2029", x, y + 50, size=18, color=GOLD, alpha=a * 0.9, anchor="rc", kind="mono6", tracking=0.25)
        return img
    return f


def pointer(key, s, dx=60, dy=-50, at=0.2, color=GOLD, size=30, ring=18):
    """A ring around a tracked object (ctx.state[key] = (x, y)) and a short leader to a label."""
    def f(ctx, img, t, u):
        p = ctx.state.get(key)
        a = fade(t, _at(ctx, at), ctx.dur, 0.3)
        if p is None or a <= 0:
            return img
        x, y = float(p[0]), float(p[1])
        if not (0 < x < W and 0 < y < H):
            return img
        L = Layer()
        L.circle((x, y), ring, color, a * 0.9, th=2, progress=prog(t, _at(ctx, at), 0.5))
        if s:
            ux, uy = dx / (np.hypot(dx, dy) + 1e-6), dy / (np.hypot(dx, dy) + 1e-6)
            L.line((x + ux * ring * 1.2, y + uy * ring * 1.2), (x + dx, y + dy), color=color, alpha=a * 0.8, th=2)
        img = L.composite(img, 0.4)
        if s and not os.environ.get("QA_NOTEXT"):
            img = text(img, s, x + dx + (10 if dx >= 0 else -10), y + dy, size=size, color=INK, alpha=a, anchor="lc" if dx >= 0 else "rc", kind="light", tracking=0.02)
        return img
    return f


# ═══════════════════════════════════════════ 2004: the mountaintop ═══════════════════════════════════════════
@scene_factory(keys=[])
def dome(pan=(0.0, 40.0), zoom=(1.0, 1.06), slit=(0.0, 1.0)):
    """A ridge of white observatory domes under a starry desert sky; the big dome's slit opens and its telescope's
    beam of sky light points up."""
    stars, _ = make_starfield(2400, 1400, 9000, seed=41, brightness=1.0)

    def f(ctx, t, u, fi):
        e = ease(u)
        px, z = L2(pan, e), L2(zoom, e)
        M_ = cv2.getRotationMatrix2D((1200, 700), 0, z)
        M_[0, 2] += W / 2 - 1200 - px
        M_[1, 2] += H / 2 - 700
        img = cv2.warpAffine(stars, M_, (W, H))
        xs, ys = grid()
        img += (np.exp(-(H - ys) / 260.0)[..., None] * np.array([0.10, 0.07, 0.12], np.float32))
        lay = np.zeros((H, W), np.float32)
        xr = np.arange(W, dtype=np.float32)
        ridge = H * 0.70 - 70 * np.sin((xr + px * z) / 380) - 40 * np.sin((xr + px * z) / 140 + 1) - 110 * np.exp(-((xr - W * 0.45 + px) / 420) ** 2)
        for x in range(W):
            lay[int(max(0, ridge[x])):, x] = 1.0
        img = img * (1 - lay[..., None]) + lay[..., None] * np.array([0.012, 0.011, 0.014], np.float32)
        sl = L2(slit, e)
        for k, (dx, r) in enumerate(((-420, 46), (-160, 34), (60, 92), (330, 40), (520, 28))):
            cx = W * 0.45 + dx * z - px * z
            cy = ridge[int(np.clip(cx, 0, W - 1))] - 4
            mm = np.zeros((H, W), np.float32)
            cv2.ellipse(mm, (int(cx), int(cy)), (int(r * z), int(r * z)), 0, 180, 360, 1.0, -1, cv2.LINE_AA)
            cv2.rectangle(mm, (int(cx - r * z), int(cy)), (int(cx + r * z), int(cy + r * 0.9 * z)), 1.0, -1)
            shade = 0.10 + 0.06 * (xs - cx) / (r * z + 1) * -1
            img = img * (1 - mm[..., None]) + mm[..., None] * np.clip(shade, 0.03, 0.2)[..., None] * np.array([0.9, 0.92, 1.0], np.float32)
            if k == 2 and sl > 0:                     # the big dome's slit, open, with a faint red work light
                cv2.rectangle(img, (int(cx - 9 * z), int(cy - r * z)), (int(cx + 9 * z), int(cy)), (0.008, 0.006, 0.01), -1)
                glow_dot(img, cx, cy - r * z * 0.4, (1.0, 0.2, 0.15), 6, 0.6 * sl)
        return img, dict(exposure=1.4, bloom=0.5)
    return f


@scene_factory(keys=[])
def blink(frame=(0.0, 1.0), zoom=(1.0, 1.08), ring=0.0, rate=1.6, glare=(0.0, 0.0), seed=81):
    """Two exposures of the same star field, flicking back and forth (a blink comparator): every star stays put,
    one faint dot jumps. CCD look: grey sky, noise, white stars."""
    rng = np.random.default_rng(int(round(seed)))
    n = 900
    sx, sy = rng.uniform(0, W, n), rng.uniform(0, H, n)
    sb = (rng.pareto(1.8, n) + 1) ** 1.3 * 0.9
    A0, A1 = np.array([W * 0.47, H * 0.53]), np.array([W * 0.57, H * 0.47])

    def f(ctx, t, u, fi):
        e = ease(u)
        gt = ctx.seg["start"] + ctx.beat.t0 + t
        which = int(gt * rate) % 2
        img = np.full((H, W, 3), 0.07, np.float32)
        buf = np.zeros((H, W, 3), np.float32)
        buf = splat_points(buf, sx, sy, np.repeat(sb[:, None], 3, 1).astype(np.float32), sigma=1.6)
        img += buf
        ap = A0 if which == 0 else A1
        glow_dot(img, ap[0], ap[1], (1.0, 1.0, 1.0), 1.9, 0.9)
        nz = np.random.default_rng(int(gt * 30) % 997).normal(0, 0.012, (H // 2, W // 2)).astype(np.float32)
        img += cv2.resize(nz, (W, H))[..., None]
        gl = L2(glare, e)
        if gl > 0:                                     # the Sun's glare creeping in from the corner: the dot is lost
            xs_, ys_ = grid()
            dd = np.hypot(xs_ - W * 1.05, ys_ + H * 0.1) / W
            img = img + (np.exp(-dd * (3.2 - 2.2 * gl)) * 3.0 * gl)[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
        z = L2(zoom, e)
        Mz = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
        img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REFLECT)
        p = (ap - np.array([W / 2, H / 2])) * z + np.array([W / 2, H / 2])
        ctx.state["dot_xy"] = (p[0], p[1])
        ctx.state["frame"] = which
        if ring > 0:
            L = Layer()
            L.circle((p[0], p[1]), 30, GOLD, ring, th=3)
            img = L.composite(img, 0.4)
        return img, dict(exposure=1.2, bloom=0.2, grain=0.03, vig=True, grade=((0.0, 0.0, 0.0), (0.92, 0.95, 1.0)))
    return f


# ═══════════════════════════════════════════ the odds ═══════════════════════════════════════════
@scene_factory(keys=[])
def odds_meter(size=(1.0, 1.0), off=(0.0, 0.0), elong=(3.0, 3.0), keyhole=(0.0, 0.0), drift=(0.0, 0.0), odds=(0.0, 0.0), zoom=(1.0, 1.0)):
    """Where Apophis could pass Earth in April 2029: a cloud of possible paths (cyan) against Earth's disc (seen face
    on, real texture). size: cloud size in Earth radii; off: centre offset in Earth radii; odds: fraction of the
    cloud on Earth, shown as a meter. keyhole: a tiny slot beside Earth; drift: sunlight's push as an arrow."""
    rng = np.random.default_rng(3)
    pts = rng.normal(size=(2600, 2)).astype(np.float32)

    def f(ctx, t, u, fi):
        e = ease(u)
        z = L2(zoom, e)
        Re = 150.0 * z
        cx, cy = W * 0.42, H * 0.5
        cam = Camera((0.0, -9.0e4, 1.5e4), (0.0, 0.0, 0.0), fov=2 * np.degrees(np.arctan(M.R_E / 9.12e4 * (W / 2) / Re)), up=(0, 0, 1))
        img = cam.sky(gain=0.5) * 0.7
        draw_earth(img, cam, 14.0, lights=0.6)
        sz, of, el = L2(size, e), L2(off, e), L2(elong, e)
        L = Layer()
        ang = np.radians(-22)
        R2 = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]], np.float32)
        P = (pts * np.array([el, 1.0], np.float32) * sz * 0.5) @ R2.T + np.array([of, 0.0], np.float32)
        Px, Py = cx + P[:, 0] * Re, cy - P[:, 1] * Re
        on = np.hypot(P[:, 0], P[:, 1]) < 1.0
        buf = np.zeros((H, W, 3), np.float32)
        keep = (Px > -20) & (Px < W + 20) & (Py > -20) & (Py < H + 20)
        col = np.where(on[:, None], np.array(RED, np.float32), np.array(CYAN, np.float32)) * 6.0
        buf = splat_points(buf, Px[keep], Py[keep], col[keep].astype(np.float32), sigma=1.2)
        img += buf
        th = np.linspace(0, 2 * np.pi, 200)
        ell = np.stack([np.cos(th) * el * sz, np.sin(th) * sz], -1) @ R2.T + np.array([of, 0.0])
        L.polyline(np.stack([cx + ell[:, 0] * Re, cy - ell[:, 1] * Re], -1), CYAN, 0.8, th=2, closed=True)
        kh = L2(keyhole, e)
        if kh > 0:
            kx, ky = cx + 1.7 * Re, cy - 0.35 * Re
            L.rect(kx - 3, ky - 14, kx + 3, ky + 14, GOLD, kh, th=2, fill=True)
            L.circle((kx, ky), 34, GOLD, kh * 0.7, th=2)
            ctx.state["keyhole_xy"] = (kx, ky)
        dr = L2(drift, e)
        if dr > 0:
            L.arrow((cx + of * Re, cy - 2.2 * Re), (cx + of * Re + 160 * dr, cy - 2.2 * Re), GOLD, 0.9, th=3)
        img = L.composite(img, 0.5)
        o = L2(odds, e)
        if o > 0:                                     # the odds meter (a bar that fills)
            x0, y0, w_, h_ = W * 0.74, H * 0.28, 60, H * 0.44
            cv2.rectangle(img, (int(x0), int(y0)), (int(x0 + w_), int(y0 + h_)), (0.25, 0.27, 0.3), 2)
            fill = clamp(o)
            cv2.rectangle(img, (int(x0 + 4), int(y0 + h_ - 4 - (h_ - 8) * fill)), (int(x0 + w_ - 4), int(y0 + h_ - 4)), RED, -1)
            ctx.state["meter_top"] = (x0 + w_ / 2, y0 + h_ - (h_ - 8) * fill)
        ctx.state["earth_xy"] = (cx, cy)
        cards.mark("EARTH", cx, cy)
        return img, dict(exposure=1.25, bloom=0.4)
    return f


# ═══════════════════════════════════════════ radar ═══════════════════════════════════════════
@scene_factory(keys=[])
def radar(rot=(0.0, 60.0), scan=(0.0, 1.0), zoom=(1.0, 1.1)):
    """A delay-Doppler radar image built from our shape model: brightness by range (down) and Doppler (across),
    the way Goldstone and Arecibo pictured Apophis. Two lobes appear as the body turns."""
    from ep_apophis.scene_rock import shape, NLON, NLAT
    S = shape()
    lon = (np.arange(NLON) + 0.5) / NLON * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(NLAT) + 0.5) / NLAT * np.pi
    LO, LA = np.meshgrid(lon[::4], lat[::4])
    r = S[::4, ::4, 0]
    P = np.stack([np.cos(LA) * np.cos(LO), np.cos(LA) * np.sin(LO), np.sin(LA)], -1) * r[..., None]
    Nn = S[::4, ::4, 1:4]
    P, Nn = P.reshape(-1, 3), Nn.reshape(-1, 3)
    wt = np.cos(LA).reshape(-1)

    def f(ctx, t, u, fi):
        e = ease(u)
        a = np.radians(L2(rot, e))
        Rz = np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]])
        Q = P @ Rz.T
        Nq = Nn @ Rz.T
        los = np.array([0.0, -1.0, 0.0])
        mu = np.clip(-(Nq @ los), 0, 1)
        vis = mu > 0
        rng_ = Q[:, 1]
        dop = Q[:, 0]
        z = L2(zoom, e)
        sc = 2.6 * z
        x = W / 2 + dop * sc
        y = H * 0.5 + rng_ * sc
        img = np.zeros((H, W, 3), np.float32)
        val = (mu ** 1.5 * wt)[vis] * 2.2
        img = splat_points(img, x[vis], y[vis], np.repeat(val[:, None], 3, 1).astype(np.float32), sigma=3.0)
        img = img / (np.percentile(img[img > 1e-6], 99.5) + 1e-6) * 0.9 if (img > 1e-6).any() else img
        img *= np.array([0.85, 0.95, 1.0], np.float32)
        nz = np.random.default_rng(int(fi) % 50).normal(0, 0.01, (H // 3, W // 3)).astype(np.float32)
        img += np.abs(cv2.resize(nz, (W, H)))[..., None] * 0.7
        sc_ = L2(scan, e)
        yy = np.arange(H, dtype=np.float32)[:, None, None]
        img = img * (yy < H * (0.15 + 0.8 * sc_))
        xs_, ys_ = grid()
        img += ((np.abs((xs_ % 120) - 60) < 0.6) | (np.abs((ys_ % 120) - 60) < 0.6))[..., None] * 0.012
        return img, dict(exposure=1.3, bloom=0.3, grain=0.02)
    return f


# ═══════════════════════════════════════════ the tide ═══════════════════════════════════════════
@scene_factory(keys=[])
def tide(arrows=(0.0, 1.0), stretch=(0.0, 0.0), diff=(0.0, 0.0), ocean=0.0):
    """Earth on the left, the asteroid (magnified, schematic outline from our shape) on the right. Arrows: Earth's
    pull at the near end, the middle and the far end (longer = stronger, exaggerated). diff: what is left after
    the average pull is taken away: the tide, a stretch along the line to Earth."""
    from ep_apophis.scene_rock import shape, NLON, NLAT
    S = shape()
    prof = S[NLAT // 2, :, 0]
    ths = (np.arange(NLON) + 0.5) / NLON * 2 * np.pi - np.pi

    def f(ctx, t, u, fi):
        e = ease(u)
        cam = Camera((-1.0e5, -3.0e4, 0.0), (0.0, 0.0, 0.0), fov=16, up=(0, 0, 1))
        img = cam.sky(gain=0.35) * 0.6
        ex, ey, er = W * 0.17, H * 0.5, 180.0
        cam2 = Camera((0.0, -9.0e4, 0.0), (0.0, 0.0, 0.0), fov=2 * np.degrees(np.arctan(M.R_E / 9.0e4 * (W / 2) / er)), up=(0, 0, 1))
        tmp = np.zeros_like(img)
        draw_earth(tmp, cam2, 12.0)
        sh = int(ex - W / 2)
        tmp = np.roll(tmp, sh, axis=1)
        if sh < 0:
            tmp[:, sh:] = 0
        img = img + tmp
        cards.mark("EARTH", ex, ey)
        st = L2(stretch, e)
        ax, ay, sc = W * 0.66, H * 0.52, 1.25
        xs = ax + np.cos(ths) * prof * sc * (1 + 0.18 * st)
        ys = ay - np.sin(ths) * prof * sc * 0.62 * (1 - 0.08 * st)
        L = Layer()
        poly = np.stack([xs, ys], -1)
        mm = np.zeros((H, W), np.float32)
        cv2.fillPoly(mm, [np.round(poly * 16).astype(np.int32)], 1.0, cv2.LINE_AA, 4)
        img = img * (1 - mm[..., None] * 0.85) + mm[..., None] * np.array([0.10, 0.10, 0.10], np.float32)
        L.polyline(poly, (0.8, 0.8, 0.82), 0.9, th=2, closed=True)
        ar = L2(arrows, e)
        near_x, far_x = xs.min(), xs.max()
        pts = [(near_x + 8, 1.0, "near"), (ax, 0.0, "mid"), (far_x - 8, -1.0, "far")]
        dif = L2(diff, e)
        for (px, kk, nm) in pts:
            d = (px - ex) / 420.0
            strength = 1.0 / d ** 2
            ln = 560 * strength * ar
            if ar > 0:
                L.arrow((px, ay), (px - ln, ay), GOLD, 0.95 * (1 - 0.7 * dif), th=6, head=24, progress=1.0)
            if dif > 0 and nm != "mid":
                mid_ln = 560 * (1.0 / ((ax - ex) / 420.0) ** 2)
                dl = (ln / max(ar, 1e-3) - mid_ln) * 1.6 * dif
                y2 = ay - 70
                L.arrow((px, y2), (px - dl, y2), CYAN, dif, th=6, head=22)
        img = L.composite(img, 0.5)
        cards.mark("NEAR", near_x, ay)
        cards.mark("FAR", far_x, ay)
        ctx.state["near_x"], ctx.state["far_x"], ctx.state["ay"] = near_x, far_x, ay
        return img, dict(exposure=1.25, bloom=0.4)
    return f


# ═══════════════════════════════════════════ the orbit, before and after ═══════════════════════════════════════════
def _ellipse_pts(row, n=720):
    e, q, inc, om, w = row
    a = q / (1 - e)
    nu = np.linspace(0, 2 * np.pi, n)
    r = a * (1 - e * e) / (1 + e * np.cos(nu))
    x, y = r * np.cos(nu), r * np.sin(nu)
    O, I, Wd = np.radians(om), np.radians(inc), np.radians(w)
    cO, sO, cI, sI, cW, sW = np.cos(O), np.sin(O), np.cos(I), np.sin(I), np.cos(Wd), np.sin(Wd)
    X = (cO * cW - sO * sW * cI) * x + (-cO * sW - sO * cW * cI) * y
    Y = (sO * cW + cO * sW * cI) * x + (-sO * sW + cO * cW * cI) * y
    return np.stack([X, Y], -1)


@functools.lru_cache(None)
def _orbits():
    rows = []
    for x in M._csv("elements.csv"):
        rows.append((float(x[2]), float(x[3]) / 149597870.7, float(x[4]), float(x[5]), float(x[6])))
    return _ellipse_pts(rows[0]), _ellipse_pts(rows[1]), rows


@scene_factory(keys=[])
def orbit_map(before=(1.0, 1.0), after=(0.0, 0.0), day=(-60.0, 0.0), zoom=(1.0, 1.0), inside=0.0, cx=(0.0, 0.0)):
    """Top-down on the Solar System's plane. Sun at the centre, Earth's orbit (blue), Apophis's orbit before (grey)
    and after (gold), both from the Horizons elements; Earth and Apophis moving on their real positions at `day`
    (days from 13 April 2029). inside: shade the region inside Earth's orbit."""
    bef, aft, rows = _orbits()
    dd, ap, ea = M.helio()

    def f(ctx, t, u, fi):
        e = ease(u)
        z = L2(zoom, e)
        sc = 330.0 * z
        ox, oy = W * 0.5 + L2(cx, e), H * 0.5
        P = lambda xy: np.stack([ox + xy[..., 0] * sc, oy - xy[..., 1] * sc], -1)
        rng = np.random.default_rng(2)
        img, _ = make_starfield(W, H, 2500, seed=7, brightness=0.5)
        L = Layer()
        th = np.linspace(0, 2 * np.pi, 400)
        ein = L2(inside, e) if isinstance(inside, tuple) else inside
        if ein > 0:
            mm = np.zeros((H, W), np.float32)
            cv2.circle(mm, (int(ox), int(oy)), int(sc * 1.0), 1.0, -1, cv2.LINE_AA)
            img += mm[..., None] * np.array([0.02, 0.05, 0.10], np.float32) * ein
        L.polyline(P(np.stack([np.cos(th), np.sin(th)], -1)), (0.45, 0.7, 1.0), 0.75, th=2, closed=True)
        b_, a_ = L2(before, e), L2(after, e)
        if b_ > 0:
            L.polyline(P(bef), (0.72, 0.74, 0.78), 0.85 * b_, th=3, closed=True, progress=min(1.0, b_ * 1.0))
        if a_ > 0:
            L.polyline(P(aft), GOLD, 0.95, th=3, closed=True, progress=a_)
        img = L.composite(img, 0.5)
        glow_dot(img, ox, oy, (1.0, 0.85, 0.55), 10, 3.0)
        glow_dot(img, ox, oy, (1.0, 0.8, 0.5), 40, 0.25)
        cards.mark("SUN", ox, oy)
        dy = L2(day, e) if isinstance(day, tuple) else day
        dy = lerp(day[0], day[1], u)
        i = int(np.clip(np.searchsorted(dd, dy), 1, len(dd) - 1))
        k = (dy - dd[i - 1]) / (dd[i] - dd[i - 1])
        pa = ap[i - 1, :2] * (1 - k) + ap[i, :2] * k
        pe = ea[i - 1, :2] * (1 - k) + ea[i, :2] * k
        qa, qe = P(pa[None])[0], P(pe[None])[0]
        glow_dot(img, qe[0], qe[1], (0.5, 0.75, 1.0), 4, 2.2)
        glow_dot(img, qa[0], qa[1], (1.0, 0.85, 0.6), 3, 2.6)
        ctx.state["apophis_xy"], ctx.state["earth_xy"] = qa, qe
        # perihelion points (labels sit there, so 'before' is nearer the Sun than 'after')
        for nm, pts in (("peri_before", bef), ("peri_after", aft)):
            j = int(np.argmin(np.hypot(pts[:, 0], pts[:, 1])))
            ctx.state[nm] = P(pts[j][None])[0]
            j2 = int(np.argmax(np.hypot(pts[:, 0], pts[:, 1])))
            ctx.state[nm.replace("peri", "aph")] = P(pts[j2][None])[0]
        return img, dict(exposure=1.3, bloom=0.45)
    return f


def orbit_label(which, s, at=0.2, color=INK):
    """Label placed just outside the orbit's perihelion (the point nearest the Sun)."""
    def f(ctx, img, t, u):
        p = ctx.state.get("peri_" + which)
        a = fade(t, _at(ctx, at), ctx.dur, 0.3)
        if p is None or a <= 0 or os.environ.get("QA_NOTEXT"):
            return img
        ox, oy = W * 0.5, H * 0.5
        v = np.array([p[0] - ox, p[1] - oy]); v /= np.linalg.norm(v) + 1e-6
        x, y = p[0] + v[0] * 30, p[1] + v[1] * 30
        return text(img, s, x, y, size=30, color=color, alpha=a, anchor="lc" if v[0] >= 0 else "rc", kind="mono6", tracking=0.08)
    return f


# ═══════════════════════════════════════════ the road ═══════════════════════════════════════════
def _bike(lay, x, y, s, lean=0.0):
    """Side-on road bike with rider, as a silhouette (moving right). lean in radians."""
    def R(px, py):
        dx, dy = px - x, py - y
        return (int((x + dx * np.cos(lean) - dy * np.sin(lean)) * 16), int((y + dx * np.sin(lean) + dy * np.cos(lean)) * 16))
    wr = 0.34 * s
    rear, front = (x - 0.5 * s, y - wr), (x + 0.52 * s, y - wr)
    for c in (rear, front):
        cv2.circle(lay, R(*c), int(wr * 16), 1.0, max(2, int(0.035 * s)), cv2.LINE_AA, 4)
    bb = (x - 0.05 * s, y - wr)
    seat = (x - 0.2 * s, y - 0.95 * s)
    head = (x + 0.42 * s, y - 0.98 * s)
    th = max(2, int(0.03 * s))
    for a_, b_ in ((rear, bb), (bb, seat), (seat, rear), (bb, head), (head, front), (seat, head)):
        cv2.line(lay, R(*a_), R(*b_), 1.0, th, cv2.LINE_AA, 4)
    # rider: hips on the seat, back leaning forward, arms to the bars, head
    hip = (seat[0], seat[1] - 0.06 * s)
    sh = (x + 0.18 * s, y - 1.42 * s)
    cv2.line(lay, R(*hip), R(*sh), 1.0, int(0.2 * s), cv2.LINE_AA, 4)
    cv2.line(lay, R(*sh), R(head[0] + 0.02 * s, head[1] - 0.05 * s), 1.0, int(0.09 * s), cv2.LINE_AA, 4)
    cv2.circle(lay, R(sh[0] + 0.1 * s, sh[1] - 0.16 * s), int(0.13 * s * 16), 1.0, -1, cv2.LINE_AA, 4)
    knee = (x + 0.05 * s, y - 0.72 * s)
    cv2.line(lay, R(*hip), R(*knee), 1.0, int(0.14 * s), cv2.LINE_AA, 4)
    cv2.line(lay, R(*knee), R(bb[0] + 0.05 * s, bb[1] + 0.02 * s), 1.0, int(0.1 * s), cv2.LINE_AA, 4)


def _truck(lay, x, y, s):
    """Side-on lorry silhouette (moving right): trailer box, cab, wheels."""
    cv2.rectangle(lay, (int(x - 6.2 * s), int(y - 2.6 * s)), (int(x + 0.4 * s), int(y - 0.55 * s)), 1.0, -1)
    cab = np.array([[x + 0.55 * s, y - 0.55 * s], [x + 0.55 * s, y - 2.3 * s], [x + 1.45 * s, y - 2.3 * s], [x + 1.95 * s, y - 1.3 * s], [x + 1.95 * s, y - 0.55 * s]], np.int32)
    cv2.fillPoly(lay, [cab], 1.0, cv2.LINE_AA)
    for wx in (x - 5.4 * s, x - 4.5 * s, x - 1.0 * s, x + 1.3 * s):
        cv2.circle(lay, (int(wx), int(y - 0.42 * s)), int(0.42 * s), 1.0, -1, cv2.LINE_AA)


@scene_factory(keys=[])
def road(truck=(-0.3, 1.4), wobble=(0.0, 0.0), dust=(0.0, 0.0), cam=(0.0, 0.0), zoom=(1.0, 1.0)):
    """A country road at dusk, side-on. The cyclist rides slowly right; the truck (truck: its x as a fraction of the
    frame) overtakes, very close; afterwards the bike wobbles (wobble) and dust and leaves swirl in the truck's wake."""
    rng = np.random.default_rng(61)
    leaves = rng.uniform(0, 1, (60, 3))

    def f(ctx, t, u, fi):
        e = ease(u)
        z = L2(zoom, e)
        xs, ys = grid()
        hy = H * 0.63
        tt = clamp((hy - ys) / hy)
        sky = np.array([1.0, 0.62, 0.30], np.float32) * (1 - tt[..., None]) ** 2 * 1.4 + np.array([0.20, 0.25, 0.45], np.float32) * tt[..., None] * 0.55
        img = sky.astype(np.float32)
        glow_dot(img, W * 0.78, hy - 40, (1.0, 0.75, 0.4), 30, 3.0)
        lay = np.zeros((H, W), np.float32)
        xr = np.arange(W, dtype=np.float32)
        hills = hy - 30 - 25 * np.sin(xr / 310 + 1) - 18 * np.sin(xr / 120)
        for x in range(0, W):
            lay[int(hills[x]):, x] = 0.55
        img = img * (1 - lay[..., None]) + lay[..., None] * np.array([0.10, 0.07, 0.07], np.float32)
        ground = ys > hy + 8
        img[ground] = np.array([0.035, 0.03, 0.03], np.float32)
        rd0, rd1 = int(hy + 60), int(hy + 150)
        img[rd0:rd1] = np.array([0.06, 0.055, 0.055], np.float32)
        gt = ctx.seg["start"] + ctx.beat.t0 + t
        for k in range(0, W + 200, 160):                        # lane dashes streaming (the camera tracks the bike)
            x = (k - (gt * 120) % 160)
            cv2.rectangle(img, (int(x), rd0 + 40), (int(x + 70), rd0 + 46), (0.5, 0.45, 0.35), -1)
        s = 190 * z
        bx, by = W * 0.42 + L2(cam, e), rd0 + 34
        wb = L2(wobble, e)
        lean = 0.10 * wb * np.sin(gt * 7.5) * np.exp(-0.0 * wb)
        sil = np.zeros((H, W), np.float32)
        _bike(sil, bx + 18 * wb * np.sin(gt * 5.0), by, s, lean)
        trx = lerp(truck[0], truck[1], u) * W
        tl = np.zeros((H, W), np.float32)
        _truck(tl, trx, rd1 - 6, 120 * z)
        # truck motion blur
        tl = cv2.blur(tl, (25, 1))
        img = img * (1 - tl[..., None]) + tl[..., None] * np.array([0.11, 0.105, 0.12], np.float32)
        stripe = tl * (np.abs(ys - (rd1 - 6 - 1.1 * 120 * z)) < 5)
        img += stripe[..., None] * np.array([0.5, 0.25, 0.1], np.float32)
        for hx in (trx + 1.9 * 120 * z,):
            glow_dot(img, hx, rd1 - 70, (1.0, 0.9, 0.7), 8, 2.0 * (0 < hx < W))
        img = img * (1 - sil[..., None]) + sil[..., None] * np.array([0.004, 0.004, 0.005], np.float32)
        rim = clamp(sil - cv2.erode(sil, np.ones((5, 5), np.uint8)))
        img += rim[..., None] * np.array([1.0, 0.6, 0.3], np.float32) * 0.6
        ds = L2(dust, e)
        if ds > 0:
            for (lx, ly, lp) in leaves:
                ph = (gt * 0.8 + lp) % 1.0
                px = trx - 200 - lx * 700 + 200 * ph
                py = rd0 - 20 - ly * 160 - 80 * np.sin(ph * 6 + lp * 9)
                glow_dot(img, px, py, (0.45, 0.30, 0.18), 3.0, 0.25 * ds) if py < rd0 - 60 or px < trx - 6.4 * 120 * z else None
            glow_dot(img, trx - 500, rd0 + 10, (0.5, 0.4, 0.3), 160, 0.06 * ds)
        ctx.state["bike_xy"] = (bx, by - s)
        ctx.state["truck_xy"] = (trx - 2 * 120 * z, rd1 - 200 * z)
        return img, dict(exposure=1.2, bloom=0.5, grade=((0.01, 0.006, 0.004), (1.0, 0.96, 0.9)))
    return f


def balance(at=0.2, x=W * 0.5, y=H * 0.62, s=1.0):
    """A balance scale: a standing person on one pan, a single paper clip on the other, and the beam level."""
    def f(ctx, img, t, u):
        a = fade(t, _at(ctx, at), ctx.dur, 0.35)
        if a <= 0:
            return img
        L = Layer()
        sw = 0.0
        tilt = 0.12 * np.exp(-max(0.0, t - _at(ctx, at)) * 1.3) * np.cos((t - _at(ctx, at)) * 5)
        bl, br = (x - 330 * s, y - 330 * s * np.sin(tilt)), (x + 330 * s, y + 330 * s * np.sin(tilt))
        L.line((x, y + 260 * s), (x, y), color=INK, alpha=a, th=5)
        L.line((x - 120 * s, y + 260 * s), (x + 120 * s, y + 260 * s), color=INK, alpha=a, th=5)
        L.line(bl, br, color=INK, alpha=a, th=6)
        for (px, py) in (bl, br):
            L.line((px, py), (px - 90 * s, py + 150 * s), color=DIM, alpha=a, th=2)
            L.line((px, py), (px + 90 * s, py + 150 * s), color=DIM, alpha=a, th=2)
            L.line((px - 110 * s, py + 150 * s), (px + 110 * s, py + 150 * s), color=INK, alpha=a, th=5)
        # a person standing on the left pan
        px, py = bl[0], bl[1] + 146 * s
        L.circle((px, py - 175 * s), 16 * s, INK, a, fill=True)
        L.line((px, py - 155 * s), (px, py - 75 * s), color=INK, alpha=a, th=int(14 * s))
        L.line((px, py - 75 * s), (px - 14 * s, py), color=INK, alpha=a, th=int(9 * s))
        L.line((px, py - 75 * s), (px + 14 * s, py), color=INK, alpha=a, th=int(9 * s))
        L.line((px, py - 140 * s), (px - 26 * s, py - 90 * s), color=INK, alpha=a, th=int(7 * s))
        L.line((px, py - 140 * s), (px + 26 * s, py - 90 * s), color=INK, alpha=a, th=int(7 * s))
        # a paper clip on the right pan
        cx, cy = br[0], br[1] + 140 * s
        clip = []
        for (rx, x0, x1) in ((9, -26, 22), (6, -20, 16), (3.5, -14, 18)):
            th = np.linspace(np.pi / 2, 3 * np.pi / 2, 20)
            clip += [(cx + x0 * s + rx * s * np.cos(q), cy + rx * s * np.sin(q)) for q in th]
            clip += [(cx + x1 * s, cy + rx * s)]
        L.polyline(np.array(clip), GOLD, a, th=3)
        return L.composite(img, 0.5)
    return f


def serpent(at=0.2, x=W * 0.78, y=H * 0.3, s=1.0):
    """Apep, the serpent of chaos, drawn as a golden hieroglyph-like snake that writes itself on."""
    def f(ctx, img, t, u):
        a = fade(t, _at(ctx, at), ctx.dur, 0.35)
        if a <= 0:
            return img
        L = Layer()
        xs = np.linspace(-200, 200, 160) * s
        ys = 34 * s * np.sin(xs / (55 * s)) * np.linspace(0.6, 1.0, 160)
        pts = np.stack([x + xs, y + ys], -1)
        L.polyline(pts, GOLD, a, th=int(12 * s), progress=prog(t, _at(ctx, at), 1.2))
        hx, hy = pts[-1]
        if prog(t, _at(ctx, at), 1.2) > 0.98:
            L.circle((hx + 10 * s, hy), 16 * s, GOLD, a, fill=True)
            L.line((hx + 24 * s, hy), (hx + 40 * s, hy - 6 * s), color=RED, alpha=a, th=3)
            L.line((hx + 24 * s, hy), (hx + 40 * s, hy + 6 * s), color=RED, alpha=a, th=3)
        return L.composite(img, 0.5)
    return f
