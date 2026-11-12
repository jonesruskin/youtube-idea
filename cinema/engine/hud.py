"""Explainer graphics: self-drawing lines, arrows, dimension lines, counters, charts, icons.
Everything is drawn anti-aliased on a float layer, then composited with a soft glow so it sits in the shot."""
import numpy as np
import cv2
from .core import W, H, clamp, smooth, smoother, span, ease_out, lerp, blur, fast_blur
from . import cards

SHIFT = 4
SC = 1 << SHIFT
WHITE = (1.0, 0.97, 0.93)
ACC = (1.0, 0.62, 0.32)
BLUE = (0.55, 0.78, 1.0)
RED = (1.0, 0.35, 0.3)
GREEN = (0.5, 1.0, 0.6)
DIM = (0.7, 0.74, 0.82)


class Layer:
    """Accumulates vector strokes (colour × alpha) for one frame, then composites with glow."""

    def __init__(self):
        self.col = np.zeros((H, W, 3), np.float32)
        self.a = np.zeros((H, W), np.float32)

    def _stamp(self, mask_u8, color, alpha):
        m = mask_u8.astype(np.float32) / 255.0 * alpha
        self.col = self.col * (1 - m[..., None]) + np.asarray(color, np.float32) * m[..., None]
        self.a = np.maximum(self.a, m)

    def _canvas(self):
        return np.zeros((H, W), np.uint8)

    def polyline(self, pts, color=WHITE, alpha=1.0, th=2, progress=1.0, closed=False, dash=0):
        pts = np.asarray(pts, np.float64)
        if len(pts) < 2 or alpha <= 0 or progress <= 0:
            return
        if progress < 1:
            seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
            L = np.concatenate([[0], np.cumsum(seg)])
            cut = L[-1] * progress
            k = np.searchsorted(L, cut)
            k = max(1, min(k, len(pts) - 1))
            f = (cut - L[k - 1]) / max(1e-9, seg[k - 1])
            pts = np.vstack([pts[:k], pts[k - 1] + (pts[k] - pts[k - 1]) * f])
        m = self._canvas()
        if dash:
            seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
            L = np.concatenate([[0], np.cumsum(seg)])
            # resample evenly and draw every other piece
            n = max(2, int(L[-1] / dash))
            s = np.linspace(0, L[-1], n * 2 + 1)
            xs = np.interp(s, L, pts[:, 0]); ys = np.interp(s, L, pts[:, 1])
            for i in range(0, len(s) - 1, 2):
                cv2.line(m, (int(xs[i] * SC), int(ys[i] * SC)), (int(xs[i + 1] * SC), int(ys[i + 1] * SC)), 255, th, cv2.LINE_AA, SHIFT)
        else:
            cv2.polylines(m, [np.round(pts * SC).astype(np.int32)], closed and progress >= 1, 255, th, cv2.LINE_AA, SHIFT)
        self._stamp(m, color, alpha)

    def line(self, p0, p1, **kw):
        self.polyline([p0, p1], **kw)

    def circle(self, c, r, color=WHITE, alpha=1.0, th=2, progress=1.0, fill=False, start=-90):
        if alpha <= 0 or r <= 0:
            return
        if fill:
            m = self._canvas()
            cv2.circle(m, (int(c[0] * SC), int(c[1] * SC)), int(r * SC), 255, -1, cv2.LINE_AA, SHIFT)
            self._stamp(m, color, alpha)
            return
        a = np.radians(np.linspace(start, start + 360 * progress, max(8, int(r * progress * 0.8) + 8)))
        self.polyline(np.stack([c[0] + r * np.cos(a), c[1] + r * np.sin(a)], -1), color, alpha, th)

    def ellipse(self, c, rx, ry, color=WHITE, alpha=1.0, th=1, progress=1.0, rot=0.0, dash=0):
        a = np.radians(np.linspace(0, 360 * progress, 240))
        x, y = rx * np.cos(a), ry * np.sin(a)
        cr, sr = np.cos(rot), np.sin(rot)
        self.polyline(np.stack([c[0] + x * cr - y * sr, c[1] + x * sr + y * cr], -1), color, alpha, th, dash=dash)

    def arrow(self, p0, p1, color=WHITE, alpha=1.0, th=3, head=16, progress=1.0):
        p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
        p1 = p0 + (p1 - p0) * progress
        if np.linalg.norm(p1 - p0) < 2 or alpha <= 0:
            return
        self.line(p0, p1, color=color, alpha=alpha, th=th)
        d = (p1 - p0) / np.linalg.norm(p1 - p0)
        n = np.array([-d[1], d[0]])
        hh = min(head, np.linalg.norm(p1 - p0) * 0.6)
        tri = np.array([p1 + d * 2, p1 - d * hh + n * hh * 0.55, p1 - d * hh - n * hh * 0.55])
        m = self._canvas()
        cv2.fillPoly(m, [np.round(tri * SC).astype(np.int32)], 255, cv2.LINE_AA, SHIFT)
        self._stamp(m, color, alpha)

    def poly(self, pts, color=WHITE, alpha=1.0):
        m = self._canvas()
        cv2.fillPoly(m, [np.round(np.asarray(pts) * SC).astype(np.int32)], 255, cv2.LINE_AA, SHIFT)
        self._stamp(m, color, alpha)

    def rect(self, x0, y0, x1, y1, color=WHITE, alpha=1.0, th=2, fill=False):
        if fill:
            self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], color, alpha)
        else:
            self.polyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], color, alpha, th, closed=True)

    def cross(self, c, r, color=RED, alpha=1.0, th=4, progress=1.0):
        p1 = min(1, progress * 2)
        p2 = clamp(progress * 2 - 1)
        self.line((c[0] - r, c[1] - r), (c[0] + r, c[1] + r), color=color, alpha=alpha, th=th, progress=p1)
        if p2 > 0:
            self.line((c[0] + r, c[1] - r), (c[0] - r, c[1] + r), color=color, alpha=alpha, th=th, progress=p2)

    def check(self, c, r, color=GREEN, alpha=1.0, th=4, progress=1.0):
        self.polyline([(c[0] - r, c[1]), (c[0] - r * 0.3, c[1] + r * 0.7), (c[0] + r, c[1] - r * 0.7)], color, alpha, th, progress=progress)

    def composite(self, img, glow=0.6):
        a = self.a[..., None]
        if glow > 0:
            g = fast_blur(self.col * a, 7) * glow * 1.6 + fast_blur(self.col * a, 24) * glow * 0.6
            img = img + g
        return img * (1 - a) + self.col * a * 1.25


# ───────────── text helpers ─────────────
def text(img, s, x, y, size=24, color=WHITE, alpha=1.0, anchor="lc", kind="mono", tracking=0.12, glow=0.0):
    if alpha <= 0.002 or not s:
        return img
    size = int(round(size * 1.2)) if size < 60 else size   # phone-legible minimum sizes
    spr = cards.sprite(s, kind, size, tracking)
    h, w = spr.shape
    # keep every label inside the title-safe area (shift, never crop)
    x0 = x - w / 2 if anchor[0] == "c" else (x - w if "r" in anchor else x)
    y0 = y if "t" in anchor else (y - h if "b" in anchor else y - h / 2)
    dx = max(0, 40 - x0) - max(0, x0 + w - (W - 40))
    dy = max(0, 24 - y0) - max(0, y0 + h - (H - 24))
    if QA["key"] is not None and alpha > 0.5:
        _qa_overlap(s, x0 + dx, y0 + dy, w, h)
    return cards.put(img, spr, x + dx, y + dy, color, alpha, anchor, glow)


# QA: text-on-text collision detection (active only while rendering stills with QA_LOG set)
QA = {"key": None, "boxes": [], "last": None}


def _qa_overlap(s, x0, y0, w, h, pad=4):
    if QA["key"] != QA["last"]:
        QA["last"], QA["boxes"] = QA["key"], []
    a = (x0 + pad, y0 + pad, x0 + w - pad, y0 + h - pad)
    for (o, b) in QA["boxes"]:
        if a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]:
            cards._qa_log(f"TEXT OVERLAP '{s}' collides with '{o}'")
    QA["boxes"].append((s, a))


def typed(s, p):
    """Type-on reveal of string s at progress p."""
    n = int(round(len(s) * clamp(p)))
    return s[:n]


def counter(v0, v1, p, fmt="{:,.0f}"):
    return fmt.format(lerp(v0, v1, smoother(clamp(p))))


def fade(t, t0, t1=None, d=0.35):
    """Alpha that fades in at t0 and (optionally) out at t1 (seconds)."""
    a = smooth(span(t, t0, t0 + d))
    if t1 is not None:
        a *= 1 - smooth(span(t, t1 - d, t1))
    return a


def prog(t, t0, d=0.8):
    return ease_out(span(t, t0, t0 + d), 3)


def panel(img, x0, y0, x1, y1, alpha=1.0, strength=0.55):
    """Dark glass panel behind graphics for legibility."""
    if alpha <= 0:
        return img
    m = np.zeros((H, W), np.float32)
    m[int(y0):int(y1), int(x0):int(x1)] = 1
    m = blur(m, 18) * strength * alpha
    img = img * (1 - m[..., None])
    L = Layer()
    L.rect(x0, y0, x1, y1, DIM, 0.25 * alpha, 1)
    return L.composite(img, 0)


def dimension(L, img, p0, p1, label, alpha=1.0, progress=1.0, color=WHITE, offset=0, size=22):
    """Engineering-style dimension line with end ticks and a centred label."""
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    d = (p1 - p0) / (np.linalg.norm(p1 - p0) + 1e-9)
    n = np.array([-d[1], d[0]])
    a0, a1 = p0 + n * offset, p1 + n * offset
    mid = (a0 + a1) / 2
    L.line(mid, mid + (a0 - mid) * progress, color=color, alpha=alpha, th=2)
    L.line(mid, mid + (a1 - mid) * progress, color=color, alpha=alpha, th=2)
    if progress > 0.98:
        for a in (a0, a1):
            L.line(a - n * 10, a + n * 10, color=color, alpha=alpha, th=2)
    lp = mid + n * (26 if offset >= 0 else -26)
    return text(img, label, lp[0], lp[1], size, color, alpha * smooth(span(progress, 0.6, 1.0)), "c")


def chart(L, img, x0, y0, w, h, xs, ys, p=1.0, color=ACC, alpha=1.0, xlabel="", ylabel="", fill=True):
    """Animated line chart. xs, ys in [0,1]. p = draw progress."""
    L.line((x0, y0 + h), (x0 + w, y0 + h), color=DIM, alpha=0.6 * alpha, th=1)
    L.line((x0, y0), (x0, y0 + h), color=DIM, alpha=0.6 * alpha, th=1)
    pts = np.stack([x0 + np.asarray(xs) * w, y0 + h - np.asarray(ys) * h], -1)
    if fill and p > 0:
        k = max(2, int(len(pts) * p))
        poly = np.vstack([pts[:k], [[pts[k - 1][0], y0 + h], [pts[0][0], y0 + h]]])
        L.poly(poly, color, 0.12 * alpha)
    L.polyline(pts, color, alpha, 3, progress=p)
    if p > 0:
        k = max(1, int((len(pts) - 1) * p))
        L.circle(pts[k], 6, color, alpha, fill=True)
    img = text(img, xlabel, x0 + w, y0 + h + 26, 17, DIM, alpha, "rc")
    img = text(img, ylabel, x0, y0 - 22, 17, DIM, alpha, "lc")
    return img


def callout(L, img, target, label, sub=None, alpha=1.0, progress=1.0, dx=120, dy=-80, color=WHITE, size=24):
    """Leader line from a target point to a label."""
    tx, ty = target
    ex, ey = tx + dx, ty + dy
    hx = ex + (90 if dx >= 0 else -90)
    L.circle((tx, ty), 7, color, alpha * 0.9, th=2)
    L.polyline([(tx + np.sign(dx) * 6, ty + np.sign(dy) * 6), (ex, ey), (hx, ey)], color, alpha, 2, progress=progress)
    a2 = alpha * smooth(span(progress, 0.7, 1.0))
    anc = "lb" if dx >= 0 else "rb"
    img = text(img, label, hx + (8 if dx >= 0 else -8), ey - 4, size, color, a2, anc, kind="mono6")
    if sub:
        img = text(img, sub, hx + (8 if dx >= 0 else -8), ey + 8, size - 6, DIM, a2, "lt" if dx >= 0 else "rt")
    return img


# ───────────── icons (line-art, consistent stroke) ─────────────
def icon_rocket(L, c, s, color=WHITE, alpha=1.0, flame=0.0, angle=0.0):
    pts = np.array([(0, -1.0), (0.22, -0.55), (0.22, 0.45), (0.45, 0.8), (0.22, 0.7), (0.0, 0.75), (-0.22, 0.7), (-0.45, 0.8), (-0.22, 0.45), (-0.22, -0.55)])
    ca, sa = np.cos(angle), np.sin(angle)
    R = np.array([[ca, -sa], [sa, ca]])
    P = (pts @ R.T) * s + c
    L.polyline(P, color, alpha, 2, closed=True)
    if flame > 0:
        fl = np.array([(-0.15, 0.78), (0, 0.78 + 0.9 * flame), (0.15, 0.78)]) @ R.T * s + c
        L.poly(fl, ACC, alpha * 0.9)
    win = np.array([0, -0.25]) @ R.T * s + c
    L.circle(win, s * 0.1, color, alpha, th=2)


def icon_house(L, c, s, color=WHITE, alpha=1.0):
    x, y = c
    L.polyline([(x - s, y + s * 0.6), (x - s, y - s * 0.1), (x, y - s * 0.8), (x + s, y - s * 0.1), (x + s, y + s * 0.6)], color, alpha, 2, closed=True)


def icon_atom(L, c, s, color=WHITE, alpha=1.0, t=0.0):
    for k in range(3):
        L.ellipse(c, s, s * 0.36, color, alpha, 2, rot=k * np.pi / 3 + t * 0.3)
    L.circle(c, s * 0.12, color, alpha, fill=True)


def icon_seed(L, c, s, color=GREEN, alpha=1.0):
    x, y = c
    L.ellipse((x, y + s * 0.4), s * 0.45, s * 0.3, color, alpha, 2)
    L.polyline([(x, y + s * 0.1), (x, y - s * 0.6)], color, alpha, 2)
    L.ellipse((x - s * 0.3, y - s * 0.5), s * 0.3, s * 0.14, color, alpha, 2, rot=-0.5)
    L.ellipse((x + s * 0.3, y - s * 0.7), s * 0.3, s * 0.14, color, alpha, 2, rot=0.5)


def icon_book(L, c, s, color=WHITE, alpha=1.0):
    x, y = c
    L.polyline([(x, y - s * 0.5), (x - s, y - s * 0.7), (x - s, y + s * 0.6), (x, y + s * 0.8), (x + s, y + s * 0.6), (x + s, y - s * 0.7), (x, y - s * 0.5), (x, y + s * 0.8)], color, alpha, 2)


def icon_heat(L, c, s, color=ACC, alpha=1.0, t=0.0):
    x, y = c
    for k in (-1, 0, 1):
        ys = np.linspace(s, -s, 30)
        xs = x + k * s * 0.6 + np.sin(ys / s * 4 + t * 4) * s * 0.15
        L.polyline(np.stack([xs, y + ys], -1), color, alpha, 2)


def icon_thermo(L, img, c, s, level, color=ACC, alpha=1.0, label=None):
    x, y = c
    L.rect(x - s * 0.18, y - s, x + s * 0.18, y + s * 0.7, DIM, alpha * 0.8, 2)
    L.circle((x, y + s * 0.85), s * 0.3, DIM, alpha * 0.8, th=2)
    L.circle((x, y + s * 0.85), s * 0.22, color, alpha, fill=True)
    top = y + s * 0.7 - (s * 1.62) * clamp(level)
    L.rect(x - s * 0.09, top, x + s * 0.09, y + s * 0.75, color, alpha, fill=True)
    if label:
        img = text(img, label, x + s * 0.45, top, 26, color, alpha, "lc", kind="light", tracking=0.02)
    return img


def icon_eye(L, c, s, color=WHITE, alpha=1.0):
    x, y = c
    a = np.linspace(-1, 1, 30)
    L.polyline(np.stack([x + a * s, y - (1 - a ** 2) * s * 0.55], -1), color, alpha, 2)
    L.polyline(np.stack([x + a * s, y + (1 - a ** 2) * s * 0.55], -1), color, alpha, 2)
    L.circle((x, y), s * 0.28, color, alpha, th=2)


def icon_phone(L, img, c, s, color=WHITE, alpha=1.0):
    x, y = c
    L.rect(x - s * 0.5, y - s, x + s * 0.5, y + s, color, alpha, 3)
    L.rect(x - s * 0.5, y - s, x + s * 0.5, y + s, (0.02, 0.03, 0.06), alpha * 0.8, fill=True)
    L.line((x - s * 0.12, y - s * 0.92), (x + s * 0.12, y - s * 0.92), color=color, alpha=alpha, th=3)
    return img


def icon_comet(L, c, s, color=BLUE, alpha=1.0):
    x, y = c
    L.circle((x, y), s * 0.18, color, alpha, fill=True)
    for k in (-1, 0, 1):
        L.line((x, y), (x + s * 1.6, y - s * 0.9 + k * s * 0.18), color=color, alpha=alpha * (0.6 - abs(k) * 0.2), th=2)
