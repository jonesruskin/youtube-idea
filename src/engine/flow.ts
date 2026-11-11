import type {Shot} from './schema';
import {applyActs} from './autosplit';
import {frameCamera} from './framing';
import {groundAt} from './grounds';

/**
 * One take per scene (docs/00 P15). The CEO: "if a scene is taking place in a house, then there shouldn't be any cuts if
 * it isn't absolutely necessary - it can be taken in one shot with different camera movements and angles."
 *
 * Shots stay separate in the script (lines, beats, story markers keep their place), but a boundary between two shots of
 * the same scene is made seamless, so the viewer sees one continuous take:
 *  - the cast carries straight over: the next shot starts with everyone exactly where, how and holding what the last
 *    one left them (walk ends, poses, faces, props); someone the next beat wants elsewhere walks there; a newcomer
 *    walks in from the side; nobody pops in or out;
 *  - the camera carries straight over: the next shot starts on the last shot's final framing and then moves (push,
 *    pan, reframe) to its own angle, re-aimed at where its subject now actually stands;
 *  - idle motion runs on the film clock (useShot().gframe), so breathing, drift and set animation never reset.
 * A boundary stays a cut only when the scene really changes (another set or variant, a time jump, a day tag, another
 * thread or look, a transition) or the script gives a reason: `cut: 'why'` on the later shot. Lint's continuity gate
 * fails any other same-scene cut.
 */
type Cast = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
type Act = {at: number | string; who: string; [k: string]: unknown};

const SCENE_KEYS = ['cast', 'acts', 'cam', 'items', 'part'];
const sceneOf = (s: Shot) => {
  const p = (s.props ?? {}) as Record<string, unknown>;
  return JSON.stringify(Object.keys(p).filter((k) => !SCENE_KEYS.includes(k)).sort().map((k) => [k, p[k]]));
};

/** Can B continue A's take? Returns null if yes, or why not. */
export const takeBreak = (a: Shot, b: Shot): string | null => {
  if (a.scene !== 'stage' || b.scene !== 'stage') return 'not a stage scene';
  const pa = (a.props ?? {}) as Record<string, unknown>;
  const pb = (b.props ?? {}) as Record<string, unknown>;
  if (pa.set !== pb.set) return 'another place';
  if ((pa.v ?? '') !== (pb.v ?? '')) return 'the place changes (variant)';
  if (b.timeJump) return 'a time jump';
  if (b.hud) return 'a new day or place tag';
  if ((a.thread ?? '') !== (b.thread ?? '')) return 'another thread';
  if ((a.look ?? '') !== (b.look ?? '')) return 'another look';
  if (!!a.letterbox !== !!b.letterbox) return 'the letterbox changes';
  if (b.transition && b.transition !== 'cut') return `a ${b.transition} transition`;
  if ((b as {cut?: string}).cut) return `script: ${(b as {cut?: string}).cut}`;
  if (sceneOf(a) !== sceneOf(b)) return 'the set state changes';
  const seatsA = new Map(((pa.cast ?? []) as Cast[]).map((c) => [c.who, c.seat ?? null]));
  for (const c of (pb.cast ?? []) as Cast[]) if (seatsA.has(c.who) && (seatsA.get(c.who) ?? null) !== (c.seat ?? null)) return `${c.who} sits or stands up between shots`;
  return null;
};

const WALK = 320; // px per second at depth 1.2, an unhurried indoor walk
/** Sitting, kneeling, lying or crouching people stay put: flow never walks them anywhere. */
const settled = (c: Record<string, unknown>) => !!c.seat || /^(sit|kneel|lie|crouch)/.test(String(c.pose ?? ''));

/** The same scene for room continuity: same set, variant and thread, no time jump or new day/place tag between. */
const sameRoom = (a: Shot, b: Shot) => {
  const pa = (a.props ?? {}) as Record<string, unknown>;
  const pb = (b.props ?? {}) as Record<string, unknown>;
  return a.scene === 'stage' && b.scene === 'stage' && pa.set === pb.set && (pa.v ?? '') === (pb.v ?? '') && (a.thread ?? '') === (b.thread ?? '') && !b.timeJump && !b.hud;
};

/** Across a real cut (or a cutaway insert) inside one scene, people seen there are still in the room where they were:
 *  add them to the next stage shot unless they would stand where someone else is (then the author must decide). */
const keepRoom = (prev: Shot, s: Shot): Shot => {
  const pp = (prev.props ?? {}) as Record<string, any>;
  const ps = (s.props ?? {}) as Record<string, any>;
  const end = applyActs((pp.cast ?? []) as Cast[], (pp.acts ?? []) as Act[], pp.set, pp.v ?? '');
  const cast = [...((ps.cast ?? []) as Cast[])];
  const marks = cast.map((c) => {
    const w = ((ps.acts ?? []) as Act[]).filter((x) => x.who === c.who && x.to !== undefined).pop();
    return w ? (Array.isArray(w.to) ? (w.to as number[])[0] : (w.to as number)) : c.x;
  });
  for (const e of end) {
    if (cast.some((c) => c.who === e.who) || (e as {left?: boolean}).left) continue;
    if ([...marks, ...cast.map((c) => c.x)].some((x) => Math.abs(x - e.x) < 150)) continue;
    cast.push({...e});
  }
  return cast.length === ((ps.cast ?? []) as Cast[]).length ? s : ({...s, props: {...ps, cast}} as Shot);
};

export const flow = (shots: Shot[], speakerCast: Record<string, string> = {}): Shot[] => {
  const out: Shot[] = [];
  let lastStage: Shot | null = null;
  for (const s0 of shots) {
    const a = out[out.length - 1];
    // room continuity across cutaways and kept cuts
    const s = s0;
    const pushOut = (x: Shot) => {
      out.push(x);
      if (x.scene === 'stage') lastStage = x;
      else if (x.scene !== 'closeup' && x.scene !== 'moon' && x.scene !== 'news') lastStage = null; // another place
    };
    const why = a ? takeBreak(a, s) : 'first shot';
    if (!a || why) {
      pushOut(a && a.scene === 'stage' && s.scene === 'stage' && ((a.props ?? {}) as {set?: string}).set === ((s.props ?? {}) as {set?: string}).set ? ({...s, takeBreak: why} as Shot) : s);
      continue;
    }
    const pa = (a.props ?? {}) as Record<string, any>;
    const pb = (s.props ?? {}) as Record<string, any>;
    const endA = applyActs((pa.cast ?? []) as Cast[], (pa.acts ?? []) as Act[], pa.set, pa.v ?? '');
    const target = (pb.cast ?? []) as Cast[];
    const acts: Act[] = [];
    const cast: Cast[] = [];
    let walkEnd = 0;
    // where the last shot left everyone; B's own marks are reached by walking, its faces and poses by acting
    for (const t of target) {
      const e = endA.find((c) => c.who === t.who);
      if (!e) {
        // someone the last framing didn't show: if their mark was out of that view they were already standing there;
        // if it was in view, they walk in from the nearer side (nobody appears from nothing)
        const keyA = frameCamera(pa.cam ?? [[0, 1, 960, 540]], pa.cast ?? [], pa.acts ?? []).slice(-1)[0];
        const half = 960 / keyA[1];
        if (Math.abs(t.x - keyA[2]) > half + 80) {
          cast.push({...t});
          continue;
        }
        const fromX = t.x < keyA[2] ? keyA[2] - half - 160 : keyA[2] + half + 160;
        const dur = Math.min(3, Math.max(0.9, Math.abs(t.x - fromX) / WALK));
        const gy = groundAt(pb.set, pb.v ?? '', fromX, t.depth ?? 1.2);
        cast.push({...t, x: fromX, y: gy ?? t.y, facing: t.x > fromX ? 'right' : 'left'});
        acts.push({at: 0, who: t.who, to: t.x, dur});
        if ((t.facing ?? 'front') !== (t.x > fromX ? 'right' : 'left')) acts.push({at: dur, who: t.who, facing: t.facing ?? 'front'});
        walkEnd = Math.max(walkEnd, dur);
        continue;
      }
      const start: Cast = {...t, x: e.x, y: e.y, facing: e.facing ?? t.facing, pose: e.pose ?? t.pose, expr: e.expr ?? t.expr, hold: e.hold, holdL: e.holdL ?? t.holdL, hoodUp: e.hoodUp ?? t.hoodUp};
      cast.push(start);
      const own = ((pb.acts ?? []) as Act[]).some((x) => x.who === t.who && x.to !== undefined && (typeof x.at === 'number' ? x.at < 1.5 : x.at === 'l0' || /^l0[+-]/.test(String(x.at))));
      const aStart = ((pa.cast ?? []) as Cast[]).find((c) => c.who === t.who);
      const stale = aStart && Math.abs(aStart.x - e.x) > 30 && Math.abs(t.x - aStart.x) < 40; // B's mark is where A began
      if (Math.abs(t.x - e.x) > 30 && !own && !stale && !settled(start)) {
        const dur = Math.min(2.6, Math.max(0.7, Math.abs(t.x - e.x) / WALK));
        acts.push({at: 0.05, who: t.who, to: t.x, dur});
        walkEnd = Math.max(walkEnd, dur);
        if ((t.facing ?? 'front') !== (t.x > e.x ? 'right' : 'left')) acts.push({at: dur + 0.1, who: t.who, facing: t.facing ?? 'front'});
      } else if ((t.facing ?? 'front') !== (start.facing ?? 'front')) acts.push({at: 0.2, who: t.who, facing: t.facing ?? 'front'});
      if (t.pose && t.pose !== start.pose) acts.push({at: 0.25, who: t.who, pose: t.pose});
      if (t.expr && t.expr !== start.expr) acts.push({at: 0.3, who: t.who, expr: t.expr});
    }
    // people from the last shot who are not in this one's list leave: anyone the camera can still see walks out of
    // the frame (nobody vanishes mid-take); anyone already out of view has gone. Someone standing where the next beat
    // puts another person (a memory swapping old Ito for young Ito) means the scene really changes: keep the cut.
    const keyAv = frameCamera(pa.cam ?? [[0, 1, 960, 540]], pa.cast ?? [], pa.acts ?? []).slice(-1)[0];
    const halfV = 960 / keyAv[1];
    let swap = '';
    // B's own camera, over its whole move: who could it see?
    const keysB = ((pb.cam ?? [[0, 1, 960, 540]]) as (number | string)[][]).map((k) => [k[1] as number, k[2] as number, k[3] as number]);
    const seenByB = (x: number) => keysB.some(([z, cx]) => Math.abs(x - cx) < 960 / z + 60);
    for (const e of endA) {
      if (target.some((t) => t.who === e.who) || (e as {left?: boolean}).left) continue;
      const clashNew = target.find((t) => !endA.some((x) => x.who === t.who) && Math.abs(t.x - e.x) < 70);
      if (clashNew) swap = `${clashNew.who} takes ${e.who}'s place`;
      if (!seenByB(e.x) || settled(e)) {
        cast.push({...e}); // off camera for this beat, or sitting down: still where they were
        continue;
      }
      // the script leaves them out of a beat whose camera would see them: they walk out of the frame
      const cx = keysB[keysB.length - 1][1];
      const half = 960 / Math.min(...keysB.map((k) => k[0]));
      const toX = e.x < cx ? cx - half - 260 : cx + half + 260;
      cast.push({...e, left: true});
      acts.push({at: 0.1, who: e.who, to: toX, dur: Math.min(2.8, Math.max(1, Math.abs(toX - e.x) / WALK))});
    }
    if (swap) {
      pushOut({...s, takeBreak: swap} as Shot);
      continue;
    }
    // camera: start on A's final framing, then move to B's angle, re-aimed at where B's subject really stands
    const keyA = frameCamera(pa.cam ?? [[0, 1, 960, 540]], pa.cast ?? [], pa.acts ?? []).slice(-1)[0];
    const camB = ((pb.cam ?? [[0, 1, 960, 540]]) as (number | string)[][]).map((k) => [...k]);
    const speaker = (s.lines ?? [])[0]?.speaker;
    const subject = (speaker && speakerCast[speaker]) || target.find((t) => !String(t.who).startsWith('extra'))?.who;
    const tSub = target.find((t) => t.who === subject);
    const nSub = cast.find((c) => c.who === subject);
    const dx = tSub && nSub && Math.abs(tSub.x - (nSub.x as number)) > 30 && !acts.some((x) => x.who === subject && x.to !== undefined) ? (nSub.x as number) - tSub.x : 0;
    for (const k of camB) if (typeof k[2] === 'number') k[2] = (k[2] as number) + dx;
    const settle = (s.lines ?? []).length ? `l0+${Math.max(0.5, Math.min(1.4, walkEnd * 0.6 + 0.4)).toFixed(2)}` : 0.3;
    const moved = Math.abs(keyA[1] - (camB[0][1] as number)) > 0.04 || Math.hypot(keyA[2] - (camB[0][2] as number), keyA[3] - (camB[0][3] as number)) > 30;
    const cam = moved
      ? [[0, keyA[1], keyA[2], keyA[3], keyA[4] ?? 0], [settle, ...camB[0].slice(1)], ...camB.slice(1).filter((k) => typeof k[0] !== 'number' || (k[0] as number) > 0.35)]
      : [[0, keyA[1], keyA[2], keyA[3], keyA[4] ?? 0], ...camB.slice(1)];
    // a take never holds dead still: if B's own move is tiny, keep easing in a little
    const last = cam[cam.length - 1] as (number | string)[];
    if (cam.length < 2 || (Math.abs((last[1] as number) - keyA[1]) < 0.03 && Math.hypot((last[2] as number) - keyA[2], (last[3] as number) - keyA[3]) < 20))
      cam.push([1, (last[1] as number) * 1.07, last[2], last[3]]);
    pushOut({...s, flow: true, props: {...pb, cast, acts: [...acts, ...((pb.acts ?? []) as Act[])], cam}} as Shot);
  }
  return out;
};
