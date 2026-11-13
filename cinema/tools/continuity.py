"""Continuity report: every beat boundary in story order, marked CONT (same continuous shot: overlays change, the
picture glides) or CUT (the scene changes). Review every CUT: it must be a real change of place or view.
  python tools/continuity.py ep_jupiter [--cuts]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.render import episode_layout, load, boundary_fades
from engine.beats import scene_key, _unwrap


def name(scene):
    s, dim = _unwrap(scene)
    k = scene_key(scene)
    n = ".".join(str(x) for x in k[:2]) if k[0] != "obj" else getattr(s, "__qualname__", "?")
    n = n.replace("ep_jupiter.", "").replace("ep_blackhole.", "").replace("engine.", "")
    extra = [f"{a}={b}" for a, b in k[2:]] if k[0] != "obj" else []
    return n + (f"[{','.join(extra)}]" if extra else "") + (" (dimmed)" if dim != (1.0, 0.0) else "")


def report(ep, only_cuts=False):
    lay = episode_layout(ep)
    _, segs = load(ep)
    segs = boundary_fades(segs)
    prev = None
    rows = []
    for s in segs:
        if s["id"] not in lay:
            prev = None
            continue
        seg, beats, ctxs = lay[s["id"]]
        for b, c in zip(beats, ctxs):
            if prev is not None:
                kind = "CONT" if c.prev is not None else ("FADE" if (b is beats[0] and seg["fade_in"]) else "CUT ")
                if not only_cuts or kind == "CUT ":
                    rows.append(f"{kind} {seg['start'] + b.t0:7.1f}s  {seg['id']:6s}#{beats.index(b)}  {name(prev)}  →  {name(b.scene)}   «{b.name}»")
            prev = b.scene
    return rows


if __name__ == "__main__":
    ep = sys.argv[1]
    rows = report(ep, "--cuts" in sys.argv)
    print("\n".join(rows))
    print(f"\n{sum(r.startswith('CONT') for r in rows)} continuous, {sum(r.startswith('CUT') for r in rows)} cuts, {sum(r.startswith('FADE') for r in rows)} chapter fades")
