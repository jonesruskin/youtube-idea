import React from 'react';
import {CityBlocks} from '../sun01/parts';
import {Glow, Grade, INK, registerSet, Vignette, type SetCtx} from '../sun/stage';
import {Clock, Meteors, NightSky, PH_PATHS, RadioSet, rnd, StringLights} from './parts';

/**
 * File 002 sets (all at natural scale, 1 m ≈ 171 px like File 001; floor lines noted per set).
 *   lolaflat   Lola's small Manila flat: door, TV, table, louvre window, radio desk under a sea chart. floor 930.
 *              v: '' (lamps on) | 'cold' (frost, coats) | 'dawn' (5:59 a.m.: only the desk lamp and the radio)
 *   basement   the building's car park, Day 30+: pillars, parked cars, families on mats, Lola's radio table. floor 940.
 *   manilaroof the flat roof: blue water tanks, a washing line, the antenna mast (a Yagi aimed east), the city. floor 900.
 *              v: '' | 'cold' | 'perseids' | 'summer'
 *   bridge     the Amihan's bridge: window band, radar, GPS (NO FIX), helm, VHF handset, chart table. floor 930.
 *              v: '' | 'storm' | 'drift'
 *   deck       the bridge wing at night under the stars, no horizon. floor 930. v: '' | 'rescued'
 *   coastguard the operations room: chart of the Philippine Sea, radio consoles. floor 930.
 *   pier       the coast-guard pier under floodlights, the white ship alongside. floor 940.
 */
const W0 = -400;
const W1 = 2320;

// ── LOLA'S FLAT ─────────────────────────────────────────────────────────────────────────────────
const Louvres: React.FC<{x: number; y: number; w: number; h: number; frost: number; frame: number}> = ({x, y, w, h, frost, frame}) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} fill="#8A6A4A" stroke={INK} strokeWidth={5} />
    <rect x={x} y={y} width={w} height={h} fill="#0A1030" />
    {/* the city outside, lit windows in the dark */}
    <g opacity={0.9}>
      {Array.from({length: 18}, (_, i) => {
        const r = rnd(i + 3);
        const bx = x + r() * w;
        const bh = 60 + r() * 140;
        return <rect key={i} x={bx - 18} y={y + h - bh} width={36} height={bh} fill="#141C3E" />;
      })}
      {Array.from({length: 40}, (_, i) => {
        const r = rnd(i + 40);
        return <rect key={i} x={x + r() * w} y={y + h - 20 - r() * 150} width={6} height={8} fill="#FFD27A" opacity={0.5 + 0.4 * Math.sin(frame * 0.02 + i)} />;
      })}
      {Array.from({length: 26}, (_, i) => {
        const r = rnd(i + 90);
        return <circle key={i} cx={x + r() * w} cy={y + r() * h * 0.5} r={1.6} fill="#FFFFFF" opacity={0.7} />;
      })}
    </g>
    {/* glass louvre blades */}
    {Array.from({length: Math.floor(h / 34)}, (_, i) => (
      <g key={i}>
        <rect x={x} y={y + i * 34 + 6} width={w} height={22} fill="#9FC8E8" opacity={0.16} />
        <line x1={x} y1={y + i * 34 + 28} x2={x + w} y2={y + i * 34 + 28} stroke="#C9D8E8" strokeWidth={2} opacity={0.5} />
      </g>
    ))}
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#6E5236" strokeWidth={6} />
    {frost > 0 && (
      <g opacity={frost}>
        <path d={`M${x},${y} L${x + 90},${y} Q${x + 30},${y + 40} ${x},${y + 110} Z`} fill="#E8F4FF" opacity={0.7} />
        <path d={`M${x + w},${y + h} L${x + w - 110},${y + h} Q${x + w - 30},${y + h - 50} ${x + w},${y + h - 120} Z`} fill="#E8F4FF" opacity={0.7} />
      </g>
    )}
  </g>
);

const SeaChart: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#CFE3EE" stroke={INK} strokeWidth={5} />
    {Array.from({length: 8}, (_, i) => (
      <line key={`v${i}`} x1={x + (w / 8) * i} y1={y} x2={x + (w / 8) * i} y2={y + h} stroke="#7FA6C0" strokeWidth={1.5} />
    ))}
    {Array.from({length: 5}, (_, i) => (
      <line key={`h${i}`} x1={x} y1={y + (h / 5) * i} x2={x + w} y2={y + (h / 5) * i} stroke="#7FA6C0" strokeWidth={1.5} />
    ))}
    <g transform={`translate(${x - w * 0.05},${y + h * 0.05}) scale(${w * 0.55},${h * 0.9})`}>
      {PH_PATHS.map((d, i) => (
        <path key={i} d={d} fill="#E9D7A8" stroke="#6E5236" strokeWidth={0.004} />
      ))}
    </g>
    {/* the Amihan's route: a red thread to a pin out in the ocean */}
    <path d={`M${x + w * 0.95},${y + h * 0.42} L${x + w * 0.62},${y + h * 0.38}`} stroke="#C2464F" strokeWidth={3} strokeDasharray="8 6" />
    <circle cx={x + w * 0.62} cy={y + h * 0.38} r={8} fill="#C2464F" stroke={INK} strokeWidth={2} />
    <circle cx={x + w * 0.3} cy={y + h * 0.36} r={6} fill="#3E7CB1" stroke={INK} strokeWidth={2} />
  </g>
);

const PhotoFrame: React.FC<{x: number; y: number; kind: 'rosa' | 'lola'}> = ({x, y, kind}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={110} height={130} fill="#6E5236" stroke={INK} strokeWidth={4} />
    <rect x={10} y={10} width={90} height={110} fill={kind === 'rosa' ? '#9FC8E8' : '#D8C8A8'} />
    {kind === 'rosa' ? (
      <g>
        {/* Rosa in her white officer's shirt, a ship behind her */}
        <path d="M14,92 L96,92 L90,104 L22,104 Z" fill="#2A3A5C" />
        <rect x={40} y={78} width={30} height={14} fill="#F4F1EA" />
        <circle cx={55} cy={58} r={16} fill="#9A6440" />
        <path d="M39,56 Q55,30 71,56" fill="#17120F" />
        <path d="M30,120 L30,98 Q55,82 80,98 L80,120 Z" fill="#F4F1EA" />
        <rect x={32} y={100} width={12} height={4} fill="#D9C38A" />
        <rect x={66} y={100} width={12} height={4} fill="#D9C38A" />
      </g>
    ) : (
      <g>
        {/* young Lola at the coast-guard radio, headphones on, sepia */}
        <rect x={14} y={70} width={82} height={40} fill="#8A7A5A" />
        <circle cx={44} cy={54} r={15} fill="#A8865E" />
        <path d="M28,52 Q44,30 60,52" stroke="#3A2A1A" strokeWidth={5} fill="none" />
        <circle cx={29} cy={56} r={5} fill="#3A2A1A" />
        <circle cx={59} cy={56} r={5} fill="#3A2A1A" />
        <path d="M24,120 L28,82 Q44,70 60,82 L64,120 Z" fill="#B8A07A" />
        <rect x={66} y={74} width={26} height={18} fill="#5A4A3A" />
      </g>
    )}
  </g>
);

registerSet('lolaflat', {
  layers: (c) => {
    const dawn = c.v === 'dawn';
    const cold = c.v === 'cold' || dawn;
    const radioOn = !!c.p.radioOn || (c.p.radioOnAt !== undefined && c.t >= c.at(c.p.radioOnAt, 0));
    const tvOn = !!c.p.tvOn && !(c.p.tvOffAt !== undefined && c.t >= c.at(c.p.tvOffAt, 0));
    const ping = c.p.chirpAt !== undefined ? Math.max(0, 1 - Math.abs(c.t - c.at(c.p.chirpAt, 0)) * 4) : 0;
    const shake = c.p.tvLoud ? Math.sin(c.frame * 1.7) * 3 : 0;
    return [
      {
        depth: 1,
        node: (
          <g>
            {/* walls + skirting + tiled floor */}
            <rect x={W0} y={-200} width={W1 - W0} height={1130} fill={dawn ? '#5A4E44' : '#E9D8BC'} />
            <rect x={W0} y={-200} width={W1 - W0} height={140} fill={dawn ? '#4A4038' : '#D8C4A2'} />
            {Array.from({length: 40}, (_, i) => (
              <path key={i} d={`M${W0 + i * 70},-60 l35,40 l35,-40`} stroke={dawn ? '#4A4038' : '#D2BE9A'} strokeWidth={4} fill="none" />
            ))}
            <rect x={W0} y={900} width={W1 - W0} height={30} fill="#8A6A4A" />
            {Array.from({length: 30}, (_, i) => (
              <g key={i}>
                <rect x={W0 + i * 96} y={930} width={96} height={400} fill={i % 2 ? (dawn ? '#5E5246' : '#C9B79A') : dawn ? '#6A5C4E' : '#D8C8AA'} />
              </g>
            ))}
            {/* door (left) */}
            <rect x={60} y={420} width={180} height={480} fill="#7A5236" stroke={INK} strokeWidth={5} />
            {c.p.doorOpen && <path d="M240,420 L300,440 L300,880 L240,900 Z" fill="#5E3E28" stroke={INK} strokeWidth={4} />}
            <circle cx={215} cy={670} r={9} fill="#D9A441" />
            {/* TV on a cabinet */}
            <g transform={`translate(${shake},0)`}>
              <rect x={330} y={760} width={240} height={170} fill="#6E5236" stroke={INK} strokeWidth={5} />
              <rect x={350} y={600} width={200} height={150} rx={8} fill="#1A1A1A" stroke={INK} strokeWidth={5} />
              <rect x={362} y={612} width={176} height={126} fill={tvOn ? '#2A4A8A' : '#0E0E12'} />
              {tvOn && (
                <g>
                  <rect x={362} y={700} width={176} height={22} fill="#C2464F" />
                  <circle cx={450} cy={660} r={26} fill="#FFB547" opacity={0.6} />
                  <circle cx={450} cy={660} r={18} fill="#0A0C18" stroke="#FFB547" strokeWidth={3} />
                </g>
              )}
            </g>
            {/* family photos and the clock */}
            <PhotoFrame x={1305} y={300} kind="rosa" />
            <PhotoFrame x={1305} y={450} kind="lola" />
            <Clock x={960} y={300} time={c.p.clock ?? '2:20'} />
            {/* louvre window */}
            <Louvres x={1040} y={330} w={230} h={330} frost={cold ? 1 : 0} frame={c.frame} />
            {/* kitchen table (the chairs are drawn under whoever sits) */}
            <rect x={740} y={760} width={240} height={18} rx={4} fill="#8A6A4A" stroke={INK} strokeWidth={5} />
            <path d="M760,778 L760,930 M960,778 L960,930" stroke="#6E5236" strokeWidth={10} />
            <rect x={840} y={724} width={46} height={36} rx={6} fill="#E9E4DA" stroke={INK} strokeWidth={3} />
            {c.p.tableKey && (
              <g transform="translate(830,752)">
                <rect x={0} y={-8} width={70} height={12} rx={3} fill="#2A2A2A" stroke={INK} strokeWidth={3} />
                <path d="M8,-12 L62,-22" stroke="#C9963A" strokeWidth={7} strokeLinecap="round" />
              </g>
            )}
            {/* radio desk under the sea chart */}
            <SeaChart x={1450} y={240} w={380} h={260} />
            <rect x={1440} y={740} width={420} height={20} rx={4} fill="#6E5236" stroke={INK} strokeWidth={5} />
            <path d="M1460,760 L1460,930 M1840,760 L1840,930" stroke="#5E4430" strokeWidth={12} />
            <RadioSet x={1480} y={740} on={radioOn} meter={c.p.meter ?? 0.55} ping={ping} frame={c.frame} mic={!(c.p.items ?? []).some((i: {prop: string}) => i.prop === 'mic')} />
            {/* desk lamp */}
            <g transform="translate(1800,740)">
              <rect x={-30} y={-8} width={60} height={10} fill="#2A2A2A" />
              <path d="M0,-8 L-30,-110 L20,-150" stroke="#2A2A2A" strokeWidth={8} fill="none" />
              <path d="M10,-160 L50,-130 L20,-110 Z" fill="#3E7CB1" stroke={INK} strokeWidth={3} />
            </g>
            {/* electric fan in the corner (summer) or a folded blanket (cold) */}
            {cold ? (
              <rect x={590} y={880} width={120} height={50} rx={14} fill="#9E3F5E" stroke={INK} strokeWidth={4} />
            ) : (
              <g transform="translate(650,930)">
                <path d="M0,0 L0,-200" stroke="#3A3A44" strokeWidth={8} />
                <circle cx={0} cy={-220} r={50} fill="#E9E4DA" stroke={INK} strokeWidth={4} />
                <path d={`M0,-220 l${Math.cos(c.frame * 0.6) * 40},${Math.sin(c.frame * 0.6) * 40}`} stroke="#9FC8E8" strokeWidth={10} />
              </g>
            )}
          </g>
        ),
      },
    ];
  },
  light: (c) => {
    const dawn = c.v === 'dawn';
    const radioOn = !!c.p.radioOn || (c.p.radioOnAt !== undefined && c.t >= c.at(c.p.radioOnAt, 0));
    return (
      <g>
        {dawn ? <Glow x={1780} y={640} r={360} color="#FFC77A" opacity={0.5} /> : <Glow x={960} y={120} r={900} color="#FFE7C2" opacity={0.18} />}
        {radioOn && <Glow x={1600} y={620} r={240} color="#FFB547" opacity={0.25} />}
      </g>
    );
  },
  grade: (c) => (
    <g>
      <Grade color={c.v === 'dawn' ? '#2A2050' : c.v === 'cold' ? '#C8D8F0' : '#FFE8C8'} amount={c.v === 'dawn' ? 0.42 : 0.1} />
      <Vignette amount={c.v === 'dawn' ? 0.7 : 0.45} />
    </g>
  ),
});

// ── BASEMENT CAR PARK ───────────────────────────────────────────────────────────────────────────
const Car: React.FC<{x: number; col: string; s?: number}> = ({x, col, s = 1}) => (
  <g transform={`translate(${x},0) scale(${s})`}>
    <path d="M-170,0 L-170,-60 Q-150,-70 -110,-72 L-70,-120 L80,-120 L120,-72 Q160,-70 170,-55 L170,0 Z" fill={col} stroke={INK} strokeWidth={5} />
    <path d="M-60,-112 L-30,-112 L-30,-76 L-95,-76 Z M-20,-112 L70,-112 L105,-76 L-20,-76 Z" fill="#2A3142" />
    <circle cx={-105} cy={0} r={30} fill="#1A1A1A" stroke={INK} strokeWidth={4} />
    <circle cx={105} cy={0} r={30} fill="#1A1A1A" stroke={INK} strokeWidth={4} />
  </g>
);
const Mat: React.FC<{x: number; w: number; col: string}> = ({x, w, col}) => <rect x={x} y={930} width={w} height={22} rx={6} fill={col} stroke={INK} strokeWidth={3} />;

registerSet('basement', {
  layers: (c) => {
    const dawn = c.v === 'dawn';
    const radioOn = !!c.p.radioOn;
    const ping = c.p.chirpAt !== undefined ? Math.max(0, 1 - Math.abs(c.t - c.at(c.p.chirpAt, 0)) * 4) : 0;
    return [
      {
        depth: 0.75,
        node: (
          <g>
            <rect x={W0 - 300} y={-300} width={W1 - W0 + 600} height={1400} fill={dawn ? '#3A3E48' : '#6A6E78'} />
            {/* back row of parked cars and a yellow kerb */}
            <g transform="translate(0,900)">
              <Car x={260} col="#8E2A2A" />
              <Car x={760} col="#3E5C8A" />
              <Car x={1320} col="#C9C3B8" />
              <Car x={1860} col="#2A6A5A" />
            </g>
            <rect x={W0 - 300} y={900} width={W1 - W0 + 600} height={14} fill="#D9A441" />
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {/* ceiling slab, pipes, string lights */}
            <rect x={W0} y={-200} width={W1 - W0} height={300} fill={dawn ? '#2A2E36' : '#4A4E58'} />
            <path d={`M${W0},120 L${W1},120`} stroke="#8A6A4A" strokeWidth={16} />
            <path d={`M${W0},150 L${W1},150`} stroke="#5A6A7A" strokeWidth={10} />
            <StringLights x0={-100} x1={900} y={175} frame={c.frame} dim={dawn ? 0.5 : 1} />
            <StringLights x0={900} x1={2000} y={175} frame={c.frame} dim={dawn ? 0.5 : 1} />
            {/* floor */}
            <rect x={W0} y={940} width={W1 - W0} height={400} fill={dawn ? '#3E424C' : '#7A7E88'} />
            <path d={`M${W0},1040 L${W1},1040`} stroke="#E9E4DA" strokeWidth={6} strokeDasharray="60 40" opacity={0.5} />
            {/* pillars with level signs */}
            {[200, 900, 1620].map((px, i) => (
              <g key={px}>
                <rect x={px - 45} y={100} width={90} height={840} fill={dawn ? '#4A4E58' : '#9A9EA8'} stroke={INK} strokeWidth={5} />
                <rect x={px - 30} y={420} width={60} height={44} fill="#D9A441" stroke={INK} strokeWidth={3} />
                <text x={px} y={452} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={26} fill={INK}>
                  B1-{i + 1}
                </text>
              </g>
            ))}
            {/* stairwell door */}
            <rect x={-260} y={560} width={150} height={380} fill="#5A6A7A" stroke={INK} strokeWidth={5} />
            <text x={-185} y={540} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={28} fill="#E9E4DA">
              STAIRS
            </text>
            {/* families' mats and bedding */}
            <Mat x={300} w={260} col="#C2577A" />
            <Mat x={580} w={240} col="#3E7CB1" />
            <Mat x={-120} w={220} col="#D9A441" />
            {/* rice cooker, steaming */}
            <g transform="translate(470,930)">
              <rect x={-34} y={-50} width={68} height={50} rx={14} fill="#E9E4DA" stroke={INK} strokeWidth={4} />
              <rect x={-30} y={-60} width={60} height={14} rx={7} fill="#C9C3B8" stroke={INK} strokeWidth={3} />
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M${-10 + k * 10},-66 q${8 * Math.sin(c.frame * 0.08 + k)},-20 0,-40`} stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.35} />
              ))}
            </g>
            {/* Lola's radio table by pillar B1-3, the cable climbing the pillar to the ceiling */}
            <path d="M1600,700 L1600,100" stroke="#1E2128" strokeWidth={8} />
            <path d="M1540,720 Q1580,700 1600,700" stroke="#1E2128" strokeWidth={8} fill="none" />
            <rect x={1290} y={760} width={290} height={18} rx={4} fill="#6E5236" stroke={INK} strokeWidth={5} />
            <path d="M1305,778 L1305,940 M1565,778 L1565,940" stroke="#5E4430" strokeWidth={12} />
            <RadioSet x={1300} y={760} on={radioOn} meter={0.5} ping={ping} frame={c.frame} s={0.82} />
            <path d="M1300,860 L1300,940" stroke="#1E2128" strokeWidth={5} />
          </g>
        ),
      },
    ];
  },
  light: (c) => (
    <g>
      <Glow x={960} y={300} r={1000} color="#FFD9A0" opacity={c.v === 'dawn' ? 0.08 : 0.16} />
      {c.p.radioOn && <Glow x={1420} y={640} r={260} color="#FFB547" opacity={0.28} />}
    </g>
  ),
  grade: (c) => (
    <g>
      <Grade color={c.v === 'dawn' ? '#2A2850' : '#E8D8C0'} amount={c.v === 'dawn' ? 0.38 : 0.12} />
      <Vignette amount={0.6} />
    </g>
  ),
});

// ── MANILA ROOF ─────────────────────────────────────────────────────────────────────────────────
const Yagi: React.FC<{x: number; base: number}> = ({x, base}) => (
  <g transform={`translate(${x},${base})`}>
    <path d="M0,0 L0,-560" stroke="#3A3F52" strokeWidth={12} />
    <path d="M-50,0 L0,-180 L50,0" stroke="#3A3F52" strokeWidth={6} fill="none" />
    {/* boom pointing east (right), with elements */}
    <path d="M-120,-560 L260,-560" stroke="#8A8F9C" strokeWidth={8} />
    {[-110, -60, 0, 50, 100, 150, 200, 250].map((ex, i) => (
      <path key={ex} d={`M${ex},${-560 - (70 - i * 4)} L${ex},${-560 + (70 - i * 4)}`} stroke="#C9CED6" strokeWidth={5} />
    ))}
    <path d="M0,-560 Q-40,-300 -10,0" stroke="#1E2128" strokeWidth={5} fill="none" />
  </g>
);
const WaterTank: React.FC<{x: number; base: number; frost: number}> = ({x, base, frost}) => (
  <g transform={`translate(${x},${base})`}>
    <rect x={-80} y={-40} width={160} height={40} fill="#5A5A64" stroke={INK} strokeWidth={4} />
    <path d="M-70,-40 L-70,-230 Q0,-260 70,-230 L70,-40 Z" fill="#2E6EB5" stroke={INK} strokeWidth={5} />
    {[-180, -130, -80].map((y) => (
      <path key={y} d={`M-70,${y} Q0,${y + 14} 70,${y}`} stroke="#22548A" strokeWidth={4} fill="none" />
    ))}
    <ellipse cx={0} cy={-240} rx={46} ry={12} fill="#22548A" stroke={INK} strokeWidth={4} />
    {frost > 0 && <path d="M-70,-230 Q0,-262 70,-230 Q0,-246 -70,-230 Z" fill="#EEF4FB" opacity={frost} />}
  </g>
);

registerSet('manilaroof', {
  layers: (c) => {
    const cold = c.v === 'cold' || c.v === 'perseids';
    const summer = c.v === 'summer';
    const rate = (c.p.meteors ?? 4) / 10;
    return [
      {
        depth: 0.05,
        node: (
          <g>
            <NightSky frame={c.frame} seed={23} top={summer ? '#050A22' : '#01020A'} bottom={summer ? '#24305E' : '#141C42'} count={summer ? 380 : 620} />
            <Meteors frame={c.frame} rate={rate} seed={c.v === 'perseids' ? 9 : 4} radiant={c.v === 'perseids' ? [-200, -200] : undefined} />
          </g>
        ),
      },
      {depth: 0.3, node: <CityBlocks seed={73} base={960} color={summer ? '#1C2448' : '#121834'} frame={c.frame} lights={0.65} minH={160} maxH={460} />},
      {depth: 0.55, node: <CityBlocks seed={81} base={1000} color={summer ? '#232C52' : '#19203E'} frame={c.frame} lights={0.55} minH={90} maxH={280} />},
      {
        depth: 1,
        node: (
          <g>
            <WaterTank x={170} base={900} frost={cold ? 1 : 0} />
            <WaterTank x={350} base={900} frost={cold ? 1 : 0} />
            {/* washing line */}
            <path d="M460,640 Q640,690 820,640" stroke="#C9CED6" strokeWidth={3} fill="none" />
            <path d="M460,640 L460,900 M820,640 L820,900" stroke="#5A5A64" strokeWidth={8} />
            {!cold &&
              [520, 600, 700].map((cx, i) => <path key={cx} d={`M${cx - 26},${660 + i * 2} l52,0 l-6,${70 - i * 10} l-40,0 Z`} fill={['#E07A5F', '#F2C94C', '#3E7CB1'][i]} stroke={INK} strokeWidth={3} />)}
            <Yagi x={1520} base={900} />
            {/* the dead satellite dish */}
            <g transform="translate(1800,900)">
              <path d="M0,0 L0,-120" stroke="#5A5A64" strokeWidth={8} />
              <path d="M-60,-170 Q0,-110 60,-170" fill="#C9CED6" stroke={INK} strokeWidth={4} transform="rotate(-25,0,-140)" />
            </g>
            {/* pots of plants */}
            {[1160, 1240].map((px) => (
              <g key={px} transform={`translate(${px},900)`}>
                <path d="M-30,0 L-36,-50 L36,-50 L30,0 Z" fill="#B5643A" stroke={INK} strokeWidth={4} />
                <path d="M0,-50 q-30,-40 -10,-80 M0,-50 q20,-50 30,-70 M0,-50 q-5,-60 5,-90" stroke={cold ? '#7A8A7A' : '#4FA65A'} strokeWidth={8} fill="none" />
              </g>
            ))}
            <rect x={W0} y={900} width={W1 - W0} height={500} fill={cold ? '#B8C4D4' : '#4A4552'} />
          </g>
        ),
      },
      {
        depth: 1.25,
        front: true,
        node: (
          <g>
            <rect x={W0 - 400} y={985} width={W1 - W0 + 800} height={140} fill="#5E5A6E" stroke={INK} strokeWidth={5} />
            <rect x={W0 - 400} y={972} width={W1 - W0 + 800} height={18} fill={cold ? '#EEF4FB' : '#8A8F9C'} stroke={INK} strokeWidth={4} />
          </g>
        ),
      },
    ];
  },
  light: () => <Glow x={960} y={760} r={600} color="#BFD8FF" opacity={0.06} />,
  grade: (c) => (
    <g>
      <Grade color={c.v === 'summer' ? '#3A3A7A' : '#2A3A8A'} amount={0.26} />
      <Vignette amount={0.5} />
    </g>
  ),
});

// ── THE BRIDGE ───────────────────────────────────────────────────────────────────────────────────
registerSet('bridge', {
  handheld: 0.5,
  layers: (c) => {
    const storm = c.v === 'storm';
    const drift = c.v === 'drift';
    const roll = storm ? Math.sin(c.t * 1.3) * 7 : drift ? Math.sin(c.t * 0.5) * 1.2 : Math.sin(c.t * 0.6) * 0.6;
    const flash = storm && Math.sin(c.t * 0.9) > 0.985 ? 1 : 0;
    const alarm = c.p.alarm ? (Math.sin(c.frame * 0.4) > 0 ? 1 : 0) : 0;
    return [
      {
        depth: 0.4,
        node: (
          <g transform={`rotate(${roll},960,700)`}>
            <NightSky frame={c.frame} seed={41} top="#01020A" bottom={storm ? '#1A2238' : '#0A1030'} count={storm ? 0 : 520} />
            {/* no horizon in the dark: the sea is just a deeper black */}
            <rect x={-1200} y={560} width={4400} height={1400} fill={storm ? '#0E1424' : '#03050C'} />
            {storm && (
              <g>
                {Array.from({length: 8}, (_, i) => (
                  <path key={i} d={`M${-600 + i * 520 + ((c.t * 300) % 520)},620 q130,-${90 + (i % 3) * 50} 260,0`} fill="#1C2640" stroke="#3A4A6A" strokeWidth={4} />
                ))}
                {flash > 0 && <rect x={-1200} y={-800} width={4400} height={2800} fill="#E8F0FF" opacity={0.7} />}
              </g>
            )}
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {/* ceiling + window frames */}
            <rect x={W0} y={-200} width={W1 - W0} height={360} fill={drift ? '#2A3038' : '#3A424E'} />
            {Array.from({length: 9}, (_, i) => (
              <rect key={i} x={-200 + i * 300} y={150} width={30} height={420} fill={drift ? '#2A3038' : '#3A424E'} stroke={INK} strokeWidth={4} />
            ))}
            <rect x={W0} y={560} width={W1 - W0} height={20} fill="#2A3038" />
            {storm &&
              Array.from({length: 60}, (_, i) => {
                const r = rnd(i + 7);
                const x = -200 + r() * 2400;
                const y = 160 + ((r() * 400 + c.t * 900 * (0.6 + r())) % 400);
                return <line key={i} x1={x} y1={y} x2={x - 12} y2={y + 34} stroke="#BFD8FF" strokeWidth={2} opacity={0.5} />;
              })}
            {drift &&
              [-200, 2120].map((fx, i) => <path key={fx} d={`M${fx},150 L${fx + (i ? -260 : 260)},150 Q${fx + (i ? -80 : 80)},260 ${fx},420 Z`} fill="#E8F4FF" opacity={0.55} />)}
            {/* console along the windows */}
            <rect x={W0} y={580} width={W1 - W0} height={200} fill="#4A525E" stroke={INK} strokeWidth={5} />
            <rect x={W0} y={580} width={W1 - W0} height={26} fill="#5E6670" />
            {/* radar */}
            <g transform="translate(400,680)">
              <rect x={-90} y={-80} width={180} height={150} rx={8} fill="#1A1E24" stroke={INK} strokeWidth={4} />
              <circle r={60} fill="#0A2A1A" stroke="#2A6A4A" strokeWidth={3} />
              <circle r={30} fill="none" stroke="#2A6A4A" strokeWidth={2} />
              <line x1={0} y1={0} x2={Math.cos(c.t * 2) * 60} y2={Math.sin(c.t * 2) * 60} stroke="#7CFF9A" strokeWidth={3} />
            </g>
            {/* GPS display: no fix */}
            <g transform="translate(700,680)">
              <rect x={-110} y={-70} width={220} height={120} rx={8} fill="#1A1E24" stroke={INK} strokeWidth={4} />
              <text x={0} y={-24} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={26} fill="#8A9AAA">
                GPS
              </text>
              <text x={0} y={20} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={38} fill={Math.sin(c.frame * 0.15) > 0 ? '#FF5A4A' : '#7A2A2A'}>
                NO FIX
              </text>
            </g>
            {/* helm stand with a small wheel */}
            <g transform="translate(1000,780)">
              <rect x={-40} y={-120} width={80} height={120} fill="#3A424E" stroke={INK} strokeWidth={4} />
              <circle cx={0} cy={-150} r={46} fill="none" stroke="#8A6A4A" strokeWidth={10} />
              {[0, 1, 2, 3].map((k) => (
                <line key={k} x1={0} y1={-150} x2={Math.cos(k * 0.785 + roll * 0.02) * 46} y2={-150 + Math.sin(k * 0.785 + roll * 0.02) * 46} stroke="#8A6A4A" strokeWidth={6} />
              ))}
            </g>
            {/* VHF radio and its handset cord */}
            <g transform="translate(1340,640)">
              <rect x={-80} y={-40} width={160} height={70} rx={6} fill="#2A2E36" stroke={INK} strokeWidth={4} />
              <text x={0} y={6} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={28} fill="#7CFF9A">
                06
              </text>
              <circle cx={56} cy={-6} r={8} fill={c.p.chirpAt !== undefined && Math.abs(c.t - c.at(c.p.chirpAt, 0)) < 0.6 ? '#7CFF9A' : '#3A4A3A'} />
            </g>
            {/* chart table with a red night lamp */}
            <rect x={1580} y={720} width={300} height={20} fill="#6E5236" stroke={INK} strokeWidth={4} />
            <rect x={1600} y={700} width={260} height={20} fill="#CFE3EE" stroke={INK} strokeWidth={3} />
            <path d="M1600,740 L1600,930 M1860,740 L1860,930" stroke="#5E4430" strokeWidth={10} />
            {c.p.clock && (
              <g transform="translate(1100,90)">
                <rect x={-80} y={-34} width={160} height={60} rx={6} fill="#1A1E24" stroke={INK} strokeWidth={4} />
                <text x={0} y={8} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={34} fill="#FF8A5A">
                  {c.p.clock}
                </text>
              </g>
            )}
            {/* deck */}
            <rect x={W0} y={930} width={W1 - W0} height={400} fill="#3A3E48" />
            {alarm > 0 && <rect x={W0} y={-200} width={W1 - W0} height={1600} fill="#FF2A2A" opacity={0.12} />}
          </g>
        ),
      },
    ];
  },
  light: (c) => (
    <g>
      <Glow x={700} y={640} r={300} color="#7CFFB0" opacity={c.v === 'drift' ? 0.08 : 0.14} />
      <Glow x={1730} y={680} r={240} color="#FF5A4A" opacity={0.14} />
    </g>
  ),
  grade: (c) => (
    <g>
      <Grade color={c.v === 'drift' ? '#3A4A7A' : c.v === 'storm' ? '#2A3A6A' : '#2A4A6A'} amount={c.v === 'drift' ? 0.34 : 0.26} />
      <Vignette amount={0.6} />
    </g>
  ),
});

// ── BRIDGE WING (DECK) ──────────────────────────────────────────────────────────────────────────
registerSet('deck', {
  layers: (c) => {
    const rescued = c.v === 'rescued';
    const sweep = rescued ? Math.min(1, c.t / 1.2) : 0;
    return [
      {
        depth: 0.08,
        node: (
          <g>
            <NightSky frame={c.frame} seed={57} top="#01020A" bottom="#03050C" count={760} />
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {/* the superstructure behind: white steel, a lit porthole and door */}
            <rect x={W0} y={240} width={720} height={700} fill="#C9CED6" stroke={INK} strokeWidth={5} />
            <circle cx={120} cy={440} r={40} fill="#FFD27A" stroke={INK} strokeWidth={5} />
            <rect x={-200} y={560} width={160} height={370} fill="#8A8F9C" stroke={INK} strokeWidth={5} />
            <rect x={W0} y={930} width={W1 - W0} height={400} fill="#4A4E58" />
          </g>
        ),
      },
      {
        depth: 1.2,
        front: true,
        node: (
          <g>
            <path d={`M${W0},800 L${W1},800`} stroke="#E9E4DA" strokeWidth={10} />
            <path d={`M${W0},870 L${W1},870`} stroke="#E9E4DA" strokeWidth={6} />
            {Array.from({length: 26}, (_, i) => (
              <path key={i} d={`M${W0 + i * 110},800 L${W0 + i * 110},940`} stroke="#E9E4DA" strokeWidth={6} />
            ))}
            {rescued && (
              <g style={{mixBlendMode: 'screen'}}>
                <path d={`M2400,${300 + 200 * (1 - sweep)} L1000,520 L1000,760 Z`} fill="#FFFFFF" opacity={0.28} />
                <circle cx={1080} cy={640} r={420} fill="#FFFFFF" opacity={0.16 * sweep} />
              </g>
            )}
          </g>
        ),
      },
    ];
  },
  light: (c) => (c.v === 'rescued' ? <Glow x={1100} y={600} r={500} color="#FFFFFF" opacity={0.3} /> : <Glow x={1000} y={600} r={400} color="#BFD8FF" opacity={0.08} />),
  grade: (c) => (
    <g>
      <Grade color="#2A3A7A" amount={c.v === 'rescued' ? 0.1 : 0.3} />
      <Vignette amount={0.6} />
    </g>
  ),
});

// ── COAST GUARD OPERATIONS ──────────────────────────────────────────────────────────────────────
registerSet('coastguard', {
  layers: (c) => [
    {
      depth: 1,
      node: (
        <g>
          <rect x={W0} y={-200} width={W1 - W0} height={1130} fill="#C9D3DC" />
          <rect x={W0} y={-200} width={W1 - W0} height={150} fill="#1F2A44" />
          <text x={960} y={-90} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={40} fill="#E9E4DA">
            COAST GUARD · MANILA OPERATIONS
          </text>
          {/* fluorescent tubes */}
          {[300, 960, 1620].map((lx) => (
            <rect key={lx} x={lx - 120} y={-40} width={240} height={16} rx={8} fill="#F4F8FF" />
          ))}
          {/* the big chart */}
          <rect x={150} y={180} width={900} height={500} fill="#BFD8E8" stroke={INK} strokeWidth={6} />
          {Array.from({length: 12}, (_, i) => (
            <line key={`v${i}`} x1={150 + i * 75} y1={180} x2={150 + i * 75} y2={680} stroke="#7FA6C0" strokeWidth={2} />
          ))}
          {Array.from({length: 7}, (_, i) => (
            <line key={`h${i}`} x1={150} y1={180 + i * 72} x2={1050} y2={180 + i * 72} stroke="#7FA6C0" strokeWidth={2} />
          ))}
          <g transform="translate(110,190) scale(420,480)">
            {PH_PATHS.map((d, i) => (
              <path key={i} d={d} fill="#E9D7A8" stroke="#6E5236" strokeWidth={0.004} />
            ))}
          </g>
          <text x={800} y={300} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={30} fill="#3A5A7A" letterSpacing={4}>
            PHILIPPINE SEA
          </text>
          {c.p.plot && (
            <g>
              <path d="M820,330 l28,28 M848,330 l-28,28" stroke="#C2464F" strokeWidth={7} />
              <path d="M834,344 L790,300" stroke="#C2464F" strokeWidth={5} strokeDasharray="10 8" />
              <path d="M790,300 l4,18 l14,-14 Z" fill="#C2464F" />
            </g>
          )}
          {/* radio consoles */}
          <rect x={1240} y={560} width={620} height={220} fill="#3A424E" stroke={INK} strokeWidth={5} />
          {[1300, 1460, 1620, 1760].map((cx, i) => (
            <g key={cx}>
              <rect x={cx - 60} y={600} width={120} height={80} rx={6} fill="#1A1E24" stroke={INK} strokeWidth={3} />
              <rect x={cx - 48} y={612} width={96} height={30} fill={i % 2 ? '#7CFF9A' : '#FFB547'} opacity={0.6} />
            </g>
          ))}
          <rect x={W0} y={930} width={W1 - W0} height={400} fill="#5A6470" />
        </g>
      ),
    },
  ],
  light: () => <Glow x={960} y={100} r={1100} color="#F4F8FF" opacity={0.18} />,
  grade: () => (
    <g>
      <Grade color="#DDE8F4" amount={0.08} />
      <Vignette amount={0.45} />
    </g>
  ),
});

// ── THE PIER ─────────────────────────────────────────────────────────────────────────────────────
registerSet('pier', {
  layers: (c) => [
    {depth: 0.08, node: <NightSky frame={c.frame} seed={63} top="#01020A" bottom="#101830" count={420} />},
    {
      depth: 0.7,
      node: (
        <g>
          <rect x={-1200} y={620} width={4400} height={800} fill="#05070E" />
          {/* the white coast-guard ship alongside: hull, orange stripe, superstructure, lights */}
          <g transform="translate(900,760)">
            <path d="M0,0 L1500,0 L1460,140 L60,140 Z" fill="#F4F4F0" stroke={INK} strokeWidth={6} />
            <path d="M180,40 L260,40 L200,130 L120,130 Z" fill="#E8742A" />
            <path d="M290,40 L330,40 L270,130 L230,130 Z" fill="#2E5A9A" />
            <rect x={300} y={-220} width={700} height={220} fill="#F4F4F0" stroke={INK} strokeWidth={6} />
            <rect x={500} y={-330} width={340} height={110} fill="#F4F4F0" stroke={INK} strokeWidth={6} />
            {Array.from({length: 8}, (_, i) => (
              <rect key={i} x={330 + i * 82} y={-170} width={50} height={36} fill="#FFD27A" stroke={INK} strokeWidth={3} />
            ))}
            <text x={720} y={90} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={54} fill="#1F2A44">
              COAST GUARD
            </text>
          </g>
        </g>
      ),
    },
    {
      depth: 1,
      node: (
        <g>
          {/* gangway down to the pier */}
          <path d="M1500,600 L1260,930" stroke="#8A8F9C" strokeWidth={22} />
          <path d="M1500,560 L1260,890" stroke="#C9CED6" strokeWidth={6} />
          {/* floodlights */}
          {[200, 1900].map((lx) => (
            <g key={lx}>
              <path d={`M${lx},940 L${lx},260`} stroke="#3A3F52" strokeWidth={14} />
              <rect x={lx - 50} y={230} width={100} height={40} fill="#E9E4DA" stroke={INK} strokeWidth={4} />
            </g>
          ))}
          {/* bollards */}
          {[620, 1700].map((bx) => (
            <path key={bx} d={`M${bx - 30},940 L${bx - 24},880 Q${bx},860 ${bx + 24},880 L${bx + 30},940 Z`} fill="#2A2A2A" stroke={INK} strokeWidth={4} />
          ))}
          <rect x={W0} y={940} width={W1 - W0} height={400} fill="#8A8F98" />
          <rect x={W0} y={940} width={W1 - W0} height={14} fill="#E9C46A" />
        </g>
      ),
    },
  ],
  light: () => (
    <g>
      <Glow x={200} y={300} r={700} color="#FFF4D6" opacity={0.22} />
      <Glow x={1900} y={300} r={700} color="#FFF4D6" opacity={0.22} />
    </g>
  ),
  grade: () => (
    <g>
      <Grade color="#2A3A7A" amount={0.22} />
      <Vignette amount={0.5} />
    </g>
  ),
});
