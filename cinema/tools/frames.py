"""Render single frames at global times (s) without a full render: python tools/frames.py ep t1 t2 ... → build/<ep>/frames/"""
import os, sys, cv2
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.render import load, boundary_fades, SegRenderer, FPS
ep = sys.argv[1]
_, segs = load(ep)
segs = boundary_fades(segs)
out = os.path.join("build", ep, "frames"); os.makedirs(out, exist_ok=True)
cache = {}
for a in sys.argv[2:]:
    g = float(a)
    seg = max((s for s in segs if s["start"] <= g), key=lambda s: s["start"])
    R = cache.setdefault(seg["id"], SegRenderer(seg, ep))
    i = min(R.n - 1, int(round((g - seg["start"]) * FPS)))
    p = os.path.join(out, f"{g:07.2f}.jpg")
    cv2.imwrite(p, cv2.resize(R.frame(i)[..., ::-1], (960, 540)), [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(p, seg["id"], flush=True)
