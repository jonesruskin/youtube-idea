"""STORY GATE (founder, Nov 2026, after Episode 4 v1; every episode from #4).

Five rules from a faceless creator whose films go viral, each turned into a check. tools/qa.py runs these through
creative_gate.creative_pre / creative_post for slot >= 4.

  open-moment    1. Open on a moment everyone has had. META['open_moment'] names it, BRIEF.md has an "Open moment"
                    section, the first shot is inside a world (pov / ride / macro / interior: never a diagram, map
                    or title), the first sentence is short and number-free, and the blind viewer of the mute test
                    recognised the moment from the picture alone.
  cadence-plan   2. Something new on screen every 3-5 s: no beat in the plan may last longer than 5 s.
  cadence-video     (post) and the finished picture must actually change: the longest stretch without a new picture
                    (a cut, or the frame moving far from what it was 2 s earlier) is at most 5 s.
  simplicity     3. Keep it simple: one hero, one villain, one room, one thing always moving (META['cast']). The hero
                    is named in at least a quarter of the segments, and the room's scenes fill at least 40 % of the
                    runtime.
  mute-test      4. Mute it and cover the captions. tools/mute_test.py renders every beat with all on-screen text
                    removed; a fresh AI with no script describes each one; a second fresh AI compares that
                    description with the narration spoken over the beat. Every beat must PASS, and the test must be
                    for the current beats (fingerprint), not an older cut. Anatomy and continuity errors the blind
                    viewer reports (fish with two tails, things popping in and out) also fail.
  story-end      5. Put everything inside the story: no title or chapter cards; the story runs to its own ending, then
                    ONE short branded outro (founder, Ep4 v2): 'subscribe' and the channel name said aloud, channel
                    name + logo on screen over an in-world picture, under 12 s. The next-episode teaser ends >= 20 s
                    before the end.
"""
import os, re, json, hashlib, importlib
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_BEAT = 5.0
INSIDE = {"pov", "ride", "macro", "interior"}


def fingerprint(ep):
    """What the mute test saw: the beat sheet, the scene code and the narration."""
    h = hashlib.sha256()
    import glob as _g                       # Ep5 on: scenes may live in scene_*.py modules too
    extra = sorted(os.path.basename(x) for x in _g.glob(os.path.join(ROOT, ep, "scene_*.py")))
    for f in ("beats.py", "cine.py", "world.py", "script.py", *extra):
        p = os.path.join(ROOT, ep, f)
        if os.path.exists(p):
            h.update(open(p, "rb").read())
    return h.hexdigest()[:16]


def _scene_name(b):
    from engine.beats import _unwrap
    sc, _ = _unwrap(b.scene)
    key = getattr(sc, "_key", None)
    return key[1] if key else getattr(sc, "__qualname__", "?").split(".")[0]


def _kinds(meta):
    return meta.get("shots", {})


def open_moment(ep, res, mod, lay):
    meta = mod.META
    om = meta.get("open_moment", "").strip()
    brief = open(os.path.join(ROOT, ep, "BRIEF.md")).read() if os.path.exists(os.path.join(ROOT, ep, "BRIEF.md")) else ""
    first = mod.SEGMENTS[0]
    seg, beats, _ = lay[first["id"]]
    kind = _kinds(meta).get(_scene_name(beats[0]), "?")
    line = first["lines"][0]
    bad = []
    if not om:
        bad.append("META['open_moment'] missing")
    if not re.search(r"^#+\s*open moment", brief, re.I | re.M):
        bad.append("BRIEF.md has no 'Open moment' section")
    if kind not in INSIDE:
        bad.append(f"first shot is a {kind} shot (needs {sorted(INSIDE)})")
    if any(c.isdigit() for c in line) or len(line.split()) > 10:
        bad.append(f"first sentence must be short and number-free: {line!r}")
    res("FAIL" if bad else "PASS", "open-moment", "; ".join(bad) if bad else f"opens on: {om} (first shot: {kind})")


def cadence_plan(ep, res, mod, lay):
    long_ = []
    last = mod.SEGMENTS[-1]["id"]
    for sid, (seg, beats, _) in lay.items():
        for bi, b in enumerate(beats):
            d = b.t1 - b.t0
            lim = MAX_BEAT + (1.5 if (sid == last and bi == len(beats) - 1) else 0.0)
            if d > lim + 0.05:
                long_.append(f"{sid}#{bi} {d:.1f}s")
    n = sum(len(v[1]) for v in lay.values())
    res("FAIL" if long_ else "PASS", "cadence-plan",
        f"{n} beats, none longer than {MAX_BEAT:.0f} s" if not long_ else f"{len(long_)} beats hold too long (> {MAX_BEAT:.0f} s): {long_[:10]}")


def simplicity(ep, res, mod, lay):
    cast = mod.META.get("cast", {})
    need = ["hero", "villain", "room", "moving", "hero_word", "room_scenes"]
    miss = [k for k in need if not cast.get(k)]
    if miss:
        res("FAIL", "simplicity", f"META['cast'] needs {miss}")
        return
    hw = cast["hero_word"].lower()
    segs = [s for s in mod.SEGMENTS if s["lines"]]
    k = sum(any(hw in l.lower() for l in s["lines"]) for s in segs)
    tot = room = 0.0
    for sid, (seg, beats, _) in lay.items():
        for b in beats:
            d = b.t1 - b.t0
            tot += d
            room += d if _scene_name(b) in cast["room_scenes"] else 0
    share, rshare = k / max(1, len(segs)), room / max(tot, 1e-6)
    ok = share >= 0.25 and rshare >= 0.40
    res("PASS" if ok else "FAIL", "simplicity",
        f"hero '{cast['hero']}' named in {k}/{len(segs)} segments ({share:.0%}, need 25 %); "
        f"inside the room ({cast['room']}) {rshare:.0%} of the runtime (need 40 %); villain: {cast['villain']}; always moving: {cast['moving']}")


def story_end(ep, res, mod, lay):
    """Rule 5 + founder, Ep4 v2: everything inside the story, then ONE short branded outro: 'subscribe' said aloud,
    the channel name and logo on screen (engine endcard) over an in-world picture. No title or chapter cards."""
    from engine.brand import CHANNEL
    segs = mod.SEGMENTS
    bad = []
    last = segs[-1]
    outro = last if (last.get("card") or {}).get("kind") == "endcard" else None
    for s in segs:
        if s is outro:
            continue
        if s.get("card") or s.get("shot", {}).get("type") in ("end", "endcard", "title"):
            bad.append(f"{s['id']} is a card")
    for sid, (seg, beats, _) in lay.items():
        for b in beats:
            if _kinds(mod.META).get(_scene_name(b)) == "title":
                bad.append(f"{sid} uses a title scene")
    if outro is None:
        bad.append("no branded outro: the last segment must be an endcard (channel name + logo) with 'subscribe' said aloud")
    else:
        line = " ".join(outro["lines"]).lower()
        if "subscribe" not in line:
            bad.append("the outro never says 'subscribe'")
        if CHANNEL.lower() not in line:
            bad.append(f"the outro never says the channel's name ({CHANNEL})")
        od = lay[outro["id"]][0]["dur"]
        if od > 12.0:
            bad.append(f"the outro runs {od:.0f} s (keep it under 12 s)")
    kw = [k.lower() for k in mod.META.get("next_teaser_keywords", [])]
    ends, tease_end = {}, None
    for sid, (seg, beats, _) in lay.items():
        t = seg["start"] + seg["dur"]
        ends[sid] = t
        if kw and any(all(k in " ".join(seg_["lines"]).lower() for k in kw) for seg_ in segs if seg_["id"] == sid):
            tease_end = t
    total = max(ends.values())
    story_last = segs[-2]["id"] if outro is not None else segs[-1]["id"]
    if mod.META.get("story_end") != story_last:
        bad.append(f"META['story_end'] must name the story's last segment ({story_last}), just before the outro")
    if tease_end is not None and total - tease_end < 20.0:
        bad.append(f"teaser ends {total - tease_end:.0f} s before the end (need >= 20 s after it)")
    res("FAIL" if bad else "PASS", "story-end", "; ".join(bad) if bad else
        f"story runs to its own ending, then a {lay[outro['id']][0]['dur']:.0f} s branded outro (subscribe + {CHANNEL} + logo); "
        f"teaser ends {total - (tease_end or total):.0f} s before the end")


def mute_test(ep, res, mod, lay, B):
    p = os.path.join(B, "mute", "mute_test.json")
    if not os.path.exists(p):
        res("FAIL", "mute-test", "no mute test yet: python3 tools/mute_test.py prepare <ep>, have fresh AIs describe and judge, then finalize")
        return
    d = json.load(open(p))
    if d.get("fingerprint") != fingerprint(ep):
        res("FAIL", "mute-test", "mute test is for an older cut (beats/scenes/script changed since): run it again")
        return
    want = {f"{sid}#{bi}" for sid, (_, beats, _) in lay.items() for bi in range(len(beats))}
    got = {r["beat"]: r for r in d["results"]}
    missing = sorted(want - set(got))
    fails = [b for b, r in got.items() if r["verdict"] != "PASS" and b in want]
    om = got.get(f"{mod.SEGMENTS[0]['id']}#0", {})
    bad = []
    if missing:
        bad.append(f"{len(missing)} beats not tested: {missing[:6]}")
    if fails:
        bad.append(f"{len(fails)} beats not understood without sound or captions: " +
                   ", ".join(f"{b} ({got[b].get('why', '')[:60]})" for b in fails[:6]))
    if om and om.get("verdict") != "PASS":
        bad.append("the opening moment was not recognised")
    res("FAIL" if bad else "PASS", "mute-test", "; ".join(bad) if bad else
        f"all {len(want)} beats understood with the sound off and captions hidden (blind viewer + judge)")


def anatomy_reference(ep, res, mod):
    """Founder, Ep4 v2 (the paddlefish's mouth 'makes the whole fish appear something else'): every real creature
    drawn on screen is checked against its real anatomy first. BRIEF.md needs an 'Anatomy reference' section that
    names each creature, the features drawn, and at least one source link."""
    brief = open(os.path.join(ROOT, ep, "BRIEF.md")).read() if os.path.exists(os.path.join(ROOT, ep, "BRIEF.md")) else ""
    m = re.search(r"^#+\s*anatomy reference(.*?)(^#+\s|\Z)", brief, re.I | re.M | re.S)
    hero = mod.META.get("cast", {}).get("hero_word", "")
    bad = []
    if not m:
        bad.append("BRIEF.md has no 'Anatomy reference' section")
    else:
        body = m.group(1)
        if hero and hero.lower() not in body.lower():
            bad.append(f"the hero ({hero}) is not described in it")
        if "http" not in body:
            bad.append("no source link")
    res("FAIL" if bad else "PASS", "anatomy-reference", "; ".join(bad) if bad else f"creatures checked against real anatomy (hero: {hero})")


def story_pre(ep, res, mod, lay, B):
    anatomy_reference(ep, res, mod)
    open_moment(ep, res, mod, lay)
    cadence_plan(ep, res, mod, lay)
    simplicity(ep, res, mod, lay)
    story_end(ep, res, mod, lay)
    mute_test(ep, res, mod, lay, B)


def _cad_hashes(video, cache, step=0.5):
    import subprocess, cv2
    if os.path.exists(cache) and os.path.getmtime(cache) > os.path.getmtime(video):
        d = np.load(cache)
        return d["h"], d["t"]
    w, h = 64, 36
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps=1/{step},scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
    hs = []
    for f in fr:                       # every frame counts here, dark ones too (contrast is normalised by the dhash)
        s_ = cv2.resize(f, (17, 16), interpolation=cv2.INTER_AREA)
        v_ = cv2.resize(f, (16, 17), interpolation=cv2.INTER_AREA)
        hs.append(np.packbits(np.concatenate([(s_[:, 1:] > s_[:, :-1]).flatten(), (v_[1:, :] > v_[:-1, :]).flatten()])))
    H, T = np.array(hs, np.uint8).reshape(-1, 64), np.arange(len(hs), dtype=np.float32) * step
    np.savez(cache, h=H, t=T)
    return H, T


def cadence_gaps(video, cache, step=0.5, lag_s=2.0, bits=None):
    H, T = _cad_hashes(video, cache, step)
    lag = int(round(lag_s / step))
    x = np.bitwise_xor(H[lag:], H[:-lag])
    d = np.concatenate([np.full(lag, 999), np.unpackbits(x, axis=1).sum(1)])
    new = d >= (bits or NEW_BITS)
    gaps, last = [], T[0]
    for t, n in zip(T, new):
        if n:
            gaps.append((float(t - last), float(last)))
            last = t
    gaps.append((float(T[-1] - last), float(last)))
    return sorted(gaps, reverse=True), d, T


def cadence_video(ep, res, B):
    """Longest stretch with nothing new on screen. 'New' = the picture moved far (dhash) from 2 s before (cuts included)."""
    worst, _, _ = cadence_gaps(os.path.join(B, "final.mp4"), os.path.join(B, "_cadence.npz"))
    bad = [(g, s) for g, s in worst if g > MAX_BEAT + 0.6]
    res("FAIL" if bad else "PASS", "cadence-video",
        f"longest stretch without a new picture {worst[0][0]:.1f} s (max {MAX_BEAT:.0f} s)" +
        (f"; static at " + ", ".join(f"{s:.0f}s ({g:.1f}s)" for g, s in bad[:8]) if bad else ""))


NEW_BITS = 100         # of 512, vs 2 s earlier: calibrated so Ep4 v1 (230 s of static riverbank) fails and Ep3 (24 s) is borderline
