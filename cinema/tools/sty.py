"""Style frames: python3 tools/sty.py out.jpg "<expr>" [t] [u] ...  renders scene expressions (ep_tanis.world/cine) through the real post."""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import numpy as np, cv2
from engine.core import post
from ep_tanis.world import *
from ep_tanis.cine import *
class C:
    def __init__(s): s.state = {}; s.dur = 4.0; s.prev = None; s.story_prev = None; s.seg = dict(start=0.0, words=[]); s.run_t0 = 0.0; s.run_dur = 4.0
    def ru(s, t): return t / 4
    def w(s, *a, **k): return 0.0
out = sys.argv[1]
tiles = []
for spec in sys.argv[2:]:
    expr, t, u = (spec.split("@") + ["2.0", "0.5"])[:3]
    class B: t0 = 0.0
    c = C(); c.beat = B()
    t0 = time.time()
    r = eval(expr)(c, float(t), float(u), int(float(t) * 30))
    img, kw = r if isinstance(r, tuple) else (r, {})
    o = post(img, int(float(t) * 30), **kw)
    o = o if o.dtype == np.uint8 else np.clip(o * 255, 0, 255).astype(np.uint8)
    print(f"{expr[:60]}  {time.time() - t0:.2f}s", flush=True)
    tiles.append(cv2.resize(o, (960, 540), interpolation=cv2.INTER_AREA))
while len(tiles) % 2: tiles.append(np.zeros_like(tiles[0]))
rows = [np.concatenate(tiles[i:i + 2], 1) for i in range(0, len(tiles), 2)]
cv2.imwrite(out, cv2.cvtColor(np.concatenate(rows, 0), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
