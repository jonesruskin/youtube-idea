"""CREATIVE GATE (founder, Nov 2026; every episode from #4). The channel must never feel like the same video again.

Called from tools/qa.py:  pre  -> creative_pre(ep, res)    post -> creative_post(ep, res)

What it refuses (each rule is one of the founder's notes on Episodes 1-3, turned into a check):
  creative-brief    <ep>/BRIEF.md must exist and show the thinking: >= 3 story shapes considered, the one chosen and
                    why, and >= 3 concrete ways this episode is unlike the earlier ones ("don't stick to your defaults").
  creative-ledger   META['creative'] describes the episode's story shape, point of view, narrator, hook, time scale,
                    ending, thumbnail device, palette and signature shot. None may repeat a shipped episode's
                    (creative_ledger.json). Ep1 and Ep3 were the same story told twice; this check stops a third.
  title-form        the title may not copy the opening words or a 3-word phrase of an earlier title.
  script-reuse      no 5-word phrase of narration may be lifted from an earlier episode ("So, should you worry?").
  shot-grammar      META['shots'] classifies every scene used. The cut needs >= 4 kinds of shot, >= 25 % of the runtime
                    seen from inside the world (pov / ride), <= 30 % diagrams and data, and no single scene filling
                    more than 30 % of the episode ("visuals that keep people watching", Ep3 v1 feedback).
  thumbnail-text    no number-plus-time headline (the "30 YEARS LEFT / 11 DAYS" template): no digits, <= 3 words.
  thumbnail-look    thumbnail.png must not resemble any earlier episode's thumbnail (colour + structure), and two
                    genuinely different alternates (thumbnail_B, thumbnail_C) must exist for the A/B test.
  frame-reuse       (post) no more than 2 % of the finished video's frames may match frames of an earlier episode.
  self-repeat       (post) the episode may not keep showing the same picture: <= 6 % of frames may repeat a frame
                    from more than 45 s earlier.
"""
import os, re, json, glob, subprocess, importlib
import numpy as np, cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(ROOT)
FIELDS_ALL = ["story_shape", "hook_device", "ending_device", "thumb_device", "signature_shot"]     # vs every episode
FIELDS_RECENT = ["point_of_view", "narrator", "time_scale", "palette"]                            # vs the last two
SHOT_KINDS = {"pov", "ride", "orbital", "macro", "micro", "map", "data", "diagram", "title", "interior", "archive"}
STOP = set("""a an the of in on at to and or but for with from by as is are was were be been it its this that these those
then than so if into onto over under out up down off you your we our us they their them he she his her i me my not no do does did
just very can could would will one two there here what when where which who how all any each every more most much""".split())


DOMAIN = set("sun earth moon solar system planet planets universe year years day days billion million thousand hundred km".split())
NUMW = set("zero three four five six seven eight nine ten twenty thirty forty fifty half quarter".split())


def _words(s):
    return [w for w in re.findall(r"[a-z0-9']+", s.lower())]


def _content(s):
    out = set()
    for w in _words(s):
        if w in STOP or len(w) < 3:
            continue
        out.add(w[:-1] if w.endswith("s") and len(w) > 4 else w)
    return out


def _jacc(a, b):
    A, B = _content(a), _content(b)
    return len(A & B) / max(1, len(A | B))


def _ledger():
    return json.load(open(os.path.join(ROOT, "creative_ledger.json")))["episodes"]


def _lines(ep):
    segs = importlib.import_module(ep + ".script").SEGMENTS
    out = []
    for s in segs:
        out += [l if isinstance(l, str) else str(l[0] if isinstance(l, (list, tuple)) else l.get("text", ""))
                for l in (s.get("lines") or [])]
    return out


def _ngrams(lines, n=5):
    g = set()
    for l in lines:
        w = _words(l)
        for i in range(len(w) - n + 1):
            t = tuple(w[i:i + n])
            if sum(x not in STOP and x not in DOMAIN and not x.isdigit() and x not in NUMW for x in t) >= 2:
                g.add(t)
    return g


# ---------------------------------------------------------------------------------------------------------- pre
def brief(ep, res):
    p = os.path.join(ROOT, ep, "BRIEF.md")
    if not os.path.exists(p):
        res("FAIL", "creative-brief", f"{ep}/BRIEF.md missing: write the creative brief before the script")
        return
    txt = open(p).read()
    secs = {}
    cur = None
    for line in txt.splitlines():
        if line.startswith("## "):
            cur = line[3:].strip().lower()
            secs[cur] = []
        elif cur and re.match(r"\s*([-*]|\d+\.)\s+\S", line):
            secs[cur].append(line)
    find = lambda key: next((v for k, v in secs.items() if key in k), None)
    shapes, chosen, unlike = find("considered"), find("chosen"), find("unlike")
    ok = shapes is not None and len(shapes) >= 3 and chosen is not None and unlike is not None and len(unlike) >= 3
    res("PASS" if ok else "FAIL", "creative-brief",
        f"story shapes considered: {len(shapes or [])} (need 3), chosen: {'yes' if chosen is not None else 'no'}, "
        f"unlike earlier episodes: {len(unlike or [])} (need 3)")


def ledger(ep, res, meta, slot):
    led = [e for e in _ledger() if e["slot"] < slot and e["ep"] != ep]
    missing = sorted(set(range(1, slot)) - {e["slot"] for e in led})
    if missing:
        res("FAIL", "creative-ledger", f"creative_ledger.json lacks shipped episodes {missing}")
    cr = meta.get("creative") or {}
    need = FIELDS_ALL + FIELDS_RECENT
    absent = [f for f in need if not cr.get(f)]
    if absent:
        res("FAIL", "creative-ledger", f"META['creative'] missing {absent}")
        return
    recent = sorted(led, key=lambda e: -e["slot"])[:2]
    clashes, near = [], []
    for f in need:
        pool = led if f in FIELDS_ALL else recent
        for e in pool:
            j = _jacc(cr[f], e.get(f, ""))
            if cr[f].strip().lower() == e.get(f, "").strip().lower() or j >= 0.5:
                clashes.append(f"{f} ~ Ep{e['slot']} ({j:.2f})")
            elif j >= 0.3:
                near.append(f"{f} ~ Ep{e['slot']} ({j:.2f})")
    res("FAIL" if clashes else ("WARN" if near else "PASS"), "creative-ledger",
        "nothing repeats a shipped episode" if not clashes and not near else "; ".join(clashes + near))

def title_form(ep, res, meta, slot):
    led = [e for e in _ledger() if e["slot"] < slot and e["ep"] != ep]
    title = meta.get("_title", "")
    tw = _words(title)
    bad = []
    for e in led:
        pw = _words(e["title"])
        if tw[:2] == pw[:2]:
            bad.append(f"opens like Ep{e['slot']} ('{' '.join(pw[:2])}')")
        shared = {tuple(tw[i:i + 3]) for i in range(len(tw) - 2)} & {tuple(pw[i:i + 3]) for i in range(len(pw) - 2)}
        shared = [s for s in shared if sum(x not in STOP for x in s) >= 1]
        if shared:
            bad.append(f"shares '{' '.join(shared[0])}' with Ep{e['slot']}")
    res("FAIL" if bad else "PASS", "title-form", f"'{title}'" + (" — " + "; ".join(bad) if bad else ""))


def script_reuse(ep, res, slot):
    mine = _ngrams(_lines(ep))
    hits = []
    for e in _ledger():
        if e["slot"] >= slot or e["ep"] == ep or not os.path.isdir(os.path.join(ROOT, e["ep"])):
            continue
        for g in sorted(mine & _ngrams(_lines(e["ep"]))):
            hits.append(f"Ep{e['slot']}: '{' '.join(g)}'")
    res("FAIL" if len(hits) > 2 else ("WARN" if hits else "PASS"), "script-reuse", f"{len(hits)} narration phrases lifted from earlier episodes" + (": " + "; ".join(hits[:8]) if hits else ""))


def shot_grammar(ep, res, meta, lay):
    from engine.beats import _unwrap
    shots = meta.get("shots") or {}
    dur, kinds, unknown = {}, {}, set()
    total = 0.0
    for sid, (seg, beats, ctxs) in lay.items():
        for b in beats:
            sc, _ = _unwrap(b.scene)
            key = getattr(sc, "_key", None)
            name = key[1] if key else getattr(sc, "__qualname__", "?").split(".")[0]
            d = max(0.0, b.t1 - b.t0)
            total += d
            dur[name] = dur.get(name, 0) + d
            k = shots.get(name)
            if k not in SHOT_KINDS:
                unknown.add(name)
            else:
                kinds[k] = kinds.get(k, 0) + d
    if unknown:
        res("FAIL", "shot-grammar", f"META['shots'] must classify every scene as one of {sorted(SHOT_KINDS)}; missing: {sorted(unknown)[:10]}")
    total = max(total, 1e-6)
    inside = (kinds.get("pov", 0) + kinds.get("ride", 0)) / total
    flat = (kinds.get("data", 0) + kinds.get("diagram", 0)) / total
    top = max(dur.items(), key=lambda x: x[1]) if dur else ("-", 0)
    ok = len(kinds) >= 4 and inside >= 0.25 and flat <= 0.30 and top[1] / total <= 0.30
    res("PASS" if ok else "FAIL", "shot-grammar",
        f"{len(kinds)} kinds of shot (need 4); inside the world {inside:.0%} (need 25 %); diagrams/data {flat:.0%} (max 30 %); "
        f"biggest scene {top[0]} {top[1] / total:.0%} (max 30 %)")


def _prior_thumbs(folder):
    return [p for p in sorted(glob.glob(os.path.join(REPO, "renders", "*", "thumbnail*.png"))) if os.path.basename(os.path.dirname(p)) != folder]


def _look(p):
    im = cv2.imread(p)
    im = cv2.resize(im, (320, 180), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0, 1], None, [18, 8], [0, 180, 0, 256])
    cv2.normalize(h, h)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    return h, g


def _ssim(a, b):
    C1, C2 = 6.5025, 58.5225
    mu_a, mu_b = cv2.GaussianBlur(a, (11, 11), 1.5), cv2.GaussianBlur(b, (11, 11), 1.5)
    va = cv2.GaussianBlur(a * a, (11, 11), 1.5) - mu_a ** 2
    vb = cv2.GaussianBlur(b * b, (11, 11), 1.5) - mu_b ** 2
    cab = cv2.GaussianBlur(a * b, (11, 11), 1.5) - mu_a * mu_b
    return float((((2 * mu_a * mu_b + C1) * (2 * cab + C2)) / ((mu_a ** 2 + mu_b ** 2 + C1) * (va + vb + C2))).mean())


def similar(p, q):
    (h1, g1), (h2, g2) = _look(p), _look(q)
    return float(cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)), _ssim(g1, g2)


def thumbnails(ep, res, meta, B):
    txt = meta.get("thumb_text", "") or ""
    bad = []
    if re.search(r"\d", txt):
        bad.append("contains a number")
    if len(txt.split()) > 3:
        bad.append("more than 3 words")
    res("FAIL" if bad else "PASS", "thumbnail-text", f"'{txt}'" + (" — " + ", ".join(bad) if bad else " (no number-and-time headline)"))
    a = os.path.join(B, "thumbnail.png")
    if not os.path.exists(a):
        res("FAIL", "thumbnail-look", "build/<ep>/thumbnail.png missing: run tools/thumbnail.py before the gate")
        return
    folder = meta.get("folder", "")
    worst = []
    for q in _prior_thumbs(folder):
        c, s = similar(a, q)
        if c > 0.5 or s > 0.45:
            worst.append(f"{os.path.relpath(q, REPO)} (colour {c:.2f}, structure {s:.2f})")
    alts = [os.path.join(B, n) for n in ("thumbnail_B.png", "thumbnail_C.png")]
    have = [x for x in alts if os.path.exists(x)]
    same_alt = [os.path.basename(x) for x in have if (lambda cs: cs[0] > 0.5 and cs[1] > 0.35)(similar(a, x))]
    ok = not worst and len(have) == 2 and not same_alt
    res("PASS" if ok else "FAIL", "thumbnail-look",
        ("unlike every earlier thumbnail" if not worst else "too close to: " + "; ".join(worst[:4])) +
        f"; alternates: {len(have)}/2" + (f"; too similar to A: {same_alt}" if same_alt else ""))


def creative_pre(ep, res, mod, lay, B):
    meta = dict(getattr(mod, "META", {}))
    slot = meta.get("slot", 0)
    if slot < 4:
        return
    meta["_title"] = getattr(mod, "TITLE", "")
    meta.setdefault("folder", getattr(mod, "FOLDER", ""))
    brief(ep, res)
    ledger(ep, res, meta, slot)
    title_form(ep, res, meta, slot)
    script_reuse(ep, res, slot)
    shot_grammar(ep, res, meta, lay)
    thumbnails(ep, res, meta, B)
    from story_gate import story_pre                 # founder's five storytelling rules (after Ep4 v1)
    story_pre(ep, res, mod, lay, B)


# --------------------------------------------------------------------------------------------------------- post
def _hashes(video, cache=None, step=2.0):
    if cache and os.path.exists(cache) and os.path.getmtime(cache) > os.path.getmtime(video):
        d = np.load(cache)
        return d["h"], d["t"]
    w, h = 64, 36
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps=1/{step},scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
    hs, ts = [], []
    for i, f in enumerate(fr):
        if f.std() < 10:                       # near-empty frames (black space, fades) say nothing about reuse
            continue
        s = cv2.resize(f, (17, 16), interpolation=cv2.INTER_AREA)
        v = cv2.resize(f, (16, 17), interpolation=cv2.INTER_AREA)
        bits = np.concatenate([(s[:, 1:] > s[:, :-1]).flatten(), (v[1:, :] > v[:-1, :]).flatten()])   # 512 bits
        hs.append(np.packbits(bits))
        ts.append(i * step)
    H = np.array(hs, np.uint8).reshape(-1, 64)
    T = np.array(ts, np.float32)
    if cache:
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        np.savez(cache, h=H, t=T)
    return H, T


def _ham(A, Bm):
    x = np.bitwise_xor(A[:, None, :], Bm[None, :, :])
    return np.unpackbits(x, axis=2).sum(2)


def creative_post(ep, res, mod, B):
    meta = getattr(mod, "META", {})
    if meta.get("slot", 0) < 4:
        return
    from story_gate import cadence_video             # rule 2 on the finished picture
    cadence_video(ep, res, B)
    vid = os.path.join(B, "final.mp4")
    H, T = _hashes(vid)
    if len(H) == 0:
        res("WARN", "frame-reuse", "no detailed frames to compare")
        return
    folder = getattr(mod, "FOLDER", meta.get("folder", ""))
    hits = np.zeros(len(H), bool)
    for pv in sorted(glob.glob(os.path.join(REPO, "renders", "*", "preview.mp4"))):
        name = os.path.basename(os.path.dirname(pv))
        if name == folder:
            continue
        P, _ = _hashes(pv, os.path.join(ROOT, "build", "_framehash", name + "_v2.npz"))
        if len(P):
            hits |= _ham(H, P).min(1) <= 70           # of 512 bits; different episodes sit >= 100 apart
    frac = hits.mean()
    res("PASS" if frac <= 0.02 else "FAIL", "frame-reuse", f"{frac:.1%} of frames match an earlier episode (max 2 %)"
        + (f" at {[round(float(t)) for t in T[hits][:8]]} s" if hits.any() else ""))
    D = _ham(H, H)
    far = np.abs(T[:, None] - T[None, :]) > 45
    rep = ((D <= 50) & far & (T[None, :] < T[:, None])).any(1)
    res("PASS" if rep.mean() <= 0.06 else "FAIL", "self-repeat", f"{rep.mean():.1%} of frames repeat a picture from > 45 s earlier (max 6 %)")
