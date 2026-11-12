"""Ground-level night sky v2: physically-motivated integration of sky and landscape.
- landscape colour derives from the sky (atmospheric perspective), valley haze between ridges
- light wrap: blurred sky bleeds over every silhouette edge (the thing that makes plates feel 'shot together')
- extinction + reddening of stars near the horizon, airglow and a distant light dome
- target stars live in sky coordinates and move exactly with the starfield
Sets: observatory (Chilean mountaintop dome), ridge (stargazer with telescope), garden (back garden, binoculars)."""
import numpy as np
import cv2
from PIL import Image, ImageDraw
from .core import (W, H, clamp, smooth, smoother, span, lerp, glow_dot, star_spikes, blur, fast_blur, fbm, hex2rgb, splat_points)
from .space import space_frame
from .shots_space import Shot, _lp
from .shots_ground import ridge, figure_mask, conifer
from . import cards

SKY_C = (2350.0, 1250.0)   # canvas point at screen centre
SKY_Z = 1.25
SKY_A = 28.0


def sky_to_screen(px, py, zoom, angle, cx, cy, jx=0.0, jy=0.0):
    """Exact inverse of space.camera_maps: canvas point → output pixel."""
    a = np.radians(angle)
    dx, dy = px - cx, py - cy
    # camera_maps: canvas = c + R(angle)·(screen - centre)/zoom  →  screen = centre + R(-angle)·(canvas - c)·zoom
    sx = (dx * np.cos(a) + dy * np.sin(a)) * zoom
    sy = (-dx * np.sin(a) + dy * np.cos(a)) * zoom
    return W / 2 + sx + jx, H / 2 + sy + jy


def binoc_figure(scale=1.0):
    S = 4
    w, h = int(200 * scale), int(240 * scale)
    img = Image.new("L", (w * S, h * S), 0)
    d = ImageDraw.Draw(img)
    k = scale * S

    def P(pts):
        return [(x * k, y * k) for x, y in pts]
    d.polygon(P([(80, 235), (86, 170), (80, 120), (88, 92), (112, 88), (122, 100), (126, 136), (120, 170), (124, 235), (110, 235), (104, 175), (96, 235)]), fill=255)
    d.ellipse(P([(90, 60), (114, 86)]), fill=255)
    # arms up holding binoculars at the face, looking up-left
    d.polygon(P([(90, 96), (78, 74), (86, 66), (98, 90)]), fill=255)
    d.polygon(P([(116, 96), (100, 70), (108, 64), (122, 92)]), fill=255)
    d.polygon(P([(74, 58), (96, 50), (102, 62), (80, 70)]), fill=255)
    a = np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255.0
    return a


def tree_mask(w, h, seed=3):
    """Broadleaf tree: trunk + main limbs + irregular noisy canopy."""
    S = 2
    img = Image.new("L", (w * S, h * S), 0)
    d = ImageDraw.Draw(img)
    cx, base = w * 0.5, h
    d.polygon([((cx - 16) * S, base * S), ((cx - 8) * S, (h * 0.5) * S), ((cx + 8) * S, (h * 0.5) * S), ((cx + 16) * S, base * S)], fill=255)
    for ang, ln in ((2.1, 0.32), (1.0, 0.3), (1.6, 0.36), (2.6, 0.22), (0.5, 0.22)):
        x2, y2 = cx + np.cos(ang) * h * ln, h * 0.55 - np.sin(ang) * h * ln
        d.line([(cx * S, h * 0.58 * S), (x2 * S, y2 * S)], fill=255, width=int(9 * S))
    a = np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ell = ((xx - cx) / (w * 0.47)) ** 2 + ((yy - h * 0.34) / (h * 0.3)) ** 2
    n = fbm(w, h, scale=22, seed=seed, octaves=4)
    canopy = np.clip((1.0 - ell + (n - 0.5) * 0.9) * 6, 0, 1)
    holes = (fbm(w, h, scale=9, seed=seed + 7, octaves=2) > 0.8) * (ell > 0.45)
    canopy = canopy * (1 - holes)
    return np.clip(np.maximum(a, canopy), 0, 1)


class Night(Shot):
    exposure = 1.55
    grade = ((0.008, 0.012, 0.026), (1.0, 1.0, 1.03))
    bloom = 0.6

    def __init__(self, p, dur, seg_start=0.0):
        super().__init__(p, dur, seg_start)
        self.set = p.get("set", "ridge")
        self.time = p.get("time", "night")
        self.hor = int(H * (0.8 if self.set != "garden" else 0.84))
        self._build()
        self._trail = None
        self._last_fi = None

    # ---------- static plates ----------
    def _build(self):
        rng = np.random.default_rng(8)
        S = 2
        Wb, Hb = int(W * 1.14), int(H * 1.14)
        self.Wb, self.Hb = Wb, Hb
        self.off = ((Wb - W) / 2, (Hb - H))
        hor = self.hor + (Hb - H)
        ys = np.arange(Hb, dtype=np.float32)[:, None]
        layers = []
        if self.set == "garden":
            far = hor - 18 - ridge(Wb, 300, 40, 41)        # distant tree line
            mid = hor + 6 - ridge(Wb, 900, 14, 42)
            near = Hb - 150 + 0 * np.arange(Wb, dtype=np.float32)
        else:
            far = hor - 60 - ridge(Wb, 620, 170, 31)
            mid = hor - 10 - ridge(Wb, 420, 120, 33) - np.linspace(40, 0, Wb)
            near = hor + 50 - ridge(Wb, 380, 80, 32) - np.linspace(0, 40, Wb)
        for line in (far, mid, near):
            layers.append(clamp(ys - line[None, :] + 0.5))
        self.lines = (far, mid, near)
        far_a, mid_a, near_a = layers
        # props
        img = Image.new("L", (Wb * S, Hb * S), 0)
        d = ImageDraw.Draw(img)
        emis = np.zeros((Hb, Wb, 3), np.float32)
        if self.set == "observatory":
            # dome on the mid-ridge summit
            px = int(np.argmin(mid[200:Wb - 200]) + 200)
            base = mid[px] + 4
            bw, bh, dr = 150, 60, 66
            d.rectangle([(px - bw / 2) * S, (base - bh) * S, (px + bw / 2) * S, (base + 6) * S], fill=255)
            d.pieslice([(px - dr) * S, (base - bh - dr) * S, (px + dr) * S, (base - bh + dr) * S], 180, 360, fill=255)
            d.rectangle([(px + bw / 2) * S, (base - 34) * S, (px + bw / 2 + 120) * S, (base + 6) * S], fill=255)
            # open slit with faint red work-light
            emis[int(base - bh - dr + 10):int(base - bh - 4), px - 5:px + 5] += np.array([0.9, 0.12, 0.08], np.float32) * 0.05
            for (xx, yy) in ((px + bw / 2 + 40, base - 18), (px + bw / 2 + 80, base - 18)):
                emis[int(yy):int(yy) + 6, int(xx):int(xx) + 10] += np.array([1.0, 0.5, 0.2], np.float32) * 0.12
            self.dome = (px, base - bh - dr)
            mid_extra = np.asarray(img.resize((Wb, Hb), Image.LANCZOS), np.float32) / 255.0
            mid_a = np.maximum(mid_a, mid_extra)
            img = Image.new("L", (Wb * S, Hb * S), 0)
            d = ImageDraw.Draw(img)
        if self.set in ("ridge", "observatory"):
            for x in rng.choice(np.arange(20, Wb - 20), 54, replace=False):
                if self.set == "ridge" and 1180 < x < 1500:
                    continue
                conifer(d, x * S, near[int(x)] * S + 10, rng.uniform(36, 125) * S)
        trees = np.asarray(img.resize((Wb, Hb), Image.LANCZOS), np.float32) / 255.0
        near_a = np.maximum(near_a, trees)
        if self.set == "garden":
            # fence
            fence = np.zeros((Hb, Wb), np.float32)
            fy = near[0] - 54
            fence[int(fy):int(fy) + 8, :] = 1
            fence[int(fy) + 40:int(fy) + 46, :] = 1
            for x in range(0, Wb, 26):
                fence[int(fy) - 10:int(near[0]), x:x + 18] = 1
            near_a = np.maximum(near_a, fence * 0.98)
            # house on the right with warm windows
            hx0, hx1, hy = Wb - 640, Wb - 40, near[0] - 320
            house = np.zeros((Hb, Wb), np.float32)
            house[int(hy):, hx0:hx1] = 1
            himg = Image.new("L", (Wb, Hb), 0)
            ImageDraw.Draw(himg).polygon([(hx0 - 30, hy), ((hx0 + hx1) / 2, hy - 170), (hx1 + 30, hy)], fill=255)
            house = np.maximum(house, np.asarray(himg, np.float32) / 255)
            house[int(hy - 230):int(hy - 120), hx1 - 160:hx1 - 120] = 1   # chimney
            near_a = np.maximum(near_a, house)
            for (wx, wy) in ((hx0 + 90, hy + 70), (hx0 + 300, hy + 70), (hx0 + 90, hy + 190)):
                win = np.zeros((78, 110, 1), np.float32) + 1
                win[36:42] = 0.05; win[:, 52:58] = 0.05
                emis[int(wy):int(wy) + 78, int(wx):int(wx) + 110] += win * np.array([1.6, 0.95, 0.45], np.float32) * 0.32
            # window light spill on the lawn
            spill = np.zeros((Hb, Wb), np.float32)
            spill[int(near[0]):, hx0 - 200:hx1] = 1
            emis += fast_blur(emis, 40)[..., :] * 0.0
            self.spill = blur(spill, 60)[..., None] * np.array([1.0, 0.6, 0.3], np.float32) * 0.018
            # tree on the left
            tm = tree_mask(560, 620, seed=5)
            ty0 = int(near[0] - 620 + 30)
            near_a[ty0:ty0 + 620, 30:590] = np.maximum(near_a[ty0:ty0 + 620, 30:590], tm)
        else:
            self.spill = None
        # figure
        fig = self.p.get("figure")
        if fig:
            fm = figure_mask(0.82 if self.set != "garden" else 1.25)
            fx = 1330 if self.set != "garden" else 930
            fy = int(near[fx] + 8) if self.set != "garden" else int(near[0] + 30)
            h, w = fm.shape
            y0, x0 = fy - h, fx - w // 2
            near_a[y0:y0 + h, x0:x0 + w] = np.maximum(near_a[y0:y0 + h, x0:x0 + w], fm)
        # grass blades along the near edge (breaks the cut-out look)
        g = Image.new("L", (Wb * S, Hb * S), 0)
        gd = ImageDraw.Draw(g)
        gl = near if self.set != "garden" else near * 0 + near[0]
        for x in range(0, Wb, 3):
            yb = gl[x] + 2
            hh = rng.uniform(4, 16)
            gd.line([(x * S, yb * S), ((x + rng.uniform(-3, 3)) * S, (yb - hh) * S)], fill=255, width=S)
        grass = np.asarray(g.resize((Wb, Hb), Image.LANCZOS), np.float32) / 255.0
        near_a = np.maximum(near_a, grass)
        self.far_a, self.mid_a, self.near_a = far_a, mid_a, near_a
        self.emis = emis + fast_blur(emis, 14) * 0.8
        self.ground_tex = (fbm(Wb, Hb, scale=40, seed=44, octaves=5) - 0.5).astype(np.float32)
        # snow mask for season time-lapse: upper surfaces of the near layer
        top = np.clip(near_a - np.roll(near_a, 6, axis=0), 0, 1)
        self.snowmask = blur(top, 2.5) * 0.9 + near_a * 0.12
        # sky gradient
        y = np.arange(H, dtype=np.float32)[:, None, None]
        alt = clamp((self.hor - y) / self.hor)
        self.alt = alt[..., 0]
        if self.time == "dusk":
            top_c, hor_c = hex2rgb("#071030"), hex2rgb("#c46a3c")
            g_ = lerp(hor_c, lerp(hex2rgb("#2a3266"), top_c, clamp((alt - 0.25) / 0.75)), clamp(alt / 0.25) ** 0.7)
            self.sky = (g_ * 0.42).astype(np.float32)
            self.star_k = clamp((alt - 0.12) / 0.6) ** 1.5 * 0.55
        else:
            top_c, mid_c, hor_c = hex2rgb("#01030c"), hex2rgb("#061226"), hex2rgb("#1d3040")
            g_ = lerp(hor_c, lerp(mid_c, top_c, clamp((alt - 0.3) / 0.7)), clamp(alt / 0.3) ** 0.8)
            air = np.exp(-((alt - 0.1) ** 2) / 0.003) * hex2rgb("#3d6b4c") * 0.06
            self.sky = (g_ * 0.5 + air).astype(np.float32)
            self.star_k = (0.12 + 0.88 * clamp(alt / 0.45) ** 0.9)
        xs = np.arange(W, dtype=np.float32)[None, :, None]
        dome = np.exp(-((xs - 260) / 520) ** 2) * np.exp(-alt / 0.07) * hex2rgb("#ff9a52") * (0.07 if self.set != "garden" else 0.14)
        self.sky = self.sky + dome
        self.hor_col = self.sky[min(H - 1, self.hor - 6), W // 2].copy()
        self.redden = np.concatenate([np.ones_like(alt), clamp(0.75 + alt), clamp(0.55 + alt * 1.5)], -1)

    # ---------- per frame ----------
    def _sky(self, u, t, fi):
        p = self.p
        push = p.get("push", 0.05)
        zs = SKY_Z * (1 + push * smoother(u))
        jx, jy = 2.5 * np.sin(t * 0.31), 1.8 * np.sin(t * 0.23 + 1)
        ang = SKY_A
        if p.get("trails"):
            ang = SKY_A + 30.0 * u  # sky turning about the pole (time-lapse)
        cx, cy = SKY_C[0] + jx / zs, SKY_C[1] + jy / zs
        img, _ = space_frame(cx, cy, zs, angle=ang)
        lum = img.mean(-1, keepdims=True)
        img = lerp(lum, img, 0.62) * 0.8
        img = img * self.star_k[:, :, None] if self.star_k.ndim == 2 else img * self.star_k
        img = img * self.redden
        self.cam = (zs, ang, cx, cy, jx, jy)
        return img

    def star(self, k):
        """Screen position of target star k (canvas-anchored)."""
        base = [(-96, -228), (-180, -195), (-262, -160), (-345, -126)]
        dx, dy = base[k]
        zs, ang, cx, cy, jx, jy = self.cam
        a = np.radians(SKY_A)
        px = SKY_C[0] + (dx * np.cos(a) - dy * np.sin(a)) / SKY_Z
        py = SKY_C[1] + (dx * np.sin(a) + dy * np.cos(a)) / SKY_Z
        return sky_to_screen(px, py, zs, ang, cx, cy)

    def render(self, u, t, fi):
        p = self.p
        sky = self._sky(u, t, fi)
        if p.get("trails"):
            if self._trail is None or self._last_fi is None or fi != self._last_fi + 1:
                self._trail = sky.copy()
                for k in range(40, 0, -2):  # pre-roll so any single frame shows trails
                    uu = max(0.0, u - k / (30.0 * max(1.0, self.dur)))
                    self._trail = np.maximum(self._trail * 0.96, self._sky(uu, t - k / 30, fi))
                sky = self._sky(u, t, fi)
            self._trail = np.maximum(self._trail * 0.99, sky)
            self._last_fi = fi
            sky = self._trail
        img = self.sky + sky
        # target-star flares
        for fl in p.get("flare", []):
            a, b = fl["t0"], fl["t1"]
            m = (a + b) / 2
            boost = np.exp(-((u - m) / max(1e-3, (b - a) * 0.32)) ** 2)
            sx, sy = self.star(fl["star"])
            glow_dot(img, sx, sy, (0.95, 0.97, 1.0), 1.1, 0.8 + boost * 9)
            glow_dot(img, sx, sy, (0.75, 0.85, 1.0), 6, boost * 0.45)
            if boost > 0.05:
                star_spikes(img, sx, sy, (0.9, 0.94, 1.0), 40 + 70 * boost, 0.35 * boost, angle=8)
        for k in p.get("show_stars", []):
            sx, sy = self.star(k)
            glow_dot(img, sx, sy, (0.95, 0.97, 1.0), 1.1, 1.0)
        # foreground plates with parallax push
        push = p.get("push", 0.05)
        zf = 1 + push * 1.7 * smoother(u)
        zs, ang, cx, cy, jx, jy = self.cam
        ox, oy = self.off
        M = np.float32([[zf, 0, -ox * zf + (1 - zf) * W / 2 + jx * 1.6], [0, zf, -oy * zf + (1 - zf) * H + jy * 1.6]])
        warp = lambda a: cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR)
        far_a, mid_a, near_a = warp(self.far_a), warp(self.mid_a), warp(self.near_a)
        hc = self.hor_col
        season = None
        if p.get("seasons"):
            ph = (u * 2.0) % 1.0
            season = ph
        sky_blur = fast_blur(img, 26)
        # atmospheric perspective: far layers take the colour of the horizon sky
        far_c = hc * 0.62 + 0.002
        mid_c = hc * 0.32 + 0.0015
        near_c = np.array([0.0035, 0.0045, 0.007], np.float32)
        if self.time == "dusk":
            far_c = hc * 0.16 + np.array([0.004, 0.006, 0.014], np.float32)
            mid_c = hc * 0.07 + np.array([0.003, 0.004, 0.009], np.float32)
        img = img * (1 - far_a[..., None]) + far_c * far_a[..., None]
        # valley haze above the mid ridge
        ys = np.arange(H, dtype=np.float32)[:, None]
        if self.set != "garden":
            ml = np.interp(np.arange(W), np.arange(self.Wb) * zf - ox * zf + (1 - zf) * W / 2, self.lines[1] * zf - oy * zf + (1 - zf) * H)
            haze = np.exp(-np.clip(ml[None, :] - ys, 0, None) / 38) * (ys < ml[None, :]) * far_a
            img += haze[..., None] * hc * 0.35
        img = img * (1 - mid_a[..., None]) + mid_c * mid_a[..., None]
        tex = warp(self.ground_tex)
        nc = near_c * (1 + tex[..., None] * 1.8)
        if season is not None:
            snow = smooth(1 - np.abs(season - 0.15) * 4) if season < 0.45 else 0
            green = smooth(1 - np.abs(season - 0.6) * 4)
            nc = nc + warp(self.snowmask)[..., None] * np.array([0.22, 0.25, 0.3], np.float32) * snow + near_a[..., None] * np.array([0.01, 0.012, 0.016], np.float32) * snow
            nc = nc + near_a[..., None] * np.array([0.0, 0.004, 0.001], np.float32) * green
        img = img * (1 - near_a[..., None]) + nc * near_a[..., None]
        if self.spill is not None:
            img += warp(self.spill) * near_a[..., None]
        img += warp(self.emis)
        # light wrap on every silhouette edge
        for a_, k in ((far_a, 0.25), (mid_a, 0.45), (near_a, 0.9 if self.time != "dusk" else 0.4)):
            edge = a_ * (1 - blur(a_, 5))
            img += sky_blur * edge[..., None] * k
        img *= (1 - p.get("dim", 0))
        return img
