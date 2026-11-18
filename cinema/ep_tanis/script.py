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

PRON = {"Chicxulub": "ʧˈikʃulˌub", "Yucatán": "jˌukətˈæn"}

SEGMENTS = [
    # ───────────── COLD OPEN: a moment everyone has had (lightning, then the count) ─────────────
    dict(id="open1", music="storm", shot=dict(type="storm"), gap=0.7,
         lines=["Everyone has done this.",
                "Lightning flashes, and we start counting. One. Two. Three.",
                "Then the thunder.",
                "Light arrives first. Sound arrives later. The longer the count, the farther away it struck.",
                "Every three seconds of counting is about one kilometre."],
         hold=1.5, sfx=[dict(kind="thunder", word="thunder")]),
    dict(id="open2", music="riverdawn", shot=dict(type="river"),
         lines=["Sixty-six million years ago, one river got the longest count in history.",
                "And the fish living in it left us a record of every minute."],
         hold=1.0),

    # ───────────── THE RIVER, THE FISH, THE MAP ─────────────
    dict(id="c1a", music="riverdawn", shot=dict(type="fish"),
         lines=["It's early morning, probably spring.",
                "Mist hangs over the water. Conifers and flowering trees crowd both banks.",
                "In the river, a young paddlefish is feeding. It swims with its mouth wide open, sieving the water for tiny food.",
                "Its long, flat snout is covered in sensors that feel the electric fields of its prey.",
                "Sturgeon cruise along the bottom. It's a quiet, ordinary morning."],
         hold=0.2),
    dict(id="c1b", music="riverdawn", shot=dict(type="map"),
         lines=["This river is in what is now North Dakota.",
                "Three thousand kilometres to the south, farther than New York is from Denver, lies what is now Mexico.",
                "And falling toward the sea there is a rock about ten kilometres wide.",
                "The crater is still there, buried under the Yucatán Peninsula. Scientists call it Chicxulub.",
                "Why this river? Because scientists dug it up. And what they found in the fish explains everything that happened next."],
         hold=0.3),

    # ───────────── 0:00 · impact, and the light ─────────────
    dict(id="c2a", music="hush", shot=dict(type="globe"),
         lines=["Impact.",
                "For a moment, the flash outshines the Sun. A crater nearly two hundred kilometres wide opens in the seabed. The count begins.",
                "Its light reaches the river in a hundredth of a second, but the river sees nothing.",
                "The Earth is curved. Three thousand kilometres of planet are in the way.",
                "To be seen from here, anything at the crater has to rise more than eight hundred kilometres into the sky."],
         hold=1.2, sfx=[dict(kind="flash", word="Impact")]),
    dict(id="c2b", music="hush", shot=dict(type="bank"),
         lines=["Only the fireball, climbing hundreds of kilometres high, rises over the edge.",
                "A glow in the south, like a second sunrise in the wrong place.",
                "No sound. The paddlefish keeps feeding."],
         hold=1.2),

    # ───────────── 5:47 · the ground ─────────────
    dict(id="c3a", music="tremor", shot=dict(type="interior"),
         lines=["The first thing to reach the river doesn't come through the air. It comes through the rock.",
                "The impact rings the whole planet like a bell.",
                "Waves dive down into the hot mantle, where they travel fastest, and curve back up toward the river.",
                "The fastest waves push and pull the rock, like a squeezed spring. Slower ones shake it from side to side."],
         hold=0.2),
    dict(id="c3b", music="tremor", shot=dict(type="bank"),
         lines=["At five minutes and forty-seven seconds, the first wave arrives. The ground jolts.",
                "Birds burst out of the trees. The paddlefish dives for the bottom.",
                "At ten and a half minutes, a slower wave shakes everything side to side.",
                "At thirteen minutes, the slowest waves roll the ground like the sea."],
         hold=1.2, sfx=[dict(kind="jolt", word="jolts"), dict(kind="quake", word="side"), dict(kind="roll", word="roll")]),
    dict(id="c3c", music="tremor", shot=dict(type="cutaway"),
         lines=["It's the biggest earthquake any river has ever felt.",
                "And the river does what water in a bathtub does when it's shaken. It starts to slosh."],
         hold=0.3),

    # ───────────── 13:00 · glass from the sky ─────────────
    dict(id="c4a", music="glassrain", shot=dict(type="globe"),
         lines=["Meanwhile, the impact has blasted molten rock out of the atmosphere, into space.",
                "Billions of droplets fly on great arcs, hundreds of kilometres high, higher than the space station orbits today.",
                "As they fly, they cool into beads of glass, each about the size of a grain of sand."],
         hold=0.2),
    dict(id="c4b", music="glassrain", shot=dict(type="sky"),
         lines=["Everyone has seen a shooting star.",
                "Thirteen minutes after impact, the sky over the river fills with millions of them.",
                "Every streak is a bead of glass hitting the air at five kilometres per second.",
                "Some flare and split. Their light flickers on the water.",
                "For nearly half an hour, the glowing sky heats the forest below."],
         hold=1.0),
    dict(id="c4c", music="glassrain", shot=dict(type="water"),
         lines=["Slowed by the air, the beads drift down. A grain of sand takes most of an hour to fall.",
                "At about fifty-five minutes, the first glass hits the river.",
                "Tick. Tick. Like the first drops of rain."],
         hold=1.5, sfx=[dict(kind="ticks", word="Tick")]),
    dict(id="c4d", music="glassrain", shot=dict(type="fish"),
         lines=["The beads sink, fifteen centimetres every second.",
                "And the paddlefish, still feeding with its mouth open, sieves them out of the water with everything else.",
                "Inside its gills is a fine comb that catches food. Now it catches glass.",
                "The beads lodge in its gills, one after another."],
         hold=0.4),

    # ───────────── the river comes back ─────────────
    dict(id="c5a", music="surge", shot=dict(type="cutaway"),
         lines=["By now the sloshing river has grown into something terrifying.",
                "The water runs backwards, up the channel, and rises. At least ten metres."],
         hold=0.2, sfx=[dict(kind="surge", word="backwards")]),
    dict(id="c5b", music="surge", shot=dict(type="surge"),
         lines=["A wall of water, trees and mud tears up the valley.",
                "Logs, roots and fish tumble together in the brown water.",
                "It sweeps the paddlefish and its school out of the river and throws them onto the bank."],
         hold=1.2),
    dict(id="c5c", music="surge", shot=dict(type="cutaway"),
         lines=["The water pulls back. Then it comes again.",
                "Each time it drops, it leaves a layer of mud, burying the fish where they lie.",
                "And the glass keeps falling, into the mud, layer after layer.",
                "In less than two hours, more than a metre of mud and glass fills the channel."],
         hold=0.4),

    # ───────────── 2:32:00 · the end of the count ─────────────
    dict(id="c6a", music="silence", shot=dict(type="map"),
         lines=["Now, back to the count.",
                "Sound is slow. In air, it covers about a third of a kilometre every second.",
                "To cross three thousand kilometres, it needs two and a half hours.",
                "One hour after impact, the sound has only just reached the coast of what is now Texas.",
                "Two hours after impact, it's passing over Nebraska. Still not there."],
         hold=1.0),
    dict(id="c6b", music="silence", shot=dict(type="bank"),
         lines=["The river is gone. Dust drifts over fresh mud. Nothing moves.",
                "Two hours, thirty-two minutes after the flash, the sound finally arrives."],
         hold=4.0, sfx=[dict(kind="farboom", word="arrives", gain=1.7)]),
    dict(id="c6c", music="ash", shot=dict(type="bank"), gap=0.6,
         lines=["Nine thousand, one hundred and twenty seconds. By the storm rule, that's three thousand kilometres away.",
                "The longest count in history. And no one is left to hear it.",
                "In the weeks that follow, soot and dust darken the sky over the whole planet.",
                "About three in every four kinds of animals and plants alive that morning will not survive."],
         hold=1.5),

    # ───────────── 66 million years later · the record ─────────────
    dict(id="c7a", music="evidence", shot=dict(type="dig"),
         lines=["Sixty-six million years later, the river is a dry hillside in North Dakota.",
                "Scientists dug into that layer of mud and found the fish, still lying where the water dropped them.",
                "Many lie stacked on top of each other, all pointing the same way, the way the water was flowing.",
                "Their bodies are complete, fins and all, buried too fast to rot.",
                "Sturgeon and paddlefish. More than half have glass beads in their gills."],
         hold=0.3),
    dict(id="c7b", music="evidence", shot=dict(type="amber"),
         lines=["Fish only breathe in glass if they're alive. So they were alive when the glass arrived, within the first hour.",
                "On the old tree trunks, drops of resin caught the falling glass and turned to amber. Its chemistry matches the glass from the crater in Mexico.",
                "Sealed away from water, those beads are still glass, sixty-six million years later.",
                "Some scientists still argue about parts of this story. But the glass in the gills is hard to argue with."],
         hold=1.0),
    dict(id="c7c", music="nextup", shot=dict(type="globe"),
         lines=["Rocks from space still pass us by.",
                "On April thirteenth, twenty twenty-nine, an asteroid called Apophis will fly closer to Earth than many of our satellites.",
                "That's our next story: what that night will look like from the ground."],
         hold=0.4),
    dict(id="end1", music="riverdawn", shot=dict(type="fish"),
         lines=["But for one young paddlefish, on one spring morning, the count ended at two hours and thirty-two minutes.",
                "And sixty-six million years later, it's still telling us what it saw.",
                "A clock written in mud, with glass for its ticks."],
         hold=3.0),
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
