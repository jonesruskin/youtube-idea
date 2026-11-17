import React from 'react';
import {Stars} from '../../../fx/sky';
import {Glow, Grade, INK, M, registerSet, Vignette, type SetCtx} from '../stage';

/**
 * Where Mum is all year. floor y = 930 (hospital), ice y = 940 (river).
 *  hospital — St Anne's, across the river: a corridor turned shelter, cots along the wall, the nurses' station.
 *     Mum video-calls the kids on her phone. v: lit (power works all year). p.siren: blue ambulance light at the doors
 *  river    — the frozen river between them, Day 180: the closed bridge, the far bank where the hospital still
 *     has a few lit windows, and the ice, thick enough at last to walk on. v: walk
 */
const Hospital: React.FC<{c: SetCtx}> = ({c}) => {
  const dark = c.v === 'dark';
  return (
    <g>
      <rect x={-700} y={-300} width={3300} height={1240} fill={dark ? '#5E6E6A' : '#B9D2C8'} />
      <rect x={-700} y={560} width={3300} height={380} fill={dark ? '#4E5C58' : '#9DBDB1'} />
      <path d="M-700,560 L2600,560" stroke={INK} strokeWidth={6} opacity={0.5} />
      {/* ceiling strip lights */}
      {[-200, 400, 1000, 1600, 2200].map((x) => (
        <rect key={x} x={x - 120} y={-60} width={240} height={26} rx={8} fill={dark ? '#4A4552' : '#FFFBE8'} stroke={INK} strokeWidth={4} />
      ))}
      {/* sign */}
      <rect x={300} y={140} width={520} height={90} rx={10} fill="#2E5A8A" stroke={INK} strokeWidth={5} />
      <text x={560} y={200} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={46} fill="#FFF">
        ST ANNE'S · WARD 4
      </text>
      {/* ward doors with round windows */}
      {[-300, 900, 2000].map((x) => (
        <g key={x}>
          <rect x={x} y={930 - M(2.1)} width={M(1.1)} height={M(2.1)} fill="#8AA6B8" stroke={INK} strokeWidth={5} />
          <circle cx={x + M(0.55)} cy={930 - M(1.5)} r={34} fill={dark ? '#1A2030' : '#DDEFFF'} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* a window: night outside */}
      <rect x={1300} y={240} width={420} height={260} fill="#0C1430" stroke="#E9EEF0" strokeWidth={16} />
      <g transform="translate(1300,240)">
        <Stars frame={c.frame} count={40} w={420} h={260} seed={66} maxR={2} />
      </g>
      {/* cots along the wall, people asleep under blankets */}
      {[-520, -120, 280, 680, 1080, 1480, 1880].map((x, i) => (
        <g key={x} transform={`translate(${x},930)`}>
          <rect x={0} y={-M(0.5)} width={M(1.9)} height={24} rx={8} fill="#C9CED6" stroke={INK} strokeWidth={4} />
          <path d={`M10,${-M(0.5) + 24} L10,0 M${M(1.9) - 10},${-M(0.5) + 24} L${M(1.9) - 10},0`} stroke={INK} strokeWidth={8} />
          <path d={`M14,${-M(0.5)} Q${M(0.95)},${-M(0.5) - 70} ${M(1.9) - 14},${-M(0.5)} Z`} fill={['#4FA3A5', '#C2464F', '#E9C46A', '#3E7CB1'][i % 4]} stroke={INK} strokeWidth={4} />
          <circle cx={34} cy={-M(0.5) - 26} r={22} fill={['#7A4E30', '#E8C4A2', '#A87048', '#5A3822'][i % 4]} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* the nurses' station + ham radio (right of centre) */}
      <g transform="translate(1150,930)">
        <rect x={-260} y={-M(1.05)} width={520} height={M(1.05)} fill="#E9EEF0" stroke={INK} strokeWidth={5} />
        <rect x={-280} y={-M(1.05) - 20} width={560} height={24} fill="#8AA6B8" stroke={INK} strokeWidth={4} />
        {/* a desk monitor and files (Mum calls the kids on her phone; there is no radio) */}
        <rect x={70} y={-M(1.05) - 110} width={150} height={92} rx={8} fill="#1A1C24" stroke={INK} strokeWidth={4} />
        <rect x={80} y={-M(1.05) - 100} width={130} height={70} rx={4} fill="#5FA8C8" opacity={0.85} />
        <rect x={135} y={-M(1.05) - 18} width={20} height={14} fill={INK} />
        <rect x={-200} y={-M(1.05) - 44} width={110} height={26} rx={4} fill="#E9C46A" stroke={INK} strokeWidth={3} />
        {dark && <rect x={-200} y={-M(1.05) - 90} width={40} height={60} rx={6} fill="#FFE3A6" stroke={INK} strokeWidth={3} />}
      </g>
      <rect x={-700} y={930} width={3300} height={500} fill={dark ? '#5A5E6A' : '#C9CED6'} />
      {Array.from({length: 24}, (_, i) => (
        <path key={i} d={`M${-700 + i * 150},930 L${-900 + i * 190},1430`} stroke={dark ? '#4A4E58' : '#B2B8C2'} strokeWidth={3} />
      ))}
    </g>
  );
};

const River: React.FC<{c: SetCtx}> = ({c}) => (
  <g>
    <rect x={-900} y={-500} width={3800} height={1500} fill="#03050F" />
    <Stars frame={c.frame} count={500} w={3600} h={900} seed={88} maxR={2.4} y0={-500} />
    {/* far bank: the dark city, and St Anne's with a few windows still lit */}
    {Array.from({length: 22}, (_, i) => {
      const r = Math.abs(Math.sin(i * 12.9));
      const h = 120 + r * 260;
      return <rect key={i} x={-900 + i * 175} y={560 - h} width={150} height={h} fill="#141A30" stroke={INK} strokeWidth={2} />;
    })}
    <g transform="translate(1350,560)">
      <rect x={-200} y={-300} width={400} height={300} fill="#1E2640" stroke={INK} strokeWidth={3} />
      {Array.from({length: 15}, (_, k) => (
        <rect key={k} x={-170 + (k % 5) * 70} y={-270 + Math.floor(k / 5) * 80} width={36} height={40} fill="#FFD27A" opacity={[0, 3, 7, 9, 12].includes(k) ? 0.9 : 0.08} />
      ))}
      <path d="M-30,-300 L-30,-340 L30,-340 L30,-300 M-12,-330 L12,-330 M0,-342 L0,-318" stroke="#C2464F" strokeWidth={8} />
    </g>
    <rect x={-900} y={560} width={3800} height={40} fill="#E6EEF7" />
    {/* the frozen river: wide, white-blue, cracked */}
    <rect x={-900} y={600} width={3800} height={300} fill="#C9D8E8" />
    {Array.from({length: 26}, (_, k) => (
      <path key={k} d={`M${-860 + k * 150},${640 + (k % 4) * 60} l${50 + (k % 3) * 30},${16 - (k % 2) * 30} l60,${20}`} stroke="#8EA4BE" strokeWidth={3} fill="none" />
    ))}
    {/* the closed bridge (left): a barrier and a sign */}
    <path d="M-900,520 L300,520 L300,560 L-900,560 Z" fill="#3A3F52" stroke={INK} strokeWidth={4} />
    {[-700, -400, -100, 200].map((x) => <rect key={x} x={x} y={560} width={40} height={340} fill="#2A2E3A" stroke={INK} strokeWidth={3} />)}
    <rect x={120} y={470} width={160} height={50} fill="#C2464F" stroke={INK} strokeWidth={3} />
    <text x={200} y={505} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={26} fill="#FFF">CLOSED</text>
    {/* near bank */}
    <path d="M-900,900 Q600,860 2900,910 L2900,1500 L-900,1500 Z" fill="#E6EEF7" stroke={INK} strokeWidth={4} />
  </g>
);

registerSet('hospital', {
  layers: (c) => [{depth: 1, node: <Hospital c={c} />}],
  light: (c) =>
    c.v === 'dark' ? (
      <g>
        <Glow x={970} y={760} r={420} color="#FFD08A" opacity={0.45} />
      </g>
    ) : (
      <g>
        <Glow x={960} y={100} r={1100} color="#FFFFFF" opacity={0.2} />
        <Glow x={1250} y={780} r={300} color="#FFB25A" opacity={0.15} />
        {/* an ambulance at the doors: its blue light sweeping the corridor */}
        {c.p.siren && <Glow x={-80} y={620} r={520} color="#3A7BFF" opacity={0.18 + 0.22 * Math.max(0, Math.sin(c.frame * 0.42))} />}
      </g>
    ),
  grade: (c) => (
    <g>
      <Grade color={c.v === 'dark' ? '#1E2A5E' : '#DDEFE8'} amount={c.v === 'dark' ? 0.55 : 0.06} />
      <Vignette amount={0.5} />
    </g>
  ),
});

registerSet('river', {
  layers: (c) => [{depth: 1, node: <River c={c} />}],
  light: () => (
    <g>
      <Glow x={1350} y={420} r={360} color="#FFD27A" opacity={0.18} />
    </g>
  ),
  grade: () => (
    <g>
      <Grade color="#14205E" amount={0.45} />
      <Vignette amount={0.6} />
    </g>
  ),
});
