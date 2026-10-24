import type {Line, Shot, Episode} from '../../src/engine/schema';

/**
 * THE BLINK FILES · File 001 — "The Sun Went Out. Here's Your Day 1 to Day 365" (v2)
 *
 * Premise: the Sun did not die. Something closed around it. The audience solves it with the family, one clue at a
 * time (every clue is real physics), and the episode ends on contact. Second-person narration; one shot per
 * sentence or action; a plot development at least every 30 s (lint-enforced). Physics notes + sources:
 * docs/10-sun01-logic-audit.md. Stage shots place the cast once at natural scale and let the camera do the
 * framing, so relative heights can never drift.
 */

const N = (text: string, pause?: number): Line => ({speaker: 'NARRATOR', text, pause});
const M = (text: string, pause?: number): Line => ({speaker: 'MIRA', text, pause});
const I = (text: string, pause?: number): Line => ({speaker: 'ITO', text, pause});
const R = (text: string, pause?: number): Line => ({speaker: 'RADIO', text, pause});

type K = [number, number, number, number, number?];
/** Camera: hold, slow push in, or move between two framings. [z, x, y] are zoom and the point centred. */
const hold = (z: number, x: number, y: number): K[] => [[0, z, x, y], [1, z * 1.04, x, y]];
const push = (z0: number, z1: number, x: number, y: number, x1 = x, y1 = y, r = 0): K[] => [[0, z0, x, y, 0], [1, z1, x1, y1, r]];
const move = (a: [number, number, number], b: [number, number, number], at = 0): K[] => [[at, ...a], [1, ...b]];

const Y = 'you';
const MI = 'mira';
const IT = 'ito';
const B = 'biscuit';
type C = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
const c = (who: string, x: number, y: number, o: Record<string, unknown> = {}, depth = 1.2): C => ({who, x, y, depth, ...o});

/** Stage shot: a detailed set + the cast + their acting + a camera. */
const stage = (set: string, v: string, cam: K[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({
  scene: 'stage',
  props: {set, v, cam, cast, acts, ...extra},
});

const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});

// Recurring blocking
const KITCHEN = (o: {you?: object; mira?: object; dog?: object} = {}) => [
  c(Y, 640, 930, {pose: 'hold', hold: 'mug', facing: 'right', ...o.you}),
  c(MI, 1180, 850, {pose: 'sitChair', hold: 'chalk', facing: 'left', ...o.mira}),
  c(B, 980, 930, {pose: 'sit', ...o.dog}),
];
const ROOF0 = [
  c(IT, 1150, 900, {pose: 'holdBoth', outfit: 'home', facing: 'left'}),
  c(Y, 760, 900, {facing: 'right'}),
  c(MI, 880, 900, {facing: 'right'}),
  c(B, 620, 900, {pose: 'sit', hold: 'toast'}),
];
const COLD = {outfit: 'cold', breath: true};
const TUNNEL = [
  c('extra:30', 300, 900, {outfit: 'cold', pose: 'carry', facing: 'right'}),
  c('extra:31', 520, 900, {outfit: 'cold', pose: 'sitChair'}),
  c(Y, 980, 900, {outfit: 'cold', facing: 'right'}),
  c(MI, 1100, 900, {outfit: 'cold', facing: 'left'}),
  c('extra:33', 1400, 900, {outfit: 'cold', pose: 'pour', facing: 'left'}),
  c('extra:34', 1650, 900, {outfit: 'cold', facing: 'left'}),
];

const shots: Shot[] = [
  // ══ COLD OPEN · 0:00 ═══════════════════════════════════════════════════════════════════════
  sh('shell-closes', sc('space', {v: 'close'}), {
    chapter: 'Minute zero',
    cue: 'open',
    lead: 0.3,
    dev: 'something closes around the Sun',
    action: 'The Sun fills the frame, alive and roaring. Dark plates slide in from every side and lock together. Black.',
    lines: [N('At six forty-four this morning, something closed around the Sun.', 0.3)],
  }),
  sh('light-race', sc('space', {v: 'race'}), {
    callout: {text: '8:20', at: 'l0+1.2'},
    dev: 'the last light is racing toward Earth',
    action: 'The last shell of sunlight races out toward a tiny blue Earth. The dark follows it.',
    lines: [N('Its last light is still racing toward you.')],
  }),
  sh('light-race-earth', sc('space', {v: 'raceEarth'}), {
    science: {text: "Sunlight takes about 8 minutes 20 seconds to cross the 150 million km to Earth, so we would not notice anything for 8:20.", source: "NASA Science, ‘Sun: Facts’ (science.nasa.gov/sun)"},
    action: 'Ride along the light front. Earth grows from a dot.',
    lines: [N('It will reach Earth in eight minutes and twenty seconds.')],
  }),
  sh('kitchen-morning', stage('kitchen', 'sun', push(1.12, 1.28, 960, 560), KITCHEN({you: {expr: 'sleepy'}}), [
    {at: 0.6, who: Y, pose: 'relaxed', expr: 'smile'},
    {at: 'l0+0.6', who: B, look: [0.4, -1]},
  ]), {
    cue: 'morning',
    transition: 'fade',
    action: 'A sunlit kitchen. You yawn over a mug. Mira draws at the table. Biscuit sits very politely beside the toast.',
    lines: [N('So for eight more minutes, it is just a summer morning.')],
  }),
  sh('mira-draws', stage('kitchen', 'sun', push(2.4, 2.7, 1130, 700), KITCHEN({mira: {expr: 'focused'}}).slice(1), [
    {at: 'l0+1.0', who: MI, pose: 'cheer', hold: null, expr: 'laugh', facing: 'front'},
  ], {drawing: true}), {
    beats: ['heart'],
    action: 'Close on Mira finishing a crayon sun. She holds it up, proud.',
    lines: [N('Your little sister Mira is drawing the Sun. Again.')],
  }),
  sh('dog-eyes', stage('kitchen', 'sun', push(3.0, 3.3, 990, 800), KITCHEN(), [{at: 0.4, who: B, look: [0.6, -1]}], {toast: 'plate'}), {
    beats: ['laugh'],
    dev: 'Biscuit plots against the toast',
    action: 'Close on Biscuit. His eyes slide slowly toward the toast on the edge of the table.',
    lines: [N('Biscuit is planning a crime.')],
  }),
  sh('world-beach', stage('montage', 'beach', push(1.0, 1.18, 1000, 620), [c('extra:56', 1000, 712, {pose: 'reach', facing: 'right', expr: 'laugh', outfit: 'home'}, 1.0)], [{at: 0, who: 'extra:56', loop: 'bounce', dur: 4}]), {
    transition: 'whip',
    action: 'A bright beach. A surfer stands up on a perfect wave.',
    lines: [N('Somewhere, someone catches the best wave of their life.')],
  }),
  sh('world-field', stage('montage', 'field', push(1.1, 1.25, 900, 640), [c('extra:62', 900, 930, {pose: 'hold', facing: 'right', outfit: 'home'}, 1.3)], [{at: 0.5, who: 'extra:62', pose: 'lookUp', expr: 'focused', look: [0.5, -1]}]), {
    transition: 'whip',
    action: 'Golden rice terraces. A farmer straightens up and squints at the sky.',
    lines: [N('A farmer checks the sky for rain.')],
  }),
  sh('world-bus', stage('montage', 'bus', push(1.0, 1.1, 900, 600), [c('extra:17', -150, 960, {facing: 'right', outfit: 'home', expr: 'determined'}, 1.4)], [{at: 0, who: 'extra:17', to: 1000, gait: 'run', dur: 1.4}, {at: 1.5, who: 'extra:17', expr: 'sad', pose: 'reach'}]), {
    transition: 'whip',
    beats: ['laugh'],
    action: 'A kid sprints for a school bus. The doors close on his nose. The bus leaves.',
    lines: [N('A kid misses the bus by one second.')],
  }),
  sh('dark-arrives', sc('space', {v: 'raceNear'}), {
    cue: 'race',
    dev: 'the dark reaches Earth',
    callout: {text: '00:03', at: 0.2, pos: 'top'},
    action: 'The trailing edge of the light sweeps past the Moon and onto the day side of Earth.',
    lines: [N('And right behind the light comes the dark.')],
  }),
  sh('toast-steal', stage('kitchen', 'sun', push(1.7, 2.1, 900, 700), KITCHEN(), [
    {at: 0.3, who: B, pose: 'beg'},
    {at: 'l0+1.2', who: B, to: 1060, gait: 'run', dur: 0.5},
    {at: 'l0+1.25', who: B, hold: 'toast'},
    {at: 'l0+0.9', who: Y, expr: 'surprised', pose: 'point', hold: null},
  ], {toast: 'steal'}), {
    beats: ['laugh'],
    action: 'Biscuit rises on his back legs and snatches the toast. You point. Three. Two.',
    lines: [N('Three. Two.')],
  }),
  sh('lights-out', stage('kitchen', 'dark', hold(1.7, 900, 700), KITCHEN({you: {pose: 'point', hold: undefined, expr: 'surprised'}, mira: {expr: 'surprised', hold: undefined}, dog: {pose: 'stand', x: 1060, hold: 'toast'}}), [], {snap: true, toast: 'mouth'}), {
    min: 2.4,
    sfx: 'powercut',
    cue: 'silence',
    dev: 'the light goes out',
    action: 'Mid-snatch, the sunlight snaps off. Everyone freezes in the blue dark. Biscuit still has the toast.',
    lines: [N('One.', 0.9)],
  }),
  sh('stars-at-breakfast', stage('kitchen', 'dark', push(1.3, 1.45, 560, 590), [c(MI, 520, 930, {facing: 'back'}), c(Y, 760, 930, {facing: 'back'})], [{at: 0.2, who: MI, to: 560, dur: 0.8, facing: 'back'}], {windowStars: true}), {
    letterbox: true,
    beats: ['wow'],
    action: 'Through the kitchen window: stars over a city at breakfast time. Streetlights flicker on.',
    lines: [M('Why is it night?', 0.6)],
  }),
  sh('title', sc('title'), {min: 3.2, cue: 'title', letterbox: true, action: 'Title: THE SUN WENT OUT.'}),

  // ══ HOUR ONE ═══════════════════════════════════════════════════════════════════════════════
  sh('street-phones', stage('street', 'night', move([1.0, 960, 250], [1.12, 960, 600]), [
    c('extra:3', 380, 960, {pose: 'pointUp', facing: 'right', expr: 'scared'}),
    c('extra:7', 560, 960, {pose: 'hold', hold: 'phoneLit', expr: 'worried'}),
    c(Y, 860, 960, {pose: 'lookUp', expr: 'worried'}),
    c(MI, 960, 960, {expr: 'worried'}),
    c('extra:12', 1180, 960, {pose: 'handsOnHead', expr: 'scared'}),
    c('extra:5', 1360, 960, {pose: 'hold', hold: 'phoneLit', facing: 'left'}),
    c('extra:9', 1560, 960, {pose: 'coverMouth', expr: 'surprised'}),
  ], [
    {at: 0.4, who: 'extra:12', to: 1760, gait: 'run', dur: 1.6},
    {at: 'l0', who: 'extra:3', loop: 'bounce', dur: 1.2},
  ]), {
    chapter: 'Hour one',
    cue: 'unease',
    transition: 'whip',
    dev: 'the city pours into the street',
    action: 'Outside, the street is full. Pyjamas and work clothes, every phone held up to a starry sky.',
    lines: [N('Every phone on the street is pointing up.')],
  }),
  sh('eclipse-shout', stage('street', 'night', push(2.1, 2.4, 400, 760), [
    c('extra:3', 380, 960, {pose: 'pointUp', facing: 'right', expr: 'surprised'}),
    c('extra:7', 560, 960, {pose: 'hold', hold: 'phoneLit', expr: 'worried'}),
  ], [{at: 'l0', who: 'extra:3', loop: 'talk', dur: 1.6}]), {
    action: 'A man shouts at the sky, pointing.',
    lines: [N('Someone shouts that it is an eclipse.')],
  }),
  sh('no-bars', sc('closeup', {v: 'phone'}), {
    dev: 'the networks jam',
    action: 'A phone screen: NO SERVICE. The bars drop to zero.',
    lines: [N('Every network jams in the same minute.')],
  }),
  sh('dark-moon', sc('sky', {v: 'moon'}), {
    action: 'Low over the rooftops, a thin crescent Moon is a black sliver cutting a hole in the stars.',
    lines: [N('But eclipses last minutes. And the Moon has gone dark too.')],
  }),
  sh('borrowed', sc('sky', {v: 'moonClose'}), {
    science: {text: "The Moon makes no light of its own; moonlight is reflected sunlight.", source: "NASA Science, ‘Moon’ (science.nasa.gov/moon)"},
    callout: {text: 'BORROWED', at: 'l0+1.0'},
    action: 'Closer: the dead Moon, a faint grey ghost against the stars.',
    lines: [N('Its light was only ever borrowed from the Sun.')],
  }),
  sh('knock', stage('apartment', 'door', push(1.3, 1.45, 1250, 620), [c(Y, 1000, 930, {facing: 'right', expr: 'worried'})], [{at: 0.5, who: Y, look: [1, 0], expr: 'surprised'}], {doorOpen: false, knock: true}), {
    sfx: 'stamp',
    action: 'Back inside. Hard knocks rattle the door.',
    lines: [N('Then someone hammers on your door.')],
  }),
  sh('ito-door', stage('apartment', 'door', push(1.5, 1.7, 1250, 600), [
    c(Y, 1000, 930, {facing: 'right', expr: 'surprised'}),
    c(IT, 1590, 930, {facing: 'left', hold: 'torch', pose: 'torch', outfit: 'home', expr: 'determined'}),
  ], [{at: 'l0+0.7', who: IT, pose: 'pointUp', hold: null}], {doorOpen: true}), {
    dev: 'Mr. Ito arrives',
    action: 'The door opens on Mr. Ito from upstairs: cardigan, slippers, torch, a telescope case on his back.',
    lines: [I('You. Come to the roof.')],
  }),
  sh('and-the-dog', stage('apartment', 'door', push(2.4, 2.7, 1500, 560), [c(IT, 1590, 930, {facing: 'left', outfit: 'home', pose: 'point', expr: 'smile'}), c(B, 1300, 930, {hold: 'toast'})], [
    {at: 'l0+0.4', who: B, pose: 'beg', wag: 1},
  ], {doorOpen: true}), {
    beats: ['laugh'],
    action: 'Ito points past you at Biscuit, who still has the toast.',
    lines: [I('Bring the girl. And the dog.')],
  }),
  sh('roof-setup', stage('roof', 'night', move([1.0, 960, 560], [1.15, 1060, 600]), ROOF0, [
    {at: 0.4, who: IT, pose: 'reach', expr: 'smile'},
    {at: 'l0+1.6', who: IT, loop: 'bounce', dur: 0.9, expr: 'laugh'},
  ], {telescope: 'setup'}), {
    cue: 'curious',
    beats: ['laugh'],
    action: 'The roof. Mr. Ito sets up a brass telescope with the joy of a child at Christmas.',
    lines: [N('Mr. Ito taught astronomy for forty years. He has never been this excited.')],
  }),
  sh('venus', sc('sky', {v: 'venus'}), {
    action: 'Low in the east, one bright point still shining: Venus.',
    lines: [I('Look. Venus is still shining.')],
  }),
  sh('but-gone', stage('roof', 'night', push(2.4, 2.8, 880, 600), [c(MI, 880, 900, {facing: 'right', expr: 'surprised', pose: 'point'})], [{at: 'l0', who: MI, loop: 'bounce', dur: 0.6}]), {
    action: 'Mira, outraged at the universe.',
    lines: [M('But the Sun is gone!')],
  }),
  sh('mirror', sc('diagram', {v: 'lightDelay', step: 0}), {
    action: 'Diagram: Venus as a mirror, sunlight bouncing off it toward Earth.',
    lines: [I('Venus is a mirror.')],
  }),
  sh('minutes-ago', sc('diagram', {v: 'lightDelay', step: 1}), {
    action: 'The light path traced: Sun to Venus, Venus to Earth. Old light still in flight.',
    lines: [I('The light it shows us left the Sun minutes ago.')],
  }),
  sh('venus-out', sc('sky', {v: 'venusOut'}), {
    science: {text: "Venus near greatest elongation: sunlight needs ~361 s to reach it and ~345 s to come back to us, versus 499 s Sun→Earth, so it fades ~3.5 minutes after the Sun.", source: "Calculation from 1 AU = 149.6 million km, c = 299,792 km/s, Venus orbit 0.72 AU (NASA JPL planetary fact sheets)"},
    cue: 'reveal',
    sfx: 'decloak',
    beats: ['wow'],
    dev: 'Venus goes dark late',
    action: 'Venus flickers and goes out.',
    lines: [N('Three minutes later, Venus goes out.', 0.5)],
  }),
  sh('ito-thinks', stage('roof', 'night', push(2.6, 3.0, 1130, 560), [c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'left', expr: 'focused'})]), {
    action: 'Ito, lit by the torch, works it out.',
    lines: [I('If something blocked the Sun close to us, everything would go dark at once.')],
  }),
  sh('at-the-sun', stage('roof', 'night', push(3.2, 3.6, 1150, 540), [c(IT, 1150, 900, {pose: 'pointUp', outfit: 'home', facing: 'front', expr: 'surprised'})]), {
    cue: 'sting',
    twist: 1,
    beats: ['loop'],
    callout: {text: 'AT THE SUN', at: 'l0+0.4'},
    dev: 'it happened at the Sun, not near Earth',
    action: 'Ito turns to you, eyes huge behind his glasses.',
    lines: [I('This happened at the Sun.', 0.3)],
  }),
  sh('jupiter-predict', sc('diagram', {v: 'jupiter'}), {
    science: {text: "Jupiter is 5.2 AU from the Sun; light needs ~43 minutes to reach it and ~37 more to reach us when it is 4.5 AU away: about 72 minutes after the Sun.", source: "NASA Jupiter fact sheet (nssdc.gsfc.nasa.gov)"},
    cue: 'curious',
    callout: {text: '72 MIN', at: 'l0+1.6'},
    action: 'Diagram: Jupiter, far out. A long light path. A clock.',
    lines: [I('Jupiter is much further out. It should go dark in seventy-two minutes.')],
  }),
  sh('the-wait', stage('roof', 'night', move([1.2, 900, 620], [1.3, 960, 640]), [
    c(Y, 760, 900, {pose: 'sit', facing: 'right'}),
    c(MI, 900, 900, {pose: 'sitHug', facing: 'left', expr: 'sleepy'}),
    c(B, 1000, 900, {pose: 'lie'}),
    c(IT, 1150, 900, {pose: 'think', outfit: 'home', facing: 'left'}),
  ], [{at: 0.8, who: Y, pose: 'hold', watchGlow: 1}], {timelapse: true}), {
    min: 3.0,
    beats: ['heart'],
    action: 'Time-lapse: stars wheel overhead. Mira falls asleep against Biscuit (the toast is finally gone). You keep checking your watch.',
    lines: [N('So you sit down, and you wait.')],
  }),
  sh('jupiter-out', sc('sky', {v: 'jupiterOut'}), {
    cue: 'reveal',
    sfx: 'decloak',
    dev: 'Jupiter goes dark on schedule',
    action: 'Jupiter, centred in the telescope crosshairs, winks out.',
    lines: [N('Seventy-two minutes later, to the second, it does.', 0.4)],
  }),
  sh('ito-dance', stage('roof', 'night', push(1.7, 1.9, 1080, 640), [
    c(IT, 1150, 900, {outfit: 'home', facing: 'front', expr: 'laugh'}),
    c(MI, 900, 900, {pose: 'sitHug', facing: 'left', expr: 'sleepy'}),
    c(B, 1000, 900, {pose: 'lie'}),
  ], [
    {at: 0.1, who: IT, pose: 'cheer', loop: 'bounce', dur: 1.4},
    {at: 1.0, who: B, pose: 'stand', wag: 1},
  ]), {
    min: 2.2,
    beats: ['laugh'],
    action: 'Ito does a small, silent victory dance. Biscuit joins in. Mira sleeps through it.',
  }),
  sh('watch-cooling', sc('closeup', {v: 'watch', temp: [21.4, 21.1], time: '08:16'}), {
    cue: 'unease',
    dev: 'the temperature starts falling',
    action: 'Close on your watch: the thermometer ticks down a tenth of a degree.',
    lines: [N('Then you look at your watch.')],
  }),
  sh('losing-heat', sc('globe', {v: 'radiate'}), {
    action: 'Earth from space, wrapped in night, shedding faint red heat into the black.',
    lines: [N('Without the Sun, Earth is losing heat to space.')],
  }),
  sh('every-hour', sc('closeup', {v: 'thermo'}), {
    action: 'A thermometer on the balcony rail. Its red line sinks.',
    lines: [N('A little more every hour.')],
  }),

  // ══ DAY 1 ══════════════════════════════════════════════════════════════════════════════════
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
    lines: [N('Day one. The whole city has the same idea.')],
  }),
  sh('grab', stage('market', 'grab', push(1.1, 1.25, 960, 600), [
    c(Y, 700, 940, {pose: 'push', facing: 'right', outfit: 'cold'}),
    c('extra:14', 1420, 940, {pose: 'reach', facing: 'left'}),
    c('extra:15', 1700, 940, {pose: 'carry', hold: 'rice', facing: 'left'}),
  ], [
    {at: 0, who: Y, to: 1000, dur: 1.4},
    {at: 'l0+0.4', who: Y, pose: 'reach', expr: 'focused'},
    {at: 'l0+1.2', who: Y, pose: 'hold', hold: 'candles'},
    {at: 'l0+2.2', who: Y, hold: 'rice'},
  ], {trolley: true}), {
    action: 'Half-empty shelves. You steer a trolley and sweep things in as you name them.',
    lines: [N('Candles. Rice. Batteries. Water.')],
  }),
  sh('treats', stage('market', 'grab', push(1.9, 2.2, 1100, 720), [
    c(Y, 1000, 940, {pose: 'hold', facing: 'right', outfit: 'cold', expr: 'surprised'}),
    c(MI, 1400, 940, {pose: 'carry', hold: 'treats', facing: 'left', outfit: 'cold', expr: 'smile'}),
    c(B, 1140, 940, {}),
  ], [
    {at: 0, who: MI, to: 1290, dur: 1},
    {at: 'l0+0.5', who: B, pose: 'beg', wag: 1},
    {at: 'l0+0.9', who: MI, expr: 'laugh'},
  ]), {
    beats: ['laugh'],
    action: 'Mira marches back with an armful of dog treats. Biscuit loses his mind.',
    lines: [N('Mira has her own list.')],
  }),
  sh('last-heater', stage('market', 'heater', push(1.6, 1.9, 1000, 700), [
    c('extra:24', 860, 940, {pose: 'push', facing: 'right', expr: 'angry'}),
    c('extra:26', 1140, 940, {pose: 'push', facing: 'left', expr: 'angry'}),
  ], [
    {at: 0.3, who: 'extra:24', loop: 'shake', dur: 2},
    {at: 0.3, who: 'extra:26', loop: 'shake', dur: 2},
  ], {heaterBox: true}), {
    action: 'Two grown men in a tug-of-war over the last electric heater.',
    lines: [N('The last heater in the shop starts a fight.')],
  }),
  sh('seal-room', stage('apartment', 'seal', push(1.15, 1.35, 900, 560), [
    c(Y, 780, 930, {pose: 'tape', hold: 'tape', facing: 'back', outfit: 'cold'}),
    c(MI, 1080, 930, {pose: 'holdBoth', holdL: 'tape', outfit: 'cold'}),
    c(B, 1220, 930, {pose: 'lie'}),
  ], [{at: 0.4, who: Y, loop: 'scratch', dur: 1.6}], {blankets: 'going-up'}), {
    dev: 'you build a warm room',
    action: 'Home. You tape blankets over the windows of one room. Mira hands up the tape.',
    lines: [N('Back home, you pick one room and seal it.')],
  }),
  sh('ito-moves-in', stage('apartment', 'seal', push(1.6, 1.8, 1250, 600), [
    c(IT, 1600, 930, {pose: 'carry', holdL: 'blanket', outfit: 'cold', facing: 'left', expr: 'smile'}),
    c(B, 1220, 930, {pose: 'lie'}),
  ], [{at: 0, who: IT, to: 1350, dur: 1.4}, {at: 'l0+0.8', who: B, pose: 'stand', wag: 1}], {blankets: 'up'}), {
    beats: ['heart'],
    action: 'Ito shuffles in with his duvet, a kettle and a framed photo of his late wife.',
    lines: [N('Mr. Ito moves in with you. He lives alone.')],
  }),
  sh('body-heat', sc('diagram', {v: 'heat'}), {
    callout: {text: '100 W', at: 'l0+1.2'},
    action: 'Thermal-style diagram: each of you glows like a light bulb. Biscuit is a smaller bulb.',
    lines: [N('Every person gives off about a hundred watts of heat.')],
  }),
  sh('radiators', stage('apartment', 'warm', push(1.6, 1.9, 1000, 640), [
    c(Y, 860, 930, {pose: 'sitChair', outfit: 'cold', facing: 'right', expr: 'smile'}),
    c(MI, 1000, 930, {pose: 'sitHug', outfit: 'cold', expr: 'laugh'}),
    c(IT, 1160, 930, {pose: 'sitChair', outfit: 'cold', facing: 'left', expr: 'smile'}),
    c(B, 1010, 930, {pose: 'lie'}),
  ], [{at: 'l0+0.5', who: IT, loop: 'nod', dur: 1}]), {
    beats: ['laugh'],
    action: 'All four squeezed together under blankets, glowing faintly orange.',
    lines: [N('Congratulations. You are all radiators now.')],
  }),
  sh('bathtub', stage('bathroom', 'fill', push(1.5, 1.8, 900, 640), [c(Y, 700, 930, {pose: 'pour', facing: 'right', outfit: 'cold', expr: 'focused'})]), {
    dev: 'you store water',
    action: 'You turn the bath tap on full. Water thunders in.',
    lines: [N('Then you fill the bathtub.')],
  }),
  sh('pipes', sc('closeup', {v: 'pipe'}), {
    callout: {text: '150 L', at: 'l0+0.6'},
    action: 'Close on a water pipe in the wall, frost creeping along it.',
    lines: [N('When the pipes freeze, this is all the water you will have.')],
  }),
  sh('freezer', stage('apartment', 'balcony', push(1.3, 1.5, 1100, 620), [c(Y, 900, 930, {pose: 'carry', facing: 'right', outfit: 'cold', holdL: 'bottle'})], [
    {at: 0.1, who: Y, to: 1250, dur: 1.4},
    {at: 'l0+1.4', who: Y, pose: 'stand', holdL: null, expr: 'smile'},
  ]), {
    beats: ['laugh'],
    action: 'You carry the food from the dead freezer out onto the frosted balcony.',
    lines: [N('You will not need the freezer. The whole planet is becoming one.')],
  }),

  // ══ DAY 2 · the tide ═══════════════════════════════════════════════════════════════════════
  sh('radio-tide', sc('closeup', {v: 'radio'}), {
    chapter: 'Day 2',
    hud: {day: 2, temp: 1},
    cue: 'mystery',
    transition: 'fade',
    dev: 'the tide is normal',
    action: 'A battery radio on the windowsill, its dial glowing.',
    lines: [R('Harbour officials say this morning’s high tide was completely normal.')],
  }),
  sh('ito-tide', stage('apartment', 'warm', push(1.4, 1.7, 1050, 600), [
    c(Y, 760, 930, {pose: 'sitChair', outfit: 'cold', facing: 'right'}),
    c(MI, 900, 930, {pose: 'sitHug', outfit: 'cold', facing: 'right'}),
    c(IT, 1300, 930, {pose: 'hold', hold: 'radio', outfit: 'cold', facing: 'left', expr: 'surprised'}),
  ], [
    {at: 0.1, who: IT, to: 1120, dur: 0.8},
    {at: 'l0', who: IT, loop: 'bounce', dur: 1, expr: 'laugh'},
  ]), {
    action: 'Ito nearly jumps out of his slippers.',
    lines: [I('Normal! The tide was normal!')],
  }),
  sh('so', stage('apartment', 'warm', push(2.6, 3.0, 900, 640), [c(MI, 900, 930, {pose: 'shrug', outfit: 'cold', facing: 'front', expr: 'worried'})]), {
    beats: ['laugh'],
    action: 'Mira, deadpan.',
    lines: [M('So?')],
  }),
  sh('moon-pulls', sc('diagram', {v: 'tide', step: 0}), {
    action: 'Diagram: the Moon tugs a bulge of ocean toward it.',
    lines: [I('The Moon pulls the sea. So does the Sun.')],
  }),
  sh('a-third', sc('diagram', {v: 'tide', step: 1}), {
    science: {text: "The Sun’s tide-raising force is about 46% of the Moon’s; at spring tide the two add up.", source: "NOAA Ocean Service, ‘Tides and Water Levels’ tutorial"},
    callout: {text: '−33%', at: 'l0+1.6'},
    action: 'The Sun’s bulge is removed: the tide shrinks by a third.',
    lines: [I('Without the Sun, this week’s big tides would be a third smaller.')],
  }),
  sh('key-swing', stage('apartment', 'warm', push(2.2, 2.6, 1120, 560), [c(IT, 1120, 930, {pose: 'hold', hold: 'keyString', outfit: 'cold', facing: 'front', expr: 'focused'})], [{at: 0, who: IT, look: [0, 0.6]}]), {
    action: 'Ito takes off his door key and swings it round on its string.',
    lines: [I('Watch. The string keeps the key going round.')],
  }),
  sh('cut-string', sc('diagram', {v: 'orbit', step: 0}), {
    action: 'Diagram: the key on its circle. The string snips. The key flies off in a straight line.',
    lines: [I('Cut the string, and it flies away.')],
  }),
  sh('still-round', sc('diagram', {v: 'orbit', step: 1}), {
    dev: 'Earth is still in orbit',
    action: 'Earth on an invisible string around a black disc. It keeps curving round.',
    lines: [I('We have not flown away. We are still going round.')],
  }),
  sh('still-there', stage('apartment', 'warm', push(2.4, 3.0, 1120, 540), [c(IT, 1120, 930, {pose: 'pointUp', outfit: 'cold', expr: 'awe'})]), {
    cue: 'reveal',
    twist: 2,
    beats: ['loop'],
    letterbox: true,
    callout: {text: 'STILL THERE', at: 'l0+0.5'},
    sfx: 'riser',
    action: 'Ito, quietly.',
    lines: [I('The Sun is still there.', 0.4)],
  }),
  sh('in-front', stage('apartment', 'warm', push(2.8, 3.3, 900, 620), [c(MI, 900, 930, {pose: 'sitHug', outfit: 'cold', facing: 'front', expr: 'scared'}), c(Y, 760, 930, {pose: 'sitChair', outfit: 'cold', facing: 'right', expr: 'scared'})]), {
    action: 'Mira and you, frozen.',
    lines: [I('Something is in front of it.', 0.5)],
  }),
  sh('glimpse', sc('space', {v: 'shellGlimpse'}), {
    cue: 'shellSting',
    min: 2.4,
    sfx: 'impact',
    beats: ['wow'],
    action: 'A glimpse: the edge of something vast and dark, a curved wall of plates, catching the faintest red light.',
  }),
  sh('ito-radios', stage('apartment', 'warm', push(1.5, 1.7, 1100, 620), [c(IT, 1100, 930, {pose: 'holdBoth', hold: 'radio', outfit: 'cold', facing: 'front', expr: 'determined'})], [{at: 'l0', who: IT, loop: 'talk', dur: 2.4}]), {
    cue: 'work',
    dev: 'the world learns the Sun is covered',
    action: 'Ito on a ham radio, calling observatories around the world.',
    lines: [N('Ito radios every observatory he knows. By night, the whole world has heard.')],
  }),

  // ══ DAY 3 · the last letter ════════════════════════════════════════════════════════════════
  sh('day3-roof', stage('roof', 'cold', move([1.0, 960, 520], [1.1, 960, 480]), [
    c(Y, 760, 900, {...COLD, facing: 'right'}),
    c(MI, 880, 900, {...COLD, facing: 'right'}),
    c(IT, 1160, 900, {...COLD, facing: 'left', pose: 'cane', hold: 'cane'}),
    c(B, 620, 900, {pose: 'sit'}),
  ]), {
    chapter: 'Day 3',
    hud: {day: 3, temp: -4},
    cue: 'wonder',
    transition: 'fade',
    action: 'Day 3. Back on the roof in coats. Breath smoking.',
    lines: [N('Day three. Ito says one last thing is still on its way from the Sun.')],
  }),
  sh('look', stage('roof', 'cold', push(2.4, 2.8, 1160, 560), [c(IT, 1160, 900, {...COLD, facing: 'left', pose: 'pointUp', expr: 'awe'})]), {
    action: 'Ito points at the northern sky.',
    lines: [I('Look! Up there!')],
  }),
  sh('aurora', sc('sky', {v: 'aurora'}), {
    science: {text: "Coronal mass ejections take roughly 1 to 4 days to reach Earth, so particles already on their way would still arrive after the light was gone.", source: "NOAA Space Weather Prediction Center, ‘Coronal Mass Ejections’"},
    letterbox: true,
    beats: ['wow'],
    dev: 'the final solar storm arrives',
    action: 'The whole sky ignites: green and violet curtains over the frozen city.',
    lines: [N('A storm of particles that left the Sun four days ago. Slower than light.')],
  }),
  sh('last-letter', sc('sky', {v: 'auroraWide'}), {
    callout: {text: 'LAST LETTER', at: 'l0+0.6'},
    action: 'Wide: tiny figures on the roof under the vast, rippling aurora.',
    lines: [N('The last letter the Sun will ever send.')],
  }),
  sh('goodbye', stage('roof', 'aurora', push(2.6, 3.1, 880, 580), [c(MI, 880, 900, {...COLD, facing: 'front', expr: 'awe', pose: 'lookUp'})], [{at: 'l0+0.4', who: MI, expr: 'sad'}]), {
    beats: ['heart'],
    action: 'Mira, face lit green, watching.',
    lines: [M('It is saying goodbye.', 0.6)],
  }),
  sh('frost-sun', sc('closeup', {v: 'frostSun'}), {
    min: 3.2,
    beats: ['heart'],
    action: 'On the frosted window, a small finger draws a sun. Through it, the aurora.',
  }),

  // ══ DAY 5 · the sea ════════════════════════════════════════════════════════════════════════
  sh('day5-harbor', stage('harbor', 'freeze', move([1.0, 900, 540], [1.12, 1000, 560]), [
    c(Y, 700, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right'}),
    c(MI, 820, 940, {...COLD, facing: 'right'}),
  ]), {
    chapter: 'Day 5',
    hud: {day: 5, temp: -11},
    cue: 'wonder',
    transition: 'fade',
    dev: 'the sea starts to freeze',
    action: 'Day 5. The harbour. Torchlight on boats locked in new ice.',
    lines: [N('Day five. The sea starts to freeze.')],
  }),
  sh('ice-blanket', sc('diagram', {v: 'ocean', step: 0}), {
    science: {text: "Ice floats and insulates the water below it, so oceans freeze from the top and stay liquid underneath for a very long time.", source: "National Snow and Ice Data Center, ‘All About Sea Ice’"},
    callout: {text: 'A LID', at: 'l0+1.2'},
    action: 'Cut-away of the ocean: a skin of ice forms on top.',
    lines: [N('But only on top. The ice is a lid.')],
  }),
  sh('liquid-below', sc('diagram', {v: 'ocean', step: 1}), {
    beats: ['wow'],
    action: 'The camera sinks below the ice: kilometres of dark liquid water.',
    lines: [N('Underneath, the ocean stays liquid for years.')],
  }),
  sh('fish', stage('harbor', 'freeze', push(2.3, 2.7, 760, 760), [c(MI, 820, 940, {...COLD, facing: 'front', pose: 'crouch', expr: 'smile'})], [{at: 'l0+0.4', who: MI, pose: 'point', expr: 'laugh'}], {fish: true}), {
    beats: ['heart', 'laugh'],
    action: 'Mira kneels on the ice. Under it, a fish glides past her torch beam.',
    lines: [M('The fish are fine!')],
  }),

  // ══ DAY 7 · the grid ═══════════════════════════════════════════════════════════════════════
  sh('day7-globe', sc('globe', {v: 'lights', day: 7}), {
    science: {text: "Estimates for a sunless Earth: around −18 °C average after a week, around −73 °C after a year.", source: "Live Science, ‘What would happen if the sun disappeared?’"},
    chapter: 'Day 7',
    hud: {day: 7, temp: -18},
    cue: 'tension',
    transition: 'fade',
    action: 'Earth from space, night everywhere, city lights glowing. Ice creeping out from the poles.',
    lines: [N('Day seven. Minus eighteen. Every heater on Earth is switched on at once.')],
  }),
  sh('grid-fail', sc('city', {v: 'gridFail'}), {
    dev: 'the grid collapses',
    sfx: 'powercut',
    action: 'Your city from above. Districts go dark one after another, rolling toward your street.',
    lines: [N('The grid cannot take it.')],
  }),
  sh('candles', stage('apartment', 'candle', push(1.4, 1.6, 980, 620), [
    c(Y, 860, 930, {...COLD, pose: 'kneel', hold: 'match'}),
    c(MI, 1080, 930, {...COLD, pose: 'sitHug', expr: 'cold'}),
    c(IT, 1320, 930, {...COLD, pose: 'sitChair', facing: 'left'}),
  ], [{at: 'l0+1', who: Y, hold: null, expr: 'focused'}], {candles: 'lighting'}), {
    action: 'Your building goes dark. You strike a match and light the candles.',
    lines: [N('Your building goes dark at midnight.')],
  }),
  sh('smoke', stage('stairs', 'smoke', push(1.4, 1.8, 960, 640), [c(Y, 900, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'worried'})], [{at: 'l0', who: Y, look: [1, 0.5]}]), {
    dev: 'a fire downstairs',
    sfx: 'crash',
    action: 'Torch beam in the stairwell. Grey smoke curls out from under a neighbour’s door.',
    lines: [N('An hour later, you smell smoke.')],
  }),
  sh('furniture', stage('stairs', 'smoke', push(1.9, 2.3, 1240, 700), [c(Y, 900, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'scared'})], [{at: 0.3, who: Y, to: 1000, dur: 1}]), {
    action: 'The torch finds door 3B: orange firelight flickering underneath, smoke pouring out.',
    lines: [N('Next door, someone is burning their furniture. Indoors.')],
  }),
  sh('invisible', stage('stairs', 'smoke', push(2.6, 3.0, 900, 600), [c(Y, 900, 940, {...COLD, pose: 'coverMouth', facing: 'front', expr: 'scared'})]), {
    science: {text: "Burning fuel indoors produces carbon monoxide, which is colourless and odourless; it is a leading cause of winter poisonings.", source: "US CDC, ‘Carbon Monoxide Poisoning’"},
    callout: {text: 'INVISIBLE', at: 'l0+1.4'},
    action: 'You cover your mouth.',
    lines: [N('The smoke you can see. The carbon monoxide, you cannot.')],
  }),
  sh('evacuate', stage('stairs', 'evac', move([1.2, 700, 600], [1.2, 1300, 640]), [
    c(Y, 400, 940, {...COLD, hold: 'torch', pose: 'torch', facing: 'right'}),
    c(MI, 250, 940, {...COLD, facing: 'right', expr: 'scared'}),
    c(IT, 120, 940, {...COLD, facing: 'right', hold: 'cane'}),
    c(B, 520, 940, {}),
  ], [
    {at: 0, who: Y, to: 1500, gait: 'run', dur: 2.6},
    {at: 0, who: MI, to: 1350, gait: 'run', dur: 2.6},
    {at: 0, who: IT, to: 1150, dur: 2.8},
    {at: 0, who: B, to: 1700, gait: 'run', dur: 2.2},
  ]), {
    cue: 'chase',
    action: 'Running down the stairs: you with the torch, Mira at your heels, Ito with his cane, Biscuit ahead.',
    lines: [N('You get everyone out.')],
  }),
  sh('biscuit-bolts', stage('snowstreet', 'door', push(1.3, 1.6, 900, 640), [
    c(Y, 760, 960, {...COLD, hoodUp: true, hold: 'torch', facing: 'right', expr: 'scared'}),
    c(B, 980, 960, {}),
  ], [
    {at: 0.3, who: B, to: 2200, gait: 'run', dur: 1.4},
    {at: 'l0+0.2', who: Y, pose: 'reach', hold: null, expr: 'scared'},
  ], {wind: 1}), {
    dev: 'Biscuit runs away',
    sfx: 'whoosh',
    action: 'The street door bangs open into a wall of wind and snow. Biscuit bolts into the dark.',
    lines: [N('At the door, Biscuit panics.')],
  }),
  sh('mira-shouts', stage('snowstreet', 'door', push(2.4, 2.9, 900, 560), [c(MI, 900, 960, {...COLD, facing: 'right', expr: 'scared', pose: 'reach'})], [{at: 0, who: MI, loop: 'shiver', dur: 3}], {wind: 1}), {
    midroll: true,
    letterbox: true,
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
    action: 'Day 8. You walk the frozen street alone with a torch. Buried cars. Silent snow.',
    lines: [N('You search all night.')],
  }),
  sh('always-night', stage('snowstreet', 'search', push(1.8, 2.2, 800, 640), [c(Y, 800, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'left', expr: 'sad'})], [{at: 'l0+0.5', who: Y, facing: 'right', look: [1, 0]}]), {
    action: 'You turn on the spot, sweeping the torch. Nothing.',
    lines: [N('Then again, it is always night now.')],
  }),
  sh('bark', stage('snowstreet', 'search', push(2.8, 3.2, 800, 580), [c(Y, 800, 960, {...COLD, hoodUp: true, hold: 'torch', facing: 'right', expr: 'surprised'})], [{at: 0.6, who: Y, turn: 0.8}]), {
    min: 2.2,
    sfx: 'chime',
    action: 'Somewhere far off, a single bark. Your head snaps round.',
  }),
  sh('pawprints', sc('closeup', {v: 'pawprints'}), {
    dev: 'paw prints',
    action: 'The torch beam finds a line of fresh paw prints in the snow.',
    lines: [N('Paw prints. Fresh ones.')],
  }),
  sh('vent', stage('snowstreet', 'vent', push(1.0, 1.3, 1200, 600), [c(Y, 500, 960, {...COLD, hoodUp: true, hold: 'torch', pose: 'torch', facing: 'right'})], [{at: 0, who: Y, to: 1050, gait: 'run', dur: 2}]), {
    action: 'The prints lead across the street to a cloud of steam rising from a metro entrance.',
    lines: [N('They lead to the only warm thing on the street.')],
  }),
  sh('found', stage('snowstreet', 'vent', push(2.2, 2.6, 1460, 840), [c(B, 1480, 960, {pose: 'lie', wag: 0.2}), c(Y, 1150, 960, {...COLD, hoodUp: true, facing: 'right'})], [
    {at: 0.5, who: B, pose: 'stand', wag: 1},
    {at: 0.7, who: Y, to: 1360, dur: 0.8},
    {at: 1.5, who: Y, pose: 'kneel', expr: 'relieved'},
    {at: 2.0, who: Y, pose: 'kneelHug', expr: 'laugh'},
  ]), {
    cue: 'warm',
    beats: ['heart'],
    dev: 'Biscuit found',
    action: 'Biscuit is curled against the warm grate, frost on his whiskers. He sees you. His tail explodes.',
    lines: [N('The metro. Warm air, rising from the tunnels.')],
  }),
  sh('ground-heat', sc('diagram', {v: 'ground', step: 0}), {
    science: {text: "A few metres underground the temperature stays close to the yearly average (about 10–16 °C in many places), whatever the weather.", source: "US Department of Energy, ‘Geothermal Heat Pumps’"},
    callout: {text: '+10°C', at: 'l0+1'},
    beats: ['wow'],
    action: 'Cut-away of the ground: frozen surface, then the metro tunnels, then warm rock below.',
    lines: [N('A few metres down, the ground is still around ten degrees.')],
  }),
  sh('last-summer', sc('diagram', {v: 'ground', step: 1}), {
    action: 'The warm layer glows: last summer’s heat, stored in the rock.',
    lines: [N('It is still holding on to last summer.')],
  }),
  sh('he-knew', stage('snowstreet', 'vent', move([1.2, 1100, 600], [1.35, 1350, 640]), [c(B, 1560, 960, {facing: 'left'}), c(Y, 1200, 960, {...COLD, hoodUp: true, facing: 'right'})], [
    {at: 0.3, who: B, loop: 'bounce', dur: 1.2, wag: 1},
    {at: 'l0', who: Y, expr: 'smile'},
  ]), {
    beats: ['heart'],
    action: 'Biscuit trots toward the stairs and looks back at you. Come on.',
    lines: [N('Biscuit did not run away. He found the way down.')],
  }),
  sh('follow-him', stage('metro', 'stairs', move([1.1, 900, 560], [1.15, 1000, 620]), [
    c(Y, 600, 900, {...COLD, hoodUp: true, pose: 'carry', facing: 'right'}),
    c(MI, 520, 745, {...COLD, pose: 'sitHug', facing: 'right'}),
    c(IT, 380, 900, {...COLD, hold: 'cane', facing: 'right'}),
    c(B, 860, 900, {}),
    c('extra:21', 160, 900, {facing: 'right', outfit: 'cold', hold: 'torch'}),
    c('extra:22', 0, 900, {facing: 'right', outfit: 'cold'}),
  ], [
    {at: 0, who: Y, to: 1300, dur: 3.2},
    {at: 0, who: MI, to: [1220, 745], dur: 3.2},
    {at: 0, who: IT, to: 1080, dur: 3.4},
    {at: 0, who: B, to: 1560, dur: 3},
    {at: 0, who: 'extra:21', to: 860, dur: 3.4},
    {at: 0, who: 'extra:22', to: 700, dur: 3.4},
  ], {piggyback: 'you'}), {
    cue: 'warm',
    dev: 'the city moves underground',
    action: 'Down the metro stairs: you carrying Mira on your back, Ito, and behind them a line of torches.',
    lines: [N('By morning, half the city has followed him underground.')],
  }),

  // ══ DAY 30 · the tunnel city ═══════════════════════════════════════════════════════════════
  sh('day30-city', stage('metro', 'city', move([1.0, 960, 540], [1.12, 1060, 560]), TUNNEL, [
    {at: 0, who: 'extra:30', to: 800, dur: 3},
    {at: 0.5, who: 'extra:34', to: 1500, dur: 2},
    {at: 'l0', who: MI, loop: 'talk', dur: 2},
  ]), {
    chapter: 'Day 30',
    hud: {day: 30, temp: -35},
    cue: 'tunnel',
    transition: 'fade',
    dev: 'a new city underground',
    action: 'Day 30. The metro is a town: tents on the platforms, string lights, laundry lines.',
    lines: [N('Day thirty. The metro is a city now.')],
  }),
  sh('farm', stage('metro', 'farm', push(1.4, 1.7, 960, 600), [c('extra:35', 900, 900, {outfit: 'cold', pose: 'pour', facing: 'right'})], [{at: 0.4, who: 'extra:35', loop: 'stir', dur: 2}]), {
    action: 'A disused tunnel full of grow lights. Lettuce in a pink-purple glow.',
    beats: ['laugh'],
    lines: [N('Lettuce grows under lamps in the old tunnels. Everyone is already sick of lettuce.')],
  }),
  sh('lamp-sunrise', stage('metro', 'sunrise', move([1.0, 960, 500], [1.1, 960, 460]), [
    c('extra:36', 400, 900, {outfit: 'cold', facing: 'back'}),
    c(MI, 760, 900, {outfit: 'cold', facing: 'back'}),
    c(Y, 880, 900, {outfit: 'cold', facing: 'back'}),
    c('extra:37', 1200, 900, {outfit: 'cold', facing: 'back'}),
    c('extra:38', 1500, 900, {outfit: 'cold', facing: 'back'}),
  ], [], {sunrise: 'l0+0.8'}), {
    cue: 'warm',
    action: 'Seven a.m. The big lamps in the station roof warm up from orange to gold.',
    lines: [N('Every morning at seven, they switch on the big lamps.')],
  }),
  sh('call-it-sunrise', stage('metro', 'sunrise', push(1.8, 2.1, 820, 640), [
    c(MI, 760, 900, {outfit: 'cold', facing: 'front', pose: 'cheer', expr: 'laugh'}),
    c(Y, 880, 900, {outfit: 'cold', facing: 'front', expr: 'smile'}),
  ], [{at: 0.3, who: MI, loop: 'jump', dur: 0.6}], {sunrise: 0}), {
    beats: ['heart'],
    callout: {text: 'SUNRISE', at: 'l0+0.5'},
    action: 'Faces turned up into the gold light. Mira jumps.',
    lines: [N('People call it sunrise.')],
  }),
  sh('school', stage('metro', 'school', push(1.4, 1.7, 960, 600), [
    c(MI, 760, 900, {outfit: 'cold', hold: 'chalk', pose: 'point', facing: 'right', expr: 'smile'}),
    c('extra:33', 1050, 900, {outfit: 'cold', pose: 'sitChair', facing: 'left'}),
    c('extra:36', 1220, 900, {outfit: 'cold', pose: 'sitChair', facing: 'left'}),
    c('extra:49', 1390, 900, {outfit: 'cold', pose: 'sitChair', facing: 'left'}),
  ], [{at: 'l0', who: MI, loop: 'talk', dur: 2.4}]), {
    dev: 'Mira teaches',
    action: 'In a parked train carriage turned classroom, Mira stands at a chalkboard teaching younger kids to draw a sun.',
    lines: [N('Mira teaches the little ones how to draw the Sun.')],
  }),
  sh('forgotten', stage('metro', 'school', push(2.6, 3.0, 1220, 620), [c('extra:36', 1220, 900, {outfit: 'cold', pose: 'holdBoth', facing: 'front', expr: 'sad', hold: 'drawing'})]), {
    beats: ['heart'],
    action: 'A small kid holds up her drawing: a grey sun. She has forgotten what colour it was.',
    lines: [N('Some of them have already forgotten what colour it was.', 0.6)],
  }),
  sh('fan-club', stage('metro', 'city', push(1.9, 2.2, 1000, 760), [
    c(B, 1000, 900, {pose: 'beg', wag: 1}),
    c('extra:55', 820, 900, {pose: 'reach', facing: 'right', expr: 'laugh'}),
    c('extra:68', 1180, 900, {pose: 'reach', facing: 'left', expr: 'smile'}),
    c('extra:85', 1340, 900, {pose: 'hold', hold: 'treats', facing: 'left', expr: 'laugh'}),
  ], [{at: 0.4, who: 'extra:85', to: 1240, dur: 0.6}], {fat: true}), {
    beats: ['laugh'],
    action: 'Biscuit, noticeably rounder, receives snacks from a ring of adoring kids.',
    lines: [N('Biscuit, meanwhile, has a fan club. And a bigger belly.')],
  }),
  sh('air-q', stage('metro', 'tent', push(2.2, 2.6, 960, 640), [
    c(MI, 900, 900, {outfit: 'cold', pose: 'sitHug', facing: 'right', expr: 'worried'}),
    c(Y, 1100, 900, {outfit: 'cold', pose: 'sitChair', facing: 'left'}),
  ], [{at: 'l0+0.8', who: Y, expr: 'smile', pose: 'think'}]), {
    cue: 'tunnel',
    action: 'In the tent at night. Mira, small voice.',
    lines: [M('Are we going to run out of air?')],
  }),
  sh('oxygen', sc('diagram', {v: 'oxygen'}), {
    science: {text: "The atmosphere holds about 1.2 million billion tonnes of oxygen; even with no photosynthesis, breathing and burning would take thousands of years to use a meaningful share.", source: "Keeling & Manning, ‘Studies of Recent Changes in Atmospheric O2 Content’, Treatise on Geochemistry (2014)"},
    callout: {text: 'THOUSANDS OF YEARS', at: 'l0+1.6'},
    action: 'Diagram: Earth wrapped in its blue atmosphere. A gauge marked OXYGEN barely moves.',
    lines: [N('No. Even with no plants making more, the air we have would last thousands of years.')],
  }),
  sh('workshop', stage('metro', 'workshop', push(1.6, 2.0, 1000, 640), [c(IT, 1000, 900, {outfit: 'cold', pose: 'holdBoth', hold: 'thermal', expr: 'focused'})], [{at: 'l0+1.2', who: IT, look: [0.6, -0.6]}]), {
    dev: 'Ito builds a thermal camera',
    action: 'Ito at a workbench, a firefighter’s thermal camera in pieces under a magnifier light.',
    lines: [N('Ito spends the month rebuilding a firefighter’s heat camera.')],
  }),
  sh('lose-heat', stage('metro', 'workshop', push(2.6, 3.0, 1000, 600), [c(IT, 1000, 900, {outfit: 'cold', pose: 'hold', hold: 'thermal', facing: 'front', expr: 'determined'})]), {
    action: 'He looks up at you over his glasses.',
    lines: [I('If something is out there, it has to lose heat. Everything does.')],
  }),

  // ══ DAY 40 · the shell ═════════════════════════════════════════════════════════════════════
  sh('day40-surface', stage('surface', 'noon', move([1.0, 960, 520], [1.15, 960, 500]), [
    c(Y, 700, 940, {...COLD, hoodUp: true, hold: 'torch', facing: 'right'}),
    c(IT, 1080, 940, {...COLD, hold: 'thermal', pose: 'hold', facing: 'right'}),
  ], [{at: 0, who: Y, to: 860, dur: 1.6}]), {
    chapter: 'Day 40',
    hud: {day: 40, temp: -41},
    cue: 'mystery',
    transition: 'fade',
    action: 'Day 40. You and Ito climb out into a dead white city.',
    lines: [N('Day forty. Noon. You climb out with Ito.')],
  }),
  sh('aim', stage('surface', 'noon', push(1.9, 2.3, 1060, 560), [c(IT, 1080, 940, {...COLD, hold: 'thermal', pose: 'reachUp', facing: 'right'})]), {
    action: 'He raises the camera at an empty patch of black sky.',
    lines: [N('He aims at the spot where the Sun should be.')],
  }),
  sh('its-warm', sc('thermal', {v: 'disc'}), {
    science: {text: "Anything that absorbs starlight must give off waste heat as infrared; this is how astronomers search for Dyson spheres.", source: "Freeman Dyson, ‘Search for Artificial Stellar Sources of Infrared Radiation’, Science (1960)"},
    dev: 'something warm where the Sun should be',
    action: 'The camera screen, false colour. Black sky, and in the middle, a faint warm disc.',
    lines: [I("It's warm.", 0.5)],
  }),
  sh('bigger', stage('surface', 'noon', push(2.7, 3.2, 1080, 560), [c(IT, 1080, 940, {...COLD, hold: 'thermal', pose: 'hold', facing: 'front', expr: 'scared'})]), {
    action: 'Ito lowers the camera. His glasses have frosted.',
    lines: [I('And it is bigger than the Sun. Much bigger.')],
  }),
  sh('shell-reveal', sc('space', {v: 'shellReveal'}), {
    letterbox: true,
    beats: ['wow'],
    sfx: 'impact',
    cue: 'shell',
    action: 'Pull back from the Sun’s position: a colossal sphere of dark plates wrapped around the star, faintly glowing at the seams.',
    lines: [N('Not a cloud. Not a moon.')],
  }),
  sh('a-shell', sc('space', {v: 'shellOrbit'}), {
    twist: 3,
    letterbox: true,
    callout: {text: 'A SHELL', at: 'l0+0.2'},
    dev: 'it is a shell around the Sun',
    action: 'The camera glides around the shell. Its plates are each bigger than Earth.',
    lines: [N('A shell. Built around a star.', 0.8)],
  }),
  sh('who-built', stage('metro', 'tent', push(2.0, 2.4, 1000, 620), [c(MI, 900, 900, {outfit: 'cold', facing: 'right', expr: 'scared'}), c(Y, 1100, 900, {outfit: 'cold', facing: 'left', expr: 'worried'})]), {
    cue: 'mystery',
    beats: ['loop'],
    action: 'Back below, Mira looks up at you.',
    lines: [M('Who built it?', 0.8)],
  }),

  // ══ DAY 100 · the dark ═════════════════════════════════════════════════════════════════════
  sh('day100-flicker', stage('metro', 'city', hold(1.05, 960, 540), TUNNEL, [{at: 'l0+1', who: MI, expr: 'scared'}], {flicker: 'l0+0.6'}), {
    chapter: 'Day 100',
    hud: {day: 100, temp: -52},
    cue: 'dread',
    transition: 'fade',
    dev: 'the power plant fails',
    action: 'Day 100. The lamps flicker, buzz, and die. Darkness, then a hundred torches clicking on.',
    lines: [N('Day one hundred. The power plant fails.')],
  }),
  sh('ito-volunteers', stage('metro', 'dark', push(1.6, 1.9, 1100, 620), [
    c(IT, 1100, 900, {...COLD, hold: 'torch', pose: 'torch', facing: 'right', expr: 'determined'}),
    c('extra:50', 1350, 900, {...COLD, hold: 'torch', facing: 'right'}),
  ], [{at: 0.4, who: IT, to: 1420, dur: 3}, {at: 0.4, who: 'extra:50', to: 1700, dur: 3}]), {
    dev: 'Ito joins the engineers',
    action: 'Ito limps off into the dark tunnel with the engineers, torch in hand.',
    lines: [N('Ito goes with the engineers. He is seventy-four.')],
  }),
  sh('cold-night', stage('metro', 'dark', push(2.0, 2.5, 980, 700), [
    c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug'}),
    c(MI, 1040, 900, {...COLD, pose: 'sitHug', expr: 'cold'}),
    c(B, 1160, 900, {pose: 'lie'}),
  ], [{at: 0.2, who: MI, loop: 'shiver', dur: 4}]), {
    action: 'Under every blanket you own, you and Mira shiver. Breath smoking even down here.',
    lines: [N('The tunnels get cold.')],
  }),
  sh('how-it-ends', stage('metro', 'dark', push(3.0, 3.4, 960, 600), [c(Y, 940, 900, {...COLD, hoodUp: true, pose: 'sitHug', facing: 'front', expr: 'sad'})]), {
    midroll: true,
    beats: ['heart', 'loop'],
    action: 'Your face in the last candle light.',
    lines: [N('For the first time, you wonder if this is how it ends.', 0.9)],
  }),

  // ══ DAY 180 · hope ═════════════════════════════════════════════════════════════════════════
  sh('day180-lights', stage('metro', 'sunrise', move([1.0, 960, 500], [1.1, 960, 470]), [
    c('extra:36', 400, 900, {outfit: 'cold', facing: 'front', expr: 'surprised'}),
    c(MI, 760, 900, {outfit: 'cold', facing: 'front', expr: 'surprised'}),
    c(Y, 880, 900, {outfit: 'cold', facing: 'front', expr: 'surprised'}),
    c('extra:37', 1200, 900, {outfit: 'cold', facing: 'front'}),
  ], [
    {at: 'l0+0.5', who: MI, pose: 'cheer', expr: 'laugh'},
    {at: 'l0+0.7', who: 'extra:37', pose: 'armsUp', expr: 'laugh'},
    {at: 'l0+0.8', who: Y, pose: 'cheer', expr: 'laugh'},
    {at: 'l0+0.8', who: 'extra:36', loop: 'jump', dur: 0.6},
  ], {sunrise: 0.3}), {
    chapter: 'Day 180',
    hud: {day: 180, temp: -60},
    cue: 'hope',
    transition: 'fade',
    dev: 'power restored',
    action: 'Day 180. The lamps blaze back on. The whole station roars.',
    lines: [N('Day one eighty. The lights come back.')],
  }),
  sh('ito-returns', stage('metro', 'city', push(1.8, 2.1, 1000, 640), [
    c(IT, 1500, 900, {outfit: 'cold', facing: 'left', expr: 'smile'}),
    c(MI, 800, 900, {outfit: 'cold', facing: 'right', expr: 'laugh'}),
  ], [{at: 0, who: IT, to: 1080, dur: 1.4}, {at: 0.2, who: MI, to: 960, gait: 'run', dur: 0.7}, {at: 1.0, who: MI, pose: 'hug'}]), {
    beats: ['heart', 'laugh'],
    action: 'Ito walks back out of the tunnel, black with grease, grinning. Mira runs into him.',
    lines: [N('Ito comes back covered in grease and very pleased with himself.')],
  }),
  sh('radio-vents', sc('closeup', {v: 'radio'}), {
    dev: 'life at the vents',
    action: 'The radio again, crackling.',
    lines: [R('Submarine crews report the life around deep sea vents is completely unaffected.')],
  }),
  sh('vents', sc('diagram', {v: 'vents', step: 0}), {
    science: {text: "Life around deep-sea hydrothermal vents runs on chemical energy from inside the Earth (chemosynthesis), not sunlight.", source: "NOAA Ocean Exploration, ‘Hydrothermal Vents’"},
    beats: ['wow'],
    action: 'The sea floor: a black smoker, tube worms, crabs, ghostly shrimp. Thriving.',
    lines: [N('Down there, life runs on heat from inside the Earth.')],
  }),
  sh('never-needed', sc('diagram', {v: 'vents', step: 1}), {
    action: 'Close on a crab waving a claw in the warm shimmer.',
    lines: [N('It never needed the Sun.')],
  }),
  sh('neither-will-we', stage('metro', 'workshop', push(2.4, 2.8, 1000, 600), [c(IT, 1000, 900, {outfit: 'cold', pose: 'relaxed', expr: 'smile'})]), {
    beats: ['heart'],
    action: 'Ito, smiling for the first time in months.',
    lines: [I('Neither will we.')],
  }),

  // ══ DAY 300 · the beam ═════════════════════════════════════════════════════════════════════
  sh('day300', stage('surface', 'deep', move([1.0, 960, 520], [1.1, 1000, 480]), [
    c(IT, 1000, 940, {...COLD, hold: 'thermal', pose: 'reachUp'}),
    c(Y, 780, 940, {...COLD, hoodUp: true, hold: 'torch', facing: 'right'}),
  ]), {
    chapter: 'Day 300',
    hud: {day: 300, temp: -68},
    cue: 'mystery',
    transition: 'fade',
    action: 'Day 300. The surface again. Snow squeaks underfoot like polystyrene. Ito’s camera has a bigger lens.',
    lines: [N("Day three hundred. Ito's camera is better now.")],
  }),
  sh('thread', sc('thermal', {v: 'beam'}), {
    dev: 'a beam leaves the shell',
    action: 'Thermal view: the warm disc, and from it a thin glowing thread running off into space.',
    lines: [N('A thin, warm thread is leaving the shell. Dust, glowing in its path.')],
  }),
  sh('beam-map', sc('diagram', {v: 'beam'}), {
    action: 'Map of the solar system: the shell, and a straight line leaving it, pointing away from every planet.',
    lines: [I('It is not blocking the Sun.')],
  }),
  sh('taking-it', stage('surface', 'deep', push(2.8, 3.3, 1000, 560), [c(IT, 1000, 940, {...COLD, hold: 'thermal', pose: 'hold', facing: 'front', expr: 'scared'})]), {
    cue: 'shellSting',
    twist: 4,
    letterbox: true,
    callout: {text: 'TAKING IT', at: 'l0+0.3'},
    sfx: 'impact',
    dev: 'the shell is harvesting the Sun',
    action: 'Ito, barely a whisper.',
    lines: [I('It is taking it.', 0.8)],
  }),
  sh('beam-space', sc('space', {v: 'beam'}), {
    cue: 'shell',
    beats: ['wow'],
    action: 'The shell from far away, a needle of energy leaving it toward a faint, distant star.',
    lines: [N('All of the Sun’s light, sent somewhere else.', 0.6)],
  }),

  // ══ DAY 365 · contact ══════════════════════════════════════════════════════════════════════
  sh('day365', stage('surface', 'milky', move([1.0, 960, 660], [1.14, 960, 600]), [
    c(Y, 820, 940, {...COLD, hoodUp: true, facing: 'back'}),
    c(MI, 940, 940, {...COLD, facing: 'back'}),
    c(IT, 1140, 940, {...COLD, facing: 'back', hold: 'cane'}),
    c(B, 680, 940, {pose: 'sit'}),
  ], [
    {at: 'l0+0.8', who: MI, pose: 'pointUp'},
    {at: 'l0+1.2', who: B, pose: 'beg', wag: 1},
  ]), {
    chapter: 'Day 365',
    hud: {day: 365, temp: -73},
    cue: 'finale',
    transition: 'fade',
    letterbox: true,
    beats: ['wow'],
    action: 'Day 365. All of you on the surface, tiny under the brightest Milky Way anyone has ever seen.',
    lines: [N('Day three sixty-five. Minus seventy-three.')],
  }),
  sh('clearest-sky', sc('sky', {v: 'milky'}), {
    letterbox: true,
    action: 'The Milky Way, blazing from horizon to horizon over the frozen skyline.',
    lines: [N('The clearest sky in human history.')],
  }),
  sh('birthday', stage('surface', 'milky', push(1.75, 1.95, 970, 700), [
    c(MI, 900, 940, {...COLD, facing: 'front', expr: 'smile'}),
    c(Y, 1040, 940, {...COLD, hoodUp: true, facing: 'left'}),
  ], [{at: 'l0+1', who: Y, expr: 'smile'}]), {
    beats: ['heart'],
    action: 'Mira grins up at you.',
    lines: [M('One whole lap around the Sun. Happy birthday, Earth.')],
  }),
  sh('door-opens', sc('space', {v: 'flicker'}), {
    cue: 'flash',
    min: 2.6,
    sfx: 'riser',
    dev: 'the shell opens',
    action: 'In space: a seam in the shell slides open. A blade of sunlight escapes.',
  }),
  sh('one-second', stage('surface', 'flash', hold(1.0, 960, 500), [
    c(Y, 820, 940, {...COLD, hoodUp: true, facing: 'front', expr: 'surprised'}),
    c(MI, 940, 940, {...COLD, facing: 'front', expr: 'awe'}),
    c(IT, 1140, 940, {...COLD, facing: 'front', hold: 'cane', expr: 'surprised'}),
    c(B, 680, 940, {pose: 'sit'}),
  ], [
    {at: 'l0+0.3', who: Y, pose: 'flinch', expr: 'surprised'},
    {at: 'l0+0.3', who: IT, pose: 'flinch', hold: null, expr: 'surprised'},
    {at: 'l0+0.35', who: MI, pose: 'reachUp', expr: 'awe'},
    {at: 'l0+0.35', who: B, pose: 'beg', wag: 1},
    {at: 'l0+1.6', who: Y, pose: 'stand', expr: 'awe'},
    {at: 'l0+1.6', who: IT, pose: 'stand', expr: 'awe'},
  ], {flash: 'l0+0.3'}), {
    letterbox: true,
    callout: {text: '1 SECOND', at: 'l0+0.3', pos: 'top'},
    action: 'Eight minutes later: for one second the whole frozen world turns gold. Then black.',
    lines: [N('Eight minutes later, the Sun comes back. For one second.', 0.6)],
  }),
  sh('mira-saw', stage('surface', 'milky', push(3.0, 3.4, 940, 560), [c(MI, 940, 940, {...COLD, facing: 'front', expr: 'awe'})], [{at: 1.2, who: MI, expr: 'sad'}], {afterglow: true}), {
    cue: 'afterglow',
    min: 2.8,
    beats: ['heart'],
    action: 'Mira, eyes shining. She saw it. A real one.',
  }),
  sh('signal', stage('metro', 'radios', push(1.3, 1.6, 960, 600), [
    c(IT, 960, 900, {outfit: 'cold', hold: 'radio', pose: 'holdBoth', expr: 'focused'}),
    c(Y, 760, 900, {outfit: 'cold', facing: 'right'}),
    c(MI, 1160, 900, {outfit: 'cold', facing: 'left'}),
  ]), {
    cue: 'signal',
    sfx: 'chime',
    dev: 'a signal from the Sun',
    action: 'Below, every radio in the station hisses at once. A rhythm of pulses.',
    lines: [N('Then every radio on Earth picks up a signal.')],
  }),
  sh('from-the-sun', sc('space', {v: 'signal'}), {
    action: 'Space: rings of radio waves pulse outward from the shell, washing over the planets.',
    lines: [N('It is coming from the direction of the Sun.')],
  }),
  sh('counting', stage('metro', 'radios', push(2.5, 3.0, 960, 580), [c(IT, 960, 900, {outfit: 'cold', hold: 'radio', pose: 'holdBoth', expr: 'focused'})], [{at: 'l0', who: IT, look: [0, 0.6]}], {pulses: true}), {
    callout: {text: '1 · 2 · 3', at: 'l0'},
    action: 'Ito listens to the bursts of pulses and counts them: one, then two, then three.',
    lines: [I('One.', 0.5), I('Two.', 0.5), I('Three.', 0.8)],
  }),
  sh('count-planets', sc('diagram', {v: 'count'}), {
    dev: 'it is counting the planets',
    action: 'The planets in a row. Mercury lights up. Venus. Earth.',
    lines: [I('It is counting the planets.')],
  }),
  sh('stopped', sc('diagram', {v: 'count', step: 1}), {
    action: 'The count stops on Earth. Earth, alone, highlighted.',
    lines: [N('And it stopped at three.', 1.0)],
  }),
  sh('thats-us', stage('metro', 'radios', push(2.8, 3.4, 1100, 600), [c(MI, 1160, 900, {outfit: 'cold', facing: 'front', expr: 'scared'})]), {
    cue: 'shellSting',
    twist: 5,
    letterbox: true,
    beats: ['loop'],
    sfx: 'impact',
    action: 'Mira, very quietly, looks at you.',
    lines: [M("That's us.", 1.2)],
  }),
  sh('end', sc('end'), {
    cue: 'end',
    action: 'Black. The shell, turning. Text: PART 2: THE REPLY.',
    lines: [N('What would you say back? Tell us in the comments.'), N('Part two. The reply.', 1.4)],
  }),
];

export const sun01: Episode = {
  id: 'sun01',
  file: 'FILE 001',
  title: 'The Sun Went Out',
  youtubeTitle: "The Sun Went Out. Here's Your Day 1 to Day 365",
  thumbnailText: 'WHO BUILT THIS?',
  commentPrompt: 'Something just counted the planets and stopped at Earth. What would you say back?',
  logline:
    "At 6:44 a.m. something closed around the Sun. Eight minutes later the sky goes black. You, your little sister Mira, your dog Biscuit and Mr. Ito, the old astronomer upstairs, have one year to survive the freeze and work out what happened. Every clue is real physics. The ending isn't.",
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
    'the blink files',
  ],
  pinnedComment: 'It counted to three and stopped. What do we say back? Best answer gets read out in Part 2. 👇',
  fps: 30,
  style: 'cinema',
  shots,
};
