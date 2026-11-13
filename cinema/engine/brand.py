"""Channel identity. Change CHANNEL here and re-render the 'title' and 'outro' segments of each episode to rebrand."""
import numpy as np
from .core import W, H, glow_dot, smooth

CHANNEL = "GRAVITY DIAL"
TAGLINE = "WHAT IF, SIMULATED"

_A0, _A1 = np.radians(135), np.radians(405)   # gauge sweep: 270 degrees, gap at the bottom


def logo(img, x, y, s=1.0, alpha=1.0, t=0.0):
    """Mark: a gauge dial. The needle swings from low to max (we turn the universe's dial),
    overshoots slightly and settles; a small planet sits on the hub."""
    if alpha <= 0:
        return img
    from .hud import Layer
    R = 40 * s
    # needle: sweep up over ~1.4 s with a small overshoot, then a tiny idle wobble
    u = smooth(min(1.0, max(0.0, (t - 0.2) / 1.4)))
    over = 0.06 * np.sin(np.pi * u) ** 2 * (1 - u) * 4
    frac = 0.12 + 0.76 * u + over + 0.008 * np.sin(t * 2.3) * u
    ang = _A0 + (_A1 - _A0) * frac
    L = Layer()
    a = np.linspace(_A0, _A1, 160)
    L.polyline(np.stack([x + R * np.cos(a), y + R * np.sin(a)], -1), (0.75, 0.78, 0.85), alpha * 0.8, th=max(2, int(2 * s)))
    # red zone at the top end of the scale
    a = np.linspace(_A0 + (_A1 - _A0) * 0.8, _A1, 40)
    L.polyline(np.stack([x + R * np.cos(a), y + R * np.sin(a)], -1), (1.0, 0.45, 0.2), alpha, th=max(3, int(4 * s)))
    for i in range(10):  # ticks
        ta = _A0 + (_A1 - _A0) * i / 9
        r0 = R * (0.74 if i % 3 == 0 else 0.82)
        L.line((x + r0 * np.cos(ta), y + r0 * np.sin(ta)), (x + R * 0.93 * np.cos(ta), y + R * 0.93 * np.sin(ta)),
               color=(0.75, 0.78, 0.85), alpha=alpha * 0.7, th=max(1, int(2 * s)))
    tip = (x + R * 0.86 * np.cos(ang), y + R * 0.86 * np.sin(ang))
    L.line((x - R * 0.18 * np.cos(ang), y - R * 0.18 * np.sin(ang)), tip, color=(1.0, 0.62, 0.32), alpha=alpha, th=max(2, int(3 * s)))
    L.circle((x, y), 9 * s, (1.0, 0.97, 0.93), alpha, fill=True)       # planet hub
    L.ellipse((x, y), 15 * s, 4.5 * s, color=(1.0, 0.97, 0.93), alpha=alpha * 0.8, th=max(1, int(2 * s)), rot=-0.35)
    img = L.composite(img, 0.6)
    glow_dot(img, tip[0], tip[1], (1.0, 0.75, 0.5), 2.5 * s, 2.0 * alpha * (0.4 + 0.6 * u))
    return img
