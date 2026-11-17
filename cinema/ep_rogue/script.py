"""
THE CALENDAR — a rogue planet crosses Earth's orbit

The episode as data (same format as ep_jupiter/script.py). Every number comes from ep_rogue/sim.py and
ep_rogue/model.py (python -m ep_rogue.model prints the fact sheet), and is checked by ep_rogue/claims.py.

The setup: a 5-Jupiter-mass rogue planet, 20 km/s far away, passes the Sun at exactly 1 AU, 4° from the
ecliptic, so its path crosses Earth's orbit. We ran the pass for every arrival day of the year in half-day steps
(730 runs; Sun, rogue, all eight planets, and the Moon). Only Earth's position on that day changes.

Key simulation outputs:
  fates over the year: 73.8 % year shifts ≤ ~11 days · 16.0 % shifts 11–147 days · 3.7 % scorched ·
                       3.2 % frozen · 3.3 % thrown out (an 11.5-day window, days −5 … +6.5)
  scorched (day −16): rogue passes behind Earth; new year 282 days; perihelion 0.707 AU (Venus 0.723);
                       2.0 × today's sunlight at perihelion, 1.43 × on average
  the Moon (day −11.5): passes 10.4 million km away (27 × the Moon's distance); perihelion 0.62 AU;
                       123 days later the Moon leaves Earth and orbits the Sun on its own (a = 0.77 AU)
  frozen (day +10):   rogue passes in front; year 986 days (2 yr 8 mo); aphelion 2.82 AU (asteroid belt);
                       1/8 sunlight at aphelion, 0.30 on average (Mars gets 0.43); < half today's for 808 days
  thrown out (day 0): closest 211,000 km (Roche limit 181,000 km); 39° wide in the sky; tidal pull 780,000 ×
                       the Moon's; leaves at 40 km/s; 18 AU from the Sun after 2 years (Uranus: 19.2 AU)
  edge of the window (day −4.25): thrown out, but the Moon stays with Earth
"""

TITLE = "A Rogue Planet Is Coming. The Date It Arrives Decides Everything."
FOLDER = "03_rogue_planet"

SEGMENTS = [
    # ─────────────────────────────── COLD OPEN (the promise inside 30 s; no title card) ───────────────────────────────
    dict(id="open1", music="open", shot=dict(type="space"),
         lines=["This is a planet with no star.",
                "Five times heavier than Jupiter, drifting alone through the dark.",
                "And it's heading into our Solar System, on a path that crosses Earth's orbit."],
         hold=0.2),
    dict(id="open2", music="reveal", shot=dict(type="diagram"),
         lines=["We simulated its pass seven hundred and thirty times, changing just one thing: the day it arrives.",
                "On most dates, Earth barely notices.",
                "On others, Earth is thrown out of the Solar System, forever.",
                "And on a handful of dates, something much stranger happens to the Moon."],
         hold=0.4, sfx=[dict(kind="boom", word="forever", gain=0.45)]),

    # ─────────────────────── CHAPTER 1 · NO STAR ───────────────────────
    dict(id="c1a", music="wonder", shot=dict(type="space"),
         # Rogue (free-floating) planets: ejected by planet–planet scattering; found by microlensing.
         lines=["Rogue planets are real.",
                "Planets are born around stars. But in a young solar system, giant planets can fling each other out, into interstellar space.",
                "We find them when one drifts in front of a distant star. Its gravity bends that star's light, and the star briefly gets brighter.",
                "One study in twenty twenty-three suggested our galaxy could hold more of these lonely planets than it has stars."],
         card=dict(kind="chapter", num="CHAPTER 1", text="No Star")),
    dict(id="c1b", shot=dict(type="space"),
         # WISE 0855−0714: 2.3 pc (7.4 ly), 3–10 Jupiter masses, ~250 K (Luhman 2014; Luhman & Esplin 2016).
         lines=["Ours, in this story, is five times the mass of Jupiter, and about the same size.",
                "Without a sun, it's dark. It glows only faintly, with the heat left over from when it formed.",
                "There's a real object like this just seven light-years away. It's called WISE zero eight five five.",
                "Its clouds are about as cold as a kitchen freezer.",
                "And NASA's Roman Space Telescope is designed to find hundreds more rogue planets like it."]),

    # ─────────────────────── CHAPTER 2 · THE WARNING ───────────────────────
    dict(id="c2a", music="tension", shot=dict(type="diagram"),
         # Reflected sunlight at ~1,000 AU ≈ mag 21 (albedo 0.5); Rubin/LSST single-visit limit ~24.5. 1,000 AU at 20 km/s ≈ 237 yr.
         lines=["We'd see ours coming, long before it got here.",
                "Once it's about a thousand times farther away than the Sun, sunlight glinting off it is enough for today's survey telescopes.",
                "At twenty kilometres per second, that's more than two hundred years of warning.",
                "Within weeks, astronomers would know its path. It passes the Sun at exactly Earth's distance, and crosses our orbit."],
         card=dict(kind="chapter", num="T – 237 YEARS", text="The Warning")),
    dict(id="c2d", music="wonder", shot=dict(type="space"),
         # model.magnitude(): naked eye (mag 6) ~7.5 yr before; brighter than Jupiter (−2.7) ~8 months; brighter than
         # Venus (−4.6) 4.5–5.5 months; disc > 1 arcmin ~4.5–6 months; on the worst date, wider than the full Moon 13 days before.
         lines=["What would it look like?",
                "About seven and a half years before it arrives, it becomes visible to the naked eye. A faint new star, creeping through the constellations.",
                "Eight months out, it's brighter than Jupiter.",
                "Five months out, it outshines Venus. After the Moon, it's the brightest thing in the night sky.",
                "In binoculars, it isn't a point any more. It's a tiny, banded disc.",
                "And on the worst dates, in the final two weeks, it grows wider than the full Moon."],
         card=dict(kind="chapter", num="T – 7 YEARS", text="The Approach")),
    dict(id="c2b", music="tension", shot=dict(type="space"),
         # 5 Jupiter masses = 1,589 Earth masses.
         lines=["And here's the problem.",
                "We can't push it aside. It's sixteen hundred times heavier than Earth.",
                "We can't move Earth out of the way, either.",
                "So everything comes down to one question. Where will Earth be, on the day it arrives?"],
         sfx=[dict(kind="bell", word="day", note="E5")]),
    dict(id="c2c", shot=dict(type="diagram"),
         # Earth's orbital speed 29.8 km/s → 2.57 million km per day.
         lines=["Earth moves about two and a half million kilometres along its orbit every day.",
                "So we ran the pass for every possible arrival date, in steps of half a day.",
                "Seven hundred and thirty runs. The Sun, the rogue, all eight planets, and the Moon, tracked all the way through.",
                "Here's what the calendar looks like."]),

    # ─────────────────────── CHAPTER 3 · THE CALENDAR ───────────────────────
    dict(id="c3a", music="reveal", shot=dict(type="diagram"),
         # year table: same 73.8 %, changed 16.0 %, scorched 3.7 %, frozen 3.2 %, ejected 3.3 %.
         lines=["On about three dates out of four, Earth stays almost where it is. The year gets a few days longer or shorter.",
                "On about one in six, the year changes by weeks, or months.",
                "But on roughly one date in ten, the world as we know it ends.",
                "There are three ways it can go. And which one we get is decided by a matter of days."],
         card=dict(kind="chapter", num="730 RUNS", text="The Calendar")),

    # ─────────────────────── CHAPTER 4 · CLOSER ───────────────────────
    dict(id="c4a", music="tension", shot=dict(type="diagram"),
         lines=["If it arrives about two weeks after Earth has gone by, it crosses our orbit behind us.",
                "Its gravity tugs Earth backwards. Earth slows down.",
                "And a planet that slows down falls closer to the Sun."],
         card=dict(kind="fate", num="FATE 1", text="Closer")),
    dict(id="c4b", shot=dict(type="diagram"),
         lines=["Earth settles onto a new, tighter orbit.",
                "A year now lasts two hundred and eighty-two days.",
                "At its closest, Earth swings in almost as far as Venus, and gets twice the sunlight it gets today.",
                "From the ground, the Sun looks forty percent wider than it does now."]),
    dict(id="c4c", shot=dict(type="space"),
         # Runaway-greenhouse limit ≈ 1.06–1.1 × today's sunlight (Kopparapu et al. 2013, 2014).
         lines=["Averaged over the year, that's more than forty percent extra sunlight.",
                "Climate models suggest that around ten percent extra would be enough to start a runaway greenhouse.",
                "The oceans would slowly boil off into space, the way scientists think they once did on Venus."]),

    # ─────────────────────── CHAPTER 5 · THE MOON ───────────────────────
    dict(id="c5a", music="wonder", shot=dict(type="diagram"),
         lines=["But move the arrival date by just four days, and something stranger happens.",
                "The rogue passes ten million kilometres from us. Twenty-seven times farther away than the Moon.",
                "That's not close enough to rip the Moon away. But it shakes the Moon's orbit loose."],
         card=dict(kind="fate", num="FATE 2", text="The Moon")),
    dict(id="c5b", shot=dict(type="diagram"),
         lines=["Earth falls onto an even tighter orbit. At its closest, it swings in nearer to the Sun than Venus.",
                "For four months, nothing seems wrong.",
                "Then, a hundred and twenty-three days after the pass, the Sun's gravity pulls the Moon away from Earth."],
         hold=0.4, sfx=[dict(kind="bell", word="away", note="B4")]),
    dict(id="c5c", shot=dict(type="space"),
         lines=["The Moon becomes a planet.",
                "It goes around the Sun on its own now, on an orbit close to ours.",
                "No more months. No more eclipses of the Moon. Nights without a Moon, for good.",
                "The tides wouldn't stop. The Sun raises tides too, and on this tighter orbit, at times, even bigger ones than today's."]),
    dict(id="c5d", shot=dict(type="diagram"),
         # Depends on where the Moon is in its orbit at the pass: on some of these dates it stays.
         lines=["The strangest part is who did it.",
                "It wasn't the rogue that stole the Moon. It was the Sun.",
                "The rogue only loosened it, from ten million kilometres away.",
                "And it's a coin toss. On these dates, whether we keep the Moon depends on where it happens to be in its orbit as the rogue goes by."]),

    # ─────────────────────── CHAPTER 6 · FARTHER ───────────────────────
    dict(id="c6a", music="dread", shot=dict(type="diagram"),
         lines=["Now let it arrive a week or two before Earth gets there, so it crosses our orbit in front of us.",
                "Its gravity pulls Earth forwards. Earth speeds up, and swings outward."],
         card=dict(kind="fate", num="FATE 3", text="Farther")),
    dict(id="c6b", shot=dict(type="diagram"),
         lines=["The new orbit is long and stretched. One year now lasts two years and eight months.",
                "At its farthest, Earth is out past Mars, in the asteroid belt, almost three times farther from the Sun than today.",
                "Out there, the Sun looks a third as wide as it does today, and its light is an eighth as strong."]),
    dict(id="c6c", shot=dict(type="space"),
         # Mean flux 0.30 vs Mars 0.43; flux < 0.5 for 808 of 986 days; perihelion flux 0.90.
         lines=["Averaged over that long year, Earth gets less sunlight than Mars does today.",
                "For more than two years of every orbit, it gets less than half of today's sunlight.",
                "The oceans freeze over from the top down. And even at its closest to the Sun, Earth never warms up as much as it does now.",
                "Every two years and eight months, it swings back in for about six months of weak sunlight. Then it heads out into the cold again."]),

    # ─────────────────────── CHAPTER 7 · THROWN OUT ───────────────────────
    dict(id="c7a", music="impact", shot=dict(type="diagram"),
         lines=["And then there's the window in the middle.",
                "Eleven and a half days in the calendar. If the rogue arrives inside them, it passes so close to Earth that there's no saving us."],
         card=dict(kind="fate", num="FATE 4", text="Thrown Out")),
    dict(id="c7b", shot=dict(type="space"),
         # Closest 211,000 km; 39° wide; 39/0.52 ≈ 75 full Moons; tide 780,000 × the Moon's.
         lines=["On the worst day, it misses us by two hundred and eleven thousand kilometres. Closer than the Moon.",
                "In our sky, it would be almost forty degrees wide. Seventy-five full Moons, side by side.",
                "Its tidal pull would be nearly eight hundred thousand times stronger than the Moon's."]),
    dict(id="c7c", shot=dict(type="space"),
         # Fluid Roche limit 181,000 km.
         lines=["That's just thirty thousand kilometres outside the distance where its tides would tear a liquid planet apart.",
                "For a few hours, the oceans, the rock and the air are all pulled towards it.",
                "Then it slingshots Earth out of the Solar System.",
                "The whole encounter, from first tug to final fling, is over in about two weeks."],
         sfx=[dict(kind="boom", word="slingshots", gain=0.5)]),
    dict(id="c7d", shot=dict(type="diagram"),
         # Leaves at 40 km/s (today's orbital speed: 29.8 km/s); 18 AU after 2 years (Uranus 19.2 AU).
         lines=["Earth leaves at forty kilometres per second, faster than it has ever moved around the Sun.",
                "The Moon is flung away on a path of its own.",
                "Two years later, Earth is almost as far out as Uranus, and the Sun is just a dazzling star."]),
    dict(id="c7e", shot=dict(type="space"),
         lines=["The oceans freeze over. Only deep below the ice, around volcanic vents on the sea floor, could life carry on in the dark.",
                "On a few dates at the very edge of the window, we'd at least keep the Moon.",
                "Earth and Moon would leave together. Two travellers, with no sun.",
                "Days and nights would still come and go, as the Earth turned. The sky would simply stay black."],
         hold=0.6),

    # ─────────────────────── CHAPTER 8 · SHOULD YOU WORRY? ───────────────────────
    dict(id="c8a", music="resolve", shot=dict(type="diagram"),
         # Rate ≈ n·π·b²·(1 + v_esc²/v²)·v with n ≈ 0.025 pc⁻³ (≤ 0.25 Jupiter-mass rogues per star, Mróz et al. 2017),
         # b = 1 AU, v = 20 km/s → ~1 per 5×10^15 yr ≈ 350,000 × the age of the universe. Order of magnitude.
         lines=["So, should you worry?",
                "For a planet like this to pass this close to the Sun, you'd expect to wait hundreds of thousands of times longer than the universe has existed.",
                "In four and a half billion years, it has almost certainly never happened to us."],
         card=dict(kind="chapter", num="THE ODDS", text="Should You Worry?")),
    dict(id="c8b", shot=dict(type="space"),
         lines=["But it's a strange thing to learn about our planet.",
                "Everything we know depends on where Earth is, on a single day.",
                "Astronomers would know that date more than two hundred years ahead. And they'd know exactly what it meant.",
                "Eleven and a half days on the calendar are all that separate an ordinary year from a journey into the dark that never ends."],
         hold=0.4),
    dict(id="end3", music="last", shot=dict(type="space"),
         lines=["Next time, something does hit us.",
                "Sixty-six million years ago, an asteroid wider than a city struck the Earth. We'll go through what happened next, minute by minute."],
         gap=0.5, hold=1.0),
    dict(id="outro", shot=dict(type="space"),
         lines=["Subscribe, and we'll turn the next dial together."],
         hold=3.5, card=dict(kind="endcard")),
]

META = dict(
    slot=3, next_slot=4, next_teaser_keywords=["asteroid", "minute"],    # EPISODES.md: #4 is the dinosaur asteroid
    promise_at=("open1", "planet"),        # the rogue planet is on screen, approaching, from the first line
    first_chapter="A planet with no star",
    extra_chapters={},
    thumb_text="11 DAYS",
    alts=["A Rogue Planet Crosses Earth's Orbit. We Ran It 730 Times.",
          "This Rogue Planet Steals the Moon. On Some Dates, It Takes Earth."],
    tags="rogue planet, rogue planet earth, rogue planet solar system, free floating planet, planet without a star, earth ejected, moon stolen, n-body simulation, space simulation, wise 0855, microlensing, space documentary, astronomy, astrophysics, space, science explained, gravity dial",
    pinned="We ran the pass 730 times. 1 date in 10 ends the world as we know it — and on a few, the Sun steals the Moon. Which fate would you rather live through: Closer, Farther, or Thrown Out?",
    playlist="Gravity Dial: The Universe, Simulated",
    hashtags="#space #rogueplanet #simulation #astronomy #science",
    intro="""A planet five times heavier than Jupiter, with no star of its own, crosses Earth's orbit. What happens to us? It depends on one thing: where Earth is on the day it arrives.

We simulated the pass 730 times — every arrival date of the year in half-day steps, with the Sun, all eight planets and the Moon. On 3 dates in 4, Earth's year shifts by a few days. On about 1 in 10, the world as we know it ends: Earth is pulled in toward the Sun, flung out past Mars, or thrown out of the Solar System entirely. And on a few dates, the Sun steals the Moon.

Which fate do you think is worst? Tell us in the comments.""",
    sources="""• Rogue (free-floating) planets found by gravitational microlensing; possibly more numerous than stars: Sumi et al. 2023, AJ 166, 108; Mróz et al. 2017, Nature 548, 183 (≤ 0.25 Jupiter-mass rogues per star)
• Planet–planet scattering ejects giant planets from young systems: e.g. Chatterjee et al. 2008, ApJ 686, 580
• WISE 0855−0714 (7.4 light-years, 3–10 Jupiter masses, ~250 K): Luhman 2014, ApJL 786, L18; Luhman & Esplin 2016, AJ 152, 78
• Runaway-greenhouse limit ~1.06–1.1 × today's sunlight: Kopparapu et al. 2013, ApJ 765, 131; Kopparapu et al. 2014, ApJL 787, L29
• Vera C. Rubin Observatory LSST single-visit depth ~24.5 mag: Ivezić et al. 2019, ApJ 873, 111
• Simulation: 5 Jupiter masses, 20 km/s far away, closest approach to the Sun 1.00 AU, 4° from the ecliptic; Sun and rogue fully interacting, planets and Moon as test particles (DOP853, rtol 1e-10/1e-11). 730 runs, one per half-day of arrival date. Where the Moon is in its orbit at the pass also matters on some dates.
• Encounter rate: n·π·b²·(1 + v_esc²/v²)·v with n ≈ 0.025 pc⁻³ → ~1 pass within 1 AU per ~5×10^15 years. Order-of-magnitude estimate.""",
)
