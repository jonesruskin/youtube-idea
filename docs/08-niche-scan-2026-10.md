# 08 · Niche scan: where the unsaturated, high-viral formats are (23 Oct 2026)

> The free scan, done without TubeLab credits. **54 niches and formats, 288 YouTube searches, 1,867 channel catalogues, like rates on about 110 breakout videos, and top comments on 4 benchmark videos.** The tool is in [`research/niche-scan/`](../research/niche-scan/) and can be re-run any week.

## TL;DR

1. **Our current format is getting saturated.** "What if you had [power]" is still huge (median 1.3M for the month's top 10), but it is now a gold rush. There are at least 8 channels and copies of copies. Minute Zero's "…and Couldn't Stop" template ran out in **10 days**: 1.8M, 1.8M, then 342K, then 24–47K. Our serial story is the moat. The premise itself is not.
2. **Best opening: cosmic disasters told as survival timelines.** *"The Sun Went Out: Your Day 1 to Day 365."* Both parent formats are proven, and nobody combines them:
   - **Cosmic "what would happen if":** The Last Day, a 3-month-old channel with 32K subs, got 1.7M / 1.5M / 777K / 729K for its Earth-scale scenarios.
   - **"Day N" survival stories:** the highest demand in the whole scan (median 2.3M, 29K views/day), and the best fan engagement (Bunker Survival 1 Year: 1.8% like rate, Part 2 at 3.3%).
   - **The combination doesn't exist yet:** five searches for it returned no cosmic "Day 1 to Day N" survival video.
3. **Second opening: space histories in the "ENTIRE History of X in N Minutes" format.** This is the fastest-rising wave for new channels: 24 of 33 hits came from channels under 50K subs, and 17 from channels **under 4 months old**. Every entry is a country history, which brings flame wars and advertiser risk. **No one is doing Mars, the Moon, the Sun or Betelgeuse.**
4. **The plan:** test both as Loose Files right after Episode 1, using only kit we already have. Decide from 7-day numbers (see "The test" below).

## Method (what "unsaturated + likely to go viral" means here)

There's no tool that measures viral probability. We measured four things you can observe instead:

| Signal | How we measured it | Why it matters |
|---|---|---|
| **Demand** | Median views of the month's top 10 long-form English uploads, sorted by views | Is anyone watching right now? |
| **Breakout access** | Share of 100K+ hits from channels under 50K subs, and from channels under 120 days old | Can a newcomer win, or only incumbents? |
| **Outlier rate** | Videos at 3x or more their own channel's median (only channels with 6+ other long uploads) | The format is winning, not just the channel |
| **Lock-in** | Share of the year's views taken by channels with 1M+ subs | How much the big channels already own it |

We also counted a **wave** signal: more distinct channels in this month's top results than in this year's, which means the format started this month. As quality checks, we looked at **like rate** (under about 0.2% suggests bought or junk views) and **top comments** (what viewers actually want).

## Round 1: 42 niches we could produce (code-animated, faceless, science/story)

These are the top of the English-only re-run (full table: `python3 analyze.py data/broad.json`).

| Niche | Demand | Hits 100K+ | From <50K channels | Big-channel share | Read |
|---|---|---|---|---|---|
| History map animation | 203K | 12 | 9 | 35% | "History of the World: Every Year" at 464K from a 2K-sub channel |
| History, animated | 707K | 21 | 13 | 33% | The "ENTIRE History of X" wave (see Round 2) |
| Mythology | 617K | 16 | 10 | 36% | "Every god explained in N minutes" works for tiny channels |
| Prehistoric | 460K | 21 | 9 | 25% | Healthy, but full of animal-battle content for kids |
| Future timeline | 340K | 13 | 8 | 50% | Deep-time futures plus sci-fi documentaries |
| What-if powers (us) | 765K | 8 | 4 | 35% | Huge, crowding fast |
| Survival story | 2.0M | 20 | 10 | 98% | Biggest demand, mostly owned by large channels |
| Body "what happens if" | 979K | 13 | 4 | 91% | Owned by large channels; small entrants use AI voice-clones of celebrities |

**Ruled out:**
- **Psychology and philosophy:** faceless AI content ("Carl Jung says…", "Richard Feynman explains…" voice clones). That's exactly what YouTube's inauthentic-content rules demonetize.
- **"How it's made" factories:** needs real footage.
- **Hindi and Bengali story animation:** enormous views, but a different, lower-paying market.
- **Math, paradoxes, the Kardashev scale, the micro-world:** almost no recent demand.

## Round 2: the formats round 1 surfaced (5 query phrasings each, English, long-form)

| Format | Month vids | Month channels | Year channels | Demand | Views/day | Hits | <50K | New (<120d) | Big% |
|---|---|---|---|---|---|---|---|---|---|
| **ENTIRE History of X** | 53 | **43** | **25** | 540K | 8K | 33 | **24** | **17** | 31 |
| **Survival timeline** ("Day 1 to Day N", "1 Year") | 58 | 40 | 53 | **2.3M** | **29K** | **48** | 24 | 8 | 88 |
| What-if powers | 45 | 29 | 14 | 1.3M | 20K | 23 | 14 | 2 | 70 |
| Deep future / sci-fi documentary | 39 | 36 | 36 | 200K | 2K | 9 | 8 | 0 | 33 |
| Every X explained | 50 | 34 | 28 | 235K | 3K | 13 | 6 | 0 | 16 |
| Myths that turned out true | 72 | 66 | 42 | 381K | 4K | 22 | 10 | 2 | 70 |
| Cosmic what-if | 67 | 57 | 49 | 101K | <1K | 5 | 4 | 3 | 31 |
| POV history ("Your first 24 hours as…") | 42 | 41 | 26 | 226K | 1K | 9 | 5 | 1 | 51 |

**Cosmic what-if looks weak only on average.** 57 channels are trying it, most of them low-effort (a commenter on one 435K-view video points out it has 9 likes). Almost all the demand goes to one channel doing it properly: The Last Day, with ~20-minute videos, real physics and a day-by-day structure. **That's a quality gap, not a lack of demand.**

## Round 3: the hybrids (proven parents crossed with our space-science edge)

| Hybrid | What the search returned | Read |
|---|---|---|
| **Cosmic survival timeline** | **No cosmic "Day N" survival video at all.** The closest were "What If You Were the Last Human on Earth?" at 1.1M and 751K, both from channels around 13K subs, and an 8-day-old stick-figure channel doing "Day 1 to Day 30" survival for other premises | **Empty overlap between two proven parents** |
| **Space history, "ENTIRE History" style** | Searches for the universe, Mars, the Moon and Earth returned **only country histories and fictional worlds** | **Empty overlap** |
| Wake up in the future | "We Returned to Earth 4,000 Years Later" (463K, 1.2% like rate) already has a **near-identical twin** from another channel ("Historia del futuro IA", 419K) posted the same month | Proven, but already being duplicated; watch it, don't build it yet |

## What the winners' own catalogues show

- **The Last Day** (3 months old, 22 videos). Its dinosaur videos got 4K–23K views. Then it switched to "What would happen if [Earth-scale event]" and got 1.5M, 1.7M, 777K and 729K. **The premise is what got discovered, not the channel.** Its biggest one is structured *Day 1 → Day 5*.
- **Galactic Highway.** Survival *guides and explainers* get 4K–460K views. The survival *story* "Bunker Survival 1 Year" got 2.0M, and its Part 2 got 983K. **Story beats explainer by 5–10x.**
- **Minute Zero.** It posted nine "…and Couldn't Stop" videos in 12 days, and views fell from 1.8M to around 30K. **A single template wears out in about 10 days.**
- **History Tab Open** (6 videos). Israel got 1.1M, Japan 114K, Trump 9.7K, Halloween 495. **The topic drives the hit, and here the hit topic is a political one.**

## What viewers say (top comments, via TubeLab's free comments tool)

- **Bunker Survival 1 Year:** "There's got to be a part 2. Saw this on Instagram…" (5.1K likes). Others praise the dark-hallway sound design and how creepy the whispering is. One comment reads "2:56 where Instagram cuts off". **Clips that cut off at a cliffhanger on Reels and Shorts feed the long video.**
- **Moon crashed into Earth:** "Whoever made this video ACTUALLY did their homework on how this would play out. Glad they didn't take the science fiction way out…" Many viewers add the real fact that the Moon is drifting away (about 3.8 cm a year). **Rigour gets rewarded, and the reality-check ending gets people commenting.**
- **ENTIRE History of Israel:** religious flame wars, and "your AI maps are absolutely shocking". **Inaccurate maps are an opening. Ours are drawn from Natural Earth data in code, so they are accurate.**

## The two bets

### Bet 1: Cosmic Survival Timelines (primary)
**The format:** *[a real-physics cosmic event] + "you" + a day counter.* Each day is a beat, and the reality check comes last.

It uses what we've already built:
- the time-of-day sky kit (a sun going out is a sky grade)
- the Globe (where the freeze or flood spreads)
- the Executor's hologram science
- the procedural score for suspense
- the 45-second beat linter (one day per beat)

Titles in priority order (each avoids The Last Day's existing scenarios):
1. *The Sun Went Out. Here's Your Day 1 to Day 365*
2. *Earth Stopped Spinning: Survive Day 1 to Day 100*
3. *Night Never Came Back: Day 1 to Day 365 Under a Second Sun* (this is FILE 03 "Second Sun", tested before we commit to a season)
4. *Gravity Dropped by Half: Day 1 to Day 30*
5. *Earth Lost Its Magnetic Field: Day 1 to Day 100*
6. *A Rogue Black Hole Is 30 Days Away: Day 1 to Impact*
7. *The Oceans Started Boiling: Day 1 to Day 30*
8. *Every Volcano Erupted at Once: Day 1 to Day 60*

Why it should be ours rather than The Last Day's: they narrate scenarios. We put the viewer *inside* one, with a person, a running catch and a choice, which is exactly the Episode 1 structure. They could add the survival angle at any time, so **the window is probably 4–8 weeks.**

### Bet 2: Space histories in the "ENTIRE History of X" format (secondary, cheap)
1. *The ENTIRE History of Betelgeuse in 10 Minutes*. It's a real red supergiant near the end of its life and the dead star of our lore, so every viewer is a lead for The Blink Files.
2. *The ENTIRE History of Mars in 12 Minutes*
3. *The ENTIRE History of the Moon in 10 Minutes*
4. *The ENTIRE History of the Sun, Birth to Death*
5. *The ENTIRE History of Saturn's Rings*
6. *The ENTIRE History of Voyager 1*

Why space instead of countries: there are no geopolitics, so it's advertiser-safe and has a global audience. Our maps are accurate. And it's evergreen, while the country wave burns out on whatever topic is hot.

## Avoid or just watch

- **More what-if *powers* premises without the serial layer.** That's where the copies are piling up and templates wear out.
- **Zombie and bunker survival as a topic.** About 88–98% of the year's views go to 1M+ channels, and it gets gory. Borrow its *mechanics* (day counter, sound design, a Part 2 cliffhanger), not its topic.
- **Psychology, philosophy, and body "what happens if" built on voice clones.** Demonetization risk.
- **Country histories.** Flame wars and a short shelf life.

## The test (decided by data, no debate)

Ship Episode 1 as planned. Then release **Loose File A** (Bet 1, title #1) and a **Betelgeuse history** (Bet 2), each with 3 cliffhanger Shorts. At day 7, compare each against Episode 1:

| Metric | Double down if | Drop if |
|---|---|---|
| Views at day 7 | ≥ 2x Episode 1 | < 0.5x Episode 1 |
| Impressions click-through | ≥ 6% | < 3% |
| Viewers still watching at 30s | ≥ 65% | < 50% |
| Comments per 1K views | ≥ 2 | < 0.5 |

If Bet 1 wins, FILE 03 "Second Sun" becomes a **Day 1 to Day 365 survival season**, and Cosmic Survival Timelines become the channel's main long-form format. The Blink Files lore stays as the connective tissue.

## Caveats

- **Search shows winners.** The results are sorted by views, so "unsaturated" means *absent from the top results*, not a full count of every channel. A paid outlier search can count across a whole database.
- **This is one snapshot (23 Oct 2026).** Waves move in weeks, so re-run the scan weekly.
- **The numbers are estimates.** Search views are rounded. Channel medians come from the newest ~30 uploads. "Channel age" is known only when the whole catalogue fits on the channel's first page.
- **Scraping:** it reads public pages at low volume and caches them. YouTube's terms discourage automated access, so for regular or larger use switch to the official YouTube Data API (free key) or TubeLab.

## If we buy TubeLab credits later: the validation pass (~30 credits)

Starter's 200 credits covers this several times over.

- `search_outliers` (2 credits each), all with `publishedAtFrom: "trimester"`, `subscribersCountTo: 100000`, `durationFrom: 480`, `classificationQuality: "neutral"`:
  - `["day 1 to day", "survival"]`
  - `["what would happen if", "earth"]`
  - `["what if the sun", "what if earth"]`
  - `["entire history of"]`
  - `["history of mars", "history of the moon", "history of the sun"]`
- `search_trending_formats` (1 credit each) on the same 5 topics.
- `search_related_channels` (5 credits each) on The Last Day and Galactic Highway, to find the competitors this scan missed.
