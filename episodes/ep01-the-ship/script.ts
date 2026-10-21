import type {Episode} from '../../src/engine/schema';

/**
 * THE BLINK FILES — File 01: THE WILL — Episode 1: "The Ship"
 * Section signatures: Clause → Blink → Delivery → Rules → Joyride → Loophole → Ledger.
 * Every line is spoken; on-screen text is limited to footnotes, rules, place/time stamps and the Ledger.
 */
export const ep01: Episode = {
  id: 'ep01',
  file: 'FILE 01 · THE WILL',
  title: 'The Ship',
  youtubeTitle: 'What If Aliens Left You Their Spaceship?',
  thumbnailText: 'MOON BY 4AM',
  commentPrompt: 'What would YOU do on your first night with the ship?',
  fps: 30,
  shots: [
    // ── FLASH-FORWARD ────────────────────────────────────────────────
    {
      id: 'ff-clouds',
      scene: 'cockpit',
      props: {view: 'clouds', expression: 'ecstatic', shake: 0.6},
      chapter: 'The ship',
      mood: 'triumph',
      sfx: 'whoosh',
      lead: 0.2,
      lines: [
        {speaker: 'JONAH', text: 'Okay. Okay okay okay. OKAY!'},
        {speaker: 'JONAH', text: "Moon. Let's go to the Moon."},
      ],
      tail: 0.6,
    },
    {
      id: 'ff-card',
      scene: 'card',
      props: {text: 'TWO HOURS EARLIER', sub: 'Lagos, Nigeria · 2:07 AM'},
      mood: 'warm',
      sfx: 'impact',
      min: 2.4,
    },

    // ── THE CLAUSE ───────────────────────────────────────────────────
    {
      id: 'stall-wide',
      scene: 'lagosStall',
      props: {beat: 'wide'},
      chapter: 'The clause',
      lines: [
        {speaker: 'EXECUTOR', text: 'Two in the morning. A phone repair stall the size of a wardrobe.'},
        {speaker: 'EXECUTOR', text: 'Jonah Okafor, seventeen. Could fix anything with a wire in it. Could sleep through anything, including Lagos traffic.'},
      ],
    },
    {
      id: 'stall-radio',
      scene: 'lagosStall',
      props: {beat: 'radio'},
      lines: [
        {speaker: 'MRS_BELLO', text: "It was my husband's. It hasn't spoken since he passed."},
        {speaker: 'JONAH', text: 'Give me ten minutes, Ma.'},
      ],
    },
    {
      id: 'stall-fixed',
      scene: 'lagosStall',
      props: {beat: 'fixed'},
      lines: [
        {speaker: 'EXECUTOR', text: "He fixed it in nine. She held out her coins. He wouldn't take them."},
        {speaker: 'EXECUTOR', text: 'Nobody saw.', pause: 0.6},
        {speaker: 'EXECUTOR', text: 'Nobody, that is... except me.'},
      ],
      mood: 'mystery',
    },
    {
      id: 'clause-1',
      scene: 'willDoc',
      props: {mode: 'clause', item: 'ITEM ONE', body: 'To the one who fixes what everyone else throws away —', reveal: 'we leave our ship.'},
      sfx: 'chime',
      lines: [
        {speaker: 'EXECUTOR', text: 'Item One.', pause: 0.3},
        {speaker: 'EXECUTOR', text: 'To the one who fixes what everyone else throws away...', pause: 0.4},
        {speaker: 'EXECUTOR', text: 'we leave our ship.'},
      ],
      tail: 0.8,
    },
    {
      id: 'title',
      scene: 'titleCard',
      props: {},
      sfx: 'impact',
      mood: 'wonder',
      min: 4.2,
    },

    // ── THE BLINK ────────────────────────────────────────────────────
    {
      id: 'orion',
      scene: 'sky',
      props: {mode: 'orion'},
      chapter: 'The night a star went out',
      lines: [
        {speaker: 'EXECUTOR', text: 'Find Orion. Three stars for a belt. And on his shoulder, a red one.'},
        {speaker: 'EXECUTOR', text: 'Betelgeuse.'},
      ],
      footnote: {
        n: 1,
        text: 'Betelgeuse is a red supergiant roughly 550 light-years away. Put it where our Sun is and it would swallow Mars.',
        source: 'NASA / ESA; radius ≈ 760 solar radii ≈ 3.5 AU (Mars orbits at 1.5 AU)',
      },
      tail: 1.2,
    },
    {
      id: 'blink',
      scene: 'sky',
      props: {mode: 'blink'},
      sfx: 'powercut',
      mood: 'mystery',
      lines: [
        {speaker: 'EXECUTOR', text: 'Six days ago, it went out.', pause: 0.8},
        {speaker: 'EXECUTOR', text: 'It did not explode. A star that size should die in a blaze bright enough to see at noon.'},
        {speaker: 'EXECUTOR', text: 'It just... went dark. Like someone flipped a switch.'},
      ],
    },
    {
      id: 'world-looks',
      scene: 'worldMontage',
      props: {},
      lines: [
        {speaker: 'EXECUTOR', text: 'Orion can be seen from every country on Earth. So every country noticed.'},
      ],
      footnote: {
        n: 2,
        text: 'This is not as far-fetched as it sounds: in 2019–20, Betelgeuse really did fade to about a third of its normal brightness. Astronomers call it the Great Dimming.',
        source: 'Montargès et al., Nature (2021)',
      },
      tail: 1.5,
    },
    {
      id: 'broadcast',
      scene: 'broadcast',
      props: {},
      sfx: 'riser',
      lines: [
        {speaker: 'EXECUTOR', text: 'Three days later, every radio on Earth picked up the same broadcast. Every frequency. Every language. At once.'},
      ],
    },
    {
      id: 'will-read',
      scene: 'willDoc',
      props: {mode: 'broadcast'},
      mood: 'wonder',
      lines: [
        {speaker: 'EXECUTOR', text: 'This is the last will and testament of the Vey.', pause: 0.4},
        {speaker: 'EXECUTOR', text: 'We are gone.', pause: 0.6},
        {speaker: 'EXECUTOR', text: 'We leave everything we owned... to twelve of you.'},
      ],
      tail: 1,
    },
    {
      id: 'frenzy',
      scene: 'frenzy',
      props: {},
      mood: 'comic',
      lines: [
        {speaker: 'EXECUTOR', text: 'Twelve heirs. Eight billion candidates.'},
        {speaker: 'EXECUTOR', text: 'Nobody slept. Several million people checked under their beds. A man in Ohio dug up his entire garden.'},
      ],
    },
    {
      id: 'room-fixing',
      scene: 'jonahRoom',
      props: {beat: 'fixing'},
      lines: [
        {speaker: 'EXECUTOR', text: 'Jonah did what Jonah always did. He went home and fixed things.'},
      ],
      tail: 0.6,
    },

    // ── THE DELIVERY ─────────────────────────────────────────────────
    {
      id: 'room-powercut',
      scene: 'jonahRoom',
      props: {beat: 'powercut'},
      chapter: 'The delivery',
      sfx: 'powercut',
      mood: 'mystery',
      lead: 1.2,
      lines: [
        {speaker: 'EXECUTOR', text: 'Jonah Okafor?'},
        {speaker: 'JONAH', text: "...Who's there?"},
      ],
    },
    {
      id: 'room-executor',
      scene: 'jonahRoom',
      props: {beat: 'executor'},
      sfx: 'chime',
      lines: [
        {speaker: 'EXECUTOR', text: 'I am the Executor of the estate of the Vey.'},
        {speaker: 'EXECUTOR', text: 'Congratulations. You are Heir Number One.'},
      ],
    },
    {
      id: 'room-flipflop',
      scene: 'jonahRoom',
      props: {beat: 'flipflop'},
      mood: 'comic',
      lines: [
        {speaker: 'EXECUTOR', text: 'He threw a flip-flop at me.', pause: 0.3},
        {speaker: 'EXECUTOR', text: 'Statistically, that is the most common human response.'},
      ],
    },
    {
      id: 'alley-step',
      scene: 'alley',
      props: {beat: 'before'},
      lines: [{speaker: 'EXECUTOR', text: 'Please. Step outside.'}],
      tail: 0.8,
    },
    {
      id: 'alley-decloak',
      scene: 'alley',
      props: {beat: 'decloak'},
      sfx: 'decloak',
      mood: 'wonder',
      lead: 1.4,
      lines: [
        {speaker: 'EXECUTOR', text: 'Five metres of hull. Nothing on Earth can see it, unless it wants to be seen.'},
      ],
      tail: 1,
    },
    {
      id: 'alley-mine',
      scene: 'alley',
      props: {beat: 'mine'},
      lines: [
        {speaker: 'JONAH', text: 'Is that... mine?'},
        {speaker: 'EXECUTOR', text: 'Legally? Entirely.'},
      ],
    },
    {
      id: 'alley-goat',
      scene: 'alley',
      props: {beat: 'goat'},
      mood: 'comic',
      lines: [{speaker: 'EXECUTOR', text: "The neighbour's goat was not impressed."}],
      tail: 1,
    },

    // ── THE RULES ────────────────────────────────────────────────────
    {
      id: 'rules-intro',
      scene: 'willDoc',
      props: {mode: 'rules', show: 0},
      chapter: 'The rules',
      mood: 'mystery',
      sfx: 'chime',
      lines: [{speaker: 'EXECUTOR', text: 'Every inheritance comes with rules. The Vey were very fond of rules.'}],
    },
    {
      id: 'rules-list',
      scene: 'willDoc',
      props: {mode: 'rules', show: 3},
      lines: [
        {speaker: 'EXECUTOR', text: 'Rule One. The ship answers to you, and only you.'},
        {speaker: 'EXECUTOR', text: 'Rule Two. It will never carry a weapon.'},
        {speaker: 'EXECUTOR', text: 'Rule Three. It must be home before sunrise.'},
      ],
      tail: 0.6,
    },
    {
      id: 'rules-home',
      scene: 'willDoc',
      props: {mode: 'rules', show: 3, highlight: 'home'},
      lines: [
        {speaker: 'EXECUTOR', text: 'A note on translation. The Vey word for "home" means, literally, "the place where you sleep." The Vey were not sentimental.'},
      ],
    },
    {
      id: 'alley-rules-q',
      scene: 'alley',
      props: {beat: 'talk'},
      lines: [
        {speaker: 'JONAH', text: "And if I'm not in it when the sun comes up?"},
        {speaker: 'EXECUTOR', text: 'Then you will be wherever you are. For a while.'},
        {speaker: 'EXECUTOR', text: 'Break any rule, and the inheritance is void.'},
      ],
    },

    // ── THE JOYRIDE ──────────────────────────────────────────────────
    {
      id: 'cockpit-ask',
      scene: 'cockpit',
      props: {view: 'alley', expression: 'nervous'},
      chapter: 'The first night',
      mood: 'wonder',
      lines: [
        {speaker: 'JONAH', text: 'How do I drive it?'},
        {speaker: 'EXECUTOR', text: "You don't drive it. You ask it."},
        {speaker: 'JONAH', text: '...Up?', pause: 0.4},
      ],
    },
    {
      id: 'launch',
      scene: 'launch',
      props: {},
      sfx: 'whoosh',
      mood: 'triumph',
      lines: [{speaker: 'EXECUTOR', text: 'Up.'}],
      tail: 3.2,
    },
    {
      id: 'karman',
      scene: 'atmosphere',
      props: {},
      lines: [
        {speaker: 'EXECUTOR', text: 'At one hundred kilometres, the sky stops being blue. Officially, that is where space begins.'},
      ],
      footnote: {
        n: 3,
        text: 'The Kármán line, 100 km above sea level, is the most widely used boundary of space. Lagos to space: about the distance from Lagos to Ibadan — straight up.',
        source: 'Fédération Aéronautique Internationale',
      },
      tail: 1,
    },
    {
      id: 'globe-africa',
      scene: 'globe',
      props: {mode: 'africa'},
      lines: [
        {speaker: 'JONAH', text: "That's... that's Africa. That's ALL of Africa."},
        {speaker: 'JONAH', text: 'Grandma is down there. Mrs. Bello is down there. Everybody is down there.'},
      ],
      tail: 1,
    },
    {
      id: 'globe-clock',
      scene: 'globe',
      props: {mode: 'clock'},
      mood: 'tension',
      lines: [
        {speaker: 'EXECUTOR', text: 'Sunrise in Lagos was at 6:42. It was 2:51.'},
        {speaker: 'EXECUTOR', text: 'He had less than four hours, and the whole planet.'},
      ],
    },
    {
      id: 'desert',
      scene: 'desert',
      props: {},
      mood: 'wonder',
      lines: [
        {speaker: 'EXECUTOR', text: 'First, the Sahara. No city lights for a thousand kilometres.'},
        {speaker: 'EXECUTOR', text: 'He lay on a dune where the stars were so thick the sky looked dusty.'},
      ],
      tail: 0.8,
    },
    {
      id: 'desert-dark',
      scene: 'desert',
      props: {beat: 'close'},
      lines: [
        {speaker: 'JONAH', text: 'Executor. Which one was yours?', pause: 0.8},
        {speaker: 'EXECUTOR', text: '...The dark one.'},
      ],
      tail: 1.4,
    },
    {
      id: 'globe-west',
      scene: 'globe',
      props: {mode: 'west'},
      mood: 'triumph',
      lines: [
        {speaker: 'EXECUTOR', text: 'Then he did something nobody had told him he could do. He chased the night.'},
        {speaker: 'EXECUTOR', text: 'The Earth turns east at about sixteen hundred and seventy kilometres an hour. Fly west faster than that, and the sun never catches you.'},
      ],
    },
    {
      id: 'globe-west2',
      scene: 'globe',
      props: {mode: 'west2'},
      lines: [
        {speaker: 'EXECUTOR', text: 'It did not buy him more time at home. It bought him the whole night everywhere else.'},
      ],
      footnote: {
        n: 4,
        text: "At the equator, Earth's surface spins east at about 1,670 km/h. Westbound Concorde flights sometimes outran it — passengers watched the sun rise in the west.",
        source: 'Earth equatorial circumference 40,075 km / 23.93 h',
      },
    },
    {
      id: 'ny',
      scene: 'cityNight',
      props: {city: 'newyork'},
      lines: [{speaker: 'EXECUTOR', text: 'Over New York, it was still yesterday.'}],
      tail: 1.6,
    },
    {
      id: 'aurora',
      scene: 'aurora',
      props: {},
      lines: [
        {speaker: 'JONAH', text: "They're under me. The northern lights are UNDER me!"},
        {speaker: 'EXECUTOR', text: 'Over northern Canada, the aurora is not a curtain in the sky. From above, it is a river.'},
      ],
      tail: 1.5,
    },
    {
      id: 'moon-ask',
      scene: 'cockpit',
      props: {view: 'space', expression: 'curious'},
      lines: [
        {speaker: 'JONAH', text: 'How far is the Moon?'},
        {speaker: 'EXECUTOR', text: 'Three hundred and eighty-four thousand kilometres.'},
        {speaker: 'JONAH', text: 'How long?'},
        {speaker: 'EXECUTOR', text: 'For this ship? Forty minutes. Thirty-nine, if you stop asking.'},
      ],
      footnote: {
        n: 5,
        text: 'Average Earth–Moon distance: 384,400 km. Apollo 11 needed about three days to get there.',
        source: 'NASA',
      },
    },
    {
      id: 'moon-approach',
      scene: 'moonApproach',
      props: {},
      mood: 'wonder',
      sfx: 'whoosh',
      lines: [
        {speaker: 'EXECUTOR', text: 'Jonah Okafor, seventeen, of Lagos. Who had never once left Lagos.'},
        {speaker: 'EXECUTOR', text: 'Landed on the Moon.'},
      ],
      tail: 1.6,
    },
    {
      id: 'moon-surface',
      scene: 'moon',
      props: {beat: 'bubble'},
      mood: 'comic',
      lines: [
        {speaker: 'EXECUTOR', text: 'The ship wrapped him in a bubble of air. Do not ask me how. I am not permitted to explain physics you have not discovered yet.'},
      ],
      tail: 0.6,
    },
    {
      id: 'moon-earth',
      scene: 'moon',
      props: {beat: 'earth'},
      mood: 'wonder',
      lines: [
        {speaker: 'EXECUTOR', text: 'From the Moon, Earth does not rise or set. It just hangs there.'},
        {speaker: 'EXECUTOR', text: 'Every person he had ever met — smaller than his thumb.'},
      ],
      footnote: {
        n: 6,
        text: "The Moon always keeps the same face toward Earth, so from the near side, Earth stays almost fixed in the sky.",
        source: 'Tidal locking — NASA',
      },
      tail: 1.2,
    },
    {
      id: 'moon-footprints',
      scene: 'moon',
      props: {beat: 'footprints'},
      lines: [
        {speaker: 'EXECUTOR', text: 'He found the Apollo 11 landing site. He was very, very careful not to step on the footprints.'},
      ],
      footnote: {
        n: 7,
        text: 'With no wind or rain, the Apollo footprints could survive for millions of years.',
        source: 'NASA',
      },
      tail: 1,
    },
    {
      id: 'seat',
      scene: 'cockpit',
      props: {view: 'earthBehind', expression: 'confused', seat: true},
      mood: 'mystery',
      lines: [
        {speaker: 'EXECUTOR', text: 'And on the way home, the ship did something it had never done before.'},
        {speaker: 'EXECUTOR', text: 'A second seat unfolded from the wall. Small. Far too small for any grown human.'},
      ],
      tail: 0.8,
    },
    {
      id: 'seat-q',
      scene: 'cockpit',
      props: {view: 'earthBehind', expression: 'confused', seat: true, closeSeat: true},
      lines: [
        {speaker: 'JONAH', text: "Executor... who's this one for?", pause: 1.2},
        {speaker: 'EXECUTOR', text: 'I did not answer. I am not allowed to. Not yet.'},
      ],
      tail: 1,
      midroll: true,
    },

    // ── THE LOOPHOLE ─────────────────────────────────────────────────
    {
      id: 'news',
      scene: 'news',
      props: {},
      chapter: 'The contest',
      mood: 'comic',
      sfx: 'stamp',
      lines: [
        {speaker: 'EXECUTOR', text: 'By the third day, everyone knew. Lagos traffic is famous. It got worse.'},
        {speaker: 'ANCHOR', text: '...the so-called Heir Number One, a seventeen-year-old phone repairer from Lagos, has not been seen since—'},
      ],
    },
    {
      id: 'grandma-window',
      scene: 'grandmaHome',
      props: {beat: 'window'},
      lines: [
        {speaker: 'GRANDMA', text: 'Jonah. There is a man outside in a suit that costs more than this street.'},
      ],
      tail: 0.6,
    },
    {
      id: 'kade-intro',
      scene: 'kadeIntro',
      props: {},
      mood: 'tension',
      lines: [
        {speaker: 'EXECUTOR', text: 'Desmond Kade. The richest man on Earth.'},
        {speaker: 'EXECUTOR', text: 'Until about a week ago, he had assumed that if anyone was going to inherit the universe, it would be him.'},
      ],
    },
    {
      id: 'kade-alley',
      scene: 'alley',
      props: {beat: 'kade'},
      lines: [
        {speaker: 'KADE', text: "I'm not here to take your ship, Jonah. I'm here to congratulate you."},
        {speaker: 'KADE', text: "And to let you know I've filed a contest."},
        {speaker: 'JONAH', text: 'A what?'},
      ],
    },
    {
      id: 'contest-rule',
      scene: 'willDoc',
      props: {mode: 'contest'},
      sfx: 'stamp',
      lines: [
        {speaker: 'EXECUTOR', text: 'Under the will, anyone may contest an heir. If an heir breaks a rule, the inheritance passes to the contester.'},
      ],
    },
    {
      id: 'kade-smile',
      scene: 'alley',
      props: {beat: 'kadeClose'},
      lines: [
        {speaker: 'KADE', text: 'Twelve heirs, Jonah. I only need one of you to slip.'},
      ],
      tail: 1,
    },
    {
      id: 'mayday',
      scene: 'cockpit',
      props: {view: 'nightSea', expression: 'alarmed', alert: true},
      sfx: 'riser',
      lines: [
        {speaker: 'CAPTAIN', text: 'Mayday, mayday! Fishing boat Ayoola, taking water — eight crew — we cannot hold her!'},
      ],
      tail: 0.4,
    },
    {
      id: 'mayday-clock',
      scene: 'globe',
      props: {mode: 'mayday'},
      mood: 'tension',
      lines: [
        {speaker: 'EXECUTOR', text: 'At 5:40 that morning, a distress call came in. A boat sinking in a storm, four hundred kilometres west.'},
        {speaker: 'EXECUTOR', text: 'Sunrise in sixty-two minutes.'},
      ],
    },
    {
      id: 'decide',
      scene: 'cockpit',
      props: {view: 'nightSea', expression: 'determined', alert: true},
      lines: [
        {speaker: 'JONAH', text: 'How fast can we get there?'},
        {speaker: 'EXECUTOR', text: 'Six minutes. And Rule Three—'},
        {speaker: 'JONAH', text: 'I know Rule Three.'},
      ],
    },
    {
      id: 'storm',
      scene: 'storm',
      props: {beat: 'arrive'},
      sfx: 'thunder',
      lines: [
        {speaker: 'EXECUTOR', text: 'The ship could not carry eight men.'},
        {speaker: 'EXECUTOR', text: 'So it carried the boat.'},
      ],
      tail: 2.6,
    },
    {
      id: 'storm-lift',
      scene: 'storm',
      props: {beat: 'lift'},
      mood: 'triumph',
      lines: [
        {speaker: 'EXECUTOR', text: 'Forty tonnes of wood, nets and terrified fishermen, lifted out of the Atlantic like a toy.'},
      ],
      footnote: {
        n: 8,
        text: 'A 20-metre wooden fishing boat with gear can weigh 30–50 tonnes. A car-sized ship lifting it would need around 400 kilonewtons of thrust — more than a jumbo jet engine.',
        source: 'Estimate: 40,000 kg × 9.81 m/s² ≈ 392 kN; a Boeing 747-400 engine (PW4056) makes ≈ 252 kN',
      },
      tail: 1,
    },
    {
      id: 'beach-dawn',
      scene: 'beach',
      props: {beat: 'landed'},
      mood: 'tension',
      lines: [
        {speaker: 'EXECUTOR', text: 'By the time the crew stood on dry sand, it was 6:31.'},
        {speaker: 'EXECUTOR', text: 'Lifting the boat had drained the ship. It could still fly. It could not fly fast.'},
      ],
      tail: 0.4,
    },
    {
      id: 'beach-clock',
      scene: 'globe',
      props: {mode: 'sunrise'},
      lines: [
        {speaker: 'EXECUTOR', text: 'Home was four hundred kilometres away. The sun would rise over his street in eleven minutes.'},
        {speaker: 'EXECUTOR', text: 'He was not going to make it.'},
      ],
      tail: 1.2,
      midroll: true,
    },
    {
      id: 'kade-watch',
      scene: 'kadeOffice',
      props: {},
      lines: [
        {speaker: 'ASSISTANT', text: "Sir. He won't make it home."},
        {speaker: 'KADE', text: 'No. He won\'t.'},
      ],
      tail: 0.8,
    },
    {
      id: 'think',
      scene: 'beach',
      props: {beat: 'think'},
      lines: [
        {speaker: 'JONAH', text: 'Executor. Say the rule again. Exactly.'},
        {speaker: 'EXECUTOR', text: 'The ship must be home before sunrise.'},
        {speaker: 'JONAH', text: 'And "home" means...'},
        {speaker: 'EXECUTOR', text: '...The place where you sleep.', pause: 0.8},
      ],
    },
    {
      id: 'sleep',
      scene: 'beach',
      props: {beat: 'sleep'},
      mood: 'warm',
      lines: [
        {speaker: 'EXECUTOR', text: 'Falling asleep on command is not a skill most humans have.'},
        {speaker: 'EXECUTOR', text: 'Jonah Okafor, who had spent seventeen years sleeping through Lagos traffic, had it.'},
      ],
      tail: 0.4,
    },
    {
      id: 'sleep-home',
      scene: 'beach',
      props: {beat: 'sunrise'},
      lines: [
        {speaker: 'FISHERMAN', text: '...Is he sleeping? Now?'},
        {speaker: 'EXECUTOR', text: 'At 6:41, on a beach in Ghana, the place where Jonah slept became home. One minute to spare.'},
      ],
      tail: 1.4,
    },
    {
      id: 'kade-legal',
      scene: 'kadeOffice',
      props: {beat: 'legal'},
      mood: 'comic',
      lines: [
        {speaker: 'ASSISTANT', text: "Sir... is that allowed?"},
        {speaker: 'KADE', text: "Apparently, it's legal.", pause: 0.6},
        {speaker: 'KADE', text: "Eleven more. Let's see how clever they are."},
      ],
      tail: 0.8,
    },

    // ── THE LEDGER ───────────────────────────────────────────────────
    {
      id: 'grandma-flight',
      scene: 'cityFlight',
      props: {},
      chapter: 'The ledger',
      mood: 'warm',
      lines: [
        {speaker: 'EXECUTOR', text: 'The next night, Jonah took a passenger.'},
        {speaker: 'GRANDMA', text: 'Eighty-one years I have lived in this city. Nobody told me it was this... shiny.'},
        {speaker: 'JONAH', text: 'Hold on, Grandma.'},
        {speaker: 'GRANDMA', text: 'I am holding! I am holding!'},
      ],
      tail: 1.6,
    },
    {
      id: 'seat-again',
      scene: 'cockpit',
      props: {view: 'lagosBelow', expression: 'serious', seat: true, grandma: true},
      mood: 'mystery',
      lines: [
        {speaker: 'JONAH', text: 'Executor. The small seat. Who is it for?'},
        {speaker: 'EXECUTOR', text: 'Item Thirteen is sealed until all twelve heirs are together.'},
        {speaker: 'JONAH', text: "That's not an answer."},
        {speaker: 'EXECUTOR', text: "No. It's a rule."},
      ],
    },
    {
      id: 'radio-window',
      scene: 'radioWindow',
      props: {},
      lines: [
        {speaker: 'EXECUTOR', text: 'Somewhere across the city, an old radio was playing. It has not missed a night since.'},
      ],
      tail: 1.6,
    },
    {
      id: 'ledger',
      scene: 'ledger',
      props: {found: 1},
      sfx: 'stamp',
      lines: [
        {speaker: 'EXECUTOR', text: 'Heirs found: one of twelve. Item Thirteen: sealed.'},
      ],
      tail: 0.8,
    },
    {
      id: 'next-clause',
      scene: 'willDoc',
      props: {mode: 'clause', item: 'ITEM TWO', body: 'To the one who never wasted a penny —', reveal: 'we leave our asteroid.'},
      sfx: 'chime',
      lines: [
        {speaker: 'EXECUTOR', text: 'Item Two.', pause: 0.3},
        {speaker: 'EXECUTOR', text: 'To the one who never wasted a penny...', pause: 0.3},
        {speaker: 'EXECUTOR', text: 'we leave our asteroid.'},
      ],
      tail: 0.6,
    },
    {
      id: 'still-reading',
      scene: 'endCard',
      props: {},
      mood: 'mystery',
      lines: [
        {speaker: 'EXECUTOR', text: "And if you're wondering whether it could be you...", pause: 0.6},
        {speaker: 'EXECUTOR', text: "I'm still reading."},
      ],
      tail: 7,
    },
  ],
};
