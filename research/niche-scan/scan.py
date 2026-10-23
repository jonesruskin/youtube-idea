"""Scan a niche set: top long-form English uploads this month and this year, plus every winning channel's recent catalogue.

    python3 scan.py broad      # -> data/broad.json
    python3 scan.py formats    # -> data/formats.json
"""
import json, os, re, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import yt
from sets import SETS

SP = {"month": "CAMSBAgEEAE", "year": "CAMSBAgFEAE"}  # sorted by views; uploaded this month / this year; videos only
LONG = 240  # we make 8–12 minute episodes, so Shorts and clips don't count

def english(title):
    letters = [c for c in title if c.isalpha()]
    return bool(letters) and sum(c.isascii() for c in letters) / len(letters) > 0.95

def run(name):
    niches = SETS[name]
    jobs = [(n, q, k) for n, (qs, _) in niches.items() for q in qs for k in SP]
    with ThreadPoolExecutor(4) as ex:
        pages = list(ex.map(lambda j: yt.search(j[1], SP[j[2]]), jobs))
    out = {}
    for (n, q, k), vids in zip(jobs, pages):
        rx = re.compile(niches[n][1], re.I)
        bucket = out.setdefault(n, {"month": {}, "year": {}})[k]
        for v in vids:
            if v["dur"] >= LONG and english(v["title"]) and rx.search(v["title"]):
                bucket[v["id"]] = {**v, "q": q}
    cids = sorted({v["cid"] for n in out.values() for k in n.values() for v in k.values()})
    print(f"{len(jobs)} searches, {len(cids)} channels", flush=True)
    with ThreadPoolExecutor(4) as ex:
        chans = dict(zip(cids, ex.map(yt.channel, cids)))
    os.makedirs("data", exist_ok=True)
    json.dump({"niches": out, "channels": chans}, open(f"data/{name}.json", "w"))
    print(f"wrote data/{name}.json", flush=True)

if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "broad")
