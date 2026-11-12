"""Word-level timestamps for the existing narration (faster-whisper, audio untouched) → voice/words.json."""
import os, sys, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
ep = sys.argv[1] if len(sys.argv) > 1 else "ep_blackhole"
D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build", ep, "voice")
tl = json.load(open(os.path.join(D, "timeline.json")))
m = WhisperModel("base.en", device="cpu", compute_type="int8")
out = {}
for s in tl["segments"]:
    if not s["lines"]:
        out[s["id"]] = []; continue
    a, sr = sf.read(os.path.join(D, s["id"] + ".wav"))
    a = resample_poly(a, 16000, sr).astype(np.float32)
    ws = []
    for ln in s["lines"]:  # one line at a time: far more reliable than whole segments
        t0 = max(0.0, ln["start"] - 0.15)
        clip = a[int(t0 * 16000): int((ln["end"] + 0.2) * 16000)]
        segs, _ = m.transcribe(clip, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
        ws += [dict(w=w.word.strip(), t0=round(w.start + t0, 3), t1=round(w.end + t0, 3)) for sg in segs for w in sg.words]
    out[s["id"]] = ws
    print(s["id"], len(out[s["id"]]), flush=True)
json.dump(out, open(os.path.join(D, "words.json"), "w"), indent=0)
