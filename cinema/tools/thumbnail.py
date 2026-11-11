"""Thumbnail: Earth beneath a giant lensing black hole, 3-word hook. 1280x720 + 1920x1080."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import numpy as np, cv2
from engine.core import W, H, post, ROOT
from engine.space import space_frame
from engine.planet import render_planet
from engine import cards
img, _ = space_frame(3050, 1560, 1.25, angle=-8, lenses=[(W * 0.33, H * 0.36, 230)])
img *= 1.2
render_planet(img, 1500, 1380, 860, "earth", spin=1.95, tilt=0.5, light=(-0.8, 0.5, 0.3))
out = post(img, 0, exposure=1.7, bloom=0.7, grain=0.01).astype(np.float32) / 255
# hook text with heavy shadow for legibility at small sizes
def big(text, x, y, size, color, kind="semibold", tr=-0.01):
    a = cards.sprite(text, kind, size, tr)
    sh = cv2.GaussianBlur(np.pad(a, 30), (0, 0), 10)[30:-30, 30:-30]
    cards.put(out, sh, x + 4, y + 6, (0, 0, 0), 0.9, "lt")
    cards.put(out, a, x, y, color, 1.0, "lt")
big("30 YEARS", 1040, 120, 170, (1.0, 0.97, 0.93))
big("LEFT", 1040, 300, 170, (1.0, 0.6, 0.25))
o = (np.clip(out, 0, 1) * 255).astype(np.uint8)[..., ::-1]
d = os.path.join(ROOT, "build", "ep_blackhole")
cv2.imwrite(os.path.join(d, "thumbnail.png"), cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
cv2.imwrite(os.path.join(d, "thumbnail_1080.png"), o)
print("ok")
