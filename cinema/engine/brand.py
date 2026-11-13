"""Channel identity. Change CHANNEL here and re-render the 'title' and 'outro' segments of each episode to rebrand."""
import numpy as np
from .core import W, H, glow_dot

CHANNEL = "ORBITFALL"
TAGLINE = "WHAT IF, SIMULATED"


def logo(img, x, y, s=1.0, alpha=1.0, t=0.0):
    """Mark: a tilted orbit ring with a bright body falling through it."""
    if alpha <= 0:
        return img
    from .hud import Layer
    L = Layer()
    L.ellipse((x, y), 46 * s, 16 * s, color=(1.0, 0.62, 0.32), alpha=alpha, th=max(2, int(3 * s)), rot=-0.35)
    L.circle((x, y), 15 * s, (1.0, 0.97, 0.93), alpha, th=max(2, int(2 * s)))
    img = L.composite(img, 0.6)
    ph = (t * 0.35) % 1.0
    bx, by = x + (38 - 76 * ph) * s * 0.6, y - 30 * s + 60 * s * ph
    glow_dot(img, bx, by, (1.0, 0.9, 0.75), 3.0 * s, 3.0 * alpha)
    return img
