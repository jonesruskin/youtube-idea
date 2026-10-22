# 07 · Series framework: keeping the channel running

**The Blink Files** is a channel of *Files*. Each File is a 12-episode series built on one impossible cosmic event, set in the same universe, using the same studio, cast library and format signatures. Between Files, **Loose Files** (one-off episodes) keep the cadence going and seed the next series.

## The File template
1. **The Event** (one sentence a 12-year-old can repeat): *"Betelgeuse died, and its people sent their powers to twelve of us."*
2. **Twelve powers**, one per episode. Each one must be readable in one frame, have an obvious off-switch, help people, and come from real space science. The four most desirable go first.
3. **A catch per power** that turns into the episode's running gag and its crisis.
4. **A season mystery in one line** ("Twelve gifts were sent. Thirteen arrived."), planted in Ep1 with a clue in every episode.
5. **Twist ladder:** Ep5 reframe · Ep7 loss · Ep9 truth · Ep11 reversal · Ep12 payoff plus a door.
6. **A narrator with a point of view**: the Executor, or the equivalent figure in a new File.
7. **A theme expressed by the payoff**: in File 01, *be kind when no one's watching.*

## Planned Files

### FILE 02 · THE GUARDIANS (direct sequel to THE GIFTS)
*The twelve gifted are now guardians of the last Vey child, and the Quiet has turned toward the Sun.*
- **Format shift:** "What If You Had to Hide a Child From a Thing That Eats Stars?" Each episode is one guardian's skill against one problem.
- **Sealed mystery:** what the child's name means, and what she can do.

### FILE 03 · SECOND SUN
*One morning, a second sun rises over Earth, and night is gone forever.*
- Twelve episodes on life without darkness, one premise per episode ("What If You Never Saw Night Again?", "What If Your Shadow Disappeared?").
- **Sealed mystery:** the second sun has a shadow.

### FILE 04 · THE QUIET HOUR
*For one hour, every radio and phone on Earth goes silent, except one frequency.*
- Twelve strangers hear twelve different messages on it.
- **Sealed mystery:** the messages are from themselves.

### LOOSE FILES (between seasons, standalone, 8–12 min)
Leaked pages from Kade's private dossiers on other anomalies. Each one tests a premise for a future File:
- *What If You Found a Second Moon in Your Backyard?*
- *What If Gravity Turned Off for One Second Every Night?*
- *What If You Received a Letter From Earth 1,000 Years in the Future?*

### SHORTS SERIES
- **Hologram Minutes:** 45-second science bites built from the Executor's hologram diagrams ("Why astronauts float: they're falling and missing").
- **Gift Tests:** 30-second gags (Jonah vs. the goat, Mags vs. a sneeze) that tease the next episode.

## Calendar (sustainable for 1–2 people)
- **Weekly:** 1 long episode (Thursday, 18:00 UTC) and 3 Shorts (Mon/Wed/Sat).
- **Between Files:** 2 Loose Files and a community poll on which File comes next. The audience chooses, and that builds investment.

## How to start a new episode
```
cp -r episodes/ep01-zero-g episodes/ep02-moon-legs   # then rewrite script.ts
# add it to src/episodes.ts
# new characters → src/characters/registry.ts; new places → src/env/*.tsx + src/scenes.tsx
npm run lint:episode ep02
```
