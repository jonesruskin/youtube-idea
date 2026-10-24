"""Audio gate: is every line clearly above the music?

    ~/.venv-sun/bin/python scripts/qa_audio.py out/sun01-timeline.json [renders/sun01-hq.mp4]

Builds the voice track exactly as the renderer places it, measures each line's RMS against the score's RMS in
the same window, and reports the margin in dB (gate: ≥ 10 dB average, ≥ 6 dB for every line). With a video
argument it also reports the master's integrated loudness and true peak (gate: −14 LUFS ±1, ≤ −1 dBTP).
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
tl = json.load(open(sys.argv[1]))
ep = tl["id"]
vmap = json.load(open(os.path.join(ROOT, "public", "voice", f"{ep}.json")))
score, sr = sf.read(os.path.join(ROOT, "public", "audio", f"{ep}-score.wav"), dtype="float32")
score = score.mean(axis=1) if score.ndim > 1 else score
voice = np.zeros(len(score) + sr * 5, np.float32)
for l in tl["lines"]:
    v = vmap.get(l["key"])
    if not v:
        continue
    a, vsr = sf.read(os.path.join(ROOT, "public", v["file"]), dtype="float32")
    a = a.mean(axis=1) if a.ndim > 1 else a
    if vsr != sr:
        a = resample_poly(a, sr, vsr).astype(np.float32)
    i = int(l["start"] * sr)
    voice[i:i + len(a)] += a[: len(voice) - i]

rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)
margins = []
for l in tl["lines"]:
    a, b = int(l["start"] * sr), int(l["end"] * sr)
    m = 20 * np.log10(rms(voice[a:b]) / rms(score[a:b]))
    margins.append((l["key"], m))
avg = float(np.mean([m for _, m in margins]))
worst = sorted(margins, key=lambda x: x[1])[:5]
print(f"voice over music: average {avg:.1f} dB, worst {worst[0][1]:.1f} dB ({worst[0][0]})")
for k, m in worst:
    print(f"   {m:5.1f} dB  {k}")
ok = avg >= 10 and worst[0][1] >= 6
if len(sys.argv) > 2:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", sys.argv[2], "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    print(f"master: {I:.1f} LUFS integrated, true peak {TP:.1f} dBTP")
    ok = ok and abs(I + 14) <= 1 and TP <= -0.9
print("✔ audio gates pass" if ok else "✖ audio gates FAIL")
sys.exit(0 if ok else 1)
