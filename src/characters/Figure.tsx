import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {useShotOptional} from '../engine/shot-context';
import {C} from '../theme';
import {characters, type CharacterDesign, type CharacterId} from './registry';
import {emphasisAt, visemeAt, type Viseme} from './visemes';

/**
 * Character rig. Flat "night-ink" style: real skin tones, navy ink outline, signature-color rim light.
 * Limb angles are degrees from straight-down; positive swings toward screen-right.
 */
type Limb = [number, number];
export type Pose = {
  lArm: Limb;
  rArm: Limb;
  lLeg: Limb;
  rLeg: Limb;
  lean?: number;
  headTilt?: number;
  /** Hide legs (seated behind a dashboard / out of frame). */
  noLegs?: boolean;
};

export const POSES = {
  stand: {lArm: [-10, 4], rArm: [10, -4], lLeg: [-3, 1], rLeg: [3, -1]},
  relaxed: {lArm: [-6, 10], rArm: [14, -18], lLeg: [-4, 2], rLeg: [5, -1], lean: 2},
  armsUp: {lArm: [-135, -25], rArm: [135, 25], lLeg: [-8, 3], rLeg: [8, -3], headTilt: -6},
  wave: {lArm: [-10, 4], rArm: [135, 35], lLeg: [-3, 1], rLeg: [3, -1]},
  point: {lArm: [-10, 4], rArm: [105, -5], lLeg: [-3, 1], rLeg: [6, -1]},
  pointUp: {lArm: [-10, 4], rArm: [165, 5], lLeg: [-3, 1], rLeg: [3, -1], headTilt: -10},
  handsOnHead: {lArm: [-140, -75], rArm: [140, 75], lLeg: [-6, 2], rLeg: [6, -2]},
  shrug: {lArm: [-25, -75], rArm: [25, 75], lLeg: [-3, 1], rLeg: [3, -1], headTilt: 6},
  hold: {lArm: [-12, 105], rArm: [12, -105], lLeg: [-3, 1], rLeg: [3, -1]},
  crossArms: {lArm: [-6, 125], rArm: [6, -125], lLeg: [-5, 1], rLeg: [5, -1], lean: -2},
  throw: {lArm: [-30, -20], rArm: [125, 25], lLeg: [-12, 6], rLeg: [10, -2], lean: 6},
  reach: {lArm: [-95, 15], rArm: [95, -15], lLeg: [-4, 2], rLeg: [4, -2]},
  talk: {lArm: [-10, 4], rArm: [28, -70], lLeg: [-3, 1], rLeg: [3, -1]},
  hipHand: {lArm: [-35, 95], rArm: [28, -70], lLeg: [-4, 1], rLeg: [4, -1]},
  pilot: {lArm: [-20, 70], rArm: [20, -70], lLeg: [0, 0], rLeg: [0, 0], noLegs: true},
  pilotJoy: {lArm: [-135, -25], rArm: [135, 25], lLeg: [0, 0], rLeg: [0, 0], noLegs: true, headTilt: -6},
  pilotPoint: {lArm: [-20, 70], rArm: [110, -10], lLeg: [0, 0], rLeg: [0, 0], noLegs: true},
  sitHug: {lArm: [-10, 115], rArm: [10, -115], lLeg: [0, 0], rLeg: [0, 0], noLegs: true},
  lie: {lArm: [-8, 0], rArm: [8, 0], lLeg: [-2, 0], rLeg: [2, 0]},
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

export type Expression =
  | 'neutral'
  | 'happy'
  | 'ecstatic'
  | 'nervous'
  | 'curious'
  | 'confused'
  | 'alarmed'
  | 'determined'
  | 'serious'
  | 'smug'
  | 'sleep'
  | 'surprised'
  | 'sad'
  | 'warm';

type Face = {
  brow: number; // inner-brow raise (+) / furrow (-)
  browY: number;
  eyeOpen: number; // 0 = closed, 1 = normal, 1.25 = wide
  mouth: 'smile' | 'grin' | 'open' | 'o' | 'flat' | 'frown' | 'smirk' | 'wobble';
};

const FACES: Record<Expression, Face> = {
  neutral: {brow: 0, browY: 0, eyeOpen: 1, mouth: 'flat'},
  happy: {brow: 2, browY: -2, eyeOpen: 0.9, mouth: 'smile'},
  warm: {brow: 4, browY: 0, eyeOpen: 0.75, mouth: 'smile'},
  ecstatic: {brow: 6, browY: -8, eyeOpen: 1.15, mouth: 'grin'},
  nervous: {brow: 8, browY: -2, eyeOpen: 1.05, mouth: 'wobble'},
  curious: {brow: 5, browY: -6, eyeOpen: 1.1, mouth: 'o'},
  confused: {brow: -4, browY: 0, eyeOpen: 1, mouth: 'wobble'},
  alarmed: {brow: 10, browY: -9, eyeOpen: 1.25, mouth: 'open'},
  determined: {brow: -9, browY: 3, eyeOpen: 0.85, mouth: 'flat'},
  serious: {brow: -4, browY: 2, eyeOpen: 0.9, mouth: 'flat'},
  smug: {brow: -3, browY: 1, eyeOpen: 0.7, mouth: 'smirk'},
  sleep: {brow: 2, browY: 2, eyeOpen: 0, mouth: 'smile'},
  surprised: {brow: 8, browY: -10, eyeOpen: 1.25, mouth: 'o'},
  sad: {brow: 10, browY: 2, eyeOpen: 0.8, mouth: 'frown'},
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const L = (x: Limb, y: Limb): Limb => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return {
    lArm: L(a.lArm, b.lArm),
    rArm: L(a.rArm, b.rArm),
    lLeg: L(a.lLeg, b.lLeg),
    rLeg: L(a.rLeg, b.rLeg),
    lean: lerp(a.lean ?? 0, b.lean ?? 0, t),
    headTilt: lerp(a.headTilt ?? 0, b.headTilt ?? 0, t),
    noLegs: t < 0.5 ? a.noLegs : b.noLegs,
  };
};

const rad = (d: number) => (d * Math.PI) / 180;
const seg = (x: number, y: number, len: number, deg: number) => [x + Math.sin(rad(deg)) * len, y + Math.cos(rad(deg)) * len];

export type FigureProps = {
  char: CharacterId | CharacterDesign;
  x: number;
  y: number;
  scale?: number;
  pose?: PoseName | Pose;
  /** Optional second pose and blend (0..1) for in-shot motion. */
  toPose?: PoseName | Pose;
  blend?: number;
  expression?: Expression;
  talking?: boolean;
  look?: [number, number];
  flip?: boolean;
  rotate?: number;
  walk?: number; // walk-cycle phase (radians); legs/arms swing when set
  rim?: boolean;
  opacity?: number;
  /** Frame offset so crowds don't blink in unison. */
  seed?: number;
  /** Overrides (props held in hand etc.) rendered at the right hand. */
  holding?: React.ReactNode;
  /** Gift glow on the palm(s): 0..1. Jonah's Zero-G Touch is orange. */
  palmGlow?: number;
  glowHand?: 'r' | 'l' | 'both';
  /** Fist-clench (0 open … 1 closed): the off-switch for Zero-G Touch. */
  fist?: number;
};

export const Figure: React.FC<FigureProps> = ({
  char,
  x,
  y,
  scale = 1,
  pose = 'stand',
  toPose,
  blend = 0,
  expression = 'neutral',
  talking = false,
  look = [0, 0],
  flip = false,
  rotate = 0,
  walk,
  rim = true,
  opacity = 1,
  seed = 0,
  holding,
  palmGlow = 0,
  glowHand = 'r',
  fist = 0,
}) => {
  const frame = useCurrentFrame() + seed * 17;
  const id = useId().replace(/:/g, '');
  const d: CharacterDesign = typeof char === 'string' ? characters[char] : char;
  // Automatic lip-sync: if this character's speaker has a line playing right now, follow it.
  const shotCtx = useShotOptional();
  const live = d.speaker && shotCtx ? shotCtx.lineNow(d.speaker) : null;
  const isTalking = talking || Boolean(live);
  const vis: Viseme | null = live
    ? visemeAt(live.text, live.t, live.duration, live.chars)
    : talking
      ? visemeAt('hello there how are you doing today', (frame / 30) % 3.2, 3.2)
      : null;
  const emphasis = live ? emphasisAt(live.text, live.t, live.duration) : 0;
  let p: Pose = typeof pose === 'string' ? POSES[pose] : pose;
  if (toPose) p = blendPose(p, typeof toPose === 'string' ? POSES[toPose] : toPose, blend);
  if (walk !== undefined) {
    const s = Math.sin(walk);
    p = {...p, lLeg: [s * 22, Math.max(0, -s) * 25], rLeg: [-s * 22, Math.max(0, s) * -25], lArm: [p.lArm[0] - s * 14, p.lArm[1]], rArm: [p.rArm[0] - s * 14, p.rArm[1]]};
  }

  if (isTalking) {
    // Conversational hand movement: the gesturing arm drifts with the rhythm of speech.
    const g = Math.sin(frame * 0.21) * 7 + Math.sin(frame * 0.53) * 3;
    p = {...p, rArm: [p.rArm[0] + g * 0.4, p.rArm[1] + g], headTilt: (p.headTilt ?? 0) + Math.sin(frame * 0.33) * 2.2};
  }

  const h = d.height;
  const legU = 62 * h;
  const legL = 58 * h;
  const torso = 104 * h;
  const headR = 44 * d.head;
  const shW = 84 * d.build;
  const hipW = 64 * d.build;
  const armU = 58 * h;
  const armL = 54 * h;
  const limb = 21 * Math.max(0.85, d.build);
  const leg = 24 * Math.max(0.85, d.build);
  const breathe = Math.sin(frame / 22) * 1.4;

  const hipY = -(legU + legL);
  const shY = hipY - torso + breathe;
  const headY = shY - headR * 0.92 - 6;
  const face = FACES[expression];
  // Offset so a shot never opens mid-blink (local frames restart at every cut).
  const blinkPhase = (frame + seed * 31 + 50) % 113;
  const blinking = blinkPhase < 4 && expression !== 'sleep';
  const eyeOpen = blinking ? 0.08 : face.eyeOpen;

  const isWrapper = d.top === 'wrapper';
  const legPath = (side: -1 | 1, l: Limb) => {
    const hx = side * hipW * 0.28;
    const [kx, ky] = seg(hx, hipY, legU, l[0]);
    const [fx, fy] = seg(kx, ky, legL, l[0] + l[1]);
    return {d: `M${hx},${hipY} L${kx},${ky} L${fx},${fy}`, fx, fy};
  };
  const armPath = (side: -1 | 1, l: Limb) => {
    const sx = side * shW * 0.46;
    const sy = shY + 12;
    const [ex, ey] = seg(sx, sy, armU, l[0]);
    const [hx, hy] = seg(ex, ey, armL, l[0] + l[1]);
    return {d: `M${sx},${sy} L${ex},${ey} L${hx},${hy}`, hx, hy};
  };
  const L = legPath(-1, p.lLeg);
  const R = legPath(1, p.rLeg);
  const LA = armPath(-1, p.lArm);
  const RA = armPath(1, p.rArm);

  const stroke = C.ink;
  const sw = 5;

  const Limbs = ({path, color, w}: {path: string; color: string; w: number}) => (
    <>
      <path d={path} stroke={stroke} strokeWidth={w + sw * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );

  // Torso: rounded trapezoid from shoulders to hips.
  const torsoPath = `M${-shW / 2},${shY + 14} Q${-shW / 2},${shY} ${-shW / 2 + 16},${shY} L${shW / 2 - 16},${shY} Q${shW / 2},${shY} ${shW / 2},${shY + 14} L${hipW / 2 + 4},${hipY + 6} Q${hipW / 2 + 4},${hipY + 14} ${hipW / 2 - 8},${hipY + 14} L${-hipW / 2 + 8},${hipY + 14} Q${-hipW / 2 - 4},${hipY + 14} ${-hipW / 2 - 4},${hipY + 6} Z`;
  const skirtPath = `M${-hipW / 2 - 6},${hipY} L${hipW / 2 + 6},${hipY} L${hipW / 2 + 22},${-8} L${-hipW / 2 - 22},${-8} Z`;

  const mouthY = headY + headR * 0.42;
  const mouth = (() => {
    const w = headR * 0.34;
    const m = vis ? 'talk' : face.mouth;
    switch (m) {
      case 'talk': {
        const v = vis!;
        // Base expression shapes the corners (smiling while talking reads very differently).
        const smile = face.mouth === 'smile' || face.mouth === 'grin' ? 1 : face.mouth === 'frown' ? -1 : 0;
        const rx = w * (0.42 + v.wide * 0.5 - v.round * 0.3);
        const ry = 1.5 + v.open * headR * 0.2;
        if (v.pressed || v.open < 0.06) {
          return <path d={`M${-rx},${mouthY + 2 - smile * 3} Q0,${mouthY + 4 + smile * 5} ${rx},${mouthY + 2 - smile * 3}`} stroke={stroke} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
        }
        const top = mouthY + 2 - ry * 0.45 - smile * 2;
        const bot = mouthY + 2 + ry;
        const path = `M${-rx},${mouthY + 2 - smile * 3} Q0,${top - ry * 0.25} ${rx},${mouthY + 2 - smile * 3} Q${rx * 0.9},${bot} 0,${bot + ry * 0.15} Q${-rx * 0.9},${bot} ${-rx},${mouthY + 2 - smile * 3} Z`;
        return (
          <g>
            <path d={path} fill="#3A1414" stroke={stroke} strokeWidth={3.5} strokeLinejoin="round" />
            {v.open > 0.35 && <ellipse cx={0} cy={bot - ry * 0.25} rx={rx * 0.45} ry={ry * 0.28} fill="#C2464F" />}
            {(v.teeth || v.open > 0.5) && <rect x={-rx * 0.6} y={top - ry * 0.05} width={rx * 1.2} height={Math.max(2, ry * 0.32)} rx={2} fill="#FFFFFF" />}
          </g>
        );
      }
      case 'smile':
        return <path d={`M${-w},${mouthY - 2} Q0,${mouthY + w * 0.7} ${w},${mouthY - 2}`} stroke={stroke} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'grin':
        return <path d={`M${-w * 1.15},${mouthY - 4} Q0,${mouthY + w * 1.25} ${w * 1.15},${mouthY - 4} Z`} fill="#3A1414" stroke={stroke} strokeWidth={4} strokeLinejoin="round" />;
      case 'open':
        return <ellipse cx={0} cy={mouthY + 4} rx={w * 0.55} ry={w * 0.6} fill="#3A1414" stroke={stroke} strokeWidth={4} />;
      case 'o':
        return <ellipse cx={0} cy={mouthY + 2} rx={w * 0.28} ry={w * 0.34} fill="#3A1414" stroke={stroke} strokeWidth={3.5} />;
      case 'frown':
        return <path d={`M${-w * 0.8},${mouthY + 6} Q0,${mouthY - w * 0.4} ${w * 0.8},${mouthY + 6}`} stroke={stroke} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'smirk':
        return <path d={`M${-w * 0.7},${mouthY + 2} Q${w * 0.2},${mouthY + 6} ${w * 0.9},${mouthY - 6}`} stroke={stroke} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'wobble':
        return <path d={`M${-w * 0.8},${mouthY + 2} q${w * 0.4},-5 ${w * 0.8},0 t${w * 0.8},0`} stroke={stroke} strokeWidth={4} fill="none" strokeLinecap="round" />;
      default:
        return <path d={`M${-w * 0.7},${mouthY + 2} L${w * 0.7},${mouthY + 2}`} stroke={stroke} strokeWidth={4} strokeLinecap="round" />;
    }
  })();

  const eye = (side: -1 | 1) => {
    const ex = side * headR * 0.36;
    const ey = headY - headR * 0.04;
    const rx = headR * 0.19;
    const ry = headR * 0.23 * Math.max(0.08, eyeOpen);
    if (eyeOpen < 0.15) {
      return <path key={side} d={`M${ex - rx},${ey} Q${ex},${ey + rx * 0.7} ${ex + rx},${ey}`} stroke={stroke} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
    return (
      <g key={side}>
        <ellipse cx={ex} cy={ey} rx={rx} ry={ry} fill={C.white} stroke={stroke} strokeWidth={3} />
        <ellipse cx={ex + look[0] * rx * 0.45} cy={ey + look[1] * ry * 0.4} rx={rx * 0.55} ry={Math.min(ry, rx * 0.62)} fill={C.ink} />
        <circle cx={ex + look[0] * rx * 0.45 + rx * 0.2} cy={ey + look[1] * ry * 0.4 - ry * 0.25} r={rx * 0.17} fill={C.white} />
      </g>
    );
  };
  const brow = (side: -1 | 1) => {
    const bx = side * headR * 0.36;
    const by = headY - headR * 0.34 + face.browY - emphasis * 5;
    const inner = bx - side * headR * 0.16;
    const outer = bx + side * headR * 0.16;
    return <path key={`b${side}`} d={`M${inner},${by - face.brow} L${outer},${by}`} stroke={stroke} strokeWidth={6} strokeLinecap="round" />;
  };

  const hairBack = (() => {
    const hc = d.hairColor;
    switch (d.hair) {
      case 'afro': {
        const bumps = Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * headR * 1.18} cy={headY - headR * 0.32 + Math.sin(a) * headR * 1.05} r={headR * 0.42} fill={hc} />;
        });
        return (
          <g>
            <ellipse cx={0} cy={headY - headR * 0.32} rx={headR * 1.42} ry={headR * 1.3} fill={stroke} />
            {bumps}
            <ellipse cx={0} cy={headY - headR * 0.32} rx={headR * 1.25} ry={headR * 1.12} fill={hc} />
          </g>
        );
      }
      case 'bun':
        return <circle cx={0} cy={headY - headR * 1.1} r={headR * 0.42} fill={hc} stroke={stroke} strokeWidth={sw} />;
      case 'puffs':
        return (
          <g>
            {[-1, 1].map((s) => (
              <circle key={s} cx={s * headR * 0.85} cy={headY - headR * 0.85} r={headR * 0.48} fill={hc} stroke={stroke} strokeWidth={sw} />
            ))}
          </g>
        );
      case 'curlsGrey': {
        const curls = Array.from({length: 11}, (_, i) => {
          const a = Math.PI + (i / 10) * Math.PI;
          return <circle key={i} cx={Math.cos(a) * headR * 1.02} cy={headY - headR * 0.15 + Math.sin(a) * headR * 1.0} r={headR * 0.3} fill={hc} stroke={stroke} strokeWidth={3} />;
        });
        return <g>{curls}</g>;
      }
      case 'gele':
        return (
          <g>
            <path d={`M${-headR * 1.35},${headY - headR * 0.35} Q${-headR * 1.1},${headY - headR * 2.3} 0,${headY - headR * 2.1} Q${headR * 1.2},${headY - headR * 2.4} ${headR * 1.4},${headY - headR * 0.4} Z`} fill={hc} stroke={stroke} strokeWidth={sw} />
            {[-0.7, -0.25, 0.2, 0.65].map((t, i) => (
              <path key={i} d={`M${t * headR * 1.4},${headY - headR * 0.6} Q${t * headR * 1.7},${headY - headR * 1.6} ${t * headR * 1.2},${headY - headR * 2.05}`} stroke={d.topAccent} strokeWidth={4} fill="none" />
            ))}
          </g>
        );
      default:
        return null;
    }
  })();

  const hairFront = (() => {
    const hc = d.hairColor;
    switch (d.hair) {
      case 'shortCrop':
        return <path d={`M${-headR},${headY - headR * 0.1} Q${-headR},${headY - headR * 1.12} 0,${headY - headR * 1.1} Q${headR},${headY - headR * 1.12} ${headR},${headY - headR * 0.1} Q${headR * 0.7},${headY - headR * 0.62} 0,${headY - headR * 0.66} Q${-headR * 0.7},${headY - headR * 0.62} ${-headR},${headY - headR * 0.1} Z`} fill={hc} stroke={stroke} strokeWidth={4} />;
      case 'slick':
        return <path d={`M${-headR * 1.02},${headY - headR * 0.05} Q${-headR * 1.05},${headY - headR * 1.2} ${headR * 0.1},${headY - headR * 1.15} Q${headR * 1.1},${headY - headR * 1.05} ${headR * 1.02},${headY - headR * 0.15} Q${headR * 0.5},${headY - headR * 0.8} ${-headR * 0.35},${headY - headR * 0.62} Q${-headR * 0.8},${headY - headR * 0.5} ${-headR * 1.02},${headY - headR * 0.05} Z`} fill={hc} stroke={stroke} strokeWidth={4} />;
      case 'headwrap':
        return (
          <g>
            <path d={`M${-headR * 1.05},${headY - headR * 0.15} Q${-headR * 1.15},${headY - headR * 1.5} 0,${headY - headR * 1.45} Q${headR * 1.15},${headY - headR * 1.5} ${headR * 1.05},${headY - headR * 0.15} Q0,${headY - headR * 0.55} ${-headR * 1.05},${headY - headR * 0.15} Z`} fill={hc} stroke={stroke} strokeWidth={sw} />
            <circle cx={headR * 0.55} cy={headY - headR * 1.25} r={headR * 0.3} fill={hc} stroke={stroke} strokeWidth={4} />
          </g>
        );
      case 'gele':
        return <path d={`M${-headR * 1.08},${headY - headR * 0.1} Q0,${headY - headR * 0.75} ${headR * 1.08},${headY - headR * 0.1} L${headR * 1.1},${headY - headR * 0.55} Q0,${headY - headR * 1.15} ${-headR * 1.1},${headY - headR * 0.55} Z`} fill={d.topAccent} stroke={stroke} strokeWidth={4} />;
      case 'bun':
        return <path d={`M${-headR},${headY - headR * 0.05} Q${-headR},${headY - headR * 1.1} 0,${headY - headR * 1.08} Q${headR},${headY - headR * 1.1} ${headR},${headY - headR * 0.05} Q${headR * 0.6},${headY - headR * 0.75} 0,${headY - headR * 0.72} Q${-headR * 0.6},${headY - headR * 0.75} ${-headR},${headY - headR * 0.05} Z`} fill={hc} stroke={stroke} strokeWidth={4} />;
      case 'cap':
        return (
          <g>
            <path d={`M${-headR * 1.02},${headY - headR * 0.3} Q${-headR},${headY - headR * 1.15} 0,${headY - headR * 1.12} Q${headR},${headY - headR * 1.15} ${headR * 1.02},${headY - headR * 0.3} Z`} fill={d.topColor} stroke={stroke} strokeWidth={4} />
            <path d={`M${headR * 0.2},${headY - headR * 0.32} L${headR * 1.55},${headY - headR * 0.25} L${headR * 1.02},${headY - headR * 0.42} Z`} fill={d.topColor} stroke={stroke} strokeWidth={4} />
          </g>
        );
      case 'braids':
        return (
          <g>
            <path d={`M${-headR},${headY} Q${-headR},${headY - headR * 1.15} 0,${headY - headR * 1.1} Q${headR},${headY - headR * 1.15} ${headR},${headY} Q${headR * 0.7},${headY - headR * 0.7} 0,${headY - headR * 0.7} Q${-headR * 0.7},${headY - headR * 0.7} ${-headR},${headY} Z`} fill={hc} stroke={stroke} strokeWidth={4} />
            {[-1, 1].map((s) => (
              <path key={s} d={`M${s * headR * 0.95},${headY} q${s * 6},${headR * 0.8} 0,${headR * 1.4}`} stroke={hc} strokeWidth={10} fill="none" strokeLinecap="round" />
            ))}
          </g>
        );
      case 'puffs':
        return <path d={`M${-headR},${headY - headR * 0.05} Q${-headR},${headY - headR * 1.05} 0,${headY - headR * 1.02} Q${headR},${headY - headR * 1.05} ${headR},${headY - headR * 0.05} Q${headR * 0.6},${headY - headR * 0.68} 0,${headY - headR * 0.66} Q${-headR * 0.6},${headY - headR * 0.68} ${-headR},${headY - headR * 0.05} Z`} fill={hc} stroke={stroke} strokeWidth={4} />;
      case 'curlsGrey':
        return (
          <g>
            {[-0.55, -0.15, 0.25, 0.6].map((x, i) => (
              <circle key={i} cx={x * headR} cy={headY - headR * 0.82 + (i % 2) * 6} r={headR * 0.27} fill={hc} stroke={stroke} strokeWidth={3} />
            ))}
          </g>
        );
      case 'afro':
        return null;
      default:
        return null;
    }
  })();

  const tilt = p.headTilt ?? 0;

  return (
    <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${flip ? -scale : scale},${scale})`} opacity={opacity}>
      {rim && (
        <defs>
          <filter id={`rim${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={-3} dy={-2} stdDeviation={1.2} floodColor={d.signature} floodOpacity={0.95} />
            <feDropShadow dx={0} dy={0} stdDeviation={10} floodColor={d.signature} floodOpacity={0.28} />
          </filter>
        </defs>
      )}
      <g filter={rim ? `url(#rim${id})` : undefined} transform={`rotate(${p.lean ?? 0},0,${hipY})`}>
        {/* legs */}
        {!p.noLegs && !isWrapper && (
          <>
            <Limbs path={L.d} color={d.pants} w={leg} />
            <Limbs path={R.d} color={d.pants} w={leg} />
          </>
        )}
        {!p.noLegs && isWrapper && (
          <>
            <Limbs path={L.d} color={d.skin} w={leg * 0.75} />
            <Limbs path={R.d} color={d.skin} w={leg * 0.75} />
          </>
        )}
        {!p.noLegs &&
          [L, R].map((f, i) => (
            <ellipse key={i} cx={f.fx + (i ? 7 : -7)} cy={f.fy + 2} rx={leg * 0.75} ry={leg * 0.42} fill={d.shoes} stroke={stroke} strokeWidth={4} />
          ))}
        {!p.noLegs && isWrapper && <path d={skirtPath} fill={d.topColor} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />}
        {!p.noLegs && isWrapper &&
          [0.3, 0.55, 0.8].map((t, i) => (
            <path key={i} d={`M${-hipW / 2 - 6 - 16 * t},${hipY + (-8 - hipY) * t} L${hipW / 2 + 6 + 16 * t},${hipY + (-8 - hipY) * t}`} stroke={d.topAccent} strokeWidth={5} />
          ))}
        {/* back arm */}
        <Limbs path={LA.d} color={d.topColor} w={limb} />
        <circle cx={LA.hx} cy={LA.hy} r={limb * 0.62} fill={d.skin} stroke={stroke} strokeWidth={4} />
        {/* torso */}
        <path d={torsoPath} fill={d.topColor} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        {(d.top === 'jacket' || d.top === 'suit' || d.top === 'cardigan') && (
          <>
            <path d={`M${-shW * 0.16},${shY + 2} L0,${shY + torso * 0.42} L${shW * 0.16},${shY + 2} Z`} fill={d.innerColor} stroke={stroke} strokeWidth={3} />
            <path d={`M0,${shY + torso * 0.42} L0,${hipY + 10}`} stroke={d.topAccent} strokeWidth={4} />
            {d.tie && <path d={`M-6,${shY + 6} L6,${shY + 6} L9,${shY + torso * 0.36} L0,${shY + torso * 0.45} L-9,${shY + torso * 0.36} Z`} fill={d.tie} stroke={stroke} strokeWidth={2.5} />}
          </>
        )}
        {d.top === 'wrapper' && (
          <path d={`M${-shW / 2 + 6},${shY + torso * 0.45} L${shW / 2 - 6},${shY + torso * 0.45}`} stroke={d.topAccent} strokeWidth={7} />
        )}
        {d.patches && (
          <>
            <rect x={-shW * 0.38} y={shY + torso * 0.55} width={16} height={13} rx={2} fill="#2B3A67" stroke={stroke} strokeWidth={2.5} transform={`rotate(-8,${-shW * 0.3},${shY + torso * 0.6})`} />
            <circle cx={shW * 0.27} cy={shY + torso * 0.3} r={7} fill="#F2C14E" stroke={stroke} strokeWidth={2.5} />
          </>
        )}
        {/* neck */}
        <rect x={-headR * 0.22} y={headY + headR * 0.6} width={headR * 0.44} height={shY - (headY + headR * 0.6) + 6} fill={d.skinShade} stroke={stroke} strokeWidth={3} />
        {/* head */}
        <g transform={`rotate(${tilt},0,${headY + headR})`}>
          {hairBack}
          {d.earrings && [-1, 1].map((s) => <circle key={s} cx={s * headR * 0.98} cy={headY + headR * 0.28} r={5} fill={C.gold} stroke={stroke} strokeWidth={2} />)}
          <circle cx={0} cy={headY} r={headR} fill={d.skin} stroke={stroke} strokeWidth={sw} />
          {d.beard && <path d={`M${-headR * 0.85},${headY + headR * 0.1} Q0,${headY + headR * 1.35} ${headR * 0.85},${headY + headR * 0.1} Q0,${headY + headR * 0.75} ${-headR * 0.85},${headY + headR * 0.1} Z`} fill={d.hairColor} opacity={0.85} />}
          {hairFront}
          {eye(-1)}
          {eye(1)}
          {brow(-1)}
          {brow(1)}
          {d.glasses &&
            [-1, 1].map((s) => (
              <g key={`g${s}`}>
                {d.glasses === 'round' ? (
                  <circle cx={s * headR * 0.36} cy={headY - headR * 0.04} r={headR * 0.27} fill="#FFFFFF22" stroke={C.ink} strokeWidth={3.5} />
                ) : (
                  <rect x={s * headR * 0.36 - headR * 0.28} y={headY - headR * 0.28} width={headR * 0.56} height={headR * 0.46} rx={5} fill="#FFFFFF22" stroke={C.ink} strokeWidth={3.5} />
                )}
              </g>
            ))}
          {d.glasses && <path d={`M${-headR * 0.1},${headY - headR * 0.08} L${headR * 0.1},${headY - headR * 0.08}`} stroke={C.ink} strokeWidth={3} />}
          {d.wrinkles && (
            <>
              <path d={`M${-headR * 0.62},${headY + headR * 0.24} q6,6 12,0`} stroke={d.skinShade} strokeWidth={3} fill="none" />
              <path d={`M${headR * 0.5},${headY + headR * 0.24} q6,6 12,0`} stroke={d.skinShade} strokeWidth={3} fill="none" />
            </>
          )}
          <path d={`M-4,${headY + headR * 0.18} q4,5 8,0`} stroke={d.skinShade} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          {mouth}
        </g>
        {/* front arm */}
        <Limbs path={RA.d} color={d.topColor} w={limb} />
        <circle cx={RA.hx} cy={RA.hy} r={limb * 0.62 * (1 - fist * 0.18)} fill={d.skin} stroke={stroke} strokeWidth={4} />
        {fist > 0.5 && <path d={`M${RA.hx - limb * 0.35},${RA.hy - limb * 0.1} l${limb * 0.7},0`} stroke={d.skinShade} strokeWidth={3} />}
        {holding && <g transform={`translate(${RA.hx},${RA.hy})`}>{holding}</g>}
        {palmGlow > 0 &&
          (glowHand === 'both' ? [LA, RA] : glowHand === 'l' ? [LA] : [RA]).map((hnd, i) => (
            <g key={`pg${i}`} opacity={palmGlow * (1 - fist)}>
              <circle cx={hnd.hx} cy={hnd.hy} r={limb * 3.2} fill={d.signature} opacity={0.18 + 0.06 * Math.sin(frame * 0.4)} />
              <circle cx={hnd.hx} cy={hnd.hy} r={limb * 1.5} fill={d.signature} opacity={0.4} />
              <circle cx={hnd.hx} cy={hnd.hy} r={limb * 0.5} fill="#FFF3D6" />
              {[0, 1, 2, 3, 4, 5].map((k) => {
                const a = (k / 6) * Math.PI * 2 + frame * 0.05;
                const rr = limb * (1.8 + 0.6 * Math.sin(frame * 0.2 + k));
                return <circle key={k} cx={hnd.hx + Math.cos(a) * rr} cy={hnd.hy + Math.sin(a) * rr} r={2.5} fill="#FFE2B0" />;
              })}
            </g>
          ))}
      </g>
    </g>
  );
};
