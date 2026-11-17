"""BEAT SHEET — every narration line gets a picture that explains it.
BEATS[segment_id] = [Beat(line, scene, overlay, at=word), ...]. Orbit maps read the N-body runs (ep_rogue/model.py)."""
import numpy as np
import cv2
from engine.beats import Beat as B, dimmed
from engine.core import W, H, clamp, smooth, smoother, span, lerp, glow_dot
from engine import hud, cards
from engine.hud import Layer, text, fade, prog, typed, counter, WHITE, ACC, BLUE, RED, GREEN, DIM
from ep_blackhole.vis import shot, scope_scene, lightcurve, STARS_SCOPE
from ep_rogue.vis import *  # noqa
from ep_rogue import model as M

R0, R16, R115, R10, R90, R425 = (run_id(d) for d in (0.0, -16.0, -11.5, 10.0, 90.0, -4.25))


def pt(ctx, name):
    return ctx.state.get("pts", {}).get(name, (W / 2, H / 2))


def callout_pt(name, label, sub=None, at=0.3, dx=140, dy=-100, color=WHITE, size=22):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        L = Layer()
        x, y = pt(ctx, name)
        img = hud.callout(L, img, (x, y), label, sub, fade(t, tt), prog(t, tt), dx=dx, dy=dy, color=color, size=size)
        return L.composite(img, 0.5)
    return f


def dim_line(a, b, label, at=0.3, color=WHITE, offset=0):
    """Dimension line between two named map points (or the Earth→rogue gap)."""
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        L = Layer()
        img = hud.dimension(L, img, pt(ctx, a), pt(ctx, b), label, fade(t, tt), prog(t, tt), color, offset=offset)
        return L.composite(img, 0.5)
    return f


def arrow_on(name, dxy, label, at, color=ACC):
    def f(ctx, img, t, u):
        tt = ctx.w(at) if isinstance(at, str) else at
        L = Layer()
        x, y = pt(ctx, name)
        a = fade(t, tt)
        p = prog(t, tt, 0.7)
        L.arrow((x, y), (x + dxy[0] * p, y + dxy[1] * p), color=color, alpha=a, th=3)
        img = L.composite(img, 0.5)
        return text(img, label, x + dxy[0] + (20 if dxy[0] >= 0 else -20), y + dxy[1], 22, color, a, "lc" if dxy[0] >= 0 else "rc", kind="mono6")
    return f


def ring_label(day, label, sub=None, at=0.3, color=WHITE, dr=95):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        x, y = ring_xy(ctx, day, -dr)
        a = fade(t, tt)
        img = text(img, label, x, y, 24, color, a, "c", kind="mono6", tracking=0.12)
        if sub:
            img = text(img, sub, x, y + 34, 18, DIM, a, "c", tracking=0.2)
        return img
    return f


def ring_arc_dim(d0, d1, label, at=0.3, color=WHITE, dr=170):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        L = Layer()
        img = hud.dimension(L, img, ring_xy(ctx, d0, dr), ring_xy(ctx, d1, dr), label, fade(t, tt), prog(t, tt), color)
        return L.composite(img, 0.5)
    return f


def earth_ring_over(label, at=0.3):
    def f(ctx, img, t, u):
        tt = at if isinstance(at, (int, float)) else ctx.w(at)
        if "earth_xy" not in ctx.state:
            return img
        x, y = ctx.state["earth_xy"][:2]
        return text(img, label, x, y - 40, 20, BLUE, fade(t, tt), "c", kind="mono6")
    return f


def red_cross(name_or_xy, size, at):
    def f(ctx, img, t, u):
        tt = ctx.w(at) if isinstance(at, str) else at
        L = Layer()
        if isinstance(name_or_xy, str):
            x, y = ctx.state.get(name_or_xy, (W / 2, H / 2, 0))[:2]
        else:
            x, y = name_or_xy
        L.cross((x, y), size, RED, fade(t, tt), progress=prog(t, tt, 0.5))
        return L.composite(img, 0.5)
    return f


NONE = None

# ── open1 · the promise, from the first frame ───────────────────────────────────────────
open1 = [
    B(0, rogue_scene(z=(1.0, 1.04), R=(330, 345), glow=(0.7, 1.0)),
      over_all(tag("NO STAR", "a planet drifting alone", at="star")), name="the rogue, alone in the dark"),
    B(1, rogue_scene(z=(1.04, 1.1), R=(345, 365), glow=(1.0, 1.0)),
      over_all(stat("5 × JUPITER", "MASS", at="Five"), caption("INTERSTELLAR SPACE", at="drifting")), name="5 Jupiters, drifting"),
    B(2, map_scene(run=R0, t=(-120.0, -45.0), half=(3.4, 2.5), labels=True),
      over_all(callout_pt("Rogue", "HEADING IN", at="heading", dx=-220, dy=-90, color=VIOLET),
               callout_pt("Earth", "ITS PATH CROSSES EARTH'S ORBIT", at="crosses", dx=-260, dy=120, color=BLUE)),
      name="its path into the Solar System crosses Earth's orbit"),
]

open2 = [
    B(0, calendar_scene(reveal=(0.0, 1.0), sweep=(-182.0, 182.0)),
      over_all(stat("730 RUNS", "ONE CHANGE: THE ARRIVAL DATE", at="seven", x=W - 120, y=170)), name="730 runs, one per half-day"),
    B(1, map_scene(run=R90, t=(-12.0, 40.0), half=(1.7, 1.6), hud_clock=False),
      over_all(callout_pt("Earth", "MOST DATES: BARELY NOTICES", at="barely", dx=150, dy=-90, color=GREEN)), name="most dates: nothing"),
    B(2, map_scene(run=R0, t=(0.0, 520.0), half=(1.6, 12.0), outer=True, trail=500.0, hud_clock=False),
      over_all(callout_pt("Earth", "THROWN OUT", at="thrown", dx=180, dy=-120, color=RED)), name="some dates: thrown out"),
    B(3, earth_scene(view="moon", pos=(700, 600), R=(300, 310), moon_pos=(1420, 380), moon_R=(70, 74)),
      over_all(caption("SOMETHING STRANGER", at="stranger", color=ACC), earth_ring_over("", 0)), name="the Moon — open question"),
]

# ── c1a · rogue planets are real ───────────────────────────────────────────
c1a = [
    B(0, shot("galaxy", focus="rogues", zoom=(1.0, 1.12)), tag("ROGUE PLANETS", "real, and possibly common", at="real"), name="rogues are real"),
    B(1, scatter_scene(k=(0.0, 1.0)), over_all(caption("A YOUNG SOLAR SYSTEM · ILLUSTRATIVE", at=0.2),
      tag("FLUNG OUT", "into interstellar space", at="fling", color=VIOLET)), name="planet–planet scattering"),
    B(2, scope_scene(zoom=2.4, flares=lambda ctx, t: [0.08, smooth(span(t, ctx.w("brighter") - 0.8, ctx.w("brighter") + 0.4)) * 0.9, 0.08, 0.08]),
      lambda ctx, img, t, u: lightcurve(Layer(), img, 1420, 760, 380, 90, [(0.6, 0.75 * prog(t, ctx.w("brighter") - 0.5, 1.0), 0.05)], 1.0, VIOLET, fade(t, ctx.w("bends")), "WEEKS", "BRIGHTNESS"),
      name="microlensing: the star brightens"),
    B(3, shot("galaxy", focus="rogues", zoom=(1.12, 1.25)),
      over_all(big("MORE PLANETS THAN STARS?", at="more", sub="SUMI ET AL. 2023 · ESTIMATE")), name="maybe more rogues than stars"),
]

# ── c1b · ours, and a real one ───────────────────────────────────────────
c1b = [
    B(0, rogue_scene(view="compare", pos=(1200, 560), R=(300, 300), jupiter=(560, 560, 270), glow=(0.6, 0.6), lit=(0.5, 0.5)),
      lambda ctx, img, t, u: text(text(img, "JUPITER", ctx.state.get("jup_xy", (560, 560, 270))[0], 900, 24, WHITE, fade(t, ctx.w("Jupiter")), "c", kind="mono6"),
                                  "OUR ROGUE · 5 × THE MASS", 1200, 900, 24, VIOLET, fade(t, ctx.w("same")), "c", kind="mono6"),
      name="5× Jupiter's mass, the same size"),
    B(1, rogue_scene(z=(1.1, 1.18), R=(420, 440), glow=(0.6, 1.3)), caption("ITS ONLY LIGHT: HEAT LEFT OVER FROM ITS BIRTH", at="glows"), name="faint thermal glow"),
    B(2, rogue_scene(view="wise", pos=(1180, 540), R=(170, 180), glow=(1.2, 1.2), z=(1.0, 1.08)),
      tag("WISE 0855-0714", "7.4 light-years away · 3 to 10 Jupiter masses", at="WISE"), name="WISE 0855, a real one"),
    B(3, rogue_scene(view="wise", pos=(1180, 540), R=(180, 190), glow=(1.2, 1.2), z=(1.08, 1.14)),
      over_all(stat("~250 K", "ABOUT AS COLD AS A FREEZER", at="cold", x=140, y=200, anchor="lc")), name="as cold as a freezer"),
    B(4, shot("galaxy", focus="rogues", zoom=(1.6, 1.75)), tag("NANCY GRACE ROMAN SPACE TELESCOPE", "designed to find hundreds more", at="Roman"), name="Roman will find hundreds"),
]

# ── c2a · the warning ───────────────────────────────────────────
c2a = [
    B(0, far_scene(d=(1400.0, 1250.0)), caption("WE'D SEE IT COMING", at=0.2), name="we'd see it coming"),
    B(1, far_scene(d=(1250.0, 1000.0)),
      lambda ctx, img, t, u: _far_labels(ctx, img, t, u, "SPOTTED HERE · 1,000 AU", ctx.w("thousand")), name="spotted at ~1,000 AU"),
    B(2, far_scene(d=(1000.0, 300.0)),
      over_all(lambda ctx, img, t, u: _far_labels(ctx, img, t, u, None, 0), stat("237 YEARS", "OF WARNING · AT 20 KM/S", at="two")), name="237 years of warning"),
    B(3, map_scene(run=R0, t=(-160.0, -40.0), half=(2.4, 1.8)),
      over_all(callout_pt("Rogue", "PASSES THE SUN AT 1 AU", at="passes", dx=-280, dy=100, color=VIOLET)), name="its path: 1 AU from the Sun"),
]


def _far_labels(ctx, img, t, u, spot, ts):
    sx, sy, rx, dd, cam = ctx.state["far"]
    for au, lab in ((1, "EARTH 1 AU"), (10, "SATURN 10"), (100, "100 AU"), (1000, "1,000 AU")):
        img = text(img, lab, sx + cam.r(far_r(au)), sy + cam.r(far_r(au)) * 0.55 * 0 - 30 - 0 * au, 16, DIM, 0.9, "c", tracking=0.2) if au > 1 else text(img, lab, sx, sy + 70, 16, DIM, 0.9, "c", tracking=0.2)
    if spot:
        L = Layer()
        img = hud.callout(L, img, (rx, sy), spot, "sunlight glints off it", fade(t, ts), prog(t, ts), dx=-260, dy=-150, color=VIOLET, size=22)
        img = L.composite(img, 0.5)
    img = text(img, "LOG SCALE", W - 140, H - 100, 16, DIM, 0.8, "rc", tracking=0.3)
    return img


def _obj_label(label, at, dy=-70):
    def f(ctx, img, t, u):
        if "obj_xy" not in ctx.state:
            return img
        x, y = ctx.state["obj_xy"]
        return text(img, label, x, y + dy, 22, VIOLET, fade(t, ctx.w(at)), "c", kind="mono6", tracking=0.12)
    return f



# ── c2d · what it would look like ───────────────────────────────────────────
c2d = [
    B(0, sky_scene(bright=(0.04, 0.05), obj=(1180, 330)), caption("WHAT WOULD IT LOOK LIKE?", at=0.2), name="the night sky"),
    B(1, sky_scene(bright=(0.05, 0.1), obj=(1180, 330)),
      over_all(caption("T - 7.5 YEARS · A FAINT NEW STAR", at="seven"), _obj_label("NEW STAR", "naked")), name="7.5 years out: naked eye"),
    B(2, sky_scene(bright=(0.1, 0.35), obj=(1180, 330)), over_all(caption("T - 8 MONTHS", at="Eight"), _obj_label("BRIGHTER THAN JUPITER", "brighter")), name="8 months: > Jupiter"),
    B(3, sky_scene(bright=(0.35, 0.7), obj=(1180, 330), moon=True), over_all(caption("T - 5 MONTHS", at="Five"), _obj_label("BRIGHTER THAN VENUS", "outshines")), name="5 months: > Venus"),
    B(4, sky_scene(view="binoc", size=(10.0, 13.0), obj=(960, 540), binoc=True, z=(1.0, 1.0)),
      caption("THROUGH BINOCULARS · A BANDED DISC", at="binoculars", y=H - 130, x=W / 2 - 300), name="binoculars: a disc"),
    B(5, sky_scene(view="disc", size=(26.0, 150.0), obj=(1180, 380), moon=True),
      over_all(caption("WORST DATES · FINAL 2 WEEKS", at="worst"), _obj_label("WIDER THAN THE FULL MOON", "wider", dy=200)), name="final two weeks: wider than the Moon"),
]


# ── c2b · the problem ───────────────────────────────────────────
c2b = [
    B(0, rogue_scene(view="sun", lit=(1.0, 1.0), glow=(0.3, 0.3), sun=(-300, 260), R=(380, 395)), caption("THE PROBLEM", at=0.2, color=RED), name="the problem"),
    B(1, dimmed(rogue_scene(view="sun", lit=(1.0, 1.0), glow=(0.3, 0.3), sun=(-300, 260), R=(395, 410)), 0.4),
      bars([("EARTH", 1, BLUE, "1"), ("THE ROGUE", 1589, VIOLET, "1,589", "sixteen")], vmax=1589), name="1,589 Earth masses"),
    B(2, earth_scene(view="space", pos=(960, 560), R=(320, 330)), red_cross("earth_xy", 360, "move"), name="can't move Earth"),
    B(3, calendar_scene(sweep=(0.0, 300.0), show=()), over_all(big("WHERE WILL EARTH BE?", at="Where", sub="ON THE DAY IT ARRIVES")), name="where will Earth be?"),
]

# ── c2c · the experiment ───────────────────────────────────────────
c2c = [
    B(0, map_scene(run=R90, t=(-2.0, 2.0), half=(0.05, 0.05), focus=(1.0, 1.0), hud_clock=False, trail=3.0, rogue_trail=False),
      over_all(caption("EARTH'S ORBITAL SPEED · 30 KM/S", at=0.2), stat("2.5 MILLION KM", "EVERY DAY", at="two")), name="2.5 million km per day"),
    B(1, calendar_scene(reveal=(0.0, 1.0), show=(), sweep=(-182.0, 182.0)), caption("EVERY ARRIVAL DATE · HALF-DAY STEPS", at="every"), name="every date, half-day steps"),
    B(2, map_scene(run=R0, t=(-120.0, 60.0), half=(13.0, 11.0), outer=True, trail=120.0),
      over_all(stat("730 RUNS", "SUN · ROGUE · 8 PLANETS · MOON", at="Seven")), name="730 full simulations"),
    B(3, calendar_scene(show=("same", "changed", "scorched", "frozen", "ejected"), z=(1.0, 1.04)), caption("THE CALENDAR · EARTH'S FATE BY ARRIVAL DATE", at="calendar"), name="the calendar"),
]

# ── c3a · what the calendar says ───────────────────────────────────────────
ALL = ("same", "changed", "scorched", "frozen", "ejected")
c3a = [
    B(0, calendar_scene(show=("same",), moon_marks=False, earth=False), over_all(ring_label(180.0, "74% OF DATES", "the year shifts by days", at="three", color=WHITE, dr=120)), name="74%: year shifts by days"),
    B(1, calendar_scene(show=("same", "changed"), earth=False), over_all(ring_label(-60.0, "16%", "weeks or months", at="six", dr=120), ring_label(60.0, "16%", "", at="six", dr=120)), name="16%: weeks or months"),
    B(2, calendar_scene(show=ALL, earth=False, zt=(0.0, 0.35)), over_all(big("1 DATE IN 10", at="ten", sub="THE WORLD AS WE KNOW IT ENDS", sub_col=RED, y=H - 160)), name="1 in 10: the end"),
    B(3, calendar_scene(show=ALL, earth=False, zt=(0.35, 1.0)),
      over_all(ring_label(-16.0, "CLOSER", at="three", color=ACC, dr=110), ring_label(0.75, "THROWN OUT", at="three", color=RED, dr=170),
               ring_label(14.0, "FARTHER", at="three", color=ICE, dr=110), caption("A MATTER OF DAYS", at="matter")), name="three fates, days apart"),
]

# ── c4 · FATE 1: closer ───────────────────────────────────────────
c4a = [
    B(0, map_scene(run=R16, t=(-40.0, 0.0), half=(1.4, 0.45), focus=(0.0, 1.0)),
      over_all(callout_pt("Rogue", "CROSSES BEHIND US", at="behind", dx=-260, dy=120, color=VIOLET)), name="rogue crosses behind Earth"),
    B(1, map_scene(run=R16, t=(0.0, 30.0), half=(0.45, 0.3), focus=(1.0, 1.0)),
      over_all(callout_pt("Earth", "TUGGED BACKWARDS · SLOWS DOWN", at="backwards", dx=180, dy=-120, color=ACC)), name="tugged backwards"),
    B(2, map_scene(run=R16, t=(30.0, 140.0), half=(0.6, 1.3), focus=(1.0, 0.0), trail=110.0),
      over_all(callout_pt("Earth", "FALLS CLOSER TO THE SUN", at="falls", dx=170, dy=100, color=ACC)), name="falls toward the Sun"),
]
c4b = [
    B(0, map_scene(run=R16, t=(140.0, 300.0), half=(1.3, 1.25), trail=282.0), callout_pt("Earth", "NEW, TIGHTER ORBIT", at="tighter", dx=160, dy=-100, color=ACC), name="new tighter orbit"),
    B(1, map_scene(run=R16, t=(300.0, 400.0), half=(1.25, 1.2), trail=282.0),
      stat("282 DAYS", "ONE YEAR · TODAY 365", at="eighty"), name="a year of 282 days"),
    B(2, map_scene(run=R16, t=(400.0, 470.0), half=(1.2, 1.15), trail=282.0),
      over_all(callout_pt("Venus", "VENUS'S ORBIT", at="Venus", dx=-200, dy=-110, color=(1.0, 0.85, 0.55)), stat("2 × SUNLIGHT", "AT ITS CLOSEST", at="twice", x=140, y=200, anchor="lc")),
      name="almost to Venus, 2× sunlight"),
    B(3, suns_scene(r_new=(150.0, 212.0)),
      lambda ctx, img, t, u: text(text(img, "TODAY", ctx.state["suns"][0][0], 820, 24, WHITE, fade(t, 0.2), "c", kind="mono6"),
                                  "AT CLOSEST · 40% WIDER", ctx.state["suns"][1][0], 820, 24, ACC, fade(t, ctx.w("forty")), "c", kind="mono6"), name="the Sun 40% wider"),
]
c4c = [
    B(0, earth_scene(view="hot", pos=(600, 600), scorch=(0.15, 0.35), sun_pos=(150, 160), sun_R=(70, 75), light=(-0.8, 0.35, 0.5)),
      bars([("TODAY", 100, BLUE, "100%"), ("AVERAGE, NEW ORBIT", 143, ACC, "143%", "forty")], x0=1040, w=560, y0=380, vmax=150), name="+43% sunlight on average"),
    B(1, earth_scene(view="hot", pos=(600, 600), scorch=(0.35, 0.55), sun_pos=(150, 160), sun_R=(75, 80), light=(-0.8, 0.35, 0.5)),
      bars([("TODAY", 100, BLUE, "100%"), ("AVERAGE, NEW ORBIT", 143, ACC, "143%"), ("RUNAWAY GREENHOUSE", 110, RED, "~110%", "runaway")], x0=1040, w=560, y0=380, vmax=150),
      name="runaway greenhouse at ~110%"),
    B(2, earth_scene(view="hot", pos=(600, 600), scorch=(0.55, 1.0), sun_pos=(150, 160), sun_R=(80, 84), light=(-0.8, 0.35, 0.5)),
      tag("THE OCEANS BOIL OFF", "as they may have on Venus", at="boil", color=RED), name="oceans boil away"),
]

# ── c5 · FATE 2: the Moon ───────────────────────────────────────────
c5a = [
    B(0, calendar_scene(show=ALL, earth=False, zt=(1.0, 1.0), moon_marks=True, hl=(-12.5, -9.0), hl_on=True),
      over_all(ring_label(-10.75, "4 DAYS LATER", at="four", color=WHITE, dr=110), caption("WHITE DOTS: DATES WHERE THE MOON IS LOST", at=0.3)), name="4 days later on the calendar"),
    B(1, map_scene(run=R115, t=(0.0, 14.0), half=(0.35, 0.09), focus=(0.4, 1.0), moon=True),
      dim_line("Earth", "Rogue", "10 MILLION KM · 27 × THE MOON'S DISTANCE", at="ten", color=VIOLET), name="10 million km away"),
    B(2, map_scene(run=R115, t=(14.0, 60.0), half=(0.012, 0.012), focus=(1.0, 1.0), moon=True, trail=30.0, hud_clock=True),
      callout_pt("Moon", "ORBIT SHAKEN LOOSE", at="shakes", dx=150, dy=-90, color=(0.9, 0.9, 0.95)), name="the Moon's orbit is loosened"),
]
c5b = [
    B(0, map_scene(run=R115, t=(60.0, 110.0), half=(1.15, 1.1), trail=90.0),
      callout_pt("Earth", "NEARER THE SUN THAN VENUS", at="nearer", dx=170, dy=-100, color=ACC), name="inside Venus's orbit"),
    B(1, map_scene(run=R115, t=(60.0, 118.0), half=(0.012, 0.012), focus=(1.0, 1.0), moon=True, trail=30.0),
      caption("NOTHING SEEMS WRONG", at="nothing", color=WHITE), name="four quiet months"),
    B(2, map_scene(run=R115, t=(118.0, 175.0), half=(0.012, 0.06), focus=(1.0, 1.0), moon=True, trail=60.0),
      callout_pt("Moon", "DAY 123 · THE MOON LEAVES", at="pulls", dx=150, dy=-90, color=WHITE), name="day 123: the Moon leaves"),
]
c5c = [
    B(0, map_scene(run=R115, t=(175.0, 330.0), half=(1.25, 1.2), moon=True, trail=200.0),
      callout_pt("Moon", "THE MOON · NOW A PLANET", at="planet", dx=170, dy=-110, color=WHITE), name="the Moon becomes a planet"),
    B(1, map_scene(run=R115, t=(330.0, 460.0), half=(1.2, 1.15), moon=True, trail=200.0),
      over_all(callout_pt("Moon", "ITS OWN ORBIT", at="own", dx=-200, dy=-100, color=WHITE), callout_pt("Earth", "EARTH", at="ours", dx=160, dy=90, color=BLUE)), name="its own orbit, close to ours"),
    B(2, sky_scene(view="moonless", bright=(0.0, 0.0)),
      over_all(caption("NO MORE MONTHS", at="months", y=140, color=WHITE), caption("NO MORE LUNAR ECLIPSES", at="eclipses", y=180, color=WHITE), caption("NO MOON, FOR GOOD", at="Nights", y=220, color=WHITE)),
      name="moonless nights"),
    B(3, dimmed(earth_scene(view="hot", pos=(600, 600), scorch=(0.2, 0.25), sun_pos=(150, 160), sun_R=(70, 70), light=(-0.8, 0.35, 0.5)), 0.45),
      bars([("THE MOON'S TIDES TODAY", 100, (0.85, 0.85, 0.9), "100%"), ("THE SUN'S TIDES TODAY", 46, ACC, "46%", "Sun"), ("THE SUN'S, AT EARTH'S NEW CLOSEST", 193, ACC, "193%", "bigger")], vmax=200),
      name="the Sun still raises tides"),
]
c5d = [
    B(0, rogue_scene(view="sun", lit=(1.0, 1.0), glow=(0.3, 0.3), sun=(-300, 260), R=(330, 340)), caption("WHO DID IT?", at=0.2, color=WHITE), name="who did it?"),
    B(1, map_scene(run=R115, t=(110.0, 135.0), half=(0.02, 0.025), focus=(1.0, 1.0), moon=True, trail=25.0),
      over_all(arrow_on("Moon", (-170, -40), "THE SUN'S PULL", "Sun"), caption("NOT THE ROGUE", at="wasn't", color=VIOLET)), name="it was the Sun"),
    B(2, map_scene(run=R115, t=(8.0, 20.0), half=(0.13, 0.13), focus=(1.0, 1.0)),
      dim_line("Earth", "Rogue", "10 MILLION KM", at="ten", color=VIOLET), name="loosened from 10 million km"),
    B(3, calendar_scene(show=ALL, earth=False, zt=(1.0, 1.0), moon_marks=True, hl=(-12.5, -9.0), hl_on=True),
      over_all(ring_label(-10.75, "A COIN TOSS", "depends where the Moon is", at="coin", color=WHITE, dr=110)), name="a coin toss"),
]

# ── c6 · FATE 3: farther ───────────────────────────────────────────
c6a = [
    B(0, map_scene(run=R10, t=(-45.0, -12.0), half=(1.4, 0.45), focus=(0.0, 1.0)),
      callout_pt("Rogue", "CROSSES IN FRONT OF US", at="front", dx=-260, dy=-110, color=VIOLET), name="crosses in front"),
    B(1, map_scene(run=R10, t=(-12.0, 40.0), half=(0.45, 0.6), focus=(1.0, 0.6)),
      callout_pt("Earth", "PULLED FORWARDS · SPEEDS UP", at="forwards", dx=180, dy=110, color=ICE), name="pulled forwards, swings out"),
]
c6b = [
    B(0, map_scene(run=R10, t=(40.0, 520.0), half=(1.6, 3.3), trail=500.0, belt=True),
      stat("2 YEARS 8 MONTHS", "ONE YEAR", at="lasts", color=ICE), name="a 2 yr 8 mo year"),
    B(1, map_scene(run=R10, t=(520.0, 640.0), half=(3.3, 3.3), trail=600.0, belt=True),
      over_all(callout_pt("Earth", "ASTEROID BELT · 2.8 AU", at="asteroid", dx=-240, dy=-110, color=ICE), callout_pt("Mars", "MARS", at="Mars", dx=150, dy=-60, color=(1.0, 0.5, 0.35))),
      name="out to the asteroid belt"),
    B(2, suns_scene(r_new=(150.0, 53.0), new_col=(0.75, 0.78, 0.85)),
      lambda ctx, img, t, u: text(text(img, "TODAY", ctx.state["suns"][0][0], 820, 24, WHITE, fade(t, 0.2), "c", kind="mono6"),
                                  "AT ITS FARTHEST · 1/3 AS WIDE · 1/8 THE LIGHT", ctx.state["suns"][1][0], 820, 22, ICE, fade(t, ctx.w("third")), "c", kind="mono6"), name="the Sun a third as wide"),
]


def flux_chart(ctx, img, t, u):
    """Sunlight over the stretched orbit (days 0–986), with today's level and the 50 % line."""
    a, e = M.earth_orbit(M.DAY_FROZEN)
    E = np.linspace(0, 2 * np.pi, 400)
    Mm = E - e * np.sin(E)
    r = a * (1 - e * np.cos(E))
    tt = (Mm / (2 * np.pi)) * a ** 1.5 * 365.25
    x0, y0, w, h = 260, 300, 1400, 420
    img = hud.panel(img, x0 - 60, y0 - 70, x0 + w + 60, y0 + h + 90, fade(t, 0.1), 0.5)
    L = Layer()
    img = hud.chart(L, img, x0, y0, w, h, tt / tt[-1], 1 / r ** 2 / 1.1, prog(t, 0.2, 2.0), ICE, fade(t, 0.1), "ONE STRETCHED YEAR · 986 DAYS", "SUNLIGHT")
    for lev, lab, col in ((1.0, "TODAY", WHITE), (0.5, "HALF OF TODAY", RED)):
        y = y0 + h - h * lev / 1.1
        L.line((x0, y), (x0 + w, y), color=col, alpha=0.6 * fade(t, ctx.w("half") if lev == 0.5 else 0.3), th=1)
        img = text(img, lab, x0 + w + 10, y, 16, col, fade(t, ctx.w("half") if lev == 0.5 else 0.3), "lc")
    return L.composite(img, 0.5)


c6c = [
    B(0, earth_scene(view="cold", pos=(600, 600), ice=(0.3, 0.45), light=(-0.8, 0.3, 0.5), exposure=(0.75, 0.7)),
      bars([("TODAY", 100, BLUE, "100%"), ("MARS TODAY", 43, (1.0, 0.5, 0.35), "43%", "Mars"), ("THIS EARTH, AVERAGE", 30, ICE, "30%", "less")], x0=1040, w=560, y0=380, vmax=100),
      name="less sunlight than Mars"),
    B(1, dimmed(earth_scene(view="cold", pos=(600, 600), ice=(0.45, 0.55), light=(-0.8, 0.3, 0.5), exposure=(0.7, 0.7)), 0.3), flux_chart, name="under half for 2+ years of each orbit"),
    B(2, earth_scene(view="cold", pos=(600, 600), ice=(0.55, 1.0), light=(-0.8, 0.3, 0.5), exposure=(0.7, 0.62)),
      tag("THE OCEANS FREEZE OVER", "and it never warms up as much as today", at="freeze", color=ICE), name="the oceans freeze"),
    B(3, map_scene(run=R10, t=(640.0, 1180.0), half=(3.3, 3.3), trail=900.0, belt=True),
      callout_pt("Earth", "6 MONTHS OF WEAK SUN", at="six", dx=-220, dy=-100, color=ICE), name="six months of weak sun, then out again"),
]

# ── c7 · FATE 4: thrown out ───────────────────────────────────────────
c7a = [
    B(0, calendar_scene(show=ALL, earth=False, zt=(1.0, 1.0), hl=(-5.0, 6.5), hl_on=True), caption("THE WINDOW IN THE MIDDLE", at="window", color=RED), name="the window"),
    B(1, calendar_scene(show=ALL, earth=False, zt=(1.0, 1.0), hl=(-5.0, 6.5), hl_on=True), ring_arc_dim(-5.0, 6.5, "11.5 DAYS", at="Eleven"), name="11.5 days"),
]
c7b = [
    B(0, map_scene(run=R0, t=(-5.6, -3.4), half=(0.012, 0.012), focus=(1.0, 1.0), moon=True, trail=3.0),
      dim_line("Earth", "Rogue", "211,000 KM · CLOSER THAN THE MOON", at="two", color=RED), name="211,000 km — closer than the Moon"),
    B(1, sky_scene(view="huge", size=(330.0, 360.0), obj=(1220, 420), moon=True),
      over_all(stat("~40° WIDE", "75 FULL MOONS ACROSS", at="forty", x=140, y=640, anchor="lc")), name="40° across our sky"),
    B(2, earth_scene(view="pass", pos=(560, 680), R=(250, 255), rogue_pos=(1380, 380), rogue_R=(640, 660), rogue_lit=(0.7, 0.7)),
      stat("780,000 ×", "THE MOON'S TIDAL PULL", at="tidal", color=RED), name="780,000× the Moon's tides"),
]
c7c = [
    B(0, map_scene(run=R0, t=(-4.8, -4.0), half=(0.0035, 0.0035), focus=(1.0, 1.0), roche=True, trail=1.0),
      over_all(callout_pt("Rogue", "TEARING DISTANCE · 181,000 KM", at="tear", dx=-300, dy=-160, color=RED), callout_pt("Earth", "EARTH · 30,000 KM OUTSIDE IT", at="thirty", dx=150, dy=110, color=BLUE)),
      name="30,000 km outside the Roche limit"),
    B(1, earth_scene(view="pass", pos=(560, 680), R=(255, 262), rogue_pos=(1380, 380), rogue_R=(660, 680), rogue_lit=(0.7, 0.7), stretch=(1.0, 1.10), roll=-0.6),
      tag("PULLED TOWARD IT", "oceans, rock and air · illustrative", at="pulled", color=RED), name="tides stretch Earth (illustrative)"),
    B(2, map_scene(run=R0, t=(-4.0, 25.0), half=(0.02, 0.9), focus=(1.0, 0.2), trail=25.0),
      callout_pt("Earth", "SLINGSHOT", at="slingshots", dx=170, dy=-110, color=RED), name="the slingshot"),
    B(3, map_scene(run=R0, t=(25.0, 60.0), half=(0.9, 1.6), focus=(0.2, 0.0), trail=60.0),
      stat("~2 WEEKS", "FIRST TUG TO FINAL FLING", at="whole"), name="over in two weeks"),
]
c7d = [
    B(0, map_scene(run=R0, t=(60.0, 400.0), half=(1.6, 7.0), outer=True, trail=380.0),
      stat("40 KM/S", "TODAY: 30 KM/S AROUND THE SUN", at="forty", color=RED), name="leaving at 40 km/s"),
    B(1, map_scene(run=R0, t=(-5.0, 6.0), half=(0.012, 0.05), focus=(1.0, 1.0), moon=True, trail=6.0),
      callout_pt("Moon", "THE MOON · ITS OWN PATH", at="flung", dx=150, dy=-90, color=WHITE), name="the Moon flung away"),
    B(2, map_scene(run=R0, t=(400.0, 730.0), half=(7.0, 21.0), outer=True, trail=600.0),
      over_all(callout_pt("Uranus", "URANUS", at="Uranus", dx=140, dy=-70, color=(0.6, 0.9, 1.0)), callout_pt("Earth", "EARTH · 2 YEARS LATER", at="later", dx=-260, dy=100, color=BLUE)),
      name="two years: almost to Uranus"),
]
c7e = [
    B(0, shot("vent"), tag("LIFE BELOW THE ICE", "around volcanic vents", at="vents"), name="life at the vents"),
    B(1, calendar_scene(show=ALL, earth=False, zt=(1.0, 1.0), moon_marks=True, hl=(-5.0, 6.5), hl_on=True),
      over_all(ring_label(-4.25, "EDGE", "Moon kept", at="edge", color=WHITE, dr=110), ring_label(3.0, "EDGE", "Moon kept", at="edge", color=WHITE, dr=110)), name="edge of the window: Moon kept"),
    B(2, earth_scene(view="wander", pos=(800, 600), R=(260, 262), moon_pos=(1380, 420), moon_R=(64, 64), light=(0.9, 0.5, -0.3), exposure=(0.35, 0.3), stars=0.9),
      tag("TWO TRAVELLERS", "no sun", at="travellers", color=WHITE), name="Earth and Moon leave together"),
    B(3, earth_scene(view="night", pos=(960, 640), R=(380, 385), light=(0.2, 0.2, -1.0), exposure=(0.35, 0.35), lights=(1.6, 1.6), stars=0.9),
      caption("THE SKY STAYS BLACK", at="black", color=WHITE), name="the sky stays black"),
]

# ── c8 · should you worry? ───────────────────────────────────────────
c8a = [
    B(0, shot("galaxy", focus="none", zoom=(1.0, 1.08)), caption("SHOULD YOU WORRY?", at=0.2, color=WHITE), name="should you worry?"),
    B(1, shot("galaxy", focus="rogues", zoom=(1.08, 1.2)),
      over_all(big("~350,000 ×", at="hundreds", sub="THE AGE OF THE UNIVERSE · ROUGH ESTIMATE")), name="wait: 350,000× the age of the universe"),
    B(2, earth_scene(view="today", pos=(960, 600), R=(330, 340), moon_pos=(1500, 330), moon_R=(52, 54)),
      caption("4.5 BILLION YEARS · ALMOST CERTAINLY NEVER", at="four", color=GREEN), name="never happened to us"),
]
c8b = [
    B(0, rogue_scene(z=(1.1, 1.0), R=(360, 320), glow=(1.0, 0.8)), NONE, name="the rogue drifts on"),
    B(1, calendar_scene(show=ALL, sweep=(-25.0, 25.0), zt=(0.0, 0.6)), earth_ring_over("ONE DAY", "single"), name="one single day"),
    B(2, sky_scene(view="night", bright=(0.05, 0.08), obj=(1180, 330)), caption("KNOWN MORE THAN 200 YEARS AHEAD", at="two"), name="known 200 years ahead"),
    B(3, calendar_scene(show=ALL, earth=False, zt=(0.6, 1.0), hl=(-5.0, 6.5), hl_on=True), over_all(big("11.5 DAYS", at="Eleven", sub="AN ORDINARY YEAR, OR THE DARK FOREVER", sub_col=RED, y=H - 160)), name="11.5 days"),
]

# ── teaser + outro ───────────────────────────────────────────
def streak(ctx, img, t, u):
    L = Layer()
    k = smooth(span(t, 0.5, ctx.dur))
    x0, y0 = 1700, 120
    x1, y1 = lerp(1700, 1080, k), lerp(120, 470, k)
    L.line((x0, y0), (x1, y1), color=(1.0, 0.75, 0.45), alpha=0.7 * fade(t, 0.4), th=3)
    img = L.composite(img, 0.8)
    glow_dot(img, x1, y1, (1.0, 0.85, 0.6), 3, 4 * fade(t, 0.4))
    return text(img, "NEXT · EVERY MINUTE AFTER THE ASTEROID", 140, H - 140, 24, ACC, fade(t, ctx.w("minute")), "lc", kind="mono6", tracking=0.14)


end3 = [
    B(0, earth_scene(view="teaser", pos=(820, 620), R=(330, 340), light=(-0.7, 0.3, 0.6)), streak, name="something does hit us"),
    B(1, earth_scene(view="teaser", pos=(820, 620), R=(340, 350), light=(-0.7, 0.3, 0.6)), streak, name="66 million years ago, minute by minute"),
]
outro = [B(0, rogue_scene(z=(1.0, 0.9), R=(260, 240), glow=(0.8, 0.8), pos=(960, 500)), NONE, name="end card")]

BEATS = dict(open1=open1, open2=open2, c1a=c1a, c1b=c1b, c2a=c2a, c2d=c2d, c2b=c2b, c2c=c2c, c3a=c3a, c4a=c4a, c4b=c4b,
             c4c=c4c, c5a=c5a, c5b=c5b, c5c=c5c, c5d=c5d, c6a=c6a, c6b=c6b, c6c=c6c, c7a=c7a, c7b=c7b, c7c=c7c, c7d=c7d,
             c7e=c7e, c8a=c8a, c8b=c8b, end3=end3, outro=outro)
