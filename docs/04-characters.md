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

**Lip-sync:** every character with a `speaker` in the registry lip-syncs automatically whenever their line plays, using phoneme mouth shapes (closed M/B/P, F/V teeth, wide E, open A, round O/W) eased between letters. Once voiced, ElevenLabs' per-character timings drive it exactly.

**The power:** `palmGlow` (0–1) and `fist` (0 open … 1 closed) on any figure.

**Expressions available:** neutral, happy, warm, ecstatic, nervous, curious, confused, alarmed, determined, serious, smug, sleep, surprised, sad.

**Poses available:** stand, relaxed, armsUp, wave, point, pointUp, handsOnHead, shrug, hold, crossArms, throw, reach, talk, hipHand, pilot, pilotJoy, pilotPoint, sitHug, lie, plus a procedural walk cycle.

## The Twelve Heirs (File 01: THE GIFTS)

Looks and inner lives are unchanged. The gifts are now **powers**; see `03-channel-bible.md` for each one's catch.

| # | Heir | Body and silhouette | Signature | Inside | Unseen kindness (shown early, explained in Ep12) | Gift |
|---|---|---|---|---|---|---|
| 1 | **Jonah Okafor**, 17, Lagos | Short, skinny, very big round afro, patched orange mechanic jacket | Orange `#FF9A3C` | Brilliant fixer who dreams of leaving; jokes to hide feeling stuck | Fixes a widow's radio for free; keeps a 7-year-old's last toffee "for a very important day" | **Zero-G Touch** |
| 2 | **Mags Whitfield**, 71, Yorkshire | Short, round, grey curls, purple cardigan, handbag always | Plum `#C77DFF` | Sharp-tongued retired dinner lady, secretly soft | Anonymously pays off the school's lunch debts | **Moon Legs** |
| 3 | **Arjun Mehta**, 12, Jaipur | Chubby, round glasses, cricket jersey | Saffron | Bullied, gentle, loves animals | Feeds the stray dog the street throws stones at | **Black Hole Hand** |
| 4 | **Kenji Arakawa**, 34, Tokyo | Very tall, thin, loose tie | Teal | Burned-out salaryman | Shares tea every night with a lonely night guard | **Saturn's Rings** |
| 5 | **Hamid Karimi**, 58, Istanbul | Big, mustache, flat cap | Olive | Widowed taxi driver who talks to his cat | Drives a crying stranger home and refuses the fare | **Comet** |
| 6 | **Sofia Ruiz**, 29, Buenos Aires | Athletic, high ponytail, scrubs | Red | ER nurse haunted by one patient | Stays past her shift holding a dying stranger's hand | **Sunlight Hands** |
| 7 | **Chloé Dubois**, 24, Marseille | Freckles, copper bob, paint-stained overalls | Coral | People-pleaser artist | Paints over hateful graffiti on a neighbour's shop | **Gemini** |
| 8 | **Tyrell Jackson**, 31, Detroit | Huge, full beard, work vest | Amber | Laid-off auto worker, gentle giant | Shovels every elderly neighbour's driveway before dawn | **Pocket Sun** |
| 9 | **Sven Lindqvist**, 66, Kiruna | Lanky, long white beard, wool sweater | Ice-blue | Grumpy lifelong alien-hunter | Has answered every child's letter for 40 years | **Hubble Eyes** |
| 10 | **Mei Chen**, 19, Chengdu | Wheelchair user, sharp bangs, climbing gloves | Sky-blue | Stubborn dreamer told "no" all her life | Coaches a terrified kid up their first wall | **Orbit** |
| 11 | **Isabela Costa**, 40, Pará | Tall, strong, wide sunhat | Leaf-green | Farmer fighting drought | Secretly shares her well with the rival farm | **Terraform** |
| 12 | **Pip Moreau**, 8, Québec | Tiny, gap tooth, braids, giant yellow raincoat | Sunflower | Chatterbox nobody listens to | Flashes "goodnight" every night to a lonely neighbour | **Twinkle** |

### Episode 1 supporting cast (also in the registry)
| Character | Design | Role |
|---|---|---|
| **Kemi Bello**, 7 | Two puffs, yellow tee, coral leggings | Gives Jonah her last toffee; Jonah saves her in the climax and gives it back |
| **Tunde Bakare**, 17 | Backwards cap, square shades, white tee, red sneakers | Rich-kid rival with a gold bike; ends up helping in the rescue |
| **Iya Osun** | Orange headwrap, green wrapper | Orange seller ("My oranges! Who will pay?!") |
| **Customer** | Braids, red blouse | "Once." / "From where? An aeroplane?" |

## Recurring cast

| Character | Design | Inside | Function |
|---|---|---|---|
| **The Executor** | Pearl bipyramid prism, gold equator band, two orbiting gold rings, warm glow that pulses when it speaks | Literal, precise, unfailingly polite, quietly fond of humans | Narrator and mentor. Explains science by projecting gold holograms. |
| **Desmond Kade** | Tall, silver slicked hair, charcoal suit, oxblood tie | Never raises his voice. Makes offers people want. | Recruits the gifted; turns in Ep12. |
| **Priya** | Black bun, square glasses, pale lilac blouse | Deadpan, competent, conscience of Kade's team | Comic foil; quietly helps the heirs from Ep10. |
| **Grandma Ada Okafor** | Teal gele headwrap and wrapper with gold stripes, round glasses, gold earrings | Commanding, proud, secretly romantic | Jonah's anchor. |
| **Mrs. Bello** | Purple headwrap and wrapper | Gentle widow | The first unseen kindness; returns in Ep12's montage. |
