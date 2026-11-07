import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Frost, Aurora} from '../../fx/cinema/atmos';
import {DRAWING, ReplyPicture} from './reply';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {Glow, Grade, INK, M, registerSet, useSetCtx, Vignette} from './stage';

/**
 * Inserts: the objects the narration names (phone, watch, thermometer, pipe, radio, the frost sun, paw prints),
 * plus the three sunlit "somewhere else" vignettes of the cold open (registered as stage sets so they get a cast).
 */
const W = 1920;
const H = 1080;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);

const Bokeh: React.FC<{frame: number; cols: string[]; n?: number; seed?: number}> = ({frame, cols, n = 14, seed = 1}) => (
  <g filter="url(#bk)">
    <defs>
      <filter id="bk">
        <feGaussianBlur stdDeviation={18} />
      </filter>
    </defs>
    {Array.from({length: n}, (_, i) => {
      const k = Math.sin(seed * 13 + i * 7.1) * 0.5 + 0.5;
      return <circle key={i} cx={(i * 263 + seed * 97) % W} cy={(i * 179 + seed * 41) % H} r={40 + k * 90} fill={cols[i % cols.length]} opacity={0.25 + 0.15 * Math.sin(frame * 0.03 + i)} />;
    })}
  </g>
);

export const CloseupScene: React.FC = () => {
  const c = useSetCtx();
  const v = c.v;
  const f = c.frame;
  const t = c.t;
  const p = t / c.dur;
  const z = interpolate(p, [0, 1], [1, 1.08], {easing: ease});
  const wrap = (bg: string, children: React.ReactNode, grade?: React.ReactNode) => (
    <AbsoluteFill style={{background: bg}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <g transform={`translate(960,540) scale(${z}) translate(-960,-540)`}>{children}</g>
        {grade}
        <Vignette amount={0.6} />
      </svg>
    </AbsoluteFill>
  );

  if (v === 'phone') {
    const bars = Math.max(0, 4 - Math.floor(t / 0.3));
    return wrap(
      '#0A0E22',
      <g>
        <Bokeh frame={f} cols={['#FFD58A', '#6FA8FF', '#FFB25A']} seed={3} />
        {/* hand + phone */}
        <path d="M700,1200 Q680,860 760,760 L1160,760 Q1240,860 1220,1200 Z" fill="#A06A44" stroke={INK} strokeWidth={8} />
        <rect x={720} y={160} width={480} height={880} rx={60} fill="#1A1E2A" stroke={INK} strokeWidth={10} />
        <rect x={750} y={200} width={420} height={800} rx={36} fill="#DCEBFF" />
        <rect x={750} y={200} width={420} height={800} rx={36} fill="#BFD6F6" opacity={0.5} />
        {/* status bar: signal bars dropping to nothing */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={790 + i * 22} y={260 - i * 10} width={14} height={20 + i * 10} rx={3} fill={i < bars ? '#1A1E2A' : '#9AA8BE'} />
        ))}
        <text x={960} y={600} textAnchor="middle" fontFamily={fonts.ui} fontWeight={800} fontSize={58} fill="#1A1E2A">
          {bars > 0 ? 'Calling…' : 'No service'}
        </text>
        <circle cx={960} cy={820} r={56} fill="#D9443A" />
        <path d="M930,820 L990,820" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" />
        <Glow x={960} y={600} r={600} color="#DCEBFF" opacity={0.25} />
      </g>,
    );
  }

  if (v === 'watch') {
    const temp = c.p.temp as [number, number];
    const k = clamp((t - 1.2) / 0.2);
    const val = (temp[0] + (temp[1] - temp[0]) * Math.round(k * 3) / 3).toFixed(1);
    return wrap(
      '#0B1230',
      <g>
        <Bokeh frame={f} cols={['#9FB7FF', '#3E5C8A', '#C9D6FF']} seed={5} />
        {/* orange sleeve + wrist */}
        <path d="M-100,820 Q600,700 1100,760 L1100,1200 L-100,1200 Z" fill="#F08A2C" stroke={INK} strokeWidth={8} />
        <path d="M1100,760 Q1500,740 2100,800 L2100,1200 L1100,1200 Z" fill="#A06A44" stroke={INK} strokeWidth={8} />
        <rect x={1180} y={560} width={120} height={600} rx={20} fill="#3A3F52" stroke={INK} strokeWidth={6} />
        <rect x={1060} y={460} width={360} height={360} rx={70} fill="#C9CED6" stroke={INK} strokeWidth={10} />
        <rect x={1100} y={500} width={280} height={280} rx={46} fill="#1A2A22" />
        <text x={1240} y={620} textAnchor="middle" fontFamily={fonts.mono} fontWeight={600} fontSize={72} fill="#9FE8FF">
          {c.p.time as string}
        </text>
        <text x={1240} y={720} textAnchor="middle" fontFamily={fonts.mono} fontWeight={600} fontSize={60} fill={k > 0 ? '#FF9E7A' : '#9FE8FF'}>
          {val}°
        </text>
        <Glow x={1240} y={640} r={260} color="#9FE8FF" opacity={0.25} />
        {k > 0 && k < 1 && <rect x={1100} y={680} width={280} height={60} fill="#FF9E7A" opacity={0.25} />}
      </g>,
    );
  }

  if (v === 'thermo') {
    const level = interpolate(p, [0, 1], [0.62, 0.5]);
    return wrap(
      '#0A1028',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#0C1430" />
        <Stars frame={f} count={160} w={W} h={H} seed={4} />
        {/* balcony rail with frost and the thermometer */}
        <rect x={0} y={760} width={W} height={50} fill="#8A8F9C" stroke={INK} strokeWidth={6} />
        {Array.from({length: 14}, (_, i) => (
          <rect key={i} x={i * 150} y={810} width={20} height={300} fill="#8A8F9C" stroke={INK} strokeWidth={4} />
        ))}
        <g transform="translate(960,120)">
          <rect x={-90} y={0} width={180} height={720} rx={40} fill="#F4EFE6" stroke={INK} strokeWidth={8} />
          <rect x={-18} y={60} width={36} height={560} rx={18} fill="#E8ECEF" stroke={INK} strokeWidth={4} />
          <rect x={-14} y={60 + 560 * (1 - level)} width={28} height={560 * level} rx={14} fill="#D9443A" />
          <circle cx={0} cy={640} r={42} fill="#D9443A" stroke={INK} strokeWidth={5} />
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d={`M30,${80 + i * 45} L${i % 2 ? 50 : 62},${80 + i * 45}`} stroke={INK} strokeWidth={4} />
          ))}
          <path d={`M-14,${60 + 560 * (1 - level)} L-60,${60 + 560 * (1 - level)}`} stroke="#9FD8FF" strokeWidth={6} strokeDasharray="8 6" />
        </g>
        <g transform="translate(0,700)">
          <Frost amount={0.4 + p * 0.2} w={W} h={380} seed={11} />
        </g>
      </g>,
      <Grade color="#2A3A8A" amount={0.2} />,
    );
  }

  if (v === 'pipe') {
    const frost = clamp(p * 1.3);
    return wrap(
      '#1A1A22',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#C9B79C" />
        {Array.from({length: 30}, (_, i) => (
          <path key={i} d={`M0,${i * 40} L${W},${i * 40}`} stroke="#B2A084" strokeWidth={3} opacity={0.4} />
        ))}
        <path d="M-100,520 L1300,520 Q1400,520 1400,620 L1400,1200" stroke="#B87333" strokeWidth={110} fill="none" />
        <path d="M-100,520 L1300,520 Q1400,520 1400,620 L1400,1200" stroke={INK} strokeWidth={6} fill="none" opacity={0.4} />
        <path d="M-100,490 L1300,490" stroke="#E0A060" strokeWidth={14} opacity={0.6} />
        {/* frost creeping along the pipe from the left */}
        <rect x={-100} y={460} width={1500 * frost} height={120} fill="#E8F4FF" opacity={0.75} />
        {Array.from({length: 26}, (_, i) =>
          i / 26 < frost ? <path key={i} d={`M${-60 + i * 56},${470} l12,-26 m-12,26 l-14,-22 M${-50 + i * 56},${570} l10,22`} stroke="#FFFFFF" strokeWidth={4} /> : null,
        )}
        {/* a drip that freezes mid-fall */}
        <ellipse cx={1400} cy={interpolate(p, [0, 0.6], [700, 820], {extrapolateRight: 'clamp'})} rx={16} ry={22} fill={p > 0.6 ? '#E8F4FF' : '#9FD8FF'} stroke={INK} strokeWidth={3} />
      </g>,
      <Grade color="#2A3A8A" amount={0.2} />,
    );
  }

  if (v === 'radio') {
    return wrap(
      '#160E0C',
      <g>
        <Bokeh frame={f} cols={['#FFB25A', '#FF8A3A', '#FFD08A']} seed={8} />
        <rect x={0} y={760} width={W} height={400} fill="#F8F1E4" opacity={0.15} />
        <g transform="translate(960,620)">
          <rect x={-420} y={-280} width={840} height={440} rx={50} fill="#8E5E3A" stroke={INK} strokeWidth={10} />
          <circle cx={-190} cy={-60} r={150} fill="#3A2A22" stroke={INK} strokeWidth={8} />
          {Array.from({length: 7}, (_, i) => (
            <path key={i} d={`M${-300},${-160 + i * 34} L${-80},${-160 + i * 34}`} stroke="#5A4034" strokeWidth={8} />
          ))}
          <rect x={30} y={-200} width={320} height={110} rx={14} fill="#FFD08A" stroke={INK} strokeWidth={6} />
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d={`M${54 + i * 24},-180 L${54 + i * 24},${i % 3 ? -160 : -150}`} stroke="#8E5E3A" strokeWidth={3} />
          ))}
          <path d={`M${190 + Math.sin(f * 0.05) * 6},-196 L${190 + Math.sin(f * 0.05) * 6},-94`} stroke="#D9443A" strokeWidth={5} />
          <circle cx={110} cy={20} r={46} fill="#5A4034" stroke={INK} strokeWidth={6} />
          <circle cx={270} cy={20} r={46} fill="#5A4034" stroke={INK} strokeWidth={6} />
          <path d="M300,-280 L420,-560" stroke="#C9CED6" strokeWidth={10} />
          <Glow x={190} y={-145} r={260} color="#FFD08A" opacity={0.4} />
        </g>
        {/* sound */}
        {[0, 1, 2].map((i) => {
          const ph = ((f * 1.5 + i * 30) % 90) / 90;
          return <path key={i} d={`M${560 - ph * 160},${420 - ph * 120} Q${480 - ph * 200},${560} ${560 - ph * 160},${700 + ph * 120}`} stroke="#FFD08A" strokeWidth={6} fill="none" opacity={(1 - ph) * 0.6} />;
        })}
      </g>,
    );
  }

  if (v === 'frostSun') {
    const draw = clamp((t - 0.3) / 2.2);
    const rays = 9;
    return (
      <AbsoluteFill style={{background: '#02040C'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(960,540) scale(${z}) translate(-960,-540)`}>
            <rect x={0} y={0} width={W} height={H} fill="#03081A" />
            <Stars frame={f} count={300} w={W} h={H} seed={14} />
            <Aurora frame={f} y={760} intensity={1.1} seed={7} />
            <Frost amount={1} seed={19} />
            <rect x={0} y={0} width={W} height={H} fill="#DCEBFA" opacity={0.42} />
            {/* the drawn sun: frost wiped away, so the aurora shows through the lines */}
            <g stroke="#03081A" strokeWidth={34} strokeLinecap="round" fill="none" opacity={0.8}>
              <circle cx={960} cy={500} r={150} strokeDasharray={`${Math.PI * 300 * clamp(draw * 1.6)} 2000`} />
              {Array.from({length: rays}, (_, i) => {
                if (i / rays > clamp((draw - 0.6) / 0.4)) return null;
                const a = (i / rays) * Math.PI * 2 - Math.PI / 2;
                return <path key={i} d={`M${960 + Math.cos(a) * 200},${500 + Math.sin(a) * 200} L${960 + Math.cos(a) * 290},${500 + Math.sin(a) * 290}`} />;
              })}
            </g>
          </g>
          <Vignette amount={0.65} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (v === 'calendar') {
    // The kitchen calendar in candlelight. Its pages flip on their own, a whole year of them, and stop on one
    // date circled in red: the day you will know.
    const MONTHS = ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
    const flip = clamp(t / Math.max(1.2, c.dur * 0.55)) * 12;
    const m = Math.min(12, Math.floor(flip));
    const frac = m < 12 ? flip - m : 0;
    const ring = clamp((t - c.dur * 0.55 - 0.15) / 0.6);
    const page = (k: number, sy = 1) => (
      <g transform={`translate(960,190) scale(1,${sy}) translate(-960,-190)`}>
        <rect x={600} y={190} width={720} height={790} rx={10} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
        <rect x={600} y={190} width={720} height={150} fill="#D9443A" stroke={INK} strokeWidth={6} />
        <text x={960} y={300} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={96} fill="#FFFDF6" letterSpacing={8}>
          {MONTHS[k]}
        </text>
        {Array.from({length: 35}, (_, d) => {
          const day = d + 1;
          if (day > 30) return null;
          const x = 650 + (d % 7) * 98;
          const y = 400 + Math.floor(d / 7) * 112;
          return (
            <text key={d} x={x + 30} y={y + 60} textAnchor="middle" fontFamily={fonts.ui} fontWeight={700} fontSize={44} fill={k === 12 && day === 13 ? '#D9443A' : '#3A3442'} opacity={0.85}>
              {day}
            </text>
          );
        })}
      </g>
    );
    return wrap(
      '#0A0E22',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#2A2238" />
        {Array.from({length: 40}, (_, i) => (
          <rect key={i} x={i * 56} y={0} width={22} height={H} fill="#211B2E" opacity={0.6} />
        ))}
        <rect x={610} y={200} width={720} height={790} rx={10} fill="#000" opacity={0.35} />
        {page(Math.min(12, m + 1))}
        {frac > 0 ? page(m, Math.max(0.02, 1 - frac)) : page(m)}
        {/* spiral binding */}
        {Array.from({length: 14}, (_, i) => (
          <g key={i}>
            <rect x={632 + i * 49} y={170} width={14} height={44} rx={7} fill="#B8BEC6" stroke={INK} strokeWidth={3} />
          </g>
        ))}
        <circle cx={960} cy={150} r={12} fill="#5A5E6A" stroke={INK} strokeWidth={3} />
        {/* the red ring, drawn by hand, around the 13th of next June */}
        {m === 12 && ring > 0 && (
          <g>
            <ellipse cx={1170} cy={556} rx={58} ry={48} fill="none" stroke="#D9443A" strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-8,1170,556)" />
            <text x={1232} y={510} fontFamily={fonts.display} fontWeight={900} fontSize={70} fill="#D9443A" opacity={clamp(ring * 2 - 1)} transform="rotate(12,1232,510)">
              ?
            </text>
          </g>
        )}
        <Glow x={360} y={900} r={700} color="#FFB867" opacity={0.3 + 0.05 * Math.sin(f * 0.4)} />
      </g>,
      <Grade color="#2A3A8A" amount={0.18} />,
    );
  }

  // ── the 1982 thread ─────────────────────────────────────────────────────────────────────────
  if (v === 'morse') {
    // a young hand on a Morse key in lamplight: tap … tap-tap … tap-tap-tap (times in c.p.taps, seconds)
    const taps = (c.p.taps as number[]) ?? [0.5, 1.4, 1.62, 2.5, 2.72, 2.94];
    const down = taps.some((tt) => t >= tt && t < tt + 0.11);
    return wrap(
      '#100E16',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#16131E" />
        <rect x={0} y={640} width={W} height={440} fill="#5A3822" />
        {Array.from({length: 8}, (_, k) => (
          <path key={k} d={`M0,${660 + k * 52} L${W},${640 + k * 56}`} stroke="#4A2E1C" strokeWidth={4} />
        ))}
        {/* the key */}
        <rect x={720} y={700} width={520} height={60} rx={10} fill="#2A2E3A" stroke={INK} strokeWidth={6} />
        <g transform={`rotate(${down ? 3 : 0},780,700)`}>
          <path d="M780,690 L1180,640" stroke="#C9CED6" strokeWidth={22} strokeLinecap="round" />
          <circle cx={1190} cy={636} r={42} fill="#1A1820" stroke={INK} strokeWidth={6} />
        </g>
        {/* the hand and the brown wool cuff */}
        <g transform={`translate(${down ? 0 : 0},${down ? 14 : 0})`}>
          <path d="M1700,420 Q1450,470 1300,560 L1350,640 Q1500,600 1800,560 Z" fill="#8A6A4A" stroke={INK} strokeWidth={8} />
          <path d="M1330,560 Q1240,580 1200,610 Q1180,640 1210,650 Q1260,640 1290,630 L1380,640 Z" fill="#E8C4A2" stroke={INK} strokeWidth={6} />
        </g>
        {down && <circle cx={1500} cy={260} r={40} fill="#FF5A3A" opacity={0.9} />}
        <circle cx={1500} cy={260} r={40} fill="none" stroke="#5A2A22" strokeWidth={6} />
        <Glow x={1300} y={420} r={700} color="#FFD08A" opacity={0.35} />
      </g>,
    );
  }

  if (v === 'plate') {
    // an old eclipse plate on a light table, under a magnifier; a red pen circles one line that is far too straight
    const ring = clamp((t - (c.at(c.p.circle, 1.0) ?? 1.0)) / 0.8);
    return wrap(
      '#0E0D14',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#FFF6DA" />
        <rect x={360} y={120} width={1200} height={840} fill="#2C2A28" stroke={INK} strokeWidth={8} />
        <defs>
          <radialGradient id="corona1919">
            <stop offset="0.18" stopColor="#F4EFE6" stopOpacity={0.85} />
            <stop offset="0.5" stopColor="#C9C3B8" stopOpacity={0.3} />
            <stop offset="1" stopColor="#2C2A28" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={960} cy={540} r={330} fill="url(#corona1919)" />
        {[18, 74, 142].map((a, i) => (
          <path key={a} d={`M${960 - Math.cos((a * Math.PI) / 180) * 380},${540 - Math.sin((a * Math.PI) / 180) * 380} L${960 + Math.cos((a * Math.PI) / 180) * 380},${540 + Math.sin((a * Math.PI) / 180) * 380}`} stroke="#F4EFE6" strokeWidth={2.5} opacity={i === 0 ? 0.85 : 0.5} />
        ))}
        <circle cx={960} cy={540} r={70} fill="#050506" />
        <text x={400} y={930} fontFamily={fonts.mono} fontSize={28} fill="#C9C3B8">
          SOBRAL · 29 MAY 1919 · PLATE 4
        </text>
        {ring > 0 && <ellipse cx={1260} cy={636} rx={150} ry={64} fill="none" stroke="#E0302A" strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(18,1260,636)" />}
        {/* magnifier */}
        <g transform={`translate(${1150 + Math.sin(f * 0.03) * 30},${600 + Math.cos(f * 0.025) * 20})`}>
          <circle r={190} fill="#FFFFFF" opacity={0.08} stroke="#3A3442" strokeWidth={22} />
          <path d="M134,134 L300,300" stroke="#3A3442" strokeWidth={36} strokeLinecap="round" />
        </g>
      </g>,
    );
  }

  if (v === 'chart') {
    // three plates' lines, extended across a star chart, meet at one faint star; he writes "22" and taps it 3×
    const draw = clamp((t - 0.3) / 1.6);
    const write = clamp((t - 2.0) / 0.6);
    const star: [number, number] = [1240, 360];
    const from: [number, number][] = [[200, 900], [520, 1040], [1900, 980]];
    return wrap(
      '#0E0D14',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#E9DFC8" />
        {Array.from({length: 160}, (_, k) => {
          const x = (k * 263.7) % W;
          const y = (k * 181.3) % H;
          return <circle key={k} cx={x} cy={y} r={2 + ((k * 7) % 5)} fill="#2E3A5C" opacity={0.75} />;
        })}
        {Array.from({length: 9}, (_, k) => (
          <path key={k} d={`M0,${k * 140} Q960,${k * 140 - 60} ${W},${k * 140}`} stroke="#B8AC96" strokeWidth={2} fill="none" />
        ))}
        {from.map(([x, y], i) => (
          <path key={i} d={`M${x},${y} L${x + (star[0] - x) * draw},${y + (star[1] - y) * draw}`} stroke="#E0302A" strokeWidth={6} strokeLinecap="round" />
        ))}
        <circle cx={star[0]} cy={star[1]} r={9} fill="#2E3A5C" />
        {draw >= 1 && <circle cx={star[0]} cy={star[1]} r={34} fill="none" stroke="#E0302A" strokeWidth={6} />}
        {write > 0 && (
          <text x={star[0] + 60} y={star[1] - 30} fontFamily="'Caveat', 'Comic Sans MS', cursive" fontWeight={700} fontSize={110} fill="#E0302A" opacity={write}>
            21
          </text>
        )}
      </g>,
    );
  }

  if (v === 'letter') {
    return wrap(
      '#0E0D14',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#3A2E24" />
        <g transform="rotate(-3,960,540)">
          <rect x={520} y={60} width={880} height={1000} fill="#FBF6EA" stroke={INK} strokeWidth={6} />
          <text x={600} y={170} fontFamily={fonts.mono} fontSize={30} fill="#2A2A2A">
            NATIONAL ASTRONOMY COUNCIL
          </text>
          <text x={600} y={260} fontFamily={fonts.mono} fontSize={26} fill="#2A2A2A">
            Dear Dr. Ito,
          </text>
          {['We have reviewed your proposal concerning', '"artificial structures" in the solar corona.', '', 'The Council cannot support further', 'observations, nor any transmission.', '', 'We would gently suggest a rest.'].map((l, k) => (
            <text key={k} x={600} y={330 + k * 48} fontFamily={fonts.mono} fontSize={26} fill="#2A2A2A">
              {l}
            </text>
          ))}
        </g>
        {/* his thumb covers the name until the reveal */}
        {!c.p.showName && (
          <g>
            {/* brown wool cuff and the back of the hand, from the lower left */}
            <path d="M300,700 Q420,520 560,420 L640,520 Q520,600 430,760 Z" fill="#8A6A4A" stroke={INK} strokeWidth={6} />
            <path d="M560,420 Q620,360 690,330 Q720,360 700,400 Q680,450 640,520 Z" fill="#E8C4A2" stroke={INK} strokeWidth={6} />
            {/* the thumb, lying across the name */}
            <path d="M650,350 Q700,236 820,232 Q870,236 864,270 Q856,300 800,302 Q740,306 700,380 Z" fill="#E8C4A2" stroke={INK} strokeWidth={6} />
            <path d="M800,246 Q846,244 852,268 Q846,290 810,290 Q790,276 800,246 Z" fill="#F6DCC6" stroke={INK} strokeWidth={3} />
            <path d="M742,262 q-8,16 0,32" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
          </g>
        )}
        <Glow x={960} y={400} r={700} color="#FFD08A" opacity={0.3} />
      </g>,
    );
  }

  if (v === 'photo1919') {
    // the same print, in Mr. Ito's hand, in the station, 44 years later
    return wrap(
      '#0B0E1C',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#1A1E2E" />
        <g transform={`rotate(${-2 + Math.sin(f * 0.02)},960,540)`}>
          <rect x={460} y={150} width={1000} height={760} fill="#F4EFE6" stroke={INK} strokeWidth={8} />
          <rect x={510} y={200} width={900} height={620} fill="#2C2A28" />
          <defs>
            <radialGradient id="corona1919b">
              <stop offset="0.2" stopColor="#F4EFE6" stopOpacity={0.85} />
              <stop offset="1" stopColor="#2C2A28" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={960} cy={510} r={260} fill="url(#corona1919b)" />
          {[18, 74, 142].map((a) => (
            <path key={a} d={`M${960 - Math.cos((a * Math.PI) / 180) * 300},${510 - Math.sin((a * Math.PI) / 180) * 300} L${960 + Math.cos((a * Math.PI) / 180) * 300},${510 + Math.sin((a * Math.PI) / 180) * 300}`} stroke="#F4EFE6" strokeWidth={2.5} opacity={0.8} />
          ))}
          <circle cx={960} cy={510} r={56} fill="#050506" />
          <text x={960} y={880} textAnchor="middle" fontFamily="'Caveat', 'Comic Sans MS', cursive" fontSize={44} fill="#5A4632">
            Sobral, 1919
          </text>
        </g>
        {/* his hand at the print's corner: fingers behind it, the thumb on the front edge, green coat sleeve */}
        <path d="M0,1080 L0,880 Q160,840 300,960 L360,1080 Z" fill="#3E5C4A" stroke={INK} strokeWidth={6} />
        <path d="M250,960 Q330,860 430,830 Q480,840 476,880 Q440,930 380,990 Z" fill="#E8C4A2" stroke={INK} strokeWidth={6} />
        <path d="M430,840 Q470,800 520,808 Q548,820 534,846 Q500,866 462,872 Z" fill="#E8C4A2" stroke={INK} strokeWidth={6} />
        <path d="M498,812 Q530,814 534,836 Q520,850 500,846 Q490,830 498,812 Z" fill="#F6DCC6" stroke={INK} strokeWidth={3} />
        <Glow x={960} y={500} r={700} color="#FFD08A" opacity={0.25} />
      </g>,
    );
  }

  if (v === 'gauge') {
    // the harbour tide gauge in torchlight: the water sits exactly on the predicted mark
    const lap = Math.sin(f * 0.12) * 6;
    const level = 560 + lap - 70 * Math.max(0, 1 - t / 1.4) ** 2; // settling down onto the mark
    return wrap(
      '#05070F',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#06091A" />
        <rect x={0} y={0} width={W} height={H} fill="url(#gaugeBeam)" />
        <defs>
          <radialGradient id="gaugeBeam" cx="0.5" cy="0.45" r="0.5">
            <stop offset="0" stopColor="#FFF4D6" stopOpacity={0.35} />
            <stop offset="1" stopColor="#FFF4D6" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the stone quay wall */}
        {Array.from({length: 7}, (_, r) =>
          Array.from({length: 9}, (_, k) => <rect key={`${r}-${k}`} x={k * 240 - (r % 2) * 120} y={r * 160} width={232} height={152} fill="#3A3D4A" stroke="#2A2D38" strokeWidth={6} />),
        )}
        {/* the painted gauge board, metres */}
        <rect x={820} y={60} width={280} height={1000} fill="#F4EFE6" stroke={INK} strokeWidth={8} />
        {Array.from({length: 11}, (_, k) => (
          <g key={k}>
            <rect x={820} y={60 + k * 100} width={k % 2 ? 140 : 280} height={14} fill="#C2464F" />
            <text x={1120} y={78 + k * 100} fontFamily={fonts.mono} fontWeight={700} fontSize={44} fill="#F4EFE6">
              {(6 - k * 0.4).toFixed(1)}
            </text>
          </g>
        ))}
        {/* the water settles, and sits exactly on the line Mr. Ito predicted from his tide table */}
        <rect x={0} y={level} width={W} height={H - level} fill="#1E4A6E" opacity={0.85} />
        <path d={`M0,${level} q60,-10 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0`} stroke="#9FD8FF" strokeWidth={6} fill="none" />
        <path d={`M700,560 L1240,560`} stroke="#FFD27A" strokeWidth={8} strokeDasharray="24 12" />
        <g transform="translate(250,470) rotate(-3)" opacity={clamp((t - 0.3) / 0.4)}>
          <rect x={0} y={0} width={380} height={130} rx={8} fill="#FBF6EA" stroke={INK} strokeWidth={5} />
          <text x={22} y={50} fontFamily={fonts.mono} fontSize={28} fill="#2A2A2A">TIDE TABLE · 10:40</text>
          <text x={22} y={104} fontFamily="'Caveat', 'Comic Sans MS', cursive" fontWeight={700} fontSize={54} fill="#C2464F">predicted 4.0 m</text>
          <path d="M380,90 L450,90" stroke="#FFD27A" strokeWidth={6} />
        </g>
        <Frost amount={0.25} w={W} h={H} seed={9} />
      </g>,
    );
  }

  if (v === 'fishIce') {
    // under the new ice skin, in Mira's torch beam: a fish glides past, unbothered; her mitten points from above
    const fx = -200 + 2300 * clamp(t / Math.max(2.4, c.dur));
    return wrap(
      '#03060F',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#0A2238" />
        <defs>
          <radialGradient id="fishBeam" cx="0.52" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#CFEFFF" stopOpacity={0.5} />
            <stop offset="1" stopColor="#CFEFFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the fish, under the ice */}
        <g transform={`translate(${fx},${600 + Math.sin(t * 2.2) * 26}) scale(1.6)`}>
          <path d={`M-90,0 Q-30,-46 50,-10 L96,-34 L86,0 L96,34 L50,10 Q-30,46 -90,0 Z`} fill="#E07A5F" stroke={INK} strokeWidth={4} transform={`rotate(${Math.sin(t * 6) * 3})`} />
          <circle cx={-60} cy={-6} r={6} fill={INK} />
          <path d="M-20,-24 q10,24 0,48" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
        </g>
        {/* the ice skin: a pale translucent layer with cracks */}
        <rect x={0} y={0} width={W} height={H} fill="#DDEFFF" opacity={0.26} />
        {Array.from({length: 18}, (_, k) => (
          <path key={k} d={`M${(k * 211) % W},${(k * 137) % H} l${60 + (k % 4) * 30},${-20 + (k % 3) * 25} l${40 + (k % 5) * 18},${30 - (k % 2) * 50}`} stroke="#F4FBFF" strokeWidth={3} fill="none" opacity={0.6} />
        ))}
        <rect x={0} y={0} width={W} height={H} fill="url(#fishBeam)" />
        {/* Mira's blue mitten, pointing down at it */}
        <g transform={`translate(${780 + Math.sin(t * 1.5) * 10},0)`}>
          <path d="M120,-40 L210,-40 L230,180 L130,200 Z" fill="#3E7CB1" stroke={INK} strokeWidth={6} />
          <path d="M120,170 Q110,250 160,300 Q200,320 230,280 Q250,230 236,170 Z" fill="#3E7CB1" stroke={INK} strokeWidth={6} />
          <path d="M150,280 Q150,330 170,350 Q190,346 190,310" fill="#3E7CB1" stroke={INK} strokeWidth={6} />
        </g>
        <Frost amount={0.3} w={W} h={H} seed={14} />
      </g>,
    );
  }

  if (v === 'hands') {
    // candlelight; Kai's hand (orange sleeve) closed hard around Mira's blue mitten, trembling a little
    const tr = Math.sin(f * 1.7) * 2.5;
    return wrap(
      '#100A06',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#2A1C14" />
        <path d="M0,760 Q960,700 1920,760 L1920,1080 L0,1080 Z" fill="#4FA3A5" stroke={INK} strokeWidth={6} opacity={0.85} />
        {/* her mitten and sleeve, from the right */}
        <path d="M1920,520 L1300,560 L1290,700 L1920,720 Z" fill="#3E7CB1" stroke={INK} strokeWidth={8} />
        <path d="M1310,560 Q1120,520 1060,600 Q1040,690 1120,720 Q1220,740 1300,700 Z" fill="#3E7CB1" stroke={INK} strokeWidth={8} />
        {/* his hand closing over it, from the left */}
        <g transform={`translate(${tr},${tr * 0.6})`}>
          <path d="M0,480 L760,520 L780,700 L0,740 Z" fill="#E07A2E" stroke={INK} strokeWidth={8} />
          <path d="M760,520 Q900,470 1060,520 Q1160,560 1180,620 Q1170,660 1120,660 L960,650 Q980,700 940,740 Q860,770 780,700 Z" fill="#8A5A3A" stroke={INK} strokeWidth={8} />
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${980 + k * 50},${560 + k * 8} q30,30 20,80`} stroke={INK} strokeWidth={5} fill="none" opacity={0.7} />
          ))}
          {/* knuckles pale from gripping */}
          {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={940 + k * 52} cy={540 + k * 10} rx={16} ry={10} fill="#B07A56" />)}
        </g>
        <Glow x={1500} y={300} r={900} color="#FFB867" opacity={0.4 + 0.06 * Math.sin(f * 0.5)} />
      </g>,
    );
  }

  if (v === 'tapRail') {
    // dawn, 1982: the young hand in the brown wool cuff taps the dome's railing — one, two, three
    const taps = (c.p.taps as number[]) ?? [0.5, 1.1, 1.7];
    const down = taps.some((tt) => t >= tt && t < tt + 0.14);
    return wrap(
      '#1A1008',
      <g>
        <defs>
          <linearGradient id="railDawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3E6CB8" />
            <stop offset="0.55" stopColor="#F4B86A" />
            <stop offset="1" stopColor="#FFE2A0" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#railDawn)" />
        <circle cx={1460} cy={760} r={220} fill="#FFF6D6" opacity={0.9} />
        <circle cx={1460} cy={760} r={420} fill="#FFE9A8" opacity={0.3} />
        <path d="M0,820 L400,700 L800,780 L1200,690 L1920,800 L1920,1080 L0,1080 Z" fill="#6A5A7A" />
        {/* the railing */}
        <rect x={0} y={600} width={W} height={34} rx={17} fill="#8A8F9C" stroke={INK} strokeWidth={6} />
        {[160, 640, 1120, 1600].map((x) => <rect key={x} x={x} y={630} width={24} height={460} fill="#7A7F8C" stroke={INK} strokeWidth={5} />)}
        {/* hand + cuff */}
        <g transform={`translate(0,${down ? 18 : 0})`}>
          <path d="M1920,330 Q1500,360 1240,470 L1290,560 Q1560,500 1920,470 Z" fill="#8A6A4A" stroke={INK} strokeWidth={8} />
          <path d="M1260,470 Q1120,480 1060,540 Q1040,590 1090,600 L1180,598 Q1200,620 1250,612 L1320,560 Z" fill="#E8C4A2" stroke={INK} strokeWidth={7} />
          {[0, 1, 2].map((k) => <path key={k} d={`M${1100 + k * 40},${560} q6,20 0,36`} stroke={INK} strokeWidth={4} fill="none" opacity={0.6} />)}
        </g>
        {down && <path d="M1060,600 l-30,-30 M1080,592 l-10,-44 M1110,594 l14,-40" stroke="#FFFFFF" strokeWidth={5} opacity={0.8} />}
      </g>,
    );
  }

  if (v === 'pulses') {
    // the receiver's screen: pulses arriving, and a counter that will not stop
    const n0 = Number(c.p.from ?? 3);
    const n1 = Number(c.p.to ?? 1679);
    const n = Math.floor(n0 + (n1 - n0) * clamp(t / Math.max(1, c.dur - 0.4)));
    return wrap(
      '#03060A',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#06120C" />
        {Array.from({length: 14}, (_, k) => <path key={k} d={`M0,${k * 80} L${W},${k * 80}`} stroke="#0E2A1C" strokeWidth={2} />)}
        <path
          d={`M0,600 ${Array.from({length: 120}, (_, i) => {
            const x = i * 16;
            const on = ((i * 7 + Math.floor(f * 1.5)) % 5) < 2;
            return `L${x},600 L${x},${on ? 380 : 600} L${x + 8},${on ? 380 : 600} L${x + 8},600`;
          }).join(' ')}`}
          stroke="#5BFF8A"
          strokeWidth={5}
          fill="none"
        />
        <text x={960} y={860} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={110} fill="#5BFF8A">
          {n.toLocaleString('en-US')}
        </text>
      </g>,
    );
  }

  if (v === 'decode') {
    // 1,679 pulses → the only grid they fit (23 × 73) → a picture, filling row by row
    const k = clamp((t - 1.4) / Math.max(1, c.dur - 1.8));
    return wrap(
      '#05060D',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#070A18" />
        <text x={430} y={430} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={84} fill="#EAF0FF" opacity={clamp(t / 0.4)}>
          1,679
        </text>
        <text x={430} y={530} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={60} fill="#FFD08A" opacity={clamp((t - 0.6) / 0.4)}>
          = 23 × 73
        </text>
        <text x={430} y={610} textAnchor="middle" fontFamily={fonts.ui} fontWeight={600} fontSize={30} fill="#9FB2DA" opacity={clamp((t - 0.9) / 0.4)}>
          two primes: only one way to lay it out
        </text>
        <g transform="translate(1340,540)">
          <ReplyPicture cell={13} reveal={k} frame={f} />
        </g>
      </g>,
    );
  }

  if (v === 'reply') {
    // the whole picture, then a slow push down onto the empty square at the bottom
    const push = c.p.focus ? clamp((t - 0.6) / 2.2) : 0;
    const zoom = 1 + push * 1.6;
    const ty = -push * 300;
    return wrap(
      '#05060D',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#070A18" />
        <g transform={`translate(960,${540 + ty * zoom}) scale(${zoom})`}>
          <ReplyPicture cell={13} reveal={1} frame={f} focus={c.p.focus ? 1 : 0} dim={push} />
        </g>
      </g>,
    );
  }

  if (v === 'drawingGrid') {
    // Mira's crayon sun becomes 23 × 23 dots, and goes
    const k = clamp((t - 0.5) / 1.6);
    const send = clamp((t - 2.4) / 1.2);
    const cell = 30;
    return wrap(
      '#0A0E1C',
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#141A30" />
        {/* the crayon drawing itself, fading as the dots take over */}
        <g transform="translate(560,540) rotate(-3)" opacity={1 - k * 0.85}>
          <rect x={-330} y={-330} width={660} height={660} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
          <circle cx={0} cy={-90} r={120} fill="#FFC93C" stroke="#E0A21C" strokeWidth={8} />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <path key={i} d={`M${Math.cos(a) * 150},${-90 + Math.sin(a) * 150} L${Math.cos(a) * 210},${-90 + Math.sin(a) * 210}`} stroke="#FFC93C" strokeWidth={14} strokeLinecap="round" />;
          })}
          <circle cx={-40} cy={-110} r={10} fill="#5A3822" />
          <circle cx={40} cy={-110} r={10} fill="#5A3822" />
          <path d="M-50,-60 Q0,-20 50,-60" stroke="#5A3822" strokeWidth={8} fill="none" />
          <path d="M-20,200 L0,150 L20,200 M0,150 L0,110 M-30,130 L30,130 M0,110 m-18,-18 a18,18 0 1,0 36,0 a18,18 0 1,0 -36,0" stroke="#3E7CB1" strokeWidth={8} fill="none" />
          <text x={180} y={290} fontFamily="'Caveat', 'Comic Sans MS', cursive" fontWeight={700} fontSize={44} fill="#C2464F">Mira, 8</text>
        </g>
        <g transform={`translate(${1360 + send * 900},${540 - send * 600}) scale(${1 - send * 0.7})`} opacity={k}>
          {DRAWING.map((row, y) =>
            row.map((v2, x) => (
              <rect key={`${x}-${y}`} x={(x - 11.5) * cell + 2} y={(y - 11.5) * cell + 2} width={cell - 4} height={cell - 4} fill={v2 === 1 ? '#FFC93C' : v2 === 2 ? '#7FD8FF' : '#2A3152'} opacity={v2 ? 1 : 0.25} />
            )),
          )}
        </g>
      </g>,
    );
  }

  if (v === 'pawprints') {
    const sweep = interpolate(p, [0, 1], [-30, 15]);
    return (
      <AbsoluteFill style={{background: '#02040C'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <rect x={0} y={0} width={W} height={H} fill="#1A2448" />
          {/* snow surface, seen from above; prints revealed by the torch */}
          <defs>
            <radialGradient id="torchSpot" cx={0.5 + sweep / 200} cy={0.55}>
              <stop offset="0" stopColor="#FFF4D6" stopOpacity={1} />
              <stop offset="0.5" stopColor="#FFF4D6" stopOpacity={0.5} />
              <stop offset="1" stopColor="#FFF4D6" stopOpacity={0} />
            </radialGradient>
            <mask id="spotMask">
              <rect x={0} y={0} width={W} height={H} fill="url(#torchSpot)" />
            </mask>
          </defs>
          <g mask="url(#spotMask)">
            <rect x={0} y={0} width={W} height={H} fill="#E6EEF8" />
            {Array.from({length: 9}, (_, i) => (
              <g key={i} transform={`translate(${200 + i * 200},${600 + (i % 2 ? 70 : -70) - i * 30}) rotate(-75)`}>
                <ellipse cx={0} cy={0} rx={30} ry={24} fill="#9DB0CA" />
                {[-24, -8, 8, 24].map((dx) => (
                  <ellipse key={dx} cx={dx} cy={-34} rx={9} ry={12} fill="#9DB0CA" />
                ))}
              </g>
            ))}
          </g>
          <rect x={0} y={0} width={W} height={H} fill="#FFE3A6" opacity={0.06} />
          <Vignette amount={0.7} />
        </svg>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{background: '#000'}} />;
};

// ── the cold-open "somewhere else" vignettes, as stage sets ─────────────────────────────────────
const DaySky: React.FC<{top: string; bottom: string}> = ({top, bottom}) => (
  <g>
    <defs>
      <linearGradient id={`ds${top.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={-800} y={-600} width={3600} height={2200} fill={`url(#ds${top.slice(1)})`} />
  </g>
);

/** A yellow school bus to real size (metres × sc): 11 m long, 3.2 m tall, bonnet at the front, folding door. Faces right; x = its front. */
export const SchoolBus: React.FC<{x: number; base: number; sc: number}> = ({x, base, sc}) => {
  const lw = Math.max(2, sc * 0.022) / sc;
  return (
    <g transform={`translate(${x},${base}) scale(${sc})`} strokeLinejoin="round">
      <ellipse cx={-5.5} cy={0} rx={6} ry={0.12} fill="#000" opacity={0.3} />
      <path d="M-11,-0.5 L-11,-3.0 Q-11,-3.2 -10.8,-3.2 L-1.8,-3.2 Q-1.5,-3.2 -1.45,-2.9 L-1.3,-1.75 L-0.25,-1.6 Q0,-1.55 0,-1.3 L0,-0.5 Z" fill="#F2C94C" stroke={INK} strokeWidth={lw} />
      <path d="M-1.42,-2.85 L-1.32,-1.85 L-0.9,-1.8 L-1.0,-2.8 Z" fill="#BFE3FF" stroke={INK} strokeWidth={lw * 0.8} />
      {/* folding door */}
      <rect x={-2.35} y={-2.75} width={0.8} height={2.2} fill="#BFE3FF" stroke={INK} strokeWidth={lw} />
      <path d="M-1.95,-2.75 L-1.95,-0.55 M-2.35,-1.65 L-1.55,-1.65" stroke={INK} strokeWidth={lw * 0.8} />
      {Array.from({length: 8}, (_, i) => (
        <rect key={i} x={-3.4 - i * 0.98} y={-2.75} width={0.85} height={0.75} rx={0.08} fill="#BFE3FF" stroke={INK} strokeWidth={lw * 0.8} />
      ))}
      <rect x={-11} y={-1.75} width={9.45} height={0.1} fill={INK} />
      <rect x={-11} y={-1.25} width={11} height={0.1} fill={INK} />
      <rect x={-11} y={-0.75} width={11} height={0.1} fill={INK} opacity={0.6} />
      <text x={-6.4} y={-1.36} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={0.3} fill={INK} letterSpacing={0.05}>
        SCHOOL BUS
      </text>
      <rect x={-0.1} y={-1.0} width={0.25} height={0.3} rx={0.05} fill="#2A2E3A" />
      <ellipse cx={-0.05} cy={-1.35} rx={0.07} ry={0.12} fill="#FFF6D6" stroke={INK} strokeWidth={lw * 0.6} />
      <rect x={-11.05} y={-2.9} width={0.12} height={0.35} fill="#C2464F" />
      {[-1.0, -8.2].map((wx) => (
        <g key={wx}>
          <path d={`M${wx - 0.62},-0.5 A0.62,0.62 0 0 1 ${wx + 0.62},-0.5 Z`} fill="#141824" />
          <circle cx={wx} cy={-0.5} r={0.5} fill="#1E2230" stroke={INK} strokeWidth={lw} />
          <circle cx={wx} cy={-0.5} r={0.22} fill="#8A8F9C" />
        </g>
      ))}
    </g>
  );
};

const NightSky: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <rect x={-800} y={-600} width={3600} height={2200} fill="#03050F" />
    <Stars frame={frame} count={700} w={3400} h={1400} seed={77} maxR={2.4} y0={-500} />
  </g>
);

/** Snow drifting down over a frozen Day-365 vignette. */
const Snowfall: React.FC<{frame: number; n?: number}> = ({frame, n = 90}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = ((i * 337) % 2400) - 240 + Math.sin(frame * 0.03 + i) * 30;
      const y = ((i * 191 + frame * (1.6 + (i % 5) * 0.5)) % 1300) - 120;
      return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#EAF2FF" opacity={0.75} />;
    })}
  </g>
);
/** The answer arriving: rings pulsing out of a radio, in threes (1, 2, 3). */
const RadioPulse: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g style={{mixBlendMode: 'screen'}}>
    {[0, 1, 2].map((k) => {
      const ph = (t * 0.9 - k * 0.33 + 3) % 1.6;
      if (ph > 1) return null;
      return (
        <g key={k}>
          <circle cx={x} cy={y} r={20 + ph * 190} fill="none" stroke="#CFF0FF" strokeWidth={10 * (1 - ph) + 2} opacity={1 - ph} />
          <circle cx={x} cy={y} r={20 + ph * 190} fill="none" stroke="#7FD8FF" strokeWidth={26 * (1 - ph)} opacity={0.25 * (1 - ph)} />
        </g>
      );
    })}
  </g>
);

/**
 * The world's last ordinary minute: Sydney, Tamil Nadu, Manila. `dark` (seconds or "l0+…") snaps the Sun off in
 * the same instant as the kitchen; after that the sky is stars and the colour drains out.
 */
registerSet('montage', {
  layers: (c) => {
    const f = c.frame;
    const back = c.p.sunAt !== undefined && c.t >= c.at(c.p.sunAt, 0);
    const night = c.p.dark !== undefined && c.t >= c.at(c.p.dark, 0) && !back;
    if (c.v === 'beach')
      return [
        {
          depth: 0.2,
          node: night ? (
            <NightSky frame={f} />
          ) : (
            <g>
              <DaySky top="#4FB3E8" bottom="#BFE8F8" />
              <circle cx={1500} cy={200} r={90} fill="#FFF6C8" />
              <circle cx={1500} cy={200} r={160} fill="#FFF6C8" opacity={0.3} />
              <path d="M200,220 q40,-40 90,0 q30,-20 60,0 z M900,140 q50,-40 100,0 q30,-20 60,0 z" fill="#FFFFFF" opacity={0.9} />
            </g>
          ),
        },
        {
          depth: 0.6,
          node: (
            <g>
              <rect x={-800} y={560} width={3600} height={800} fill={c.p.frozen ? '#C9D8E8' : '#1E7FC0'} />
              {!c.p.frozen && Array.from({length: 12}, (_, i) => (
                <path key={i} d={`M${-800 + ((i * 330 + f * 4) % 3600)},${600 + (i % 4) * 40} q40,-12 80,0`} stroke="#BFE8F8" strokeWidth={5} fill="none" />
              ))}
              {c.p.frozen && Array.from({length: 14}, (_, i) => (
                <path key={i} d={`M${-700 + i * 260},${600 + (i % 4) * 50} l${60 + (i % 3) * 40},${18 - (i % 2) * 30} l${50},${25}`} stroke="#8EA4BE" strokeWidth={3} fill="none" />
              ))}
            </g>
          ),
        },
        {
          depth: 1,
          node: (
            <g>
              {/* the wave curling */}
              <path d={`M-800,900 Q200,${560 + (c.p.frozen ? 0 : Math.sin(f * 0.05) * 20)} 900,620 Q1300,560 1500,700 Q1400,640 1300,700 Q1600,820 2800,900 L2800,1400 L-800,1400 Z`} fill={c.p.frozen ? '#B8CCE0' : '#2A9BD6'} stroke={INK} strokeWidth={5} />
              <path d="M900,620 Q1300,560 1500,700 Q1400,640 1300,700" fill="#E8F8FF" />
              {/* a frozen wave: the sea stopped mid-curl, icicles under the lip */}
              {c.p.frozen && <path d="M1310,700 l10,40 l12,-38 l10,52 l12,-50 l12,34 l10,-30" fill="#E8F4FF" stroke={INK} strokeWidth={3} />}
              <rect x={-800} y={980} width={3600} height={500} fill={c.p.frozen ? '#E6EEF7' : '#F2D49A'} />
              <path d="M-800,980 Q960,940 2800,980" stroke="#FFFFFF" strokeWidth={14} fill="none" opacity={0.8} />
              {/* surfboard under the surfer (cast stands on it) */}
              <ellipse cx={c.p.boardX ?? 1000} cy={712} rx={150} ry={20} fill="#E07A5F" stroke={INK} strokeWidth={5} transform={`rotate(-8,1000,712)`} />
            </g>
          ),
        },
      ];
    if (c.v === 'field')
      return [
        {depth: 0.2, node: night ? <NightSky frame={f} /> : <DaySky top="#7EC8F0" bottom="#F8E8B8" />},
        {
          depth: 0.5,
          node: (
            <g>
              {Array.from({length: 6}, (_, i) => (
                <path key={i} d={`M-800,${520 + i * 70} Q960,${470 + i * 70} 2800,${520 + i * 70} L2800,1400 L-800,1400 Z`} fill={c.p.frozen ? ['#E8EEF6', '#DCE4EE', '#E4EAF2', '#D6DEEA', '#E8EEF6', '#DCE4EE'][i] : ['#9BC85A', '#86B84A', '#C9C04A', '#A6C24E', '#D8B84A', '#B8C04E'][i]} stroke={INK} strokeWidth={4} />
              ))}
              <path d="M-200,520 L200,300 L600,520 Z M1300,520 L1700,260 L2200,520 Z" fill={c.p.frozen ? '#B8C4D4' : '#6E9A6A'} opacity={0.8} />
            </g>
          ),
        },
        {
          depth: 1,
          node: (
            <g>
              <rect x={-800} y={900} width={3600} height={600} fill={c.p.frozen ? '#EEF3F9' : '#7FB04A'} />
              {Array.from({length: 60}, (_, i) => (
                <path key={i} d={`M${-700 + i * 60},${940 + (i % 3) * 30} q${c.p.frozen ? 6 : Math.sin(f * 0.05 + i) * 8},-50 ${c.p.frozen ? 18 : Math.sin(f * 0.05 + i) * 14},${c.p.frozen ? -60 : -90}`} stroke={c.p.frozen ? '#8A7A62' : '#4E8A3A'} strokeWidth={c.p.frozen ? 4 : 6} fill="none" />
              ))}
            </g>
          ),
        },
      ];
    // bus: the kid (depth 1.4) runs along the near pavement; the bus waits on the road just behind him, at full size
    // the doors shut on his nose, then the bus pulls away and is gone before the cut (the dark shot has no bus)
    const go = c.at(c.p.busGo, 1.35);
    const busX = c.p.noBus ? 9999 : interpolate(c.t, [go, go + 1.3], [1420, 5600], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    return [
      {depth: 0.2, node: night ? <NightSky frame={f} /> : <DaySky top="#6FC0F0" bottom="#E8F4FA" />},
      {
        depth: 0.5,
        node: (
          <g>
            {Array.from({length: 9}, (_, i) => (
              <g key={i}>
                <rect x={-600 + i * 380} y={420 - (i % 3) * 80} width={320} height={600} fill={['#E9C46A', '#E07A5F', '#9AD1C8', '#F2D49A'][i % 4]} stroke={INK} strokeWidth={4} />
                {c.p.frozen && <path d={`M${-610 + i * 380},${420 - (i % 3) * 80} q160,-36 340,0 l0,18 l-340,0 z`} fill="#F2F6FB" stroke={INK} strokeWidth={3} />}
              </g>
            ))}
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            <rect x={-800} y={820} width={3600} height={40} fill="#B8B0A4" stroke={INK} strokeWidth={4} />
            <rect x={-800} y={860} width={3600} height={92} fill="#5A5E6A" />
            <rect x={-800} y={950} width={3600} height={12} fill="#D8D2C6" stroke={INK} strokeWidth={3} />
            <rect x={-800} y={962} width={3600} height={500} fill={c.p.frozen ? '#E4EAF2' : '#B8B0A4'} />
            {c.p.frozen && <path d="M-800,975 Q-400,930 0,968 Q500,920 900,966 Q1400,925 1900,968 Q2400,930 2800,970 L2800,1460 L-800,1460 Z" fill="#F2F6FB" stroke={INK} strokeWidth={4} />}
            {c.p.frozen && <path d="M-800,858 Q200,832 1200,856 Q2000,836 2800,858 L2800,870 L-800,870 Z" fill="#EEF3F9" />}
            {Array.from({length: 30}, (_, i) => (
              <path key={i} d={`M${-800 + i * 140},962 L${-900 + i * 170},1460`} stroke="#A49C90" strokeWidth={3} />
            ))}
            {/* the yellow school bus (11 m × 3.2 m), pulling away */}
            <SchoolBus x={busX} base={935} sc={M(1, 1.33)} />
            {/* bus stop sign: a 2.4 m pole on the kerb */}
            <path d={`M380,956 L380,${956 - M(2.4, 1.4)}`} stroke="#2A3142" strokeWidth={12} />
            <circle cx={380} cy={956 - M(2.4, 1.4)} r={M(0.25, 1.4)} fill="#3C8D6E" stroke={INK} strokeWidth={5} />
            <text x={380} y={956 - M(2.4, 1.4) + 14} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={40} fill="#FFFFFF">
              BUS
            </text>
          </g>
        ),
      },
    ];
  },
  light: (c) =>
    c.p.dark !== undefined && c.t >= c.at(c.p.dark, 0) && !(c.p.sunAt !== undefined && c.t >= c.at(c.p.sunAt, 0)) ? null : (
      <Glow x={1500} y={200} r={1100} color="#FFF3C8" opacity={0.35} />
    ),
  post: (c) =>
    c.p.dark !== undefined && c.t >= c.at(c.p.dark, 0) && !(c.p.sunAt !== undefined && c.t >= c.at(c.p.sunAt, 0)) ? (
      <g>
        {c.p.frozen && <Snowfall frame={c.frame} />}
        {c.p.pulse && <RadioPulse x={c.p.pulse[0]} y={c.p.pulse[1]} t={c.t} />}
      </g>
    ) : null,
  grade: (c) => {
    const night = c.p.dark !== undefined && c.t >= c.at(c.p.dark, 0) && !(c.p.sunAt !== undefined && c.t >= c.at(c.p.sunAt, 0));
    return (
      <g>
        <Grade color={night ? '#0E1650' : '#FFF0D0'} amount={night ? 0.72 : 0.08} />
        <Vignette amount={night ? 0.7 : 0.35} />
      </g>
    );
  },
});
