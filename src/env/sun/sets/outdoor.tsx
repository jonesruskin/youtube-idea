import React, {useMemo} from 'react';
import {rand, Stars} from '../../../fx/sky';
import {Aurora, MilkyWay, Snow} from '../../../fx/cinema/atmos';
import {Glow, Grade, INK, registerSet, Smoke, TorchBeam, Vignette, type SetCtx} from '../stage';

/**
 * Outdoor sets on the family's street (a cold, coastal northern city).
 *  street     — Hour one / Day 1: brick terraces, shopfronts, streetlights still on. floor y = 960
 *  snowstreet — Day 7–8: the same street buried in snow, no power; the metro entrance with its warm vent. floor y = 960
 *  surface    — Day 40–365: the frozen city from an open square; the sky is the subject. floor y = 940
 */

// ── sky ─────────────────────────────────────────────────────────────────────────────────────────
const Sky: React.FC<{frame: number; top: string; mid: string; bottom: string; stars?: number; seed?: number}> = ({frame, top, mid, bottom, stars = 1, seed = 3}) => (
  <g>
    <defs>
      <linearGradient id={`sky${seed}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="0.6" stopColor={mid} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={-800} y={-700} width={3520} height={2000} fill={`url(#sky${seed})`} />
    {stars > 0 && <Stars frame={frame} count={Math.round(520 * stars)} w={3400} h={1200} seed={seed} maxR={2.6} opacity={Math.min(1, stars)} y0={-650} />}
  </g>
);

// ── buildings ───────────────────────────────────────────────────────────────────────────────────
type House = {x: number; w: number; h: number; col: string; roof: 'flat' | 'gable' | 'step'; floors: number; shop: number; lit: number[]; chimney: boolean};
const COLS = ['#8E4A3C', '#A65E46', '#6F4E46', '#7D6A5A', '#5E5A6E', '#9A7A54', '#7A3E3A'];
const SHOPS = [
  {name: 'BAKERY', col: '#E9C46A'},
  {name: 'PHARMACY', col: '#3C8D6E'},
  {name: 'CAFÉ', col: '#C2464F'},
  {name: 'BOOKS', col: '#3E7CB1'},
  {name: 'HARDWARE', col: '#E07A5F'},
];
const useHouses = (seed: number, x0: number, x1: number, low = false) =>
  useMemo(() => {
    const r = rand(seed);
    const out: House[] = [];
    let x = x0;
    let i = 0;
    while (x < x1) {
      const w = 220 + r() * 160;
      const floors = low ? 2 + Math.floor(r() * 2) : 3 + Math.floor(r() * 3);
      out.push({
        x,
        w,
        h: 140 + floors * 120,
        col: COLS[Math.floor(r() * COLS.length)],
        roof: (['flat', 'gable', 'step'] as const)[Math.floor(r() * 3)],
        floors,
        shop: i % 2 === 0 ? Math.floor(r() * SHOPS.length) : -1,
        lit: Array.from({length: 24}, () => r()),
        chimney: r() > 0.5,
      });
      x += w + 4;
      i++;
    }
    return out;
  }, [seed, x0, x1, low]);

/** A row of brick terraces. `power` 0..1 = windows lit; `snow` adds caps and drifts; `frost` greys the brick. */
const Terraces: React.FC<{base: number; seed: number; power: number; snow: number; frame: number; x0?: number; x1?: number; shade?: number; low?: boolean}> = ({base, seed, power, snow, frame, x0 = -700, x1 = 2700, shade = 0, low}) => {
  const houses = useHouses(seed, x0, x1, low);
  return (
    <g>
      {houses.map((h, i) => {
        const top = base - h.h;
        const cols = Math.max(2, Math.floor(h.w / 90));
        const ww = (h.w - 40) / cols;
        return (
          <g key={i}>
            {h.chimney && <rect x={h.x + h.w * 0.7} y={top - 70} width={34} height={80} fill={h.col} stroke={INK} strokeWidth={4} />}
            {h.roof === 'gable' && <path d={`M${h.x - 6},${top} L${h.x + h.w / 2},${top - 90} L${h.x + h.w + 6},${top} Z`} fill="#3A3442" stroke={INK} strokeWidth={4} />}
            {h.roof === 'step' && <path d={`M${h.x},${top} L${h.x},${top - 40} L${h.x + h.w * 0.25},${top - 40} L${h.x + h.w * 0.25},${top - 80} L${h.x + h.w * 0.75},${top - 80} L${h.x + h.w * 0.75},${top - 40} L${h.x + h.w},${top - 40} L${h.x + h.w},${top} Z`} fill={h.col} stroke={INK} strokeWidth={4} />}
            <rect x={h.x} y={top} width={h.w} height={h.h + 400} fill={h.col} stroke={INK} strokeWidth={4} />
            {/* brick courses */}
            {Array.from({length: Math.floor(h.h / 36)}, (_, k) => (
              <path key={k} d={`M${h.x},${top + 18 + k * 36} L${h.x + h.w},${top + 18 + k * 36}`} stroke="#00000018" strokeWidth={3} />
            ))}
            <rect x={h.x} y={top} width={h.w} height={16} fill="#00000030" />
            {/* windows */}
            {Array.from({length: h.floors - 1}, (_, fl) =>
              Array.from({length: cols}, (_, k) => {
                const wx = h.x + 20 + k * ww + ww * 0.18;
                const wy = top + 40 + fl * 120;
                const lit = h.lit[(fl * cols + k) % 24] < power * 0.8;
                const warm = h.lit[(fl * cols + k + 7) % 24] > 0.3;
                return (
                  <g key={`${fl}-${k}`}>
                    <rect x={wx - 6} y={wy - 6} width={ww * 0.64 + 12} height={86} fill="#E9DCC6" stroke={INK} strokeWidth={3} />
                    <rect x={wx} y={wy} width={ww * 0.64} height={74} fill={lit ? (warm ? '#FFD58A' : '#BFE3FF') : '#1C2238'} stroke={INK} strokeWidth={3} />
                    <path d={`M${wx + ww * 0.32},${wy} L${wx + ww * 0.32},${wy + 74} M${wx},${wy + 37} L${wx + ww * 0.64},${wy + 37}`} stroke="#E9DCC6" strokeWidth={4} />
                    {lit && <rect x={wx} y={wy} width={ww * 0.64} height={74} fill="#FFE8B0" opacity={0.25 + 0.1 * Math.sin(frame * 0.05 + k + fl)} />}
                    {snow > 0 && <rect x={wx - 10} y={wy + 78} width={ww * 0.64 + 20} height={10 * snow} rx={5} fill="#EEF4FB" />}
                  </g>
                );
              }),
            )}
            {/* shopfront */}
            {h.shop >= 0 && (
              <g>
                <rect x={h.x + 16} y={base - 150} width={h.w - 32} height={150} fill={power > 0 ? '#FFE6B0' : '#1A1E2E'} stroke={INK} strokeWidth={4} />
                <rect x={h.x + 10} y={base - 196} width={h.w - 20} height={46} fill={SHOPS[h.shop].col} stroke={INK} strokeWidth={4} />
                <text x={h.x + h.w / 2} y={base - 163} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={26} fill="#FFF8EC" letterSpacing={3}>
                  {SHOPS[h.shop].name}
                </text>
                {/* awning stripes */}
                <path d={`M${h.x + 10},${base - 150} L${h.x + h.w - 10},${base - 150} L${h.x + h.w - 24},${base - 120} L${h.x + 24},${base - 120} Z`} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
                {Array.from({length: 8}, (_, k) => (
                  <rect key={k} x={h.x + 24 + k * ((h.w - 48) / 8)} y={base - 150} width={(h.w - 48) / 16} height={30} fill={SHOPS[h.shop].col} opacity={0.9} />
                ))}
                {power > 0 && <rect x={h.x + 16} y={base - 120} width={h.w - 32} height={120} fill="#FFF2CC" opacity={0.35} />}
              </g>
            )}
            {h.shop < 0 && (
              <g>
                <rect x={h.x + h.w / 2 - 44} y={base - 170} width={88} height={170} rx={6} fill="#2E3A5C" stroke={INK} strokeWidth={4} />
                <circle cx={h.x + h.w / 2 + 26} cy={base - 84} r={5} fill="#E8C27A" />
                <rect x={h.x + h.w / 2 - 60} y={base - 14} width={120} height={14} fill="#B8B0A4" stroke={INK} strokeWidth={3} />
              </g>
            )}
            {snow > 0 && <path d={`M${h.x - 10},${top + 4} Q${h.x + h.w / 2},${top - 30 * snow} ${h.x + h.w + 10},${top + 4} Z`} fill="#EEF4FB" stroke={INK} strokeWidth={3} />}
          </g>
        );
      })}
      {shade > 0 && <rect x={x0} y={-200} width={x1 - x0} height={1600} fill="#0A1030" opacity={shade} />}
    </g>
  );
};

const Lamp: React.FC<{x: number; base: number; on: boolean; frame: number; snow?: number}> = ({x, base, on, frame, snow = 0}) => (
  <g>
    <path d={`M${x},${base} L${x},${base - 420} Q${x},${base - 470} ${x + 60},${base - 470}`} stroke="#2A3142" strokeWidth={14} fill="none" />
    <path d={`M${x},${base} L${x},${base - 420} Q${x},${base - 470} ${x + 60},${base - 470}`} stroke={INK} strokeWidth={4} fill="none" opacity={0.6} />
    <path d={`M${x + 40},${base - 476} L${x + 90},${base - 476} L${x + 80},${base - 450} L${x + 50},${base - 450} Z`} fill="#2A3142" stroke={INK} strokeWidth={3} />
    {on && <ellipse cx={x + 65} cy={base - 448} rx={18} ry={6} fill="#FFF0C2" opacity={0.9 + 0.1 * Math.sin(frame * 0.3)} />}
    {snow > 0 && <ellipse cx={x + 65} cy={base - 480} rx={30} ry={8} fill="#EEF4FB" />}
    <rect x={x - 14} y={base - 30} width={28} height={30} fill="#2A3142" />
  </g>
);

const Car: React.FC<{x: number; base: number; col: string; snow: number; lights?: boolean; flip?: boolean}> = ({x, base, col, snow, lights, flip}) => (
  <g transform={`translate(${x},${base}) scale(${flip ? -1 : 1},1)`}>
    <path d="M-150,-30 L-150,-80 Q-140,-96 -100,-100 L-60,-150 Q-50,-160 30,-160 Q60,-158 80,-110 L140,-100 Q160,-92 160,-70 L160,-30 Z" fill={col} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-50,-108 L-30,-146 L20,-146 L20,-108 Z M34,-108 L34,-146 Q52,-144 64,-108 Z" fill="#9FC7E8" stroke={INK} strokeWidth={4} opacity={snow > 0.5 ? 0.3 : 1} />
    {[-90, 100].map((wx) => (
      <g key={wx}>
        <circle cx={wx} cy={-30} r={32} fill="#1E2230" stroke={INK} strokeWidth={4} />
        <circle cx={wx} cy={-30} r={13} fill="#8A8F9C" />
      </g>
    ))}
    {lights && (
      <g>
        <ellipse cx={156} cy={-78} rx={10} ry={8} fill="#FFF6D6" />
        <path d="M160,-78 L520,-150 L520,10 Z" fill="#FFF3C8" opacity={0.16} />
      </g>
    )}
    {snow > 0 && <path d={`M-160,-80 Q-120,${-110 - snow * 20} -60,-150 Q0,${-170 - snow * 40} 70,-150 Q120,${-110 - snow * 30} 165,-90 L165,-30 L-165,-30 Z`} fill="#EEF4FB" stroke={INK} strokeWidth={4} opacity={Math.min(1, snow)} />}
  </g>
);

// ── STREET ──────────────────────────────────────────────────────────────────────────────────────
registerSet('street', {
  layers: (c) => [
    {depth: 0.15, node: <Sky frame={c.frame} top="#02040C" mid="#0B1233" bottom="#1E2A55" seed={7} />},
    {depth: 0.45, node: <Terraces base={700} seed={91} power={1} snow={0} frame={c.frame} shade={0.45} x0={-900} x1={2900} />},
    {
      depth: 1,
      node: (
        <g>
          <Terraces base={900} seed={17} power={1} snow={0} frame={c.frame} low />
          {/* pavement + road */}
          <rect x={-800} y={900} width={3600} height={60} fill="#8C8A90" stroke={INK} strokeWidth={4} />
          {Array.from({length: 40}, (_, i) => (
            <path key={i} d={`M${-800 + i * 90},900 L${-800 + i * 90},960`} stroke="#6E6C74" strokeWidth={3} />
          ))}
          <rect x={-800} y={960} width={3600} height={500} fill="#3A3D4A" />
          <rect x={-800} y={958} width={3600} height={10} fill="#B8B0A4" />
          {Array.from({length: 16}, (_, i) => (
            <rect key={i} x={-760 + i * 240} y={1030} width={120} height={10} fill="#E8E2D6" opacity={0.6} />
          ))}
          {[-120, 520, 1180, 1840].map((x) => (
            <Lamp key={x} x={x} base={900} on frame={c.frame} />
          ))}
          <Car x={260} base={1060} col="#C2464F" snow={0} lights />
          <Car x={1540} base={1080} col="#3E7CB1" snow={0} lights flip />
        </g>
      ),
    },
    {
      depth: 1.35,
      blur: 6,
      front: true,
      node: (
        <g>
          <rect x={-420} y={-200} width={40} height={1400} fill="#1A1E2A" />
          <path d="M2260,1100 Q2300,980 2380,1100 Z" fill="#1A1E2A" />
        </g>
      ),
    },
  ],
  light: (c) => (
    <g>
      {[-120, 520, 1180, 1840].map((x) => (
        <g key={x}>
          <Glow x={x + 65} y={452} r={120} color="#FFE6A8" opacity={0.6} />
          <Glow x={x + 65} y={920} r={260} color="#FFD58A" opacity={0.28} rx={360} />
        </g>
      ))}
    </g>
  ),
  grade: (c) => (
    <g>
      <Grade color="#2A3A8A" amount={0.32} />
      <Vignette amount={0.5} />
    </g>
  ),
});

// ── SNOW STREET ─────────────────────────────────────────────────────────────────────────────────
const MetroEntrance: React.FC<{x: number; base: number; frame: number}> = ({x, base, frame}) => (
  <g>
    {/* railings + stairs going down, sign */}
    <rect x={x - 180} y={base - 20} width={360} height={60} fill="#20232E" />
    {Array.from({length: 5}, (_, k) => (
      <rect key={k} x={x - 170 + k * 8} y={base - 10 + k * 10} width={340 - k * 16} height={8} fill="#3A3D4A" />
    ))}
    {[-1, 1].map((k) => (
      <g key={k}>
        <path d={`M${x + k * 180},${base} L${x + k * 180},${base - 110} L${x + k * 40},${base - 110}`} stroke="#3C8D6E" strokeWidth={10} fill="none" />
        {Array.from({length: 6}, (_, j) => (
          <path key={j} d={`M${x + k * (180 - j * 24)},${base - 110} L${x + k * (180 - j * 24)},${base}`} stroke="#3C8D6E" strokeWidth={5} />
        ))}
      </g>
    ))}
    <path d={`M${x},${base - 110} L${x},${base - 300}`} stroke="#2A3142" strokeWidth={12} />
    <circle cx={x} cy={base - 330} r={46} fill="#D9443A" stroke={INK} strokeWidth={5} />
    <text x={x} y={base - 316} textAnchor="middle" fontFamily="'Unbounded', sans-serif" fontWeight={800} fontSize={44} fill="#FFFFFF">
      M
    </text>
    <ellipse cx={x} cy={base - 372} rx={40} ry={10} fill="#EEF4FB" />
    {/* the warm grate in front of it */}
    <rect x={x - 340} y={base - 4} width={120} height={14} rx={3} fill="#2A2E3A" stroke={INK} strokeWidth={3} />
    {Array.from({length: 7}, (_, k) => (
      <path key={k} d={`M${x - 332 + k * 16},${base - 2} L${x - 332 + k * 16},${base + 8}`} stroke="#5A5E6A" strokeWidth={4} />
    ))}
    <ellipse cx={x - 280} cy={base + 6} rx={120} ry={16} fill="#3A3D4A" opacity={0.8} />
    <Smoke frame={frame} x={x - 360} y={base - 520} w={180} h={520} color="#C8D2E0" opacity={0.35} seed={4} rise={0.9} />
  </g>
);

const Drifts: React.FC<{base: number; seed: number}> = ({base, seed}) => {
  const r = rand(seed);
  const pts = Array.from({length: 30}, (_, i) => [-800 + i * 130, base - 20 - r() * 50]);
  return (
    <path
      d={`M-800,${base + 400} L${pts.map(([x, y]) => `${x},${y}`).join(' L')} L3200,${base + 400} Z`}
      fill="#E6EEF8"
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  );
};

registerSet('snowstreet', {
  layers: (c) => {
    const wind = (c.p.wind as number) ?? 0.4;
    return [
      {depth: 0.15, node: <Sky frame={c.frame} top="#010208" mid="#070C22" bottom="#141C3A" seed={9} />},
      {depth: 0.45, node: <Terraces base={700} seed={91} power={0} snow={1} frame={c.frame} shade={0.55} x0={-900} x1={2900} />},
      {
        depth: 1,
        node: (
          <g>
            <Terraces base={900} seed={17} power={0} snow={1} frame={c.frame} low />
            <rect x={-800} y={900} width={3600} height={600} fill="#D3DEEC" />
            <Drifts base={960} seed={5} />
            {[-120, 520, 1180].map((x) => (
              <Lamp key={x} x={x} base={900} on={false} frame={c.frame} snow={1} />
            ))}
            <Car x={300} base={1000} col="#C2464F" snow={1.2} />
            <Car x={960} base={1010} col="#5E8C7A" snow={1.3} flip />
            {c.v === 'vent' && <MetroEntrance x={1740} base={960} frame={c.frame} />}
            {c.v === 'door' && (
              <g>
                {/* your building's street door, banging open */}
                <rect x={540} y={600} width={200} height={360} fill="#0A0C16" stroke={INK} strokeWidth={5} />
                <g transform={`translate(540,600) skewY(${-8 + Math.sin(c.frame * 0.5) * 4})`}>
                  <rect x={-150} y={0} width={150} height={360} fill="#2E3A5C" stroke={INK} strokeWidth={5} />
                </g>
                <rect x={500} y={560} width={280} height={40} fill="#6F4E46" stroke={INK} strokeWidth={4} />
                <rect x={620} y={600} width={120} height={360} fill="#FFB867" opacity={0.25} />
              </g>
            )}
            {c.v !== 'door' && <PawPrints from={c.v === 'vent' ? 700 : 1500} to={c.v === 'vent' ? 1420 : 2400} base={990} />}
          </g>
        ),
      },
      {depth: 1.1, front: true, node: <Snow frame={c.frame} density={1.2} wind={1 + wind * 4} seed={3} opacity={0.9} />},
      {depth: 1.5, blur: 5, front: true, node: <Snow frame={c.frame} density={0.3} wind={2 + wind * 6} seed={8} opacity={0.8} />},
    ];
  },
  light: (c) => <g>{c.v === 'vent' && <Glow x={1460} y={940} r={260} color="#FFB867" opacity={0.3} rx={340} />}</g>,
  grade: (c) => (
    <g>
      <Grade color="#2A3A8A" amount={0.4} />
      <Vignette amount={0.6} />
    </g>
  ),
  handheld: 0.6,
});

const PawPrints: React.FC<{from: number; to: number; base: number}> = ({from, to, base}) => (
  <g>
    {Array.from({length: Math.floor((to - from) / 70)}, (_, i) => {
      const x = from + i * 70;
      const y = base + (i % 2 ? 10 : -6);
      return (
        <g key={i} transform={`translate(${x},${y})`} opacity={0.8}>
          <ellipse cx={0} cy={0} rx={9} ry={6} fill="#9DB0CA" />
          {[-8, 0, 8].map((dx) => (
            <circle key={dx} cx={dx + 6} cy={-8} r={3} fill="#9DB0CA" />
          ))}
        </g>
      );
    })}
  </g>
);

// ── SURFACE ─────────────────────────────────────────────────────────────────────────────────────
const FrozenSkyline: React.FC<{base: number; seed: number; col: string}> = ({base, seed, col}) => {
  const r = rand(seed);
  const blocks = Array.from({length: 26}, (_, i) => ({x: -700 + i * 150 + r() * 40, w: 110 + r() * 90, h: 120 + Math.pow(r(), 1.4) * 420, spire: r() > 0.8}));
  return (
    <g>
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h + 300} fill={col} />
          <rect x={b.x - 4} y={base - b.h - 8} width={b.w + 8} height={14} rx={6} fill="#C9D6E8" opacity={0.7} />
          {b.spire && <path d={`M${b.x + b.w / 2 - 6},${base - b.h} L${b.x + b.w / 2},${base - b.h - 120} L${b.x + b.w / 2 + 6},${base - b.h} Z`} fill={col} />}
        </g>
      ))}
    </g>
  );
};

registerSet('surface', {
  layers: (c) => {
    const flashAt = c.at(c.p.flash, 999);
    const fl = c.v === 'flash' ? Math.max(0, 1 - Math.abs(c.t - flashAt - 0.5) / 0.5) : 0;
    const gold = Math.min(1, fl * 1.6);
    const milky = c.v === 'milky' || c.v === 'flash';
    return [
      {
        depth: 0.08,
        node: (
          <g>
            <Sky frame={c.frame} top="#01020A" mid="#081032" bottom="#22305E" stars={c.v === 'noon' ? 1.2 : 2} seed={21} />
            {milky && (
              <g>
                <MilkyWay frame={c.frame} opacity={1} angle={-24} cx={960} cy={260} />
                <MilkyWay frame={c.frame} opacity={0.7} angle={-24} cx={960} cy={260} seed={77} />
                <ellipse cx={960} cy={260} rx={1300} ry={160} fill="#C9B8FF" opacity={0.08} transform="rotate(-24,960,260)" />
              </g>
            )}
            {c.v === 'deep' && <MilkyWay frame={c.frame} opacity={0.8} angle={-40} cx={1300} cy={200} />}
            <ellipse cx={960} cy={860} rx={1800} ry={260} fill="#3A4C8A" opacity={0.35} />
            {gold > 0 && <rect x={-800} y={-700} width={3520} height={2000} fill="#FFC56B" opacity={gold} />}
            {gold > 0 && <circle cx={1500} cy={140} r={90} fill="#FFFBE8" opacity={gold} />}
          </g>
        ),
      },
      {depth: 0.35, node: <FrozenSkyline base={820} seed={31} col={gold > 0 ? '#B07A3A' : '#1A2342'} />},
      {
        depth: 1,
        node: (
          <g>
            <FrozenSkyline base={900} seed={47} col={gold > 0 ? '#8A5A2A' : '#232C4E'} />
            <rect x={-800} y={900} width={3600} height={600} fill={gold > 0.3 ? '#FFE3B0' : '#C9D6E8'} />
            <Drifts base={950} seed={13} />
            {/* a buried bus shelter and a statue — the city square */}
            <g transform="translate(360,950)">
              <rect x={-120} y={-200} width={240} height={200} fill="none" stroke="#2A3142" strokeWidth={10} />
              <path d="M-140,-200 L140,-200" stroke="#2A3142" strokeWidth={18} />
              <path d="M-150,-190 Q0,-260 150,-190 L150,-206 L-150,-206 Z" fill="#EEF4FB" stroke={INK} strokeWidth={3} />
              <path d="M-130,0 Q0,-120 130,0 Z" fill="#E6EEF8" stroke={INK} strokeWidth={3} />
            </g>
            <g transform="translate(1600,950)">
              <rect x={-70} y={-120} width={140} height={120} fill="#5E5A6E" stroke={INK} strokeWidth={4} />
              <path d="M-30,-120 L-30,-260 Q0,-300 30,-260 L30,-120 Z M30,-240 L90,-300" stroke={INK} strokeWidth={6} fill="#6F6A80" />
              <circle cx={0} cy={-290} r={26} fill="#6F6A80" stroke={INK} strokeWidth={4} />
              <ellipse cx={0} cy={-312} rx={30} ry={10} fill="#EEF4FB" />
              <ellipse cx={0} cy={-124} rx={80} ry={12} fill="#EEF4FB" />
            </g>
          </g>
        ),
      },
      {depth: 1.2, front: true, node: <Snow frame={c.frame} density={0.25} wind={0.4} seed={12} opacity={0.6} />},
    ];
  },
  light: (c) => {
    const flashAt = c.at(c.p.flash, 999);
    const fl = c.v === 'flash' ? Math.max(0, 1 - Math.abs(c.t - flashAt - 0.5) / 0.5) : 0;
    return <g>{fl > 0 && <rect x={-400} y={-400} width={2800} height={1900} fill="#FFD27A" opacity={fl * 0.45} style={{mixBlendMode: 'screen'}} />}</g>;
  },
  grade: (c) => {
    const flashAt = c.at(c.p.flash, 999);
    const fl = c.v === 'flash' ? Math.max(0, 1 - Math.abs(c.t - flashAt - 0.5) / 0.5) : 0;
    const after = c.p.afterglow ? Math.max(0, 0.35 - c.t * 0.12) : 0;
    return (
      <g>
        <Grade color="#2A3A8A" amount={0.22 * (1 - fl)} />
        {after > 0 && <rect x={-200} y={-200} width={2320} height={1480} fill="#FFC56B" opacity={after} style={{mixBlendMode: 'screen'}} />}
        <Vignette amount={0.7} />
      </g>
    );
  },
});

export {Sky, Terraces, Drifts, FrozenSkyline, Lamp, Car, TorchBeam};
