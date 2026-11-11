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

SHOTS = dict(lens=Lens, planet=Planet, earth=Earth, sun=Sun, leave=Leave, spaghetti=Spaghetti, ground=Ground,
             tide=Tide, ice=Ice, vent=Vent, system=System, orbit=Orbit, galaxy=Galaxy, moon=Moon)


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


def frame(shot, seg, i, n):
    lt = i / FPS
    u = i / max(1, n - 1)
    img = shot.render(u, seg["start"] + lt, i)
    out = post(img, i + int(seg["start"] * FPS), **shot.post_kw()).astype(np.float32) / 255.0
    if seg.get("card"):
        out = cards.card(out, seg["card"], lt, seg["dur"])
    k = 1.0
    if seg["fade_in"]:
        k *= smooth(span(lt, 0, seg["fade_in"]))
    if seg["fade_out"]:
        k *= 1 - smooth(span(lt, seg["dur"] - seg["fade_out"], seg["dur"]))
    out = np.clip(out * k, 0, 1)
    return (out * 255 + 0.5).astype(np.uint8)


def render_segment(args):
    seg, outdir = args
    t0 = time.time()
    n = int(round(seg["dur"] * FPS))
    shot = SHOTS[seg["shot"]["type"]](seg["shot"], seg["dur"], seg["start"])
    path = os.path.join(outdir, seg["id"] + ".mp4")
    tmp = path + ".part.mp4"
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-tune", "grain", tmp], stdin=subprocess.PIPE)
    for i in range(n):
        ff.stdin.write(frame(shot, seg, i, n).tobytes())
    ff.stdin.close()
    ff.wait()
    os.replace(tmp, path)
    return seg["id"], n, time.time() - t0


def stills(seg, outdir):
    n = int(round(seg["dur"] * FPS))
    shot = SHOTS[seg["shot"]["type"]](seg["shot"], seg["dur"], seg["start"])
    for k, f in enumerate((0.12, 0.5, 0.9)):
        i = int(f * (n - 1))
        cv2.imwrite(os.path.join(outdir, f"{seg['id']}_{k}.jpg"), frame(shot, seg, i, n)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
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
            for sid in p.imap_unordered(_still_job, [(s, out) for s in todo]):
                print("still", sid, flush=True)
        return
    out = os.path.join(ROOT, "build", a.ep, "segments")
    os.makedirs(out, exist_ok=True)
    todo.sort(key=lambda s: -s["dur"])
    t0 = time.time()
    with Pool(a.jobs) as p:
        for sid, n, dt in p.imap_unordered(render_segment, [(s, out) for s in todo]):
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
