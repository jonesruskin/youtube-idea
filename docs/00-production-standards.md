# Production standards (every episode, permanently)

These are the CEO's rules, gathered from every review so far, written once so no episode needs the same round twice.
Each rule names how it is enforced:
- **[gate]**: an automatic check (`scripts/check-episode.ts` or `scripts/qa-release.ts`); the build fails if it fails.
- **[sheet]**: a generated review sheet that a person reads.
- **[doc]**: a required document in the episode folder.

A new CEO note becomes a new numbered rule here, and a gate wherever it can be automated.

## S. Story logic
- **S1. One causal chain.** The premise fits in a few sentences a viewer could repeat, with no extra moving parts. [doc: `world-model.md` §1]
- **S2. Complete on its own.** Each episode answers its own main question: what happened, why, and how it ended. A series tag is optional and never needed to understand the episode. [doc: question bank, at most 2 OPEN]
- **S3. A world model with real physics.** Before writing: cold or heat, power, communications, transport, jobs, food, water, health and human cost (or the episode's equivalents), with real numbers. Every scene obeys it. [doc: `world-model.md` §3; gate: world-state lint]
- **S4. Question bank.** At least 100 questions a first-time viewer could ask, in 9 categories:
  - premise;
  - physics and timing;
  - power and communications;
  - transport and jobs;
  - food and water;
  - health and safety;
  - characters and motives;
  - continuity;
  - picture logic.

  Each is answered by a named shot, or marked OPEN (at most 2, both deliberate series mysteries). [gate: question-bank check]
- **S5. Surprising facts are explained in the same scene.** True but counter-intuitive physics is shown explicitly, e.g. the Sun returning at once for the whole day side while the night side stays dark. [doc + cold read]
- **S6. No contradictions.** About power, phones, transport, weather or who is where. If the world model says power works, no power cuts, candles-for-light, radios-instead-of-phones or "needs electricity" lines. [gate: world-state lint]
- **S7. Every character is accounted for:** where they are and why, every day of the story (e.g. who looks after the kids, where Mum sleeps, why someone is absent). [doc: whereabouts table]
- **S8. Time arithmetic checks out:** light-travel times, ages, years between events, time zones. [doc: timeline table]
- **S9. Real places are named at the right level:** cities, not states (CHENNAI, not Tamil Nadu). Times agree with each city's real time zone. [gate: place-tag check; doc]
- **S10. Two cold reads of the full screenplay before any production,** as a first-time viewer. Every finding is fixed in the screenplay first. [doc: `review-log.md`]
- **S11. Every episode is a new story.** A new premise (a different event or mystery, not the same event seen by someone else), new characters, a new setting, a new title and a new twist. Episodes share only the format and the quality bar: a kid or family at the centre, real science behind every clue, one twist, complete in one episode, and every rule in this document. Never re-use an earlier episode's event, storyline or title pattern. [gate: premise registry, `docs/premises.md`, checked by `check-episode`: title lead words and premise overlap]
- **S12. Nothing from another File leaks into this one:** title card, end card, props (a photo prop must show this story's photo), music cues, sound effects. Every shared component takes its content from the episode. [gate: check-episode title/end-card check; sheet: stills of every card]

- **S13. The hook is the event:** the impossible thing is on screen within 30 seconds, before anyone is introduced.
- **S14. A mystery with an owner:** one question the audience cannot answer and one character who knows more than they say; the answer changes what earlier scenes meant.
- **S15. A twist ladder:** at least four reversals written as "we thought X, but Y" in the treatment, the last inside the final two minutes, approved before any build.
- **S16. A clock the viewer can count** (days, distance, depth), with the world visibly worse at each step.

## D. Dialogue
- **D1. Every line is a complete, natural sentence** that makes sense on its own, with clear referents. Write "Then something has happened at the Sun", not "Then it happened at the Sun". [cold read]
- **D2. No clipped numbers or jargon:** say "four minutes past seven", not "seven-oh-four". [gate: line lint]
- **D3. Context in the line.** A warning says what, why and what to do: "Everyone out! A fire indoors makes carbon monoxide. You can't see it or smell it, and it kills." [cold read]
- **D4. Every scene tells the viewer when it is:** a DAY tag, a time tag or a line. A cut must never look like a memory unless it is one (memories are graded and labelled). [gate: day-tag check; cold read]
- **D5. Character voices stay consistent** (sun01: Mira blunt and curious, Kai dry, Ito precise and kind, Mum warm and practical). Character lines are at most about 14 words. [gate: line length]
- **D6. Exposition through people, without lectures:** narrator and diagrams for the science, characters for feelings and decisions. [cold read]
- **D7. Talk like people talk.** Read every line aloud in the character's voice. If a person wouldn't say it that way, rewrite it. [ledger]
- **D8. Every line is signed off in context.** `scripts/dialogue-review.ts <id> --update` writes the dialogue sheet (every exchange in order, then each character's lines on their own). Every line gets a verdict in `dialogue-review.md`. A verdict only counts while the line's text is unchanged, so any rewrite forces a re-read. [gate: dialogue ledger]
- **D9. Replies take a stance.** A reply that corrects or turns back what was just said opens with "No," / "Yes," / "Well," and never echoes it flat. Write "You kept them alive." → "No. They kept me alive.", not "They kept me alive." [gate: echo flag]
- **D10. Answers answer the question asked.**
  - A yes/no question gets yes, no, or "I don't know" first.
  - "Why" gets a reason ("Because…").
  - "Who" names someone, "where" names a place, "when" gives a time.

  "Is that a lot?" answered with a fact about the number is a non-sequitur. [gate: answer flag]
- **D11. Credit and knowledge stay true.**
  - Praise, thanks and "you found it" go to whoever really did it.
  - A character never acts surprised by something they already knew or said, and never credits someone else for their own idea.
  - Example: Kai can't suggest the metro and then praise Biscuit for finding it. Now nobody knows where is warm, and Biscuit finds the metro.

  Keep a "who knows what, when" table in the world model. [gate: credit flag + ledger; doc]
- **D12. The narrator stays in the first person and names the right actor.** The narrator never calls themselves by name ("after Mira pressed the key" → "after we sent my drawing"). Who does an action matches what is on screen (Ito pressed the key). [gate: narrator flag; set `narratorIs`]
- **D13. No redundant echoes.** A fact one voice has just said isn't restated by the next voice: the anchor says "something around the Sun", so the narrator doesn't repeat it. Deliberate callbacks are allowed but must be signed off as deliberate. [gate: repeat flag]
- **D14. Every pronoun has a clear owner** in the same or the previous line. "They told him not to" after a line about the builders reads as the builders, so name who. [gate: referent flag]
- **D15. One count per span.** Never say two near-identical numbers for related spans ("forty-three years" and "forty-four years ago"), even when both are correct. Use a year ("in 1983") or a single count. [gate: numbers flag]
- **D17. Every line carries a feeling, and says it.** People thank, fear, tease and miss each other; they don't file reports. "You kept them alive." is a report; "Thank you. For keeping them alive. For looking after them, all this time." is gratitude. Comfort comes before analysis ("Oh, Lui. I'm sorry." before the clue). At the big moments (reunions, goodbyes, danger, apologies), somebody says what they feel. [gate: `(feel)` required on every line; feeling flags in the dialogue review: report-shaped thanks, a heart moment said flat, an exclamation said calm]
- **D18. Every line is written with its delivery:** `(feel)` first, `*stress*` on the word that carries the meaning, ` / ` for a beat and ` // ` for a long beat (a breath, a swallow, a hesitation). Character lines of 5+ words and narration of 12+ words must mark at least one. The voice engine performs them (Kokoro: per-phrase synthesis, stress markup and lift, feeling sets speed, pitch and level; ElevenLabs v3: audio tag, CAPS, pauses). [gate: delivery lint; src/engine/delivery.ts]
- **D19. The face says what the voice says.** The speaker's expression when the line starts must be one that can carry its feeling (grateful: smile, relieved or tearful; urgent: alert, worried, scared or determined; never a blank face on gratitude or a smile on a warning). [gate: feel-to-face lint]
- **D20. Explain it the way the youngest character would notice it.** No arithmetic or jargon spoken aloud to carry a plot point ("twenty-three times seventy-three" became "they come in rows… filled squares and empty squares"). The exact numbers can sit on screen for those who want them. [ledger]
- **D16. Lines have an addressee and a reason.** Offers and announcements include their lead-in ("Let me help. I know a little about old machines.", "Listen. Something near the Sun is calling us."). [ledger]

## P. Picture
- **P1. Things move head-first:** animals, fish, people and vehicles. Paw and foot prints point along the direction of travel. [sheet: direction sheet]
- **P2. Nothing happens by itself:** doors are opened by someone; props are handed over, picked up or put away, never popping in or out. [gate: props lint; cut-pair sheet]
- **P3. Props stay continuous across cuts** in the same place and time. [gate]
- **P4. No mirrored text, no overlay covering a label, no empty or half-empty panel, no cropped heads.** [sheet: filmstrip]
- **P5. Weather and light match the world model:** e.g. frost and not snowdrifts after the first week; lamps on when power works. [gate + filmstrip]
- **P6. Stars, sky, scale and real-world sizes are correct** (ScaleLab). [sheet]
- **P7. People face whoever they hug, talk to or come to.** A walk turns the walker toward where they went, so an arrival must turn them to the person they came to (Kai ran to Mum and stopped with his back to her). Listeners face the speaker unless they are side by side looking at the same thing. [gate: facing lint]
- **P9. No face is ever behind another person.** Heads must not overlap; in a hug or a line-up, the shorter person stands clear of the taller one's head and body. [gate: face lint, checked at the end of every shot and at every line]
- **P10. Every change of place is announced:** an on-screen place/day tag, or words in that shot's own line ("That evening, at seven, Mum called."; "out on the stairs"). A cut from a supermarket to a living room with nothing said is a continuity break. [gate: place lint; `hud` or `bridge`]
- **P11. People don't undo what they just did.** Whoever opens a door stays at it; nobody walks to a spot and straight back. A prop taken from a pocket, bag or table grows out of the reaching hand and one put away shrinks into it, never on the first 0.4 s of a shot. [gate: take/put timing lint; rig]
- **P12. Furniture fits the people using it:** a chair back ends at the sitter's shoulders, a table top at a standing adult's hip. [rig: Seat; sheet: seated stills]
- **P13. Real skies, drawn in our style:** every Moon, Earth and planet keeps its real geography (continents, coasts, deserts and ice from NASA Blue Marble; the Moon's real seas from NASA LRO with its big craters at their true place and size; Jupiter's bands and Great Red Spot; Mars's dark plains) but is drawn like the rest of the show: a few flat colours, inked coasts and crater rims, the same ink outline and flat cel shadow as the characters. Never a hand-drawn disc with invented blobs, and never a raw photo. One source: `scripts/bake_bodies.py` → `public/toon` and `public/bodies` → `<Body>` (`src/fx/bodies.tsx`) and the globe (`src/fx/PhotoGlobe.tsx`). Credits go in every description. [gate: `scripts/real-bodies.ts` in check-episode: no hand-drawn bodies, no photo maps on screen, every texture matches the bake manifest with at most 8 flat colours; self-tested on a planted hand-drawn Earth, an inline Moon and a photo texture] (CEO, File 002: "the craters look weird… continents misplaced", then "the real image looks odd with the animation")
- **P14. Feet on the ground:** every set declares where people can stand (`src/engine/grounds.ts`: floors, stairs, steps, quay edges, read from the set's own drawing); the renderer plants standing feet on it, and walkers climb a flight instead of gliding through it. Nobody stands where there is no surface. [gate: lint grounding (set without ground, off-surface position or walk, y off the surface); self-tests `floating`, `offSurface`; eye check: `scripts/feet-sheet.ts` crops every contact point] (CEO, v5.5: "characters not properly standing on the surface like stairs, floor")
- **P15. One take per scene:** a scene in one place plays as one continuous take with camera moves and new angles, not cuts: `flow()` carries cast and camera across every same-scene boundary (people who leave walk out, people who arrive walk in, the camera moves from the last framing to the next), and idle motion runs on the film clock. A same-scene cut needs a stated reason (`cut: '…'`) or a real change the engine records (the set state changes, someone takes another's place). [gate: lint one-take; self-test `sceneCut`] (CEO, v5.5: "if a scene is taking place in a house, then there shouldn't be any cuts if it isn't absolutely necessary")
- **P16. Craft at File 001's level:** pace ≤ 150 words a minute, ≤ 84% talk and ≥ 12% of the film without words; ≥ 0.8 transitions a minute in ≥ 3 kinds (fade on time jumps, whip between places, flash on reveals, match cuts); ≥ 0.5 sound effects a minute; music that changes with each scene (≥ 1.8 cue changes a minute, ≥ 12 kinds); ≥ 2.5 inserts, diagrams or news shots a minute; a twist no more than every 100 s; a second storyline that pays off; ≥ 8 sourced facts. Each twist is followed by a plain explanation and someone's reaction. [gate: lint craft (`scripts/craft-report.ts` prints the numbers); self-tests `bland`, `hurried`] (CEO, v5.5: "The Sun video has lot of substance… The Moon video… looks bland… difficult to follow with not much explaining done and feels hurried")
- **P8. Every label a viewer must read is fully visible:** never under the letterbox bars, never cut by the frame or by the panel it sits in, never overlapping another label, never covered by something drawn over it (the sunrise city tags were hidden by the bars). Set dressing may be cropped (`data-text="set"`); a label is `info` by default. [gate: scripts/text-safe.ts, run by check-episode and before every render]

## A. Acting (faces and bodies)
- **A1. Calm faces have clean, fully open eyes.** No drawn eyelid except for blinks, anger and real sleepiness. Sleepiness only where the story gives a visible reason (sun01: only at breakfast before the event). [gate: sleepy lint; sheet: EyeLab]
- **A2. Both eyes are the same size at every head turn.** Foreshortening is smooth and at most 10%. [sheet: EyeLab]
- **A3. Expressions match the event and blend in naturally:** shock fast, a smile blooming, sadness sinking in. Shocks only on the beat that causes them; they peak, then settle. No snap changes. [gate: face continuity, shock budget, mood; sheet: emotion sheet]
- **A4. Blinks are single and crisp:** one in-between frame, two frames shut. At least 1 s apart. No flutter, no double blinks. [gate: blink spacing]
- **A5. No automatic gestures:** gestures only when scripted and matching the line. Listener reactions are selective (about one line in three), with glances away. [gate: gesture cap]
- **A7. Every face reads as its feeling while talking.** An open talking mouth amplifies any built-in smile, so only happy expressions curve up. "Determined" is firm (low, level brows, set mouth), never a grin. Urgent lines (warnings, danger) use alert, worried or scared. Checked on full-size stills of every speaking shot. [sheet; face.ts library]
- **A6. Faces are always reviewed at full size and frame by frame,** never only on small contact sheets. [sheet: face strips at 1:1]

## K. Packaging
- **K1. The title is long enough to intrigue and short enough to read** (50–70 characters), clickable, and **reveals nothing** about the twist. [gate: title length and spoiler-word check]
- **K2. Three thumbnails, spoiler-free,** two or three words each, readable at 320×180. [sheet]
- **K3. Description:** logline, chapters from real timings, and science sources **below a spoiler line**. The pinned comment and tags are spoiler-free. [gate: spoiler words above the line]

## R. Delivery
- **R1. One folder per episode, `episodes/<id>-<slug>/release/`:**
  - `<id>-master.mp4` (CRF 18, AAC 256k) and `<id>.mp4` (web copy), both on Git LFS;
  - `<id>.srt` and `<id>-described.srt`;
  - `metadata.md`;
  - `thumbnail-a/b/c.png`;
  - `README.md`.
- **R2. Revisions replace these files in place** (same names, new LFS objects) and are pushed.
- **R3. GitHub Releases** need a token with `contents:write`. Until then, the LFS folder is the delivery.
- **R4. Voices, music and BGM:** free placeholders (Kokoro plus the synthesised score) until the CEO approves the picture; then ElevenLabs, re-mastered into the same files.

## Q. Quality process
- **Q1. The pipeline in `docs/PIPELINE.md`, run in order.** No stage starts before the previous one's exit criteria pass.
- **Q2. Review loop until a full pass is clean,** logged in the episode's `review-log.md`. Delivery only after a clean pass.
- **Q3. Gates on the final file:**
  - audio −14 LUFS ±1, true peak ≤ −1 dBTP, every line ≥ 6 dB over the bed;
  - motion: 0 idle shots;
  - frame count equals the timeline;
  - Whisper WER ≤ 2.5%.
- **Q4. Visual pass on the final file:**
  - 0.5 fps filmstrip read against the screenplay;
  - direction sheet;
  - cut pairs;
  - face strips at 1:1 for every close-up.
- **Q5. Think from first principles; research real numbers; assume nothing.** Be original: no generic AI-slop formats.
- **Q6. Pacing:**
  - The average shot is ≤ 4.0 s for narrated story files (≤ 3.7 s for fast formats; set `pacing` in the episode).
  - Any shot over 7 s with more than one sentence is split into two camera setups.
  - Clarity beats cut speed: never clip a line to make the number. [gate]

## Source of these rules (CEO reviews)
- **v5.3 review:**
  - Mira's face blocked behind Mum (P9);
  - the drawing appearing and disappearing in a hand (P11);
  - supermarket to home with nothing said (P10);
  - Kai opening the door and walking back (P11);
  - the 1,679 sequence too technical (D20);
  - chair as tall as the sitter (P12);
  - "double voices" (two pitch passes on one line; now one);
  - File 002: no substance, no twists (S13–S16, `docs/17-file002-rethink.md`).
- **v5.2 review:**
  - Kai stops behind Mum at the reunion, not facing her (P7);
  - Mum's "You kept them alive." has no emotion; it should express gratitude; the dialogue across the whole video lacks emotion (D17);
  - delivery: some words must be stressed, some need a pause, so the voice feels human (D18);
  - the city names in the sunrise montage were blocked by the letterbox bars (P8).
  The text audit then also found news-wall feeds cutting their own figures, farm labels hidden behind a lamp and the extras, and a menu cropped by the camera; all fixed.
- **v3.1:** props popping in and out; hand-waving on every line; logic holes; Mum missing; no world chaos; unnatural dialogue.
- **v4:** wide-eyed faces in many scenes; expressions switching too fast; remaining AI tells; a review loop required; title too short; nothing revealed in the title or thumbnails; high-quality video on GitHub via LFS (and Releases); one folder per episode; ElevenLabs only after approval.
- **v4.1:** one eye bigger than the other; eyes looking half-closed.
- **v4.2:**
  - a fish swimming backwards;
  - a state named instead of a city (Tamil Nadu → Chennai);
  - a door opening by itself;
  - incomplete lines ("Then it happened at the Sun", "it's the gas you can't see");
  - the premise's purpose unclear;
  - a radio instead of a phone in 2026;
  - electricity contradictions;
  - the Biscuit search cutting confusingly to the Mum call;
  - paw prints backwards;
  - only lettuce on the farm.
- **v5.1 review:** File 002 retold File 001's event from another person's view with the same title pattern: rejected. Every episode must be a unique story (S11).
- **v5 review:**
  - "They kept me alive" repeated flat, where a person says "No, they kept me alive";
  - Kai suggesting the metro, then praising Biscuit as if Biscuit had found it;
  - "small things like this" across the whole script. Rules D7–D16 and the dialogue ledger gate came from this review.
- **v5 plan review:**
  - how the reply arrives, and who controls the shell;
  - transport and jobs;
  - nurses and patients;
  - the river crossing;
  - the sunrise across time zones;
  - "find every hole yourself";
  - "hundreds of episodes, each complete, no mistakes, smooth process".
