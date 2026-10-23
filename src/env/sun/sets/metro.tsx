import React from 'react';
import {Carriage, Flame, StringLights, Tent} from '../../sun01/parts';
import {Glow, Grade, INK, registerSet, Vignette, type SetCtx} from '../stage';

/**
 * The metro station that becomes a town (Day 8 → 365). A vaulted tiled hall, platform at floor y = 900,
 * tracks below the platform edge in front.
 *  v: stairs · city · farm · sunrise · school · tent · workshop · dark · radios
 * Lamp state: `sunrise` (time the big lamps warm up), `flicker` (time the power dies), `dark`.
 */
const TILE = '#D8CFC0';
const TILE_SH = '#BDB3A2';

const Vault: React.FC<{c: SetCtx; lamps: number; warm: number}> = ({c, lamps, warm}) => (
  <g>
    <rect x={-900} y={-400} width={3800} height={1400} fill="#2A2630" />
    {/* the vault */}
    <path d="M-900,700 L-900,200 Q960,-520 2820,200 L2820,700 Z" fill={TILE} stroke={INK} strokeWidth={6} />
    {Array.from({length: 18}, (_, i) => (
      <path key={i} d={`M${-900 + i * 220},700 Q${-900 + i * 220 + 40},${-120 + Math.abs(i - 8.5) * 40} ${-900 + i * 220 + 60},${-200 + Math.abs(i - 8.5) * 45}`} stroke={TILE_SH} strokeWidth={4} fill="none" />
    ))}
    {Array.from({length: 12}, (_, i) => (
      <path key={i} d={`M-900,${640 - i * 50} Q960,${-60 - i * 40} 2820,${640 - i * 50}`} stroke={TILE_SH} strokeWidth={3} fill="none" opacity={0.7} />
    ))}
    {/* the station name band */}
    <rect x={-200} y={420} width={2320} height={70} fill="#C2464F" stroke={INK} strokeWidth={5} />
    {[150, 1100].map((x) => (
      <g key={x}>
        <rect x={x} y={400} width={520} height={110} rx={55} fill="#F4EFE6" stroke={INK} strokeWidth={5} />
        <text x={x + 260} y={474} textAnchor="middle" fontFamily="'Unbounded', sans-serif" fontWeight={800} fontSize={46} fill="#2E3A5C" letterSpacing={4}>
          HARBOUR ST
        </text>
      </g>
    ))}
    {/* the big lamps in the roof: grey → orange → gold */}
    {[300, 960, 1620].map((x, i) => (
      <g key={x}>
        <path d={`M${x},-300 L${x},40`} stroke={INK} strokeWidth={4} />
        <path d={`M${x - 90},90 Q${x},10 ${x + 90},90 Z`} fill="#3A3442" stroke={INK} strokeWidth={4} />
        <ellipse cx={x} cy={92} rx={70} ry={16} fill={lamps > 0 ? (warm > 0.5 ? '#FFE9A8' : '#FFB25A') : '#4A4552'} opacity={0.4 + lamps * 0.6} />
      </g>
    ))}
    {/* platform back wall: posters, a clock stuck at 6:52 */}
    {[60, 1580].map((x, i) => (
      <g key={x}>
        <rect x={x} y={560} width={220} height={150} fill={i ? '#3E7CB1' : '#E9C46A'} stroke={INK} strokeWidth={4} />
        <circle cx={x + 110} cy={630} r={40} fill={i ? '#F4EFE6' : '#F2994A'} opacity={0.8} />
      </g>
    ))}
    <g transform="translate(960,600)">
      <circle r={50} fill="#F4EFE6" stroke={INK} strokeWidth={5} />
      <path d="M0,0 L0,-36" stroke={INK} strokeWidth={4} transform="rotate(312)" />
      <path d="M0,0 L0,-24" stroke={INK} strokeWidth={6} transform="rotate(206)" />
    </g>
  </g>
);

const Platform: React.FC = () => (
  <g>
    <rect x={-900} y={700} width={3800} height={200} fill="#4A4552" />
    <rect x={-900} y={900} width={3800} height={600} fill="#8A8278" />
    {Array.from({length: 40}, (_, i) => (
      <path key={i} d={`M${-900 + i * 100},900 L${-1100 + i * 130},1500`} stroke="#77706A" strokeWidth={3} />
    ))}
    {/* yellow safety line at the platform edge */}
    <rect x={-900} y={1040} width={3800} height={14} fill="#F2C94C" />
  </g>
);

const Town: React.FC<{c: SetCtx; lit: number}> = ({c, lit}) => (
  <g>
    <Carriage x={-500} y={890} w={900} lit={lit} color="#8C9AAE" />
    <Carriage x={1500} y={890} w={900} lit={lit} color="#9A8A7A" />
    <Tent x={520} y={900} s={1.2} color="#C2464F" lit={lit} />
    <Tent x={1280} y={900} s={1.1} color="#3C8D6E" lit={lit} />
    <Tent x={1880} y={900} s={0.9} color="#E9C46A" lit={lit} />
    {/* laundry line */}
    <path d="M400,560 Q760,640 1100,560" stroke="#2A2230" strokeWidth={3} fill="none" />
    {['#F4EFE6', '#3E7CB1', '#E07A5F', '#F2C94C'].map((col, k) => (
      <rect key={k} x={480 + k * 150} y={580 + Math.sin(k) * 10} width={60} height={80 + (k % 2) * 30} fill={col} stroke={INK} strokeWidth={3} transform={`rotate(${Math.sin(c.frame * 0.03 + k) * 3},${510 + k * 150},590)`} />
    ))}
    <StringLights x1={-200} y1={300} x2={900} y2={330} sag={50} on={lit} frame={c.frame} n={16} />
    <StringLights x1={1000} y1={330} x2={2100} y2={300} sag={50} on={lit} frame={c.frame} n={16} />
    {/* a stove with a chimney pipe, a bucket, crates */}
    <g transform="translate(1100,900)">
      <rect x={-50} y={-90} width={100} height={90} rx={8} fill="#3A3442" stroke={INK} strokeWidth={4} />
      <path d="M20,-90 L20,-360" stroke="#5A5E6A" strokeWidth={18} />
      <rect x={-30} y={-60} width={60} height={34} rx={4} fill="#FF8A3A" opacity={0.5 + 0.3 * lit} />
    </g>
    {[200, 1700].map((x) => (
      <g key={x}>
        <rect x={x} y={830} width={90} height={70} fill="#A86E42" stroke={INK} strokeWidth={4} />
        <path d={`M${x},865 L${x + 90},865`} stroke="#7A4E30" strokeWidth={4} />
      </g>
    ))}
  </g>
);

const Farm: React.FC<{c: SetCtx}> = ({c}) => (
  <g>
    {/* a disused tunnel mouth full of racks under pink grow lights */}
    <path d="M-200,900 L-200,350 Q960,-80 2120,350 L2120,900 Z" fill="#1E1A28" stroke={INK} strokeWidth={6} />
    {Array.from({length: 3}, (_, row) => (
      <g key={row}>
        <rect x={-100} y={520 + row * 130} width={2120} height={14} fill="#5A5E6A" stroke={INK} strokeWidth={3} />
        <rect x={-100} y={410 + row * 130} width={2120} height={10} fill="#FF5FD2" opacity={0.9} />
        {Array.from({length: 26}, (_, k) => (
          <g key={k} transform={`translate(${-60 + k * 80},${520 + row * 130})`}>
            <path d="M0,0 Q-22,-26 -6,-46 Q0,-20 0,0 Q4,-30 18,-44 Q22,-16 0,0" fill={['#5BBF6A', '#7FD27A', '#4EA85C'][(k + row) % 3]} stroke={INK} strokeWidth={2} />
          </g>
        ))}
      </g>
    ))}
  </g>
);

const School: React.FC<{c: SetCtx}> = ({c}) => (
  <g>
    {/* inside a parked carriage: windows, grab poles, a chalkboard full of suns */}
    <rect x={-900} y={-300} width={3800} height={1300} fill="#C8CEC4" />
    {Array.from({length: 6}, (_, i) => (
      <g key={i}>
        <rect x={-700 + i * 520} y={120} width={360} height={260} rx={30} fill="#141A30" stroke={INK} strokeWidth={5} />
        <path d={`M${-700 + i * 520 + 20},140 L${-700 + i * 520 + 340},360`} stroke="#2A3352" strokeWidth={30} opacity={0.6} />
      </g>
    ))}
    <rect x={200} y={180} width={760} height={460} rx={10} fill="#2F4A3A" stroke="#7A4E30" strokeWidth={18} />
    {[
      [330, 300, 50],
      [520, 260, 34],
      [700, 330, 44],
      [460, 460, 40],
      [820, 500, 30],
    ].map(([x, y, r], i) => (
      <g key={i} stroke="#FFE7A6" strokeWidth={5} fill="none" strokeLinecap="round">
        <circle cx={x} cy={y} r={r} />
        {Array.from({length: 8}, (_, k) => (
          <path key={k} d={`M${x + Math.cos((k / 8) * 6.28) * r * 1.3},${y + Math.sin((k / 8) * 6.28) * r * 1.3} L${x + Math.cos((k / 8) * 6.28) * r * 1.7},${y + Math.sin((k / 8) * 6.28) * r * 1.7}`} />
        ))}
      </g>
    ))}
    {[1100, 1500].map((x) => (
      <path key={x} d={`M${x},-300 L${x},900`} stroke="#B8BEC6" strokeWidth={14} />
    ))}
    <rect x={-900} y={900} width={3800} height={600} fill="#6E6A66" />
    {[1220, 1390, 1560].map((x) => (
      <rect key={x} x={x - 50} y={840} width={100} height={60} rx={8} fill="#C2464F" stroke={INK} strokeWidth={4} />
    ))}
  </g>
);

const Workshop: React.FC<{c: SetCtx}> = ({c}) => (
  <g>
    <rect x={-900} y={-300} width={3800} height={1300} fill="#3A3442" />
    {/* pegboard with tools, a bench, magnifier lamp, parts */}
    <rect x={500} y={240} width={940} height={420} fill="#A8865E" stroke={INK} strokeWidth={5} />
    {Array.from({length: 60}, (_, i) => (
      <circle key={i} cx={530 + (i % 15) * 60} cy={270 + Math.floor(i / 15) * 100} r={5} fill="#7A5E3E" />
    ))}
    {[580, 700, 840, 1000, 1180, 1320].map((x, i) => (
      <g key={x}>
        {i % 3 === 0 && <path d={`M${x},300 L${x},420 M${x - 20},300 L${x + 20},300`} stroke="#C9CED6" strokeWidth={10} />}
        {i % 3 === 1 && <circle cx={x} cy={360} r={40} fill="none" stroke="#C2464F" strokeWidth={10} />}
        {i % 3 === 2 && <path d={`M${x},300 L${x},460`} stroke="#E9C46A" strokeWidth={14} />}
      </g>
    ))}
    <rect x={420} y={760} width={1100} height={40} fill="#7A4E30" stroke={INK} strokeWidth={5} />
    <path d="M460,800 L460,900 M1480,800 L1480,900" stroke={INK} strokeWidth={14} />
    {/* parts on the bench */}
    <rect x={560} y={730} width={90} height={30} rx={4} fill="#3E7CB1" stroke={INK} strokeWidth={3} />
    <circle cx={1300} cy={740} r={20} fill="#C9CED6" stroke={INK} strokeWidth={3} />
    <path d="M1360,760 l40,-20 l30,10" stroke="#C2464F" strokeWidth={4} fill="none" />
    <path d="M1460,760 L1400,520 L1260,540" stroke="#5A5E6A" strokeWidth={10} fill="none" />
    <ellipse cx={1240} cy={560} rx={70} ry={22} fill="#5A5E6A" stroke={INK} strokeWidth={4} />
    <rect x={-900} y={900} width={3800} height={600} fill="#4A4552" />
  </g>
);

registerSet('metro', {
  layers: (c) => {
    const v = c.v;
    const sunriseAt = c.p.sunrise !== undefined ? c.at(c.p.sunrise, 0) : -1;
    const flickerAt = c.p.flicker !== undefined ? c.at(c.p.flicker, 0) : -1;
    let lamps = v === 'dark' ? 0 : 0.7;
    let warm = 0;
    if (sunriseAt >= 0) {
      lamps = Math.min(1, Math.max(0.05, (c.t - sunriseAt) / 1.2));
      warm = Math.min(1, Math.max(0, (c.t - sunriseAt - 0.6) / 1.4));
    }
    if (flickerAt >= 0 && c.t > flickerAt) lamps = c.t - flickerAt < 0.9 ? (Math.sin(c.frame * 2.1) > 0 ? 0.7 : 0.1) : 0;
    const lit = v === 'dark' || (flickerAt >= 0 && c.t > flickerAt + 0.9) ? 0 : 1;
    const inside = v === 'school' || v === 'workshop';
    return [
      ...(inside
        ? [{depth: 1, node: v === 'school' ? <School c={c} /> : <Workshop c={c} />}]
        : [
            {depth: 0.55, node: <Vault c={c} lamps={lamps} warm={warm} />},
            {
              depth: 1,
              node: (
                <g>
                  <Platform />
                  {v === 'farm' ? <Farm c={c} /> : v === 'stairs' ? <Stairs /> : <Town c={c} lit={lit} />}
                </g>
              ),
            },
          ]),
    ];
  },
  light: (c) => {
    const v = c.v;
    const sunriseAt = c.p.sunrise !== undefined ? c.at(c.p.sunrise, 0) : -1;
    const flickerAt = c.p.flicker !== undefined ? c.at(c.p.flicker, 0) : -1;
    if (v === 'farm') return <Glow x={960} y={500} r={1000} color="#FF5FD2" opacity={0.3} />;
    if (v === 'workshop') return <Glow x={1240} y={640} r={420} color="#FFF1C8" opacity={0.45} />;
    if (v === 'school') return <Glow x={600} y={300} r={800} color="#FFE9C0" opacity={0.3} />;
    if (v === 'dark' || (flickerAt >= 0 && c.t > flickerAt + 0.9))
      return (
        <g>
          <Flame x={1100} y={890} s={0.8} frame={c.frame} glow={1.2} />
        </g>
      );
    const k = sunriseAt >= 0 ? Math.min(1, Math.max(0, (c.t - sunriseAt) / 1.6)) : 0.6;
    return (
      <g>
        <Glow x={960} y={100} r={1100} color={k > 0.8 ? '#FFE9A8' : '#FFB25A'} opacity={0.15 + 0.35 * k} />
        <Glow x={520} y={860} r={200} color="#FFD08A" opacity={0.25} />
        <Glow x={1280} y={860} r={200} color="#FFD08A" opacity={0.25} />
      </g>
    );
  },
  grade: (c) => {
    const v = c.v;
    const flickerAt = c.p.flicker !== undefined ? c.at(c.p.flicker, 0) : -1;
    const sunriseAt = c.p.sunrise !== undefined ? c.at(c.p.sunrise, 0) : -1;
    const dead = v === 'dark' || (flickerAt >= 0 && c.t > flickerAt + 0.9);
    const pre = sunriseAt >= 0 ? 0.55 * (1 - Math.min(1, Math.max(0, (c.t - sunriseAt) / 1.4))) : 0;
    return (
      <g>
        <Grade color={dead ? '#121A50' : '#4A3A6E'} amount={dead ? 0.78 : 0.2 + pre} />
        <Vignette amount={dead ? 0.8 : 0.5} />
      </g>
    );
  },
});

const Stairs: React.FC = () => (
  <g>
    {/* the stairs down from the street, a line of torches behind */}
    <path d="M-900,900 L-900,300 L2900,900 Z" fill="#3A3442" opacity={0.6} />
    {Array.from({length: 16}, (_, k) => (
      <rect key={k} x={-900 + k * 160} y={300 + k * 38} width={170} height={20} fill="#5E5A6E" stroke={INK} strokeWidth={3} />
    ))}
  </g>
);
