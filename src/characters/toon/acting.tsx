import React from 'react';
import {Easing} from 'remotion';
import type {Speaker} from '../../engine/schema';
import {useShot} from '../../engine/shot-context';
import {Dog, type DogPose} from '../Dog';
import {visemeAt} from '../visemes';
import {CAST, extra, HERO_PX, type Outfit, type ToonDesign} from './design';
import {blendFace, type Expr, FACES, onsetOf, SETTLE, SETTLE_HOLD, SETTLE_LEN} from './face';
import {blendPose, gait, POSES, type PoseName, STRIDE} from './poses';
import type {PropKind} from './props';
import {Toon, type SeatKind, type ToonState} from './Toon';

/**
 * The acting system. A shot lists its CAST (who stands where, at what depth) and ACTS (timed directions:
 * walk to x, change pose, change expression, wave, nod, shiver…). Every frame resolves each character:
 * poses blend with ease + a little overshoot, walking derives its cycle from distance travelled (no foot
 * sliding), and every character breathes, blinks and lip-syncs to its own lines automatically. Listeners turn
 * their eyes (and, facing front, their head) to whoever is speaking, and the speaker glances at the nearest listener.
 */
export type Who = 'you' | 'mira' | 'ito' | 'itoYoung' | 'itoMid' | 'mum' | 'biscuit' | `extra:${number}`;
export type Facing = 'right' | 'left' | 'front' | 'back';
export type CastEntry = {
  who: Who;
  x: number;
  y: number;
  /** Depth scale: 1 = the hero is 300 px tall. Everyone standing together shares one depth. */
  depth: number;
  facing?: Facing;
  pose?: PoseName | DogPose;
  expr?: Expr;
  outfit?: Outfit;
  hoodUp?: boolean;
  hold?: PropKind;
  holdL?: PropKind;
  look?: [number, number];
  turn?: number;
  breath?: boolean;
  rim?: boolean;
  opacity?: number;
  watchGlow?: number;
  /** Dog only. */
  wag?: number;
  /** What a chair-sitting pose sits on (default 'chair'); `seatLift` raises the sitter (px at depth 1) on a tall
   * stool so their feet rest on its footrest. Floor poses need none. */
  seat?: SeatKind;
  seatLift?: number;
  /** Ride on another cast member's back (piggyback): position follows the carrier every frame. */
  carriedBy?: Who;
  /** Lip-sync this cast member to a script speaker (for voiced extras, e.g. 'MAN'). */
  speaker?: string;
  /** Dog only: rounder (the Day 30 fan club). */
  fat?: boolean;
  /** Keep a pointing pose held (otherwise points relax after a beat, like people really do). */
  keepPose?: boolean;
};
export type LoopKind = 'wave' | 'nod' | 'shake' | 'shiver' | 'bounce' | 'clap' | 'talk' | 'jump' | 'tremble' | 'pant' | 'scratch' | 'stir' | 'tap';
export type Act = {
  /** Seconds into the shot, or "l<i>" (= start of the shot's i-th line), optionally "+0.4"/"-0.2". */
  at: number | string;
  who: Who;
  dur?: number;
  pose?: PoseName | DogPose;
  expr?: Expr;
  /** Move to x (or [x, y]). */
  to?: number | [number, number];
  gait?: 'walk' | 'run';
  facing?: Facing;
  look?: [number, number];
  turn?: number;
  hold?: PropKind | null;
  holdL?: PropKind | null;
  loop?: LoopKind;
  hoodUp?: boolean;
  opacity?: number;
  wag?: number;
  watchGlow?: number;
  /** Hold this pose (a point otherwise relaxes after ~1.2 s). */
  keep?: boolean;
  /** Hand the prop in the near hand (`prop`) to another cast member: both reach, it changes hands at the end. */
  give?: Who;
  /** The prop being given / put away / picked up (required with give, put and take). */
  prop?: PropKind;
  /** Put the held prop away (the hand goes to it, then it is gone) — the only way a prop may leave a hand. */
  put?: 'bag' | 'pocket' | 'table' | 'floor' | 'desk';
  /** Pick a prop up (the hand goes down to it, then it is held) — the only way a prop may appear in a hand. */
  take?: 'bag' | 'pocket' | 'table' | 'floor' | 'desk';
  /** Use the far hand for put/take/give (default: near hand). */
  left?: boolean;
};

/** Poses that sit on a chair-height seat (the seat is drawn under them, and stays when they stand up). */
export const CHAIR_POSES = ['sitChair', 'sitShow', 'sitDraw', 'sitPoint', 'sitPhone'];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIO = Easing.bezier(0.42, 0, 0.58, 1);
const easeBack = (k: number) => {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

export const designOf = (who: Who): ToonDesign | null => {
  if (who === 'biscuit') return null;
  if (who.startsWith('extra:')) return extra(Number(who.slice(6)));
  return CAST[who as keyof typeof CAST];
};

type LineInfo = {startInShot: number; end: number; start: number; speaker: string; text: string; chars?: number[]; words?: {w: string; s: number; e: number}[]};
/** Points are gestures, not statues: after a beat the arm comes back down. */
const RELAX_FROM = ['point', 'pointUp', 'sitPoint'];
export const resolveAt = (at: number | string, lines: LineInfo[]): number => {
  if (typeof at === 'number') return at;
  const m = /^l(\d+)([+-][\d.]+)?$/.exec(at);
  if (!m) return 0;
  const l = lines[Number(m[1])];
  return (l ? l.startInShot : 0) + (m[2] ? Number(m[2]) : 0);
};

/** Deterministic 0..1 hash of a string (stable across renders). */
export const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10007) / 10007;
};
/**
 * Blinks like a person: irregular gaps of 2–6 s (shorter while talking), the odd double blink, and a blink
 * whenever the face changes or the head turns. Returns lid closure 0..1.
 */
export const blinkAt = (t: number, seed: string, talking: boolean, events: number[] = []) => {
  // the animator's blink: one in-between frame, two frames shut, one in-between frame. A triangle-shaped blink
  // spends most of its frames half-shut and reads as drowsy, fluttering eyelids.
  const LEN = 0.14;
  const shape = (dt: number) => (dt < 0 || dt >= LEN ? 0 : dt < 0.034 ? 0.6 : dt < 0.1 ? 1 : 0.55);
  // every trigger (a face change, a head turn, the natural rhythm) asks for a blink; a trigger within 1 s of the
  // last blink is dropped. Two blinks closer than that (even a "natural" double blink) read as a twitch on these
  // big, simple eyes.
  const asks = events.map((e) => e + 0.03);
  let b = 0.3 + hashStr(seed) * 2.2;
  let n = 0;
  while (b < t + LEN && n < 200) {
    asks.push(b);
    const h = hashStr(`${seed}:${n}`);
    b += (talking ? 1.6 : 2.2) + h * (talking ? 2.6 : 3.8);
    n++;
  }
  asks.sort((p, q) => p - q);
  let v = 0;
  let last = -99;
  for (const at of asks) {
    if (at - last < 1) continue;
    last = at;
    v = Math.max(v, shape(t - at));
  }
  return v;
};

/** Pure: the state of one cast member at time t (seconds into the shot). */
export const actorAt = (c: CastEntry, acts: Act[], t: number, frame: number, lines: LineInfo[], seed: number) => {
  const mine = acts.filter((a) => a.who === c.who).map((a) => ({...a, t0: resolveAt(a.at, lines)})).sort((a, b) => a.t0 - b.t0);
  // gifts arriving: someone hands this character a prop (they reach for it too)
  const gifts = acts.filter((a) => a.give === c.who && a.prop).map((a) => ({...a, t0: resolveAt(a.at, lines)}));
  let x = c.x;
  let y = c.y;
  let facing: Facing = c.facing ?? 'front';
  let poseName = (c.pose ?? 'stand') as string;
  let pose = POSES[(c.pose as PoseName) ?? 'stand'] ?? POSES.stand;
  const startExpr = (c.expr ?? 'neutral') as Expr;
  let face = FACES[SETTLE[startExpr] ?? startExpr];
  let exprNow: Expr = SETTLE[startExpr] ?? startExpr;
  let exprAt = -99;
  const events: number[] = []; // moments that trigger a blink: an expression change, a head turn
  let look = c.look ?? [0, 0];
  let turn = c.turn ?? 0;
  let hold = c.hold;
  let holdL = c.holdL;
  let hoodUp = c.hoodUp ?? false;
  let opacity = c.opacity ?? 1;
  let wag = c.wag ?? 0.5;
  let watchGlow = c.watchGlow ?? 0;
  let moving: null | {kind: 'walk' | 'run'; phase: number} = null;
  let travelled = 0;
  const loops: {kind: LoopKind; k: number; local: number}[] = [];
  let poseSince = 0;
  let poseKeep = !!c.keepPose;
  let prevPose = POSES.relaxed;
  for (const a of mine) {
    if (t < a.t0) break;
    const dur = a.dur ?? (a.to !== undefined ? 1.2 : a.loop ? 1.5 : a.give || a.put || a.take ? 0.8 : 0.35);
    const k = clamp01((t - a.t0) / Math.max(0.01, dur));
    if (a.pose) {
      if (!RELAX_FROM.includes(a.pose)) prevPose = POSES[a.pose as PoseName] ?? prevPose;
      poseName = a.pose;
      poseSince = a.t0 + dur;
      poseKeep = !!a.keep;
      const target = POSES[a.pose as PoseName];
      if (target) pose = blendPose(pose, target, easeBack(k));
    }
    if (a.expr) {
      // each face arrives at its own natural speed, independent of the act's duration
      face = blendFace(face, FACES[a.expr], easeIO(clamp01((t - a.t0) / onsetOf(a.expr))));
      exprNow = a.expr;
      exprAt = a.t0;
      events.push(a.t0);
    }
    if (a.turn !== undefined && Math.abs(a.turn - turn) > 0.3) events.push(a.t0);
    if (a.facing && a.facing !== facing) events.push(a.t0);
    if (a.look) look = [look[0] + (a.look[0] - look[0]) * easeIO(k), look[1] + (a.look[1] - look[1]) * easeIO(k)];
    if (a.turn !== undefined) turn = turn + (a.turn - turn) * easeIO(k);
    if (a.hold !== undefined) hold = a.hold ?? undefined;
    if (a.holdL !== undefined) holdL = a.holdL ?? undefined;
    // prop handling: the reach is visible, the change happens when the hand arrives
    if (a.give || a.put || a.take) {
      const reachK = Math.sin(Math.min(1, k) * Math.PI);
      const arm = a.give ? [90, 10] : [18, 30]; // forward to the other person, or down to a pocket / bag / table
      if (a.left) pose = {...pose, lArm: [pose.lArm[0] + (arm[0] - pose.lArm[0]) * reachK, pose.lArm[1] + (arm[1] - pose.lArm[1]) * reachK] as [number, number]};
      else pose = {...pose, rArm: [pose.rArm[0] + (arm[0] - pose.rArm[0]) * reachK, pose.rArm[1] + (arm[1] - pose.rArm[1]) * reachK] as [number, number]};
      if (k >= 0.5) {
        if (a.give || a.put) {
          if (a.left) holdL = undefined;
          else hold = undefined;
        } else if (a.take && a.prop) {
          if (a.left) holdL = a.prop;
          else hold = a.prop;
        }
      }
    }
    if (a.hoodUp !== undefined) hoodUp = a.hoodUp;
    if (a.facing) facing = a.facing;
    if (a.opacity !== undefined) opacity = opacity + (a.opacity - opacity) * k;
    if (a.wag !== undefined) wag = a.wag;
    if (a.watchGlow !== undefined) watchGlow = a.watchGlow * (k < 1 ? k : 1);
    if (a.to !== undefined) {
      const [tx, ty] = typeof a.to === 'number' ? [a.to, y] : a.to;
      const e = easeIO(k);
      const nx = x + (tx - x) * e;
      const ny = y + (ty - y) * e;
      const dist = Math.hypot(tx - x, ty - y);
      if (!a.facing && Math.abs(tx - x) > 4) facing = tx > x ? 'right' : 'left';
      if (k < 1) {
        const kind = a.gait ?? 'walk';
        travelled = (dist * e) / c.depth;
        moving = {kind, phase: (travelled / STRIDE[kind]) * Math.PI};
      }
      x = nx;
      y = ny;
    }
    if (a.loop && k < 1) loops.push({kind: a.loop, k, local: t - a.t0});
  }
  for (const g of gifts) {
    if (t < g.t0) continue;
    const dur = g.dur ?? 0.8;
    const k = clamp01((t - g.t0) / dur);
    const reachK = Math.sin(k * Math.PI);
    pose = {...pose, rArm: [pose.rArm[0] + (90 - pose.rArm[0]) * reachK, pose.rArm[1] + (10 - pose.rArm[1]) * reachK] as [number, number]};
    if (k >= 0.5) hold = g.prop;
  }
  // a startle peaks, holds, then settles into something a person can hold
  const settled = SETTLE[exprNow];
  if (settled && exprAt > -99) {
    const k = clamp01((t - exprAt - onsetOf(exprNow) - SETTLE_HOLD) / SETTLE_LEN);
    if (k > 0) face = blendFace(face, FACES[settled], easeIO(k));
  }
  // a point relaxes back to the previous resting pose ~1.2 s after it lands
  if (RELAX_FROM.includes(poseName) && !poseKeep && c.who !== 'biscuit') {
    const k = clamp01((t - (poseSince + 1.2)) / 0.45);
    if (k > 0) {
      const rest = poseName === 'sitPoint' ? POSES.sitChair : prevPose === POSES.stand ? POSES.relaxed : prevPose;
      pose = blendPose(pose, rest, easeIO(k));
    }
  }
  return {x, y, facing, poseName, pose, face, look, turn, hold, holdL, hoodUp, opacity, wag, moving, loops, watchGlow, events};
};

/** Renders a shot's cast at the current frame (back-to-front by ground line). */
export const Actors: React.FC<{cast: CastEntry[]; acts?: Act[]; only?: Who[]; frameOffset?: number}> = ({cast, acts = [], only}) => {
  const {t, frame, shot} = useShot();
  const lines = shot.timedLines as unknown as LineInfo[];
  const list = cast.filter((c) => !only || only.includes(c.who)).sort((a, b) => a.y * a.depth - b.y * b.depth || a.depth - b.depth);
  const resolved = list.map((c, i) => actorAt(c, acts, t, frame, lines, i));
  // piggyback riders follow their carrier: on the back, hips at the carrier's waist
  list.forEach((c, i) => {
    if (!c.carriedBy) return;
    const j = list.findIndex((o) => o.who === c.carriedBy);
    if (j < 0) return;
    const carrier = resolved[j];
    const cd = designOf(list[j].who);
    const H = HERO_PX * (cd?.height ?? 1) * list[j].depth;
    const dir = carrier.facing === 'left' ? -1 : 1;
    // the rider's hips sit at the carrier's lower back (62% of his height), a little behind him, so her head
    // shows over his shoulder; her knees (pose 'carried') wrap forward round his waist
    const rd = designOf(c.who)!;
    const Hr = HERO_PX * rd.height * c.depth;
    const thighR = ((Hr - 1.9 * Hr * rd.head) * 0.52) / 2;
    const hipAbove = thighR * (Math.cos((78 * Math.PI) / 180) + Math.cos((20 * Math.PI) / 180));
    const bob = carrier.moving ? Math.abs(Math.sin(carrier.moving.phase)) * H * 0.012 : 0;
    resolved[i] = {...resolved[i], x: carrier.x - dir * H * 0.25, y: carrier.y - H * 0.71 + hipAbove - bob, facing: carrier.facing, moving: null, pose: POSES.carried, poseName: 'carried'};
  });
  // attention: who is talking right now (eased in over 0.3 s, out over 0.4 s after the line ends)
  let speakerIdx = -1;
  let attn = 0;
  for (const l of lines) {
    const idx = list.findIndex((c) => c.who !== 'biscuit' && (c.speaker ?? designOf(c.who)?.speaker) === l.speaker);
    if (idx < 0) continue;
    const w = clamp01((t - l.startInShot) / 0.3) * clamp01(1 - (t - (l.startInShot + (l.end - l.start))) / 0.4);
    if (w > attn) {
      attn = w;
      speakerIdx = idx;
    }
  }
  const attend = (i: number, r: (typeof resolved)[number]): {look: [number, number]; turn: number} => {
    if (speakerIdx < 0 || attn <= 0 || r.facing === 'back' || list.length < 2) return {look: r.look, turn: r.turn};
    let target = speakerIdx;
    let k = attn;
    if (i === speakerIdx) {
      // the speaker glances at the nearest listener
      let best = -1;
      let bd = 1e9;
      resolved.forEach((o, j) => {
        if (j !== i && Math.abs(o.x - r.x) < bd) {
          bd = Math.abs(o.x - r.x);
          best = j;
        }
      });
      if (best < 0) return {look: r.look, turn: r.turn};
      target = best;
      k = attn * 0.6;
    }
    const dx = resolved[target].x - r.x;
    if (Math.abs(dx) < 20 || Math.hypot(r.look[0], r.look[1]) > 0.05) return {look: r.look, turn: r.turn};
    const dir = Math.sign(dx) * (r.facing === 'left' ? -1 : 1);
    // nobody holds eye contact forever: a listener's eyes drop away for a moment every few seconds
    if (i !== speakerIdx) {
      const gp = (t + hashStr(list[i].who) * 5) % (4.6 + hashStr(list[i].who + 'g') * 1.6);
      if (gp < 0.5) {
        const g = Math.sin((gp / 0.5) * Math.PI);
        k = k * (1 - 0.85 * g);
        return {look: [r.look[0] + (dir * 0.75 - r.look[0]) * k, r.look[1] + (-0.08 - r.look[1]) * k + 0.28 * g], turn: r.turn + (r.facing === 'front' ? dir * 0.3 * k : 0)};
      }
    }
    return {look: [r.look[0] + (dir * 0.75 - r.look[0]) * k, r.look[1] + (-0.08 - r.look[1]) * k], turn: r.turn + (r.facing === 'front' ? dir * 0.3 * k : 0)};
  };
  // draw order: back to front by ground line; a piggyback rider goes just behind their carrier
  const order = list.map((c, i) => i).sort((a, b) => {
    const key = (i: number) => {
      const c = list[i];
      const j = c.carriedBy ? list.findIndex((o) => o.who === c.carriedBy) : -1;
      return j >= 0 ? list[j].y * list[j].depth - 0.01 : c.y * c.depth;
    };
    return key(a) - key(b);
  });
  return (
    <g>
      {order.map((i) => {
        const c = list[i];
        const r = resolved[i];
        if (c.who === 'biscuit') {
          const running = r.moving?.kind === 'run';
          const pose = (r.moving ? 'run' : (r.poseName as DogPose)) ?? 'stand';
          return (
            <Dog
              key={`${c.who}${i}`}
              x={r.x}
              y={r.y}
              s={c.depth * 0.54}
              pose={running || r.moving ? 'run' : ['stand', 'sit', 'run', 'lie', 'beg'].includes(pose) ? pose : 'stand'}
              flip={r.facing === 'left'}
              wag={r.wag}
              breath={c.breath}
              seed={i}
              rim={c.rim ? '#FFB25A' : undefined}
              carry={r.hold === 'toast' ? 'toast' : undefined}
              fat={c.fat}
            />
          );
        }
        const d = designOf(c.who)!;
        // lip-sync from this character's own lines
        const spk = c.speaker ?? d.speaker;
        const line = spk ? lines.find((l) => l.speaker === spk && t >= l.startInShot && t <= l.startInShot + (l.end - l.start)) : undefined;
        const vis = line ? visemeAt(line.text, t - line.startInShot, line.end - line.start, line.chars) : null;
        let pose = r.pose;
        let bob = 0;
        let xo = 0;
        let yo = 0;
        const att = attend(i, r);
        let turn = att.turn;
        if (r.moving) {
          const g = gait(pose, r.moving.phase, r.moving.kind, d.elder);
          pose = g.pose;
          bob = g.bob;
        }
        // breathing + idle weight shift (never perfectly still)
        const hs = hashStr(c.who);
        const ph = frame / 30 + hs * 6.28;
        const rate = 0.85 + hs * 0.3; // no two people breathe in step
        bob += Math.sin(ph * 1.6 * rate) * 1.2;
        pose = {...pose, lean: pose.lean + Math.sin(ph * 0.45 * rate) * 1.2, tilt: pose.tilt + Math.sin(ph * 0.7 * rate) * 1.2};
        // talking: the face and head do the acting (a small head lift on the line, eyes to the listener). Hands move
        // only when the script gives the line a gesture (`g`), the way people actually talk.
        if (line) {
          const lt = t - line.startInShot;
          const ld = line.end - line.start;
          pose = {...pose, tilt: pose.tilt + Math.sin(Math.min(1, lt / Math.max(0.6, ld)) * Math.PI) * 2.5};
          const g = (line as any).g as string | undefined;
          if (g && !r.moving) {
            const k = clamp01(lt / 0.3) * clamp01((Math.min(ld, 1.8) - lt) / 0.35);
            const e = easeIO(k);
            const mix = (cur: [number, number], to: [number, number]): [number, number] => [cur[0] + (to[0] - cur[0]) * e, cur[1] + (to[1] - cur[1]) * e];
            const seated = CHAIR_POSES.includes(r.poseName);
            if (g === 'point') pose = {...pose, rArm: mix(pose.rArm, [96, -4])};
            if (g === 'palm') pose = {...pose, rArm: mix(pose.rArm, [62, 52])};
            if (g === 'up') pose = {...pose, rArm: mix(pose.rArm, [150, 8])};
            if (g === 'count') pose = {...pose, rArm: mix(pose.rArm, [84, 96])};
            if (g === 'chest') pose = {...pose, rArm: mix(pose.rArm, [26, 128])};
            if (g === 'shrug') pose = {...pose, lArm: mix(pose.lArm, [38, 84]), rArm: mix(pose.rArm, [44, 84]), tilt: pose.tilt + 6 * e};
            if (g === 'rub') pose = {...pose, lArm: mix(pose.lArm, [46, 100 + Math.sin(frame * 0.6) * 6]), rArm: mix(pose.rArm, [52, 96 - Math.sin(frame * 0.6) * 6])};
            void seated;
          }
        } else if (list.length > 1 && r.facing !== 'back') {
          // listening: a small nod as someone else's line lands
          lines.forEach((l, li) => {
            const onStage = list.some((o) => o.who !== 'biscuit' && (o.speaker ?? designOf(o.who)?.speaker) === l.speaker);
            if (!onStage || l.speaker === spk) return;
            const h = hashStr(`${shot.id}:${li}:${c.who}`);
            const question = /\?\s*$/.test(l.text);
            if (!question && h > 0.36) return; // most lines get no nod at all
            const delay = 0.1 + h * 0.4;
            const len = question ? 0.7 : 0.45;
            const lt = t - (l.startInShot + (l.end - l.start)) - delay;
            if (lt > 0 && lt < len) {
              const w = Math.sin((lt / len) * Math.PI);
              pose = question ? {...pose, tilt: pose.tilt - 4 * w} : {...pose, tilt: pose.tilt + (4 + h * 6) * w};
            }
          });
        }
        for (const l of r.loops) {
          const w = Math.sin(l.local * Math.PI * 2 * 1.6);
          if (l.kind === 'wave') pose = {...pose, rArm: [122 + w * 10, 32 + w * 24]};
          if (l.kind === 'nod') pose = {...pose, tilt: pose.tilt + Math.abs(w) * 10};
          if (l.kind === 'shake') turn = turn + w * 0.45;
          if (l.kind === 'shiver' || l.kind === 'tremble') xo += Math.sin(frame * 2.3) * (l.kind === 'shiver' ? 2.5 : 1.5);
          if (l.kind === 'bounce') yo -= Math.abs(Math.sin(l.local * Math.PI * 3)) * 14;
          if (l.kind === 'jump') yo -= Math.sin(Math.min(1, l.k) * Math.PI) * 70;
          if (l.kind === 'clap') pose = {...pose, lArm: [55, 95 + w * 18], rArm: [65, 95 - w * 18]};
          if (l.kind === 'scratch') pose = {...pose, rArm: [150, 120 + w * 12]};
          if (l.kind === 'stir') pose = {...pose, rArm: [60 + w * 10, 60 - w * 10]};
          if (l.kind === 'talk') pose = {...pose, rArm: [30 + w * 12, 60 + w * 20]};
          // three quick knuckle taps (Ito's habit): the forearm dips three times across the loop
          if (l.kind === 'tap') {
            const tp = Math.max(0, Math.sin(Math.min(1, l.k) * Math.PI * 3)) ** 3;
            pose = {...pose, rArm: [72 - tp * 14, 70 + tp * 30]};
          }
        }
        const blink = blinkAt(t, `${shot.id}:${c.who}`, !!line, r.events);
        const st: ToonState = {
          x: r.x + xo,
          y: r.y + yo * c.depth,
          scale: c.depth,
          facing: r.facing,
          pose,
          bob,
          face: r.face,
          turn,
          look: att.look,
          talk: vis ? vis.open : 0,
          blink,
          outfit: c.outfit ?? 'home',
          hoodUp: r.hoodUp,
          hold: r.hold,
          holdL: r.holdL,
          breath: c.breath ? 1 : 0,
          frame: frame + i * 7,
          rim: c.rim ?? true,
          opacity: r.opacity,
          watchGlow: r.watchGlow,
          noShadow: !!c.carriedBy,
        };
        const chairSit = CHAIR_POSES.includes(r.poseName);
        const lift = c.seatLift ?? 0;
        if (chairSit && c.seat !== 'none') {
          st.seat = c.seat ?? 'chair';
          st.seatLift = lift;
          st.y -= lift * c.depth;
        }
        // a chair belongs to the set, not the sitter: once anyone sits in this shot, their seat stays where it
        // is for the whole shot (before they sit down, and after they stand up)
        let empty: React.ReactNode = null;
        const sitAt = CHAIR_POSES.includes(c.pose as string) ? 0 : (() => {
          const a = acts.find((x) => x.who === c.who && CHAIR_POSES.includes(x.pose as string));
          return a ? resolveAt(a.at, lines) + (a.dur ?? 0.35) : null;
        })();
        if (!chairSit && sitAt !== null && c.seat !== 'none') {
          const s0 = actorAt(c, acts, sitAt + 0.01, frame, lines, i);
          empty = (
            <Toon
              key={`seat${c.who}${i}`}
              d={d}
              s={{...st, x: s0.x, y: s0.y - lift * c.depth, facing: s0.facing, pose: POSES.sitChair, bob: 0, seat: c.seat ?? 'chair', seatLift: lift, seatOnly: true, opacity: 1}}
            />
          );
        }
        return (
          <React.Fragment key={`${c.who}${i}`}>
            {empty}
            <Toon d={d} s={st} />
          </React.Fragment>
        );
      })}
    </g>
  );
};

/** Heights in px of everyone in a cast list (used by the character gate). */
export const castHeights = (cast: CastEntry[]) =>
  cast.filter((c) => c.who !== 'biscuit').map((c) => ({who: c.who, px: HERO_PX * designOf(c.who)!.height * c.depth, depth: c.depth}));

export type {Speaker};
