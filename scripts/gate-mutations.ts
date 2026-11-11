// Known defects, planted on purpose (scripts/test-gates.ts). Each entry is a mistake the CEO once caught in a
// delivered video: `apply` re-creates it in File 001, `expect` is the lint error that must now stop it.
// When a new kind of mistake is found: fix it, add the gate, then add its mutation here so the gate can never rot.
import type {Episode} from '../src/engine/schema';

type M = {caught: string; expect: RegExp; apply: (e: Episode) => void};
const shot = (e: Episode, id: string) => {
  const s = e.shots.find((x) => x.id === id) as any;
  if (!s) throw new Error(`gate-mutations: no shot "${id}"`);
  return s;
};
const who = (s: any, w: string) => s.props.cast.find((c: any) => c.who === w);

export const MUTATIONS: Record<string, M> = {
  faceBehind: {caught: "v5.3 · Mira's face blocked behind her Mum", expect: /Face: .* face is behind/, apply: (e) => { who(shot(e, 'mum-thanks'), 'mira').x = who(shot(e, 'mum-thanks'), 'mum').x - 30; }},
  backTurned: {caught: 'v5.2 · Kai stops behind Mum, not facing her', expect: /Facing: /, apply: (e) => { const s = shot(e, 'mum-returns'); s.props.acts = s.props.acts.filter((a: any) => !(a.who === 'you' && a.facing === 'left')); }},
  walkBack: {caught: 'v5.3 · Kai opens the door, then walks back', expect: /Staging: you walks to .* and straight back/, apply: (e) => { shot(e, 'ito-door').props.acts.push({at: 0.4, who: 'you', to: 1060, dur: 0.8}); }},
  noPlace: {caught: 'v5.3 · supermarket, then suddenly at home, nothing said', expect: /Place: the story moves to "market"/, apply: (e) => { delete shot(e, 'grab').hud; }},
  propOnCut: {caught: 'v5.3 · the drawing appears in her hand out of thin air', expect: /Props: mira takes sunDrawing on the cut/, apply: (e) => { shot(e, 'this').props.acts.find((a: any) => a.take).at = 0.05; }},
  propVanish: {caught: 'v3.1 · props pop in and out between shots', expect: /Props: mira (ends|starts)/, apply: (e) => { who(shot(e, 'sunrise'), 'mira').hold = undefined; }},
  noFeeling: {caught: 'v5.2 · "You kept them alive." has no emotion', expect: /Delivery: no feeling on/, apply: (e) => { delete (shot(e, 'mum-thanks').lines[0] as any).feel; }},
  wrongFace: {caught: 'v5.1 · Ito smiling while shouting "Everyone out!"', expect: /Delivery: ITO says .* with a smile face/, apply: (e) => { who(shot(e, 'invisible'), 'ito').expr = 'smile'; shot(e, 'invisible').props.acts = shot(e, 'invisible').props.acts.filter((a: any) => !(a.who === 'ito' && a.expr)); }},
  flatRead: {caught: 'v5.2 · no stressed words, no pauses', expect: /has no \*stress\* or \/ beat marked/, apply: (e) => { delete (shot(e, 'mum-thanks').lines[0] as any).say; }},
  noTwists: {caught: 'v5.3 · File 002 has no twists and turns', expect: /Story: \d twists declared/, apply: (e) => { e.story!.twists = e.story!.twists.slice(0, 2); }},
  lateHook: {caught: 'v5.3 · File 002: the event arrives at the end', expect: /Story: the hook .* must be on screen within 0:30/, apply: (e) => { e.story!.hook.shot = 'harbour'; }},
  noMystery: {caught: 'v5.3 · File 002 has no substance (no question to wait for)', expect: /Story: the mystery .* is planted/, apply: (e) => { e.story!.mystery.plants = ['packed']; }},
  noContract: {caught: 'v5.3 · a File built with no story contract', expect: /Story: no story contract/, apply: (e) => { delete e.story; }},
  angryHero: {caught: 'v4 · faces wrong for the character', expect: /Expression: mira is angry/, apply: (e) => { who(shot(e, 'mum-thanks'), 'mira').expr = 'angry'; }},
  radioMum: {caught: 'v4.2 · Mum on a radio instead of a phone in 2026', expect: /World: /, apply: (e) => { shot(e, 'hosp-wide').lines[0].text = 'The phone networks are down, so I am on the radio.'; }},
  clippedTime: {caught: 'v4.2 · clipped numbers ("seven-oh-four")', expect: /Dialogue: .* clips a time/, apply: (e) => { shot(e, 'jupiter-out').lines[0].text = 'At eight-oh-four, it did.'; }},
  sceneCut: {caught: 'v5.5 · a cut inside a scene that could be one take', expect: /Take: .* cuts inside the scene/, apply: (e) => { const s: any = (e.shots as any[]).find((x: any) => x.flow); s.flow = false; }},
  floating: {caught: 'v5.5 · a character floating above the floor', expect: /Ground: .*\((floating|sunk)/, apply: (e) => { const s: any = (e.shots as any[]).find((x: any) => x.props?.set === 'kitchen' && (x.props?.cast ?? []).some((c: any) => !c.seat && c.who !== 'biscuit')); s.props.cast.find((c: any) => !c.seat && c.who !== 'biscuit').y -= 80; }},
  offSurface: {caught: 'v5.5 · a character standing where there is no floor (on the stairs\' air, off the quay)', expect: /Ground: .* (nothing to stand on|walks off the surface)/, apply: (e) => { const s: any = (e.shots as any[]).find((x: any) => x.props?.set === 'quay' || x.props?.set === 'stairs'); s.props.cast[0].x = s.props.set === 'quay' ? 100 : -900; }},
  bland: {caught: 'v5.5 · a bland File: no transitions, no sound effects, one music cue', expect: /Craft: .*transitions a minute/, apply: (e) => { for (const s of e.shots as any[]) { s.transition = undefined; s.sfx = undefined; } }},
  hurried: {caught: 'v5.5 · a hurried File: talk wall to wall, nothing held', expect: /Craft: .*(without words|of the film is talk)/, apply: (e) => { for (const s of e.shots as any[]) { s.min = undefined; s.tail = undefined; s.lead = 0; if ((s.lines ?? []).length) s.lines = [...s.lines, ...s.lines].map((l: any) => ({...l, pause: 0})); } }},
  cropHead: {caught: "v5.3 · Mira's head half cut off by the frame edge", expect: /Frame: .* head is cut by/, apply: (e) => { shot(e, 'a-picture~2').props.cam = [[0, 3.2, 940, 620], [1, 3.65, 940, 620]]; }},
  shortFilm: {caught: 'v5.1 · episode under the 8-minute mid-roll floor', expect: /Runtime .* is under 8:00/, apply: (e) => { e.shots = e.shots.slice(0, 60); }},
};
