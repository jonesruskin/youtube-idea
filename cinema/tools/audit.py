"""Visual audit: one frame per beat (at 60 % of the beat, when its overlay is fully in) as numbered contact sheets.
  python tools/audit.py ep_jupiter [--jobs 4] → build/<ep>/audit/sheet_NN.jpg (12 frames each, labelled)"""
import os, sys, cv2, numpy as np
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.render import load, boundary_fades, episode_layout, SegRenderer, FPS

ep = sys.argv[1]


def job(args):
    sid, bi, g, label = args
    _, segs = load(ep)
    seg = [s for s in boundary_fades(segs) if s["id"] == sid][0]
    R = SegRenderer(seg, ep)
    i = min(R.n - 1, int((g - seg["start"]) * FPS))
    im = cv2.resize(R.frame(i)[..., ::-1], (640, 360), interpolation=cv2.INTER_AREA)
    cv2.rectangle(im, (0, 0), (640, 22), (0, 0, 0), -1)
    cv2.putText(im, label[:80], (6, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    return im


if __name__ == "__main__":
    lay = episode_layout(ep)
    _, segs = load(ep)
    todo = []
    for s in segs:
        if s["id"] in lay:
            seg, beats, _ = lay[s["id"]]
            for bi, b in enumerate(beats):
                g = seg["start"] + b.t0 + 0.6 * (b.t1 - b.t0)
                todo.append((s["id"], bi, g, f"{g:6.1f}s {s['id']}#{bi} {b.name}"))
    out = os.path.join("build", ep, "audit"); os.makedirs(out, exist_ok=True)
    with Pool(4) as p:
        ims = p.map(job, todo, chunksize=4)
    for k in range(0, len(ims), 12):
        grp = ims[k:k + 12] + [np.zeros_like(ims[0])] * (12 - len(ims[k:k + 12]))
        rows = [np.hstack(grp[r * 3:(r + 1) * 3]) for r in range(4)]
        cv2.imwrite(os.path.join(out, f"sheet_{k // 12:02d}.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 82])
    print(len(ims), "frames →", out)
