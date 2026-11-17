import React from 'react';
import {rand, Stars} from '../../../fx/sky';
import {Glow, Grade, INK, M, registerSet, Vignette, type SetCtx} from '../stage';
import {Telescope} from './roof';

/**
 * The observatory, 1983: the second timeline. A small dome on a mountain, one young astronomer, always at night
 * (so it reads as "now", like the present's endless night) until the reveal, when he walks outside and the Sun
 * rises. Fair-play clues for a second viewing: the CRT, the rotary phone, the reel-to-reel, the calendar, the
 * same brass telescope Mr. Ito owns, the 1919 print on the wall.
 *  room — inside the dome: telescope on its pier, the desk (light table, CRT, Morse key, transmitter), star chart.
 *         floor y = 920.
 *  dish — outside at night: the dome and a 6 m radio dish on the hill, aimed at one bright star. `aim` 0→1 turns it.
 *  dawn — the same hill as the sky brightens; the Sun rises behind the far ridge from `sunrise` seconds.
 */
const DOME = '#2C2A38';

const Room: React.FC<{c: SetCtx}> = ({c}) => {
  const f = c.frame;
  const reel = f * 2.2;
  return (
    <g>
      {/* the dome's curved inner wall and the open slit full of stars */}
      <rect x={-900} y={-400} width={3800} height={1400} fill="#1C1B26" />
      <path d="M-900,920 L-900,300 Q960,-560 2820,300 L2820,920 Z" fill={DOME} stroke={INK} strokeWidth={6} />
      {Array.from({length: 14}, (_, i) => (
        <path key={i} d={`M${-900 + i * 280},920 Q${-900 + i * 280 + (960 - (-900 + i * 280)) * 0.15},${120 - Math.abs(i - 6.5) * 20} ${960 + (i - 6.5) * 60},-200`} stroke="#3A3848" strokeWidth={5} fill="none" />
      ))}
      <clipPath id="obsSlit">
        <path d="M800,-300 L1120,-300 L1080,330 L840,330 Z" />
      </clipPath>
      <g clipPath="url(#obsSlit)">
        <rect x={700} y={-300} width={520} height={700} fill="#060818" />
        <g transform="translate(780,-300)">
          <Stars frame={f} count={90} w={380} h={640} seed={19} maxR={2.6} />
        </g>
      </g>
      <path d="M800,-300 L840,330 M1120,-300 L1080,330" stroke="#4A4858" strokeWidth={16} />
      {/* the telescope on its concrete pier, aimed up through the slit */}
      <rect x={880} y={920 - M(1.0)} width={140} height={M(1.0)} fill="#5E5A6E" stroke={INK} strokeWidth={5} />
      <g transform={`translate(950,${920 - M(1.0) - 4}) scale(1.25) translate(0,-85)`}>
        <Telescope x={0} base={0} up={0.9} />
      </g>
      {/* the wall: star chart, the 1919 print, a calendar half in shadow */}
      <g transform="translate(260,360) rotate(-2)">
        <rect x={-150} y={-110} width={300} height={220} fill="#E9DFC8" stroke={INK} strokeWidth={4} />
        {Array.from({length: 40}, (_, k) => {
          const r = rand(k + 7);
          return <circle key={k} cx={-135 + r() * 270} cy={-95 + r() * 190} r={1.5 + r() * 2.5} fill="#2E3A5C" />;
        })}
        <path d="M-140,-60 Q0,-100 140,-40 M-140,40 Q0,0 140,70" stroke="#9A8C78" strokeWidth={1.5} fill="none" />
      </g>
      {/* three eclipse plates pinned under the chart; red lines drawn up from each, meeting on it */}
      {c.p.plates && (() => {
        const k = Math.min(1, Math.max(0, (c.t - 1.0) / 1.6));
        return (
          <g>
            {[110, 260, 410].map((x, i) => (
              <g key={x} transform={`translate(${x},600) rotate(${[-3, 2, -1][i]})`}>
                <rect x={-58} y={-44} width={116} height={88} fill="#2A2A2E" stroke={INK} strokeWidth={4} />
                <circle r={14} fill="#0A0A0C" />
                <circle r={26} fill="#E8E2D4" opacity={0.25} />
                <path d={`M${-40 + i * 6},${-30 + i * 10} L${40 - i * 4},${30 - i * 12}`} stroke="#F4EFE6" strokeWidth={1.6} opacity={0.8} />
                <circle cx={0} cy={-46} r={6} fill="#C2464F" />
              </g>
            ))}
            {[110, 260, 410].map((x, i) => (
              <path key={`l${x}`} d={`M${x},560 L${x + (300 - x) * k},${560 - 230 * k}`} stroke="#E0453A" strokeWidth={4} />
            ))}
            {k >= 1 && <circle cx={300} cy={330} r={14} fill="none" stroke="#E0453A" strokeWidth={4} />}
          </g>
        );
      })()}
      <g transform="translate(520,330) rotate(1.5)">
        <rect x={-62} y={-50} width={124} height={100} fill="#5A3822" stroke={INK} strokeWidth={4} />
        <rect x={-52} y={-40} width={104} height={80} fill="#3A3836" />
        <circle r={18} fill="#E8E2D4" opacity={0.35} />
        {[18, 74, 142].map((a) => (
          <path key={a} d={`M${Math.cos((a * Math.PI) / 180) * -36},${Math.sin((a * Math.PI) / 180) * -36} L${Math.cos((a * Math.PI) / 180) * 36},${Math.sin((a * Math.PI) / 180) * 36}`} stroke="#F4EFE6" strokeWidth={1.2} opacity={0.75} />
        ))}
        <circle r={9} fill="#0A0A0C" />
      </g>
      <g transform="translate(1720,330)">
        <rect x={-70} y={-90} width={140} height={180} fill="#FFFDF6" stroke={INK} strokeWidth={3} />
        <rect x={-70} y={-90} width={140} height={44} fill="#3E7CB1" />
        <text x={0} y={-58} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize={22} fill="#FFFDF6">
          OCT 1983
        </text>
        {Array.from({length: 28}, (_, k) => (
          <rect key={k} x={-60 + (k % 7) * 18} y={-36 + Math.floor(k / 7) * 26} width={12} height={12} fill="#C9CED6" />
        ))}
        {/* half of it lost in the dark until the light finds it */}
        <rect x={-74} y={-94} width={148} height={188} fill="#0E0D14" opacity={c.p.calendarLit ? 0 : 0.8} />
      </g>
      {/* the desk */}
      <rect x={1180} y={920 - M(0.76)} width={760} height={24} fill="#7A4E30" stroke={INK} strokeWidth={5} />
      <path d={`M1210,${920 - M(0.76) + 24} L1210,920 M1910,${920 - M(0.76) + 24} L1910,920`} stroke={INK} strokeWidth={14} />
      {/* light table with an eclipse plate */}
      <g transform={`translate(1290,${920 - M(0.76)})`}>
        <rect x={-80} y={-26} width={160} height={26} fill="#3A3442" stroke={INK} strokeWidth={4} />
        <rect x={-70} y={-24} width={140} height={10} fill="#FFF6DA" />
      </g>
      {/* CRT terminal with green text */}
      <g transform={`translate(1480,${920 - M(0.76)})`}>
        <rect x={-90} y={-170} width={180} height={170} rx={14} fill="#C9C0A8" stroke={INK} strokeWidth={5} />
        <rect x={-72} y={-152} width={144} height={110} rx={10} fill="#0A1A0E" />
        {Array.from({length: 6}, (_, k) => (
          <rect key={k} x={-62} y={-142 + k * 16} width={40 + ((k * 37 + Math.floor(f / 6)) % 80)} height={7} fill="#5BFF8A" opacity={0.8} />
        ))}
        <rect x={-62 + ((Math.floor(f / 15) % 2) ? 90 : 0)} y={-142 + 5 * 16} width={8} height={9} fill="#5BFF8A" />
        <rect x={-100} y={-20} width={200} height={20} rx={4} fill="#B8AE96" stroke={INK} strokeWidth={4} />
      </g>
      {/* reel-to-reel tape */}
      <g transform={`translate(1700,${920 - M(0.76)})`}>
        <rect x={-80} y={-150} width={160} height={150} rx={8} fill="#3A3442" stroke={INK} strokeWidth={4} />
        {[-38, 38].map((x) => (
          <g key={x} transform={`translate(${x},-95) rotate(${reel})`}>
            <circle r={30} fill="#1A1820" stroke="#8A8F9C" strokeWidth={4} />
            {[0, 120, 240].map((a) => (
              <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 15} cy={Math.sin((a * Math.PI) / 180) * 15} r={6} fill="#8A8F9C" />
            ))}
          </g>
        ))}
      </g>
      {/* rotary phone */}
      <g transform={`translate(1860,${920 - M(0.76)})`}>
        <path d="M-50,0 L-40,-46 L40,-46 L50,0 Z" fill="#C2464F" stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-26} r={16} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
        {!c.p.phoneUp && <path d="M-56,-56 Q0,-80 56,-56 L50,-46 L-50,-46 Z" fill="#A83A42" stroke={INK} strokeWidth={4} />}
        {c.p.phoneUp && <path d="M-40,-46 q-30,-10 -60,-40 q-20,-30 -60,-50" stroke={INK} strokeWidth={4} fill="none" strokeDasharray="6 5" />}
      </g>
      {/* transmitter rack + Morse key on the desk edge */}
      <g transform={`translate(1580,${920 - M(0.76)})`}>
        <rect x={-30} y={-14} width={60} height={14} fill="#2A2E3A" stroke={INK} strokeWidth={3} />
        <path d={`M-20,-14 L24,${-24 - (c.p.keyDown ? 0 : 6)}`} stroke="#B8BEC6" strokeWidth={6} strokeLinecap="round" />
        <circle cx={26} cy={-26 - (c.p.keyDown ? 0 : 6)} r={7} fill="#1A1820" />
      </g>
      <rect x={1980} y={920 - M(1.6)} width={220} height={M(1.6)} fill="#3A3F52" stroke={INK} strokeWidth={5} />
      {Array.from({length: 4}, (_, k) => (
        <g key={k}>
          <circle cx={2030 + (k % 2) * 110} cy={920 - M(1.4) + Math.floor(k / 2) * 90} r={22} fill="#1A1820" stroke="#8A8F9C" strokeWidth={4} />
          <path d={`M${2030 + (k % 2) * 110},${920 - M(1.4) + Math.floor(k / 2) * 90} l${Math.cos(f * 0.05 + k) * 16},${-12}`} stroke="#FFB25A" strokeWidth={3} />
        </g>
      ))}
      {/* desk lamp */}
      <g transform={`translate(1380,${920 - M(0.76)})`}>
        <path d="M0,0 L0,-12 L-30,-130 L40,-170" stroke="#2A2E3A" strokeWidth={8} fill="none" />
        <path d="M20,-190 L80,-150 L50,-120 Z" fill="#3E7CB1" stroke={INK} strokeWidth={4} />
      </g>
      {/* floor */}
      <rect x={-900} y={920} width={3800} height={500} fill="#3A3442" />
      {Array.from({length: 26}, (_, i) => (
        <path key={i} d={`M${-900 + i * 150},920 L${-1100 + i * 190},1420`} stroke="#2E2A36" strokeWidth={3} />
      ))}
    </g>
  );
};

/** The hill, the dome and the dish. `dawn` 0→1 brightens the sky and raises the Sun behind the ridge. */
const Hill: React.FC<{c: SetCtx; dawn: number}> = ({c, dawn}) => {
  const aim = c.p.turn ? Math.min(1, Math.max(0, (c.t - 0.3) / 2.2)) : ((c.p.aim as number) ?? 1);
  const ang = -62 + 30 * (1 - aim); // dish elevation toward the star
  const sunY = 900 - 260 * dawn;
  const sky = (a: string, b: string) => {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const mix = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - dawn) + ((pb >> sh) & 255) * dawn);
    return `rgb(${mix(16)},${mix(8)},${mix(0)})`;
  };
  return (
    <g>
      <defs>
        <linearGradient id="obsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky('#02030C', '#3E6CB8')} />
          <stop offset="0.6" stopColor={sky('#0A1036', '#F4B86A')} />
          <stop offset="1" stopColor={sky('#1E2A55', '#FFE2A0')} />
        </linearGradient>
      </defs>
      <rect x={-900} y={-500} width={3800} height={1600} fill="url(#obsSky)" />
      <g opacity={1 - dawn * 0.95}>
        <Stars frame={c.frame} count={520} w={3400} h={1200} seed={41} maxR={2.6} y0={-500} />
      </g>
      {/* the one star he is aiming at */}
      <g opacity={1 - dawn}>
        <circle cx={1500} cy={140} r={5} fill="#FFFFFF" />
        <circle cx={1500} cy={140} r={18} fill="#BFD8FF" opacity={0.25 + 0.1 * Math.sin(c.frame * 0.2)} />
      </g>
      {dawn > 0 && (
        <g>
          <circle cx={1300} cy={sunY} r={300} fill="#FFE9A8" opacity={0.35 * dawn} />
          <circle cx={1300} cy={sunY} r={110} fill="#FFF6D6" />
          <circle cx={1300} cy={sunY} r={70} fill="#FFFDF4" />
        </g>
      )}
      {/* far ridges */}
      <path d="M-900,820 L-500,640 L-200,760 L200,600 L600,740 L1000,620 L1400,760 L1800,640 L2200,760 L2820,660 L2820,1400 L-900,1400 Z" fill={sky('#141A33', '#6A5A7A')} />
      <path d="M-900,900 Q300,760 960,820 Q1600,880 2820,780 L2820,1400 L-900,1400 Z" fill={sky('#0E1226', '#3A3046')} />
      {/* the dome */}
      <g transform="translate(560,860)">
        <rect x={-150} y={-160} width={300} height={160} fill={sky('#C9CED6', '#E9E4DA')} stroke={INK} strokeWidth={5} />
        <path d="M-160,-160 A160,160 0 0 1 160,-160 Z" fill={sky('#DCE2EA', '#FFF4E0')} stroke={INK} strokeWidth={5} />
        <path d="M-22,-316 L22,-316 L26,-160 L-26,-160 Z" fill="#141826" />
        <rect x={-30} y={-90} width={60} height={90} fill={dawn > 0.2 ? '#3A3442' : '#FFD58A'} stroke={INK} strokeWidth={4} />
      </g>
      {/* the radio dish on its mount */}
      <g transform="translate(1160,860)">
        <path d="M-40,0 L0,-150 L40,0 Z" fill="#8A8F9C" stroke={INK} strokeWidth={5} />
        <g transform={`translate(0,-150) rotate(${ang})`}>
          <path d="M-150,-20 Q0,90 150,-20 Q0,30 -150,-20 Z" fill={sky('#DCE2EA', '#FFF4E0')} stroke={INK} strokeWidth={5} />
          <path d="M0,40 L0,-110" stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={-114} r={9} fill="#3A3442" />
          <path d="M-110,-6 L0,-110 L110,-6" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
        </g>
      </g>
      {/* a little cable hut light */}
      <rect x={1340} y={820} width={70} height={40} fill={sky('#5E5A6E', '#8A7A6A')} stroke={INK} strokeWidth={3} />
    </g>
  );
};

registerSet('observatory', {
  layers: (c) => {
    if (c.v === 'room') return [{depth: 1, node: <Room c={c} />}];
    const dawn = c.v === 'dawn' ? Math.min(1, Math.max(0, (c.t - c.at(c.p.sunrise, 0.6)) / 2.6)) : 0;
    return [{depth: 1, node: <Hill c={c} dawn={dawn} />}];
  },
  light: (c) =>
    c.v === 'room' ? (
      <g>
        <Glow x={1420} y={720} r={420} color="#FFD08A" opacity={0.45} />
        <Glow x={1290} y={690} r={160} color="#FFF6DA" opacity={0.4} />
        <Glow x={1480} y={700} r={160} color="#5BFF8A" opacity={0.12} />
      </g>
    ) : c.v === 'dawn' ? (
      <Glow x={1300} y={700} r={1100} color="#FFD27A" opacity={0.4 * Math.min(1, Math.max(0, (c.t - c.at(c.p.sunrise, 0.6)) / 2.6))} />
    ) : (
      <Glow x={560} y={790} r={160} color="#FFD58A" opacity={0.3} />
    ),
  grade: (c) => {
    const dawn = c.v === 'dawn' ? Math.min(1, Math.max(0, (c.t - c.at(c.p.sunrise, 0.6)) / 2.6)) : 0;
    return (
      <g>
        <Grade color={dawn > 0 ? '#FFF0D0' : '#3A2E5E'} amount={dawn > 0 ? 0.08 : 0.25} />
        <Vignette amount={0.55} />
      </g>
    );
  },
  handheld: 0.3,
});
