import React from 'react';
import {CityBlocks, NightSky} from '../../sun01/parts';
import {Glow, Grade, INK, M, registerSet, Vignette, type SetCtx} from '../stage';
import {Stars} from '../../../fx/sky';

/**
 * The family kitchen, 6:51 a.m. on a summer morning, and the same room one second later.
 * Layout (floor y = 930, 1 m = M(1) ≈ 206 px): worktop 0.9 m (x −300–680), window sill 1.4 m, wall cabinets
 * 1.45–2.2 m, table 0.74 m (x 900–1420), fridge-freezer 1.85 m × 0.8 m (x 1560–1725).
 */
const WALL = '#F3D7AE';
const WALL_SH = '#E2BE8E';
const TILE = '#F7E7CC';
const WOOD = '#B9774A';
const WOOD_D = '#94592F';
const CAB = '#5E8C7A';
const CAB_D = '#4A7262';

const Window: React.FC<{c: SetCtx; dark: boolean}> = ({c, dark}) => (
  <g>
    {/* the view */}
    <clipPath id="kwin">
      <rect x={300} y={210} width={440} height={330} rx={6} />
    </clipPath>
    <g clipPath="url(#kwin)">
      {dark ? (
        <g>
          <NightSky frame={c.frame} stars={0} />
          <g transform="translate(300,210)"><Stars frame={c.frame} count={260} w={440} h={330} seed={5} maxR={3.6} /></g>
          <ellipse cx={520} cy={300} rx={260} ry={50} fill="#B8C8FF" opacity={0.12} transform="rotate(-18,520,300)" />
          <rect x={300} y={210} width={440} height={330} fill="#0B1233" opacity={0.4} />
          <g transform="translate(300,0) scale(0.5) translate(-300,560)">
            <CityBlocks seed={11} base={600} color="#141A33" frame={c.frame} lights={0.55} minH={120} maxH={360} x0={300} x1={1300} />
          </g>
        </g>
      ) : (
        <g>
          <rect x={300} y={210} width={440} height={330} fill="#9ED3F2" />
          <circle cx={660} cy={270} r={70} fill="#FFF3C2" opacity={0.9} />
          <circle cx={660} cy={270} r={38} fill="#FFFBE8" />
          <path d="M330,300 q30,-26 60,0 q20,-14 40,0 z" fill="#FFFFFF" opacity={0.85} />
          <g transform="translate(300,0) scale(0.5) translate(-300,560)">
            <CityBlocks seed={11} base={600} color="#9DB4C9" frame={c.frame} lights={0} minH={120} maxH={360} x0={300} x1={1300} sunlit="#FFF1D0" />
          </g>
        </g>
      )}
    </g>
    {/* frame, sill, plants */}
    <rect x={300} y={210} width={440} height={330} rx={6} fill="none" stroke="#F8F1E4" strokeWidth={22} />
    <rect x={300} y={210} width={440} height={330} rx={6} fill="none" stroke={INK} strokeWidth={4} />
    <path d="M520,210 L520,540 M300,375 L740,375" stroke="#F8F1E4" strokeWidth={12} />
    <rect x={276} y={540} width={488} height={22} rx={4} fill="#F8F1E4" stroke={INK} strokeWidth={4} />
    {/* curtains */}
    {[-1, 1].map((k) => (
      <path key={k} d={k < 0 ? 'M240,180 L330,180 Q300,360 320,560 L250,560 Q270,360 240,180 Z' : 'M800,180 L710,180 Q740,360 720,560 L790,560 Q770,360 800,180 Z'} fill="#E07A5F" stroke={INK} strokeWidth={4} />
    ))}
    <path d="M220,180 L820,180" stroke={INK} strokeWidth={8} strokeLinecap="round" />
    {[340, 420, 680].map((x, i) => (
      <g key={x} transform={`translate(${x},540)`}>
        <path d="M-22,0 L-18,-34 L18,-34 L22,0 Z" fill={['#D9734E', '#C9A24A', '#7FA7C9'][i]} stroke={INK} strokeWidth={3.5} />
        {Array.from({length: 5}, (_, k) => (
          <ellipse key={k} cx={(k - 2) * 9} cy={-50 - Math.abs(k - 2) * -6} rx={8} ry={20} fill={['#4E9A5B', '#3E8A4F'][k % 2]} stroke={INK} strokeWidth={2.5} transform={`rotate(${(k - 2) * 18},${(k - 2) * 9},-36)`} />
        ))}
      </g>
    ))}
    {/* light beam from the window */}
    {!dark && <path d="M300,210 L740,210 L1180,930 L560,930 Z" fill="#FFF3C8" opacity={0.18} />}
    {!dark &&
      Array.from({length: 18}, (_, i) => {
        const k = Math.sin(i * 91.7) * 0.5 + 0.5;
        const y = 260 + (((i * 47 + c.frame * (0.3 + k * 0.4)) % 600) + 600) % 600;
        const x = 400 + k * 500 + (y - 210) * 0.55 + Math.sin(c.frame * 0.03 + i) * 12;
        return <circle key={i} cx={x} cy={y} r={2 + k * 2} fill="#FFFBE8" opacity={0.6} />;
      })}
  </g>
);

const Room: React.FC<{c: SetCtx; dark: boolean}> = ({c, dark}) => {
  return (
    <g>
      {/* wall + tiles */}
      <rect x={-300} y={-200} width={2520} height={1130} fill={WALL} />
      {Array.from({length: 46}, (_, i) => (
        <rect key={i} x={-300 + i * 56} y={-200} width={22} height={1130} fill={WALL_SH} opacity={0.22} />
      ))}
      <rect x={-300} y={631} width={980} height={114} fill={TILE} />
      {Array.from({length: 33}, (_, i) => (
        <path key={i} d={`M${-300 + i * 30},631 L${-300 + i * 30},745`} stroke={WALL_SH} strokeWidth={2} />
      ))}
      {[661, 691, 721].map((y) => (
        <path key={y} d={`M-300,${y} L680,${y}`} stroke={WALL_SH} strokeWidth={2} />
      ))}
      <rect x={-300} y={-200} width={2520} height={60} fill={WALL_SH} opacity={0.6} />
      {/* open shelf with jars */}
      <g transform="translate(830,600) scale(0.62) translate(-800,-420)">
      <rect x={800} y={420} width={220} height={14} rx={4} fill="#A86E42" stroke={INK} strokeWidth={3.5} />
      {[
        [830, 64, '#E3A15A'],
        [880, 80, '#D9443A'],
        [935, 56, '#F2C94C'],
        [985, 72, '#7FA7C9'],
      ].map(([x, h, col]) => (
        <g key={x as number}>
          <rect x={(x as number) - 18} y={420 - (h as number)} width={36} height={h as number} rx={8} fill="#E8F1F4" stroke={INK} strokeWidth={3} opacity={0.95} />
          <rect x={(x as number) - 15} y={420 - (h as number) * 0.6} width={30} height={(h as number) * 0.6 - 3} rx={5} fill={col as string} />
          <rect x={(x as number) - 20} y={420 - (h as number) - 8} width={40} height={10} rx={3} fill="#5E8C7A" stroke={INK} strokeWidth={2.5} />
        </g>
      ))}
      </g>
      {/* utensil rail */}
      <path d="M-240,646 L160,646" stroke="#8A8F9C" strokeWidth={6} />
      {[-210, -160, -110, -60, -10, 40, 90].map((x, i) => (
        <g key={x} transform={`translate(${x},646) scale(0.8) rotate(${Math.sin(c.frame * 0.02 + i) * 2})`}>
          <path d="M0,0 L0,40" stroke={INK} strokeWidth={4} />
          {i % 3 === 0 && <ellipse cx={0} cy={52} rx={12} ry={16} fill="#B8BEC6" stroke={INK} strokeWidth={3} />}
          {i % 3 === 1 && <path d="M-10,40 L-10,66 M0,40 L0,66 M10,40 L10,66" stroke={INK} strokeWidth={3} />}
          {i % 3 === 2 && <rect x={-9} y={40} width={18} height={28} rx={4} fill="#A86E42" stroke={INK} strokeWidth={3} />}
        </g>
      ))}
      {/* calendar */}
      <g transform="translate(1440,430) scale(0.7) rotate(2)">
        <rect x={-50} y={-70} width={100} height={130} fill="#FFFDF6" stroke={INK} strokeWidth={3.5} />
        <rect x={-50} y={-70} width={100} height={36} fill="#D9443A" stroke={INK} strokeWidth={3.5} />
        {Array.from({length: 20}, (_, k) => (
          <rect key={k} x={-40 + (k % 5) * 17} y={-26 + Math.floor(k / 5) * 20} width={11} height={11} fill={k === 13 ? '#D9443A' : '#C9CED6'} />
        ))}
      </g>
      {/* upper cabinets */}
      {[-280, -40].map((x) => (
        <g key={x}>
          <rect x={x} y={478} width={220} height={153} rx={6} fill={CAB} stroke={INK} strokeWidth={4} />
          <path d={`M${x + 110},478 L${x + 110},631`} stroke={INK} strokeWidth={3} />
          <circle cx={x + 98} cy={612} r={5} fill="#E8C27A" />
          <circle cx={x + 122} cy={612} r={5} fill="#E8C27A" />
        </g>
      ))}
      {/* the window: sill at 1.4 m, so you look out of it and Mira looks up at it */}
      <g transform="translate(0,100)">
        <Window c={c} dark={dark} />
      </g>
      {/* wall clock: 6:51 */}
      <g transform="translate(1100,380) scale(0.66)">
        <circle r={62} fill="#F8F1E4" stroke={INK} strokeWidth={5} />
        {Array.from({length: 12}, (_, i) => (
          <path key={i} d={`M0,-50 L0,-42`} stroke={INK} strokeWidth={3} transform={`rotate(${i * 30})`} />
        ))}
        <path d="M0,0 L0,-40" stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${306 + c.t * 0.1})`} />
        <path d="M0,0 L0,-28" stroke={INK} strokeWidth={6} strokeLinecap="round" transform="rotate(205)" />
        <circle r={5} fill="#D9443A" />
      </g>
      {/* hanging lamp */}
      <path d="M1180,-200 L1180,470" stroke={INK} strokeWidth={3} />
      <path d="M1130,515 Q1180,450 1230,515 Z" fill="#D9443A" stroke={INK} strokeWidth={4} />
      {/* Mira's drawings on the fridge */}
      <rect x={1560} y={930 - M(1.85)} width={M(0.8)} height={M(1.85)} rx={12} fill="#EDEFF1" stroke={INK} strokeWidth={5} />
      <path d={`M1560,${930 - M(1.25)} L${1560 + M(0.8)},${930 - M(1.25)}`} stroke={INK} strokeWidth={4} />
      <rect x={1572} y={930 - M(1.25) - 50} width={10} height={40} rx={4} fill="#B8BEC6" />
      <rect x={1572} y={930 - M(1.25) + 14} width={10} height={70} rx={4} fill="#B8BEC6" />
      {[
        [1625, 610, -6],
        [1690, 700, 5],
        [1630, 790, -3],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(0.72) rotate(${r})`}>
          <rect x={-40} y={-34} width={80} height={68} fill="#FFFDF6" stroke={INK} strokeWidth={2.5} />
          <circle cx={0} cy={-2} r={14} fill="#FFC93C" stroke="#E59A1F" strokeWidth={3} />
          {Array.from({length: 8}, (_, k) => (
            <path key={k} d="M0,-20 L0,-28" stroke="#E59A1F" strokeWidth={3} transform={`translate(0,-2) rotate(${k * 45})`} />
          ))}
          <circle cx={0} cy={-36} r={5} fill={['#D9443A', '#3E7CB1', '#3C8D6E'][i]} />
        </g>
      ))}
      {/* counter */}
      <rect x={-300} y={741} width={980} height={18} fill="#E9E1D2" stroke={INK} strokeWidth={4} />
      <rect x={-300} y={759} width={980} height={171} fill={CAB} stroke={INK} strokeWidth={4} />
      {[-180, 40, 260, 480].map((x) => (
        <g key={x}>
          <rect x={x} y={772} width={190} height={130} rx={6} fill={CAB_D} stroke={INK} strokeWidth={3} />
          <rect x={x + 80} y={782} width={30} height={8} rx={4} fill="#E8C27A" />
        </g>
      ))}
      <rect x={-300} y={906} width={980} height={24} fill="#2E3A36" />
      {/* kettle + toaster on the counter */}
      <g transform="translate(120,741) scale(0.72)">
        <path d="M-40,0 L-34,-70 Q0,-92 34,-70 L40,0 Z" fill="#D9443A" stroke={INK} strokeWidth={4} />
        <path d="M34,-56 Q64,-50 54,-20" stroke={INK} strokeWidth={5} fill="none" />
        <rect x={-10} y={-96} width={20} height={10} rx={4} fill={INK} />
        {!dark && <circle cx={-20} cy={-100 - ((c.frame * 1.2) % 40)} r={8 + ((c.frame * 0.3) % 10)} fill="#FFFFFF" opacity={0.4 * (1 - ((c.frame * 1.2) % 40) / 40)} />}
      </g>
      <g transform="translate(340,741) scale(0.72)">
        <rect x={-56} y={-62} width={112} height={62} rx={10} fill="#8E5E3A" stroke={INK} strokeWidth={4} />
        <circle cx={-24} cy={-31} r={18} fill="#3A2A22" stroke={INK} strokeWidth={3} />
        <rect x={6} y={-48} width={38} height={14} rx={3} fill="#FFD08A" stroke={INK} strokeWidth={2.5} />
        <path d="M30,-62 L60,-110" stroke={INK} strokeWidth={4} />
      </g>
      <g transform="translate(560,741) scale(0.72)">
        <rect x={-60} y={-60} width={120} height={60} rx={14} fill="#C9CED6" stroke={INK} strokeWidth={4} />
        <path d="M-34,-60 L-34,-70 M34,-60 L34,-70" stroke={INK} strokeWidth={6} />
      </g>
      {/* floor */}
      <rect x={-300} y={930} width={2520} height={400} fill={WOOD} />
      {Array.from({length: 14}, (_, i) => (
        <path key={i} d={`M${-300 + i * 190},930 L${-500 + i * 230},1330`} stroke={WOOD_D} strokeWidth={3} />
      ))}
      <rect x={-300} y={924} width={2520} height={10} fill={WOOD_D} />
      {/* rug under the table */}
      <ellipse cx={1160} cy={955} rx={360} ry={38} fill="#3E7CB1" opacity={0.85} />
      <ellipse cx={1160} cy={955} rx={320} ry={28} fill="none" stroke="#F2C94C" strokeWidth={5} strokeDasharray="14 10" />
      {/* Mira's tall stool */}
      <g transform="translate(1180,850)">
        <rect x={-46} y={-10} width={92} height={16} rx={6} fill="#E3A15A" stroke={INK} strokeWidth={4} />
        <path d="M-34,6 L-44,80 M34,6 L44,80 M-38,48 L38,48" stroke={INK} strokeWidth={6} />
      </g>
    </g>
  );
};

const Table: React.FC<{c: SetCtx; dark: boolean}> = ({c, dark}) => {
  const toast = c.p.toast as string | undefined;
  const stolenAt = c.at('l0+1.25', 1.5);
  const toastOnPlate = toast === 'plate' || (toast === 'steal' && c.t < stolenAt) || (!toast && !dark);
  return (
    <g>
      {/* table: in front of Mira (she sits behind it) and above Biscuit (he lurks underneath) */}
      <g>
        <rect x={900} y={778} width={520} height={24} rx={6} fill="#C98E5E" stroke={INK} strokeWidth={4} />
        <path d="M930,802 L930,930 M1390,802 L1390,930" stroke={INK} strokeWidth={14} />
        <path d="M930,802 L930,930 M1390,802 L1390,930" stroke="#A86E42" strokeWidth={8} />
        <g transform="translate(0,-12)">
        {/* breakfast */}
        <ellipse cx={1010} cy={788} rx={56} ry={12} fill="#F4EFE6" stroke={INK} strokeWidth={3.5} />
        {toastOnPlate && (
          <g transform="translate(1010,782)">
            <path d="M-26,0 L-26,-30 Q0,-46 26,-30 L26,0 Z" fill="#E3A15A" stroke={INK} strokeWidth={3.5} />
            <path d="M-18,-4 L-18,-26 Q0,-38 18,-26 L18,-4 Z" fill="#F6D29A" />
          </g>
        )}
        <g transform="translate(1300,786)">
          <rect x={-22} y={-46} width={44} height={46} rx={6} fill="#F2C94C" stroke={INK} strokeWidth={3.5} />
          <path d="M22,-36 Q40,-30 22,-12" stroke={INK} strokeWidth={4} fill="none" />
        </g>
        <g transform="translate(1240,786)">
          <path d="M-40,-20 Q0,22 40,-20 Z" fill="#F4EFE6" stroke={INK} strokeWidth={3.5} />
          <circle cx={-14} cy={-28} r={14} fill="#D9443A" stroke={INK} strokeWidth={3} />
          <circle cx={12} cy={-30} r={13} fill="#F2994A" stroke={INK} strokeWidth={3} />
          <path d="M-2,-40 Q20,-62 34,-44" stroke="#F2C94C" strokeWidth={10} fill="none" strokeLinecap="round" />
        </g>
        {/* the drawing */}
        <g transform="translate(1150,788) rotate(-4)">
          <path d="M-60,-6 L56,-10 L64,4 L-54,8 Z" fill="#FFFDF6" stroke={INK} strokeWidth={2.5} />
          <ellipse cx={0} cy={-1} rx={18} ry={4} fill="#FFC93C" />
        </g>
        </g>
      </g>
    </g>
  );
};

registerSet('kitchen', {
  layers: (c) => {
    const snap = c.p.snap && c.t < 0.1;
    const dark = c.v === 'dark' && !snap;
    return [
      {depth: 1, node: <Room c={c} dark={dark} />},
      {depth: 1, node: <Table c={c} dark={dark} />, front: true},
    ];
  },
  light: (c) => {
    const dark = c.v === 'dark' && !(c.p.snap && c.t < 0.1);
    return dark ? (
      <g>
        <Glow x={520} y={480} r={520} color="#6FA8FF" opacity={0.28} />
      </g>
    ) : (
      <g>
        <Glow x={700} y={600} r={700} color="#FFE6A8" opacity={0.35} />
        <Glow x={1180} y={420} r={300} color="#FFD9A0" opacity={0.25} />
      </g>
    );
  },
  grade: (c) => {
    const dark = c.v === 'dark' && !(c.p.snap && c.t < 0.1);
    return (
      <g>
        <Grade color={dark ? '#14205E' : '#FFF4E0'} amount={dark ? 0.72 : 0.06} />
        <Vignette amount={dark ? 0.7 : 0.35} />
      </g>
    );
  },
});
