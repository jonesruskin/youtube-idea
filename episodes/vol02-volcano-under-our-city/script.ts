import type {Line, Shot, Episode} from '../../src/engine/schema';
import {line} from '../../src/engine/delivery';
import {autoSplit} from '../../src/engine/autosplit';

/**
 * THE BLINK FILES · File 002 — "A Volcano Started Growing Under Our City"
 *
 * A new story (docs/00 S11). Told by Ana Tupou, grown up, in the first person: the week she was twelve and a new
 * volcano came up under Auckland. Four days, Monday to Thursday. One causal chain (world-model.md §1): magma rises
 * under a city built on a volcanic field → nobody can say where it will break through → Ana's three small clues
 * (a warm fizzing creek, dead fish in a hollow, a bus scraping on a rising road) all sit near her own street → her
 * mum's instruments confirm it → the zone is redrawn and 40,000 people leave in time → it opens at the end of
 * their street. Every question a viewer can ask, and the shot that answers it: world-model.md §5.
 */
type G = Line['g'];
const L =
  (speaker: Line['speaker']) =>
  (text: string, pause?: number, g?: G): Line => line(speaker, text, pause, g);
const N = L('NARRATOR');
const A = L('ANA');
const LU = L('LUI');
const SI = L('SIONE');
const ME = L('MELE');
const MP = L('MELE_PHONE');
const TE = L('TEACHER');
const CO = L('COLLEAGUE');
const AN = L('ANCHOR');
const JZ = L('JAZ');

type Cam = [number, number, number, number, number?];
const hold = (z: number, x: number, y: number): Cam[] => [[0, z, x, y], [1, z * 1.04, x, y]];
const push = (z0: number, z1: number, x: number, y: number, x1 = x, y1 = y, r = 0): Cam[] => [[0, z0, x, y, 0], [1, z1, x1, y1, r]];
const move = (a: [number, number, number], b: [number, number, number], at = 0): Cam[] => [[at, ...a], [1, ...b]];
const dutch = (z0: number, z1: number, x: number, y: number, r: number): Cam[] => [[0, z0, x, y, r * 0.55], [1, z1, x, y, r]];

const AA = 'ana';
const LL = 'lui';
const DD = 'sione';
const MM = 'mele';
type C = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
const c = (who: string, x: number, y: number, o: Record<string, unknown> = {}, depth = 1.2): C => ({who, x, y, depth, ...o});
const stage = (set: string, v: string, cam: Cam[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({scene: 'stage', props: {set, v, cam, cast, acts, ...extra}});
const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});
const vol = (v: string, props: Record<string, unknown> = {}) => sc('vol', {v, ...props});

// ── Blocking ──
// Villa: front door x≈120, TV x≈420, window x≈760–1120 (the street outside), dining table x≈1300–1700.
const TABLE = (o: {ana?: object; lui?: object; dad?: object} = {}) => [
  c(LL, 1340, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', expr: 'neutral', ...o.lui}),
  c(AA, 1500, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', expr: 'focused', ...o.ana}),
  c(DD, 1760, 930, {pose: 'sitChair', seat: 'chair', facing: 'left', expr: 'focused', ...o.dad}),
];
// Creek: Ana kneels on the near bank x≈900; classmates around; the teacher x≈1400.
// Ops room: the wall map x≈200–1100; Mum at her desk x≈1300, a colleague x≈1600.
const OPS = (o: {mele?: object; col?: object} = {}) => [c(MM, 1300, 930, {facing: 'left', expr: 'focused', ...o.mele}), c('extra:64', 1600, 930, {facing: 'left', expr: 'focused', ...o.col})];

export const rawShots: Shot[] = [
  // ══ COLD OPEN ═══════════════════════════════════════════════════════════════════════════════════
  sh('newest', vol('oneyear', {people: false}), {
    chapter: 'The newest volcano',
    cue: 'wonder',
    beats: ['loop'],
    dev: 'a new hill in a city',
    action: 'A green, perfectly round young hill rising out of a suburb, houses all around its foot. Kites over the top.',
    lines: [N("(wistful) Auckland has fifty-four volcanoes. / I watched the *newest* one being born.")],
  }),
  sh('title', sc('title', {titleLines: ['A VOLCANO STARTED GROWING', 'UNDER OUR CITY'], motif: 'volcano'}), {min: 3.6, cue: 'title', action: 'Title card.', lines: [N("(wistful) It took four days. / This is how it *happened*.", 0.5)]}),

  // ══ MONDAY ════════════════════════════════════════════════════════════════════════════════════════
  sh('breakfast', stage('villa', '', move([1.0, 1300, 580], [1.1, 1400, 580]), [c(MM, 1800, 930, {facing: 'left', expr: 'smile', hold: 'bag', pose: 'hold'}), c(LL, 1340, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', expr: 'smile'}), c(AA, 1500, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', expr: 'smile'}), c(DD, 1660, 930, {facing: 'left', expr: 'smile'})], [{at: 'l0+0.4', who: MM, look: [-1, 0]}, {at: 2.6, who: MM, to: 2100, dur: 1.4}]), {
    chapter: 'Monday',
    hud: {place: 'AUCKLAND', time: 'MONDAY · 7:00 AM'},
    timeJump: true,
    cue: 'warm',
    beats: ['laugh'],
    dev: 'meet the family',
    action: 'Monday breakfast in a wooden villa: Dad in his bus-driver shirt; Mum in a red fleece with her ID lanyard, heading out; Lui at the back door with a tin of fish food for the pond; Ana with her notebook.',
    lines: [ME("(amused) Lui, Goldie and Spot get a *pinch* each, / not the whole tin.", 0.2)],
  }),
  sh('family', stage('villa', '', push(1.5, 1.65, 1450, 600), [c(LL, 1340, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', expr: 'laugh'}), c(AA, 1500, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', expr: 'smile'}), c(DD, 1660, 930, {facing: 'left', expr: 'smile'})], [{at: 'l0+0.6', who: DD, look: [-1, 0.2]}]), {
    action: 'The door closes behind Mum. Dad grabs his keys.',
    lines: [N("(warm) Mum studied volcanoes. Dad drove the number 72 bus. Lui had two goldfish in the pond. / And *I* had a notebook.")],
  }),
  sh('creek-mon', stage('creek', '', move([1.0, 960, 560], [1.12, 1000, 580]), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', hold: 'thermo', outfit: 'cold', expr: 'focused'}), c('extra:301', 700, 940, {facing: 'right', outfit: 'cold'}), c('extra:308', 1100, 940, {facing: 'left', outfit: 'cold'}), c('teacher', 1420, 940, {facing: 'left', expr: 'smile'})]), {
    hud: {place: 'AUCKLAND', time: 'MONDAY · 7:40 AM'},
    dev: 'the routine: the creek project',
    action: 'A bush creek behind a school: ferns, a footbridge. A class in raincoats taking readings. Ana kneels at the water with a thermometer and a notebook.',
    lines: [N("(warm) I was twelve. / Every Monday, my class tested the creek behind our *school*.")],
  }),
  sh('reading-mon', stage('creek', '', push(2.4, 2.6, 920, 700), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', hold: 'thermo', outfit: 'cold', expr: 'focused'}), c('extra:308', 1100, 940, {facing: 'left', outfit: 'cold'})], [{at: 'l0+0.4', who: AA, look: [0.4, 0.6]}]), {
    action: 'Close on Ana reading the thermometer.',
    lines: [A("(dry) Fourteen degrees. / Same as *always*.")],
  }),
  sh('nerd', stage('creek', '', push(1.8, 1.95, 1000, 600), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', hold: 'thermo', outfit: 'cold', expr: 'focused'}), c('extra:308', 1100, 940, {facing: 'left', outfit: 'cold', expr: 'laugh'})], [{at: 'l0+0.3', who: AA, look: [1, -0.3]}, {at: 'l1+0.2', who: 'extra:308', expr: 'smile'}]), {
    beats: ['laugh'],
    action: 'Her classmate Jaz peers at the notebook, grinning.',
    lines: [JZ("(teasing) Fourteen *again*? / You and your nerd notebook."), A("(dry) Nerds *notice* things.", 0.3)],
  }),
  sh('quake-school', stage('creek', 'quake', dutch(1.3, 1.5, 1000, 560, 4), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', outfit: 'cold', expr: 'surprised', hold: 'thermo'}), c('extra:301', 700, 940, {facing: 'right', outfit: 'cold', expr: 'scared'}), c('extra:308', 1100, 940, {facing: 'left', outfit: 'cold', expr: 'scared'}), c('teacher', 1420, 940, {facing: 'left', expr: 'alert'})], [{at: 0.4, who: 'teacher', pose: 'point'}]), {
    sfx: 'impact',
    cue: 'tension',
    dev: 'the first earthquake',
    beats: ['wow'],
    action: 'A sharp jolt. The water ripples in rings, the trees shiver, a bird flock bursts up. The teacher steps forward.',
    lines: [TE("(urgent) Everyone, step *away* from the trees!", 0, 'point')],
  }),
  sh('alert', vol('alert', {mode: 'unrest'}), {
    beats: ['loop'],
    action: 'A phone emergency alert: VOLCANIC UNREST · AUCKLAND · Earthquakes under the city. Stay informed.',
    lines: [N("(worried) By lunchtime, *every* phone in the city showed the same alert.")],
  }),
  sh('swarm', vol('magma', {step: 0}), {
    science: {text: 'Volcanic unrest under a monogenetic field begins with swarms of small earthquakes as magma forces its way up through the crust; under Auckland they would be felt and located once the magma is within roughly 10–30 km of the surface.', source: 'Auckland Lifelines Forum (2007); GNS Science, ‘Auckland Volcanic Field’'},
    dev: 'magma is rising',
    action: 'Cut-away under the city: a thin finger of glowing magma deep below, a cloud of tiny flashes around its tip. Depth readout: 10 KM.',
    lines: [N("(awed) Ten kilometres under the city, hot melted rock was *rising*, / cracking its way up.")],
  }),
  sh('field-map', vol('field'), {
    science: {text: 'Auckland sits on a volcanic field of about 53 volcanoes; each erupted once (except Rangitoto), so the next eruption will most likely open at a brand-new site.', source: 'Hayward, ‘Volcanoes of Auckland’ (Auckland University Press, 2019)'},
    beats: ['wow'],
    action: 'A map of Auckland: one by one, about fifty volcano dots light up across the city, harbour to harbour.',
    lines: [N("(calm) Auckland is built on fifty-three volcanoes. / Almost all of them erupted just *once*, each in a new place.")],
  }),
  sh('nobody-knew', vol('field', {question: true}), {
    dev: 'nobody knows where it will open',
    action: 'The same map: a big pulsing question mark drifts over the city.',
    lines: [N("(worried) So *nobody* could say where the next one would come up.")],
  }),
  sh('dinner-mon', stage('villa', 'night', push(1.3, 1.45, 1520, 600), TABLE({ana: {expr: 'worried'}, lui: {expr: 'uneasy'}, dad: {expr: 'worried'}}), [{at: 'l0+0.6', who: DD, look: [-1, 0.2]}], {emptyChair: 1640, tv: 'quake'}), {
    hud: {place: 'AUCKLAND', time: 'MONDAY · 7:00 PM'},
    dev: 'Mum is a volcano scientist, at work',
    action: 'The Tupou family villa at dinner: Dad in his bus-driver shirt, Lui, Ana. An empty chair. The TV news shows a map with dots.',
    lines: [N("(sad) Mum didn't come home for dinner. / She was at the monitoring centre *all* night.")],
  }),
  sh('mum-call', stage('villa', 'night', push(2.0, 2.15, 1450, 580), TABLE({ana: {expr: 'focused'}, lui: {expr: 'uneasy'}, dad: {expr: 'worried'}}), [{at: 0.1, who: AA, take: 'pocket', prop: 'phoneLit'}, {at: 0.5, who: AA, pose: 'hold'}, {at: 'l0+0.4', who: LL, look: [1, -0.2]}]), {
    action: 'Ana holds up the phone: Mum on a video call from the monitoring centre.',
    lines: [MP("(calm) It's about ten kilometres down, and it's rising. / It could take a few *days*.", 0.2), A("(worried) Where will it come *out*?", 0.2)],
  }),
  sh('mum-where', stage('ops', '', push(1.9, 2.05, 1250, 560), OPS({mele: {hold: 'phoneLit', pose: 'hold', expr: 'worried'}}), [{at: 'l0+0.4', who: MM, look: [-1, -0.2]}, {at: 'l0+2.0', who: 'extra:64', look: [-1, 0]}]), {
    hud: {place: 'VOLCANO MONITORING CENTRE', time: 'MONDAY · 7:02 PM'},
    action: 'At the monitoring centre, a wall-sized map behind her, Mum on the phone.',
    lines: [ME("(tired) We don't know yet. / That's what we're trying to *work out*.")],
  }),
  sh('cant-pin', vol('magma', {step: 1}), {
    beats: ['loop'],
    science: {text: 'Small earthquakes in the Auckland Volcanic Field are hard to record and locate because of the high level of surface noise in a city.', source: 'GNS Science / GeoNet, Auckland Volcanic Field monitoring'},
    dev: 'the city noise hides the quakes',
    action: 'The cut-away again: traffic and trains on the surface shake the picture; the flashes around the magma blur into a wide fuzzy circle.',
    lines: [N("(calm) A city is noisy. / Trucks and trains blur tiny earthquakes, so the scientists could only *roughly* tell where they were.")],
  }),
  sh('lui-scared', stage('villa', 'night', push(1.6, 1.75, 1100, 600), [c(LL, 1000, 930, {facing: 'right', expr: 'scared'}), c(AA, 1180, 930, {facing: 'left', outfit: 'home', expr: 'focused'})], [{at: 'l0+0.3', who: AA, look: [-1, 0.3]}]), {
    hud: {place: 'AUCKLAND', time: 'MONDAY · 8:30 PM'},
    action: 'After dinner. Lui, in pyjamas, grips the back of the sofa as a small jolt rattles the cups.',
    lines: [LU("(scared) Is the volcano going to come up under my *bed*?")],
  }),
  sh('ana-calm', stage('villa', 'night', push(2.2, 2.35, 1120, 580), [c(LL, 1000, 930, {facing: 'right', expr: 'uneasy'}), c(AA, 1180, 930, {facing: 'left', outfit: 'home', expr: 'smile'})], [{at: 'l0+0.4', who: AA, look: [-1, 0.4]}, {at: 'l0+2.2', who: LL, expr: 'smile'}]), {
    action: 'Ana crouches to his height.',
    lines: [A("(teasing) No. / The city is *huge*, and your bed is tiny.")],
  }),
  sh('drop-cover', stage('villa', 'night', dutch(1.4, 1.55, 1500, 640, 3), [c(DD, 1660, 930, {facing: 'left', expr: 'determined', pose: 'crouch'}), c(AA, 1520, 930, {facing: 'right', outfit: 'home', expr: 'alert', pose: 'crouch'}), c(LL, 1400, 930, {facing: 'right', expr: 'alert', pose: 'crouch'})], [{at: 0.3, who: LL, expr: 'scared'}, {at: 'l0+1.2', who: LL, expr: 'uneasy'}], {underTable: true}), {
    sfx: 'impact',
    science: {text: 'In New Zealand the advice in an earthquake is Drop, Cover and Hold: get down, take cover under a sturdy table, hold on until the shaking stops.', source: 'NZ ShakeOut / National Emergency Management Agency'},
    action: 'A stronger jolt. The family drops under the dining table, Dad’s arm over the kids.',
    lines: [SI("(urgent) Drop, cover, hold! / Under the table, *both* of you!")],
  }),
  sh('getaway', stage('villa', 'night', push(1.5, 1.65, 1300, 600), [c(DD, 1500, 930, {facing: 'left', expr: 'focused'}), c(AA, 1180, 930, {facing: 'right', outfit: 'home', expr: 'focused'}), c(LL, 1000, 930, {facing: 'right', expr: 'focused'})], [{at: 'l0+0.4', who: DD, pose: 'point'}, {at: 'l0+2.0', who: DD, pose: 'stand'}], {items: [{prop: 'bag', x: 1440, y: 925}]}), {
    dev: 'the getaway bag',
    timeJump: true,
    hud: {place: 'AUCKLAND', time: 'MONDAY · 9:15 PM'},
    science: {text: 'New Zealand Civil Defence advises every household to keep a grab bag ready: water, food, torch, radio, medicines, copies of documents.', source: 'National Emergency Management Agency (NZ), Get Ready'},
    action: 'Dad puts a packed backpack by the front door: water, a torch, a radio, a first-aid kit.',
    lines: [SI("(calm) Just in case. / Water, torch, radio, and the first-aid kit. It lives by the door *now*.")],
  }),

  // ══ TUESDAY ═══════════════════════════════════════════════════════════════════════════════════════
  sh('creek-tue', stage('creek', 'fizz', push(1.6, 1.75, 920, 760), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', hold: 'thermo', outfit: 'cold', expr: 'focused'})], [{at: 0.8, who: AA, expr: 'surprised'}]), {
    chapter: 'Tuesday',
    hud: {place: 'AUCKLAND', time: 'TUESDAY · 8:10 AM'},
    timeJump: true,
    cue: 'mystery',
    dev: 'clue 1: the creek is fizzing',
    action: 'The next morning, before school. Ana alone at the creek. The water is fizzing with tiny bubbles all along the bank.',
    lines: [A("(curious) It's fizzing. / Like *lemonade*.")],
  }),
  sh('notebook', vol('notebook'), {
    beats: ['loop'],
    action: 'Ana’s notebook: a column of Monday readings, 14 °C, 14 °C, 14 °C… and today, circled: 19 °C. Bubbles!',
    lines: [N("(awed) Nineteen degrees. / Overnight, the creek had warmed up by *five*.")],
  }),
  sh('lesson', stage('classroom', '', move([1.0, 960, 560], [1.08, 1000, 560]), [c('teacher', 1500, 930, {facing: 'left', expr: 'focused', pose: 'point'}), c(AA, 760, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', expr: 'focused'}), c('extra:301', 560, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home'}), c('extra:308', 960, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home'})], [{at: 'l0+1.6', who: 'teacher', pose: 'stand'}]), {
    hud: {place: 'SCHOOL', time: 'TUESDAY · 10:00 AM'},
    dev: 'what a volcanic field is',
    action: 'A classroom. The teacher at a whiteboard covered in volcano dots. Ana at her desk with her notebook open.',
    lines: [TE("(calm) Nearly every volcano in Auckland is a one-off. / It erupts *once*, and then never again.")],
  }),
  sh('lesson-q', stage('classroom', '', push(2.0, 2.15, 900, 600), [c('teacher', 1500, 930, {facing: 'left', expr: 'focused'}), c(AA, 760, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', expr: 'focused'}), c('extra:301', 560, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home', expr: 'uneasy'}), c('extra:308', 960, 930, {pose: 'sitChair', seat: 'chair', facing: 'right', outfit: 'home'})], [{at: 'l0+0.2', who: 'extra:308', look: [-1, 0]}]), {
    dev: 'the next one could open under a house',
    action: 'The class goes quiet, looking at the dots.',
    lines: [N("(worried) So the next one would open somewhere brand *new*: / under a road, a field, or a house.")],
  }),
  sh('mum-tv', sc('news', {v: 'anchor', headline: 'MAGMA RISING UNDER AUCKLAND', ticker: 'SCIENTISTS: BEST ESTIMATE UNDER THE HARBOUR · LOCATION STILL UNCERTAIN · BE READY TO LEAVE'}), {
    beats: ['loop'],
    hud: {place: 'AUCKLAND', time: 'TUESDAY · 1:00 PM'},
    cue: 'news',
    dev: 'the official estimate: under the harbour',
    action: 'At lunch, on a phone: a press conference. Mum at the microphones, a map behind her with a red circle out under the harbour.',
    lines: [AN("(broadcast) Scientists say their best guess is under the harbour, but they can't be sure yet.")],
  }),
  sh('pond', stage('backyard', 'dead', push(1.5, 1.65, 1150, 640), [c(LL, 1080, 950, {pose: 'kneel', facing: 'right', expr: 'worried'}), c(AA, 760, 930, {facing: 'right', outfit: 'cold', expr: 'worried'})], [{at: 0.4, who: AA, to: 940, dur: 1.2}]), {
    hud: {place: 'AUCKLAND', time: 'TUESDAY · 3:30 PM'},
    dev: 'clue 2: the fish in the hollow are dead',
    action: 'The back garden after school. Lui kneels by the little pond at the bottom of the sloping lawn. Two goldfish float on the surface.',
    lines: [LU("(scared) Ana! / Goldie and Spot aren't *moving*!")],
  }),
  sh('pond-low', stage('backyard', 'dead', push(2.2, 2.35, 1060, 660), [c(LL, 1080, 950, {pose: 'kneel', facing: 'right', expr: 'sad'}), c(AA, 940, 930, {facing: 'right', outfit: 'cold', expr: 'sad'})], [{at: 'l0+2.6', who: AA, expr: 'focused'}, {at: 'l0+0.4', who: AA, look: [0.6, 0.6]}, {at: 'l0+1.8', who: AA, look: [-0.6, -0.2]}]), {
    action: 'Ana kneels beside him and looks up the slope: the pond sits in the lowest dip of the garden.',
    lines: [A("(sad) Oh, Lui. I'm sorry. / They were fine this morning. // And the pond's right at the *bottom* of the garden.")],
  }),
  sh('bus-scrape', stage('busroute', 'scrape', move([1.0, 900, 560], [1.08, 1100, 560]), [], [], {busX: 1100, humpAt: 1.4, driver: true}), {
    hud: {place: 'KŌWHAI STREET', time: 'TUESDAY · 5:20 PM'},
    sfx: 'crash',
    dev: 'clue 3: the road is rising',
    beats: ['wow'],
    action: 'A suburban street lined with wooden villas; a park with big trees at the far end. Dad’s city bus rolls over a smooth new hump in the road; the back of the bus scrapes with a shower of sparks.',
    lines: [N("(curious) On his last run, / the back of Dad's bus scraped on a *bump* in the road. / It hadn't been there *last week*.")],
  }),
  sh('dinner-tue', stage('villa', 'night', push(1.8, 1.95, 1640, 600), TABLE({ana: {expr: 'focused'}, lui: {expr: 'sad'}, dad: {expr: 'uneasy'}}), [{at: 'l0+0.4', who: DD, look: [-1, 0]}, {at: 'l0+2.2', who: AA, expr: 'alert'}], {emptyChair: 1640}), {
    hud: {place: 'AUCKLAND', time: 'TUESDAY · 7:00 PM'},
    action: 'Dinner. Dad, puzzled.',
    lines: [SI("(dry) There's a new bump on Kōwhai Street. / My bus scraped right *over* it.")],
  }),
  sh('ana-stops', stage('villa', 'night', push(2.4, 2.6, 1500, 580), TABLE({ana: {expr: 'alert'}, lui: {expr: 'sad'}, dad: {expr: 'uneasy'}}), [{at: 0.6, who: AA, look: [-0.2, 0.6]}]), {
    dev: 'Ana connects the clues',
    min: 2.4,
    action: 'Ana stops eating. Fork in the air.',
    lines: [A("(shocked) Kōwhai Street? / That's right next to the *creek*.")],
  }),
  sh('ana-map', vol('anamap'), {
    twist: 1,
    beats: ['wow'],
    action: 'Ana’s notebook map of the neighbourhood in coloured pen: a star at the creek, a fish at the pond, a bus at the bump. She draws a circle around all three. Their own house is in the middle.',
    lines: [N("(awed) I put all three on a map. / They were all within a kilometre of our *house*.")],
  }),
  sh('co2', vol('co2'), {
    science: {text: 'As magma rises, gases (mostly CO₂) escape ahead of it. CO₂ is heavier than air, so it collects in hollows, basements and low ponds, where it can suffocate animals; springs can warm and fizz.', source: 'USGS Volcano Hazards Program, ‘Volcanic gases’'},
    action: 'Diagram: gas bubbling up through the ground ahead of the magma, fizzing out of the creek and pooling, invisible but tinted, in the low pond.',
    lines: [N("(calm) Before magma reaches the surface, gas leaks out *ahead* of it. / That gas is *heavier* than air, so it sinks into hollows and ponds.")],
  }),
  sh('uplift', vol('uplift'), {
    science: {text: 'Magma pushing toward the surface lifts the ground above it, measurable by GPS stations and satellites as centimetres or more of uplift.', source: 'USGS, ‘Monitoring ground deformation’'},
    action: 'Diagram: the magma swelling up from below; the road surface bulging above it; a GPS station’s arrow climbing.',
    lines: [N("(calm) And as the magma pushes upward, / the ground above it *rises*.")],
  }),
  sh('check-it', stage('villa', 'night', push(1.8, 1.95, 1600, 600), TABLE({ana: {expr: 'determined', pose: 'stand', seat: undefined}, lui: {expr: 'sad'}, dad: {expr: 'focused'}}), [{at: 'l0+0.4', who: DD, look: [-1, 0]}], {emptyChair: 1640}), {
    dev: 'Ana tests her idea before she calls',
    action: 'Ana stands up from the table, notebook in hand.',
    lines: [A("(determined) Dad, can you drive me to the creek? / I want to check it *again*."), SI("(warm) Get your coat. / I'll get the *torch*.", 0.3)],
  }),
  sh('night-creek', stage('creek', 'fizz', push(1.7, 1.85, 960, 740), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', hold: 'thermo', outfit: 'cold', expr: 'focused'}), c(DD, 1120, 940, {facing: 'left', hold: 'torch', pose: 'torch', expr: 'worried'})], [{at: 'l0+1.6', who: AA, look: [1, -0.4]}], {night: true}), {
    hud: {place: 'AUCKLAND', time: 'TUESDAY · 7:45 PM'},
    timeJump: true,
    beats: ['loop'],
    action: 'Night at the creek. Dad’s torch on the fizzing water. Ana reads the thermometer.',
    lines: [A("(worried) Twenty-one degrees. / It's *still* getting warmer.")],
  }),
  sh('warm-road', stage('busroute', 'night', push(2.0, 2.15, 1300, 640), [c(AA, 1240, 940, {pose: 'kneel', facing: 'right', outfit: 'cold', expr: 'alert'}), c(DD, 1420, 940, {facing: 'left', hold: 'torch', pose: 'torch', expr: 'worried'})], [{at: 'l0+0.4', who: AA, look: [0.4, 0.6]}], {hump: true}), {
    beats: ['wow'],
    dev: 'warm gas from a crack in the hump',
    action: 'Kōwhai Street, the hump in the torchlight. A thin crack runs across the hump; Ana holds her palm over it.',
    lines: [A("(shocked) Dad, feel this. / Warm air is coming out of the *crack*."), SI("(urgent) Call your mother. // *Now*.", 0.3)],
  }),
  sh('ana-calls', stage('villa', 'night', push(2.0, 2.15, 900, 580), [c(AA, 900, 930, {facing: 'right', outfit: 'home', expr: 'determined'})], [{at: 0.1, who: AA, take: 'pocket', prop: 'phoneLit'}, {at: 0.5, who: AA, pose: 'hold'}, {at: 'l0+0.4', who: AA, look: [0.8, -0.2]}], {window: true}), {
    action: 'By the dark front window, Ana calls Mum.',
    lines: [A("(determined) Mum, I think I know where it's going to *come up*.")],
  }),
  sh('mum-busy', stage('ops', 'night', push(2.2, 2.35, 1260, 560), OPS({mele: {hold: 'phoneLit', pose: 'hold', expr: 'worried'}}), [{at: 'l0+0.3', who: MM, look: [0.6, 0.4]}]), {
    hud: {place: 'VOLCANO MONITORING CENTRE', time: 'TUESDAY · 8:15 PM'},
    action: 'Mum at the centre, exhausted, screens everywhere.',
    lines: [ME("(tired) Ana, love, I'm *really* busy. / Can it wait until tomorrow?")],
  }),
  sh('ana-insists', stage('villa', 'night', push(2.4, 2.55, 900, 560), [c(AA, 900, 930, {facing: 'right', hold: 'phoneLit', pose: 'hold', outfit: 'home', expr: 'determined'})], [{at: 'l0+0.4', who: AA, look: [0.8, 0.1]}], {window: true}), {
    action: 'Ana, steady.',
    lines: [A("(firm) No, Mum. / Our creek is fizzing, and it's *five* degrees warmer.")],
  }),
  sh('ana-insists-2', stage('villa', 'night', push(2.8, 2.95, 900, 560), [c(AA, 900, 930, {facing: 'right', hold: 'phoneLit', pose: 'hold', outfit: 'home', expr: 'determined'})], [{at: 'l0+0.6', who: AA, look: [0.8, 0.2]}], {window: true}), {
    action: 'Closer.',
    lines: [A("(firm) Lui's fish died in the hollow, / and the road on Kōwhai Street is *rising*.")],
  }),
  sh('mum-listens', stage('ops', 'night', push(2.8, 3.0, 1300, 540), OPS({mele: {hold: 'phoneLit', pose: 'hold', expr: 'alert'}}), [{at: 0.6, who: MM, look: [-1, 0]}]), {
    beats: ['heart'],
    dev: 'Mum listens',
    min: 2.6,
    action: 'Mum stops. Turns slowly toward the map.',
    lines: [ME("(shocked) Say that again. // *Slowly*.", 0.6)],
  }),
  sh('confirm', stage('ops', 'night', push(1.6, 1.75, 1450, 540), OPS({mele: {expr: 'focused', hold: 'phoneLit', pose: 'hold'}, col: {expr: 'surprised'}}), [{at: 'l0+0.3', who: MM, look: [1, 0]}, {at: 'l1-0.3', who: MM, expr: 'smile'}], {gps: true}), {
    dev: 'the instruments confirm it',
    action: 'A colleague points at a screen: the graph of the nearest GPS station climbing steeply since the morning.',
    lines: [CO("(urgent) The nearest GPS station has risen *four* centimetres since this morning."), ME("(proud) We have a handful of instruments for a whole city. / She just gave us *three* more.", 0.3)],
  }),
  sh('send-team', stage('ops', 'night', push(2.2, 2.35, 1260, 540), OPS({mele: {expr: 'determined', hold: 'phoneLit', pose: 'hold'}, col: {expr: 'focused'}}), [{at: 'l0+0.2', who: MM, pose: 'point'}]), {
    action: 'Mum, already moving.',
    lines: [ME("(urgent) Send the gas team to Kōwhai Street. / Right *now*.", 0, 'point')],
  }),
  sh('gas-team', stage('busroute', 'night', push(1.4, 1.55, 1300, 600), [c('extra:65', 1200, 940, {facing: 'right', hold: 'meter', pose: 'hold', expr: 'focused'}), c('extra:67', 1400, 940, {facing: 'left', expr: 'alert'})], [{at: 0.6, who: 'extra:67', look: [-1, 0.4]}, {at: 1.4, who: 'extra:65', loop: 'nod', dur: 0.8}], {hump: true, beacon: true}), {
    hud: {place: 'KŌWHAI STREET', time: 'TUESDAY · 11:50 PM'},
    sfx: 'chime',
    dev: 'the gas readings are high',
    action: 'Midnight. Two scientists in high-vis on the hump in the road, a gas meter flashing red and beeping.',
    lines: [N("(worried) Just before midnight, / the gas team's meters started *beeping* on Kōwhai Street.")],
  }),
  sh('callback', stage('villa', 'night', push(1.8, 1.95, 900, 600), [c(AA, 900, 930, {facing: 'right', outfit: 'home', expr: 'sleepy', hold: 'phoneLit', pose: 'hold'})], [{at: 'l0+0.6', who: AA, expr: 'alert'}]), {
    hud: {place: 'AUCKLAND', time: 'WEDNESDAY · 1:10 AM'},
    timeJump: true,
    beats: ['heart'],
    action: 'One in the morning. Ana asleep in the armchair by the window, the phone buzzing in her hand.',
    lines: [MP("(tender) Ana? / The gas team found it. You were *right*. // Pack a bag, love.", 0.4)],
  }),

  // ══ WEDNESDAY ═════════════════════════════════════════════════════════════════════════════════════
  sh('zone', vol('zone'), {
    chapter: 'Wednesday',
    hud: {place: 'AUCKLAND', time: 'WEDNESDAY · 9:00 AM'},
    timeJump: true,
    twist: 2,
    dev: 'the evacuation zone moves',
    science: {text: 'In exercise scenarios for Auckland, the evacuation area changes over time as uncertainty about the vent location shrinks; the expected initial danger zone is about 5 km around the vent.', source: 'Exercise Ruaumoko studies, Bulletin of Volcanology (2012); Science Learning Hub, ‘Exercise Ruaumoko’'},
    action: 'The map: a big red evacuation circle centred out under the harbour slides inland and shrinks onto one suburb. Ana’s street is near its centre.',
    lines: [N("(worried) On Wednesday morning, the evacuation zone moved. / Our street was right in the *middle*.")],
  }),
  sh('alert-evac', vol('alert', {mode: 'evac'}), {
    action: 'The phone alert: EVACUATE NOW · Zone A · Leave within 2 hours. Take only what you need.',
    lines: [N("(urgent) *Every* phone in the zone told us to leave.")],
  }),
  sh('packing', stage('villa', 'packing', push(1.2, 1.35, 1100, 580), [c(DD, 1500, 930, {facing: 'left', expr: 'determined'}), c(AA, 1200, 930, {facing: 'right', outfit: 'cold', expr: 'worried'}), c(LL, 980, 930, {facing: 'right', outfit: 'cold', expr: 'sad'})], [{at: 'l0+0.3', who: DD, pose: 'point'}, {at: 'l0+1.8', who: DD, pose: 'stand'}], {items: [{prop: 'familyPhoto', x: 1275, y: 375}]}), {
    cue: 'tension',
    timeJump: true,
    action: 'The lounge in a whirl: bags open on the sofa. Dad in his uniform, keys in hand.',
    lines: [SI("(urgent) Twenty minutes. / Take the things you *can't* replace.", 0, 'point')],
  }),
  sh('ana-takes', stage('villa', 'packing', push(2.4, 2.55, 1200, 560), [c(DD, 1500, 930, {facing: 'left', expr: 'determined'}), c(AA, 1200, 930, {facing: 'right', outfit: 'cold', expr: 'sad'}), c(LL, 980, 930, {facing: 'right', outfit: 'cold', expr: 'sad'})], [{at: 0.3, who: AA, look: [0.4, -0.6]}, {at: 0.6, who: AA, take: 'table', prop: 'familyPhoto'}, {at: 1.2, who: AA, pose: 'hold'}], {items: [{prop: 'familyPhoto', x: 1275, y: 375, until: 0.9}]}), {
    action: 'Ana takes a framed family photo off the wall and her notebook off the table.',
    lines: [N("(tender) I took a photo of the four of us, / and my *notebook*.")],
  }),
  sh('basement-cat', stage('busroute', 'evac', push(1.5, 1.65, 700, 600), [c('kaur', 560, 940, {facing: 'right', expr: 'worried', pose: 'reach'}), c(AA, 860, 940, {facing: 'left', outfit: 'cold', expr: 'alert'})], [{at: 'l0+0.6', who: AA, to: 700, gait: 'run', dur: 0.6}], {hatch: true}), {
    dev: 'Ana uses what she learned: gas sinks',
    beats: ['heart'],
    action: 'Next door, old Mrs. Kaur is lifting the hatch to her cellar under the house: her cat has run down there. Ana sprints over.',
    lines: [A("(urgent) Mrs. Kaur, don't go down there! / The gas sinks into *low* places.")],
  }),
  sh('cat-out', stage('busroute', 'evac', push(2.0, 2.15, 640, 600), [c('kaur', 560, 940, {facing: 'right', expr: 'surprised', hold: 'catbox', pose: 'hold'}), c(AA, 700, 940, {facing: 'left', outfit: 'cold', expr: 'smile'})], [{at: 'l0+0.4', who: 'kaur', expr: 'relieved'}], {hatch: true}), {
    action: 'Ana props the hatch open, shakes a box of cat biscuits, and the cat strolls out into its carrier.',
    lines: [N("(amused) I shook a box of cat biscuits at the hatch instead. / Cats *always* come for biscuits.")],
  }),
  sh('ramp', stage('busroute', 'evac', push(1.6, 1.75, 1300, 600), [c(DD, 1360, 940, {facing: 'left', expr: 'smile', pose: 'push'}), c('extra:73', 1220, 940, {facing: 'right', pose: 'sitChair', seat: 'chair', expr: 'smile'})], [{at: 0.2, who: DD, to: 1460, dur: 1.4}, {at: 0.2, who: 'extra:73', to: 1340, dur: 1.4}]), {
    action: 'Dad lowers the bus ramp and wheels Mr. Tane up it in his wheelchair.',
    lines: [N("(proud) Dad lowered the ramp for Mr. Tane. / *Nobody* on our street was left behind.")],
  }),
  sh('dads-bus', stage('busroute', 'evac', move([1.0, 960, 560], [1.08, 1000, 560]), [c(DD, 1180, 940, {facing: 'left', expr: 'smile'}), c('kaur', 900, 940, {facing: 'right', hold: 'catbox', pose: 'hold', expr: 'worried'}), c(AA, 760, 940, {facing: 'right', outfit: 'cold', expr: 'focused'}), c(LL, 640, 940, {facing: 'right', outfit: 'cold', expr: 'sad'})], [{at: 0.6, who: 'kaur', to: 1060, dur: 1.4}]), {
    dev: 'Dad drives the neighbours out',
    beats: ['laugh'],
    action: 'Dad’s bus at the kerb, doors open. Neighbours queue with bags; old Mrs. Kaur with a cat in a carrier. Ana and Lui behind her.',
    lines: [SI("(warm) On you get, Mrs. Kaur. / Your cat rides *free* today.")],
  }),
  sh('last-look', stage('busroute', 'evac', push(2.0, 2.2, 900, 560), [c(AA, 900, 940, {facing: 'left', outfit: 'cold', expr: 'sad'}), c(DD, 1180, 940, {facing: 'left', expr: 'determined'}), c(LL, 640, 940, {facing: 'right', outfit: 'cold', expr: 'sad'})], [{at: 0.8, who: AA, look: [-1, -0.2]}]), {
    action: 'Ana stops at the bus door and looks back down the street at their villa and the park beyond it.',
    lines: [N("(sad) I looked back at our house / from the bus *door*.", 0.6)],
  }),
  sh('motorway', vol('motorway'), {
    dev: 'the motorway runs one way: out',
    science: {text: 'Auckland’s volcanic contingency plans use contraflow on the motorways and public buses to move people out of an evacuation zone quickly.', source: 'Auckland Emergency Management, Volcanic Contingency Plan'},
    action: 'From above: every lane of the motorway flowing one way, out of the zone, buses in a long line, police at the on-ramps.',
    lines: [N("(awed) Every lane of the motorway ran one way: / *out*.")],
  }),
  sh('evac-centre', stage('hall', '', move([1.0, 960, 560], [1.1, 1000, 560]), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'sad'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'sleepy'}), c('kaur', 600, 940, {facing: 'right', hold: 'catbox', pose: 'hold'}), c('extra:72', 400, 940, {facing: 'right', pose: 'sit'})]), {
    hud: {place: 'EVACUATION CENTRE', time: 'WEDNESDAY · 6:00 PM'},
    cue: 'warm',
    dev: 'forty thousand people leave',
    action: 'A school hall eight kilometres away, outside the zone: rows of camp beds, families, a tea urn, volunteers.',
    lines: [N("(awed) Forty thousand people left their homes / in a day and a *half*.")],
  }),
  sh('mum-on-tv', sc('news', {v: 'anchor', headline: 'EVACUATION ZONE MOVED', ticker: 'SCIENTISTS: GAS AND GROUND UPLIFT POINT TO THE EASTERN SUBURBS · 40,000 PEOPLE EVACUATING · TIP CAME FROM A MEMBER OF THE PUBLIC'}), {
    cue: 'news',
    beats: ['heart'],
    action: 'On the hall’s TV: Mum at the press conference, the new zone behind her.',
    lines: [AN("(broadcast) Scientists say a tip from a member of the public helped them find the right place.")],
  }),
  sh('a-member', stage('hall', '', push(2.2, 2.35, 1120, 580), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'sad'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'smile'})], [{at: 'l0+0.4', who: LL, look: [-1, 0]}, {at: 'l0+0.8', who: AA, expr: 'smile'}]), {
    beats: ['laugh'],
    action: 'Lui elbows Ana.',
    lines: [LU("(teasing) That's *you*! / You're a member of the public!")],
  }),
  sh('house-ok', stage('hall', '', push(2.6, 2.75, 1120, 560), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'smile'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'alert'})], [{at: 0.4, who: LL, expr: 'uneasy'}, {at: 'l0+0.3', who: AA, expr: 'worried'}, {at: 'l1+0.4', who: AA, look: [1, 0.3]}]), {
    action: 'Then Lui goes quiet.',
    lines: [LU("(scared) Will our house be *okay*?"), A("(tender) I don't know, Lui. / But *we* will be.", 0.4)],
  }),
  sh('dad-again', stage('hall', '', push(1.9, 2.05, 1120, 560), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'focused'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'uneasy'}), c(DD, 1340, 940, {facing: 'left', expr: 'worried'})], [{at: 'l0+0.3', who: DD, look: [-1, 0.3]}, {at: 'l0+2.4', who: AA, loop: 'nod', dur: 0.8}]), {
    action: 'Dad crouches by them for a moment, keys in hand.',
    lines: [SI("(tender) I'm going back for another load. / Look after your brother for me.")],
  }),
  sh('what-if', stage('hall', 'night', push(2.0, 2.15, 1100, 580), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'worried', hold: 'phoneLit', }), c(LL, 1180, 940, {pose: 'lie', facing: 'left', outfit: 'cold', expr: 'sleepy'})], [{at: 'l0+0.4', who: AA, look: [0.6, 0.6]}]), {
    dev: 'what if she is wrong?',
    hud: {place: 'EVACUATION CENTRE', time: 'WEDNESDAY · 10:00 PM'},
    timeJump: true,
    action: 'Late. Lui asleep. Ana on the phone, quiet so as not to wake him.',
    lines: [A("(scared) Mum, what if I'm *wrong*? / Forty thousand people left because of my map.")],
  }),
  sh('then-home', stage('ops', 'night', push(2.2, 2.35, 1280, 560), OPS({mele: {hold: 'phoneLit', pose: 'hold', expr: 'smile'}}), [{at: 'l0+0.4', who: MM, look: [-1, 0.2]}]), {
    hud: {place: 'VOLCANO MONITORING CENTRE', time: 'WEDNESDAY · 10:01 PM'},
    action: 'Mum, at her desk, softly.',
    lines: [ME("(tender) Then they go home on Friday, a bit grumpy. / Being wrong *that* way is fine, love.")],
  }),

  // ══ THURSDAY ══════════════════════════════════════════════════════════════════════════════════════
  sh('park-steam', vol('parksteam'), {
    chapter: 'Thursday',
    hud: {place: 'KŌWHAI STREET', time: 'THURSDAY · 2:00 PM'},
    timeJump: true,
    dev: 'the park pond steams',
    beats: ['wow'],
    action: 'A police drone over the empty zone: at the end of an empty street, the duck pond in the park is steaming, and the grass around it has cracked.',
    lines: [N("(scared) On Thursday afternoon, a police drone flew over our empty street. / The duck pond in the park was *steaming*.")],
  }),
  sh('very-close', stage('ops', '', push(2.0, 2.15, 1260, 560), OPS({mele: {expr: 'focused', hold: 'phoneLit', pose: 'hold'}}), [{at: 0.3, who: MM, expr: 'worried'}, {at: 'l0+0.4', who: MM, look: [-1, 0]}]), {
    hud: {place: 'VOLCANO MONITORING CENTRE', time: 'THURSDAY · 2:10 PM'},
    action: 'Mum on the phone at the centre, the earthquake screens almost solid.',
    lines: [ME("(urgent) It's less than a kilometre down now. / Keep *everyone* out of the zone.")],
  }),
  sh('hourly', vol('notebook', {mode: 'log'}), {
    beats: ['loop'],
    action: 'Ana’s notebook, a new page: the depth of the magma, copied from the TV every hour. 5 km, 3 km, 2 km, 1.2 km, 0.8 km.',
    lines: [N("(worried) At the hall, I wrote down the depth from the TV *every* hour. / The numbers kept getting *smaller*.")],
  }),
  sh('depth-tv', sc('news', {v: 'anchor', headline: 'MAGMA NOW UNDER 1 KM', ticker: 'ZONE A EVACUATED · POWER TO THE ZONE SWITCHED OFF · DO NOT RETURN FOR ANY REASON'}), {
    hud: {place: 'EVACUATION CENTRE', time: 'THURSDAY · 6:00 PM'},
    cue: 'tension',
    action: 'The hall TV: a depth gauge, less than one kilometre. ZONE A EVACUATED.',
    lines: [AN("(broadcast) The zone is empty, and the power there is off. Do not go back for any reason.")],
  }),
  sh('mum-arrives', stage('hall', 'night', move([1.2, 1100, 560], [1.3, 1100, 560]), [c(AA, 1060, 940, {facing: 'right', outfit: 'cold', expr: 'sad'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'sleepy'}), c(MM, 1700, 940, {facing: 'left', expr: 'relieved'})], [{at: 0, who: MM, to: 1240, gait: 'run', dur: 1.4}, {at: 1.4, who: MM, pose: 'hug'}, {at: 1.4, who: AA, pose: 'hug'}, {at: 0.5, who: AA, expr: 'relieved'}]), {
    hud: {place: 'EVACUATION CENTRE', time: 'THURSDAY · 8:00 PM'},
    timeJump: true,
    min: 3.4,
    beats: ['heart'],
    dev: 'Mum, for the first time in four days',
    action: 'Thursday evening. Mum walks in, still in her lanyard, and hugs Ana hard.',
    lines: [ME("(proud) Everyone in the zone is out. / Your map did that. // I'm so *proud* of you.", 0.4)],
  }),
  sh('credit', stage('hall', 'night', push(2.2, 2.35, 1140, 560), [c(AA, 1080, 940, {facing: 'right', outfit: 'cold', expr: 'smile'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'sleepy'}), c(MM, 1260, 940, {facing: 'left', expr: 'smile'})], [{at: 'l0+0.6', who: LL, expr: 'smile'}, {at: 'l0+0.8', who: AA, look: [0.4, 0.4]}]), {
    action: 'Ana looks at her brother.',
    lines: [A("(warm) Lui found the *fish*. / And Dad found the bump.")],
  }),
  sh('footprints-tell', stage('hall', 'night', push(2.4, 2.55, 1180, 560), [c(AA, 1080, 940, {facing: 'right', outfit: 'cold', expr: 'focused'}), c(LL, 1180, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', outfit: 'cold', expr: 'sleepy'}), c(MM, 1260, 940, {facing: 'left', expr: 'focused'})], [{at: 'l0+0.4', who: MM, look: [-1, 0.2]}]), {
    action: 'Mum sits with them on the bench.',
    lines: [ME("(calm) Six hundred years ago, / people here watched Rangitoto *erupt*.")],
  }),
  sh('footprints', vol('footprints'), {
    science: {text: 'Ash from Rangitoto’s eruption (about 600 years ago) buried a Māori settlement on Motutapu Island; footprints of people and dogs walking through the wet ash are preserved, and there is no evidence anyone there was killed.', source: 'Hayward, ‘Volcanoes of Auckland’ (2019); Nichol, New Zealand Journal of Geology and Geophysics (1982)'},
    beats: ['heart'],
    action: 'Grey hardened ash on an island shore: a trail of footprints, big and small, and the paw prints of a dog beside them, heading away from the sea.',
    lines: [N("(tender) Their footprints are still there, in the hardened ash. Grown-ups, children, and dogs. / They didn't run. // They *walked* away.")],
  }),
  sh('rangitoto', vol('rangitoto'), {
    science: {text: 'Rangitoto rose out of the sea in the Hauraki Gulf about 600 years ago in two phases; it is the youngest and largest volcano in the Auckland field, now covered in pōhutukawa forest.', source: 'Hayward, ‘Volcanoes of Auckland’ (2019); Needham et al., Journal of Volcanology and Geothermal Research (2011)'},
    beats: ['wow'],
    dev: 'Rangitoto: the last one, 600 years ago',
    action: 'Time-lapse: the sea bubbles, an island rises, lava fountains build a wide gentle cone; centuries roll; it turns green with forest; ferries and picnickers.',
    lines: [N("(warm) Rangitoto rose straight out of the sea. / Today it's covered in forest, and families walk up it on *Sundays*.")],
  }),
  sh('quiet', stage('hall', 'night', push(1.6, 1.75, 1100, 600), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'sleepy'}), c(LL, 1180, 940, {pose: 'lie', facing: 'left', outfit: 'cold', expr: 'sleepy'}), c(MM, 1300, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', expr: 'sleepy'})], [{at: 1.2, who: AA, look: [0.6, -0.6]}], {clock: '11:51'}), {
    cue: 'silence',
    min: 3.2,
    action: 'Late night in the hall, lights low. Lui asleep. Mum dozing. Ana awake, watching the high windows. The clock says 11:51.',
    lines: [N("(wistful) That night, / I couldn't *sleep*.", 0.8)],
  }),
  sh('eruption', vol('eruption', {step: 0}), {
    hud: {place: 'AUCKLAND', time: 'THURSDAY · 11:52 PM'},
    sfx: 'impact',
    twist: 3,
    beats: ['wow'],
    dev: 'the volcano opens',
    action: 'Across the dark city: a flash, then a white column of steam and ash punches up from the suburbs, lightning crackling in it.',
    lines: [N("(awed) At eight minutes to midnight, // the ground *opened*.", 0.4)],
  }),
  sh('counting', stage('hall', 'glow', push(1.4, 1.55, 950, 560), [c(AA, 900, 940, {facing: 'back', outfit: 'cold', expr: 'focused'})], [{at: 0.4, who: AA, facing: 'right', look: [1, -0.3]}]), {
    beats: ['wow'],
    dev: 'sound takes time: Ana counts to 23',
    action: 'Ana at the high window, the orange glow outside. Her lips move as she counts.',
    lines: [N("(scared) I counted the seconds, / the way Dad taught us to with lightning. / One, two, three…", 0.6)],
  }),
  sh('boom', stage('hall', 'glow', dutch(1.4, 1.55, 1000, 560, 3), [c(AA, 900, 940, {facing: 'right', outfit: 'cold', expr: 'surprised'}), c(LL, 1020, 940, {pose: 'lie', facing: 'left', outfit: 'cold', expr: 'surprised'}), c(MM, 1300, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', expr: 'alert'})], [{at: 0.6, who: MM, pose: 'stand', seat: undefined}]), {
    sfx: 'thunder',
    science: {text: 'Sound travels about 343 metres per second in air, so a sound 8 km away arrives about 23 seconds after the light.', source: 'NIST / standard speed of sound in air at 20 °C'},
    action: 'Twenty-three seconds later the windows rattle in their frames with a deep boom. Everyone in the hall wakes.',
    lines: [N("(awed) At twenty-three, the boom hit the windows. / Sound takes twenty-three seconds to travel *eight* kilometres.")],
  }),
  sh('headcount', stage('hall', 'glow', push(1.3, 1.45, 1100, 560), [c(AA, 900, 940, {facing: 'right', outfit: 'cold', expr: 'alert'}), c(LL, 1020, 940, {pose: 'lie', facing: 'left', outfit: 'cold', expr: 'alert'}), c(MM, 1300, 940, {facing: 'left', expr: 'focused'}), c('extra:74', 1600, 940, {facing: 'left', hold: 'list', pose: 'hold', expr: 'focused'}), c('kaur', 640, 940, {facing: 'right', hold: 'catbox', pose: 'hold', expr: 'worried'})], [{at: 'l0+0.6', who: 'extra:74', look: [-1, 0]}]), {
    dev: 'everyone from the zone is accounted for',
    action: 'A volunteer with a clipboard calls names across the hall; hands go up everywhere.',
    lines: [N("(relieved) A volunteer read out every name from our street. / *Every* single person answered.")],
  }),
  sh('surge', vol('surge'), {
    science: {text: 'When rising magma meets groundwater it flashes it to steam and explodes; the first eruptions of an Auckland volcano would send base surges, ground-hugging clouds of ash and rock, racing out for kilometres.', source: 'Science Learning Hub, ‘Future explosions in Auckland’; Natural Hazards Commission (2025)'},
    action: 'Diagram: magma meets groundwater, a steam explosion, a ring of ash rushing out along the ground. The evacuation line sits beyond it.',
    lines: [N("(awed) Where magma meets groundwater, it explodes into steam, / and a cloud of ash and rock rushes out across the *ground*.")],
  }),
  sh('nobody-there', vol('surge', {empty: true}), {
    action: 'The surge sweeps empty streets; inside the zone, no one.',
    lines: [N("(relieved) Everyone it reached / had *already* left.")],
  }),
  sh('window', stage('hall', 'glow', push(1.5, 1.65, 1000, 560), [c(AA, 900, 940, {facing: 'back', outfit: 'cold', expr: 'awe'}), c(LL, 1020, 940, {facing: 'back', outfit: 'cold', expr: 'worried'}), c(MM, 1160, 940, {facing: 'back', expr: 'focused'}), c(DD, 1320, 940, {facing: 'back', expr: 'focused'})], [{at: 'l0+0.4', who: LL, facing: 'right', look: [1, -0.3]}]), {
    action: 'The family at the high windows, silhouetted against an orange glow on the horizon. Dad is back. Lui tugs Mum’s sleeve.',
    lines: [LU("(scared) Is that the park near our *house*?")],
  }),
  sh('our-street', stage('hall', 'glow', push(2.4, 2.6, 1100, 540), [c(AA, 900, 940, {facing: 'right', outfit: 'cold', expr: 'alert'}), c(LL, 1020, 940, {facing: 'right', outfit: 'cold', expr: 'alert'}), c(MM, 1160, 940, {facing: 'left', expr: 'sad'}), c(DD, 1320, 940, {facing: 'left', expr: 'sad'})], [{at: 0.4, who: AA, expr: 'sad'}, {at: 0.5, who: LL, expr: 'worried'}, {at: 'l0+1.6', who: DD, look: [-1, 0.3]}, {at: 'l0+1.8', who: AA, look: [1, -0.2]}]), {
    beats: ['heart'],
    twist: 4,
    min: 3.6,
    action: 'Mum turns to them. Dad looks down at Ana.',
    lines: [ME("(sad) Yes. // It's right at the end of our *street*.", 0.8)],
  }),

  // ══ AFTER ═════════════════════════════════════════════════════════════════════════════════════════
  sh('ash-city', vol('ash'), {
    chapter: 'After',
    hud: {place: 'AUCKLAND', time: 'FRIDAY'},
    cue: 'mystery',
    dev: 'ash on the city; the airport shuts',
    action: 'Morning: grey ash falling like snow on cars and roofs across the city; people in masks; planes parked at a closed airport.',
    lines: [N("(sad) By morning, ash covered *half* the city, and the airport was closed.")],
  }),
  sh('news-homes', sc('news', {v: 'anchor', headline: 'NEW VOLCANO IN AUCKLAND', ticker: 'ABOUT 200 HOMES DESTROYED IN THE EVACUATION ZONE · NO ONE INSIDE THE ZONE HURT · ASH: WEAR A MASK OUTDOORS'}), {
    cue: 'news',
    dev: 'the cost, and the saving',
    action: 'The news over aerial pictures of a smoking crater where a park and a street used to be.',
    lines: [AN("(broadcast) About two hundred homes were destroyed. Nobody inside the zone was hurt.")],
  }),
  sh('ours-gone', stage('hall', '', push(2.0, 2.2, 1100, 560), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'sad', hold: 'familyPhoto'}), c(DD, 1220, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', expr: 'sad'})], [{at: 'l0+0.6', who: DD, look: [-1, 0.3]}]), {
    timeJump: true,
    action: 'Ana on the bench holding the family photo she saved. Dad beside her.',
    lines: [N("(grieving) Ours / was one of them.", 0.8)],
  }),
  sh('dad-says', stage('hall', '', push(2.6, 2.75, 1160, 540), [c(AA, 1060, 940, {pose: 'sitChair', seat: 'bench', facing: 'right', outfit: 'cold', expr: 'sad', hold: 'familyPhoto'}), c(DD, 1220, 940, {pose: 'sitChair', seat: 'bench', facing: 'left', expr: 'sad'})], [{at: 'l0+0.4', who: DD, look: [-1, 0.2]}, {at: 'l0+2.4', who: AA, look: [0.6, 0.3]}]), {
    action: 'Dad nods at the hall: Mrs. Kaur with her cat, the neighbours, the kids.',
    lines: [SI("(tender) We lost a house. / Look around you. // We didn't lose *anyone*.")],
  }),
  sh('weeks', vol('cone', {}), {
    hud: {place: 'AUCKLAND', time: 'THE NEXT TWO MONTHS'},
    timeJump: true,
    dev: 'the cone grows, then stops',
    science: {text: 'After the first explosive phase, Auckland eruptions typically build a scoria cone from lava fountains and may send slow lava flows; the whole eruption lasts weeks to months, then the vent never erupts again.', source: 'Hayward, ‘Volcanoes of Auckland’ (2019)'},
    action: 'Time-lapse: night after night a fountain of lava builds a black cone where the park was; a slow tongue of lava creeps down one street; then it goes quiet.',
    lines: [N("(awed) For two months, it fountained lava *every* night and built itself a hill. / Then it stopped, for *good*.")],
  }),
  sh('crater-edge', vol('crateredge'), {
    hud: {place: 'KŌWHAI STREET', time: 'TWO MONTHS LATER'},
    beats: ['heart'],
    dev: 'what is left of the street',
    action: 'Ana and Mum in hard hats at a safety fence. Beyond it, where Kōwhai Street ran, a grey slope of ash and a steaming crater rim. Half a red letterbox sticks out of the ash.',
    lines: [N("(sad) When it was safe, Mum took me to the fence. Our street was under three metres of ash. / I could see the top of our *letterbox*.")],
  }),
  sh('new-house', stage('villa', 'new', push(1.3, 1.45, 1300, 600), [c(DD, 1500, 930, {facing: 'left', expr: 'smile', hold: 'bag', pose: 'hold'}), c(AA, 1180, 930, {facing: 'right', outfit: 'home', expr: 'smile', hold: 'familyPhoto', pose: 'hold'}), c(LL, 1000, 930, {facing: 'right', expr: 'laugh'})], [{at: 'l0+0.8', who: AA, put: 'table', prop: 'familyPhoto'}, {at: 'l0+0.4', who: LL, loop: 'bounce', dur: 1.2}], {items: [{prop: 'familyPhoto', x: 1280, y: 380, from: 'l0+1.4'}]}), {
    hud: {place: 'AUCKLAND', time: 'THREE MONTHS LATER'},
    action: 'A different house, half-unpacked. Ana hangs the family photo on the new wall. Lui bounces on the boxes.',
    lines: [N("(warm) We moved into a house on the other side of town. / I hung our photo up *first*.")],
  }),
  sh('gas-bump', stage('backyard', '', push(1.6, 1.75, 1150, 640), [c(LL, 1080, 950, {pose: 'kneel', facing: 'right', expr: 'laugh'}), c(AA, 900, 930, {facing: 'right', outfit: 'home', expr: 'smile'})], [{at: 'l0+0.4', who: LL, loop: 'bounce', dur: 1}]), {
    beats: ['laugh'],
    action: 'A new garden. Lui feeds two new goldfish in a new pond.',
    lines: [N("(amused) Lui got two new goldfish. / He named them *Gas* and *Bump*.")],
  }),
  sh('schools', stage('creek', '', push(1.2, 1.35, 1000, 580), [c(AA, 900, 940, {pose: 'kneel', facing: 'right', hold: 'thermo', outfit: 'cold', expr: 'smile'}), c('extra:301', 700, 940, {facing: 'right', outfit: 'cold', expr: 'smile'}), c('extra:308', 1100, 940, {facing: 'left', outfit: 'cold', expr: 'smile', hold: 'list', pose: 'hold'})], [{at: 'l0+1.0', who: 'extra:308', look: [-1, 0.4]}]), {
    dev: 'what changed: schools test their creeks',
    action: 'A creek again; this time Jaz holds the notebook.',
    lines: [N("(proud) Now schools all over the city test their creeks *every* week, / and send the numbers to the volcano scientists.")],
  }),
  sh('one-year', vol('oneyear', {people: true}), {
    hud: {place: 'AUCKLAND', time: 'ONE YEAR LATER'},
    timeJump: true,
    cue: 'triumph',
    beats: ['heart'],
    dev: 'a year later',
    action: 'A year later: the new hill, grass on its slopes, a path to the top. The Tupou family at the rim with a kite; the city all around.',
    lines: [N("(warm) A year later, the new hill had grass on it, / and a path to the *top*.")],
  }),
  sh('the-name', vol('oneyear', {people: true}), {
    action: 'A carved wooden sign at the foot of the path, the hill green above it.',
    lines: [N("(warm) Mana whenua, the people of this land, / gave it its *name*.")],
  }),
  sh('bedroom', vol('oneyear', {people: true, close: true}), {
    beats: ['heart'],
    action: 'Ana at the rim, the notebook open: an old map with her circle, now with the hill drawn in its centre.',
    lines: [N("(wistful) Auckland has fifty-four volcanoes now. / The newest one is where my *bedroom* used to be.", 1.0)],
  }),
  sh('ana-now', vol('oneyear', {people: false}), {
    action: 'The hill at sunset, the city lights coming on around it.',
    lines: [N("(warm) I study volcanoes now, like Mum. / I *still* keep a notebook.", 0.8)],
  }),
  sh('end', sc('end', {motif: 'volcano', prompt: 'WHAT WOULD YOU TAKE? TELL US BELOW ↓'}), {cue: 'end', action: 'End screen.', lines: [N("(warm) If you had twenty minutes to leave, what would *you* take? / Tell us in the comments.", 1.0)]}),
];

export const vol02: Episode = {
  id: 'vol02',
  file: 'FILE 002',
  title: 'A Volcano Started Growing Under Our City',
  youtubeTitle: 'There Are 53 Volcanoes Under This City. Then a New One Woke Up',
  titleAlternates: ['A Volcano Started Growing Under Our City. We Had 4 Days', 'My Mum Studies Volcanoes. Then One Woke Up Under Our City'],
  thumbnailText: 'IT’S UNDER US',
  commentPrompt: 'If you had twenty minutes to leave, what would you take?',
  logline:
    'Auckland is built on about fifty volcanoes, and one Monday a new one starts to rise. Twelve-year-old Ana keeps a notebook for her class creek project. Her mum studies volcanoes. They have four days. Every clue is real science. Watch to the end.',
  tags: ['volcano', 'auckland volcano', 'new volcano', 'what if a volcano erupted in a city', 'animated story', 'science story', 'earthquake swarm', 'evacuation', 'new zealand', 'the blink files', 'kids science'],
  pinnedComment: 'Every science fact in this File is real, with sources in the description. Which clue would you have noticed first?',
  fps: 30,
  style: 'cinema',
  world: {
    facts: [
      'Four days, Monday 7:40 AM to Thursday 11:52 PM; the eruption is at a new vent at the end of Kōwhai Street',
      'Power, phones and internet work throughout; power to the zone is cut on Thursday',
      'The zone is evacuated by Thursday 6 PM; nobody inside it is hurt',
      'Mum is at the monitoring centre until Thursday evening',
    ],
    banLines: [{re: '\\blava (poured|flowed) (into|through) (the )?hall', why: 'the hall is 8 km outside the zone'}],
    banProps: [],
    onlySfx: [],
    banSets: [],
    presence: [{who: 'mele', from: 'mum-arrives', exceptSets: ['ops', 'villa'], why: 'Mum is at the monitoring centre from Monday breakfast until Thursday evening'}],
  },
  spoilers: ['our street', 'our house', 'bedroom', 'kōwhai', 'end of our', 'her map', 'fizzing', 'goldfish', 'bus scraped'],
  questionBank: 'episodes/vol02-volcano-under-our-city/world-model.md',
  narratorIs: ['Ana'],
  mainCast: ['ana', 'lui', 'sione', 'mele'],
  narratorCast: 'ana',
  speakerCast: {ANA: 'ana', LUI: 'lui', SIONE: 'sione', MELE: 'mele', TEACHER: 'teacher', COLLEAGUE: 'extra:64', JAZ: 'extra:308'},
  costumeByDay: false,
  noAngry: ['ana', 'lui', 'sione', 'mele'],
  dialogueLedger: 'episodes/vol02-volcano-under-our-city/dialogue-review.md',
  shots: autoSplit(rawShots, {ANA: 'ana', LUI: 'lui', SIONE: 'sione', MELE: 'mele', TEACHER: 'teacher', COLLEAGUE: 'extra:64', JAZ: 'extra:308'}, [], {sentences: true}),
};
