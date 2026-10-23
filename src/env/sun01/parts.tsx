import React, {useId, useMemo} from 'react';
import {rand, Stars} from '../../fx/sky';
import {Bloom} from '../../fx/cinema/atmos';
import {C} from '../../theme';

/** File 001 palette: the colour script, in one place. */
export const P = {
  sunWall: '#F6DDB4',
  sunWallShade: '#E8C493',
  sunFloor: '#C98E5E',
  night: '#070A1C',
  nightSky: ['#03050F', '#0B1233', '#1A2350'] as const,
  coldSky: ['#050916', '#0E1A3A', '#22365E'] as const,
  ice: '#DDEBFA',
  iceShade: '#9DB6D6',
  snow: '#EEF4FB',
  snowShade: '#B9C9DE',
  amber: '#FFB25A',
  amberDeep: '#C8742E',
  tunnel: '#2A2230',
  tunnelLit: '#5A4033',
  grow: '#FF5FD2',
  window: '#FFD58A',
};

/** Night/cold grade over a set: deep blue multiply, so flat colours sit in the dark without going grey. */
export const NightGrade: React.FC<{amount: number; color?: string}> = ({amount, color = '#16204F'}) =>
  amount > 0 ? <rect x={-600} y={-600} width={3200} height={2400} fill={color} opacity={amount} style={{mixBlendMode: 'multiply'}} /> : null;

/** Warm practical light: a candle or lantern with flicker, its glow and a pool of light. */
export const Flame: React.FC<{x: number; y: number; s?: number; frame: number; kind?: 'candle' | 'lantern'; glow?: number; seed?: number}> = ({x, y, s = 1, frame, kind = 'candle', glow = 1, seed = 0}) => {
  const fl = 0.85 + 0.15 * Math.sin(frame * 0.6 + seed) * Math.sin(frame * 0.23 + seed * 2);
  return (
    <g>
      <Bloom x={x} y={y - 20 * s} r={340 * s * glow} color="#FFB867" opacity={0.55 * fl} />
      <g transform={`translate(${x},${y}) scale(${s})`}>
        {kind === 'candle' ? (
          <g>
            <rect x={-12} y={-6} width={24} height={60} rx={4} fill="#F4EFE6" stroke={C.ink} strokeWidth={3.5} />
            <path d={`M0,-8 Q${-9 * fl},-26 0,${-44 * fl} Q${9 * fl},-26 0,-8 Z`} fill="#FFD27A" />
            <path d={`M0,-10 Q-4,-20 0,${-30 * fl} Q4,-20 0,-10 Z`} fill="#FFF6DA" />
          </g>
        ) : (
          <g>
            <path d="M-26,-70 Q0,-96 26,-70" stroke={C.ink} strokeWidth={5} fill="none" />
            <rect x={-28} y={-70} width={56} height={14} rx={4} fill="#3A3F52" stroke={C.ink} strokeWidth={3.5} />
            <rect x={-22} y={-56} width={44} height={50} rx={6} fill="#FFE3A6" opacity={0.95} stroke={C.ink} strokeWidth={3.5} />
            <path d={`M0,-14 Q${-8 * fl},-30 0,${-46 * fl} Q${8 * fl},-30 0,-14 Z`} fill="#FFB24A" />
            <rect x={-28} y={-8} width={56} height={12} rx={4} fill="#3A3F52" stroke={C.ink} strokeWidth={3.5} />
          </g>
        )}
      </g>
    </g>
  );
};

type Block = {x: number; w: number; h: number; rows: number; cols: number; lit: boolean[]; col: string; roof: number};

/**
 * A city of high-rises for File 001. `lights` 0..1 sets how many windows burn; `darkWave` (0..1) kills
 * whole blocks in a wave sweeping right→left (the grid failing). `snow` caps the roofs.
 */
export const CityBlocks: React.FC<{
  seed: number;
  base: number;
  color: string;
  x0?: number;
  x1?: number;
  minH?: number;
  maxH?: number;
  lights?: number;
  darkWave?: number;
  snow?: number;
  frame: number;
  windowColor?: string;
  sunlit?: string;
}> = ({seed, base, color, x0 = -400, x1 = 2400, minH = 160, maxH = 520, lights = 0.5, darkWave = -1, snow = 0, frame, windowColor = P.window, sunlit}) => {
  const blocks = useMemo(() => {
    const r = rand(seed);
    const out: Block[] = [];
    let x = x0;
    while (x < x1) {
      const w = 90 + r() * 150;
      const h = minH + Math.pow(r(), 1.5) * (maxH - minH);
      const cols = Math.max(2, Math.floor(w / 26));
      const rows = Math.max(2, Math.floor(h / 30));
      out.push({x, w, h, rows, cols, lit: Array.from({length: rows * cols}, () => r() < 0.75), col: color, roof: r()});
      x += w + 6 + r() * 26;
    }
    return out;
  }, [seed, x0, x1, minH, maxH, color]);
  return (
    <g>
      {blocks.map((b, i) => {
        // wave runs from x1 (right) to x0 (left)
        const u = 1 - (b.x - x0) / (x1 - x0);
        const dead = darkWave >= 0 && u < darkWave * 1.15 - 0.08;
        const dying = darkWave >= 0 && !dead && u < darkWave * 1.15;
        return (
          <g key={i}>
            <rect x={b.x} y={base - b.h} width={b.w} height={b.h + 600} fill={b.col} />
            {sunlit && <rect x={b.x + b.w * 0.62} y={base - b.h} width={b.w * 0.38} height={b.h + 600} fill={sunlit} opacity={0.35} />}
            {b.roof > 0.7 && <rect x={b.x + b.w * 0.3} y={base - b.h - 40} width={6} height={40} fill={b.col} />}
            {b.roof > 0.7 && <circle cx={b.x + b.w * 0.3 + 3} cy={base - b.h - 42} r={4} fill="#FF4A4A" opacity={dead ? 0 : 0.5 + 0.5 * Math.sin(frame * 0.12 + i)} />}
            {snow > 0 && <rect x={b.x - 4} y={base - b.h - 10 * snow} width={b.w + 8} height={14 * snow} rx={6} fill={P.snow} />}
            {!dead &&
              lights > 0 &&
              b.lit.map((on, k) => {
                if (!on) return null;
                const rr = Math.floor(k / b.cols);
                const cc = k % b.cols;
                const v = (Math.sin(k * 12.9898 + i * 78.233) * 43758.5453) % 1;
                if (Math.abs(v) > lights) return null;
                const flick = dying ? (Math.sin(frame * 1.7 + k) > 0.2 ? 1 : 0.15) : 1;
                return <rect key={k} x={b.x + 10 + cc * 24} y={base - b.h + 18 + rr * 30} width={11} height={15} fill={windowColor} opacity={0.85 * flick} />;
              })}
          </g>
        );
      })}
    </g>
  );
};

/** Night sky gradient + stars. */
export const NightSky: React.FC<{frame: number; stars?: number; colors?: readonly [string, string, string]; seed?: number; x0?: number; y0?: number; w?: number; h?: number}> = ({
  frame,
  stars = 1,
  colors = P.nightSky,
  seed = 41,
  x0 = -600,
  y0 = -500,
  w = 3200,
  h = 2200,
}) => {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <linearGradient id={`ns${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="0.6" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[2]} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={w} height={h} fill={`url(#ns${id})`} />
      {stars > 0 && <Stars frame={frame} count={Math.round(420 * stars)} w={2600} h={1000} seed={seed} opacity={Math.min(1, stars)} maxR={2.3} y0={-200} />}
    </g>
  );
};

/** String lights (star-shaped bulbs) hung between two points. */
export const StringLights: React.FC<{x1: number; y1: number; x2: number; y2: number; sag?: number; on?: number; frame: number; color?: string; n?: number}> = ({x1, y1, x2, y2, sag = 60, on = 1, frame, color = '#FFE08A', n = 14}) => {
  const pts = Array.from({length: n}, (_, i) => {
    const t = (i + 0.5) / n;
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag];
  });
  return (
    <g>
      <path d={`M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + sag * 2} ${x2},${y2}`} stroke="#1A1420" strokeWidth={2.5} fill="none" />
      {pts.map(([x, y], i) => {
        const tw = on * (0.75 + 0.25 * Math.sin(frame * 0.08 + i * 1.7));
        return (
          <g key={i} transform={`translate(${x},${y + 6})`}>
            {on > 0 && <circle r={22} fill={color} opacity={0.18 * tw} />}
            <path d="M0,-8 L2.4,-2.5 L8,-2.5 L3.5,1 L5,7 L0,3.5 L-5,7 L-3.5,1 L-8,-2.5 L-2.4,-2.5 Z" fill={on > 0 ? color : '#4A4050'} opacity={on > 0 ? 0.6 + 0.4 * tw : 1} />
          </g>
        );
      })}
    </g>
  );
};

/** A metro carriage turned into a home: lit windows, curtains, a chimney pipe. */
export const Carriage: React.FC<{x: number; y: number; w?: number; lit?: number; color?: string}> = ({x, y, w = 760, lit = 1, color = '#8C9AAE'}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={-230} width={w} height={210} rx={24} fill={color} stroke={C.ink} strokeWidth={5} />
    <rect x={0} y={-60} width={w} height={14} fill="#C8742E" opacity={0.8} />
    {Array.from({length: Math.floor(w / 130)}, (_, i) => (
      <g key={i}>
        <rect x={30 + i * 130} y={-200} width={96} height={90} rx={10} fill={lit > 0 ? '#FFD08A' : '#2A2433'} opacity={lit > 0 ? 0.5 + lit * 0.5 : 1} stroke={C.ink} strokeWidth={4} />
        <path d={`M${34 + i * 130},${-196} q24,40 0,82`} stroke={['#C2464F', '#3C8D6E', '#D9A441', '#5E8FC9'][i % 4]} strokeWidth={14} fill="none" opacity={0.85} />
      </g>
    ))}
    {[0.2, 0.8].map((t) => (
      <circle key={t} cx={w * t} cy={-14} r={18} fill="#2A2433" stroke={C.ink} strokeWidth={4} />
    ))}
  </g>
);

/** Camping tent (triangle with a lit doorway). */
export const Tent: React.FC<{x: number; y: number; s?: number; color: string; lit?: number}> = ({x, y, s = 1, color, lit = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-90,0 L0,-120 L90,0 Z" fill={color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-26,0 L0,-62 L26,0 Z" fill={lit > 0 ? '#FFD08A' : '#1A1420'} opacity={0.4 + lit * 0.6} stroke={C.ink} strokeWidth={4} />
    <path d="M0,-120 L0,0" stroke="#00000033" strokeWidth={3} />
  </g>
);

/** A child's chalk sun (each one slightly different). */
export const ChalkSun: React.FC<{x: number; y: number; r?: number; seed: number; color?: string; draw?: number; width?: number}> = ({x, y, r = 30, seed, color = '#FFE7A6', draw = 1, width = 4}) => {
  const rr = rand(seed + 3);
  const rays = 7 + Math.floor(rr() * 6);
  const wob = Array.from({length: 13}, () => 0.9 + rr() * 0.2);
  const circle = wob.map((k, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `${i ? 'L' : 'M'}${(x + Math.cos(a) * r * k).toFixed(1)},${(y + Math.sin(a) * r * k).toFixed(1)}`;
  });
  const circleLen = 2 * Math.PI * r;
  const cDraw = Math.min(1, draw * 1.6);
  const rDraw = Math.max(0, (draw - 0.55) / 0.45);
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" opacity={0.9}>
      <path d={circle.join(' ')} strokeDasharray={circleLen * 1.1} strokeDashoffset={circleLen * 1.1 * (1 - cDraw)} />
      {Array.from({length: rays}, (_, i) => {
        if (i / rays > rDraw) return null;
        const a = (i / rays) * Math.PI * 2 + rr() * 0.2;
        const l = r * (0.45 + rr() * 0.4);
        return <path key={i} d={`M${x + Math.cos(a) * r * 1.25},${y + Math.sin(a) * r * 1.25} L${x + Math.cos(a) * (r * 1.25 + l)},${y + Math.sin(a) * (r * 1.25 + l)}`} />;
      })}
      {rDraw > 0.8 && (
        <g>
          <circle cx={x - r * 0.35} cy={y - r * 0.15} r={2} fill={color} />
          <circle cx={x + r * 0.35} cy={y - r * 0.15} r={2} fill={color} />
          <path d={`M${x - r * 0.35},${y + r * 0.25} Q${x},${y + r * 0.55} ${x + r * 0.35},${y + r * 0.25}`} />
        </g>
      )}
    </g>
  );
};
