"""Captions (SRT) + YouTube metadata (title, description, chapters, sources) from the script and voice timeline."""
import os, sys, json, importlib.util, textwrap

ep = sys.argv[1] if len(sys.argv) > 1 else "ep_blackhole"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("script", os.path.join(ROOT, ep, "script.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
tl = json.load(open(os.path.join(ROOT, "build", ep, "voice", "timeline.json")))
segs = {s["id"]: s for s in tl["segments"]}
out = os.path.join(ROOT, "build", ep)


def ts(t, srt=True):
    h, m, s = int(t // 3600), int(t % 3600 // 60), t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",") if srt else (f"{m}:{int(s):02d}" if h == 0 else f"{h}:{m:02d}:{int(s):02d}")


# captions: split each spoken line into balanced cues that wrap to <= 2 x 42 chars, preferring punctuation breaks
def _wrap(c):
    return textwrap.wrap(c, 42, break_on_hyphens=False)


def split_line(text):
    w = text.split()
    n = len(w)
    best = {0: (0.0, [])}
    for i in range(1, n + 1):
        cands = []
        for j in range(i):
            if j not in best:
                continue
            c = " ".join(w[j:i])
            if len(_wrap(c)) > 2:
                continue
            cost = best[j][0] + 1000 + (60 - len(c)) ** 2 * 0.2   # fewer cues, each comfortably full
            if i < n and not c.endswith((",", ".", "?", "!", ";", ":")):
                cost += 400                                       # break at punctuation when possible
            if len(c) < 14 and n > 1:
                cost += 3000                                      # no orphan one-word cues
            cands.append((cost, best[j][1] + [c]))
        if cands:
            best[i] = min(cands, key=lambda x: x[0])
    return best[n][1]


cues = []
for seg in mod.SEGMENTS:
    t = segs[seg["id"]]
    for ln in t["lines"]:
        chunks = split_line(ln["text"])
        a, b = t["start"] + ln["start"], t["start"] + ln["end"]
        total = sum(len(c) for c in chunks)
        x = a
        for c in chunks:
            d = (b - a) * len(c) / total
            cues.append((x, x + d, "\n".join(_wrap(c))))
            x += d
with open(os.path.join(out, "captions.srt"), "w") as f:
    for i, (a, b, txt) in enumerate(cues, 1):
        f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")

# chapters
chap = [(0.0, "A star gets brighter")]
for seg in mod.SEGMENTS:
    c = seg.get("card") or {}
    if c.get("kind") in ("chapter", "fate"):
        chap.append((segs[seg["id"]]["start"], f'{c["num"].replace(" – ", "-").title().replace("T-", "T-")}: {c["text"]}' if c["kind"] == "chapter" else f'{c["num"].title()}: {c["text"]}'))
    if seg["id"] == "end1":
        chap.append((segs[seg["id"]]["start"], "Should you worry?"))
# mid-roll suggestions: natural pauses right before chapter cards, after 2:00, spaced >= 2 min
mids, last = [], 0
for t, _ in chap[1:]:
    if t > 200 and t - last >= 120:
        mids.append(t); last = t

desc = f"""What would happen if a black hole ten times heavier than the Sun crossed our Solar System? Not a disaster movie — the actual physics, year by year, from the first flickering star to the three ways it could end.

Every orbit in this video comes from a real N-body gravity simulation run for this story (10 solar masses, 45 km/s, passing the Sun at ~1 AU). In that simulation every planet is thrown out of the Solar System, the Moon is pulled away from Earth, and the black hole leaves carrying Venus.

Which ending do you think is worst? Tell us in the comments.

CHAPTERS
""" + "\n".join(f"{ts(t, False)} {name}" for t, name in chap) + """

THE SCIENCE (sources)
• First isolated stellar-mass black hole, found by microlensing (OGLE-2011-BLG-0462): Sahu et al. 2022, ApJ 933, 83; Lam et al. 2022, ApJL 933, L23
• Nearest known black hole, Gaia BH1 (~1,560 light-years): El-Badry et al. 2023, MNRAS 518, 1057
• Free-floating planets may outnumber stars: Sumi et al. 2023, AJ 166, 108
• A planet ejected into interstellar space can keep a liquid ocean under ice: Abbot & Switzer 2011, ApJL 735, L27 ("The Steppenwolf")
• ~100 million stellar black holes in the Milky Way: standard population estimate (e.g. Olejak et al. 2020, A&A 638, A94)
• Hill-sphere estimates (Moon, Ganymede, Saturn's rings), tidal-disruption radius and tide scaling: computed from the simulation's closest-approach distances.
• Encounter rate: n·π·b²·v with gravitational focusing → ~10^17 years for a pass within 1 AU. Order-of-magnitude estimate.

CREDITS
Planet textures: Solar System Scope (CC BY 4.0) — solarsystemscope.com
Narration voice: Kokoro-82M (Apache 2.0). Music and sound design: original, synthesised for this video.
Simulation, animation and rendering: made in-house.

#space #blackhole #whatif #astronomy #science
"""
title = mod.TITLE
alts = ["A Black Hole Is Coming. Here's Every Year Until It Arrives.",
        "We Simulated a Black Hole Passing Through the Solar System",
        "What If a Black Hole Passed Through Our Solar System?"]
with open(os.path.join(out, "metadata.md"), "w") as f:
    f.write(f"# {title}\n\nRuntime: {ts(tl['total'], False)}\n\n## Title options (A/B test)\n" + "\n".join(f"- {a}" for a in alts) +
            "\n\n## Thumbnail\n`thumbnail.png` — text: **30 YEARS LEFT**\n\n## Mid-roll ad breaks (at chapter boundaries)\n" +
            "\n".join(f"- {ts(t, False)}" for t in mids) + "\n\n## Description\n```\n" + desc + "```\n\n## Tags\nblack hole, what if, black hole solar system, rogue black hole, space documentary, astronomy, n-body simulation, earth, end of the world, science explained\n")
print(open(os.path.join(out, "metadata.md")).read()[:1500])
