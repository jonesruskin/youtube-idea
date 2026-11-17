"""A real 3D camera for space scenes: perspective projection, an all-sky star sphere that rotates with the camera,
textured planets placed by their true 3D positions (lit from wherever the Sun really is), glowing 3D orbit lines,
the Sun with glare and lens flare, and a ground-level sky (horizon, daylight, dusk, night) for views from a planet.

Units are arbitrary but consistent per shot (km for close work, AU for the Solar System). Camera space: x right,
y up, z toward the viewer (render_planet's lighting convention), so a body's light vector is the camera-space
direction from the body to the Sun."""
import numpy as np
import cv2
from .core import W, H, clamp, smooth, span, lerp, glow_dot, star_spikes, fast_blur, cached, splat_points, star_color
from .planet import render_planet, render_sun_disk

SKY_W, SKY_H = 8192, 4096


# ═══════════════════════════ the star sphere ═══════════════════════════
def _waves(d, n, fmin, fmax, seed):
    """Smooth periodic noise on the sphere: a sum of random plane waves of the 3D direction."""
    rng = np.random.default_rng(seed)
    out = np.zeros(d.shape[:-1], np.float32)
    amp = 0.0
    for k in range(n):
        f = fmin * (fmax / fmin) ** (k / max(1, n - 1))
        v = rng.normal(size=3)
        v /= np.linalg.norm(v)
        a = 1.0 / f ** 0.6
        out += a * np.sin(f * (d @ v) + rng.uniform(0, 2 * np.pi)).astype(np.float32)
        amp += a
    return out / amp


def _build_sky():
    w, h = SKY_W // 2, SKY_H // 2
    lon = (np.arange(w, dtype=np.float32) + 0.5) / w * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(h, dtype=np.float32) + 0.5) / h * np.pi
    LO, LA = np.meshgrid(lon, lat)
    d = np.stack([np.cos(LA) * np.sin(LO), np.sin(LA), np.cos(LA) * np.cos(LO)], -1).astype(np.float32)
    # the galactic plane is tilted 60° to our default horizon
    tilt = np.radians(60)
    g = d @ np.array([0.0, np.cos(tilt), np.sin(tilt)], np.float32)                 # sin(galactic latitude)
    warp = _waves(d, 14, 2.0, 9.0, 1) * 0.10
    prof = np.exp(-((g + warp) ** 2) / (2 * 0.13 ** 2))
    gc = d @ np.array([0.85, -0.3, 0.43], np.float32)                                # galactic-centre direction
    bulge = np.exp(-((1 - gc) / 0.10)) * np.exp(-(g ** 2) / (2 * 0.16 ** 2))
    clouds = (0.5 + 0.5 * _waves(d, 30, 4.0, 60.0, 2)) ** 1.6
    fine = 0.5 + 0.5 * _waves(d, 30, 30.0, 200.0, 3)
    dens = prof * (0.25 + 1.3 * clouds) * (0.7 + 0.6 * fine) + bulge * 1.4
    rid = 1 - np.abs(_waves(d, 30, 8.0, 120.0, 4))
    dust = np.clip(smooth(span(rid, 0.80, 0.97)) * np.exp(-(g ** 2) / (2 * 0.07 ** 2)) * 1.1, 0, 0.95)
    lum = dens * (1 - dust)
    t = np.clip(bulge * 2 + dust * 0.5, 0, 1)[..., None]
    col = np.array([0.70, 0.82, 1.0], np.float32) * (1 - t) + np.array([1.0, 0.80, 0.58], np.float32) * t
    band = lum[..., None] * col * 0.075
    hii = smooth(span(0.5 + 0.5 * _waves(d, 30, 20.0, 90.0, 5), 0.80, 0.95)) * prof * (1 - dust)
    band += hii[..., None] * np.array([0.55, 0.08, 0.18], np.float32) * 0.10
    band += ((0.5 + 0.5 * _waves(d, 12, 1.5, 6.0, 6)) ** 4)[..., None] * np.array([0.004, 0.008, 0.02], np.float32)
    band = cv2.resize(band, (SKY_W, SKY_H), interpolation=cv2.INTER_CUBIC)
    densf = cv2.resize((dens * (1 - dust * 0.8)).astype(np.float32), (SKY_W, SKY_H), interpolation=cv2.INTER_LINEAR)
    rng = np.random.default_rng(9)
    buf = np.zeros((SKY_H, SKY_W, 3), np.float32)
    # faint stars, uniform on the sphere plus concentrated in the band
    n = 600000
    v = rng.normal(size=(n, 3))
    v /= np.linalg.norm(v, axis=1, keepdims=True)
    px = (np.arctan2(v[:, 0], v[:, 2]) + np.pi) / (2 * np.pi) * SKY_W
    py = (np.pi / 2 - np.arcsin(v[:, 1])) / np.pi * SKY_H
    f = (rng.pareto(2.4, n) + 1) ** 1.5 * 0.09
    c = star_color(np.clip(rng.normal(5800, 2200, n), 2800, 25000)) * 0.55 + 0.45
    buf = splat_points(buf, px, py, c * f[:, None], sigma=0)
    n = 4000000
    px, py = rng.random(n) * SKY_W, rng.random(n) * SKY_H
    keep = rng.random(n) < np.clip(densf[py.astype(int), px.astype(int)] / densf.max(), 0, 1) ** 1.2
    px, py = px[keep], py[keep]
    f = (rng.pareto(2.6, px.size) + 1) ** 1.4 * 0.09
    c = star_color(np.clip(rng.normal(5800, 2200, px.size), 2800, 25000)) * 0.55 + 0.45
    buf = splat_points(buf, px, py, c * f[:, None], sigma=0)
    img = band + cv2.GaussianBlur(buf, (0, 0), 0.6)
    return img.astype(np.float16)


_SKY = None
_BRIGHT = None


def sky_tex():
    global _SKY
    if _SKY is None:
        _SKY = cached("sky_sphere_v1", _build_sky).astype(np.float32)
    return _SKY


def bright_stars():
    """~2,500 named-magnitude-like bright stars, drawn crisp per frame (not from the texture)."""
    global _BRIGHT
    if _BRIGHT is None:
        rng = np.random.default_rng(17)
        n = 2500
        v = rng.normal(size=(n, 3))
        v /= np.linalg.norm(v, axis=1, keepdims=True)
        mag = rng.pareto(1.6, n)
        b = np.clip(0.25 * (1 + mag) ** 1.3, 0.2, 9.0)
        col = star_color(np.clip(rng.normal(6500, 3000, n), 2800, 30000)) * 0.6 + 0.4
        _BRIGHT = (v.astype(np.float32), b.astype(np.float32), col.astype(np.float32))
    return _BRIGHT


# ═══════════════════════════ camera ═══════════════════════════
def look_at(pos, target, up=(0.0, 1.0, 0.0), roll=0.0):
    """Camera basis (right, up, back) as rows; back = −forward."""
    f = np.asarray(target, np.float64) - np.asarray(pos, np.float64)
    f /= np.linalg.norm(f) + 1e-12
    r = np.cross(f, np.asarray(up, np.float64))
    if np.linalg.norm(r) < 1e-9:
        r = np.cross(f, np.array([1.0, 0, 0]))
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    if roll:
        c, s = np.cos(roll), np.sin(roll)
        r, u = r * c + u * s, -r * s + u * c
    return np.stack([r, u, -f])


class Camera:
    def __init__(self, pos, target, fov=55.0, up=(0.0, 1.0, 0.0), roll=0.0, shake=0.0, t=0.0):
        self.pos = np.asarray(pos, np.float64)
        self.R = look_at(pos, target, up, roll)
        if shake > 0:      # handheld micro-shake (impacts, close passes)
            a = shake * np.array([np.sin(t * 13.1) + 0.5 * np.sin(t * 29.7), np.sin(t * 11.3 + 1) + 0.5 * np.sin(t * 31.1)]) * 0.004
            self.R = look_at(pos, np.asarray(target) + 0.0, up, roll)
            rot = cv2.Rodrigues(np.array([a[1], a[0], 0.0]))[0]
            self.R = rot @ self.R
        self.f = (W / 2) / np.tan(np.radians(fov) / 2)

    def cam(self, p):
        """World point(s) → camera space (x right, y up, z toward viewer; visible when z < 0)."""
        return (np.asarray(p, np.float64) - self.pos) @ self.R.T

    def project(self, p):
        """World point(s) → (screen x, screen y, depth). Depth > 0 in front of the camera."""
        c = self.cam(p)
        z = -c[..., 2]
        zz = np.where(z > 1e-12, z, 1e-12)
        return W / 2 + self.f * c[..., 0] / zz, H / 2 - self.f * c[..., 1] / zz, z

    def dir_cam(self, v):
        return np.asarray(v, np.float64) @ self.R.T

    # ── sky ──
    def sky(self, gain=1.0, bright=True, exposure_stars=1.0):
        xs = (np.arange(W, dtype=np.float32) - W / 2) / self.f
        ys = -(np.arange(H, dtype=np.float32) - H / 2) / self.f
        X, Y = np.meshgrid(xs, ys)
        Rt = self.R.astype(np.float32)                      # rows: right, up, back
        d = X[..., None] * Rt[0] + Y[..., None] * Rt[1] - Rt[2]
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        mx = (np.arctan2(d[..., 0], d[..., 2]) + np.pi) / (2 * np.pi) * SKY_W
        my = (np.pi / 2 - np.arcsin(np.clip(d[..., 1], -1, 1))) / np.pi * SKY_H
        img = cv2.remap(sky_tex(), mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * gain
        fov_deg = np.degrees(2 * np.arctan(W / 2 / self.f))
        if fov_deg < 24:      # telephoto: the texture's stars would be magnified into blobs; keep only its faint glow
            img = cv2.GaussianBlur(img, (0, 0), 6) * clamp((fov_deg - 4) / 20)
        if bright:
            v, b, col = bright_stars()
            c = v @ self.R.T
            vis = c[:, 2] < -0.05
            sx = W / 2 + self.f * c[vis, 0] / -c[vis, 2]
            sy = H / 2 - self.f * c[vis, 1] / -c[vis, 2]
            on = (sx > -5) & (sx < W + 5) & (sy > -5) & (sy < H + 5)
            img = splat_points(img, sx[on], sy[on], (col[vis][on] * b[vis][on, None] * gain * exposure_stars).astype(np.float32), sigma=0.7)
        return img

    # ── bodies ──
    def body(self, img, p, radius, kind, sun=None, spin=0.0, tilt=0.3, min_px=1.2, **kw):
        """Draw a sphere at world position p. sun: world position of the light (None = lit from the camera)."""
        x, y, z = self.project(p)
        if z <= 0:
            return img, None
        R = self.f * radius / z
        if x < -R - 50 or x > W + R + 50 or y < -R - 50 or y > H + R + 50:
            return img, (x, y, R)
        if sun is None:
            L = (0.0, 0.0, 1.0)
        else:
            L = self.dir_cam(np.asarray(sun, np.float64) - np.asarray(p, np.float64))
            L = L / (np.linalg.norm(L) + 1e-12)
            L = (L[0], L[1], L[2])
        if R < min_px:
            return img, (x, y, R)
        if kind == "custom":
            kw["draw"](img, x, y, R, L)
        else:
            render_planet(img, x, y, R, kind, spin=spin, tilt=tilt, light=L, **kw)
        return img, (x, y, R)

    def sun(self, img, p, radius, t=0.0, glare=1.0, flare=False):
        x, y, z = self.project(p)
        if z <= 0:
            return img
        R = self.f * radius / z
        if -R - 600 < x < W + R + 600 and -R - 600 < y < H + R + 600:
            if R > 3 and x + R * 1.6 > 0 and x - R * 1.6 < W and y + R * 1.6 > 0 and y - R * 1.6 < H:
                tmp = np.zeros_like(img)
                try:
                    render_sun_disk(tmp, x, y, R, t, filter_look=False)
                    img += tmp * 1.6
                except cv2.error:
                    pass          # disc entirely outside the frame's padded box
            glow_dot(img, x, y, (1.0, 0.92, 0.8), max(3.0, R * 0.6), 9.0 * glare)
            glow_dot(img, x, y, (1.0, 0.8, 0.55), max(40.0, R * 3), 0.55 * glare)
            glow_dot(img, x, y, (1.0, 0.7, 0.45), max(200.0, R * 8), 0.10 * glare)
            star_spikes(img, x, y, (1.0, 0.95, 0.85), 220 + R * 2, 0.5 * glare, angle=8)
            if flare and 0 < x < W and 0 < y < H:
                # lens flare: ghosts along the line through the frame centre
                for k, (s, r_, c, a) in enumerate([(-0.4, 60, (0.4, 0.6, 1.0), 0.05), (-0.75, 26, (0.5, 1.0, 0.6), 0.06),
                                                   (-1.1, 110, (1.0, 0.5, 0.3), 0.03), (0.35, 16, (1.0, 0.8, 0.5), 0.08)]):
                    gx, gy = W / 2 + (x - W / 2) * s, H / 2 + (y - H / 2) * s
                    glow_dot(img, gx, gy, c, r_, a * glare * 4)
        return img

    # ── lines ──
    def polyline(self, img, pts, color, width=2.0, alpha=1.0, fade_far=None, dashed=False, glow=0.6):
        """3D polyline (N×3) drawn with depth clipping and an additive glow."""
        x, y, z = self.project(np.asarray(pts))
        m = np.zeros((H, W), np.uint8)
        for i in range(len(x) - 1):
            if z[i] <= 0 or z[i + 1] <= 0:
                continue
            if dashed and (i // 3) % 2:
                continue
            if abs(x[i]) > 6 * W or abs(y[i]) > 6 * H or abs(x[i + 1]) > 6 * W or abs(y[i + 1]) > 6 * H:
                continue
            v = 255 if fade_far is None else int(255 * clamp(1.0 - z[i] / fade_far, 0.15, 1.0))
            cv2.line(m, (int(x[i] * 4), int(y[i] * 4)), (int(x[i + 1] * 4), int(y[i + 1] * 4)), v, max(1, int(width)), cv2.LINE_AA, 2)
        a = (m.astype(np.float32) / 255)[..., None] * np.asarray(color, np.float32) * alpha
        return img + a + fast_blur(a, 5) * glow


def ring_pts(center, radius, n=720, normal=(0.0, 1.0, 0.0), a=None, e=0.0, arg=0.0):
    """Circle (or Kepler ellipse with the centre at a focus) in the plane with this normal."""
    nrm = np.asarray(normal, np.float64)
    nrm /= np.linalg.norm(nrm)
    u = np.cross(nrm, [1.0, 0, 0]) if abs(nrm[0]) < 0.9 else np.cross(nrm, [0, 0, 1.0])
    u /= np.linalg.norm(u)
    v = np.cross(nrm, u)
    th = np.linspace(0, 2 * np.pi, n)
    if a is None:
        r = np.full(n, radius)
    else:
        r = a * (1 - e * e) / (1 + e * np.cos(th - arg))
    return np.asarray(center) + r[:, None] * (np.cos(th)[:, None] * u + np.sin(th)[:, None] * v)


# ═══════════════════════════ looking up from the ground ═══════════════════════════
def ground_sky(cam_pitch_up, sun_alt_deg, sun_az_deg=0.0, view_az_deg=0.0, fov=60.0, haze=1.0):
    """Sky colour for a camera at the ground looking toward view_az at pitch cam_pitch_up (deg). Returns (img, alt map,
    az map, f) so objects can be placed by altitude/azimuth. Simple single-scattering look: zenith blue, horizon glow,
    sunset warmth, Mie glow around the Sun; night when the Sun is below −12°."""
    f = (W / 2) / np.tan(np.radians(fov) / 2)
    xs = (np.arange(W, dtype=np.float32) - W / 2) / f
    ys = -(np.arange(H, dtype=np.float32) - H / 2) / f
    X, Y = np.meshgrid(xs, ys)
    p = np.radians(cam_pitch_up)
    dy = Y * np.cos(p) + np.sin(p)
    dz = -Y * np.sin(p) + np.cos(p)
    n = np.sqrt(X * X + dy * dy + dz * dz)
    alt = np.degrees(np.arcsin(np.clip(dy / n, -1, 1)))
    az = view_az_deg + np.degrees(np.arctan2(X, dz))
    day = smooth(span(sun_alt_deg, -12, 8))
    dusk = np.exp(-((sun_alt_deg - 1) / 7) ** 2)
    h = clamp(alt / 90.0)
    zen = np.array([0.10, 0.25, 0.75], np.float32)
    hor = np.array([0.55, 0.70, 0.95], np.float32)
    sky = (zen * (h ** 0.45)[..., None] + hor * (1 - h ** 0.45)[..., None]) * day * 0.42
    daz = np.radians(az - sun_az_deg)
    cosg = np.cos(np.radians(alt)) * np.cos(np.radians(sun_alt_deg)) * np.cos(daz) + np.sin(np.radians(alt)) * np.sin(np.radians(sun_alt_deg))
    mie = np.exp((cosg - 1) * 14)
    warm = np.array([1.0, 0.45, 0.18], np.float32)
    sky += (warm * (np.exp(-np.maximum(alt, 0) / 10))[..., None] * (0.25 + 0.75 * mie[..., None])) * dusk * 0.9 * haze
    sky += np.array([1.0, 0.9, 0.75], np.float32) * mie[..., None] * 0.18 * day
    night = np.array([0.016, 0.026, 0.055], np.float32) * (1 - day) * (0.5 + 0.5 * (1 - h))[..., None]
    sky += night + np.array([0.02, 0.025, 0.04], np.float32) * (np.exp(-np.maximum(alt, 0) / 8))[..., None] * (1 - day) * haze
    return sky.astype(np.float32), alt, az, f, day


def altaz_to_screen(alt, az, cam_pitch_up, view_az, f):
    a, z_ = np.radians(alt), np.radians(az - view_az)
    d = np.array([np.cos(a) * np.sin(z_), np.sin(a), np.cos(a) * np.cos(z_)])
    p = np.radians(cam_pitch_up)
    y = d[1] * np.cos(p) - d[2] * np.sin(p)
    zz = d[1] * np.sin(p) + d[2] * np.cos(p)
    if zz <= 1e-6:
        return None
    return W / 2 + f * d[0] / zz, H / 2 - f * y / zz
