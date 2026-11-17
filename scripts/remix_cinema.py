"""Re-mix a rendered cinema episode's soundtrack without re-rendering the video.

Rebuilds exactly what Remotion mixes (each voice line placed at its Sequence frame + the score), masters it with
two-pass EBU R128 loudness normalisation (−14 LUFS, −1 dBTP) and swaps it into renders/<id>-hq.mp4 and
renders/<id>.mp4 (video and subtitle streams are copied untouched). Use after changing the score or a voice line.

    npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
    ~/.venv-sun/bin/python scripts/remix_cinema.py sun01
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
ep = sys.argv[1] if len(sys.argv) > 1 else "sun01"
tl = json.load(open(os.path.join(ROOT, "out", f"{ep}-timeline.json")))
vmap = json.load(open(os.path.join(ROOT, "public", "voice", f"{ep}.json")))
fps = tl["fps"]

score, ssr = sf.read(os.path.join(ROOT, "public", "audio", f"{ep}-score.wav"), dtype="float32")
assert ssr == SR
n = int(round(tl["duration"] * fps)) * SR // fps
mix = np.zeros((n, 2), np.float32)
mix[: min(n, len(score))] += score[:n]
for line in tl["lines"]:
    v = vmap[line["key"]]
    a, vsr = sf.read(os.path.join(ROOT, "public", v["file"]), dtype="float32")
    a = resample_poly(a, SR, vsr).astype(np.float32)
    start = int(round(line["start"] * fps)) * SR // fps  # Remotion places each line at a whole frame
    m = min(len(a), n - start)
    mix[start:start + m] += a[:m, None]
raw = os.path.join(ROOT, "out", f"{ep}-mix.wav")
sf.write(raw, mix, SR, subtype="FLOAT")

probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
ln = f"loudnorm=I=-14:TP=-1.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
for name, br in ((f"{ep}-hq.mp4", "256k"), (f"{ep}.mp4", "192k")):
    src = os.path.join(ROOT, "renders", name)
    if not os.path.exists(src):
        continue
    tmp = src.replace(".mp4", ".remix.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-i", raw, "-map", "0:v", "-map", "1:a", "-map", "0:s?", "-c:v", "copy", "-c:s", "copy",
                    "-af", f"{ln},aresample=48000", "-c:a", "aac", "-b:a", br, "-metadata:s:s:0", "language=eng", "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, src)
    print(f"✔ {name}: new soundtrack")
