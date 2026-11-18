"""BEAT SHEET — Episode 4, the riverbank. Every line gets a shot. The camera never leaves the river (eye level,
under the water, looking up through the trees) except for the slice through the planet, which shows what is
travelling toward it, and the evidence 66 million years later. The clock in the corner is the chapter device."""
from engine.beats import Beat as B
from engine.core import W, H
from ep_tanis.cine import (riverbank, river_under, sky_up, slice_scene, slice_label, surge_scene, xray_scene, amber_scene,
                           dig_scene, next_scene, burial_scene, serif, tag, clock, over_all, PEACH, INK, GLASS)
from ep_tanis import model as M

P_MIN, S_MIN, R_MIN, SND = M.seismic_minutes("P"), M.seismic_minutes("S"), M.rayleigh_minutes(), M.sound_hours() * 60
WIDE = ((0.0, M.R_E - 120.0, 2.25), (0.0, M.R_E - 120.0, 2.15))
HIGH = ((0.0, M.R_E + 380.0, 2.7), (0.0, M.R_E + 420.0, 2.6))
CRATER = ((-1450.0, M.R_E + 150.0, 1.1), (-1400.0, M.R_E + 250.0, 1.4))


def names(*extra, at=0.4):
    return over_all(slice_label("crater", "Chicxulub", at, dy=46, color=PEACH),
                    slice_label("tanis", "Tanis", at, dy=46, color=GLASS), *extra)


open1 = [
    B(0, river_under(beads=(0.0, 0.05), look=(44.0, 48.0)), tag("Hell Creek, 66 million years ago", 0.5, sub="the river at Tanis"), name="a paddlefish feeding"),
    B(1, river_under(beads=(0.05, 0.15), look=(48.0, 51.0), gape=1.0)),
    B(2, river_under(beads=(0.15, 0.9), streak=(0.2, 0.7), heat=(0.0, 0.2), look=(51.0, 54.0)), serif("This morning, the water is full of glass.", "full", y=H * 0.86, size=60), at="water", name="glass in the water"),
]
open2 = [
    B(0, xray_scene(scan=(0.0, 1.0), zoom=(1.0, 1.15)), tag("X-ray of a Tanis fish, illustrated", 0.6, sub="glass beads in the gills"), name="the evidence"),
    B(1, slice_scene(view=WIDE, tmin=(0.0, 16.0), show=("crater", "tanis", "glass")), names(), name="Mexico to Dakota"),
    B(2, slice_scene(view=((0.0, M.R_E - 120.0, 2.15), (0.0, M.R_E - 80.0, 1.95)), tmin=(16.0, 24.0), show=("crater", "tanis", "glass")), over_all(names(at=0.0), serif("How did it get here so fast?", 0.3, y=H * 0.84)), name="so fast?"),
]
open3 = [
    B(0, slice_scene(view=((0.0, M.R_E - 120.0, 2.15), (0.0, M.R_E + 100.0, 2.3)), tmin=(0.0, 160.0), show=("crater", "tanis", "P", "S", "rayleigh", "glass", "sound")), names(at=0.0), name="every path to the river"),
    B(1, riverbank(phase="dawn", view_az=(-10.0, -4.0)), serif("in a very strange order", "order", y=H * 0.84), cut=True, name="the river at dawn"),
]

c1a = [
    B(0, riverbank(phase="dawn", view_az=(-58.0, -50.0), sun_alt=(4.0, 5.0)), tag("Probably spring", 0.6), name="spring dawn"),
    B(1, riverbank(phase="dawn", view_az=(-50.0, -38.0), sun_alt=(5.0, 6.0))),
    B(2, river_under(beads=(0.0, 0.0), look=(40.0, 44.0), school=2, gape=0.6), name="paddlefish snouts"),
    B(3, riverbank(phase="south", view_az=(-6.0, 0.0), mist=(0.6, 0.5)), clock((0.0, 0.0), show_from=1.5), cut=True, name="looking south"),
]
c1b = [
    B(0, riverbank(phase="south", view_az=(0.0, 2.0), mist=(0.5, 0.5)), clock((0.0, 0.004)), name="nothing happens"),
    B(1, slice_scene(view=WIDE, tmin=(0.0, 0.0), show=("crater", "tanis", "horizon")), names(), name="the planet in the way"),
    B(2, slice_scene(view=((0.0, M.R_E - 120.0, 2.15), (0.0, M.R_E - 40.0, 2.6)), tmin=(0.0, 0.0), show=("crater", "tanis", "horizon")), over_all(names(at=0.0), serif("3,000 km of curved Earth", 0.4, y=H * 0.86))),
]
c2a = [
    B(0, slice_scene(view=HIGH, tmin=(0.0, 1.0), show=("crater", "tanis", "horizon", "plume"), plume=(0.0, 820.0)),
      over_all(names(at=0.0), slice_label("h807", "807 km", 0.8, dx=-40, dy=-10, size=40, anchor="rc")), name="above the curve"),
    B(1, slice_scene(view=HIGH, tmin=(1.0, 2.0), show=("crater", "tanis", "horizon", "plume"), plume=(820.0, 1400.0)),
      over_all(names(at=0.0), slice_label("h807", "807 km", 0.0, dx=-40, dy=-10, size=40, anchor="rc"))),
]
c2b = [
    B(0, riverbank(phase="south", view_az=(0.0, 0.0), glow=(0.0, 0.75), mist=(0.5, 0.45)), clock((1.5, 3.0), ledger=True), cut=True, name="a second dawn in the wrong place"),
    B(1, river_under(beads=(0.0, 0.0), glow=(0.5, 0.6), look=(84.0, 87.0), school=3, gape=0.8), name="the fish notice nothing"),
]
c2c = [
    B(0, slice_scene(view=CRATER, tmin=(3.0, 4.0), show=("crater", "plume"), plume=(1400.0, 1700.0)), slice_label("crater", "Chicxulub", 0.3, dy=46, color=PEACH), name="at the crater"),
    B(1, slice_scene(view=CRATER, tmin=(4.0, 5.0), show=("crater", "plume"), plume=(1700.0, 1900.0)), serif("A wave more than a kilometre high", 0.3, y=H * 0.86)),
    B(2, slice_scene(view=WIDE, tmin=(0.0, 3.0), show=("crater", "tanis", "P", "S")), names(at=0.0), name="underground"),
]
c3a = [
    B(0, slice_scene(view=WIDE, tmin=(3.0, 5.0), show=("crater", "tanis", "P", "S")), names(at=0.0), name="through the rock"),
    B(1, slice_scene(view=((0.0, M.R_E - 300.0, 1.9), (0.0, M.R_E - 330.0, 1.8)), tmin=(5.0, 11.0), show=("crater", "tanis", "P", "S")),
      over_all(names(at=0.0), slice_label("P", "deep, fastest", 1.5, dy=46, color=(0.55, 0.8, 1.0), size=30))),
]
c3b = [
    B(0, riverbank(phase="quake", view_az=(0.0, 1.0), pitch=(-9.0, -5.0), glow=(0.7, 0.6), shake=(0.0, 3.0), slosh=(0.0, 0.2)), clock((P_MIN - 0.02, P_MIN + 0.3), ledger=True), at="jolt", cut=True, name="the first jolt"),
    B(1, riverbank(phase="quake", view_az=(-22.0, -30.0), pitch=(3.0, 2.0), fov=(46.0, 44.0), glow=(0.6, 0.5), shake=(3.0, 7.0), slosh=(0.2, 0.5)), clock((S_MIN - 0.02, S_MIN + 0.3), ledger=True), at="sideways"),
    B(2, riverbank(phase="quake", view_az=(18.0, 26.0), pitch=(6.0, 7.0), fov=(76.0, 78.0), glow=(0.5, 0.45), shake=(7.0, 5.0), slosh=(0.5, 0.9)), clock((R_MIN - 0.02, R_MIN + 0.3), ledger=True), at="rolling"),
]
c3c = [
    B(0, riverbank(phase="quake", view_az=(26.0, 30.0), pitch=(7.0, 6.0), fov=(78.0, 70.0), glow=(0.45, 0.4), shake=(5.0, 3.5), slosh=(0.9, 1.0)), clock((13.3, 14.0)), name="bigger than any measured"),
    B(1, riverbank(phase="quake", view_az=(30.0, 34.0), pitch=(6.0, 4.0), fov=(70.0, 62.0), glow=(0.4, 0.35), shake=(3.5, 2.5), slosh=(1.0, 1.0)), tag("Japan, 2011: fjords sloshed in Norway", 0.4, sub="8,000 km away")),
    B(2, river_under(beads=(0.0, 0.0), murk=(0.2, 0.5), look=(46.0, 42.0), glow=(0.3, 0.3)), name="the river rocks in its bed"),
]
c4a = [
    B(0, slice_scene(view=HIGH, tmin=(0.0, 6.0), show=("crater", "tanis", "glass")), names(at=0.0), name="molten rock into space"),
    B(1, slice_scene(view=HIGH, tmin=(6.0, 14.0), show=("crater", "tanis", "glass")),
      over_all(names(at=0.0), slice_label("glass45", "5 km/s, up to 1,700 km high", 0.8, dy=60, size=32, color=GLASS))),
    B(2, slice_scene(view=HIGH, tmin=(14.0, 25.0), show=("crater", "tanis", "glass")),
      over_all(names(at=0.0), serif("back overhead from minute 12 to minute 25", 0.4, y=H * 0.88, size=54))),
]
c4b = [
    B(0, sky_up(streak=(0.15, 0.6), spin=(0.0, 6.0)), clock((12.3, 14.0)), cut=True, name="shooting stars"),
    B(1, riverbank(phase="storm", view_az=(-4.0, 4.0), pitch=(13.0, 15.0), streak=(0.7, 1.0), glow=(0.3, 0.3), mist=(0.2, 0.1)), clock((14.0, 17.0), ledger=True), name="too many to count"),
]
c4c = [
    B(0, riverbank(phase="storm", view_az=(4.0, 8.0), pitch=(15.0, 12.0), streak=(1.0, 0.9), heat=(0.1, 0.6), glow=(0.3, 0.2), mist=(0.1, 0.0)),
      serif("more heat than the midday Sun", "Sun", y=H * 0.86), name="the sky heats"),
    B(1, riverbank(phase="storm", view_az=(8.0, 10.0), pitch=(12.0, 10.0), streak=(0.9, 0.7), heat=(0.6, 0.7), glow=(0.2, 0.1), mist=(0.0, 0.0)), clock((20.0, 30.0))),
]
c5d = [
    B(0, sky_up(streak=(0.5, 0.35), heat=(0.5, 0.45), spin=(6.0, 12.0)), clock((34.0, 38.0)), cut=True, name="a finer fallout"),
    B(1, sky_up(streak=(0.35, 0.3), heat=(0.45, 0.4), spin=(12.0, 16.0)), clock((38.0, 40.0), ledger=True)),
    B(2, sky_up(streak=(0.3, 0.25), heat=(0.4, 0.35), spin=(16.0, 20.0)), tag("Shocked quartz", 0.3, sub="the fingerprint of an impact")),
]
c5a = [
    B(0, riverbank(phase="after", view_az=(-6.0, -2.0), pitch=(10.0, 8.0), streak=(0.5, 0.1), heat=(0.35, 0.3), dust=(0.05, 0.15), mist=(0.0, 0.0)), clock((40.0, 45.0)), cut=True, name="streaks burn out"),
    B(1, sky_up(streak=(0.15, 0.0), heat=(0.3, 0.25), dust=(0.1, 0.2), spin=(20.0, 24.0)), name="beads drifting down"),
    B(2, riverbank(phase="after", view_az=(0.0, 2.0), pitch=(6.0, 5.0), heat=(0.3, 0.25), dust=(0.2, 0.25), beads=(0.0, 0.15), mist=(0.0, 0.0)),
      serif("a grain of sand takes most of an hour", 0.5, y=H * 0.86)),
]
c5b = [
    B(0, river_under(beads=(0.3, 0.8), heat=(0.25, 0.25), dust=(0.2, 0.2), look=(48.0, 52.0), school=2), clock((54.0, 62.0), ledger=True), cut=True, name="glass reaches the river"),
    B(1, river_under(beads=(0.8, 1.0), heat=(0.25, 0.25), dust=(0.2, 0.25), look=(52.0, 50.0), school=2), tag("15 cm every second", 0.4, sub="sinking through the river")),
    B(2, river_under(beads=(1.0, 1.0), heat=(0.25, 0.25), dust=(0.25, 0.3), look=(50.0, 18.0), school=2, gape=1.0), name="the fish sieve them out"),
]
c5c = [
    B(0, river_under(beads=(0.25, 0.3), heat=(0.2, 0.2), dust=(0.3, 0.3), look=(18.0, 24.0), school=4, gape=0.8),
      over_all(clock((62.0, 68.0)), tag("Spring here", 0.4, sub="breeding season")), name="the season matters"),
    B(1, river_under(beads=(0.3, 0.3), heat=(0.2, 0.2), dust=(0.3, 0.32), look=(24.0, 30.0), school=4, gape=0.6), tag("Autumn in the south", 0.3, sub="life slowing for winter")),
]
c6a = [
    B(0, riverbank(phase="rise", view_az=(-10.0, -12.0), pitch=(4.0, 3.5), heat=(0.2, 0.15), dust=(0.32, 0.35), slosh=(0.8, 1.2), level=(0.0, 0.6), beads=(0.2, 0.2), mist=(0.0, 0.0)),
      clock((70.0, 80.0)), cut=True, name="the river turns around"),
    B(1, riverbank(phase="rise", view_az=(-12.0, -14.0), pitch=(3.5, 3.0), heat=(0.15, 0.15), dust=(0.35, 0.35), slosh=(1.2, 1.4), level=(0.6, 1.2), beads=(0.2, 0.2), mist=(0.0, 0.0)),
      serif("at least ten metres high", "ten", y=H * 0.86)),
]
c6b = [
    B(0, surge_scene(rise=(0.2, 1.0)), name="the surge", cut=True),
    B(1, surge_scene(rise=(1.0, 1.0), under=(0.0, 0.9), speed=1.2), name="again"),
    B(2, burial_scene(fill=(0.25, 0.55), zoom=(1.0, 1.08)), cut=True, name="glass into the mud"),
]
c6c = [
    B(0, slice_scene(view=WIDE, tmin=(4.0, 13.5), show=("crater", "tanis", "P", "S", "rayleigh")), over_all(names(at=0.0), clock((90.0, 100.0))), cut=True, name="what drove it"),
    B(1, slice_scene(view=WIDE, tmin=(13.5, 13.5), show=("crater", "tanis", "P", "S", "rayleigh")),
      over_all(names(at=0.0), serif("a tsunami: at least 18 hours away", 1.6, y=H * 0.86, size=60))),
]
c7a = [
    B(0, riverbank(phase="still", view_az=(-6.0, -2.0), pitch=(4.0, 4.0), dust=(0.45, 0.5), heat=(0.05, 0.05), level=(1.4, 1.4), slosh=(0.2, 0.1), mist=(0.1, 0.2)), clock((110.0, 125.0), ledger=True), cut=True, name="dead and buried"),
    B(1, riverbank(phase="still", view_az=(-2.0, 0.0), pitch=(4.0, 4.0), dust=(0.5, 0.52), level=(1.4, 1.4), slosh=(0.1, 0.05), mist=(0.2, 0.25)), clock((125.0, 140.0), ledger=True)),
    B(2, riverbank(phase="still", view_az=(0.0, 0.5), pitch=(4.0, 4.0), dust=(0.52, 0.54), level=(1.4, 1.4), slosh=(0.05, 0.0), mist=(0.25, 0.3)),
      over_all(clock((140.0, 151.0)), serif("One thing hasn't arrived.", 0.4, y=H * 0.84))),
]
c7b = [
    B(0, riverbank(phase="still", view_az=(0.5, 0.6), pitch=(4.0, 4.0), dust=(0.54, 0.55), level=(1.4, 1.4), mist=(0.3, 0.3)), clock((151.0, 151.68)), name="silence"),
    B(0, riverbank(phase="still", view_az=(0.6, 0.8), pitch=(4.0, 4.0), dust=(0.55, 0.56), level=(1.4, 1.4), shake=(4.0, 0.0), slosh=(0.6, 0.1), mist=(0.3, 0.3)),
      clock((SND, SND + 0.06), ledger=True), at="hears", name="the sound arrives"),
]
c7c = [
    B(0, slice_scene(view=WIDE, tmin=(0.0, SND), show=("crater", "tanis", "sound")), over_all(names(at=0.0), slice_label("sound", "335 m/s", 0.8, dy=-44, size=32)), cut=True, name="the slowest messenger"),
    B(1, burial_scene(fill=(0.8, 1.0), zoom=(1.7, 1.85), center=(0.22, 0.42), rain=0.4),
      serif("under more than a metre of mud and glass", 0.6, y=H * 0.86, size=58), cut=True),
]
c7d = [
    B(0, sky_up(dust=(0.5, 0.75), dark=(0.0, 0.3), spin=(0.0, 5.0), canopy=1.0), clock((180.0, 360.0)), cut=True, name="dust settles"),
    B(1, sky_up(dust=(0.75, 0.95), dark=(0.3, 0.75), spin=(5.0, 9.0), canopy=1.0), name="days turn dark"),
    B(2, riverbank(phase="dark", view_az=(4.0, 5.0), pitch=(4.0, 4.0), dust=(0.95, 0.95), dark=(0.75, 0.85), level=(1.4, 1.4), mist=(0.1, 0.1), sun_vis=0.0),
      serif("three in four species", 0.5, y=H * 0.84, color=INK)),
]
c8a = [
    B(0, dig_scene(push=(0.0, 0.4)), tag("North Dakota, today", 0.6, sub="66 million years later"), cut=True, name="a dry hillside"),
    B(1, dig_scene(push=(0.4, 1.0), mark=(0.0, 1.0)),
      over_all(slice_label("kpg", "the boundary clay, 1 to 2 cm", 0.6, dy=-34, anchor="lc", size=34, color=PEACH),
               slice_label("event", "the event bed: fish, roots, mud", 1.6, dy=0, anchor="lc", size=34))),
]
c8b = [
    B(0, xray_scene(scan=(0.0, 1.0), zoom=(1.05, 1.3), pan=(0.0, 120.0)), tag("Sturgeon and paddlefish", 0.4, sub="more than half have glass in the gills"), cut=True, name="x-rays"),
    B(1, xray_scene(scan=(1.0, 1.0), zoom=(1.3, 1.6), pan=(120.0, 260.0)), serif("alive when the glass arrived", "alive", y=H * 0.86)),
    B(2, xray_scene(scan=(1.0, 1.0), zoom=(1.6, 1.5), pan=(260.0, 200.0))),
]
c8c = [
    B(0, amber_scene(light=(-0.6, -0.1), zoom=(1.0, 1.08), focus=(0.0, 0.4)), tag("Amber from the tree trunks", 0.5), cut=True, name="glass in amber"),
    B(1, amber_scene(light=(-0.1, 0.3), zoom=(1.08, 1.16), focus=(0.4, 0.7)), serif("still glass", "still", y=H * 0.88)),
    B(2, amber_scene(light=(0.3, 0.6), zoom=(1.16, 1.22), focus=(0.7, 1.0)), tag("Same chemistry as the crater's black glass", 0.4)),
]
c8d = [
    B(0, burial_scene(fill=(1.0, 1.0), zoom=(2.3, 2.6), center=(0.52, 0.64), rain=0.0, glint=0.5), cut=True, name="more proof"),
    B(1, burial_scene(fill=(1.0, 1.0), zoom=(2.6, 2.8), center=(0.52, 0.64), rain=0.0, glint=1.0), serif("a clock written in mud", "clock", y=H * 0.86)),
]
end1 = [B(0, amber_scene(light=(0.6, 0.0), zoom=(1.22, 1.3), focus=(1.0, 0.5)), serif("The sound came last.", "sound", y=H * 0.86), cut=True, name="the sound came last")]
next_ = [
    B(0, next_scene(t_fly=(0.0, 0.5)), tag("Next: Apophis", 0.4, sub="13 April 2029"), cut=True, name="next"),
    B(1, next_scene(t_fly=(0.5, 1.0)), tag("Closer than our geostationary satellites", 0.4, y=H - 140)),
]
outro = [B(0, riverbank(phase="dawn", view_az=(-30.0, -24.0), sun_alt=(5.0, 6.0)), None, cut=True, name="end card")]

BEATS = dict(open1=open1, open2=open2, open3=open3, c1a=c1a, c1b=c1b, c2a=c2a, c2b=c2b, c2c=c2c, c3a=c3a, c3b=c3b, c3c=c3c,
             c4a=c4a, c4b=c4b, c4c=c4c, c5d=c5d, c5a=c5a, c5b=c5b, c5c=c5c, c6a=c6a, c6b=c6b, c6c=c6c, c7a=c7a, c7b=c7b,
             c7c=c7c, c7d=c7d, c8a=c8a, c8b=c8b, c8c=c8c, c8d=c8d, end1=end1, next=next_, outro=outro)
