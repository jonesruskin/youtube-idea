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
