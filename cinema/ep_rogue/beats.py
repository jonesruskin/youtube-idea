"""BEAT SHEET v2 — cinematic. Every line gets a shot with a real camera move: over the rogue's cloud tops, beside
Earth during the pass (true simulation geometry and lighting), from the ground under a real sky, along Earth's orbit
with one marker per simulation run. Text is rare and bold. Narration unchanged from v1."""
import numpy as np
from engine.beats import Beat as B, dimmed
from engine.core import W, H, clamp, smooth, span, lerp, glow_dot
from engine import hud
from engine.hud import Layer, text, fade, prog, WHITE, ACC, BLUE, RED, GREEN, DIM
from ep_blackhole.vis import shot, scope_scene, lightcurve
from ep_rogue.cine import (fly_scene, rogue_orbit, system3d, pass_scene, chase_scene, orbit_calendar, cal_xy, wall_scene,
                           infrared_scene, earth3d, ground_scene, bold, small, over_all, tag3)
from ep_rogue.vis import ICE, VIOLET, bars
from ep_rogue import model as M

R0, R16, R115, R10, R90 = ("d+0.00", "d-16.00", "d-11.50", "d+10.00", "d+90.00")
MOON_C = (0.92, 0.92, 0.96)


def cal_label(day, label, at, color=WHITE, lift=0.30, size=24, sub=None):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        if "cal3" not in ctx.state:
            return img
        x, y = cal_xy(ctx, day, lift)
        a = fade(t, tt)
        img = text(img, label, x, y, size, color, a, "c", kind="mono6", tracking=0.12)
        if sub:
            img = text(img, sub, x, y + 58, 18, DIM, a, "c", tracking=0.2)
        return img
    return f


def cal_span(d0, d1, label, at, color=WHITE, lift=0.30):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        if "cal3" not in ctx.state:
            return img
        L = Layer()
        img = hud.dimension(L, img, cal_xy(ctx, d0, lift), cal_xy(ctx, d1, lift), label, fade(t, tt), prog(t, tt), color, size=26)
        return L.composite(img, 0.5)
    return f


def dist_tag(label_fn, at, color=VIOLET):
    """Distance between Earth and the rogue in a pass shot, drawn between them."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        p = ctx.state.get("pts3", {})
        if "earth" not in p or "rogue" not in p:
            return img
        L = Layer()
        img = hud.dimension(L, img, p["earth"][:2], p["rogue"][:2], label_fn(ctx), fade(t, tt), prog(t, tt), color, size=24)
        return L.composite(img, 0.4)
    return f


def sun_tag(label, at, color=ACC):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        return text(img, label, W - 140, 130, 26, color, fade(t, tt), "rc", kind="mono6", tracking=0.14)
    return f


def counter_tag(fmt, key, at, x=140, y=130, color=WHITE, size=28):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        v = ctx.state.get(key)
        if v is None:
            return img
        return text(img, fmt(v), x, y, size, color, fade(t, tt), "lc", kind="mono6", tracking=0.14)
    return f


def sizes_note(ctx, img, t, u):
    return text(img, "PLANET SIZES ENLARGED · POSITIONS FROM THE SIMULATION", 140, H - 90, 16, DIM, fade(t, 0.2) * 0.8, "lc", tracking=0.25)


ALL = ("same", "changed", "scorched", "frozen", "ejected")

# ── open1 · the promise, from the first frame: over the rogue's dark cloud tops ─────────────
open1 = [
    B(0, fly_scene(alt=(4000.0, 4400.0), pitch=(-18.0, -15.0), scroll=(0.0, 3000.0)), bold("NO STAR", "star", y=H * 0.30, size=120, sub="A PLANET DRIFTING ALONE", sub_col=VIOLET), name="over the cloud tops of a planet with no star"),
    B(1, rogue_orbit(dist=(1.35, 2.6), az=(-35.0, -10.0), el=(10.0, 6.0), glow=0.8), small("5 × JUPITER'S MASS", "Five", color=VIOLET), name="pull back: the whole dark planet"),
    B(2, system3d(run=R0, t=(-120.0, -70.0), dist=(5.5, 3.6), az=(58.0, 40.0), el=(12.0, 18.0), focus_rogue=(0.35, 0.2), trail=60.0, rogue_scale=1.5),
      over_all(tag3("Rogue", "THE ROGUE", "heading", dx=-90, dy=-60, color=VIOLET), tag3("Earth", "EARTH", "crosses", dx=80, dy=-50, color=BLUE)), name="its path crosses Earth's orbit (3D)"),
]

open2 = [
    B(0, wall_scene(show=False, cam_x=(-0.4, 0.0), cam_z=(1.7, 1.2), cam_y=(0.55, 0.40)), bold("730", "seven", y=H * 0.28, size=170, sub="SIMULATIONS · ONE CHANGE: THE DAY IT ARRIVES"), name="730 Earths, one per arrival date"),
    B(1, ground_scene(view="night", fg="bay", rogue_bright=(0.3, 0.45), view_az=(-3.0, 3.0), moon_alt=(32.0, 33.0)), small("MOST DATES", "most", color=GREEN, y=H - 130), name="most dates: a bright new star, nothing more"),
    B(2, chase_scene(run=R0, t=(30.0, 500.0), look_back=(0.2, 1.0), back=(26000.0, 34000.0)), bold("THROWN OUT", "thrown", y=H * 0.22, size=110, color=RED), name="thrown out: chase Earth into the dark"),
    B(3, earth3d(view="moon", dist=(5.0, 4.2), az=(-10.0, 15.0), el=(6.0, 9.0), aim=(1.2, 0.3), sun_dir=(-1.0, 0.3, 0.4), moon=((1.0, 0.25, 0.4), 3.4, 0.27)),
      small("SOMETHING STRANGER", "stranger", color=ACC), name="and the Moon…"),
]

# ── c1a · rogue planets are real ───────────────────────────────────────────
c1a = [
    B(0, shot("galaxy", focus="rogues", zoom=(1.0, 1.35)), small("ROGUE PLANETS ARE REAL", "real", color=VIOLET), name="rogues across the galaxy"),
    B(1, rogue_orbit(dist=(6.0, 2.2), az=(80.0, 30.0), el=(20.0, 8.0), lit=0.6, glow=0.6, sun_az=150.0), small("FLUNG OUT OF THEIR SYSTEMS WHEN YOUNG", "fling", color=VIOLET), name="a giant flung into interstellar space"),
    B(2, scope_scene(zoom=2.4, flares=lambda ctx, t: [0.08, smooth(span(t, ctx.w("brighter") - 0.8, ctx.w("brighter") + 0.4)) * 0.95, 0.08, 0.08]),
      lambda ctx, img, t, u: lightcurve(Layer(), img, 1420, 760, 380, 90, [(0.6, 0.75 * prog(t, ctx.w("brighter") - 0.5, 1.0), 0.05)], 1.0, VIOLET, fade(t, ctx.w("bends")), "WEEKS", "BRIGHTNESS"),
      name="microlensing: the background star flares"),
    B(3, shot("galaxy", focus="rogues", zoom=(1.35, 1.6)), bold("MORE PLANETS THAN STARS?", "more", y=H - 190, size=72, sub="SUMI ET AL. 2023 · ESTIMATE"), name="maybe more rogues than stars"),
]

# ── c1b · ours, and a real one ───────────────────────────────────────────
c1b = [
    B(0, rogue_orbit(dist=(2.8, 2.4), az=(40.0, 55.0), el=(6.0, 8.0), lit=1.0, glow=0.5, sun_az=120.0), small("5 × JUPITER'S MASS · ABOUT JUPITER'S SIZE", "Ours", color=VIOLET), name="our rogue, lit"),
    B(1, infrared_scene(wipe=(-0.05, 0.62)), over_all(small("WHAT YOUR EYES WOULD SEE", 0.3, color=WHITE), small("INFRARED · ITS OWN HEAT", "glows", x=W - 520, color=ACC)), name="infrared reveals the glow"),
    B(2, infrared_scene(wipe=(0.62, -0.05), R=(400.0, 300.0)), bold("WISE 0855", "WISE", y=H - 170, size=90, sub="7.4 LIGHT-YEARS · 3–10 JUPITER MASSES"), name="WISE 0855, a real one"),
    B(3, rogue_orbit(dist=(1.8, 1.5), az=(-10.0, 5.0), el=(4.0, 6.0), glow=0.9), bold("~250 K", "cold", x=140, y=H * 0.30, size=110, anchor="lc", sub="AS COLD AS A FREEZER", sub_col=ICE), name="as cold as a freezer"),
    B(4, shot("galaxy", focus="rogues", zoom=(1.0, 1.25)), small("NASA'S ROMAN SPACE TELESCOPE · DESIGNED TO FIND HUNDREDS MORE", "Roman", color=WHITE), name="Roman will find hundreds"),
]

# ── c2a · the warning: a powers-of-ten pull-back ───────────────────────────────────────────
c2a = [
    B(0, ground_scene(view="observatory", fg="ridge", rogue_bright=(0.02, 0.04), rogue_alt=(40.0, 40.0), view_az=(0.0, 6.0), pitch=(24.0, 26.0), timelapse=(0.0, 6.0)),
      small("WE'D SEE IT COMING", 0.3, color=WHITE), name="a survey telescope's sky"),
    B(1, system3d(run=R0, t=(-60.0, -60.0), dist=(8.0, 220.0), az=(20.0, 70.0), el=(30.0, 55.0), outer=True, trail=60.0, enlarge=4000.0, rogue_scale=0.4, far_ring=True),
      over_all(small("PULLING BACK · 1,000 × THE EARTH–SUN DISTANCE", "thousand", color=VIOLET), tag3("Far", "SPOTTED HERE · 1,000 AU", "thousand", dx=-120, dy=-70, color=VIOLET)), name="pull back past the planets"),
    B(2, system3d(run=R0, t=(-60.0, -60.0), dist=(220.0, 2600.0), az=(70.0, 90.0), el=(55.0, 62.0), outer=True, trail=60.0, enlarge=4000.0, rogue_scale=0.4, far_ring=True),
      bold("237 YEARS", "two", y=H * 0.28, size=140, sub="OF WARNING · AT 20 KM/S", sub_col=VIOLET), name="237 years of warning"),
    B(3, system3d(run=R0, t=(-150.0, -40.0), dist=(4.5, 2.8), az=(-20.0, 10.0), el=(25.0, 14.0), trail=60.0, rogue_scale=2.0),
      over_all(tag3("Rogue", "PASSES THE SUN AT 1 AU", "passes", dx=-110, dy=-70, color=VIOLET), sizes_note), name="its path: crossing Earth's orbit"),
]

# ── c2d · what it would look like: from the ground ───────────────────────────────────────────
c2d = [
    B(0, ground_scene(view="night", fg="bay", rogue_bright=(0.04, 0.05), view_az=(-6.0, -2.0), timelapse=(0.0, 4.0)), small("WHAT WOULD IT LOOK LIKE?", 0.3, color=WHITE), name="the night sky over a bay"),
    B(1, ground_scene(view="night", fg="bay", rogue_bright=(0.05, 0.10), view_az=(-2.0, 2.0), timelapse=(4.0, 10.0)), small("T – 7.5 YEARS · A FAINT NEW STAR", "seven", color=VIOLET), name="7.5 years out"),
    B(2, ground_scene(view="night", fg="bay", rogue_bright=(0.10, 0.38), view_az=(2.0, 5.0), timelapse=(10.0, 14.0)), small("T – 8 MONTHS · BRIGHTER THAN JUPITER", "Eight", color=VIOLET), name="8 months: brighter than Jupiter"),
    B(3, ground_scene(view="night", fg="bay", rogue_bright=(0.38, 0.75), view_az=(5.0, 8.0), moon_alt=(30.0, 31.0), timelapse=(14.0, 17.0)), small("T – 5 MONTHS · BRIGHTER THAN VENUS", "Five", color=VIOLET), name="5 months: brighter than Venus"),
    B(4, ground_scene(view="binoc", fg="none", rogue_size=(0.9, 1.1), rogue_alt=(14.0, 14.0), rogue_az=(0.0, 0.0), pitch=(14.0, 14.0), fov=(3.5, 3.2), view_az=(0.0, 0.0)),
      small("THROUGH BINOCULARS · A BANDED DISC", "binoculars", color=WHITE), name="binoculars: a banded disc"),
    B(5, ground_scene(view="dusk", fg="bay", sun_alt=(-4.0, -6.0), rogue_size=(1.0, 14.0), rogue_alt=(14.0, 20.0), rogue_az=(6.0, 6.0), rogue_bright=(1.0, 1.0),
                      moon_alt=(26.0, 27.0), moon_az=-24.0, pitch=(16.0, 18.0), fov=(62.0, 66.0), rogue_light=(-0.9, 0.2, 0.3)),
      small("WORST DATES · FINAL TWO WEEKS · WIDER THAN THE FULL MOON", "worst", color=VIOLET), name="rising over the city, wider than the Moon"),
]

# ── c2b · the problem ───────────────────────────────────────────
c2b = [
    B(0, rogue_orbit(dist=(2.2, 1.7), az=(60.0, 70.0), el=(5.0, 3.0), lit=1.1, glow=0.4, sun_az=150.0, earth=(20.0, 2.0, 3.2)), small("THE PROBLEM", 0.3, color=RED), name="the problem"),
    B(1, rogue_orbit(dist=(1.7, 1.45), az=(70.0, 78.0), el=(3.0, 2.0), lit=1.1, glow=0.4, sun_az=150.0, earth=(20.0, 2.0, 3.2)),
      bold("1,589 × EARTH", "sixteen", y=H * 0.80, size=96, sub="WE CAN'T PUSH IT ASIDE", sub_col=RED), name="1,589 Earth masses"),
    B(2, earth3d(view="space", dist=(3.4, 3.0), az=(-40.0, -20.0), el=(8.0, 12.0)), bold("NOR EARTH", "move", y=H * 0.82, size=90, color=RED), name="we can't move Earth either"),
    B(3, orbit_calendar(dist=(3.4, 2.6), az=(-60.0, -20.0), el=(62.0, 48.0), aim=(0.0, 0.3), show=(), earth_day=(-120.0, 0.0), heights=0.3),
      bold("WHERE WILL EARTH BE?", "Where", y=H * 0.84, size=78, sub="ON THE DAY IT ARRIVES"), name="where will Earth be?"),
]

# ── c2c · the experiment ───────────────────────────────────────────
c2c = [
    B(0, chase_scene(run=R90, t=(1.0, 4.0), look_back=(0.0, 0.0), back=(36000.0, 30000.0), side=(0.6, 0.3)), bold("2.5 MILLION KM", "two", y=H * 0.80, size=88, sub="EVERY DAY · 30 KM/S"), name="Earth moves 2.5 million km a day"),
    B(1, orbit_calendar(dist=(2.6, 2.3), az=(-20.0, 20.0), el=(48.0, 42.0), aim=(0.3, 0.4), show=(), reveal=(0.0, 1.0), heights=0.3), small("EVERY ARRIVAL DATE · HALF-DAY STEPS", "every", color=WHITE), name="every date, half-day steps"),
    B(2, wall_scene(show=False, cam_x=(0.0, 0.3), cam_z=(1.3, 0.9), cam_y=(0.45, 0.32), look_x=(0.0, 0.2)), small("730 RUNS · THE SUN, THE ROGUE, 8 PLANETS AND THE MOON", "Seven", color=WHITE), name="730 full simulations"),
    B(3, wall_scene(show=True, cam_x=(0.3, 0.35), cam_z=(0.9, 0.75), cam_y=(0.32, 0.28), look_x=(0.2, 0.3)), small("THE CALENDAR", "calendar", color=ACC), name="each Earth wears its fate"),
]

# ── c3a · what the calendar says ───────────────────────────────────────────
c3a = [
    B(0, orbit_calendar(dist=(3.0, 2.7), az=(160.0, 140.0), el=(40.0, 36.0), aim=(0.0, 0.0), show=("same",)), bold("74%", "three", y=H * 0.80, size=120, sub="THE YEAR SHIFTS BY DAYS"), name="74% of dates: days"),
    B(1, orbit_calendar(dist=(2.7, 2.5), az=(140.0, 110.0), el=(36.0, 32.0), aim=(0.0, 0.1), show=("same", "changed")), bold("16%", "six", y=H * 0.80, size=120, sub="WEEKS, OR MONTHS"), name="16%: weeks or months"),
    B(2, orbit_calendar(dist=(2.5, 1.7), az=(110.0, 40.0), el=(32.0, 24.0), aim=(0.1, 0.7), show=ALL), bold("1 IN 10", "ten", y=H * 0.80, size=130, color=RED, sub="THE WORLD AS WE KNOW IT ENDS", sub_col=RED), name="1 in 10: the end"),
    B(3, orbit_calendar(dist=(1.7, 1.05), az=(40.0, 10.0), el=(24.0, 18.0), aim=(0.7, 1.0), show=ALL),
      over_all(cal_label(-16.0, "CLOSER", "three", color=ACC), cal_label(0.75, "THROWN OUT", "three", color=RED, lift=0.36), cal_label(13.0, "FARTHER", "three", color=ICE),
               small("A MATTER OF DAYS", "matter", color=WHITE)), name="three fates, days apart"),
]

# ── c4 · FATE 1: closer ───────────────────────────────────────────
c4a = [
    B(0, system3d(run=R16, t=(-30.0, 8.0), dist=(0.9, 0.35), az=(200.0, 220.0), el=(20.0, 12.0), follow=(0.6, 1.0), trail=40.0, enlarge=250.0, rogue_scale=1.0),
      over_all(tag3("Rogue", "CROSSES BEHIND US", "behind", dx=-100, dy=-60, color=VIOLET), sizes_note), name="the rogue crosses behind Earth"),
    B(1, system3d(run=R16, t=(10.0, 28.0), dist=(0.36, 0.30), az=(160.0, 185.0), el=(26.0, 20.0), follow=(0.5, 0.6), focus_rogue=(0.5, 0.4), trail=20.0, enlarge=120.0, rogue_scale=1.0), small("TUGGED BACKWARDS · EARTH SLOWS DOWN", "backwards", color=ACC), name="tugged backwards (Earth's view)"),
    B(2, system3d(run=R16, t=(26.0, 150.0), dist=(0.6, 2.4), az=(220.0, 250.0), el=(14.0, 34.0), follow=(1.0, 0.0), trail=120.0),
      tag3("Earth", "FALLS TOWARD THE SUN", "falls", dx=90, dy=-60, color=ACC), name="falling toward the Sun"),
]
c4b = [
    B(0, system3d(run=R16, t=(150.0, 300.0), dist=(2.4, 2.1), az=(250.0, 280.0), el=(34.0, 40.0), trail=282.0), tag3("Earth", "A NEW, TIGHTER ORBIT", "tighter", dx=90, dy=-60, color=ACC), name="a new tighter orbit"),
    B(1, system3d(run=R16, t=(300.0, 410.0), dist=(2.1, 1.9), az=(280.0, 300.0), el=(40.0, 44.0), trail=282.0), bold("282 DAYS", "eighty", y=H * 0.82, size=110, sub="ONE YEAR · TODAY 365"), name="a 282-day year"),
    B(2, system3d(run=R16, t=(410.0, 470.0), dist=(1.6, 1.1), az=(300.0, 320.0), el=(30.0, 18.0), follow=(0.0, 0.5), trail=282.0),
      over_all(tag3("Venus", "VENUS", "Venus", dx=-80, dy=-40, color=(1.0, 0.85, 0.55)), bold("2 × SUNLIGHT", "twice", y=H * 0.82, size=96, color=ACC)), name="almost at Venus's orbit, 2× sunlight"),
    B(3, ground_scene(view="desert", fg="ridge", sun_alt=(9.0, 6.0), sun_az=0.0, view_az=(-2.0, 2.0), pitch=(6.0, 6.0), fov=(40.0, 38.0), sun_disk=True, sun_size=1.41),
      bold("40% WIDER", "forty", y=H * 0.24, size=110, color=ACC, sub="THE SUN, FROM THE GROUND"), name="the Sun 40% wider over the ridge"),
]
c4c = [
    B(0, earth3d(view="hot", dist=(3.6, 3.0), az=(-30.0, -10.0), el=(8.0, 10.0), sun_dir=(-1.0, 0.2, 0.6), sun_size=(0.0, 0.0), scorch=(0.15, 0.35), aim=(-0.9, 0.0)),
      bars([("TODAY", 100, BLUE, "100%"), ("NEW ORBIT, AVERAGE", 143, ACC, "143%", "forty")], x0=1060, w=560, y0=400, vmax=150), name="+43% sunlight"),
    B(1, earth3d(view="hot", dist=(3.0, 2.6), az=(-10.0, 5.0), el=(10.0, 12.0), sun_dir=(-1.0, 0.2, 0.6), scorch=(0.35, 0.6), aim=(-0.9, 0.0)),
      bars([("TODAY", 100, BLUE, "100%"), ("NEW ORBIT, AVERAGE", 143, ACC, "143%"), ("RUNAWAY GREENHOUSE", 110, RED, "~110%", "runaway")], x0=1060, w=560, y0=400, vmax=150),
      name="runaway greenhouse ~110%"),
    B(2, earth3d(view="hot", dist=(2.6, 1.9), az=(5.0, 25.0), el=(12.0, 16.0), sun_dir=(-1.0, 0.2, 0.6), scorch=(0.6, 1.0), exposure=(1.0, 1.1)),
      bold("THE OCEANS BOIL OFF", "boil", y=H * 0.84, size=84, color=RED, sub="AS THEY MAY HAVE ON VENUS"), name="oceans boil away"),
]

# ── c5 · FATE 2: the Moon ───────────────────────────────────────────
c5a = [
    B(0, orbit_calendar(dist=(1.2, 1.0), az=(-10.0, -20.0), el=(18.0, 16.0), aim=(1.0, 1.0), show=ALL, moon_marks=True, hl=(-12.5, -9.0), hl_on=True),
      over_all(cal_label(-10.75, "4 DAYS LATER", "four", color=WHITE, lift=0.40), small("WHITE DOTS · THE MOON IS LOST", 0.3, color=MOON_C)), name="4 days later"),
    B(1, system3d(run=R115, t=(6.0, 20.0), dist=(0.20, 0.16), az=(140.0, 165.0), el=(28.0, 22.0), follow=(0.5, 0.5), focus_rogue=(0.5, 0.5), moon=True, trail=20.0, enlarge=80.0, rogue_scale=1.0, moon_x=10.0),
      over_all(tag3("Rogue", "10 MILLION KM AWAY · 27 × THE MOON'S DISTANCE", "ten", dx=-120, dy=170, color=VIOLET), sizes_note), name="10 million km away"),
    B(2, system3d(run=R115, t=(20.0, 45.0), dist=(0.17, 0.15), az=(165.0, 200.0), el=(50.0, 60.0), follow=(1.0, 1.0), moon=True, trail=25.0, enlarge=80.0, rogue_scale=1.0, moon_x=10.0),
      over_all(tag3("Moon", "THE MOON'S ORBIT, SHAKEN LOOSE", "shakes", dx=90, dy=-60, color=MOON_C), small("MOON'S DISTANCE × 10 SO YOU CAN SEE IT", 0.4, y=H - 90, size=16)), name="the Moon's orbit is loosened"),
]
c5b = [
    B(0, system3d(run=R115, t=(45.0, 110.0), dist=(2.3, 2.0), az=(20.0, 45.0), el=(36.0, 40.0), trail=90.0), tag3("Earth", "INSIDE VENUS'S ORBIT", "nearer", dx=90, dy=-60, color=ACC), name="inside Venus's orbit"),
    B(1, ground_scene(view="moonnights", fg="bay", moon_alt=(30.0, 30.0), moon_az=4.0, moon_size=(0.52, 0.21), view_az=(0.0, 2.0), pitch=(18.0, 20.0), fov=(32.0, 32.0)),
      small("THE MOON SWINGS OUT · AND BACK", "swings", color=MOON_C), name="the Moon shrinks and grows in the sky"),
    B(2, ground_scene(view="moonnights", fg="bay", moon_alt=(30.0, 33.0), moon_az=4.0, moon_size=(0.21, 0.04), view_az=(2.0, 3.0), pitch=(20.0, 22.0), fov=(32.0, 30.0)),
      bold("DAY 123", "hundred", y=H * 0.84, size=100, color=WHITE, sub="THE MOON DOESN'T COME BACK", sub_col=MOON_C), name="day 123: it doesn't come back"),
]
c5c = [
    B(0, system3d(run=R115, t=(175.0, 330.0), dist=(2.0, 1.8), az=(60.0, 80.0), el=(40.0, 42.0), trail=200.0, moon=True),
      tag3("Moon", "THE MOON · A PLANET NOW", "planet", dx=90, dy=-60, color=MOON_C), name="the Moon becomes a planet"),
    B(1, system3d(run=R115, t=(330.0, 460.0), dist=(1.8, 1.6), az=(80.0, 100.0), el=(42.0, 44.0), trail=200.0, moon=True),
      over_all(tag3("Moon", "ITS OWN ORBIT", "own", dx=-90, dy=-50, color=MOON_C), tag3("Earth", "EARTH", "ours", dx=80, dy=50, color=BLUE)), name="its own orbit, close to ours"),
    B(2, ground_scene(view="moonless", fg="bay", view_az=(-4.0, 4.0), pitch=(26.0, 28.0), timelapse=(0.0, 10.0)), bold("NO MOON", "months", y=H * 0.26, size=120, sub="NO MONTHS · NO LUNAR ECLIPSES"), name="moonless nights"),
    B(3, ground_scene(view="dawnsea", fg="ocean", sun_alt=(2.0, 5.0), sun_az=0.0, view_az=(0.0, 3.0), pitch=(8.0, 8.0), fov=(55.0, 52.0), sun_disk=True),
      bars([("THE MOON'S TIDES TODAY", 100, MOON_C, "100%"), ("THE SUN'S TIDES TODAY", 46, ACC, "46%", "Sun"), ("THE SUN'S, AT EARTH'S NEW CLOSEST", 193, ACC, "193%", "bigger")], y0=300, vmax=200),
      name="the Sun still raises tides"),
]
c5d = [
    B(0, rogue_orbit(dist=(1.9, 1.6), az=(100.0, 115.0), el=(4.0, 6.0), lit=1.1, glow=0.4, sun_az=170.0), small("WHO DID IT?", 0.3, color=WHITE), name="who did it?"),
    B(1, earth3d(view="sunpull", dist=(6.0, 5.0), az=(0.0, 10.0), el=(5.0, 5.0), aim=(1.5, 0.4), sun_dir=(0.35, 0.15, -1.0), sun_size=(0.35, 0.35), moon=((0.6, 0.25, -0.4), 12.0, 0.27)),
      bold("THE SUN", "Sun", y=H * 0.82, size=120, color=ACC, sub="NOT THE ROGUE"), name="it was the Sun"),
    B(2, system3d(run=R115, t=(8.0, 22.0), dist=(0.22, 0.18), az=(100.0, 125.0), el=(30.0, 26.0), follow=(0.5, 0.5), focus_rogue=(0.5, 0.5), moon=True, trail=20.0, enlarge=80.0, rogue_scale=1.0, moon_x=10.0),
      tag3("Rogue", "FROM 10 MILLION KM", "ten", dx=-100, dy=-60, color=VIOLET), name="loosened from 10 million km"),
    B(3, orbit_calendar(dist=(1.0, 0.9), az=(-20.0, -30.0), el=(16.0, 15.0), aim=(1.0, 1.0), show=ALL, moon_marks=True, hl=(-12.5, -9.0), hl_on=True),
      over_all(cal_label(-10.75, "A COIN TOSS", "coin", color=WHITE, lift=0.40), small("IT DEPENDS WHERE THE MOON HAPPENS TO BE", "depends", color=MOON_C, y=H - 130)), name="a coin toss"),
]

# ── c6 · FATE 3: farther ───────────────────────────────────────────
c6a = [
    B(0, system3d(run=R10, t=(-40.0, -10.0), dist=(0.9, 0.4), az=(330.0, 350.0), el=(20.0, 12.0), follow=(0.6, 1.0), trail=40.0, enlarge=250.0, rogue_scale=1.0),
      over_all(tag3("Rogue", "CROSSES IN FRONT OF US", "front", dx=-100, dy=-60, color=VIOLET), sizes_note), name="crosses in front"),
    B(1, chase_scene(run=R10, t=(6.0, 60.0), look_back=(0.0, 0.3), back=(30000.0, 26000.0), side=(0.4, 0.2)), small("PULLED FORWARDS · SPEEDS UP · SWINGS OUT", "forwards", color=ICE), name="pulled forwards, swinging out"),
]
c6b = [
    B(0, system3d(run=R10, t=(60.0, 520.0), dist=(3.0, 4.6), az=(0.0, 30.0), el=(30.0, 38.0), trail=500.0), bold("2 YEARS 8 MONTHS", "lasts", y=H * 0.84, size=88, color=ICE, sub="ONE YEAR"), name="a 2 yr 8 mo year"),
    B(1, system3d(run=R10, t=(520.0, 640.0), dist=(4.6, 4.4), az=(30.0, 45.0), el=(38.0, 40.0), trail=600.0),
      over_all(tag3("Earth", "ASTEROID BELT · 2.8 AU", "asteroid", dx=-110, dy=-60, color=ICE), tag3("Mars", "MARS", "Mars", dx=70, dy=-40, color=(1.0, 0.5, 0.35))), name="out past Mars"),
    B(2, ground_scene(view="frozen", fg="ridge", sun_alt=(12.0, 14.0), sun_az=0.0, view_az=(-2.0, 2.0), pitch=(10.0, 10.0), fov=(40.0, 40.0), sun_disk=True, sun_size=0.355),
      bold("1/8 THE LIGHT", "eighth", y=H * 0.24, size=110, color=ICE, sub="A SUN A THIRD AS WIDE"), name="a small cold Sun"),
]


def flux_chart(ctx, img, t, u):
    a, e = M.earth_orbit(M.DAY_FROZEN)
    E = np.linspace(0, 2 * np.pi, 400)
    Mm = E - e * np.sin(E)
    r = a * (1 - e * np.cos(E))
    tt = (Mm / (2 * np.pi)) * a ** 1.5 * 365.25
    x0, y0, w, h = 260, 300, 1400, 420
    img = hud.panel(img, x0 - 60, y0 - 70, x0 + w + 60, y0 + h + 90, fade(t, 0.1), 0.55)
    L = Layer()
    img = hud.chart(L, img, x0, y0, w, h, tt / tt[-1], 1 / r ** 2 / 1.1, prog(t, 0.2, 2.0), ICE, fade(t, 0.1), "ONE STRETCHED YEAR · 986 DAYS", "SUNLIGHT")
    for lev, lab, col in ((1.0, "TODAY", WHITE), (0.5, "HALF OF TODAY", RED)):
        y = y0 + h - h * lev / 1.1
        al = fade(t, ctx.w("half") if lev == 0.5 else 0.3)
        L.line((x0, y), (x0 + w, y), color=col, alpha=0.6 * al, th=1)
        img = text(img, lab, x0 + w + 10, y, 16, col, al, "lc")
    return L.composite(img, 0.5)


c6c = [
    B(0, earth3d(view="cold", dist=(3.6, 3.1), az=(20.0, 0.0), el=(8.0, 10.0), sun_dir=(-1.0, 0.2, 0.5), ice=(0.25, 0.45), exposure=(0.75, 0.7), aim=(-0.9, 0.0)),
      bars([("TODAY", 100, BLUE, "100%"), ("MARS TODAY", 43, (1.0, 0.5, 0.35), "43%", "Mars"), ("THIS EARTH, AVERAGE", 30, ICE, "30%", "less")], x0=1060, w=560, y0=400, vmax=100),
      name="less sunlight than Mars"),
    B(1, dimmed(earth3d(view="cold", dist=(3.1, 2.9), az=(0.0, -10.0), el=(10.0, 11.0), sun_dir=(-1.0, 0.2, 0.5), ice=(0.45, 0.55), exposure=(0.7, 0.7)), 0.3), flux_chart, name="under half for 808 days"),
    B(2, earth3d(view="cold", dist=(2.9, 2.0), az=(-10.0, -30.0), el=(11.0, 16.0), sun_dir=(-1.0, 0.2, 0.5), ice=(0.55, 1.0), exposure=(0.7, 0.62)),
      bold("THE OCEANS FREEZE", "freeze", y=H * 0.84, size=88, color=ICE), name="the oceans freeze over"),
    B(3, system3d(run=R10, t=(640.0, 1180.0), dist=(4.4, 4.0), az=(45.0, 80.0), el=(40.0, 34.0), trail=900.0), tag3("Earth", "6 MONTHS OF WEAK SUN", "six", dx=-110, dy=-60, color=ICE), name="six weak months, then out again"),
]

# ── c7 · FATE 4: thrown out ───────────────────────────────────────────
c7a = [
    B(0, orbit_calendar(dist=(1.0, 0.85), az=(10.0, 0.0), el=(18.0, 14.0), aim=(1.0, 1.0), show=ALL, hl=(-5.0, 6.5), hl_on=True), small("THE WINDOW IN THE MIDDLE", "window", color=RED), name="the window"),
    B(1, orbit_calendar(dist=(0.85, 0.75), az=(0.0, -6.0), el=(14.0, 12.0), aim=(1.0, 1.0), show=ALL, hl=(-5.0, 6.5), hl_on=True),
      cal_span(-5.0, 6.5, "11.5 DAYS", "Eleven", color=WHITE, lift=0.36), name="11.5 days"),
]
c7b = [
    B(0, pass_scene(run=R0, t=(-6.0, -4.4), cam_d=(40000.0, 30000.0), az=(150.0, 175.0), el=(8.0, 6.0), moon=True), dist_tag(lambda c: f"{c.state.get('dist_km', 0):,.0f} KM", "two", color=RED), name="211,000 km: closer than the Moon"),
    B(1, ground_scene(view="worstday", fg="bay", sun_alt=(-3.0, -3.0), rogue_size=(36.0, 39.0), rogue_alt=(24.0, 26.0), rogue_az=(4.0, 6.0), rogue_bright=(1.0, 1.0),
                      moon_alt=(48.0, 49.0), moon_az=-34.0, pitch=(26.0, 28.0), fov=(78.0, 80.0), rogue_light=(-0.85, 0.25, 0.35)),
      bold("40° WIDE", "forty", x=140, y=H * 0.18, size=96, anchor="lc", sub="75 FULL MOONS ACROSS", sub_col=VIOLET), name="40° across the sky"),
    B(2, pass_scene(run=R0, t=(-4.5, -4.3), cam_d=(30000.0, 26000.0), az=(175.0, 190.0), el=(6.0, 4.0), moon=False, shake=0.6),
      bold("780,000 ×", "tidal", y=H * 0.84, size=110, color=RED, sub="THE MOON'S TIDAL PULL"), name="780,000× the Moon's tides"),
]
c7c = [
    B(0, pass_scene(run=R0, t=(-4.4, -4.33), cam_d=(26000.0, 23000.0), az=(190.0, 205.0), el=(4.0, 6.0), moon=False, shake=0.8),
      bold("30,000 KM", "thirty", y=H * 0.84, size=100, color=RED, sub="FROM THE DISTANCE WHERE ITS TIDES WOULD TEAR A LIQUID PLANET APART"), name="30,000 km from tearing distance"),
    B(1, earth3d(view="stretch", dist=(3.2, 2.8), az=(-60.0, -40.0), el=(4.0, 6.0), sun_dir=(0.3, 0.2, 1.0), rogue=((1.0, 0.1, -0.4), 40.0, 11.6), stretch=(1.0, 1.08), aim=(1.0, 0.0)),
      small("PULLED TOWARD IT · OCEANS, ROCK AND AIR · ILLUSTRATIVE", "pulled", color=RED), name="tides stretch Earth (illustrative)"),
    B(2, chase_scene(run=R0, t=(-3.0, 20.0), look_back=(0.0, 0.0), back=(40000.0, 30000.0), side=(0.8, 0.3)), bold("SLINGSHOT", "slingshots", y=H * 0.82, size=120, color=RED), name="the slingshot"),
    B(3, system3d(run=R0, t=(-10.0, 60.0), dist=(1.2, 2.4), az=(150.0, 190.0), el=(26.0, 34.0), follow=(1.0, 0.4), trail=60.0), bold("~2 WEEKS", "whole", y=H * 0.84, size=96, sub="FIRST TUG TO FINAL FLING"), name="over in two weeks"),
]
c7d = [
    B(0, chase_scene(run=R0, t=(60.0, 300.0), look_back=(0.0, 0.6), back=(30000.0, 34000.0), side=(0.4, 0.2)), bold("40 KM/S", "forty", y=H * 0.84, size=110, color=RED, sub="TODAY: 30 KM/S AROUND THE SUN"), name="leaving at 40 km/s"),
    B(1, pass_scene(run=R0, t=(-4.3, 2.0), cam_d=(60000.0, 300000.0), az=(220.0, 250.0), el=(20.0, 40.0), look_rogue=(0.4, 0.0), moon=True), small("THE MOON · FLUNG AWAY ON ITS OWN PATH", "flung", color=MOON_C), name="the Moon flung away"),
    B(2, chase_scene(run=R0, t=(300.0, 730.0), look_back=(0.6, 1.0), back=(34000.0, 38000.0), side=(0.2, 0.15)),
      over_all(counter_tag(lambda v: f"{v:,.1f} AU FROM THE SUN", "sun_au", 0.3), bold("ALMOST TO URANUS", "Uranus", y=H * 0.84, size=84, sub="THE SUN · JUST A DAZZLING STAR")), name="two years later: the Sun a star"),
]
c7e = [
    B(0, shot("vent"), small("LIFE BELOW THE ICE · AROUND VOLCANIC VENTS", "vents", color=WHITE), name="life at the vents"),
    B(1, orbit_calendar(dist=(0.8, 0.75), az=(-10.0, 10.0), el=(13.0, 12.0), aim=(1.0, 1.0), show=ALL, moon_marks=True, hl=(-5.0, 6.5), hl_on=True),
      cal_label(-4.25, "EDGE OF THE WINDOW · MOON KEPT", "edge", color=WHITE, lift=0.42), name="the edge of the window"),
    B(2, earth3d(view="wander", dist=(5.0, 4.2), az=(40.0, 70.0), el=(8.0, 12.0), sun_dir=(0.2, 0.1, -1.0), exposure=(0.35, 0.3), moon=((1.0, 0.3, -0.5), 9.0, 0.27), aim=(1.5, 0.5)),
      bold("TWO TRAVELLERS", "travellers", y=H * 0.84, size=90, sub="NO SUN"), name="Earth and Moon leave together"),
    B(3, earth3d(view="night", dist=(2.4, 1.8), az=(70.0, 100.0), el=(12.0, 16.0), sun_dir=(0.0, 0.1, -1.0), exposure=(0.3, 0.3), lights=(1.6, 1.6)),
      small("THE SKY STAYS BLACK", "black", color=WHITE), name="the sky stays black"),
]

# ── c8 · should you worry? ───────────────────────────────────────────
c8a = [
    B(0, shot("galaxy", focus="none", zoom=(1.0, 1.1)), small("SHOULD YOU WORRY?", 0.3, color=WHITE), name="should you worry?"),
    B(1, shot("galaxy", focus="rogues", zoom=(1.1, 1.3)), bold("350,000 ×", "hundreds", y=H * 0.80, size=110, sub="THE AGE OF THE UNIVERSE · ROUGH ESTIMATE"), name="350,000× the age of the universe"),
    B(2, earth3d(view="today", dist=(3.6, 3.2), az=(-20.0, 0.0), el=(8.0, 10.0), sun_dir=(-1.0, 0.25, 0.4), moon=((1.0, 0.2, -0.3), 10.0, 0.27), aim=(1.2, 0.3)),
      small("4.5 BILLION YEARS · ALMOST CERTAINLY NEVER", "four", color=GREEN), name="never happened to us"),
]
c8b = [
    B(0, fly_scene(alt=(5000.0, 9000.0), pitch=(-14.0, -20.0), yaw=(10.0, 20.0), scroll=(0.0, 3000.0), glow=1.0), None, name="the rogue drifts on"),
    B(1, orbit_calendar(dist=(2.4, 1.6), az=(-40.0, -10.0), el=(40.0, 26.0), aim=(0.3, 0.8), show=ALL, earth_day=(-40.0, 0.0)), small("ONE SINGLE DAY", "single", color=BLUE), name="one single day"),
    B(2, ground_scene(view="night", fg="bay", rogue_bright=(0.05, 0.08), view_az=(-4.0, 0.0), timelapse=(0.0, 6.0)), small("KNOWN MORE THAN 200 YEARS AHEAD", "two", color=VIOLET), name="known 200 years ahead"),
    B(3, orbit_calendar(dist=(1.6, 0.8), az=(-10.0, 4.0), el=(26.0, 13.0), aim=(0.8, 1.0), show=ALL, hl=(-5.0, 6.5), hl_on=True),
      bold("11.5 DAYS", "Eleven", y=H * 0.80, size=130, sub="AN ORDINARY YEAR · OR THE DARK, FOREVER", sub_col=RED), name="11.5 days"),
]


def streak(ctx, img, t, u):
    L = Layer()
    k = smooth(span(t, 0.5, ctx.dur))
    x1, y1 = lerp(1750, 1180, k), lerp(110, 430, k)
    L.line((1750, 110), (x1, y1), color=(1.0, 0.75, 0.45), alpha=0.7 * fade(t, 0.4), th=3)
    img = L.composite(img, 0.9)
    glow_dot(img, x1, y1, (1.0, 0.85, 0.6), 3, 5 * fade(t, 0.4))
    return text(img, "NEXT · EVERY MINUTE AFTER THE ASTEROID", 140, H - 140, 24, ACC, fade(t, ctx.w("minute")), "lc", kind="mono6", tracking=0.14)


end3 = [
    B(0, earth3d(view="teaser", dist=(3.4, 3.0), az=(-30.0, -15.0), el=(10.0, 12.0), sun_dir=(-1.0, 0.3, 0.5), aim=(-0.6, 0.0)), streak, name="something does hit us"),
    B(1, earth3d(view="teaser", dist=(3.0, 2.6), az=(-15.0, 0.0), el=(12.0, 14.0), sun_dir=(-1.0, 0.3, 0.5), aim=(-0.6, 0.0)), streak, name="66 million years ago, minute by minute"),
]
outro = [B(0, rogue_orbit(dist=(2.6, 3.4), az=(10.0, 20.0), el=(4.0, 3.0), glow=0.8), None, name="end card")]

BEATS = dict(open1=open1, open2=open2, c1a=c1a, c1b=c1b, c2a=c2a, c2d=c2d, c2b=c2b, c2c=c2c, c3a=c3a, c4a=c4a, c4b=c4b,
             c4c=c4c, c5a=c5a, c5b=c5b, c5c=c5c, c5d=c5d, c6a=c6a, c6b=c6b, c6c=c6c, c7a=c7a, c7b=c7b, c7c=c7c, c7d=c7d,
             c7e=c7e, c8a=c8a, c8b=c8b, end3=end3, outro=outro)
