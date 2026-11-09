import type {Line, Shot, Episode} from '../../src/engine/schema';

/**
 * THE BLINK FILES · File 002 — "The Sun Went Out While My Mum Was at Sea"
 *
 * Told by Tomás Reyes, grown up, in the first person: the year he was twelve, the Sun went out, and his mum's ship
 * vanished in the dark Pacific. He is the Manila boy File 001 shows missing his bus at 1:51 PM and laughing in the
 * light on Day 365. He narrates what he saw, and what his mum told him later (the ship scenes, always labelled).
 *
 * One causal chain (world-model.md §1): satellites die → shortwave fades with the ionosphere → on the last call Lola
 * makes Rosa promise to call at six every morning, in Morse → a storm breaks the ship's rudder; no position, no
 * rescue → Lola calls the sky every dawn and has Tomás count shooting stars → the reveal: meteor trails reflect radio,
 * most fall at dawn, and the Perseids are coming → before dawn on Day 59 Tomás copies Rosa's position → rescue.
 *
 * Every question a viewer can ask, and the shot that answers it: world-model.md §5. Dialogue ledger:
 * dialogue-review.md. Continuity: props change hands only with give / take / put.
 */

type G = Line['g'];
const L =
  (speaker: Line['speaker']) =>
  (text: string, pause?: number, g?: G): Line => ({speaker, text, pause, g});
const N = L('NARRATOR');
const T = L('TOMAS');
const LO = L('LOLA');
const RO = L('ROSA');
const RR = L('ROSA_RADIO');
const CA = L('CAPTAIN');
const OF = L('OFFICER');
const CL = L('CLERK');
const AN = L('ANCHOR');

type Cam = [number, number, number, number, number?];
const hold = (z: number, x: number, y: number): Cam[] => [[0, z, x, y], [1, z * 1.04, x, y]];
const push = (z0: number, z1: number, x: number, y: number, x1 = x, y1 = y, r = 0): Cam[] => [[0, z0, x, y, 0], [1, z1, x1, y1, r]];
const move = (a: [number, number, number], b: [number, number, number], at = 0): Cam[] => [[at, ...a], [1, ...b]];
const dutch = (z0: number, z1: number, x: number, y: number, r: number): Cam[] => [[0, z0, x, y, r * 0.55], [1, z1, x, y, r]];

const TO = 'tomas';
const LA = 'lola';
const RS = 'rosa';
const CP = 'captain';
const JY = 'officer';
type C = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
const c = (who: string, x: number, y: number, o: Record<string, unknown> = {}, depth = 1.2): C => ({who, x, y, depth, ...o});

const stage = (set: string, v: string, cam: Cam[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({
  scene: 'stage',
  props: {set, v, cam, cast, acts, ...extra},
});
const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});
const sea = (v: string, props: Record<string, unknown> = {}) => sc('sea', {v, ...props});

// ── Recurring blocking ────────────────────────────────────────────────────────────────────────────
// Lola's flat: door far left, TV at x≈450, table x≈850, louvre window x≈1170, radio desk x≈1450–1800 (Lola's chair 1400).
const LOLA_DESK = (o: object = {}) => c(LA, 1400, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', hold: 'mic', ...o});
const TOM_DESK = (o: object = {}) => c(TO, 1220, 930, {facing: 'right', ...o});
// Basement car park: radio table x≈1300–1560 by pillar B1-3; Lola's chair 1240, Tomás on a crate at 1120.
const LOLA_B = (o: object = {}) => c(LA, 1240, 940, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'cold', breath: true, ...o});
const TOM_B = (o: object = {}) => c(TO, 1110, 940, {pose: 'sitChair', seat: 'crate', facing: 'right', outfit: 'cold', breath: true, ...o});
// The bridge: Rosa at the radio console x≈1260, the captain by the helm x≈960.
const ROSA_BR = (o: object = {}) => c(RS, 1260, 930, {facing: 'right', hold: 'mic', pose: 'hold', ...o});
const CAPT_BR = (o: object = {}) => c(CP, 940, 930, {facing: 'right', ...o});
// The roof: Lola and Tomás by the parapet under the sky, the antenna mast at x≈1520.
const ROOF = (o: {tomas?: object; lola?: object} = {}) => [
  c(TO, 860, 900, {facing: 'right', pose: 'lookUp', ...o.tomas}),
  c(LA, 1040, 900, {facing: 'left', hold: 'list', pose: 'hold', ...o.lola}),
];

const shots: Shot[] = [
  // ══ COLD OPEN · a morning in the dark ════════════════════════════════════════════════════════════
  sh('six-am', stage('lolaflat', 'dawn', push(1.5, 1.7, 1440, 600), [LOLA_DESK({outfit: 'cold', breath: true}), c(TO, 300, 930, {facing: 'right', outfit: 'cold', breath: true, expr: 'sad'})], [{at: 'l0+0.6', who: LA, look: [1, 0.2]}], {clock: '5:59'}), {
    chapter: 'Six o’clock',
    thread: 'flash',
    cue: 'mystery',
    hud: {place: 'MANILA', time: 'DAY 20 · 5:59 AM'},
    action: 'Pitch dark outside the louvre window. Lola, 76, at an old coast-guard radio, the desk lamp the only light. In the doorway, Tomás watches.',
    lines: [N('Every morning at six, my grandmother sat at her radio and called my mum.')],
  }),
  sh('key-open', sea('key', {taps: [0.3, 0.5, 0.9, 1.1, 1.3, 1.9, 2.1]}), {
    thread: 'flash',
    action: 'Close: an old brass Morse key under Lola’s finger, tapping.',
    lines: [N('Nobody had answered her in weeks.', 0.4)],
  }),
  sh('title', sc('title'), {
    min: 3.8,
    cue: 'title',
    action: 'Title card.',
    lines: [N('My name is Tomás. I was twelve, and my mum was at sea.', 0.5)],
  }),

  // ══ DAY 0 · 1:51 PM, MANILA ═══════════════════════════════════════════════════════════════════
  sh('bus-run', stage('montage', 'bus', push(1.0, 1.1, 900, 600), [c(TO, -150, 960, {facing: 'right', outfit: 'home', expr: 'determined'}, 1.4)], [{at: 0, who: TO, to: 1000, gait: 'run', dur: 1.4}, {at: 1.5, who: TO, expr: 'sad', pose: 'reach'}], {busGo: 1.55}), {
    chapter: 'Day 0',
    hud: {place: 'MANILA', time: '1:51 PM'},
    timeJump: true,
    cue: 'warm',
    beats: ['laugh'],
    min: 3.2,
    action: 'A sunny Manila street. Tomás sprints for the yellow school bus; the doors shut on his nose and it pulls away.',
    lines: [N('It was the first day of school. We finished early, and I missed the bus.')],
  }),
  sh('bus-gone', stage('montage', 'bus', hold(1.5, 1000, 640), [c(TO, 1000, 960, {facing: 'right', outfit: 'home', expr: 'sad', pose: 'reach'}, 1.4)], [{at: 'l0+0.4', who: TO, pose: 'shrug'}], {noBus: true}), {
    min: 2.0,
    action: 'Tomás, alone at the stop, arms out.',
    lines: [T('Seriously?')],
  }),
  sh('dark-bus', stage('montage', 'bus', hold(1.1, 900, 600), [c(TO, 1000, 960, {facing: 'right', outfit: 'home', expr: 'scared', pose: 'reach'}, 1.4)], [], {dark: 0, noBus: true}), {
    dev: 'the Sun goes out',
    sfx: 'impact',
    cue: 'silence',
    min: 2.4,
    action: '1:52. The sky turns black in an instant. Stars.',
    lines: [N('At 1:52 in the afternoon, the sky went black.', 0.6)],
  }),
  sh('stars-noon', stage('montage', 'bus', push(1.6, 1.8, 1000, 560), [c(TO, 1000, 960, {facing: 'right', outfit: 'home', pose: 'lookUp', expr: 'uneasy'}, 1.4)], [], {dark: 0, noBus: true}), {
    action: 'Tomás looks straight up: a full night sky over a Manila street at two in the afternoon.',
    lines: [T("Stars? It's two in the afternoon!")],
  }),
  sh('streetlights', sea('manila', {lightsAt: 0.6}), {
    dev: 'the whole city in the dark',
    science: {text: 'Streetlights are switched by light sensors (photocells): when the light level drops, they turn on by themselves.', source: 'US Department of Energy, ‘Outdoor Lighting Controls’'},
    beats: ['wow'],
    action: 'Manila from above, black at two in the afternoon. Row by row the streetlights switch themselves on; traffic stops, horns.',
    lines: [N('Then the streetlights came on by themselves. They thought it was night.')],
  }),
  sh('call-mum', stage('montage', 'bus', push(1.7, 1.85, 1000, 600), [c(TO, 1000, 960, {facing: 'right', outfit: 'home', expr: 'alert'}, 1.4)], [{at: 0.1, who: TO, take: 'pocket', prop: 'phoneLit'}, {at: 0.5, who: TO, pose: 'hold', expr: 'worried'}], {dark: 0, noBus: true}), {
    action: 'Under the streetlight, Tomás video-calls his mum.',
    lines: [T('Mum? Can you see me?')],
  }),
  sh('videocall', sea('videocall'), {
    action: 'His phone: Mum on the bridge of her ship, at night too, her face lit by the consoles, picture stuttering.',
    lines: [RR("It's dark here too, anak. Go home to Lola. I'll call tonight.")],
  }),
  sh('call-freeze', sea('videocall', {freezeAt: 0.4}), {
    dev: 'the call to Mum drops',
    sfx: 'static',
    action: 'Her face freezes, smears into blocks. CONNECTION LOST.',
    lines: [N('Then her face froze.', 0.5)],
  }),

  sh('flat-arrive', stage('lolaflat', '', move([1.0, 960, 560], [1.15, 1100, 580]), [LOLA_DESK({hold: undefined, pose: 'sitChair', expr: 'focused'}), c(TO, 140, 930, {facing: 'right', outfit: 'home', expr: 'worried'})], [{at: 0, who: TO, to: 1150, gait: 'run', dur: 1.6}, {at: 1.2, who: LA, look: [-1, 0]}], {doorOpen: true}), {
    dev: 'Lola, already at her radio',
    hud: {place: 'MANILA', time: 'DAY 0 · 2:20 PM'},
    action: 'Lola’s small flat, lamps on. Tomás bursts in. Lola is already at her radio desk, under a wall map of the sea.',
    lines: [N('Home was three streets from the bus stop. Lola was already at her radio.')],
  }),
  sh('lola-intro', stage('lolaflat', '', push(2.0, 2.2, 1300, 520), [LOLA_DESK({hold: undefined, expr: 'focused'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [{at: 'l0+0.8', who: LA, look: [-1, -0.1]}]), {
    action: 'The wall: a photo of Rosa in her officer’s uniform beside a ship; another of young Lola in headphones at a coast-guard radio room.',
    lines: [N('She raised me while Mum was at sea. In Manila, lots of kids grow up that way.')],
  }),
  sh('lola-job', stage('lolaflat', '', push(2.4, 2.55, 1520, 460), [LOLA_DESK({hold: undefined, expr: 'focused'}), TOM_DESK({expr: 'worried', outfit: 'home'})]), {
    action: 'Close on the old photo: Lola, young, at the coast-guard radio station.',
    lines: [N('She had been a radio operator for the coast guard for thirty years.')],
  }),
  sh('cant-call', stage('lolaflat', '', push(2.2, 2.35, 1300, 600), [LOLA_DESK({hold: undefined, expr: 'focused'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [{at: 'l0+0.4', who: TO, pose: 'shrug'}]), {
    action: 'Tomás, out of breath.',
    lines: [T("I can't reach Mum. The call just cut out.")],
  }),
  sh('sats-why', stage('lolaflat', '', push(2.6, 2.75, 1420, 560), [LOLA_DESK({hold: undefined, expr: 'focused'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [{at: 'l0+0.4', who: LA, look: [-1, -0.2]}]), {
    action: 'Lola, calm, already working it out.',
    lines: [LO("Her ship's internet comes from satellites. And satellites run on sunlight.")],
  }),
  sh('sats', sea('satellites', {step: 0}), {
    science: {text: 'Satellites are powered by solar panels; their batteries are sized to carry them through Earth’s shadow, about an hour at most.', source: 'NASA, ‘State-of-the-Art Small Spacecraft Technology: Power’ (2024)'},
    beats: ['wow'],
    action: 'Diagram: Earth ringed by satellites, each with solar panels and a battery bar draining as the sunlight vanishes.',
    lines: [N('Every satellite runs on solar panels. Their batteries last about an hour in the dark.')],
  }),
  sh('sats-out', sea('satellites', {step: 1}), {
    dev: 'satellites die: no GPS, no satellite phones',
    action: 'One by one the satellites go dark; labels wink out: GPS, SATELLITE PHONES, SHIP INTERNET.',
    lines: [N("By evening, GPS, satellite phones and the ships' internet were gone.")],
  }),
  sh('then-radio', stage('lolaflat', '', push(2.2, 2.4, 1500, 580), [LOLA_DESK({hold: undefined, expr: 'determined'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [{at: 0.3, who: LA, pose: 'sitPoint'}], {radioOnAt: 0.5}), {
    dev: 'Lola turns to shortwave',
    action: 'Lola switches on the radio; its old dial glows amber.',
    lines: [LO('Then we use the shortwave.')],
  }),
  sh('reach-ship', stage('lolaflat', '', push(2.4, 2.55, 1300, 580), [LOLA_DESK({hold: undefined, expr: 'focused'}), TOM_DESK({expr: 'uneasy', outfit: 'home'})], [], {radioOn: true}), {
    action: 'Tomás, doubtful.',
    lines: [T('Can a radio reach a ship in the middle of the ocean?')],
  }),
  sh('reach-ship-b', stage('lolaflat', '', push(2.6, 2.75, 1420, 560), [LOLA_DESK({hold: undefined, expr: 'focused'}), TOM_DESK({expr: 'uneasy', outfit: 'home'})], [], {radioOn: true}), {
    action: 'Reverse angle on the reply.',
    lines: [LO('Yes. It bounces off the sky, all the way round the world.', 0.2)],
  }),
  sh('ionosphere', sea('ionosphere', {step: 0}), {
    dev: 'how shortwave reaches the ship',
    beats: ['wow'],
    science: {text: 'Shortwave (HF) radio reaches around the world by reflecting off the ionosphere, a layer of electrically charged air 80–600 km up that is created by the Sun’s ultraviolet and X-ray light.', source: 'NOAA Space Weather Prediction Center, ‘Ionosphere’'},
    action: 'Diagram: a glowing layer high above the curve of the Earth; a radio wave leaves Manila, bounces off it and comes down at a ship far across the sea.',
    lines: [N('High up, sunlight makes a layer of electric air. Shortwave bounces off it, around the Earth.')],
  }),
  sh('hf-first', stage('lolaflat', '', push(1.9, 2.05, 1420, 580), [LOLA_DESK({expr: 'focused'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [{at: 'l1+0.2', who: TO, expr: 'relieved'}, {at: 'l1+0.3', who: LA, expr: 'relieved'}], {radioOn: true}), {
    dev: 'contact with the ship',
    beats: ['heart'],
    hud: {place: 'MANILA', time: 'DAY 0 · 9:00 PM'},
    timeJump: true,
    action: 'Night. Lola at the microphone. Static, then a voice.',
    lines: [LO('Amihan, Amihan, this is Manila. Over.', 0.6), RR('Ma! We hear you!')],
  }),
  sh('hf-rosa', stage('bridge', '', push(1.7, 1.85, 1200, 560), [ROSA_BR({expr: 'relieved'}), CAPT_BR({expr: 'focused'})], [{at: 'l0+0.5', who: CP, look: [1, 0]}]), {
    dev: 'Rosa steers by the stars',
    hud: {place: 'MV AMIHAN · PACIFIC', time: 'DAY 0 · 9:00 PM'},
    action: 'The bridge of the cargo ship Amihan, at night, consoles glowing. Rosa, Second Officer, at the radio handset; Captain Rivera behind her.',
    lines: [RO("We're fine. There's no GPS, so we're steering by compass, the old way.")],
  }),
  sh('hf-when', stage('lolaflat', '', push(2.3, 2.45, 1360, 600), [LOLA_DESK({expr: 'smile'}), TOM_DESK({expr: 'smile', outfit: 'home', pose: 'reach'})], [], {radioOn: true}), {
    beats: ['heart'],
    action: 'Tomás leans in to the microphone.',
    lines: [T('Mum! When are you coming home?')],
  }),
  sh('hf-six', stage('bridge', '', push(2.2, 2.35, 1280, 540), [ROSA_BR({expr: 'smile'}), CAPT_BR({expr: 'focused'})]), {
    action: 'Rosa smiles at the handset.',
    lines: [RO('In six more days, anak. Be good for Lola.')],
  }),

  // ══ DAYS 2–4 · the sky goes quiet ════════════════════════════════════════════════════════════════
  sh('news-shell', sc('news', {v: 'anchor', headline: 'SOMETHING AROUND THE SUN', ticker: 'ASTRONOMERS: AN OBJECT HAS SURROUNDED THE SUN · POWER AND WATER WORKING NORMALLY · STAY INDOORS'}), {
    dev: 'the world: something around the Sun',
    hud: {day: 2, temp: 22},
    cue: 'news',
    action: 'Day 2. Lola’s TV: the news, an infrared image of a ring where the Sun should be.',
    lines: [AN('Astronomers say something has surrounded the Sun.')],
  }),
  sh('tv-off', stage('lolaflat', '', push(1.4, 1.55, 760, 600), [c(LA, 640, 930, {facing: 'right', outfit: 'home', expr: 'determined'}), c(TO, 860, 930, {facing: 'left', outfit: 'home', expr: 'uneasy'})], [{at: 'l0+0.2', who: LA, pose: 'point'}, {at: 'l0+1.6', who: LA, pose: 'stand'}], {tvOn: true, tvOffAt: 'l0+0.9'}), {
    action: 'Lola switches the TV off mid-sentence and turns to the radio.',
    lines: [LO("Whatever that is, it can wait. It's radio time.")],
  }),
  sh('fainter', stage('lolaflat', '', push(2.0, 2.2, 1420, 580), [LOLA_DESK({expr: 'worried'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [], {radioOn: true, meter: 0.4}), {
    dev: 'the radio sky is fading',
    hud: {day: 3, temp: 20},
    action: 'Day 3. The needle on the signal meter barely moves. Rosa’s voice is thin, full of hiss.',
    lines: [RR('Ma… I can barely hear you.', 0.4)],
  }),
  sh('fainter-b', stage('lolaflat', '', push(2.5, 2.65, 1240, 580), [LOLA_DESK({expr: 'worried'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [], {radioOn: true, meter: 0.4}), {
    action: 'Reverse angle on the reply.',
    lines: [T('Why is she so faint?', 0.2)],
  }),
  sh('fading-why', stage('lolaflat', '', push(2.5, 2.65, 1440, 560), [LOLA_DESK({expr: 'sad'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [{at: 'l0+0.4', who: LA, look: [-1, -0.2]}], {radioOn: true, meter: 0.35}), {
    action: 'Lola, quiet.',
    lines: [LO("Because the sky's mirror is made by sunlight. Without it, it fades every night.")],
  }),
  sh('ionosphere-fade', sea('ionosphere', {step: 1}), {
    science: {text: 'At night the lower ionosphere disappears and the upper layer slowly thins as its charged particles recombine; with no sunrise to recharge it, long-distance radio would fade night after night.', source: 'NOAA SWPC, ‘Ionosphere’; Davies, ‘Ionospheric Radio’ (IET, 1990)'},
    action: 'The same diagram: day counter 1, 2, 3, 4. The glowing layer thins; the radio wave starts leaking through it into space.',
    lines: [N('Every night, Mum sounded further away.')],
  }),

  sh('last-call', stage('lolaflat', '', push(1.9, 2.1, 1420, 580), [LOLA_DESK({expr: 'worried'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [], {radioOn: true, meter: 0.2}), {
    chapter: 'Day 4',
    hud: {day: 4, temp: 19},
    cue: 'tension',
    action: 'Day 4, nine at night. Mostly static now. Rosa’s voice comes and goes.',
    lines: [RR("Ma, I'm losing you.")],
  }),
  sh('promise', stage('lolaflat', '', push(2.7, 2.9, 1440, 540), [LOLA_DESK({expr: 'determined'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [], {radioOn: true, meter: 0.2}), {
    dev: 'the promise: six o’clock, channel six, Morse',
    action: 'Lola, very close to the microphone, slow and clear.',
    lines: [LO('Listen, Rosa. Every morning at six, call me on channel six.')],
  }),
  sh('promise-2', stage('lolaflat', '', push(3.0, 3.15, 1460, 520), [LOLA_DESK({expr: 'determined'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [], {radioOn: true, meter: 0.15}), {
    action: 'Closer.',
    lines: [LO('Press the talk button in Morse. Keep calling, even if I never answer.')],
  }),
  sh('promise-ship', stage('bridge', '', push(2.4, 2.6, 1280, 540), [ROSA_BR({expr: 'worried'}), CAPT_BR({expr: 'focused'})]), {
    hud: {place: 'MV AMIHAN · PACIFIC', time: 'DAY 4 · 9:02 PM'},
    action: 'On the bridge, Rosa pressing the handset to her ear.',
    lines: [RO("Ma, without the sky, nothing's going to reach you.")],
  }),
  sh('promise-me', stage('lolaflat', '', push(3.0, 3.1, 1460, 520), [LOLA_DESK({expr: 'determined'}), TOM_DESK({expr: 'worried', outfit: 'home'})], [], {radioOn: true, meter: 0.1}), {
    action: 'Lola, not taking no.',
    lines: [LO('Promise me.', 0.5)],
  }),
  sh('promise-yes', stage('bridge', '', push(2.6, 2.75, 1280, 540), [ROSA_BR({expr: 'sad'}), CAPT_BR({expr: 'sad'})]), {
    beats: ['heart'],
    action: 'Rosa closes her eyes.',
    lines: [RO('I promise. Six o’clock, channel six.')],
  }),
  sh('static', stage('lolaflat', '', push(1.6, 1.75, 1300, 600), [LOLA_DESK({expr: 'sad'}), TOM_DESK({expr: 'sad', outfit: 'home'})], [{at: 1.2, who: LA, put: 'table', prop: 'mic'}], {radioOn: true, meter: 0, items: [{prop: 'mic', x: 1560, y: 735, from: 1.6}]}), {
    sfx: 'static',
    cue: 'silence',
    min: 3.4,
    action: 'Only static. Lola sets the microphone down on the desk.',
    lines: [N('That was the last time her voice came through.', 0.8)],
  }),

  // ══ THE STORM (Mum told us later) ═════════════════════════════════════════════════════════════════
  sh('storm-wave', sea('shipstorm'), {
    dev: 'a storm hits the ship',
    hud: {place: 'MV AMIHAN · PACIFIC', time: 'DAY 4 · 11:40 PM'},
    cue: 'tension',
    sfx: 'thunder',
    action: 'The Amihan, a long cargo ship, climbing waves taller than houses in the dark; spray, lightning.',
    lines: [N("We didn't know it then, but that night a storm hit Mum's ship.")],
  }),
  sh('storm-why', sea('stormwhy'), {
    science: {text: 'Very cold air flowing over much warmer sea water drives intense convection and violent storms (for example polar lows and cold-air outbreaks).', source: 'UK Met Office, ‘Polar lows’; Rasmussen & Turner, ‘Polar Lows’ (Cambridge, 2003)'},
    action: 'Diagram: freezing air pouring off a frozen Asia over a warm sea; towers of cloud boil up.',
    lines: [N('Freezing air from the frozen land was pouring over a sea that was still warm.')],
  }),
  sh('storm', stage('bridge', 'storm', dutch(1.4, 1.6, 1100, 560, 5), [c(RS, 1020, 930, {facing: 'right', expr: 'scared'}), CAPT_BR({x: 760, expr: 'determined'})], [{at: 'l0+0.3', who: CP, pose: 'point'}]), {
    action: 'The bridge tilting, rain hammering the windows. Rosa at the helm, the captain shouting.',
    lines: [CA('Hold her into the wind!', 0, 'point')],
  }),
  sh('storm-hit', sea('shipstorm', {hit: 0.6}), {
    beats: ['wow'],
    sfx: 'crash',
    min: 2.2,
    action: 'A wall of water slams the stern. Something under the ship gives with a groan.',
  }),
  sh('storm-rudder', stage('bridge', 'storm', dutch(1.8, 2.0, 1000, 540, -4), [c(RS, 1020, 930, {facing: 'right', expr: 'scared'}), CAPT_BR({x: 760, expr: 'scared'})], [{at: 'l0+0.4', who: RS, look: [-1, 0]}], {alarm: true}), {
    twist: 1,
    dev: 'the rudder is gone',
    action: 'Alarms. The captain stares at the steering readout: no response.',
    lines: [CA("The rudder's gone. She won't steer.")],
  }),
  sh('adrift', sea('shipdrift'), {
    dev: 'the Amihan drifts',
    cue: 'mystery',
    action: 'Morning that never comes: the storm past, the Amihan lying still and dark on a black sea, a few lit portholes.',
    lines: [N('With no rudder, the engines were useless. The Amihan began to drift.')],
  }),

  // ══ DAY 6–7 · missing ═════════════════════════════════════════════════════════════════════════════
  sh('day6', stage('lolaflat', '', push(1.4, 1.55, 1300, 580), [LOLA_DESK({expr: 'sad'}), TOM_DESK({expr: 'sad', outfit: 'home', pose: 'sitChair', seat: 'stool'})], [], {radioOn: true, meter: 0, clock: '11:58', items: [{prop: 'mic', x: 1560, y: 735}]}), {
    dev: 'the ship misses its arrival',
    hud: {day: 6, temp: 17},
    action: 'Day 6, nearly midnight. Static. Tomás watching the clock.',
    lines: [N("Day 6 came. Mum's ship didn't.", 0.5)],
  }),
  sh('coastguard', stage('coastguard', '', move([1.0, 960, 560], [1.1, 900, 560]), [c(LA, 760, 930, {facing: 'right', outfit: 'home', expr: 'focused'}), c(TO, 620, 930, {facing: 'right', outfit: 'home', expr: 'worried'}), c(JY, 1120, 930, {facing: 'left', expr: 'focused'})]), {
    chapter: 'Day 7',
    hud: {day: 7, temp: 16},
    cue: 'tension',
    action: 'The coast-guard operations room: a huge chart of the Philippine Sea, radio consoles. Commander Joy Santos meets them.',
    lines: [N('On Day 7, Lola took me to the coast guard. Commander Santos had trained under her.')],
  }),
  sh('cg-position', stage('coastguard', '', push(2.0, 2.2, 1080, 540), [c(LA, 760, 930, {facing: 'right', outfit: 'home', expr: 'focused'}), c(TO, 620, 930, {facing: 'right', outfit: 'home', expr: 'worried'}), c(JY, 1120, 930, {facing: 'left', expr: 'sad'})], [{at: 'l0+1.2', who: JY, look: [-1, 0.1]}]), {
    action: 'Joy, gently.',
    lines: [OF('Give me a position within fifty kilometres, and I will send a ship today.')],
  }),
  sh('cg-without', stage('coastguard', '', push(2.2, 2.35, 760, 560), [c(LA, 760, 930, {facing: 'right', outfit: 'home', expr: 'focused'}), c(TO, 620, 930, {facing: 'right', outfit: 'home', expr: 'worried'}), c(JY, 1120, 930, {facing: 'left', expr: 'sad'})]), {
    action: 'Lola, steady.',
    lines: [LO('And without one?')],
  }),
  sh('cg-dark', stage('coastguard', '', push(1.6, 1.75, 700, 480), [c(LA, 760, 930, {facing: 'right', outfit: 'home', expr: 'sad'}), c(TO, 620, 930, {facing: 'right', outfit: 'home', expr: 'worried'}), c(JY, 1120, 930, {facing: 'left', expr: 'sad'})], [{at: 0.4, who: JY, pose: 'point'}, {at: 'l0+1.6', who: JY, pose: 'stand'}]), {
    dev: 'no position, no search',
    science: {text: 'Search and rescue starts from a last known position moved forward by wind and current; the probable area grows quickly with time, which is why a fresh, accurate position matters so much.', source: 'IAMSAR Manual, Vol. II (IMO/ICAO)'},
    action: 'Joy gestures at the chart: an ocean of empty grid squares.',
    lines: [OF("That ocean is bigger than our whole country, and it's dark. We'd never find them.")],
  }),
  sh('cg-tomas', stage('coastguard', '', push(2.6, 2.8, 640, 560), [c(LA, 760, 930, {facing: 'right', outfit: 'home', expr: 'sad'}), c(TO, 620, 930, {facing: 'right', outfit: 'home', expr: 'sad'}), c(JY, 1120, 930, {facing: 'left', expr: 'sad'})], [{at: 'l0+0.8', who: LA, look: [-1, 0.4]}]), {
    beats: ['heart'],
    action: 'Tomás looks up at Lola. She doesn’t answer.',
    lines: [T('Then how do we find her?', 1.2)],
  }),

  // ══ THE RITUAL · six o'clock ═════════════════════════════════════════════════════════════════════
  sh('ritual', stage('lolaflat', 'dawn', push(1.3, 1.45, 1200, 580), [LOLA_DESK({expr: 'focused'}), c(TO, 300, 930, {facing: 'right', outfit: 'home', expr: 'sleepy'})], [{at: 0.8, who: TO, to: 760, dur: 2.2}], {clock: '5:59', radioOn: true}), {
    dev: 'Lola calls the sky every morning at six',
    hud: {day: 8, temp: 15},
    cue: 'mystery',
    action: 'Day 8, 5:59 a.m. Tomás shuffles out in pyjamas. Lola is already at the radio.',
    lines: [N('The next morning, I woke up just before six. Lola was sitting at her radio in the dark.')],
  }),
  sh('ritual-call', stage('lolaflat', 'dawn', push(2.6, 2.8, 1440, 540), [LOLA_DESK({expr: 'focused'}), c(TO, 760, 930, {facing: 'right', outfit: 'home', expr: 'sleepy'})], [], {clock: '6:00', radioOn: true}), {
    action: 'Close on Lola, speaking softly into the microphone, then reaching for her Morse key.',
    lines: [LO('Rosa, Rosa, this is Lola. Over.', 0.8)],
  }),
  sh('ritual-key', sea('key', {taps: [0.2, 0.6, 0.8, 1.4, 1.6, 1.8, 2.4, 2.6]}), {
    action: 'The Morse key, tapping in the lamplight.',
    lines: [N('She called every morning at six. Nobody answered.')],
  }),
  sh('ritual-tomas', stage('lolaflat', 'dawn', push(2.2, 2.35, 760, 560), [LOLA_DESK({expr: 'focused'}), c(TO, 760, 930, {facing: 'right', outfit: 'home', expr: 'focused'})], [{at: 0.6, who: TO, expr: 'sad'}]), {
    action: 'Tomás in the doorway, watching her back.',
    lines: [N('I thought it was how she prayed.', 0.5)],
  }),

  // ══ ON THE AMIHAN (Mum told us later) ═══════════════════════════════════════════════════════════
  sh('ship-where', stage('bridge', 'drift', push(1.6, 1.75, 1100, 560), [ROSA_BR({hold: undefined, pose: 'stand', expr: 'focused'}), CAPT_BR({expr: 'worried'})], [{at: 'l0+0.3', who: CP, look: [1, 0]}]), {
    hud: {place: 'MV AMIHAN · ADRIFT', time: 'DAY 10 · 8:00 PM'},
    action: 'The Amihan’s bridge, dim, frost on the corners of the windows. The captain turns to Rosa.',
    lines: [CA('No GPS, no rudder. Where are we, Rosa?')],
  }),
  sh('ship-stars', stage('bridge', 'drift', push(2.3, 2.45, 1260, 540), [ROSA_BR({hold: undefined, pose: 'stand', expr: 'determined'}), CAPT_BR({expr: 'worried'})]), {
    action: 'Rosa, certain.',
    lines: [RO('Give me a clear night, Captain. The stars will tell us.')],
  }),
  sh('no-horizon', stage('deck', '', push(1.2, 1.35, 1080, 520), [c(RS, 1080, 930, {facing: 'right', outfit: 'home', hold: 'sextant', pose: 'hold', expr: 'focused'})]), {
    dev: 'no horizon for star sights',
    action: 'The bridge wing at night, a sky crowded with stars, and below it only black: no line where the sea meets the sky. Rosa raises her sextant, then lowers it.',
    lines: [N("To measure a star, a navigator needs the horizon. In the dark, there wasn't one.")],
  }),
  sh('bubble', sea('bubble'), {
    science: {text: 'A sextant measures a star’s height above the horizon. Without a visible horizon, a bubble level can stand in for it; aircraft navigators used bubble sextants for decades.', source: 'Bowditch, ‘The American Practical Navigator’ (NGA Pub. 9), ch. 16'},
    beats: ['wow'],
    action: 'Diagram: the sextant with a small spirit level taped to its frame; the bubble centred, the star brought down to the level line; a position cross appears on a chart.',
    lines: [N('So Mum taped a spirit level to her sextant, the way old aircraft navigators did.')],
  }),
  sh('count-roof', stage('manilaroof', '', push(1.2, 1.35, 960, 520), ROOF({tomas: {expr: 'focused', pose: 'pointUp'}, lola: {expr: 'focused'}}), [], {meteors: 6}), {
    dev: 'Lola has Tomás count shooting stars',
    beats: ['wow'],
    hud: {day: 12, temp: 12},
    action: 'Day 12, a clear night on Lola’s roof: water tanks, washing lines, an antenna mast. Shooting stars streak over the dark city. Tomás points; Lola writes in a notebook.',
    lines: [T("Seven. Eight. There's another one!")],
  }),
  sh('count-why', stage('manilaroof', '', push(2.0, 2.15, 950, 520), ROOF({tomas: {expr: 'focused', pose: 'stand', facing: 'right'}, lola: {expr: 'focused'}}), [], {meteors: 4}), {
    action: 'Tomás turns to her.',
    lines: [T('Lola, why do we count shooting stars?')],
  }),
  sh('count-why-b', stage('manilaroof', '', push(2.4, 2.55, 1040, 500), ROOF({tomas: {expr: 'focused', pose: 'stand', facing: 'right'}, lola: {expr: 'focused'}}), [], {meteors: 4}), {
    action: 'Reverse angle on the reply.',
    lines: [LO('Because my eyes are old, and yours are faster.', 0.3)],
  }),
  sh('count-book', sea('logbook', {mode: 'counts'}), {
    dev: 'setup: the counts and the times (most at dawn)',
    action: 'Lola’s notebook: columns of times and tallies. The numbers climb toward dawn: 11 PM 6 · 2 AM 11 · 4 AM 15 · 6 AM 19.',
    lines: [N('She wrote every one down, with the time.')],
  }),

  // ══ DAY 20 · a city that had never been cold ═══════════════════════════════════════════════════
  sh('no-coats', stage('montage', 'bus', push(1.1, 1.2, 900, 600), [c('extra:41', 600, 960, {facing: 'right', outfit: 'cold', breath: true}, 1.4), c('extra:44', 860, 960, {facing: 'left', outfit: 'cold', hold: 'blanket', breath: true}, 1.4), c(TO, 1160, 960, {facing: 'left', outfit: 'cold', breath: true, expr: 'cold'}, 1.4)], [], {dark: 0, noBus: true, chill: true}), {
    chapter: 'Day 20',
    hud: {day: 20, temp: 5},
    action: 'Day 20. The bus stop, at night all day now: people wrapped in bath towels and bedsheets, breath in the air.',
    lines: [N('Manila had never been cold. Nobody owned a coat.')],
  }),
  sh('ocean-heat', sea('oceanheat', {step: 0}), {
    dev: 'the warm sea slows the cold',
    action: 'Diagram: the Philippines in a warm blue sea; the sea glows warm while the land around Asia turns blue-white.',
    lines: [N('But the sea around us was still warm, so the cold came slowly.')],
  }),
  sh('ocean-heat-2', sea('oceanheat', {step: 1}), {
    science: {text: 'The top 2.5–3 metres of the ocean hold as much heat as the entire atmosphere above them, so coasts and islands cool far more slowly than continents.', source: 'NOAA, ‘Ocean heat content’; IPCC AR6 WG1, ch. 9'},
    beats: ['wow'],
    action: 'A column of sky beside a thin slice of sea: the same heat.',
    lines: [N('The top few metres of the ocean hold as much heat as all the air above it.')],
  }),
  sh('ship-six', stage('bridge', 'drift', push(2.0, 2.2, 1280, 540), [ROSA_BR({expr: 'focused', outfit: 'cold', breath: true}), CAPT_BR({expr: 'sad', x: 700, outfit: 'cold', breath: true})], [{at: 'l0+0.4', who: RS, loop: 'tap', dur: 3}], {clock: '6:00'}), {
    hud: {place: 'MV AMIHAN · ADRIFT', time: 'DAY 20 · 6:00 AM'},
    dev: 'Rosa keeps the promise: she is calling too',
    action: 'Six in the morning on the bridge. Rosa thumbs the handset’s talk button in long and short bursts.',
    lines: [N("Out at sea, every morning at six, Mum sent the ship's position in Morse, just as she'd promised.")],
  }),
  sh('ship-food', stage('bridge', 'drift', push(1.8, 1.95, 1100, 560), [ROSA_BR({expr: 'focused', outfit: 'cold', breath: true}), CAPT_BR({expr: 'worried', outfit: 'cold', breath: true})], [{at: 'l0+0.3', who: CP, look: [0.4, 0.5]}]), {
    action: 'The captain with a clipboard of stores.',
    lines: [CA("We've got food for two months, if we're careful.")],
  }),
  sh('ship-food-b', stage('bridge', 'drift', push(2.4, 2.55, 1260, 540), [ROSA_BR({expr: 'focused', outfit: 'cold', breath: true}), CAPT_BR({expr: 'worried', outfit: 'cold', breath: true})], []), {
    action: 'Reverse angle on the reply.',
    lines: [RO("Then we'll be careful.", 0.3)],
  }),
  sh('drift-map', sea('drift', {to: 0.75}), {
    science: {text: 'East of the Philippines the North Equatorial Current flows west, then splits; its northern branch turns north along Luzon into the Kuroshio.', source: 'NOAA Ocean Explorer; Qiu & Lukas, Journal of Geophysical Research (1996)'},
    action: 'Map: the Philippine Sea. A dashed line, the planned route; a red cross, the storm; a dotted drift line creeping west toward Luzon, then bending north.',
    lines: [N('The current was carrying them slowly toward Luzon, and then north, into colder water.')],
  }),
  sh('morse-lesson', stage('lolaflat', 'cold', push(1.7, 1.85, 860, 580), [c(LA, 760, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 960, 930, {pose: 'sitChair', seat: 'chair', facing: 'left', outfit: 'cold', breath: true, expr: 'focused'})], [], {tableKey: true}), {
    dev: 'Lola teaches Tomás Morse',
    hud: {day: 20, temp: 5},
    action: 'Evening, coats on indoors. Lola and Tomás at the kitchen table, a spare Morse key between them.',
    lines: [LO('Short is a dot. Long is a dash. Now tap your name.')],
  }),
  sh('morse-name', sea('key', {taps: [0.2, 0.9, 1.1, 1.3, 1.9, 2.1], letters: 'T O M A S'}), {
    beats: ['heart'],
    action: 'Tomás’s finger on the key; the letters of his name appear above it as he taps.',
    lines: [N('She taught me Morse every night. She said Mum learned it before she could read.')],
  }),
  sh('morse-why', stage('lolaflat', 'cold', push(2.3, 2.45, 960, 560), [c(LA, 760, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}), c(TO, 960, 930, {pose: 'sitChair', seat: 'chair', facing: 'left', outfit: 'cold', breath: true, expr: 'sad'})], [], {tableKey: true}), {
    action: 'Tomás stops tapping.',
    lines: [T('Why learn Morse, if nobody ever answers?')],
  }),
  sh('morse-why-b', stage('lolaflat', 'cold', push(2.5, 2.65, 760, 560), [c(LA, 760, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}), c(TO, 960, 930, {pose: 'sitChair', seat: 'chair', facing: 'left', outfit: 'cold', breath: true, expr: 'sad'})], [], {tableKey: true}), {
    action: 'Reverse angle on the reply.',
    lines: [LO('Because the radio is quiet, and we have time.', 0.3)],
  }),
  sh('tv-loud', stage('lolaflat', 'cold', push(1.3, 1.45, 620, 600), [c(LA, 560, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'cold', expr: 'focused'}), c(TO, 860, 930, {facing: 'left', outfit: 'cold', expr: 'uneasy', pose: 'handsOnHead'})], [], {tvOn: true, tvLoud: true}), {
    beats: ['laugh'],
    dev: 'setup: Lola’s hearing',
    action: 'Lola watching the news at full volume, the TV rattling. Tomás, hands over his ears.',
    lines: [T('Lola! The TV!'), LO('What?', 0.3)],
  }),
  sh('hearing', stage('lolaflat', 'cold', push(1.8, 1.95, 700, 560), [c(LA, 560, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'cold', expr: 'smile'}), c(TO, 860, 930, {facing: 'left', outfit: 'cold', expr: 'alert'})], [{at: 0.4, who: TO, expr: 'smile'}, {at: 0.8, who: LA, look: [1, 0]}], {tvOn: true}), {
    action: 'Lola turns it down, sheepish.',
    lines: [N('Thirty years of headphones. Her ears were older than she was.')],
  }),

  // ══ DAY 30 · underground ═════════════════════════════════════════════════════════════════════════
  sh('basement', stage('basement', '', move([1.0, 960, 560], [1.1, 1040, 560]), [LOLA_B({expr: 'focused', hold: undefined}), TOM_B({expr: 'focused'}), c('extra:12', 420, 940, {facing: 'right', outfit: 'cold', pose: 'sit'}), c('extra:23', 560, 940, {facing: 'left', outfit: 'cold', pose: 'sit'}), c('extra:302', 700, 940, {facing: 'left', outfit: 'cold'})]), {
    dev: 'the building moves underground',
    chapter: 'Day 30',
    hud: {day: 30, temp: -2},
    cue: 'warm',
    action: 'Day 30. The building’s basement car park: families on mats between the cars, string lights, a rice cooker steaming. Lola’s radio on a table by a pillar.',
    lines: [N('By Day 30 it was below freezing, and the whole building moved down into the car park.')],
  }),
  sh('basement-warm', stage('basement', '', push(1.5, 1.6, 600, 560), [LOLA_B({expr: 'focused', hold: undefined}), TOM_B({expr: 'smile'}), c('extra:12', 420, 940, {facing: 'right', outfit: 'cold', pose: 'sit', expr: 'smile'}), c('extra:23', 560, 940, {facing: 'left', outfit: 'cold', pose: 'sit', expr: 'smile'}), c('extra:302', 700, 940, {facing: 'left', outfit: 'cold', expr: 'laugh'})]), {
    science: {text: 'A few metres underground the temperature stays close to the yearly average, whatever the weather above.', source: 'US Department of Energy, ‘Geothermal Heat Pumps’'},
    callout: {text: '+10°C', at: 'l0+0.8'},
    action: 'Neighbours sharing rice from one pot; a small child laughing.',
    lines: [N('A few metres underground, it stays about ten degrees, Sun or no Sun.')],
  }),
  sh('cable-run', stage('stairs', 'climb', move([1.2, 300, 580], [1.25, 160, 540]), [c(TO, 420, 940, {pose: 'carry', hold: 'cable', facing: 'left', outfit: 'cold', breath: true, expr: 'determined'})], [{at: 0, who: TO, to: [60, 800], dur: 3.6}, {at: 0.4, who: TO, loop: 'pant', dur: 3}]), {
    beats: ['heart'],
    action: 'A dark stairwell. Tomás climbs with a heavy coil of antenna cable over his shoulder, paying it out behind him.',
    lines: [N("Lola's radio came too. I ran its cable up twelve floors to the antenna on the roof.")],
  }),
  sh('basement-six', stage('basement', 'dawn', push(1.4, 1.55, 1200, 580), [LOLA_B({expr: 'focused'}), TOM_B({expr: 'sleepy'}), c('extra:12', 420, 940, {facing: 'right', outfit: 'cold', pose: 'sit'}), c('extra:23', 560, 940, {facing: 'right', outfit: 'cold', pose: 'sit'})], [], {radioOn: true}), {
    hud: {day: 31, temp: -3},
    action: 'Six in the morning in the car park: the neighbours hush as Lola starts calling.',
    lines: [N('Every morning at six, the whole car park went quiet so Lola could listen.')],
  }),
  sh('missing-news', sc('news', {v: 'anchor', headline: 'SHIPS MISSING AT SEA', ticker: 'MORE THAN 200 SHIPS UNACCOUNTED FOR WORLDWIDE · NO SATELLITE CONTACT SINCE DAY 0 · FAMILIES ASKED TO WAIT FOR NEWS'}), {
    dev: 'two hundred ships missing',
    hud: {day: 35, temp: -5},
    cue: 'news',
    action: 'Day 35. The news on a phone in the car park.',
    lines: [AN('More than two hundred ships are still missing at sea.')],
  }),

  // ══ DAY 48 · the chirp, and the end of hope ═══════════════════════════════════════════════════
  sh('chirp', stage('basement', 'dawn', push(2.0, 2.2, 1200, 580), [LOLA_B({expr: 'focused'}), TOM_B({expr: 'sleepy'})], [{at: 1.4, who: TO, expr: 'alert', look: [1, -0.1]}], {radioOn: true, chirpAt: 1.3}), {
    dev: 'Tomás hears a chirp',
    beats: ['loop'],
    chapter: 'Day 48',
    hud: {day: 48, temp: -9},
    min: 3.6,
    action: 'Day 48, six in the morning. Half asleep beside Lola, Tomás hears a tiny chirp from the speaker, like a cricket. Lola doesn’t react.',
    lines: [N('On Day 48, at six in the morning, I heard a tiny chirp.')],
  }),
  sh('chirp-static', stage('basement', 'dawn', push(2.4, 2.55, 1150, 560), [LOLA_B({expr: 'focused'}), TOM_B({expr: 'uneasy'})], [{at: 'l0+0.6', who: TO, look: [0.6, 0.4]}], {radioOn: true}), {
    action: 'Tomás looks at Lola; she is still listening, unmoved. He lets it go.',
    lines: [N("Lola didn't seem to hear it, so I decided it was static.")],
  }),
  sh('company', stage('basement', '', push(1.8, 1.95, 1180, 560), [LOLA_B({hold: 'phone', pose: 'phoneEar', expr: 'focused'}), TOM_B({expr: 'worried'})], [{at: 'l0+1.0', who: LA, expr: 'sad'}]), {
    dev: 'the ship is listed as lost',
    timeJump: true,
    action: 'That afternoon. Lola on the phone with the shipping company. Tomás can hear it.',
    lines: [CL("Mrs. Reyes, I'm so sorry. We've listed the Amihan as lost.")],
  }),
  sh('stop', stage('basement', '', push(2.2, 2.35, 1120, 540), [LOLA_B({hold: 'phone', pose: 'hold', expr: 'sad'}), TOM_B({pose: 'stand', expr: 'sad'})], [{at: 0.3, who: LA, put: 'table', prop: 'phone'}], {items: [{prop: 'phone', x: 1330, y: 760, from: 0.7}]}), {
    cue: 'tension',
    action: 'Tomás on his feet, tears in his eyes.',
    lines: [T("Lola, stop calling her! She can't hear you!")],
  }),
  sh('stop-2', stage('basement', '', push(2.6, 2.75, 1100, 520), [LOLA_B({expr: 'sad'}), TOM_B({pose: 'stand', expr: 'sad'})], [], {items: [{prop: 'phone', x: 1330, y: 760}]}), {
    action: 'His voice breaks.',
    lines: [T('Without the Sun, the radio reaches nobody. You said so yourself!')],
  }),
  sh('not-all', stage('basement', '', push(2.6, 2.8, 1260, 520), [LOLA_B({expr: 'determined'}), TOM_B({pose: 'stand', expr: 'sad'})], [{at: 'l0+0.3', who: LA, look: [-1, -0.3]}], {items: [{prop: 'phone', x: 1330, y: 760}]}), {
    twist: 2,
    action: 'Lola looks up at him, calm.',
    lines: [LO("No. I said the sky's mirror fades. Not every mirror.")],
  }),
  sh('come', stage('basement', '', push(2.2, 2.35, 1200, 540), [LOLA_B({expr: 'determined', pose: 'stand', seat: undefined}), TOM_B({pose: 'stand', expr: 'uneasy'})], [], {items: [{prop: 'phone', x: 1330, y: 760}]}), {
    action: 'She stands and pulls on her coat.',
    lines: [LO('Come up to the roof. I want to show you something.')],
  }),

  // ══ THE ROOF · the reveal ═════════════════════════════════════════════════════════════════════════
  sh('reveal-roof', stage('manilaroof', 'cold', push(1.2, 1.35, 960, 500), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'sad', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'focused', pose: 'pointUp'}}), [], {meteors: 5}), {
    cue: 'wonder',
    action: 'The roof, frost on the water tanks. Shooting stars cross the sky. Lola points up.',
    lines: [LO('Every shooting star is a grain of dust burning up, a hundred kilometres above us.')],
  }),
  sh('reveal-trail', sea('meteor'), {
    science: {text: 'Meteors burning up about 100 km high leave trails of ionised gas that reflect VHF radio for a fraction of a second to a few seconds; radio amateurs use this "meteor scatter" for contacts up to about 2,000 km.', source: 'ARRL, ‘Meteor Scatter’; Lundström, ‘Meteor scatter communication’, ITU-R P.843'},
    twist: 1,
    beats: ['wow'],
    action: 'Diagram: Manila on one side of the Earth’s curve, the drifting ship 750 km away below the horizon. A meteor streaks in and leaves a glowing trail; for a moment, a radio wave bounces off the trail from one to the other.',
    lines: [LO('For a second, its trail reflects radio, like a mirror. Two radios far apart can hear each other.')],
  }),
  sh('reveal-count', stage('manilaroof', 'cold', push(2.0, 2.15, 950, 500), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'surprised', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'smile'}}), [], {meteors: 4}), {
    action: 'Tomás turns to her, eyes wide.',
    lines: [T("That's why we count them.")],
  }),
  sh('reveal-count-b', stage('manilaroof', 'cold', push(2.4, 2.55, 1040, 480), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'surprised', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'smile'}}), [], {meteors: 4}), {
    action: 'Reverse angle on the reply.',
    lines: [LO('Yes. And most of them fall at dawn.', 0.3)],
  }),
  sh('reveal-dawn', sea('dawn'), {
    science: {text: 'Meteor rates peak around 6 a.m. local time, when the observer’s side of Earth faces forward along its orbit and sweeps up the most dust.', source: 'American Meteor Society, ‘Meteor FAQs’; NASA Meteoroid Environment Office'},
    action: 'Diagram from above: Earth moving along its orbit like a car in rain; the morning side, at six o’clock, faces forward and catches the most dust.',
    lines: [N('At six in the morning, our side of the Earth faces forward, into the dust, like a windscreen in the rain.')],
  }),
  sh('reveal-six', stage('manilaroof', 'cold', push(2.6, 2.8, 900, 480), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'awe', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'focused'}}), [], {meteors: 3}), {
    twist: 2,
    action: 'Tomás works it out.',
    lines: [T("Six o'clock. That's why you made Mum promise to call at six.")],
  }),
  sh('reveal-why', stage('manilaroof', 'cold', push(2.4, 2.55, 980, 480), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'focused', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'sad'}}), [{at: 0.3, who: TO, expr: 'worried'}], {meteors: 3}), {
    action: 'Then the doubt comes back.',
    lines: [T("Then why haven't we heard her?")],
  }),
  sh('reveal-why-b', stage('manilaroof', 'cold', push(2.6, 2.75, 1040, 470), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'worried', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'sad'}}), [{at: 'l0+0.3', who: LA, look: [-1, 0.2]}, {at: 'l0+2.2', who: LA, pose: 'pointUp'}], {meteors: 3}), {
    action: 'Reverse angle on the reply.',
    lines: [LO("Because her radio is weak, and she's far away. We need far more shooting stars.", 0.3)],
  }),
  sh('reveal-perseids', stage('manilaroof', 'cold', push(2.6, 2.75, 1040, 470), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'focused', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'focused'}}), [{at: 0.4, who: LA, expr: 'smile'}, {at: 'l0+0.8', who: LA, pose: 'pointUp'}], {meteors: 3}), {
    action: 'Lola smiles for the first time in weeks.',
    lines: [LO('On the twelfth of August, the Earth flies through a river of comet dust.')],
  }),
  sh('perseids-diagram', sea('perseids'), {
    dev: 'the Perseids are coming',
    science: {text: 'Every year around 12–13 August Earth crosses the debris stream of comet Swift–Tuttle: the Perseids, typically up to about 100 meteors an hour at the peak under dark skies.', source: 'NASA, ‘Perseids’; International Meteor Organization'},
    beats: ['wow'],
    action: 'Diagram: Earth’s orbit crossing a river of dust shed by a comet; the date 12 AUGUST where they meet.',
    lines: [N('The Perseids. Every August, about a hundred shooting stars an hour.')],
  }),
  sh('ten-days', stage('manilaroof', 'cold', push(2.2, 2.35, 900, 480), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'determined', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'focused'}}), [], {meteors: 2}), {
    action: 'Tomás counts on his fingers.',
    lines: [T("That's only ten days away.")],
  }),
  sh('confess', stage('manilaroof', 'cold', push(2.8, 3.0, 900, 470), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'uneasy', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'focused'}}), [{at: 'l0+1.2', who: LA, expr: 'surprised'}], {meteors: 2}), {
    dev: 'Tomás admits he heard the chirp',
    action: 'Quietly.',
    lines: [T('Lola, this morning I heard a chirp. I thought it was static.')],
  }),
  sh('you-listen', stage('manilaroof', 'cold', push(2.8, 3.0, 1040, 470), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'focused', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'determined'}}), [], {meteors: 2}), {
    action: 'Lola takes his hands.',
    lines: [LO('Then your ears are better than mine. From now on, you listen.')],
  }),
  sh('why-not-tell', stage('manilaroof', 'cold', push(2.4, 2.6, 960, 480), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'sad', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'sad'}}), [], {meteors: 2}), {
    midroll: true,
    action: 'Under the sky, the question that has been hurting.',
    lines: [T("Why didn't you tell me?")],
  }),
  sh('why-not-tell-b', stage('manilaroof', 'cold', push(2.8, 2.95, 1040, 470), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'sad', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'sad'}}), [], {meteors: 2}), {
    action: 'Reverse angle on the reply.',
    lines: [LO("Because it was only a little hope. I didn't want to use up yours.", 0.4)],
  }),

  // ══ TEN DAYS ══════════════════════════════════════════════════════════════════════════════════════
  sh('practice', stage('basement', '', push(1.9, 2.05, 1240, 560), [LOLA_B({expr: 'smile', hold: undefined}), TOM_B({expr: 'focused', hold: 'list', pose: 'hold'})], [], {radioOn: true, tableKey: true}), {
    dev: 'Tomás trains his ear',
    hud: {day: 52, temp: -10},
    cue: 'warm',
    action: 'Night after night at the radio table: Lola tapping fast Morse, Tomás writing the letters down.',
    lines: [N('For ten days, I practised Morse until I could hear it in my sleep.')],
  }),
  sh('ship-55', stage('bridge', 'drift', push(2.1, 2.3, 1280, 540), [ROSA_BR({expr: 'sad', outfit: 'cold', breath: true}), CAPT_BR({expr: 'sad', x: 700, outfit: 'cold', breath: true})], [{at: 0.4, who: RS, loop: 'tap', dur: 3}], {clock: '6:00'}), {
    beats: ['heart'],
    hud: {place: 'MV AMIHAN · ADRIFT', time: 'DAY 55 · 6:00 AM'},
    action: 'On the frozen bridge of the Amihan, coats and breath. Rosa, thinner, still keying the handset at six.',
    lines: [N('Out at sea, Mum kept calling.')],
  }),

  // ══ DAY 58 · the night of the Perseids ═══════════════════════════════════════════════════════════
  sh('perseids-sky', stage('manilaroof', 'perseids', move([1.0, 960, 460], [1.1, 960, 420]), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'awe'}, lola: {outfit: 'cold', breath: true, expr: 'awe', hold: undefined, pose: 'lookUp'}}), [], {meteors: 40}), {
    dev: 'the night of the Perseids',
    chapter: 'Day 58',
    hud: {day: 58, temp: -12},
    cue: 'wonder',
    letterbox: true,
    beats: ['wow'],
    action: 'The night of 12 August. Over the frozen city, meteors pour out of one point in the sky, dozens at a time.',
    lines: [N('On the night of the twelfth of August, the sky was full of falling stars.')],
  }),
  sh('perseids-crowd', stage('manilaroof', 'perseids', push(1.3, 1.4, 900, 480), [...ROOF({tomas: {outfit: 'cold', breath: true, expr: 'laugh', pose: 'cheer'}, lola: {outfit: 'cold', breath: true, expr: 'smile', hold: undefined, pose: 'lookUp'}}), c('extra:12', 420, 900, {facing: 'right', outfit: 'cold', pose: 'lookUp', breath: true}), c('extra:23', 560, 900, {facing: 'right', outfit: 'cold', pose: 'pointUp', breath: true})], [], {meteors: 110}), {
    letterbox: true,
    action: 'Neighbours have come up to see; someone gasps at every one.',
    lines: [N('With no sunlight and no moonlight, nobody had ever seen them so clearly.')],
  }),
  sh('radio-time', stage('manilaroof', 'perseids', push(2.4, 2.55, 980, 480), ROOF({tomas: {outfit: 'cold', breath: true, expr: 'alert', pose: 'stand', facing: 'right'}, lola: {outfit: 'cold', breath: true, expr: 'determined', hold: undefined}}), [{at: 'l0+0.4', who: LA, look: [-1, 0.2]}, {at: 'l0+1.2', who: TO, expr: 'focused'}], {meteors: 90}), {
    letterbox: true,
    action: 'Lola checks her watch.',
    lines: [LO("It's half past five. Time to go down.")],
  }),
  sh('pings-wait', stage('basement', 'dawn', push(1.8, 2.0, 1240, 560), [LOLA_B({expr: 'focused', hold: undefined}), TOM_B({expr: 'focused', hold: 'list', pose: 'hold'})], [], {radioOn: true, clock: '5:45'}), {
    hud: {place: 'MANILA', time: 'DAY 59 · 5:45 AM'},
    cue: 'tension',
    action: 'The car park before dawn. Tomás at the radio with a pencil and the logbook, Lola beside him, the neighbours asleep.',
    lines: [N('We sat by the radio and listened to the hiss.')],
  }),
  sh('ping-1', sea('radio', {pings: [0.9]}), {
    dev: 'the first ping',
    beats: ['loop'],
    min: 2.6,
    action: 'The radio’s signal meter. Hiss. Then the needle jumps: a short bright chirp of tones.',
    lines: [N('At two minutes past six, a chirp.', 0.4)],
  }),
  sh('ping-r', stage('basement', 'dawn', push(2.6, 2.8, 1180, 540), [LOLA_B({expr: 'focused', hold: undefined}), TOM_B({expr: 'surprised', hold: 'list', pose: 'hold'})], [{at: 'l0+0.6', who: LA, expr: 'alert'}], {radioOn: true}), {
    action: 'Tomás, already writing.',
    lines: [T("That's an R!")],
  }),
  sh('ping-more', sea('logbook', {mode: 'pings', from: 0, to: 0.35}), {
    action: 'The logbook: scattered fragments as the pings come in: R . . . O S . . . A M I . . .',
    lines: [N('Then more. Half a letter here, three letters there.')],
  }),
  sh('ping-lola', stage('basement', 'dawn', push(2.6, 2.8, 1300, 540), [LOLA_B({expr: 'determined', hold: undefined}), TOM_B({expr: 'focused', hold: 'list', pose: 'hold'})], [{at: 'l0+0.4', who: LA, look: [-1, 0.3]}], {radioOn: true}), {
    action: 'Lola, very calm.',
    lines: [LO('Write down everything, even half letters. She will keep repeating it.')],
  }),
  sh('ping-rosa', stage('basement', 'dawn', push(2.9, 3.1, 1120, 520), [LOLA_B({expr: 'focused', hold: undefined}), TOM_B({expr: 'surprised', hold: 'list', pose: 'hold'})], [{at: 'l0+0.3', who: TO, expr: 'laugh'}, {at: 'l0+0.9', who: LA, expr: 'relieved'}], {radioOn: true}), {
    twist: 4,
    beats: ['heart'],
    action: 'Tomás reads the line he has pieced together.',
    lines: [T("R, O, S, A. It's Mum!")],
  }),
  sh('ping-pos', sea('logbook', {mode: 'pings', from: 0.35, to: 0.75}), {
    dev: 'the ship’s position',
    action: 'More fragments fit together: AMIHAN · 17 50 N · 127 10 E.',
    lines: [T('Seventeen degrees fifty north. A hundred and twenty-seven, ten east.')],
  }),
  sh('ping-safe', sea('logbook', {mode: 'pings', from: 0.75, to: 1}), {
    action: 'The last words: RUDDER GONE · ALL SAFE.',
    lines: [T('Rudder gone. All safe.', 0.6)],
  }),
  sh('lola-reply', stage('basement', 'dawn', push(2.6, 2.8, 1400, 540), [LOLA_B({expr: 'smile', hold: undefined}), TOM_B({expr: 'relieved', hold: 'list', pose: 'hold'})], [{at: 0.5, who: LA, expr: 'determined'}, {at: 'l0+0.6', who: LA, loop: 'tap', dur: 2.4}], {radioOn: true}), {
    action: 'Lola keys her answer, again and again.',
    lines: [LO('Now we answer. R, R, R. It means received.')],
  }),
  sh('ship-hears', stage('bridge', 'drift', push(2.2, 2.4, 1240, 540), [ROSA_BR({expr: 'surprised', outfit: 'cold', breath: true}), CAPT_BR({expr: 'surprised', x: 760, outfit: 'cold', breath: true})], [{at: 'l0+0.9', who: RS, expr: 'laugh'}, {at: 'l0+1.0', who: CP, expr: 'relieved'}], {clock: '6:26', chirpAt: 0.3}), {
    dev: 'Rosa knows they were heard',
    hud: {place: 'MV AMIHAN · ADRIFT', time: 'DAY 59 · 6:26 AM'},
    beats: ['heart'],
    action: 'On the Amihan’s bridge, three faint chirps from the radio: R, R, R. Rosa freezes, then cries out.',
    lines: [RO('Captain! They heard us!')],
  }),
  sh('call-joy', stage('basement', 'dawn', push(2.2, 2.35, 1200, 560), [LOLA_B({hold: 'phone', pose: 'phoneEar', expr: 'determined'}), TOM_B({expr: 'focused', hold: 'list', pose: 'hold'})], [], {radioOn: true}), {
    action: 'Lola on the phone, the logbook in Tomás’s hands.',
    lines: [LO("Joy, it's Pilar. I have a position. It's one hour old.")],
  }),
  sh('call-joy-2', stage('basement', 'dawn', push(2.6, 2.75, 1260, 540), [LOLA_B({hold: 'phone', pose: 'phoneEar', expr: 'determined'}), TOM_B({expr: 'focused', hold: 'list', pose: 'hold'})], [], {radioOn: true}), {
    action: 'She reads it out, then the correction only an old hand would think of.',
    lines: [LO('Seventeen fifty north, one twenty-seven ten east. Then add the current.')],
  }),
  sh('joy-sails', stage('coastguard', '', push(1.9, 2.05, 1100, 540), [c(JY, 1100, 930, {facing: 'left', hold: 'phone', pose: 'phoneEar', expr: 'determined'})], [{at: 'l0+1.4', who: JY, look: [-1, 0.2]}], {plot: true}), {
    dev: 'the coast guard sails',
    action: 'Commander Santos at the chart, phone at her ear, marking a cross and an arrow north-west.',
    lines: [OF('Ten kilometres a day, north-west. We sail within the hour.')],
  }),
  sh('cg-ship', sea('rescue', {step: 0}), {
    action: 'A white coast-guard ship slips out of the dark harbour, every light blazing.',
    lines: [N('The coast guard sailed that morning.')],
  }),
  sh('rescue', sea('rescue', {step: 1}), {
    dev: 'the Amihan is found',
    chapter: 'Day 60',
    hud: {day: 60, temp: -12},
    beats: ['heart'],
    action: 'Out at sea: a searchlight sweeps the black water and finds the Amihan; a red flare climbs from her deck.',
    lines: [N("On Day 60, their searchlight found the Amihan, just eight kilometres from Mum's position.")],
  }),
  sh('rescue-deck', stage('deck', 'rescued', push(1.6, 1.75, 1080, 520), [c(RS, 1080, 930, {facing: 'right', outfit: 'cold', breath: true, pose: 'wave', expr: 'laugh'})]), {
    action: 'Rosa on the bridge wing in the white glare of the searchlight, waving both arms.',
    lines: [RO("We're here! We're all here!")],
  }),

  // ══ DAY 62 · home ═════════════════════════════════════════════════════════════════════════════════
  sh('pier', stage('pier', '', move([1.0, 960, 560], [1.1, 1000, 560]), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}), c(TO, 900, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}), c('extra:51', 300, 940, {facing: 'right', outfit: 'cold'}), c('extra:58', 440, 940, {facing: 'right', outfit: 'cold'})]), {
    chapter: 'Day 62',
    hud: {day: 62, temp: -14},
    cue: 'warm',
    action: 'Day 62. The coast-guard pier under floodlights, the white ship alongside. A gangway. Lola and Tomás wait at the front of a small crowd.',
    lines: [N('Two days later, the coast guard brought her home.')],
  }),
  sh('hug', stage('pier', '', push(1.6, 1.8, 1080, 600), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}), c(TO, 900, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}), c(RS, 1500, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'laugh'})], [{at: 0, who: RS, to: 1000, gait: 'run', dur: 1.2}, {at: 0.6, who: TO, to: 940, dur: 0.6}, {at: 0.4, who: TO, expr: 'laugh'}, {at: 0.8, who: LA, expr: 'relieved'}, {at: 1.3, who: RS, pose: 'hug'}, {at: 1.3, who: TO, pose: 'hug'}]), {
    dev: 'Rosa is home',
    beats: ['heart'],
    min: 3.6,
    action: 'Rosa runs down the gangway and catches Tomás up in her arms.',
    lines: [RO('Tomás! Look at you!', 0.6)],
  }),
  sh('why-six', stage('pier', '', push(2.2, 2.4, 880, 560), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'})], [{at: 'l0+0.4', who: RS, look: [-1, 0]}]), {
    action: 'Rosa, an arm still round Tomás, turns to her mother.',
    lines: [RO("Ma, why six o'clock? I never understood.")],
  }),
  sh('most-fall', stage('pier', '', push(2.6, 2.8, 780, 540), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'})]), {
    dev: 'why six o’clock',
    action: 'Lola, very pleased with herself.',
    lines: [LO("Because that's when the most shooting stars fall.")],
  }),
  sh('bounced', stage('pier', '', push(2.4, 2.6, 980, 540), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'surprised'})]), {
    beats: ['laugh'],
    action: 'Rosa stares at her.',
    lines: [RO('You bounced my Morse off shooting stars?')],
  }),
  sh('bounced-b', stage('pier', '', push(2.6, 2.8, 760, 540), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'surprised'})]), {
    action: 'Reverse angle on the reply.',
    lines: [LO('Thirty years at the coast guard. You pick things up.', 0.3)],
  }),
  sh('he-heard', stage('pier', '', push(2.2, 2.35, 880, 560), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'})], [{at: 'l0+0.4', who: LA, look: [1, 0.3]}]), {
    dev: 'credit: Tomás heard her',
    action: 'Lola nods at Tomás.',
    lines: [LO('But it was Tomás who heard you. My ears are too old.')],
  }),
  sh('every-letter', stage('pier', '', push(2.8, 3.0, 980, 540), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'relieved'})], [{at: 'l0+0.3', who: RS, look: [-0.6, 0.6]}]), {
    action: 'Rosa looks down at her son.',
    lines: [RO('You heard me?')],
  }),
  sh('every-letter-b', stage('pier', '', push(3.0, 3.15, 920, 560), [c(LA, 760, 940, {facing: 'right', outfit: 'cold', breath: true, expr: 'smile'}), c(TO, 940, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}), c(RS, 1020, 940, {facing: 'left', outfit: 'cold', breath: true, expr: 'relieved'})], []), {
    action: 'Reverse angle on the reply.',
    lines: [T('Every letter, Mum.', 0.6)],
  }),

  // ══ DAY 365 · 1:52 PM ═════════════════════════════════════════════════════════════════════════════
  sh('day300', sc('news', {v: 'anchor', headline: 'WILL THE SUN COME BACK?', ticker: 'SCIENTISTS: THE OBJECT IN THE BEAM COULD STOP IN 65 DAYS · THEY HOPE THE SUN WILL RETURN WHEN IT DOES'}), {
    dev: 'the Sun may return on Day 365',
    chapter: 'Day 300',
    hud: {day: 300, temp: -40},
    cue: 'news',
    timeJump: true,
    action: 'Day 300. The news, on a phone in the car park.',
    lines: [N('On Day 300, the news said the Sun might come back on Day 365.')],
  }),
  sh('bus-wait', stage('montage', 'bus', push(1.2, 1.3, 960, 640), [c(LA, 760, 960, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}, 1.4), c(TO, 1000, 960, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}, 1.4), c(RS, 1200, 960, {facing: 'left', outfit: 'cold', breath: true, expr: 'focused'}, 1.4)], [], {dark: 0, noBus: true, frozen: true}), {
    chapter: 'Day 365',
    hud: {place: 'MANILA', time: 'DAY 365 · 1:40 PM'},
    action: 'Day 365. The same bus stop, frozen hard. Tomás, Lola and Rosa in every layer they own.',
    lines: [N('So on Day 365, we went back to the bus stop where I had watched it go.')],
  }),
  sh('bus-when', stage('montage', 'bus', push(1.8, 1.95, 900, 600), [c(LA, 760, 960, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}, 1.4), c(TO, 1000, 960, {facing: 'left', outfit: 'cold', breath: true, expr: 'focused'}, 1.4), c(RS, 1200, 960, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}, 1.4)], [], {dark: 0, noBus: true, frozen: true}), {
    action: 'Lola, to Tomás.',
    lines: [LO('What time was it, when it went out?')],
  }),
  sh('bus-when-b', stage('montage', 'bus', push(2.2, 2.35, 880, 600), [c(LA, 760, 960, {facing: 'right', outfit: 'cold', breath: true, expr: 'focused'}, 1.4), c(TO, 1000, 960, {facing: 'left', outfit: 'cold', breath: true, expr: 'focused'}, 1.4), c(RS, 1200, 960, {facing: 'left', outfit: 'cold', breath: true, expr: 'smile'}, 1.4)], [], {dark: 0, noBus: true, frozen: true}), {
    action: 'Reverse angle on the reply.',
    lines: [T('1:52.', 0.2), LO('Then we wait for 1:52.', 0.3)],
  }),
  sh('sun-back', stage('montage', 'bus', push(1.2, 1.3, 960, 700), [c(LA, 760, 960, {facing: 'right', outfit: 'cold', breath: true, pose: 'lookUp', expr: 'focused'}, 1.4), c(TO, 1000, 960, {facing: 'right', outfit: 'cold', breath: true, pose: 'lookUp', expr: 'awe'}, 1.4), c(RS, 1200, 960, {facing: 'left', outfit: 'cold', breath: true, pose: 'lookUp', expr: 'awe'}, 1.4)], [{at: 0.8, who: TO, pose: 'cheer', expr: 'laugh'}, {at: 0.9, who: RS, expr: 'laugh'}, {at: 1.0, who: LA, expr: 'smile'}], {dark: 0, sunAt: 0.3, noBus: true, frozen: true}), {
    dev: 'the Sun comes back',
    hud: {place: 'MANILA', time: '1:52 PM'},
    beats: ['heart'],
    cue: 'triumph',
    min: 2.6,
    action: '1:52. The Sun blazes back. Tomás throws his arms up, laughing in the light, exactly where it went out.',
    lines: [T('There it is!')],
  }),
  sh('there-you-are', stage('montage', 'bus', push(2.0, 2.15, 800, 600), [c(LA, 760, 960, {facing: 'right', outfit: 'cold', breath: true, pose: 'lookUp', expr: 'smile'}, 1.4), c(TO, 1000, 960, {facing: 'right', outfit: 'cold', breath: true, pose: 'cheer', expr: 'laugh'}, 1.4), c(RS, 1200, 960, {facing: 'left', outfit: 'cold', breath: true, pose: 'lookUp', expr: 'laugh'}, 1.4)], [], {dark: 0, sunAt: 0, noBus: true, frozen: true}), {
    action: 'Lola squints up at the Sun, like an old friend who is late.',
    lines: [LO('Ah. There you are.', 0.6)],
  }),
  sh('why-back', stage('montage', 'bus', push(1.1, 1.2, 960, 640), [c(LA, 760, 960, {facing: 'right', outfit: 'cold', pose: 'lookUp', expr: 'smile'}, 1.4), c(TO, 1000, 960, {facing: 'right', outfit: 'cold', pose: 'hug', expr: 'smile'}, 1.4), c(RS, 1080, 960, {facing: 'left', outfit: 'cold', pose: 'hug', expr: 'smile'}, 1.4)], [], {dark: 0, sunAt: 0, noBus: true, frozen: true}), {
    action: 'The three of them in the sunlight at the frozen bus stop.',
    lines: [N('Why it went out, and why it came back, is someone else’s story.')],
  }),
  sh('roof-coda', stage('manilaroof', 'summer', push(1.2, 1.35, 960, 500), [c(TO, 760, 900, {facing: 'right', outfit: 'home', pose: 'pointUp', expr: 'laugh'}), c(RS, 900, 900, {facing: 'right', outfit: 'home', pose: 'lookUp', expr: 'smile'}), c(LA, 1060, 900, {facing: 'left', outfit: 'home', hold: 'list', pose: 'hold', expr: 'smile'})], [], {meteors: 12}), {
    hud: {place: 'MANILA', time: '12 AUGUST, EVERY YEAR'},
    timeJump: true,
    thread: 'later',
    cue: 'warm',
    action: 'A warm August night, years later. The roof, summer clothes, shooting stars. Tomás points; Rosa counts out loud; Lola writes them down.',
    lines: [N('Every year on the twelfth of August, we go up on the roof and count shooting stars.')],
  }),
  sh('loudest', stage('manilaroof', 'summer', push(1.9, 2.05, 900, 480), [c(TO, 760, 900, {facing: 'right', outfit: 'home', pose: 'lookUp', expr: 'smile'}), c(RS, 900, 900, {facing: 'right', outfit: 'home', pose: 'pointUp', expr: 'laugh'}), c(LA, 1060, 900, {facing: 'left', outfit: 'home', hold: 'list', pose: 'hold', expr: 'laugh'})], [], {meteors: 10}), {
    beats: ['laugh'],
    action: 'Rosa points and shouts at every one.',
    thread: 'later',
    lines: [N('Mum counts the loudest.', 0.8)],
  }),
  sh('end', sc('end'), {
    cue: 'end',
    action: 'End screen.',
    lines: [N('If the sky went dark, who would you be calling? Tell us in the comments.', 1.0)],
  }),
];

// ── Acting: small, motivated movements for every held moment (no automatic gestures; docs/00 A5) ──
const ACTS: Record<string, Record<string, unknown>[]> = {
  'lola-job': [{at: 0.8, who: LA, look: [-0.4, -0.8]}, {at: 2.6, who: TO, look: [0.6, -0.6]}],
  'reach-ship': [{at: 'l0+0.4', who: LA, look: [-1, 0.2]}],
  'reach-ship-b': [{at: 'l0+0.2', who: LA, pose: 'sitPoint'}, {at: 'l0+2.0', who: TO, look: [1, -0.2]}],
  'hf-six': [{at: 'l0+0.4', who: RS, look: [0.6, -0.3]}, {at: 'l0+1.6', who: CP, look: [1, 0]}],
  fainter: [{at: 0.4, who: LA, look: [0.8, 0.3]}, {at: 'l0+0.6', who: TO, look: [1, 0.1]}],
  'fainter-b': [{at: 'l0+0.3', who: TO, look: [1, -0.2]}],
  promise: [{at: 'l0+0.5', who: TO, look: [1, -0.2]}],
  'promise-2': [{at: 'l0+0.4', who: LA, loop: 'tap', dur: 1.6}],
  'promise-ship': [{at: 'l0+0.6', who: CP, look: [1, 0]}],
  'promise-yes': [{at: 'l0+0.2', who: RS, look: [0, 0.6]}, {at: 'l0+1.4', who: CP, look: [1, 0.2]}],
  'ship-stars': [{at: 'l0+0.3', who: RS, look: [-1, 0]}, {at: 'l0+1.8', who: RS, look: [0.6, -0.6]}],
  'count-why': [{at: 'l0+0.2', who: TO, look: [1, -0.2]}],
  'count-why-b': [{at: 'l0+0.3', who: LA, look: [-1, 0.2]}, {at: 'l0+1.6', who: LA, pose: 'pointUp'}],
  'no-coats': [{at: 0.6, who: 'extra:44', loop: 'shiver', dur: 2.5}, {at: 1.0, who: TO, loop: 'shiver', dur: 2}],
  'morse-lesson': [{at: 'l0+0.4', who: LA, loop: 'tap', dur: 1.4}, {at: 'l0+2.2', who: TO, look: [-1, 0.4]}],
  'morse-why': [{at: 'l0+0.2', who: TO, look: [-1, 0.2]}],
  'morse-why-b': [{at: 'l0+0.3', who: LA, look: [1, 0.1]}, {at: 'l0+1.8', who: TO, loop: 'tap', dur: 1.4}],
  'basement-warm': [{at: 0.5, who: 'extra:302', loop: 'bounce', dur: 1.2}, {at: 1.4, who: 'extra:12', look: [1, 0]}],
  'basement-six': [{at: 0.6, who: 'extra:12', look: [1, 0]}, {at: 1.0, who: 'extra:23', look: [1, 0]}, {at: 1.4, who: LA, loop: 'tap', dur: 2}],
  'stop-2': [{at: 'l0+1.6', who: TO, pose: 'handsOnHead'}],
  come: [{at: 'l0+0.3', who: LA, look: [-1, -0.2]}, {at: 'l0+1.6', who: TO, look: [1, 0.2]}],
  'reveal-count': [{at: 'l0+0.2', who: TO, look: [1, -0.1]}],
  'reveal-count-b': [{at: 'l0+0.4', who: LA, pose: 'pointUp'}],
  'you-listen': [{at: 'l0+0.3', who: LA, look: [-1, 0.3]}, {at: 'l0+2.0', who: TO, loop: 'nod', dur: 0.9}],
  'why-not-tell': [{at: 'l0+0.2', who: TO, look: [1, -0.1]}],
  'why-not-tell-b': [{at: 'l0+0.5', who: LA, look: [-1, 0.4]}, {at: 'l0+2.6', who: TO, look: [0.4, -0.6]}],
  practice: [{at: 0.5, who: LA, loop: 'tap', dur: 2.6}, {at: 1.4, who: TO, look: [0.6, 0.5]}],
  'perseids-crowd': [{at: 0.6, who: 'extra:23', pose: 'cheer'}, {at: 1.4, who: 'extra:12', pose: 'pointUp'}],
  'pings-wait': [{at: 1.0, who: TO, look: [1, 0.2]}, {at: 2.4, who: LA, look: [0.5, -0.1]}],
  'call-joy': [{at: 'l0+0.4', who: TO, look: [1, -0.2]}],
  'call-joy-2': [{at: 'l0+0.3', who: LA, look: [-1, 0.4]}, {at: 'l0+2.2', who: TO, loop: 'nod', dur: 0.8}],
  bounced: [{at: 'l0+0.2', who: RS, pose: 'shrug'}],
  'bounced-b': [{at: 'l0+0.6', who: TO, loop: 'bounce', dur: 0.8}, {at: 'l0+1.2', who: RS, look: [-1, 0]}],
  'every-letter-b': [{at: 'l0+0.5', who: RS, pose: 'hug'}, {at: 'l0+0.5', who: TO, pose: 'hug'}],
  'bus-wait': [{at: 1.0, who: TO, look: [0.3, -0.8]}, {at: 2.5, who: RS, look: [-1, 0]}],
  'bus-when': [{at: 'l0+0.3', who: TO, look: [-1, 0]}],
  'bus-when-b': [{at: 'l1+0.4', who: LA, look: [0.2, -0.8]}, {at: 'l1+0.9', who: RS, look: [0.2, -0.8]}],
  'why-back': [{at: 1.2, who: LA, look: [1, 0]}],
  day6: [{at: 0.8, who: TO, look: [-0.6, -0.8]}, {at: 2.4, who: LA, look: [0.3, 0.4]}],
  'ship-food-b': [{at: 'l0+0.3', who: RS, look: [-1, 0]}],
};

// ── Faces: the direction pass ───────────────────────────────────────────────────────────────────────
// Lola understates (focused, determined, a small smile); Tomás shows everything; Rosa is steady at work and breaks
// only twice (the promise, "They heard us"). Startles only on their cause, and the engine settles them.
type Face = 'neutral' | 'smile' | 'laugh' | 'worried' | 'scared' | 'surprised' | 'sad' | 'awe' | 'relieved' | 'focused' | 'determined' | 'cold' | 'sleepy' | 'alert' | 'uneasy' | 'angry';
const REACT: Record<string, {at: number | string; who: string; expr: Face}[]> = {
  'dark-bus': [{at: 0.3, who: TO, expr: 'scared'}],
  'stars-noon': [{at: 0.3, who: TO, expr: 'awe'}],
  'chirp': [{at: 1.4, who: TO, expr: 'alert'}],
  'reveal-six': [{at: 'l0+0.2', who: TO, expr: 'awe'}],
  'ping-1': [],
};
for (const s of shots) {
  const p = (s as any).props;
  if (!p?.cast) continue;
  const r = REACT[s.id];
  if (r?.length) p.acts = [...(p.acts ?? []), ...r];
  const a = ACTS[s.id];
  if (a?.length) p.acts = [...(p.acts ?? []), ...a];
}

export const sun02: Episode = {
  id: 'sun02',
  file: 'FILE 002',
  title: 'The Sun Went Out While My Mum Was at Sea',
  youtubeTitle: 'The Sun Went Out While My Mum Was in the Middle of the Ocean',
  titleAlternates: ['The Sun Went Out and My Mum’s Ship Disappeared in the Dark', 'No Sun, No GPS, No Signal: My Mum Was Lost at Sea'],
  thumbnailText: 'MUM?',
  commentPrompt: 'If the sky went dark, who would you be calling?',
  logline:
    'At 1:52 one afternoon in Manila, the Sun goes out. Twelve-year-old Tomás’s mum is an officer on a cargo ship in the middle of the Pacific, and within hours every satellite is dead. His grandmother, a retired coast-guard radio operator, starts calling the sky every morning at six. Every clue is real physics. Watch to the end.',
  tags: ['what if the sun went out', 'what if the sun disappeared', 'lost at sea', 'survival story', 'what if', 'animated story', 'science story', 'radio', 'philippines', 'manila', 'ships', 'grandma', 'the blink files'],
  pinnedComment: 'Every science fact in this File is real, with sources in the description. Which part surprised you most?',
  fps: 30,
  style: 'cinema',
  world: {
    facts: [
      'Power, phones, internet and TV work on land all year (File 001); only satellites and solar fail',
      'Satellites die within hours of Day 0: no GPS, no satellite phones, no ship internet afterwards',
      'Shortwave works until Day 4, then fades; after that no voice reaches the ship',
      'Manila cools slowly (warm sea): above freezing until about Day 30',
      'Rosa is adrift on the Amihan from Day 4 until Day 60; she is home from Day 62',
    ],
    banLines: [
      {re: '\\bGPS (is|was) (working|back)|satellite phone (works|rang)', why: 'satellites are dead after Day 0'},
      {re: '\\bsnow(ed|ing)?\\b', why: 'Manila gets frost, not snow, in this File'},
      {re: '\\bpower cut|blackout\\b', why: 'the grid works all year'},
    ],
    banProps: [],
    onlySfx: [],
    banSets: [],
    presence: [{who: 'rosa', from: 'hug', exceptSets: ['bridge', 'deck'], why: 'Rosa is at sea until the pier on Day 62 (the video call and radio are voice-only from Lola’s side)'}],
  },
  spoilers: ['meteor', 'shooting star', 'perseid', 'rescued', 'found her', 'alive', 'morse', 'comet', 'she made it', 'safe'],
  questionBank: 'episodes/sun02-lost-at-sea/world-model.md',
  narratorIs: ['Tomás', 'Tomas'],
  mainCast: ['tomas', 'lola', 'rosa'],
  narratorCast: 'tomas',
  speakerCast: {TOMAS: 'tomas', LOLA: 'lola', ROSA: 'rosa', CAPTAIN: 'captain', OFFICER: 'officer'},
  coatsFromDay: 20,
  noAngry: ['lola', 'rosa'],
  dialogueLedger: 'episodes/sun02-lost-at-sea/dialogue-review.md',
  shots,
};
