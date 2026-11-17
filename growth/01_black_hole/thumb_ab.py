"""A/B thumbnail variants built on the episode's own finding (Venus is carried off; Earth is ejected)."""
import os
import numpy as np, cv2
from engine.core import W, H, post, glow_dot
from engine.space import space_frame
from engine.planet import render_planet
from engine import cards

cards.FONT_FILES["black"] = cards.INTER + "Inter-Black.otf"


def _text(out, text, x, y, size, color, anchor="lt"):
    a = cards.sprite(text, "black", size, -0.02)
    sh = cv2.GaussianBlur(np.pad(a, 40), (0, 0), 14)[40:-40, 40:-40]
    cards.put(out, sh, x + 5, y + 8, (0, 0, 0), 1.0, anchor)
    cards.put(out, a, x, y, color, 1.0, anchor)


def _trail(img, pts, color, width):
    """Glowing polyline that fades in along its length."""
    layer = np.zeros_like(img)
    n = len(pts)
    for i in range(n - 1):
        f = (i / n) ** 1.6
        c = tuple(float(v * f) for v in color)
        p0 = tuple(int(v) for v in pts[i]); p1 = tuple(int(v) for v in pts[i + 1])
        cv2.line(layer, p0, p1, c, width, cv2.LINE_AA)
    img += cv2.GaussianBlur(layer, (0, 0), 9) * 1.6 + layer


def _save(o, d, name):
    o = (np.clip(o, 0, 1) * 255).astype(np.uint8)[..., ::-1]
    p = os.path.join(d, name)
    cv2.imwrite(p, cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
    return p


def venus(d):
    bx, by, te = W * 0.34, H * 0.55, 250
    img, _ = space_frame(3050, 1560, 1.25, angle=-8, lenses=[(bx, by, te)])
    img *= 1.15
    # Venus being dragged around the hole: an arc ending at the planet, stretched toward the hole
    t = np.linspace(-2.6, -0.95, 160)
    r = te * 1.55
    pts = np.stack([bx + r * 1.15 * np.cos(t), by + r * 0.75 * np.sin(t)], 1)
    _trail(img, pts, (1.0, 0.55, 0.15), 8)
    vx, vy = pts[-1]
    render_planet(img, vx, vy, 105, "venus", spin=0.4, tilt=0.2, light=(-0.9, 0.2, 0.4), clouds=False)
    # Earth, small and far, left behind
    render_planet(img, 1690, 900, 150, "earth", spin=1.95, tilt=0.5, light=(-0.8, 0.4, 0.4))
    out = post(img, 0, exposure=1.8, bloom=0.75, grain=0.01).astype(np.float32) / 255
    _text(out, "IT TOOK", 1060, 150, 190, (1.0, 0.97, 0.93))
    _text(out, "VENUS", 1060, 350, 230, (1.0, 0.58, 0.18))
    return _save(out, d, "thumbnail_B_venus.png")


def frozen(d):
    bx, by, te = W * 0.30, H * 0.40, 210
    img, _ = space_frame(3050, 1560, 1.25, angle=-8, lenses=[(bx, by, te)])
    img *= 0.9
    # the Sun, now just a star
    glow_dot(img, 1500, 150, (1.0, 0.9, 0.7), 6, 3.0)
    render_planet(img, 1420, 1250, 760, "earth", spin=0.9, tilt=0.45, light=(0.5, 0.8, 0.35),
                  ice=1.0, lights_fade=0.0, exposure=0.75)
    out = post(img, 0, exposure=1.6, bloom=0.6, grain=0.01).astype(np.float32) / 255
    _text(out, "NO MORE", 60, 560, 150, (1.0, 0.97, 0.93))
    _text(out, "SUN", 60, 720, 230, (0.55, 0.85, 1.0))
    return _save(out, d, "thumbnail_C_frozen.png")


if __name__ == "__main__":
    import sys
    d = sys.argv[1]
    os.makedirs(d, exist_ok=True)
    print(venus(d)); print(frozen(d))
