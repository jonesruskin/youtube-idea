"""
NO BOTTOM — "What If You Fell Into Jupiter?"

The episode as data (same format as ep_blackhole/script.py). Every descent number comes from ep_jupiter/model.py:
a 12-tonne, 4-metre sealed ship released at rest at the 1-bar level, falling at drag-limited speed through a dry
adiabat anchored to the Galileo probe (166 K at 1 bar), then through an n=1 polytrope interior with buoyancy.

Key simulation outputs (python ep_jupiter/model.py):
  released 20 km above the 1-bar level; peak speed ~2,220 km/h at ~43 s
  water clouds ~50 km at ~2.6 min; 20 °C outside at 62 km (3.2 min, 6.6 bar)
  boiling-water temperature at ~100 km (5.6 min, 15 bar)
  Galileo's last reading (22 bar, ~150 °C) at ~123 km, 7.4 min
  Draper point (~525 °C, matter starts to glow) at ~307 km, 31 min, 188 bar
  1,100 bar (Mariana Trench / limit of full-ocean-depth subs) at ~579 km, 98 min, ~1,070 °C
  an uncrushable sealed ship (density 358 kg/m³) becomes neutrally buoyant at ~5,350 km after ~6.6 days
  1 Mbar at ~10,000 km (metallic hydrogen region); centre ~20,000 K, ~40 Mbar
"""

TITLE = "What If You Fell Into Jupiter?"
FOLDER = "02_jupiter"

SEGMENTS = [
    # ─────────────────────────────── COLD OPEN ───────────────────────────────
    dict(id="open1", music="open", shot=dict(type="space"),
         # Volume ratio Jupiter/Earth ≈ 1,321.
         lines=["This is Jupiter.",
                "You could fit more than thirteen hundred Earths inside it.",
                "And in a few minutes, you're going to fall into it.",
                "Not crash. Fall."],
         hold=0.3),
    dict(id="open2", shot=dict(type="space"),
         lines=["Because Jupiter has no ground. No surface. Nothing to land on.",
                "Just sky, getting thicker and hotter, all the way down."]),
    dict(id="open3", music="reveal", shot=dict(type="diagram"),
         lines=["We ran your fall through a physics simulation, built on real measurements from the probe that went there before you.",
                "Every number on the side of your screen comes from it.",
                "And it showed us something we didn't expect.",
                "At some point, the falling just stops. And not because you hit anything."],
         hold=0.3, sfx=[dict(kind="boom", word="stops", gain=0.45)]),
    dict(id="title", music="title", shot=dict(type="space"), lines=[], dur=4.6,
         card=dict(kind="title", text="NO BOTTOM", sub="A fall into Jupiter")),

    # ─────────────────────── CHAPTER 1 · GETTING THERE ───────────────────────
    dict(id="c1a", music="wonder", shot=dict(type="space"),
         # Stardate: unprotected human killed within hours; Juno: ~1 cm titanium radiation vault.
         lines=["First, you have to get there.",
                "Jupiter is wrapped in the most intense radiation belts of any planet.",
                "Without heavy shielding, they would kill you within hours.",
                "NASA's Juno spacecraft keeps its electronics inside a titanium vault, just to survive flying through them."],
         card=dict(kind="chapter", num="T – 0", text="Getting There")),
    dict(id="c1b", shot=dict(type="space"),
         # Escape speed 59.5 km/s; London–New York ≈ 5,570 km → ~93 s.
         lines=["Then there's the speed.",
                "Jupiter's gravity is so strong that anything falling in from deep space hits the air at about sixty kilometres per second.",
                "Fast enough to cross the Atlantic in about a minute and a half."]),
    dict(id="c1c", shot=dict(type="diagram"),
         # Galileo probe, 7 Dec 1995: entry ~47 km/s, peak heating ~16,000 °C, heat-shield leading edge 14.6 → 5.1 cm.
         lines=["In nineteen ninety-five, a NASA probe did exactly that.",
                "The Galileo probe hit the atmosphere so hard that the gas in front of it became hotter than the surface of the Sun.",
                "In about two minutes, most of the front of its heat shield burned away."]),
    dict(id="c1d", shot=dict(type="space"),
         lines=["You won't do that. Your ship fires its engines and comes to a complete stop, just above the clouds.",
                "Twelve tonnes, four metres wide, built like the strongest submarines on Earth.",
                "From here, the rules are simple. Engines off.",
                "You fall."],
         hold=0.5),

    # ─────────────────────── CHAPTER 2 · THE CLOUDS ───────────────────────
    dict(id="c2a", music="tension", shot=dict(type="atmos"),
         # Surface gravity 24.8 m/s² = 2.53 g. Ammonia ice clouds 0.6–0.9 bar, colder than −100 °C.
         lines=["The first thing you'd notice is your weight.",
                "Jupiter's gravity is two and a half times Earth's. Just lifting your arm would feel like lifting it underwater, with weights on.",
                "Below you, a floor of white cloud stretches past every horizon.",
                "It's ammonia ice, colder than minus one hundred degrees."],
         card=dict(kind="chapter", num="T + 0 SECONDS", text="The Clouds")),
    dict(id="c2b", shot=dict(type="space"),
         # Strongest jet ~150 m/s (540 km/h). Great Red Spot 24,000–40,000 km wide (Earth: 12,742 km).
         lines=["And it's all moving.",
                "The winds up here blow at over five hundred kilometres per hour, in bands that wrap around the whole planet.",
                "One storm, the Great Red Spot, is wider than the entire Earth."]),
    dict(id="c2c", shot=dict(type="atmos"),
         lines=["You drop into the white clouds.",
                "The air up here is thin, so almost nothing slows you down.",
                "In forty seconds, you're falling at more than two thousand kilometres per hour."]),
    dict(id="c2d", shot=dict(type="atmos"),
         # NH4SH cloud deck 1–2 bar. Colour sources still debated.
         lines=["Under the white is a second layer of cloud. Brown, and orange.",
                "It's ammonium hydrosulfide. If you opened a window, it would smell like rotten eggs and cleaning fluid.",
                "Chemicals like this, broken apart by sunlight, are thought to paint Jupiter's stripes. Even now, nobody is sure exactly which ones."]),

    # ─────────────────────── CHAPTER 3 · THE STORM ───────────────────────
    dict(id="c3a", music="wonder", shot=dict(type="atmos"),
         # Water clouds 3–7 bar. Model: 20 °C at 62 km, 6.7 bar, 2.7 min. 6.7 bar ≈ 57 m of seawater.
         lines=["Two and a half minutes in, fifty kilometres down, you reach the third layer.",
                "Water clouds. Real ones, like the clouds on Earth.",
                "And for a moment, something strange happens.",
                "The temperature outside your window climbs past twenty degrees. A warm spring day.",
                "The pressure is about seven times Earth's air. The same as diving sixty metres underwater."],
         card=dict(kind="chapter", num="T + 2 MINUTES", text="The Storm")),
    dict(id="c3b", music="tension", shot=dict(type="atmos"),
         # Juno 2020: storms loft water ice ~25 km above the water clouds; ammonia melts it into slush ("mushballs"); shallow lightning.
         lines=["But these are the clouds where Jupiter's storms are born.",
                "Its thunderstorms are strong enough to fling ice more than twenty kilometres up into the sky.",
                "Up there, the ice meets ammonia gas and melts into slush. Scientists call these hailstones mushballs.",
                "And the storms crackle with lightning, seen flickering on Jupiter's night side by passing spacecraft."]),
    dict(id="c3c", shot=dict(type="atmos"),
         lines=["Below the water clouds, the last of the sunlight is gone.",
                "From here on, it's completely dark.",
                "The only light is the lightning, flashing somewhere around you."],
         hold=0.4),

    # ─────────────────────── CHAPTER 4 · DEEPER THAN ANYTHING ───────────────────────
    dict(id="c4a", music="dread", shot=dict(type="atmos"),
         # Model: 100 °C at ~101 km, 5.6 min, 15 bar; speed ~840 km/h.
         lines=["Five and a half minutes in, a hundred kilometres down, the air outside is hotter than boiling water.",
                "You're still falling at more than eight hundred kilometres per hour.",
                "But the air is getting thicker, and it's starting to hold you back."],
         card=dict(kind="chapter", num="T + 5 MINUTES", text="Deeper Than Anything")),
    dict(id="c4b", shot=dict(type="diagram"),
         # Galileo probe: ~58 min of data on a parachute, lost at ~22–23 bar, ~152 °C, ~150 km (sources 132–160 km).
         lines=["At seven minutes, you pass a milestone.",
                "This is where the Galileo probe went silent.",
                "It drifted down on a parachute for almost an hour, sending back everything it measured, until the heat overwhelmed it.",
                "Twenty-two times Earth's air pressure. A hundred and fifty degrees.",
                "Nothing we've ever built has been deeper inside Jupiter.",
                "Everything from here on, nobody has ever measured. It comes from physics."]),

    # ─────────────────────── CHAPTER 5 · THE GLOW ───────────────────────
    dict(id="c5a", music="pulse", shot=dict(type="atmos"),
         # Model: 798 K (Draper point, ~525 °C) at ~307 km, 30 min, 188 bar.
         lines=["Half an hour in. Three hundred kilometres down.",
                "The temperature outside passes five hundred degrees.",
                "And then something happens that you'd never expect, at the bottom of a pitch-black sky.",
                "The darkness starts to glow."],
         card=dict(kind="chapter", num="T + 30 MINUTES", text="The Glow"), sfx=[dict(kind="riser", word="darkness", offset=-2.6), dict(kind="bell", word="glow", note="B4")]),
    dict(id="c5b", shot=dict(type="atmos"),
         lines=["Anything this hot gives off its own light. A dull red, like the ring of an electric stove.",
                "It's the air itself. Above you, below you, in every direction.",
                "And the deeper you go, the brighter it gets. Red, then orange."]),
    dict(id="c5c", shot=dict(type="diagram"),
         # 316 bar ≈ 322 kg per cm² (a grand piano ~300 kg) at ~43 min.
         lines=["Meanwhile, the pressure keeps climbing.",
                "Two hundred times Earth's air. Then three hundred.",
                "Every square centimetre of your hull is now holding up the weight of a grand piano."]),

    # ─────────────────────── CHAPTER 6 · THE LIMIT ───────────────────────
    dict(id="c6a", music="impact", shot=dict(type="atmos"),
         # Model: 1,100 bar at ~579 km, 97.8 min, ~1,070 °C. Challenger Deep ≈ 1,086 bar.
         lines=["An hour and a half in.",
                "You're almost six hundred kilometres down. Outside, it's over a thousand degrees, and glowing orange.",
                "And the pressure reaches eleven hundred times Earth's air.",
                "That's the pressure at the bottom of the Mariana Trench, the deepest point in Earth's oceans."],
         card=dict(kind="chapter", num="T + 98 MINUTES", text="The Limit")),
    dict(id="c6b", shot=dict(type="atmos"),
         # 1,100 bar ≈ 1.1 t per cm² (a small car).
         lines=["It's the limit of the strongest submarines ever built.",
                "Every square centimetre of your hull is now holding up a small car.",
                "And right here, ninety-eight minutes after you let go, your ship gives way."],
         hold=1.0, sfx=[dict(kind="crush", word="gives")]),
    dict(id="c6c", music="quiet", shot=dict(type="diagram"),
         # 579 km / 69,911 km mean radius = 0.83%.
         lines=["Here's what puts that in perspective.",
                "You fell almost six hundred kilometres. Jupiter is seventy thousand kilometres deep.",
                "You didn't even make it one percent of the way to the centre."]),

    # ─────────────────────── CHAPTER 7 · THE FLOAT ───────────────────────
    dict(id="c7a", music="fall", shot=dict(type="atmos"),
         lines=["So let's cheat.",
                "Imagine your ship can't be crushed, and can't melt. It just keeps falling.",
                "How far does it get?",
                "This is where the simulation surprised us."],
         card=dict(kind="chapter", num="T + 2 HOURS", text="The Float")),
    dict(id="c7b", shot=dict(type="atmos"),
         # Model (deep_fall): ~93 km/h at 1,000 km; ~45 km/h at 3,000 km; hours → days.
         lines=["The air around you is now so dense, it slows you to the speed of a car on a motorway. Then a car in town.",
                "Hours pass. Then days.",
                "Two thousand kilometres down. Three thousand.",
                "The hydrogen around you is thousands of degrees, and squeezed so hard it stops behaving like a gas."]),
    dict(id="c7c", shot=dict(type="atmos"),
         # Hydrogen is supercritical above 33 K / 13 bar: no boundary between gas and liquid.
         lines=["There's no moment where you splash into an ocean.",
                "The sky just gets thicker, and thicker, until it flows around you like a liquid.",
                "And somewhere around five thousand kilometres down, your ship stops.",
                "Not because it hit anything.",
                "Because the hydrogen around it is now as dense as the ship itself."]),
    dict(id="c7d", music="drift", shot=dict(type="atmos"),
         # Neutral buoyancy at ~5,350 km after ~6.6 days (ship density 358 kg/m³); 5,350/69,911 = 7.7%.
         sfx=[dict(kind="bell", word="float", note="E5")],
         lines=["You float.",
                "Six and a half days after you let go, five thousand three hundred kilometres down, in a glowing ocean with no surface and no floor.",
                "Less than a tenth of the way to the centre.",
                "Jupiter doesn't swallow you. It just won't let you sink."],
         hold=0.8),

    # ─────────────────────── CHAPTER 8 · THE HEART ───────────────────────
    dict(id="c8a", music="wonder", shot=dict(type="cutaway"),
         # ~1 Mbar at ~10,000 km (model); molecular → metallic hydrogen ~0.5–2 Mbar (0.8–0.9 R_J).
         lines=["But we can keep going without you.",
                "Around ten thousand kilometres down, the pressure passes a million times Earth's air.",
                "And hydrogen, the simplest element in the universe, turns into something that doesn't exist naturally on Earth.",
                "A liquid metal."],
         card=dict(kind="chapter", num="DEPTH 10,000 KM", text="The Heart")),
    dict(id="c8b", shot=dict(type="diagram"),
         # Rotation period 9.9 h. Strongest planetary magnetic field in the Solar System.
         lines=["Squeezed this hard, the electrons break free of their atoms and flow, like they do in a copper wire.",
                "This ocean of metal swirls as Jupiter spins once every ten hours.",
                "And it generates the strongest magnetic field of any planet."]),
    dict(id="c8c", shot=dict(type="night"),
         # Juno mission: Jupiter's magnetosphere would look about as big as the full Moon in our sky. Distance 588–968 million km.
         lines=["If you could see that magnetic field from Earth, it would look about as big as the full Moon.",
                "From more than six hundred million kilometres away."]),
    dict(id="c8d", shot=dict(type="cutaway"),
         # Delitsky & Baines 2013 (AAS DPS): lightning-made soot → graphite → diamond; more favourable in Saturn than Jupiter.
         lines=["Some scientists have even suggested that carbon from lightning could be squeezed into diamonds, and sink through Jupiter like hail.",
                "Nobody knows yet if it's true."]),
    dict(id="c8e", shot=dict(type="cutaway"),
         # Juno: dilute ("fuzzy") core extending to a large fraction of the radius (Wahl 2017; Militzer 2022). Centre ~20,000 K, 40–70 Mbar.
         lines=["And at the very centre, there's a core.",
                "Scientists expected a solid ball. Juno found something stranger. A fuzzy core, partly dissolved, spread through a huge part of the planet.",
                "Around twenty thousand degrees. More than three times hotter than the surface of the Sun.",
                "Under a pressure tens of millions of times Earth's air."]),

    # ─────────────────────────────── ENDING ───────────────────────────────
    dict(id="end1", music="resolve", shot=dict(type="diagram"),
         lines=["So that's the fall.",
                "Seven minutes to go deeper than anything we've ever sent.",
                "Ninety-eight minutes to crush the strongest ship we could build.",
                "And six and a half days to come to rest, floating, five thousand kilometres down, without ever touching a bottom."]),
    dict(id="end2", shot=dict(type="space"),
         # Jupiter is mostly H and He like the Sun; ~80 Jupiter masses needed for hydrogen fusion (~0.075 M_sun).
         lines=["Jupiter is made of almost the same stuff as the Sun.",
                "It would need about eighty times more mass to start shining on its own.",
                "Instead, it's the biggest thing in the Solar System that never became a star."]),
    dict(id="end3", music="last", shot=dict(type="space"),
         lines=["Next time, we leave the planets behind.",
                "Because some planets don't have a star at all. And one of them could be heading our way."],
         gap=0.5, hold=1.0),
    dict(id="outro", shot=dict(type="space"),
         lines=["Subscribe, and fall with us again."],
         hold=3.5, card=dict(kind="endcard")),
]

META = dict(
    first_chapter="This is Jupiter",
    extra_chapters={"end1": "So that's the fall"},
    thumb_text="NO BOTTOM",
    alts=["We Simulated Falling Into Jupiter. The Ending Surprised Us.",
          "What If You Fell Into Jupiter? (Real Physics)",
          "Falling Into Jupiter: Every Minute Until Your Ship Breaks"],
    tags="jupiter, what if, falling into jupiter, gas giant, space documentary, astronomy, juno, galileo probe, metallic hydrogen, science explained",
    hashtags="#space #jupiter #whatif #astronomy #science",
    intro="""What would actually happen if you fell into Jupiter? There's no ground to hit — so how far down would you get?

Every number on screen comes from a physics simulation of the fall, anchored to the Galileo probe's real measurements: a 12-tonne, 4-metre sealed ship released at rest above the clouds. It passes the Galileo probe's final depth in 7 minutes, is crushed at the pressure of the Mariana Trench after 98 minutes — and an uncrushable version never reaches the centre at all. It floats.

How far down do you think you'd last? Tell us in the comments.""",
    sources="""• Galileo probe entry and descent (Dec 1995): entry ~47 km/s, ~58 min of data, last signal ~22–23 bar, ~152 °C — NASA/JPL Galileo Probe mission summary; Seiff et al. 1998, JGR 103, 22857
• Jupiter's cloud layers (ammonia 0.6–0.9 bar, NH4SH 1–2 bar, water 3–7 bar) and winds: e.g. Ingersoll et al. 2004, "Dynamics of Jupiter's Atmosphere", in Jupiter (Cambridge Univ. Press)
• Shallow lightning and "mushballs": Becker et al. 2020, Nature 584, 55; Guillot et al. 2020, JGR Planets 125
• Juno's titanium radiation vault: NASA/JPL, "Juno Armored Up to Go to Jupiter" (2010)
• Interior: 2 Mbar at ~0.81 Jupiter radii and the adiabat (5,700 K at 1 Mbar): Militzer & Hubbard 2008/2023; central temperature ~20,000 K
• Dilute ("fuzzy") core: Wahl et al. 2017, GRL 44, 4649; Militzer et al. 2022, PSJ 3, 185
• Magnetosphere "as big as the full Moon" in our sky: NASA Juno mission pages
• Diamond rain hypothesis: Delitsky & Baines 2013, AAS Division for Planetary Sciences meeting (unconfirmed)
• Fall simulation: dry adiabat from 166 K at 1 bar (R/cp = 0.30, μ = 2.3 g/mol), n = 1 polytrope interior, drag-limited descent with buoyancy. Depths below ~1,000 km are model estimates.""",
)
