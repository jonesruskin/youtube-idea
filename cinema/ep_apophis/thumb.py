"""Thumbnails, three different ideas, no text, no numbers:
A 'rear-view mirror' - a round rear-view mirror on a stalk, planted in the asteroid's grey gravel; in its glass, the
                       night side of Earth (city lights, a thin sunlit edge) looming up from behind like a truck.
                       The role reversal in an everyday object.
B 'the giant'        - standing on Apophis at closest approach: Earth, half day and half night, 37 Moons wide, over
                       boulders and a close curved horizon
C 'the long exposure'- Lisbon's rooftops at night; Apophis drawn as one straight bright line across the stars, and
                       people on the terraces pointing up"""
import os
import numpy as np, cv2
from engine.core import post, W, H, grid, clamp, glow_dot
from ep_apophis.scene_rock import surface
from ep_apophis.scene_sky import roof, apophis_altaz


class _B:
    t0 = 0.0
    t1 = 6.0


class _Ctx:
    def __init__(self):
        self.state, self.dur = {}, 6.0
        self.seg, self.beat, self.run_t0, self.run_dur, self.prev, self.story_prev = dict(start=0.0, words=[]), _B(), 0.0, 6.0, None, None

    def w(self, *a, **k):
        return 0.0


def _graded(img, kw, exposure=None):
    k = dict(bloom=kw.get("bloom", 0.5), exposure=exposure or kw.get("exposure", 1.0) * 1.15, grain=0.006, grade=kw.get("grade"))
    o = post(img, 0, **k).astype(np.float32) / 255
    g = o.mean(-1, keepdims=True)
    return np.clip((g + (o - g) * 1.3 - 0.5) * 1.12 + 0.5, 0, 1)


def _save(o, d, name, big=None):
    o8 = (o[..., ::-1] * 255).astype(np.uint8)
    cv2.imwrite(os.path.join(d, name), cv2.resize(o8, (1280, 720), interpolation=cv2.INTER_AREA))
    if big:
        cv2.imwrite(os.path.join(d, big), o8)
    return os.path.join(d, name)


def make(d):
    # A: the mirror
    bg, kw = surface(h=(21.6, 21.6), view_az=(60.0, 60.0), pitch=(2.0, 2.0), fov=(62.0, 62.0), earth_az=(4.0, 4.0), earth_alt=(14.0, 14.0),
                     sun_alt=(14.0, 14.0), sun_side=-1.0)(_Ctx(), 3.0, 0.5, 0)
    ref, kw2 = surface(h=(22.1, 22.1), view_az=(2.0, 2.0), pitch=(14.0, 14.0), fov=(26.0, 26.0), earth_az=(2.0, 2.0), earth_alt=(14.0, 14.0),
                       sun_alt=(8.0, 8.0))(_Ctx(), 3.0, 0.5, 0)
    A = _graded(bg, kw, 1.25)
    R = _graded(ref, kw2, 2.0)[:, ::-1]                       # a mirror shows it the other way round
    cx, cy, rx, ry = W * 0.56, H * 0.42, 430, 330
    xs, ys = grid()
    dx, dy = (xs - cx) / rx, (ys - cy) / ry
    rr = np.sqrt(dx * dx + dy * dy)
    # convex mirror: compress toward the edge
    k = 1 + 0.35 * rr ** 2
    mx = (W / 2 + dx * rx * 1.05 / k).astype(np.float32)
    my = (H / 2 + dy * ry * 1.05 / k).astype(np.float32)
    Rw = cv2.remap(R.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    glass = clamp((1 - rr) * 120)[..., None]
    rim = clamp((1.07 - rr) * 120)[..., None] * (1 - glass)
    sheen = np.exp(-((dx + dy * 0.6 + 0.55) / 0.18) ** 2) * 0.12 * glass[..., 0]
    stalk = ((np.abs(xs - (cx + rx * 0.15)) < 14) & (ys > cy + ry * 0.98)).astype(np.float32)[..., None]
    A = A * (1 - stalk) + stalk * (0.22 + 0.18 * np.clip((xs - (cx + rx * 0.15)) / 14, -1, 1))[..., None] * np.array([1.0, 1.0, 1.05], np.float32)
    rimc = (0.35 + 0.45 * np.clip(-dy, 0, 1))[..., None] * np.array([0.9, 0.92, 0.98], np.float32)
    A = A * (1 - glass - rim) + Rw * glass + rimc * rim + sheen[..., None]
    p = _save(np.clip(A, 0, 1), d, "thumbnail.png", "thumbnail_1080.png")
    # B: the giant Earth over the boulders
    img, kw = surface(h=(21.75, 21.75), view_az=(-4.0, -4.0), pitch=(6.0, 6.0), fov=(48.0, 48.0), earth_az=(2.0, 2.0), earth_alt=(2.0, 2.0),
                      sun_alt=(16.0, 16.0), sun_side=-1.0)(_Ctx(), 3.0, 0.5, 0)
    _save(_graded(img, kw, 1.3), d, "thumbnail_B.png")
    # C: the long exposure over Lisbon
    a0, e0, _ = apophis_altaz(21.05)
    img, kw = roof(az=(138.0, 138.0), alt=(18.0, 18.0), fov=(92.0, 92.0), h=(20.3, 20.3), streak=14.0, figures=3, light_glow=1.2)(_Ctx(), 3.0, 0.5, 0)
    _save(_graded(img, kw, 1.7), d, "thumbnail_C.png")
    return p
