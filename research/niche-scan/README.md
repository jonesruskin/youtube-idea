# Niche scan (free)

This finds YouTube formats that are winning **right now** for **small and new channels**, without spending TubeLab credits or needing an API key. Python 3 standard library only.

```bash
cd research/niche-scan
python3 scan.py broad                          # 42 candidate niches → data/broad.json   (~10 min first run, cached after)
python3 scan.py formats                        # targeted formats + hybrids → data/formats.json
python3 analyze.py data/formats.json           # ranked table
python3 analyze.py data/formats.json -v        # + breakout videos per niche
python3 analyze.py data/formats.json -v --likes                # + like rate (junk-view check)
python3 analyze.py data/formats.json --csv data/<date>-formats.csv   # evidence export
```

- **What it reads:** public search pages (top by views, uploaded this month or this year), channel video pages and watch pages. It keeps long-form (≥4 min) English titles only.
- **What it measures:** demand, the share of hits from channels under 50K subs or under 120 days old, outliers (3x or more a channel's own median), and incumbent lock-in (the share of views going to channels with 1M+ subs). The column meanings are at the top of `analyze.py`.
- **Add a niche:** add a line to `sets.py` with its search queries and a title regex.
- **Cache:** pages are cached in `.cache/niche-scan/` (git-ignored), so re-runs are instant. Delete the cache to get fresh numbers. Raw JSON stays out of git; the dated CSVs are the evidence we keep.
- **Be polite:** 4 workers with a delay, and each page is fetched once. YouTube's terms discourage automated access, so keep runs occasional and small. For anything regular or bigger, use the official YouTube Data API or TubeLab's paid search (its channel, video, transcript and comment tools are free).

Latest findings: [`docs/08-niche-scan-2026-10.md`](../../docs/08-niche-scan-2026-10.md).
