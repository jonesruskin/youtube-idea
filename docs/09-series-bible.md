# 09 · Series bible: THE BLINK FILES (the narrated File format)

> **Every File, the world ends a different way. Every File, your watch counts down first.**

This is the format the channel launches with (File 001, *The Sun Went Out*). It came out of the niche scan (`docs/08`) and the transcripts of the genre's biggest hits. The earlier Zero-G episode and its lore (`docs/03`–`07`) stay in the repo for a later slot.

## Why this format (what the winners do)
These patterns come from transcripts of *Bunker Survival 1 Year* (2.0M views, 1.8% likes), *Zombie Outbreak: 30 Days on the 30th Floor* (2.6M), *What If Your Reaction Time Was 10x Faster?* (4.4M) and *What Would Happen If the Moon Crashed Into Earth?* (1.7M).
1. **Second person, present tense, exact clock times.** "The sirens start at 6:14 a.m." The viewer *is* the hero.
2. **A chain of problems, each answered by a real fact.** Problem, then the fact, then the fix, then a number they can repeat ("two hundred litres… four weeks").
3. **Running counters** (Day, °C, litres, calories) so time and stakes are always visible.
4. **Something small to protect**: a sister, a dog.
5. **A mystery under the survival plot** that ends on a twist. That twist is what produced "PART 2!!" comments with 5.1K likes.
6. **A closing question** to the viewer, plus a sequel hook.
7. **A new premise every episode.** Ifverse sequels lost 50–85% per part, so the recurring layer has to ride on top of fresh premises, not replace them.

## The recurring cast (defined once in `src/characters/registry.ts`)
| Who | Look | Role |
|---|---|---|
| **You** | ~20, warm brown skin, short dark hair, **mustard-orange parka**, **battered silver digital watch** on the left wrist | The viewer. Never named; the narrator only says "you". The orange parka is the thumbnail silhouette. |
| **Mira** | 8, your sister, **red beanie** with a pom-pom, blue parka | Draws a sun every day she survives. Few words; each one lands. |
| **Biscuit** | golden dog, red collar (`src/characters/Dog.tsx`) | Comic relief, heart, and the one who finds the way. Biscuit always survives. |
| **The narrator** | Kokoro `af_heart` | Calm, close, second person. Never jokes *at* you; jokes *with* you. |
| **The radio** | Kokoro `am_michael`, band-limited | The ally and the mystery. One station is never static. |

## The serial mystery: the watch
- **In every File**, your watch starts a countdown you didn't set, *before* the disaster (File 001: 08:20, light's travel time from the Sun).
- **During the File**, it is the only text on screen: the countdown, DAY ###, °C.
- **At the end of every File**, the timeline resets to the normal morning and nobody else remembers. One object from the dead timeline is still there (File 001: a frost sun on a summer window), and the watch starts the **next** countdown in red (File 001 ends on **71:59:59**).
- **The radio voice** knows things it shouldn't ("Go down." … "Look up.").

**Season arc (planned so the cliffhangers lead somewhere):**
| File | Premise (new every time) | Countdown | Mystery beat |
|---|---|---|---|
| 001 | The Sun went out | 08:20 | The watch counted first; the radio says "Go down", then "Look up" |
| 002 | Earth stops spinning | 71:59:59 | You try to warn people before the countdown; nobody believes you |
| 003 | Gravity halves | shorter | The radio voice says your name |
| 004 | The oceans start boiling | shorter | Mira remembers *one* thing from a reset |
| 005 | A rogue black hole, 30 days out | shorter | You find a second watch, on someone else's wrist |
| 6–11 | (new premise each) | shorter each time | Who is counting? Hints that the countdowns are *warnings sent back* |
| 012 | Finale | 00:00:01 | The radio voice is you, from the last File, trying to save Mira |

**Rule:** a premise must work for someone who has never seen another File. The mystery takes at most the cold open and the last 60 seconds.

## The episode formula (≈8:30–10:00)
| Beat | Time | Job |
|---|---|---|
| Cold open | 0:00–0:45 | Exact time, the watch, an ordinary morning, the event lands mid-sentence. Silence. Title. |
| Minute 0 | ~1:00 | Why it happened, with real physics. The first "that should scare you" fact. |
| Day 1 → Day N | 1:40 → 7:00 | A Day per chapter: problem, fact, fix, counter. A laugh, wow, heart or open loop at least every 45 s (`npm run lint:episode`). |
| Mid-roll 1 | ~4:00 | On a cliffhanger: something you love runs into danger. |
| Mid-roll 2 | ~6:20 | On a cliffhanger: the system you depend on fails. |
| The peak | ~7:00 | The most beautiful image of the File (File 001: the perfect Milky Way). Let it breathe. |
| The reset | ~7:50 | The watch, a blink, the normal morning, the impossible object, the red countdown. |
| The question | last 30 s | "If your watch started counting down right now…" plus subscribe ("next time, the countdown is shorter"). |

## Film language (house style kept: flat colour, navy ink, real skin tones)
- **Shots:** extreme wide, low angle, bird's-eye, over-the-shoulder, extreme close-up (watch, hand, match), Dutch tilt for panic.
- **Moves:** multi-plane parallax camera with handheld drift and rack focus (`src/fx/cinema/camera.tsx`).
- **Transitions:** pull-back out of the watch, zoom-through the window, iris, frost-thaw between Days, breath-fog, flash, lights-out cut (`src/engine/Episode.tsx`).
- **Letterbox** bars (2.39:1) for the three biggest moments only.
- **On-screen text:** only the watch, the title card and the end screen. Everything else is shown.

## Sound
- `scripts/score_cinema.py`:
  - **Instruments:** organ theme "Last Light", strings, choir, felt piano.
  - **The watch tick:** the series' sonic logo; it opens and closes every File.
  - **Hits:** braams, booms, risers.
  - **Ambiences:** synthesised; nothing is sampled.
- **Rule:** silence is an instrument. File 001 cuts to digital silence on the frame the Sun dies.

## Production
```bash
npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
~/.venv-sun/bin/python scripts/tts_kokoro.py out/sun01-timeline.json      # Kokoro voice (Apache-2.0, local, free)
npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json        # re-export with voiced timings
~/.venv-sun/bin/python scripts/qa_voice.py sun01                          # Whisper round-trip, flags mispronunciations
~/.venv-sun/bin/python scripts/score_cinema.py out/sun01-timeline.json   # score + sound design
npx tsx scripts/preview.ts sun01 --scale=0.4                              # contact sheet of every shot
REMOTION_BROWSER=/path/to/headless_shell npm run render sun01             # video + master + SRT + thumbnail + metadata
~/.venv-sun/bin/python scripts/remix_cinema.py sun01                      # after any score/voice change: new soundtrack, no video re-render
```
**Mix rule (checked on File 001):** the narration must sit at least 10 dB above the music on average, and no line may sit less than 6 dB above it. The score ducks 15 dB under every line, and loud cues settle under narration. Measure on the final file before shipping.
The Python steps need Python 3.12 with `kokoro`, `torch` (CPU), `soundfile`, `scipy` and `faster-whisper`, plus `espeak-ng` (see `requirements.txt`).
