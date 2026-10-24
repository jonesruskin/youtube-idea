import React from 'react';
import {Flame, StringLights, Tent} from '../../sun01/parts';
import {Glow, Grade, INK, M, registerSet, Vignette, type SetCtx} from '../stage';

/**
 * The metro station that becomes a town (Day 8 → 365). A vaulted tiled hall, platform at floor y = 900,
 * tracks below the platform edge in front.
 *  v: stairs · city · farm · sunrise · school · tent · workshop · dark · radios
 * Lamp state: `sunrise` (time the big lamps warm up), `flicker` (time the power dies), `dark`.
 * Real sizes (1 m = M(1) on the cast's plane): carriages stand 3 m above the platform on the far track, tents
 * 1.3 m, crates 0.6 m, the stove 0.6 m with a 3 m flue, workbench 0.9 m, carriage windows 0.9–2.0 m.
 */

/** A metro carriage turned into a home, to real size (metres × sc): 3 m tall above the platform, 1 × 0.85 m
 * windows with curtains, double doors, a chimney pipe through the roof. Runs `len` metres from x. */
export const TrainCar: React.FC<{x: number; base: number; sc: number; len: number; lit: number; color: string; pipe?: number}> = ({x, base, sc, len, lit, color, pipe}) => {
  const lw = Math.max(1.5, sc * 0.022) / sc;
  const bays = Math.floor(len / 2.2);
  return (
    <g transform={`translate(${x},${base}) scale(${sc})`}>
      <rect x={0} y={-0.12} width={len} height={0.12} fill="#14121A" />
      <rect x={0} y={-3.0} width={len} height={2.88} rx={0.25} fill={color} stroke={INK} strokeWidth={lw} />
      <rect x={0} y={-3.0} width={len} height={0.28} rx={0.14} fill="#00000022" />
      <rect x={0} y={-0.7} width={len} height={0.1} fill="#C8742E" opacity={0.85} />
      {Array.from({length: bays}, (_, i) => {
        const bx = 0.4 + i * 2.2;
        const door = i % 3 === 1;
        return door ? (
          <g key={i}>
            <rect x={bx} y={-2.05} width={1.3} height={1.93} fill="#6E7A8E" stroke={INK} strokeWidth={lw * 0.8} />
            <path d={`M${bx + 0.65},-2.05 L${bx + 0.65},-0.12`} stroke={INK} strokeWidth={lw * 0.8} />
            <rect x={bx + 0.12} y={-1.85} width={0.4} height={0.75} rx={0.05} fill={lit > 0 ? '#FFD08A' : '#2A2433'} opacity={lit > 0 ? 0.5 + lit * 0.4 : 1} />
            <rect x={bx + 0.78} y={-1.85} width={0.4} height={0.75} rx={0.05} fill={lit > 0 ? '#FFD08A' : '#2A2433'} opacity={lit > 0 ? 0.5 + lit * 0.4 : 1} />
          </g>
        ) : (
          <g key={i}>
            <rect x={bx} y={-2.0} width={1.6} height={0.85} rx={0.12} fill={lit > 0 ? '#FFD08A' : '#2A2433'} opacity={lit > 0 ? 0.5 + lit * 0.5 : 1} stroke={INK} strokeWidth={lw * 0.8} />
            <path d={`M${bx + 0.06},-1.96 q0.3,0.38 0,0.78`} stroke={['#C2464F', '#3C8D6E', '#D9A441', '#5E8FC9'][i % 4]} strokeWidth={0.14} fill="none" opacity={0.85} />
            <path d={`M${bx + 1.54},-1.96 q-0.3,0.38 0,0.78`} stroke={['#C2464F', '#3C8D6E', '#D9A441', '#5E8FC9'][(i + 1) % 4]} strokeWidth={0.14} fill="none" opacity={0.85} />
          </g>
        );
      })}
      {pipe !== undefined && <path d={`M${pipe},-3.0 L${pipe},-3.7 L${pipe + 0.3},-3.7`} stroke="#5A5E6A" strokeWidth={0.14} fill="none" />}
    </g>
  );
};
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
    {/* carriages parked on the far track, a few metres behind the cast (k = 0.8) */}
    <TrainCar x={-2600} base={860} sc={M(0.8)} len={18} lit={lit} color="#8C9AAE" pipe={16.4} />
    <TrainCar x={1560} base={860} sc={M(0.8)} len={18} lit={lit} color="#9A8A7A" pipe={1.2} />
    {/* tents: 1.3 m tall, 2.1 m wide */}
    <Tent x={520} y={898} s={2.0} color="#C2464F" lit={lit} />
    <Tent x={1280} y={898} s={1.9} color="#3C8D6E" lit={lit} />
    <Tent x={1880} y={898} s={1.8} color="#E9C46A" lit={lit} />
    {/* laundry line */}
    <path d="M400,560 Q760,640 1100,560" stroke="#2A2230" strokeWidth={3} fill="none" />
    {['#F4EFE6', '#3E7CB1', '#E07A5F', '#F2C94C'].map((col, k) => (
      <rect key={k} x={470 + k * 150} y={580 + Math.sin(k) * 10} width={80} height={100 + (k % 2) * 40} fill={col} stroke={INK} strokeWidth={3} transform={`rotate(${Math.sin(c.frame * 0.03 + k) * 3},${510 + k * 150},590)`} />
    ))}
    <StringLights x1={-200} y1={300} x2={900} y2={330} sag={50} on={lit} frame={c.frame} n={16} />
    <StringLights x1={1000} y1={330} x2={2100} y2={300} sag={50} on={lit} frame={c.frame} n={16} />
    {/* a stove with a chimney pipe, a bucket, crates */}
    <g transform="translate(1100,900)">
      <rect x={-M(0.3)} y={-M(0.6)} width={M(0.6)} height={M(0.6)} rx={8} fill="#3A3442" stroke={INK} strokeWidth={4} />
      <path d={`M${M(0.1)},${-M(0.6)} L${M(0.1)},${-M(3.0)}`} stroke="#5A5E6A" strokeWidth={22} />
      <rect x={-M(0.2)} y={-M(0.42)} width={M(0.4)} height={M(0.2)} rx={4} fill="#FF8A3A" opacity={0.5 + 0.3 * lit} />
    </g>
    {[180, 1690].map((x) => (
      <g key={x}>
        <rect x={x} y={900 - M(0.42)} width={M(0.6)} height={M(0.42)} fill="#A86E42" stroke={INK} strokeWidth={4} />
        <path d={`M${x},${900 - M(0.21)} L${x + M(0.6)},${900 - M(0.21)}`} stroke="#7A4E30" strokeWidth={4} />
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
    {/* the carriage ceiling (2.2 m) with its strip light */}
    <path d={`M-900,-300 L2900,-300 L2900,${900 - M(2.2)} Q960,${900 - M(2.45)} -900,${900 - M(2.2)} Z`} fill="#AEB6AA" />
    <rect x={-900} y={900 - M(2.2) - 14} width={3800} height={12} fill="#FFF6DA" opacity={0.9} />
    {[-560, -40, 900, 1420, 1940].map((x) => (
      <g key={x}>
        <rect x={x} y={900 - M(1.95)} width={360} height={M(1.05)} rx={26} fill="#141A30" stroke={INK} strokeWidth={5} />
        <path d={`M${x + 20},${900 - M(1.85)} L${x + 340},${900 - M(1.0)}`} stroke="#2A3352" strokeWidth={30} opacity={0.6} />
      </g>
    ))}
    <g transform="translate(580,725) scale(0.66) translate(-580,-640)">
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
    </g>
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
    {/* Ito's framed print of the 1919 eclipse: the Moon, the corona, and three faint lines far too straight */}
    <g transform="translate(1530,300) rotate(1.5)">
      <rect x={-78} y={-62} width={156} height={124} fill="#5A3822" stroke={INK} strokeWidth={4} />
      <rect x={-66} y={-50} width={132} height={100} fill="#3A3836" />
      <circle cx={0} cy={0} r={34} fill="#D8D2C4" opacity={0.18} />
      <circle cx={0} cy={0} r={24} fill="#E8E2D4" opacity={0.35} />
      {[-58, 64, 200].map((a) => (
        <path key={a} d={`M${Math.cos((a * Math.PI) / 180) * 18},${Math.sin((a * Math.PI) / 180) * 18} L${Math.cos((a * Math.PI) / 180) * 62},${Math.sin((a * Math.PI) / 180) * 62}`} stroke="#F4EFE6" strokeWidth={1.6} opacity={0.75} />
      ))}
      <circle cx={0} cy={0} r={16} fill="#0A0A0C" />
      <rect x={-24} y={66} width={48} height={18} fill="#E9DCC6" stroke={INK} strokeWidth={2} />
      <text x={0} y={80} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={13} fill={INK}>
        1919
      </text>
    </g>
    <rect x={420} y={715} width={1100} height={36} fill="#7A4E30" stroke={INK} strokeWidth={5} />
    <path d="M460,751 L460,900 M1480,751 L1480,900" stroke={INK} strokeWidth={14} />
    {/* parts on the bench */}
    <rect x={560} y={689} width={90} height={26} rx={4} fill="#3E7CB1" stroke={INK} strokeWidth={3} />
    <circle cx={1300} cy={699} r={16} fill="#C9CED6" stroke={INK} strokeWidth={3} />
    <path d="M1360,715 l40,-20 l30,10" stroke="#C2464F" strokeWidth={4} fill="none" />
    <path d="M1460,715 L1400,500 L1260,520" stroke="#5A5E6A" strokeWidth={10} fill="none" />
    <ellipse cx={1240} cy={540} rx={60} ry={20} fill="#5A5E6A" stroke={INK} strokeWidth={4} />
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
    if (v === 'workshop') return <Glow x={1240} y={620} r={420} color="#FFF1C8" opacity={0.45} />;
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
