import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Frost, Aurora} from '../../fx/cinema/atmos';
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

registerSet('montage', {
  layers: (c) => {
    const f = c.frame;
    if (c.v === 'beach')
      return [
        {
          depth: 0.2,
          node: (
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
              <rect x={-800} y={560} width={3600} height={800} fill="#1E7FC0" />
              {Array.from({length: 12}, (_, i) => (
                <path key={i} d={`M${-800 + ((i * 330 + f * 4) % 3600)},${600 + (i % 4) * 40} q40,-12 80,0`} stroke="#BFE8F8" strokeWidth={5} fill="none" />
              ))}
            </g>
          ),
        },
        {
          depth: 1,
          node: (
            <g>
              {/* the wave curling */}
              <path d={`M-800,900 Q200,${560 + Math.sin(f * 0.05) * 20} 900,620 Q1300,560 1500,700 Q1400,640 1300,700 Q1600,820 2800,900 L2800,1400 L-800,1400 Z`} fill="#2A9BD6" stroke={INK} strokeWidth={5} />
              <path d="M900,620 Q1300,560 1500,700 Q1400,640 1300,700" fill="#E8F8FF" />
              <rect x={-800} y={980} width={3600} height={500} fill="#F2D49A" />
              <path d="M-800,980 Q960,940 2800,980" stroke="#FFFFFF" strokeWidth={14} fill="none" opacity={0.8} />
              {/* surfboard under the surfer (cast stands on it) */}
              <ellipse cx={c.p.boardX ?? 1000} cy={712} rx={150} ry={20} fill="#E07A5F" stroke={INK} strokeWidth={5} transform={`rotate(-8,1000,712)`} />
            </g>
          ),
        },
      ];
    if (c.v === 'field')
      return [
        {depth: 0.2, node: <DaySky top="#7EC8F0" bottom="#F8E8B8" />},
        {
          depth: 0.5,
          node: (
            <g>
              {Array.from({length: 6}, (_, i) => (
                <path key={i} d={`M-800,${520 + i * 70} Q960,${470 + i * 70} 2800,${520 + i * 70} L2800,1400 L-800,1400 Z`} fill={['#9BC85A', '#86B84A', '#C9C04A', '#A6C24E', '#D8B84A', '#B8C04E'][i]} stroke={INK} strokeWidth={4} />
              ))}
              <path d="M-200,520 L200,300 L600,520 Z M1300,520 L1700,260 L2200,520 Z" fill="#6E9A6A" opacity={0.8} />
            </g>
          ),
        },
        {
          depth: 1,
          node: (
            <g>
              <rect x={-800} y={900} width={3600} height={600} fill="#7FB04A" />
              {Array.from({length: 60}, (_, i) => (
                <path key={i} d={`M${-700 + i * 60},${940 + (i % 3) * 30} q${Math.sin(f * 0.05 + i) * 8},-50 ${Math.sin(f * 0.05 + i) * 14},-90`} stroke="#4E8A3A" strokeWidth={6} fill="none" />
              ))}
            </g>
          ),
        },
      ];
    // bus: the kid (depth 1.4) runs along the near pavement; the bus waits on the road just behind him, at full size
    const busX = interpolate(c.t, [c.at('l0+1.3', 1.5), c.at('l0+1.3', 1.5) + 2.0], [1420, 3900], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    return [
      {depth: 0.2, node: <DaySky top="#6FC0F0" bottom="#E8F4FA" />},
      {
        depth: 0.5,
        node: (
          <g>
            {Array.from({length: 9}, (_, i) => (
              <rect key={i} x={-600 + i * 380} y={420 - (i % 3) * 80} width={320} height={600} fill={['#E9C46A', '#E07A5F', '#9AD1C8', '#F2D49A'][i % 4]} stroke={INK} strokeWidth={4} />
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
            <rect x={-800} y={962} width={3600} height={500} fill="#B8B0A4" />
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
  light: () => <Glow x={1500} y={200} r={1100} color="#FFF3C8" opacity={0.35} />,
  grade: () => (
    <g>
      <Grade color="#FFF0D0" amount={0.08} />
      <Vignette amount={0.35} />
    </g>
  ),
});
