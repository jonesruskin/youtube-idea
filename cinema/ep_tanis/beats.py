"""BEAT SHEET — Episode 4 v2. Founder rules: something new on screen every 3-5 s; every picture shows what is being
said; one hero (a young paddlefish), one room (the river), one thing always moving (the count).
B(line, scene, overlay, at=word, cut=...) — see engine/beats.py."""
from engine.beats import Beat as B
from engine.core import W, H
from ep_tanis import model as M
from ep_tanis.cine import riverbank, sky_up, surge_scene, xray_scene, amber_scene, dig_scene, serif, tag, clock, over_all, slice_label, PEACH, INK
from ep_tanis.world import (globe, earth_cut, fish_scene, gills, cutaway, storm, water, droplet, fossil, spring_wave, birds, flow_arrows,
                            badlands, moving_star, distance_ticks, beads_macro, species, resin, fireball_horizon, flares, count_ticks, leaves, dial_top, thunder_diagram, TEAL)

P_MIN, S_MIN, R_MIN, SND = M.seismic_minutes("P"), M.seismic_minutes("S"), M.rayleigh_minutes(), M.sound_hours() * 60
P_S, S_S, R_S = P_MIN * 60, S_MIN * 60, R_MIN * 60
cl = lambda a, b, led=False: clock((a, b), ledger=led)
lab = lambda name, text, at=0.3, dy=-44, size=32, color=INK: slice_label(name, text, at, dy=dy, size=size, color=color)
NA = dict(lat=(38.0, 38.0), lon=(-97.0, -97.0), R=(1750.0, 1750.0), clouds=0.0, style="map", borders=(1.0, 1.0), tanis=(1.0, 1.0), chx=(1.0, 1.0))
def na(**kw):
    d = dict(NA)
    d.update(kw)
    return globe(**d)
def pins(at=0.3):
    return over_all(lab("tanis", "the river (North Dakota)", at, dy=-40, color=(0.6, 1.0, 0.95)), lab("chx", "the impact (Mexico)", at, dy=44, color=PEACH))
def big(n, word, x):
    return serif(n, word, x=x, y=H * 0.2, size=150, color=INK)

# ───────────── cold open: the storm and the count ─────────────
open1 = [
    B(0, storm(view="window", strike=(-1.0, -1.0), zoom=(1.0, 1.05)), name="rain on the window"),
    B(1, storm(view="lake", strike=(0.25, 0.25), horizon=0.5, zoom=(1.0, 1.04)), clock((0.0, 0.01), big=True, show_from=1.4), at="Lightning", cut=True, name="lightning, and the stopwatch starts"),
    B(1, storm(view="lake", strike=(-1.0, -1.0), horizon=0.5, zoom=(1.04, 1.1)), over_all(clock((0.0, 0.05), big=True), big("1", "One", W * 0.2), big("2", "Two", W * 0.5), big("3", "Three", W * 0.8)),
      at="One", name="a stopwatch counts one, two, three"),
    B(2, thunder_diagram(sound=(0.85, 1.0), flash=(0.0, 0.0), km=1), at="thunder", cut=True, name="the sound reaches the house: thunder"),
    B(3, thunder_diagram(sound=(0.0, 0.0), flash=(1.0, 0.6), km=3), serif("light first", "Light", y=H * 0.9), cut=True, name="the flash reaches the window at once"),
    B(3, thunder_diagram(sound=(0.0, 0.5), flash=(0.0, 0.0), km=3), serif("sound later", "Sound", y=H * 0.9), at="Sound", name="the sound spreads slowly toward the house"),
    B(3, thunder_diagram(sound=(0.5, 1.0), flash=(0.0, 0.0), km=3), at="longer", name="farther away, a longer count"),
    B(4, thunder_diagram(sound=(0.0, 0.34), flash=(0.6, 0.0), km=3), serif("3 seconds = about 1 km", "three", y=H * 0.9), cut=True, name="three seconds per kilometre"),
    B(4, thunder_diagram(sound=(0.34, 0.66), flash=(0.0, 0.0), km=3), at="kilometre", name="one more kilometre, three more seconds"),
]
open2 = [
    B(0, riverbank(phase="dawn", view_az=(-40.0, -30.0), sun_alt=(3.0, 4.0)), tag("66 million years ago", 0.4, sub="a river in North Dakota"), cut=True, name="a river at dawn"),
    B(0, riverbank(phase="dawn", view_az=(-30.0, -22.0), sun_alt=(4.0, 5.0)), over_all(serif("the longest count in history", "longest", y=H * 0.9), clock((0.0, 151.7), big=True)), at="longest", name="the longest count"),
    B(1, fish_scene(hero=(0.25, 0.45), school=2, pan=(0.0, 140.0)), cut=True, name="the fish"),
    B(1, fossil(zoom=(1.0, 1.0), sweep=(0.0, 1.0)), at="record", cut=True, name="their record in stone"),
]

# ───────────── the river, the fish, the map ─────────────
c1a = [
    B(0, riverbank(phase="dawn", view_az=(-62.0, -54.0), sun_alt=(2.0, 3.5)), name="early morning"),
    B(1, riverbank(phase="dawn", view_az=(-20.0, -14.0), pitch=(1.0, 0.0), fov=(44.0, 42.0), mist=(1.6, 1.6)), cut=True, name="mist on the water"),
    B(1, riverbank(phase="dawn", view_az=(-8.0, 4.0), pitch=(7.0, 8.0), fov=(40.0, 36.0), mist=(0.4, 0.3)), at="Conifers", cut=True, name="trees crowd the banks"),
    B(2, fish_scene(hero=(-0.05, 0.4), hero_y=(0.45, 0.45), size=(560.0, 600.0), pan=(0.0, 120.0)), tag("A young paddlefish", 0.5), cut=True, name="the hero"),
    B(2, fish_scene(hero=(0.4, 0.62), hero_y=(0.45, 0.47), size=(600.0, 820.0), pan=(120.0, 260.0)), at="swims", name="mouth wide open"),
    B(2, gills(caught=(0.0, 0.0), food=1.0, zoom=(1.0, 1.06)), at="sieving", cut=True, name="sieving food"),
    B(3, fish_scene(hero=(0.25, 0.32), hero_y=(0.5, 0.5), size=(1500.0, 1500.0), pan=(0.0, 60.0), gape=0.6, sense=(0.6, 0.8)), cut=True, name="the long flat snout, feeling for prey"),
    B(3, fish_scene(hero=(0.32, 0.38), hero_y=(0.5, 0.5), size=(1900.0, 2100.0), pan=(60.0, 120.0), gape=0.6, sense=(1.0, 1.0)), at="electric", name="sensing prey: pulses from the snout"),
    B(4, fish_scene(hero=(0.55, 0.75), hero_y=(0.3, 0.3), size=(420.0, 420.0), sturgeon=2, school=2, pan=(0.0, 160.0)), cut=True, name="sturgeon below"),
    B(4, riverbank(phase="dawn", view_az=(-48.0, -42.0), sun_alt=(5.0, 6.0), mist=(0.5, 0.4)), at="quiet", cut=True, name="an ordinary morning"),
]
c1b = [
    B(0, globe(lat=(46.0, 44.0), lon=(-103.0, -101.0), R=(9000.0, 5200.0), clouds=0.1, style="map", borders=(1.0, 1.0), tanis=(1.0, 1.0)),
      lab("tanis", "the river (North Dakota)", 0.5, color=(0.6, 1.0, 0.95)), cut=True, name="the river on the map"),
    B(1, globe(lat=(44.0, 36.0), lon=(-101.0, -96.0), R=(5200.0, 1750.0), clouds=0.0, style="map", borders=(1.0, 1.0), tanis=(1.0, 1.0), chx=(0.0, 1.0), link=(0.0, 1.0)), name="pull back: 3,000 km south"),
    B(1, na(compare=(0.0, 1.0), chx=(0.0, 0.0)), over_all(lab("tanis", "the river", 0.2, color=(0.6, 1.0, 0.95)), lab("ny", "New York", 0.4, dy=34), lab("denver", "Denver", 0.8, dy=34)),
      at="farther", name="farther than New York to Denver"),
    B(1, na(compare=(1.0, 1.0), chx=(0.0, 1.0), link=(0.0, 1.0)), pins(0.2), at="Mexico", name="three thousand km south"),
    B(2, globe(lat=(30.0, 26.0), lon=(-80.0, -86.0), R=(800.0, 1200.0), clouds=0.25, chx=(1.0, 1.0), rock=(0.0, 0.6)), cut=True, name="a rock falling"),
    B(2, globe(lat=(26.0, 22.0), lon=(-86.0, -89.0), R=(1200.0, 2600.0), clouds=0.25, chx=(1.0, 1.0), rock=(0.6, 0.93)), at="ten", name="ten km wide"),
    B(3, globe(lat=(21.5, 21.4), lon=(-89.3, -89.5), R=(7000.0, 9000.0), clouds=0.0, style="map", borders=(1.0, 1.0), chx=(1.0, 1.0)),
      lab("chx", "the crater, buried under Yucatán", 0.4, dy=60, color=PEACH), cut=True, name="the crater today"),
    B(3, globe(lat=(21.4, 21.4), lon=(-89.5, -89.5), R=(9000.0, 11000.0), clouds=0.0, style="map", borders=(1.0, 1.0), chx=(1.0, 1.0)),
      lab("chx", "Chicxulub", 0.2, dy=60, size=44, color=PEACH), at="Scientists", name="Chicxulub"),
    B(4, na(link=(1.0, 1.0), lat=(38.0, 42.0), lon=(-97.0, -100.0), R=(1750.0, 2600.0)), pins(0.1), at="Why", cut=True, name="why this river"),
    B(4, badlands(push=(0.0, 0.25), pan=(0.0, 30.0)), tag("North Dakota, today", 0.3), at="dug", cut=True, name="scientists dug it up"),
    B(4, fossil(zoom=(1.15, 1.6), focus=(0.36, 0.30), sweep=(0.2, 0.8)), at="explains", cut=True, name="what they found"),
]

# ───────────── 0:00 · impact, and the light ─────────────
c2a = [
    B(0, globe(lat=(22.0, 21.6), lon=(-88.0, -89.2), R=(2600.0, 3200.0), clouds=0.25, chx=(0.0, 0.0), rock=(0.55, 1.0), impact=(0.0, 0.3)), cut=True, name="impact"),
    B(1, globe(lat=(21.6, 21.5), lon=(-89.2, -89.4), R=(3200.0, 3600.0), clouds=0.25, impact=(1.0, 0.7), flash=(1.0, 0.0)), cut=True, name="the flash"),
    B(1, globe(lat=(21.5, 21.4), lon=(-89.4, -89.5), R=(3600.0, 7000.0), clouds=0.15, impact=(0.6, 0.3), crater=(0.2, 1.0)), lab("chx", "a crater 180 km wide", 0.5, dy=110, color=PEACH),
      at="crater", name="the crater opens"),
    B(1, riverbank(phase="dawn", view_az=(-6.0, 0.0), mist=(0.6, 0.55)), clock((0.0, 0.05), big=True), at="count", cut=True, name="the count begins"),
    B(2, earth_cut(cx=(0.0, 0.0), cy=(5800.0, 5800.0), scale=(0.26, 0.26), rays=(0.15, 1.2), eye=0.0, shell=0.0), over_all(cl(0.05, 0.1), lab("tanis", "the river", 0.3, dy=-50), lab("chx", "the impact", 0.3, dy=-34)),
      cut=True, name="the light flies over the river"),
    B(2, fish_scene(hero=(0.3, 0.55), school=2, pan=(0.0, 100.0)), cl(0.1, 0.2), at="sees", cut=True, name="the fish see nothing"),
    B(3, earth_cut(cx=(0.0, 0.0), cy=(4000.0, 4800.0), scale=(0.11, 0.17), eye=1.0, shell=0.0), lab("tanis", "the river", 0.2, dy=-50), cut=True, name="the Earth is curved"),
    B(3, earth_cut(cx=(0.0, 0.0), cy=(5600.0, 5800.0), scale=(0.2, 0.26), eye=1.0, rays=(1.0, 1.0), shell=0.0), lab("chx", "rock in the way", 0.3, dy=-60, color=(1.0, 0.5, 0.4)), at="planet", name="the planet is in the way"),
    B(4, earth_cut(cx=(-300.0, -500.0), cy=(5900.0, 6200.0), scale=(0.26, 0.3), sight=1.0, eye=1.0, plume=(0.0, 450.0), shell=0.0), name="the fireball climbs"),
    B(4, earth_cut(cx=(-500.0, -500.0), cy=(6200.0, 6300.0), scale=(0.3, 0.3), sight=1.0, eye=1.0, plume=(450.0, 860.0), shell=0.0), lab("tanis", "807 km to be seen", 0.4, dy=-60), at="eight", name="over 800 km: now visible"),
    B(4, riverbank(phase="south", view_az=(0.0, 1.0), glow=(0.0, 0.6), mist=(0.4, 0.4)), cl(1.0, 1.3), at="sky", cut=True, name="a glow appears"),
]
c2b = [
    B(0, riverbank(phase="south", view_az=(1.0, 2.0), glow=(0.5, 0.7), mist=(0.4, 0.35)), over_all(fireball_horizon(y=0.47, rise=(0.1, 0.6)), cl(1.3, 2.0)), name="the fireball over the edge"),
    B(0, riverbank(phase="south", view_az=(2.0, 2.0), pitch=(5.0, 5.0), fov=(62.0, 60.0), glow=(0.7, 0.75), mist=(0.35, 0.35)), over_all(fireball_horizon(y=0.47, rise=(0.6, 1.0)), cl(2.0, 2.6)), at="rises", name="the fireball rises over the edge"),
    B(1, riverbank(phase="south", view_az=(-14.0, -10.0), pitch=(5.0, 5.0), glow=(0.75, 0.75), mist=(0.3, 0.3)), over_all(fireball_horizon(y=0.47, rise=(1.0, 1.0)), cl(2.6, 3.2)), cut=True, name="a second sunrise in the south"),
    B(2, fish_scene(hero=(0.2, 0.5), school=3, glow_surface=(0.5, 0.7), red=(0.15, 0.2), pan=(0.0, 120.0)), cl(3.2, 3.8), cut=True, name="no sound, the fish feed"),
]

# ───────────── 5:47 · the ground ─────────────
c3a = [
    B(0, earth_cut(cx=(0.0, 0.0), cy=(0.0, 300.0), scale=(0.075, 0.08), tsec=(0.0, 60.0), show=("P",)), over_all(cl(4.0, 4.5), lab("tanis", "the river", 0.3, dy=-34)), name="Earth, cut open: a wave starts"),
    B(0, earth_cut(cx=(-1400.0, -1200.0), cy=(5600.0, 5400.0), scale=(0.3, 0.26), tsec=(10.0, 70.0), show=("P",)), lab("chx", "the impact", 0.2, dy=-34), at="rock", cut=True, name="through the rock"),
    B(1, earth_cut(cx=(0.0, 0.0), cy=(0.0, 0.0), scale=(0.075, 0.078), tsec=(70.0, 200.0), show=("P",)),
      over_all(lab("crust", "crust", 0.3, dy=0), lab("mantle", "mantle", 0.5, dy=0), lab("outer", "liquid outer core", 0.7, dy=0), lab("inner", "inner core", 0.9, dy=0)),
      name="ringing the whole planet"),
    B(2, earth_cut(cx=(0.0, 0.0), cy=(3600.0, 3800.0), scale=(0.15, 0.16), tsec=(200.0, 270.0), show=("P",), path=(0.0)), lab("mantle", "mantle", 0.2, dy=0), cut=True, name="diving into the mantle"),
    B(2, earth_cut(cx=(0.0, 0.0), cy=(4600.0, 4800.0), scale=(0.2, 0.22), show=(), path=1.0, pdot=(0.0, 1.0)), lab("tanis", "the river", 0.3, dy=-34), at="curve", cut=True, name="riding the curved path to the river"),
    B(3, spring_wave(kind="P", phase=(0.0, 1.0)), serif("push-pull", "push", y=H * 0.80), cut=True, name="push and pull, like a spring"),
    B(3, spring_wave(kind="S", phase=(0.0, 1.0)), serif("side to side", "side", y=H * 0.80), at="Slower", cut=True, name="side to side, like a rope"),
]
c3b = [
    B(0, earth_cut(cx=(1200.0, 1500.0), cy=(5700.0, 5900.0), scale=(0.3, 0.34), tsec=(310.0, P_S + 4), show=("P",), quake_glow=1.0), cl(5.2, P_MIN, True), cut=True, name="the first wave reaches the river"),
    B(0, fish_scene(hero=(0.4, 0.5), hero_y=(0.45, 0.45), school=0, shake=(1.6, 1.2), silt=(0.9, 1.0)), cl(P_MIN, P_MIN + 0.3, True), at="arrives", cut=True, name="the riverbed jolts: silt bursts up"),
    B(1, riverbank(phase="quake", view_az=(-30.0, -26.0), pitch=(10.0, 12.0), glow=(0.5, 0.5), shake=(3.0, 2.0), slosh=(0.25, 0.3)), birds(0.1), cut=True, name="birds burst out"),
    B(1, fish_scene(hero=(0.4, 0.65), hero_y=(0.4, 0.4), dive=(0.0, 1.0), school=3, shake=(0.8, 0.5), silt=(0.0, 0.8)), at="paddlefish", cut=True, name="the paddlefish dives"),
    B(2, earth_cut(cx=(0.0, 0.0), cy=(3000.0, 3000.0), scale=(0.13, 0.13), tsec=(560.0, S_S + 4), show=("S",), quake_glow=1.0), cl(9.3, S_MIN, True), cut=True, name="the slower second wave"),
    B(2, riverbank(phase="quake", view_az=(20.0, 26.0), pitch=(6.0, 6.0), glow=(0.5, 0.45), shake=(8.0, 6.0), slosh=(0.3, 0.3)), cl(S_MIN, S_MIN + 0.2, True), at="shakes", cut=True, name="everything shakes side to side"),
    B(3, na(seis=(10.0, R_MIN), link=(1.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), cl(10.0, R_MIN, True), cut=True, name="the slowest wave spreads across the land"),
    B(3, riverbank(phase="quake", view_az=(30.0, 32.0), pitch=(5.0, 5.0), glow=(0.4, 0.35), shake=(2.0, 2.0), slosh=(0.5, 0.5), roll=(1.0, 1.0)), cl(R_MIN, R_MIN + 0.3, True), at="roll", cut=True, name="the ground rolls like the sea"),
]
c3c = [
    B(0, riverbank(phase="quake", view_az=(-10.0, -14.0), pitch=(4.0, 3.0), glow=(0.35, 0.3), shake=(6.0, 5.0), slosh=(0.4, 0.4), roll=(1.0, 0.8)), over_all(leaves(0.0, n=300, seed=1405), birds(0.2, n=24, seed=1003), cl(13.3, 13.6)), cut=True, name="the biggest earthquake"),
    B(1, cutaway(slosh=(0.4, 0.75), roll=(0.3, 0.1)), cl(13.6, 13.9), cut=True, name="like a shaken bathtub"),
    B(1, cutaway(slosh=(0.55, 0.9), shake=(0.4, 0.3)), cl(13.9, 14.2), at="slosh", name="it starts to slosh"),
]

# ───────────── 13:00 · glass from the sky ─────────────
OBL = dict(lat=(18.0, 18.0), lon=(-60.0, -62.0), R=(700.0, 760.0), clouds=0.15, tanis=(1.0, 1.0), chx=(1.0, 1.0))
def obl(**kw):
    d = dict(OBL)
    d.update(kw)
    return globe(**d)
c4a = [
    B(0, obl(impact=(0.6, 0.5), arcs=(0.0, 0.15)), cl(0.5, 2.0), cut=True, name="molten rock blasted up"),
    B(0, obl(impact=(0.5, 0.4), arcs=(0.15, 0.3), R=(760.0, 1100.0), lat=(18.0, 22.0), lon=(-62.0, -72.0)), at="space", name="rock thrown out of the atmosphere"),
    B(1, obl(arcs=(0.3, 0.55), lon=(-62.0, -64.0)), cut=True, name="billions on great arcs"),
    B(1, globe(lat=(-55.0, -55.0), lon=(-95.0, -95.0), R=(2600.0, 2600.0), cy=H * 0.66 + 2600, clouds=0.2, arcs=(0.4, 0.55), tanis=(1.0, 1.0), chx=(1.0, 1.0)), at="hundreds", cut=True, name="arcs hundreds of km high"),
    B(1, globe(lat=(-55.0, -55.0), lon=(-95.0, -95.0), R=(2600.0, 2600.0), cy=H * 0.66 + 2600, clouds=0.2, arcs=(0.55, 0.8), iss=1.0, tanis=(1.0, 1.0), chx=(1.0, 1.0), cool=(0.0, 0.0)),
      tag("space station orbit: 420 km", 0.4), at="space", name="arcs high above the space station's orbit"),
    B(2, globe(lat=(-55.0, -55.0), lon=(-95.0, -95.0), R=(2600.0, 2600.0), cy=H * 0.66 + 2600, clouds=0.2, arcs=(0.8, 1.0), tanis=(1.0, 1.0), chx=(1.0, 1.0), cool=(0.0, 1.0), iss=1.0), name="the droplets cool from orange to green glass"),
    B(2, beads_macro(zoom=(1.0, 1.15)), tag("a bead of glass", 0.5, sub="the size of a grain of sand"), at="grain", cut=True, name="glass beads among grains of sand"),
]
c4b = [
    B(0, riverbank(phase="storm", view_az=(-20.0, -18.0), pitch=(14.0, 15.0), streak=(0.03, 0.04), glow=(0.2, 0.2), mist=(0.0, 0.0)), cut=True, name="one shooting star"),
    B(1, riverbank(phase="storm", view_az=(-4.0, 2.0), pitch=(12.0, 15.0), streak=(0.3, 1.0), glow=(0.3, 0.3), mist=(0.2, 0.1)), cl(13.0, 15.0, True), cut=True, name="the sky fills"),
    B(1, riverbank(phase="storm", view_az=(30.0, 34.0), pitch=(10.0, 12.0), fov=(70.0, 70.0), streak=(0.9, 1.0), glow=(0.2, 0.2)), cl(15.0, 16.0), at="millions", cut=True, name="millions of them"),
    B(2, riverbank(phase="storm", view_az=(0.0, 2.0), pitch=(22.0, 22.0), fov=(28.0, 26.0), streak=(0.25, 0.3), glow=(0.2, 0.2)), cl(16.0, 16.7), cut=True, name="one streak, close"),
    B(2, riverbank(phase="storm", view_az=(4.0, 8.0), pitch=(18.0, 14.0), streak=(1.0, 0.9), heat=(0.1, 0.3), glow=(0.3, 0.2)), cl(16.7, 18.0), at="five", cut=True, name="five km per second"),
    B(3, riverbank(phase="storm", view_az=(4.0, 6.0), pitch=(2.0, 1.0), streak=(1.0, 1.0), heat=(0.35, 0.45), glow=(0.25, 0.3)), cl(18.0, 19.5), cut=True, name="the glowing sky reflected on the water"),
    B(4, riverbank(phase="storm", view_az=(-30.0, -29.0), pitch=(6.0, 6.0), streak=(0.7, 0.6), heat=(0.5, 0.7), glow=(0.1, 0.1)), cl(19.5, 25.0), cut=True, name="the sky heats the forest"),
    B(4, riverbank(phase="storm", view_az=(-12.0, -10.0), pitch=(10.0, 10.0), fov=(40.0, 40.0), streak=(0.6, 0.5), heat=(0.8, 0.95)), cl(25.0, 32.0), at="forest", cut=True, name="treetops under a glowing sky"),
]
c4c = [
    B(0, water(hits=(0.0, 0.0), red=(0.35, 0.3), dust=(0.1, 0.15), fall=(0.3, 0.6), pitch=(5.0, 5.0), view_az=(-6.0, -6.0)), cl(35.0, 42.0), cut=True, name="beads drifting down"),
    B(0, water(hits=(0.0, 0.0), red=(0.3, 0.3), dust=(0.15, 0.2), fall=(0.6, 0.9), pitch=(-8.0, -8.0), view_az=(10.0, 10.0)), cl(42.0, 53.0), at="grain", cut=True, name="most of an hour to fall"),
    B(1, water(hits=(0.0, 0.15), red=(0.3, 0.3), dust=(0.2, 0.2)), cl(54.0, 55.0, True), cut=True, name="the first glass hits the river"),
    B(1, water(hits=(0.15, 0.35), red=(0.3, 0.3), dust=(0.2, 0.2), pitch=(-10.0, -14.0)), cl(55.0, 55.5), at="hits", name="more"),
    B(2, water(hits=(0.35, 0.9), red=(0.3, 0.28), dust=(0.2, 0.22), pitch=(-14.0, -16.0)), cl(55.5, 57.0), at="Tick", name="like rain"),
]
c4d = [
    B(0, fish_scene(hero=(-0.3, -0.1), school=0, beads=(1.0, 1.0), red=(0.15, 0.15), pan=(0.0, 60.0), bead_size=2.5, glow_surface=(0.4, 0.4)), cl(57.0, 58.0), cut=True, name="beads sinking"),
    B(1, fish_scene(hero=(0.25, 0.45), hero_y=(0.45, 0.45), size=(700.0, 900.0), beads=(1.0, 1.0), red=(0.15, 0.15), school=0, pan=(60.0, 160.0), bead_size=1.6), cl(58.0, 59.0), name="the paddlefish keeps feeding"),
    B(1, fish_scene(hero=(0.45, 0.55), hero_y=(0.48, 0.5), size=(1400.0, 1600.0), beads=(0.9, 1.0), red=(0.15, 0.15), pan=(160.0, 220.0), intake=(0.5, 1.0), school=0), cl(59.0, 60.0), at="sieves", name="sieving glass"),
    B(2, gills(caught=(0.0, 0.05), food=1.0), cl(60.0, 60.5), cut=True, name="the comb inside its gills"),
    B(2, gills(caught=(0.05, 0.35), food=0.6, zoom=(1.0, 1.05)), cl(60.5, 61.0), at="Now", name="now it catches glass"),
    B(3, gills(caught=(0.35, 0.95), food=0.3, zoom=(1.05, 1.3)), cl(61.0, 62.0), name="the beads lodge, one after another"),
]

# ───────────── the river comes back ─────────────
c5a = [
    B(0, cutaway(slosh=(0.9, 1.0), level=(0.0, 0.3), red=(0.15, 0.15), dust=(0.1, 0.1)), cl(62.0, 65.0), cut=True, name="the sloshing grows violent"),
    B(1, surge_scene(rise=(0.25, 0.7), speed=1.0), cl(65.0, 68.0), cut=True, name="the water runs backwards and rises"),
    B(1, cutaway(level=(0.3, 1.0), debris=(0.0, 0.8), red=(0.15, 0.15), dust=(0.2, 0.25), fish_in=0.7, muddy=(0.0, 0.4)), over_all(serif("at least 10 metres", "metres", y=H * 0.9), cl(68.0, 70.0)), at="rises", cut=True, name="rising ten metres"),
]
c5b = [
    B(0, surge_scene(rise=(0.2, 1.0)), cl(70.0, 72.0), cut=True, name="the wall of water"),
    B(1, surge_scene(rise=(1.0, 1.0), under=(0.0, 0.6), speed=1.2), cl(72.0, 74.0), name="logs and fish tumble"),
    B(2, cutaway(level=(1.0, 0.7), debris=(0.8, 0.5), fish_on_bank=(0.0, 1.0), fish_in=0.0, dust=(0.25, 0.3), muddy=(1.0, 1.0)), cl(74.0, 76.0), cut=True, name="thrown onto the bank"),
    B(2, cutaway(level=(0.7, 0.5), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.3, 0.3), zoom=(1.0, 1.6), focus=(0.86, 0.45), debris=(0.5, 0.5), muddy=(1.0, 1.0)), cl(76.0, 78.0), at="bank", name="stranded fish"),
]
c5c = [
    B(0, cutaway(level=(0.5, 0.05), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.3, 0.3), mud=(0.0, 0.1), muddy=(1.0, 1.0), focus=(0.5, 0.72), debris=(0.6, 0.6)), cl(78.0, 82.0), cut=True, name="the water pulls back"),
    B(0, cutaway(level=(0.05, 1.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, debris=(0.6, 0.6), dust=(0.3, 0.3), mud=(0.1, 0.15), muddy=(1.0, 1.0), focus=(0.5, 0.72)), cl(82.0, 86.0), at="again", name="and comes again, higher"),
    B(1, cutaway(level=(0.85, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, debris=(0.6, 0.0), dust=(0.3, 0.32), mud=(0.15, 0.45), muddy=(1.0, 1.0), focus=(0.5, 0.72)), cl(86.0, 92.0), name="a layer of mud"),
    B(1, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.32, 0.35), mud=(0.45, 0.7), muddy=(1.0, 1.0), focus=(0.5, 0.72)), cl(92.0, 98.0), at="burying", name="burying the fish"),
    B(2, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.35, 0.38), mud=(0.7, 0.8), rain=(0.6, 1.0), muddy=(1.0, 1.0), focus=(0.5, 0.72)), cl(98.0, 105.0), name="glass keeps falling into the mud"),
    B(3, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.38, 0.45), mud=(0.8, 1.0), rain=(1.0, 0.7), muddy=(1.0, 1.0), focus=(0.5, 0.72)), cl(105.0, 120.0, True), name="the channel fills"),
    B(3, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.45, 0.5), mud=(1.0, 1.0), rain=(0.7, 0.5), muddy=(1.0, 1.0), focus=(0.5, 0.72)),
      over_all(serif("more than a metre of mud and glass", "metre", y=H * 0.9, size=56), cl(120.0, 125.0)), at="metre", name="layer on layer"),
]

# ───────────── 2:32:00 · the end of the count ─────────────
c6a = [
    B(0, na(link=(1.0, 1.0), R=(1500.0, 1750.0)), over_all(pins(0.1), cl(125.0, 126.0)), cut=True, name="back to the count"),
    B(1, storm(view="lake", strike=(0.1, 0.1), ring=(0.0, 0.35), horizon=0.34), clock((0.0, 0.08), big=True), cut=True, name="sound is slow: the ring crawls while the stopwatch runs"),
    B(1, na(sound=(5.0, 20.0), link=(1.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), over_all(pins(0.1), cl(5.0, 20.0)), at="third", cut=True, name="the sound ring spreads slowly"),
    B(2, na(sound=(20.0, 40.0), link=(1.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), over_all(pins(0.1), cl(20.0, 40.0)), name="two and a half hours to cross"),
    B(3, na(sound=(40.0, 60.0), states=(("Texas", 0.6),), link=(1.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), over_all(lab("texas", "Texas", 0.3, dy=0, size=40), cl(40.0, 60.0)), name="one hour: the Texas coast"),
    B(3, na(sound=(60.0, 62.0), states=(("Texas", 0.6),), link=(1.0, 1.0), lat=(34.0, 30.0), lon=(-97.0, -94.0), R=(1500.0, 2400.0)), cl(60.0, 62.0), at="coast", name="only just reaching the coast"),
    B(4, na(sound=(110.0, 122.0), states=(("Nebraska", 0.6),), link=(1.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), over_all(lab("nebraska", "Nebraska", 0.3, dy=0, size=40), cl(110.0, 122.0)), cut=True, name="two hours: Nebraska"),
    B(4, na(sound=(122.0, 132.0), states=(("Nebraska", 0.6),), link=(1.0, 1.0), lat=(34.0, 40.0), lon=(-97.0, -99.0), R=(1500.0, 2000.0)), over_all(lab("tanis", "the river", 0.2, color=(0.6, 1.0, 0.95)), cl(122.0, 132.0)),
      at="Still", name="still not there"),
]
c6b = [
    B(0, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.5, 0.55), mud=(1.0, 1.0), muddy=(1.0, 1.0), ash=(0.2, 0.3), focus=(0.5, 0.36)), cl(135.0, 140.0, True), cut=True, name="the river is gone, filled with mud"),
    B(0, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.5, 0.55), mud=(1.0, 1.0), muddy=(1.0, 1.0), ash=(0.3, 0.4), focus=(0.5, 0.36)), cl(140.0, 144.0), at="Nothing", name="nothing moves over the buried river"),
    B(1, na(sound=(144.0, 151.5), link=(1.0, 1.0), lat=(42.0, 44.0), lon=(-100.0, -102.0), R=(2600.0, 3600.0)), over_all(lab("tanis", "the river", 0.2, color=(0.6, 1.0, 0.95)), cl(144.0, 151.5)), cut=True, name="the ring reaches the river"),
    B(1, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.55, 0.55), mud=(1.0, 1.0), muddy=(1.0, 1.0), ash=(0.5, 0.6), slosh=(0.0, 0.0), roll=(0.0, 0.06)), cl(151.5, 151.68, True), at="sound", cut=True, name="silence"),
    B(1, thunder_diagram(sound=(0.85, 1.0), flash=(0.0, 0.0), km=3, show_watch=0.0),
      cl(SND, SND + 0.07, True), at="arrives", name="the sound finally arrives (the storm diagram again)"),
]
c6c = [
    B(0, na(sound=(140.0, 152.0), link=(1.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), over_all(serif("9,120 seconds", "Nine", y=H * 0.9), clock((0.0, 151.7), big=True)), cut=True, name="9,120 seconds of counting"),
    B(0, na(link=(0.0, 1.0), lat=(34.0, 34.0), R=(1500.0, 1500.0)), over_all(pins(0.1), serif("divided by 3: about 3,000 km", "storm", y=H * 0.9)), at="storm", name="the storm rule: 3,000 km"),
    B(1, riverbank(phase="still", view_az=(-8.0, -4.0), pitch=(4.0, 4.0), dust=(0.5, 0.55), level=(1.4, 1.4), buried=(0.25, 0.25), mist=(0.2, 0.2)), cut=True, name="no one left to hear: a silent mudflat"),
    B(2, globe(lat=(25.0, 25.0), lon=(-85.0, -70.0), R=(520.0, 520.0), clouds=0.25, soot=(0.05, 0.45)), cut=True, name="soot spreads from the crater"),
    B(2, globe(lat=(25.0, 25.0), lon=(-70.0, -55.0), R=(520.0, 520.0), clouds=0.25, soot=(0.45, 1.0)), at="whole", name="over the whole planet"),
    B(3, species(fade=(0.0, 0.4)), serif("three in four species", "three", y=H * 0.84), cut=True, name="four kinds of life"),
    B(3, species(fade=(0.4, 1.0)), at="morning", name="three of the four go dark"),
]

# ───────────── 66 million years later · the record ─────────────
c7a = [
    B(0, badlands(push=(0.0, 0.1), pan=(0.0, 40.0), diggers=0.0, trench=0.0), tag("North Dakota, today", 0.4, sub="66 million years later"), cut=True, name="a dry hillside"),
    B(0, badlands(push=(0.1, 0.35), pan=(40.0, 60.0), diggers=1.0, trench=1.0), at="dry", name="scientists at a dig"),
    B(1, badlands(push=(0.7, 1.0), pan=(40.0, 30.0), diggers=1.0, trench=1.0), cut=True, name="close: digging into that layer"),
    B(1, fossil(zoom=(1.0, 1.05), sweep=(0.0, 0.7)), at="found", cut=True, name="the fish, where the water left them"),
    B(2, fossil(zoom=(1.35, 1.35), focus=(0.27, 0.35), sweep=(0.0, 0.6)), cut=True, name="stacked one above another"),
    B(2, fossil(zoom=(1.35, 1.35), focus=(0.73, 0.68), sweep=(0.4, 1.0)), at="same", cut=True, name="all pointing the same way"),
    B(3, fossil(zoom=(1.4, 1.45), focus=(0.30, 0.26)), cut=True, name="complete, fins and all"),
    B(4, fossil(zoom=(1.5, 1.6), focus=(0.72, 0.27), sweep=(0.2, 0.8)), cut=True, name="a sturgeon"),
    B(4, fossil(zoom=(1.7, 1.9), focus=(0.36, 0.26), glint=0.6), at="glass", cut=True, name="glass beads at the gills"),
]
c7b = [
    B(0, gills(caught=(0.5, 0.7), food=0.5, zoom=(1.0, 1.05)), cut=True, name="breathing in glass"),
    B(0, fish_scene(hero=(0.1, 0.5), hero_y=(0.45, 0.45), size=(800.0, 900.0), beads=(1.0, 1.0), red=(0.1, 0.1), school=2), at=("alive", 1), cut=True, name="alive when it arrived"),
    B(1, resin(flow=(0.0, 1.0), zoom=(1.0, 1.08)), tag("Amber from the tree trunks", 0.4), cut=True, name="resin running down a tree, catching glass"),
    B(1, amber_scene(light=(-0.2, 0.4), zoom=(1.05, 1.1), focus=(0.3, 0.8)), at="amber", name="glass sealed in amber"),
    B(1, na(link=(0.0, 1.0)), pins(0.2), at="chemistry", cut=True, name="matches the crater"),
    B(2, fossil(zoom=(1.6, 2.4), focus=(0.64, 0.30), glint=1.0), cut=True, name="still glass"),
    B(2, beads_macro(zoom=(1.15, 1.3)), at="sixty", cut=True, name="the beads are still glass"),
    B(3, badlands(push=(0.45, 0.6), pan=(60.0, 66.0), diggers=1.0, trench=1.0), cut=True, name="scientists still at work"),
    B(3, fossil(zoom=(1.8, 2.4), focus=(0.72, 0.54), glint=1.0), at="gills", cut=True, name="the glass in the gills"),
]
next_ = [
    B(0, globe(lat=(15.0, 15.0), lon=(-30.0, -24.0), R=(300.0, 260.0), clouds=0.35, geo_ring=0.6, sun=(0.3, 0.2, 0.93), apophis=(0.15, 0.35)), cut=True, name="rocks from space still pass"),
    B(1, globe(lat=(15.0, 15.0), lon=(-24.0, -20.0), R=(260.0, 170.0), clouds=0.35, geo_ring=1.0, sun=(0.3, 0.2, 0.93), apophis=(0.25, 0.4)), tag("13 April 2029", 0.4), name="our satellites"),
    B(1, globe(lat=(15.0, 15.0), lon=(-20.0, -16.0), R=(170.0, 160.0), clouds=0.35, geo_ring=1.0, sun=(0.3, 0.2, 0.93), apophis=(0.4, 0.6)), tag("Apophis", 0.3), at="Apophis", name="Apophis"),
    B(1, globe(lat=(15.0, 15.0), lon=(-16.0, -12.0), R=(170.0, 185.0), clouds=0.35, geo_ring=1.0, sun=(0.3, 0.2, 0.93), apophis=(0.6, 0.85)), at="satellites", name="inside the satellite ring"),
    B(2, badlands(push=(0.0, 0.0), pan=(0.0, 10.0), diggers=0.0, trench=0.0, night=1.0), moving_star(), cut=True, name="a moving star over North Dakota"),
]
end1 = [
    B(0, fish_scene(hero=(-0.1, 0.35), hero_y=(0.62, 0.62), size=(600.0, 700.0), school=0, pan=(0.0, 120.0)), cut=True, name="one young paddlefish"),
    B(0, fish_scene(hero=(0.35, 0.55), hero_y=(0.62, 0.64), size=(700.0, 900.0), school=0, pan=(120.0, 200.0), red=(0.0, 0.3), beads=(0.0, 0.6), murk=(0.0, 0.55)),
      dial_top((120.0, 151.7)), at="count", name="the count ends: the stopwatch closes, the water darkens"),
    B(1, fossil(zoom=(1.0, 1.06), sweep=(0.0, 0.6)), cut=True, name="turned to stone"),
    B(1, fossil(zoom=(1.06, 1.3), focus=(0.27, 0.22), sweep=(0.6, 1.0)), at="telling", name="still telling us"),
    B(2, cutaway(level=(0.0, 0.0), fish_on_bank=(1.0, 1.0), fish_in=0.0, dust=(0.15, 0.15), mud=(1.0, 1.0), muddy=(1.0, 1.0)), clock((0.0, 151.7), big=True), cut=True, name="a clock written in mud"),
    B(2, fossil(zoom=(2.0, 2.5), focus=(0.27, 0.22), glint=1.0), at="ticks", cut=True, name="glass for its ticks"),
]

BEATS = dict(open1=open1, open2=open2, c1a=c1a, c1b=c1b, c2a=c2a, c2b=c2b, c3a=c3a, c3b=c3b, c3c=c3c, c4a=c4a, c4b=c4b, c4c=c4c, c4d=c4d,
             c5a=c5a, c5b=c5b, c5c=c5c, c6a=c6a, c6b=c6b, c6c=c6c, c7a=c7a, c7b=c7b, next=next_, end1=end1)
