# 03 · Channel bible: THE BLINK FILES

> **Every series is a File.** File 01 is **THE GIFTS**.
> Motto: ***Be kind when no one's watching. Someone is.***

## The one-sentence pitch
**Betelgeuse died. With its last light, the people who lived there sent their powers to Earth: twelve gifts, for twelve ordinary people.**

A child can repeat it, and every viewer can picture it landing in *their* hand.

## How a viewer learns the spine (Episode 1 order)
1. **Cold open:** a teenager is holding a bus in the air. *How?* The hook is the power, never the lore.
2. **The night a star died:** Orion, the red star on his shoulder, how huge it is (shown: it swallows the orbits of Mercury, Venus, Earth and Mars), then it switches off.
3. **Twelve silver threads** fall from the dark spot onto twelve places on Earth. One lands in a sleeping boy's palm.
4. **The Executor**, "the last machine of the Vey", explains in one line: *"Before their star went out, they gave away the one thing they could not take with them: their gifts."*
5. **The episode's last line opens the season:** *"Twelve gifts were sent. Thirteen arrived."*

There is no will, no legal language, and no text slates. If an idea can't be shown, it isn't in the episode.

## Power design rules (what makes a gift work on YouTube)
1. **Readable in one frame.** A glowing palm and a floating bus need no explanation.
2. **There's an obvious on and off.** Jonah: an open glowing palm means float; a fist means gravity returns; a slow squeeze means a gentle landing. Normal touch, hugs and handshakes are just normal.
3. **It helps people.** Every episode's climax is a rescue that only this power could pull off.
4. **It comes from real space science,** shown in hologram diagrams: Newton's cannon, buoyancy, the ISS's 90% gravity, rocket fuel.
5. **It has a funny side effect** that becomes the episode's running gag. In Ep1, everything weightless slowly drifts upward, including the goat.

## The Twelve and their gifts (File 01)
| # | Heir | Gift | The sky it comes from | Why you'd want it | The catch |
|---|---|---|---|---|---|
| 1 | Jonah, 17, Lagos | **Zero-G Touch** | The space station: falling and missing | Lift anything, fly by throwing things | Everything weightless drifts up; let go too fast and it crashes |
| 2 | Mags, 71, Yorkshire | **Moon Legs** | The Moon's 1/6 gravity | Leap over buses, never fall hard again | She can't stay on the ground when she sneezes |
| 3 | Arjun, 12, Jaipur | **Black Hole Hand** | Black holes | Swallow floods, fires, falling debris | It gets hungrier the more he uses it |
| 4 | Kenji, 34, Tokyo | **Saturn's Rings** | Saturn's rings | An orbiting ice shield that protects crowds | The rings orbit *him*, so he can never stand close to anyone |
| 5 | Hamid, 58, Istanbul | **Comet** | Comets | Fly with a glowing tail | Like a comet, he only gets brighter the closer he goes to the Sun (heat) |
| 6 | Sofia, 29, Buenos Aires | **Sunlight Hands** | The Sun | Heal anything | She can only heal while the Sun is up |
| 7 | Chloé, 24, Marseille | **Gemini** | Twin stars | Be two of yourself | The twin has its own opinions |
| 8 | Tyrell, 31, Detroit | **Pocket Sun** | Fusion | Light and heat on demand; end blackouts | It runs on his mood |
| 9 | Sven, 66, Kiruna | **Hubble Eyes** | Telescopes and old light | See anything, any distance, even the past | He can't un-see |
| 10 | Mei, 19, Chengdu | **Orbit** | Gravity wells | Anything she points at orbits her; she catches falling people | Big things orbit slowly |
| 11 | Isabela, 40, Pará | **Terraform** | Planet-making | Grow a forest in minutes | Growth follows her heartbeat |
| 12 | Pip, 8, Québec | **Twinkle** | Starlight through air | Makes any light twinkle. "The most useless power in the universe" | Until the finale |

## Mysteries (one sentence each)
| Mystery | Planted | Paid off |
|---|---|---|
| **Why are there thirteen?** | Ep1 ending: a 13th dot appears in Jonah's palm | Ep12: the 13th thread carried the last Vey, a child |
| **Why these twelve?** | Every episode shows a small kindness nobody saw (Jonah: the radio; Kemi's toffee) | Ep12: the Executor replays all twelve. "We weren't looking for the strongest. We were looking for people who are kind when no one is watching." |
| **What does Kade want?** | Ep1: he tries to *hire* Jonah, then says "There are eleven more of you" | Ep9: he knows what put Betelgeuse out |
| **What happened to the Vey?** | Ep1: Betelgeuse "switched off" instead of exploding | Ep9: something put it out. The Vey call it *the Quiet*. |

**Twist ladder:**
- **Ep5:** Hamid reads Vey script. The gifts weren't meant to make heroes; they were meant to make **guardians**.
- **Ep7:** one of Chloé's two selves goes to work for Kade.
- **Ep9:** something put the star out.
- **Ep11:** Kade finds the thirteenth first.
- **Ep12:** it's a child. Pip's "useless" Twinkle is the only thing that calms her.

## The Executor
A floating pearl prism with gold rings, and the narrator. Precise, polite and accidentally hilarious ("That is the fourth flip-flop thrown at me today. I believe it is how humans say hello."). It explains science by **projecting gold hologram diagrams**, never by putting words on screen. It knows more than it says.

## Desmond Kade
The richest man on Earth, who builds rockets. He is never a cartoon villain: he makes offers people would genuinely want (Mars!). He wants the gifted on his payroll before he explains why. His line *"There are eleven more of you"* drives the season.

## Tone
- **A laugh every ~30 seconds,** a wow every ~minute, and one lump in the throat per episode.
- **Each scene causes the next** ("but" or "therefore", never "and then").
- **Everything is shown.** Science comes as diagrams in the Executor's hologram style, with 1–3-word labels at most.
- **13+.** Real stakes, no cruelty.

## Visual identity: "Lagos Light"
- **Characters:** flat colour, real skin tones, navy-ink outlines and a signature-colour rim light. Every character is defined once in `src/characters/registry.ts`. Lip-sync is phoneme-based (`src/characters/visemes.ts`).
- **Worlds:**
  - five parallax depth layers
  - time-of-day skies (dawn pink, noon blue, golden hour, sunset, storm) with painted clouds
  - colourful facades with real Lagos signage humour ("NO CONDITION IS PERMANENT")
  - a colour grade per scene, with film grain and a vignette over everything
- **Hologram style:** gold `#F6D58C` line art on deep navy.
- **Thumbnail:** one impossible image plus two words ("NO GRAVITY").
