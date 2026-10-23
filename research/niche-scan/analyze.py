"""Rank a scanned niche set by demand, how often small/new channels win, and how much incumbents own it.

    python3 analyze.py data/formats.json            # table
    python3 analyze.py data/formats.json -v         # + breakout examples per niche
    python3 analyze.py data/formats.json -v --likes # + like rate per example (one watch-page fetch each)

Columns (long-form, English, from top-by-views search results):
  mVid/mCh  videos and distinct channels uploaded in the last month
  yCh       distinct channels in this year's top results (fewer than mCh = a wave that started this month)
  demand    median views of the month's top 10
  v/day     median views per day since upload, month videos
  hits      month videos with 100K+ views; <50K = of those, from channels under 50K subs
  new       hits from channels whose whole catalogue is under 120 days old
  big%      share of this year's views taken by channels with 1M+ subs (incumbent lock-in)
  outl      month videos with 50K+ views at 3x+ their channel's median (needs 6+ other long uploads)
  score     log10(demand) x (0.4 + small-hit share) x (1 + 2 x outlier rate) x (1 - big%/2); a sort key, not a forecast
"""
import json, math, os, statistics as st, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import yt

D = json.load(open(sys.argv[1])); CH = D["channels"]

def chinfo(cid, vid):
    c = CH.get(cid) or {}
    vs = [v for v in c.get("videos", []) if v["dur"] >= 240 and v["views"] > 0]
    others = [v["views"] for v in vs if v["id"] != vid]
    ages = [v["age"] for v in c.get("videos", []) if v["age"] is not None]
    whole = c.get("nvid", 0) and c["nvid"] <= len(c.get("videos", []))
    return {"subs": c.get("subs", 0), "nvid": c.get("nvid", 0),
            "base": st.median(others) if len(others) >= 6 else None,
            "first": max(ages) if (ages and whole) else None}

f = lambda x: f"{x/1e6:.1f}M" if x >= 1e6 else f"{x/1e3:.0f}K"
rows = []
for n, b in D["niches"].items():
    M = sorted(b["month"].values(), key=lambda v: -v["views"]); Y = list(b["year"].values())
    for v in M + Y: v.update(chinfo(v["cid"], v["id"]))
    if not M:
        rows.append({"n": n, "score": 0, "M": []}); continue
    hits = [v for v in M if v["views"] >= 100_000]
    small = [v for v in hits if v["subs"] < 50_000]
    new = [v for v in hits if v["first"] is not None and v["first"] <= 120]
    outl = [v for v in M if v["base"] and v["views"] >= 50_000 and v["views"] / v["base"] >= 3]
    ytot = sum(v["views"] for v in Y) or 1
    big = sum(v["views"] for v in Y if v["subs"] >= 1_000_000) / ytot
    dem = st.median([v["views"] for v in M[:10]])
    score = math.log10(1 + dem) * (0.4 + len(small) / max(len(hits), 1)) * (1 + 2 * len(outl) / len(M)) * (1 - big / 2)
    rows.append({"n": n, "M": M, "mCh": len({v["cid"] for v in M}), "yCh": len({v["cid"] for v in Y}), "dem": dem,
                 "vel": st.median([v["views"] / max(v["age"] or 1, 1) for v in M]), "hits": len(hits),
                 "small": len(small), "new": len(new), "outl": len(outl), "big": big, "score": score})
rows.sort(key=lambda r: -r["score"])

print(f"{'niche':24} {'mVid':>4} {'mCh':>4} {'yCh':>4} {'demand':>7} {'v/day':>6} {'hits':>4} {'<50K':>4} {'new':>4} {'outl':>4} {'big%':>4} {'score':>5}")
for r in rows:
    if not r["M"]: print(f"{r['n']:24} {0:>4}"); continue
    print(f"{r['n']:24} {len(r['M']):>4} {r['mCh']:>4} {r['yCh']:>4} {f(r['dem']):>7} {f(r['vel']):>6} {r['hits']:>4} {r['small']:>4} {r['new']:>4} {r['outl']:>4} {r['big']*100:>4.0f} {r['score']:>5.2f}")

if "--csv" in sys.argv:
    import csv
    path = sys.argv[sys.argv.index("--csv") + 1]
    with open(path, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["niche", "video_id", "title", "channel", "channel_id", "views", "age_days", "minutes", "subs", "x_channel_median", "channel_age_days"])
        for r in rows:
            for v in r["M"]:
                w.writerow([r["n"], v["id"], v["title"], v["channel"], v["cid"], v["views"], round(v["age"] or 0), v["dur"] // 60, v["subs"],
                            round(v["views"] / v["base"], 1) if v["base"] else "", round(v["first"]) if v["first"] is not None else ""])
    print(f"wrote {path}")

if "-v" in sys.argv:
    for r in rows:
        ex = [v for v in r["M"] if v["subs"] < 150_000][:8]
        if not ex: continue
        print(f"\n## {r['n']}")
        for v in ex:
            ratio = f"x{v['views'] / v['base']:.0f}" if v["base"] else "x?"
            age = f"{v['first']:.0f}d" if v["first"] is not None else "older"
            like = ""
            if "--likes" in sys.argv:
                e = yt.engagement(v["id"])
                like = f" like {e['like_rate'] * 100:.2f}%" if e["like_rate"] else " like ?"
            print(f"  {f(v['views']):>6} {ratio:>5} subs {f(v['subs']):>5} ch-age {age:>5} {v['dur'] // 60:>2}m{like} | {v['channel'][:22]:22} | {v['title'][:74]}  [{v['id']}]")
