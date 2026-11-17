import React, {useMemo} from 'react';
import {Stars} from '../../fx/sky';
import {INK} from '../sun/stage';

/** Shared pieces for File 002 (Manila and the sea). */
export const rnd = (seed: number) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

/** A night sky that covers the camera's whole travel (parallax-safe), with a soft gradient and stars. */
export const NightSky: React.FC<{frame: number; seed?: number; top?: string; bottom?: string; count?: number; warm?: boolean}> = ({frame, seed = 11, top = '#01030C', bottom = '#16224A', count = 520, warm}) => {
  const id = `ns${seed}${warm ? 'w' : ''}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={-900} y={-600} width={3720} height={2200} fill={`url(#${id})`} />
      <g transform="translate(-700,-400)">
        <Stars frame={frame} count={count} w={3300} h={1500} seed={seed} maxR={2.2} />
      </g>
    </g>
  );
};

/**
 * Shooting stars. `rate` = meteors per second of screen time. Each is a short bright streak with a fading tail;
 * Perseids (radiant set) all point away from one spot in the sky, as real shower meteors do.
 */
export const Meteors: React.FC<{frame: number; rate: number; seed?: number; radiant?: [number, number]; area?: [number, number, number, number]}> = ({frame, rate, seed = 5, radiant, area = [-200, -100, 2100, 620]}) => {
  const list = useMemo(() => {
    const r = rnd(seed);
    const n = Math.max(1, Math.round(rate * 24));
    return Array.from({length: n}, () => ({off: r() * 24, x: area[0] + r() * (area[2] - area[0]), y: area[1] + r() * (area[3] - area[1]), ang: 0.35 + r() * 0.5, len: 120 + r() * 220, life: 0.35 + r() * 0.45, w: 2 + r() * 2.5}));
  }, [rate, seed, area]);
  const t = frame / 30;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {list.map((m, i) => {
        const local = (t + m.off) % 24;
        // each meteor fires once per 24 s cycle; density comes from how many there are
        const k = local / m.life;
        if (k < 0 || k > 1) return null;
        let ang = m.ang;
        if (radiant) ang = Math.atan2(m.y - radiant[1], m.x - radiant[0]);
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        const head = m.len * k;
        const hx = m.x + dx * head;
        const hy = m.y + dy * head;
        const tail = Math.min(head, m.len * 0.7);
        const fade = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
        return (
          <g key={i} opacity={fade}>
            <line x1={hx - dx * tail} y1={hy - dy * tail} x2={hx} y2={hy} stroke="#BFE4FF" strokeWidth={m.w} strokeLinecap="round" opacity={0.35} />
            <line x1={hx - dx * tail * 0.5} y1={hy - dy * tail * 0.5} x2={hx} y2={hy} stroke="#FFFFFF" strokeWidth={m.w * 0.8} strokeLinecap="round" />
            <circle cx={hx} cy={hy} r={m.w * 1.6} fill="#FFFFFF" />
          </g>
        );
      })}
    </g>
  );
};

/** An analogue wall clock reading "h:mm". */
export const Clock: React.FC<{x: number; y: number; r?: number; time?: string; face?: string}> = ({x, y, r = 46, time = '6:00', face = '#F4EFE6'}) => {
  const [h, m] = time.split(':').map(Number);
  const ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
  const ha = (((h % 12) + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} fill={face} stroke={INK} strokeWidth={5} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * r * 0.78} y1={Math.sin(a) * r * 0.78} x2={Math.cos(a) * r * 0.9} y2={Math.sin(a) * r * 0.9} stroke={INK} strokeWidth={3} />;
      })}
      <line x1={0} y1={0} x2={Math.cos(ha) * r * 0.5} y2={Math.sin(ha) * r * 0.5} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.cos(ma) * r * 0.78} y2={Math.sin(ma) * r * 0.78} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <circle r={4} fill={INK} />
    </g>
  );
};

/**
 * Lola's radio: an old coast-guard VHF/HF set (two stacked boxes), a round signal meter, an amber dial, the Morse key
 * and the hand mic on its hook. `on` lights it; `meter` 0..1 sets the needle; `ping` 0..1 flashes the receive light.
 */
export const RadioSet: React.FC<{x: number; y: number; on: boolean; meter?: number; ping?: number; frame: number; mic?: boolean; s?: number}> = ({x, y, on, meter = 0.5, ping = 0, frame, mic = true, s = 1}) => {
  const jitter = on ? Math.sin(frame * 0.9) * 0.03 + Math.sin(frame * 2.3) * 0.02 : 0;
  const needle = on ? Math.min(1, Math.max(0, meter * 0.6 + jitter + ping * 0.7)) : 0;
  const na = -Math.PI * 0.85 + needle * Math.PI * 0.7;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* lower box: the HF set */}
      <rect x={0} y={-120} width={240} height={120} rx={8} fill="#5E5A52" stroke={INK} strokeWidth={5} />
      <rect x={16} y={-104} width={130} height={46} rx={4} fill={on ? '#FFB547' : '#3A3630'} stroke={INK} strokeWidth={3} />
      {on && <rect x={16} y={-104} width={130} height={46} rx={4} fill="#FFE2A0" opacity={0.25} />}
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={26 + i * 14} y1={-100} x2={26 + i * 14} y2={-90 - (i % 2) * 6} stroke="#3A2A10" strokeWidth={2} />
      ))}
      <circle cx={190} cy={-80} r={24} fill="#2A2A2A" stroke={INK} strokeWidth={4} />
      <line x1={190} y1={-80} x2={190 + Math.cos(frame * 0.0) * 16} y2={-96} stroke="#C9CED6" strokeWidth={4} />
      {[40, 80, 120].map((cx) => (
        <circle key={cx} cx={cx} cy={-26} r={9} fill="#2A2A2A" stroke={INK} strokeWidth={3} />
      ))}
      <circle cx={210} cy={-26} r={7} fill={on ? (ping > 0.2 ? '#7CFF9A' : '#FF5A4A') : '#4A2A2A'} />
      {/* upper box: VHF set with the round signal meter */}
      <rect x={20} y={-230} width={200} height={110} rx={8} fill="#6A665E" stroke={INK} strokeWidth={5} />
      <circle cx={80} cy={-172} r={40} fill={on ? '#F4E8C8' : '#8A8270'} stroke={INK} strokeWidth={4} />
      <path d="M50,-180 A34,34 0 0 1 110,-180" stroke="#C2464F" strokeWidth={3} fill="none" />
      <line x1={80} y1={-158} x2={80 + Math.cos(na) * 34} y2={-158 + Math.sin(na) * 34} stroke={INK} strokeWidth={3} />
      <text x={170} y={-160} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={26} fill={on ? '#7CFF9A' : '#2A3A2A'}>
        CH 06
      </text>
      {/* the Morse key on the desk in front */}
      <g transform="translate(270,-8)">
        <rect x={0} y={-10} width={90} height={14} rx={3} fill="#2A2A2A" stroke={INK} strokeWidth={3} />
        <path d="M10,-14 L80,-26" stroke="#C9963A" strokeWidth={8} strokeLinecap="round" />
        <circle cx={82} cy={-27} r={9} fill="#1A1A1A" stroke={INK} strokeWidth={3} />
      </g>
      {/* mic hook */}
      {mic && (
        <g transform="translate(232,-150)">
          <rect x={0} y={-6} width={14} height={30} rx={3} fill="#2A2A2A" />
        </g>
      )}
      {on && <circle cx={120} cy={-150} r={150} fill="#FFB547" opacity={0.08 + ping * 0.1} style={{mixBlendMode: 'screen'}} />}
    </g>
  );
};

/** A string of warm bulbs. */
export const StringLights: React.FC<{x0: number; x1: number; y: number; sag?: number; n?: number; frame: number; dim?: number}> = ({x0, x1, y, sag = 40, n = 14, frame, dim = 1}) => (
  <g>
    <path d={`M${x0},${y} Q${(x0 + x1) / 2},${y + sag * 2} ${x1},${y}`} stroke="#2A2230" strokeWidth={3} fill="none" />
    {Array.from({length: n}, (_, i) => {
      const k = (i + 0.5) / n;
      const px = x0 + (x1 - x0) * k;
      const py = y + sag * 2 * 2 * k * (1 - k);
      const tw = 0.85 + 0.15 * Math.sin(frame * 0.1 + i);
      return (
        <g key={i}>
          <circle cx={px} cy={py + 8} r={18} fill="#FFD27A" opacity={0.18 * dim * tw} style={{mixBlendMode: 'screen'}} />
          <circle cx={px} cy={py + 8} r={6} fill={['#FFD27A', '#FF9A6A', '#9FE0FF', '#B8F28A'][i % 4]} opacity={0.6 + 0.4 * dim} />
        </g>
      );
    })}
  </g>
);

/** The Philippines in outline (simplified, recognisable): Luzon, Mindoro, the Visayas, Mindanao. Unit box 0..1. */
export const PH_PATHS = [
  // Luzon
  'M0.42,0.04 L0.5,0.03 L0.55,0.09 L0.56,0.17 L0.6,0.22 L0.58,0.3 L0.62,0.34 L0.66,0.33 L0.7,0.38 L0.64,0.42 L0.58,0.4 L0.54,0.44 L0.5,0.42 L0.47,0.36 L0.44,0.3 L0.4,0.27 L0.42,0.2 L0.39,0.12 Z',
  // Mindoro
  'M0.4,0.44 L0.45,0.43 L0.47,0.49 L0.43,0.52 L0.39,0.49 Z',
  // Visayas
  'M0.52,0.5 L0.6,0.48 L0.66,0.52 L0.62,0.58 L0.55,0.6 L0.5,0.56 Z',
  'M0.68,0.47 L0.74,0.45 L0.76,0.53 L0.7,0.58 L0.66,0.54 Z',
  // Palawan
  'M0.18,0.55 L0.22,0.53 L0.34,0.66 L0.31,0.69 Z',
  // Mindanao
  'M0.56,0.68 L0.66,0.64 L0.78,0.66 L0.82,0.74 L0.76,0.84 L0.66,0.86 L0.6,0.8 L0.54,0.76 Z',
];
