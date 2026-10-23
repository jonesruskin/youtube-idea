# 10 · File 001 logic audit — "The Sun Went Out" (v2)

Every question a sharp viewer could type into the comments, answered before we publish. If a claim
in the script can't be defended here, it gets cut or fixed. Script: `episodes/sun01-the-sun-went-out/script.ts`.

## The premise in one paragraph
At 06:44 local time a shell of dark plates closes around the Sun (the cold open shows it, but nothing
explains it). The Sun's **mass** is still there, so Earth keeps orbiting. Its **light** is caught by the shell
and beamed away, so Earth freezes. The shell has to shed a tiny fraction of that power as waste heat, which is
why a thermal camera can see it. The family deduces each of these facts from real evidence, in order.

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
- **The one-second Sun.** A seam opens for 1 s at the shell; the light arrives 8 min 20 s later, hence "Eight minutes later". The narrator cuts from the space shot to the surface, matching the delay.
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

## Things we deliberately don't explain (the series hooks)
- Who built the shell, and why now.
- Where the beam goes.
- What the count means beyond "three".
- What we say back (the comment prompt).
