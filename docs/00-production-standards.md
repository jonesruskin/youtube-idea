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
- **D16. Lines have an addressee and a reason.** Offers and announcements include their lead-in ("Let me help. I know a little about old machines.", "Listen. Something near the Sun is calling us."). [ledger]

## P. Picture
- **P1. Things move head-first:** animals, fish, people and vehicles. Paw and foot prints point along the direction of travel. [sheet: direction sheet]
- **P2. Nothing happens by itself:** doors are opened by someone; props are handed over, picked up or put away, never popping in or out. [gate: props lint; cut-pair sheet]
- **P3. Props stay continuous across cuts** in the same place and time. [gate]
- **P4. No mirrored text, no overlay covering a label, no empty or half-empty panel, no cropped heads.** [sheet: filmstrip]
- **P5. Weather and light match the world model:** e.g. frost and not snowdrifts after the first week; lamps on when power works. [gate + filmstrip]
- **P6. Stars, sky, scale and real-world sizes are correct** (ScaleLab). [sheet]

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
