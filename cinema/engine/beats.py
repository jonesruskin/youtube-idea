"""Line-by-line visual beats.

A segment is split into beats aligned to narration lines (optionally to a specific word), so every sentence
has its own picture. Each beat = a HDR scene (rendered, then graded by `post`) + an optional overlay drawn on the
graded image (crisp explainer graphics/text). Beats crossfade (default) or hard-cut."""
import os
import re
import inspect
import functools
import numpy as np
import cv2
from .core import FPS, post, smooth, smoother, span
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
        self.prev = None          # (beat, ctx) of the previous beat when it is the SAME continuous shot
        self.story_prev = None    # (beat, ctx) of the previous beat in story order when no chapter fade separates them
        self.run_t0 = seg["start"] + beat.t0
        self.run_dur = max(1e-3, self.dur)

    def ru(self, t):
        """Progress 0..1 through the whole continuous shot (all beats sharing this scene), for camera drift."""
        return float(np.clip((self.seg["start"] + self.beat.t0 + t - self.run_t0) / self.run_dur, 0.0, 1.0))

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


# ═══════════════════════ continuity: one shot across many beats ═══════════════════════
# Consecutive beats that show the same scene are ONE continuous shot. The picture never cuts or dissolves between
# them: scene parameters glide from the old framing to the new one (XT), and only the explanatory overlays crossfade
# (XO). Cuts happen only when the scene itself changes (a different place, a different view) or at chapter cards.
XF = 0.5   # dissolve between DIFFERENT scenes (also across segment boundaries); cut=True forces a hard cut
XT = 1.4   # camera / parameter glide inside one continuous shot
XO = 0.45  # overlay crossfade inside one continuous shot


def _isnum(v):
    if isinstance(v, (bool, np.bool_)):
        return False
    if isinstance(v, (int, float, np.integer, np.floating)):
        return True
    if isinstance(v, (tuple, list)) and len(v) > 0:
        return all(_isnum(x) for x in v)
    return False


def _shape(v):
    return tuple(_shape(x) for x in v) if isinstance(v, (tuple, list)) else ()


def _lerp(a, b, e):
    if isinstance(a, (tuple, list)):
        return tuple(_lerp(x, y, e) for x, y in zip(a, b))
    return a + (b - a) * e


def scene_factory(pairs=(), vectors=(), dyn=(), keys=None):
    """Decorate a scene factory so the engine can make one continuous shot from consecutive beats.
    pairs:   (a, b) argument pairs that are a start→end range across the beat (like tau0, tau1)
    vectors: 2-tuple arguments that are NOT start→end ranges (positions, sizes); other 2-tuples are ranges
    dyn:     arguments that may be a value OR a callable(ctx, t, u) returning one (blended by value)
    keys:    the string arguments that identify the place/view (a different value = a different shot, so a cut).
             Default: every string argument. Any other non-numeric difference (flags, labels, callables) is a
             feature that crossfades on top of one continuous camera."""
    def deco(fn):
        sig = inspect.signature(fn)

        @functools.wraps(fn)
        def make(*a, **kw):
            ba = sig.bind(*a, **kw)
            ba.apply_defaults()
            args = dict(ba.arguments)
            for name, prm in sig.parameters.items():
                if prm.kind == prm.VAR_KEYWORD:
                    args.update(args.pop(name, {}) or {})
            clo = fn(*a, **kw)
            clo._make, clo._kw, clo._spec = make, args, (tuple(pairs), set(vectors), set(dyn))
            iskey = (lambda k, v: isinstance(v, str)) if keys is None else (lambda k, v: k in keys)
            clo._key = (fn.__module__, fn.__qualname__) + tuple(sorted((k, str(v)) for k, v in args.items() if iskey(k, v)))
            return clo
        return make
    return deco


class Track:
    """One smooth parameter track across several beats of a continuous shot. Knots are (global time, value) at the
    beat boundaries, so every beat still hits the value it was designed for at its start and end, but the speed is
    continuous through the boundaries (monotone cubic; eases in and out only at the ends of the whole track)."""

    def __init__(self, times, values, kind="range", space="lin"):
        self.t = np.asarray(times, np.float64)
        self.kind, self.space = kind, space
        v = np.asarray(values, np.float64)
        self.v = np.log1p(np.maximum(v, 0.0)) if space == "log1p" else (np.log(v) if space == "log" else v)
        h = np.diff(self.t)
        dv = np.diff(self.v, axis=0) / h.reshape((-1,) + (1,) * (self.v.ndim - 1))
        m = np.zeros_like(self.v)
        for i in range(1, len(self.t) - 1):        # PCHIP interior slopes: monotone, no overshoot
            a_, b_ = dv[i - 1], dv[i]
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            with np.errstate(divide="ignore", invalid="ignore"):
                hm = (w1 + w2) / (w1 / a_ + w2 / b_)
            m[i] = np.where(a_ * b_ > 0, hm, 0.0)
        self.m = m                                  # end slopes 0: the whole move eases in and out once

    def __call__(self, g):
        g = float(np.clip(g, self.t[0], self.t[-1]))
        i = int(np.clip(np.searchsorted(self.t, g) - 1, 0, len(self.t) - 2))
        h = self.t[i + 1] - self.t[i]
        s_ = (g - self.t[i]) / h
        h00, h10, h01, h11 = 2 * s_ ** 3 - 3 * s_ ** 2 + 1, s_ ** 3 - 2 * s_ ** 2 + s_, -2 * s_ ** 3 + 3 * s_ ** 2, s_ ** 3 - s_ ** 2
        v = h00 * self.v[i] + h10 * h * self.m[i] + h01 * self.v[i + 1] + h11 * h * self.m[i + 1]
        if self.space == "log1p":
            v = np.expm1(v)
        elif self.space == "log":
            v = np.exp(v)
        return float(v) if np.ndim(v) == 0 else tuple(float(x) for x in v)


def resolve_kw(kw, spec, g):
    """Replace Track values by constants for global time g (a range (v, v), a pair a = b = v)."""
    out = dict(kw)
    for k, v in kw.items():
        if isinstance(v, Track):
            x = v(g)
            out[k] = (x, x) if v.kind == "range" else x
    return out


def kw_at(ctx, g):
    """The scene arguments of ctx's beat at global time g, Tracks resolved, plus the beat's u at g."""
    sc, _ = _unwrap(ctx.beat.scene)
    u = (g - (ctx.seg["start"] + ctx.beat.t0)) / max(1e-3, ctx.dur)
    if not hasattr(sc, "_kw"):
        return None, u
    return resolve_kw(sc._kw, sc._spec, g), u


def dimmed(scene, k=0.35, sigma=9):
    """Scene pushed back (blurred + darkened) behind a diagram. Same shot as the undimmed scene: dimming glides."""
    def f(ctx, t, u, fi):
        return _apply_dim(scene(ctx, t, u, fi), k, sigma)
    f._inner, f._dim = scene, (k, sigma)
    f._key = scene_key(scene)
    return f


def _apply_dim(r, k, sigma):
    img, pk = r if isinstance(r, tuple) else (r, {})
    if sigma > 0.3:
        img = cv2.GaussianBlur(img, (0, 0), sigma)
    return img * k, pk


def _unwrap(scene):
    if hasattr(scene, "_inner"):
        return scene._inner, scene._dim
    return scene, (1.0, 0.0)


def scene_key(scene):
    s, _ = _unwrap(scene)
    if hasattr(s, "_key"):
        return s._key
    return ("obj", id(s))


def _ev(v, ctx, t, u):
    return v(ctx, t, u) if callable(v) else v


def _blend_kw(pk, ck, spec, e, pctx):
    pairs, vectors, dyn = spec
    out, done = dict(ck), set()
    for pr in pairs:
        a, b = pr[0], pr[1]
        if all(_isnum(x.get(n)) for x in (pk, ck) for n in (a, b)):
            pe = pk[b]
            out[a], out[b] = _lerp(pe, ck[a], e), _lerp(pe, ck[b], e)
        done |= {a, b}
    for k, cv in ck.items():
        if k in done or k not in pk:
            continue
        pv = pk[k]
        if k in dyn:
            if pv is cv or pv is None or cv is None:
                continue
            pend = _ev(pv, pctx, pctx.dur, 1.0)
            if not _isnum(pend):
                continue
            out[k] = (lambda pend, cv: lambda c, t, u: _lerp(pend, _ev(cv, c, t, u), e))(pend, cv)
        elif _isnum(cv) and _isnum(pv) and _shape(cv) == _shape(pv):
            if isinstance(cv, (tuple, list)) and len(cv) == 2 and k not in vectors:
                pe = pv[1]
                out[k] = (_lerp(pe, cv[0], e), _lerp(pe, cv[1], e))
            else:
                out[k] = _lerp(pv, cv, e)
    return out


def _feature(v):
    return not _isnum(v)


def _features_differ(pk, ck, spec):
    """Non-numeric differences (flags, labels, callables, lists): these crossfade instead of gliding."""
    dyn = spec[2]
    for k in set(pk) | set(ck):
        if k in dyn:
            continue
        if (k in pk) != (k in ck):
            return True                      # a setting only one beat has (e.g. scorch on, then freeze on)
        a, b = pk.get(k), ck.get(k)
        if callable(a) or callable(b):
            if a is not b:
                return True
        elif (_feature(a) or _feature(b)) and not _eq(a, b):
            return True
    return False


def _eq(a, b):
    try:
        return bool(a == b)
    except Exception:
        return a is b


def _scene_call(seg, b, ctx, lt, fi):
    """The scene for beat b at segment time lt, gliding in from the previous beat of the same shot."""
    t = lt - b.t0
    u = np.clip(t / max(1e-3, b.t1 - b.t0), 0, 1.2)
    cur, cdim = _unwrap(b.scene)
    g = seg["start"] + lt
    if hasattr(cur, "_kw") and any(isinstance(v, Track) for v in cur._kw.values()):
        ckw = resolve_kw(cur._kw, cur._spec, g)
        call = cur._make(**ckw)
    else:
        ckw, call = getattr(cur, "_kw", None), cur
    pr = ctx.prev
    xt = min(XT, 0.7 * max(ctx.dur, 1e-3))
    if pr is None or t >= xt:
        res = call(ctx, t, u, fi)
        return (_apply_dim(res, *cdim) if cdim != (1.0, 0.0) else res), None
    pb, pctx = pr
    e = smoother(t / xt)
    prv, pdim = _unwrap(pb.scene)
    dim = _lerp(pdim, cdim, e)
    second = None
    if hasattr(cur, "_make") and hasattr(prv, "_make"):
        g_pe = pctx.seg["start"] + pb.t1
        pkw0 = resolve_kw(prv._kw, prv._spec, g_pe)
        shared = {k for k, v in cur._kw.items() if isinstance(v, Track) and prv._kw.get(k) is v}
        kw = _blend_kw({k: v for k, v in pkw0.items() if k not in shared}, ckw, cur._spec, e, pctx)
        res = cur._make(**kw)(ctx, t, u, fi)
        if t < XO and _features_differ(pkw0, ckw, cur._spec):
            # something only one of the two beats draws: render both with the identical camera and crossfade
            pkw = dict(kw)
            for k, v in pkw0.items():
                if k not in ckw or (k not in cur._spec[2] and (_feature(v) or _feature(ckw.get(k)))):
                    pkw[k] = v
            for k in ckw:
                if k not in pkw0:
                    pkw.pop(k, None)
            tp = seg["start"] + lt - (pctx.seg["start"] + pb.t0)
            second = _apply_dim(cur._make(**pkw)(pctx, tp, 1.0, fi), *dim)
    else:
        res = call(ctx, t, u, fi)
    return _apply_dim(res, *dim), second


def _graded(seg, b, res, fi, prev_post=None, e=1.0):
    """Grade the HDR scene. prev_post/e: inside one continuous shot, the previous beat's grading glides into this one."""
    hdr, pk = res if isinstance(res, tuple) else (res, {})
    kw = dict(exposure=1.45, bloom=0.55, grade=((0.012, 0.014, 0.03), (1.0, 1.0, 1.0)))
    kw.update(b.post_kw)
    kw.update(pk)
    if prev_post is not None and e < 1.0:
        pkw = dict(exposure=1.45, bloom=0.55, grade=((0.012, 0.014, 0.03), (1.0, 1.0, 1.0)))
        pkw.update(prev_post)
        pkw.update(pk)
        for k in kw:
            if k in pkw and _isnum(kw[k]) and _isnum(pkw[k]) and _shape(kw[k]) == _shape(pkw[k]):
                kw[k] = _lerp(pkw[k], kw[k], e)
    return post(hdr, fi + int(seg["start"] * FPS), **kw).astype(np.float32) / 255.0


def _overlay(seg, b, ctx, img, lt):
    if b.over is None:
        return img
    t = lt - b.t0
    u = np.clip(t / max(1e-3, b.t1 - b.t0), 0, 1.2)
    if os.environ.get("QA_LOG"):
        from . import hud
        hud.QA["key"] = (seg["id"], id(b), int(lt * FPS))
    return b.over(ctx, img, t, u)


def render_frame(seg, beats, ctxs, lt, fi):
    """Composite the beat(s) active at segment-local time lt → float image in [0,1]."""
    i = max(k for k, b in enumerate(beats) if b.t0 <= lt + 1e-6)
    b, ctx = beats[i], ctxs[i]
    t = lt - b.t0
    if ctx.prev is not None:
        # same continuous shot as the previous beat: no picture change, only the overlays crossfade
        res, second = _scene_call(seg, b, ctx, lt, fi)
        pb, pctx = ctx.prev
        xt = min(XT, 0.7 * max(ctx.dur, 1e-3))
        ge = smoother(min(1.0, t / xt))
        base = _graded(seg, b, res, fi, pb.post_kw, ge)
        pctx.state.update({k: v for k, v in ctx.state.items() if k != "shot"})
        if "shot" in ctx.state and "shot" not in pctx.state:   # previous beat rendered in another segment
            import copy
            pctx.state["shot"] = copy.copy(ctx.state["shot"])
        lt_prev = seg["start"] + lt - pctx.seg["start"]
        out = _overlay(seg, b, ctx, base.copy(), lt)
        if t < XO:
            pbase = _graded(seg, b, second, fi, pb.post_kw, ge) if second is not None else base
            prev = _overlay(pctx.seg, pb, pctx, pbase.copy(), lt_prev)
            k = smooth(t / XO)
            out = prev * (1 - k) + out * k
        return np.clip(out, 0, 1)
    out = _one(seg, b, ctx, lt, fi)
    sp = ctx.story_prev
    if sp is not None and not b.cut and t < XF:
        pb, pctx = sp
        prev = _one(pctx.seg, pb, pctx, seg["start"] + lt - pctx.seg["start"], fi)
        k = smooth(t / XF)
        out = prev * (1 - k) + out * k
    return out


def _one(seg, b, ctx, lt, fi):
    res, _ = _scene_call(seg, b, ctx, lt, fi)
    return np.clip(_overlay(seg, b, ctx, _graded(seg, b, res, fi), lt), 0, 1)


def link_runs(items):
    """items: [(seg, beat, ctx)] in story order for the whole episode. Links consecutive beats that are the same
    continuous shot (same scene key, no chapter fade between them, not marked cut=True) and gives every beat its
    run's start and length (for camera drift that must not restart at each beat)."""
    runs, cur = [], []
    for k, (seg, b, ctx) in enumerate(items):
        same = False
        if k > 0:
            pseg, pb, pctx = items[k - 1]
            boundary_ok = (pseg is seg) or (seg.get("fade_in", 0) == 0 and pseg.get("fade_out", 0) == 0)
            same = boundary_ok and not b.cut and scene_key(pb.scene) == scene_key(b.scene)
            if boundary_ok:
                ctx.story_prev = (pb, pctx)
        if same:
            ctx.prev = (items[k - 1][1], items[k - 1][2])
            cur.append(ctx)
        else:
            if cur:
                runs.append(cur)
            cur = [ctx]
    if cur:
        runs.append(cur)
    for r in runs:
        t0 = r[0].seg["start"] + r[0].beat.t0
        t1 = r[-1].seg["start"] + r[-1].beat.t1
        cache = {}
        for c in r:
            c.run_t0, c.run_dur = t0, max(1e-3, t1 - t0)
            c.run, c.run_cache = r, cache
        _spread_ranges(r)
    return runs


def _spread_ranges(run):
    """Turn start→end ranges that continue across consecutive beats of one shot into smooth Tracks:
    - contiguous chains (this beat starts where the last one ended): knots at every boundary, continuous speed;
    - the same range repeated (the same slow push-in): one move across those beats.
    Without this, every beat eases in and out on its own and the motion stalls at each boundary (stop-start)."""
    scenes = [_unwrap(c.beat.scene) for c in run]
    if len(run) < 2 or not all(hasattr(s_, "_make") for s_, _ in scenes):
        return
    pairs, vectors, _ = scenes[0][0]._spec
    space_of = {}
    keys = []
    for p_ in pairs:
        keys.append(("pair", p_[0], p_[1]))
        space_of[p_[0]] = p_[2] if len(p_) > 2 else "lin"
    for k, v in scenes[0][0]._kw.items():
        if k in vectors or any(k in p_[:2] for p_ in pairs):
            continue
        keys.append(("range", k, None))
    new_kw = [dict(s_._kw) for s_, _ in scenes]
    G = [(c.seg["start"] + c.beat.t0, c.seg["start"] + c.beat.t1) for c in run]

    def rng(i, kind, a, b_):
        kw = scenes[i][0]._kw
        if kind == "pair":
            x, y = kw.get(a), kw.get(b_)
            return (x, y) if _isnum(x) and _isnum(y) and np.ndim(x) == 0 else None
        v = kw.get(a)
        return v if (_isnum(v) and isinstance(v, (tuple, list)) and len(v) == 2 and np.ndim(v[0]) == 0) else None

    for kind, a, b_ in keys:
        i = 0
        while i < len(run):
            r0 = rng(i, kind, a, b_)
            if r0 is None:
                i += 1
                continue
            j, same = i, True
            times, vals = [G[i][0], G[i][1]], [r0[0], r0[1]]
            while j + 1 < len(run):
                rn = rng(j + 1, kind, a, b_)
                if rn is None:
                    break
                rp = rng(j, kind, a, b_)
                if abs(rn[0] - rp[1]) <= 1e-9 * max(1.0, abs(rp[1])) and not (rn == rp and rn[0] != rn[1]):
                    same = same and rn == rp
                    times.append(G[j + 1][1]); vals.append(rn[1]); j += 1
                elif rn == rp == r0:
                    times, vals = [G[i][0], G[j + 1][1]], [r0[0], r0[1]]; j += 1
                else:
                    break
            if j > i and not (len(set(vals)) == 1):
                sp = space_of.get(a, "lin") if kind == "pair" else "lin"
                if sp == "log" and min(vals) <= 0:
                    sp = "log1p"
                tr = Track(times, vals, kind=kind, space=sp)
                for m in range(i, j + 1):
                    new_kw[m][a] = tr
                    if kind == "pair":
                        new_kw[m][b_] = tr
            i = j + 1
    for c, (s_, dim), kw in zip(run, scenes, new_kw):
        if any(kw[k] is not s_._kw.get(k) for k in kw):
            ns = s_._make(**kw)
            c.beat.scene = dimmed(ns, *dim) if dim != (1.0, 0.0) else ns
