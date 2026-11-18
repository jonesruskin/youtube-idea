"""MUTE TEST (founder rule 4): mute it and cover the captions. If a shot doesn't make sense like that, it doesn't work.

  python3 tools/mute_test.py prepare <ep>    every beat rendered at 3 moments with ALL on-screen text removed
                                             -> build/<ep>/mute/frames/<seg>_<beat>.jpg  (one strip per beat)
                                             -> build/<ep>/mute/blind_<k>.md   batches for blind viewers (no script)
                                             -> build/<ep>/mute/narration.json  what is said over each beat (for judges)
  (a fresh AI with no context describes each strip into build/<ep>/mute/blind_<k>.json:
       [{"beat": "c1a#0", "sees": "...", "problems": "..."}]
   a second fresh AI compares those descriptions with narration.json into build/<ep>/mute/judge_<k>.json:
       [{"beat": "c1a#0", "verdict": "PASS"|"FAIL", "why": "..."}])
  python3 tools/mute_test.py finalize <ep>   merges them into build/<ep>/mute/mute_test.json, stamped with the
                                             fingerprint of the beats/scenes/script that were tested
"""
import os, sys, json, glob
from multiprocessing import Pool

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools"))
BATCH = 24


def _job(a):
    os.environ["QA_NOTEXT"] = "1"
    import numpy as np, cv2
    from engine import render as R
    from engine.core import FPS
    seg, ep, out = a
    sr = R.SegRenderer(seg, ep)
    done = []
    for bi, b in enumerate(sr.beats):
        fr = []
        for f in (0.15, 0.5, 0.88):
            i = min(sr.n - 1, max(0, int((b.t0 + f * (b.t1 - b.t0)) * FPS)))
            fr.append(cv2.resize(sr.frame(i)[..., ::-1], (640, 360), interpolation=cv2.INTER_AREA))
        strip = np.concatenate(fr, 1)
        cv2.imwrite(os.path.join(out, f"{seg['id']}_{bi:02d}.jpg"), strip, [cv2.IMWRITE_JPEG_QUALITY, 85])
        done.append(bi)
    return seg["id"], len(done)


def prepare(ep, only=None):
    from engine import render as R
    B = os.path.join(ROOT, "build", ep, "mute")
    out = os.path.join(B, "frames")
    os.makedirs(out, exist_ok=True)
    _, segs = R.load(ep)
    segs = R.boundary_fades(segs)
    lay = R.episode_layout(ep)
    words = R._words(ep)
    todo = [s for s in segs if s["id"] in lay and (not only or s["id"] in only)]
    with Pool(4) as p:
        for sid, n in p.imap_unordered(_job, [(s, ep, out) for s in todo]):
            print("mute frames", sid, n, flush=True)
    beats, narr = [], {}
    for s in segs:
        if s["id"] not in lay:
            continue
        seg, bs, _ = lay[s["id"]]
        for bi, b in enumerate(bs):
            key = f"{s['id']}#{bi}"
            said = " ".join(w["w"] for w in words.get(s["id"], []) if b.t0 - 0.2 <= w["t0"] < b.t1)
            narr[key] = dict(said=said, seconds=round(b.t1 - b.t0, 1), image=f"frames/{s['id']}_{bi:02d}.jpg")
            beats.append(key)
    json.dump(narr, open(os.path.join(B, "narration.json"), "w"), indent=1)
    for k in range(0, len(beats), BATCH):
        part = beats[k:k + BATCH]
        with open(os.path.join(B, f"blind_{k // BATCH:02d}.md"), "w") as f:
            f.write("Each image is ONE shot of a film, shown as three moments left to right (start, middle, end). No sound, no captions.\n\n")
            for key in part:
                f.write(f"- {key}: {os.path.join(B, narr[key]['image'])}\n")
    print(f"{len(beats)} beats in {(len(beats) + BATCH - 1) // BATCH} batches -> {B}")


def finalize(ep):
    from story_gate import fingerprint
    B = os.path.join(ROOT, "build", ep, "mute")
    narr = json.load(open(os.path.join(B, "narration.json")))
    blind, judge = {}, {}
    for f in sorted(glob.glob(os.path.join(B, "blind_*.json"))):
        blind.update({r["beat"]: r for r in json.load(open(f))})
    for f in sorted(glob.glob(os.path.join(B, "judge_*.json"))):
        judge.update({r["beat"]: r for r in json.load(open(f))})
    res = []
    for key in narr:
        j = judge.get(key, {})
        res.append(dict(beat=key, said=narr[key]["said"], sees=blind.get(key, {}).get("sees", ""),
                        problems=blind.get(key, {}).get("problems", ""), verdict=j.get("verdict", "MISSING"), why=j.get("why", "")))
    json.dump(dict(fingerprint=fingerprint(ep), results=res), open(os.path.join(B, "mute_test.json"), "w"), indent=1)
    bad = [r for r in res if r["verdict"] != "PASS"]
    with open(os.path.join(B, "mute_report.md"), "w") as f:
        f.write(f"# Mute test · {ep}\n\n{len(res) - len(bad)}/{len(res)} beats understood without sound or captions\n\n")
        for r in bad:
            f.write(f"- **{r['beat']}** {r['verdict']}: {r['why']}\n  - said: {r['said']}\n  - blind viewer saw: {r['sees']}\n")
    print(f"{len(res) - len(bad)}/{len(res)} PASS; report: {B}/mute_report.md")


if __name__ == "__main__":
    cmd, ep = sys.argv[1], sys.argv[2]
    if cmd == "prepare":
        prepare(ep, set(sys.argv[3].split(",")) if len(sys.argv) > 3 else None)
    else:
        finalize(ep)
