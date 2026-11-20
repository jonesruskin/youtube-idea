"""Thumbnails, three different ideas, no text, no numbers:
A 'over-under'  - split at the waterline: above, the sky over the river full of shooting stars; below, the young
                  paddlefish, mouth open in a true-to-life slit, feeding among glowing glass beads
B 'the ringing' - the planet cut open: a seismic wavefront racing through the glowing mantle toward the river
C 'the burial'  - the river cut open: fish thrown on the bank, mud and glass filling the channel"""
import os
import numpy as np, cv2
from engine.core import post
from ep_tanis.cine import riverbank
from ep_tanis.world import fish_scene, earth_cut, cutaway


class _B:
    t0 = 0.0


class _Ctx:
    def __init__(self):
        self.state, self.dur = {}, 6.0
        self.seg, self.beat, self.run_t0, self.run_dur, self.prev, self.story_prev = dict(start=0.0, words=[]), _B(), 0.0, 6.0, None, None


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
    from engine.core import W, H
    top, kw = riverbank(phase="storm", view_az=(6.0, 6.0), pitch=(16.0, 16.0), fov=(74.0, 74.0), streak=(1.0, 1.0), heat=(0.25, 0.25),
                        glow=(0.0, 0.0), mist=(0.0, 0.0))(_Ctx(), 7.3, 0.5, 0)
    low, _ = fish_scene(hero=(0.55, 0.55), hero_y=(0.69, 0.69), size=(1250.0, 1250.0), beads=(0.45, 0.45), red=(0.3, 0.3), school=0, gape=1.0, glow_surface=(0.3, 0.3))(_Ctx(), 3.0, 0.5, 0)
    ys = np.arange(H)[:, None]
    wl = H * 0.46 + 10 * np.sin(np.arange(W)[None, :] * 0.01)
    a = np.clip((ys - wl) / 3.0, 0, 1)[..., None]
    top_s = cv2.resize(top[: int(H * 0.62)], (W, int(H * 0.46) + 20))       # the sky compressed into the upper half
    up = np.zeros_like(low)
    up[: top_s.shape[0]] = top_s
    img = up * (1 - a) + low * a + np.exp(-((ys - wl) / 2.5) ** 2)[..., None] * 0.6
    p = _save(img, kw, d, "thumbnail.png", "thumbnail_1080.png", exposure=1.45)
    img, kw = earth_cut(cx=(900.0, 900.0), cy=(5200.0, 5200.0), scale=(0.24, 0.24), tsec=(300.0, 300.0), show=("P",), quake_glow=1.0)(_Ctx(), 1.0, 0.5, 0)
    _save(img, kw, d, "thumbnail_B.png", exposure=1.3)
    img, kw = cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.35, 0.35), mud=(0.7, 0.7), rain=(0.9, 0.9), red=(0.3, 0.3))(_Ctx(), 2.0, 0.5, 0)
    _save(img, kw, d, "thumbnail_C.png", exposure=1.3)
    return p
