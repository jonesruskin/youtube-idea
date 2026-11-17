# 18 · Premise bank: how the channel gets to hundreds of Files

> CEO: "I plan on going for hundreds of episodes… I need the hook, the clock, the mystery, the twists and turns, the
> science, the virality in all the upcoming videos."

## The machine (what makes Files repeatable)
A Blink File is always the same five-part contract (docs/00 S13–S16), and the contract is checked by scripts, not by
anyone's memory:

| Stage | Gate (exit 1 = stop) | What it stops |
|---|---|---|
| 1 Treatment (one page) | `check-treatment.ts` | no hook, no clock, no mystery owner, under 4 twists, unsourced science, a re-used premise |
| 2 Physics pass | world model + 100-question bank (`check-episode.ts`) | endings real physics forbids (the Moon "rings" ending was killed here) |
| 4 Script | `lint-episode.ts` Story gate | hook after 0:30, clock gaps, mystery answered too early, twists bunched or missing, heart paid off too soon |
| 4 Script | dialogue ledger, feeling, delivery, facing, faces, place, props, there-and-back | every defect in `scripts/gate-mutations.ts` |
| 6 Any lint change | `test-gates.ts` | a gate that silently stopped working |
| 9 Render | `text-safe.ts` inside `render.ts` | hidden, cropped, overlapping or covered labels |
| 10 Release | `qa-release.ts`, `qa_voice.py` | audio, motion, frame and speech failures |

A premise enters production only through stage 1. If a section of the treatment is hard to fill, the premise is dropped
and the next one from this bank is tried: that costs an hour, not a build.

## The grid (where premises come from)
Pick one cell from each column; a File is new if no released File shares its first two cells.

| What breaks | How we count it | Who knows more than they say | Where we watch from |
|---|---|---|---|
| the sky (Sun, Moon, stars, night) | days | a grandparent with a record | a harbour town |
| the ground (spin, tilt, quakes, magnetism) | distance / height | a scientist nobody funded | a farm |
| the sea (tides, level, currents, salt) | temperature | a child nobody asks | a tower block |
| the air (oxygen, wind, sound, rain) | hours of light | a worker who saw it first (pilot, miner, lineman) | a ship / a train |
| life (insects, plants, sleep, a germ of the gut) | a shrinking map | an official who was told to wait | a school |
| our machines (power, satellites, clocks, radio) | a countdown someone else set | someone who caused it by accident | a border / an island |

## Seed premises (each still has to pass stage 1 and stage 2; none is approved by being listed)

| # | Working title | Hook picture | Clock | Mystery owner | Last-minute turn |
|---|---|---|---|---|---|
| 1 | The Sun Went Out at Breakfast (released) | stars at the kitchen window | days | Mr. Ito | the reply is to him |
| 2 | The Moon Got Closer Every Night (treatment passed) | giant Moon, sea climbing the street | km to the Moon | Nana Odile | the Moon stays |
| 3 | The Sky Turned Red and the Power Died | aurora over the equator, every screen dark | days to relight | the lineman who cut his own town off first | his town is the only one that can restart the rest |
| 4 | The Wind Stopped Everywhere | a flag, a kite and a wave all hanging still | days without rain | a glider pilot's logbook | the wind was being held, not lost |
| 5 | Every Clock Started Running Slow | noon arrives in the dark | minutes lost per day | the town's last watchmaker | it is the Earth, and it is speeding back up |
| 6 | The Stars Went Out One by One | a child's constellation chart with holes in it | stars left | a blind radio astronomer | something is arriving between us and them |
| 7 | The Bees Left on the Same Day | one long river of bees over a motorway | harvests left | a beekeeper who followed them | they were not fleeing; they were being called |
| 8 | The Sea Went Out and Kept Going | a harbour of boats lying on dry sand | km to the water | the lighthouse keeper's daughter | it comes back in one afternoon |
| 9 | Nobody Could Sleep | a city with every window lit at 4 a.m. | nights awake | the one child who still dreams | the dream is the same for everyone |
| 10 | The North Moved | every compass in a ship's bridge turning together | degrees per day | a pigeon racer | migrating birds found the new pole first |
| 11 | It Rained for a Year | a street where the gutters run uphill with overflow | days of rain | a dam's night guard | the water is not falling; it is being returned |
| 12 | The Night Got Longer | sunset at 3 p.m. in July | minutes of daylight | an old sundial maker | the day is not shrinking: the year is |
| 13 | Sound Got Quieter | a brass band marching in silence | metres a shout carries | a deaf girl who notices first | the air is thinning, and she can teach the town to talk |
| 14 | A Second Moon Appeared | two shadows on a playground | days until they meet | an amateur who named it years ago | it is the first Moon's missing piece |
| 15 | The Ice Came Back | frost on a mango tree | km of ice from the pole | a ski-lift mechanic in the tropics | the cold has a border, and it stops at a line someone drew |
| 16 | Every Satellite Fell | a meteor shower that lasts all night and lands | satellites left | a retired ground-station cleaner | the first one was pushed |
| 17 | The Colours Faded | a market where every stall is grey | colours left | a painter going blind | the last colour is one nobody had a name for |
| 18 | The Ground Hummed | water in every glass standing in rings | the note rising | a piano tuner | the hum is a count, and it ends on a date |
| 19 | The Birds Flew the Wrong Way | geese heading north into winter | km off course | a girl with one tagged swift | they are right; the seasons moved |
| 20 | The Tide Stopped | a sea like a pond, for the first time ever | days with no tide | a surfer's grandmother | the Moon is still there; the water has been made heavier |

"Still has to pass" is literal: #2 lost its original ending at the physics pass, and the volcano File would have failed
stage 1 (no hook inside 0:30, no mystery owner, fewer than four reversals).
