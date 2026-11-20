"""THE NIGHT EARTH CHANGES AN ASTEROID — Apophis, 13 April 2029, from both ends of a 32,000 km line

The episode as data (same format as the earlier episodes). Every number comes from ep_apophis/model.py (real JPL
Horizons ephemeris + our physics; `python -m ep_apophis.model`) and is checked in ep_apophis/claims.py. The creative
brief is BRIEF.md.

Narrator: first person plural, future tense ("we will see"): a forecast of a night that has not happened yet.
Shot / reverse shot: a rooftop sky on Earth, and the asteroid's own sky.

Signature set pieces the channel has never shown:
  1. standing on Apophis: a horizon that curves away a few steps off, a pebble that takes 2.6 minutes to fall, and a
     planet 37 Moons wide rising as a dark night side lit by cities, then turning half day
  2. the truck and the bicycle: a near miss where the small one is shoved and spun and the big one never notices
  3. the asteroid's year rewritten: its orbit drawn from Horizons before and after, 323 days becoming 423
  4. the mirror ending: two moving stars, each fading in the other's sky

Numbers (model.py):
  closest approach 13 Apr 2029 21:45 UTC, 38,011 km from Earth's centre = 31,640 km above the surface, 7.42 km/s
  geostationary altitude 35,786 km (Apophis passes 4,146 km lower; never nearer than 6,700 km to the ring itself)
  path bent 27°; 5.9 km/s far away -> 7.4 km/s at closest
  orbit: a 0.922 -> 1.103 AU; year 323.5 -> 423.2 days; inside 1 AU 59 % -> 28 % of the time; Aten -> Apollo
  surface gravity 1.2e-4 m/s² (2.6 g/cm³, 340 m): 70 kg weighs 0.9 g; 1.5 m drop 156 s; escape 20 cm/s
  Earth's tide at closest 2.6 % of its own gravity; Earth seen from Apophis 19.3° = 37 full Moons
  Lisbon: rises 18:36 UTC, brightest mag 2.8 at 20:44, highest 65° at 21:18, about 1° per minute
"""

TITLE = "Apophis Will Pass Closer Than Our Satellites. Earth Will Change It Forever."
FOLDER = "05_apophis"
VOICE = "bf_emma"      # a new narrator for a new point of view (Ep1-Ep4: af_heart)
SPEED = 0.92

PRON = {"Apophis": "əpˈɑfɪs", "Apep": "ˈɑpɛp", "Ramses": "ɹˈæmsiz", "OSIRIS-APEX": "oʊsˈaɪɹɪs ˈeɪpɛks", "Aten": "ˈɑtən", "Betelgeuse": "bˈitəlʤuz"}

SEGMENTS = [
    # ───────────── COLD OPEN: a moment everyone has had (a star that moves) ─────────────
    dict(id="open1", music="dusk", shot=dict(type="roof"),
         lines=["Everyone has seen a star that moves.",
                "It glides across the dark, steady and silent. It doesn't blink like a plane.",
                "It's a satellite, still catching sunlight, hundreds of kilometres above a world that has already gone to night."],
         hold=0.4),
    dict(id="open2", music="dusk", shot=dict(type="roof"),
         lines=["On the evening of April the thirteenth, twenty twenty-nine, a new moving star will rise over Europe and Africa.",
                "It isn't one of ours.",
                "It's an asteroid called Apophis, as wide as the Eiffel Tower is tall, and it will pass closer to us than the satellites that send us our weather pictures.",
                "We already know it will miss.",
                "What nobody knows yet is what Earth will do to it.",
                "Because for one night, the asteroid is the one in danger."],
         hold=1.4),

    # ───────────── 2004: the scare ─────────────
    dict(id="c1a", music="archive", shot=dict(type="scope"),
         lines=["We first saw Apophis in June two thousand four, from a mountaintop in Arizona.",
                "It was a faint dot, caught by comparing pictures of the same patch of sky, taken minutes apart. Every star stayed put. One dot moved.",
                "Then it slipped into the glare of the Sun and was lost, until a telescope in Australia found it again that December.",
                "Every night of new measurements narrowed down where it would be in April twenty twenty-nine.",
                "And for a few days around Christmas, the narrowing went the wrong way."],
         hold=0.8),
    dict(id="c1b", music="archive", shot=dict(type="odds"),
         lines=["The chance of a hit climbed to one in thirty-seven.",
                "No asteroid had ever scored that high on the scale astronomers use for impact risk.",
                "Then someone found Apophis in old pictures, taken that March, before anyone knew to look for it.",
                "Nine more months of its path, and the hit in twenty twenty-nine was gone.",
                "But a subtler worry stayed. Somewhere near Earth was a keyhole, a patch of space only a few hundred metres wide.",
                "If Apophis threaded it in twenty twenty-nine, Earth's pull would steer it back for a hit seven years later.",
                "And sunlight itself nudges Apophis. It warms on one side and cools on the other, and that drifts its orbit by about a hundred and seventy metres a year.",
                "In twenty twenty-one, radar pinned its path down so tightly that every danger was ruled out, for at least a hundred years."],
         hold=1.4),

    # ───────────── the rock ─────────────
    dict(id="c2a", music="rock", shot=dict(type="rock"),
         lines=["So what exactly is coming?",
                "Radar echoes show two lobes joined at a narrow waist, about four hundred and fifty metres end to end.",
                "Grey rock, boulders and gravel. Probably a loose pile of rubble, held together by its own feeble gravity.",
                "It doesn't spin neatly like a planet. Apophis tumbles: wobbling around about once a day, and rolling end over end once every eleven days.",
                "Its name comes from Apep, the ancient Egyptian serpent of chaos."],
         hold=1.0),

    # ───────────── the night, from the ground ─────────────
    dict(id="c3a", music="night", shot=dict(type="roof"),
         lines=["Here is that night, as the numbers say it will happen.",
                "From Lisbon, Apophis climbs out of the east as the sky gets dark.",
                "At twenty to nine, Universal Time, it's at its brightest, nearly as bright as the stars of the Big Dipper.",
                "By twenty past nine it stands high in the southern sky, two thirds of the way to straight overhead.",
                "It won't look like a fireball or a comet. Just a point of light, sliding steadily between the stars.",
                "Hold out your fist at arm's length. When Apophis is high overhead, it will cross that much sky in about ten minutes."],
         hold=1.0),
    dict(id="c3b", music="night", shot=dict(type="lane"),
         lines=["In a few hours it will cross the whole sky, from the Indian Ocean, over Africa, toward the Americas.",
                "Over Central Africa, it will pass almost straight overhead.",
                "Across Europe, Africa and western Asia, perhaps two billion people will be able to see it with no telescope at all.",
                "At twenty-one forty-five, it reaches its closest: thirty-one thousand six hundred kilometres above the Atlantic Ocean.",
                "That's lower than the geostationary satellites, and only one tenth of the distance to the Moon.",
                "It will pass the height of their ring well to the north of it. The nearest of them stays more than six thousand kilometres away.",
                "A rock this big comes this close only once every few thousand years."],
         hold=1.2),
    dict(id="c3c", music="night", shot=dict(type="roof"),
         lines=["To watch it, you won't need a telescope. Just a clear sky, away from bright lights.",
                "Through binoculars, you'll see it creep past the stars while you watch.",
                "Leave a camera open for a minute, and Apophis draws a straight line across the stars, while they barely move.",
                "And everyone who looks up that night will be watching the same rock at the same moment."],
         hold=0.4),

    # ───────────── reverse shot: the asteroid's sky ─────────────
    dict(id="c4a", music="surface", shot=dict(type="surface"),
         lines=["Now turn the camera around. Here is the same night, from Apophis.",
                "Dark gravel and boulders under a black sky. The horizon curves away just a few dozen steps from us.",
                "Even the Sun behaves strangely here. The whole world is tumbling, so it rises and sets at odd angles and odd hours.",
                "Gravity here is so weak that a grown person would weigh less than a gram. Less than a paper clip.",
                "Drop a pebble from shoulder height, and it takes more than two and a half minutes to land.",
                "Jump, and you would never come down. Anything faster than twenty centimetres a second leaves Apophis for good."],
         hold=1.0),
    dict(id="c4b", music="surface", shot=dict(type="surface"),
         lines=["And over that close horizon, a planet is rising.",
                "At first Earth shows Apophis its night side: a dark disc, sprinkled with the lights of cities.",
                "Hour by hour it grows, and the sunlit edge creeps around it.",
                "At closest approach, Earth fills nineteen degrees of the sky. As wide as thirty-seven full Moons in a row.",
                "Half of it in daylight, half of it in night.",
                "Its sunlit half pours Earthlight onto Apophis, about a thousand times brighter than a full Moon, enough to cast sharp shadows from every boulder."],
         hold=1.4),

    # ───────────── the pull: Earth is the truck ─────────────
    dict(id="c5a", music="pull", shot=dict(type="road"),
         lines=["Anyone who has ridden a bike on a busy road knows this moment.",
                "A truck passes too close. The truck doesn't notice. The bike wobbles.",
                "On April the thirteenth, Earth is the truck."],
         hold=0.3, sfx=[dict(kind="truck", word="truck")]),
    dict(id="c5b", music="pull", shot=dict(type="bend"),
         lines=["Earth's gravity grabs Apophis, speeding it up from six kilometres a second to more than seven, and bending its path by twenty-seven degrees.",
                "It also pulls harder on the near end of the asteroid than on the far end.",
                "That difference is a tide. The same stretch that lifts our oceans twice a day."],
         hold=0.3),
    dict(id="c5c", music="pull", shot=dict(type="surface"),
         lines=["On Apophis, the tide will change the pull of gravity at the surface by a few percent.",
                "That doesn't sound like much. But on a loose pile of rubble, a few percent could be enough to set off small landslides on the steepest slopes.",
                "Any slide would drag fresh rock out from under the weathered surface, and fresh rock looks brighter. Some asteroids may get their new faces exactly this way, from a close pass by a planet.",
                "And its slow tumble will be twisted. Some models say Apophis could come out spinning twice as fast, or half as fast."],
         hold=1.2, sfx=[dict(kind="slide", word="landslides")]),

    # ───────────── changed forever ─────────────
    dict(id="c6a", music="orbit", shot=dict(type="orbit"),
         lines=["Then Apophis leaves, and it does not leave the way it came.",
                "Before that night, its year lasts three hundred and twenty-three days, and it spends most of its time inside Earth's orbit.",
                "After, its year lasts four hundred and twenty-three days, and it spends most of its time outside.",
                "Astronomers will even change its family name, from an Aten asteroid to an Apollo.",
                "One evening, thirty-two thousand kilometres away, and Earth rewrites an asteroid's calendar for good.",
                "And Earth itself? Apophis will raise a tide in our oceans just a few atoms high. We won't feel a thing."],
         hold=1.2),
    dict(id="c6b", music="orbit", shot=dict(type="probe"),
         lines=["And this time, we will be watching up close.",
                "A European spacecraft, Ramses, should arrive two months early and fly alongside Apophis through the whole encounter.",
                "It will map the boulders before the flyby, so we can see which ones moved after.",
                "NASA's OSIRIS-APEX follows soon after, to see what changed, and to stir the surface with its thrusters and look underneath.",
                "For the first time, we will watch a planet reshape an asteroid, as it happens."],
         hold=1.2),
    dict(id="next", music="nextup", shot=dict(type="roof"),
         lines=["Not every new light in the sky will be this gentle.",
                "One day, a star in Orion will explode, bright enough to see in daylight.",
                "Next time: the night Betelgeuse explodes, and the warning that reaches us hours before the light."],
         hold=0.5),
    dict(id="end1", music="mirror", shot=dict(type="surface"),
         lines=["Late that night, Apophis heads back out into the dark.",
                "From the ground, a moving star fades among the others.",
                "From the asteroid, a blue planet shrinks to a point of light.",
                "Two moving stars, watching each other go. Only one of them will never be the same."],
         hold=2.8),
    dict(id="outro", music="mirror", shot=dict(type="surface"),
         lines=["If you'd like to watch the next one with us, subscribe to Gravity Dial."],
         hold=3.2, card=dict(kind="endcard")),
]

META = dict(
    slot=5, next_slot=6, next_teaser_keywords=["Betelgeuse"],     # EPISODES.md: #6 is Betelgeuse
    promise_at=("open2", "closer"),       # Apophis slides inside the satellite shells on screen at "closer"
    open_moment="seeing a star that moves: a satellite gliding across the night sky, not blinking like a plane",
    cast=dict(hero="Apophis, a 340 m two-lobed asteroid", hero_word="Apophis",
              villain="Earth's gravity: the truck that never notices the bike",
              room="the space just outside Earth where the satellites fly, seen from the asteroid and from a rooftop",
              room_scenes=["roof", "lane", "surface", "rock", "probe_scene", "bend"],
              moving="the moving star and the swelling Earth, on one Universal-Time clock"),
    story_end="end1",
    first_chapter="A star that moves",
    extra_chapters={"c1a": "2004: the scare", "c2a": "The rock", "c3a": "The night, from the ground", "c3c": "How to watch it", "c4a": "The night, from Apophis",
                    "c5a": "Earth is the truck", "c6a": "A new year for Apophis", "c6b": "Watching up close", "next": "Next: Betelgeuse"},
    thumb_text="",
    thumb_concept="a round rear-view mirror standing on the asteroid's grey gravel; in its glass the night side of Earth, city lights glittering, looms up from behind like a truck",
    creative=dict(
        story_shape="role reversal told shot and reverse shot: a near miss from the small body's side, the planet as the hazard and the rock coming away changed",
        point_of_view="standing on the asteroid's surface among boulders, cross-cut with rooftops on Earth",
        narrator="first person plural in the future tense, a forecast of a night that has not happened yet",
        hook_device="a star that moves: the familiar satellite crossing, then a new one passing below the satellites",
        time_scale="one evening on a Universal Time clock, with a jump back to 2004 and one forward a year",
        ending_device="mirror shot: each world fades to a moving point in the other's sky, and only one is changed",
        thumb_device="a rear-view mirror holding Earth looming up behind, the role reversal in an everyday object",
        palette="basalt grey regolith, sodium-lamp gold city lights and one cyan planet",
        signature_shot="a planet thirty-seven Moons wide rising over a close curved horizon of boulders, turning from night to half day",
    ),
    shots={"roof": "pov", "surface": "pov", "road": "pov", "probe_scene": "ride", "rock": "macro", "dome": "pov",
           "lane": "orbital", "bend": "orbital", "blink": "archive", "odds_meter": "data", "radar": "data",
           "tide": "diagram", "orbit_map": "diagram", "track": "map", "timeline_scene": "data", "sea": "pov", "neutrino": "diagram", "split": "pov", "slope": "macro"},
    alts=["In 2029 an Asteroid Misses Earth. Earth Doesn't Miss It.",
          "The Night of April 13, 2029, Seen From the Asteroid's Side"],
    tags="apophis, apophis 2029, asteroid apophis, april 13 2029, 99942 apophis, asteroid flyby, near earth asteroid, asteroid close approach, planetary defense, osiris-apex, ramses mission, esa ramses, asteroid simulation, geostationary satellites, tidal forces, space documentary, astronomy, science explained, gravity dial",
    pinned="On 13 April 2029, Apophis passes 31,600 km above the Atlantic, and Earth gives it a new 423-day year. Where will you be watching from?",
    playlist="Gravity Dial: The Universe, Simulated",
    hashtags="#apophis #asteroid #space #astronomy #science",
    intro="""On 13 April 2029, the asteroid Apophis will pass 31,600 km above the Atlantic, lower than our geostationary satellites. It will miss. But for one night, the asteroid is the one in danger.

We took NASA JPL's orbit for Apophis and followed that night from both ends: from a rooftop in Lisbon, where a new moving star crosses a fist of sky every ten minutes, and from the asteroid's own surface, where a pebble takes two and a half minutes to fall and Earth rises 37 full Moons wide. Earth bends Apophis's path by 27°, may set off landslides and change its tumble, and gives it a new year: 323 days before, 423 after.

Where will you watch it from? Tell us in the comments.""",
    sources="""• Orbit, flyby geometry, before/after elements, Lisbon sky track: NASA JPL Horizons (99942 Apophis), retrieved Nov 2026: closest approach 13 Apr 2029 21:45 UTC, 38,011 km from Earth's centre (31,640 km above the surface), 7.42 km/s; a 0.922 → 1.103 AU, period 323.5 → 423.2 days
• Apophis facts (size ~340 m, visibility, no impact risk for at least 100 years, Aten → Apollo, a pass this close every few thousand years): NASA, science.nasa.gov/solar-system/asteroids/apophis-facts; ESA Planetary Defence, esa.int/Space_Safety/Planetary_Defence/Apophis
• Discovery (19 June 2004, Kitt Peak: R. Tucker, D. Tholen, F. Bernardi), the December 2004 peak of 2.7 % and Torino level 4, the March 2004 Spacewatch precovery: Sansaturio & Arratia 2008 (Earth Moon Planets 102, 425); NASA/JPL CNEOS
• Radar shape (elongated, likely bilobed) and the 2021 radar that removed the 2068 risk: Brozović et al. 2018 (Icarus 300, 115); NASA JPL, March 2021
• Spin state (tumbler: 264.18 h and 27.3855 h, Lee et al. 2022) and its change in 2029 (effective spin could halve or double): Benson et al. 2023, Icarus 390, 115324; Hirabayashi 2025 (arXiv 2507.17710)
• Tidal effects and possible small landslides: Yu et al. 2014 (Icarus 242, 82); DeMartini et al. 2019 (Icarus 328, 93)
• Ramses (ESA, with JAXA): launch April 2028, arrival February 2029: esa.int; OSIRIS-APEX (NASA): arrival soon after the flyby
• Our physics (ep_apophis/model.py): flyby re-checked as a two-body hyperbola (turn 27.2° vs 27.0° in the ephemeris); surface gravity for 340 m at 2.6 g/cm³ (1.2 × 10⁻⁴ m/s²): a 70 kg person weighs 0.9 g, a 1.5 m drop takes 156 s, escape speed 20 cm/s; Earth's tide at closest approach 2.6 % of the asteroid's own gravity; Earth seen from Apophis 19.3° wide (37 full Moons); phase of Earth from the asteroid (night side at 19:00 UTC, half lit at closest)""",
)
