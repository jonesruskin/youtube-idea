"""QUALITY GATE. Run before rendering (pre) and on the finished video (post). Writes build/<ep>/qa_report.md.
Any FAIL blocks upload. WARNs need a human decision, recorded in the report.

  python tools/qa.py ep_blackhole pre     # after `engine.render --stills` (uses QA_LOG + stills)
  python tools/qa.py ep_blackhole post    # after finalize (video + mix + captions + thumbnail)
"""
import os, sys, json, re, subprocess, importlib, importlib.util
import numpy as np, cv2
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
ep, mode = sys.argv[1], sys.argv[2]
B = os.path.join(ROOT, "build", ep)
REPO = os.path.dirname(ROOT)
results = []


def res(level, check, msg):
    results.append((level, check, msg))


def pre():
    from engine.render import load, boundary_fades
    from engine import beats as beatmod
    bm = importlib.import_module(ep + ".beats")
    mod, segs = load(ep)
    words = json.load(open(os.path.join(B, "voice", "words.json")))
    D = os.path.join(B, "stills")
    n_lines = n_beats = 0
    for seg in segs:
        sid = seg["id"]
        if sid not in bm.BEATS:
            res("FAIL", "coverage", f"{sid}: no beat sheet — the whole segment is one static picture")
            continue
        _, q = beatmod.align_words(seg["vlines"], words.get(sid, []))
        if q < 0.5 and seg["vlines"]:
            res("WARN", "word-sync", f"{sid}: only {100 * q:.0f}% of words confirmed by speech recognition (estimated timing used)")
        beats = beatmod.layout(dict(seg), bm.BEATS[sid], words.get(sid, []))
        covered = set()
        for b in beats:
            covered.update(b.covers)
        for i, ln in enumerate(seg["vlines"]):
            n_lines += 1
            if i not in covered:
                res("FAIL", "coverage", f"{sid} line {i} has no dedicated visual: \"{ln['text'][:60]}\"")
        for bi, b in enumerate(beats):
            n_beats += 1
            d = b.t1 - b.t0
            if d < 0.8:
                res("WARN", "pacing", f"{sid}#{bi} only {d:.2f}s long ({b.name})")
            if d > 12:
                res("WARN", "pacing", f"{sid}#{bi} holds one visual for {d:.1f}s ({b.name})")
            ims = [cv2.imread(os.path.join(D, f"{sid}_{bi:02d}_{k}.jpg"), cv2.IMREAD_GRAYSCALE) for k in range(3)]
            if any(i is None for i in ims):
                res("FAIL", "render", f"{sid}#{bi} has no preview stills (did it crash?)")
                continue
            a, c = [cv2.resize(i, (480, 270)).astype(np.float32) for i in (ims[0], ims[2])]
            diff = np.mean(np.abs(a - c))
            if diff < 0.6:
                res("FAIL", "motion", f"{sid}#{bi} is frozen (frame change {diff:.2f}) — {b.name}")
            elif diff < 1.6:
                res("WARN", "motion", f"{sid}#{bi} barely moves (frame change {diff:.2f}) — {b.name}")
            mid = cv2.resize(ims[1], (480, 270)).astype(np.float32)
            if mid.mean() < 5 and not (seg.get("fade_in") or seg.get("fade_out")):
                res("WARN", "exposure", f"{sid}#{bi} very dark (mean {mid.mean():.1f}/255)")
            if (mid >= 254).mean() > 0.05:
                res("WARN", "exposure", f"{sid}#{bi} {100 * (mid >= 254).mean():.0f}% of pixels clipped")
    # variety: long runs of visually near-identical beats feel repetitive even when each beat is fine
    seq = []
    for seg in segs:
        if seg["id"] not in bm.BEATS:
            continue
        for bi in range(len(bm.BEATS[seg["id"]])):
            im = cv2.imread(os.path.join(D, f"{seg['id']}_{bi:02d}_1.jpg"))
            if im is not None:
                seq.append((f"{seg['id']}#{bi}", cv2.resize(im, (64, 36)).astype(np.float32)))
    run = [seq[0][0]] if seq else []
    for (pa, a_), (pb, b_) in zip(seq, seq[1:]):
        same = np.mean(np.abs(a_ - b_)) < 9.0 and abs(a_.mean() - b_.mean()) < 8
        if same:
            run.append(pb)
        else:
            if len(run) >= 5:
                res("WARN", "variety", f"{len(run)} near-identical beats in a row: {run[0]} … {run[-1]} — vary framing, scale or scene")
            run = [pb]
    if len(run) >= 5:
        res("WARN", "variety", f"{len(run)} near-identical beats in a row: {run[0]} … {run[-1]}")
    log = os.path.join(B, "qa_text.log")
    if os.path.exists(log):
        lines = open(log).read().strip().splitlines()
        for l in sorted(set(lines)):
            res("FAIL", "text-overlap" if "TEXT OVERLAP" in l else "text-safe-area", l)
    res("PASS", "coverage", f"{n_lines} narration lines → {n_beats} visual beats")
    # contact sheets for the human review
    ids = [s["id"] for s in segs]
    pages = [ids[i:i + 5] for i in range(0, len(ids), 5)]
    os.makedirs(os.path.join(B, "review"), exist_ok=True)
    for k, pg in enumerate(pages):
        subprocess.run([sys.executable, os.path.join(ROOT, "tools", "beatsheet.py"), ep, os.path.join(B, "review", f"beats_{k:02d}.jpg"), ",".join(pg)], capture_output=True)
    res("INFO", "review", f"contact sheets: build/{ep}/review/beats_*.jpg ({len(pages)} pages)")


def _script():
    spec = importlib.util.spec_from_file_location("script", os.path.join(ROOT, ep, "script.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def continuity():
    """Static continuity checks on the beat sheet (no render needed)."""
    from engine.render import episode_layout, load, boundary_fades
    lay = episode_layout(ep)
    _, segs = load(ep)
    segs = boundary_fades(segs)
    D = os.path.join(B, "stills")
    prev = None
    n_cont = n_cut = 0
    for s in segs:
        if s["id"] not in lay:
            prev = None
            continue
        seg, beats, ctxs = lay[s["id"]]
        for bi, (b, c) in enumerate(zip(beats, ctxs)):
            if prev is not None and not (bi == 0 and seg["fade_in"]):
                if c.prev is not None:
                    n_cont += 1
                else:
                    n_cut += 1
                    # a cut must change the picture: compare the stills either side of it
                    a = cv2.imread(os.path.join(D, f"{prev[0]}_{prev[1]:02d}_2.jpg"))
                    z = cv2.imread(os.path.join(D, f"{s['id']}_{bi:02d}_0.jpg"))
                    if a is not None and z is not None:
                        a, z = [cv2.resize(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY), (96, 54), interpolation=cv2.INTER_AREA).astype(np.float32) for x in (a, z)]
                        cc = float(np.corrcoef(a.ravel(), z.ravel())[0, 1])
                        if np.mean(np.abs(a - z)) < 14 and cc > 0.6:
                            msg = f"{s['id']}#{bi}: scene change between two near-identical pictures (correlation {cc:.2f}, {b.name})"
                            if b.cut:
                                res("FAIL", "jump-cut", msg + " — hard cut: make it one continuous shot (same scene factory) or change the scene")
                            else:
                                res("WARN", "similar-dissolve", msg + " — dissolves; check it reads as a deliberate change")
            prev = (s["id"], bi)
    res("PASS", "continuity", f"{n_cont} beat changes inside continuous shots, {n_cut} real cuts")
    # the fall: the camera falls with the ship, so the ship must never climb on screen during the descent
    if ep == "ep_jupiter":
        for sid, (seg, beats, ctxs) in lay.items():
            for bi, (b, c) in enumerate(zip(beats, ctxs)):
                sc = getattr(b.scene, "_inner", b.scene)
                kw = getattr(sc, "_kw", None)
                if not kw or "tau0" not in kw or kw["tau0"] == kw["tau1"]:
                    continue
                sp = kw.get("ship_move") or kw.get("ship")
                if getattr(sp, "__name__", "") == "float_hold":
                    continue          # the fall is over: a gentle buoyant bob is correct here
                ys = [(sp(c, c.dur * f, f) if callable(sp) else sp)[1] for f in (0.0, 0.5, 1.0)]
                if ys[-1] < ys[0] - 0.004:
                    res("FAIL", "fall-direction", f"{sid}#{bi}: ship rises on screen during the fall ({ys[0]:.3f} → {ys[-1]:.3f})")
    # the teaser must name the next episode in the published order (EPISODES.md)
    mod = _script()
    meta = getattr(mod, "META", {})
    order = [l.split("|")[2].strip() for l in open(os.path.join(REPO, "EPISODES.md")) if re.match(r"\|\s*\d+\s*\|", l)]
    slot = meta.get("slot")
    if slot is None:
        res("FAIL", "next-episode", "META['slot'] missing (the episode's position in EPISODES.md)")
    elif slot < len(order):
        txt = " ".join(" ".join(sg["lines"]) for sg in mod.SEGMENTS if sg["id"] in ("next", "end3")).lower()
        kw_ = meta.get("next_teaser_keywords", [])
        ok = "next time" in txt and all(k.lower() in txt for k in kw_) and meta.get("next_slot") == slot + 1
        res("PASS" if ok else "FAIL", "next-episode",
            f"teaser points to #{meta.get('next_slot')} ({order[meta.get('next_slot', 1) - 1] if meta.get('next_slot') else '?'}); next in order is #{slot + 1} ({order[slot]})")


def claims():
    """Story logic: every claim in <ep>/claims.py must hold in the simulation (docs/QUALITY_GATE.md #13)."""
    path = os.path.join(ROOT, ep, "claims.py")
    if not os.path.exists(path):
        res("FAIL", "story-logic", f"{ep}/claims.py missing: every spatial/numerical claim needs a simulation check")
        return
    m = importlib.import_module(ep + ".claims")
    # label placement: "A sits nearer to REF than B does", measured where the labels actually land in the stills
    labp = os.path.join(B, "qa_labels.jsonl")
    marks = [json.loads(l) for l in open(labp)] if os.path.exists(labp) else []
    for seg_id, a_, b_, ref in getattr(m, "LABEL_RULES", []):
        seen = 0
        for ctxk in sorted({mk["ctx"] for mk in marks if mk["ctx"].split("#")[0] == seg_id}):
            pos = {}
            for mk in marks:
                if mk["ctx"] == ctxk:
                    pos[mk["name"]] = (mk["x"], mk["y"])
            if a_ in pos and b_ in pos and ref in pos:
                seen += 1
                da = np.hypot(pos[a_][0] - pos[ref][0], pos[a_][1] - pos[ref][1])
                db = np.hypot(pos[b_][0] - pos[ref][0], pos[b_][1] - pos[ref][1])
                if not da < db:
                    res("FAIL", "label-placement", f"{ctxk}: '{a_}' should sit nearer to {ref} than '{b_}' ({da:.0f} px vs {db:.0f} px)")
        res("PASS" if seen else "FAIL", "label-placement",
            f"{seg_id}: '{a_}' nearer to {ref} than '{b_}'" + (f" (checked in {seen} stills)" if seen else " — never seen together in the stills"))
    for fn in m.CHECKS:
        try:
            ok, detail = fn()
        except Exception as e:
            ok, detail = False, f"check crashed: {e}"
        res("PASS" if ok else "FAIL", "story-logic", f"{fn.__name__}: {detail}")


def motion_continuity():
    """No stop-start inside a continuous shot: every start→end parameter that continues across beats is one Track,
    and no sim clock runs backwards between consecutive beats of one shot (docs/QUALITY_GATE.md #14)."""
    from engine.render import episode_layout
    from engine.beats import Track, _unwrap, _isnum
    lay = episode_layout(ep)
    bad, n = [], 0
    for sid, (seg, beats, ctxs) in lay.items():
        for b, c in zip(beats, ctxs):
            if c.prev is None:
                continue
            p, _ = _unwrap(c.prev[0].scene)
            q, _ = _unwrap(b.scene)
            if not (hasattr(p, "_kw") and hasattr(q, "_kw")):
                continue
            for k, v in q._kw.items():
                pv = p._kw.get(k)
                if isinstance(v, Track) or isinstance(pv, Track):
                    n += 1
                    continue
                if _isnum(v) and _isnum(pv) and isinstance(v, (tuple, list)) and len(v) == 2 and np.ndim(v[0]) == 0 \
                        and abs(pv[1] - v[0]) < 1e-9 and pv != v:
                    bad.append(f"{sid}#{beats.index(b)} {k}")
            for pr in q._spec[0]:
                a_, b_ = pr[0], pr[1]
                if _isnum(q._kw.get(a_)) and _isnum(p._kw.get(b_)) and q._kw[a_] < p._kw[b_] - 1e-9 and q._kw[a_] != q._kw.get(b_):
                    bad.append(f"{sid}#{beats.index(b)} {a_} runs backwards ({p._kw[b_]} → {q._kw[a_]})")
    res("FAIL" if bad else "PASS", "motion-continuity",
        f"{n} parameters carried smoothly across beats" + (f"; not smoothed: {bad[:8]}" if bad else ""))


def ff(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats"] + args, capture_output=True, text=True).stderr


def post():
    vid = os.path.join(B, "final.mp4")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", vid], capture_output=True, text=True).stdout)
    res("PASS" if dur >= 480 else "FAIL", "runtime", f"{dur / 60:.2f} min (mid-roll ads need ≥ 8:00)")
    out = ff(["-i", vid, "-vf", "blackdetect=d=1.0:pix_th=0.04", "-an", "-f", "null", "-"])
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", out)
    res("FAIL" if blacks else "PASS", "black-frames", f"{len(blacks)} black gaps ≥1 s" + (f": {blacks[:5]}" if blacks else ""))
    out = ff(["-i", vid, "-vf", "scale=480:-1,freezedetect=n=0.0015:d=2.5", "-an", "-f", "null", "-"])
    fr = re.findall(r"freeze_start: ([\d.]+)", out)
    res("WARN" if fr else "PASS", "frozen-video", f"{len(fr)} stretches with no visible motion ≥2.5 s" + (f" at {[round(float(x), 1) for x in fr[:8]]}" if fr else ""))
    out = ff(["-i", vid, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"])
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    res("PASS" if abs(I + 14) <= 1.0 else "FAIL", "loudness", f"{I:.1f} LUFS (target −14 ±1)")
    res("PASS" if TP <= -1.0 else "WARN", "true-peak", f"{TP:.1f} dBTP (target ≤ −1)")
    import soundfile as sf
    m, sr = sf.read(os.path.join(B, "mix.wav"))
    m = m.mean(1)
    tl = json.load(open(os.path.join(B, "voice", "timeline.json")))
    sp = np.zeros(len(m), bool)
    for s in tl["segments"]:
        for l in s["lines"]:
            sp[int((s["start"] + l["start"]) * sr):int((s["start"] + l["end"]) * sr)] = True
    r = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    gap = r(m[sp]) - r(m[~sp])
    res("PASS" if gap >= 3 else "FAIL", "voice-over-music", f"speech {gap:.1f} dB above music-only passages (need ≥ 3)")
    cap = open(os.path.join(B, "captions.srt")).read().strip().split("\n\n")
    bad = 0
    last_end = -1
    for blk in cap:
        L = blk.splitlines()
        t0, t1 = L[1].split(" --> ")
        f = lambda s: sum(float(x) * k for x, k in zip(s.replace(",", ".").split(":"), (3600, 60, 1)))
        a, b = f(t0), f(t1)
        txt = L[2:]
        if len(txt) > 2 or any(len(x) > 42 for x in txt) or b - a < 0.7 or a < last_end - 0.01:
            bad += 1
        last_end = b
    res("PASS" if bad == 0 else "WARN", "captions", f"{len(cap)} cues, {bad} break the rules (≤2 lines, ≤42 chars, ≥0.7 s, no overlap)")
    # jump cuts: the picture changes abruptly but it is still the same scene (docs/QUALITY_GATE.md, lesson 8)
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from jumpcuts import analyse
    mod = _script()
    allow = getattr(mod, "META", {}).get("qa_allow_jumps", [])   # human-verified exceptions (e.g. lightning flashes)
    # planned transitions: dissolves at real scene changes and chapter fades
    from engine.render import episode_layout, load, boundary_fades
    from engine.beats import XF
    lay = episode_layout(ep)
    _, segs = load(ep)
    skip = [(0.0, 0.7)]
    for s_ in boundary_fades(segs):
        if s_.get("fade_in"):
            skip.append((s_["start"] - 0.6, s_["start"] + 0.6))
        if s_["id"] in lay:
            sg, beats, ctxs = lay[s_["id"]]
            for b_, c_ in zip(beats, ctxs):
                if c_.prev is None:
                    g = sg["start"] + b_.t0
                    skip.append((g - 0.1, g + XF + 0.15))
    jumps, cuts = analyse(vid, skip=skip)
    bad = [j for j in jumps if not any(abs(j[0] - a) < 0.5 for a in allow)]
    res("FAIL" if bad else "PASS", "jump-cuts",
        f"{len(cuts)} scene cuts; {len(bad)} same-scene jumps" + (": " + ", ".join(f"{a:.1f}s" for a, *_ in bad[:12]) if bad else ""))
    # motion stalls: a moving shot that pauses and resumes (a fall that stops mid-air, a spiral that stops and starts)
    from jumpcuts import stalls
    st = [x for x in stalls(vid, skip=skip) if not any(abs(x[0] - a) < 0.5 for a in allow)]
    res("FAIL" if st else "PASS", "motion-stalls", f"{len(st)} stop-start moments in moving shots" + (": " + ", ".join(f"{a:.1f}s" for a, *_ in st[:12]) if st else ""))
    th = cv2.imread(os.path.join(B, "thumbnail.png"))
    sz = os.path.getsize(os.path.join(B, "thumbnail.png"))
    res("PASS" if th is not None and th.shape[:2] == (720, 1280) and sz < 2_000_000 else "FAIL", "thumbnail", f"{th.shape[1]}x{th.shape[0]}, {sz / 1e6:.2f} MB (YouTube: 1280x720, < 2 MB)")


if mode == "pre":
    pre()
    continuity()
    claims()
    motion_continuity()
else:
    post()
rep = os.path.join(B, f"qa_report_{mode}.md")
order = {"FAIL": 0, "WARN": 1, "PASS": 2, "INFO": 3}
results.sort(key=lambda x: order[x[0]])
with open(rep, "w") as f:
    f.write(f"# QA gate · {ep} · {mode}\n\n")
    nf = sum(1 for r in results if r[0] == "FAIL")
    nw = sum(1 for r in results if r[0] == "WARN")
    f.write(f"**{'BLOCKED' if nf else 'PASSED'}** — {nf} fail, {nw} warn\n\n| | check | detail |\n|---|---|---|\n")
    for lv, ck, msg in results:
        f.write(f"| {lv} | {ck} | {msg} |\n")
print(open(rep).read())
