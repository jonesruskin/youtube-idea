# File 002 · World model: "The Sun Went Out While My Mum Was at Sea"

Same year as File 001: the Sun goes out on Day 0 and comes back on Day 365, and the File 001 world rules hold
(power, phones and internet keep working on the ground; `docs/16-sun01-world-model.md` §3). This File adds the sea,
the sky's radio, and a city that had never been cold. Rules: `docs/00-production-standards.md`.

## 1. The premise in one causal chain
1. Rosa Reyes is Second Officer on the cargo ship MV Amihan, crossing the Pacific to Manila, when the Sun goes out
   (Day 0, Monday 15 June 2026, 1:52 PM in Manila: the first day of the school year, a half day). Her son Tomás (12) lives with his grandmother, Lola Pilar,
   a retired coast-guard radio operator, as many Filipino seafarers' children do.
2. Satellites run on sunlight and their batteries last about an hour. Within hours GPS, satellite phones and the
   ship's internet are gone. The ship can still talk to Lola by shortwave, which bounces off the sky's electric layer
   (the ionosphere).
3. Sunlight makes the ionosphere. In the dark it thins every night. Mum's voice gets fainter, and on Day 4 the
   last call gets through. In it, Lola makes Rosa promise: every morning at six, call on channel six, in Morse,
   even if she hears nothing.
4. That night a storm breaks the Amihan's rudder: freezing air from frozen Asia over the still-warm sea. The ship
   can't steer and drifts. It misses its Day 6 arrival. The coast guard needs a position within 50 km. Without one,
   the dark ocean is too big to search.
5. Every morning at six, Lola calls the sky from her old coast-guard radio. Every clear night she has Tomás count
   shooting stars. He thinks it is grief.
6. On Day 48 the shipping company lists the ship as lost, and Tomás tells her to stop. She shows him the reason:
   - each shooting star leaves a trail 100 km up that reflects radio for a moment, linking radios up to about
     2,000 km apart, Sun or no Sun;
   - most meteors fall around 6 a.m., when our side of Earth faces forward along its orbit;
   - Rosa's radio is weak, so they need many more meteors. On the night of 12 August (Day 58) Earth crosses the
     Perseid dust stream.
7. At six in the morning on Day 59 the meteors carry Rosa's Morse in fragments. Tomás, whose ears are better than Lola's,
   copies them: the ship's name, its position (from Rosa's star sights, taken with a spirit level instead of the
   missing horizon), and "all safe".
8. Lola gives the coast guard the position, plus two days of current. The coast guard ship finds the Amihan on
   Day 60, and Rosa is home on Day 62.
9. On Day 365, at 1:52 PM, the Sun comes back, and Tomás is at the same bus stop. (Why it went out and came back is
   File 001's story: one line, OPEN on purpose here.)

## 2. Timeline arithmetic
| Event | When | Check |
|---|---|---|
| Sun goes out | Day 0 = Mon 15 June 2026 (first day of the Philippine school year, half day), 1:52 PM Manila (UTC+8) | File 001: 6:52 AM at UTC+1 (05:52 UTC) → 13:52 UTC+8 ✓; File 001 shows "MANILA 1:51 PM", the boy missing his bus |
| Satellites die | Day 0, by about 3 PM | batteries sized for about an hour in Earth's shadow |
| HF calls | Day 0 night (strong) → Day 4 night (last, faint) | ionosphere decays without sunlight |
| Ship's distance on Day 0 night | about 3,600 km east; arrival "in six more days" (Day 6) | 14 knots ≈ 620 km/day |
| Storm, rudder lost | Day 4 night, about 1,200 km east (≈15°N 132°E) | 2 days out |
| Missed arrival | Day 6; coast guard visit Day 7 | |
| Drift | about 10 km/day, west then north-west (North Equatorial Current, then the turn north along Luzon) | Day 4 → Day 59: ≈ 480 km W, 330 km N → 17°50′N 127°10′E |
| Distance Manila → ship on Day 59 | ≈ 750 km | inside meteor-scatter range (500–2,000 km) |
| Perseids peak | night of 12–13 August 2026 = Day 58 night / Day 59 morning | 15 June + 58 days = 12 August ✓ |
| Rescue | coast guard ship sails Day 59 morning, 750 km at ≈ 16 knots (30 km/h) ≈ 25 h → Day 60 | |
| Rosa home | Day 62 | |
| Sun returns | Day 365 = 15 June 2027, 1:52 PM Manila | File 001: "MANILA 1:52 PM", the boy in the light |
| Tomás's age | 12 then; narrates at 20 (2034) | |

## 3. The world (real physics; every scene obeys it)
| System | Rule | Shown or said in |
|---|---|---|
| Light | Manila is on the day side at 1:52 PM; the sky goes black at once; streetlights switch on by themselves (light sensors) | dark-bus, streetlights |
| Satellites | Run on solar panels; batteries last about an hour in shadow. GPS, satellite phones, ship internet, satellite TV gone by Day 0 evening. Phones, internet and TV on land run on masts and undersea cables and keep working (File 001) | call-freeze, sats, sats-out |
| Shortwave (HF) | Bounces off the ionosphere, which sunlight makes. In the dark it thins every night: Day 0 strong, Day 4 last contact. Only the sky-bounce dies; local radio is fine | hf-first, ionosphere, fainter, last-call |
| VHF (ship radio, channel 6) | Line of sight, about 40 km at sea. A ship 750 km away is far below the horizon | promise, bubble |
| Meteor scatter | Sand-grain meteors burn up about 100 km high and leave ionised trails that reflect VHF for a fraction of a second to a few seconds; radio amateurs use this for 500–2,000 km contacts. Rates peak around 6 a.m. local (the dawn side faces forward along Earth's orbit). Showers multiply the rate; the Perseids peak on 12–13 August every year | reveal-trail, reveal-dawn, reveal-perseids, perseids-sky, pings |
| Morse over FM | Pressing a radio's talk button sends a burst; on Lola's all-mode radio each burst sounds as a beep, so Morse goes through where words can't | promise, pings |
| Cold (Manila) | Surrounded by warm tropical sea, Manila cools much more slowly than inland cities. The top few metres of the ocean hold as much heat as the whole atmosphere above them. About +24 °C Day 1, +16 Day 7, +5 Day 20, −2 Day 30, −9 Day 48, −13 Day 59, −45 °C Day 365 (File 001 shows the boy in winter gear on Day 365) | hud temps, ocean-heat, no-coats |
| Cold at sea | Air −10 °C by Day 58 over open water; salt water stays liquid; no sea ice in the tropics in the first months | ship-drift, rescue |
| Storms | Freezing continental air pouring over warm sea makes violent storms (the same physics as polar lows) | storm-why, storm |
| Ship systems | Rudder lost = can't steer; the main engine is useless without steering. Generators run on the ship's fuel: heat and light for months. Food rationed for about two months | storm-rudder, ship-drift |
| Position without GPS | Star sights with a sextant. With no horizon visible in the dark, Rosa tapes a spirit level to it (aircraft navigators used bubble sextants) | no-horizon, bubble |
| Search and rescue | A rescue needs a position within about 50 km; the dark ocean east of Luzon is hundreds of thousands of km². A position must be moved forward by the current (standard drift calculation) | coastguard, call-joy |
| Refuge | A few metres underground stays about +10 °C (File 001 physics). The building's residents move into the basement car park on Day 30 | basement |
| Power, phones | Work all year (Luzon grid: coal, gas, geothermal, hydro). Lola calls the coast guard and the shipping company by phone | call-joy, company |
| Planes | Grounded worldwide by the cold within weeks (File 001); none could search a dark ocean without a position anyway | coastguard |
| Human cost | Hundreds of ships missing worldwide on Day 35 | missing-news |

## 4. Characters: where everyone is, and why
| Day | Tomás | Lola | Rosa | Captain Rivera | Cmdr Joy Santos |
|---|---|---|---|---|---|
| 0 | bus stop, then Lola's flat | flat, at her radio | Amihan, bridge | bridge | coast guard station |
| 1–4 | flat | flat (radio nightly) | bridge (calls) | bridge | station |
| 4 night | asleep | flat | storm on the bridge | bridge | station |
| 7 | coast guard station with Lola | station | adrift | ship | station |
| 8–29 | flat; roof at night; Morse lessons Day 20 | flat; radio at 6 every morning | adrift, Morse at 6 every morning, star sights | ship | station |
| 30–58 | basement car park; radio cable to roof | basement; radio at 6 | adrift | ship | station |
| 48 | basement; roof at night (reveal) | same | adrift | ship | station |
| 59 | basement radio before dawn, copies the pings | radio, phones Joy | sending Morse | bridge | station → sails |
| 60 | basement | basement | rescued | rescued | coast guard ship |
| 62 | pier | pier | home | — | pier |
| 365 | bus stop, 1:52 PM | bus stop | bus stop | — | — |

## 4b. Who knows what, when (docs/00 D11)
| Fact | First known by | How | Shot | Others learn it |
|---|---|---|---|---|
| Satellites die; HF still works | Lola (career radio operator) | knowledge | sats, hf-first | Tomás, the viewer |
| The ionosphere is fading | Lola | she hears it each night | fainter | Tomás |
| Six o'clock, channel six, Morse | Lola chooses it; Rosa promises without knowing why | last call | promise | Tomás hears the promise; the reason only on Day 48 |
| The rudder is gone | Rosa and the crew | storm | storm-rudder | Lola and Tomás only on Day 59 (pings) |
| Meteors reflect radio; dawn peak; the Perseids | **Lola** (thirty years at Manila coast radio) | experience | reveal-trail, reveal-dawn, reveal-perseids | Tomás on Day 48; Rosa at the pier |
| Tomás hears faint beeps better than Lola | Tomás (Day 48 chirp, dismissed) | his ears | chirp | Lola on Day 48 ("from now on, you listen") |
| The ship's position | Rosa (star sights) | bubble sextant | bubble | Tomás copies it on Day 59; Lola tells Joy |
| Lola heard them | Rosa | Lola's "R R R" reply in the pings | ship-hears | — |

## 5. Question bank
At least 100 questions. Each one ends with the shot ids that answer it, in brackets, or with **OPEN (series)**.
At most two may be OPEN. `scripts/check-episode.ts` checks this.

### A. Premise mechanics
1. Who is telling this story, and how old was he? Tomás, twelve then, grown up now (title, bus-run)
2. Why is the narrator in Manila when the Sun goes out? It's the first day of school and he missed the bus home (bus-run, bus-gone)
3. Where is his mum? An officer on a cargo ship crossing the Pacific (title, videocall, hf-rosa)
4. Who looks after him? His grandmother, Lola, who raised him while Mum was at sea (lola-intro)
5. Why is that normal? Many Filipino seafarers' children are raised by grandparents (lola-intro)
6. What was Lola's job? Coast-guard radio operator for thirty years (lola-job)
7. Why can't Tomás reach Mum after the first minutes? Her ship's internet comes from satellites (cant-call, sats-why)
8. Why do satellites stop? They run on solar panels; batteries last about an hour (sats, sats-out)
9. How do they talk to the ship then? Shortwave radio bouncing off the sky (then-radio, reach-ship, ionosphere)
10. Why does shortwave fade? The ionosphere is made by sunlight and thins every night (fainter, fading-why, ionosphere-fade)
11. What is the promise? Every morning at six, channel six, in Morse, even with no answer (promise, promise-2, promise-yes)
12. Why does Rosa think it's pointless? Without the sky's mirror nothing should reach (promise-ship)
13. Why does the ship stop coming? A storm breaks the rudder; it drifts (storm, storm-rudder, adrift)
14. Why can't the coast guard search? No position; the dark ocean is too big (cg-position, cg-dark)
15. What is Lola doing every morning? Calling the ship on channel six (ritual, ritual-call, ritual-key)
16. Why does she have Tomás count shooting stars? She is measuring when most of them fall (count-roof, count-book, reveal-count)
17. How can a shooting star carry a radio message? Its trail reflects radio for a moment (reveal-roof, reveal-trail)
18. Why six o'clock? Most meteors hit around dawn, when our side faces forward (reveal-dawn, reveal-six, most-fall)
19. Why weren't they heard for weeks? Rosa's radio is weak and far away; too few meteors (reveal-why)
20. What changes on Day 58? The Perseid shower: far more meteors (reveal-perseids, perseids-diagram, perseids-sky)
21. How do they get the position? Rosa's Morse comes through in fragments; Tomás copies them (ping-1, ping-more, ping-pos, ping-safe)
22. Who actually heard it? Tomás; Lola's hearing is too poor (chirp, confess, you-listen, he-heard)
23. Does the ship know it was heard? Yes, Lola's R R R reaches them (lola-reply, ship-hears)
24. How is the ship found? The coast guard sails to the position plus the current (call-joy, call-joy-2, joy-sails, rescue)
25. Is Mum safe? Yes, home on Day 62 (rescue-deck, pier, hug)
26. Why did the Sun go out and come back? OPEN (series)

### B. Physics and timing
27. What time does the Sun go out in Manila? 1:52 PM (dark-bus)
28. Why do the streetlights switch on? Light sensors think it's night (streetlights)
29. How long do satellite batteries last? About an hour without sunlight (sats)
30. How high is the radio-reflecting layer? Hundreds of kilometres up (ionosphere)
31. How fast does it fade? Night by night, gone after Day 4 (ionosphere-fade, last-call)
32. How high do meteors burn up? About 100 km (reveal-roof, reveal-trail)
33. How far apart can meteor-scatter radios be? Up to about 2,000 km; the ship is 750 km away (reveal-trail)
34. Why can't they talk directly? The Earth's curve blocks the straight path (reveal-trail)
35. Why are there more meteors at dawn? The morning side faces forward along the orbit (reveal-dawn)
36. What are the Perseids? Dust from a comet that Earth crosses every 12 August (perseids-diagram)
37. How many meteors an hour? About a hundred at the peak (perseids-diagram)
38. Why so clear this year? No sunlight and no moonlight (perseids-crowd)
39. Why does Manila cool slowly? The warm sea around it holds a lot of heat (ocean-heat, ocean-heat-2)
40. How much heat is in the sea? The top few metres equal all the air above (ocean-heat-2)
41. Why such a violent storm? Freezing air from frozen land over a warm sea (storm-why)
42. Why can't Rosa use the stars at first? No horizon to measure from in the dark (no-horizon)
43. How does she fix it? A spirit level taped to the sextant (bubble)
44. Why move the position forward? The ship keeps drifting with the current (call-joy-2, joy-sails)
45. How accurate was Mum's position? Eight kilometres off (rescue)
46. What time do the pings start? Two minutes past six (ping-1)
47. When does the Sun return in Manila? 1:52 PM on Day 365 (sun-back)
48. How do they know Day 365? The Day 300 news (day300)

### C. Power and communications
49. Does Manila lose power? No: lights, lifts, TV and phones keep working (flat-arrive, news-shell, company)
50. Why does the phone work but not the ship? Land phones use cables and masts; ships need satellites (call-mum, sats-why)
51. Does GPS work? No, from Day 0 (sats-out, hf-rosa)
52. How does the ship navigate at first? By compass (hf-rosa)
53. How does Lola talk to the coast guard? By phone (call-joy)
54. Why channel six? It's a ship-to-ship channel any ship's radio has (promise)
55. Why Morse, not voice? A meteor reflection lasts a second; Morse letters can be pieced together (promise-2, ping-lola)
56. How do you send Morse on a voice radio? Press the talk button long and short (promise-2, ship-six)
57. Why does the radio make a chirp? Each burst of Morse comes through as a beep (ping-1, chirp)
58. Where is the antenna after the move? On the roof; Tomás ran the cable twelve floors (cable-run)
59. How does the shipping company give news? By phone (company)
60. Why does the TV still show news? TV and internet run on the ground (news-shell, missing-news)

### D. Transport and jobs
61. Why didn't Tomás go home by bus? He missed it, a minute before (bus-run)
62. Why doesn't the ship just sail home? No rudder (storm-rudder)
63. Why not send a plane? Without a position, the dark ocean can't be searched (cg-dark)
64. How fast is the rescue? The coast guard sails within the hour (joy-sails, cg-ship)
65. How long does the rescue take? About a day (rescue)
66. Why is the coast guard officer helping? She trained under Lola (coastguard)
67. How many ships are missing? More than two hundred (missing-news)

### E. Food and water
68. Does the ship run out of food? Food for two months, rationed (ship-food)
69. How does the building eat underground? Shared rice from one pot (basement-warm, basement)
70. Does Manila get snow? Almost none: frost, and by Day 365 a thick white rime on every roof (reveal-roof, bus-wait)

### F. Health and safety
71. How do people stay warm with no coats? Towels and sheets, then the car park (no-coats, basement)
72. Why the car park? A few metres down stays about ten degrees (basement-warm)
73. Is the ship warm? Generators give heat; frost on the windows by Day 55 (ship-55)
74. Is anyone on the ship hurt? All safe (ping-safe, rescue-deck)
75. What does the cold do to Manila? A city with no heaters and no coats (no-coats)

### G. Characters and motives
76. Why does Lola keep calling? She knows a way that might work (not-all, reveal-trail)
77. Why doesn't she tell Tomás? It was only a little hope (why-not-tell)
78. Why does Tomás think she's praying? Nobody answers for weeks (ritual-tomas, key-open)
79. Why does he snap at her? The company lists the ship as lost (company, stop, stop-2)
80. Why does he dismiss the chirp? Lola didn't react, so he thought it was static (chirp-static)
81. Why does Rosa keep calling? She promised (promise-yes, ship-six, ship-55)
82. Why does Lola turn off the TV? Reaching Rosa matters more than the news (tv-off)
83. Who decides to add the current? Lola asks; the commander works it out (call-joy-2, joy-sails)
84. Why does Lola want the bus stop on Day 365? It's where Tomás saw it go (bus-wait, bus-when)
85. Who counts the loudest now? Mum (loudest)
86. Who gets the credit at the pier? Tomás heard; Lola knew the trick (he-heard, bounced)

### H. Continuity
87. Where is Mum on Day 0? On the bridge, at night too (videocall, hf-rosa)
88. Where are Lola and Tomás each morning? At the radio, flat then car park (ritual, basement-six)
89. When do they move underground? Day 30 (basement)
90. What day is the storm? Day 4 night (storm-wave)
91. When should the ship have arrived? Day 6 (hf-six, day6)
92. When do they visit the coast guard? Day 7 (coastguard)
93. When does Tomás hear the first chirp? Day 48 (chirp)
94. When is the rescue? Day 60 (rescue)
95. When is Mum home? Day 62 (pier)
96. Does the cold open match the story? Day 20, the six o'clock ritual (six-am, key-open)
97. Is the boy the same as the File 001 bus-stop boy? Yes, same stop, same times (bus-run, sun-back)

### I. Picture logic
98. Which way does the antenna point? East, toward the ship (count-roof, reveal-roof)
99. Do the Perseids come from one direction? Yes, they fan out from one point (perseids-sky)
100. Is there a horizon at sea at night? No: sky and sea are both black (no-horizon)
101. Does the GPS screen say why? NO FIX (hf-rosa, storm)
102. Is the ship's drift drawn the right way? West with the current, then north (drift-map)
103. Do clocks match the times said? 5:59, 6:00, 6:26 (six-am, ritual-call, ship-hears)
