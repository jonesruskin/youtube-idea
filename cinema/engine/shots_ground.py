"""Ground-level and ocean shots: ground (night/dusk sky), tide, ice, vent."""
import numpy as np
import cv2
from PIL import Image, ImageDraw
from .core import (W, H, clamp, smooth, smoother, span, lerp, ease_in, ease_out, glow_dot, star_spikes, blur,
                   fast_blur, grid, fbm, hex2rgb, cached, splat_points)
from .space import space_frame, lens_image
from .shots_space import Shot, _lp
from . import cards


def ridge(n, scale, amp, seed, octaves=5):
    rng = np.random.default_rng(seed)
    x = np.arange(n, dtype=np.float32)
    y = np.zeros(n, np.float32)
    a, s = 1.0, scale
    for _ in range(octaves):
        k = int(n / s) + 3
        pts = rng.random(k).astype(np.float32)
        y += a * np.interp(x / s, np.arange(k), pts)
        a *= 0.5
        s /= 2.1
    y = (y - y.min()) / (y.max() - y.min() + 1e-6)
    return y * amp


_FIG = {}


def figure_mask(scale=1.0):
    """Silhouette of a person looking up beside a small telescope (anti-aliased alpha, 4x supersampled)."""
    if scale in _FIG:
        return _FIG[scale]
    S = 4
    w, h = int(260 * scale), int(230 * scale)
    img = Image.new("L", (w * S, h * S), 0)
    d = ImageDraw.Draw(img)
    k = scale * S

    def P(pts):
        return [(x * k, y * k) for x, y in pts]
    # person (facing left, head tilted up), feet at y=225
    d.polygon(P([(150, 225), (156, 160), (150, 112), (158, 84), (176, 80), (186, 92), (190, 128), (186, 160), (190, 225), (178, 225), (172, 165), (166, 225)]), fill=255)
    d.ellipse(P([(158, 56), (182, 82)]), fill=255)          # head
    d.polygon(P([(160, 64), (154, 60), (158, 72)]), fill=255)  # chin up
    d.polygon(P([(158, 90), (136, 112), (130, 106), (152, 86)]), fill=255)  # arm pointing to scope
    d.polygon(P([(184, 92), (196, 128), (190, 130), (180, 100)]), fill=255)
    # telescope: tube angled up-left on a tripod
    d.polygon(P([(70, 120), (128, 96), (132, 106), (74, 130)]), fill=255)
    d.polygon(P([(64, 116), (72, 112), (78, 132), (70, 134)]), fill=255)
    for (x0, y0, x1, y1) in ((104, 112, 84, 225), (104, 112, 110, 225), (104, 112, 128, 225)):
        d.line(P([(x0, y0), (x1, y1)]), fill=255, width=int(3 * k))
    a = np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255.0
    _FIG[scale] = a
    return a


def conifer(d, x, base, hgt, k=1.0):
    layers = 6
    for i in range(layers):
        t = i / layers
        yb = base - hgt * t * 0.85
        wdt = hgt * 0.34 * (1 - t * 0.75)
        d.polygon([(x - wdt, yb), (x + wdt, yb), (x, yb - hgt * 0.32)], fill=255)
    d.rectangle([x - hgt * 0.03, base - hgt * 0.1, x + hgt * 0.03, base + 4], fill=255)


class Ground(Shot):
    exposure = 1.5
    grade = ((0.01, 0.014, 0.03), (1.0, 1.0, 1.02))
    STARS = [(1040, 236), (918, 300), (796, 364), (674, 428)]

    def __init__(self, p, dur, seg_start=0.0):
        super().__init__(p, dur, seg_start)
        self.hor = int(H * 0.8)
        self._build()

    def _build(self):
        p = self.p
        dusk = p.get("time") == "dusk"
        S = 2
        Wb, Hb = int(W * 1.12), int(H * 1.12)  # foreground plate oversized for push-in
        self.fg_off = ((Wb - W) / 2, (Hb - H))
        hor = self.hor + (Hb - H)
        far = hor - 70 - ridge(Wb, 600, 150, 31)
        near = hor + 40 - ridge(Wb, 380, 90, 32) - np.linspace(0, 50, Wb)
        ys = np.arange(Hb, dtype=np.float32)[:, None]
        self.far_a = clamp(ys - far[None, :] + 0.5)
        self.near_a = clamp(ys - near[None, :] + 0.5)
        # trees on the near ridge
        img = Image.new("L", (Wb * S, Hb * S), 0)
        d = ImageDraw.Draw(img)
        rng = np.random.default_rng(8)
        for x in rng.choice(np.arange(20, Wb - 20), 46, replace=False):
            if 1150 < x < 1520:
                continue
            hgt = rng.uniform(40, 120)
            conifer(d, x * S, near[int(x)] * S + 8, hgt * S)
        trees = np.asarray(img.resize((Wb, Hb), Image.LANCZOS), np.float32) / 255.0
        self.near_a = np.maximum(self.near_a, trees)
        # the stargazer
        fm = figure_mask(0.82)
        fx = 1330
        fy = int(near[fx] + 6)
        self.fig = (fm, fx - fm.shape[1] // 2, fy - fm.shape[0])
        if p.get("figure"):
            h, w = fm.shape
            y0, x0 = self.fig[2], self.fig[1]
            self.near_a[y0:y0 + h, x0:x0 + w] = np.maximum(self.near_a[y0:y0 + h, x0:x0 + w], fm)
        self.Wb, self.Hb = Wb, Hb
        self.far_line, self.near_line = far, near
        # sky gradient (in output coordinates)
        y = np.arange(H, dtype=np.float32)[:, None, None]
        hn = (y / self.hor)
        if dusk:
            top, mid, low = hex2rgb("#050a1e"), hex2rgb("#1b2450"), hex2rgb("#c8653a")
            g = np.where(hn < 0.6, lerp(top, mid, clamp(hn / 0.6)), lerp(mid, low, clamp((hn - 0.6) / 0.4) ** 1.6))
            self.sky = g * 0.55
            self.star_k = 0.55 * (1 - clamp(hn) ** 2)
            self.far_col = hex2rgb("#2a2238") * 0.35
        else:
            top, low = hex2rgb("#01030a"), hex2rgb("#0b1e2a")
            g = lerp(top, low, clamp(hn) ** 2.2)
            air = np.exp(-((hn - 0.93) ** 2) / 0.004) * hex2rgb("#2a5a46") * 0.08
            self.sky = g * 0.5 + air
            self.star_k = 1 - 0.75 * smooth(clamp((hn - 0.6) / 0.4))
            self.far_col = hex2rgb("#0f1626") * 0.6
        self.sky = np.broadcast_to(self.sky, (H, 1, 3)).astype(np.float32)
        self.star_k = np.broadcast_to(self.star_k, (H, 1, 1)).astype(np.float32)
        if p.get("city"):
            glow = np.zeros((Hb, Wb, 3), np.float32)
            xs = np.arange(Wb)
            for i in range(900):
                x = rng.integers(60, 1000)
                yy = far[x] + rng.uniform(-2, 8)
                glow[int(yy) % Hb, x] += hex2rgb("#ffb066") * rng.uniform(0.6, 2.5)
            self.city = blur(glow, 0.8) + fast_blur(glow, 30) * 6
        else:
            self.city = None

    def render(self, u, t, fi):
        p = self.p
        push = p.get("push", 0.05)
        zs = 1.25 * (1 + push * smoother(u))
        jx, jy = 3 * np.sin(t * 0.31), 2 * np.sin(t * 0.23 + 1)
        cx, cy = 2350 + jx / zs, 1250 + jy / zs
        sky_img, _ = space_frame(cx, cy, zs, angle=28)
        img = self.sky + sky_img * self.star_k
        # target stars (flare) – positions follow the sky camera
        def to_screen(x, y):
            return W / 2 + (x - W / 2) * (1 + push * smoother(u)) + jx, H / 2 + (y - H / 2) * (1 + push * smoother(u)) + jy
        for i, (x, y) in enumerate(self.STARS[:4]):
            sx, sy = to_screen(x, y)
            base = 0.55
            boost = 0.0
            for fl in p.get("flare", []):
                if fl["star"] == i:
                    a, b = fl["t0"], fl["t1"]
                    m = (a + b) / 2
                    boost = max(boost, np.exp(-((u - m) / max(1e-3, (b - a) * 0.32)) ** 2))
            if i == 0 or boost > 0.01 or p.get("trail"):
                glow_dot(img, sx, sy, (0.95, 0.97, 1.0), 1.1, base * 1.4 + boost * 9)
                glow_dot(img, sx, sy, (0.75, 0.85, 1.0), 6, boost * 0.45)
                if boost > 0.05:
                    star_spikes(img, sx, sy, (0.9, 0.94, 1.0), 40 + 70 * boost, 0.35 * boost, angle=8)
                    # detection reticle
                    ra = smooth(span(boost, 0.2, 0.6))
                    rr = cards.sprite("", "mono", 10) if False else None
                    ang = np.linspace(0, 2 * np.pi, 180)
                    for k0 in range(4):
                        seg = ang[k0 * 45 + 6:k0 * 45 + 39]
                        pts = np.stack([sx + 30 * np.cos(seg), sy + 30 * np.sin(seg)], -1).astype(np.int32)
                        layer = np.zeros((H, W), np.uint8)
                        cv2.polylines(layer, [pts], False, 255, 1, cv2.LINE_AA)
                        img += (layer.astype(np.float32) / 255 * ra * 0.6)[..., None] * np.array([1.0, 0.62, 0.32], np.float32)
                    cards.label(img, f"+{1.2 + 1.6 * boost:.1f} MAG", sx + 42, sy - 4, (1.0, 0.62, 0.32), ra * 0.9, 18)
        if p.get("jupiter"):
            jxp, jyp = to_screen(lerp(1480, 1300, smooth(u)), lerp(360, 318, smooth(u)) + 18 * np.sin(u * 4))
            glow_dot(img, jxp, jyp, (1.0, 0.93, 0.8), 1.6, 6.0)
            glow_dot(img, jxp, jyp, (1.0, 0.9, 0.75), 8, 0.12)
            cards.label(img, "JUPITER", jxp + 18, jyp + 2, (0.8, 0.82, 0.9), 0.7 * smooth(span(u, 0.05, 0.2)), 16)
        # foreground plate with parallax push
        zf = 1 + push * 1.7 * smoother(u)
        ox, oy = self.fg_off
        M = np.float32([[zf, 0, -ox * zf + (1 - zf) * W / 2 + jx * 1.6], [0, zf, -oy * zf + (1 - zf) * H + jy * 1.6]])
        far_a = cv2.warpAffine(self.far_a, M, (W, H), flags=cv2.INTER_LINEAR)
        near_a = cv2.warpAffine(self.near_a, M, (W, H), flags=cv2.INTER_LINEAR)
        haze = self.sky[:, :, :] * 0.6
        img = img * (1 - far_a[..., None]) + (self.far_col + haze * 0.5) * far_a[..., None]
        if self.city is not None:
            img += cv2.warpAffine(self.city, M, (W, H), flags=cv2.INTER_LINEAR) * (1 - near_a[..., None])
        img = img * (1 - near_a[..., None]) + np.array([0.002, 0.003, 0.006], np.float32) * near_a[..., None]
        # rim light on the figure from the sky
        if p.get("binoc"):
            a, b = p["binoc"]
            k = smooth(span(u, a, a + 0.06)) * (1 - smooth(span(u, b - 0.04, b)))
            if k > 0:
                bz = 3.2 + 0.4 * span(u, a, b)
                bimg, _ = space_frame(2350 + 120 * span(u, a, b), 1180, bz, angle=28, lenses=[(W * 0.52, H * 0.47, 95)])
                xs, ys = grid()
                r1 = np.sqrt((xs - W * 0.37) ** 2 + (ys - H / 2) ** 2)
                r2 = np.sqrt((xs - W * 0.63) ** 2 + (ys - H / 2) ** 2)
                mask = clamp((470 - np.minimum(r1, r2)) / 18)
                bview = bimg * mask[..., None] * 1.15
                img = img * (1 - k) + bview * k
                cards.label(img, "THROUGH BINOCULARS", W / 2, H - 70, (0.8, 0.82, 0.9), k * 0.8, 18, anchor="c")
        img *= (1 - p.get("dim", 0))
        return img


class Tide(Shot):
    """Harbour at dusk: a city across the bay behind a quay wall; the sea climbs the wall, then the city."""
    exposure = 1.4
    grade = ((0.01, 0.012, 0.03), (1.0, 0.98, 0.98))

    def __init__(self, p, dur, seg_start=0.0):
        super().__init__(p, dur, seg_start)
        rng = np.random.default_rng(14)
        self.hor = int(H * 0.52)
        self.quay = int(H * 0.60)          # top of the quay wall on the far shore (= normal city ground level)
        S = 3
        img = Image.new("L", (W * S, H * S), 0)
        d = ImageDraw.Draw(img)
        win = np.zeros((H, W), np.float32)
        far = Image.new("L", (W * S, H * S), 0)
        df = ImageDraw.Draw(far)
        # distant hazy skyline layer
        x = -20
        while x < W:
            bw, bh = rng.integers(30, 70), rng.integers(30, 120)
            df.rectangle([x * S, (self.quay - bh) * S, (x + bw) * S, (self.quay + 4) * S], fill=255)
            x += bw + rng.integers(0, 12)
        x = 520
        while x < W + 60:
            bw = int(rng.integers(46, 120))
            bh = float(rng.integers(90, 360)) * (0.55 + 0.6 * ((x - 520) / (W - 520)))
            top = self.quay - bh
            d.rectangle([x * S, top * S, (x + bw) * S, (self.quay + 2) * S], fill=255)
            # setbacks / crowns / antennas
            if rng.random() < 0.5:
                inset = bw * rng.uniform(0.15, 0.3)
                h2 = rng.uniform(20, 70)
                d.rectangle([(x + inset) * S, (top - h2) * S, (x + bw - inset) * S, top * S], fill=255)
                top -= h2
            if rng.random() < 0.3:
                d.polygon([(x + bw * 0.3) * S, top * S, (x + bw * 0.5) * S, (top - rng.uniform(25, 60)) * S, (x + bw * 0.7) * S, top * S], fill=255)
            if rng.random() < 0.25:
                d.line([((x + bw / 2) * S, top * S), ((x + bw / 2) * S, (top - 50) * S)], fill=255, width=S * 2)
            for wy in range(int(top + 10), self.quay - 6, 11):
                for wx in range(x + 6, x + bw - 6, 9):
                    if rng.random() < 0.3:
                        win[wy:wy + 5, wx:wx + 4] = rng.uniform(0.35, 1.0)
            x += bw + int(rng.integers(-10, 14))
        self.city_a = np.asarray(img.resize((W, H), Image.LANCZOS), np.float32) / 255.0
        self.far_a = np.asarray(far.resize((W, H), Image.LANCZOS), np.float32) / 255.0 * 0.9
        self.win = win * self.city_a
        y = np.arange(H, dtype=np.float32)[:, None, None]
        hn = clamp(y / self.hor)
        top_c, mid_c, low_c = hex2rgb("#050a20"), hex2rgb("#2a2c5a"), hex2rgb("#d0784a")
        sky = np.where(hn < 0.55, lerp(top_c, mid_c, clamp(hn / 0.55)), lerp(mid_c, low_c, clamp((hn - 0.55) / 0.45) ** 1.5))
        self.sky = (np.nan_to_num(sky) * 0.6).astype(np.float32)
        self.noise = [cv2.resize(fbm(W // 14, H // 2, scale=sc, seed=40 + i, octaves=4), (W, H // 2), interpolation=cv2.INTER_CUBIC) for i, sc in enumerate((14, 5))]
        self.lamps = [(x, H - 150) for x in range(120, W, 330)]

    def render(self, u, t, fi):
        rise = ease_in(span(u, 0.05, 0.95), 2.2)
        metres = 0.3 + rise * 38
        if hasattr(self, "metres"):
            metres = self.metres
        # water line: normal sea sits 40 px below the quay top; 38 m reaches ~170 px up the buildings
        lvl = self.quay + 40 - (metres / 38.0) * 210 + 3 * np.sin(t * 0.9)
        img = np.broadcast_to(self.sky, (H, W, 3)).copy()
        stars, _ = space_frame(1800 + 20 * u, 900, 1.6, angle=10)
        img += stars * 0.35 * (1 - clamp(np.arange(H)[:, None, None] / self.hor) ** 1.5)
        glow_dot(img, 420, 250, (1.0, 0.95, 0.85), 34, 0.06)
        mxs, mys = grid()
        mm = clamp(30 - np.sqrt((mxs - 420) ** 2 + (mys - 250) ** 2))
        img = img * (1 - mm[..., None]) + mm[..., None] * np.array([1.1, 1.05, 0.95], np.float32)
        img = lens_image(img, 1180, 140, 26, shadow=0.3)
        hz = self.sky[self.hor - 4][0]
        img = img * (1 - self.far_a[..., None]) + (hz * 0.55) * self.far_a[..., None]
        ys = np.arange(H, dtype=np.float32)[:, None]
        ca = self.city_a
        img = img * (1 - ca[..., None]) + (np.array([0.01, 0.011, 0.02], np.float32) + hz * 0.08) * ca[..., None]
        img += (self.win * (0.85 + 0.15 * np.sin(fi * 0.05 + mxs * 0.013)))[..., None] * np.array([1.6, 1.15, 0.6], np.float32) * 1.1
        # quay wall
        quay = ((ys > self.quay) & (ys < self.quay + 70)).astype(np.float32)
        img = img * (1 - quay[..., None]) + np.array([0.012, 0.012, 0.016], np.float32) * quay[..., None]
        # sea
        Ly = int(lvl)
        water_h = H - Ly
        n1 = cv2.resize(self.noise[0], (W, water_h)) if water_h != H // 2 else self.noise[0]
        n2 = cv2.resize(self.noise[1], (W, water_h)) if water_h != H // 2 else self.noise[1]
        yy = np.arange(water_h, dtype=np.float32)[:, None]
        persp = (yy + 8) / water_h
        off_x = (np.roll(n2, int(t * 40), axis=1) - 0.5) * 30 * persp
        src_y = np.clip(Ly - yy * 0.9 - 1 + (n1 - 0.5) * 16 * persp, 0, H - 1)
        mx = (np.arange(W, dtype=np.float32)[None, :] + off_x).astype(np.float32)
        refl = cv2.remap(img, mx, np.broadcast_to(src_y, (water_h, W)).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        refl = cv2.blur(refl, (5, 31))
        sheen = smooth(span(np.roll(n2, int(t * 25), axis=1), 0.7, 0.85)) * 0.12 * (1 - persp)
        water = refl * (0.32 - 0.18 * persp)[..., None] + np.array([0.004, 0.01, 0.02], np.float32) + sheen[..., None] * hz
        # foam where the water meets walls and buildings
        foam = np.exp(-yy / 3.0) * (0.5 + 0.5 * np.sin(np.arange(W)[None, :] * 0.05 + t * 3))
        water += foam[..., None] * np.array([0.25, 0.26, 0.28], np.float32) * 0.5
        img[Ly:] = water
        # near promenade railing + lamps (foreground, unchanged by the tide until the very end)
        rail = np.zeros((H, W), np.float32)
        rail[H - 120:H - 114, :] = 1
        rail[H - 60:, :] = 1
        for x in range(30, W, 130):
            rail[H - 120:H - 60, x:x + 6] = 1
        for (lx, ly) in self.lamps:
            rail[ly - 160:ly, lx:lx + 5] = 1
        img = img * (1 - rail[..., None]) + 0.003 * rail[..., None]
        for (lx, ly) in self.lamps:
            glow_dot(img, lx + 2, ly - 165, (1.0, 0.75, 0.4), 4, 2.0)
            glow_dot(img, lx + 2, ly - 165, (1.0, 0.7, 0.35), 30, 0.12)
        # tide gauge HUD
        a = smooth(span(u, 0.0, 0.08)) if not hasattr(self, "metres") else 1.0
        gx, gy0, gy1 = 150, 260, 760
        img[gy0:gy1, gx:gx + 2] = img[gy0:gy1, gx:gx + 2] * (1 - 0.5 * a) + 0.5 * a
        for m in (0, 10, 20, 30, 40):
            yy_ = gy1 - (gy1 - gy0) * m / 40
            cards.hline(img, gx - 10, gx, yy_, (0.85, 0.88, 0.95), 0.6 * a, 1)
            cards.label(img, f"{m} m", gx - 18, yy_, (0.75, 0.78, 0.86), 0.7 * a, 18, anchor="rc")
        my = gy1 - (gy1 - gy0) * min(metres, 40) / 40
        img[int(my):gy1, gx - 2:gx + 4] = img[int(my):gy1, gx - 2:gx + 4] * (1 - a) + np.array([1.0, 0.62, 0.32], np.float32) * a
        cards.label(img, "TIDE", gx + 24, my - 26, (0.75, 0.78, 0.86), a, 20)
        cards.label(img, f"+{metres:.1f} m", gx + 24, my + 14, (1.0, 0.97, 0.93), a, 40, kind="light", tracking=0.02)
        return img


class Ice(Shot):
    exposure = 1.5
    grade = ((0.01, 0.016, 0.035), (0.96, 1.0, 1.06))

    def __init__(self, p, dur, seg_start=0.0):
        super().__init__(p, dur, seg_start)
        self.hor = int(H * 0.6)
        tex = fbm(1024, 1024, scale=90, seed=71, octaves=6)
        rid = 1 - np.abs(2 * fbm(1024, 1024, scale=140, seed=72, octaves=5) - 1)
        cracks = smooth(span(rid, 0.93, 0.995))
        self.ice = (tex * 0.5 + 0.5) * (1 - 0.6 * cracks) + cracks * 0.0
        self.cracks = cracks
        rng = np.random.default_rng(73)
        n = 2600
        self.fx, self.fy0 = rng.random(n), rng.random(n)
        self.fz = rng.random(n) ** 1.5
        self.fs = rng.uniform(0.7, 1.0, n)
        S = 2
        img = Image.new("L", (W * S, H * S), 0)
        d = ImageDraw.Draw(img)
        x = 140
        while x < 760:
            bw = rng.integers(10, 26)
            bh = rng.integers(8, 34) * (1.6 if 300 < x < 520 else 1.0) * (2.2 if rng.random() < 0.12 else 1.0)
            d.rectangle([x * S, (self.hor - bh) * S, (x + bw) * S, (self.hor + 2) * S], fill=255)
            x += bw + rng.integers(0, 14) + (60 if rng.random() < 0.06 else 0)
        self.city = np.asarray(img.resize((W, H), Image.LANCZOS), np.float32) / 255.0

    def render(self, u, t, fi):
        img, _ = space_frame(3300 + 60 * u, 1500, 1.15, angle=-12)
        ys = np.arange(H, dtype=np.float32)[:, None, None]
        img = img * (1 - 0.5 * smooth(clamp((ys / self.hor - 0.7) / 0.3))) + lerp(hex2rgb("#01030a"), hex2rgb("#0a1626"), clamp(ys / self.hor) ** 3) * 0.6
        # the Sun, now just the brightest star
        glow_dot(img, 1500, 420, (1.0, 0.95, 0.85), 1.8, 14)
        glow_dot(img, 1500, 420, (1.0, 0.9, 0.8), 14, 0.08)
        star_spikes(img, 1500, 420, (1.0, 0.95, 0.9), 110, 0.35, angle=20)
        cards.label(img, "THE SUN", 1522, 446, (0.75, 0.78, 0.86), 0.6 * smooth(span(u, 0.1, 0.25)), 16)
        img = img * (1 - self.city[..., None]) + 0.004 * self.city[..., None]
        # ice plain in perspective
        gh = H - self.hor
        yy = np.arange(gh, dtype=np.float32)[:, None] + 1
        z = 240.0 / yy
        xx = (np.arange(W, dtype=np.float32)[None, :] - W / 2) * z / 240.0
        mu = ((xx * 300 + 512) % 1024).astype(np.float32)
        mv = ((z * 40 + u * 60) % 1024).astype(np.float32)
        mv = np.broadcast_to(mv, (gh, W)).astype(np.float32)
        it = cv2.remap(self.ice, mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        cr = cv2.remap(self.cracks, mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        fade = clamp(yy / gh)
        it = it * fade + 0.6 * (1 - fade)
        ground = (hex2rgb("#7f9bb8") * 0.05 * (it[..., None] * 0.35 + 0.65) * (0.5 + 0.8 * fade[..., None]))
        refl = blur(img[self.hor - 1::-1][:gh], 1.5) * 0.22 * (1 - 0.5 * cr[..., None] * fade[..., None])
        img[self.hor:] = ground + refl
        # snow of frozen air – nitrogen and oxygen crystals, sparkling as they fall
        k = smooth(span(u, 0.08, 0.3)) * _lp(self.p.get("snow", (0, 1)), u)
        if k > 0:
            fall = (self.fy0 + t * (0.02 + 0.05 * self.fz)) % 1.0
            sx = (self.fx * W + np.sin(t * 0.5 + self.fx * 30) * 12 * self.fz) % W
            sy = fall * H
            tw = 0.5 + 0.5 * np.sin(t * 6 + self.fx * 100)
            flux = (0.2 + 2.2 * self.fz ** 2 * tw) * k
            col = np.stack([flux * 0.85, flux * 0.92, flux], -1).astype(np.float32)
            layer = splat_points(np.zeros((H, W, 3), np.float32), sx, sy, col, sigma=0.6)
            layer += blur(layer, 2.5) * 0.6
            img += layer
        return img


class Vent(Shot):
    exposure = 1.7
    grade = ((0.0, 0.01, 0.025), (1.0, 1.0, 1.0))
    bloom = 0.8

    def __init__(self, p, dur, seg_start=0.0):
        super().__init__(p, dur, seg_start)
        Wb, Hb = int(W * 1.15), int(H * 1.15)
        self.Wb, self.Hb = Wb, Hb
        xs = np.arange(Wb, dtype=np.float32)[None, :]
        ys = np.arange(Hb, dtype=np.float32)[:, None]
        cx = Wb * 0.44
        top = Hb * 0.36
        k = clamp((ys - top) / (Hb - top))
        bumps = (ridge(Hb, 90, 1.0, 61)[:, None] - 0.5) * 60 + (ridge(Hb, 30, 1.0, 67)[:, None] - 0.5) * 18
        half = 40 + k ** 1.8 * 330 + bumps * (0.3 + k)
        lean = (ridge(Hb, 400, 1, 62)[:, None] - 0.5) * 50
        crown = top + (ridge(Wb, 25, 1.0, 68)[None, :] - 0.5) * 30
        chim = clamp(half - np.abs(xs - cx - lean) + 0.5) * clamp(ys - crown + 0.5)
        floor = clamp(ys - (Hb * 0.86 - ridge(Wb, 260, 80, 63)[None, :]) + 0.5)
        self.rock = np.maximum(chim, floor)
        self.rock_tex = fbm(Wb, Hb, scale=26, seed=64, octaves=5)
        self.top = (cx, top)
        rng = np.random.default_rng(65)
        self.worms = [(cx + rng.normal(0, 200), Hb * 0.86 - rng.uniform(-10, 30), rng.uniform(18, 55), rng.uniform(0, 6)) for _ in range(46)]
        n = 2600
        self.sx, self.sy, self.sz = rng.random(n), rng.random(n), rng.random(n)
        self.bio = rng.random((22, 3))
        self.smoke = [fbm(512, 1024, scale=s_, seed=66 + i, octaves=5) for i, s_ in enumerate((60, 24))]

    def render(self, u, t, fi):
        Wb, Hb = self.Wb, self.Hb
        ys = np.arange(Hb, dtype=np.float32)[:, None, None]
        img = np.zeros((Hb, Wb, 3), np.float32) + lerp(hex2rgb("#03101f"), hex2rgb("#000308"), clamp(ys / Hb)) * 0.6
        cx, top = self.top
        xs, ysg = np.meshgrid(np.arange(Wb, dtype=np.float32), np.arange(Hb, dtype=np.float32))
        d = np.sqrt((xs - cx) ** 2 + ((ysg - top) * 1.2) ** 2)
        flick = 0.85 + 0.15 * np.sin(t * 7) * np.sin(t * 3.1)
        img += (np.exp(-d / 34) * 2.6 + np.exp(-d / 180) * 0.35 + np.exp(-d / 600) * 0.06)[..., None] * np.array([1.0, 0.4, 0.09], np.float32) * flick
        # black-smoker plume: dense, billowing, lit orange from below
        ph, pw = int(top) + 10, 1100
        sm0 = np.roll(self.smoke[0], int(t * 26), axis=0)
        sm1 = np.roll(self.smoke[1], int(t * 52), axis=0)
        sm = cv2.resize(sm0 * 0.6 + sm1 * 0.4, (pw, ph))
        yy = np.arange(ph, dtype=np.float32)[:, None]
        h_ = (top - yy)
        xx = np.arange(pw, dtype=np.float32)[None, :] - pw / 2 - h_ * 0.18 * np.sin(t * 0.25 + h_ * 0.004)
        width = 22 + np.maximum(h_, 0) * 0.32
        cone = np.exp(-(xx ** 2) / (2 * width ** 2))
        win = np.sin(np.linspace(0, np.pi, pw))[None, :] ** 0.5
        dens = clamp(cone * (sm * 2.4 - 0.55) * 1.4) * clamp(h_ / 30 + 1) * win
        x0 = int(cx - pw / 2)
        reg = img[0:ph, x0:x0 + pw]
        lit = (np.exp(-np.maximum(h_, 0) / 90)[..., None] * np.array([1.0, 0.42, 0.1], np.float32) * 1.2
               + np.array([0.03, 0.036, 0.045], np.float32))
        img[0:ph, x0:x0 + pw] = reg * (1 - dens[..., None] * 0.95) + lit * dens[..., None] * (0.35 + 0.65 * sm[..., None])
        rim = np.exp(-d / 200)[..., None] * np.array([1.0, 0.38, 0.09], np.float32) * 0.22
        rockc = (0.003 + self.rock_tex[..., None] * 0.008) + rim * (0.2 + self.rock_tex[..., None])
        img = img * (1 - self.rock[..., None]) + rockc * self.rock[..., None]
        layer = np.zeros((Hb, Wb), np.uint8)
        layer_r = np.zeros((Hb, Wb), np.uint8)
        for (wx, wy, hgt, ph0) in self.worms:
            sway = np.sin(t * 0.9 + ph0) * 4
            tip = (int(wx + sway), int(wy - hgt))
            cv2.line(layer, (int(wx), int(wy)), tip, 210, 2, cv2.LINE_AA)
            cv2.circle(layer_r, tip, 3, 255, -1, cv2.LINE_AA)
        near = np.exp(-d / 420)[..., None]
        img += (layer.astype(np.float32) / 255)[..., None] * np.array([0.45, 0.42, 0.38], np.float32) * (0.08 + near * 0.8)
        img += (layer_r.astype(np.float32) / 255)[..., None] * np.array([1.2, 0.06, 0.05], np.float32) * (0.1 + near * 1.6)
        sx = (self.sx * Wb + np.sin(t * 0.2 + self.sz * 9) * 20) % Wb
        sy = (self.sy * Hb + t * (6 + 14 * self.sz)) % Hb
        img = splat_points(img, sx, sy, (np.stack([self.sz, self.sz, self.sz * 1.1], -1) * 0.04 + 0.006).astype(np.float32), sigma=0.0)
        for bx, by, bp in self.bio:
            a = max(0, np.sin(t * 1.3 + bp * 20)) ** 8
            glow_dot(img, bx * Wb, by * Hb * 0.8, (0.2, 0.9, 1.0), 2.2, a * 0.5)
        z = 1 + 0.08 * smoother(u)
        M = np.float32([[z, 0, -(Wb - W) / 2 * z + (1 - z) * W / 2 - 30 * u], [0, z, -(Hb - H) / 2 * z + (1 - z) * H / 2]])
        return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
