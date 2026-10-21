# 02 · The VC pass, and the pre-mortem

> You asked me to play the VC who passes. Here is the memo, written honestly. Then I explain what we changed so this memo doesn't come true.

## The pass

**"We're passing on The Blink Files at this stage."**

The concept is better than what's in the category. The **Will** spine is the strongest serial hook I've seen pitched for faceless animation. But three things keep me from writing a cheque today:

1. **The moat is thin, and the window is short.** Ifverse and IFOLOGY are two weeks old. By the time this ships there will be fifty "What If" animation channels, and their recommendation graph will be crowded. A new name doesn't create distance. What creates distance is a format nobody else can produce: a serialized mystery with recurring characters and payoffs. That only counts as a moat if you ship it **every week for 12 weeks without slipping.** One founder writing 1,500-word scripts plus code-built animation is a capacity risk I can't diligence away.
2. **Production quality against illustrated competitors.** Remotion vector art is clean, but competitors use painted backgrounds. If the first 30 seconds look cheaper, retention dies before the story can work. You haven't shown me a retention curve yet.
3. **The founder's taste is the product.** That's a strength, but it's also key-person risk. Nothing in the pipeline encodes *why* an episode works, apart from the linter and the bible. Write those down harder.

## Pre-mortem: "It's April 2028. The Blink Files failed. Here's why."

> **What happened.** Episode 1 did well: 380K views, and the ledger and Item Thirteen theories took off in the comments. Episodes 2–4 held at 150–250K. Then production slipped from weekly to fortnightly while the founder rebuilt the storm and beach scenes by hand for Episode 5. The comment theories went quiet. A competitor launched "What If You Inherited…" in week 9 using AI-generated video and posted daily. By the time Episode 9's big twist landed, two months late, the audience had moved on, and the finale reached 40K people who no longer remembered the small seat. Ad income covered the ElevenLabs bill and not much else.
>
> **Root causes, in order:**
> 1. **Cadence broke.** A serialized mystery dies when the gap between episodes is longer than the audience's memory, which in practice is about 10–14 days.
> 2. **New environments were built from scratch for every episode.** Each episode needed 10+ new environments built in code, so production time grew with every episode instead of shrinking.
> 3. **The self-insertion assumption was half-true** (see below). "Aliens left you X" clicked well for the spaceship, the asteroid and the planet. It clicked weakly for the translator and the window, which are *useful* rather than *thrilling*.
> 4. **Packaging tests came too late.** Thumbnail A/B testing (YouTube Test & Compare) wasn't used until Episode 6.
> 5. **Shorts were treated as an afterthought** instead of as a daily signal that the story was still alive.

## The single assumption this plan depends on and hasn't tested

> **That *receiving a dream object* ("What If Aliens Left You Their Spaceship?") produces the same self-insertion dopamine as *becoming more powerful* ("What If You Were 10x Faster?").**

Every data point we have is from body-power fantasies. Objects might perform even better, because they're more concrete and easier to share ("which one would you pick?"). Or they might perform worse, because owning a thing is less intimate than being transformed. We don't know yet. Everything else (the Will, the Rules, the Ledger) is built on top of this.

**How we'll know, using live data instead of a separate test:**
- Episode 1 CTR in the first 48 hours, compared with the channel's impressions-weighted average after Episodes 2 and 3. Target: **≥ 6% CTR** and **≥ 45% average view duration** on a ~10-minute video.
- Use YouTube **Test & Compare** on every thumbnail from Episode 1 onward (3 variants: object-hero, face-hero, text-hero).
- The 12-episode order puts the most desirable objects first (**ship, asteroid, pet, planet**) so the assumption is tested at full strength before the "useful" items (translator, window).

**If it fails** (CTR < 4% across Episodes 1–3): keep the Will spine but reframe the titles as transformations. For example, "What If You Woke Up Owning a Spaceship?" or "What If You Became the Richest Person Who Ever Lived?" The story is unchanged; only the packaging moves.

## What we changed so the memo doesn't come true

| Risk | Mitigation built into this repo |
|---|---|
| Cadence | **Reusable environments and a scene registry** (`src/scenes.tsx`). Every heir's episode reuses the Will slate, Ledger, Cockpit, Globe, Sky and Footnotes. Only 3–5 new environments are needed per episode. |
| Quality bar | A **contact-sheet preview** (`scripts/preview.ts`) shows every shot's key frame in about 40 seconds. Nothing renders blind. |
| Retention | A **pacing linter** (`npm run lint:episode`) checks the hook within 15 seconds, re-hooks at least every 75 seconds, no shot longer than 16 seconds, and mid-rolls only after open loops. |
| Clone and inauthentic-content risk | An original format, original characters, an original procedural score, human-written scripts, and a different visual language (see `01-competitor-teardown.md`). |
| Content ID | **No stock music.** The score is synthesized from code for each episode, so there is nothing to claim. |
| Key-person risk | `03-channel-bible.md`, `06-episode-formula.md` and `07-series-framework.md` hold the *why*, so a second writer can pick it up. |
| Made-for-kids trap | Themes and dialogue are written for **13+**. Mark the channel "not made for kids"; a kids designation disables comments, and the comment theories are the engine. |

## Money, honestly (estimates, not promises)

- Mid-roll ads unlock at 8:00. Episode 1 runs **10:03 with 2 mid-rolls** placed on cliffhangers (6:10 and 8:12).
- RPM for a global 13–24 animation audience usually falls between **$1.5 and $5** per 1,000 views. Space and science topics trend toward the upper half.
- On 1M views/month across the channel, that is about **$1.5K–5K/month**. Shorts add reach but very little revenue.
- **ElevenLabs:** one full pass of an episode is about 6,800 characters, roughly 7K credits on the standard models. The Creator plan (~100–121K credits/month) covers about 12+ episodes with retakes. Check the current pricing page.
