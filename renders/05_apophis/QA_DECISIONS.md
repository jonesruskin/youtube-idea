# Ep 5 (Apophis): decisions on QA warnings

`tools/qa.py ep_apophis pre` passed with 0 FAIL and 13 WARN. `docs/QUALITY_GATE.md` requires a written decision for each WARN. All 13 are below.

Before deciding, two harder checks had already run on these beats:
- **Mute test:** 160 of 160 beats passed, judged by a blind viewer from pictures only.
- **After-render gates** (`qa.py post`: black frames, cadence, motion stalls) run on the real video. They are the binding check for exposure and motion.

## Exposure (5): accepted, these are night-sky shots by design

| Beat | What it is | Decision |
|---|---|---|
| c3a#7, c3a#8 | "just a point of light sliding past the stars": the city night sky at 21:20 | **Keep.** The story point is that Apophis looks like one ordinary star, so the frame has to be a dark sky. The point and the moving stars read clearly; the mute test passed both. |
| c3c#2 | binocular view: "it creeps past the stars" | **Keep, with a fix.** Sodium skyglow and a cool binocular lift were added to the roof scene. The render's black-frame gate (`blackdetect d=1.0, pix_th=0.04`) failed here in the first render and was re-checked after the fix. |
| c3c#3, c3c#4 | one-minute exposure: "a straight line" | **Keep, with the same fix.** The streak grows across the beat, and the stars are brighter in the exposure view. Average brightness stays low because the sky must be black for a long-exposure streak to read. |

## Motion (2): accepted

| Beat | Decision |
|---|---|
| c3b#11 "a rare visitor this close" | **Keep.** A deliberate slow hold that lands the chapter's last line before the cut to the roof. It is part of a continuous track, not a freeze; the motion-stall gate on the render is the binding check. |
| c5b#3 "the near end is pulled harder than the far end" | **Keep.** A diagram beat: the comparison is carried by the two unequal force arrows, and a moving camera would make the lengths harder to compare. The mute viewer read the near/far difference correctly. |

## Variety (6): accepted, each run is one continuous move with a new idea per beat

| Run | Why it stays |
|---|---|
| open2#3–#7 | One move: the rock beside the Eiffel Tower for scale, then the path threading the satellite ring, then "it passes". Each beat adds a new overlay or element; cutting away would lose the scale reference. |
| c1b#5–#9 | One diagram: the uncertainty cloud shrinking off Earth, the keyhole, the 2036 return. Keeping one frame lets the viewer watch the same space change, which is the point of the beat. |
| c2a#5–#9 | One shot of the rock tumbling, with a strong orbit and roll added after the first render's cadence fail. The after-render cadence check marks every 2 s window of c2a as NEW. |
| c3a#2–#10 | A single night over Lisbon: brightest, the Big Dipper for comparison, high in the south, the fist-at-arm's-length measure. This is the "you are standing under it" sequence; each beat adds a new star reference or overlay. |
| c3b#3–#12 | One map and orbit diagram that goes from ground track to closest approach, the GEO ring, the Moon for distance, and the edge-on view. Each beat changes the overlay and the camera. |
| c3c#2–#6 | The roof sequence: binoculars, then exposure, then the crowd. The exposure streak and the view change drive it. |
