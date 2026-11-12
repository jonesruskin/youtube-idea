"""Line-by-line visual beats.

A segment is split into beats aligned to narration lines (optionally to a specific word), so every sentence
has its own picture. Each beat = a HDR scene (rendered, then graded by `post`) + an optional overlay drawn on the
graded image (crisp explainer graphics/text). Beats crossfade (default) or hard-cut."""
import os
import re
import numpy as np
from .core import FPS, post, smooth, span
from . import cards


def _norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


class Beat:
    def __init__(self, line, scene, over=None, at=None, cut=False, lead=0.15, post_kw=None, name="", covers=None):
        self.line, self.scene, self.over, self.at, self.cut = line, scene, over, at, cut
        self.covers = covers if covers is not None else [line]
        self.lead = lead
        self.post_kw = post_kw or {}
        self.name = name
        self.t0 = self.t1 = 0.0
        self.words = []


class Ctx:
    """Per-beat context handed to scene/overlay functions."""

    def __init__(self, beat, seg):
        self.beat, self.seg = beat, seg
        self.dur = beat.t1 - beat.t0
        self.state = {}

    def w(self, word, k=0, default=None):
        """Time (s, relative to beat start) when the k-th matching word starts (searching the whole segment)."""
        n = _norm(word)
        hits = [x for x in self.seg["words"] if _norm(x["w"]).startswith(n)]
        hits = [x for x in hits if x["t0"] >= self.beat.t0 - 0.6] or hits
        if len(hits) > k:
            return hits[k]["t0"] - self.beat.t0
        return default if default is not None else 0.0

    def wend(self, word, k=0):
        n = _norm(word)
        hits = [x for x in self.seg["words"] if _norm(x["w"]).startswith(n) and x["t0"] >= self.beat.t0 - 0.6]
        return (hits[k]["t1"] - self.beat.t0) if len(hits) > k else self.dur


def align_words(lines, asr):
    """Word timings from the narration's exact line timings (character-proportional), snapped to speech-recognition
    timestamps when a matching word is found nearby. Robust even if recognition misses whole sentences."""
    out, snapped, total = [], 0, 0
    for ln in lines:
        toks = ln["text"].split()
        L = sum(len(t) + 1 for t in toks)
        c = 0
        for tk in toks:
            est = ln["start"] + (ln["end"] - ln["start"]) * c / max(1, L)
            c += len(tk) + 1
            n = _norm(tk)
            best = None
            for w in asr:
                if _norm(w["w"]) == n and abs(w["t0"] - est) < 0.9:
                    if best is None or abs(w["t0"] - est) < abs(best["t0"] - est):
                        best = w
            total += 1
            if best is not None:
                snapped += 1
                out.append(dict(w=tk, t0=best["t0"], t1=best["t1"]))
            else:
                out.append(dict(w=tk, t0=round(est, 3), t1=round(est + 0.25, 3)))
    return out, (snapped / total if total else 1.0)


def layout(seg, beats, words):
    """Assign t0/t1 (segment-local seconds) to each beat."""
    words, _ = align_words(seg["vlines"], words)
    seg["words"] = words
    lines = seg["vlines"]
    for b in beats:
        if b.at is not None:
            n = _norm(b.at[0] if isinstance(b.at, tuple) else b.at)
            k = b.at[1] if isinstance(b.at, tuple) else 0
            ls = lines[b.line]["start"] if b.line < len(lines) else 0
            hits = [x for x in words if _norm(x["w"]).startswith(n) and x["t0"] >= ls - 0.4]
            start = hits[k]["t0"] if len(hits) > k else ls
        else:
            start = lines[b.line]["start"] if b.line < len(lines) else 0
        b.t0 = max(0.0, start - b.lead)
    beats[0].t0 = 0.0
    for i, b in enumerate(beats):
        b.t1 = beats[i + 1].t0 if i + 1 < len(beats) else seg["dur"]
    return beats


XF = 0.3  # crossfade seconds


def render_frame(seg, beats, ctxs, lt, fi):
    """Composite the beat(s) active at segment-local time lt → float image in [0,1]."""
    i = max(k for k, b in enumerate(beats) if b.t0 <= lt + 1e-6)
    out = _one(seg, beats[i], ctxs[i], lt, fi)
    b = beats[i]
    if i > 0 and not b.cut and lt - b.t0 < XF:
        prev = _one(seg, beats[i - 1], ctxs[i - 1], lt, fi)
        k = smooth((lt - b.t0) / XF)
        out = prev * (1 - k) + out * k
    return out


def _one(seg, b, ctx, lt, fi):
    t = lt - b.t0
    u = np.clip(t / max(1e-3, b.t1 - b.t0), 0, 1.2)
    res = b.scene(ctx, t, u, fi)
    if isinstance(res, tuple):
        hdr, pk = res
    else:
        hdr, pk = res, {}
    kw = dict(exposure=1.45, bloom=0.55, grade=((0.012, 0.014, 0.03), (1.0, 1.0, 1.0)))
    kw.update(b.post_kw)
    kw.update(pk)
    img = post(hdr, fi + int(seg["start"] * FPS), **kw).astype(np.float32) / 255.0
    if b.over is not None:
        if os.environ.get("QA_LOG"):
            from . import hud
            hud.QA["key"] = (seg["id"], id(b), fi)
        img = b.over(ctx, img, t, u)
    return np.clip(img, 0, 1)
