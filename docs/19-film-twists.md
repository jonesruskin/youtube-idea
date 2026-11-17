# 19 · Film-twist catalogue (one device per File, drawn at random)

CEO, v5.5: "using the same Maharaja film styled template for consecutive episodes won't be good. The audience will get
tired of it and will instantly know… insert random film twists into the story for each video."

Every File carries **one film-twist device** on top of its ordinary twist ladder (S15). The device is **drawn at random**
by `scripts/pick-twist.ts <id>` from the catalogue below, excluding every device used by the three Files before it (the
registry at the bottom). The draw is seeded by the File's id, so it is reproducible and nobody picks a favourite. The
treatment then adapts the device to the File's own story (same family-safe tone, same real science). The story contract
records it (`story.filmTwist`), and lint's film-twist gate checks it: the device is in the catalogue and not used in the
last three Files, the reveal shot is a twist in the second half, and at least three plants (fair clues) come before it.

A device may be redrawn only for a written reason (it cannot be told without violence or horror unsuited to the
channel, or it contradicts the File's real science). The reason goes in the registry.

| id | from the film | the device, adapted to a Blink File |
|---|---|---|
| `maharaja` | Maharaja (2024) | Two timelines intercut as if they were happening together; late on, they turn out to be decades apart, and someone in the hidden one is someone we know. |
| `sixth-sense` | The Sixth Sense (1999) | Someone we took to be with the family all along was never really there; replaying their scenes, nobody ever answered them. |
| `usual-suspects` | The Usual Suspects (1995) | The storyteller bent the story: details of their account came from things in the room around them. |
| `planet-apes` | Planet of the Apes (1968) | The strange place they have been living in was somewhere familiar all along. |
| `the-others` | The Others (2001) | A perspective flip: the strangers the family feared were the ones trying to help them (or the family were the strangers). |
| `prestige` | The Prestige (2006) | Two people we thought were one (or one we thought were two). |
| `village` | The Village (2004) | The time or setting we assumed is not the real one. |
| `arrival` | Arrival (2016) | What we took for memories of the past are glimpses of the future. |
| `interstellar` | Interstellar (2014) | The mysterious helper or signal was one of our own characters, all along. |
| `drishyam` | Drishyam (2013) | The day we were shown was not the day it happened: dates were shifted to hide the truth. |
| `parasite` | Parasite (2019) | Someone has been living in the house, unseen, the whole time. |
| `memento` | Memento (2000) | The opening scene is the end; seen again, it means something else. |
| `rashomon` | Rashomon (1950) | The same moment retold through another person's eyes changes what it meant. |

## Registry (newest last)

| File | device | how it is used | redraws |
|---|---|---|---|
| sun01 | `maharaja` | the 1983 observatory thread intercut with the present; the young man is Mr. Ito ("THE SAME MAN") | — |
| moon02 | `village` | an unseen teller tells the story to children; the reveal: it is 2096, the teller is Wren at eighty, and the giant Moon is all they have known ("SEVENTY YEARS LATER") | — |
