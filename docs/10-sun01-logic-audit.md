# 10 · File 001 logic audit — "The Sun Went Out" (v2.1)

Every question a sharp viewer could type into the comments, answered before we publish. If a claim
in the script can't be defended here, it gets cut or fixed. Script: `episodes/sun01-the-sun-went-out/script.ts`.

## The premise in one paragraph
At 06:44 local time a shell around the Sun **closes** (the cold open shows it, but nothing explains it). It was
not built that morning. It had been there, open and practically invisible, for at least a century, and at 06:44
every element of it turned and opened at once. The Sun's **mass** is still there, so Earth keeps orbiting. Its
**light** is caught by the shell and beamed away, so Earth freezes. The shell has to shed a small fraction of
that power as waste heat, which is why a thermal camera can see it. The family deduces each of these facts from
real evidence, in order.

## The shell: how something that size can close in one second (v2.1)
The obvious objection: *the Sun is enormous; nobody could build a shell around it in a morning.* Correct, and
nobody did. Building it took centuries; **closing** it takes seconds. The episode says so on screen
(`not-in-a-day` → `blinds` → `closed-them`), and every number below is checked.

| Question | Answer | Numbers |
|---|---|---|
| Where is it? | A swarm at about **2 solar radii** from the Sun's centre (1 R☉ above the surface), in many orbital rings. | r = 1.39×10⁹ m; area 4πr² = 2.4×10¹⁹ m². Orbital period there is about 8 hours. |
| What is it made of? | About 2×10¹³ thin **leaves**, each roughly a kilometre across and a micrometre thick, mirrored on the inside. | 2.4×10¹⁹ m² × 1 µm × 2,000 kg/m³ = **5×10¹⁶ kg**. That is one asteroid about **36 km** across. It is 2×10⁻¹⁴ of the Sun's mass, so orbits and tides are unaffected (clue 2 stays true). |
| How long to build? | Centuries, by self-copying factories mining that asteroid. That part happened long before 1919. | Hand-wave in the fiction, but the mass budget is tiny. |
| Why did nobody see it while it was open? | Each leaf was **furled**, like a closed umbrella, into a needle pointing at the Sun. It sat edge-on to the sunlight, like an open Venetian blind. A furled leaf is a kilometre-long needle a few centimetres thick (1 km² × 1 µm = 1 m³ of material), so even seen side-on it shades about 1/30,000 of its open area. | Satellites have measured the Sun's total brightness since 1978. It varies by about 0.1% over the solar cycle (0.1–0.3% over a 27-day rotation), so a dimming of roughly 0.001% is invisible. And it was always there, so it is part of every baseline. |
| Why not plain rigid slats? | Rigid slats that only rotate would not hide. At 2 R☉ the Sun covers 60° of the sky, so edge-on slats still shade the oblique light by roughly 20%. The elements must change their area, not just their angle: furled → unfurled. | The on-screen "slats" are bands of leaves seen from far away, and the blind is the metaphor. The physics is "furled needles that open". |
| Why didn't telescopes see it? | The 1–2 R☉ zone is the hardest place in the sky to watch. It is lost in the Sun's glare. SOHO's LASCO C2 coronagraph, the workhorse since 1996, images from about 2 R☉ outward with everything inside behind its mask, so the zone is seen mostly during total eclipses. There, the swarm's rings look like the corona's own streamers and plumes. | NRL LASCO handbook: C2 covers about 2–6 R☉. |
| How can it close in a second? | Each leaf only has to turn and unfurl about a kilometre. Edge speeds are about 1 km/s, nothing relativistic. A command at light speed crosses the whole swarm in about 15 s, or every leaf runs a pre-set clock. | π × 1.39×10⁹ m / c ≈ 15 s. |
| Does "8:20" still hold? | Yes. The shell is only 1 R☉ above the surface, so the last light leaves it 2.3 s later than it would leave the Sun's surface and reaches Earth after about 8 min 14 s. "About 8 minutes 20" is right, and the Venus and Jupiter delays (clue 1) are unchanged. | (215 − 2) R☉ / c ≈ 494 s. |
| Why doesn't it melt? | The leaves are mirrors. A good dielectric mirror absorbs about 0.1%, so a leaf runs at about 630 K. | 0.1% × 1.57×10⁷ W/m² radiated from two faces: T ≈ 630 K. |
| What does Ito's thermal camera see? | The outer faces radiate that waste heat: a disc **twice as wide as the Sun** ("Twice as wide."), glowing at a few hundred kelvin. A thermal camera sees it plainly against a 3 K sky. | About 2×10²³ W outward. At Earth that is about 0.7 W/m², 0.05% of the old sunlight, which is far too little to warm anything. Peak about 4.6 µm. |
| Where does the light go? | The mirrors pass the light from leaf to leaf towards a port at the pole, and it leaves as one beam **straight out of the plane of the planets**. It can't hit a planet, and it can't miss us by accident either. Dust in its path glows in the infrared (clue 4). | Known in physics as a "Nicoll–Dyson beam". The recoil is L/c ≈ 1.3×10¹⁸ N, which moves the Sun about 300 m in a year. |
| The one-second Sun | One band of leaves turns back for one second. Its light reaches us about 8 minutes later. | Shot `door-opens` → `one-second`. |

## The answer we hold for Episode 2 (not produced yet)
**"It was always there."** In File 002, Ito goes looking for proof that the shell was there before 06:44.
1. **The photographs.** He pulls every total-eclipse photograph since **1919**. The first is Eddington's eclipse,
   the one that proved Einstein right, and its print hangs on his workshop wall in File 001 (seeded on screen;
   the pinned comment asks who spotted it). In every one there are the same **three faint, perfectly straight
   lines** crossing the corona and coming out the other side: orbital rings of the swarm seen edge-on.
2. **They don't turn with the Sun.** Real streamers and plumes ride the Sun's 27-day rotation and change with
   the 11-year cycle. These lines stay fixed **against the stars**, because orbits keep their planes and the
   Sun's spin has nothing to do with them. Line up photos taken on the same date in different years and the
   lines match exactly. Astronomers filed them as "persistent coronal rays" and moved on.
3. **The mass budget.** One 36 km asteroid's worth of mirror. The factories were finished before anyone was
   looking.
4. **Why we never saw it:** the glare, the coronagraph masks, the blind. And it was there before any baseline.
5. **What it means:** the light went somewhere else, deliberately, along a line chosen to miss every planet.
   Then came the count, 1, 2, 3, and silence at Earth. Someone wanted us alive, in the dark, and listening.
   (The recoil of the beam also makes the Sun a very slow rocket. That is the File 003 hook: *it isn't just
   taking the light; it's steering the Sun*.)

Fiction markers: the lines in historical eclipse photographs, the leaves and the beam are invented. The
irradiance record, coronagraph coverage, light-travel times, the mass and temperature numbers are real
physics. Every real-world claim in the episode lists its source in the description (`renders/sun01-metadata.md`).

## The clue chain (each step uses only what the characters could observe)
| # | Shot(s) | Evidence on screen | Deduction | Physics check |
|---|---|---|---|---|
| 1 | `venus` → `at-the-sun` | Venus keeps shining for ~3½ min after the Sun goes dark | The event happened **at the Sun**, not between the Sun and us | Venus near greatest western elongation (morning star): Sun→Venus 0.72 AU = 361 s, Venus→Earth ≈ 0.69 AU = 345 s. Total 706 s vs 499 s direct, so Venus goes dark **207 s ≈ 3.5 min** later. An occluder near Earth would kill Venus's light and the Sun's at the same moment. |
| 1b | `jupiter-predict` → `jupiter-out` | Jupiter goes dark on schedule | Confirms it (a falsifiable prediction that comes true) | Sun→Jupiter 5.2 AU = 2594 s; with Jupiter 4.46 AU from Earth (morning sky, past opposition) the return leg is 2225 s. 2594 + 2225 − 499 = 4320 s = **72 min**. |
| 2 | `radio-tide` → `still-there` | The spring tide is normal height | The Sun's **gravity** is still there, so the Sun's mass is still there | The solar tidal force is about 46% of the lunar one. At spring tide (the Moon is a waning crescent, two days from new) the range scales with 1 + 0.46. Without the Sun it falls to 1.0, about **⅓ smaller**. The orbit (key-on-string) demo explains the consequence: no Sun mass means a straight-line exit; Earth still curves. |
| 3 | `its-warm` → `a-shell` | A faint warm disc where the Sun should be, wider than the Sun | Something large, at the Sun, at room-ish temperature | Any machine that absorbs 3.8×10²⁶ W and isn't 100% efficient must radiate waste heat in the infrared. A thermal camera sees heat, not visible light. Ito modifying a firefighter's camera and stacking frames for a faint target is a plausible stretch (the series' one "movie" liberty). |
| 4 | `thread` → `taking-it` | A warm line leaving the shell | The energy is being **sent** somewhere | A beam in vacuum is invisible, but interplanetary dust in its path heats and glows in the infrared ("dust, glowing in its path"). |
| 5 | `signal` → `thats-us` | Pulses of 1, 2, 3 from the Sun's direction, then silence | A deliberate count that stops at Earth | Radio travels at light speed; it arrives from the shell's direction. Pure fiction from here on: the cliffhanger. |

## Timeline + temperatures (HUD values; outside air, mid-latitude coastal city)
| Day | HUD temp | Source / reasoning |
|---|---|---|
| 0 (06:52) | 22 °C, falling 0.3 °C/h | A summer morning; the first-hour loss is small and visible on the watch. |
| 1 | 9 °C | Like an overcast night, but with no day after it. |
| 2 | 1 °C | |
| 3 | −4 °C | |
| 5 | −11 °C | Sea ice starts to form in sheltered harbours. Seawater freezes at about −1.9 °C, and calm water skins over quickly. |
| 7 | −18 °C | The widely cited estimate for a sunless Earth's surface average after one week is about −17.8 °C (0 °F). |
| 8 | −21 °C | |
| 30 | −35 °C | |
| 40 | −41 °C | |
| 100 | −52 °C | |
| 180 | −60 °C | |
| 300 | −68 °C | |
| 365 | −73 °C | The widely cited estimate after one year is about −73 °C (−100 °F). The oceans retain heat under the ice (see below). |

Notes:
- **Air does not freeze.** CO₂ deposition needs about −140 °C at its partial pressure, and O₂ and N₂ much colder. No "frozen air" appears in v2 (v1 risked it).
- **The ocean.** Ice insulates, so the surface freezes but the deep ocean stays liquid for a very long time (scenario estimates run from hundreds to thousands of years for full freeze-through). The script says "for years", which is conservative and true.
- **Ground heat.** At about 10 m depth the ground holds roughly the local annual mean temperature (about 8–12 °C at this latitude), and it changes very slowly. The metro is warmer than the surface from Day 8 onward. The tunnels still get cold on Day 100 because the heating and ventilation fail, not because the rock is cold.
- **Oxygen.** Atmospheric O₂ is about 1.2×10¹⁸ kg. All fossil-fuel and biomass burning consumes on the order of 10¹³ kg a year, so the supply lasts thousands of years or more even with zero photosynthesis. "Thousands of years" is conservative.
- **Aurora.** Coronal mass ejections take 1–4 days to arrive. A storm launched about 1 day before the shell closed arrives on Day 3, which matches "left the Sun four days ago" (Day 3 + 1 day before). Earth's magnetic field is unaffected, so an aurora is possible. The city is at about 55° N and the storm is strong, so a visible overhead aurora is plausible (as at 55° N in May 2024).
- **The Moon goes dark.** It has no light of its own. A waning crescent in the morning sky becomes a black sliver against the stars (rendered as a faint earthshine-free silhouette).
- **The fire.** On Day 7 the neighbour behind door 3B (same landing) burns furniture indoors: smoke you can see, carbon monoxide you can't (the real winter killer). Everyone evacuates.
- **The one-second Sun.** One band of the shell turns back open for 1 s; the light arrives about 8 minutes later, hence "Eight minutes later". The narrator cuts from the space shot to the surface, matching the delay.
- **Phones.** The networks jam from load in the first minute (it happens at every mass event). The grid stays up until Day 7, so phones still charge.
- **Lighting.** After 06:52 it is always night. On-screen light sources are only torches, candles, streetlights (until Day 7), the aurora, station lamps, the radio dial, the thermal screen and the one-second flash. No unmotivated daylight.

## v1 holes and their v2 fixes
| v1 problem | v2 fix |
|---|---|
| Parka at a summer breakfast | Costume chart below; it's a tee at breakfast and coats only from Day 1. |
| A magic watch counting down to the event | Removed. The watch is just a watch with a thermometer. |
| An aurora over a mid-latitude city, unexplained | High-latitude coastal city, a known CME, and the timing stated on screen. |
| The dog survives −20 °C outdoors | He sheltered against the metro vent's warm air, and that is how they find the tunnels. |
| A time-loop reset erased the stakes | No reset; the year happens. The series continues from Day 365. |
| We never learned what happened to the Sun | Four deductions plus a reveal; the "why/who" is the series question. |
| The hero looked angry | Toon rig: soft neutral default; `angry` is used only by two extras fighting over a heater. |
| The hero was sometimes smaller than Mira | Fixed height chart (You 1.0 / Ito 0.93 / Mira 0.6 / Biscuit 0.35); scenes set depth only. |

## Costume and continuity chart
| Span | You | Mira | Ito | Biscuit |
|---|---|---|---|---|
| Day 0, before the event | orange tee (home) | yellow tee, no hat | brown cardigan, slippers | red collar |
| Hour 1 (street, roof) | orange tee | yellow tee | cardigan | — |
| Day 1 onward (indoors) | orange parka, hood down | blue parka + red beanie | green wool coat | — |
| Outdoors from Day 7 | parka, hood **up** | parka + beanie | coat | — |
| Tunnels Day 30+ | parka, hood down | parka + beanie | coat | rounder from Day 30 (fan club) |
| Day 100 dark | hood up indoors (cold) | parka | (with the engineers) | — |

- **Props.** Ito's cane appears from Day 3; on the roof on Day 0 he carries the telescope (no cane), with adrenaline as the excuse.
- **Watch.** On your near (right) wrist throughout.

## v2.1 fixes (CEO review)
| Note | Fix |
|---|---|
| "A shell that big couldn't be built in a day" | It wasn't: built over centuries, opened in a second (section above). The cold open now shows slats turning, not plates flying in. Three new shots answer the doubt on screen, where viewers will ask it. |
| The hood looked too big for his head | The hood dome now sits just outside the skull line from every angle, including the back view. |
| Cars looked tiny next to people | Every prop is drawn in metres: `M()` in `src/env/sun/stage.tsx`, 1 m ≈ 206 px on the cast's plane. Street props sit in true perspective (camera 1.1 m high): cars 1.5 × 4.4 m, doors 2.1 m, lamps 4.5 m, worktop 0.9 m, fridge 1.85 m, tub rim 0.55 m, shelves 1.9 m, carriages 3 m, school bus 3.2 × 11 m. The `ScaleLab` composition lines the cast up against every prop on a metre grid. |

## Things we deliberately don't explain (the series hooks)
- Who built the shell, and why now.
- Where the beam goes.
- What the count means beyond "three".
- What we say back (the comment prompt).
