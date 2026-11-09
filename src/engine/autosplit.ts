import type {Line, Shot} from './schema';
import {line} from './delivery';

/**
 * Pacing helper (docs/00 Q6): turn a stage shot that carries several lines into a sequence of camera setups, one
 * line each, so dialogue plays as shot / reverse-shot instead of one long held frame.
 *
 * - The first setup keeps everything the original shot had (chapter, HUD, science, dev, beats, cue, sfx …).
 * - Each later setup frames the speaker of its line (from `speakerCast`), a little tighter, and starts from the
 *   cast's state at the end of the previous setup (pose, facing, position, expression, what they hold), so the props,
 *   face and presence gates still hold across the new cuts.
 * - Acts timed to line k ('lk±s') move to setup k (as 'l0±s'); acts timed in seconds stay in the first setup.
 *
 * Only `scene: 'stage'` shots with 2+ lines are split; ids become `<id>`, `<id>~2`, `<id>~3` …
 */
type Cast = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
type Act = {at: number | string; who: string; [k: string]: unknown};

/** Items in setup j: those timed to line j appear on cue ('l0±s'), earlier ones are already there, later ones not yet;
 *  an item that leaves (until) on line j leaves on cue, before j it is gone. Seconds-timed items: present, never leaving. */
const itemsFor = (items: unknown, j: number) =>
  ((items ?? []) as {from?: unknown; until?: unknown}[]).flatMap((it) => {
    const f = lineOf(it.from);
    const u = lineOf(it.until);
    if (f && f.k > j) return [];
    if (u && u.k < j) return [];
    if (j === 0) return [{...it, ...(f ? {from: f.k === 0 ? `l0${f.off}` : undefined} : {}), ...(u ? {until: u.k === 0 ? `l0${u.off}` : undefined} : {})}];
    if (!u && it.until !== undefined) return [];
    return [{...it, from: f && f.k === j ? `l0${f.off}` : undefined, until: u && u.k === j ? `l0${u.off}` : undefined}];
  });

const lineOf = (at: unknown) => {
  const m = /^l(\d+)([+-][\d.]+)?$/.exec(String(at));
  return m ? {k: Number(m[1]), off: m[2] ?? ''} : null;
};

const applyActs = (cast: Cast[], acts: Act[]) => {
  const out = cast.map((c) => ({...c}));
  for (const a of acts) {
    const c = out.find((x) => x.who === a.who);
    if (!c) continue;
    if (a.pose !== undefined) c.pose = a.pose;
    if (a.expr !== undefined) c.expr = a.expr;
    if (a.facing !== undefined) c.facing = a.facing;
    if (a.to !== undefined) c.x = Array.isArray(a.to) ? (a.to as number[])[0] : (a.to as number);
    if (a.take !== undefined && a.prop) c.hold = a.prop;
    if (a.put !== undefined && c.hold === a.prop) c.hold = undefined;
    if ('seat' in a) c.seat = a.seat;
  }
  return out;
};

/** Split a long line at the sentence boundary nearest its middle: narration of 13+ words, or (v5.2) a character's line
 *  of 9+ words, when it has 2+ sentences. A character's second sentence then plays on a tighter setup on the speaker
 *  (the editor's cut-in mid-speech). Works on the marked-up delivery (`say`), so stress and beats survive the split. */
const splitSentences = (shots: Shot[], characters: boolean): Shot[] =>
  shots.map((s) => {
    const lines = s.lines ?? [];
    if (lines.length !== 1 || s.scene === 'end' || s.scene === 'title') return s;
    const l0 = lines[0];
    const narr = l0.speaker === 'NARRATOR';
    if (!narr && !characters) return s;
    // never split a character's line in a shot where props change hands or appear on cue: those acts are timed
    // into the line, and a cut in the middle would lose them (the narration split keeps acts in its first setup)
    const pp = (s.props ?? {}) as {acts?: Record<string, unknown>[]; items?: Record<string, unknown>[]};
    if (!narr && ((pp.acts ?? []).some((x) => x.give !== undefined || x.take !== undefined || x.put !== undefined || x.prop !== undefined) || (pp.items ?? []).some((x) => x.from !== undefined || x.until !== undefined))) return s;
    if (l0.text.split(/\s+/).length < (narr ? 13 : 9)) return s;
    const raw = l0.say ?? l0.text;
    const cuts = [...raw.matchAll(/[.!?…]\*?(?=\s+(?:\/{1,2}\s+)?\*?[A-Z])/g)].map((m) => (m.index ?? 0) + m[0].length);
    if (!cuts.length) return s;
    const mid = raw.length / 2;
    const at = cuts.reduce((b, c) => (Math.abs(c - mid) < Math.abs(b - mid) ? c : b), cuts[0]);
    const part = (r: string, pause?: number, g?: Line['g']) => line(l0.speaker, `${l0.feel ? `(${l0.feel}) ` : ''}${r.replace(/^\s*\/{1,2}\s+/, '').trim()}`, pause, g);
    return {...s, lines: [part(raw.slice(0, at), undefined, l0.g), part(raw.slice(at), l0.pause)]} as Shot;
  });

export const autoSplit = (shots0: Shot[], speakerCast: Record<string, string>, skip: string[] = [], opts: {sentences?: boolean; characters?: boolean} = {}): Shot[] => {
  const shots = opts.sentences ? splitSentences(shots0, !!opts.characters) : shots0;
  const out: Shot[] = [];
  for (const s of shots) {
    const p = (s.props ?? {}) as Record<string, any>;
    const lines = s.lines ?? [];
    if (lines.length < 2 || skip.includes(s.id) || s.scene === 'end' || s.scene === 'title') {
      out.push(s);
      continue;
    }
    if (s.scene !== 'stage') {
      // full-frame views and diagrams: same picture, the animation continues across the parts (props.part = [i, n])
      lines.forEach((line, k) =>
        out.push((k === 0 ? {...s, lines: [line], props: {...p, part: [0, lines.length]}} : {id: `${s.id}~${k + 1}`, scene: s.scene, props: {...p, part: [k, lines.length]}, lines: [line], action: 'Continues.'}) as Shot),
      );
      continue;
    }
    const acts = ((p.acts ?? []) as Act[]).slice();
    let cast = ((p.cast ?? []) as Cast[]).map((c) => ({...c}));
    const cam0 = (p.cam ?? [[0, 1, 960, 540]]) as number[][];
    const z0 = cam0[cam0.length - 1][1];
    lines.forEach((line, k) => {
      const mine = acts
        .filter((a) => {
          const l = lineOf(a.at);
          return k === 0 ? !l || l.k === 0 : l?.k === k;
        })
        .map((a) => {
          const l = lineOf(a.at);
          return l ? {...a, at: `l0${l.off}`} : a;
        });
      if (k === 0) {
        out.push({...s, lines: [line], props: {...p, cast, acts: mine, ...(p.items ? {items: itemsFor(p.items, 0)} : {})}} as Shot);
      } else {
        const who = speakerCast[line.speaker];
        const sp = cast.find((c) => c.who === who);
        const x = sp ? sp.x : cam0[cam0.length - 1][2];
        const y = sp ? sp.y - 320 * sp.depth * 0.75 : cam0[cam0.length - 1][3];
        const z = Math.min(3.2, z0 * 1.12 + 0.15);
        out.push({
          id: `${s.id}~${k + 1}`,
          scene: 'stage',
          props: {...p, cast, acts: mine, cam: [[0, z, x, y], [1, z * 1.14, x, y]], items: itemsFor(p.items, k)},
          lines: [line],
          action: `Reverse: ${line.speaker.toLowerCase()} answers.`,
          ...(s.letterbox ? {letterbox: true} : {}),
          ...(s.thread ? {thread: s.thread} : {}),
        } as Shot);
      }
      cast = applyActs(cast, mine);
    });
  }
  return out;
};
