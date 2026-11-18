"""Thumbnails, three different ideas, no text, no numbers:
A 'the window'  - from under the river: the sky squeezed into Snell's window, full of shooting stars, a paddlefish
                  crossing it with its mouth open, glass beads sinking past
B 'the storm'   - from the riverbank: the whole sky full of shooting stars over the dark forest, mirrored in the river
C 'the amber'   - beads of impact glass sealed in a drop of amber, lit from behind"""
import os
import numpy as np, cv2
from engine.core import post
from ep_tanis.cine import river_under, riverbank, amber_scene


class _Ctx:
    def __init__(self):
        self.state, self.dur = {}, 6.0


def _save(img, kw, d, name, big=None, exposure=None):
    k = dict(bloom=kw.get("bloom", 0.5), exposure=exposure or kw.get("exposure", 1.0) * 1.15, grain=0.006)
    o = post(img, 0, **k)[..., ::-1]
    # a little extra contrast and saturation for the small size
    f = o.astype(np.float32) / 255
    g = f.mean(-1, keepdims=True)
    f = np.clip((g + (f - g) * 1.25 - 0.5) * 1.12 + 0.5, 0, 1)
    o = (f * 255).astype(np.uint8)
    cv2.imwrite(os.path.join(d, name), cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
    if big:
        cv2.imwrite(os.path.join(d, big), o)
    return os.path.join(d, name)


def make(d):
    sc = river_under(beads=(1.0, 1.0), streak=(1.0, 1.0), heat=(0.45, 0.45), look=(50.0, 50.0), yaw=(184.0, 184.0), gape=1.0)
    img, kw = sc(_Ctx(), 11.0, 0.5, 0)
    p = _save(img, kw, d, "thumbnail.png", "thumbnail_1080.png", exposure=1.55)
    sc = riverbank(phase="storm", view_az=(6.0, 6.0), pitch=(9.0, 9.0), fov=(70.0, 70.0), streak=(1.0, 1.0), heat=(0.55, 0.55), glow=(0.3, 0.3), mist=(0.0, 0.0))
    img, kw = sc(_Ctx(), 7.3, 0.5, 0)
    _save(img, kw, d, "thumbnail_B.png", exposure=1.45)
    sc = amber_scene(light=(0.1, 0.1), zoom=(1.45, 1.45), focus=(0.6, 0.6))
    img, kw = sc(_Ctx(), 3.0, 0.5, 0)
    _save(img, kw, d, "thumbnail_C.png", exposure=1.35)
    return p
