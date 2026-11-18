"""
THE RIVERBANK — the first two hours after the dinosaur asteroid, as they reached one place 3,050 km away

The episode as data (same format as the earlier episodes). Every timing comes from ep_tanis/model.py
(python -m ep_tanis.model prints it) and is checked in ep_tanis/claims.py. The creative brief is BRIEF.md.

The place: Tanis, Hell Creek Formation, North Dakota, ~3,050 km from the centre of Chicxulub (DePalma et al. 2019).
Unity of place: the camera never leaves this river until the epilogue, 66 million years later, at the same spot.
Narrator: third person, present tense, never "you".

Arrival clock at Tanis (model.py):
  light of the impact      10 ms, but the crater is below the horizon (the plume must climb > 807 km to be seen)
  P wave                   5.8 min   (paper: 6)        S wave        10.5 min (paper: 10)
  Rayleigh (surface) wave 13.0 min   (paper: 13)
  glass overhead (re-entry streaks)   12.3–24.7 min for launch angles 30–60° (paper: 13–25), 16.7 at 45°
  glass on the water       1.4 mm: 54 min · 1.0 mm: 71 min · 0.7 mm: 103 min (single beads in still air)
  sky heating              peak ~6 kW/m² ≈ 6 × midday sunlight, above sunlight ~25 min (Goldin & Melosh 2009)
  the sound                2 h 32 min (3,050 km at 335 m/s)
  a tsunami from the Gulf  ≥ 18 h, if it could get here at all (paper's SI)
"""

TITLE = "These Fish Saw the First Hour After the Dinosaur Asteroid. Here's Every Minute."
FOLDER = "04_tanis"

SEGMENTS = [
    # ───────────── COLD OPEN: the evidence, then the promise (inside 30 s, no title card) ─────────────
    dict(id="open1", music="riverdawn", shot=dict(type="river"),
         lines=["A paddlefish is feeding in a river, in a place that will one day be called North Dakota.",
                "It swims with its mouth wide open, sieving the water for food.",
                "This morning, the water is full of glass."],
         hold=0.3),
    dict(id="open2", music="riverdawn", shot=dict(type="evidence"),
         lines=["Sixty-six million years later, scientists dug this fish out of the rock, with the glass still caught in its gills.",
                "That glass was melted out of the ground in Mexico, three thousand kilometres away, by the asteroid that ended the age of the dinosaurs.",
                "So how did it get here so fast?"],
         hold=0.3),
    dict(id="open3", music="riverdawn", shot=dict(type="slice"),
         lines=["We followed the physics to this one riverbank, minute by minute.",
                "And here, at this distance, the end of the world arrives in a very strange order."],
         hold=0.6, sfx=[dict(kind="tick", word="order")]),

    # ───────────── MINUTE 0 · a spring morning ─────────────
    dict(id="c1a", music="riverdawn", shot=dict(type="bank"),
         # Spring: During et al. 2022 (Nature) and DePalma et al. 2021 (Sci. Rep.), from fish-bone growth lines.
         lines=["It's probably spring. Growth lines in the bones of these fish show they died in the season of plenty.",
                "The river winds through a warm forest of flowering trees and conifers. Sturgeon and paddlefish cruise the channel.",
                "A paddlefish's long, flat snout is covered in sensors that feel the faint electric fields of its prey. Nothing in its world has ever needed it to sense what is about to happen.",
                "Then, far to the south, beyond the curve of the planet, a rock the size of a mountain slams into a shallow sea at many kilometres per second."],
         hold=0.2),
    dict(id="c1b", music="hush", shot=dict(type="bank"),
         lines=["And at the river, nothing happens.",
                "The light of the blast gets here in a hundredth of a second. But the planet itself is in the way.",
                "Three thousand kilometres of curved Earth stand between this river and the crater."],
         hold=0.5),

    # ───────────── MINUTE 2 · a light in the south ─────────────
    dict(id="c2a", music="hush", shot=dict(type="slice"),
         lines=["To be seen from here, anything rising from the crater has to climb more than eight hundred kilometres, above the curve.",
                "The fireball does it in a minute or two."],
         hold=0.2),
    dict(id="c2b", music="hush", shot=dict(type="bank"),
         lines=["A glow climbs over the southern horizon, silently, like a second dawn in the wrong place.",
                "The fish notice nothing. Neither does anything else. There is no sound at all."],
         hold=0.6),

    dict(id="c2c", music="hush", shot=dict(type="slice"),
         # Morgan et al. 2016 (Science 354, 878): the central uplift overshoots and collapses within minutes into a peak ring.
         # Range et al. 2022 (AGU Advances): ~1.5 km wave about 10 minutes after impact.
         lines=["At the crater, the rock itself is flowing like liquid. The floor rebounds into a peak taller than Everest, then collapses again, all within minutes.",
                "A wave more than a kilometre high is spreading out across the Gulf of Mexico.",
                "None of that can reach the river yet. But something else is already on its way, underground."],
         hold=0.3),

    # ───────────── MINUTE 6 · the ground arrives ─────────────
    dict(id="c3a", music="tremor", shot=dict(type="slice"),
         lines=["The first thing to physically reach the river comes through the rock.",
                "The impact has rung the whole planet like a bell. Its waves dive deep into the mantle, where rock carries them fastest, and curve back up."],
         hold=0.2),
    dict(id="c3b", music="tremor", shot=dict(type="bank"),
         lines=["At five minutes and forty-seven seconds, the first wave arrives. A sharp jolt from below.",
                "At ten and a half minutes, the second. The ground starts to throw itself sideways.",
                "And at thirteen minutes, the slowest waves, rolling along the surface itself."],
         hold=0.2, sfx=[dict(kind="jolt", word="jolt"), dict(kind="quake", word="sideways"), dict(kind="roll", word="rolling")]),
    dict(id="c3c", music="tremor", shot=dict(type="bank"),
         # Mw ~10–11.5 (DePalma 2019, refs 44–45). Tohoku 2011 (Mw ~9.1) made 1.5 m seiches in Norway, 8,000 km away.
         lines=["This is an earthquake bigger than any ever measured.",
                "In twenty eleven, a far smaller one in Japan set water sloshing in Norwegian fjords eight thousand kilometres away.",
                "Here, the whole river begins to rock back and forth in its bed, like water in a bathtub."],
         hold=0.4),

    # ───────────── MINUTE 12 · shooting stars ─────────────
    dict(id="c4a", music="glassrain", shot=dict(type="slice"),
         lines=["Meanwhile, the crater has thrown molten rock into space.",
                "Droplets of it, launched at five kilometres per second, fly hundreds of kilometres above the planet, on arcs like thrown stones.",
                "The ones aimed at this river come back down twelve to twenty-five minutes after the impact."],
         hold=0.2),
    dict(id="c4b", music="glassrain", shot=dict(type="sky"),
         lines=["They hit the top of the air at about five kilometres per second.",
                "Each one becomes a shooting star. Then thousands. Then too many to count, across the whole sky, in broad daylight."],
         hold=0.3),
    dict(id="c4c", music="glassrain", shot=dict(type="bank"),
         # Goldin & Melosh 2009: peak ~6 kW/m², above normal sunlight for ~25 min. Melosh 1990: far higher; still debated.
         lines=["All that friction heats the air. For about half an hour, the sky itself pours down more heat than the midday Sun. At its peak, several times more.",
                "How hot exactly is still argued over. Enough, at least, to scorch anything caught in the open."],
         hold=0.5),

    dict(id="c5d", music="glassrain", shot=dict(type="sky"),
         # DePalma 2019: shocked quartz from the warm fireball, launched 70–79°, reaches the sky over Tanis from ~38 min.
         lines=["Higher up, a second, finer fallout is on its way, from the hottest part of the fireball, thrown up almost vertically.",
                "It starts arriving over the river about thirty-eight minutes in. It carries grains of quartz, crushed and scarred by pressures no volcano or earthquake can make.",
                "That scarring is the fingerprint of an impact. And it will be found here, in the same mud."],
         hold=0.4),
    # ───────────── MINUTE 55 · the glass rain ─────────────
    dict(id="c5a", music="glassrain", shot=dict(type="slice"),
         lines=["Each shooting star burns out within a minute or two, high above the ground.",
                "But the droplets don't. They've cooled into tiny beads of glass, and now they simply fall.",
                "A bead the size of a grain of sand takes most of an hour to drift down through the air."],
         hold=0.2),
    dict(id="c5b", music="glassrain", shot=dict(type="river"),
         lines=["So the first glass reaches the river about fifty-five minutes after the impact. Smaller beads keep falling for the next hour and more.",
                "They tick on the water. They sink, about fifteen centimetres every second.",
                "And the paddlefish, still feeding, mouths open, sieve them out of the water along with everything else."],
         hold=0.4, sfx=[dict(kind="ticks", word="tick")]),

    dict(id="c5c", music="glassrain", shot=dict(type="bank"),
         # During et al. 2022: northern spring; they suggest southern-hemisphere life, in autumn, may have been better placed.
         lines=["The season matters. Here in the north, it's spring, and animals are breeding and raising their young, out in the open.",
                "On the other side of the equator, it's autumn. One idea is that life there, slowing down for winter, was a little better prepared for what came next."],
         hold=0.4),

    # ───────────── THE RIVER COMES BACK ─────────────
    dict(id="c6a", music="surge", shot=dict(type="bank"),
         # ≥10 m runup from the point-bar palaeorelief; flow upstream; two main pulses (DePalma 2019).
         lines=["Somewhere in those first two hours, the river turns around.",
                "The rock can't tell us the exact minute. But it can tell us what came: a surge at least ten metres high, rushing the wrong way, inland against the current."],
         hold=0.2),
    dict(id="c6b", music="surge", shot=dict(type="surge"),
         lines=["It tears fish out of the channel and throws them onto the bank. Tree trunks, roots and mud tumble together.",
                "Then the water drops back, and comes again. At least two great pulses.",
                "And all the while, glass keeps raining into the mud, layer after layer."],
         hold=0.3, sfx=[dict(kind="surge", word="tears")]),
    dict(id="c6c", music="surge", shot=dict(type="slice"),
         lines=["Not everyone agrees on what drove that water.",
                "The team that found the site argues the quake set the river sloshing. A tsunami from the Gulf would have needed at least eighteen hours to get here."],
         hold=0.5),

    # ───────────── 2 H 32 MIN · the sound ─────────────
    dict(id="c7a", music="hush", shot=dict(type="bank"),
         lines=["By now, everything in the river is dead, and buried.",
                "Light came first. Then the ground. Then fire in the sky. Then glass, then water.",
                "There's one thing left that hasn't arrived."],
         hold=1.4),
    dict(id="c7b", music="silence", shot=dict(type="bank"),
         lines=["Two hours and thirty-two minutes after the impact, the river finally hears it."],
         hold=2.6, sfx=[dict(kind="farboom", word="hears", offset=0.9, gain=1.7)]),
    dict(id="c7c", music="ash", shot=dict(type="bank"),
         lines=["Sound is the slowest messenger. It crossed three thousand kilometres of air at about a third of a kilometre per second.",
                "And it got here to find a river already filled in, under more than a metre of mud and glass."],
         hold=0.4),
    dict(id="c7d", music="ash", shot=dict(type="sky"),
         lines=["In the hours after, fine dust settles over everything, a thin, peach-coloured layer.",
                "Across the planet, soot and dust spread through the sky. Days turn dark. It will be months before sunlight returns.",
                "About three quarters of all species alive this morning will not make it."],
         hold=0.6),

    # ───────────── 66 MILLION YEARS LATER · the case file ─────────────
    dict(id="c8a", music="evidence", shot=dict(type="dig"),
         lines=["Sixty-six million years later, the river is a dry hillside in North Dakota.",
                "And that thin, peach-coloured layer is still there, on top of a jumble of fish, roots and mud that settled in less than two hours."],
         hold=0.3),
    dict(id="c8b", music="evidence", shot=dict(type="evidence"),
         lines=["X-rays of the sturgeon and paddlefish show the glass beads packed into their gills. More than half of them have it.",
                "The fish breathed it in before the mud buried them. Which means they were alive when the glass arrived.",
                "Many lie stacked on top of each other, whole, lined up the way the water was flowing when it dropped them."],
         hold=0.3),
    dict(id="c8c", music="evidence", shot=dict(type="amber"),
         lines=["And on the old tree trunks, drops of resin caught the falling glass and sealed it in amber.",
                "Untouched by water for sixty-six million years, those beads are still glass.",
                "Their chemistry matches the black glass found at the crater itself."],
         hold=0.4),
    dict(id="c8d", music="evidence", shot=dict(type="dig"),
         lines=["Some scientists still want more proof that this site captured the very first hours.",
                "But if it did, it's the closest thing we have to a recording of that morning: a clock written in mud, with glass for its ticks."],
         hold=0.5),

    # ───────────── end + next ─────────────
    dict(id="end1", music="evidence", shot=dict(type="amber"),
         lines=["One asteroid, one riverbank, one strange order of arrivals. The sound came last, and nothing was left to hear it."],
         hold=0.6),
    dict(id="next", music="nextup", shot=dict(type="next"),
         lines=["Next time, an asteroid that's coming in our own lifetimes.",
                "On April thirteenth, twenty twenty-nine, Apophis will pass closer to Earth than some of our satellites. We'll simulate the flyby, and the impact we avoided."],
         hold=0.4),
    dict(id="outro", music="nextup", shot=dict(type="end"),
         lines=["Apophis is already on its way. Subscribe, and be here when it passes."],
         hold=1.6, card=dict(kind="endcard")),
]

META = dict(
    slot=4, next_slot=5, next_teaser_keywords=["Apophis", "April"],   # EPISODES.md: #5 is Apophis
    promise_at=("open1", "glass"),        # impact glass raining into the river, on screen from the first line
    first_chapter="The fish with glass in its gills",
    extra_chapters={"c1a": "Minute 0: a spring morning", "c2a": "Minute 2: a light in the south",
                    "c3a": "Minute 6: the ground arrives", "c4a": "Minute 12: shooting stars",
                    "c5a": "Minute 55: the glass rain", "c6a": "The river comes back",
                    "c7a": "2 h 32 min: the sound", "c8a": "66 million years later", "next": "Next time"},
    thumb_text="",
    thumb_concept="from under the river looking up through Snell's window: the circle of sky full of glowing streaks, a paddlefish silhouette crossing it, glass beads sinking past",
    creative=dict(
        story_shape="unity of place: a two-hour vigil at one riverbank, counted by what arrives there and in what order, framed by the fossil evidence",
        point_of_view="eye level and underwater in a Cretaceous river; a cut-away slice through the planet for the paths",
        narrator="third person present tense, a reconstruction narrated without addressing anyone directly",
        hook_device="a fish breathing in glass, and the question of how glass from Mexico reached North Dakota so fast",
        time_scale="a single morning: seconds to two and a half hours, then one leap of sixty-six million years",
        ending_device="forensic close: glass sealed in amber matches the crater, a clock written in mud",
        thumb_device="underwater Snell's window: the sky seen from inside the river, filled with re-entry streaks",
        palette="fern green and river silt turning ember red, then ash white",
        signature_shot="from under the river, the sky shrinks to a circle of light full of shooting stars while glass beads sink past a paddlefish",
    ),
    shots={"river_under": "pov", "riverbank": "pov", "sky_up": "pov", "surge_scene": "pov", "slice_scene": "diagram",
           "xray_scene": "micro", "amber_scene": "micro", "dig_scene": "interior", "burial_scene": "diagram", "next_scene": "orbital", "endcard": "title",
           "clock_map": "map"},
    alts=["The Dinosaur Asteroid Hit Mexico. Its Sound Reached Dakota Last.",
          "3,000 km From the Dinosaur Asteroid, Everything Arrived in the Wrong Order"],
    tags="dinosaur asteroid, chicxulub, chicxulub impact, tanis, tanis fossil site, day the dinosaurs died, asteroid impact simulation, k-pg extinction, dinosaur extinction, impact glass, tektites, paddlefish fossil, hell creek, mass extinction, seismic waves, space documentary, earth science, science explained, gravity dial",
    pinned="The fish were alive when the glass arrived, and the sound of the impact got there last. Which arrival surprised you most: the quake, the shooting stars, the glass, or the sound?",
    playlist="Gravity Dial: The Universe, Simulated",
    hashtags="#dinosaurs #chicxulub #asteroid #science #paleontology",
    intro="""Sixty-six million years ago, an asteroid hit Mexico. Three thousand kilometres away, in what is now North Dakota, paddlefish and sturgeon died with its glass in their gills.

We followed the physics to that one riverbank (the Tanis fossil site), minute by minute: seismic waves traced through the planet's mantle, molten droplets flown on ballistic arcs and dropped through the air, and the sound crossing the continent. At that distance, everything arrives in the wrong order: the light, then the ground, then shooting stars, then glass, then a surge of water — and the sound of the impact last, two and a half hours later.

Which arrival surprised you most? Tell us in the comments.""",
    sources="""• Tanis, Hell Creek Formation, North Dakota: DePalma et al. 2019, PNAS 116, 8190 ("A seismically induced onshore surge deposit at the KPg boundary"): ~3,050 km from Chicxulub; P/S/Rayleigh arrivals 6/10/13 min; spherules overhead 13–25 min (launch 30–60°); most fell within 1–2 h; spherules 0.3–1.4 mm; ≥10 m runup; spherules in the gill rakers of >50 % of sturgeon and paddlefish; unaltered glass in amber matching Chicxulub black glass
• Impact season (spring), from Tanis fish bones: During et al. 2022, Nature 603, 91; DePalma et al. 2021, Sci. Rep. 11, 23704 (DePalma was cleared of fabrication over the latter by the University of Manchester, 2023)
• Re-entry heating: Goldin & Melosh 2009, Geology 37, 1135 (peak ~6 kW/m², above sunlight ~25 min with self-shielding); Melosh et al. 1990, Nature 343, 251 (higher); the debate continues
• Impact angle (~60°, from the north-east): Collins et al. 2020, Nature Communications 11, 1480
• Earthquake size Mw ~10–11.5 and the 2011 Tohoku seiches in Norway: as cited in DePalma et al. 2019 (Bondevik et al. 2013)
• About three quarters of species lost at the K–Pg boundary: e.g. Jablonski & Chaloner 1994; Schulte et al. 2010, Science 327, 1214
• Our physics (ep_tanis/model.py): P and S waves ray-traced through a layered spherical Earth (IASP91-like velocities): 5.8 and 10.5 min; Rayleigh waves at 3.9 km/s: 13.0 min; ejecta flown as two-body Kepler arcs (launch 30–60°: back at 100 km altitude after 12.3–24.7 min, apex 475–1,676 km); single glass beads dropped through an exponential atmosphere with drag (1.4 / 1.0 / 0.7 mm: on the water 54 / 71 / 103 min after impact; a dense rain of beads may fall faster as a group); fireball must rise above 807 km to clear Tanis's horizon; sound at 335 m/s: 2 h 32 min""",
)
