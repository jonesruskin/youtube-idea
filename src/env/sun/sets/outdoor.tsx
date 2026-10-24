import React, {useMemo} from 'react';
import {rand, Stars} from '../../../fx/sky';
import {Aurora, MilkyWay, Snow} from '../../../fx/cinema/atmos';
import {Glow, Grade, INK, M, registerSet, Smoke, TorchBeam, Vignette, type SetCtx} from '../stage';

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
const useHouses = (seed: number, x0: number, x1: number, sc: number, low = false) =>
  useMemo(() => {
    const r = rand(seed);
    const out: House[] = [];
    let x = x0;
    let i = 0;
    while (x < x1) {
      const w = sc * (6 + r() * 3.5); // terrace fronts are 6–9.5 m wide
      const floors = low ? (r() > 0.75 ? 3 : 2) : 3 + Math.floor(r() * 2);
      out.push({
        x,
        w,
        h: floors * 3 * sc + sc * 0.6, // 3 m storeys + parapet
        col: COLS[Math.floor(r() * COLS.length)],
        roof: (['flat', 'gable', 'step'] as const)[Math.floor(r() * 3)],
        floors,
        shop: i % 2 === 0 ? Math.floor(r() * SHOPS.length) : -1,
        lit: Array.from({length: 24}, () => r()),
        chimney: r() > 0.5,
      });
      x += w + sc * 0.05;
      i++;
    }
    return out;
  }, [seed, x0, x1, sc, low]);

/**
 * A row of brick terraces drawn to real dimensions: 3 m storeys, 2.1 m doors, 1.1 × 1.5 m windows, shopfronts with
 * 2.6 m glazing. `sc` is pixels per metre: the street the cast stands in uses M(1); rows further back use less.
 */
const Terraces: React.FC<{base: number; seed: number; power: number; snow: number; frame: number; x0?: number; x1?: number; shade?: number; low?: boolean; sc?: number}> = ({base, seed, power, snow, frame, x0 = -700, x1 = 2700, shade = 0, low, sc = M(1)}) => {
  const houses = useHouses(seed, x0, x1, sc, low);
  const lw = Math.max(2, sc * 0.02); // line weight scales with distance
  return (
    <g>
      {houses.map((h, i) => {
        const top = base - h.h;
        const cols = Math.max(2, Math.floor(h.w / (sc * 2.3)));
        const pitch = h.w / cols;
        const winW = sc * 1.1;
        const winH = sc * 1.5;
        return (
          <g key={i}>
            {h.chimney && <rect x={h.x + h.w * 0.7} y={top - sc * 1.2} width={sc * 0.6} height={sc * 1.3} fill={h.col} stroke={INK} strokeWidth={lw} />}
            {h.roof === 'gable' && <path d={`M${h.x - sc * 0.1},${top} L${h.x + h.w / 2},${top - sc * 2.2} L${h.x + h.w + sc * 0.1},${top} Z`} fill="#3A3442" stroke={INK} strokeWidth={lw} />}
            {h.roof === 'step' && <path d={`M${h.x},${top} L${h.x},${top - sc * 0.8} L${h.x + h.w * 0.25},${top - sc * 0.8} L${h.x + h.w * 0.25},${top - sc * 1.6} L${h.x + h.w * 0.75},${top - sc * 1.6} L${h.x + h.w * 0.75},${top - sc * 0.8} L${h.x + h.w},${top - sc * 0.8} L${h.x + h.w},${top} Z`} fill={h.col} stroke={INK} strokeWidth={lw} />}
            <rect x={h.x} y={top} width={h.w} height={h.h + sc * 3} fill={h.col} stroke={INK} strokeWidth={lw} />
            {/* brick courses every 0.3 m */}
            {sc > 60 &&
              Array.from({length: Math.floor(h.h / (sc * 0.3))}, (_, k) => (
                <path key={k} d={`M${h.x},${top + sc * 0.15 + k * sc * 0.3} L${h.x + h.w},${top + sc * 0.15 + k * sc * 0.3}`} stroke="#00000016" strokeWidth={lw * 0.7} />
              ))}
            <rect x={h.x} y={top} width={h.w} height={sc * 0.3} fill="#00000030" />
            {/* string course between storeys */}
            {Array.from({length: h.floors - 1}, (_, fl) => (
              <rect key={`sc${fl}`} x={h.x} y={base - (fl + 1) * 3 * sc - sc * 0.15} width={h.w} height={sc * 0.15} fill="#E9DCC6" opacity={0.8} />
            ))}
            {/* upper-floor windows: sill 0.9 m above each floor */}
            {Array.from({length: h.floors - 1}, (_, fl) =>
              Array.from({length: cols}, (_, k) => {
                const wx = h.x + pitch * k + (pitch - winW) / 2;
                const wy = base - (fl + 1) * 3 * sc - sc * 0.9 - winH;
                const lit = h.lit[(fl * cols + k) % 24] < power * 0.8;
                const warm = h.lit[(fl * cols + k + 7) % 24] > 0.3;
                return (
                  <g key={`${fl}-${k}`}>
                    <rect x={wx - sc * 0.08} y={wy - sc * 0.08} width={winW + sc * 0.16} height={winH + sc * 0.2} fill="#E9DCC6" stroke={INK} strokeWidth={lw * 0.8} />
                    <rect x={wx} y={wy} width={winW} height={winH} fill={lit ? (warm ? '#FFD58A' : '#BFE3FF') : '#1C2238'} stroke={INK} strokeWidth={lw * 0.8} />
                    <path d={`M${wx + winW / 2},${wy} L${wx + winW / 2},${wy + winH} M${wx},${wy + winH * 0.45} L${wx + winW},${wy + winH * 0.45}`} stroke="#E9DCC6" strokeWidth={Math.max(2, sc * 0.05)} />
                    {lit && <rect x={wx} y={wy} width={winW} height={winH} fill="#FFE8B0" opacity={0.25 + 0.1 * Math.sin(frame * 0.05 + k + fl)} />}
                    {snow > 0 && <rect x={wx - sc * 0.12} y={wy + winH + sc * 0.08} width={winW + sc * 0.24} height={sc * 0.12 * snow} rx={sc * 0.05} fill="#EEF4FB" />}
                  </g>
                );
              }),
            )}
            {/* ground floor: a shopfront, or a front door with a window */}
            {h.shop >= 0 ? (
              <g>
                <rect x={h.x + sc * 0.3} y={base - sc * 2.6} width={h.w - sc * 0.6} height={sc * 2.6} fill={power > 0 ? '#FFE6B0' : '#1A1E2E'} stroke={INK} strokeWidth={lw} />
                {/* glazing bars + the shop door (2.1 m) */}
                <path d={`M${h.x + h.w * 0.35},${base - sc * 2.6} L${h.x + h.w * 0.35},${base}`} stroke="#3A3442" strokeWidth={lw * 1.4} />
                <rect x={h.x + h.w * 0.62} y={base - sc * 2.1} width={sc * 1.0} height={sc * 2.1} fill={power > 0 ? '#F6D9A0' : '#141826'} stroke={INK} strokeWidth={lw} />
                <rect x={h.x + sc * 0.2} y={base - sc * 3.4} width={h.w - sc * 0.4} height={sc * 0.7} fill={SHOPS[h.shop].col} stroke={INK} strokeWidth={lw} />
                <text x={h.x + h.w / 2} y={base - sc * 2.88} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={sc * 0.42} fill="#FFF8EC" letterSpacing={sc * 0.04}>
                  {SHOPS[h.shop].name}
                </text>
                {/* awning */}
                <path d={`M${h.x + sc * 0.2},${base - sc * 2.7} L${h.x + h.w - sc * 0.2},${base - sc * 2.7} L${h.x + h.w - sc * 0.5},${base - sc * 2.2} L${h.x + sc * 0.5},${base - sc * 2.2} Z`} fill="#F4EFE6" stroke={INK} strokeWidth={lw * 0.8} />
                {Array.from({length: 8}, (_, k) => (
                  <rect key={k} x={h.x + sc * 0.5 + k * ((h.w - sc) / 8)} y={base - sc * 2.7} width={(h.w - sc) / 16} height={sc * 0.5} fill={SHOPS[h.shop].col} opacity={0.9} />
                ))}
                {power > 0 && <rect x={h.x + sc * 0.3} y={base - sc * 2.2} width={h.w - sc * 0.6} height={sc * 2.2} fill="#FFF2CC" opacity={0.3} />}
                {/* goods in the window */}
                {Array.from({length: 4}, (_, k) => (
                  <rect key={`g${k}`} x={h.x + sc * 0.6 + k * sc * 0.5} y={base - sc * (0.9 + (k % 2) * 0.2)} width={sc * 0.35} height={sc * (0.5 + (k % 2) * 0.2)} rx={sc * 0.05} fill={['#C2464F', '#E9C46A', '#3E7CB1', '#3C8D6E'][k]} opacity={power > 0 ? 0.9 : 0.3} />
                ))}
              </g>
            ) : (
              <g>
                <rect x={h.x + h.w * 0.2} y={base - sc * 2.25} width={sc * 1.2} height={sc * 2.25} fill="#E9DCC6" stroke={INK} strokeWidth={lw * 0.8} />
                <rect x={h.x + h.w * 0.2 + sc * 0.1} y={base - sc * 2.1} width={sc * 1.0} height={sc * 2.1} rx={sc * 0.05} fill="#2E3A5C" stroke={INK} strokeWidth={lw} />
                <circle cx={h.x + h.w * 0.2 + sc * 0.9} cy={base - sc * 1.0} r={sc * 0.05} fill="#E8C27A" />
                <rect x={h.x + h.w * 0.2 - sc * 0.1} y={base - sc * 0.15} width={sc * 1.4} height={sc * 0.15} fill="#B8B0A4" stroke={INK} strokeWidth={lw * 0.7} />
                {(() => {
                  const wx = h.x + h.w * 0.55;
                  const wy = base - sc * 0.9 - winH;
                  const lit = h.lit[3] < power * 0.8;
                  return (
                    <g>
                      <rect x={wx - sc * 0.08} y={wy - sc * 0.08} width={winW + sc * 0.16} height={winH + sc * 0.2} fill="#E9DCC6" stroke={INK} strokeWidth={lw * 0.8} />
                      <rect x={wx} y={wy} width={winW} height={winH} fill={lit ? '#FFD58A' : '#1C2238'} stroke={INK} strokeWidth={lw * 0.8} />
                      <path d={`M${wx + winW / 2},${wy} L${wx + winW / 2},${wy + winH}`} stroke="#E9DCC6" strokeWidth={Math.max(2, sc * 0.05)} />
                    </g>
                  );
                })()}
              </g>
            )}
            {snow > 0 && <path d={`M${h.x - sc * 0.15},${top + lw} Q${h.x + h.w / 2},${top - sc * 0.6 * snow} ${h.x + h.w + sc * 0.15},${top + lw} Z`} fill="#EEF4FB" stroke={INK} strokeWidth={lw * 0.7} />}
          </g>
        );
      })}
      {shade > 0 && <rect x={x0} y={-2000} width={x1 - x0} height={4000} fill="#0A1030" opacity={shade} />}
    </g>
  );
};

/** Where a lamp's lantern hangs (for its glow), given the lamp's foot and px-per-metre. */
const lampHead = (x: number, base: number, sc: number): [number, number] => [x + 0.62 * sc, base - 4.36 * sc];

/** A street lamp to real size: a 4.5 m column with a short arm and lantern. `sc` is px per metre. */
const Lamp: React.FC<{x: number; base: number; sc: number; on: boolean; frame: number; snow?: number}> = ({x, base, sc, on, frame, snow = 0}) => {
  const lw = Math.max(1.5, sc * 0.02) / sc;
  return (
    <g transform={`translate(${x},${base}) scale(${sc})`}>
      <path d="M0,-0.4 L0,-4.2 Q0,-4.55 0.38,-4.55 L0.62,-4.55" stroke={INK} strokeWidth={0.1 + lw * 2} fill="none" strokeLinecap="round" />
      <path d="M0,-0.4 L0,-4.2 Q0,-4.55 0.38,-4.55 L0.62,-4.55" stroke="#2A3142" strokeWidth={0.1} fill="none" strokeLinecap="round" />
      <path d="M-0.13,0 L-0.1,-0.55 L0.1,-0.55 L0.13,0 Z" fill="#2A3142" stroke={INK} strokeWidth={lw} />
      <path d="M0.4,-4.62 L0.84,-4.62 L0.76,-4.4 L0.48,-4.4 Z" fill="#2A3142" stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      {on && <ellipse cx={0.62} cy={-4.37} rx={0.15} ry={0.05} fill="#FFF0C2" opacity={0.9 + 0.1 * Math.sin(frame * 0.3)} />}
      {snow > 0 && (
        <g fill="#EEF4FB" stroke={INK} strokeWidth={lw * 0.7}>
          <ellipse cx={0.62} cy={-4.65} rx={0.27} ry={0.07} />
          <path d="M0.05,-4.6 Q0.3,-4.72 0.5,-4.62 L0.05,-4.55 Z" />
        </g>
      )}
    </g>
  );
};

/**
 * A family car to real size: 4.4 m long, 1.5 m tall, wheels 0.66 m (drawn in metres, `sc` px per metre).
 * Faces right; `flip` faces it left. `snow` 0–1.5 buries it: caps on hood, roof and boot, frosted glass.
 */
const Car: React.FC<{x: number; base: number; sc: number; col: string; snow: number; lights?: boolean; flip?: boolean}> = ({x, base, sc, col, snow, lights, flip}) => {
  const lw = Math.max(1.5, sc * 0.022) / sc;
  const s = snow;
  return (
    <g transform={`translate(${x},${base}) scale(${flip ? -sc : sc},${sc})`}>
      <ellipse cx={0} cy={0} rx={2.4} ry={0.09} fill="#000" opacity={0.35} />
      <path d="M2.22,-0.3 L2.22,-0.74 Q2.18,-0.9 1.92,-0.94 L1.12,-1.0 L0.66,-1.42 Q0.58,-1.5 0.4,-1.5 L-0.92,-1.5 Q-1.14,-1.49 -1.32,-1.3 L-1.68,-1.0 L-2.08,-0.96 Q-2.22,-0.92 -2.22,-0.76 L-2.22,-0.3 Z" fill={col} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      <path d="M2.2,-0.62 L-2.2,-0.62" stroke="#FFFFFF" strokeWidth={0.03} opacity={0.25} />
      <path d="M2.22,-0.42 L-2.22,-0.42" stroke="#000000" strokeWidth={0.12} opacity={0.18} />
      <path d="M1.0,-1.02 L0.6,-1.4 L0.06,-1.4 L0.06,-1.02 Z M-0.06,-1.02 L-0.06,-1.4 L-0.86,-1.4 Q-1.04,-1.38 -1.24,-1.02 Z" fill={s > 0.4 ? '#C9D6E8' : '#9FC7E8'} stroke={INK} strokeWidth={lw * 0.8} strokeLinejoin="round" />
      {s <= 0.4 && <path d="M0.85,-1.08 L0.55,-1.36 L0.4,-1.36 L0.7,-1.08 Z" fill="#FFFFFF" opacity={0.35} />}
      <path d="M1.04,-1.0 L1.08,-0.36 M0.0,-1.0 L0.0,-0.34 M-1.26,-1.0 L-1.14,-0.4" stroke={INK} strokeWidth={lw * 0.6} opacity={0.55} fill="none" />
      <rect x={0.6} y={-0.88} width={0.2} height={0.05} rx={0.02} fill={INK} opacity={0.55} />
      <rect x={-0.52} y={-0.88} width={0.2} height={0.05} rx={0.02} fill={INK} opacity={0.55} />
      <path d="M0.98,-1.0 L1.1,-1.08 L1.2,-1.0 Z" fill={INK} opacity={0.7} />
      <rect x={1.94} y={-0.5} width={0.34} height={0.17} rx={0.05} fill="#2A2E3A" stroke={INK} strokeWidth={lw * 0.6} />
      <rect x={-2.28} y={-0.5} width={0.34} height={0.17} rx={0.05} fill="#2A2E3A" stroke={INK} strokeWidth={lw * 0.6} />
      <path d="M2.21,-0.84 L2.0,-0.88 L2.02,-0.72 L2.21,-0.7 Z" fill={lights ? '#FFF6D6' : '#E8E2D6'} stroke={INK} strokeWidth={lw * 0.6} />
      <rect x={-2.22} y={-0.86} width={0.12} height={0.16} fill="#C2464F" stroke={INK} strokeWidth={lw * 0.6} />
      {[1.38, -1.4].map((wx) => (
        <g key={wx}>
          <path d={`M${wx - 0.45},-0.3 A0.45,0.45 0 0 1 ${wx + 0.45},-0.3 Z`} fill="#141824" />
          <circle cx={wx} cy={-0.33} r={0.33} fill="#1E2230" stroke={INK} strokeWidth={lw} />
          <circle cx={wx} cy={-0.33} r={0.16} fill="#8A8F9C" stroke={INK} strokeWidth={lw * 0.5} />
          <circle cx={wx} cy={-0.33} r={0.04} fill="#3A3D4A" />
        </g>
      ))}
      {lights && (
        <g>
          <ellipse cx={2.17} cy={-0.79} rx={0.1} ry={0.08} fill="#FFFBE8" />
          <path d="M2.22,-0.79 L7,-1.4 L7,0.15 Z" fill="#FFF3C8" opacity={0.14} />
        </g>
      )}
      {s > 0 && (
        <g fill="#EEF4FB" stroke={INK} strokeWidth={lw * 0.7} strokeLinejoin="round" opacity={Math.min(1, s * 1.5)}>
          {/* roof, bonnet and boot caps: snow lies thickest on the flat panels */}
          <path d={`M-0.98,-1.48 Q-0.9,${-1.6 - 0.28 * s} -0.2,${-1.62 - 0.34 * s} Q0.45,${-1.6 - 0.3 * s} 0.6,-1.46 Z`} />
          <path d={`M1.1,-0.99 Q1.5,${-1.06 - 0.16 * s} 2.0,${-0.98 - 0.12 * s} Q2.26,-0.92 2.24,-0.8 L1.92,-0.93 Z`} />
          <path d={`M-1.66,-0.99 Q-1.95,${-1.06 - 0.14 * s} -2.24,-0.8 L-2.08,-0.95 Z`} />
          {/* drift banked against the side, burying the wheels */}
          <path d={`M-2.6,0.05 Q-2.3,${-0.5 * s} -1.4,${-0.55 * s} Q0,${-0.42 * s} 1.3,${-0.6 * s} Q2.3,${-0.5 * s} 2.6,0.05 Z`} />
        </g>
      )}
    </g>
  );
};

// ── STREET ──────────────────────────────────────────────────────────────────────────────────────
/**
 * Street perspective. The camera stands 1.1 m above the pavement the cast stands on (y 960, depth 1.2). Anything
 * k times as far away as the cast (k = 0.5 → twice as far) is drawn at M(k) px per metre on the ground line on(k).
 * The cast stands on the near pavement; across the road are parked cars, lamps, and the terraces.
 */
const EYE = 1.1;
const on = (k: number) => 960 - M(EYE) * (1 - k);
const K = {house: 0.42, farCurb: 0.5, lamp: 0.5, farCar: 0.54, lane: 0.7, nearCar: 0.86, nearCurb: 0.9, back: 0.2};
const LAMPS = [-150, 780, 1710];

const StreetFloor: React.FC<{snow: boolean}> = ({snow}) => {
  const slab = (k0: number, k1: number, fill: string, joint: string) => (
    <g>
      <rect x={-900} y={on(k0)} width={3800} height={on(k1) - on(k0)} fill={fill} />
      {!snow && Array.from({length: 46}, (_, i) => <path key={i} d={`M${-900 + i * M(1.2, (k0 + k1) / 2)},${on(k0)} L${-900 + i * M(1.2, (k0 + k1) / 2)},${on(k1)}`} stroke={joint} strokeWidth={2} />)}
    </g>
  );
  if (snow)
    return (
      <g>
        <rect x={-900} y={on(K.house)} width={3800} height={1400} fill="#D3DEEC" />
        <path d={`M-900,${on(K.farCurb)} Q960,${on(K.farCurb) - 14} 2900,${on(K.farCurb)}`} stroke="#B8C6DA" strokeWidth={6} fill="none" />
        <path d={`M-900,${on(K.lane)} L2900,${on(K.lane)}`} stroke="#C2CFE0" strokeWidth={3} opacity={0.7} />
      </g>
    );
  return (
    <g>
      {slab(K.house, K.farCurb, '#8C8A90', '#6E6C74')}
      <rect x={-900} y={on(K.farCurb) - 3} width={3800} height={5} fill="#B8B0A4" />
      <rect x={-900} y={on(K.farCurb) + 2} width={3800} height={on(K.nearCurb) - on(K.farCurb)} fill="#3A3D4A" />
      {Array.from({length: 12}, (_, i) => (
        <rect key={i} x={-900 + i * M(6, K.lane)} y={on(K.lane) - 3} width={M(3, K.lane)} height={6} fill="#E8E2D6" opacity={0.55} />
      ))}
      <rect x={-900} y={on(K.nearCurb)} width={3800} height={10} fill="#B8B0A4" stroke={INK} strokeWidth={2} />
      {slab(K.nearCurb + 0.04, 1.6, '#8C8A90', '#77757D')}
    </g>
  );
};

registerSet('street', {
  layers: (c) => [
    {depth: 0.15, node: <Sky frame={c.frame} top="#02040C" mid="#0B1233" bottom="#1E2A55" seed={7} />},
    {depth: 0.45, node: <Terraces base={on(K.back)} sc={M(K.back)} seed={91} power={1} snow={0} frame={c.frame} shade={0.45} x0={-900} x1={2900} />},
    {
      depth: 1,
      node: (
        <g>
          <Terraces base={on(K.house)} sc={M(K.house)} seed={17} power={1} snow={0} frame={c.frame} low />
          <StreetFloor snow={false} />
          {LAMPS.map((x) => (
            <Lamp key={x} x={x} base={on(K.lamp)} sc={M(K.lamp)} on frame={c.frame} />
          ))}
          <Car x={1240} base={on(K.farCar)} sc={M(K.farCar)} col="#3E7CB1" snow={0} flip />
          <Car x={-180} base={on(K.nearCar)} sc={M(K.nearCar)} col="#C2464F" snow={0} lights />
          <Car x={2120} base={on(K.nearCar)} sc={M(K.nearCar)} col="#E9C46A" snow={0} flip />
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
  light: () => (
    <g>
      {LAMPS.map((x) => {
        const [hx, hy] = lampHead(x, on(K.lamp), M(K.lamp));
        return (
          <g key={x}>
            <Glow x={hx} y={hy} r={110} color="#FFE6A8" opacity={0.6} />
            <Glow x={hx} y={on(K.lamp) + 20} r={200} color="#FFD58A" opacity={0.26} rx={320} />
          </g>
        );
      })}
    </g>
  ),
  grade: () => (
    <g>
      <Grade color="#2A3A8A" amount={0.32} />
      <Vignette amount={0.5} />
    </g>
  ),
});

// ── SNOW STREET ─────────────────────────────────────────────────────────────────────────────────
/** The metro entrance to real size: 1 m railings, a 3 m sign column, steps going down; the warm grate beside it. */
const MetroEntrance: React.FC<{x: number; base: number; grate: number; frame: number}> = ({x, base, grate, frame}) => (
  <g>
    <g transform={`translate(${x},${base}) scale(1.85)`}>
      <rect x={-180} y={-20} width={360} height={60} fill="#20232E" />
      {Array.from({length: 5}, (_, k) => (
        <rect key={k} x={-170 + k * 8} y={-10 + k * 10} width={340 - k * 16} height={8} fill="#3A3D4A" />
      ))}
      {[-1, 1].map((k) => (
        <g key={k}>
          <path d={`M${k * 180},0 L${k * 180},-110 L${k * 40},-110`} stroke="#3C8D6E" strokeWidth={8} fill="none" />
          {Array.from({length: 6}, (_, j) => (
            <path key={j} d={`M${k * (180 - j * 24)},-110 L${k * (180 - j * 24)},0`} stroke="#3C8D6E" strokeWidth={4} />
          ))}
          <ellipse cx={k * 110} cy={-112} rx={78} ry={6} fill="#EEF4FB" />
        </g>
      ))}
      <path d="M0,-110 L0,-300" stroke="#2A3142" strokeWidth={10} />
      <circle cx={0} cy={-330} r={44} fill="#D9443A" stroke={INK} strokeWidth={4} />
      <text x={0} y={-316} textAnchor="middle" fontFamily="'Unbounded', sans-serif" fontWeight={800} fontSize={42} fill="#FFFFFF">
        M
      </text>
      <ellipse cx={0} cy={-372} rx={38} ry={9} fill="#EEF4FB" />
      <rect x={-70} y={-150} width={140} height={34} rx={4} fill="#1E2A44" stroke={INK} strokeWidth={3} />
      <text x={0} y={-124} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={24} letterSpacing={3} fill="#FFFFFF">
        METRO
      </text>
    </g>
    {/* the warm grate: 1.2 m of iron bars breathing tunnel air */}
    <g transform={`translate(${grate},${base})`}>
      <ellipse cx={0} cy={10} rx={M(1.1)} ry={22} fill="#3A3D4A" opacity={0.8} />
      <rect x={-M(0.6)} y={-6} width={M(1.2)} height={18} rx={3} fill="#2A2E3A" stroke={INK} strokeWidth={3} />
      {Array.from({length: 11}, (_, k) => (
        <path key={k} d={`M${-M(0.6) + 10 + k * ((M(1.2) - 20) / 10)},${-4} L${-M(0.6) + 10 + k * ((M(1.2) - 20) / 10)},${10}`} stroke="#5A5E6A" strokeWidth={4} />
      ))}
    </g>
    <Smoke frame={frame} x={grate - 120} y={base - 620} w={240} h={620} color="#C8D2E0" opacity={0.35} seed={4} rise={0.9} />
  </g>
);

/** Your building's street door, at the cast's plane: a 1 m × 2.1 m door in a brick facade, banging in the wind. */
const StreetDoor: React.FC<{frame: number}> = ({frame}) => {
  const top = 960 - M(2.1);
  const x0 = 520;
  const w = M(1.0);
  return (
    <g>
      <rect x={-900} y={-400} width={x0 + w + M(2.2) + 900} height={1360} fill="#7A3E3A" stroke={INK} strokeWidth={5} />
      {Array.from({length: 40}, (_, k) => (
        <path key={k} d={`M-900,${-380 + k * M(0.3)} L${x0 + w + M(2.2)},${-380 + k * M(0.3)}`} stroke="#00000018" strokeWidth={3} />
      ))}
      {/* the corner of the building, then the street beyond */}
      <rect x={x0 + w + M(2.2) - 24} y={-400} width={24} height={1360} fill="#E9DCC6" opacity={0.6} />
      {/* ground-floor window, sill at 0.9 m */}
      <rect x={x0 + w + M(0.5)} y={960 - M(0.9) - M(1.5)} width={M(1.1)} height={M(1.5)} fill="#141826" stroke={INK} strokeWidth={5} />
      <path d={`M${x0 + w + M(1.05)},${960 - M(2.4)} L${x0 + w + M(1.05)},${960 - M(0.9)}`} stroke="#E9DCC6" strokeWidth={8} />
      <rect x={x0 + w + M(0.42)} y={960 - M(0.9)} width={M(1.26)} height={14} fill="#E9DCC6" stroke={INK} strokeWidth={3} />
      <rect x={x0 + w + M(0.4)} y={960 - M(0.9) - 16} width={M(1.3)} height={18} rx={6} fill="#EEF4FB" />
      {/* door: frame, lit hallway, the leaf swinging */}
      <rect x={x0 - 18} y={top - 30} width={w + 36} height={M(2.1) + 30} fill="#E9DCC6" stroke={INK} strokeWidth={5} />
      <rect x={x0} y={top} width={w} height={M(2.1)} fill="#0A0C16" stroke={INK} strokeWidth={4} />
      <rect x={x0 + w * 0.4} y={top} width={w * 0.6} height={M(2.1)} fill="#FFB867" opacity={0.25} />
      <g transform={`translate(${x0},${top}) skewY(${-8 + Math.sin(frame * 0.5) * 4})`}>
        <rect x={-w * 0.72} y={0} width={w * 0.72} height={M(2.1)} fill="#2E3A5C" stroke={INK} strokeWidth={5} />
        <rect x={-w * 0.62} y={M(0.25)} width={w * 0.52} height={M(0.7)} rx={4} fill="#1C2238" stroke={INK} strokeWidth={3} />
        <circle cx={-w * 0.62} cy={M(1.0)} r={7} fill="#E8C27A" />
      </g>
      <text x={x0 + w / 2} y={top - 44} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={40} fill="#E9DCC6">
        14
      </text>
      <rect x={x0 - 30} y={952} width={w + 60} height={16} fill="#B8B0A4" stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Drifts: React.FC<{base: number; seed: number; amp?: number}> = ({base, seed, amp = 50}) => {
  const r = rand(seed);
  const pts = Array.from({length: 30}, (_, i) => [-800 + i * 130, base - amp * 0.4 - r() * amp]);
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
      {depth: 0.45, node: <Terraces base={on(K.back)} sc={M(K.back)} seed={91} power={0} snow={1} frame={c.frame} shade={0.55} x0={-900} x1={2900} />},
      {
        depth: 1,
        node: (
          <g>
            <Terraces base={on(K.house)} sc={M(K.house)} seed={17} power={0} snow={1} frame={c.frame} low />
            <StreetFloor snow />
            {LAMPS.map((x) => (
              <Lamp key={x} x={x} base={on(K.lamp)} sc={M(K.lamp)} on={false} frame={c.frame} snow={1} />
            ))}
            <Car x={1500} base={on(K.farCar)} sc={M(K.farCar)} col="#5E5A6E" snow={1.3} />
            <Car x={300} base={on(K.nearCar)} sc={M(K.nearCar)} col="#C2464F" snow={1.2} />
            {c.v !== 'vent' && <Car x={1320} base={on(K.nearCar)} sc={M(K.nearCar)} col="#5E8C7A" snow={1.3} flip />}
            <Drifts base={on(K.nearCurb) + 6} seed={5} amp={M(0.35)} />
            {c.v === 'vent' && <MetroEntrance x={1900} base={950} grate={1460} frame={c.frame} />}
            {c.v === 'door' && <StreetDoor frame={c.frame} />}
            {c.v !== 'door' && <PawPrints from={c.v === 'vent' ? 700 : 1500} to={c.v === 'vent' ? 1420 : 2400} base={990} />}
            {c.p.woof !== undefined && <Woof t={c.t - c.at(c.p.woof, 0.35)} x={985} y={610} />}
          </g>
        ),
      },
      {depth: 1.1, front: true, node: <Snow frame={c.frame} density={1.2} wind={1 + wind * 4} seed={3} opacity={0.9} />},
      {depth: 1.5, blur: 5, front: true, node: <Snow frame={c.frame} density={0.3} wind={2 + wind * 6} seed={8} opacity={0.8} />},
    ];
  },
  light: (c) => <g>{c.v === 'vent' && <Glow x={1460} y={940} r={260} color="#FFB867" opacity={0.3} rx={340} />}</g>,
  grade: () => (
    <g>
      <Grade color="#2A3A8A" amount={0.4} />
      <Vignette amount={0.6} />
    </g>
  ),
  handheld: 0.6,
});

/** The comic sound-word for a bark far off in the dark: pops in with overshoot, wobbles, fades. */
const Woof: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  if (t < 0 || t > 1.6) return null;
  const pop = t < 0.12 ? 0.3 + (t / 0.12) * 0.9 : t < 0.22 ? 1.2 - ((t - 0.12) / 0.1) * 0.2 : 1;
  const fade = Math.min(1, Math.max(0, (1.6 - t) / 0.4));
  return (
    <g transform={`translate(${x},${y}) rotate(${-8 + Math.sin(t * 18) * 2}) scale(${pop})`} opacity={fade}>
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M${-70},${k * 16} L${-100},${k * 26}`} stroke="#FFF6E0" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      ))}
      <text textAnchor="middle" dominantBaseline="central" fontFamily="'Unbounded', sans-serif" fontWeight={900} fontSize={46} fill="#FFE08A" stroke="#0B1026" strokeWidth={7} paintOrder="stroke" letterSpacing={2}>
        WOOF!
      </text>
    </g>
  );
};

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

/** A bus shelter to real size (metres × sc): 3.2 m wide, 2.4 m tall, glass back, buried to the bench in snow. */
const BusShelter: React.FC<{x: number; base: number; sc: number}> = ({x, base, sc}) => {
  const lw = Math.max(1.5, sc * 0.02) / sc;
  return (
    <g transform={`translate(${x},${base}) scale(${sc})`}>
      <rect x={-1.55} y={-2.3} width={3.1} height={2.3} fill="#9FC7E8" opacity={0.18} stroke="#2A3142" strokeWidth={0.08} />
      {[-1.55, 1.55].map((px) => (
        <rect key={px} x={px - 0.05} y={-2.4} width={0.1} height={2.4} fill="#2A3142" stroke={INK} strokeWidth={lw} />
      ))}
      <rect x={-1.7} y={-2.52} width={3.4} height={0.16} fill="#2A3142" stroke={INK} strokeWidth={lw} />
      <path d="M-1.8,-2.5 Q0,-2.95 1.8,-2.5 L1.8,-2.56 L-1.8,-2.56 Z" fill="#EEF4FB" stroke={INK} strokeWidth={lw * 0.8} />
      <rect x={-1.2} y={-0.5} width={2.4} height={0.08} fill="#5E5A6E" />
      {/* bus-stop sign */}
      <rect x={1.9} y={-2.6} width={0.07} height={2.6} fill="#2A3142" />
      <rect x={1.62} y={-3.0} width={0.64} height={0.5} rx={0.06} fill="#3E7CB1" stroke={INK} strokeWidth={lw} />
      <text x={1.94} y={-2.68} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={0.22} fill="#FFFFFF">
        BUS
      </text>
      <ellipse cx={1.94} cy={-3.02} rx={0.34} ry={0.06} fill="#EEF4FB" />
      <path d="M-2.2,0.1 Q-1.6,-0.7 -0.4,-0.62 Q0.8,-0.9 1.6,-0.5 Q2.2,-0.3 2.5,0.1 Z" fill="#E6EEF8" stroke={INK} strokeWidth={lw * 0.8} />
    </g>
  );
};

/** A bronze statue on a 1.8 m plinth (metres × sc): a figure pointing at the sky, capped in snow. */
const Statue: React.FC<{x: number; base: number; sc: number}> = ({x, base, sc}) => {
  const lw = Math.max(1.5, sc * 0.02) / sc;
  return (
    <g transform={`translate(${x},${base}) scale(${sc})`} stroke={INK} strokeWidth={lw} strokeLinejoin="round">
      <rect x={-0.8} y={-0.3} width={1.6} height={0.3} fill="#4E4A5E" />
      <rect x={-0.65} y={-1.8} width={1.3} height={1.5} fill="#5E5A6E" />
      <rect x={-0.75} y={-1.92} width={1.5} height={0.14} fill="#4E4A5E" />
      <path d="M-0.28,-1.92 L-0.22,-3.1 Q0,-3.35 0.22,-3.1 L0.3,-1.92 Z" fill="#6F6A80" />
      <path d="M0.16,-3.0 L0.62,-3.75" strokeWidth={0.12} stroke="#6F6A80" strokeLinecap="round" />
      <circle cx={0} cy={-3.45} r={0.17} fill="#6F6A80" />
      <ellipse cx={0} cy={-3.6} rx={0.19} ry={0.06} fill="#EEF4FB" />
      <ellipse cx={0} cy={-1.94} rx={0.8} ry={0.07} fill="#EEF4FB" />
      <path d="M-1.1,0.05 Q-0.6,-0.5 0,-0.42 Q0.7,-0.55 1.2,0.05 Z" fill="#E6EEF8" />
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
            {/* a half-buried bus shelter (2.4 m tall, 3.2 m wide) and a statue on its plinth, a little further back */}
            <BusShelter x={300} base={928} sc={M(0.85)} />
            <Statue x={1660} base={912} sc={M(0.62)} />
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

export {Sky, Terraces, Drifts, FrozenSkyline, Lamp, Car, TorchBeam, BusShelter};
