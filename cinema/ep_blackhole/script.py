"""
THE DARK PASSAGE — "What If a Black Hole Passed Through Our Solar System?"

The episode as data. Each segment is one continuous shot with narration.
  shot:   which renderer to use + its parameters (see cinema/engine/shots.py)
  lines:  narration, one TTS call per line. Numbers are spelled out for the voice.
  gap:    silence (s) after each line (default 0.32). "hold" adds silence after the segment.
  card:   on-screen typography (chapter titles, numbers) layered over the shot.
  music:  score cue that starts at this segment.

Science notes (for the description / fact-check) live next to the lines that use them.
"""

TITLE = "What If a Black Hole Passed Through Our Solar System?"
FOLDER = "01_black_hole"

SEGMENTS = [
    # ─────────────────────────────── COLD OPEN ───────────────────────────────
    dict(id="open1", music="open",
         shot=dict(type="ground", time="night", flare=[dict(star=0, t0=0.15, t1=0.9)], push=0.06, figure=True),
         lines=["Tonight, on a mountain in Chile, a telescope notices that one ordinary star is getting brighter.",
                "Nothing is exploding. Nothing is burning.",
                "The star is just... brighter."],
         hold=0.4),
    dict(id="open2",
         shot=dict(type="ground", time="night", flare=[dict(star=0, t0=-1, t1=0.1), dict(star=1, t0=0.05, t1=0.45), dict(star=2, t0=0.4, t1=0.8), dict(star=3, t0=0.72, t1=1.1)], push=0.05, figure=True, trail=True),
         lines=["A few weeks later, the star next to it does the same thing.",
                "Then the one after that.",
                "Something is moving across the sky, and everything behind it lights up as it passes."]),
    dict(id="open3", music="reveal",
         shot=dict(type="lens", zoom=(1.0, 1.35), drift=(0.10, 0.0), mass=(0.6, 1.0)),
         lines=["It isn't a planet. It isn't a comet. It gives off no light at all.",
                "It's a black hole.",
                "Ten times the mass of the Sun, crushed into a ball sixty kilometres wide."],
         card=dict(kind="stat", at=0.62, big="10 SUNS", small="60 KM ACROSS")),
    dict(id="open4",
         shot=dict(type="lens", zoom=(1.35, 1.6), drift=(0.0, 0.04), mass=(1.0, 1.15), earth=True),
         lines=["And it's heading for us.",
                "This is what the next thirty years would look like.",
                "At the end, there are three ways it can go.",
                "The most likely one is the strangest."],
         hold=0.3),
    dict(id="title", music="title",
         shot=dict(type="lens", zoom=(1.6, 1.75), drift=(0.02, 0.0), mass=(1.15, 1.2), dim=0.35),
         lines=[], dur=4.2,
         card=dict(kind="title", text="THE DARK PASSAGE", sub="A black hole crosses the Solar System")),

    # ─────────────────────── CHAPTER 1 · T–30 YEARS ───────────────────────
    dict(id="c1a", music="wonder",
         shot=dict(type="lens", zoom=(0.9, 1.05), drift=(-0.12, 0.02), mass=(0.9, 0.9), sweep=True),
         lines=["First, how do you find something that doesn't shine?",
                "You can't see a black hole. You can only see what it does to light.",
                "Its gravity bends the light of every star behind it, like a lens made of nothing.",
                "When it slides in front of a star, it focuses that star's light toward us. And the star flares."],
         card=dict(kind="chapter", num="T – 30 YEARS", text="The Invisible Thing")),
    dict(id="c1b",
         shot=dict(type="galaxy", focus="ogle", zoom=(1.0, 2.2)),
         # OGLE-2011-BLG-0462: first isolated stellar-mass black hole, confirmed 2022 (Sahu et al., Lam et al.).
         # ~7 solar masses, ~5,000 light-years, ~45 km/s.
         lines=["This isn't made up.",
                "In twenty twenty-two, astronomers confirmed the first black hole ever found drifting alone through our galaxy, exactly this way.",
                "A distant star brightened for months. The thing doing it was invisible.",
                "It's about five thousand light-years away, moving at forty-five kilometres per second."],
         card=dict(kind="tag", at=0.25, text="OGLE-2011-BLG-0462", sub="first lone black hole · confirmed 2022")),
    dict(id="c1c",
         shot=dict(type="system", view="far", t=(-32.0, -30.0), scale=(380, 330), label_bh=True),
         # 300 AU at ~45 km/s (9.5 AU/yr), accelerating as it falls in → ~30 years.
         lines=["Ours, in this story, is moving at that same speed. But it's only three hundred times farther from the Sun than we are.",
                "Do the maths, and you get your countdown.",
                "About thirty years.",
                "Astronomers would know the path within weeks. You'd find out on the news. Probably on a Tuesday."],
         card=dict(kind="stat", at=0.45, big="≈ 30 YEARS", small="UNTIL CLOSEST APPROACH")),

    dict(id="c1d",
         shot=dict(type="system", view="far", t=(-29.5, -27.0), scale=(60, 48)),
         lines=["One more thing before we go on.",
                "Every orbit you'll see in this video comes from a real gravity simulation, run for this story. Ten solar masses, forty-five kilometres per second, passing the Sun at roughly Earth's distance.",
                "We didn't choose what happens to the planets. The maths did."]),

    # ─────────────────────── CHAPTER 1b · T–29 YEARS ───────────────────────
    dict(id="w1", music="dread",
         shot=dict(type="lens", zoom=(1.0, 1.2), drift=(0.06, -0.03), mass=(0.9, 1.0)),
         lines=["So what would we do with thirty years?",
                "You can't push a black hole. Every rocket ever built, fired at once, wouldn't move it in any way you could measure.",
                "You can't move the Earth either.",
                "And there's nowhere to run. Mars, the Moon, every world we could reach sits in the same path."],
         card=dict(kind="chapter", num="T – 29 YEARS", text="What Would We Do?")),
    dict(id="w2",
         shot=dict(type="earth", zoom=(1.0, 1.08), night=1.0, nightside=True),
         lines=["So the plan would be the oldest one we have. Dig.",
                "Shelters deep underground, sealed, and run on nuclear and geothermal power. Seed vaults. Libraries. Thirty years to build the deepest refuges in history.",
                "And the strangest part is how normal most of those years would feel."]),

    # ─────────────────────── CHAPTER 2 · T–30 MONTHS ───────────────────────
    dict(id="c2a", music="quiet",
         shot=dict(type="ground", time="dusk", push=0.04, figure=True, city=True),
         lines=["Because for most of those years, nothing happens. That's the cruel part.",
                "The sky looks normal. The seasons come and go.",
                "Then, about two and a half years out, the black hole reaches the planets."],
         card=dict(kind="chapter", num="T – 30 MONTHS", text="The Edge Starts to Move")),
    dict(id="c2b",
         shot=dict(type="planet", body="neptune", lens=True, path=((1.25, -0.2), (-0.25, 0.25)), zoom=(1.0, 1.12)),
         lines=["Neptune goes first.",
                "It has circled the Sun on the same path for billions of years.",
                "Now something ten times heavier than the Sun is pulling on it from the dark.",
                "Its orbit stretches. Then it breaks.",
                "Neptune is thrown out of the Solar System, and nobody on Earth feels a thing."]),
    dict(id="c2c",
         shot=dict(type="system", view="outer", t=(-2.9, -1.6), scale=(48, 40), scatter=True),
         lines=["Beyond Neptune, billions of icy bodies are scattered like gravel.",
                "Some are flung into deep space. Some are aimed inward, though they'd take decades to arrive.",
                "They are the least of our problems."]),

    # ─────────────────────── CHAPTER 3 · T–7 MONTHS ───────────────────────
    dict(id="c3s", music="tension",
         shot=dict(type="planet", body="saturn", lens=True, path=((1.2, 0.25), (0.62, -0.05)), zoom=(1.0, 1.1)),
         # Saturn's Hill radius w.r.t. a 10 Msun BH at ~1 AU ≈ 3 million km; the rings end ~140,000 km out.
         lines=["Seven months out, it crosses the orbit of Saturn.",
                "Here's something you might not expect. Saturn's rings survive.",
                "They sit so close to the planet that even a black hole can't peel them away. Saturn is simply carried off, rings and all."],
         card=dict(kind="chapter", num="T – 7 MONTHS", text="The Giants Lose Their Grip")),
    dict(id="c3a",
         shot=dict(type="planet", body="jupiter", lens=True, path=((-0.3, 0.15), (1.2, -0.05)), zoom=(1.05, 1.2)),
         # Jupiter passes ~0.165 AU from the BH: Hill radius ≈ 0.78 million km → Ganymede (1.07M km) and Callisto (1.88M km) are stripped.
         lines=["Four months later, it reaches Jupiter.",
                "Jupiter is the heaviest thing in the Solar System after the Sun. It doesn't matter.",
                "It keeps its closest moons. But Ganymede, the largest moon in the Solar System, is pulled away and never comes back."]),
    dict(id="c3b",
         shot=dict(type="ground", time="night", push=0.05, figure=True, jupiter=True, binoc=(0.55, 1.0)),
         # Einstein radius of 10 Msun at ~5 AU ≈ 1 arcmin, about 1/30 of the Moon's width.
         lines=["From your back garden, this is when it becomes real.",
                "Jupiter, a bright point you've seen your whole life, starts wandering across the sky in a way it never has.",
                "And if you knew exactly where to look, through binoculars, you could see the black hole itself.",
                "Or rather, the hole it makes. A tiny ring where the stars are smeared out, about a thirtieth the width of the Moon, crawling through the constellations."]),

    # ─────────────────────── CHAPTER 4 · T–30 DAYS ───────────────────────
    dict(id="c4a", music="pulse",
         shot=dict(type="earth", lens=(0.87, 0.27), lens_r=(0.03, 0.055), zoom=(1.0, 1.1), night=0.6),
         # Sim: BH ~2.3 AU from the Sun at T–30 d: 10/2.3² ≈ 1.9 > 1 — it already out-pulls the Sun.
         lines=["Thirty days out, the black hole is still more than twice as far from us as the Sun is.",
                "But it's ten times heavier. So it's already pulling on Earth harder than the Sun does.",
                "Earth is being tugged two ways. And the Sun is losing."],
         card=dict(kind="chapter", num="T – 30 DAYS", text="Earth Feels It")),
    dict(id="c4b",
         shot=dict(type="tide", rise=(0.0, 1.0)),
         # Sim: Earth passes ~0.39 AU from the BH. Tide ∝ M/d³ → ~100x the Moon's; equilibrium lunar tide ≈ 0.36 m → tens of metres.
         lines=["The first thing you'd notice is the sea.",
                "Tides normally come from the Moon. Now they come from something much heavier.",
                "A metre higher. Then five.",
                "In the last days before the closest pass, the tides are dozens of metres high, twice a day, on every coastline on Earth."]),
    dict(id="c4c",
         shot=dict(type="sun", transit=(0.1, 0.9)),
         lines=["And from somewhere on Earth, the black hole slides in front of the Sun.",
                "Through eclipse glasses, you'd see a tiny warped circle crawling across its face.",
                "A lens, bending sunlight around nothing."]),
    dict(id="c4d", music="impact",
         shot=dict(type="system", view="inner", t=(-0.09, 0.0), scale=(3.4, 2.6), follow="sun"),
         lines=["Then comes the closest pass.",
                "It's over in days. The black hole swings by at well over a hundred kilometres per second.",
                "And it takes Earth's orbit with it."]),
    dict(id="c4e",
         shot=dict(type="moon"),
         # Earth passes ~0.39 AU from the BH: Earth's Hill radius ≈ 270,000 km < Moon's 384,000 km orbit.
         lines=["It takes something else, too.",
                "At that distance, Earth's gravity can no longer hold on to the Moon.",
                "After four and a half billion years, the Moon drifts away from us for good."],
         hold=0.5),
    dict(id="c4f",
         shot=dict(type="system", view="inner", t=(0.0, 0.55), scale=(3.6, 5.0), follow="bh"),
         lines=["And the black hole doesn't leave empty-handed.",
                "In our simulation, it captures Venus. A whole planet, now circling a black hole, carried off into the dark.",
                "As for us, what happens next depends on a few hundred thousand kilometres, here or there.",
                "So there are three endings."],
         hold=0.6),

    # ─────────────────────── FATE 1 · THE FALL ───────────────────────
    dict(id="f1a", music="fall",
         shot=dict(type="spaghetti", phase=(0.0, 0.45)),
         # Tidal disruption of Earth by 10 Msun: r ≈ R_E (2M/m)^(1/3) ≈ 1.2 million km.
         lines=["The rarest ending. Earth falls in.",
                "Not straight in. Nothing falls straight into a black hole.",
                "About a million kilometres out, the pull on Earth's near side beats the pull on its far side by so much that the planet comes apart."],
         card=dict(kind="fate", num="ENDING 1", text="The Fall")),
    dict(id="f1b",
         shot=dict(type="spaghetti", phase=(0.45, 1.0)),
         lines=["Oceans. Crust. Mantle. The iron core.",
                "All of it unwound into a long glowing stream, wrapping around the black hole like thread around a spool.",
                "As it spirals in, it heats up to millions of degrees.",
                "The last thing Earth ever does is shine.",
                "But a black hole is a very small target. So this is the least likely ending."]),

    # ─────────────────────── FATE 2 · THE LONG YEAR ───────────────────────
    dict(id="f2a", music="ache",
         shot=dict(type="orbit", ecc=(0.0, 0.62)),
         lines=["In the second ending, Earth stays with the Sun. But not on the path it had.",
                "Our orbit today is almost a perfect circle. Stretch it into a long oval, and the year changes completely."],
         card=dict(kind="fate", num="ENDING 2", text="The Long Year")),
    dict(id="f2b",
         shot=dict(type="earth", seasons=True, zoom=(1.05, 1.15)),
         lines=["Summer comes when Earth swings in close. The seas steam into a thick, scalding sky.",
                "Then months later, out on the far end of the oval, a winter colder than Antarctica. Everywhere at once.",
                "Some people might survive this. Underground, in the right places, for a while.",
                "This is the lucky ending."]),

    # ─────────────────────── FATE 3 · THE WANDERER ───────────────────────
    dict(id="f3a", music="drift",
         shot=dict(type="leave", t=(0.0, 1.0)),
         lines=["But the most likely ending is the third one.",
                "The black hole throws Earth out of the Solar System entirely.",
                "We leave the Sun behind at tens of kilometres per second.",
                "Within a year, it gives us about a fiftieth of the light it does today. Within decades, it's just the brightest star in the sky."],
         card=dict(kind="fate", num="ENDING 3", text="The Wanderer")),
    dict(id="f3b",
         shot=dict(type="earth", freeze=(0.0, 1.0), zoom=(1.0, 1.12), dark=True),
         lines=["The oceans freeze over. The lights of the cities go out, one by one.",
                "Over the following centuries, it gets colder than anywhere on Earth has ever been."]),
    dict(id="f3c",
         shot=dict(type="ice", snow=(0.0, 1.0)),
         # N2 condenses at ~77 K at 1 atm; geothermal flux alone sustains only ~35–40 K at the surface.
         lines=["Cold enough that the air itself freezes,",
                "and falls to the ground as snow."],
         hold=0.8),
    dict(id="f3d", music="hope",
         shot=dict(type="vent"),
         # Abbot & Switzer (2011), "The Steppenwolf": an ejected Earth-like planet can keep a liquid ocean under ice from internal heat.
         lines=["And yet.",
                "Under kilometres of ice, the deep ocean doesn't freeze. Heat from Earth's own core keeps it liquid.",
                "Down there, at volcanic vents on the sea floor, there are creatures that have never seen sunlight. They don't need it.",
                "They would carry on in the dark, on a planet drifting between the stars, for billions of years."]),
    dict(id="f3e",
         shot=dict(type="galaxy", focus="rogues", zoom=(2.0, 1.0)),
         # Sumi et al. (2023), MOA microlensing: free-floating planets may outnumber stars by ~20 to 1.
         lines=["Planets like that might not even be rare.",
                "Astronomers now think there may be more planets drifting alone through our galaxy than there are stars."]),

    # ─────────────────────────────── ENDING ───────────────────────────────
    dict(id="end1", music="resolve",
         shot=dict(type="galaxy", focus="blackholes", zoom=(1.0, 1.25)),
         # ~10^8 stellar black holes in the Milky Way (standard estimate). Gaia BH1: ~1,560 ly (El-Badry et al. 2022).
         lines=["So, should you worry?",
                "Our galaxy probably holds around a hundred million black holes. We've found a few dozen.",
                "The closest one we know of is about one thousand five hundred and sixty light-years away. And it isn't coming here."],
         card=dict(kind="tag", at=0.62, text="GAIA BH1", sub="nearest known black hole · ~1,560 light-years")),
    dict(id="end2",
         shot=dict(type="lens", zoom=(1.2, 1.0), drift=(0.05, 0.0), mass=(0.8, 0.8), dim=0.15),
         # Encounter rate n·π·b²·v with n≈2e-4 pc^-3, b=1 AU, v=45 km/s, gravitational focusing ×~10 → ~1e17 yr.
         lines=["For a black hole to pass this close to the Sun, you'd expect to wait something like a hundred quadrillion years.",
                "Millions of times longer than the universe has existed."],
         card=dict(kind="stat", at=0.5, big="10¹⁷ YEARS", small="TYPICAL WAIT FOR A PASS THIS CLOSE")),
    dict(id="end3", music="last",
         shot=dict(type="ground", time="night", push=0.07, figure=True, flare=[dict(star=0, t0=0.55, t1=1.4)]),
         lines=["So tonight, if a star looks a little brighter than it should...",
                "it's almost certainly nothing.",
                "Almost."],
         gap=0.7, hold=1.4),
    dict(id="outro",
         shot=dict(type="ground", time="night", push=0.02, figure=True, dim=0.55),
         lines=["There's a lot more out there in the dark. Subscribe, and we'll keep looking."],
         hold=3.5, card=dict(kind="endcard")),
]


META = dict(
    first_chapter="A star gets brighter",
    extra_chapters={"end1": "Should you worry?"},
    thumb_text="30 YEARS LEFT",
    alts=["A Black Hole Is Coming. Here's Every Year Until It Arrives.",
        "We Simulated a Black Hole Passing Through the Solar System",
        "What If a Black Hole Passed Through Our Solar System?"],
    tags="black hole, what if, black hole solar system, rogue black hole, space documentary, astronomy, n-body simulation, earth, end of the world, science explained",
    hashtags="#space #blackhole #whatif #astronomy #science",
    intro="""What would happen if a black hole ten times heavier than the Sun crossed our Solar System? Not a disaster movie — the actual physics, year by year, from the first flickering star to the three ways it could end.

Every orbit in this video comes from a real N-body gravity simulation run for this story (10 solar masses, 45 km/s, passing the Sun at ~1 AU). In that simulation every planet is thrown out of the Solar System, the Moon is pulled away from Earth, and the black hole leaves carrying Venus.

Which ending do you think is worst? Tell us in the comments.""",
    sources="""• First isolated stellar-mass black hole, found by microlensing (OGLE-2011-BLG-0462): Sahu et al. 2022, ApJ 933, 83; Lam et al. 2022, ApJL 933, L23
• Nearest known black hole, Gaia BH1 (~1,560 light-years): El-Badry et al. 2023, MNRAS 518, 1057
• Free-floating planets may outnumber stars: Sumi et al. 2023, AJ 166, 108
• A planet ejected into interstellar space can keep a liquid ocean under ice: Abbot & Switzer 2011, ApJL 735, L27 ("The Steppenwolf")
• ~100 million stellar black holes in the Milky Way: standard population estimate (e.g. Olejak et al. 2020, A&A 638, A94)
• Hill-sphere estimates (Moon, Ganymede, Saturn's rings), tidal-disruption radius and tide scaling: computed from the simulation's closest-approach distances.
• Encounter rate: n·π·b²·v with gravitational focusing → ~10^17 years for a pass within 1 AU. Order-of-magnitude estimate.""",
)
