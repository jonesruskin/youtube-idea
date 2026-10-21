# 04 · Characters: design sheets

> **Consistency rule:** every character is defined once in `src/characters/registry.ts` (proportions, skin, hair, outfit, signature color) and drawn by one rig (`src/characters/Figure.tsx`). Never redraw a character by hand inside a scene; add a pose or expression to the rig instead. To check a model sheet, render `CharacterSheet`:
> `npx remotion still src/index.ts CharacterSheet out/sheet.png`

**How distinct silhouettes are built:** every heir differs on at least three of these:
- **height** (0.84–1.1)
- **build** (0.86–1.08)
- **head size** (bigger reads younger)
- **hair shape** (afro / gele / slick / bob / braids…)
- **outfit cut** (jacket / wrapper / suit / scrubs…)
- **signature color**

You should be able to tell any two heirs apart in pure black silhouette.

**Expressions available:** neutral, happy, warm, ecstatic, nervous, curious, confused, alarmed, determined, serious, smug, sleep, surprised, sad.

**Poses available:** stand, relaxed, armsUp, wave, point, pointUp, handsOnHead, shrug, hold, crossArms, throw, reach, talk, hipHand, pilot, pilotJoy, pilotPoint, sitHug, lie, plus a procedural walk cycle.

## The Twelve Heirs (File 01: THE WILL)

| # | Heir | Body and silhouette | Signature | Inside | Unseen kindness (cold open) | Inheritance (the "I want that") | Small clue (for Item 13) |
|---|---|---|---|---|---|---|---|
| 1 | **Jonah Okafor**, 17, Lagos | Short, skinny, very big round afro, patched orange mechanic jacket | Orange `#FF9A3C` | Brilliant fixer who has never left his city; jokes to hide feeling stuck; can sleep anywhere | Fixes a widow's dead radio at 2 AM and refuses payment | **The Ship**: car-sized, invisible to radar, Moon in 40 minutes | A tiny second seat |
| 2 | **Margaret "Mags" Whitfield**, 71, Yorkshire | Short, round, grey curls, cardigan, handbag always | Plum | Sharp-tongued retired dinner lady; clips coupons; secretly soft | Anonymously pays off the school's lunch debts every month | **The Asteroid**: 200 km of metal, "$10 quintillion" | A carved playroom inside, with height marks on the wall |
| 3 | **Arjun Mehta**, 12, Jaipur | Chubby, round glasses, oversized cricket jersey | Saffron | Bullied, gentle, loves animals more than people | Shares his lunch every day with the stray dog the street throws stones at | **Biscuit**: a star-whale pup that eats metal and grows into a space-flying giant | Biscuit keeps searching for someone and hums a tune |
| 4 | **Kenji Arakawa**, 34, Tokyo | Very tall, very thin, loose tie, permanent dark circles | Teal | Burned-out salaryman who has forgotten what he likes | Stays late every night to share tea with a lonely night guard | **Haven**: his capsule closet opens onto an empty paradise planet with two suns | A small bedroom with stars painted on the ceiling |
| 5 | **Hamid Karimi**, 58, Istanbul | Big, barrel-chested, bushy mustache, flat cap | Olive | Widowed taxi driver who talks to his cat | Drives a crying stranger across the city at 3 AM and refuses the fare | **The Translator**: understand and speak every language: animals, machines, the Vey | A Vey word with no human equivalent: "the-one-sent-ahead" |
| 6 | **Sofia Ruiz**, 29, Buenos Aires | Athletic, high ponytail, scrubs, running shoes | Red | ER nurse haunted by the one patient she couldn't save | Stays past her shift holding the hand of a dying stranger with no family | **The Healer**: a silver drop that heals anything, once a day | Its default calibration is for a small, non-human body |
| 7 | **Chloé Dubois**, 24, Marseille | Freckles, copper bob, paint-stained overalls | Coral | People-pleaser artist who can't say no | Paints over hateful graffiti on a neighbor's shop before dawn | **The Double**: an android twin, so you can live two lives at once | A second, much smaller face template stored inside |
| 8 | **Tyrell Jackson**, 31, Detroit | Huge, full beard, work vest, beanie | Amber | Laid-off auto worker, devoted uncle, gentle giant | Shovels every elderly neighbor's driveway before sunrise | **The Star Core**: a fist-sized sun with free energy forever | Its lowest setting is labeled "nursery warmth" |
| 9 | **Sven Lindqvist**, 66, Kiruna | Lanky, long white beard, chunky wool sweater | Ice-blue | Grumpy lifelong alien-hunter everyone laughed at | Has secretly answered every letter a child sent him, for 40 years | **The Window**: a pane that shows any place in the universe, live | Its default view is a child's bedroom on a Vey world |
| 10 | **Mei Chen**, 19, Chengdu | Wheelchair user, sharp bangs, climbing gloves | Sky-blue | Stubborn dreamer told "no" all her life | Coaches a terrified kid up their first climbing wall | **The Suit**: walk on the Moon, dive the Mariana Trench, climb Everest | A child-size suit folded inside it |
| 11 | **Isabela Costa**, 40, Pará | Tall, strong, wide sunhat, rolled sleeves | Leaf-green | Farmer fighting drought, proud, funny | Secretly shares her well with the rival farm that sued her | **The Garden**: seeds that grow food, forests, even houses in minutes | A fruit labeled "her favourite" |
| 12 | **Pip Moreau**, 8, Québec | Tiny, gap tooth, braids, giant yellow raincoat, flashlight | Sunflower | Chatterbox nobody listens to | Flashes "goodnight" every night to the old woman across the street who lives alone | **The Music Box**: plays one song. "The most useless inheritance in the universe" | The song is a Vey lullaby |

### The rules for each inheritance (3 each, written to create loopholes)
1. **Ship:** answers to you alone · never carries a weapon · home before sunrise (*"home" = "the place where you sleep"*).
2. **Asteroid:** only 1 kg may come down per day · it may never be sold whole · it may never come closer than the Moon.
3. **Biscuit:** never let it go hungry · never let it be caged · let it go when it asks.
4. **Haven:** only those you trust may pass · never plant a flag · be home by second sunset.
5. **Translator:** never lie in translation · never repeat what was said in confidence · never translate for a weapon.
6. **Healer:** one person per day · never for money · never on yourself.
7. **Double:** it must never be told it's a copy · never in two places on purpose · it chooses its own home.
8. **Star Core:** never sell the light · never let it go dark · never hold it in anger.
9. **Window:** never look at the same place twice · never show it to a crowd · close it before you sleep.
10. **Suit:** always return it folded · never refuse a rescue · never wear it to hide.
11. **Garden:** never plant in anger · always leave one fruit · never grow a wall.
12. **Music Box:** wind it only once · never sell it · play it only for someone who cannot sleep.

## Recurring cast

| Character | Design | Inside | Function |
|---|---|---|---|
| **The Executor** | Pearl bipyramid prism, gold equator band, two orbiting gold rings, warm glow that pulses when it speaks | Literal, precise, unfailingly polite, quietly fond of humans | Narrator and lawyer. The audience's guide and the will's enforcer. |
| **Desmond Kade** | Tall, silver slicked hair, charcoal suit, oxblood tie | Never raises his voice. Believes contact must be *owned*. | The contester; turns in Ep12. |
| **Priya** | Black bun, square glasses, pale lilac blouse | Deadpan, competent, conscience of Kade's team | Comic foil; quietly helps the heirs from Ep10. |
| **Grandma Ada Okafor** | Teal gele headwrap and wrapper with gold stripes, round glasses, gold earrings | Commanding, proud, secretly romantic | Jonah's anchor. |
| **Mrs. Bello** | Purple headwrap and wrapper | Gentle widow | The first unseen kindness; returns in Ep12's montage. |
