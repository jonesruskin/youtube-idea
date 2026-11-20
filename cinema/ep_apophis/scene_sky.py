"""Episode 5 scenes, part 1: the real Earth and the real sky.

World frame = geocentric ICRF (km), exactly the frame of the JPL Horizons vectors in data/. Time `h` = hours after
13 April 2029 00:00 UTC. The Earth is ray-cast per pixel in that frame and turned by Greenwich sidereal time, lit
by the real Sun direction, so the night side, the terminator and the lights of Europe are where they will be.

  roof   the sky over Lisbon's rooftops (topocentric Horizons track for Apophis, stars turning with the hour)
  lane   near-Earth space: the satellite shells, the Moon, Apophis's real path threading inside the geostationary ring
  bend   the same space seen from above the flyby plane: the path bent by 27 degrees, speed on the clock
  track  the globe: the point below Apophis crossing from the Indian Ocean over Africa to the Atlantic
Every scene returns (HDR image, post kwargs)."""
import functools
import numpy as np, cv2
from engine.beats import scene_factory
from engine.core import W, H, clamp, smooth, span, lerp, grid, fbm, blur, fast_blur, glow_dot, splat_points, cached
from engine.cam3d import Camera, sky_tex, bright_stars, SKY_W, SKY_H
from engine.planet import tex
from ep_apophis import model as M

# palette: basalt grey, sodium gold, one cyan planet
BASALT = np.array([0.33, 0.32, 0.31], np.float32)
SODIUM = np.array([1.00, 0.62, 0.22], np.float32)
CYAN = (0.45, 0.85, 1.0)
GOLD = (1.0, 0.74, 0.36)
INK = (0.94, 0.93, 0.90)
SAT = (0.80, 0.86, 0.95)
LISBON = (38.72, -9.14)


def ease(u):
    return smooth(clamp(u))


def L2(p, e):
    return lerp(p[0], p[1], e) if isinstance(p, (tuple, list)) else p


def gmst_deg(h):
    jd = 2462239.5 + h / 24.0
    T = (jd - 2451545.0) / 36525.0
    return (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) % 360


def sun_world():
    return M.sun_dir()


def apophis_world(h):
    t, p, _ = M.geo()
    if h <= t[-1]:
        return np.asarray(M.pos_at(h), np.float64)
    _, _, v = M.geo()                             # beyond the data (end shot): coast on in a straight line
    return np.asarray(M.pos_at(t[-1]), np.float64) + v[-1] * (h - t[-1]) * 3600.0


def ll_to_world(lat, lon, h, r=M.R_E):
    """Earth-fixed latitude/longitude (deg) -> ICRF vector at hour h."""
    a = np.radians(lon + gmst_deg(h))
    la = np.radians(lat)
    return np.stack([r * np.cos(la) * np.cos(a), r * np.cos(la) * np.sin(a), r * np.sin(la) * np.ones_like(a)], -1)


# ═══════════════════════════════════════════ the Earth, ray-cast ═══════════════════════════════════════════
def _rays(cam, x0, y0, x1, y1, step=1):
    xs = (np.arange(x0, x1, step, dtype=np.float32) - W / 2) / cam.f
    ys = -(np.arange(y0, y1, step, dtype=np.float32) - H / 2) / cam.f
    X, Y = np.meshgrid(xs, ys)
    R = cam.R.astype(np.float32)
    d = X[..., None] * R[0] + Y[..., None] * R[1] - R[2]
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def earth_screen(cam, center=(0.0, 0.0, 0.0), r=M.R_E):
    x, y, z = cam.project(np.asarray(center, np.float64))
    dist = np.linalg.norm(np.asarray(center) - cam.pos)
    ang = np.arcsin(min(0.9999, r / max(dist, r * 1.0001)))
    rp = cam.f * np.tan(ang) * 1.05
    return x, y, z, rp


def draw_earth(img, cam, h, lights=1.0, clouds=1.0, exposure=1.0, atmo=1.0, tw=4096, center=(0.0, 0.0, 0.0)):
    """Composite the real Earth into img (HDR). Returns the coverage alpha (H, W)."""
    cx, cy, z, rp = earth_screen(cam, center)
    alpha = np.zeros((H, W), np.float32)
    if z <= 0:
        return alpha
    pad = rp * 0.12 + 6
    x0, x1 = int(max(0, cx - rp - pad)), int(min(W, cx + rp + pad))
    y0, y1 = int(max(0, cy - rp - pad)), int(min(H, cy + rp + pad))
    if x1 <= x0 or y1 <= y0:
        return alpha
    if rp < 2.0:                                   # a point of light
        s = sun_world()
        v = cam.pos - np.asarray(center) ; v = v / np.linalg.norm(v)
        ph = 0.5 * (1 + float(np.dot(v, s)))
        glow_dot(img, cx, cy, (0.5, 0.75, 1.0), 1.2, 3.0 * (0.25 + ph) * exposure)
        return alpha
    d = _rays(cam, x0, y0, x1, y1)
    o = (cam.pos - np.asarray(center)).astype(np.float32)
    b = d @ o
    c = float(o @ o) - M.R_E ** 2
    disc = b * b - c
    hit = disc > 0
    tt = -b - np.sqrt(np.maximum(disc, 0))
    hit &= tt > 0
    p = o + d * tt[..., None]
    n = p / M.R_E
    s = sun_world().astype(np.float32)
    ndl = n @ s
    g = np.radians(gmst_deg(h))
    lon = np.arctan2(n[..., 1], n[..., 0]) - g
    lat = np.arcsin(np.clip(n[..., 2], -1, 1))
    day = tex("8k_earth_daymap.jpg", tw)
    th, twd = day.shape[:2]
    mu = (((lon / (2 * np.pi) + 0.5) % 1.0) * twd).astype(np.float32)
    mv = np.clip((0.5 - lat / np.pi) * th, 0, th - 1).astype(np.float32)
    col = cv2.remap(day, mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    ocean = clamp((col[..., 2] - col[..., 0] * 1.1) * 6.0)
    if clouds > 0:
        cl = cv2.remap(tex("8k_earth_clouds.jpg", tw), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)[..., 0]
        cl = clamp(cl * 1.15 * clouds)[..., None]
        col = col * (1 - cl) + 0.95 * cl
        ocean = ocean * (1 - cl[..., 0])
    term = smooth(span(ndl, -0.06, 0.3))
    lit = col * (np.maximum(ndl, 0) ** 0.85 * term)[..., None] * 1.7 * exposure
    v = -d
    hv = v + s
    hv = hv / np.linalg.norm(hv, axis=-1, keepdims=True)
    ndh = np.sum(n * hv, -1)
    spec = np.maximum(ndh, 0) ** 140 * 0.8 + np.maximum(ndh, 0) ** 20 * 0.03
    lit += (spec * ocean * term * min(1.0, exposure))[..., None] * np.array([1.0, 0.93, 0.8], np.float32)
    nightamb = (1 - smooth(span(ndl, -0.2, 0.05)))[..., None]
    lit += col * nightamb * np.array([0.10, 0.13, 0.20], np.float32) * exposure
    if lights > 0:
        nl = cv2.remap(tex("8k_earth_nightmap.jpg", tw), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        dark = (1 - smooth(span(ndl, -0.12, 0.08)))[..., None]
        lit += nl * dark * SODIUM * 2.4 * lights * exposure
    nz = np.sum(n * v, -1)
    rim = (1 - clamp(nz)) ** 3 * (0.2 + 1.3 * smooth(span(ndl, -0.25, 0.5)))
    lit += rim[..., None] * np.array([0.30, 0.55, 1.0], np.float32) * 0.8 * atmo
    # antialiased edge: distance of the ray from the sphere edge, in pixels
    rmin = np.sqrt(np.maximum(c - (b * b - 0) + b * b - b * b, 0))  # placeholder (overwritten below)
    perp = np.sqrt(np.maximum(float(o @ o) - b * b, 0))           # closest distance of each ray to the centre
    dist = np.linalg.norm(o)
    px_per_km = rp / M.R_E / 1.05
    a_edge = clamp((M.R_E - perp) * px_per_km + 0.5) * (b < 0)
    reg = img[y0:y1, x0:x1]
    reg[:] = reg * (1 - a_edge[..., None]) + np.where(hit[..., None], lit, 0) * a_edge[..., None]
    # outer glow of the atmosphere (sunlit side brighter)
    if atmo > 0:
        hgt = perp - M.R_E
        cp = o + d * (-b)[..., None]                               # closest point on each ray
        cpn = cp / (np.linalg.norm(cp, axis=-1, keepdims=True) + 1e-6)
        sl = smooth(span(cpn @ s, -0.3, 0.5))
        Hs = max(70.0, 2.2 / px_per_km)
        halo = np.exp(-np.maximum(hgt, 0) / Hs) * (hgt > -2 / px_per_km) * (b < 0)
        reg += (halo * (0.08 + 0.9 * sl))[..., None] * np.array([0.32, 0.58, 1.0], np.float32) * 0.9 * atmo * exposure
    alpha[y0:y1, x0:x1] = a_edge
    return alpha


def occluded(cam, P, center=(0.0, 0.0, 0.0)):
    """True where world points P are hidden behind the Earth as seen from cam."""
    P = np.atleast_2d(np.asarray(P, np.float64))
    o = cam.pos - np.asarray(center)
    d = P - cam.pos
    L = np.linalg.norm(d, axis=1)
    d = d / L[:, None]
    b = d @ o
    c = o @ o - M.R_E ** 2
    disc = b * b - c
    t = -b - np.sqrt(np.maximum(disc, 0))
    return (disc > 0) & (t > 0) & (t < L)


def space_sky(cam, gain=1.0):
    return cam.sky(gain=gain)


def dot(img, x, y, col, r=2.0, k=1.0):
    if -50 < x < W + 50 and -50 < y < H + 50:
        glow_dot(img, x, y, col, r, k)
        glow_dot(img, x, y, col, r * 4, k * 0.06)


def polyline3(img, cam, P, col, alpha=1.0, th=2, hide=True, fade=None):
    P = np.asarray(P, np.float64)
    if len(P) < 2:
        return img
    x, y, z = cam.project(P)
    vis = z > 0
    if hide:
        vis &= ~occluded(cam, P)
    lay = np.zeros((H, W), np.float32)
    seg = []
    for i in range(len(P)):
        if vis[i] and abs(x[i]) < 4 * W and abs(y[i]) < 4 * H:
            seg.append((x[i], y[i]))
        else:
            if len(seg) > 1:
                cv2.polylines(lay, [np.round(np.array(seg) * 16).astype(np.int32)], False, 1.0, th, cv2.LINE_AA, 4)
            seg = []
    if len(seg) > 1:
        cv2.polylines(lay, [np.round(np.array(seg) * 16).astype(np.int32)], False, 1.0, th, cv2.LINE_AA, 4)
    g = fast_blur(lay, 3) * 0.6
    img += (lay + g)[..., None] * np.asarray(col, np.float32) * alpha
    return img


# ═══════════════════════════════════════════ satellites ═══════════════════════════════════════════
@functools.lru_cache(None)
def geo_sats(n=180):
    """Geostationary satellites: a ring above the equator (ICRF z = 0 plane), at fixed Earth longitudes."""
    rng = np.random.default_rng(5)
    lons = np.sort(rng.uniform(-180, 180, n))
    return lons


def geo_ring_pts(h):
    lons = geo_sats()
    a = np.radians(lons + gmst_deg(h))
    r = M.R_E + M.GEO_ALT
    return np.stack([r * np.cos(a), r * np.sin(a), np.zeros_like(a)], -1)


@functools.lru_cache(None)
def gps_elems():
    rng = np.random.default_rng(6)
    out = []
    for k in range(6):
        node = np.radians(60 * k + 10)
        for j in range(5):
            out.append((node, np.radians(55.0), rng.uniform(0, 2 * np.pi)))
    return out


def gps_pts(h):
    r = M.R_E + M.GPS_ALT
    w = 2 * np.pi / 11.967                       # half a sidereal day
    P = []
    for node, inc, m0 in gps_elems():
        th = m0 + w * h
        x, y = r * np.cos(th), r * np.sin(th)
        y2, z2 = y * np.cos(inc), y * np.sin(inc)
        P.append((x * np.cos(node) - y2 * np.sin(node), x * np.sin(node) + y2 * np.cos(node), z2))
    return np.array(P)


def ring_circle(r, n=720, inc=0.0, node=0.0):
    th = np.linspace(0, 2 * np.pi, n)
    x, y = r * np.cos(th), r * np.sin(th)
    y2, z2 = y * np.cos(inc), y * np.sin(inc)
    return np.stack([x * np.cos(node) - y2 * np.sin(node), x * np.sin(node) + y2 * np.cos(node), z2], -1)


@functools.lru_cache(None)
def moon_world():
    r = M._csv("moon_geo.csv")
    return np.array([float(x) for x in r[21][2:5]])


# ═══════════════════════════════════════════ near-Earth space ═══════════════════════════════════════════
def _orbit_cam(dist, az, el, fov, look=(0.0, 0.0, 0.0), roll=0.0):
    """Camera on a sphere around `look`: az/el in degrees in the ICRF frame (el from the equator)."""
    a, e = np.radians(az), np.radians(el)
    pos = np.asarray(look, np.float64) + dist * np.array([np.cos(e) * np.cos(a), np.cos(e) * np.sin(a), np.sin(e)])
    return Camera(pos, look, fov=fov, up=(0.0, 0.0, 1.0), roll=np.radians(roll))


def _space(cam, h, path_to, shells, ring, gps, moon, path_alpha=1.0, mark=1.0, glow=1.0, trail_from=None, beads=0.0):
    img = space_sky(cam, 0.9)
    if moon > 0:
        polyline3(img, cam, ring_circle(np.linalg.norm(moon_world()), inc=np.radians(28.0), node=np.radians(np.degrees(np.arctan2(moon_world()[1], moon_world()[0])) - 90)), (0.75, 0.75, 0.8), 0.3 * moon, th=1, hide=False)
        mx_, my_, mz_ = cam.project(moon_world())
        if mz_ > 0:
            glow_dot(img, mx_, my_, (0.9, 0.9, 0.85), 4.0, 6.0 * moon)
            cv2.circle(img, (int(mx_), int(my_)), 7, (0.75, 0.75, 0.72), -1, cv2.LINE_AA)
        from engine import cards
        cards.mark("MOON", mx_, my_)
    draw_earth(img, cam, h, tw=4096)
    if ring > 0:
        polyline3(img, cam, ring_circle(M.R_E + M.GEO_ALT), (0.55, 0.62, 0.75), 0.25 * ring, th=1)
        P = geo_ring_pts(h)
        x, y, z = cam.project(P)
        hid = occluded(cam, P)
        for xi, yi, zi, hd in zip(x, y, z, hid):
            if zi > 0 and not hd:
                dot(img, xi, yi, SAT, 1.1, 1.2 * ring)
    if gps > 0:
        P = gps_pts(h)
        x, y, z = cam.project(P)
        hid = occluded(cam, P)
        for xi, yi, zi, hd in zip(x, y, z, hid):
            if zi > 0 and not hd:
                dot(img, xi, yi, (0.6, 0.9, 0.7), 1.0, 0.9 * gps)
    if shells > 0:                               # the ISS orbit, a thin line hugging the planet
        polyline3(img, cam, ring_circle(M.R_E + M.ISS_ALT, inc=np.radians(51.6), node=np.radians(40)), (0.7, 0.8, 0.9), 0.35 * shells, th=1)
    if path_alpha > 0:
        t0 = trail_from if trail_from is not None else -14.0
        hs = np.linspace(t0, path_to, 700)
        P = np.array([apophis_world(x) for x in hs])
        polyline3(img, cam, P, GOLD, 0.75 * path_alpha, th=2)
        if beads > 0:                                  # one bead every 15 minutes: they spread out as it speeds up
            for hb in np.arange(np.ceil(t0 * 4) / 4, path_to, 0.25):
                bx_, by_, bz_ = cam.project(apophis_world(hb))
                if bz_ > 0:
                    glow_dot(img, bx_, by_, (1.0, 0.85, 0.55), 5.0, 6.0 * beads)
    A = apophis_world(path_to)
    x, y, z = cam.project(A)
    if z > 0 and not occluded(cam, A)[0] and mark > 0:
        dot(img, x, y, (1.0, 0.85, 0.6), 2.0, 2.6 * mark * glow)
    return img, (x, y)


@scene_factory(keys=[])
def lane(dist=(160000.0, 120000.0), az=(-40.0, -30.0), el=(18.0, 16.0), fov=(40.0, 40.0), h=(20.0, 21.0), look=(0.0, 0.0, 0.0),
         ring=1.0, gps=0.0, shells=0.0, moon=0.0, path=1.0, follow=0.0, trail_from=-14.0, glint=0.0):
    """Near-Earth space with the real path. follow: 0 = look at Earth, 1 = look at Apophis."""
    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)                       # time runs at a constant rate
        A = apophis_world(hh)
        lk = np.asarray(look, np.float64) * (1 - follow) + A * follow
        cam = _orbit_cam(L2(dist, e), L2(az, e), L2(el, e), L2(fov, e), lk)
        img, (x, y) = _space(cam, hh, hh, shells, ring, gps, moon, path, trail_from=trail_from)
        if glint > 0:                                   # one satellite above the night side, still in sunlight, moving along its orbit
            ring_ = ring_circle(M.R_E + M.ISS_ALT, n=2000, inc=np.radians(51.6), node=np.radians(40))
            s_ = sun_world()
            cdir_ = cam.pos / np.linalg.norm(cam.pos)
            sp_ = s_ - cdir_ * (s_ @ cdir_)
            sp_ = sp_ / (np.linalg.norm(sp_) + 1e-9)
            cands = []
            for a_ in np.linspace(0.3, 1.0, 36):                 # points 900 km up over the visible face
                for b_ in np.linspace(-1.0, 1.0, 36):
                    for c_ in (-0.6, -0.3, 0.0, 0.3, 0.6):
                        d_ = cdir_ * a_ + sp_ * b_ + np.cross(cdir_, sp_) * c_
                        cands.append(d_ / np.linalg.norm(d_) * (M.R_E + 900))
            cands = np.array(cands)
            ax_ = cands @ s_
            lit_ok = (ax_ > 0) | (np.linalg.norm(cands - np.outer(ax_, s_), axis=1) > M.R_E)   # outside Earth's shadow
            cx_, cy_, cz_ = cam.project(cands)
            night_below = (cands / np.linalg.norm(cands, axis=1)[:, None]) @ s_ < -0.05             # the ground below is in night
            keep = lit_ok & night_below & (cz_ > 0) & (cx_ > W * 0.2) & (cx_ < W * 0.8) & (cy_ > H * 0.2) & (cy_ < H * 0.8) & ~occluded(cam, cands)
            ring_ = cands[keep] if keep.any() else cands[:2]
            ring_ = ring_[np.argsort(cx_[keep] if keep.any() else np.zeros(2))]
            gx0, gy0, gz0 = cam.project(ring_)
            vis_ = (gz0 > 0) & ~occluded(cam, ring_)
            lit_ = ring_ @ s_ / np.linalg.norm(ring_, axis=1)
            ok_ = np.where(vis_)[0]
            if len(ok_):
                j_ = ok_[int((len(ok_) - 1) * (0.2 + 0.6 * u))]
                gx_, gy_, gz_ = cam.project(ring_[j_])
                if gz_ > 0 and not occluded(cam, ring_[j_])[0]:
                    glow_dot(img, gx_, gy_, (1.0, 0.98, 0.9), 4.0, 30.0 * glint)
                    glow_dot(img, gx_, gy_, (1.0, 0.95, 0.85), 16.0, 1.2 * glint)
                    from engine.core import star_spikes
                    star_spikes(img, gx_, gy_, (1.0, 0.95, 0.85), 60, 0.6 * glint)
                    ctx.state["glint_xy"] = (gx_, gy_)
        ctx.state["apophis_xy"] = (x, y)
        ctx.state["h"] = hh
        from engine import cards
        cards.mark("APOPHIS", x, y)
        ex, ey, _, _ = earth_screen(cam)
        cards.mark("EARTH", ex, ey)
        return img, dict(exposure=1.25, bloom=0.5)
    return f


@scene_factory(keys=[])
def bend(h=(19.5, 22.0), scale=(1.0, 1.0), show_angle=(0.0, 0.0), arrows=(0.0, 0.0), tilt=(70.0, 70.0), spin=(0.0, 0.0)):
    """The flyby plane seen from above: the real hyperbola from Horizons, the incoming and outgoing directions, and
    the 27 degree bend. scale: camera distance factor."""
    t_, P_, V_ = M.geo()
    tc = M.closest()[0]
    pc = M.pos_at(tc)
    vc = M._spline()(tc, 1)
    nrm = np.cross(pc, vc)
    nrm /= np.linalg.norm(nrm)

    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)
        tl = np.radians(L2(tilt, e))
        ax = pc / np.linalg.norm(pc)
        side = np.cross(nrm, ax)
        rot = np.radians(L2(spin, e))
        view_dir = nrm * np.sin(tl) + (ax * np.cos(rot) + side * np.sin(rot)) * np.cos(tl)
        d = 260000.0 * L2(scale, e)
        ctr = pc * 0.9                                   # centre on the bend, not on the planet
        cam = Camera(ctr + view_dir * d, ctr, fov=44.0, up=-side if abs(np.sin(tl)) > 0.2 else nrm)
        img, (x, y) = _space(cam, hh, hh, 0.0, 0.7, 0.0, 0.0, 1.0, trail_from=-22.0, beads=1.0)
        # the asymptotes: where it was heading and where it ends up heading
        aa = L2(arrows, e)
        if aa > 0:
            v_in, v_out = V_[0] / np.linalg.norm(V_[0]), V_[-1] / np.linalg.norm(V_[-1])
            p_in = M.pos_at(t_[0] + 18)
            ext = np.array([p_in + v_in * k for k in np.linspace(0, 160000, 40)])
            polyline3(img, cam, ext, (0.75, 0.8, 0.9), 0.5 * aa, th=1, hide=False)
            p_out = M.pos_at(min(t_[-1], tc + 3.0))
            ext2 = np.array([p_out + v_out * k for k in np.linspace(0, 140000, 40)])
            polyline3(img, cam, ext2, GOLD, 0.6 * aa, th=1, hide=False)
            ctx.state["bend_pts"] = (cam.project(p_in + v_in * 120000)[:2], cam.project(p_out + v_out * 80000)[:2])
        ctx.state["apophis_xy"] = (x, y)
        ctx.state["h"] = hh
        ctx.state["speed"] = float(np.linalg.norm(M._spline()(hh, 1)) / 3600.0)
        ex, ey, _, _ = earth_screen(cam)
        ctx.state["earth_xy"] = (ex, ey)
        return img, dict(exposure=1.25, bloom=0.5)
    return f


CITIES = [(38.72, -9.14), (51.5, -0.13), (48.86, 2.35), (41.9, 12.5), (30.04, 31.24), (6.52, 3.38), (-1.29, 36.82), (-26.2, 28.05),
          (33.57, -7.59), (40.42, -3.7), (52.52, 13.4), (41.0, 28.98), (24.7, 46.7), (-4.32, 15.3), (14.7, -17.45)]


@scene_factory(keys=[])
def track(lat=(10.0, 20.0), lon=(10.0, -20.0), dist=(42000.0, 42000.0), h=(19.0, 21.0), path=(0.0, 1.0), lisbon=1.0, sight=0.0, wide=0.0):
    """The globe from far above with the point below Apophis tracing across it (real GMST, real night side)."""
    hs = np.linspace(18.6, 23.4, 300)
    sub = np.array([M.sub_point(x) for x in hs])

    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)
        la, lo = L2(lat, e), L2(lon, e)
        cdir = ll_to_world(la, lo, hh, 1.0)
        tgt = apophis_world(hh) * 0.42 if wide > 0 else np.zeros(3)     # aim between Earth and the asteroid
        cam = Camera(cdir * L2(dist, e), tgt, fov=34.0 if wide <= 0 else 30.0, up=(0.0, 0.0, 1.0))
        img = space_sky(cam, 0.6)
        draw_earth(img, cam, hh, tw=4096)
        pr = L2(path, e)
        n = int(len(hs) * pr)
        k = hs <= hh
        sel = np.where(k)[0][: max(2, n)] if pr > 0 else []
        if len(sel) > 1:
            P = ll_to_world(sub[sel, 0], sub[sel, 1], hh, M.R_E + 15)
            polyline3(img, cam, P, GOLD, 0.95, th=3)
        A = apophis_world(hh)
        x, y, z = cam.project(A)
        if z > 0 and not occluded(cam, A)[0]:
            dot(img, x, y, (1.0, 0.85, 0.6), 2.2 + 3.0 * sight, 2.6 + 8.0 * sight)
        if sight > 0 and z > 0:                       # lines of sight from cities on the night side to the asteroid
            lay = np.zeros((H, W), np.float32)
            for (cla, clo) in CITIES:
                cp = ll_to_world(cla, clo, hh, M.R_E + 5)
                if np.dot(A - cp, cp) <= 0 or occluded(cam, cp + cp / np.linalg.norm(cp) * 30)[0]:
                    continue
                qx, qy, qz = cam.project(cp)
                if qz > 0:
                    cv2.line(lay, (int(qx * 16), int(qy * 16)), (int(x * 16), int(y * 16)), 1.0, 1, cv2.LINE_AA, 4)
                    glow_dot(img, qx, qy, (1.0, 0.8, 0.5), 2.0, 1.5 * sight)
            img += lay[..., None] * np.array([1.0, 0.8, 0.5], np.float32) * 0.45 * sight
        ctx.state["apophis_xy"] = (x, y)
        ax_, ay_, az_ = cam.project(ll_to_world(-31.27, 149.06, hh, M.R_E))
        ctx.state["aus_xy"] = (ax_, ay_) if az_ > 0 and not occluded(cam, ll_to_world(-31.27, 149.06, hh, M.R_E + 30))[0] else None
        lx, ly, lz = cam.project(ll_to_world(*LISBON, hh, M.R_E))
        ctx.state["lisbon_xy"] = (lx, ly) if (lz > 0 and lisbon > 0 and not occluded(cam, ll_to_world(*LISBON, hh, M.R_E + 1))[0]) else None
        ctx.state["h"] = hh
        q = M.sub_point(hh)
        sx, sy, sz = cam.project(ll_to_world(q[0], q[1], hh, M.R_E + 15))
        ctx.state["sub_xy"] = (sx, sy)
        return img, dict(exposure=1.3, bloom=0.45)
    return f


# ═══════════════════════════════════════════ the sky over Lisbon ═══════════════════════════════════════════
def local_frame(h, lat=LISBON[0], lon=LISBON[1]):
    lst = np.radians(gmst_deg(h) + lon)
    la = np.radians(lat)
    up = np.array([np.cos(la) * np.cos(lst), np.cos(la) * np.sin(lst), np.sin(la)])
    east = np.array([-np.sin(lst), np.cos(lst), 0.0])
    north = np.cross(up, east)
    return east, north, up


def altaz_dir(az, alt, h):
    e, n, u = local_frame(h)
    a, b = np.radians(az), np.radians(alt)
    return np.cos(b) * (np.cos(a) * n + np.sin(a) * e) + np.sin(b) * u


def apophis_altaz(h):
    Lb = M.lisbon()
    i = np.clip(np.searchsorted(Lb[:, 0], h) - 1, 0, len(Lb) - 2)
    k = (h - Lb[i, 0]) / (Lb[i + 1, 0] - Lb[i, 0])
    az = Lb[i, 1] + ((Lb[i + 1, 1] - Lb[i, 1] + 180) % 360 - 180) * k
    alt = Lb[i, 2] + (Lb[i + 1, 2] - Lb[i, 2]) * k
    mag = np.nan_to_num(Lb[i, 3] + (Lb[i + 1, 3] - Lb[i, 3]) * k, nan=6.0)
    return az, alt, mag


def sun_alt(h):
    _, _, up = local_frame(h)
    return float(np.degrees(np.arcsin(np.clip(sun_world() @ up, -1, 1))))


# the Big Dipper and Orion (J2000 RA, Dec, magnitude) for comparisons on screen
DIPPER = [(165.93, 61.75, 1.8), (165.46, 56.38, 2.4), (178.46, 53.69, 2.4), (183.86, 57.03, 3.3), (193.51, 55.96, 1.8), (200.98, 54.93, 2.2), (206.89, 49.31, 1.9)]
DIPPER_L = [(0, 1), (1, 2), (2, 3), (3, 0), (3, 4), (4, 5), (5, 6)]
ORION = [(88.79, 7.41, 0.5), (81.28, 6.35, 1.6), (83.00, -0.30, 2.2), (84.05, -1.20, 1.7), (85.19, -1.94, 1.8), (86.94, -9.67, 2.1), (78.63, -8.20, 0.1)]
ORION_L = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (4, 5), (2, 6), (5, 6)]


# rooftops: a 360 degree panorama (azimuth x altitude), built once
PPD = 24.0
ALT_LO, ALT_HI = -14.0, 16.0
PW, PH_ = int(360 * PPD), int((ALT_HI - ALT_LO) * PPD)


def _build_roofs():
    rng = np.random.default_rng(29)
    a = np.zeros((PH_, PW), np.float32)
    win = np.zeros((PH_, PW), np.float32)
    rim = np.zeros((PH_, PW), np.float32)
    Y = lambda alt: (ALT_HI - alt) * PPD
    # three rows of houses: far (low), middle, near (tall) — a hilly old town
    for row, (base, hlo, hhi, wlo, whi, n) in enumerate([(-1.5, 1.0, 2.6, 1.2, 3.2, 260), (-4.0, 2.5, 5.0, 2.5, 6.0, 120), (-9.0, 4.0, 9.0, 5.0, 12.0, 48)]):
        x = 0.0
        hill = lambda az: 1.6 * np.sin(np.radians(az) * 2 + row) + 0.9 * np.sin(np.radians(az) * 5 + 2 * row)
        while x < 360:
            w = rng.uniform(wlo, whi)
            hgt = rng.uniform(hlo, hhi)
            b0 = base + hill(x) * (0.5 if row < 2 else 0.2)
            top = b0 + hgt
            x0, x1 = x * PPD, (x + w) * PPD
            roof_h = rng.uniform(0.3, 0.9) * w * 0.35
            pts = np.array([[x0, Y(ALT_LO)], [x0, Y(top)], [(x0 + x1) / 2, Y(top + roof_h)], [x1, Y(top)], [x1, Y(ALT_LO)]], np.int32)
            cv2.fillPoly(a, [pts], 1.0, cv2.LINE_AA)
            # warm rim where the roofline catches the street glow
            cv2.polylines(rim, [pts[1:4]], False, 1.0, 1, cv2.LINE_AA)
            if rng.random() < 0.6:                     # a chimney
                cxp = rng.uniform(x0 + 4, x1 - 8)
                cw = rng.uniform(0.25, 0.5) * PPD * (1 + row * 0.5)
                ch = rng.uniform(0.4, 1.0) * PPD * (1 + row * 0.4)
                yb = Y(top) - (roof_h * PPD / (w * PPD / 2)) * 0 - 2
                cv2.rectangle(a, (int(cxp), int(yb - ch)), (int(cxp + cw), int(yb + 4)), 1.0, -1)
            if rng.random() < 0.45:                    # a TV aerial
                axp = rng.uniform(x0 + 4, x1 - 4)
                at = Y(top + roof_h * 0.6)
                ah = rng.uniform(0.8, 1.8) * PPD * (1 + row * 0.3)
                cv2.line(a, (int(axp), int(at)), (int(axp), int(at - ah)), 1.0, 1, cv2.LINE_AA)
                for k in range(3):
                    yy = int(at - ah * (0.5 + 0.2 * k))
                    hw = int(ah * (0.35 - 0.08 * k))
                    cv2.line(a, (int(axp - hw), yy), (int(axp + hw), yy), 1.0, 1, cv2.LINE_AA)
            # lit windows (a few), warm sodium/incandescent
            for _ in range(int(w * hgt * 0.35 * (1 + row))):
                if rng.random() < 0.35:
                    wx = rng.uniform(x0 + 3, x1 - 6)
                    wy = Y(rng.uniform(b0 + 0.3, top - 0.4))
                    ww, wh = (2 + row * 2.5), (3 + row * 3.5)
                    cv2.rectangle(win, (int(wx), int(wy)), (int(wx + ww), int(wy + wh)), rng.uniform(0.3, 1.0), -1)
            x += w * rng.uniform(0.92, 1.05)
    # a church tower to the south-east and a castle wall on the hill to the east (Lisbon's skyline, impression only)
    for az0, wdt, hgt in ((150.0, 2.2, 13.0), (205.0, 1.6, 9.0)):
        x0, x1 = az0 * PPD, (az0 + wdt) * PPD
        cv2.rectangle(a, (int(x0), int(Y(hgt))), (int(x1), int(Y(ALT_LO))), 1.0, -1)
        cv2.fillPoly(a, [np.array([[x0 - 4, Y(hgt)], [(x0 + x1) / 2, Y(hgt + 3.5)], [x1 + 4, Y(hgt)]], np.int32)], 1.0, cv2.LINE_AA)
    for k in range(18):
        x0 = (60 + k * 1.3) * PPD
        cv2.rectangle(a, (int(x0), int(Y(4.5 + (k % 2) * 0.6))), (int(x0 + 0.8 * PPD), int(Y(ALT_LO))), 1.0, -1)
    a = clamp(cv2.GaussianBlur(a, (0, 0), 0.6))
    win = cv2.GaussianBlur(win, (0, 0), 0.7) * a
    rim = cv2.GaussianBlur(rim, (0, 0), 1.0)
    return np.stack([a, win, rim], -1).astype(np.float16)


def roofs():
    global _ROOFS
    try:
        return _ROOFS
    except NameError:
        _ROOFS = cached("ep5_roofs_v2", _build_roofs).astype(np.float32)
        return _ROOFS


def _sky_ground(cam, az_map, alt_map, h, haze=1.0):
    """Night sky colour at Lisbon: twilight from the real Sun altitude, sodium skyglow low over the city."""
    sa = sun_alt(h)
    tw = smooth(span(sa, -18, -2))               # 1 = bright twilight
    a = np.clip(alt_map, -5, 90)
    t = clamp(a / 60) ** 0.5
    deep = np.array([0.004, 0.006, 0.016], np.float32)
    zen_tw = np.array([0.05, 0.10, 0.24], np.float32)
    hor_tw = np.array([0.55, 0.34, 0.20], np.float32)
    s = sun_world()
    e, n, up = local_frame(h)
    saz = np.degrees(np.arctan2(s @ e, s @ n))
    dz = np.abs(((az_map - saz) + 180) % 360 - 180)
    sunward = np.exp(-(dz / 70) ** 2)[..., None]
    img = deep + (zen_tw * t[..., None] + hor_tw * (1 - t[..., None]) * (0.35 + 0.65 * sunward)) * tw
    glow = np.exp(-np.clip(a, 0, None) / 9.0)[..., None] * SODIUM * 0.09 * haze
    return (img + glow).astype(np.float32), sa


def _apophis_on(img, cam, h, gain=1.0, streak=None):
    az, alt, mag = apophis_altaz(h)
    if alt < -1:
        return None
    d = altaz_dir(az, alt, h)
    x, y, z = cam.project(d * 1e6)
    if z <= 0:
        return None
    b = 10 ** (-0.4 * (mag - 2.8)) * 2.4 * gain
    if streak is not None:
        hs = np.linspace(streak[0], streak[1], 120)
        pts = []
        for hh in hs:
            a2, al2, _ = apophis_altaz(hh)
            if al2 > -1:
                px, py, pz = cam.project(altaz_dir(a2, al2, hh) * 1e6)
                if pz > 0:
                    pts.append((px, py))
        if len(pts) > 1:
            lay = np.zeros((H, W), np.float32)
            cv2.polylines(lay, [np.round(np.array(pts) * 16).astype(np.int32)], False, 1.0, 2, cv2.LINE_AA, 4)
            img += (lay + fast_blur(lay, 3) * 0.8)[..., None] * np.array([1.0, 0.9, 0.75], np.float32) * 0.9 * gain
    glow_dot(img, x, y, (1.0, 0.92, 0.80), 1.8, b * 1.8)
    glow_dot(img, x, y, (1.0, 0.85, 0.65), 7.0, b * 0.12)
    return x, y


def person(img, x, y, s, point=None, alpha=1.0, col=(0.02, 0.02, 0.025)):
    """A small silhouette on a terrace: head, body, legs; one arm pointing at `point` (screen xy)."""
    lay = np.zeros((H, W), np.float32)
    hd = 0.075 * s
    cv2.circle(lay, (int(x), int(y - s + hd)), int(hd), 1.0, -1, cv2.LINE_AA)
    body = np.array([[x - 0.11 * s, y - s + 2.3 * hd], [x + 0.11 * s, y - s + 2.3 * hd], [x + 0.09 * s, y - 0.45 * s], [x - 0.09 * s, y - 0.45 * s]], np.int32)
    cv2.fillPoly(lay, [body], 1.0, cv2.LINE_AA)
    cv2.line(lay, (int(x - 0.06 * s), int(y - 0.46 * s)), (int(x - 0.09 * s), int(y)), 1.0, max(2, int(0.07 * s)), cv2.LINE_AA)
    cv2.line(lay, (int(x + 0.06 * s), int(y - 0.46 * s)), (int(x + 0.09 * s), int(y)), 1.0, max(2, int(0.07 * s)), cv2.LINE_AA)
    sh = (x + 0.1 * s, y - s + 2.4 * hd)
    if point is not None:
        dx, dy = point[0] - sh[0], point[1] - sh[1]
        l = np.hypot(dx, dy) + 1e-6
        tip = (sh[0] + dx / l * 0.42 * s, sh[1] + dy / l * 0.42 * s)
    else:
        tip = (sh[0] + 0.05 * s, sh[1] + 0.35 * s)
    cv2.line(lay, (int(sh[0]), int(sh[1])), (int(tip[0]), int(tip[1])), 1.0, max(2, int(0.06 * s)), cv2.LINE_AA)
    cv2.line(lay, (int(x - 0.1 * s), int(sh[1])), (int(x - 0.14 * s), int(y - 0.5 * s)), 1.0, max(2, int(0.06 * s)), cv2.LINE_AA)
    m = lay[..., None] * alpha
    img[:] = img * (1 - m) + np.asarray(col, np.float32) * m
    return img


def fist(img, cx, cy, s, alpha=1.0):
    """A fist held out at arm's length, seen from behind: forearm rising from the lower right, four curled fingers
    with knuckles on top, the thumb wrapped across the front. s = the width of the fist in pixels (10 degrees)."""
    lay = np.zeros((H, W), np.float32)
    # forearm and wrist, in perspective (wider toward the viewer)
    arm = np.array([[cx - 0.30 * s, cy + 0.25 * s], [cx + 0.34 * s, cy + 0.22 * s], [cx + 0.95 * s, H + 40], [cx - 0.05 * s, H + 40]], np.int32)
    cv2.fillPoly(lay, [arm], 1.0, cv2.LINE_AA)
    # the back of the hand (a rounded block) and four knuckles along the top
    cv2.ellipse(lay, (int(cx), int(cy)), (int(0.5 * s), int(0.34 * s)), 0, 0, 360, 1.0, -1, cv2.LINE_AA)
    for k in range(4):
        cv2.circle(lay, (int(cx - 0.36 * s + k * 0.24 * s), int(cy - 0.28 * s)), int(0.13 * s), 1.0, -1, cv2.LINE_AA)
    # thumb across the front-left
    cv2.ellipse(lay, (int(cx - 0.42 * s), int(cy + 0.05 * s)), (int(0.17 * s), int(0.28 * s)), -25, 0, 360, 1.0, -1, cv2.LINE_AA)
    lay = cv2.GaussianBlur(lay, (0, 0), 1.0)
    creases = np.zeros((H, W), np.float32)
    for k in range(1, 4):
        x = cx - 0.36 * s + (k - 0.5) * 0.24 * s
        cv2.line(creases, (int(x), int(cy - 0.32 * s)), (int(x + 0.02 * s), int(cy - 0.05 * s)), 1.0, max(2, int(0.02 * s)), cv2.LINE_AA)
    rim = clamp(lay - cv2.erode(lay, np.ones((5, 5), np.uint8)))
    skin = np.array([0.055, 0.04, 0.035], np.float32)
    m = lay[..., None] * alpha
    img[:] = img * (1 - m) + skin * m
    img -= (creases * lay * alpha)[..., None] * 0.03
    img += (rim * alpha)[..., None] * SODIUM * 0.55
    return img


def _plane(img, cam, h, t, k=1.0):
    """An airliner far off: a steady white light with blinking red and green wing lights (it blinks; satellites don't)."""
    az = 200 + 14 * (h - 19.0) * 60 / 6
    alt = 18 + 2 * np.sin(h)
    x, y, z = cam.project(altaz_dir(az, alt, h) * 1e6)
    if z <= 0:
        return
    on = (t * 1.1) % 1.0 < 0.12
    glow_dot(img, x, y, (1.0, 1.0, 1.0), 1.8, 3.0 * k)
    if on:
        glow_dot(img, x - 14, y, (1.0, 0.15, 0.1), 3.0, 12.0 * k)
        glow_dot(img, x + 14, y, (0.2, 1.0, 0.3), 3.0, 9.0 * k)


@functools.lru_cache(None)
def _sat_track():
    """A satellite pass (an illustrative 550 km orbit) crossing from the south-west to the north-east."""
    return (215.0, 8.0), (40.0, 12.0)


def _sat_on(img, cam, h, prog, gain=1.0):
    (az0, al0), (az1, al1) = _sat_track()
    a0, a1 = altaz_dir(az0, al0, h), altaz_dir(az1, al1, h)
    # great circle through the zenith side
    mid = altaz_dir((az0 + az1) / 2 + 180, 70, h)
    p = prog
    q = (1 - p) ** 2 * a0 + 2 * p * (1 - p) * mid * 1.3 + p ** 2 * a1
    q /= np.linalg.norm(q)
    x, y, z = cam.project(q * 1e6)
    if z > 0:
        glow_dot(img, x, y, (0.95, 0.97, 1.0), 1.8, 6.0 * gain)
        glow_dot(img, x, y, (0.9, 0.95, 1.0), 7.0, 0.25 * gain)
    return x, y


@scene_factory(keys=["view"], vectors=("sat_path", "plane_at"))
def roof(view="town", az=(110.0, 112.0), alt=(18.0, 20.0), fov=(60.0, 58.0), h=(20.5, 20.55), sat=(0.0, 0.0), plane=0.0,
         apophis=1.0, streak=0.0, fistk=0.0, binoc=0.0, figure=0.0, figure_az=None, tlapse=1.0, light_glow=1.0, sn=(0.0, 0.0), figures=0,
         sat_path=None, plane_at=None, dipper=0.0, orion=0.0):
    """The sky over Lisbon at Universal Time h (hours on 13 April 2029). Rooftops in the lower frame, stars turning
    with the hour, Apophis where Horizons puts it. sat: progress of an ordinary satellite pass; streak: a one-minute
    exposure; fistk: a fist at arm's length; binoc: binocular view; figure: someone on a terrace pointing."""
    R_ = roofs()

    def f(ctx, t, u, fi):
        e = ease(u)
        hh = lerp(h[0], h[1], u)
        A, E, F = L2(az, e), L2(alt, e), L2(fov, e)
        d = altaz_dir(A, E, hh)
        _, _, up = local_frame(hh)
        cam = Camera((0.0, 0.0, 0.0), d, fov=F, up=up)
        ray = _rays(cam, 0, 0, W, H, 1)
        en, no, upv = local_frame(hh)
        azm = np.degrees(np.arctan2(ray @ en.astype(np.float32), ray @ no.astype(np.float32))) % 360
        altm = np.degrees(np.arcsin(np.clip(ray @ upv.astype(np.float32), -1, 1)))
        base, sa = _sky_ground(cam, azm, altm, hh, light_glow)
        stars = cam.sky(gain=1.0)
        ext = clamp((altm + 2) / 12) * (1 - 0.85 * smooth(span(sa, -16, -4)))      # extinction near the horizon and in twilight
        sk_ = L2(streak, e) if isinstance(streak, tuple) else streak      # how much of the minute has been exposed so far
        xk_ = 1.0 if (max(streak) if isinstance(streak, tuple) else streak) > 0 else 0.0
        img = base + stars * ext[..., None] * (0.9 if binoc <= 0 else 1.6) * (1 + 0.8 * xk_)
        if xk_ > 0:                                 # a minute-long exposure over a city soaks up the sodium skyglow: a brown-orange sky
            img += (np.array([0.085, 0.065, 0.05], np.float32) + SODIUM * 0.03 * clamp(1 - altm / 70)[..., None]) * xk_
        if binoc > 0:                                  # urban sky through binoculars: grey, not black
            img += np.array([0.03, 0.033, 0.045], np.float32) * binoc
        if L2(sat, e) > 0 or sat[1] > 0:
            sp = L2(sat, e)
            if 0 < sp < 1:
                if sat_path is not None:
                    (a0_, e0_), (a1_, e1_) = sat_path
                    for k_ in range(14, -1, -1):                       # the glide, with a faint persistence trail
                        q_ = max(0.0, sp - k_ * 0.006)
                        p_ = altaz_dir(lerp(a0_, a1_, q_), lerp(e0_, e1_, q_), hh)
                        sx_, sy_, sz_ = cam.project(p_ * 1e6)
                        if sz_ > 0:
                            glow_dot(img, sx_, sy_, (0.95, 0.97, 1.0), 1.8 if k_ == 0 else 1.2, 7.0 if k_ == 0 else 0.5 * (1 - k_ / 15))
                    ctx.state["sat_xy"] = (sx_, sy_)
                else:
                    _sat_on(img, cam, hh, sp)
        if plane > 0:
            gt_ = ctx.seg["start"] + ctx.beat.t0 + t
            if plane_at is not None:
                px_, py_, pz_ = cam.project(altaz_dir(plane_at[0] + 0.6 * u, plane_at[1], hh) * 1e6)
                glow_dot(img, px_, py_, (1.0, 1.0, 1.0), 2.0, 4.0)
                on_ = (gt_ * 1.6) % 1.0 < 0.5                      # strobes: on half the time, so every still catches some
                if on_:
                    glow_dot(img, px_ - 16, py_, (1.0, 0.15, 0.1), 3.5, 16.0)
                    glow_dot(img, px_ + 16, py_, (0.2, 1.0, 0.3), 3.5, 12.0)
                ctx.state["plane_xy"] = (px_, py_)
            else:
                _plane(img, cam, hh, gt_, plane)
        pa = None
        if apophis > 0:
            st = None
            if sk_ > 0:
                st = (hh - 1.0 / 60 * sk_, hh)
            pa = _apophis_on(img, cam, hh, apophis, st)
            if pa is not None:
                from engine import cards
                cards.mark("APOPHIS", pa[0], pa[1])
        for k_, (flag, stars_, lines_) in enumerate(((dipper, DIPPER, DIPPER_L), (orion, ORION, ORION_L))):
            if flag > 0:
                P_ = []
                for (ra_, de_, m_) in stars_:
                    v_ = np.array([np.cos(np.radians(de_)) * np.cos(np.radians(ra_)), np.cos(np.radians(de_)) * np.sin(np.radians(ra_)), np.sin(np.radians(de_))])
                    P_.append(cam.project(v_ * 1e6))
                lay_ = np.zeros((H, W), np.float32)
                for i_, j_ in lines_:
                    if P_[i_][2] > 0 and P_[j_][2] > 0:
                        cv2.line(lay_, (int(P_[i_][0] * 16), int(P_[i_][1] * 16)), (int(P_[j_][0] * 16), int(P_[j_][1] * 16)), 1.0, 2, cv2.LINE_AA, 4)
                img += lay_[..., None] * np.array([0.5, 0.6, 0.8], np.float32) * 0.35 * flag
                for (x_, y_, z_), (ra_, de_, m_) in zip(P_, stars_):
                    if z_ > 0:
                        b_ = 10 ** (-0.4 * (m_ - 2.0)) * 2.6
                        col_ = (1.0, 0.55, 0.35) if (k_ == 1 and abs(ra_ - 88.79) < 0.1) else (0.95, 0.95, 1.0)
                        glow_dot(img, x_, y_, col_, 1.9, b_ * 1.8)
        snk = L2(sn, e)
        if snk > 0:                                  # Betelgeuse (RA 5h55m10s, Dec +7.41) flaring up
            ra, de = np.radians(88.79), np.radians(7.407)
            bd = np.array([np.cos(de) * np.cos(ra), np.cos(de) * np.sin(ra), np.sin(de)])
            bx, by, bz = cam.project(bd * 1e6)
            if bz > 0:
                glow_dot(img, bx, by, (1.0, 0.85, 0.7), 1.5 + 3 * snk, 2.0 + 60 * snk ** 2)
                glow_dot(img, bx, by, (1.0, 0.8, 0.65), 20 + 120 * snk, 0.05 + 0.5 * snk ** 2)
                from engine.core import star_spikes
                star_spikes(img, bx, by, (1.0, 0.9, 0.8), 40 + 260 * snk, 0.4 * snk, angle=30)
                ctx.state["betel_xy"] = (bx, by)
                from engine import cards
                cards.mark("BETELGEUSE", bx, by)
        ctx.state["apophis_xy"] = pa
        ctx.state["h"] = hh
        # rooftops (sampled from the panorama by azimuth/altitude)
        mx = (azm * PPD).astype(np.float32)
        my = ((ALT_HI - altm) * PPD).astype(np.float32)
        inside = (altm < ALT_HI) & (altm > ALT_LO)
        if inside.any() and view == "country":
            hill = -1.2 + 1.6 * np.sin(np.radians(azm) * 3) + 0.8 * np.sin(np.radians(azm) * 7 + 1)
            a_ = clamp((hill - altm) * 3)[..., None]
            img = img * (1 - a_) + np.array([0.008, 0.008, 0.01], np.float32) * a_
        elif inside.any():
            smp = cv2.remap(R_, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
            smp[~inside] = 0
            smp[altm <= ALT_LO] = (1.0, 0.0, 0.0)
            a_ = smp[..., 0:1]
            roofcol = np.array([0.012, 0.010, 0.011], np.float32) + np.exp(-np.clip(altm, -14, 20) / 6)[..., None] * 0.0
            img = img * (1 - a_) + roofcol * a_
            img += smp[..., 1:2] * SODIUM * 1.6 + smp[..., 2:3] * SODIUM * 0.18 * light_glow
        for k in range(int(round(figures))):                     # several people on several terraces, all looking up
            faz = A - F * 0.42 + F * 0.84 * (k + 0.5) / max(1, int(round(figures)))
            fx, fy, fz = cam.project(altaz_dir(faz, -4.0 - (k % 2) * 1.5, hh) * 1e6)
            if fz > 0:
                person(img, fx, fy, (260 + 50 * (k % 3)) * 60 / F, point=None, alpha=1.0)
        if figure > 0:
            faz = figure_az if figure_az is not None else A - F * 0.25
            fx, fy, fz = cam.project(altaz_dir(faz, -3.5, hh) * 1e6)
            if fz > 0:
                person(img, fx, fy, 230 * 60 / F, point=pa, alpha=figure)
        if fistk > 0:
            fist(img, W * 0.5, H * 0.5 + cam.f * np.tan(np.radians(5)) * 0.75, cam.f * np.tan(np.radians(10)), fistk)
        if binoc > 0:
            xs, ys = grid()
            r1 = np.hypot(xs - W * 0.39, ys - H / 2)
            r2 = np.hypot(xs - W * 0.61, ys - H / 2)
            m = clamp((H * 0.46 - np.minimum(r1, r2)) / 14)
            img = img * (1 - binoc + binoc * m[..., None])
        return img, dict(exposure=1.55, bloom=0.4, grade=((0.006, 0.006, 0.012), (1.0, 0.98, 0.95)))
    return f
