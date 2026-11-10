import type {Line, Shot, Episode} from '../../src/engine/schema';
import {line} from '../../src/engine/delivery';
import {autoSplit} from '../../src/engine/autosplit';

/**
 * THE BLINK FILES · File 002 — "The Moon Got Closer Every Night"
 *
 * Told by Wren, grown up: the two hundred days when she was ten and the Moon came down to a third of its distance.
 * Treatment (gate-checked): treatment.md. World model and numbers: world-model.md. One impossible thing (an
 * invisible grain-sized black hole caught between Earth and Moon); everything after it is ordinary physics.
 *
 * Saltmouth: Quay Street 1.6 m above mean sea level, Market Street 7.5 m, the chapel steps 33–40 m, Nana's white
 * line at 35 m. High tide by day: D1 1.7 m · D30 2.1 · D60 3.0 · D90 4.7 · D120 7.9 · D150 15 · D180 26.8 · D200 35.
 */
type G = Line['g'];
const L =
  (speaker: Line['speaker']) =>
  (text: string, pause?: number, g?: G): Line => line(speaker, text, pause, g);
const N = L('NARRATOR');
const W = L('WREN');
const NA = L('NANA');
const T = L('TESS');
const PE = L('PELL');
const MAN = L('MAN');
const AN = L('ANCHOR');
const SCI = L('SCIENTIST');

type Cam = [number, number, number, number, number?];
const hold = (z: number, x: number, y: number): Cam[] => [[0, z, x, y], [1, z * 1.04, x, y]];
const push = (z0: number, z1: number, x: number, y: number, x1 = x, y1 = y): Cam[] => [[0, z0, x, y, 0], [1, z1, x1, y1, 0]];
const move = (a: [number, number, number], b: [number, number, number]): Cam[] => [[0, ...a], [1, ...b]];

const WR = 'wren';
const NN = 'nana';
const TS = 'tess';
const PL = 'pell';
type C = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
const c = (who: string, x: number, y: number, o: Record<string, unknown> = {}, depth = 1.2): C => ({who, x, y, depth, ...o});
const stage = (set: string, v: string, cam: Cam[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({scene: 'stage', props: {set, v, cam, cast, acts, ...extra}});
const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const moon = (v: string, props: Record<string, unknown> = {}) => ({scene: 'moon', props: {v, ...props}});
const day = (d: number, km: number) => ({day: d, km, of: 200});
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});
/** Day 200: the town along the top step, behind the line. */
const TOWN = (o: Record<string, object> = {}) => [
  c('extra:21', 760, 930, {facing: 'left', expr: 'worried', outfit: 'cold'}),
  c(PL, 980, 930, {facing: 'left', expr: 'worried', ...o.pell}),
  c(WR, 1200, 930, {facing: 'left', expr: 'worried', ...o.wren}),
  c(NN, 1400, 930, {facing: 'left', expr: 'focused', pose: 'hold', hold: 'tideLog', ...o.nana}),
  c(TS, 1620, 930, {facing: 'left', expr: 'worried', ...o.tess}),
];

export const rawShots: Shot[] = [
  // ══ COLD OPEN ═══════════════════════════════════════════════════════════════════════════════
  sh('hook', stage('marketst', 'night', push(1.0, 1.12, 900, 540, 860, 520), [], [], {sea: 7.9, moon: 1.8}), {
    chapter: 'The first night',
    cue: 'wonder',
    beats: ['wow'],
    min: 4.6,
    dev: 'the event: a Moon far too big, and the sea in the street',
    action: 'Night. Market Street. A Moon almost twice its size hangs over the roofs, and the sea is in the street, lifting a parked car off its wheels.',
    lines: [N('(awed) By the hundred-and-twentieth night, / the sea came *up* Market Street to meet it.')],
  }),
  sh('hook-first', stage('quay', 'dusk', push(1.0, 1.08, 1000, 540), [
    c(NN, 900, 930, {facing: 'left', expr: 'worried'}),
    c(WR, 1080, 930, {facing: 'left', expr: 'awe'}),
    c(TS, 1290, 930, {facing: 'left', expr: 'smile'}),
    c('extra:21', 1520, 930, {facing: 'left', expr: 'awe'}),
    c('extra:36', 1720, 930, {facing: 'left', expr: 'smile'}),
  ], [{at: 0.5, who: TS, look: [-1, -0.6]}, {at: 0.9, who: NN, look: [-1, -0.5]}, {at: 1.2, who: 'extra:21', pose: 'point'}], {sea: 1.2, moon: 1.1}), {
    beats: ['loop'],
    timeJump: true,
    bridge: 'The first night',
    action: 'Day 1, dusk. The whole of Quay Street is out on the cobbles, faces turned up to a Moon that is just a little too big.',
    lines: [N('(wistful) The *first* night, / we just thought it was beautiful.')],
  }),
  sh('title', sc('title', {titleLines: ['THE MOON GOT CLOSER', 'EVERY NIGHT'], motif: 'moon'}), {
    min: 3.6,
    action: 'Title: the Moon swelling over the words.',
    lines: [N('(wistful) I was ten. / This is what the next two hundred days were *like*.')],
  }),

  // ══ DAY 1 ═══════════════════════════════════════════════════════════════════════════════════
  sh('d1-gauge', stage('quay', 'day', push(1.0, 1.1, 760, 540), [
    c(NN, 470, 930, {facing: 'left', expr: 'focused', hold: 'tideLog', pose: 'hold'}),
    c(WR, 680, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l0+0.8', who: NN, look: [-0.8, 0.5]}, {at: 'l0+1.6', who: WR, look: [-1, 0.4]}], {sea: 1.7, noStall: true}), {
    chapter: 'Day 1',
    hud: day(1, 384000),
    timeJump: true,
    cue: 'warm',
    dev: 'Nana keeps the family tide log, twice a day, as her mother did',
    action: 'Six in the morning. Nana Odile at the tide gauge on the quay wall with a worn navy ledger; Wren beside her in a yellow raincoat.',
    lines: [N('(warm) My Nana wrote down the high tide twice a day. / So had *her* mother. / And hers.')],
  }),
  sh('d1-log', moon('log', {rows: [['Tue', '1.3 m', '1.3 m', ''], ['Wed', '1.3 m', '1.3 m', ''], ['Thu', '1.7 m', '1.3 m', '']]}), {
    dev: 'high water is 40 cm over the table',
    action: 'The open log: two neat rows that match the tide table, and today’s, written in as we watch: 1.7 metres.',
    lines: [NA("(worried) Forty centimetres over the table. / That's *not* right.")],
  }),
  sh('d1-stall', stage('quay', 'day', push(1.15, 1.25, 800, 560), [
    c('extra:35', 380, 930, {facing: 'right', expr: 'smile'}),
    c(NN, 760, 930, {facing: 'left', expr: 'worried', hold: 'tideLog', pose: 'hold'}),
    c(WR, 950, 930, {facing: 'left', expr: 'smile'}),
  ], [{at: 'l1', who: NN, expr: 'focused'}], {sea: 1.75}), {
    beats: ['laugh'],
    action: 'The sea is slopping over the quay edge around the fish stall. The fishmonger, ankle-deep and cheerful.',
    lines: [MAN('(amused) Spring tide, Odile! / Put your *wellies* on!'), NA("(dry) Not in *my* book it isn't.")],
  }),
  sh('d1-kitchen', stage('nanakitchen', 'day', push(1.0, 1.08, 1000, 560), [
    c(NN, 640, 930, {facing: 'right', expr: 'focused'}),
    c(WR, 900, 930, {facing: 'right', expr: 'smile'}),
    c(TS, 1160, 930, {facing: 'left', expr: 'smile'}),
  ], [{at: 'l0+1.0', who: TS, expr: 'alert'}, {at: 'l0+1.6', who: TS, to: -320, dur: 1.8, gait: 'run'}], {sea: 1.2, moon: 1}), {
    bridge: 'In our kitchen',
    beats: ['laugh'],
    dev: 'Mum is the lifeboat coxswain',
    action: 'Nana’s kitchen: the range, the dresser, the window on the harbour. Mum, in her orange sea jacket, hears her pager and is out of the door before the toast is.',
    lines: [N("(warm) In our kitchen, Mum's pager went off before the toast did. / She drove the *lifeboat*.")],
  }),
  sh('d1-book', stage('nanakitchen', 'day', push(1.5, 1.65, 800, 600), [
    c(NN, 640, 930, {facing: 'right', expr: 'focused'}),
    c(WR, 900, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l0+0.4', who: NN, look: [0.8, 0]}, {at: 'l0+1.2', who: WR, look: [-0.8, 0.2]}, {at: 'l1+0.3', who: NN, expr: 'smile'}], {sea: 1.2, moon: 1}), {
    beats: ['heart'],
    action: 'Wren and Nana at the kitchen table.',
    lines: [W('(curious) Nana, why do you still *do* the book? / The harbour has a computer.'), NA("(dry) The computer wasn't here in eighteen eighty-five. / The *book* was.")],
  }),
  sh('d1-moonrise', stage('quay', 'dusk', push(1.3, 1.45, 1000, 560), [
    c(NN, 900, 930, {facing: 'left', expr: 'worried'}),
    c(WR, 1080, 930, {facing: 'left', expr: 'awe'}),
    c(TS, 1290, 930, {facing: 'left', expr: 'smile'}),
  ], [{at: 'l0+0.4', who: WR, pose: 'point'}], {sea: 1.2, moon: 1.1, moonAt: [600, 330]}), {
    hud: {place: 'QUAY STREET', time: '9:10 PM'},
    timeJump: true,
    beats: ['wow'],
    action: 'That evening. The Moon comes up over the harbour mouth. Wren points.',
    lines: [W("(awed) Nana, *look*. / It's bigger."), NA('(worried) Yes. / It *is*.')],
  }),
  sh('d1-news', moon('orbit', {from: 384000, to: 352000, headline: 'THE MOON IS CLOSER TONIGHT'}), {
    cue: 'tension',
    twist: 1,
    dev: 'the world knows at once: the Moon is 32,000 km closer',
    science: {text: 'The Moon’s distance is measured to within centimetres by timing laser pulses reflected from mirrors left by the Apollo astronauts; it normally recedes about 3.8 cm a year.', source: 'NASA, Lunar Laser Ranging experiment'},
    action: 'The news: the Earth from above, the Moon’s old path dashed, its new one a little inside it.',
    lines: [AN("(broadcast) Observatories measure the Moon's distance every night, with lasers. Tonight it is thirty-two thousand kilometres closer than yesterday."), AN('(broadcast) Nobody can yet say why.')],
  }),
  sh('d1-bin', stage('nanakitchen', 'night', push(1.15, 1.4, 1200, 580, 1400, 600), [
    c(WR, 330, 930, {facing: 'right', expr: 'uneasy'}),
    c(NN, 1560, 930, {facing: 'right', expr: 'worried', pose: 'reach'}),
  ], [{at: 0.8, who: WR, look: [1, -0.1]}, {at: 1.6, who: NN, pose: 'stand'}], {sea: 0.8, moon: 1.1, binOpen: true, lamp: true}), {
    beats: ['loop'],
    dev: 'Nana hides the log',
    action: 'Night. Nana at the dresser, closing the lid of the bread bin on the navy ledger. Wren, in the doorway, sees.',
    lines: [N('(curious) That night, Nana wrote in the book for a long time. / Then she locked it in the *bread bin*.')],
  }),

  // ══ DAY 3–12 ════════════════════════════════════════════════════════════════════════════════
  sh('d3-extra', moon('log', {extra: 1, rows: [['Thu', '1.7 m', '1.3 m', ''], ['Fri', '1.7 m', '1.3 m', ''], ['Sat', '1.8 m', '1.2 m', '+0.1 m']]}), {
    bridge: 'On Day 3',
    cue: 'mystery',
    beats: ['loop'],
    dev: 'a small tide that does not follow the Moon',
    action: 'The log again: a fourth column in red pencil, headed "no moon". One entry, ringed.',
    lines: [N("(curious) On Day 3 she added a column of her own. / A small tide that came when the Moon *wasn't* there.")],
  }),
  sh('cube', moon('cube'), {
    dev: 'closer Moon, far higher tides: the cube law',
    science: {text: 'The tide-raising pull of the Moon grows with the cube of its closeness: at half the distance, tides are eight times higher.', source: 'Newton, Principia (1687); NOAA Tides and Water Levels'},
    action: 'Two shores side by side: the Moon today, and the Moon at half the distance, the sea eight times higher up the wall.',
    lines: [N('(calm) A closer Moon pulls harder on the sea. / Come *half* as close, and the tide is eight times higher.')],
  }),
  sh('d9-sums', stage('nanakitchen', 'night', push(1.25, 1.4, 900, 600), [
    c(NN, 840, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', expr: 'focused'}),
    c(WR, 330, 930, {facing: 'right', expr: 'worried'}),
  ], [{at: 0.4, who: NN, loop: 'tap', dur: 2.4}, {at: 'l1+0.2', who: WR, look: [1, 0.1]}, {at: 'l2', who: NN, look: [-0.8, 0], expr: 'smile'}], {sea: 1.0, moon: 1.12, lamp: true}), {
    bridge: 'On Day 9',
    timeJump: true,
    beats: ['loop'],
    dev: 'Day 9: Nana works something out and tells nobody',
    action: 'Four in the morning. Nana at the kitchen table under the lamp, covering a page with sums. Wren in the doorway in her coat over her pyjamas.',
    lines: [N('(worried) On Day 9, Nana did sums until the kettle boiled *dry*.'), W("(worried) Nana? / It's four in the *morning*."), NA("(tender) Go back to bed, love. / I'm nearly *done*.")],
  }),
  sh('d10-board', stage('boardroom', 'day', push(1.0, 1.08, 1100, 560), [
    c(WR, 560, 930, {facing: 'right', expr: 'worried'}),
    c(NN, 800, 930, {facing: 'right', expr: 'determined'}),
    c('extra:36', 300, 930, {facing: 'right', expr: 'focused'}),
    c(PL, 1500, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l0+0.4', who: PL, look: [-1, 0]}, {at: 'l1+0.2', who: NN, look: [1, -0.1]}, {at: 'l1+0.6', who: WR, look: [0.8, -0.2]}, {at: 'l2+0.2', who: PL, expr: 'smile'}, {at: 'l2+0.8', who: 'extra:36', expr: 'laugh'}], {}), {
    hud: {place: 'HARBOUR BOARD', time: 'DAY 10'},
    timeJump: true,
    cue: 'tension',
    dev: 'Nana warns the Harbour Board; they laugh',
    action: 'The Harbour Board’s panelled room on Market Street. Mr. Pell behind the long table; Nana standing in front of it with her hat in her hand; Wren behind her.',
    lines: [
      PE('(firm) It is a high spring tide, and it will *settle*. / The Board sees no cause for alarm.'),
      NA("(firm) It won't settle, Arthur. / It will come up *Chapel Hill*."),
      PE("(amused) We've heard your *floods* before, Odile."),
    ],
  }),
  sh('d10-left', stage('boardroom', 'day', push(1.5, 1.62, 700, 600), [
    c(WR, 560, 930, {facing: 'right', expr: 'sad'}),
    c(NN, 800, 930, {facing: 'right', expr: 'sad'}),
  ], [{at: 0.8, who: NN, facing: 'left'}, {at: 1.2, who: NN, to: 380, dur: 2.2}, {at: 1.6, who: WR, facing: 'left'}, {at: 1.9, who: WR, to: 200, dur: 2.0}], {}), {
    beats: ['heart'],
    action: 'Laughter. Nana turns and walks out; Wren follows.',
    lines: [N('(sad) They laughed. / Nana put on her hat, and we *left*.')],
  }),
  sh('d12-coat', stage('nanakitchen', 'day', push(1.3, 1.42, 700, 600), [
    c(WR, 560, 930, {facing: 'left', expr: 'focused', pose: 'reach'}),
    c(NN, 1100, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l0+0.9', who: WR, expr: 'surprised'}], {sea: 1.3, moon: 1.14}), {
    bridge: 'On Day 12',
    timeJump: true,
    dev: 'Nana has bought the ruined chapel',
    action: 'Wren, hanging up Nana’s oilskin, finds a folded paper in the pocket.',
    lines: [N("(curious) On Day 12, I found a paper in Nana's coat.")],
  }),
  sh('d12-deeds', moon('deeds'), {
    action: 'The deeds: the ruined chapel on Chapel Hill, sold to Mrs. Odile Marsh for one hundred pounds.',
    lines: [W('(shocked) You bought the *chapel*? / Nana, it hasn’t got a roof!'), NA("(dry) It's got a good *view*.")],
    beats: ['laugh'],
  }),

  // ══ DAY 30 ══════════════════════════════════════════════════════════════════════════════════
  sh('d30-quay', stage('quay', 'night', move([1.0, 1100, 540], [1.22, 760, 500]), [], [], {sea: 2.1, moon: 1.16}), {
    chapter: 'Day 30',
    hud: day(30, 330000),
    timeJump: true,
    cue: 'dread',
    dev: 'the sea comes over the quay every night',
    action: 'Night. The sea lies half a metre deep along Quay Street, lamps reflected in it; the Moon is plainly bigger.',
    lines: [N('(worried) By Day 30, the sea came over the quay *every* night.')],
  }),
  sh('d30-news', moon('orbit', {from: 352000, to: 330000, headline: 'SCIENTISTS: "IT SHOULD SETTLE"'}), {
    beats: ['laugh'],
    dev: 'every forecast is beaten',
    action: 'The news: the Moon’s path, a little smaller again.',
    lines: [AN('(broadcast) Scientists now expect the Moon to settle within the week.'), N("(dry) It didn't. / Every promise on the news lasted about *four* days.")],
  }),
  sh('d30-beds', stage('nanakitchen', 'day', push(1.1, 1.2, 1000, 580), [
    c(WR, 760, 930, {facing: 'right', expr: 'worried'}),
    c(NN, 1100, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l0+0.3', who: WR, look: [1, 0]}, {at: 'l1+0.2', who: NN, look: [-1, 0]}, {at: 'l3', who: NN, expr: 'sad'}], {sea: 1.4, moon: 1.16, bare: true, noCoat: true}), {
    bridge: 'Where',
    beats: ['heart'],
    dev: 'Nana has already moved the furniture up the hill; Wren will not go',
    action: 'The kitchen, half empty: the dresser has gone, pale shapes on the wall where it stood.',
    lines: [
      W("(frustrated) Where's my *bed*?"),
      NA('(calm) Up the hill. / *Airing*.'),
      W("(frustrated) I'm *not* moving, Nana. / This is my house."),
      NA('(tender) I *know* it is, love.'),
    ],
  }),
  sh('kepler', moon('orbit', {from: 384000, to: 330000}), {
    dev: 'a closer Moon orbits faster: the month shrinks',
    science: {text: 'A closer moon orbits faster (Kepler’s third law): at 330,000 km a month lasts about 22 days; at a third of the distance, about five.', source: 'Kepler, Harmonices Mundi (1619)'},
    action: 'From above: the Moon racing round its smaller path. ONE MONTH = 22 DAYS.',
    lines: [N('(curious) Even the calendar went wrong. / A closer Moon goes round *faster*: the month was down to twenty-two days.')],
  }),

  // ══ DAY 60 ══════════════════════════════════════════════════════════════════════════════════
  sh('d60-quay', stage('quay', 'day', move([1.0, 1200, 540], [1.2, 820, 520]), [], [], {sea: 3.0, moon: 1.3}), {
    chapter: 'Day 60',
    hud: day(60, 290000),
    timeJump: true,
    cue: 'dread',
    dev: 'tides have doubled; Quay Street is abandoned',
    action: 'High water at noon: the sea stands at the door handles along Quay Street; the fishing boats float level with the windows.',
    lines: [N('(sad) By Day 60 the tides had doubled. / Quay Street was only *ours* at low water.')],
  }),
  sh('d60-low', stage('quay', 'day', push(1.15, 1.25, 380, 940, 300, 990), [
    c(WR, 620, 930, {facing: 'left', expr: 'awe'}),
    c('extra:35', 820, 930, {facing: 'left', expr: 'surprised'}),
  ], [{at: 0.5, who: WR, look: [-1, 0.9]}, {at: 'l0+1.4', who: 'extra:35', pose: 'point'}], {sea: -2.4, noStall: true}), {
    beats: ['laugh', 'wow'],
    dev: 'low tides fall as far as high tides rise',
    action: 'Low water. The harbour basin has drained: the boats lie on the mud far below the quay edge. Wren peers over.',
    lines: [N('(amused) And at low tide the sea went out so far, we could see the *harbour floor*. / Crabs, bicycles, / and somebody\'s piano.')],
  }),
  sh('d60-lifeboat', stage('marketst', 'night', push(1.2, 1.32, 900, 560), [
    c(TS, 760, 930, {facing: 'left', expr: 'determined'}),
    c('extra:21', 980, 930, {facing: 'left', expr: 'worried', outfit: 'cold'}),
  ], [{at: 0.6, who: TS, pose: 'point'}], {sea: 2.6, moon: 1.3}), {
    hud: {place: 'MARKET STREET', time: 'DAY 64'},
    beats: ['wow'],
    dev: 'Mum’s lifeboat is out every night',
    action: 'Night, the top of the steps on Market Street. Mum, in her sea jacket, pointing a crewman down toward the dark water.',
    lines: [N("(proud) Mum's lifeboat went out eleven times that week. / Mostly for people who had gone back for *one* more thing.")],
  }),
  sh('d60-line', stage('hill', 'day', push(1.1, 1.22, 900, 600), [
    c(NN, 760, 930, {facing: 'left', expr: 'focused', pose: 'kneel', hold: 'brush'}),
    c(WR, 1060, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 0.4, who: NN, loop: 'stir', dur: 1.6}, {at: 'l1+0.2', who: NN, look: [0.8, -0.2]}], {sea: 1.0, moon: 1.3, line: 1}), {
    hud: {place: 'CHAPEL HILL', time: 'DAY 66'},
    timeJump: true,
    beats: ['loop'],
    dev: 'Nana paints a white line on the chapel steps',
    action: 'The steps of the ruined chapel, high over the town. Nana on her knees with a brush, a white line fresh across the stone.',
    lines: [W("(curious) What's the line *for*?"), NA('(calm) For *later*.')],
  }),

  // ══ TWISTS 1 AND 2 ══════════════════════════════════════════════════════════════════════════
  sh('news-slow', moon('orbit', {from: 290000, to: 280000, headline: 'WHAT IS SLOWING THE MOON?'}), {
    chapter: 'The visitor',
    bridge: 'On Day 70',
    twist: 2,
    cue: 'mystery',
    dev: 'the Moon is not falling: something is taking its speed, loop by loop',
    action: 'The news: the Moon’s path stepping inward, a little on every circuit.',
    lines: [N('(wistful) On Day 70, a scientist said the thing *nobody* had thought of.'), SCI("(curious) Nothing *falls* this slowly. / The Moon isn't falling. Something is taking its speed away, / a little on every loop.")],
  }),
  sh('sling', moon('sling'), {
    dev: 'how: a gravity slingshot in reverse',
    science: {text: 'In a gravity assist, a small body swinging past a larger one trades speed with it; spacecraft such as Voyager gained speed this way from the planets.', source: 'NASA Jet Propulsion Laboratory'},
    action: 'Something small swings round the Moon: each loop its speed bar grows, and the Moon’s shrinks.',
    lines: [N('(calm) Spacecraft do it on purpose: swing past a planet, and *steal* a little of its speed. / Something was doing it to our *Moon*.')],
  }),
  sh('grain', moon('grain', {headline: 'A BLACK HOLE THE SIZE OF DUST'}), {
    beats: ['wow'],
    dev: 'the visitor is a black hole smaller than a grain of sand',
    science: {text: 'A black hole with a third of the Moon’s mass would be about 0.04 mm across and give off no light; such primordial black holes are a real but unconfirmed hypothesis.', source: 'Hawking (1971); Scholtz and Unwin (2020)'},
    action: 'A fingertip with one grain of sand on it; beside the grain, a ring drawn round a speck too small to see.',
    lines: [SCI("(awed) We can't see it, because it is a black hole *smaller* than a grain of sand, / and a third as heavy as the Moon.")],
  }),
  sh('instrument', stage('quay', 'night', push(1.0, 1.15, 500, 520, 420, 480), [], [], {sea: 3.1, moon: 1.32, noStall: true}), {
    beats: ['loop'],
    action: 'The drowned quay at night: the Moon over the black water, the tide gauge standing in it.',
    lines: [N('(awed) No telescope could find it. / The only things big enough to feel it were the Moon / and the *sea*.')],
  }),
  sh('your-column', stage('chapelin', 'day', push(1.4, 1.52, 1150, 600), [
    c(NN, 1000, 930, {facing: 'right', expr: 'focused'}),
    c(WR, 1620, 930, {facing: 'left', expr: 'surprised'}),
  ], [{at: 0.1, who: WR, to: 1260, dur: 0.9, gait: 'run'}, {at: 'l1', who: NN, loop: 'stir', dur: 1.2}], {moon: 1.32, sea: 3}), {
    hud: {place: 'THE CHAPEL', time: 'DAY 75'},
    timeJump: true,
    beats: ['loop'],
    dev: 'the scientists’ "extra tide" is the column Nana has kept since Day 3',
    action: 'Inside the chapel, already half a home: camp beds, a tea urn. Wren runs in; Nana goes on sorting blankets.',
    lines: [W("(excited) Nana! A tide with no Moon. / That's *your* column!"), NA('(dry) Is it.'), N("(curious) She didn't even look *up*.")],
  }),

  // ══ DAY 90 ══════════════════════════════════════════════════════════════════════════════════
  sh('d90-hill', stage('hill', 'day', push(1.0, 1.08, 500, 560), [], [], {sea: 4.7, moon: 1.5, line: 1}), {
    chapter: 'Day 90',
    hud: day(90, 250000),
    timeJump: true,
    cue: 'dread',
    dev: 'the lighthouse is an island; school moves uphill',
    action: 'From the hill: the lower roofs standing in the sea, the lighthouse alone on its rock, the Moon half as big again.',
    lines: [N('(sad) Day 90. The lighthouse was an island twice a day, / and the school moved up the *hill*.')],
  }),
  sh('d90-world', moon('world', {moon: 1.5, label: 'EVERY PORT ON EARTH: CLOSED', sub: 'COASTAL CITIES MOVE INLAND', headline: 'THE WORLD MOVES UPHILL'}), {
    hud: day(92, 245000),
    dev: 'it is happening to every coast on Earth',
    science: {text: 'The shape of a bay can multiply a tide: the Bay of Fundy in Canada already has tides of up to 16 metres.', source: 'Canadian Hydrographic Service'},
    action: 'The news: the whole Earth from space, its oceans pulled into two bulges toward a Moon that is far too close.',
    lines: [N("(sad) It wasn't just us. Every port on Earth closed. / Whole cities moved inland, *one* street at a time."), N('(awed) In some bays the shape of the coast made it worse. / Places that already had big tides got the *biggest*.')],
  }),
  sh('will-it-hit', stage('marketst', 'night', push(1.5, 1.65, 1000, 600), [
    c(WR, 900, 930, {facing: 'right', expr: 'scared'}),
    c(TS, 1140, 930, {facing: 'left', expr: 'worried'}),
  ], [{at: 'l1', who: TS, pose: 'kneelHug', expr: 'smile'}], {sea: 4.2, moon: 1.5}), {
    hud: {place: 'MARKET STREET', time: 'DAY 96'},
    beats: ['heart'],
    dev: 'the question every child is asking',
    action: 'Night on Market Street, the Moon enormous over the roofs. Wren and Mum.',
    lines: [W('(scared) Mum? / Is it going to *hit* us?'), T("(tender) No, love. / I promise you it *can't*.")],
  }),
  sh('roche', moon('roche'), {
    twist: 3,
    dev: 'it can never hit: a moon orbits, and would break up long before it touched',
    science: {text: 'A moon closer than about 18,000 km to the Earth would be pulled apart by tides (the Roche limit); that is how planetary rings form.', source: 'Édouard Roche (1848)'},
    action: 'From above: the Moon going round and round. Far inside its path, a dashed ring.',
    lines: [N("(calm) Mum was right. A moon doesn't fall *onto* its planet. It goes round it."), N('(calm) And one that came really close would be pulled to pieces long before it touched. / Ours was never going to come anywhere *near* that.')],
  }),

  // ══ DAY 110–120 ═════════════════════════════════════════════════════════════════════════════
  sh('d100-fight', stage('chapelin', 'day', push(1.2, 1.5, 1180, 620, 1100, 600), [
    c(NN, 1000, 930, {facing: 'right', expr: 'focused', pose: 'hold', hold: 'tideLog'}),
    c(WR, 1260, 930, {facing: 'left', expr: 'worried'}),
  ], [{at: 0.3, who: NN, loop: 'tap', dur: 1.2}, {at: 'l0+0.4', who: NN, look: [1, 0]}, {at: 'l1', who: NN, expr: 'sad'}, {at: 'l1+2.2', who: WR, facing: 'right'}, {at: 'l1+2.5', who: WR, to: 1760, dur: 1.4, gait: 'run'}], {moon: 1.6, sea: 5}), {
    hud: {place: 'THE CHAPEL', time: 'DAY 100'},
    timeJump: true,
    beats: ['heart'],
    dev: 'Wren turns on Nana',
    action: 'The chapel. Nana writing in the ledger; Wren, wet through from carrying boxes, finally snaps.',
    lines: [W('(frustrated) You care more about that *book* than about our house!'), NA("(sad) The book is how I know what's *coming* for our house, love.")],
  }),
  sh('d100-silent', stage('hill', 'dusk', push(1.3, 1.4, 1500, 600), [c(WR, 1560, 930, {facing: 'left', expr: 'sad', pose: 'sit'})], [{at: 1.0, who: WR, look: [-1, 0.4]}], {sea: 5.2, moon: 1.6, line: 1}), {
    bridge: 'for three days',
    beats: ['heart'],
    action: 'Wren alone on the chapel wall at dusk, looking down at the drowned lower town.',
    lines: [N("(guilty) I didn't speak to her for three days.")],
  }),
  sh('d110-find', stage('chapelin', 'night', push(1.3, 1.42, 1200, 600), [
    c(WR, 1260, 930, {facing: 'left', expr: 'focused', pose: 'hold', hold: 'tideLog'}),
  ], [{at: 'l0+1.6', who: WR, expr: 'surprised'}], {moon: 1.75, sea: 6}), {
    chapter: 'Day 110',
    hud: {place: 'THE CHAPEL', time: 'DAY 110'},
    timeJump: true,
    cue: 'mystery',
    dev: 'Wren finds the pages Nana glued together',
    action: 'Night in the chapel. Wren alone by a lantern with the navy ledger, easing two stuck pages apart.',
    lines: [N("(curious) On Day 110, I found two pages she'd *glued* together.")],
  }),
  sh('d110-sum', moon('sum'), {
    beats: ['wow'],
    dev: 'the Day 9 sum: the last high tide will be 35 metres',
    action: 'The hidden page: a column of sums running down from Day 9, and at the bottom, ringed in red: last high water, 35 m. A small sketch of the chapel steps with a line across them.',
    lines: [N('(shocked) Her sum from Day 9. / And at the bottom, the *last* high tide: thirty-five metres.')],
  }),
  sh('d110-letter', moon('letter'), {
    dev: '1998: she warned the Board once before',
    action: 'A typed letter, folded small: Saltmouth Harbour Board, 12 November 1998. "We see no cause for alarm."',
    lines: [N("(sad) And a letter from nineteen ninety-eight. / She had warned them about a flood once *before*. / They'd written back that there was no cause for *alarm*.")],
  }),
  sh('confront', stage('chapelin', 'night', push(1.5, 1.65, 1130, 600), [
    c(NN, 1000, 930, {facing: 'right', expr: 'sad'}),
    c(WR, 1260, 930, {facing: 'left', expr: 'worried', pose: 'hold', hold: 'tideLog'}),
  ], [{at: 'l0+0.3', who: NN, look: [0.8, 0.3]}, {at: 'l1+0.2', who: NN, look: [1, 0]}, {at: 'l2', who: WR, expr: 'sad'}, {at: 'l3', who: NN, expr: 'determined'}], {moon: 1.75, sea: 6}), {
    twist: 4,
    beats: ['heart'],
    dev: 'Nana knew on Day 9, told them on Day 10, and has been building the refuge alone',
    action: 'Nana, woken; Wren holding the open book out to her.',
    lines: [
      W("(frustrated) You *knew*. Since Day 9. / Why didn't you tell them?"),
      NA('(sad) I did, love. / Day 10. You were *there*.'),
      W('(sad) They laughed.'),
      NA("(determined) They'll believe the sea before they believe me. / So I'm getting the hill ready for when they *do*."),
    ],
  }),
  sh('d120-street', stage('marketst', 'night', move([1.0, 1200, 560], [1.2, 860, 520]), [], [], {sea: 7.9, moon: 1.8}), {
    chapter: 'Day 120',
    hud: day(120, 210000),
    timeJump: true,
    cue: 'dread',
    letterbox: true,
    dev: 'the sea reaches Market Street',
    action: 'The opening picture again, now earned: Market Street at night, the sea lifting the yellow car.',
    lines: [N('(scared) On Day 120, the sea came up Market Street.')],
  }),
  sh('d120-window', stage('marketst', 'night', push(1.3, 1.45, 520, 600, 380, 640), [c(WR, 560, 930, {facing: 'left', expr: 'sad'}), c(TS, 760, 930, {facing: 'left', expr: 'sad'})], [{at: 0.6, who: WR, look: [-1, 0.8]}, {at: 'l0+1.2', who: TS, look: [-0.6, 0.5]}], {sea: 7.0, moon: 1.8, car: false}), {
    letterbox: true,
    beats: ['heart'],
    dev: 'Wren watches her own house go under',
    action: 'The top of the steps on Market Street. Wren and Mum look down over the drowned roofs of Quay Street toward No. 3.',
    lines: [N("(grieving) From the steps, I watched it reach my bedroom window. / Then I couldn't see my window any *more*.")],
  }),
  sh('d118-pell', stage('marketst', 'day', push(1.2, 1.55, 2200, 600, 2360, 620), [c(PL, 2390, 930, {facing: 'left', expr: 'worried'})], [{at: 'l1+0.4', who: PL, look: [-0.8, 0.6]}], {sea: 7.75, moon: 1.8, car: false}), {
    hud: {place: 'HARBOUR BOARD', time: 'DAY 121'},
    timeJump: true,
    beats: ['laugh'],
    dev: 'the sea reaches the Harbour Board; Pell still says it will settle',
    action: 'Market Street by day. The sea is ankle-deep across the doorstep of the Harbour Board; Mr. Pell stands in it in his good shoes.',
    lines: [N('(dry) The next day, the sea came into the Harbour Board.'), PE('(tired) It will *settle*.'), N('(dry) He still said it. / Just *quieter*.')],
  }),
  sh('ground', stage('chapelin', 'day', push(1.5, 1.95, 560, 720), [], [], {moon: 1.8, sea: 7}), {
    dev: 'the solid ground rises and falls too',
    science: {text: 'The solid Earth has a tide of its own: the ground rises and falls about 30 cm twice a day, and with the Moon at 210,000 km that becomes nearly two metres.', source: 'International Earth Rotation and Reference Systems Service'},
    action: 'Close on the trestle in the chapel: the cups beside the tea urn, trembling in their saucers.',
    lines: [N('(awed) Even the *ground* rose and fell now. Two metres, twice a day. / Nobody felt it. Only the *cups* did.')],
  }),

  // ══ DAY 150 ═════════════════════════════════════════════════════════════════════════════════
  sh('d150-crowd', stage('hill', 'dusk', push(1.0, 1.08, 1000, 560), [
    c('extra:21', 520, 930, {facing: 'right', expr: 'worried', outfit: 'cold'}),
    c(WR, 780, 930, {facing: 'right', expr: 'determined', pose: 'hold', hold: 'tideLog'}),
    c(PL, 1080, 930, {facing: 'left', expr: 'worried'}),
    c('extra:36', 1320, 930, {facing: 'left', expr: 'worried', outfit: 'cold'}),
    c(NN, 1560, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l0+0.3', who: PL, look: [-1, 0.3]}, {at: 'l1+0.2', who: PL, look: [0.6, -0.4]}, {at: 'l2+2.4', who: WR, give: PL, prop: 'tideLog'}], {sea: 15, moon: 2.3, line: 1}), {
    chapter: 'Day 150',
    hud: day(150, 170000),
    timeJump: true,
    cue: 'tension',
    dev: 'Wren takes the log to the town',
    action: 'Dusk on Chapel Hill. Half the town is on the grass with bundles and nowhere to go. Wren walks up to Mr. Pell with the ledger.',
    lines: [
      W("(determined) Mr. Pell. This is my Nana's book. / Every tide for a hundred and forty *years*."),
      PE('(tired) Wren, / not *now*.'),
      W("(firm) Nana wrote down *tonight's* tide on Day 9. / Fifteen metres. Go and look at it."),
    ],
  }),
  sh('pell-reads', stage('hill', 'dusk', push(1.6, 1.75, 1000, 600), [
    c(WR, 780, 930, {facing: 'right', expr: 'determined'}),
    c(PL, 1080, 930, {facing: 'left', expr: 'surprised', pose: 'hold', hold: 'tideLog'}),
  ], [{at: 'l0+1.6', who: PL, expr: 'sad'}], {sea: 15, moon: 2.3, line: 1}), {
    beats: ['heart'],
    dev: 'Pell sees she was right',
    action: 'Mr. Pell with the open book, reading; the sea, far below him, exactly where the pencil said.',
    lines: [PE('(shocked) Good Lord. // She had it *right*.'), PE('(guilty) She had *all* of it right.')],
  }),
  sh('where-stop', stage('hill', 'dusk', push(1.2, 1.32, 1250, 580), [
    c(WR, 780, 930, {facing: 'right', expr: 'determined'}),
    c(PL, 1080, 930, {facing: 'right', expr: 'worried', pose: 'hold', hold: 'tideLog'}),
    c('extra:36', 1320, 930, {facing: 'right', expr: 'worried', outfit: 'cold'}),
    c(NN, 1560, 930, {facing: 'left', expr: 'focused'}),
  ], [{at: 'l1', who: NN, pose: 'point'}, {at: 'l2', who: PL, expr: 'determined'}], {sea: 15, moon: 2.3, line: 1}), {
    beats: ['loop'],
    dev: 'the white line is where it stops',
    action: 'Pell turns to Nana. She points down at the white line across the step they are standing on.',
    lines: [PE('(worried) Odile. / Where does it *stop*?'), NA('(calm) *There*.'), PE("(firm) Then that's where we *go*.")],
  }),
  sh('d150-beds', stage('chapelin', 'night', push(1.0, 1.08, 1000, 560), [
    c(PL, 620, 930, {facing: 'right', expr: 'focused', pose: 'carry'}),
    c(NN, 1000, 930, {facing: 'left', expr: 'smile'}),
    c(WR, 1260, 930, {facing: 'left', expr: 'smile'}),
    c('extra:21', 1560, 930, {facing: 'left', expr: 'neutral', outfit: 'cold'}),
  ], [{at: 0.2, who: PL, to: 760, dur: 2.4}], {moon: 2.3, sea: 15}), {
    hud: {place: 'THE CHAPEL', time: 'DAY 150 · NIGHT'},
    beats: ['laugh'],
    dev: 'the town moves into the chapel',
    action: 'The chapel, full: families on camp beds, lanterns lit. Mr. Pell, jacket off, carrying a bed frame.',
    lines: [N('(proud) Four hundred people slept in the chapel that night. / Mr. Pell carried the *beds*.')],
  }),
  sh('d160-news', moon('orbit', {from: 170000, to: 160000, headline: 'THE VISITOR IS SPEEDING UP'}), {
    bridge: 'On Day 160',
    dev: 'the scientists’ final figure: 128,000 km on about Day 200',
    action: 'The news: the Moon’s shrinking path, and a figure.',
    lines: [N('(hopeful) On Day 160, the scientists finally had a number of their *own*.'), SCI('(hopeful) The visitor gets faster with every loop. / Around Day 200, it will be fast enough to *escape*.'), SCI('(hopeful) And the Moon should stop at about a hundred and twenty-eight thousand *kilometres*.')],
  }),
  sh('your-number', stage('chapelin', 'night', push(1.5, 1.62, 1130, 600), [
    c(NN, 1000, 930, {facing: 'right', expr: 'smile'}),
    c(WR, 1260, 930, {facing: 'left', expr: 'awe'}),
  ], [{at: 'l0+0.2', who: WR, look: [-1, 0]}, {at: 'l1', who: NN, look: [1, 0]}], {moon: 2.4, sea: 16}), {
    timeJump: true,
    beats: ['laugh'],
    dev: 'the scientists’ figure matches the pencil',
    action: 'Wren turns from the radio to Nana.',
    lines: [W("(awed) Nana. That's *your* number."), NA('(amused) I rounded *up*.')],
  }),

  // ══ DAY 180 ═════════════════════════════════════════════════════════════════════════════════
  sh('d180-hill', stage('hill', 'night', move([1.0, 900, 560], [1.2, 420, 520]), [], [], {sea: 26.8, moon: 2.7, line: 1, chapelLit: true}), {
    chapter: 'Day 180',
    hud: day(180, 140000),
    timeJump: true,
    cue: 'dread',
    dev: 'the sea is at the churchyard wall',
    action: 'Night. From the chapel steps the sea is close below now, the last roofs gone, the Moon nearly three times as wide.',
    lines: [N('(scared) By Day 180, the sea was at the churchyard wall, / and the Moon was nearly three times as *wide*.')],
  }),
  sh('last-launch', stage('hill', 'night', push(1.3, 1.42, 1000, 580), [
    c(TS, 880, 930, {facing: 'left', expr: 'determined'}),
    c(WR, 1120, 930, {facing: 'left', expr: 'worried'}),
  ], [{at: 0.5, who: TS, to: 560, dur: 2.0, gait: 'run'}], {sea: 26.8, moon: 2.7, line: 1, chapelLit: true}), {
    beats: ['wow'],
    dev: 'the last launch',
    action: 'Mum runs down the steps toward the water, pulling on her gloves. Wren watches her go.',
    lines: [N('(proud) Mum launched the lifeboat one last time, from a ramp cut into the hill, / and brought a family back from the *lighthouse*.')],
  }),
  sh('names', stage('chapelin', 'night', push(1.5, 1.62, 1000, 620), [c(NN, 1000, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', expr: 'smile', hold: 'tideLog'})], [{at: 0.6, who: NN, loop: 'tap', dur: 2.2}], {moon: 2.7, sea: 27}), {
    beats: ['heart'],
    dev: 'what Nana writes now',
    action: 'Late at night in the chapel. Nana by a lantern, writing in the ledger while four hundred people sleep around her.',
    lines: [N('(tender) That night I saw Nana writing in the book again. / Not the tide. // Just our names. All four hundred of them.')],
  }),
  sh('what-if', stage('chapelin', 'night', push(1.5, 1.65, 1130, 600), [
    c(NN, 1000, 930, {facing: 'right', expr: 'smile', pose: 'hold', hold: 'tideLog'}),
    c(WR, 1260, 930, {facing: 'left', expr: 'scared'}),
  ], [{at: 'l1+1.8', who: WR, expr: 'smile'}], {moon: 2.7, sea: 27}), {
    hud: {place: 'THE CHAPEL', time: 'DAY 199'},
    beats: ['heart', 'laugh'],
    dev: 'the night before',
    action: 'The night before. Wren cannot sleep; Nana is mending a net by the lantern.',
    lines: [W('(scared) Nana? / What if your sum is *wrong*?'), NA('(tender) Then we go up one more step, love. / And I buy a better *pencil*.')],
  }),

  // ══ DAY 200 ═════════════════════════════════════════════════════════════════════════════════
  sh('d200-wait', stage('hill', 'night', push(1.0, 1.06, 900, 560), TOWN(), [{at: 0.8, who: WR, look: [-1, 0.5]}, {at: 1.4, who: PL, look: [-1, 0.6]}], {sea: 33.6, moon: 3, line: 1, chapelLit: true}), {
    chapter: 'Day 200',
    hud: day(200, 128000),
    timeJump: true,
    cue: 'silence',
    letterbox: true,
    dev: 'the last tide',
    action: 'The last night. The whole town stands along the top step, behind the white line. The sea is climbing the steps below them, bright under a Moon three times too big.',
    lines: [N('(awed) Day 200. / The whole town stood on the chapel steps and watched it *come*.')],
  }),
  sh('d200-steps', stage('hill', 'night', push(1.5, 1.62, 760, 760), TOWN({wren: {expr: 'scared'}}), [{at: 0.6, who: WR, look: [-0.6, 1]}], {sea: 34.5, moon: 3, line: 1, chapelLit: true}), {
    letterbox: true,
    beats: ['loop'],
    action: 'Close on the steps: the water lapping onto the one below the line.',
    lines: [N('(scared) Two steps below the line. // *One*.')],
  }),
  sh('d200-line', stage('hill', 'night', push(1.5, 1.7, 900, 800), TOWN({wren: {expr: 'scared'}, tess: {expr: 'worried'}}), [{at: 'l0+1.5', who: WR, expr: 'awe'}, {at: 'l0+1.6', who: TS, expr: 'awe'}, {at: 'l0+1.6', who: PL, expr: 'surprised'}, {at: 'l0+2.4', who: NN, expr: 'smile'}], {sea: 34.97, moon: 3, line: 1, chapelLit: true}), {
    letterbox: true,
    beats: ['wow', 'heart'],
    cue: 'triumph',
    dev: 'the sea stops on Nana’s line',
    action: 'The water touches the white line. And lies there.',
    lines: [N('(awed) It touched the white line. // And it *stopped*.')],
  }),
  sh('leaves', moon('leaves', {from: 128000, to: 128000}), {
    twist: 5,
    dev: 'the visitor escapes; the Moon stays where it was left',
    action: 'From above: something small leaves its last loop and flies off the edge of the picture. The Moon goes on round its new, small path.',
    lines: [N('(awed) That night, the visitor made its last loop. It had stolen all the speed it needed, / and it flew off into the *dark*.'), N("(wistful) We thought it would take the Moon with it. / It didn't. It left the Moon exactly where it *was*.")],
  }),
  sh('page-one', stage('hill', 'night', push(1.5, 1.65, 1300, 600), TOWN({wren: {facing: 'right', expr: 'smile'}, nana: {expr: 'smile'}, pell: {expr: 'smile', facing: 'right'}, tess: {expr: 'smile'}}), [{at: 'l0+1.6', who: NN, give: WR, prop: 'tideLog'}, {at: 'l1', who: WR, expr: 'laugh'}], {sea: 34.97, moon: 3, line: 1, chapelLit: true}), {
    beats: ['heart'],
    dev: 'Nana hands the log on',
    action: 'Nana holds the ledger out to Wren.',
    lines: [NA('(tender) Your book now, love. / Page *one*.'), W('(proud) Day 1. / High tide: on *time*.')],
  }),

  // ══ CODA ════════════════════════════════════════════════════════════════════════════════════
  sh('year-later', stage('hill', 'day', push(1.0, 1.08, 900, 540), [
    c(NN, 1100, 930, {facing: 'left', expr: 'smile'}),
    c(WR, 880, 930, {facing: 'left', expr: 'smile', pose: 'hold', hold: 'tideLog'}),
  ], [{at: 0.8, who: WR, look: [-1, 0.5]}], {sea: 30, moon: 3, line: 1}), {
    chapter: 'After',
    hud: {place: 'SALTMOUTH', time: 'ONE YEAR LATER'},
    timeJump: true,
    cue: 'warm',
    dev: 'the town is rebuilt above the line',
    action: 'A bright morning a year on. Wren, a little taller, at the white line with the ledger; Nana beside her; the sea high and blue below.',
    lines: [N('(warm) We built the town again, above the line. / The tide still climbs thirty-five metres, twice a day, and falls *back*.')],
  }),
  sh('final', stage('hill', 'night', push(1.0, 1.12, 760, 540, 700, 500), [
    c(WR, 980, 930, {facing: 'left', expr: 'awe', pose: 'hold', hold: 'tideLog'}),
    c(NN, 1180, 930, {facing: 'left', expr: 'smile'}),
  ], [{at: 1.0, who: NN, look: [-1, -0.6]}], {sea: 34, moon: 3, line: 1, chapelLit: true}), {
    timeJump: true,
    dev: 'the new sky',
    beats: ['heart'],
    action: 'Night. The two of them on the top step, small under the enormous Moon rising out of the sea.',
    lines: [N('(wistful) People ask if I miss the old Moon. / I do. // But nobody who has seen this one rise would give it *back*.')],
  }),
  sh('end', sc('end', {motif: 'moon', prompt: 'WHAT WOULD YOU CARRY UP THE HILL FIRST? TELL US BELOW ↓'}), {
    min: 12,
    action: 'End screen.',
    lines: [N('(warm) What would *you* carry up the hill first? / Tell us in the comments.', 1.0)],
  }),
];

const SPEAKER_CAST = {WREN: WR, NANA: NN, TESS: TS, PELL: PL, MAN: '*'};

export const moon02: Episode = {
  id: 'moon02',
  file: 'FILE 002',
  title: 'The Moon Got Closer Every Night',
  youtubeTitle: 'The Moon Got Closer Every Night. Day 1 to Day 200 by the Sea',
  titleAlternates: ['What If the Moon Came Closer Every Night? Day 1 to Day 200', 'The Moon Started Getting Bigger. My Nana Knew Where It Would Stop'],
  thumbnailText: 'DAY 1',
  commentPrompt: 'What would you carry up the hill first?',
  story: {
    hook: {shot: 'hook', image: 'a Moon almost twice its size over Market Street, and the sea in the street lifting a car'},
    clock: {unit: 'kilometres to the Moon', steps: ['d1-gauge', 'd30-quay', 'd60-quay', 'd90-hill', 'd120-street', 'd150-crowd', 'd180-hill', 'd200-wait']},
    mystery: {question: 'Why is Nana Odile hiding the tide log and moving everything she owns up the hill?', owner: 'nana', plants: ['d1-bin', 'd9-sums', 'd12-deeds', 'd60-line', 'your-column'], answer: 'd200-line'},
    twists: [
      {shot: 'd1-news', thought: 'it was only a big spring tide', but: 'the Moon itself was 32,000 km closer than the night before'},
      {shot: 'news-slow', thought: 'the Moon was falling towards us', but: 'nothing falls that slowly: something is stealing its speed, loop by loop'},
      {shot: 'roche', thought: 'the Moon would hit the Earth', but: 'a moon orbits and can never fall in; it would break up long before it touched'},
      {shot: 'confront', thought: 'Nana was losing her mind on the hill at night', but: 'she worked out the final tide on Day 9, told them on Day 10, and was building the refuge alone'},
      {shot: 'leaves', thought: 'the visitor would take the Moon away or drop it on us', but: 'it sped up until it escaped, and the Moon stayed exactly where it was left'},
    ],
    heart: {want: 'Wren wants her street, her Nana and her sea to stay as they are', cost: 'she loses the street, and learns the one person everyone laughed at was telling the truth', payoff: 'page-one'},
    finalImage: 'final',
  },
  logline:
    'One evening the Moon rises a little too big over a harbour town, and the tide comes in forty centimetres too high. Ten-year-old Wren’s grandmother has kept the tide log for fifty years, and she stops letting anyone read it. A survival story told day by day, with real science.',
  tags: ['what if the moon came closer', 'moon closer to earth', 'tides', 'day 1 to day 200', 'animated story', 'science story', 'survival story', 'what if', 'tide', 'the blink files', 'kids science', 'space'],
  pinnedComment: 'Every science fact in this File is real, with sources in the description. What would you carry up the hill first?',
  fps: 30,
  style: 'cinema',
  world: {
    facts: [
      'The Moon sinks from 384,000 km to 128,000 km over 200 days and stays there; high tide at Saltmouth: D1 1.7 m, D30 2.1, D60 3.0, D90 4.7, D120 7.9, D150 15, D180 26.8, D200 35',
      'Quay Street is 1.6 m above mean sea level, Market Street 7.5 m, the chapel steps 33–40 m, the white line 35 m',
      'Power, phones and the news work throughout',
      'The visitor is never seen; the Moon never comes near the 18,000 km breaking distance',
    ],
    banLines: [
      {re: 'rings? (round|around) the earth|moon (broke|shattered|exploded)', why: 'the Moon never comes near the Roche limit in this story'},
      {re: 'power (went|is|was) out|no signal', why: 'power and phones work throughout'},
    ],
    banProps: [],
    onlySfx: [],
    banSets: [],
    presence: [],
  },
  spoilers: ['white line', 'black hole', 'visitor', 'chapel', 'bread bin', 'stopped', 'stays', 'thirty-five', '35 m', 'rounded up'],
  questionBank: 'episodes/moon02-the-moon-got-closer/world-model.md',
  narratorIs: ['Wren'],
  mainCast: [WR, NN, TS, PL],
  narratorCast: WR,
  speakerCast: SPEAKER_CAST,
  costumeByDay: false,
  noAngry: [WR, NN, TS],
  dialogueLedger: 'episodes/moon02-the-moon-got-closer/dialogue-review.md',
  shots: autoSplit(rawShots, SPEAKER_CAST, [], {sentences: true, characters: true}),
} as Episode;
