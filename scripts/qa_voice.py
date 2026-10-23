"""Voice QA: transcribe every voiced line with Whisper and compare it to the script (word error rate).
Lines that come back wrong usually mean a mispronunciation — fix with a respelling and re-voice.

    ~/.venv-sun/bin/python scripts/qa_voice.py sun01
"""
import json, os, re, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ep = sys.argv[1] if len(sys.argv) > 1 else "sun01"
vmap = json.load(open(os.path.join(ROOT, "public", "voice", f"{ep}.json")))
tl = json.load(open(os.path.join(ROOT, "out", f"{ep}-timeline.json")))
text = {l["key"]: l["text"] for l in tl["lines"]}
model = WhisperModel("small.en", device="cpu", compute_type="int8")

NUM = {"one": "1", "two": "2", "three": "3", "seven": "7", "eight": "8", "nine": "9", "ten": "10", "eleven": "11", "twenty": "20", "thirty": "30", "hundred": "100"}

def norm(s):
    s = s.lower().replace("’", "'").replace("-", " ")
    s = re.sub(r"[^a-z0-9' ]", " ", s)
    return [NUM.get(w, w) for w in s.split()]

def wer(ref, hyp):
    d = [[0] * (len(hyp) + 1) for _ in range(len(ref) + 1)]
    for i in range(len(ref) + 1):
        d[i][0] = i
    for j in range(len(hyp) + 1):
        d[0][j] = j
    for i in range(1, len(ref) + 1):
        for j in range(1, len(hyp) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] != hyp[j - 1]))
    return d[-1][-1] / max(1, len(ref))

bad = 0
total_ref = total_err = 0
for key, v in vmap.items():
    if key not in text:
        continue
    audio, sr = sf.read(os.path.join(ROOT, "public", v["file"]), dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    audio = resample_poly(audio, 16000, sr).astype(np.float32)  # Whisper wants 16 kHz mono
    segs, _ = model.transcribe(audio, beam_size=5, language="en")
    hyp = " ".join(s.text for s in segs).strip()
    r, h = norm(text[key]), norm(hyp)
    e = wer(r, h)
    total_ref += len(r)
    total_err += e * len(r)
    flag = "✖" if e > 0.15 else "·"
    if e > 0.15:
        bad += 1
    print(f"{flag} {e:5.2f} {key:<24} | {hyp}")
print(f"\nOverall WER {total_err / max(1, total_ref):.3f}; {bad} line(s) above 0.15")
