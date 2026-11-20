"""Episode 5 scenes, part 2: the asteroid itself.

  rock          Apophis whole: two lobes joined at a waist (~465 m end to end, 340 m mean diameter), grey rubble and
                boulders, tumbling; lit by the real Sun direction with Earthlight fill. Options: the Eiffel Tower to
                scale beside it, a dimension line, a landslide plume, Earth in the background, a probe flying alongside.
  surface       standing on it: a curved horizon a few dozen steps away, boulders, gravel, a black sky, and Earth at
                its real size, phase and city lights for hour h (the camera sits at Apophis's Horizons position).
                Options: a pebble dropped from shoulder height (falls at the real 1.2e-4 m/s^2), a jump that never comes
                down, a landslide on a slope.
Units: metres in the asteroid frame."""
import functools
import numpy as np, cv2
from engine.beats import scene_factory
from engine.core import W, H, clamp, smooth, span, lerp, grid, fbm, blur, fast_blur, glow_dot, cached
from engine.cam3d import Camera, look_at
from ep_apophis import model as M
from ep_apophis.scene_sky import draw_earth, apophis_world, sun_world, ease, L2, _rays, earth_screen

LOBES = ((-100.0, 0.0, 0.0, 140.0, 128.0, 118.0), (118.0, 6.0, -4.0, 112.0, 104.0, 98.0))   # centre xyz, radii
RB = 290.0
NLON, NLAT = 1024, 512
ROCK_ALB = np.array([0.20, 0.195, 0.185], np.float32)


def _sdf(p):
    ds = []
    for cx, cy, cz, a, b, c in LOBES:
        q = (p - np.array([cx, cy, cz], np.float32)) / np.array([a, b, c], np.float32)
        k = np.linalg.norm(q, axis=-1)
        ds.append((k - 1.0) * min(a, b, c))
    d1, d2 = ds
    k = 45.0                                          # smooth union: the waist
    hh = clamp(0.5 + 0.5 * (d2 - d1) / k)
    return d2 * (1 - hh) + d1 * hh - k * hh * (1 - hh)


def _waves3(d, n, fmin, fmax, seed):
    rng = np.random.default_rng(seed)
    out = np.zeros(d.shape[:-1], np.float32)
    amp = 0.0
    for k in range(n):
        f = fmin * (fmax / fmin) ** (k / max(1, n - 1))
        v = rng.normal(size=3); v /= np.linalg.norm(v)
        a = 1.0 / f ** 0.75
        out += a * np.sin(f * (d @ v.astype(np.float32)) + rng.uniform(0, 2 * np.pi)).astype(np.float32)
        amp += a
    return out / amp


def _build_shape():
    lon = (np.arange(NLON, dtype=np.float32) + 0.5) / NLON * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(NLAT, dtype=np.float32) + 0.5) / NLAT * np.pi
    LO, LA = np.meshgrid(lon, lat)
    d = np.stack([np.cos(LA) * np.cos(LO), np.cos(LA) * np.sin(LO), np.sin(LA)], -1).astype(np.float32)
    lo_r, hi_r = np.zeros(LO.shape, np.float32), np.full(LO.shape, RB, np.float32)
    for _ in range(30):                               # bisection along each direction for the SDF surface
        mid = (lo_r + hi_r) / 2
        ins = _sdf(d * mid[..., None]) < 0
        lo_r = np.where(ins, mid, lo_r)
        hi_r = np.where(ins, hi_r, mid)
    r = (lo_r + hi_r) / 2
    # relief: broad undulations, shallow craters, boulders
    r = r + 7.0 * _waves3(d, 24, 3.0, 40.0, 11)
    rng = np.random.default_rng(12)
    crat = np.zeros_like(r)
    for _ in range(14):                                         # a few shallow, degraded craters
        c = rng.normal(size=3); c /= np.linalg.norm(c)
        rad = rng.uniform(0.08, 0.25)
        ang = np.arccos(np.clip(d @ c.astype(np.float32), -1, 1)) / rad
        crat += np.where(ang < 1, -(1 - ang ** 2) * 5.0 * rad / 0.15, 0) + np.exp(-((ang - 1.0) / 0.15) ** 2) * 1.2 * rad / 0.15
    r = r + crat
    bould = np.zeros_like(r)
    for _ in range(2200):                                       # boulders, 1.5 to 14 m, many small, few big
        c = rng.normal(size=3); c /= np.linalg.norm(c)
        size = min(14.0, rng.pareto(2.4) * 2.0 + 1.5)
        ang = np.arccos(np.clip(d @ c.astype(np.float32), -1, 1)) * 150 / size
        bould = np.maximum(bould, np.where(ang < 1, np.sqrt(np.maximum(0, 1 - ang ** 2)) * size * 0.5, 0))
    r = r + bould
    P = d * r[..., None]
    # normals from neighbouring surface points
    Pe = np.roll(P, -1, 1); Pw = np.roll(P, 1, 1)
    Pn = np.concatenate([P[:1], P[:-1]], 0); Ps = np.concatenate([P[1:], P[-1:]], 0)
    nrm = np.cross(Pe - Pw, Pn - Ps)
    nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True) + 1e-9
    nrm = np.where((nrm * d).sum(-1, keepdims=True) < 0, -nrm, nrm)
    cav = r - cv2.GaussianBlur(r, (0, 0), 6)
    alb = 1.0 + 0.18 * _waves3(d, 16, 8.0, 120.0, 13) + 0.25 * clamp(bould / 6) - 0.1
    ao = clamp(0.75 + cav * 0.05)
    return np.concatenate([r[..., None], nrm, alb[..., None], ao[..., None]], -1).astype(np.float32)


@functools.lru_cache(None)
def shape():
    return cached("ep5_apophis_shape_v2", _build_shape)


def _lookup(dirs, ch):
    S = shape()
    lon = np.arctan2(dirs[..., 1], dirs[..., 0])
    lat = np.arcsin(np.clip(dirs[..., 2], -1, 1))
    mu = ((lon + np.pi) / (2 * np.pi) * NLON - 0.5).astype(np.float32)
    mv = np.clip((np.pi / 2 - lat) / np.pi * NLAT - 0.5, 0, NLAT - 1).astype(np.float32)
    return cv2.remap(np.ascontiguousarray(S[..., ch]), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def tumble(t_s, base=(0.3, -0.4, 0.2), rate=1.0):
    """Body -> world rotation. A slow non-principal-axis tumble (spin + precession), sped up `rate` times."""
    a = np.radians(base[0] * 180) + 2 * np.pi * t_s * rate / (M.PREC_H * 3600)
    b = np.radians(base[1] * 180) + 2 * np.pi * t_s * rate / (M.SPIN_H * 3600)
    Rz = lambda x: np.array([[np.cos(x), -np.sin(x), 0], [np.sin(x), np.cos(x), 0], [0, 0, 1]])
    Rx = lambda x: np.array([[1, 0, 0], [0, np.cos(x), -np.sin(x)], [0, np.sin(x), np.cos(x)]])
    return Rz(a) @ Rx(np.radians(28 + base[2] * 40)) @ Rz(b)


def render_rock(img, cam, Rb, sun, earth_dir=None, earth_k=0.0, exposure=1.0, steps=44, slide=None):
    """Ray-march the shape (body rotation Rb, centred at the world origin) into img. Returns depth alpha."""
    x, y, z = cam.project(np.zeros(3))
    alpha = np.zeros((H, W), np.float32)
    if z <= 0:
        return alpha
    dist = np.linalg.norm(cam.pos)
    rp = cam.f * np.tan(np.arcsin(min(0.999, RB / dist))) + 4
    x0, x1 = int(max(0, x - rp)), int(min(W, x + rp))
    y0, y1 = int(max(0, y - rp)), int(min(H, y + rp))
    if x1 <= x0 or y1 <= y0:
        return alpha
    d = _rays(cam, x0, y0, x1, y1).astype(np.float32)
    Rt = Rb.T.astype(np.float32)
    o = (Rt @ cam.pos).astype(np.float32)
    db = d @ Rt.T
    b = db @ o
    c = float(o @ o) - RB ** 2
    disc = b * b - c
    ok = disc > 0
    tn = np.where(ok, -b - np.sqrt(np.maximum(disc, 0)), 0)
    tf = np.where(ok, -b + np.sqrt(np.maximum(disc, 0)), 0)
    hit = np.zeros(d.shape[:2], bool)
    t_in = np.full(d.shape[:2], np.inf, np.float32)
    t_prev = tn.copy()
    for k in range(1, steps + 1):
        tk = tn + (tf - tn) * k / steps
        p = o + db * tk[..., None]
        rr = np.linalg.norm(p, axis=-1)
        ins = ok & ~hit & (rr < _lookup(p / (rr[..., None] + 1e-6), 0))
        t_in = np.where(ins, tk, t_in)
        hit |= ins
    lo = t_in - (tf - tn) / steps
    hi = t_in
    for _ in range(6):
        mid = (lo + hi) / 2
        p = o + db * np.where(hit, mid, 0)[..., None]
        rr = np.linalg.norm(p, axis=-1)
        ins = rr < _lookup(p / (rr[..., None] + 1e-6), 0)
        hi = np.where(ins, mid, hi)
        lo = np.where(ins, lo, mid)
    p = o + db * np.where(hit, hi, 0)[..., None]
    rr = np.linalg.norm(p, axis=-1)
    dirs = p / (rr[..., None] + 1e-6)
    n = np.stack([_lookup(dirs, k) for k in (1, 2, 3)], -1)
    alb = _lookup(dirs, 4)
    ao = _lookup(dirs, 5)
    bump = np.zeros_like(n)
    for k, (v_, fq) in enumerate(((np.array([0.6, 0.3, 0.75]), 0.35), (np.array([-0.4, 0.85, 0.3]), 0.6), (np.array([0.2, -0.5, 0.85]), 1.1), (np.array([0.9, 0.1, -0.4]), 1.9))):
        ph = p @ v_.astype(np.float32) * fq
        bump += np.cos(ph * 2.3)[..., None] * np.cross(v_, [0.31, 0.52, 0.79]).astype(np.float32) * (0.08 / (k + 1))
    n = n + bump * hit[..., None]
    n = n / (np.linalg.norm(n, axis=-1, keepdims=True) + 1e-6)
    alb = alb * (0.85 + 0.3 * (0.5 + 0.5 * np.sin(p @ np.array([1.3, 0.7, 1.1], np.float32)) * np.sin(p @ np.array([-0.9, 1.6, 0.4], np.float32))))
    sb = (Rt @ np.asarray(sun, np.float64)).astype(np.float32)
    mu0 = np.maximum(n @ sb, 0)
    mu = np.maximum(-(n * db).sum(-1), 1e-3)
    shade = 0.55 * 2 * mu0 / (mu0 + mu + 1e-4) + 0.45 * mu0            # lunar-Lambert
    # cast shadows: march toward the Sun
    sh = np.ones_like(mu0)
    q = p + n * 1.5
    for k in range(1, 16):
        qq = q + sb * (k ** 1.6 * 3.4)
        r2 = np.linalg.norm(qq, axis=-1)
        sh = np.where(hit & (r2 < _lookup(qq / (r2[..., None] + 1e-6), 0)), 0.0, sh)
    sh = cv2.GaussianBlur(sh, (0, 0), 0.8)
    col = ROCK_ALB * alb[..., None] * (shade * sh)[..., None] * 1.9 * ao[..., None]
    if earth_dir is not None and earth_k > 0:
        eb = (Rt @ np.asarray(earth_dir, np.float64)).astype(np.float32)
        col += ROCK_ALB * alb[..., None] * np.maximum(n @ eb, 0)[..., None] * np.array([0.45, 0.65, 1.0], np.float32) * 0.35 * earth_k
    col += ROCK_ALB * 0.012
    if slide is not None:                              # a landslide: fresh, brighter rock and a dust plume
        sdir, sk = slide
        sdir = np.asarray(sdir, np.float32) / np.linalg.norm(sdir)
        near = clamp((dirs @ sdir - 0.985) / 0.01) * sk
        col *= (1 + 0.6 * near)[..., None]
    col *= exposure
    reg = img[y0:y1, x0:x1]
    a = cv2.GaussianBlur(hit.astype(np.float32), (0, 0), 0.6)
    reg[:] = reg * (1 - a[..., None]) + np.where(hit[..., None], col, 0) * a[..., None]
    alpha[y0:y1, x0:x1] = a
    return alpha


def eiffel(img, cam, base, up, right, alpha=1.0, light=(0.6, 0.4)):
    """The Eiffel Tower (330 m), drawn to scale in the same camera as the rock: a lattice silhouette."""
    H_ = 330.0
    prof = [(0.0, 62.0), (57.0, 37.0), (115.0, 20.0), (190.0, 9.0), (276.0, 4.0), (300.0, 2.5), (330.0, 0.5)]
    lay = np.zeros((H, W), np.float32)
    base, up, right = map(lambda v: np.asarray(v, np.float64), (base, up, right))
    for sgn in (-1, 1):
        pts = [base + up * hh + right * w * sgn for hh, w in prof]
        P = np.array([cam.project(p)[:2] for p in pts])
        cv2.polylines(lay, [np.round(P * 16).astype(np.int32)], False, 1.0, 3, cv2.LINE_AA, 4)
    for hh in (57.0, 115.0, 276.0):
        w = dict(prof)[hh]
        a_ = cam.project(base + up * hh - right * w)[:2]
        b_ = cam.project(base + up * hh + right * w)[:2]
        cv2.line(lay, (int(a_[0] * 16), int(a_[1] * 16)), (int(b_[0] * 16), int(b_[1] * 16)), 1.0, 4, cv2.LINE_AA, 4)
    # the arch between the legs and cross-bracing
    arc = [base + up * (36 * np.sin(np.pi * s)) + right * (lerp(-48, 48, s)) for s in np.linspace(0, 1, 30)]
    P = np.array([cam.project(p)[:2] for p in arc])
    cv2.polylines(lay, [np.round(P * 16).astype(np.int32)], False, 1.0, 2, cv2.LINE_AA, 4)
    for (h0, h1) in ((0.0, 57.0), (57.0, 115.0), (115.0, 190.0), (190.0, 276.0)):
        w0, w1 = dict(prof)[h0], dict(prof)[h1]
        for sgn in (-1, 1):
            a_ = cam.project(base + up * h0 + right * w0 * sgn)[:2]
            b_ = cam.project(base + up * h1 - right * w1 * sgn)[:2]
            cv2.line(lay, (int(a_[0] * 16), int(a_[1] * 16)), (int(b_[0] * 16), int(b_[1] * 16)), 0.7, 2, cv2.LINE_AA, 4)
    lay = clamp(lay)
    img += lay[..., None] * np.array([0.95, 0.72, 0.42], np.float32) * 0.9 * alpha
    return img


def probe(img, cam, pos, sun, s=6.0, alpha=1.0):
    """A small spacecraft (box bus, two solar wings, a dish), lit by the Sun. pos/s in world metres."""
    pos = np.asarray(pos, np.float64)
    sunv = np.asarray(sun, np.float64)
    rgt = np.cross(sunv, [0, 0, 1.0]); rgt /= np.linalg.norm(rgt) + 1e-9
    upv = np.cross(rgt, sunv)
    lay = np.zeros((H, W, 3), np.float32)
    msk = np.zeros((H, W), np.float32)
    def quad(c, a, b, col, k=1.0):
        P = np.array([cam.project(c + sa * a + sb * b)[:2] for sa, sb in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
        if not np.all(np.isfinite(P)):
            return
        m = np.zeros((H, W), np.float32)
        cv2.fillConvexPoly(m, np.round(P * 16).astype(np.int32), 1.0, cv2.LINE_AA, 4)
        lay[:] = lay * (1 - m[..., None]) + np.asarray(col, np.float32) * k * m[..., None]
        msk[:] = np.maximum(msk, m)
    for sgn in (-1, 1):                                   # solar wings (dark blue cells, glinting)
        quad(pos + rgt * sgn * 2.4 * s, rgt * 1.6 * s, upv * 0.55 * s, (0.05, 0.08, 0.22), 1.0)
        for kk in range(4):
            quad(pos + rgt * sgn * (1.0 + kk * 0.8) * s, rgt * 0.02 * s, upv * 0.55 * s, (0.3, 0.32, 0.35), 1.0)
    quad(pos, rgt * 0.6 * s, upv * 0.6 * s, (0.75, 0.62, 0.3), 1.6)         # gold-foil bus
    quad(pos + upv * 0.75 * s, rgt * 0.35 * s, upv * 0.12 * s, (0.85, 0.85, 0.85), 1.2)   # dish
    x, y, z = cam.project(pos)
    img[:] = img * (1 - msk[..., None] * alpha) + lay * alpha
    return img


@scene_factory(keys=[])
def rock(dist=(1500.0, 1300.0), az=(20.0, 30.0), el=(15.0, 18.0), fov=(40.0, 40.0), tumble_s=(0.0, 6000.0), rate=1.0,
         h=(21.0, 21.0), earth=0.0, eiffel_k=0.0, dims=0.0, slide=(0.0, 0.0), probe_k=0.0, probe_pos=(0.0, 0.0), look=(0.0, 0.0, 0.0),
         sun_k=1.0, frame_earth=0.0):
    """Apophis whole, tumbling (tumble_s: seconds of real tumble, sped up `rate` times). The camera orbits in the
    asteroid-centred frame whose axes are ICRF, so the Sun and Earth sit in their true directions for hour h."""
    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)
        sun = sun_world()
        Ap = apophis_world(hh)
        edir = -Ap / np.linalg.norm(Ap)
        # az/el are measured from the Sun's direction (az 0 = camera beside the Sun, lit face on; 90 = side-lit), or,
        # with frame_earth, from the direction straight away from Earth (so Earth hangs behind the rock)
        ref = -edir if frame_earth > 0 else sun
        raz, rel = np.degrees(np.arctan2(ref[1], ref[0])), np.degrees(np.arcsin(np.clip(ref[2], -1, 1)))
        A, E = np.radians(raz + L2(az, e)), np.radians(np.clip(rel + L2(el, e), -85, 85))
        D = L2(dist, e)
        pos = np.asarray(look, np.float64) + D * np.array([np.cos(E) * np.cos(A), np.cos(E) * np.sin(A), np.sin(E)])
        cam = Camera(pos, look, fov=L2(fov, e), up=(0.0, 0.0, 1.0))
        img = cam.sky(gain=0.8)
        if earth > 0:                                   # Earth far behind, at its true size and phase for hour h
            ce = Camera(Ap + pos / 1000.0, Ap + (np.asarray(look) - pos) / 1000.0 * 0 + (np.asarray(look) / 1000.0) + 0 * pos, fov=L2(fov, e), up=(0.0, 0.0, 1.0))
            ce = Camera(Ap + pos / 1000.0, Ap + np.asarray(look) / 1000.0, fov=L2(fov, e), up=(0.0, 0.0, 1.0))
            draw_earth(img, ce, hh, exposure=earth)
        Rb = tumble(lerp(tumble_s[0], tumble_s[1], u), rate=rate)
        sl = L2(slide, e)
        sdir = Rb @ np.array([0.2, 0.7, 0.68])
        render_rock(img, cam, Rb, sun * sun_k + (1 - sun_k) * np.array([0, 0, 1e-6]), earth_dir=edir, earth_k=0.6 + 0.6 * earth,
                    slide=(np.array([0.2, 0.7, 0.68]), sl) if sl > 0 else None)
        if sl > 0:                                      # the dust plume where the slope gives way
            sp = Rb @ (np.array([0.2, 0.7, 0.68]) / np.linalg.norm([0.2, 0.7, 0.68]) * 150.0)
            x, y, z = cam.project(sp)
            if z > 0:
                for k in range(40):
                    rng = np.random.default_rng(k)
                    off = rng.normal(size=3) * 25 * sl + np.cross(sdir, [0, 0, 1]) * rng.uniform(-30, 30) * sl
                    px, py, pz = cam.project(sp + off + sdir * rng.uniform(0, 40) * sl)
                    glow_dot(img, px, py, (0.55, 0.52, 0.48), 6 + 10 * sl, 0.12 * sl)
        if eiffel_k > 0:
            fwd = (np.asarray(look) - pos) / D
            rgt = np.cross(fwd, [0, 0, 1.0]); rgt /= np.linalg.norm(rgt)
            upv = np.cross(rgt, fwd)
            eiffel(img, cam, np.asarray(look) + rgt * 330 - upv * 165, upv, rgt, eiffel_k)
            ctx.state["eiffel_xy"] = cam.project(np.asarray(look) + rgt * 330 + upv * 175)[:2]
        if probe_k > 0:
            pp = np.asarray(look) + np.array([0.0, -1.0, 0.25]) * lerp(probe_pos[0], probe_pos[1], e) + np.array([-260.0, 0, 0])
            probe(img, cam, pp, sun, s=8.0, alpha=probe_k)
        x, y, z = cam.project(np.asarray(look, np.float64))
        ctx.state["rock_xy"] = (x, y)
        ctx.state["rock_px"] = cam.f * 232.0 / D
        ctx.state["cam"] = cam
        ctx.state["Rb"] = Rb
        return img, dict(exposure=1.35, bloom=0.4, grade=((0.008, 0.008, 0.01), (1.0, 0.99, 0.97)))
    return f


# ═══════════════════════════════════════════ standing on Apophis ═══════════════════════════════════════════
RL = 140.0                 # local radius of the lobe under our feet (m)
EYE = 1.0
DIP = float(np.degrees(np.arccos(RL / (RL + EYE))))   # the horizon dips this far below eye level


@functools.lru_cache(None)
def _boulders(seed=4, n=170):
    """Boulders on the local sphere: (unit position, radius m). Denser and bigger toward a ridge on the left."""
    rng = np.random.default_rng(seed)
    out = []
    for i in range(n):
        dist = 3.0 + 72.0 * rng.random() ** 1.6
        ang = rng.uniform(-np.pi, np.pi)
        rad = min(6.0, (rng.pareto(2.3) + 1) * 0.22 * (1 + dist / 30))
        # local tangent coords: x right, z forward (camera initially looks along +z)
        th = dist / RL
        p = np.array([np.sin(th) * np.sin(ang), np.cos(th), np.sin(th) * np.cos(ang)])
        out.append((p, rad, rng.uniform(0, 1000)))
    for (dx, dz, r) in ((-3.2, 6.0, 0.8), (2.8, 9.0, 1.1), (-7.0, 14.0, 1.9), (6.0, 26.0, 2.4), (-16.0, 34.0, 4.6), (2.0, 4.5, 0.35)):
        th = np.hypot(dx, dz) / RL
        ang = np.arctan2(dx, dz)
        out.append((np.array([np.sin(th) * np.sin(ang), np.cos(th), np.sin(th) * np.cos(ang)]), r, dx * 7 + dz))
    return out


@functools.lru_cache(None)
def _regolith_tex():
    a = fbm(2048, 2048, scale=6, octaves=5, seed=71)
    b = fbm(2048, 2048, scale=40, octaves=4, seed=72)
    peb = np.zeros((2048, 2048), np.float32)
    rng = np.random.default_rng(73)
    for _ in range(26000):
        x, y = rng.integers(0, 2048, 2)
        r = int(rng.pareto(2.5) * 1.5 + 1)
        cv2.circle(peb, (int(x), int(y)), r, float(rng.uniform(0.4, 1.0)), -1, cv2.LINE_AA)
    return (0.6 * a + 0.4 * b).astype(np.float32), cv2.GaussianBlur(peb, (0, 0), 0.7)


def _frame_for(earth_az, earth_alt, roll, h):
    """Rotation local -> world that puts Earth at (earth_az, earth_alt) in our local sky. Local axes: x right, y up,
    z forward (azimuth 0 = straight ahead)."""
    Ap = apophis_world(h)
    eW = -Ap / np.linalg.norm(Ap)
    a, b = np.radians(earth_az), np.radians(earth_alt)
    eL = np.array([np.cos(b) * np.sin(a), np.sin(b), np.cos(b) * np.cos(a)])
    # build orthonormal bases around each vector, with a free roll about it
    def basis(v, ref):
        x = np.cross(ref, v); x /= np.linalg.norm(x) + 1e-12
        y = np.cross(v, x)
        return np.stack([v, x, y], 1)
    BL = basis(eL, np.array([0.0, 1.0, 0.0]) if abs(eL[1]) < 0.95 else np.array([1.0, 0, 0]))
    BW = basis(eW, np.array([0.0, 0.0, 1.0]))
    cr, sr = np.cos(np.radians(roll)), np.sin(np.radians(roll))
    Rroll = np.array([[1, 0, 0], [0, cr, -sr], [0, sr, cr]])
    return BW @ Rroll @ BL.T, Ap


@functools.lru_cache(4096)
def _roll_for_q(eaz, ealt, hq, salt, side):
    best, bv = 0.0, 1e9
    for r in np.arange(0.0, 360.0, 1.0):
        Q, _ = _frame_for(eaz, ealt, r, hq)
        sL = Q.T @ sun_world()
        alt = np.degrees(np.arcsin(np.clip(sL[1], -1, 1)))
        az = np.degrees(np.arctan2(sL[0], sL[2]))
        v = abs(alt - salt) + (0 if np.sign(az - eaz) == side else 30)
        if v < bv:
            best, bv = r, v
    return best


def _roll_for(eaz, ealt, h, salt, side):
    """The roll about the Earth direction that puts the Sun at altitude salt, on side `side` of Earth (continuous in h)."""
    hq = round(h * 20) / 20
    return _roll_for_q(round(eaz, 1), round(ealt, 1), hq, round(salt, 1), side)


@scene_factory(keys=[])
def surface(view_az=(0.0, 4.0), pitch=(6.0, 7.0), fov=(62.0, 60.0), h=(20.0, 20.2), earth_az=(4.0, 4.0), earth_alt=(14.0, 14.0),
            sun_alt=(10.0, 10.0), sun_side=1.0, light="sun", pebble=(0.0, 0.0), jump=(0.0, 0.0), slide=(0.0, 0.0), dust=0.0, cam_x=(0.0, 0.0), cam_z=(0.0, 0.0),
            exposure=1.0, end_fade=(0.0, 0.0)):
    """Standing on Apophis at hour h. The local frame is turned so Earth stands at (earth_az, earth_alt) above our
    horizon; Earth's size, phase and lights, and the Sun's direction, then follow from the real geometry.
    pebble: 0..1 of the 156 s fall from 1.5 m (time-lapse); jump: 0..1 of a figure-free hop that never returns;
    slide: progress of grains sliding down the big boulder's slope; end_fade: Earth shrinking (hours beyond h)."""
    reg_a, reg_p = _regolith_tex()

    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)
        Q, Ap = _frame_for(L2(earth_az, e), L2(earth_alt, e), _roll_for(L2(earth_az, e), L2(earth_alt, e), hh, L2(sun_alt, e), sun_side), hh)
        va, pi_ = np.radians(L2(view_az, e)), np.radians(L2(pitch, e) - DIP)          # pitch is measured from the horizon
        fwdL = np.array([np.cos(pi_) * np.sin(va), np.sin(pi_), np.cos(pi_) * np.cos(va)])
        camL = np.array([L2(cam_x, e), RL + EYE, L2(cam_z, e)])
        # world camera at Apophis's real position (km), oriented like the local camera
        cw = Camera(Ap, Ap + Q @ fwdL, fov=L2(fov, e), up=Q @ np.array([0.0, 1.0, 0.0]))
        img = cw.sky(gain=0.9)
        alphaE = draw_earth(img, cw, hh, exposure=1.0 + 0.0 * exposure)
        sx_, sy_, sz_ = cw.project(Ap + sun_world() * 1e9)             # the Sun itself, when it is in view
        if sz_ > 0 and -400 < sx_ < W + 400 and -400 < sy_ < H + 400:
            glow_dot(img, sx_, sy_, (1.0, 0.97, 0.92), 9, 40.0)
            glow_dot(img, sx_, sy_, (1.0, 0.9, 0.8), 60, 1.2)
            from engine.core import star_spikes
            star_spikes(img, sx_, sy_, (1.0, 0.95, 0.9), 320, 1.2, angle=15)
            ctx.state["sun_xy"] = (sx_, sy_)
        ex, ey, _, erp = earth_screen(cw)
        from engine import cards
        cards.mark("EARTH", ex, ey)
        ctx.state["earth_xy"], ctx.state["earth_px"] = (ex, ey), erp
        sunL = Q.T @ sun_world()
        eL = Q.T @ (-Ap / np.linalg.norm(Ap))
        s_ = M.sun_dir()
        phase = np.degrees(np.arccos(np.clip(np.dot(Ap / np.linalg.norm(Ap), s_), -1, 1)))
        lit_frac = 0.5 * (1 + np.cos(np.radians(phase)))          # fraction of Earth's disc in daylight seen from here
        dK = np.linalg.norm(Ap)
        earth_light = (M.earth_angle_deg(dK) / 19.3) ** 2 * lit_frac * 0.5
        # the ground: rays in the local frame
        R = cw.R
        RL_ = Q.T @ R.T                                           # columns: right, up, back in local coords
        xs = (np.arange(W, dtype=np.float32) - W / 2) / cw.f
        ys = -(np.arange(H, dtype=np.float32) - H / 2) / cw.f
        X, Y = np.meshgrid(xs, ys)
        dL = X[..., None] * RL_[:, 0].astype(np.float32) + Y[..., None] * RL_[:, 1].astype(np.float32) - RL_[:, 2].astype(np.float32)
        dL /= np.linalg.norm(dL, axis=-1, keepdims=True)
        o = camL.astype(np.float32)
        b = dL @ o
        c = float(o @ o) - RL ** 2
        disc = b * b - c
        hit = (disc > 0) & (b < 0)
        tg = np.where(hit, -b - np.sqrt(np.maximum(disc, 0)), np.inf)
        tbest = tg.copy()
        bid = np.full(tg.shape, -1, np.int32)
        Nb = np.zeros(tg.shape + (3,), np.float32)
        BL = _boulders()
        boxes = []
        for i, (pu, rad, sd) in enumerate(BL):
            cpos = (pu * (RL + rad * 0.3)).astype(np.float32)
            box = _bbox(cw, Q, Ap, camL, cpos, rad * 1.25)
            boxes.append(box)
            if box is None:
                continue
            x0, y0, x1, y1 = box
            th, nrm = _convex_hit(o, dL[y0:y1, x0:x1], cpos, rad, sd)
            sub_t = tbest[y0:y1, x0:x1]
            m = np.isfinite(th) & (th < sub_t)
            sub_t[m] = th[m]
            bid[y0:y1, x0:x1][m] = i
            Nb[y0:y1, x0:x1][m] = nrm[m]
        anyhit = np.isfinite(tbest)
        P = o + dL * np.where(anyhit, tbest, 0)[..., None]
        N = P / (np.linalg.norm(P, axis=-1, keepdims=True) + 1e-6)
        rockm = bid >= 0
        N[rockm] = Nb[rockm]
        # ground detail from the regolith texture (tangent-plane coords)
        gx = (P[..., 0] * 9.0) % 2048
        gz = (P[..., 2] * 9.0) % 2048
        ra = cv2.remap(reg_a, gx.astype(np.float32), gz.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        rp_ = cv2.remap(reg_p, gx.astype(np.float32), gz.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        ground = bid < 0
        # rock texture: tied to the 3D point, so it sticks to the boulder
        rt = np.sin(P @ np.array([3.1, 1.7, 2.3], np.float32)) * np.sin(P @ np.array([-1.9, 2.9, 1.3], np.float32) * 1.7) * 0.5 + 0.5
        rxy = cv2.remap(reg_a, ((P[..., 0] * 13.0) % 2048).astype(np.float32), ((P[..., 1] * 13.0) % 2048).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        alb = np.where(ground, 0.38 + 0.45 * ra + 0.75 * rp_, 0.22 + 0.4 * ra + 0.5 * rxy - 0.2 * rp_)
        gyy, gxx = np.gradient(rp_ * 0.6 + ra * 0.3)
        N = N + np.where(ground[..., None], np.stack([-gxx, np.zeros_like(gxx), -gyy], -1) * 0.8, 0)
        N /= np.linalg.norm(N, axis=-1, keepdims=True) + 1e-6
        sL = (sunL / np.linalg.norm(sunL)).astype(np.float32)
        if light == "earth":                                     # night on the asteroid: Earthlight casts the shadows
            sL = (eL / np.linalg.norm(eL)).astype(np.float32)
        mu0 = np.maximum(N @ sL, 0)
        mu = np.maximum(-(N * dL).sum(-1), 1e-3)
        shade = 0.6 * 2 * mu0 / (mu0 + mu + 1e-4) + 0.4 * mu0
        # shadows cast by boulders: only test the screen region each shadow can fall in
        sh = np.ones_like(shade)
        Ps = P + N * 0.03
        upL = np.array([0.0, 1.0, 0.0])
        sh_h = sL - upL * sL[1]
        tan_s = max(0.04, sL[1] / (np.linalg.norm(sh_h) + 1e-6))
        for i, (pu, rad, sd) in enumerate(BL):
            cpos = (pu * (RL + rad * 0.3)).astype(np.float32)
            Ls = min(70.0, rad * 1.2 / tan_s)
            tip = cpos - sh_h / (np.linalg.norm(sh_h) + 1e-6) * Ls
            b1 = _bbox(cw, Q, Ap, camL, cpos, rad * 1.4)
            b2 = _bbox(cw, Q, Ap, camL, tip, rad * 1.6)
            bs = [b for b in (b1, b2) if b is not None]
            if not bs:
                continue
            x0, y0 = min(b[0] for b in bs), min(b[1] for b in bs)
            x1, y1 = max(b[2] for b in bs), max(b[3] for b in bs)
            th, _ = _convex_hit(None, None, cpos, rad, sd, pts=Ps[y0:y1, x0:x1], sdir=sL)
            m = np.isfinite(th) & (bid[y0:y1, x0:x1] != i)
            sh[y0:y1, x0:x1][m] = 0.0
        sh = cv2.GaussianBlur(sh, (0, 0), 0.9)
        sun_up = smooth(span(sL[1], -0.05, 0.08))                  # the Sun's own horizon on a small world
        lk = 1.8 if light != "earth" else 1.8 * min(1.0, 0.15 + 1.4 * earth_light)
        col = ROCK_ALB[None, None, :] * alb[..., None] * (shade * sh * sun_up)[..., None] * lk
        if light == "earth":
            col *= np.array([0.62, 0.8, 1.15], np.float32)
        eLn = (eL / np.linalg.norm(eL)).astype(np.float32)
        col += ROCK_ALB * alb[..., None] * np.maximum(N @ eLn, 0)[..., None] * np.array([0.45, 0.68, 1.0], np.float32) * (0.05 + 1.6 * earth_light)
        col += ROCK_ALB * alb[..., None] * 0.006
        # distance cue: nothing (no air), but fade the far horizon edge very slightly for anti-aliasing
        cov = anyhit.astype(np.float32)
        cov = cv2.GaussianBlur(cov, (0, 0), 0.7)
        img = img * (1 - cov[..., None]) + np.where(anyhit[..., None], col, 0) * cov[..., None]
        ctx.state["sun_alt"] = float(np.degrees(np.arcsin(np.clip(sL[1], -1, 1))))
        ctx.state["phase"] = phase
        # the pebble: dropped from shoulder height (1.5 m) just ahead of us, falling at g = 1.24e-4 m/s^2
        pk = L2(pebble, e) if pebble[1] > 0 else 0.0
        if pebble[1] > 0:
            pk = lerp(pebble[0], pebble[1], u)
            yv = RL + 1.5 * (1 - pk ** 2) * 1.0 + 0.04
            pp = np.array([0.15, yv, 1.1])
            pr = cw_project(cw, Q, Ap, pp, camL)
            if pr is not None:
                rr = 0.07 * cw.f / np.linalg.norm(pp - camL)
                cv2.circle(img, (int(pr[0]), int(pr[1])), max(2, int(rr)), (0.32, 0.30, 0.28), -1, cv2.LINE_AA)
                glow_dot(img, pr[0] - rr * 0.3, pr[1] - rr * 0.3, (1.0, 0.97, 0.9), max(1.0, rr * 0.4), 0.6 * sun_up)
                # the hand that let go (fades out)
                ctx.state["pebble_xy"] = pr
            hp = cw_project(cw, Q, Ap, np.array([0.35, RL + 1.55, 1.6]), camL)
            ctx.state["hand_xy"] = hp
        jk = lerp(jump[0], jump[1], u) if jump[1] > 0 else 0.0
        if jump[1] > 0:                                         # a bag of tools tossed up at 0.3 m/s: it never returns
            for k in range(1):
                hgt = 0.3 * (jk * 300) - 0.5 * M.surface_g() * (jk * 300) ** 2
                pp = np.array([-0.6, RL + 1.0 + max(0, hgt) + jk * 12, 4.0 + jk * 6])
                pr = cw_project(cw, Q, Ap, pp, camL)
                if pr is not None:
                    rr = 0.18 * cw.f / np.linalg.norm(pp - camL)
                    cv2.circle(img, (int(pr[0]), int(pr[1])), max(2, int(rr)), (0.55, 0.5, 0.42), -1, cv2.LINE_AA)
                    glow_dot(img, pr[0], pr[1], (1.0, 0.9, 0.7), max(1.0, rr * 0.6), 0.5)
                    ctx.state["jump_xy"] = pr
        sk = L2(slide, e)
        if sk > 0:                                              # grains streaming down the big boulder's flank
            pu, rad, sd = BL[-2]
            cpos = pu * (RL + rad * 0.3)
            gt = ctx.seg["start"] + ctx.beat.t0 + t
            for k in range(260):
                r2 = np.random.default_rng(k)
                ph0 = r2.uniform(0, 1)
                s_ = (gt * 0.06 + ph0) % 1.0
                ang = r2.uniform(-0.9, 0.9)
                th = 0.25 + s_ * 1.25
                pp = cpos + rad * np.array([np.sin(th) * np.sin(ang + 1.6), np.cos(th), np.sin(th) * np.cos(ang + 1.6)]) * 1.02
                pr = cw_project(cw, Q, Ap, pp, camL)
                if pr is not None:
                    glow_dot(img, pr[0], pr[1], (0.75, 0.72, 0.66), 1.4, 0.5 * sk * sun_up + 0.1 * sk)
            pr = cw_project(cw, Q, Ap, cpos + rad * np.array([0.6, 0.1, -0.3]), camL)
            if pr is not None:
                glow_dot(img, pr[0], pr[1], (0.6, 0.58, 0.55), 60 * sk, 0.08 * sk)
        return img, dict(exposure=1.3 * exposure, bloom=0.45, grade=((0.006, 0.006, 0.008), (1.0, 0.99, 0.97)))
    return f


def _bbox(cw, Q, Ap, camL, pL, rad):
    """Screen box (x0, y0, x1, y1) of a sphere of radius rad (m) at local point pL, or None if off screen."""
    v = Q @ (np.asarray(pL, np.float64) - camL)
    c = v @ cw.R.T
    dist = np.linalg.norm(v)
    if dist < rad * 1.5:
        return (0, 0, W, H)
    if -c[2] <= rad:
        return None
    x, y = W / 2 + cw.f * c[0] / -c[2], H / 2 - cw.f * c[1] / -c[2]
    r = cw.f * rad / max(-c[2] - rad, 1e-3) * 1.1 + 2
    x0, x1, y0, y1 = int(max(0, x - r)), int(min(W, x + r)), int(max(0, y - r)), int(min(H, y + r))
    if x1 <= x0 or y1 <= y0:
        return None
    return (x0, y0, x1, y1)


SQ = np.array([1.0, 1.0 / 0.62, 1.0], np.float32)          # boulders are flattened (local y squashed)


@functools.lru_cache(None)
def _planes(sd):
    rng = np.random.default_rng(abs(int(sd)) + 7)
    n = rng.normal(size=(7, 3))
    n[:, 1] = np.abs(n[:, 1]) * 0.8 + 0.2 * np.sign(rng.normal(size=7))
    n /= np.linalg.norm(n, axis=1, keepdims=True)
    return n.astype(np.float32), rng.uniform(0.55, 0.85, 7).astype(np.float32)


def _convex_hit(o, d, cpos, rad, sd, pts=None, sdir=None):
    """A faceted boulder: a flattened sphere cut by 7 random planes. Rays o + t d (one origin, many dirs), or many
    origins `pts` along one direction `sdir` (shadow test). Returns (t or inf, normal)."""
    nP, dP = _planes(sd)
    dP = dP * rad
    if pts is not None:
        oc = (pts - cpos) * SQ
        ds = np.broadcast_to((sdir * SQ).astype(np.float32), oc.shape)
    else:
        oc = np.broadcast_to(((o - cpos) * SQ).astype(np.float32), d.shape)
        ds = d * SQ
    aa = (ds * ds).sum(-1)
    bb = (ds * oc).sum(-1) / aa
    cc = ((oc * oc).sum(-1) - rad ** 2) / aa
    dd = bb * bb - cc
    sq = np.sqrt(np.maximum(dd, 0))
    t_in, t_out = -bb - sq, -bb + sq
    ok = dd > 0
    face = np.full(t_in.shape, -1, np.int8)
    for k in range(len(nP)):
        dn = ds @ nP[k]
        on = oc @ nP[k]
        tk = (dP[k] - on) / np.where(np.abs(dn) < 1e-9, 1e-9, dn)
        ent = dn < 0
        upd = ent & (tk > t_in)
        t_in = np.where(upd, tk, t_in)
        face = np.where(upd, k, face)
        t_out = np.where(~ent & (tk < t_out), tk, t_out)
        ok &= ~((np.abs(dn) < 1e-9) & (on > dP[k]))
    ok &= (t_in < t_out) & (t_in > 0)
    t = np.where(ok, t_in, np.inf)
    if pts is not None:
        return t, None
    x = oc + ds * np.where(ok, t_in, 0)[..., None]
    nrm = x / rad
    for k in range(len(nP)):
        nrm = np.where((face == k)[..., None], nP[k], nrm)
    nrm = nrm * SQ
    nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True) + 1e-6
    return t, nrm.astype(np.float32)


def cw_project(cw, Q, Ap, pL, camL):
    """Project a local-frame point (metres) through the world camera (which sits at camL in local coords)."""
    v = Q @ (np.asarray(pL, np.float64) - camL)
    c = v @ cw.R.T
    if -c[2] <= 1e-6:
        return None
    return W / 2 + cw.f * c[0] / -c[2], H / 2 - cw.f * c[1] / -c[2]


@scene_factory(keys=[])
def probe_scene(h=(21.0, 21.3), dist=(60.0, 55.0), az=(200.0, 210.0), el=(10.0, 12.0), fov=(50.0, 48.0), tumble_s=(0.0, 3000.0)):
    """Riding alongside: the camera floats a few dozen metres behind the probe; Apophis fills the frame beyond it,
    Earth hangs behind at its true size for hour h."""
    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)
        Ap = apophis_world(hh)
        edir = -Ap / np.linalg.norm(Ap)
        sun = sun_world()
        pp = np.array([0.0, -900.0, 120.0])                  # the probe, 900 m from the asteroid's centre
        A, E = np.radians(L2(az, e)), np.radians(L2(el, e))
        off = L2(dist, e) * np.array([np.cos(E) * np.cos(A), np.cos(E) * np.sin(A), np.sin(E)])
        pos = pp + off + np.array([0.0, -40.0, 0.0])
        look = pp * 0.85
        cam = Camera(pos, look, fov=L2(fov, e), up=(0.0, 0.0, 1.0))
        img = cam.sky(gain=0.8)
        ce = Camera(Ap + pos / 1000.0, Ap + look / 1000.0, fov=L2(fov, e), up=(0.0, 0.0, 1.0))
        draw_earth(img, ce, hh)
        Rb = tumble(lerp(tumble_s[0], tumble_s[1], u))
        render_rock(img, cam, Rb, sun, earth_dir=edir, earth_k=1.0)
        probe(img, cam, pp, sun, s=3.2)
        ctx.state["probe_xy"] = cam.project(pp)[:2]
        ctx.state["rock_xy"] = cam.project(np.zeros(3))[:2]
        return img, dict(exposure=1.35, bloom=0.45)
    return f
