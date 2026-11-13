"""Narrate an episode with Kokoro-82M (Apache-2.0) → per-segment WAVs + timeline.json."""
import sys, os, json, importlib.util
import numpy as np, soundfile as sf
from kokoro import KPipeline

ep = sys.argv[1] if len(sys.argv) > 1 else "ep_blackhole"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("script", os.path.join(root, ep, "script.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
out = os.path.join(root, "build", ep, "voice"); os.makedirs(out, exist_ok=True)
VOICE, SPEED, SR = os.environ.get("VOICE", "af_heart"), float(os.environ.get("SPEED", "0.94")), 24000
p = KPipeline(lang_code="a")
# reuse already-narrated segments whose text is unchanged, so adding a segment never alters existing narration
_old_p = os.path.join(out, "timeline.json")
OLD = {s["id"]: s for s in json.load(open(_old_p))["segments"]} if os.path.exists(_old_p) else {}
timeline, t = [], 0.0
LEAD = 0.25  # breath before first line of each segment
for seg in mod.SEGMENTS:
    o = OLD.get(seg["id"])
    wav = os.path.join(out, seg["id"] + ".wav")
    if o and [l["text"] for l in o["lines"]] == list(seg["lines"]) and os.path.exists(wav) and "--fresh" not in sys.argv:
        timeline.append(dict(id=seg["id"], start=t, dur=o["dur"], lines=o["lines"]))
        print(f'{seg["id"]:8s} {o["dur"]:6.2f}s  @ {t:7.2f}  (unchanged, reused)', flush=True)
        t += o["dur"]
        continue
    gap = seg.get("gap", 0.32)
    parts, lines, cur = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
    for i, text in enumerate(seg["lines"]):
        a = np.concatenate([np.asarray(x, np.float32) for _, _, x in p(text, voice=VOICE, speed=SPEED)])
        # trim leading/trailing near-silence
        idx = np.where(np.abs(a) > 0.01)[0]
        if idx.size: a = a[max(0, idx[0] - 600): idx[-1] + 2400]
        lines.append(dict(text=text, start=cur, end=cur + len(a) / SR))
        parts.append(a); cur += len(a) / SR
        if i < len(seg["lines"]) - 1:
            parts.append(np.zeros(int(gap * SR), np.float32)); cur += gap
    tail = seg.get("hold", 0.0) + (0.35 if seg["lines"] else 0)
    dur = max(seg.get("dur", 0), cur + tail)
    audio = np.concatenate(parts)
    audio = np.pad(audio, (0, max(0, int(dur * SR) - len(audio))))
    sf.write(os.path.join(out, seg["id"] + ".wav"), audio, SR)
    timeline.append(dict(id=seg["id"], start=t, dur=dur, lines=lines))
    print(f'{seg["id"]:8s} {dur:6.2f}s  @ {t:7.2f}', flush=True)
    t += dur
json.dump(dict(total=t, voice=VOICE, segments=timeline), open(os.path.join(out, "timeline.json"), "w"), indent=1)
print("TOTAL", t)
