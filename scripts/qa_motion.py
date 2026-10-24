"""Motion gate: finds shots where (almost) nothing moves, measured on the rendered video, not the script.

    python3 scripts/qa_motion.py renders/sun01-hq.mp4 out/sun01-timeline.json

For every shot it samples frames 0.5 s apart and measures how much of the picture changes. A shot whose
median change is below the threshold for its whole length is flagged as idle (the v1 failure: people standing still).
Also writes a frame strip every 2 s (out/strip/) for the continuity review.
"""
import json, os, subprocess, sys
import numpy as np

video, tlp = sys.argv[1], sys.argv[2]
tl = json.load(open(tlp))
W, H, FPS = 192, 108, 2
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
print(f"{len(frames)} frames sampled")

flagged = []
rows = []
for s in tl["shots"]:
    a, b = int(np.ceil(s["start"] * FPS)), int(np.floor(s["end"] * FPS))
    seg = frames[a:b]
    if len(seg) < 2:
        rows.append((s["id"], s["end"] - s["start"], None))
        continue
    d = np.abs(np.diff(seg, axis=0))
    # fraction of pixels changing by more than 6/255 between consecutive samples
    moving = (d > 6).mean(axis=(1, 2))
    score = float(np.median(moving))
    rows.append((s["id"], s["end"] - s["start"], score))
    if score < 0.004 and s["end"] - s["start"] > 2.5:
        flagged.append((s["id"], score))

for sid, dur, sc in rows:
    print(f"{'✖' if any(f[0] == sid for f in flagged) else '·'} {sid:<22} {dur:5.1f}s  motion {'—' if sc is None else f'{sc * 100:5.2f}%'}")
print(f"\n{len(flagged)} idle shot(s) of {len(rows)}")

os.makedirs("out/strip", exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=0.5,scale=384:216,tile=6x5", "out/strip/strip-%02d.jpg"], check=True)
sys.exit(1 if flagged else 0)
