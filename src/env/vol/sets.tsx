import React from 'react';
import {Glow, Grade, INK, registerSet, Vignette} from '../sun/stage';
import {Clock, NightSky, rnd} from '../sea/parts';

/**
 * File 002 (vol02) sets, Auckland. Natural scale; floor lines noted.
 *   villa     the Tupou family's wooden villa: front door, TV, bay window onto Kōwhai Street, dining table. floor 930.
 *             v: '' | 'night' | 'packing'
 *   backyard  the back garden sloping down to a little pond in the lowest dip. floor 930 (pond 950). v: '' | 'dead'
 *   creek     the bush creek behind school: ferns, a footbridge, the stream. floor 940. v: '' | 'quake' | 'fizz'
 *   busroute  Kōwhai Street: villas, power poles, the park at the far end, the hump. floor 940. v: 'scrape' | 'night' | 'evac'
 *   ops       the volcano monitoring centre: wall map of Auckland's volcanoes, quake screens, GPS plot. floor 930.
 *   hall      a school hall used as the evacuation centre. floor 940. v: '' | 'night' | 'glow'
 */
const W0 = -400;
const W1 = 2320;
const F = "'Space Grotesk', sans-serif";

const Villa: React.FC<{x: number; base: number; col: string; s?: number; lit?: boolean}> = ({x, base, col, s = 1, lit}) => (
  <g transform={`translate(${x},${base}) scale(${s})`}>
    <rect x={-170} y={-260} width={340} height={260} fill={col} stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => (
      <line key={i} x1={-170} y1={-240 + i * 28} x2={170} y2={-240 + i * 28} stroke="#000" strokeOpacity={0.12} strokeWidth={3} />
    ))}
    <path d="M-200,-260 L0,-380 L200,-260 Z" fill="#8A3A3A" stroke={INK} strokeWidth={5} />
    <rect x={-130} y={-200} width={80} height={110} fill={lit ? '#FFD27A' : '#2A3550'} stroke="#F4EFE6" strokeWidth={8} />
    <rect x={50} y={-200} width={80} height={110} fill={lit ? '#FFD27A' : '#2A3550'} stroke="#F4EFE6" strokeWidth={8} />
    <rect x={-30} y={-130} width={60} height={130} fill="#5A3A2A" stroke={INK} strokeWidth={4} />
    <rect x={-190} y={-14} width={380} height={14} fill="#F4EFE6" />
  </g>
);

const Fern: React.FC<{x: number; y: number; s?: number; sway: number}> = ({x, y, s = 1, sway}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${sway})`}>
    {[-60, -30, 0, 30, 60].map((a) => (
      <path key={a} d={`M0,0 Q${a * 1.2},-80 ${a * 2.4},-120`} stroke="#2E6B3A" strokeWidth={14} fill="none" strokeLinecap="round" />
    ))}
  </g>
);

// ── VILLA ──
registerSet('villa', {
  layers: (c) => {
    const night = c.v === 'night' || c.v === 'packing';
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={W0} y={-200} width={W1 - W0} height={1130} fill={c.v === 'new' ? '#CFE0E8' : '#E8DCC4'} />
            {Array.from({length: 40}, (_, i) => (
              <rect key={i} x={W0 + i * 70} y={-200} width={35} height={1130} fill="#DED0B4" opacity={0.5} />
            ))}
            <rect x={W0} y={880} width={W1 - W0} height={50} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
            <rect x={W0} y={930} width={W1 - W0} height={400} fill="#A8784E" />
            {Array.from({length: 24}, (_, i) => (
              <line key={i} x1={W0 + i * 120} y1={930} x2={W0 + i * 120 - 60} y2={1330} stroke="#8A5E3A" strokeWidth={4} />
            ))}
            {/* front door */}
            <rect x={40} y={400} width={180} height={480} fill="#2E5A7A" stroke={INK} strokeWidth={5} />
            <rect x={70} y={440} width={120} height={120} fill="#BFD8E8" opacity={0.7} />
            <circle cx={200} cy={660} r={9} fill="#D9A441" />
            {/* TV on a low cabinet */}
            <rect x={320} y={790} width={220} height={140} fill="#6E5236" stroke={INK} strokeWidth={5} />
            <rect x={330} y={640} width={200} height={140} rx={6} fill="#1A1A1A" stroke={INK} strokeWidth={5} />
            <rect x={342} y={652} width={176} height={116} fill={c.p.tv ? '#2A4A8A' : '#0E0E12'} />
            {c.p.tv && (
              <g>
                <rect x={342} y={738} width={176} height={20} fill="#C2464F" />
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <circle key={k} cx={380 + (k * 23) % 110} cy={680 + (k * 17) % 50} r={5} fill="#FFB547" />
                ))}
              </g>
            )}
            {/* bay window onto the street */}
            <rect x={740} y={300} width={400} height={420} fill={night ? '#0A1030' : '#9FD0F0'} stroke="#F4EFE6" strokeWidth={18} />
            <line x1={940} y1={300} x2={940} y2={720} stroke="#F4EFE6" strokeWidth={10} />
            {night ? (
              <g>
                {Array.from({length: 30}, (_, i) => {
                  const r = rnd(i + 5);
                  return <circle key={i} cx={760 + r() * 360} cy={320 + r() * 160} r={1.6} fill="#FFFFFF" opacity={0.7} />;
                })}
                <Villa x={860} base={720} col="#3A3E52" s={0.45} lit />
                <Villa x={1060} base={720} col="#2E3A4A" s={0.45} lit />
              </g>
            ) : (
              <g>
                <Villa x={860} base={720} col="#E9C46A" s={0.45} />
                <Villa x={1060} base={720} col="#9FC8A8" s={0.45} />
              </g>
            )}
            {/* family photos */}
            {[1220, 1360].map((px, i) => (
              <g key={px}>
                <rect x={px} y={330} width={110} height={90} fill="#6E5236" stroke={INK} strokeWidth={4} />
                <rect x={px + 8} y={338} width={94} height={74} fill={i ? '#9FD0F0' : '#F2C94C'} />
                {[0, 1, 2, 3].map((k) => (
                  <circle key={k} cx={px + 22 + k * 22} cy={384 - (k === 3 ? 0 : 6)} r={k === 3 ? 7 : 9} fill="#9A6440" />
                ))}
              </g>
            ))}
            {c.v === 'packing' && <rect x={1210} y={330} width={130} height={110} fill="none" stroke="#C9B89A" strokeWidth={4} strokeDasharray="8 6" />}
            {/* dining table (chairs drawn under sitters) and the empty chair */}
            <rect x={1300} y={760} width={500} height={20} rx={4} fill="#8A6A4A" stroke={INK} strokeWidth={5} />
            <path d="M1320,780 L1320,930 M1780,780 L1780,930" stroke="#6E5236" strokeWidth={12} />
            {[1380, 1520, 1700].map((bx) => (
              <ellipse key={bx} cx={bx} cy={752} rx={40} ry={10} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
            ))}
            {c.p.emptyChair && (
              <g transform={`translate(${c.p.emptyChair},930)`}>
                <path d="M-40,0 L-40,-110 L40,-110 L40,0 M-40,-110 L-40,-240" stroke="#6E5236" strokeWidth={10} fill="none" />
              </g>
            )}
            {/* a new house: moving boxes */}
            {c.v === 'new' &&
              [[560, 0], [660, 1], [600, 2], [1860, 0], [1960, 1]].map(([bx, k], i) => (
                <g key={i} transform={`translate(${bx},${930 - (k === 2 ? 100 : 0)})`}>
                  <rect x={-60} y={-100} width={120} height={100} fill="#C9A06A" stroke={INK} strokeWidth={4} />
                  <path d="M-60,-60 L60,-60" stroke="#A8804A" strokeWidth={6} />
                </g>
              ))}
            {/* packing: open bags on the floor */}
            {c.v === 'packing' &&
              [700, 1700].map((bx, i) => (
                <g key={bx} transform={`translate(${bx},930)`}>
                  <path d="M-80,0 L-70,-90 L70,-90 L80,0 Z" fill={i ? '#3E7CB1' : '#C2464F'} stroke={INK} strokeWidth={5} />
                  <path d="M-40,-90 Q0,-140 40,-90" stroke={INK} strokeWidth={6} fill="none" />
                </g>
              ))}
          </g>
        ),
      },
    ];
  },
  light: (c) => <Glow x={1500} y={150} r={900} color="#FFE7C2" opacity={c.v === 'night' || c.v === 'packing' ? 0.2 : 0.12} />,
  grade: (c) => (
    <g>
      <Grade color={c.v === '' ? '#FFF2DC' : '#FFE0B8'} amount={0.1} />
      <Vignette amount={0.45} />
    </g>
  ),
});

// ── BACKYARD ──
registerSet('backyard', {
  layers: (c) => [
    {
      depth: 0.3,
      node: (
        <g>
          <rect x={-900} y={-600} width={3720} height={1300} fill="#BFE0F0" />
          <circle cx={1700} cy={140} r={70} fill="#FFF6C8" />
          {[0, 1, 2].map((k) => (
            <ellipse key={k} cx={300 + k * 700} cy={180 + k * 30} rx={160} ry={40} fill="#FFFFFF" opacity={0.85} />
          ))}
        </g>
      ),
    },
    {
      depth: 1,
      node: (
        <g>
          {/* the house's back wall and deck */}
          <rect x={W0} y={200} width={760} height={700} fill="#9FC8A8" stroke={INK} strokeWidth={5} />
          {Array.from({length: 20}, (_, i) => (
            <line key={i} x1={W0} y1={220 + i * 34} x2={W0 + 760} y2={220 + i * 34} stroke="#000" strokeOpacity={0.1} strokeWidth={3} />
          ))}
          <rect x={60} y={420} width={160} height={200} fill="#2A3550" stroke="#F4EFE6" strokeWidth={10} />
          <rect x={W0} y={860} width={820} height={40} fill="#8A6A4A" stroke={INK} strokeWidth={4} />
          {/* fence */}
          {Array.from({length: 30}, (_, i) => (
            <rect key={i} x={360 + i * 70} y={560} width={60} height={340} fill="#B88A5A" stroke={INK} strokeWidth={3} />
          ))}
          {/* lawn sloping down to the pond hollow */}
          <path d={`M${W0},900 L700,900 Q1000,905 1150,960 Q1300,990 1450,950 Q1600,905 ${W1},900 L${W1},1400 L${W0},1400 Z`} fill="#6FB25A" stroke={INK} strokeWidth={4} />
          <ellipse cx={1250} cy={968} rx={180} ry={36} fill="#3E7CB1" stroke={INK} strokeWidth={5} />
          {c.v === 'dead' ? (
            <g>
              {[1200, 1290].map((fx, i) => (
                <g key={fx} transform={`translate(${fx},${962 + i * 4}) rotate(${i ? 170 : 10})`}>
                  <ellipse rx={22} ry={10} fill="#F28C28" />
                  <path d="M20,0 l14,-10 l0,20 Z" fill="#F28C28" />
                </g>
              ))}
            </g>
          ) : (
            [0, 1].map((k) => <ellipse key={k} cx={1200 + ((c.frame * 2 + k * 90) % 200)} cy={975} rx={20} ry={8} fill="#F28C28" />)
          )}
          {/* a washing line and a lemon tree */}
          <path d="M1500,520 L1500,900 M1900,520 L1900,900" stroke="#5A5A64" strokeWidth={8} />
          <path d="M1500,540 Q1700,580 1900,540" stroke="#C9CED6" strokeWidth={3} fill="none" />
          <circle cx={1720} cy={620} r={90} fill="#3A8A4A" />
          <path d="M1720,700 L1720,900" stroke="#6E5236" strokeWidth={18} />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx={1680 + k * 26} cy={600 + (k % 2) * 30} r={10} fill="#F2C94C" />
          ))}
        </g>
      ),
    },
  ],
  grade: () => (
    <g>
      <Grade color="#FFF4E0" amount={0.08} />
      <Vignette amount={0.4} />
    </g>
  ),
});

// ── CREEK ──
registerSet('creek', {
  handheld: 0.4,
  layers: (c) => {
    const shake = c.v === 'quake' ? Math.sin(c.t * 40) * 6 * Math.max(0, 1 - Math.abs(c.t - 0.6)) : 0;
    const fizz = c.v === 'fizz';
    return [
      {
        depth: 0.3,
        node: (
          <g transform={`translate(${shake},0)`}>
            <rect x={-900} y={-600} width={3720} height={1300} fill={c.p.night ? '#0A1428' : '#CFE6E0'} />
            {Array.from({length: 18}, (_, i) => (
              <g key={i}>
                <path d={`M${-400 + i * 160},700 L${-400 + i * 160},${120 + (i % 3) * 60}`} stroke="#5A4A3A" strokeWidth={16} />
                <circle cx={-400 + i * 160} cy={120 + (i % 3) * 60} r={110} fill={['#2E6B3A', '#3A7A44', '#28603A'][i % 3]} />
              </g>
            ))}
            {c.v === 'quake' &&
              c.t > 0.4 &&
              Array.from({length: 10}, (_, i) => <path key={i} d={`M${200 + i * 160 + c.t * 200},${200 - c.t * 120 - (i % 3) * 30} q10,-10 20,0 q10,-10 20,0`} stroke="#2A2A2A" strokeWidth={4} fill="none" />)}
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g transform={`translate(${shake * 0.6},0)`}>
            <rect x={W0} y={700} width={W1 - W0} height={260} fill="#6A8A4A" />
            {/* the footbridge */}
            <path d="M1500,820 Q1750,760 2000,820" stroke="#8A6A4A" strokeWidth={22} fill="none" />
            <path d="M1500,770 Q1750,710 2000,770" stroke="#8A6A4A" strokeWidth={8} fill="none" />
            {[1560, 1650, 1750, 1850, 1940].map((x) => (
              <line key={x} x1={x} y1={790 - Math.sin(((x - 1500) / 500) * Math.PI) * 50} x2={x} y2={740 - Math.sin(((x - 1500) / 500) * Math.PI) * 50} stroke="#8A6A4A" strokeWidth={6} />
            ))}
            {[200, 480, 1300, 2100].map((x, i) => (
              <Fern key={x} x={x} y={940} s={1 + (i % 2) * 0.3} sway={Math.sin(c.frame * 0.05 + i) * 3} />
            ))}
            {/* the stream in front */}
            <path d={`M${W0},960 Q600,940 1200,975 Q1700,1000 ${W1},960 L${W1},1400 L${W0},1400 Z`} fill="#4F86A6" stroke={INK} strokeWidth={4} />
            {Array.from({length: 8}, (_, i) => (
              <path key={i} d={`M${-200 + i * 300 + ((c.frame * 2) % 300)},${1000 + (i % 2) * 30} q30,-8 60,0`} stroke="#BFE0F0" strokeWidth={4} fill="none" />
            ))}
            {c.v === 'quake' && [0, 1, 2].map((k) => <ellipse key={k} cx={960} cy={1010} rx={60 + ((c.t * 300 + k * 80) % 300)} ry={(60 + ((c.t * 300 + k * 80) % 300)) * 0.2} fill="none" stroke="#E8F4FF" strokeWidth={3} opacity={0.6} />)}
            {fizz &&
              Array.from({length: 60}, (_, i) => {
                const r = rnd(i + 2);
                const x = 500 + r() * 1100;
                const y = 1060 - ((c.frame * (1.5 + r()) + r() * 200) % 90);
                return <circle key={i} cx={x} cy={y} r={2 + r() * 4} fill="#FFFFFF" opacity={0.8} />;
              })}
          </g>
        ),
      },
    ];
  },
  light: (c) => (c.p.night ? <Glow x={1000} y={900} r={420} color="#FFF4D6" opacity={0.3} /> : null),
  grade: (c) => (
    <g>
      <Grade color={c.p.night ? '#2A3A7A' : '#F0FFF0'} amount={c.p.night ? 0.34 : 0.06} />
      <Vignette amount={0.45} />
    </g>
  ),
});

// ── KŌWHAI STREET ──
const Bus: React.FC<{x: number; base: number; tilt?: number; driver?: boolean; sparks?: number; frame: number; doorOpen?: boolean}> = ({x, base, tilt = 0, driver, sparks = 0, frame, doorOpen}) => (
  <g transform={`translate(${x},${base}) rotate(${tilt},0,0)`}>
    <rect x={-560} y={-330} width={1120} height={300} rx={30} fill="#2E6EB5" stroke={INK} strokeWidth={6} />
    <rect x={-560} y={-110} width={1120} height={40} fill="#E9C46A" />
    {Array.from({length: 7}, (_, i) => (
      <rect key={i} x={-520 + i * 140} y={-300} width={120} height={120} rx={10} fill="#BFD8E8" stroke={INK} strokeWidth={4} />
    ))}
    <rect x={420} y={-300} width={110} height={260} rx={8} fill={doorOpen ? '#1A2A3A' : '#9FC0D8'} stroke={INK} strokeWidth={4} />
    {driver && (
      <g transform="translate(470,-200)">
        <circle cx={0} cy={0} r={34} fill="#8A5838" />
        <path d="M-34,-6 Q0,-50 34,-6" fill="#17120F" />
        <rect x={-40} y={30} width={80} height={60} fill="#22304F" />
      </g>
    )}
    <text x={-200} y={-140} fontFamily={F} fontWeight={800} fontSize={40} fill="#FFFFFF">
      KŌWHAI ST · 72
    </text>
    {[-380, 380].map((wx) => (
      <g key={wx}>
        <circle cx={wx} cy={-20} r={58} fill="#1A1A1A" stroke={INK} strokeWidth={5} />
        <circle cx={wx} cy={-20} r={22} fill="#8A8F9C" />
      </g>
    ))}
    {sparks > 0 &&
      Array.from({length: 18}, (_, i) => {
        const a = -Math.PI * (0.6 + 0.35 * ((i * 37) % 10) / 10);
        const l = 40 + ((i * 53 + frame * 7) % 80);
        return <line key={i} x1={-560} y1={-30} x2={-560 + Math.cos(a) * l} y2={-30 + Math.sin(a) * l} stroke="#FFD27A" strokeWidth={4} opacity={sparks} />;
      })}
  </g>
);

registerSet('busroute', {
  layers: (c) => {
    const night = c.v === 'night';
    const hump = 1300;
    const hp = c.p.humpAt !== undefined ? Math.max(0, 1 - Math.abs(c.t - c.at(c.p.humpAt, 1.4)) * 2.5) : 0;
    const busX = c.p.busX !== undefined ? c.p.busX + (c.v === 'scrape' ? (c.t - 1.4) * 260 : 0) : null;
    return [
      {
        depth: 0.2,
        node: night ? (
          <NightSky frame={c.frame} seed={17} top="#03050F" bottom="#1A2448" count={300} />
        ) : (
          <g>
            <rect x={-900} y={-600} width={3720} height={1300} fill={c.v === 'evac' ? '#C9D3DC' : '#F2C9A0'} />
            <circle cx={1500} cy={220} r={80} fill="#FFF0C8" opacity={c.v === 'evac' ? 0.4 : 1} />
          </g>
        ),
      },
      {
        depth: 0.6,
        node: (
          <g>
            {/* the park at the far end of the street: big trees */}
            {[1900, 2100, 2300].map((tx, i) => (
              <g key={tx}>
                <path d={`M${tx},800 L${tx},560`} stroke="#5A4A3A" strokeWidth={18} />
                <circle cx={tx} cy={520 - i * 20} r={130} fill={night ? '#16301E' : '#3A7A44'} />
              </g>
            ))}
            <text x={2050} y={780} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={30} fill={night ? '#9FB8A8' : '#2E5A3A'}>
              PARK
            </text>
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {[-200, 260, 720, 1180, 1640].map((vx, i) => (
              <Villa key={vx} x={vx} base={800} col={['#E9C46A', '#9FC8A8', '#E07A5F', '#BFD8E8', '#D8C8F0'][i]} s={0.9} lit={night} />
            ))}
            {/* power poles */}
            {[30, 950, 1870].map((px) => (
              <g key={px}>
                <path d={`M${px},820 L${px},300 M${px - 60},330 L${px + 60},330`} stroke="#5A4A3A" strokeWidth={10} />
              </g>
            ))}
            <path d="M-400,340 Q500,390 950,340 Q1400,390 1870,340 Q2100,370 2400,350" stroke="#2A2A2A" strokeWidth={3} fill="none" />
            {/* footpath, kerb, road with the hump */}
            <rect x={W0} y={800} width={W1 - W0} height={60} fill="#C9C3B8" />
            <path d={`M${W0},860 L${hump - 260},860 Q${hump},${838} ${hump + 260},860 L${W1},860 L${W1},1400 L${W0},1400 Z`} fill="#4A4E58" />
            <path d={`M${hump - 200},866 Q${hump},846 ${hump + 200},866`} stroke="#C9C3B8" strokeWidth={4} fill="none" />
            <path d={`M${hump - 60},900 l30,40 l-20,30`} stroke="#2A2A2A" strokeWidth={4} fill="none" />
            {Array.from({length: 12}, (_, i) => (
              <rect key={i} x={W0 + i * 260} y={1000} width={140} height={14} fill="#E9E4DA" />
            ))}
            {busX !== null && <Bus x={busX} base={930} tilt={c.v === 'scrape' ? -2.5 * hp : 0} driver={c.p.driver} sparks={c.v === 'scrape' ? hp : 0} frame={c.frame} />}
            {c.v === 'evac' && <Bus x={1500} base={930} driver frame={c.frame} doorOpen />}
            {c.p.beacon && (
              <g>
                <rect x={1560} y={840} width={60} height={30} fill="#F28C28" />
                <circle cx={1590} cy={830} r={14} fill={Math.sin(c.frame * 0.4) > 0 ? '#FF8A2A' : '#5A2A0A'} />
              </g>
            )}
          </g>
        ),
      },
    ];
  },
  light: (c) => (c.v === 'night' ? <Glow x={1300} y={800} r={400} color="#FFD27A" opacity={0.18} /> : null),
  grade: (c) => (
    <g>
      <Grade color={c.v === 'night' ? '#2A3A8A' : c.v === 'evac' ? '#D8DCE4' : '#FFE0C0'} amount={c.v === 'night' ? 0.3 : 0.1} />
      <Vignette amount={0.45} />
    </g>
  ),
});

// ── MONITORING CENTRE ──
registerSet('ops', {
  layers: (c) => {
    const night = c.v === 'night';
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={W0} y={-200} width={W1 - W0} height={1130} fill={night ? '#3A4250' : '#C9D3DC'} />
            <rect x={W0} y={-200} width={W1 - W0} height={140} fill="#1F2A44" />
            <text x={960} y={-100} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={40} fill="#E9E4DA">
              VOLCANO MONITORING CENTRE
            </text>
            {/* the wall map: Auckland's harbours and volcano dots, quake flashes */}
            <rect x={150} y={150} width={950} height={560} fill="#0E1E30" stroke={INK} strokeWidth={6} />
            <path d="M200,400 Q400,300 600,380 Q800,460 1050,360 L1050,700 L200,700 Z" fill="#2A4A3A" />
            <path d="M200,250 Q500,330 700,280 Q900,230 1050,300 L1050,150 L200,150 Z" fill="#163A5A" />
            {Array.from({length: 50}, (_, i) => {
              const r = rnd(i + 30);
              return <circle key={i} cx={240 + r() * 780} cy={330 + r() * 340} r={7} fill="#E8742A" stroke={INK} strokeWidth={2} />;
            })}
            {Array.from({length: 30}, (_, i) => {
              const r = rnd(i + 90);
              const on = Math.sin(c.frame * 0.2 + i * 1.7) > 0.6;
              return on ? <circle key={`q${i}`} cx={560 + r() * 180} cy={420 + r() * 140} r={5} fill="#FFFFFF" /> : null;
            })}
            <circle cx={650} cy={490} r={130} fill="none" stroke="#FF5A4A" strokeWidth={4} strokeDasharray="12 10" />
            {/* screens: seismograph traces and the GPS plot */}
            {[1240, 1500, 1760].map((sx, i) => (
              <g key={sx}>
                <rect x={sx - 110} y={420} width={220} height={150} rx={8} fill="#1A1E24" stroke={INK} strokeWidth={4} />
                {i < 2 ? (
                  <path d={`M${sx - 100},495 ${Array.from({length: 40}, (_, k) => `L${sx - 100 + k * 5},${495 + Math.sin(k * 1.3 + c.frame * 0.3 + i) * (8 + ((k * 7 + i * 13) % 5 === 0 ? 30 : 0))}`).join(' ')}`} stroke="#7CFF9A" strokeWidth={3} fill="none" />
                ) : (
                  <g>
                    <path d={`M${sx - 100},540 L${sx - 20},536 L${sx + 30},${c.p.gps ? 470 : 530} L${sx + 100},${c.p.gps ? 440 : 528}`} stroke="#FFD27A" strokeWidth={5} fill="none" />
                    <text x={sx} y={450} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={20} fill="#FFD27A">
                      GPS UPLIFT
                    </text>
                  </g>
                )}
              </g>
            ))}
            <rect x={1120} y={600} width={760} height={30} fill="#5A6470" />
            <rect x={W0} y={930} width={W1 - W0} height={400} fill="#5A6470" />
          </g>
        ),
      },
    ];
  },
  light: () => <Glow x={960} y={100} r={1100} color="#F4F8FF" opacity={0.16} />,
  grade: (c) => (
    <g>
      <Grade color={c.v === 'night' ? '#3A4A7A' : '#DDE8F4'} amount={c.v === 'night' ? 0.2 : 0.08} />
      <Vignette amount={0.45} />
    </g>
  ),
});

// ── EVACUATION HALL ──
registerSet('hall', {
  layers: (c) => {
    const night = c.v === 'night' || c.v === 'glow';
    const glow = c.v === 'glow';
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={W0} y={-200} width={W1 - W0} height={1140} fill={night ? '#4A4250' : '#D8C8A8'} />
            {/* high windows */}
            {Array.from({length: 6}, (_, i) => (
              <g key={i}>
                <rect x={-200 + i * 420} y={60} width={300} height={260} fill={glow ? '#3A1A10' : night ? '#0A1030' : '#BFE0F0'} stroke="#F4EFE6" strokeWidth={12} />
                {glow && <rect x={-200 + i * 420} y={240} width={300} height={80} fill="#FF7A2A" opacity={0.55} />}
              </g>
            ))}
            {/* stage with a banner */}
            <rect x={1700} y={540} width={700} height={400} fill="#6E3A3A" stroke={INK} strokeWidth={5} />
            <rect x={1760} y={420} width={520} height={80} fill="#F4EFE6" stroke={INK} strokeWidth={4} />
            <text x={2020} y={474} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={36} fill="#1F2A44">
              EVACUATION CENTRE
            </text>
            {/* camp beds */}
            {[-200, 160, 520].map((bx, i) => (
              <g key={bx}>
                <rect x={bx} y={880} width={300} height={36} rx={8} fill={['#3E7CB1', '#3C8D6E', '#C2464F'][i]} stroke={INK} strokeWidth={4} />
                <path d={`M${bx + 20},916 L${bx + 20},940 M${bx + 280},916 L${bx + 280},940`} stroke="#5A5A64" strokeWidth={6} />
              </g>
            ))}
            {/* tea urn table */}
            <rect x={1450} y={760} width={220} height={20} fill="#8A6A4A" stroke={INK} strokeWidth={4} />
            <rect x={1500} y={680} width={60} height={80} rx={10} fill="#C9CED6" stroke={INK} strokeWidth={4} />
            {c.p.clock && <Clock x={960} y={420} r={50} time={c.p.clock} />}
            {/* wooden floor */}
            <rect x={W0} y={940} width={W1 - W0} height={400} fill="#B88A5A" />
            {Array.from({length: 30}, (_, i) => (
              <line key={i} x1={W0 + i * 100} y1={940} x2={W0 + i * 100} y2={1340} stroke="#9A6E44" strokeWidth={3} />
            ))}
          </g>
        ),
      },
    ];
  },
  light: (c) => (c.v === 'glow' ? <Glow x={960} y={300} r={1100} color="#FF8A3A" opacity={0.28} /> : <Glow x={960} y={100} r={1000} color="#FFF0D8" opacity={c.v === 'night' ? 0.08 : 0.16} />),
  grade: (c) => (
    <g>
      <Grade color={c.v === 'glow' ? '#5A2A3A' : c.v === 'night' ? '#2A2A5A' : '#FFF0D8'} amount={c.v === '' ? 0.08 : 0.32} />
      <Vignette amount={0.55} />
    </g>
  ),
});

// ── CLASSROOM ──
registerSet('classroom', {
  layers: () => [
    {
      depth: 1,
      node: (
        <g>
          <rect x={W0} y={-200} width={W1 - W0} height={1130} fill="#F0E6D2" />
          {/* windows onto the playground */}
          {[-100, 260].map((wx) => (
            <rect key={wx} x={wx} y={220} width={300} height={360} fill="#BFE0F0" stroke="#F4EFE6" strokeWidth={14} />
          ))}
          {/* the whiteboard: Auckland and its volcano dots, a red question mark */}
          <rect x={1100} y={200} width={760} height={460} fill="#FAFAFA" stroke="#8A8F9C" strokeWidth={10} />
          <path d="M1140,520 Q1300,430 1460,470 Q1620,510 1820,420" stroke="#2E7D6E" strokeWidth={6} fill="none" />
          {Array.from({length: 22}, (_, i) => {
            const r = rnd(i + 21);
            return <circle key={i} cx={1150 + r() * 680} cy={470 + r() * 160} r={9} fill="#E8742A" />;
          })}
          <text x={1480} y={290} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={44} fill="#C2464F">
            NEXT ONE = ?
          </text>
          {/* desks (chairs drawn under the kids) */}
          {[440, 840, 1240].map((dx) => (
            <g key={dx}>
              <rect x={dx - 20} y={780} width={240} height={18} fill="#B88A5A" stroke={INK} strokeWidth={4} />
              <path d={`M${dx},798 L${dx},930 M${dx + 200},798 L${dx + 200},930`} stroke="#8A8F9C" strokeWidth={8} />
            </g>
          ))}
          <rect x={W0} y={930} width={W1 - W0} height={400} fill="#9AA4AE" />
        </g>
      ),
    },
  ],
  light: () => <Glow x={200} y={300} r={900} color="#FFFFFF" opacity={0.14} />,
  grade: () => (
    <g>
      <Grade color="#FFF6E8" amount={0.06} />
      <Vignette amount={0.4} />
    </g>
  ),
});
