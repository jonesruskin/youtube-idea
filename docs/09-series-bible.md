# 09 · Series bible: THE BLINK FILES (the narrated File format, v2)

> **One family. One impossible year. Every clue is real physics; the ending opens the next File.**

File 001, *The Sun Went Out*, launches the channel. It came out of the niche scan (`docs/08`), the transcripts of the genre's biggest hits and, for v2, a study of their actual frames. The earlier Zero-G episode and its lore (`docs/03`–`07`) stay in the repo for a later slot.

## What the winners do (and what v1 got wrong)
Sources: transcripts and YouTube auto-frames of *Bunker Survival 1 Year* (2.0M), *Zombie Outbreak: 30 Days on the 30th Floor* (2.6M), *Nobody Gets In* (1.5M), *What If Your Reaction Time Was 10x Faster?* (4.4M), *Minute Zero* (1.8M) and *The Last Day* (1.7M).
1. **A simple, expressive hero in a rich world.** The characters are stick or ball-head, but the backgrounds are detailed and lit. v1 did the opposite.
2. **A new composition for every sentence**, about 3 s per shot. Every noun gets an object on screen; one bold word now and then (OFF, KNOW, LOUDEST).
3. **A development every ~20–30 s.** *Zombie 30th Floor* has about 25 plot events in 8 minutes; v1 had about 6.
4. **Second person, present tense, exact times; problem, then fact, then fix, then a number.**
5. **Something small to protect**: a sister and a dog.
6. **A mystery under the survival plot that pays off in reveals**, ending on a question for the comments.
7. **No resets.** Stakes have to stick; the next File continues the story.

## The recurring cast (`src/characters/toon/design.ts`, fixed height chart)
| Who | Height | Look | Role |
|---|---|---|---|
| **You** | 1.0 | Big round head, warm brown skin, dark tuft of hair. Orange tee, then the **orange parka** (hood up below −15 °C). Silver watch with a thermometer. | The viewer. Never named; the narrator says "you". Default face: soft and friendly, never angry. |
| **Mira** | 0.6 | 8, pigtails, then a blue parka and **red beanie**. | Draws suns, asks the questions a kid in the audience would ask, and gets the last word. |
| **Mr. Ito** | 0.93 | Retired astronomer from upstairs: bald, white tufts and moustache, round glasses, cardigan, then a green coat; a cane from Day 3. | The ally who explains the science with props (the key on a string, the thermal camera). Kokoro `bm_george`. |
| **Biscuit** | 0.35 | Golden dog, red collar. | Comic relief and heart, and the one who finds the way underground. Always survives. |
| **Narrator** | — | Kokoro `af_heart`, ~150 wpm. | Calm, close, second person. |
| **Radio** | — | Kokoro `am_michael`, band-limited. | News from the rest of the world. |

The height chart is enforced in code: scenes choose a *depth*, never a per-character scale, and the linter fails any shot where two people on the same floor line differ in depth. Extras come from a seeded generator (age, height, build, skin, hair, hats, glasses, beards); kids never go bald.

## The serial story
- **File 001.** A shell around the Sun, there unseen for at least a century, closes. Over a year, the family deduces the following, each step from evidence they can see:
  1. **It happened at the Sun**: Venus and Jupiter go dark late, by exactly their light-delay.
  2. **The Sun is still there**: the tides are normal, and Earth still orbits.
  3. **It is a shell**: a thermal camera shows a warm disc twice as wide as the Sun. It wasn't built that day; it was always there, furled edge-on like an open blind, and at 6:44 someone closed it.
  4. **It is taking the Sun's energy**: a beam leaves the shell.

  On Day 365 a door opens in the shell for one second. Then a signal counts the planets, 1, 2, 3, and stops at Earth. *"That's us."*
- **File 002: The Reply.** What humanity sends back, and what answers. Ito proves it was always there: every eclipse photo since 1919 shows the same three straight lines through the corona, fixed against the stars rather than turning with the Sun (full answer: `docs/10-sun01-logic-audit.md`, "The answer we hold for Episode 2").
- **File 003 hook.** The beam's recoil makes the Sun a very slow rocket: *it isn't just taking the light; it's steering the Sun.*
- **Rule:** every File must work for someone who has never seen another. The previous File is recapped in the cold open with one image.

## The episode formula (≈8:00–8:40)
| Beat | Job |
|---|---|
| Cold open (0:00–0:45) | The hook in the first 5 s, the ordinary morning (with a laugh), the dark arriving, silence, title. |
| Hour one | Panic, the first clue, the first ally. |
| Day chapters | Problem, fact, fix, then a complication. A development at least every 30 s, a laugh/wow/heart/loop at least every 45 s. A DAY tag with the outside temperature at each jump. |
| Mid-roll 1 (~4:40) | On a cliffhanger: something you love runs into danger (Biscuit bolts). |
| Mid-roll 2 (~6:30) | On a cliffhanger: the system you depend on fails (the power plant). |
| Reveals | Four or more, each a stronger escalation, each with a callout. |
| The peak | The most beautiful image (the Milky Way at −73 °C), then the impossible (one second of sunlight). |
| The cliffhanger | The question to the viewer, then the next File's title. |

## Film language
- **Stage engine** (`src/env/sun/stage.tsx`): detailed sets drawn at natural scale, with a camera that frames wides, mediums and close-ups by zooming in. Close-ups centre on faces automatically. Multi-plane parallax and handheld drift.
- **Earth is the real Earth:** NASA Blue Marble and Black Marble textures (public domain) reprojected per pixel (`src/fx/PhotoGlobe.tsx`), with city lights and spreading ice controlled by the story.
- **On-screen text** is limited to:
  - callouts (one bold word or number, 20 or fewer per File)
  - the DAY tag
  - the title and end cards
  - diegetic signs and screens
- **Letterbox** for reveals and peak moments only.

## Sound
- `scripts/score_cinema.py` synthesises everything (no samples):
  - per-cue score: strings, organ, choir, felt piano, bells
  - **the shell motif** (D–E♭–A, low organ, choir and braam), which plays at every reveal
  - per-shot sound effects; whip-pan whooshes
  - the radio pulses, synced to Ito's count
- **Silence is an instrument:** digital silence on the frame the light goes out.
- **Mix rule:** narration at least 10 dB over the bed on average and at least 6 dB on every line; master at −14 LUFS / −1 dBTP.

## Review gates (nothing ships until these pass)
- `npm run lint:episode sun01` checks:
  - runtime ≥ 8:00, hook ≤ 5 s
  - average shot ≤ 3.7 s
  - no idle stage shot (no acting and no camera move)
  - a development every 30 s or less, ≥ 2 per minute, ≥ 4 reveals
  - 120–170 wpm, ≤ 20 callouts
  - beats every 45 s
  - costume continuity, scale, expressions, extras
- `scripts/qa_voice.py`: Whisper word error rate on every line.
- `scripts/qa_motion.py`: measures motion per shot on the rendered video and writes a frame strip for continuity review.
- **Contact sheets** of every shot (`out/shot.ts all`), reviewed by eye against `docs/10-sun01-logic-audit.md`.
- **Audio gates:** loudness and voice-over-music margin on the final file.

## Production
```bash
npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
~/.venv-sun/bin/python scripts/tts_kokoro.py out/sun01-timeline.json      # voices (Kokoro, Apache-2.0, local)
npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json        # re-export with voiced timings
~/.venv-sun/bin/python scripts/qa_voice.py sun01                          # Whisper round-trip
npx tsx scripts/lint-episode.ts sun01                                     # script gates
~/.venv-sun/bin/python scripts/score_cinema.py out/sun01-timeline.json   # score + sound design
REMOTION_BROWSER=/path/to/headless_shell npx tsx scripts/render.ts sun01  # video, master, SRT, thumbnail, metadata
python3 scripts/qa_motion.py renders/sun01-hq.mp4 out/sun01-timeline.json # motion gate + frame strip
```
