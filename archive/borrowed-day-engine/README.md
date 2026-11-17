# Borrowed Day: its versions of the shared engine files

Borrowed Day and The Blink Files grew from the same Remotion engine and changed the same files in different ways.
`main` uses The Blink Files' versions (much further along). These are Borrowed Day's versions, kept as they were, so Borrowed Day
Ep1 (`renders/bd01*`) can be rebuilt. To render it, copy these over the matching paths (or port its episode into the current engine).
Everything else Borrowed Day added (its sets, thumbnails, audio, scripts, docs) is merged into `main` at its normal path.

## What's in here
- `episodes/bd01-richest/`, `src/env/bd01/`, `src/thumbs/`, `src/channels.ts`: Borrowed Day's episode, sets, thumbnail and branding.
- `scripts/tts-local.ts`, `scripts/kokoro_tts.py`, `scripts/audit-text.ts`: its local-voice and text-audit tools.
- Every other file: Borrowed Day's version of a file `main` shares with The Blink Files.

The rendered episode and its audio stay at their normal paths (`renders/bd01*`, `public/audio/`), and so does its doc (`docs/08-borrowed-day.md`).
To rebuild it: check out commit `edee048` (the last Borrowed Day commit, kept in `main`'s history), or copy this folder over the repo root.
