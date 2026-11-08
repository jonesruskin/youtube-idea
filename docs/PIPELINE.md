# Episode pipeline

Run in order. Each stage has exit criteria; the next stage does not start until they pass. Rules: `docs/00-production-standards.md`.

| # | Stage | Do | Exit criteria |
|---|---|---|---|
| 0 | Scaffold | `npx tsx scripts/new-episode.ts <id> <slug>` | The folder has `script.ts`, `world-model.md`, `question-bank.md`, `review-log.md` |
| 1 | Premise | Write the causal chain in `world-model.md` §1 | A few sentences; no step needs a further explanation |
| 2 | World model | Fill `world-model.md` §2–4: timeline arithmetic, the world's systems with real numbers, a whereabouts table | Every number sourced or derived; the `world` facts are declared in `script.ts` |
| 3 | Question bank | `question-bank.md`: at least 100 questions in the 9 categories | Every row answered with a shot id, or OPEN (at most 2) |
| 4 | Screenplay | Write the shots in `script.ts`; `npx tsx scripts/make-screenplay.ts <id>` writes `screenplay.md` | Two cold reads logged in `review-log.md` with nothing open |
| 5 | Build | New sets, inserts and diagrams; direction (`DIRECT`/`REACT`) | Stills of every new piece reviewed at full size |
| 6 | Check | `npx tsx scripts/check-episode.ts <id>` | 0 errors: lint (props, faces, blinks, sleepy, presence, 180°, timing, world state, lines, day tags, place tags), question-bank completeness, title and spoiler checks |
| 7 | Voice | `export-timeline` → `tts_kokoro.py` → re-export → `qa_voice.py` → `score_cinema.py` | WER ≤ 2.5%; the score cues the new timeline |
| 8 | Pre-render review | `npx tsx scripts/eyelab.ts`; stills of every changed shot; `scripts/direction-sheet.ts`; cut pairs | Nothing found, or fixed and re-checked |
| 9 | Render | `out/render-<id>.sh` (chunked, resumable; about 2 GB free disk needed) | Frame count equals the timeline |
| 10 | Release QA | `npx tsx scripts/qa-release.ts <id>`: audio, motion and frame gates; filmstrip, direction and face strips to `out/review/<id>/` | Every gate passes; visual pass logged as clean |
| 11 | Deliver | Commit; LFS push of `release/` (replaces files in place); send the web copy | Tree clean and pushed; `review-log.md` has a clean final pass |

## A CEO note arrives
1. Fix it in this episode, then loop from the earliest stage it touches.
2. Add it to `docs/00-production-standards.md` as a numbered rule.
3. If it can be checked automatically, add a gate and prove it fails on the old mistake.
