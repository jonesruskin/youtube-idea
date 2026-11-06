# THE BLINK FILES

> *One family. One impossible year. Every clue is real physics; the ending opens the next File.*

A YouTube channel of animated space-science survival stories built for **8–12 minute episodes** (mid-roll eligible). Every video is made from code with [Remotion](https://remotion.dev): the narration is voiced locally with Kokoro-82M (Apache-2.0), and the score is synthesised from scratch.

**Launch episode: File 001, "The Sun Went Out. Day 1 to Day 365" (v3)** is in `renders/`:
- `sun01.mp4`: about 9:30, 1080p web copy with soft English subtitles. The upload master `sun01-hq.mp4` is git-ignored.
- **The story:** grown-up Mira tells the year she was eight and the Sun went out. With her brother Kai, their dog Biscuit and Mr. Ito, the retired astronomer upstairs, she works it out clue by clue: light delay, tides, a thermal camera, a shell that was always there, a beam to one star. Intercut, unnarrated, a young astronomer works through one night in a mountain observatory. The twist: it is 1982, he is Mr. Ito, and the shell's "count" is his own knock coming back.
- **Craft:**
  - 162 shots at about 3.5 s each, a development every ≤30 s, and seven turns
  - a first-person narrator and named characters with their own voices (Kai and Mum added)
  - a silent second timeline, lint-gated against early reveals
  - real-world scale, and nobody floating (auto seats, grounded poses, attached piggybacks)
- Also in `renders/`:
  - `sun01.srt` (captions) and `sun01-described.srt`
  - three thumbnails for YouTube's Test & Compare: `sun01-thumbnail.png` WHO BUILT THIS?, `-b` HE KNEW and `-c` 1982
  - `sun01-metadata.md` (title, description with chapters and sources, tags, mid-rolls, end screen, pinned comment)
- **Docs:**
  - screenplay, clue map and cause→effect links: [`docs/11-sun01-v3-screenplay.md`](docs/11-sun01-v3-screenplay.md)
  - series bible (12 standalone Files, narrators, casts, ElevenLabs voice and music casting): [`docs/09-series-bible.md`](docs/09-series-bible.md)
  - physics: [`docs/10-sun01-logic-audit.md`](docs/10-sun01-logic-audit.md)

**Earlier pilot, "What If Everything You Touched Lost Its Gravity?"** (the Zero-G episode, held for a later slot):
- `ep01.mp4`: ~9:10, 1080p (web-size copy). No voiceover yet; it has an original score and SFX.
- `ep01.srt`: dialogue captions for YouTube
- `ep01-described.srt`: dialogue plus stage directions, for reviewing before the voice exists
- `ep01-thumbnail.png`, `ep01-metadata.md` (title, description, chapters, sources, mid-roll times)
- Readable script: [`docs/screenplay-ep01.md`](docs/screenplay-ep01.md)

## Read these first
| Doc | What it is |
|---|---|
| [01 · Competitor teardown](docs/01-competitor-teardown.md) | What Ifverse/IFOLOGY do well, and what we must **not** copy |
| [02 · VC pass and pre-mortem](docs/02-vc-pass-premortem.md) | Why an investor would pass, how this fails, the one untested assumption |
| [03 · Channel bible](docs/03-channel-bible.md) | The spine, the twelve gifts, mysteries, tone, visual identity |
| [04 · Characters](docs/04-characters.md) | The Twelve: bodies, inner lives, kindnesses, gifts; Ep1 supporting cast |
| [05 · Season One](docs/05-season-one.md) | 12 episodes, the twist ladder, seeds → payoffs |
| [06 · Episode formula](docs/06-episode-formula.md) | The ten-section structure, retention rules, show-don't-tell, packaging |
| [07 · Series framework](docs/07-series-framework.md) | How the channel keeps going: Files, Loose Files, Shorts |
| [08 · Niche scan, Oct 2026](docs/08-niche-scan-2026-10.md) | Where the unsaturated, high-viral formats are, and the two bets to test after Ep1 (tool: `research/niche-scan/`) |
| [09 · Series bible](docs/09-series-bible.md) | **The launch format (v2.1)**: the cast and height chart, the serial story, the episode formula, film language, sound, the review gates, and how to produce a File |
| [10 · File 001 logic audit](docs/10-sun01-logic-audit.md) | Every physics claim with its numbers, how the shell can exist and close in a second, the Episode 2 answer, the clue chain, temperatures, continuity, and every fix |
| [ElevenLabs setup](docs/ELEVENLABS_SETUP.md) | Step-by-step key and voice setup |

## Studio quickstart
```bash
npm install
npm run studio                                   # live preview in the browser
npm run lint:episode ep01                        # runtime, beats every 45s, mid-rolls, chapters
npx tsx scripts/make-screenplay.ts ep01          # readable screenplay from the script
npx tsx scripts/preview.ts ep01 --scale=0.25     # one still per shot → out/preview/ep01
npm run voice ep01                               # ElevenLabs voiceover + lip-sync timings (needs .env)
npm run render ep01                              # score + SRTs + metadata + thumbnail + MP4 → renders/
```

## How it's built
```
episodes/ep01-zero-g/script.ts     the episode as data: shots → scene, action, lines, beats, science, chapters, mid-rolls
src/engine/                        timeline (estimated or voiced timings), Episode composition, transitions, shot context
src/characters/                    registry.ts (one design per character), Figure.tsx (rig), visemes.ts (lip-sync)
src/env/kit.tsx                    the world kit: time-of-day skies, painted clouds, Lagos facades, power lines, danfos, grade
src/env/ep01/                      Episode 1 sets: street, bus, roof, house, market, holograms, globe threads…
src/fx/                            starfield, Orion, globe (Natural Earth via world-atlas), the Executor
src/ui/                            Finish (grain + vignette), end card
scripts/                           lint, preview, screenplay, score synth, SRTs, metadata, ElevenLabs TTS, render
episodes/_archive/                 the first (objects-based) version of Episode 1, kept for reference
```
- **Characters stay identical across episodes.** Each one is defined once in `src/characters/registry.ts`.
- **Lip-sync:** characters' mouths follow their lines through phoneme shapes. After `npm run voice`, ElevenLabs' per-character timings drive them exactly.
- **The music is original by construction.** `scripts/make-score.ts` synthesises the score and SFX from the script's moods and cues.

## Licences
- Remotion is free for individuals and companies with up to 3 employees (see remotion.dev/license).
- Fonts are SIL Open Font License, vendored in `public/fonts`. Map data is Natural Earth (public domain).
- ElevenLabs output needs a paid plan for commercial use.
