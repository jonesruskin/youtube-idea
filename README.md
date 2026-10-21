# THE BLINK FILES

> *Betelgeuse went dark. Three days later, every radio on Earth received the last will and testament of the people who lived there. They left everything they owned to twelve of us.*

A YouTube channel of serialized, animated space stories built for **8–12 minute episodes** (mid-roll eligible). Every video is made from code with [Remotion](https://remotion.dev) and voiced with ElevenLabs.

**Episode 1, "What If Aliens Left You Their Spaceship?"**, is in `renders/`:
- `ep01.mp4`: 10:03, 1080p. No voiceover yet; it has an original score and SFX.
- `ep01.srt`: every narration and dialogue line, speaker-labelled
- `ep01-thumbnail.png`
- `ep01-metadata.md`: title, description, chapters, sources, tags and mid-roll positions

## Read these first
| Doc | What it is |
|---|---|
| [01 · Competitor teardown](docs/01-competitor-teardown.md) | What Ifverse/IFOLOGY do well, and what we must **not** copy |
| [02 · VC pass and pre-mortem](docs/02-vc-pass-premortem.md) | Why an investor would pass, how this fails, and the one untested assumption |
| [03 · Channel bible](docs/03-channel-bible.md) | The spine, the Vey, the mysteries, the finale, tone and visual identity |
| [04 · Characters](docs/04-characters.md) | The Twelve Heirs: bodies, inner lives, inheritances, rules, clues |
| [05 · Season One](docs/05-season-one.md) | 12 episodes, the twist ladder, seeds → payoffs |
| [06 · Episode formula](docs/06-episode-formula.md) | The seven sections, retention rules, packaging, checklist |
| [07 · Series framework](docs/07-series-framework.md) | How the channel keeps going: Files, Loose Files, Shorts |
| [ElevenLabs setup](docs/ELEVENLABS_SETUP.md) | Step-by-step key and voice setup |

## Studio quickstart
```bash
npm install
npm run studio                       # live preview in the browser
npm run lint:episode ep01            # pacing linter (runtime, hooks, mid-rolls, chapters)
npx tsx scripts/preview.ts ep01 --scale=0.25   # one still per shot → out/preview/ep01
npm run voice ep01                   # ElevenLabs voiceover (needs .env — see docs/ELEVENLABS_SETUP.md)
npm run render ep01                  # score + SRT + metadata + thumbnail + MP4 → renders/
```
If Remotion can't download its headless Chrome, point it at an existing one with `REMOTION_BROWSER=/path/to/chrome npm run render ep01`.

## How it's built
```
episodes/ep01-the-ship/script.ts   the episode as data: shots → scene + lines + footnotes + chapters + mid-rolls
src/engine/                        timeline (estimated or voiced timings), Episode composition, shot context
src/characters/                    registry.ts (one design per character) + Figure.tsx (the rig)
src/env/                           environments (Lagos, space, drama) — reusable across episodes
src/fx/                            starfield, Orion, globe (Natural Earth via world-atlas), the Vey ship, the Executor
src/ui/                            will slate, Ledger, title/end cards, Executor's Footnotes
scripts/                           lint, preview, score synth, SRT, metadata, ElevenLabs TTS, render
```
- **One source of truth per character:** `src/characters/registry.ts`. Jonah looks identical in every episode.
- **Timings follow the voice:** with no voiceover, line lengths are estimated at ~155 wpm. After `npm run voice`, the real ElevenLabs durations re-flow the whole edit, captions and music.
- **The music is original by construction:** `scripts/make-score.ts` synthesizes pads, bells, plucks and SFX per mood from the script, so nothing can be Content-ID claimed.

## Licences
- Remotion is free for individuals and companies with up to 3 employees; beyond that a company licence is required (see remotion.dev/license).
- Fonts (Cormorant Garamond, Space Grotesk, Unbounded, IBM Plex Mono) are SIL Open Font License and vendored in `public/fonts`.
- Map data is Natural Earth (public domain) via `world-atlas`.
- ElevenLabs output requires a paid plan for commercial use.
