# Quality gate: required before any upload

Every episode has to pass this gate. **A FAIL blocks the upload.** A WARN needs a written decision in the episode's QA report.

## How to run it
```bash
python -m engine.render <ep> --stills         # preview stills of every beat (with QA_LOG=build/<ep>/qa_text.log)
python tools/qa.py <ep> pre                    # automated pre-render gate → build/<ep>/qa_report_pre.md
#   → review build/<ep>/review/beats_*.jpg against the manual checklist below
python -m engine.render <ep> && python tools/score.py <ep> && tools/finalize.sh <ep>
python tools/qa.py <ep> post                   # automated post-render gate → build/<ep>/qa_report_post.md
```

## Automated checks (`tools/qa.py`)
| Check | Rule | Why it exists |
|---|---|---|
| Line coverage | Every narration line has its own visual beat | Viewers want to *see* what is being said. A picture of Earth with a voice over it is not enough |
| Pacing | Beats are 0.8–12 s long | Shorter beats feel frantic. A visual held longer than 12 s loses attention |
| Motion | No beat is frozen (frame change < 0.6) and few are near-static (< 1.6) | Frozen stars or a static picture looks amateur |
| Exposure | No unintended near-black frames, and ≤ 5% clipped pixels | Murky or blown-out frames hurt retention |
| Glyphs | The text renderer raises an error if a character is missing from its font | The ☉ and ≈ symbols showed up as empty boxes in v1 |
| Safe area | No explainer text leaves the title-safe area; labels are shifted back inside automatically | Labels were clipped at the frame edge in v1 |
| Variety | No run of 5+ consecutive beats that look near-identical (mid-frame thumbnails compared) | Episode 2's first cut held one orange-haze composition for ~3 minutes |
| Text collisions | No two labels' ink boxes overlap in any still (checked on the tight glyph bounds) | v2 review: EUROPA sat on IO; "CAUSE: NOTHING VISIBLE" sat on the chart's axis title |
| Word sync | ≥ 50% of words are confirmed by line-level speech recognition; otherwise timing falls back to an estimate from the line timings | Speech recognition missed whole sentences on one segment |
| Runtime | ≥ 8:00 | Mid-roll ads |
| Black frames | No black gap ≥ 1 s | Accidental dead air |
| Frozen video | Flags stretches of ≥ 2.5 s with no visible motion | Retention killer |
| Loudness | −14 ± 1 LUFS integrated, true peak ≤ −1 dBTP | YouTube normalisation |
| Voice vs music | Speech is ≥ 3 dB above music-only passages | In v1 the music was as loud as the voice |
| Captions | ≤ 2 lines, ≤ 42 characters per line, ≥ 0.7 s per cue, no overlaps | Readability |
| Thumbnail | 1280×720 and < 2 MB | YouTube specs |

## Manual checklist (review the beat sheets)
Each item becomes a ✅ or a note in the QA report.

**Explains the line**
- [ ] Each beat *shows* the claim in its line: a number becomes a counter or bar, a comparison becomes side-by-side, a process becomes animation, a place becomes the place.
- [ ] Key words land on screen within about 0.3 s of being spoken (label, cross, tick, arrow).
- [ ] No beat could be swapped for a stock "planet in space" shot without losing meaning.

**Craft**
- [ ] Composited plates feel shot together. The sky lights the land (atmospheric perspective, haze, light wrap), and there are no flat black cut-outs. *(v1: the stargazer sky and landscape looked pasted together.)*
- [ ] Every camera move moves the starfield too. Zooms and pans apply to the background. *(v1: stars stayed fixed while the camera zoomed.)*
- [ ] Reflections are soft and rippled, never mirror copies. *(v1: the tide city looked like a barcode with a mirrored copy.)*
- [ ] Silhouettes read at phone size: a person, telescope, tree or house is clear in 1 second.
- [ ] No text overlaps a chapter or ending card, another label, or an important subject. *(v1: "The Wanderer" sat on top of the timeline; a stat collided with a planet.)*
- [ ] Labels never sit on top of the planet or object they describe. Place moon labels radially *outward* from the parent, put long labels on 2 lines beside the subject, and send callouts toward empty sky. *(v2 review: "THE SUN IS LOSING" and "COLDER THAN ANTARCTICA" ran across Earth's limb, and Ganymede's subtitle crossed Jupiter.)*
- [ ] No lighting artefacts: when a shot is dimmed (freeze, night, eclipse), highlights dim with it. *(v2 review: ocean glint stayed at full strength on a darkened Earth and read as a white smudge. Specular is now scaled by exposure.)*
- [ ] Text is legible on a phone. Labels are ≥ 22 px at 1080p after scaling, with a dark panel behind busy areas.
- [ ] Diagrams are honest about scale. If true scale doesn't fit, zoom out or use an inset, and never draw an off-screen circle. *(v1: the Moon-for-scale circle was bigger than the screen.)*
- [ ] Colour language is consistent: orange = black hole or key value, blue = Earth or water, red = danger or "no", green = "yes" or survives.

**Truth**
- [ ] Every on-screen number matches the narration, the simulation or a cited source (see the science notes in `script.py`).
- [ ] Anything illustrative is labelled as illustrative ("ILLUSTRATIVE", "NOT TO SCALE").

**Sound**
- [ ] Booms and risers land on chapter and ending cards, not in the middle of a sentence.
- [ ] The narration is intelligible over the music. A speech-recognition pass on the final mix should match the script.

## The 30-second rule (founder, Nov 2026; every episode from #3)
Episode 1's analytics: 5.5 % CTR and suggested-video traffic (packaging works), but only 28 % average view
duration. Both shipped episodes spend their opening on set-up before the thing in the title happens (the black
hole is named at 0:27, then a title card at 0:45; the Jupiter fall starts at 1:40).
- **The title's promise starts on screen within 30 s.** Shown happening, not described. `META["promise_at"] =
  (segment, word)` names that moment; *gate:* `qa.py pre` (30-second-rule) fails if it is later than 0:30.
- **No title card after the hook.** The story never stops for branding once it has started. *Gate:* `qa.py pre`
  fails any `card=dict(kind="title")` that is not at 0:00.
- The cold open ends on an open question the rest of the video answers (the strangest outcome is teased, not shown).

## Originality (founder, Nov 2026; every episode from #3)
The founder's review: thumbnails had become one template (two lines of heavy white text with one orange word over a
planet: "30 YEARS LEFT", "STILL NO GROUND", "11 DAYS"), and episodes recycled shots (Episode 1's galaxy, telescope
and vent shots appeared again in Episode 3).
- **No recycled shots.** Every shot is built for its episode. Engine tools (camera, planet renderer, star sphere)
  are shared; shots are not. *Gate:* `qa.py pre` (originality) fails any beat that uses a scene from another
  episode's package.
- **A new thumbnail idea every time.** Start from what only this video has, not from a text template. Big numbers
  and the white-plus-orange headline are retired. *Gate:* `META["thumb_concept"]` must be present and differ from
  every earlier episode's.
- **At least three signature set pieces per episode** that the channel has never shown before (written in the
  script's docstring).

## Creative distinctness (founder, Nov 2026; every episode from #4) — `tools/creative_gate.py`
The founder's review of Episode 3: "make each video distinct and not a copy of one another… bring creative
variations to the underlying story… don't stick to your defaults." Looking back honestly, Episodes 1 and 3 were the
same story (an intruder arrives, then hot / cold / thrown-out endings, then "So, should you worry?"), all three used
the same second-person narrator, and Ep3 reused 16 narration phrases from Ep1. Every one of these is now a check:
- **creative-brief:** `<ep>/BRIEF.md` is written *before* the script, with `## Story shapes considered` (≥ 3),
  `## Chosen` (and why) and `## Unlike earlier episodes` (≥ 3 concrete differences).
- **creative-ledger:** `META["creative"]` names the story shape, hook, ending, thumbnail device and signature shot
  (none may resemble any shipped episode), plus point of view, narrator, time scale and palette (none may resemble
  the last two). Shipped episodes live in `cinema/creative_ledger.json`; add each one when its master is approved.
- **title-form:** no title opens with the same two words as an earlier one or shares a 3-word phrase with it.
- **script-reuse:** no 5-word narration phrase lifted from an earlier episode (more than 2 fails).
- **shot-grammar:** `META["shots"]` classifies every scene (pov, ride, orbital, macro, micro, map, data, diagram,
  title, interior, archive). Needs ≥ 4 kinds, ≥ 25 % of the runtime seen from inside the world (pov/ride),
  ≤ 30 % diagrams and data, and no single scene over 30 % of the episode.
- **thumbnail-text:** no numbers, ≤ 3 words. The number-and-time headline is retired for good.
- **thumbnail-look:** the thumbnail must not resemble any earlier one (colour histogram + structure), and the two
  alternates (B, C) must be genuinely different ideas, not a crop or a variant of A.
  The bar is Ep3's thumbnail A: an everyday object that makes the cosmic event personal (the circled calendar date).
- **frame-reuse (post):** ≤ 2 % of the final video's frames may match any earlier episode's frames.
- **self-repeat (post):** ≤ 6 % of frames may repeat a picture from more than 45 s earlier in the same episode.

## Lessons from Episode 1 (black hole)
1. **One shot per segment is not enough.** Plan visuals per *line* (beat sheet) before writing any code.
2. **Integrate, don't paste.** Use atmospheric perspective, light wrap and grain shared across every layer.
3. **Camera discipline.** Every zoom or pan goes through `Cam`, so stars, planets and diagrams move together.
4. **Fonts lie.** Check glyphs automatically, and never assume a mono font has math symbols.
5. **Speech recognition misses sentences.** Transcribe line by line, and fall back to line-timing estimates.
6. **Run the gate before the long render.** It caught 8 glyph defects, 6 clipped labels and a 0-second beat in minutes, not hours.
7. **Review the finished cut at full resolution, not only contact sheets.** Thumbnails hide collisions. The v2 full-res pass found 5 defects that were invisible at contact-sheet size, and two of them led to new automated checks.

## Lessons from Episode 2 (Jupiter)
1. **Simulate first, then write the numbers.** Starting the fall above the clouds instead of at the 1-bar level changed three narrated numbers. The script was corrected before rendering, so narration and on-screen counters agree.
2. **One clock for picture and HUD.** Every descent frame reads depth, speed, temperature and pressure from the simulation at the same sim time. The sim clock must never run backwards between beats, except in a deliberate flash-forward.
3. **Long same-environment stretches need a shot list.** Vary framing (close, wide, high, low, left), add motion structure (plumes, shimmer, particles), and cut to a diagram every few beats.
4. **Effects must start on their line.** The glow now begins at the Draper point, exactly when the narration says "the darkness starts to glow", not two beats early.
5. **Check the phone-size thumbnail.** The first thumbnail was overexposed and the planet had no edge. The fix: pull back so the limb curves against black space, and boost saturation.
6. **Check procedural textures at every zoom level.** The cutaway's noise tile was capped at 9,000 km, so with the whole planet on screen it repeated every ~70 px like wallpaper. Texture scale must follow the zoom, and a second rotated layer hides any period. The full-cut review caught it; stills at one zoom did not.
7. **Panels must clear the ship, not just other text.** The diver panel passed the text-overlap check but sat on top of the ship and its beacon. Check the ship's screen box against every panel in its beats.

## Lessons from the founder's review of Episodes 1–2 (now enforced by the gate)
8. **No cut when only the diagram changes.** If the scene stays the same (same planet, same descent, same sky) and only
   an overlay changes, there must be no cut and no dissolve of the picture. The engine links consecutive beats that
   share a scene into **one continuous shot**: the camera glides from one framing to the next (1.4 s), and only the
   overlays crossfade. Cuts are for a real change of place or view. Build new scenes with `@scene_factory` and keep
   camera drift on `ctx.ru(t)` (progress through the whole shot), never on the beat's own `u`.
   *Gate:* `tools/continuity.py <ep>` lists every boundary as CONT or CUT; `qa.py pre` fails a cut between
   near-identical stills; `qa.py post` runs `tools/jumpcuts.py` on the finished video and fails any same-scene jump.
9. **Annotations must be computed from the thing they point at.** The Great Red Spot circle was drawn at the disc
   centre while the planet's rotation had moved the spot away. Every marker on a rendered body now comes from that
   body's real position (`grs_outline()` projects the spot's measured texture coordinates through the same
   rotation as the globe). Never hard-code "it's at the centre".
10. **A fall must always read as a fall.** The camera falls with the ship, so the ship's height on screen is fixed
    (`SHIP_Y`); it never moves up during the descent (it read as climbing). The world streams upward by an amount
    tied to depth (`fall_scroll(z)`), so it is continuous across beats, stops when the ship stops and never runs
    backwards; streaks are exactly one frame of motion, bright at the leading end. The old speed × time scroll
    jumped every frame and strobed. *Gate:* `qa.py pre` fails any descent beat where the ship rises on screen.
11. **The ending teases the next episode in the published order.** `EPISODES.md` is the order. Each script's META has
    `slot`, `next_slot` and keywords the teaser must say. *Gate:* `qa.py pre` fails a teaser that points anywhere
    but the next row.
12. **Masters wait for approval.** Previews go to GitHub for review; the 1080p master is added to Git LFS only after
    the founder approves (`MASTER=1 tools/finalize.sh <ep>`), saved as `<YouTube title>.mp4` so the uploaded file carries the video's name.
13. **The story's order and geometry must match the simulation.** The black hole episode showed the hole beyond
    Earth (a tug of war) and then suddenly in front of the Sun, without ever passing Earth; the simulation says it
    passes Earth first (0.39 AU, 16 days before the Sun pass), and it never crosses the Sun's disc as seen from
    Earth (closest 7°). The Moon is lost at the Earth pass, so it must be shown there, not after the Sun pass.
    Every spatial or numerical claim in narration, diagrams and HUD now has a check in `<ep>/claims.py`, run
    against the simulation. *Gate:* `qa.py pre` fails any false claim, and a missing `claims.py`.
    *Review rule:* when an object changes sides (beyond Earth → between Earth and Sun), the video must show the
    move; a cut may skip time but never a key event.
14. **Motion that continues across beats must not stop and start.** Gliding every parameter at every beat
    boundary made the sim clock ease from rest each time: the Jupiter fall paused mid-air at 10 boundaries and the
    spaghetti stream spun, stopped, and spun again. Parameters that continue across beats (sim clocks, phases,
    slow camera moves) are now one smooth `Track` through all the beat boundaries; the falling world's flow is the
    integral of the ship's real speed, so it never pauses while the ship falls.
    *Gate:* `qa.py pre` (motion-continuity) fails a continued range that is not a Track or a clock that runs
    backwards; `qa.py post` (motion-stalls) measures optical flow on the finished video and fails any moment
    where a moving shot nearly stops and then resumes.
15. **A label must sit on the thing it names.** In the black hole's second ending the orbit is drawn with
    perihelion (closest to the Sun, hottest) on the right, but "SCORCHED" was placed at the far end and "FROZEN"
    near the Sun; both labels also showed on the still-circular orbit, where there is no hot or cold end yet.
    Labels now come from the same orbit equation that draws the orbit, and appear only once the orbit is an oval.
    *Gate:* while rendering preview stills, every label's screen position is recorded (`qa_labels.jsonl`, with
    invisible reference marks such as the Sun via `cards.mark`). Each episode's `claims.py` lists
    `LABEL_RULES` ("SCORCHED nearer the Sun than FROZEN", "NEAR SIDE nearer the black hole than FAR SIDE");
    `qa.py pre` fails a rule that is broken, or one that is never seen in the stills.

## Storytelling rules (founder, Nov 2026, after Episode 4 v1; every episode from #4)

Episode 4 v1 was rejected: five scenes repeated for eight minutes, pictures that sat still while the narration
talked, visuals that did not show what was being said, fish with two tails, things popping in and out, diagrams
nobody could read. The founder passed on five rules from a faceless creator whose films go viral. Each is now a
check (`tools/story_gate.py`, run by `tools/qa.py` for slot >= 4):

| # | Rule | Check | Fails when |
|---|---|---|---|
| 1 | Open on a moment everyone has had | `open-moment` | no `META['open_moment']` / no "Open moment" section in BRIEF.md / first shot is a map, diagram or title / first sentence has numbers or > 10 words / the blind viewer did not recognise it |
| 2 | Something new on screen every 3–5 s | `cadence-plan` (pre), `cadence-video` (post) | any beat longer than 5 s; any stretch of the finished picture longer than ~5.6 s in which the frame never moves far (≥ 100/512 dhash bits) from where it was 2 s earlier |
| 3 | Keep it simple: one hero, one villain, one room, one thing always moving | `simplicity` | `META['cast']` incomplete; hero named in < 25 % of segments; the room's scenes < 40 % of the runtime |
| 4 | Mute it and cover the captions | `mute-test` | `tools/mute_test.py` renders every beat with all text removed; ONE fresh AI viewer (founder, Nov 2026: a single subagent, to save usage) first describes each beat blind (no script), then reads the narration and marks each beat PASS/FAIL. Re-tests cover only beats that failed or changed; earlier PASS verdicts carry over. Any beat not understood, any anatomy/continuity error, or a test made for an older cut (fingerprint) fails |
| 5 | Put everything inside the story | `story-end` | an end card / title card; the story does not run to the last frame (`META['story_end']`); the next-episode teaser ends < 20 s before the end |

Order of work: script → voice → beats → stills → **mute test** → qa pre → render → qa post.

## Founder's review of Episode 4 v2 (Nov 2026; every episode from #4)

| Founder said | Gate (where) | What it checks |
|---|---|---|
| "Where is the end scene where you say subscribe … with the name of our channel and logo" | `story-end` (tools/story_gate.py, pre) | The story runs to its own ending. Then the last segment is ONE branded outro, under 12 s: an `endcard` showing the channel name and logo, over an in-world picture, with "subscribe" and the channel name said aloud. |
| "The background score is not good enough … plain sound that is unsettling … incorporate other background music" | `music` (tools/music_gate.py, post, on `build/<ep>/music_stem.wav`) | The bed is music: a note onset at least every 6 s over ≥ 90 % of the runtime; low rumble (< 110 Hz) median ≤ 30 % and no 10 s stretch above 45 %; no silent bed longer than 4 s. Ambience and SFX ride under a scored bed (felt piano, strings, bass, celesta, one recurring motif). |
| "Glass beads … stopping mid air and falling again" | `particle-clock` (tools/qa.py, pre) | Falling or drifting particles use the episode's global clock, never the shot clock that restarts at a cut. Otherwise the same beads jump back up at every cut. |
| "Apophis going backwards while moving forward" | `motion-continuity` (tools/qa.py, pre), extended | Inside one continuous shot, no start→end value may jump at a beat boundary, and progress values (flyby, fall, fill, sound ring …) may never reverse. Camera zoom is not allowed to move an object backwards against its own motion: keep the zoom fixed while it moves. |
| "The paddlefish's mouth doesn't look good … research … the real structure" | `anatomy-reference` (tools/story_gate.py, pre) | BRIEF.md has an "Anatomy reference" section: every creature on screen, the features drawn, and source links. The hero is drawn true to life and not grotesque. |
| "Where the narration says the fish are feeding, there is no visual that shows they are really feeding" | `mute-test` (the viewer's brief) | The viewer checks that every action the narration states is visibly happening in the picture. Feeding means food is seen going into the mouth. |
| Everything already fixed in Ep4 | All of the above, plus `cadence-video`, `self-repeat`, `jump-cuts`, `motion-stalls` | These carry forward to every episode. |

### Render reliability (added during Ep4 v3)
| Gate | Why | How it is enforced |
|---|---|---|
| A killed render worker must fail loudly, never hang | One chunk worker was killed for memory (6.7 GB) and `multiprocessing.Pool` waited forever, wasting a 2-hour render slot | `render_chunked` uses `ProcessPoolExecutor` (raises `BrokenProcessPool`); each chunk is written to `.part` and renamed when complete, so a rerun skips finished chunks; `run_chunked.sh` retries with 3, then 2, workers at a time |
| Motion continuity covers smoothed tracks | The engine splits a move into two smooth tracks when beat values don't line up; the first eases to a stop and the second jumps and restarts. The old check skipped all smoothed tracks, so a camera lurch (c2a#8 cx 0 → -300) reached the render and failed the post gate | `qa.py motion_continuity` compares values at every boundary between two different tracks, or a track and a plain range, and flags jumps and two-move ease-stop-restarts. It found 4 more hidden jumps in Ep4 (fish teleport, gill zoom snap, Earth scale pop) |
| Feeding must read as intake in a still | Converging particle streaks look like a spray going outward; gold glow read as sparks | Feeding particles are pale and unglowed, thin-tailed, and vanish just before the mouth; the mute viewer checks every open-mouth fish beat |
| Thumbnails always match the current video | Ep4: a thumbnail made two days earlier still showed the old wide-open mouth after it was fixed in the video | `finalize.sh` re-runs `tools/thumbnail.py` from the current scene code on every finalize; thumbnails are never reused from an earlier build |
| No angle brackets in YouTube text | YouTube rejects "<" and ">" in the description; Ep4's sources said ">50 %" | `tools/metadata.py` refuses to write title, description, tags or pinned comment containing < or >, naming the offending line |
