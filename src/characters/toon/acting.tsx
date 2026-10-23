import React from 'react';
import {Easing} from 'remotion';
import type {Speaker} from '../../engine/schema';
import {useShot} from '../../engine/shot-context';
import {Dog, type DogPose} from '../Dog';
import {visemeAt} from '../visemes';
import {CAST, extra, HERO_PX, type Outfit, type ToonDesign} from './design';
import {blendFace, type Expr, FACES} from './face';
import {blendPose, gait, POSES, type PoseName, STRIDE} from './poses';
import type {PropKind} from './props';
import {Toon, type ToonState} from './Toon';

/**
 * The acting system. A shot lists its CAST (who stands where, at what depth) and ACTS (timed directions:
 * walk to x, change pose, change expression, wave, nod, shiver…). Every frame resolves each character:
 * poses blend with ease + a little overshoot, walking derives its cycle from distance travelled (no foot
 * sliding), and every character breathes, blinks and lip-syncs to its own lines automatically.
 */
export type Who = 'you' | 'mira' | 'ito' | 'biscuit' | `extra:${number}`;
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
};
export type LoopKind = 'wave' | 'nod' | 'shake' | 'shiver' | 'bounce' | 'clap' | 'talk' | 'jump' | 'tremble' | 'pant' | 'scratch' | 'stir';
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
};

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
  return CAST[who as 'you' | 'mira' | 'ito'];
};

type LineInfo = {startInShot: number; end: number; start: number; speaker: string; text: string; chars?: number[]};
export const resolveAt = (at: number | string, lines: LineInfo[]): number => {
  if (typeof at === 'number') return at;
  const m = /^l(\d+)([+-][\d.]+)?$/.exec(at);
  if (!m) return 0;
  const l = lines[Number(m[1])];
  return (l ? l.startInShot : 0) + (m[2] ? Number(m[2]) : 0);
};

/** Pure: the state of one cast member at time t (seconds into the shot). */
export const actorAt = (c: CastEntry, acts: Act[], t: number, frame: number, lines: LineInfo[], seed: number) => {
  const mine = acts.filter((a) => a.who === c.who).map((a) => ({...a, t0: resolveAt(a.at, lines)})).sort((a, b) => a.t0 - b.t0);
  let x = c.x;
  let y = c.y;
  let facing: Facing = c.facing ?? 'front';
  let poseName = (c.pose ?? 'stand') as string;
  let pose = POSES[(c.pose as PoseName) ?? 'stand'] ?? POSES.stand;
  let face = FACES[c.expr ?? 'neutral'];
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
  for (const a of mine) {
    if (t < a.t0) break;
    const dur = a.dur ?? (a.to !== undefined ? 1.2 : a.loop ? 1.5 : 0.35);
    const k = clamp01((t - a.t0) / Math.max(0.01, dur));
    if (a.pose) {
      poseName = a.pose;
      const target = POSES[a.pose as PoseName];
      if (target) pose = blendPose(pose, target, easeBack(k));
    }
    if (a.expr) face = blendFace(face, FACES[a.expr], easeIO(clamp01(k * 1.6)));
    if (a.look) look = [look[0] + (a.look[0] - look[0]) * easeIO(k), look[1] + (a.look[1] - look[1]) * easeIO(k)];
    if (a.turn !== undefined) turn = turn + (a.turn - turn) * easeIO(k);
    if (a.hold !== undefined) hold = a.hold ?? undefined;
    if (a.holdL !== undefined) holdL = a.holdL ?? undefined;
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
  return {x, y, facing, poseName, pose, face, look, turn, hold, holdL, hoodUp, opacity, wag, moving, loops, watchGlow};
};

/** Renders a shot's cast at the current frame (back-to-front by ground line). */
export const Actors: React.FC<{cast: CastEntry[]; acts?: Act[]; only?: Who[]; frameOffset?: number}> = ({cast, acts = [], only}) => {
  const {t, frame, shot} = useShot();
  const lines = shot.timedLines as unknown as LineInfo[];
  const list = cast.filter((c) => !only || only.includes(c.who)).sort((a, b) => a.y * a.depth - b.y * b.depth || a.depth - b.depth);
  return (
    <g>
      {list.map((c, i) => {
        const r = actorAt(c, acts, t, frame, lines, i);
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
            />
          );
        }
        const d = designOf(c.who)!;
        // lip-sync from this character's own lines
        const line = d.speaker ? lines.find((l) => l.speaker === d.speaker && t >= l.startInShot && t <= l.startInShot + (l.end - l.start)) : undefined;
        const vis = line ? visemeAt(line.text, t - line.startInShot, line.end - line.start, line.chars) : null;
        let pose = r.pose;
        let bob = 0;
        let xo = 0;
        let yo = 0;
        let turn = r.turn;
        if (r.moving) {
          const g = gait(pose, r.moving.phase, r.moving.kind, d.elder);
          pose = g.pose;
          bob = g.bob;
        }
        // breathing + idle weight shift (never perfectly still)
        const ph = frame / 30 + i * 1.7;
        bob += Math.sin(ph * 1.6) * 1.2;
        pose = {...pose, lean: pose.lean + Math.sin(ph * 0.45) * 1.2, tilt: pose.tilt + Math.sin(ph * 0.7) * 1.2};
        // talking: small head and hand rhythm
        if (line) {
          pose = {...pose, tilt: pose.tilt + Math.sin(frame * 0.35) * 3, rArm: [pose.rArm[0] + Math.sin(frame * 0.21) * 6, pose.rArm[1] + Math.sin(frame * 0.3) * 8]};
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
        }
        // blink every ~3.5 s
        const bp = (frame + i * 41 + 25) % 104;
        const blink = bp < 3 ? 1 - Math.abs(bp - 1.5) / 1.5 : 0;
        const st: ToonState = {
          x: r.x + xo,
          y: r.y + yo * c.depth,
          scale: c.depth,
          facing: r.facing,
          pose,
          bob,
          face: r.face,
          turn,
          look: r.look,
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
        };
        return <Toon key={`${c.who}${i}`} d={d} s={st} />;
      })}
    </g>
  );
};

/** Heights in px of everyone in a cast list (used by the character gate). */
export const castHeights = (cast: CastEntry[]) =>
  cast.filter((c) => c.who !== 'biscuit').map((c) => ({who: c.who, px: HERO_PX * designOf(c.who)!.height * c.depth, depth: c.depth}));

export type {Speaker};
