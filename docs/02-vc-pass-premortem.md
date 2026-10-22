# 02 · The VC pass, and the pre-mortem

> You asked me to play the VC who passes. Here is the memo, written honestly. Then I explain what we changed so this memo doesn't come true.

## The pass

**"We're passing on The Blink Files at this stage."**

The concept is better than what's in the category. The **dead-star gifts** spine (and its 13th-gift mystery) is the strongest serial hook I've seen pitched for faceless animation. But three things keep me from writing a cheque today:

1. **The moat is thin, and the window is short.** Ifverse and IFOLOGY are two weeks old. By the time this ships there will be fifty "What If" animation channels, and their recommendation graph will be crowded. A new name doesn't create distance. What creates distance is a format nobody else can produce: a serialized mystery with recurring characters and payoffs. That only counts as a moat if you ship it **every week for 12 weeks without slipping.** One founder writing 1,200-word scripts plus code-built animation is a capacity risk I can't diligence away.
2. **Production quality against illustrated competitors.** Remotion vector art is clean, but competitors use painted backgrounds. If the first 30 seconds look cheaper, retention dies before the story can work. You haven't shown me a retention curve yet.
3. **The founder's taste is the product.** That's a strength, but it's also key-person risk. Nothing in the pipeline encodes *why* an episode works, apart from the linter and the bible. Write those down harder.

## Pre-mortem: "It's April 2028. The Blink Files failed. Here's why."

> **What happened.** Episode 1 did well: 380K views, and the "thirteenth dot" theories took off in the comments. Episodes 2–4 held at 150–250K. Then production slipped from weekly to fortnightly while the founder rebuilt the storm and beach scenes by hand for Episode 5. The comment theories went quiet. A competitor launched a copycat "space powers" channel in week 9 using AI-generated video and posted daily. By the time Episode 9's big twist landed, two months late, the audience had moved on, and the finale reached 40K people who no longer remembered the thirteenth dot. Ad income covered the ElevenLabs bill and not much else.
>
> **Root causes, in order:**
> 1. **Cadence broke.** A serialized mystery dies when the gap between episodes is longer than the audience's memory, which in practice is about 10–14 days.
> 2. **New environments were built from scratch for every episode.** Each episode needed 10+ new environments built in code, so production time grew with every episode instead of shrinking.
> 3. **The serial layer cost more than it earned** (see below). Viewers came for the power demo and left during the lore.
> 4. **Packaging tests came too late.** Thumbnail A/B testing (YouTube Test & Compare) wasn't used until Episode 6.
> 5. **Shorts were treated as an afterthought** instead of as a daily signal that the story was still alive.

## The single assumption this plan depends on and hasn't tested

> **That a 9–10 minute *serialized* story can keep a viewer who arrived from a single-premise thumbnail.**

The power question is settled. After the founder's review we moved from inherited objects to inherited **powers**, the format every hit in this genre uses. What remains untested is whether the *story* layer adds watch time, or whether viewers only want the power demo and leave once they've seen it.

**How we'll know (live data, no separate test):**
- **Retention curve shape in Episode 1.** Look for no cliff after the cold open (the 0:45 drop should be under 25%) and visible bumps at the two mid-roll cliffhangers.
- **Returning-viewer share on Episode 2 versus Episode 1.** Above 30% means the serial hook works.
- **Comment themes.** Count the comments about the *13th dot* against comments about the power.

**If it fails:** keep the powers and the cold-open structure, cut the serial layer to the last 30 seconds, and make each episode fully standalone.

## What we changed so the memo doesn't come true

| Risk | Mitigation built into this repo |
|---|---|
| Cadence | **Reusable environments and a scene registry** (`src/scenes.tsx`). Every episode reuses the background kit (`src/env/kit.tsx`: skies, clouds, facades, roads, vehicles, grade), the hologram style, the Globe, Orion and the character rig. Only 3–5 new sets are needed per episode. |
| Quality bar | A **contact-sheet preview** (`scripts/preview.ts`) shows every shot's key frame in about 40 seconds. Nothing renders blind. |
| Retention | A **pacing linter** (`npm run lint:episode`) checks the hook within 15 seconds, a laugh/wow/heart/open-loop beat at least every 45 seconds, and mid-rolls only after cliffhangers. |
| Clone and inauthentic-content risk | An original format, original characters, an original procedural score, human-written scripts, and a different visual language (see `01-competitor-teardown.md`). |
| Content ID | **No stock music.** The score is synthesized from code for each episode, so there is nothing to claim. |
| Key-person risk | `03-channel-bible.md`, `06-episode-formula.md` and `07-series-framework.md` hold the *why*, so a second writer can pick it up. |
| Made-for-kids trap | Themes and dialogue are written for **13+**. Mark the channel "not made for kids"; a kids designation disables comments, and the comment theories are the engine. |

## Money, honestly (estimates, not promises)

- Mid-roll ads unlock at 8:00. Episode 1 runs **9:11 (estimated, before voice) with 2 mid-rolls** on cliffhangers (5:56 and 7:39).
- RPM for a global 13–24 animation audience usually falls between **$1.5 and $5** per 1,000 views. Space and science topics trend toward the upper half.
- On 1M views/month across the channel, that is about **$1.5K–5K/month**. Shorts add reach but very little revenue.
- **ElevenLabs:** one full pass of Episode 1 is about 6,000 characters, roughly 6K credits on the standard models. The Creator plan (~100–121K credits/month) covers about 12+ episodes with retakes. Check the current pricing page.
