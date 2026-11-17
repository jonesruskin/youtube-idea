"""Thumbnails (no headline template): A 'the date' — a wall calendar with one date circled, the rogue rising outside the
window; B 'four fates' — the same Earth four ways; C 'the rise' — no words, the planet over a city."""
import os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from engine.core import W, H, post, glow_dot, fbm, clamp
from engine.planet import render_planet
from engine import cards


def _save(o, d, name, big=None):
    o = (np.clip(o, 0, 1) * 255).astype(np.uint8)[..., ::-1]
    cv2.imwrite(os.path.join(d, name), cv2.resize(o, (1280, 720), interpolation=cv2.INTER_AREA))
    if big:
        cv2.imwrite(os.path.join(d, big), o)
    return os.path.join(d, name)


def _calendar_page(w=900, h=1100, circled=9):
    im = Image.new("RGB", (w, h), (238, 234, 226))
    dr = ImageDraw.Draw(im)
    f_big = ImageFont.truetype(cards.INTER + "Inter-Bold.otf", 110)
    f_num = ImageFont.truetype(cards.INTER + "Inter-Medium.otf", 64)
    f_day = ImageFont.truetype(cards.INTER + "Inter-SemiBold.otf", 34)
    dr.rectangle([0, 0, w, 210], fill=(30, 34, 44))
    dr.text((60, 50), "MARCH", font=f_big, fill=(238, 234, 226))
    for k, dname in enumerate("MTWTFSS"):
        dr.text((60 + k * 118, 240), dname, font=f_day, fill=(120, 120, 128))
    start = 3
    for n in range(1, 32):
        i = n - 1 + start
        x, y = 50 + (i % 7) * 118, 300 + (i // 7) * 150
        dr.text((x, y), str(n), font=f_num, fill=(40, 40, 46))
        if n == circled:
            pts = []
            for a in np.linspace(0, 2 * np.pi * 1.08, 90):
                r = 72 + 6 * np.sin(a * 3.0)
                pts.append((x + 38 + r * np.cos(a) * 1.15, y + 38 + r * np.sin(a)))
            dr.line(pts, fill=(200, 30, 30), width=12, joint="curve")
    for k in range(7):
        dr.line([(40 + k * 118, 290), (40 + k * 118, h - 40)], fill=(210, 206, 198), width=2)
    arr = np.asarray(im).astype(np.float32) / 255.0
    paper = fbm(w, h, scale=40, octaves=4, seed=9)[..., None]
    return np.power(arr, 2.2) * (0.92 + 0.08 * paper)


def thumb_date(d):
    from ep_rogue.ground import ground_view
    sky, pos, f = ground_view(2.0, sun_alt=-4.0, sun_az=-60.0, view_az=4.0, pitch=24.0, fov=70.0, fg="bay",
                              rogue=dict(alt=24.0, az=10.0, size_deg=34.0, light=(-0.85, 0.25, 0.35), lit=1.1, glow=0.7))
    img = sky.copy()
    # the room: dark wall around a window, with mullions; cool light from the planet spills in
    xs, ys = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    win = (xs > 640) & (xs < 1860) & (ys > 40) & (ys < 900)
    wall = np.array([0.010, 0.010, 0.014], np.float32) + np.array([0.05, 0.045, 0.06], np.float32) * np.exp(-((xs - 1250) ** 2 + (ys - 450) ** 2) / (2 * 700 ** 2))[..., None]
    img = np.where(win[..., None], img, wall)
    mull = ((np.abs(xs - 1250) < 9) | (np.abs(ys - 470) < 9)) & win
    frame = win & ~((xs > 660) & (xs < 1840) & (ys > 60) & (ys < 880))
    img = np.where((mull | frame)[..., None], np.array([0.006, 0.006, 0.008], np.float32), img)
    sill = (xs > 610) & (xs < 1890) & (ys > 900) & (ys < 935)
    img = np.where(sill[..., None], np.array([0.03, 0.028, 0.035], np.float32), img)
    # the calendar, pinned on the wall left of the window, lit by the window light
    pg = _calendar_page()
    ph, pw = pg.shape[:2]
    src = np.float32([[0, 0], [pw, 0], [pw, ph], [0, ph]])
    dst = np.float32([[70, 250], [560, 230], [575, 840], [90, 880]])
    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(pg, M, (W, H))
    mask = cv2.warpPerspective(np.ones((ph, pw), np.float32), M, (W, H))[..., None]
    light = (0.22 + 0.55 * np.clip((xs - 60) / 520, 0, 1))[..., None] * np.array([0.85, 0.85, 1.0], np.float32)
    shadow = cv2.GaussianBlur(mask[..., 0], (0, 0), 14)[..., None]
    img = img * (1 - 0.6 * np.roll(np.roll(shadow, 12, 0), 10, 1)) * (1 - mask) + warped * light * mask
    glow_dot(img, 320, 245, (0.6, 0.6, 0.65), 4, 0.6)        # the pin
    out = post(img, 0, exposure=1.7, bloom=0.6, grain=0.01).astype(np.float32) / 255
    return out


def thumb_fates(d):
    from engine.cam3d import Camera
    cam = Camera((0, 0, 10.0), (0, 0, 0), fov=50)
    img = cam.sky(gain=0.6)
    kinds = [("scorched", dict(scorch=0.95), (-0.6, 0.3, 0.75)), ("normal", dict(), (-0.6, 0.3, 0.75)),
             ("frozen", dict(ice=1.0, exposure=0.8), (-0.6, 0.3, 0.75)), ("ejected", dict(exposure=0.10, lights_fade=1.8), (0.3, 0.1, -1.0))]
    xsl = [W * 0.14, W * 0.38, W * 0.62, W * 0.86]
    for (name, kw, L), x in zip(kinds, xsl):
        R = 205
        if name == "scorched":
            glow_dot(img, x - 160, 300, (1.0, 0.7, 0.4), 260, 0.18)
        render_planet(img, x, H * 0.52, R, "earth", spin=1.3, tilt=0.42, light=L, night=1.0, **kw)
    out = post(img, 0, exposure=1.6, bloom=0.65, grain=0.008).astype(np.float32) / 255
    return out


def thumb_rise(d):
    from ep_rogue.ground import ground_view
    img, pos, f = ground_view(2.0, sun_alt=-3.0, sun_az=-60.0, view_az=4.0, pitch=26.0, fov=74.0, fg="bay",
                              rogue=dict(alt=26.0, az=8.0, size_deg=38.0, light=(-0.85, 0.25, 0.35), lit=1.1, glow=0.7),
                              moon=dict(alt=50.0, az=-30.0, size_deg=0.52))
    return post(img, 0, exposure=1.6, bloom=0.65, grain=0.008).astype(np.float32) / 255


def make(d):
    p = _save(thumb_date(d), d, "thumbnail.png", "thumbnail_1080.png")
    _save(thumb_fates(d), d, "thumbnail_B.png")
    _save(thumb_rise(d), d, "thumbnail_C.png")
    return p
