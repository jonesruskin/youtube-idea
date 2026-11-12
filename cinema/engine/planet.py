"""Ray-cast textured planets with lighting, atmosphere, night lights, clouds and ocean glint."""
import os
import numpy as np
import cv2
from .core import TEX, clamp, smooth, span, blur, fast_blur

_TEX = {}
_CITYN = None
_GRAN = None


def tex(name, width=4096):
    k = (name, width)
    if k not in _TEX:
        img = cv2.imread(os.path.join(TEX, name), cv2.IMREAD_UNCHANGED)
        if img.ndim == 3 and img.shape[2] >= 3:
            img = img[..., :3][..., ::-1]
        img = img.astype(np.float32) / 255.0
        if img.shape[1] > width:
            img = cv2.resize(img, (width, width // 2), interpolation=cv2.INTER_AREA)
        # srgb → linear-ish
        img = np.power(img, 2.2)
        _TEX[k] = np.ascontiguousarray(img)
    return _TEX[k]


def _rot(nx, ny, nz, tilt, lon):
    # tilt about x-axis (camera looks along -z), then spin about the planet's y-axis
    ct, st = np.cos(tilt), np.sin(tilt)
    y1 = ny * ct - nz * st
    z1 = ny * st + nz * ct
    lat = np.arcsin(np.clip(y1, -1, 1))
    lo = np.arctan2(nx, z1) + lon
    return lat, lo


def render_planet(out, cx, cy, R, body="earth", spin=0.0, tilt=0.35, light=(-0.6, 0.25, 0.75),
                  night=1.0, clouds=True, atmo=None, ice=0.0, scorch=0.0, lights_fade=1.0, exposure=1.0, roll=0.0,
                  stretch=1.0, emit=None, lights_cut=0.0):
    """Composite a lit planet into `out` (HxWx3 float, additive-aware). Returns (out, alpha)."""
    H, W = out.shape[:2]
    pad = int(R * 0.25 * max(1.0, stretch)) + int(R * (max(1.0, stretch) - 1)) + 6
    x0, x1 = int(max(0, cx - R - pad)), int(min(W, cx + R + pad))
    y0, y1 = int(max(0, cy - R - pad)), int(min(H, cy + R + pad))
    if x1 <= x0 or y1 <= y0:
        return out, np.zeros((H, W), np.float32)
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = (xs - cx) / R, -(ys - cy) / R
    if stretch != 1.0:
        dx = dx / stretch
        dy = dy * stretch ** 0.5
    if roll:
        cr, sr = np.cos(roll), np.sin(roll)
        dx, dy = dx * cr - dy * sr, dx * sr + dy * cr
    r2 = dx * dx + dy * dy
    r = np.sqrt(r2)
    inside = r2 < 1
    nz = np.sqrt(np.maximum(0, 1 - r2))
    lat, lo = _rot(dx, dy, nz, tilt, spin)
    L = np.asarray(light, np.float32)
    L = L / np.linalg.norm(L)
    ndl = dx * L[0] + dy * L[1] + nz * L[2]
    tw = 4096 if R > 300 else 2048
    names = dict(earth="8k_earth_daymap.jpg", neptune="2k_neptune.jpg", jupiter="8k_jupiter.jpg", moon="8k_moon.jpg",
                 mars="2k_mars.jpg", saturn="8k_saturn.jpg", uranus="2k_uranus.jpg", sun="2k_sun.jpg", venus="2k_venus_atmosphere.jpg", mercury="2k_mercury.jpg")
    day = tex(names[body], tw)
    th, twd = day.shape[:2]
    u = ((lo / (2 * np.pi)) % 1.0) * twd
    v = (0.5 - lat / np.pi) * th
    mu, mv = u.astype(np.float32), np.clip(v, 0, th - 1).astype(np.float32)
    col = cv2.remap(day, mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    if body == "earth":
        ocean = clamp((col[..., 2] - col[..., 0] * 1.1) * 6.0)
        if ice > 0:
            icecol = np.array([0.82, 0.88, 0.95], np.float32)
            n = cv2.remap(tex("8k_earth_clouds.jpg", tw), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)[..., :1]
            front = clamp((np.abs(lat)[..., None] / (np.pi / 2) - (1 - ice * 1.15)) * 5 + n * 0.6 - 0.2)
            col = col * (1 - front) + icecol * front * (0.85 + 0.15 * n)
            ocean = ocean * (1 - front[..., 0])
        if scorch > 0:
            col = col * (1 - 0.55 * scorch) + np.array([0.5, 0.36, 0.2], np.float32) * 0.55 * scorch
        if clouds:
            cl = cv2.remap(tex("8k_earth_clouds.jpg", tw), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)[..., 0]
            cl = clamp(cl * (1.2 + scorch * 1.5))[..., None]
            ccol = np.array([1.0, 1.0, 1.0], np.float32) if scorch <= 0 else np.array([1.0, 0.86, 0.7], np.float32)
            col = col * (1 - cl) + ccol * cl
            ocean = ocean * (1 - cl[..., 0])
    else:
        ocean = None
    # lighting
    terminator = smooth(span(ndl, -0.08, 0.35))
    diffuse = np.maximum(ndl, 0) ** 0.85 * 1.15
    lit = col * (diffuse * terminator)[..., None] * 1.6 * exposure
    if body == "earth" and ocean is not None:
        hx, hy, hz = L[0], L[1], L[2] + 1.0
        hn = np.sqrt(hx * hx + hy * hy + hz * hz)
        ndh = (dx * hx + dy * hy + nz * hz) / hn
        spec = np.maximum(ndh, 0) ** 160 * 0.9 + np.maximum(ndh, 0) ** 24 * 0.035
        lit += (spec * ocean * terminator)[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
        if night > 0:
            nl = cv2.remap(tex("8k_earth_nightmap.jpg", tw), mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
            dark = (1 - smooth(span(ndl, -0.15, 0.1)))[..., None]
            if lights_cut > 0:
                global _CITYN
                if _CITYN is None:
                    from .core import fbm
                    _CITYN = fbm(2048, 1024, scale=7, seed=55, octaves=2)
                cn = cv2.remap(_CITYN, (mu * 2048 / twd).astype(np.float32), (mv * 1024 / th).astype(np.float32), cv2.INTER_NEAREST, borderMode=cv2.BORDER_WRAP)
                nl = nl * (cn > lights_cut)[..., None]
            lit += nl * dark * np.array([1.6, 1.15, 0.65], np.float32) * night * lights_fade * 2.2
    if emit is not None:
        etex, ecol, estr = emit
        ev = cv2.remap(etex, (mu * etex.shape[1] / twd).astype(np.float32), (mv * etex.shape[0] / th).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        lit += ev[..., None] * np.asarray(ecol, np.float32) * estr
    # limb darkening for gas giants
    if body in ("neptune", "jupiter", "uranus", "saturn"):
        lit *= (0.55 + 0.45 * nz ** 0.5)[..., None]
    # atmosphere
    if atmo is None:
        atmo = dict(earth=(0.35, 0.6, 1.0), neptune=(0.35, 0.55, 1.0), jupiter=(1.0, 0.85, 0.65), uranus=(0.6, 0.9, 1.0)).get(body)
    a_edge = clamp(R - r * R + 0.5)  # antialiased disk
    alpha = a_edge * inside + a_edge * (~inside)
    alpha = clamp(alpha)
    region = out[y0:y1, x0:x1]
    lit = np.where(inside[..., None], lit, 0)
    region = region * (1 - alpha[..., None]) + lit * alpha[..., None]
    if atmo is not None:
        ac = np.asarray(atmo, np.float32)
        sun_side = smooth(span(ndl + (1 - nz) * 0.0, -0.3, 0.6))
        # in-disk rim scattering
        rim = ((1 - nz) ** 3.0) * inside * (0.25 + 1.2 * sun_side) * (1.0 if body in ('earth', 'neptune') else 0.35)
        region += rim[..., None] * ac * 0.9
        # outer halo
        h = np.exp(-np.maximum(r - 1, 0) * R / (R * 0.035 + 2)) * (r >= 0.985)
        # light direction for halo: project light onto screen plane
        ang_l = np.clip((dx * L[0] + dy * L[1]) / (r + 1e-6), -1, 1)
        halo_light = smooth(span(ang_l * min(1.0, np.hypot(L[0], L[1]) * 1.4) + L[2] * 0.6, -0.4, 0.9))
        region += (h * halo_light)[..., None] * ac * (0.9 if body in ('earth', 'neptune') else 0.3)
    out[y0:y1, x0:x1] = region
    full_alpha = np.zeros((H, W), np.float32)
    full_alpha[y0:y1, x0:x1] = alpha * inside + 0 * alpha
    return out, full_alpha


def render_sun_disk(out, cx, cy, R, t, filter_look=True):
    """The Sun seen through a solar filter: textured, limb-darkened, granulated."""
    H, W = out.shape[:2]
    pad = int(R * 0.6)
    x0, x1 = int(max(0, cx - R - pad)), int(min(W, cx + R + pad))
    y0, y1 = int(max(0, cy - R - pad)), int(min(H, cy + R + pad))
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = (xs - cx) / R, (ys - cy) / R
    r2 = dx * dx + dy * dy
    r = np.sqrt(r2)
    nz = np.sqrt(np.maximum(0, 1 - r2))
    lat, lo = _rot(dx, -dy, nz, 0.1, t * 0.02)
    s = tex("2k_sun.jpg", 2048)
    u = ((lo / (2 * np.pi)) % 1.0) * s.shape[1]
    v = (0.5 - lat / np.pi) * s.shape[0]
    c = cv2.remap(s, u.astype(np.float32), np.clip(v, 0, s.shape[0] - 1).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    lum = c.mean(-1)
    lum = (lum - lum.mean()) * 0.35
    global _GRAN
    if _GRAN is None:
        from .core import fbm
        _GRAN = (fbm(1024, 1024, scale=6, seed=91, octaves=3) * 0.6 + fbm(1024, 1024, scale=60, seed=92, octaves=4) * 0.4)
    gu = ((lo / (2 * np.pi)) % 1.0) * 1023
    gv = np.clip((0.5 - lat / np.pi) * 1023, 0, 1023)
    gran = cv2.remap(_GRAN, gu.astype(np.float32), gv.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    limb = (0.25 + 0.75 * nz ** 0.75)
    base = np.array([1.0, 0.5, 0.14], np.float32)
    col = base[None, None] * (0.9 + 0.35 * (gran[..., None] - 0.5) + lum[..., None]) * limb[..., None] * 1.25
    # a couple of sunspots
    for (slat, slon, ssz) in ((0.25, 0.6, 0.05), (0.22, 0.75, 0.03), (-0.2, 2.4, 0.04)):
        dd = np.sqrt((lat - slat) ** 2 + (((lo - slon + np.pi) % (2 * np.pi)) - np.pi) ** 2 * np.cos(slat) ** 2)
        col *= (1 - 0.75 * np.exp(-(dd / ssz) ** 2) - 0.25 * np.exp(-(dd / (ssz * 2.2)) ** 2))[..., None]
    a = clamp(R - r * R + 0.5)
    region = out[y0:y1, x0:x1]
    region = region * (1 - a[..., None]) + col * a[..., None]
    glow = np.exp(-np.maximum(r - 1, 0) * 9) * (r >= 0.99) * 0.35
    region += glow[..., None] * np.array([1.0, 0.35, 0.05], np.float32)
    out[y0:y1, x0:x1] = region
    return out


def render_rings(out, cx, cy, R, tilt=0.32, front=True, roll=-0.12, exposure=1.0):
    """Saturn's rings (texture radial profile), split into back/front halves around the planet."""
    H, W = out.shape[:2]
    rt = cv2.imread(os.path.join(TEX, "8k_saturn_ring_alpha.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
    prof = cv2.resize(rt, (1024, 1), interpolation=cv2.INTER_AREA)[0]  # BGRA
    col = np.power(prof[:, :3][:, ::-1], 2.2)
    alp = prof[:, 3]
    r_in, r_out = 1.24, 2.27
    ext = int(R * r_out) + 4
    x0, x1 = int(max(0, cx - ext)), int(min(W, cx + ext))
    y0, y1 = int(max(0, cy - ext)), int(min(H, cy + ext))
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = (xs - cx) / R, (ys - cy) / R
    cr, sr = np.cos(roll), np.sin(roll)
    u, v = dx * cr + dy * sr, -dx * sr + dy * cr
    rr = np.sqrt(u ** 2 + (v / np.sin(tilt)) ** 2)
    k = clamp((rr - r_in) / (r_out - r_in))
    idx = (k * 1023).astype(np.int32)
    a = alp[idx] * ((rr > r_in) & (rr < r_out))
    c = col[idx] * 1.3 * exposure
    # light falloff on the far side and planet shadow on the rings (behind the planet, to the right)
    sel = (v > 0) if front else (v <= 0)
    if front:
        a = a * sel
    else:
        a = a * sel * (1 - (np.abs(u) < 1.0) * (v > -np.sqrt(np.maximum(0, 1 - u ** 2)) * 1.0) * 0)
    shadow = 1 - 0.85 * ((u > 0) & (np.abs(v / np.sin(tilt)) < 1.0) & (~sel if False else True) & (u < 2.3)) * (np.abs(v / np.sin(tilt)) < np.sqrt(np.maximum(0, 1 - 0))) * 0
    reg = out[y0:y1, x0:x1]
    out[y0:y1, x0:x1] = reg * (1 - a[..., None] * 0.92) + c * a[..., None]
    return out


_COAST = None


def coast_mask():
    """Coastline glow map (equirectangular, 2048x1024) derived from the day texture's ocean colour."""
    global _COAST
    if _COAST is None:
        d = tex("8k_earth_daymap.jpg", 2048)
        ocean = ((d[..., 2] - d[..., 0] * 1.1) > 0.02).astype(np.uint8)
        ocean = cv2.morphologyEx(ocean, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        edge = cv2.morphologyEx(ocean, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
        _COAST = np.clip(cv2.GaussianBlur(edge, (0, 0), 1.2) * 2.5, 0, 1)
    return _COAST
