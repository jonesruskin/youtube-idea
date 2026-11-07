import type {Line, Shot, Episode} from '../../src/engine/schema';

/**
 * THE BLINK FILES · File 001 — "The Sun Went Out" (v4)
 *
 * Told by Mira Okafor, grown up, in the first person: the year she was eight and the Sun went out. She narrates
 * only what she saw or was told. Intercut, never narrated until the turn, is a second thread: a young astronomer
 * in a mountain observatory, always at night, so it reads as "now". It is 1983, and he is Mr. Ito.
 *
 * The one sentence a viewer can repeat: the shell is a telephone a civilisation at HD 219134 (a real star, 21
 * light-years away) left around our Sun long ago; in 1983 Mr. Ito saw its "call here" lines and dialled; in 2026
 * they picked up; to send us to them across 21 light-years it borrowed the Sun's whole power for one year; then it
 * showed us who they are and left an empty square for our answer. Mira answered, and the Sun came back.
 *
 * Every question a viewer can ask, and the shot that answers it: docs/12-sun01-v4-logic.md.
 * Continuity: nothing a person holds appears or vanishes. Props change hands only with give / take / put, a prop
 * put down stays in the set as an `item`, and the linter checks every cut.
 */

type G = Line['g'];
const L =
  (speaker: Line['speaker']) =>
  (text: string, pause?: number, g?: G): Line => ({speaker, text, pause, g});
const N = L('NARRATOR');
const M = L('MIRA');
const K = L('KAI');
const I = L('ITO');
const R = L('RADIO');
const MUM = L('MUM');
const MUMR = L('MUM_RADIO');
const MAN = L('MAN');
const AN = L('ANCHOR');
const SCI = L('SCIENTIST');

type Cam = [number, number, number, number, number?];
/** Camera: hold, slow push in, or move between two framings. [z, x, y] are zoom and the point centred. */
const hold = (z: number, x: number, y: number): Cam[] => [[0, z, x, y], [1, z * 1.04, x, y]];
const push = (z0: number, z1: number, x: number, y: number, x1 = x, y1 = y, r = 0): Cam[] => [[0, z0, x, y, 0], [1, z1, x1, y1, r]];
const move = (a: [number, number, number], b: [number, number, number], at = 0): Cam[] => [[at, ...a], [1, ...b]];
/** A push on a Dutch angle (roll° growing as it pushes): reserved for moments when the world tips over. */
const dutch = (z0: number, z1: number, x: number, y: number, r: number): Cam[] => [[0, z0, x, y, r * 0.55], [1, z1, x, y, r]];

const Y = 'you'; // Kai
const MI = 'mira';
const IT = 'ito';
const YI = 'itoYoung';
const MU = 'mum';
const B = 'biscuit';
type C = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
const c = (who: string, x: number, y: number, o: Record<string, unknown> = {}, depth = 1.2): C => ({who, x, y, depth, ...o});
type Item = {prop: string; x: number; y: number; from?: number | string; until?: number | string; rot?: number; r?: number};

/** Stage shot: a detailed set + the cast + their acting + a camera. */
const stage = (set: string, v: string, cam: Cam[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({
  scene: 'stage',
  props: {set, v, cam, cast, acts, ...extra},
});
const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});
/** The 1983 thread (internal key '1982'): unlabeled, unnarrated, always night (until the dawn). */
const y83 = (o: Partial<Shot>): Partial<Shot> => ({thread: '1982', ...o});

// ── Recurring blocking ────────────────────────────────────────────────────────────────────────────
// Kitchen: Kai by the worktop with his mug (left hand), Mira on her stool behind the table, Biscuit by the toast.
const KITCHEN = (o: {you?: object; mira?: object; dog?: object} = {}) => [
  c(Y, 640, 930, {pose: 'hold', holdL: 'mug', facing: 'right', ...o.you}),
  c(MI, 1180, 930, {pose: 'sitDraw', seat: 'stool', seatLift: 118, hold: 'sunDrawing', facing: 'left', ...o.mira}),
  c(B, 980, 930, {pose: 'sit', ...o.dog}),
];
const TOAST: Item = {prop: 'toast', x: 1010, y: 772};
const CHALK: Item = {prop: 'chalk', x: 1100, y: 766, rot: 82};
const MUG: Item = {prop: 'mug', x: 955, y: 768};
const AFTER_DRAW = {toast: 'gone', drawingUntil: 0};
// The roof on Day 0: what was put down stays put.
const ROOF_BAG: Item = {prop: 'bag', x: 1225, y: 817};
const ROOF_CASE: Item = {prop: 'tubeCase', x: 700, y: 880, rot: 12};
const ROOF_TORCH: Item = {prop: 'torch', x: 1085, y: 893, rot: 8};
const ROOF_ITEMS = [ROOF_BAG, ROOF_CASE, ROOF_TORCH];
// The flat's ham radio (x 1380) and its hand mic on the desk
const MIC_DESK: Item = {prop: 'mic', x: 1330, y: 772};
// The workshop bench (top y 715): the ham radio at x 820, Mr. Ito's bag at 1200
const MIC_BENCH: Item = {prop: 'mic', x: 900, y: 708};
const BAG_BENCH: Item = {prop: 'bag', x: 1210, y: 632};
const COLD = {outfit: 'cold', breath: true};
const TUNNEL100 = [
  c('extra:30', 300, 900, {outfit: 'cold', pose: 'carry', facing: 'right'}),
  c('extra:31', 520, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate'}),
  c(Y, 980, 900, {outfit: 'cold', facing: 'right'}),
  c(MI, 1100, 900, {outfit: 'cold', facing: 'left'}),
  c('extra:33', 1400, 900, {outfit: 'cold', pose: 'pour', facing: 'left'}),
  c('extra:34', 1650, 900, {outfit: 'cold', facing: 'left'}),
];
const TUNNEL = [
  c('extra:30', 300, 900, {outfit: 'cold', pose: 'carry', facing: 'right'}),
  c('extra:31', 520, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate'}),
  c(MI, 980, 900, {outfit: 'cold', facing: 'right'}),
  c(Y, 1100, 900, {outfit: 'cold', facing: 'left'}),
  c('extra:33', 1400, 900, {outfit: 'cold', pose: 'pour', facing: 'left'}),
  c('extra:34', 1650, 900, {outfit: 'cold', facing: 'left'}),
];
// the 1983 desk: he sits facing the light table / the key
const DESK = (o: object = {}) => [c(YI, 1210, 920, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', ...o})];
// Day 365 on the surface: everyone together, left to right Kai, Mira, Mum, Mr. Ito
const SURF367 = (o: {you?: object; mira?: object; mum?: object; ito?: object} = {}) =>
  SURF({...o, ito: {hold: undefined, ...o.ito}, mira: {hold: 'sunDrawing', ...o.mira}});
const SURF = (o: {you?: object; mira?: object; mum?: object; ito?: object} = {}) => [
  c(Y, 800, 940, {...COLD, hoodUp: true, facing: 'right', ...o.you}),
  c(MI, 920, 940, {...COLD, facing: 'right', ...o.mira}),
  c(MU, 1040, 940, {outfit: 'cold', breath: true, facing: 'right', ...o.mum}),
  c(IT, 1280, 940, {...COLD, facing: 'left', hold: 'ear', ...o.ito}),
  c(B, 680, 940, {pose: 'sit'}),
];

const shots: Shot[] = [
  // ══ COLD OPEN · 1983, unlabeled ══════════════════════════════════════════════════════════════
  sh('obs-key', sc('closeup', {v: 'morse', taps: [0.3, 0.9, 1.08, 1.7, 1.88, 2.06]}), y83({
    chapter: 'The last morning',
    cue: 'y1982',
    min: 2.5,
    action: 'Night. Lamplight. A hand in a brown wool cuff taps a Morse key: one… two-two… three-three-three.',
  })),

  // ══ THE LAST MORNING · 6:51 ═════════════════════════════════════════════════════════════════
  sh('kitchen-morning', stage('kitchen', 'sun', push(1.12, 1.28, 960, 560), KITCHEN({you: {expr: 'sleepy'}, mira: {hold: 'chalk'}}), [
    {at: 0.6, who: Y, pose: 'relaxed', expr: 'smile'},
    {at: 'l0+0.6', who: B, look: [0.4, -1]},
  ], {toast: 'gone', items: [TOAST]}), {
    hud: {place: 'OUR KITCHEN', time: '6:51 AM'},
    cue: 'morning',
    transition: 'flash',
    action: 'A sunlit kitchen. Kai yawns over a mug. Mira draws at the table. Biscuit sits very politely beside the toast.',
    lines: [N('I was eight the summer the Sun went out.')],
  }),
  sh('mira-draws', stage('kitchen', 'sun', push(2.0, 2.2, 1130, 570), KITCHEN({mira: {hold: 'chalk', expr: 'focused'}}).slice(1), [
    {at: 0.2, who: MI, put: 'table', prop: 'chalk'},
    {at: 1.0, who: MI, take: 'table', prop: 'sunDrawing'},
    {at: 1.9, who: MI, pose: 'sitShow', expr: 'laugh', facing: 'front'},
  ], {toast: 'gone', drawingUntil: 1.4, items: [TOAST, {...CHALK, from: 0.6}]}), {
    beats: ['heart'],
    min: 3.4,
    lead: 1.0,
    action: 'Close on Mira. She puts her crayon down, picks up her drawing of the Sun and holds it up, proud.',
    lines: [N('I was drawing the Sun.', 0.5)],
  }),
  sh('kai-yawn', stage('kitchen', 'sun', push(2.6, 2.8, 640, 620), KITCHEN({mira: {pose: 'sitShow', facing: 'front', expr: 'smile'}}), [{at: 0.2, who: Y, look: [1, 0.2]}], {...AFTER_DRAW, items: [TOAST, CHALK]}), {
    action: 'Kai, sleepy, squints at her over his mug.',
    lines: [K('Who draws at six in the morning?')],
  }),
  sh('artists', stage('kitchen', 'sun', push(2.8, 3.0, 1180, 650), KITCHEN({mira: {pose: 'sitShow', facing: 'front', expr: 'smile'}}), [
    {at: 'l0', who: MI, expr: 'laugh'},
    {at: 'l0+0.7', who: MI, pose: 'sitDraw', facing: 'left'},
  ], {...AFTER_DRAW, items: [TOAST, CHALK]}), {
    beats: ['laugh'],
    action: 'Mira, admiring her own work.',
    lines: [M('Artists.')],
  }),
  sh('dog-eyes', stage('kitchen', 'sun', push(2.1, 2.35, 1080, 760), KITCHEN().slice(1), [{at: 0.4, who: B, look: [0.4, -1]}, {at: 1.2, who: B, wag: 1}], {...AFTER_DRAW, items: [TOAST, CHALK]}), {
    beats: ['laugh'],
    dev: 'Biscuit plots against the toast',
    action: 'Close on Biscuit. His eyes slide slowly toward the toast on the edge of the table.',
    lines: [N('And Biscuit was planning a crime.')],
  }),
  sh('world-beach', stage('montage', 'beach', push(1.0, 1.18, 1000, 620), [c('extra:56', 1000, 712, {pose: 'reach', facing: 'right', expr: 'laugh', outfit: 'home'}, 1.0)], [{at: 0, who: 'extra:56', loop: 'bounce', dur: 4}]), {
    hud: {place: 'SYDNEY', time: '3:51 PM'},
    transition: 'whip',
    action: 'Sydney, mid-afternoon. A surfer stands up on the wave of her life.',
    lines: [N('At that moment, half the world was in sunlight.')],
  }),
  sh('world-field', stage('montage', 'field', push(1.1, 1.25, 900, 640), [c('extra:62', 900, 930, {pose: 'hold', facing: 'right', outfit: 'home'}, 1.3)], [{at: 0.5, who: 'extra:62', pose: 'lookUp', expr: 'focused', look: [0.5, -1]}]), {
    hud: {place: 'TAMIL NADU', time: '11:21 AM'},
    transition: 'whip',
    min: 2.0,
    action: 'A paddy field before noon. A farmer straightens up and squints at the sky.',
  }),
  sh('world-bus', stage('montage', 'bus', push(1.0, 1.1, 900, 600), [c('extra:17', -150, 960, {facing: 'right', outfit: 'home', expr: 'determined'}, 1.4)], [{at: 0, who: 'extra:17', to: 1000, gait: 'run', dur: 1.4}, {at: 1.5, who: 'extra:17', expr: 'sad', pose: 'reach'}], {busGo: 1.55}), {
    hud: {place: 'MANILA', time: '1:51 PM'},
    transition: 'whip',
    beats: ['laugh'],
    min: 3.0,
    action: 'A boy sprints for his school bus. The doors close on his nose and it pulls away without him.',
  }),
  sh('toast-steal', stage('kitchen', 'sun', push(1.7, 2.1, 900, 700), KITCHEN({mira: {pose: 'sitDraw'}}), [
    {at: 0.3, who: B, pose: 'beg'},
    {at: 'l0+0.4', who: B, to: 1060, gait: 'run', dur: 0.5},
    {at: 'l0+0.95', who: B, take: 'table', prop: 'toast', dur: 0.6},
    {at: 'l0', who: Y, expr: 'surprised', pose: 'point', keep: true},
  ], {...AFTER_DRAW, items: [{...TOAST, until: 'l0+1.25'}, CHALK]}), {
    transition: 'whip',
    beats: ['laugh'],
    action: 'Back in the kitchen, Biscuit rises on his back legs and snatches the toast. Kai points, outraged.',
    lines: [K('Biscuit, no!')],
  }),
  sh('lights-out', stage('kitchen', 'dark', hold(1.7, 900, 700), KITCHEN({you: {pose: 'point', expr: 'surprised', keepPose: true}, mira: {expr: 'surprised'}, dog: {pose: 'stand', x: 1060, hold: 'toast'}}), [
    {at: 0.75, who: Y, pose: 'flinch', expr: 'scared', look: [-1, -0.3]},
    {at: 0.85, who: MI, pose: 'sitChair', expr: 'scared', look: [-1, -0.4]},
    {at: 1.0, who: B, pose: 'sit', look: [-0.6, -0.6]},
  ], {snap: true, ...AFTER_DRAW, items: [CHALK]}), {
    min: 2.6,
    sfx: 'powercut',
    cue: 'silence',
    dev: 'the Sun goes out',
    action: 'Mid-snatch, the sunlight drains out of the room from the window. Everyone freezes in the blue dark. Biscuit still has the toast.',
    lines: [N('Then the Sun went out.', 0.6)],
  }),
  sh('dark-beach', stage('montage', 'beach', hold(1.18, 1000, 620), [c('extra:56', 1000, 712, {pose: 'reach', facing: 'right', expr: 'surprised', outfit: 'home'}, 1.0)], [], {dark: 0}), {
    min: 1.1,
    action: 'Sydney: the same wave, the same surfer, under sudden stars.',
  }),
  sh('dark-field', stage('montage', 'field', push(1.45, 1.6, 900, 690), [c('extra:62', 900, 930, {pose: 'lookUp', facing: 'right', outfit: 'home', expr: 'scared'}, 1.3)], [], {dark: 0}), {
    min: 1.1,
    action: 'Tamil Nadu: the paddy goes black at noon.',
  }),
  sh('dark-bus', stage('montage', 'bus', hold(1.1, 900, 600), [c('extra:17', 1000, 960, {facing: 'right', outfit: 'home', expr: 'scared', pose: 'reach'}, 1.4)], [], {dark: 0, noBus: true}), {
    min: 1.1,
    action: 'Manila: the boy at the empty bus stop, in the dark.',
  }),
  sh('stars-at-breakfast', stage('kitchen', 'dark', push(1.3, 1.45, 600, 590), [
    c(MI, 430, 930, {facing: 'back', hold: 'sunDrawing'}),
    c(Y, 760, 930, {facing: 'back', holdL: 'mug'}),
  ], [
    {at: 0.2, who: MI, to: 470, dur: 0.8, facing: 'back'},
    {at: 'l0+1.2', who: MI, put: 'pocket', prop: 'sunDrawing'},
  ], {windowStars: true, ...AFTER_DRAW, items: [CHALK]}), {
    beats: ['wow'],
    min: 3.2,
    action: 'At the window: stars over the city at breakfast time. Mira folds her drawing into her pocket.',
    lines: [M('Is it night again?', 0.3)],
  }),
  sh('seven', stage('kitchen', 'dark', push(2.2, 2.4, 780, 600, 900, 610), [c(MI, 470, 930, {facing: 'back'}), c(Y, 760, 930, {facing: 'front', expr: 'scared', holdL: 'mug'})], [
    {at: 'l0', who: Y, look: [-0.5, -0.6]},
    {at: 'l0+0.9', who: Y, to: 900, dur: 0.9, facing: 'right'},
    {at: 'l0+1.9', who: Y, put: 'table', prop: 'mug', left: true},
  ], {...AFTER_DRAW, items: [CHALK, {...MUG, from: 'l0+2.3'}]}), {
    min: 3.4,
    action: 'Kai turns from the window and puts his mug down on the table, without looking at it.',
    lines: [K("It's seven in the morning.", 0.4)],
  }),
  sh('lights-work', stage('kitchen', 'dark', move([1.25, 900, 600], [1.18, 940, 580]), [
    c(MI, 470, 930, {facing: 'right', expr: 'scared'}),
    c(Y, 900, 930, {facing: 'left', expr: 'worried'}),
    c(B, 1060, 930, {pose: 'sit', hold: 'toast'}),
  ], [
    {at: 0.2, who: Y, to: 850, dur: 0.5},
    {at: 0.95, who: Y, pose: 'reach', look: [-0.4, -0.5]},
    {at: 1.6, who: MI, look: [1, -1], expr: 'surprised'},
    {at: 2.0, who: Y, look: [0.6, -1], expr: 'surprised'},
  ], {lampOn: 1.3, ...AFTER_DRAW, items: [CHALK, MUG]}), {
    dev: 'the power still works: it is not a blackout',
    lead: 1.7,
    action: 'Kai flicks the light switch. The kitchen lamp comes on, warm and ordinary. The window stays full of stars.',
    lines: [N("The lights still worked. The Sun didn't.")],
  }),
  sh('knock', stage('apartment', 'door', push(1.3, 1.45, 1250, 620), [c(MI, 860, 930, {facing: 'right', expr: 'scared'}), c(Y, 1000, 930, {facing: 'right', expr: 'worried'})], [{at: 0.5, who: Y, look: [1, 0], expr: 'surprised'}], {doorOpen: false, knock: true}), {
    action: 'Three hard knocks rattle the front door.',
    lines: [N('Then someone knocked. Three times.')],
  }),
  sh('ito-door', stage('apartment', 'door', push(1.45, 1.6, 1230, 600), [
    c(MI, 860, 930, {facing: 'right', expr: 'scared'}),
    c(Y, 1000, 930, {facing: 'right', expr: 'surprised'}),
    c(IT, 1590, 930, {facing: 'left', hold: 'torchOff', pose: 'hold', holdL: 'bag', outfit: 'home', expr: 'determined'}),
  ], [{at: 'l0+0.4', who: MI, look: [1, -0.3]}], {doorOpen: true}), {
    dev: 'Mr. Ito arrives, already prepared',
    action: 'The door opens on Mr. Ito from upstairs: fully dressed, shoes on, a torch in one hand and a packed canvas bag in the other.',
    lines: [I('Good morning. Shoes on, please. Both of you.')],
  }),
  sh('from-upstairs', stage('apartment', 'door', push(2.3, 2.5, 1560, 600), [c(IT, 1590, 930, {facing: 'left', hold: 'torchOff', pose: 'hold', holdL: 'bag', outfit: 'home', expr: 'neutral'})], [{at: 'l0+0.8', who: IT, look: [-0.6, 0.2]}], {doorOpen: true}), {
    action: 'Close on Ito, calm in the torchlight.',
    lines: [N('Mr. Ito, from upstairs. He was seventy-three, and he was never in a hurry.')],
  }),
  sh('packed', stage('apartment', 'door', push(2.4, 2.7, 1560, 800, 1540, 840), [c(IT, 1590, 930, {facing: 'left', hold: 'torchOff', pose: 'hold', holdL: 'bag', outfit: 'home'})], [{at: 0.3, who: IT, look: [-0.4, 0.4]}], {doorOpen: true}), {
    action: 'Close on the canvas bag in his hand: worn straps, a luggage tag, packed tight.',
    lines: [N("His bag was already packed. It had been packed for years.")],
  }),
  sh('and-the-dog', stage('apartment', 'door', push(2.4, 2.7, 1500, 560), [c(IT, 1590, 930, {facing: 'left', outfit: 'home', pose: 'hold', hold: 'torchOff', expr: 'smile', holdL: 'bag'}), c(B, 1300, 930, {hold: 'toast'})], [
    {at: 'l0+0.4', who: B, pose: 'beg', wag: 1},
  ], {doorOpen: true}), {
    beats: ['laugh'],
    action: 'Ito nods past them at Biscuit, who still has the toast in his mouth.',
    lines: [I('And bring the dog. He has your toast.', 0, 'point')],
  }),
  sh('title', sc('title'), {
    min: 3.6,
    cue: 'title',
    beats: ['loop'],
    action: 'Title: THE SUN WENT OUT.',
    lines: [N('It took me a year to understand why.', 0.8)],
  }),

  // ══ HOUR ONE · the street, the world ═══════════════════════════════════════════════════════
  sh('street-phones', stage('street', 'night', move([1.0, 960, 430], [1.12, 960, 600]), [
    c('extra:69', 380, 960, {pose: 'pointUp', facing: 'right', expr: 'scared', look: [0.3, -1], keepPose: true}),
    c('extra:7', 560, 960, {pose: 'reachUp', hold: 'phoneLit', expr: 'worried', look: [0, -1]}),
    c(Y, 860, 960, {pose: 'lookUp', expr: 'worried', look: [0, -1]}),
    c(MI, 960, 960, {pose: 'lookUp', expr: 'worried', look: [0.2, -1]}),
    c(IT, 1120, 960, {outfit: 'home', hold: 'torchOff', pose: 'hold', holdL: 'bag', facing: 'left'}),
    c('extra:12', 1300, 960, {pose: 'handsOnHead', expr: 'scared', look: [0, -1]}),
    c('extra:9', 1560, 960, {pose: 'lookUp', hold: 'phoneLit', expr: 'surprised', look: [-0.2, -1]}),
  ], [
    {at: 0.4, who: 'extra:12', to: 1760, gait: 'run', dur: 1.6},
    {at: 'l0', who: 'extra:69', loop: 'bounce', dur: 1.2},
  ]), {
    chapter: 'Hour one',
    cue: 'unease',
    transition: 'whip',
    dev: 'the city pours into the street',
    action: 'Outside, the street is full. Pyjamas and work clothes, every phone held up to a starry sky.',
    lines: [N('Outside, the whole street was looking up.')],
  }),
  sh('eclipse-shout', stage('street', 'night', push(2.1, 2.4, 400, 760), [
    c('extra:69', 380, 960, {pose: 'pointUp', facing: 'right', expr: 'surprised', speaker: 'MAN', keepPose: true}),
    c('extra:7', 560, 960, {pose: 'hold', hold: 'phoneLit', expr: 'worried'}),
  ], [{at: 'l0+0.5', who: 'extra:7', look: [-1, 0]}]), {
    action: 'A man in a dressing gown shouts at the sky.',
    lines: [MAN("It's just an eclipse!")],
  }),
  sh('polite', stage('street', 'night', push(2.4, 2.6, 1060, 640), [c(MI, 960, 960, {facing: 'right', expr: 'worried'}), c(IT, 1120, 960, {outfit: 'home', hold: 'torchOff', pose: 'hold', holdL: 'bag', facing: 'left', expr: 'neutral'})], [{at: 'l0+0.2', who: MI, look: [1, -0.4], expr: 'surprised'}]), {
    beats: ['laugh'],
    dev: 'not an eclipse',
    action: 'Ito, unimpressed, to Mira.',
    lines: [I("Eclipses are polite. They're over in seven minutes.")],
  }),
  sh('news-hour1', sc('news', {v: 'world', headline: 'THE SUN HAS GONE DARK', ticker: 'FLIGHTS GROUNDED WORLDWIDE · STOCK MARKETS SUSPENDED · AUTHORITIES URGE CALM', panels: [
    {place: 'TOKYO', time: '2:52 PM', kind: 'crowd'},
    {place: 'CAIRO', time: '8:52 AM', kind: 'market'},
    {place: 'FRANKFURT AIRPORT', time: '7:52 AM', kind: 'airport'},
    {place: 'NEW YORK', time: '1:52 AM', kind: 'sleep'},
  ]}), {
    cue: 'news',
    dev: 'the whole planet, at the same moment',
    action: 'On every phone in the street: a news channel, four live feeds. Tokyo crowds in the dark at 2:52 PM. Cairo. A grounded airport. New York, asleep.',
    lines: [N('It was happening everywhere, at the same moment.', 0.3)],
  }),
  sh('news-ny', sc('news', {v: 'anchor', inset: 'sleep', headline: 'NEW YORK: CITY SLEEPS THROUGH IT', ticker: 'IT IS 1:52 AM ON THE US EAST COAST · MOST AMERICANS ARE ASLEEP'}), {
    action: 'The anchor, and beside her a feed of New York at night: dark windows, a city asleep.',
    lines: [N('In New York, it was two in the morning.', 0.3)],
  }),
  sh('news-woke', sc('news', {v: 'world', plain: true, panels: [
    {place: 'NEW YORK', time: '7:00 AM', kind: 'sleep'},
    {place: 'LAGOS', time: '7:30 AM', kind: 'crowd'},
    {place: 'SÃO PAULO', time: '7:15 AM', kind: 'prayer'},
    {place: 'SEOUL', time: '3:00 PM', kind: 'protest'},
  ]}), {
    beats: ['wow'],
    action: 'The feeds again, hours later: alarm clocks ringing in black bedrooms, crowds in the streets.',
    lines: [N('Most of them woke up to a morning that never came.', 0.4)],
  }),
  sh('roof-order', stage('street', 'night', push(2.2, 2.4, 1040, 640), [c(MI, 960, 960, {facing: 'right', expr: 'worried'}), c(Y, 860, 960, {facing: 'right', expr: 'worried'}), c(IT, 1120, 960, {outfit: 'home', hold: 'torchOff', pose: 'hold', holdL: 'bag', facing: 'left'})], [{at: 'l0+0.6', who: Y, look: [0.3, -1]}]), {
    action: 'Ito turns to Kai and nods up at the roof of their building.',
    lines: [I('Up to the roof. Kai, bring my telescope.', 0, 'up')],
  }),
  sh('six-floors', stage('stairs', 'climb', move([1.2, 300, 580], [1.25, 160, 540]), [
    c(IT, -60, 680, {outfit: 'home', hold: 'torchOff', pose: 'hold', holdL: 'bag', facing: 'left'}),
    c(Y, 420, 940, {pose: 'carry', hold: 'tubeCase', facing: 'left', expr: 'sleepy'}),
    c(MI, 560, 940, {facing: 'left', expr: 'smile'}),
  ], [
    {at: 0, who: IT, to: [-440, 600], dur: 3.0},
    {at: 0, who: Y, to: [60, 800], dur: 3.6},
    {at: 0.4, who: Y, loop: 'pant', dur: 3},
    {at: 0, who: MI, to: [240, 880], dur: 3.4},
  ]), {
    beats: ['laugh'],
    dev: 'they take the telescope up to the roof',
    action: 'The stairwell, sixth floor. Ito climbs ahead with the torch. Kai hauls the heavy telescope case, puffing. Mira skips behind.',
    lines: [N('Kai carried it up six floors. He complained about every one.')],
  }),
  sh('roof-arrive', stage('roof', 'night', move([1.0, 960, 560], [1.1, 1000, 590]), [
    c(Y, 760, 900, {pose: 'carry', hold: 'tubeCase', facing: 'right', expr: 'sleepy'}),
    c(MI, 880, 900, {facing: 'right'}),
    c(IT, 1150, 900, {outfit: 'home', hold: 'torch', pose: 'hold', holdL: 'bag', facing: 'right'}),
    c(B, 600, 900, {pose: 'sit'}),
  ], [
    {at: 0.4, who: IT, put: 'floor', prop: 'bag', left: true},
    {at: 0.9, who: Y, put: 'floor', prop: 'tubeCase'},
    {at: 'l0+0.4', who: IT, look: [0.8, -0.6]},
  ], {telescope: 'none', items: [{...ROOF_BAG, from: 0.8}, {...ROOF_CASE, from: 1.3}]}), {
    cue: 'curious',
    dev: 'Mr. Ito watches every sunrise from this roof',
    action: 'The roof. Ito sets his bag down; Kai drops the case with a groan. Ito looks east, where the Sun rose an hour ago.',
    lines: [N('Mr. Ito came up here every morning to watch the sunrise.')],
  }),
  sh('roof-setup', stage('roof', 'night', push(1.4, 1.55, 1180, 620), [
    c(B, 600, 900, {pose: 'sit'}),
    c(Y, 760, 900, {facing: 'right', expr: 'sleepy'}),
    c(MI, 880, 900, {facing: 'right'}),
    c(IT, 1150, 900, {outfit: 'home', hold: 'torch', pose: 'hold', facing: 'right'}),
  ], [
    {at: 0.1, who: IT, put: 'floor', prop: 'torch'},
    {at: 0.9, who: IT, pose: 'reach', expr: 'focused'},
  ], {telescope: 'setup', setupAt: 0.9, items: [ROOF_BAG, ROOF_CASE, {...ROOF_TORCH, from: 0.5}]}), {
    action: 'He sets the torch on the ground and builds the brass telescope with quick, sure hands.',
    lines: [N('That morning, he had seen the last one.', 0.3), I('Venus first.')],
  }),
  sh('venus', sc('sky', {v: 'venus'}), {
    action: 'Low in the east, one bright point still shining: Venus.',
    lines: [M('Why is that one still on?')],
  }),
  sh('mirror', sc('diagram', {v: 'lightDelay', step: 0}), {
    action: 'Diagram: the Sun as a dark question mark, Venus catching its light and passing it on to Earth.',
    lines: [I("Venus has no light of its own. It's the Sun's light, coming the long way round.")],
  }),
  sh('ito-predict', stage('roof', 'night', push(2.6, 3.0, 1130, 560), [c(MI, 880, 900, {facing: 'right'}), c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'left', expr: 'focused'})], [{at: 'l0+1.2', who: IT, look: [0.2, 0.7]}], {items: ROOF_ITEMS}), {
    dev: 'Ito predicts Venus will go dark',
    action: 'Ito, eyes on his watch.',
    lines: [I('If it happened at the Sun, Venus goes out at seven-oh-four.')],
  }),
  sh('the-wait', stage('roof', 'night', move([1.2, 900, 620], [1.3, 960, 640]), [
    c(Y, 760, 900, {pose: 'sit', facing: 'right'}),
    c(MI, 880, 900, {pose: 'sitHug', facing: 'right', expr: 'sleepy'}),
    c(B, 1000, 900, {pose: 'lie'}),
    c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'left'}),
  ], [{at: 0.8, who: Y, look: [0.3, 0.9], watchGlow: 1}], {items: ROOF_ITEMS}), {
    min: 2.6,
    beats: ['heart'],
    callout: {text: '7:03', at: 0.6, pos: 'top'},
    action: 'They sit on the roof and wait. Kai checks his watch: 7:03.',
    lines: [N('So we waited.', 1.0)],
  }),
  sh('venus-out', sc('sky', {v: 'venusOut'}), {
    science: {text: 'Venus near the far side of the Sun: sunlight needs ~361 s to reach it and ~860 s more to cross 1.72 AU back to us, versus 499 s straight from the Sun, so it fades ~12 minutes after the Sun (6:52 → 7:04).', source: 'Calculation from 1 AU = 149.6 million km, c = 299,792 km/s, Venus orbit 0.72 AU (NASA JPL planetary fact sheets)'},
    cue: 'reveal',
    sfx: 'decloak',
    min: 2.4,
    beats: ['wow'],
    dev: 'Venus goes dark late',
    callout: {text: '7:04', at: 0.9, pos: 'top'},
    action: 'At four minutes past seven, Venus flickers and goes out.',
  }),
  sh('at-the-sun', stage('roof', 'night', push(3.2, 3.6, 1150, 540), [c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'front', expr: 'surprised'})], [{at: 'l0+0.6', who: IT, look: [0.4, -0.8]}], {items: ROOF_ITEMS}), {
    cue: 'sting',
    twist: 1,
    beats: ['loop'],
    callout: {text: 'AT THE SUN', at: 'l0+0.4'},
    dev: 'it happened at the Sun, not near Earth',
    action: 'Ito, very quietly.',
    lines: [I('Then it happened at the Sun.', 0.4)],
  }),
  sh('jupiter-predict', sc('diagram', {v: 'jupiter'}), {
    science: {text: 'Jupiter is 5.2 AU from the Sun; light needs ~43 minutes to reach it and ~37 more to reach us when it is 4.5 AU away: about 72 minutes after the Sun.', source: 'NASA Jupiter fact sheet (nssdc.gsfc.nasa.gov)'},
    callout: {text: '8:04', at: 'l0+1.4'},
    action: 'Diagram: Jupiter, far out. A long light path. A clock.',
    lines: [I('Jupiter is further out. Eight-oh-four.')],
  }),
  sh('jupiter-out', sc('sky', {v: 'jupiterOut'}), {
    sfx: 'decloak',
    dev: 'Jupiter goes dark on schedule',
    action: 'Jupiter, centred in the telescope crosshairs, winks out.',
    lines: [N('At four minutes past eight, it did.', 0.4)],
  }),
  sh('three-taps', stage('roof', 'night', push(2.3, 2.55, 1150, 660), [c(MI, 930, 900, {outfit: 'home', facing: 'right', look: [1, -0.6], expr: 'focused'}), c(IT, 1150, 900, {pose: 'reach', outfit: 'home', facing: 'right', expr: 'neutral'})], [{at: 0.2, who: IT, loop: 'tap', dur: 1.2}], {items: ROOF_ITEMS}), {
    action: 'Ito taps the telescope three times, the way he always does.',
    lines: [N('He tapped the telescope three times. He always did that. I never asked why.')],
  }),

  // ── 1983 #1 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-dish', stage('observatory', 'dish', push(1.0, 1.12, 960, 520), [c(YI, 760, 860, {facing: 'right', outfit: 'home', pose: 'lookUp'}, 0.5)], [{at: 1.4, who: YI, look: [0.6, -1]}], {turn: true}), y83({
    cue: 'y1982',
    transition: 'fade',
    min: 3.0,
    action: 'A small dome on a dark mountain. Beside it a radio dish turns toward one bright star.',
  })),
  sh('obs-room-1', stage('observatory', 'room', push(1.1, 1.25, 1250, 620), DESK({pose: 'sitChair', expr: 'focused'}), [{at: 0.5, who: YI, pose: 'sitPoint', expr: 'focused'}]), y83({
    min: 2.8,
    action: 'A small observatory at night. A young man with round glasses bends over a light table.',
  })),
  sh('obs-plate', sc('closeup', {v: 'plate', circle: 1.2}), y83({
    min: 2.9,
    beats: ['loop'],
    action: 'An old eclipse plate under a magnifier. One faint line through the corona, far too straight. A red pen circles it.',
  })),

  // ══ THE FIRST DAY · shops, and Mum ══════════════════════════════════════════════════════════
  sh('radio-news', sc('closeup', {v: 'radio'}), {
    chapter: 'The first day',
    cue: 'unease',
    transition: 'fade',
    dev: 'the phones go down',
    action: 'Ito’s battery radio on the kitchen table.',
    lines: [R('Phone networks are down across the city. Please stay indoors.')],
  }),
  sh('kai-shops', stage('apartment', '', push(2.0, 2.2, 1100, 620), [c(Y, 1000, 930, {facing: 'right', expr: 'worried'}), c(IT, 1250, 930, {facing: 'left', holdL: 'bag'})], [{at: 'l0+0.5', who: IT, look: [-1, 0]}]), {
    action: 'Kai, already pulling on his shoes.',
    lines: [K("Everyone's going to the shops.")],
  }),
  sh('so-are-we', stage('apartment', '', push(2.0, 2.2, 1130, 620), [c(Y, 1000, 930, {facing: 'right', expr: 'worried'}), c(IT, 1250, 930, {facing: 'left', holdL: 'bag', expr: 'determined'})], [
    {at: 0.1, who: IT, take: 'bag', prop: 'list'},
    {at: 'l0+0.4', who: IT, give: Y, prop: 'list'},
    {at: 'l0+1.4', who: Y, look: [0.3, 0.6], expr: 'focused'},
  ]), {
    min: 3.4,
    lead: 0.8,
    action: 'Ito takes a folded list out of his bag and hands it to Kai.',
    lines: [I('Then so are we.')],
  }),
  sh('day1-rush', stage('street', 'rush', push(1.0, 1.1, 960, 560), [
    c('extra:2', 200, 960, {facing: 'right'}),
    c('extra:4', 420, 960, {facing: 'right', hold: 'bottle'}),
    c('extra:6', 640, 960, {facing: 'right'}),
    c(Y, 900, 960, {facing: 'right', hold: 'list'}),
    c(MI, 1010, 960, {facing: 'right'}),
    c('extra:8', 1250, 960, {facing: 'right'}),
    c('extra:10', 1480, 960, {facing: 'right', hold: 'rice'}),
  ], [
    {at: 0, who: 'extra:2', to: 1300, gait: 'run', dur: 3},
    {at: 0, who: 'extra:4', to: 1500, gait: 'run', dur: 3.4},
    {at: 0, who: 'extra:6', to: 1700, gait: 'run', dur: 3},
    {at: 0.2, who: Y, to: 1500, gait: 'run', dur: 3.2},
    {at: 0.2, who: MI, to: 1620, gait: 'run', dur: 3.2},
    {at: 0, who: 'extra:8', to: 2100, gait: 'run', dur: 2.6},
    {at: 0, who: 'extra:10', to: 2200, gait: 'run', dur: 2.8},
  ]), {
    hud: {place: 'HARBOUR STREET', time: '9:30 AM'},
    cue: 'work',
    transition: 'whip',
    dev: 'the race for supplies',
    action: 'The whole street runs the same way, in summer clothes under streetlights: toward the supermarket.',
    lines: [N('Kai was right. The whole city had the same idea.')],
  }),
  sh('grab', stage('market', 'grab', push(1.1, 1.25, 960, 600), [
    c(Y, 700, 940, {pose: 'push', facing: 'right', hold: 'list'}),
    c('extra:14', 1420, 940, {pose: 'reach', facing: 'left'}),
    c('extra:15', 1700, 940, {pose: 'carry', hold: 'rice', facing: 'left'}),
  ], [
    {at: 0, who: Y, to: 1000, dur: 1.4},
    {at: 'l0+0.2', who: Y, pose: 'hold', expr: 'focused'},
  ], {trolley: true}), {
    action: 'Half-empty shelves. Kai steers a trolley, reading Ito’s list.',
    lines: [K('Candles. Rice. Batteries. Water.')],
  }),
  sh('treats', stage('market', 'grab', push(1.9, 2.2, 1100, 720), [
    c(Y, 1000, 940, {pose: 'hold', facing: 'right', expr: 'surprised', hold: 'list'}),
    c(MI, 1400, 940, {pose: 'carry', hold: 'treats', facing: 'left', expr: 'smile'}),
    c(B, 1140, 940, {}),
  ], [
    {at: 0, who: MI, to: 1290, dur: 1},
    {at: 'l0+0.3', who: B, pose: 'beg', wag: 1},
  ]), {
    beats: ['laugh'],
    action: 'Mira marches back with an armful of dog treats. Biscuit loses his mind.',
    lines: [M("They're on Biscuit's list.")],
  }),
  sh('last-heater', stage('market', 'heater', push(1.6, 1.9, 1000, 700), [
    c('extra:24', 860, 940, {pose: 'push', facing: 'right', expr: 'angry'}),
    c('extra:26', 1140, 940, {pose: 'push', facing: 'left', expr: 'angry'}),
  ], [
    {at: 0.3, who: 'extra:24', loop: 'shake', dur: 2},
    {at: 0.3, who: 'extra:26', loop: 'shake', dur: 2},
  ], {heaterBox: true}), {
    beats: ['laugh'],
    action: 'Two grown men in a tug-of-war over the last electric heater.',
    lines: [N('Two grown men fought over the last electric heater.')],
  }),
  sh('theyll-learn', stage('market', 'grab', push(2.4, 2.6, 1200, 640), [c(IT, 1200, 940, {facing: 'left', holdL: 'bag', expr: 'neutral'})], [{at: 'l0+1.4', who: IT, look: [0.6, 0.4]}]), {
    beats: ['laugh'],
    action: 'Ito watches the fight, deadpan.',
    lines: [I("Heaters need electricity. They'll learn.")],
  }),

  // ── Mum: 7 PM, St Anne's, across the river ──────────────────────────────────────────────────
  sh('hosp-call', stage('hospital', 'lit', push(1.9, 2.1, 1380, 620), [
    c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'worried'}),
    c('extra:90', 700, 930, {facing: 'right', hold: 'blanket', pose: 'carry'}),
  ], [{at: 0, who: 'extra:90', to: 300, dur: 3}, {at: 'l0+1.0', who: MU, expr: 'neutral'}]), {
    hud: {place: "ST ANNE'S HOSPITAL", time: '7:00 PM'},
    cue: 'warm',
    transition: 'fade',
    dev: 'Mum is a nurse across the river, and she calls by radio',
    action: 'A hospital corridor turned shelter. At the nurses’ station, a nurse in scrubs holds the mic of an old ham radio.',
    lines: [MUM('Kai? It’s Mum. Can you hear me?')],
  }),
  sh('apt-answer', stage('apartment', '', push(1.7, 1.9, 1240, 640), [
    c(MI, 1090, 930, {facing: 'right', expr: 'surprised'}),
    c(Y, 1230, 930, {facing: 'right', expr: 'surprised'}),
    c(IT, 1600, 930, {facing: 'left', holdL: 'bag', expr: 'neutral'}),
  ], [
    {at: 0.1, who: Y, take: 'desk', prop: 'mic'},
    {at: 0.75, who: Y, pose: 'think'},
    {at: 'l0+0.6', who: MI, to: 1130, dur: 0.5},
  ], {ham: true, hamOn: true, items: [{...MIC_DESK, until: 0.5}]}), {
    lead: 0.7,
    action: 'Their flat, that evening. Mr. Ito’s ham radio crackles on the desk. Kai grabs the mic.',
    lines: [K('Mum! Are you okay?')],
  }),
  sh('hosp-bridges', stage('hospital', 'lit', push(2.3, 2.5, 1470, 600), [c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'smile'})], [{at: 'l0+1.6', who: MU, expr: 'worried', look: [-0.6, 0.2]}]), {
    action: 'Mum, tired, smiling at the sound of him.',
    lines: [MUM("I'm fine, love. But I can't come home yet.")],
  }),
  sh('hosp-wide', stage('hospital', 'lit', move([1.0, 900, 560], [1.08, 1000, 580]), [
    c('extra:91', 260, 930, {facing: 'right', pose: 'carry', hold: 'blanket'}),
    c('extra:92', 640, 930, {facing: 'left', pose: 'kneel'}),
    c(MU, 1480, 930, {facing: 'left', hold: 'mic'}),
  ], [{at: 0, who: 'extra:91', to: 520, dur: 2.6}]), {
    dev: 'the hospital has become a shelter',
    action: 'Wide: every bed full, cots lining the corridor, people under blankets as far as the doors.',
    lines: [MUM('The whole city is coming here. They need every nurse.')],
  }),
  sh('apt-when', stage('apartment', '', push(2.2, 2.4, 1170, 640), [c(MI, 1130, 930, {facing: 'right', expr: 'sad'}), c(Y, 1230, 930, {facing: 'right', hold: 'mic', expr: 'worried'})], [{at: 'l0+1.2', who: Y, look: [-0.8, 0.2]}], {ham: true, hamOn: true}), {
    action: 'Mira leans in to the mic in Kai’s hand.',
    lines: [M('When are you coming home?')],
  }),
  sh('hosp-soon', stage('hospital', 'lit', push(2.6, 2.8, 1470, 590), [c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'sad'})], [{at: 'l0', who: MU, expr: 'smile'}]), {
    beats: ['heart'],
    action: 'Mum closes her eyes for a second, then makes her voice bright.',
    lines: [MUM("Soon. I'll call every night at seven. Stay with Mr. Ito.")],
  }),
  sh('every-night', stage('apartment', '', push(1.6, 1.75, 1300, 640), [
    c(MI, 1130, 930, {facing: 'right', expr: 'sad'}),
    c(Y, 1230, 930, {facing: 'right', hold: 'mic', expr: 'sad'}),
    c(IT, 1600, 930, {facing: 'left', holdL: 'bag', expr: 'sad'}),
  ], [
    {at: 'l0+0.3', who: Y, put: 'desk', prop: 'mic'},
    {at: 'l0+1.4', who: IT, look: [-1, 0.3]},
  ], {ham: true, items: [{...MIC_DESK, from: 'l0+0.7'}]}), {
    dev: 'the nightly calls',
    action: 'Kai hangs the mic back on the radio. Ito, by the window, watching them.',
    lines: [N('She called every night at seven. We never missed one.')],
  }),
  sh('is-it-dead', stage('apartment', '', push(2.4, 2.6, 940, 640), [
    c(MI, 820, 930, {pose: 'sit', facing: 'right', expr: 'sleepy'}),
    c(Y, 960, 930, {pose: 'sit', facing: 'right', expr: 'worried'}),
  ], [{at: 'l0', who: Y, look: [1, -0.3]}], {ham: true, items: [MIC_DESK]}), {
    timeJump: true,
    action: 'Later. Kai and Mira on the rug. Kai finally asks it.',
    lines: [K('Is the Sun… dead?', 0.3)],
  }),
  sh('if-dead', sc('diagram', {v: 'tide', step: 0}), {
    action: 'Diagram: the Moon tugs a bulge of ocean toward it. The hidden Sun tugs too.',
    lines: [I("If the Sun were gone, its pull would be gone too.")],
  }),
  sh('a-third', sc('diagram', {v: 'tide', step: 1}), {
    science: {text: 'The Sun’s tide-raising force is about 46% of the Moon’s; at spring tide the two add up, so without the Sun the tidal range would fall by roughly a third.', source: 'NOAA Ocean Service, ‘Tides and Water Levels’ tutorial'},
    callout: {text: '−33%', at: 'l0+1.6'},
    action: 'The Sun’s bulge is removed: the tide shrinks by a third.',
    lines: [I("And tomorrow's tide would be a third smaller.")],
  }),
  sh('go-look', stage('apartment', '', push(2.1, 2.3, 1060, 620), [c(MI, 820, 930, {pose: 'sit', facing: 'right', expr: 'sleepy'}), c(Y, 960, 930, {pose: 'sit', facing: 'right'}), c(IT, 1200, 930, {facing: 'left', holdL: 'bag'})], [
    {at: 0.1, who: IT, take: 'bag', prop: 'tideTable'},
    {at: 0.8, who: Y, pose: 'stand'},
    {at: 'l0+0.3', who: IT, give: Y, prop: 'tideTable'},
  ], {ham: true, items: [MIC_DESK]}), {
    dev: 'Ito sends them to check the tide',
    min: 3.2,
    lead: 0.9,
    action: 'Ito takes an old tide table out of his bag and hands it to Kai.',
    lines: [I('Go and look. High tide is at eleven.')],
  }),

  // ══ DAY 1 · the tide ═══════════════════════════════════════════════════════════════════════
  sh('harbour', stage('harbor', 'freeze', move([1.0, 820, 540], [1.12, 900, 560]), [
    c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'torch', holdL: 'tideTable', facing: 'right'}),
    c(MI, 580, 940, {...COLD, facing: 'right'}),
  ]), {
    chapter: 'Day 1',
    hud: {day: 1, temp: 8},
    cue: 'wonder',
    transition: 'fade',
    action: 'Day 1. The harbour. Torchlight on boats and black water.',
    lines: [N('So the next morning, Kai and I walked down to the harbour.')],
  }),
  sh('gauge', sc('closeup', {v: 'gauge'}), {
    action: 'The torch finds the painted tide gauge. The water sits exactly on Ito’s pencilled mark.',
    lines: [M("It's right on the line!")],
  }),
  sh('still-there', stage('harbor', 'freeze', push(2.4, 2.6, 720, 620), [c(MI, 580, 940, {...COLD, facing: 'right'}), c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'hold', holdL: 'tideTable', facing: 'right', expr: 'surprised'})], [{at: 'l0+0.8', who: Y, look: [0.4, -0.8]}]), {
    action: 'Kai stares at the tide table, then up.',
    lines: [K("So the Sun's still there.")],
  }),
  sh('where-is-it', stage('harbor', 'freeze', push(2.8, 3.0, 580, 700), [c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'hold', holdL: 'tideTable', facing: 'right'}), c(MI, 580, 940, {...COLD, facing: 'front', expr: 'worried', pose: 'lookUp'})], [{at: 'l0+0.6', who: MI, look: [0, -1]}]), {
    action: 'Mira looks up at the black sky.',
    lines: [M('Then where is it?', 0.3)],
  }),
  sh('in-front', stage('harbor', 'freeze', move([1.55, 660, 700], [1.7, 660, 660]), [
    c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'hold', holdL: 'tideTable', facing: 'right'}),
    c(MI, 580, 940, {...COLD, facing: 'right', pose: 'lookUp'}),
  ]), {
    cue: 'sting',
    twist: 2,
    beats: ['loop'],
    callout: {text: 'STILL THERE', at: 'l0+0.8', pos: 'top'},
    dev: 'the Sun is still there; something is in front of it',
    action: 'The two of them, tiny at the edge of the freezing harbour, staring at where the Sun should be.',
    lines: [N("The Sun hadn't gone anywhere. Something was in front of it.", 0.5)],
  }),
  sh('fish', sc('closeup', {v: 'fishIce'}), {
    science: {text: 'Ice floats and insulates the water below it, so seas freeze from the top and stay liquid underneath for a very long time.', source: 'National Snow and Ice Data Center, ‘All About Sea Ice’'},
    beats: ['heart', 'laugh'],
    action: 'Mira’s mitten points down through a thin skin of new ice: under it, a fish glides past in the torch beam.',
    lines: [M("The sea's growing a skin. The fish don't mind!")],
  }),

  // ══ DAY 2 · the world finds it ═══════════════════════════════════════════════════════════════
  sh('press', sc('news', {v: 'press', headline: 'OBJECT FOUND AROUND THE SUN', ticker: 'SPACE AGENCIES CONFIRM INFRARED SIGHTING · "NOT A NATURAL OBJECT" · UN SECURITY COUNCIL MEETS'}), {
    chapter: 'Day 2',
    hud: {day: 2, temp: 2},
    cue: 'news',
    transition: 'fade',
    dev: 'the world finds the shell by its heat',
    action: 'Day 2. A press conference. Behind the scientist, an infrared image: a warm ring where the Sun should be.',
    lines: [AN('Infrared telescopes have found something around the Sun.')],
  }),
  sh('press-sci', sc('news', {v: 'press', headline: 'OBJECT FOUND AROUND THE SUN', ticker: 'SPACE AGENCIES CONFIRM INFRARED SIGHTING · "NOT A NATURAL OBJECT" · UN SECURITY COUNCIL MEETS'}), {
    dev: 'it is warm, round and twice the Sun’s width',
    action: 'The scientist at the podium, the warm ring behind her.',
    lines: [SCI("It's warm. It's round. And it's twice as wide as the Sun.", 0.3)],
  }),
  sh('shell-reveal', sc('space', {v: 'shellReveal'}), {
    science: {text: 'Anything that absorbs starlight must give off waste heat as infrared; this is how astronomers search for Dyson spheres.', source: 'Freeman Dyson, ‘Search for Artificial Stellar Sources of Infrared Radiation’, Science (1960)'},
    reveal: 'shell',
    letterbox: true,
    beats: ['wow'],
    sfx: 'impact',
    cue: 'shell',
    action: 'Pull back from where the Sun should be: a colossal sphere of dark slats wrapped around the star, faintly glowing at the seams.',
    lines: [N('There was something around the Sun.')],
  }),
  sh('a-shell', sc('space', {v: 'shellOrbit'}), {
    twist: 3,
    letterbox: true,
    callout: {text: 'A SHELL', at: 'l0+0.2'},
    dev: 'it is a shell around the Sun',
    action: 'The camera glides around the shell. Each of its slats is wider than Earth.',
    lines: [N('A shell. Wrapped around a star.', 0.8)],
  }),
  sh('panic', sc('news', {v: 'world', headline: 'WORLD REACTS', ticker: 'MILITARIES ON ALERT · CHURCHES, MOSQUES AND TEMPLES OPEN ALL NIGHT · PANIC BUYING IN 140 COUNTRIES', panels: [
    {place: 'ROME', time: 'DAY 2', kind: 'prayer'},
    {place: 'LONDON', time: 'DAY 2', kind: 'protest'},
    {place: 'NORAD', time: 'DAY 2', kind: 'radar'},
    {place: 'MUMBAI', time: 'DAY 2', kind: 'market'},
  ]}), {
    dev: 'global panic',
    action: 'The feeds: candlelit prayer in Rome, protests in London, radar rooms, a stampede for rice in Mumbai.',
    lines: [AN('Governments are asking everyone to stay calm.'), N('Nobody was calm.', 0.4)],
  }),
  sh('tv-ask', stage('apartment', '', push(1.5, 1.65, 980, 640), [
    c(MI, 700, 930, {...COLD, pose: 'sit', facing: 'right', expr: 'worried'}),
    c(Y, 820, 930, {...COLD, pose: 'sit', facing: 'right', expr: 'worried'}),
    c(IT, 1220, 930, {...COLD, facing: 'left', expr: 'sad'}),
  ], [{at: 'l0+0.4', who: MI, look: [1, -0.3]}], {tv: 'news'}), {
    cue: 'mystery',
    action: 'Their flat. The news on the little TV. Mira turns from it to Mr. Ito.',
    lines: [M('Mr. Ito, who built it?')],
  }),
  sh('bedtime', stage('apartment', '', push(1.9, 2.1, 1120, 620), [c(MI, 700, 930, {...COLD, pose: 'sit', facing: 'right', expr: 'worried'}), c(Y, 820, 930, {...COLD, pose: 'sit', facing: 'right', expr: 'worried'}), c(IT, 1220, 930, {...COLD, facing: 'left', expr: 'sad'})], [
    {at: 0.1, who: IT, to: 1080, dur: 0.8},
    {at: 0.9, who: IT, pose: 'reach'},
    {at: 'l0+0.6', who: IT, look: [0, 0.6]},
  ], {tv: 'news', tvOff: 1.2}), {
    lead: 1.3,
    dev: 'Ito avoids the question',
    action: 'Ito crosses to the TV and switches it off. He does not look at her.',
    lines: [I("It's bedtime, Mira.")],
  }),
  sh('four-pm', stage('apartment', '', push(2.6, 2.8, 720, 660), [c(Y, 820, 930, {...COLD, pose: 'sit', facing: 'right', expr: 'worried'}), c(MI, 700, 930, {...COLD, pose: 'sit', facing: 'right', expr: 'surprised'})], [{at: 'l1', who: MI, expr: 'worried', look: [1, -0.2]}], {tv: 'news', tvOff: 0}), {
    beats: ['loop'],
    action: 'Mira, in the dark. The clock says four in the afternoon.',
    lines: [N('It was four in the afternoon.', 0.3), N("He'd never sent me to bed before.", 0.4)],
  }),

  // ══ DAY 3 · the aurora ═══════════════════════════════════════════════════════════════════════
  sh('aurora', sc('sky', {v: 'aurora'}), {
    chapter: 'Day 3',
    hud: {day: 3, temp: -4},
    transition: 'fade',
    cue: 'wonder',
    science: {text: 'Coronal mass ejections take roughly 1 to 4 days to reach Earth, so particles already on their way would still arrive after the light was gone.', source: 'NOAA Space Weather Prediction Center, ‘Coronal Mass Ejections’'},
    beats: ['wow'],
    dev: 'the Sun’s last storm arrives',
    action: 'The whole sky ignites: green and violet curtains over the frozen city.',
    lines: [R('…a solar storm that left the Sun four days ago, arriving tonight.')],
  }),
  sh('goodbye', stage('roof', 'aurora', push(2.6, 3.1, 880, 580), [c(MI, 880, 900, {...COLD, facing: 'front', expr: 'awe', pose: 'lookUp'})], [{at: 'l0+0.4', who: MI, expr: 'sad'}]), {
    beats: ['heart'],
    action: 'Mira, face lit green, watching.',
    lines: [M("It's saying goodbye.", 0.6)],
  }),

  // ── 1983 #2 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-room-2', stage('observatory', 'room', push(1.15, 1.3, 480, 560), [c(YI, 760, 920, {facing: 'left', outfit: 'home'})], [{at: 0.2, who: YI, to: 560, dur: 1.0}, {at: 1.2, who: YI, pose: 'reach'}, {at: 2.2, who: YI, look: [-0.6, -0.8]}], {plates: true}), y83({
    cue: 'y1982',
    transition: 'fade',
    min: 3.0,
    action: 'The young astronomer studies three plates pinned to the wall beside a star chart.',
  })),
  sh('obs-chart', sc('closeup', {v: 'chart'}), y83({
    min: 3.2,
    action: 'Red lines, extended from each plate, meet at one faint star on the chart. He writes 21 beside it.',
  })),

  // ══ DAY 7 · the grid ═══════════════════════════════════════════════════════════════════════
  sh('grid-fail', sc('city', {v: 'gridFail'}), {
    science: {text: 'Estimates for a sunless Earth: around −18 °C average after a week, around −73 °C after a year.', source: 'Live Science, ‘What would happen if the sun disappeared?’'},
    chapter: 'Day 7',
    hud: {day: 7, temp: -18},
    cue: 'tension',
    transition: 'fade',
    dev: 'the grid collapses',
    sfx: 'powercut',
    action: 'The city from above. Districts go dark one after another, rolling toward their street.',
    lines: [N('On Day 7, the power went out.')],
  }),
  sh('grid-world', sc('globe', {v: 'gridDown', day: 7}), {
    dev: 'the whole world goes dark',
    action: 'Earth’s night side from orbit: the lights of whole countries fading out.',
    lines: [N('Not just ours. All over the world, the grids gave out.')],
  }),
  sh('seal-room', stage('apartment', 'seal', push(1.15, 1.35, 900, 560), [
    c(Y, 780, 930, {pose: 'tape', hold: 'tape', facing: 'back', outfit: 'cold'}),
    c(MI, 1080, 930, {pose: 'holdBoth', outfit: 'cold', facing: 'left'}),
    c(B, 1220, 930, {pose: 'lie'}),
  ], [{at: 0.4, who: Y, loop: 'scratch', dur: 1.6}, {at: 'l0+1.8', who: Y, put: 'pocket', prop: 'tape'}], {blankets: 'going-up'}), {
    dev: 'they build a warm room',
    action: 'Blankets taped over the windows of one room. Mira holds the corner while Kai tapes.',
    lines: [N('Mr. Ito showed us how to make one warm room.')],
  }),
  sh('freezer', stage('apartment', 'balcony', push(1.3, 1.5, 1100, 620), [c(Y, 880, 930, {facing: 'right', outfit: 'cold'})], [
    {at: 0.1, who: Y, take: 'floor', prop: 'bottle'},
    {at: 0.9, who: Y, to: 1180, dur: 1.2},
    {at: 2.1, who: Y, put: 'table', prop: 'bottle'},
    {at: 'l0+0.4', who: Y, expr: 'smile'},
  ], {items: [{prop: 'bottle', x: 935, y: 935, until: 0.5}, {prop: 'bottle', x: 1262, y: 696, from: 2.5}]}), {
    beats: ['laugh'],
    min: 3.4,
    action: 'Kai carries the milk from the dead freezer out onto the frosted balcony and lines it up with the rest.',
    lines: [K('Free fridge. Finally, some good news.')],
  }),
  sh('candles', stage('apartment', 'candle', push(1.4, 1.6, 980, 620), [
    c(Y, 860, 930, {...COLD, pose: 'kneel'}),
    c(MI, 1080, 930, {...COLD, pose: 'sitHug', expr: 'cold'}),
    c(IT, 1320, 930, {...COLD, pose: 'sitChair', seat: 'chair', facing: 'left'}),
  ], [
    {at: 0.1, who: Y, take: 'pocket', prop: 'match'},
    {at: 'l0+1.2', who: Y, put: 'floor', prop: 'match'},
    {at: 'l0+1.9', who: Y, expr: 'focused'},
  ], {candles: 'lighting', items: [{prop: 'match', x: 905, y: 928, from: 'l0+1.6', rot: 80, r: 50}]}), {
    action: 'Kai strikes a match, lights the candles, shakes it out.',
    lines: [N("That night, Kai pretended he wasn't scared.")],
  }),
  sh('hand', sc('closeup', {v: 'hands'}), {
    beats: ['heart'],
    action: 'Close in candlelight: Kai’s hand clamped round Mira’s mitten, knuckles pale.',
    lines: [N('He was holding my hand too hard.', 0.5)],
  }),
  sh('smoke', stage('stairs', 'smoke', dutch(1.4, 1.8, 960, 640, -5), [c(Y, 900, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'worried'})], [{at: 'l0', who: Y, look: [1, 0.5]}]), {
    dev: 'a fire next door',
    sfx: 'crash',
    action: 'Torch beam in the stairwell. Grey smoke curls out from under a neighbour’s door.',
    lines: [N('Then we smelled smoke.')],
  }),
  sh('furniture', stage('stairs', 'smoke', push(1.6, 1.8, 900, 680), [c(IT, 760, 940, {...COLD, facing: 'right', expr: 'worried'}), c(Y, 900, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'scared'})], [{at: 0.3, who: Y, to: 1000, dur: 1}]), {
    action: 'The torch finds door 3B: firelight flickering underneath, smoke pouring out.',
    lines: [I("They're burning furniture. Indoors.")],
  }),
  sh('invisible', stage('stairs', 'smoke', dutch(2.6, 3.0, 800, 600, 6), [c(Y, 1000, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'scared'}), c(IT, 800, 940, {...COLD, facing: 'front', expr: 'determined'})], [{at: 'l0+1.6', who: IT, look: [-0.6, 0.4]}]), {
    science: {text: 'Burning fuel indoors produces carbon monoxide, which is colourless and odourless; it is a leading cause of winter poisonings.', source: 'US CDC, ‘Carbon Monoxide Poisoning’'},
    callout: {text: 'INVISIBLE', at: 'l0+1.6'},
    action: 'Ito, in the smoke, suddenly very loud.',
    lines: [I("Everyone out! It's the gas you can't see.", 0, 'point')],
  }),
  sh('evacuate', stage('stairs', 'evac', move([1.2, 700, 600], [1.2, 1300, 640]), [
    c(IT, 120, 940, {...COLD, facing: 'right'}),
    c(MI, 250, 940, {...COLD, facing: 'right', expr: 'scared'}),
    c(Y, 400, 940, {...COLD, hold: 'torch', pose: 'hold', facing: 'right'}),
    c(B, 520, 940, {}),
    c('extra:40', 700, 940, {...COLD, facing: 'right', pose: 'coverMouth'}),
    c('extra:41', 860, 940, {...COLD, facing: 'right', hold: 'blanket'}),
    c('extra:42', -120, 940, {...COLD, facing: 'right', pose: 'coverMouth', expr: 'scared'}),
    c('extra:44', -300, 940, {...COLD, facing: 'right', hold: 'candles'}),
  ], [
    {at: 0, who: 'extra:40', to: 1900, gait: 'run', dur: 2.4},
    {at: 0, who: 'extra:41', to: 2050, gait: 'run', dur: 2.5},
    {at: 0, who: 'extra:42', to: 900, gait: 'run', dur: 2.8},
    {at: 0, who: 'extra:44', to: 700, dur: 3.0},
    {at: 0, who: Y, to: 1500, gait: 'run', dur: 2.6},
    {at: 0, who: MI, to: 1350, gait: 'run', dur: 2.6},
    {at: 0, who: IT, to: 1150, dur: 2.8},
    {at: 0, who: B, to: 1700, gait: 'run', dur: 2.2},
  ]), {
    cue: 'chase',
    action: 'Down the stairs: neighbours coughing into their sleeves, Kai with the torch, Mira at his heels, Ito banging on doors, Biscuit ahead.',
    lines: [N('Mr. Ito got the whole floor out.')],
  }),
  sh('biscuit-bolts', stage('snowstreet', 'door', dutch(1.3, 1.6, 900, 640, -6), [
    c(Y, 760, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right', expr: 'scared'}),
    c(B, 980, 960, {}),
  ], [
    {at: 0.3, who: B, to: 2200, gait: 'run', dur: 1.4},
    {at: 'l0+0.2', who: Y, pose: 'reach', expr: 'scared'},
  ], {wind: 1}), {
    dev: 'Biscuit runs away',
    sfx: 'whoosh',
    action: 'The street door bangs open into a wall of wind and snow. Biscuit bolts into the dark. Kai lunges, torch swinging.',
    lines: [N('At the street door, Biscuit panicked.')],
  }),
  sh('mira-shouts', stage('snowstreet', 'door', dutch(2.4, 2.9, 660, 560, 7), [c(Y, 760, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'hold', facing: 'right', expr: 'scared'}), c(MI, 620, 960, {...COLD, facing: 'right', expr: 'scared', pose: 'reach'})], [{at: 0, who: MI, loop: 'shiver', dur: 3}], {wind: 1}), {
    midroll: true,
    beats: ['loop'],
    action: 'Mira screams his name into the storm. Nothing comes back.',
    lines: [M('BISCUIT!', 1.0)],
  }),

  // ══ DAY 8 · the search ═════════════════════════════════════════════════════════════════════
  sh('hosp-biscuit', stage('hospital', 'lit', push(2.3, 2.5, 1470, 600), [c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'focused'})], [{at: 'l1', who: MU, expr: 'smile'}]), {
    chapter: 'Day 8',
    hud: {day: 8, temp: -21},
    cue: 'warm',
    transition: 'fade',
    action: 'Day 8, seven o’clock. Mum at the hospital radio, in the same scrubs, more tired.',
    lines: [MUM('Mira, listen to me. Biscuit is a clever dog.')],
  }),
  sh('warm-places', stage('apartment', 'warm', push(2.4, 2.6, 1100, 650), [c(MI, 1090, 930, {...COLD, facing: 'right', hold: 'mic', expr: 'sad'})], [{at: 'l0+0.8', who: MI, expr: 'focused', look: [0.6, -0.3]}], {ham: true, hamOn: true}), {
    action: 'In the warm room, Mira clutches the mic, listening.',
    lines: [MUMR('Clever dogs find warm places.', 0.4)],
  }),
  sh('where-warm', stage('apartment', 'warm', push(2.0, 2.2, 1160, 640), [
    c(MI, 1090, 930, {...COLD, facing: 'right', hold: 'mic', expr: 'focused'}),
    c(Y, 1230, 930, {...COLD, facing: 'left', expr: 'worried'}),
  ], [{at: 'l0+0.4', who: MI, look: [1, -0.2]}, {at: 'l1+0.3', who: Y, expr: 'surprised'}], {ham: true, hamOn: true}), {
    dev: 'Mira works out where to look',
    action: 'Mira turns to Kai.',
    lines: [M('Kai. What’s warm out there?'), K('…The metro. The vents.', 0.3)],
  }),
  sh('day8-search', stage('snowstreet', 'search', move([1.1, 700, 560], [1.2, 1100, 600]), [c(Y, 300, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right', expr: 'worried'})], [{at: 0, who: Y, to: 1300, dur: 4}]), {
    cue: 'search',
    dev: 'the search',
    action: 'Kai walks the frozen street alone with a torch. Buried cars. Silent snow.',
    lines: [K('Biscuit! Come on, boy!')],
  }),
  sh('always-night', stage('snowstreet', 'search', push(1.8, 2.2, 800, 640), [c(Y, 800, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'left', expr: 'sad'})], [{at: 'l0+0.5', who: Y, facing: 'right', look: [1, 0]}]), {
    action: 'Kai turns on the spot, sweeping the torch. Nothing.',
    lines: [N('Kai searched all night. Then again, it was always night now.')],
  }),
  sh('bark', stage('snowstreet', 'search', push(2.8, 3.2, 800, 580), [c(Y, 800, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right', expr: 'surprised'})], [{at: 0.6, who: Y, turn: 0.8}], {woof: 0.35}), {
    min: 2.2,
    beats: ['laugh'],
    action: 'Somewhere far off, a single bark (a little "WOOF!" pops out of the dark). Kai’s head snaps round.',
  }),
  sh('pawprints', sc('closeup', {v: 'pawprints'}), {
    dev: 'paw prints',
    action: 'The torch beam finds a line of fresh paw prints in the snow.',
    lines: [N('Paw prints. Fresh ones.')],
  }),
  sh('vent', stage('snowstreet', 'vent', push(1.0, 1.3, 1200, 600), [c(Y, 500, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right'})], [{at: 0, who: Y, to: 1050, gait: 'run', dur: 2}]), {
    action: 'The prints lead across the street to a cloud of steam rising from a metro entrance.',
    lines: [N('They led to the only warm thing on the street.')],
  }),
  sh('found', stage('snowstreet', 'vent', push(2.2, 2.6, 1440, 840), [c(Y, 1150, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right'}), c(B, 1480, 960, {pose: 'lie', wag: 0.2})], [
    {at: 0.4, who: B, pose: 'stand', wag: 1},
    {at: 0.5, who: Y, to: 1330, dur: 0.8},
    {at: 1.3, who: Y, put: 'floor', prop: 'torch'},
    {at: 2.0, who: Y, pose: 'kneelHug', expr: 'laugh'},
  ], {items: [{prop: 'torch', x: 1300, y: 955, from: 1.7, rot: -6}]}), {
    cue: 'warm',
    beats: ['heart'],
    dev: 'Biscuit found',
    min: 3.6,
    lead: 1.9,
    action: 'Biscuit is curled against the warm grate, frost on his whiskers. He sees Kai. His tail explodes. Kai drops the torch in the snow and grabs him.',
    lines: [K('You stupid, brilliant dog.')],
  }),
  sh('ground-heat', sc('diagram', {v: 'ground', step: 0}), {
    science: {text: 'A few metres underground the temperature stays close to the yearly average (about 10–16 °C in many places), whatever the weather.', source: 'US Department of Energy, ‘Geothermal Heat Pumps’'},
    callout: {text: '+10°C', at: 'l0+1'},
    beats: ['wow'],
    action: 'Cut-away of the ground: frozen surface, then the metro tunnels, then warm rock below.',
    lines: [N('A few metres down, the ground stays around ten degrees.')],
  }),
  sh('he-knew', stage('snowstreet', 'vent', move([1.2, 1100, 600], [1.35, 1350, 640]), [c(Y, 1330, 960, {...COLD, hoodUp: true, pose: 'kneelHug'}), c(B, 1480, 960, {facing: 'left'})], [
    {at: 0.2, who: Y, pose: 'stand'},
    {at: 0.5, who: Y, take: 'floor', prop: 'torch'},
    {at: 0.6, who: B, loop: 'bounce', dur: 1.2, wag: 1},
    {at: 'l0', who: Y, expr: 'smile'},
  ], {items: [{prop: 'torch', x: 1300, y: 955, rot: -6, until: 0.9}]}), {
    beats: ['heart'],
    action: 'Kai picks up his torch. Biscuit trots toward the metro stairs and looks back. Come on.',
    lines: [N("Biscuit hadn't run away. He'd found the way down.")],
  }),
  sh('follow-him', stage('metro', 'stairs', move([1.1, 900, 560], [1.15, 1000, 620]), [
    c(IT, 380, 900, {...COLD, holdL: 'bag', facing: 'right'}),
    c(MI, 600, 900, {...COLD, carriedBy: 'you'}),
    c(Y, 600, 900, {...COLD, hoodUp: true, pose: 'carry', hold: 'torch', facing: 'right'}),
    c(B, 860, 900, {}),
    c('extra:21', 160, 900, {facing: 'right', outfit: 'cold', hold: 'torch'}),
    c('extra:22', 0, 900, {facing: 'right', outfit: 'cold'}),
  ], [
    {at: 0, who: Y, to: 1300, dur: 3.2},
    {at: 0, who: IT, to: 1080, dur: 3.4},
    {at: 0, who: B, to: 1560, dur: 3},
    {at: 0, who: 'extra:21', to: 860, dur: 3.4},
    {at: 0, who: 'extra:22', to: 700, dur: 3.4},
  ]), {
    cue: 'warm',
    dev: 'the city moves underground',
    action: 'Down the metro stairs: Kai carrying Mira on his back, Ito with his bag, and behind them a line of torches.',
    lines: [N('By morning, half the street had followed him underground.')],
  }),
  sh('refuges', sc('news', {v: 'world', plain: true, panels: [
    {place: 'MONTRÉAL', time: 'DAY 9', kind: 'refuge'},
    {place: 'MOSCOW METRO', time: 'DAY 10', kind: 'refuge'},
    {place: 'TOKYO', time: 'DAY 9', kind: 'refuge'},
    {place: 'HELSINKI', time: 'DAY 12', kind: 'refuge'},
  ]}), {
    science: {text: 'Montréal’s underground city (RÉSO) links about 32 km of tunnels; Helsinki has a large network of civil-defence shelters dug into bedrock.', source: 'Tourisme Montréal, ‘The Underground City (RÉSO)’; City of Helsinki civil defence shelters'},
    dev: 'cities everywhere go underground',
    action: 'Feeds from around the world: tents in metro halls, families on escalators, shelters cut into rock.',
    lines: [N('All over the world, cities moved underground.')],
  }),

  // ══ DAY 30 · the station town ══════════════════════════════════════════════════════════════
  sh('day30-city', stage('metro', 'city', move([1.0, 960, 540], [1.12, 1060, 560]), TUNNEL, [
    {at: 0, who: 'extra:30', to: 800, dur: 3},
    {at: 0.5, who: 'extra:34', to: 1500, dur: 2},
    {at: 'l0+0.6', who: MI, look: [1, -0.2]},
  ]), {
    chapter: 'Day 30',
    hud: {day: 30, temp: -35},
    cue: 'tunnel',
    transition: 'fade',
    dev: 'a town underground',
    action: 'Day 30. The metro is a town: tents on the platforms, string lights, laundry lines.',
    lines: [N('By Day 30, Harbour Street station was a town.')],
  }),
  sh('farm', stage('metro', 'farm', move([1.2, 900, 600], [1.32, 1180, 600]), [
    c('extra:35', 700, 900, {outfit: 'cold', pose: 'pour', facing: 'right'}),
    c('extra:36', 1000, 900, {outfit: 'cold', pose: 'carry', facing: 'left'}),
    c('extra:305', 1320, 900, {outfit: 'cold', pose: 'hold', hold: 'treats', facing: 'right', expr: 'angry'}),
    c('extra:38', 1500, 900, {outfit: 'cold', pose: 'shrug', facing: 'left', expr: 'sleepy'}),
  ], [{at: 0.4, who: 'extra:35', loop: 'stir', dur: 2}, {at: 'l0+1.6', who: 'extra:305', loop: 'shake', dur: 1.2}]), {
    beats: ['laugh'],
    action: 'A disused tunnel full of grow lights and lettuce. A chalk menu: lettuce, lettuce, lettuce. A small kid glares at yet another lettuce.',
    lines: [N('We grew food under pink lamps. Everyone got very sick of lettuce.')],
  }),
  sh('lamp-sunrise', stage('metro', 'sunrise', move([1.0, 960, 500], [1.1, 960, 460]), [
    c('extra:36', 400, 900, {outfit: 'cold', facing: 'back'}),
    c(MI, 760, 900, {outfit: 'cold', facing: 'back'}),
    c(Y, 880, 900, {outfit: 'cold', facing: 'back'}),
    c(IT, 1040, 900, {outfit: 'cold', facing: 'back'}),
    c('extra:37', 1250, 900, {outfit: 'cold', facing: 'back'}),
    c('extra:38', 1500, 900, {outfit: 'cold', facing: 'back'}),
  ], [], {sunrise: 'l0+0.8'}), {
    cue: 'warm',
    action: 'Seven a.m. The big lamps in the station roof warm up from orange to gold.',
    lines: [N('At seven every morning, the engineers turned on the big lamps.')],
  }),
  sh('call-it-sunrise', stage('metro', 'sunrise', push(1.8, 2.1, 920, 640), [c(Y, 880, 900, {outfit: 'cold', facing: 'front', expr: 'smile'}), 
    c(MI, 760, 900, {outfit: 'cold', facing: 'front', pose: 'cheer', expr: 'laugh'}),
    c(IT, 1040, 900, {outfit: 'cold', facing: 'front', expr: 'smile'}),
  ], [{at: 0.3, who: MI, loop: 'jump', dur: 0.6}], {sunrise: 0}), {
    beats: ['heart'],
    callout: {text: 'SUNRISE', at: 'l0+0.6', pos: 'top'},
    action: 'Faces turned up into the gold light. Mira jumps. Ito smiles.',
    lines: [I("We'll call it sunrise.")],
  }),
  sh('school', stage('metro', 'school', push(1.4, 1.7, 960, 600), [
    c(MI, 760, 900, {outfit: 'cold', facing: 'right', expr: 'smile'}),
    c('extra:301', 1040, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
    c('extra:302', 1200, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
    c('extra:303', 1360, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
    c('extra:304', 1520, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
  ], [
    {at: 0.1, who: MI, take: 'pocket', prop: 'sunDrawing'},
    {at: 0.9, who: MI, pose: 'hold', expr: 'smile'},
  ]), {
    dev: 'Mira teaches the little ones, with the drawing from the last morning',
    lead: 0.9,
    action: 'In a parked carriage turned classroom, Mira (the tallest child in the room) shows four much smaller kids her drawing from the last morning.',
    lines: [M("It's yellow. And round. And it's warm on your face.")],
  }),
  sh('forgotten', stage('metro', 'school', push(2.8, 3.1, 1200, 700), [c('extra:302', 1200, 900, {outfit: 'cold', pose: 'holdBoth', facing: 'front', expr: 'sad', hold: 'drawing'})], [{at: 0.5, who: 'extra:302', loop: 'bounce', dur: 0.8}, {at: 'l0+1.4', who: 'extra:302', expr: 'worried'}]), {
    beats: ['heart'],
    action: 'A small kid holds up her own drawing: a grey sun.',
    lines: [N('Some of them had already forgotten what colour it was.', 0.6)],
  }),
  sh('keep-it', stage('metro', 'school', push(2.6, 2.8, 780, 640), [c(MI, 760, 900, {outfit: 'cold', facing: 'right', pose: 'hold', hold: 'sunDrawing', expr: 'sad'})], [
    {at: 'l0+0.4', who: MI, put: 'pocket', prop: 'sunDrawing'},
  ]), {
    action: 'Mira looks at the grey sun, then folds her own drawing carefully back into her pocket.',
    lines: [N('I kept mine in my pocket, all year.', 0.4)],
  }),
  sh('fan-club', stage('metro', 'city', push(1.9, 2.2, 1000, 760), [
    c(B, 1000, 900, {pose: 'stand', wag: 1, fat: true}),
    c('extra:55', 820, 900, {pose: 'reach', facing: 'right', expr: 'laugh'}),
    c('extra:68', 1180, 900, {pose: 'reach', facing: 'left', expr: 'smile'}),
    c('extra:85', 1340, 900, {pose: 'hold', hold: 'treats', facing: 'left', expr: 'laugh'}),
  ], [{at: 0.4, who: 'extra:85', to: 1240, dur: 0.6}], {fat: true}), {
    beats: ['laugh'],
    action: 'Biscuit, noticeably rounder, receives snacks from a ring of adoring kids.',
    lines: [N('Biscuit got a fan club. And a bigger belly.')],
  }),

  // ── 1983 #3 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-letter', sc('closeup', {v: 'letter'}), y83({
    cue: 'y1982',
    transition: 'fade',
    min: 3.0,
    action: 'A typed letter under the lamp: the Council cannot support further observations, nor any transmission. His thumb covers the name.',
  })),
  sh('obs-phone', stage('observatory', 'room', push(1.5, 1.7, 1560, 600), DESK({x: 1640, pose: 'sitPhone', hold: 'receiver', expr: 'sad', facing: 'right'}), [{at: 1.6, who: YI, expr: 'sad', look: [0.2, 0.6]}], {phoneUp: true}), y83({
    min: 3.2,
    action: 'The receiver at his ear. Down the line, a colleague laughs. He says nothing.',
  })),

  // ══ DAY 40 · the photograph ════════════════════════════════════════════════════════════════
  sh('ws-ask', stage('metro', 'workshop', push(1.7, 1.9, 940, 640), [
    c(Y, 700, 900, {outfit: 'cold', facing: 'right'}),
    c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'determined'}),
    c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'neutral'}),
  ], [{at: 'l0+0.6', who: IT, look: [-0.4, 0.6]}], {parts: true, ham: true, items: [MIC_BENCH, BAG_BENCH]}), {
    chapter: 'Day 40',
    hud: {day: 40, temp: -41},
    cue: 'mystery',
    transition: 'fade',
    dev: 'Mira asks again',
    action: 'Day 40. Ito’s workbench in the station, his radio and his bag on it. Mira asks the question he would not answer.',
    lines: [M('Mr. Ito. Who built it?')],
  }),
  sh('not-in-a-day', stage('metro', 'workshop', push(2.2, 2.4, 760, 620), [c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'neutral'}), c(Y, 700, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}), c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'determined'})], [{at: 'l0+0.8', who: MI, look: [1, -0.2]}], {parts: true, ham: true, items: [MIC_BENCH, BAG_BENCH]}), {
    action: 'Kai, backing her up.',
    lines: [K('Nobody builds a thing that size in a day.')],
  }),
  sh('nobody-did', stage('metro', 'workshop', push(2.4, 2.6, 1080, 620), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'determined'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'neutral'})], [
    {at: 'l0+0.6', who: IT, facing: 'right'},
    {at: 'l0+1.0', who: IT, take: 'bag', prop: 'photo'},
    {at: 'l0+2.0', who: IT, facing: 'left', look: [-0.4, 0.5]},
  ], {parts: true, ham: true, items: [MIC_BENCH, BAG_BENCH]}), {
    min: 3.6,
    action: 'Ito turns to the bag on his bench and takes out an old photograph.',
    lines: [I('No. Nobody did.', 0.3)],
  }),
  sh('photo1919', sc('closeup', {v: 'photo1919'}), {
    dev: 'Ito’s 1919 photograph shows the lines',
    action: 'An old eclipse photograph in Ito’s hand: three faint, perfectly straight lines crossing the corona.',
    lines: [I('Nineteen-nineteen. A total eclipse. Look at the lines.')],
  }),
  sh('blinds', sc('diagram', {v: 'blinds', step: 0}), {
    science: {text: "Satellites have measured the Sun's total brightness continuously since 1978. It naturally varies by about 0.1% over the 11-year solar cycle, so a screen that blocked a hundred-thousandth of its light would be lost in the noise.", source: 'NASA, ‘Solar Irradiance Datasets’ (scdi.smce.nasa.gov/solar_data_access.html); G. Kopp, Living Reviews in Solar Physics (2025)'},
    beats: ['wow'],
    action: 'A window blind with its slats open, sunlight streaming through. Beside it, the Sun in a ring of the same slats, edge-on, light pouring between them.',
    lines: [I('It was always there. Edge-on, like the slats of a blind.')],
  }),
  sh('closed-them', sc('diagram', {v: 'blinds', step: 1}), {
    twist: 4,
    sfx: 'impact',
    callout: {text: 'CLOSED', at: 'l0+1.6'},
    dev: 'the slats were turned to face the Sun',
    action: 'Every slat turns at once. The window goes dark. The Sun’s light is trapped inside.',
    lines: [I('On the morning the Sun went out, every slat turned.', 0.4)],
  }),
  sh('you-knew', stage('metro', 'workshop', push(2.6, 2.8, 900, 660), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'left', hold: 'photo'})], [{at: 'l0+0.6', who: MI, expr: 'determined'}], {parts: true, ham: true, items: [MIC_BENCH, BAG_BENCH]}), {
    action: 'Mira, sharp.',
    lines: [M("You've seen those lines before.")],
  }),
  sh('nobody-listened', stage('metro', 'workshop', push(2.6, 2.9, 1080, 600), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'sad', hold: 'photo', look: [-0.6, 0.7]})], [
    {at: 'l0+1.6', who: IT, facing: 'right'},
    {at: 'l0+1.9', who: IT, put: 'bag', prop: 'photo'},
    {at: 'l0+2.8', who: IT, look: [0.2, 0.8]},
  ], {parts: true, ham: true, items: [MIC_BENCH, BAG_BENCH]}), {
    beats: ['loop'],
    min: 4.0,
    action: 'Ito, not meeting her eyes. He puts the photograph back in the bag.',
    lines: [I('Once. A long time ago. Nobody listened.', 0.4)],
  }),
  sh('even-true', stage('metro', 'workshop', push(2.2, 2.4, 950, 640), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'right', expr: 'sad'})], [{at: 0.4, who: MI, look: [1, -0.3]}, {at: 'l0+1.6', who: MI, expr: 'sad'}], {parts: true, ham: true, items: [MIC_BENCH, BAG_BENCH]}), {
    action: 'The two of them in the lamplight. Mira watches his back.',
    lines: [N('I believed him. It was true. It just wasn’t all of it.', 0.6)],
  }),

  // ══ DAY 100 · the coldest night ═════════════════════════════════════════════════════════════
  sh('day100-flicker', stage('metro', 'city', hold(1.05, 960, 540), TUNNEL100, [{at: 'l0+1', who: MI, expr: 'scared'}], {flicker: 'l0+0.6'}), {
    chapter: 'Day 100',
    hud: {day: 100, temp: -52},
    cue: 'dread',
    transition: 'fade',
    dev: 'the generators fail',
    action: 'Day 100. The lamps flicker, buzz, and die. Darkness, then a hundred torches clicking on.',
    lines: [N('On Day 100, the generators failed.')],
  }),
  sh('ito-volunteers', stage('metro', 'dark', push(1.6, 1.9, 1100, 620), [
    c(IT, 1100, 900, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'determined'}),
    c('extra:50', 1350, 900, {...COLD, hold: 'torch', pose: 'torch', facing: 'right'}),
  ], [{at: 'l0+0.6', who: IT, to: 1420, dur: 2.4}, {at: 0.4, who: 'extra:50', to: 1700, dur: 3}]), {
    dev: 'Ito joins the engineers',
    action: 'Ito follows the engineers into the dark tunnel, torch in hand.',
    lines: [I('I know a little about old machines.')],
  }),
  sh('hosp-fading', stage('hospital', 'dark', push(2.4, 2.7, 1470, 600), [c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'worried'})], [{at: 'l1', who: MU, expr: 'scared'}]), {
    dev: 'Mum’s call breaks up',
    action: 'The hospital by lantern light, the generators failing there too. Mum at the radio.',
    lines: [MUM('Mira? Our generators are going too.')],
  }),
  sh('dont', stage('metro', 'workshop', push(2.1, 2.3, 790, 600), [c(Y, 700, 900, {...COLD, hoodUp: true, facing: 'right', expr: 'worried'}), c(MI, 840, 900, {...COLD, facing: 'right', hold: 'mic', expr: 'worried'})], [{at: 'l0+0.8', who: MI, expr: 'scared'}], {dark: true, ham: true, hamOn: true, items: [BAG_BENCH]}), {
    action: 'The workshop by candlelight. Mira holds the mic in both hands.',
    lines: [MUMR("If you can't hear me for a while, don't—", 0.2)],
  }),
  sh('mum-gone', stage('metro', 'workshop', push(2.2, 2.45, 800, 600), [c(Y, 700, 900, {...COLD, hoodUp: true, facing: 'right', expr: 'scared'}), c(MI, 840, 900, {...COLD, facing: 'right', pose: 'think', hold: 'mic', expr: 'scared'})], [
    {at: 'l0+0.9', who: MI, expr: 'sad', look: [-0.4, 0.4], pose: 'hold'},
    {at: 'l0+1.6', who: MI, put: 'table', prop: 'mic'},
    {at: 'l0+2.4', who: Y, look: [1, 0.2]},
  ], {dark: true, ham: true, items: [BAG_BENCH, {...MIC_BENCH, from: 'l0+2.0'}]}), {
    sfx: 'static',
    beats: ['heart'],
    min: 3.6,
    action: 'Static. Nothing. Mira sets the mic down very carefully.',
    lines: [M('Mum? Mum!', 0.8)],
  }),
  sh('cold-night', stage('metro', 'dark', push(2.0, 2.5, 980, 700), [
    c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug'}),
    c(MI, 1040, 900, {...COLD, pose: 'sitHug', expr: 'cold'}),
    c(B, 1160, 900, {pose: 'lie'}),
  ], [{at: 0.2, who: MI, loop: 'shiver', dur: 4}]), {
    action: 'Under every blanket they own, Kai and Mira shiver. Breath smoking even down here.',
    lines: [N('That was the coldest night.')],
  }),
  sh('how-it-ends', stage('metro', 'dark', push(3.0, 3.4, 940, 600), [c(MI, 1040, 900, {...COLD, pose: 'sitHug', expr: 'cold'}), c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug', facing: 'front', expr: 'sad'})], [{at: 'l0+1.2', who: Y, look: [0.8, 0.3]}]), {
    midroll: true,
    beats: ['heart', 'loop'],
    action: 'Kai’s face in the last candle light. For once, no joke.',
    lines: [K('How does this end, Mira?', 0.8)],
  }),
  sh('lights-on', stage('metro', 'dark', push(3.0, 3.3, 1040, 700), [c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug'}), c(MI, 1040, 900, {...COLD, pose: 'sitHug', facing: 'front', expr: 'determined'})], [{at: 'l0+0.4', who: MI, look: [-0.8, -0.2]}]), {
    beats: ['heart'],
    action: 'Mira, small and certain.',
    lines: [M('With the lights coming back on.', 0.6)],
  }),

  // ══ DAY 180 · the lights, and Mum ═══════════════════════════════════════════════════════════
  sh('day180-lights', stage('metro', 'sunrise', move([1.0, 960, 500], [1.1, 960, 470]), [
    c('extra:36', 400, 900, {outfit: 'cold', facing: 'front', expr: 'surprised'}),
    c(MI, 760, 900, {outfit: 'cold', facing: 'front', expr: 'surprised'}),
    c(Y, 880, 900, {outfit: 'cold', facing: 'front', expr: 'surprised'}),
    c('extra:37', 1200, 900, {outfit: 'cold', facing: 'front'}),
  ], [
    {at: 'l0+0.4', who: MI, pose: 'cheer', expr: 'laugh'},
    {at: 'l0+0.6', who: 'extra:37', pose: 'armsUp', expr: 'laugh'},
    {at: 'l0+0.7', who: Y, pose: 'cheer', expr: 'laugh'},
    {at: 'l0+0.7', who: 'extra:36', loop: 'jump', dur: 0.6},
  ], {sunrise: 0.3}), {
    chapter: 'Day 180',
    hud: {day: 180, temp: -60},
    cue: 'hope',
    transition: 'fade',
    dev: 'the lights come back',
    action: 'Day 180. The lamps blaze back on. The whole station roars.',
    lines: [N('On Day 180, Mr. Ito and the engineers got them running again.')],
  }),
  sh('hosp-walk', stage('hospital', 'dark', push(2.3, 2.5, 1470, 600), [c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'determined'})], [{at: 'l1', who: MU, look: [-0.8, -0.2]}]), {
    dev: 'Mum is alive, and coming',
    action: 'The hospital, dark and freezing. Mum, alive, at the radio, her breath smoking.',
    lines: [MUM('Kai, Mira, it’s Mum. Our power’s gone. Yours is back.')],
  }),
  sh('bringing', stage('metro', 'workshop', push(2.4, 2.6, 860, 640), [c(Y, 700, 900, {outfit: 'cold', facing: 'right', pose: 'think', hold: 'mic', expr: 'surprised'}), c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'})], [{at: 'l0+0.6', who: MI, expr: 'laugh'}], {ham: true, hamOn: true, parts: true, items: [BAG_BENCH]}), {
    beats: ['heart'],
    action: 'The workshop, lit again. Kai holds the mic. Mira’s hands fly to her mouth.',
    lines: [MUMR("So we're bringing everyone to you. Across the river.", 0.3)],
  }),
  sh('sixty-below', stage('metro', 'workshop', push(2.2, 2.4, 790, 640), [c(Y, 700, 900, {outfit: 'cold', facing: 'right', pose: 'think', hold: 'mic', expr: 'worried'}), c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'laugh'})], [{at: 'l1', who: Y, expr: 'smile'}], {ham: true, hamOn: true, parts: true, items: [BAG_BENCH]}), {
    beats: ['laugh', 'heart'],
    action: 'In the workshop, Kai has the mic. Mira is laughing and crying.',
    lines: [K("Mum, it's sixty below out there.")],
  }),
  sh('walk-fast', stage('hospital', 'dark', push(2.4, 2.6, 1470, 600), [c(MU, 1480, 930, {facing: 'left', pose: 'think', hold: 'mic', expr: 'smile'})], [{at: 'l0+0.8', who: MU, look: [-0.6, -0.2]}]), {
    beats: ['laugh'],
    action: 'Mum, grinning into the mic.',
    lines: [MUM("Then we'd better walk fast.", 0.4)],
  }),
  sh('river', stage('river', 'walk', move([1.25, 1450, 700], [1.35, 1200, 720]), [
    c(MU, 1700, 870, {outfit: 'cold', breath: true, facing: 'left', hold: 'lantern', expr: 'determined'}, 0.8),
    c('extra:93', 1880, 870, {outfit: 'cold', breath: true, facing: 'left', hold: 'lantern'}, 0.8),
    c('extra:94', 2020, 870, {outfit: 'cold', breath: true, facing: 'left', pose: 'carry', hold: 'blanket'}, 0.8),
    c('extra:95', 2160, 870, {outfit: 'cold', breath: true, facing: 'left', hold: 'lantern'}, 0.8),
  ], [
    {at: 0, who: MU, to: 1100, dur: 5},
    {at: 0, who: 'extra:93', to: 1280, dur: 5},
    {at: 0, who: 'extra:94', to: 1420, dur: 5},
    {at: 0, who: 'extra:95', to: 1560, dur: 5},
  ]), {
    cue: 'hope',
    letterbox: true,
    beats: ['wow'],
    dev: 'Mum crosses the frozen river',
    action: 'Night. The frozen river under a sky full of stars. A line of lanterns crossing the ice from the hospital: Mum leading nurses and patients.',
    lines: [N('She walked two kilometres across the ice at sixty below, with forty patients.')],
  }),
  sh('mum-returns', stage('metro', 'city', push(1.6, 1.8, 1000, 640), [
    c(Y, 640, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}),
    c(MI, 760, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}),
    c(MU, 1500, 900, {outfit: 'cold', facing: 'left', hold: 'lantern', expr: 'smile'}),
  ], [
    {at: 0, who: MU, to: 1200, dur: 1.4},
    {at: 1.3, who: MU, put: 'floor', prop: 'lantern'},
    {at: 0.4, who: MI, to: 1080, gait: 'run', dur: 0.9, expr: 'laugh'},
    {at: 0.6, who: Y, to: 950, gait: 'run', dur: 1.0, expr: 'laugh'},
    {at: 1.4, who: MI, pose: 'hug'},
    {at: 2.0, who: MU, pose: 'hug'},
  ], {items: [{prop: 'lantern', x: 1250, y: 862, from: 1.7}]}), {
    beats: ['heart'],
    letterbox: true,
    dev: 'Mum comes home',
    min: 3.4,
    action: 'A woman in a navy coat over nurse’s scrubs walks out of the tunnel with a lantern. She sets it down. Mira and Kai run.',
    lines: [N('And then she was home.', 0.8)],
  }),
  sh('mum-thanks', stage('metro', 'city', push(2.2, 2.4, 1290, 620), [c(Y, 950, 900, {outfit: 'cold', facing: 'right', expr: 'smile'}), c(MI, 1080, 900, {outfit: 'cold', facing: 'right', expr: 'smile'}), c(MU, 1200, 900, {outfit: 'cold', facing: 'right', expr: 'smile'}), c(IT, 1400, 900, {outfit: 'cold', facing: 'left', expr: 'smile'})], [{at: 'l0+1.0', who: IT, look: [-1, 0.3]}], {items: [{prop: 'lantern', x: 1250, y: 862}]}), {
    action: 'Mum turns to Ito, grease-stained and grinning.',
    lines: [MUM('You kept them alive.')],
  }),
  sh('they-kept-me', stage('metro', 'city', push(2.8, 3.0, 1400, 600), [c(MU, 1200, 900, {outfit: 'cold', facing: 'right', expr: 'smile'}), c(IT, 1400, 900, {outfit: 'cold', facing: 'left', expr: 'smile'})], [{at: 'l0+0.8', who: IT, look: [-0.8, 0.6]}], {items: [{prop: 'lantern', x: 1250, y: 862}]}), {
    beats: ['heart'],
    action: 'Ito, quietly.',
    lines: [I('They kept me alive.', 0.4)],
  }),
  sh('an-ear', stage('metro', 'workshop', push(2.0, 2.2, 920, 640), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'focused'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'left', pose: 'holdBoth', hold: 'ear'})], [{at: 'l0+0.6', who: IT, look: [-0.2, 0.5]}], {ham: true, parts: true, items: [BAG_BENCH]}), {
    timeJump: true,
    dev: 'Ito builds "an ear"',
    action: 'Later. Ito at his bench with wires and a little dish. Mira leans in.',
    lines: [M('What are you building?')],
  }),
  sh('ear', stage('metro', 'workshop', push(2.8, 3.0, 1060, 600), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'focused'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'front', pose: 'holdBoth', hold: 'ear', expr: 'neutral'})], [{at: 'l0+0.4', who: IT, look: [0.3, -0.6]}], {ham: true, parts: true, items: [BAG_BENCH]}), {
    beats: ['loop'],
    action: 'Ito, holding it up, eyes on the ceiling as if he can see through it.',
    lines: [I('Something to listen with.', 0.4)],
  }),

  // ══ DAY 300 · the beam ═════════════════════════════════════════════════════════════════════
  sh('beam-news', sc('news', {v: 'beam', headline: 'BEAM DETECTED LEAVING THE SHELL', ticker: 'TARGET: STAR HD 219134 · CONSTELLATION CASSIOPEIA · DISTANCE 21 LIGHT-YEARS'}), {
    science: {text: 'HD 219134 is a real orange dwarf star about 21 light-years away in Cassiopeia, with at least five known planets.', source: 'NASA Exoplanet Archive, ‘HD 219134’; Motalebi et al., Astronomy & Astrophysics (2015)'},
    chapter: 'Day 300',
    hud: {day: 300, temp: -68},
    cue: 'news',
    transition: 'fade',
    dev: 'the light is going somewhere: a star 21 light-years away',
    action: 'Day 300. The station’s big screen: a beam traced up from the Sun to one star in Cassiopeia, ringed.',
    lines: [AN('Astronomers have found a beam of light leaving the shell.')],
  }),
  sh('beam-star', stage('metro', 'city', push(1.3, 1.45, 960, 520), [
    c(Y, 760, 900, {outfit: 'cold', facing: 'back'}),
    c(MI, 880, 900, {outfit: 'cold', facing: 'back'}),
    c(IT, 1060, 900, {outfit: 'cold', facing: 'back'}),
    c('extra:37', 1250, 900, {outfit: 'cold', facing: 'back'}),
  ], [{at: 'l0+1.2', who: IT, facing: 'front', expr: 'scared'}], {screen: true}), {
    action: 'The station crowd, from behind, watching the big screen over the platform. Ito slowly turns around.',
    lines: [AN("It's aimed at a star called HD 219134. Twenty-one light-years away.", 0.4)],
  }),
  sh('twenty-one', stage('metro', 'city', dutch(2.8, 3.3, 1060, 560, -5), [c(Y, 760, 900, {outfit: 'cold', facing: 'back'}), c(MI, 880, 900, {outfit: 'cold', facing: 'back'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'front', expr: 'scared'})], [{at: 'l0+0.9', who: IT, look: [0, 0.8]}], {screen: true}), {
    cue: 'shellSting',
    twist: 5,
    sfx: 'impact',
    dev: 'Ito recognises the star',
    action: 'In the crowd under the screen, Ito goes white. Barely a whisper.',
    lines: [I('Twenty-one.', 1.0)],
  }),
  sh('didnt-ask', stage('metro', 'city', push(1.6, 1.8, 960, 620), [
    c(Y, 760, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}),
    c(MI, 880, 900, {outfit: 'cold', facing: 'right', expr: 'worried', look: [1, -0.4]}),
    c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'sad', look: [0, 0.7]}),
  ], [{at: 'l0+1.6', who: MI, look: [1, -0.2]}], {screen: true}), {
    action: 'Kai and Mira beside him. Mira watches Ito. He says nothing more.',
    lines: [N("I didn't ask what it meant.", 0.3)],
  }),
  sh('beam-space', sc('space', {v: 'beam'}), {
    cue: 'shell',
    beats: ['wow'],
    action: 'The shell from far away, a needle of light leaving it toward one faint star.',
    lines: [N("All the Sun's light, going to one star.", 0.6)],
  }),

  // ── 1983 #4 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-hesitate', stage('observatory', 'room', push(1.7, 1.9, 1520, 640), DESK({x: 1440, pose: 'sitChair', expr: 'worried'}), [{at: 1.2, who: YI, pose: 'sitPoint'}]), y83({
    cue: 'y1982',
    transition: 'fade',
    min: 2.8,
    action: 'At the transmitter. His finger hovers over the key. He looks at the chart: 21.',
  })),
  sh('obs-press', sc('closeup', {v: 'morse', taps: [0.7]}), y83({
    min: 1.6,
    action: 'He presses it, once.',
  })),

  // ══ DAY 365 · the reply ════════════════════════════════════════════════════════════════════
  sh('day365', stage('surface', 'milky', move([1.0, 960, 660], [1.14, 1000, 600]), SURF({you: {facing: 'back'}, mira: {facing: 'back'}, mum: {facing: 'back'}, ito: {facing: 'back'}}), [
    {at: 'l0+0.8', who: MI, pose: 'pointUp'},
    {at: 'l0+1.2', who: B, pose: 'beg', wag: 1},
  ]), {
    chapter: 'Day 365',
    hud: {day: 365, temp: -73},
    cue: 'finale',
    transition: 'fade',
    beats: ['wow'],
    action: 'Day 365, 6:50 in the morning. All of them on the surface, tiny under the brightest Milky Way anyone has ever seen.',
    lines: [N('On Day 365, we all went up to the surface. One year, to the minute.')],
  }),
  sh('birthday', stage('surface', 'milky', push(1.75, 1.95, 900, 700), SURF({mira: {facing: 'front', expr: 'smile'}}), [{at: 'l0+1', who: Y, expr: 'smile'}, {at: 'l0+0.3', who: MI, look: [-1, -0.3]}]), {
    beats: ['heart'],
    action: 'Mira grins up at Kai.',
    lines: [M('One whole lap around the Sun. Happy birthday, Earth.')],
  }),
  sh('from-the-sun', stage('surface', 'milky', push(2.6, 2.9, 1270, 620), SURF({ito: {facing: 'front', pose: 'holdBoth', expr: 'surprised'}}), [{at: 'l0+0.6', who: IT, look: [0.4, -0.8]}]), {
    cue: 'signal',
    sfx: 'chime',
    dev: 'the beam stops; a signal from the Sun',
    action: 'Ito’s little receiver dish clicks in his hands. His face changes.',
    lines: [I("The beam's stopped. Something's coming from the Sun.")],
  }),
  sh('counting', stage('surface', 'milky', push(1.9, 2.1, 1040, 580), SURF({ito: {pose: 'holdBoth'}, you: {expr: 'focused'}}), [{at: 'l0', who: Y, look: [0.6, -0.8]}], {pulses: true}), {
    callout: {text: '1 · 2 · 3', at: 'l0', pos: 'top'},
    action: 'Pulses: one, then two, then three. Kai counts along.',
    lines: [K('One.', 0.4), K('Two.', 0.4), K('Three.', 0.7)],
  }),
  sh('pulses', sc('closeup', {v: 'pulses', from: 3, to: 1679}), {
    sfx: 'riser',
    dev: 'then it keeps going',
    action: 'The receiver’s screen. The counter passes three and keeps climbing, faster and faster.',
    lines: [N("Then it didn't stop.", 0.5)],
  }),
  sh('hundreds', stage('surface', 'milky', push(2.3, 2.5, 880, 640), SURF({you: {expr: 'surprised'}}), [{at: 'l0+0.6', who: MI, look: [-1, -0.2]}]), {
    action: 'Kai stops counting.',
    lines: [K("That's not three. That's hundreds.")],
  }),
  sh('1679', stage('surface', 'milky', push(2.6, 2.9, 1270, 620), SURF({ito: {facing: 'front', pose: 'holdBoth', expr: 'focused'}}), [{at: 'l0+1.6', who: IT, look: [-0.6, 0.4]}]), {
    action: 'Ito, reading the counter as it stops.',
    lines: [I('One thousand, six hundred and seventy-nine.', 0.3)],
  }),
  sh('a-lot', stage('surface', 'milky', push(2.5, 2.7, 830, 640), SURF(), [{at: 'l0+0.6', who: Y, look: [1, -0.1]}]), {
    beats: ['laugh'],
    action: 'Kai, deadpan.',
    lines: [K('Is that a lot?', 0.2, 'shrug')],
  }),
  sh('primes', stage('surface', 'milky', push(2.6, 2.8, 1270, 620), SURF({ito: {pose: 'holdBoth', expr: 'focused'}}), [{at: 'l0+1.6', who: IT, look: [-1, 0.2]}]), {
    action: 'Ito, not looking up.',
    lines: [I("It's twenty-three times seventy-three. Nothing else.", 0.3, 'count')],
  }),
  sh('a-picture', stage('surface', 'milky', push(2.8, 3.2, 940, 620), SURF({mira: {facing: 'front', expr: 'focused'}}), [{at: 'l1', who: MI, expr: 'laugh'}]), {
    cue: 'decode',
    twist: 6,
    beats: ['wow'],
    dev: 'Mira sees it: the pulses make a picture',
    action: 'Mira’s eyes go wide. She is the artist.',
    lines: [M('Like squares on graph paper.', 0.3), M("It's a picture!", 0.5)],
  }),
  sh('decode', sc('closeup', {v: 'decode'}), {
    science: {text: 'In 1974 the Arecibo radio telescope sent a message of 1,679 pulses toward the star cluster M13, because 1,679 = 23 × 73 (two primes) can only be laid out as one grid, which forms a picture.', source: 'Cornell University / SETI Institute, ‘The Arecibo Message’ (1974)'},
    min: 4.0,
    dev: 'the pulses fill a 23 × 73 grid',
    action: 'The pulses fall into a grid, 23 across and 73 down, filling row by row.',
    lines: [I('Twenty-three across. Seventy-three down.')],
  }),
  sh('reply-count', sc('closeup', {v: 'reply', part: [0, 12]}), {
    dev: 'the picture: they finished the count',
    action: 'The finished picture, framed at the top: rows of dots counting one to ten.',
    lines: [N("At the top, they'd finished his count. Up to ten.")],
  }),
  sh('reply-them', sc('closeup', {v: 'reply', part: [13, 35]}), {
    dev: 'the builders, and a human beside them',
    action: 'Lower: a tall figure with a crest and three-fingered hands. Beside it, small, a human.',
    lines: [N('Then them. And us, beside them, very small.', 0.4)],
  }),
  sh('reply-home', sc('closeup', {v: 'reply', part: [36, 58]}), {
    action: 'Lower still: their star with its planets, one raised; the beam; our Sun inside its shell; Earth.',
    lines: [N('Their star. Their home. And our Sun, inside its shell.', 0.6)],
  }),
  sh('what-is-it', stage('surface', 'milky', push(1.9, 2.1, 1100, 620), SURF({mira: {facing: 'right', expr: 'worried'}, ito: {pose: 'holdBoth', expr: 'sad'}}), [{at: 'l0+0.8', who: IT, look: [-1, 0.2]}]), {
    action: 'Mira turns to Ito. He is staring at the little screen.',
    lines: [M('Mr. Ito? What is it?')],
  }),
  sh('a-reply', stage('surface', 'milky', push(2.7, 2.9, 1275, 610), SURF({ito: {pose: 'holdBoth', expr: 'sad'}}), [{at: 'l0+0.6', who: IT, look: [-0.8, 0.3]}]), {
    action: 'Ito, quietly.',
    lines: [I("It's a reply.", 0.4)],
  }),
  sh('to-who', stage('surface', 'milky', push(2.8, 3.0, 925, 640), SURF({mira: {facing: 'right', expr: 'surprised'}}), [{at: 'l0+0.5', who: MI, look: [1, -0.3]}]), {
    action: 'Mira, not understanding.',
    lines: [M('To who?', 0.3)],
  }),
  sh('to-me', stage('surface', 'milky', push(3.0, 3.3, 1280, 600), SURF({ito: {facing: 'front', pose: 'holdBoth', expr: 'sad'}}), [{at: 'l0+0.5', who: IT, look: [-0.5, 0.5]}]), {
    cue: 'shellSting',
    sfx: 'impact',
    beats: ['loop'],
    dev: 'the reply is to Mr. Ito',
    action: 'Ito, finally.',
    lines: [I('To me.', 1.0)],
  }),

  // ══ THE TURN · 1983, revealed ══════════════════════════════════════════════════════════════
  sh('obs-knock', sc('closeup', {v: 'morse', taps: [0.6, 1.5, 1.72, 2.6, 2.82, 3.04]}), y83({
    cue: 'dawn1982',
    min: 3.6,
    action: 'The Morse key again. One… two-two… three-three-three: the same rhythm as the pulses.',
  })),
  sh('obs-dawn', stage('observatory', 'dawn', push(1.0, 1.1, 960, 560), [c(YI, 640, 860, {facing: 'right', outfit: 'home'}, 0.5)], [{at: 0.4, who: YI, to: 860, dur: 2.4}], {sunrise: 0.8, aim: 1}), y83({
    letterbox: true,
    min: 4.6,
    beats: ['wow'],
    action: 'He walks out of the dome. Over the far ridge, the sky goes gold, and the Sun rises.',
  })),
  sh('obs-tap', sc('closeup', {v: 'tapRail', taps: [0.45, 1.0, 1.55]}), y83({
    letterbox: true,
    min: 2.2,
    action: 'Close: his hand on the dome railing in the sunrise. Tap. Tap. Tap.',
  })),
  sh('obs-face', stage('observatory', 'dawn', push(3.0, 3.2, 860, 640), [c(YI, 860, 860, {facing: 'front', outfit: 'home', expr: 'smile'}, 1.2)], [{at: 1.0, who: YI, look: [0.4, -0.3]}], {sunrise: -5, aim: 1}), y83({
    letterbox: true,
    min: 3.0,
    action: 'His face in the sunrise, round glasses glinting.',
  })),
  sh('ito-face', stage('surface', 'milky', push(2.4, 2.55, 1280, 660), SURF({ito: {facing: 'front', pose: 'holdBoth', expr: 'sad'}}), [{at: 0.4, who: IT, loop: 'tap', dur: 1.3}]), {
    transition: 'match',
    letterbox: true,
    twist: 7,
    callout: {text: 'THE SAME MAN', at: 'l0+0.4', pos: 'top'},
    dev: 'the man in the observatory was Mr. Ito',
    action: 'Match cut: the same face, forty-three years older, in starlight, tapping his receiver three times.',
    lines: [N('The man in the observatory was Mr. Ito. Forty-three years ago.', 0.4)],
  }),
  sh('explain-chart', sc('closeup', {v: 'chart'}), {
    dev: 'what he did in 1983',
    action: 'The star chart again: the three lines meeting at one star. 21.',
    lines: [N('He found the lines, and the star they pointed to.')],
  }),
  sh('explain-knock', sc('closeup', {v: 'morse', taps: [0.9, 1.9, 2.1, 3.0, 3.2, 3.4]}), {
    action: 'His young hand on the key.',
    lines: [N("They told him not to. He knocked anyway. One. Two. Three.", 0.4)],
  }),
  sh('explain-years', sc('diagram', {v: 'knock'}), {
    science: {text: 'Radio waves travel at the speed of light, so a signal to a star 21.3 light-years away and an answer back take about 43 years: 1983 → 2004 → 2026.', source: 'Definition of the light-year (IAU); HD 219134 distance 6.5 pc (Gaia DR3)'},
    dev: 'the 43-year round trip',
    beats: ['wow'],
    action: 'Earth and a star 21 light-years apart. The knock crosses out: 1983 → 2004. The answer crosses back: 2004 → 2026.',
    lines: [N('Twenty-one years to get there. Twenty-one years to come back.')],
  }),
  sh('telephone', stage('surface', 'milky', push(1.9, 2.1, 1100, 620), SURF({mira: {expr: 'surprised'}, ito: {pose: 'holdBoth', expr: 'sad'}}), [{at: 'l1', who: IT, look: [-1, 0.2]}]), {
    dev: 'the shell is their telephone, and he dialled',
    action: 'Ito turns to Mira and tells her, plainly.',
    lines: [I("It's a telephone, Mira. Theirs. I dialled it.", 0, 'chest')],
  }),
  sh('answered', stage('surface', 'milky', push(2.7, 2.9, 1275, 610), SURF({ito: {pose: 'holdBoth', expr: 'sad'}}), [{at: 'l0+0.9', who: IT, look: [0.4, -0.8]}]), {
    action: 'Ito looks up at the dark where the Sun is.',
    lines: [I("And now they've answered.", 0.4)],
  }),
  sh('needed-the-sun', sc('space', {v: 'beam'}), {
    dev: 'why the Sun went dark: the call needed its power',
    beats: ['wow'],
    action: 'The shell and its beam, the Sun’s whole output squeezed into one thin line across the dark.',
    lines: [I('To call that far, it needed the Sun. All of it. For one whole year.')],
  }),
  sh('everything', stage('surface', 'milky', push(1.9, 2.1, 1100, 620), SURF({mira: {expr: 'worried'}, ito: {pose: 'holdBoth', expr: 'sad'}}), [{at: 'l1+0.2', who: MI, look: [1, -0.2]}]), {
    dev: 'what the beam carried: us',
    action: 'Mira and Ito in the starlight.',
    lines: [I('It sent them everything it ever heard from us.'), M('Like what?', 0.2)],
  }),
  sh('a-hundred-years', stage('surface', 'milky', push(2.8, 3.0, 1275, 610), SURF({ito: {facing: 'left', pose: 'holdBoth', expr: 'sad'}}), [{at: 'l0+1.4', who: IT, look: [-0.4, -0.6]}]), {
    action: 'Ito, almost smiling.',
    lines: [I('Every song. Every voice. A hundred years of us.', 0.4)],
  }),
  sh('hurt-us', stage('surface', 'milky', push(2.8, 3.0, 950, 640), SURF({mira: {expr: 'sad', facing: 'right'}}), [{at: 'l0+1.2', who: MI, look: [1, -0.3]}]), {
    action: 'Mira asks the hardest question.',
    lines: [M('Did they know it would hurt us?', 0.4)],
  }),
  sh('dont-know', stage('surface', 'milky', push(2.8, 3.0, 1275, 610), SURF({ito: {pose: 'holdBoth', expr: 'sad'}}), [{at: 'l0+0.6', who: IT, look: [0, 0.7]}]), {
    action: 'Ito has no answer.',
    lines: [I("I don't know.", 0.8)],
  }),
  sh('sorry', stage('surface', 'milky', push(1.9, 2.1, 1100, 630), SURF({mira: {expr: 'sad'}, ito: {pose: 'holdBoth', expr: 'sad'}}), [
    {at: 0.2, who: MI, to: 1000, dur: 0.6},
    {at: 'l0', who: MI, pose: 'reach'},
  ]), {
    beats: ['heart'],
    action: 'Mira steps in and takes his arm.',
    lines: [I("I'm sorry, Mira.", 1.0)],
  }),
  sh('empty-square', sc('closeup', {v: 'reply', focus: true}), {
    dev: 'the empty square: our turn',
    action: 'The picture again. The camera slides to the bottom: an empty square, pulsing.',
    lines: [N('At the bottom of their picture was an empty square.', 0.4)],
  }),
  sh('our-turn', stage('surface', 'milky', push(2.8, 3.1, 960, 620), SURF({mira: {facing: 'front', expr: 'determined'}}), [{at: 'l0+0.6', who: MI, look: [0.6, -0.8]}]), {
    beats: ['loop'],
    action: 'Mira, very still.',
    lines: [M("It's our turn.", 0.6)],
  }),
  sh('waiting', stage('surface', 'milky', push(2.4, 2.6, 1270, 620), SURF({ito: {facing: 'front', pose: 'holdBoth', expr: 'focused'}}), [{at: 'l0+1.0', who: IT, look: [0.3, -0.9]}]), {
    dev: 'the shell will not open until we answer',
    action: 'Ito looks up at the black sky where the Sun is.',
    lines: [I("It's stopped sending. But it's still shut. It's waiting for us.")],
  }),

  // ══ THE ANSWER ═════════════════════════════════════════════════════════════════════════════
  sh('leaders', sc('news', {v: 'anchor', inset: 'protest', headline: 'NO AGREEMENT ON REPLY', ticker: 'UN EMERGENCY SESSION ENTERS THIRD DAY · "WE CANNOT SPEAK FOR ALL HUMANITY" · PROTESTS IN 60 CITIES'}), {
    chapter: 'The answer',
    hud: {day: 367, temp: -73},
    cue: 'news',
    transition: 'fade',
    dev: 'the world can’t agree on what to say',
    action: 'Day 367. The news: an emergency session, a hundred flags, and no answer.',
    lines: [AN('World leaders still cannot agree on what to say.')],
  }),
  sh('arguing', sc('news', {v: 'world', plain: true, panels: [
    {place: 'NEW YORK · UN', time: 'DAY 367', kind: 'crowd'},
    {place: 'BEIJING', time: 'DAY 367', kind: 'protest'},
    {place: 'BRASÍLIA', time: 'DAY 367', kind: 'protest'},
    {place: 'GENEVA', time: 'DAY 367', kind: 'crowd'},
  ]}), {
    action: 'Feeds from capitals: crowds outside parliaments, placards, arguments.',
    lines: [N('Two days later, they were still arguing.', 0.3)],
  }),
  sh('every-day', stage('metro', 'workshop', push(1.8, 2.0, 940, 640), [
    c(Y, 700, 900, {outfit: 'cold', facing: 'right'}),
    c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}),
    c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'determined'}),
  ], [{at: 'l0+0.6', who: MI, look: [1, -0.2]}], {ham: true, parts: true, items: [BAG_BENCH]}), {
    action: 'The workshop. Ito, Kai and Mira, the little receiver dish on the bench.',
    lines: [I('Every day we wait, the Sun stays shut.')],
  }),
  sh('what-send', stage('metro', 'workshop', push(2.4, 2.6, 760, 640), [c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'determined'}), c(Y, 700, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}), c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'worried'})], [{at: 'l0+0.8', who: MI, look: [-1, 0.2]}], {ham: true, parts: true, items: [BAG_BENCH]}), {
    action: 'Kai, out of ideas.',
    lines: [K('So what do we even send?', 0.3)],
  }),
  sh('this', stage('metro', 'workshop', push(2.6, 2.8, 860, 640), [c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'determined'}), c(Y, 700, 900, {outfit: 'cold', facing: 'right'}), c(MI, 840, 900, {outfit: 'cold', facing: 'right', expr: 'focused'})], [
    {at: 0.1, who: MI, take: 'pocket', prop: 'sunDrawing'},
    {at: 0.9, who: MI, pose: 'hold', expr: 'determined'},
  ], {ham: true, parts: true, items: [BAG_BENCH]}), {
    dev: 'Mira offers her drawing',
    lead: 1.2,
    action: 'Mira takes the folded drawing out of her pocket and holds it up.',
    lines: [M('Can we send this?')],
  }),
  sh('ito-looks', stage('metro', 'workshop', push(2.6, 2.8, 1060, 600), [c(MI, 840, 900, {outfit: 'cold', facing: 'right', pose: 'hold', hold: 'sunDrawing', expr: 'determined'}), c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'sad'})], [{at: 'l0', who: IT, expr: 'smile'}, {at: 'l0+0.9', who: IT, look: [-0.6, 0.3]}], {ham: true, parts: true, items: [BAG_BENCH]}), {
    beats: ['heart'],
    action: 'Ito looks at the drawing for a long moment.',
    lines: [I('Yes. I think we can.', 0.4)],
  }),
  sh('drawing-grid', sc('closeup', {v: 'drawingGrid', stay: true}), {
    dev: 'the drawing becomes the answer',
    min: 4.6,
    action: 'Mira’s crayon sun under Ito’s lamp, then the same picture as squares: a sun with rays, a little girl standing under it.',
    lines: [N('My drawing from the morning it went out.'), N('A big yellow sun. And me, standing under it.', 0.5)],
  }),
  sh('allowed', stage('metro', 'workshop', push(1.8, 2.0, 900, 640), [
    c(Y, 700, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}),
    c(MI, 840, 900, {outfit: 'cold', facing: 'right', hold: 'sunDrawing'}),
    c(IT, 1060, 900, {outfit: 'cold', facing: 'left', expr: 'neutral'}),
  ], [{at: 'l1', who: Y, expr: 'smile'}], {ham: true, parts: true, items: [BAG_BENCH]}), {
    beats: ['laugh'],
    action: 'Kai, suddenly very sixteen. Ito, perfectly calm.',
    lines: [K('Are we even allowed to do this?'), I('Probably not.', 0.6)],
  }),
  sh('dish-climb', stage('metro', 'stairs', move([1.15, 1300, 560], [1.2, 900, 520]), [
    c(Y, 1500, 900, {...COLD, hoodUp: true, pose: 'carry', hold: 'dish', facing: 'left', expr: 'determined'}),
    c(MI, 1700, 900, {...COLD, facing: 'left', hold: 'sunDrawing'}),
  ], [
    {at: 0, who: Y, to: 700, dur: 4},
    {at: 0.3, who: MI, to: 950, dur: 3.8},
  ]), {
    timeJump: true,
    dev: 'Kai carries the transmitter up',
    action: 'Up the frozen metro stairs: Kai hauls the big transmitter dish on his back, step by step, Mira behind him with the drawing.',
    lines: [N('Kai carried the transmitter up to the surface. He didn’t complain once.')],
  }),
  sh('send-time', stage('surface', 'milky', move([1.2, 1000, 640], [1.3, 1060, 620]), SURF367({ito: {hold: undefined, facing: 'right', pose: 'reach', expr: 'focused'}, mira: {hold: 'sunDrawing'}}), [{at: 'l1', who: MI, look: [1, -0.4]}], {transmitter: 1380}), {
    hud: {place: 'THE SURFACE', time: '6:35 AM'},
    dev: 'they choose the time: the light will come back at 6:52',
    action: '6:35 in the morning, on the surface. The transmitter on its tripod, aimed at the hidden Sun. Ito at the key.',
    lines: [I('If we send it at 6:35, the light gets back at 6:52.')],
  }),
  sh('same-minute', stage('surface', 'milky', push(2.6, 2.8, 950, 640), SURF367({mira: {hold: 'sunDrawing', facing: 'right', expr: 'focused'}}), [{at: 'l0+0.5', who: MI, expr: 'smile'}], {transmitter: 1380}), {
    action: 'Mira, holding her drawing.',
    lines: [M('The same minute it went out.', 0.3)],
  }),
  sh('press-key', stage('surface', 'milky', push(2.6, 2.9, 1310, 660), SURF367({ito: {hold: undefined, facing: 'right', pose: 'reach', expr: 'determined'}}), [{at: 'l0+0.4', who: IT, loop: 'tap', dur: 1.2}], {transmitter: 1380, txOn: 'l0+0.4'}), {
    sfx: 'chime',
    dev: 'the answer is sent',
    action: 'Ito presses the key. The transmitter light goes red.',
    lines: [N('He pressed the key, the way he had in 1983.')],
  }),
  sh('eight-eight', stage('surface', 'milky', push(2.6, 2.8, 1290, 620), SURF367({ito: {hold: undefined, facing: 'front', expr: 'focused'}}), [{at: 'l0+1.2', who: IT, look: [0.5, -0.9]}], {transmitter: 1380, txOn: 0}), {
    action: 'Ito straightens up, looking east.',
    lines: [I('Eight minutes to get there. Eight to come back.')],
  }),
  sh('countdown-1', stage('surface', 'milky', move([1.0, 1000, 600], [1.1, 1040, 580]), SURF367({ito: {hold: undefined, facing: 'right'}, mira: {hold: 'sunDrawing'}}), [{at: 0.6, who: MI, look: [0.5, -1]}], {transmitter: 1380, txOn: 0}), {
    cue: 'countdown',
    timer: {from: 1000, to: 994},
    dev: 'the 16:40 countdown',
    action: 'Wide. Five small figures in the snow, the transmitter glowing. A clock: 16:40.',
    lines: [N('Sixteen minutes and forty seconds.', 0.4)],
  }),
  sh('countdown-world', sc('news', {v: 'world', plain: true, panels: [
    {place: 'SYDNEY', time: '3:43 PM', kind: 'rooftops'},
    {place: 'TAMIL NADU', time: '11:13 AM', kind: 'rooftops'},
    {place: 'MANILA', time: '1:43 PM', kind: 'rooftops'},
    {place: 'NEW YORK', time: '1:43 AM', kind: 'rooftops'},
  ]}), {
    timer: {from: 545, to: 540},
    action: 'All over the world, people on rooftops in the dark, looking up at the same patch of sky.',
    lines: [N('The whole world was looking at the same patch of sky.')],
  }),
  sh('countdown-mum', stage('surface', 'milky', push(2.1, 2.3, 1000, 660), SURF367({mira: {hold: 'sunDrawing', expr: 'worried'}, mum: {expr: 'smile'}}), [{at: 'l1+0.2', who: MU, pose: 'hug'}]), {
    timer: {from: 62, to: 57},
    beats: ['heart'],
    action: 'Mira, scared. Mum pulls her in.',
    lines: [M('What if it doesn’t work?'), MUM("Then we'll wait together.", 0.3)],
  }),
  sh('countdown-last', stage('surface', 'milky', push(2.4, 2.6, 1290, 640), SURF367({ito: {hold: undefined, facing: 'front', expr: 'focused'}}), [{at: 0.8, who: IT, loop: 'tap', dur: 1.4}, {at: 3.2, who: IT, look: [0.6, -0.9]}], {transmitter: 1380, txOn: 0}), {
    timer: {from: 5, to: 0},
    min: 5.0,
    action: 'Ito, eyes on the east. He taps the transmitter three times.',
  }),
  sh('space-open', sc('space', {v: 'open'}), {
    letterbox: true,
    cue: 'sunrise',
    sfx: 'riser',
    min: 4.2,
    beats: ['wow'],
    dev: 'the slats turn edge-on',
    action: 'Space. The shell’s slats turn, all together, edge-on. Light pours out between them.',
  }),
  sh('sunrise', stage('surface', 'sunrise', move([1.0, 960, 560], [1.1, 1000, 520]), SURF367({you: {facing: 'right', expr: 'awe'}, mira: {facing: 'right', hold: 'sunDrawing', expr: 'awe'}, mum: {facing: 'right', expr: 'awe'}, ito: {hold: undefined, facing: 'right', expr: 'awe'}}), [
    {at: 1.6, who: MI, pose: 'cheer', expr: 'laugh'},
    {at: 1.8, who: Y, pose: 'armsUp', expr: 'laugh'},
  ], {sunAt: 0.4, transmitter: 1380}), {
    letterbox: true,
    twist: 8,
    sfx: 'impact',
    dev: 'the Sun comes back',
    action: 'Low in the east, the Sun is simply there. Gold light floods across the snow and their faces.',
    lines: [M('There it is!', 0.8)],
  }),
  sh('globe-return', sc('globe', {v: 'sunreturn', lon: 20, sunAt: 0.25, day: 367}), {
    letterbox: true,
    dev: 'the whole day side lights at once',
    action: 'Earth from space: the whole day side lights up at once.',
    lines: [N('Everywhere it was day, the Sun came back at once.')],
  }),
  sh('sun-beach', stage('montage', 'beach', push(1.2, 1.32, 1000, 700), [c('extra:56', 1000, 1060, {facing: 'right', outfit: 'cold', pose: 'lookUp', expr: 'awe', breath: true}, 1.0)], [{at: 0.9, who: 'extra:56', pose: 'cheer', expr: 'laugh'}], {dark: 0, sunAt: 0.4, frozen: true, boardX: 4000}), {
    letterbox: true,
    hud: {place: 'SYDNEY', time: '3:52 PM'},
    min: 2.2,
    action: 'Sydney, 3:52 PM: the surfer on the frozen beach, in the sun again.',
  }),
  sh('sun-field', stage('montage', 'field', push(1.25, 1.35, 900, 640), [c('extra:62', 900, 930, {facing: 'right', outfit: 'cold', pose: 'lookUp', expr: 'awe', breath: true}, 1.3)], [{at: 0.8, who: 'extra:62', pose: 'armsUp', expr: 'laugh'}], {dark: 0, sunAt: 0.3, frozen: true}), {
    letterbox: true,
    hud: {place: 'TAMIL NADU', time: '11:22 AM'},
    min: 2.0,
    action: 'Tamil Nadu: the farmer in the snow, arms up.',
  }),
  sh('sun-bus', stage('montage', 'bus', push(1.2, 1.3, 900, 700), [c('extra:17', 900, 960, {facing: 'right', outfit: 'cold', pose: 'lookUp', expr: 'awe', breath: true}, 1.4)], [{at: 0.8, who: 'extra:17', pose: 'cheer', expr: 'laugh'}], {dark: 0, sunAt: 0.3, noBus: true, frozen: true}), {
    letterbox: true,
    hud: {place: 'MANILA', time: '1:52 PM'},
    min: 2.0,
    beats: ['heart'],
    action: 'Manila: the boy at the bus stop, laughing in the light.',
  }),
  sh('family-sun', stage('surface', 'sunrise', push(1.6, 1.75, 1000, 640), SURF367({you: {expr: 'laugh'}, mira: {hold: 'sunDrawing', pose: 'reachUp', expr: 'laugh', facing: 'front'}, mum: {expr: 'smile'}, ito: {hold: undefined, facing: 'left', expr: 'smile'}}), [{at: 'l0+1.2', who: IT, look: [-0.6, 0.2]}], {sunAt: -5, transmitter: 1380}), {
    letterbox: true,
    cue: 'afterglow',
    beats: ['heart'],
    action: 'The family in the sunlight. Mira holds her drawing up beside the real Sun.',
    lines: [N('At 6:52, the same minute it went out, the Sun came back.', 1.0)],
  }),

  // ══ CODA ═══════════════════════════════════════════════════════════════════════════════════
  sh('roof-dawn', stage('roof', 'dawn', move([1.08, 1100, 560], [1.18, 1140, 540]), [
    c(YI, 1150, 900, {outfit: 'home', facing: 'right', expr: 'smile', look: [0.8, -0.5]}),
    c('itoMid', 1150, 900, {outfit: 'home', facing: 'right', expr: 'neutral', look: [0.8, -0.5], opacity: 0}),
    c(IT, 1150, 900, {outfit: 'home', facing: 'right', expr: 'neutral', look: [0.8, -0.5], opacity: 0}),
  ], [
    {at: 0.5, who: YI, loop: 'tap', dur: 1.0},
    {at: 1.7, who: YI, opacity: 0, dur: 0.6},
    {at: 1.6, who: 'itoMid', opacity: 1, dur: 0.6},
    {at: 2.4, who: 'itoMid', loop: 'tap', dur: 1.0},
    {at: 3.5, who: 'itoMid', opacity: 0, dur: 0.6},
    {at: 3.4, who: IT, opacity: 1, dur: 0.6},
    {at: 4.2, who: IT, loop: 'tap', dur: 1.0},
    {at: 4.6, who: IT, expr: 'smile'},
  ]), {
    thread: 'memory',
    look: 'memory',
    hud: {place: 'EVERY MORNING', time: '1983 – 2026'},
    cue: 'end',
    transition: 'fade',
    beats: ['heart'],
    dev: 'why he watched every sunrise',
    action: 'A memory, warm as home movie: the same roof, every dawn for forty-three years. Mr. Ito, young, then greying, then old, taps his telescope three times as the Sun comes up.',
    lines: [N('Every morning for forty-three years, Mr. Ito watched the sunrise.', 0.6)],
  }),
  sh('liked-it', stage('roof', 'dawn', push(2.6, 3.2, 1150, 600, 1180, 570), [c(IT, 1150, 900, {outfit: 'home', facing: 'right', expr: 'smile'})], [{at: 0.4, who: IT, look: [0.9, -0.6]}, {at: 'l1', who: IT, expr: 'sad'}]), {
    thread: 'memory',
    look: 'memory',
    action: 'Close on his face in the early light.',
    lines: [N('I used to think it was because he liked it.', 0.8)],
  }),
  sh('waiting-answer', stage('roof', 'dawn', move([1.3, 1150, 600], [1.2, 1150, 580]), [c(IT, 1150, 900, {outfit: 'home', facing: 'right', expr: 'sad', look: [0.9, -0.6]})], [{at: 'l0+0.8', who: IT, loop: 'tap', dur: 1.0}]), {
    thread: 'memory',
    look: 'memory',
    beats: ['heart'],
    action: 'Wider: the old man alone on the roof at dawn, tapping the telescope three times.',
    lines: [N('He was waiting for an answer.', 1.2)],
  }),
  sh('hook', sc('space', {v: 'beam'}), {
    cue: 'end',
    dev: 'the drawing is on its way',
    action: 'Far out in the dark, a thin thread of light leaves our Sun for one faint star. Somewhere in it, a crayon sun.',
    lines: [N("In twenty-one years, they'll get my drawing.", 0.4), N("I wonder what they'll say.", 1.0)],
  }),
  sh('end', sc('end'), {
    cue: 'end',
    min: 12,
    action: 'The end screen: the shell turning, its three pulses, THE REPLY, and room for the subscribe and next-video cards.',
    lines: [N('What would you have sent? Tell us in the comments.', 1.0)],
  }),
];

export const sun01: Episode = {
  id: 'sun01',
  file: 'FILE 001',
  title: 'The Sun Went Out',
  youtubeTitle: 'The Sun Went Out. Day 1 to Day 365',
  thumbnailText: 'WHO TURNED IT OFF?',
  commentPrompt: 'They left an empty square for our answer. What would you have sent?',
  logline:
    "On a summer morning the Sun goes out. Eight-year-old Mira, her brother Kai and Mr. Ito, the retired astronomer upstairs, survive a year in the dark while their mum works across the frozen river. Every clue is real physics. The thing around the Sun is a telephone, the call was meant for Mr. Ito, and the answer is Mira's to give.",
  tags: [
    'what if the sun disappeared',
    'what if the sun went out',
    'day 1 to day 365',
    'survival',
    'what if',
    'space',
    'science',
    'animation',
    'dyson sphere',
    'arecibo message',
    'the sun',
    'earth without the sun',
    'plot twist',
    'the blink files',
  ],
  pinnedComment: 'When did you realise who the man in the observatory was? 👀\n\nThey left an empty square for our answer. Mira sent a drawing. What would you have sent? Best answer gets read out in the next File. 👇',
  fps: 30,
  style: 'cinema',
  shots,
};
