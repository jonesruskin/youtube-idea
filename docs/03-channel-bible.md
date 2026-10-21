# 03 · Channel bible: THE BLINK FILES

> **Every series is a File.** File 01 is **THE WILL**.
> Motto: ***Be kind when no one's watching. Someone is.***

## The one-sentence pitch
**Betelgeuse went dark. Three days later, every radio on Earth received the last will and testament of the alien civilization that lived there, and they left everything they owned to twelve ordinary humans.**

## The spine, in the order viewers learn it

1. **The Blink.** Betelgeuse, the red star on Orion's shoulder, can be seen from every country on Earth. One night it went out. It didn't explode; it went dark like a switch.
   - Grounded in reality: in 2019–20 Betelgeuse really did fade to about a third of its brightness (the "Great Dimming").
   - It's about 550 light-years away, so whatever happened there happened 550 years ago.
2. **The Broadcast.** Three days later, every radio, phone and TV on Earth received the same transmission from the outer solar system: *"This is the last will and testament of the Vey. We are gone. We leave everything we owned… to twelve of you."*
3. **The clever bit.** The Vey sent their **Executor** (a probe) centuries ago. It has been waiting in our solar system for one signal: the moment humans *saw* Betelgeuse go dark. Light takes 550 years to cross that distance, so **their own death was the timer.** When we saw it, the will activated.
4. **Twelve heirs. Eight billion candidates.** Nobody knows who the heirs are, so every viewer can imagine it's them. The Executor signs off every episode with: *"If you're wondering whether it could be you… I'm still reading."*

## The Vey (lore bible: reveal slowly)
- An old, gentle civilization of builders who lived in a ring of constructed worlds around Betelgeuse, drinking its light.
- **Design language:** pearl surfaces, gold filigree and a cool inner glow. Every inheritance looks Vey-made, so the audience learns to recognize it.
- **What really happened (revealed in Ep9):** they didn't die of old age. **Something put Betelgeuse out.** The Vey call it ***the Quiet***: a thing that moves between stars and swallows their light. Knowing they couldn't outrun it, the Vey sent away what they loved most, with everything she would need.
- **Item Thirteen (revealed in Ep12):** the last Vey, *a child*, in stasis. All twelve inheritances were what parents leave a child: a ship with a small seat, a planet with a little bedroom, a healer calibrated for a small body, a pet who keeps looking for someone, a music box that plays her lullaby.

## The mysteries (one sentence each; that's the rule)
| Mystery | Planted | Paid off |
|---|---|---|
| What is Item Thirteen? | Ep1 Ledger: "SEALED until all twelve are together" | Ep12: a child |
| Why these twelve? | Every cold open shows a small kindness nobody saw | Ep12: the Executor replays all twelve. "We were looking for people who are kind when no one is watching." |
| Who is the small seat for? (plus 10 other odd details) | One per episode (see `05-season-one.md`) | Ep12 |
| What happened to the Vey? | Ep1: "Which one was yours?" "…The dark one." | Ep9: the Quiet |
| Will Kade win? | Ep1: "I only need one of you to slip." | Ep7 (he wins one), Ep11 (he wins Item Thirteen on a loophole), Ep12 (he withdraws) |

**Twist ladder:**
- **Ep5:** the will's key word was mistranslated: not "heirs" but **"guardians."** *They didn't leave us their things. They left us a job.*
- **Ep7:** an heir loses. Kade wins an inheritance.
- **Ep9:** "Something put it out."
- **Ep11:** Kade claims Item Thirteen.
- **Ep12:** a child.

## Why the finale won't feel like a betrayal
1. **Every answer is seeded on screen, and fairly.** A viewer who rewatches can find all twelve odd details and all twelve kindnesses.
2. **The twist reframes what came before; it doesn't contradict it.** "Heirs" become "guardians", gifts become a dowry, and a contest becomes custody.
3. **The "useless" item pays off.** Pip's music box, mocked all season, is the only thing that wakes the child. Audiences love it when the dismissed thing turns out to matter.
4. **The villain's turn is earned.** Sofia healed Kade in Ep6 when nobody else would. In Ep12 he returns the kindness. The theme pays off through the antagonist too.
5. **The finale opens a door rather than leaving a hole.** The central question is fully answered, and a new one opens: *"There is one more clause. It concerns Earth."* (Season 2: THE GUARDIANS.)

## Recurring cast (non-heirs)
- **The Executor.** Pearl prism with orbiting gold rings. Precise, literal, unfailingly polite, and accidentally hilarious. It is the narrator: it reads every file to us. Running bits: it quotes statistics about human behavior ("the most common human response"); it is "not permitted to explain physics you have not discovered yet"; Pip calls it "Mr. Shiny".
- **Desmond Kade.** The richest man on Earth until Mags. Silver hair, immaculate manners, never raises his voice. He is the will's **contester**: if an heir breaks a rule, the inheritance passes to him. Running gag: *"That was a leased vehicle."* Hidden motive: he has seen classified images of the Quiet and wants the inheritances to build an escape for humanity, with himself first in line.
- **Priya.** Kade's assistant. Deadpan, and secretly on the heirs' side by Ep10.

## Tone
- **Wonder first, then comedy, then heart.** Every episode needs a jaw-drop, at least three laughs, and one lump in the throat.
- The Executor's dry wit carries the humor. It is never mean.
- Stakes are real, but **no gore and no cruelty**, so the story suits ages 13+ and still lands with adults.
- The science is real wherever the story touches it, and footnoted.

## Visual identity: "Night Ink & Pearl"
- **Characters:** flat color, real skin tones, navy-ink outlines (5px at 1×), and a rim light in the character's signature color. Faces are expressive with big readable eyes. One design per character, defined once in `src/characters/registry.ts`.
- **Palette:** night `#070A1C`, ink `#0B1026`, pearl `#F4EFE6`, gold `#E8C27A`, stamp red `#E2483D`, Betelgeuse orange `#FF7A3D`.
- **Typography:**
  - Cormorant Garamond for the Vey's will
  - Unbounded for titles
  - Space Grotesk for UI
  - IBM Plex Mono for ledger and stamps
- **On-screen text is used sparingly.** It appears only for place/time stamps, footnotes, the Rules, the Ledger and title cards. Never captions in the picture; captions ship as `.srt`.
- **Thumbnails:** a case-file strip, a red **HEIR #NN** stamp, the glowing inheritance, one reaction face, and 2–4 words of curiosity (e.g. "MOON BY 4AM").

## Voice casting (ElevenLabs)
| Speaker | Direction |
|---|---|
| Executor | Calm, warm-dry, faintly formal. Mid-low register. Precise consonants. Think museum curator who loves you. |
| Jonah | 17, Nigerian English, quick and funny, cracks when emotional. |
| Grandma Ada | 81, Nigerian English, commanding, then delighted. |
| Mrs. Bello | Older, soft, Yoruba-accented English. |
| Kade | 60s, smooth transatlantic, never hurried. |
| Priya | 30s, crisp, deadpan. |
| Anchor | Generic news cadence. |
| Captain / Fishermen | Ghanaian or Nigerian English, urgent. |
