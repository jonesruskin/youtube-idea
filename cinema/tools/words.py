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
import difflib, unicodedata
_near = lambda w, V: w in V or any(difflib.SequenceMatcher(None, w, v).ratio() >= 0.7 for v in V)
_n0 = lambda x: "".join(c for c in x.lower() if c.isalnum() or c == "'").strip("'")
_n = lambda x: _n0(unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode())
for s in tl["segments"]:
    if not s["lines"]:
        out[s["id"]] = []; continue
    a, sr = sf.read(os.path.join(D, s["id"] + ".wav"))
    a = resample_poly(a, 16000, sr).astype(np.float32)
    ws = []
    for ln in s["lines"]:  # one line at a time: far more reliable than whole segments
        t0 = max(0.0, ln["start"] - 0.15)
        clip = a[int(t0 * 16000): int((ln["end"] + 0.2) * 16000)]
        segs, _ = m.transcribe(clip, word_timestamps=True, beam_size=5, condition_on_previous_text=False, vad_filter=True)
        vocab = {_n(x) for x in ln["text"].split()}
        for sg in segs:
            for w in sg.words:
                i0, i1 = int(w.start * 16000), int(w.end * 16000)
                rms = float(np.sqrt(np.mean(clip[i0:i1] ** 2))) if i1 > i0 else 0.0
                nw = _n(w.word)
                # whisper invents words over pauses: keep only words with sound that the script actually says
                if not nw or rms < 0.003 or (not any(c.isdigit() for c in nw) and not _near(nw, vocab)):
                    continue
                ws.append(dict(w=w.word.strip(), t0=round(w.start + t0, 3), t1=round(w.end + t0, 3)))
    out[s["id"]] = ws
    print(s["id"], len(out[s["id"]]), flush=True)
json.dump(out, open(os.path.join(D, "words.json"), "w"), indent=0)
