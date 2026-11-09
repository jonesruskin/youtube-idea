import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {useShot} from '../../engine/shot-context';
import {Shell} from '../sun/space';
import {INK, Vignette} from '../sun/stage';
import {CityBlocks} from '../sun01/parts';
import {Meteors, NightSky, PH_PATHS, RadioSet, rnd} from './parts';

/**
 * File 002's full-frame inserts, views and explainer diagrams (scene key 'sea', prop v).
 * Diagrams keep labels to a few words; every idea is carried by motion.
 */
const W = 1920;
const H = 1080;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const F = "'Space Grotesk', sans-serif";
const FB = "'Unbounded', sans-serif";
const Label: React.FC<{x: number; y: number; t: string; s?: number; c?: string; a?: 'start' | 'middle' | 'end'; o?: number}> = ({x, y, t, s = 34, c = '#E9EEF6', a = 'middle', o = 1}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={F} fontWeight={800} fontSize={s} fill={c} opacity={o} stroke="#0B1026" strokeWidth={s * 0.18} paintOrder="stroke">
    {t}
  </text>
);
const Frame: React.FC<{children: React.ReactNode; bg?: string; frame: number; drift?: boolean}> = ({children, bg = '#0B1230', frame, drift = true}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
      <g transform={drift ? `translate(${960 + Math.sin(frame * 0.02) * 10},${540 + Math.cos(frame * 0.017) * 8}) scale(${1 + frame * 0.0005}) translate(-960,-540)` : undefined}>{children}</g>
      <Vignette amount={0.55} />
    </svg>
  </AbsoluteFill>
);

// ── the Amihan, side view (a 190 m bulk carrier, drawn to read at any size) ──
const Ship: React.FC<{x: number; y: number; s?: number; tilt?: number; lights?: number; frost?: number; white?: boolean}> = ({x, y, s = 1, tilt = 0, lights = 1, frost = 0, white}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`}>
    <path d="M-420,0 L380,0 L440,-70 L-440,-70 Z" fill={white ? '#F4F4F0' : '#7A2A2A'} stroke={INK} strokeWidth={6} />
    <rect x={-440} y={-96} width={880} height={26} fill={white ? '#E8742A' : '#2A2E3A'} stroke={INK} strokeWidth={5} />
    {!white && [-300, -170, -40, 90, 220].map((hx) => <rect key={hx} x={hx} y={-120} width={100} height={24} fill="#3A3E48" stroke={INK} strokeWidth={4} />)}
    {/* superstructure aft (left) */}
    <rect x={-420} y={-250} width={150} height={154} fill={white ? '#F4F4F0' : '#E9E4DA'} stroke={INK} strokeWidth={5} />
    <rect x={-430} y={-280} width={170} height={30} fill={white ? '#F4F4F0' : '#E9E4DA'} stroke={INK} strokeWidth={5} />
    <rect x={-380} y={-330} width={30} height={50} fill="#2A2E3A" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={-405 + i * 34} y={-236} width={20} height={16} fill="#FFD27A" opacity={lights * (0.5 + 0.5 * ((i * 7) % 3 ? 1 : 0.4))} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`b${i}`} x={-405 + i * 34} y={-196} width={20} height={14} fill="#FFD27A" opacity={lights * 0.7} />
    ))}
    {/* cranes */}
    {[-120, 150].map((cx) => (
      <path key={cx} d={`M${cx},-120 L${cx},-230 L${cx + 120},-170`} stroke="#D9A441" strokeWidth={8} fill="none" />
    ))}
    <circle cx={400} cy={-110} r={6} fill="#7CFF9A" opacity={lights} />
    <circle cx={-410} cy={-300} r={7} fill="#FFFFFF" opacity={lights} />
    {frost > 0 && <path d="M-440,-70 L440,-70 L440,-80 L-440,-80 Z M-430,-280 L-260,-280 L-260,-288 L-430,-288 Z" fill="#EEF4FB" opacity={frost} />}
    {white && (
      <text x={0} y={-30} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={44} fill="#1F2A44">
        COAST GUARD
      </text>
    )}
  </g>
);

const SeaSurface: React.FC<{y: number; frame: number; amp?: number; col?: string; line?: string}> = ({y, frame, amp = 10, col = '#04070F', line = '#1A2440'}) => (
  <g>
    <rect x={-400} y={y} width={2800} height={900} fill={col} />
    {Array.from({length: 10}, (_, i) => (
      <path key={i} d={`M-400,${y + 30 + i * 40} ${Array.from({length: 30}, (_, k) => `q50,${(k % 2 ? -1 : 1) * amp * (1 - i * 0.06)} 100,0`).join(' ')}`} transform={`translate(${-((frame * (2 + i * 0.3)) % 200)},0)`} stroke={line} strokeWidth={3} fill="none" opacity={0.7 - i * 0.05} />
    ))}
  </g>
);

const Earth: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#1A4A7A" stroke={INK} strokeWidth={6} />
    <path d={`M${cx - r * 0.6},${cy - r * 0.3} q${r * 0.3},${-r * 0.4} ${r * 0.7},${-r * 0.1} q${r * 0.1},${r * 0.3} ${-r * 0.2},${r * 0.5} q${-r * 0.4},${r * 0.1} ${-r * 0.5},${-r * 0.4} Z`} fill="#3A7A4A" opacity={0.9} />
    <path d={`M${cx + r * 0.1},${cy + r * 0.2} q${r * 0.3},${-r * 0.1} ${r * 0.5},${r * 0.2} q${-r * 0.1},${r * 0.4} ${-r * 0.4},${r * 0.3} Z`} fill="#3A7A4A" opacity={0.9} />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#9FD8FF" strokeWidth={10} opacity={0.25} />
  </g>
);

/** A small radio mast with signal arcs (Lola's antenna) on a diagram. */
const Mast: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-22,0 L0,-90 L22,0 M-14,-30 L14,-30 M-8,-60 L8,-60 M-14,-30 L8,-60 M14,-30 L-8,-60" stroke="#E9EEF6" strokeWidth={5} fill="none" strokeLinejoin="round" />
    <path d="M18,-104 a22,22 0 0 1 0,28 M28,-114 a36,36 0 0 1 0,48" stroke="#FFD27A" strokeWidth={4} fill="none" />
    <circle cx={0} cy={-92} r={6} fill="#FFD27A" />
  </g>
);

export const SeaScene: React.FC = () => {
  const {t, frame, dur, props: p, speaking} = useShot();
  const v = p.v as string;

  // ── Morse key close-up ──
  if (v === 'key') {
    const taps: number[] = p.taps ?? [];
    const down = taps.some((s) => t >= s && t < s + (taps.indexOf(s) % 3 === 2 ? 0.32 : 0.12));
    const letters: string = p.letters ?? '';
    const shown = letters ? letters.slice(0, Math.floor(clamp(t / Math.max(1, dur - 0.6)) * letters.length + 0.5)) : '';
    return (
      <Frame frame={frame} bg="#1A1410">
        <rect x={0} y={0} width={W} height={H} fill="#3A2A1C" />
        <circle cx={1300} cy={300} r={700} fill="#FFC77A" opacity={0.14} />
        {/* wood grain */}
        {Array.from({length: 14}, (_, i) => (
          <path key={i} d={`M0,${620 + i * 34} Q960,${600 + i * 36} 1920,${630 + i * 32}`} stroke="#2E2014" strokeWidth={4} fill="none" />
        ))}
        <g transform="translate(640,700)">
          <rect x={0} y={0} width={640} height={70} rx={12} fill="#1E1E22" stroke={INK} strokeWidth={6} />
          <g transform={`rotate(${down ? 4 : 0},80,-10)`}>
            <path d="M80,-10 L560,-90" stroke="#C9963A" strokeWidth={34} strokeLinecap="round" />
            <path d="M80,-10 L560,-90" stroke="#E8B860" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
            <ellipse cx={580} cy={-96} rx={70} ry={40} fill="#141414" stroke={INK} strokeWidth={6} />
            {/* Lola's hand: index finger and thumb on the knob, the wrist coming in from the right */}
            <g transform="translate(580,-130)">
              <path d="M40,-30 Q120,-70 260,-40 L300,30 Q180,50 70,30 Z" fill="#B57E56" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <path d="M60,-10 Q10,-20 -20,10 Q-30,30 -10,36 Q30,30 70,20" fill="#B57E56" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <path d="M70,24 Q20,52 0,60 Q-14,64 -10,74 Q30,74 90,40" fill="#A86E48" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <path d="M150,-40 Q160,-10 150,20 M200,-44 Q210,-14 200,16" stroke="#93623E" strokeWidth={4} fill="none" />
              <rect x={250} y={-50} width={120} height={90} rx={30} fill="#7A3A4A" stroke={INK} strokeWidth={6} />
            </g>
          </g>
          <circle cx={80} cy={-10} r={20} fill="#C9963A" stroke={INK} strokeWidth={5} />
          {down && <circle cx={360} cy={-60} r={160} fill="#FFE2A0" opacity={0.08} />}
        </g>
        {shown && <Label x={960} y={260} t={shown} s={110} c="#FFE2A0" />}
        {down && <Label x={1500} y={520} t={taps.indexOf(taps.find((s) => t >= s && t < s + 0.4) ?? 0) % 3 === 2 ? '—' : '·'} s={90} c="#FFE2A0" />}
      </Frame>
    );
  }

  // ── Manila from above, Day 0: the streetlights switch themselves on ──
  if (v === 'manila') {
    const on = clamp((t - (p.lightsAt ?? 0.6)) / 2.2);
    return (
      <Frame frame={frame} bg="#03050C">
        <NightSky frame={frame} seed={31} top="#01020A" bottom="#0E1430" count={260} />
        <g transform="translate(0,380)">
          <CityBlocks seed={12} base={300} color="#0E1430" frame={frame} lights={0.25} minH={120} maxH={300} />
        </g>
        {/* street grid in perspective */}
        {Array.from({length: 7}, (_, row) => {
          const y = 720 + row * row * 9 + row * 40;
          const k = clamp(on * 7 - row);
          return (
            <g key={row}>
              <path d={`M-200,${y} L2120,${y}`} stroke="#1A2034" strokeWidth={10 + row * 4} />
              {Array.from({length: 18}, (_, i) => (
                <g key={i} opacity={k}>
                  <circle cx={-100 + i * 125 + row * 20} cy={y - 4} r={6 + row} fill="#FFC45A" />
                  <circle cx={-100 + i * 125 + row * 20} cy={y - 4} r={26 + row * 4} fill="#FFC45A" opacity={0.18} />
                </g>
              ))}
              {/* jeepneys and cars, stopped, brake lights */}
              {Array.from({length: 4}, (_, i) => (
                <g key={`c${i}`}>
                  <rect x={200 + i * 420 + row * 33} y={y - 18 - row} width={46 + row * 6} height={18 + row * 2} rx={4} fill={['#C2464F', '#E9E4DA', '#3E7CB1', '#D9A441'][i]} />
                  <circle cx={200 + i * 420 + row * 33} cy={y - 10} r={4 + row * 0.6} fill="#FF3A3A" />
                </g>
              ))}
            </g>
          );
        })}
      </Frame>
    );
  }

  // ── the video call on Tomás's phone; freezes into blocks ──
  if (v === 'videocall') {
    const frozen = p.freezeAt !== undefined && t >= p.freezeAt;
    const talk = speaking('ROSA_RADIO') ? 0.4 + 0.4 * Math.abs(Math.sin(frame * 0.7)) : 0;
    const fr = frozen ? Math.round((p.freezeAt as number) * 30) : frame;
    const block = frozen ? clamp((t - (p.freezeAt as number)) / 0.8) : 0;
    return (
      <Frame frame={frame} bg="#0A0C16" drift={false}>
        <rect x={0} y={0} width={W} height={H} fill="#121628" />
        <g transform="translate(660,60)">
          <rect x={0} y={0} width={600} height={960} rx={60} fill="#1A1A1E" stroke={INK} strokeWidth={8} />
          <rect x={24} y={60} width={552} height={840} rx={24} fill="#0E1E30" />
          <clipPath id="vc">
            <rect x={24} y={60} width={552} height={840} rx={24} />
          </clipPath>
          <g clipPath="url(#vc)">
            {/* the bridge behind her, at night: green console glow */}
            <rect x={24} y={60} width={552} height={840} fill="#0A1A24" />
            <rect x={24} y={600} width={552} height={300} fill="#2A3A44" />
            <circle cx={300} cy={620} r={260} fill="#3AFFA0" opacity={0.08} />
            <Toon d={CAST.rosa} s={{x: 300, y: 1110, scale: 2.6, facing: 'front', pose: POSES.stand, bob: 0, face: FACES.worried, turn: 0, look: [0, 0], talk: frozen ? 0.3 : talk, blink: 0, outfit: 'home', hoodUp: false, breath: 0, frame: fr, rim: false, opacity: 1, watchGlow: 0}} />
            {block > 0 &&
              Array.from({length: 14 * 22}, (_, i) => {
                const r = rnd(i);
                if (r() > block) return null;
                const bx = 24 + (i % 14) * 40;
                const by = 60 + Math.floor(i / 14) * 40;
                return <rect key={i} x={bx} y={by} width={40} height={40} fill={['#0E2A3A', '#3A4A54', '#5A4030', '#1A3A2A'][i % 4]} opacity={0.85} />;
              })}
          </g>
          <text x={300} y={40} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={30} fill="#C9D3E6">
            MUM
          </text>
          {frozen && block > 0.6 && (
            <g>
              <rect x={90} y={440} width={420} height={90} rx={20} fill="#000" opacity={0.7} />
              <Label x={300} y={498} t="CONNECTION LOST" s={38} c="#FF8A7A" />
            </g>
          )}
        </g>
      </Frame>
    );
  }

  // ── satellites: batteries drain (step 0), then they go dark (step 1) ──
  if (v === 'satellites') {
    const step = p.step ?? 0;
    const drain = step === 0 ? clamp(t / Math.max(2, dur - 0.5)) : 1;
    const out = step === 1 ? clamp(t / Math.max(2, dur - 1)) : 0;
    const sats = Array.from({length: 9}, (_, i) => ({a: (i / 9) * Math.PI * 2 + frame * 0.004 * (i % 2 ? 1 : -1), rr: i % 3 === 0 ? 420 : i % 3 === 1 ? 340 : 480}));
    const labels = ['GPS', 'SATELLITE PHONES', 'SHIP INTERNET'];
    return (
      <Frame frame={frame}>
        <NightSky frame={frame} seed={8} top="#020410" bottom="#0B1230" count={300} />
        <ellipse cx={960} cy={560} rx={480} ry={170} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={3} />
        <ellipse cx={960} cy={560} rx={420} ry={420} fill="none" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={3} />
        <Earth cx={960} cy={560} r={230} />
        {sats.map((s, i) => {
          const x = 960 + Math.cos(s.a) * s.rr;
          const y = 560 + Math.sin(s.a) * s.rr * (i % 3 === 0 ? 0.4 : 1) * 0.85;
          const dead = out > (i + 1) / 10;
          const lvl = 1 - drain * (0.85 + (i % 3) * 0.05);
          return (
            <g key={i} transform={`translate(${x},${y})`} opacity={dead ? 0.35 : 1}>
              <rect x={-56} y={-10} width={40} height={20} fill={dead ? '#2A3048' : '#3E7CB1'} stroke={INK} strokeWidth={3} />
              <rect x={16} y={-10} width={40} height={20} fill={dead ? '#2A3048' : '#3E7CB1'} stroke={INK} strokeWidth={3} />
              <rect x={-14} y={-16} width={28} height={32} rx={4} fill={dead ? '#3A3A44' : '#D9A441'} stroke={INK} strokeWidth={3} />
              {!dead && <circle cx={0} cy={-26} r={5} fill="#7CFF9A" />}
              {/* battery bar */}
              <g transform="translate(-24,26)">
                <rect x={0} y={0} width={48} height={14} rx={3} fill="#0B1026" stroke="#C9D3E6" strokeWidth={2} />
                <rect x={2} y={2} width={44 * Math.max(0, lvl)} height={10} rx={2} fill={lvl > 0.4 ? '#7CFF9A' : '#FF6A4A'} />
              </g>
            </g>
          );
        })}
        {step === 0 && <Label x={960} y={980} t={`SUNLIGHT: NONE · BATTERY ${Math.max(0, Math.round((1 - drain * 0.9) * 100))}%`} s={40} c="#FFD27A" />}
        {step === 1 &&
          labels.map((l, i) => {
            const k = clamp(out * 4 - i);
            return (
              <g key={l} opacity={0.3 + 0.7 * clamp(k * 2)}>
                <Label x={420 + i * 540} y={960} t={l} s={40} c={k > 0.6 ? '#FF8A7A' : '#E9EEF6'} />
                {k > 0.6 && <path d={`M${420 + i * 540 - 160},945 L${420 + i * 540 + 160},945`} stroke="#FF5A4A" strokeWidth={8} />}
              </g>
            );
          })}
      </Frame>
    );
  }

  // ── the ionosphere: a mirror made by sunlight (step 0), fading night by night (step 1) ──
  if (v === 'ionosphere') {
    const step = p.step ?? 0;
    const fade = step === 1 ? clamp(t / Math.max(2, dur - 0.6)) : 0;
    const day = step === 1 ? Math.min(4, 1 + Math.floor(fade * 4)) : 0;
    const layer = 1 - fade * 0.88;
    const k = clamp((t - 0.3) / 1.6);
    const A: [number, number] = [380, 760];
    const B: [number, number] = [1540, 760];
    const top: [number, number] = [960, 300];
    const escape = step === 1 && fade > 0.6;
    const pathPt = (q: number): [number, number] => (q < 0.5 ? [A[0] + (top[0] - A[0]) * q * 2, A[1] + (top[1] - A[1]) * q * 2] : escape ? [top[0] + (top[0] - A[0]) * (q - 0.5) * 2, top[1] + (top[1] - A[1]) * (q - 0.5) * 2] : [top[0] + (B[0] - top[0]) * (q - 0.5) * 2, top[1] + (B[1] - top[1]) * (q - 0.5) * 2]);
    const head = pathPt(k);
    return (
      <Frame frame={frame}>
        <NightSky frame={frame} seed={14} top="#020410" bottom="#0B1230" count={260} />
        {/* the electric layer */}
        <path d="M-200,420 Q960,140 2120,420 L2120,300 Q960,20 -200,300 Z" fill="#7FE8FF" opacity={0.28 * layer} />
        <path d="M-200,360 Q960,80 2120,360" stroke="#7FE8FF" strokeWidth={6} fill="none" opacity={0.7 * layer} strokeDasharray={layer < 0.5 ? '18 22' : undefined} />
        <Label x={1660} y={200} t="ELECTRIC AIR · 300 KM UP" s={30} c="#7FE8FF" o={0.4 + 0.6 * layer} />
        {/* Earth's curve */}
        <path d="M-200,860 Q960,640 2120,860 L2120,1200 L-200,1200 Z" fill="#12305A" stroke="#7FB8E8" strokeWidth={4} />
        {/* Manila (a mast) and the ship */}
        <Mast x={A[0]} y={A[1]} />
        <Label x={A[0]} y={A[1] + 70} t="MANILA" s={32} />
        <g transform={`translate(${B[0]},${B[1] - 6}) scale(0.16)`}>
          <Ship x={0} y={0} />
        </g>
        <Label x={B[0]} y={B[1] + 70} t="THE AMIHAN" s={32} />
        {/* the radio wave */}
        <polyline points={Array.from({length: 40}, (_, i) => pathPt((i / 39) * k).join(',')).join(' ')} stroke="#FFD27A" strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={head[0]} cy={head[1]} r={14} fill="#FFF3C0" />
        {step === 1 && <Label x={960} y={1000} t={`NIGHT ${day} WITHOUT THE SUN`} s={44} c="#FFD27A" />}
      </Frame>
    );
  }

  // ── why the storm: freezing air off frozen land over a warm sea ──
  if (v === 'stormwhy') {
    const k = clamp(t / Math.max(2, dur - 0.6));
    return (
      <Frame frame={frame}>
        <rect x={-200} y={0} width={2400} height={H} fill="#0B1230" />
        <path d="M-200,520 L760,520 L700,1200 L-200,1200 Z" fill="#DCE8F4" stroke={INK} strokeWidth={5} />
        <Label x={300} y={620} t="FROZEN LAND · −30°C" s={38} c="#FFFFFF" />
        <rect x={740} y={620} width={1400} height={600} fill="#1E6FB0" />
        {Array.from({length: 8}, (_, i) => (
          <path key={i} d={`M${760 + i * 160},${640 + (i % 2) * 20} q40,-10 80,0`} stroke="#7FC8F8" strokeWidth={4} fill="none" />
        ))}
        <Label x={1440} y={1000} t="WARM SEA · +27°C" s={38} c="#FFD27A" />
        {/* arrows of cold air */}
        {[380, 450, 520].map((y, i) => {
          const x = -100 + ((k * 900 + i * 120) % 1100);
          return <path key={y} d={`M${x},${y} l220,30 m-30,-26 l30,26 l-34,14`} stroke="#BFE4FF" strokeWidth={10} fill="none" strokeLinecap="round" />;
        })}
        {/* cloud towers boiling up over the sea */}
        {[1000, 1250, 1500, 1750].map((cx, i) => {
          const h = 160 + 300 * clamp(k * 1.4 - i * 0.15);
          return (
            <g key={cx}>
              <path d={`M${cx - 110},620 Q${cx - 120},${620 - h * 0.6} ${cx - 40},${620 - h} Q${cx + 40},${600 - h * 1.15} ${cx + 110},${620 - h * 0.8} Q${cx + 140},${620 - h * 0.3} ${cx + 110},620 Z`} fill="#C9D3E6" stroke={INK} strokeWidth={5} />
              {k > 0.6 && i % 2 === 0 && Math.sin(frame * 0.3 + i) > 0.9 && <path d={`M${cx},${640 - h * 0.5} l-20,80 l26,-10 l-24,90`} stroke="#FFF3A0" strokeWidth={6} fill="none" />}
            </g>
          );
        })}
        <Label x={1380} y={150} t="STORM" s={60} c="#FFFFFF" o={clamp(k * 2 - 0.5)} />
      </Frame>
    );
  }

  // ── the storm at sea ──
  if (v === 'shipstorm') {
    const pitch = Math.sin(t * 1.6) * 9;
    const hit = p.hit !== undefined ? clamp(1 - Math.abs(t - p.hit) * 2.5) : 0;
    const flash = Math.sin(t * 1.1 + 1) > 0.97 ? 1 : 0;
    return (
      <Frame frame={frame} bg="#05080F">
        <rect x={-200} y={0} width={2400} height={H} fill="#0A1020" />
        {flash > 0 && <rect x={-200} y={0} width={2400} height={H} fill="#DCE8FF" opacity={0.6} />}
        {Array.from({length: 80}, (_, i) => {
          const r = rnd(i + 3);
          const x = r() * 2200 - 100;
          const y = (r() * 1100 + t * 1200 * (0.6 + r())) % 1100;
          return <line key={i} x1={x} y1={y} x2={x - 20} y2={y + 50} stroke="#9FB8D8" strokeWidth={2} opacity={0.5} />;
        })}
        <Ship x={960} y={640 + Math.sin(t * 1.6) * 30} s={1.1} tilt={pitch} lights={0.9} />
        {/* waves */}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M-200,${700 + i * 70} ${Array.from({length: 12}, (_, k) => `q100,${-120 + i * 30 - (k % 3 === 1 ? 80 : 0)} 200,0`).join(' ')} L2200,1200 L-200,1200 Z`} transform={`translate(${-((t * (120 + i * 60)) % 400)},${Math.sin(t * 1.4 + i) * 20})`} fill={['#0E1A30', '#122240', '#16284A'][i]} stroke="#3A5A8A" strokeWidth={4} />
        ))}
        {hit > 0 && (
          <g>
            <path d="M400,900 Q600,200 900,420 Q760,600 1000,900 Z" fill="#DCEBFF" opacity={0.7 * hit} />
            <rect x={-200} y={0} width={2400} height={H} fill="#FFFFFF" opacity={0.25 * hit} />
          </g>
        )}
      </Frame>
    );
  }

  // ── adrift: a dark ship on a black sea ──
  if (v === 'shipdrift') {
    return (
      <Frame frame={frame} bg="#02040A">
        <NightSky frame={frame} seed={77} top="#01020A" bottom="#03050C" count={700} />
        <SeaSurface y={640} frame={frame} amp={4} />
        <Ship x={960} y={650 + Math.sin(t * 0.6) * 4} s={0.9} tilt={Math.sin(t * 0.5) * 1.5 + 3} lights={0.45} frost={p.frost ?? 0} />
      </Frame>
    );
  }

  // ── the rescue: the coast-guard ship sails (step 0); its searchlight finds the Amihan (step 1) ──
  if (v === 'rescue') {
    const step = p.step ?? 0;
    if (step === 0) {
      const x = 400 + t * 120;
      return (
        <Frame frame={frame} bg="#02040A">
          <NightSky frame={frame} seed={88} top="#01020A" bottom="#0A1028" count={420} />
          <g transform="translate(0,260)">
            <CityBlocks seed={33} base={360} color="#0E1430" frame={frame} lights={0.7} minH={60} maxH={220} />
          </g>
          <SeaSurface y={640} frame={frame} amp={5} line="#1E2A48" />
          <Ship x={x} y={660} s={0.6} white lights={1} />
          <path d={`M${x + 270},630 L${x + 1200},560 L${x + 1200},700 Z`} fill="#FFFFFF" opacity={0.12} />
        </Frame>
      );
    }
    const sweep = interpolate(t, [0.2, 2.2], [-0.5, 0.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    const flare = clamp((t - 2.6) / 1.4);
    return (
      <Frame frame={frame} bg="#02040A">
        <NightSky frame={frame} seed={99} top="#01020A" bottom="#03050C" count={700} />
        <SeaSurface y={620} frame={frame} amp={5} />
        <Ship x={1300} y={640} s={0.62} tilt={3} lights={0.45} frost={0.7} />
        <g transform="translate(260,650) scale(0.5)">
          <Ship x={0} y={0} white lights={1} />
        </g>
        <g style={{mixBlendMode: 'screen'}} transform={`rotate(${sweep * 57.3},420,560)`}>
          <path d="M420,560 L1900,470 L1900,650 Z" fill="#FFFFFF" opacity={0.3} />
        </g>
        {flare > 0 && (
          <g>
            <path d={`M1200,520 Q1180,${520 - 300 * flare} 1150,${520 - 380 * flare}`} stroke="#FF8A7A" strokeWidth={4} fill="none" opacity={0.6} />
            <circle cx={1150} cy={520 - 380 * flare} r={18} fill="#FF4A3A" />
            <circle cx={1150} cy={520 - 380 * flare} r={120} fill="#FF4A3A" opacity={0.18} />
          </g>
        )}
      </Frame>
    );
  }

  // ── ocean heat: the warm sea around the islands (step 0); a thin slice of sea = all the air (step 1) ──
  if (v === 'oceanheat') {
    const step = p.step ?? 0;
    const k = clamp(t / Math.max(2, dur - 0.5));
    if (step === 0)
      return (
        <Frame frame={frame}>
          <rect x={-200} y={0} width={2400} height={H} fill={`rgb(${30 + 20 * (1 - k)},${90},${150})`} />
          {/* the warm sea glow, the cold land creeping in from the north-west */}
          <circle cx={1120} cy={560} r={600} fill="#FF9A5A" opacity={0.22} />
          <path d={`M-200,0 L${700 + 200 * k},0 Q${500 + 160 * k},${260} -200,${380 + 220 * k} Z`} fill="#DCE8F4" stroke={INK} strokeWidth={5} />
          <Label x={260} y={140} t="ASIA · FROZEN" s={36} c="#FFFFFF" />
          <g transform="translate(860,140) scale(560,820)">
            {PH_PATHS.map((d, i) => (
              <path key={i} d={d} fill="#E9D7A8" stroke={INK} strokeWidth={0.004} />
            ))}
          </g>
          <Label x={1500} y={520} t="WARM SEA" s={48} c="#FFD27A" />
          <Label x={1160} y={960} t={`MANILA · DAY ${Math.round(1 + k * 19)} · ${Math.round(24 - k * 19)}°C`} s={40} />
        </Frame>
      );
    return (
      <Frame frame={frame}>
        <rect x={-200} y={0} width={2400} height={H} fill="#0B1230" />
        {/* left: the whole sky, a tall column */}
        <rect x={420} y={120} width={300} height={700} fill="#9FD8FF" opacity={0.35} stroke="#9FD8FF" strokeWidth={4} />
        <Label x={570} y={100} t="ALL THE AIR ABOVE" s={34} />
        <Label x={570} y={480} t="100 KM" s={40} c="#FFFFFF" />
        {/* right: a thin slice of sea */}
        <rect x={1200} y={760} width={300} height={60} fill="#1E6FB0" stroke="#7FC8F8" strokeWidth={4} />
        <Label x={1350} y={730} t="TOP 3 M OF SEA" s={34} />
        <Label x={960} y={500} t="=" s={140} c="#FFD27A" o={clamp(k * 3)} />
        <Label x={960} y={980} t="THE SAME AMOUNT OF HEAT" s={46} c="#FFD27A" o={clamp(k * 3 - 0.6)} />
        <rect x={-200} y={820} width={2400} height={300} fill="#12305A" />
      </Frame>
    );
  }

  // ── meteor scatter: a trail 100 km up reflects radio from Manila to the ship, for a moment ──
  if (v === 'meteor') {
    const m = clamp((t - 0.4) / 0.9);
    const trail = clamp(1 - (t - 1.3) / Math.max(1.2, dur - 1.8));
    const bounce = t > 1.3 && trail > 0.15;
    const A: [number, number] = [340, 800];
    const B: [number, number] = [1580, 800];
    const P: [number, number] = [960, 380];
    return (
      <Frame frame={frame}>
        <NightSky frame={frame} seed={21} top="#020410" bottom="#0B1230" count={300} />
        {/* the meteor */}
        <line x1={600} y1={80} x2={600 + 420 * m} y2={80 + 300 * m} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={m < 1 ? 1 : 0} />
        {m >= 1 && <path d="M760,200 L1100,420" stroke="#7FE8FF" strokeWidth={14} strokeLinecap="round" opacity={0.8 * trail} />}
        {m >= 1 && <path d="M760,200 L1100,420" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={trail} />}
        <Label x={1320} y={300} t="TRAIL · 100 KM UP" s={32} c="#7FE8FF" o={m >= 1 ? trail : 0} />
        {/* Earth's curve with both radios under it */}
        <path d="M-200,860 Q960,620 2120,860 L2120,1200 L-200,1200 Z" fill="#12305A" stroke="#7FB8E8" strokeWidth={4} />
        <Mast x={A[0]} y={A[1]} />
        <Label x={A[0]} y={A[1] + 70} t="MANILA" s={32} />
        <g transform={`translate(${B[0]},${B[1] - 6}) scale(0.16)`}>
          <Ship x={0} y={0} tilt={3} lights={0.5} />
        </g>
        <Label x={B[0]} y={B[1] + 70} t="THE AMIHAN · 750 KM" s={32} />
        {bounce && (
          <g opacity={trail}>
            <polyline points={`${A[0]},${A[1] - 70} ${P[0]},${P[1]} ${B[0]},${B[1] - 40}`} stroke="#FFD27A" strokeWidth={8} fill="none" strokeLinejoin="round" />
            <circle cx={P[0]} cy={P[1]} r={20} fill="#FFF3C0" />
          </g>
        )}
        {/* the straight path is blocked by the bulge of the Earth */}
        <path d={`M${A[0]},${A[1] - 70} L${B[0]},${B[1] - 40}`} stroke="#FF6A4A" strokeWidth={4} strokeDasharray="14 12" opacity={0.6} />
      </Frame>
    );
  }

  // ── why dawn: Earth ploughs forward along its orbit; the 6 a.m. side faces the dust ──
  if (v === 'dawn') {
    const k = clamp(t / Math.max(2, dur - 0.5));
    const ex = 1060;
    const ey = 560;
    return (
      <Frame frame={frame}>
        <NightSky frame={frame} seed={18} top="#020410" bottom="#0B1230" count={300} />
        {/* the Sun in its shell, far left (it is dark this year) */}
        <g transform="translate(150,560) scale(0.55)">
          <Shell cx={0} cy={0} r={120} turn={1} spin={frame * 0.004} seam={0.5} frame={frame} />
        </g>
        <path d="M150,560 L900,560" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={3} strokeDasharray="10 14" />
        {/* orbit and direction of travel (up the screen) */}
        <path d={`M${ex},1100 Q${ex - 30},560 ${ex},0`} stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={4} fill="none" />
        <path d={`M${ex + 420},520 l0,-160 m-26,30 l26,-30 l26,30`} stroke="#E9EEF6" strokeWidth={8} fill="none" />
        <Label x={ex + 420} y={570} t="EARTH MOVES THIS WAY" s={28} />
        {/* dust streaming down at Earth (Earth moving up through it) */}
        {Array.from({length: 60}, (_, i) => {
          const r = rnd(i + 5);
          const x = ex - 300 + r() * 600;
          const y = ((r() * 1100 + frame * 9) % 1100) - 40;
          const hitFront = y < ey - 150 && Math.abs(x - ex) < 170;
          return <line key={i} x1={x} y1={y} x2={x} y2={y - 22} stroke={hitFront ? '#FFD27A' : '#9FB8D8'} strokeWidth={3} opacity={0.7} />;
        })}
        <circle cx={ex} cy={ey} r={170} fill="#1A4A7A" stroke={INK} strokeWidth={6} />
        {/* night side away from the Sun, day side toward it: in this year both are dark, so mark local times instead */}
        <path d={`M${ex},${ey - 170} A170,170 0 0 1 ${ex},${ey + 170}`} fill="#0B1026" opacity={0.55} />
        <circle cx={ex} cy={ey - 170} r={22} fill="#FFD27A" opacity={0.5 + 0.5 * k} />
        <Label x={ex} y={ey - 210} t="6 AM · FACING FORWARD" s={34} c="#FFD27A" />
        <Label x={ex} y={ey + 230} t="6 PM · FACING BACK" s={30} c="#9FB8D8" />
        <Label x={ex - 260} y={ey + 10} t="NOON" s={26} c="#9FB8D8" a="end" />
        <Label x={ex + 200} y={ey + 10} t="MIDNIGHT" s={26} c="#9FB8D8" a="start" />
      </Frame>
    );
  }

  // ── the Perseids: Earth's orbit crosses a comet's dust river on 12 August ──
  if (v === 'perseids') {
    const k = clamp(t / Math.max(2, dur - 0.5));
    const ang = -Math.PI * 0.742 - 0.55 * (1 - k); // ends where the dust river crosses the orbit (≈ x 600, y 300)
    const ex = 960 + Math.cos(ang) * 520;
    const ey = 560 + Math.sin(ang) * 360;
    return (
      <Frame frame={frame}>
        <NightSky frame={frame} seed={26} top="#020410" bottom="#0B1230" count={300} />
        <ellipse cx={960} cy={560} rx={520} ry={360} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={4} />
        <g transform="translate(960,560) scale(0.5)">
          <Shell cx={0} cy={0} r={100} turn={1} spin={frame * 0.004} seam={0.5} frame={frame} />
        </g>
        {/* the comet's orbit and its dust river */}
        <path d="M200,-100 Q760,420 1500,1180" stroke="#C77DFF" strokeWidth={60} opacity={0.18} fill="none" />
        {Array.from({length: 90}, (_, i) => {
          const r = rnd(i + 11);
          const q = (r() + frame * 0.001) % 1;
          const x = 200 + (1300 * q) + (r() - 0.5) * 70;
          const y = -100 + 1280 * q * q * 0.6 + 1280 * q * 0.4 + (r() - 0.5) * 50;
          return <circle key={i} cx={x} cy={y} r={2.5} fill="#E8C8FF" opacity={0.7} />;
        })}
        <Label x={1500} y={160} t="DUST FROM COMET SWIFT–TUTTLE" s={30} c="#E8C8FF" />
        <circle cx={ex} cy={ey} r={30} fill="#1A4A7A" stroke="#9FD8FF" strokeWidth={4} />
        <Label x={ex - 40} y={ey - 50} t="EARTH" s={30} a="end" />
        <Label x={470} y={240} t="12 AUGUST" s={56} c="#FFD27A" o={clamp(k * 2 - 0.6)} />
      </Frame>
    );
  }

  // ── the bubble sextant: a spirit level instead of the missing horizon ──
  if (v === 'bubble') {
    const k = clamp(t / Math.max(2, dur - 0.5));
    const bubble = 1 - clamp(k * 1.6);
    return (
      <Frame frame={frame} bg="#03050C">
        <NightSky frame={frame} seed={57} top="#01020A" bottom="#03050C" count={600} />
        <circle cx={1420} cy={220} r={10} fill="#FFFFFF" />
        <circle cx={1420} cy={220} r={40} fill="#FFFFFF" opacity={0.2} />
        <Label x={1420} y={160} t="A STAR" s={30} />
        <Label x={960} y={1010} t="NO HORIZON TO MEASURE FROM" s={34} c="#FF8A7A" o={1 - clamp(k * 3 - 1)} />
        <g transform="translate(760,640) rotate(-12)">
          <path d="M0,-260 L320,180 A420,420 0 0 1 -300,240 Z" fill="none" stroke="#C9963A" strokeWidth={16} strokeLinejoin="round" />
          <path d="M0,-260 L60,250" stroke="#E8B860" strokeWidth={12} />
          <rect x={-180} y={-60} width={260} height={56} rx={14} fill="#3A3442" stroke={INK} strokeWidth={6} />
          {/* the taped-on spirit level */}
          <g transform="translate(90,40)">
            <rect x={0} y={0} width={180} height={48} rx={22} fill="#9FE0C8" stroke={INK} strokeWidth={6} />
            <path d="M80,0 L80,48 M100,0 L100,48" stroke={INK} strokeWidth={3} />
            <ellipse cx={90 + bubble * 60} cy={24} rx={18} ry={12} fill="#FFFFFF" />
            <path d="M-6,-6 L40,52 M150,-6 L196,52" stroke="#C9C3B8" strokeWidth={14} opacity={0.8} />
          </g>
        </g>
        <path d="M640,560 L1420,220" stroke="#FFD27A" strokeWidth={4} strokeDasharray="14 12" opacity={clamp(k * 2 - 0.6)} />
        <Label x={1060} y={1010} t="LEVEL BUBBLE = ARTIFICIAL HORIZON" s={34} c="#9FE0C8" o={clamp(k * 3 - 1.2)} />
      </Frame>
    );
  }

  // ── the drift map: planned route, the storm, the drift toward Luzon then north ──
  if (v === 'drift') {
    const to = (p.to as number) ?? 1;
    const k = clamp(t / Math.max(2, dur - 0.5)) * to;
    // map box: lon 118..136 E → x 120..1800 ; lat 8..22 N → y 1000..80
    const X = (lon: number) => 120 + ((lon - 118) / 18) * 1680;
    const Y = (lat: number) => 1000 - ((lat - 8) / 14) * 920;
    const pts: [number, number][] = [
      [132, 13],
      [131, 13.2],
      [130, 13.6],
      [129.3, 14.4],
      [128.6, 15.4],
      [128, 16.5],
      [127.17, 17.83],
    ];
    const route: [number, number][] = [
      [136, 12.9],
      [125, 12.6],
      [124.2, 12.55],
      [123.2, 13.0],
      [122.2, 13.6],
      [121.2, 14.4],
    ];
    const n = Math.max(1, Math.floor(k * (pts.length - 1)) + 1);
    return (
      <Frame frame={frame} bg="#0E2A44">
        <rect x={-200} y={0} width={2400} height={H} fill="#164A70" />
        {Array.from({length: 10}, (_, i) => (
          <line key={`v${i}`} x1={X(118 + i * 2)} y1={60} x2={X(118 + i * 2)} y2={1020} stroke="#2A6A90" strokeWidth={2} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={`h${i}`} x1={100} y1={Y(8 + i * 2)} x2={1820} y2={Y(8 + i * 2)} stroke="#2A6A90" strokeWidth={2} />
        ))}
        <g transform={`translate(${X(116.6)},${Y(21.5)}) scale(${X(127) - X(116.6)},${Y(5.5) - Y(21.5)})`}>
          {PH_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#E9D7A8" stroke={INK} strokeWidth={0.003} />
          ))}
        </g>
        <circle cx={X(121)} cy={Y(14.6)} r={12} fill="#C2464F" stroke={INK} strokeWidth={3} />
        <Label x={X(121) - 20} y={Y(14.6) + 50} t="MANILA" s={30} a="end" />
        <Label x={X(123.4)} y={Y(17.4)} t="LUZON" s={30} c="#E9D7A8" a="start" />
        <Label x={X(131)} y={Y(11)} t="PHILIPPINE SEA" s={34} c="#9FD0F0" />
        {/* the planned route in from the east */}
        <polyline points={route.map(([lo, la]) => `${X(lo)},${Y(la)}`).join(' ')} stroke="#E9EEF6" strokeWidth={5} strokeDasharray="16 14" opacity={0.6} fill="none" />
        <Label x={X(135.5)} y={Y(12.9) + 46} t="PLANNED ROUTE" s={26} c="#E9EEF6" a="end" />
        {/* the storm */}
        <path d={`M${X(132) - 18},${Y(13) - 18} l36,36 m0,-36 l-36,36`} stroke="#FF6A4A" strokeWidth={8} />
        <Label x={X(132)} y={Y(13) + 60} t="STORM · DAY 4" s={28} c="#FF8A7A" />
        {/* the drift */}
        <polyline points={pts.slice(0, n).map(([lo, la]) => `${X(lo)},${Y(la)}`).join(' ')} stroke="#FFD27A" strokeWidth={6} strokeDasharray="4 12" strokeLinecap="round" fill="none" />
        {/* current arrows */}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${X(134 - i * 2.2)},${Y(11.4)} l-90,0 m20,-14 l-20,14 l20,14`} stroke="#7FC8F8" strokeWidth={5} fill="none" opacity={0.6} />
        ))}
        <path d={`M${X(126)},${Y(14.6)} q-30,-60 -10,-130 m-16,24 l16,-24 l12,26`} stroke="#7FC8F8" strokeWidth={5} fill="none" opacity={0.6} />
        <Label x={X(131.6)} y={Y(10.6)} t="CURRENT" s={26} c="#7FC8F8" />
        {k > 0.98 && (
          <g>
            <circle cx={X(127.17)} cy={Y(17.83)} r={24} fill="none" stroke="#FFD27A" strokeWidth={6} />
            <Label x={X(127.17) + 40} y={Y(17.83) - 30} t="?" s={60} c="#FFD27A" a="start" />
          </g>
        )}
      </Frame>
    );
  }

  // ── the radio close-up: hiss, and pings ──
  if (v === 'radio') {
    const pings: number[] = p.pings ?? [];
    const ping = Math.max(0, ...pings.map((s) => clamp(1 - Math.abs(t - s) * 3)));
    return (
      <Frame frame={frame} bg="#14100C">
        <rect x={0} y={0} width={W} height={H} fill="#241A12" />
        <circle cx={900} cy={540} r={700} fill="#FFB547" opacity={0.08 + ping * 0.12} />
        <g transform="translate(420,1000) scale(3.4)">
          <RadioSet x={0} y={0} on meter={0.3} ping={ping} frame={frame} />
        </g>
        {ping > 0.2 && <Label x={1500} y={300} t="· — ·" s={120} c="#7CFF9A" o={ping} />}
      </Frame>
    );
  }

  // ── Lola's notebook: meteor counts (mode 'counts') or the pings coming together (mode 'pings') ──
  if (v === 'logbook') {
    const counts = p.mode === 'counts';
    const k = clamp(t / Math.max(2, dur - 0.6));
    const lines = counts
      ? ['11 PM   ||||| |', ' 2 AM   ||||| ||||| |', ' 4 AM   ||||| ||||| |||||', ' 6 AM   ||||| ||||| ||||| ||||']
      : ['R . . OS . . AMI . . .', 'ROSA · AMIHAN', '17 50 N · 127 10 E', 'RUDDER GONE', 'ALL SAFE'];
    const from = (p.from as number) ?? 0;
    const to = (p.to as number) ?? 1;
    const prog = counts ? k : from + (to - from) * k;
    return (
      <Frame frame={frame} bg="#1A1410">
        <rect x={0} y={0} width={W} height={H} fill="#2A1E14" />
        <g transform="translate(360,90) rotate(-2)">
          <rect x={0} y={0} width={1200} height={900} fill="#F4ECD8" stroke={INK} strokeWidth={6} />
          {Array.from({length: 14}, (_, i) => (
            <line key={i} x1={40} y1={110 + i * 56} x2={1160} y2={110 + i * 56} stroke="#B8C8E0" strokeWidth={2} />
          ))}
          <line x1={140} y1={20} x2={140} y2={880} stroke="#E8A0A0" strokeWidth={3} />
          <text x={170} y={80} fontFamily="'Caveat', 'Comic Neue', cursive" fontWeight={700} fontSize={48} fill="#3A3442">
            {counts ? 'Shooting stars · roof' : 'Ch 6 · Day 59'}
          </text>
          {lines.map((l, i) => {
            const show = counts ? clamp(prog * lines.length - i) : clamp(prog * lines.length - i);
            if (show <= 0) return null;
            const txt = l.slice(0, Math.ceil(l.length * show));
            return (
              <text key={i} x={170} y={190 + i * 130} fontFamily="'Courier Prime', 'Courier New', monospace" fontWeight={700} letterSpacing={counts ? 0 : 10} fontSize={counts ? 56 : 64} fill={i === lines.length - 1 && !counts ? '#C2464F' : '#1F2A44'}>
                {txt}
              </text>
            );
          })}
        </g>
      </Frame>
    );
  }

  return (
    <Frame frame={frame}>
      <Label x={960} y={540} t={`[sea ${v}]`} />
    </Frame>
  );
};

/** Meteors for other scenes that want them. */
export {Meteors};
