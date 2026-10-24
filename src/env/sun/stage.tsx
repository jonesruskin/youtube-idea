import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Actors, designOf, resolveAt, type Act, type CastEntry} from '../../characters/toon/acting';
import {HERO_PX} from '../../characters/toon/design';
import {useShot} from '../../engine/shot-context';
import {Cine, Plane, ScreenPlane, type CamKey} from '../../fx/cinema/camera';

/**
 * The stage: one detailed set + the cast + a camera. Sets are drawn once at natural scale; the camera frames
 * wides, mediums and close-ups by zooming into them, with parallax between depth layers. Characters always
 * live on the depth-1 plane, so their relative sizes can never drift between shots.
 */
export type SetCtx = {
  v: string;
  t: number;
  frame: number;
  dur: number;
  p: Record<string, any>;
  /** Seconds for a timing prop (number or "l<i>±s"). */
  at: (spec: unknown, fallback?: number) => number;
  /** 0→1 ramp starting at a timing prop. */
  ramp: (spec: unknown, len?: number, fallback?: number) => number;
};
export type Layer = {depth: number; node: React.ReactNode; blur?: number; front?: boolean};
export type SetDef = {
  layers: (c: SetCtx) => Layer[];
  /** World-space light drawn over the actors (practicals, torch pools), depth 1. */
  light?: (c: SetCtx) => React.ReactNode;
  /** Screen-space grade over everything. */
  grade?: (c: SetCtx) => React.ReactNode;
  handheld?: number;
};

const SETS: Record<string, SetDef> = {};
export const registerSet = (name: string, def: SetDef) => {
  SETS[name] = def;
};

export const useSetCtx = (): SetCtx => {
  const {t, frame, dur, props, shot} = useShot();
  const lines = shot.timedLines as any[];
  const at = (spec: unknown, fallback = 0) => (spec === undefined || spec === true ? fallback : typeof spec === 'number' || typeof spec === 'string' ? resolveAt(spec, lines) : fallback);
  const ramp = (spec: unknown, len = 0.6, fallback = 0) =>
    interpolate(t, [at(spec, fallback), at(spec, fallback) + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return {v: props.v ?? '', t, frame, dur, p: props, at, ramp};
};

export const Stage: React.FC = () => {
  const {progress, frame, props} = useShot();
  const def = SETS[props.set];
  if (!def) throw new Error(`Unknown set "${props.set}"`);
  const c = useSetCtx();
  const layers = def.layers(c);
  const keys = frameFaces((props.cam as CamKey[]) ?? [[0, 1, 960, 540]], (props.cast as CastEntry[]) ?? []);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <Cine keys={keys} progress={progress} frame={frame} handheld={def.handheld ?? 0.35}>
          {layers
            .filter((l) => !l.front)
            .map((l, i) => (
              <Plane key={`b${i}`} depth={l.depth} blur={l.blur}>
                {l.node}
              </Plane>
            ))}
          <Plane depth={1}>
            <Actors cast={(props.cast as CastEntry[]) ?? []} acts={(props.acts as Act[]) ?? []} />
          </Plane>
          {def.light && <Plane depth={1}>{def.light(c)}</Plane>}
          {layers
            .filter((l) => l.front)
            .map((l, i) => (
              <Plane key={`f${i}`} depth={l.depth} blur={l.blur}>
                {l.node}
              </Plane>
            ))}
          <ScreenPlane>{def.grade?.(c)}</ScreenPlane>
        </Cine>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Close-ups frame faces, not coordinates: any key zoomed in past 1.8× re-centres vertically on the face of the
 * cast member nearest the key's x (so a close-up can never crop a head off, whatever the character's height).
 */
const faceOf = (c: CastEntry): [number, number] => {
  if (c.who === 'biscuit') return [c.x + 42 * c.depth * (c.facing === 'left' ? -1 : 1), c.y - 84 * c.depth];
  const d = designOf(c.who)!;
  const H = HERO_PX * d.height * c.depth;
  return [c.x, c.y - H * (1 - d.head)];
};
const frameFaces = (keys: CamKey[], cast: CastEntry[]): CamKey[] =>
  keys.map((k) => {
    if (k[1] < 1.8 || !cast.length) return k;
    const near = [...cast].sort((a, b) => Math.abs(a.x - k[2]) - Math.abs(b.x - k[2]))[0];
    const [, fy] = faceOf(near);
    const H = near.who === 'biscuit' ? 100 * near.depth : HERO_PX * designOf(near.who)!.height * near.depth;
    return [k[0], k[1], k[2], fy + H * 0.12, k[4]] as CamKey;
  });

// ── world scale ─────────────────────────────────────────────────────────────────────────────────
/**
 * Metres → pixels. The hero is 1.75 m and 300 px tall at depth 1, and casts stand at depth 1.2 in most sets,
 * so 1 m ≈ 206 px on the cast's plane. Every prop a person can stand next to is sized with this.
 */
export const PX_PER_M = HERO_PX / 1.75;
export const M = (m: number, depth = 1.2) => m * PX_PER_M * depth;

// ── shared drawing helpers for sets ────────────────────────────────────────────────────────────
export const INK = '#0B1026';
/** Multiply grade (keeps flat colours rich in the dark). */
export const Grade: React.FC<{color: string; amount: number}> = ({color, amount}) =>
  amount > 0 ? <rect x={-200} y={-200} width={2320} height={1480} fill={color} opacity={amount} style={{mixBlendMode: 'multiply'}} /> : null;
/** Additive light pool (screen blend). */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; opacity?: number; rx?: number}> = ({x, y, r, color, opacity = 0.6, rx}) => {
  const id = `g${Math.round(x)}_${Math.round(y)}_${Math.round(r)}_${color.slice(1)}`;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="0.45" stopColor={color} stopOpacity={opacity * 0.4} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={rx ?? r} ry={r} fill={`url(#${id})`} />
    </g>
  );
};
/** Vignette for the screen plane. */
export const Vignette: React.FC<{amount?: number}> = ({amount = 0.55}) => (
  <g>
    <defs>
      <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={amount} />
      </radialGradient>
    </defs>
    <rect x={-100} y={-100} width={2120} height={1280} fill="url(#vig)" />
  </g>
);
/** A torch cone from (x,y) toward angle (deg, 0 = right), screen-blended. */
export const TorchBeam: React.FC<{x: number; y: number; angle: number; len?: number; spread?: number; opacity?: number}> = ({x, y, angle, len = 900, spread = 22, opacity = 0.5}) => {
  const a = (angle * Math.PI) / 180;
  const s = (spread * Math.PI) / 180;
  const p1 = [x + Math.cos(a - s) * len, y + Math.sin(a - s) * len];
  const p2 = [x + Math.cos(a + s) * len, y + Math.sin(a + s) * len];
  const id = `tb${Math.round(x)}${Math.round(y)}${Math.round(angle)}`;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={id} cx={x} cy={y} r={len} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity={opacity} />
          <stop offset="0.7" stopColor="#FFE3A6" stopOpacity={opacity * 0.25} />
          <stop offset="1" stopColor="#FFE3A6" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M${x},${y} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`} fill={`url(#${id})`} />
    </g>
  );
};
/** Breath-steam / smoke puff field. */
export const Smoke: React.FC<{frame: number; x: number; y: number; w: number; h: number; color?: string; opacity?: number; seed?: number; rise?: number}> = ({frame, x, y, w, h, color = '#8A8F9C', opacity = 0.5, seed = 1, rise = 0.6}) => (
  <g filter="url(#smokeBlur)">
    <defs>
      <filter id="smokeBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={22} />
      </filter>
    </defs>
    {Array.from({length: 14}, (_, i) => {
      const k = Math.sin(seed * 31 + i * 17.3) * 0.5 + 0.5;
      const ph = ((frame * rise + i * 37) % 160) / 160;
      return <circle key={i} cx={x + k * w + Math.sin(frame * 0.02 + i) * 30} cy={y + h - ph * h} r={40 + ph * 110 + k * 30} fill={color} opacity={opacity * Math.sin(ph * Math.PI)} />;
    })}
  </g>
);
export {SETS};
