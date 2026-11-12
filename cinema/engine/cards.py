"""Typography: chapter cards, stats, tags, labels, title and end card. Minimal, wide-tracked, premium."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from .core import W, H, FONTS, clamp, smooth, span, ease_out, blur, fast_blur

INTER = "/usr/share/fonts/opentype/inter/"
FONT_FILES = {
    "thin": INTER + "InterDisplay-Thin.otf",
    "xlight": INTER + "InterDisplay-ExtraLight.otf",
    "light": INTER + "InterDisplay-Light.otf",
    "regular": INTER + "InterDisplay-Regular.otf",
    "medium": INTER + "InterDisplay-Medium.otf",
    "semibold": INTER + "InterDisplay-SemiBold.otf",
    "mono": os.path.join(FONTS, "IBMPlexMono-400.woff2"),
    "mono6": os.path.join(FONTS, "IBMPlexMono-600.woff2"),
    "serif": os.path.join(FONTS, "CormorantGaramond.woff2"),
}
_FONT, _SPRITE = {}, {}


def font(kind, size):
    k = (kind, size)
    if k not in _FONT:
        f = ImageFont.truetype(FONT_FILES[kind], size)
        if kind == "serif":
            try:
                f.set_variation_by_axes([400])
            except Exception:
                pass
        _FONT[k] = f
    return _FONT[k]


_CMAP = {}


class MissingGlyph(Exception):
    pass


def check_glyphs(text, kind):
    """Hard guard: every character must exist in the font, otherwise viewers see empty boxes (tofu)."""
    if kind not in _CMAP:
        from fontTools.ttLib import TTFont
        _CMAP[kind] = set(TTFont(FONT_FILES[kind]).getBestCmap().keys())
    missing = [c for c in text if c.strip() and ord(c) not in _CMAP[kind]]
    if missing:
        raise MissingGlyph(f"font '{kind}' has no glyph for {missing!r} in {text!r}")


def sprite(text, kind, size, tracking=0.0):
    """Alpha mask (float32) of text, with letter-spacing in em."""
    k = (text, kind, size, round(tracking, 3))
    if k in _SPRITE:
        return _SPRITE[k]
    check_glyphs(text, kind)
    f = font(kind, size)
    ss = 2  # supersample for crisp edges
    fs = font(kind, size * ss)
    tr = tracking * size * ss
    widths = [fs.getlength(c) for c in text]
    tw = int(sum(widths) + tr * max(0, len(text) - 1)) + 8 * ss
    asc, desc = fs.getmetrics()
    img = Image.new("L", (max(4, tw), asc + desc + 8 * ss), 0)
    d = ImageDraw.Draw(img)
    x = 4 * ss
    for c, wdt in zip(text, widths):
        d.text((x, 4 * ss), c, font=fs, fill=255)
        x += wdt + tr
    a = np.asarray(img, np.float32) / 255.0
    a = a.reshape(a.shape[0] // ss, ss, a.shape[1] // ss, ss).mean((1, 3)) if a.shape[0] % ss == 0 and a.shape[1] % ss == 0 else \
        np.asarray(img.resize((img.width // ss, img.height // ss), Image.LANCZOS), np.float32) / 255.0
    _SPRITE[k] = a
    return a


def _qa_log(msg):
    p = os.environ.get("QA_LOG")
    if p:
        with open(p, "a") as f:
            f.write(os.environ.get("QA_CTX", "?") + " | " + msg + "\n")


def put(img, a, x, y, color=(1, 1, 1), alpha=1.0, anchor="c", glow=0.0):
    """Composite a text mask; (x,y) is the anchor point. Values are HDR-friendly (colour can exceed 1)."""
    if alpha <= 0.002:
        return img
    h, w = a.shape
    if anchor[0] == "c" or anchor == "c":
        x0 = int(round(x - w / 2))
    elif "r" in anchor:
        x0 = int(round(x - w))
    else:
        x0 = int(round(x))
    if "t" in anchor:
        y0 = int(round(y))
    elif "b" in anchor:
        y0 = int(round(y - h))
    else:
        y0 = int(round(y - h / 2))
    if alpha > 0.5 and (x0 < 24 or y0 < 16 or x0 + w > W - 24 or y0 + h > H - 16):
        _qa_log(f"OFFSCREEN text at x={x0}..{x0 + w}, y={y0}..{y0 + h}")
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if X1 <= X0 or Y1 <= Y0:
        return img
    m = a[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] * alpha
    col = np.asarray(color, np.float32)
    reg = img[Y0:Y1, X0:X1]
    if glow > 0:
        g = blur(np.pad(m, 20), 8)[20:-20, 20:-20]
        reg += g[..., None] * col * glow
    img[Y0:Y1, X0:X1] = reg * (1 - m[..., None] * 0.85) + m[..., None] * col
    return img


def hline(img, x0, x1, y, color=(1, 1, 1), alpha=1.0, th=1.0):
    if alpha <= 0 or x1 <= x0:
        return img
    y0 = int(y)
    xa, xb = int(max(0, x0)), int(min(W, x1))
    img[y0:y0 + max(1, int(th)), xa:xb] = img[y0:y0 + max(1, int(th)), xa:xb] * (1 - alpha) + np.asarray(color, np.float32) * alpha
    return img


def dim_scrim(img, strength, y_center=None):
    """Darken behind text for legibility (soft horizontal band)."""
    if strength <= 0:
        return img
    ys = np.arange(H, dtype=np.float32)
    yc = H / 2 if y_center is None else y_center
    band = np.exp(-((ys - yc) ** 2) / (2 * 190 ** 2)) * strength
    return img * (1 - band[:, None, None])


def _reveal(lt, start, dur=0.9):
    return ease_out(span(lt, start, start + dur), 3)


def card(img, c, lt, seg_dur):
    """Draw card `c` at local time lt (s) within a segment of length seg_dur."""
    kind = c["kind"]
    at = c.get("at", 0.0) * seg_dur
    out_t = c.get("out", seg_dur - 0.6) if kind not in ("title", "endcard") else seg_dur + 10
    fade_out = 1 - smooth(span(lt, out_t, out_t + 0.6))
    WHITE = (1.0, 0.97, 0.93)
    ACC = (1.0, 0.62, 0.32)
    if kind == "chapter":
        # occupies the first ~4.2 s of the segment, lower-left, cinematic
        a_in = _reveal(lt, 0.25, 1.0)
        a = a_in * (1 - smooth(span(lt, 4.0, 4.8)))
        if a <= 0:
            return img
        img = dim_scrim(img, 0.35 * a, y_center=H - 230)
        x = 140
        lw = 360 * ease_out(span(lt, 0.15, 1.2))
        hline(img, x, x + lw, H - 300, ACC, 0.9 * a, 2)
        put(img, sprite(c["num"], "mono6", 30, 0.32), x, H - 270, ACC, a, "lt")
        sl = sprite(c["text"], "light", 76, -0.01)
        put(img, sl, x - 2 + 30 * (1 - a_in), H - 222, WHITE, a, "lt")
    elif kind == "fate":
        a_in = _reveal(lt, 0.15, 0.8)
        a = a_in * (1 - smooth(span(lt, 2.2, 2.8)))
        if a <= 0:
            return img
        img = dim_scrim(img, 0.45 * a, y_center=H - 230)
        put(img, sprite(c["num"], "mono6", 30, 0.5), W / 2, H - 330, ACC, a)
        put(img, sprite(c["text"], "thin", 120, 0.06), W / 2, H - 240, WHITE, a, glow=0.15)
        lw = 220 * ease_out(span(lt, 0.4, 1.6))
        hline(img, W / 2 - lw, W / 2 + lw, H - 160, WHITE, 0.5 * a, 1)
    elif kind == "stat":
        a = _reveal(lt, at, 1.0) * fade_out
        if a <= 0:
            return img
        img = dim_scrim(img, 0.25 * a, y_center=H - 210)
        big = sprite(c["big"], "xlight", 118, 0.04)
        put(img, big, W / 2, H - 250 + 14 * (1 - a), WHITE, a, glow=0.2)
        put(img, sprite(c["small"], "mono", 26, 0.42), W / 2, H - 162, ACC, a)
    elif kind == "tag":
        a = _reveal(lt, at, 0.8) * fade_out
        if a <= 0:
            return img
        x, y = 140, H - 190
        hline(img, x, x + 60 * a, y - 30, ACC, a, 2)
        put(img, sprite(c["text"], "mono6", 34, 0.12), x, y, WHITE, a, "lt")
        put(img, sprite(c["sub"], "mono", 24, 0.12), x, y + 52, (0.75, 0.78, 0.85), a, "lt")
    elif kind == "title":
        a = _reveal(lt, 0.3, 1.6) * (1 - smooth(span(lt, seg_dur - 0.9, seg_dur - 0.1)))
        tr = 0.26 + 0.1 * (1 - ease_out(span(lt, 0.0, seg_dur), 2))
        put(img, sprite(c["text"], "thin", 100, round(tr, 3)), W / 2, H / 2 - 20, WHITE, a, glow=0.35)
        put(img, sprite(c["sub"].upper(), "mono", 24, 0.5), W / 2, H / 2 + 80, ACC, a * _reveal(lt, 1.0, 1.2))
    elif kind == "endcard":
        a = _reveal(lt, 1.2, 1.2)
        img = img * (1 - 0.45 * a)
        # YouTube end-screen safe zones: two video slots + subscribe
        for (x, y) in ((560, 560), (1360, 560)):
            bw, bh = 640, 360
            box = np.zeros((H, W), np.float32)
            box[y - bh // 2:y + bh // 2, x - bw // 2:x + bw // 2] = 1
            edge = box - np.pad(box[2:-2, 2:-2], 2)
            img += edge[..., None] * np.array([0.6, 0.6, 0.65], np.float32) * 0.5 * a
        put(img, sprite("KEEP LOOKING", "mono6", 28, 0.5), W / 2, 240, ACC, a)
        put(img, sprite("More from the dark", "light", 56, 0.0), W / 2, 300, WHITE, a)
    return img


def label(img, text, x, y, color=(0.85, 0.88, 0.95), alpha=1.0, size=22, anchor="lc", kind="mono", tracking=0.2):
    return put(img, sprite(text, kind, size, tracking), x, y, color, alpha, anchor)
