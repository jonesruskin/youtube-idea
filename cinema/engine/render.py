"""Render an episode: shots on the voice timeline → per-segment MP4s → concatenated picture track.

  python -m engine.render ep_blackhole                 # full render
  python -m engine.render ep_blackhole --stills        # 3 stills per segment → build/<ep>/stills
  python -m engine.render ep_blackhole --only c2b,c3a  # re-render specific segments
"""
import os, sys, json, time, subprocess, importlib.util, argparse
import numpy as np
import cv2
from multiprocessing import Pool
from .core import W, H, FPS, ROOT, post, smooth, span
from . import cards
from .shots_space import Lens, Planet, Earth, Sun, Leave, Spaghetti
from .shots_ground import Ground, Tide, Ice, Vent
from .shots_diagram import System, Orbit, Galaxy, Moon
from .ground2 import Night
from . import beats as beatmod

SHOTS = dict(lens=Lens, planet=Planet, earth=Earth, sun=Sun, leave=Leave, spaghetti=Spaghetti, ground=Ground,
             tide=Tide, ice=Ice, vent=Vent, system=System, orbit=Orbit, galaxy=Galaxy, moon=Moon, night=Night)


def load(ep):
    spec = importlib.util.spec_from_file_location("script", os.path.join(ROOT, ep, "script.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    tl = json.load(open(os.path.join(ROOT, "build", ep, "voice", "timeline.json")))
    segs = []
    for seg, t in zip(mod.SEGMENTS, tl["segments"]):
        assert seg["id"] == t["id"], (seg["id"], t["id"])
        segs.append(dict(seg, start=t["start"], dur=t["dur"], vlines=t["lines"]))
    return mod, segs


def boundary_fades(segs):
    """Dip to black around chapter/fate/title boundaries; hard cuts elsewhere."""
    for i, s in enumerate(segs):
        c = s.get("card", {}) or {}
        s["fade_in"] = 0.45 if (i == 0 or c.get("kind") in ("chapter", "fate", "title")) else 0.0
    for i, s in enumerate(segs):
        nxt = segs[i + 1] if i + 1 < len(segs) else None
        s["fade_out"] = 0.45 if (nxt is None or nxt["fade_in"] > 0) else 0.0
    return segs


class SegRenderer:
    """Renders one segment: either line-by-line beats (preferred) or the legacy single shot."""

    def __init__(self, seg, ep):
        self.seg = seg
        self.n = int(round(seg["dur"] * FPS))
        self.beats = None
        lay = episode_layout(ep)
        if seg["id"] in lay:
            self.seg, self.beats, self.ctxs = lay[seg["id"]]
        else:
            self.shot = SHOTS[seg["shot"]["type"]](seg["shot"], seg["dur"], seg["start"])

    def frame(self, i):
        seg = self.seg
        lt = i / FPS
        if self.beats is not None:
            out = beatmod.render_frame(seg, self.beats, self.ctxs, lt, i)
            c = seg.get("card") or {}
            if c.get("kind") in ("chapter", "fate", "title", "endcard"):
                out = cards.card(out, c, lt, seg["dur"])
        else:
            u = i / max(1, self.n - 1)
            img = self.shot.render(u, seg["start"] + lt, i)
            out = post(img, i + int(seg["start"] * FPS), **self.shot.post_kw()).astype(np.float32) / 255.0
            if seg.get("card"):
                out = cards.card(out, seg["card"], lt, seg["dur"])
        k = 1.0
        if seg["fade_in"]:
            k *= smooth(span(lt, 0, seg["fade_in"]))
        if seg["fade_out"]:
            k *= 1 - smooth(span(lt, seg["dur"] - seg["fade_out"], seg["dur"]))
        out = np.clip(out * k, 0, 1)
        return (out * 255 + 0.5).astype(np.uint8)


_BM, _WD, _LAY = {}, {}, {}


def episode_layout(ep):
    """Beats for every segment of the episode, laid out and linked into continuous shots (cached per process)."""
    if ep not in _LAY:
        _, segs = load(ep)
        segs = boundary_fades(segs)
        bm = _beatsheet(ep)
        out, items = {}, []
        for seg in segs:
            if bm is not None and seg["id"] in bm.BEATS:
                beats = beatmod.layout(seg, bm.BEATS[seg["id"]], _words(ep).get(seg["id"], []))
                ctxs = [beatmod.Ctx(b, seg) for b in beats]
                out[seg["id"]] = (seg, beats, ctxs)
                items += [(seg, b, c) for b, c in zip(beats, ctxs)]
            else:
                items.append((seg, None, None))
        # a legacy (non-beat) segment breaks continuity
        chunk = []
        for it in items + [(None, None, None)]:
            if it[1] is None:
                if chunk:
                    beatmod.link_runs(chunk)
                chunk = []
            else:
                chunk.append(it)
        _LAY[ep] = out
    return _LAY[ep]


def _beatsheet(ep):
    if ep not in _BM:
        p = os.path.join(ROOT, ep, "beats.py")
        if os.path.exists(p):
            import sys as _s
            if ROOT not in _s.path:
                _s.path.insert(0, ROOT)
            _BM[ep] = importlib.import_module(ep + ".beats")
        else:
            _BM[ep] = None
    return _BM[ep]


def _words(ep):
    if ep not in _WD:
        p = os.path.join(ROOT, "build", ep, "voice", "words.json")
        _WD[ep] = json.load(open(p)) if os.path.exists(p) else {}
    return _WD[ep]


def render_segment(args):
    seg, outdir, ep = args
    t0 = time.time()
    R = SegRenderer(seg, ep)
    path = os.path.join(outdir, seg["id"] + ".mp4")
    tmp = path + ".part.mp4"
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-tune", "grain", tmp], stdin=subprocess.PIPE)
    for i in range(R.n):
        ff.stdin.write(R.frame(i).tobytes())
    ff.stdin.close()
    ff.wait()
    os.replace(tmp, path)
    return seg["id"], R.n, time.time() - t0


def stills(seg, outdir, ep):
    R = SegRenderer(seg, ep)
    if R.beats is None:
        for k, f in enumerate((0.12, 0.5, 0.9)):
            i = int(f * (R.n - 1))
            cv2.imwrite(os.path.join(outdir, f"{seg['id']}_{k}.jpg"), R.frame(i)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 88])
        return seg["id"]
    for bi, b in enumerate(R.beats):
        os.environ["QA_CTX"] = f"{seg['id']}#{bi}"
        for k, f in enumerate((0.15, 0.55, 0.92)):
            i = int((b.t0 + f * (b.t1 - b.t0)) * FPS)
            i = min(R.n - 1, max(0, i))
            cv2.imwrite(os.path.join(outdir, f"{seg['id']}_{bi:02d}_{k}.jpg"), R.frame(i)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 88])
    return seg["id"]


def _still_job(a):
    import traceback
    try:
        return stills(*a)
    except Exception:
        return a[0]["id"] + " FAILED\n" + traceback.format_exc()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ep")
    ap.add_argument("--stills", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--jobs", type=int, default=4)
    a = ap.parse_args()
    mod, segs = load(a.ep)
    segs = boundary_fades(segs)
    only = set(x for x in a.only.split(",") if x)
    todo = [s for s in segs if not only or s["id"] in only]
    if a.stills:
        out = os.path.join(ROOT, "build", a.ep, "stills")
        os.makedirs(out, exist_ok=True)
        with Pool(a.jobs) as p:
            for sid in p.imap_unordered(_still_job, [(s, out, a.ep) for s in todo]):
                print("still", sid, flush=True)
        return
    out = os.path.join(ROOT, "build", a.ep, "segments")
    os.makedirs(out, exist_ok=True)
    todo.sort(key=lambda s: -s["dur"])
    t0 = time.time()
    with Pool(a.jobs) as p:
        for sid, n, dt in p.imap_unordered(render_segment, [(s, out, a.ep) for s in todo]):
            print(f"{sid:8s} {n:5d} frames  {dt:6.1f}s  ({n / dt:.2f} fps)  elapsed {time.time() - t0:.0f}s", flush=True)
    # concatenate in story order
    lst = os.path.join(ROOT, "build", a.ep, "segments.txt")
    with open(lst, "w") as f:
        for s in segs:
            f.write(f"file '{os.path.join(out, s['id'] + '.mp4')}'\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
                    os.path.join(ROOT, "build", a.ep, "picture.mp4")], check=True)
    print("picture.mp4 done", time.time() - t0)


if __name__ == "__main__":
    main()
