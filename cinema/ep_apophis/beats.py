"""BEAT SHEET — Episode 5. Founder rules: something new on screen every 3-5 s; every picture shows what is being said;
one hero (Apophis), one room (the space just outside Earth, seen from a rooftop and from the asteroid), one thing
always moving (the moving star / the swelling Earth on the Universal-Time clock). Shot / reverse shot.
B(line, scene, overlay, at=word, cut=...) — see engine/beats.py."""
import os
import numpy as np
from engine.beats import Beat as B
from engine.core import W, H, glow_dot
from engine.hud import Layer, text, fade, prog
from ep_apophis import model as M
from ep_apophis.scene_sky import roof, lane, bend, track, apophis_altaz, local_frame, GOLD, CYAN, INK
from ep_apophis.scene_rock import rock, surface, probe_scene
from ep_apophis.scene_diag import (dome, blink, odds_meter, radar, tide, orbit_map, road, over_all, label, tag, utc, pointer, orbit_label,
                                   balance, serpent, DIM, RED, timeline_scene, sea, neutrino, split, stopwatch, gauge, spin_arrows)

TC = M.closest()[0] - 69.2 / 3600
from ep_apophis.scene_sky import moon_world
MOON_HALF = tuple(float(x) for x in moon_world() * 0.5)          # closest approach, UTC hours


def AA(h, dalt=0.0, daz=0.0):
    a, e, _ = apophis_altaz(h)
    return (a + daz, e + dalt)


def betel_altaz(h):
    ra, de = np.radians(88.79), np.radians(7.407)
    d = np.array([np.cos(de) * np.cos(ra), np.cos(de) * np.sin(ra), np.sin(de)])
    e_, n_, u_ = local_frame(h)
    return float(np.degrees(np.arctan2(d @ e_, d @ n_)) % 360), float(np.degrees(np.arcsin(d @ u_)))


def R(h0, h1, view="town", daz=0.0, dalt=0.0, fov=(60.0, 58.0), az=None, alt=None, **kw):
    """Rooftop shot framed on where Apophis is at h0..h1 (offset by daz/dalt), unless az/alt are given."""
    if az is None:
        a0, e0 = AA(h0, dalt, daz)
        a1, e1 = AA(h1, dalt, daz)
        az, alt = (a0, a1), (e0, e1)
    return roof(view=view, az=az, alt=alt, fov=fov, h=(h0, h1), **kw)


AP = lambda s="Apophis", dx=70, dy=-60, at=0.3, ring=22: pointer("apophis_xy", s, dx, dy, at, GOLD, 30, ring)
lab = lambda s, at=0.3, y=H * 0.86, size=40, color=INK: label(s, at, y=y, size=size, color=color)


# ── small overlays only this episode needs ──
def speed_readout(at=0.0):
    def f(ctx, img, t, u):
        v = ctx.state.get("speed")
        a = fade(t, at, ctx.dur, 0.3)
        if v is None or a <= 0 or os.environ.get("QA_NOTEXT"):
            return img
        img = text(img, f"{v:.1f} km/s", 140, H - 150, size=64, color=INK, alpha=a, anchor="lc", kind="light", tracking=0.02)
        return text(img, "SPEED RELATIVE TO EARTH", 140, H - 96, size=18, color=GOLD, alpha=a * 0.9, anchor="lc", kind="mono6", tracking=0.25)
    return f


def bend_angle(at=0.3):
    """The 27 degree angle between the old heading and the new one, drawn where the two directions cross."""
    def f(ctx, img, t, u):
        bp = ctx.state.get("bend_pts")
        a = fade(t, at, ctx.dur, 0.3)
        if bp is None or a <= 0:
            return img
        (x0, y0), (x1, y1) = bp
        L = Layer()
        L.circle((x0, y0), 10, INK, a, fill=True)
        L.circle((x1, y1), 10, GOLD, a, fill=True)
        img = L.composite(img, 0.4)
        if not os.environ.get("QA_NOTEXT"):
            img = text(img, "bent 27°", W * 0.5, H * 0.14, size=56, color=GOLD, alpha=a, anchor="c", kind="light", tracking=0.02)
        return img
    return f


def moons_row(at=0.3):
    """37 full-Moon discs laid side by side across Earth's disc (the size comparison)."""
    def f(ctx, img, t, u):
        p, rp = ctx.state.get("earth_xy"), ctx.state.get("earth_px")
        a = fade(t, at, ctx.dur, 0.3)
        if p is None or rp is None or a <= 0:
            return img
        L = Layer()
        d = 2 * rp / 1.05 / 37.0
        k = int(37 * prog(t, at, 1.6))
        for i in range(k):
            L.circle((p[0] - rp / 1.05 + d * (i + 0.5), p[1]), d * 0.48, (0.92, 0.92, 0.88), a, fill=True)
        return L.composite(img, 0.3)
    return f


def scan_grid(at=0.2):
    """A mapping pass: a bright scan line sweeping over the rock, leaving a fine survey grid behind."""
    def f(ctx, img, t, u):
        p, r = ctx.state.get("rock_xy"), ctx.state.get("rock_px")
        a = fade(t, at, ctx.dur, 0.3)
        if p is None or r is None or a <= 0:
            return img
        L = Layer()
        s = prog(t, at, max(0.5, ctx.dur - at - 0.3))
        x0, x1 = p[0] - r * 1.25, p[0] + r * 1.25
        xs = x0 + (x1 - x0) * s
        L.line((xs, p[1] - r), (xs, p[1] + r), color=CYAN, alpha=a, th=3)
        for gx in np.arange(x0, xs, 26):
            L.line((gx, p[1] - r * 0.9), (gx, p[1] + r * 0.9), color=CYAN, alpha=a * 0.22, th=1)
        for gy in np.arange(p[1] - r * 0.9, p[1] + r * 0.9, 26):
            L.line((x0, gy), (xs, gy), color=CYAN, alpha=a * 0.22, th=1)
        return L.composite(img, 0.4)
    return f


def lapse(s="time-lapse", at=0.2):
    return tag(s, at, x=120, y=H - 120)


def mirror_split(at=0.0):
    return None


# ═══════════════════════════════ COLD OPEN: a star that moves ═══════════════════════════════
open1 = [
    B(0, R(19.72, 19.80, az=(234.0, 236.0), alt=(18.0, 18.0), fov=(70.0, 68.0), sat=(0.05, 0.40), sat_path=((205.0, 14.0), (268.0, 30.0)), figure=1.0, figure_az=212.0, apophis=0.0),
      name="dusk over the rooftops: a point of light glides; someone points"),
    B(1, R(19.80, 19.86, az=(236.0, 238.0), alt=(18.0, 18.0), fov=(68.0, 66.0), sat=(0.40, 0.62), sat_path=((205.0, 14.0), (268.0, 30.0)), figure=1.0, figure_az=212.0, apophis=0.0),
      name="steady, silent: it glides on"),
    B(1, R(19.86, 19.90, az=(249.0, 250.0), alt=(23.0, 23.0), fov=(34.0, 33.0), sat=(0.64, 0.76), sat_path=((205.0, 14.0), (268.0, 30.0)), plane=1.0, plane_at=(246.0, 19.0, 0.0), apophis=0.0), at="blink", cut=True,
      name="a plane blinks red and green; the satellite does not"),
    B(2, lane(dist=(14000.0, 13500.0), az=(-160.0, -150.0), el=(30.0, 32.0), fov=(60.0, 59.0), h=(19.9, 19.95), ring=0.0, gps=1.0, shells=1.0, path=0.0, glint=1.0), pointer("glint_xy", "", 0, 0, 0.3, ring=26),
      cut=True, name="satellites hundreds of km above Earth's night side"),
]
open2 = [
    B(0, R(19.45, 19.75, az=(118.0, 122.0), alt=(10.0, 13.0), fov=(58.0, 54.0), figure=1.0, figure_az=104.0), over_all(utc(19.45, 19.75), AP("", at=1.5)), cut=True,
      name="13 April 2029: a new moving star rises in the east"),
    B(0, track(lat=(30.0, 26.0), lon=(10.0, 6.0), dist=(30000.0, 29000.0), h=(19.75, 19.9), path=(0.0, 0.0), lisbon=0.0), at="rise", cut=True,
      name="over Europe and Africa"),
    B(1, R(19.95, 20.02, fov=(14.0, 12.0)), AP("", ring=26), cut=True, name="not one of ours: a point among the stars, ringed"),
    B(2, rock(dist=(2300.0, 2100.0), az=(70.0, 78.0), el=(8.0, 10.0), fov=(40.0, 40.0), eiffel_k=1.0, h=(20.0, 20.0), tumble_s=(0.0, 4000.0)),
      at="asteroid", cut=True, name="an asteroid, beside the Eiffel Tower to scale"),
    B(2, lane(dist=(150000.0, 125000.0), az=(-62.0, -52.0), el=(24.0, 20.0), fov=(42.0, 40.0), h=(20.4, 21.2), ring=1.0, path=1.0, trail_from=-10.0),
      AP("Apophis", dx=-80, dy=-60, at=0.2), at="closer", cut=True, name="its path threads inside the ring of satellites"),
    B(2, lane(dist=(125000.0, 110000.0), az=(-52.0, -46.0), el=(20.0, 18.0), fov=(40.0, 38.0), h=(21.2, 21.6), ring=1.0, path=1.0, trail_from=-10.0),
      AP("", at=0.0), at="weather", name="closer than the weather satellites"),
    B(3, lane(dist=(230000.0, 230000.0), az=(-40.0, -30.0), el=(16.0, 14.0), fov=(40.0, 40.0), h=(21.8, 23.5), ring=1.0, path=1.0, trail_from=-10.0), cut=True,
      name="it passes, and goes on: a miss"),
    B(4, rock(dist=(1100.0, 950.0), az=(14.0, 18.0), el=(6.0, 7.0), fov=(42.0, 40.0), earth=1.0, h=(21.6, 21.7), frame_earth=1.0, tumble_s=(9000.0, 12000.0)), cut=True,
      name="the rock, with Earth looming behind it"),
    B(5, surface(h=(21.7, 21.75), view_az=(-4.0, 0.0), pitch=(9.0, 10.0), fov=(72.0, 70.0), earth_az=(4.0, 4.0), earth_alt=(19.0, 19.0), sun_alt=(9.0, 9.0)),
      cut=True, name="from the asteroid: a giant Earth over the boulders"),
]

# ═══════════════════════════════ 2004: the scare ═══════════════════════════════
c1a = [
    B(0, dome(pan=(0.0, 50.0), zoom=(1.0, 1.06)), tag("Kitt Peak, Arizona", 0.6, sub="June 2004"), cut=True, name="a mountaintop observatory, 2004"),
    B(1, blink(zoom=(1.0, 1.04)), cut=True, name="two pictures of the same sky, flicking"),
    B(1, blink(zoom=(1.04, 1.1), ring=1.0), at="Every", name="every star stays put; one dot jumps"),
    B(2, blink(zoom=(1.1, 1.14), ring=0.0, glare_k=1.0), name="the Sun's glare floods in: lost"),
    B(2, track(lat=(-24.0, -28.0), lon=(140.0, 146.0), dist=(30000.0, 26000.0), h=(10.0, 10.2), path=(0.0, 0.0), lisbon=0.0),
      over_all(tag("Siding Spring, Australia", 0.3, sub="December 2004"), pointer("aus_xy", "", 0, 0, 0.2)), at="telescope", cut=True,
      name="a telescope in Australia finds it again"),
    B(3, odds_meter(size=(7.0, 3.6), off=(0.6, 0.4), elong=(3.0, 3.0), ghosts=1.0), tag("Where it could be in April 2029", 0.4), cut=True,
      name="the cloud of possible paths shrinks"),
    B(4, odds_meter(size=(3.6, 2.6), off=(0.4, 0.25), elong=(3.0, 3.0), odds=(0.0, 0.35), ghosts=1.0), at="Christmas",
      name="it shrinks, but Earth stays inside: the odds rise"),
]
c1b = [
    B(0, odds_meter(size=(2.6, 2.0), off=(0.25, 0.15), elong=(3.0, 3.0), odds=(0.35, 0.8)), lab("1 in 37", 0.4, size=64, color=RED),
      name="one in thirty-seven"),
    B(1, odds_meter(size=(2.0, 2.0), off=(0.15, 0.15), elong=(3.0, 3.0), odds=(0.8, 0.8), zoom=(1.0, 1.15)), lab("the highest risk ever rated", 0.3),
      name="the highest rating ever"),
    B(2, blink(zoom=(1.0, 1.06), ring=1.0, seed=83, aged=1.0), tag("Old pictures", 0.3, sub="March 2004"), cut=True, name="found in pictures from March"),
    B(3, odds_meter(size=(2.0, 0.55), off=(0.15, 2.6), elong=(3.0, 3.0), odds=(0.8, 0.0)), cut=True, name="the cloud shrinks off Earth: the hit is gone"),
    B(4, odds_meter(size=(0.55, 0.55), off=(2.6, 2.6), elong=(3.0, 3.0), keyhole=(0.0, 1.0), zoom=(1.0, 1.35)), pointer("keyhole_xy", "a keyhole, ~600 m", 60, -70, 1.2),
      name="but a keyhole beside Earth"),
    B(5, odds_meter(size=(0.55, 0.55), off=(2.6, 1.9), elong=(3.0, 3.0), keyhole=(1.0, 1.0), zoom=(1.35, 1.1), ret=(0.0, 1.0)), lab("thread it, and it returns in 2036", 0.4),
      name="threading it would bring it back in 2036"),
    B(6, rock(dist=(1900.0, 1800.0), az=(80.0, 84.0), el=(10.0, 10.0), fov=(44.0, 44.0), h=(21.0, 21.0), tumble_s=(20000.0, 26000.0), heat=1.0),
      lab("sunlight warms one side; the heat pushes back", 0.6), cut=True, name="sunlight warms one side"),
    B(6, odds_meter(size=(0.55, 0.55), off=(1.9, 1.9), elong=(3.0, 3.0), keyhole=(1.0, 1.0), drift=(0.0, 1.0)), lab("about 170 metres a year", 0.4), at="drifts",
      cut=True, name="the push drifts its orbit"),
    B(7, radar(rot=(80.0, 100.0), scan=(0.2, 1.0)), tag("Radar, 2021", 0.3), cut=True, name="radar pins it down"),
    B(7, odds_meter(size=(0.55, 0.06), off=(1.9, 3.2), elong=(3.0, 3.0), keyhole=(1.0, 0.0), zoom=(1.9, 1.7)), lab("no danger for 100+ years", 0.4, color=(0.6, 1.0, 0.7)),
      at="ruled", cut=True, name="ruled out"),
]

# ═══════════════════════════════ the rock ═══════════════════════════════
c2a = [
    B(0, rock(dist=(3200.0, 2600.0), az=(75.0, 82.0), el=(12.0, 12.0), fov=(36.0, 36.0), h=(20.0, 20.0), tumble_s=(30000.0, 33000.0)), cut=True,
      name="what is coming: the rock out of the dark"),
    B(1, radar(rot=(95.0, 120.0), scan=(0.2, 1.0), zoom=(1.0, 1.1)), tag("Radar echo", 0.3), cut=True, name="radar: two lobes"),
    B(1, rock(dist=(2300.0, 2200.0), az=(90.0, 92.0), el=(5.0, 5.0), fov=(40.0, 40.0), h=(20.0, 20.0), tumble_s=(0.0, 0.0), rate=0.0, eiffel_k=0.8), lab("about 450 metres end to end", 0.3),
      at="four", cut=True, name="two lobes and a narrow waist, end to end"),
    B(2, rock(dist=(620.0, 560.0), az=(55.0, 60.0), el=(25.0, 27.0), fov=(32.0, 30.0), h=(20.0, 20.0), tumble_s=(40000.0, 41000.0)), cut=True,
      name="grey rock, boulders and gravel, close"),
    B(2, surface(h=(20.6, 20.62), view_az=(-40.0, -34.0), pitch=(-6.0, -5.0), fov=(70.0, 68.0), earth_az=(90.0, 90.0), earth_alt=(9.0, 9.0), sun_alt=(14.0, 14.0)), at="Probably", cut=True,
      name="a loose rubble pile"),
    B(3, rock(dist=(2000.0, 2000.0), az=(80.0, 80.0), el=(10.0, 10.0), fov=(40.0, 40.0), h=(20.0, 20.0), tumble_s=(0.0, 100000.0), rate=1.0), lapse("time-lapse: about a day"),
      cut=True, name="it tumbles: a wobble about once a day"),
    B(3, rock(dist=(2000.0, 2000.0), az=(80.0, 80.0), el=(10.0, 10.0), fov=(40.0, 40.0), h=(20.0, 20.0), tumble_s=(100000.0, 950000.0), rate=1.0), lapse("faster: eleven days"),
      at="rolling", name="rolling end over end"),
    B(4, rock(dist=(1500.0, 1350.0), az=(110.0, 118.0), el=(16.0, 18.0), fov=(40.0, 40.0), h=(20.0, 20.0), tumble_s=(60000.0, 62000.0)), over_all(serpent(0.5), tag("Apep", 0.5, x=W * 0.68, y=H * 0.42, sub="Egyptian serpent of chaos")),
      cut=True, name="named for Apep, the serpent of chaos"),
]

# ═══════════════════════════════ the night, from the ground ═══════════════════════════════
c3a = [
    B(0, R(19.30, 19.40, az=(205.0, 210.0), alt=(10.0, 11.0), fov=(70.0, 68.0), figure=1.0, figure_az=190.0), utc(19.30, 19.40), cut=True,
      name="that night over Lisbon: dusk"),
    B(1, R(19.40, 19.95, az=(120.0, 126.0), alt=(10.0, 16.0), fov=(56.0, 54.0)), over_all(utc(19.40, 19.95), AP("Apophis", at=0.6), lapse()), cut=True,
      name="it climbs out of the east as the sky darkens"),
    B(2, R(20.62, 20.70, dalt=-12.0, daz=-6.0, fov=(52.0, 50.0), figure=1.0, figure_az=140.0), over_all(utc(20.62, 20.70), AP("brightest", dx=80, dy=-50, at=0.4)), cut=True,
      name="20:40: at its brightest"),
    B(2, R(20.70, 20.72, az=(40.0, 42.0), alt=(52.0, 53.0), fov=(70.0, 68.0), dipper=1.0, apophis=0.0), at="Big", cut=True, name="the stars of the Big Dipper, for comparison"),
    B(3, R(21.28, 21.32, az=(206.0, 208.0), alt=(36.0, 37.0), fov=(100.0, 98.0), figure=1.0, figure_az=196.0), over_all(utc(21.28, 21.32), AP("", at=0.3)), cut=True,
      name="21:20: high in the southern sky"),
    B(4, R(21.00, 21.06, fov=(22.0, 21.0)), over_all(utc(21.00, 21.06), AP("", ring=30, at=0.0)), cut=True, name="just a point of light sliding past the stars"),
    B(5, R(21.20, 21.37, az=(196.0, 196.0), alt=(57.0, 57.0), fov=(40.0, 40.0), fistk=1.0), over_all(utc(21.20, 21.37), AP("", at=0.0, ring=18), lapse("10 minutes, sped up")),
      cut=True, name="a fist at arm's length: crossed in ten minutes"),
]

# ═══════════════════════════════ the whole night: the map ═══════════════════════════════
c3b = [
    B(0, track(lat=(8.0, 14.0), lon=(25.0, -25.0), dist=(62000.0, 60000.0), h=(19.0, 22.5), path=(0.0, 1.0), lisbon=0.0), utc(19.0, 22.5), cut=True,
      name="the point below it crosses from the Indian Ocean over Africa toward the Americas"),
    B(1, track(lat=(6.0, 4.0), lon=(16.0, 13.0), dist=(26000.0, 24000.0), h=(20.35, 20.6), path=(0.4, 0.45), lisbon=0.0), pointer("sub_xy", "straight overhead", 70, -60, 0.4),
      cut=True, name="over Central Africa: straight overhead"),
    B(2, track(lat=(30.0, 28.0), lon=(15.0, 10.0), dist=(36000.0, 35000.0), h=(20.7, 20.8), path=(0.5, 0.5), lisbon=0.0, sight=1.0), cut=True,
      name="cities across Europe, Africa and western Asia can see it"),
    B(3, lane(dist=(90000.0, 80000.0), az=(108.0, 114.0), el=(24.0, 24.0), fov=(42.0, 42.0), h=(21.5, 21.8), ring=1.0, path=1.0, trail_from=-8.0, follow=0.0),
      over_all(utc(21.5, 21.8), AP("31,600 km up", dx=90, dy=-60, at=0.8)), cut=True, name="21:45: closest, over the Atlantic"),
    B(4, lane(dist=(80000.0, 72000.0), az=(114.0, 120.0), el=(24.0, 20.0), fov=(42.0, 42.0), h=(21.8, 22.0), ring=1.0, path=1.0, trail_from=-8.0),
      lab("lower than the geostationary satellites", 0.3), name="inside the geostationary ring"),
    B(4, lane(dist=(900000.0, 950000.0), az=(-30.0, -26.0), el=(40.0, 40.0), fov=(40.0, 40.0), h=(22.0, 22.2), ring=1.0, moon=1.0, path=1.0, trail_from=-30.0, look=MOON_HALF),
      lab("a tenth of the way to the Moon", 0.3), at="tenth", cut=True, name="the Moon, ten times farther"),
    B(5, lane(dist=(150000.0, 140000.0), az=(-95.0, -85.0), el=(2.0, 2.0), fov=(40.0, 40.0), h=(20.6, 21.4), ring=1.0, path=1.0, trail_from=-10.0), cut=True,
      name="seen edge-on: the ring is a line; the path passes well above it"),
    B(5, lane(dist=(140000.0, 130000.0), az=(-85.0, -80.0), el=(2.0, 2.0), fov=(40.0, 40.0), h=(21.4, 22.4), ring=1.0, path=1.0, trail_from=-10.0),
      lab("nearest satellite: more than 6,000 km away", 0.3), at="nearest", name="no satellite nearer than 6,000 km"),
    B(6, timeline_scene(prog_=(0.0, 1.0)),
      lab("this close: once every few thousand years", 0.4), cut=True, name="a rare visitor this close"),
]

c3c = [
    B(0, R(19.95, 20.0, view="country", az=(150.0, 154.0), alt=(13.0, 14.0), fov=(72.0, 70.0), figures=3, light_glow=0.15), AP("", at=0.5), cut=True,
      name="people on dark terraces, no telescopes"),
    B(1, R(20.90, 20.95, fov=(7.0, 7.0), binoc=1.0), AP("", at=0.0, ring=30), cut=True, name="through binoculars it creeps past the stars"),
    B(2, R(21.05, 21.07, daz=0.3, dalt=-0.3, fov=(10.0, 10.0), streak=1.0), lab("one minute's exposure", 0.4), cut=True,
      name="a one-minute exposure: a straight line"),
    B(3, track(lat=(36.0, 34.0), lon=(8.0, 2.0), dist=(40000.0, 39000.0), h=(20.9, 21.0), path=(0.55, 0.55), lisbon=0.0, sight=1.0), cut=True,
      name="everyone looking at the same rock"),
]

# ═══════════════════════════════ reverse shot: the asteroid's sky ═══════════════════════════════
c4a = [
    B(0, surface(h=(20.0, 20.1), view_az=(0.0, 4.0), pitch=(6.0, 7.0), fov=(68.0, 66.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0)), cut=True,
      name="the same night, from Apophis"),
    B(1, surface(h=(20.1, 20.15), view_az=(-30.0, -24.0), pitch=(-14.0, -12.0), fov=(62.0, 60.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0)), cut=True,
      name="dark gravel and boulders"),
    B(1, surface(h=(20.15, 20.2), view_az=(40.0, 46.0), pitch=(1.0, 1.0), fov=(88.0, 88.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0)), at="horizon",
      cut=True, name="the horizon curves away close by"),
    B(2, surface(h=(20.2, 20.3), view_az=(60.0, 60.0), pitch=(4.0, 6.0), fov=(76.0, 76.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(-2.0, 6.0), sun_side=1.0),
      lapse(), cut=True, name="the Sun rises at an odd angle"),
    B(3, surface(h=(20.3, 20.32), view_az=(-10.0, -8.0), pitch=(-4.0, -3.0), fov=(64.0, 64.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0), exposure=0.55),
      balance(0.3), cut=True, name="a person weighs the same as a paper clip"),
    B(4, surface(h=(20.32, 20.34), view_az=(4.0, 4.0), pitch=(-4.0, -4.0), fov=(60.0, 60.0), earth_az=(80.0, 80.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0), pebble=(0.0, 1.0)),
      over_all(lapse("156 seconds, sped up"), stopwatch(0.0)), cut=True, name="a pebble drops from shoulder height, slowly"),
    B(5, surface(h=(20.34, 20.36), view_az=(-14.0, -10.0), pitch=(8.0, 14.0), fov=(64.0, 64.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0), jump=(0.0, 0.5)),
      cut=True, name="a toss that never comes down"),
    B(5, surface(h=(20.36, 20.38), view_az=(-10.0, -6.0), pitch=(14.0, 22.0), fov=(64.0, 64.0), earth_az=(10.0, 10.0), earth_alt=(9.0, 9.0), sun_alt=(12.0, 12.0), jump=(0.5, 1.0)),
      lab("faster than 20 cm/s: gone for good", 0.3), at="Anything", name="it leaves Apophis"),
]
c4b = [
    B(0, surface(h=(19.0, 19.2), view_az=(4.0, 6.0), pitch=(5.0, 6.0), fov=(60.0, 58.0), earth_az=(4.0, 4.0), earth_alt=(-6.0, 6.0), sun_alt=(5.0, 5.0)), lapse(), cut=True,
      name="a planet rising over the close horizon"),
    B(1, surface(h=(19.2, 19.25), view_az=(4.0, 4.0), pitch=(8.0, 8.0), fov=(22.0, 20.0), earth_az=(4.0, 4.0), earth_alt=(0.0, 0.0), sun_alt=(-8.0, -8.0), light="earth"), cut=True,
      name="Earth's night side, sprinkled with city lights"),
    B(2, surface(h=(19.5, 21.2), view_az=(4.0, 6.0), pitch=(10.0, 14.0), fov=(56.0, 60.0), earth_az=(4.0, 4.0), earth_alt=(10.0, 20.0), sun_alt=(6.0, 10.0)), lapse(), cut=True,
      name="hour by hour it grows; the sunlit edge creeps around"),
    B(3, surface(h=(21.7, 21.75), view_az=(-4.0, 0.0), pitch=(14.0, 15.0), fov=(78.0, 76.0), earth_az=(4.0, 4.0), earth_alt=(22.0, 22.0), sun_alt=(10.0, 10.0)), cut=True,
      name="closest approach: Earth fills 19 degrees"),
    B(3, surface(h=(21.75, 21.77), view_az=(4.0, 4.0), pitch=(22.0, 22.0), fov=(34.0, 33.0), earth_az=(4.0, 4.0), earth_alt=(22.0, 22.0), sun_alt=(10.0, 10.0)), moons_row(0.2),
      at="thirty", cut=True, name="37 full Moons side by side"),
    B(4, surface(h=(21.77, 21.8), view_az=(4.0, 4.0), pitch=(22.0, 22.0), fov=(33.0, 26.0), earth_az=(4.0, 4.0), earth_alt=(22.0, 22.0), sun_alt=(10.0, 10.0)),
      name="half daylight, half night"),
    B(5, surface(h=(21.8, 21.82), view_az=(100.0, 104.0), pitch=(-3.0, -2.0), fov=(66.0, 64.0), earth_az=(4.0, 4.0), earth_alt=(22.0, 22.0), sun_alt=(-15.0, -15.0), light="earth"),
      cut=True, name="Earthlight: boulders casting sharp shadows"),
    B(5, surface(h=(21.82, 21.84), view_az=(70.0, 74.0), pitch=(-6.0, -5.0), fov=(56.0, 54.0), earth_az=(4.0, 4.0), earth_alt=(22.0, 22.0), sun_alt=(-15.0, -15.0), light="earth"),
      lab("Earthlight: about 1,000 full Moons", 0.3), at="enough", cut=True, name="shadows from every boulder"),
]

# ═══════════════════════════════ the pull: Earth is the truck ═══════════════════════════════
c5a = [
    B(0, road(truck=(-1.0, 0.0), wobble=(0.0, 0.0), cam=(0.0, 0.0)), cut=True, name="a bike on a road at dusk"),
    B(1, road(truck=(0.0, 1.5), wobble=(0.0, 1.0), dust=(0.0, 1.0), cam=(0.0, 0.0)), name="a truck passes too close; the bike wobbles"),
    B(2, bend(h=(21.0, 22.2), scale=(1.6, 1.5), tilt=(80.0, 80.0)), cut=True, name="Earth is the truck"),
]
c5b = [
    B(0, bend(h=(19.0, 21.75), scale=(2.2, 2.0), tilt=(86.0, 86.0), spin=(0.0, 0.0)), speed_readout(0.3), cut=True, name="gravity grabs it: faster"),
    B(0, bend(h=(21.75, 26.0), scale=(2.0, 2.4), tilt=(86.0, 86.0), spin=(0.0, 0.0), arrows=(0.0, 1.0)), over_all(speed_readout(0.0), bend_angle(0.8)), at="bending",
      name="its path bent by 27 degrees"),
    B(1, tide(arrows=(0.0, 1.0)), over_all(pointer("near_xy", "", 0, 0, 9), label("near end: pulled harder", 0.6, x=W * 0.5, y=H * 0.3, size=34), label("far end: pulled less", 1.0, x=W * 0.86, y=H * 0.72, size=34)),
      cut=True, name="the near end is pulled harder than the far end"),
    B(2, tide(arrows=(1.0, 1.0), diff=(0.0, 1.0), stretch=(0.0, 1.0)), lab("the difference: a stretch, the tide", 0.5), name="the difference is a stretch: the tide"),
]
c5c = [
    B(0, surface(h=(21.75, 21.77), view_az=(30.0, 34.0), pitch=(-6.0, -5.0), fov=(60.0, 58.0), earth_az=(40.0, 40.0), earth_alt=(24.0, 24.0), sun_alt=(14.0, 14.0), lift=1.0),
      over_all(lab("surface gravity changes by a few percent", 0.4), gauge(0.3)), cut=True, name="the tide on the surface"),
    B(1, surface(h=(21.77, 21.8), view_az=(-30.0, -26.0), pitch=(0.0, 1.0), fov=(60.0, 58.0), earth_az=(-10.0, -10.0), earth_alt=(24.0, 24.0), sun_alt=(14.0, 14.0), slide=(0.0, 0.6)),
      cut=True, name="grains start to slip on a steep slope"),
    B(1, rock(dist=(900.0, 820.0), az=(60.0, 66.0), el=(30.0, 32.0), fov=(40.0, 40.0), h=(21.75, 21.75), tumble_s=(80000.0, 80600.0), slide=(0.0, 1.0)), at="landslides", cut=True,
      name="a small landslide puffs dust"),
    B(2, rock(dist=(700.0, 560.0), az=(60.0, 72.0), el=(30.0, 36.0), fov=(34.0, 30.0), h=(21.75, 21.75), tumble_s=(80600.0, 81400.0), slide=(1.0, 1.0)), cut=True,
      name="fresh, brighter rock where it slid"),
    B(2, rock(dist=(1800.0, 1650.0), az=(10.0, 16.0), el=(8.0, 9.0), fov=(40.0, 40.0), h=(21.75, 21.75), frame_earth=1.0, tumble_s=(81000.0, 84000.0), slide=(1.0, 1.0), earth=1.0), at="Some",
      cut=True, name="a new face from a planet's pull"),
    B(3, rock(dist=(2400.0, 2400.0), az=(95.0, 95.0), el=(8.0, 8.0), fov=(44.0, 44.0), h=(21.75, 21.75), tumble_s=(0.0, 200000.0), twin=1.0), over_all(lapse("time-lapse"), spin_arrows(0.3)), cut=True,
      name="its tumble twisted"),
    B(3, rock(dist=(2400.0, 2400.0), az=(95.0, 95.0), el=(8.0, 8.0), fov=(44.0, 44.0), h=(21.75, 21.75), tumble_s=(200000.0, 400000.0), twin=1.0), lab("twice as fast, or half as fast", 0.3),
      at="twice", name="spinning faster, or slower"),
]

# ═══════════════════════════════ changed forever ═══════════════════════════════
c6a = [
    B(0, bend(h=(22.0, 30.0), scale=(1.8, 2.4), tilt=(40.0, 46.0), spin=(-40.0, -30.0), arrows=(1.0, 1.0)), cut=True, name="it leaves on a new heading"),
    B(1, orbit_map(before=(0.0, 1.0), after=(0.0, 0.0), day=(-300.0, -180.0), zoom=(1.0, 1.0), inside=1.0), orbit_label("before", "BEFORE: 323 days", 0.8, (0.85, 0.87, 0.9)),
      cut=True, name="before: a 323-day year, mostly inside Earth's orbit"),
    B(2, orbit_map(before=(1.0, 1.0), after=(0.0, 1.0), day=(-180.0, -100.0), zoom=(1.0, 1.0), inside=1.0),
      over_all(orbit_label("before", "BEFORE: 323 days", 0.0, (0.85, 0.87, 0.9)), orbit_label("after", "AFTER: 423 days", 0.6, GOLD)), name="after: a 423-day year, mostly outside"),
    B(3, orbit_map(before=(1.0, 0.0), after=(1.0, 0.3), day=(-100.0, -40.0), zoom=(1.0, 1.15), inside=0.0, morph=(0.0, 1.0)),
      over_all(orbit_label("before", "ATEN", 0.2, (0.85, 0.87, 0.9)), orbit_label("after", "APOLLO", 1.0, GOLD)), cut=True, name="a new family name: Aten to Apollo"),
    B(4, orbit_map(before=(0.0, 0.0), after=(0.3, 1.0), day=(-40.0, 80.0), zoom=(1.15, 0.95), inside=0.0, morph=(1.0, 1.0)), lab("one evening rewrote its calendar", 0.6),
      name="one evening, a new calendar"),
    B(5, track(lat=(30.0, 30.0), lon=(-25.0, -30.0), dist=(30000.0, 28000.0), h=(22.0, 22.1), path=(1.0, 1.0), lisbon=0.0), cut=True, name="Earth, untouched"),
    B(5, sea(atoms=(0.0, 1.0)), lab("its tide on Earth: a few atoms high", 0.6),
      at="tide", cut=True, name="Earth won't feel a thing"),
]
c6b = [
    B(0, probe_scene(h=(21.0, 21.1), dist=(60.0, 55.0), az=(200.0, 210.0), el=(10.0, 12.0)), cut=True, name="a probe alongside"),
    B(1, probe_scene(h=(21.1, 21.25), dist=(55.0, 48.0), az=(210.0, 226.0), el=(12.0, 16.0), fov=(48.0, 46.0), tumble_s=(3000.0, 6000.0)), tag("Ramses", 0.4, sub="ESA, arriving February 2029"), name="Ramses flies alongside"),
    B(2, rock(dist=(1400.0, 1300.0), az=(70.0, 74.0), el=(14.0, 15.0), fov=(40.0, 40.0), h=(20.0, 20.0), tumble_s=(90000.0, 91000.0)), scan_grid(0.3), cut=True,
      name="mapping every boulder before"),
    B(3, rock(dist=(700.0, 640.0), az=(80.0, 86.0), el=(20.0, 22.0), fov=(36.0, 36.0), h=(22.5, 22.5), tumble_s=(91000.0, 91500.0), slide=(0.0, 0.8), probe_k=1.0, thrust=1.0, probe_pos=(380.0, 330.0)),
      tag("OSIRIS-APEX", 0.4, sub="NASA, soon after"), cut=True, name="OSIRIS-APEX stirs the surface with its thrusters"),
    B(4, surface(h=(21.74, 21.76), view_az=(-6.0, -2.0), pitch=(12.0, 13.0), fov=(74.0, 72.0), earth_az=(-2.0, -2.0), earth_alt=(20.0, 20.0), sun_alt=(8.0, 8.0), slide=(0.5, 1.0)),
      cut=True, name="a planet reshaping an asteroid, as it happens"),
]

# ═══════════════════════════════ next: Betelgeuse ═══════════════════════════════
BA0, BE0 = betel_altaz(20.4)
next_ = [
    B(0, roof(view="west", az=(BA0 - 6, BA0 - 4), alt=(max(BE0 - 10, 10.0), max(BE0 - 10, 10.0)), fov=(60.0, 58.0), h=(20.4, 20.42), apophis=0.0, orion=1.0), cut=True,
      name="the western sky, Orion setting"),
    B(1, roof(view="west", az=(BA0 - 4, BA0 - 2), alt=(max(BE0 - 10, 10.0), max(BE0 - 10, 10.0)), fov=(58.0, 56.0), h=(20.42, 20.44), apophis=0.0, sn=(0.0, 1.0), orion=1.0),
      pointer("betel_xy", "Betelgeuse", 80, -60, 0.4), name="a star in Orion flares"),
    B(1, roof(view="west", az=(BA0 - 2, BA0 - 2), alt=(max(BE0 - 2, 10.0), max(BE0 - 2, 10.0)), fov=(50.0, 48.0), h=(19.2, 19.22), apophis=0.0, sn=(1.0, 1.0)), at="daylight", cut=True,
      name="bright enough to see in daylight"),
    B(2, roof(view="west", az=(BA0, BA0), alt=(BE0, BE0), fov=(26.0, 24.0), h=(20.5, 20.52), apophis=0.0, sn=(1.0, 1.0)), tag("Next time", 0.3, sub="The night Betelgeuse explodes"),
      cut=True, name="next time: Betelgeuse"),
    B(2, neutrino(flow=(0.0, 1.0)), at="warning", cut=True, name="the warning: neutrinos through the Earth before the light"),
]

# ═══════════════════════════════ the mirror ending ═══════════════════════════════
end1 = [
    B(0, lane(dist=(160000.0, 220000.0), az=(-30.0, -24.0), el=(14.0, 16.0), fov=(40.0, 42.0), h=(22.6, 26.0), ring=1.0, path=1.0, trail_from=-10.0, follow=0.0), cut=True,
      name="it heads back out into the dark"),
    B(1, R(22.45, 22.95, dalt=-8.0, fov=(56.0, 54.0), figure=1.0, figure_az=280.0), over_all(utc(22.45, 22.95), AP("", at=0.0)), cut=True,
      name="from the ground: the moving star fades"),
    B(2, surface(h=(30.0, 110.0), view_az=(2.0, 4.0), pitch=(10.0, 12.0), fov=(40.0, 36.0), earth_az=(4.0, 4.0), earth_alt=(14.0, 14.0), sun_alt=(8.0, 8.0)), cut=True,
      name="from the asteroid: Earth shrinks to a point"),
    B(3, split(h_ground=(22.6, 22.9), h_rock=(40.0, 70.0)), cut=True, name="two moving stars, side by side"),
    B(3, orbit_map(before=(0.0, 0.0), after=(1.0, 1.0), day=(30.0, 90.0), zoom=(1.0, 1.05), inside=0.0), at="Only", cut=True, name="only one is changed: its new orbit"),
]

outro = [
    B(0, surface(h=(60.0, 70.0), view_az=(-8.0, -6.0), pitch=(6.0, 7.0), fov=(70.0, 70.0), earth_az=(4.0, 4.0), earth_alt=(12.0, 12.0), sun_alt=(10.0, 10.0)), None,
      name="end card over the asteroid's sky: channel name and logo"),
    B(0, lane(dist=(260000.0, 300000.0), az=(-20.0, -16.0), el=(18.0, 18.0), fov=(40.0, 40.0), h=(26.0, 30.0), ring=1.0, path=1.0, trail_from=-12.0), at="subscribe", cut=True,
      name="Earth and the departing path under the end card"),
]

BEATS = dict(open1=open1, open2=open2, c1a=c1a, c1b=c1b, c2a=c2a, c3a=c3a, c3b=c3b, c3c=c3c, c4a=c4a, c4b=c4b, c5a=c5a, c5b=c5b, c5c=c5c,
             c6a=c6a, c6b=c6b, next=next_, end1=end1, outro=outro)


# ═══════════════════════ cadence: no picture held longer than ~4.6 s (founder rule 2) ═══════════════════════
class _Shift:
    """The overlay of a split beat keeps its own clock: piece k sees time measured from the original beat's start."""
    def __init__(self, ctx, off, total):
        self._c, self._off, self.dur = ctx, off, total

    def __getattr__(self, k):
        return getattr(self._c, k)

    def w(self, word, k=0, default=None):
        return self._c.w(word, k, default) + self._off

    def wend(self, word, k=0):
        return self._c.wend(word, k) + self._off


def _shifted(over, off, total):
    if over is None or off == 0:
        return over
    def f(ctx, img, t, u):
        return over(_Shift(ctx, off, total), img, t + off, (t + off) / max(total, 1e-3))
    return f


PUSH = {"fov": 0.9, "dist": 0.9, "zoom": 1.1, "scale": 0.92}


def _split_long(beats_by_seg, limit=4.6):
    import copy, json
    from engine import beats as BM
    from engine.render import load
    from engine.core import ROOT
    try:
        _, segs = load("ep_apophis")
        words = json.load(open(os.path.join(ROOT, "build", "ep_apophis", "voice", "words.json")))
    except Exception:
        return beats_by_seg
    out = {}
    for seg in segs:
        sid = seg["id"]
        if sid not in beats_by_seg:
            continue
        orig = beats_by_seg[sid]
        lay = BM.layout(dict(seg), [copy.copy(b) for b in orig], words.get(sid, []))
        al = dict(seg)
        al_words, _ = BM.align_words(seg["vlines"], words.get(sid, []))
        res = []
        for i, (b, lb) in enumerate(zip(orig, lay)):
            d = lb.t1 - lb.t0
            n = int(np.ceil(d / limit)) if d > limit + 0.3 else 1
            if n == 1 or not hasattr(b.scene, "_make"):
                res.append(b)
                continue
            nxt = orig[i + 1] if i + 1 < len(orig) else None
            cont_next = nxt is not None and not nxt.cut and getattr(nxt.scene, "_key", None) == getattr(b.scene, "_key", 0)
            # split times at the word starts nearest each 1/n of the beat
            cuts = []
            for k in range(1, n):
                tt = lb.t0 + d * k / n
                cand = [w for w in al_words if lb.t0 + 1.2 < w["t0"] < lb.t1 - 1.2]
                if not cand:
                    continue
                w = min(cand, key=lambda w: abs(w["t0"] - tt))
                occ = sum(1 for x in al_words if BM._norm(x["w"]).startswith(BM._norm(w["w"])) and x["t0"] < w["t0"] - 1e-6 and x["t0"] >= seg["vlines"][b.line]["start"] - 0.4)
                ln = max(j for j, l in enumerate(seg["vlines"]) if l["start"] <= w["t0"] + 0.01)
                cuts.append((w["t0"] - 0.15, w["w"], occ, ln))
            cuts = sorted(set(cuts))
            if not cuts:
                res.append(b)
                continue
            bounds = [lb.t0] + [c[0] for c in cuts] + [lb.t1]
            kw = b.scene._kw
            vec = b.scene._spec[1]
            for k in range(len(bounds) - 1):
                f0, f1 = (bounds[k] - lb.t0) / d, (bounds[k + 1] - lb.t0) / d
                nk = {}
                for key, v in kw.items():
                    if isinstance(v, tuple) and len(v) == 2 and all(isinstance(x, (int, float)) for x in v) and key not in vec:
                        a0, a1 = v
                        if key in PUSH and not cont_next and a0 == a1:
                            a1 = a1 * PUSH[key]                      # a held framing gets a slow push-in instead
                        nk[key] = (a0 + (a1 - a0) * f0, a0 + (a1 - a0) * f1)
                    else:
                        nk[key] = v
                sc = b.scene._make(**nk)
                if k == 0:
                    nb = B(b.line, sc, b.over, at=b.at, cut=b.cut, name=b.name)
                else:
                    c = cuts[k - 1]
                    nb = B(c[3], sc, _shifted(b.over, bounds[k] - lb.t0, d), at=(c[1].strip(".,:;?!"), c[2]), cut=False, name=b.name + f" (cont. {k})", covers=[])
                    nb.lead = 0.15
                res.append(nb)
        out[sid] = res
    return out


BEATS = _split_long(BEATS)
