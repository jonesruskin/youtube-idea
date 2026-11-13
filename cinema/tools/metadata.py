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
META = getattr(mod, "META", {})
chap = [(0.0, META.get("first_chapter", "Intro"))]
for seg in mod.SEGMENTS:
    c = seg.get("card") or {}
    if c.get("kind") in ("chapter", "fate"):
        num = c["num"].replace(" – ", "-")
        lab = num.title().replace("Km", "km")
        chap.append((segs[seg["id"]]["start"], f'{lab}: {c["text"]}'))
    if seg["id"] in META.get("extra_chapters", {}):
        chap.append((segs[seg["id"]]["start"], META["extra_chapters"][seg["id"]]))
# mid-roll suggestions: natural pauses right before chapter cards, after 2:00, spaced >= 2 min
mids, last = [], 0
for t, _ in chap[1:]:
    if t > 200 and t - last >= 120:
        mids.append(t); last = t

desc = META["intro"] + "\n\nCHAPTERS\n" + "\n".join(f"{ts(t, False)} {name}" for t, name in chap) + \
    "\n\nTHE SCIENCE (sources)\n" + META["sources"] + """

CREDITS
Planet textures: Solar System Scope (CC BY 4.0) — solarsystemscope.com
Narration voice: Kokoro-82M (Apache 2.0). Music and sound design: original, synthesised for this video.
Simulation, animation and rendering: made in-house.

""" + META["hashtags"] + "\n"
title = mod.TITLE
alts = META["alts"]
with open(os.path.join(out, "metadata.md"), "w") as f:
    f.write(f"# {title}\n\nRuntime: {ts(tl['total'], False)}\n\n## Title options (A/B test)\n" + "\n".join(f"- {a}" for a in alts) +
            f"\n\n## Thumbnail\n`thumbnail.png` — text: **{META['thumb_text']}**\n\n## Mid-roll ad breaks (at chapter boundaries)\n" +
            "\n".join(f"- {ts(t, False)}" for t in mids) + "\n\n## Description\n```\n" + desc + "```\n\n## Tags\n" + META["tags"] + "\n")
print(open(os.path.join(out, "metadata.md")).read()[:1500])
