# File 002 · Review log ("A Volcano Started Growing Under Our City")

## Pass 0: a new story (docs/00 S11)
- **The first File 002 draft was rejected by the CEO.** It retold File 001's event from another family. It is archived at `episodes/_archive/sun02-lost-at-sea`.
- **This File shares nothing with File 001:** no sky event, a different city, family, hazard, title and twist.
- **The premise is registered** in `docs/premises.md`, and the gate passes.

## Pass 1: research (sources in world-model.md)
- **The field:** about 53 volcanoes, each a one-off vent (Rangitoto erupted twice, so the lines say "almost all").
- **Rangitoto:** about 600 years ago. Footprints of people and dogs are preserved on Motutapu.
- **Warning time:** "a few days at best"; magma rises at about 0.01–0.03 m/s.
- **The danger zone:** base surges reach about 5 km, and newer estimates say up to 15 km.
- **Evacuation zones** change as the vent location narrows (Exercise Ruaumoko studies).

## Pass 2: first cold read of the script
| Where | Problem | Fix |
|---|---|---|
| Story length | 4:34 voiced, too thin | Added the breakfast setup (the fish exist before they die), drop-cover-hold, Ana testing her idea at night with Dad, the cellar and cat (CO₂ payoff), the ramp, the member-of-the-public news, "what if I'm wrong", the depth log, counting to the boom (speed of sound), the headcount, Rangitoto, the crater edge, Gas and Bump, schools now testing creeks |
| Magma arithmetic | 30 km to the surface in 3.7 days is 8 km/day, but the research says 1–2.5 | First felt quakes at about 10 km; about 1 km by Thursday 2 PM; the depth log and Mum's line now agree |
| field-map, lesson | "Every volcano erupted once" is false (Rangitoto twice) | "Almost all of them…", "Nearly every volcano…" |
| warm-road | A road warming from 6 km of rock is not credible | Warm gas coming out of a crack in the hump |
| drop-cover | Inserted between Lui's question and Ana's answer | Moved after Ana's answer |
| dinner-mon | "She was a volcano scientist" repeated the line before | "She was at the monitoring centre all night" |
| the-name | Repeated "the new hill" | "gave it its name" |
| gas-team | First person in a scene Ana isn't in | "on Kōwhai Street" |

## Pass 3: second cold read (whereabouts, credit, knowledge)
- **Mum:** at breakfast on Monday, then at the centre until Thursday evening (presence gate).
- **Credit:**
  - Ana connects the clues; Lui found the fish; Dad found the bump (said on screen in credit).
  - Mum's team confirms with instruments ("She just gave us three more" instruments).
- **Knowledge:**
  - The harbour estimate is public on Tuesday (mum-tv), so moving the zone is a visible change.
  - Ana tests her idea before calling Mum (night-creek, warm-road).
- **Doubt:** Ana's "what if I'm wrong" gets an honest answer about false alarms.

## Pass 4: stills review (full size)
- Fixed:
  - Mrs. Kaur rendered as a random young man → her own character design;
  - the cellar hatch drawn;
  - the family photo was showing File 001's eclipse plate → a new family-photo prop;
  - the motorway cars stacked into blocks → redrawn;
  - the funnel-shaped eruption column → billowing;
  - two views lost in an edit → restored;
  - "under the table" now drawn in front;
  - creek framing shows the fizz;
  - labels moved off the time tags;
  - the GPS screen brought into frame.

## Gates before render
- check-episode: lint clean; 103 questions (1 open); 122 lines signed; premise unique; title 62 characters; spoiler-free.
- Voice: WER 2.2%. Eight lines with Māori names were checked by ear (the English ASR can't spell them).

## Pass 5: filmstrip of the first render
- **The title card showed File 001's title, and the end card showed File 001's alien shell and "next File: The Reply".** Both cards now take their text and motif from the episode, with a check-episode gate (S12). File 001's end card no longer promises a File that won't be made.
- **Release QA failures:**
  - true peak −0.5 dBTP → render.ts now measures the encoded peak and tightens the limiter until it is ≤ −1.2 dBTP;
  - two idle alert inserts → they now move.
- Re-rendered.
