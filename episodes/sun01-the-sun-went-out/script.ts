import type {Line, Shot, Episode} from '../../src/engine/schema';

/**
 * THE BLINK FILES · File 001 — "The Sun Went Out" (v3)
 *
 * Told by Mira Okafor, grown up, in the first person: the year she was eight and the Sun went out. She narrates
 * only what she saw or was told. Intercut, never narrated until the end, is a second thread: a young astronomer
 * in a mountain observatory, always at night, so it reads as "now". It is 1982, and he is Mr. Ito.
 * Screenplay, clue map and cause→effect links: docs/11-sun01-v3-screenplay.md. Physics: docs/10-sun01-logic-audit.md.
 * Stage shots place the cast once at natural scale and let the camera frame them, so sizes never drift.
 */

const N = (text: string, pause?: number): Line => ({speaker: 'NARRATOR', text, pause});
const M = (text: string, pause?: number): Line => ({speaker: 'MIRA', text, pause});
const K = (text: string, pause?: number): Line => ({speaker: 'KAI', text, pause});
const I = (text: string, pause?: number): Line => ({speaker: 'ITO', text, pause});
const R = (text: string, pause?: number): Line => ({speaker: 'RADIO', text, pause});
const MUMR = (text: string, pause?: number): Line => ({speaker: 'MUM_RADIO', text, pause});
const MUM = (text: string, pause?: number): Line => ({speaker: 'MUM', text, pause});
const MAN = (text: string, pause?: number): Line => ({speaker: 'MAN', text, pause});

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

/** Stage shot: a detailed set + the cast + their acting + a camera. */
const stage = (set: string, v: string, cam: Cam[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({
  scene: 'stage',
  props: {set, v, cam, cast, acts, ...extra},
});
const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});
/** The 1982 thread: unlabeled, unnarrated, always night (until the dawn). */
const y82 = (o: Partial<Shot>): Partial<Shot> => ({thread: '1982', ...o});

// Recurring blocking
const KITCHEN = (o: {you?: object; mira?: object; dog?: object} = {}) => [
  c(Y, 640, 930, {pose: 'hold', hold: 'mug', facing: 'right', ...o.you}),
  c(MI, 1180, 930, {pose: 'sitDraw', seat: 'stool', seatLift: 118, hold: 'chalk', facing: 'left', ...o.mira}),
  c(B, 980, 930, {pose: 'sit', ...o.dog}),
];
const COLD = {outfit: 'cold', breath: true};
const TUNNEL = [
  c('extra:30', 300, 900, {outfit: 'cold', pose: 'carry', facing: 'right'}),
  c('extra:31', 520, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate'}),
  c(Y, 980, 900, {outfit: 'cold', facing: 'right'}),
  c(MI, 1100, 900, {outfit: 'cold', facing: 'left'}),
  c('extra:33', 1400, 900, {outfit: 'cold', pose: 'pour', facing: 'left'}),
  c('extra:34', 1650, 900, {outfit: 'cold', facing: 'left'}),
];
// the 1982 desk: he sits facing the light table / the key
const DESK = (o: object = {}) => [c(YI, 1210, 920, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', ...o})];

const shots: Shot[] = [
  // ══ COLD OPEN · 1982, unlabeled ══════════════════════════════════════════════════════════════
  sh('obs-key', sc('closeup', {v: 'morse', taps: [0.3, 0.9, 1.08, 1.7, 1.88, 2.06]}), y82({
    chapter: 'The last morning',
    cue: 'y1982',
    min: 2.5,
    action: 'Night. Lamplight. A hand in a brown wool cuff taps a Morse key: one… two-two… three-three-three.',
  })),
  // ══ THE LAST MORNING · the city ══════════════════════════════════════════════════════════════
  sh('kitchen-morning', stage('kitchen', 'sun', push(1.12, 1.28, 960, 560), KITCHEN({you: {expr: 'sleepy'}}), [
    {at: 0.6, who: Y, pose: 'relaxed', expr: 'smile'},
    {at: 'l0+0.6', who: B, look: [0.4, -1]},
  ]), {
    hud: {place: 'OUR KITCHEN', time: '6:51 AM'},
    cue: 'morning',
    transition: 'flash',
    action: 'A sunlit kitchen. Kai yawns over a mug. Mira draws at the table. Biscuit sits very politely beside the toast.',
    lines: [N('I was eight the summer the Sun went out.')],
  }),
  sh('mira-draws', stage('kitchen', 'sun', push(2.0, 2.2, 1130, 570), KITCHEN({mira: {expr: 'focused'}}).slice(1), [
    {at: 'l0+0.5', who: MI, pose: 'sitShow', hold: 'drawing', expr: 'laugh', facing: 'front'},
  ], {drawing: true}), {
    beats: ['heart'],
    action: 'Close on Mira finishing a crayon sun. She holds it up, proud.',
    lines: [N('I was drawing the Sun.', 0.5)],
  }),
  sh('kai-yawn', stage('kitchen', 'sun', push(2.6, 2.8, 640, 620), KITCHEN(), [{at: 0.2, who: Y, look: [1, 0.2]}]), {
    action: 'Kai, sleepy, squints at her over his mug.',
    lines: [K('Who draws at six in the morning?')],
  }),
  sh('artists', stage('kitchen', 'sun', push(2.8, 3.0, 1180, 650), KITCHEN({mira: {expr: 'smile', facing: 'left'}}), [{at: 'l0', who: MI, expr: 'laugh'}]), {
    beats: ['laugh'],
    action: 'Mira, without looking up.',
    lines: [M('Artists.')],
  }),
  sh('dog-eyes', stage('kitchen', 'sun', push(2.1, 2.35, 1080, 760), KITCHEN().slice(1), [{at: 0.4, who: B, look: [0.4, -1]}, {at: 1.2, who: B, wag: 1}], {toast: 'plate'}), {
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
  sh('toast-steal', stage('kitchen', 'sun', push(1.7, 2.1, 900, 700), KITCHEN(), [
    {at: 0.3, who: B, pose: 'beg'},
    {at: 'l0+0.4', who: B, to: 1060, gait: 'run', dur: 0.5},
    {at: 'l0+0.45', who: B, hold: 'toast'},
    {at: 'l0', who: Y, expr: 'surprised', pose: 'point', hold: null},
  ], {toast: 'steal'}), {
    transition: 'whip',
    beats: ['laugh'],
    action: 'Back in the kitchen, Biscuit rises on his back legs and snatches the toast. Kai lunges.',
    lines: [K('Biscuit, no!')],
  }),
  sh('lights-out', stage('kitchen', 'dark', hold(1.7, 900, 700), KITCHEN({you: {pose: 'point', hold: undefined, expr: 'surprised', keepPose: true}, mira: {expr: 'surprised', hold: undefined}, dog: {pose: 'stand', x: 1060, hold: 'toast'}}), [
    {at: 0.75, who: Y, pose: 'flinch', expr: 'scared', look: [-1, -0.3]},
    {at: 0.85, who: MI, pose: 'sitChair', expr: 'scared', look: [-1, -0.4]},
    {at: 1.0, who: B, pose: 'sit', look: [-0.6, -0.6]},
  ], {snap: true, toast: 'mouth'}), {
    min: 2.6,
    sfx: 'powercut',
    cue: 'silence',
    dev: 'the Sun goes out',
    action: 'Mid-snatch, the sunlight snaps off. Everyone freezes in the blue dark. Biscuit still has the toast.',
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
  sh('stars-at-breakfast', stage('kitchen', 'dark', push(1.3, 1.45, 560, 590), [c(MI, 520, 930, {facing: 'back'}), c(Y, 760, 930, {facing: 'back'})], [{at: 0.2, who: MI, to: 560, dur: 0.8, facing: 'back'}], {windowStars: true}), {
    beats: ['wow'],
    action: 'Through the kitchen window: stars over the city at breakfast time.',
    lines: [M('Is it night again?', 0.3)],
  }),
  sh('seven', stage('kitchen', 'dark', push(2.4, 2.6, 700, 600), [c(Y, 700, 930, {facing: 'front', expr: 'scared'})], [{at: 'l0', who: Y, look: [-0.5, -0.6]}]), {
    action: 'Kai, staring at the window.',
    lines: [K("It's seven in the morning.", 0.4)],
  }),
  sh('knock', stage('apartment', 'door', push(1.3, 1.45, 1250, 620), [c(Y, 1000, 930, {facing: 'right', expr: 'worried'}), c(MI, 860, 930, {facing: 'right', expr: 'scared'})], [{at: 0.5, who: Y, look: [1, 0], expr: 'surprised'}], {doorOpen: false, knock: true}), {
    action: 'Three hard knocks rattle the front door.',
    lines: [N('Then someone knocked. Three times.')],
  }),
  sh('ito-door', stage('apartment', 'door', push(1.45, 1.6, 1230, 600), [
    c(MI, 860, 930, {facing: 'right', expr: 'scared'}),
    c(Y, 1000, 930, {facing: 'right', expr: 'surprised'}),
    c(IT, 1590, 930, {facing: 'left', hold: 'torch', pose: 'torch', holdL: 'bag', outfit: 'home', expr: 'determined'}),
  ], [{at: 'l0+0.7', who: IT, pose: 'point', hold: null}], {doorOpen: true}), {
    dev: 'Mr. Ito arrives, already prepared',
    action: 'The door opens on Mr. Ito from upstairs: fully dressed at dawn, shoes on, torch, a radio, a packed canvas bag.',
    lines: [I('Good morning. Shoes on, please. Both of you.')],
  }),
  sh('from-upstairs', stage('apartment', 'door', push(2.3, 2.5, 1560, 600), [c(IT, 1590, 930, {facing: 'left', hold: 'torch', pose: 'torch', holdL: 'bag', outfit: 'home', expr: 'neutral'})]), {
    action: 'Close on Ito, calm in the torchlight.',
    lines: [N('Mr. Ito, from upstairs.')],
  }),
  sh('packed', stage('apartment', 'door', push(2.4, 2.7, 1560, 800, 1540, 840), [c(IT, 1590, 930, {facing: 'left', hold: 'bag', pose: 'stand', holdL: 'torch', outfit: 'home'})], [{at: 0.3, who: IT, look: [-0.4, 0.4]}, {at: 'l0+1.2', who: IT, loop: 'nod', dur: 0.8}]), {
    action: 'Close on the canvas bag in his hand.',
    lines: [N("He had a torch, a radio, and a bag he'd packed the night before.")],
  }),
  sh('and-the-dog', stage('apartment', 'door', push(2.4, 2.7, 1500, 560), [c(IT, 1590, 930, {facing: 'left', outfit: 'home', pose: 'point', expr: 'smile', holdL: 'bag'}), c(B, 1300, 930, {hold: 'toast'})], [
    {at: 'l0+0.4', who: B, pose: 'beg', wag: 1},
  ], {doorOpen: true}), {
    beats: ['laugh'],
    action: 'Ito points past them at Biscuit, who still has the toast.',
    lines: [I('And bring the dog. And the toast.')],
  }),
  sh('title', sc('title'), {
    min: 3.6,
    cue: 'title',
    beats: ['loop'],
    action: 'Title: THE SUN WENT OUT.',
    lines: [N('It took me a year to understand why.', 0.8)],
  }),

  // ══ HOUR ONE ═══════════════════════════════════════════════════════════════════════════════
  sh('street-phones', stage('street', 'night', move([1.0, 960, 430], [1.12, 960, 600]), [
    c('extra:3', 380, 960, {pose: 'pointUp', facing: 'right', expr: 'scared', look: [0.3, -1], keepPose: true}),
    c('extra:7', 560, 960, {pose: 'reachUp', hold: 'phoneLit', expr: 'worried', look: [0, -1]}),
    c(Y, 860, 960, {pose: 'lookUp', expr: 'worried', look: [0, -1]}),
    c(MI, 960, 960, {pose: 'lookUp', expr: 'worried', look: [0.2, -1]}),
    c(IT, 1120, 960, {outfit: 'home', hold: 'torch', holdL: 'bag', facing: 'left'}),
    c('extra:12', 1300, 960, {pose: 'handsOnHead', expr: 'scared', look: [0, -1]}),
    c('extra:9', 1560, 960, {pose: 'lookUp', hold: 'phoneLit', expr: 'surprised', look: [-0.2, -1]}),
  ], [
    {at: 0.4, who: 'extra:12', to: 1760, gait: 'run', dur: 1.6},
    {at: 'l0', who: 'extra:3', loop: 'bounce', dur: 1.2},
  ]), {
    chapter: 'Hour one',
    cue: 'unease',
    transition: 'whip',
    dev: 'the city pours into the street',
    action: 'Outside, the street is full. Pyjamas and work clothes, every phone held up to a starry sky.',
    lines: [N('Outside, the whole street was looking up.')],
  }),
  sh('eclipse-shout', stage('street', 'night', push(2.1, 2.4, 400, 760), [
    c('extra:3', 380, 960, {pose: 'pointUp', facing: 'right', expr: 'surprised', speaker: 'MAN'}),
    c('extra:7', 560, 960, {pose: 'hold', hold: 'phoneLit', expr: 'worried'}),
  ], [{at: 'l0', who: 'extra:3', loop: 'talk', dur: 1.2}]), {
    action: 'A man in a dressing gown shouts at the sky.',
    lines: [MAN("It's an eclipse!")],
  }),
  sh('polite', stage('street', 'night', push(2.4, 2.6, 1120, 640), [c(IT, 1120, 960, {outfit: 'home', hold: 'torch', holdL: 'bag', facing: 'left', expr: 'neutral'}), c(MI, 960, 960, {facing: 'right', expr: 'worried'})], [{at: 'l0', who: IT, loop: 'talk', dur: 1.6}, {at: 'l0+0.2', who: MI, look: [1, -0.4], expr: 'surprised'}]), {
    beats: ['laugh'],
    dev: 'not an eclipse',
    action: 'Ito, unimpressed, to Mira.',
    lines: [I('Eclipses are polite. They leave after seven minutes.')],
  }),
  sh('roof-order', stage('street', 'night', push(2.2, 2.4, 1040, 640), [c(IT, 1120, 960, {outfit: 'home', hold: 'torch', holdL: 'bag', facing: 'left', pose: 'pointUp'}), c(Y, 900, 960, {facing: 'right', expr: 'worried'})]), {
    action: 'Ito points up at the roof of their building.',
    lines: [I('Roof. Bring the telescope.')],
  }),
  sh('six-floors', stage('stairs', 'climb', move([1.2, 300, 580], [1.25, 160, 540]), [
    c(IT, -60, 680, {outfit: 'home', hold: 'torch', holdL: 'bag', facing: 'left'}),
    c(Y, 420, 940, {pose: 'carry', hold: 'tubeCase', facing: 'left', expr: 'sleepy'}),
    c(MI, 560, 940, {facing: 'left', expr: 'smile'}),
  ], [
    {at: 0, who: IT, to: [-440, 600], dur: 3.0},
    {at: 0, who: Y, to: [60, 800], dur: 3.6},
    {at: 0.4, who: Y, loop: 'pant', dur: 3},
    {at: 0, who: MI, to: [240, 880], dur: 3.4},
  ]), {
    beats: ['laugh'],
    action: 'The stairwell, sixth floor. Ito climbs ahead with the torch. Kai hauls the heavy telescope case up, puffing. Mira skips behind.',
    lines: [N('Kai carried it up six floors. He complained about every one.')],
  }),
  sh('roof-setup', stage('roof', 'night', move([1.0, 960, 560], [1.15, 1060, 600]), [
    c(IT, 1150, 900, {pose: 'holdBoth', outfit: 'home', facing: 'left'}),
    c(Y, 760, 900, {facing: 'right'}),
    c(MI, 880, 900, {facing: 'right'}),
    c(B, 620, 900, {pose: 'sit', hold: 'toast'}),
  ], [{at: 0.4, who: IT, pose: 'reach', expr: 'focused'}], {telescope: 'setup'}), {
    cue: 'curious',
    action: 'The roof. Ito sets up a brass telescope with quick, sure hands.',
    lines: [I('Venus first.')],
  }),
  sh('venus', sc('sky', {v: 'venus'}), {
    action: 'Low in the east, one bright point still shining: Venus.',
    lines: [M('Why is that one still on?')],
  }),
  sh('mirror', sc('diagram', {v: 'lightDelay', step: 0}), {
    action: 'Diagram: the Sun as a dark question mark, Venus catching its light and passing it on to Earth.',
    lines: [I("Venus shines with the Sun's light.")],
  }),
  sh('long-way', sc('diagram', {v: 'lightDelay', step: 1}), {
    action: 'The light path traced: Sun to Venus, Venus to Earth. The long way round.',
    lines: [I('That light takes the long way round to reach us.')],
  }),
  sh('ito-predict', stage('roof', 'night', push(2.6, 3.0, 1130, 560), [c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'left', expr: 'focused'})]), {
    dev: 'Ito predicts Venus will go dark',
    action: 'Ito, lit by the torch, eyes on his watch.',
    lines: [I('If something happened at the Sun, Venus goes dark at four minutes past seven.')],
  }),
  sh('the-wait', stage('roof', 'night', move([1.2, 900, 620], [1.3, 960, 640]), [
    c(Y, 760, 900, {pose: 'sit', facing: 'right'}),
    c(MI, 900, 900, {pose: 'sitHug', facing: 'left', expr: 'sleepy'}),
    c(B, 1000, 900, {pose: 'lie'}),
    c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'left'}),
  ], [{at: 0.8, who: Y, pose: 'hold', watchGlow: 1}]), {
    min: 2.6,
    beats: ['heart'],
    callout: {text: '7:03', at: 0.6, pos: 'top'},
    action: 'They sit on the roof and wait. Biscuit finally finishes the toast. Kai checks his watch: 7:03.',
    lines: [N('So we waited.', 1.0)],
  }),
  sh('venus-out', sc('sky', {v: 'venusOut'}), {
    science: {text: "Venus near the far side of the Sun: sunlight needs ~361 s to reach it and ~860 s more to cross 1.72 AU back to us, versus 499 s straight from the Sun, so it fades ~12 minutes after the Sun (6:52 → 7:04).", source: "Calculation from 1 AU = 149.6 million km, c = 299,792 km/s, Venus orbit 0.72 AU (NASA JPL planetary fact sheets)"},
    cue: 'reveal',
    sfx: 'decloak',
    min: 2.4,
    beats: ['wow'],
    dev: 'Venus goes dark late',
    callout: {text: '7:04', at: 0.9, pos: 'top'},
    action: 'At four minutes past seven, Venus flickers and goes out.',
  }),
  sh('at-the-sun', stage('roof', 'night', push(3.2, 3.6, 1150, 540), [c(IT, 1150, 900, {pose: 'pointUp', outfit: 'home', facing: 'front', expr: 'surprised'})]), {
    cue: 'sting',
    twist: 1,
    beats: ['loop'],
    callout: {text: 'AT THE SUN', at: 'l0+0.4'},
    dev: 'it happened at the Sun, not near Earth',
    action: 'Ito, very quietly.',
    lines: [I('Then it happened at the Sun.', 0.4)],
  }),
  sh('jupiter-predict', sc('diagram', {v: 'jupiter'}), {
    science: {text: "Jupiter is 5.2 AU from the Sun; light needs ~43 minutes to reach it and ~37 more to reach us when it is 4.5 AU away: about 72 minutes after the Sun.", source: "NASA Jupiter fact sheet (nssdc.gsfc.nasa.gov)"},
    callout: {text: '8:04', at: 'l0+1.4'},
    action: 'Diagram: Jupiter, far out. A long light path. A clock.',
    lines: [I('And Jupiter will go out at four minutes past eight.')],
  }),
  sh('jupiter-out', sc('sky', {v: 'jupiterOut'}), {
    sfx: 'decloak',
    dev: 'Jupiter goes dark on schedule',
    action: 'Jupiter, centred in the telescope crosshairs, winks out.',
    lines: [N('At four minutes past eight, it did.', 0.4)],
  }),
  sh('three-taps', stage('roof', 'night', push(2.3, 2.55, 1150, 660), [c(MI, 930, 900, {outfit: 'home', facing: 'right', look: [1, -0.6], expr: 'focused'}), c(IT, 1150, 900, {pose: 'reach', outfit: 'home', facing: 'right', expr: 'neutral'})], [{at: 0.2, who: IT, loop: 'tap', dur: 1.2}]), {
    action: 'Ito taps the telescope three times, humming under his breath.',
    lines: [N('He always tapped it three times. I never asked why.')],
  }),

  // ── 1982 #1 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-dish', stage('observatory', 'dish', push(1.0, 1.12, 960, 520), [c(YI, 760, 860, {facing: 'right', outfit: 'home', pose: 'lookUp'}, 0.5)], [], {turn: true}), y82({
    cue: 'y1982',
    transition: 'fade',
    min: 3.0,
    action: 'A small dome on a dark mountain. Beside it a radio dish turns toward one bright star.',
  })),
  sh('obs-room-1', stage('observatory', 'room', push(1.1, 1.25, 1250, 620), DESK({pose: 'sitChair', expr: 'focused'}), [{at: 0.5, who: YI, pose: 'reach', expr: 'focused'}]), y82({
    min: 3.2,
    action: 'A small observatory at night. A young man with round glasses bends over a light table.',
  })),
  sh('obs-plate', sc('closeup', {v: 'plate', circle: 1.2}), y82({
    min: 3.2,
    action: 'An old eclipse plate under a magnifier. One faint line through the corona, far too straight. A red pen circles it.',
  })),

  // ══ THE FIRST MORNING · cold, and the shops ═════════════════════════════════════════════════
  sh('watch-cooling', sc('closeup', {v: 'watch', temp: [21.4, 21.1], time: '09:00'}), {
    cue: 'unease',
    transition: 'fade',
    dev: 'the temperature starts falling',
    action: 'Close on Kai’s watch: the thermometer ticks down a degree.',
    lines: [N('By nine, it was a degree colder.')],
  }),
  sh('radio-news', sc('closeup', {v: 'radio'}), {
    action: 'Ito’s battery radio on the kitchen table.',
    lines: [R('Phone networks are down across the city. Stay indoors.')],
  }),
  sh('kai-shops', stage('apartment', '', push(2.2, 2.4, 1000, 620), [c(Y, 1000, 930, {outfit: 'home', facing: 'right', expr: 'worried'}), c(IT, 1250, 930, {outfit: 'home', facing: 'left', holdL: 'bag'})]), {
    action: 'Kai, already pulling on his coat.',
    lines: [K("Everyone's going to the shops.")],
  }),
  sh('so-are-we', stage('apartment', '', push(2.4, 2.6, 1250, 600), [c(IT, 1250, 930, {outfit: 'home', facing: 'left', holdL: 'bag', expr: 'determined'})], [{at: 'l0', who: IT, pose: 'point'}]), {
    action: 'Ito, already holding out a list.',
    lines: [I('Then so are we.')],
  }),
  sh('day1-rush', stage('street', 'rush', push(1.0, 1.1, 960, 560), [
    c('extra:2', 200, 960, {facing: 'right'}),
    c('extra:4', 420, 960, {facing: 'right', hold: 'bottle'}),
    c('extra:6', 640, 960, {facing: 'right'}),
    c(Y, 900, 960, {facing: 'right', outfit: 'cold'}),
    c(MI, 1010, 960, {facing: 'right', outfit: 'cold'}),
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
    chapter: 'Day 1',
    hud: {day: 1, temp: 9},
    cue: 'work',
    transition: 'whip',
    dev: 'the race for supplies',
    action: 'Day 1. The whole street runs the same way: toward the supermarket.',
    lines: [N('Kai was right. The whole city had the same idea.')],
  }),
  sh('grab', stage('market', 'grab', push(1.1, 1.25, 960, 600), [
    c(Y, 700, 940, {pose: 'push', facing: 'right', outfit: 'cold'}),
    c('extra:14', 1420, 940, {pose: 'reach', facing: 'left'}),
    c('extra:15', 1700, 940, {pose: 'carry', hold: 'rice', facing: 'left'}),
  ], [
    {at: 0, who: Y, to: 1000, dur: 1.4},
    {at: 'l0+0.2', who: Y, pose: 'hold', hold: 'tideTable', expr: 'focused'},
  ], {trolley: true}), {
    action: 'Half-empty shelves. Kai steers a trolley, reading Ito’s list.',
    lines: [K('Candles. Rice. Batteries. Water.')],
  }),
  sh('treats', stage('market', 'grab', push(1.9, 2.2, 1100, 720), [
    c(Y, 1000, 940, {pose: 'hold', facing: 'right', outfit: 'cold', expr: 'surprised'}),
    c(MI, 1400, 940, {pose: 'carry', hold: 'treats', facing: 'left', outfit: 'cold', expr: 'smile'}),
    c(B, 1140, 940, {}),
  ], [
    {at: 0, who: MI, to: 1290, dur: 1},
    {at: 'l0+0.3', who: B, pose: 'beg', wag: 1},
  ]), {
    beats: ['laugh'],
    action: 'Mira marches back with an armful of dog treats. Biscuit loses his mind.',
    lines: [M("They're on my list.")],
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
    lines: [N('Two grown men fought over the last heater.')],
  }),
  sh('theyll-learn', stage('market', 'grab', push(2.4, 2.6, 1200, 640), [c(IT, 1200, 940, {outfit: 'cold', facing: 'left', holdL: 'bag', expr: 'neutral'})], [{at: 'l0+0.3', who: IT, loop: 'shake', dur: 0.8}, {at: 'l0+1.4', who: IT, look: [0.6, 0.4]}]), {
    beats: ['laugh'],
    action: 'Ito watches the fight, deadpan.',
    lines: [I("Heaters need electricity. They'll learn.")],
  }),

  // ══ DAY 2 · Mum, and the tide ════════════════════════════════════════════════════════════════
  sh('radio-host', sc('closeup', {v: 'radio'}), {
    chapter: 'Day 2',
    hud: {day: 2, temp: 1},
    cue: 'mystery',
    transition: 'fade',
    action: 'Day 2. The radio on the table, the announcer reading out messages.',
    lines: [R('Now, messages from hospital staff to their families.', 0.2)],
  }),
  sh('radio-mum', sc('closeup', {v: 'radio'}), {
    dev: 'Mum is stuck at the hospital',
    action: 'Then a tired woman’s voice.',
    lines: [MUMR("Kai, Mira, it's Mum. They need me at the hospital. Stay with Mr. Ito.")],
  }),
  sh('mum-nurse', stage('apartment', 'warm', push(1.8, 2.0, 900, 640), [
    c(Y, 820, 930, {pose: 'sit', outfit: 'cold', facing: 'right', expr: 'sad'}),
    c(MI, 940, 930, {pose: 'sitHug', outfit: 'cold', facing: 'left', expr: 'sad'}),
  ], [{at: 0.3, who: MI, loop: 'shiver', dur: 3}, {at: 'l0+0.6', who: Y, expr: 'worried', look: [0.8, 0.2]}]), {
    beats: ['heart'],
    action: 'Kai and Mira on the floor of the living room, close together, listening.',
    lines: [N("Mum was a nurse. She'd been on the night shift.")],
  }),
  sh('is-it-dead', stage('apartment', 'warm', push(2.6, 2.8, 840, 620), [c(Y, 820, 930, {pose: 'sit', outfit: 'cold', facing: 'right', expr: 'worried'})], [{at: 'l0', who: Y, look: [1, -0.3]}]), {
    action: 'Kai, finally asking it.',
    lines: [K('Is the Sun… dead?', 0.3)],
  }),
  sh('moon-pulls', sc('diagram', {v: 'tide', step: 0}), {
    action: 'Diagram: the Moon tugs a bulge of ocean toward it. The hidden Sun tugs too.',
    lines: [I('The Moon pulls the sea. So does the Sun.')],
  }),
  sh('a-third', sc('diagram', {v: 'tide', step: 1}), {
    science: {text: "The Sun’s tide-raising force is about 46% of the Moon’s; at spring tide the two add up.", source: "NOAA Ocean Service, ‘Tides and Water Levels’ tutorial"},
    callout: {text: '−33%', at: 'l0+1.6'},
    action: 'The Sun’s bulge is removed: the tide shrinks by a third.',
    lines: [I("If the Sun were gone, today's tide would be a third smaller.")],
  }),
  sh('go-look', stage('apartment', 'warm', push(2.2, 2.4, 1100, 600), [c(IT, 1150, 930, {outfit: 'cold', facing: 'left', pose: 'hold', hold: 'tideTable'}), c(Y, 900, 930, {outfit: 'cold', facing: 'right'})], [{at: 'l0+0.3', who: Y, pose: 'reach'}]), {
    dev: 'Ito sends them to check the tide',
    action: 'Ito hands Kai an old tide table.',
    lines: [I('Go and look.')],
  }),
  sh('harbour', stage('harbor', 'freeze', move([1.0, 900, 540], [1.12, 1000, 560]), [
    c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right'}),
    c(MI, 820, 940, {...COLD, facing: 'right'}),
  ]), {
    cue: 'wonder',
    transition: 'fade',
    action: 'The harbour. Torchlight on boats and black water.',
    lines: [N('So, Kai and I walked down to the harbour.')],
  }),
  sh('gauge', sc('closeup', {v: 'gauge'}), {
    action: 'The torch finds the painted tide gauge. The water sits exactly on Ito’s pencilled mark.',
    lines: [M("It's exactly on the line!")],
  }),
  sh('still-there', stage('harbor', 'freeze', push(2.4, 2.6, 720, 620), [c(Y, 700, 940, {...COLD, hold: 'torch', facing: 'right', expr: 'surprised'})]), {
    action: 'Kai lowers the tide table.',
    lines: [K("So the Sun's still there.")],
  }),
  sh('where-is-it', stage('harbor', 'freeze', push(2.8, 3.0, 820, 700), [c(MI, 820, 940, {...COLD, facing: 'front', expr: 'worried', pose: 'lookUp'})]), {
    action: 'Mira looks up at the black sky.',
    lines: [M('Then where is it?', 0.3)],
  }),
  sh('in-front', stage('harbor', 'freeze', move([1.55, 760, 700], [1.7, 760, 660]), [
    c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'lookUp', facing: 'right'}),
    c(MI, 820, 940, {...COLD, facing: 'right', pose: 'lookUp'}),
  ]), {
    cue: 'sting',
    twist: 2,
    beats: ['loop'],
    callout: {text: 'STILL THERE', at: 'l0+0.8', pos: 'top'},
    dev: 'the Sun is still there; something is in front of it',
    action: 'The two of them, tiny at the edge of the frozen harbour, staring at where the Sun should be.',
    lines: [N("The Sun hadn't gone anywhere. Something was in front of it.", 0.5)],
  }),
  sh('fish', sc('closeup', {v: 'fishIce'}), {
    science: {text: "Ice floats and insulates the water below it, so oceans freeze from the top and stay liquid underneath for a very long time.", source: "National Snow and Ice Data Center, ‘All About Sea Ice’"},
    beats: ['heart', 'laugh'],
    action: 'Mira’s mitten points down through a thin skin of new ice: under it, a fish glides past in the torch beam.',
    lines: [M("The sea's growing a skin. The fish don't mind!")],
  }),

  // ══ DAY 3 · the aurora ═══════════════════════════════════════════════════════════════════════
  sh('day3-roof', stage('roof', 'cold', move([1.0, 960, 520], [1.1, 960, 480]), [
    c(Y, 760, 900, {...COLD, facing: 'right'}),
    c(MI, 880, 900, {...COLD, facing: 'right'}),
    c(IT, 1160, 900, {...COLD, facing: 'left', hold: 'radio'}),
    c(B, 620, 900, {pose: 'sit'}),
  ]), {
    chapter: 'Day 3',
    hud: {day: 3, temp: -4},
    cue: 'wonder',
    transition: 'fade',
    action: 'Day 3. Back on the roof in coats. Breath smoking.',
    lines: [N('On Day 3, the sky did something beautiful.')],
  }),
  sh('aurora', sc('sky', {v: 'aurora'}), {
    science: {text: "Coronal mass ejections take roughly 1 to 4 days to reach Earth, so particles already on their way would still arrive after the light was gone.", source: "NOAA Space Weather Prediction Center, ‘Coronal Mass Ejections’"},
    beats: ['wow'],
    dev: 'the Sun’s last storm arrives',
    action: 'The whole sky ignites: green and violet curtains over the frozen city.',
    lines: [R('…a solar storm that left the Sun four days ago, still arriving tonight.')],
  }),
  sh('goodbye', stage('roof', 'aurora', push(2.6, 3.1, 880, 580), [c(MI, 880, 900, {...COLD, facing: 'front', expr: 'awe', pose: 'lookUp'})], [{at: 'l0+0.4', who: MI, expr: 'sad'}]), {
    beats: ['heart'],
    action: 'Mira, face lit green, watching.',
    lines: [M("It's saying goodbye.", 0.6)],
  }),

  // ── 1982 #2 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-room-2', stage('observatory', 'room', push(1.15, 1.3, 480, 560), [c(YI, 760, 920, {facing: 'left', outfit: 'home', hold: 'photo'})], [{at: 0.2, who: YI, to: 560, dur: 1.0}, {at: 1.2, who: YI, pose: 'reach', hold: null}, {at: 2.2, who: YI, look: [-0.6, -0.8]}], {plates: true}), y82({
    cue: 'y1982',
    transition: 'fade',
    min: 3.0,
    action: 'The young astronomer pins three plates to the wall beside a star chart.',
  })),
  sh('obs-chart', sc('closeup', {v: 'chart'}), y82({
    min: 3.6,
    action: 'Red lines, extended from each plate, meet at one faint star on the chart. He writes 22 beside it.',
  })),

  // ══ DAY 7 · the grid ═══════════════════════════════════════════════════════════════════════
  sh('grid-fail', sc('city', {v: 'gridFail'}), {
    science: {text: "Estimates for a sunless Earth: around −18 °C average after a week, around −73 °C after a year.", source: "Live Science, ‘What would happen if the sun disappeared?’"},
    chapter: 'Day 7',
    hud: {day: 7, temp: -18},
    cue: 'tension',
    transition: 'fade',
    dev: 'the grid collapses',
    sfx: 'powercut',
    action: 'The city from above. Districts go dark one after another, rolling toward their street.',
    lines: [N('On Day 7, the power went out.')],
  }),
  sh('bathtub', stage('bathroom', 'fill', push(1.5, 1.8, 900, 640), [c(Y, 700, 930, {pose: 'pour', facing: 'right', outfit: 'cold', expr: 'focused'}), c(IT, 1380, 930, {outfit: 'cold', facing: 'left'})]), {
    dev: 'they store water',
    action: 'Kai turns the bath tap on full while Ito watches from the door.',
    lines: [I('Fill the bath. Before the pipes freeze.')],
  }),
  sh('seal-room', stage('apartment', 'seal', push(1.15, 1.35, 900, 560), [
    c(Y, 780, 930, {pose: 'tape', hold: 'tape', facing: 'back', outfit: 'cold'}),
    c(MI, 1080, 930, {pose: 'holdBoth', holdL: 'tape', outfit: 'cold'}),
    c(B, 1220, 930, {pose: 'lie'}),
  ], [{at: 0.4, who: Y, loop: 'scratch', dur: 1.6}], {blankets: 'going-up'}), {
    dev: 'they build a warm room',
    action: 'Blankets taped over the windows of one room. Mira hands up the tape.',
    lines: [N('Mr. Ito showed us how to make one warm room.')],
  }),
  sh('freezer', stage('apartment', 'balcony', push(1.3, 1.5, 1100, 620), [c(Y, 900, 930, {pose: 'carry', facing: 'right', outfit: 'cold', holdL: 'bottle'})], [
    {at: 0.1, who: Y, to: 1250, dur: 1.4},
    {at: 'l0+0.6', who: Y, pose: 'stand', holdL: null, expr: 'smile'},
  ]), {
    beats: ['laugh'],
    action: 'Kai carries the food from the dead freezer out onto the frosted balcony.',
    lines: [K('Free fridge. Finally, some good news.')],
  }),
  sh('candles', stage('apartment', 'candle', push(1.4, 1.6, 980, 620), [
    c(Y, 860, 930, {...COLD, pose: 'kneel', hold: 'match'}),
    c(MI, 1080, 930, {...COLD, pose: 'sitHug', expr: 'cold'}),
    c(IT, 1320, 930, {...COLD, pose: 'sitChair', seat: 'chair', facing: 'left'}),
  ], [{at: 'l0+1', who: Y, hold: null, expr: 'focused'}], {candles: 'lighting'}), {
    action: 'Kai strikes a match and lights the candles.',
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
  sh('furniture', stage('stairs', 'smoke', push(1.6, 1.8, 980, 680), [c(Y, 900, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'scared'}), c(IT, 760, 940, {...COLD, facing: 'right', expr: 'worried'})], [{at: 0.3, who: Y, to: 1000, dur: 1}]), {
    action: 'The torch finds door 3B: firelight flickering underneath, smoke pouring out.',
    lines: [I("They're burning furniture. Indoors.")],
  }),
  sh('invisible', stage('stairs', 'smoke', dutch(2.6, 3.0, 800, 600, 6), [c(IT, 800, 940, {...COLD, facing: 'front', expr: 'determined', pose: 'point'})]), {
    science: {text: "Burning fuel indoors produces carbon monoxide, which is colourless and odourless; it is a leading cause of winter poisonings.", source: "US CDC, ‘Carbon Monoxide Poisoning’"},
    callout: {text: 'INVISIBLE', at: 'l0+1.6'},
    action: 'Ito, in the smoke, suddenly very loud.',
    lines: [I("Everyone out. The smoke you can see. The gas you can't.")],
  }),
  sh('evacuate', stage('stairs', 'evac', move([1.2, 700, 600], [1.2, 1300, 640]), [
    c(Y, 400, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right'}),
    c(MI, 250, 940, {...COLD, facing: 'right', expr: 'scared'}),
    c(IT, 120, 940, {...COLD, facing: 'right', hold: 'cane'}),
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
    action: 'Down the stairs: neighbours coughing into their sleeves, Kai with the torch, Mira at his heels, Ito with his cane, Biscuit ahead.',
    lines: [N('Mr. Ito got the whole floor out.')],
  }),
  sh('biscuit-bolts', stage('snowstreet', 'door', dutch(1.3, 1.6, 900, 640, -6), [
    c(Y, 760, 960, {...COLD, hoodUp: true, hold: 'torch', facing: 'right', expr: 'scared'}),
    c(B, 980, 960, {}),
  ], [
    {at: 0.3, who: B, to: 2200, gait: 'run', dur: 1.4},
    {at: 'l0+0.2', who: Y, pose: 'reach', hold: null, expr: 'scared'},
  ], {wind: 1}), {
    dev: 'Biscuit runs away',
    sfx: 'whoosh',
    action: 'The street door bangs open into a wall of wind and snow. Biscuit bolts into the dark.',
    lines: [N('At the street door, Biscuit panicked.')],
  }),
  sh('mira-shouts', stage('snowstreet', 'door', dutch(2.4, 2.9, 900, 560, 7), [c(MI, 900, 960, {...COLD, facing: 'right', expr: 'scared', pose: 'reach'})], [{at: 0, who: MI, loop: 'shiver', dur: 3}], {wind: 1}), {
    midroll: true,
    beats: ['loop'],
    action: 'Mira screams his name into the storm. Nothing comes back.',
    lines: [M('BISCUIT!', 1.0)],
  }),

  // ══ DAY 8 · the search ═════════════════════════════════════════════════════════════════════
  sh('day8-search', stage('snowstreet', 'search', move([1.1, 700, 560], [1.2, 1100, 600]), [c(Y, 300, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right', expr: 'worried'})], [{at: 0, who: Y, to: 1300, dur: 4}]), {
    chapter: 'Day 8',
    hud: {day: 8, temp: -21},
    cue: 'search',
    transition: 'fade',
    dev: 'the search',
    action: 'Day 8. Kai walks the frozen street alone with a torch. Buried cars. Silent snow.',
    lines: [K('Biscuit! Come on, boy!')],
  }),
  sh('always-night', stage('snowstreet', 'search', push(1.8, 2.2, 800, 640), [c(Y, 800, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'left', expr: 'sad'})], [{at: 'l0+0.5', who: Y, facing: 'right', look: [1, 0]}]), {
    action: 'Kai turns on the spot, sweeping the torch. Nothing.',
    lines: [N('Kai searched all night. Then again, it was always night now.')],
  }),
  sh('bark', stage('snowstreet', 'search', push(2.8, 3.2, 800, 580), [c(Y, 800, 960, {...COLD, hoodUp: true, hold: 'torch', facing: 'right', expr: 'surprised'})], [{at: 0.6, who: Y, turn: 0.8}], {woof: 0.35}), {
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
  sh('found', stage('snowstreet', 'vent', push(2.2, 2.6, 1460, 840), [c(B, 1480, 960, {pose: 'lie', wag: 0.2}), c(Y, 1150, 960, {...COLD, hoodUp: true, facing: 'right'})], [
    {at: 0.4, who: B, pose: 'stand', wag: 1},
    {at: 0.5, who: Y, to: 1360, dur: 0.8},
    {at: 1.3, who: Y, pose: 'kneelHug', expr: 'laugh'},
  ]), {
    cue: 'warm',
    beats: ['heart'],
    dev: 'Biscuit found',
    action: 'Biscuit is curled against the warm grate, frost on his whiskers. He sees Kai. His tail explodes.',
    lines: [K('You stupid, brilliant dog.')],
  }),
  sh('ground-heat', sc('diagram', {v: 'ground', step: 0}), {
    science: {text: "A few metres underground the temperature stays close to the yearly average (about 10–16 °C in many places), whatever the weather.", source: "US Department of Energy, ‘Geothermal Heat Pumps’"},
    callout: {text: '+10°C', at: 'l0+1'},
    beats: ['wow'],
    action: 'Cut-away of the ground: frozen surface, then the metro tunnels, then warm rock below.',
    lines: [N('A few metres down, the ground stays around ten degrees.')],
  }),
  sh('he-knew', stage('snowstreet', 'vent', move([1.2, 1100, 600], [1.35, 1350, 640]), [c(B, 1560, 960, {facing: 'left'}), c(Y, 1200, 960, {...COLD, hoodUp: true, facing: 'right'})], [
    {at: 0.3, who: B, loop: 'bounce', dur: 1.2, wag: 1},
    {at: 'l0', who: Y, expr: 'smile'},
  ]), {
    beats: ['heart'],
    action: 'Biscuit trots toward the stairs and looks back. Come on.',
    lines: [N("Biscuit hadn't run away. He'd found the way down.")],
  }),
  sh('follow-him', stage('metro', 'stairs', move([1.1, 900, 560], [1.15, 1000, 620]), [
    c(Y, 600, 900, {...COLD, hoodUp: true, pose: 'carry', facing: 'right'}),
    c(MI, 600, 900, {...COLD, carriedBy: 'you'}),
    c(IT, 380, 900, {...COLD, hold: 'cane', holdL: 'bag', facing: 'right'}),
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
    action: 'Down the metro stairs: Kai carrying Mira on his back, Ito, and behind them a line of torches.',
    lines: [N('By morning, half the street had followed him underground.')],
  }),

  // ══ DAY 30 · the station town ══════════════════════════════════════════════════════════════
  sh('day30-city', stage('metro', 'city', move([1.0, 960, 540], [1.12, 1060, 560]), TUNNEL, [
    {at: 0, who: 'extra:30', to: 800, dur: 3},
    {at: 0.5, who: 'extra:34', to: 1500, dur: 2},
    {at: 'l0', who: MI, loop: 'talk', dur: 2},
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
  sh('call-it-sunrise', stage('metro', 'sunrise', push(1.8, 2.1, 920, 640), [
    c(MI, 760, 900, {outfit: 'cold', facing: 'front', pose: 'cheer', expr: 'laugh'}),
    c(IT, 1040, 900, {outfit: 'cold', facing: 'front', expr: 'smile'}),
  ], [{at: 0.3, who: MI, loop: 'jump', dur: 0.6}], {sunrise: 0}), {
    beats: ['heart'],
    callout: {text: 'SUNRISE', at: 'l0+0.6', pos: 'top'},
    action: 'Faces turned up into the gold light. Mira jumps. Ito smiles.',
    lines: [I("We'll call it sunrise.")],
  }),
  sh('school', stage('metro', 'school', push(1.4, 1.7, 960, 600), [
    c(MI, 760, 900, {outfit: 'cold', hold: 'chalk', pose: 'point', facing: 'right', expr: 'smile'}),
    c('extra:301', 1040, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
    c('extra:302', 1200, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
    c('extra:303', 1360, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
    c('extra:304', 1520, 900, {outfit: 'cold', pose: 'sitChair', seat: 'crate', facing: 'left'}),
  ], [{at: 'l0', who: MI, loop: 'talk', dur: 2.4}]), {
    dev: 'Mira teaches the little ones',
    action: 'In a parked carriage turned classroom, Mira (the tallest child in the room) teaches four much smaller kids to draw a sun.',
    lines: [M("It's yellow. And round. And it's warm on your face.")],
  }),
  sh('forgotten', stage('metro', 'school', push(2.8, 3.1, 1200, 700), [c('extra:302', 1200, 900, {outfit: 'cold', pose: 'holdBoth', facing: 'front', expr: 'sad', hold: 'drawing'})], [{at: 0.5, who: 'extra:302', loop: 'bounce', dur: 0.8}, {at: 'l0+1.4', who: 'extra:302', expr: 'worried'}]), {
    beats: ['heart'],
    action: 'A small kid holds up her drawing: a grey sun.',
    lines: [N('Some of them had already forgotten what colour it was.', 0.6)],
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

  // ── 1982 #3 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-letter', sc('closeup', {v: 'letter'}), y82({
    cue: 'y1982',
    transition: 'fade',
    min: 3.4,
    action: 'A typed letter under the lamp: the Council cannot support further observations, nor any transmission. His thumb covers the name.',
  })),
  sh('obs-phone', stage('observatory', 'room', push(1.5, 1.7, 1560, 600), DESK({x: 1640, pose: 'sitPhone', hold: 'receiver', expr: 'sad', facing: 'right'}), [{at: 1.6, who: YI, expr: 'sad', look: [0.2, 0.6]}], {phoneUp: true}), y82({
    min: 3.2,
    action: 'The receiver at his ear. Down the line, a colleague laughs. He says nothing.',
  })),

  // ══ DAY 40 · the camera ════════════════════════════════════════════════════════════════════
  sh('workshop', stage('metro', 'workshop', push(1.55, 1.8, 980, 660), [c(IT, 1040, 900, {outfit: 'cold', pose: 'reach', expr: 'focused', look: [-0.3, 0.8], facing: 'left'})], [{at: 1.4, who: IT, pose: 'holdBoth', hold: 'thermal', look: [0, 0.4]}, {at: 'l0+2.2', who: IT, look: [0.6, -0.6], expr: 'determined'}], {parts: true}), {
    dev: 'Ito builds a heat camera',
    transition: 'fade',
    action: 'Ito at a workbench, a firefighter’s thermal camera in pieces under a magnifier light.',
    lines: [N("Mr. Ito spent weeks rebuilding a firefighter's camera.")],
  }),
  sh('heat-not-light', stage('metro', 'workshop', push(2.6, 3.0, 1000, 600), [c(IT, 1000, 900, {outfit: 'cold', pose: 'hold', hold: 'thermal', facing: 'front', expr: 'determined'}), c(Y, 760, 900, {outfit: 'cold', facing: 'right'})]), {
    action: 'He looks up at Kai over his glasses.',
    lines: [I("It sees heat, not light. If something's out there, it has to be warm.")],
  }),
  sh('day40-surface', stage('surface', 'noon', move([1.0, 960, 520], [1.15, 960, 500]), [
    c(Y, 700, 940, {...COLD, hoodUp: true, hold: 'torch', facing: 'right'}),
    c(MI, 600, 940, {...COLD, facing: 'right'}),
    c(IT, 1080, 940, {...COLD, hold: 'thermal', pose: 'hold', facing: 'right'}),
  ], [{at: 0, who: Y, to: 860, dur: 1.6}, {at: 0, who: MI, to: 760, dur: 1.6}]), {
    chapter: 'Day 40',
    hud: {day: 40, temp: -41},
    cue: 'mystery',
    transition: 'fade',
    action: 'Day 40. They climb out into a dead white city.',
    lines: [N('On Day 40, he took us up to the surface.')],
  }),
  sh('aim', stage('surface', 'noon', push(1.9, 2.3, 1060, 560), [c(IT, 1080, 940, {...COLD, hold: 'thermal', pose: 'reachUp', facing: 'right'})]), {
    action: 'He raises the camera at an empty patch of black sky.',
    lines: [N('He pointed it where the Sun should have been.')],
  }),
  sh('its-warm', sc('thermal', {v: 'disc'}), {
    science: {text: "Anything that absorbs starlight must give off waste heat as infrared; this is how astronomers search for Dyson spheres.", source: "Freeman Dyson, ‘Search for Artificial Stellar Sources of Infrared Radiation’, Science (1960)"},
    dev: 'something warm where the Sun should be',
    action: 'The camera screen, false colour. Black sky, and in the middle, a faint warm disc.',
    lines: [I("It's warm.", 0.5)],
  }),
  sh('bigger', stage('surface', 'noon', push(2.7, 3.2, 1080, 560), [c(IT, 1080, 940, {...COLD, hold: 'thermal', pose: 'hold', facing: 'front', expr: 'scared'})]), {
    action: 'Ito lowers the camera. His glasses have frosted.',
    lines: [I("And it's twice as wide as the Sun.")],
  }),
  sh('shell-reveal', sc('space', {v: 'shellReveal'}), {
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
  sh('who-built', stage('metro', 'workshop', push(2.4, 2.6, 860, 640), [c(MI, 860, 900, {outfit: 'cold', facing: 'right', expr: 'scared'}), c(IT, 1000, 900, {outfit: 'cold', facing: 'left'})]), {
    cue: 'mystery',
    transition: 'fade',
    action: 'Back below, in the workshop. Mira looks up at Ito.',
    lines: [M('Who built it?', 0.4)],
  }),
  sh('not-in-a-day', stage('metro', 'workshop', push(2.2, 2.4, 760, 620), [c(Y, 760, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}), c(IT, 1000, 900, {outfit: 'cold', facing: 'left'})], [{at: 'l0', who: Y, loop: 'shake', dur: 1.2}, {at: 'l0+0.8', who: IT, look: [-0.6, 0.6]}]), {
    action: 'Kai, shaking his head.',
    lines: [K('Nobody could build that in a day.')],
  }),
  sh('nobody-did', stage('metro', 'workshop', push(2.6, 2.8, 1000, 600), [c(IT, 1000, 900, {outfit: 'cold', facing: 'front', expr: 'neutral', holdL: 'bag'})], [{at: 'l0+0.8', who: IT, pose: 'reach'}]), {
    action: 'Ito reaches into the canvas bag.',
    lines: [I('No. Nobody did.', 0.3)],
  }),
  sh('photo1919', sc('closeup', {v: 'photo1919'}), {
    dev: 'Ito’s 1919 photograph shows the lines',
    action: 'An old eclipse photograph in Ito’s hand: three faint, perfectly straight lines crossing the corona.',
    lines: [I('Nineteen-nineteen. Look at the lines.')],
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
    dev: 'someone closed it',
    action: 'Every slat turns at once. The window goes dark. The Sun’s light is trapped inside.',
    lines: [I('And on the morning the Sun went out, someone closed it.', 0.4)],
  }),
  sh('you-knew', stage('metro', 'workshop', push(2.8, 3.0, 860, 680), [c(MI, 860, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}), c(IT, 1000, 900, {outfit: 'cold', facing: 'left'})]), {
    action: 'Mira, sharp.',
    lines: [M("You've seen those lines before?")],
  }),
  sh('nobody-listened', stage('metro', 'workshop', push(2.8, 3.1, 1000, 600), [c(IT, 1000, 900, {outfit: 'cold', facing: 'left', expr: 'sad', look: [-0.6, 0.7]})], [{at: 0.2, who: IT, loop: 'shake', dur: 0.9}, {at: 'l0+1.6', who: IT, look: [-0.9, 0.9]}]), {
    beats: ['loop'],
    action: 'Ito, not meeting her eyes.',
    lines: [I('I saw them once. A long time ago. Nobody listened.', 0.4)],
  }),
  sh('even-true', stage('metro', 'workshop', push(2.2, 2.4, 930, 640), [c(MI, 860, 900, {outfit: 'cold', facing: 'right', expr: 'worried'}), c(IT, 1000, 900, {outfit: 'cold', facing: 'left', expr: 'sad'})], [{at: 0.4, who: MI, look: [1, -0.3]}, {at: 'l0+0.8', who: IT, look: [-0.8, 0.8]}, {at: 'l0+1.6', who: MI, expr: 'sad'}]), {
    action: 'The two of them in the lamplight. Mira watches him.',
    lines: [N('I believed him. It was even true.', 0.6)],
  }),

  // ══ DAY 100 → 180 · the dark, and the light ═══════════════════════════════════════════════
  sh('day100-flicker', stage('metro', 'city', hold(1.05, 960, 540), TUNNEL, [{at: 'l0+1', who: MI, expr: 'scared'}], {flicker: 'l0+0.6'}), {
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
    c('extra:50', 1350, 900, {...COLD, hold: 'torch', facing: 'right'}),
  ], [{at: 'l0+0.6', who: IT, to: 1420, dur: 2.4}, {at: 0.4, who: 'extra:50', to: 1700, dur: 3}]), {
    dev: 'Ito joins the engineers',
    action: 'Ito follows the engineers into the dark tunnel, torch in hand.',
    lines: [I('I know a little about old machines.')],
  }),
  sh('cold-night', stage('metro', 'dark', push(2.0, 2.5, 980, 700), [
    c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug'}),
    c(MI, 1040, 900, {...COLD, pose: 'sitHug', expr: 'cold'}),
    c(B, 1160, 900, {pose: 'lie'}),
  ], [{at: 0.2, who: MI, loop: 'shiver', dur: 4}]), {
    action: 'Under every blanket they own, Kai and Mira shiver. Breath smoking even down here.',
    lines: [N('That was the coldest night.')],
  }),
  sh('how-it-ends', stage('metro', 'dark', push(3.0, 3.4, 960, 600), [c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug', facing: 'front', expr: 'sad'})]), {
    midroll: true,
    beats: ['heart', 'loop'],
    action: 'Kai’s face in the last candle light. For once, no joke.',
    lines: [K('How does this end, Mira?', 0.8)],
  }),
  sh('lights-on', stage('metro', 'dark', push(3.0, 3.3, 1040, 700), [c(MI, 1040, 900, {...COLD, pose: 'sitHug', facing: 'front', expr: 'determined'})]), {
    beats: ['heart'],
    action: 'Mira, small and certain.',
    lines: [M('With the lights coming back on.', 0.6)],
  }),
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
    lines: [N('On Day 180, they did.')],
  }),
  sh('mum-returns', stage('metro', 'city', push(1.6, 1.8, 1000, 640), [
    c(MU, 1500, 900, {outfit: 'cold', facing: 'left', expr: 'smile'}),
    c(MI, 760, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}),
    c(Y, 640, 900, {outfit: 'cold', facing: 'right', expr: 'surprised'}),
  ], [
    {at: 0, who: MU, to: 1180, dur: 1.4},
    {at: 0.4, who: MI, to: 1060, gait: 'run', dur: 0.8, expr: 'laugh'},
    {at: 0.6, who: Y, to: 940, gait: 'run', dur: 0.9, expr: 'laugh'},
    {at: 1.4, who: MI, pose: 'hug'},
    {at: 1.5, who: MU, pose: 'hug'},
  ]), {
    beats: ['heart'],
    dev: 'Mum comes home',
    action: 'A woman in a navy coat over nurse’s scrubs walks out of the tunnel. Mira and Kai run.',
    lines: [N('And so did Mum.', 0.8)],
  }),
  sh('mum-thanks', stage('metro', 'city', push(2.2, 2.4, 1260, 620), [c(MU, 1180, 900, {outfit: 'cold', facing: 'right', expr: 'smile'}), c(IT, 1380, 900, {outfit: 'cold', facing: 'left', expr: 'smile'})]), {
    action: 'Mum turns to Ito, grease-stained and grinning.',
    lines: [MUM('You kept them alive.')],
  }),
  sh('they-kept-me', stage('metro', 'city', push(2.8, 3.0, 1380, 600), [c(IT, 1380, 900, {outfit: 'cold', facing: 'left', expr: 'smile'})]), {
    beats: ['heart'],
    action: 'Ito, quietly.',
    lines: [I('They kept me alive.', 0.4)],
  }),
  sh('an-ear', stage('metro', 'workshop', push(2.0, 2.2, 900, 640), [c(MI, 780, 900, {outfit: 'cold', facing: 'right', expr: 'focused'}), c(IT, 1000, 900, {outfit: 'cold', facing: 'left', pose: 'holdBoth', hold: 'ear'})]), {
    dev: 'Ito builds "an ear"',
    action: 'Later. Ito at his bench with wires and a little dish. Mira leans in.',
    lines: [M('What are you building?')],
  }),
  sh('ear', stage('metro', 'workshop', push(2.8, 3.0, 1000, 600), [c(IT, 1000, 900, {outfit: 'cold', facing: 'front', pose: 'holdBoth', hold: 'ear', expr: 'neutral'})]), {
    action: 'Ito, holding it up.',
    lines: [I('Something to listen with.', 0.4)],
  }),

  // ══ DAY 300 · the thread ═══════════════════════════════════════════════════════════════════
  sh('day300', stage('surface', 'deep', move([1.0, 960, 560], [1.12, 1000, 540]), [
    c(IT, 1000, 940, {...COLD, pose: 'reach', facing: 'right', expr: 'focused'}),
    c(Y, 780, 940, {...COLD, hoodUp: true, hold: 'torch', facing: 'right'}),
    c(MI, 660, 940, {...COLD, facing: 'right'}),
  ], [], {lens: 1180}), {
    chapter: 'Day 300',
    hud: {day: 300, temp: -68},
    cue: 'mystery',
    transition: 'fade',
    action: 'Day 300. The surface again. Ito’s camera has a much bigger lens.',
    lines: [N('By Day 300, his camera had a much bigger lens.')],
  }),
  sh('thread', sc('thermal', {v: 'beam'}), {
    dev: 'a beam leaves the shell',
    action: 'Thermal view: the warm disc, and from it a thin glowing thread running off into space.',
    lines: [N('A thin, warm thread was leaving the shell.')],
  }),
  sh('beam-map', sc('diagram', {v: 'beam', shell: true}), {
    action: 'The solar system tilts to the side: the beam rises straight out of the plane the planets move in.',
    lines: [I("It's sending the light away. Out of the plane of the planets.")],
  }),
  sh('sending-where', stage('surface', 'deep', push(2.1, 2.3, 730, 640), [c(MI, 660, 940, {...COLD, facing: 'right', expr: 'worried'}), c(Y, 780, 940, {...COLD, hoodUp: true, hold: 'torch', facing: 'right', expr: 'worried'})], [], {lens: 1180}), {
    action: 'Kai and Mira, watching Ito.',
    lines: [K('Sending it where?')],
  }),
  sh('star', sc('thermal', {v: 'star'}), {
    min: 2.6,
    action: 'The camera follows the thread to its end: one faint star, ringed on the screen.',
  }),
  sh('twenty-two', stage('surface', 'deep', dutch(2.8, 3.3, 1000, 560, -5), [c(IT, 1000, 940, {...COLD, facing: 'front', expr: 'scared'})], [], {lens: 1180}), {
    cue: 'shellSting',
    twist: 5,
    sfx: 'impact',
    dev: 'Ito recognises the star',
    action: 'Ito goes white. Barely a whisper.',
    lines: [I('Twenty-two.', 1.0)],
  }),
  sh('didnt-ask', stage('surface', 'deep', push(1.5, 1.7, 860, 620), [
    c(IT, 1000, 940, {...COLD, facing: 'left', expr: 'sad', look: [0, 0.7]}),
    c(Y, 780, 940, {...COLD, hoodUp: true, facing: 'right', expr: 'worried'}),
    c(MI, 660, 940, {...COLD, facing: 'right', expr: 'worried', look: [1, -0.4]}),
  ], [], {lens: 1180}), {
    action: 'They stand in the snow. Mira watches Ito. He says nothing more.',
    lines: [N("He whispered a number. Twenty-two. I didn't ask what it meant.")],
  }),
  sh('beam-space', sc('space', {v: 'beam'}), {
    cue: 'shell',
    beats: ['wow'],
    action: 'The shell from far away, a needle of energy leaving it toward one faint star.',
    lines: [N("All the Sun's light, sent to one star.", 0.6)],
  }),

  // ── 1982 #4 ─────────────────────────────────────────────────────────────────────────────────
  sh('obs-hesitate', stage('observatory', 'room', push(1.7, 1.9, 1520, 640), DESK({x: 1440, pose: 'sitChair', expr: 'worried'}), [{at: 1.2, who: YI, pose: 'reach'}]), y82({
    cue: 'y1982',
    transition: 'fade',
    min: 2.8,
    action: 'At the transmitter. His finger hovers over the key. He looks at the chart: 22.',
  })),
  sh('obs-press', sc('closeup', {v: 'morse', taps: [0.7]}), y82({
    min: 1.6,
    action: 'He presses it, once.',
  })),

  // ══ DAY 365 · the birthday ═════════════════════════════════════════════════════════════════
  sh('day365', stage('surface', 'milky', move([1.0, 960, 660], [1.14, 960, 600]), [
    c(Y, 820, 940, {...COLD, hoodUp: true, facing: 'back'}),
    c(MI, 940, 940, {...COLD, facing: 'back'}),
    c(MU, 1040, 940, {outfit: 'cold', facing: 'back'}),
    c(IT, 1200, 940, {...COLD, facing: 'back', hold: 'ear'}),
    c(B, 680, 940, {pose: 'sit'}),
  ], [
    {at: 'l0+0.8', who: MI, pose: 'pointUp'},
    {at: 'l0+1.2', who: B, pose: 'beg', wag: 1},
  ]), {
    chapter: 'Day 365',
    hud: {day: 365, temp: -73},
    cue: 'finale',
    transition: 'fade',
    beats: ['wow'],
    action: 'Day 365. All of them on the surface, tiny under the brightest Milky Way anyone has ever seen.',
    lines: [N('On Day 365, we all went up to the surface together.')],
  }),
  sh('point-it', stage('surface', 'milky', push(2.4, 2.6, 1200, 620), [c(IT, 1200, 940, {...COLD, facing: 'right', pose: 'holdBoth', hold: 'ear', expr: 'focused'})], [{at: 0.3, who: IT, pose: 'reachUp'}, {at: 'l0+0.8', who: IT, look: [0.8, -0.8]}]), {
    action: 'Ito sets up his little receiver dish on the snow.',
    lines: [I('I need to point this at the Sun.')],
  }),
  sh('birthday', stage('surface', 'milky', push(1.75, 1.95, 970, 700), [
    c(MI, 900, 940, {...COLD, facing: 'front', expr: 'smile'}),
    c(Y, 1040, 940, {...COLD, hoodUp: true, facing: 'left'}),
  ], [{at: 'l0+1', who: Y, expr: 'smile'}]), {
    beats: ['heart'],
    action: 'Mira grins up at Kai.',
    lines: [M('One whole lap around the Sun. Happy birthday, Earth.')],
  }),
  sh('from-the-sun', stage('surface', 'milky', push(2.6, 2.9, 1200, 620), [c(IT, 1200, 940, {...COLD, facing: 'front', pose: 'holdBoth', hold: 'ear', expr: 'surprised'})]), {
    cue: 'signal',
    sfx: 'chime',
    dev: 'a signal from the Sun',
    action: 'The receiver clicks. Ito’s face changes.',
    lines: [I("It's coming from the Sun.")],
  }),
  sh('counting', stage('surface', 'milky', push(2.2, 2.5, 960, 640), [
    c(Y, 880, 940, {...COLD, hoodUp: true, facing: 'right', expr: 'focused'}),
    c(IT, 1100, 940, {...COLD, facing: 'left', pose: 'holdBoth', hold: 'ear'}),
  ], [{at: 'l0', who: Y, loop: 'nod', dur: 2.4}], {pulses: true}), {
    callout: {text: '1 · 2 · 3', at: 'l0'},
    action: 'Pulses: one, then two, then three. Kai counts along.',
    lines: [K('One.', 0.4), K('Two.', 0.4), K('Three.', 0.7)],
  }),
  sh('count-planets', sc('diagram', {v: 'count', shell: true}), {
    dev: 'it seems to be counting the planets',
    action: 'The planets in a row. Mercury lights up. Venus. Earth.',
    lines: [K('Mercury. Venus. Earth.')],
  }),
  sh('stopped', sc('diagram', {v: 'count', step: 1, shell: true}), {
    action: 'The count stops on Earth. Earth, alone, highlighted.',
    lines: [K('It stopped at three.', 0.8)],
  }),
  sh('thats-us', stage('surface', 'milky', push(2.8, 3.4, 940, 600), [c(MI, 940, 940, {...COLD, facing: 'front', expr: 'scared'})]), {
    cue: 'shellSting',
    twist: 6,
    beats: ['loop'],
    sfx: 'impact',
    action: 'Mira, very quietly.',
    lines: [M("That's us.", 1.0)],
  }),
  sh('ito-no', stage('surface', 'milky', push(2.8, 3.1, 1200, 600), [c(IT, 1200, 940, {...COLD, facing: 'front', expr: 'sad', hold: 'ear'})], [{at: 0.3, who: IT, loop: 'shake', dur: 1.0}, {at: 'l1', who: IT, look: [0, -0.8], expr: 'scared'}]), {
    action: 'Ito shakes his head, slowly.',
    lines: [I('No.', 0.6), I("It isn't counting planets.", 0.6)],
  }),

  // ══ THE TURN · 1982, revealed ══════════════════════════════════════════════════════════════
  sh('obs-knock', sc('closeup', {v: 'morse', taps: [0.6, 1.5, 1.72, 2.6, 2.82, 3.04]}), y82({
    cue: 'dawn1982',
    min: 3.6,
    action: 'The Morse key again. One… two-two… three-three-three: the same rhythm as the pulses.',
  })),
  sh('obs-dawn', stage('observatory', 'dawn', push(1.0, 1.1, 960, 560), [c(YI, 640, 860, {facing: 'right', outfit: 'home'}, 0.5)], [{at: 0.4, who: YI, to: 860, dur: 2.4}], {sunrise: 0.8, aim: 1}), y82({
    letterbox: true,
    min: 4.6,
    beats: ['wow'],
    action: 'He walks out of the dome. Over the far ridge, the sky goes gold, and the Sun rises.',
  })),
  sh('obs-tap', sc('closeup', {v: 'tapRail', taps: [0.45, 1.0, 1.55]}), y82({
    letterbox: true,
    min: 2.2,
    action: 'Close: his hand on the dome railing in the sunrise. Tap. Tap. Tap.',
  })),
  sh('obs-face', stage('observatory', 'dawn', push(3.0, 3.2, 860, 640), [c(YI, 860, 860, {facing: 'front', outfit: 'home', expr: 'smile'}, 1.2)], [{at: 1.0, who: YI, look: [0.4, -0.3]}], {sunrise: -5, aim: 1}), y82({
    letterbox: true,
    min: 3.0,
    action: 'His face in the sunrise, round glasses glinting.',
  })),
  sh('ito-face', stage('surface', 'milky', push(2.4, 2.55, 1200, 660), [c(IT, 1200, 940, {...COLD, facing: 'front', expr: 'sad', hold: 'cane', pose: 'cane'})], [{at: 0.4, who: IT, loop: 'tap', dur: 1.3}]), {
    transition: 'match',
    letterbox: true,
    twist: 7,
    callout: {text: 'THE SAME MAN', at: 'l0+0.4', pos: 'top'},
    dev: 'the man in the observatory was Mr. Ito',
    action: 'Match cut: the same face, forty-four years older, in starlight, tapping his cane three times.',
    lines: [N('The man in the observatory was Mr. Ito. Forty-four years ago.', 0.4)],
  }),
  sh('explain-chart', sc('closeup', {v: 'chart'}), {
    dev: 'what he did in 1982',
    action: 'The star chart again: the three lines meeting at one star. 22.',
    lines: [N('He found the lines, and the star they pointed to.')],
  }),
  sh('explain-knock', sc('closeup', {v: 'morse', taps: [0.9, 1.9, 2.1, 3.0, 3.2, 3.4]}), {
    action: 'His young hand on the key.',
    lines: [N('And he knocked. One. Two. Three.', 0.4)],
  }),
  sh('explain-years', sc('diagram', {v: 'knock'}), {
    science: {text: "Radio waves travel at the speed of light, so a signal to a star 22 light-years away and an answer back take 44 years.", source: "Definition of the light-year (IAU); c = 299,792 km/s"},
    dev: 'the 44-year round trip',
    action: 'Earth and a star 22 light-years apart. The knock crosses out: 1982 → 2004. The answer crosses back: 2004 → 2026.',
    lines: [N('Twenty-two years to get there. Twenty-two years to come back.')],
  }),
  sh('been-knocking', stage('surface', 'milky', push(2.6, 2.8, 1150, 600), [c(MI, 1000, 940, {...COLD, facing: 'right', expr: 'surprised'}), c(IT, 1200, 940, {...COLD, facing: 'left', expr: 'sad', hold: 'ear'})], [{at: 'l0', who: IT, loop: 'talk', dur: 2.0}, {at: 'l0+0.4', who: MI, expr: 'scared'}]), {
    dev: 'it has been answering all year',
    action: 'Ito turns to Mira.',
    lines: [I("It's been knocking back since the morning the Sun went out.")],
  }),
  sh('where-to-listen', stage('surface', 'milky', push(3.0, 3.2, 1200, 600), [c(IT, 1200, 940, {...COLD, facing: 'left', expr: 'sad', hold: 'ear'})], [{at: 0.3, who: IT, look: [0, 0.8]}, {at: 'l0+1.0', who: IT, loop: 'shake', dur: 0.8}]), {
    action: 'Close on Ito.',
    lines: [I('I was the only one who knew where to listen.')],
  }),
  sh('answering', stage('surface', 'milky', dutch(3.2, 3.5, 1200, 590, 4), [c(IT, 1200, 940, {...COLD, facing: 'front', expr: 'scared', hold: 'ear'})], [{at: 0.2, who: IT, look: [0, -1]}, {at: 'l1', who: IT, pose: 'pointUp'}]), {
    cue: 'shellSting',
    sfx: 'impact',
    callout: {text: "IT'S ANSWERING", at: 'l1+0.2'},
    dev: 'it is not counting, it is answering',
    action: 'Ito, looking up at the black sky.',
    lines: [I("It isn't counting.", 0.3), I("It's answering.", 0.8)],
  }),
  sh('sorry', stage('surface', 'milky', push(2.2, 2.4, 1100, 660), [c(MI, 1000, 940, {...COLD, facing: 'right', expr: 'sad'}), c(IT, 1200, 940, {...COLD, facing: 'left', expr: 'sad'})], [{at: 'l0+0.8', who: MI, to: 1080, dur: 0.6}, {at: 'l0+1.4', who: MI, pose: 'reach'}]), {
    beats: ['heart'],
    action: 'Ito looks at Mira. Mira steps in and takes his hand.',
    lines: [I("I'm sorry, Mira.", 1.2)],
  }),

  // ══ CODA ═══════════════════════════════════════════════════════════════════════════════════
  sh('world-listen-beach', stage('montage', 'beach', push(1.55, 1.7, 1000, 840), [c('extra:56', 1000, 1060, {facing: 'front', outfit: 'cold', hold: 'radio', pose: 'holdBoth', expr: 'focused', breath: true}, 1.0)], [], {dark: 0, boardX: 4000, frozen: true, pulse: [1000, 900]}), {
    hud: {place: 'SYDNEY', time: 'DAY 365'},
    cue: 'afterglow',
    transition: 'fade',
    dev: 'the world hears the answer',
    action: 'Sydney, Day 365: the sea frozen mid-wave, snow on the sand. The surfer in a parka, a radio pulsing in her hands.',
    lines: [N('That night, Mr. Ito told the world.')],
  }),
  sh('world-listen-field', stage('montage', 'field', hold(1.25, 900, 640), [c('extra:62', 900, 930, {facing: 'front', outfit: 'cold', hold: 'radio', pose: 'holdBoth', expr: 'awe', breath: true}, 1.3)], [], {dark: 0, frozen: true, pulse: [900, 720]}), {
    hud: {place: 'TAMIL NADU', time: 'DAY 365'},
    action: 'The farmer in his snow-buried field, listening.',
    lines: [N('Every radio on Earth heard it.')],
  }),
  sh('world-listen-bus', stage('montage', 'bus', push(1.5, 1.65, 900, 760), [c('extra:17', 900, 960, {facing: 'front', outfit: 'cold', hold: 'radio', pose: 'holdBoth', expr: 'surprised', breath: true}, 1.4)], [], {dark: 0, noBus: true, frozen: true, pulse: [900, 790]}), {
    hud: {place: 'MANILA', time: 'DAY 365'},
    min: 2.0,
    action: 'The boy at the snowed-in bus stop, a radio pulsing in his hands.',
  }),
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
    hud: {place: 'EVERY MORNING', time: '1982 – 2026'},
    cue: 'end',
    transition: 'fade',
    beats: ['heart'],
    dev: 'why he watched every sunrise',
    action: 'A memory, warm as home movie: the same roof, every dawn for forty-four years. Mr. Ito, young, then greying, then old, taps his telescope three times as the Sun comes up.',
    lines: [N('Every morning for forty-four years, Mr. Ito watched the sunrise.', 0.6)],
  }),
  sh('liked-it', stage('roof', 'dawn', push(2.6, 3.2, 1150, 600, 1180, 570), [c(IT, 1150, 900, {outfit: 'home', facing: 'right', expr: 'smile'})], [{at: 0.4, who: IT, look: [0.9, -0.6]}, {at: 'l0+1.0', who: IT, expr: 'sad'}]), {
    thread: 'memory',
    look: 'memory',
    action: 'Close on his face in the early light.',
    lines: [N('I used to think it was because he liked it.', 1.4)],
  }),
  sh('end', sc('end'), {
    cue: 'end',
    min: 15,
    action: 'The end screen: the shell turning, its three pulses, THE REPLY, and room for the subscribe and next-video cards.',
    lines: [N('Whoever answered is still out there.'), N('What would you say back? Tell us in the comments.', 1.0)],
  }),
];

export const sun01: Episode = {
  id: 'sun01',
  file: 'FILE 001',
  title: 'The Sun Went Out',
  youtubeTitle: 'The Sun Went Out. Day 1 to Day 365',
  thumbnailText: 'WHO BUILT THIS?',
  commentPrompt: 'Something knocked back. What would you say?',
  logline:
    "On a summer morning the Sun goes out. Eight-year-old Mira, her brother Kai and Mr. Ito, the retired astronomer upstairs, survive a year in the dark and work out, clue by clue, what happened. Every clue is real physics. The man saving them is the reason it happened.",
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
    'the sun',
    'earth without the sun',
    'plot twist',
    'the blink files',
  ],
  pinnedComment: 'When did you realise who the man in the observatory was? 👀\n\nAnd: something knocked back. What would you say? Best answer gets read out in the next File. 👇',
  fps: 30,
  style: 'cinema',
  shots,
};
