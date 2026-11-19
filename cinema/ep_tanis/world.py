"""Episode 4 v2 scene library: every narration line gets a picture that SHOWS it (founder notes on v1).

  globe        the real Earth (Natural Earth coastlines, US states), from a whole planet down to a map of North
               America: where the river is, where the asteroid hits, the glass arcs, the sound crossing the map
  earth_cut    the planet cut open along the line Chicxulub - Tanis: crust, mantle, liquid outer core, inner core,
               with seismic wavefronts computed by solving the eikonal equation in the model's velocity structure
  fish_scene   a Cretaceous river seen side-on underwater; a young paddlefish (the hero) drawn from its anatomy,
               always swimming head first
  gills        inside the open mouth: the gill rakers that sieve food, and then glass
  cutaway      the river channel cut open like an aquarium: slosh, surge, fish thrown out, mud and glass burying them
  storm        today: a storm seen through a window; lightning, then the count, then the thunder
  water        the river surface as the first glass beads hit it, like the first drops of rain
  droplet      molten rock flying through space, cooling into a glass bead, burning back in
  fossil       the slab: fish lying the way the water left them, glass in their gills
  spring_wave  why the ground jolts and then shakes: a squeezed spring (push-pull) and a shaken rope (side to side)
All scenes return a linear float image and post-processing settings, like cine.py.
"""
import os, json, functools
import numpy as np, cv2
from engine.beats import scene_factory
from engine.core import W, H, clamp, lerp, grid, fbm, blur, fast_blur, splat_points
from ep_tanis.cine import ease, rng_at, put_text, _log, PEACH, INK, GLASS
from ep_tanis import model as M

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO = os.path.join(ROOT, "assets", "geo")
CHX = (21.4, -89.5)          # Chicxulub crater centre (lat, lon)
TANIS = (46.15, -103.4)      # Tanis site, Bowman County, North Dakota
TEAL = (0.45, 0.95, 0.90)
EMB = (1.0, 0.55, 0.22)


# ======================================================================================================== geography
def _topo(name):
    d = json.load(open(os.path.join(GEO, name)))
    sc, tr = d["transform"]["scale"], d["transform"]["translate"]
    arcs = []
    for a in d["arcs"]:
        a = np.cumsum(np.array(a, np.float64), 0)
        arcs.append(np.stack([a[:, 0] * sc[0] + tr[0], a[:, 1] * sc[1] + tr[1]], 1))
    return d, arcs


def _ring(arcs, idx):
    pts = []
    for i in idx:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.append(a if not pts else a[1:])
    return np.concatenate(pts)


@functools.lru_cache(1)
def _land():
    d, arcs = _topo("land-50m.json")
    rings = []
    for g in d["objects"]["land"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        for poly in polys:
            for k, r in enumerate(poly):
                rg = _ring(arcs, r)
                if len(rg) < 4:
                    continue
                c = _xyz(rg[:, 1], rg[:, 0]).mean(0)
                rings.append((rg, k > 0, c / (np.linalg.norm(c) + 1e-9), float(np.ptp(rg[:, 0]) + np.ptp(rg[:, 1]))))
    return rings


@functools.lru_cache(1)
def _states():
    d, arcs = _topo("states-10m.json")
    out = {}
    for g in d["objects"]["states"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        out[g["properties"]["name"]] = [_ring(arcs, poly[0]) for poly in polys]
    return out


@functools.lru_cache(1)
def _borders():
    """Country borders (land only) and US state borders as polylines."""
    d, arcs = _topo("countries-50m.json")
    lines = []
    for g in d["objects"]["countries"]["geometries"]:
        if g["properties"].get("name") in ("United States of America", "Mexico", "Canada", "Guatemala", "Belize", "Cuba"):
            polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
            for poly in polys:
                lines.append(_ring(arcs, poly[0]))
    st = [r for rs in _states().values() for r in rs]
    return lines, st


def _xyz(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)


class View:
    """Orthographic camera looking at (lat0, lon0) with the globe radius R px, centred at (cx, cy) on screen."""

    def __init__(self, lat0, lon0, R, cx=W / 2, cy=H / 2):
        self.R, self.cx, self.cy = R, cx, cy
        la, lo = np.radians(lat0), np.radians(lon0)
        f = np.array([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)])   # towards the camera
        e = np.array([-np.sin(lo), np.cos(lo), 0.0])                                      # east
        n = np.cross(f, e)                                                                 # north
        self.f, self.e, self.n = f, e, n

    def proj(self, lat, lon, alt=0.0):
        p = _xyz(np.asarray(lat, float), np.asarray(lon, float)) * (1 + np.asarray(alt, float) / M.R_E)[..., None] if np.ndim(alt) else \
            _xyz(np.asarray(lat, float), np.asarray(lon, float)) * (1 + alt / M.R_E)
        x = self.cx + self.R * (p @ self.e)
        y = self.cy - self.R * (p @ self.n)
        z = p @ self.f
        return x, y, z

    def inverse(self, xs, ys):
        X = (xs - self.cx) / self.R
        Y = -(ys - self.cy) / self.R
        rr = X * X + Y * Y
        inside = rr < 1
        Z = np.sqrt(np.clip(1 - rr, 0, 1))
        p = X[..., None] * self.e + Y[..., None] * self.n + Z[..., None] * self.f
        lat = np.degrees(np.arcsin(np.clip(p[..., 2], -1, 1)))
        lon = np.degrees(np.arctan2(p[..., 1], p[..., 0]))
        return lat, lon, inside, Z, p


def _poly_px(view, ring, ss=2):
    x, y, z = view.proj(ring[:, 1], ring[:, 0])
    if (z < 0).all():
        return None
    back = z < 0
    if back.any():                                     # push hidden points to the horizon (fine for filling)
        dx, dy = x - view.cx, y - view.cy
        r = np.hypot(dx, dy) + 1e-9
        x = np.where(back, view.cx + dx / r * view.R, x)
        y = np.where(back, view.cy + dy / r * view.R, y)
    return (np.stack([x, y], 1) * ss * 16).astype(np.int32)    # 4 fractional bits (shift=4)


def great_circle(a, b, n=120):
    pa, pb = _xyz(*a), _xyz(*b)
    om = np.arccos(np.clip(pa @ pb, -1, 1))
    t = np.linspace(0, 1, n)[:, None]
    p = (np.sin((1 - t) * om) * pa + np.sin(t * om) * pb) / np.sin(om)
    return np.degrees(np.arcsin(p[:, 2])), np.degrees(np.arctan2(p[:, 1], p[:, 0])), t[:, 0]


def small_circle(c, ang_deg, n=240):
    """Points at angular distance ang_deg from c (a ring spreading over the sphere)."""
    pc = _xyz(*c)
    e = np.cross([0, 0, 1.0], pc)
    e /= np.linalg.norm(e)
    nn = np.cross(pc, e)
    a = np.radians(ang_deg)
    th = np.linspace(0, 2 * np.pi, n)
    p = np.cos(a) * pc + np.sin(a) * (np.cos(th)[:, None] * e + np.sin(th)[:, None] * nn)
    return np.degrees(np.arcsin(p[:, 2])), np.degrees(np.arctan2(p[:, 1], p[:, 0]))


@functools.lru_cache(1)
def _stars():
    r = rng_at(77)
    n = 1400
    return r.uniform(0, W, n), r.uniform(0, H, n), r.uniform(0.05, 1, n) ** 3


def _cloud_eq():
    return cv2.resize(fbm(512, 256, scale=5, octaves=6, seed=301), (2048, 1024))


@functools.lru_cache(1)
def _globe_tex():
    """Equirectangular textures at native lat/lon (no tiling, so no seams): land relief, two cloud layers."""
    det = cv2.resize(fbm(1024, 512, scale=24, octaves=6, seed=305), (4096, 2048)).astype(np.float32)
    big = cv2.resize(fbm(512, 256, scale=6, octaves=5, seed=306), (4096, 2048)).astype(np.float32)
    c1 = cv2.resize(fbm(512, 256, scale=4, octaves=6, seed=307), (4096, 2048)).astype(np.float32)
    c1 = cv2.GaussianBlur(c1, (0, 0), 3.0)
    streak = cv2.resize(fbm(256, 1024, scale=8, octaves=4, seed=308), (4096, 2048)).astype(np.float32)   # zonal wisps
    return det, big, c1, streak


_CLOUD = None


def globe_base(view, t, sun=(0.35, -0.8, 0.5), clouds=0.35, borders=0.0, night=0.0, dark=0.0, haze=0.0, style="day"):
    """Lit Earth: ocean, land (vector coastlines), clouds, atmosphere rim, stars behind."""
    global _CLOUD
    xs, ys = grid()
    lat, lon, inside, Z, p = view.inverse(xs, ys)
    img = np.zeros((H, W, 3), np.float32)
    sx, sy, sb = _stars()
    img = splat_points(img, sx, sy, np.repeat(sb[:, None], 3, 1).astype(np.float32) * 0.6, sigma=0.6)
    # land mask, rasterised from the polygons at 2x, then box-filtered (crisp, anti-aliased coastlines at any zoom)
    ss = 2
    m = np.zeros((H * ss, W * ss), np.uint8)
    holes = []
    for ring, hole, cen, ext in _land():
        if cen @ view.f < -0.35 and ext < 60:              # well behind the planet
            continue
        if ext * view.R / 57.3 < 1.5:                       # smaller than a pixel or two
            continue
        q = _poly_px(view, ring, ss)
        if q is None:
            continue
        (holes if hole else [None]).append(q) if hole else cv2.fillPoly(m, [q], 255, cv2.LINE_AA, shift=4)
    for q in holes:
        cv2.fillPoly(m, [q], 0, cv2.LINE_AA, shift=4)
    land = cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0 * inside
    # colours: deep ocean with shelf tint; land by latitude (tundra / forest / desert) with relief noise
    det_t, big_t, c1_t, st_t = _globe_tex()
    u_ = ((lon + 180) / 360 * 4096).astype(np.float32) % 4096
    v_ = np.clip((90 - lat) / 180 * 2048, 0, 2047).astype(np.float32)
    S_ = lambda tex, du=0.0: cv2.remap(tex, (u_ + du) % 4096, v_, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    kp = clamp((np.abs(lat) - 68) / 12)                          # textures pinch at the poles: fade them out
    nz = S_(big_t) * (1 - kp) + 0.5 * kp
    al = np.abs(lat)
    # dryness: the subtropics and the lee of the western mountains are dry (a schematic biome map, not data)
    dry_f = clamp(1 - np.abs(al - 26) / 10) + clamp((-100 - lon) / 12) * clamp(1 - np.abs(lat - 38) / 12) * (lon < -95)
    dry_f = clamp(dry_f * 0.9 + (nz - 0.5) * 0.5)
    det = S_(det_t) * (1 - kp) + 0.5 * kp                                                # fine relief
    forest = np.array([0.055, 0.085, 0.045], np.float32)
    plains = np.array([0.16, 0.15, 0.085], np.float32)
    desert = np.array([0.33, 0.26, 0.16], np.float32)
    cold = np.array([0.42, 0.44, 0.42], np.float32)
    k1 = clamp(dry_f * 2)[..., None]
    k2 = clamp(dry_f * 2 - 1)[..., None]
    lc = forest * (1 - k1) + plains * k1
    lc = lc * (1 - k2) + desert * k2
    kc = clamp((al - 60) / 8)[..., None]
    lc = lc * (1 - kc) + cold * kc
    lc = lc * (0.85 + 0.3 * det[..., None])
    oc = np.array([0.010, 0.035, 0.075], np.float32) * (0.9 + 0.15 * nz[..., None])
    if style == "map":                                                 # quieter: a stage for markers
        lc = lc * 0.85 + 0.035
        oc = oc * 0.8 + 0.006
    coast = clamp(fast_blur(land, 5) * 3) * (1 - land)                 # shallow shelves near coasts
    oc = oc + coast[..., None] * np.array([0.015, 0.05, 0.06], np.float32)
    surf = oc * (1 - land[..., None]) + lc * land[..., None]
    # lighting
    sv = np.array(sun, np.float32)
    sv /= np.linalg.norm(sv)
    ndl = p @ sv
    lit = clamp(ndl * 1.2 + 0.08)
    spec = (1 - land) * clamp(ndl) ** 60 * 0.05
    if style == "map":
        lit, spec = 0.75 + 0.25 * lit, spec * 0
    if clouds > 0:
        cl = S_(c1_t, t * 1.2) * (1 - kp) + 0.4 * kp
        cl2 = S_(st_t, t * 0.8) * (1 - kp) + 0.4 * kp
        cl = clamp((cl * 0.85 + cl2 * 0.15 - 0.55) * 2.2) ** 1.6 * clouds
        surf = surf * (1 - cl[..., None]) + np.float32(0.75) * cl[..., None]
    col = surf * lit[..., None] + spec[..., None] * np.array([0.9, 0.85, 0.7], np.float32)
    if night > 0:
        col = col + (1 - lit[..., None]) * land[..., None] * night * 0.0
    if haze > 0:                                                         # soot veil after the impact
        col = col * (1 - 0.8 * haze) + haze * 0.05 * np.array([0.6, 0.5, 0.4], np.float32)
    col = col * (1 - dark)
    img = np.where(inside[..., None], col, img)
    # atmosphere: thin bright rim, blue, lit side brighter
    rr = np.hypot(xs - view.cx, ys - view.cy) / view.R
    rim = np.exp(-((rr - 1.0) / 0.012) ** 2) * 0.9 + np.exp(-np.clip(rr - 1, 0, None) / 0.03) * (rr >= 1) * 0.5
    li = clamp(((xs - view.cx) * sv[0] - (ys - view.cy) * sv[1]) / view.R * 0.8 + 0.6)
    img = img + (rim * li)[..., None] * np.array([0.25, 0.5, 1.0], np.float32) * 0.35 * (1 - dark)
    if borders > 0:
        img = draw_lines(img, view, _borders()[1], (0.75, 0.78, 0.72), borders * 0.35, 1)
        img = draw_lines(img, view, _borders()[0], (0.85, 0.85, 0.8), borders * 0.55, 1)
    return img, land, (lat, lon, inside)


def draw_lines(img, view, rings, color, alpha, width=1, ss=2):
    lay = np.zeros((H * ss, W * ss), np.uint8)
    for ring in rings:
        x, y, z = view.proj(ring[:, 1], ring[:, 0])
        ok = z > 0.02
        if ok.sum() < 2:
            continue
        pts = (np.stack([x, y], 1) * ss * 16).astype(np.int32)
        # split at hidden points
        run = []
        for q, o in zip(pts, ok):
            if o:
                run.append(q)
            elif len(run) > 1:
                cv2.polylines(lay, [np.array(run)], False, 255, width * ss, cv2.LINE_AA, shift=4)
                run = []
            else:
                run = []
        if len(run) > 1:
            cv2.polylines(lay, [np.array(run)], False, 255, width * ss, cv2.LINE_AA, shift=4)
    a = cv2.resize(lay, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0 * alpha
    return img * (1 - a[..., None]) + a[..., None] * np.array(color, np.float32)


def fill_state(img, view, name, color, alpha):
    m = np.zeros((H * 2, W * 2), np.uint8)
    for ring in _states()[name]:
        q = _poly_px(view, ring, 2)
        if q is not None:
            cv2.fillPoly(m, [q], 255, cv2.LINE_AA, shift=4)
    a = cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0 * alpha
    return img * (1 - a[..., None] * 0.6) + a[..., None] * np.array(color, np.float32) * 0.6


def glow_line(img, pts, color, width=2.0, glow=6.0, alpha=1.0):
    lay = np.zeros((H, W), np.float32)
    if len(pts) > 1:
        cv2.polylines(lay, [(np.asarray(pts) * 16).astype(np.int32)], False, 1.0, max(1, int(width)), cv2.LINE_AA, shift=4)
    g = lay + fast_blur(lay, glow) * 1.5
    return img + (g * alpha)[..., None] * np.array(color, np.float32)


def _win(x, y, rad):
    x0, x1 = int(max(0, x - rad)), int(min(W, x + rad + 1))
    y0, y1 = int(max(0, y - rad)), int(min(H, y + rad + 1))
    return x0, x1, y0, y1


def glow_dot(img, x, y, r, color, alpha=1.0):
    rad = r * 10 + 30
    x0, x1, y0, y1 = _win(x, y, rad)
    if x1 <= x0 or y1 <= y0:
        return img
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = np.hypot(xx - x, yy - y)
    a = clamp(1 - (d - r) / 1.5) + np.exp(-(d / (r * 4 + 6)) ** 2) * 0.6
    img[y0:y1, x0:x1] += (a * alpha)[..., None] * np.array(color, np.float32)
    return img


def ring_px(img, x, y, r, color, width=2.0, alpha=1.0, glow=4.0):
    rad = r + glow * 6 + 4
    x0, x1, y0, y1 = _win(x, y, rad)
    if x1 <= x0 or y1 <= y0:
        return img
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d = np.abs(np.hypot(xx - x, yy - y) - r)
    a = clamp(1 - d / width) + np.exp(-(d / (glow * 2)) ** 2) * 0.35
    img[y0:y1, x0:x1] += (a * alpha)[..., None] * np.array(color, np.float32)
    return img


class Lines:
    """Accumulate many glowing polylines, blur once."""
    def __init__(self):
        self.core = np.zeros((H, W, 3), np.float32)

    def add(self, pts, color, width=1.5, alpha=1.0):
        if len(pts) < 2:
            return
        lay = np.zeros((H, W), np.float32)
        cv2.polylines(lay, [(np.asarray(pts) * 16).astype(np.int32)], False, 1.0, max(1, int(round(width))), cv2.LINE_AA, shift=4)
        self.core += (lay * alpha)[..., None] * np.array(color, np.float32)

    def add_sph(self, view, lat, lon, color, width=1.5, alpha=1.0, alt=0.0):
        x, y, z = view.proj(lat, lon, alt)
        ok = z > -0.0
        if np.ndim(alt):
            # a point above the limb is visible even if z<0, as long as it is outside the disc
            ok = ok | (np.hypot(x - view.cx, y - view.cy) > view.R)
        pts = np.stack([x, y], 1)[ok]
        self.add(pts, color, width, alpha)

    def draw(self, img, glow=6.0):
        return img + self.core + fast_blur(self.core, glow) * 1.6


def _sph_poly(img, view, lat, lon, color, width=2.0, alpha=1.0, glow=5.0, alt=0.0):
    x, y, z = view.proj(lat, lon, alt)
    ok = z > 0
    pts = np.stack([x, y], 1)[ok]
    return glow_line(img, pts, color, width, glow, alpha) if len(pts) > 1 else img


# ---------------------------------------------------------------------------------------------------- globe scene
@scene_factory(keys=[])
def globe(lat=(30.0, 30.0), lon=(-95.0, -95.0), R=(520.0, 520.0), cy=H / 2, clouds=0.3, borders=(0.0, 0.0),
          tanis=(0.0, 0.0), chx=(0.0, 0.0), link=(0.0, 0.0), rock=(0.0, 0.0), impact=(0.0, 0.0), flash=(0.0, 0.0),
          arcs=(0.0, 0.0), sound=(0.0, 0.0), states=(), seis=(0.0, 0.0), haze=(0.0, 0.0), sun=(0.35, -0.8, 0.5),
          apophis=(0.0, 0.0), geo_ring=0.0, style="day", compare=(0.0, 0.0), iss=0.0, crater=(0.0, 0.0), soot=(0.0, 0.0), cool=(0.0, 0.0)):
    """The real planet. tanis/chx: markers fade in; link: the 3,050 km line draws; rock: the asteroid falling in
    (0..1 = far .. contact); impact: crater glow; flash: whole-screen flash; arcs: glass fly out on Kepler arcs and
    come down (0..1 of the flight); sound: minutes after impact, the sound ring spreading; seis: minutes, surface
    wave ring; states: [(name, alpha)] highlighted; haze: soot veil; apophis: 0..1 of the 2029 flyby pass."""
    def f(ctx, t, u, fi):
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        v = View(L(lat), L(lon), L(R), W / 2, cy)
        img, land, _ = globe_base(v, t, sun=sun, clouds=clouds, borders=L(borders), haze=L(haze), style=style)
        LN = Lines()
        for name, a in states:
            img = fill_state(img, v, name, (0.9, 0.75, 0.45), a)
        so = L(soot)
        if so > 0:                                      # a dark soot veil spreading out from the crater over the globe
            xs, ys = grid()
            la_, lo_, ins_, _, pv = v.inverse(xs, ys)
            dang = np.degrees(np.arccos(np.clip(pv @ _xyz(*CHX), -1, 1)))
            nzs = cv2.resize(fbm(240, 135, scale=5, octaves=4, seed=341), (W, H))
            cover = clamp((so * 180 - dang) / 25.0 + (nzs - 0.5) * 0.8) * ins_
            img = img * (1 - 0.72 * cover[..., None]) + cover[..., None] * np.array([0.06, 0.05, 0.04], np.float32)
        # the seismic surface wave (a ring on the ground moving at 3.9 km/s)
        sm = L(seis)
        if sm > 0:
            ang = np.degrees(sm * 60 * M.RAYLEIGH_U / M.R_E)
            la_, lo_ = small_circle(CHX, ang)
            LN.add_sph(v, la_, lo_, (1.0, 0.75, 0.4), 2.5, 0.9)
        # the sound: a slow ring at 335 m/s
        sn = L(sound)
        if sn > 0:
            ang = np.degrees(sn * 60 * M.C_SOUND / M.R_E)
            la_, lo_ = small_circle(CHX, ang)
            LN.add_sph(v, la_, lo_, (0.75, 0.9, 1.0), 3.0, 1.0)
            x0, y0, _ = v.proj(*CHX)
            # faint filled disc behind the front: "the sound has passed here"
            xs, ys = grid()
            xr, yr, zr = v.proj(la_, lo_)
            rr = np.hypot(xr - x0, yr - y0).mean()
            img = img + (np.hypot(xs - x0, ys - y0) < rr)[..., None] * np.float32(0.025)
        # glass: droplets on ballistic arcs from Chicxulub, fanning out, the Tanis-bound bundle highlighted
        ar = L(arcs)
        if ar > 0:
            r = rng_at(31)
            for k in range(46):
                bear = r.uniform(0, 360) if k > 5 else r.uniform(-12, 12) + _bearing(CHX, TANIS)
                el = r.uniform(30, 60)
                rng_deg = np.degrees(M.DIST_KM / M.R_E) * r.uniform(0.6, 1.6) if k > 5 else np.degrees(M.DIST_KM / M.R_E)
                tgt = _dest(CHX, bear, rng_deg)
                la_, lo_, tt = great_circle(CHX, tgt, 90)
                apex = M.ballistic(el)["apex_km"] * (rng_deg / np.degrees(M.DIST_KM / M.R_E)) ** 0.8
                alt = apex * 4 * tt * (1 - tt)
                upto = int(np.clip(ar * 1.2 - k * 0.004, 0, 1) * 89)
                if upto < 2:
                    continue
                cq = L(cool)
                col = tuple(np.array((1.0, 0.62, 0.3) if k > 5 else (1.0, 0.85, 0.55)) * (1 - cq) + np.array((0.35, 0.9, 0.6)) * cq)
                LN.add_sph(v, la_[:upto], lo_[:upto], col, 1.0 if k > 5 else 1.6, 0.35 if k > 5 else 0.9, alt=alt[:upto])
                x, y, z = v.proj(la_[upto], lo_[upto], alt[upto])
                if z > 0:
                    img = glow_dot(img, x, y, 2.0 + 2.0 * L(cool), tuple(np.array((1.0, 0.8, 0.5)) * (1 - L(cool)) + np.array((0.4, 1.0, 0.65)) * L(cool)), 0.9)
        # markers
        a_t, a_c = L(tanis), L(chx)
        if a_t > 0:
            x, y, z = v.proj(*TANIS)
            if z > 0:
                pulse = (t * 0.6) % 1
                img = glow_dot(img, x, y, 5, TEAL, a_t)
                img = ring_px(img, x, y, 8 + 40 * pulse, TEAL, 1.5, a_t * (1 - pulse) * 0.8)
        if a_c > 0:
            x, y, z = v.proj(*CHX)
            if z > 0:
                img = ring_px(img, x, y, max(6.0, v.R * 90 / M.R_E), EMB, 2.0, a_c)
        lk = L(link)
        if lk > 0:
            la_, lo_, _ = great_circle(CHX, TANIS, 120)
            n = max(2, int(lk * 119))
            LN.add_sph(v, la_[:n], lo_[:n], (0.95, 0.95, 0.9), 2.0, 0.85)
        # the asteroid coming in from the north-east at ~60 degrees (Collins et al. 2020)
        rk = L(rock)
        if 0 < rk < 1:
            x0, y0, _ = v.proj(*CHX)
            d = (1 - rk) ** 1.6
            x, y = x0 + 900 * d, y0 - 700 * d
            img = glow_line(img, [(x + 260 * (0.4 + d), y - 200 * (0.4 + d)), (x, y)], (1.0, 0.7, 0.4), 3, 10, 0.8)
            img = glow_dot(img, x, y, 4 + 3 * rk, (1.0, 0.92, 0.75), 1.0)
        cp = L(compare)
        if cp > 0:                                      # New York - Denver, for scale
            la_, lo_, _ = great_circle((40.71, -74.0), (39.74, -104.99), 80)
            n = max(2, int(cp * 79))
            LN.add_sph(v, la_[:n], lo_[:n], (1.0, 0.85, 0.35), 2.0, 0.9)
        if iss > 0:                                     # the space station's height (~420 km), as a thin shell
            LN.add([(v.cx + v.R * (1 + 420 / M.R_E) * np.cos(a), v.cy + v.R * (1 + 420 / M.R_E) * np.sin(a)) for a in np.linspace(np.pi * 1.05, np.pi * 1.95, 200)],
                   (0.6, 0.85, 1.0), 1.5, iss)
        img = LN.draw(img, 5.0)
        if cp > 0:
            for pnt in ((40.71, -74.0), (39.74, -104.99)):
                x, y, z = v.proj(*pnt)
                if z > 0:
                    img = glow_dot(img, x, y, 3, (1.0, 0.85, 0.35), cp)
        cr = L(crater)
        if cr > 0:                                          # the crater: 180 km ring of molten rock, ejecta blanket
            x0, y0, _ = v.proj(*CHX)
            rc = v.R * 90.0 / M.R_E
            img = ring_px(img, x0, y0, rc * 2.2, (0.35, 0.22, 0.15), rc * 0.9, 0.5 * cr, rc * 0.5)
            img = ring_px(img, x0, y0, rc, (1.0, 0.55, 0.2), max(2.0, rc * 0.12), 1.4 * cr, rc * 0.15)
            img = glow_dot(img, x0, y0, rc * 0.6, (1.0, 0.45, 0.15), 0.8 * cr)
        im = L(impact)
        if im > 0:
            x0, y0, _ = v.proj(*CHX)
            img = glow_dot(img, x0, y0, 6 + 30 * im, (1.0, 0.7, 0.35), 1.2 * im)
        fl = L(flash)
        if fl > 0:
            img = img + fl * 1.2
        ap = L(apophis)
        if geo_ring > 0 or ap > 0:
            img = _apophis(img, v, ap, geo_ring, t)
        ctx.state["pts"] = dict(tanis=v.proj(*TANIS)[:2], chx=v.proj(*CHX)[:2], ny=v.proj(40.71, -74.0)[:2], denver=v.proj(39.74, -104.99)[:2],
                                texas=v.proj(31.0, -99.5)[:2], nebraska=v.proj(41.5, -99.8)[:2])
        return img, dict(exposure=1.25, bloom=0.5, grain=0.012)
    return f


def _bearing(a, b):
    la1, lo1, la2, lo2 = map(np.radians, (*a, *b))
    y = np.sin(lo2 - lo1) * np.cos(la2)
    x = np.cos(la1) * np.sin(la2) - np.sin(la1) * np.cos(la2) * np.cos(lo2 - lo1)
    return np.degrees(np.arctan2(y, x))


def _dest(a, bearing, dist_deg):
    la1, lo1, br, d = map(np.radians, (*a, bearing, dist_deg))
    la2 = np.arcsin(np.sin(la1) * np.cos(d) + np.cos(la1) * np.sin(d) * np.cos(br))
    lo2 = lo1 + np.arctan2(np.sin(br) * np.sin(d) * np.cos(la1), np.cos(d) - np.sin(la1) * np.sin(la2))
    return np.degrees(la2), np.degrees(lo2)


def _apophis(img, v, ap, ring, t):
    """Geostationary ring (35,786 km up) as a dotted ellipse; Apophis passing inside it (31,600 km)."""
    geo = v.R * (M.R_E + 35786) / M.R_E
    lay = np.zeros((H, W), np.float32)
    tilt = 0.22
    for k in range(90):
        a = k / 90 * 2 * np.pi
        x = v.cx + geo * np.cos(a)
        y = v.cy + geo * tilt * np.sin(a)
        if np.sin(a) < 0 and abs(np.cos(a)) * geo < v.R:   # behind the planet
            continue
        if k % 3 == 0:
            cv2.rectangle(lay, (int(x - 2), int(y - 2)), (int(x + 2), int(y + 2)), 1.0, -1, cv2.LINE_AA)
            cv2.line(lay, (int(x - 9), int(y)), (int(x - 3), int(y)), 0.8, 2, cv2.LINE_AA)
            cv2.line(lay, (int(x + 3), int(y)), (int(x + 9), int(y)), 0.8, 2, cv2.LINE_AA)
    img = img + (lay + fast_blur(lay, 3))[..., None] * ring * np.array([0.55, 0.8, 1.0], np.float32) * 1.4
    if ap > 0:                                            # passes inside the ring, in front of the planet's limb
        x0 = v.cx - geo * 1.1 + ap * geo * 2.2
        y0 = v.cy - v.R * 1.6 + (x0 - v.cx) * 0.12
        for k_ in range(14):
            a0, a1 = k_ / 14, (k_ + 0.5) / 14
            img = glow_line(img, [(x0 - 900 * a0, y0 - 108 * a0), (x0 - 900 * a1, y0 - 108 * a1)], (1.0, 0.75, 0.45), 2, 6, 0.7 * (1 - a0))
        img = glow_dot(img, x0, y0, 7, (1.0, 0.88, 0.7), 1.3)
    return img


# ======================================================================================================= earth_cut
R_IC, R_OC, R_LM, R_UM = 1221.0, 3480.0, 5701.0, 6336.0
TH_MID = 90.0                                        # the section is drawn with the midpoint of the path at the top
TH_C = TH_MID + np.degrees(M.DELTA) / 2              # Chicxulub (left)
TH_T = TH_MID - np.degrees(M.DELTA) / 2              # Tanis (right)


def _vel(r, wave):
    d = M.R_E - r
    if r >= R_OC:
        return M._v(min(d, 2889.0), wave)
    if r >= R_IC:                                    # liquid outer core: P slows, S cannot exist
        return 8.0 + 2.3 * (R_OC - r) / (R_OC - R_IC) if wave == "P" else 0.0
    return 11.1 if wave == "P" else 3.6


@functools.lru_cache(4)
def travel_times(wave, n=1001):
    """First-arrival times (s) over the section, by fast marching (scikit-fmm) from the impact point."""
    import skfmm
    ext = 6500.0
    ax = np.linspace(-ext, ext, n)
    X, Y = np.meshgrid(ax, ax)
    r = np.hypot(X, Y)
    vr = np.array([_vel(x, wave) for x in np.linspace(0, M.R_E, 2000)])
    v = np.interp(np.clip(r, 0, M.R_E), np.linspace(0, M.R_E, 2000), vr)
    sx, sy = M.R_E * np.cos(np.radians(TH_C)), M.R_E * np.sin(np.radians(TH_C))
    phi = np.hypot(X - sx, Y - sy) - 40.0
    mask = (r > M.R_E) | (v <= 0.01)
    phi = np.ma.MaskedArray(phi, mask)
    T = skfmm.travel_time(phi, np.where(mask, 1.0, v), dx=float(ax[1] - ax[0]))
    T = np.ma.filled(T, np.inf)
    a = np.radians(TH_T)                                # calibrate to the ray-traced arrival (grid error ~2 %)
    i = int(round((M.R_E * 0.997 * np.sin(a) + ext) / (2 * ext) * (n - 1)))
    j = int(round((M.R_E * 0.997 * np.cos(a) + ext) / (2 * ext) * (n - 1)))
    T = T * (M.seismic_minutes(wave) * 60.0 / T[i, j])
    return T.astype(np.float32), ext


@functools.lru_cache(1)
def _polar_tex():
    """Textures in (angle, radius) space: mantle convection cells, the swirling outer core, crustal grain."""
    conv = cv2.resize(fbm(1024, 48, scale=5, octaves=5, seed=401), (1024, 256))        # radial plumes
    w2 = cv2.resize(fbm(512, 128, scale=4, octaves=3, seed=404), (1024, 256))
    conv = cv2.remap(conv.astype(np.float32), (np.arange(1024)[None, :] + 40 * (w2 - 0.5)).astype(np.float32) % 1024,
                     np.repeat(np.arange(256)[:, None], 1024, 1).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    core = cv2.resize(fbm(256, 128, scale=5, octaves=4, seed=402), (1024, 128))         # swirling along the flow
    grain = fbm(2048, 64, scale=40, octaves=3, seed=403)
    return conv.astype(np.float32), core.astype(np.float32), grain.astype(np.float32)


def _layer_colour(r, th, t, conv, core, grain):
    """r (km), th (deg) arrays -> RGB of the planet's interior, glowing hotter with depth."""
    def samp(tex, rr0, rr1, speed):
        hh, ww = tex.shape
        u_ = (((th + t * speed) % 360) / 360 * ww).astype(np.float32)
        v_ = (np.clip((r - rr0) / (rr1 - rr0), 0, 0.999) * hh).astype(np.float32)
        return cv2.remap(tex, u_, v_, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    out = np.zeros(r.shape + (3,), np.float32)
    m_ic, m_oc = r < R_IC, (r >= R_IC) & (r < R_OC)
    m_lm, m_um, m_cr = (r >= R_OC) & (r < R_LM), (r >= R_LM) & (r < R_UM), (r >= R_UM) & (r <= M.R_E)
    cv = samp(conv, R_OC, R_UM, 0.15)
    co = samp(core, R_IC, R_OC, 1.2)
    gr = samp(grain, R_UM, M.R_E, 0.0)
    depth = clamp((M.R_E - r) / (M.R_E - R_OC))
    ic = np.array([0.95, 0.78, 0.45], np.float32) * (0.9 + 0.1 * np.cos(r / 300.0))[..., None]
    oc = np.array([0.80, 0.33, 0.07], np.float32)[None, None] * (0.7 + 0.6 * co[..., None])
    lm = (np.array([0.26, 0.05, 0.02], np.float32) * (1 - depth[..., None]) + np.array([0.62, 0.17, 0.04], np.float32) * depth[..., None]) \
        * (0.55 + 0.9 * cv[..., None] ** 1.5)
    um = np.array([0.20, 0.07, 0.035], np.float32) * (0.7 + 0.6 * cv[..., None])
    cr = np.array([0.16, 0.12, 0.09], np.float32) * (0.7 + 0.6 * gr[..., None])
    for m, c in ((m_ic, ic), (m_oc, oc), (m_lm, lm), (m_um, um), (m_cr, cr)):
        out = np.where(m[..., None], c if c.ndim == 3 else np.broadcast_to(c, out.shape), out)
    # thin bright boundaries between layers
    for rb, a in ((R_IC, 0.25), (R_OC, 0.35), (R_LM, 0.12), (R_UM, 0.10)):
        out = out + (np.exp(-((r - rb) / 18.0) ** 2) * a)[..., None] * np.array([1.0, 0.8, 0.5], np.float32)
    return out


@scene_factory(keys=[])
def earth_cut(cx=(0.0, 0.0), cy=(0.0, 0.0), scale=(0.075, 0.075), tsec=(0.0, 0.0), show=("P",), plume=(0.0, 0.0),
              sight=0.0, path=0.0, rayleigh=(0.0, 0.0), markers=1.0, quake_glow=0.0, chord=0.0, pdot=(-1.0, -1.0), shell=1.0,
              rays=(0.0, 0.0), eye=0.0):
    """The planet cut open along Chicxulub - Tanis. center (km, in the section's frame: (0, 6371) is the surface
    midpoint), scale px per km, tsec: seconds after impact for the wavefronts in `show` ("P", "S"); plume: height of
    the fireball (km); sight: Tanis's line of sight along the horizon; path: the P ray drawn 0..1; rayleigh: seconds
    for the surface wave."""
    conv, core, grain = _polar_tex()

    def f(ctx, t, u, fi):
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        cxk, cyk = L(cx), L(cy)
        sc = L(scale)
        xs, ys = grid()
        Xk = (xs - W / 2) / sc + cxk
        Yk = -(ys - H / 2) / sc + cyk
        r = np.hypot(Xk, Yk)
        th = np.degrees(np.arctan2(Yk, Xk)) % 360
        # visual exaggeration of the crust so it reads on screen (12 px), real proportions everywhere else
        img = np.zeros((H, W, 3), np.float32)
        sx, sy, sb = _stars()
        img = splat_points(img, sx, sy, np.repeat(sb[:, None], 3, 1).astype(np.float32) * 0.5, sigma=0.6)
        inside = r <= M.R_E
        col = _layer_colour(r, th, t, conv, core, grain)
        # sea over the Gulf (left of the impact point) and land toward Tanis, drawn as a thin surface skin
        skin = (r > M.R_E - max(10.0, 16.0 / sc)) & inside
        sea = skin & (th > TH_C - 2) & (th < TH_C + 9)
        col = np.where(sea[..., None], np.array([0.05, 0.18, 0.35], np.float32), col)
        col = np.where((skin & ~sea)[..., None], np.array([0.12, 0.17, 0.08], np.float32), col)
        # gentle 3-D shading: brighter toward the upper left, darker rim, like a lit slab
        shade = 0.85 + 0.25 * clamp(1 - r / M.R_E) + 0.1 * (Yk / M.R_E)
        img = np.where(inside[..., None], col * shade[..., None], img)
        if shell > 0:                                  # the outside of the planet over the lower half: it is Earth, cut open
            v = View(15.0, -75.0, M.R_E * sc, W / 2 - cxk * sc, H / 2 + cyk * sc)
            ext, _, (la_, lo_, ins_) = globe_base(v, t, sun=(0.35, -0.8, 0.5), clouds=0.3)
            wedge = ins_ & ((th > 200) & (th < 340))
            edge_w = np.exp(-(np.minimum(np.abs(th - 200), np.abs(th - 340)) * np.radians(1) * r * sc / 3.0) ** 2) * ins_
            img = np.where(wedge[..., None], ext * 1.1, img) + (edge_w * 0.25)[..., None] * np.array([1.0, 0.8, 0.6], np.float32) * shell
        # atmosphere
        atm = np.exp(-np.clip(r - M.R_E, 0, None) * sc / 6.0) * (r > M.R_E)
        img = img + atm[..., None] * np.array([0.25, 0.5, 1.0], np.float32) * 0.5
        # wavefronts
        ts = L(tsec)
        for wave in show:
            T, ext = travel_times(wave)
            n = T.shape[0]
            u_ = ((Xk + ext) / (2 * ext) * (n - 1)).astype(np.float32)
            v_ = ((Yk + ext) / (2 * ext) * (n - 1)).astype(np.float32)
            Tm = cv2.remap(np.where(np.isfinite(T), T, 1e9).astype(np.float32), u_, v_, cv2.INTER_LINEAR, borderValue=1e9)
            band_w = 6.0 + 4.0 / max(sc, 0.02) * 0.02
            front = np.exp(-((Tm - ts) / band_w) ** 2) * inside
            wake = clamp((ts - Tm) / 25.0) * np.exp(-np.clip(ts - Tm, 0, None) / 90.0) * inside
            c = np.array([0.55, 0.9, 1.0], np.float32) if wave == "P" else np.array([1.0, 0.78, 0.35], np.float32)
            img = img + (front * 1.6 + wake * 0.25)[..., None] * c
        # surface (Rayleigh) wave: a bright bulge running along the crust
        rs = L(rayleigh)
        if rs > 0:
            ang = TH_C - np.degrees(rs * M.RAYLEIGH_U / M.R_E)
            for a_ in (ang, 2 * TH_C - ang):
                d = np.abs(((th - a_ + 180) % 360) - 180) * np.radians(1) * M.R_E
                bump = np.exp(-(d / 220.0) ** 2) * np.exp(-((r - M.R_E) * sc / 14.0) ** 2)
                img = img + bump[..., None] * np.array([1.0, 0.8, 0.45], np.float32) * 2.5
        LN = Lines()
        P2 = lambda xk, yk: ((xk - cxk) * sc + W / 2, -(yk - cyk) * sc + H / 2)
        if path > 0:
            pr = M.ray_path("P")
            k = max(2, int(path * len(pr[0])))
            ang = np.radians(TH_C) - np.asarray(pr[0])[:k]
            rr = np.asarray(pr[1])[:k]
            LN.add([P2(a, b) for a, b in zip(rr * np.cos(ang), rr * np.sin(ang))], (0.8, 0.95, 1.0), 2, 0.8)
        ph = L(plume)
        if ph > 0:                                   # the fireball column rising from the crater
            a = np.radians(TH_C)
            base = P2(M.R_E * np.cos(a), M.R_E * np.sin(a))
            top = P2((M.R_E + ph) * np.cos(a), (M.R_E + ph) * np.sin(a))
            hgt = np.hypot(top[0] - base[0], top[1] - base[1])
            for k in range(40):                      # a column that widens into a mushroom head
                q = k / 39
                x, y = base[0] + (top[0] - base[0]) * q, base[1] + (top[1] - base[1]) * q
                wid = 3 + hgt * (0.035 + 0.12 * clamp((q - 0.8) / 0.2))
                img = glow_dot(img, x, y, wid * 0.5, (0.9, 0.42 + 0.25 * (1 - q), 0.15), 0.10)
        if sight > 0:                                # what the river can see: everything above its horizon (a lit wedge)
            a = np.radians(TH_T)
            tx, ty = M.R_E * np.cos(a), M.R_E * np.sin(a)
            dx, dy = -np.sin(a), np.cos(a)            # tangent direction toward Chicxulub (counter-clockwise)
            ux, uy = np.cos(a), np.sin(a)             # straight up at the river
            wedge = np.array([P2(tx, ty), P2(tx + dx * 4500, ty + dy * 4500), P2(tx + (dx + ux * 1.2) * 4500, ty + (dy + uy * 1.2) * 4500)], np.float32)
            wl_ = np.zeros((H, W), np.float32)
            cv2.fillPoly(wl_, [(wedge * 16).astype(np.int32)], 1.0, cv2.LINE_AA, shift=4)
            img = img + wl_[..., None] * np.array([0.25, 0.45, 0.5], np.float32) * 0.18 * sight
            # beyond the curve: what the river cannot see (between the ground and the river's horizon), shaded red
            px_, py_ = Xk - tx, Yk - ty
            below_h = (px_ * ux + py_ * uy) < 0.0                 # under the horizon line through the river
            hidden = (r > M.R_E) & below_h & (r < M.R_E + 1400) & ((px_ * dx + py_ * dy) > 200)
            img = np.where(hidden[..., None], img * 0.85, img)
            LN.add([P2(tx + dx * s_, ty + dy * s_) for s_ in np.linspace(0, 4500 * sight, 40)], (0.9, 0.95, 1.0), 2, 0.7)
        ry_ = L(rays)
        if ry_ > 0:                                  # straight light rays from the flash: those aimed at the river hit the planet
            a = np.radians(TH_C)
            cxp, cyp = M.R_E * np.cos(a), M.R_E * np.sin(a)
            for k_, ang in enumerate(np.linspace(-0.24, 0.10, 8)):
                d_ = np.array([-np.sin(a) * -1, np.cos(a) * -1])        # local horizontal toward Tanis (clockwise)
                up = np.array([np.cos(a), np.sin(a)])
                dirv = d_ * np.cos(ang) + up * np.sin(ang)
                ts_ = np.linspace(0, 4200, 300)
                pts = np.stack([cxp + dirv[0] * ts_, cyp + dirv[1] * ts_], 1)
                rr2 = np.hypot(pts[:, 0], pts[:, 1])
                hit = np.where(rr2[5:] < M.R_E)[0]
                end = (hit[0] + 5) if len(hit) else len(ts_)
                LN.add([P2(x_, y_) for x_, y_ in pts[:max(2, int(end * min(1.0, ry_)))]], (1.0, 0.85, 0.5), 2, 0.8)
                if len(hit) and ry_ >= 1.0:
                    x_, y_ = P2(*pts[end - 1])
                    img = glow_dot(img, x_, y_, 4, (1.0, 0.4, 0.2), 0.8)
            if ry_ >= 0.6 and eye > 0:                      # the straight line from the flash to the river runs into rock
                a1 = np.radians(TH_T)
                p1 = np.array([np.cos(a1), np.sin(a1)]) * M.R_E
                p0 = np.array([cxp, cyp])
                mid = p0 + (p1 - p0) * 0.5
                mid = mid / np.linalg.norm(mid) * M.R_E                 # where it meets the bulge
                LN.add([P2(*(p0 + (mid - p0) * q)) for q in np.linspace(0, 1, 20)], (1.0, 0.3, 0.25), 3, 0.9)
                xm, ym = P2(*mid)
                xl = np.zeros((H, W), np.float32)
                cv2.line(xl, (int(xm - 22), int(ym - 22)), (int(xm + 22), int(ym + 22)), 1.0, 6, cv2.LINE_AA)
                cv2.line(xl, (int(xm - 22), int(ym + 22)), (int(xm + 22), int(ym - 22)), 1.0, 6, cv2.LINE_AA)
                img = img + (xl + fast_blur(xl, 6))[..., None] * np.array([1.0, 0.25, 0.2], np.float32)
        if chord > 0:                                # the straight line from the river to the crater runs through rock
            a1, a2 = np.radians(TH_T), np.radians(TH_C)
            p1, p2 = np.array([np.cos(a1), np.sin(a1)]) * M.R_E, np.array([np.cos(a2), np.sin(a2)]) * M.R_E
            LN.add([P2(*(p1 + (p2 - p1) * q)) for q in np.linspace(0, chord, 30)], (1.0, 0.35, 0.25), 3, 1.0)
        img = LN.draw(img, 4.0)
        pd = L(pdot)
        if pd >= 0:                                  # the wave packet riding the ray from the crater to the river
            pr = M.ray_path("P")
            k = int(np.clip(pd, 0, 1) * (len(pr[0]) - 1))
            ang = np.radians(TH_C) - pr[0][k]
            x, y = P2(pr[1][k] * np.cos(ang), pr[1][k] * np.sin(ang))
            img = glow_dot(img, x, y, 7, (0.7, 0.95, 1.0), 1.5)
        if eye > 0:                                  # an eye at the river, looking toward the crater
            a = np.radians(TH_T)
            x, y = P2(M.R_E * np.cos(a) * 1.0006, M.R_E * np.sin(a) * 1.0006)
            ex_ = np.zeros((H, W), np.float32)
            cv2.ellipse(ex_, (int(x), int(y - 26)), (26, 13), 8, 0, 360, 1.0, 3, cv2.LINE_AA)
            cv2.circle(ex_, (int(x - 6), int(y - 25)), 6, 1.0, -1, cv2.LINE_AA)
            img = img + (ex_ * eye)[..., None] * np.array([0.8, 1.0, 0.95], np.float32)
        if markers > 0:
            for th_, c in ((TH_C, EMB), (TH_T, TEAL)):
                a = np.radians(th_)
                x, y = P2(M.R_E * np.cos(a), M.R_E * np.sin(a))
                img = glow_dot(img, x, y, 5, c, markers)
            if quake_glow > 0:
                a = np.radians(TH_T)
                x, y = P2(M.R_E * np.cos(a), M.R_E * np.sin(a))
                img = ring_px(img, x, y, 12 + 30 * ((t * 1.5) % 1), TEAL, 2, quake_glow)
        ctx.state["pts"] = {k_: P2(M.R_E * np.cos(np.radians(a_)), M.R_E * np.sin(np.radians(a_))) for k_, a_ in (("chx", TH_C), ("tanis", TH_T))}
        for k_, rr in (("crust", M.R_E - 15), ("mantle", 4900.0), ("outer", 2400.0), ("inner", 400.0)):
            ctx.state["pts"][k_] = P2(rr * np.cos(np.radians(235)), rr * np.sin(np.radians(235)))
        return img, dict(exposure=0.95, bloom=0.4, grain=0.012)
    return f


# ============================================================================================================ fish
def _poly(pts, L, x0, y0):
    return (np.array([(x0 + x * L, y0 - y * L) for x, y in pts]) * 16).astype(np.int32)


def _smooth_outline(top, bot, n=120):
    """Closed outline from top and bottom profile control points (x ascending), spline-smoothed."""
    from scipy.interpolate import PchipInterpolator
    tx, ty = np.array(top).T
    bx, by = np.array(bot).T
    xs = np.linspace(max(tx[0], bx[0]), min(tx[-1], bx[-1]), n)
    yt, yb = PchipInterpolator(tx, ty)(xs), PchipInterpolator(bx, by)(xs)
    return np.concatenate([np.stack([xs, yt], 1), np.stack([xs[::-1], yb[::-1]], 1)])


@functools.lru_cache(256)
def fish_sprite(kind="paddle", L=600, gape=0.0, tail=0.0, tone=1.0):
    """Side view, facing RIGHT, as (rgb, alpha) arrays. L = total length in px. gape 0..1 opens the mouth (paddlefish
    feeding), tail -1..1 = phase of the tail beat (seen side-on: the caudal fin foreshortens as it sweeps)."""
    pad = int(L * 0.25)
    w, h = int(L * 1.1) + 2 * pad, int(L * 0.5) + 2 * pad
    ss = 2
    Wc, Hc = w * ss, h * ss
    x0, y0, Ls = pad * ss, (h // 2) * ss, L * ss
    body = np.zeros((Hc, Wc), np.uint8)
    fins = np.zeros((Hc, Wc), np.uint8)
    dark = np.zeros((Hc, Wc), np.uint8)
    line = np.zeros((Hc, Wc), np.uint8)
    mouth = np.zeros((Hc, Wc), np.uint8)
    tf = 0.55 + 0.45 * abs(np.cos(tail * np.pi))                    # caudal foreshortening
    ty_ = 0.02 * np.sin(tail * np.pi)
    if kind == "paddle":
        g = gape
        # body from caudal peduncle (x=.16) to the rostrum base (x=.64); the paddle continues to x=1.0
        top = [(0.14, 0.022), (0.22, 0.040), (0.34, 0.072), (0.46, 0.088), (0.56, 0.082), (0.62, 0.060), (0.66, 0.030)]
        bot = [(0.14, -0.020), (0.22, -0.034), (0.34, -0.060), (0.46, -0.072), (0.54, -0.070 - 0.035 * g), (0.60, -0.052 - 0.05 * g),
               (0.66, -0.012 - 0.03 * g)]
        cv2.fillPoly(body, [_poly(_smooth_outline(top, bot), Ls, x0, y0)], 255, cv2.LINE_AA, shift=4)
        # the paddle (rostrum): thin seen from the side, slightly deeper toward the rounded tip
        pt = [(0.63, 0.040), (0.72, 0.024), (0.82, 0.030), (0.92, 0.040), (0.975, 0.036), (0.995, 0.018), (1.0, 0.0)]
        pb = [(0.63, 0.010), (0.72, 0.002), (0.82, -0.008), (0.92, -0.016), (0.975, -0.014), (0.995, -0.006), (1.0, 0.0)]
        cv2.fillPoly(body, [_poly(_smooth_outline(pt, pb, 60), Ls, x0, y0)], 255, cv2.LINE_AA, shift=4)
        # open mouth: a dark cavity under the paddle base, with the red gill arches showing through
        if g > 0.05:
            mt = [(0.505, -0.012), (0.56, 0.006), (0.62, 0.010), (0.655, 0.010)]
            mb = [(0.505, -0.012), (0.54, -0.024 * g - 0.012), (0.60, -0.028 * g - 0.012), (0.655, -0.016 * g - 0.006)]
            cv2.fillPoly(mouth, [_poly(_smooth_outline(mt, mb, 40), Ls, x0, y0)], 255, cv2.LINE_AA, shift=4)
        # gill cover: a long flap, its edge a soft line sweeping back to x~0.44
        gc = [(0.585, 0.055), (0.53, 0.05), (0.47, 0.03), (0.43, 0.0), (0.45, -0.035), (0.50, -0.06)]
        cv2.polylines(line, [_poly(gc, Ls, x0, y0)], False, 255, max(1, int(Ls * 0.004)), cv2.LINE_AA, shift=4)
        # fins (semi-transparent)
        dorsal = [(0.30, 0.066), (0.255, 0.15), (0.23, 0.155), (0.235, 0.12), (0.22, 0.05)]
        anal = [(0.29, -0.055), (0.245, -0.12), (0.225, -0.12), (0.23, -0.09), (0.21, -0.04)]
        pect = [(0.44, -0.055), (0.36, -0.085), (0.345, -0.08), (0.40, -0.055)]
        pelv = [(0.32, -0.062), (0.27, -0.082), (0.26, -0.078), (0.295, -0.06)]
        caud = [(0.17, 0.02), (0.09, 0.07 + ty_), (0.0, 0.17 + ty_), (0.03, 0.10 + ty_), (0.07, 0.02 + ty_), (0.05, -0.04 + ty_),
                (0.025, -0.10 + ty_), (0.09, -0.05 + ty_), (0.17, -0.018)]
        eye = (0.615, 0.030)
        base_top, base_bot = np.array([0.30, 0.36, 0.40]), np.array([0.82, 0.84, 0.84])
    else:   # sturgeon
        top = [(0.10, 0.02), (0.20, 0.045), (0.35, 0.075), (0.55, 0.085), (0.72, 0.075), (0.85, 0.050), (0.94, 0.022), (0.985, 0.006)]
        bot = [(0.10, -0.018), (0.20, -0.035), (0.35, -0.058), (0.55, -0.066), (0.72, -0.058), (0.85, -0.040), (0.94, -0.020), (0.985, -0.004)]
        cv2.fillPoly(body, [_poly(_smooth_outline(top, bot), Ls, x0, y0)], 255, cv2.LINE_AA, shift=4)
        for k in range(14):                                    # bony scutes: dorsal and lateral rows
            x = 0.22 + k * 0.05
            for yy, sz in ((0.07 - 0.0005 * (k - 7) ** 2, 0.012), (0.0, 0.009)):
                d = [(x - sz, yy), (x, yy + sz * 0.8), (x + sz, yy), (x, yy - sz * 0.8)]
                cv2.fillPoly(line, [_poly(d, Ls, x0, y0)], 255, cv2.LINE_AA, shift=4)
        for k in range(4):                                     # barbels under the snout
            bx_ = 0.90 + k * 0.012
            cv2.polylines(line, [_poly([(bx_, -0.018), (bx_ - 0.004, -0.05)], Ls, x0, y0)], False, 255, max(1, int(Ls * 0.003)), cv2.LINE_AA, shift=4)
        dorsal = [(0.27, 0.07), (0.22, 0.14), (0.20, 0.14), (0.205, 0.10), (0.19, 0.045)]
        anal = [(0.26, -0.05), (0.22, -0.10), (0.20, -0.10), (0.20, -0.07), (0.19, -0.035)]
        pect = [(0.78, -0.05), (0.69, -0.085), (0.675, -0.08), (0.72, -0.05)]
        pelv = [(0.40, -0.06), (0.35, -0.082), (0.34, -0.078), (0.37, -0.058)]
        caud = [(0.12, 0.02), (0.05, 0.07 + ty_), (-0.04, 0.16 + ty_), (0.0, 0.08 + ty_), (0.04, 0.02 + ty_), (0.03, -0.03 + ty_),
                (0.02, -0.07 + ty_), (0.07, -0.04 + ty_), (0.12, -0.016)]
        eye = (0.905, 0.025)
        base_top, base_bot = np.array([0.24, 0.22, 0.18]), np.array([0.72, 0.68, 0.60])
    # caudal fin foreshortened about its base
    cb = 0.17 if kind == "paddle" else 0.12
    caud = [(cb - (cb - x) * tf, y) for x, y in caud]
    for fp in (dorsal, anal, pect, pelv, caud):
        cv2.fillPoly(fins, [_poly(fp, Ls, x0, y0)], 255, cv2.LINE_AA, shift=4)
    ex, ey = x0 + eye[0] * Ls, y0 - eye[1] * Ls
    cv2.circle(dark, (int(ex * 16), int(ey * 16)), max(2, int(Ls * 0.006)) * 16, 255, -1, cv2.LINE_AA, shift=4)
    rs = lambda m: cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    body, fins, dark, line, mouth = rs(body), rs(fins), rs(dark), rs(line), rs(mouth)
    # countershading (dark back, pale belly) + rim light from the surface + a faint lateral sheen
    yy = (np.arange(h)[:, None] - h / 2) / (L * 0.09)
    k = clamp(0.5 + 0.5 * yy)
    col = base_top[None, None] * (1 - k[..., None]) + base_bot[None, None] * k[..., None]
    col = np.broadcast_to(col, (h, w, 3)).copy()
    edge = clamp(body - cv2.erode(body, np.ones((5, 5), np.uint8)))
    top_edge = edge * clamp(-yy)
    col = col + top_edge[..., None] * 0.35
    col_fin = col.copy()
    dt = cv2.distanceTransform((body > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    dt = clamp(dt / (L * 0.035 + 1e-6))
    col = col * (0.55 + 0.45 * dt[..., None] ** 0.6)                        # rounded body: darker toward the outline
    tex = cv2.resize(fbm(max(8, w // 6), max(8, h // 6), scale=3, octaves=3, seed=int(L) % 97 + (5 if kind == "paddle" else 9)), (w, h))
    col = col * (0.9 + 0.2 * tex[..., None])
    finc = col_fin * 0.78 + 0.04
    a_body = body
    a_fin = fins * 0.6 * (1 - body)
    rgb = col * a_body[..., None] + finc * a_fin[..., None]
    rgb = rgb * (1 - dark[..., None] * 0.9)
    if kind == "paddle" and gape > 0.05:                         # the open mouth: dark red, gill arches showing inside
        xx_ = np.arange(w)[None, :].astype(np.float32)
        arches = 0.5 + 0.5 * np.cos((xx_ - pad) / L * 2 * np.pi * 22)
        inside = np.array([0.11, 0.05, 0.05], np.float32) * (0.85 + 0.15 * arches[..., None])
        rim = clamp(mouth - cv2.erode(mouth, np.ones((3, 3), np.uint8)))
        rgb = rgb * (1 - mouth[..., None]) + inside * mouth[..., None] + rim[..., None] * 0.08
    rgb = rgb * (1 - line[..., None] * 0.35)
    alpha = clamp(a_body + a_fin)
    return (rgb * tone).astype(np.float32), alpha.astype(np.float32), (pad, h // 2)


def put_fish(img, kind, x, y, L, facing=1, gape=0.0, tail=0.0, tone=1.0, tilt=0.0, fog=0.0, fogc=(0.02, 0.05, 0.04), tint=(1.0, 1.0, 1.0)):
    """Composite a fish whose SNOUT points in the direction it moves (facing=+1 right, -1 left)."""
    Lq = int(max(40, round(L / 8) * 8))
    rgb, a, (pad, cy) = fish_sprite(kind, Lq, round(gape * 8) / 8, round(tail * 8) / 8 % 2 - 0, round(tone * 10) / 10)
    if facing < 0:
        rgb, a = rgb[:, ::-1], a[:, ::-1]
    if abs(tilt) > 0.2:
        hh, ww = a.shape
        Mr = cv2.getRotationMatrix2D((ww / 2, hh / 2), tilt * facing, 1.0)
        rgb = cv2.warpAffine(rgb, Mr, (ww, hh), flags=cv2.INTER_LINEAR)
        a = cv2.warpAffine(a, Mr, (ww, hh), flags=cv2.INTER_LINEAR)
    hh, ww = a.shape
    # anchor: the fish's middle at (x, y)
    ox = int(x - ww / 2)
    oy = int(y - hh / 2)
    x0, y0 = max(0, ox), max(0, oy)
    x1, y1 = min(W, ox + ww), min(H, oy + hh)
    if x1 <= x0 or y1 <= y0:
        return img
    sa = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox][..., None]
    sr = rgb[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    sr = sr * np.array(tint, np.float32)
    if fog > 0:
        sr = sr * (1 - fog) + np.array(fogc, np.float32) * fog
    img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - sa) + sr * sa
    return img


# ------------------------------------------------------------------------------------------- the river, side-on
@functools.lru_cache(1)
def _bed_layers():
    r = rng_at(501)
    far = cv2.resize(fbm(480, 60, scale=6, octaves=4, seed=502), (W * 2, 120))
    pebbles = [(r.uniform(0, W * 2), r.uniform(0.0, 1.0), r.uniform(6, 26), r.uniform(0.6, 1.2)) for _ in range(260)]
    weeds = [(r.uniform(0, W * 2), r.uniform(80, 300), r.uniform(0, 6.28), r.uniform(0.7, 1.3)) for _ in range(46)]
    return far, pebbles, weeds


def underwater(t, pan=0.0, sky=(0.55, 0.65, 0.55), murk=0.0, red=0.0, shake=0.0, silt=0.0, surf_y=0.07, bed_y=0.86):
    """The water column seen side-on: shimmering surface underside above, light shafts, drifting motes, a sandy bed
    with pebbles and water plants below, distance fading into green."""
    xs, ys = grid()
    sy_, by_ = H * surf_y, H * bed_y
    dy = shake * 6 * np.sin(t * 37)
    dx = shake * 9 * np.sin(t * 29 + 1)
    depth = clamp((ys - sy_) / (by_ - sy_))
    skyc = np.array(sky, np.float32) * (1 - red) + np.array([1.0, 0.45, 0.25], np.float32) * red
    water_top = skyc * 0.22
    water_deep = np.array([0.012, 0.035, 0.028], np.float32) * (1 + red * 0.5)
    img = water_top[None, None] * (1 - depth[..., None]) ** 1.6 + water_deep[None, None] * (1 - (1 - depth[..., None]) ** 1.6)
    # surface underside: bright, rippled band
    rip = cv2.resize(fbm(240, 6, scale=10, octaves=3, seed=int(t * 4) % 30), (W, 1))[0]
    surf_line = sy_ + 6 * np.sin(xs[0] * 0.012 + t * 1.3) + 5 * (rip - 0.5)
    above = ys < surf_line[None, :]
    img = np.where(above[..., None], skyc * 0.55 * (0.7 + 0.6 * rip[None, :, None]), img)
    img = img + (np.exp(-((ys - surf_line[None, :]) / 5.0) ** 2))[..., None] * skyc * 0.3
    # light shafts
    sh = cv2.resize(fbm(160, 1, scale=12, octaves=2, seed=503), (W, 1))[0]
    ang = 0.25
    u_ = ((xs - (ys - sy_) * ang + t * 12 + pan * 0.4) % W).astype(np.int32)
    shafts = clamp((sh[u_] - 0.5) * 3) ** 2 * (1 - depth) ** 1.2 * (1 - murk)
    img = img + shafts[..., None] * skyc * 0.18
    # far bank / bed silhouette, moving with a slower parallax
    far, pebbles, weeds = _bed_layers()
    fx = ((xs[0] + pan * 0.5) % (W * 2)).astype(np.int32)
    ridge = by_ - 40 - 50 * far[60, fx]
    farm = ys > ridge[None, :]
    img = np.where(farm[..., None], img * 0.55 + water_deep * 0.6, img)
    # sand bed
    bed_line = by_ + 10 * np.sin(xs[0] * 0.004 + 1) + 6 * far[30, ((xs[0] + pan) % (W * 2)).astype(np.int32)]
    bed = ys > bed_line[None, :]
    sand = np.array([0.20, 0.17, 0.11], np.float32) * (0.6 + 0.5 * cv2.resize(fbm(480, 80, scale=20, octaves=4, seed=504), (W, H))[..., None])
    sand = sand * skyc / 0.6 * 0.6
    img = np.where(bed[..., None], sand * (0.6 + 0.4 * clamp((H - ys) / (H - by_ + 1)))[..., None], img)
    lay = np.zeros((H, W), np.float32)
    for (px, pv, pr, pk) in pebbles:
        x = (px - pan) % (W * 2) - W * 0.5
        if -40 < x < W + 40:
            y = by_ + 6 + pv * (H - by_ - 6)
            cv2.ellipse(lay, (int(x), int(y)), (int(pr * pk), int(pr * 0.55)), 0, 0, 360, 1.0, -1, cv2.LINE_AA)
    img = img * (1 - 0.35 * blur(lay, 1.2)[..., None])
    # water plants swaying, dark against the light
    wl = np.zeros((H, W), np.float32)
    for (px, ph, phase, k) in weeds:
        x = (px - pan * 0.9) % (W * 2) - W * 0.5
        if -60 < x < W + 60:
            n = 10
            pts = [(x + 14 * k * np.sin(t * 0.9 + phase + j * 0.4) * j / n, by_ + 10 - ph * j / n) for j in range(n + 1)]
            cv2.polylines(wl, [(np.array(pts) * 16).astype(np.int32)], False, 1.0, max(2, int(5 * k)), cv2.LINE_AA, shift=4)
    wl = blur(wl, 1.0)
    img = img * (1 - 0.85 * wl[..., None]) + wl[..., None] * np.array([0.02, 0.05, 0.02], np.float32)
    # motes
    r = rng_at(505)
    n = 500
    mx = (r.uniform(0, W, n) + 10 * np.sin(t * 0.3 + r.uniform(0, 6, n)) - pan * 0.7) % W
    my = (r.uniform(sy_, by_, n) + t * r.uniform(-3, 4, n)) % H
    img = splat_points(img, mx, my, np.tile(skyc[None], (n, 1)) * r.uniform(0.05, 0.25, (n, 1)), sigma=0.8)
    if silt > 0:                                       # silt kicked up from the bed (quake)
        sl = cv2.resize(fbm(240, 135, scale=6, octaves=4, seed=int(t * 5) % 40), (W, H))
        k = clamp((ys - (by_ - 300 * silt)) / 300) * silt
        img = img * (1 - 0.7 * k[..., None] * sl[..., None]) + (k * sl)[..., None] * np.array([0.12, 0.10, 0.06], np.float32)
    if murk > 0:
        mc = np.array([0.10, 0.08, 0.045], np.float32) * (0.6 + 0.6 * (1 - depth[..., None]))
        img = img * (1 - murk) + mc * murk
    if shake > 0:
        Mx = np.float32([[1, 0, dx], [0, 1, dy]])
        img = cv2.warpAffine(img, Mx, (W, H), borderMode=cv2.BORDER_REFLECT)
    return img


def _beads_fall(img, t, n, sy_, by_, seed=7, size=1.6, x_range=(0, W), speed=(18, 40), glow=0.6):
    r = rng_at(seed)
    bx = r.uniform(*x_range, n) + 8 * np.sin(t * 0.7 + r.uniform(0, 6, n))
    sp = r.uniform(*speed, n)
    by = sy_ + (r.uniform(0, 1, n) * (by_ - sy_) + t * sp) % (by_ - sy_)
    tw = 0.6 + 0.4 * np.sin(t * r.uniform(2, 6, n) + r.uniform(0, 6, n))
    lay = np.zeros((H, W), np.float32)
    rad = max(1, int(round(size * 0.6)))
    for x_, y_, w_ in zip(bx, by, tw):                  # little glass discs that stay visible at any size, with a wake
        cv2.line(lay, (int(x_), int(y_ - rad * 6)), (int(x_), int(y_)), float(w_) * 0.35, max(1, rad), cv2.LINE_AA)
        cv2.circle(lay, (int(x_), int(y_)), rad, float(w_), -1, cv2.LINE_AA)
    lay = lay + fast_blur(lay, 2 + rad) * 0.8
    return img + lay[..., None] * np.array([0.55, 0.95, 0.75], np.float32) * (glow * 0.35)


def _tone(y, murk=0.0):
    d = clamp((y - H * 0.07) / (H * 0.8))
    return float((0.62 - 0.38 * d) * (1 - 0.5 * murk))


def _tint(red=0.0):
    return tuple(np.array([0.70, 0.92, 0.85]) * (1 - red) + np.array([1.0, 0.62, 0.45]) * red)


@scene_factory(keys=[])
def fish_scene(hero=(0.25, 0.65), hero_y=(0.45, 0.45), size=(520.0, 520.0), pan=(0.0, 120.0), gape=1.0, school=0,
               sturgeon=0, beads=(0.0, 0.0), red=(0.0, 0.0), murk=(0.0, 0.0), shake=(0.0, 0.0), silt=(0.0, 0.0),
               dive=(0.0, 0.0), facing=1, swallow=0.0, glow_surface=(0.0, 0.0), sense=(0.0, 0.0), intake=(0.0, 0.0), bead_size=1.0):
    """The hero paddlefish swimming through the river, side-on. hero: x across the screen (0..1, start..end of the
    beat), always moving the way its snout points; school: others behind it; sturgeon: on the bottom; beads: glass
    sinking past (0..1 density); red: the sky above glowing; murk: muddy water; dive: the hero darting down (0..1)."""
    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)          # shot-continuous time (no resets)
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        img = underwater(tc, pan=L(pan), red=L(red), murk=L(murk), shake=L(shake), silt=L(silt))
        sy_, by_ = H * 0.07, H * 0.86
        bd = L(beads)
        if bd > 0:
            img = _beads_fall(img, tc, int(900 * bd * bead_size), sy_, by_, seed=8, size=1.3 * bead_size, speed=(25, 45), glow=1.1)   # far
        r = rng_at(601)
        for k in range(int(round(school))):                                        # the school: smaller, farther, fogged
            xk = (r.uniform(-0.2, 1.1) * W + facing * tc * r.uniform(30, 55) + 0 * L(pan)) % (W * 1.4) - W * 0.2
            hy0 = L(hero_y)
            band = (0.16, 0.30) if hy0 > 0.45 else (0.62, 0.74)
            yk = H * (band[0] + (band[1] - band[0]) * ((k * 0.61 + 0.13) % 1)) + 12 * np.sin(tc * 0.6 + k) + 70 * (k % 2)
            img = put_fish(img, "paddle", xk, yk, size[0] * r.uniform(0.35, 0.55), facing, gape=0.7, tail=(tc * 1.2 + k * 0.37) % 2 - 1,
                           fog=0.55, fogc=(0.03, 0.07, 0.06), tone=_tone(yk, L(murk)), tint=_tint(L(red)))
        for k in range(int(round(sturgeon))):
            xk = (r.uniform(0, 1) * W + facing * tc * 22) % (W * 1.6) - W * 0.3
            img = put_fish(img, "sturgeon", xk, by_ - 30 - 20 * k, size[0] * r.uniform(0.9, 1.2), facing, tail=(tc * 0.8 + k * 0.5) % 2 - 1,
                           fog=0.35, fogc=(0.03, 0.06, 0.05), tone=_tone(by_ - 30, L(murk)), tint=_tint(L(red)))
        hx = L(hero) * W
        hy = L(hero_y) * H + 10 * np.sin(tc * 0.8) + L(dive) * H * 0.3
        tilt = -L(dive) * 18 if dive[1] > dive[0] else 0.0
        img = put_fish(img, "paddle", hx, hy, L(size), facing, gape=gape * (0.85 + 0.15 * np.sin(tc * 1.7)),
                       tail=(tc * (1.4 + 3 * (dive[1] - dive[0]))) % 2 - 1, tilt=tilt, tone=_tone(hy, L(murk)), tint=_tint(L(red)),
                       fog=0.12 + 0.5 * L(murk), fogc=(0.06, 0.05, 0.03))
        ik = L(intake)
        if ik > 0:                                      # glass beads swept into the open mouth with the water
            mx_, my_ = hx + facing * L(size) * 0.06, hy + L(size) * 0.02
            r3 = rng_at(612)
            n3 = int(60 * ik)
            ph = (r3.uniform(0, 1, n3) + tc * 0.5) % 1.0
            sx0, sy0 = mx_ + facing * r3.uniform(200, 700, n3), my_ + r3.uniform(-260, 260, n3)
            px_, py_ = sx0 + (mx_ - sx0) * ph, sy0 + (my_ - sy0) * ph
            for x_, y_ in zip(px_, py_):
                img = glow_dot(img, x_, y_, 3.5, (0.55, 1.0, 0.75), 0.9)
        se = L(sense)
        if se > 0:                                     # the paddle feeling the tiny electric fields of plankton ahead
            tipx = hx + facing * L(size) * 0.45
            r2 = rng_at(611)
            for k in range(14):
                px, py = tipx + facing * r2.uniform(40, 420), hy + r2.uniform(-160, 160)
                img = glow_dot(img, px, py, 4, (0.6, 1.0, 0.9), 1.2 * se)
                for j in range(3):
                    ph = ((tc * 0.8 + k * 0.13 + j / 3) % 1)
                    img = ring_px(img, px, py, 8 + 70 * ph, (0.5, 0.95, 1.0), 2.5, se * 1.0 * (1 - ph), 3)
            # the paddle's own field: arcs pulsing out from the snout
            for j in range(4):
                ph = ((tc * 0.9 + j / 4) % 1)
                img = ring_px(img, tipx - facing * L(size) * 0.12, hy, 40 + 260 * ph, (0.45, 0.9, 1.0), 2.0, se * 0.6 * (1 - ph), 4)
        if bd > 0:
            img = _beads_fall(img, tc, int(320 * bd), sy_, by_, seed=9, size=4.6 * bead_size, speed=(30, 60), glow=3.6)       # near
        shk = L(shake)
        if shk > 0.5:                                  # a jolt: the whole view lurches and tilts
            Mr = cv2.getRotationMatrix2D((W / 2, H / 2), 5 * shk * np.sin(tc * 11), 1.06)
            Mr[0, 2] += 40 * shk * np.sin(tc * 13)
            Mr[1, 2] += 30 * shk * np.sin(tc * 17)
            img = cv2.warpAffine(img, Mr, (W, H), borderMode=cv2.BORDER_REFLECT)
        gs = L(glow_surface)
        if gs > 0:
            xs, ys = grid()
            img = img + (np.exp(-np.clip(ys - sy_, 0, None) / 120.0) * gs)[..., None] * np.array([1.0, 0.5, 0.25], np.float32) * 0.4
        return img, dict(exposure=1.25, bloom=0.4, grain=0.016)
    return f


# ============================================================================================================ gills
@functools.lru_cache(2)
def _raker_layer(fossil=False):
    """Four gill arches seen side-on inside the open mouth, each with a fine comb of rakers (static art, 2x)."""
    ss = 2
    w, h = W * ss, H * ss
    arch = np.zeros((h, w), np.uint8)
    rake = np.zeros((h, w), np.uint8)
    r = rng_at(701)
    for k in range(4):
        cx, cy = w * (0.30 + 0.16 * k), h * 0.5
        R = h * (0.42 - 0.02 * k)
        th = np.linspace(-1.05, 1.05, 80)
        pts = np.stack([cx - R * np.cos(th) * 0.35, cy + R * np.sin(th)], 1)
        cv2.polylines(arch, [(pts * 16).astype(np.int32)], False, 255, int(26 * ss), cv2.LINE_AA, shift=4)
        for j in range(140):                                     # rakers: long, fine, pointing forward (right)
            q = j / 139
            a = -1.0 + 2.0 * q
            x0, y0 = cx - R * np.cos(a) * 0.35, cy + R * np.sin(a)
            Lr = h * (0.07 + 0.03 * np.cos(a * 1.5)) * r.uniform(0.85, 1.1)
            x1, y1 = x0 + Lr * 0.95, y0 + Lr * 0.12 * np.sin(a)
            cv2.line(rake, (int(x0 * 16), int(y0 * 16)), (int(x1 * 16), int(y1 * 16)), 255, max(1, int(1.6 * ss)), cv2.LINE_AA, shift=4)
    rs = lambda m: cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    return rs(arch), rs(rake)


@scene_factory(keys=["fossil"])
def gills(fossil=False, caught=(0.0, 0.0), flow=1.0, food=1.0, zoom=(1.0, 1.1)):
    """Inside the paddlefish's mouth, side-on: gill arches with their comb of rakers; water streams through; food
    specks and then glass beads are caught (caught: 0..1 of the comb filled). fossil=True: the same comb in stone."""
    arch, rake = _raker_layer(fossil)

    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        e = ease(u)
        z = lerp(zoom[0], zoom[1], e)
        xs, ys = grid()
        if fossil:
            stone = cv2.resize(fbm(480, 270, scale=10, octaves=5, seed=711), (W, H))
            img = np.array([0.30, 0.27, 0.22], np.float32) * (0.7 + 0.5 * stone[..., None])
            relief = cv2.GaussianBlur(arch + rake * 0.6, (0, 0), 2.0)
            gy = np.gradient(relief, axis=0)
            img = img * (1 + (-gy * 6)[..., None]) * (1 - 0.15 * relief[..., None])
        else:
            # the paddlefish's head in extreme close-up, side-on; through a window in the gill cover, the arches
            img = underwater(tc, pan=tc * 40) * 0.8
            Ls = 1400
            rgb, a, (pad, cyp) = fish_sprite("paddle", Ls, 1.0, 0.0, 0.6)
            X0, X1, Yt, Yb = 0.40, 0.72, 0.095, -0.085
            cx0, cx1 = int(pad + X0 * Ls), int(pad + X1 * Ls)
            cy0, cy1 = int(cyp - Yt * Ls), int(cyp - Yb * Ls)
            hr = cv2.resize(rgb[cy0:cy1, cx0:cx1] * np.array([0.75, 0.9, 0.88], np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
            ha = cv2.resize(a[cy0:cy1, cx0:cx1], (W, H), interpolation=cv2.INTER_CUBIC)[..., None]
            img = img * (1 - ha) + hr * ha
            sx_ = lambda xl: (xl - X0) / (X1 - X0) * W
            sy_ = lambda yl: (Yt - yl) / (Yt - Yb) * H
            gx0, gx1, gy0, gy1 = int(sx_(0.445)), int(sx_(0.585)), int(sy_(0.058)), int(sy_(-0.05))
            win = np.zeros((H, W), np.float32)
            cv2.ellipse(win, ((gx0 + gx1) // 2, (gy0 + gy1) // 2), ((gx1 - gx0) // 2, (gy1 - gy0) // 2), 0, 0, 360, 1.0, -1, cv2.LINE_AA)
            win = blur(win, 6) * ha[..., 0]
            ar_ = np.zeros((H, W), np.float32)
            rk_ = np.zeros((H, W), np.float32)
            ar_[gy0:gy1, gx0:gx1] = cv2.resize(arch[int(H * 0.06):int(H * 0.94), int(W * 0.18):int(W * 0.86)], (gx1 - gx0, gy1 - gy0))
            rk_[gy0:gy1, gx0:gx1] = cv2.resize(rake[int(H * 0.06):int(H * 0.94), int(W * 0.18):int(W * 0.86)], (gx1 - gx0, gy1 - gy0))
            cav = np.array([0.22, 0.05, 0.05], np.float32)
            g_ = cav * (1 - ar_[..., None]) + ar_[..., None] * np.array([0.6, 0.11, 0.10], np.float32)
            g_ = g_ * (1 - rk_[..., None] * 0.9) + rk_[..., None] * np.array([0.85, 0.75, 0.70], np.float32) * 0.6
            img = img * (1 - 0.9 * win[..., None]) + g_ * 0.9 * win[..., None]
            ctx.state["gill_rect"] = (gx0, gx1, gy0, gy1)
            # water streams in through the open mouth (right) and out through the gills (left): food specks
            r = rng_at(712)
            n = 700
            sp = r.uniform(250, 500, n) * flow
            px = gx1 + 40 - (r.uniform(0, gx1 - gx0 + 80, n) + tc * sp * 0.5) % (gx1 - gx0 + 80)
            py = r.uniform(gy0, gy1, n) + 10 * np.sin(tc + r.uniform(0, 6, n))
            comb = gx0 + (gx1 - gx0) * (0.18 + 0.235 * r.integers(0, 4, n)) + 10
            caught_ = (r.uniform(0, 1, n) < 0.3 * food) & (px < comb)
            px = np.where(caught_, comb, px)
            okp = win[np.clip(py.astype(int), 0, H - 1), np.clip(px.astype(int), 0, W - 1)] > 0.3
            img = splat_points(img, px[okp], py[okp], np.tile(np.array([[0.55, 0.45, 0.3]], np.float32), (int(okp.sum()), 1)) * 0.6 * food, sigma=1.3)
        # glass beads caught in the comb: little green glass spheres with a bright highlight
        c = lerp(caught[0], caught[1], e)
        if c > 0:
            r = rng_at(713)
            n = 160
            k = r.integers(0, 4, n)
            a = r.uniform(-0.9, 0.9, n)
            cx = W * (0.30 + 0.16 * k) / 1 - H * (0.42 - 0.02 * k) * np.cos(a) * 0.35 + H * r.uniform(0.02, 0.09, n)
            cy = H * 0.5 + H * (0.42 - 0.02 * k) * np.sin(a)
            if not fossil:                                   # map from full-frame art into the gill window
                gx0, gx1, gy0, gy1 = ctx.state["gill_rect"]
                cx = gx0 + (cx - W * 0.18) / (W * 0.68) * (gx1 - gx0)
                cy = gy0 + (cy - H * 0.06) / (H * 0.88) * (gy1 - gy0)
                rad_k = (gx1 - gx0) / (W * 0.68)
            show = r.uniform(0, 1, n) < c
            rad = r.uniform(5, 11, n) * (1.0 if fossil else max(0.8, rad_k * 1.2))
            for x, y, rr in zip(cx[show], cy[show], rad[show]):
                x0, x1, y0, y1 = _win(x, y, rr + 4)
                yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
                d = np.hypot(xx - x, yy - y) / rr
                body = clamp((1 - d) * rr / 1.5)
                hl = np.exp(-(np.hypot(xx - (x - rr * 0.35), yy - (y - rr * 0.35)) / (rr * 0.22)) ** 2)
                gc = np.array([0.10, 0.20, 0.12], np.float32) if fossil else np.array([0.30, 0.65, 0.45], np.float32)
                img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - body[..., None]) + body[..., None] * gc * (0.6 + 0.6 * (1 - d[..., None])) \
                    + hl[..., None] * (0.9 if not fossil else 0.35)
        if z != 1.0:
            Mz = cv2.getRotationMatrix2D((W * 0.55, H * 0.5), 0, z)
            img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REFLECT)
        return img, dict(exposure=1.2, bloom=0.35, grain=0.02)
    return f


# ============================================================================================ the river cut open
def _tree(m, x, base, hgt, kind, seed):
    r = rng_at(seed)
    cv2.line(m, (int(x), int(base)), (int(x), int(base - hgt * 0.5)), 1.0, max(2, int(hgt * 0.03)), cv2.LINE_AA)
    if kind == 0:                                              # conifer
        for j in range(7):
            q = j / 6
            wdt = hgt * (0.22 - 0.18 * q)
            y = base - hgt * (0.25 + 0.72 * q)
            cv2.fillPoly(m, [np.array([(x - wdt, y + hgt * 0.10), (x + wdt, y + hgt * 0.10), (x, y - hgt * 0.08)], np.int32)], 1.0, cv2.LINE_AA)
    else:                                                      # broadleaf
        for j in range(9):
            cv2.circle(m, (int(x + r.uniform(-0.2, 0.2) * hgt), int(base - hgt * r.uniform(0.55, 0.9))), int(hgt * r.uniform(0.12, 0.2)), 1.0, -1, cv2.LINE_AA)


@functools.lru_cache(1)
def _cut_static():
    g = H * 0.40
    trees = np.zeros((H, W), np.float32)
    r = rng_at(801)
    for k in range(26):
        side = k % 2
        x = r.uniform(0.0, 0.13) * W if side == 0 else r.uniform(0.935, 1.0) * W
        _tree(trees, x, g + 2, r.uniform(140, 260), r.integers(0, 2), 802 + k)
    far = np.zeros((H, W), np.float32)
    for k in range(60):
        _tree(far, r.uniform(0, W), g - 2, r.uniform(60, 120), r.integers(0, 2), 900 + k)
    soil = cv2.resize(fbm(480, 270, scale=9, octaves=5, seed=803), (W, H))
    return g, blur(trees, 0.8), blur(far, 1.2), soil


def _chan(x):
    x0, x1 = W * 0.16, W * 0.84
    s = np.clip((x - x0) / (x1 - x0), 0, 1)
    return np.where((x > x0) & (x < x1), np.sin(np.pi * s) ** 0.6, 0.0)


@scene_factory(keys=[], vectors=("focus",))
def cutaway(level=(0.0, 0.0), slosh=(0.0, 0.0), mud=(0.0, 0.0), rain=(0.0, 0.0), fish_on_bank=(0.0, 0.0),
            fish_in=1.0, red=(0.0, 0.0), dust=(0.0, 0.0), zoom=(1.0, 1.0), focus=(0.5, 0.5), shake=(0.0, 0.0), debris=(0.0, 0.0),
            muddy=(0.0, 0.0), ash=(0.0, 0.0), boom=(0.0, 0.0), jolt=(0.0, 0.0), sway=(0.0, 0.0), roll=(0.0, 0.0)):
    """The river cut open like an aquarium, seen side-on: banks with trees, the channel full of water, fish inside.
    level: water height above normal (1.0 = up over the banks by ~10 m); slosh: the surface rocking side to side;
    mud: the channel filling with mud from the bottom (1 = full); rain: glass falling from the sky; fish_on_bank:
    stranded fish on the right bank, buried as mud covers them; debris: logs in the water."""
    g, trees, far, soil = _cut_static()
    dep = H * 0.40                                              # channel depth on screen (~ a few metres)

    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        e = ease(u)
        L = lambda p: lerp(p[0], p[1], e)
        xs, ys = grid()
        rd, du = L(red), L(dust)
        # sky
        sky_c = np.array([0.55, 0.66, 0.72], np.float32) * (1 - rd) + np.array([0.95, 0.50, 0.28], np.float32) * rd
        sky_c = sky_c * (1 - du) + np.array([0.40, 0.34, 0.28], np.float32) * du
        img = sky_c[None, None] * (0.6 + 0.4 * clamp(ys / g)[..., None])
        pass                                                   # (no ghost background trees)
        # ground cut face
        floor = g + dep * _chan(xs[0])
        under = ys > g
        strata = np.sin(ys / 9.0 + 3 * soil) * 0.5 + 0.5
        earth = np.array([0.20, 0.15, 0.10], np.float32) * (0.7 + 0.25 * strata[..., None] + 0.2 * soil[..., None])
        img = np.where(under[..., None], earth, img)
        img = img * (1 - trees[..., None]) + trees[..., None] * np.array([0.03, 0.05, 0.03], np.float32) * (1 + rd)
        # mud fill from the channel floor up, in layers
        md = L(mud)
        top_mud = floor - (floor - g) * md
        in_ch = ys < floor[None, :]
        mudm = in_ch & (ys > top_mud[None, :]) & under
        lam = (floor[None, :] - ys) / dep
        band = np.where(((lam > 0.0) & (lam < 0.30)) | ((lam > 0.48) & (lam < 0.70)), 0.75, 1.0)    # two surge beds
        lamin = 0.85 + 0.15 * np.sin(lam * 140)
        mud_c = np.array([0.30, 0.24, 0.16], np.float32) * (band * lamin)[..., None] * (0.8 + 0.3 * soil[..., None])
        img = np.where(mudm[..., None], mud_c, img)
        # water
        lv = L(level)
        a = L(slosh)
        wl0 = g + dep * 0.25 - lv * dep * 0.5                  # normal level ~ a quarter below the banks
        xc = (xs[0] - W / 2) / (W * 0.34)
        surf = wl0 + a * dep * 0.35 * np.clip(xc, -1.4, 1.4) * np.cos(tc * 2.2) + 6 * np.sin(xs[0] * 0.02 + tc * 2)
        if lv < 0.5:                                           # water stays in its channel unless it floods
            surf = np.maximum(surf, g + 3)
        in_water = (ys > surf[None, :]) & ((ys < top_mud[None, :]) & in_ch | ((ys < g + 2) & (lv > 0.5)))
        in_water = in_water & ((ys > g) | (lv > 0.5) | (ys > surf[None, :]))
        wd = clamp((ys - surf[None, :]) / dep)
        wc = np.array([0.10, 0.25, 0.22], np.float32) * (1 - 0.5 * rd) * (1 - wd[..., None] * 0.6)
        brown = max(float(clamp(lv * 0.4)), float(L(muddy)))
        wc = wc * (1 - 0.8 * brown) + np.array([0.24, 0.18, 0.10], np.float32) * brown * (0.75 + 0.35 * soil[..., None])   # surge water is brown
        above = in_water & (ys <= g)
        img = np.where(in_water[..., None], np.where(above[..., None], img * 0.08 + wc * 1.05, img * 0.25 + wc), img)
        img = img + (np.exp(-((ys - surf[None, :]) / 2.5) ** 2) * (in_water | (ys < surf[None, :] + 3)) * 0.0)[..., None]
        has_w = (surf < top_mud - 2) | (lv > 0.5)
        edge = np.exp(-((ys - surf[None, :]) / 3.0) ** 2) * has_w[None, :] * ((ys < floor[None, :]) | (lv > 0.5))
        img = img + edge[..., None] * sky_c * 0.35
        # fish swimming in the channel (side-on), gone once the water leaves
        if fish_in > 0:
            for k in range(3):
                fx = W * (0.25 + 0.5 * ((tc * (0.03 + 0.01 * k) + k * 0.33) % 1))
                fy = (g + floor.max()) / 2 + (k - 1) * 40
                fy = max(fy, surf[int(np.clip(fx, 0, W - 1))] + 45)
                if fy < top_mud[int(np.clip(fx, 0, W - 1))] - 30:
                    img = put_fish(img, "paddle" if k != 1 else "sturgeon", fx, fy, 200 - 30 * k, 1, gape=0.6, tail=(tc * 1.3 + k) % 2 - 1,
                                   tone=0.5 * fish_in, tint=(0.8, 0.95, 0.9), fog=0.2)
        # stranded fish on the right bank, then buried
        fb = L(fish_on_bank)
        if fb > 0:
            for k in range(2):
                q = clamp(fb / 0.6)
                fx = W * (lerp(0.62 + 0.08 * k, 0.858 + 0.058 * k, ease(q)))
                fy = lerp(g + dep * 0.35, g - 16, ease(q)) - 60 * np.sin(np.pi * q)
                img = put_fish(img, "sturgeon" if k == 0 else "paddle", fx, fy, 170, 1, gape=0.3,
                               tail=0.4 * np.sin(tc * 6 + k) * (1 - md), tone=0.7, tilt=6 * (k - 0.5) - 25 * np.sin(np.pi * q))
            if md > 0.5:                                        # mud drapes the bank: a soft mound slowly covering the fish
                hm = 34 * clamp((md - 0.5) * 2) * np.exp(-((xs - W * 0.89) / (W * 0.06)) ** 2)
                bank_mud = clamp((ys - (g - hm)) / 4.0) * (ys < g + 6) * (xs > W * 0.83)
                img = img * (1 - 0.85 * bank_mud[..., None]) + mud_c * 0.85 * bank_mud[..., None]
        # logs tumbling in the surge
        db = L(debris)
        if db > 0:
            lm = np.zeros((H, W), np.float32)
            r = rng_at(810)
            for k in range(6):
                lx = (r.uniform(0, W) + tc * r.uniform(-60, 60)) % W
                ly = surf[int(lx)] + r.uniform(30, 140)
                if ly > top_mud[int(lx)] - 20 and not (lv > 0.5):
                    continue
                _log(lm, lx, ly, r.uniform(120, 220), r.uniform(-0.15, 0.15) + 0.1 * np.sin(tc * r.uniform(0.5, 1.0) + k), r.uniform(14, 24))
            img = img * (1 - 0.9 * lm[..., None] * db) + (lm * db)[..., None] * np.array([0.08, 0.05, 0.03], np.float32)
        # glass rain from the sky into water and mud
        rn = L(rain)
        if md > 0.55 and rn <= 0:                              # glass that already fell stays in the layers
            r = rng_at(811)
            r.uniform(0, 1, 3)
            sx, sy = r.uniform(W * 0.16, W * 0.84, 2500), r.uniform(g, g + dep, 2500)
            fl = g + dep * _chan(sx)
            okb = (sy < fl) & (sy > fl - (fl - g) * md)
            img = splat_points(img, sx[okb], sy[okb], np.tile(np.array([[0.45, 0.9, 0.65]], np.float32), (int(okb.sum()), 1)) * 1.2, sigma=1.6)
        if rn > 0:
            r = rng_at(811)
            n = int(500 * rn)
            px = r.uniform(0, W, n)
            py = (r.uniform(0, 1, n) + tc * r.uniform(0.25, 0.5, n)) % 1.0 * (H * 0.95)
            gl = np.zeros((H, W), np.float32)
            solid = np.where((xs[0] > W * 0.16) & (xs[0] < W * 0.84), top_mud, g)
            for x_, y_ in zip(px, py):
                if y_ < solid[int(np.clip(x_, 0, W - 1))] and W * 0.18 < x_ < W * 0.82:
                    cv2.line(gl, (int(x_), int(y_ - 14)), (int(x_), int(y_)), 1.0, 2, cv2.LINE_AA)
            img = img + (gl + fast_blur(gl, 4) * 1.5)[..., None] * np.array([0.55, 1.0, 0.75], np.float32) * 0.9
            # beads already settled in the mud: specks in the fine layers
            sx, sy = r.uniform(W * 0.16, W * 0.84, 2500), r.uniform(g, g + dep, 2500)
            fl = g + dep * _chan(sx)
            okb = (sy < fl) & (sy > fl - (fl - g) * md)
            img = splat_points(img, sx[okb], sy[okb], np.tile(np.array([[0.45, 0.9, 0.65]], np.float32), (int(okb.sum()), 1)) * 1.4, sigma=1.6)
        # buried fish inside the mud layers (visible in the cut face)
        if fish_in <= 0.0:
            for k in range(5):
                fx = W * (0.3 + 0.1 * k)
                ff = g + dep * _chan(np.array([fx]))[0]
                lamk = 0.06 + 0.10 * (k % 3)
                fy = ff - dep * lamk
                cov = float(clamp((top_mud[int(fx)] - fy) / -20.0 + 1)) if fy > top_mud[int(fx)] else 0.0
                img = put_fish(img, "sturgeon" if k % 2 else "paddle", fx, fy, 210, 1, gape=0.0, tail=0.3,
                               tone=0.35, tint=(0.75, 0.66, 0.52), tilt=10 * (k % 3 - 1), fog=0.35 + 0.45 * cov, fogc=(0.20, 0.15, 0.10))
        jl, sw_, rl_ = L(jolt), L(sway), L(roll)
        if jl > 0 or sw_ > 0 or rl_ > 0:                       # the ground moves: up-down jolt, side to side, rolling waves
            gm = clamp((ys - (g - 330)) / 30.0)                 # trees and ground move together, the sky does not
            dxm = sw_ * 26 * np.sin(tc * 9.0) * gm
            dym = (jl * 30 * np.sin(tc * 23.0) * np.exp(-((tc * 3) % 1) * 3) + rl_ * 34 * np.sin(xs * 0.008 - tc * 3.2)) * gm
            img = cv2.remap(img.astype(np.float32), (xs - dxm).astype(np.float32), (ys - dym).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            if jl > 0.3 or sw_ > 0.3:
                k_ = int(1 + 10 * max(jl, sw_))
                img = cv2.blur(img, (k_ if sw_ > jl else 1, k_ if jl >= sw_ else 1))
            r = rng_at(813 + int(tc * 4))
            n = int(120 * max(jl, sw_, rl_))                    # dust shaken off the banks
            px, py = r.uniform(0, W, n), g + r.uniform(-30, 10, n)
            img = splat_points(img, px, py, np.tile(np.array([[0.45, 0.38, 0.28]], np.float32), (n, 1)) * 0.5, sigma=3.0)
        ah = L(ash)
        if ah > 0:                                             # ash and soot drifting down
            r = rng_at(812)
            n = int(900 * ah)
            px = (r.uniform(0, W, n) + 20 * np.sin(tc * 0.5 + r.uniform(0, 6, n))) % W
            py = (r.uniform(0, 1, n) + tc * r.uniform(0.03, 0.08, n)) % 1.0 * H
            img = splat_points(img, px, py, np.tile(np.array([[0.55, 0.52, 0.5]], np.float32), (n, 1)) * 0.6, sigma=1.6)
        bm = L(boom)
        if bm > 0:                                             # the sound: a pressure front sweeping in from the left
            fx0 = -W * 0.2 + bm * W * 1.5
            rr_ = np.hypot(xs - (fx0 - W * 0.8), (ys - g) * 1.0)
            band = np.exp(-((rr_ - W * 0.8) / 70.0) ** 2) * (ys < g + 4)
            img = img * (1 + 0.25 * band[..., None])
            puff = np.exp(-np.clip(fx0 - xs, 0, None) / 300.0) * (xs < fx0) * np.exp(-np.clip(g - ys, 0, None) / 120.0) * (ys < g + 6)
            img = img * (1 - 0.3 * puff[..., None]) + (puff * 0.45)[..., None] * np.array([0.55, 0.48, 0.40], np.float32)
            r5 = rng_at(814 + int(tc * 3))
            n5 = 400
            px5, py5 = r5.uniform(0, W, n5), g - r5.uniform(0, 160, n5)
            img = splat_points(img, px5, py5, np.tile(np.array([[0.5, 0.44, 0.36]], np.float32), (n5, 1)) * 0.7, sigma=3.5)
        z = lerp(zoom[0], zoom[1], e)
        sh = L(shake)
        if z != 1.0 or sh > 0:
            fx_, fy_ = focus[0] * W, focus[1] * H
            Mz = cv2.getRotationMatrix2D((fx_, fy_), 0, z)
            Mz[0, 2] += sh * 10 * np.sin(tc * 31) + (W / 2 - fx_) * (z - 1) / z
            Mz[1, 2] += sh * 7 * np.sin(tc * 23) + (H / 2 - fy_) * (z - 1) / z
            img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REFLECT)
            if sh > 0.2:
                k_ = int(1 + sh * 14)
                img = cv2.blur(img, (k_, max(1, k_ // 3)))
        return img, dict(exposure=1.15, bloom=0.3, grain=0.016)
    return f


# ============================================================================================================ storm
_treeline = lambda seed, amp, base: base - amp * (0.55 * cv2.resize(fbm(60, 1, scale=3, octaves=2, seed=seed), (W, 1))[0] + 0.45 * cv2.resize(fbm(900, 1, scale=60, octaves=2, seed=seed + 1), (W, 1))[0])


@functools.lru_cache(1)
def _storm_tex():
    return (cv2.resize(fbm(128, 128, scale=3, octaves=6, seed=901), (512, 512)).astype(np.float32),
            cv2.resize(fbm(128, 128, scale=6, octaves=5, seed=902), (512, 512)).astype(np.float32))


def _bolt(seed, x0, y0, x1, y1, depth=6):
    r = rng_at(seed)
    segs = [((x0, y0), (x1, y1), 3.0)]
    for d in range(depth):
        nxt = []
        for (a, b, w) in segs:
            mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            ln = np.hypot(b[0] - a[0], b[1] - a[1])
            mx += r.normal(0, ln * 0.18)
            nxt += [(a, (mx, my), w), ((mx, my), b, w)]
            if r.uniform() < 0.18 and d < 4:
                ang = np.arctan2(b[1] - a[1], b[0] - a[0]) + r.choice([-0.7, 0.7])
                nxt.append(((mx, my), (mx + np.cos(ang) * ln * 0.6, my + np.sin(ang) * ln * 0.6), w * 0.5))
        segs = nxt
    return segs


@scene_factory(keys=[])
def storm(view="window", strike=(1.0, 1.0), ring=(0.0, 0.0), thunder=(-1.0, -1.0), rain=1.0, zoom=(1.0, 1.0), pan=(0.0, 0.0), horizon=0.56):
    """Today: a summer storm over a lake, seen from a dark room through a rain-streaked window (view="window") or
    from the shore ("lake"). strike: seconds into the beat when lightning hits (<0: none); ring: the sound spreading
    from the strike across the water toward us (0..1 of the way); thunder: second it arrives (the glass shakes).
    horizon: where the far shore sits on screen (lower = more water)."""
    from ep_tanis.cine import riverbank, alt_to_y
    pitch = 2.0 - (0.56 - horizon) * 40.0
    base = riverbank(phase="dawn", view_az=(-24.0, -20.0), pitch=(pitch, pitch), fov=(62.0, 62.0), dark=(0.42, 0.42), mist=(0.25, 0.25),
                     sun_vis=0.0, cover=0.98, sun_alt=(-6.0, -6.0))

    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        e = ease(u)
        img, kw = base(ctx, t, u, fi)
        img = img * np.array([0.75, 0.85, 1.15], np.float32)               # cold storm light
        xs, ys = grid()
        fpx = (W / 2) / np.tan(np.radians(31.0))
        hz = alt_to_y(0.0, pitch, fpx)
        st = strike[0]
        fl = 0.0
        if st >= 0 and t >= st:
            dt_ = t - st
            fl = np.exp(-dt_ * 5) + 0.6 * np.exp(-(dt_ - 0.15) ** 2 * 400) + 0.3 * np.exp(-(dt_ - 0.32) ** 2 * 300)
        fl += sum(np.exp(-((tc - p0) * 9) ** 2) * a0 for p0, a0 in ((0.7, 0.3), (2.3, 0.2), (3.6, 0.35), (5.2, 0.25), (6.9, 0.3), (8.1, 0.2)))
        sky_m = clamp((hz - ys) / 40.0)
        img = img * (1 + fl * (1.5 + 2.5 * sky_m[..., None])) + fl * 0.04
        bx = W * 0.62
        if st >= 0 and t >= st and t - st < 0.45:
            lay = np.zeros((H, W), np.float32)
            for (a, b, w) in _bolt(905, bx, -20, bx + 40, hz - 12):
                cv2.line(lay, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), 1.0, max(1, int(w)), cv2.LINE_AA)
            k = clamp(1 - (t - st) / 0.45) ** 0.7
            img = img + (lay + fast_blur(lay, 10) * 2.5)[..., None] * np.array([0.85, 0.9, 1.0], np.float32) * 3.0 * k
        rg = lerp(ring[0], ring[1], e)
        if rg > 0:                                                         # the sound crossing the water toward us
            cx, cy = bx + 40, hz + 3
            rr = rg * W * 0.95
            sq = 1.0 / max(0.05, (0.56 - horizon) * 0.9 + 0.12)
            d = np.abs(np.hypot(xs - cx, (ys - cy) * sq) - rr)
            band = np.exp(-(d / 22.0) ** 2) * (ys > hz + 2)
            img = img * (1 + 0.5 * band[..., None]) + band[..., None] * np.array([0.55, 0.65, 0.9], np.float32) * 0.5
        r = rng_at(906)
        n = int(900 * rain)
        rx = (r.uniform(0, W, n) + tc * 60) % W
        ry = (r.uniform(0, H, n) + tc * r.uniform(900, 1400, n)) % H
        rl = np.zeros((H, W), np.float32)
        for x, y in zip(rx, ry):
            cv2.line(rl, (int(x), int(y)), (int(x - 6), int(y + 26)), 1.0, 1, cv2.LINE_AA)
        img = img + rl[..., None] * (0.12 + 0.2 * min(fl, 1.0))
        th = thunder[0]
        shake = np.exp(-(t - th) * 2.5) if (th >= 0 and t >= th) else 0.0
        if view == "window":
            frame = np.zeros((H, W), np.float32)
            frame[:int(H * 0.04)] = 1
            frame[int(H * 0.92):] = 1
            frame[:, :int(W * 0.04)] = 1
            frame[:, int(W * 0.96):] = 1
            frame[int(H * 0.465):int(H * 0.475), int(W * 0.04):int(W * 0.96)] = 1
            mug = np.zeros((H, W), np.float32)
            cv2.rectangle(mug, (int(W * 0.70), int(H * 0.83)), (int(W * 0.745), int(H * 0.92)), 1.0, -1, cv2.LINE_AA)
            cv2.ellipse(mug, (int(W * 0.752), int(H * 0.87)), (22, 28), 0, -90, 90, 1.0, 9, cv2.LINE_AA)
            rd = rng_at(907)
            m = 160
            dx_ = rd.uniform(W * 0.1, W * 0.9, m)
            dy_ = (rd.uniform(0, 1, m) * H * 0.8 + tc * rd.uniform(0, 30, m) * (rd.uniform(0, 1, m) < 0.3)) % (H * 0.78) + H * 0.08
            drops = np.zeros((H, W), np.float32)
            for x, y, s_ in zip(dx_, dy_, rd.uniform(2, 6, m)):
                cv2.circle(drops, (int(x), int(y)), int(s_), 1.0, -1, cv2.LINE_AA)
            drops = blur(drops, 1.2)
            img = img * (1 - 0.3 * drops[..., None]) + drops[..., None] * (0.06 + 0.5 * fl)
            pass                                               # no frame: the rain beading on the glass says "window"
        z = lerp(zoom[0], zoom[1], e)
        if z != 1.0 or shake > 0:
            Mz = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
            Mz[0, 2] += shake * 14 * np.sin(t * 41) + lerp(pan[0], pan[1], e)
            Mz[1, 2] += shake * 9 * np.sin(t * 33)
            img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REFLECT)
        return img, dict(kw, grain=0.03)
    return f


# ================================================================================================ water surface
@scene_factory(keys=[])
def water(hits=(0.0, 0.5), red=(0.3, 0.3), dust=(0.1, 0.1), view_az=(-8.0, -4.0), pitch=(-9.0, -10.0), fall=(0.0, 0.0), flicker=0.0):
    """At the riverbank, looking down at the water under the glowing, hazy sky: glass beads start to hit the surface,
    each a tiny splash and a spreading ring, slowly at first, then like the first drops of a shower. hits: rate 0..1."""
    from ep_tanis.cine import riverbank, alt_to_y

    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        base = riverbank(phase="after", view_az=view_az, pitch=pitch, fov=(56.0, 56.0), heat=(red[0] * 0.8, red[1] * 0.8),
                         dust=dust, mist=(0.0, 0.0), beads=(0.0, 0.0))
        img, kw = base(ctx, t, u, fi)
        e = ease(u)
        pt = lerp(pitch[0], pitch[1], e)
        fpx = (W / 2) / np.tan(np.radians(28.0))
        hz = alt_to_y(0.0, pt, fpx)
        rate = lerp(*hits, e)
        if rate > 0:
            r = rng_at(922)
            n = 500
            born = r.uniform(0, 1, n) * 40.0
            zw = r.uniform(4, 60, n)                     # metres away
            xw = r.uniform(-25, 25, n)
            cam_h = 2.0
            lay = np.zeros((H, W), np.float32)
            spl = np.zeros((H, W), np.float32)
            cyc = 2.2 + 6.0 * (1 - rate)
            for k in range(int(n * rate)):
                age = (tc - born[k]) % cyc
                if age > 2.2:
                    continue
                sy = hz + fpx * cam_h / zw[k]
                sx = W / 2 + xw[k] * fpx / zw[k]
                if not (0 < sx < W and hz < sy < H):
                    continue
                rad = age * 0.35 * fpx / zw[k]
                flat = cam_h / zw[k] * 1.6
                a = float(np.exp(-age * 1.5))
                cv2.ellipse(lay, (int(sx), int(sy)), (int(rad) + 1, int(rad * flat) + 1), 0, 0, 360, a, max(1, int(60 / zw[k])), cv2.LINE_AA)
                if age < 0.3:
                    hgt = (0.3 - age) * 18 * fpx / zw[k] * 0.1
                    cv2.line(spl, (int(sx), int(sy)), (int(sx), int(sy - hgt)), 1.0, max(1, int(40 / zw[k])), cv2.LINE_AA)
            sky = img[: max(1, int(hz)), :].mean((0, 1)) if hz > 1 else np.array([0.5, 0.4, 0.3], np.float32)
            img = img + blur(lay, 0.9)[..., None] * (sky * 2.4 + 0.12) + blur(spl, 0.8)[..., None] * np.array([0.8, 1.0, 0.9], np.float32) * 2.0
        if flicker > 0:                                # streaks overhead flaring: their light flickers across the water
            r4 = rng_at(924 + int(tc * 8))
            gl = np.zeros((H, W), np.float32)
            for _ in range(10):
                x_ = r4.uniform(0, W)
                cv2.line(gl, (int(x_), int(hz + 4)), (int(x_ + r4.uniform(-30, 30)), int(H)), float(r4.uniform(0.3, 1.0)), int(r4.uniform(3, 9)), cv2.LINE_AA)
            gl = fast_blur(gl, 6) * (grid()[1] > hz)
            img = img * (1 + flicker * 0.4 * (0.5 + 0.5 * np.sin(tc * 13))) + gl[..., None] * np.array([1.0, 0.75, 0.5], np.float32) * flicker * 0.8
        fa = max(rate, lerp(*fall, e))
        if fa > 0:                                     # beads drifting down through the air: short glowing streaks
            r2 = rng_at(923)
            m = int(260 * fa)
            gx = r2.uniform(0, W, m) + 12 * np.sin(tc * 0.4 + r2.uniform(0, 6, m))
            gy = (r2.uniform(0, 1, m) * H + tc * r2.uniform(60, 160, m)) % H
            gl = np.zeros((H, W), np.float32)
            for x_, y_ in zip(gx, gy):
                cv2.line(gl, (int(x_), int(y_ - 10)), (int(x_), int(y_)), 1.0, 2, cv2.LINE_AA)
            img = img + (gl + fast_blur(gl, 4) * 1.5)[..., None] * np.array([0.6, 1.0, 0.8], np.float32) * 0.8
        return img, dict(kw, exposure=kw.get("exposure", 1.15) * 1.35)
    return f


# ========================================================================================================== droplet
@scene_factory(keys=[])
def droplet(temp=(1.0, 0.0), reentry=(0.0, 0.0), spin=0.0, stream=1.0):
    """High above the planet: a drop of molten rock, glowing white-hot, cools as it flies into a bead of green glass
    (temp 1 -> 0); reentry 0..1 heats it again with a plasma trail as it falls back into the air. Earth's limb below."""
    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        e = ease(u)
        v = View(-52.0, -95.0, 2600.0, W / 2, H * 0.5 + 2600 + H * 0.28)
        img, _, _ = globe_base(v, tc, clouds=0.3)
        T = lerp(*temp, e)
        re = lerp(*reentry, e)
        # a stream of other droplets flying past (parallax), glowing by their own temperature
        r = rng_at(941)
        n = int(220 * stream)
        z = r.uniform(0.2, 1.0, n)
        px = (r.uniform(0, W, n) + tc * 300 * z) % (W + 200) - 100
        py = r.uniform(0, H * 0.7, n) - tc * 40 * z
        tt = clamp(T + r.uniform(-0.2, 0.2, n))
        col = np.stack([np.ones(n), 0.35 + 0.5 * tt, 0.1 + 0.6 * tt ** 2], 1).astype(np.float32) * (0.4 + 2.0 * tt[:, None]) * z[:, None]
        trail = np.zeros((H, W, 3), np.float32)
        for k_ in range(n):
            x_, y_ = px[k_], py[k_] % (H * 0.8)
            ln = 40 * z[k_]
            cv2.line(trail, (int(x_ - ln), int(y_ + ln * 0.13)), (int(x_), int(y_)), tuple(float(c) * 0.35 for c in col[k_]), max(1, int(3 * z[k_])), cv2.LINE_AA)
        img = img + fast_blur(trail, 2) + trail
        img = splat_points(img, px, py % (H * 0.8), col, sigma=1.4)
        # the hero droplet, flying left to right with a glowing wake
        cx, cy, R = W * 0.5 + 40 * np.sin(tc * 0.3), H * 0.42, 46
        wk = np.zeros((H, W), np.float32)
        cv2.line(wk, (int(cx - 520), int(cy + 70)), (int(cx), int(cy)), 1.0, int(R * 1.2), cv2.LINE_AA)
        wk = fast_blur(wk, 22)
        wc_ = np.array([1.0, 0.5, 0.2], np.float32) * T + np.array([0.25, 0.45, 0.35], np.float32) * (1 - T)
        img = img + wk[..., None] * wc_ * (0.25 + 0.65 * T) * (1 - clamp(lerp(*reentry, e) * 4))
        x0, x1, y0, y1 = _win(cx, cy, R * 6)
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        d = np.hypot(xx - cx, yy - cy) / R
        body = clamp((1 - d) * R / 2)
        hot = np.array([1.0, 0.45 + 0.5 * T, 0.12 + 0.75 * T ** 2], np.float32) * (0.4 + 3.0 * T)
        glass = np.array([0.08, 0.20, 0.14], np.float32)
        nz = np.sqrt(clamp(1 - d ** 2))
        shade = 0.35 + 0.65 * clamp((-(xx - cx) / R * 0.5 - (yy - cy) / R * 0.6 + nz * 0.6))
        c_ = glass * shade[..., None] * (1 - T) + hot * (0.8 + 0.2 * nz[..., None]) * T
        hl = np.exp(-(np.hypot(xx - (cx - R * 0.35), yy - (cy - R * 0.4)) / (R * 0.18)) ** 2) * (1 - T) * 0.9
        glow = np.exp(-np.clip(d - 1, 0, None) * 2.5) * (d > 1) * (T * 1.5 + re * 2.0)
        img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - body[..., None]) + body[..., None] * (c_ + hl[..., None]) \
            + glow[..., None] * np.array([1.0, 0.55, 0.25], np.float32)
        if re > 0:                                          # plasma trail streaming up behind it
            lay = np.zeros((H, W), np.float32)
            cv2.line(lay, (int(cx), int(cy - R * 0.5)), (int(cx + 120 * re), int(cy - 700 * re)), 1.0, int(R * 1.2), cv2.LINE_AA)
            lay = fast_blur(lay, 30) * re
            img = img + lay[..., None] * np.array([1.0, 0.6, 0.3], np.float32) * 1.5
        return img, dict(exposure=1.1, bloom=0.6, grain=0.012)
    return f


# =========================================================================================================== fossil
FOSSILS = [("paddle", 0.30, 0.26, 640, 3), ("sturgeon", 0.68, 0.34, 620, -2), ("paddle", 0.33, 0.47, 640, -2),
           ("sturgeon", 0.66, 0.57, 600, 2), ("paddle", 0.30, 0.70, 600, 1), ("sturgeon", 0.70, 0.80, 560, -1)]


@functools.lru_cache(2)
def _fossil_slab(beads_on=True):
    stone = cv2.resize(fbm(480, 270, scale=7, octaves=6, seed=951), (W, H))
    fine = cv2.resize(fbm(960, 540, scale=30, octaves=3, seed=953), (W, H))
    img = np.array([0.33, 0.30, 0.25], np.float32) * (0.78 + 0.35 * stone[..., None] + 0.1 * fine[..., None])
    crack = clamp((cv2.resize(fbm(320, 180, scale=3, octaves=4, seed=954), (W, H)) - 0.72) * 9)
    img = img * (1 - 0.35 * cv2.GaussianBlur(crack, (0, 0), 0.8)[..., None])
    relief = np.zeros((H, W), np.float32)
    lines = np.zeros((H, W), np.float32)
    eyes = []
    for kind, fx, fy, Lf, tilt in FOSSILS:
        m = put_fish(np.zeros((H, W, 3), np.float32), kind, fx * W, fy * H, Lf, 1, gape=0.0, tail=0.3, tone=1.0, tilt=tilt)
        a = clamp(m.mean(2) * 12)
        relief = np.maximum(relief, a)
        lines = np.maximum(lines, clamp((m.mean(2) < 0.35) * a))           # eye, gill cover, scutes stay dark
        eyes.append((fx * W + Lf * (0.065 if kind == "paddle" else 0.355), fy * H - Lf * 0.03))
    rb = cv2.GaussianBlur(relief, (0, 0), 1.6)
    gy, gx = np.gradient(rb)
    img = img * (1 + (-gy * 7 - gx * 4)[..., None]) * (0.92 + 0.14 * relief[..., None])
    img = img * (1 - 0.45 * cv2.GaussianBlur(lines, (0, 0), 0.8)[..., None])
    edge = clamp(relief - cv2.erode(relief, np.ones((3, 3), np.uint8)))
    img = img * (1 - 0.35 * edge[..., None])
    if beads_on:                                   # glass beads packed at the gills: dark, glossy, catching the light
        r = rng_at(952)
        for (kind, fx, fy, Lf, tilt), (ex, ey) in zip(FOSSILS, eyes):
            gx0 = ex - Lf * 0.07
            for _ in range(70):
                bx, by = gx0 + r.normal(0, Lf * 0.022), ey + Lf * 0.035 + r.normal(0, Lf * 0.02)
                rr = r.uniform(3.0, 5.5)
                x0, x1, y0, y1 = _win(bx, by, rr + 3)
                yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
                d = np.hypot(xx - bx, yy - by) / rr
                body = clamp((1 - d) * rr / 1.2)
                hl = np.exp(-(np.hypot(xx - (bx - rr * 0.35), yy - (by - rr * 0.35)) / (rr * 0.3)) ** 2)
                img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - body[..., None]) + body[..., None] * np.array([0.06, 0.11, 0.08], np.float32) \
                    + hl[..., None] * 0.55
    return img.astype(np.float32)


@scene_factory(keys=[], vectors=("focus",))
def fossil(zoom=(1.0, 1.15), focus=(0.5, 0.5), beads=1.0, life=(0.0, 0.0), sweep=(0.0, 0.0), glint=0.0):
    """The slab: grey mudstone with paddlefish and sturgeon lying in rows, whole, all pointing the same way (the way
    the water flowed), glass beads packed at their gills. life 0..1 dissolves stone into the living river; glint makes
    the beads twinkle (glass for its ticks)."""
    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        e = ease(u)
        img = _fossil_slab(beads > 0).copy()
        if glint > 0:
            r = rng_at(955)
            n = 90
            gx = r.uniform(0, W, n)
            gy = r.uniform(0, H, n)
            tw = np.clip(np.sin(tc * 3 + r.uniform(0, 6, n)), 0, 1) ** 6
            for (kind, fx, fy, Lf, tilt) in FOSSILS:
                pass
            ex = np.array([fx * W + Lf * (0.065 if k == "paddle" else 0.355) - Lf * 0.07 for k, fx, fy, Lf, tl in FOSSILS])
            ey = np.array([fy * H + Lf * 0.005 for k, fx, fy, Lf, tl in FOSSILS])
            sel = r.integers(0, len(FOSSILS), n)
            img = splat_points(img, ex[sel] + r.normal(0, 14, n), ey[sel] + r.normal(0, 12, n),
                               np.tile(np.array([[0.7, 1.0, 0.85]], np.float32), (n, 1)) * (tw * 2.5 * glint)[:, None], sigma=2.0)
        lf = lerp(*life, e)
        if lf > 0:
            live = underwater(tc, pan=tc * 30)
            for kind, fx, fy, Lf, tilt in FOSSILS[:3]:
                live = put_fish(live, kind, fx * W + tc * 30, fy * H, Lf, 1, gape=0.7 if kind == "paddle" else 0, tail=(tc * 1.3) % 2 - 1,
                                tone=_tone(fy * H), tint=_tint(0))
            img = img * (1 - lf) + live * lf
        sw = lerp(*sweep, e)
        if sw > 0:                                           # a raking light sweeping across, like a lamp over the slab
            xs, ys = grid()
            img = img * (1 + 0.45 * np.exp(-((xs - sw * W * 1.4 + W * 0.2) / 260) ** 2))[..., None]
        z = lerp(*zoom, e)
        if z != 1.0:
            k_ = clamp((z - 1.0) / 0.6)                        # source window centred on the focus, kept inside the slab
            cxs = float(np.clip(lerp(W / 2, focus[0] * W, k_), W / (2 * z), W - W / (2 * z))) if z > 1 else W / 2
            cys = float(np.clip(lerp(H / 2, focus[1] * H, k_), H / (2 * z), H - H / (2 * z))) if z > 1 else H / 2
            Mz = np.float32([[z, 0, W / 2 - z * cxs], [0, z, H / 2 - z * cys]])
            img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REPLICATE)
        return np.clip(img, 0, None), dict(exposure=1.2, bloom=0.25, grain=0.012)
    return f


# ========================================================================================================= badlands
@scene_factory(keys=[])
def badlands(push=(0.0, 0.2), diggers=1.0, pan=(0.0, 40.0), trench=1.0, night=0.0, argue=0.0):
    """North Dakota today: dry, striped badland hills under a big sky; a dig in the foreground cuts into the layer,
    with two people at work (kneeling, brushing) and survey flags."""
    def f(ctx, t, u, fi):
        e = ease(u)
        xs, ys = grid()
        z = lerp(1.0, 1.6, lerp(*push, e))
        px = lerp(*pan, e)
        X = (xs - W / 2) / z + W / 2 + px
        Y = (ys - H * 0.62) / z + H * 0.62
        sky = np.array([0.35, 0.55, 0.85], np.float32) * (0.6 + 0.4 * clamp(1 - Y / (H * 0.6))[..., None])
        cl = cv2.GaussianBlur(cv2.resize(fbm(160, 45, scale=2.5, octaves=5, seed=961), (W, H)), (0, 0), 8)
        ck = clamp((cl - 0.58) * 1.6) * clamp(1 - Y / (H * 0.55)) * 0.45
        sky = sky * (1 - 0.6 * ck[..., None]) + ck[..., None] * 0.9
        if night > 0:
            sky = sky * (1 - 0.9 * night) + np.array([0.02, 0.03, 0.07], np.float32) * night
            sx, sy, sb = _stars()
            sky = splat_points(sky.astype(np.float32), sx, sy * 0.5, np.repeat(sb[:, None], 3, 1).astype(np.float32) * night, sigma=0.7)
        img = sky
        # far buttes with horizontal stripes
        xr = np.arange(W)
        ridge = H * 0.47 - 90 * (np.sin(xr / 260.0 + 1) * 0.5 + 0.5) ** 2 - 60 * (np.sin(xr / 117.0 + 4) * 0.5 + 0.5) ** 3 \
            - 25 * cv2.resize(fbm(60, 1, scale=3, octaves=3, seed=962), (W, 1))[0]
        Xi = np.clip(X, 0, W - 1).astype(int)
        far = Y > ridge[Xi]
        stripes = 0.5 + 0.5 * np.sin(Y / 9.0 + 0.6 * cv2.resize(fbm(200, 120, scale=6, octaves=3, seed=963), (W, H)))
        rock = np.array([0.62, 0.52, 0.40], np.float32) * (0.75 + 0.25 * stripes[..., None])
        rock = np.where((stripes > 0.82)[..., None], np.array([0.30, 0.27, 0.25], np.float32), rock)      # dark lignite seams
        img = np.where(far[..., None], rock * (0.85 + 0.15 * clamp((Y - ridge[Xi]) / 200))[..., None], img)
        # near slope with sparse grass
        near = Y > H * 0.66 + 30 * np.sin(X * 0.004)
        grass = cv2.resize(fbm(480, 270, scale=20, octaves=3, seed=964), (W, H))
        ground = np.array([0.55, 0.47, 0.34], np.float32) * (0.8 + 0.3 * grass[..., None])
        ground = ground * (1 - 0.35 * clamp((grass - 0.55) * 4)[..., None]) + clamp((grass - 0.55) * 4)[..., None] * 0.35 * np.array([0.42, 0.45, 0.28], np.float32)
        img = np.where(near[..., None], ground, img)
        if trench > 0:                                         # the dig: a pit with the layers exposed
            tx0, tx1, ty0, ty1 = W * 0.30, W * 0.72, H * 0.70, H * 0.95
            sl_ = (Y - ty0) / (ty1 - ty0)
            pit = (X > tx0 + 60 * (1 - sl_)) & (X < tx1 - 60 * (1 - sl_)) & (Y > ty0) & (Y < ty1)
            ly = (Y - ty0) / (ty1 - ty0)
            pc = np.where((ly > 0.30)[..., None] & (ly < 0.36)[..., None], np.array([0.85, 0.62, 0.48], np.float32),
                          np.where((ly < 0.30)[..., None], np.array([0.18, 0.15, 0.12], np.float32), np.array([0.45, 0.40, 0.33], np.float32)))
            img = np.where(pit[..., None], pc * (0.85 + 0.2 * grass[..., None]), img)
            for fx_ in (0.27, 0.75):                               # survey flags
                x = (W * fx_ - px - W / 2) * z + W / 2
                y = (H * 0.70 - H * 0.62) * z + H * 0.62
                cv2.line(img, (int(x), int(y)), (int(x), int(y - 60 * z)), (0.2, 0.2, 0.2), max(1, int(2 * z)), cv2.LINE_AA)
                cv2.fillPoly(img, [np.array([(x, y - 60 * z), (x + 26 * z, y - 52 * z), (x, y - 44 * z)], np.int32)], (0.9, 0.35, 0.15), cv2.LINE_AA)
        if diggers > 0:                                         # two people at work: one kneeling with a brush, one standing with a shovel
            def person(cx_, base, h, kneel, shirt, k):
                head = (int(cx_), int(base - h * (0.62 if kneel else 0.93)))
                hip = (int(cx_ + (0.12 * h if kneel else 0)), int(base - h * (0.25 if kneel else 0.5)))
                sh = (int(cx_), int(base - h * (0.52 if kneel else 0.8)))
                cv2.line(img, sh, hip, shirt, max(3, int(h * 0.16)), cv2.LINE_AA)                       # torso
                cv2.circle(img, head, max(3, int(h * 0.08)), (0.55, 0.40, 0.30), -1, cv2.LINE_AA)       # head
                cv2.ellipse(img, (head[0], head[1] - int(h * 0.05)), (int(h * 0.13), int(h * 0.035)), 0, 0, 360, (0.80, 0.70, 0.45), -1, cv2.LINE_AA)  # hat
                if kneel:
                    cv2.line(img, hip, (int(cx_ - h * 0.15), int(base - h * 0.02)), (0.25, 0.25, 0.32), max(3, int(h * 0.12)), cv2.LINE_AA)
                    cv2.line(img, (int(cx_ - h * 0.15), int(base - h * 0.02)), (int(cx_ + h * 0.2), int(base)), (0.25, 0.25, 0.32), max(3, int(h * 0.1)), cv2.LINE_AA)
                    hand = (int(cx_ - h * 0.3 + 22 * np.sin(t * 7 + k)), int(base - h * 0.06))
                    cv2.line(img, sh, hand, shirt, max(2, int(h * 0.08)), cv2.LINE_AA)
                    cv2.line(img, hand, (hand[0] - int(h * 0.08), hand[1] + int(h * 0.04)), (0.85, 0.75, 0.5), max(2, int(h * 0.05)), cv2.LINE_AA)
                else:
                    for lx in (-0.06, 0.06):
                        cv2.line(img, hip, (int(cx_ + lx * h * 2), int(base)), (0.25, 0.25, 0.32), max(3, int(h * 0.1)), cv2.LINE_AA)
                    tip = (int(cx_ + h * 0.35), int(base - h * 0.02 - 30 * abs(np.sin(t * 2.5))))
                    cv2.line(img, sh, (int(cx_ + h * 0.2), int(base - h * 0.45)), shirt, max(2, int(h * 0.08)), cv2.LINE_AA)
                    cv2.line(img, (int(cx_ + h * 0.05), int(base - h * 0.75)), tip, (0.35, 0.25, 0.15), max(2, int(h * 0.04)), cv2.LINE_AA)
                    cv2.ellipse(img, tip, (int(h * 0.07), int(h * 0.04)), 20, 0, 360, (0.5, 0.5, 0.52), -1, cv2.LINE_AA)
            crew_ = ((0.44, True, (0.85, 0.45, 0.15)), (0.60, False, (0.20, 0.45, 0.70)))
            if argue > 0:
                crew_ = ((0.46, False, (0.85, 0.45, 0.15)), (0.56, False, (0.20, 0.45, 0.70)))
            for k, (fx_, kneel, shirt) in enumerate(crew_):
                x = (W * fx_ - px - W / 2) * z + W / 2
                base = (H * (0.90 if kneel else 0.88) - H * 0.62) * z + H * 0.62
                person(x, base, 230 * z, kneel, shirt, k)
                if argue > 0:                                  # a raised, gesturing arm toward the other person
                    hh = 230 * z
                    sx_, sy_ = int(x), int(base - hh * 0.8)
                    ang_ = (0.6 + 0.5 * np.sin(t * 4 + k * 2)) * (1 if k == 0 else -1)
                    cv2.line(img, (sx_, sy_), (int(sx_ + np.cos(ang_) * hh * 0.35 * (1 if k == 0 else -1)), int(sy_ - abs(np.sin(ang_)) * hh * 0.3)), shirt, max(2, int(hh * 0.07)), cv2.LINE_AA)
        return img, dict(exposure=1.1, bloom=0.25, grain=0.012)
    return f


def moving_star(x0=0.15, y0=0.12, x1=0.85, y1=0.3):
    """Overlay: a bright point crossing the night sky (Apophis seen from the ground in 2029)."""
    def f(ctx, img, t, u):
        x, y = lerp(x0, x1, u) * W, lerp(y0, y1, u) * H
        for k in range(12):
            q = k / 12
            img = glow_dot(img, x - (x1 - x0) * W * 0.05 * q, y - (y1 - y0) * H * 0.05 * q, 1.5, (0.9, 0.9, 1.0), 0.15 * (1 - q))
        return glow_dot(img, x, y, 3, (1.0, 0.97, 0.9), 1.0)
    return f


# ====================================================================================================== spring_wave
@scene_factory(keys=["kind"])
def spring_wave(kind="P", phase=(0.0, 1.0)):
    """Why the ground jolts, then shakes: P = a long spring squeezed at one end (the squeeze runs along it);
    S = a rope flicked at one end (the wiggle runs along it, side to side)."""
    def f(ctx, t, u, fi):
        tc = t + (ctx.seg["start"] + ctx.beat.t0 - ctx.run_t0)
        e = ease(u)
        xs, ys = grid()
        img = np.array([0.05, 0.03, 0.025], np.float32)[None, None] * (0.7 + 0.5 * clamp(1 - ys / H)[..., None])
        img = np.broadcast_to(img, (H, W, 3)).copy()
        x0, x1, yc = W * 0.08, W * 0.92, H * 0.5
        pos = lerp(*phase, e) * 1.3 - 0.15                     # where the pulse is along the spring/rope
        lay = np.zeros((H, W), np.float32)
        if kind == "P":
            n = 70
            s = np.linspace(0, 1, n)
            disp = -0.012 * np.exp(-((s - pos) / 0.06) ** 2) * np.sign(s - pos + 1e-9) * 2.5
            sc = s + disp * 0  # compress: coils bunch where the pulse is
            dens = 1 + 2.5 * np.exp(-((s - pos) / 0.05) ** 2)
            cum = np.cumsum(1 / dens)
            cum = (cum - cum[0]) / (cum[-1] - cum[0])
            th = np.linspace(0, n * 2 * np.pi, 1400)
            ss = th / th[-1]
            xx = x0 + (x1 - x0) * np.interp(ss, s, cum)
            yy = yc + 70 * np.sin(th)
            zz = np.cos(th)
            pts = np.stack([xx + 18 * zz, yy], 1)
            cv2.polylines(lay, [(pts * 16).astype(np.int32)], False, 1.0, 4, cv2.LINE_AA, shift=4)
            col = np.array([0.55, 0.9, 1.0], np.float32)
        else:
            s = np.linspace(0, 1, 600)
            yy = yc - 200 * np.exp(-((s - pos) / 0.06) ** 2) * np.sin(np.clip((s - pos) / 0.06 * 2.5 + 1.57, -1.57, 4.7))
            pts = np.stack([x0 + (x1 - x0) * s, yy], 1)
            cv2.polylines(lay, [(pts * 16).astype(np.int32)], False, 1.0, 10, cv2.LINE_AA, shift=4)
            col = np.array([1.0, 0.78, 0.35], np.float32)
        # a hand-like block at the start that pushes (P) or flicks (S)
        blk = np.zeros((H, W), np.float32)
        off = (15 * np.exp(-((pos + 0.1) / 0.05) ** 2)) if kind == "P" else 0
        dy = (-120 * np.exp(-((pos + 0.05) / 0.05) ** 2)) if kind == "S" else 0
        cv2.rectangle(blk, (int(x0 - 70 + off), int(yc - 90 + dy)), (int(x0 - 10 + off), int(yc + 90 + dy)), 1.0, -1, cv2.LINE_AA)
        img = img + (lay + fast_blur(lay, 8) * 1.2)[..., None] * col
        return img, dict(exposure=1.1, bloom=0.4, grain=0.015)
    return f



# ======================================================================================================= overlays
def birds(at=0.0, n=26, seed=1001):
    """Overlay: a flock bursting out of the trees and climbing away (dark V shapes)."""
    def f(ctx, img, t, u):
        if t < at:
            return img
        r = rng_at(seed)
        lay = np.zeros((H, W), np.float32)
        for k in range(n):
            tt = t - at - r.uniform(0, 0.6)
            if tt < 0:
                continue
            x = r.uniform(0.15, 0.85) * W + tt * r.uniform(-160, 160)
            y = H * r.uniform(0.40, 0.48) - tt * r.uniform(120, 260)
            wsz = r.uniform(7, 14) * (1 + tt * 0.15)
            fl = np.sin(tt * 18 + k) * 0.6
            pts = np.array([(x - wsz, y - wsz * fl), (x, y + wsz * 0.2), (x + wsz, y - wsz * fl)])
            cv2.polylines(lay, [(pts * 16).astype(np.int32)], False, 1.0, 2, cv2.LINE_AA, shift=4)
        return img * (1 - 0.85 * lay[..., None])
    return f


def flow_arrows(at=0.0, y0=0.18, n=3, color=(0.95, 0.95, 0.9)):
    """Overlay: arrows showing which way the water flowed."""
    def f(ctx, img, t, u):
        a = clamp((t - at) / 0.6)
        if a <= 0:
            return img
        lay = np.zeros((H, W), np.float32)
        for k in range(n):
            y = H * (y0 + 0.3 * k)
            x = W * 0.08 + ((t * 120) % 200)
            cv2.arrowedLine(lay, (int(x), int(y)), (int(x + 260), int(y)), 1.0, 4, cv2.LINE_AA, tipLength=0.25)
        return img + (lay * a * 0.6)[..., None] * np.array(color, np.float32)
    return f



def distance_ticks(n=1, horizon=0.56, at=0.2):
    """Overlay: a dotted line along the water from us to the strike, with one tick per kilometre (n ticks)."""
    def f(ctx, img, t, u):
        a = clamp((t - at) / 0.5)
        if a <= 0:
            return img
        from ep_tanis.cine import alt_to_y
        pitch = 2.0 - (0.56 - horizon) * 40.0
        hz = alt_to_y(0.0, pitch, (W / 2) / np.tan(np.radians(31.0)))
        x0, y0, x1, y1 = W * 0.5, H * 0.98, W * 0.62 + 40, hz + 4
        lay = np.zeros((H, W), np.float32)
        for k in range(40):
            q0, q1 = k / 40, (k + 0.5) / 40
            cv2.line(lay, (int(lerp(x0, x1, q0)), int(lerp(y0, y1, q0 ** 0.5))), (int(lerp(x0, x1, q1)), int(lerp(y0, y1, q1 ** 0.5))), 1.0, 2, cv2.LINE_AA)
        for k in range(1, n + 1):
            q = k / (n + 0.6)
            x, y = lerp(x0, x1, q), lerp(y0, y1, q ** 0.5)
            cv2.line(lay, (int(x - 18 * (1 - q) - 6), int(y)), (int(x + 18 * (1 - q) + 6), int(y)), 1.0, 3, cv2.LINE_AA)
        return img + (lay * a)[..., None] * np.array([1.0, 0.9, 0.6], np.float32) * 0.8
    return f


# ====================================================================================== beads among sand (scale)
@functools.lru_cache(1)
def _sand_bed():
    r = rng_at(1101)
    img = np.zeros((H, W, 3), np.float32) + np.array([0.30, 0.24, 0.16], np.float32)
    n = 1500
    xs_, ys_ = r.uniform(0, W, n), r.uniform(0, H, n)
    for x, y in zip(xs_, ys_):
        rr = r.uniform(18, 40)
        c = np.array([0.55, 0.45, 0.30], np.float32) * r.uniform(0.6, 1.2) + r.normal(0, 0.03, 3).astype(np.float32)
        pts = np.array([(x + rr * np.cos(a) * r.uniform(0.75, 1.1), y + rr * 0.8 * np.sin(a) * r.uniform(0.75, 1.1)) for a in np.linspace(0, 2 * np.pi, 9)], np.int32)
        cv2.fillPoly(img, [pts], tuple(float(v) for v in c), cv2.LINE_AA)
    img = cv2.GaussianBlur(img, (0, 0), 1.0)
    return img


@scene_factory(keys=[])
def beads_macro(zoom=(1.0, 1.12), n=7):
    """Extreme close-up: sand grains, and among them a few beads of green impact glass the same size: tiny, round,
    glassy, catching the light."""
    def f(ctx, t, u, fi):
        e = ease(u)
        img = _sand_bed().copy()
        r = rng_at(1102)
        for k in range(n):
            x, y, rr = r.uniform(W * 0.15, W * 0.85), r.uniform(H * 0.2, H * 0.8), r.uniform(26, 36)
            x0, x1, y0, y1 = _win(x, y, rr * 3)
            yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
            d = np.hypot(xx - x, yy - y) / rr
            body = clamp((1 - d) * rr / 1.5)
            shade = 0.5 + 0.5 * clamp(1 - d)
            hl = np.exp(-(np.hypot(xx - (x - rr * 0.35), yy - (y - rr * 0.38)) / (rr * 0.2)) ** 2)
            sh_ = np.exp(-(np.hypot(xx - (x + rr * 0.4), yy - (y + rr * 0.5)) / (rr * 0.9)) ** 2) * (d > 0.9)
            img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - 0.5 * sh_[..., None])
            img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - body[..., None]) + body[..., None] * np.array([0.10, 0.32, 0.20], np.float32) * shade[..., None] \
                + (hl * 1.2)[..., None]
        xs, ys = grid()                                # a fingertip pressing into the sand, for scale
        fx0, fy0 = W * 0.86, H * 0.62
        fm = clamp((1 - np.hypot((xs - fx0) / 330, (ys - fy0) / 230)) * 30)
        fm = np.maximum(fm, clamp((1 - np.abs(ys - fy0) / 230) * 30) * (xs > fx0))
        ridges = 0.5 + 0.5 * np.sin(np.hypot(xs - fx0 + 60, ys - fy0) / 9.0)
        skin = np.array([0.80, 0.55, 0.45], np.float32) * (0.75 + 0.2 * ridges[..., None]) * (0.7 + 0.3 * clamp((fx0 + 300 - xs) / 300)[..., None])
        img = img * (1 - fm[..., None]) + skin * fm[..., None]
        z = lerp(*zoom, e)
        Mz = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
        img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REFLECT)
        return img, dict(exposure=1.25, bloom=0.3, grain=0.012)
    return f


# ============================================================================================ species that vanish
def _sil_dino(m, cx, cy, s):
    body = np.array([(-1.0, 0.0), (-0.4, -0.35), (0.3, -0.38), (0.75, -0.2), (1.2, -0.75), (1.45, -0.8), (1.45, -0.68), (1.0, -0.15),
                     (0.85, 0.15), (0.5, 0.25), (-0.2, 0.2), (-1.7, 0.1)])
    cv2.fillPoly(m, [(np.array([(cx + x * s, cy + y * s) for x, y in body])).astype(np.int32)], 1.0, cv2.LINE_AA)
    for lx in (-0.25, 0.35):
        cv2.line(m, (int(cx + lx * s), int(cy + 0.15 * s)), (int(cx + (lx + 0.05) * s), int(cy + 0.9 * s)), 1.0, int(s * 0.16), cv2.LINE_AA)


def _sil_ptero(m, cx, cy, s):
    w_ = np.array([(-1.6, -0.2), (-0.2, 0.05), (0.0, -0.1), (0.25, 0.05), (1.6, -0.25), (0.3, 0.25), (0.0, 0.2), (-0.3, 0.25)])
    cv2.fillPoly(m, [(np.array([(cx + x * s, cy + y * s) for x, y in w_])).astype(np.int32)], 1.0, cv2.LINE_AA)
    cv2.fillPoly(m, [(np.array([(cx + x * s, cy + y * s) for x, y in [(0.0, -0.1), (0.6, -0.35), (0.1, 0.0)]])).astype(np.int32)], 1.0, cv2.LINE_AA)


def _sil_ammonite(m, cx, cy, s):
    th = np.linspace(0, 5 * np.pi, 200)
    rr = s * 0.08 * np.exp(0.16 * th)
    pts = np.stack([cx + rr * np.cos(th), cy + rr * np.sin(th)], 1).astype(np.int32)
    cv2.circle(m, (int(cx), int(cy)), int(rr[-1]), 1.0, -1, cv2.LINE_AA)
    cv2.polylines(m, [pts], False, 0.0, max(2, int(s * 0.05)), cv2.LINE_AA)


def _sil_mammal(m, cx, cy, s):
    cv2.ellipse(m, (int(cx), int(cy)), (int(s * 0.55), int(s * 0.3)), 0, 0, 360, 1.0, -1, cv2.LINE_AA)
    cv2.circle(m, (int(cx + s * 0.55), int(cy - s * 0.12)), int(s * 0.22), 1.0, -1, cv2.LINE_AA)
    cv2.line(m, (int(cx - s * 0.5), int(cy)), (int(cx - s * 1.2), int(cy - s * 0.3)), 1.0, max(2, int(s * 0.07)), cv2.LINE_AA)
    for lx in (-0.3, 0.3):
        cv2.line(m, (int(cx + lx * s), int(cy + s * 0.2)), (int(cx + lx * s), int(cy + s * 0.5)), 1.0, max(2, int(s * 0.09)), cv2.LINE_AA)


@scene_factory(keys=[])
def species(fade=(0.0, 1.0)):
    """Four kinds of life from that morning, lit as silhouettes: a dinosaur, a pterosaur, an ammonite, a small
    mammal. Three in four go dark (fade 0..1); only the little mammal stays lit."""
    def f(ctx, t, u, fi):
        e = ease(u)
        fd = lerp(*fade, e)
        xs, ys = grid()
        img = np.array([0.10, 0.08, 0.07], np.float32) * (0.6 + 0.6 * clamp(1 - np.hypot(xs - W / 2, ys - H / 2) / W)[..., None])
        img = np.broadcast_to(img, (H, W, 3)).copy()
        draws = [(_sil_dino, W * 0.20, H * 0.52, 120), (_sil_ptero, W * 0.42, H * 0.45, 110), (_sil_ammonite, W * 0.62, H * 0.52, 120),
                 (_sil_mammal, W * 0.82, H * 0.55, 90)]
        for k, (fn, cx, cy, sc_) in enumerate(draws):
            m = np.zeros((H, W), np.float32)
            fn(m, cx, cy, sc_)
            m = blur(m, 1.0)
            dead = fd if k < 3 else 0.0
            col = np.array([0.95, 0.78, 0.55], np.float32) * (1 - dead) + np.array([0.16, 0.14, 0.13], np.float32) * dead
            img = img * (1 - m[..., None]) + m[..., None] * col
            glow = fast_blur(m, 18) * (1 - dead) * 0.35
            img = img + glow[..., None] * np.array([1.0, 0.7, 0.4], np.float32)
        return img, dict(exposure=1.1, bloom=0.4, grain=0.015)
    return f



@scene_factory(keys=[])
def resin(flow=(0.0, 1.0), zoom=(1.0, 1.1)):
    """Close on a tree trunk: rough, deeply cracked bark, and on it several glossy drops of golden resin, a few with
    tiny green glass beads caught inside."""
    def f(ctx, t, u, fi):
        e = ease(u)
        xs, ys = grid()
        fib = cv2.resize(fbm(200, 40, scale=8, octaves=5, seed=1201), (W, H))
        cracks = clamp((cv2.resize(fbm(120, 24, scale=10, octaves=3, seed=1204), (W, H)) - 0.62) * 8)
        img = np.array([0.26, 0.18, 0.11], np.float32) * (0.6 + 0.6 * fib[..., None])
        img = img * (1 - 0.8 * cracks[..., None])                           # deep vertical fissures
        img = img * (0.7 + 0.45 * clamp(1 - np.abs(xs - W / 2) / (W * 0.6)))[..., None]   # the trunk curving away
        fl = lerp(*flow, e)
        r = rng_at(1205)
        for k in range(6):
            cx, cy = r.uniform(0.2, 0.8) * W, r.uniform(0.2, 0.7) * H
            rr = r.uniform(40, 95)
            m = np.zeros((H, W), np.float32)
            pts = [(cx + rr * np.cos(a) * r.uniform(0.8, 1.15), cy + rr * 0.85 * np.sin(a) * r.uniform(0.8, 1.15)) for a in np.linspace(0, 2 * np.pi, 10)]
            cv2.fillPoly(m, [np.array(pts, np.int32)], 1.0, cv2.LINE_AA)
            run = rr * (0.6 + 1.2 * fl) * r.uniform(0.5, 1.0)                # a drip running down
            cv2.line(m, (int(cx), int(cy)), (int(cx + r.uniform(-8, 8)), int(cy + rr * 0.6 + run)), 1.0, int(rr * 0.45), cv2.LINE_AA)
            m = blur(m, 4)
            dome = np.sqrt(clamp(1 - ((xs - cx) ** 2 + (ys - cy) ** 2) / (rr * rr)))
            amber = np.array([0.95, 0.55, 0.10], np.float32) * (0.45 + 0.7 * dome[..., None])
            img = img * (1 - 0.85 * m[..., None]) + amber * 0.85 * m[..., None]
            hl = np.exp(-(((xs - cx + rr * 0.35) / (rr * 0.18)) ** 2 + ((ys - cy + rr * 0.35) / (rr * 0.12)) ** 2))
            img = img + (hl * m)[..., None] * 0.9
            if k % 2 == 0:
                for q in range(3):
                    img = glow_dot(img, cx + r.uniform(-rr, rr) * 0.4, cy + r.uniform(-rr, rr) * 0.3, 4, (0.2, 0.6, 0.35), 0.9)
        z = lerp(*zoom, e)
        Mz = cv2.getRotationMatrix2D((W / 2, H * 0.45), 0, z)
        img = cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REPLICATE)
        return img, dict(exposure=1.2, bloom=0.4, grain=0.014)
    return f



def fireball_horizon(y=0.5, at=0.0, rise=(0.2, 1.0)):
    """Overlay: the top of the impact fireball, a glowing mushroom cloud, rising over the southern horizon."""
    def f(ctx, img, t, u):
        q = lerp(rise[0], rise[1], u)
        cx, base = W * 0.5, H * y
        h = 260 * q
        lay = np.zeros((H, W), np.float32)
        cv2.ellipse(lay, (int(cx), int(base - h)), (int(170 * q + 40), int(80 * q + 20)), 0, 180, 360, 1.0, -1, cv2.LINE_AA)
        cv2.rectangle(lay, (int(cx - 40 * q - 10), int(base - h)), (int(cx + 40 * q + 10), int(base)), 1.0, -1, cv2.LINE_AA)
        lay = blur(lay, 18)
        return img * (1 - 0.2 * lay[..., None]) + lay[..., None] * np.array([1.0, 0.62, 0.32], np.float32) * 0.85
    return f


def flares(at=0.2):
    """Overlay: a few streaks flaring bright and splitting in two."""
    def f(ctx, img, t, u):
        lay = np.zeros((H, W), np.float32)
        r = rng_at(1301)
        for k in range(4):
            x0, y0 = r.uniform(0.2, 0.8) * W, r.uniform(0.05, 0.3) * H
            q = clamp((t - at - k * 0.6) / 1.2)
            if q <= 0:
                continue
            x1, y1 = x0 + 260 * q, y0 + 160 * q
            cv2.line(lay, (int(x0), int(y0)), (int(x1), int(y1)), 1.0, 3, cv2.LINE_AA)
            if q > 0.6:
                for d in (-1, 1):
                    cv2.line(lay, (int(x1), int(y1)), (int(x1 + 120 * (q - 0.6) * 2), int(y1 + d * 50 * (q - 0.6) * 2 + 40 * (q - 0.6))), 1.0, 2, cv2.LINE_AA)
            cv2.circle(lay, (int(x1), int(y1)), int(6 + 16 * np.sin(np.pi * q)), 1.0, -1, cv2.LINE_AA)
        g = lay + fast_blur(lay, 10) * 2
        return img + g[..., None] * np.array([1.0, 0.85, 0.6], np.float32)
    return f



def count_ticks(seconds=(0.0, 9.0), horizon=0.5, big=True):
    """Overlay: a stopwatch counting seconds and, for every 3 s counted, one more kilometre tick along the water
    toward the strike: the count turns into distance."""
    from ep_tanis.cine import _dial, alt_to_y
    def f(ctx, img, t, u):
        sec = lerp(seconds[0], seconds[1], u)
        img = _dial(img, sec / 60.0, W * 0.5, H * 0.28, 110, 1.0, True)
        pitch = 2.0 - (0.56 - horizon) * 40.0
        hz = alt_to_y(0.0, pitch, (W / 2) / np.tan(np.radians(31.0)))
        x0, y0, x1, y1 = W * 0.5, H * 0.98, W * 0.62 + 40, hz + 4
        n = int(sec // 3)
        lay = np.zeros((H, W), np.float32)
        for k in range(1, n + 1):
            q = min(0.95, k / 4.0)
            x, y = lerp(x0, x1, q), lerp(y0, y1, q ** 0.5)
            cv2.circle(lay, (int(x), int(y)), int(12 * (1 - q) + 6), 1.0, -1, cv2.LINE_AA)
            if k > 1:
                qp = min(0.95, (k - 1) / 4.0)
                cv2.line(lay, (int(lerp(x0, x1, qp)), int(lerp(y0, y1, qp ** 0.5))), (int(x), int(y)), 0.7, 3, cv2.LINE_AA)
        return img + (lay + fast_blur(lay, 6))[..., None] * np.array([1.0, 0.85, 0.4], np.float32) * 0.9
    return f


def leaves(at=0.0, n=160, seed=1401):
    """Overlay: leaves and twigs shaken out of the trees, falling."""
    def f(ctx, img, t, u):
        if t < at:
            return img
        r = rng_at(seed)
        lay = np.zeros((H, W), np.float32)
        for k in range(n):
            tt = t - at - r.uniform(0, 0.8)
            if tt < 0:
                continue
            x = r.uniform(0, W) + 30 * np.sin(tt * 3 + k)
            y = H * r.uniform(0.15, 0.4) + tt * r.uniform(90, 200)
            if y > H:
                continue
            a = tt * 4 + k
            cv2.ellipse(lay, (int(x), int(y)), (int(r.uniform(4, 9)), int(r.uniform(2, 4))), np.degrees(a), 0, 360, 1.0, -1, cv2.LINE_AA)
        return img * (1 - 0.85 * lay[..., None]) + lay[..., None] * np.array([0.10, 0.12, 0.05], np.float32)
    return f



def dial_top(span_min=(140.0, 151.7), y=0.18, R=80):
    """Overlay: the count as a stopwatch at the top of the frame, its ring closing at 2 h 32 min."""
    from ep_tanis.cine import _dial
    def f(ctx, img, t, u):
        return _dial(img, lerp(span_min[0], span_min[1], u), W * 0.5, H * y, R, 1.0, False)
    return f


# ======================================================================================== the storm rule, drawn
@scene_factory(keys=[])
def thunder_diagram(sound=(0.0, 1.0), flash=(1.0, 0.0), km=3, show_watch=1.0, shake_at=1.0):
    """Side-on explainer: a storm cloud strikes the ground on the left; a house with a lit window on the right, km
    away. The flash reaches the window at once (a bright line); the sound spreads out in arcs, slowly, lighting up
    each kilometre tick as it passes; a stopwatch above counts the seconds (3 s per km). sound: 0..1 of the way to
    the house; when it arrives the house shakes."""
    from ep_tanis.cine import _dial
    def f(ctx, t, u, fi):
        e = ease(u)
        xs, ys = grid()
        img = np.array([0.03, 0.04, 0.09], np.float32) * (0.6 + 0.8 * clamp(ys / H)[..., None])
        img = np.broadcast_to(img, (H, W, 3)).copy()
        gy = H * 0.76
        img = np.where((ys > gy)[..., None], np.array([0.05, 0.07, 0.04], np.float32), img)
        kmi = max(1, int(round(km)))
        x0, x1 = W * 0.14, W * 0.14 + (W * 0.70) * (km / 3.0) * 0.9
        x1 = min(x1, W * 0.88)
        sn = lerp(*sound, e)
        fl = lerp(*flash, e)
        lay = np.zeros((H, W), np.float32)
        # cloud and bolt
        for dx, dy, rx, ry in ((-60, 0, 120, 55), (40, -20, 110, 60), (120, 10, 90, 45), (-130, 15, 80, 40)):
            cv2.ellipse(img, (int(x0 + dx), int(H * 0.2 + dy)), (rx, ry), 0, 0, 360, (0.16, 0.17, 0.22), -1, cv2.LINE_AA)
        if fl > 0.05:
            for (a, b, w) in _bolt(911, x0, H * 0.24, x0 + 10, gy):
                cv2.line(lay, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), 1.0, max(1, int(w)), cv2.LINE_AA)
            img = img + (lay + fast_blur(lay, 8) * 2)[..., None] * np.array([0.85, 0.9, 1.0], np.float32) * 2.5 * fl
            # the light reaching the window at once
            ll = np.zeros((H, W), np.float32)
            cv2.line(ll, (int(x0 + 10), int(gy - 60)), (int(x1 - 30), int(gy - 95)), 1.0, 4, cv2.LINE_AA)
            img = img + (ll + fast_blur(ll, 6))[..., None] * np.array([1.0, 0.95, 0.7], np.float32) * fl
        # the house (shakes when the sound arrives)
        shk = 8 * np.sin(t * 40) * clamp((sn - 0.98) * 50) * shake_at
        hx = x1 + shk
        cv2.rectangle(img, (int(hx - 30), int(gy - 120)), (int(hx + 110), int(gy)), (0.12, 0.10, 0.09), -1, cv2.LINE_AA)
        cv2.fillPoly(img, [np.array([(hx - 45, gy - 120), (hx + 40, gy - 190), (hx + 125, gy - 120)], np.int32)], (0.14, 0.11, 0.10), cv2.LINE_AA)
        cv2.rectangle(img, (int(hx - 10), int(gy - 100)), (int(hx + 30), int(gy - 60)), (0.95, 0.80, 0.45), -1, cv2.LINE_AA)
        cv2.circle(img, (int(hx + 10), int(gy - 82)), 9, (0.10, 0.08, 0.07), -1, cv2.LINE_AA)          # someone at the window
        # sound: arcs spreading from the strike, slowly
        sl = np.zeros((H, W), np.float32)
        R = sn * (x1 - x0)
        for k in range(4):
            rr = R - k * 40
            if rr > 5:
                cv2.ellipse(sl, (int(x0), int(gy)), (int(rr), int(rr)), 0, 180, 360, max(0.0, 1.0 - k * 0.25), 3, cv2.LINE_AA)
        img = img + (sl + fast_blur(sl, 5))[..., None] * np.array([0.55, 0.75, 1.0], np.float32) * 0.9
        # km ticks on the ground: light up as the sound passes
        tl = np.zeros((H, W), np.float32)
        for k in range(1, kmi + 1):
            xk = x0 + (x1 - x0) * k / kmi
            on = 1.0 if R >= (x1 - x0) * k / kmi - 2 else 0.35
            cv2.line(tl, (int(xk), int(gy + 6)), (int(xk), int(gy + 40)), on, 5, cv2.LINE_AA)
        cv2.line(tl, (int(x0), int(gy + 22)), (int(x1), int(gy + 22)), 0.35, 2, cv2.LINE_AA)
        img = img + tl[..., None] * np.array([1.0, 0.85, 0.4], np.float32)
        if show_watch > 0:
            img = _dial(img, sn * km * 3.0 / 60.0, W * 0.5, H * 0.2, 80, show_watch, True)
        return img, dict(exposure=1.15, bloom=0.4, grain=0.012)
    return f
