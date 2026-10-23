import React from 'react';
import {Frost} from '../../../fx/cinema/atmos';
import {Stars} from '../../../fx/sky';
import {Flame} from '../../sun01/parts';
import {Glow, Grade, INK, registerSet, Smoke, Vignette, type SetCtx} from '../stage';

/**
 * Inside your building.
 *  apartment — the living room that becomes the "warm room". floor y = 930.
 *     v: door (front door, knock / Ito) · seal (taping blankets) · warm (sealed room, lantern) · candle (power cut) · balcony
 *  bathroom  — the tub filling. floor y = 930.
 *  stairs    — the stairwell landing: neighbours' doors, stairs down, EXIT sign. floor y = 940. v: smoke · evac
 */
const WALL = '#C9B79C';
const WALL_SH = '#B2A084';
const FLOOR = '#8E5E3A';

const Bookcase: React.FC<{x: number; base: number}> = ({x, base}) => (
  <g transform={`translate(${x},${base})`}>
    <rect x={-130} y={-420} width={260} height={420} fill="#7A4E30" stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3].map((r) => (
      <g key={r}>
        <rect x={-116} y={-404 + r * 100} width={232} height={86} fill="#5A3822" />
        {Array.from({length: 9}, (_, k) => {
          const h = 50 + ((k * 37 + r * 13) % 30);
          return <rect key={k} x={-110 + k * 25} y={-404 + r * 100 + 86 - h} width={20} height={h} fill={['#C2464F', '#3E7CB1', '#E9C46A', '#3C8D6E', '#E07A5F', '#6D597A'][(k + r) % 6]} stroke={INK} strokeWidth={2} />;
        })}
      </g>
    ))}
  </g>
);

const Sofa: React.FC<{x: number; base: number}> = ({x, base}) => (
  <g transform={`translate(${x},${base})`}>
    <rect x={-220} y={-170} width={440} height={110} rx={30} fill="#3E7CB1" stroke={INK} strokeWidth={5} />
    <rect x={-240} y={-90} width={480} height={80} rx={24} fill="#4A8BC4" stroke={INK} strokeWidth={5} />
    <rect x={-260} y={-130} width={60} height={120} rx={24} fill="#356AA6" stroke={INK} strokeWidth={5} />
    <rect x={200} y={-130} width={60} height={120} rx={24} fill="#356AA6" stroke={INK} strokeWidth={5} />
    <rect x={-120} y={-150} width={80} height={60} rx={14} fill="#F2C94C" stroke={INK} strokeWidth={4} transform="rotate(-8,-80,-120)" />
    <path d="M-230,-10 L-230,0 M230,-10 L230,0" stroke={INK} strokeWidth={10} />
  </g>
);

const LivingRoom: React.FC<{c: SetCtx}> = ({c}) => {
  const v = c.v;
  const sealed = v === 'warm' || v === 'candle' || (v === 'seal' && c.p.blankets === 'up');
  const sealing = v === 'seal' && c.p.blankets !== 'up' ? Math.min(1, c.t / Math.max(1, c.dur * 0.8)) : sealed ? 1 : 0;
  const doorOpen = v === 'door' && c.p.doorOpen;
  const knock = v === 'door' && c.p.knock ? Math.sin(c.frame * 1.6) * (Math.floor(c.t * 3) % 2 === 0 ? 3 : 0) : 0;
  return (
    <g>
      <rect x={-600} y={-200} width={3100} height={1130} fill={WALL} />
      {/* picture rail + wallpaper diamonds */}
      <path d="M-600,180 L2500,180" stroke={WALL_SH} strokeWidth={8} />
      {Array.from({length: 60}, (_, i) => (
        <path key={i} d={`M${-600 + (i % 30) * 104},${i < 30 ? 260 : 460} l26,-26 l26,26 l-26,26 z`} fill={WALL_SH} opacity={0.35} />
      ))}
      {/* window (left) — later covered with blankets */}
      <g>
        <rect x={160} y={220} width={480} height={420} fill="#0C1430" stroke="#E9DCC6" strokeWidth={20} />
        <Stars frame={c.frame} count={90} w={460} h={400} seed={8} maxR={2} />
        <g transform="translate(160,220)">{c.p.frosty !== false && <Frost amount={sealed ? 0.6 : 0.35} w={480} h={420} seed={4} />}</g>
        <rect x={160} y={220} width={480} height={420} fill="none" stroke={INK} strokeWidth={4} />
        <path d="M400,220 L400,640" stroke="#E9DCC6" strokeWidth={12} />
        {/* blankets: a patchwork of three, sliding down over the glass */}
        {sealing > 0 && (
          <g>
            {['#C2464F', '#4FA3A5', '#E9C46A'].map((col, k) => {
              const h = 440 * Math.min(1, Math.max(0, sealing * 3 - k));
              return (
                <g key={k}>
                  <rect x={150 + k * 165} y={210} width={170} height={h} fill={col} stroke={INK} strokeWidth={4} />
                  {h > 40 && <path d={`M${160 + k * 165},${210 + h - 30} l20,0 m20,0 l20,0 m20,0 l20,0`} stroke="#F4EFE6" strokeWidth={4} />}
                </g>
              );
            })}
            <rect x={150} y={204} width={500} height={22} fill="#C9B88A" opacity={0.9} />
          </g>
        )}
      </g>
      {/* framed photos */}
      {[
        [820, 300, '#E9C46A'],
        [940, 330, '#3E7CB1'],
        [860, 420, '#C2464F'],
      ].map(([x, y, col], i) => (
        <g key={i}>
          <rect x={(x as number) - 44} y={(y as number) - 34} width={88} height={68} fill="#5A3822" stroke={INK} strokeWidth={4} />
          <rect x={(x as number) - 34} y={(y as number) - 24} width={68} height={48} fill={col as string} opacity={0.75} />
          <circle cx={x as number} cy={(y as number) - 4} r={10} fill="#F4D6B0" />
        </g>
      ))}
      {/* front door (right) */}
      <g>
        <rect x={1460} y={420} width={260} height={510} fill={doorOpen ? '#2A2028' : '#1C1A22'} stroke={INK} strokeWidth={5} />
        {doorOpen && <rect x={1470} y={430} width={240} height={500} fill="#FFB867" opacity={0.3} />}
        <g transform={`translate(${1460 + knock},420)`}>
          {doorOpen ? (
            <path d="M260,0 L330,-30 L330,540 L260,510 Z" fill="#6F4E46" stroke={INK} strokeWidth={5} />
          ) : (
            <g>
              <rect x={0} y={0} width={260} height={510} fill="#6F4E46" stroke={INK} strokeWidth={5} />
              <rect x={30} y={40} width={200} height={180} rx={6} fill="none" stroke="#5A3E36" strokeWidth={6} />
              <rect x={30} y={270} width={200} height={200} rx={6} fill="none" stroke="#5A3E36" strokeWidth={6} />
              <circle cx={220} cy={260} r={12} fill="#E8C27A" stroke={INK} strokeWidth={3} />
              <circle cx={130} cy={120} r={10} fill="#1C1A22" />
            </g>
          )}
        </g>
        <rect x={1440} y={400} width={300} height={24} fill="#E9DCC6" stroke={INK} strokeWidth={4} />
        {/* coat hooks */}
        <path d="M1800,520 L1960,520" stroke="#5A3822" strokeWidth={14} />
        <path d="M1830,520 Q1800,600 1840,700 L1890,700 Q1900,600 1860,520 Z" fill="#F08A2C" stroke={INK} strokeWidth={4} />
        <path d="M1910,520 Q1890,580 1920,640 L1950,640 Q1960,580 1935,520 Z" fill="#4F86C6" stroke={INK} strokeWidth={4} />
      </g>
      <Bookcase x={1150} base={930} />
      {/* floor */}
      <rect x={-600} y={930} width={3100} height={500} fill={FLOOR} />
      {Array.from({length: 22}, (_, i) => (
        <path key={i} d={`M${-600 + i * 150},930 L${-800 + i * 190},1430`} stroke="#74482A" strokeWidth={3} />
      ))}
      <rect x={-600} y={922} width={3100} height={12} fill="#5A3822" />
      <ellipse cx={760} cy={970} rx={420} ry={44} fill="#C2464F" opacity={0.85} />
      <ellipse cx={760} cy={970} rx={380} ry={32} fill="none" stroke="#E9C46A" strokeWidth={5} />
      {v !== 'warm' && v !== 'candle' && <Sofa x={560} base={930} />}
      {(v === 'warm' || v === 'candle' || v === 'seal') && (
        <g>
          {/* mattresses dragged into one room, duvets */}
          <rect x={360} y={880} width={560} height={60} rx={20} fill="#E9E4F2" stroke={INK} strokeWidth={4} />
          <path d="M380,890 Q520,830 700,880 Q820,840 900,890 L900,930 L380,930 Z" fill="#4FA3A5" stroke={INK} strokeWidth={4} />
          <rect x={1300} y={860} width={90} height={70} rx={10} fill="#C9CED6" stroke={INK} strokeWidth={4} />
        </g>
      )}
      {v === 'balcony' && (
        <g>
          {/* glass door to the balcony on the right half, frost, the food lined up outside */}
          <rect x={960} y={300} width={460} height={630} fill="#0C1430" stroke="#E9DCC6" strokeWidth={18} />
          <g transform="translate(960,300)">
            <Frost amount={0.5} w={460} h={630} seed={7} />
          </g>
          <path d="M960,700 L1420,700" stroke="#8A8F9C" strokeWidth={10} />
          {[1010, 1080, 1150, 1230, 1310].map((x, i) => (
            <rect key={x} x={x} y={690 - (40 + (i % 3) * 20)} width={56} height={40 + (i % 3) * 20} rx={6} fill={['#E07A5F', '#F4EFE6', '#E9C46A', '#3E7CB1', '#C2464F'][i]} stroke={INK} strokeWidth={3} />
          ))}
        </g>
      )}
    </g>
  );
};

registerSet('apartment', {
  layers: (c) => [{depth: 1, node: <LivingRoom c={c} />}],
  light: (c) => {
    const v = c.v;
    if (v === 'candle') {
      const lit = c.ramp('l0+1', 0.4);
      return (
        <g>
          <g opacity={lit}>
            <Flame x={980} y={900} s={0.9} frame={c.frame} glow={1.4} />
            <Flame x={1040} y={910} s={0.7} frame={c.frame} glow={1} seed={3} />
          </g>
        </g>
      );
    }
    if (v === 'warm' || v === 'seal') {
      return (
        <g>
          {/* camping lantern on the shelf */}
          <Flame x={1300} y={860} s={0.9} frame={c.frame} kind="lantern" glow={1.6} />
        </g>
      );
    }
    if (v === 'door' && c.p.doorOpen) return <Glow x={1600} y={700} r={500} color="#FFC77A" opacity={0.35} />;
    return <Glow x={1150} y={250} r={500} color="#FFE3A6" opacity={0.25} />;
  },
  grade: (c) => {
    const v = c.v;
    const dark = v === 'candle' ? 0.62 - 0.22 * c.ramp('l0+1', 0.4) : v === 'warm' || v === 'seal' ? 0.3 : v === 'balcony' ? 0.4 : 0.22;
    return (
      <g>
        <Grade color={v === 'candle' ? '#1A2266' : '#3A2E6E'} amount={dark} />
        <Vignette amount={0.55} />
      </g>
    );
  },
});

// ── BATHROOM ────────────────────────────────────────────────────────────────────────────────────
registerSet('bathroom', {
  layers: (c) => {
    const fill = Math.min(1, c.t / Math.max(2, c.dur));
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={-600} y={-200} width={3100} height={1130} fill="#DCE8EA" />
            {Array.from({length: 40}, (_, i) => (
              <path key={i} d={`M${-600 + i * 80},-200 L${-600 + i * 80},930`} stroke="#C2D4D8" strokeWidth={3} />
            ))}
            {Array.from({length: 16}, (_, i) => (
              <path key={i} d={`M-600,${-200 + i * 80} L2500,${-200 + i * 80}`} stroke="#C2D4D8" strokeWidth={3} />
            ))}
            {/* mirror + sink */}
            <rect x={240} y={260} width={240} height={300} rx={120} fill="#AFC8D6" stroke={INK} strokeWidth={5} />
            <path d="M290,320 L360,280 M300,380 L400,300" stroke="#FFFFFF" strokeWidth={8} opacity={0.6} />
            <path d="M220,640 L500,640 L470,720 L250,720 Z" fill="#F4F6F8" stroke={INK} strokeWidth={5} />
            <rect x={340} y={720} width={40} height={210} fill="#E8ECEF" stroke={INK} strokeWidth={4} />
            {/* the tub */}
            <g>
              <path d="M820,700 L1640,700 L1600,900 Q1590,930 1550,930 L900,930 Q860,930 850,900 Z" fill="#F4F6F8" stroke={INK} strokeWidth={6} />
              <clipPath id="tubwater">
                <path d="M830,700 L1630,700 L1592,890 L858,890 Z" />
              </clipPath>
              <g clipPath="url(#tubwater)">
                <rect x={820} y={890 - fill * 170} width={820} height={200} fill="#7FC2E8" opacity={0.85} />
                <path d={`M820,${890 - fill * 170} q40,-8 80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0`} stroke="#DFF3FF" strokeWidth={5} fill="none" transform={`translate(${-(c.frame * 3) % 160},0)`} />
              </g>
              <rect x={800} y={690} width={860} height={22} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
              {/* tap + gushing water */}
              <path d="M900,690 L900,610 Q900,580 940,580 L990,580" stroke="#B8BEC6" strokeWidth={22} fill="none" />
              <path d="M900,690 L900,610 Q900,580 940,580 L990,580" stroke={INK} strokeWidth={4} fill="none" opacity={0.5} />
              <path d={`M980,592 Q${986 + Math.sin(c.frame) * 3},700 984,${890 - fill * 170}`} stroke="#9FD8FF" strokeWidth={22} fill="none" opacity={0.9} />
              {Array.from({length: 6}, (_, k) => (
                <circle key={k} cx={984 + Math.sin(c.frame * 0.7 + k) * 40} cy={890 - fill * 170 - 6 - ((c.frame * 2 + k * 10) % 30)} r={6} fill="#DFF3FF" opacity={0.8} />
              ))}
              <path d="M860,930 L860,960 M1590,930 L1590,960" stroke={INK} strokeWidth={14} />
            </g>
            {/* towel + rubber duck */}
            <rect x={1760} y={360} width={120} height={260} rx={12} fill="#E07A5F" stroke={INK} strokeWidth={4} />
            <g transform="translate(1500,690)">
              <ellipse cx={0} cy={-18} rx={30} ry={20} fill="#F2C94C" stroke={INK} strokeWidth={3.5} />
              <circle cx={18} cy={-42} r={16} fill="#F2C94C" stroke={INK} strokeWidth={3.5} />
              <path d="M32,-42 l14,4 l-14,4 z" fill="#F2994A" />
            </g>
            <rect x={-600} y={930} width={3100} height={500} fill="#8FA4AE" />
            {Array.from({length: 30}, (_, i) => (
              <path key={i} d={`M${-600 + i * 110},930 L${-600 + i * 110},1430`} stroke="#7A8F99" strokeWidth={3} />
            ))}
          </g>
        ),
      },
    ];
  },
  light: () => <Glow x={960} y={200} r={700} color="#EAF4FF" opacity={0.25} />,
  grade: () => (
    <g>
      <Grade color="#3A4A8A" amount={0.3} />
      <Vignette amount={0.5} />
    </g>
  ),
});

// ── STAIRWELL ───────────────────────────────────────────────────────────────────────────────────
registerSet('stairs', {
  layers: (c) => {
    const smoke = c.v === 'smoke' ? Math.min(1, 0.4 + c.t / 4) : 0.8;
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={-600} y={-200} width={3100} height={1140} fill="#7E8A7A" />
            <rect x={-600} y={560} width={3100} height={380} fill="#5E6A5A" />
            <path d="M-600,560 L2500,560" stroke="#4A5448" strokeWidth={10} />
            {/* stairs going down to the left, banister */}
            <path d="M-600,940 L-600,600 L-480,600 L-480,640 L-360,640 L-360,680 L-240,680 L-240,720 L-120,720 L-120,760 L0,760 L0,800 L120,800 L120,940 Z" fill="#4A4F58" stroke={INK} strokeWidth={4} />
            <path d="M-560,470 L180,690" stroke="#6F4E46" strokeWidth={16} strokeLinecap="round" />
            {Array.from({length: 7}, (_, k) => (
              <path key={k} d={`M${-540 + k * 110},${476 + k * 33} L${-540 + k * 110},${600 + k * 40}`} stroke="#5A3E36" strokeWidth={8} />
            ))}
            {/* neighbours' doors */}
            {[600, 1240, 1880].map((x, i) => (
              <g key={x}>
                <rect x={x - 120} y={420} width={240} height={520} fill="#3E4A5A" stroke={INK} strokeWidth={5} />
                <rect x={x - 100} y={440} width={200} height={480} fill={['#6F4E46', '#2E3A5C', '#5E8C7A'][i]} stroke={INK} strokeWidth={4} />
                <circle cx={x + 70} cy={690} r={10} fill="#E8C27A" />
                <rect x={x - 24} y={360} width={48} height={34} rx={4} fill="#E9DCC6" stroke={INK} strokeWidth={3} />
                <text x={x} y={386} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={22} fill={INK}>
                  {['3A', '3B', '3C'][i]}
                </text>
                {i === 1 && <rect x={x - 100} y={930} width={200} height={10} fill="#FF8A3A" opacity={0.6 + 0.4 * Math.sin(c.frame * 0.4)} />}
              </g>
            ))}
            {/* EXIT sign */}
            <rect x={1500} y={160} width={180} height={70} rx={8} fill="#1E8A4A" stroke={INK} strokeWidth={4} />
            <text x={1590} y={210} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={40} fill="#E8FFE8">
              EXIT
            </text>
            <rect x={-600} y={940} width={3100} height={500} fill="#3A3F48" />
            {/* smoke from under 3B */}
            <Smoke frame={c.frame} x={1000} y={300} w={600} h={640} color="#8A8F9C" opacity={0.55 * smoke} seed={2} rise={0.5} />
            <Smoke frame={c.frame + 60} x={300} y={100} w={1500} h={700} color="#6E7380" opacity={0.35 * smoke} seed={9} rise={0.3} />
          </g>
        ),
      },
    ];
  },
  light: (c) => (
    <g>
      <Glow x={1590} y={200} r={300} color="#3CFF8A" opacity={0.3} />
      <Glow x={1240} y={930} r={220} color="#FF8A3A" opacity={0.35 + 0.1 * Math.sin(c.frame * 0.4)} rx={320} />
    </g>
  ),
  grade: () => (
    <g>
      <Grade color="#1E2A5E" amount={0.55} />
      <Vignette amount={0.7} />
    </g>
  ),
  handheld: 0.8,
});
