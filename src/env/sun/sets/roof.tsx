import React from 'react';
import {Aurora, Snow} from '../../../fx/cinema/atmos';
import {rand} from '../../../fx/sky';
import {CityBlocks} from '../../sun01/parts';
import {Glow, Grade, INK, registerSet, Vignette, type SetCtx} from '../stage';
import {Drifts, Sky} from './outdoor';

/**
 * roof   — the flat roof of your building: water tank, vents, aerials, Ito's brass telescope; the city below,
 *          a huge sky above (the subject of every roof shot). floor y = 900. v: night | cold | aurora
 * harbor — the old harbour on Day 5: boats locked in new ice, cranes, a dark lighthouse. floor y = 940.
 */
const Telescope: React.FC<{x: number; base: number; up?: number}> = ({x, base, up = 0}) => (
  <g transform={`translate(${x},${base})`}>
    {/* tripod */}
    <path d="M0,-150 L-70,0 M0,-150 L70,0 M0,-150 L0,0" stroke="#3A3442" strokeWidth={9} strokeLinecap="round" />
    <path d="M0,-150 L-70,0 M0,-150 L70,0 M0,-150 L0,0" stroke={INK} strokeWidth={3} opacity={0.5} />
    <circle cx={0} cy={-152} r={14} fill="#3A3442" stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${-38 - up * 20},0,-152)`}>
      <rect x={-120} y={-178} width={250} height={52} rx={10} fill="#C9963A" stroke={INK} strokeWidth={5} />
      <rect x={120} y={-188} width={44} height={72} rx={8} fill="#A8782A" stroke={INK} strokeWidth={5} />
      <rect x={-150} y={-168} width={34} height={32} rx={6} fill="#3A3442" stroke={INK} strokeWidth={4} />
      <path d="M-60,-178 L-60,-126 M40,-178 L40,-126" stroke="#8A6420" strokeWidth={6} />
      <ellipse cx={164} cy={-152} rx={8} ry={34} fill="#9FD8FF" opacity={0.6} />
    </g>
  </g>
);

const RoofDeck: React.FC<{c: SetCtx; snow: number}> = ({c, snow}) => (
  <g>
    {/* water tank on legs */}
    <g transform="translate(250,900)">
      <path d="M-90,0 L-70,-160 M90,0 L70,-160 M-80,-80 L80,-80" stroke="#3A3442" strokeWidth={12} />
      <path d="M-120,-160 L-120,-400 Q0,-440 120,-400 L120,-160 Q0,-130 -120,-160 Z" fill="#7A5A44" stroke={INK} strokeWidth={5} />
      {[-300, -240, -190].map((y) => (
        <path key={y} d={`M-120,${y} Q0,${y + 30} 120,${y}`} stroke="#2A2230" strokeWidth={6} fill="none" />
      ))}
      <path d="M-130,-400 L0,-470 L130,-400 Z" fill="#5A4034" stroke={INK} strokeWidth={5} />
      {snow > 0 && <path d="M-130,-400 L0,-470 L130,-400 Q0,-440 -130,-400 Z" fill="#EEF4FB" />}
    </g>
    {/* vents + aerial */}
    <g transform="translate(1560,900)">
      <rect x={-50} y={-120} width={100} height={120} fill="#8A8F9C" stroke={INK} strokeWidth={5} />
      <path d="M-70,-120 L70,-120 L50,-150 L-50,-150 Z" fill="#6E7380" stroke={INK} strokeWidth={5} />
      {[-90, -60, -30].map((y) => (
        <path key={y} d={`M-40,${y} L40,${y}`} stroke={INK} strokeWidth={4} />
      ))}
      <path d="M140,0 L140,-420 M100,-360 L180,-360 M110,-320 L170,-320 M120,-280 L160,-280" stroke="#2A3142" strokeWidth={6} />
      {snow > 0 && <ellipse cx={0} cy={-152} rx={66} ry={12} fill="#EEF4FB" />}
    </g>
    <g transform="translate(1800,900)">
      <path d="M-40,0 L-40,-80 Q0,-120 40,-80 L40,0 Z" fill="#6E7380" stroke={INK} strokeWidth={5} />
      <rect x={-50} y={-90} width={100} height={14} rx={6} fill="#3A3442" />
    </g>
    {/* roof floor + parapet */}
    <rect x={-800} y={900} width={3600} height={600} fill={snow ? '#C9D6E8' : '#4A4552'} />
    {snow > 0 && <Drifts base={930} seed={4} />}
    {!snow &&
      Array.from({length: 30}, (_, i) => (
        <path key={i} d={`M${-800 + i * 130},900 L${-1000 + i * 160},1500`} stroke="#3A3442" strokeWidth={3} />
      ))}
    {/* string of lights Ito put up years ago, and a deckchair */}
    <g transform="translate(560,900)">
      <path d="M-50,0 L-20,-70 L50,-70 M-40,-40 L40,-40 L60,0" stroke="#C2464F" strokeWidth={8} fill="none" />
      <path d="M-20,-70 L-40,-150" stroke="#C2464F" strokeWidth={8} />
      <path d="M-24,-70 L-44,-148 L20,-140 L40,-66 Z" fill="#F2C94C" opacity={0.85} />
    </g>
  </g>
);

const Parapet: React.FC<{snow: number}> = ({snow}) => (
  <g>
    <rect x={-800} y={980} width={3600} height={140} fill="#5E5A6E" stroke={INK} strokeWidth={5} />
    {Array.from({length: 46}, (_, i) => (
      <path key={i} d={`M${-800 + i * 80},980 L${-800 + i * 80},1120`} stroke="#4A4656" strokeWidth={3} />
    ))}
    <rect x={-800} y={970} width={3600} height={18} fill="#8A8F9C" stroke={INK} strokeWidth={4} />
    {snow > 0 && <rect x={-800} y={958} width={3600} height={18} rx={9} fill="#EEF4FB" />}
  </g>
);

registerSet('roof', {
  layers: (c) => {
    const snow = c.v === 'night' ? 0 : 1;
    const aur = c.v === 'aurora' ? 1 : 0;
    const timelapse = c.p.timelapse ? c.t * 0.05 : 0;
    return [
      {
        depth: 0.06,
        node: (
          <g transform={`rotate(${timelapse * 40},960,1600)`}>
            <Sky frame={c.frame} top="#01020A" mid="#081032" bottom="#1E2A58" stars={1.8} seed={33} />
          </g>
        ),
      },
      ...(aur ? [{depth: 0.12, node: <Aurora frame={c.frame} y={520} intensity={1.15} seed={4} />}] : []),
      {
        depth: 0.3,
        node: (
          <g>
            <CityBlocks seed={52} base={980} color={snow ? '#1B2240' : '#141A33'} frame={c.frame} lights={c.v === 'night' ? 0.7 : 0.25} minH={140} maxH={420} snow={snow} />
          </g>
        ),
      },
      {depth: 0.55, node: <CityBlocks seed={61} base={1020} color={snow ? '#232B4C' : '#1C2240'} frame={c.frame} lights={c.v === 'night' ? 0.6 : 0.2} minH={80} maxH={260} snow={snow} />},
      {
        depth: 1,
        node: (
          <g>
            <RoofDeck c={c} snow={snow} />
            <Telescope x={1310} base={900} up={c.p.telescope === 'setup' ? Math.min(1, c.t / 2) : 0.6} />
          </g>
        ),
      },
      {depth: 1.25, front: true, node: <Parapet snow={snow} />},
      ...(snow ? [{depth: 1.1, front: true, node: <Snow frame={c.frame} density={0.35} wind={0.6} seed={6} opacity={0.6} />}] : []),
    ];
  },
  light: (c) => (
    <g>
      {c.v === 'aurora' && <rect x={-400} y={-400} width={2800} height={1900} fill="#47F0A6" opacity={0.12 + 0.04 * Math.sin(c.frame * 0.05)} style={{mixBlendMode: 'screen'}} />}
      <Glow x={1150} y={700} r={260} color="#FFE3A6" opacity={c.v === 'night' ? 0.18 : 0.1} />
    </g>
  ),
  grade: (c) => (
    <g>
      <Grade color={c.v === 'aurora' ? '#1E5A5A' : '#2A3A8A'} amount={0.3} />
      <Vignette amount={0.55} />
    </g>
  ),
});

// ── HARBOUR ─────────────────────────────────────────────────────────────────────────────────────
const Boat: React.FC<{x: number; y: number; col: string; s?: number; tilt?: number}> = ({x, y, col, s = 1, tilt = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${tilt})`}>
    <path d="M-160,-40 L160,-40 L120,30 L-130,30 Z" fill={col} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-60} y={-110} width={110} height={70} fill="#F4EFE6" stroke={INK} strokeWidth={5} />
    <rect x={-46} y={-96} width={30} height={26} fill="#1C2238" />
    <rect x={4} y={-96} width={30} height={26} fill="#1C2238" />
    <path d="M70,-40 L70,-220 M70,-200 L160,-60" stroke="#2A3142" strokeWidth={6} />
    <path d="M-160,-40 L160,-40" stroke="#F4EFE6" strokeWidth={6} />
    <path d="M-180,-44 Q0,-70 180,-44 L180,-36 L-180,-36 Z" fill="#EEF4FB" opacity={0.9} />
  </g>
);

registerSet('harbor', {
  layers: (c) => {
    const rr = rand(8);
    return [
      {depth: 0.06, node: <Sky frame={c.frame} top="#01020A" mid="#081032" bottom="#1E2A58" stars={1.6} seed={44} />},
      {
        depth: 0.3,
        node: (
          <g>
            {/* far shore: cranes and a dark lighthouse */}
            <rect x={-900} y={700} width={3800} height={200} fill="#151B33" />
            {[200, 520, 1500].map((x) => (
              <g key={x} transform={`translate(${x},700)`}>
                <path d="M0,0 L0,-300 L240,-300 M0,-260 L200,-300 M40,-300 L40,-340" stroke="#232B4C" strokeWidth={14} fill="none" />
                <path d="M120,-300 L120,-200" stroke="#232B4C" strokeWidth={4} />
              </g>
            ))}
            <g transform="translate(1900,700)">
              <path d="M-40,0 L-26,-260 L26,-260 L40,0 Z" fill="#2A3352" stroke={INK} strokeWidth={4} />
              <rect x={-34} y={-300} width={68} height={40} fill="#1A2040" stroke={INK} strokeWidth={4} />
              <path d="M-44,-300 L0,-340 L44,-300 Z" fill="#2A3352" />
            </g>
          </g>
        ),
      },
      {
        depth: 0.6,
        node: (
          <g>
            {/* the frozen harbour surface */}
            <rect x={-900} y={760} width={3800} height={400} fill="#9FB4D2" />
            {Array.from({length: 40}, (_, i) => (
              <path key={i} d={`M${-900 + rr() * 3800},${770 + rr() * 300} l${80 + rr() * 200},${(rr() - 0.5) * 40}`} stroke="#C9D8EC" strokeWidth={3} opacity={0.8} />
            ))}
            <Boat x={-100} y={800} col="#C2464F" s={0.8} tilt={-3} />
            <Boat x={1250} y={790} col="#3E7CB1" s={0.7} tilt={4} />
            <Boat x={2050} y={810} col="#E9C46A" s={0.8} tilt={-2} />
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {/* new ice right in front of the quay — thin, dark, cracked, with the fish under it */}
            <rect x={-900} y={900} width={3800} height={600} fill="#6F8CB4" />
            <rect x={-900} y={900} width={3800} height={600} fill="#1D2E52" opacity={0.35} />
            {Array.from({length: 14}, (_, i) => (
              <path key={i} d={`M${-600 + i * 230},${920 + (i % 3) * 40} l${60},${50} l${80},${-20} l${50},${70}`} stroke="#DCE8F6" strokeWidth={3} fill="none" opacity={0.7} />
            ))}
            {c.p.fish && (
              <g transform={`translate(${700 + ((c.frame * 3) % 600)},1030)`} opacity={0.55}>
                <path d="M0,0 Q40,-26 80,0 Q40,26 0,0 Z M80,0 L110,-18 L104,0 L110,18 Z" fill="#2B4A6F" />
                <circle cx={18} cy={-4} r={4} fill="#9FD8FF" />
              </g>
            )}
            {/* bollards + mooring rope on the quay edge */}
            {[320, 1500].map((x) => (
              <g key={x} transform={`translate(${x},940)`}>
                <path d="M-26,0 L-26,-60 Q0,-76 26,-60 L26,0 Z" fill="#2A3142" stroke={INK} strokeWidth={4} />
                <ellipse cx={0} cy={-62} rx={30} ry={10} fill="#EEF4FB" />
                <path d="M26,-30 Q200,40 400,10" stroke="#C9963A" strokeWidth={8} fill="none" />
              </g>
            ))}
          </g>
        ),
      },
      {depth: 1.1, front: true, node: <Snow frame={c.frame} density={0.3} wind={0.8} seed={9} opacity={0.6} />},
    ];
  },
  grade: () => (
    <g>
      <Grade color="#2A3A8A" amount={0.3} />
      <Vignette amount={0.6} />
    </g>
  ),
});
