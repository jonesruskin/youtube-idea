import React, {useMemo} from 'react';
import {C} from '../theme';

export const rand = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

/** Seeded starfield with twinkle and optional parallax drift. */
export const Stars: React.FC<{
  seed?: number;
  count?: number;
  frame: number;
  w?: number;
  h?: number;
  drift?: [number, number];
  maxR?: number;
  opacity?: number;
  y0?: number;
}> = ({seed = 7, count = 260, frame, w = 1920, h = 1080, drift = [0, 0], maxR = 2.4, opacity = 1, y0 = 0}) => {
  const stars = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: count}, () => ({x: r() * w, y: r() * h, r: 0.5 + Math.pow(r(), 3) * maxR, p: r() * 6.28, sp: 0.04 + r() * 0.08, warm: r() > 0.85}));
  }, [seed, count, w, h, maxR]);
  return (
    <g opacity={opacity}>
      {stars.map((s, i) => {
        const tw = 0.55 + 0.45 * Math.sin(frame * s.sp + s.p);
        const x = (((s.x + drift[0] * frame * s.r) % w) + w) % w;
        const y = y0 + ((((s.y + drift[1] * frame * s.r) % h) + h) % h);
        return <circle key={i} cx={x} cy={y} r={s.r} fill={s.warm ? '#FFE3B8' : C.star} opacity={tw} />;
      })}
    </g>
  );
};

export const NightGradient: React.FC<{id: string; top?: string; bottom?: string}> = ({id, top = C.night, bottom = C.dusk}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor={top} />
    <stop offset="1" stopColor={bottom} />
  </linearGradient>
);

/** Soft glow blob (radial gradient) — lights, halos, nebula. */
export const Glow: React.FC<{cx: number; cy: number; r: number; color: string; opacity?: number; id: string}> = ({cx, cy, r, color, opacity = 1, id}) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={opacity} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </>
);

/** Orion as seen from the ground: real relative star positions (RA/Dec), Betelgeuse dimmable. */
const ORION = [
  {n: 'Betelgeuse', ra: 88.79, dec: 7.41, mag: 0.5, c: C.betelgeuse},
  {n: 'Bellatrix', ra: 81.28, dec: 6.35, mag: 1.6, c: '#CFE0FF'},
  {n: 'Meissa', ra: 83.78, dec: 9.93, mag: 3.4, c: '#DDE6FF'},
  {n: 'Mintaka', ra: 83.0, dec: -0.3, mag: 2.2, c: '#DDE6FF'},
  {n: 'Alnilam', ra: 84.05, dec: -1.2, mag: 1.7, c: '#DDE6FF'},
  {n: 'Alnitak', ra: 85.19, dec: -1.94, mag: 1.8, c: '#DDE6FF'},
  {n: 'Saiph', ra: 86.94, dec: -9.67, mag: 2.1, c: '#DDE6FF'},
  {n: 'Rigel', ra: 78.63, dec: -8.2, mag: 0.1, c: '#BFD4FF'},
];
const LINES: [string, string][] = [
  ['Betelgeuse', 'Bellatrix'],
  ['Betelgeuse', 'Meissa'],
  ['Bellatrix', 'Meissa'],
  ['Betelgeuse', 'Alnitak'],
  ['Bellatrix', 'Mintaka'],
  ['Mintaka', 'Alnilam'],
  ['Alnilam', 'Alnitak'],
  ['Alnitak', 'Saiph'],
  ['Mintaka', 'Rigel'],
];

export const Orion: React.FC<{cx: number; cy: number; scale: number; frame: number; betelgeuse?: number; lines?: number; labels?: boolean}> = ({
  cx,
  cy,
  scale,
  frame,
  betelgeuse = 1,
  lines = 0.35,
  labels = false,
}) => {
  const pos = (s: (typeof ORION)[number]) => [cx - (s.ra - 83.8) * scale, cy - s.dec * scale] as const;
  const byName = Object.fromEntries(ORION.map((s) => [s.n, pos(s)]));
  return (
    <g>
      {LINES.map(([a, b]) => {
        const fade = a === 'Betelgeuse' || b === 'Betelgeuse' ? Math.max(0.15, betelgeuse) : 1;
        return <line key={a + b} x1={byName[a][0]} y1={byName[a][1]} x2={byName[b][0]} y2={byName[b][1]} stroke={C.pearl} strokeOpacity={lines * fade} strokeWidth={2} strokeDasharray="6 8" />;
      })}
      {ORION.map((s) => {
        const [x, y] = pos(s);
        const isB = s.n === 'Betelgeuse';
        const k = isB ? betelgeuse : 1;
        const r = (4.6 - s.mag) * 2.4 * (isB ? 1.2 : 1);
        const tw = 0.85 + 0.15 * Math.sin(frame * 0.13 + x);
        return (
          <g key={s.n} opacity={k}>
            <circle cx={x} cy={y} r={r * 5} fill={s.c} opacity={0.12 * tw} />
            <circle cx={x} cy={y} r={r * 2.2} fill={s.c} opacity={0.28 * tw} />
            <circle cx={x} cy={y} r={r} fill={isB ? '#FFB27A' : '#F5F8FF'} />
            {labels && (
              <text x={x + r * 3} y={y + 6} fill={C.pearl} opacity={0.8} fontSize={26} fontFamily="'Space Grotesk', sans-serif">
                {s.n}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Puffy flat cloud made of circles. */
export const Cloud: React.FC<{x: number; y: number; s?: number; color?: string; opacity?: number}> = ({x, y, s = 1, color = '#2A3570', opacity = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
    <ellipse cx={0} cy={20} rx={180} ry={34} fill={color} />
    <circle cx={-80} cy={0} r={52} fill={color} />
    <circle cx={-10} cy={-22} r={70} fill={color} />
    <circle cx={70} cy={0} r={50} fill={color} />
  </g>
);
