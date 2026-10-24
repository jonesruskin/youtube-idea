"""Ride the score under the dialogue, like a mixer's fader: wherever a line would sit less than TARGET dB above
the music, pull the music down further for that line only (smooth 150 ms ramps). Rewrites the score in place.

    ~/.venv-sun/bin/python scripts/ride_score.py out/sun01-timeline.json
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

TARGET = 9.0  # dB of voice over music we want on every line (the gate is 6; the average gate is 10)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
tl = json.load(open(sys.argv[1]))
ep = tl["id"]
vmap = json.load(open(os.path.join(ROOT, "public", "voice", f"{ep}.json")))
path = os.path.join(ROOT, "public", "audio", f"{ep}-score.wav")
score, sr = sf.read(path, dtype="float32")
mono = score.mean(axis=1)
rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)
gain = np.ones(len(score), np.float32)
ramp = int(0.15 * sr)
fixed = 0
for l in tl["lines"]:
    v = vmap.get(l["key"])
    if not v:
        continue
    a, vsr = sf.read(os.path.join(ROOT, "public", v["file"]), dtype="float32")
    a = a.mean(axis=1) if a.ndim > 1 else a
    a = resample_poly(a, sr, vsr).astype(np.float32) if vsr != sr else a
    s, e = int(l["start"] * sr), min(len(score), int(l["end"] * sr))
    margin = 20 * np.log10(rms(a) / rms(mono[s:e]))
    if margin >= TARGET:
        continue
    g = 10 ** (-(TARGET - margin) / 20)
    env = np.ones(len(score), np.float32)
    a0, b0 = max(0, s - ramp), min(len(score), e + ramp)
    env[a0:b0] = g
    env[a0:s] = np.linspace(1, g, s - a0)
    env[e:b0] = np.linspace(g, 1, b0 - e)
    gain = np.minimum(gain, env)
    fixed += 1
    print(f"  ride {l['key']:<24} {margin:5.1f} dB → {TARGET:.1f} dB")
sf.write(path, score * gain[:, None], sr, subtype="PCM_16")
print(f"✔ rode the score under {fixed} line(s)")
