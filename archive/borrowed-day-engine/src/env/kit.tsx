import React, {useMemo} from 'react';
import {Figure} from '../characters/Figure';
import {extra} from '../characters/registry';
import {rand, Stars} from '../fx/sky';
import {C, fonts} from '../theme';

/**
 * The "rich world" kit: time-of-day skies, painted clouds, atmospheric depth, Lagos street furniture
 * and a colour-grade pass. Every set is built from these so the look stays consistent.
 */
export type TimeOfDay = 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'gold' | 'sunset' | 'storm';

type Look = {skyTop: string; skyMid: string; skyBottom: string; sun?: [number, number, string]; haze: string; grade: string; gradeOpacity: number; windows: boolean; stars: number; cloud: string};
export const LOOKS: Record<TimeOfDay, Look> = {
  night: {skyTop: '#060A1E', skyMid: '#141A44', skyBottom: '#2C2560', haze: '#3A2F6E', grade: '#1E2A6E', gradeOpacity: 0.32, windows: true, stars: 1, cloud: '#1F2552'},
  dawn: {skyTop: '#3B3F8C', skyMid: '#C97BA8', skyBottom: '#FFC6A0', sun: [1500, 760, '#FFD9A8'], haze: '#FFC9B0', grade: '#FF9A9A', gradeOpacity: 0.1, windows: false, stars: 0.25, cloud: '#F4B6C2'},
  morning: {skyTop: '#5FA8E8', skyMid: '#9FD0F2', skyBottom: '#FFE8C2', sun: [1550, 260, '#FFF4D0'], haze: '#FFF1D8', grade: '#FFE2B0', gradeOpacity: 0.06, windows: false, stars: 0, cloud: '#FFFFFF'},
  noon: {skyTop: '#3E93E0', skyMid: '#7CC2F0', skyBottom: '#D8F0FA', sun: [1450, 140, '#FFFDF0'], haze: '#E8F6FC', grade: '#FFF2C8', gradeOpacity: 0.04, windows: false, stars: 0, cloud: '#FFFFFF'},
  afternoon: {skyTop: '#4A8FD6', skyMid: '#93C6EC', skyBottom: '#FBE2B6', sun: [1650, 240, '#FFF0C8'], haze: '#F8E6C8', grade: '#FFC97A', gradeOpacity: 0.08, windows: false, stars: 0, cloud: '#FFF6EA'},
  gold: {skyTop: '#4B6FB8', skyMid: '#E8A36B', skyBottom: '#FFD48A', sun: [1700, 470, '#FFE0A0'], haze: '#FFC98A', grade: '#FF9A3C', gradeOpacity: 0.12, windows: false, stars: 0, cloud: '#FFD2A8'},
  sunset: {skyTop: '#3A3A86', skyMid: '#D86A6A', skyBottom: '#FFAE62', sun: [1720, 640, '#FFC36B'], haze: '#FF9E6B', grade: '#FF6B4A', gradeOpacity: 0.16, windows: true, stars: 0.1, cloud: '#F08A7A'},
  storm: {skyTop: '#0B0F24', skyMid: '#1B2245', skyBottom: '#2C3560', haze: '#2A3358', grade: '#1A2A55', gradeOpacity: 0.38, windows: true, stars: 0, cloud: '#151B38'},
};

/** Sky with sun, glow, stars and haze. Draw first. */
export const Sky: React.FC<{time: TimeOfDay; frame: number; id: string; w?: number; h?: number; x0?: number; y0?: number}> = ({time, frame, id, w = 2600, h = 1500, x0 = -340, y0 = -300}) => {
  const L = LOOKS[time];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.skyTop} />
          <stop offset="0.55" stopColor={L.skyMid} />
          <stop offset="1" stopColor={L.skyBottom} />
        </linearGradient>
        {L.sun && (
          <radialGradient id={`${id}-sun`}>
            <stop offset="0" stopColor={L.sun[2]} stopOpacity={1} />
            <stop offset="0.12" stopColor={L.sun[2]} stopOpacity={0.85} />
            <stop offset="1" stopColor={L.sun[2]} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      <rect x={x0} y={y0} width={w} height={h} fill={`url(#${id}-sky)`} />
      {L.stars > 0 && <Stars frame={frame} count={Math.round(320 * L.stars)} w={2400} h={900} seed={41} opacity={L.stars} maxR={2.2} />}
      {L.sun && (
        <g>
          <circle cx={L.sun[0]} cy={L.sun[1]} r={520} fill={`url(#${id}-sun)`} opacity={0.75} />
          <circle cx={L.sun[0]} cy={L.sun[1]} r={time === 'noon' ? 46 : 70} fill={L.sun[2]} />
        </g>
      )}
    </g>
  );
};

/** Soft painted clouds: overlapping blurred shapes, drifting. */
export const PaintedClouds: React.FC<{time: TimeOfDay; frame: number; seed?: number; y?: number; count?: number; id: string}> = ({time, frame, seed = 3, y = 160, count = 6, id}) => {
  const L = LOOKS[time];
  const clouds = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: count}, () => ({x: r() * 2600 - 300, y: y + r() * 220, s: 0.7 + r() * 1.1, sp: 0.08 + r() * 0.15}));
  }, [seed, count, y]);
  return (
    <g>
      <defs>
        <filter id={`${id}-cblur`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <g filter={`url(#${id}-cblur)`} opacity={time === 'storm' ? 0.95 : 0.85}>
        {clouds.map((c, i) => {
          const x = ((c.x + frame * c.sp) % 2900) - 300;
          return (
            <g key={i} transform={`translate(${x},${c.y}) scale(${c.s})`}>
              <ellipse cx={0} cy={22} rx={190} ry={36} fill={L.cloud} />
              <ellipse cx={-70} cy={0} rx={80} ry={58} fill={L.cloud} />
              <ellipse cx={20} cy={-22} rx={95} ry={70} fill={L.cloud} />
              <ellipse cx={95} cy={4} rx={70} ry={48} fill={L.cloud} />
              {/* lit tops */}
              <ellipse cx={10} cy={-48} rx={60} ry={22} fill="#FFFFFF" opacity={time === 'night' || time === 'storm' ? 0.05 : 0.35} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** Distant high-rise skyline (Lagos Island), tinted toward the sky for depth. */
export const FarCity: React.FC<{time: TimeOfDay; base: number; frame: number; seed?: number}> = ({time, base, frame, seed = 77}) => {
  const L = LOOKS[time];
  const towers = useMemo(() => {
    const r = rand(seed);
    const out: {x: number; w: number; h: number; lit: number[]}[] = [];
    let x = -300;
    while (x < 2500) {
      const w = 50 + r() * 90;
      const h = 80 + Math.pow(r(), 1.6) * 330;
      out.push({x, w, h, lit: Array.from({length: 18}, () => r())});
      x += w + 6 + r() * 40;
    }
    return out;
  }, [seed]);
  const col = time === 'night' || time === 'storm' ? '#1A1E48' : time === 'sunset' ? '#8E5A7A' : time === 'gold' ? '#B08A8E' : time === 'dawn' ? '#9A7FA8' : '#9DB6CF';
  return (
    <g>
      {towers.map((t, i) => (
        <g key={i}>
          <rect x={t.x} y={base - t.h} width={t.w} height={t.h + 40} fill={col} />
          {L.windows &&
            t.lit.map((v, k) =>
              v > 0.55 ? <rect key={k} x={t.x + 8 + (k % 3) * (t.w / 3.2)} y={base - t.h + 14 + Math.floor(k / 3) * 22} width={6} height={9} fill="#FFD58A" opacity={0.5 + 0.5 * Math.sin(frame * 0.03 + k + i)} /> : null,
            )}
        </g>
      ))}
      <rect x={-340} y={base - 120} width={2600} height={160} fill={L.haze} opacity={0.35} />
    </g>
  );
};

const WALLS = ['#E8B04B', '#4FA3A5', '#E07A5F', '#A98BD1', '#7FBF8E', '#F2D16B', '#D6806E', '#6FA8DC'];
// Signboards are wordless; only the presence of a board is random.

/** Colourful 2–3 storey Lagos facades: balconies, AC units, signboards, tanks, dishes, plants. */
export const Facades: React.FC<{time: TimeOfDay; base: number; seed: number; x0?: number; x1?: number; frame: number; signs?: boolean}> = ({time, base, seed, x0 = -300, x1 = 2500, frame, signs = true}) => {
  const L = LOOKS[time];
  const night = time === 'night' || time === 'storm';
  const blds = useMemo(() => {
    const r = rand(seed);
    const out: {x: number; w: number; floors: number; wall: string; sign?: boolean; tank: boolean; dish: boolean; balcony: boolean; ac: boolean; plant: boolean}[] = [];
    let x = x0;
    let k = 0;
    while (x < x1) {
      const w = 230 + r() * 160;
      out.push({x, w, floors: 2 + Math.floor(r() * 2), wall: WALLS[Math.floor(r() * WALLS.length)], sign: r() > 0.4, tank: r() > 0.4, dish: r() > 0.55, balcony: r() > 0.4, ac: r() > 0.35, plant: r() > 0.5});
      x += w + 8;
      k++;
    }
    return out;
  }, [seed, x0, x1]);
  return (
    <g>
      {blds.map((b, i) => {
        const fh = 150;
        const top = base - b.floors * fh;
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.floors * fh + 10} fill={b.wall} stroke={C.ink} strokeWidth={5} />
            {/* sun-side shading + grime at the base */}
            <rect x={b.x + b.w * 0.82} y={top} width={b.w * 0.18} height={b.floors * fh} fill="#000" opacity={0.12} />
            <rect x={b.x} y={base - 40} width={b.w} height={40} fill="#5A3E2E" opacity={0.25} />
            <rect x={b.x - 6} y={top - 14} width={b.w + 12} height={16} fill="#E9E1D2" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: b.floors}, (_, f) =>
              Array.from({length: Math.max(1, Math.floor(b.w / 110))}, (_, wi) => {
                const wx = b.x + 30 + wi * 110;
                const wy = top + 30 + f * fh;
                const lit = night && (i + f + wi) % 3 !== 0;
                return (
                  <g key={`${f}-${wi}`}>
                    <rect x={wx} y={wy} width={62} height={72} fill={lit ? '#FFC873' : '#2E3F5E'} stroke={C.ink} strokeWidth={4} />
                    {lit && <rect x={wx - 20} y={wy - 20} width={102} height={112} fill="#FFC873" opacity={0.12} />}
                    {!night && <path d={`M${wx},${wy} l62,0 l0,24 Z`} fill="#FFFFFF" opacity={0.18} />}
                    <rect x={wx - 8} y={wy - 6} width={22} height={84} fill={b.wall} stroke={C.ink} strokeWidth={3} opacity={0.9} />
                    <rect x={wx + 48} y={wy - 6} width={22} height={84} fill={b.wall} stroke={C.ink} strokeWidth={3} opacity={0.9} />
                    {b.ac && wi === 0 && <rect x={wx + 66} y={wy + 44} width={36} height={26} fill="#E9E9EE" stroke={C.ink} strokeWidth={3} />}
                  </g>
                );
              }),
            )}
            {b.balcony && (
              <g>
                <rect x={b.x + 20} y={top + fh - 30} width={b.w - 40} height={10} fill="#C9C2B4" stroke={C.ink} strokeWidth={3} />
                {Array.from({length: Math.floor((b.w - 40) / 16)}, (_, k2) => (
                  <line key={k2} x1={b.x + 26 + k2 * 16} y1={top + fh - 30} x2={b.x + 26 + k2 * 16} y2={top + fh - 66} stroke={C.ink} strokeWidth={3} />
                ))}
                <line x1={b.x + 20} y1={top + fh - 68} x2={b.x + b.w - 20} y2={top + fh - 68} stroke={C.ink} strokeWidth={4} />
                {b.plant && <circle cx={b.x + 40} cy={top + fh - 80} r={20} fill="#3C8D6E" stroke={C.ink} strokeWidth={3} />}
              </g>
            )}
            {b.tank && (
              <g>
                <rect x={b.x + b.w - 90} y={top - 74} width={58} height={60} rx={10} fill="#1C1F2A" stroke={C.ink} strokeWidth={4} />
                <rect x={b.x + b.w - 92} y={top - 82} width={62} height={12} rx={4} fill="#2C303C" />
              </g>
            )}
            {b.dish && <path d={`M${b.x + 40},${top - 14} a30,20 -25 0,1 52,-38 z`} fill="#E9E9EE" stroke={C.ink} strokeWidth={3} />}
            {signs && b.sign && (
              <g>
                <rect x={b.x + 14} y={base - fh + 8} width={b.w - 28} height={42} rx={4} fill={night ? '#1E2448' : '#F6F1E6'} stroke={C.ink} strokeWidth={4} />
                {/* wordless signboard: a painted logo and a colour band read as "shop" without putting words in the frame */}
                <circle cx={b.x + 40} cy={base - fh + 29} r={13} fill={['#C2464F', '#2C4A7A', '#3C8D6E'][i % 3]} stroke={C.ink} strokeWidth={3} />
                <rect x={b.x + 64} y={base - fh + 22} width={b.w - 100} height={14} rx={7} fill={['#C2464F', '#2C4A7A', '#3C8D6E'][i % 3]} opacity={0.75} />
              </g>
            )}
            {/* ground-floor shop opening */}
            <rect x={b.x + 30} y={base - 110} width={b.w * 0.45} height={110} fill={night ? '#3B2A20' : '#3A2E2A'} stroke={C.ink} strokeWidth={4} />
            {night && <rect x={b.x + 30} y={base - 110} width={b.w * 0.45} height={110} fill="#FFC873" opacity={0.25} />}
          </g>
        );
      })}
      {time !== 'storm' && <rect x={-340} y={base - 600} width={2600} height={600} fill={L.haze} opacity={0.06} />}
    </g>
  );
};

/** Sagging wires between poles, birds that fidget. */
export const PowerLines: React.FC<{y: number; frame: number; x0?: number; x1?: number; birds?: boolean}> = ({y, frame, x0 = -300, x1 = 2500, birds = true}) => {
  const poles: number[] = [];
  for (let x = x0; x <= x1; x += 620) poles.push(x);
  return (
    <g>
      {poles.map((x) => (
        <g key={x}>
          <rect x={x - 10} y={y - 40} width={20} height={1200} fill="#4A3B33" stroke={C.ink} strokeWidth={4} />
          <rect x={x - 70} y={y - 34} width={140} height={14} fill="#4A3B33" stroke={C.ink} strokeWidth={4} />
        </g>
      ))}
      {[0, 1, 2].map((k) =>
        poles.slice(0, -1).map((x, i) => (
          <path key={`${k}-${i}`} d={`M${x - 60 + k * 60},${y - 26} Q${x + 310},${y + 60 + k * 10} ${x + 560 + k * 60},${y - 26}`} stroke="#1B1B22" strokeWidth={3} fill="none" />
        )),
      )}
      {birds &&
        [0.2, 0.26, 0.31, 0.62].map((t, i) => {
          const bx = x0 + 310 + t * 1200;
          const hop = Math.max(0, Math.sin(frame * 0.08 + i * 2)) > 0.97 ? -6 : 0;
          return (
            <g key={i} transform={`translate(${bx},${y + 26 + hop})`}>
              <ellipse cx={0} cy={0} rx={12} ry={8} fill="#2A2A30" />
              <circle cx={9} cy={-6} r={5} fill="#2A2A30" />
              <path d="M13,-6 l6,1 l-6,2 Z" fill="#E8A33D" />
            </g>
          );
        })}
    </g>
  );
};

/** Asphalt road with faded paint, potholes, gutter and puddles that mirror the sky. */
export const Road: React.FC<{time: TimeOfDay; y: number; potholes?: number[]; puddles?: number[]}> = ({time, y, potholes = [], puddles = []}) => {
  const L = LOOKS[time];
  const night = time === 'night' || time === 'storm';
  return (
    <g>
      <rect x={-340} y={y - 30} width={2600} height={36} fill="#9C8E7C" stroke={C.ink} strokeWidth={4} />
      <rect x={-340} y={y} width={2600} height={800} fill={night ? '#2A2A38' : '#5D5A60'} />
      <rect x={-340} y={y} width={2600} height={30} fill="#000" opacity={0.18} />
      {Array.from({length: 14}, (_, i) => (
        <rect key={i} x={-300 + i * 200} y={y + 150} width={110} height={10} fill="#E8E0C8" opacity={0.35} />
      ))}
      {potholes.map((x, i) => (
        <ellipse key={i} cx={x} cy={y + 110} rx={70} ry={16} fill="#2C2A30" stroke={C.ink} strokeWidth={3} />
      ))}
      {puddles.map((x, i) => (
        <ellipse key={i} cx={x} cy={y + 70} rx={110} ry={14} fill={L.skyMid} opacity={0.6} stroke={C.ink} strokeWidth={2} />
      ))}
    </g>
  );
};

/** Lagos danfo minibus. `tilt` rotates, `passengers` draws heads in windows. */
export const Danfo: React.FC<{x: number; y: number; s?: number; tilt?: number; frame: number; passengers?: boolean; scared?: boolean; doorOpen?: boolean; broken?: boolean; glow?: number}> = ({
  x,
  y,
  s = 1,
  tilt = 0,
  frame,
  passengers = true,
  scared = false,
  doorOpen = false,
  broken = false,
  glow = 0,
}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`}>
    {glow > 0 && <rect x={-330} y={-300} width={660} height={320} rx={60} fill="#FF9A3C" opacity={0.15 * glow} />}
    {/* roof rack + luggage */}
    <rect x={-200} y={-300} width={360} height={14} fill="#3B3B44" stroke={C.ink} strokeWidth={4} />
    <rect x={-170} y={-336} width={90} height={36} rx={6} fill="#C2464F" stroke={C.ink} strokeWidth={4} />
    <rect x={-60} y={-326} width={120} height={26} rx={6} fill="#3E7CB1" stroke={C.ink} strokeWidth={4} />
    {/* body */}
    <path d="M-300,-30 L-300,-250 Q-300,-286 -264,-286 L230,-286 Q280,-286 296,-230 L310,-120 L310,-30 Z" fill="#F7C82E" stroke={C.ink} strokeWidth={6} />
    <rect x={-300} y={-96} width={610} height={22} fill={C.ink} />
    <rect x={-300} y={-62} width={610} height={10} fill={C.ink} />
    {/* windows */}
    {[-270, -170, -70, 30, 130].map((wx, i) => (
      <g key={i}>
        <rect x={wx} y={-262} width={86} height={96} rx={8} fill="#9FD3F2" stroke={C.ink} strokeWidth={4} />
        {passengers && (
          <g transform={`translate(${wx + 43},${-176})`}>
            <Figure char={extra(200 + i)} x={0} y={0} scale={0.42} pose={scared ? 'handsOnHead' : 'stand'} expression={scared ? (i % 2 ? 'alarmed' : 'surprised') : 'neutral'} seed={i} rim={false} />
          </g>
        )}
        <path d={`M${wx + 6},${-256} l30,0 l-30,40 Z`} fill="#FFFFFF" opacity={0.4} />
      </g>
    ))}
    {/* windscreen */}
    <path d="M232,-270 L282,-226 L292,-150 L232,-150 Z" fill="#9FD3F2" stroke={C.ink} strokeWidth={4} />
    {/* door */}
    {doorOpen ? <rect x={238} y={-150} width={20} height={118} fill="#F7C82E" stroke={C.ink} strokeWidth={4} transform="rotate(-25,248,-150)" /> : <rect x={232} y={-150} width={70} height={118} fill="#F2BC1E" stroke={C.ink} strokeWidth={4} />}
    {/* livery stripe (no slogans: the world isn't a caption) */}
    <rect x={-290} y={-140} width={500} height={14} rx={4} fill="#2C8A57" stroke={C.ink} strokeWidth={3} />
    {/* wheels */}
    {[-200, 190].map((wx, i) => (
      <g key={i} transform={`translate(${wx},-20) rotate(${broken && i === 1 ? 0 : frame * 0})`}>
        <circle r={46} fill="#1C1C22" stroke={C.ink} strokeWidth={5} />
        <circle r={20} fill="#9A9AA6" />
      </g>
    ))}
    {broken && <path d="M150,-20 l80,40" stroke="#555" strokeWidth={8} />}
    <circle cx={300} cy={-60} r={12} fill="#FFF3C8" stroke={C.ink} strokeWidth={3} />
  </g>
);

/** Plain car (traffic). */
export const Car: React.FC<{x: number; y: number; s?: number; color: string; flip?: boolean; lights?: boolean}> = ({x, y, s = 1, color, flip, lights}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <path d="M-150,-20 L-150,-70 Q-140,-90 -110,-92 L-70,-140 L80,-140 L120,-92 Q150,-90 155,-70 L155,-20 Z" fill={color} stroke={C.ink} strokeWidth={5} />
    <path d="M-60,-132 L-20,-132 L-20,-94 L-96,-94 Z" fill="#9FD3F2" stroke={C.ink} strokeWidth={3} />
    <path d="M-8,-132 L72,-132 L104,-94 L-8,-94 Z" fill="#9FD3F2" stroke={C.ink} strokeWidth={3} />
    {[-90, 100].map((wx) => (
      <circle key={wx} cx={wx} cy={-18} r={30} fill="#1C1C22" stroke={C.ink} strokeWidth={4} />
    ))}
    {lights && <circle cx={150} cy={-60} r={40} fill="#FFF3C8" opacity={0.3} />}
  </g>
);

export const Ambulance: React.FC<{x: number; y: number; s?: number; frame: number}> = ({x, y, s = 1, frame}) => {
  const on = Math.floor(frame / 8) % 2 === 0;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-200} y={-250} width={400} height={230} rx={22} fill="#F4F4F4" stroke={C.ink} strokeWidth={6} />
      <rect x={-200} y={-120} width={400} height={26} fill={C.stamp} />
      <rect x={-30} y={-210} width={60} height={20} fill={C.stamp} />
      <rect x={-10} y={-230} width={20} height={60} fill={C.stamp} />
      <rect x={110} y={-230} width={70} height={80} rx={8} fill="#9FD3F2" stroke={C.ink} strokeWidth={4} />
      <rect x={-60} y={-282} width={40} height={30} rx={6} fill={on ? '#3E8CFF' : '#20305A'} stroke={C.ink} strokeWidth={3} />
      <rect x={20} y={-282} width={40} height={30} rx={6} fill={on ? '#20305A' : '#FF3B3B'} stroke={C.ink} strokeWidth={3} />
      <circle cx={on ? -40 : 40} cy={-268} r={90} fill={on ? '#3E8CFF' : '#FF3B3B'} opacity={0.18} />
      {[-120, 120].map((wx) => (
        <circle key={wx} cx={wx} cy={-20} r={38} fill="#1C1C22" stroke={C.ink} strokeWidth={4} />
      ))}
    </g>
  );
};

export const Okada: React.FC<{x: number; y: number; s?: number; frame: number; flip?: boolean; rider?: boolean}> = ({x, y, s = 1, frame, flip, rider = true}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    {[-70, 75].map((wx) => (
      <g key={wx} transform={`translate(${wx},-34) rotate(${frame * 12})`}>
        <circle r={34} fill="#1C1C22" stroke={C.ink} strokeWidth={4} />
        <line x1={-30} y1={0} x2={30} y2={0} stroke="#777" strokeWidth={3} />
      </g>
    ))}
    <path d="M-70,-34 L-20,-80 L50,-80 L75,-34" stroke="#C2464F" strokeWidth={14} fill="none" strokeLinejoin="round" />
    <rect x={-40} y={-98} width={80} height={20} rx={8} fill="#1C1C22" />
    <path d="M60,-80 L80,-120 L100,-120" stroke="#333" strokeWidth={6} fill="none" />
    {rider && <Figure char={extra(310, {topColor: '#2E7D6E', hair: 'cap'})} x={0} y={-30} scale={0.55} pose="pilot" expression="neutral" rim={false} />}
  </g>
);

export const Umbrella: React.FC<{x: number; y: number; color: string; s?: number}> = ({x, y, color, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <line x1={0} y1={0} x2={0} y2={260} stroke="#3B2A20" strokeWidth={8} />
    <path d="M-150,0 Q0,-110 150,0 Z" fill={color} stroke={C.ink} strokeWidth={5} />
    {[-100, -50, 0, 50, 100].map((k) => (
      <path key={k} d={`M${k},-${Math.sqrt(Math.max(0, 1 - (k / 150) ** 2)) * 60} L${k * 1.0},0`} stroke={C.ink} strokeWidth={2} opacity={0.4} />
    ))}
  </g>
);

/** Floating dust/motes in sunlight. */
export const Motes: React.FC<{frame: number; count?: number; color?: string}> = ({frame, count = 40, color = '#FFF4D6'}) => {
  const pts = useMemo(() => {
    const r = rand(12);
    return Array.from({length: count}, () => ({x: r() * 1920, y: r() * 1080, s: 1 + r() * 2.5, p: r() * 6}));
  }, [count]);
  return (
    <g opacity={0.5}>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x + Math.sin(frame * 0.02 + p.p) * 30} cy={p.y - ((frame * 0.3 * p.s) % 1080)} r={p.s} fill={color} />
      ))}
    </g>
  );
};

/** Diagonal sun shafts. */
export const SunShafts: React.FC<{x: number; y: number; color?: string; opacity?: number}> = ({x, y, color = '#FFE6B0', opacity = 0.18}) => (
  <g opacity={opacity}>
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M${x + i * 60},${y} L${x - 600 + i * 220},${y + 1400} L${x - 480 + i * 220},${y + 1400} Z`} fill={color} />
    ))}
  </g>
);

/** Colour grade over a whole set (characters included) so everything sits in the same light. */
export const Grade: React.FC<{time: TimeOfDay}> = ({time}) => {
  const L = LOOKS[time];
  return <rect x={-400} y={-400} width={2800} height={2000} fill={L.grade} opacity={L.gradeOpacity} style={{mixBlendMode: 'multiply'}} />;
};

/** Contact shadow under a character. */
export const Shadow: React.FC<{x: number; y: number; w?: number; opacity?: number}> = ({x, y, w = 70, opacity = 0.28}) => <ellipse cx={x} cy={y + 4} rx={w} ry={w * 0.18} fill="#000" opacity={opacity} />;

/** The Executor's hologram style: gold/pearl line art. */
export const HOLO = {line: '#F6D58C', soft: '#F6D58C55', fill: '#F6D58C22', text: "'IBM Plex Mono', monospace"};
