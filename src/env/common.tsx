import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {rand} from '../fx/sky';
import {C} from '../theme';

export const Stage: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = C.night}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{overflow: 'hidden'}}>
      {children}
    </svg>
  </AbsoluteFill>
);

/** Procedural skyline. style: 'lagos' (low roofs, water tanks, dishes) | 'tower' (high-rise) | 'nyc'. */
export const Skyline: React.FC<{
  seed: number;
  base: number;
  color: string;
  window?: string;
  style?: 'lagos' | 'tower' | 'nyc';
  x0?: number;
  x1?: number;
  minH?: number;
  maxH?: number;
  litChance?: number;
  frame?: number;
}> = ({seed, base, color, window = '#FFD58A', style = 'lagos', x0 = -100, x1 = 2020, minH = 80, maxH = 260, litChance = 0.35, frame = 0}) => {
  const blds = useMemo(() => {
    const r = rand(seed);
    const out: {x: number; w: number; h: number; tank: boolean; dish: boolean; spire: boolean; lit: boolean[][]}[] = [];
    let x = x0;
    while (x < x1) {
      const w = style === 'lagos' ? 90 + r() * 140 : 70 + r() * 110;
      const h = minH + Math.pow(r(), style === 'nyc' ? 1.4 : 1.8) * (maxH - minH);
      const cols = Math.max(1, Math.floor((w - 20) / 28));
      const rows = Math.max(1, Math.floor((h - 30) / 34));
      const lit = Array.from({length: rows}, () => Array.from({length: cols}, () => r() < litChance));
      out.push({x, w, h, tank: style === 'lagos' && r() > 0.55, dish: style === 'lagos' && r() > 0.7, spire: style === 'nyc' && r() > 0.82, lit});
      x += w + (style === 'lagos' ? r() * 18 : 4 + r() * 10);
    }
    return out;
  }, [seed, x0, x1, minH, maxH, style, litChance]);
  return (
    <g>
      {blds.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h + 400} fill={color} />
          {style === 'lagos' && <path d={`M${b.x - 6},${base - b.h} L${b.x + b.w / 2},${base - b.h - 18} L${b.x + b.w + 6},${base - b.h}`} fill={color} />}
          {b.tank && (
            <g>
              <rect x={b.x + b.w * 0.6} y={base - b.h - 54} width={34} height={36} rx={6} fill={color} />
              <rect x={b.x + b.w * 0.6 + 4} y={base - b.h - 18} width={4} height={18} fill={color} />
              <rect x={b.x + b.w * 0.6 + 26} y={base - b.h - 18} width={4} height={18} fill={color} />
            </g>
          )}
          {b.dish && <path d={`M${b.x + 20},${base - b.h - 6} a18,12 -30 0,1 30,-24 z`} fill={color} />}
          {b.spire && <path d={`M${b.x + b.w / 2 - 14},${base - b.h} L${b.x + b.w / 2},${base - b.h - 120} L${b.x + b.w / 2 + 14},${base - b.h} Z`} fill={color} />}
          {b.lit.map((row, ri) =>
            row.map((on, ci) =>
              on ? (
                <rect
                  key={`${ri}-${ci}`}
                  x={b.x + 12 + ci * 28}
                  y={base - b.h + 22 + ri * 34}
                  width={14}
                  height={18}
                  fill={window}
                  opacity={0.65 + 0.35 * Math.sin(frame * 0.02 + ri * 3 + ci + i)}
                />
              ) : null,
            ),
          )}
        </g>
      ))}
    </g>
  );
};

export const Palm: React.FC<{x: number; y: number; s?: number; color?: string; sway?: number}> = ({x, y, s = 1, color = '#0A0F22', sway = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M0,0 C6,-80 -4,-160 10,-240" stroke={color} strokeWidth={14} fill="none" />
    <g transform={`translate(10,-240) rotate(${sway})`}>
      {[-150, -110, -60, -20, 20, 60, 110].map((a, i) => (
        <path key={i} d={`M0,0 q${Math.cos((a * Math.PI) / 180) * 70},${Math.sin((a * Math.PI) / 180) * 70 - 20} ${Math.cos((a * Math.PI) / 180) * 130},${Math.sin((a * Math.PI) / 180) * 130 + 30}`} stroke={color} strokeWidth={16} fill="none" strokeLinecap="round" />
      ))}
    </g>
  </g>
);

export const Bulb: React.FC<{x: number; y: number; on?: number; cord?: number; color?: string}> = ({x, y, on = 1, cord = 80, color = '#FFC873'}) => (
  <g>
    <line x1={x} y1={y - cord} x2={x} y2={y} stroke={C.ink} strokeWidth={3} />
    <circle cx={x} cy={y + 10} r={160} fill={color} opacity={0.12 * on} />
    <circle cx={x} cy={y + 10} r={60} fill={color} opacity={0.25 * on} />
    <circle cx={x} cy={y + 10} r={13} fill={on > 0.5 ? '#FFF3C8' : '#555'} stroke={C.ink} strokeWidth={3} />
  </g>
);

export const Goat: React.FC<{x: number; y: number; s?: number; frame: number; flip?: boolean; unimpressed?: boolean}> = ({x, y, s = 1, frame, flip, unimpressed}) => {
  const chew = Math.sin(frame * 0.5) * 3;
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      {[-50, -20, 30, 55].map((lx, i) => (
        <rect key={i} x={lx} y={-50} width={12} height={50} rx={5} fill="#E9E1D2" stroke={C.ink} strokeWidth={4} />
      ))}
      <ellipse cx={0} cy={-75} rx={85} ry={45} fill="#F4EEE3" stroke={C.ink} strokeWidth={5} />
      <ellipse cx={20} cy={-80} rx={30} ry={18} fill="#8B6A4F" opacity={0.5} />
      <path d="M-80,-95 q-6,-30 -2,-50" stroke={C.ink} strokeWidth={5} fill="none" />
      <g transform={`translate(-95,${-110 + chew * 0.3})`}>
        <ellipse cx={0} cy={0} rx={34} ry={28} fill="#F4EEE3" stroke={C.ink} strokeWidth={5} />
        <path d="M-10,-24 q-14,-30 6,-40" stroke="#8B6A4F" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M10,-24 q10,-30 30,-34" stroke="#8B6A4F" strokeWidth={8} fill="none" strokeLinecap="round" />
        <ellipse cx={-28} cy={-6} rx={18} ry={8} fill="#E9E1D2" stroke={C.ink} strokeWidth={4} transform="rotate(25,-28,-6)" />
        <ellipse cx={-6} cy={-4} rx={7} ry={unimpressed ? 3 : 7} fill={C.white} stroke={C.ink} strokeWidth={3} />
        {unimpressed && <path d="M-14,-9 L2,-9" stroke={C.ink} strokeWidth={4} />}
        <circle cx={-6} cy={-3} r={2.5} fill={C.ink} />
        <path d={`M-30,${16 + chew} q8,4 16,0`} stroke={C.ink} strokeWidth={3} fill="none" />
        <path d="M-14,24 q-2,16 4,24" stroke="#D9CFC0" strokeWidth={6} fill="none" />
      </g>
    </g>
  );
};

export const Radio: React.FC<{x: number; y: number; s?: number; glow?: number; frame?: number}> = ({x, y, s = 1, glow = 0, frame = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {glow > 0 && <circle cx={0} cy={-30} r={90} fill="#FFD58A" opacity={0.25 * glow} />}
    <rect x={-60} y={-70} width={120} height={70} rx={12} fill="#8C5A3C" stroke={C.ink} strokeWidth={4} />
    <circle cx={-25} cy={-35} r={22} fill="#3B2A20" stroke={C.ink} strokeWidth={3} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={-25} cy={-35} r={6 + i * 6} fill="none" stroke="#5A4232" strokeWidth={2} />
    ))}
    <rect x={8} y={-55} width={40} height={14} rx={3} fill={glow > 0 ? '#FFE6A8' : '#C9B79A'} stroke={C.ink} strokeWidth={2} />
    <circle cx={18} cy={-20} r={7} fill={C.gold} stroke={C.ink} strokeWidth={2} />
    <circle cx={38} cy={-20} r={7} fill={C.gold} stroke={C.ink} strokeWidth={2} />
    <line x1={40} y1={-70} x2={70} y2={-130} stroke={C.ink} strokeWidth={3} />
    {glow > 0 &&
      [0, 1, 2].map((i) => {
        const p = ((frame / 40 + i / 3) % 1);
        return (
          <text key={i} x={-10 + p * 60 + i * 20} y={-80 - p * 120} fill={C.gold} opacity={(1 - p) * glow} fontSize={40} fontFamily="serif">
            {i % 2 ? '♪' : '♫'}
          </text>
        );
      })}
  </g>
);

/** Rain streaks over a region. */
export const Rain: React.FC<{frame: number; count?: number; opacity?: number; angle?: number}> = ({frame, count = 140, opacity = 0.5, angle = 14}) => {
  const drops = useMemo(() => {
    const r = rand(99);
    return Array.from({length: count}, () => ({x: r() * 2200 - 100, y: r() * 1080, l: 30 + r() * 50, sp: 30 + r() * 20}));
  }, [count]);
  return (
    <g opacity={opacity} transform={`rotate(${angle},960,540)`}>
      {drops.map((d, i) => {
        const y = (d.y + frame * d.sp) % 1200 - 60;
        return <line key={i} x1={d.x} y1={y} x2={d.x} y2={y + d.l} stroke="#BFD8FF" strokeWidth={2} />;
      })}
    </g>
  );
};

/** Lower-third label (place/time stamps) — on-screen text used sparingly. */
export const Stamp: React.FC<{x?: number; y?: number; text: string; sub?: string; opacity?: number}> = ({x = 80, y = 110, text, sub, opacity = 1}) => (
  <g opacity={opacity}>
    <rect x={x - 20} y={y - 52} width={Math.max(text.length, (sub ?? '').length * 0.8) * 22 + 60} height={sub ? 104 : 72} rx={12} fill="#0B1026CC" />
    <text x={x} y={y} fill={C.gold} fontFamily="'IBM Plex Mono', monospace" fontWeight={600} fontSize={34} letterSpacing={3}>
      {text}
    </text>
    {sub && (
      <text x={x} y={y + 38} fill={C.pearl} fontFamily="'IBM Plex Mono', monospace" fontSize={24} letterSpacing={2} opacity={0.85}>
        {sub}
      </text>
    )}
  </g>
);
